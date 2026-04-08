import {
  FIXED_ROUTE_POOL,
  INVENTORY_SLOTS,
  ITEM_DEFS,
  SEARCH_ACTIONS,
  RUN_SAVE_KEY,
  STANDARD_BANKROLL,
  STARTING_VAULT,
  STORAGE_KEY,
  TABLE_ORDER,
  TABLES,
  getHeatBand,
  getItemDef,
  getOpponentDef,
  getShopStock,
  getTableDef,
} from "./data.js";
import {
  compareHands,
  createDeck,
  drawCard,
  evaluateBestHand,
  makeDeterministicRng,
  shuffleDeck,
} from "./poker.js";
import { chooseAiAction, classifyRead } from "./ai.js";
import {
  formatMessage,
  getLocalizedItem,
  getLocalizedOpponent,
  getLocalizedRoute,
  getLocalizedTable,
  getPreferredLanguage,
  localizeHandName,
  localizeReadDescriptor,
  localizeReadLabel,
  normalizeLanguage,
} from "./i18n.js";

const TABLE_ACTION_DELAY_MS = typeof window === "undefined" ? 0 : 1120;
const TABLE_REVEAL_DELAY_MS = typeof window === "undefined" ? 0 : 1620;
const PERSISTENT_SCHEMA_VERSION = 20260330;

export function createGame() {
  const persistentState = loadPersistentState();
  const savedRunSnapshot = loadSavedRunSnapshot();
  const state = {
    mode: "menu",
    persistent: persistentState,
    run: null,
    savedRunAvailable: Boolean(savedRunSnapshot),
    savedRunMeta: savedRunSnapshot ? summarizeSavedRun(savedRunSnapshot) : null,
    toasts: [],
    backgroundTime: 0,
    latestSummary: null,
    handoffBeat: null,
    tableBeat: null,
  };

  function currentLanguage() {
    return normalizeLanguage(state.persistent.language);
  }

  function msg(key, params = {}) {
    return formatMessage(currentLanguage(), key, params);
  }

  function tableName(tableIdOrDef) {
    const table =
      typeof tableIdOrDef === "string" ? getTableDef(tableIdOrDef) : tableIdOrDef;
    if (!table) {
      return "";
    }
    return getLocalizedTable(table.id, currentLanguage())?.name ?? table.name;
  }

  function itemName(itemId) {
    const item = getItemDef(itemId);
    if (!item) {
      return "";
    }
    return getLocalizedItem(itemId, currentLanguage())?.name ?? item.name;
  }

  function routeName(route) {
    if (!route) {
      return "";
    }
    return getLocalizedRoute(route.id, currentLanguage())?.name ?? route.name;
  }

  function actorName(participant) {
    if (!participant) {
      return "";
    }
    if (participant.id === "player") {
      return currentLanguage() === "zh" ? "你" : "You";
    }
    return (
      getLocalizedOpponent(participant.archetypeId ?? participant.id, currentLanguage())?.name ??
      participant.name
    );
  }

  function prettyCard(card) {
    if (!card) {
      return "";
    }
    const rank = {
      11: "J",
      12: "Q",
      13: "K",
      14: "A",
    }[card.rank] ?? `${card.rank}`;
    const suit = {
      S: "♠",
      H: "♥",
      C: "♣",
      D: "♦",
    }[card.suit] ?? card.suit;
    return `${rank}${suit}`;
  }

  function prettyCards(cards = []) {
    return cards.map((card) => prettyCard(card)).join(currentLanguage() === "zh" ? "、" : ", ");
  }

  function notify(text) {
    state.toasts.unshift({
      id: `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text,
      ttl: 3,
    });
    state.toasts = state.toasts.slice(0, 4);
  }

  function savePersistent() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.persistent));
    } catch (error) {
      console.warn("Failed to save progress", error);
    }
  }

  function saveRunSnapshot() {
    if (!state.run || (state.mode !== "search" && state.mode !== "table")) {
      clearRunSnapshot();
      return;
    }
    try {
      const snapshot = {
        mode: state.mode,
        run: JSON.parse(JSON.stringify(state.run)),
      };
      localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(snapshot));
      state.savedRunAvailable = true;
      state.savedRunMeta = summarizeSavedRun(snapshot);
    } catch (error) {
      console.warn("Failed to save run snapshot", error);
    }
  }

  function clearRunSnapshot() {
    try {
      localStorage.removeItem(RUN_SAVE_KEY);
    } catch (error) {
      console.warn("Failed to clear run snapshot", error);
    }
    state.savedRunAvailable = false;
    state.savedRunMeta = null;
  }

  function clearTableBeat() {
    state.tableBeat = null;
  }

  function runScheduledTableBeat(type) {
    if (type === "auto") {
      progressTable();
      return;
    }
    if (type === "next-hand") {
      startPendingHand();
      return;
    }
    if (type === "finish-hand") {
      finalizePendingHand();
    }
  }

  function scheduleTableBeat(type, delayMs) {
    if (delayMs <= 0) {
      runScheduledTableBeat(type);
      return;
    }
    state.tableBeat = {
      type,
      remainingMs: delayMs,
    };
  }

  function currentTable() {
    return state.run?.currentTable ?? null;
  }

  function scheduleAutoProgress(delayMs = TABLE_ACTION_DELAY_MS) {
    const table = currentTable();
    if (!table || state.mode !== "table") {
      return;
    }
    if (!table.currentActorId || table.currentActorId !== "player") {
      scheduleTableBeat("auto", delayMs);
    }
  }

  function startPendingHand() {
    const table = currentTable();
    if (!table || !table.pendingNextHand || state.mode !== "table") {
      return;
    }
    table.pendingNextHand = false;
    table.handNumber += 1;
    startHand(table);
    scheduleAutoProgress(TABLE_ACTION_DELAY_MS);
  }

  function finalizePendingHand() {
    const table = currentTable();
    if (!table || !table.pendingConclusion || state.mode !== "table") {
      return;
    }
    table.pendingConclusion = false;
    concludeTable(table);
  }

  function rememberLastAction(participant, kind) {
    participant.lastAction = kind === "raise" ? "bet" : kind;
  }

  function addCommittedChips(table, participant, amount) {
    if (!amount) {
      return;
    }
    participant.stack -= amount;
    participant.currentBet += amount;
    participant.handContribution += amount;
    table.pot += amount;
  }

  function buildRevealSummary(table, contenders = []) {
    const contenderMap = new Map(contenders.map((entry) => [entry.player.id, entry]));
    const playerEntry = contenderMap.get("player");
    return {
      board: prettyCards(table.community),
      river: table.community[4] ? prettyCard(table.community[4]) : null,
      playerCards: prettyCards(table.players[0].holeCards),
      playerHandName: playerEntry
        ? localizeHandName(playerEntry.hand.name, currentLanguage())
        : null,
      playerBestFive: playerEntry ? prettyCards(playerEntry.hand.cards) : null,
      opponentBreakdown: table.players
        .filter((participant) => participant.id !== "player" && !participant.folded)
        .map((participant) => {
          const contender = contenderMap.get(participant.id);
          return {
            id: participant.id,
            name: actorName(participant),
            cards: prettyCards(participant.holeCards),
            handName: contender
              ? localizeHandName(contender.hand.name, currentLanguage())
              : null,
            bestFive: contender ? prettyCards(contender.hand.cards) : null,
          };
        }),
    };
  }

  function buildPotLayers(table) {
    const levels = Array.from(
      new Set(
        table.players
          .map((participant) => participant.handContribution)
          .filter((amount) => amount > 0),
      ),
    ).sort((a, b) => a - b);

    if (!levels.length && table.pot > 0) {
      return [
        {
          amount: table.pot,
          eligibleIds: alivePlayers(table).map((participant) => participant.id),
        },
      ];
    }

    const pots = [];
    let previousLevel = 0;
    for (const level of levels) {
      const participants = table.players.filter(
        (participant) => participant.handContribution >= level,
      );
      const amount = (level - previousLevel) * participants.length;
      if (amount > 0) {
        pots.push({
          amount,
          eligibleIds: participants
            .filter((participant) => !participant.folded)
            .map((participant) => participant.id),
        });
      }
      previousLevel = level;
    }
    return pots;
  }

  function startRun() {
    if (state.run) {
      return;
    }
    clearTableBeat();
    if (state.persistent.vault < 120) {
      state.persistent = buildDefaultPersistentState(state.persistent.language);
      savePersistent();
      clearRunSnapshot();
    }
    const bankroll = Math.min(STANDARD_BANKROLL, state.persistent.vault);
    if (bankroll < 120) {
      notify(msg("vaultTooLight"));
      return;
    }
    state.persistent.vault -= bankroll;
    savePersistent();
    state.run = createRun(bankroll);
    syncRouteIntel(state.run);
    state.mode = "search";
    state.handoffBeat = null;
    saveRunSnapshot();
    notify(msg("playerBrought", { bankroll }));
  }

  function loadRun() {
    if (state.run) {
      return;
    }
    clearTableBeat();
    const snapshot = loadSavedRunSnapshot();
    if (!snapshot?.run) {
      clearRunSnapshot();
      notify(msg("noSavedRun"));
      return;
    }
    state.run = snapshot.run;
    syncRouteIntel(state.run);
    state.mode = snapshot.mode === "table" ? "table" : "search";
    state.latestSummary = null;
    state.handoffBeat = null;
    state.savedRunAvailable = true;
    state.savedRunMeta = summarizeSavedRun(snapshot);
    notify(msg("loadedRun"));
  }

  function resetProgress() {
    clearTableBeat();
    state.run = null;
    state.mode = "menu";
    state.latestSummary = null;
    state.handoffBeat = null;
    state.persistent = {
      ...buildDefaultPersistentState(state.persistent.language),
    };
    savePersistent();
    clearRunSnapshot();
    notify(msg("prototypeReset"));
  }

  function advanceTime(ms) {
    const dt = ms / 1000;
    let changed = false;
    state.backgroundTime += dt;
    const nextToasts = state.toasts
      .map((toast) => ({ ...toast, ttl: toast.ttl - dt }))
      .filter((toast) => toast.ttl > 0);
    if (nextToasts.length !== state.toasts.length || nextToasts.some((toast, index) => toast.ttl !== state.toasts[index]?.ttl)) {
      changed = true;
    }
    state.toasts = nextToasts;
    if (state.handoffBeat) {
      state.handoffBeat = {
        ...state.handoffBeat,
        ttl: state.handoffBeat.ttl - dt,
      };
      changed = true;
      if (state.handoffBeat.ttl <= 0) {
        state.handoffBeat = null;
      }
    }
    if (state.tableBeat) {
      state.tableBeat = {
        ...state.tableBeat,
        remainingMs: state.tableBeat.remainingMs - ms,
      };
      if (state.tableBeat.remainingMs <= 0) {
        const nextBeat = state.tableBeat.type;
        state.tableBeat = null;
        runScheduledTableBeat(nextBeat);
      }
      changed = true;
    }
    return changed;
  }

  function dispatch(action, payload = {}) {
    if (action === "start-run") {
      startRun();
      return;
    }
    if (action === "load-run") {
      loadRun();
      return;
    }
    if (action === "reset-progress") {
      resetProgress();
      return;
    }
    if (action === "return-to-menu") {
      clearTableBeat();
      state.run = null;
      state.mode = "menu";
      clearRunSnapshot();
      return;
    }
    if (action === "set-language") {
      state.persistent.language = normalizeLanguage(payload.language);
      savePersistent();
      return;
    }

    if (!state.run) {
      clearTableBeat();
      return;
    }

    switch (action) {
      case "enter-floor":
        enterFloor();
        break;
      case "stash-cash":
        stashCash(payload.amount);
        break;
      case "gather-intel":
        gatherIntel(payload.tableId, payload.layer);
        break;
      case "buy-item":
        buyItem(payload.itemId);
        break;
      case "sell-all-valuables":
        sellAllValuables();
        break;
      case "sell-item":
        sellInventoryItem(payload.instanceId);
        break;
      case "reduce-heat":
        reduceHeat();
        break;
      case "reserve-fixed-route":
        reserveFixedRoute();
        break;
      case "use-search-item":
        useSearchItem(payload.instanceId, payload.intent, payload.tableId);
        break;
      case "enter-table":
        enterTable(payload.tableId, payload.collateralId ?? null);
        break;
      case "extract-general":
        attemptExtraction("general");
        break;
      case "extract-fixed":
        attemptExtraction("fixed");
        break;
      case "extract-dropbag-cash":
        attemptExtraction("dropbag-cash");
        break;
      case "extract-dropbag-valuables":
        attemptExtraction("dropbag-valuables");
        break;
      case "player-fold":
      case "player-check":
      case "player-call":
      case "player-raise":
      case "player-all-in":
        takePlayerTableAction(action.replace("player-", ""));
        break;
      case "use-table-item":
        useTableItem(payload.instanceId, payload.targetId ?? null);
        break;
      case "continue-table":
        continueTable();
        break;
      default:
        break;
    }

    if (state.run) {
      syncRouteIntel(state.run);
    }

    if (state.run && state.mode === "search") {
      maybeFailRun("The room has gone dry before you found a way out.");
    }

    saveRunSnapshot();
  }

  function stashCash(amount) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.floorEntered) {
      return;
    }
    if (run.phase.stashUsed) {
      notify(msg("stashAlreadyUsed"));
      return;
    }
    if (run.actionPoints <= 0) {
      notify(msg("noSearchActionPoints"));
      return;
    }
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (safeAmount <= 0 || safeAmount > run.cashOnHand) {
      notify(msg("stashInvalidAmount"));
      return;
    }
    run.cashOnHand -= safeAmount;
    run.stashedCash += safeAmount;
    run.phase.stashUsed = true;
    run.actionPoints -= 1;
    pushRunLog(run, msg("stashedLog", { amount: safeAmount }));
    notify(msg("stashedNotify", { amount: safeAmount }));
  }

  function gatherIntel(tableId, layer) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.actionPoints <= 0) {
      notify(msg("noActionPoints"));
      return;
    }
    const intel = run.intel[tableId];
    if (!intel || intel[layer]) {
      notify(msg("intelKnown"));
      return;
    }
    intel[layer] = true;
    run.actionPoints -= 1;
    pushRunLog(run, msg("learnedIntelLog", { layer, table: tableName(tableId) }));
    notify(msg("learnedIntelNotify", { table: tableName(tableId) }));
  }

  function buyItem(itemId) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.actionPoints <= 0) {
      notify(msg("noActionPoints"));
      return;
    }
    const itemDef = getItemDef(itemId);
    if (!itemDef || itemDef.kind !== "usable") {
      return;
    }
    if (!run.shopStock.includes(itemId)) {
      notify(msg("shelfItemMissing"));
      return;
    }
    if (run.cashOnHand < itemDef.buy) {
      notify(msg("notEnoughCash"));
      return;
    }
    if (inventorySlotsUsed(run.inventory) + itemDef.slots > INVENTORY_SLOTS) {
      notify(msg("noInventorySpace"));
      return;
    }
    run.cashOnHand -= itemDef.buy;
    run.inventory.push(createInventoryItem(itemId));
    run.actionPoints -= 1;
    pushRunLog(run, msg("boughtItemLog", { item: itemName(itemId), price: itemDef.buy }));
    notify(msg("boughtItemNotify", { item: itemName(itemId) }));
  }

  function sellAllValuables() {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.actionPoints <= 0) {
      notify(msg("noActionPoints"));
      return;
    }
    const valuables = run.inventory.filter((item) => getItemDef(item.itemId).kind === "valuable");
    if (valuables.length === 0) {
      notify(msg("noValuablesToSell"));
      return;
    }
    const total = valuables.reduce((sum, item) => sum + getItemDef(item.itemId).value, 0);
    run.inventory = run.inventory.filter((item) => getItemDef(item.itemId).kind !== "valuable");
    run.cashOnHand += total;
    run.actionPoints -= 1;
    pushRunLog(run, msg("soldValuablesLog", { count: valuables.length, total }));
    notify(msg("soldValuablesNotify", { count: valuables.length, total }));
  }

  function sellInventoryItem(instanceId) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.actionPoints <= 0) {
      notify(msg("noActionPoints"));
      return;
    }
    const item = run.inventory.find((entry) => entry.id === instanceId);
    if (!item) {
      return;
    }
    const itemDef = getItemDef(item.itemId);
    const amount =
      itemDef.kind === "valuable"
        ? itemDef.value
        : itemDef.sell ?? Math.max(0, Math.floor(itemDef.buy * 0.5));
    if (amount <= 0) {
      notify(msg("itemCannotBeSold"));
      return;
    }
    removeInventoryItem(run, instanceId);
    run.cashOnHand += amount;
    run.actionPoints -= 1;
    pushRunLog(run, msg("soldItemLog", { item: itemName(item.itemId), amount }));
    notify(msg("soldItemNotify", { item: itemName(item.itemId), amount }));
  }

  function reduceHeat() {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (run.phase.heatReduced) {
      notify(msg("heatReducedAlready"));
      return;
    }
    if (run.actionPoints <= 0 || run.cashOnHand < 30 || run.heat <= 0) {
      notify(msg("heatReductionUnavailable"));
      return;
    }
    run.cashOnHand -= 30;
    run.heat = Math.max(0, run.heat - 1);
    run.phase.heatReduced = true;
    run.actionPoints -= 1;
    pushRunLog(run, msg("reduceHeatLog"));
    notify(msg("reduceHeatNotify"));
  }

  function reserveFixedRoute() {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    if (!run.routeIntel.fixedWhisper) {
      notify(msg("noFixedRouteLead"));
      return;
    }
    const route = run.fixedRouteOffer;
    if (!route) {
      notify(msg("noFixedRouteOffer"));
      return;
    }
    if (run.actionPoints <= 0 || run.cashOnHand < route.reserveCost) {
      notify(msg("cannotReserveRoute"));
      return;
    }
    run.cashOnHand -= route.reserveCost;
    run.actionPoints -= 1;
    run.fixedRouteReservation = {
      ...route,
      expiresAfterSearch: run.searchIndex + 1,
    };
    pushRunLog(run, msg("reservedRouteLog", { route: routeName(route) }));
    notify(msg("reservedRouteNotify", { route: routeName(route) }));
  }

  function useSearchItem(instanceId, intent, tableId) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    const inventoryItem = run.inventory.find((item) => item.id === instanceId);
    if (!inventoryItem) {
      return;
    }
    const itemDef = getItemDef(inventoryItem.itemId);
    if (itemDef.phase !== "search" || run.actionPoints <= 0) {
      return;
    }

    if (inventoryItem.itemId === "steadying-drink") {
      if (run.phase.heatReduced || run.heat <= 0) {
        notify(msg("noNeedSteadyingDrink"));
        return;
      }
      run.heat = Math.max(0, run.heat - 1);
      run.phase.heatReduced = true;
      run.actionPoints -= 1;
      removeInventoryItem(run, inventoryItem.id);
      pushRunLog(run, msg("steadyingDrinkLog"));
      notify(msg("steadyingDrinkNotify"));
      return;
    }

    if (inventoryItem.itemId === "disposable-phone") {
      if (intent === "refresh-route") {
        run.routeIntel.fixedWhisper = true;
        run.fixedRouteOffer = rotateFixedRoute(run.fixedRouteOffer);
        run.actionPoints -= 1;
        removeInventoryItem(run, inventoryItem.id);
        pushRunLog(run, msg("phoneNewRouteLog", { route: routeName(run.fixedRouteOffer) }));
        notify(msg("phoneNewRouteNotify", { route: routeName(run.fixedRouteOffer) }));
        return;
      }
      if (!tableId) {
        notify(msg("phonePickTable"));
        return;
      }
      run.intel[tableId] = {
        rule: true,
        opponents: true,
        reward: true,
      };
      run.actionPoints -= 1;
      removeInventoryItem(run, inventoryItem.id);
      pushRunLog(run, msg("phoneRevealLog", { table: tableName(tableId) }));
      notify(msg("phoneRevealNotify", { table: tableName(tableId) }));
    }
  }

  function enterTable(tableId, collateralId) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }
    const tableDef = getTableDef(tableId);
    if (!tableDef) {
      return;
    }
    if (tableDef.unlocksAfter && !run.completedTables.includes(tableDef.unlocksAfter)) {
      notify(msg("tableLockedUntilFirstClear", { table: tableName(tableDef) }));
      return;
    }
    if (run.completedTables.includes(tableId)) {
      notify(msg("tableAlreadyPlayed"));
      return;
    }
    if (run.cashOnHand < tableDef.buyIn) {
      notify(msg("notEnoughForBuyIn"));
      return;
    }

    const collateral = collateralId ? takeCollateral(run, collateralId, tableId) : null;
    run.cashOnHand -= tableDef.buyIn;
    run.heat = Math.min(6, run.heat + tableDef.heatGain);
    run.currentTable = createTableState(run, tableDef, collateral);
    state.mode = "table";
    notify(msg("satAtTable", { table: tableName(tableDef), heatGain: tableDef.heatGain }));
    progressTable();
  }

  function attemptExtraction(type) {
    const run = state.run;
    if (state.mode !== "search") {
      return;
    }

    const valuables = run.inventory.filter((item) => getItemDef(item.itemId).kind === "valuable");
    const stashNet = projectStashNet(run.stashedCash);
    let settledCash = run.cashOnHand;
    let settledValuables = valuables.slice();
    let costs = [];
    let routeLabel = "Unknown route";

    if (type === "general") {
      routeLabel = currentLanguage() === "zh" ? "公开撤离" : "General Extraction";
      if (!run.routeIntel.publicExit) {
        notify(msg("noPublicExitLead"));
        return;
      }
      if (run.heat >= 6) {
        notify(msg("generalExtractionShut"));
        return;
      }
      let fee = 30 + Math.floor(run.cashOnHand * 0.15);
      if (run.heat === 5) {
        fee += 60;
      }
      if (run.cashOnHand < fee) {
        notify(msg("notEnoughForGeneralExtractionFee"));
        return;
      }
      settledCash -= fee;
      costs.push(msg("generalExtractionFee", { fee }));
    } else if (type === "fixed") {
      const route = run.fixedRouteReservation;
      routeLabel = routeName(route) || (currentLanguage() === "zh" ? "固定路线" : "Fixed Route");
      if (!run.routeIntel.fixedWhisper) {
        notify(msg("noFixedRouteLead"));
        return;
      }
      if (!route) {
        notify(msg("noFixedRouteReserved"));
        return;
      }
      if (run.searchIndex > route.expiresAfterSearch) {
        notify(msg("fixedRouteExpired"));
        return;
      }
      if (run.heat > route.maxHeat) {
        notify(msg("fixedRouteClosedByHeat"));
        return;
      }
      if (run.cashOnHand < route.finalCost) {
        notify(msg("cannotPayFixedRoute"));
        return;
      }
      settledCash -= route.finalCost;
      costs.push(msg("fixedRouteHandoff", { route: routeName(route), fee: route.finalCost }));
    } else if (type === "dropbag-cash") {
      routeLabel = currentLanguage() === "zh" ? "紧急撤离 / 丢现金" : "Drop-Bag / Cash";
      if (!run.routeIntel.emergency) {
        notify(msg("noEmergencyExitLead"));
        return;
      }
      if (run.cashOnHand < 10) {
        notify(msg("cannotAffordDropBagFee"));
        return;
      }
      const sacrificed = Math.floor(run.cashOnHand * 0.4);
      settledCash = run.cashOnHand - sacrificed - 10;
      costs.push(msg("dropBagFee"));
      costs.push(msg("dropBagCashLoss", { amount: sacrificed }));
    } else if (type === "dropbag-valuables") {
      routeLabel = currentLanguage() === "zh" ? "紧急撤离 / 丢货" : "Drop-Bag / Valuables";
      if (!run.routeIntel.emergency) {
        notify(msg("noEmergencyExitLead"));
        return;
      }
      if (run.cashOnHand < 10) {
        notify(msg("cannotAffordDropBagFee"));
        return;
      }
      if (valuables.length === 0) {
        notify(msg("noValuablesToDump"));
        return;
      }
      settledCash -= 10;
      settledValuables = [];
      costs.push(msg("dropBagFee"));
      costs.push(msg("dropBagDumpGoods"));
    } else {
      return;
    }

    const valuableTotal = settledValuables.reduce(
      (sum, item) => sum + getItemDef(item.itemId).value,
      0,
    );
    const totalSettled = Math.max(0, settledCash) + stashNet.net + valuableTotal;
    state.persistent.vault += totalSettled;
    state.persistent.runCount += 1;
    state.persistent.winCount += 1;
    savePersistent();

    state.latestSummary = {
      success: true,
      type,
      routeLabel,
      totalSettled,
      settledCash: Math.max(0, settledCash),
      stashGross: run.stashedCash,
      stashNet: stashNet.net,
      stashFee: stashNet.fee,
      valuableTotal,
      settledValuables: settledValuables.map((item) => ({
        itemId: item.itemId,
        name: itemName(item.itemId),
        value: getItemDef(item.itemId).value,
      })),
      costs,
      heat: run.heat,
      completedTables: run.completedTables.slice(),
    };
    clearRunSnapshot();
    state.run = null;
    state.mode = "summary";
    state.handoffBeat = null;
    notify(msg("extractedWith", { total: totalSettled }));
  }

  function maybeFailRun(reason) {
    const run = state.run;
    if (!run || state.mode !== "search") {
      return;
    }
    const remainingPlayableTables = TABLE_ORDER.filter((tableId) => {
      const table = getTableDef(tableId);
      if (run.completedTables.includes(tableId)) {
        return false;
      }
      if (table.unlocksAfter && !run.completedTables.includes(table.unlocksAfter)) {
        return false;
      }
      return run.cashOnHand >= table.buyIn;
    });

    const canExtract =
      canUseGeneralExtraction(run) ||
      canUseFixedExtraction(run) ||
      canUseDropBag(run, "cash") ||
      canUseDropBag(run, "valuables");

    if (remainingPlayableTables.length > 0 || canExtract) {
      return;
    }

    const wallet = run.inventory.find((item) => item.itemId === "false-bottom-wallet");
    let salvaged = 0;
    if (wallet && run.cashOnHand > 0) {
      salvaged = Math.min(80, run.cashOnHand);
      state.persistent.vault += salvaged;
      savePersistent();
    }
    state.persistent.runCount += 1;
    savePersistent();
    state.latestSummary = {
      success: false,
      reason,
      salvaged,
      lostCash: run.cashOnHand,
      lostStash: run.stashedCash,
      lostValuables: run.inventory
        .filter((item) => getItemDef(item.itemId).kind === "valuable")
        .reduce((sum, item) => sum + getItemDef(item.itemId).value, 0),
      lostValuableNames: run.inventory
        .filter((item) => getItemDef(item.itemId).kind === "valuable")
        .map((item) => ({
          itemId: item.itemId,
          name: itemName(item.itemId),
        })),
      completedTables: run.completedTables.slice(),
    };
    clearRunSnapshot();
    state.run = null;
    state.mode = "summary";
    state.handoffBeat = null;
    notify(reason);
  }

  function takePlayerTableAction(kind) {
    if (state.mode !== "table" || !state.run?.currentTable) {
      return;
    }
    const table = state.run.currentTable;
    if (table.currentActorId !== "player") {
      return;
    }
    const legal = table.legalActions.player;
    const legalKey = kind === "all-in" ? "allIn" : kind;
    if (!legal || !legal[legalKey]) {
      notify(msg("illegalAction"));
      return;
    }
    applyTableAction(table, table.players[0], kind);
  }

  function continueTable() {
    if (state.mode !== "table" || !state.run?.currentTable) {
      return;
    }
    const table = state.run.currentTable;
    if (table.pendingNextHand) {
      startPendingHand();
      return;
    }
    if (table.pendingConclusion) {
      finalizePendingHand();
    }
  }

  function useTableItem(instanceId, targetId) {
    const run = state.run;
    if (state.mode !== "table" || !run?.currentTable) {
      return;
    }
    const table = run.currentTable;
    const item = run.inventory.find((entry) => entry.id === instanceId);
    if (!item) {
      return;
    }
    const itemDef = getItemDef(item.itemId);
    if (itemDef.phase !== "table") {
      return;
    }
    if (item.itemId === "marked-lens") {
      if (table.itemUsage.markedLens || table.street === "river") {
        notify(msg("lensNoAngle"));
        return;
      }
      table.itemUsage.markedLens = true;
      run.heat = Math.min(6, run.heat + itemDef.heat);
      table.peekCard = getNextCommunityPreview(table);
      table.spentToolMoments.push({
        itemId: item.itemId,
        name: itemName(item.itemId),
        tone: "cool",
        summary: msg("markedLensSummary", { card: prettyCard(table.peekCard) }),
        detail: msg("markedLensDetail"),
      });
      removeInventoryItem(run, instanceId);
      pushTableLog(table, msg("markedLensLog", { card: prettyCard(table.peekCard) }));
      setStageCue(table, "cool", itemName(item.itemId), msg("markedLensCueText", { card: prettyCard(table.peekCard) }));
      return;
    }
    if (item.itemId === "signal-lighter") {
      if (table.itemUsage.signalLighter || !targetId) {
        notify(msg("signalPickTarget"));
        return;
      }
      const target = table.players.find((player) => player.id === targetId);
      if (!target || target.id === "player" || target.folded) {
        return;
      }
      const baseRead = classifyRead(table, target);
      const targetDisplay = actorName(target);
      const read = {
        ...baseRead,
        label: localizeReadLabel(baseRead.label, currentLanguage()),
        descriptor: localizeReadDescriptor(baseRead.descriptor, currentLanguage()),
      };
      table.itemUsage.signalLighter = true;
      table.signalRead = {
        targetId: target.id,
        label: read.label,
        tone: read.tone,
        meter: read.meter,
        descriptor: read.descriptor,
        winOdds: read.winOdds,
      };
      table.spentToolMoments.push({
        itemId: item.itemId,
        name: itemName(item.itemId),
        tone: read.tone,
        summary: msg("signalSummary", { target: targetDisplay, label: read.label }),
        detail: read.descriptor,
      });
      removeInventoryItem(run, instanceId);
      pushTableLog(table, msg("signalLog", { target: targetDisplay, label: read.label }));
      setStageCue(table, read.tone, itemName(item.itemId), msg("signalCueText", { target: targetDisplay, descriptor: read.descriptor }));
      return;
    }
    if (item.itemId === "sleeve-clip") {
      if (
        table.itemUsage.sleeveClip ||
        table.street !== "preflop" ||
        table.turnCounter > 0 ||
        table.currentActorId !== "player"
      ) {
        notify(msg("sleeveUnavailable"));
        return;
      }
      const replacement = drawCard(table.deck);
      table.players[0].holeCards[1] = replacement;
      table.itemUsage.sleeveClip = true;
      run.heat = Math.min(6, run.heat + itemDef.heat);
      table.spentToolMoments.push({
        itemId: item.itemId,
        name: itemName(item.itemId),
        tone: "warn",
        summary: msg("sleeveSummary", { card: prettyCard(replacement) }),
        detail: msg("sleeveDetail"),
      });
      removeInventoryItem(run, instanceId);
      pushTableLog(
        table,
        msg("sleeveLog", { hand: prettyCards(table.players[0].holeCards) }),
      );
      setStageCue(
        table,
        "warn",
        itemName(item.itemId),
        msg("sleeveCueText", { hand: prettyCards(table.players[0].holeCards) }),
      );
      table.legalActions = buildLegalActionMap(table);
    }
  }

  function progressTable() {
    const run = state.run;
    if (!run?.currentTable || state.mode !== "table") {
      return;
    }

    const table = run.currentTable;
    let guard = 0;
    while (state.mode === "table" && guard < 80) {
      guard += 1;
      if (!table.currentActorId) {
        advanceStreetOrResolve(table);
        return;
      }
      if (table.currentActorId === "player") {
        table.legalActions = buildLegalActionMap(table);
        return;
      }
      const actor = table.players.find((player) => player.id === table.currentActorId);
      if (!actor || actor.folded || actor.stack <= 0) {
        table.toAct.shift();
        if (table.toAct.length === 0) {
          advanceStreetOrResolve(table);
        } else {
          table.currentActorId = table.toAct[0];
          table.legalActions = buildLegalActionMap(table);
        }
        continue;
      }
      const decision = chooseAiAction(table, actor);
      applyTableAction(table, actor, decision.kind);
      return;
    }
  }

  function applyTableAction(table, participant, kind) {
    table.turnCounter += 1;
    const callCost = Math.max(0, table.currentBet - participant.currentBet);
    const actorLabel = actorName(participant);

    if (kind === "fold") {
      participant.folded = true;
      rememberLastAction(participant, "fold");
      pushTableLog(table, msg("actorFolds", { actor: actorLabel }));
      afterAction(table, participant, kind);
      return;
    }

    if (kind === "check") {
      rememberLastAction(participant, "check");
      pushTableLog(table, msg("actorChecks", { actor: actorLabel }));
      afterAction(table, participant, kind);
      return;
    }

    if (kind === "call") {
      if (participant.stack < callCost) {
        participant.folded = true;
        rememberLastAction(participant, "fold");
        pushTableLog(table, msg("actorCannotCoverCallFolds", { actor: actorLabel }));
        afterAction(table, participant, "fold");
        return;
      }
      addCommittedChips(table, participant, callCost);
      rememberLastAction(participant, "call");
      pushTableLog(table, msg("actorCalls", { actor: actorLabel, amount: callCost }));
      afterAction(table, participant, kind);
      return;
    }

    if (kind === "raise") {
      const isOpen = table.currentBet === 0;
      const targetBet = isOpen ? table.tableDef.openBet : table.currentBet + table.tableDef.raiseIncrement;
      let cost = targetBet - participant.currentBet;
      if (table.firstAggressionDiscountAvailable) {
        cost = Math.max(0, cost - 10);
        table.firstAggressionDiscountAvailable = false;
      }
      if (participant.stack <= cost) {
        participant.folded = true;
        rememberLastAction(participant, "fold");
        pushTableLog(table, msg("actorCannotCoverCallFolds", { actor: actorLabel }));
        afterAction(table, participant, "fold");
        return;
      }
      addCommittedChips(table, participant, cost);
      table.currentBet = targetBet;
      if (!isOpen) {
        table.raiseUsed = true;
      }
      const discounted =
        cost !==
        targetBet - (isOpen ? 0 : table.currentBet - table.tableDef.raiseIncrement);
      pushTableLog(
        table,
        discounted
          ? msg(isOpen ? "actorOpensToDiscount" : "actorRaisesToDiscount", {
              actor: actorLabel,
              amount: targetBet,
            })
          : msg(isOpen ? "actorOpensTo" : "actorRaisesTo", {
              actor: actorLabel,
              amount: targetBet,
            }),
      );
      rememberLastAction(participant, "bet");
      afterAction(table, participant, kind, true);
      if (participant.id === "player") {
        table.playerPattern.raiseCount += 1;
      }
      return;
    }

    if (kind === "all-in") {
      if (participant.stack <= 0) {
        return;
      }
      const cost = participant.stack;
      const targetBet = participant.currentBet + cost;
      const reopensAction = targetBet > table.currentBet;
      addCommittedChips(table, participant, cost);
      if (reopensAction) {
        table.currentBet = targetBet;
        table.raiseUsed = true;
      }
      rememberLastAction(participant, "all-in");
      pushTableLog(
        table,
        reopensAction
          ? msg("actorShoves", { actor: actorLabel, amount: targetBet })
          : msg("actorShovesShort", { actor: actorLabel, amount: targetBet }),
      );
      afterAction(table, participant, kind, reopensAction);
      if (participant.id === "player") {
        table.playerPattern.raiseCount += 1;
      }
    }
  }

  function afterAction(table, participant, kind, resetQueue = false) {
    if (alivePlayers(table).length <= 1) {
      resolveFoldWin(table);
      return;
    }

    if (resetQueue) {
      table.toAct = orderedActiveAfter(table, participant.seatIndex, false).map((player) => player.id);
    } else {
      table.toAct.shift();
    }

    if (table.toAct.length === 0) {
      advanceStreetOrResolve(table);
      return;
    }

    table.currentActorId = table.toAct[0];
    table.legalActions = buildLegalActionMap(table);
    if (table.currentActorId !== "player") {
      scheduleTableBeat("auto", TABLE_ACTION_DELAY_MS);
    }
  }

  function advanceStreetOrResolve(table) {
    table.players.forEach((player) => {
      player.currentBet = 0;
    });
    table.currentBet = 0;
    table.raiseUsed = false;
    table.peekCard = null;
    table.signalRead = null;
    table.stageCue = null;

    if (table.street === "preflop") {
      table.street = "flop";
      table.community.push(drawCard(table.deck), drawCard(table.deck), drawCard(table.deck));
      pushTableLog(table, msg("flopCards", { cards: prettyCards(table.community) }));
      setStageCue(
        table,
        table.handNumber === table.totalHands ? "warn" : "cool",
        msg(table.handNumber === table.totalHands ? "finalFlopTitle" : "flopFallsTitle"),
        msg("boardOpens", { cards: prettyCards(table.community) }),
      );
    } else if (table.street === "flop") {
      table.street = "turn";
      table.community.push(drawCard(table.deck));
      pushTableLog(table, msg("turnCard", { card: prettyCard(table.community[3]) }));
      setStageCue(
        table,
        table.handNumber === table.totalHands ? "warn" : "cool",
        msg("turnCardTitle"),
        msg("turnCardText", { card: prettyCard(table.community[3]) }),
      );
    } else if (table.street === "turn") {
      table.street = "river";
      table.community.push(drawCard(table.deck));
      pushTableLog(table, msg("riverCard", { card: prettyCard(table.community[4]) }));
      setStageCue(
        table,
        table.handNumber === table.totalHands ? "bad" : "warn",
        msg(table.handNumber === table.totalHands ? "finalRiverTitle" : "riverCardTitle"),
        table.handNumber === table.totalHands
          ? msg("finalRiverText", { card: prettyCard(table.community[4]) })
          : msg("riverText", { card: prettyCard(table.community[4]) }),
      );
    } else {
      resolveShowdown(table);
      return;
    }

    table.toAct = orderedPostflopAction(table).map((player) => player.id);
    table.currentActorId = table.toAct[0] ?? null;
    table.legalActions = buildLegalActionMap(table);
    if (!table.currentActorId || table.currentActorId !== "player") {
      scheduleTableBeat("auto", TABLE_REVEAL_DELAY_MS);
    }
  }

  function resolveFoldWin(table) {
    const survivors = alivePlayers(table);
    if (survivors.length === 0) {
      table.lastHandSummary = {
        type: "void",
        text: msg("nobodyHolds"),
        winnerIds: [],
        board: prettyCards(table.community),
        playerCards: prettyCards(table.players[0].holeCards),
        playerHandName: null,
        playerBestFive: null,
        opponentBreakdown: [],
      };
      finishHand(table, []);
      return;
    }
    const winner = survivors[0];
    const winnerTake = table.pot;
    winner.stack += table.pot;
    const text = msg("winnerUncontested", { winner: actorName(winner) });
    pushTableLog(table, text);
    table.lastHandSummary = {
      type: "fold",
      text,
      winnerIds: [winner.id],
      winnerAwards: [
        {
          id: winner.id,
          name: actorName(winner),
          amount: winnerTake,
          handName: null,
        },
      ],
      board: prettyCards(table.community),
      river: table.community[4] ? prettyCard(table.community[4]) : null,
      playerCards: prettyCards(table.players[0].holeCards),
      playerHandName: null,
      playerBestFive: null,
      opponentBreakdown: survivors
        .filter((participant) => participant.id !== "player")
        .map((participant) => ({
          id: participant.id,
          name: actorName(participant),
          cards: prettyCards(participant.holeCards),
          handName: null,
          bestFive: null,
        })),
    };
    finishHand(table, [winner.id]);
  }

  function resolveShowdown(table) {
    const contenders = alivePlayers(table).map((player) => ({
      player,
      hand: evaluateBestHand([...player.holeCards, ...table.community]),
    }));
    const contenderMap = new Map(contenders.map((entry) => [entry.player.id, entry]));
    const pots = buildPotLayers(table);
    const winnerIds = new Set();
    const potBreakdown = [];
    const winnerAwardMap = new Map();

    pots.forEach((pot, index) => {
      const eligibleContenders = pot.eligibleIds
        .map((id) => contenderMap.get(id))
        .filter(Boolean)
        .sort((left, right) => {
          const comparison = compareHands(right.hand, left.hand);
          if (comparison !== 0) {
            return comparison;
          }
          return left.player.seatIndex - right.player.seatIndex;
        });
      if (!eligibleContenders.length) {
        return;
      }
      const best = eligibleContenders[0];
      const winners = eligibleContenders
        .filter((entry) => compareHands(entry.hand, best.hand) === 0)
        .sort((left, right) => left.player.seatIndex - right.player.seatIndex);
      const split = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount - split * winners.length;
      winners.forEach((entry, winnerIndex) => {
        const award = split + (winnerIndex === 0 ? remainder : 0);
        entry.player.stack += award;
        winnerIds.add(entry.player.id);
        winnerAwardMap.set(entry.player.id, (winnerAwardMap.get(entry.player.id) ?? 0) + award);
      });
      potBreakdown.push({
        label:
          index === 0 ? msg("mainPotLabel") : msg("sidePotLabel", { index }),
        amount: pot.amount,
        winnerIds: winners.map((entry) => entry.player.id),
        handName: localizeHandName(best.hand.name, currentLanguage()),
      });
    });

    const primaryPot = potBreakdown[0];
    const primaryWinnerIds = primaryPot?.winnerIds ?? [];
    const primaryWinnerNames = primaryWinnerIds
      .map((id) => contenderMap.get(id))
      .filter(Boolean)
      .map((entry) => actorName(entry.player));
    const primaryHand =
      primaryPot?.handName ??
      (contenders[0] ? localizeHandName(contenders[0].hand.name, currentLanguage()) : null);
    const text = msg("showdownLine", {
      winners: primaryWinnerNames.join(currentLanguage() === "zh" ? " 和 " : " and "),
      hand: primaryHand,
    });
    pushTableLog(table, text);
    potBreakdown.slice(1).forEach((pot) => {
      pushTableLog(
        table,
        msg("potSettlesLine", {
          pot: pot.label,
          winners: summarizeWinnersForLog(pot.winnerIds, contenderMap),
          hand: pot.handName,
        }),
      );
    });
    table.lastHandSummary = {
      type: "showdown",
      text,
      handName: primaryHand,
      winnerIds: primaryWinnerIds,
      winnerAwards: Array.from(winnerAwardMap.entries()).map(([id, amount]) => {
        const contender = contenderMap.get(id);
        return {
          id,
          name: contender ? actorName(contender.player) : id,
          amount,
          handName: contender ? localizeHandName(contender.hand.name, currentLanguage()) : null,
        };
      }),
      potBreakdown,
      ...buildRevealSummary(table, contenders),
    };
    finishHand(
      table,
      primaryWinnerIds,
    );
  }

  function summarizeWinnersForLog(winnerIds, contenderMap) {
    return winnerIds
      .map((id) => contenderMap.get(id))
      .filter(Boolean)
      .map((entry) => actorName(entry.player))
      .join(currentLanguage() === "zh" ? " 和 " : " and ");
  }

  function finishHand(table, winnerIds) {
    if (table.handNumber === table.totalHands) {
      table.finalHandWinnerIds = winnerIds.slice();
    }

    if (table.handNumber >= table.totalHands || alivePlayersWithChips(table).length <= 1 || table.players[0].stack <= 0) {
      table.pendingConclusion = true;
      table.pendingNextHand = false;
      table.currentActorId = null;
      table.toAct = [];
      table.legalActions = {
        ...table.legalActions,
        player: {},
      };
      clearTableBeat();
      return;
    }

    table.pendingNextHand = true;
    table.pendingConclusion = false;
    table.currentActorId = null;
    table.toAct = [];
    table.legalActions = {
      ...table.legalActions,
      player: {},
    };
    clearTableBeat();
  }

  function concludeTable(table) {
    clearTableBeat();
    const run = state.run;
    const player = table.players[0];
    run.cashOnHand += player.stack;
    const net = player.stack - table.tableDef.buyIn;

    let collateralReturned = false;
    if (table.collateral) {
      const playerWonFinal = table.finalHandWinnerIds.includes("player");
      if (playerWonFinal) {
        run.inventory.push(table.collateral);
        collateralReturned = true;
      }
    }

    let rewardId = null;
    let rewardAdded = false;
    if (net > 0) {
      rewardId = pickTableReward(run, table);
      if (rewardId) {
        rewardAdded = awardItem(run, rewardId);
        if (rewardAdded) {
          notify(msg("wonReward", { reward: itemName(rewardId), table: tableName(table.tableDef) }));
        } else {
          notify(msg("noRoomCarryReward", { reward: itemName(rewardId) }));
        }
      }
    }

    if (table.collateral && !collateralReturned) {
      notify(msg("collateralLostNotify", { item: itemName(table.collateral.itemId) }));
    }

    run.lastTableResult = {
      tableId: table.tableDef.id,
      tableName: tableName(table.tableDef),
      net,
      rewardId,
      rewardAdded,
      rewardName: rewardId ? itemName(rewardId) : null,
      collateralName: table.collateral ? itemName(table.collateral.itemId) : null,
      collateralReturned,
      collateralLost: Boolean(table.collateral && !collateralReturned),
      finalHandWinnerIds: table.finalHandWinnerIds.slice(),
      lastHandSummary: table.lastHandSummary,
    };
    run.roomResults = [...(run.roomResults ?? []), run.lastTableResult];

    pushRunLog(run, msg("tableEndedLog", { table: tableName(table.tableDef), result: net >= 0 ? `+${net}` : `-${Math.abs(net)}` }));
    if (rewardId && rewardAdded) {
      pushRunLog(run, msg("securedRewardLog", { reward: itemName(rewardId), table: tableName(table.tableDef) }));
    }
    if (table.collateral && !collateralReturned) {
      pushRunLog(run, msg("collateralLostLog", { item: itemName(table.collateral.itemId), table: tableName(table.tableDef) }));
    }

    run.completedTables.push(table.tableDef.id);
    if (table.tableDef.id === "cargo-table") {
      run.routeIntel.fixedWhisper = true;
    }
    run.routeIntel.publicExit = true;
    run.routeIntel.emergency = true;
    run.currentTable = null;
    state.mode = "search";
    run.searchIndex += 1;
    beginSearchPhase(run);
    state.handoffBeat = {
      title: msg("roomSettledTitle", { table: tableName(table.tableDef) }),
      tone: net >= 0 ? "good" : "bad",
      roomId: table.tableDef.id,
      roomLabel: tableName(table.tableDef),
      net,
      rewardId,
      rewardName: rewardId ? itemName(rewardId) : null,
      rewardAdded,
      collateralName: table.collateral ? itemName(table.collateral.itemId) : null,
      collateralReturned,
      lastHandType: table.lastHandSummary?.type ?? null,
      lastHandWinnerIds: table.lastHandSummary?.winnerIds?.slice() ?? [],
      lastHandText: table.lastHandSummary?.text ?? null,
      lastHandName: table.lastHandSummary?.handName ?? null,
      ttl: 2.8,
    };
    notify(msg("tableEndedLog", { table: tableName(table.tableDef), result: net >= 0 ? `+${net}` : `-${Math.abs(net)}` }));
  }

  function beginSearchPhase(run) {
    run.actionPoints = SEARCH_ACTIONS;
    run.phase = {
      stashUsed: false,
      heatReduced: false,
    };
    run.shopStock = getShopStock(run.searchIndex);
    if (
      run.fixedRouteReservation &&
      run.searchIndex > run.fixedRouteReservation.expiresAfterSearch
    ) {
      run.fixedRouteReservation = null;
      notify(msg("reservedRouteWentCold"));
    }
  }

  function createRun(bankroll) {
    const run = {
      bankroll,
      searchIndex: 1,
      floorEntered: false,
      cashOnHand: bankroll,
      stashedCash: 0,
      heat: 0,
      inventory: [],
      completedTables: [],
      actionPoints: SEARCH_ACTIONS,
      phase: {
        stashUsed: false,
        heatReduced: false,
      },
      routeIntel: {
        publicExit: false,
        fixedWhisper: false,
        emergency: false,
      },
      fixedRouteOffer: FIXED_ROUTE_POOL[0],
      fixedRouteReservation: null,
      lastTableResult: null,
      roomResults: [],
      intel: Object.fromEntries(
        Object.keys(TABLES).map((tableId) => [
          tableId,
          {
            rule: false,
            opponents: false,
            reward: false,
          },
        ]),
      ),
      shopStock: getShopStock(1),
      currentTable: null,
      log: [],
      inventoryCounter: 0,
      randomSeed: Date.now() % 2147483647,
    };
    return run;
  }

  function enterFloor() {
    const run = state.run;
    if (state.mode !== "search" || run.currentTable) {
      return;
    }
    run.floorEntered = true;
  }

  function ensureRouteIntel(run) {
    run.routeIntel = {
      publicExit: Boolean(run.routeIntel?.publicExit),
      fixedWhisper: Boolean(run.routeIntel?.fixedWhisper),
      emergency: Boolean(run.routeIntel?.emergency),
    };
    return run.routeIntel;
  }

  function syncRouteIntel(run) {
    const routeIntel = ensureRouteIntel(run);
    const onFloor = Boolean(run.floorEntered);
    routeIntel.publicExit =
      routeIntel.publicExit ||
      Boolean(
        onFloor &&
          (run.completedTables.length ||
            run.lastTableResult ||
            run.intel?.["cargo-table"]?.rule ||
            run.intel?.["cargo-table"]?.reward ||
            run.intel?.["mirror-hall"]?.rule ||
            run.intel?.["mirror-hall"]?.reward),
      );
    routeIntel.fixedWhisper =
      routeIntel.fixedWhisper ||
      Boolean(
        run.fixedRouteReservation ||
          (onFloor &&
            (run.completedTables.includes("cargo-table") ||
              run.intel?.["cargo-table"]?.opponents ||
              run.intel?.["mirror-hall"]?.opponents)),
      );
    routeIntel.emergency =
      routeIntel.emergency ||
      Boolean(
        onFloor &&
          (run.heat >= 4 ||
            run.completedTables.length ||
            run.lastTableResult ||
            run.inventory.some((item) => getItemDef(item.itemId).kind === "valuable")),
      );
  }

  function createTableState(run, tableDef, collateral) {
    const players = [
      {
        id: "player",
        seatIndex: 0,
        name: currentLanguage() === "zh" ? "你" : "You",
        stack: tableDef.buyIn,
        holeCards: [],
        currentBet: 0,
        handContribution: 0,
        folded: false,
        lastAction: null,
      },
      ...tableDef.opponentIds.map((opponentId, index) => ({
        id: opponentId,
        archetypeId: opponentId,
        seatIndex: index + 1,
        name: getLocalizedOpponent(opponentId, currentLanguage())?.name ?? getOpponentDef(opponentId).name,
        stack: tableDef.buyIn,
        holeCards: [],
        currentBet: 0,
        handContribution: 0,
        folded: false,
        lastAction: null,
      })),
    ];

    const table = {
      tableDef,
      seed: nextRandomInt(run, 999999),
      random: () => nextRandom(run),
      players,
      dealerSeat: 0,
      handNumber: 1,
      totalHands: tableDef.hands,
      pot: 0,
      currentBet: 0,
      street: "preflop",
      smallBlindSeat: null,
      bigBlindSeat: null,
      community: [],
      deck: [],
      toAct: [],
      currentActorId: null,
      legalActions: {},
      raiseUsed: false,
      firstAggressionDiscountAvailable: tableDef.id === "cargo-table",
      turnCounter: 0,
      collateral,
      itemUsage: {
        markedLens: false,
        signalLighter: false,
        sleeveClip: false,
      },
      spentToolMoments: [],
      signalRead: null,
      peekCard: null,
      stageCue: null,
      playerPattern: {
        raiseCount: 0,
      },
      finalHandWinnerIds: [],
      lastHandSummary: null,
      pendingNextHand: false,
      pendingConclusion: false,
      log: [],
    };

    startHand(table);
    return table;
  }

  function startHand(table) {
    table.pot = 0;
    table.currentBet = 0;
    table.street = "preflop";
    table.smallBlindSeat = null;
    table.bigBlindSeat = null;
    table.community = [];
    table.raiseUsed = false;
    table.firstAggressionDiscountAvailable = table.tableDef.id === "cargo-table";
    table.turnCounter = 0;
    table.signalRead = null;
    table.peekCard = null;
    table.stageCue = null;
    table.pendingNextHand = false;
    table.pendingConclusion = false;
    table.log = table.log.slice(-10);

    table.players.forEach((player) => {
      player.folded = player.stack <= 0;
      player.currentBet = 0;
      player.handContribution = 0;
      player.holeCards = [];
      player.lastAction = null;
    });

    const deck = shuffleDeck(createDeck(), table.random);
    table.deck = deck;
    table.dealerSeat = (table.handNumber - 1) % table.players.length;

    const activeStarters = table.players.filter((player) => player.stack > 0);
    if (activeStarters.length <= 1 || table.players[0].stack <= 0) {
      concludeTable(table);
      return;
    }

    table.lastHandSummary = null;

    const smallBlind = nextLiveSeatAfter(table, table.dealerSeat);
    const bigBlind = smallBlind ? nextLiveSeatAfter(table, smallBlind.seatIndex) : null;
    if (!smallBlind || !bigBlind) {
      concludeTable(table);
      return;
    }

    table.smallBlindSeat = smallBlind.seatIndex;
    table.bigBlindSeat = bigBlind.seatIndex;

    postBlind(table, smallBlind, getSmallBlindAmount(table));
    postBlind(table, bigBlind, getBigBlindAmount(table));
    table.currentBet = Math.max(...table.players.map((player) => player.currentBet));

    const dealOrder = getDealOrder(table);
    for (let round = 0; round < 2; round += 1) {
      dealOrder.forEach((player) => {
        if (!player.folded) {
          player.holeCards.push(drawCard(table.deck));
        }
      });
    }

    table.itemUsage.signalLighter = false;
    table.itemUsage.markedLens = false;
    table.itemUsage.sleeveClip = false;
    table.toAct = orderedPreflopAction(table).map((player) => player.id);
    table.currentActorId = table.toAct[0] ?? null;
    table.legalActions = buildLegalActionMap(table);
    if (table.handNumber === table.totalHands) {
      if (table.tableDef.id === "mirror-hall") {
        setStageCue(
          table,
          table.collateral ? "good" : "warn",
          msg("finalHandTitle"),
          table.collateral
            ? msg("finalHandMirrorGood")
            : msg("finalHandMirrorWarn"),
        );
      } else {
        setStageCue(table, "warn", msg("finalHandTitle"), msg("finalHandCargo"));
      }
    }
    pushTableLog(
      table,
      msg("handBegins", {
        hand: table.handNumber,
        pot: table.pot,
        small: getSmallBlindAmount(table),
        big: getBigBlindAmount(table),
      }),
    );
  }

  function buildLegalActionMap(table) {
    const legal = {};
    for (const player of table.players) {
      if (player.folded || player.stack <= 0) {
        legal[player.id] = {};
        continue;
      }
      const callCost = Math.max(0, table.currentBet - player.currentBet);
      const entry = {};
      if (callCost === 0) {
        entry.fold = true;
        entry.check = true;
        entry.raise =
          table.currentBet === 0
            ? player.stack > costToOpen(table)
            : !table.raiseUsed && player.stack > costToRaise(table);
        entry.allIn = player.stack > 0;
      } else {
        entry.fold = true;
        entry.call = player.stack >= callCost;
        entry.raise =
          !table.raiseUsed && player.stack > callCost + costToRaise(table);
        entry.allIn = player.stack > 0;
      }
      legal[player.id] = entry;
    }
    return legal;
  }

  function costToOpen(table) {
    let cost = table.tableDef.openBet;
    if (table.firstAggressionDiscountAvailable) {
      cost = Math.max(0, cost - 10);
    }
    return cost;
  }

  function costToRaise(table) {
    let cost = table.tableDef.raiseIncrement;
    if (table.firstAggressionDiscountAvailable) {
      cost = Math.max(0, cost - 10);
    }
    return cost;
  }

  function alivePlayers(table) {
    return table.players.filter((player) => !player.folded && player.stack >= 0);
  }

  function alivePlayersWithChips(table) {
    return table.players.filter((player) => !player.folded && player.stack > 0);
  }

  function orderedActiveAfter(table, seatIndex, includePivot) {
    const seatCount = table.players.length;
    return table.players
      .slice()
      .filter((player) => includePivot || player.seatIndex !== seatIndex)
      .sort(
        (a, b) =>
          orderDistance(a.seatIndex, seatIndex, seatCount, includePivot) -
          orderDistance(b.seatIndex, seatIndex, seatCount, includePivot),
      )
      .filter((player) => !player.folded && player.stack > 0);
  }

  function nextLiveSeatAfter(table, seatIndex) {
    const seatCount = table.players.length;
    for (let step = 1; step < seatCount; step += 1) {
      const targetSeat = (seatIndex + step) % seatCount;
      const participant = table.players.find((player) => player.seatIndex === targetSeat);
      if (participant && !participant.folded && participant.stack > 0) {
        return participant;
      }
    }
    return null;
  }

  function orderedPreflopAction(table) {
    return orderedActiveCycle(table, table.bigBlindSeat, true);
  }

  function orderedPostflopAction(table) {
    return orderedActiveCycle(table, table.dealerSeat, true);
  }

  function orderedActiveCycle(table, seatIndex, includePivotAtEnd = false) {
    const seatCount = table.players.length;
    const ordered = [];
    for (let step = 1; step < seatCount; step += 1) {
      const targetSeat = (seatIndex + step) % seatCount;
      const participant = table.players.find((player) => player.seatIndex === targetSeat);
      if (participant && !participant.folded && participant.stack > 0) {
        ordered.push(participant);
      }
    }
    if (includePivotAtEnd) {
      const pivot = table.players.find((player) => player.seatIndex === seatIndex);
      if (pivot && !pivot.folded && pivot.stack > 0) {
        ordered.push(pivot);
      }
    }
    return ordered;
  }

  function getDealOrder(table) {
    return orderedActiveCycle(table, table.dealerSeat, true);
  }

  function postBlind(table, participant, amount) {
    const posted = Math.min(participant.stack, amount);
    addCommittedChips(table, participant, posted);
    return posted;
  }

  function getSmallBlindAmount(table) {
    const explicitBlind = Number(table.tableDef.smallBlind);
    if (Number.isFinite(explicitBlind) && explicitBlind > 0) {
      return explicitBlind;
    }
    return Math.max(1, Math.floor(getBigBlindAmount(table) / 2));
  }

  function getBigBlindAmount(table) {
    return table.tableDef.openBet;
  }

  function orderDistance(seatIndex, pivot, seatCount, includePivot) {
    let distance = (seatIndex - pivot + seatCount) % seatCount;
    if (distance === 0 && includePivot) {
      distance = seatCount;
    }
    return distance;
  }

  function pushTableLog(table, message) {
    table.log.push(message);
    table.log = table.log.slice(-12);
  }

  function pushRunLog(run, message) {
    run.log.push(message);
    run.log = run.log.slice(-12);
  }

  function setStageCue(table, tone, title, text) {
    table.stageCue = {
      tone,
      title,
      text,
    };
  }

  function projectStashNet(amount) {
    let remaining = amount;
    let fee = 0;
    if (remaining <= 0) {
      return { gross: 0, net: 0, fee: 0 };
    }
    const tierOne = Math.min(remaining, 100);
    fee += Math.floor(tierOne * 0.2);
    remaining -= tierOne;
    if (remaining > 0) {
      const tierTwo = Math.min(remaining, 150);
      fee += Math.floor(tierTwo * 0.3);
      remaining -= tierTwo;
    }
    if (remaining > 0) {
      fee += Math.floor(remaining * 0.4);
    }
    return {
      gross: amount,
      net: amount - fee,
      fee,
    };
  }

  function rotateFixedRoute(currentRoute) {
    const currentIndex = FIXED_ROUTE_POOL.findIndex((route) => route.id === currentRoute?.id);
    if (currentIndex === -1) {
      return FIXED_ROUTE_POOL[0];
    }
    return FIXED_ROUTE_POOL[(currentIndex + 1) % FIXED_ROUTE_POOL.length];
  }

  function awardItem(run, itemId) {
    const itemDef = getItemDef(itemId);
    if (inventorySlotsUsed(run.inventory) + itemDef.slots > INVENTORY_SLOTS) {
      return false;
    }
    run.inventory.push(createInventoryItem(itemId, run));
    return true;
  }

  function createInventoryItem(itemId, run = state.run) {
    run.inventoryCounter += 1;
    return {
      id: `item-${run.inventoryCounter}`,
      itemId,
      name: itemName(itemId),
    };
  }

  function removeInventoryItem(run, instanceId) {
    run.inventory = run.inventory.filter((item) => item.id !== instanceId);
  }

  function takeCollateral(run, instanceId, tableId) {
    if (tableId !== "mirror-hall") {
      return null;
    }
    const item = run.inventory.find((entry) => entry.id === instanceId);
    if (!item) {
      return null;
    }
    const itemDef = getItemDef(item.itemId);
    if (itemDef.kind !== "valuable") {
      notify(msg("onlyValuablesCollateral"));
      return null;
    }
    removeInventoryItem(run, instanceId);
    return { ...item };
  }

  function pickTableReward(run, table) {
    if (table.tableDef.id === "cargo-table") {
      const alreadyHasSignature = run.inventory.some((item) => item.itemId === "ivory-chip");
      if (!alreadyHasSignature) {
        return "ivory-chip";
      }
      return table.players[0].stack >= 90 ? "ruby-cufflink" : "old-silver-lighter";
    }
    if (table.tableDef.id === "mirror-hall") {
      const playerWonFinal = table.finalHandWinnerIds.includes("player");
      if (table.collateral && playerWonFinal) {
        return "antique-coin";
      }
      return table.players[0].stack >= 170 ? "sealed-bond" : "gold-cased-watch";
    }
    return null;
  }

  function canUseGeneralExtraction(run) {
    if (!run.routeIntel?.publicExit) {
      return false;
    }
    if (run.heat >= 6) {
      return false;
    }
    let fee = 30 + Math.floor(run.cashOnHand * 0.15);
    if (run.heat === 5) {
      fee += 60;
    }
    return run.cashOnHand >= fee;
  }

  function canUseFixedExtraction(run) {
    if (!run.routeIntel?.fixedWhisper) {
      return false;
    }
    if (!run.fixedRouteReservation) {
      return false;
    }
    if (run.searchIndex > run.fixedRouteReservation.expiresAfterSearch) {
      return false;
    }
    if (run.heat > run.fixedRouteReservation.maxHeat) {
      return false;
    }
    return run.cashOnHand >= run.fixedRouteReservation.finalCost;
  }

  function canUseDropBag(run, mode) {
    if (!run.routeIntel?.emergency) {
      return false;
    }
    if (run.cashOnHand < 10) {
      return false;
    }
    if (mode === "cash") {
      return run.cashOnHand > 0;
    }
    return run.inventory.some((item) => getItemDef(item.itemId).kind === "valuable");
  }

  function getNextCommunityPreview(table) {
    if (table.street === "river") {
      return null;
    }
    return table.deck[0] ?? null;
  }

  function nextRandom(run) {
    run.randomSeed = (run.randomSeed * 48271) % 2147483647;
    return run.randomSeed / 2147483647;
  }

  function nextRandomInt(run, max) {
    return Math.floor(nextRandom(run) * max);
  }

  return {
    state,
    dispatch,
    advanceTime,
    startRun,
    resetProgress,
    projectStashNet: (amount) => projectStashNet(amount),
    getMode: () => state.mode,
    getHeatBand,
  };
}

function buildDefaultPersistentState(language = getPreferredLanguage()) {
  return {
    vault: STARTING_VAULT,
    runCount: 0,
    winCount: 0,
    language: normalizeLanguage(language ?? getPreferredLanguage()),
    schemaVersion: PERSISTENT_SCHEMA_VERSION,
  };
}

function loadSavedRunSnapshot() {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.run) {
      return null;
    }
    const floorEntered =
      parsed.run?.floorEntered ??
      Boolean(
        parsed.mode === "table" ||
          (parsed.run?.searchIndex ?? 1) > 1 ||
          (parsed.run?.completedTables?.length ?? 0) > 0 ||
          parsed.run?.lastTableResult,
      );
    return {
      mode: parsed.mode === "table" ? "table" : "search",
      run: {
        ...parsed.run,
        routeIntel: {
          publicExit:
            parsed.run?.routeIntel?.publicExit ??
            Boolean(
              floorEntered &&
                ((parsed.run?.completedTables?.length ?? 0) > 0 ||
                  parsed.run?.lastTableResult ||
                  parsed.run?.intel?.["cargo-table"]?.rule ||
                  parsed.run?.intel?.["cargo-table"]?.reward ||
                  parsed.run?.intel?.["mirror-hall"]?.rule ||
                  parsed.run?.intel?.["mirror-hall"]?.reward),
            ),
          fixedWhisper:
            parsed.run?.routeIntel?.fixedWhisper ??
            Boolean(
              parsed.run?.fixedRouteReservation ||
                (floorEntered &&
                  (parsed.run?.completedTables?.includes?.("cargo-table") ||
                    parsed.run?.intel?.["cargo-table"]?.opponents ||
                    parsed.run?.intel?.["mirror-hall"]?.opponents)),
            ),
          emergency:
            parsed.run?.routeIntel?.emergency ??
            Boolean(
              floorEntered &&
                ((parsed.run?.heat ?? 0) >= 4 ||
                  (parsed.run?.completedTables?.length ?? 0) > 0 ||
                  parsed.run?.lastTableResult ||
                  (parsed.run?.inventory ?? []).some((item) => ITEM_DEFS[item.itemId]?.kind === "valuable")),
            ),
        },
        floorEntered,
      },
    };
  } catch (error) {
    console.warn("Failed to load run snapshot", error);
    return null;
  }
}

function summarizeSavedRun(snapshot) {
  const run = snapshot?.run;
  if (!run) {
    return null;
  }
  return {
    mode: snapshot.mode === "table" ? "table" : "search",
    searchIndex: run.searchIndex ?? 1,
    cashOnHand: run.cashOnHand ?? 0,
    heat: run.heat ?? 0,
    completedTables: Array.isArray(run.completedTables) ? run.completedTables.length : 0,
  };
}

function loadPersistentState() {
  const defaults = buildDefaultPersistentState();
  function writeDefaults(language = defaults.language) {
    const nextState = buildDefaultPersistentState(language);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      localStorage.removeItem(RUN_SAVE_KEY);
    } catch (error) {
      console.warn("Failed to write default progress", error);
    }
    return nextState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return writeDefaults();
    }
    const parsed = JSON.parse(raw);
    if ((parsed?.schemaVersion ?? 0) !== PERSISTENT_SCHEMA_VERSION) {
      return writeDefaults(parsed?.language ?? defaults.language);
    }
    const hasSavedRun = Boolean(localStorage.getItem(RUN_SAVE_KEY));
    if (!hasSavedRun && (parsed?.vault ?? 0) < 120) {
      return writeDefaults(parsed?.language ?? defaults.language);
    }
    return {
      vault: parsed.vault ?? STARTING_VAULT,
      runCount: parsed.runCount ?? 0,
      winCount: parsed.winCount ?? 0,
      language: normalizeLanguage(parsed.language ?? getPreferredLanguage()),
      schemaVersion: PERSISTENT_SCHEMA_VERSION,
    };
  } catch (error) {
    console.warn("Failed to load progress", error);
    return defaults;
  }
}

function inventorySlotsUsed(inventory) {
  return inventory.reduce((sum, item) => sum + getItemDef(item.itemId).slots, 0);
}
