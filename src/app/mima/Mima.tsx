import { useEffect, useMemo, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft, IcSun, IcCalendar, IcUsers, IcWaves, IcHome, IcPin, IcShield,
  IcCompass, IcCalculator, IcCar, IcRuler, IcCart, IcClock, IcImage, IcClose,
  IcCheck, IcHelp,
} from "../site/homeIcons";
import "../home.css";
import "./mima.css";

// ─────────────────────────────────────────────────────────────────────────────
// /mima — piano vacanza: Milano Marittima, 13–17 agosto 2026. Pekko, Jonny,
// Mok. Alloggio al Meet Hostel Cervia (poco fuori Milano Marittima, dove si
// starà per davvero). Stessa veste "piattaforma Supabase" (.sb-) del resto
// del sito — vedi Bio.tsx/Sostieni.tsx per la stessa grammatica: nav sottile,
// hero, pannelli a bordo-gradiente, righe dati, gallerie. Classi nuove sotto
// prefisso .sb-mima-. Sezioni "da riempire" (viaggio, spese, album) mostrano
// uno stato vuoto invece di inventare numeri o foto.
// ─────────────────────────────────────────────────────────────────────────────

const TRIP_START = new Date("2026-08-13T00:00:00+02:00");
const TRIP_END = new Date("2026-08-17T00:00:00+02:00");

const PEOPLE = ["Pekko", "Jonny", "Mok"];

const BOOKING = {
  hostel: "Meet Hostel Cervia",
  address: "Viale Italia 310, Cervia, Italia",
  room: "Basic 3 letti · privata, bagno in camera — 1 camera",
  nights: 4,
  guests: 3,
  freeCancellation: "11 agosto 2026",
  pricePerNight: 142.32,
  nightsTotal: 569.28,
  taxes: 12.0,
  total: 569.28,
  paidNow: 85.39,
  payAtProperty: 495.89,
};

// Info pratiche sull'hostel — dalla mail di conferma della reception.
interface InfoRow { label: string; text: string }
const INFO: InfoRow[] = [
  { label: "Acconto e saldo", text: "L'acconto è gestito da Hostelworld — la struttura può verificare che sia stato effettuato. Il saldo si paga in loco, in contanti o con carta." },
  { label: "Parcheggio", text: "Circa 40 posti auto, gratuiti fino a esaurimento e non prenotabili." },
  { label: "Colazione", text: "Non inclusa: 3 € a persona al giorno. Colazione semplice, solo dolce." },
  { label: "Reception", text: "Aperta fino alle 22:00. Dopo quell'orario c'è il guardiano notturno, disponibile per i rientri tardivi." },
  { label: "Chiavi", text: "Se ne possono avere due, ma vanno sempre lasciate in reception. In caso di smarrimento: 10 €." },
];

const MAP_QUERY = `${BOOKING.hostel}, ${BOOKING.address}`;
const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent(MAP_QUERY)}`;
// Mappa incorporata — funziona senza API key (embed pubblico "output=embed").
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;

// Viaggio in auto — km percorsi e rifornimento. Tutto a null/vuoto finché non
// arrivano i numeri veri: l'interfaccia mostra un placeholder "da inserire"
// invece di inventare cifre.
const TRIP_KM: number | null = null; // km totali (andata+ritorno)
const FUEL: { pricePerLiter: number | null; liters: number | null; total: number | null; place: string } = {
  pricePerLiter: null,
  liters: null,
  total: null,
  place: "",
};

// Spese di ognuno — un rigo per voce di spesa. Vuoto finché non mi mandate i
// numeri: il riepilogo (totale a testa, chi ha anticipato cosa) si calcola
// da solo appena l'array si riempie.
interface Expense { person: string; item: string; amount: number }
const EXPENSES: Expense[] = [];

// Album ricordo — metti i file in /public/images/mima/ e aggiungi la riga
// qui sotto: { src: "/images/mima/nome-file.jpg", alt: "..." }.
interface Photo { src: string; alt: string }
const PHOTOS: Photo[] = [];

// Il programma giorno per giorno — struttura pronta, contenuti "da definire"
// finché non li decidete: basta cambiare `label`/`desc` qui sotto.
const DAYS = [
  { date: "13 ago", weekday: "Giovedì", label: "Arrivo", desc: "Check-in al Meet Hostel Cervia — si parte." },
  { date: "14 ago", weekday: "Venerdì", label: "Da definire", desc: "Spiaggia e Milano Marittima." },
  { date: "15 ago", weekday: "Sabato", label: "Ferragosto", desc: "Il giorno clou — da organizzare." },
  { date: "16 ago", weekday: "Domenica", label: "Da definire", desc: "Spiaggia e Milano Marittima." },
  { date: "17 ago", weekday: "Lunedì", label: "Partenza", desc: "Check-out dal Meet Hostel Cervia." },
];

function euro(n: number) {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

// Totale anticipato da ciascuno + quota a testa (spesa complessiva / persone):
// dice subito chi ha già anticipato più della sua parte e chi deve ancora dare.
function splitExpenses(expenses: Expense[], people: string[]) {
  const totalsByPerson = new Map(people.map((p) => [p, 0]));
  let grandTotal = 0;
  for (const e of expenses) {
    totalsByPerson.set(e.person, (totalsByPerson.get(e.person) ?? 0) + e.amount);
    grandTotal += e.amount;
  }
  const share = people.length ? grandTotal / people.length : 0;
  return {
    grandTotal,
    share,
    rows: people.map((p) => {
      const paid = totalsByPerson.get(p) ?? 0;
      return { person: p, paid, balance: paid - share };
    }),
  };
}

// Conto alla rovescia (giorni + ore): la partenza è tra settimane, non serve
// la precisione al secondo di un evento imminente.
function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const diff = TRIP_START.getTime() - now;
  if (diff <= 0) {
    const over = now < TRIP_END.getTime();
    return (
      <div className="sb-mima-live">
        <IcCheck size={15} />
        {over ? "Siamo a MiMa — buon viaggio!" : "Il viaggio è finito, che nostalgia."}
      </div>
    );
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  return (
    <div className="sb-mima-count" aria-label="Giorni al viaggio">
      <div className="sb-panel">
        <div className="sb-panel-inner sb-mima-count-tile">
          <span className="sb-mima-count-num">{days}</span>
          <span className="sb-mima-count-unit">{days === 1 ? "giorno" : "giorni"}</span>
        </div>
      </div>
      <div className="sb-panel">
        <div className="sb-panel-inner sb-mima-count-tile">
          <span className="sb-mima-count-num">{hours}</span>
          <span className="sb-mima-count-unit">ore</span>
        </div>
      </div>
    </div>
  );
}

export default function Mima() {
  const [scrolled, setScrolled] = useState(false);
  const [openPhoto, setOpenPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "MiMa — Milano Marittima, 13–17 agosto";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openPhoto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenPhoto(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPhoto]);

  const nightsRow = useMemo(
    () => `${euro(BOOKING.pricePerNight)} × ${BOOKING.nights} notti`,
    [],
  );

  const split = useMemo(() => splitExpenses(EXPENSES, PEOPLE), []);

  return (
    <div className="sb-home mima-page">
      {/* Skiplink — requisito di accessibilità */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      </div>

      {/* ── Nav sottile: brand + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-mima-tagline">Piano vacanza · MiMa</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-mima-back">
            <IcArrowLeft size={15} /> Torna alla home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero */}
        <section className="sb-hero" aria-labelledby="mima-hero-title">
          <div className="sb-container">
            <p className="sb-mima-eyebrow"><IcSun size={14} /> Piano vacanza</p>
            <h1 className="sb-hero-title" id="mima-hero-title">
              <span>MiMa</span>
              <span className="sb-brandline">Milano Marittima · 13 → 17 agosto 2026</span>
            </h1>
            <div className="sb-hero-copy" style={{ marginTop: "1.1rem" }}>
              <p>Quattro notti sulla riviera romagnola con <strong>Pekko, Jonny e Mok</strong>.</p>
            </div>
            <div className="sb-chiprow sb-mima-people">
              {PEOPLE.map((p) => (
                <span key={p} className="sb-chip">{p}</span>
              ))}
            </div>
            <Countdown />
            <div className="sb-hero-actions" style={{ marginTop: "1.4rem" }}>
              <Link to="/mima/luoghi" className="sb-btn sb-btn--secondary">
                <IcCart size={16} /> Dove mangiamo e usciamo
              </Link>
            </div>
          </div>
        </section>

        {/* ② A colpo d'occhio */}
        <section className="sb-section sb-mima-tight" aria-label="A colpo d'occhio">
          <div className="sb-container">
            <div className="sb-mima-facts">
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcCalendar size={18} /></span>
                  <span className="sb-mima-fact-value">13 → 17 agosto</span>
                  <span className="sb-mima-fact-label">4 notti</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcUsers size={18} /></span>
                  <span className="sb-mima-fact-value">Pekko, Jonny, Mok</span>
                  <span className="sb-mima-fact-label">3 ospiti</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcWaves size={18} /></span>
                  <span className="sb-mima-fact-value">Milano Marittima</span>
                  <span className="sb-mima-fact-label">hostel a Cervia</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ Dove dormiamo */}
        <section className="sb-section" aria-labelledby="mima-alloggio">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">01 — Alloggio</span>
              <h2 id="mima-alloggio">Dove dormiamo</h2>
            </div>

            <div className="sb-panel">
              <div className="sb-panel-inner sb-mima-hostel">
                <div className="sb-mima-hostel-head">
                  <span className="sb-mima-hostel-icon" aria-hidden="true"><IcHome size={20} /></span>
                  <div>
                    <h3>{BOOKING.hostel}</h3>
                    <p className="sb-mima-hostel-room">{BOOKING.room}</p>
                  </div>
                </div>

                <p className="sb-mima-hostel-addr"><IcPin size={15} /> {BOOKING.address}</p>
                <p className="sb-mima-hostel-note">
                  Anche se dormiamo a Cervia, la vacanza si vive a <strong>Milano Marittima</strong>,
                  a un passo.
                </p>

                <span className="sb-chip sb-mima-cancel-chip">
                  <IcShield size={14} /> Cancellazione gratuita entro l'{BOOKING.freeCancellation}
                </span>

                <div className="sb-mima-map">
                  <iframe
                    src={MAP_EMBED}
                    title={`Mappa · ${BOOKING.hostel}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="sb-hero-actions">
                  <a className="sb-btn sb-btn--primary" href={GMAPS} target="_blank" rel="noreferrer">
                    <IcCompass size={16} /> Google Maps
                  </a>
                  <a className="sb-btn sb-btn--secondary" href={AMAPS} target="_blank" rel="noreferrer">
                    <IcPin size={16} /> Apple Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="sb-panel" style={{ marginTop: "1rem" }}>
              <div className="sb-panel-inner sb-mima-panelpad">
                <div className="sb-mima-panelhead"><IcHelp size={17} /> <span>Info pratiche</span></div>
                <div className="sb-mima-info">
                  {INFO.map((i) => (
                    <div key={i.label} className="sb-mima-info-row">
                      <strong>{i.label}</strong>
                      <span>{i.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ④ Il conto */}
        <section className="sb-section" aria-labelledby="mima-conto">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">02 — Il conto</span>
              <h2 id="mima-conto">Cosa abbiamo pagato</h2>
            </div>
            <div className="sb-panel">
              <div className="sb-panel-inner sb-mima-panelpad">
                <div className="sb-mima-panelhead"><IcCalculator size={17} /> <span>Meet Hostel Cervia</span></div>
                <ul className="sb-mima-rows">
                  <li className="sb-mima-row">
                    <span className="sb-mima-row-k">{nightsRow}</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.nightsTotal)}</span>
                  </li>
                  <li className="sb-mima-row">
                    <span className="sb-mima-row-k">Tasse</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.taxes)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--total">
                    <span className="sb-mima-row-k">Prezzo totale</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.total)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--sub">
                    <span className="sb-mima-row-k">Totale pagato</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.paidNow)}</span>
                  </li>
                  <li className="sb-mima-row sb-mima-row--sub">
                    <span className="sb-mima-row-k">Pagabile alla struttura</span>
                    <span className="sb-mima-row-v">{euro(BOOKING.payAtProperty)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ Viaggio in auto: km + gasolio */}
        <section className="sb-section" aria-labelledby="mima-viaggio">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">03 — Viaggio</span>
              <h2 id="mima-viaggio">Come ci si arriva</h2>
            </div>
            <div className="sb-mima-facts sb-mima-facts--4">
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcRuler size={18} /></span>
                  <span className="sb-mima-fact-value">{TRIP_KM != null ? `${TRIP_KM} km` : "da inserire"}</span>
                  <span className="sb-mima-fact-label">Km percorsi</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcCar size={18} /></span>
                  <span className="sb-mima-fact-value">
                    {FUEL.pricePerLiter != null ? `${euro(FUEL.pricePerLiter)}/L` : "da inserire"}
                  </span>
                  <span className="sb-mima-fact-label">Costo al litro</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcCalculator size={18} /></span>
                  <span className="sb-mima-fact-value">
                    {FUEL.total != null
                      ? `${euro(FUEL.total)}${FUEL.liters != null ? ` · ${FUEL.liters} L` : ""}`
                      : "da inserire"}
                  </span>
                  <span className="sb-mima-fact-label">Spesa gasolio</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcPin size={18} /></span>
                  <span className="sb-mima-fact-value">{FUEL.place || "da inserire"}</span>
                  <span className="sb-mima-fact-label">Dove</span>
                </div>
              </div>
            </div>
            <div className="sb-hero-actions sb-mima-viaggio-actions">
              <Link to="/mima/veicoli" className="sb-btn sb-btn--secondary">
                <IcCar size={16} /> Quale auto portiamo?
              </Link>
            </div>
          </div>
        </section>

        {/* ⑥ Spese di ognuno */}
        <section className="sb-section" aria-labelledby="mima-spese">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">04 — Spese</span>
              <h2 id="mima-spese">Chi ha pagato cosa</h2>
            </div>
            <div className="sb-panel">
              <div className="sb-panel-inner sb-mima-panelpad">
                {EXPENSES.length === 0 ? (
                  <p className="sb-mima-empty"><IcCart size={16} /> Ancora nessuna spesa registrata — arriva col viaggio.</p>
                ) : (
                  <>
                    <div className="sb-mima-panelhead"><IcCart size={17} /> <span>Voci di spesa</span></div>
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
                          <span className={`sb-mima-balance-tag ${r.balance >= 0 ? "is-credit" : "is-debit"}`}>
                            {r.balance >= 0 ? `deve avere ${euro(r.balance)}` : `deve dare ${euro(-r.balance)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Cosa facciamo */}
        <section className="sb-section" aria-labelledby="mima-programma">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">05 — Programma</span>
              <h2 id="mima-programma">Giorno per giorno</h2>
            </div>
            <p className="sb-mima-note">
              Il programma vero e proprio è ancora da scrivere — questa è la scaletta di base, la
              riempiamo strada facendo.
            </p>
            <div className="sb-mima-days">
              {DAYS.map((d) => (
                <div key={d.date} className="sb-mima-day">
                  <div className="sb-mima-day-date">
                    <span className="sb-mima-day-num">{d.date}</span>
                    <span className="sb-mima-day-wd">{d.weekday}</span>
                  </div>
                  <div className="sb-mima-day-body">
                    <p className="sb-mima-day-label">{d.label}</p>
                    <p className="sb-mima-day-desc">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑧ Album ricordo */}
        <section className="sb-section" aria-labelledby="mima-album">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">06 — Ricordi</span>
              <h2 id="mima-album">Le foto del viaggio</h2>
            </div>
            {PHOTOS.length === 0 ? (
              <p className="sb-mima-empty"><IcImage size={16} /> Le foto arrivano dopo il viaggio — mandamele e le metto qui.</p>
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
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* ── Lightbox album ── */}
      {openPhoto && (
        <>
          <div className="sb-mima-modal-backdrop" onClick={() => setOpenPhoto(null)} aria-hidden="true" />
          <div className="sb-mima-modal" role="dialog" aria-modal="true" aria-label={openPhoto.alt}>
            <button type="button" className="sb-mima-modal-close" onClick={() => setOpenPhoto(null)} aria-label="Chiudi">
              <IcClose size={18} />
            </button>
            <img src={openPhoto.src} alt={openPhoto.alt} />
          </div>
        </>
      )}
    </div>
  );
}
