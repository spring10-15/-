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
          ${renderCompactStatChip(t("Stashed"), money(run.stashedCash), run.stashedCash > 0 ? "cool" : "neutral")}
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
      ${activeSearchModal ? renderStashSceneModal(run, activeSearchModal, extractionPreview, searchItems, helpers) : ""}
    </div>
  `;
}

function renderStashSceneModal(run, modal, extractionPreview, searchItems, helpers) {
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
              : renderStashFolderModal(run, extractionPreview, helpers)
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
            ${helpers.renderPreviewCell(t("Stashed"), money(run.stashedCash), "cool")}
            ${helpers.renderPreviewCell(t("Stash net"), money(extractionPreview.stash.net), "good")}
            ${helpers.renderPreviewCell(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
          </div>
          <div class="field-stack compact-field-stack">
            <input id="stash-amount" type="number" min="0" max="${run.cashOnHand}" step="10" value="${Math.min(run.cashOnHand, 80)}" />
            <button class="secondary" data-action="stash-cash" ${run.phase.stashUsed || run.actionPoints <= 0 ? "disabled" : ""}>${t("Stash")}</button>
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
  const servicesTab = activeTab("searchServices", "stash");
  return `
    <div class="drawer-stack">
      ${renderTabBar("searchServices", [
        { value: "stash", label: t("Stash Cash") },
        { value: "tools", label: t("Services And Tools") },
      ])}
      ${
        servicesTab === "stash"
          ? `
            <div class="drawer-card">
              <div class="section-heading">
                <div>
                  <p class="eyebrow">${t("Ledger Counter")}</p>
                  <h3>${t("Stash Cash")}</h3>
                </div>
              </div>
              <div class="preview-grid compact-preview">
                ${helpers.renderPreviewCell(t("Stashed"), money(run.stashedCash), "cool")}
                ${helpers.renderPreviewCell(t("Stash net"), money(extractionPreview.stash.net), "good")}
                ${helpers.renderPreviewCell(t("Fee"), money(extractionPreview.stash.fee), "warn")}
                ${helpers.renderPreviewCell(t("Status"), run.phase.stashUsed ? t("Stash spent") : t("Stash live"), run.phase.stashUsed ? "bad" : "good")}
              </div>
              <div class="field-stack compact-field-stack">
                <input id="stash-amount" type="number" min="0" max="${run.cashOnHand}" step="10" value="${Math.min(run.cashOnHand, 80)}" />
                <button class="secondary" data-action="stash-cash" ${run.phase.stashUsed || run.actionPoints <= 0 ? "disabled" : ""}>${t("Stash")}</button>
              </div>
              <div class="button-row station-action-row">
                <button class="secondary" data-action="reduce-heat" ${
                  run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 || run.cashOnHand < 30 ? "disabled" : ""
                }>${t("Pay 30 to Lower Heat")}</button>
                <button class="secondary" data-action="sell-all-valuables" ${!valuables.length || run.actionPoints <= 0 ? "disabled" : ""}>${t("Sell All Valuables")}</button>
              </div>
            </div>
          `
          : `
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
          `
      }
    </div>
  `;
}

export function renderStashFolderModal(run, extractionPreview, helpers) {
  const { t, getRunValuables, TABLE_ORDER, money, itemCopy } = helpers;
  const valuables = getRunValuables(run);
  const roomResults = run.roomResults ?? (run.lastTableResult ? [run.lastTableResult] : []);
  const intelTables = TABLE_ORDER.filter((tableId) => run.intel?.[tableId]?.opponents || run.completedTables.includes(tableId));
  const inventoryLine = run.inventory.length
    ? run.inventory
        .map((item) => itemCopy(item.itemId).name)
        .slice(0, 6)
        .join(" / ")
    : t("The pockets are still light.");
  return `
    <div class="notebook-spread">
      <section class="notebook-page left-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Inventory And Notes")}</p>
          <h3>${t("Carry on hand")}</h3>
          <div class="ledger-line"><span>${t("Carry on hand")}</span><strong>${valuables.length ? `+${money(extractionPreview.valuableTotal)}` : "0"}</strong></div>
          <div class="ledger-line"><span>${t("Inventory And Notes")}</span><strong>${run.inventory.length}</strong></div>
          <p class="micro">${inventoryLine}</p>
        </div>
        <div class="notebook-section">
          <p class="eyebrow">${t("Battle Records")}</p>
          <h3>${t("Battle Records")}</h3>
          <div class="record-ledger">
            ${
              roomResults.length
                ? roomResults
                    .slice()
                    .reverse()
                    .map(
                      (result) => `
                        <article class="record-ledger-entry">
                          <div class="ledger-line"><span>${result.tableName}</span><strong>${result.net >= 0 ? `+${money(result.net)}` : `-${money(Math.abs(result.net))}`}</strong></div>
                          <p class="micro">${result.rewardName ? `${t("Reward")} ${result.rewardName}` : t("No side reward")}</p>
                          <p class="micro">${result.collateralName ? `${t("Collateral")} ${result.collateralName}` : t("No collateral")}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="micro">${t("No tavern record yet.")}</p>`
            }
          </div>
        </div>
      </section>
      <section class="notebook-page right-page">
        <div class="notebook-section">
          <p class="eyebrow">${t("Opponent Intel")}</p>
          <h3>${t("Opponent Intel")}</h3>
          <div class="intel-ledger">
            ${
              intelTables.length
                ? intelTables.map((tableId) => renderNotebookIntelEntry(run, tableId, helpers)).join("")
                : `<p class="micro">${t("No opponent intel yet.")}</p>`
            }
          </div>
        </div>
      </section>
    </div>
  `;
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
