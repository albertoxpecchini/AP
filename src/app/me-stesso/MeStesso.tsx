import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft,
  IcGrad,
  IcPin,
  IcCake,
  IcCalendar,
  IcSprout,
  IcTractor,
  IcPark,
  IcWaves,
  IcScreen,
  IcRuler,
  IcCompass,
  IcBuilding,
  IcBrick,
  IcCode,
  IcPlane,
  IcTarget,
  IcCrosshair,
  IcVolley,
  IcMoto,
  IcCar,
  IcHeart,
  IcUsers,
  IcFork,
  IcStore,
  IcCart,
  IcTrend,
  IcSchool,
  IcZap,
  IcMountain,
  type IcProps,
} from "../site/homeIcons";
import "../home.css";
import "./mestesso.css";

// ─────────────────────────────────────────────────────────────────────────────
// «Me stesso» — presentazione personale di Alberto Pecchini (Esame di Stato
// 2026), rifatta sulla grammatica Supabase della home (.sb-): nav sottile 64px,
// hero a due colonne col ritratto in pannello, sezioni numerate con overline
// verde, fact-card, card-prodotto dei ruoli in azienda, gallerie fotografiche,
// blocchi racconto, schema ad albero della scuola, bandiere dei paesi visitati,
// mini-storico sportivo e chiusura «Grazie».
// Tema chiaro/scuro NATIVO via token --sb-* (home.css); stili in mestesso.css.
// I testi sono quelli di sempre, parola per parola: le chiavi del motore i18n
// (dizionario in italiano, sorgente di questa pagina) restano valide.
// ─────────────────────────────────────────────────────────────────────────────

// Età calcolata dal giorno di nascita: niente numero che invecchia da solo.
// Resta il numero puro — una stringa con l'età dentro non sarebbe traducibile
// (la chiave del dizionario cambierebbe a ogni compleanno).
function ageFromISO(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a -= 1;
  return a;
}

// Cornice foto in pannello. Se il file manca, al posto dell'immagine resta un
// riquadro coerente con l'icona del tema: il layout non si spezza mai.
//
// `focus` imposta l'object-position (es. "50% 30%") per scegliere quale parte
// resta in cornice quando la foto viene ritagliata in cover — così i volti non
// vengono tagliati a metà.
function Shot({
  src,
  alt,
  caption,
  Icon,
  portrait = false,
  wide = false,
  focus,
}: {
  src: string;
  alt: string;
  caption?: string;
  Icon: (p: IcProps) => JSX.Element;
  portrait?: boolean;
  wide?: boolean;
  focus?: string;
}) {
  const [failed, setFailed] = useState(false);
  const cls = `sb-ms-shot${portrait ? " sb-ms-shot--portrait" : ""}${wide ? " sb-ms-shot--wide" : ""}`;
  return (
    <figure className={cls}>
      <div className="sb-panel">
        <div className="sb-panel-inner">
          {failed ? (
            <div className="sb-ms-shot-ph" role="img" aria-label={alt}>
              <Icon size={34} />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              onError={() => setFailed(true)}
              style={focus ? { objectPosition: focus } : undefined}
            />
          )}
          {caption && <figcaption>{caption}</figcaption>}
        </div>
      </div>
    </figure>
  );
}

// ── Bandiere SVG (colori reali) ──────────────────────────────────────────────
const FlagItalia = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#009246" />
    <rect x="40" width="20" height="40" fill="#CE2B37" />
  </svg>
);
const FlagSanMarino = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#5EB6E4" />
    <rect width="60" height="20" fill="#ffffff" />
    <g transform="translate(30 20)">
      <circle r="7" fill="#ffffff" stroke="#C8A14B" strokeWidth="1.2" />
      <rect x="-4.6" y="-1.8" width="2.5" height="4.4" fill="#5EB6E4" />
      <rect x="-1.25" y="-3" width="2.5" height="5.6" fill="#5EB6E4" />
      <rect x="2.1" y="-1.8" width="2.5" height="4.4" fill="#5EB6E4" />
    </g>
  </svg>
);
const FlagSvizzera = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#D52B1E" />
    <rect x="26" y="10" width="8" height="20" fill="#ffffff" />
    <rect x="20" y="16" width="20" height="8" fill="#ffffff" />
  </svg>
);
const FlagAustria = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="60" height="13.34" fill="#ED2939" />
    <rect y="26.66" width="60" height="13.34" fill="#ED2939" />
  </svg>
);
const FlagFrancia = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#0055A4" />
    <rect x="40" width="20" height="40" fill="#EF4135" />
  </svg>
);
const FlagIrlanda = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#169B62" />
    <rect x="40" width="20" height="40" fill="#FF883E" />
  </svg>
);
const FlagScozia = () => (
  <svg viewBox="0 0 60 40" className="sb-ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#005EB8" />
    <path d="M0 0 L60 40 M60 0 L0 40" stroke="#ffffff" strokeWidth="8" />
  </svg>
);

// Paesi visitati, in ordine di distanza da casa (Rivalta sul Mincio).
// `own` = nome proprio da non tradurre.
const COUNTRIES = [
  { name: "Italia", Flag: FlagItalia },
  { name: "San Marino", Flag: FlagSanMarino, own: true },
  { name: "Svizzera", Flag: FlagSvizzera },
  { name: "Austria", Flag: FlagAustria },
  { name: "Francia", Flag: FlagFrancia },
  { name: "Irlanda", Flag: FlagIrlanda },
  { name: "Scozia", Flag: FlagScozia },
];

const FACTS = [
  { Icon: IcCake, value: `${ageFromISO("2006-06-28")}`, label: "Anni · nato il 28 giugno 2006" },
  { Icon: IcPin, value: "Rivalta sul Mincio", label: "Comune di Rodigo, provincia di Mantova", own: true },
  { Icon: IcGrad, value: "Classe 5BT", label: "Diploma CAT — Costruzioni, Ambiente e Territorio" },
  { Icon: IcCalendar, value: "5 anni", label: "di percorso, che oggi si concludono qui" },
];

const RUOLI = [
  { Icon: IcTractor, label: "Macchine operatrici", note: "guida e lavori in cascina" },
  { Icon: IcPark, label: "Parchi & giardini", note: "cura del verde delle proprietà" },
  { Icon: IcWaves, label: "Piscine & arredi esterni", note: "manutenzione con mio padre" },
  { Icon: IcScreen, label: "Tutto il digitale", note: "ordini, preventivi, usato online" },
];

const PERCORSO = [
  { Icon: IcRuler, title: "Disegno e progetto", desc: "Progettare con metodo e precisione, dall'AutoCAD fino al dettaglio." },
  { Icon: IcCompass, title: "Metodo e rigore", desc: "Ragionare per problemi e risolverli un passo alla volta — anche scrivendo codice." },
  { Icon: IcBuilding, title: "Territorio", desc: "Leggere e interpretare il territorio, il rilievo e le costruzioni." },
];

// La scuola in rami schematici: cosa mi è piaciuto, cosa è stato facile e cosa
// difficile nel percorso CAT.
const SCUOLA_RAMI = [
  {
    key: "like",
    Icon: IcHeart,
    title: "Mi è piaciuto",
    items: ["Disegno tecnico & AutoCAD", "Progettazione", "Topografia e rilievo"],
  },
  {
    key: "easy",
    Icon: IcZap,
    title: "Facile",
    items: ["Disegno e CAD", "Informatica e digitale", "Tecnologia delle costruzioni"],
  },
  {
    key: "hard",
    Icon: IcMountain,
    title: "Difficile",
    items: ["Estimo", "Matematica", "Calcoli di topografia"],
  },
];

const SPORT_PREF = [
  { Icon: IcTarget, label: "Tiro a segno" },
  { Icon: IcCrosshair, label: "Tiro a volo" },
  { Icon: IcWaves, label: "Nuoto" },
  { Icon: IcVolley, label: "Pallavolo" },
];

const SPORT_STORIA = [
  { year: "2014", label: "Nuoto", note: "un anno" },
  { year: "2015", label: "Pallavolo", note: "un anno" },
  { year: "2017", label: "Basket", note: "due anni" },
  { year: "2024 — oggi", label: "Tiro a volo", note: "al poligono, con calma" },
];

// I nomi dei formaggi e dei piatti restano in italiano in ogni lingua.
const FORMAGGI = ["Pecorino sardo stagionato", "Gorgonzola", "Grana Padano DOP"];
const PIATTI = ["Spaghetti cacio e pepe", "Spaghetti alle vongole", "Pizza ai quattro formaggi", "Filetto di manzo"];

export default function MeStesso() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Me stesso · Alberto Pecchini — Esame di Stato 2026";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sb-home ms-page">
      {/* Skiplink — requisito di accessibilità */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: brand + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-ms-tagline">Presentazione personale</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-ms-back">
            <IcArrowLeft size={15} /> Torna alla home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Copertina — titolo a sinistra, ritratto in pannello a destra */}
        <section className="sb-hero" aria-labelledby="ms-hero-title">
          <div className="sb-container">
            <div className="sb-ms-hero-grid">
              <div>
                <span className="sb-ms-kicker">Esame di Stato 2026</span>
                <h1 className="sb-hero-title" id="ms-hero-title">
                  <span translate="no">Alberto Pecchini</span>
                  <span className="sb-brandline">Presentazione personale</span>
                </h1>
                <div className="sb-hero-copy sb-ms-hero-copy">
                  <p>Istituto Tecnico «Carlo d'Arco» — Mantova · Indirizzo CAT · Classe 5BT</p>
                </div>
              </div>
              <div className="sb-ms-portrait">
                <div className="sb-panel">
                  <div className="sb-panel-inner">
                    <img
                      src="/alberto-pecchini.jpg"
                      alt="Ritratto di Alberto Pecchini"
                      width={1050}
                      height={1400}
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi sono */}
        <section className="sb-section" aria-labelledby="ms-chi-sono">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">01 — Chi sono</span>
              <h2 id="ms-chi-sono">Un po' di me</h2>
            </div>
            <div className="sb-ms-prose">
              <p>
                Sono uno studente CAT all'ultimo anno e, fuori dai banchi,
                <strong> designer e sviluppatore front-end</strong>. Sono cresciuto a Rivalta sul Mincio,
                dove la mia famiglia ha le sue radici e una sua attività.
              </p>
            </div>

            {/* Dati essenziali */}
            <div className="sb-ms-facts">
              {FACTS.map(({ Icon, value, label, own }) => (
                <div className="sb-panel" key={value}>
                  <div className="sb-panel-inner sb-ms-fact">
                    <span className="sb-ms-fact-icon" aria-hidden="true"><Icon size={18} /></span>
                    <span className="sb-ms-fact-value" {...(own ? { translate: "no" as const } : {})}>{value}</span>
                    <span className="sb-ms-fact-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sb-ms-gallery sb-ms-gallery--one">
              <Shot
                src="/images/me-stesso/rivalta.jpg"
                alt="Rivalta sul Mincio, dove sono cresciuto"
                caption="Tra Rivalta e Mantova"
                Icon={IcPin}
                wide
              />
            </div>
          </div>
        </section>

        {/* ③ Le mie radici */}
        <section className="sb-section" aria-labelledby="ms-radici">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">02 — Le mie radici</span>
              <h2 id="ms-radici">La mia famiglia e l'azienda</h2>
            </div>

            <div className="sb-ms-story">
              <div>
                <div className="sb-ms-prose">
                  <p>
                    La mia storia parte da <strong translate="no">Rivalta sul Mincio</strong> e dalla mia famiglia. Fin da
                    piccolo sono cresciuto dando una mano nell'attività di casa: non un passatempo, ma il
                    modo in cui ho imparato cosa significhi <strong>lavorare davvero</strong>.
                  </p>
                  <p>
                    Con mio padre mi occupo della manutenzione di <strong>parchi e arredi esterni</strong> —
                    le piscine, il verde, gli spazi delle proprietà — e guido le <strong>macchine
                    operatrici</strong> della cascina. Un lavoro concreto, fatto di mani, stagioni e
                    attenzione ai dettagli.
                  </p>
                  <p>
                    In azienda ho preso in carico tutto il <strong>lato digitale</strong>: gli ordini online,
                    le foto satellitari che servono a preparare i preventivi e gli annunci per la vendita
                    dell'usato. È qui che le mie due anime — quella pratica e quella informatica — si
                    incontrano.
                  </p>
                </div>
                <div className="sb-ms-badge">
                  <span className="sb-ms-badge-ic" aria-hidden="true"><IcSprout size={18} /></span>
                  <span className="sb-ms-badge-text">
                    <span className="sb-ms-badge-name">Cascina &amp; azienda di famiglia</span>
                    <span className="sb-ms-badge-sub" translate="no">Rivalta sul Mincio (MN)</span>
                  </span>
                </div>
              </div>
              <div>
                <Shot
                  src="/images/me-stesso/cascina.jpg"
                  alt="La cascina di famiglia a Rivalta sul Mincio"
                  Icon={IcSprout}
                />
              </div>
            </div>

            {/* Cosa faccio in azienda */}
            <div className="sb-ms-roles">
              {RUOLI.map(({ Icon, label, note }) => (
                <div className="sb-panel" key={label}>
                  <div className="sb-panel-inner sb-ms-role">
                    <span className="sb-ms-role-ic" aria-hidden="true"><Icon size={19} /></span>
                    <span className="sb-ms-role-label">{label}</span>
                    <span className="sb-ms-role-note">{note}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Galleria del lavoro */}
            <div className="sb-ms-gallery">
              <Shot
                src="/images/me-stesso/trattore.jpg"
                alt="Il Landini L25 Testacalda del 1957, la macchina operatrice storica di famiglia"
                caption="Landini L25 Testacalda · 1957"
                Icon={IcTractor}
                focus="50% 72%"
              />
              <Shot
                src="/images/me-stesso/manutenzione.jpg"
                alt="Manutenzione del verde e degli arredi esterni"
                caption="Manutenzione esterni"
                Icon={IcPark}
              />
              <Shot
                src="/images/me-stesso/azienda-digitale.jpg"
                alt="Il lato digitale: preventivi e foto satellitari"
                caption="Il digitale dell'azienda"
                Icon={IcScreen}
              />
            </div>
          </div>
        </section>

        {/* ④ Il mio percorso */}
        <section className="sb-section" aria-labelledby="ms-percorso">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">03 — Il mio percorso</span>
              <h2 id="ms-percorso">Perché ho scelto il CAT</h2>
            </div>
            <div className="sb-ms-prose">
              <p>
                Mi ha spinto la voglia di un percorso concreto e creativo insieme: disegnare, progettare,
                capire il territorio e le costruzioni. Ed è lo stesso disegno tecnico che, fuori dalla
                scuola, mi ha portato verso il <strong>web design</strong> e lo <strong>sviluppo</strong>.
              </p>
            </div>

            <div className="sb-ms-cards">
              {PERCORSO.map(({ Icon, title, desc }) => (
                <div className="sb-panel" key={title}>
                  <div className="sb-panel-inner sb-ms-card">
                    <span className="sb-ms-card-ic" aria-hidden="true"><Icon size={19} /></span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* La scuola in rami schematici */}
            <div className="sb-ms-tree-wrap">
              <h3 className="sb-ms-subhead">La scuola, in breve</h3>
              <p className="sb-ms-subnote">
                Cosa mi è piaciuto, cosa è stato facile e cosa più difficile.
              </p>
              <div className="sb-ms-tree">
                <div className="sb-ms-tree-top">
                  <span className="sb-ms-tree-root">
                    <IcSchool size={16} />
                    La scuola · il CAT
                  </span>
                </div>
                <span className="sb-ms-trunk" aria-hidden="true" />
                <div className="sb-ms-branches">
                  {SCUOLA_RAMI.map(({ key, Icon, title, items }) => (
                    <div className="sb-panel" key={key}>
                      <div className="sb-panel-inner sb-ms-branch">
                        <div className="sb-ms-branch-head">
                          <span className="sb-ms-branch-ic" aria-hidden="true"><Icon size={16} /></span>
                          {title}
                        </div>
                        <ul className="sb-ms-list">
                          {items.map((it) => <li key={it}>{it}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ Il restauro — dove tutto è iniziato */}
        <section className="sb-section" aria-labelledby="ms-restauro">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">04 — Il restauro</span>
              <h2 id="ms-restauro">Dove è iniziato tutto</h2>
            </div>

            <div className="sb-ms-story">
              <div>
                <Shot
                  src="/images/me-stesso/restauro-1.jpg"
                  alt="Al corso di restauro nel 2018, al lavoro su un vecchio muro"
                  caption="2018 — le mani sui mattoni"
                  Icon={IcBrick}
                />
              </div>
              <div>
                <p className="sb-ms-lead">Tutto, in fondo, è cominciato da qui.</p>
                <div className="sb-ms-prose">
                  <p>
                    Nel 2018 — avevo dodici anni — ho seguito un <strong>corso di restauro</strong> al
                    Seminario di Mantova (oggi <strong translate="no">Unicollege Mantova</strong>), tra le iniziative per i
                    giovani di <strong translate="no">Santagnese10 Officina Creativa</strong>, l'hub del centro storico che
                    ospita il primo coworking della città.
                  </p>
                  <p>
                    Con i guanti da lavoro ho ripulito e rimesso in sesto vecchi muri di mattoni e ciottoli:
                    è stata la prima volta che mettevo le mani su un <strong>edificio storico</strong> — e mi
                    è rimasta dentro. Di lì a poco avrei scelto il CAT.
                  </p>
                </div>
              </div>
            </div>

            <div className="sb-ms-gallery sb-ms-gallery--two">
              <Shot
                src="/images/me-stesso/restauro-2.jpg"
                alt="Il gruppo di ragazzi al corso di restauro"
                Icon={IcUsers}
              />
              <Shot
                src="/images/me-stesso/restauro-3.jpg"
                alt="L'edificio storico in mattoni e ciottoli su cui abbiamo lavorato"
                Icon={IcBrick}
              />
            </div>
          </div>
        </section>

        {/* ⑥ Le mie passioni */}
        <section className="sb-section" aria-labelledby="ms-passioni">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">05 — Le mie passioni</span>
              <h2 id="ms-passioni">Ciò che mi muove</h2>
            </div>

            {/* Web design & sviluppo */}
            <div className="sb-ms-story">
              <div>
                <Shot
                  src="/images/me-stesso/web.jpg"
                  alt="Alberto al lavoro su un progetto web"
                  caption="Designer & front-end developer"
                  Icon={IcCode}
                />
              </div>
              <div>
                <h3 className="sb-ms-subhead">La passione più grande: creare per il web</h3>
                <p className="sb-ms-lead">
                  Progetto e sviluppo siti web e web game: è ciò che mi definisce.
                </p>
                <div className="sb-ms-prose">
                  <p>
                    Mi occupo di tutto, dall'idea al codice: ho realizzato siti veri — <strong translate="no">Cascina
                    Fontana</strong> e <strong translate="no">Rivalta sul Mincio</strong> — e <strong translate="no">Trivia</strong>,
                    un web game sulla storia dell'architettura curato nel design e nelle animazioni.
                  </p>
                  <p>
                    Amo trasformare un'idea in qualcosa che si può toccare a schermo, iterarla e rifinirla
                    fino all'ultimo dettaglio.
                  </p>
                </div>
              </div>
            </div>

            {/* Viaggi & organizzazione */}
            <div className="sb-ms-story">
              <div>
                <h3 className="sb-ms-subhead">Viaggiare e organizzare ogni dettaglio</h3>
                <p className="sb-ms-lead">
                  Adoro scoprire posti nuovi — e adoro che tutto fili liscio.
                </p>
                <div className="sb-ms-prose">
                  <p>
                    Quando partiamo in gruppo, anche solo tra amici (Parigi, Le Havre…), sono io a gestire
                    biglietti, prenotazioni e itinerari: con le mie competenze informatiche tengo insieme
                    tutta l'organizzazione. In viaggio, sono <strong>il cervello delle operazioni</strong>.
                  </p>
                </div>
                <div className="sb-ms-callout">
                  <span className="sb-ms-callout-ic" aria-hidden="true"><IcPlane size={18} /></span>
                  <p>
                    Il viaggio a cui tengo di più me lo sono <strong>regalato io</strong>: nell'<strong>estate
                    2024</strong>, appena compiuti i 18 anni, sono partito per una vacanza studio a
                    <strong> Dublino</strong>. Per la prima volta ho preso l'aereo, ho scoperto un Paese
                    nuovo e per un mese ho provato a vivere e studiare interamente in inglese.
                  </p>
                </div>
              </div>
              <div>
                <Shot
                  src="/images/me-stesso/dublino.jpg"
                  alt="Vacanza studio a Dublino"
                  caption="Dublino — il regalo per i miei 18 anni"
                  Icon={IcPlane}
                />
              </div>
            </div>

            {/* Paesi visitati — bandiere */}
            <div className="sb-ms-block">
              <p className="sb-ms-blocktitle">
                <IcPin size={16} aria-hidden="true" /> Paesi visitati
                <span className="sb-ms-blocknote"> — in ordine di distanza da casa</span>
              </p>
              <div className="sb-ms-flags">
                {COUNTRIES.map(({ name, Flag, own }) => (
                  <div className="sb-ms-flag" key={name}>
                    <span className="sb-ms-flag-img"><Flag /></span>
                    <span className="sb-ms-flag-name" {...(own ? { translate: "no" as const } : {})}>{name}</span>
                  </div>
                ))}
              </div>
              <div className="sb-ms-gallery sb-ms-gallery--two">
                <Shot
                  src="/images/me-stesso/parigi.jpg"
                  alt="Viaggio a Parigi e Le Havre con gli amici"
                  Icon={IcPlane}
                />
                <Shot
                  src="/images/me-stesso/viaggio-gruppo.jpg"
                  alt="Il gruppo di amici in viaggio"
                  Icon={IcUsers}
                />
              </div>
            </div>

            {/* Lo sport: il tiro */}
            <div className="sb-ms-story">
              <div>
                <Shot
                  src="/images/me-stesso/tiro.jpg"
                  alt="Al poligono di tiro insieme a mio padre"
                  caption="Con mio papà, al poligono"
                  Icon={IcCrosshair}
                  portrait
                  focus="50% 30%"
                />
              </div>
              <div>
                <h3 className="sb-ms-subhead">Lo sport che mi rappresenta: il tiro</h3>
                <p className="sb-ms-lead">
                  Mira, respiro, concentrazione: il tiro è il mio sport.
                </p>
                <div className="sb-ms-prose">
                  <p>
                    A farmi appassionare al mondo delle armi è stato <strong>mio padre</strong>: è grazie a
                    lui se ho iniziato. Oggi pratico il <strong>tiro a volo</strong> al poligono «Al Perrosso»
                    di Castel Goffredo (MN), seguito dal maestro <strong translate="no">Fausto Chitò</strong>. Lo prendo con
                    calma, ma è la disciplina in cui mi ritrovo di più: silenzio, precisione e nervi saldi.
                  </p>
                  <p>
                    Prima di arrivarci ho provato un po' di tutto — nuoto, pallavolo, basket — ma è qui che
                    mi sono fermato.
                  </p>
                </div>
                <div className="sb-ms-chips">
                  {SPORT_PREF.map(({ Icon, label }) => (
                    <span className="sb-chip" key={label}><Icon size={14} /> {label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini-storico sportivo */}
            <div className="sb-ms-track">
              {SPORT_STORIA.map((s) => (
                <div className="sb-panel" key={s.label}>
                  <div className="sb-panel-inner sb-ms-track-item">
                    <span className="sb-ms-track-year">{s.year}</span>
                    <span className="sb-ms-track-label">{s.label}</span>
                    <span className="sb-ms-track-note">{s.note}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Su strada: moto & auto */}
            <div className="sb-ms-story">
              <div>
                <h3 className="sb-ms-subhead">Su due ruote (e quattro): la mia libertà</h3>
                <p className="sb-ms-lead">
                  Quando le giornate diventano monotone, salgo in sella.
                </p>
                <div className="sb-ms-prose">
                  <p>
                    Dal 2023 ho una <strong translate="no">Ducati Scrambler 125</strong>: la uso per staccare la spina e
                    schiarirmi le idee. Sono ancora un rider alle prime armi, ma mi diverto.
                  </p>
                  <p>
                    Da un anno ho anche la patente dell'auto, e non mi sono fatto mancare qualche viaggio su
                    strada: <strong translate="no">Milano, Brescia, Verona, Bologna, Piacenza</strong>.
                  </p>
                </div>
                <div className="sb-ms-chips">
                  <span className="sb-chip"><IcMoto size={14} /> <span translate="no">Ducati Scrambler 125</span></span>
                  <span className="sb-chip"><IcCar size={14} /> Patente da 1 anno</span>
                </div>
              </div>
              <div>
                <Shot
                  src="/images/me-stesso/moto.jpg"
                  alt="La mia Ducati Scrambler 125"
                  caption="La Scrambler, per staccare"
                  Icon={IcMoto}
                />
              </div>
            </div>

            {/* Stare con gli altri */}
            <div className="sb-ms-block">
              <div className="sb-ms-blockhead">
                <span className="sb-ms-block-ic" aria-hidden="true"><IcHeart size={19} /></span>
                <div>
                  <h3 className="sb-ms-subhead">Stare con gli altri, a modo mio</h3>
                  <p className="sb-ms-lead">
                    Preferisco la compagnia vera ai posti affollati.
                  </p>
                </div>
              </div>
              <div className="sb-ms-prose">
                <p>
                  Le discoteche non fanno per me: meglio organizzare <strong>piccole feste in cascina</strong>,
                  dove c'è più tranquillità e ci si gode davvero le persone. E poi c'è il volontariato — per
                  due estati ho fatto l'<strong>animatore al Grest</strong> di Rivalta e ho dato una mano al
                  <strong translate="no"> CRED</strong> di Rodigo, con i bambini. Stare in mezzo agli altri, guidare un
                  gruppo, inventare attività: mi dà energia.
                </p>
              </div>
              <div className="sb-ms-gallery sb-ms-gallery--two">
                <Shot
                  src="/images/me-stesso/festa-cascina.jpg"
                  alt="Una piccola festa organizzata in cascina"
                  Icon={IcUsers}
                />
                <Shot
                  src="/images/me-stesso/grest.jpg"
                  alt="Animatore al Grest con i bambini"
                  Icon={IcHeart}
                />
              </div>
            </div>

            {/* Buona tavola */}
            <div className="sb-ms-story">
              <div>
                <Shot
                  src="/images/me-stesso/cucina.jpg"
                  alt="Panino sardo con crudo di Villagrande, pecorino sardo, pomodorini e rucola"
                  caption="Sardegna: crudo di Villagrande e pecorino"
                  Icon={IcFork}
                  portrait
                />
              </div>
              <div>
                <h3 className="sb-ms-subhead">Buona tavola</h3>
                <p className="sb-ms-lead">
                  Sono un tipo a cui piace mangiar bene — e un buon panino, fatto con prodotti veri, per
                  me vale quanto un piatto.
                </p>
                <div className="sb-ms-prose">
                  <p>
                    Come questo, gustato in Sardegna: <strong>pane di semola morbido</strong> (un
                    moddizzosu, il cugino soffice del carasau), <strong>prosciutto crudo di Villagrande</strong>,
                    <strong> pecorino sardo stagionato</strong>, pomodorini, rucola e un filo d'<strong>olio
                    extravergine DOP di Sardegna</strong>.
                  </p>
                </div>
                <div className="sb-ms-taste">
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-ms-taste-card">
                      <h4 className="sb-ms-taste-title">Formaggi del cuore</h4>
                      <ul className="sb-ms-list">
                        {FORMAGGI.map((f) => <li key={f} translate="no">{f}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-ms-taste-card">
                      <span className="sb-ms-taste-title">Piatti che non rifiuto mai</span>
                      <ul className="sb-ms-list">
                        {PIATTI.map((p) => <li key={p} translate="no">{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Il mio domani */}
        <section className="sb-section" aria-labelledby="ms-domani">
          <div className="sb-container">
            <div className="sb-ms-sechead">
              <span className="sb-ms-kicker">06 — Il mio domani</span>
              <h2 id="ms-domani">Il mio futuro</h2>
            </div>
            <div className="sb-ms-story">
              <div>
                <p className="sb-ms-lead">
                  Voglio unire le mie due strade: il <strong>lavoro concreto</strong> e il <strong>digitale.</strong>
                </p>
                <div className="sb-ms-prose">
                  <p>
                    Il mio obiettivo è rilevare <strong translate="no">Punto Energy Service</strong>, il punto vendita
                    «Home Engineer» di Medole — batterie, caricabatterie, lubrificanti e ricambi per auto e
                    automezzi — e farlo crescere costruendogli un <strong>e-commerce</strong> tutto mio, per
                    vendere online e raggiungere molti più clienti. È qui che le competenze che già uso ogni
                    giorno — web, gestione digitale, vendite online — diventano un progetto di vita.
                  </p>
                </div>
                <div className="sb-ms-chips">
                  <span className="sb-chip"><IcStore size={14} /> Il punto vendita</span>
                  <span className="sb-chip"><IcCart size={14} /> <span translate="no">E-commerce</span></span>
                  <span className="sb-chip"><IcTrend size={14} /> Crescita online</span>
                </div>
              </div>
              <div>
                <Shot
                  src="/images/me-stesso/futuro.jpg"
                  alt="Il punto vendita Punto Energy Service a Medole"
                  caption="Punto Energy Service — Medole"
                  Icon={IcStore}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ Grazie — chiusura */}
        <section className="sb-section sb-cta sb-ms-thanks" aria-label="Grazie per l'attenzione">
          <div className="sb-container">
            <Shot
              src="/images/me-stesso/grazie.jpg"
              alt=""
              Icon={IcPlane}
              wide
              focus="50% 45%"
            />
            <h2>
              Grazie
              <span className="sb-brandline">per l'attenzione</span>
            </h2>
            <p className="sb-ms-sign">Alberto Pecchini — Esame di Stato 2026</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
