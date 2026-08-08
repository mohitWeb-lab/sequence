import { CORNERS, DIRS, CARD_SLOTS, key, isWildJack, isCutJack } from "./engine.js";

/* Every 5-cell window on the board, indexed by the cells it contains. */
const WINDOWS = (() => {
  const out = [];
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 10; c++)
      for (const [dr, dc] of DIRS) {
        const cells = [];
        let ok = true;
        for (let k = 0; k < 5; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr > 9 || cc < 0 || cc > 9) { ok = false; break; }
          cells.push(rr * 10 + cc);
        }
        if (ok) out.push(cells);
      }
  return out;
})();

const WINDOWS_BY_CELL = (() => {
  const m = Array.from({ length: 100 }, () => []);
  WINDOWS.forEach((w) => w.forEach((i) => m[i].push(w)));
  return m;
})();

/* Value of the n-th chip toward a run, building vs. denying. */
const BUILD = [0, 2, 6, 18, 90, 900];
const BLOCK = [0, 1, 4, 14, 70, 0];

/**
 * How much is this square worth to `team`? Sums over every 5-window through
 * it: windows still winnable by us score for building, windows a single
 * opponent is filling score for denial. Centre squares get a small nudge
 * because they sit in more windows.
 */
export function cellValue(chips, idx, team, teamCount) {
  let score = 0;

  for (const w of WINDOWS_BY_CELL[idx]) {
    let mine = 0;
    let rival = -1;
    let mineOnly = true;
    for (const i of w) {
      if (CORNERS.has(i)) { mine++; continue; }
      const t = chips[i];
      if (t == null) continue;
      if (t === team) mine++;
      else { rival = t; mineOnly = false; }
    }
    if (mineOnly) score += BUILD[Math.min(mine, 5)];

    if (rival >= 0 && w.every((i) => CORNERS.has(i) || chips[i] == null || chips[i] === rival)) {
      let cnt = 0;
      for (const i of w) if (CORNERS.has(i) || chips[i] === rival) cnt++;
      // With three sides at the table, over-blocking gridlocks the board.
      score += BLOCK[Math.min(cnt, 5)] * (teamCount > 2 ? 0.55 : 1);
    }
  }

  const r = Math.floor(idx / 10);
  const c = idx % 10;
  return score + 6 - (Math.abs(4.5 - r) + Math.abs(4.5 - c));
}

/** Best move for the seat on turn, or null if nothing is playable. */
export function chooseMove(state) {
  const { chips, hands, turn, seats, locked } = state;
  const me = seats[turn];
  const teamCount = new Set(seats.map((s) => s.team)).size;
  let best = null;

  hands[turn].forEach((card, ci) => {
    if (isCutJack(card)) {
      for (let i = 0; i < 100; i++) {
        if (CORNERS.has(i) || locked.has(i)) continue;
        if (chips[i] == null || chips[i] === me.team) continue;
        // Worth spending only on a chip that is actually doing work.
        const v = cellValue(chips, i, chips[i], teamCount) * 0.75 - 12;
        if (!best || v > best.v) best = { v, ci, idx: i };
      }
      return;
    }
    const targets = isWildJack(card)
      ? Array.from({ length: 100 }, (_, i) => i)
      : CARD_SLOTS.get(key(card.rank, card.suit)) || [];
    for (const i of targets) {
      if (CORNERS.has(i) || chips[i] != null) continue;
      let v = cellValue(chips, i, me.team, teamCount);
      if (isWildJack(card)) v -= 25; // hold wilds for when they matter
      if (!best || v > best.v) best = { v, ci, idx: i };
    }
  });

  return best;
}
