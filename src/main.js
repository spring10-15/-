import {
  INVENTORY_SLOTS,
  ITEM_DEFS,
  STANDARD_BANKROLL,
  TABLE_ORDER,
  TAVERN_SCENES,
  getSpecialExtractionRoute,
  getTavernSceneDef,
  getHeatBand,
  getItemDef,
  getOpponentDef,
  getTableDef,
} from "./data.js";
import { cardCode } from "./poker.js";
import { createGame } from "./game.js";
import { createVideoBackgroundManager } from "./video_background.js";
import { renderMenuScene } from "../scenes/menu/index.js";
import { renderStashScene } from "../scenes/stash/index.js";
import { renderTavernScene, getVisibleDestinationIds as getVisibleDestinationIdsScene } from "../scenes/tavern/index.js";
import { renderSummaryScene, getVisibleRouteCards as getVisibleRouteCardsScene } from "../scenes/extraction/index.js";
import { renderPokerScene } from "../scenes/poker/index.js";
import {
  LANGUAGE_OPTIONS,
  formatMessage,
  getLocalizedItem,
  getLocalizedOpponent,
  getLocalizedRoute,
  getLocalizedTable,
  localizeHandName,
  localizeHeatBand,
  localizeLayerLabel,
  localizeReadDescriptor,
  localizeReadLabel,
  localizeRiskLabel,
  localizeStreet,
  normalizeLanguage,
  translateText,
} from "./i18n.js";

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const uiRoot = document.getElementById("ui-root");
const game = createGame();
const GAME_TITLE = "德扑酒馆：落袋为安";
const SCENE_WIDTH = 360;
const SCENE_HEIGHT = 225;
const PIXEL_SCALE = canvas.width / SCENE_WIDTH;
const SCENE_ART = buildSceneArtMap();
const VIDEO_BACKGROUNDS = createVideoBackgroundManager({
  baseUrl: new URL("../assets/videos/", import.meta.url).href,
  fadeMs: 700,
});
const CARD_BACK_SRC = new URL("../assets/cards/back.png", import.meta.url).href;
const BGM_TRACKS = {
  menu: new URL("../assets/audio/bgm/menu-theme.ogg", import.meta.url).href,
  stash: new URL("../assets/audio/bgm/stash-loop.ogg", import.meta.url).href,
  tavern: new URL("../assets/audio/bgm/tavern-floor.ogg", import.meta.url).href,
  "tavern-smoky-den": new URL("../assets/audio/bgm/tavern-floor.ogg", import.meta.url).href,
  "tavern-high-rise-suite": new URL("../assets/audio/bgm/tavern-high-rise-suite.ogg", import.meta.url).href,
  "tavern-rooftop-club": new URL("../assets/audio/bgm/tavern-rooftop-club.ogg", import.meta.url).href,
  "tavern-neon-poker-club": new URL("../assets/audio/bgm/tavern-neon-poker-club.ogg", import.meta.url).href,
  table: new URL("../assets/audio/bgm/table-pressure.ogg", import.meta.url).href,
  "summary-success": new URL("../assets/audio/bgm/summary-success.ogg", import.meta.url).href,
  "summary-failure": new URL("../assets/audio/bgm/summary-failure.ogg", import.meta.url).href,
};
const BGM_VOLUMES = {
  menu: 0.5,
  stash: 0.44,
  tavern: 0.48,
  "tavern-smoky-den": 0.48,
  "tavern-high-rise-suite": 0.46,
  "tavern-rooftop-club": 0.5,
  "tavern-neon-poker-club": 0.47,
  table: 0.42,
  "summary-success": 0.46,
  "summary-failure": 0.4,
};
const BGM_FADE_MS = {
  menu: 850,
  stash: 850,
  tavern: 900,
  "tavern-smoky-den": 900,
  "tavern-high-rise-suite": 950,
  "tavern-rooftop-club": 980,
  "tavern-neon-poker-club": 1000,
  table: 1050,
  "summary-success": 1200,
  "summary-failure": 1200,
};
const SCENE_ART_CROP = {
  menu: { x: 0, y: 0, w: 1376, h: 768 },
  stash: { x: 0, y: 0, w: 1376, h: 768 },
  search: { x: 110, y: 92, w: 2596, h: 1360 },
  table: { x: 110, y: 92, w: 2596, h: 1360 },
  summary: { x: 110, y: 92, w: 2596, h: 1360 },
};

ctx.imageSmoothingEnabled = true;
document.title = GAME_TITLE;
canvas.setAttribute("aria-label", `${GAME_TITLE} scene`);

window.__blacklightGame = game;

let uiDirty = true;
let lastFrame = performance.now();
let lastToastCount = game.state.toasts.length;
let pendingExtractionAction = null;
let lastRenderedMode = game.state.mode;
let activeSearchModal = null;
let activeSearchScene = "stash";
let activeTableSidebar = null;
let selectedOpponentId = null;
let lastMenuTitleSignature = "";
const bgmState = {
  audio: null,
  unlocked: false,
  requestedKey: null,
  currentKey: null,
  fade: null,
};
const uiTabs = {
  menuDrawer: "brief",
  searchFolder: "intel",
  searchServices: "stash",
  summaryDrawer: "debrief",
};

window.__blacklightAudio = bgmState;

function clampAudioVolume(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

uiRoot.addEventListener("click", (event) => {
  const searchSceneButton = event.target.closest("[data-set-search-scene]");
  if (searchSceneButton) {
    const requestedScene = searchSceneButton.dataset.setSearchScene || "stash";
    if (requestedScene === "stash" && game.state.run?.floorEntered) {
      return;
    }
    activeSearchScene = requestedScene;
    const tabGroup = searchSceneButton.dataset.openTabGroup;
    const tabValue = searchSceneButton.dataset.openTabValue;
    if (tabGroup && tabValue) {
      uiTabs[tabGroup] = tabValue;
    }
    activeSearchModal = searchSceneButton.dataset.openSearchModal || null;
    pendingExtractionAction = null;
    uiDirty = true;
    renderUi();
    return;
  }

  const searchModalButton = event.target.closest("[data-open-search-modal]");
  if (searchModalButton) {
    const tabGroup = searchModalButton.dataset.openTabGroup;
    const tabValue = searchModalButton.dataset.openTabValue;
    if (tabGroup && tabValue) {
      uiTabs[tabGroup] = tabValue;
    }
    const nextModal = searchModalButton.dataset.openSearchModal;
    activeSearchModal = activeSearchModal === nextModal ? null : nextModal;
    uiDirty = true;
    renderUi();
    return;
  }

  if (event.target.closest("[data-close-search-modal]")) {
    activeSearchModal = null;
    uiDirty = true;
    renderUi();
    return;
  }

  const tableSidebarButton = event.target.closest("[data-open-table-sidebar]");
  if (tableSidebarButton) {
    const nextPanel = tableSidebarButton.dataset.openTableSidebar;
    activeTableSidebar = activeTableSidebar === nextPanel ? null : nextPanel;
    if (activeTableSidebar !== "player") {
      selectedOpponentId = null;
    }
    uiDirty = true;
    renderUi();
    return;
  }

  const playerButton = event.target.closest("[data-select-opponent]");
  if (playerButton) {
    const nextOpponentId = playerButton.dataset.selectOpponent;
    if (activeTableSidebar === "player" && selectedOpponentId === nextOpponentId) {
      activeTableSidebar = null;
      selectedOpponentId = null;
    } else {
      activeTableSidebar = "player";
      selectedOpponentId = nextOpponentId;
    }
    uiDirty = true;
    renderUi();
    return;
  }

  if (event.target.closest("[data-close-table-sidebar]")) {
    activeTableSidebar = null;
    selectedOpponentId = null;
    uiDirty = true;
    renderUi();
    return;
  }

  const tabButton = event.target.closest("[data-tab-group]");
  if (tabButton) {
    uiTabs[tabButton.dataset.tabGroup] = tabButton.dataset.tabValue;
    uiDirty = true;
    renderUi();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  if (action === "enter-floor") {
    send(action);
    activeSearchScene = "tavern";
    activeSearchModal = button.dataset.openFloorModal || null;
    pendingExtractionAction = null;
    uiDirty = true;
    renderUi();
    return;
  }
  if (action === "prepare-extraction") {
    const nextAction = button.dataset.extractAction || null;
    pendingExtractionAction = pendingExtractionAction === nextAction ? null : nextAction;
    uiDirty = true;
    renderUi();
    return;
  }

  if (action === "cancel-extraction-review") {
    pendingExtractionAction = null;
    uiDirty = true;
    renderUi();
    return;
  }

  const payload = {};

  if (action === "enter-table") {
    payload.tableId = button.dataset.tableId;
    const collateralSelect = document.getElementById(`collateral-${payload.tableId}`);
    payload.collateralId = collateralSelect?.value || null;
  }

  if (action === "gather-intel") {
    payload.tableId = button.dataset.tableId;
    payload.layer = button.dataset.layer;
  }

  if (action === "buy-item") {
    payload.itemId = button.dataset.itemId;
  }

  if (action === "sell-item") {
    payload.instanceId = button.dataset.instanceId;
  }

  if (action === "use-search-item" || action === "use-table-item") {
    payload.instanceId = button.dataset.instanceId;
    payload.intent = button.dataset.intent;
    payload.tableId = button.dataset.tableId;
    payload.targetId = button.dataset.targetId;
  }

  if (action === "set-language") {
    payload.language = button.dataset.language;
  }

  send(action, payload);
});

uiRoot.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  const hotspot = event.target.closest(".scene-hotspot[role='button']");
  if (!hotspot) {
    return;
  }
  event.preventDefault();
  hotspot.click();
});

document.addEventListener("pointerdown", unlockBgm, { passive: true });
document.addEventListener("keydown", unlockBgm, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    toggleFullscreen();
    return;
  }

  if (event.key === "Escape") {
    let changed = false;
    if (activeSearchModal) {
      activeSearchModal = null;
      changed = true;
    }
    if (pendingExtractionAction) {
      pendingExtractionAction = null;
      changed = true;
    }
    if (activeTableSidebar) {
      activeTableSidebar = null;
      selectedOpponentId = null;
      changed = true;
    }
    if (changed) {
      event.preventDefault();
      uiDirty = true;
      renderUi();
    }
  }
});

window.advanceTime = (ms) => {
  game.advanceTime(ms);
  drawScene();
  renderUi();
};

window.render_game_to_text = () => JSON.stringify(buildTextState());

requestAnimationFrame(frame);
renderUi();
document.fonts?.ready?.then(() => {
  drawScene();
  renderUi();
});

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const advanced = game.advanceTime(dt * 1000);
  syncBgm(now);
  drawScene();
  if (advanced) {
    uiDirty = true;
  }
  if (game.state.handoffBeat) {
    uiDirty = true;
  }
  if (game.state.toasts.length !== lastToastCount) {
    lastToastCount = game.state.toasts.length;
    uiDirty = true;
  }
  if (game.state.mode === "menu") {
    const titleSignature = getMenuTitleAnimation(now).signature;
    if (titleSignature !== lastMenuTitleSignature) {
      lastMenuTitleSignature = titleSignature;
      uiDirty = true;
    }
  } else if (lastMenuTitleSignature) {
    lastMenuTitleSignature = "";
  }
  if (uiDirty) {
    renderUi();
  }
  requestAnimationFrame(frame);
}

function ensureBgmAudio() {
  if (bgmState.audio) {
    return bgmState.audio;
  }
  const audio = new Audio();
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  bgmState.audio = audio;
  return audio;
}

function unlockBgm() {
  if (bgmState.unlocked) {
    return;
  }
  bgmState.unlocked = true;
  ensureBgmAudio();
  startBgmTransition(bgmState.requestedKey ?? getDesiredBgmKey(), performance.now());
}

function getDesiredBgmKey(state = game.state) {
  if (state.mode === "menu") {
    return "menu";
  }
  if (state.mode === "search") {
    if (!state.run?.floorEntered) {
      return "stash";
    }
    const tavernSceneId = state.run?.tavernSceneId ?? "smoky-den";
    return `tavern-${tavernSceneId}`;
  }
  if (state.mode === "table") {
    return "table";
  }
  if (state.mode === "summary") {
    return state.latestSummary?.success ? "summary-success" : "summary-failure";
  }
  return null;
}

function getBgmFadeDuration(nextKey) {
  return BGM_FADE_MS[nextKey] ?? 900;
}

function getBgmTargetVolume(key) {
  return BGM_VOLUMES[key] ?? 0.45;
}

function syncBgm(now = performance.now()) {
  const desiredKey = getDesiredBgmKey();
  if (desiredKey !== bgmState.requestedKey) {
    bgmState.requestedKey = desiredKey;
    if (bgmState.unlocked) {
      startBgmTransition(desiredKey, now);
    }
  }
  if (bgmState.unlocked) {
    updateBgmFade(now);
  }
}

function startBgmTransition(nextKey, now = performance.now()) {
  const audio = ensureBgmAudio();
  if (!nextKey) {
    if (!bgmState.currentKey) {
      return;
    }
    bgmState.fade = {
      phase: "out",
      startedAt: now,
      duration: getBgmFadeDuration(bgmState.currentKey),
      from: audio.volume,
      to: 0,
      nextKey: null,
    };
    return;
  }

  if (bgmState.currentKey === nextKey && !bgmState.fade) {
    if (audio.src !== BGM_TRACKS[nextKey]) {
      audio.src = BGM_TRACKS[nextKey];
    }
    if (audio.paused) {
      audio.play().catch(() => {});
    }
    audio.volume = clampAudioVolume(getBgmTargetVolume(nextKey));
    return;
  }

  if (!bgmState.currentKey) {
    audio.src = BGM_TRACKS[nextKey];
    audio.currentTime = 0;
    audio.volume = 0;
    audio.play().catch(() => {});
    bgmState.currentKey = nextKey;
    bgmState.fade = {
      phase: "in",
      startedAt: now,
      duration: getBgmFadeDuration(nextKey),
      from: 0,
      to: getBgmTargetVolume(nextKey),
      nextKey,
    };
    return;
  }

  bgmState.fade = {
    phase: "out",
    startedAt: now,
    duration: getBgmFadeDuration(nextKey),
    from: audio.volume,
    to: 0,
    nextKey,
  };
}

function updateBgmFade(now = performance.now()) {
  const fade = bgmState.fade;
  const audio = bgmState.audio;
  if (!fade || !audio) {
    return;
  }

  const progress = Math.min(1, (now - fade.startedAt) / fade.duration);
  audio.volume = clampAudioVolume(fade.from + (fade.to - fade.from) * progress);

  if (progress < 1) {
    return;
  }

  if (fade.phase === "out") {
    if (!fade.nextKey) {
      audio.pause();
      audio.currentTime = 0;
      bgmState.currentKey = null;
      bgmState.fade = null;
      return;
    }
    audio.pause();
    audio.src = BGM_TRACKS[fade.nextKey];
    audio.currentTime = 0;
    audio.volume = 0;
    audio.play().catch(() => {});
    bgmState.currentKey = fade.nextKey;
    bgmState.fade = {
      phase: "in",
      startedAt: now,
      duration: getBgmFadeDuration(fade.nextKey),
      from: 0,
      to: getBgmTargetVolume(fade.nextKey),
      nextKey: fade.nextKey,
    };
    return;
  }

  audio.volume = clampAudioVolume(getBgmTargetVolume(bgmState.currentKey));
  bgmState.fade = null;
}

function send(action, payload = {}) {
  if (action === "exit-game") {
    exitGame();
    return;
  }

  game.dispatch(action, payload);
  if (action === "start-run" || action === "load-run") {
    activeSearchScene =
      game.state.mode === "search" && game.state.run?.floorEntered ? "tavern" : "stash";
  }
  if (action !== "prepare-extraction") {
    pendingExtractionAction = null;
  }
  if (game.state.mode !== "search") {
    pendingExtractionAction = null;
    activeSearchModal = null;
  }
  if (game.state.mode !== "table") {
    activeTableSidebar = null;
    selectedOpponentId = null;
  }
  uiDirty = true;
  renderUi();
}

function currentLanguage() {
  return normalizeLanguage(game.state.persistent.language);
}

function t(text, params = {}) {
  return translateText(currentLanguage(), text, params);
}

function tm(key, params = {}) {
  return formatMessage(currentLanguage(), key, params);
}

function getSceneHelpers() {
  return {
    TABLE_ORDER,
    STANDARD_BANKROLL,
    INVENTORY_SLOTS,
    activeSearchModal,
    activeTableSidebar,
    selectedOpponentId,
    pendingExtractionAction,
    activeSearchScene,
    currentLanguage,
    t,
    tm,
    money,
    activeTab,
    tableCopy,
    itemCopy,
    opponentCopy,
    routeCopy,
    tavernSceneCopy,
    participantName,
    getKnownOpponentArchetypeLabel,
    getItemDef,
    getTableDef,
    getRunValuables,
    getVisibleDestinationIds,
    getVisibleRouteCards,
    getSummaryNextStep,
    getNextTablePressure,
    getSearchObjective,
    getTableObjective,
    getRoomRewardPreview,
    getTablePressureFocus,
    buildExtractionPreview,
    getPendingExtractionPlan,
    buildDestinationIntelSummary,
    shouldPrioritizeExtraction,
    renderMenu,
    getMenuTitleAnimation,
    renderTabBar,
    renderSceneMetric,
    renderPreviewCell,
    renderCompactStatChip,
    renderScenePhaseChip,
    renderSuspicionStrip,
    renderSceneHotspot,
    renderFirstPersonFrame,
    renderOutsiderFrame,
    renderRouteBadge,
    renderCarryPreviewPanel,
    renderCarryManifestItem,
    renderInventoryCard,
    renderRecentNotes,
    renderRoomStakes,
    renderSignalReadCard,
    renderExtractionCommitPanel,
    renderBoardCards,
    renderStreetRevealRail,
    renderCard,
    renderTableCue,
    renderFinalHandSpotlight,
    renderLastHandSummary,
    renderVerdictCell,
    localizeLayerLabel,
    localizeStreet,
    heatClass,
    inventorySlotsUsed,
    formatCardInline,
    describePressureState,
    describeOpponentTell,
    describeOpponentPressureAccent,
  };
}

function getMenuTitleFullText(language = currentLanguage()) {
  return GAME_TITLE;
}

function getMenuTitleAnimation(now = performance.now()) {
  const fullText = getMenuTitleFullText();
  const chars = Array.from(fullText);
  const holdMs = 5000;
  const idleMs = 3000;
  const typingIntervals = chars.map((_, index) => {
    const pulse = index % 5;
    if (pulse === 0) {
      return 155;
    }
    if (pulse === 1) {
      return 128;
    }
    if (pulse === 2) {
      return 146;
    }
    if (pulse === 3) {
      return 118;
    }
    return 172;
  });
  const typingMs = typingIntervals.reduce((sum, value) => sum + value, 0);
  const deleteIntervals = chars.map((_, index) => {
    const pulse = index % 4;
    if (pulse === 0) {
      return 120;
    }
    if (pulse === 1) {
      return 92;
    }
    if (pulse === 2) {
      return 84;
    }
    return 138;
  });
  const deletingMs = deleteIntervals.reduce((sum, value) => sum + value, 0);
  const cycleMs = typingMs + holdMs + deletingMs + idleMs;
  const phaseTime = now % cycleMs;

  let visibleCount = 0;
  let deleting = false;
  if (phaseTime < typingMs) {
    let elapsed = 0;
    for (const interval of typingIntervals) {
      if (phaseTime < elapsed + interval) {
        break;
      }
      elapsed += interval;
      visibleCount += 1;
    }
  } else if (phaseTime < typingMs + holdMs) {
    visibleCount = chars.length;
  } else if (phaseTime < typingMs + holdMs + deletingMs) {
    deleting = true;
    const deleteTime = phaseTime - typingMs - holdMs;
    let elapsed = 0;
    let deletedCount = 0;
    for (const interval of deleteIntervals) {
      if (deleteTime < elapsed + interval) {
        break;
      }
      elapsed += interval;
      deletedCount += 1;
    }
    visibleCount = Math.max(0, chars.length - deletedCount);
  }

  const visibleText = chars.slice(0, visibleCount).join("");
  const caretVisible =
    phaseTime < typingMs || (phaseTime >= typingMs + holdMs && phaseTime < typingMs + holdMs + deletingMs)
      ? true
      : Math.floor((phaseTime % 800) / 400) === 0;

  return {
    fullText,
    visibleText,
    deleting,
    caretVisible,
    signature: `${visibleText}|${caretVisible ? 1 : 0}|${deleting ? 1 : 0}`,
  };
}

function tableCopy(tableIdOrDef) {
  const table = typeof tableIdOrDef === "string" ? getTableDef(tableIdOrDef) : tableIdOrDef;
  const localized = table ? getLocalizedTable(table.id, currentLanguage()) : null;
  if (!table) {
    return null;
  }
  return {
    ...table,
    name: localized?.name ?? table.name,
    rawRisk: table.risk,
    risk: localizeRiskLabel(table.risk, currentLanguage()),
    role: localized?.role ?? table.role,
    hiddenInfo: {
      ...table.hiddenInfo,
      ...(localized?.hiddenInfo ?? {}),
    },
  };
}

function itemCopy(itemIdOrItem) {
  const item = typeof itemIdOrItem === "string" ? getItemDef(itemIdOrItem) : itemIdOrItem;
  const localized = item ? getLocalizedItem(item.id, currentLanguage()) : null;
  if (!item) {
    return null;
  }
  return {
    ...item,
    name: localized?.name ?? item.name,
    description: localized?.description ?? item.description,
  };
}

function opponentCopy(opponentIdOrDef) {
  const opponent =
    typeof opponentIdOrDef === "string" ? getOpponentDef(opponentIdOrDef) : opponentIdOrDef;
  const localized = opponent
    ? getLocalizedOpponent(opponent.id ?? opponent.archetypeId, currentLanguage())
    : null;
  if (!opponent) {
    return null;
  }
  return {
    ...opponent,
    name: localized?.name ?? opponent.name,
    seatLabel: localized?.seatLabel ?? opponent.seatLabel ?? opponent.name,
    intro: localized?.intro ?? opponent.intro,
  };
}

function tavernSceneCopy(sceneIdOrDef) {
  const scene = typeof sceneIdOrDef === "string" ? getTavernSceneDef(sceneIdOrDef) : sceneIdOrDef;
  if (!scene) {
    return null;
  }
  return { ...scene };
}

function routeCopy(route) {
  if (!route) {
    return null;
  }
  const localized = getLocalizedRoute(route.id, currentLanguage());
  return {
    ...route,
    name: localized?.name ?? route.name,
    flavor: localized?.flavor ?? route.flavor,
  };
}

function participantName(participant) {
  if (!participant) {
    return "";
  }
  if (participant.id === "player") {
    return t("You");
  }
  return opponentCopy(participant.archetypeId ?? participant.id)?.name ?? participant.name;
}

function getKnownOpponentArchetypeLabel(participant) {
  const opponentId = participant?.id;
  if (!opponentId || opponentId === "player") {
    return null;
  }
  const record = game.state.persistent?.knownOpponents?.[opponentId];
  if (!record?.archetypeKnown) {
    return null;
  }
  return t(record.archetype);
}

function activeTab(group, fallback) {
  return uiTabs[group] ?? fallback;
}

function renderUi() {
  const { state } = game;
  if (state.mode === "search" && lastRenderedMode !== "search") {
    activeSearchScene = state.run?.floorEntered ? "tavern" : "stash";
    activeSearchModal = null;
    pendingExtractionAction = null;
  }
  if (state.mode === "search" && state.run?.floorEntered && activeSearchScene === "stash") {
    activeSearchScene = "tavern";
  }
  if (state.mode !== "search") {
    pendingExtractionAction = null;
    activeSearchModal = null;
  }
  if (state.mode !== "table") {
    activeTableSidebar = null;
    selectedOpponentId = null;
  }
  document.body.dataset.mode = state.mode;
  document.body.dataset.searchScene = state.mode === "search" ? activeSearchScene : "";
  uiRoot.className = `ui-root mode-${state.mode}`;
  const visibleToasts = state.toasts.slice(-1);
  let html = "";
  if (state.mode === "menu") {
    html = renderMenu(state);
  } else if (state.mode === "search") {
    html = renderSearch(state);
  } else if (state.mode === "table") {
    html = renderTable(state);
  } else if (state.mode === "summary") {
    html = renderSummary(state);
  }

  uiRoot.innerHTML = `
    <div class="scene-layer scene-${state.mode}">
      ${state.mode === "menu" ? renderLanguageChrome(state) : ""}
      ${html}
      ${state.handoffBeat && state.mode === "search" ? renderHandoffBeat(state.handoffBeat) : ""}
      <div class="toast-stack">
        ${visibleToasts.map((toast) => `<div class="toast"><p>${toast.text}</p></div>`).join("")}
      </div>
    </div>
  `;
  if (lastRenderedMode !== state.mode) {
    uiRoot.scrollTop = 0;
    lastRenderedMode = state.mode;
  }
  uiDirty = false;
}

function renderLanguageChrome(state) {
  return `
    <div class="language-chrome">
      <div class="language-toggle" role="tablist" aria-label="language switcher">
        ${LANGUAGE_OPTIONS.map(
          (option) => `
            <button
              class="language-pill ${state.persistent.language === option.value ? "active" : ""}"
              data-action="set-language"
              data-language="${option.value}"
            >${option.label}</button>
          `,
        ).join("")}
      </div>
    </div>
  `;
}

function renderMenu(state) {
  return renderMenuScene(state, getSceneHelpers());
}

function renderSearch(state) {
  if (activeSearchScene === "stash") {
    return renderStashScene(state, getSceneHelpers());
  }
  return renderTavernScene(state, getSceneHelpers());
}

function renderTable(state) {
  return renderPokerScene(state, getSceneHelpers());
}

function renderSummary(state) {
  return renderSummaryScene(state, getSceneHelpers());
}

function renderSearchObjective(run, preview, extractionCommit) {
  const objective = getSearchObjective(run, preview, extractionCommit);
  return `
    <section class="panel objective-shell ${objective.tone}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("Current Objective")}</p>
          <h2>${t(objective.title)}</h2>
        </div>
        <span class="pill ${objective.tone}">${t(objective.badge)}</span>
      </div>
      <p class="micro">${t(objective.text)}</p>
      <div class="preview-grid objective-grid">
        ${renderPreviewCell(t("Good move"), t(objective.move), objective.tone)}
        ${renderPreviewCell(t("Why now"), t(objective.why), "cool")}
        ${renderPreviewCell(t("If you walk"), objective.walk, objective.walkTone)}
      </div>
    </section>
  `;
}

function renderTableObjective(run, table, preview) {
  const objective = getTableObjective(run, table, preview);
  return `
    <section class="panel objective-shell ${objective.tone}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("Table Objective")}</p>
          <h2>${t(objective.title)}</h2>
        </div>
        <span class="pill ${objective.tone}">${t(objective.badge)}</span>
      </div>
      <p class="micro">${t(objective.text)}</p>
      <div class="preview-grid objective-grid">
        ${renderPreviewCell(t("Room ask"), t(objective.ask), objective.tone)}
        ${renderPreviewCell(t("Prize line"), t(objective.prize), objective.prizeTone)}
        ${renderPreviewCell(t("Immediate read"), t(objective.read), "cool")}
      </div>
    </section>
  `;
}

function renderCompactStatChip(label, value, tone = "neutral") {
  return `
    <div class="compact-stat-chip ${tone}">
      <span class="compact-stat-label">${typeof label === "string" ? t(label) : label}</span>
      <strong class="compact-stat-value">${typeof value === "string" ? t(value) : value}</strong>
    </div>
  `;
}

function renderScenePhaseChip(eyebrow, title, detail = "") {
  return `
    <div class="scene-phase-chip">
      <span class="eyebrow">${eyebrow}</span>
      <strong>${title}</strong>
      ${detail ? `<span class="micro">${detail}</span>` : ""}
    </div>
  `;
}

function renderSuspicionStrip(heat) {
  return `
    <div class="suspicion-strip ${heatClass(heat)}">
      <div class="suspicion-copy">
        <span class="eyebrow">${t("Suspicion Meter")}</span>
        <strong>${localizeHeatBand(getHeatBand(heat), currentLanguage())}</strong>
      </div>
      <div class="suspicion-track">
        ${Array.from({ length: 6 }, (_, index) => `<span class="suspicion-segment ${index < heat ? "filled" : ""}"></span>`).join("")}
      </div>
    </div>
  `;
}

function renderSceneHotspot({
  className,
  tone = "neutral",
  size = "standard",
  modal = null,
  action = null,
  eyebrow,
  title,
  note,
  dataAttributes = "",
}) {
  const targetAttribute = modal
    ? `data-open-search-modal="${modal}"`
    : action
      ? `data-action="${action}"`
      : "";
  return `
    <button
      type="button"
      class="scene-hotspot ${className} ${tone} ${size}"
      aria-label="${title}"
      ${targetAttribute}
      ${dataAttributes}
    >
      <span class="scene-hotspot-pin"></span>
      <span class="scene-hotspot-copy">
        <span class="eyebrow">${eyebrow}</span>
        <strong>${title}</strong>
        ${note ? `<span class="micro">${note}</span>` : ""}
      </span>
    </button>
  `;
}

function getVisibleDestinationIds(run) {
  return getVisibleDestinationIdsScene(run, getSceneHelpers());
}

function getVisibleRouteCards(run, preview) {
  return getVisibleRouteCardsScene(run, preview);
}

function renderTabBar(group, tabs) {
  return `
    <div class="tab-bar" role="tablist">
      ${tabs
        .map(
          (tab) => `
            <button
              class="tab-pill ${activeTab(group, tab.value) === tab.value ? "active" : ""}"
              data-tab-group="${group}"
              data-tab-value="${tab.value}"
            >${tab.label}</button>
          `,
        )
        .join("")}
    </div>
  `;
}

function getSearchObjective(run, preview, extractionCommit) {
  const zh = currentLanguage() === "zh";
  const bestPlan = getBestAvailablePlan(preview);
  const nextTable = getNextTablePressure(run);
  if (extractionCommit) {
    return {
      title: "Commit The Exit Or Stand Down",
      badge: "route under review",
      text: "You have already pulled an exit into focus. Either commit it now or back out and keep the run alive.",
      move: extractionCommit.title,
      why: extractionCommit.routeLabel,
      walk: bestPlan ? money(bestPlan.totalSettled) : "0",
      walkTone: bestPlan ? "good" : "bad",
      tone: "warn",
    };
  }

  if (!run.completedTables.length) {
    return {
      title: "Prep Once, Then Open Cargo Table",
      badge: "front room first",
      text: "This authored demo wants one clean prep decision, then the front room. Mirror Hall does not matter until Cargo Table is behind you.",
      move: run.actionPoints > 0 ? "Buy cover or reveal one intel layer" : "Take Cargo Table now",
      why: "Cargo unlocks the rest of the run",
      walk: "Nothing banked yet",
      walkTone: "bad",
      tone: "cool",
    };
  }

  if (nextTable) {
    const nextTableCopy = tableCopy(nextTable.id);
    const nextTableName = nextTableCopy?.name ?? nextTable.name;
    const isMirror = nextTable.id === "mirror-hall";
    const isEmbers = nextTable.id === "embers-table";
    return {
      title: zh
        ? bestPlan && (run.heat >= 4 || preview.valuableTotal > 0)
          ? `在${nextTableName}和撤离之间做选择`
          : `${nextTableName}已经开放`
        : isMirror
          ? bestPlan && (run.heat >= 4 || preview.valuableTotal > 0)
            ? "Choose Between Mirror Hall And A Clean Exit"
            : "Mirror Hall Is The Main Score"
          : `Push ${nextTableName} Or Cash Out`,
      badge: bestPlan ? (zh ? "分岔点" : "decision point") : (zh ? "新牌桌开放" : "next room live"),
      text: zh
        ? isMirror
          ? "你现在身上已经有真实价值。这里是本局的主分岔：继续压深，还是把今晚带出去。"
          : isEmbers
            ? "最后的高压房间已经亮起。这里利润更重，但风声和带货压力也会同步变硬。"
            : "下一张牌桌已经打开。你可以先整理路线和物品，也可以直接把筹码压回台面。"
        : bestPlan
          ? "You now have real value on you. This is the fork in the run: push the next room or cash the night in."
          : `${nextTableName} is open. Prep your route and tools before you sit, or press immediately if the stack can take it.`,
      move: zh
        ? run.actionPoints > 0
          ? "整理路线、压风声，或者直接入桌"
          : "决定继续压，还是现在撤"
        : run.actionPoints > 0
          ? `Set route, cool heat, or sit ${nextTableName}`
          : "Decide: press or leave",
      why: zh
        ? `${nextTableName} 会要求你再把 ${money(nextTable.buyIn)} 压回台面，并额外增加 ${nextTable.heatGain} 点风声。`
        : `${nextTableName} asks ${money(nextTable.buyIn)} back onto the felt and adds Heat +${nextTable.heatGain}.`,
      walk: bestPlan ? money(bestPlan.totalSettled) : "0",
      walkTone: bestPlan ? "good" : "bad",
      tone: bestPlan ? "warn" : "cool",
    };
  }

  return {
    title: "No More Rooms. Leave Clean",
    badge: "run closing",
    text: "The authored demo path is finished. From here, the only meaningful choice is how much of the night you actually keep.",
    move: "Pick the cleanest extraction route",
    why: "Every remaining dollar is exit logic now",
    walk: bestPlan ? money(bestPlan.totalSettled) : "0",
    walkTone: bestPlan ? "good" : "bad",
    tone: "good",
  };
}

function getTableObjective(run, table, preview) {
  const zh = currentLanguage() === "zh";
  const callAmount = Math.max(0, table.currentBet - table.players[0].currentBet);
  const finalHand = table.handNumber === table.totalHands;
  const tableDef = table.tableDef;
  const tableInfo = tableCopy(tableDef.id);
  const tableLabel = tableInfo?.name ?? tableDef.name;
  const immediateRead =
    table.currentActorId === "player"
      ? callAmount > 0
        ? zh
          ? `你现在正面对 ${money(callAmount)} 的跟注要求`
          : `You are facing ${money(callAmount)} right now`
        : zh
          ? "这条下注线现在由你来定义"
          : "You are defining the betting line"
      : zh
        ? `${t(getTablePressureFocus(table).actor)} 正主导当前行动`
        : `${getTablePressureFocus(table).actor} owns the current move`;

  if (table.tableDef.id === "cargo-table") {
    return {
      title: finalHand ? "Close Cargo In Profit" : "Build Profit Without Overheating",
      badge: finalHand ? "room closes now" : "front room",
      text: finalHand
        ? "This is the last hand of the front room. The room reward now follows whether you can close above water."
        : "Cargo Table teaches the run's rhythm: read one loud seat, stay solvent, and leave with enough momentum to unlock the deep room.",
      ask: finalHand ? "Protect the close" : "Stay above buy-in",
      prize: `${preview.premium.name} / ${money(preview.premium.value)}`,
      prizeTone: preview.premium.armed ? "good" : "warn",
      read: immediateRead,
      tone: finalHand ? "warn" : "cool",
    };
  }

  if (table.tableDef.id === "ledger-cellar") {
    return {
      title: zh ? (finalHand ? "账窖桌正在收口" : "读清安静压力") : finalHand ? "Ledger Cellar Is Settling" : "Read The Quiet Pressure",
      badge: zh ? (finalHand ? "中段收口" : "中段房间") : finalHand ? "mid-room close" : "quiet room",
      text: zh
        ? finalHand
          ? "这是账窖桌的最后一手。工具会额外惹风声，最好用下注和读人自己把局面收干净。"
          : "账窖桌的惩罚不在大声，而在工具痕迹。每次牌桌道具都会额外抬高风声。"
        : finalHand
          ? "This is Ledger Cellar's last hand. Table tools leave extra heat here, so close with cards and reads if you can."
          : "Ledger Cellar punishes tool traces. Every table tool use adds extra Heat in this room.",
      ask: zh ? "少用工具，保持盈利" : "Profit without leaning too hard on tools",
      prize: `${preview.premium.name} / ${money(preview.premium.value)}`,
      prizeTone: preview.premium.armed ? "good" : "warn",
      read: immediateRead,
      tone: finalHand ? "warn" : "cool",
    };
  }

  if (table.tableDef.id === "embers-table") {
    return {
      title: zh ? (finalHand ? "余烬桌决定带走多少" : "在烧穿前收筹码") : finalHand ? "Embers Decides What Leaves" : "Bank Chips Before It Burns",
      badge: zh ? (finalHand ? "终局房间" : "高压房间") : finalHand ? "final room" : "high heat room",
      text: zh
        ? finalHand
          ? "这是最后房间的最后一手。盈利收桌会让风声回落 1 点，但输掉会让撤离非常吃紧。"
          : "余烬桌筹码更重，也更惩罚犹豫。若能盈利收桌，结算前会降低 1 点风声。"
        : finalHand
          ? "This is the last hand of the last room. A profitable close cools Heat by 1 before extraction math."
          : "Embers pays heavier and punishes hesitation. Close in profit and the room cools Heat by 1.",
      ask: table.collateral ? (zh ? "保护抵押物并收赢" : "Protect collateral and close ahead") : zh ? "别让高压房间吞掉本金" : "Do not let the high room eat the stake",
      prize: `${preview.premium.name} / ${money(preview.premium.value)}`,
      prizeTone: preview.premium.armed ? "good" : "warn",
      read: immediateRead,
      tone: finalHand ? "bad" : "warn",
    };
  }

  return {
    title: zh ? (finalHand ? `${tableLabel}决定这一局` : `谨慎推进${tableLabel}`) : finalHand ? "Mirror Hall Settles The Run" : "Press The Deep Room Carefully",
    badge: zh ? (finalHand ? "关键最后手" : "深房间") : finalHand ? "run-defining hand" : "deep room",
    text: zh
      ? finalHand
        ? `${tableLabel}的最后一手会决定这局是开花还是收死。抵押物和风声在这里都更重要。`
        : `${tableLabel}是这一阶段的风险峰值。盯住奖励线，也要盯住自己之后还能不能干净离开。`
      : finalHand
        ? "Mirror Hall's last hand is where the run either blooms or folds in. Collateral and heat both matter more here."
        : "Mirror Hall is the demo's risk spike. Keep one eye on the payout line and the other on whether you can still leave clean afterward.",
    ask: table.collateral ? (zh ? "保护高价值奖励线" : "Protect the premium line") : zh ? "判断是否值得错过抵押线" : "Decide if collateral is worth missing",
    prize: `${preview.premium.name} / ${money(preview.premium.value)}`,
    prizeTone: preview.premium.armed ? "good" : "warn",
    read: immediateRead,
    tone: finalHand ? "bad" : "warn",
  };
}

function getSummaryNextStep(summary) {
  const zh = currentLanguage() === "zh";
  if (summary.success) {
    const forcedCopy =
      summary.forcedReason === "lockdown"
        ? zh
          ? "楼层锁死后，你被迫沿着还能走通的线撤了出去。"
          : "Lockdown forced you out through the only route still breathing."
        : summary.forced
          ? zh
            ? "这次不是从容收尾，而是被局势推着离场。"
            : "This was not a clean close; the room forced you out."
          : zh
            ? "这次撤离是自己掌控节奏后的结果。"
            : "This exit came from staying ahead of the room.";
    return {
      title: summary.forced ? "Forced Exit Succeeded" : "Clean Exit",
      badge: summary.forced ? "forced exit" : "clean lesson",
      text: forcedCopy,
      banked: money(summary.totalSettled),
      pressure: summary.routeLabel,
      next: zh
        ? summary.forced
          ? "下一局要在风声钉死前先准备备用路线。"
          : "下一局可以压更深的房间，或者选择更贪的撤离。"
        : summary.forced
          ? "Next run, line up backup routes before the heat meter pins."
          : "Next run can press a deeper room or a greedier close.",
      tone: summary.forced ? "warn" : "good",
    };
  }

  return {
    title: "The Room Took This One",
    badge: summary.caught ? "caught" : "collapse read",
    text: summary.caught
      ? zh
        ? `你在撤离前被按住，现金被扣了 ${money(summary.seizedCash ?? 0)}，货物损失 ${money(summary.seizedValuables ?? 0)}。`
        : `You were grabbed before clearing out. ${money(summary.seizedCash ?? 0)} in cash and ${money(summary.seizedValuables ?? 0)} in goods were seized.`
      : zh
        ? "这局不是输在牌桌，就是输在没有给自己留退路。"
        : "This run failed either on the table or because the exit plan came too late.",
    banked: money(summary.salvaged ?? 0),
    pressure: summary.reason,
    next: zh
      ? "下一次更早降低风声，或者在第二间房前就把路线和物品都备好。"
      : "Next run, lower heat earlier and line up your route and tools before the second room.",
    tone: "warn",
  };
}

function renderSceneMetric(label, value, tone = "neutral") {
  return `
    <div class="metric-block ${tone}">
      <span class="metric-label">${typeof label === "string" ? t(label) : label}</span>
      <strong class="metric-value">${value}</strong>
    </div>
  `;
}

function renderActionMeter(actionPoints) {
  return `
    <div class="metric-block neutral meter-block">
      <span class="metric-label">${t("Action points")}</span>
      <div class="dot-row">
        ${Array.from({ length: 2 }, (_, index) => `<span class="dot ${index < actionPoints ? "filled" : ""}"></span>`).join("")}
      </div>
    </div>
  `;
}

function renderHeatMeter(heat) {
  return `
    <div class="metric-block ${heatClass(heat)} meter-block">
      <span class="metric-label">${t("Heat")}</span>
      <strong class="metric-value">${heat}</strong>
      <div class="meter-track">
        ${Array.from({ length: 6 }, (_, index) => `<span class="meter-segment ${index < heat ? "filled" : ""}"></span>`).join("")}
      </div>
    </div>
  `;
}

function renderSlotMeter(inventory) {
  const used = inventorySlotsUsed(inventory);
  return `
    <div class="metric-block cool meter-block">
      <span class="metric-label">${t("Inventory")}</span>
      <strong class="metric-value">${used} / ${INVENTORY_SLOTS}</strong>
      <div class="meter-track slot-track">
        ${Array.from({ length: INVENTORY_SLOTS }, (_, index) => `<span class="meter-segment ${index < used ? "filled" : ""}"></span>`).join("")}
      </div>
    </div>
  `;
}

function renderRecentNotes(lines, emptyText) {
  if (!lines.length) {
    return `<div class="log-list"><p class="micro">${typeof emptyText === "string" ? t(emptyText) : emptyText}</p></div>`;
  }
  return `
    <div class="log-list">
      <ul>
        ${lines.map((line) => `<li>${line}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderLastTableResult(result) {
  const outcomeClass = result.net >= 0 ? "good" : "bad";
  const rewardValue = result.rewardId ? getItemDef(result.rewardId).value : 0;
  const rewardLine = result.rewardName
    ? result.rewardAdded
      ? `Secured ${result.rewardName} worth ${money(rewardValue)}.`
      : `${result.rewardName} was won but could not be carried.`
    : "No side reward came off the room.";
  const collateralLine = result.collateralName
    ? result.collateralReturned
      ? `${result.collateralName} came back with you.`
      : `${result.collateralName} stayed on the table.`
    : "No collateral was committed.";

  return `
    <div class="card-block recap-card ${outcomeClass}">
      <div class="card-topline">
        ${renderRouteBadge(result.tableId, result.tableName)}
      </div>
      <div class="stat-row"><span class="stat-label">${result.tableName}</span><span class="stat-value">${
        result.net >= 0 ? `+${money(result.net)}` : `-${money(Math.abs(result.net))}`
      }</span></div>
      <div class="pill-row status-strip">
        <span class="pill ${outcomeClass === "good" ? "good" : "bad"}">${result.net >= 0 ? "profit" : "loss"}</span>
        ${result.rewardName ? `<span class="pill ${result.rewardAdded ? "good" : "warn"}">${result.rewardAdded ? `reward ${money(rewardValue)}` : "reward missed"}</span>` : ""}
        ${result.collateralName ? `<span class="pill ${result.collateralReturned ? "good" : "bad"}">${result.collateralReturned ? "collateral back" : "collateral lost"}</span>` : ""}
      </div>
      ${renderRoomTraceStrip(result, { compact: true })}
      <p class="micro">${result.lastHandSummary?.text ?? "The table closed without a clean final read."}</p>
      <p class="micro">${rewardLine}</p>
      <p class="micro">${collateralLine}</p>
    </div>
  `;
}

function renderLastHandSummary(summary) {
  const playerWon = didPlayerTakeHand(summary);
  const tone = summary.type === "showdown" ? (playerWon ? "good" : "bad") : summary.type === "fold" ? (playerWon ? "good" : "warn") : "cool";
  return `
    <div class="card-block hand-summary ${summary.type} ${tone}">
      <div class="card-topline">
        ${renderRouteBadge("table-hand", "last hand")}
        <span class="pill ${tone}">${playerWon ? t("You owned the close") : t("Room pushed back")}</span>
      </div>
      <p class="eyebrow">${t("Last Hand")}</p>
      <div class="preview-grid compact-preview">
        ${renderPreviewCell(
          t("Close"),
          summary.type === "showdown" ? t("Showdown") : summary.type === "fold" ? t("Fold pressure") : t("Broken hand"),
          tone,
        )}
        ${renderPreviewCell(t("Read"), summary.handName ?? t("No board read"), summary.handName ? "cool" : "neutral")}
        ${renderPreviewCell(t("Winner"), summarizeWinner(summary.winnerIds), playerWon ? "good" : "warn")}
        ${renderPreviewCell(t("Board"), summary.board ?? t("No board read"), summary.board ? "cool" : "neutral")}
      </div>
      ${summary.river ? `<p class="micro"><strong>${t("River")}:</strong> ${summary.river}</p>` : ""}
      ${summary.playerCards ? `<p class="micro"><strong>${t("You")}:</strong> ${summary.playerCards}${summary.playerHandName ? ` / ${summary.playerHandName}` : ""}</p>` : ""}
      ${summary.playerBestFive ? `<p class="micro hand-best-five"><strong>${t("Best five")}:</strong> ${summary.playerBestFive}</p>` : ""}
      ${
        summary.opponentBreakdown?.length
          ? `
            <div class="hand-summary-reveal-stack">
              ${summary.opponentBreakdown
                .map(
                  (entry) => `
                    <p class="micro"><strong>${entry.name}:</strong> ${entry.cards}${entry.handName ? ` / ${entry.handName}` : ""}</p>
                    ${entry.bestFive ? `<p class="micro hand-best-five"><strong>${t("Best five")}:</strong> ${entry.bestFive}</p>` : ""}
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
      ${
        summary.winnerAwards?.length
          ? `
            <div class="hand-summary-reveal-stack hand-winner-awards">
              ${summary.winnerAwards
                .map(
                  (entry) => `
                    <p class="micro"><strong>${entry.name}:</strong> ${entry.handName ? `${entry.handName} / ` : ""}${t("Won")} ${money(entry.amount)}</p>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
      ${
        summary.potBreakdown?.length
          ? `
            <div class="hand-summary-pot-breakdown">
              ${summary.potBreakdown
                .map(
                  (pot) => `
                    <p class="micro"><strong>${pot.label}:</strong> ${money(pot.amount)} / ${summarizeWinner(pot.winnerIds)}${pot.handName ? ` / ${pot.handName}` : ""}</p>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
      <p class="micro">${summary.text}</p>
    </div>
  `;
}

function getInventorySellValue(def) {
  return def.kind === "valuable" ? def.value : def.sell ?? Math.max(0, Math.floor(def.buy * 0.5));
}

function renderInventoryActionStack(run, item, def) {
  if (game.state.mode !== "search" || !run || def.phase !== "search") {
    return "";
  }

  if (item.itemId === "steadying-drink") {
    return `
      <div class="button-row inventory-action-row">
        <button class="secondary" data-action="use-search-item" data-instance-id="${item.id}" ${
          run.actionPoints <= 0 || run.phase.heatReduced || run.heat <= 0 ? "disabled" : ""
        }>${t("Use Drink")}</button>
      </div>
    `;
  }

  const visibleDestinations = getVisibleDestinationIds(run);
  return `
    <div class="choice-stack inventory-action-stack">
      ${visibleDestinations
        .map(
          (tableId) => `
            <button class="secondary" data-action="use-search-item" data-instance-id="${item.id}" data-table-id="${tableId}" ${
              run.actionPoints <= 0 ? "disabled" : ""
            }>
              ${tm("revealTableButton", { table: tableCopy(tableId).name })}
            </button>
          `,
        )
        .join("")}
      <button class="ghost" data-action="use-search-item" data-instance-id="${item.id}" data-intent="refresh-route" ${
        run.actionPoints <= 0 ? "disabled" : ""
      }>${t("Refresh Fixed Route")}</button>
    </div>
  `;
}

function renderInventoryCard(item) {
  const def = getItemDef(item.itemId);
  const run = game.state.run;
  const sellValue = getInventorySellValue(def);
  const actionStack = renderInventoryActionStack(run, item, def);
  const canSell = game.state.mode === "search" && run && sellValue > 0;
  return `
    <div class="item-card ${def.kind === "valuable" ? "valuable-card" : "usable-card"}" title="${def.description}">
      ${def.kind === "valuable" ? renderCarrySprite(def.id, "large") : ""}
      <p class="eyebrow">${def.kind === "valuable" ? "Carry Value" : "Tool"}</p>
      <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">${
        def.kind === "valuable" ? money(def.value) : money(def.buy)
      }</span></div>
      <p class="micro">${def.description}</p>
      <div class="pill-row">
        <span class="pill">${def.kind === "valuable" ? "Valuable" : "Usable"}</span>
        <span class="pill">Slots ${def.slots}</span>
        ${def.collateral ? `<span class="pill good">Collateral-ready</span>` : ""}
      </div>
      ${actionStack}
      ${
        canSell
          ? `
            <div class="button-row inventory-action-row">
              <button class="ghost" data-action="sell-item" data-instance-id="${item.id}" ${
                run.actionPoints <= 0 ? "disabled" : ""
              }>${t("Sell")} ${money(sellValue)}</button>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderSettlementSnapshot(run, preview = buildExtractionPreview(run)) {
  const bestPlan = getBestAvailablePlan(preview);
  const zh = currentLanguage() === "zh";
  const carriedTotal = run.cashOnHand + preview.valuableTotal;
  return `
    <div class="card-block settlement-card top-gap">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("If You Cut Out Now")}</p>
          <h3>${t("Settlement Snapshot")}</h3>
        </div>
        ${bestPlan ? `<span class="pill good">${bestPlan.shortLabel}</span>` : `<span class="pill bad">${t("No clean exit")}</span>`}
      </div>
      <div class="preview-grid">
        ${renderPreviewCell("Cash in coat", money(run.cashOnHand))}
        ${renderPreviewCell("Valuables", money(preview.valuableTotal), "warm")}
        ${renderPreviewCell("Carry total", money(carriedTotal), "cool")}
        ${renderPreviewCell("Best settle", bestPlan ? money(bestPlan.totalSettled) : "0", bestPlan ? "good" : "bad")}
      </div>
      <p class="micro">
        ${
          bestPlan
            ? zh
              ? `${bestPlan.label} 当前预计能结出 ${money(bestPlan.totalSettled)}。${bestPlan.reason}`
              : `${bestPlan.label} currently settles ${money(bestPlan.totalSettled)}. ${bestPlan.reason}`
            : t("Nothing currently gets the run cleanly into the vault.")
        }
      </p>
      <p class="micro">${zh ? "这一局只结算身上现金与带出的物品，不再存在额外寄存现金。" : "This run settles only the cash and goods still on you. There is no separate cash stash flow."}</p>
    </div>
  `;
}

function renderRoomSettlementBanner(result) {
  const rewardValue = result.rewardId ? getItemDef(result.rewardId).value : 0;
  return `
    <section class="panel settlement-banner ${result.net >= 0 ? "good" : "bad"}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("Room Settlement")}</p>
          <h2>${result.tableName} / ${result.net >= 0 ? `+${money(result.net)}` : `-${money(Math.abs(result.net))}`}</h2>
        </div>
        ${renderRouteBadge(result.tableId, t("room closed"))}
      </div>
      <div class="preview-grid compact-preview">
        ${renderPreviewCell("Net", result.net >= 0 ? `+${money(result.net)}` : `-${money(Math.abs(result.net))}`, result.net >= 0 ? "good" : "bad")}
        ${renderPreviewCell("Reward", result.rewardName ? `${result.rewardName} / ${money(rewardValue)}` : "None", result.rewardAdded ? "good" : "neutral")}
        ${renderPreviewCell("Collateral", result.collateralName ?? "None", result.collateralReturned ? "good" : result.collateralLost ? "bad" : "neutral")}
        ${renderPreviewCell("Final read", result.lastHandSummary?.handName ?? summarizeHandType(result.lastHandSummary?.type), "cool")}
      </div>
      ${renderRoomVerdictStrip({
        handSummary: result.lastHandSummary,
        rewardName: result.rewardName,
        rewardAdded: result.rewardAdded,
        rewardValue,
        collateralName: result.collateralName,
        collateralReturned: result.collateralReturned,
        collateralLost: result.collateralLost,
      })}
      ${renderRoomTraceStrip(result)}
      ${renderSettlementManifest(result, rewardValue)}
      <p class="micro">${t(result.lastHandSummary?.text ?? "The room closed without a clean final read.")}</p>
    </section>
  `;
}

function renderRoomTraceStrip(result, options = {}) {
  const rewardTone = !result.rewardName ? "neutral" : result.rewardAdded ? "good" : "warn";
  const collateralTone = !result.collateralName
    ? "neutral"
    : result.collateralReturned
      ? "cool"
      : "bad";
  const handTone =
    result.lastHandSummary?.type === "showdown"
      ? "good"
      : result.lastHandSummary?.type === "fold"
        ? "warn"
        : "cool";

  return `
    <div class="room-trace-strip ${options.compact ? "compact" : ""}">
      ${renderRoomTraceCard({
        label: "Reward Trace",
        title: result.rewardName ?? "No side reward",
        detail: result.rewardName ? (result.rewardAdded ? "Taken off the room" : "Won but left behind") : "No prize item came free",
        tone: rewardTone,
        rewardId: result.rewardId,
        kind: "reward",
      })}
      ${renderRoomTraceCard({
        label: "Collateral Trace",
        title: result.collateralName ?? "No collateral",
        detail: result.collateralName
          ? result.collateralReturned
            ? "Returned on the final hand"
            : "Stayed behind on the felt"
          : "Nothing extra was posted",
        tone: collateralTone,
        kind: "collateral",
      })}
      ${renderRoomTraceCard({
        label: "Last Hand",
        title: result.lastHandSummary?.handName ?? summarizeHandType(result.lastHandSummary?.type ?? "quiet"),
        detail: result.lastHandSummary?.type === "showdown"
          ? "The room closed on a full reveal"
          : result.lastHandSummary?.type === "fold"
            ? "Pressure ended the hand early"
            : "The close came without a clean board read",
        tone: handTone,
        kind: result.lastHandSummary?.type ?? "quiet",
      })}
    </div>
  `;
}

function renderRoomTraceCard({ label, title, detail, tone = "neutral", kind = "quiet", rewardId = null }) {
  return `
    <div class="room-trace-card ${tone}">
      <div class="room-trace-head">
        ${renderRoomTraceIcon(kind, tone, rewardId)}
        <div class="room-trace-copy">
          <span class="manifest-label">${label}</span>
          <strong>${title}</strong>
          <span class="micro">${detail}</span>
        </div>
      </div>
    </div>
  `;
}

function renderRoomTraceIcon(kind, tone, rewardId = null) {
  if (rewardId) {
    return `<div class="room-trace-icon reward-icon">${renderCarrySprite(rewardId, "mini")}</div>`;
  }
  return `
    <div class="room-trace-icon">
      <div class="room-trace-glyph ${kind} ${tone}">
        <span class="trace-a"></span>
        <span class="trace-b"></span>
        <span class="trace-c"></span>
      </div>
    </div>
  `;
}

function renderIntelCard(run, tableId) {
  const intel = run.intel[tableId];
  const table = tableCopy(tableId);
  return `
    <div class="item-card intel-card ${tableId}">
      <p class="eyebrow">${t("Intel Board")}</p>
      <h3>${table.name}</h3>
      ${["rule", "opponents", "reward"]
        .map((layer) =>
          intel[layer]
            ? `<div class="intel-reveal"><div class="intel-pill pill good">${localizeLayerLabel(layer, currentLanguage())} ${t("revealed")}</div><p class="micro">${table.hiddenInfo[layer]}</p></div>`
            : `<button class="ghost" data-action="gather-intel" data-table-id="${tableId}" data-layer="${layer}" ${
                run.actionPoints <= 0 ? "disabled" : ""
              }>${tm("revealLayerButton", { layer: localizeLayerLabel(layer, currentLanguage()) })}</button>`,
        )
        .join("")}
    </div>
  `;
}

function renderShopCard(run, itemId) {
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

function renderSearchItemUse(run, item) {
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
              ${tm("revealTableButton", { table: tableCopy(tableId).name })}
            </button>
          `,
        ).join("")}
        <button class="ghost" data-action="use-search-item" data-instance-id="${item.id}" data-intent="refresh-route" ${
          run.actionPoints <= 0 ? "disabled" : ""
        }>${t("Refresh Fixed Route")}</button>
      </div>
    </div>
  `;
}

function shouldPrioritizeExtraction(run, preview) {
  return Boolean(
    pendingExtractionAction ||
      run.completedTables.length ||
      run.lastTableResult ||
      preview.valuableTotal > 0 ||
      run.heat > 0,
  );
}

function renderSearchDecisionRail(run, preview, extractionCommit) {
  return `
    <div class="section-heading">
      <div>
        <p class="eyebrow">${t("Leaving Clean")}</p>
        <h3>${shouldPrioritizeExtraction(run, preview) ? t("What The Bar Is Holding") : t("Extraction Routes")}</h3>
      </div>
    </div>
    ${renderExposureLedger(run, preview)}
    <div class="choice-stack">
      ${renderExtractionCards(run, preview)}
    </div>
  `;
}

function renderFirstPersonFrame(mode) {
  if (mode === "search") {
    return `
      <div class="first-person-frame search-frame" aria-hidden="true">
        <span class="fp-counter"></span>
        <span class="fp-arm left"></span>
        <span class="fp-arm right"></span>
        <span class="fp-glass"></span>
        <span class="fp-coat"></span>
      </div>
    `;
  }

  return `
    <div class="first-person-frame table-frame" aria-hidden="true">
      <span class="fp-table-edge"></span>
      <span class="fp-arm left"></span>
      <span class="fp-arm right"></span>
      <span class="fp-chip-stack"></span>
      <span class="fp-card-shadow"></span>
    </div>
  `;
}

function renderOutsiderFrame(mode) {
  return `
    <div class="outsider-frame ${mode}-outsider-frame" aria-hidden="true">
      <span class="outside-bar top"></span>
      <span class="outside-bar bottom"></span>
      <span class="outside-rig left"></span>
      <span class="outside-rig right"></span>
      <span class="outside-vignette"></span>
    </div>
  `;
}

function renderSearchPresenceStrip(run, preview = buildExtractionPreview(run)) {
  const valuables = getRunValuables(run);
  const reservation = run.fixedRouteReservation ? routeCopy(run.fixedRouteReservation) : null;
  const routeOffer = routeCopy(run.fixedRouteOffer);
  const hiddenRoutes = [preview.serviceStairs, preview.riverLaunch].filter((plan) => plan?.visible);
  return `
    <div class="scene-presence-strip search-presence-strip">
      <div class="presence-card stash cool">
        <span class="presence-label">${t("Cash Line")}</span>
        <strong>${currentLanguage() === "zh" ? `${money(run.cashOnHand)} 仍在身上` : `${money(run.cashOnHand)} still carried`}</strong>
        <span class="presence-copy">${currentLanguage() === "zh" ? "这一局不会额外寄存现金，真正结算要靠撤离成功。" : "Cash stays exposed until extraction actually clears."}</span>
      </div>
      <div class="presence-card shelf ${run.shopStock.length ? "neutral" : "warn"}">
        <span class="presence-label">${t("Back Shelf")}</span>
        <strong>${currentLanguage() === "zh" ? `${run.shopStock.length} 件工具摆在台上` : `${run.shopStock.length} tools on the rail`}</strong>
        <span class="presence-copy">${currentLanguage() === "zh" ? "镜片、酒、一次性电话等都在这里。" : "Marked Lens, drink, burner phone, and more"}</span>
      </div>
      <div class="presence-card route ${reservation ? "cool" : "neutral"}">
        <span class="presence-label">${t("Service Gate")}</span>
        <strong>${reservation ? reservation.name : routeOffer.name}</strong>
        <span class="presence-copy">${reservation ? t("Reserved line is waiting on this return.") : t("No route reserved yet.")}</span>
      </div>
      <div class="presence-card route ${hiddenRoutes.length ? "good" : "neutral"}">
        <span class="presence-label">${t("Hidden routes")}</span>
        <strong>${hiddenRoutes.length ? hiddenRoutes.map((plan) => plan.shortLabel).join(" / ") : t("Still hidden")}</strong>
        <span class="presence-copy">${hiddenRoutes.length ? t("Item-led lines are now visible in extraction.") : t("Some exits only appear after the right item is used or carried.")}</span>
      </div>
      <div class="presence-card coat ${valuables.length ? "warn" : "neutral"}">
        <span class="presence-label">${t("Coat Check")}</span>
        <strong>${valuables.length ? (currentLanguage() === "zh" ? `${valuables.length} 件带货` : `${valuables.length} carry item${valuables.length > 1 ? "s" : ""}`) : t("Coat light")}</strong>
        <span class="presence-copy">${valuables.length ? (currentLanguage() === "zh" ? `${money(preview.valuableTotal)} 的价值仍暴露在外套里。` : `${money(preview.valuableTotal)} still exposed in the coat.`) : t("Nothing worth checking yet.")}</span>
      </div>
    </div>
  `;
}

function renderDestinationRail(run, compact = false) {
  return `
    <div class="section-heading ${compact ? "" : ""}">
      <div>
        <p class="eyebrow">${t("The Building")}</p>
        <h2>${t("Destinations")}</h2>
      </div>
    </div>
    <div class="table-grid ${compact ? "compact-destination-grid" : ""}">
      ${TABLE_ORDER.map((tableId) => renderDestinationCard(run, tableId, { compact })).join("")}
    </div>
  `;
}

function renderExposureLedger(run, preview = buildExtractionPreview(run)) {
  const bestPlan = getBestAvailablePlan(preview);
  const nextTable = getNextTablePressure(run);
  const exposedCarry = run.cashOnHand + preview.valuableTotal;
  const zh = currentLanguage() === "zh";
  return `
    <div class="card-block exposure-ledger">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("Risk Ledger")}</p>
          <h3>${bestPlan ? t("If You Leave vs If You Stay") : t("Nothing Is Safe Yet")}</h3>
        </div>
        ${bestPlan ? `<span class="pill good">${bestPlan.shortLabel}</span>` : `<span class="pill warn">${t("No live clean settle")}</span>`}
      </div>
      <div class="preview-grid exposure-grid">
        ${renderPreviewCell(t("Safe now"), bestPlan ? money(bestPlan.totalSettled) : "0", bestPlan ? "good" : "bad")}
        ${renderPreviewCell(t("Exposed carry"), money(exposedCarry), exposedCarry > 0 ? "warn" : "neutral")}
        ${renderPreviewCell(t("Hidden routes"), [preview.serviceStairs, preview.riverLaunch].filter((plan) => plan?.visible).length || t("None"), [preview.serviceStairs, preview.riverLaunch].some((plan) => plan?.visible) ? "good" : "neutral")}
        ${renderPreviewCell(
          t("If you stay"),
          nextTable ? `${tableCopy(nextTable.id).name} ${money(nextTable.buyIn)} / ${t("Heat")} +${nextTable.heatGain}` : t("No more rooms"),
          nextTable ? "warn" : "cool",
        )}
      </div>
      <p class="micro">
        ${
          currentLanguage() === "zh"
            ? "现金和货物都会一直暴露到真正撤离为止。隐藏路线只会在对应条件满足后出现。"
            : "Cash and goods stay exposed until a real extraction lands. Hidden routes only appear once their conditions are met."
        }
      </p>
      <p class="micro">
        ${
          nextTable
            ? zh
              ? `${tableCopy(nextTable.id).name} 会要求你再把 ${money(nextTable.buyIn)} 压回台面，并额外增加 ${nextTable.heatGain} 点风声。`
              : `${nextTable.name} asks ${money(nextTable.buyIn)} back onto the felt and adds Heat +${nextTable.heatGain}.`
            : t("All open value is already on the line. From here, the only question is how you leave with it.")
        }
      </p>
    </div>
  `;
}

function getNextTablePressure(run) {
  return TABLE_ORDER.map((tableId) => getTableDef(tableId)).find(
    (table) =>
      !run.completedTables.includes(table.id) &&
      (!table.unlocksAfter || run.completedTables.includes(table.unlocksAfter)),
  );
}

function renderDestinationCard(run, tableId, { compact = false } = {}) {
  const table = tableCopy(tableId);
  const rawTable = getTableDef(tableId);
  const intel = run.intel[tableId];
  const lockedByFlow = table.unlocksAfter && !run.completedTables.includes(table.unlocksAfter);
  const alreadyDone = run.completedTables.includes(tableId);
  const insufficientCash = run.cashOnHand < table.buyIn;
  const disabled = lockedByFlow || alreadyDone || insufficientCash;
  const valuables = run.inventory.filter((item) => getItemDef(item.itemId).kind === "valuable");
  const intelKnown = ["rule", "opponents", "reward"].filter((layer) => intel[layer]).length;
  const intelSummary = buildDestinationIntelSummary(table, intel);
  const statusLabel = alreadyDone
    ? t("Cleared")
    : lockedByFlow
      ? t("Locked")
      : insufficientCash
        ? t("Short cash")
        : t("Open");

  return `
    <div class="route-card table-route ${tableId} ${disabled ? "locked" : ""} ${compact ? "compact-destination" : ""}">
      <div class="card-topline">
        ${renderRouteBadge(tableId, table.unlocksAfter ? "deep room" : "front room")}
      </div>
      <p class="eyebrow">${table.unlocksAfter ? t("Deep Room") : t("Front Room")}</p>
      <div class="stat-row"><span class="stat-label">${table.name}</span><span class="stat-value">${money(
        table.buyIn,
      )}</span></div>
      <div class="pill-row">
        <span class="pill ${rawTable.risk === "Low" ? "good" : "warn"}">${table.risk}</span>
        <span class="pill">${t("Heat")} +${table.heatGain}</span>
        <span class="pill ${alreadyDone ? "good" : lockedByFlow || insufficientCash ? "warn" : "cool"}">${statusLabel}</span>
      </div>
      <p class="micro">${table.role}</p>
      <div class="intel-progress-row">
        ${renderIntelDot("rule", intel.rule)}
        ${renderIntelDot("opponents", intel.opponents)}
        ${renderIntelDot("reward", intel.reward)}
        <span class="micro intel-progress-copy">${t("Intel")} ${intelKnown}/3 ${t("known")}</span>
      </div>
      <p class="micro">${intelSummary}</p>
      <div class="compact-list ${compact ? "compact-hidden" : ""}">
        ${
          compact
            ? ""
            : `
            <p class="micro">${intel.rule ? table.hiddenInfo.rule : t("Rule: unknown")}</p>
            <p class="micro">${intel.opponents ? table.hiddenInfo.opponents : t("Opponents: unknown")}</p>
            <p class="micro">${intel.reward ? table.hiddenInfo.reward : t("Reward hook: unknown")}</p>
          `
        }
      </div>
      ${
        tableId === "mirror-hall"
          ? `
            <label class="micro" for="collateral-${tableId}">${t("Collateral")}</label>
            <select id="collateral-${tableId}" ${disabled ? "disabled" : ""}>
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
      <button class="cta" data-action="enter-table" data-table-id="${tableId}" ${disabled ? "disabled" : ""}>
        ${
          alreadyDone
            ? t("Table cleared")
            : lockedByFlow
              ? t("Locked by flow")
              : insufficientCash
                ? t("Not enough cash")
                : t("Enter table")
        }
      </button>
    </div>
  `;
}

function buildDestinationIntelSummary(table, intel) {
  if (intel.reward) {
    return table.hiddenInfo.reward;
  }
  if (intel.opponents) {
    return table.hiddenInfo.opponents;
  }
  if (intel.rule) {
    return table.hiddenInfo.rule;
  }
  return currentLanguage() === "zh"
    ? "还没有拿到足够强的房间判断。继续做情报，或者盲进。"
    : "No strong room read yet. Work the intel board or walk in cold.";
}

function renderIntelDot(label, known) {
  return `<span class="intel-dot ${known ? "known" : "unknown"}">${label}</span>`;
}

function renderExtractionCards(
  run,
  preview = buildExtractionPreview(run),
) {
  const valuables = getRunValuables(run);
  const zh = currentLanguage() === "zh";
  return `
    <div class="route-card extraction-route compact-route general-route ${preview.general.available ? "" : "locked"}">
      <div class="card-topline">
        ${renderRouteBadge("general-extraction", "public exit")}
        <span class="pill ${preview.general.available ? "good" : "warn"}">${preview.general.available ? t("Open") : t("strained")}</span>
      </div>
      ${renderExtractionIdentity(
        "general",
        t("Taxed Walkout"),
        t("The cleanest visible exit. The goods survive, the cash gets skimmed."),
        [t("Public eyes"), t("Cash tax"), zh ? "6 风声封门" : "Locks at 6 heat"],
      )}
      <p class="eyebrow">${t("Front Of House")}</p>
      <div class="stat-row"><span class="stat-label">${t("General Extraction")}</span><span class="stat-value">${money(
        preview.general.fee,
      )}</span></div>
      <div class="preview-grid extraction-preview-grid">
        ${renderPreviewCell(t("Settles"), money(preview.general.totalSettled), preview.general.available ? "good" : "bad")}
        ${renderPreviewCell(t("Fee"), money(preview.general.fee), "warn")}
      </div>
      ${
        valuables.length
          ? renderCarryPreviewPanel(t("Carry at risk"), valuables, {
              tone: "warn",
              compact: true,
              totalValue: preview.general.valuableTotal,
              note: zh ? "前厅能保住货物，但会抽走看得见的现金。" : "Front-of-house keeps the goods, but taxes the visible cash.",
            })
          : ""
      }
      <p class="micro">${preview.general.reason}</p>
      <button
        class="cta"
        data-action="extract-general"
        ${preview.general.available ? "" : "disabled"}
      >${t("Take This Route")}</button>
    </div>
    <div class="route-card extraction-route compact-route fixed-route ${preview.fixed.available ? "" : "locked"}">
      <div class="card-topline">
        ${renderRouteBadge("fixed-extraction", "prepared line")}
        <span class="pill ${preview.fixed.available ? "good" : preview.fixed.reserved ? "warn" : ""}">${
          preview.fixed.available ? t("ready") : preview.fixed.reserved ? t("reserved") : t("not reserved")
        }</span>
      </div>
      ${renderExtractionIdentity(
        "fixed",
        t("Runner Hand-Off"),
        zh ? `${preview.fixed.routeName} 会把撤离压得更紧，但前提是耳语还活着。` : `${preview.fixed.routeName} keeps the exit tight, but only while the whisper stays live.`,
        [t("Reserve first"), t("Lowest handoff"), zh ? `风声上限 ${run.fixedRouteReservation?.maxHeat ?? run.fixedRouteOffer.maxHeat}` : `Heat cap ${run.fixedRouteReservation?.maxHeat ?? run.fixedRouteOffer.maxHeat}`],
      )}
      <p class="eyebrow">${t("Prepared Line")}</p>
      <div class="stat-row"><span class="stat-label">${t("Fixed Route")}</span><span class="stat-value">${
        preview.fixed.routeName
      }</span></div>
      <div class="preview-grid extraction-preview-grid">
        ${renderPreviewCell(t("Settles"), money(preview.fixed.totalSettled), preview.fixed.available ? "good" : "warn")}
        ${renderPreviewCell(t("Cost"), money(preview.fixed.fee), "cool")}
      </div>
      ${
        valuables.length
          ? renderCarryPreviewPanel(t("Carry on the line"), valuables, {
              tone: "cool",
              compact: true,
              totalValue: preview.fixed.valuableTotal,
              note: t("The prepared line preserves the goods if the reservation is still live."),
            })
          : ""
      }
      <p class="micro">${preview.fixed.reason}</p>
      <button
        class="cta"
        data-action="extract-fixed"
        ${preview.fixed.available ? "" : "disabled"}
      >${t("Take This Route")}</button>
    </div>
    <div class="route-card extraction-route compact-route dropbag-route">
      <div class="card-topline">
        ${renderRouteBadge("dropbag-extraction", "cut and run")}
        <span class="pill warn">${t("guaranteed")}</span>
      </div>
      ${renderExtractionIdentity(
        "dropbag",
        t("Break Glass Exit"),
        t("This route always opens. The only question is which part of the run you are willing to burn."),
        [t("Always live"), t("Choose a loss"), t("Guaranteed")],
      )}
      <p class="eyebrow">${t("Emergency Choice")}</p>
      <div class="stat-row"><span class="stat-label">${t("Drop-Bag Extraction")}</span><span class="stat-value">${money(
        10,
      )}</span></div>
      <p class="micro">${t("Guaranteed, ugly, and expensive in the wrong currency.")}</p>
      <div class="choice-stack route-option-grid">
        <div class="choice-preview ${preview.dropbagCash.available ? "" : "locked"}">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${t("Option A")}</p>
              <h3>${t("Drop 40% Cash")}</h3>
            </div>
            <span class="pill ${preview.dropbagCash.available ? "warn" : "bad"}">${money(preview.dropbagCash.sacrificed)} ${t("lost")}</span>
          </div>
          <div class="preview-grid extraction-preview-grid">
            ${renderPreviewCell(t("Settles"), money(preview.dropbagCash.totalSettled), preview.dropbagCash.available ? "warn" : "bad")}
            ${renderPreviewCell(t("Drop"), money(preview.dropbagCash.sacrificed), "bad")}
          </div>
          <p class="micro">${preview.dropbagCash.reason}</p>
          <button
            class="danger"
            data-action="extract-dropbag-cash"
            ${preview.dropbagCash.available ? "" : "disabled"}
          >${t("Take This Route")}</button>
        </div>
        <div class="choice-preview ${preview.dropbagValuables.available ? "" : "locked"}">
          <div class="section-heading">
            <div>
              <p class="eyebrow">${t("Option B")}</p>
              <h3>${t("Drop All Valuables")}</h3>
            </div>
            <span class="pill ${preview.dropbagValuables.available ? "bad" : "warn"}">${money(preview.dropbagValuables.droppedValue)} ${t("dumped")}</span>
          </div>
          <div class="preview-grid extraction-preview-grid">
            ${renderPreviewCell(t("Settles"), money(preview.dropbagValuables.totalSettled), preview.dropbagValuables.available ? "warn" : "bad")}
            ${renderPreviewCell(t("Dump"), money(preview.dropbagValuables.droppedValue), "bad")}
          </div>
          ${
            valuables.length
              ? renderCarryPreviewPanel(t("Goods to dump"), valuables, {
                  tone: "bad",
                  compact: true,
                  totalValue: preview.dropbagValuables.droppedValue,
                  note: t("Every carried valuable gets burned to buy the clean exit."),
                })
              : ""
          }
          <p class="micro">${preview.dropbagValuables.reason}</p>
          <button
            class="danger"
            data-action="extract-dropbag-valuables"
            ${preview.dropbagValuables.available ? "" : "disabled"}
          >${t("Take This Route")}</button>
        </div>
      </div>
    </div>
  `;
}

function getPendingExtractionPlan(run, preview = buildExtractionPreview(run)) {
  if (!run || !pendingExtractionAction) {
    return null;
  }
  const zh = currentLanguage() === "zh";

  if (pendingExtractionAction === "extract-general" && preview.general.available) {
    return {
      action: "extract-general",
      tone: "general",
      badge: "general-extraction",
      posture: "Public Exit Review",
      title: "Taxed Walkout",
      description: zh
        ? "你会从人人看得见的楼层离开。这局的结构能保住，但大楼会顺手从你暴露的现金里刮走一层。"
        : "You leave through the visible floor. The run stays intact, but the building skims your visible cash on the way out.",
      confirmLabel: "Commit Walk Front",
      summary: preview.general.reason,
      routeLabel: "Front Of House",
      metrics: [
        { label: "Settles", value: money(preview.general.totalSettled), tone: "good" },
        { label: "Fee", value: money(preview.general.fee), tone: "warn" },
        { label: "Goods", value: money(preview.general.valuableTotal), tone: "neutral" },
      ],
      sequence: [
        { label: "Step 1", value: "Cross the visible floor", tone: "warn" },
        { label: "Step 2", value: zh ? `从现金里支付 ${money(preview.general.fee)}` : `Pay ${money(preview.general.fee)} on cash`, tone: "warn" },
        { label: "Step 3", value: "Settle stash and keep goods", tone: "good" },
      ],
      afterLine: "Once you commit, the bar closes the run immediately. This route preserves the goods, but the floor sees the money move.",
    };
  }

  if (pendingExtractionAction === "extract-fixed" && preview.fixed.available) {
    return {
      action: "extract-fixed",
      tone: "fixed",
      badge: "fixed-extraction",
      posture: "Reserved Line Review",
      title: "Runner Hand-Off",
      description: t("A prepared contact keeps the heat off your carry if the whisper is still live when you move."),
      confirmLabel: "Commit Hand-Off",
      summary: preview.fixed.reason,
      routeLabel: preview.fixed.routeName,
      metrics: [
        { label: "Settles", value: money(preview.fixed.totalSettled), tone: "good" },
        { label: "Handoff", value: money(preview.fixed.fee), tone: "cool" },
        { label: "Goods", value: money(preview.fixed.valuableTotal), tone: "neutral" },
      ],
      sequence: [
        { label: "Step 1", value: "Meet the reserved contact", tone: "cool" },
        { label: "Step 2", value: zh ? `烧掉耳语线并支付 ${money(preview.fixed.fee)}` : `Burn the whisper and pay ${money(preview.fixed.fee)}`, tone: "cool" },
        { label: "Step 3", value: "Settle the run under the heat cap", tone: "good" },
      ],
      afterLine: "The reservation is consumed on use. If the whisper survives the heat check, this is the cleanest vault settlement in the build.",
    };
  }

  if (pendingExtractionAction === "extract-dropbag-cash" && preview.dropbagCash.available) {
    return {
      action: "extract-dropbag-cash",
      tone: "dropbag",
      badge: "dropbag-extraction",
      posture: "Emergency Cut Review",
      title: "Break Glass Exit / Cash",
      description: t("You keep the goods and buy the exit by burning a chunk of liquid cash before the room seals up."),
      confirmLabel: "Commit Cash Burn",
      summary: preview.dropbagCash.reason,
      routeLabel: zh ? "紧急切出" : "Emergency Cut-Out",
      metrics: [
        { label: "Settles", value: money(preview.dropbagCash.totalSettled), tone: "warn" },
        { label: "Lost", value: money(preview.dropbagCash.sacrificed), tone: "bad" },
        { label: "Goods", value: money(preview.dropbagCash.valuableTotal), tone: "neutral" },
      ],
      sequence: [
        { label: "Step 1", value: "Force the emergency exit", tone: "bad" },
        { label: "Step 2", value: zh ? `烧掉 ${money(preview.dropbagCash.sacrificed)} 现金` : `Burn ${money(preview.dropbagCash.sacrificed)} in cash`, tone: "bad" },
        { label: "Step 3", value: "Keep the carried goods moving", tone: "warn" },
      ],
      afterLine: "This is a guaranteed break, but the room takes payment in visible cash before it lets you through.",
    };
  }

  if (pendingExtractionAction === "extract-dropbag-valuables" && preview.dropbagValuables.available) {
    return {
      action: "extract-dropbag-valuables",
      tone: "dropbag",
      badge: "dropbag-extraction",
      posture: "Emergency Cut Review",
      title: "Break Glass Exit / Goods",
      description: t("You keep the cash moving and dump every carried valuable to buy a clean break right now."),
      confirmLabel: "Commit Dump",
      summary: preview.dropbagValuables.reason,
      routeLabel: zh ? "紧急切出" : "Emergency Cut-Out",
      metrics: [
        { label: "Settles", value: money(preview.dropbagValuables.totalSettled), tone: "warn" },
        { label: "Dumped", value: money(preview.dropbagValuables.droppedValue), tone: "bad" },
        { label: "Cash", value: money(preview.dropbagValuables.settledCash), tone: "neutral" },
      ],
      sequence: [
        { label: "Step 1", value: "Force the emergency exit", tone: "bad" },
        { label: "Step 2", value: zh ? `丢掉价值 ${money(preview.dropbagValuables.droppedValue)} 的货物` : `Dump ${money(preview.dropbagValuables.droppedValue)} in goods`, tone: "bad" },
        { label: "Step 3", value: "Protect the cash and settle", tone: "warn" },
      ],
      afterLine: "This route keeps the cash alive, but every carried valuable is abandoned to buy the break.",
    };
  }

  return null;
}

function renderExtractionCommitPanel(plan) {
  return "";
}

function renderExtractionIdentity(type, title, description, traits = []) {
  return `
    <div class="route-identity ${type}">
      <div class="route-identity-copy">
        <p class="eyebrow">${t("Route Posture")}</p>
        <h3>${t(title)}</h3>
        <p class="micro">${t(description)}</p>
      </div>
      <div class="route-trait-row">
        ${traits.map((trait) => `<span class="route-trait ${type}">${t(trait)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderRoomStakes(run, table, preview = getRoomRewardPreview(run, table)) {
  return `
    <div class="stakes-grid">
      <div class="stakes-lane premium">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${t("Premium Line")}</p>
            <h3>${preview.premium.name}</h3>
          </div>
          <span class="pill ${preview.premium.armed ? "good" : "warn"}">${money(preview.premium.value)}</span>
        </div>
        ${renderCarryPreviewPanel(
          "Premium prize",
          [{ itemId: preview.premium.id, name: preview.premium.name, value: preview.premium.value }],
          {
            tone: preview.premium.armed ? "good" : "warn",
            compact: true,
            headingText: "Reward preview",
          },
        )}
        <p class="micro">${preview.premium.text}</p>
      </div>
      <div class="stakes-lane fallback">
        <div class="section-heading">
          <div>
            <p class="eyebrow">${t("Fallback Line")}</p>
            <h3>${preview.fallback.name}</h3>
          </div>
          <span class="pill">${money(preview.fallback.value)}</span>
        </div>
        ${renderCarryPreviewPanel(
          "Fallback prize",
          [{ itemId: preview.fallback.id, name: preview.fallback.name, value: preview.fallback.value }],
          {
            tone: "cool",
            compact: true,
            headingText: "Reward preview",
          },
        )}
        <p class="micro">${preview.fallback.text}</p>
      </div>
      <div class="stakes-lane info">
        <div class="preview-grid compact-preview">
          ${renderPreviewCell("Hand", `${table.handNumber}/${table.totalHands}`)}
          ${renderPreviewCell("Final hand", table.handNumber === table.totalHands ? "Live" : "Ahead", table.handNumber === table.totalHands ? "warn" : "neutral")}
          ${renderPreviewCell("Collateral", table.collateral ? table.collateral.name : "None", table.collateral ? "cool" : "neutral")}
          ${renderPreviewCell("Room state", preview.roomState, preview.roomTone)}
        </div>
      </div>
    </div>
  `;
}

function renderTableItemCard(table, item) {
  const def = getItemDef(item.itemId);
  if (item.itemId === "marked-lens") {
    return `
      <div class="item-card table-item-card">
        <p class="eyebrow">${t("Table Item")}</p>
        <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">Heat +1</span></div>
        <p class="micro">${def.description}</p>
        <button class="secondary" data-action="use-table-item" data-instance-id="${item.id}" ${
          table.itemUsage.markedLens || table.street === "river" ? "disabled" : ""
        }>${t("Peek Next Card")}</button>
      </div>
    `;
  }
  if (item.itemId === "signal-lighter") {
    return `
      <div class="item-card table-item-card">
        <p class="eyebrow">${t("Table Item")}</p>
        <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">${t("One read")}</span></div>
        <p class="micro">${def.description}</p>
        ${table.signalRead ? renderSignalReadCard(table.signalRead, table) : ""}
        ${table.players
          .filter((player) => player.id !== "player" && !player.folded)
          .map(
            (player) => `
              <button class="secondary" data-action="use-table-item" data-instance-id="${item.id}" data-target-id="${player.id}" ${
                table.itemUsage.signalLighter ? "disabled" : ""
              }>
                ${currentLanguage() === "zh" ? `读取 ${player.name}` : `Read ${player.name}`}
              </button>
            `,
          )
          .join("")}
      </div>
    `;
  }
  if (item.itemId === "sleeve-clip") {
    return `
      <div class="item-card table-item-card">
        <p class="eyebrow">${t("Table Item")}</p>
        <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">Heat +2</span></div>
        <p class="micro">${def.description}</p>
        <button class="secondary" data-action="use-table-item" data-instance-id="${item.id}" ${
          table.itemUsage.sleeveClip ||
          table.street !== "preflop" ||
          table.turnCounter > 0 ||
          table.currentActorId !== "player"
            ? "disabled"
            : ""
        }>${t("Swap a Hole Card")}</button>
      </div>
    `;
  }
  return `
    <div class="item-card table-item-card">
      <p class="eyebrow">${t("Passive Item")}</p>
      <div class="stat-row"><span class="stat-label">${def.name}</span><span class="stat-value">Passive</span></div>
      <p class="micro">${def.description}</p>
    </div>
  `;
}

function renderOpponentRow(table, participant) {
  const opponentDef = opponentCopy(participant.archetypeId ?? participant.id);
  const read = table.signalRead && table.signalRead.targetId === participant.id ? table.signalRead : null;
  const isActive = table.currentActorId === participant.id;
  const name = participantName(participant);
  return `
    <div class="opponent-row-shell">
      ${renderOpponentPortrait(participant, table)}
      <div class="opponent-chip ${isActive ? "active under-light" : ""} ${
        participant.folded ? "folded" : ""
      }">
        <div>
          <strong>${name}</strong>
          <div class="micro">${opponentDef.intro}</div>
          <div class="tell-line">${t(describeOpponentTell(participant, table))}</div>
          <div class="opponent-threat-line ${isActive ? "active" : ""}">
            <span class="threat-chip ${isActive ? "warn" : participant.currentBet >= table.currentBet && table.currentBet > 0 ? "cool" : "neutral"}">
              ${t(describeThreatChip(participant, table))}
            </span>
            <span class="micro">${t(describeOpponentPressureAccent(participant, table))}</span>
          </div>
          <div class="micro">${t("Stack")} ${money(participant.stack)} | ${t("Bet")} ${money(participant.currentBet)}</div>
        </div>
        <div class="pill-row">
          <span class="pill">${t(describePressureState(participant, table))}</span>
          ${read ? `<span class="pill ${read.tone}">${t("Read")}: ${read.label}</span>` : ""}
          ${participant.folded ? `<span class="pill bad">${t("Folded")}</span>` : ""}
        </div>
      </div>
    </div>
    ${read ? renderSignalReadCard(read, table, name) : ""}
    <div class="card-row">
      ${renderHiddenCard()}
      ${renderHiddenCard()}
    </div>
  `;
}

function renderTablePressureShell(run, table, preview) {
  const focus = getTablePressureFocus(table);
  const player = table.players[0];
  const callAmount = Math.max(0, table.currentBet - player.currentBet);
  const focusName = focus.participant ? participantName(focus.participant) : focus.actor;
  return `
    <div class="table-pressure-shell ${table.tableDef.id} ${focus.tone}">
      <div class="card-topline">
        ${renderRouteBadge(table.tableDef.id, focus.badge)}
        <span class="pill ${focus.tone}">${t(focus.status)}</span>
      </div>
      <div class="table-pressure-grid">
        <div class="pressure-copy">
          <p class="eyebrow">${t("Under The Light")}</p>
          <h3>${t(focus.title)}</h3>
          <p class="micro">${t(focus.text)}</p>
        </div>
        <div class="preview-grid compact-preview">
          ${renderPreviewCell(t("Actor"), t(focus.participant ? focusName : focus.actor), focus.tone)}
          ${renderPreviewCell(t("To call"), money(callAmount), callAmount > 0 ? "warn" : "neutral")}
          ${renderPreviewCell(t("Reward lane"), t(preview.roomState), preview.roomTone)}
          ${renderPreviewCell(t("Heat"), `${run.heat} / ${localizeHeatBand(getHeatBand(run.heat), currentLanguage())}`, heatClass(run.heat))}
        </div>
      </div>
      ${
        focus.participant
          ? `
            <div class="pressure-spotlight ${focus.tone}">
              ${renderOpponentPortrait(focus.participant, table)}
              <div class="pressure-spotlight-copy">
                <strong>${focusName}</strong>
                <span class="micro">${t(focus.spotlight)}</span>
              </div>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderTablePresenceStrip(table) {
  return `
    <div class="scene-presence-strip table-presence-strip">
      ${table.players
        .map((participant) => renderTablePresenceSeat(table, participant))
        .join("")}
    </div>
  `;
}

function renderTablePresenceSeat(table, participant) {
  const archetype = participant.id === "player" ? "player-seat" : participant.archetypeId ?? participant.id;
  const isActive = table.currentActorId === participant.id;
  const folded = participant.folded;
  return `
    <div class="presence-seat ${isActive ? "active" : ""} ${folded ? "folded" : ""}">
      <div class="presence-bust ${archetype}">
        <span class="bust-halo"></span>
        <span class="bust-head"></span>
        <span class="bust-face"></span>
        <span class="bust-body"></span>
        <span class="bust-accent"></span>
      </div>
      <div class="presence-seat-copy">
        <strong>${participantName(participant)}</strong>
        <span class="micro">${participant.id === "player" ? t("Your side of the felt") : t(describePressureState(participant, table))}</span>
      </div>
    </div>
  `;
}

function renderOpponentPortrait(participant, table) {
  const archetype = participant.archetypeId ?? participant.id;
  return `
    <div class="pixel-portrait ${archetype} ${table.currentActorId === participant.id ? "active" : ""} ${
      participant.folded ? "folded" : ""
    }">
      <div class="portrait-halo"></div>
      <div class="portrait-head"></div>
      <div class="portrait-face"></div>
      <div class="portrait-accent"></div>
      <div class="portrait-body"></div>
    </div>
  `;
}

function renderRouteBadge(type, label) {
  return `
    <div class="route-badge ${type}">
      <div class="route-glyph">
        <span class="glyph-a"></span>
        <span class="glyph-b"></span>
        <span class="glyph-c"></span>
      </div>
      <span class="route-label">${typeof label === "string" ? t(label) : label}</span>
    </div>
  `;
}

function renderPreviewCell(label, value, tone = "neutral") {
  return `
    <div class="preview-cell ${tone}">
      <span class="preview-label">${typeof label === "string" ? t(label) : label}</span>
      <strong class="preview-value">${typeof value === "string" ? t(value) : value}</strong>
    </div>
  `;
}

function renderSettlementManifest(result, rewardValue) {
  const chips = [];
  if (result.rewardName) {
    chips.push(`
      <div class="manifest-chip ${result.rewardAdded ? "good" : "warn"}">
        ${result.rewardId ? renderCarrySprite(result.rewardId, "mini") : ""}
        <span class="manifest-label">${t("Reward")}</span>
        <strong>${result.rewardId ? itemCopy(result.rewardId).name : result.rewardName}</strong>
        <span class="manifest-value">${money(rewardValue)}</span>
      </div>
    `);
  }
  if (result.collateralName) {
    chips.push(`
      <div class="manifest-chip ${result.collateralReturned ? "cool" : "bad"}">
        <span class="manifest-label">${t("Collateral")}</span>
        <strong>${result.collateralName}</strong>
        <span class="manifest-value">${result.collateralReturned ? t("Back") : t("Lost")}</span>
      </div>
    `);
  }
  if (!chips.length) {
    return "";
  }
  return `<div class="manifest-strip">${chips.join("")}</div>`;
}

function renderTableCue(cue) {
  return `
    <div class="table-cue ${cue.tone}">
      <div class="cue-label">${t(cue.title)}</div>
      <div class="cue-text">${t(cue.text)}</div>
    </div>
  `;
}

function renderHandoffBeat(beat) {
  const rewardName = beat.rewardId ? itemCopy(beat.rewardId).name : t("None");
  const netLabel = beat.net >= 0 ? `+${money(beat.net)}` : `-${money(Math.abs(beat.net))}`;
  return `
    <div class="handoff-beat ${beat.tone}">
      <div class="handoff-card quiet-handoff-card">
        <div class="quiet-handoff-head">
          <div>
            <p class="eyebrow">${t("Cutaway / Room Handoff")}</p>
            <strong>${t(beat.title)}</strong>
          </div>
          <span class="pill ${beat.tone === "good" ? "good" : "bad"}">${beat.tone === "good" ? t("Room cleared") : t("Room bit back")}</span>
        </div>
        <div class="quiet-handoff-grid">
          <span>${t("Net")} ${netLabel}</span>
          <span>${t("Reward")} ${rewardName}</span>
          ${
            beat.collateralName
              ? `<span>${t("Collateral")} ${beat.collateralName}${beat.collateralReturned ? ` / ${t("Back")}` : ""}</span>`
              : ""
          }
          <span>${t("Next stop")} ${t("Search floor")}</span>
        </div>
        ${beat.lastHandText ? `<p class="micro">${beat.lastHandName ? `${localizeHandName(beat.lastHandName, currentLanguage())}. ` : ""}${t(beat.lastHandText)}</p>` : ""}
      </div>
    </div>
  `;
}

function renderFinalHandSpotlight(table, preview) {
  if (table.handNumber !== table.totalHands) {
    return "";
  }

  const player = table.players[0];
  const primary = preview.premium.armed ? preview.premium : preview.fallback;
  const secondary = preview.premium.armed ? preview.fallback : preview.premium;
  const playerAhead = player.stack > table.tableDef.buyIn;
  return `
    <div class="final-hand-shell ${table.tableDef.id} ${preview.roomTone}">
      <div class="card-topline">
        ${renderRouteBadge(table.tableDef.id, "final hand")}
        <span class="pill ${preview.roomTone}">${t("Room closes on this reveal")}</span>
      </div>
      <div class="final-hand-grid">
        <div class="final-hand-copy">
          <p class="eyebrow">${t("Last Hand Live")}</p>
          <h3>${preview.premium.armed ? t("The premium line is armed.") : t("Fallback line is carrying the room.")}</h3>
          <p class="micro">${t(primary.text)}</p>
        </div>
        <div class="preview-grid compact-preview">
          ${renderPreviewCell(t("Primary"), tm("rewardValueLine", { name: t(primary.name), value: money(primary.value) }), preview.premium.armed ? "good" : "warn")}
          ${renderPreviewCell(t("Secondary"), tm("rewardValueLine", { name: t(secondary.name), value: money(secondary.value) }), secondary.armed ? "good" : "cool")}
          ${renderPreviewCell(t("Your stack"), money(player.stack), playerAhead ? "good" : "warn")}
          ${renderPreviewCell(t("Collateral"), table.collateral ? itemCopy(table.collateral.itemId).name : t("None"), table.collateral ? "cool" : "neutral")}
        </div>
      </div>
    </div>
  `;
}

function renderRoomVerdictStrip({ handSummary, rewardName, rewardAdded, rewardValue = 0, collateralName, collateralReturned, collateralLost }) {
  const handTone = !handSummary ? "neutral" : didPlayerTakeHand(handSummary) ? "good" : handSummary.type === "showdown" ? "bad" : "warn";
  const rewardTone = !rewardName ? "neutral" : rewardAdded ? "good" : "warn";
  const collateralTone = !collateralName ? "neutral" : collateralReturned ? "cool" : collateralLost ? "bad" : "neutral";
  return `
    <div class="room-verdict-strip">
      ${renderVerdictCell(
        "Final hand",
        handSummary?.handName ?? summarizeHandType(handSummary?.type),
        handSummary ? (didPlayerTakeHand(handSummary) ? "You carried the close." : "The room closed against you.") : "No clean final read was logged.",
        handTone,
      )}
      ${renderVerdictCell(
        "Prize line",
        rewardName ?? "No side reward",
        rewardName ? (rewardAdded ? `Taken clean for ${money(rewardValue)}.` : "Won, but left behind.") : "No reward item broke free.",
        rewardTone,
      )}
      ${renderVerdictCell(
        "Collateral",
        collateralName ?? "No collateral",
        collateralName ? (collateralReturned ? "Posted and recovered." : "Posted and lost.") : "Nothing extra was posted.",
        collateralTone,
      )}
    </div>
  `;
}

function renderVerdictCell(label, title, detail, tone = "neutral") {
  return `
    <div class="verdict-cell ${tone}">
      <span class="preview-label">${typeof label === "string" ? t(label) : label}</span>
      <strong class="preview-value">${typeof title === "string" ? t(title) : title}</strong>
      <span class="micro">${typeof detail === "string" ? t(detail) : detail}</span>
    </div>
  `;
}

function renderHandoffManifest(beat) {
  const chips = [];
  if (beat.rewardName) {
    chips.push(`
      <div class="handoff-chip ${beat.rewardAdded ? "good" : "warn"}">
        ${beat.rewardId ? renderCarrySprite(beat.rewardId, "mini") : ""}
        <div class="carry-preview-copy">
          <strong>${beat.rewardId ? itemCopy(beat.rewardId).name : beat.rewardName}</strong>
          <span class="manifest-value">${beat.rewardAdded ? t("Carried out of room") : t("No inventory space")}</span>
        </div>
      </div>
    `);
  }
  if (beat.collateralName) {
    chips.push(`
      <div class="handoff-chip ${beat.collateralReturned ? "cool" : "bad"}">
        <div class="carry-preview-copy">
          <strong>${beat.collateralName}</strong>
          <span class="manifest-value">${beat.collateralReturned ? t("Collateral back") : t("Collateral lost")}</span>
        </div>
      </div>
    `);
  }
  if (!chips.length) {
    return "";
  }
  return `<div class="handoff-manifest">${chips.join("")}</div>`;
}

function renderCarryPreviewPanel(title, items, options = {}) {
  const tone = options.tone ?? "cool";
  const visibleItems = items.slice(0, options.maxItems ?? 3);
  const overflow = Math.max(0, items.length - visibleItems.length);
  const headingText =
    options.headingText ?? (items.length ? `${items.length} carried` : "Nothing carried");
  return `
    <div class="card-block carry-preview-panel ${tone} ${options.compact ? "compact" : ""}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${title}</p>
          <h3>${typeof headingText === "string" ? t(headingText) : headingText}</h3>
        </div>
        ${options.totalValue != null ? `<span class="pill ${tone}">${money(options.totalValue)}</span>` : ""}
      </div>
      ${
        items.length
          ? `
            <div class="carry-preview-grid">
              ${visibleItems
                .map(
                  (item) => `
                    <div class="carry-preview-chip ${tone}">
                        ${item.itemId ? renderCarrySprite(item.itemId, "mini") : ""}
                      <div class="carry-preview-copy">
                        <strong>${item.itemId ? itemCopy(item.itemId).name : item.name}</strong>
                        ${item.value != null ? `<span class="manifest-value">${money(item.value)}</span>` : ""}
                      </div>
                    </div>
                  `,
                )
                .join("")}
              ${overflow ? `<div class="carry-preview-chip overflow"><strong>+${overflow} more</strong></div>` : ""}
            </div>
          `
          : ""
      }
      ${options.note ? `<p class="micro">${options.note}</p>` : ""}
    </div>
  `;
}

function renderHeaderCarryStrip(items, totalValue) {
  const visible = items.slice(0, 3);
  return `
    <div class="header-carry-strip ${items.length ? "loaded" : "empty"}">
      <div class="header-carry-copy">
        <p class="eyebrow">${t("Coat Check")}</p>
        <strong>${items.length ? tm("signedCarryCount", { count: items.length, value: money(totalValue) }) : t("Nothing riding")}</strong>
      </div>
      <div class="header-carry-icons">
        ${
          visible.length
            ? visible.map((item) => `<div class="header-carry-icon" title="${itemCopy(item.itemId).name}">${renderCarrySprite(item.itemId, "mini")}</div>`).join("")
            : `<span class="micro">${t("Keep the coat light or load it up before extraction.")}</span>`
        }
      </div>
    </div>
  `;
}

function renderSpentToolCard(entry) {
  return `
    <div class="item-card spent-tool-card ${entry.tone}">
      <p class="eyebrow">${t("Spent Tool")}</p>
      <div class="stat-row"><span class="stat-label">${entry.itemId ? itemCopy(entry.itemId).name : entry.name}</span><span class="stat-value">${t(entry.summary)}</span></div>
      <p class="micro">${t(entry.detail)}</p>
      <span class="pill ${entry.tone}">${t("Burned this room")}</span>
    </div>
  `;
}

function renderSignalReadCard(read, table, targetName = null) {
  const tableClass = table?.tableDef?.id ?? "";
  return `
    <div class="read-card ${read.tone} ${tableClass}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${itemCopy("signal-lighter").name}</p>
          <h3>${targetName ? `${targetName} / ${read.label}` : read.label}</h3>
        </div>
        <span class="pill ${read.tone}">${Math.round(read.winOdds * 100)}%</span>
      </div>
      <div class="read-meter">
        ${Array.from({ length: 3 }, (_, index) => `<span class="read-segment ${index < read.meter ? "filled" : ""}"></span>`).join("")}
      </div>
      <p class="micro">${read.descriptor}</p>
    </div>
  `;
}

function renderCarryMini(itemId) {
  const item = itemCopy(itemId);
  return `
    <div class="carry-mini">
      ${renderCarrySprite(itemId, "mini")}
      <span class="carry-mini-name">${item.name}</span>
    </div>
  `;
}

function renderCarrySprite(itemId, size = "large") {
  return `
    <div class="carry-sprite ${size} ${itemId}">
      <span class="carry-shape a"></span>
      <span class="carry-shape b"></span>
      <span class="carry-shape c"></span>
    </div>
  `;
}

function renderCarryManifestItem(item) {
  return `
    <div class="manifest-chip ${item.lost ? "bad" : "cool"} carry-manifest-chip">
      ${item.itemId ? renderCarrySprite(item.itemId, "mini") : ""}
      <span class="manifest-label">${item.lost ? t("Lost carry") : t("Settled carry")}</span>
      <strong>${item.itemId ? itemCopy(item.itemId).name : item.name}</strong>
      ${item.value != null ? `<span class="manifest-value">${money(item.value)}</span>` : ""}
    </div>
  `;
}

function summarizeHandType(type) {
  if (type === "showdown") {
    return t("Showdown");
  }
  if (type === "fold") {
    return t("Fold");
  }
  if (type === "void") {
    return t("Void");
  }
  return t("Quiet close");
}

function getSummaryRouteBadgeType(summary) {
  const label = summary?.routeLabel?.toLowerCase?.() ?? "";
  if (label.includes("kitchen") || label.includes("backlift") || label.includes("runner")) {
    return "fixed-extraction";
  }
  if (label.includes("break") || label.includes("drop") || label.includes("dump")) {
    return "dropbag-extraction";
  }
  return "general-extraction";
}

function summarizeWinner(winnerIds = []) {
  if (!winnerIds.length) {
    return t("Nobody");
  }
  if (winnerIds.includes("player")) {
    if (winnerIds.length === 1) {
      return t("You");
    }
    return t("Split pot");
  }
  return t("House side");
}

function didPlayerTakeHand(summary) {
  return Boolean(summary?.winnerIds?.includes("player"));
}

function getRunValuables(run) {
  return run.inventory.filter((item) => getItemDef(item.itemId).kind === "valuable");
}

function getValuableTotal(items) {
  return items.reduce((sum, item) => sum + getItemDef(item.itemId).value, 0);
}

function buildExtractionPreview(run) {
  const scene = getTavernSceneDef(run?.tavernSceneId);
  const stash = { gross: 0, fee: 0, net: 0 };
  const valuables = getRunValuables(run);
  const valuableTotal = getValuableTotal(valuables);
  const routeIntel = {
    publicExit: Boolean(run.routeIntel?.publicExit),
    fixedWhisper: Boolean(run.routeIntel?.fixedWhisper),
    emergency: Boolean(run.routeIntel?.emergency),
    serviceStairs: Boolean(run.routeIntel?.serviceStairs),
    riverLaunch: Boolean(run.routeIntel?.riverLaunch),
  };
  const generalBaseFee =
    (scene?.generalExtractionFlatFee ?? 30) + Math.floor(run.cashOnHand * (scene?.generalExtractionRate ?? 0.15));
  const generalFee = generalBaseFee + (run.heat === 5 ? scene?.lockdownSurcharge ?? 60 : 0);
  const generalVisible = routeIntel.publicExit;
  const generalOpen = run.heat < 6;
  const generalAvailable = generalVisible && generalOpen && run.cashOnHand >= generalFee;
  const generalSettledCash = Math.max(0, run.cashOnHand - generalFee);
  const fixed = run.fixedRouteReservation;
  const fixedVisible = routeIntel.fixedWhisper || Boolean(fixed);
  const fixedAvailable =
    fixedVisible &&
    Boolean(fixed) &&
    run.searchIndex <= fixed.expiresAfterSearch &&
    run.heat <= fixed.maxHeat &&
    run.cashOnHand >= fixed.finalCost;
  const fixedSettledCash = Math.max(0, run.cashOnHand - (fixed?.finalCost ?? 0));
  const fixedReservation = fixed ? routeCopy(fixed) : null;
  const fixedOffer = routeCopy(run.fixedRouteOffer);
  const dropbagCashSacrifice = Math.floor(run.cashOnHand * 0.4);
  const dropbagVisible = routeIntel.emergency;
  const dropbagCashAvailable = dropbagVisible && run.cashOnHand >= 10;
  const dropbagCashSettled = Math.max(0, run.cashOnHand - dropbagCashSacrifice - 10);
  const dropbagValuablesAvailable = dropbagVisible && run.cashOnHand >= 10 && valuables.length > 0;
  const dropbagValuablesSettled = Math.max(0, run.cashOnHand - 10);
  const serviceRoute = routeCopy(getSpecialExtractionRoute(run.tavernSceneId, "service-stairs"));
  const riverRoute = routeCopy(getSpecialExtractionRoute(run.tavernSceneId, "river-launch"));
  const serviceStairsVisible = routeIntel.serviceStairs;
  const riverLaunchVisible = routeIntel.riverLaunch;
  const serviceStairsAvailable = serviceStairsVisible && run.heat <= serviceRoute.maxHeat && run.cashOnHand >= serviceRoute.finalCost;
  const riverLaunchAvailable = riverLaunchVisible && run.heat <= riverRoute.maxHeat && run.cashOnHand >= riverRoute.finalCost;

  return {
    stash,
    valuableTotal,
    general: {
      key: "general",
      label: t("General extraction"),
      shortLabel: t("Front exit"),
      visible: generalVisible,
      available: generalAvailable,
      fee: generalFee,
      settledCash: generalSettledCash,
      stashNet: stash.net,
      valuableTotal,
      totalSettled: generalSettledCash + stash.net + valuableTotal,
      reason:
        !generalVisible
          ? t("No exit line is live yet. Work the floor, uncover intel, or stir an event first.")
          : !generalOpen
          ? t("Lockdown heat shut the public exit.")
          : run.cashOnHand < generalFee
            ? tm("needMoreForGeneralFee", { need: money(generalFee - run.cashOnHand) })
            : t("The front exit is still open, but it taxes visible cash."),
    },
    fixed: {
      key: "fixed",
      label: fixedReservation?.name ?? t("Prepared line"),
      shortLabel: fixedReservation?.name ?? t("Prepared line"),
      visible: fixedVisible,
      available: fixedAvailable,
      reserved: Boolean(fixed),
      routeName: fixedReservation?.name ?? fixedOffer.name,
      fee: fixed?.finalCost ?? fixedOffer.finalCost,
      settledCash: fixedSettledCash,
      stashNet: stash.net,
      valuableTotal,
      totalSettled: fixedSettledCash + stash.net + valuableTotal,
      reason: !fixedVisible
        ? t("No whisper line is live yet. Read people, burn a phone, or finish the first room.")
        : !fixed
        ? tm("fixedRouteReserveFirst", { route: fixedOffer.name })
        : run.heat > fixed.maxHeat
          ? tm("fixedRouteTooHot", { route: fixedReservation.name, maxHeat: fixed.maxHeat })
          : run.cashOnHand < fixed.finalCost
            ? tm("fixedRouteNeedCash", { need: money(fixed.finalCost - run.cashOnHand) })
            : tm("fixedRouteLive", { route: fixedReservation.name, cost: money(fixed.finalCost) }),
    },
    dropbagCash: {
      key: "dropbag-cash",
      label: currentLanguage() === "zh" ? "紧急撤离 / 丢现金" : "Drop-bag cash",
      shortLabel: currentLanguage() === "zh" ? "现金止损" : "Cash cut",
      visible: dropbagVisible,
      available: dropbagCashAvailable,
      sacrificed: dropbagCashSacrifice,
      settledCash: dropbagCashSettled,
      stashNet: stash.net,
      valuableTotal,
      totalSettled: dropbagCashSettled + stash.net + valuableTotal,
      reason: !dropbagVisible
        ? t("No emergency break is live yet. Pressure, cleared rooms, or exposed goods usually wake it up.")
        : dropbagCashAvailable
        ? tm("dropbagCashReason", { amount: money(dropbagCashSacrifice) })
        : t("Need 10 cash for the emergency handler."),
    },
    dropbagValuables: {
      key: "dropbag-valuables",
      label: currentLanguage() === "zh" ? "紧急撤离 / 丢货" : "Drop-bag valuables",
      shortLabel: currentLanguage() === "zh" ? "丢货跑路" : "Dump goods",
      visible: dropbagVisible,
      available: dropbagValuablesAvailable,
      droppedValue: valuableTotal,
      settledCash: dropbagValuablesSettled,
      stashNet: stash.net,
      valuableTotal: 0,
      totalSettled: dropbagValuablesSettled + stash.net,
      reason:
        !dropbagVisible
          ? t("No emergency break is live yet. Pressure, cleared rooms, or exposed goods usually wake it up.")
          : run.cashOnHand < 10
          ? t("Need 10 cash for the emergency handler.")
          : valuables.length === 0
            ? t("No valuables in the coat to throw overboard.")
            : tm("dropbagValuablesReason", { amount: money(valuableTotal) }),
    },
    serviceStairs: {
      key: "service-stairs",
      label: serviceRoute.name,
      shortLabel: serviceRoute.name,
      visible: serviceStairsVisible,
      available: serviceStairsAvailable,
      fee: serviceRoute.finalCost,
      settledCash: Math.max(0, run.cashOnHand - serviceRoute.finalCost),
      stashNet: 0,
      valuableTotal,
      totalSettled: Math.max(0, run.cashOnHand - serviceRoute.finalCost) + valuableTotal,
      reason: !serviceStairsVisible
        ? t("This line stays hidden until the kitchen side is opened by the right item or contact.")
        : run.heat > serviceRoute.maxHeat
          ? tm("fixedRouteTooHot", { route: serviceRoute.name, maxHeat: serviceRoute.maxHeat })
          : run.cashOnHand < serviceRoute.finalCost
            ? tm("fixedRouteNeedCash", { need: money(serviceRoute.finalCost - run.cashOnHand) })
            : serviceRoute.flavor,
    },
    riverLaunch: {
      key: "river-launch",
      label: riverRoute.name,
      shortLabel: riverRoute.name,
      visible: riverLaunchVisible,
      available: riverLaunchAvailable,
      fee: riverRoute.finalCost,
      settledCash: Math.max(0, run.cashOnHand - riverRoute.finalCost),
      stashNet: 0,
      valuableTotal,
      totalSettled: Math.max(0, run.cashOnHand - riverRoute.finalCost) + valuableTotal,
      reason: !riverLaunchVisible
        ? t("The river line only appears once the dockside key or contact has been burned.")
        : run.heat > riverRoute.maxHeat
          ? tm("fixedRouteTooHot", { route: riverRoute.name, maxHeat: riverRoute.maxHeat })
          : run.cashOnHand < riverRoute.finalCost
            ? tm("fixedRouteNeedCash", { need: money(riverRoute.finalCost - run.cashOnHand) })
            : riverRoute.flavor,
    },
  };
}

function getBestAvailablePlan(preview) {
  return [preview.serviceStairs, preview.riverLaunch, preview.general, preview.fixed, preview.dropbagCash, preview.dropbagValuables]
    .filter((plan) => plan.available)
    .sort((left, right) => right.totalSettled - left.totalSettled)[0] ?? null;
}

function getRoomRewardPreview(run, table) {
  const player = table.players[0];
  if (table.tableDef.id === "cargo-table") {
    const alreadyHasChip = run.inventory.some((item) => item.itemId === "ivory-chip");
    const fallbackId = player.stack >= 90 ? "ruby-cufflink" : "old-silver-lighter";
    return {
      premium: {
        id: "ivory-chip",
        name: alreadyHasChip ? t("Ivory Chip already owned") : itemCopy("ivory-chip").name,
        value: getItemDef("ivory-chip").value,
        armed: !alreadyHasChip && player.stack > table.tableDef.buyIn,
        text: alreadyHasChip
          ? t("This room's signature marker has already been taken on this run, so the payout shifts to fallback rewards.")
          : t("Leave Cargo Table in profit and the room strongly leans toward the Ivory Chip."),
      },
      fallback: {
        id: fallbackId,
        name: itemCopy(fallbackId).name,
        value: getItemDef(fallbackId).value,
        text: player.stack >= 90
          ? t("A strong profit pace tilts the room toward the Ruby Cufflink.")
          : t("If the room closes on a smaller win, expect the Old Silver Lighter."),
      },
      roomState: player.stack > table.tableDef.buyIn ? "Profiting" : "Flat / down",
      roomTone: player.stack > table.tableDef.buyIn ? "good" : "warn",
    };
  }

  if (table.tableDef.id === "ledger-cellar") {
    const fallbackId = player.stack >= 130 ? "pearl-necklace" : "emerald-brooch";
    return {
      premium: {
        id: "pearl-necklace",
        name: itemCopy("pearl-necklace").name,
        value: getItemDef("pearl-necklace").value,
        armed: player.stack >= 130,
        text: player.stack >= 130
          ? t("A disciplined profit line is enough to pull the Pearl Necklace out of the cellar.")
          : t("Without a stronger close, the room drifts toward the Emerald Brooch."),
      },
      fallback: {
        id: "emerald-brooch",
        name: itemCopy("emerald-brooch").name,
        value: getItemDef("emerald-brooch").value,
        text: t("The quieter cellar usually pays the Emerald Brooch when the top shelf stays locked."),
      },
      roomState: player.stack >= 130 ? "Premium armed" : "Fallback only",
      roomTone: player.stack >= 130 ? "good" : "warn",
    };
  }

  if (table.tableDef.id === "embers-table") {
    const fallbackId = player.stack >= 220 ? "vault-promissory" : "obsidian-idol";
    return {
      premium: {
        id: "vault-promissory",
        name: itemCopy("vault-promissory").name,
        value: getItemDef("vault-promissory").value,
        armed: player.stack >= 220,
        text: player.stack >= 220
          ? t("A deep win at Embers turns the room toward the Vault Promissory.")
          : t("If the room closes shorter, the Obsidian Idol is the more likely take."),
      },
      fallback: {
        id: "obsidian-idol",
        name: itemCopy("obsidian-idol").name,
        value: getItemDef("obsidian-idol").value,
        text: t("The late room still pays heavy, even when the top line misses."),
      },
      roomState: player.stack >= 220 ? "Premium armed" : "Fallback only",
      roomTone: player.stack >= 220 ? "good" : "warn",
    };
  }

  const fallbackId = player.stack >= 170 ? "sealed-bond" : "gold-cased-watch";
  const premiumArmed = Boolean(table.collateral);
  return {
    premium: {
      id: "antique-coin",
      name: itemCopy("antique-coin").name,
      value: getItemDef("antique-coin").value,
      armed: premiumArmed,
      text: premiumArmed
        ? table.handNumber === table.totalHands
          ? t("Collateral is live and this is the final hand. Win it to unlock the Antique Coin.")
          : t("Collateral is live. Win the final hand later in the room to unlock the Antique Coin.")
        : t("No collateral is live, so the premium coin lane is currently shut."),
    },
    fallback: {
      id: fallbackId,
      name: itemCopy(fallbackId).name,
      value: getItemDef(fallbackId).value,
      text: player.stack >= 170
        ? t("A deep win pace points toward the Sealed Bond if the premium line misses.")
        : t("Without the premium line, the room currently falls back to the Gold-Cased Watch."),
    },
    roomState: premiumArmed ? "Premium armed" : "Fallback only",
    roomTone: premiumArmed ? "good" : "warn",
  };
}

function formatActionLabel(action) {
  if (!action) {
    return null;
  }
  if (action === "all-in") {
    return t("All-in");
  }
  if (action === "bet") {
    return t("Bet");
  }
  return t(action.charAt(0).toUpperCase() + action.slice(1));
}

function describeOpponentTell(participant, table) {
  if (participant.folded) {
    return "The posture breaks. This seat is out of the hand.";
  }

  const archetype = participant.archetypeId ?? participant.id;
  const isActing = table.currentActorId === participant.id;
  const covering = participant.currentBet >= table.currentBet && table.currentBet > 0;
  const finalHand = table.handNumber === table.totalHands;
  const invested = participant.currentBet > 0;

  if (archetype === "dock-braggart") {
    if (isActing) return "He gets louder right before he reaches for chips.";
    if (covering) return "He sits too still for a man who usually performs.";
    if (finalHand) return "The grin stiffens now that the room is almost done.";
    return "Noise first, pressure second. The confidence always arrives early.";
  }

  if (archetype === "ledger-clerk") {
    if (isActing) return "He counts the stack twice before moving a single chip.";
    if (covering) return "The chips line up too neatly to be casual.";
    if (invested) return "Even his smaller bets look pre-approved.";
    return "Hands stay away from the pot until the numbers add up.";
  }

  if (archetype === "calm-widow") {
    if (isActing) return "Nothing on her face changes when the action reaches her.";
    if (finalHand) return "The stillness sharpens on the last hand.";
    if (covering) return "Silence does part of the betting for her.";
    return "She watches for repetition more than cards.";
  }

  if (archetype === "smiling-knife") {
    if (isActing) return "The smile lands before the pressure does.";
    if (finalHand) return "He leans in now that the room is worth bruising.";
    if (covering) return "He pushes chips with a wrist that looks too relaxed.";
    return "Patience sits on him like a threat.";
  }

  if (archetype === "river-shark") {
    if (isActing) return "He idles until the pot looks half-settled, then suddenly wakes up.";
    if (finalHand) return "The last hand is when he expects everyone else to get scared first.";
    if (covering) return "That calm cover bet feels more predatory than loud.";
    return "He prefers the river, but he still plants pressure earlier than he admits.";
  }

  if (archetype === "velvet-rook") {
    if (isActing) return "Everything about the motion says restraint before it says attack.";
    if (covering) return "The line is neat, but the bet sizing is already asking a question.";
    if (invested) return "She protects medium edges like they were premium ones.";
    return "The room feels tighter whenever she chooses not to speak.";
  }

  if (archetype === "house-viper") {
    if (isActing) return "The wait is part of the pressure. He moves once the room has already leaned in.";
    if (finalHand) return "This is exactly the kind of late pot he likes to own.";
    if (covering) return "The cover comes with a stare that wants a mistake back.";
    return "He rarely overacts. The danger is in how long he stays still.";
  }

  if (archetype === "ash-smuggler") {
    if (isActing) return "He hides the real decision under an almost lazy reach for chips.";
    if (covering) return "The bet lands soft, which usually means he wants action behind it.";
    if (invested) return "Smoke and softness are doing more work here than the cards.";
    return "He bluffs just enough to make the honest lines feel wrong.";
  }

  return "The seat is giving away less than you'd like.";
}

function getTablePressureFocus(table) {
  const liveOpponents = table.players.filter((participant) => participant.id !== "player" && !participant.folded);
  const actingOpponent = liveOpponents.find((participant) => table.currentActorId === participant.id);
  const coveringOpponent = liveOpponents
    .filter((participant) => participant.currentBet >= table.currentBet && table.currentBet > 0)
    .sort((a, b) => b.currentBet - a.currentBet)[0];
  const participant = actingOpponent ?? coveringOpponent ?? liveOpponents[0] ?? null;
  const finalHand = table.handNumber === table.totalHands;
  const playerTurn = table.currentActorId === "player";

  if (!participant) {
    return {
      participant: null,
      tone: finalHand ? "warn" : "cool",
      badge: finalHand ? "final hand" : "quiet room",
      status: finalHand ? "Last hand live" : "Room breathing",
      title: finalHand ? "The last hand is live, but nobody is pressing yet." : "The room is between pushes.",
      text: finalHand
        ? "This is the last hand. Once chips move again, the room closes on whatever happens next."
        : "No seat is leaning across the line yet. The next move changes the temperature.",
      actor: playerTurn ? "You" : "Room",
      spotlight: "",
    };
  }

  if (actingOpponent) {
    const name = participantName(participant);
    return {
      participant,
      tone: finalHand ? "bad" : "warn",
      badge: finalHand ? "final hand" : "seat moving",
      status: "Seat in motion",
      title:
        currentLanguage() === "zh"
          ? `${name} 现在握着整间房的节奏`
          : `${name} has the room right now`,
      text: describeOpponentTell(participant, table),
      actor: name,
      spotlight:
        currentLanguage() === "zh"
          ? `筹码 ${money(participant.stack)} | 下注 ${money(participant.currentBet)} | ${describePressureState(participant, table)}`
          : `Stack ${money(participant.stack)} | Bet ${money(participant.currentBet)} | ${describePressureState(participant, table)}`,
    };
  }

  if (playerTurn) {
    const name = participantName(participant);
    return {
      participant,
      tone: finalHand ? "warn" : "cool",
      badge: finalHand ? "answer now" : "your answer",
      status: "Waiting on you",
      title:
        currentLanguage() === "zh"
          ? `${name} 正等着你的回应`
          : `${name} is waiting on your answer`,
      text: describeOpponentTell(participant, table),
      actor: "You",
      spotlight:
        currentLanguage() === "zh"
          ? `对方已经压上 ${money(participant.currentBet)}，现在轮到你来定义这条线。`
          : `They already cover ${money(participant.currentBet)} and are making you define the line.`,
    };
  }

  const name = participantName(participant);
  return {
    participant,
    tone: finalHand ? "warn" : "cool",
    badge: finalHand ? "last hand tone" : "room tone",
    status: "Pressure set",
    title:
      currentLanguage() === "zh"
        ? `${name} 正在决定这间房的节奏`
        : `${name} is setting the room's pace`,
    text: describeOpponentTell(participant, table),
    actor: name,
    spotlight:
      currentLanguage() === "zh"
        ? `筹码 ${money(participant.stack)} | ${describeOpponentPressureAccent(participant, table)}`
        : `Stack ${money(participant.stack)} | ${describeOpponentPressureAccent(participant, table)}`,
  };
}

function renderBoardCards(table) {
  const labels = ["Flop", "Flop", "Flop", "Turn", "River"];
  const liveIndexes = new Set(getLiveRevealIndexes(table));
  const nextIndex = getNextRevealIndex(table);
  const cards = [];
  for (let i = 0; i < 5; i += 1) {
    const card = table.community[i];
    const slotClass = card ? (liveIndexes.has(i) ? "live" : "resolved") : nextIndex === i ? "next" : "ahead";
    cards.push(`
      <div class="board-slot ${slotClass}">
        ${card ? renderCard(card) : renderHiddenCard(labels[i])}
        <span class="board-slot-label">${t(labels[i])}</span>
      </div>
    `);
  }
  return cards.join("");
}

function renderStreetRevealRail(table) {
  const currentIndex = table.lastHandSummary ? 4 : getStreetOrder(table.street);
  const steps = [
    { key: "preflop", label: "Preflop" },
    { key: "flop", label: "Flop" },
    { key: "turn", label: "Turn" },
    { key: "river", label: "River" },
    { key: "showdown", label: "Showdown" },
  ];
  return `
    <div class="board-reveal-rail">
      ${steps
        .map((step, index) => {
          const status = index < currentIndex ? "done" : index === currentIndex ? "live" : "ahead";
          return `
            <div class="reveal-step ${status}">
              <span class="reveal-step-label">${t(step.label)}</span>
              <strong class="reveal-step-value">${
                status === "done" ? t("Seen") : status === "live" ? t("Live") : t("Ahead")
              }</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function describeBoardMoment(table) {
  if (table.street === "preflop") {
    return "Waiting On The Flop";
  }
  if (table.street === "flop") {
    return table.handNumber === table.totalHands ? "Final Flop Is Live" : "Flop Is On The Felt";
  }
  if (table.street === "turn") {
    return table.handNumber === table.totalHands ? "Turn Card Tightens The Final Hand" : "Turn Card Is Exposed";
  }
  return table.handNumber === table.totalHands ? "Final Board Is Locked" : "River Has Closed The Board";
}

function describeBoardPosture(table) {
  if (table.handNumber === table.totalHands && table.street === "river") {
    return "Room settles here";
  }
  if (table.handNumber === table.totalHands) {
    return "Final hand live";
  }
  if (table.street === "preflop") {
    return "Board still dark";
  }
  if (table.street === "river") {
    return "All cards exposed";
  }
  return "Board opening";
}

function describeStreetPace(table) {
  if (table.street === "preflop") {
    return "First reveal still ahead";
  }
  if (table.street === "flop") {
    return "Three cards are shaping the room";
  }
  if (table.street === "turn") {
    return "One card left after this";
  }
  return "Nothing left to hide";
}

function getLiveRevealIndexes(table) {
  if (table.street === "flop") {
    return [0, 1, 2];
  }
  if (table.street === "turn") {
    return [3];
  }
  if (table.street === "river") {
    return [4];
  }
  return [];
}

function getNextRevealIndex(table) {
  if (table.street === "preflop") {
    return 0;
  }
  if (table.street === "flop") {
    return 3;
  }
  if (table.street === "turn") {
    return 4;
  }
  return null;
}

function getStreetOrder(street) {
  return {
    preflop: 0,
    flop: 1,
    turn: 2,
    river: 3,
  }[street] ?? 0;
}

function cardSuitGlyph(suit) {
  return {
    S: "♠",
    H: "♥",
    C: "♣",
    D: "♦",
  }[suit] ?? suit;
}

function cardFaceRank(rank) {
  return {
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  }[rank] ?? `${rank}`;
}

function formatCardInline(card) {
  return `${cardFaceRank(card.rank)}${cardSuitGlyph(card.suit)}`;
}

function cardAssetFile(card) {
  const rank = {
    11: "jack",
    12: "queen",
    13: "king",
    14: "ace",
  }[card.rank] ?? `${card.rank}`;
  const suit = {
    S: "spades",
    H: "hearts",
    D: "diamonds",
    C: "clubs",
  }[card.suit];
  return `${rank}_of_${suit}.png`;
}

function cardAssetSrc(card) {
  return new URL(`../assets/cards/${cardAssetFile(card)}`, import.meta.url).href;
}

function renderCard(card) {
  return `
    <div class="playing-card face-card">
      <img src="${cardAssetSrc(card)}" alt="${formatCardInline(card)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('image-failed');" />
      <span class="rank">${cardFaceRank(card.rank)}</span>
      <span class="suit ${card.suit === "H" || card.suit === "D" ? "red" : "black"}">${cardSuitGlyph(card.suit)}</span>
    </div>
  `;
}

function renderHiddenCard(label = "Hidden") {
  return `
    <div class="playing-card back">
      <img src="${CARD_BACK_SRC}" alt="${t(label)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('image-failed');" />
      <span class="rank">?</span>
      <span class="suit">${t(label)}</span>
    </div>
  `;
}

function buildTextState() {
  const { state } = game;
  const base = {
    mode: state.mode,
    language: currentLanguage(),
    coordinateSystem: "canvas origin top-left, x right, y down",
    vault: state.persistent.vault,
  };

  if (state.mode === "menu") {
    return {
      ...base,
      savedRunAvailable: state.savedRunAvailable,
      savedRunMeta: state.savedRunMeta,
      availableActions: state.savedRunAvailable
        ? ["start-run", "load-run", "exit-game"]
        : ["start-run", "exit-game"],
    };
  }

  if (state.mode === "search" && state.run) {
    const run = state.run;
    const extractionPreview = buildExtractionPreview(run);
    const pendingExtraction = getPendingExtractionPlan(run, extractionPreview);
    const bestPlan = getBestAvailablePlan(extractionPreview);
    const nextTable = getNextTablePressure(run);
    const objective = getSearchObjective(run, extractionPreview, pendingExtraction);
    return {
      ...base,
      searchScene: activeSearchScene,
      actionPoints: run.actionPoints,
      cashOnHand: run.cashOnHand,
      heat: run.heat,
      heatBand: localizeHeatBand(getHeatBand(run.heat), currentLanguage()),
      inventory: run.inventory.map((item) => itemCopy(item.itemId).name),
      valuables: getRunValuables(run).map((item) => ({
        id: item.itemId,
        name: itemCopy(item.itemId).name,
        value: getItemDef(item.itemId).value,
      })),
      tables: TABLE_ORDER.map((tableId) => {
        const table = tableCopy(tableId);
        return {
          id: tableId,
          name: table.name,
          buyIn: table.buyIn,
          risk: t(table.risk),
          unlocked: !table.unlocksAfter || run.completedTables.includes(table.unlocksAfter),
          completed: run.completedTables.includes(tableId),
          intel: run.intel[tableId],
        };
      }),
      extractionRoutes: {
        general: run.heat < 6,
        fixedReserved: run.fixedRouteReservation ? routeCopy(run.fixedRouteReservation).name : null,
        fixedOffer: routeCopy(run.fixedRouteOffer).name,
        dropBag: true,
      },
      riskLedger: {
        safeNow: bestPlan?.totalSettled ?? 0,
        exposedCarry: run.cashOnHand + extractionPreview.valuableTotal,
        hiddenRoutes: [extractionPreview.serviceStairs, extractionPreview.riverLaunch]
          .filter((plan) => plan?.visible)
          .map((plan) => plan.shortLabel),
        nextTable: nextTable
          ? {
              id: nextTable.id,
              name: tableCopy(nextTable.id).name,
              buyIn: nextTable.buyIn,
              heatGain: nextTable.heatGain,
            }
          : null,
      },
      settlementPreview: {
        bestRoute: bestPlan ? t(bestPlan.label) : null,
        bestSettled: bestPlan?.totalSettled ?? 0,
        general: {
          available: extractionPreview.general.available,
          totalSettled: extractionPreview.general.totalSettled,
        },
        fixed: {
          available: extractionPreview.fixed.available,
          totalSettled: extractionPreview.fixed.totalSettled,
        },
        dropbagCash: {
          available: extractionPreview.dropbagCash.available,
          totalSettled: extractionPreview.dropbagCash.totalSettled,
        },
        dropbagValuables: {
          available: extractionPreview.dropbagValuables.available,
          totalSettled: extractionPreview.dropbagValuables.totalSettled,
        },
      },
      pendingExtractionReview: pendingExtraction
        ? {
            action: pendingExtraction.action,
            title: t(pendingExtraction.title),
            route: t(pendingExtraction.routeLabel),
          }
        : null,
      objective: {
        title: t(objective.title),
        move: t(objective.move),
        walk: t(objective.walk),
      },
      lastTableResult: run.lastTableResult,
      handoffBeat: game.state.handoffBeat,
    };
  }

  if (state.mode === "table" && state.run?.currentTable) {
    const table = state.run.currentTable;
    const player = table.players[0];
    const pressureFocus = getTablePressureFocus(table);
    const rewardPreview = getRoomRewardPreview(state.run, table);
    const objective = getTableObjective(state.run, table, rewardPreview);
    return {
      ...base,
      table: tableCopy(table.tableDef).name,
      tableLabel: tableCopy(table.tableDef).name,
      handNumber: table.handNumber,
      street: localizeStreet(table.street, currentLanguage()),
      pot: table.pot,
      currentActor: table.currentActorId === "player" ? t("You") : participantName(table.players.find((p) => p.id === table.currentActorId)),
      currentCall: Math.max(0, table.currentBet - player.currentBet),
      player: {
        stack: player.stack,
        holeCards: player.holeCards.map(cardCode),
        legalActions: table.legalActions.player,
      },
      community: table.community.map(cardCode),
      opponents: table.players
        .filter((participant) => participant.id !== "player")
        .map((participant) => ({
          name: participantName(participant),
          stack: participant.stack,
          folded: participant.folded,
          lastAction: formatActionLabel(participant.lastAction),
          banter: participant.banter ?? null,
          tell: participant.tell ?? null,
          tensionLevel: participant.tensionLevel ?? 0,
          aiStatus: participant.aiStatus ?? null,
          innerMonologue: participant.aiNative?.inner_monologue ?? null,
          signalRead:
            table.signalRead && table.signalRead.targetId === participant.id
              ? {
                  label: table.signalRead.label,
                  tone: table.signalRead.tone,
                  meter: table.signalRead.meter,
                  descriptor: table.signalRead.descriptor,
                }
              : null,
        })),
      nextPeek: table.peekCard ? cardCode(table.peekCard) : null,
      stageCue: table.stageCue,
      tableBeat: game.state.tableBeat,
      lastHandSummary: table.lastHandSummary,
      roomRewardPreview: {
        ...rewardPreview,
        roomState: t(rewardPreview.roomState),
      },
      pressureFocus: {
        actor: t(pressureFocus.actor),
        status: t(pressureFocus.status),
        title: t(pressureFocus.title),
      },
      objective: {
        title: t(objective.title),
        ask: t(objective.ask),
        read: t(objective.read),
      },
      tableItems: state.run.inventory
        .filter((item) => getItemDef(item.itemId).phase === "table")
        .map((item) => itemCopy(item.itemId).name),
      spentToolMoments: table.spentToolMoments,
      log: table.log.slice(-5),
    };
  }

  return {
    ...base,
    summary: state.latestSummary,
    objective: state.latestSummary
      ? (() => {
          const objective = getSummaryNextStep(state.latestSummary);
          return {
            ...objective,
            title: t(objective.title),
            pressure: t(objective.pressure),
            next: t(objective.next),
          };
        })()
      : null,
  };
}

function drawScene() {
  const { state } = game;
  const t = state.backgroundTime;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(PIXEL_SCALE, 0, 0, PIXEL_SCALE, 0, 0);

  const usedIllustration = drawIllustrationBackdrop(state, t);
  if (!usedIllustration) {
    ctx.imageSmoothingEnabled = false;
    drawAmbientLights(t, state.run?.heat ?? 0);
    drawRoomShell(state.run?.heat ?? 0);

    if (state.mode === "menu") {
      drawMenuBackdrop();
    } else if (state.mode === "search") {
      drawSearchBackdrop(state.run, t);
    } else if (state.mode === "table") {
      drawTableBackdrop(state.run.currentTable, t);
    } else if (state.mode === "summary") {
      drawSummaryBackdrop(state.latestSummary);
    }
  }

  if (state.run) {
    drawHeatOverlay(state.run.heat, t);
  }
  drawModeFrame(state.mode);
  ctx.restore();
}

function fillPx(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function framePx(x, y, w, h, fill, border = "#5d2a39", accent = null) {
  fillPx(x + 1, y + 1, w, h, "rgba(0,0,0,0.65)");
  fillPx(x, y, w, h, border);
  fillPx(x + 2, y + 2, w - 4, h - 4, fill);
  if (accent) {
    fillPx(x + 2, y + 2, w - 4, 2, accent);
  }
}

function textPx(text, x, y, color = "#f7e8c8", size = 6, align = "left") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Baskerville, "Palatino Linotype", Georgia, serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCheckerBand(y, h, colorA, colorB, step = 6) {
  for (let row = 0; row < h; row += step) {
    for (let x = 0; x < SCENE_WIDTH; x += step) {
      fillPx(x, y + row, step, step, ((x / step + row / step) % 2 === 0 ? colorA : colorB));
    }
  }
}

function drawAmbientLights(t, heat) {
  fillPx(0, 0, SCENE_WIDTH, SCENE_HEIGHT, "#08040a");
  fillPx(0, 0, SCENE_WIDTH, 74, "#180912");
  fillPx(0, 74, SCENE_WIDTH, 72, "#23101a");
  fillPx(0, 146, SCENE_WIDTH, 79, "#14080c");

  const blink = Math.sin(t * 2.3) > 0.2 ? "#f7b65d" : "#d27a42";
  const coolBlink = Math.sin(t * 2.7) > 0.45 ? "#7ebfd8" : "#43617f";
  fillPx(32, 14, 48, 4, blink);
  fillPx(156, 14, 48, 4, heat >= 3 ? coolBlink : blink);
  fillPx(280, 14, 48, 4, heat >= 5 ? "#e56174" : blink);

  fillPx(40, 18, 32, 2, "rgba(255, 210, 135, 0.18)");
  fillPx(164, 18, 32, 2, heat >= 3 ? "rgba(126, 191, 216, 0.18)" : "rgba(255, 210, 135, 0.18)");
  fillPx(288, 18, 32, 2, heat >= 5 ? "rgba(229, 97, 116, 0.18)" : "rgba(255, 210, 135, 0.18)");
}

function buildSceneArtMap() {
  const sceneMap = {
    menu: createSceneArt(new URL("../assets/scene-plates/menu-title-bg.png?v=20260402c", import.meta.url).href),
    stash: createSceneArt(new URL("../assets/scene-plates/藏匿点场景.png", import.meta.url).href),
    search: createSceneArt(new URL("../assets/scene-plates/德扑酒馆全貌.png", import.meta.url).href),
    table: createSceneArt(new URL("../assets/scene-plates/德扑牌桌视角.png", import.meta.url).href),
    summary: createSceneArt(new URL("../assets/scene-plates/德扑撤离视角.png", import.meta.url).href),
  };
  Object.values(TAVERN_SCENES).forEach((scene) => {
    sceneMap[`search-${scene.id}`] = createSceneArt(
      new URL(`../assets/scene-plates/${scene.bgImage}`, import.meta.url).href,
    );
  });
  return sceneMap;
}

function getBackdropVideoKey(state) {
  if (state.mode === "menu") {
    return "menu";
  }

  if (state.mode === "search") {
    if (activeSearchScene === "stash" || !state.run?.floorEntered) {
      return "stash";
    }
    return `tavern-${state.run?.tavernSceneId ?? "smoky-den"}`;
  }

  if (state.mode === "table" && state.run?.currentTable) {
    return getPokerVideoKey(state.run.currentTable);
  }

  if (state.mode === "summary") {
    return state.latestSummary?.success ? "extraction-success" : "extraction-failure";
  }

  return null;
}

function getPokerVideoKey(table) {
  if (table.lastHandSummary || table.pendingNextHand || table.pendingConclusion) {
    return "poker-table-showdown";
  }
  if (table.players.some((participant) => !participant.folded && participant.stack <= 0)) {
    return "poker-table-allin";
  }
  const highStakesThreshold = Math.max(table.tableDef.buyIn * 2, table.tableDef.openBet * 4);
  if (table.pot >= highStakesThreshold) {
    return "poker-table-highstakes";
  }
  return "poker-table-normal";
}

function createSceneArt(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image;
}

function drawIllustrationBackdrop(state, t) {
  const artKey =
    state.mode === "menu"
      ? "menu"
      : state.mode === "search"
        ? activeSearchScene === "stash"
          ? "stash"
          : `search-${state.run?.tavernSceneId ?? "smoky-den"}`
        : state.mode === "table"
          ? "table"
          : "summary";
  const videoKey = getBackdropVideoKey(state);
  VIDEO_BACKGROUNDS.setKey(videoKey);
  const image = SCENE_ART[artKey] ?? SCENE_ART.search;
  const drewVideo = VIDEO_BACKGROUNDS.draw(
    ctx,
    {},
    { x: 0, y: 0, w: SCENE_WIDTH, h: SCENE_HEIGHT },
  );
  if (!drewVideo && (!image?.complete || !image.naturalWidth)) {
    return false;
  }

  ctx.imageSmoothingEnabled = true;
  if (!drewVideo) {
    drawCoverSceneArt(image, SCENE_ART_CROP[artKey]);
  }
  drawIllustrationGrade(state, t);
  drawIllustrationMotionLayer(state, t);
  if (drewVideo) {
    drawVideoWatermarkCover(state.mode);
  }
  return true;
}

function drawVideoWatermarkCover(mode) {
  const x = 276;
  const y = 188;
  const w = 84;
  const h = 37;
  const radius = 9;
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, mode === "summary" ? "#070a0f" : "#080706");
  gradient.addColorStop(1, mode === "summary" ? "#030508" : "#030303");

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(247, 224, 181, 0.16)";
  ctx.lineWidth = 1 / PIXEL_SCALE;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCoverSceneArt(image, crop = {}) {
  let sx = crop.x ?? 0;
  let sy = crop.y ?? 0;
  let sw = crop.w ?? image.naturalWidth;
  let sh = crop.h ?? image.naturalHeight;
  const targetAspect = SCENE_WIDTH / SCENE_HEIGHT;
  const sourceAspect = sw / sh;

  if (sourceAspect > targetAspect) {
    const adjustedW = sh * targetAspect;
    sx += (sw - adjustedW) / 2;
    sw = adjustedW;
  } else if (sourceAspect < targetAspect) {
    const adjustedH = sw / targetAspect;
    sy += (sh - adjustedH) / 2;
    sh = adjustedH;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, SCENE_WIDTH, SCENE_HEIGHT);
}

function drawIllustrationGrade(state, t) {
  const heat = state.run?.heat ?? 0;
  const alphaPulse = Math.sin(t * 1.8) > 0.15 ? 1 : 0.82;

  fillPx(0, 0, SCENE_WIDTH, SCENE_HEIGHT, "rgba(12, 4, 10, 0.18)");

  if (state.mode === "menu") {
    fillPx(0, 0, SCENE_WIDTH, 28, "rgba(6, 2, 5, 0.26)");
    fillPx(0, 178, SCENE_WIDTH, 47, "rgba(8, 2, 4, 0.2)");
  } else if (state.mode === "search") {
    fillPx(0, 0, SCENE_WIDTH, 34, "rgba(20, 7, 12, 0.18)");
    fillPx(0, 136, SCENE_WIDTH, 89, "rgba(17, 5, 9, 0.14)");
  } else if (state.mode === "table") {
    const mirror = state.run?.currentTable?.tableDef.id === "mirror-hall";
    fillPx(0, 0, SCENE_WIDTH, SCENE_HEIGHT, mirror ? "rgba(10, 22, 30, 0.2)" : "rgba(22, 11, 6, 0.14)");
    fillPx(0, 150, SCENE_WIDTH, 75, mirror ? "rgba(10, 22, 30, 0.18)" : "rgba(32, 16, 8, 0.12)");
  } else if (state.mode === "summary") {
    fillPx(0, 0, SCENE_WIDTH, SCENE_HEIGHT, "rgba(8, 12, 18, 0.24)");
    fillPx(0, 154, SCENE_WIDTH, 71, "rgba(6, 8, 14, 0.22)");
  }

  if (heat >= 3) {
    fillPx(0, 20, 10, SCENE_HEIGHT - 40, `rgba(70, 120, 145, ${0.22 * alphaPulse})`);
    fillPx(SCENE_WIDTH - 10, 20, 10, SCENE_HEIGHT - 40, `rgba(70, 120, 145, ${0.22 * alphaPulse})`);
  }
  if (heat >= 5) {
    fillPx(0, 0, SCENE_WIDTH, 5, `rgba(149, 33, 49, ${0.32 * alphaPulse})`);
    fillPx(0, SCENE_HEIGHT - 5, SCENE_WIDTH, 5, `rgba(149, 33, 49, ${0.32 * alphaPulse})`);
  }
}

function drawIllustrationMotionLayer(state, t) {
  if (state.mode === "menu") {
    drawLampGlow(180, 26, 44, "rgba(241, 190, 94, 0.16)");
    drawSmokeRibbon(198, 58, 42, 32, t, { tint: "rgba(255, 238, 217, 0.08)", drift: 7 });
    return;
  }

  if (state.mode === "search") {
    drawLampGlow(162, 28, 44, "rgba(241, 190, 94, 0.12)");
    drawLampGlow(276, 24, 38, "rgba(241, 190, 94, 0.1)");
    drawSmokeRibbon(196, 34, 58, 48, t, { tint: "rgba(255, 238, 217, 0.08)", drift: 10 });
    drawSmokeRibbon(248, 58, 40, 34, t + 0.8, { tint: "rgba(226, 232, 240, 0.06)", drift: 6 });
    if ((state.run?.heat ?? 0) >= 3) {
      drawObservationSweep(296, 70, 44, 104, t, "rgba(126, 192, 217, 0.1)");
    }
    return;
  }

  if (state.mode === "table" && state.run?.currentTable) {
    const table = state.run.currentTable;
    const mirror = table.tableDef.id === "mirror-hall";
    drawLampGlow(182, 18, mirror ? 48 : 42, mirror ? "rgba(126, 192, 217, 0.12)" : "rgba(241, 190, 94, 0.12)");
    drawSmokeRibbon(286, 116, 46, 34, t, {
      tint: mirror ? "rgba(176, 222, 242, 0.08)" : "rgba(255, 238, 217, 0.08)",
      drift: 7,
    });
    drawTableSeatFocus(table, t);
    drawTablePotShimmer(table, t, mirror);
    if (table.handNumber === table.totalHands) {
      drawFinalHandPulse(t, mirror);
    }
    return;
  }

  if (state.mode === "summary") {
    drawStreetSweep(t, state.latestSummary?.success);
  }
}

function drawLampGlow(x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSmokeRibbon(x, y, width, height, t, options = {}) {
  const drift = options.drift ?? 8;
  const tint = options.tint ?? "rgba(255, 238, 217, 0.08)";
  ctx.save();
  for (let i = 0; i < 4; i += 1) {
    const px = x + Math.sin(t * 0.7 + i * 0.8) * drift;
    const py = y + i * (height / 4) - Math.cos(t * 0.5 + i) * 3;
    const rx = width * (0.24 + i * 0.06);
    const ry = height * (0.14 + i * 0.05);
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry));
    gradient.addColorStop(0, tint);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, -0.3 + i * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawObservationSweep(x, y, width, height, t, color) {
  const sweep = (Math.sin(t * 0.8) + 1) / 2;
  const beamX = x + sweep * (width - 10);
  const gradient = ctx.createLinearGradient(beamX, y, beamX, y + height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

function drawTableSeatFocus(table, t) {
  const mirror = table.tableDef.id === "mirror-hall";
  const seatMap = {
    [table.players[1].id]: { x: 112, y: 72 },
    [table.players[2].id]: { x: 248, y: 72 },
    player: { x: 180, y: 184 },
  };
  const target = seatMap[table.currentActorId];
  if (!target) {
    return;
  }
  const intensity = 0.1 + 0.05 * ((Math.sin(t * 3.4) + 1) / 2);
  const glow = mirror
    ? `rgba(126, 192, 217, ${intensity.toFixed(3)})`
    : table.currentActorId === "player"
      ? `rgba(241, 190, 94, ${Math.min(0.18, intensity + 0.05).toFixed(3)})`
      : `rgba(188, 122, 73, ${intensity.toFixed(3)})`;
  drawLampGlow(target.x, target.y, table.currentActorId === "player" ? 42 : 34, glow);
}

function drawTablePotShimmer(table, t, mirror) {
  const shimmer = 0.06 + 0.05 * ((Math.sin(t * 5.2) + 1) / 2);
  const color = mirror
    ? `rgba(126, 192, 217, ${shimmer.toFixed(3)})`
    : `rgba(241, 190, 94, ${shimmer.toFixed(3)})`;
  drawLampGlow(180, 138, Math.min(34, 14 + table.pot / 6), color);
}

function drawFinalHandPulse(t, mirror) {
  const pulse = 0.08 + 0.06 * ((Math.sin(t * 4.6) + 1) / 2);
  const top = mirror
    ? `rgba(126, 192, 217, ${pulse.toFixed(3)})`
    : `rgba(227, 93, 111, ${pulse.toFixed(3)})`;
  fillPx(0, 0, SCENE_WIDTH, 8, top);
  fillPx(0, SCENE_HEIGHT - 8, SCENE_WIDTH, 8, top);
}

function drawStreetSweep(t, success) {
  const sweep = (Math.sin(t * 0.9) + 1) / 2;
  const x = 210 + sweep * 120;
  const gradient = ctx.createLinearGradient(x - 38, 118, x + 38, 190);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.5, success ? "rgba(126, 192, 217, 0.14)" : "rgba(227, 93, 111, 0.12)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(190, 100, 150, 96);
  ctx.restore();
}

function drawRoomShell(heat) {
  drawCheckerBand(146, 79, "#190b11", "#14080d", 8);
  fillPx(0, 132, SCENE_WIDTH, 14, "#2d141d");
  fillPx(0, 140, SCENE_WIDTH, 6, "#7e4b31");
  fillPx(0, 146, SCENE_WIDTH, 3, "#2f141c");

  for (let i = 0; i < 5; i += 1) {
    const x = 18 + i * 68;
    framePx(x, 36, 36, 60, "#201018", "#4e2331", i === 2 ? "#f1be5e" : null);
    fillPx(x + 6, 44, 24, 26, i === 2 ? "#7e4554" : "#39202e");
    fillPx(x + 6, 72, 24, 16, "#1a0a10");
  }

  fillPx(0, 112, SCENE_WIDTH, 10, "#281019");
  fillPx(0, 122, SCENE_WIDTH, 10, "#4a2b23");
  fillPx(0, 128, SCENE_WIDTH, 4, "#8d613b");

  fillPx(0, 0, 8, SCENE_HEIGHT, heat >= 5 ? "#4d1e2a" : "#1a0b12");
  fillPx(SCENE_WIDTH - 8, 0, 8, SCENE_HEIGHT, heat >= 5 ? "#17343f" : "#1a0b12");
}

function drawMenuBackdrop() {
  framePx(92, 26, 176, 34, "#230d16", "#7a4a2c", "#f1be5e");
  fillPx(102, 36, 156, 12, "#401822");
  textPx("BLACKLIGHT", 180, 34, "#f7dd99", 8, "center");
  textPx("BAR", 180, 45, "#f7c56f", 6, "center");
  drawBottleShelf(124, 62, 10, "#8b5f39");
  drawBottleShelf(132, 84, 8, "#7a4a2c");
  drawDoorPlacard(28, 80, 36, "VAULT", "#5a2837");
  drawDoorPlacard(296, 80, 36, "OPEN", "#4a6076");
  fillPx(16, 132, 328, 6, "#8d613b");
  fillPx(16, 138, 328, 8, "#4a2b23");
  drawMenuPatron(126, 122, "#7c4d2e", "#f1be5e");
  drawMenuPatron(168, 118, "#4a3735", "#c7aa83");
  drawMenuPatron(214, 124, "#3a465d", "#7ec0d9");
  fillPx(112, 160, 124, 3, "rgba(0,0,0,0.32)");
  drawCheckerBand(184, 20, "#291017", "#1c0b10", 6);

  framePx(36, 146, 84, 40, "#1b0e14", "#5a2833");
  textPx("VAULT", 78, 152, "#f7c56f", 6, "center");
  fillPx(58, 164, 40, 12, "#2d1a1a");
  fillPx(62, 168, 8, 4, "#f7c56f");
  fillPx(86, 168, 4, 4, "#f7c56f");
  drawCarryProp(44, 188, "chip");
  drawCarryProp(76, 188, "watch");

  framePx(246, 142, 82, 48, "#150913", "#4d2633", "#7ec0d9");
  textPx("OPEN", 287, 150, "#7ec0d9", 6, "center");
  fillPx(260, 164, 54, 12, "#27121a");
  fillPx(266, 168, 18, 4, "#7ec0d9");
  fillPx(290, 168, 12, 4, "#e35d6f");
  drawCarryProp(282, 188, "coin");

  framePx(134, 150, 92, 34, "#140a11", "#5e2f3d", "#f1be5e");
  textPx("TONIGHT", 180, 156, "#f7dd99", 6, "center");
  fillPx(148, 166, 56, 6, "#3a2018");
  fillPx(154, 166, 10, 6, "#f1be5e");
  fillPx(168, 166, 10, 6, "#bc7a49");
  fillPx(182, 166, 10, 6, "#7ec0d9");
  fillPx(196, 166, 10, 6, "#e35d6f");
}

function drawSearchBackdrop(run, t) {
  if (!run) {
    return;
  }
  const extractionPreview = buildExtractionPreview(run);
  const valuables = getRunValuables(run);

  drawBottleShelf(24, 86, 5, "#7a4a2c");
  drawBottleShelf(112, 94, 7, "#8d613b");
  drawBottleShelf(214, 88, 6, run.heat >= 3 ? "#7ec0d9" : "#7a4a2c");

  framePx(18, 150, 76, 34, "#1b0e14", "#6d4029", "#f1be5e");
  textPx(t("Ledger Counter"), 56, 158, "#f7c56f", 6, "center");
  fillPx(28, 166, 14, 10, "#f1be5e");
  fillPx(46, 166, 14, 10, "#e35d6f");
  fillPx(64, 166, 18, 10, "#7ec0d9");

  framePx(112, 136, 132, 44, "#25111a", "#5a2837", "#f1be5e");
  textPx(t("Middle Floor"), 178, 144, "#f7dd99", 6, "center");
  for (let i = 0; i < 5; i += 1) {
    fillPx(124 + i * 22, 160, 12, 12 + ((i + Math.floor(t * 2)) % 2) * 2, "#60352d");
  }

  framePx(266, 132, 72, 48, "#170a13", "#4a2633", "#7ec0d9");
  textPx(t("Out"), 302, 140, run.heat >= 5 ? "#e35d6f" : "#7ec0d9", 7, "center");
  fillPx(282, 154, 40, 18, "#24131a");
  drawRouteIndicator(286, 158, "P", extractionPreview.general.available, "#f1be5e");
  drawRouteIndicator(298, 158, "F", extractionPreview.fixed.available || extractionPreview.fixed.reserved, "#7ec0d9");
  drawRouteIndicator(310, 158, "X", extractionPreview.dropbagCash.available, "#e35d6f");
  fillPx(286, 178, 32, 4, run.heat >= 5 ? "#7a2431" : "#355363");

  const tables = [
    { x: 42, y: 188, label: t("Cargo"), active: !run.completedTables.includes("cargo-table"), tone: "#3b6d4f" },
    { x: 202, y: 182, label: t("Mirror"), active: run.completedTables.includes("cargo-table"), tone: "#456b7f" },
  ];
  for (const table of tables) {
    framePx(table.x, table.y, 108, 24, table.active ? "#1b2d24" : "#1b1116", table.active ? table.tone : "#44303a", table.active ? "#f1be5e" : null);
    textPx(table.label, table.x + 54, table.y + 8, table.active ? "#f7e8c8" : "#8b6f73", 6, "center");
  }

  drawSearchCarryRig(128, 34, valuables, {
    heat: run.heat,
    pulse: t,
  });

  fillPx(150, 90, 8, 20, "#5d3524");
  fillPx(200, 90, 8, 20, "#5d3524");
  fillPx(250, 90, 8, 20, "#5d3524");
  fillPx(154, 110, 48, 4, "#7e4b31");
  fillPx(240, 106, 42, 4, "#5e3d54");
  if (run.heat >= 3) {
    fillPx(326, 90, 6, 70, "#355363");
    fillPx(322, 86, 14, 4, "#7ec0d9");
  }
}

function drawTableBackdrop(table, t) {
  const mirror = table.tableDef.id === "mirror-hall";
  const felt = mirror ? "#21434d" : "#264734";
  const border = mirror ? "#7ec0d9" : "#c08e58";
  const roomAccent = mirror ? "#26405c" : "#4f2e20";

  for (let i = 0; i < 4; i += 1) {
    framePx(16 + i * 84, 34, 42, 48, mirror ? "#1b1b29" : "#26130f", mirror ? "#375273" : "#5a3624");
    fillPx(22 + i * 84, 42, 30, 12, mirror ? "#7ec0d9" : "#f1be5e");
    fillPx(22 + i * 84, 58, 30, 18, roomAccent);
  }

  framePx(76, 66, 208, 98, border, "#2f151d");
  fillPx(84, 74, 192, 82, felt);
  fillPx(92, 82, 176, 66, mirror ? "#2a5965" : "#315c43");
  fillPx(168, 114, 24, 10, Math.sin(t * 2) > 0 ? "#f1be5e" : "#d98a48");
  drawCardSlot(124, 92, "F", border);
  drawCardSlot(146, 92, "L", border);
  drawCardSlot(168, 92, "O", border);
  drawCardSlot(190, 92, "T", border);
  drawCardSlot(212, 92, "R", border);
  drawChipPile(171, 138, Math.max(2, Math.round((table.pot || 20) / 30)), mirror ? "#7ec0d9" : "#f1be5e");

  if (table.stageCue) {
    drawStageCuePanel(94, 74, 172, 20, table.stageCue);
  }

  const seats = [
    {
      x: 150,
      y: 52,
      label: trimSeatLabel(table.players[1].name),
      participant: table.players[1],
      portraitX: 100,
      portraitY: 58,
    },
    {
      x: 212,
      y: 52,
      label: trimSeatLabel(table.players[2].name),
      participant: table.players[2],
      portraitX: 220,
      portraitY: 58,
    },
    {
      x: 166,
      y: 176,
      label: t("You"),
      participant: table.players[0],
      portraitX: 154,
      portraitY: 162,
    },
  ];

  for (const seat of seats) {
    framePx(seat.x - 26, seat.y, 52, 14, "#211018", mirror ? "#4a6076" : "#6d4029");
    textPx(seat.label, seat.x, seat.y + 4, "#f7e8c8", 5, "center");
    drawSeatFigure(seat.portraitX, seat.portraitY, seat.participant, {
      mirror,
      active: table.currentActorId === seat.participant.id,
      folded: seat.participant.folded,
      player: seat.participant.id === "player",
    });
  }

  drawChipPile(112, 70, Math.max(1, Math.round(table.players[1].stack / 40)), "#bc7a49");
  drawChipPile(232, 70, Math.max(1, Math.round(table.players[2].stack / 40)), "#bc7a49");
  drawChipPile(166, 196, Math.max(1, Math.round(table.players[0].stack / 40)), "#f1be5e");

  if (mirror) {
    fillPx(96, 148, 168, 6, "#203645");
    fillPx(108, 152, 24, 2, "rgba(126,192,217,0.5)");
    fillPx(148, 152, 28, 2, "rgba(126,192,217,0.35)");
    fillPx(194, 152, 18, 2, "rgba(126,192,217,0.5)");
    fillPx(294, 48, 26, 94, "#0f141f");
    fillPx(300, 54, 14, 82, "#7ec0d9");
    fillPx(302, 58, 10, 74, "#233746");
    fillPx(296, 146, 28, 14, "#1a2431");
    fillPx(302, 150, 16, 6, "#7ec0d9");
    framePx(286, 90, 42, 26, "#141a25", "#4a6076", "#7ec0d9");
    fillPx(304, 98, 8, 8, "#f7e8c8");
    fillPx(306, 100, 4, 4, "#7ec0d9");
    drawMirrorSigil(168, 34);
    drawMirrorSigil(126, 44, true);
    drawMirrorSigil(214, 44, true);
  } else {
    framePx(290, 146, 42, 28, "#321d15", "#7c5237", "#f1be5e");
    fillPx(298, 154, 10, 12, "#8a5e3b");
    fillPx(310, 154, 10, 12, "#6f492d");
    drawCrateStack(286, 94, 2, 2, "#7c5237");
    fillPx(294, 102, 10, 8, "#f1be5e");
    fillPx(306, 102, 8, 8, "#bc7a49");
  }
}

function drawSummaryBackdrop(summary) {
  framePx(104, 40, 152, 78, "#150913", "#7a4a2c", "#f1be5e");
  textPx(t("Vault"), 180, 50, "#f7dd99", 7, "center");
  fillPx(142, 68, 76, 34, "#241419");
  fillPx(156, 76, 48, 18, "#70543f");
  fillPx(174, 82, 12, 12, "#f1be5e");
  drawChipPile(120, 184, 4, "#f1be5e");
  drawChipPile(232, 184, 6, "#7ec0d9");
  framePx(54, 150, 28, 22, "#170a13", "#5a2837");
  textPx(t("In"), 68, 158, "#f7c56f", 5, "center");
  framePx(278, 150, 28, 22, "#170a13", "#4a6076");
  textPx(t("Out"), 292, 158, "#7ec0d9", 5, "center");

  framePx(90, 146, 180, 34, "#180b12", "#5a2837", "#7ec0d9");
  textPx(t("Settlement Slip"), 180, 156, "#7ec0d9", 6, "center");

  const sceneCarry =
    summary?.success
      ? summary.settledValuables?.slice(0, 3) ?? []
      : summary?.lostValuableNames?.slice(0, 3) ?? [];
  if (sceneCarry.length) {
    const leftCarry = sceneCarry.slice(0, 2);
    const rightCarry = sceneCarry.slice(2);
    if (leftCarry.length) {
      drawCarryShowcase(8, 60, 62, 66, leftCarry, {
        label: summary?.success ? t("Vault") : t("Seized"),
        tone: summary?.success ? "#7ec0d9" : "#e35d6f",
        accent: summary?.success ? "#355363" : "#6f2431",
        vertical: true,
      });
    }
    if (rightCarry.length) {
      drawCarryShowcase(290, 60, 62, 48, rightCarry, {
        label: summary?.success ? t("Out") : t("Loss"),
        tone: summary?.success ? "#7ec0d9" : "#e35d6f",
        accent: summary?.success ? "#355363" : "#6f2431",
        vertical: true,
      });
    }
  }
}

function drawHeatOverlay(heat, t) {
  if (heat <= 0) {
    return;
  }

  const pulse = Math.sin(t * 3.5) > 0 ? 1 : 0;
  if (heat >= 3) {
    fillPx(0, 24, 4, SCENE_HEIGHT - 48, pulse ? "#6b9bb3" : "#355363");
    fillPx(SCENE_WIDTH - 4, 24, 4, SCENE_HEIGHT - 48, pulse ? "#6b9bb3" : "#355363");
  }
  if (heat >= 5) {
    fillPx(0, 0, SCENE_WIDTH, 4, pulse ? "#b33a48" : "#641f29");
    fillPx(0, SCENE_HEIGHT - 4, SCENE_WIDTH, 4, pulse ? "#b33a48" : "#641f29");
  }
}

function drawModeFrame(mode) {
  return;
}

function drawBottleShelf(x, y, count, tone = "#7a4a2c") {
  fillPx(x, y + 14, count * 12 + 8, 4, "#6b452d");
  for (let i = 0; i < count; i += 1) {
    const bx = x + 4 + i * 12;
    fillPx(bx + 2, y + 2, 4, 10, tone);
    fillPx(bx + 1, y + 12, 6, 2, "#c08e58");
  }
}

function drawDoorPlacard(x, y, w, label, tone, active = true) {
  framePx(x, y, w, 18, active ? "#1a1015" : "#120b10", tone, active ? "#f1be5e" : null);
  textPx(label, x + w / 2, y + 5, active ? "#f7e8c8" : "#876a70", 5, "center");
}

function drawChipPile(x, y, chips, tone = "#f1be5e") {
  for (let i = 0; i < chips; i += 1) {
    fillPx(x, y - i * 3, 14, 3, tone);
    fillPx(x + 1, y + 1 - i * 3, 12, 1, "#2d171e");
  }
}

function drawCardSlot(x, y, label, tone = "#bc7a49") {
  framePx(x, y, 18, 24, "#1a0f14", tone);
  textPx(label, x + 9, y + 16, "#c7aa83", 4, "center");
}

function drawCrateStack(x, y, cols, rows, tone = "#6d4029") {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      framePx(x + col * 18, y + row * 14, 16, 12, "#2d1710", tone);
    }
  }
}

function drawRouteIndicator(x, y, label, active, tone) {
  framePx(x, y, 10, 10, active ? "#221016" : "#140a10", active ? tone : "#49333b", active ? "#f7e8c8" : null);
  textPx(label, x + 5, y + 1, active ? "#f7e8c8" : "#876a70", 4, "center");
}

function drawSeatFigure(x, y, participant, options = {}) {
  const { mirror = false, active = false, folded = false, player = false } = options;
  const archetype = player ? "player" : participant.archetypeId ?? participant.id;
  const accent = active ? "#f1be5e" : mirror ? "#7ec0d9" : "#bc7a49";
  const body =
    {
      "dock-braggart": "#7c4d2e",
      "ledger-clerk": "#4a3735",
      "calm-widow": "#3a465d",
      "smiling-knife": "#5b2732",
      player: "#70543f",
    }[archetype] ?? "#5d3a33";
  const trim =
    {
      "dock-braggart": "#f1be5e",
      "ledger-clerk": "#c7aa83",
      "calm-widow": "#7ec0d9",
      "smiling-knife": "#e35d6f",
      player: "#f7e8c8",
    }[archetype] ?? accent;

  framePx(x, y, 24, 22, folded ? "#140a11" : "#1f1018", folded ? "#463039" : accent);
  fillPx(x + 8, y + 3, 8, 5, folded ? "#7f6b5d" : "#d8a77d");
  fillPx(x + 6, y + 9, 12, 8, body);
  fillPx(x + 5, y + 17, 14, 3, body);
  fillPx(x + 7, y + 8, 10, 2, trim);

  if (archetype === "dock-braggart") {
    fillPx(x + 5, y + 1, 14, 2, "#f1be5e");
    fillPx(x + 4, y + 11, 16, 2, "#8f6137");
  } else if (archetype === "ledger-clerk") {
    fillPx(x + 10, y + 2, 4, 7, "#c7aa83");
    fillPx(x + 8, y + 12, 8, 2, "#d8d2c0");
  } else if (archetype === "calm-widow") {
    fillPx(x + 4, y + 2, 16, 1, "#7ec0d9");
    fillPx(x + 5, y + 14, 14, 2, "#7ec0d9");
  } else if (archetype === "smiling-knife") {
    fillPx(x + 13, y + 10, 5, 2, "#e35d6f");
    fillPx(x + 14, y + 12, 3, 6, "#e35d6f");
  } else if (archetype === "player") {
    fillPx(x + 6, y + 2, 12, 1, "#f7e8c8");
  }

  if (mirror && !player) {
    fillPx(x + 2, y + 2, 1, 16, "rgba(126,192,217,0.35)");
    fillPx(x + 20, y + 2, 1, 16, "rgba(126,192,217,0.25)");
  }
}

function drawStageCuePanel(x, y, w, h, cue) {
  const toneMap = {
    good: { border: "#5c9b73", accent: "#7fd6a4" },
    warn: { border: "#bc7a49", accent: "#f3be5e" },
    bad: { border: "#8a3949", accent: "#e35d6f" },
    cool: { border: "#4a6076", accent: "#7ec0d9" },
  };
  const tone = toneMap[cue.tone] ?? toneMap.cool;
  framePx(x, y, w, h, "#160a12", tone.border, tone.accent);
  textPx(cue.title.toUpperCase(), x + 8, y + 4, tone.accent, 5);
  textPx(trimCueText(cue.text), x + w - 8, y + 4, "#f7e8c8", 5, "right");
}

function drawMirrorSigil(x, y, small = false) {
  const size = small ? 10 : 14;
  framePx(x, y, size, size, "#151a22", "#4a6076", "#7ec0d9");
  fillPx(x + 3, y + 3, size - 6, 2, "#7ec0d9");
  fillPx(x + 3, y + size - 5, size - 6, 2, "#7ec0d9");
  fillPx(x + Math.floor(size / 2) - 1, y + 3, 2, size - 6, "#f7e8c8");
}

function trimCueText(text) {
  return text.length > 26 ? `${text.slice(0, 25)}.` : text;
}

function drawCarryProp(x, y, kind) {
  framePx(x, y, 22, 22, "#140a11", "#5a2837", "#f1be5e");
  if (kind === "chip") {
    fillPx(x + 6, y + 6, 10, 10, "#f1be5e");
    fillPx(x + 8, y + 8, 6, 6, "#1c0f16");
  } else if (kind === "watch") {
    fillPx(x + 7, y + 6, 8, 8, "#f1be5e");
    fillPx(x + 9, y + 2, 4, 4, "#c7aa83");
    fillPx(x + 9, y + 14, 4, 4, "#c7aa83");
  } else if (kind === "coin") {
    fillPx(x + 5, y + 5, 12, 12, "#7ec0d9");
    fillPx(x + 8, y + 8, 6, 6, "#1b1f29");
  } else if (kind === "lighter") {
    fillPx(x + 7, y + 6, 8, 10, "#c7d1da");
    fillPx(x + 8, y + 4, 6, 3, "#f7e8c8");
    fillPx(x + 9, y + 16, 4, 2, "#7c5237");
  } else if (kind === "cufflink") {
    fillPx(x + 5, y + 8, 5, 5, "#e35d6f");
    fillPx(x + 12, y + 8, 5, 5, "#e35d6f");
    fillPx(x + 10, y + 10, 2, 2, "#c7aa83");
  } else if (kind === "bond") {
    fillPx(x + 5, y + 5, 12, 10, "#efe1c3");
    fillPx(x + 9, y + 8, 4, 4, "#e35d6f");
    fillPx(x + 7, y + 17, 8, 2, "#7c5237");
  }
}

function drawCarryShowcase(x, y, w, h, items, options = {}) {
  const tone = options.tone ?? "#f1be5e";
  const accent = options.accent ?? "#5a2837";
  framePx(x, y, w, h, "#140a11", accent, tone);
  textPx(options.label ?? "CARRY", x + w / 2, y + 5, tone, 5, "center");
  const cells = items.slice(0, 3);
  cells.forEach((item, index) => {
    if (options.vertical) {
      drawCarryCell(x + 20, y + 18 + index * 24, carryPropKind(item.itemId), tone, accent);
    } else {
      drawCarryCell(x + 12 + index * 34, y + 13, carryPropKind(item.itemId), tone, accent);
    }
  });
}

function drawCarryCell(x, y, kind, tone, accent) {
  framePx(x, y, 26, 26, "#12080f", accent, tone);
  drawCarryProp(x + 2, y + 2, kind);
}

function drawSearchCarryRig(x, y, items, options = {}) {
  const hot = (options.heat ?? 0) >= 3;
  const tone = hot ? "#7ec0d9" : "#f1be5e";
  const accent = hot ? "#355363" : "#6d4029";
  const beam = hot ? "#233746" : "#5b3422";
  const glow = hot ? "rgba(126,192,217,0.32)" : "rgba(241,190,94,0.22)";
  const visible = items.slice(0, 2);
  const overflow = Math.max(0, items.length - visible.length);
  const pulseBright = Math.sin((options.pulse ?? 0) * 2.5) > 0;

  fillPx(x + 6, y + 6, 92, 8, glow);
  fillPx(x + 46, y + 16, 6, 42, beam);
  fillPx(x + 20, y + 22, 58, 4, tone);
  fillPx(x + 18, y + 26, 4, 6, accent);
  fillPx(x + 76, y + 26, 4, 6, accent);
  framePx(x + 20, y + 8, 58, 12, "#12080f", accent, tone);
  textPx(items.length ? "LIVE CARRY" : "COAT CHECK", x + 49, y + 12, tone, 5, "center");
  fillPx(x + 34, y + 58, 30, 4, accent);

  if (visible.length) {
    visible.forEach((item, index) => {
      const cx = x + 14 + index * 36;
      fillPx(cx + 11, y + 26, 4, 8, hot ? "#7ec0d9" : "#c08e58");
      drawCarryCell(cx, y + 34, carryPropKind(item.itemId), tone, accent);
    });
  } else {
    fillPx(x + 48, y + 26, 4, 8, hot ? "#7ec0d9" : "#c08e58");
    framePx(x + 37, y + 34, 28, 24, "#12080f", accent, tone);
    fillPx(x + 49, y + 39, 4, 8, tone);
    fillPx(x + 45, y + 47, 12, 2, tone);
    fillPx(x + 45, y + 51, 12, 2, accent);
  }

  if (overflow) {
    framePx(x + 82, y + 38, 18, 16, "#12080f", accent, hot ? "#f7e8c8" : "#f1be5e");
    textPx(`+${overflow}`, x + 91, y + 43, hot ? "#f7e8c8" : "#f7dd99", 5, "center");
  }

  framePx(x + 82, y + 2, 20, 14, "#12080f", accent, tone);
  textPx(hot && pulseBright ? "HOT" : "SAFE", x + 92, y + 6, hot ? "#e35d6f" : "#f7dd99", 4, "center");
}

function carryPropKind(itemId) {
  return {
    "ivory-chip": "chip",
    "antique-coin": "coin",
    "gold-cased-watch": "watch",
    "old-silver-lighter": "lighter",
    "ruby-cufflink": "cufflink",
    "sealed-bond": "bond",
  }[itemId] ?? "chip";
}

function drawMenuPatron(x, y, body, accent) {
  fillPx(x + 6, y + 26, 14, 4, "rgba(0,0,0,0.28)");
  fillPx(x + 8, y + 2, 10, 8, "#d6a27e");
  fillPx(x + 6, y + 10, 14, 12, body);
  fillPx(x + 4, y + 22, 18, 4, body);
  fillPx(x + 6, y + 10, 14, 2, accent);
  fillPx(x + 2, y + 14, 4, 10, accent);
  fillPx(x + 20, y + 14, 4, 10, accent);
}

function trimSeatLabel(label) {
  return label.length > 8 ? `${label.slice(0, 8)}` : label;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    return;
  }
  document.exitFullscreen?.();
}

function exitGame() {
  if (document.fullscreenElement) {
    Promise.resolve(document.exitFullscreen?.()).catch(() => {});
  }

  try {
    window.open("", "_self");
  } catch {}

  try {
    window.close();
  } catch {}

  window.setTimeout(() => {
    if (!window.closed) {
      window.location.replace("about:blank");
    }
  }, 80);
}

function money(value) {
  return `${Math.round(value)}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function inventorySlotsUsed(inventory) {
  return inventory.reduce((sum, item) => sum + getItemDef(item.itemId).slots, 0);
}

function layerLabel(layer) {
  return {
    rule: "rule",
    opponents: "opponents",
    reward: "reward hook",
  }[layer];
}

function describePressureState(participant, table) {
  if (participant.folded) {
    return currentLanguage() === "zh" ? "出局" : "Out";
  }
  if (table.currentActorId === participant.id) {
    return currentLanguage() === "zh" ? "行动中" : "Acting";
  }
  if (participant.currentBet >= table.currentBet && table.currentBet > 0) {
    return currentLanguage() === "zh" ? "已压线" : "Holding";
  }
  if (participant.currentBet > 0) {
    return currentLanguage() === "zh" ? "受压" : "Pressed";
  }
  return currentLanguage() === "zh" ? "观察中" : "Watching";
}

function describeThreatChip(participant, table) {
  if (participant.folded) {
    return currentLanguage() === "zh" ? "位置已死" : "Seat dead";
  }
  if (table.currentActorId === participant.id) {
    return currentLanguage() === "zh" ? "灯下行动" : "Under the lamp";
  }
  if (participant.currentBet >= table.currentBet && table.currentBet > 0) {
    return currentLanguage() === "zh" ? "已经压线" : "Covering line";
  }
  if (participant.currentBet > 0) {
    return currentLanguage() === "zh"
      ? `还差 ${money(Math.max(0, table.currentBet - participant.currentBet))}`
      : `${money(Math.max(0, table.currentBet - participant.currentBet))} behind`;
  }
  if (table.handNumber === table.totalHands) {
    return currentLanguage() === "zh" ? "最后一手仍冷" : "Last hand cold";
  }
  return currentLanguage() === "zh" ? "冷着观察" : "Waiting cold";
}

function describeOpponentPressureAccent(participant, table) {
  if (participant.folded) {
    return currentLanguage() === "zh" ? "这个位置已经退出这间房了。" : "This seat is already out of the room.";
  }
  if (table.currentActorId === participant.id) {
    return currentLanguage() === "zh"
      ? "动作现在落在这个位置上，其他所有人都会通过他来读这一拍。"
      : "Action is on this seat, so everyone else is reading the move through them.";
  }
  if (participant.currentBet >= table.currentBet && table.currentBet > 0) {
    return currentLanguage() === "zh"
      ? "他已经压过当前这条线，可以直接坐在压力上等别人回应。"
      : "They are already across the live line and can sit on the pressure.";
  }
  if (participant.currentBet > 0) {
    return currentLanguage() === "zh"
      ? `他还需要 ${money(Math.max(0, table.currentBet - participant.currentBet))} 才能跟平。`
      : `They still need ${money(Math.max(0, table.currentBet - participant.currentBet))} to stay level.`;
  }
  if (table.handNumber === table.totalHands) {
    return currentLanguage() === "zh"
      ? "最后一手已经开始，所以连安静的姿态都开始变得危险。"
      : "The last hand is live, so even quiet posture starts to feel dangerous.";
  }
  return currentLanguage() === "zh"
    ? "这个位置还在读桌子，还没准备继续投入更多筹码。"
    : "This seat is still reading the table before committing more money.";
}

function heatClass(heat) {
  if (heat >= 5) {
    return "bad";
  }
  if (heat >= 3) {
    return "warn";
  }
  return "good";
}

function describeRuleHint(table) {
  if (table.tableDef.id === "cargo-table") {
    return currentLanguage() === "zh" ? "第一次激进行为可减免 10 筹码" : "First aggressive action gets a 10-chip discount";
  }
  if (table.tableDef.id === "ledger-cellar") {
    return currentLanguage() === "zh" ? "每次牌桌道具额外增加 1 点风声" : "Each table tool adds 1 extra Heat";
  }
  if (table.tableDef.id === "embers-table") {
    return currentLanguage() === "zh" ? "盈利收桌会在撤离前降低 1 点风声" : "Profitable close cools Heat by 1 before extraction";
  }
  return currentLanguage() === "zh" ? "抵押物会解锁最后一手的最佳奖励" : "Collateral unlocks the best final-hand reward";
}
