/* Run with: npm test  (plain node, no test framework needed) */
import assert from "node:assert/strict";
import {
  BOARD, CORNERS, CARD_SLOTS, MODES, newGame, applyMove, exchangeDead,
  passTurn, findRuns, isDead, legalTargets, isCutJack, key,
} from "../src/game/engine.js";
import { chooseMove } from "../src/game/ai.js";

let pass = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log("  ok  " + name); }
  catch (e) { console.error("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; }
};

console.log("\nboard");
t("100 squares, 4 free corners", () => {
  assert.equal(BOARD.length, 100);
  assert.equal(BOARD.filter((c) => c.corner).length, 4);
});
t("48 distinct cards, each printed exactly twice", () => {
  const n = {};
  BOARD.forEach((c) => { if (!c.corner) n[key(c.rank, c.suit)] = (n[key(c.rank, c.suit)] || 0) + 1; });
  assert.equal(Object.keys(n).length, 48);
  assert.ok(Object.values(n).every((v) => v === 2));
});
t("no Jacks printed on the board", () => {
  assert.ok(BOARD.every((c) => c.corner || c.rank !== "J"));
});

console.log("\nruns");
t("five in a row is detected", () => {
  const chips = new Array(100).fill(null);
  [22, 23, 24, 25, 26].forEach((i) => (chips[i] = 0));
  assert.equal(findRuns(chips, new Set(), 26, 0).length, 1);
});
t("four in a row is not", () => {
  const chips = new Array(100).fill(null);
  [22, 23, 24, 25].forEach((i) => (chips[i] = 0));
  assert.equal(findRuns(chips, new Set(), 25, 0).length, 0);
});
t("a free corner counts toward a run", () => {
  const chips = new Array(100).fill(null);
  [1, 2, 3, 4].forEach((i) => (chips[i] = 1)); // squares 0..4, 0 is a corner
  assert.ok(CORNERS.has(0));
  assert.equal(findRuns(chips, new Set(), 4, 1).length, 1);
});
t("two runs may share at most one chip", () => {
  const chips = new Array(100).fill(null);
  [20, 21, 22, 23, 24].forEach((i) => (chips[i] = 0));
  const locked = new Set([20, 21, 22, 23, 24]);
  [25, 26, 27].forEach((i) => (chips[i] = 0));
  // 21..25 overlaps the locked run by four chips -> rejected
  assert.equal(findRuns(chips, locked, 25, 0).length, 0);
  chips[28] = 0;
  // 24..28 overlaps by exactly one -> allowed
  assert.equal(findRuns(chips, locked, 28, 0).length, 1);
});

console.log("\nhand");
t("a card with both squares covered is dead", () => {
  const chips = new Array(100).fill(null);
  const [a, b] = CARD_SLOTS.get(key(BOARD[11].rank, BOARD[11].suit));
  const card = { rank: BOARD[11].rank, suit: BOARD[11].suit, id: 0 };
  assert.equal(isDead(card, chips), false);
  chips[a] = 0; chips[b] = 1;
  assert.equal(isDead(card, chips), true);
});
t("a wild Jack targets every empty square, never a corner", () => {
  const g = newGame("duel");
  const targets = legalTargets(g, { rank: "J", suit: "D", id: 0 });
  assert.equal(targets.size, 96);
  assert.ok([...CORNERS].every((i) => !targets.has(i)));
});
t("a lift Jack cannot touch a chip locked in a run", () => {
  let g = newGame("duel");
  g.chips[45] = 1;
  assert.ok(legalTargets(g, { rank: "J", suit: "H", id: 0 }).has(45));
  g.locked.add(45);
  assert.ok(!legalTargets(g, { rank: "J", suit: "H", id: 0 }).has(45));
});

console.log("\nimmutability");
t("applyMove returns new state and leaves the old one alone", () => {
  const a = newGame("duel");
  const card = a.hands[0].find((c) => c.rank !== "J");
  const idx = [...legalTargets(a, card)][0];
  const b = applyMove(a, a.hands[0].indexOf(card), idx);
  assert.notEqual(a, b);
  assert.equal(a.chips[idx], null);
  assert.equal(b.chips[idx], 0);
  assert.equal(a.hands[0].length, MODES.duel.hand);
});

console.log("\nfull games");
for (const modeKey of Object.keys(MODES)) {
  t(`${modeKey} — 60 bot games all terminate`, () => {
    const results = [];
    for (let n = 0; n < 60; n++) {
      let s = newGame(modeKey);
      let guard = 0;
      while (s.winner == null && guard++ < 5000) {
        const mv = chooseMove(s);
        if (mv) { s = applyMove(s, mv.ci, mv.idx); continue; }
        const dead = s.hands[s.turn].findIndex((c) => isDead(c, s.chips));
        s = dead >= 0 ? exchangeDead(s, dead) : passTurn(s);
      }
      assert.ok(s.winner != null, "game did not terminate");
      assert.ok(s.chips.every((c) => c == null || c < MODES[modeKey].teams));
      results.push(s.winner);
    }
    const draws = results.filter((w) => w === -1).length;
    assert.ok(draws / results.length < 0.1, `too many locked boards: ${draws}/60`);
    const tally = {};
    results.forEach((w) => (tally[w] = (tally[w] || 0) + 1));
    console.log("        outcomes:", JSON.stringify(tally));
  });
}

console.log(`\n${pass} checks passed\n`);
