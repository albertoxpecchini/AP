import { useEffect, useRef, useState } from "react";
import { X, Trophy, Wifi, WifiOff, Crown } from "lucide-react";
import { fetchTop, subscribeToScores, leaderboardConfigured, type ScoreRow } from "./leaderboardApi";
import { CHAPTERS } from "./questions";

interface LeaderboardProps {
  dark: boolean;
  myNick?: string;
  /** Riga appena inviata, per mostrarla subito in cima senza aspettare il fetch. */
  justSubmitted?: ScoreRow | null;
  onClose: () => void;
}

const CHAP_LABEL: Record<string, string> = Object.fromEntries(
  CHAPTERS.map(c => [c.id, c.title]),
);
const chapLabel = (id: string) =>
  id === "all" ? "Tutti" : id === "misto" ? "Misto" : (CHAP_LABEL[id] ?? id);

/**
 * Classifica live: top punteggi + aggiornamenti realtime (WebSocket Supabase).
 * Filtrabile per capitolo. Ordine SEMPRE decrescente per punteggio.
 * Gemella di angoli/Leaderboard.
 */
export default function Leaderboard({ dark, myNick, justSubmitted, onClose }: LeaderboardProps) {
  const [filter, setFilter] = useState<string | "all">("all");
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTop(50, filter === "all" ? undefined : filter)
      .then(data => { if (alive) { setRows(data); seenIds.current = new Set(data.map(r => r.id ?? -1)); } })
      .catch(() => { if (alive) setRows([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filter]);

  useEffect(() => {
    if (!leaderboardConfigured) return;
    const unsub = subscribeToScores(row => {
      if (row.id != null && seenIds.current.has(row.id)) return;
      if (row.id != null) seenIds.current.add(row.id);
      setRows(prev => {
        if (filter !== "all" && row.chapter !== filter) return prev;
        return [...prev, row].sort((a, b) => b.score - a.score).slice(0, 50);
      });
      setLive(true);
    });
    return unsub;
  }, [filter]);

  useEffect(() => {
    if (!justSubmitted) return;
    setRows(prev => {
      if (justSubmitted.id != null && prev.some(r => r.id === justSubmitted.id)) return prev;
      if (filter !== "all" && justSubmitted.chapter !== filter) return prev;
      return [...prev, justSubmitted].sort((a, b) => b.score - a.score).slice(0, 50);
    });
  }, [justSubmitted, filter]);

  const fmtScore = (n: number) => n.toLocaleString("it-IT");

  return (
    <div className={`trv-lb${dark ? " dark" : ""}`} onClick={onClose}>
      <div className="trv-lb-card" onClick={e => e.stopPropagation()}>
        <header className="trv-lb-head">
          <div className="trv-lb-title">
            <Trophy size={20} /> <span>Classifica</span>
            {leaderboardConfigured ? (
              <span className={`trv-lb-live${live ? " on" : ""}`} title="Aggiornamenti in tempo reale">
                <Wifi size={12} /> live
              </span>
            ) : (
              <span className="trv-lb-live off" title="Backend non configurato: solo locale">
                <WifiOff size={12} /> locale
              </span>
            )}
          </div>
          <button className="trv-lb-x" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
        </header>

        <div className="trv-lb-filters">
          <button className={`trv-lb-fbtn${filter === "all" ? " act" : ""}`} onClick={() => setFilter("all")}>Tutti</button>
          {CHAPTERS.map(c => (
            <button key={c.id} className={`trv-lb-fbtn${filter === c.id ? " act" : ""}`} onClick={() => setFilter(c.id)}>
              {c.title}
            </button>
          ))}
        </div>

        <div className="trv-lb-list">
          {loading ? (
            <div className="trv-lb-empty">Caricamento…</div>
          ) : rows.length === 0 ? (
            <div className="trv-lb-empty">Nessun punteggio ancora. Sii il primo! 🎓</div>
          ) : (
            rows.map((r, i) => {
              const mine = myNick && r.nick === myNick;
              return (
                <div key={r.id ?? `${r.nick}-${i}`} className={`trv-lb-row${mine ? " me" : ""}${i < 3 ? " top" + (i + 1) : ""}`}>
                  <span className="trv-lb-rank">{i === 0 ? <Crown size={16} /> : i + 1}</span>
                  <span className="trv-lb-nick">{r.nick}{mine ? " (tu)" : ""}</span>
                  <span className="trv-lb-acc">{r.accuracy}%</span>
                  <span className="trv-lb-chap">{chapLabel(r.chapter)}</span>
                  <span className="trv-lb-score">{fmtScore(r.score)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .trv-lb {
          position: fixed; inset: 0; z-index: 260;
          background: rgba(10,30,18,0.66);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: trv-lb-fade .2s ease;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
        }
        @keyframes trv-lb-fade { from { opacity:0 } to { opacity:1 } }
        .trv-lb-card {
          width: min(96vw, 460px); max-height: min(86vh, 640px);
          display: flex; flex-direction: column;
          background: #fff; border-radius: 18px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: trv-lb-up .3s cubic-bezier(.34,1.56,.64,1);
        }
        .trv-lb.dark .trv-lb-card { background: #15231c; }
        @keyframes trv-lb-up { from { opacity:0; transform:translateY(12px) scale(.97) } to { opacity:1; transform:none } }

        .trv-lb-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:1rem 1.2rem; background:#103820; color:#fff; flex-shrink:0;
        }
        .trv-lb.dark .trv-lb-head { background:#0a1410; }
        .trv-lb-title { display:flex; align-items:center; gap:.5rem; font-size:1.1rem; font-weight:800; }
        .trv-lb-live {
          display:inline-flex; align-items:center; gap:.25rem;
          font-size:.62rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
          background:rgba(255,255,255,0.14); border-radius:999px; padding:.12rem .45rem;
          color:rgba(255,255,255,0.6);
        }
        .trv-lb-live.on { background:rgba(111,224,166,0.25); color:#9ff0c2; }
        .trv-lb-live.off { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); }
        .trv-lb-x {
          display:inline-flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:50%; border:none;
          background:rgba(255,255,255,0.12); color:#fff; cursor:pointer; transition:background .15s;
        }
        .trv-lb-x:hover { background:rgba(255,255,255,0.24); }

        .trv-lb-filters {
          display:flex; gap:.3rem; padding:.7rem .9rem; flex-wrap:wrap;
          border-bottom:1px solid rgba(0,0,0,0.07); flex-shrink:0;
        }
        .trv-lb.dark .trv-lb-filters { border-color:rgba(95,208,154,0.14); }
        .trv-lb-fbtn {
          border:1px solid rgba(47,125,74,0.25); background:transparent;
          color:#2F7D4A; border-radius:999px; padding:.25rem .7rem;
          font-family:inherit; font-size:.76rem; font-weight:700; cursor:pointer; transition:all .12s;
        }
        .trv-lb.dark .trv-lb-fbtn { color:#6fe0a6; border-color:rgba(95,208,154,0.28); }
        .trv-lb-fbtn:hover { background:rgba(47,125,74,0.08); }
        .trv-lb-fbtn.act { background:#2F7D4A; color:#fff; border-color:#2F7D4A; }
        .trv-lb.dark .trv-lb-fbtn.act { background:#2f9e63; border-color:#2f9e63; color:#06160e; }

        .trv-lb-list { flex:1; min-height:0; overflow-y:auto; padding:.5rem .7rem .9rem; }
        .trv-lb-empty { text-align:center; padding:2.5rem 1rem; color:#6b8070; font-weight:600; }
        .trv-lb.dark .trv-lb-empty { color:#8fc7a6; }

        .trv-lb-row {
          display:grid; grid-template-columns:32px 1fr auto auto auto; align-items:center; gap:.55rem;
          padding:.55rem .7rem; border-radius:10px; margin-bottom:3px;
          animation:trv-lb-rowin .25s ease;
        }
        @keyframes trv-lb-rowin { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
        .trv-lb-row:nth-child(even) { background:rgba(0,0,0,0.025); }
        .trv-lb.dark .trv-lb-row:nth-child(even) { background:rgba(255,255,255,0.025); }
        .trv-lb-row.me { background:rgba(47,125,74,0.12); box-shadow:inset 0 0 0 1.5px rgba(47,125,74,0.4); }
        .trv-lb.dark .trv-lb-row.me { background:rgba(95,208,154,0.14); box-shadow:inset 0 0 0 1.5px rgba(95,208,154,0.4); }
        .trv-lb-row.top1 { background:linear-gradient(90deg,rgba(200,164,21,0.18),transparent); }
        .trv-lb-row.top2 { background:linear-gradient(90deg,rgba(122,140,153,0.15),transparent); }
        .trv-lb-row.top3 { background:linear-gradient(90deg,rgba(160,103,74,0.15),transparent); }

        .trv-lb-rank {
          display:inline-flex; align-items:center; justify-content:center;
          font-weight:800; font-size:.9rem; color:#6b8070; font-variant-numeric:tabular-nums;
        }
        .trv-lb.dark .trv-lb-rank { color:#a4c4aa; }
        .trv-lb-row.top1 .trv-lb-rank { color:#c8a415; }
        .trv-lb-nick { font-weight:800; color:#17271d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .trv-lb.dark .trv-lb-nick { color:#d4e8dc; }
        .trv-lb-acc {
          font-size:.72rem; font-weight:800; color:#2F7D4A; font-variant-numeric:tabular-nums;
        }
        .trv-lb.dark .trv-lb-acc { color:#6fe0a6; }
        .trv-lb-chap {
          font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em;
          color:#6b8070; background:rgba(0,0,0,0.05); padding:.12rem .4rem; border-radius:999px;
          max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .trv-lb.dark .trv-lb-chap { color:#8fc7a6; background:rgba(255,255,255,0.06); }
        .trv-lb-score {
          font-weight:900; font-size:1rem; color:#17271d; font-variant-numeric:tabular-nums;
          min-width:52px; text-align:right;
        }
        .trv-lb.dark .trv-lb-score { color:#d4e8dc; }
      `}</style>
    </div>
  );
}
