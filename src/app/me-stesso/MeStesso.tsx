import { useEffect, useState } from "react";
import { currentTheme, subscribeTheme } from "../theme/themeCore";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Cake,
  CalendarDays,
  Sprout,
  Tractor,
  Trees,
  Waves,
  MonitorSmartphone,
  Ruler,
  DraftingCompass,
  Building2,
  BrickWall,
  Code2,
  Plane,
  Target,
  Crosshair,
  Volleyball,
  Bike,
  Car,
  HeartHandshake,
  Users,
  UtensilsCrossed,
  Store,
  ShoppingCart,
  TrendingUp,
  Quote,
  School,
  Heart,
  Zap,
  Mountain,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// «Me stesso» — Presentazione personale di Alberto Pecchini (Esame di Stato 2026).
//
// Due temi commutabili col tasto luna/sole in alto:
//  · CHIARO (default): sfondo bianco, scritte viola scuro;
//  · SCURO "dark premium": fondo scuro e neon viola (lo stesso del gioco Trivia).
// Tutti i colori passano da variabili CSS definite per tema, così una sola
// classe (.ms-light / .ms-dark) ribalta l'intera pagina. Le foto vivono in
// /images/me-stesso/: se mancano, ogni cornice mostra un placeholder coerente.
// ─────────────────────────────────────────────────────────────────────────────

// Età calcolata dal giorno di nascita: niente numero che invecchia da solo.
function ageFromISO(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a -= 1;
  return a;
}

// Cornice foto con fallback elegante: se l'immagine manca, mostra un
// placeholder coerente con la palette, senza spezzare il layout.
//
// Inquadramento: la prop `focus` imposta l'object-position dell'immagine
// (es. "50% 30%") per scegliere quale parte resta in cornice quando la foto
// viene ritagliata in cover — così i volti non vengono mai tagliati a metà.
function Shot({
  src,
  alt,
  caption,
  icon,
  portrait = false,
  focus,
}: {
  src: string;
  alt: string;
  caption?: string;
  icon: React.ReactNode;
  portrait?: boolean;
  focus?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`ms-shot${portrait ? " ms-shot--portrait" : ""}`}>
      {failed ? (
        <div className="ms-shot-ph" role="img" aria-label={alt}>
          <span className="ms-shot-ph-ic" aria-hidden="true">{icon}</span>
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
    </figure>
  );
}

// ── Bandiere SVG (colori reali) ──────────────────────────────────────────────
const FlagItalia = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#009246" />
    <rect x="40" width="20" height="40" fill="#CE2B37" />
  </svg>
);
const FlagSanMarino = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
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
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#D52B1E" />
    <rect x="26" y="10" width="8" height="20" fill="#ffffff" />
    <rect x="20" y="16" width="20" height="8" fill="#ffffff" />
  </svg>
);
const FlagAustria = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="60" height="13.34" fill="#ED2939" />
    <rect y="26.66" width="60" height="13.34" fill="#ED2939" />
  </svg>
);
const FlagFrancia = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#0055A4" />
    <rect x="40" width="20" height="40" fill="#EF4135" />
  </svg>
);
const FlagIrlanda = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#ffffff" />
    <rect width="20" height="40" fill="#169B62" />
    <rect x="40" width="20" height="40" fill="#FF883E" />
  </svg>
);
const FlagScozia = () => (
  <svg viewBox="0 0 60 40" className="ms-flag-svg" aria-hidden="true">
    <rect width="60" height="40" fill="#005EB8" />
    <path d="M0 0 L60 40 M60 0 L0 40" stroke="#ffffff" strokeWidth="8" />
  </svg>
);

// Paesi visitati, in ordine di distanza da casa (Rivalta sul Mincio).
const COUNTRIES = [
  { name: "Italia", Flag: FlagItalia },
  { name: "San Marino", Flag: FlagSanMarino },
  { name: "Svizzera", Flag: FlagSvizzera },
  { name: "Austria", Flag: FlagAustria },
  { name: "Francia", Flag: FlagFrancia },
  { name: "Irlanda", Flag: FlagIrlanda },
  { name: "Scozia", Flag: FlagScozia },
];

const FACTS = [
  { Icon: Cake, value: `${ageFromISO("2006-06-28")} anni`, label: "Nato il 28 giugno 2006" },
  { Icon: MapPin, value: "Rivalta sul Mincio", label: "Comune di Rodigo, provincia di Mantova" },
  { Icon: GraduationCap, value: "Classe 5BT", label: "Diploma CAT — Costruzioni, Ambiente e Territorio" },
  { Icon: CalendarDays, value: "5 anni", label: "di percorso, che oggi si concludono qui" },
];

const RUOLI = [
  { Icon: Tractor, label: "Macchine operatrici", note: "guida e lavori in cascina" },
  { Icon: Trees, label: "Parchi & giardini", note: "cura del verde delle proprietà" },
  { Icon: Waves, label: "Piscine & arredi esterni", note: "manutenzione con mio padre" },
  { Icon: MonitorSmartphone, label: "Tutto il digitale", note: "ordini, preventivi, usato online" },
];

const PERCORSO = [
  { Icon: Ruler, title: "Disegno e progetto", desc: "Progettare con metodo e precisione, dall'AutoCAD fino al dettaglio." },
  { Icon: DraftingCompass, title: "Metodo e rigore", desc: "Ragionare per problemi e risolverli un passo alla volta — anche scrivendo codice." },
  { Icon: Building2, title: "Territorio", desc: "Leggere e interpretare il territorio, il rilievo e le costruzioni." },
];

// La scuola in rami schematici: cosa mi è piaciuto, cosa è stato facile e cosa
// difficile nel percorso CAT. Contenuti da personalizzare con l'esperienza reale.
const SCUOLA_RAMI = [
  {
    key: "like",
    Icon: Heart,
    title: "Mi è piaciuto",
    items: ["Disegno tecnico & AutoCAD", "Progettazione", "Topografia e rilievo"],
  },
  {
    key: "easy",
    Icon: Zap,
    title: "Facile",
    items: ["Disegno e CAD", "Informatica e digitale", "Tecnologia delle costruzioni"],
  },
  {
    key: "hard",
    Icon: Mountain,
    title: "Difficile",
    items: ["Estimo", "Matematica", "Calcoli di topografia"],
  },
];

const SPORT_PREF = [
  { Icon: Target, label: "Tiro a segno" },
  { Icon: Crosshair, label: "Tiro a volo" },
  { Icon: Waves, label: "Nuoto" },
  { Icon: Volleyball, label: "Pallavolo" },
];

const SPORT_STORIA = [
  { year: "2014", label: "Nuoto", note: "un anno" },
  { year: "2015", label: "Pallavolo", note: "un anno" },
  { year: "2017", label: "Basket", note: "due anni" },
  { year: "2024 — oggi", label: "Tiro a volo", note: "al poligono, con calma" },
];

const FORMAGGI = ["Pecorino sardo stagionato", "Gorgonzola", "Grana Padano DOP"];
const PIATTI = ["Spaghetti cacio e pepe", "Spaghetti alle vongole", "Pizza ai quattro formaggi", "Filetto di manzo"];

export default function MeStesso() {
  const [theme, setTheme] = useState<"light" | "dark">(() => currentTheme());

  useEffect(() => {
    const prev = document.title;
    document.title = "Me stesso · Alberto Pecchini — Esame di Stato 2026";
    return () => { document.title = prev; };
  }, []);

  // Il tema segue il sistema globale (tasto luna/sole + sensore orario).
  useEffect(() => subscribeTheme(setTheme), []);

  return (
    <div className={`it-page-wrapper ms-page ms-${theme}`}>
      {/* Header compatto: marchio del portfolio + ritorno alla home (il tasto
          tema ora è quello globale, in basso a sinistra). */}
      <header className="ms-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="ms-brand text-decoration-none d-inline-flex align-items-center">
              <span className="ms-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="ms-brand-text">
                <span className="ms-brand-title">Alberto Pecchini</span>
                <span className="ms-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </Link>
            <Link to="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" />
              <span>Torna alla home</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Copertina */}
        <section className="ms-hero">
          <div className="container">
            <div className="ms-hero-grid">
              <div className="ms-hero-text">
                <span className="ms-hero-badge" aria-hidden="true">
                  <GraduationCap size={44} strokeWidth={1.75} />
                </span>
                <p className="ap-kicker text-uppercase fw-semibold mb-3">Esame di Stato 2026</p>
                <h1 className="ms-hero-title fw-bold">Alberto Pecchini</h1>
                <span className="ms-hero-rule" aria-hidden="true" />
                <p className="ms-hero-lead">Presentazione personale</p>
                <p className="ms-hero-school d-inline-flex align-items-center mb-0">
                  Istituto Tecnico «Carlo d'Arco» — Mantova · Indirizzo CAT · Classe 5BT
                </p>
              </div>
              <div className="ms-hero-aside">
                <Shot
                  src="/alberto-pecchini.jpg"
                  alt="Ritratto di Alberto Pecchini"
                  icon={<GraduationCap size={64} strokeWidth={1.5} />}
                  portrait
                  focus="50% 30%"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi sono */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">01 — Chi sono</p>
              <h2 className="display-5 fw-bold mb-2">Un po' di me</h2>
              <p className="ms-prose mb-0" style={{ maxWidth: "46rem" }}>
                Sono uno studente CAT all'ultimo anno e, fuori dai banchi,
                <strong> designer e sviluppatore front-end</strong>. Sono cresciuto a Rivalta sul Mincio,
                dove la mia famiglia ha le sue radici e una sua attività.
              </p>
            </div>
            <div className="ms-about">
              <div className="ms-facts">
                {FACTS.map(({ Icon, value, label }) => (
                  <div className="ms-fact" key={value}>
                    <span className="ms-fact-icon" aria-hidden="true"><Icon size={22} /></span>
                    <span className="ms-fact-value">{value}</span>
                    <span className="ms-fact-label">{label}</span>
                  </div>
                ))}
              </div>
              <Shot
                src="/images/me-stesso/rivalta.jpg"
                alt="Rivalta sul Mincio, dove sono cresciuto"
                caption="Tra Rivalta e Mantova"
                icon={<MapPin size={56} strokeWidth={1.5} />}
              />
            </div>
          </div>
        </section>

        {/* ③ Le mie radici */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Le mie radici</p>
              <h2 className="display-5 fw-bold mb-0">La mia famiglia e l'azienda</h2>
            </div>
            <div className="ms-story-row">
              <div className="ms-story-text">
                <p className="ms-prose">
                  La mia storia parte da <strong>Rivalta sul Mincio</strong> e dalla mia famiglia. Fin da
                  piccolo sono cresciuto dando una mano nell'attività di casa: non un passatempo, ma il
                  modo in cui ho imparato cosa significhi <strong>lavorare davvero</strong>.
                </p>
                <p className="ms-prose">
                  Con mio padre mi occupo della manutenzione di <strong>parchi e arredi esterni</strong> —
                  le piscine, il verde, gli spazi delle proprietà — e guido le <strong>macchine
                  operatrici</strong> della cascina. Un lavoro concreto, fatto di mani, stagioni e
                  attenzione ai dettagli.
                </p>
                <p className="ms-prose">
                  In azienda ho preso in carico tutto il <strong>lato digitale</strong>: gli ordini online,
                  le foto satellitari che servono a preparare i preventivi e gli annunci per la vendita
                  dell'usato. È qui che le mie due anime — quella pratica e quella informatica — si
                  incontrano.
                </p>
                <div className="ms-company">
                  <span className="ms-company-ic" aria-hidden="true"><Sprout size={24} /></span>
                  <span className="ms-company-text">
                    <span className="ms-company-name">Cascina &amp; azienda di famiglia</span>
                    <span className="ms-company-sub">Rivalta sul Mincio (MN)</span>
                  </span>
                </div>
              </div>
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/cascina.jpg"
                  alt="La cascina di famiglia a Rivalta sul Mincio"
                  icon={<Sprout size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>

            {/* Cosa faccio in azienda */}
            <div className="ms-roles">
              {RUOLI.map(({ Icon, label, note }) => (
                <div className="ms-role" key={label}>
                  <span className="ms-role-ic" aria-hidden="true"><Icon size={22} /></span>
                  <span className="ms-role-label">{label}</span>
                  <span className="ms-role-note">{note}</span>
                </div>
              ))}
            </div>

            {/* Galleria del lavoro */}
            <div className="ms-gallery3">
              <Shot src="/images/me-stesso/trattore.jpg" alt="Il Landini L25 Testacalda del 1957, la macchina operatrice storica di famiglia" caption="Landini L25 Testacalda · 1957" icon={<Tractor size={48} strokeWidth={1.5} />} focus="50% 72%" />
              <Shot src="/images/me-stesso/manutenzione.jpg" alt="Manutenzione del verde e degli arredi esterni" caption="Manutenzione esterni" icon={<Trees size={48} strokeWidth={1.5} />} />
              <Shot src="/images/me-stesso/azienda-digitale.jpg" alt="Il lato digitale: preventivi e foto satellitari" caption="Il digitale dell'azienda" icon={<MonitorSmartphone size={48} strokeWidth={1.5} />} />
            </div>
          </div>
        </section>

        {/* ④ Il mio percorso — banda d'accento */}
        <section className="ms-band">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 ms-band-kicker">03 — Il mio percorso</p>
            <h2 className="display-5 fw-bold mb-3 text-white">Perché ho scelto il CAT</h2>
            <p className="ms-band-lead">
              Mi ha spinto la voglia di un percorso concreto e creativo insieme: disegnare, progettare,
              capire il territorio e le costruzioni. Ed è lo stesso disegno tecnico che, fuori dalla
              scuola, mi ha portato verso il <strong>web design</strong> e lo <strong>sviluppo</strong>.
            </p>
            <div className="ms-percorso">
              {PERCORSO.map(({ Icon, title, desc }) => (
                <div className="ms-percorso-card" key={title}>
                  <span className="ms-percorso-ic" aria-hidden="true"><Icon size={26} /></span>
                  <h3 className="ms-percorso-title">{title}</h3>
                  <p className="ms-percorso-desc mb-0">{desc}</p>
                </div>
              ))}
            </div>

            {/* La scuola in rami schematici */}
            <div className="ms-tree-wrap">
              <h3 className="ms-tree-heading">La scuola, in breve</h3>
              <p className="ms-tree-sub">
                Cosa mi è piaciuto, cosa è stato facile e cosa più difficile.
              </p>
              <div className="ms-tree">
                <div className="ms-tree-top">
                  <div className="ms-tree-root">
                    <span className="ms-tree-root-ic" aria-hidden="true"><School size={22} /></span>
                    La scuola · il CAT
                  </div>
                </div>
                <div className="ms-trunk" aria-hidden="true" />
                <div className="ms-tree-branches">
                  {SCUOLA_RAMI.map(({ key, Icon, title, items }) => (
                    <div className={`ms-branch ms-branch--${key}`} key={key}>
                      <div className="ms-branch-head">
                        <span className="ms-branch-ic" aria-hidden="true"><Icon size={18} /></span>
                        {title}
                      </div>
                      <ul className="ms-branch-list">
                        {items.map((it) => <li key={it}>{it}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ Il restauro — dove tutto è iniziato */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">04 — Il restauro</p>
              <h2 className="display-5 fw-bold mb-0">Dove è iniziato tutto</h2>
            </div>
            <div className="ms-story-row">
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/restauro-1.jpg" alt="Al corso di restauro nel 2018, al lavoro su un vecchio muro" caption="2018 — le mani sui mattoni" icon={<BrickWall size={56} strokeWidth={1.5} />} />
              </div>
              <div className="ms-story-text">
                <p className="ms-prose ms-prose--lead">Tutto, in fondo, è cominciato da qui.</p>
                <p className="ms-prose">
                  Nel 2018 — avevo dodici anni — ho seguito un <strong>corso di restauro</strong> al
                  Seminario di Mantova (oggi <strong>Unicollege Mantova</strong>), tra le iniziative per i
                  giovani di <strong>Santagnese10 Officina Creativa</strong>, l'hub del centro storico che
                  ospita il primo coworking della città.
                </p>
                <p className="ms-prose mb-0">
                  Con i guanti da lavoro ho ripulito e rimesso in sesto vecchi muri di mattoni e ciottoli:
                  è stata la prima volta che mettevo le mani su un <strong>edificio storico</strong> — e mi
                  è rimasta dentro. Di lì a poco avrei scelto il CAT.
                </p>
              </div>
            </div>
            <div className="ms-friends-grid mt-4">
              <Shot src="/images/me-stesso/restauro-2.jpg" alt="Il gruppo di ragazzi al corso di restauro" icon={<Users size={48} strokeWidth={1.5} />} />
              <Shot src="/images/me-stesso/restauro-3.jpg" alt="L'edificio storico in mattoni e ciottoli su cui abbiamo lavorato" icon={<BrickWall size={48} strokeWidth={1.5} />} />
            </div>
          </div>
        </section>

        {/* ⑥ Le mie passioni */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">05 — Le mie passioni</p>
              <h2 className="display-5 fw-bold mb-0">Ciò che mi muove</h2>
            </div>

            {/* Web design & sviluppo */}
            <div className="ms-story-row mb-5">
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/web.jpg" alt="Alberto al lavoro su un progetto web" caption="Designer & front-end developer" icon={<Code2 size={56} strokeWidth={1.5} />} />
              </div>
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">La passione più grande: creare per il web</h3>
                <p className="ms-prose ms-prose--lead">
                  Progetto e sviluppo siti web e web game: è ciò che mi definisce.
                </p>
                <p className="ms-prose">
                  Mi occupo di tutto, dall'idea al codice: ho realizzato siti veri — <strong>Cascina
                  Fontana</strong> e <strong>Rivalta sul Mincio</strong> — e <strong>Trivia</strong>,
                  un web game sulla storia dell'architettura curato nel design e nelle animazioni.
                </p>
                <p className="ms-prose mb-0">
                  Amo trasformare un'idea in qualcosa che si può toccare a schermo, iterarla e rifinirla
                  fino all'ultimo dettaglio.
                </p>
              </div>
            </div>

            {/* Viaggi & organizzazione */}
            <div className="ms-story-row mb-4">
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Viaggiare e organizzare ogni dettaglio</h3>
                <p className="ms-prose ms-prose--lead">
                  Adoro scoprire posti nuovi — e adoro che tutto fili liscio.
                </p>
                <p className="ms-prose">
                  Quando partiamo in gruppo, anche solo tra amici (Parigi, Le Havre…), sono io a gestire
                  biglietti, prenotazioni e itinerari: con le mie competenze informatiche tengo insieme
                  tutta l'organizzazione. In viaggio, sono <strong>il cervello delle operazioni</strong>.
                </p>
                <div className="ms-callout">
                  <span className="ms-callout-ic" aria-hidden="true"><Plane size={22} /></span>
                  <p className="mb-0">
                    Il viaggio a cui tengo di più me lo sono <strong>regalato io</strong>: nell'<strong>estate
                    2024</strong>, appena compiuti i 18 anni, sono partito per una vacanza studio a
                    <strong> Dublino</strong>. Per la prima volta ho preso l'aereo, ho scoperto un Paese
                    nuovo e per un mese ho provato a vivere e studiare interamente in inglese.
                  </p>
                </div>
              </div>
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/dublino.jpg" alt="Vacanza studio a Dublino" caption="Dublino — il regalo per i miei 18 anni" icon={<Plane size={56} strokeWidth={1.5} />} />
              </div>
            </div>

            {/* Paesi visitati — bandiere */}
            <div className="ms-flags-wrap mb-5">
              <p className="ms-block-title">
                <MapPin size={18} className="me-2" aria-hidden="true" /> Paesi visitati
                <span className="ms-block-note"> — in ordine di distanza da casa</span>
              </p>
              <div className="ms-flags">
                {COUNTRIES.map(({ name, Flag }) => (
                  <div className="ms-flag" key={name}>
                    <span className="ms-flag-svg-wrap"><Flag /></span>
                    <span className="ms-flag-name">{name}</span>
                  </div>
                ))}
              </div>
              <div className="ms-friends-grid mt-4">
                <Shot src="/images/me-stesso/parigi.jpg" alt="Viaggio a Parigi e Le Havre con gli amici" icon={<Plane size={48} strokeWidth={1.5} />} />
                <Shot src="/images/me-stesso/viaggio-gruppo.jpg" alt="Il gruppo di amici in viaggio" icon={<Users size={48} strokeWidth={1.5} />} />
              </div>
            </div>

            {/* Lo sport: il tiro */}
            <div className="ms-story-row mb-4">
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/tiro.jpg" alt="Al poligono di tiro insieme a mio padre" caption="Con mio papà, al poligono" icon={<Crosshair size={56} strokeWidth={1.5} />} portrait focus="50% 30%" />
              </div>
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Lo sport che mi rappresenta: il tiro</h3>
                <p className="ms-prose ms-prose--lead">
                  Mira, respiro, concentrazione: il tiro è il mio sport.
                </p>
                <p className="ms-prose">
                  A farmi appassionare al mondo delle armi è stato <strong>mio padre</strong>: è grazie a
                  lui se ho iniziato. Oggi pratico il <strong>tiro a volo</strong> al poligono «Al Perrosso»
                  di Castel Goffredo (MN), seguito dal maestro <strong>Fausto Chitò</strong>. Lo prendo con
                  calma, ma è la disciplina in cui mi ritrovo di più: silenzio, precisione e nervi saldi.
                </p>
                <p className="ms-prose mb-0">
                  Prima di arrivarci ho provato un po' di tutto — nuoto, pallavolo, basket — ma è qui che
                  mi sono fermato.
                </p>
              </div>
            </div>
            <div className="ms-chiprow">
              {SPORT_PREF.map(({ Icon, label }) => (
                <span className="ms-chip" key={label}><Icon size={15} aria-hidden="true" /> {label}</span>
              ))}
            </div>
            <div className="ms-track mb-5">
              {SPORT_STORIA.map((s) => (
                <div className="ms-track-item" key={s.label}>
                  <span className="ms-track-year">{s.year}</span>
                  <span className="ms-track-label">{s.label}</span>
                  <span className="ms-track-note">{s.note}</span>
                </div>
              ))}
            </div>

            {/* Su strada: moto & auto */}
            <div className="ms-story-row mb-5">
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Su due ruote (e quattro): la mia libertà</h3>
                <p className="ms-prose ms-prose--lead">
                  Quando le giornate diventano monotone, salgo in sella.
                </p>
                <p className="ms-prose">
                  Dal 2023 ho una <strong>Ducati Scrambler 125</strong>: la uso per staccare la spina e
                  schiarirmi le idee. Sono ancora un rider alle prime armi, ma mi diverto.
                </p>
                <p className="ms-prose mb-0">
                  Da un anno ho anche la patente dell'auto, e non mi sono fatto mancare qualche viaggio su
                  strada: <strong>Milano, Brescia, Verona, Bologna, Piacenza</strong>.
                </p>
                <div className="ms-chiprow mt-3">
                  <span className="ms-chip"><Bike size={15} aria-hidden="true" /> Ducati Scrambler 125</span>
                  <span className="ms-chip"><Car size={15} aria-hidden="true" /> Patente da 1 anno</span>
                </div>
              </div>
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/moto.jpg" alt="La mia Ducati Scrambler 125" caption="La Scrambler, per staccare" icon={<Bike size={56} strokeWidth={1.5} />} />
              </div>
            </div>

            {/* Stare con gli altri */}
            <div className="ms-friends mb-5">
              <div className="ms-friends-head">
                <span className="ms-pass-ic" aria-hidden="true"><HeartHandshake size={24} /></span>
                <div>
                  <h3 className="h3 fw-bold mb-2">Stare con gli altri, a modo mio</h3>
                  <p className="ms-prose ms-prose--lead mb-0">
                    Preferisco la compagnia vera ai posti affollati.
                  </p>
                </div>
              </div>
              <p className="ms-prose ms-friends-copy">
                Le discoteche non fanno per me: meglio organizzare <strong>piccole feste in cascina</strong>,
                dove c'è più tranquillità e ci si gode davvero le persone. E poi c'è il volontariato — per
                due estati ho fatto l'<strong>animatore al Grest</strong> di Rivalta e ho dato una mano al
                <strong> CRED</strong> di Rodigo, con i bambini. Stare in mezzo agli altri, guidare un
                gruppo, inventare attività: mi dà energia.
              </p>
              <div className="ms-friends-grid">
                <Shot src="/images/me-stesso/festa-cascina.jpg" alt="Una piccola festa organizzata in cascina" icon={<Users size={48} strokeWidth={1.5} />} />
                <Shot src="/images/me-stesso/grest.jpg" alt="Animatore al Grest con i bambini" icon={<HeartHandshake size={48} strokeWidth={1.5} />} />
              </div>
            </div>

            {/* Buona tavola */}
            <div className="ms-story-row">
              <div className="ms-story-art">
                <Shot src="/images/me-stesso/cucina.jpg" alt="Panino sardo con crudo di Villagrande, pecorino sardo, pomodorini e rucola" caption="Sardegna: crudo di Villagrande e pecorino" icon={<UtensilsCrossed size={56} strokeWidth={1.5} />} portrait />
              </div>
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Buona tavola</h3>
                <p className="ms-prose ms-prose--lead">
                  Sono un tipo a cui piace mangiar bene — e un buon panino, fatto con prodotti veri, per
                  me vale quanto un piatto.
                </p>
                <p className="ms-prose">
                  Come questo, gustato in Sardegna: <strong>pane di semola morbido</strong> (un
                  moddizzosu, il cugino soffice del carasau), <strong>prosciutto crudo di Villagrande</strong>,
                  <strong> pecorino sardo stagionato</strong>, pomodorini, rucola e un filo d'<strong>olio
                  extravergine DOP di Sardegna</strong>.
                </p>
                <div className="ms-taste">
                  <div className="ms-taste-card">
                    <h4 className="ms-taste-title">Formaggi del cuore</h4>
                    <ul className="ms-taste-list">
                      {FORMAGGI.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                  <div className="ms-taste-card">
                    <h4 className="ms-taste-title">Piatti che non rifiuto mai</h4>
                    <ul className="ms-taste-list">
                      {PIATTI.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑥ Il mio domani — banda di chiusura a gradiente */}
        <section className="ms-future">
          <div className="container">
            <div className="ms-future-grid">
              <div>
                <p className="ap-kicker text-uppercase fw-semibold mb-3 ms-future-kicker">06 — Il mio domani</p>
                <h2 className="display-5 fw-bold mb-3 text-white">Il mio futuro</h2>
                <p className="ms-future-hl">
                  Voglio unire le mie due strade: il <strong>lavoro concreto</strong> e il <strong>digitale.</strong>
                </p>
                <p className="ms-future-copy">
                  Il mio obiettivo è rilevare <strong>Punto Energy Service</strong>, il punto vendita
                  «Home Engineer» di Medole — batterie, caricabatterie, lubrificanti e ricambi per auto e
                  automezzi — e farlo crescere costruendogli un <strong>e-commerce</strong> tutto mio, per
                  vendere online e raggiungere molti più clienti. È qui che le competenze che già uso ogni
                  giorno — web, gestione digitale, vendite online — diventano un progetto di vita.
                </p>
                <div className="ms-future-chips">
                  <span className="ms-future-chip"><Store size={15} aria-hidden="true" /> Il punto vendita</span>
                  <span className="ms-future-chip"><ShoppingCart size={15} aria-hidden="true" /> E-commerce</span>
                  <span className="ms-future-chip"><TrendingUp size={15} aria-hidden="true" /> Crescita online</span>
                </div>
              </div>
              <div className="ms-future-art">
                <Shot src="/images/me-stesso/futuro.jpg" alt="Il punto vendita Punto Energy Service a Medole" caption="Punto Energy Service — Medole" icon={<Store size={56} strokeWidth={1.5} />} />
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Grazie — banner full-width */}
        <section className="ms-thanks" aria-label="Grazie per l'attenzione">
          <img
            src="/images/me-stesso/grazie.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="ms-thanks-scrim" aria-hidden="true" />
          <div className="ms-thanks-overlay">
            <div className="container">
              <Quote size={40} className="ms-thanks-quote" aria-hidden="true" />
              <h2 className="ms-thanks-title">Grazie<span> per l'attenzione</span></h2>
              <p className="ms-thanks-sign">Alberto Pecchini — Esame di Stato 2026</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Due temi commutabili (tasto luna/sole):
            · .ms-light — CHIARO di default: sfondo bianco, scritte viola scuro;
            · .ms-dark  — SCURO "dark premium": fondo scuro e neon viola (Trivia).
           Tutti i colori passano da variabili: una sola classe ribalta la pagina.
           ───────────────────────────────────────────────────────────────────── */
        .ms-page {
          min-height: 100vh;
          font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background: var(--page-bg);
          transition: background .35s ease, color .35s ease;
        }

        /* ── Tema CHIARO (default) ── */
        .ms-page.ms-light {
          --accent: #c2410c;
          --accent-2: #d9480f;
          --accent-3: #e8590c;
          --accent-deep: #9a3412;
          --ink: #a63a0d;
          --glow: rgba(194, 65, 12, 0.28);
          --text: #3d3846;
          --text-strong: #241f31;
          --sub: #6e6259;
          --surface: rgba(194, 65, 12, 0.09);
          --surface-bd: rgba(194, 65, 12, 0.30);
          --vio-soft: rgba(194, 65, 12, 0.12);
          --vio-bd: rgba(194, 65, 12, 0.38);
          --bg-light-tint: rgba(194, 65, 12, 0.08);
          --tree-line: rgba(194, 65, 12, 0.50);
          --bc-like: #15803d; --bc-easy: #a63a0d; --bc-hard: #b45309;
          --page-bg:
            radial-gradient(120% 70% at 50% -10%, rgba(194, 65, 12, 0.08) 0%, transparent 55%),
            linear-gradient(180deg, #ffffff 0%, #faf8f6 100%);
          --hdr-bg: rgba(255, 255, 255, 0.82);
          --panel: linear-gradient(160deg, #f7f4f1 0%, #f2ede8 45%, #ffffff 100%);
          --hero-bg:
            radial-gradient(90% 120% at 0% 0%, rgba(194, 65, 12, 0.12) 0%, transparent 55%),
            var(--panel);
          --band-bg:
            radial-gradient(100% 130% at 100% 0%, rgba(194, 65, 12, 0.10) 0%, transparent 55%),
            linear-gradient(160deg, #f6f3fe 0%, #ffffff 60%, #f3effd 100%);
          --future-bg:
            radial-gradient(90% 120% at 0% 0%, rgba(194, 65, 12, 0.18) 0%, transparent 55%),
            linear-gradient(135deg, #efeafd 0%, #e8defb 55%, #f6f3fe 100%);
          --thanks-bg: linear-gradient(135deg, #f7f4f1 0%, #ece6fa 100%);
          --thanks-scrim: linear-gradient(120deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 50%, rgba(236,230,250,0.4) 100%);
          --footer-bg: #f3f0fb;
          --shot-bg: rgba(194, 65, 12, 0.07);
          --ph-bg:
            radial-gradient(120% 120% at 30% 20%, rgba(194, 65, 12, 0.16), rgba(255, 255, 255, 0.2)),
            linear-gradient(135deg, #f2ede8 0%, #ffffff 100%);
          --blob-1: 0.16; --blob-2: 0.12;
        }

        /* ── Tema SCURO "dark premium" ── */
        .ms-page.ms-dark {
          --accent: #e95420;
          --accent-2: #dd4814;
          --accent-3: #f39a76;
          --accent-deep: #bc3d10;
          --ink: #f6a583;
          --glow: rgba(233, 84, 32, 0.45);
          --text: #f5f3f1;
          --text-strong: #ffffff;
          --sub: #b3aca6;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(233, 84, 32, 0.10);
          --vio-bd: rgba(233, 84, 32, 0.28);
          --bg-light-tint: rgba(255, 255, 255, 0.022);
          --tree-line: rgba(233, 84, 32, 0.4);
          --bc-like: #34d399; --bc-easy: #f6a583; --bc-hard: #fbbf24;
          --page-bg:
            radial-gradient(120% 70% at 50% -10%, rgba(233, 84, 32, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #241c22 0%, #1b151a 100%);
          --hdr-bg: rgba(28, 22, 27, 0.82);
          --panel: linear-gradient(160deg, #221a20 0%, #2a1e26 45%, #241c22 100%);
          --hero-bg:
            radial-gradient(90% 120% at 0% 0%, rgba(233, 84, 32, 0.22) 0%, transparent 55%),
            var(--panel);
          --band-bg:
            radial-gradient(100% 130% at 100% 0%, rgba(233, 84, 32, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #120c20 0%, #241c22 60%, #221a20 100%);
          --future-bg:
            radial-gradient(90% 120% at 0% 0%, rgba(233, 84, 32, 0.25) 0%, transparent 55%),
            linear-gradient(135deg, #2a1e26 0%, #322330 55%, #221a20 100%);
          --thanks-bg: linear-gradient(135deg, #221a20 0%, #241c22 100%);
          --thanks-scrim: linear-gradient(120deg, rgba(7,9,16,0.92) 0%, rgba(7,9,16,0.6) 50%, rgba(20,16,40,0.35) 100%);
          --footer-bg: #1b151a;
          --shot-bg: rgba(255, 255, 255, 0.04);
          --ph-bg:
            radial-gradient(120% 120% at 30% 20%, rgba(233, 84, 32, 0.22), rgba(10, 12, 16, 0.2)),
            linear-gradient(135deg, #221a20 0%, #241c22 100%);
          --blob-1: 0.45; --blob-2: 0.35;
        }

        /* Override delle utility Bootstrap dentro i temi */
        .ms-page .ap-kicker.text-primary { color: var(--ink) !important; }
        .ms-page .bg-white { background: transparent !important; }
        .ms-page .bg-light { background: var(--bg-light-tint) !important; }
        .ms-page .display-5, .ms-page .h3 { color: var(--text-strong); }
        .ms-page .text-white { color: var(--text-strong) !important; }
        .ms-page .btn-outline-light { border-color: var(--vio-bd); color: var(--text-strong); }
        .ms-page .btn-outline-light:hover,
        .ms-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #ffffff !important;
        }
        .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        /* Header — vetro con filo viola */
        .ms-header {
          background: var(--hdr-bg); position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
          transition: background .35s ease, border-color .35s ease;
        }
        .ms-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .ms-brand-mark img { width: 100%; height: 100%; display: block; }
        .ms-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .ms-brand-title { color: var(--text-strong); font-weight: 700; font-size: 1.05rem; }
        .ms-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .ms-brand-tagline { display: none; } }

        /* Hero copertina — pannello con aloni viola */
        .ms-hero {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5.5rem) 0;
          color: var(--text);
          background: var(--hero-bg);
          border-bottom: 1px solid var(--surface-bd);
        }
        .ms-hero::before, .ms-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(60px); pointer-events: none; z-index: 0;
        }
        .ms-hero::before { background: var(--accent); top: -30%; right: -10%; opacity: var(--blob-1); }
        .ms-hero::after  { background: var(--accent-deep); bottom: -35%; left: -12%; opacity: var(--blob-2); }
        .ms-hero .container { position: relative; z-index: 1; }
        .ms-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
        }
        .ms-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; margin-bottom: 1.5rem;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .ms-hero-title {
          font-size: clamp(2.75rem, 7vw, 5rem);
          line-height: 1.02; letter-spacing: -0.02em; margin-bottom: 1.1rem; color: var(--text-strong);
        }
        .ms-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px;
          background: var(--accent); box-shadow: 0 0 18px var(--glow); margin-bottom: 1.1rem;
        }
        .ms-hero-lead {
          font-size: clamp(1.25rem, 2.6vw, 1.7rem);
          font-style: italic; font-weight: 600; color: var(--text-strong); margin-bottom: 0.85rem;
        }
        .ms-hero-school { color: var(--sub); font-size: 1.02rem; }
        @media (max-width: 767.98px) {
          .ms-hero-grid { grid-template-columns: 1fr; }
          .ms-hero-badge { width: 68px; height: 68px; border-radius: 16px; margin-bottom: 1.1rem; }
          .ms-hero-badge svg { width: 36px; height: 36px; }
        }

        /* Cornici foto + placeholder */
        .ms-shot {
          position: relative; margin: 0;
          border-radius: 18px; overflow: hidden;
          aspect-ratio: 3 / 2;
          border: 1px solid var(--surface-bd);
          box-shadow: 0 18px 44px rgba(15, 8, 40, 0.18);
          background: var(--shot-bg);
        }
        .ms-shot--portrait { aspect-ratio: 4 / 5; }
        /* object-position default 50% 50%, sovrascrivibile via prop focus (inquadramento) */
        .ms-shot img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; display: block; }
        .ms-shot-ph {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background-image: var(--ph-bg);
        }
        .ms-shot-ph-ic { color: var(--ink); opacity: 0.6; }
        .ms-shot figcaption {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 1.8rem 0.95rem 0.7rem;
          font-size: 0.85rem; font-weight: 700; font-style: italic; color: #ffffff;
          background: linear-gradient(to top, rgba(7, 9, 16, 0.92), rgba(7, 9, 16, 0));
        }
        .ms-hero-aside .ms-shot { box-shadow: 0 24px 60px rgba(15, 8, 40, 0.22); border-color: var(--vio-bd); }

        /* Chi sono */
        .ms-about {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .ms-facts { display: flex; flex-direction: column; gap: 1rem; }
        .ms-fact {
          display: grid;
          grid-template-columns: 56px 1fr;
          align-items: center;
          column-gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(15, 8, 40, 0.08);
        }
        .ms-fact-icon {
          grid-row: 1 / 3;
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .ms-fact-value { font-size: 1.3rem; font-weight: 800; color: var(--text-strong); line-height: 1.1; }
        .ms-fact-label { font-size: 0.9rem; color: var(--sub); }
        @media (max-width: 767.98px) { .ms-about { grid-template-columns: 1fr; } }

        /* Righe narrate */
        .ms-story-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .ms-prose { font-size: 1.08rem; line-height: 1.75; color: var(--sub); }
        .ms-prose strong { color: var(--text-strong); }
        .ms-prose--lead { font-size: 1.2rem; font-weight: 700; color: var(--text-strong); }
        @media (max-width: 767.98px) {
          .ms-story-row { grid-template-columns: 1fr; }
          .ms-story-row .ms-story-art { order: -1; }
        }

        /* Badge azienda */
        .ms-company {
          display: inline-flex; align-items: center; gap: 0.9rem;
          margin-top: 1.5rem; padding: 0.85rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-left: 4px solid var(--accent);
          border-radius: 12px;
        }
        .ms-company-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .ms-company-text { display: inline-flex; flex-direction: column; line-height: 1.25; }
        .ms-company-name { font-weight: 800; color: var(--text-strong); font-size: 1.1rem; }
        .ms-company-sub { font-size: 0.85rem; color: var(--sub); }

        /* Ruoli in azienda */
        .ms-roles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2.25rem; }
        .ms-role {
          display: flex; flex-direction: column; gap: 0.2rem;
          padding: 1.1rem 1.2rem; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 14px;
          transition: transform .15s, border-color .15s, box-shadow .15s;
        }
        .ms-role:hover { transform: translateY(-3px); border-color: var(--vio-bd); box-shadow: 0 12px 28px rgba(15, 8, 40, 0.14); }
        .ms-role-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--vio-soft); color: var(--ink); margin-bottom: 0.4rem;
        }
        .ms-role-label { font-weight: 800; color: var(--text-strong); }
        .ms-role-note { font-size: 0.82rem; color: var(--sub); }
        @media (max-width: 767.98px) { .ms-roles { grid-template-columns: repeat(2, 1fr); } }

        /* Galleria 3 foto */
        .ms-gallery3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-top: 2rem; }
        @media (max-width: 767.98px) { .ms-gallery3 { grid-template-columns: 1fr; } }

        /* Banda — Il mio percorso */
        .ms-band {
          padding: clamp(3rem, 7vw, 5rem) 0;
          background: var(--band-bg);
          border-top: 1px solid var(--surface-bd); border-bottom: 1px solid var(--surface-bd);
        }
        .ms-band-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .ms-band-lead {
          color: var(--text);
          font-size: 1.15rem; line-height: 1.7; max-width: 52rem; margin-bottom: 2.5rem;
        }
        .ms-band-lead strong { color: var(--text-strong); }
        .ms-percorso { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .ms-percorso-card {
          padding: 1.75rem 1.5rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-radius: 16px;
        }
        .ms-percorso-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 54px; height: 54px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd); margin-bottom: 1rem;
        }
        .ms-percorso-title { color: var(--text-strong); font-weight: 700; font-size: 1.2rem; margin-bottom: 0.5rem; }
        .ms-percorso-desc { color: var(--sub); font-size: 0.98rem; line-height: 1.6; }
        @media (max-width: 767.98px) { .ms-percorso { grid-template-columns: 1fr; } }

        /* ── Rami schematici della scuola ── */
        .ms-tree-wrap { margin-top: clamp(2.5rem, 6vw, 3.75rem); }
        .ms-tree-heading { color: var(--text-strong); font-weight: 800; font-size: 1.5rem; margin-bottom: 0.35rem; }
        .ms-tree-sub { color: var(--sub); font-size: 1rem; margin-bottom: 1.75rem; }
        .ms-tree { position: relative; }
        .ms-tree-top { display: flex; justify-content: center; }
        .ms-tree-root {
          display: inline-flex; align-items: center; gap: 0.6rem;
          padding: 0.8rem 1.5rem; border-radius: 999px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #ffffff; font-weight: 800; font-size: 1.1rem;
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 12px 32px var(--glow);
        }
        .ms-tree-root-ic { display: inline-flex; }
        .ms-trunk { width: 2px; height: 28px; background: var(--tree-line); margin: 0 auto; }
        .ms-tree-branches {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
          position: relative;
        }
        /* Binario orizzontale che collega i tre rami (centri delle colonne) */
        .ms-tree-branches::before {
          content: ""; position: absolute; top: -14px; left: 16.66%; right: 16.66%;
          height: 2px; background: var(--tree-line);
        }
        .ms-branch {
          --bc: var(--accent);
          position: relative;
          padding: 1.25rem 1.35rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-top: 3px solid var(--bc);
          border-radius: 14px;
        }
        /* Stelo verticale dal binario alla card */
        .ms-branch::before {
          content: ""; position: absolute; top: -14px; left: 50%;
          width: 2px; height: 14px; background: var(--tree-line); transform: translateX(-50%);
        }
        .ms-branch--like { --bc: var(--bc-like); }
        .ms-branch--easy { --bc: var(--bc-easy); }
        .ms-branch--hard { --bc: var(--bc-hard); }
        .ms-branch-head {
          display: flex; align-items: center; gap: 0.55rem;
          font-weight: 800; font-size: 1.05rem; color: var(--bc); margin-bottom: 0.85rem;
        }
        .ms-branch-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--vio-soft); border: 1px solid var(--surface-bd); color: var(--bc);
        }
        .ms-branch-list { list-style: none; padding: 0; margin: 0; }
        .ms-branch-list li {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.4rem 0; color: var(--text); font-weight: 600; font-size: 0.98rem;
          border-bottom: 1px dashed var(--surface-bd);
        }
        .ms-branch-list li:last-child { border-bottom: none; }
        .ms-branch-list li::before {
          content: ""; flex-shrink: 0;
          width: 7px; height: 7px; border-radius: 50%; background: var(--bc);
        }
        @media (max-width: 767.98px) {
          .ms-tree-branches { grid-template-columns: 1fr; }
          .ms-tree-branches::before { display: none; }
          .ms-branch::before { display: none; }
          .ms-trunk { height: 18px; }
        }

        /* Titolo di blocco (passioni) */
        .ms-block-title {
          display: flex; align-items: center; flex-wrap: wrap;
          font-weight: 800; color: var(--text-strong); font-size: 1.1rem; margin-bottom: 1.1rem;
        }
        .ms-block-note { font-weight: 600; color: var(--sub); font-size: 0.95rem; }

        /* Callout (Dublino) */
        .ms-callout {
          display: flex; gap: 1rem; align-items: flex-start;
          margin-top: 1.5rem; padding: 1.1rem 1.35rem;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          border-left: 4px solid var(--accent); border-radius: 14px;
        }
        .ms-callout-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .ms-callout p { font-size: 1rem; line-height: 1.65; color: var(--sub); }
        .ms-callout strong { color: var(--text-strong); }

        /* Bandiere paesi visitati */
        .ms-flags { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.85rem; }
        .ms-flag { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .ms-flag-svg-wrap {
          width: 100%; aspect-ratio: 3 / 2;
          border-radius: 8px; overflow: hidden;
          border: 1px solid var(--surface-bd);
          box-shadow: 0 4px 12px rgba(15, 8, 40, 0.12);
        }
        .ms-flag-svg { width: 100%; height: 100%; display: block; }
        .ms-flag-name { font-size: 0.8rem; font-weight: 700; color: var(--text); text-align: center; }
        @media (max-width: 767.98px) { .ms-flags { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 430px) { .ms-flags { grid-template-columns: repeat(3, 1fr); } }

        /* Chips (sport / mezzi) */
        .ms-chiprow { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .ms-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          font-weight: 700; font-size: 0.9rem; color: var(--ink);
        }

        /* Mini-storico sportivo */
        .ms-track { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.5rem; }
        .ms-track-item {
          padding: 1rem 1.1rem; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 12px;
        }
        .ms-track-year { font-size: 0.74rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink); }
        .ms-track-label { display: block; margin-top: 0.15rem; font-weight: 800; color: var(--text-strong); }
        .ms-track-note { font-size: 0.82rem; color: var(--sub); }
        @media (max-width: 575.98px) { .ms-track { grid-template-columns: repeat(2, 1fr); } }

        /* Stare con gli altri */
        .ms-friends-head { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
        .ms-pass-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .ms-friends-copy { max-width: 62rem; margin-bottom: 1.5rem; }
        .ms-friends-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        @media (max-width: 575.98px) { .ms-friends-grid { grid-template-columns: 1fr; } }

        /* Buona tavola */
        .ms-taste { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem; }
        .ms-taste-card {
          padding: 1.25rem 1.35rem; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 14px;
        }
        .ms-taste-title { font-size: 0.95rem; font-weight: 800; color: var(--ink); margin-bottom: 0.5rem; }
        .ms-taste-list { list-style: none; padding: 0; margin: 0; }
        .ms-taste-list li {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.45rem 0; color: var(--sub); font-weight: 600; font-size: 0.98rem;
          border-bottom: 1px dashed var(--surface-bd);
        }
        .ms-taste-list li:last-child { border-bottom: none; }
        .ms-taste-list li::before {
          content: ""; flex-shrink: 0;
          width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--glow);
        }

        /* Il mio domani — banda viola profondo */
        .ms-future {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5rem) 0;
          color: var(--text);
          background: var(--future-bg);
          border-top: 1px solid var(--surface-bd);
        }
        .ms-future-grid {
          display: grid; grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(1.5rem, 4vw, 3.5rem); align-items: center;
        }
        .ms-future-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .ms-future-hl { font-size: 1.4rem; line-height: 1.5; margin-bottom: 1.1rem; color: var(--text); }
        .ms-future-hl strong { color: var(--text-strong); }
        .ms-future-copy { color: var(--text); font-size: 1.1rem; line-height: 1.7; margin-bottom: 1.5rem; }
        .ms-future-copy strong { color: var(--text-strong); }
        .ms-future-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .ms-future-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          font-weight: 700; font-size: 0.9rem; color: var(--ink);
        }
        @media (max-width: 767.98px) { .ms-future-grid { grid-template-columns: 1fr; } }

        /* Grazie — banner */
        .ms-thanks {
          position: relative; width: 100%; overflow: hidden;
          background-image: var(--thanks-bg);
          min-height: clamp(20rem, 42vw, 34rem);
          display: flex; align-items: center;
        }
        /* Inquadramento: foto verticale (ala dell'aereo al tramonto) dentro un
           banner largo e basso → in cover si vede solo una fascia orizzontale.
           La ancoriamo a ~45% per tenere in cornice l'orizzonte, il sole e l'ala. */
        .ms-thanks img {
          position: absolute; inset: 0; z-index: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%;
          image-orientation: from-image;
        }
        .ms-thanks-scrim {
          position: absolute; inset: 0; z-index: 1;
          background-image: var(--thanks-scrim);
        }
        .ms-thanks-overlay { position: relative; z-index: 2; width: 100%; }
        .ms-thanks-quote { color: var(--ink); opacity: 0.85; margin-bottom: 0.75rem; }
        .ms-thanks-title {
          color: var(--text-strong); font-weight: 800; line-height: 1.02;
          font-size: clamp(3rem, 9vw, 6rem); letter-spacing: -0.02em; margin-bottom: 0.75rem;
        }
        .ms-thanks-title span { display: block; font-size: clamp(1.25rem, 3vw, 2rem); font-weight: 600; font-style: italic; color: var(--text); }
        .ms-thanks-sign {
          color: var(--sub);
          text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; font-size: 0.9rem; margin-bottom: 0;
        }

        /* Footer */
        .ms-footer {
          background-color: var(--footer-bg); color: var(--text); border-top: 1px solid var(--surface-bd);
          transition: background .35s ease, color .35s ease;
        }
        .ms-footer-link { color: var(--text-strong); }
        .ms-footer-link:hover { color: var(--accent); }
      `}</style>
    </div>
  );
}
