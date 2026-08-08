import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import {
  newGame, applyMove, exchangeDead, passTurn, legalTargets, isDead,
} from "./game/engine.js";
import { chooseMove } from "./game/ai.js";
import Menu from "./components/Menu.jsx";
import Table from "./components/Table.jsx";
import MultiplayerLobby from "./components/MultiplayerLobby.jsx";
import MultiplayerGame from "./components/MultiplayerGame.jsx";

const BOT_DELAY = 780;
const SAVE_KEY = "sequence_game_save";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    data.g.locked = new Set(data.g.locked);
    return data;
  } catch {
    return null;
  }
}

function persistGame(screen, modeKey, g) {
  if (screen === "table" && g) {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ screen, modeKey, g: { ...g, locked: [...g.locked] } }));
  } else {
    localStorage.removeItem(SAVE_KEY);
  }
}

function GameApp() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState(() => loadSave()?.screen ?? "menu");
  const [modeKey, setModeKey] = useState(() => loadSave()?.modeKey ?? "duel");
  const [g, setG] = useState(() => loadSave()?.g ?? null);
  const [sel, setSel] = useState(null);
  const [cellPx, setCellPx] = useState(46);
  const [flash, setFlash] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCellPx(e.contentRect.width / 10));
    ro.observe(el);
    return () => ro.disconnect();
  }, [screen]);

  useEffect(() => {
    persistGame(screen, modeKey, g);
  }, [screen, modeKey, g]);

  const start = useCallback((k) => {
    setModeKey(k);
    setG(newGame(k));
    setSel(null);
    setScreen("table");
  }, []);

  useEffect(() => {
    if (!g || g.winner != null || g.seats[g.turn].human) return;
    const t = setTimeout(() => {
      setG((cur) => {
        if (!cur || cur.winner != null || cur.seats[cur.turn].human) return cur;
        const mv = chooseMove(cur);
        if (mv) return applyMove(cur, mv.ci, mv.idx);
        const dead = cur.hands[cur.turn].findIndex((c) => isDead(c, cur.chips));
        return dead >= 0 ? exchangeDead(cur, dead) : passTurn(cur);
      });
    }, BOT_DELAY);
    return () => clearTimeout(t);
  }, [g]);

  const myTurn = !!g && g.winner == null && g.seats[g.turn].human;
  const selCard = myTurn && sel != null ? g.hands[g.turn][sel] : null;

  const legal = useMemo(
    () => (g && selCard ? legalTargets(g, selCard) : new Set()),
    [g, selCard]
  );

  const onCell = (i) => {
    if (!myTurn || sel == null || !legal.has(i)) return;
    setG((cur) => applyMove(cur, sel, i));
    setSel(null);
  };

  const onCard = (i) => {
    if (!myTurn) return;
    if (isDead(g.hands[g.turn][i], g.chips)) {
      setG((cur) => exchangeDead(cur, i));
      setSel(null);
      setFlash("Dead card swapped for a fresh one.");
      setTimeout(() => setFlash(null), 1800);
      return;
    }
    setSel((s) => (s === i ? null : i));
  };

  useEffect(() => setSel(null), [g?.turn]);

  return (
    <div className="app-bg min-h-screen w-full text-ivory font-ui relative overflow-x-hidden">
      <div className="app-grain fixed inset-0 pointer-events-none opacity-50" aria-hidden="true" />
      {screen === "menu" ? (
        <Menu onStart={start} onPlayOnline={() => navigate("/lobby")} />
      ) : (
        <Table
          g={g}
          sel={sel}
          selCard={selCard}
          legal={legal}
          cellPx={cellPx}
          boardRef={boardRef}
          myTurn={myTurn}
          onCell={onCell}
          onCard={onCard}
          flash={flash}
          onQuit={() => { localStorage.removeItem(SAVE_KEY); setScreen("menu"); }}
          onAgain={() => start(modeKey)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GameApp />} />
      <Route path="/lobby" element={<MultiplayerLobby />} />
      <Route path="/play/:code" element={<MultiplayerGame />} />
    </Routes>
  );
}
