import fs from "node:fs";
import path from "node:path";
import { createGame } from "../src/game.js";
import {
  FIXED_ROUTE_POOL,
  INVENTORY_SLOTS,
  RUN_SAVE_KEY,
  STANDARD_BANKROLL,
  STARTING_VAULT,
  STORAGE_KEY,
  getItemDef,
  getTavernSceneDef,
} from "../src/data.js";

const CURRENT_SCHEMA_VERSION = 20260418;

class MemoryStorage {
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }

  clear() {
    this.store.clear();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key) {
    this.store.delete(key);
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  dump() {
    return Object.fromEntries(this.store.entries());
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function setupBrowserLikeGlobals(storage) {
  globalThis.localStorage = storage;
}

function bootGame({ persistent, savedRun } = {}) {
  const storage = new MemoryStorage();
  if (persistent) {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        vault: STARTING_VAULT,
        runCount: 0,
        winCount: 0,
        language: "en",
        ...persistent,
      }),
    );
  }
  if (savedRun) {
    storage.setItem(RUN_SAVE_KEY, JSON.stringify(savedRun));
  }
  setupBrowserLikeGlobals(storage);
  const game = createGame();
  return { game, storage };
}

function freshRun() {
  const session = bootGame({
    persistent: {
      vault: 3000,
      runCount: 0,
      winCount: 0,
      language: "en",
    },
  });
  session.game.dispatch("start-run");
  assert(session.game.state.mode === "search", "start-run should enter search mode");
  assert(session.game.state.run, "start-run should create a run");
  return session;
}

function makeInventoryItem(id, itemId) {
  return {
    id,
    itemId,
    name: itemId,
  };
}

function card(code) {
  const rankToken = code.slice(0, -1);
  const suit = code.slice(-1).toUpperCase();
  const rankMap = {
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };
  return {
    rank: rankMap[rankToken.toUpperCase()] ?? Number(rankToken),
    suit,
  };
}

function cardCode(card) {
  if (!card) {
    return "";
  }
  const rank = {
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  }[card.rank] ?? `${card.rank}`;
  return `${rank}${card.suit}`;
}

function fillInventoryToCapacity(run) {
  run.inventory = [
    makeInventoryItem("filled-1", "sealed-bond"),
    makeInventoryItem("filled-2", "sealed-bond"),
    makeInventoryItem("filled-3", "old-silver-lighter"),
    makeInventoryItem("filled-4", "old-silver-lighter"),
  ];
  const used = run.inventory.reduce((sum, item) => sum + getItemDef(item.itemId).slots, 0);
  assert(used === INVENTORY_SLOTS, "inventory helper should fill all slots");
}

function enterTable(game, tableId, collateralId = null) {
  game.dispatch("enter-table", { tableId, collateralId });
  return game.state.run?.currentTable ?? null;
}

function rigFinalShowdown(table, options) {
  const {
    playerCards,
    opponentCards,
    boardCards,
    playerStack = table.players[0].stack,
    opponentStacks = [],
    pot = 90,
    currentBet = 0,
    foldedSeats = [],
  } = options;
  table.handNumber = table.totalHands;
  table.street = "river";
  table.community = boardCards.map(card);
  table.pot = pot;
  table.currentBet = currentBet;
  table.raiseUsed = false;
  table.turnCounter = 0;
  table.peekCard = null;
  table.signalRead = null;
  table.stageCue = null;
  table.toAct = ["player"];
  table.currentActorId = "player";
  table.players.forEach((participant, index) => {
    participant.currentBet = 0;
    participant.handContribution = 0;
    participant.folded = foldedSeats.includes(index);
    participant.lastAction = null;
    participant.stack =
      index === 0 ? playerStack : opponentStacks[index - 1] ?? participant.stack;
    participant.holeCards =
      index === 0
        ? playerCards.map(card)
        : (opponentCards[index - 1] ?? ["2C", "3D"]).map(card);
  });
  const liveParticipants = table.players.filter((participant) => !participant.folded);
  const baseContribution = liveParticipants.length ? Math.floor(pot / liveParticipants.length) : 0;
  let remainder = liveParticipants.length ? pot - baseContribution * liveParticipants.length : 0;
  liveParticipants.forEach((participant) => {
    participant.handContribution = baseContribution + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }
  });
  table.legalActions = {
    player:
      currentBet > 0
        ? { fold: true, call: true, raise: false }
        : { check: true, raise: false },
  };
}

function clearCargoForProgression(game, { playerWins = true } = {}) {
  const run = game.state.run;
  run.cashOnHand = Math.max(run.cashOnHand, 200);
  const table = enterTable(game, "cargo-table");
  assert(table, "cargo table should open");
  rigFinalShowdown(table, {
    playerCards: playerWins ? ["AS", "AH"] : ["2C", "7D"],
    opponentCards: playerWins ? [["KD", "KC"], ["QD", "QC"]] : [["AD", "AC"], ["KD", "KC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: playerWins ? 120 : 20,
    opponentStacks: playerWins ? [10, 10] : [120, 80],
    pot: 90,
  });
  resolveTableAndLeave(game, "player-check");
  assert(game.state.mode === "search", "cargo hand should return to search");
  assert(run.completedTables.includes("cargo-table"), "cargo should be marked complete");
  return run;
}

function clearToMirrorHall(game) {
  const run = clearCargoForProgression(game, { playerWins: true });
  run.cashOnHand = Math.max(run.cashOnHand, 260);
  const ledger = enterTable(game, "ledger-cellar");
  assert(ledger, "ledger cellar should open after cargo");
  rigFinalShowdown(ledger, {
    playerCards: ["AD", "KH"],
    opponentCards: [["QD", "QS"], ["JD", "JC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 180,
    opponentStacks: [10, 10],
    pot: 110,
  });
  resolveTableAndLeave(game, "player-check");
  assert(game.state.mode === "search", "ledger cellar should return to search");
  assert(run.completedTables.includes("ledger-cellar"), "ledger cellar should be marked complete");
  return run;
}

function clearToEmbersTable(game) {
  const run = clearToMirrorHall(game);
  run.cashOnHand = Math.max(run.cashOnHand, 360);
  const mirror = enterTable(game, "mirror-hall");
  assert(mirror, "mirror hall should open before embers");
  rigFinalShowdown(mirror, {
    playerCards: ["AS", "AH"],
    opponentCards: [["KD", "KC"], ["QD", "QC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 220,
    opponentStacks: [10, 10],
    pot: 140,
  });
  resolveTableAndLeave(game, "player-check");
  assert(run.completedTables.includes("mirror-hall"), "mirror hall should be marked complete");
  return run;
}

function resolveTableAndLeave(game, action) {
  game.dispatch(action);
  if (game.state.mode === "table" && game.state.run?.currentTable?.pendingConclusion) {
    game.dispatch("continue-table");
  }
}

const scenarios = [];

function scenario(name, fn) {
  scenarios.push({ name, fn });
}

scenario("menu start-run consumes bankroll and enters search", () => {
  const { game } = bootGame({
    persistent: { vault: 3000, runCount: 0, winCount: 0, language: "en" },
  });
  game.dispatch("start-run");
  assert(game.state.mode === "search", "mode should be search");
  assert(game.state.run.cashOnHand === STANDARD_BANKROLL, "run bankroll should be standard");
  assert(game.state.persistent.vault === 3000 - STANDARD_BANKROLL, "vault should fund the run");
});

scenario("load-run without a snapshot stays on menu", () => {
  const { game } = bootGame({
    persistent: { vault: 3000, language: "en" },
  });
  game.dispatch("load-run");
  assert(game.state.mode === "menu", "mode should stay menu without save");
  assert(game.state.run === null, "run should still be null without save");
});

scenario("saved search snapshot loads correctly", () => {
  const first = freshRun();
  first.game.state.run.cashOnHand = 245;
  first.game.dispatch("gather-intel", { tableId: "cargo-table", layer: "rule" });
  const snapshot = JSON.parse(first.storage.getItem(RUN_SAVE_KEY));
  const second = bootGame({
    persistent: { vault: 3000 - STANDARD_BANKROLL, language: "en" },
    savedRun: snapshot,
  });
  second.game.dispatch("load-run");
  assert(second.game.state.mode === "search", "saved search should load back into search");
  assert(second.game.state.run.cashOnHand === 245, "search snapshot should preserve cash");
});

scenario("saved table snapshot loads back into table mode", () => {
  const first = freshRun();
  first.game.state.run.cashOnHand = 200;
  enterTable(first.game, "cargo-table");
  const snapshot = JSON.parse(first.storage.getItem(RUN_SAVE_KEY));
  const second = bootGame({
    persistent: { vault: 3000 - STANDARD_BANKROLL, language: "en" },
    savedRun: snapshot,
  });
  second.game.dispatch("load-run");
  assert(second.game.state.mode === "table", "saved table should restore table mode");
  assert(second.game.state.run.currentTable?.tableDef.id === "cargo-table", "restored table should match saved table");
});

scenario("entering the tavern locks the run out of hideout-only cash parking", () => {
  const first = freshRun();
  first.game.dispatch("enter-floor");
  assert(first.game.state.run.floorEntered === true, "enter-floor should mark the run as committed to the tavern");
  first.game.dispatch("stash-cash", { amount: 80 });
  assert(first.game.state.run.stashedCash === 0, "stash-cash should no longer work after the floor is entered");
  const snapshot = JSON.parse(first.storage.getItem(RUN_SAVE_KEY));
  assert(snapshot.run.floorEntered === true, "floor-entered flag should persist in save data");

  const second = bootGame({
    persistent: { vault: 3000 - STANDARD_BANKROLL, language: "en" },
    savedRun: snapshot,
  });
  second.game.dispatch("load-run");
  assert(second.game.state.run.floorEntered === true, "load-run should restore the floor-entered flag");
});

scenario("hideout no longer supports parking cash mid-run", () => {
  const { game } = freshRun();
  const cashBefore = game.state.run.cashOnHand;
  game.dispatch("stash-cash", { amount: 80 });
  assert(game.state.run.cashOnHand === cashBefore, "cash parking should not exist anymore");
  assert(game.state.run.stashedCash === 0, "stash value should remain unused");
});

scenario("intel gathering marks knowledge, blocks repeats, and blocks at zero AP", () => {
  const { game } = freshRun();
  game.dispatch("gather-intel", { tableId: "cargo-table", layer: "rule" });
  assert(game.state.run.intel["cargo-table"].rule === true, "rule intel should be learned");
  assert(game.state.run.actionPoints === 1, "intel should cost an action point");
  game.dispatch("gather-intel", { tableId: "cargo-table", layer: "rule" });
  assert(game.state.run.actionPoints === 1, "relearning intel should not spend an action point");
  game.dispatch("gather-intel", { tableId: "cargo-table", layer: "opponents" });
  assert(game.state.run.actionPoints === 0, "second unique intel should spend the last action point");
  game.dispatch("gather-intel", { tableId: "cargo-table", layer: "reward" });
  assert(game.state.run.intel["cargo-table"].reward === false, "zero AP should block more intel");
});

scenario("buying blocks when inventory is full", () => {
  const { game } = freshRun();
  fillInventoryToCapacity(game.state.run);
  const startingCash = game.state.run.cashOnHand;
  game.dispatch("buy-item", { itemId: "marked-lens" });
  assert(game.state.run.cashOnHand === startingCash, "full inventory should block purchase");
  assert(game.state.run.inventory.length === 4, "blocked purchase should not add an item");
});

scenario("selling valuables cashes out and clears them from inventory", () => {
  const { game } = freshRun();
  game.state.run.inventory.push(makeInventoryItem("valuable-1", "old-silver-lighter"));
  game.state.run.inventory.push(makeInventoryItem("valuable-2", "ivory-chip"));
  game.dispatch("sell-all-valuables");
  assert(game.state.run.cashOnHand === 300 + 45 + 60, "selling valuables should add their values");
  assert(game.state.run.inventory.length === 0, "valuables should leave inventory after sale");
});

scenario("inventory tools can be sold back for cash in the search phase", () => {
  const { game } = freshRun();
  game.state.run.inventory.push(makeInventoryItem("tool-1", "marked-lens"));
  const cashBefore = game.state.run.cashOnHand;
  game.dispatch("sell-item", { instanceId: "tool-1" });
  assert(game.state.run.cashOnHand === cashBefore + 20, "selling a tool should return its sell value");
  assert(!game.state.run.inventory.some((item) => item.id === "tool-1"), "sold tools should leave inventory");
});

scenario("reduce heat works once per search phase", () => {
  const { game } = freshRun();
  game.state.run.heat = 2;
  const sceneCost = getTavernSceneDef(game.state.run.tavernSceneId)?.heatReductionCost ?? 30;
  game.dispatch("reduce-heat");
  assert(game.state.run.heat === 1, "reduce-heat should lower heat");
  assert(game.state.run.cashOnHand === STANDARD_BANKROLL - sceneCost, "reduce-heat should charge the active tavern rate");
  game.dispatch("reduce-heat");
  assert(game.state.run.heat === 1, "second reduce-heat should be blocked in the same phase");
});

scenario("steadying drink lowers heat and blocks when heat is already calm", () => {
  const { game } = freshRun();
  game.state.run.heat = 2;
  game.state.run.inventory.push(makeInventoryItem("drink-1", "steadying-drink"));
  game.dispatch("use-search-item", { instanceId: "drink-1" });
  assert(game.state.run.heat === 1, "steadying drink should lower heat");
  assert(!game.state.run.inventory.some((item) => item.id === "drink-1"), "steadying drink should be consumed");
  game.state.run.inventory.push(makeInventoryItem("drink-2", "steadying-drink"));
  game.state.run.heat = 0;
  game.dispatch("use-search-item", { instanceId: "drink-2" });
  assert(game.state.run.inventory.some((item) => item.id === "drink-2"), "steadying drink should stay if there is no need");
});

scenario("disposable phone refreshes routes and reveals full table intel", () => {
  const { game } = freshRun();
  const firstRoute = game.state.run.fixedRouteOffer.id;
  game.state.run.inventory.push(makeInventoryItem("phone-refresh", "disposable-phone"));
  game.dispatch("use-search-item", { instanceId: "phone-refresh", intent: "refresh-route" });
  assert(game.state.run.fixedRouteOffer.id !== firstRoute, "phone refresh should rotate the fixed route");
  game.state.run.inventory.push(makeInventoryItem("phone-reveal", "disposable-phone"));
  game.dispatch("use-search-item", { instanceId: "phone-reveal", tableId: "mirror-hall" });
  assert(Object.values(game.state.run.intel["mirror-hall"]).every(Boolean), "phone reveal should uncover all intel layers");
});

scenario("fixed-route extraction enforces reservation, expiry, heat, and cash rules", () => {
  const { game } = freshRun();
  game.state.run.routeIntel.fixedWhisper = true;
  game.state.run.cashOnHand = 200;
  game.dispatch("extract-fixed");
  assert(game.state.mode === "search", "fixed extraction should fail without a reservation");

  game.state.run.fixedRouteReservation = {
    ...FIXED_ROUTE_POOL[0],
    expiresAfterSearch: 0,
  };
  game.state.run.searchIndex = 2;
  game.dispatch("extract-fixed");
  assert(game.state.mode === "search", "expired fixed route should fail");

  game.state.run.fixedRouteReservation = {
    ...FIXED_ROUTE_POOL[0],
    expiresAfterSearch: 4,
  };
  game.state.run.heat = 5;
  game.dispatch("extract-fixed");
  assert(game.state.mode === "search", "overheated fixed route should fail");

  game.state.run.heat = 0;
  game.state.run.cashOnHand = 70;
  game.state.run.fixedRouteReservation.finalCost = 90;
  game.dispatch("extract-fixed");
  assert(game.state.mode === "search", "fixed route should fail if you cannot pay final cost");

  game.state.run.cashOnHand = 80;
  game.state.run.fixedRouteReservation.finalCost = 10;
  game.state.run.fixedRouteReservation.maxHeat = 4;
  game.dispatch("extract-fixed");
  assert(game.state.mode === "summary", "fixed extraction should succeed when requirements are met");
  assert(game.state.latestSummary.success === true, "fixed extraction should produce a success summary");
});

scenario("general extraction enforces heat and fee rules", () => {
  const { game } = freshRun();
  game.state.run.routeIntel.publicExit = true;
  game.state.run.heat = 6;
  game.dispatch("extract-general");
  assert(game.state.mode === "search", "general extraction should fail at heat 6");
  game.state.run.heat = 0;
  game.state.run.cashOnHand = 20;
  game.dispatch("extract-general");
  assert(game.state.mode === "summary", "a broke general extraction with no other outs should collapse into failure");
  assert(game.state.latestSummary.success === false, "the dead-end extraction branch should resolve as a failed run");
});

scenario("general extraction settles once the public line is live and the fee is covered", () => {
  const { game } = freshRun();
  game.state.run.routeIntel.publicExit = true;
  game.state.run.cashOnHand = 200;
  game.state.run.stashedCash = 100;
  game.state.run.inventory.push(makeInventoryItem("valuable-general", "ivory-chip"));
  game.dispatch("extract-general");
  assert(game.state.mode === "summary", "general extraction should reach summary");
  assert(game.state.latestSummary.totalSettled > 0, "general extraction should settle value");
});

scenario("drop-bag extraction enforces fee and valuables requirements", () => {
  const cashFail = freshRun();
  cashFail.game.state.run.routeIntel.emergency = true;
  cashFail.game.state.run.cashOnHand = 5;
  cashFail.game.dispatch("extract-dropbag-cash");
  assert(cashFail.game.state.mode === "summary", "failing the last possible exit should collapse the run into summary");
  assert(cashFail.game.state.latestSummary.success === false, "unaffordable drop-bag cash should end as a failed run");

  const cashSuccess = freshRun();
  cashSuccess.game.state.run.routeIntel.emergency = true;
  cashSuccess.game.state.run.cashOnHand = 100;
  cashSuccess.game.dispatch("extract-dropbag-cash");
  assert(cashSuccess.game.state.mode === "summary", "drop-bag cash should succeed when fee is affordable");

  const goodsRun = freshRun();
  goodsRun.game.state.run.routeIntel.emergency = true;
  goodsRun.game.state.run.cashOnHand = 50;
  goodsRun.game.dispatch("extract-dropbag-valuables");
  assert(goodsRun.game.state.mode === "search", "drop-bag goods should fail without valuables");
  goodsRun.game.state.run.inventory.push(makeInventoryItem("valuable-dropbag", "gold-cased-watch"));
  goodsRun.game.dispatch("extract-dropbag-valuables");
  assert(goodsRun.game.state.mode === "summary", "drop-bag goods should succeed with valuables on hand");
  assert(goodsRun.game.state.latestSummary.settledValuables.length === 0, "drop-bag goods should dump the carried valuables");
});

scenario("failure summary salvages cash only when the wallet is present", () => {
  const noWallet = freshRun();
  noWallet.game.state.run.cashOnHand = 5;
  noWallet.game.dispatch("gather-intel", { tableId: "cargo-table", layer: "rule" });
  assert(noWallet.game.state.mode === "summary", "dead-end run should fail into summary");
  assert(noWallet.game.state.latestSummary.salvaged === 0, "failure should salvage nothing without the wallet");

  const withWallet = freshRun();
  withWallet.game.state.run.cashOnHand = 5;
  withWallet.game.state.run.inventory.push(makeInventoryItem("wallet-1", "false-bottom-wallet"));
  withWallet.game.dispatch("gather-intel", { tableId: "cargo-table", layer: "rule" });
  assert(withWallet.game.state.mode === "summary", "dead-end run should still fail with the wallet");
  assert(withWallet.game.state.latestSummary.salvaged === 5, "wallet should salvage up to the carried cash");
});

scenario("mirror hall stays locked until cargo clears and insufficient cash blocks table entry", () => {
  const locked = freshRun();
  locked.game.dispatch("enter-table", { tableId: "mirror-hall" });
  assert(locked.game.state.mode === "search", "mirror hall should stay locked before cargo clears");

  const broke = freshRun();
  broke.game.state.run.cashOnHand = 50;
  broke.game.dispatch("enter-table", { tableId: "cargo-table" });
  assert(broke.game.state.mode === "summary", "cargo dead-ends should now fail the run when no legal path remains");
  assert(broke.game.state.latestSummary.success === false, "the broke cargo branch should resolve as a failed run");
});

scenario("cargo reward can be blocked by a full inventory", () => {
  const { game } = freshRun();
  fillInventoryToCapacity(game.state.run);
  game.state.run.cashOnHand = 300;
  const table = enterTable(game, "cargo-table");
  rigFinalShowdown(table, {
    playerCards: ["AS", "AH"],
    opponentCards: [["KD", "KC"], ["QD", "QC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 140,
    opponentStacks: [10, 10],
    pot: 90,
  });
  resolveTableAndLeave(game, "player-check");
  assert(game.state.run.lastTableResult.rewardId === "ivory-chip", "cargo should still choose the signature reward");
  assert(game.state.run.lastTableResult.rewardAdded === false, "reward should fail to add when inventory is full");
});

scenario("mirror hall collateral returns on a winning final hand", () => {
  const { game } = freshRun();
  clearToMirrorHall(game);
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("collateral-1", "ivory-chip"));
  const table = enterTable(game, "mirror-hall", "collateral-1");
  assert(table.collateral?.itemId === "ivory-chip", "valuable collateral should attach to mirror hall");
  rigFinalShowdown(table, {
    playerCards: ["AS", "AH"],
    opponentCards: [["KD", "KC"], ["QD", "QC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 220,
    opponentStacks: [10, 10],
    pot: 120,
  });
  resolveTableAndLeave(game, "player-check");
  assert(game.state.run.lastTableResult.collateralReturned === true, "winning the final hand should return collateral");
  assert(game.state.run.lastTableResult.rewardId === "antique-coin", "winning with collateral should unlock the premium reward");
});

scenario("mirror hall collateral is lost on a losing final hand", () => {
  const { game } = freshRun();
  clearToMirrorHall(game);
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("collateral-2", "ivory-chip"));
  const table = enterTable(game, "mirror-hall", "collateral-2");
  rigFinalShowdown(table, {
    playerCards: ["2C", "7D"],
    opponentCards: [["AS", "AH"], ["KD", "KC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 20,
    opponentStacks: [200, 60],
    pot: 120,
  });
  resolveTableAndLeave(game, "player-check");
  assert(game.state.run.lastTableResult.collateralReturned === false, "losing the final hand should lose collateral");
  assert(game.state.run.lastTableResult.collateralLost === true, "loss should mark collateral as lost");
});

scenario("player fold resolution records a fold-type last hand", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  const table = enterTable(game, "cargo-table");
  table.handNumber = table.totalHands;
  table.street = "preflop";
  table.pot = 50;
  table.currentBet = 20;
  table.players[0].currentBet = 0;
  table.players[0].stack = 60;
  table.players[1].stack = 60;
  table.players[2].stack = 0;
  table.players[2].folded = true;
  table.toAct = ["player"];
  table.currentActorId = "player";
  table.legalActions = {
    player: { fold: true, call: true, raise: false },
  };
  resolveTableAndLeave(game, "player-fold");
  assert(game.state.run.lastTableResult.lastHandSummary.type === "fold", "fold resolution should record a fold summary");
});

scenario("illegal player actions do not advance the table", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  const table = enterTable(game, "cargo-table");
  table.currentBet = 0;
  table.players.forEach((participant, index) => {
    participant.currentBet = 0;
    participant.folded = false;
    participant.stack = index === 0 ? 50 : 60;
  });
  table.toAct = ["player"];
  table.currentActorId = "player";
  table.legalActions = {
    player: { check: true, raise: true },
  };
  const potBefore = table.pot;
  game.dispatch("player-call");
  assert(game.state.mode === "table", "illegal action should keep the game on the table");
  assert(table.pot === potBefore, "illegal action should not change the pot");
});

scenario("all-in commits the full stack and keeps the hand moving", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  const table = enterTable(game, "cargo-table");
  table.currentBet = 0;
  table.players.forEach((participant, index) => {
    participant.currentBet = 0;
    participant.folded = false;
    participant.stack = index === 0 ? 50 : 60;
  });
  table.toAct = ["player", table.players[1].id, table.players[2].id];
  table.currentActorId = "player";
  table.legalActions = {
    player: { check: true, raise: true, allIn: true },
    [table.players[1].id]: {},
    [table.players[2].id]: {},
  };
  const potBefore = table.pot;
  game.dispatch("player-all-in");
  const resolvedTable = game.state.run?.currentTable ?? table;
  assert(
    resolvedTable.players[0].lastAction === "all-in" ||
      resolvedTable.log.some((line) => /shove|全下/i.test(line)) ||
      game.state.mode === "search",
    "all-in should be recorded as the player's chosen action",
  );
  assert(
    resolvedTable.pot > potBefore || game.state.mode === "search",
    "all-in should enlarge the pot before the hand settles",
  );
  assert(
    resolvedTable.pendingNextHand ||
      resolvedTable.pendingConclusion ||
      game.state.mode === "search",
    "all-in should either pause the resolved hand or return cleanly to search",
  );
});

scenario("marked lens and signal lighter enforce their valid and invalid branches", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("lens-1", "marked-lens"));
  let table = enterTable(game, "cargo-table");
  game.dispatch("use-table-item", { instanceId: "lens-1" });
  assert(Boolean(table.peekCard), "marked lens should reveal the next community card");
  assert(!game.state.run.inventory.some((item) => item.id === "lens-1"), "marked lens should be consumed on use");

  clearToMirrorHall(game);
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("lighter-1", "signal-lighter"));
  table = enterTable(game, "mirror-hall");
  game.dispatch("use-table-item", { instanceId: "lighter-1" });
  assert(game.state.run.inventory.some((item) => item.id === "lighter-1"), "signal lighter should stay if no target was chosen");
  const targetId = table.players.find((participant) => participant.id !== "player").id;
  game.dispatch("use-table-item", { instanceId: "lighter-1", targetId });
  assert(Boolean(table.signalRead), "signal lighter should create a read when a target is chosen");
  assert(!game.state.run.inventory.some((item) => item.id === "lighter-1"), "signal lighter should be consumed on use");
});

scenario("marked lens forces the actual next community card even after sleeve clip", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("lens-1", "marked-lens"));
  game.state.run.inventory.push(makeInventoryItem("clip-1", "sleeve-clip"));
  const table = enterTable(game, "cargo-table");
  table.street = "preflop";
  table.community = [];
  table.turnCounter = 0;
  table.currentBet = 0;
  table.players.forEach((participant) => {
    participant.currentBet = 0;
  });
  table.toAct = ["player"];
  table.currentActorId = "player";
  table.legalActions = { player: { fold: true, check: true, raise: true, allIn: true } };

  game.dispatch("use-table-item", { instanceId: "lens-1" });
  const peeked = cardCode(table.peekCard);
  assert(Boolean(peeked), "marked lens should set a peeked community card");

  game.dispatch("use-table-item", { instanceId: "clip-1" });
  assert(cardCode(table.peekCard) === peeked, "sleeve clip should not consume the peeked community card");

  game.dispatch("player-check");
  assert(table.street === "flop", "checking should advance to the flop in this rigged state");
  assert(cardCode(table.community[0]) === peeked, "the first dealt flop card should match the marked lens preview");
});

scenario("sleeve clip swaps a hole card only in its legal window", () => {
  const { game } = freshRun();
  game.state.run.cashOnHand = 300;
  game.state.run.inventory.push(makeInventoryItem("clip-1", "sleeve-clip"));
  const table = enterTable(game, "cargo-table");
  table.street = "preflop";
  table.turnCounter = 0;
  table.currentActorId = "player";
  table.toAct = ["player"];
  table.legalActions = {
    player: { check: true, raise: true },
  };
  const oldSecondCard = `${table.players[0].holeCards[1].rank}${table.players[0].holeCards[1].suit}`;
  game.dispatch("use-table-item", { instanceId: "clip-1" });
  const newSecondCard = `${table.players[0].holeCards[1].rank}${table.players[0].holeCards[1].suit}`;
  assert(oldSecondCard !== newSecondCard, "sleeve clip should swap the second hole card");
  assert(!game.state.run.inventory.some((item) => item.id === "clip-1"), "sleeve clip should be consumed on use");

  game.state.run.inventory.push(makeInventoryItem("clip-2", "sleeve-clip"));
  table.street = "flop";
  game.dispatch("use-table-item", { instanceId: "clip-2" });
  assert(game.state.run.inventory.some((item) => item.id === "clip-2"), "sleeve clip should stay if used outside its legal window");
});

scenario("sleeve clip is reachable before the last playable table", () => {
  const { game } = freshRun();
  clearCargoForProgression(game, { playerWins: true });
  assert(
    game.state.run.shopStock.includes("sleeve-clip"),
    "the stage before Mirror Hall should stock Sleeve Clip so its table branch is reachable",
  );
});

scenario("embers table profitable close applies its heat relief", () => {
  const { game } = freshRun();
  const run = clearToEmbersTable(game);
  run.cashOnHand = Math.max(run.cashOnHand, 400);
  run.heat = 3;
  const scene = getTavernSceneDef(run.tavernSceneId);
  const expectedEntryHeat = Math.min(
    6,
    run.heat + 2 + (scene?.entryHeatBonus ?? 0),
  );
  const table = enterTable(game, "embers-table");
  assert(table, "embers table should open after mirror hall");
  assert(run.heat === expectedEntryHeat, "embers buy-in should add table and tavern heat before relief");
  rigFinalShowdown(table, {
    playerCards: ["AS", "AH"],
    opponentCards: [["KD", "KC"], ["QD", "QC"]],
    boardCards: ["2H", "5H", "9S", "JC", "3D"],
    playerStack: 260,
    opponentStacks: [10, 10],
    pot: 160,
  });
  resolveTableAndLeave(game, "player-check");
  assert(run.heat === Math.max(0, expectedEntryHeat - 1), "profitable embers close should cool heat by one");
});

scenario("general extraction at heat five uses the configured lockdown surcharge", () => {
  const { game } = freshRun();
  const run = game.state.run;
  game.dispatch("enter-floor");
  run.heat = 5;
  const scene = getTavernSceneDef(run.tavernSceneId);
  const costFor = (cash) =>
    (scene?.generalExtractionFlatFee ?? 30) +
    Math.floor(cash * (scene?.generalExtractionRate ?? 0.15)) +
    (scene?.lockdownSurcharge ?? 60);
  let affordableCash = 1;
  while (affordableCash < 1000 && affordableCash < costFor(affordableCash)) {
    affordableCash += 1;
  }
  assert(affordableCash < 1000, "test should find an affordable heat-five general extraction amount");

  run.cashOnHand = affordableCash - 1;
  game.dispatch("extract-general");
  assert(game.state.mode === "search", "general extraction should not succeed without the heat-five surcharge");

  run.cashOnHand = affordableCash;
  game.dispatch("extract-general");
  assert(game.state.mode === "summary", "general extraction should succeed at heat five when surcharge is affordable");
  assert(
    game.state.latestSummary.totalSettled === affordableCash - costFor(affordableCash),
    "heat-five general extraction should subtract base fee plus lockdown surcharge",
  );
});

const results = [];
for (const entry of scenarios) {
  try {
    entry.fn();
    results.push({ name: entry.name, status: "passed" });
  } catch (error) {
    results.push({
      name: entry.name,
      status: "failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

const outputDir = path.resolve("output");
fs.mkdirSync(outputDir, { recursive: true });
const reportPath = path.join(outputDir, "full-game-flow-report.json");
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

const failures = results.filter((result) => result.status === "failed");
console.log(JSON.stringify({ total: results.length, passed: results.length - failures.length, failed: failures.length, reportPath }, null, 2));
if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure.name}\n  ${failure.message}`);
  }
  process.exitCode = 1;
}
