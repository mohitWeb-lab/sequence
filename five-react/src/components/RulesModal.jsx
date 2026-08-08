import { useState } from "react";

const TABS = ["Basic Rules", "Individual Play", "Team Play"];

const CONTENT = {
  "Basic Rules": [
    {
      heading: "Objective:",
      text: "Form sequences of 5 chips in a row on the board (horizontally, vertically, or diagonally).",
    },
    {
      heading: "Setup:",
      bullets: [
        "Each player receives a hand of cards (7 cards).",
        "Players choose a color of chips to use.",
      ],
    },
    {
      heading: "Gameplay:",
      bullets: [
        "On your turn, play a card from your hand and place a chip on a corresponding space on the board.",
        "The card must match one of the cards on the board.",
        "Discard the played card and draw a new one.",
        'The four corner spaces are "FREE" spaces and can be used by any player as part of a sequence.',
      ],
    },
    {
      heading: "Special Cards:",
      bullets: [
        "Two-eyed Jacks (♦J, ♣J): Wild cards that can be placed anywhere on the board that doesn't already have a chip.",
        "One-eyed Jacks (♥J, ♠J): Anti-wild cards that can be used to remove an opponent's chip from the board.",
      ],
    },
    {
      heading: "Winning:",
      text: "The first player or team to form two sequences (two rows of 5 chips) wins!",
    },
  ],
  "Individual Play": [
    { heading: "Players:", text: "2 or 3 players compete individually — no teams." },
    {
      heading: "Hand Size:",
      bullets: ["2 players: 7 cards each.", "3 players: 6 cards each."],
    },
    {
      heading: "Sequences to Win:",
      bullets: ["2 players: first to 2 sequences wins.", "3 players: first to 1 sequence wins."],
    },
    {
      heading: "Strategy Tips:",
      bullets: [
        "Block opponents by placing chips on contested rows.",
        "Save Jacks for critical moments — a timely wild Jack can clinch a sequence.",
        "Keep track of dead cards and swap them early.",
      ],
    },
  ],
  "Team Play": [
    { heading: "Teams:", text: "4 or 6 players split into 2 teams. Partners sit across from each other." },
    {
      heading: "Hand Size:",
      bullets: ["4 players (2 per team): 6 cards each.", "6 players (3 per team): 5 cards each."],
    },
    {
      heading: "Communication:",
      bullets: [
        "Teammates may not show or discuss their cards.",
        "Coordinate by watching where your partner places chips.",
      ],
    },
    { heading: "Sequences to Win:", text: "The first team to complete 2 sequences wins." },
    {
      heading: "Team Strategy:",
      bullets: [
        "Build sequences in parallel to make blocking harder.",
        "Use cut Jacks to disrupt the opposing team's longest run.",
        "Both teammates can contribute chips to the same sequence.",
      ],
    },
  ],
};

export default function RulesModal({ onClose }) {
  const [tab, setTab] = useState("Basic Rules");
  const sections = CONTENT[tab];

  return (
    <div
      className="fixed inset-0 bg-[rgba(8,12,22,0.72)] flex items-center justify-center p-5 z-30 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[88vh] flex flex-col shadow-2xl text-[#111]">
        {/* header */}
        <div className="px-[22px] pt-[22px] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xl text-[#888] cursor-pointer leading-none p-1 bg-transparent border-none"
            aria-label="Close"
          >
            ×
          </button>
          <div className="font-bold text-xl mb-1">Sequence Rules</div>
          <div className="text-[13.5px] text-[#888] leading-relaxed mb-[18px]">
            Learn the basic, individual, and team play rules for Sequence.
          </div>

          {/* tabs */}
          <div className="flex bg-[#f0f0f0] rounded-[10px] p-[3px] gap-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 px-1 rounded-lg text-[13px] cursor-pointer transition-colors"
                style={{
                  border: tab === t ? "1px solid #d0d0d0" : "1px solid transparent",
                  background: tab === t ? "#fff" : "transparent",
                  fontWeight: tab === t ? 600 : 400,
                  color: "#111",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* scrollable content */}
        <div className="overflow-y-auto px-[22px] py-5 flex-1">
          {sections.map((sec) => (
            <div key={sec.heading} className="mb-[18px]">
              <div className="font-bold text-[14px] mb-1.5">{sec.heading}</div>
              {sec.text && (
                <p className="m-0 text-[14px] leading-relaxed text-[#222]">{sec.text}</p>
              )}
              {sec.bullets && (
                <ul className="m-0 pl-5">
                  {sec.bullets.map((b) => (
                    <li key={b} className="text-[14px] leading-relaxed text-[#222] mb-0.5">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="px-[22px] py-3.5 border-t border-[#eee] flex justify-end">
          <button
            onClick={onClose}
            className="px-7 py-2.5 rounded-lg bg-[#111] text-white font-semibold text-[14px] cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
