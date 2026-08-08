# FIVE

A chips-and-cards board game for the browser. Play a card, claim its square on a
10×10 grid of playing cards. Link five chips in a line before anyone else links two.

Built with **React 18 + Vite**. No game libraries, no CSS framework, no backend.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle -> dist/
npm test         # engine test suite (plain node, no framework)
```

Requires Node 18+.

## Tables

| Mode     | Seats | Sides | Hand | Runs to win |
|----------|-------|-------|------|-------------|
| Duel     | 2     | 2     | 7    | 2           |
| Triangle | 3     | 3     | 6    | 1           |
| Pairs    | 4     | 2     | 6    | 2           |

Seat 0 is you; the rest are bots.

## Rules implemented

- Play a card, drop a chip on either matching square. Discard, then draw.
- **Jacks of ♦ and ♣** are wild — any empty square.
- **Jacks of ♥ and ♠** lift one enemy chip, unless that chip is locked into a run.
- The four **corners** are free squares and count toward every side's runs.
- A **dead card** (both its squares taken) can be swapped for a fresh one.
- Two runs may **share at most one chip**.
- The deck reshuffles from the discard pile when it empties, so games always resolve.
- 400 turns with no run called ends the board as a draw.

## Layout

```
src/
  game/
    engine.js      cards, seeded board, rules, state transitions — pure, no React
    ai.js          bot heuristics: window scoring for building vs. denying
  components/
    Menu.jsx       table selection
    Table.jsx      board, scores, hand, log, result overlay
    Pieces.jsx     Chip, CardFace, Cell
  theme.js         design tokens + style objects
  App.jsx          state wiring, bot turn scheduling, board sizing
  main.jsx         entry
test/
  engine.test.js   board integrity, run detection, 180 simulated games
```

`engine.js` has no React import and every transition returns a fresh state
object, so the same module can run server-side unchanged if you add multiplayer.

## Design

"Midnight parlour": slate-indigo baize, ivory mini-cards set in Bodoni Moda,
enamel chips in brass / verdigris / rose. Archivo carries the UI. When a run of
five completes, a luminous line draws itself through the chips.

Responsive to phone width, visible keyboard focus, `prefers-reduced-motion` honoured.

## Notes

Rules of this genre aren't copyrightable, but "Sequence" is a registered
trademark of Jax Ltd. This project uses an original name, its own seeded board
layout, and its own artwork.

## If you want online play

`engine.js` is already the shape you'd need: pure reducers over a serialisable
state. A FastAPI + WebSocket server holding room state and calling the same
transitions would let the React client stay almost exactly as-is — swap
`setG(applyMove(...))` for `socket.send(move)` and render whatever state the
server broadcasts.
