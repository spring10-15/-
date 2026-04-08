export const STORAGE_KEY = "blacklight-bar-progress";
export const RUN_SAVE_KEY = "blacklight-bar-current-run";

export const STARTING_VAULT = 1200;
export const STANDARD_BANKROLL = 300;
export const SEARCH_ACTIONS = 2;
export const INVENTORY_SLOTS = 6;

export const HEAT_LEVELS = {
  safe: [0, 2],
  pressured: [3, 4],
  dangerous: [5, 5],
  lockdown: [6, 99],
};

export const RUN_STRUCTURE = Object.freeze({
  targetModel: "roguelike",
  demoPathMode: "fixed-authored-path",
  demoTablePath: ["cargo-table", "mirror-hall"],
  futureTablePools: {
    opener: ["cargo-table"],
    pressure: ["mirror-hall"],
  },
  notes: [
    "The shipped game should draw run content from seeded pools.",
    "The current demo intentionally uses a fixed two-room path to validate pacing, readability, and presentation.",
  ],
});

export const TABLE_ORDER = [...RUN_STRUCTURE.demoTablePath];

export const TABLES = {
  "cargo-table": {
    id: "cargo-table",
    name: "Cargo Table",
    role: "Onboarding, first profit, first meaningful read",
    buyIn: 60,
    risk: "Low",
    heatGain: 1,
    ante: 10,
    openBet: 20,
    raiseIncrement: 20,
    hands: 3,
    unlocksAfter: null,
    opponentIds: ["dock-braggart", "ledger-clerk"],
    publicInfo: {
      buyIn: 60,
      risk: "Low",
    },
    hiddenInfo: {
      rule: "The first aggressive action of each hand costs 10 less for the acting player.",
      opponents: "Dock Braggart and Ledger Clerk",
      reward: "Positive results can yield low or mid-tier valuables. First clears strongly bias toward the Ivory Chip.",
    },
    baseRewardPool: ["old-silver-lighter", "ivory-chip", "ruby-cufflink"],
    signatureReward: "ivory-chip",
  },
  "mirror-hall": {
    id: "mirror-hall",
    name: "Mirror Hall",
    role: "Main risk-reward table for the slice",
    buyIn: 120,
    risk: "Medium-High",
    heatGain: 2,
    ante: 20,
    openBet: 40,
    raiseIncrement: 40,
    hands: 3,
    unlocksAfter: "cargo-table",
    opponentIds: ["calm-widow", "smiling-knife"],
    publicInfo: {
      buyIn: 120,
      risk: "Medium-High",
    },
    hiddenInfo: {
      rule: "You may bring at most one valuable as collateral. Winning the final hand with collateral unlocks the best reward.",
      opponents: "Calm Widow and Smiling Knife",
      reward: "Positive results grant high-tier valuables. The collateral line can pay out the Antique Commemorative Coin.",
    },
    baseRewardPool: ["gold-cased-watch", "antique-coin", "sealed-bond"],
    signatureReward: "antique-coin",
  },
};

export const OPPONENTS = {
  "dock-braggart": {
    id: "dock-braggart",
    name: "Dock Braggart",
    seatLabel: "Dock Braggart",
    intro: "Too loud for the cards he is actually holding.",
    profile: {
      aggression: 0.76,
      caution: 0.18,
      bluff: 0.24,
      finalHandSpike: 0.02,
      patternPunish: 0.0,
    },
  },
  "ledger-clerk": {
    id: "ledger-clerk",
    name: "Ledger Clerk",
    seatLabel: "Ledger Clerk",
    intro: "Counts the room twice before he risks one chip.",
    profile: {
      aggression: 0.28,
      caution: 0.74,
      bluff: 0.05,
      finalHandSpike: 0.0,
      patternPunish: 0.0,
    },
  },
  "calm-widow": {
    id: "calm-widow",
    name: "Calm Widow",
    seatLabel: "Calm Widow",
    intro: "Patient, precise, and excellent at noticing repetition.",
    profile: {
      aggression: 0.48,
      caution: 0.62,
      bluff: 0.08,
      finalHandSpike: 0.12,
      patternPunish: 0.18,
    },
  },
  "smiling-knife": {
    id: "smiling-knife",
    name: "Smiling Knife",
    seatLabel: "Smiling Knife",
    intro: "Coasts early, then leans on the table when the pot matters.",
    profile: {
      aggression: 0.5,
      caution: 0.42,
      bluff: 0.12,
      finalHandSpike: 0.24,
      patternPunish: 0.06,
    },
  },
};

export const ITEM_DEFS = {
  "marked-lens": {
    id: "marked-lens",
    name: "Marked Lens",
    kind: "usable",
    phase: "table",
    buy: 40,
    sell: 20,
    slots: 1,
    heat: 1,
    description: "Peek one unrevealed community card once per table.",
  },
  "signal-lighter": {
    id: "signal-lighter",
    name: "Signal Lighter",
    kind: "usable",
    phase: "table",
    buy: 35,
    sell: 15,
    slots: 1,
    heat: 0,
    description: "Read one opponent's current hand pressure as weak, medium, or strong.",
  },
  "steadying-drink": {
    id: "steadying-drink",
    name: "Steadying Drink",
    kind: "usable",
    phase: "search",
    buy: 30,
    sell: 10,
    slots: 1,
    heat: 0,
    description: "Reduce heat by 1 in the search phase.",
  },
  "disposable-phone": {
    id: "disposable-phone",
    name: "Disposable Phone",
    kind: "usable",
    phase: "search",
    buy: 50,
    sell: 20,
    slots: 1,
    heat: 0,
    description: "Reveal every hidden layer of one table or refresh the fixed route offer.",
  },
  "false-bottom-wallet": {
    id: "false-bottom-wallet",
    name: "False-Bottom Wallet",
    kind: "usable",
    phase: "passive",
    buy: 70,
    sell: 30,
    slots: 1,
    heat: 0,
    description: "On run failure, preserve the first 80 cash.",
  },
  "sleeve-clip": {
    id: "sleeve-clip",
    name: "Sleeve Clip",
    kind: "usable",
    phase: "table",
    buy: 80,
    sell: 30,
    slots: 1,
    heat: 2,
    description: "Replace one hole card before the first betting decision of a hand.",
  },
  "old-silver-lighter": {
    id: "old-silver-lighter",
    name: "Old Silver Lighter",
    kind: "valuable",
    value: 45,
    slots: 1,
    collateral: true,
    description: "A low-tier trophy that still moves well in the back room.",
  },
  "ivory-chip": {
    id: "ivory-chip",
    name: "Ivory Chip",
    kind: "valuable",
    value: 60,
    slots: 1,
    collateral: true,
    description: "The cargo floor's favorite marker. Modest value, sharp symbolism.",
  },
  "ruby-cufflink": {
    id: "ruby-cufflink",
    name: "Ruby Cufflink",
    kind: "valuable",
    value: 90,
    slots: 1,
    collateral: true,
    description: "A neat mid-tier pawn piece that still feels painful to lose.",
  },
  "gold-cased-watch": {
    id: "gold-cased-watch",
    name: "Gold-Cased Watch",
    kind: "valuable",
    value: 120,
    slots: 1,
    collateral: true,
    description: "A stable high-value carry with no special trigger attached.",
  },
  "antique-coin": {
    id: "antique-coin",
    name: "Antique Commemorative Coin",
    kind: "valuable",
    value: 140,
    slots: 1,
    collateral: true,
    description: "Mirror Hall's signature take-home reward.",
  },
  "sealed-bond": {
    id: "sealed-bond",
    name: "Sealed Bond",
    kind: "valuable",
    value: 180,
    slots: 2,
    collateral: true,
    description: "A bulky paper prize that pays well if you can carry it out.",
  },
};

export const SEARCH_SHOPS = {
  1: ["marked-lens", "steadying-drink", "disposable-phone"],
  2: ["signal-lighter", "false-bottom-wallet", "steadying-drink", "sleeve-clip"],
  3: ["signal-lighter", "steadying-drink", "sleeve-clip"],
};

export const FIXED_ROUTE_POOL = [
  {
    id: "kitchen-backlift",
    name: "Kitchen Backlift",
    reserveCost: 50,
    finalCost: 10,
    maxHeat: 4,
    flavor: "A flour-dusted runner opens the service gate for one clean exit.",
  },
  {
    id: "linen-cart",
    name: "Linen Cart",
    reserveCost: 50,
    finalCost: 10,
    maxHeat: 4,
    flavor: "You leave under folded cloth, if the hallway still belongs to the staff.",
  },
];

export function getItemDef(itemId) {
  return ITEM_DEFS[itemId];
}

export function getOpponentDef(opponentId) {
  return OPPONENTS[opponentId];
}

export function getTableDef(tableId) {
  return TABLES[tableId];
}

export function getShopStock(searchIndex) {
  return SEARCH_SHOPS[searchIndex] ?? SEARCH_SHOPS[3];
}

export function getHeatBand(heat) {
  if (heat >= HEAT_LEVELS.lockdown[0]) {
    return "Lockdown";
  }
  if (heat >= HEAT_LEVELS.dangerous[0]) {
    return "Dangerous";
  }
  if (heat >= HEAT_LEVELS.pressured[0]) {
    return "Pressured";
  }
  return "Safe";
}
