import { useEffect, useMemo, useRef, useState } from "react";
import { X, Trophy, Wifi, WifiOff, Medal, Target } from "lucide-react";
import { fetchTop, fetchTotals, subscribeToScores, leaderboardConfigured, type ScoreRow, type TotalRow } from "./leaderboardApi";
import { MODES } from "./MappaMenu";

interface LeaderboardProps {
  dark: boolean;
  myNick?: string;
  /** Riga appena inviata, per mostrarla subito in cima senza aspettare il fetch. */
  justSubmitted?: ScoreRow | null;
  onClose: () => void;
}

const MODE_LABEL: Record<string, string> = Object.fromEntries(MODES.map(m => [m.key, m.name]));
const modeLabel = (id: string) => MODE_LABEL[id] ?? id;

// Riga unificata della classifica: vale sia per il livello singolo sia per il
// totale aggregato. `modes` valorizzato solo nella vista "Totale".
interface LbRow {
  id?: number;
  nick: string;
  score: number;
  accuracy: number;
  mode?: string;     // livello singolo
  modes?: number;    // n. livelli (solo Totale)
}

const scoreToLbRow = (r: ScoreRow): LbRow => ({
  id: r.id, nick: r.nick, score: r.score, accuracy: r.accuracy, mode: r.mode,
});
const toLbRows = (rows: TotalRow[]): LbRow[] =>
  rows.map(r => ({ nick: r.nick, score: r.score, accuracy: r.accuracy, modes: r.modes }));

/**
 * Classifica live in stile Trivia (palette viola+verde). Podio top-3, filtri a
 * chip per livello (scroll orizzontale con sfumatura ai bordi), righe con barra
 * di precisione e medaglie, stato skeleton ed empty-state curato.
 * Ordine SEMPRE decrescente per punteggio. Gemella di Trivia/Angoli.
 */
export default function Leaderboard({ dark, myNick, justSubmitted, onClose }: LeaderboardProps) {
  // Filtro: "totale" (somma del best per livello) oppure key di un livello singolo.
  const [filter, setFilter] = useState<string>("totale");
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const filtersRef = useRef<HTMLDivElement>(null);

  const realModeIds = useMemo(() => MODES.map(m => m.key), []);
  const isTotal = filter === "totale";

  const reload = () =>
    isTotal
      ? fetchTotals(realModeIds, 50).then(toLbRows)
      : fetchTop(50, filter).then(rows => rows.map(scoreToLbRow));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const job = isTotal
      ? fetchTotals(realModeIds, 50).then(toLbRows)
      : fetchTop(50, filter).then(data => {
          seenIds.current = new Set(data.map(r => r.id ?? -1));
          return data.map(scoreToLbRow);
        });
    job
      .then(data => { if (alive) setRows(data); })
      .catch(() => { if (alive) setRows([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!leaderboardConfigured) return;
    const unsub = subscribeToScores(row => {
      setLive(true);
      if (isTotal) {
        if (realModeIds.includes(row.mode)) reload().then(d => setRows(d)).catch(() => {});
        return;
      }
      if (row.mode !== filter) return;
      if (row.id != null && seenIds.current.has(row.id)) return;
      if (row.id != null) seenIds.current.add(row.id);
      setRows(prev => [...prev, scoreToLbRow(row)].sort((a, b) => b.score - a.score).slice(0, 50));
      if (row.id != null) {
        setPulseId(row.id);
        setTimeout(() => setPulseId(p => (p === row.id ? null : p)), 1600);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!justSubmitted) return;
    if (isTotal) { reload().then(d => setRows(d)).catch(() => {}); return; }
    if (justSubmitted.mode !== filter) return;
    setRows(prev => {
      if (justSubmitted.id != null && prev.some(r => r.id === justSubmitted.id)) return prev;
      return [...prev, scoreToLbRow(justSubmitted)].sort((a, b) => b.score - a.score).slice(0, 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSubmitted, filter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fmtScore = (n: number) => n.toLocaleString("it-IT");

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  const myRank = useMemo(() => {
    if (!myNick) return -1;
    return rows.findIndex(r => r.nick === myNick);
  }, [rows, myNick]);

  const renderRow = (r: LbRow, i: number) => {
    const rank = i + 1;
    const mine = myNick && r.nick === myNick;
    const tag = isTotal ? `${r.modes ?? 0} liv.` : (r.mode ? modeLabel(r.mode) : "");
    return (
      <li
        key={r.id ?? `${r.nick}-${i}`}
        className={`mpl-row${mine ? " me" : ""}${r.id != null && r.id === pulseId ? " pulse" : ""}`}
        style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
      >
        <span className="mpl-rank">{rank}</span>
        <span className="mpl-nick">
          {r.nick}
          {mine && <span className="mpl-you">tu</span>}
        </span>
        <span className="mpl-acc" title={`Precisione ${r.accuracy}%`}>
          <span className="mpl-accbar"><i style={{ width: `${r.accuracy}%` }} /></span>
          <span className="mpl-accnum">{r.accuracy}%</span>
        </span>
        <span className="mpl-chap" title={isTotal ? `${r.modes} livelli giocati` : tag}>{tag}</span>
        <span className="mpl-score">{fmtScore(r.score)}<small>pt</small></span>
      </li>
    );
  };

  const medalClass = ["gold", "silver", "bronze"];

  return (
    <div className={`mpl${dark ? " dark" : ""}`} onClick={onClose} role="dialog" aria-modal="true" aria-label="Classifica">
      <div className="mpl-card" onClick={e => e.stopPropagation()}>
        <header className="mpl-head">
          <div className="mpl-headrow">
            <div className="mpl-title">
              <span className="mpl-tico"><Trophy size={18} strokeWidth={2.2} /></span>
              <span className="mpl-ttext">
                Classifica
                <small>Mappa · città dal satellite</small>
              </span>
            </div>
            <button className="mpl-x" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
          </div>
          <div className="mpl-statusrow">
            {leaderboardConfigured ? (
              <span className={`mpl-live${live ? " on" : ""}`} title="Aggiornamenti in tempo reale">
                <Wifi size={11} /> {live ? "Aggiornamenti in tempo reale" : "Connesso"}
              </span>
            ) : (
              <span className="mpl-live off" title="Backend non configurato: solo locale">
                <WifiOff size={11} /> Solo locale
              </span>
            )}
          </div>
        </header>

        <div className="mpl-filterswrap">
          <div className="mpl-filters" ref={filtersRef} role="tablist" aria-label="Filtra per livello">
            <button
              className={`mpl-fbtn${filter === "totale" ? " act" : ""}`}
              onClick={() => setFilter("totale")}
              role="tab"
              aria-selected={filter === "totale"}
              title="Somma del tuo miglior punteggio in ogni livello"
            >
              <Trophy size={13} strokeWidth={2.2} /> Totale
            </button>
            {MODES.map(m => (
              <button
                key={m.key}
                className={`mpl-fbtn${filter === m.key ? " act" : ""}`}
                onClick={() => setFilter(m.key)}
                role="tab"
                aria-selected={filter === m.key}
                title={m.desc}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mpl-body">
          {loading ? (
            <div className="mpl-skel">
              {Array.from({ length: 7 }).map((_, i) => (
                <div className="mpl-skelrow" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="mpl-skeldot" />
                  <span className="mpl-skelbar" />
                  <span className="mpl-skelbar sm" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="mpl-empty">
              <span className="mpl-emptyico"><Trophy size={30} strokeWidth={1.6} /></span>
              <strong>Nessun punteggio… ancora</strong>
              <span>Gioca una partita e conquista il primo posto del podio! 🌍</span>
            </div>
          ) : (
            <>
              {isTotal && (
                <p className="mpl-totalnote">
                  Punteggio = somma del tuo <b>miglior</b> risultato in ogni livello. Più livelli padroneggi, più sali — senza vantaggi per chi gioca all'infinito.
                </p>
              )}
              {podium.length > 0 && (
                <ol className="mpl-podium" aria-label="Podio">
                  {[1, 0, 2].map(idx => {
                    const r = podium[idx];
                    if (!r) return <li key={idx} className="mpl-podium-slot empty" aria-hidden="true" />;
                    const mine = myNick && r.nick === myNick;
                    return (
                      <li
                        key={r.id ?? `${r.nick}-${idx}`}
                        className={`mpl-podium-slot p${idx + 1}${mine ? " me" : ""}`}
                      >
                        <span className={`mpl-medal ${medalClass[idx]}`}>
                          <Medal size={idx === 0 ? 22 : 18} strokeWidth={2.1} />
                          <b>{idx + 1}</b>
                        </span>
                        <span className="mpl-pnick">{r.nick}{mine && <span className="mpl-you">tu</span>}</span>
                        <span className="mpl-pscore">{fmtScore(r.score)}<small>pt</small></span>
                        <span className="mpl-pacc"><Target size={11} /> {r.accuracy}%</span>
                      </li>
                    );
                  })}
                </ol>
              )}

              {rest.length > 0 && (
                <ol className="mpl-list" start={4}>
                  {rest.map((r, i) => renderRow(r, i + 3))}
                </ol>
              )}
            </>
          )}
        </div>

        {!loading && myNick && myRank >= 0 && (
          <footer className="mpl-foot">
            <span className="mpl-footlbl">La tua posizione</span>
            <span className="mpl-footrank">#{myRank + 1}</span>
            <span className="mpl-footnick">{myNick}</span>
            <span className="mpl-footscore">{fmtScore(rows[myRank].score)} pt</span>
          </footer>
        )}
      </div>

      <style>{`
        .mpl {
          position: fixed; inset: 0; z-index: 260;
          background: rgba(20,10,40,0.62); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: mpl-fade .22s ease;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
        }
        @keyframes mpl-fade { from { opacity:0 } to { opacity:1 } }

        .mpl-card {
          width: min(96vw, 480px); max-height: min(90vh, 720px);
          display: flex; flex-direction: column;
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 30px 80px rgba(20,10,40,0.45), 0 2px 8px rgba(20,10,40,0.2);
          animation: mpl-up .34s cubic-bezier(.2,.9,.3,1.1);
        }
        .mpl.dark .mpl-card { background: #1a1230; box-shadow: 0 30px 80px rgba(0,0,0,0.6); }
        @keyframes mpl-up { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:none } }

        .mpl-head {
          background: linear-gradient(120deg, #7c3aed 0%, #5b21b6 55%, #2F7D4A 130%);
          color: #fff; flex-shrink: 0; padding: 1.1rem 1.1rem .85rem;
          position: relative; overflow: hidden;
        }
        .mpl-head::after {
          content:""; position:absolute; right:-30px; top:-50px;
          width:180px; height:180px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%);
          pointer-events:none;
        }
        .mpl.dark .mpl-head { background: linear-gradient(120deg, #4c1d95 0%, #2a1150 60%, #103820 130%); }
        .mpl-headrow { display:flex; align-items:flex-start; justify-content:space-between; position:relative; z-index:1; }
        .mpl-title { display:flex; align-items:center; gap:.6rem; }
        .mpl-tico {
          display:inline-flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:11px; flex-shrink:0;
          background:rgba(255,255,255,0.16); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18);
        }
        .mpl-ttext { display:flex; flex-direction:column; line-height:1.12; font-size:1.18rem; font-weight:800; letter-spacing:-.01em; }
        .mpl-ttext small { font-size:.66rem; font-weight:600; opacity:.78; letter-spacing:.01em; margin-top:.12rem; }
        .mpl-x {
          display:inline-flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:50%; border:none; flex-shrink:0;
          background:rgba(255,255,255,0.14); color:#fff; cursor:pointer; transition:background .15s, transform .15s;
        }
        .mpl-x:hover { background:rgba(255,255,255,0.26); transform:rotate(90deg); }
        .mpl-x:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        .mpl-statusrow { margin-top:.7rem; position:relative; z-index:1; }
        .mpl-live {
          display:inline-flex; align-items:center; gap:.32rem;
          font-size:.66rem; font-weight:700; letter-spacing:.02em;
          background:rgba(255,255,255,0.13); border-radius:999px; padding:.2rem .6rem;
          color:rgba(255,255,255,0.78);
        }
        .mpl-live.on { background:rgba(127,224,159,0.22); color:#bdf5d4; }
        .mpl-live.on::before {
          content:""; width:6px; height:6px; border-radius:50%; background:#5fe39c;
          box-shadow:0 0 0 0 rgba(95,227,156,0.7); animation:mpl-blink 1.6s infinite;
        }
        @keyframes mpl-blink { 0%{box-shadow:0 0 0 0 rgba(95,227,156,0.6)} 70%{box-shadow:0 0 0 6px rgba(95,227,156,0)} 100%{box-shadow:0 0 0 0 rgba(95,227,156,0)} }
        .mpl-live.off { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); }

        .mpl-filterswrap { position:relative; flex-shrink:0; border-bottom:1px solid rgba(0,0,0,0.06); }
        .mpl.dark .mpl-filterswrap { border-color:rgba(155,92,246,0.18); }
        .mpl-filterswrap::before, .mpl-filterswrap::after {
          content:""; position:absolute; top:0; bottom:1px; width:22px; pointer-events:none; z-index:2;
        }
        .mpl-filterswrap::before { left:0; background:linear-gradient(90deg,#fff,transparent); }
        .mpl-filterswrap::after  { right:0; background:linear-gradient(270deg,#fff,transparent); }
        .mpl.dark .mpl-filterswrap::before { background:linear-gradient(90deg,#1a1230,transparent); }
        .mpl.dark .mpl-filterswrap::after  { background:linear-gradient(270deg,#1a1230,transparent); }
        .mpl-filters {
          display:flex; gap:.4rem; padding:.7rem .9rem; overflow-x:auto; scrollbar-width:thin;
          scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch;
        }
        .mpl-filters::-webkit-scrollbar { height:5px; }
        .mpl-filters::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.3); border-radius:99px; }
        .mpl-fbtn {
          display:inline-flex; align-items:center; gap:.3rem; white-space:nowrap; scroll-snap-align:start;
          border:1.5px solid rgba(124,58,237,0.22); background:#fff;
          color:#6d28d9; border-radius:999px; padding:.32rem .72rem;
          font-family:inherit; font-size:.76rem; font-weight:700; cursor:pointer;
          transition:background .14s, color .14s, border-color .14s, transform .1s;
        }
        .mpl.dark .mpl-fbtn { color:#c4a5ff; background:transparent; border-color:rgba(155,92,246,0.26); }
        .mpl-fbtn:hover { background:rgba(124,58,237,0.08); transform:translateY(-1px); }
        .mpl-fbtn:focus-visible { outline:2px solid #7c3aed; outline-offset:1px; }
        .mpl-fbtn.act { background:#7c3aed; color:#fff; border-color:#7c3aed; box-shadow:0 2px 8px rgba(124,58,237,0.34); }
        .mpl.dark .mpl-fbtn.act { background:#9b5cf6; border-color:#9b5cf6; color:#190a2e; }

        .mpl-body { flex:1; min-height:0; overflow-y:auto; padding:.9rem .85rem 1rem; scrollbar-width:thin; }
        .mpl-body::-webkit-scrollbar { width:7px; }
        .mpl-body::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.25); border-radius:99px; }

        .mpl-totalnote {
          margin:.1rem .1rem .8rem; padding:.5rem .7rem; border-radius:10px;
          font-size:.72rem; line-height:1.35; color:#4a5c50; font-weight:600;
          background:rgba(124,58,237,0.07); border:1px solid rgba(124,58,237,0.13);
        }
        .mpl.dark .mpl-totalnote { color:#b6a9cf; background:rgba(155,92,246,0.08); border-color:rgba(155,92,246,0.16); }
        .mpl-totalnote b { color:#7c3aed; }
        .mpl.dark .mpl-totalnote b { color:#c4a5ff; }

        .mpl-podium {
          list-style:none; margin:.2rem 0 1rem; padding:0;
          display:grid; grid-template-columns:1fr 1.18fr 1fr; gap:.55rem; align-items:end;
        }
        .mpl-podium-slot {
          display:flex; flex-direction:column; align-items:center; gap:.25rem;
          background:linear-gradient(180deg, rgba(124,58,237,0.06), rgba(124,58,237,0.02));
          border:1px solid rgba(124,58,237,0.12); border-radius:14px;
          padding:.7rem .4rem .6rem; text-align:center; position:relative;
          animation:mpl-pop .4s cubic-bezier(.2,.9,.3,1.2) both;
        }
        .mpl-podium-slot.empty { background:transparent; border:none; animation:none; }
        .mpl-podium-slot.p1 { padding-top:1rem; background:linear-gradient(180deg, rgba(200,164,21,0.16), rgba(200,164,21,0.04)); border-color:rgba(200,164,21,0.4); animation-delay:.08s; }
        .mpl-podium-slot.p2 { animation-delay:0s; border-color:rgba(140,150,160,0.35); }
        .mpl-podium-slot.p3 { animation-delay:.16s; border-color:rgba(176,114,76,0.35); }
        .mpl.dark .mpl-podium-slot { background:rgba(255,255,255,0.03); border-color:rgba(155,92,246,0.16); }
        .mpl.dark .mpl-podium-slot.p1 { background:linear-gradient(180deg, rgba(214,178,40,0.18), rgba(214,178,40,0.04)); border-color:rgba(214,178,40,0.45); }
        .mpl-podium-slot.me { box-shadow:0 0 0 2px rgba(124,58,237,0.5); }
        @keyframes mpl-pop { from{opacity:0; transform:translateY(14px) scale(.9)} to{opacity:1; transform:none} }

        .mpl-medal {
          display:inline-flex; align-items:center; justify-content:center; position:relative;
          width:44px; height:44px; border-radius:50%; color:#fff; margin-bottom:.15rem;
        }
        .mpl-medal b { position:absolute; font-size:.6rem; font-weight:900; bottom:-2px; right:-2px; background:#fff; color:#333; width:15px; height:15px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.25); }
        .mpl-medal.gold   { background:linear-gradient(135deg,#f4d03f,#c8a415); box-shadow:0 4px 12px rgba(200,164,21,0.45); }
        .mpl-medal.silver { background:linear-gradient(135deg,#cfd8dc,#9aa6ad); box-shadow:0 4px 12px rgba(150,160,170,0.4); }
        .mpl-medal.bronze { background:linear-gradient(135deg,#d99c6a,#b0724c); box-shadow:0 4px 12px rgba(176,114,76,0.4); }
        .mpl-pnick { font-weight:800; font-size:.84rem; color:#17271d; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:.25rem; }
        .mpl.dark .mpl-pnick { color:#e7def7; }
        .mpl-pscore { font-weight:900; font-size:1.05rem; color:#7c3aed; font-variant-numeric:tabular-nums; line-height:1; }
        .mpl-podium-slot.p1 .mpl-pscore { font-size:1.25rem; }
        .mpl.dark .mpl-pscore { color:#c4a5ff; }
        .mpl-pscore small { font-size:.55em; font-weight:700; opacity:.6; margin-left:.12em; }
        .mpl-pacc { display:inline-flex; align-items:center; gap:.2rem; font-size:.66rem; font-weight:700; color:#6b6080; }
        .mpl.dark .mpl-pacc { color:#b6a9cf; }

        .mpl-list { list-style:none; margin:0; padding:0; }
        .mpl-row {
          display:grid; grid-template-columns:30px 1fr 86px 78px auto; align-items:center; gap:.5rem;
          padding:.5rem .6rem; border-radius:11px; margin-bottom:3px;
          animation:mpl-rowin .3s ease both;
        }
        @keyframes mpl-rowin { from{opacity:0; transform:translateX(-8px)} to{opacity:1; transform:none} }
        .mpl-row:nth-child(even) { background:rgba(0,0,0,0.022); }
        .mpl.dark .mpl-row:nth-child(even) { background:rgba(255,255,255,0.025); }
        .mpl-row.me { background:rgba(124,58,237,0.12); box-shadow:inset 0 0 0 1.5px rgba(124,58,237,0.4); }
        .mpl.dark .mpl-row.me { background:rgba(155,92,246,0.14); box-shadow:inset 0 0 0 1.5px rgba(155,92,246,0.4); }
        .mpl-row.pulse { animation:mpl-pulse 1.6s ease; }
        @keyframes mpl-pulse { 0%{background:rgba(95,227,156,0.4)} 100%{background:transparent} }

        .mpl-rank { display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:.85rem; color:#9a90ab; font-variant-numeric:tabular-nums; }
        .mpl.dark .mpl-rank { color:#8a7da6; }
        .mpl-nick { font-weight:700; color:#17271d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:.35rem; }
        .mpl.dark .mpl-nick { color:#e7def7; }
        .mpl-you {
          font-size:.56rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
          background:#7c3aed; color:#fff; padding:.06rem .3rem; border-radius:5px; flex-shrink:0;
        }
        .mpl.dark .mpl-you { background:#9b5cf6; color:#190a2e; }
        .mpl-acc { display:flex; align-items:center; gap:.35rem; }
        .mpl-accbar { flex:1; height:5px; border-radius:99px; background:rgba(124,58,237,0.14); overflow:hidden; }
        .mpl.dark .mpl-accbar { background:rgba(155,92,246,0.15); }
        .mpl-accbar i { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#7c3aed,#b794ff); transition:width .5s ease; }
        .mpl-accnum { font-size:.64rem; font-weight:800; color:#7c3aed; font-variant-numeric:tabular-nums; width:28px; text-align:right; flex-shrink:0; }
        .mpl.dark .mpl-accnum { color:#c4a5ff; }
        .mpl-chap {
          font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em;
          color:#6b6080; background:rgba(0,0,0,0.045); padding:.16rem .45rem; border-radius:999px;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;
        }
        .mpl.dark .mpl-chap { color:#b6a9cf; background:rgba(255,255,255,0.06); }
        .mpl-score { font-weight:900; font-size:.98rem; color:#17271d; font-variant-numeric:tabular-nums; text-align:right; }
        .mpl.dark .mpl-score { color:#e7def7; }
        .mpl-score small { font-size:.54em; font-weight:700; opacity:.5; margin-left:.12em; }

        .mpl-foot {
          flex-shrink:0; display:flex; align-items:center; gap:.6rem;
          padding:.65rem 1rem; background:#7c3aed; color:#fff;
          font-weight:700; animation:mpl-footin .3s ease;
        }
        @keyframes mpl-footin { from{transform:translateY(100%)} to{transform:none} }
        .mpl.dark .mpl-foot { background:#5b21b6; }
        .mpl-footlbl { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; opacity:.8; }
        .mpl-footrank { font-size:1.05rem; font-weight:900; font-variant-numeric:tabular-nums; }
        .mpl-footnick { font-size:.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .mpl-footscore { font-size:.85rem; font-weight:900; font-variant-numeric:tabular-nums; }

        .mpl-skel { padding:.4rem .2rem; }
        .mpl-skelrow { display:flex; align-items:center; gap:.6rem; padding:.55rem .4rem; animation:mpl-fade .3s both; }
        .mpl-skeldot, .mpl-skelbar { background:linear-gradient(90deg,rgba(0,0,0,0.05),rgba(0,0,0,0.1),rgba(0,0,0,0.05)); background-size:200% 100%; animation:mpl-shimmer 1.3s infinite; border-radius:8px; }
        .mpl.dark .mpl-skeldot, .mpl.dark .mpl-skelbar { background:linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.09),rgba(255,255,255,0.04)); background-size:200% 100%; }
        .mpl-skeldot { width:26px; height:26px; border-radius:50%; flex-shrink:0; }
        .mpl-skelbar { height:11px; flex:1; }
        .mpl-skelbar.sm { flex:none; width:52px; }
        @keyframes mpl-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }

        .mpl-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; text-align:center; padding:2.6rem 1.5rem; }
        .mpl-emptyico { display:inline-flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:50%; background:rgba(124,58,237,0.1); color:#7c3aed; margin-bottom:.3rem; }
        .mpl.dark .mpl-emptyico { background:rgba(155,92,246,0.12); color:#c4a5ff; }
        .mpl-empty strong { font-size:1.02rem; color:#17271d; font-weight:800; }
        .mpl.dark .mpl-empty strong { color:#e7def7; }
        .mpl-empty span { font-size:.82rem; color:#6b6080; max-width:240px; }
        .mpl.dark .mpl-empty span { color:#b6a9cf; }

        @media (max-width:380px) {
          .mpl-row { grid-template-columns:26px 1fr 60px auto; }
          .mpl-chap { display:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mpl, .mpl-card, .mpl-row, .mpl-podium-slot, .mpl-foot, .mpl-skelrow, .mpl-skeldot, .mpl-skelbar { animation:none !important; }
          .mpl-x:hover { transform:none; }
          .mpl-accbar i { transition:none; }
        }
      `}</style>
    </div>
  );
}
