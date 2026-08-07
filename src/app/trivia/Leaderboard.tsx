import { useEffect, useMemo, useRef, useState } from "react";
import { X, Trophy, Wifi, WifiOff, Medal, Target, GraduationCap } from "lucide-react";
import { fetchTop, fetchTotals, subscribeToScores, leaderboardConfigured, type ScoreRow, type TotalRow } from "./leaderboardApi";
import { CHAPTERS } from "./questions";
import { iconForChapter } from "./chapterIcons";
import Pagella from "./Pagella";

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

// Riga unificata della classifica: vale sia per il capitolo singolo sia per il
// totale aggregato. `chapters` valorizzato solo nella vista "Totale".
interface LbRow {
  id?: number;
  nick: string;
  score: number;
  accuracy: number;
  chapter?: string;     // capitolo singolo
  chapters?: number;    // n. capitoli (solo Totale)
}

const scoreToLbRow = (r: ScoreRow): LbRow => ({
  id: r.id, nick: r.nick, score: r.score, accuracy: r.accuracy, chapter: r.chapter,
});
const toLbRows = (rows: TotalRow[]): LbRow[] =>
  rows.map(r => ({ nick: r.nick, score: r.score, accuracy: r.accuracy, chapters: r.chapters }));

/**
 * Classifica live in stile Kit Italia (Bootstrap Italia, palette neroverde).
 *
 * Layout professionale: podio top-3, filtri a chip con icone tematiche
 * (scroll orizzontale con sfumatura ai bordi), righe con barra di precisione
 * e medaglie, stato di caricamento "skeleton" ed empty-state curato.
 * Ordine SEMPRE decrescente per punteggio. Gemella di angoli/Leaderboard.
 */
export default function Leaderboard({ dark, myNick, justSubmitted, onClose }: LeaderboardProps) {
  const [view, setView] = useState<"classifica" | "pagella">("classifica");
  // Filtro: "totale" (somma del best per capitolo, equo) oppure id di un capitolo
  // singolo. Niente più "Tutti"/"Misto": confrontare partite di lunghezza diversa
  // non avrebbe senso (più argomenti = più punti).
  const [filter, setFilter] = useState<string>("totale");
  const [rows, setRows] = useState<LbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const filtersRef = useRef<HTMLDivElement>(null);

  const realChapterIds = useMemo(() => CHAPTERS.map(c => c.id), []);
  const isTotal = filter === "totale";

  // Ricarica silenziosa (per i refresh realtime del Totale): non tocca `loading`,
  // così non rifà lampeggiare lo skeleton.
  const reload = () =>
    isTotal
      ? fetchTotals(realChapterIds, 50).then(toLbRows)
      : fetchTop(50, filter).then(rows => rows.map(scoreToLbRow));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const job = isTotal
      ? fetchTotals(realChapterIds, 50).then(toLbRows)
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

  // Realtime: a un nuovo punteggio ricarico (il totale va ricalcolato comunque).
  useEffect(() => {
    if (!leaderboardConfigured) return;
    const unsub = subscribeToScores(row => {
      setLive(true);
      // Capitolo singolo: aggiorna in-place se pertinente; totale: ricarica.
      if (isTotal) {
        if (realChapterIds.includes(row.chapter)) reload().then(d => setRows(d)).catch(() => {});
        return;
      }
      if (row.chapter !== filter) return;
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
    if (justSubmitted.chapter !== filter) return;
    setRows(prev => {
      if (justSubmitted.id != null && prev.some(r => r.id === justSubmitted.id)) return prev;
      return [...prev, scoreToLbRow(justSubmitted)].sort((a, b) => b.score - a.score).slice(0, 50);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justSubmitted, filter]);

  // Esc per chiudere (accessibilità).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fmtScore = (n: number) => n.toLocaleString("it-IT");

  // Podio (top-3) e resto della classifica.
  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  const myRank = useMemo(() => {
    if (!myNick) return -1;
    return rows.findIndex(r => r.nick === myNick);
  }, [rows, myNick]);

  const renderRow = (r: LbRow, i: number) => {
    const rank = i + 1;
    const mine = myNick && r.nick === myNick;
    const tag = isTotal
      ? `${r.chapters ?? 0} cap.`
      : (r.chapter ? chapLabel(r.chapter) : "");
    return (
      <li
        key={r.id ?? `${r.nick}-${i}`}
        className={`trv-lb-row${mine ? " me" : ""}${r.id != null && r.id === pulseId ? " pulse" : ""}`}
        style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
      >
        <span className="trv-lb-rank">{rank}</span>
        <span className="trv-lb-nick">
          {r.nick}
          {mine && <span className="trv-lb-you">tu</span>}
        </span>
        <span className="trv-lb-acc" title={`Precisione ${r.accuracy}%`}>
          <span className="trv-lb-accbar"><i style={{ width: `${r.accuracy}%` }} /></span>
          <span className="trv-lb-accnum">{r.accuracy}%</span>
        </span>
        <span className="trv-lb-chap" title={isTotal ? `${r.chapters} capitoli giocati` : tag}>{tag}</span>
        <span className="trv-lb-score">{fmtScore(r.score)}<small>pt</small></span>
      </li>
    );
  };

  const medalClass = ["gold", "silver", "bronze"];

  return (
    <div className={`trv-lb${dark ? " dark" : ""}`} onClick={onClose} role="dialog" aria-modal="true" aria-label="Classifica">
      <div className="trv-lb-card" onClick={e => e.stopPropagation()}>
        <header className="trv-lb-head">
          <div className="trv-lb-headrow">
            <div className="trv-lb-title">
              <span className="trv-lb-tico"><Trophy size={18} strokeWidth={2.2} /></span>
              <span className="trv-lb-ttext">
                Classifica
                <small>Storia dell'Architettura · Trivia</small>
              </span>
            </div>
            <button className="trv-lb-x" onClick={onClose} aria-label="Chiudi"><X size={20} /></button>
          </div>
          <div className="trv-lb-statusrow">
            {leaderboardConfigured ? (
              <span className={`trv-lb-live${live ? " on" : ""}`} title="Aggiornamenti in tempo reale">
                <Wifi size={11} /> {live ? "Aggiornamenti in tempo reale" : "Connesso"}
              </span>
            ) : (
              <span className="trv-lb-live off" title="Backend non configurato: solo locale">
                <WifiOff size={11} /> Solo locale
              </span>
            )}
          </div>

          <div className="trv-lb-tabs" role="tablist" aria-label="Vista">
            <button className={`trv-lb-tab${view === "classifica" ? " act" : ""}`} role="tab" aria-selected={view === "classifica"} onClick={() => setView("classifica")}>
              <Trophy size={13} /> Classifica
            </button>
            <button className={`trv-lb-tab${view === "pagella" ? " act" : ""}`} role="tab" aria-selected={view === "pagella"} onClick={() => setView("pagella")}>
              <GraduationCap size={13} /> La mia pagella
            </button>
          </div>
        </header>

        {view === "pagella" ? (
          <div className="trv-lb-body">
            {myNick
              ? <Pagella dark={dark} nick={myNick} compact />
              : <div className="trv-lb-empty"><span className="trv-lb-emptyico"><GraduationCap size={30} strokeWidth={1.6} /></span><strong>Nessun nome</strong><span>Scegli un nome per vedere la tua pagella.</span></div>}
          </div>
        ) : (
        <>
        <div className="trv-lb-filterswrap">
          <div className="trv-lb-filters" ref={filtersRef} role="tablist" aria-label="Filtra per capitolo">
            <button
              className={`trv-lb-fbtn${filter === "totale" ? " act" : ""}`}
              onClick={() => setFilter("totale")}
              role="tab"
              aria-selected={filter === "totale"}
              title="Somma del tuo miglior punteggio in ogni capitolo"
            >
              <Trophy size={13} strokeWidth={2.2} /> Totale
            </button>
            {CHAPTERS.map(c => (
              <button
                key={c.id}
                className={`trv-lb-fbtn${filter === c.id ? " act" : ""}`}
                onClick={() => setFilter(c.id)}
                role="tab"
                aria-selected={filter === c.id}
                title={c.title}
              >
                <span className="trv-lb-fico">{iconForChapter(c.id, 13)}</span>
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="trv-lb-body">
          {loading ? (
            <div className="trv-lb-skel">
              {Array.from({ length: 7 }).map((_, i) => (
                <div className="trv-lb-skelrow" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="trv-lb-skeldot" />
                  <span className="trv-lb-skelbar" />
                  <span className="trv-lb-skelbar sm" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="trv-lb-empty">
              <span className="trv-lb-emptyico"><Trophy size={30} strokeWidth={1.6} /></span>
              <strong>Nessun punteggio… ancora</strong>
              <span>Gioca una partita e conquista il primo posto del podio! 🎓</span>
            </div>
          ) : (
            <>
              {isTotal && (
                <p className="trv-lb-totalnote">
                  Punteggio = somma del tuo <b>miglior</b> risultato in ogni capitolo. Più capitoli padroneggi, più sali — senza vantaggi per chi gioca all'infinito.
                </p>
              )}
              {podium.length > 0 && (
                <ol className="trv-lb-podium" aria-label="Podio">
                  {/* Ordine visivo: 2° · 1° · 3° */}
                  {[1, 0, 2].map(idx => {
                    const r = podium[idx];
                    if (!r) return <li key={idx} className="trv-lb-podium-slot empty" aria-hidden="true" />;
                    const mine = myNick && r.nick === myNick;
                    return (
                      <li
                        key={r.id ?? `${r.nick}-${idx}`}
                        className={`trv-lb-podium-slot p${idx + 1}${mine ? " me" : ""}`}
                      >
                        <span className={`trv-lb-medal ${medalClass[idx]}`}>
                          <Medal size={idx === 0 ? 22 : 18} strokeWidth={2.1} />
                          <b>{idx + 1}</b>
                        </span>
                        <span className="trv-lb-pnick">{r.nick}{mine && <span className="trv-lb-you">tu</span>}</span>
                        <span className="trv-lb-pscore">{fmtScore(r.score)}<small>pt</small></span>
                        <span className="trv-lb-pacc"><Target size={11} /> {r.accuracy}%</span>
                      </li>
                    );
                  })}
                </ol>
              )}

              {rest.length > 0 && (
                <ol className="trv-lb-list" start={4}>
                  {rest.map((r, i) => renderRow(r, i + 3))}
                </ol>
              )}
            </>
          )}
        </div>

        {!loading && myNick && myRank >= 0 && (
          <footer className="trv-lb-foot">
            <span className="trv-lb-footlbl">La tua posizione</span>
            <span className="trv-lb-footrank">#{myRank + 1}</span>
            <span className="trv-lb-footnick">{myNick}</span>
            <span className="trv-lb-footscore">{fmtScore(rows[myRank].score)} pt</span>
          </footer>
        )}
        </>
        )}
      </div>

      <style>{`
        /* Tutto dai token --sb-* (src/app/home.css). Prima quasi ogni regola
           era scritta due volte — una per il chiaro e una sotto .trv-lb.dark —
           con due serie di verdi e grigi a mano; i token cambiano da soli col
           tema, quindi la coppia sparisce. Restano fissi solo i colori che NON
           sono interfaccia: le medaglie del podio e i bianchi sopra la fascia
           verde piena dell'header. */
        .trv-lb {
          position: fixed; inset: 0; z-index: 260;
          /* Velo scuro in tutti e due i temi: è il fondo di una modale, il suo
             mestiere è spegnere la pagina dietro. */
          background: rgba(10,14,11,0.62); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: trv-lb-fade .22s ease;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
        }
        @keyframes trv-lb-fade { from { opacity:0 } to { opacity:1 } }

        .trv-lb-card {
          width: min(96vw, 480px); max-height: min(90vh, 720px);
          display: flex; flex-direction: column;
          background: var(--sb-surface-75); border-radius: 20px; overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2);
          animation: trv-lb-up .34s cubic-bezier(.2,.9,.3,1.1);
        }
        @keyframes trv-lb-up { from { opacity:0; transform:translateY(16px) scale(.97) } to { opacity:1; transform:none } }

        /* ── Header: fascia verde piena, testo bianco in entrambi i temi ── */
        .trv-lb-head {
          background: linear-gradient(120deg,
            var(--sb-brand-text) 0%,
            color-mix(in srgb, var(--sb-brand-text) 72%, #000) 55%,
            var(--sb-brand-text) 130%);
          color: #fff; flex-shrink: 0; padding: 1.1rem 1.1rem .85rem;
          position: relative; overflow: hidden;
        }
        .trv-lb-head::after {
          content:""; position:absolute; right:-30px; top:-50px;
          width:180px; height:180px; border-radius:50%;
          background: radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%);
          pointer-events:none;
        }
        .trv-lb-headrow { display:flex; align-items:flex-start; justify-content:space-between; position:relative; z-index:1; }
        .trv-lb-title { display:flex; align-items:center; gap:.6rem; }
        .trv-lb-tico {
          display:inline-flex; align-items:center; justify-content:center;
          width:38px; height:38px; border-radius:11px; flex-shrink:0;
          background:rgba(255,255,255,0.16); box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18);
        }
        .trv-lb-ttext { display:flex; flex-direction:column; line-height:1.12; font-size:1.18rem; font-weight:800; letter-spacing:-.01em; }
        .trv-lb-ttext small { font-size:.66rem; font-weight:600; opacity:.78; letter-spacing:.01em; margin-top:.12rem; }
        .trv-lb-x {
          display:inline-flex; align-items:center; justify-content:center;
          width:34px; height:34px; border-radius:50%; border:none; flex-shrink:0;
          background:rgba(255,255,255,0.14); color:#fff; cursor:pointer; transition:background .15s, transform .15s;
        }
        .trv-lb-x:hover { background:rgba(255,255,255,0.26); transform:rotate(90deg); }
        .trv-lb-x:focus-visible { outline:2px solid #fff; outline-offset:2px; }
        .trv-lb-statusrow { margin-top:.7rem; position:relative; z-index:1; }
        .trv-lb-live {
          display:inline-flex; align-items:center; gap:.32rem;
          font-size:.66rem; font-weight:700; letter-spacing:.02em;
          background:rgba(255,255,255,0.13); border-radius:999px; padding:.2rem .6rem;
          color:rgba(255,255,255,0.78);
        }
        .trv-lb-live.on { background:rgba(255,255,255,0.22); color:#fff; }
        .trv-lb-live.on::before {
          content:""; width:6px; height:6px; border-radius:50%; background:#fff;
          box-shadow:0 0 0 0 rgba(255,255,255,0.7); animation:trv-lb-blink 1.6s infinite;
        }
        @keyframes trv-lb-blink { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6)} 70%{box-shadow:0 0 0 6px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }
        .trv-lb-live.off { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); }

        /* ── Tab Classifica / Pagella ── */
        .trv-lb-tabs { display:flex; gap:.4rem; margin-top:.7rem; position:relative; z-index:1; }
        .trv-lb-tab {
          flex:1; display:inline-flex; align-items:center; justify-content:center; gap:.35rem;
          border:none; border-radius:999px; padding:.4rem .6rem; cursor:pointer;
          font-family:inherit; font-size:.78rem; font-weight:800;
          background:rgba(255,255,255,0.13); color:rgba(255,255,255,0.82);
          transition:background .15s, color .15s, transform .1s;
        }
        .trv-lb-tab:hover { background:rgba(255,255,255,0.2); }
        /* La tab attiva è un ritaglio della card sulla fascia verde: prende il
           fondo della card, quindi segue il tema pur stando sull'header. */
        .trv-lb-tab.act { background:var(--sb-surface-75); color:var(--sb-brand-text); box-shadow:0 2px 8px rgba(0,0,0,0.2); }

        /* ── Filtri a chip (scroll + sfumature ai bordi) ── */
        .trv-lb-filterswrap { position:relative; flex-shrink:0; border-bottom:1px solid var(--sb-border); }
        .trv-lb-filterswrap::before, .trv-lb-filterswrap::after {
          content:""; position:absolute; top:0; bottom:1px; width:22px; pointer-events:none; z-index:2;
        }
        .trv-lb-filterswrap::before { left:0; background:linear-gradient(90deg,var(--sb-surface-75),transparent); }
        .trv-lb-filterswrap::after  { right:0; background:linear-gradient(270deg,var(--sb-surface-75),transparent); }
        .trv-lb-filters {
          display:flex; gap:.4rem; padding:.7rem .9rem; overflow-x:auto; scrollbar-width:thin;
          scroll-snap-type:x proximity; -webkit-overflow-scrolling:touch;
        }
        .trv-lb-filters::-webkit-scrollbar { height:5px; }
        .trv-lb-filters::-webkit-scrollbar-thumb { background:var(--sb-border-stronger); border-radius:99px; }
        .trv-lb-fbtn {
          display:inline-flex; align-items:center; gap:.3rem; white-space:nowrap; scroll-snap-align:start;
          border:1.5px solid var(--sb-border-strong); background:transparent;
          color:var(--sb-brand-text); border-radius:999px; padding:.32rem .72rem;
          font-family:inherit; font-size:.76rem; font-weight:700; cursor:pointer;
          transition:background .14s, color .14s, border-color .14s, transform .1s;
        }
        .trv-lb-fbtn .trv-lb-fico { display:inline-flex; opacity:.75; }
        .trv-lb-fbtn:hover { background:var(--sb-surface-200); transform:translateY(-1px); }
        .trv-lb-fbtn:focus-visible { outline:2px solid var(--sb-brand); outline-offset:1px; }
        .trv-lb-fbtn.act { background:var(--sb-btn-bg); color:var(--sb-btn-fg); border-color:var(--sb-btn-bd); }
        .trv-lb-fbtn.act .trv-lb-fico { opacity:1; }

        /* ── Body scrollabile ── */
        .trv-lb-body { flex:1; min-height:0; overflow-y:auto; padding:.9rem .85rem 1rem; scrollbar-width:thin; }
        .trv-lb-body::-webkit-scrollbar { width:7px; }
        .trv-lb-body::-webkit-scrollbar-thumb { background:var(--sb-border-stronger); border-radius:99px; }

        .trv-lb-totalnote {
          margin:.1rem .1rem .8rem; padding:.5rem .7rem; border-radius:10px;
          font-size:.72rem; line-height:1.35; color:var(--sb-fg-light); font-weight:600;
          background:var(--sb-bg-alt); border:1px solid var(--sb-border);
        }
        .trv-lb-totalnote b { color:var(--sb-brand-text); }

        /* ── Podio ──
           Oro, argento e bronzo sono colori da MEDAGLIA, non da interfaccia:
           restano fissi in tutti e due i temi, come su un podio vero. */
        .trv-lb-podium {
          list-style:none; margin:.2rem 0 1rem; padding:0;
          display:grid; grid-template-columns:1fr 1.18fr 1fr; gap:.55rem; align-items:end;
        }
        .trv-lb-podium-slot {
          display:flex; flex-direction:column; align-items:center; gap:.25rem;
          background:var(--sb-bg-alt);
          border:1px solid var(--sb-border); border-radius:14px;
          padding:.7rem .4rem .6rem; text-align:center; position:relative;
          animation:trv-lb-pop .4s cubic-bezier(.2,.9,.3,1.2) both;
        }
        .trv-lb-podium-slot.empty { background:transparent; border:none; animation:none; }
        .trv-lb-podium-slot.p1 { padding-top:1rem; background:linear-gradient(180deg, rgba(200,164,21,0.16), rgba(200,164,21,0.04)); border-color:rgba(200,164,21,0.4); animation-delay:.08s; }
        .trv-lb-podium-slot.p2 { animation-delay:0s; border-color:rgba(140,150,160,0.35); }
        .trv-lb-podium-slot.p3 { animation-delay:.16s; border-color:rgba(176,114,76,0.35); }
        .trv-lb-podium-slot.me { box-shadow:0 0 0 2px color-mix(in srgb, var(--sb-brand) 50%, transparent); }
        @keyframes trv-lb-pop { from{opacity:0; transform:translateY(14px) scale(.9)} to{opacity:1; transform:none} }

        .trv-lb-medal {
          display:inline-flex; align-items:center; justify-content:center; position:relative;
          width:44px; height:44px; border-radius:50%; color:#fff; margin-bottom:.15rem;
        }
        .trv-lb-medal b { position:absolute; font-size:.6rem; font-weight:900; bottom:-2px; right:-2px; background:var(--sb-surface-75); color:var(--sb-fg); width:15px; height:15px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.25); }
        .trv-lb-medal.gold   { background:linear-gradient(135deg,#f4d03f,#c8a415); box-shadow:0 4px 12px rgba(200,164,21,0.45); }
        .trv-lb-medal.silver { background:linear-gradient(135deg,#cfd8dc,#9aa6ad); box-shadow:0 4px 12px rgba(150,160,170,0.4); }
        .trv-lb-medal.bronze { background:linear-gradient(135deg,#d99c6a,#b0724c); box-shadow:0 4px 12px rgba(176,114,76,0.4); }
        .trv-lb-pnick { font-weight:800; font-size:.84rem; color:var(--sb-fg); max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:.25rem; }
        .trv-lb-pscore { font-weight:900; font-size:1.05rem; color:var(--sb-brand-text); font-variant-numeric:tabular-nums; line-height:1; }
        .trv-lb-podium-slot.p1 .trv-lb-pscore { font-size:1.25rem; }
        .trv-lb-pscore small { font-size:.55em; font-weight:700; opacity:.6; margin-left:.12em; }
        .trv-lb-pacc { display:inline-flex; align-items:center; gap:.2rem; font-size:.66rem; font-weight:700; color:var(--sb-fg-muted); }

        /* ── Lista (dal 4° posto) ── */
        .trv-lb-list { list-style:none; margin:0; padding:0; }
        .trv-lb-row {
          display:grid; grid-template-columns:30px 1fr 86px 78px auto; align-items:center; gap:.5rem;
          padding:.5rem .6rem; border-radius:11px; margin-bottom:3px;
          animation:trv-lb-rowin .3s ease both;
        }
        @keyframes trv-lb-rowin { from{opacity:0; transform:translateX(-8px)} to{opacity:1; transform:none} }
        .trv-lb-row:nth-child(even) { background:var(--sb-overlay); }
        .trv-lb-row.me {
          background:color-mix(in srgb, var(--sb-brand) 13%, transparent);
          box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--sb-brand) 40%, transparent);
        }
        .trv-lb-row.pulse { animation:trv-lb-pulse 1.6s ease; }
        @keyframes trv-lb-pulse { 0%{background:color-mix(in srgb, var(--sb-brand) 40%, transparent)} 100%{background:transparent} }

        .trv-lb-rank { display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:.85rem; color:var(--sb-fg-muted); font-variant-numeric:tabular-nums; }
        .trv-lb-nick { font-weight:700; color:var(--sb-fg); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:.35rem; }
        .trv-lb-you {
          font-size:.56rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em;
          background:var(--sb-btn-bg); color:var(--sb-btn-fg); padding:.06rem .3rem; border-radius:5px; flex-shrink:0;
        }
        .trv-lb-acc { display:flex; align-items:center; gap:.35rem; }
        .trv-lb-accbar { flex:1; height:5px; border-radius:99px; background:var(--sb-surface-200); overflow:hidden; }
        .trv-lb-accbar i { display:block; height:100%; border-radius:99px; background:var(--sb-brand); transition:width .5s ease; }
        .trv-lb-accnum { font-size:.64rem; font-weight:800; color:var(--sb-brand-text); font-variant-numeric:tabular-nums; width:28px; text-align:right; flex-shrink:0; }
        .trv-lb-chap {
          font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em;
          color:var(--sb-fg-muted); background:var(--sb-surface-200); padding:.16rem .45rem; border-radius:999px;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center;
        }
        .trv-lb-score { font-weight:900; font-size:.98rem; color:var(--sb-fg); font-variant-numeric:tabular-nums; text-align:right; }
        .trv-lb-score small { font-size:.54em; font-weight:700; opacity:.5; margin-left:.12em; }

        /* ── Footer "la tua posizione": fascia piena, come l'header ── */
        .trv-lb-foot {
          flex-shrink:0; display:flex; align-items:center; gap:.6rem;
          padding:.65rem 1rem; background:var(--sb-btn-bg); color:var(--sb-btn-fg);
          font-weight:700; animation:trv-lb-footin .3s ease;
        }
        @keyframes trv-lb-footin { from{transform:translateY(100%)} to{transform:none} }
        .trv-lb-footlbl { font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; opacity:.8; }
        .trv-lb-footrank { font-size:1.05rem; font-weight:900; font-variant-numeric:tabular-nums; }
        .trv-lb-footnick { font-size:.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .trv-lb-footscore { font-size:.85rem; font-weight:900; font-variant-numeric:tabular-nums; }

        /* ── Skeleton di caricamento ── */
        .trv-lb-skel { padding:.4rem .2rem; }
        .trv-lb-skelrow { display:flex; align-items:center; gap:.6rem; padding:.55rem .4rem; animation:trv-lb-fade .3s both; }
        .trv-lb-skeldot, .trv-lb-skelbar {
          background:linear-gradient(90deg,var(--sb-surface-100),var(--sb-surface-200),var(--sb-surface-100));
          background-size:200% 100%; animation:trv-lb-shimmer 1.3s infinite; border-radius:8px;
        }
        .trv-lb-skeldot { width:26px; height:26px; border-radius:50%; flex-shrink:0; }
        .trv-lb-skelbar { height:11px; flex:1; }
        .trv-lb-skelbar.sm { flex:none; width:52px; }
        @keyframes trv-lb-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }

        /* ── Empty state ── */
        .trv-lb-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; text-align:center; padding:2.6rem 1.5rem; }
        .trv-lb-emptyico {
          display:inline-flex; align-items:center; justify-content:center;
          width:64px; height:64px; border-radius:50%;
          background:color-mix(in srgb, var(--sb-brand) 12%, transparent); color:var(--sb-brand-text); margin-bottom:.3rem;
        }
        .trv-lb-empty strong { font-size:1.02rem; color:var(--sb-fg); font-weight:800; }
        .trv-lb-empty span { font-size:.82rem; color:var(--sb-fg-muted); max-width:240px; }

        @media (max-width:380px) {
          .trv-lb-row { grid-template-columns:26px 1fr 60px auto; }
          .trv-lb-chap { display:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .trv-lb, .trv-lb-card, .trv-lb-row, .trv-lb-podium-slot, .trv-lb-foot, .trv-lb-skelrow, .trv-lb-skeldot, .trv-lb-skelbar { animation:none !important; }
          .trv-lb-x:hover { transform:none; }
          .trv-lb-accbar i { transition:none; }
        }
      `}</style>
    </div>
  );
}
