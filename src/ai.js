import { getOpponentDef } from "./data.js";
import { estimateWinOdds } from "./poker.js";

export function chooseAiAction(table, participant) {
  const opponentDef = getOpponentDef(participant.archetypeId);
  const profile = tuneProfileForArchetype(opponentDef.profile, opponentDef.archetype, table, participant);
  const legal = table.legalActions;
  const actionSet = legal[participant.id];
  const streetFactor = getStreetFactor(table.street);
  const handFactor = table.handNumber === table.totalHands ? profile.finalHandSpike : 0;
  const patternPressure = Math.min(0.18, table.playerPattern.raiseCount * profile.patternPunish * 0.06);
  const winOdds = estimateWinOdds({
    holeCards: participant.holeCards,
    boardCards: table.community,
    deadCards: collectDeadCards(table, participant.id),
    opponentCount: table.players.filter(
      (player) => player.id !== participant.id && !player.folded && player.stack > 0,
    ).length,
    seed: table.seed + table.handNumber * 137 + table.turnCounter * 19 + participant.seatIndex * 11,
    trials: 85,
  });

  const pressure = table.currentBet > 0 ? table.currentBet / Math.max(1, participant.stack + table.currentBet) : 0;
  const raiseChance =
    profile.aggression * 0.3 +
    handFactor * 0.55 +
    streetFactor.raiseBias +
    patternPressure -
    pressure * 0.18;
  const allInChance =
    profile.aggression * 0.16 +
    handFactor * 0.62 +
    streetFactor.allInBias +
    Math.max(0, winOdds - 0.66) * 0.42 -
    pressure * 0.08;
  const bluffChance =
    profile.bluff * 0.4 +
    handFactor * 0.18 +
    streetFactor.bluffBias -
    Math.max(0, winOdds - 0.55) * 0.25;
  const caution = profile.caution * 0.22 + pressure * 0.18;
  const random = table.random();

  if (table.currentBet === 0) {
    if (
      actionSet.allIn &&
      participant.stack <= table.tableDef.openBet * 2.5 &&
      winOdds > 0.63 &&
      random < 0.18 + allInChance
    ) {
      return { kind: "all-in", reason: "jam-open", winOdds };
    }
    if (actionSet.raise) {
      if (winOdds > 0.62 - raiseChance * 0.3) {
        return { kind: "raise", reason: "value-open", winOdds };
      }
      if (winOdds < 0.42 && random < bluffChance) {
        return { kind: "raise", reason: "bluff-open", winOdds };
      }
    }
    return { kind: "check", reason: "check", winOdds };
  }

  if (
    actionSet.allIn &&
    (table.handNumber === table.totalHands || participant.stack <= Math.max(table.currentBet, table.tableDef.openBet) * 2.5) &&
    winOdds > 0.68 &&
    random < 0.16 + allInChance
  ) {
    return { kind: "all-in", reason: "jam-pressure", winOdds };
  }

  if (actionSet.raise) {
    if (winOdds > 0.72 - raiseChance * 0.25) {
      return { kind: "raise", reason: "value-pressure", winOdds };
    }
    if (winOdds < 0.38 && random < bluffChance * 0.85) {
      return { kind: "raise", reason: "bluff-pressure", winOdds };
    }
  }

  if (actionSet.call) {
    if (winOdds > 0.24 + caution * 0.55 || pressure < 0.18) {
      return { kind: "call", reason: "continue", winOdds };
    }
  }

  if (actionSet.check) {
    return { kind: "check", reason: "free-card", winOdds };
  }

  return { kind: "fold", reason: "release", winOdds };
}

function tuneProfileForArchetype(profile, archetype, table, participant) {
  const tuned = { ...profile };
  const trailing = participant.stack < table.tableDef.buyIn * 0.5;

  switch (archetype) {
    case "Nit":
      tuned.aggression = Math.max(0.08, tuned.aggression - 0.12);
      tuned.caution = Math.min(0.92, tuned.caution + 0.16);
      tuned.bluff = Math.max(0.01, tuned.bluff - 0.04);
      break;
    case "Fish":
      tuned.aggression = Math.max(0.12, tuned.aggression - 0.04);
      tuned.caution = Math.max(0.08, tuned.caution - 0.12);
      tuned.bluff = Math.min(0.24, tuned.bluff + 0.02);
      break;
    case "Calling Station":
      tuned.aggression = Math.max(0.12, tuned.aggression - 0.08);
      tuned.caution = Math.max(0.08, tuned.caution - 0.18);
      tuned.bluff = Math.max(0.01, tuned.bluff - 0.03);
      break;
    case "Maniac":
      tuned.aggression = Math.min(0.95, tuned.aggression + 0.18);
      tuned.caution = Math.max(0.04, tuned.caution - 0.14);
      tuned.bluff = Math.min(0.42, tuned.bluff + 0.1);
      tuned.finalHandSpike = Math.min(0.32, tuned.finalHandSpike + 0.06);
      break;
    case "Shark":
      tuned.aggression = Math.min(0.88, tuned.aggression + 0.04);
      tuned.caution = Math.min(0.88, tuned.caution + 0.06);
      tuned.patternPunish = Math.min(0.24, tuned.patternPunish + 0.05);
      break;
    case "Tilt King":
      tuned.aggression = Math.min(0.98, tuned.aggression + (trailing ? 0.22 : 0.1));
      tuned.caution = Math.max(0.02, tuned.caution - 0.2);
      tuned.bluff = Math.min(0.48, tuned.bluff + 0.14);
      break;
    default:
      break;
  }

  return tuned;
}

export function classifyRead(table, participant) {
  const winOdds = estimateWinOdds({
    holeCards: participant.holeCards,
    boardCards: table.community,
    deadCards: collectDeadCards(table, participant.id),
    opponentCount: table.players.filter(
      (player) => player.id !== participant.id && !player.folded && player.stack > 0,
    ).length,
    seed: table.seed + table.handNumber * 51 + participant.seatIndex * 17,
    trials: 75,
  });

  if (winOdds >= 0.66) {
    return {
      label: "Strong",
      tone: "good",
      meter: 3,
      descriptor: "The seat looks planted. The pressure is probably earned.",
      winOdds,
    };
  }
  if (winOdds >= 0.4) {
    return {
      label: "Medium",
      tone: "warn",
      meter: 2,
      descriptor: "The line could still bend either way.",
      winOdds,
    };
  }
  return {
    label: "Weak",
    tone: "bad",
    meter: 1,
    descriptor: "The pressure is louder than the cards behind it.",
    winOdds,
  };
}

export function generateOpponentBanter({
  table,
  participant,
  language = "zh",
  trigger = "idle",
  playerPattern = {},
  memory = {},
}) {
  const opponentDef = getOpponentDef(participant.archetypeId);
  const profile = opponentDef?.profile ?? {};
  const aggressive = (profile.aggression ?? 0.4) > 0.58;
  const cautious = (profile.caution ?? 0.4) > 0.58;
  const bluffer = (profile.bluff ?? 0.08) > 0.16;
  const hasHistory = (memory.handsSeen ?? 0) > 0 || (memory.playerBluffWins ?? 0) > 0;
  const playerRaisedOften = (playerPattern.raiseCount ?? 0) >= 2;
  const playerFoldedOften = (playerPattern.foldCount ?? 0) >= 2;
  const pressure = table.currentBet > 0;
  const finalHand = table.handNumber === table.totalHands;

  const zhPool = [];
  const enPool = [];

  if (trigger.startsWith("player-fold") || playerFoldedOften) {
    zhPool.push("你退得太快。", "怕了？", "这手记下了。");
    enPool.push("Too quick.", "Scared?", "I note that.");
  }
  if (trigger.startsWith("player-raise") || trigger.startsWith("player-all-in") || playerRaisedOften) {
    zhPool.push(hasHistory ? "又来这套？" : "你在压我。", aggressive ? "我不眨眼。" : "这注很吵。");
    enPool.push(hasHistory ? "Again?" : "Pressing me.", aggressive ? "I don't blink." : "Loud bet.");
  }
  if (trigger.startsWith("actor-bet") || trigger.startsWith("actor-all-in")) {
    zhPool.push(aggressive ? "跟得上吗？" : "线已经画好。", bluffer ? "别信太早。" : "这不是虚张。");
    enPool.push(aggressive ? "Keep up?" : "Line is drawn.", bluffer ? "Don't trust it." : "Not smoke.");
  }
  if (trigger.startsWith("actor-call")) {
    zhPool.push(cautious ? "我先看清。" : "我陪你一圈。", "这价还能付。");
    enPool.push(cautious ? "I watch first." : "I'll ride.", "Price is fine.");
  }
  if (trigger.startsWith("actor-check") || !pressure) {
    zhPool.push(cautious ? "牌还没说话。" : "让它自己翻。", "桌子还静。");
    enPool.push(cautious ? "Cards speak later." : "Let it turn.", "Still quiet.");
  }
  if (trigger === "showdown" || trigger === "fold-win") {
    zhPool.push("这笔我记着。", "下手再算。", "账还没完。");
    enPool.push("I remember.", "Next hand.", "Not settled.");
  }
  if (finalHand) {
    zhPool.push("最后别眨眼。", "这一手算账。");
    enPool.push("Don't blink.", "Books close now.");
  }

  if (!zhPool.length) {
    zhPool.push("我在看你。", "你有习惯。", "别演太满。");
    enPool.push("I see you.", "You have habits.", "Careful acting.");
  }

  const pool = language === "zh" ? zhPool : enPool;
  const seedText = [
    table.seed,
    table.handNumber,
    table.turnCounter,
    table.street,
    participant.id,
    trigger,
    playerPattern.raiseCount ?? 0,
    playerPattern.foldCount ?? 0,
    memory.playerBluffWins ?? 0,
  ].join("|");
  const index = Math.abs(hashString(seedText)) % pool.length;
  return pool[index];
}

function collectDeadCards(table, participantId) {
  return table.players
    .filter((player) => player.id !== participantId)
    .flatMap((player) => {
      if (!player.folded && player.holeCards.length === 2) {
        return [];
      }
      return player.holeCards;
    });
}

function getStreetFactor(street) {
  switch (street) {
    case "preflop":
      return { raiseBias: 0.06, bluffBias: 0.09, allInBias: 0.01 };
    case "flop":
      return { raiseBias: 0.04, bluffBias: 0.05, allInBias: 0.02 };
    case "turn":
      return { raiseBias: 0.02, bluffBias: 0.02, allInBias: 0.04 };
    case "river":
      return { raiseBias: 0.0, bluffBias: -0.04, allInBias: 0.08 };
    default:
      return { raiseBias: 0.0, bluffBias: 0.0, allInBias: 0.0 };
  }
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash;
}
