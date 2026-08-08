import { SUIT_GLYPH, SUIT_RED } from "../game/engine.js";
import { C, TEAMS } from "../theme.js";

export function Chip({ team, size = 20, locked }) {
  const t = TEAMS[team];
  return (
    <span
      style={{
        display: "block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 32% 28%, ${t.glow} 0%, ${t.chip} 46%, ${t.chipDark} 100%)`,
        boxShadow: locked
          ? `0 1px 2px rgba(0,0,0,.5), 0 0 ${size * 0.5}px ${t.glow}88, inset 0 0 0 ${Math.max(1, size * 0.09)}px rgba(255,255,255,.55)`
          : `0 1px 3px rgba(0,0,0,.5), inset 0 -${size * 0.1}px ${size * 0.14}px rgba(0,0,0,.28), inset 0 ${size * 0.07}px ${size * 0.1}px rgba(255,255,255,.35)`,
      }}
    />
  );
}

export function CardFace({ card }) {
  const col = SUIT_RED[card.suit] ? "#B4323F" : "#1E2A38";
  return (
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-px">
      <span style={{ fontFamily: '"Bodoni Moda", Didot, Georgia, serif', fontWeight: 700, fontSize: 26, lineHeight: 1, color: col }}>
        {card.rank}
      </span>
      <span style={{ fontFamily: '"Bodoni Moda", Didot, Georgia, serif', fontSize: 20, lineHeight: 1, color: col }}>
        {SUIT_GLYPH[card.suit]}
      </span>
    </span>
  );
}

export function Cell({ cell, chip, legal, cut, locked, last, px, onClick }) {
  const rankSize = Math.max(8, px * 0.3);
  const suitSize = Math.max(11, px * 0.42);

  if (cell.corner) {
    return (
      <div className="cell-corner-bg relative rounded-[3px] flex items-center justify-center aspect-square" aria-label="Free corner">
        <span style={{ fontSize: suitSize, color: C.brass, lineHeight: 1 }}>✦</span>
      </div>
    );
  }

  const red = SUIT_RED[cell.suit];
  return (
    <button
      onClick={onClick}
      className={`cell cell-bg relative rounded-[3px] flex items-center justify-center aspect-square p-0${legal ? " legal" : ""}`}
      style={{
        cursor: legal ? "pointer" : "default",
        outline: legal ? `2px solid ${cut ? "#D96A6A" : C.brass}` : "none",
        outlineOffset: -2,
      }}
      aria-label={`${cell.rank} of ${cell.suit}`}
    >
      <span
        className="absolute top-[1px] left-[3px]"
        style={{
          fontFamily: '"Bodoni Moda", Didot, Georgia, serif',
          fontWeight: 700,
          lineHeight: 1,
          fontSize: rankSize,
          color: red ? "#A8323F" : "#22303F",
        }}
      >
        {cell.rank}
      </span>
      <span
        className="opacity-90 mt-[12%]"
        style={{
          fontFamily: '"Bodoni Moda", Didot, Georgia, serif',
          lineHeight: 1,
          fontSize: suitSize,
          color: red ? "#C0414E" : "#2C3B4D",
        }}
      >
        {SUIT_GLYPH[cell.suit]}
      </span>
      {chip != null && (
        <span className={`${last ? "chip drop" : "chip"} absolute inset-0 flex items-center justify-center`}>
          <Chip team={chip} size={px * 0.68} locked={locked} />
        </span>
      )}
    </button>
  );
}
