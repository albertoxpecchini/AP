import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft, IcCompass, IcFork, IcWaves, IcFlame, IcStore, IcMoon, IcPin,
  IcListCheck,
} from "../site/homeIcons";
import { PageBackdrop, ShinyBrandline, SparkGroup } from "../site/homeFx";
import { PLACES, haversineKm, num } from "./mimaData";
import "../home.css";
import "./mima.css";
import "./luoghi.css";

// ─────────────────────────────────────────────────────────────────────────────
// /mima/luoghi — dove mangiare e uscire tra Milano Marittima e Cervia, per il
// viaggio MiMa (13–17 agosto 2026). Selezione curata da ricerche online
// (recensioni, classifiche locali, sondaggi di zona) ad agosto 2026 — non
// recensioni di prima mano: indirizzi e orari vanno riverificati prima di
// andarci. Stessa grammatica .sb- del resto del sito, prefisso .sb-mima-luoghi-.
// ─────────────────────────────────────────────────────────────────────────────

type Zona = "Milano Marittima" | "Cervia" | "Pinarella" | "Riccione";

interface Luogo {
  nome: string;
  zona: Zona;
  indirizzo?: string;
  nota: string;
  top?: string; // se presente, evidenzia la card come scelta consigliata della categoria
  // ── Posti segnati da noi sulla mappa ──────────────────────────────────────
  // Questi quattro campi ci sono solo dove abbiamo la scheda vera (voto,
  // recensioni, fascia di prezzo) e le coordinate: gli altri locali restano
  // una selezione da ricerche online, senza numeri inventati per pareggiare.
  voto?: number;
  recensioni?: number;
  prezzo?: string;
  /** Chiave in PLACES: se c'è, la card mostra la distanza dall'ostello. */
  place?: keyof typeof PLACES;
}

interface Categoria {
  key: string;
  kicker: string;
  titolo: string;
  icon: typeof IcFork;
  intro: string;
  luoghi: Luogo[];
}

const CATEGORIE: Categoria[] = [
  {
    key: "pesce",
    kicker: "01 — Ristoranti",
    titolo: "Ristoranti e bagni-ristorante",
    icon: IcWaves,
    intro: "Cucina di pesce e ristorazione più curata, tra il lungomare di Milano Marittima e il Borgo Marina di Cervia — più la churrascaria brasiliana, l'unica della lista che col pesce non c'entra niente.",
    luoghi: [
      { nome: "Acqua e Sale", zona: "Milano Marittima", nota: "Tra i ristoranti più apprezzati della zona nelle classifiche online.", top: "Il più votato" },
      {
        nome: "Pousada Beijaflor",
        zona: "Milano Marittima",
        nota: "Churrascaria brasiliana in pieno centro a MiMa: carne alla brace servita al tavolo, non cucina di mare.",
        voto: 4.1,
        recensioni: 2280,
        prezzo: "10-20 €",
        place: "beijaflor",
      },
      { nome: "Mima Beach 272", zona: "Milano Marittima", nota: "Bagno-ristorante sulla spiaggia, tra i più frequentati per pranzo di pesce." },
      { nome: "Pino Beach 285", zona: "Milano Marittima", nota: "Pesce con terrazza vista mare, uno dei più citati per la cucina ittica." },
      { nome: "Zi Teresa", zona: "Milano Marittima", nota: "Storico dal 1947, cucina marinara informale — filetto di tonno e crudità di pesce." },
      { nome: "Marenita – Cucina e Cantina", zona: "Milano Marittima", nota: "Cucina e cantina, tra i nomi ricorrenti nei consigli di zona." },
      { nome: "Ristorante Capitano", zona: "Cervia", indirizzo: "Borgo Marina", nota: "Aperto tutto il giorno: colazione, aperitivo, pizza e piatti dolci e salati." },
    ],
  },
  {
    key: "aperitivo",
    kicker: "02 — Aperitivo & apericena",
    titolo: "Dove fare aperitivo",
    icon: IcFlame,
    intro: "Buffet, cocktail e musica per l'ora dell'aperitivo, prima di uscire la sera.",
    luoghi: [
      { nome: "Ciberia Casablanca", zona: "Milano Marittima", nota: "Uno dei migliori apericena della zona: buffet ricco, barman preparati, musica commerciale.", top: "Il più consigliato" },
      { nome: "Open Space Lounge Bar", zona: "Milano Marittima", indirizzo: "Via Milano 7", nota: "Aperitivo con sushi, cocktail e musica dal vivo." },
    ],
  },
  {
    key: "piadina",
    kicker: "03 — Piadina & street food",
    titolo: "Le piadinerie",
    icon: IcFork,
    intro: "Piadina romagnola, il classico da mangiare passeggiando sul viale.",
    luoghi: [
      { nome: "Chiosco delle Streghe", zona: "Milano Marittima", indirizzo: "Viale 2 Giugno 10", nota: "Eletta la miglior piadina di Cervia in un sondaggio di zona.", top: "Vincitrice del sondaggio locale" },
      { nome: "Alta Marea Piada Cafè", zona: "Milano Marittima", indirizzo: "Viale 2 Giugno 35", nota: "Piadine abbondanti, buon rapporto qualità-prezzo." },
      { nome: "Piadina del Mare", zona: "Milano Marittima", indirizzo: "Lungomare Grazia Deledda 11", nota: "Ripieno abbondante, ingredienti genuini." },
      { nome: "I Sapori della Piadina", zona: "Cervia", indirizzo: "Via Lesina 1", nota: "Ampia scelta di ingredienti, tra i più curati della zona." },
    ],
  },
  {
    key: "gelato",
    kicker: "04 — Gelato",
    titolo: "Le gelaterie",
    icon: IcStore,
    intro: "Per chiudere la giornata di spiaggia con un gelato sul viale o sul lungomare.",
    luoghi: [
      { nome: "Puro & Bio", zona: "Cervia", indirizzo: "Via Nazario Sauro 136", nota: "Il gelato più votato in un sondaggio di zona.", top: "Il più votato" },
      { nome: "L'Ottocento", zona: "Milano Marittima", nota: "Gelateria storica e caratteristica, vasto menù di coppe." },
      { nome: "Crème de la crème", zona: "Milano Marittima", indirizzo: "Viale Antonio Gramsci", nota: "Gelato con latte bio delle colline romagnole." },
      { nome: "Mammacarla", zona: "Pinarella", nota: "Dal 1988: gelato e granite di frutta fresca." },
    ],
  },
  {
    key: "notturna",
    kicker: "05 — Vita notturna",
    titolo: "Discoteche e street bar",
    icon: IcMoon,
    intro: "Il cuore della movida di Milano Marittima, tra street bar e discoteche storiche. Le tre col voto e la distanza sono quelle che ci siamo segnati sulla mappa.",
    luoghi: [
      {
        nome: "Indie Club",
        zona: "Pinarella",
        nota: "La più vicina all'ostello di tutte: ci si va e si torna a piedi, senza pensare a chi guida.",
        top: "A piedi dall'ostello",
        voto: 3.8,
        recensioni: 1231,
        prezzo: "20-30 €",
        place: "indie",
      },
      {
        nome: "King",
        zona: "Pinarella",
        nota: "Poco più su lungo la costa, ancora in zona: la fascia di prezzo più bassa fra le tre segnate.",
        voto: 3.8,
        recensioni: 230,
        prezzo: "10-20 €",
        place: "king",
      },
      {
        nome: "Cocoricò",
        zona: "Riccione",
        nota: "Il voto più alto del gruppo, ma è fuori zona: una serata lì vuol dire mettersi in auto, andata e ritorno, e chi guida non beve.",
        voto: 4.5,
        recensioni: 2387,
        prezzo: "20-70 €",
        place: "cocorico",
      },
      { nome: "Pineta", zona: "Milano Marittima", nota: "La discoteca storica di Milano Marittima, il locale più chic della riviera.", top: "La più storica" },
      { nome: "Villa Papeete", zona: "Milano Marittima", nota: "Villa ottocentesca nel verde: privè, ristorante, palco live e pista centrale." },
      { nome: "Caino Fashion Club", zona: "Milano Marittima", nota: "Street bar più famoso dal 1999, a due passi dalla discoteca Pineta." },
      { nome: "Zouk Santana", zona: "Milano Marittima", nota: "Il più grande e storico street bar della zona, 14 postazioni bar." },
      { nome: "Idroscalo", zona: "Milano Marittima", nota: "Street bar per gli amanti del jazz, con un grande lampadario in Swarovski." },
    ],
  },
];

const TOTALE_LUOGHI = CATEGORIE.reduce((n, c) => n + c.luoghi.length, 0);
const SEGNATI = CATEGORIE.reduce((n, c) => n + c.luoghi.filter((l) => l.place).length, 0);

/** Quanto dista dall'ostello, in linea d'aria. Sotto il chilometro, in metri. */
function distDaOstello(key: keyof typeof PLACES) {
  const km = haversineKm(PLACES.hostel, PLACES[key]);
  return km < 1 ? `${Math.round(km * 1000)} m dall'ostello` : `${num(km, 1)} km dall'ostello`;
}

export default function Luoghi() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Dove mangiare e uscire — MiMa";
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
        <section className="sb-hero" aria-labelledby="luoghi-hero-title">
          <div className="sb-container">
            <p className="sb-mima-eyebrow"><IcFork size={14} /> Dove andiamo</p>
            <h1 className="sb-hero-title" id="luoghi-hero-title">
              <span>Mangiare & uscire</span>
              <ShinyBrandline text="Milano Marittima · Cervia" className="sb-brandline" />
            </h1>
            <div className="sb-hero-copy" style={{ marginTop: "1.1rem" }}>
              <p>
                Una selezione di ristoranti, piadinerie, gelaterie e locali serali tra{" "}
                <strong>Milano Marittima</strong> e <strong>Cervia</strong>, per decidere insieme
                dove andare durante i quattro giorni.
              </p>
            </div>
          </div>
        </section>

        {/* ② A colpo d'occhio */}
        <section className="sb-section sb-mima-tight" aria-label="A colpo d'occhio">
          <div className="sb-container">
            <div className="sb-mima-facts">
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcFork size={18} /></span>
                  <span className="sb-mima-fact-value">{TOTALE_LUOGHI} luoghi</span>
                  <span className="sb-mima-fact-label">selezionati</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcListCheck size={18} /></span>
                  <span className="sb-mima-fact-value">{CATEGORIE.length} categorie</span>
                  <span className="sb-mima-fact-label">pesce, aperitivo, piadina, gelato, sera</span>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-mima-fact">
                  <span className="sb-mima-fact-icon" aria-hidden="true"><IcPin size={18} /></span>
                  <span className="sb-mima-fact-value">MiMa + Cervia</span>
                  <span className="sb-mima-fact-label">tutto a pochi minuti dall'hostel</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ Categorie */}
        {CATEGORIE.map((cat) => {
          const Icon = cat.icon;
          return (
            <section key={cat.key} className="sb-section" aria-labelledby={`luoghi-${cat.key}`}>
              <div className="sb-container">
                <div className="sb-mima-sechead">
                  <span className="sb-mima-kicker">{cat.kicker}</span>
                  <h2 id={`luoghi-${cat.key}`}>{cat.titolo}</h2>
                </div>
                <p className="sb-mima-note">{cat.intro}</p>
                <div className="sb-mima-luoghi-grid">
                  {cat.luoghi.map((l) => (
                    <div key={l.nome} className={`sb-panel sb-mima-luoghi-card ${l.top ? "is-top" : ""}`}>
                      {l.top && <span className="sb-mima-luoghi-tag"><Icon size={12} /> {l.top}</span>}
                      <div className="sb-panel-inner sb-mima-luoghi-card-inner">
                        <span className="sb-mima-luoghi-zona">{l.zona}</span>
                        <h3>{l.nome}</h3>
                        {l.indirizzo && (
                          <p className="sb-mima-luoghi-addr"><IcPin size={13} /> {l.indirizzo}</p>
                        )}
                        {(l.voto || l.prezzo || l.place) && (
                          <p className="sb-mima-luoghi-meta" data-no-i18n translate="no">
                            {l.voto != null && (
                              <span className="sb-mima-luoghi-voto">
                                {num(l.voto, 1)}/5
                                {l.recensioni != null && ` (${l.recensioni.toLocaleString("it-IT")})`}
                              </span>
                            )}
                            {l.prezzo && <span>{l.prezzo}</span>}
                            {l.place && <span>{distDaOstello(l.place)}</span>}
                          </p>
                        )}
                        <p className="sb-mima-luoghi-nota">{l.nota}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* ④ Nota fonti */}
        <section className="sb-section" aria-labelledby="luoghi-nota">
          <div className="sb-container">
            <div className="sb-mima-sechead">
              <span className="sb-mima-kicker">Nota</span>
              <h2 id="luoghi-nota">Prima di andarci</h2>
            </div>
            <p className="sb-mima-note" style={{ marginBottom: 0 }}>
              Selezione curata da ricerche online (recensioni, classifiche e sondaggi di zona) ad
              agosto 2026, non da esperienza diretta: indirizzi, orari di apertura e menù vanno
              riverificati prima di andarci, soprattutto in alta stagione. Fanno eccezione{" "}
              <strong>{SEGNATI} locali</strong> — quelli con voto, fascia di prezzo e distanza:
              quelli ce li siamo segnati noi sulla mappa, e la distanza è calcolata in linea
              d'aria dall'ostello. Le trovi anche nella tabella su{" "}
              <Link to="/mima" className="sb-link">MiMa</Link>, modulo "Locali segnati".
            </p>
            <SparkGroup className="sb-hero-actions sb-mima-actions">
              <a
                className="sb-btn sb-btn--primary"
                href="https://www.google.com/maps/search/?api=1&query=ristoranti+Milano+Marittima+Cervia"
                target="_blank"
                rel="noreferrer"
              >
                <IcCompass size={16} /> Apri su Google Maps
              </a>
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
