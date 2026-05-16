import { getOpponentDef } from "./data.js";
import { hashString } from "./utils.js";

const FALLBACK_ZH = {
  inner_monologue: "他有习惯，我先看一圈。",
  dialogue: "我在看你。",
  tell: "指节轻敲桌面。",
};

const FALLBACK_EN = {
  inner_monologue: "They have habits. I watch first.",
  dialogue: "I see you.",
  tell: "Fingers tap the felt.",
};

export function parseOpponentResponse(rawText, language = "zh") {
  const fallback = fallbackResponse(language);
  if (!rawText || typeof rawText !== "string") {
    return fallback;
  }
  try {
    return normalizeOpponentResponse(JSON.parse(rawText), language);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      return fallback;
    }
    try {
      return normalizeOpponentResponse(JSON.parse(match[0]), language);
    } catch {
      return fallback;
    }
  }
}

export function createHandStateSnapshot(table, participant, { playerName = "player" } = {}) {
  const player = table.players.find((entry) => entry.id === "player");
  return {
    hand_id: `${table.seed}-${table.handNumber}-${table.street}`,
    street: table.street,
    community_cards: table.community.map(cardCode),
    pot: table.pot,
    current_bet: table.currentBet,
    player_stack: player?.stack ?? 0,
    opponent_stack: participant.stack,
    player_name: playerName,
    opponent_id: participant.id,
    opponent_name: participant.name,
    action_history: table.log.slice(-8),
    player_stats: {
      raises: table.playerPattern?.raiseCount ?? 0,
      calls: table.playerPattern?.callCount ?? 0,
      folds: table.playerPattern?.foldCount ?? 0,
      all_ins: table.playerPattern?.allInCount ?? 0,
      bluff_wins: table.playerPattern?.bluffWins ?? 0,
    },
  };
}

export function prefetchOpponentResponses(table, participant, context = {}) {
  table.aiNativeCache ??= {};
  const likelyActions = ["fold", "check", "call", "raise", "all-in"];
  for (const action of likelyActions) {
    const key = responseCacheKey(table, participant, action);
    table.aiNativeCache[key] = createLocalOpponentResponse({
      ...context,
      table,
      participant,
      playerAction: action,
      trigger: `player-${action}`,
    });
  }
}

export function getCachedOpponentResponse(table, participant, playerAction) {
  const key = responseCacheKey(table, participant, playerAction);
  return table.aiNativeCache?.[key] ?? null;
}

export function createLocalOpponentResponse({
  table,
  participant,
  language = "zh",
  trigger = "idle",
  playerAction = null,
  memory = {},
}) {
  const opponent = getOpponentDef(participant.archetypeId ?? participant.id);
  const profile = opponent?.profile ?? {};
  const snapshot = createHandStateSnapshot(table, participant);
  const tension = clamp(
    Math.round(
      (profile.aggression ?? 0.4) * 32 +
        (profile.bluff ?? 0.08) * 45 +
        (snapshot.player_stats.raises ?? 0) * 8 +
        (snapshot.player_stats.bluff_wins ?? 0) * 12 +
        (table.currentBet > 0 ? 12 : 0) +
        (memory.playerBluffWins ?? 0) * 8,
    ),
    8,
    98,
  );
  const style = classifyStyle(profile);
  const action = playerAction ?? trigger.replace(/^player-/, "").replace(/^actor-/, "");
  const zh = language === "zh";
  const inner = pickLine(
    zh ? innerMonologueZh(style, action, tension, memory, table) : innerMonologueEn(style, action, tension, memory, table),
    table,
    participant,
    trigger,
  );
  const dialogue = pickLine(
    zh ? dialogueZh(style, action, tension, memory, table) : dialogueEn(style, action, tension, memory, table),
    table,
    participant,
    `${trigger}-dialogue`,
  );
  const tell = pickLine(zh ? tellZh(style, tension) : tellEn(style, tension), table, participant, `${trigger}-tell`);
  return normalizeOpponentResponse(
    {
      action: null,
      amount: null,
      inner_monologue: inner,
      dialogue,
      tell,
      tension_level: tension,
      status: tension >= 72 ? (zh ? "绷紧" : "Tense") : tension >= 45 ? (zh ? "试探" : "Testing") : zh ? "冷静" : "Calm",
    },
    language,
  );
}

export function compressLocalOpponentMemory({ table, participant, language = "zh" }) {
  const zh = language === "zh";
  const playerPattern = table.playerPattern ?? {};
  const wonByFold = table.lastHandSummary?.type === "fold" && table.lastHandSummary?.winnerIds?.includes("player");
  const showdownWon = table.lastHandSummary?.winnerIds?.includes("player") && table.lastHandSummary?.type === "showdown";
  const observations = [];
  if ((playerPattern.raiseCount ?? 0) >= 2) {
    observations.push(zh ? "玩家持续用下注施压" : "Player applied repeated betting pressure");
  }
  if ((playerPattern.foldCount ?? 0) >= 2) {
    observations.push(zh ? "玩家遇压会快速弃牌" : "Player released quickly under pressure");
  }
  if (wonByFold && (playerPattern.aggressiveActions ?? 0) > 0) {
    observations.push(zh ? "玩家用强压逼退了对手" : "Player pushed opponents off the pot");
  }
  if (showdownWon) {
    observations.push(zh ? "玩家摊牌拿下关键底池" : "Player won a key showdown");
  }
  const summary = observations.slice(0, 3).join(zh ? "；" : "; ");
  return {
    summary: summary || (zh ? "这桌还没有形成明确打法标签。" : "No firm table read formed yet."),
    reputationDelta: wonByFold ? -6 : showdownWon ? 4 : 0,
    observationCount: observations.length,
    opponentId: participant.id,
  };
}

function normalizeOpponentResponse(value, language) {
  const fallback = fallbackResponse(language);
  return {
    action: typeof value?.action === "string" ? value.action : null,
    amount: Number.isFinite(value?.amount) ? value.amount : null,
    inner_monologue: trimText(value?.inner_monologue, fallback.inner_monologue, language === "zh" ? 50 : 90),
    dialogue: trimText(value?.dialogue, fallback.dialogue, language === "zh" ? 15 : 36),
    tell: trimText(value?.tell, fallback.tell, language === "zh" ? 24 : 60),
    tension_level: clamp(Number(value?.tension_level ?? 36), 0, 100),
    status: trimText(value?.status, language === "zh" ? "冷静" : "Calm", language === "zh" ? 8 : 18),
  };
}

function fallbackResponse(language) {
  return language === "zh" ? { ...FALLBACK_ZH } : { ...FALLBACK_EN };
}

function trimText(value, fallback, maxLength) {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function responseCacheKey(table, participant, action) {
  return `${table.seed}:${table.handNumber}:${table.street}:${participant.id}:${action}`;
}

function classifyStyle(profile) {
  if ((profile.aggression ?? 0) > 0.62) return "aggressive";
  if ((profile.caution ?? 0) > 0.6) return "patient";
  if ((profile.bluff ?? 0) > 0.14) return "bluffer";
  return "balanced";
}

function innerMonologueZh(style, action, tension, memory, table) {
  const seen = (memory.handsSeen ?? 0) > 0;
  const final = table.handNumber === table.totalHands;
  const base = {
    aggressive: ["他想抢节奏，我要顶回去。", "这注不一定真，我压他呼吸。"],
    patient: ["他越急，我越要等。", "他的下注线有重复。"],
    bluffer: ["他可能也在演，我不能先露怯。", "烟雾够厚，正好借一借。"],
    balanced: ["先看他这次是不是同一套。", "底池还小，信息更值钱。"],
  }[style];
  if (action === "fold") return ["他退得快，可能怕后街。", "这次缩了，下次压早一点。"];
  if (action === "all-in") return ["全压太响，真牌未必多。", "他把退路也押上了。"];
  if (final) return ["最后一手，不能给他免费走。", "这一手会留下名声。"];
  if (seen && tension > 68) return ["他记得我，我也记得他。", "老毛病又露出来了。"];
  return base;
}

function dialogueZh(style, action, tension, memory, table) {
  const lines = {
    aggressive: ["跟得上吗？", "别眨眼。", "你敢再加？"],
    patient: ["慢慢来。", "牌会说话。", "我不急。"],
    bluffer: ["别信太早。", "你猜。", "烟还没散。"],
    balanced: ["我在看你。", "这手有意思。", "继续。"],
  }[style];
  if (action === "fold") return ["怕了？", "这手记下。"];
  if (action === "raise") return ["又加？", "你在演吗？"];
  if (action === "all-in") return ["真敢啊。", "最后别眨眼。"];
  if (tension > 76) return ["账还没完。", "别急着笑。"];
  if ((memory.playerBluffWins ?? 0) > 0 && table.handNumber > 1) return ["又来这套？"];
  return lines;
}

function tellZh(style, tension) {
  if (tension > 72) return ["拇指压住筹码边。", "眼神停在底池上。", "喉结轻动了一下。"];
  if (style === "patient") return ["筹码码得很齐。", "他数了两遍底池。"];
  if (style === "aggressive") return ["他把筹码推近灯下。", "嘴角抬得太快。"];
  return ["指节轻敲桌面。", "烟灰悬在半空。"];
}

function innerMonologueEn(style, action, tension, memory, table) {
  const base = {
    aggressive: ["They want rhythm. I take it back.", "That line may be smoke."],
    patient: ["The faster they move, the more I wait.", "Their sizing repeats."],
    bluffer: ["They may be acting too.", "Smoke is useful tonight."],
    balanced: ["Same pattern, maybe.", "Information beats haste."],
  }[style];
  if (action === "fold") return ["They released too fast.", "Press earlier next time."];
  if (action === "all-in") return ["Too loud to trust.", "They bet the exit too."];
  if (table.handNumber === table.totalHands) return ["Last hand leaves a name.", "No free exit now."];
  if ((memory.handsSeen ?? 0) > 0 && tension > 68) return ["I remember this habit.", "Old pattern again."];
  return base;
}

function dialogueEn(style, action, tension, memory, table) {
  const lines = {
    aggressive: ["Keep up?", "Don't blink.", "Raise again?"],
    patient: ["Slowly.", "Cards speak.", "No rush."],
    bluffer: ["Trust it?", "Guess.", "Still smoky."],
    balanced: ["I see you.", "Interesting.", "Go on."],
  }[style];
  if (action === "fold") return ["Scared?", "Noted."];
  if (action === "raise") return ["Again?", "Acting?"];
  if (action === "all-in") return ["Brave.", "Don't blink."];
  if (tension > 76) return ["Not over.", "Don't smile yet."];
  if ((memory.playerBluffWins ?? 0) > 0 && table.handNumber > 1) return ["Again?"];
  return lines;
}

function tellEn(style, tension) {
  if (tension > 72) return ["Thumb pins a chip.", "Eyes stay on the pot.", "Throat moves once."];
  if (style === "patient") return ["Chips line up neatly.", "He counts twice."];
  if (style === "aggressive") return ["Chips move into the lamp.", "The grin comes too fast."];
  return ["Fingers tap the felt.", "Ash hangs in the air."];
}

function pickLine(lines, table, participant, salt) {
  const index = Math.abs(hashString(`${table.seed}|${table.handNumber}|${table.turnCounter}|${participant.id}|${salt}`)) % lines.length;
  return lines[index];
}

function cardCode(card) {
  if (!card) return "";
  const rank = card.rank <= 10 ? `${card.rank}` : { 11: "J", 12: "Q", 13: "K", 14: "A" }[card.rank];
  return `${rank}${card.suit}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// hashString moved to utils.js
