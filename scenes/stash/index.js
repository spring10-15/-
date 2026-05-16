export function renderStashScene(state, helpers) {
  const {
    activeSearchModal,
    buildExtractionPreview,
    currentLanguage,
    getItemDef,
    getRunValuables,
    getVisibleDestinationIds,
    itemCopy,
    money,
    renderCompactStatChip,
    renderFirstPersonFrame,
    renderSceneHotspot,
    tableCopy,
    t,
  } = helpers;

  const run = state.run;
  const extractionPreview = buildExtractionPreview(run);
  const valuables = getRunValuables(run);
  const usableItems = run.inventory.filter((item) => getItemDef(item.itemId).kind === "usable");
  const searchItems = usableItems.filter((item) => getItemDef(item.itemId).phase === "search");

  return `
    <div class="scene-shell search-shell stash-shell fixed-scene-shell">
      ${renderFirstPersonFrame("search")}
      <section class="minimal-scene-hud">
        <div class="minimal-scene-title">
          <strong>${t("Hideout")}</strong>
        </div>
        <div class="minimal-scene-stats">
          ${renderCompactStatChip(t("Cash on hand"), money(run.cashOnHand), "warm")}
          ${renderCompactStatChip(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
          ${renderCompactStatChip(t("Action points"), `${run.actionPoints}/2`, run.actionPoints > 0 ? "good" : "bad")}
        </div>
      </section>
      <section class="scene-hotspot-stage stash-hotspot-stage">
        <div class="scene-hotspot-layer stash-hotspot-layer">
          ${renderSceneHotspot({
            className: "stash-hotspot-assets",
            modal: "services",
            eyebrow: t("Hideout"),
            title: t("Personal Assets"),
            note: t("Cash, Heat, Exposure"),
          })}
          ${renderSceneHotspot({
            className: "stash-hotspot-folder",
            modal: "folder",
            eyebrow: t("Case Folder"),
            title: t("Inventory And Notes"),
            note: t("Battle Records"),
          })}
          ${renderSceneHotspot({
            className: "stash-hotspot-floor",
            tone: "warn",
            size: "hero",
            action: "enter-floor",
            eyebrow: t("Step Onto The Floor"),
            title: t("Hit the Tavern"),
            note: "",
          })}
        </div>
      </section>
      ${activeSearchModal ? renderStashSceneModal(state, run, activeSearchModal, extractionPreview, searchItems, helpers) : ""}
    </div>
  `;
}

function renderStashSceneModal(state, run, modal, extractionPreview, searchItems, helpers) {
  const { t } = helpers;
  if (modal !== "services" && modal !== "folder") {
    return "";
  }

  return `
    <div class="scene-modal-layer">
      <button class="scene-modal-backdrop" data-close-search-modal aria-label="${t("Close")}"></button>
      <section class="scene-modal panel ${modal}-modal">
        <div class="scene-modal-head">
          <div>
            <p class="eyebrow">${modal === "services" ? t("Hideout") : t("Case Folder")}</p>
            <h2>${modal === "services" ? t("Personal Assets") : t("Inventory And Notes")}</h2>
          </div>
          <button class="ghost close-modal-button" data-close-search-modal>${t("Close")}</button>
        </div>
        <div class="scene-modal-body">
          ${
            modal === "services"
              ? renderStashServicesModal(run, extractionPreview, searchItems, helpers, { mode: "stash-only" })
              : renderStashFolderModal(run, extractionPreview, helpers, state.persistent)
          }
        </div>
      </section>
    </div>
  `;
}

export function renderStashServicesModal(run, extractionPreview, searchItems, helpers, options = {}) {
  const { t, money, activeTab, renderTabBar, getRunValuables } = helpers;
  const floorOnly = options.mode === "floor";
  const stashOnly = options.mode === "stash-only";
  const valuables = getRunValuables(run);
  const ownedUsableItems = run.inventory.filter((item) => helpers.getItemDef(item.itemId).kind === "usable");
  const ownedItemCounts = ownedUsableItems.reduce((map, item) => {
    map.set(item.itemId, (map.get(item.itemId) ?? 0) + 1);
    return map;
  }, new Map());
  if (stashOnly) {
    return `
      <div class="drawer-stack">
        <div class="drawer-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${t("Hideout")}</p>
              <h3>${t("Personal Assets")}</h3>
            </div>
          </div>
          <div class="preview-grid compact-preview">
            ${helpers.renderPreviewCell(t("Cash on hand"), money(run.cashOnHand), "warm")}
            ${helpers.renderPreviewCell(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
            ${helpers.renderPreviewCell(t("Carry"), valuables.length ? `${valuables.length}` : "0", valuables.length ? "warn" : "neutral")}
          </div>
          <div class="button-row station-action-row">
            <button class="secondary" data-action="reduce-heat" ${
              run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 || run.cashOnHand < 30 ? "disabled" : ""
            }>${t("Pay 30 to Lower Heat")}</button>
            <button class="secondary" data-action="sell-all-valuables" ${!valuables.length || run.actionPoints <= 0 ? "disabled" : ""}>${t("Sell All Valuables")}</button>
          </div>
        </div>
        <div class="drawer-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${t("Inventory And Notes")}</p>
              <h3>${t("Inventory And Notes")}</h3>
            </div>
          </div>
          <div class="inventory-grid">
            ${run.inventory.length ? run.inventory.map(helpers.renderInventoryCard).join("") : `<div class="item-card"><p class="micro">${t("The pockets are still light.")}</p></div>`}
          </div>
        </div>
      </div>
    `;
  }
  if (floorOnly) {
    return `
      <div class="tavern-services-layout two-column-layout">
        <div class="drawer-card tavern-menu-board tavern-shelf-board">
          <div class="section-heading">
            <div>
              <h3>${t("Bar Shelf")}</h3>
            </div>
          </div>
          <div class="modal-grid tavern-menu-grid">
            ${run.shopStock.map((itemId) => renderShopCard(run, itemId, helpers)).join("")}
          </div>
        </div>
        <div class="tavern-counter-column">
          <div class="drawer-card tavern-house-account-card">
            <div class="section-heading">
              <div>
                <h3>${t("Bar Counter")}</h3>
              </div>
            </div>
            <div class="preview-grid compact-preview">
              ${helpers.renderPreviewCell(t("Cash on hand"), money(run.cashOnHand), "warm")}
              ${helpers.renderPreviewCell(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
              ${helpers.renderPreviewCell(t("Action points"), `${run.actionPoints}/2`, run.actionPoints > 0 ? "good" : "bad")}
              ${helpers.renderPreviewCell(t("Carry"), valuables.length ? `${valuables.length}` : "0", valuables.length ? "warn" : "neutral")}
            </div>
            <div class="button-row station-action-row">
              <button class="secondary" data-action="reduce-heat" ${
                run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 || run.cashOnHand < 30 ? "disabled" : ""
              }>${t("Pay 30 to Lower Heat")}</button>
              <button class="secondary" data-action="sell-all-valuables" ${!valuables.length || run.actionPoints <= 0 ? "disabled" : ""}>${t("Sell All Valuables")}</button>
            </div>
          </div>
          <div class="drawer-card tavern-carry-tools-card">
            <div class="section-heading">
              <div>
                <h3>${t("Inventory And Notes")}</h3>
              </div>
            </div>
            <div class="inventory-grid">
              ${
                ownedUsableItems.length
                  ? Array.from(ownedItemCounts.entries())
                      .map(([itemId, count]) => {
                        const item = helpers.itemCopy(itemId);
                        return `
                          <div class="item-card">
                            <p class="eyebrow">${item.phase === "table" ? t("Table Tool") : t("Floor Tool")}</p>
                            <div class="stat-row"><span class="stat-label">${item.name}</span><span class="stat-value">x${count}</span></div>
                            <p class="micro">${item.description}</p>
                          </div>
                        `;
                      })
                      .join("")
                  : `<div class="item-card"><p class="micro">${t("The pockets are still light.")}</p></div>`
              }
            </div>
          </div>
          ${
            searchItems.length
              ? `
                <div class="drawer-card tavern-carry-tools-card">
                  <div class="section-heading">
                    <div>
                      <h3>${t("Use What You're Carrying")}</h3>
                    </div>
                  </div>
                  <div class="table-grid compact-destination-grid">
                    ${searchItems.map((item) => renderSearchItemUse(run, item, helpers)).join("")}
                  </div>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  }
  return `
    <div class="drawer-stack">
      <div class="drawer-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${t("Ledger Counter")}</p>
            <h3>${t("Personal Assets")}</h3>
          </div>
        </div>
        <div class="preview-grid compact-preview">
          ${helpers.renderPreviewCell(t("Cash on hand"), money(run.cashOnHand), "warm")}
          ${helpers.renderPreviewCell(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
          ${helpers.renderPreviewCell(t("Action points"), `${run.actionPoints}/2`, run.actionPoints > 0 ? "good" : "bad")}
          ${helpers.renderPreviewCell(t("Carry"), valuables.length ? `${valuables.length}` : "0", valuables.length ? "warn" : "neutral")}
        </div>
        <div class="button-row station-action-row">
          <button class="secondary" data-action="reduce-heat" ${
            run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 || run.cashOnHand < 30 ? "disabled" : ""
          }>${t("Pay 30 to Lower Heat")}</button>
          <button class="secondary" data-action="sell-all-valuables" ${!valuables.length || run.actionPoints <= 0 ? "disabled" : ""}>${t("Sell All Valuables")}</button>
        </div>
      </div>
      <div class="drawer-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${t("Back Shelf")}</p>
            <h3>${t("Services And Tools")}</h3>
          </div>
        </div>
        <div class="table-grid compact-destination-grid">
          ${run.shopStock.map((itemId) => renderShopCard(run, itemId, helpers)).join("")}
          ${searchItems.map((item) => renderSearchItemUse(run, item, helpers)).join("")}
        </div>
      </div>
      <div class="drawer-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${t("Coat Trade")}</p>
            <h3>${t("Inventory And Notes")}</h3>
          </div>
        </div>
        <div class="inventory-grid">
          ${run.inventory.length ? run.inventory.map(helpers.renderInventoryCard).join("") : `<div class="item-card"><p class="micro">${t("The pockets are still light.")}</p></div>`}
        </div>
      </div>
    </div>
  `;
}

export function renderStashFolderModal(run, extractionPreview, helpers, persistent = null, options = {}) {
  const { t, getRunValuables, TABLE_ORDER, money, itemCopy, opponentCopy, currentLanguage, activeTab, renderTabBar } = helpers;
  const zh = currentLanguage() === "zh";
  const valuables = getRunValuables(run);
  const roomResults = [
    ...(run.roomResults ?? (run.lastTableResult ? [run.lastTableResult] : [])),
    ...((persistent?.roomHistory ?? []).filter((entry) => !(run.roomResults ?? []).some((live) => live.tableId === entry.tableId && live.net === entry.net))),
  ].slice(-8);
  const intelTables = TABLE_ORDER.filter((tableId) => run.intel?.[tableId]?.opponents || run.completedTables.includes(tableId));
  const usefulItems = run.inventory.filter((item) => {
    const def = helpers.getItemDef(item.itemId);
    return def.kind === "usable" || def.unlockRoute;
  });
  const persistentHistory = persistent?.history ?? [];
  const knownOpponents = Object.entries(persistent?.knownOpponents ?? {});
  const runActions = (run.log ?? []).slice(-8).reverse();
  const securedItems = (persistent?.securedItems ?? []).slice(0, 6).map((itemId) => itemCopy(itemId).name);
  const tabGroup = options.variant === "tavern" ? "searchFolder" : "stashFolder";
  const defaultTab = options.variant === "tavern" ? "run" : "inventory";
  const selectedTab = activeTab(tabGroup, defaultTab);
  const tabs = options.variant === "tavern"
    ? [
        { value: "run", label: zh ? "本轮记录" : "Run Notes" },
        { value: "opponents", label: zh ? "对手情报" : "Opponents" },
        { value: "archive", label: zh ? "长期档案" : "Archive" },
      ]
    : [
        { value: "inventory", label: zh ? "当前物品" : "Inventory" },
        { value: "opponents", label: zh ? "对手情报" : "Opponents" },
        { value: "archive", label: zh ? "长期档案" : "Archive" },
      ];
  const contextClass = options.variant === "tavern" ? "tavern-memo" : "stash-memo";
  const headerTitle = options.variant === "tavern"
    ? (zh ? "本轮战术摘要" : "Run Tactical Brief")
    : t("Inventory And Notes");
  const tabContent = selectedTab === "opponents"
    ? renderMemoOpponentPanel(knownOpponents, intelTables, run, helpers)
    : selectedTab === "archive"
      ? renderMemoArchivePanel(persistent, roomResults, knownOpponents, helpers)
      : options.variant === "tavern"
        ? renderMemoRunPanel(run, extractionPreview, roomResults, runActions, usefulItems, helpers)
        : renderMemoInventoryPanel(run, extractionPreview, valuables, usefulItems, helpers);
  return `
    <div class="memo-dashboard ${contextClass}">
      <div class="memo-dashboard-head">
        <div>
          <p class="eyebrow">${options.variant === "tavern" ? (zh ? "备忘录" : "Memo") : t("Inventory And Notes")}</p>
          <h3>${headerTitle}</h3>
        </div>
        ${renderTabBar(tabGroup, tabs)}
      </div>
      ${renderMemoSummary(run, extractionPreview, persistent, helpers)}
      <div class="memo-tab-panel">
        ${tabContent}
      </div>
    </div>
  `;
}

function renderMemoSummary(run, extractionPreview, persistent, helpers) {
  const { t, money, getRunValuables, TABLE_ORDER, getTableDef } = helpers;
  const completed = run.completedTables.length;
  const totalAvailableRooms = TABLE_ORDER.filter((tableId) => {
    const table = getTableDef(tableId);
    return !table.unlocksAfter || run.completedTables.includes(table.unlocksAfter);
  }).length;
  return `
    <section class="memo-summary-grid">
      ${helpers.renderCompactStatChip(t("Cash on hand"), money(run.cashOnHand), "warm")}
      ${helpers.renderCompactStatChip(t("Carry on hand"), money(extractionPreview.valuableTotal ?? 0), "cool")}
      ${helpers.renderCompactStatChip(t("Heat"), `${run.heat}`, run.heat >= 5 ? "bad" : run.heat >= 3 ? "warn" : "cool")}
      ${helpers.renderCompactStatChip(t("Cleared"), `${completed}/${Math.max(completed, totalAvailableRooms)}`, completed ? "good" : "neutral")}
    </section>
  `;
}

function renderMemoRunPanel(run, extractionPreview, roomResults, runActions, usefulItems, helpers) {
  const { t, currentLanguage } = helpers;
  const zh = currentLanguage() === "zh";
  return `
    <div class="memo-two-column">
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${zh ? "最近动作" : "Recent Actions"}</p>
          <h3>${zh ? "本轮时间线" : "Run Timeline"}</h3>
          ${renderMemoTimeline(roomResults, runActions, helpers)}
        </div>
      </section>
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Useful tools")}</p>
          <h3>${zh ? "当前可用物品" : "Usable Items"}</h3>
          ${renderMemoItems(usefulItems, helpers, { empty: t("The pockets are still light.") })}
        </div>
        <div class="notebook-section">
          <p class="eyebrow">${zh ? "撤离判断" : "Exit Read"}</p>
          <h3>${zh ? "当前撤离压力" : "Current Pressure"}</h3>
          <p class="micro">${run.heat >= 6 ? (zh ? "风声已经封场，会尝试强制撤离；没有可用路线就会被捕。" : "Lockdown heat will force an exit; no route means arrest.") : run.heat >= 5 ? (zh ? "公开撤离会加价，优先找隐藏路线或降风声。" : "Public exit is costly. Prefer hidden routes or heat reduction.") : (zh ? "仍可继续搜、打、撤，但别让风声滚起来。" : "Still flexible. Keep heat from snowballing.")}</p>
        </div>
      </section>
    </div>
  `;
}

function renderMemoInventoryPanel(run, extractionPreview, valuables, usefulItems, helpers) {
  const { t, money, itemCopy } = helpers;
  const valuablesMarkup = valuables.length
    ? renderMemoItems(valuables, helpers, { valuable: true })
    : `<p class="micro">${t("No side reward")}</p>`;
  return `
    <div class="memo-two-column">
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Carry on hand")}</p>
          <h3>${t("Carry on hand")}</h3>
          <div class="ledger-line"><span>${t("Carry on hand")}</span><strong>${valuables.length ? `+${money(extractionPreview.valuableTotal)}` : "0"}</strong></div>
          <div class="ledger-line"><span>${t("Inventory And Notes")}</span><strong>${run.inventory.length}</strong></div>
          ${valuablesMarkup}
        </div>
      </section>
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Useful tools")}</p>
          <h3>${t("Useful tools")}</h3>
          ${renderMemoItems(usefulItems, helpers, { empty: t("The pockets are still light.") })}
        </div>
      </section>
    </div>
  `;
}

function renderMemoOpponentPanel(knownOpponents, intelTables, run, helpers) {
  const { t, opponentCopy } = helpers;
  const persistentCards = knownOpponents.slice(0, 8).map(([opponentId, info]) => {
    const name = opponentCopy(opponentId)?.name ?? opponentId;
    return `
      <article class="memo-person-card">
        <div class="ledger-line"><span>${name}</span><strong>${info.seen ?? 0}x</strong></div>
        <p class="micro">${info.archetypeKnown && info.archetype ? `${t("Read")}: ${t(info.archetype)}` : t("No opponent intel yet.")}</p>
        <p class="micro">${info.lastAction ? `${t("Last move")} ${t(formatActionForMemo(info.lastAction))}` : t("No opponent intel yet.")}</p>
      </article>
    `;
  });
  const tableIntel = intelTables.map((tableId) => renderNotebookIntelEntry(run, tableId, helpers));
  return `
    <div class="memo-two-column">
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Opponent Intel")}</p>
          <h3>${t("Opponent Intel")}</h3>
          <div class="memo-card-grid">${persistentCards.length ? persistentCards.join("") : `<p class="micro">${t("No opponent intel yet.")}</p>`}</div>
        </div>
      </section>
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Battle Records")}</p>
          <h3>${t("Battle Records")}</h3>
          <div class="intel-ledger">${tableIntel.length ? tableIntel.join("") : `<p class="micro">${t("No opponent intel yet.")}</p>`}</div>
        </div>
      </section>
    </div>
  `;
}

function renderMemoArchivePanel(persistent, roomResults, knownOpponents, helpers) {
  const { t, money, currentLanguage } = helpers;
  const zh = currentLanguage() === "zh";
  const securedItems = (persistent?.securedItems ?? []).slice(0, 6);
  const history = persistent?.history ?? [];
  return `
    <div class="memo-two-column">
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Career Ledger")}</p>
          <h3>${t("Career Ledger")}</h3>
          <div class="ledger-line"><span>${t("Vault")}</span><strong>${money(persistent?.vault ?? 0)}</strong></div>
          <div class="ledger-line"><span>${t("Career Cash")}</span><strong>${money(persistent?.careerCash ?? persistent?.vault ?? 0)}</strong></div>
          <div class="ledger-line"><span>${t("Runs")}</span><strong>${persistent?.runCount ?? 0}</strong></div>
          <div class="ledger-line"><span>${t("Arrests")}</span><strong>${persistent?.arrestCount ?? 0}</strong></div>
          <p class="micro">${securedItems.length ? `${zh ? "长期奖励" : "Secured"} ${securedItems.length}` : t("No side reward")}</p>
        </div>
      </section>
      <section class="notebook-page memo-card-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Run Trail")}</p>
          <h3>${t("Run Trail")}</h3>
          <div class="intel-ledger">
            ${
              history.length
                ? history.slice(0, 5).map((entry) => `
                  <article class="record-ledger-entry">
                    <div class="ledger-line"><span>${entry.success ? t("Extracted") : t("Compromised")}</span><strong>${entry.success ? `+${money(entry.totalSettled ?? 0)}` : `-${money(entry.lostCash ?? 0)}`}</strong></div>
                    <p class="micro">${entry.routeLabel ?? entry.reason ?? t("No tavern record yet.")}</p>
                  </article>
                `).join("")
                : `<p class="micro">${t("No tavern record yet.")}</p>`
            }
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderMemoTimeline(roomResults, runActions, helpers) {
  const { t, money } = helpers;
  const entries = [
    ...roomResults.slice(-4).reverse().map((result) => ({
      label: result.tableName,
      value: result.net >= 0 ? `+${money(result.net)}` : `-${money(Math.abs(result.net))}`,
      text: result.rewardName ? `${t("Reward")} ${result.rewardName}` : t("No side reward"),
    })),
    ...runActions.slice(0, 5).map((entry) => ({
      label: t("Current Run"),
      value: t("Recorded"),
      text: entry,
    })),
  ].slice(0, 6);
  return `
    <div class="memo-timeline">
      ${
        entries.length
          ? entries.map((entry) => `
            <article class="memo-timeline-row">
              <span></span>
              <div>
                <div class="ledger-line"><span>${entry.label}</span><strong>${entry.value}</strong></div>
                <p class="micro">${entry.text}</p>
              </div>
            </article>
          `).join("")
          : `<p class="micro">${t("No tavern record yet.")}</p>`
      }
    </div>
  `;
}

function renderMemoItems(items, helpers, options = {}) {
  const { t, money, itemCopy, getItemDef } = helpers;
  if (!items.length) {
    return `<p class="micro">${options.empty ?? t("The pockets are still light.")}</p>`;
  }
  const grouped = Array.from(items.reduce((map, item) => {
    const current = map.get(item.itemId) ?? { itemId: item.itemId, count: 0 };
    current.count += 1;
    map.set(item.itemId, current);
    return map;
  }, new Map()).values());
  return `
    <div class="memo-card-grid">
      ${grouped.slice(0, 8).map(({ itemId, count }) => {
        const copy = itemCopy(itemId);
        const def = getItemDef(itemId);
        const value = def.kind === "valuable" ? money(def.value) : t("Tool");
        return `
          <article class="memo-item-card">
            <div class="ledger-line"><span>${copy.name}</span><strong>${count > 1 ? `${count}x` : value}</strong></div>
            <p class="micro">${copy.description}</p>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function formatActionForMemo(action) {
  if (action === "all-in") return "All-in";
  if (!action) return "No opponent intel yet.";
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function renderNotebookIntelEntry(run, tableId, helpers) {
  const { t, tableCopy } = helpers;
  const intel = run.intel[tableId];
  const table = tableCopy(tableId);
  const lines = ["rule", "opponents", "reward"]
    .filter((layer) => intel[layer])
    .map((layer) => table.hiddenInfo[layer]);
  return `
    <article class="record-ledger-entry intel-entry">
      <div class="ledger-line"><span>${table.name}</span><strong>${lines.length}/3</strong></div>
      <p class="micro">${lines.length ? lines.join(" / ") : t("No opponent intel yet.")}</p>
    </article>
  `;
}

export function renderShopCard(run, itemId, helpers) {
  const { money, itemCopy, INVENTORY_SLOTS, inventorySlotsUsed, t } = helpers;
  const item = itemCopy(itemId);
  const disabled =
    run.actionPoints <= 0 ||
    run.cashOnHand < item.buy ||
    inventorySlotsUsed(run.inventory) + item.slots > INVENTORY_SLOTS;
  return `
    <div class="item-card shop-card ${item.phase === "table" ? "table-tool-card" : "search-tool-card"}">
      <p class="eyebrow">${item.phase === "table" ? t("Table Tool") : t("Floor Tool")}</p>
      <div class="stat-row"><span class="stat-label">${item.name}</span><span class="stat-value">${money(
        item.buy,
      )}</span></div>
      <p class="micro">${item.description}</p>
      <button class="secondary" data-action="buy-item" data-item-id="${item.id}" ${
        disabled ? "disabled" : ""
      }>${t("Buy")}</button>
    </div>
  `;
}

export function renderSearchItemUse(run, item, helpers) {
  const { t, itemCopy, getVisibleDestinationIds, tableCopy, currentLanguage } = helpers;
  const def = itemCopy(item.itemId);
  const visibleDestinations = getVisibleDestinationIds(run);
  if (item.itemId === "steadying-drink") {
    return `
      <div class="item-card search-item-card">
        <p class="eyebrow">${t("Search Item")}</p>
        <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">${t("Heat -1")}</span></div>
        <p class="micro">${def.description}</p>
        <button class="secondary" data-action="use-search-item" data-instance-id="${item.id}" ${
          run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 ? "disabled" : ""
        }>${t("Use Drink")}</button>
      </div>
    `;
  }

  return `
    <div class="item-card search-item-card">
      <p class="eyebrow">${t("Search Item")}</p>
      <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">${t("Burn once")}</span></div>
      <p class="micro">${def.description}</p>
      <div class="choice-stack">
        ${visibleDestinations.map(
          (tableId) => `
            <button class="secondary" data-action="use-search-item" data-instance-id="${item.id}" data-table-id="${tableId}" ${
              run.actionPoints <= 0 ? "disabled" : ""
            }>
              ${helpers.tm("revealTableButton", { table: tableCopy(tableId).name })}
            </button>
          `,
        ).join("")}
        <button class="ghost" data-action="use-search-item" data-instance-id="${item.id}" data-intent="refresh-route" ${
          run.actionPoints <= 0 ? "disabled" : ""
        }>${currentLanguage() === "zh" ? "刷新保留路线" : t("Refresh Fixed Route")}</button>
      </div>
    </div>
  `;
}

export function renderIntelCard(run, tableId, helpers, options = {}) {
  const { t, currentLanguage, tableCopy } = helpers;
  const intel = run.intel[tableId];
  const table = tableCopy(tableId);
  const intelOnly = options.intelOnly;
  return `
    <div class="item-card intel-card ${tableId}">
      <p class="eyebrow">${intelOnly ? t("Opponent Intel") : t("Intel Board")}</p>
      <h3>${table.name}</h3>
      ${["rule", "opponents", "reward"]
        .map((layer) =>
          intel[layer]
            ? `<div class="intel-reveal"><div class="intel-pill pill good">${helpers.localizeLayerLabel(layer, currentLanguage())} ${t("revealed")}</div><p class="micro">${table.hiddenInfo[layer]}</p></div>`
            : intelOnly
              ? ""
              : `<button class="ghost" data-action="gather-intel" data-table-id="${tableId}" data-layer="${layer}" ${
                run.actionPoints <= 0 ? "disabled" : ""
              }>${helpers.tm("revealLayerButton", { layer: helpers.localizeLayerLabel(layer, currentLanguage()) })}</button>`,
        )
        .join("")}
    </div>
  `;
}
