import { useState, useMemo } from "react";
import { MODES } from "../game/engine.js";
import { TEAMS } from "../theme.js";

const RULES = [
  ["Jacks of ♦ and ♣", "wild — take any empty square"],
  ["Jacks of ♥ and ♠", "lift one enemy chip off the board"],
  ["Four corners", "free squares, they count for everyone"],
  ["Dead card", "both squares taken? tap it to swap"],
];

/* Deterministic pseudo-random number from a seed */
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >> 17)) >>> 0;
    s = (s ^ (s << 5))  >>> 0;
    return s / 0xffffffff;
  };
}

const CHIP_COLORS = TEAMS.map((t) => t.chip);

function FloatingChips() {
  const chips = useMemo(() => {
    const rand = seededRand(0x5e4d3c);
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left:    `${4 + rand() * 92}%`,
      bottom:  `-${14 + rand() * 10}%`,
      size:    18 + rand() * 26,
      dur:     `${18 + rand() * 18}s`,
      delay:   `-${rand() * 20}s`,
      color:   CHIP_COLORS[Math.floor(rand() * CHIP_COLORS.length)],
      opacity: 0.08 + rand() * 0.10,
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {chips.map((c) => (
        <span
          key={c.id}
          className="float-chip absolute rounded-full"
          style={{
            left: c.left,
            bottom: c.bottom,
            width: c.size,
            height: c.size,
            background: c.color,
            "--dur": c.dur,
            "--delay": c.delay,
            "--chip-opacity": c.opacity,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function Menu({ onStart, onPlayOnline }) {
  const [hover, setHover] = useState("duel");
  const [onlineHover, setOnlineHover] = useState(false);

  const modeEntries = Object.entries(MODES);

  return (
    <div className="relative max-w-[860px] mx-auto px-5 py-14 text-center overflow-hidden">
      <FloatingChips />

      {/* eyebrow */}
      <div className="fade-up delay-0 relative text-[11px] tracking-[0.26em] uppercase text-brass font-semibold">
        Chips · Cards · Five in a row
      </div>

      {/* title */}
      <h1 className="fade-up delay-1 relative font-display font-black text-[clamp(56px,13vw,110px)] tracking-[0.06em] leading-none my-3">
        F<span className="title-shimmer">I</span>VE
      </h1>

      <p className="fade-up delay-2 relative text-muted text-[15px] leading-relaxed max-w-[460px] mx-auto">
        Play a card, claim its square. Link five chips in a line before anyone else links two.
      </p>

      {/* local mode cards */}
      <div
        className="relative grid gap-3 mt-9 text-left"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {modeEntries.map(([k, m], idx) => (
          <button
            key={k}
            className={`fade-up delay-${3 + idx} mode-card border rounded-xl p-[18px_18px_16px] cursor-pointer text-left`}
            onMouseEnter={() => setHover(k)}
            onFocus={() => setHover(k)}
            onClick={() => onStart(k)}
            style={{
              borderColor: hover === k ? "#C99A4A" : "rgba(201,154,74,0.22)",
              background:  hover === k ? "rgba(201,154,74,0.07)" : "rgba(255,255,255,0.02)",
              boxShadow:   hover === k
                ? "0 8px 32px rgba(201,154,74,0.15), 0 2px 8px rgba(0,0,0,0.4)"
                : "0 2px 8px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex gap-[5px] mb-3">
              {Array.from({ length: m.seats }).map((_, i) => (
                <span
                  key={i}
                  className="w-[11px] h-[11px] rounded-full block transition-transform duration-200"
                  style={{
                    background: TEAMS[m.teams === 2 ? i % 2 : i].chip,
                    transform: hover === k ? "scale(1.2)" : "scale(1)",
                    boxShadow: hover === k
                      ? `0 0 6px ${TEAMS[m.teams === 2 ? i % 2 : i].glow}80`
                      : "none",
                  }}
                />
              ))}
            </div>
            <div className="font-display text-2xl font-bold tracking-[.02em]">{m.label}</div>
            <div className="text-ivory-dim text-[13px] mt-0.5">{m.sub}</div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="text-muted text-[11px] tracking-[.04em] uppercase">
                {m.hand} cards · {m.target} run{m.target > 1 ? "s" : ""} to win
              </div>
              <span className="arrow-hint text-brass text-[13px] opacity-0 transition-opacity duration-200"
                style={{ opacity: hover === k ? 1 : 0 }}>
                →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* online divider */}
      <div className={`fade-up delay-${3 + modeEntries.length} relative flex items-center gap-3 my-8`}>
        <span className="flex-1 h-px bg-[rgba(201,154,74,0.22)]" />
        <span className="text-[10px] tracking-[0.22em] uppercase text-muted whitespace-nowrap">
          Online Multiplayer
        </span>
        <span className="flex-1 h-px bg-[rgba(201,154,74,0.22)]" />
      </div>

      {/* online button */}
      <button
        className={`fade-up delay-${4 + modeEntries.length} mode-card relative w-full flex items-center gap-4 p-[18px_20px] rounded-xl border cursor-pointer text-left overflow-hidden`}
        onMouseEnter={() => setOnlineHover(true)}
        onMouseLeave={() => setOnlineHover(false)}
        onFocus={() => setOnlineHover(true)}
        onBlur={() => setOnlineHover(false)}
        onClick={onPlayOnline}
        style={{
          borderColor: onlineHover ? "#3B52E8" : "rgba(59,82,232,0.3)",
          background:  onlineHover ? "rgba(59,82,232,0.1)" : "rgba(59,82,232,0.03)",
          boxShadow:   onlineHover
            ? "0 8px 32px rgba(59,82,232,0.2), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 transition-all duration-250"
          style={{
            background: onlineHover ? "rgba(59,82,232,0.22)" : "rgba(59,82,232,0.12)",
            transform: onlineHover ? "scale(1.08)" : "scale(1)",
          }}
        >
          🌐
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-[18px] font-bold tracking-[.02em]">Play Online</span>
            <span
              className="live-dot w-2 h-2 rounded-full shrink-0"
              style={{ background: "#3B52E8" }}
            />
          </div>
          <div className="text-ivory-dim text-[13px] mt-0.5">Create or join a private room with friends</div>
        </div>
        <span
          className="arrow-hint text-[rgba(59,82,232,0.8)] text-lg shrink-0"
          style={{ opacity: onlineHover ? 1 : 0.5 }}
        >
          →
        </span>
      </button>

      {/* rules strip */}
      <div
        className={`fade-up delay-${5 + modeEntries.length} relative mt-10 border-t border-[rgba(201,154,74,0.22)] pt-[22px] grid gap-4 text-left`}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
      >
        {RULES.map(([n, t]) => (
          <div key={n} className="group">
            <div className="text-[13px] font-semibold text-ivory transition-colors duration-200 group-hover:text-brass">
              {n}
            </div>
            <div className="text-[12.5px] text-muted mt-0.5 leading-relaxed">{t}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
