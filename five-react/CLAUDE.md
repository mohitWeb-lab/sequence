# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands require the nvm node binary — prefix with `PATH="/Users/mohit/.nvm/versions/node/v24.13.0/bin:$PATH"` or source nvm first.

```bash
# Frontend (five-react/)
npm run dev       # Vite dev server on :5173
npm run build     # Production build → dist/
npm run preview   # Serve the dist/ build on :4173
npm test          # Run engine unit tests (plain node, no framework)

# Backend (five-server/)
npm run dev       # node --watch server.js  (auto-restart)
npm start         # node server.js
```

To run a single engine test there is no filter flag — the test file is a single script; edit it temporarily or isolate by commenting.

## Architecture

### Two separate projects

| Directory | Purpose |
|---|---|
| `five-react/` | React + Vite frontend |
| `five-server/` | Node.js + socket.io multiplayer backend |

`five-server/game/engine.js` is a **copy** of `five-react/src/game/engine.js`. If the engine changes, both files must be updated.

### Frontend data flow

```
engine.js (pure fns)  ←  ai.js (bot heuristic)
       ↓
   App.jsx  (all game state: g, sel, flash)
       ↓              ↓
  Menu.jsx        Table.jsx
                  ├── Pieces.jsx  (Chip, CardFace, Cell)
                  └── RulesModal.jsx
  MultiplayerLobby.jsx  (own page, no game state)
```

- **`engine.js`** is pure — no React, no side effects. Every function takes a state object and returns a new one. `newGame`, `applyMove`, `exchangeDead`, `passTurn` are the main transitions. `legalTargets` computes valid board squares for a selected card.
- **`App.jsx`** owns all mutable state (`g` = game state, `sel` = selected hand index). Bot turns fire on a `setTimeout` inside a `useEffect` watching `g`. `GameApp` vs `App` split: `App` is the router root, `GameApp` holds the local-play state machine.
- **Routing** (react-router-dom): `/` → `GameApp` (menu + table), `/lobby` → `MultiplayerLobby`. Lobby is a completely separate page with its own background — it uses `useNavigate` to go back.
- **Tailwind v3** for styling. Custom colors (`brass`, `muted`, `ivory`, `baize`, `ink`) are defined in `tailwind.config.js`. Complex gradients and game-specific shadows live in `index.css` as named classes (`.app-bg`, `.board-bg`, `.cell-bg`). `theme.js` is kept only for values needed in dynamic inline styles — the `TEAMS` chip colors (radial gradients) and `C` constants.

### Game state shape

```js
{
  modeKey,          // "duel" | "triangle" | "pairs"
  seats[],          // { team, human, name }
  deck[],           // remaining cards
  discard[],
  hands[][],        // hands[seatIdx][cardIdx]
  chips[100],       // null | team index per board cell
  locked: Set,      // board indices inside a completed run
  runs[],           // { cells: number[], team }
  scores[],         // points per team
  turn,             // current seat index
  turnCount,
  lastPlay,         // { idx, cut, team } for animation
  winner,           // null=live, -1=called, else team index
  log[],
}
```

`locked` is a `Set` in memory. When serializing over socket.io (backend → frontend), it is converted to an array (`[...gs.locked]`); the frontend must reconstruct it with `new Set(gs.locked)`.

### Backend socket events

**Client → Server** (emit): `create_room`, `join_room`, `make_move`, `exchange_dead`, `pass_turn`, `get_room`

**Server → Client** (listen): `game_started`, `game_updated`, `game_over`, `player_joined`, `player_disconnected`, `player_reconnected`, `error`

All game actions are validated server-side against `legalTargets` / `isDead`. Each player receives only their own hand — other seats' hands arrive as `null` entries (`stateForSeat` in `rooms.js`).

### Modes

Defined entirely in `engine.js → MODES`:
- `duel` — 2 seats, 2 teams, 7-card hands, 2 runs to win
- `triangle` — 3 seats, 3 teams, 6-card hands, 1 run to win  
- `pairs` — 4 seats, 2 teams alternating, 6-card hands, 2 runs to win

`makeSeats` currently marks only seat 0 as `human`; the backend overrides this to set all player seats as `human: true`.

### Board

The 10×10 board layout is **seeded** (mulberry32 with seed `20260808`) so it is identical every game. Four corners (indices 0, 9, 90, 99) are free squares. Jacks are not printed on the board. `CARD_SLOTS` maps a card key (`"AS"`, `"10H"`, …) to its two board cell indices.
