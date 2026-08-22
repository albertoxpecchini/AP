import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft,
  IcPin,
  IcClock,
  IcBuilding,
  IcUsers,
  IcCalendar,
  IcHourglass,
  IcTree,
  IcCube,
  IcScreenCheck,
  IcCalculator,
  IcFile,
  IcSortAz,
  IcChevronRight,
  IcRuler,
  IcImage,
  type IcProps,
} from "../site/homeIcons";
import { PageBackdrop, ShinyBrandline, SparkGroup } from "../site/homeFx";
import "../home.css";
import "./pcto.css";

// ─────────────────────────────────────────────────────────────────────────────
// PCTO — Caem Group S.p.A., Castellucchio (MN) · Reparto legno · Ufficio tecnico.
//
// Tre sessioni di alternanza scuola-lavoro (a.s. 2023/24, 2024/25, 2025/26)
// svolte nello stesso ente. Pagina rifatta sulla grammatica Supabase della home
// (.sb-): nav sottile 64px, hero a due colonne, card a bordo-gradiente per le
// tre sessioni, numeri chiave, galleria, flusso di lavoro in cinque passi,
// capitoli narrati con illustrazione, strumenti, ore e chiusura.
// Tema chiaro/scuro NATIVO via token --sb-* (home.css); stili in pcto.css.
// ─────────────────────────────────────────────────────────────────────────────

type PctoItem = {
  period: string;
  ente: string;
  role: string;
  hours?: string;
  desc: string;
  skills: string[];
};

const PCTO: PctoItem[] = [
  {
    period: "a.s. 2025/26",
    ente: "CAEM Group S.p.A. — Castellucchio (MN)",
    role: "Ufficio tecnico · Reparto legno",
    hours: "80 ore in struttura",
    desc: "Terza e ultima sessione, con il flusso di lavoro ormai completo: modellazione 3D di piccole tettoie in AutoCAD, osservazione della stesura dei preventivi in diretta con il cliente e archiviazione ordinata della documentazione tecnica. 8 ore al giorno.",
    skills: ["AutoCAD 3D", "Lettura preventivi", "Strutture in legno", "Archiviazione"],
  },
  {
    period: "a.s. 2024/25",
    ente: "CAEM Group S.p.A. — Castellucchio (MN)",
    role: "Ufficio tecnico · Reparto legno",
    hours: "72 ore in struttura (un festivo)",
    desc: "Seconda sessione, con maggiore autonomia nel disegno 3D delle tettoie in legno e nel supporto all'ufficio tecnico. Monte ore ridotto a 72 — invece delle consuete 80 — per una giornata festiva caduta nel periodo di tirocinio.",
    skills: ["Modellazione 3D", "Travi e travetti", "Disegno tecnico", "Supporto ufficio"],
  },
  {
    period: "a.s. 2023/24",
    ente: "CAEM Group S.p.A. — Castellucchio (MN)",
    role: "Ufficio tecnico · Reparto legno",
    hours: "80 ore in struttura",
    desc: "Primo contatto con l'azienda e con il mondo delle strutture in legno: affiancamento ai tecnici, prime modellazioni in AutoCAD e visite al magazzino dei legni per conoscere da vicino travi, travetti e lavorazioni.",
    skills: ["AutoCAD", "Reparto legno", "Affiancamento", "Magazzino legni"],
  },
];

const ITA_MONTHS: Record<string, number> = {
  gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
  lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11,
};
const ITA_MONTH_RE = "gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic";

// Estrae il timestamp d'inizio dal campo "period" per l'ordinamento cronologico.
function parsePeriodStart(period: string): number {
  if (!period) return 0;
  const p = period.toLowerCase().trim();

  const dmy = p.match(new RegExp(`(\\d{1,2})\\s+(${ITA_MONTH_RE})\\s+(\\d{4})`));
  if (dmy) return new Date(+dmy[3], ITA_MONTHS[dmy[2]], +dmy[1]).getTime();

  const my = p.match(new RegExp(`(${ITA_MONTH_RE})\\s+(\\d{4})`));
  if (my) return new Date(+my[2], ITA_MONTHS[my[1]], 1).getTime();

  const year = p.match(/(\d{4})/);
  if (year) return new Date(+year[1], 0, 1).getTime();

  return 0;
}

const FACTS: { Icon: (p: IcProps) => JSX.Element; value: string; label: string; note: string }[] = [
  { Icon: IcCalendar, value: "3", label: "anni scolastici", note: "2023 – 2026" },
  { Icon: IcClock, value: "232 h", label: "in struttura", note: "80 + 72 + 80" },
  { Icon: IcHourglass, value: "8 h", label: "al giorno", note: "orario d'ufficio" },
  { Icon: IcUsers, value: "7", label: "in ufficio", note: "io compreso" },
  { Icon: IcTree, value: "Legno", label: "il reparto", note: "ufficio tecnico" },
];

const WORKFLOW: { Icon: (p: IcProps) => JSX.Element; label: string; sub: string }[] = [
  { Icon: IcCube, label: "Disegno 3D", sub: "AutoCAD — io" },
  { Icon: IcScreenCheck, label: "Validazione", sub: "i tecnici" },
  { Icon: IcCalculator, label: "Calcolo", sub: "cadwork · RFEM" },
  { Icon: IcFile, label: "Preventivo", sub: "stampa A4" },
  { Icon: IcSortAz, label: "Archivio", sub: "A–Z, io" },
];

const HOURS = [
  { year: "a.s. 2023/24", h: "80 h", note: "ambiente lavorativo", pct: "100%" },
  { year: "a.s. 2024/25", h: "72 h", note: "un giorno festivo", pct: "90%" },
  { year: "a.s. 2025/26", h: "80 h", note: "apprendimento misto", pct: "100%" },
];

// Foto di repertorio (Pexels, uso libero) — il legno strutturale dal vero.
const GALLERY = [
  { src: "/images/pcto-copertura-legno.jpg", cap: "Struttura di copertura in legno" },
  { src: "/images/pcto-travi-travetti.jpg", cap: "Travi e travetti a vista" },
  { src: "/images/pcto-tettoia.jpg", cap: "Tettoia in legno rifinita" },
  { src: "/images/pcto-magazzino.jpg", cap: "Magazzino di legname" },
];

const TOOLS = [
  { name: "AutoCAD", who: "Il mio strumento", desc: "Modellazione 3D delle tettoie coi poligoni, dalle competenze di disegno tecnico della terza." },
  { name: "cadwork", who: "Software dell'azienda", desc: "CAD 3D di carpenteria in legno: qui i tecnici importavano e modificavano il progetto in diretta." },
  { name: "Dlubal RFEM", who: "Software dell'azienda", desc: "Calcolo strutturale: peso specifico, vincoli e sezioni verificati secondo Eurocodice 5 e NTC 2018." },
];

// Foto della galleria: se il file manca, la figure sparisce invece di lasciare
// un riquadro rotto (la griglia si richiude da sola).
function Shot({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="sb-pc-shot">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={1600}
        height={1067}
        onError={() => setFailed(true)}
      />
      <figcaption>{alt}</figcaption>
    </figure>
  );
}

// ── Capitolo narrato: illustrazione in pannello + testo (alternati) ──────────
function StoryRow({
  n,
  kicker,
  title,
  src,
  alt,
  reverse,
  children,
}: {
  n: string;
  kicker: string;
  title: string;
  src: string;
  alt: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`sb-pc-story-row${reverse ? " sb-pc-story-row--rev" : ""}`}>
      <div className="sb-pc-story-art">
        <div className="sb-panel">
          <div className="sb-panel-inner">
            <img className="sb-pc-art-img" src={src} alt={alt} loading="lazy" width={1200} height={800} />
          </div>
        </div>
      </div>
      <div className="sb-pc-story-text">
        <span className="sb-pc-step" aria-hidden="true" data-no-i18n>{n}</span>
        <p className="sb-pc-kicker">{kicker}</p>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function Pcto() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "PCTO · Caem Group — Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cronologico decrescente: le esperienze più recenti per prime.
  const sorted = [...PCTO].sort((a, b) => parsePeriodStart(b.period) - parsePeriodStart(a.period));

  return (
    <div className="sb-home sb-home--fx pcto-page" data-acc="ambra">
      <PageBackdrop />
      {/* Skiplink — requisito di accessibilità (come la home) */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: brand + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-pc-tagline">Ufficio tecnico · Reparto legno</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-pc-back">
            <IcArrowLeft size={15} /> Torna alla home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero — sigla a sinistra, racconto a destra (come la home) */}
        <section className="sb-hero" aria-labelledby="pcto-hero-title">
          <div className="sb-container">
            <div className="sb-hero-grid">
              <div>
                <p className="sb-pc-eyebrow">Percorsi per le Competenze Trasversali e l'Orientamento</p>
                <h1 className="sb-hero-title" id="pcto-hero-title">
                  <span translate="no">PCTO</span>
                  {/* translate="no" resta sull'involucro: ShinyText rende un
                      solo <span> col testo, e il nome dell'azienda non si
                      traduce. */}
                  <span className="sb-brandline" translate="no">
                    <ShinyBrandline text="Caem Group S.p.A." />
                  </span>
                </h1>
              </div>
              <div className="sb-hero-copy">
                <p>
                  Tre anni di alternanza scuola-lavoro al <strong translate="no">Caem Group S.p.A.</strong> di
                  Castellucchio, nell'<strong>ufficio tecnico del reparto legno</strong>: dal disegno
                  in AutoCAD delle tettoie al calcolo delle strutture, fino all'archivio dei preventivi.
                  Il racconto del mio percorso CAT messo alla prova sul campo.
                </p>
                <p className="sb-pc-place">
                  <IcPin size={15} />
                  <span translate="no">Via Leonardi Accordi 39, Castellucchio (MN)</span>
                </p>
              </div>
            </div>
            <SparkGroup className="sb-hero-actions">
              <a href="#esperienze" className="sb-btn sb-btn--primary">Le tre sessioni</a>
              <a href="#storia" className="sb-btn sb-btn--secondary">Il racconto</a>
            </SparkGroup>
          </div>
        </section>

        {/* ② Le tre sessioni — una card a bordo-gradiente per anno scolastico */}
        <section id="esperienze" className="sb-section" aria-labelledby="pcto-esperienze-h">
          <div className="sb-container">
            <div className="sb-pc-sechead">
              <span className="sb-pc-overline">01 — Esperienze</span>
              <h2 id="pcto-esperienze-h">Le tre sessioni al Caem Group</h2>
            </div>
            <div className="sb-pc-sessions">
              {sorted.map((item) => (
                <article className="sb-panel sb-panel--hover" key={`${item.ente}-${item.period}`}>
                  <div className="sb-panel-inner sb-pc-session">
                    <span className="sb-pc-period">{item.period}</span>
                    <div className="sb-pc-ente">
                      <IcBuilding size={17} />
                      <h3 translate="no">{item.ente}</h3>
                    </div>
                    <p className="sb-pc-role">{item.role}</p>
                    {item.hours && (
                      <p className="sb-pc-hourline">
                        <IcClock size={14} /> {item.hours}
                      </p>
                    )}
                    <p className="sb-pc-desc">{item.desc}</p>
                    <div className="sb-pc-skills">
                      {item.skills.map((s) => (
                        <span className="sb-chip" key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ③ La mia storia — apertura del racconto */}
        <section id="storia" className="sb-section" aria-labelledby="pcto-storia-h">
          <div className="sb-container">
            <div className="sb-pc-sechead">
              <span className="sb-pc-overline">02 — La mia storia</span>
              <h2 id="pcto-storia-h">Dal disegno alla trave</h2>
              <p className="sb-pc-lead">
                Ho svolto il PCTO al <strong translate="no">Caem Group</strong>, gruppo nato dalla fusione dei
                principali rivenditori edili mantovani. Mi hanno assegnato all'<strong>ufficio
                tecnico del reparto legno</strong>, dove si progettano coperture e strutture
                eco-compatibili — dal lamellare all'X-LAM, fino alle piccole tettoie. Eravamo in
                sette in ufficio, ma il via vai era continuo: chi rientrava dal magazzino dei legni,
                chi partiva per cantieri anche lontani.
              </p>
            </div>

            {/* Numeri chiave */}
            <div className="sb-pc-facts">
              {FACTS.map(({ Icon, value, label, note }) => (
                <div className="sb-panel" key={label}>
                  <div className="sb-panel-inner sb-pc-fact">
                    <span className="sb-pc-fact-icon" aria-hidden="true"><Icon size={18} /></span>
                    <span className="sb-pc-fact-value">{value}</span>
                    <span className="sb-pc-fact-label">{label}</span>
                    <span className="sb-pc-fact-note">{note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Il legno, dal vero — galleria di foto reali */}
        <section className="sb-section sb-pc-tight" aria-labelledby="pcto-legno-h">
          <div className="sb-container">
            <h3 className="sb-pc-blockhead" id="pcto-legno-h"><IcImage size={17} /> Il legno, dal vero</h3>
            <div className="sb-pc-gallery">
              {GALLERY.map((g) => (
                <Shot key={g.src} src={g.src} alt={g.cap} />
              ))}
            </div>
            <p className="sb-pc-credit">Immagini di repertorio · Pexels (uso libero)</p>
          </div>
        </section>

        {/* ⑤ Il flusso di lavoro */}
        <section className="sb-section sb-pc-tight" aria-labelledby="pcto-flusso-h">
          <div className="sb-container">
            <h3 className="sb-pc-blockhead" id="pcto-flusso-h">Il flusso di lavoro, in cinque passi</h3>
            <div className="sb-pc-flow">
              {WORKFLOW.map(({ Icon, label, sub }, i) => (
                <div className="sb-pc-flow-step" key={label}>
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-pc-flow-card">
                      <span className="sb-pc-flow-icon" aria-hidden="true"><Icon size={20} /></span>
                      <span className="sb-pc-flow-label">{label}</span>
                      <span className="sb-pc-flow-sub">{sub}</span>
                    </div>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <IcChevronRight size={18} className="sb-pc-flow-arrow" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑥ Capitoli narrati */}
        <section className="sb-section sb-pc-tight" aria-label="Il racconto del percorso">
          <div className="sb-container">
            <div className="sb-pc-story">
              <StoryRow
                n="01"
                kicker="Il reparto legno"
                title="Il mondo in cui sono entrato"
                src="/images/pcto-ill-tettoia.jpg"
                alt="Illustrazione in stile Unica: Alberto osserva una tettoia in legno"
              >
                <p>
                  Il reparto legno del Caem progetta e fornisce strutture eco-compatibili: travi e
                  travetti in legno lamellare, coperture, solai in X-LAM. Il prodotto che ho imparato
                  a conoscere meglio è la <strong>tettoia</strong> — un sistema apparentemente
                  semplice di montanti, travi e travetti che però va disegnato, calcolato e verificato
                  con cura. Sono entrato in questo mondo partendo da ciò che già sapevo fare: disegnare.
                </p>
              </StoryRow>

              <StoryRow
                n="02"
                kicker="Il mio strumento"
                title="Modellare in 3D con AutoCAD"
                src="/images/pcto-ill-autocad.jpg"
                alt="Illustrazione in stile Unica: Alberto modella una tettoia 3D in AutoCAD"
                reverse
              >
                <p>
                  I programmi professionali dell'azienda erano molto complessi, così usavo quello che
                  padroneggiavo: <strong translate="no">AutoCAD</strong>. Modellavo in <strong>3D</strong> piccole
                  tettoie in legno lavorando con i <strong>poligoni</strong>, con le competenze di
                  disegno tecnico imparate in terza superiore. Partivo da un wireframe — i vertici, gli
                  assi X-Y-Z — e arrivavo al volume della struttura.
                </p>
              </StoryRow>

              <StoryRow
                n="03"
                kicker="Il vocabolario del legno"
                title="Travi e travetti"
                src="/images/pcto-ill-travi.jpg"
                alt="Illustrazione in stile Unica: Alberto misura una trave accanto a un travetto"
              >
                <p>
                  Ho imparato il linguaggio del legno strutturale: la <strong>trave</strong>,
                  l'elemento portante principale, e il <strong>travetto</strong>, l'orditura secondaria
                  che la affianca e regge il manto. Cambiano sezione, luce e funzione — e ogni scelta
                  pesa sul calcolo che viene dopo.
                </p>
              </StoryRow>

              <StoryRow
                n="04"
                kicker="Dal disegno al calcolo"
                title="Quando la struttura diventa reale"
                src="/images/pcto-ill-nodi.jpg"
                alt="Illustrazione in stile Unica: i nodi strutturali — connessione rigida, cerniera, appoggio su fondazione"
                reverse
              >
                <p>
                  Quando finivo un disegno, i tecnici lo <strong>valutavano</strong> e mi dicevano se
                  la struttura era realizzabile. Poi lo importavano nel software di carpenteria
                  <strong translate="no"> cadwork</strong> e ne verificavano la tenuta con <strong translate="no">Dlubal RFEM</strong>:
                  inserivano il <strong>peso specifico del legno</strong>, le sezioni e i vincoli, e
                  controllavano i calcoli secondo l'<strong>Eurocodice 5</strong> e le NTC 2018. Il cuore
                  erano i <strong>collegamenti</strong>: un <strong>incastro</strong> irrigidisce il nodo
                  e trasmette i momenti, una <strong>cerniera</strong> lascia ruotare gli elementi, e poi
                  c'è il legame con la <strong>fondazione</strong>. Cambiare un nodo cambiava tutto il
                  comportamento della tettoia.
                </p>
              </StoryRow>

              <StoryRow
                n="05"
                kicker="Osservare e ascoltare"
                title="I preventivi, in diretta"
                src="/images/pcto-ill-preventivi.jpg"
                alt="Illustrazione in stile Unica: stesura di un preventivo in diretta col cliente"
              >
                <p>
                  La parte che mi ha insegnato di più è stata <strong>osservare</strong>. Assistevo alla
                  stesura dei <strong>preventivi</strong>: ascoltavo le richieste del cliente in diretta
                  mentre i tecnici modificavano il progetto al computer, in tempo reale. Capire come una
                  richiesta detta a voce diventa una struttura disegnata — e un prezzo — è stata una
                  lezione vera, di metodo prima ancora che di tecnica.
                </p>
              </StoryRow>

              <StoryRow
                n="06"
                kicker="Il mio compito"
                title="Dare ordine: stampa e archivio"
                src="/images/pcto-ill-archivio.jpg"
                alt="Illustrazione in stile Unica: Alberto archivia un preventivo stampato in ordine alfabetico"
                reverse
              >
                <p>
                  Il mio compito operativo era l'<strong>ordine</strong>. Stampavo i preventivi in
                  <strong> A4</strong> e li archiviavo nell'area corretta, in ordine
                  <strong> alfabetico e cronologico</strong>, pronti per quando — nei giorni successivi —
                  i clienti tornavano a discuterli. Un gesto semplice, ma che teneva insieme tutto il
                  lavoro dell'ufficio.
                </p>
              </StoryRow>

              <StoryRow
                n="07"
                kicker="Oltre l'ufficio"
                title="Il magazzino dei legni"
                src="/images/pcto-ill-magazzino.jpg"
                alt="Illustrazione in stile Unica: Alberto fotografa le cataste di legname in magazzino"
              >
                <p>
                  Ogni tanto lasciavo la scrivania per il <strong>magazzino dei legni</strong>, dove
                  travi e travetti venivano preparati. Vedere il materiale reale dietro al disegno — la
                  sezione, la fibra, il peso — mi ha fatto capire cosa significhi davvero ogni linea
                  tracciata a schermo.
                </p>
              </StoryRow>

              <StoryRow
                n="08"
                kicker="Sette scrivanie"
                title="L'ufficio tecnico"
                src="/images/pcto-ill-ufficio.jpg"
                alt="Illustrazione in stile Unica: l'ufficio tecnico con sette scrivanie e i colleghi"
                reverse
              >
                <p>
                  In ufficio eravamo in <strong>sette</strong>, me compreso. Molti andavano e venivano
                  dal magazzino o dai cantieri, anche lontani: l'ufficio era il punto fermo dove il
                  progetto prendeva forma prima di partire. Stare in mezzo a quel ritmo, da studente,
                  mi ha fatto sentire parte di una squadra.
                </p>
              </StoryRow>
            </div>
          </div>
        </section>

        {/* ⑦ Gli strumenti */}
        <section className="sb-section sb-pc-tight" aria-labelledby="pcto-strumenti-h">
          <div className="sb-container">
            <h3 className="sb-pc-blockhead" id="pcto-strumenti-h"><IcRuler size={17} /> Gli strumenti</h3>
            <div className="sb-pc-tools">
              {TOOLS.map((t) => (
                <div className="sb-panel" key={t.name}>
                  <div className="sb-panel-inner sb-pc-tool">
                    <span className="sb-pc-tool-who">{t.who}</span>
                    <span className="sb-pc-tool-name" translate="no">{t.name}</span>
                    <p className="sb-pc-tool-desc">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑧ Le ore in struttura */}
        <section className="sb-section sb-pc-tight" aria-labelledby="pcto-ore-h">
          <div className="sb-container">
            <h3 className="sb-pc-blockhead" id="pcto-ore-h">Le ore in struttura</h3>
            <div className="sb-panel">
              <div className="sb-panel-inner sb-pc-hours">
                {HOURS.map((h) => (
                  <div className="sb-pc-hours-row" key={h.year}>
                    <span className="sb-pc-hours-year">{h.year}</span>
                    <span className="sb-pc-hours-bar" aria-hidden="true">
                      <span className="sb-pc-hours-fill" style={{ width: h.pct }} />
                    </span>
                    <span className="sb-pc-hours-h">{h.h}</span>
                    <span className="sb-pc-hours-note">{h.note}</span>
                  </div>
                ))}
                <div className="sb-pc-hours-row sb-pc-hours-row--total">
                  <span className="sb-pc-hours-year">Totale</span>
                  <span className="sb-pc-hours-bar" aria-hidden="true" />
                  <span className="sb-pc-hours-h">232 h</span>
                  <span className="sb-pc-hours-note">presso il Caem Group</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑨ Chiusura */}
        <section className="sb-section sb-pc-tight" aria-labelledby="pcto-chiusura-h">
          <div className="sb-container">
            <div className="sb-panel sb-pc-closing">
              <div className="sb-panel-inner">
                <h3 id="pcto-chiusura-h">Perché mi sono divertito</h3>
                <p>
                  Nel legno ho ritrovato lo stesso processo che amo nel <strong>web design</strong>:
                  ascoltare un cliente, trasformare la sua idea in un progetto, iterarlo e consegnarlo
                  curato fino all'ultimo dettaglio. Cambia il materiale — travi invece di pixel — ma il
                  metodo è lo stesso: <strong>disegno, precisione e ordine</strong>. È questo che mi
                  porto a casa da tre anni al Caem Group.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑩ Banner full-width: tutto il team davanti alla sede Caem */}
        <section className="sb-pc-banner" aria-label="Il team del Caem Group davanti alla sede">
          <img
            src="/images/pcto-team-banner.jpg"
            alt="Illustrazione del team dell'ufficio tecnico Caem Group davanti alla sede di Castellucchio"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="sb-pc-banner-scrim" aria-hidden="true" />
          <div className="sb-pc-banner-overlay">
            <div className="sb-container">
              <p className="sb-pc-banner-kicker" translate="no">Caem Group S.p.A. · Castellucchio (MN)</p>
              <h2 className="sb-pc-banner-title">Tutto il team, davanti all'azienda</h2>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
