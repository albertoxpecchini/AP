import { Suspense, lazy, useMemo, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcArrowLeft, IcBookOpen, IcCalculator, IcCar, IcCompass, IcGrid, IcHelp,
  IcListCheck, IcPin, IcRanking, IcRuler, IcTrophy,
} from "../site/homeIcons";
import { ShinyBrandline, SparkGroup } from "../site/homeFx";
import { MimaPage, Mod, KV, Meter, Tbd, type Tick } from "./MimaShell";
import {
  CHEAPEST_CASA, CHEAPEST_VAC, DIESEL_GAP, DIESEL_MAX_CASA, DIESEL_MAX_VAC,
  DIESEL_MIN_CASA, DIESEL_MIN_VAC, FUEL_PRICE_DEFAULT, PEOPLE, ROAD_KM_ONE_WAY,
  ROAD_MIN_ONE_WAY, ROUND_TRIP_KM, STATIONS, VEHICLES, estimateOption, euro,
  hhmm, num, rangeKm, stationsIn, type Vehicle, type VehicleKey, type Zone,
} from "./mimaData";
import "../home.css";
import "./mima.css";
import "./veicoli.css";

const MimaRouteMap = lazy(() => import("./MimaRouteMap"));

// ─────────────────────────────────────────────────────────────────────────────
// /mima/veicoli — quale auto portare a MiMa (13–17 agosto 2026). Non è il
// confronto generico "quale auto comprare": è tarato su QUESTO viaggio —
// Rivalta sul Mincio → Cervia, 3 persone, un weekend lungo al mare — quindi i
// punteggi cambiano rispetto a un confronto astratto (la doppia auto perde
// senso quando bastano 3 posti).
//
// Due cose sono cambiate rispetto alla prima versione:
//
// 1. I punteggi NON sono più scritti a mano. Si sommano dalle celle di ROWS
//    (somma dei pct ÷ 20) e vengono identici ai vecchi 25/39/41/28 — solo che
//    ora, se cambio una valutazione, la classifica si aggiorna da sola invece
//    di restare a raccontare i numeri di prima.
//
// 2. Le stime carburante partono da mimaData.ts, dove il percorso è stato
//    corretto: la pagina diceva "~150 km a tratta", ma fra Rivalta e Cervia ci
//    sono già ~168 km in linea d'aria. Ora sono ~230 km, e ogni euro scritto
//    qui sotto è calcolato da lì.
// ─────────────────────────────────────────────────────────────────────────────

interface Row {
  crit: string;
  note: string;
  cells: { pct: number; note: string }[];
}

/** Stime a pieno viaggio (andata e ritorno) alle condizioni di partenza. */
const EST = {
  a: estimateOption("a", ROUND_TRIP_KM, FUEL_PRICE_DEFAULT),
  b: estimateOption("b", ROUND_TRIP_KM, FUEL_PRICE_DEFAULT),
  c: estimateOption("c", ROUND_TRIP_KM, FUEL_PRICE_DEFAULT),
  d: estimateOption("d", ROUND_TRIP_KM, FUEL_PRICE_DEFAULT),
};

const ROWS: Row[] = [
  {
    crit: "Consumi",
    note: `stima su ~${ROUND_TRIP_KM} km A/R`,
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
      { pct: 20, note: `pieno raddoppiato per lo stesso gruppo: ~${euro(EST.a.cost)}` },
      { pct: 60, note: `stima pieno A/R ~${euro(EST.b.cost)}, tagliandi premium` },
      { pct: 80, note: `stima pieno A/R ~${euro(EST.c.cost)}, il più economico` },
      { pct: 40, note: `stima pieno A/R ~${euro(EST.d.cost)}, usura da mezzo commerciale` },
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
      { pct: 80, note: `~${rangeKm(VEHICLES.gla)} km, un pieno copre tutto il weekend` },
      { pct: 100, note: `~${rangeKm(VEHICLES.tucson)} km: ottima autonomia diesel` },
      { pct: 100, note: `~${rangeKm(VEHICLES.transit)} km, serbatoio grande` },
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

interface OptionMeta {
  key: string;
  label: string;
  short: string;
  sub: string;
  winner?: boolean;
}

const OPTIONS: OptionMeta[] = [
  { key: "a", label: "A · GLA + Tucson", short: "A · GLA+Tucson", sub: "due auto per 3 persone" },
  { key: "b", label: "B · Mercedes-Benz GLA", short: "B · GLA", sub: "2021 · 5 posti, 435 L" },
  { key: "c", label: "C · Hyundai Tucson", short: "C · Tucson CRDI", sub: "1.6 CRDI 48V DCT Excellence · 546 L", winner: true },
  { key: "d", label: "D · Ford Transit Custom", short: "D · Transit Custom", sub: "270 2.0 TDCi PC Furgone Trend · 3 posti" },
];

/** CALCOLATO: 10 criteri × 5 punti. Somma dei pct della colonna ÷ 20. */
const SCORES = OPTIONS.map((_, i) => ROWS.reduce((s, r) => s + r.cells[i].pct, 0) / 20);
const MAX_SCORE = ROWS.length * 5;
const BEST_SCORE = Math.max(...SCORES);

const SPEC_KEYS: VehicleKey[] = ["gla", "tucson", "transit"];

interface SpecRow {
  k: string;
  get: (v: Vehicle) => string;
  n?: (v: Vehicle) => number;
  better?: "min" | "max";
  tbd?: string;
}

const SPEC_ROWS: SpecRow[] = [
  { k: "Alimentazione", get: (v) => v.fuel },
  { k: "Cambio", get: (v) => v.gearbox },
  { k: "Posti", get: (v) => String(v.seats), n: (v) => v.seats, better: "max" },
  { k: "Bagagliaio", get: (v) => v.boot },
  { k: "Lunghezza", get: (v) => `${num(v.length, 2)} m`, n: (v) => v.length, better: "min" },
  { k: "Larghezza", get: (v) => `${num(v.width, 2)} m`, tbd: "stima" },
  { k: "Altezza", get: (v) => `${num(v.height, 2)} m`, tbd: "stima" },
  {
    k: "Consumo",
    get: (v) => `${num(v.lPer100[0], 1)}–${num(v.lPer100[1], 1)} L/100km`,
    n: (v) => (v.lPer100[0] + v.lPer100[1]) / 2,
    better: "min",
    tbd: "stima",
  },
  {
    k: "CO₂",
    get: (v) => `${v.co2[0]}–${v.co2[1]} g/km`,
    n: (v) => (v.co2[0] + v.co2[1]) / 2,
    better: "min",
    tbd: "stima",
  },
  { k: "Autonomia", get: (v) => `~${rangeKm(v)} km`, n: (v) => rangeKm(v), better: "max", tbd: "stima" },
];

// Scala degli ingombri: 6 m di fondo scala, così il posto auto standard (5 m)
// cade dentro e si vede quanto poco margine lascia il Transit.
const SIZE_SCALE = 6;
const PARK_SPACE = 5;

const MARKS = [
  { to: "#mod-classifica", n: "01", label: "Classifica" },
  { to: "#mod-specifiche", n: "02", label: "Scheda tecnica" },
  { to: "#mod-matrice", n: "03", label: "Matrice criteri" },
  { to: "#mod-simulatore", n: "04", label: "Simulatore costi" },
  { to: "#mod-distributori", n: "05", label: "Distributori" },
  { to: "#mod-ingombri", n: "06", label: "Ingombri" },
  { to: "#mod-percorso", n: "07", label: "Percorso" },
  { to: "#mod-verdetto", n: "08", label: "Verdetto" },
];

// ── Distributori ─────────────────────────────────────────────────────────────
// Prezzi veri dell'Osservaprezzi, non stime: per questo ogni riga si porta
// dietro la data del rilevamento — un prezzo di quattro giorni fa, ad agosto,
// è già vecchio.
//
// I due guadagni qui sotto servono a tenere la prosa onesta. Il primo (cambiare
// zona) sembra un consiglio ma vale meno di un euro sull'intero viaggio; il
// secondo (evitare il servito) ne vale dieci volte tanto. Calcolarli invece di
// raccontarli evita di scrivere una raccomandazione sproporzionata.
const SERVITO_MAX = Math.max(
  ...STATIONS.map((s) => s.gasolioServito).filter((n): n is number => typeof n === "number"),
);
const litriAR = estimateOption("c", ROUND_TRIP_KM, 1).liters;
const GAIN_ZONA = litriAR * DIESEL_GAP;
const GAIN_SELF = litriAR * (SERVITO_MAX - DIESEL_MIN_VAC);

function DistributoriMod() {
  const [zona, setZona] = useState<Zone>("casa");
  const righe = stationsIn(zona);
  const min = righe[0].gasolioSelf;

  return (
    <Mod
      id="mod-distributori"
      icon={<IcPin size={14} />}
      title="Dove fare il pieno"
      meta={
        <span className="sb-tabs sb-mima-veic-zonetabs">
          {(["casa", "vacanza"] as Zone[]).map((z) => (
            <button
              key={z}
              type="button"
              className="sb-tab"
              aria-selected={zona === z}
              onClick={() => setZona(z)}
            >
              {z === "casa" ? "Rivalta" : "Cervia"}
            </button>
          ))}
        </span>
      }
    >
      <div className="sb-mima-kpis">
        <div className="sb-mima-kpi">
          <span className="sb-mima-kpi-k">Gasolio self · Rivalta</span>
          <span className="sb-mima-kpi-v" data-no-i18n translate="no">
            {num(DIESEL_MIN_CASA, 3)} – {num(DIESEL_MAX_CASA, 3)} €
          </span>
        </div>
        <div className="sb-mima-kpi">
          <span className="sb-mima-kpi-k">Gasolio self · Cervia</span>
          <span className="sb-mima-kpi-v" data-no-i18n translate="no">
            {num(DIESEL_MIN_VAC, 3)} – {num(DIESEL_MAX_VAC, 3)} €
          </span>
        </div>
        <div className="sb-mima-kpi">
          <span className="sb-mima-kpi-k">Self vs servito, peggio caso</span>
          <span className="sb-mima-kpi-v" data-no-i18n translate="no">
            +{num((SERVITO_MAX - DIESEL_MIN_VAC) * 100, 0)} cent/L
          </span>
        </div>
      </div>

      <div className="sb-mima-veic-stations">
        <table className="sb-mima-data-table">
          <thead>
            <tr>
              <th scope="col">Distributore</th>
              <th scope="col">Gasolio self</th>
              <th scope="col">Benzina self</th>
              <th scope="col">Servito</th>
              <th scope="col">Rilevato</th>
            </tr>
          </thead>
          <tbody>
            {righe.map((s) => (
              <tr key={s.name}>
                <th scope="row" className={s.gasolioSelf === min ? "is-best" : ""}>{s.name}</th>
                <td className={s.gasolioSelf === min ? "is-best" : ""} data-no-i18n translate="no">
                  {num(s.gasolioSelf, 3)} €
                </td>
                <td data-no-i18n translate="no">{num(s.benzinaSelf, 3)} €</td>
                <td data-no-i18n translate="no">
                  {s.gasolioServito ? `${num(s.gasolioServito, 3)} €` : "—"}
                </td>
                <td data-no-i18n translate="no">{s.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sb-mima-kv">
        <KV k="Più conveniente qui" v={`${CHEAPEST_CASA.name} · ${num(CHEAPEST_CASA.gasolioSelf, 3)} €/L`} />
        <KV k="Più conveniente giù" v={`${CHEAPEST_VAC.name} · ${num(CHEAPEST_VAC.gasolioSelf, 3)} €/L`} />
        <KV k="Scegliere la zona vale" v={`${euro(GAIN_ZONA)} su tutto il viaggio`} tbd="stima" />
        <KV k="Evitare il servito vale" v={`fino a ${euro(GAIN_SELF)} su tutto il viaggio`} tbd="stima" />
      </div>

      <p className="sb-mima-modnote">
        In zona vacanza il gasolio costa {num(DIESEL_GAP * 100, 1)} centesimi al litro meno che a
        casa — ma su un pieno andata e ritorno della Tucson fanno{" "}
        <strong>{euro(GAIN_ZONA)}</strong>: vero, e irrilevante. Non organizzatevi attorno a
        questo. Quello che pesa davvero è <strong>self contro servito</strong>: fra il servito più
        caro ({num(SERVITO_MAX, 3)} €) e il self più conveniente ci sono{" "}
        {num((SERVITO_MAX - DIESEL_MIN_VAC) * 100, 0)} centesimi al litro, cioè{" "}
        <strong>{euro(GAIN_SELF)}</strong> sullo stesso viaggio — più di dieci volte tanto. I
        prezzi vengono dall'Osservaprezzi e la colonna "rilevato" dice di quando sono: ad agosto
        si muovono, riverificateli prima di partire.
        <Tbd>prezzi al 5 agosto</Tbd>
      </p>
    </Mod>
  );
}

// ── Simulatore ───────────────────────────────────────────────────────────────
function SimulatoreMod() {
  const [km, setKm] = useState(ROUND_TRIP_KM);
  const [price, setPrice] = useState(FUEL_PRICE_DEFAULT);

  const rows = useMemo(
    () => OPTIONS.map((o) => ({ o, est: estimateOption(o.key, km, price) })),
    [km, price],
  );
  const maxCost = Math.max(...rows.map((r) => r.est.cost), 1);

  return (
    <Mod
      id="mod-simulatore"
      icon={<IcCalculator size={14} />}
      title="Simulatore costi"
      meta={`${PEOPLE.length} persone`}
    >
      <div className="sb-mima-veic-sim-form">
        <div className="sb-mima-veic-sim-field">
          <label htmlFor="sim-km">Chilometri</label>
          <input
            id="sim-km"
            type="number"
            min={0}
            step={10}
            value={km}
            onChange={(e) => setKm(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="sb-mima-veic-sim-field">
          <label htmlFor="sim-price">Prezzo al litro (€)</label>
          <input
            id="sim-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <button
          type="button"
          className="sb-btn sb-btn--sm sb-btn--secondary"
          onClick={() => { setKm(ROUND_TRIP_KM); setPrice(FUEL_PRICE_DEFAULT); }}
        >
          A/R Rivalta → Cervia
        </button>
      </div>

      <div className="sb-mima-data">
        <table className="sb-mima-data-table">
          <thead>
            <tr>
              <th scope="col">Opzione</th>
              <th scope="col">Litri</th>
              <th scope="col">Costo</th>
              <th scope="col">A testa</th>
              <th scope="col">CO₂</th>
              <th scope="col">Peso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ o, est }) => (
              <tr key={o.key}>
                <th scope="row" className={o.winner ? "is-best" : ""}>{o.short}</th>
                <td>{num(est.liters, 1)} L</td>
                <td className={o.winner ? "is-best" : ""}>{euro(est.cost)}</td>
                <td>{euro(est.perPerson)}</td>
                <td>{num(est.co2kg, 1)} kg</td>
                <td><Meter pct={(est.cost / maxCost) * 100} muted={!o.winner} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sb-mima-modnote">
        Consumi medi dell'intervallo dichiarato per ogni modello, costo diviso per{" "}
        {PEOPLE.length}. Il valore di partenza è il viaggio vero — {ROUND_TRIP_KM} km andata e
        ritorno a {euro(FUEL_PRICE_DEFAULT)}/L — ma i campi si cambiano.
        <Tbd>tutte stime</Tbd>
      </p>
    </Mod>
  );
}

// ── Matrice ──────────────────────────────────────────────────────────────────
function MatriceMod() {
  const [compact, setCompact] = useState(false);

  return (
    <Mod
      id="mod-matrice"
      icon={<IcGrid size={14} />}
      title="Matrice criteri"
      meta={
        <button
          type="button"
          className="sb-btn sb-btn--sm sb-btn--ghost"
          onClick={() => setCompact((c) => !c)}
          aria-pressed={compact}
        >
          {compact ? "mostra note" : "nascondi note"}
        </button>
      }
    >
      <div className="sb-mima-veic-scroll">
        <table className={`sb-mima-veic-table ${compact ? "is-compact" : ""}`}>
          <thead>
            <tr>
              <th scope="col">Criterio</th>
              {OPTIONS.map((o) => (
                <th key={o.key} scope="col">{o.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const best = Math.max(...r.cells.map((c) => c.pct));
              return (
                <tr key={r.crit}>
                  <th scope="row" className="sb-mima-veic-crit">
                    {r.crit}
                    <span className="sb-mima-veic-crit-note">{r.note}</span>
                  </th>
                  {r.cells.map((c, i) => (
                    <td key={i} className={`sb-mima-veic-cell ${c.pct === best ? "is-best" : ""}`}>
                      <div className="sb-mima-veic-cellbox">
                        <div className="sb-mima-veic-barrow">
                          <div className="sb-mima-veic-bar"><i style={{ width: `${c.pct}%` }} /></div>
                          <span className="sb-mima-veic-num">{Math.round(c.pct / 20)}/5</span>
                        </div>
                        <span className="sb-mima-veic-cellnote">{c.note}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="sb-mima-veic-crit">Totale</th>
              {SCORES.map((s, i) => (
                <td key={i} data-no-i18n translate="no">{s}/{MAX_SCORE}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="sb-mima-modnote">
        La cella evidenziata è la migliore della riga (a pari merito, tutte). I totali in fondo
        sono la somma delle righe, non un voto dato a parte.
      </p>
    </Mod>
  );
}

// ── Pagina ───────────────────────────────────────────────────────────────────
export default function Veicoli() {
  const ranked = useMemo(
    () =>
      OPTIONS.map((o, i) => ({ o, score: SCORES[i] }))
        .sort((x, y) => y.score - x.score),
    [],
  );

  const winner = OPTIONS.find((o) => o.winner)!;
  const winnerScore = SCORES[OPTIONS.indexOf(winner)];
  const runnerUp = ranked.find((r) => r.o.key !== winner.key)!;

  const ticker: Tick[] = [
    { k: "tratta", v: `~${ROAD_KM_ONE_WAY} km` },
    { k: "durata", v: `~${hhmm(ROAD_MIN_ONE_WAY)}` },
    { k: "A/R", v: `${ROUND_TRIP_KM} km` },
    { k: "opzioni", v: String(OPTIONS.length) },
    { k: "scelta", v: "Tucson CRDI" },
    { k: "punteggio", v: `${winnerScore}/${MAX_SCORE}` },
    { k: "pieno A/R", v: euro(EST.c.cost) },
    { k: "a testa", v: euro(EST.c.perPerson) },
  ];

  return (
    <MimaPage
      title="Quale auto? — MiMa"
      back="/mima"
      backLabel="Torna a MiMa"
      ticker={ticker}
    >
      {/* ① Hero compatta */}
      <section className="sb-hero sb-mima-hero" aria-labelledby="veic-hero-title">
        <div className="sb-container">
          <p className="sb-mima-eyebrow"><IcCar size={14} /> Come arriviamo</p>
          <h1 className="sb-hero-title" id="veic-hero-title">
            <span>Quale auto portiamo?</span>
            <ShinyBrandline text="Milano Marittima · 13 → 17 agosto 2026" className="sb-brandline" />
          </h1>
          <div className="sb-hero-copy" style={{ marginTop: "1.1rem" }}>
            <p>
              <strong>Pekko, Jonny e Mok</strong>, un solo viaggio da Rivalta sul Mincio a Cervia.
              Dieci criteri, quattro opzioni, un simulatore di costi: la{" "}
              <strong>Mercedes-Benz GLA (2021)</strong>, la{" "}
              <strong>Hyundai Tucson 1.6 CRDI 48V DCT Excellence</strong> e il{" "}
              <strong>Ford Transit Custom 270 2.0 TDCi PC Furgone Trend</strong>, tarati su questo
              weekend al mare e non in astratto.
            </p>
          </div>
          <div className="sb-chiprow sb-mima-people">
            {PEOPLE.map((p) => <span key={p} className="sb-chip">{p}</span>)}
          </div>
        </div>
      </section>

      {/* ② La console */}
      <section className="sb-section sb-mima-console-sec" aria-label="Confronto veicoli">
        <div className="sb-container">
          <div className="sb-mima-console">
            <div className="sb-mima-col">
              {/* 01 — Classifica */}
              <Mod
                id="mod-classifica"
                icon={<IcRanking size={14} />}
                title="Classifica"
                meta={`su ${MAX_SCORE} punti`}
              >
                <div className="sb-mima-veic-rank">
                  {ranked.map(({ o, score }, i) => (
                    <div key={o.key} className={`sb-mima-veic-rank-row ${o.winner ? "is-winner" : ""}`}>
                      <span className="sb-mima-veic-rank-n" data-no-i18n translate="no">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="sb-mima-veic-rank-name">
                        {o.label}
                        <span className="sb-mima-veic-rank-sub">
                          {o.sub}
                          {score < BEST_SCORE && ` · −${BEST_SCORE - score} dal primo`}
                        </span>
                      </span>
                      <div className="sb-mima-veic-rank-meter">
                        <Meter pct={(score / MAX_SCORE) * 100} muted={!o.winner} />
                      </div>
                      <span className="sb-mima-veic-rank-score" data-no-i18n translate="no">
                        {score}/{MAX_SCORE}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="sb-mima-modnote">
                  I punteggi non sono dati a mano: sono la somma delle dieci righe della matrice
                  qui sotto. Cambiare una valutazione lì sposta la classifica qui.
                </p>
              </Mod>

              {/* 02 — Scheda tecnica */}
              <Mod
                id="mod-specifiche"
                icon={<IcListCheck size={14} />}
                title="Scheda tecnica"
                meta="3 mezzi a confronto"
              >
                <div className="sb-mima-data">
                  <table className="sb-mima-data-table">
                    <thead>
                      <tr>
                        <th scope="col">Voce</th>
                        {SPEC_KEYS.map((k) => (
                          <th key={k} scope="col" className={k === "tucson" ? "is-winner-col" : ""}>
                            {VEHICLES[k].name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SPEC_ROWS.map((row) => {
                        const nums = row.n ? SPEC_KEYS.map((k) => row.n!(VEHICLES[k])) : null;
                        const target =
                          nums && row.better
                            ? row.better === "min" ? Math.min(...nums) : Math.max(...nums)
                            : null;
                        return (
                          <tr key={row.k}>
                            <th scope="row">
                              {row.k}
                              {row.tbd && <Tbd>{row.tbd}</Tbd>}
                            </th>
                            {SPEC_KEYS.map((k, i) => {
                              const isBest = target != null && nums![i] === target;
                              return (
                                <td
                                  key={k}
                                  className={`${isBest ? "is-best" : ""} ${k === "tucson" ? "is-winner-col" : ""}`}
                                  data-no-i18n
                                  translate="no"
                                >
                                  {row.get(VEHICLES[k])}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr>
                        <th scope="row">
                          Pieno A/R
                          <Tbd>stima</Tbd>
                        </th>
                        {(["b", "c", "d"] as const).map((optKey, i) => (
                          <td
                            key={optKey}
                            className={SPEC_KEYS[i] === "tucson" ? "is-winner-col is-best" : ""}
                            data-no-i18n
                            translate="no"
                          >
                            {euro(EST[optKey].cost)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="sb-mima-modnote">
                  Misure, consumi ed emissioni sono valori tipici del modello e dell'allestimento
                  più comuni, non letti dalla carta di circolazione: servono a confrontare i tre
                  mezzi fra loro, non a fare un preventivo. Il grassetto marca il migliore della
                  riga dove un "migliore" esiste.
                </p>
              </Mod>

              {/* 03 — Matrice */}
              <MatriceMod />

              {/* 04 — Simulatore */}
              <SimulatoreMod />

              {/* 05 — Distributori */}
              <DistributoriMod />

              {/* 06 — Ingombri */}
              <Mod
                id="mod-ingombri"
                icon={<IcRuler size={14} />}
                title="Ingombri in scala"
                meta={`fondo scala ${num(SIZE_SCALE, 0)} m`}
              >
                <div className="sb-mima-veic-size">
                  {SPEC_KEYS.map((k) => {
                    const v = VEHICLES[k];
                    return (
                      <div key={k} className="sb-mima-veic-size-row">
                        <span className="sb-mima-veic-size-name">{v.short}</span>
                        <span className="sb-mima-veic-size-track">
                          <i
                            className="sb-mima-veic-size-fill"
                            style={{ width: `${(v.length / SIZE_SCALE) * 100}%` }}
                          />
                          <i
                            className="sb-mima-veic-size-ref"
                            style={{ left: `${(PARK_SPACE / SIZE_SCALE) * 100}%` }}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="sb-mima-veic-size-val" data-no-i18n translate="no">
                          {num(v.length, 2)} m
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="sb-mima-kv">
                  <KV k="Riferimento" v={`posto auto standard ${num(PARK_SPACE, 2)} m`} />
                  <KV
                    k="Margine"
                    v={SPEC_KEYS.map((k) => `${VEHICLES[k].short} ${num(PARK_SPACE - VEHICLES[k].length, 2)} m`).join(" · ")}
                  />
                </div>
                <p className="sb-mima-modnote">
                  La linea verticale è il posto auto da {num(PARK_SPACE, 2)} m. Il Transit Custom
                  a passo corto ci sta, ma con {num(PARK_SPACE - VEHICLES.transit.length, 2)} m di
                  margine: nelle vie del pinareto ad agosto è poco.
                  <Tbd>misure stimate</Tbd>
                </p>
              </Mod>

              {/* 06 — Percorso */}
              <Mod id="mod-percorso" icon={<IcCompass size={14} />} title="Percorso" meta="Rivalta → Cervia" solid>
                <div className="sb-mima-map sb-mima-map--tall">
                  <Suspense fallback={null}>
                    <MimaRouteMap variant="route" />
                  </Suspense>
                </div>
                <div className="sb-mima-kv">
                  <KV k="Da" v="Rivalta sul Mincio (MN)" />
                  <KV k="A" v="Cervia (RA) — Meet Hostel" />
                  <KV k="Distanza" v={`~${ROAD_KM_ONE_WAY} km a tratta`} tbd="stima" />
                  <KV k="Durata" v={`~${hhmm(ROAD_MIN_ONE_WAY)} a tratta`} tbd="stima" />
                  <KV k="Andata e ritorno" v={`${ROUND_TRIP_KM} km`} tbd="stima" />
                </div>
                <p className="sb-mima-modnote">
                  Il tracciato sulla mappa è schematico (A22 → A1 → A14), non una rotta calcolata:
                  serve a far vedere la direzione, non a navigare.
                </p>
              </Mod>

              {/* 07 — Verdetto */}
              <Mod id="mod-verdetto" icon={<IcTrophy size={14} />} title="Verdetto" meta="scelta per MiMa">
                <div className="sb-mima-veic-verdict">
                  <span className="sb-mima-veic-verdict-label">Scelta per MiMa</span>
                  <p>
                    Per questo viaggio — {PEOPLE.length} persone, Rivalta sul Mincio → Cervia, un
                    solo weekend — la <strong>Hyundai Tucson 1.6 CRDI 48V DCT Excellence
                    (opzione C)</strong> vince con {winnerScore} punti su {MAX_SCORE}, {" "}
                    {winnerScore - runnerUp.score} in più della seconda: bagagliaio più capiente
                    delle altre auto a 5 posti, consumi diesel mild-hybrid più bassi sui{" "}
                    {ROUND_TRIP_KM} km andata e ritorno ({euro(EST.c.cost)} di gasolio stimati,
                    contro {euro(EST.b.cost)} della GLA e {euro(EST.d.cost)} del Transit), e resta
                    comunque facile da parcheggiare vicino al pinareto. Se conta più l'arrivo in
                    spiaggia che il risparmio, la <strong>GLA (opzione B)</strong> è
                    un'alternativa valida, di poco dietro.
                  </p>
                </div>

                <div className="sb-mima-veic-why">
                  <div className="sb-mima-veic-why-row">
                    <strong>Perché non A</strong>
                    <span>
                      Nel confronto generale i 10 posti totali sono un pregio; per 3 persone
                      diventano solo un'auto vuota, doppio pieno ({euro(EST.a.cost)} contro{" "}
                      {euro(EST.c.cost)}) e doppio posto auto da trovare ad agosto.
                    </span>
                  </div>
                  <div className="sb-mima-veic-why-row">
                    <strong>Perché non D</strong>
                    <span>
                      Il Transit Custom a passo corto si parcheggia meglio di quanto sembri
                      (~{num(VEHICLES.transit.length, 2)} m, non un furgone gigante) e i 3 posti
                      tornano comodi, ma resta il più assetato e il più inquinante del confronto —
                      pensato per portare carico, non per un weekend tra amici.
                    </span>
                  </div>
                </div>

                <p className="sb-mima-modnote">
                  Stime indicative sul modello e allestimento più comuni: non sostituiscono un
                  preventivo reale. I km e il carburante <em>veri</em> del viaggio si tracciano in{" "}
                  <Link to="/mima" className="sb-link">MiMa</Link>, nel modulo delle spese.
                </p>

                <SparkGroup className="sb-mima-modactions">
                  <Link to="/mima" className="sb-btn sb-btn--sm sb-btn--secondary">
                    <IcArrowLeft size={15} /> Torna a MiMa
                  </Link>
                </SparkGroup>
              </Mod>
            </div>

            {/* ── Rail ── */}
            <aside className="sb-mima-rail" aria-label="Scelta e riepilogo">
              <Mod id="rail-scelta" icon={<IcTrophy size={14} />} title="La scelta" meta={`${winnerScore}/${MAX_SCORE}`}>
                <div className="sb-mima-veic-pick">
                  <span className="sb-mima-veic-pick-name">{VEHICLES.tucson.name}</span>
                  <span className="sb-mima-veic-pick-sub">{VEHICLES.tucson.trim}</span>
                </div>
                <Meter pct={(winnerScore / MAX_SCORE) * 100} label={`${winnerScore}/${MAX_SCORE}`} />
                <div className="sb-mima-kv">
                  <KV k="Bagagliaio" v={VEHICLES.tucson.boot} />
                  <KV k="Posti" v={String(VEHICLES.tucson.seats)} />
                  <KV
                    k="Consumo"
                    v={`${num(VEHICLES.tucson.lPer100[0], 1)}–${num(VEHICLES.tucson.lPer100[1], 1)} L/100km`}
                    tbd="stima"
                  />
                  <KV k="Pieno A/R" v={euro(EST.c.cost)} tbd="stima" />
                  <KV k="A testa" v={euro(EST.c.perPerson)} tbd="stima" />
                  <KV k="CO₂ viaggio" v={`${num(EST.c.co2kg, 1)} kg`} tbd="stima" />
                </div>
              </Mod>

              <Mod id="rail-rapido" icon={<IcCar size={14} />} title="Confronto rapido" meta="pieno A/R">
                <div className="sb-mima-kv">
                  {OPTIONS.map((o, i) => (
                    <KV
                      key={o.key}
                      k={o.short}
                      v={`${SCORES[i]}/${MAX_SCORE} · ${euro(EST[o.key as keyof typeof EST].cost)}`}
                    />
                  ))}
                </div>
                <p className="sb-mima-modnote">
                  Punteggio e gasolio stimato per {ROUND_TRIP_KM} km a {euro(FUEL_PRICE_DEFAULT)}/L.
                </p>
              </Mod>

              <Mod id="rail-marks" icon={<IcBookOpen size={14} />} title="Segnalibri" meta={`${MARKS.length} moduli`}>
                <nav className="sb-mima-marks" aria-label="Indice dei moduli">
                  {MARKS.map((m) => (
                    <a key={m.to} className="sb-mima-mark" href={m.to}>
                      <span>{m.label}</span>
                      <span className="sb-mima-mark-n" data-no-i18n translate="no">{m.n}</span>
                    </a>
                  ))}
                </nav>
              </Mod>

              <Mod id="rail-nota" icon={<IcHelp size={14} />} title="Come leggerla" meta="onestà dei dati">
                <p className="sb-mima-modnote">
                  Certi: i punteggi (calcolati dalla matrice) e i modelli. Stimati e marcati{" "}
                  <Tbd>stima</Tbd>: misure, consumi, emissioni, km su strada e ogni euro di
                  carburante. Il percorso è stato ricalcolato — la prima versione della pagina
                  diceva ~150 km a tratta, ma fra Rivalta e Cervia ce ne sono già{" "}
                  <strong>~168 in linea d'aria</strong>.
                </p>
              </Mod>
            </aside>
          </div>
        </div>
      </section>
    </MimaPage>
  );
}
