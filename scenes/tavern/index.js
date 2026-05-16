import { renderStashFolderModal, renderStashServicesModal } from "../stash/index.js";
import { renderExtractionRoutesModal } from "../extraction/index.js";

export function renderTavernScene(state, helpers) {
  const {
    buildExtractionPreview,
    getPendingExtractionPlan,
    getItemDef,
    routeCopy,
    getNextTablePressure,
    tableCopy,
    currentLanguage,
    shouldPrioritizeExtraction,
    t,
    tm,
    money,
    renderFirstPersonFrame,
    renderCompactStatChip,
    renderHeatPressureNote,
    renderSceneHotspot,
    activeSearchModal,
  } = helpers;

  const run = state.run;
  const extractionPreview = buildExtractionPreview(run);
  const usableItems = run.inventory.filter((item) => getItemDef(item.itemId).kind === "usable");
  const searchItems = usableItems.filter((item) => getItemDef(item.itemId).phase === "search");
  const routeOffer = routeCopy(run.fixedRouteOffer);
  const nextTable = getNextTablePressure(run);
  const routeFirst = shouldPrioritizeExtraction(run, extractionPreview) || !nextTable;
  const routeReady = Boolean(
    extractionPreview.general.visible ||
      extractionPreview.fixed.visible ||
      extractionPreview.dropbagCash.visible ||
      extractionPreview.dropbagValuables.visible ||
      extractionPreview.serviceStairs.visible ||
      extractionPreview.riverLaunch.visible,
  );

  return `
    <div class="scene-shell search-shell fixed-scene-shell tavern-scene-${run.tavernSceneId}">
      ${renderFirstPersonFrame("search")}
      <section class="minimal-scene-hud">
        <div class="minimal-scene-title">
          <strong>${t("Tavern Floor")}</strong>
        </div>
        <div class="minimal-scene-stats">
          ${renderCompactStatChip(t("Cash on hand"), money(run.cashOnHand), "warm")}
          ${renderCompactStatChip(t("Heat"), `${run.heat}`, run.heat > 2 ? "warn" : "cool")}
          ${renderCompactStatChip(t("Action points"), `${run.actionPoints}/2`, run.actionPoints > 0 ? "good" : "bad")}
        </div>
      </section>
      ${renderHeatPressureNote(run)}
      <section class="scene-hotspot-stage tavern-hotspot-stage">
        <div class="scene-hotspot-layer tavern-hotspot-layer">
          ${renderSceneHotspot({
            className: "search-hotspot-join",
            tone: nextTable ? "cool" : routeReady ? "warn" : "neutral",
            size: "hero",
            modal: "play",
            eyebrow: t("Join Game"),
            title: nextTable ? tableCopy(nextTable.id).name : t("No More Rooms. Leave Clean"),
            note: nextTable ? `${money(nextTable.buyIn)} / ${t("Heat")} +${nextTable.heatGain}` : "",
          })}
          ${renderSceneHotspot({
            className: "search-hotspot-stash",
            modal: "services",
            eyebrow: t("Bar Shelf"),
            title: t("Bar Shelf"),
            note: t("Cash, Heat, Exposure"),
          })}
          ${renderSceneHotspot({
            className: "search-hotspot-route",
            modal: "routes",
            tone: routeReady ? "warn" : routeFirst ? "cool" : "neutral",
            eyebrow: t("Routes"),
            title: t("Review Routes"),
            note: routeReady
              ? run.fixedRouteReservation
                ? t("Route held")
                : t("Floor work is live now.")
              : "",
          })}
          ${renderSceneHotspot({
            className: "search-hotspot-folder",
            modal: "folder",
            eyebrow: t("Case Folder"),
            title: t("Memo"),
            note: t("Battle Records"),
          })}
        </div>
      </section>
      ${activeSearchModal ? renderSearchModal(run, state.persistent, activeSearchModal, extractionPreview, searchItems, routeOffer, helpers) : ""}
    </div>
  `;
}

function renderSearchModal(run, persistent, modal, extractionPreview, searchItems, routeOffer, helpers) {
  const { t } = helpers;
  if (modal === "none") {
    return "";
  }
  const modalEyebrow =
    modal === "play" ? t("Join Game") : modal === "services" ? t("Bar Shelf") : modal === "routes" ? t("Kitchen Exit") : t("Case Folder");
  const modalTitle =
    modal === "play"
      ? t("Action")
      : modal === "services"
        ? t("Bar Shelf")
        : modal === "routes"
          ? t("Extraction Routes")
          : t("Memo");
  return `
    <div class="scene-modal-layer tavern-modal-layer tavern-${modal}-layer">
      <button class="scene-modal-backdrop" data-close-search-modal aria-label="${t("Close")}"></button>
      <section class="scene-modal panel ${modal}-modal tavern-${modal}-modal">
        ${
          modal === "services"
            ? `<button class="ghost close-modal-button tavern-top-close" data-close-search-modal>${t("Close")}</button>`
            : ""
        }
        ${
          modal === "services"
            ? ``
            : `
              <div class="scene-modal-head ${modal === "routes" ? "routes-head" : ""}">
                <div>
                  <p class="eyebrow">${modalEyebrow}</p>
                  <h2>${modalTitle}</h2>
                </div>
                <button class="ghost close-modal-button" data-close-search-modal>${t("Close")}</button>
              </div>
            `
        }
        <div class="scene-modal-body">
          ${
            modal === "play"
              ? renderSearchPlayModal(run, helpers)
              : modal === "services"
                ? renderStashServicesModal(run, extractionPreview, searchItems, helpers, { mode: "floor" })
                : modal === "routes"
                  ? renderExtractionRoutesModal(run, extractionPreview, null, helpers)
                  : renderStashFolderModal(run, extractionPreview, helpers, persistent, { variant: "tavern" })
          }
        </div>
      </section>
    </div>
  `;
}

export function renderSearchPlayModal(run, helpers) {
  const { t } = helpers;
  const visibleDestinations = getVisibleDestinationIds(run, helpers);
  if (!visibleDestinations.length) {
    return `
      <div class="drawer-card">
        <p class="eyebrow">${t("Action")}</p>
        <h3>${t("No More Rooms. Leave Clean")}</h3>
        <p class="micro">${t("Focus on extraction")}</p>
      </div>
    `;
  }

  return `
    <div class="modal-grid">
      ${visibleDestinations.map((tableId) => renderPlayableDestinationCard(run, tableId, helpers)).join("")}
    </div>
  `;
}

export function renderPlayableDestinationCard(run, tableId, helpers) {
  const { t, money, tableCopy, buildDestinationIntelSummary, getItemDef, itemCopy } = helpers;
  const table = tableCopy(tableId);
  const intel = run.intel[tableId];
  const knownIntel = ["rule", "opponents", "reward"].filter((layer) => intel[layer]).length;
  const insufficientCash = run.cashOnHand < table.buyIn;
  const valuables = run.inventory.filter((item) => getItemDef(item.itemId).kind === "valuable");
  return `
    <div class="drawer-card destination-compact-card">
      <p class="eyebrow">${table.unlocksAfter ? t("Deep Room") : t("Front Room")}</p>
      <h3>${table.name}</h3>
      <div class="compact-chip-grid">
        ${helpers.renderCompactStatChip(t("Buy-in"), money(table.buyIn), "warm")}
        ${helpers.renderCompactStatChip(t("Heat"), `+${table.heatGain}`, table.rawRisk === "Low" ? "cool" : "warn")}
        ${helpers.renderCompactStatChip(t("Intel"), `${knownIntel}/3`, knownIntel ? "good" : "neutral")}
        ${helpers.renderCompactStatChip(t("Status"), insufficientCash ? t("Not enough cash") : t("Open"), insufficientCash ? "bad" : "good")}
      </div>
      <p class="micro">${knownIntel ? buildDestinationIntelSummary(table, intel) : table.role}</p>
      ${
        table.allowCollateral
          ? `
            <label class="micro" for="collateral-${tableId}">${t("Collateral")}</label>
            <select id="collateral-${tableId}" ${insufficientCash || !valuables.length ? "disabled" : ""}>
              <option value="">${t("No collateral")}</option>
              ${valuables
                .map(
                  (item) =>
                    `<option value="${item.id}">${itemCopy(item.itemId).name} (${money(getItemDef(item.itemId).value)})</option>`,
                )
                .join("")}
            </select>
          `
          : ""
      }
      <button class="cta" data-action="enter-table" data-table-id="${tableId}" ${insufficientCash ? "disabled" : ""}>${t("Enter table")}</button>
    </div>
  `;
}

export function getVisibleDestinationIds(run, helpers) {
  const { TABLE_ORDER, getTableDef } = helpers;
  return TABLE_ORDER.filter((tableId) => {
    const table = getTableDef(tableId);
    const unlocked = !table.unlocksAfter || run.completedTables.includes(table.unlocksAfter);
    return unlocked && !run.completedTables.includes(tableId);
  });
}
