// ─────────────────────────────────────────────────────────────────────────────
// Il muro di «Istruzione ed esperienza», e il suo interruttore.
//
// Sedici schede sono più schermate di qualunque altra sezione della home. A
// riposo se ne vede UNA FILA piena; la seconda si intravede sfocata sotto la
// sfumatura, che è il modo di dire «ce n'è dell'altro» senza scriverlo. Il
// bottone apre tutto.
//
// ── PERCHÉ È UN FILE A SÉ E NON DUE RIGHE IN App.tsx ────────────────────────
// Perché la home è UN SOLO componente. Uno `useState` lassù e ogni clic sul
// bottone rifarebbe anche il muro dei commit (1.100 rect), l'esploratore
// dell'archivio e la ritokenizzazione dello snippet dello stack. È lo stesso
// baco che si è pagato con lo scaffale delle sei pagine (commit b68398e):
// 67 ms mediani e otto long task, diventati 23 ms e nessuno appena lo stato è
// sceso nel componente che lo usa. Qui lo stato nasce già al posto giusto.
//
// ── PERCHÉ IL MURO È UNA GRIGLIA E NON `columns` ────────────────────────────
// Perché con `columns` la «prima fila» NON ESISTE: il contenuto scorre per
// colonne, e una `max-height` non taglia in basso — apre altre colonne di
// lato, e le schede in eccesso escono dal fianco invece di sfumare. Si perde
// l'incastro masonry, si guadagna una fila vera. Vedi `.sb-wall` in home.css.
// ─────────────────────────────────────────────────────────────────────────────
import { useId, useState } from "react";
import { IcChevronDown, IcFile } from "./homeIcons";

export interface CvItem {
  period: string;
  title: string;
  role: string;
  desc: string;
  wish?: boolean;
  pdf?: string;
  pdfLabel?: string;
}

export interface CvWallProps {
  items: CvItem[];
  /** Apre l'anteprima del PDF: la modale vive in App.tsx, non qui. */
  onOpenDoc: (url: string, title: string) => void;
}

export default function CvWall({ items, onOpenDoc }: CvWallProps) {
  const [open, setOpen] = useState(false);
  const wallId = useId();

  return (
    <>
      <div className="sb-wall-wrap" data-open={open ? "true" : "false"}>
        <div className="sb-wall" id={wallId}>
          {items.map((item) => (
            <div className={`sb-wall-card${item.wish ? " sb-wall-card--wish" : ""}`} key={item.title}>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-wall-inner">
                  <span className="sb-cv-period">{item.period}</span>
                  <h4 className="sb-cv-title">{item.title}</h4>
                  <p className="sb-cv-role">{item.role}</p>
                  <p className="sb-cv-desc">{item.desc}</p>
                  {item.pdf && (
                    <button
                      type="button"
                      onClick={() => onOpenDoc(item.pdf!, item.title)}
                      className="sb-cv-doc"
                      aria-haspopup="dialog"
                      // Chiuso, il muro è ritagliato ma le schede sotto sono
                      // ancora nel documento: senza questo il tabulatore ci
                      // finirebbe dentro e la pagina salterebbe su un bottone
                      // che nessuno vede. Gli unici elementi che prendono
                      // fuoco qui sono questi, quindi si spengono tutti e si
                      // riaccendono all'apertura — prima si preme «Show all».
                      tabIndex={open ? undefined : -1}
                    >
                      <IcFile size={15} />
                      <span>{item.pdfLabel || "Open document (PDF)"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sb-wall-actions">
        <button
          type="button"
          className="sb-btn sb-btn--sm sb-btn--secondary sb-wall-more"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={wallId}
        >
          {open ? "Show less" : <>Show all <span translate="no">{items.length}</span></>}
          <IcChevronDown size={15} />
        </button>
      </div>
    </>
  );
}
