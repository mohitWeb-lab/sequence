import {
  newGame, applyMove, exchangeDead, passTurn,
  legalTargets, isDead, MODES,
} from "./game/engine.js";

/* ── in-memory store ──────────────────────────────────────────
   rooms: Map<code, Room>

   Room {
     code        string
     modeKey     string
     hostId      string           socket.id of creator
     players     Player[]         ordered by seatIdx
     gameState   object | null
     status      'waiting' | 'playing' | 'finished'
   }

   Player { socketId, name, seatIdx, connected }
──────────────────────────────────────────────────────────────── */
const rooms = new Map();

/* ── helpers ── */
function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Strip Sets to arrays so socket.io can JSON-serialize the state. */
export function serialize(gs) {
  if (!gs) return null;
  return { ...gs, locked: [...gs.locked] };
}

/**
 * Each player sees their own hand; all other hands are replaced
 * with arrays of nulls (same length, no card info).
 */
export function stateForSeat(gs, seatIdx) {
  const s = serialize(gs);
  s.hands = gs.hands.map((hand, i) =>
    i === seatIdx ? hand : hand.map(() => null)
  );
  return s;
}

/* ── room lifecycle ── */
export function createRoom(socketId, name, modeKey) {
  if (!MODES[modeKey]) throw new Error(`Unknown mode: ${modeKey}`);

  let code;
  do { code = genCode(); } while (rooms.has(code));

  const room = {
    code,
    modeKey,
    hostId: socketId,
    players: [{ socketId, name, seatIdx: 0, connected: true }],
    gameState: null,
    status: "waiting",
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code, socketId, name) {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found. Check the code and try again." };

  // Reconnection: same name, same room
  const existing = room.players.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() && !p.connected
  );
  if (existing) {
    existing.socketId = socketId;
    existing.connected = true;
    return { room, seatIdx: existing.seatIdx, reconnected: true };
  }

  if (room.status === "playing")
    return { error: "Game already in progress." };
  if (room.status === "finished")
    return { error: "Game has ended." };

  const maxSeats = MODES[room.modeKey].seats;
  if (room.players.length >= maxSeats)
    return { error: "Room is full." };
  if (room.players.find((p) => p.socketId === socketId))
    return { error: "Already in this room." };

  const seatIdx = room.players.length;
  room.players.push({ socketId, name, seatIdx, connected: true });

  // Auto-start when all seats filled
  if (room.players.length === maxSeats) {
    room.gameState = _startGame(room);
    room.status = "playing";
  }

  return { room, seatIdx, reconnected: false };
}

function _startGame(room) {
  const gs = newGame(room.modeKey);
  // Override auto-generated names + mark every player seat as human
  room.players.forEach((p) => {
    gs.seats[p.seatIdx].name = p.name;
    gs.seats[p.seatIdx].human = true;
  });
  return gs;
}

export function getRoom(code) {
  return rooms.get(code?.toUpperCase());
}

export function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.find((p) => p.socketId === socketId)) return room;
  }
  return null;
}

export function markDisconnected(socketId) {
  const room = getRoomBySocket(socketId);
  if (!room) return null;
  const player = room.players.find((p) => p.socketId === socketId);
  if (player) player.connected = false;
  return room;
}

export function deleteRoom(code) {
  rooms.delete(code.toUpperCase());
}

/* ── game actions (all validate before mutating) ── */
function _validateTurn(code, socketId) {
  const room = getRoom(code);
  if (!room) return { error: "Room not found." };
  if (room.status !== "playing") return { error: "Game is not active." };

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return { error: "You are not in this room." };

  const gs = room.gameState;
  if (gs.turn !== player.seatIdx) return { error: "It is not your turn." };

  return { room, player, gs };
}

export function handleMove(code, socketId, cardIdx, boardIdx) {
  const v = _validateTurn(code, socketId);
  if (v.error) return v;
  const { room, player, gs } = v;

  const card = gs.hands[player.seatIdx][cardIdx];
  if (!card) return { error: "Invalid card index." };

  const targets = legalTargets(gs, card);
  if (!targets.has(boardIdx)) return { error: "Illegal move." };

  room.gameState = applyMove(gs, cardIdx, boardIdx);
  if (room.gameState.winner != null) room.status = "finished";
  return { gameState: room.gameState, room };
}

export function handleExchangeDead(code, socketId, cardIdx) {
  const v = _validateTurn(code, socketId);
  if (v.error) return v;
  const { room, player, gs } = v;

  const card = gs.hands[player.seatIdx][cardIdx];
  if (!card) return { error: "Invalid card index." };
  if (!isDead(card, gs.chips)) return { error: "Card is not dead." };

  room.gameState = exchangeDead(gs, cardIdx);
  return { gameState: room.gameState, room };
}

export function handlePassTurn(code, socketId) {
  const v = _validateTurn(code, socketId);
  if (v.error) return v;
  const { room, gs } = v;

  room.gameState = passTurn(gs);
  if (room.gameState.winner != null) room.status = "finished";
  return { gameState: room.gameState, room };
}
