import { useState } from "react";
import { BOARD, MODES, isCutJack, isWildJack, isDead } from "../game/engine.js";
import { C, TEAMS } from "../theme.js";
import { Chip, CardFace, Cell } from "./Pieces.jsx";
import RulesModal from "./RulesModal.jsx";

export default function Table({
  g, sel, selCard, legal, occupiedSlots = new Set(), cellPx, boardRef, myTurn,
  onCell, onCard, flash, onQuit, onAgain, playerSeat,
}) {
  const [showRules, setShowRules] = useState(false);
  const mode = MODES[g.modeKey];
  const active = g.seats[g.turn];
  const over = g.winner != null;
  const myHandIdx = playerSeat ?? 0;
  const shownHand = playerSeat != null
    ? g.hands[playerSeat]
    : (active.human ? g.hands[g.turn] : g.hands[0]);

  return (
    <div className="relative max-w-[620px] mx-auto px-3 pb-7 pt-3.5">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* header */}
      <header className="flex items-center justify-between gap-2">
        <button onClick={onQuit} className="ghost text-xs text-muted cursor-pointer px-0.5 py-1.5">
          ← Table list
        </button>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-black text-xl tracking-[.12em]">FIVE</span>
          <span className="text-[10px] tracking-[.2em] uppercase text-brass">{mode.label}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRules(true)}
            className="ghost text-[11px] tracking-[.06em] uppercase text-muted cursor-pointer px-0.5 py-1.5"
          >
            Rules
          </button>
          <span className="text-[11px] text-muted tracking-[.06em]">{g.deck.length} in deck</span>
        </div>
      </header>

      {/* score row */}
      <div className="flex gap-2 my-3.5 flex-wrap">
        {Array.from({ length: mode.teams }).map((_, t) => {
          const names = g.seats.filter((s) => s.team === t).map((s) => s.name).join(" & ");
          const on = active.team === t && !over;
          return (
            <div
              key={t}
              className="flex-1 basis-[130px] flex gap-2.5 items-center border rounded-[10px] p-[9px_11px] transition-colors duration-300"
              style={{
                borderColor: on ? TEAMS[t].chip : "rgba(255,255,255,0.07)",
                background: on ? `${TEAMS[t].chip}14` : "rgba(255,255,255,0.02)",
              }}
            >
              <Chip team={t} size={16} />
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                  {names}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: mode.target }).map((_, i) => (
                    <span
                      key={i}
                      className="w-[7px] h-[7px] rounded-full border"
                      style={{
                        background: i < g.scores[t] ? TEAMS[t].chip : "transparent",
                        borderColor: i < g.scores[t] ? TEAMS[t].chip : "rgba(255,255,255,0.18)",
                      }}
                    />
                  ))}
                  <span className="text-[10px] text-muted ml-0.5 tracking-[.06em]">
                    {g.scores[t]}/{mode.target}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* board */}
      <div className="board-bg p-2 rounded-[14px]">
        <div
          ref={boardRef}
          className="relative grid gap-0.5 w-full"
          style={{ gridTemplateColumns: "repeat(10, 1fr)", aspectRatio: "1 / 1" }}
        >
          {BOARD.map((cell, i) => (
            <Cell
              key={i}
              cell={cell}
              chip={g.chips[i]}
              legal={legal.has(i)}
              occupied={occupiedSlots.has(i)}
              cut={selCard && isCutJack(selCard) && legal.has(i)}
              locked={g.locked.has(i)}
              last={g.lastPlay?.idx === i}
              px={cellPx}
              onClick={() => onCell(i)}
            />
          ))}
          <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none w-full h-full" aria-hidden="true">
            {g.runs.map((r, k) => {
              const a = r.cells[0];
              const b = r.cells[4];
              return (
                <line
                  key={k}
                  className="run-line"
                  x1={(a % 10) * 10 + 5}
                  y1={Math.floor(a / 10) * 10 + 5}
                  x2={(b % 10) * 10 + 5}
                  y2={Math.floor(b / 10) * 10 + 5}
                  stroke={TEAMS[r.team].glow}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* status */}
      <div className="min-h-[34px] flex items-center justify-center text-[13px] mt-3 text-center" role="status" aria-live="polite">
        {g.winner === -1 ? (
          <span className="text-muted">Nobody linked a run. The table is called.</span>
        ) : over ? (
          <span style={{ color: TEAMS[g.winner].glow }}>
            {g.seats.filter((s) => s.team === g.winner).map((s) => s.name).join(" & ")} win.
          </span>
        ) : flash ? (
          <span className="text-brass">{flash}</span>
        ) : myTurn ? (
          selCard ? (
            <span>
              {isCutJack(selCard)
                ? "Pick an enemy chip to lift."
                : isWildJack(selCard)
                ? "Wild — pick any empty square."
                : "Pick a highlighted square."}
            </span>
          ) : (
            <span>Your turn. Choose a card.</span>
          )
        ) : (
          <span className="text-muted">
            <span className="think" /> {active.name} is thinking…
          </span>
        )}
      </div>

      {/* hand */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 justify-center min-w-min px-1 pt-3 pb-1">
          {shownHand.map((card, i) => {
            const dead = isDead(card, g.chips);
            return (
              <button
                key={card.id}
                className="hand-card relative w-[58px] h-[84px] shrink-0 rounded-[6px] hand-card-bg cursor-pointer p-0"
                disabled={!myTurn}
                onClick={() => onCard(i)}
                style={{
                  transform: sel === i ? "translateY(-14px)" : "none",
                  boxShadow:
                    sel === i
                      ? `0 14px 28px rgba(0,0,0,.55), 0 0 0 2px ${C.brass}`
                      : "0 6px 14px rgba(0,0,0,.45)",
                  opacity: myTurn ? 1 : 0.5,
                  filter: dead ? "saturate(.35)" : "none",
                }}
              >
                <CardFace card={card} />
                {dead && (
                  <span className="absolute bottom-1 left-0 right-0 text-[8.5px] tracking-[.16em] uppercase text-[#8A6A31] font-bold text-center">
                    dead
                  </span>
                )}
                {card.rank === "J" && (
                  <span
                    className="absolute top-1 left-0 right-0 text-[8.5px] tracking-[.16em] uppercase font-bold text-center"
                    style={{ color: isWildJack(card) ? "#4FB98A" : "#D96A6A" }}
                  >
                    {isWildJack(card) ? "wild" : "lift"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* log */}
      <div className="mt-2.5 text-center">
        {g.log.slice(0, 3).map((l, i) => (
          <div key={i} className="text-[11.5px] text-muted leading-[1.7]" style={{ opacity: 1 - i * 0.32 }}>
            {l}
          </div>
        ))}
      </div>

      {/* game-over overlay */}
      {over && (
        <div className="fade-in fixed inset-0 bg-[rgba(8,12,22,0.82)] flex items-center justify-center p-5 z-20 backdrop-blur-sm">
          <div className="overlay-card-bg border border-[rgba(201,154,74,0.22)] rounded-[14px] p-[30px_28px] text-center max-w-[380px]">
            <div className="text-[11px] tracking-[0.26em] uppercase text-brass font-semibold">
              Game over
            </div>
            <h2 className="font-display font-black text-[44px] leading-none my-1.5">
              {g.winner === -1 ? "Called" : g.winner === g.seats[myHandIdx].team ? "You win" : "You lose"}
            </h2>
            <p className="text-muted text-[15px] leading-relaxed max-w-[460px] mx-auto">
              {g.winner === -1
                ? "Four hundred turns and no run of five. The board is locked up."
                : `${g.seats.filter((s) => s.team === g.winner).map((s) => s.name).join(" & ")} linked ${mode.target} run${mode.target > 1 ? "s" : ""} of five.`}
            </p>
            <div className="flex gap-2.5 mt-[18px]">
              <button
                className="flex-1 py-[11px] px-4 rounded-lg bg-brass text-[#191203] font-bold text-[13.5px] cursor-pointer"
                onClick={onAgain}
              >
                Play again
              </button>
              <button
                className="flex-1 py-[11px] px-4 rounded-lg border border-[rgba(201,154,74,0.22)] text-ivory-dim text-[13.5px] cursor-pointer"
                onClick={onQuit}
              >
                Change table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
