/* ============================================================
   FIVE — game engine
   Pure functions. No React, no DOM. Fully unit-testable.
   ============================================================ */

/* ---------- cards ---------- */
export const SUITS = ["S", "H", "D", "C"];
export const SUIT_GLYPH = { S: "\u2660", H: "\u2665", D: "\u2666", C: "\u2663" };
export const SUIT_RED = { S: false, H: true, D: true, C: false };

const ALL_RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

export const key = (rank, suit) => `${rank}${suit}`;
export const isWildJack = (c) => c.rank === "J" && (c.suit === "D" || c.suit === "C");
export const isCutJack = (c) => c.rank === "J" && (c.suit === "H" || c.suit === "S");

export const CORNERS = new Set([0, 9, 90, 99]);

/* ---------- board ---------- */
/* The standard printed Sequence board layout — identical on every physical set. */
const BOARD_LAYOUT = [
  "F", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "F",
  "6C", "5C", "4C", "3C", "2C", "AH", "KH", "QH", "10H", "10S",
  "7C", "AS", "2D", "3D", "4D", "5D", "6D", "7D", "9H", "QS",
  "8C", "KS", "6C", "5C", "4C", "3C", "2C", "8D", "8H", "KS",
  "9C", "QS", "7C", "6H", "5H", "4H", "AH", "9D", "7H", "AS",
  "10C", "10S", "8C", "7H", "2H", "3H", "KH", "10D", "6H", "2D",
  "QC", "9S", "9C", "8H", "9H", "10H", "QH", "QD", "5H", "3D",
  "KC", "8S", "10C", "QC", "KC", "AC", "AD", "KD", "4H", "4D",
  "AC", "7S", "6S", "5S", "4S", "3S", "2S", "2H", "3H", "5D",
  "F", "AD", "KD", "QD", "10D", "9D", "8D", "7D", "6D", "F",
];

export const BOARD = BOARD_LAYOUT.map((cell) => {
  if (cell === "F") return { corner: true };
  const suit = cell.slice(-1);
  const rank = cell.slice(0, -1);
  return { rank, suit };
});

/** card key -> the two board indices holding it */
export const CARD_SLOTS = (() => {
  const m = new Map();
  BOARD.forEach((cell, i) => {
    if (cell.corner) return;
    const k = key(cell.rank, cell.suit);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  });
  return m;
})();

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildDeck() {
  const d = [];
  let id = 0;
  for (let copy = 0; copy < 2; copy++)
    for (const s of SUITS) for (const r of ALL_RANKS) d.push({ rank: r, suit: s, id: id++ });
  return shuffle(d);
}

/* ---------- tables ---------- */
export const MODES = {
  duel: { label: "Duel", sub: "You vs. one opponent", seats: 2, teams: 2, hand: 7, target: 2 },
  triangle: { label: "Triangle", sub: "Three-way free-for-all", seats: 3, teams: 3, hand: 6, target: 1 },
  pairs: { label: "Pairs", sub: "Two against two, alternating", seats: 4, teams: 2, hand: 6, target: 2 },
};

export const TURN_CAP = 400;

/* ---------- run detection ---------- */
export const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Every new run of five through `idx`. A cell already locked into an earlier
 * run may be reused by at most one new run — the shared-chip rule.
 */
export function findRuns(chips, locked, idx, team) {
  const r0 = Math.floor(idx / 10);
  const c0 = idx % 10;
  const candidates = [];

  for (const [dr, dc] of DIRS) {
    for (let off = -4; off <= 0; off++) {
      const cells = [];
      let ok = true;
      for (let k = 0; k < 5; k++) {
        const r = r0 + dr * (off + k);
        const c = c0 + dc * (off + k);
        if (r < 0 || r > 9 || c < 0 || c > 9) { ok = false; break; }
        const i = r * 10 + c;
        if (!(CORNERS.has(i) || chips[i] === team)) { ok = false; break; }
        cells.push(i);
      }
      if (ok) candidates.push(cells);
    }
  }

  const taken = new Set(locked);
  const accepted = [];
  for (const cells of candidates) {
    if (cells.filter((i) => taken.has(i)).length > 1) continue;
    if (cells.every((i) => taken.has(i))) continue;
    accepted.push(cells);
    cells.forEach((i) => { if (!CORNERS.has(i)) taken.add(i); });
  }
  return accepted;
}

/* ---------- setup ---------- */
export function makeSeats(modeKey) {
  const m = MODES[modeKey];
  const names =
    modeKey === "pairs" ? ["You", "Bot A", "Partner", "Bot B"] : ["You", "Bot 1", "Bot 2", "Bot 3"];
  return Array.from({ length: m.seats }, (_, i) => ({
    team: m.teams === 2 ? i % 2 : i,
    human: i === 0,
    name: names[i],
  }));
}

export function newGame(modeKey) {
  const m = MODES[modeKey];
  const seats = makeSeats(modeKey);
  const deck = buildDeck();
  const hands = seats.map(() => deck.splice(0, m.hand));
  return {
    modeKey,
    seats,
    deck,
    discard: [],
    hands,
    chips: new Array(100).fill(null),
    locked: new Set(),
    runs: [],
    scores: new Array(m.teams).fill(0),
    turn: 0,
    turnCount: 0,
    lastPlay: null,
    winner: null, // null = live, -1 = called, else team index
    log: [],
  };
}

/* ---------- state transitions ---------- */
function clone(s) {
  return {
    ...s,
    chips: [...s.chips],
    hands: s.hands.map((h) => [...h]),
    deck: [...s.deck],
    discard: [...s.discard],
    locked: new Set(s.locked),
    runs: [...s.runs],
    scores: [...s.scores],
    log: [...s.log],
  };
}

function drawInto(s, seatIdx) {
  if (!s.deck.length && s.discard.length) {
    s.deck = shuffle(s.discard);
    s.discard = [];
  }
  if (s.deck.length) s.hands[seatIdx].push(s.deck.shift());
}

/** A non-Jack whose two board squares are both taken. */
export function isDead(card, chips) {
  if (card.rank === "J") return false;
  return (CARD_SLOTS.get(key(card.rank, card.suit)) || []).every((i) => chips[i] != null);
}

/** Squares this card may legally target right now. */
export function legalTargets(state, card) {
  const team = state.seats[state.turn].team;
  const out = new Set();
  if (isCutJack(card)) {
    for (let i = 0; i < 100; i++)
      if (!CORNERS.has(i) && state.chips[i] != null && state.chips[i] !== team && !state.locked.has(i))
        out.add(i);
    return out;
  }
  if (isWildJack(card)) {
    for (let i = 0; i < 100; i++) if (!CORNERS.has(i) && state.chips[i] == null) out.add(i);
    return out;
  }
  for (const i of CARD_SLOTS.get(key(card.rank, card.suit)) || [])
    if (state.chips[i] == null) out.add(i);
  return out;
}

export function applyMove(state, cardIdx, boardIdx) {
  const s = clone(state);
  const seat = s.seats[s.turn];
  const card = s.hands[s.turn][cardIdx];
  const cut = isCutJack(card);

  if (cut) {
    s.chips[boardIdx] = null;
    s.log.unshift(`${seat.name} lifted a chip with ${card.rank}${SUIT_GLYPH[card.suit]}`);
  } else {
    s.chips[boardIdx] = seat.team;
    const runs = findRuns(s.chips, s.locked, boardIdx, seat.team);
    for (const cells of runs) {
      s.runs.push({ cells, team: seat.team });
      cells.forEach((i) => { if (!CORNERS.has(i)) s.locked.add(i); });
      s.scores[seat.team] += 1;
    }
    s.log.unshift(
      runs.length
        ? `${seat.name} completed a run of five`
        : `${seat.name} played ${card.rank}${SUIT_GLYPH[card.suit]}`
    );
  }

  s.hands[s.turn].splice(cardIdx, 1);
  s.discard.push(card);
  drawInto(s, s.turn);
  s.lastPlay = { idx: boardIdx, cut, team: seat.team };
  s.turnCount += 1;
  s.log = s.log.slice(0, 6);

  if (s.scores[seat.team] >= MODES[s.modeKey].target) s.winner = seat.team;
  else if (s.turnCount > TURN_CAP) s.winner = -1;
  else s.turn = (s.turn + 1) % s.seats.length;

  return s;
}

export function exchangeDead(state, cardIdx) {
  const s = clone(state);
  s.discard.push(s.hands[s.turn][cardIdx]);
  s.hands[s.turn].splice(cardIdx, 1);
  drawInto(s, s.turn);
  s.log.unshift(`${s.seats[s.turn].name} swapped a dead card`);
  s.log = s.log.slice(0, 6);
  return s;
}

export function passTurn(state) {
  const s = clone(state);
  s.turnCount += 1;
  if (s.turnCount > TURN_CAP) s.winner = -1;
  else s.turn = (s.turn + 1) % s.seats.length;
  return s;
}
