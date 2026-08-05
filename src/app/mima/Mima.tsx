import { Suspense, lazy, useEffect, useMemo, useState, type FormEvent } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcAlert, IcBookOpen, IcCalculator, IcCalendar, IcCar, IcCart, IcCheck, IcClose,
  IcCloud, IcCompass, IcExplore, IcFork, IcHelp, IcHome, IcImage, IcLink,
  IcListCheck, IcMoon, IcPin, IcShield, IcSun, IcTerminal, IcTrend, IcZap,
} from "../site/homeIcons";
import { SiWhatsapp } from "react-icons/si";
import { ShinyBrandline, SparkGroup } from "../site/homeFx";
import { MimaPage, Mod, KV, Meter, Tbd, useCountdown, type Tick } from "./MimaShell";
import { AUGUST_NORMALS, useWeather, weatherInfo } from "./useWeather";
import {
  addAlcolico, alcoliciShared, fetchAlcolici, removeAlcolico, subscribeAlcolici,
  toggleAlcolico, type Alcolico,
} from "./alcoliciApi";
import {
  AMAPS, BOOKING, BREAKFAST_PER_PERSON_DAY, BREAKFAST_TOTAL, DAYS, EXPENSES, GMAPS,
  FAR_KM, GSEARCH, INFO, NUMBERS, PACKING, PEOPLE, PHOTOS, PLACES,
  ROAD_KM_ONE_WAY, ROAD_MIN_ONE_WAY, ROUND_TRIP_KM, SLOT_NAMES, TRIP_PLACES,
  VENUES, WHATSAPP, WHATSAPP_NAME, CHEAPEST_CASA, DIESEL_GAP, FUEL_PRICE_DEFAULT,
  estimateOption, euro, haversineKm, hhmm, loadPacked, num, savePacked,
  splitExpenses, type Photo,
} from "./mimaData";
import "../home.css";
import "./mima.css";

const MimaRouteMap = lazy(() => import("./MimaRouteMap"));

// ─────────────────────────────────────────────────────────────────────────────
// /mima — la home operativa del viaggio a Milano Marittima (13–17 agosto 2026:
// Pekko, Jonny, Mok). Era un articolo con sei sezioni distanziate e quattro
// caselle che dicevano "da inserire"; ora è una console: barra di stato in
// cima, colonna di moduli fitti, rail appiccicoso col conto e i link.
//
// I dati stanno tutti in mimaData.ts, condivisi con /mima/veicoli, così il
// totale scritto nel ticker e quello calcolato nel rail non possono divergere.
// Ogni valore incerto si porta dietro <Tbd/>: in pagina è una pillola
// tratteggiata "da verificare", ed è l'unico modo per distinguere a colpo
// d'occhio un dato della conferma da una nostra ipotesi.
// ─────────────────────────────────────────────────────────────────────────────

/** Distanza leggibile: sotto il chilometro passa ai metri. */
function dist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${num(km, 1)} km`;
}

const D_MARE = haversineKm(PLACES.hostel, PLACES.mare);
const D_CERVIA = haversineKm(PLACES.hostel, PLACES.cervia);
const D_MIMA = haversineKm(PLACES.hostel, PLACES.mima);
const D_VIAGGIO = haversineKm(PLACES.rivalta, PLACES.hostel);

/** I locali con la distanza dall'ostello, dal più vicino al più lontano. */
const VENUE_ROWS = VENUES
  .map((v) => ({ v, km: haversineKm(PLACES.hostel, v) }))
  .sort((a, b) => a.km - b.km);

const NEAR_VENUES = VENUE_ROWS.filter((r) => r.km <= FAR_KM);
const FAR_VENUES = VENUE_ROWS.filter((r) => r.km > FAR_KM);

// L'esborso vero è acconto + saldo. Non coincide col "prezzo totale" della
// conferma, che è al netto delle tasse di soggiorno: 569,28 + 12,00 = 581,28,
// esattamente 85,39 + 495,89. Meglio dirlo che lasciarlo scoprire alla cassa.
const OUT_OF_POCKET = BOOKING.paidNow + BOOKING.payAtProperty;
const PER_PERSON = OUT_OF_POCKET / PEOPLE.length;
const PAID_PCT = (BOOKING.paidNow / OUT_OF_POCKET) * 100;

const FUEL_EST = estimateOption("c", ROUND_TRIP_KM, FUEL_PRICE_DEFAULT);
const BUDGET_TOTAL = OUT_OF_POCKET + BREAKFAST_TOTAL + FUEL_EST.cost;

const LINKS = [
  { href: WHATSAPP, host: "chat.whatsapp.com", tag: "il gruppo" },
  { href: "https://www.hostelworld.com/", host: "hostelworld.com", tag: "prenotazione" },
  { href: GMAPS, host: "google.com/maps", tag: "hostel" },
  { href: AMAPS, host: "maps.apple.com", tag: "hostel" },
  { href: "https://open-meteo.com/", host: "open-meteo.com", tag: "meteo" },
  { href: GSEARCH("farmacia di turno Cervia"), host: "google.com/search", tag: "farmacia" },
  { href: GSEARCH("eventi Ferragosto Milano Marittima 2026"), host: "google.com/search", tag: "ferragosto" },
];

const MARKS = [
  { to: "#mod-stato", n: "01", label: "Stato viaggio" },
  { to: "#mod-meteo", n: "02", label: "Meteo" },
  { to: "#mod-alloggio", n: "03", label: "Alloggio" },
  { to: "#mod-mappa", n: "04", label: "Cartografia" },
  { to: "#mod-programma", n: "05", label: "Programma" },
  { to: "#mod-locali", n: "06", label: "Locali segnati" },
  { to: "#mod-spese", n: "07", label: "Spese" },
  { to: "#mod-alcolici", n: "08", label: "Alcolici" },
  { to: "#mod-valigia", n: "09", label: "Valigia" },
  { to: "#mod-numeri", n: "10", label: "Numeri utili" },
  { to: "#mod-ricordi", n: "11", label: "Ricordi" },
];

// ── Meteo ────────────────────────────────────────────────────────────────────
function WxIcon({ kind }: { kind: ReturnType<typeof weatherInfo>["kind"] }) {
  if (kind === "sun") return <IcSun size={18} />;
  if (kind === "storm") return <IcZap size={18} />;
  return <IcCloud size={18} />;
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}

function MeteoMod() {
  const { wx, state } = useWeather();

  const meta =
    state === "ok" ? "previsioni open-meteo" : state === "loading" ? "caricamento…" : "medie stagionali";

  return (
    <Mod id="mod-meteo" icon={<IcSun size={14} />} title="Meteo · Cervia" meta={meta}>
      {state === "ok" && wx ? (
        <>
          <div className="sb-mima-wx">
            {wx.days.map((d) => {
              const info = weatherInfo(d.code);
              return (
                <div key={d.date} className="sb-mima-wx-day">
                  <span className="sb-mima-wx-date" data-no-i18n translate="no">{dayLabel(d.date)}</span>
                  <span className="sb-mima-wx-icon" aria-hidden="true"><WxIcon kind={info.kind} /></span>
                  <span className="sb-mima-wx-temp">
                    <b className="sb-mima-wx-max">{Math.round(d.tmax)}°</b>
                    <span className="sb-mima-wx-min">/ {Math.round(d.tmin)}°</span>
                  </span>
                  <span className="sb-mima-wx-label">{info.label}</span>
                  <div className="sb-mima-wx-rows" data-no-i18n translate="no">
                    <span className="sb-mima-wx-r">pioggia <b>{Math.round(d.rain)}%</b></span>
                    <span className="sb-mima-wx-r">vento <b>{Math.round(d.wind)} km/h</b></span>
                    <span className="sb-mima-wx-r">UV <b>{d.uv.toFixed(1)}</b></span>
                    <span className="sb-mima-wx-r">sole <b>{d.sunrise}–{d.sunset}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="sb-mima-src">
            fonte: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">open-meteo.com</a> ·
            previsioni, non certezze: a nove giorni cambiano ancora
          </p>
        </>
      ) : state === "loading" ? (
        <p className="sb-mima-modnote">Sto chiedendo le previsioni…</p>
      ) : (
        <>
          <div className="sb-mima-kpis">
            <div className="sb-mima-kpi">
              <span className="sb-mima-kpi-k">Massime</span>
              <span className="sb-mima-kpi-v" data-no-i18n translate="no">~{AUGUST_NORMALS.tmax}°</span>
            </div>
            <div className="sb-mima-kpi">
              <span className="sb-mima-kpi-k">Minime</span>
              <span className="sb-mima-kpi-v" data-no-i18n translate="no">~{AUGUST_NORMALS.tmin}°</span>
            </div>
            <div className="sb-mima-kpi">
              <span className="sb-mima-kpi-k">Mare</span>
              <span className="sb-mima-kpi-v" data-no-i18n translate="no">~{AUGUST_NORMALS.seaTemp}°</span>
            </div>
          </div>
          <p className="sb-mima-modnote">
            Le previsioni per queste date non sono arrivate — o la finestra di open-meteo non ci
            arriva ancora, o la chiamata è fallita. Intanto restano le medie di agosto sulla
            riviera, circa {AUGUST_NORMALS.rainDays} giorni di pioggia in tutto il mese.
            <Tbd>medie stagionali</Tbd>
          </p>
        </>
      )}
    </Mod>
  );
}

// ── Alcolici: la lista condivisa ─────────────────────────────────────────────
// L'unico pezzo di /mima che non è solo mio: la scrivono in tre e si aggiorna
// dal vivo. Con Supabase configurato è condivisa davvero fra dispositivi; senza
// resta nel browser di chi scrive — e il modulo lo dichiara invece di lasciarlo
// credere.
function AlcoliciMod() {
  const [rows, setRows] = useState<Alcolico[]>([]);
  const [stato, setStato] = useState<"loading" | "ok" | "error">("loading");
  const [chi, setChi] = useState("");
  const [voce, setVoce] = useState("");
  const [qta, setQta] = useState("");
  const [busy, setBusy] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  // Chi sono: lo ricordo, così non va riscelto a ogni voce.
  useEffect(() => {
    try { setChi(localStorage.getItem("mima:chi") || ""); } catch { /* niente storage */ }
  }, []);
  const scegliChi = (n: string) => {
    setChi(n);
    try { localStorage.setItem("mima:chi", n); } catch { /* niente storage */ }
  };

  useEffect(() => {
    let alive = true;
    fetchAlcolici()
      .then((r) => { if (alive) { setRows(r); setStato("ok"); } })
      .catch(() => { if (alive) setStato("error"); });

    const off = subscribeAlcolici({
      onInsert: (row) => setRows((p) => (p.some((r) => r.id === row.id) ? p : [...p, row])),
      onUpdate: (row) => setRows((p) => p.map((r) => (r.id === row.id ? { ...r, ...row } : r))),
      onDelete: (id) => setRows((p) => p.filter((r) => r.id !== id)),
    });
    return () => { alive = false; off(); };
  }, []);

  async function aggiungi(e: FormEvent) {
    e.preventDefault();
    if (!chi.trim() || !voce.trim() || busy) return;
    setBusy(true);
    setErrore(null);
    try {
      const row = await addAlcolico({ chi, voce, qta });
      // In locale il realtime non rimbalza su questa stessa scheda: la riga la
      // metto io. Con Supabase l'INSERT torna comunque dal canale, ma la
      // guardia su `id` in onInsert evita il doppione.
      setRows((p) => (p.some((r) => r.id === row.id) ? p : [...p, row]));
      setVoce("");
      setQta("");
    } catch {
      setErrore("Non sono riuscito a salvare. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function spunta(row: Alcolico) {
    const preso = !row.preso;
    setRows((p) => p.map((r) => (r.id === row.id ? { ...r, preso } : r)));
    try {
      await toggleAlcolico(row.id, preso);
    } catch {
      setRows((p) => p.map((r) => (r.id === row.id ? { ...r, preso: !preso } : r)));
      setErrore("Non sono riuscito a salvare la spunta.");
    }
  }

  async function togli(row: Alcolico) {
    const prima = rows;
    setRows((p) => p.filter((r) => r.id !== row.id));
    try {
      await removeAlcolico(row.id);
    } catch {
      setRows(prima);
      setErrore("Non sono riuscito a togliere la voce.");
    }
  }

  const presi = rows.filter((r) => r.preso).length;
  const perPersona = PEOPLE.map((p) => ({
    nome: p,
    n: rows.filter((r) => r.chi.toLowerCase() === p.toLowerCase()).length,
  }));
  const altri = rows.filter(
    (r) => !PEOPLE.some((p) => p.toLowerCase() === r.chi.toLowerCase()),
  ).length;

  return (
    <Mod
      id="mod-alcolici"
      icon={<IcCart size={14} />}
      title="Alcolici da portare"
      meta={rows.length ? `${presi}/${rows.length} presi` : "lista vuota"}
    >
      <div className="sb-mima-live-badge">
        <i className={`sb-mima-live-dot ${alcoliciShared ? "is-on" : ""}`} aria-hidden="true" />
        {alcoliciShared
          ? "Condivisa in diretta: scrivete tutti e tre, si aggiorna da sola"
          : "Solo su questo browser — il backend condiviso non è configurato"}
      </div>

      <form className="sb-mima-alc-form" onSubmit={aggiungi}>
        <div className="sb-mima-alc-who">
          <span className="sb-mima-alc-wholabel">Chi porta</span>
          <div className="sb-chiprow">
            {PEOPLE.map((p) => (
              <button
                key={p}
                type="button"
                className={`sb-chip sb-mima-alc-chip ${chi === p ? "is-on" : ""}`}
                aria-pressed={chi === p}
                onClick={() => scegliChi(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="sb-mima-alc-fields">
          <div className="sb-mima-veic-sim-field">
            <label htmlFor="alc-chi">Nome</label>
            <input
              id="alc-chi"
              type="text"
              maxLength={40}
              placeholder="il tuo nome"
              value={chi}
              onChange={(e) => scegliChi(e.target.value)}
            />
          </div>
          <div className="sb-mima-veic-sim-field sb-mima-alc-grow">
            <label htmlFor="alc-voce">Cosa porti</label>
            <input
              id="alc-voce"
              type="text"
              maxLength={80}
              placeholder="es. Vodka, birre, prosecco…"
              value={voce}
              onChange={(e) => setVoce(e.target.value)}
            />
          </div>
          <div className="sb-mima-veic-sim-field">
            <label htmlFor="alc-qta">Quanto</label>
            <input
              id="alc-qta"
              type="text"
              maxLength={30}
              placeholder="1 L · 6 lattine"
              value={qta}
              onChange={(e) => setQta(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="sb-btn sb-btn--sm sb-btn--primary"
            disabled={busy || !chi.trim() || !voce.trim()}
          >
            <IcCheck size={15} /> Aggiungi
          </button>
        </div>
      </form>

      {errore && <p className="sb-mima-alc-err" role="alert">{errore}</p>}

      {stato === "loading" ? (
        <p className="sb-mima-modnote">Sto caricando la lista…</p>
      ) : stato === "error" ? (
        <p className="sb-mima-empty"><IcAlert size={16} /> Lista non raggiungibile. Ricarica la pagina.</p>
      ) : rows.length === 0 ? (
        <p className="sb-mima-empty">
          <IcCart size={16} /> Ancora niente. Scrivete voi la prima voce — resta salvata.
        </p>
      ) : (
        <>
          <Meter
            pct={(presi / rows.length) * 100}
            label={`${presi}/${rows.length} già presi`}
          />
          <ul className="sb-mima-alc-list">
            {rows.map((r) => (
              <li key={r.id} className={`sb-mima-alc-item ${r.preso ? "is-done" : ""}`}>
                <label className="sb-mima-alc-check">
                  <input
                    type="checkbox"
                    checked={r.preso}
                    onChange={() => spunta(r)}
                    aria-label={`Segna "${r.voce}" come preso`}
                  />
                  <span className="sb-mima-alc-voce">{r.voce}</span>
                </label>
                {r.qta && <span className="sb-mima-alc-qta" data-no-i18n translate="no">{r.qta}</span>}
                <span className="sb-mima-alc-chi">{r.chi}</span>
                <button
                  type="button"
                  className="sb-mima-alc-del"
                  onClick={() => togli(r)}
                  aria-label={`Togli "${r.voce}" dalla lista`}
                >
                  <IcClose size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="sb-mima-kv">
            {perPersona.map((p) => (
              <KV key={p.nome} k={p.nome} v={`${p.n} ${p.n === 1 ? "voce" : "voci"}`} />
            ))}
            {altri > 0 && <KV k="Altri" v={`${altri} ${altri === 1 ? "voce" : "voci"}`} />}
          </div>
        </>
      )}

      <p className="sb-mima-modnote">
        {alcoliciShared
          ? "Chiunque apra questa pagina può aggiungere, spuntare e togliere: fidatevi fra voi."
          : "Per renderla condivisa davvero servono le chiavi Supabase in produzione ed eseguire supabase/mima_alcolici.sql — finché non ci sono, ognuno vede solo la propria lista."}
      </p>
    </Mod>
  );
}

// ── Valigia ──────────────────────────────────────────────────────────────────
function ValigiaMod() {
  const [packed, setPacked] = useState<Record<string, boolean>>(() => loadPacked());

  const toggle = (id: string) =>
    setPacked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      savePacked(next);
      return next;
    });

  const total = PACKING.reduce((n, g) => n + g.items.length, 0);
  const done = PACKING.reduce(
    (n, g) => n + g.items.filter((i) => packed[`${g.key}:${i}`]).length,
    0,
  );

  return (
    <Mod
      id="mod-valigia"
      icon={<IcListCheck size={14} />}
      title="Valigia"
      meta={`${done}/${total}`}
    >
      <Meter pct={total ? (done / total) * 100 : 0} label={`${Math.round((done / total) * 100)}%`} />
      <div className="sb-mima-check-groups">
        {PACKING.map((g) => {
          const gDone = g.items.filter((i) => packed[`${g.key}:${i}`]).length;
          return (
            <div key={g.key} className="sb-mima-check-group">
              <div className="sb-mima-check-head">
                <span className="sb-mima-check-title">{g.title}</span>
                <span className="sb-mima-check-count" data-no-i18n translate="no">
                  {gDone}/{g.items.length}
                </span>
              </div>
              {g.items.map((item) => {
                const id = `${g.key}:${item}`;
                const on = !!packed[id];
                return (
                  <label key={id} className={`sb-mima-check-item ${on ? "is-done" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(id)} />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
      <p className="sb-mima-modnote">
        Le spunte restano in questo browser, non sono condivise fra noi tre.
      </p>
    </Mod>
  );
}

// ── Pagina ───────────────────────────────────────────────────────────────────
export default function Mima() {
  const [openPhoto, setOpenPhoto] = useState<Photo | null>(null);
  const cd = useCountdown();
  const { wx, state: wxState } = useWeather();

  useEffect(() => {
    if (!openPhoto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenPhoto(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPhoto]);

  const split = useMemo(() => splitExpenses(EXPENSES, PEOPLE), []);

  const ticker: Tick[] = [
    {
      k: cd.started ? "stato" : "partenza",
      v: cd.started ? (cd.ended ? "finito" : "in corso") : `T-${cd.days}g ${cd.hours}h`,
      live: true,
    },
    ...(wxState === "ok" && wx?.current
      ? [{ k: "Cervia", v: `${Math.round(wx.current.temp)}°`, live: true }]
      : []),
    { k: "tratta", v: `~${ROAD_KM_ONE_WAY} km` },
    { k: "durata", v: `~${hhmm(ROAD_MIN_ONE_WAY)}` },
    { k: "alloggio", v: euro(OUT_OF_POCKET) },
    { k: "a testa", v: euro(PER_PERSON) },
    { k: "pax", v: String(BOOKING.guests) },
    { k: "notti", v: String(BOOKING.nights) },
  ];

  return (
    <MimaPage
      title="MiMa — Milano Marittima, 13–17 agosto"
      back="/"
      backLabel="Torna alla home"
      ticker={ticker}
      overlay={
        openPhoto && (
          <>
            <div className="sb-mima-modal-backdrop" onClick={() => setOpenPhoto(null)} aria-hidden="true" />
            <div className="sb-mima-modal" role="dialog" aria-modal="true" aria-label={openPhoto.alt}>
              <button type="button" className="sb-mima-modal-close" onClick={() => setOpenPhoto(null)} aria-label="Chiudi">
                <IcClose size={18} />
              </button>
              <img src={openPhoto.src} alt={openPhoto.alt} />
            </div>
          </>
        )
      }
    >
      {/* ① Hero compatta */}
      <section className="sb-hero sb-mima-hero" aria-labelledby="mima-hero-title">
        <div className="sb-container">
          <p className="sb-mima-eyebrow"><IcSun size={14} /> Piano vacanza</p>
          <h1 className="sb-hero-title" id="mima-hero-title">
            <span>MiMa</span>
            <ShinyBrandline text="Milano Marittima · 13 → 17 agosto 2026" className="sb-brandline" />
          </h1>
          <div className="sb-hero-copy" style={{ marginTop: "1.1rem" }}>
            <p>
              Quattro notti sulla riviera romagnola con <strong>Pekko, Jonny e Mok</strong>.
              Questa è la plancia: conto, meteo, mappe, programma e valigia, tutto in una schermata.
            </p>
          </div>
          <div className="sb-chiprow sb-mima-people">
            {PEOPLE.map((p) => <span key={p} className="sb-chip">{p}</span>)}
          </div>

          {cd.started ? (
            <div className="sb-mima-live">
              <IcCheck size={15} />
              {cd.ended ? "Il viaggio è finito, che nostalgia." : "Siamo a MiMa — buon viaggio!"}
            </div>
          ) : (
            <div className="sb-mima-count sb-mima-count--3" aria-label="Quanto manca alla partenza">
              {[
                { n: cd.days, u: cd.days === 1 ? "giorno" : "giorni" },
                { n: cd.hours, u: "ore" },
                { n: cd.minutes, u: "minuti" },
              ].map((t) => (
                <div key={t.u} className="sb-panel">
                  <div className="sb-panel-inner sb-mima-count-tile">
                    <span className="sb-mima-count-num" data-no-i18n translate="no">{t.n}</span>
                    <span className="sb-mima-count-unit">{t.u}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <SparkGroup className="sb-hero-actions sb-mima-actions">
            <a className="sb-btn sb-btn--primary" href={WHATSAPP} target="_blank" rel="noreferrer">
              <SiWhatsapp size={15} /> Il gruppo
            </a>
            <Link to="/mima/luoghi" className="sb-btn sb-btn--secondary">
              <IcFork size={16} /> Dove mangiamo e usciamo
            </Link>
            <Link to="/mima/veicoli" className="sb-btn sb-btn--secondary">
              <IcCar size={16} /> Quale auto portiamo
            </Link>
          </SparkGroup>
        </div>
      </section>

      {/* ② La console */}
      <section className="sb-section sb-mima-console-sec" aria-label="Cruscotto del viaggio">
        <div className="sb-container">
          <div className="sb-mima-console">
            {/* ── Colonna principale ── */}
            <div className="sb-mima-col">
              {/* 01 — Stato viaggio */}
              <Mod id="mod-stato" icon={<IcTerminal size={14} />} title="Stato viaggio" meta="da conferma Hostelworld">
                <div className="sb-mima-kpis">
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Date</span>
                    <span className="sb-mima-kpi-v" data-no-i18n translate="no">13 → 17 ago</span>
                  </div>
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Notti</span>
                    <span className="sb-mima-kpi-v" data-no-i18n translate="no">{BOOKING.nights}</span>
                  </div>
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Ospiti</span>
                    <span className="sb-mima-kpi-v" data-no-i18n translate="no">{BOOKING.guests}</span>
                  </div>
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Camera</span>
                    <span className="sb-mima-kpi-v">Basic 3 letti</span>
                  </div>
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Cancellabile fino al</span>
                    <span className="sb-mima-kpi-v" data-no-i18n translate="no">11 ago</span>
                  </div>
                  <div className="sb-mima-kpi">
                    <span className="sb-mima-kpi-k">Esborso a testa</span>
                    <span className="sb-mima-kpi-v" data-no-i18n translate="no">{euro(PER_PERSON)}</span>
                  </div>
                </div>
              </Mod>

              {/* 02 — Meteo */}
              <MeteoMod />

              {/* 03 — Alloggio */}
              <Mod id="mod-alloggio" icon={<IcHome size={14} />} title="Alloggio" meta={BOOKING.hostel}>
                <div className="sb-mima-hostel-head">
                  <span className="sb-mima-hostel-icon" aria-hidden="true"><IcHome size={20} /></span>
                  <div>
                    <h3>{BOOKING.hostel}</h3>
                    <p className="sb-mima-hostel-room">{BOOKING.room}</p>
                  </div>
                </div>
                <p className="sb-mima-hostel-addr"><IcPin size={15} /> {BOOKING.address}</p>
                <span className="sb-chip sb-mima-cancel-chip">
                  <IcShield size={14} /> Cancellazione gratuita entro l'{BOOKING.freeCancellation}
                </span>

                <div className="sb-mima-kv">
                  <KV k="Camera" v={BOOKING.room} />
                  <KV k="Coordinate" v={`${PLACES.hostel.lat.toFixed(5)}, ${PLACES.hostel.lon.toFixed(5)}`} />
                  <KV k="Dal mare" v={dist(D_MARE)} tbd="in linea d'aria" />
                  <KV k="Da Cervia centro" v={dist(D_CERVIA)} tbd="in linea d'aria" />
                  <KV k="Da Milano Marittima" v={dist(D_MIMA)} tbd="in linea d'aria" />
                  <KV k="Check-in" v="giovedì 13 agosto" tbd="orario da confermare" />
                  <KV k="Check-out" v="lunedì 17 agosto" tbd="orario da confermare" />
                  <KV k="Parcheggio" v="~40 posti, gratuiti fino a esaurimento" />
                  <KV k="Colazione" v={`${euro(BREAKFAST_PER_PERSON_DAY)} a testa al giorno, non inclusa`} />
                  <KV k="Reception" v="aperta fino alle 22:00, poi guardiano notturno" />
                  <KV k="Chiavi" v={`2 per camera, da lasciare in reception — smarrimento ${euro(10)}`} />
                </div>

                <p className="sb-mima-hostel-note">
                  Il mare è davvero dietro l'angolo — <strong>{dist(D_MARE)}</strong> a piedi.
                  <strong> Milano Marittima</strong>, dove la vacanza si vive davvero, è invece a{" "}
                  <strong>{dist(D_MIMA)}</strong>: quella si fa in auto, non a piedi.
                </p>

                <div className="sb-mima-info">
                  {INFO.map((i) => (
                    <div key={i.label} className="sb-mima-info-row">
                      <strong>{i.label}</strong>
                      <span>{i.text}</span>
                    </div>
                  ))}
                </div>
              </Mod>

              {/* 04 — Cartografia */}
              <Mod id="mod-mappa" icon={<IcExplore size={14} />} title="Cartografia" meta="Rivalta → Cervia" solid>
                <div className="sb-mima-map sb-mima-map--tall">
                  <Suspense fallback={null}>
                    <MimaRouteMap variant="trip" />
                  </Suspense>
                </div>

                <div className="sb-mima-legend">
                  <span className="sb-mima-legend-item">
                    <i className="sb-mima-legend-dot is-primary" aria-hidden="true" /> Ostello
                  </span>
                  <span className="sb-mima-legend-item">
                    <i className="sb-mima-legend-dot" aria-hidden="true" /> Spiaggia, Indie Club, Cervia, Milano Marittima
                  </span>
                </div>

                <div className="sb-mima-kv">
                  {TRIP_PLACES.map((p) => (
                    <KV
                      key={p.key}
                      k={p.role}
                      v={
                        <>
                          {p.name}
                          {p.key !== "hostel" && ` · ${dist(haversineKm(PLACES.hostel, p))}`}
                          {" · "}
                          <span className="sb-mima-coord">{p.lat.toFixed(5)}, {p.lon.toFixed(5)}</span>
                        </>
                      }
                      tbd={p.approx ? "posizione approssimata" : false}
                    />
                  ))}
                  <KV k="Rivalta → ostello" v={`${num(D_VIAGGIO, 0)} km in linea d'aria`} />
                  <KV k="Su strada" v={`~${ROAD_KM_ONE_WAY} km · ~${hhmm(ROAD_MIN_ONE_WAY)} a tratta`} tbd="stima" />
                </div>
                <p className="sb-mima-modnote">
                  Le distanze sono dall'ostello, in linea d'aria. Ostello, spiaggia, Indie Club e
                  centro di MiMa sono punti rilevati sulla mappa, non stime.
                </p>

                <div className="sb-mima-modactions">
                  <a className="sb-btn sb-btn--sm sb-btn--primary" href={GMAPS} target="_blank" rel="noreferrer">
                    <IcCompass size={15} /> Google Maps
                  </a>
                  <a className="sb-btn sb-btn--sm sb-btn--secondary" href={AMAPS} target="_blank" rel="noreferrer">
                    <IcPin size={15} /> Apple Maps
                  </a>
                </div>
              </Mod>

              {/* 05 — Programma */}
              <Mod id="mod-programma" icon={<IcCalendar size={14} />} title="Programma" meta="5 giorni × 4 fasce">
                <div className="sb-mima-cal">
                  <table className="sb-mima-cal-table">
                    <thead>
                      <tr>
                        <td className="sb-mima-cal-corner" />
                        {DAYS.map((d) => (
                          <th key={d.date} scope="col">
                            <span className="sb-mima-cal-day" data-no-i18n translate="no">{d.date}</span>
                            <span className="sb-mima-cal-wd">{d.weekday} · {d.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOT_NAMES.map((slot, si) => (
                        <tr key={slot}>
                          <th scope="row" className="sb-mima-cal-slot">{slot}</th>
                          {DAYS.map((d) => (
                            <td key={`${d.date}-${slot}`}>
                              {d.slots[si].text}
                              {d.slots[si].tbd && <Tbd>da decidere</Tbd>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="sb-mima-modnote">
                  Le caselle marcate sono proposte, non decisioni: la scaletta la chiudiamo insieme.
                  Per i posti dove mangiare e uscire c'è <Link to="/mima/luoghi" className="sb-link">la lista dei luoghi</Link>.
                </p>
              </Mod>

              {/* 05b — Locali */}
              <Mod
                id="mod-locali"
                icon={<IcMoon size={14} />}
                title="Locali segnati"
                meta={`${VENUES.length} · da scheda mappa`}
              >
                <div className="sb-mima-data">
                  <table className="sb-mima-data-table">
                    <thead>
                      <tr>
                        <th scope="col">Locale</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Voto</th>
                        <th scope="col">Recensioni</th>
                        <th scope="col">Prezzo</th>
                        <th scope="col">Dall'ostello</th>
                      </tr>
                    </thead>
                    <tbody>
                      {VENUE_ROWS.map(({ v, km }) => (
                        <tr key={v.key} className={km > FAR_KM ? "is-far" : ""}>
                          <th scope="row" className={km <= FAR_KM ? "is-best" : ""}>{v.name}</th>
                          <td>{v.kind}</td>
                          <td data-no-i18n translate="no">{num(v.rating ?? 0, 1)} / 5</td>
                          <td data-no-i18n translate="no">{v.reviews?.toLocaleString("it-IT")}</td>
                          <td data-no-i18n translate="no">{v.price}</td>
                          <td data-no-i18n translate="no">{dist(km)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sb-mima-kv">
                  <KV
                    k="In zona"
                    v={NEAR_VENUES.map(({ v, km }) => `${v.name} ${dist(km)}`).join(" · ")}
                  />
                  {FAR_VENUES.map(({ v, km }) => (
                    <KV key={v.key} k="Fuori zona" v={`${v.name} — ${dist(km)} in linea d'aria, a Riccione`} />
                  ))}
                </div>

                <p className="sb-mima-modnote">
                  Voto, recensioni e fascia di prezzo vengono dalla scheda della mappa.{" "}
                  <strong>{VENUE_ROWS[0].v.name}</strong> è il più vicino: {dist(VENUE_ROWS[0].km)},
                  ci si va e si torna a piedi. Il <strong>Cocoricò</strong> non compare sulla mappa
                  qui sopra perché è fuori scala — a {dist(FAR_VENUES[0].km)} d'aria è una serata in
                  auto, e chi guida non beve. Gli altri posti di zona (Pineta, Villa Papeete, gli
                  street bar, le piadinerie) stanno in{" "}
                  <Link to="/mima/luoghi" className="sb-link">dove mangiamo e usciamo</Link>.
                  <Tbd>orari e serate da verificare</Tbd>
                </p>
              </Mod>

              {/* 06 — Spese */}
              <Mod
                id="mod-spese"
                icon={<IcCart size={14} />}
                title="Spese del gruppo"
                meta={EXPENSES.length ? `${EXPENSES.length} voci` : "nessuna voce"}
              >
                {EXPENSES.length === 0 ? (
                  <>
                    <p className="sb-mima-empty">
                      <IcCart size={16} /> Ancora nessuna spesa registrata — si riempie durante il viaggio.
                    </p>
                    <div className="sb-mima-kv">
                      <KV k="Voci" v="0" />
                      <KV k="Totale" v={euro(0)} />
                      <KV k={`Quota a testa (${PEOPLE.length})`} v={euro(0)} />
                    </div>
                    <p className="sb-mima-modnote">
                      Appena arrivano gli scontrini, il totale, la quota a testa e il saldo di
                      ognuno si calcolano da soli: mandatemi solo chi ha pagato cosa e quanto.
                    </p>
                  </>
                ) : (
                  <>
                    <ul className="sb-mima-rows">
                      {EXPENSES.map((e, i) => (
                        <li key={i} className="sb-mima-row">
                          <span className="sb-mima-row-k">{e.person} · {e.item}</span>
                          <span className="sb-mima-row-v">{euro(e.amount)}</span>
                        </li>
                      ))}
                      <li className="sb-mima-row sb-mima-row--total">
                        <span className="sb-mima-row-k">Totale</span>
                        <span className="sb-mima-row-v">{euro(split.grandTotal)}</span>
                      </li>
                      <li className="sb-mima-row sb-mima-row--sub">
                        <span className="sb-mima-row-k">Quota a testa ({PEOPLE.length} persone)</span>
                        <span className="sb-mima-row-v">{euro(split.share)}</span>
                      </li>
                    </ul>
                    <div className="sb-mima-balances">
                      {split.rows.map((r) => (
                        <div key={r.person} className="sb-mima-balance">
                          <span className="sb-mima-balance-name">{r.person}</span>
                          <span className="sb-mima-balance-paid">ha anticipato {euro(r.paid)}</span>
                          <Meter
                            pct={split.grandTotal ? (r.paid / split.grandTotal) * 100 : 0}
                            muted={r.balance < 0}
                          />
                          <span className={`sb-mima-balance-tag ${r.balance >= 0 ? "is-credit" : "is-debit"}`}>
                            {r.balance >= 0 ? `deve avere ${euro(r.balance)}` : `deve dare ${euro(-r.balance)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Mod>

              {/* 07 — Alcolici (condivisa) */}
              <AlcoliciMod />

              {/* 08 — Valigia */}
              <ValigiaMod />

              {/* 08 — Numeri utili */}
              <Mod id="mod-numeri" icon={<IcAlert size={14} />} title="Numeri utili" meta="nazionali certi">
                <div className="sb-mima-tel">
                  {NUMBERS.map((n) => (
                    <div key={n.label} className="sb-mima-tel-row">
                      <span className="sb-mima-tel-l">{n.label}</span>
                      <span className={`sb-mima-tel-n ${n.tbd ? "is-tbd" : ""}`} data-no-i18n translate="no">
                        {n.value}
                      </span>
                      <span className="sb-mima-tel-note">
                        {n.note}
                        {n.tbd && <Tbd />}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="sb-mima-modnote">
                  I quattro numeri nazionali sono certi. Quelli locali vanno cercati prima di
                  partire — il telefono dell'hostel sta nella mail di conferma.
                </p>
              </Mod>

              {/* 09 — Ricordi */}
              <Mod
                id="mod-ricordi"
                icon={<IcImage size={14} />}
                title="Ricordi"
                meta={PHOTOS.length ? `${PHOTOS.length} foto` : "vuoto"}
              >
                {PHOTOS.length === 0 ? (
                  <p className="sb-mima-empty">
                    <IcImage size={16} /> Le foto arrivano dopo il viaggio — mandamele e le metto qui.
                  </p>
                ) : (
                  <div className="sb-mima-gallery">
                    {PHOTOS.map((p) => (
                      <button
                        key={p.src}
                        type="button"
                        className="sb-mima-shot"
                        onClick={() => setOpenPhoto(p)}
                        aria-label={`Apri: ${p.alt}`}
                      >
                        <img src={p.src} alt={p.alt} loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </Mod>
            </div>

            {/* ── Rail ── */}
            <aside className="sb-mima-rail" aria-label="Conto e collegamenti">
              <Mod id="rail-conto" icon={<IcCalculator size={14} />} title="Il conto" meta="Meet Hostel Cervia">
                <ul className="sb-mima-rows">
                  <li className="sb-mima-row">
                    <span className="sb-mima-row-k">{euro(BOOKING.pricePerNight)} × {BOOKING.nights} notti</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.nightsTotal)}</span>
                  </li>
                  <li className="sb-mima-row">
                    <span className="sb-mima-row-k">Tasse di soggiorno</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.taxes)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--total">
                    <span className="sb-mima-row-k">Esborso totale</span>
                    <span className="sb-mima-row-v">{euro(OUT_OF_POCKET)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--sub">
                    <span className="sb-mima-row-k">Acconto già pagato</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.paidNow)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--sub">
                    <span className="sb-mima-row-k">Saldo alla struttura</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.payAtProperty)}</span>
                  </li>
                </ul>
                <Meter pct={PAID_PCT} label={`${Math.round(PAID_PCT)}% pagato`} />
                <div className="sb-mima-kv">
                  <KV k="A testa" v={euro(PER_PERSON)} />
                  <KV k="Al giorno" v={euro(OUT_OF_POCKET / BOOKING.nights)} />
                </div>
                <p className="sb-mima-modnote">
                  La conferma indica <strong>{euro(BOOKING.total)}</strong> come prezzo totale, ma è
                  al netto delle tasse: quello che esce davvero dalle tasche è{" "}
                  <strong>{euro(OUT_OF_POCKET)}</strong>, cioè acconto più saldo.
                </p>
              </Mod>

              <Mod id="rail-budget" icon={<IcTrend size={14} />} title="Budget stimato" meta="alloggio + extra">
                <div className="sb-mima-kv">
                  <KV k="Alloggio" v={euro(OUT_OF_POCKET)} />
                  <KV
                    k="Colazione"
                    v={`${euro(BREAKFAST_TOTAL)} · ${euro(BREAKFAST_PER_PERSON_DAY)} × ${PEOPLE.length} × ${BOOKING.nights}`}
                    tbd="se la prendiamo"
                  />
                  <KV k="Carburante A/R" v={`${euro(FUEL_EST.cost)} · ${num(FUEL_EST.liters, 1)} L`} tbd="stima" />
                  <KV k="Totale" v={euro(BUDGET_TOTAL)} tbd="stima" />
                  <KV k="A testa" v={euro(BUDGET_TOTAL / PEOPLE.length)} tbd="stima" />
                </div>
                <p className="sb-mima-modnote">
                  Carburante calcolato sulla Tucson, {ROUND_TRIP_KM} km andata e ritorno a{" "}
                  {num(FUEL_PRICE_DEFAULT, 3)} €/L — il gasolio self più basso entro 10 km da
                  casa, non una stima ({CHEAPEST_CASA.name}). In zona vacanza costa{" "}
                  {num(DIESEL_GAP * 100, 1)} centesimi in meno al litro: la lista completa dei
                  distributori, qui e giù, sta in{" "}
                  <Link to="/mima/veicoli" className="sb-link">quale auto portiamo</Link>.
                  Mangiare, spiaggia e serate non sono compresi.
                </p>
              </Mod>

              <Mod id="rail-gruppo" icon={<SiWhatsapp size={13} />} title="Il gruppo" meta="WhatsApp">
                <div className="sb-mima-veic-pick">
                  <span className="sb-mima-veic-pick-name">{WHATSAPP_NAME}</span>
                  <span className="sb-mima-veic-pick-sub">Dove si decide davvero</span>
                </div>
                <div className="sb-mima-modactions">
                  <a className="sb-btn sb-btn--sm sb-btn--primary" href={WHATSAPP} target="_blank" rel="noreferrer">
                    <SiWhatsapp size={14} /> Apri il gruppo
                  </a>
                </div>
                <p className="sb-mima-modnote">
                  Questa pagina è la memoria del viaggio: quello che decidete nel gruppo finisce
                  qui, così non va perso a scorrere la chat.
                </p>
              </Mod>

              <Mod id="rail-link" icon={<IcLink size={14} />} title="Prenotazioni" meta="link esterni">
                <div className="sb-mima-links" data-no-i18n translate="no">
                  {LINKS.map((l) => (
                    <a key={l.host + l.tag} className="sb-mima-link-row" href={l.href} target="_blank" rel="noreferrer">
                      <span className="sb-mima-link-mark" aria-hidden="true">$</span>
                      <span className="sb-mima-link-host">{l.host}</span>
                      <span className="sb-mima-link-tag">{l.tag}</span>
                    </a>
                  ))}
                  <Link className="sb-mima-link-row" to="/mima/luoghi">
                    <span className="sb-mima-link-mark" aria-hidden="true">/</span>
                    <span className="sb-mima-link-host">mima/luoghi</span>
                    <span className="sb-mima-link-tag">interno</span>
                  </Link>
                  <Link className="sb-mima-link-row" to="/mima/veicoli">
                    <span className="sb-mima-link-mark" aria-hidden="true">/</span>
                    <span className="sb-mima-link-host">mima/veicoli</span>
                    <span className="sb-mima-link-tag">interno</span>
                  </Link>
                </div>
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
                  Tutto quello che porta la pillola tratteggiata <Tbd /> è una nostra ipotesi, non
                  un dato della prenotazione: orari, distanze in linea d'aria, stime di
                  carburante e proposte di programma. Il resto viene dalla conferma Hostelworld
                  o è calcolato da lì.
                </p>
              </Mod>
            </aside>
          </div>
        </div>
      </section>
    </MimaPage>
  );
}
