import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

function RoomCreatedModal({ code, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-[rgba(8,12,22,0.82)] backdrop-blur-md flex items-center justify-center p-5 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-[20px] p-[36px_32px] w-full max-w-[440px] shadow-2xl flex flex-col items-center text-center border"
        style={{
          background: "linear-gradient(160deg, #243352, #101728)",
          borderColor: "rgba(201,154,74,0.22)",
        }}
      >
        {/* brass circle */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[26px] mb-5 font-bold"
          style={{ background: "rgba(201,154,74,0.15)", color: "#C99A4A", border: "1px solid rgba(201,154,74,0.3)" }}
        >
          ✓
        </div>

        <h2 className="font-display font-black text-2xl text-ivory mb-1.5">Room Created!</h2>
        <p className="text-muted text-[14px] leading-relaxed mb-6">
          Share this code with your friends so they can join your game.
        </p>

        {/* code block */}
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

        {/* waiting */}
        <div className="flex items-center gap-2 text-muted text-[13px] mb-6">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "#4FB98A", boxShadow: "0 0 8px #4FB98A", animation: "pulse 1.4s ease-in-out infinite" }}
          />
          Waiting for players to join…
        </div>

        {/* info chips */}
        <div className="flex gap-2.5 w-full mb-6">
          {[["Players", "2 – 4"], ["Mode", "Classic"], ["Runs", "2 to win"]].map(([label, val]) => (
            <div
              key={label}
              className="flex-1 rounded-[10px] py-2.5 px-2 text-center border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(201,154,74,0.18)" }}
            >
              <div className="text-[10px] uppercase tracking-[.12em] text-muted mb-1">{label}</div>
              <div className="text-[14px] font-bold text-ivory">{val}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-[10px] bg-brass text-[#191203] font-bold text-[14px] cursor-pointer border-none"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function MultiplayerLobby() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [roomCode, setRoomCode] = useState(null);

  const handleCreate = () => setRoomCode(randomCode());

  const handleJoin = () => {
    const t = joinCode.trim().toUpperCase();
    if (t.length < 4) { setJoinError("Please enter a valid room code."); return; }
    setJoinError("");
    alert(`Joining room ${t}… (multiplayer backend coming soon)`);
  };

  return (
    <div className="app-bg min-h-screen w-full font-ui relative overflow-x-hidden">
      <div className="app-grain fixed inset-0 pointer-events-none opacity-50" aria-hidden="true" />

      {roomCode && <RoomCreatedModal code={roomCode} onClose={() => setRoomCode(null)} />}

      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-12">
        {/* heading */}
        <div className="text-[11px] tracking-[0.26em] uppercase text-brass font-semibold mb-3">
          Chips · Cards · Five in a row
        </div>
        <h1 className="font-display font-black text-center text-ivory mb-2.5" style={{ fontSize: "clamp(32px, 6vw, 56px)" }}>
          Ready to Play <span className="text-brass">FIVE</span>?
        </h1>
        <p className="text-muted text-[15px] text-center leading-relaxed mb-10 max-w-[460px]">
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
                ["👥", "Support for 2–12 players"],
                ["●", "Individual and team play modes", "#C99A4A"],
                ["●", "Custom game settings", "#C99A4A"],
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
              onClick={handleCreate}
              className="mt-5 w-full py-3.5 rounded-[10px] bg-brass text-[#191203] font-bold text-[15px] cursor-pointer border-none tracking-[.03em]"
            >
              Create Game Room
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
              Enter a room code to join a game with friends
            </p>

            {/* code input block */}
            <div
              className="rounded-[14px] p-5 text-center mb-5 border"
              style={{ background: "rgba(201,154,74,0.05)", borderColor: "rgba(201,154,74,0.18)" }}
            >
              <input
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(""); }}
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
              <div className="text-brass text-[12.5px] font-medium mt-2 opacity-70">
                Enter room code like this
              </div>
              {joinError && <div className="text-[#e06060] text-[12px] mt-1">{joinError}</div>}
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
              className="mt-5 w-full py-3.5 rounded-[10px] font-bold text-[15px] cursor-pointer border tracking-[.03em] transition-colors"
              style={{
                background: "rgba(201,154,74,0.12)",
                color: "#C99A4A",
                borderColor: "rgba(201,154,74,0.35)",
              }}
            >
              Join Game Room
            </button>
          </div>
        </div>

        {/* back */}
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
