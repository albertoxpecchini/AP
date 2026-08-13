import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Clock, CheckCircle2, TrendingUp, TrendingDown } from "lucide-react";
import { fetchReport, fmtMs, type SubjectReport, type GradeCell } from "./gradesApi";
import type { QType } from "./parseTrivia";

interface PagellaProps {
  dark: boolean;
  nick: string;
  /** compatta: meno padding, per l'uso dentro la classifica */
  compact?: boolean;
}

const TYPE_ORDER: QType[] = ["multipla", "vero-falso", "aperta"];
const TYPE_SHORT: Record<QType, string> = { multipla: "Scelta", "vero-falso": "V/F", aperta: "Completa" };

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("it-IT", {
      day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
};

/**
 * Pagella per argomento del giocatore. Per ogni argomento mostra fino a 3 voti
 * (uno per tipo di domanda). Ogni voto: lettera record + percentuale; se l'ultimo
 * risultato differisce dal record, mostra la differenza in punti percentuali
 * (+%/−%). Mostra tempi (per tipo e totale argomento) e data ultimo aggiornamento.
 *
 * I voti arrivano solo da pacchetti completati al 100% in una partita, e sono
 * legati al NOME (account condiviso) → visibili da qualunque dispositivo.
 */
export default function Pagella({ dark, nick, compact = false }: PagellaProps) {
  const [report, setReport] = useState<SubjectReport[] | null>(null);

  useEffect(() => {
    let alive = true;
    setReport(null);
    fetchReport(nick).then(r => { if (alive) setReport(r); }).catch(() => { if (alive) setReport([]); });
    return () => { alive = false; };
  }, [nick]);

  const summary = useMemo(() => {
    if (!report || report.length === 0) return null;
    const cells = report.flatMap(s => s.cells);
    const avg = Math.round(cells.reduce((s, c) => s + c.best.accuracy, 0) / cells.length);
    const totalMs = report.reduce((s, c) => s + c.totalMs, 0);
    return { subjects: report.length, votes: cells.length, avg, totalMs };
  }, [report]);

  const renderCell = (cell: GradeCell) => {
    const g = dark ? cell.best.grade.colorDark : cell.best.grade.color;
    const up = cell.deltaPct > 0;
    return (
      <div key={cell.type} className="pag-cell">
        <div className="pag-cell-type">{TYPE_SHORT[cell.type]}</div>
        <div className="pag-cell-grade" style={{ color: g }}>{cell.best.grade.letter}</div>
        <div className="pag-cell-pct">{cell.best.accuracy}%</div>
        <div className="pag-cell-meta">
          <span title="Domande corrette"><CheckCircle2 size={10} /> {cell.best.correct}/{cell.best.total}</span>
          <span title="Tempo record"><Clock size={10} /> {fmtMs(cell.best.ms)}</span>
        </div>
        {!cell.same && (
          <div className={`pag-cell-delta${up ? " up" : " down"}`} title={`Ultimo: ${cell.last.grade.letter} (${cell.last.accuracy}%)`}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {up ? "+" : ""}{cell.deltaPct}% ultimo
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`pag${dark ? " dark" : ""}${compact ? " compact" : ""}`}>
      {report === null ? (
        <div className="pag-load">
          {Array.from({ length: 4 }).map((_, i) => <div className="pag-skel" key={i} style={{ animationDelay: `${i * 80}ms` }} />)}
        </div>
      ) : report.length === 0 ? (
        <div className="pag-empty">
          <span className="pag-empty-ico"><GraduationCap size={30} strokeWidth={1.6} /></span>
          <strong>Pagella ancora vuota</strong>
          <span>Completa un argomento per intero (tutte le domande di un tipo) e qui comparirà il tuo voto.</span>
        </div>
      ) : (
        <>
          {summary && (
            <div className="pag-summary">
              <div className="pag-sum-item"><b>{summary.avg}%</b><small>media voti</small></div>
              <div className="pag-sum-item"><b>{summary.subjects}</b><small>argomenti</small></div>
              <div className="pag-sum-item"><b>{summary.votes}</b><small>voti presi</small></div>
              <div className="pag-sum-item"><b>{fmtMs(summary.totalMs)}</b><small>tempo totale</small></div>
            </div>
          )}

          <div className="pag-list">
            {report.map(s => (
              <div className="pag-subj" key={s.argomento}>
                <div className="pag-subj-head">
                  <span className="pag-subj-name">{s.argomento}</span>
                  <span className="pag-subj-meta">
                    <span title="Tempo totale argomento"><Clock size={11} /> {fmtMs(s.totalMs)}</span>
                    {s.lastAt && <span className="pag-subj-date" title="Ultimo aggiornamento">{fmtDate(s.lastAt)}</span>}
                  </span>
                </div>
                <div className="pag-cells">
                  {TYPE_ORDER.map(t => {
                    const cell = s.cells.find(c => c.type === t);
                    return cell
                      ? renderCell(cell)
                      : <div key={t} className="pag-cell todo"><div className="pag-cell-type">{TYPE_SHORT[t]}</div><div className="pag-cell-na">Da fare</div></div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        /* Tutto dai token --sb-* (src/app/home.css). Prima ogni regola era
           scritta due volte — una per il chiaro e una sotto .pag.dark — con due
           serie di azzurri e grigi a mano. Ora la coppia sparisce: i token
           cambiano da soli col tema, e restano solo le poche regole .pag.dark
           dove serve davvero una scelta diversa. */
        .pag { font-family:"Titillium Web", Geneva, Tahoma, sans-serif; }

        .pag-summary {
          display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; margin-bottom:.9rem;
        }
        .pag-sum-item {
          display:flex; flex-direction:column; align-items:center; gap:.1rem;
          background:var(--sb-bg-alt); border:1px solid var(--sb-border);
          border-radius:13px; padding:.6rem .3rem;
        }
        .pag-sum-item b { font-size:1.15rem; font-weight:900; color:var(--sb-brand-text); font-variant-numeric:tabular-nums; letter-spacing:-.01em; }
        .pag-sum-item small { font-size:.6rem; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:var(--sb-fg-muted); }

        .pag-list { display:flex; flex-direction:column; gap:.7rem; }
        .pag-subj {
          border:1px solid var(--sb-border); border-radius:14px; padding:.7rem .75rem .8rem;
          background:var(--sb-bg-alt);
        }
        .pag-subj-head { display:flex; align-items:baseline; justify-content:space-between; gap:.5rem; margin-bottom:.55rem; }
        .pag-subj-name { font-weight:800; font-size:.92rem; color:var(--sb-fg); line-height:1.15; }
        .pag-subj-meta { display:inline-flex; align-items:center; gap:.55rem; flex-shrink:0; font-size:.66rem; font-weight:700; color:var(--sb-fg-muted); }
        .pag-subj-meta span { display:inline-flex; align-items:center; gap:.22rem; }
        .pag-subj-date { opacity:.75; }

        .pag-cells { display:grid; grid-template-columns:repeat(3,1fr); gap:.45rem; }
        .pag-cell {
          display:flex; flex-direction:column; align-items:center; gap:.12rem;
          border:1px solid var(--sb-border); border-radius:11px; padding:.5rem .3rem .45rem;
          background:var(--sb-surface-75); text-align:center;
        }
        /* "Da fare": bordo tratteggiato azzurro, niente riempimento pieno. */
        .pag-cell.todo {
          border-style:dashed;
          border-color:color-mix(in srgb, var(--sb-brand) 40%, transparent);
          background:color-mix(in srgb, var(--sb-brand) 6%, transparent);
        }
        .pag-cell-type { font-size:.58rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--sb-fg-muted); }
        .pag-cell-grade { font-size:1.5rem; font-weight:900; line-height:1; letter-spacing:-.02em; }
        .pag-cell-na { font-size:.82rem; font-weight:800; color:var(--sb-brand-text); line-height:1; padding:.5rem 0; text-transform:uppercase; letter-spacing:.03em; }
        .pag-cell-pct { font-size:.72rem; font-weight:800; color:var(--sb-fg); font-variant-numeric:tabular-nums; }
        .pag-cell-meta { display:flex; flex-direction:column; align-items:center; gap:.05rem; font-size:.56rem; font-weight:700; color:var(--sb-fg-muted); margin-top:.1rem; }
        .pag-cell-meta span { display:inline-flex; align-items:center; gap:.18rem; }
        .pag-cell-delta {
          display:inline-flex; align-items:center; gap:.15rem; margin-top:.18rem;
          font-size:.56rem; font-weight:800; clip-path:var(--sb-shape-xs); padding:.08rem .35rem;
        }
        /* Meglio/peggio: l'azzurro è quello del brand, il rosso resta fisso —
           è l'unico colore che deve dire "in calo" senza dipendere dal tema. */
        .pag-cell-delta.up { color:var(--sb-brand-text); background:color-mix(in srgb, var(--sb-brand) 14%, transparent); }
        .pag-cell-delta.down { color:#e5484d; background:rgba(229,72,77,0.12); }

        .pag-load { display:flex; flex-direction:column; gap:.6rem; }
        .pag-skel {
          height:78px; border-radius:14px;
          background:linear-gradient(90deg,var(--sb-surface-100),var(--sb-surface-200),var(--sb-surface-100));
          background-size:200% 100%; animation:pag-shim 1.3s infinite;
        }
        @keyframes pag-shim { from{background-position:200% 0} to{background-position:-200% 0} }

        .pag-empty { display:flex; flex-direction:column; align-items:center; gap:.5rem; text-align:center; padding:2.2rem 1.4rem; }
        .pag-empty-ico {
          display:inline-flex; align-items:center; justify-content:center;
          width:62px; height:62px; border-radius:50%;
          background:color-mix(in srgb, var(--sb-brand) 12%, transparent); color:var(--sb-brand-text);
        }
        .pag-empty strong { font-size:1rem; color:var(--sb-fg); font-weight:800; }
        .pag-empty span { font-size:.8rem; color:var(--sb-fg-muted); max-width:280px; line-height:1.4; }

        @media (max-width:380px) {
          .pag-summary { grid-template-columns:repeat(2,1fr); }
        }
      `}</style>
    </div>
  );
}
