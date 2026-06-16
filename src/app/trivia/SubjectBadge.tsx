import { useEffect, useState } from "react";
import { fetchSubject, type SubjectReport } from "./gradesApi";

interface SubjectBadgeProps {
  dark: boolean;
  nick: string;
  argomento: string;
}

/**
 * Badge "in alto a sinistra" durante il quiz: se il giocatore ha GIÀ un voto su
 * questo argomento (record dei tipi completati), lo mostra — così capisce al
 * volo "se fa schifo o meno" rispetto alle volte precedenti. Se non c'è nessun
 * voto, non mostra nulla. I dati arrivano dall'account (per nome), quindi valgono
 * anche se i voti sono stati presi su un altro dispositivo.
 */
export default function SubjectBadge({ dark, nick, argomento }: SubjectBadgeProps) {
  const [subj, setSubj] = useState<SubjectReport | null>(null);

  useEffect(() => {
    let alive = true;
    setSubj(null);
    if (!nick || !argomento) return;
    fetchSubject(nick, argomento).then(s => { if (alive) setSubj(s); }).catch(() => {});
    return () => { alive = false; };
  }, [nick, argomento]);

  if (!subj || subj.cells.length === 0) return null;

  // Voto sintetico dell'argomento = media dei record dei tipi.
  const avg = subj.avgAccuracy;
  // Riusa la scala lettera del primo cell? Meglio ricalcolare dalla media.
  const best = subj.cells.reduce((a, b) => (b.best.accuracy > a.best.accuracy ? b : a), subj.cells[0]);
  const color = dark ? best.best.grade.colorDark : best.best.grade.color;

  return (
    <div className={`trv-subjbadge${dark ? " dark" : ""}`} title={`Il tuo record su "${argomento}": media ${avg}%`}>
      <span className="trv-subjbadge-lbl">già fatto</span>
      <span className="trv-subjbadge-grade" style={{ color }}>{best.best.grade.letter}</span>
      <span className="trv-subjbadge-pct">{avg}%</span>
      <style>{`
        .trv-subjbadge {
          display:inline-flex; align-items:center; gap:.3rem;
          background:rgba(255,255,255,0.92); border:1px solid rgba(47,125,74,0.25);
          border-radius:999px; padding:.18rem .5rem; box-shadow:0 2px 8px rgba(6,22,14,0.18);
          font-family:"Titillium Web", Geneva, Tahoma, sans-serif;
          animation:trv-subjbadge-in .3s ease;
        }
        .trv-subjbadge.dark { background:rgba(20,33,26,0.92); border-color:rgba(95,208,154,0.3); }
        @keyframes trv-subjbadge-in { from{opacity:0; transform:translateY(-4px)} to{opacity:1; transform:none} }
        .trv-subjbadge-lbl { font-size:.54rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:#9aa89e; }
        .trv-subjbadge-grade { font-size:1rem; font-weight:900; line-height:1; }
        .trv-subjbadge-pct { font-size:.66rem; font-weight:800; color:#6b8070; font-variant-numeric:tabular-nums; }
        .trv-subjbadge.dark .trv-subjbadge-pct { color:#8fc7a6; }
      `}</style>
    </div>
  );
}
