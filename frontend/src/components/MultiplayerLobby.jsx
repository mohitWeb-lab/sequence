import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { socket } from "../socket.js";

function MiniBoard() {
  return (
    <div
      className="grid gap-[5px] rounded-xl p-2.5 mb-5"
      style={{ gridTemplateColumns: "repeat(5, 1fr)", background: "#1B2740" }}
    >
      {Array.from({ length: 25 }, (_, i) => (
        <div
          key={i}
          className="aspect-square rounded-[5px] flex items-center justify-center"
          style={{ background: "rgba(201,154,74,0.12)", border: "1px solid rgba(201,154,74,0.18)" }}
        >
          {i === 12 && (
            <div
              className="w-[52%] h-[52%] rounded-full"
              style={{ background: "#D4A24C", boxShadow: "0 0 8px rgba(212,162,76,.8)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function WaitingModal({ code, players, onCancel }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(8,12,22,0.82)] backdrop-blur-md flex items-center justify-center p-5 z-50">
      <div
        className="rounded-[20px] p-[36px_32px] w-full max-w-[440px] shadow-2xl flex flex-col items-center text-center border"
        style={{
          background: "linear-gradient(160deg, #243352, #101728)",
          borderColor: "rgba(201,154,74,0.22)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[26px] mb-5 font-bold"
          style={{ background: "rgba(201,154,74,0.15)", color: "#C99A4A", border: "1px solid rgba(201,154,74,0.3)" }}
        >
          ✓
        </div>

        <h2 className="font-display font-black text-2xl text-ivory mb-1.5">Room Created!</h2>
        <p className="text-muted text-[14px] leading-relaxed mb-6">
          Share this code with your friends so they can join.
        </p>

        <div
          className="w-full rounded-[14px] p-5 mb-5 border"
          style={{ background: "rgba(201,154,74,0.06)", borderColor: "rgba(201,154,74,0.22)" }}
        >
          <div
            className="rounded-[10px] py-3.5 px-5 font-black text-[36px] tracking-[0.2em] mb-3 text-brass"
            style={{ fontFamily: '"Courier New", monospace', background: "rgba(201,154,74,0.1)", border: "1px solid rgba(201,154,74,0.3)" }}
          >
            {code}
          </div>
          <button
            onClick={copy}
            className="px-6 py-2 rounded-lg font-bold text-[13px] cursor-pointer border tracking-[.04em] transition-colors"
            style={{
              background: copied ? "rgba(79,185,138,0.15)" : "rgba(201,154,74,0.12)",
              color: copied ? "#4FB98A" : "#C99A4A",
              borderColor: copied ? "rgba(79,185,138,0.4)" : "rgba(201,154,74,0.35)",
            }}
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
        </div>

        <div className="w-full mb-5 text-left">
          <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-2">Players joined</div>
          {players.map((p) => (
            <div key={p.seatIdx} className="flex items-center gap-2 py-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#4FB98A", boxShadow: "0 0 6px #4FB98A" }}
              />
              <span className="text-ivory text-[14px]">{p.name}</span>
              {p.seatIdx === 0 && (
                <span className="text-muted text-[11px] ml-auto">(you, host)</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-muted text-[13px] mb-6">
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ background: "#4FB98A", boxShadow: "0 0 8px #4FB98A", animation: "pulse 1.4s ease-in-out infinite" }}
          />
          Waiting for players to join…
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-[10px] border text-muted text-[14px] cursor-pointer"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const MODE_INFO = {
  duel:     { label: "Duel",     players: "2 players",       desc: "1v1 — first to link 2 runs of five wins." },
  triangle: { label: "Triangle", players: "3 players",       desc: "3-way free-for-all — first to link 1 run wins." },
  pairs:    { label: "Pairs",    players: "4 players (2v2)", desc: "Teammates share a chip colour. First team to link 2 runs wins." },
};

function CreateRoomModal({ name, onNameChange, onClose, onCreate }) {
  const [playStyle, setPlayStyle] = useState("individual"); // "individual" | "team"
  const [indivPlayers, setIndivPlayers] = useState(2);      // 2 | 3

  const modeKey = playStyle === "team" ? "pairs" : indivPlayers === 2 ? "duel" : "triangle";
  const info = MODE_INFO[modeKey];

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Enter your name before creating a room."); return; }
    onCreate(modeKey);
  };

  return (
    <div className="fixed inset-0 bg-[rgba(8,12,22,0.85)] backdrop-blur-md flex items-center justify-center p-5 z-50">
      <div
        className="rounded-[20px] p-[36px_32px] w-full max-w-[480px] shadow-2xl border"
        style={{ background: "linear-gradient(160deg, #243352, #101728)", borderColor: "rgba(201,154,74,0.22)" }}
      >
        <h2 className="font-display font-black text-2xl text-ivory mb-1">Create Game Room</h2>
        <p className="text-muted text-[13.5px] mb-7">Set up a new game and invite friends with a code.</p>

        {/* Editable name */}
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-1.5">Your Name</div>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name…"
            maxLength={24}
            className="w-full rounded-[10px] px-4 py-2.5 text-ivory font-semibold text-[14px] border outline-none box-border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(201,154,74,0.2)", caretColor: "#C99A4A" }}
          />
        </div>

        {/* Game Mode toggle */}
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-2">Game Mode</div>
          <div
            className="flex rounded-[10px] p-[3px] gap-1"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,154,74,0.15)" }}
          >
            {[["individual", "Individual Play"], ["team", "Team Play"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPlayStyle(val)}
                className="flex-1 py-2 rounded-[8px] text-[13.5px] font-semibold cursor-pointer border-none transition-all"
                style={{
                  background: playStyle === val ? "rgba(201,154,74,0.18)" : "transparent",
                  color: playStyle === val ? "#C99A4A" : "#7E8CA6",
                  outline: playStyle === val ? "1px solid rgba(201,154,74,0.35)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Individual: player count */}
        {playStyle === "individual" && (
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-2">Number of Players</div>
            <div className="flex gap-3">
              {[2, 3].map((n) => (
                <label key={n} className="flex items-center gap-2 cursor-pointer">
                  <span
                    onClick={() => setIndivPlayers(n)}
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer"
                    style={{ borderColor: indivPlayers === n ? "#C99A4A" : "rgba(255,255,255,0.25)" }}
                  >
                    {indivPlayers === n && (
                      <span className="w-2 h-2 rounded-full" style={{ background: "#C99A4A" }} />
                    )}
                  </span>
                  <span
                    className="text-[13.5px] cursor-pointer"
                    style={{ color: indivPlayers === n ? "#F2EDE3" : "#7E8CA6" }}
                    onClick={() => setIndivPlayers(n)}
                  >
                    {n} Players
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Team Play: fixed at pairs (4 players, 2 teams) */}
        {playStyle === "team" && (
          <div className="mb-5">
            <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-2">Teams</div>
            <div
              className="rounded-[10px] p-3 flex items-center gap-2 border"
              style={{ background: "rgba(201,154,74,0.06)", borderColor: "rgba(201,154,74,0.2)" }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#C99A4A" }} />
              <span className="text-ivory text-[13.5px]">2 Teams of 2 — 4 players total</span>
            </div>
          </div>
        )}

        {/* Mode summary */}
        <div
          className="rounded-[10px] p-3.5 mb-6 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brass text-[12px] font-bold uppercase tracking-[.1em]">{info.label}</span>
            <span className="text-muted text-[12px]">·</span>
            <span className="text-muted text-[12px]">{info.players}</span>
          </div>
          <div className="text-[12.5px] text-muted leading-relaxed">{info.desc}</div>
        </div>

        {/* Actions */}
        <button
          onClick={handleCreate}
          className="w-full py-3.5 rounded-[10px] bg-brass text-[#191203] font-bold text-[15px] cursor-pointer border-none mb-2.5"
        >
          Create Room
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-[10px] text-muted text-[14px] cursor-pointer border-none"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function MultiplayerLobby() {
  const navigate = useNavigate();

  const [name, setName] = useState(() => localStorage.getItem("mp_name") || "");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Created room waiting state
  const [waitingRoom, setWaitingRoom] = useState(null); // { code, players[] }

  // Refs so event handlers always see current values
  const pendingRef = useRef(null); // { code, seatIdx }
  const initialStateRef = useRef(null);
  const nameRef = useRef(name);
  useEffect(() => { nameRef.current = name; }, [name]);

  useEffect(() => {
    function onUpdate(gs) {
      gs.locked = new Set(gs.locked);
      initialStateRef.current = gs;
    }
    function onPlayerJoined({ name: pName, seatIdx }) {
      setWaitingRoom((prev) =>
        prev ? { ...prev, players: [...prev.players.filter((p) => p.seatIdx !== seatIdx), { name: pName, seatIdx }] } : prev
      );
      toast.success(`${pName} joined the room!`);
    }
    function onGameStarted() {
      if (!pendingRef.current) return;
      const { code, seatIdx } = pendingRef.current;
      navigate(`/play/${code}`, {
        state: { seatIdx, name: nameRef.current.trim(), initialState: initialStateRef.current },
      });
    }

    socket.on("game_updated", onUpdate);
    socket.on("player_joined", onPlayerJoined);
    socket.on("game_started", onGameStarted);
    return () => {
      socket.off("game_updated", onUpdate);
      socket.off("player_joined", onPlayerJoined);
      socket.off("game_started", onGameStarted);
    };
  }, [navigate]);

  const saveName = (v) => {
    setName(v);
    nameRef.current = v;
    localStorage.setItem("mp_name", v);
  };

  const openCreate = () => setShowCreateModal(true);

  const handleCreate = (modeKey) => {
    const n = name.trim();
    setShowCreateModal(false);
    setLoading(true);
    socket.connect();
    socket.emit("create_room", { name: n, modeKey }, (res) => {
      setLoading(false);
      if (res?.error) {
        toast.error(res.error);
        socket.disconnect();
        return;
      }
      toast.success("Room created! Share the code with friends.");
      pendingRef.current = { code: res.code, seatIdx: res.seatIdx };
      setWaitingRoom({ code: res.code, players: [{ name: n, seatIdx: 0 }] });
    });
  };

  const handleJoin = () => {
    const n = name.trim();
    const t = joinCode.trim().toUpperCase();
    if (!n) { toast.error("Enter your name before joining."); return; }
    if (t.length < 4) { toast.error("Enter a valid room code."); return; }
    setLoading(true);
    socket.connect();
    socket.emit("join_room", { code: t, name: n }, (res) => {
      setLoading(false);
      if (res?.error) {
        toast.error(res.error);
        socket.disconnect();
        return;
      }
      pendingRef.current = { code: t, seatIdx: res.seatIdx };
      if (res.reconnected || res.status === "playing") {
        navigate(`/play/${t}`, {
          state: { seatIdx: res.seatIdx, name: n, initialState: initialStateRef.current },
        });
      }
      // Otherwise wait for game_started event
    });
  };

  const handleCancel = () => {
    socket.disconnect();
    pendingRef.current = null;
    initialStateRef.current = null;
    setWaitingRoom(null);
  };

  return (
    <div className="app-bg min-h-screen w-full font-ui relative overflow-x-hidden">
      <div className="app-grain fixed inset-0 pointer-events-none opacity-50" aria-hidden="true" />

      {showCreateModal && (
        <CreateRoomModal
          name={name}
          onNameChange={saveName}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {waitingRoom && (
        <WaitingModal
          code={waitingRoom.code}
          players={waitingRoom.players}
          onCancel={handleCancel}
        />
      )}

      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-12">
        <div className="text-[11px] tracking-[0.26em] uppercase text-brass font-semibold mb-3">
          Chips · Cards · Five in a row
        </div>
        <h1 className="font-display font-black text-center text-ivory mb-2.5" style={{ fontSize: "clamp(32px, 6vw, 56px)" }}>
          Ready to Play <span className="text-brass">FIVE</span>?
        </h1>
        <p className="text-muted text-[15px] text-center leading-relaxed mb-6 max-w-[460px]">
          Choose how you'd like to start your game
        </p>

        {/* cards row */}
        <div className="flex gap-4 w-full max-w-[860px] flex-wrap items-stretch">

          {/* Create card */}
          <div
            className="flex-1 basis-[340px] rounded-[18px] p-7 flex flex-col border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(201,154,74,0.22)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] self-center mb-4 font-light"
              style={{ background: "rgba(201,154,74,0.12)", color: "#C99A4A", border: "1px solid rgba(201,154,74,0.25)" }}
            >
              +
            </div>
            <h2 className="font-display font-black text-[22px] text-ivory text-center mb-1.5">
              Create New Game
            </h2>
            <p className="text-muted text-[13.5px] text-center leading-relaxed mb-5">
              Start a new game room and invite friends to join
            </p>

            <MiniBoard />

            <div className="flex flex-col gap-2.5 flex-1">
              {[
                ["👥", "Duel, Triangle or Pairs mode"],
                ["●", "Individual or team play", "#C99A4A"],
                ["●", "Game starts when room fills", "#C99A4A"],
              ].map(([icon, text, col]) => (
                <div key={text} className="flex items-center gap-2.5 text-[13.5px] text-ivory-dim">
                  {col
                    ? <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                    : <span>{icon}</span>
                  }
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={openCreate}
              disabled={loading}
              className="mt-5 w-full py-3.5 rounded-[10px] bg-brass text-[#191203] font-bold text-[15px] cursor-pointer border-none tracking-[.03em] disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Game Room"}
            </button>
          </div>

          {/* Join card */}
          <div
            className="flex-1 basis-[340px] rounded-[18px] p-7 flex flex-col border"
            style={{
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(201,154,74,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[22px] self-center mb-4"
              style={{ background: "rgba(201,154,74,0.08)", border: "1px solid rgba(201,154,74,0.2)" }}
            >
              🔍
            </div>
            <h2 className="font-display font-black text-[22px] text-ivory text-center mb-1.5">
              Join Existing Game
            </h2>
            <p className="text-muted text-[13.5px] text-center leading-relaxed mb-5">
              Enter a room code to join a friend's game
            </p>

            <div
              className="rounded-[14px] p-5 mb-5 border flex flex-col gap-3"
              style={{ background: "rgba(201,154,74,0.05)", borderColor: "rgba(201,154,74,0.18)" }}
            >
              {/* Name */}
              <div>
                <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-1.5">Your Name</div>
                <input
                  value={name}
                  onChange={(e) => saveName(e.target.value)}
                  placeholder="Enter your name…"
                  maxLength={24}
                  className="w-full rounded-lg px-3 py-2.5 text-ivory font-semibold text-[14px] border outline-none box-border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(201,154,74,0.25)", caretColor: "#C99A4A" }}
                />
              </div>

              {/* Code */}
              <div className="text-center">
                <div className="text-[11px] uppercase tracking-[.12em] text-muted mb-1.5">Room Code</div>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="ABC123"
                  maxLength={8}
                  spellCheck={false}
                  className="w-full text-center font-black text-[28px] tracking-[0.18em] rounded-lg py-3 px-4 border outline-none uppercase box-border"
                  style={{
                    fontFamily: '"Courier New", monospace',
                    background: "rgba(201,154,74,0.12)",
                    color: "#C99A4A",
                    borderColor: "rgba(201,154,74,0.35)",
                    caretColor: "#C99A4A",
                  }}
                />
                <div className="text-brass text-[12px] font-medium mt-1.5 opacity-70">
                  Enter the code shared by your friend
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
              {[
                "Quick join with room code",
                "Join ongoing or waiting games",
                "Play with friends instantly",
              ].map((text) => (
                <div key={text} className="flex items-center gap-2.5 text-[13.5px] text-ivory-dim">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#C99A4A", opacity: 0.7 }} />
                  {text}
                </div>
              ))}
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="mt-5 w-full py-3.5 rounded-[10px] font-bold text-[15px] cursor-pointer border tracking-[.03em] transition-colors disabled:opacity-50"
              style={{
                background: "rgba(201,154,74,0.12)",
                color: "#C99A4A",
                borderColor: "rgba(201,154,74,0.35)",
              }}
            >
              {loading ? "Joining…" : "Join Game Room"}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-9 px-6 py-2.5 rounded-full border text-muted text-[13px] cursor-pointer tracking-[.04em] ghost"
          style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
