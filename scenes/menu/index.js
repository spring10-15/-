export function renderMenuScene(state, helpers) {
  const { t, getMenuTitleAnimation } = helpers;
  const canLoad = state.savedRunAvailable;
  const titleAnimation = getMenuTitleAnimation();

  return `
    <div class="scene-shell menu-shell">
      <section class="menu-title-card" aria-label="${t("Menu")}">
        <div class="menu-title-marquee" aria-label="${titleAnimation.fullText}">
          <span class="menu-title-copy">${titleAnimation.visibleText || "&nbsp;"}</span>
          <span class="menu-title-caret ${titleAnimation.caretVisible ? "visible" : ""}"></span>
        </div>
        <div class="menu-title-actions" role="group" aria-label="${t("Menu")}">
          <button
            id="start-btn"
            type="button"
            class="menu-hotspot menu-hotspot-start"
            data-action="start-run"
            aria-label="${t("Start New Game")}"
            title="${t("Start New Game")}"
          >
            <span class="menu-hotspot-label">${t("Start New Game")}</span>
          </button>
          <button
            type="button"
            class="menu-hotspot menu-hotspot-load"
            data-action="load-run"
            aria-label="${t("Load Game")}"
            title="${canLoad ? t("Load Game") : t("No in-progress run is waiting in the ledger.")}"
            ${canLoad ? "" : "disabled"}
          >
            <span class="menu-hotspot-label">${t("Load Game")}</span>
          </button>
          <button
            type="button"
            class="menu-hotspot menu-hotspot-exit"
            data-action="exit-game"
            aria-label="${t("Exit Game")}"
            title="${t("Exit Game")}"
          >
            <span class="menu-hotspot-label">${t("Exit Game")}</span>
          </button>
        </div>
      </section>
    </div>
  `;
}
