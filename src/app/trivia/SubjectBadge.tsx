import { useEffect, useState } from "react";
import { fetchSubject, type SubjectReport } from "./gradesApi";

interface SubjectBadgeProps {
  dark: boolean;
  nick: string;
  chapterId: string;   // chiave del pacchetto = slug del capitolo
  label: string;       // etichetta mostrata (titolo del capitolo)
}

/**
 * Badge "in alto a sinistra" durante il quiz: se il giocatore ha GIÀ un voto su
 * questo CAPITOLO (record dei tipi completati), lo mostra — così capisce al
 * volo "se fa schifo o meno" rispetto alle volte precedenti. Se non c'è nessun
 * voto, non mostra nulla. I dati arrivano dall'account (per nome), quindi valgono
 * anche se i voti sono stati presi su un altro dispositivo.
 */
export default function SubjectBadge({ dark, nick, chapterId, label }: SubjectBadgeProps) {
  const [subj, setSubj] = useState<SubjectReport | null>(null);

  useEffect(() => {
    let alive = true;
    setSubj(null);
    if (!nick || !chapterId) return;
    fetchSubject(nick, chapterId).then(s => { if (alive) setSubj(s); }).catch(() => {});
    return () => { alive = false; };
  }, [nick, chapterId]);

  if (!subj || subj.cells.length === 0) return null;

  // Voto sintetico dell'argomento = media dei record dei tipi.
  const avg = subj.avgAccuracy;
  // Riusa la scala lettera del primo cell? Meglio ricalcolare dalla media.
  const best = subj.cells.reduce((a, b) => (b.best.accuracy > a.best.accuracy ? b : a), subj.cells[0]);
  const color = dark ? best.best.grade.colorDark : best.best.grade.color;

  return (
    <div className={`trv-subjbadge${dark ? " dark" : ""}`} title={`Il tuo record su "${label}": media ${avg}%`}>
      <span className="trv-subjbadge-lbl">già fatto</span>
      <span className="trv-subjbadge-grade" style={{ color }}>{best.best.grade.letter}</span>
      <span className="trv-subjbadge-pct">{avg}%</span>
      <style>{`
        /* Dai token --sb-*: la coppia chiaro/scuro scritta a mano non serve più.
           La pillola sta sopra la foto della domanda, quindi il fondo è quasi
           pieno (92%) e non di vetro: deve staccare dall'immagine. */
        .trv-subjbadge {
          display:inline-flex; align-items:center; gap:.3rem;
          background:color-mix(in srgb, var(--sb-surface-75) 92%, transparent);
          border:1px solid var(--sb-border-strong);
          clip-path:var(--sb-shape-xs); padding:.18rem .5rem; box-shadow:0 2px 8px rgba(0,0,0,0.18);
          font-family:var(--font-site);
          animation:trv-subjbadge-in .3s ease;
        }
        @keyframes trv-subjbadge-in { from{opacity:0; transform:translateY(-4px)} to{opacity:1; transform:none} }
        .trv-subjbadge-lbl { font-size:.54rem; font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--sb-fg-muted); }
        .trv-subjbadge-grade { font-size:1rem; font-weight:900; line-height:1; }
        .trv-subjbadge-pct { font-size:.66rem; font-weight:800; color:var(--sb-fg-light); font-variant-numeric:tabular-nums; }
      `}</style>
    </div>
  );
}
