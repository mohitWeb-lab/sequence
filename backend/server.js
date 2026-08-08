import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  createRoom, joinRoom, getRoom, markDisconnected, deleteRoom,
  handleMove, handleExchangeDead, handlePassTurn,
  stateForSeat, serialize,
} from "./rooms.js";

/* ── setup ── */
const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow any localhost port in development
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

/* ── REST health check ── */
app.get("/health", (_req, res) => res.json({ ok: true, rooms: 0 }));

/* ── helpers ── */

/** Broadcast the updated game state to every player in the room,
 *  each receiving only their own hand. */
function broadcastState(room) {
  for (const p of room.players) {
    io.to(p.socketId).emit("game_updated", stateForSeat(room.gameState, p.seatIdx));
  }
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

/* ── socket events ── */
io.on("connection", (socket) => {
  log("connect", socket.id);

  /* ── CREATE ROOM ───────────────────────────────────────────
     Client sends: { name, modeKey }
     Server replies (cb): { code, seatIdx } | { error }
  ──────────────────────────────────────────────────────────── */
  socket.on("create_room", ({ name, modeKey } = {}, cb) => {
    if (!name?.trim() || !modeKey) {
      return cb?.({ error: "name and modeKey are required." });
    }
    try {
      const room = createRoom(socket.id, name.trim(), modeKey);
      socket.join(room.code);
      log(`Room ${room.code} created by "${name}" (${modeKey})`);
      cb?.({ code: room.code, seatIdx: 0, modeKey });
    } catch (err) {
      cb?.({ error: err.message });
    }
  });

  /* ── JOIN ROOM ─────────────────────────────────────────────
     Client sends: { code, name }
     Server replies (cb): { seatIdx, status, playerCount, gameState? } | { error }
     Server broadcasts to room: player_joined | game_started
  ──────────────────────────────────────────────────────────── */
  socket.on("join_room", ({ code, name } = {}, cb) => {
    if (!code?.trim() || !name?.trim()) {
      return cb?.({ error: "code and name are required." });
    }
    const result = joinRoom(code.trim(), socket.id, name.trim());
    if (result.error) return cb?.({ error: result.error });

    const { room, seatIdx, reconnected } = result;
    socket.join(room.code);

    if (reconnected) {
      log(`"${name}" reconnected to room ${room.code} (seat ${seatIdx})`);
      cb?.({ seatIdx, reconnected: true, status: room.status });
      // Send current state to the reconnected player
      if (room.gameState) {
        socket.emit("game_updated", stateForSeat(room.gameState, seatIdx));
      }
      // Notify others
      socket.to(room.code).emit("player_reconnected", { name, seatIdx });
      return;
    }

    log(`"${name}" joined room ${room.code} as seat ${seatIdx}`);

    // Tell joiner their seat and current lobby state
    cb?.({
      seatIdx,
      reconnected: false,
      status: room.status,
      playerCount: room.players.length,
      players: room.players.map((p) => ({ name: p.name, seatIdx: p.seatIdx, connected: p.connected })),
    });

    // Notify everyone else a new player arrived
    socket.to(room.code).emit("player_joined", {
      name,
      seatIdx,
      playerCount: room.players.length,
    });

    // If the room just filled, start the game
    if (room.status === "playing") {
      log(`Game started in room ${room.code}`);
      broadcastState(room);
      io.to(room.code).emit("game_started", {
        modeKey: room.modeKey,
        players: room.players.map((p) => ({ name: p.name, seatIdx: p.seatIdx })),
      });
    }
  });

  /* ── MAKE MOVE ─────────────────────────────────────────────
     Client sends: { code, cardIdx, boardIdx }
  ──────────────────────────────────────────────────────────── */
  socket.on("make_move", ({ code, cardIdx, boardIdx } = {}) => {
    const result = handleMove(code, socket.id, cardIdx, boardIdx);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    broadcastState(result.room);
    if (result.room.status === "finished") {
      io.to(result.room.code).emit("game_over", {
        winner: result.gameState.winner,
        scores: result.gameState.scores,
      });
    }
  });

  /* ── EXCHANGE DEAD CARD ───────────────────────────────────
     Client sends: { code, cardIdx }
  ──────────────────────────────────────────────────────────── */
  socket.on("exchange_dead", ({ code, cardIdx } = {}) => {
    const result = handleExchangeDead(code, socket.id, cardIdx);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    broadcastState(result.room);
  });

  /* ── PASS TURN ─────────────────────────────────────────────
     Client sends: { code }
  ──────────────────────────────────────────────────────────── */
  socket.on("pass_turn", ({ code } = {}) => {
    const result = handlePassTurn(code, socket.id);
    if (result.error) {
      socket.emit("error", { message: result.error });
      return;
    }
    broadcastState(result.room);
  });

  /* ── GET ROOM INFO ─────────────────────────────────────────
     Client sends: { code }
     Useful for lobby polling / room preview before joining.
  ──────────────────────────────────────────────────────────── */
  socket.on("get_room", ({ code } = {}, cb) => {
    const room = getRoom(code);
    if (!room) return cb?.({ error: "Room not found." });
    cb?.({
      code: room.code,
      modeKey: room.modeKey,
      status: room.status,
      playerCount: room.players.length,
      maxPlayers: room.players.length, // replaced dynamically below
      players: room.players.map((p) => ({ name: p.name, seatIdx: p.seatIdx, connected: p.connected })),
    });
  });

  /* ── DISCONNECT ────────────────────────────────────────────
     Mark player as disconnected; they may reconnect within the
     same session. We keep the room alive so reconnection works.
  ──────────────────────────────────────────────────────────── */
  socket.on("disconnect", () => {
    const room = markDisconnected(socket.id);
    if (room) {
      log(`Socket ${socket.id} disconnected from room ${room.code}`);
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        io.to(room.code).emit("player_disconnected", {
          name: player.name,
          seatIdx: player.seatIdx,
        });
      }
      // Clean up empty rooms
      if (room.players.every((p) => !p.connected)) {
        setTimeout(() => {
          const r = getRoom(room.code);
          if (r && r.players.every((p) => !p.connected)) {
            deleteRoom(room.code);
            log(`Room ${room.code} deleted (all players gone)`);
          }
        }, 60_000); // 1 minute grace period
      }
    }
    log("disconnect", socket.id);
  });
});

httpServer.listen(PORT, () => {
  log(`five-server listening on port ${PORT}`);
  log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
