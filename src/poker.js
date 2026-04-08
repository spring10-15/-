const SUITS = ["S", "H", "D", "C"];
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const HAND_NAMES = [
  "High Card",
  "Pair",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush",
];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function shuffleDeck(deck, rng) {
  const copy = deck.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function drawCard(deck) {
  return deck.pop();
}

export function cardCode(card) {
  return `${rankLabel(card.rank)}${card.suit}`;
}

export function rankLabel(rank) {
  if (rank <= 10) {
    return String(rank);
  }
  return {
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  }[rank];
}

export function suitLabel(suit) {
  return {
    S: "Spades",
    H: "Hearts",
    D: "Diamonds",
    C: "Clubs",
  }[suit];
}

export function describeCards(cards) {
  return cards.map(cardCode).join(" ");
}

export function evaluateBestHand(cards) {
  if (cards.length < 5) {
    return {
      rank: -1,
      values: [],
      name: "Incomplete",
      cards: cards.slice(),
    };
  }

  let best = null;
  for (const combo of combinations(cards, 5)) {
    const hand = evaluateFive(combo);
    if (!best || compareHands(hand, best) > 0) {
      best = hand;
    }
  }
  return best;
}

export function compareHands(a, b) {
  if (a.rank !== b.rank) {
    return a.rank - b.rank;
  }
  const length = Math.max(a.values.length, b.values.length);
  for (let i = 0; i < length; i += 1) {
    const left = a.values[i] ?? 0;
    const right = b.values[i] ?? 0;
    if (left !== right) {
      return left - right;
    }
  }
  return 0;
}

function evaluateFive(cards) {
  const ranks = cards.map((card) => card.rank).sort((a, b) => b - a);
  const suit = cards[0].suit;
  const isFlush = cards.every((card) => card.suit === suit);
  const straightHigh = findStraightHigh(ranks);
  const counts = countRanks(ranks);
  const groups = Array.from(counts.entries())
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count;
      }
      return b.rank - a.rank;
    });

  if (isFlush && straightHigh) {
    return makeHand(8, [straightHigh], cards);
  }

  if (groups[0].count === 4) {
    const kicker = groups.find((group) => group.count === 1).rank;
    return makeHand(7, [groups[0].rank, kicker], cards);
  }

  if (groups[0].count === 3 && groups[1].count === 2) {
    return makeHand(6, [groups[0].rank, groups[1].rank], cards);
  }

  if (isFlush) {
    return makeHand(5, ranks, cards);
  }

  if (straightHigh) {
    return makeHand(4, [straightHigh], cards);
  }

  if (groups[0].count === 3) {
    const kickers = groups
      .filter((group) => group.count === 1)
      .map((group) => group.rank)
      .sort((a, b) => b - a);
    return makeHand(3, [groups[0].rank, ...kickers], cards);
  }

  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairRanks = groups
      .filter((group) => group.count === 2)
      .map((group) => group.rank)
      .sort((a, b) => b - a);
    const kicker = groups.find((group) => group.count === 1).rank;
    return makeHand(2, [...pairRanks, kicker], cards);
  }

  if (groups[0].count === 2) {
    const kickers = groups
      .filter((group) => group.count === 1)
      .map((group) => group.rank)
      .sort((a, b) => b - a);
    return makeHand(1, [groups[0].rank, ...kickers], cards);
  }

  return makeHand(0, ranks, cards);
}

function makeHand(rank, values, cards) {
  return {
    rank,
    values,
    name: HAND_NAMES[rank],
    cards: cards
      .slice()
      .sort((a, b) => b.rank - a.rank)
      .map((card) => ({ ...card })),
  };
}

function findStraightHigh(ranks) {
  const unique = Array.from(new Set(ranks)).sort((a, b) => b - a);
  if (unique.includes(14)) {
    unique.push(1);
  }
  let run = 1;
  for (let i = 0; i < unique.length - 1; i += 1) {
    if (unique[i] - 1 === unique[i + 1]) {
      run += 1;
      if (run >= 5) {
        return unique[i - 3];
      }
    } else {
      run = 1;
    }
  }
  return null;
}

function countRanks(ranks) {
  const counts = new Map();
  for (const rank of ranks) {
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }
  return counts;
}

function* combinations(values, pick, start = 0, prefix = []) {
  if (prefix.length === pick) {
    yield prefix.slice();
    return;
  }
  for (let i = start; i < values.length; i += 1) {
    prefix.push(values[i]);
    yield* combinations(values, pick, i + 1, prefix);
    prefix.pop();
  }
}

export function estimateWinOdds({
  holeCards,
  boardCards,
  deadCards = [],
  opponentCount,
  seed,
  trials = 90,
}) {
  const knownCards = [...holeCards, ...boardCards, ...deadCards];
  const winScore = { wins: 0, ties: 0 };
  const baseDeck = createDeck().filter(
    (card) => !knownCards.some((known) => known.rank === card.rank && known.suit === card.suit),
  );

  for (let trial = 0; trial < trials; trial += 1) {
    const rng = makeDeterministicRng(seed + trial * 31 + opponentCount * 17);
    const deck = shuffleDeck(baseDeck, rng);
    const trialBoard = boardCards.slice();
    while (trialBoard.length < 5) {
      trialBoard.push(drawCard(deck));
    }

    const playerHand = evaluateBestHand([...holeCards, ...trialBoard]);
    let result = 1;
    for (let i = 0; i < opponentCount; i += 1) {
      const oppCards = [drawCard(deck), drawCard(deck)];
      const oppHand = evaluateBestHand([...oppCards, ...trialBoard]);
      const comparison = compareHands(playerHand, oppHand);
      if (comparison < 0) {
        result = 0;
        break;
      }
      if (comparison === 0) {
        result = Math.min(result, 0.5);
      }
    }

    if (result === 1) {
      winScore.wins += 1;
    } else if (result === 0.5) {
      winScore.ties += 1;
    }
  }

  return (winScore.wins + winScore.ties * 0.5) / trials;
}

export function makeDeterministicRng(seed) {
  let value = (seed >>> 0) + 0x6d2b79f5;
  return function next() {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
