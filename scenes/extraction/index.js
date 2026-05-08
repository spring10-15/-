export function renderExtractionRoutesModal(run, preview, extractionCommit, helpers) {
  const visibleCards = getVisibleRouteCards(run, preview);
  return `
    <div class="drawer-stack">
      ${
        visibleCards.length
          ? `
            <div class="modal-grid route-modal-grid">
              ${visibleCards.map((plan) => renderCompactRouteOption(plan, helpers)).join("")}
            </div>
          `
          : `
            <div class="drawer-card">
              <p class="eyebrow">${helpers.t("Routes")}</p>
              <h3>${helpers.t("No Route Leads Yet")}</h3>
              <p class="micro">${helpers.t("Work the floor, reveal intel, or let the room throw an event before a clean exit line appears.")}</p>
            </div>
          `
      }
    </div>
  `;
}

export function renderSummaryScene(state, helpers) {
  const { t, currentLanguage, money } = helpers;
  const summary = state.latestSummary;
  if (!summary) {
    return helpers.renderMenu(state);
  }
  const roomTrail = summary.completedTables.length
    ? summary.completedTables.map((tableId) => helpers.tableCopy(tableId).name).join(" -> ")
    : t("No rooms cleared");
  const successTitle = currentLanguage() === "zh" ? "成功撤离" : "Successful Extraction";
  const failureTitle = currentLanguage() === "zh" ? "撤离失败" : "Compromised";
  const goodsLine = summary.success
    ? summary.settledValuables.length
      ? summary.settledValuables.map((item) => item.name).join(" / ")
      : t("No valuables made it into the vault this time.")
    : summary.lostValuableNames.length
      ? summary.lostValuableNames.map((item) => item.name).join(" / ")
      : t("No valuables were being carried when the run collapsed.");
  const costLine = summary.success
    ? summary.costs.length
      ? summary.costs.join(" / ")
      : t("No payout costs")
    : summary.reason;
  return `
    <div class="scene-shell summary-shell fixed-scene-shell result-scene-shell">
      <section class="summary-main-shell ${summary.success ? "success" : "failure"}">
        <div class="summary-main-head">
          <div>
            <p class="eyebrow">${summary.success ? t("Vault Settlement") : t("Room Closed In")}</p>
            <h1>${summary.success ? successTitle : failureTitle}</h1>
            <p class="micro">
              ${
                summary.success
                  ? currentLanguage() === "zh"
                    ? `撤离方式：${summary.routeLabel}。金库现在有 ${money(state.persistent.vault)}。`
                    : `Route: ${summary.routeLabel}. The vault now holds ${money(state.persistent.vault)}.`
                  : currentLanguage() === "zh"
                    ? `失败原因：${summary.reason}。这趟没能完整带出去。`
                    : `Cause: ${summary.reason}. The run broke before the money settled.`
              }
            </p>
          </div>
          <span class="summary-status-pill ${summary.success ? "success" : "failure"}">
            ${summary.success ? (currentLanguage() === "zh" ? "已结算" : "SETTLED") : currentLanguage() === "zh" ? "已扣押" : "SEIZED"}
          </span>
        </div>
        <div class="summary-stat-row">
          ${
            summary.success
              ? `
                ${helpers.renderCompactStatChip(t("Funds secured"), money(summary.totalSettled), "good")}
                ${helpers.renderCompactStatChip(t("Cash carried out"), money(summary.settledCash), "warm")}
                ${helpers.renderCompactStatChip(t("Stash net"), money(summary.stashNet), "cool")}
                ${helpers.renderCompactStatChip(t("Valuables settled"), money(summary.valuableTotal), "neutral")}
              `
              : `
                ${helpers.renderCompactStatChip(t("Cash lost"), money(summary.lostCash), "bad")}
                ${helpers.renderCompactStatChip(t("Stash lost"), money(summary.lostStash), "warn")}
                ${helpers.renderCompactStatChip(t("Wallet salvage"), money(summary.salvaged), "cool")}
                ${helpers.renderCompactStatChip(t("Reason"), summary.reason, "bad")}
              `
          }
        </div>
        <div class="summary-text-block">
          <p><span class="eyebrow">${t("Trail Snapshot")}</span> ${roomTrail}</p>
          <p><span class="eyebrow">${summary.success ? t("Settled Goods") : t("Lost Carry")}</span> ${goodsLine}</p>
          <p><span class="eyebrow">${summary.success ? t("Payout Costs") : t("Collapse")}</span> ${costLine}</p>
        </div>
        <div class="scene-action-dock summary-action-dock">
          <button class="scene-action-button primary" data-action="start-run">${t("Run It Again")}</button>
          <button class="scene-action-button" data-action="return-to-menu">${t("Back to Menu")}</button>
        </div>
      </section>
    </div>
  `;
}

export function renderSummaryAftermathStrip(summary, helpers) {
  const { t, currentLanguage, money, tableCopy, renderVerdictCell } = helpers;
  const zh = currentLanguage() === "zh";
  if (summary.success) {
    const roomTrail = summary.completedTables.length
      ? summary.completedTables.map((tableId) => tableCopy(tableId).name).join(" -> ")
      : t("No room clear");
    return `
      <div class="room-verdict-strip summary-aftermath-strip">
        ${renderVerdictCell("Exit", summary.routeLabel, zh ? "这就是最终真正把这局带出去的路线。" : "This is the route that actually closed the run.", "good")}
        ${renderVerdictCell("Vault take", money(summary.totalSettled), zh ? `寄存实得 ${money(summary.stashNet)}，再加身上现金和货物。` : `Stash net ${money(summary.stashNet)} plus carried cash and goods.`, "cool")}
        ${renderVerdictCell(
          "Rooms crossed",
          summary.completedTables.length ? (currentLanguage() === "zh" ? `清掉 ${summary.completedTables.length} 个房间` : `${summary.completedTables.length} cleared`) : t("No room clear"),
          summary.completedTables.length ? roomTrail : zh ? "这一局在真正清掉任何房间之前就结束了。" : "The run ended before any room was meaningfully cleared.",
          "warn",
        )}
      </div>
    `;
  }

  const roomTrail = summary.completedTables.length
    ? summary.completedTables.map((tableId) => tableCopy(tableId).name).join(" -> ")
    : t("No room clear");
  return `
    <div class="room-verdict-strip summary-aftermath-strip">
      ${renderVerdictCell("Collapse", summary.reason, zh ? "这局在完成任何正式结算前就断掉了。" : "The run broke before anything could settle.", "bad")}
      ${renderVerdictCell("Salvage", money(summary.salvaged), zh ? "只有钱包保护下来的现金活了下来。" : "Only wallet-protected money survived the collapse.", "cool")}
      ${renderVerdictCell(
        "Rooms crossed",
        summary.completedTables.length ? (currentLanguage() === "zh" ? `清掉 ${summary.completedTables.length} 个房间` : `${summary.completedTables.length} cleared`) : t("No room clear"),
        summary.completedTables.length ? roomTrail : zh ? "房间在这局形成势头之前就已经关死了。" : "The room shut before the run built momentum.",
        "warn",
      )}
    </div>
  `;
}

export function renderSummaryNextStep(summary, helpers) {
  const nextStep = helpers.getSummaryNextStep(summary);
  const { t } = helpers;
  return `
    <div class="card-block summary-next-step">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("Demo Read")}</p>
          <h3>${t(nextStep.title)}</h3>
        </div>
        <span class="pill ${nextStep.tone}">${t(nextStep.badge)}</span>
      </div>
      <p class="micro">${t(nextStep.text)}</p>
      <div class="preview-grid objective-grid">
        ${helpers.renderPreviewCell(t("Banked"), nextStep.banked, nextStep.tone)}
        ${helpers.renderPreviewCell(t("Pressure point"), t(nextStep.pressure), "warn")}
        ${helpers.renderPreviewCell(t("Next try"), t(nextStep.next), "cool")}
      </div>
    </div>
  `;
}

export function renderCompactRouteOption(plan, helpers) {
  const { t, currentLanguage } = helpers;
  const actionMap = {
    general: "extract-general",
    fixed: "extract-fixed",
    "dropbag-cash": "extract-dropbag-cash",
    "dropbag-valuables": "extract-dropbag-valuables",
    "service-stairs": "extract-service-stairs",
    "river-launch": "extract-river-launch",
  };
  const titleMap = {
    general: t("Taxed Walkout"),
    fixed: t("Runner Hand-Off"),
    "dropbag-cash": currentLanguage() === "zh" ? "紧急撤离 / 现金" : "Break Glass Exit / Cash",
    "dropbag-valuables": currentLanguage() === "zh" ? "紧急撤离 / 丢货" : "Break Glass Exit / Goods",
    "service-stairs": plan.label,
    "river-launch": plan.label,
  };
  const routeClass = {
    general: 'route-general',
    fixed: 'route-fixed',
    'dropbag-cash': 'route-dropbag-cash',
    'dropbag-valuables': 'route-dropbag-valuables',
    'service-stairs': 'route-fixed',
    'river-launch': 'route-fixed',
  }[plan.key];

  return `
    <div class="drawer-card route-compact-card ${routeClass} ${plan.available ? "" : "locked"}">
      <p class="eyebrow">${plan.key === "fixed" || plan.key === "service-stairs" || plan.key === "river-launch" ? t("Prepared Line") : plan.key.startsWith("dropbag") ? t("Emergency Choice") : t("Front Of House")}</p>
      <h3>${titleMap[plan.key]}</h3>
      <div class="compact-chip-grid">
        ${helpers.renderCompactStatChip(t("Cost"), summarizeRouteCost(plan, helpers), plan.key.startsWith("dropbag") ? "bad" : "warn")}
        ${helpers.renderCompactStatChip(t("Status"), plan.available ? t("Open") : t("Locked"), plan.available ? "good" : "bad")}
      </div>
      <p class="micro">${plan.reason}</p>
      <button class="${plan.key.startsWith("dropbag") ? "danger" : "cta"}" data-action="${actionMap[plan.key]}" ${plan.available ? "" : "disabled"}>${t("Take This Route")}</button>
    </div>
  `;
}

export function summarizeRouteCost(plan, helpers) {
  const { money, currentLanguage } = helpers;
  if (plan.key === "general") {
    return money(plan.fee ?? 0);
  }
  if (plan.key === "fixed") {
    return money(plan.fee ?? 0);
  }
  if (plan.key === "dropbag-cash") {
    return currentLanguage() === "zh" ? `-${money(plan.sacrificed ?? 0)}` : `Lose ${money(plan.sacrificed ?? 0)}`;
  }
  if (plan.key === "dropbag-valuables") {
    return currentLanguage() === "zh" ? `丢货 ${money(plan.droppedValue ?? 0)}` : `Dump ${money(plan.droppedValue ?? 0)}`;
  }
  if (plan.key === "service-stairs" || plan.key === "river-launch") {
    return money(plan.fee ?? 0);
  }
  return money(0);
}

export function getVisibleRouteCards(run, preview) {
  const cards = [];
  if (preview.general.visible) {
    cards.push(preview.general);
  }
  if (preview.fixed.visible) {
    cards.push(preview.fixed);
  }
  if (preview.serviceStairs?.visible) {
    cards.push(preview.serviceStairs);
  }
  if (preview.riverLaunch?.visible) {
    cards.push(preview.riverLaunch);
  }
  if (preview.dropbagCash.visible) {
    cards.push(preview.dropbagCash);
    if (preview.dropbagValuables.visible) {
      cards.push(preview.dropbagValuables);
    }
  }
  return cards;
}
