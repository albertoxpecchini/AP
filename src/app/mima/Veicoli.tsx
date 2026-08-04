import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft, IcCar, IcRuler, IcClock, IcUsers, IcCube,
} from "../site/homeIcons";
import { PageBackdrop, ShinyBrandline, SparkGroup } from "../site/homeFx";
import "../home.css";
import "./mima.css";
import "./veicoli.css";

// ─────────────────────────────────────────────────────────────────────────────
// /mima/veicoli — quale auto portare a MiMa (Milano Marittima, 13–17 agosto
// 2026). Non è il confronto generico "quale auto comprare": è tarato su QUESTO
// viaggio — Rivalta sul Mincio → Cervia, 3 persone (Pekko, Jonny, Mok), un
// weekend lungo al mare — quindi i punteggi cambiano rispetto a un confronto
// astratto (es. la doppia auto perde senso quando bastano 3 posti). Km e costi
// carburante sono stime di viaggio, non i dati reali tracciati in Mima.tsx
// (quelli restano "da inserire" finché non arrivano i numeri veri).
// ─────────────────────────────────────────────────────────────────────────────

const PEOPLE = ["Pekko", "Jonny", "Mok"];

interface Option {
  key: string;
  tag?: string;
  name: string;
  sub: string;
  score: number;
  meta: string[];
}

const OPTIONS: Option[] = [
  {
    key: "a",
    name: "A · GLA + Tucson",
    sub: "due auto per 3 persone",
    score: 25,
    meta: ["Un'auto viaggerebbe vuota", "Stima pieno+pedaggio: raddoppiati"],
  },
  {
    key: "b",
    name: "B · Mercedes-Benz GLA",
    sub: "2021 · 5 posti, 435 L",
    score: 39,
    meta: ["Motore non specificato — stima su valori tipici benzina/diesel", "Stima pieno A/R: ~35 €"],
  },
  {
    key: "c",
    tag: "Scelta per MiMa",
    name: "C · Hyundai Tucson",
    sub: "1.6 CRDI 48V DCT Excellence · 546 L",
    score: 41,
    meta: ["Diesel mild-hybrid, cambio DCT", "Stima pieno A/R: ~28 €"],
  },
  {
    key: "d",
    name: "D · Ford Transit Custom",
    sub: "270 2.0 TDCi PC Furgone Trend · 3 posti",
    score: 28,
    meta: ["Passo corto, ~6 m³ di stiva", "Stima pieno A/R: ~40 €"],
  },
];

interface Row {
  crit: string;
  note: string;
  cells: { pct: number; note: string }[];
}

const ROWS: Row[] = [
  {
    crit: "Consumi",
    note: "stima su ~300 km A/R",
    cells: [
      { pct: 20, note: "due auto: una raddoppia il pieno senza motivo" },
      { pct: 60, note: "~6-7 L/100km, motore non specificato" },
      { pct: 80, note: "~5,3-5,7 L/100km diesel mild-hybrid, la meno assetata" },
      { pct: 20, note: "~7,5-8,5 L/100km 2.0 TDCi, la più assetata" },
    ],
  },
  {
    crit: "Costi",
    note: "pieno + gestione per il viaggio",
    cells: [
      { pct: 20, note: "pieno e pedaggio raddoppiati per lo stesso gruppo" },
      { pct: 60, note: "stima pieno A/R ~35 €, tagliandi premium" },
      { pct: 80, note: "stima pieno A/R ~28 €, il più economico" },
      { pct: 40, note: "stima pieno A/R ~40 €, usura da mezzo commerciale" },
    ],
  },
  {
    crit: "Emissioni",
    note: "g CO₂/km",
    cells: [
      { pct: 20, note: "doppia impronta per lo stesso spostamento" },
      { pct: 60, note: "~150-165 g/km, motore non specificato" },
      { pct: 80, note: "~139-149 g/km diesel mild-hybrid, la più pulita" },
      { pct: 20, note: "~195-215 g/km, la più inquinante" },
    ],
  },
  {
    crit: "Capienza",
    note: "persone + bagagli per 4 notti",
    cells: [
      { pct: 60, note: "10 posti disponibili, ma solo 3 servono" },
      { pct: 80, note: "3 persone comode, 435 L bastano" },
      { pct: 100, note: "546 L: ombrellone, borsone e gonfiabili ci stanno" },
      { pct: 100, note: "3 posti esatti + ~6 m³ di stiva (passo corto)" },
    ],
  },
  {
    crit: "Efficienza",
    note: "auto giusta per questo viaggio",
    cells: [
      { pct: 20, note: "zero senso usare due auto per lo stesso gruppo" },
      { pct: 80, note: "buona ma con 5 posti sempre occupati per niente" },
      { pct: 100, note: "il miglior rapporto spazio/consumi/prezzo per 3" },
      { pct: 60, note: "passo corto: meno sprecato di un furgone grande, ma resta tanto per un weekend" },
    ],
  },
  {
    crit: "Sicurezza",
    note: "Euro NCAP, ADAS",
    cells: [
      { pct: 100, note: "entrambe 5 stelle" },
      { pct: 100, note: "5 stelle Euro NCAP (H247)" },
      { pct: 100, note: "5 stelle, allestimento Excellence con ADAS ampi" },
      { pct: 60, note: "Van Euro NCAP solido, ma ADAS extra sull'allestimento Trend" },
    ],
  },
  {
    crit: "Parcheggi",
    note: "vie del pinareto ad agosto",
    cells: [
      { pct: 40, note: "due posti auto da trovare — quasi impossibile ad agosto" },
      { pct: 80, note: "4,41 m, la più agile nelle vie strette" },
      { pct: 60, note: "4,50 m, poco meno agile ma gestibile" },
      { pct: 60, note: "passo corto (~4,97 m): più lunga di un'auto, ma non un furgone gigante" },
    ],
  },
  {
    crit: "Ingombri",
    note: "dimensioni fisiche",
    cells: [
      { pct: 60, note: "due mezzi da gestire in un solo weekend" },
      { pct: 80, note: "compatta, la più maneggevole" },
      { pct: 60, note: "poco più ingombrante del GLA, ma comoda" },
      { pct: 60, note: "~4,97 m, tetto basso (~2 m): la più alta, ma non il mastodontico Transit passo lungo" },
    ],
  },
  {
    crit: "Km",
    note: "autonomia per pieno",
    cells: [
      { pct: 80, note: "buona su entrambe, ma irrilevante se una resta a casa" },
      { pct: 80, note: "~750 km, un pieno copre tutto il weekend" },
      { pct: 100, note: "ottima autonomia diesel" },
      { pct: 100, note: "serbatoio grande, ampia anche a pieno carico" },
    ],
  },
  {
    crit: "Aura",
    note: "livello di cool",
    cells: [
      { pct: 80, note: "status alto ma sprecato: due auto per 3 persone non è cool" },
      { pct: 100, note: "l'arrivo più d'effetto sul lungomare" },
      { pct: 60, note: "design moderno, meno status ma bella in spiaggia" },
      { pct: 40, note: "il van-life è cool, ma l'allestimento Trend è da lavoro, non da vacanza" },
    ],
  },
];

export default function Veicoli() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Quale auto? — MiMa";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sb-home sb-home--fx mima-page">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      </div>

      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-mima-tagline">Piano vacanza · MiMa</span>
          </Link>
          <Link to="/mima" className="sb-btn sb-btn--sm sb-btn--secondary sb-mima-back">
            <IcArrowLeft size={15} /> Torna a MiMa
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero */}
        <section className="sb-hero" aria-labelledby="veic-hero-title">
          <div className="sb-container">
            <p className="sb-mima-eyebrow"><IcCar size={14} /> Come arriviamo</p>
            <h1 className="sb-hero-title" id="veic-hero-title">
              <span>Quale auto portiamo?</span>
              <ShinyBrandline text="Milano Marittima · 13 → 17 agosto 2026" className="sb-brandline" />
            </h1>
            <div className="sb-hero-copy" style={{ marginTop: "1.1rem" }}>
              <p>
                <strong>Pekko, Jonny e Mok</strong>, un solo viaggio da Rivalta sul Mincio a Cervia.
                Confronto su dieci criteri reali tra la <strong>Mercedes-Benz GLA (2021)</strong>, la{" "}
                <strong>Hyundai Tucson 1.6 CRDI 48V DCT Excellence</strong> e il{" "}
                <strong>Ford Transit Custom 270 2.0 TDCi PC Furgone Trend</strong> — tarato su questo
                weekend al mare, non in astratto.
              </p>
            </div>
            <div className="sb-chiprow sb-mima-people">
              {PEOPLE.map((p) => (
                <span key={p} className="sb-chip">{p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ② A colpo d'occhio */}
        <section className="sb-section sb-mima-tight" aria-label="A colpo d'occhio">
          <div className="sb-container">
            <div className="sb-mima-facts sb-mima-facts--4">
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcRuler size={18} /></span>
                  <span className="sb-mima-fact-value">~150 km</span>
                  <span className="sb-mima-fact-label">distanza a tratta (stima)</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcClock size={18} /></span>
                  <span className="sb-mima-fact-value">~1h50</span>
                  <span className="sb-mima-fact-label">durata a tratta (stima)</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcUsers size={18} /></span>
                  <span className="sb-mima-fact-value">3 persone</span>
                  <span className="sb-mima-fact-label">Pekko, Jonny, Mok</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcCube size={18} /></span>
                  <span className="sb-mima-fact-value">4 notti</span>
                  <span className="sb-mima-fact-label">bagaglio da mare</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ Le opzioni per questo viaggio */}
        <section className="sb-section" aria-labelledby="veic-opzioni">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">01 — Opzioni</span>
              <h2 id="veic-opzioni">Le quattro opzioni, per MiMa</h2>
            </div>
            <p className="sb-mima-note">
              Modelli esatti: <strong>Mercedes-Benz GLA (2021)</strong> ·{" "}
              <strong>Hyundai Tucson 1.6 CRDI 48V DCT Excellence</strong> ·{" "}
              <strong>Ford Transit Custom 270 2.0 TDCi PC Furgone Trend</strong>.
            </p>
            <div className="sb-mima-veic-cards">
              {OPTIONS.map((o) => (
                <div key={o.key} className={`sb-panel sb-mima-veic-card ${o.tag ? "is-winner" : ""}`}>
                  {o.tag && <span className="sb-mima-veic-tag">{o.tag}</span>}
                  <div className="sb-panel-inner sb-mima-veic-card-inner">
                    <p className="sb-mima-veic-name">{o.name}</p>
                    <p className="sb-mima-veic-sub">{o.sub}</p>
                    <p className="sb-mima-veic-score"><b>{o.score}</b><span>/50</span></p>
                    <ul className="sb-mima-veic-meta">
                      {o.meta.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Confronto per criterio */}
        <section className="sb-section" aria-labelledby="veic-criteri">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">02 — Criteri</span>
              <h2 id="veic-criteri">Confronto per criterio</h2>
            </div>
            <div className="sb-mima-veic-scroll">
              <table className="sb-mima-veic-table">
                <thead>
                  <tr>
                    <th>Criterio</th>
                    <th>A · GLA+Tucson</th>
                    <th>B · GLA</th>
                    <th>C · Tucson CRDI</th>
                    <th>D · Transit Custom</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.crit}>
                      <td className="sb-mima-veic-crit">
                        {r.crit}
                        <span className="sb-mima-veic-crit-note">{r.note}</span>
                      </td>
                      {r.cells.map((c, i) => (
                        <td key={i} className="sb-mima-veic-cell">
                          <div className="sb-mima-veic-barrow">
                            <div className="sb-mima-veic-bar"><i style={{ width: `${c.pct}%` }} /></div>
                            <span className="sb-mima-veic-num">{Math.round(c.pct / 20)}/5</span>
                          </div>
                          <span className="sb-mima-veic-cellnote">{c.note}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ⑤ Verdetto */}
        <section className="sb-section" aria-labelledby="veic-verdetto">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">03 — Verdetto</span>
              <h2 id="veic-verdetto">Cosa portiamo</h2>
            </div>
            <div className="sb-panel">
              <div className="sb-panel-inner sb-mima-veic-verdict">
                <span className="sb-mima-veic-verdict-label">Scelta per MiMa</span>
                <p>
                  Per questo viaggio — 3 persone, Rivalta sul Mincio → Cervia, un solo weekend —
                  la <strong>Hyundai Tucson 1.6 CRDI 48V DCT Excellence (opzione C)</strong> vince
                  nettamente: bagagliaio più capiente delle altre auto a 5 posti, consumi diesel
                  mild-hybrid più bassi sui ~300 km andata/ritorno, e resta comunque facile da
                  parcheggiare vicino al pinareto. Se conta più l'arrivo in spiaggia che il
                  risparmio, la <strong>GLA (opzione B)</strong> è un'alternativa valida, di poco
                  dietro.
                </p>
              </div>
            </div>
            <div className="sb-mima-veic-why">
              <div className="sb-mima-veic-why-row">
                <strong>Perché non A</strong>
                <span>
                  Nel confronto generale i 10 posti totali sono un pregio; per 3 persone diventano
                  solo un'auto vuota, doppio pieno e doppio posto auto da trovare ad agosto.
                </span>
              </div>
              <div className="sb-mima-veic-why-row">
                <strong>Perché non D</strong>
                <span>
                  Il Transit Custom a passo corto si parcheggia meglio di quanto sembri (~4,97 m,
                  non un furgone gigante) e i 3 posti tornano comodi, ma resta il più assetato e il
                  più inquinante del confronto — pensato per portare carico, non per un weekend tra
                  amici.
                </span>
              </div>
            </div>
            <p className="sb-mima-note" style={{ marginTop: "1.4rem" }}>
              Stime indicative sul modello e allestimento più comuni — non sostituiscono un
              preventivo reale. I km e il carburante veri del viaggio restano tracciati in MiMa,
              sezione "Come ci si arriva".
            </p>
            <SparkGroup className="sb-hero-actions">
              <Link to="/mima" className="sb-btn sb-btn--secondary">
                <IcArrowLeft size={16} /> Torna a MiMa
              </Link>
            </SparkGroup>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
