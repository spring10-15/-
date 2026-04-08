import { getOpponentDef } from "./data.js";
import { estimateWinOdds } from "./poker.js";

export function chooseAiAction(table, participant) {
  const opponentDef = getOpponentDef(participant.archetypeId);
  const profile = opponentDef.profile;
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
