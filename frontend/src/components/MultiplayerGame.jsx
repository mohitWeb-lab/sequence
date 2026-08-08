import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { legalTargets, isDead, CARD_SLOTS, key } from "../game/engine.js";
import { socket } from "../socket.js";
import Table from "./Table.jsx";

function hydrateState(gs) {
  gs.locked = new Set(gs.locked);
  return gs;
}

export default function MultiplayerGame() {
  const { code } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const seatIdx = state?.seatIdx ?? 0;

  const [g, setG] = useState(() => state?.initialState ?? null);
  const [sel, setSel] = useState(null);
  const [flash, setFlash] = useState(null);
  const [cellPx, setCellPx] = useState(46);
  const boardRef = useRef(null);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCellPx(e.contentRect.width / 10));
    ro.observe(el);
    return () => ro.disconnect();
  }, [g]);

  useEffect(() => {
    function onUpdate(gs) { setG(hydrateState(gs)); }
    function onDisconnected({ name }) {
      setFlash(`${name} disconnected.`);
      setTimeout(() => setFlash(null), 3000);
    }
    function onReconnected({ name }) {
      setFlash(`${name} reconnected.`);
      setTimeout(() => setFlash(null), 2000);
    }

    socket.on("game_updated", onUpdate);
    socket.on("player_disconnected", onDisconnected);
    socket.on("player_reconnected", onReconnected);
    return () => {
      socket.off("game_updated", onUpdate);
      socket.off("player_disconnected", onDisconnected);
      socket.off("player_reconnected", onReconnected);
    };
  }, []);

  useEffect(() => setSel(null), [g?.turn]);

  const myTurn = !!g && g.winner == null && g.turn === seatIdx;
  const selCard = myTurn && sel != null ? g.hands[seatIdx][sel] : null;
  const legal = useMemo(
    () => (g && selCard ? legalTargets(g, selCard) : new Set()),
    [g, selCard]
  );

  const occupiedSlots = useMemo(() => {
    if (!g || !selCard || selCard.rank === "J") return new Set();
    const slots = CARD_SLOTS.get(key(selCard.rank, selCard.suit)) || [];
    return new Set(slots.filter((i) => g.chips[i] != null));
  }, [g, selCard]);

  const onCell = (i) => {
    if (!myTurn || sel == null || !legal.has(i)) return;
    socket.emit("make_move", { code, cardIdx: sel, boardIdx: i });
    setSel(null);
  };

  const onCard = (i) => {
    if (!myTurn) return;
    if (isDead(g.hands[seatIdx][i], g.chips)) {
      socket.emit("exchange_dead", { code, cardIdx: i });
      setSel(null);
      setFlash("Dead card swapped.");
      setTimeout(() => setFlash(null), 1800);
      return;
    }
    setSel((s) => (s === i ? null : i));
  };

  const onQuit = () => {
    socket.disconnect();
    navigate("/");
  };

  if (!g) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center text-ivory font-ui">
        <div className="text-center">
          <div className="text-muted text-sm mb-2">Connecting to game…</div>
          <div className="text-brass text-xs tracking-widest uppercase">{code}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen w-full text-ivory font-ui relative overflow-x-hidden">
      <div className="app-grain fixed inset-0 pointer-events-none opacity-50" aria-hidden="true" />
      <Table
        g={g}
        sel={sel}
        selCard={selCard}
        legal={legal}
        occupiedSlots={occupiedSlots}
        cellPx={cellPx}
        boardRef={boardRef}
        myTurn={myTurn}
        onCell={onCell}
        onCard={onCard}
        flash={flash}
        playerSeat={seatIdx}
        onQuit={onQuit}
        onAgain={onQuit}
      />
    </div>
  );
}
