export function renderPokerScene(state, helpers) {
  const { t, money, getItemDef, getRoomRewardPreview, tableCopy, renderFirstPersonFrame, renderCompactStatChip, renderBoardCards, itemCopy, formatCardInline, renderTableCue, renderFinalHandSpotlight, localizeStreet, currentLanguage, getRaiseRange } = helpers;
  const run = state.run;
  const table = run.currentTable;
  const player = table.players[0];
  const usableItems = run.inventory.filter((item) => getItemDef(item.itemId).phase === "table");
  const stakesPreview = getRoomRewardPreview(run, table);
  const tableView = tableCopy(table.tableDef);
  const callAmount = Math.max(0, table.currentBet - player.currentBet);
  const tableLog = table.log.slice(-5).reverse();
  return `
    <div class="scene-shell table-shell fixed-scene-shell">
      ${renderFirstPersonFrame("table")}
      <section class="minimal-scene-hud table-hud">
        <div class="minimal-scene-title">
          <strong>${tableView.name}</strong>
        </div>
        <div class="minimal-scene-stats">
          ${renderCompactStatChip(t("Pot"), money(table.pot), "warm")}
          ${renderCompactStatChip(t("Current call"), money(callAmount), callAmount > 0 ? "warn" : "neutral")}
          ${renderCompactStatChip(t("Heat"), `${run.heat}`, helpers.heatClass(run.heat))}
        </div>
      </section>
      <section class="table-play-surface ${table.tableDef.id}">
        <div class="table-seat-tag-row">
          ${table.players
            .filter((participant) => participant.id !== "player")
            .map((participant) => renderTableSeatTag(table, participant, helpers))
            .join("")}
        </div>

        <div class="table-felt-focus">
          <div class="board-felt-shell ${table.street} ${table.handNumber === table.totalHands ? "final-hand" : ""}">
            ${table.peekCard ? `<div class="board-stage-note"><span class="pill cool">${itemCopy("marked-lens").name}: ${formatCardInline(table.peekCard)} ${t("next")}</span></div>` : ""}
            <div class="table-board-head">
              <span class="pill">${t("Hand")} ${table.handNumber}/${table.totalHands}</span>
              <span class="pill">${localizeStreet(table.street, currentLanguage())}</span>
              <span class="pill warm">${t("Pot")} ${money(table.pot)}</span>
            </div>
            <div class="card-row board-card-row">
              ${renderBoardCards(table)}
            </div>
          </div>
          ${table.stageCue ? renderTableCue(table.stageCue) : ""}
          ${renderFinalHandSpotlight(table, stakesPreview)}
        </div>

      </section>
      <section class="table-command-dock">
        <div class="table-player-hand-shell">
          <div class="card-row">
            ${player.holeCards.map((card) => helpers.renderCard(card)).join("")}
          </div>
        </div>
        <div class="table-player-summary ${table.currentActorId === "player" ? "active" : ""}">
          <div class="table-player-summary-copy">
            <strong>${t("You")}</strong>
            <div class="micro">${playerTurnLabel(table, helpers)}</div>
          </div>
          <div class="table-player-summary-chips">
            <span class="pill">${t("Stack")} ${money(player.stack)}</span>
            <span class="pill">${t("Bet")} ${money(player.currentBet)}</span>
            <span class="pill">${t("Cash on hand")} ${money(run.cashOnHand)}</span>
          </div>
        </div>
        ${renderTableActionBar(run, table, usableItems, helpers)}
      </section>
      <aside class="table-inline-log-card" aria-live="polite">
        <button class="log-toggle-btn" data-action="toggle-hand-log" aria-expanded="true">
          <span class="eyebrow">${t("Hand Log")}</span>
          <span class="log-toggle-icon">▾</span>
        </button>
        <div class="table-inline-log-stack" id="hand-log-body">
          ${tableLog.length ? tableLog.map((entry) => `<p class="micro">${entry}</p>`).join("") : `<p class="micro">${t("The felt is still quiet.")}</p>`}
        </div>
      </aside>
      ${renderTableSidebar(run, table, usableItems, stakesPreview, helpers)}
    </div>
  `;
}

export function renderTableSeatTag(table, participant, helpers) {
  const isActive = table.currentActorId === participant.id;
  const seatClass =
    participant.seatIndex === 1 ? "left-front" : participant.seatIndex === 2 ? "right-front" : "";
  const archetypeLabel = helpers.getKnownOpponentArchetypeLabel(participant);
  const tensionClass =
    (participant.tensionLevel ?? 0) >= 72
      ? "tense"
      : (participant.tensionLevel ?? 0) >= 45
        ? "testing"
        : "calm";
  const lastAction =
    participant.lastAction === "all-in"
      ? helpers.t("All-in")
      : participant.lastAction === "bet"
        ? helpers.t("Bet")
        : participant.lastAction
          ? helpers.t(capitalizeAction(participant.lastAction))
          : helpers.t("Waiting");
  const seatRole = describeSeatRole(table, participant, helpers);
  return `
    <button class="table-seat-tag ${seatClass} ${tensionClass} ${isActive ? "active" : ""} ${participant.folded ? "folded" : ""}" data-select-opponent="${participant.id}">
      <strong>${helpers.participantName(participant)}</strong>
      ${archetypeLabel ? `<span class="micro">${archetypeLabel}</span>` : ""}
      <span class="micro">${helpers.t("Stack")} ${helpers.money(participant.stack)}</span>
      <span class="micro">${participant.aiStatus ? `${participant.aiStatus} / ` : ""}${seatRole ? `${seatRole} / ${lastAction}` : lastAction}</span>
      ${participant.tell ? `<span class="micro tell">${participant.tell}</span>` : ""}
      ${participant.banter ? `<span class="opponent-banter">${participant.banter}</span>` : ""}
    </button>
  `;
}

function describeSeatRole(table, participant, helpers) {
  const tags = [];
  if (participant.seatIndex === table.dealerSeat) {
    tags.push(helpers.t("Dealer"));
  }
  if (participant.seatIndex === table.smallBlindSeat) {
    tags.push(helpers.t("Small Blind"));
  }
  if (participant.seatIndex === table.bigBlindSeat) {
    tags.push(helpers.t("Big Blind"));
  }
  return tags.join(" / ");
}

function capitalizeAction(action) {
  if (!action) {
    return "";
  }
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function playerTurnLabel(table, helpers) {
  const { t } = helpers;
  if (table.currentActorId === "player") {
    return t("Your move");
  }
  const actor = table.players.find((participant) => participant.id === table.currentActorId);
  if (!actor) {
    return t("Waiting for the next move");
  }
  return `${helpers.participantName(actor)} ${t("is acting")}`;
}

export function renderTableSidebar(run, table, usableItems, stakesPreview, helpers) {
  const { t, money, participantName, opponentCopy, describePressureState, describeOpponentTell, describeOpponentPressureAccent, renderRecentNotes, renderSignalReadCard, activeTableSidebar, selectedOpponentId, renderCompactStatChip, heatClass } = helpers;
  if (!activeTableSidebar) {
    return "";
  }

  if (activeTableSidebar === "log") {
    return "";
  }

  if (activeTableSidebar === "player" && selectedOpponentId) {
    const participant = table.players.find((entry) => entry.id === selectedOpponentId);
    if (!participant) {
      return "";
    }
    const opponentDef = opponentCopy(participant.archetypeId ?? participant.id);
    const read = table.signalRead && table.signalRead.targetId === participant.id ? table.signalRead : null;
    return `
      <div class="scene-modal-layer">
        <button class="scene-modal-backdrop" data-close-table-sidebar aria-label="${t("Hide")}"></button>
        <section class="scene-modal table-overlay-modal player-flyout">
        <div class="scene-modal-head compact-head">
          <div>
            <p class="eyebrow">${t("Players")}</p>
            <h3>${participantName(participant)}</h3>
          </div>
          <button class="ghost close-modal-button" data-close-table-sidebar>${t("Hide")}</button>
        </div>
        <div class="scene-modal-body">
          <div class="table-modal-copy">
            <div class="compact-chip-grid">
              ${renderCompactStatChip(t("Stack"), money(participant.stack), "cool")}
              ${renderCompactStatChip(t("Bet"), money(participant.currentBet), "warm")}
              ${renderCompactStatChip(t("Status"), t(describePressureState(participant, table)), participant.folded ? "bad" : "neutral")}
              ${renderCompactStatChip(t("Read"), read ? read.label : t("No read"), read ? read.tone : "neutral")}
            </div>
            <p class="micro">${opponentDef.intro}</p>
            <p class="micro">${t(describeOpponentTell(participant, table))}</p>
            <p class="micro">${t(describeOpponentPressureAccent(participant, table))}</p>
          </div>
          ${read ? renderSignalReadCard(read, table, participantName(participant)) : ""}
        </div>
        </section>
      </div>
    `;
  }

  return "";
}

function renderTablePrizeSnapshot(stakesPreview, table, helpers) {
  const { t, money, itemCopy } = helpers;
  return `
    <div class="table-prize-strip">
      <div class="table-prize-card premium ${stakesPreview.roomTone}">
        <p class="eyebrow">${t("Premium Line")}</p>
        <strong>${stakesPreview.premium.name}</strong>
        <div class="table-prize-value">${money(stakesPreview.premium.value)}</div>
        <p class="micro">${t(stakesPreview.premium.text)}</p>
      </div>
      <div class="table-prize-card fallback">
        <p class="eyebrow">${t("Fallback Line")}</p>
        <strong>${stakesPreview.fallback.name}</strong>
        <div class="table-prize-value">${money(stakesPreview.fallback.value)}</div>
        <p class="micro">
          ${
            table.collateral
              ? `${t("Collateral")}: ${itemCopy(table.collateral.itemId).name}`
              : t(stakesPreview.fallback.text)
          }
        </p>
      </div>
    </div>
  `;
}

export function getAvailableTableItemActions(table, usableItems, helpers) {
  const actions = [];
  for (const item of usableItems) {
    const def = helpers.itemCopy(item.itemId);
    if (item.itemId === "marked-lens") {
      if (!table.itemUsage.markedLens && table.street !== "river") {
        actions.push({
          key: `${item.id}-peek`,
          label: def.name,
          detail: def.description,
          buttonLabel: helpers.t("Peek Next Card"),
          payload: { action: "use-table-item", instanceId: item.id },
        });
      }
      continue;
    }

    if (item.itemId === "signal-lighter") {
      if (!table.itemUsage.signalLighter) {
        table.players
          .filter((participant) => participant.id !== "player" && !participant.folded)
          .forEach((participant) => {
            actions.push({
              key: `${item.id}-${participant.id}`,
              label: `${def.name} / ${helpers.participantName(participant)}`,
              detail: def.description,
              buttonLabel: `${helpers.t("Read")} ${helpers.participantName(participant)}`,
              payload: { action: "use-table-item", instanceId: item.id, targetId: participant.id },
            });
          });
      }
      continue;
    }

    if (item.itemId === "player-notes") {
      table.players
        .filter(
          (participant) =>
            participant.id !== "player" &&
            !participant.folded &&
            !helpers.getKnownOpponentArchetypeLabel(participant),
        )
        .forEach((participant) => {
          actions.push({
            key: `${item.id}-${participant.id}`,
            label: `${def.name} / ${helpers.participantName(participant)}`,
            detail: def.description,
            buttonLabel: `${helpers.t("Log")} ${helpers.participantName(participant)}`,
            payload: { action: "use-table-item", instanceId: item.id, targetId: participant.id },
          });
        });
      continue;
    }

    if (item.itemId === "sleeve-clip") {
      if (!table.itemUsage.sleeveClip && table.street === "preflop" && table.turnCounter === 0 && table.currentActorId === "player") {
        actions.push({
          key: `${item.id}-swap`,
          label: def.name,
          detail: def.description,
          buttonLabel: helpers.t("Swap a Hole Card"),
          payload: { action: "use-table-item", instanceId: item.id },
        });
      }
    }
  }
  return actions;
}

function describeTableItemState(table, item, helpers) {
  const def = helpers.itemCopy(item.itemId);
  const t = helpers.t;
  if (item.itemId === "marked-lens") {
    if (table.itemUsage.markedLens) {
      return { ready: false, text: t("Used at this table") };
    }
    if (table.street === "river") {
      return { ready: false, text: t("Unavailable on river") };
    }
    return { ready: true, text: t("Ready to peek next board card") };
  }
  if (item.itemId === "signal-lighter") {
    if (table.itemUsage.signalLighter) {
      return { ready: false, text: t("Used at this table") };
    }
    return { ready: true, text: t("Ready to read one opponent") };
  }
  if (item.itemId === "player-notes") {
    return table.players.some(
      (participant) =>
        participant.id !== "player" &&
        !participant.folded &&
        !helpers.getKnownOpponentArchetypeLabel(participant),
    )
      ? { ready: true, text: t("Ready to log one opponent archetype") }
      : { ready: false, text: t("No new archetype to log right now") };
  }
  if (item.itemId === "sleeve-clip") {
    if (table.itemUsage.sleeveClip) {
      return { ready: false, text: t("Used this hand") };
    }
    if (table.street !== "preflop") {
      return { ready: false, text: t("Preflop only") };
    }
    if (table.turnCounter > 0 || table.currentActorId !== "player") {
      return { ready: false, text: t("Only before your first decision") };
    }
    return { ready: true, text: t("Ready to swap one hole card") };
  }
  return { ready: false, text: def.description };
}

function renderTableInventoryStrip(table, usableItems, helpers) {
  const { t, itemCopy } = helpers;
  if (!usableItems.length) {
    return `
      <div class="table-item-status-strip compact-empty">
        <p class="micro">${t("The felt is still quiet.")}</p>
      </div>
    `;
  }
  const counts = usableItems.reduce((map, item) => {
    const state = describeTableItemState(table, item, helpers);
    const current = map.get(item.itemId) ?? { count: 0, ready: 0, text: state.text };
    current.count += 1;
    current.ready += state.ready ? 1 : 0;
    current.text = state.text;
    map.set(item.itemId, current);
    return map;
  }, new Map());
  return `
    <div class="table-item-status-strip compact-tools" aria-label="${t("Table Tool")}">
      <p class="eyebrow">${t("Table Tool")}</p>
      <div class="table-item-status-grid">
        ${Array.from(counts.entries())
          .map(([itemId, state]) => {
            const def = itemCopy(itemId);
            return `
              <article class="table-item-status-card ${state.ready ? "ready" : "spent"}" title="${def.description}">
                <strong>${def.name}<span>x${state.count}</span></strong>
                <p class="micro">${state.ready ? `${state.ready} ${t("ready")}` : state.text}</p>
              </article>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderTableItemButtons(itemActions) {
  if (!itemActions.length) {
    return "";
  }
  return `
    <div class="table-item-row">
      ${itemActions
        .map(
          (entry) => `
            <button class="secondary" title="${entry.detail}" data-action="${entry.payload.action}" data-instance-id="${entry.payload.instanceId}" ${entry.payload.targetId ? `data-target-id="${entry.payload.targetId}"` : ""}>${entry.buttonLabel}</button>
          `,
        )
        .join("")}
    </div>
  `;
}

export function renderTableActionBar(run, table, usableItems, helpers) {
  const { t, money, getRaiseRange } = helpers;
  if (table.pendingNextHand) {
    return `
      <div class="table-action-bar-shell verdict-shell">
      <div class="table-action-status">
          <strong>${t("Review Hand")}</strong>
          <p class="micro">${t("The hand is paused so you can read the board, stacks, and showdown before the next deal.")}</p>
          ${renderTableVerdict(table, helpers)}
        </div>
        <div class="button-row table-button-row single-action-row">
          <button class="cta" data-action="continue-table">${t("Next Hand")}</button>
        </div>
      </div>
    `;
  }

  if (table.pendingConclusion) {
    return `
      <div class="table-action-bar-shell verdict-shell">
      <div class="table-action-status">
          <strong>${t("Leave Table")}</strong>
          <p class="micro">${t("Final verdict is ready. Leave the room when you've read the showdown.")}</p>
          ${renderTableVerdict(table, helpers)}
        </div>
        <div class="button-row table-button-row single-action-row">
          <button class="cta" data-action="continue-table">${t("Leave Table")}</button>
        </div>
      </div>
    `;
  }

  const playerTurn = table.currentActorId === "player";
  const itemActions = getAvailableTableItemActions(table, usableItems, helpers);
  const player = table.players[0];
  const callAmount = Math.max(0, table.currentBet - player.currentBet);
  const legal = table.legalActions.player ?? {};
  const raiseRange = getRaiseRange ? getRaiseRange() : null;
  const canRaise = playerTurn && Boolean(legal.raise) && raiseRange;
  const actions = [
    {
      key: "fold",
      tone: "danger",
      label: t("Fold"),
      enabled: playerTurn && Boolean(legal.fold),
      disabledHint: playerTurn ? t("Fold is not available right now.") : t("Wait for your turn."),
    },
    {
      key: "check",
      tone: "secondary",
      label: t("Check"),
      enabled: playerTurn && Boolean(legal.check),
      disabledHint: playerTurn ? t("You are facing a bet, so check is not legal.") : t("Wait for your turn."),
    },
    {
      key: "call",
      tone: "secondary",
      label: callAmount > 0
        ? `${t("Call")} ${money(callAmount)}`
        : t("Call"),
      enabled: playerTurn && Boolean(legal.call),
      disabledHint: playerTurn ? t("There is no bet to call.") : t("Wait for your turn."),
    },
    {
      key: "all-in",
      tone: "cta",
      label: `${t("All-in")} ${money(player.stack)}`,
      enabled: playerTurn && Boolean(legal.allIn),
      disabledHint: playerTurn ? t("You have no chips left to commit.") : t("Wait for your turn."),
    },
  ];

  // Raise slider preset shortcuts
  const raisePresets = [];
  if (canRaise) {
    const halfPot = Math.max(raiseRange.min, Math.floor(raiseRange.pot / 2) + raiseRange.currentBet);
    const fullPot = Math.max(raiseRange.min, raiseRange.pot + raiseRange.currentBet);
    if (halfPot <= raiseRange.max && halfPot >= raiseRange.min) {
      raisePresets.push({ label: `½ ${t("Pot")}`, value: halfPot });
    }
    if (fullPot <= raiseRange.max && fullPot >= raiseRange.min && fullPot !== halfPot) {
      raisePresets.push({ label: `${t("Pot")}`, value: fullPot });
    }
  }

  return `
    <div class="table-action-bar-shell">
      <div class="table-action-status">
        <strong>${playerTurn ? t("Choose Your Line") : t("Waiting")}</strong>
        <p class="micro">${
          playerTurn
            ? t("Call matches the bet. Check passes when you're even. All-in commits your remaining stack.")
            : t("Blinds post first. Preflop acts from left of the big blind. After the flop, action starts left of the dealer.")
        }</p>
      </div>
      <div class="button-row table-button-row">
        ${actions
          .map(
            (entry) => `
              <button class="${entry.tone}" data-action="player-${entry.key}" title="${entry.enabled ? "" : entry.disabledHint}" ${entry.enabled ? "" : "disabled"}>${entry.label}</button>
            `,
          )
          .join("")}
      </div>
      ${renderTableItemButtons(itemActions)}
      ${canRaise ? `
        <div class="raise-control-strip">
          <label class="raise-label">${table.currentBet === 0 ? t("Open to") : t("Raise to")}</label>
          <div class="raise-presets">
            ${raisePresets.map(p => `<button class="raise-preset-btn" data-raise-preset="${p.value}">${p.label}</button>`).join("")}
          </div>
          <div class="raise-slider-row">
            <span class="raise-bound">${money(raiseRange.min)}</span>
            <input type="range" class="raise-slider" min="${raiseRange.min}" max="${raiseRange.max}" value="${raiseRange.min}" step="5" data-raise-slider />
            <span class="raise-bound">${money(raiseRange.max)}</span>
          </div>
          <div class="raise-commit-row">
            <span class="raise-current-value" data-raise-display>${money(raiseRange.min)}</span>
            <button class="cta raise-confirm-btn" data-action="player-raise-to" data-raise-target="${raiseRange.min}">${table.currentBet === 0 ? t("Open") : t("Raise")}</button>
          </div>
        </div>
      ` : ""}
      ${itemActions.length ? "" : renderTableInventoryStrip(table, usableItems, helpers)}
    </div>
  `;
}

function renderTableVerdict(table, helpers) {
  const summary = table.lastHandSummary;
  if (!summary) {
    return "";
  }
  const winnerLine = summary.winnerAwards?.length
    ? summary.winnerAwards
        .map((entry) => `${entry.name}${entry.handName ? ` / ${entry.handName}` : ""} / ${helpers.t("Won")} ${helpers.money(entry.amount)}`)
        .join(" | ")
    : summary.handName
      ? `${helpers.t("Current result")}: ${summary.handName}`
      : "";
  return `
    <div class="table-verdict-inline">
      <p class="micro">${summary.text ?? ""}</p>
      ${winnerLine ? `<p class="micro"><strong>${winnerLine}</strong></p>` : ""}
    </div>
  `;
}
