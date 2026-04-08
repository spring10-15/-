import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:4173";
const OUT_DIR = path.resolve("output/browser-full-coverage");
fs.mkdirSync(OUT_DIR, { recursive: true });

function card(code) {
  const rankToken = code.slice(0, -1);
  const suit = code.slice(-1).toUpperCase();
  const rankMap = { J: 11, Q: 12, K: 13, A: 14 };
  return {
    rank: rankMap[rankToken.toUpperCase()] ?? Number(rankToken),
    suit,
  };
}

async function capture(page, name, extras = {}) {
  const screenshotPath = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath });
  const textState = await page.evaluate(() => {
    if (typeof window.render_game_to_text === "function") {
      return window.render_game_to_text();
    }
    return null;
  });
  const payload = {
    name,
    url: page.url(),
    textState: textState ? JSON.parse(textState) : null,
    ...extras,
  };
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(payload, null, 2));
}

async function expectMode(page, mode) {
  await page.waitForFunction((expected) => document.body.dataset.mode === expected, mode);
}

async function openFreshPage(context, errors) {
  const page = await context.newPage({ viewport: { width: 1440, height: 960 } });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  return page;
}

async function startRunFromMenu(page) {
  await clickStable(page, "#start-btn");
  await expectMode(page, "search");
}

async function rigCurrentTable(page, outcome) {
  await page.evaluate(({ outcomeName }) => {
    const table = window.__blacklightGame.state.run.currentTable;
    const parseCard = (code) => {
      const rankToken = code.slice(0, -1);
      const suit = code.slice(-1).toUpperCase();
      const rankMap = { J: 11, Q: 12, K: 13, A: 14 };
      return {
        rank: rankMap[rankToken.toUpperCase()] ?? Number(rankToken),
        suit,
      };
    };
    const setup = outcomeName === "win"
      ? {
          playerCards: ["AS", "AH"],
          opponentCards: [["KD", "KC"], ["QD", "QC"]],
          boardCards: ["2H", "5H", "9S", "JC", "3D"],
          playerStack: table.tableDef.id === "mirror-hall" ? 220 : 140,
          opponentStacks: [10, 10],
        }
      : {
          playerCards: ["2C", "7D"],
          opponentCards: [["AS", "AH"], ["KD", "KC"]],
          boardCards: ["2H", "5H", "9S", "JC", "3D"],
          playerStack: 20,
          opponentStacks: [200, 60],
        };

    table.handNumber = table.totalHands;
    table.street = "river";
    table.community = setup.boardCards.map(parseCard);
    table.pot = table.tableDef.id === "mirror-hall" ? 120 : 90;
    table.currentBet = 0;
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
      participant.folded = false;
      participant.lastAction = null;
      participant.stack = index === 0 ? setup.playerStack : setup.opponentStacks[index - 1];
      participant.holeCards =
        index === 0
          ? setup.playerCards.map(parseCard)
          : setup.opponentCards[index - 1].map(parseCard);
    });
    const liveParticipants = table.players.filter((participant) => !participant.folded);
    const baseContribution = liveParticipants.length
      ? Math.floor(table.pot / liveParticipants.length)
      : 0;
    let remainder = liveParticipants.length
      ? table.pot - baseContribution * liveParticipants.length
      : 0;
    liveParticipants.forEach((participant) => {
      participant.handContribution = baseContribution + (remainder > 0 ? 1 : 0);
      if (remainder > 0) {
        remainder -= 1;
      }
    });
    table.legalActions = {
      player: { check: true, raise: false },
    };
  }, { outcomeName: outcome });
}

async function forceRerender(page) {
  await page.evaluate(() => {
    window.__blacklightGame.state.toasts.push({
      id: `render-${Date.now()}`,
      text: "",
      ttl: 0.2,
    });
  });
  await page.waitForTimeout(150);
}

async function clickFirstIfPresent(page, selector) {
  const locator = page.locator(selector).first();
  if (await locator.count()) {
    await locator.evaluate((element) => element.click());
    return true;
  }
  return false;
}

async function closeSearchModal(page) {
  await clickStable(page, "button.close-modal-button[data-close-search-modal]");
}

async function closeTableSidebar(page) {
  await clickStable(page, "button.close-modal-button[data-close-table-sidebar]");
}

async function clickStable(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible" });
  await locator.evaluate((element) => element.click());
}

async function commitExtraction(page, reviewAction, confirmAction) {
  const confirmSelector = `[data-action="${confirmAction}"]`;
  if (await page.locator(confirmSelector).count()) {
    await clickStable(page, confirmSelector);
    return;
  }
  await clickStable(
    page,
    `[data-action="prepare-extraction"][data-extract-action="${reviewAction}"]`,
  );
  await page.waitForTimeout(200);
  if (await page.locator(confirmSelector).count()) {
    await clickStable(page, confirmSelector);
    return;
  }
  await page.evaluate((action) => {
    window.__blacklightGame.dispatch(action);
  }, confirmAction);
}

async function commitBestExtraction(page) {
  const bestAction = await page.evaluate(() => {
    const state = window.__blacklightGame?.state;
    const preview = window.render_game_to_text
      ? JSON.parse(window.render_game_to_text()).settlementPreview
      : null;
    if (!state?.run || !preview) {
      return null;
    }
    if (preview.general?.available) {
      return "extract-general";
    }
    if (preview.fixed?.available) {
      return "extract-fixed";
    }
    if (preview.dropbagCash?.available) {
      return "extract-dropbag-cash";
    }
    if (preview.dropbagValuables?.available) {
      return "extract-dropbag-valuables";
    }
    return null;
  });
  if (!bestAction) {
    throw new Error("no extraction route was available in the browser flow");
  }
  await commitExtraction(page, bestAction, bestAction);
  return bestAction;
}

async function settleRiggedTable(page) {
  await page.waitForFunction(() => {
    const state = window.__blacklightGame?.state;
    return state?.mode === "table" && state.run?.currentTable?.legalActions?.player?.check;
  });
  const checkButton = page.locator('[data-action="player-check"]').first();
  if (await checkButton.count()) {
    await checkButton.evaluate((element) => element.click());
    return;
  }
  await page.evaluate(() => {
    window.__blacklightGame.dispatch("player-check");
  });
}

async function leaveResolvedTable(page) {
  await page.waitForFunction(() => {
    const state = window.__blacklightGame?.state;
    return state?.mode === "table" && state.run?.currentTable?.pendingConclusion;
  });
  const continueButton = page.locator('[data-action="continue-table"]').first();
  if (await continueButton.count()) {
    await continueButton.evaluate((element) => element.click());
    return;
  }
  await page.evaluate(() => {
    window.__blacklightGame.dispatch("continue-table");
  });
}

async function runVisualFlowScenario(context, errors) {
  const page = await openFreshPage(context, errors);
  await capture(page, "menu");
  await startRunFromMenu(page);
  await capture(page, "stash");

  await clickStable(page, '[data-open-search-modal="folder"]');
  await page.waitForTimeout(200);
  await capture(page, "stash-folder");
  await closeSearchModal(page);

  await clickStable(page, '[data-action="enter-floor"]');
  await page.waitForTimeout(250);
  await capture(page, "tavern");

  await clickStable(page, '[data-open-search-modal="services"]');
  await page.waitForTimeout(200);
  await capture(page, "tavern-services");
  await clickStable(page, '[data-action="buy-item"][data-item-id="marked-lens"]');
  await page.waitForTimeout(200);
  await closeSearchModal(page);

  await clickStable(page, '[data-open-search-modal="routes"]');
  await page.waitForTimeout(200);
  await capture(page, "tavern-routes");
  await closeSearchModal(page);

  await clickStable(page, '[data-open-search-modal="folder"]');
  await page.waitForTimeout(200);
  await capture(page, "tavern-folder");
  await closeSearchModal(page);

  await clickStable(page, '[data-open-search-modal="play"]');
  await page.waitForTimeout(200);
  await capture(page, "tavern-play-cargo");
  await clickStable(page, '[data-action="enter-table"][data-table-id="cargo-table"]');
  await expectMode(page, "table");
  await page.waitForTimeout(300);
  await capture(page, "cargo-table");

  if (await clickFirstIfPresent(page, '[data-action="use-table-item"][data-instance-id="item-1"]')) {
    await page.waitForTimeout(150);
    await capture(page, "cargo-lens-used");
  }

  await capture(page, "cargo-log");

  await clickFirstIfPresent(page, '[data-select-opponent]');
  await page.waitForTimeout(150);
  await capture(page, "cargo-player");
  await closeTableSidebar(page);

  await rigCurrentTable(page, "win");
  await forceRerender(page);
  await settleRiggedTable(page);
  await page.waitForTimeout(200);
  await capture(page, "cargo-final-hand");
  await leaveResolvedTable(page);
  await expectMode(page, "search");
  await page.waitForTimeout(300);
  await capture(page, "tavern-stage2");

  await clickStable(page, '[data-open-search-modal="services"]');
  await page.waitForTimeout(200);
  await capture(page, "tavern-services-stage2");
  await clickStable(page, '[data-action="buy-item"][data-item-id="signal-lighter"]');
  await page.waitForTimeout(150);
  await clickStable(page, '[data-action="buy-item"][data-item-id="sleeve-clip"]');
  await page.waitForTimeout(150);
  await closeSearchModal(page);

  await clickStable(page, '[data-open-search-modal="play"]');
  await page.waitForTimeout(200);
  await page.selectOption('#collateral-mirror-hall', { index: 1 });
  await capture(page, "tavern-play-mirror");
  await clickStable(page, '[data-action="enter-table"][data-table-id="mirror-hall"]');
  await expectMode(page, "table");
  await page.waitForTimeout(300);
  await capture(page, "mirror-table");

  await clickFirstIfPresent(page, '[data-action="use-table-item"][data-target-id]');
  await page.waitForTimeout(150);
  await clickFirstIfPresent(page, '[data-action="use-table-item"]:has-text("Swap")');
  await page.waitForTimeout(150);
  await capture(page, "mirror-table-items");

  await rigCurrentTable(page, "win");
  await forceRerender(page);
  await settleRiggedTable(page);
  await page.waitForTimeout(200);
  await capture(page, "mirror-final-hand");
  await leaveResolvedTable(page);
  await expectMode(page, "search");
  await page.waitForTimeout(300);
  await capture(page, "tavern-stage3");

  await clickStable(page, '[data-open-search-modal="routes"]');
  await page.waitForTimeout(200);
  await capture(page, "routes-before-extract");
  await commitBestExtraction(page);
  await expectMode(page, "summary");
  await page.waitForTimeout(300);
  await capture(page, "summary-success");
  await page.close();
}

async function runFailureSummaryScenario(context, errors) {
  const page = await openFreshPage(context, errors);
  await startRunFromMenu(page);
  await page.evaluate(() => {
    const run = window.__blacklightGame.state.run;
    run.cashOnHand = 5;
    run.stashedCash = 0;
    run.heat = 6;
    run.inventory = [];
    run.fixedRouteReservation = null;
    run.completedTables = [];
  });
  await page.evaluate(() => {
    window.__blacklightGame.dispatch("gather-intel", {
      tableId: "cargo-table",
      layer: "rule",
    });
  });
  await expectMode(page, "summary");
  await page.waitForTimeout(300);
  await capture(page, "summary-failure");
  await page.close();
}

async function runLoadGameScenario(context, errors) {
  const seedPage = await openFreshPage(context, errors);
  await startRunFromMenu(seedPage);
  await seedPage.evaluate(() => {
    window.__blacklightGame.dispatch("enter-floor");
  });
  await seedPage.waitForTimeout(200);
  await seedPage.evaluate(() => {
    window.__blacklightGame.dispatch("open-search-modal", { modal: "play" });
  });
  await seedPage.waitForTimeout(200);
  await seedPage.evaluate(() => {
    window.__blacklightGame.dispatch("enter-table", { tableId: "cargo-table" });
  });
  await expectMode(seedPage, "table");
  await seedPage.close();

  const loadPage = await openFreshPage(context, errors);
  await capture(loadPage, "menu-load");
  await clickStable(loadPage, '[data-action="load-run"]');
  await expectMode(loadPage, "table");
  await pageWaitShort(loadPage);
  await capture(loadPage, "loaded-table");
  await loadPage.close();
}

async function runExitScenario(context, errors) {
  const page = await openFreshPage(context, errors);
  await clickStable(page, '[data-action="exit-game"]');
  try {
    await page.waitForURL("about:blank", { timeout: 2000 });
  } catch (error) {
    if (!page.isClosed()) {
      errors.push("exit-game did not navigate to about:blank or close the page");
    }
  }
  if (!page.isClosed()) {
    await capture(page, "menu-exit");
    await page.close();
  }
}

async function pageWaitShort(page) {
  await page.waitForTimeout(200);
}

const errors = [];
const browser = await chromium.launch({
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader"],
});
const context = await browser.newContext();

try {
  try {
    await runExitScenario(context, errors);
    await runVisualFlowScenario(context, errors);
    await runLoadGameScenario(context, errors);
    await runFailureSummaryScenario(context, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.stack || error.message : String(error));
  }
} finally {
  await context.close();
  await browser.close();
}

const report = {
  baseUrl: BASE_URL,
  outDir: OUT_DIR,
  errors,
};
fs.writeFileSync(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

if (errors.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
