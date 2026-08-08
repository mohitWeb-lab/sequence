import { useState } from "react";
import { MODES } from "../game/engine.js";
import { TEAMS } from "../theme.js";

const RULES = [
  ["Jacks of ♦ and ♣", "wild — take any empty square"],
  ["Jacks of ♥ and ♠", "lift one enemy chip off the board"],
  ["Four corners", "free squares, they count for everyone"],
  ["Dead card", "both squares taken? tap it to swap"],
];

export default function Menu({ onStart, onPlayOnline }) {
  const [hover, setHover] = useState("duel");

  return (
    <div className="fade-up relative max-w-[860px] mx-auto px-5 py-14 text-center">
      <div className="text-[11px] tracking-[0.26em] uppercase text-brass font-semibold">
        Chips · Cards · Five in a row
      </div>

      <h1 className="font-display font-black text-[clamp(56px,13vw,110px)] tracking-[0.06em] leading-none my-3">
        F<span className="text-brass">I</span>VE
      </h1>

      <p className="text-muted text-[15px] leading-relaxed max-w-[460px] mx-auto">
        Play a card, claim its square. Link five chips in a line before anyone else links two.
      </p>

      {/* local modes */}
      <div
        className="grid gap-3 mt-9 text-left"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {Object.entries(MODES).map(([k, m]) => (
          <button
            key={k}
            className="mode-card border rounded-xl p-[18px_18px_16px] cursor-pointer text-left"
            onMouseEnter={() => setHover(k)}
            onFocus={() => setHover(k)}
            onClick={() => onStart(k)}
            style={{
              borderColor: hover === k ? "#C99A4A" : "rgba(201,154,74,0.22)",
              background: hover === k ? "rgba(201,154,74,0.07)" : "rgba(255,255,255,0.02)",
            }}
          >
            <div className="flex gap-[5px] mb-3">
              {Array.from({ length: m.seats }).map((_, i) => (
                <span
                  key={i}
                  className="w-[11px] h-[11px] rounded-full block"
                  style={{ background: TEAMS[m.teams === 2 ? i % 2 : i].chip }}
                />
              ))}
            </div>
            <div className="font-display text-2xl font-bold tracking-[.02em]">{m.label}</div>
            <div className="text-ivory-dim text-[13px] mt-0.5">{m.sub}</div>
            <div className="text-muted text-[11px] mt-2.5 tracking-[.04em] uppercase">
              {m.hand} cards in hand · {m.target} run{m.target > 1 ? "s" : ""} to win
            </div>
          </button>
        ))}
      </div>

      {/* online multiplayer divider */}
      <div className="flex items-center gap-3 my-8">
        <span className="flex-1 h-px bg-[rgba(201,154,74,0.22)]" />
        <span className="text-[10px] tracking-[0.22em] uppercase text-muted whitespace-nowrap">
          Online Multiplayer
        </span>
        <span className="flex-1 h-px bg-[rgba(201,154,74,0.22)]" />
      </div>

      <button
        className="mode-card w-full flex items-center gap-4 p-[18px_20px] rounded-xl border cursor-pointer text-left"
        onMouseEnter={() => setHover("online")}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover("online")}
        onClick={onPlayOnline}
        style={{
          borderColor: hover === "online" ? "#3B52E8" : "rgba(59,82,232,0.3)",
          background: hover === "online" ? "rgba(59,82,232,0.08)" : "rgba(59,82,232,0.03)",
        }}
      >
        <div className="w-11 h-11 rounded-full bg-[rgba(59,82,232,0.15)] flex items-center justify-center text-xl shrink-0">
          🌐
        </div>
        <div className="flex-1 text-left">
          <div className="font-display text-[18px] font-bold tracking-[.02em]">Play Online</div>
          <div className="text-ivory-dim text-[13px] mt-0.5">Create or join a private room with friends</div>
        </div>
        <div className="text-[rgba(59,82,232,0.7)] text-lg shrink-0">→</div>
      </button>

      {/* rules strip */}
      <div
        className="mt-10 border-t border-[rgba(201,154,74,0.22)] pt-[22px] grid gap-4 text-left"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {RULES.map(([n, t]) => (
          <div key={n}>
            <div className="text-[13px] font-semibold text-ivory">{n}</div>
            <div className="text-[12.5px] text-muted mt-0.5 leading-relaxed">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
