import { useEffect, useRef, useState } from "react";
import { X, Trophy, Wifi, WifiOff, Crown } from "lucide-react";
import { fetchTop, subscribeToScores, leaderboardConfigured, type ScoreRow } from "./leaderboardApi";

const STEP_OPTIONS = [20, 10, 5, 2, 1] as const;
const MODE_LABEL: Record<number, string> = { 20: "Novizio", 10: "Praticante", 5: "Esperto", 2: "Pro", 1: "Maestro" };

interface LeaderboardProps {
  dark: boolean;
  myNick?: string;
  /** Riga appena inviata, per mostrarla subito in cima senza aspettare il fetch. */
  justSubmitted?: ScoreRow | null;
  onClose: () => void;
}

/**
 * Classifica live: carica i top punteggi e si aggiorna in tempo reale via
 * Realtime (WebSocket Supabase). Filtrabile per modalità. Ordine SEMPRE
 * decrescente per punteggio.
 */
export default function Leaderboard({ dark, myNick, justSubmitted, onClose }: LeaderboardProps) {
  const [filter, setFilter] = useState<number | "all">("all");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());

  // Carica i top quando cambia il filtro.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTop(50, filter === "all" ? undefined : filter)
      .then(data => { if (alive) { setRows(data); seenIds.current = new Set(data.map(r => r.id ?? -1)); } })
      .catch(() => { if (alive) setRows([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filter]);

  // Realtime: inserisce le nuove righe mantenendo l'ordine per punteggio.
  useEffect(() => {
    if (!leaderboardConfigured) return;
    const unsub = subscribeToScores(row => {
      if (row.id != null && seenIds.current.has(row.id)) return;
      if (row.id != null) seenIds.current.add(row.id);
      setRows(prev => {
        if (filter !== "all" && row.mode !== filter) return prev;
        const next = [...prev, row].sort((a, b) => b.score - a.score).slice(0, 50);
        return next;
      });
      setLive(true);
    });
    return unsub;
  }, [filter]);

  // Mostra subito il punteggio appena inviato (se non già presente).
  useEffect(() => {
    if (!justSubmitted) return;
    setRows(prev => {
      if (justSubmitted.id != null && prev.some(r => r.id === justSubmitted.id)) return prev;
      if (filter !== "all" && justSubmitted.mode !== filter) return prev;
      return [...prev, justSubmitted].sort((a, b) => b.score - a.score).slice(0, 50);
    });
  }, [justSubmitted, filter]);

  const fmtScore = (n: number) => n.toLocaleString("it-IT");

  return (
    <div className={`ang-lb${dark ? " dark" : ""}`} onClick={onClose}>
      <div className="ang-lb-card" onClick={e => e.stopPropagation()}>
        <header className="ang-lb-head">
          <div className="ang-lb-title">
            <Trophy size={20} /> <span>Classifica</span>
            {leaderboardConfigured ? (
              <span className={`ang-lb-live${live ? " on" : ""}`} title="Aggiornamenti in tempo reale">
                <Wifi size={12} /> live
              </span>
            ) : (
              <span className="ang-lb-live off" title="Backend non configurato: solo locale">
                <WifiOff size={12} /> locale
              </span>
            )}
          </div>
          <button className="ang-lb-x" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
        </header>

        {/* Filtro modalità */}
        <div className="ang-lb-filters">
          <button className={`ang-lb-fbtn${filter === "all" ? " act" : ""}`} onClick={() => setFilter("all")}>Tutte</button>
          {STEP_OPTIONS.map(s => (
            <button key={s} className={`ang-lb-fbtn${filter === s ? " act" : ""}`} onClick={() => setFilter(s)}>
              {MODE_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="ang-lb-list">
          {loading ? (
            <div className="ang-lb-empty">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="ang-lb-empty">Nessun punteggio ancora. Sii il primo! 🎯</div>
          ) : (
            rows.map((r, i) => {
              const mine = myNick && r.nick === myNick;
              return (
                <div key={r.id ?? `${r.nick}-${i}`} className={`ang-lb-row${mine ? " me" : ""}${i < 3 ? " top" + (i + 1) : ""}`}>
                  <span className="ang-lb-rank">
                    {i === 0 ? <Crown size={16} /> : i + 1}
                  </span>
                  <span className="ang-lb-nick">{r.nick}{mine ? " (tu)" : ""}</span>
                  <span className="ang-lb-mode">{MODE_LABEL[r.mode] ?? r.mode}</span>
                  <span className="ang-lb-score">{fmtScore(r.score)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .ang-lb {
          position: fixed; inset: 0; z-index: 260;
          background: rgba(10,30,18,0.66);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: ang-lb-fade .2s ease;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
        }
        @keyframes ang-lb-fade { from { opacity:0 } to { opacity:1 } }
        .ang-lb-card {
          width: min(96vw, 440px); max-height: min(86vh, 640px);
          display: flex; flex-direction: column;
          background: #fff; border-radius: 18px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: ang-lb-up .3s cubic-bezier(.34,1.56,.64,1);
        }
        .ang-lb.dark .ang-lb-card { background: #15231c; }
        @keyframes ang-lb-up { from { opacity:0; transform:translateY(12px) scale(.97) } to { opacity:1; transform:none } }

        .ang-lb-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 1.2rem; background:#103820; color:#fff; flex-shrink:0;
        }
        .ang-lb.dark .ang-lb-head { background:#0a1410; }
        .ang-lb-title { display:flex; align-items:center; gap:.5rem; font-size:1.1rem; font-weight:800; }
        .ang-lb-live {
          display:inline-flex; align-items:center; gap:.25rem;
          font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
          background:rgba(255,255,255,0.14); border-radius:999px; padding:.12rem .45rem;
          color:rgba(255,255,255,0.6);
        }
        .ang-lb-live.on { background:rgba(111,224,166,0.25); color:#9ff0c2; }
        .ang-lb-live.off { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); }
        .ang-lb-x {
          display:inline-flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:50%; border:none;
          background:rgba(255,255,255,0.12); color:#fff; cursor:pointer; transition:background .15s;
        }
        .ang-lb-x:hover { background:rgba(255,255,255,0.24); }

        .ang-lb-filters {
          display:flex; gap:.3rem; padding:.7rem .9rem; flex-wrap:wrap;
          border-bottom:1px solid rgba(0,0,0,0.07); flex-shrink:0;
        }
        .ang-lb.dark .ang-lb-filters { border-color:rgba(95,208,154,0.14); }
        .ang-lb-fbtn {
          border:1px solid rgba(47,125,74,0.25); background:transparent;
          color:#2F7D4A; border-radius:999px; padding:.25rem .7rem;
          font-family:inherit; font-size:.76rem; font-weight:700; cursor:pointer; transition:all .12s;
        }
        .ang-lb.dark .ang-lb-fbtn { color:#6fe0a6; border-color:rgba(95,208,154,0.28); }
        .ang-lb-fbtn:hover { background:rgba(47,125,74,0.08); }
        .ang-lb-fbtn.act { background:#2F7D4A; color:#fff; border-color:#2F7D4A; }
        .ang-lb.dark .ang-lb-fbtn.act { background:#2f9e63; border-color:#2f9e63; color:#06160e; }

        .ang-lb-list { flex:1; min-height:0; overflow-y:auto; padding:.5rem .7rem .9rem; }
        .ang-lb-empty { text-align:center; padding:2.5rem 1rem; color:#6b8070; font-weight:600; }
        .ang-lb.dark .ang-lb-empty { color:#8fc7a6; }

        .ang-lb-row {
          display:grid; grid-template-columns:34px 1fr auto auto; align-items:center; gap:.6rem;
          padding:.55rem .7rem; border-radius:10px; margin-bottom:3px;
          animation:ang-lb-rowin .25s ease;
        }
        @keyframes ang-lb-rowin { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
        .ang-lb-row:nth-child(even) { background:rgba(0,0,0,0.025); }
        .ang-lb.dark .ang-lb-row:nth-child(even) { background:rgba(255,255,255,0.025); }
        .ang-lb-row.me { background:rgba(47,125,74,0.12); box-shadow:inset 0 0 0 1.5px rgba(47,125,74,0.4); }
        .ang-lb.dark .ang-lb-row.me { background:rgba(95,208,154,0.14); box-shadow:inset 0 0 0 1.5px rgba(95,208,154,0.4); }
        .ang-lb-row.top1 { background:linear-gradient(90deg,rgba(200,164,21,0.18),transparent); }
        .ang-lb-row.top2 { background:linear-gradient(90deg,rgba(122,140,153,0.15),transparent); }
        .ang-lb-row.top3 { background:linear-gradient(90deg,rgba(160,103,74,0.15),transparent); }

        .ang-lb-rank {
          display:inline-flex; align-items:center; justify-content:center;
          font-weight:800; font-size:.9rem; color:#6b8070; font-variant-numeric:tabular-nums;
        }
        .ang-lb.dark .ang-lb-rank { color:#a4c4aa; }
        .ang-lb-row.top1 .ang-lb-rank { color:#c8a415; }
        .ang-lb-nick {
          font-weight:800; color:#17271d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .ang-lb.dark .ang-lb-nick { color:#d4e8dc; }
        .ang-lb-mode {
          font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
          color:#6b8070; background:rgba(0,0,0,0.05); padding:.12rem .4rem; border-radius:999px;
        }
        .ang-lb.dark .ang-lb-mode { color:#8fc7a6; background:rgba(255,255,255,0.06); }
        .ang-lb-score {
          font-weight:900; font-size:1rem; color:#2F7D4A; font-variant-numeric:tabular-nums;
          min-width:54px; text-align:right;
        }
        .ang-lb.dark .ang-lb-score { color:#6fe0a6; }
      `}</style>
    </div>
  );
}
