import { useEffect, useRef, useState } from "react";
import { X, Trophy, Wifi, WifiOff, Crown } from "lucide-react";
import { fetchTop, subscribeToScores, leaderboardConfigured, secondsFromScore, type ScoreRow } from "./leaderboardApi";
import { MODES, type ModeId } from "./ParoleMenu";

// Etichetta breve per ogni modalità in classifica.
const MODE_LABEL: Record<string, string> = {
  "5-normale": "Praticante",
  "5-sfida":   "Esperto",
  "6-normale": "Avanzato",
  "6-sfida":   "Maestro",
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

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
 * decrescente per punteggio: essendo score = SCORE_BASE - secondi, in cima ci
 * sono i tempi più bassi. A video mostriamo il tempo reale.
 */
export default function Leaderboard({ dark, myNick, justSubmitted, onClose }: LeaderboardProps) {
  const [filter, setFilter] = useState<ModeId | "all">("all");
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

  return (
    <div className={`par-lb${dark ? " dark" : ""}`} onClick={onClose}>
      <div className="par-lb-card" onClick={e => e.stopPropagation()}>
        <header className="par-lb-head">
          <div className="par-lb-title">
            <Trophy size={20} /> <span>Classifica</span>
            {leaderboardConfigured ? (
              <span className={`par-lb-live${live ? " on" : ""}`} title="Aggiornamenti in tempo reale">
                <Wifi size={12} /> live
              </span>
            ) : (
              <span className="par-lb-live off" title="Backend non configurato: solo locale">
                <WifiOff size={12} /> locale
              </span>
            )}
          </div>
          <button className="par-lb-x" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
        </header>

        {/* Filtro modalità */}
        <div className="par-lb-filters">
          <button className={`par-lb-fbtn${filter === "all" ? " act" : ""}`} onClick={() => setFilter("all")}>Tutte</button>
          {MODES.map(m => (
            <button key={m.id} className={`par-lb-fbtn${filter === m.id ? " act" : ""}`} onClick={() => setFilter(m.id)}>
              {MODE_LABEL[m.id]}
            </button>
          ))}
        </div>

        <div className="par-lb-list">
          {loading ? (
            <div className="par-lb-empty">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="par-lb-empty">Nessun punteggio ancora. Sii il primo! 🎯</div>
          ) : (
            rows.map((r, i) => {
              const mine = myNick && r.nick === myNick;
              return (
                <div key={r.id ?? `${r.nick}-${i}`} className={`par-lb-row${mine ? " me" : ""}${i < 3 ? " top" + (i + 1) : ""}`}>
                  <span className="par-lb-rank">
                    {i === 0 ? <Crown size={16} /> : i + 1}
                  </span>
                  <span className="par-lb-nick">{r.nick}{mine ? " (tu)" : ""}</span>
                  <span className="par-lb-mode">{MODE_LABEL[r.mode] ?? r.mode}</span>
                  <span className="par-lb-strike" title="Miglior streak">🔥 {r.best_streak ?? 0}</span>
                  <span className="par-lb-score">{fmtTime(secondsFromScore(r.score))}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .par-lb {
          position: fixed; inset: 0; z-index: 260;
          background: rgba(10,30,18,0.66);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: par-lb-fade .2s ease;
          font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
        }
        @keyframes par-lb-fade { from { opacity:0 } to { opacity:1 } }
        .par-lb-card {
          width: min(96vw, 440px); max-height: min(86vh, 640px);
          display: flex; flex-direction: column;
          background: #fff; border-radius: 18px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: par-lb-up .3s cubic-bezier(.34,1.56,.64,1);
        }
        .par-lb.dark .par-lb-card { background: #15231c; }
        @keyframes par-lb-up { from { opacity:0; transform:translateY(12px) scale(.97) } to { opacity:1; transform:none } }

        .par-lb-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 1.2rem; background:#2c001e; color:#fff; flex-shrink:0;
        }
        .par-lb.dark .par-lb-head { background:#0a1410; }
        .par-lb-title { display:flex; align-items:center; gap:.5rem; font-size:1.1rem; font-weight:800; }
        .par-lb-live {
          display:inline-flex; align-items:center; gap:.25rem;
          font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
          background:rgba(255,255,255,0.14); border-radius:999px; padding:.12rem .45rem;
          color:rgba(255,255,255,0.6);
        }
        .par-lb-live.on { background:rgba(111,224,166,0.25); color:#9ff0c2; }
        .par-lb-live.off { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); }
        .par-lb-x {
          display:inline-flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:50%; border:none;
          background:rgba(255,255,255,0.12); color:#fff; cursor:pointer; transition:background .15s;
        }
        .par-lb-x:hover { background:rgba(255,255,255,0.24); }

        .par-lb-filters {
          display:flex; gap:.3rem; padding:.7rem .9rem; flex-wrap:wrap;
          border-bottom:1px solid rgba(0,0,0,0.07); flex-shrink:0;
        }
        .par-lb.dark .par-lb-filters { border-color:rgba(95,208,154,0.14); }
        .par-lb-fbtn {
          border:1px solid rgba(233, 84, 32,0.25); background:transparent;
          color:#e95420; border-radius:999px; padding:.25rem .7rem;
          font-family:inherit; font-size:.76rem; font-weight:700; cursor:pointer; transition:all .12s;
        }
        .par-lb.dark .par-lb-fbtn { color:#6fe0a6; border-color:rgba(95,208,154,0.28); }
        .par-lb-fbtn:hover { background:rgba(233, 84, 32,0.08); }
        .par-lb-fbtn.act { background:#e95420; color:#fff; border-color:#e95420; }
        .par-lb.dark .par-lb-fbtn.act { background:#2f9e63; border-color:#2f9e63; color:#06160e; }

        .par-lb-list { flex:1; min-height:0; overflow-y:auto; padding:.5rem .7rem .9rem; }
        .par-lb-empty { text-align:center; padding:2.5rem 1rem; color:#6b8070; font-weight:600; }
        .par-lb.dark .par-lb-empty { color:#8fc7a6; }

        .par-lb-row {
          display:grid; grid-template-columns:34px 1fr auto auto auto; align-items:center; gap:.55rem;
          padding:.55rem .7rem; border-radius:10px; margin-bottom:3px;
          animation:par-lb-rowin .25s ease;
        }
        .par-lb-strike {
          font-size:.78rem; font-weight:800; color:#c07800;
          font-variant-numeric:tabular-nums; white-space:nowrap;
        }
        .par-lb.dark .par-lb-strike { color:#e0a020; }
        @keyframes par-lb-rowin { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
        .par-lb-row:nth-child(even) { background:rgba(0,0,0,0.025); }
        .par-lb.dark .par-lb-row:nth-child(even) { background:rgba(255,255,255,0.025); }
        .par-lb-row.me { background:rgba(233, 84, 32,0.12); box-shadow:inset 0 0 0 1.5px rgba(233, 84, 32,0.4); }
        .par-lb.dark .par-lb-row.me { background:rgba(95,208,154,0.14); box-shadow:inset 0 0 0 1.5px rgba(95,208,154,0.4); }
        .par-lb-row.top1 { background:linear-gradient(90deg,rgba(200,164,21,0.18),transparent); }
        .par-lb-row.top2 { background:linear-gradient(90deg,rgba(122,140,153,0.15),transparent); }
        .par-lb-row.top3 { background:linear-gradient(90deg,rgba(160,103,74,0.15),transparent); }

        .par-lb-rank {
          display:inline-flex; align-items:center; justify-content:center;
          font-weight:800; font-size:.9rem; color:#6b8070; font-variant-numeric:tabular-nums;
        }
        .par-lb.dark .par-lb-rank { color:#a4c4aa; }
        .par-lb-row.top1 .par-lb-rank { color:#c8a415; }
        .par-lb-nick {
          font-weight:800; color:#17271d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .par-lb.dark .par-lb-nick { color:#d4e8dc; }
        .par-lb-mode {
          font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
          color:#6b8070; background:rgba(0,0,0,0.05); padding:.12rem .4rem; border-radius:999px;
        }
        .par-lb.dark .par-lb-mode { color:#8fc7a6; background:rgba(255,255,255,0.06); }
        .par-lb-score {
          font-weight:900; font-size:1rem; color:#e95420; font-variant-numeric:tabular-nums;
          min-width:54px; text-align:right;
        }
        .par-lb.dark .par-lb-score { color:#6fe0a6; }
      `}</style>
    </div>
  );
}
