import { useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Clock,
  Building2,
  Users,
  CalendarDays,
  Hourglass,
  TreePine,
  Boxes,
  MonitorCheck,
  Calculator,
  FileText,
  FolderTree,
  ChevronRight,
  PencilRuler,
  Images,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PCTO — Caem Group S.p.A., Castellucchio (MN) · Reparto legno · Ufficio tecnico.
//
// Tre sessioni di alternanza scuola-lavoro (a.s. 2023/24, 2024/25, 2025/26) svolte
// nello stesso ente. Pagina: timeline delle esperienze + presentazione narrata del
// percorso, con illustrazioni SVG dei legni in stile neroverde line-art (coerente
// con la home — nessun colore fuori palette).
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

// ── Riga narrativa: illustrazione + testo (alternata) ─────────────────────────
function StoryRow({
  n,
  kicker,
  title,
  art,
  reverse,
  children,
}: {
  n: string;
  kicker: string;
  title: string;
  art: React.ReactNode;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`pcto-story-row${reverse ? " pcto-story-row--rev" : ""}`}>
      <div className="pcto-story-art">
        <div className="pcto-art-frame">{art}</div>
      </div>
      <div className="pcto-story-text">
        <span className="pcto-story-step">{n}</span>
        <p className="ap-kicker text-primary text-uppercase fw-semibold mb-2">{kicker}</p>
        <h3 className="h3 fw-bold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const FACTS = [
  { Icon: CalendarDays, value: "3", label: "anni scolastici", note: "2023 – 2026" },
  { Icon: Clock, value: "232 h", label: "in struttura", note: "80 + 72 + 80" },
  { Icon: Hourglass, value: "8 h", label: "al giorno", note: "orario d'ufficio" },
  { Icon: Users, value: "7", label: "in ufficio", note: "io compreso" },
  { Icon: TreePine, value: "Legno", label: "il reparto", note: "ufficio tecnico" },
];

const WORKFLOW = [
  { Icon: Boxes, label: "Disegno 3D", sub: "AutoCAD — io" },
  { Icon: MonitorCheck, label: "Validazione", sub: "i tecnici" },
  { Icon: Calculator, label: "Calcolo", sub: "cadwork · RFEM" },
  { Icon: FileText, label: "Preventivo", sub: "stampa A4" },
  { Icon: FolderTree, label: "Archivio", sub: "A–Z, io" },
];

const HOURS = [
  { year: "a.s. 2023/24", h: "80 h", note: "ambiente lavorativo" },
  { year: "a.s. 2024/25", h: "72 h", note: "un giorno festivo" },
  { year: "a.s. 2025/26", h: "80 h", note: "apprendimento misto" },
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

export default function Pcto() {
  useEffect(() => {
    const prev = document.title;
    document.title = "PCTO · Caem Group — Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  // Cronologico decrescente: le esperienze più recenti per prime.
  const sorted = [...PCTO].sort((a, b) => parsePeriodStart(b.period) - parsePeriodStart(a.period));

  return (
    <div className="it-page-wrapper pcto-page">
      {/* Header compatto: marchio + ritorno alla home */}
      <header className="pcto-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <a href="/" className="pcto-brand text-decoration-none d-inline-flex align-items-center">
              <span className="pcto-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="pcto-brand-text">
                <span className="pcto-brand-title">Alberto Pecchini</span>
                <span className="pcto-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </a>
            <a href="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" />
              <span>Torna alla home</span>
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="pcto-hero bg-primary text-white">
          <div className="container">
            <div className="pcto-hero-inner">
              <span className="pcto-hero-badge" aria-hidden="true">
                <GraduationCap size={48} strokeWidth={1.75} />
              </span>
              <p className="ap-kicker text-uppercase fw-semibold mb-3">
                Percorsi per le Competenze Trasversali e l'Orientamento
              </p>
              <h1 className="pcto-hero-title fw-bold">PCTO</h1>
              <p className="pcto-hero-lead lead">
                Tre anni di alternanza scuola-lavoro al <strong>Caem Group S.p.A.</strong> di
                Castellucchio, nell'<strong>ufficio tecnico del reparto legno</strong>: dal disegno
                in AutoCAD delle tettoie al calcolo delle strutture, fino all'archivio dei preventivi.
                Il racconto del mio percorso CAT messo alla prova sul campo.
              </p>
              <p className="pcto-hero-location d-inline-flex align-items-center mb-0">
                <MapPin size={18} className="me-2" aria-hidden="true" />
                Via Leonardi Accordi 39, Castellucchio (MN)
              </p>
            </div>
          </div>
        </section>

        {/* Esperienze PCTO */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                01 — Esperienze
              </p>
              <h2 className="display-5 fw-bold mb-0">Le tre sessioni al Caem Group</h2>
            </div>
            <div className="row">
              <div className="col-lg-9">
                <div className="ap-timeline">
                  {sorted.map((item) => (
                    <div className="ap-timeline-item" key={`${item.ente}-${item.period}`}>
                      <span className="ap-timeline-period">{item.period}</span>
                      <h3 className="h5 fw-bold mb-1 d-flex align-items-center">
                        <Building2 size={18} className="me-2 text-primary" aria-hidden="true" />
                        {item.ente}
                      </h3>
                      <p className="fw-semibold text-primary mb-2">{item.role}</p>
                      {item.hours && (
                        <p className="text-muted small mb-2 d-inline-flex align-items-center">
                          <Clock size={14} className="me-1" aria-hidden="true" /> {item.hours}
                        </p>
                      )}
                      <p className="text-muted mb-3">{item.desc}</p>
                      <div className="d-flex flex-wrap gap-2">
                        {item.skills.map((s) => (
                          <span key={s} className="chip chip-simple chip-primary">
                            <span className="chip-label">{s}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* La storia — presentazione narrata */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                02 — La mia storia
              </p>
              <h2 className="display-5 fw-bold mb-3">Dal disegno alla trave</h2>
              <p className="lead text-muted mb-0" style={{ maxWidth: "52rem" }}>
                Ho svolto il PCTO al <strong>Caem Group</strong>, gruppo nato dalla fusione dei
                principali rivenditori edili mantovani. Mi hanno assegnato all'<strong>ufficio
                tecnico del reparto legno</strong>, dove si progettano coperture e strutture
                eco-compatibili — dal lamellare all'X-LAM, fino alle piccole tettoie. Eravamo in
                sette in ufficio, ma il via vai era continuo: chi rientrava dal magazzino dei legni,
                chi partiva per cantieri anche lontani.
              </p>
            </div>

            {/* Numeri chiave */}
            <div className="pcto-facts">
              {FACTS.map(({ Icon, value, label, note }) => (
                <div className="pcto-fact" key={label}>
                  <span className="pcto-fact-icon" aria-hidden="true"><Icon size={22} /></span>
                  <span className="pcto-fact-value">{value}</span>
                  <span className="pcto-fact-label">{label}</span>
                  <span className="pcto-fact-note">{note}</span>
                </div>
              ))}
            </div>

            {/* Il legno, dal vero — galleria di foto reali */}
            <div className="pcto-gallery-wrap">
              <p className="pcto-flow-title">
                <Images size={18} className="me-2" aria-hidden="true" /> Il legno, dal vero
              </p>
              <div className="pcto-gallery">
                {GALLERY.map((g) => (
                  <figure className="pcto-shot" key={g.src}>
                    <img src={g.src} alt={g.cap} loading="lazy" width={1600} height={1067} />
                    <figcaption>{g.cap}</figcaption>
                  </figure>
                ))}
              </div>
              <p className="pcto-gallery-credit">Immagini di repertorio · Pexels (uso libero)</p>
            </div>

            {/* Il flusso di lavoro */}
            <div className="pcto-flow-wrap">
              <p className="pcto-flow-title">Il flusso di lavoro, in cinque passi</p>
              <div className="pcto-flow">
                {WORKFLOW.map(({ Icon, label, sub }, i) => (
                  <div className="pcto-flow-step" key={label}>
                    <div className="pcto-flow-card">
                      <span className="pcto-flow-icon" aria-hidden="true"><Icon size={24} /></span>
                      <span className="pcto-flow-label">{label}</span>
                      <span className="pcto-flow-sub">{sub}</span>
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <ChevronRight className="pcto-flow-arrow" size={22} aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Capitoli narrati */}
            <div className="pcto-story">
              <StoryRow n="①" kicker="Il reparto legno" title="Il mondo in cui sono entrato" art={<img className="pcto-art-img" src="/images/pcto-ill-tettoia.jpg" alt="Illustrazione in stile Unica: Alberto osserva una tettoia in legno" loading="lazy" width={1200} height={800} />}>
                <p className="text-muted">
                  Il reparto legno del Caem progetta e fornisce strutture eco-compatibili: travi e
                  travetti in legno lamellare, coperture, solai in X-LAM. Il prodotto che ho imparato
                  a conoscere meglio è la <strong>tettoia</strong> — un sistema apparentemente
                  semplice di montanti, travi e travetti che però va disegnato, calcolato e verificato
                  con cura. Sono entrato in questo mondo partendo da ciò che già sapevo fare: disegnare.
                </p>
              </StoryRow>

              <StoryRow n="②" kicker="Il mio strumento" title="Modellare in 3D con AutoCAD" art={<img className="pcto-art-img" src="/images/pcto-ill-autocad.jpg" alt="Illustrazione in stile Unica: Alberto modella una tettoia 3D in AutoCAD" loading="lazy" width={1200} height={800} />} reverse>
                <p className="text-muted">
                  I programmi professionali dell'azienda erano molto complessi, così usavo quello che
                  padroneggiavo: <strong>AutoCAD</strong>. Modellavo in <strong>3D</strong> piccole
                  tettoie in legno lavorando con i <strong>poligoni</strong>, con le competenze di
                  disegno tecnico imparate in terza superiore. Partivo da un wireframe — i vertici, gli
                  assi X-Y-Z — e arrivavo al volume della struttura.
                </p>
              </StoryRow>

              <StoryRow n="③" kicker="Il vocabolario del legno" title="Travi e travetti" art={<img className="pcto-art-img" src="/images/pcto-ill-travi.jpg" alt="Illustrazione in stile Unica: Alberto misura una trave accanto a un travetto" loading="lazy" width={1200} height={800} />}>
                <p className="text-muted">
                  Ho imparato il linguaggio del legno strutturale: la <strong>trave</strong>,
                  l'elemento portante principale, e il <strong>travetto</strong>, l'orditura secondaria
                  che la affianca e regge il manto. Cambiano sezione, luce e funzione — e ogni scelta
                  pesa sul calcolo che viene dopo.
                </p>
              </StoryRow>

              <StoryRow n="④" kicker="Dal disegno al calcolo" title="Quando la struttura diventa reale" art={<img className="pcto-art-img" src="/images/pcto-ill-nodi.jpg" alt="Illustrazione in stile Unica: i nodi strutturali — connessione rigida, cerniera, appoggio su fondazione" loading="lazy" width={1200} height={800} />} reverse>
                <p className="text-muted">
                  Quando finivo un disegno, i tecnici lo <strong>valutavano</strong> e mi dicevano se
                  la struttura era realizzabile. Poi lo importavano nel software di carpenteria
                  <strong> cadwork</strong> e ne verificavano la tenuta con <strong>Dlubal RFEM</strong>:
                  inserivano il <strong>peso specifico del legno</strong>, le sezioni e i vincoli, e
                  controllavano i calcoli secondo l'<strong>Eurocodice 5</strong> e le NTC 2018. Il cuore
                  erano i <strong>collegamenti</strong>: un <strong>incastro</strong> irrigidisce il nodo
                  e trasmette i momenti, una <strong>cerniera</strong> lascia ruotare gli elementi, e poi
                  c'è il legame con la <strong>fondazione</strong>. Cambiare un nodo cambiava tutto il
                  comportamento della tettoia.
                </p>
              </StoryRow>

              <StoryRow n="⑤" kicker="Osservare e ascoltare" title="I preventivi, in diretta" art={<img className="pcto-art-img" src="/images/pcto-ill-preventivi.jpg" alt="Illustrazione in stile Unica: stesura di un preventivo in diretta col cliente" loading="lazy" width={1200} height={800} />}>
                <p className="text-muted">
                  La parte che mi ha insegnato di più è stata <strong>osservare</strong>. Assistevo alla
                  stesura dei <strong>preventivi</strong>: ascoltavo le richieste del cliente in diretta
                  mentre i tecnici modificavano il progetto al computer, in tempo reale. Capire come una
                  richiesta detta a voce diventa una struttura disegnata — e un prezzo — è stata una
                  lezione vera, di metodo prima ancora che di tecnica.
                </p>
              </StoryRow>

              <StoryRow n="⑥" kicker="Il mio compito" title="Dare ordine: stampa e archivio" art={<img className="pcto-art-img" src="/images/pcto-ill-archivio.jpg" alt="Illustrazione in stile Unica: Alberto archivia un preventivo stampato in ordine alfabetico" loading="lazy" width={1200} height={800} />} reverse>
                <p className="text-muted">
                  Il mio compito operativo era l'<strong>ordine</strong>. Stampavo i preventivi in
                  <strong> A4</strong> e li archiviavo nell'area corretta, in ordine
                  <strong> alfabetico e cronologico</strong>, pronti per quando — nei giorni successivi —
                  i clienti tornavano a discuterli. Un gesto semplice, ma che teneva insieme tutto il
                  lavoro dell'ufficio.
                </p>
              </StoryRow>

              <StoryRow n="⑦" kicker="Oltre l'ufficio" title="Il magazzino dei legni" art={<img className="pcto-art-img" src="/images/pcto-ill-magazzino.jpg" alt="Illustrazione in stile Unica: Alberto fotografa le cataste di legname in magazzino" loading="lazy" width={1200} height={800} />}>
                <p className="text-muted">
                  Ogni tanto lasciavo la scrivania per il <strong>magazzino dei legni</strong>, dove
                  travi e travetti venivano preparati. Vedere il materiale reale dietro al disegno — la
                  sezione, la fibra, il peso — mi ha fatto capire cosa significhi davvero ogni linea
                  tracciata a schermo.
                </p>
              </StoryRow>

              <StoryRow n="⑧" kicker="Sette scrivanie" title="L'ufficio tecnico" art={<img className="pcto-art-img" src="/images/pcto-ill-ufficio.jpg" alt="Illustrazione in stile Unica: l'ufficio tecnico con sette scrivanie e i colleghi" loading="lazy" width={1200} height={800} />} reverse>
                <p className="text-muted">
                  In ufficio eravamo in <strong>sette</strong>, me compreso. Molti andavano e venivano
                  dal magazzino o dai cantieri, anche lontani: l'ufficio era il punto fermo dove il
                  progetto prendeva forma prima di partire. Stare in mezzo a quel ritmo, da studente,
                  mi ha fatto sentire parte di una squadra.
                </p>
              </StoryRow>
            </div>

            {/* Gli strumenti */}
            <div className="pcto-tools-wrap">
              <p className="pcto-flow-title"><PencilRuler size={18} className="me-2" aria-hidden="true" />Gli strumenti</p>
              <div className="row g-3">
                {TOOLS.map((t) => (
                  <div className="col-md-4" key={t.name}>
                    <div className="pcto-tool-card h-100">
                      <span className="pcto-tool-name">{t.name}</span>
                      <span className="pcto-tool-who">{t.who}</span>
                      <p className="pcto-tool-desc mb-0">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Riepilogo ore */}
            <div className="pcto-hours-wrap">
              <p className="pcto-flow-title">Le ore in struttura</p>
              <div className="pcto-hours">
                {HOURS.map((h) => (
                  <div className="pcto-hours-row" key={h.year}>
                    <span className="pcto-hours-year">{h.year}</span>
                    <span className="pcto-hours-bar" aria-hidden="true">
                      <span className="pcto-hours-fill" style={{ width: h.h === "72 h" ? "90%" : "100%" }} />
                    </span>
                    <span className="pcto-hours-h">{h.h}</span>
                    <span className="pcto-hours-note">{h.note}</span>
                  </div>
                ))}
                <div className="pcto-hours-row pcto-hours-row--total">
                  <span className="pcto-hours-year">Totale</span>
                  <span className="pcto-hours-bar" aria-hidden="true" />
                  <span className="pcto-hours-h">232 h</span>
                  <span className="pcto-hours-note">presso il Caem Group</span>
                </div>
              </div>
            </div>

            {/* Chiusura */}
            <div className="pcto-closing">
              <h3 className="h2 fw-bold mb-3">Perché mi sono divertito</h3>
              <p className="mb-0">
                Nel legno ho ritrovato lo stesso processo che amo nel <strong>web design</strong>:
                ascoltare un cliente, trasformare la sua idea in un progetto, iterarlo e consegnarlo
                curato fino all'ultimo dettaglio. Cambia il materiale — travi invece di pixel — ma il
                metodo è lo stesso: <strong>disegno, precisione e ordine</strong>. È questo che mi
                porto a casa da tre anni al Caem Group.
              </p>
            </div>
          </div>
        </section>

        {/* Banner full-width: tutto il team davanti alla sede Caem */}
        <section className="pcto-team-banner" aria-label="Il team del Caem Group davanti alla sede">
          <img
            src="/images/pcto-team-banner.jpg"
            alt="Illustrazione del team dell'ufficio tecnico Caem Group davanti alla sede di Castellucchio"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="pcto-team-scrim" aria-hidden="true" />
          <div className="pcto-team-overlay">
            <div className="container">
              <p className="pcto-team-kicker">Caem Group S.p.A. · Castellucchio (MN)</p>
              <h2 className="pcto-team-title">Tutto il team, davanti all'azienda</h2>
            </div>
          </div>
        </section>
      </main>

      <footer className="pcto-footer">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-4">
            <span style={{ opacity: 0.8 }}>
              © {new Date().getFullYear()} Alberto Pecchini — ITT «Carlo d'Arco», Mantova
            </span>
            <a href="/" className="text-white text-decoration-none d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" /> Torna alla home
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        /* Palette neroverde — coerente con la home (override Bootstrap Italia). */
        .pcto-page {
          --bs-primary: #2F7D4A;
          --bs-primary-rgb: 47, 125, 74;
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background-color: #ffffff;
        }
        .pcto-page .bg-primary { background-color: #2F7D4A !important; }
        .pcto-page .text-primary { color: #1F6B3D !important; }
        .pcto-page .btn-outline-light:hover,
        .pcto-page .btn-outline-light:focus {
          color: #1F6B3D !important;
        }
        .pcto-page .chip-primary,
        .pcto-page .chip.chip-simple.chip-primary {
          background-color: rgba(47, 125, 74, 0.12) !important;
          color: #1F6B3D !important;
          border-color: rgba(47, 125, 74, 0.28) !important;
        }
        .pcto-page .chip-primary .chip-label { color: #1F6B3D !important; }

        /* Header */
        .pcto-header {
          background-color: #103820;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .pcto-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
          margin-right: 12px;
        }
        .pcto-brand-mark img { width: 100%; height: 100%; display: block; }
        .pcto-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .pcto-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .pcto-brand-tagline { color: rgba(255, 255, 255, 0.7); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .pcto-brand-tagline { display: none; } }

        /* Hero */
        .pcto-hero {
          padding: clamp(3.5rem, 8vw, 6.5rem) 0;
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 60%, #3F8F5A 100%);
        }
        .pcto-hero-inner { max-width: 50rem; }
        .pcto-hero-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 92px;
          height: 92px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.32);
          color: #ffffff;
          margin-bottom: 1.75rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
        .pcto-hero-title {
          font-size: clamp(3.5rem, 9vw, 5.75rem);
          line-height: 1.02;
          letter-spacing: -0.02em;
          margin-bottom: 1.25rem;
        }
        .pcto-hero-lead {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.2rem;
          max-width: 46rem;
          margin-bottom: 1.75rem;
        }
        .pcto-hero-location { opacity: 0.85; }
        .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        @media (max-width: 575.98px) {
          .pcto-hero-badge { width: 72px; height: 72px; border-radius: 18px; }
          .pcto-hero-badge svg { width: 38px; height: 38px; }
          .pcto-hero-lead { font-size: 1.05rem; }
        }

        /* Timeline (come il curriculum della home) */
        .ap-timeline { position: relative; padding-left: 2rem; }
        .ap-timeline::before {
          content: "";
          position: absolute;
          left: 7px; top: 6px; bottom: 6px;
          width: 2px;
          background: rgba(47, 125, 74, 0.28);
        }
        .ap-timeline-item { position: relative; padding-bottom: 2rem; }
        .ap-timeline-item:last-child { padding-bottom: 0; }
        .ap-timeline-item::before {
          content: "";
          position: absolute;
          left: -2rem; top: 4px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #2F7D4A;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 2px rgba(47, 125, 74, 0.28);
        }
        .ap-timeline-period {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1F6B3D;
          margin-bottom: 0.25rem;
        }

        /* Numeri chiave */
        .pcto-facts {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin: 2.5rem 0 3rem;
        }
        .pcto-fact {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.15rem;
          padding: 1.25rem 0.75rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(16, 56, 32, 0.05);
        }
        .pcto-fact-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px; height: 46px;
          border-radius: 12px;
          background: rgba(47, 125, 74, 0.10);
          color: #1F6B3D;
          margin-bottom: 0.4rem;
        }
        .pcto-fact-value { font-size: 1.6rem; font-weight: 800; color: #103820; line-height: 1.1; }
        .pcto-fact-label { font-size: 0.9rem; font-weight: 700; color: #1F6B3D; }
        .pcto-fact-note { font-size: 0.78rem; color: #6b8275; }
        @media (max-width: 767.98px) {
          .pcto-facts { grid-template-columns: repeat(2, 1fr); }
          .pcto-fact:last-child { grid-column: 1 / -1; }
        }

        /* Galleria "Il legno, dal vero" */
        .pcto-gallery-wrap { margin-bottom: 3.5rem; }
        .pcto-gallery {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .pcto-shot {
          position: relative;
          margin: 0;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 3 / 2;
          border: 1px solid rgba(47, 125, 74, 0.18);
          box-shadow: 0 8px 22px rgba(16, 56, 32, 0.08);
        }
        .pcto-shot img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.45s ease;
        }
        .pcto-shot:hover img { transform: scale(1.05); }
        .pcto-shot figcaption {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          padding: 1.6rem 0.85rem 0.6rem;
          font-size: 0.82rem; font-weight: 700; color: #ffffff;
          background: linear-gradient(to top, rgba(16, 56, 32, 0.88), rgba(16, 56, 32, 0));
        }
        .pcto-gallery-credit { margin-top: 0.6rem; font-size: 0.76rem; color: #6b8275; }
        @media (max-width: 767.98px) {
          .pcto-gallery { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }

        /* Flusso di lavoro */
        .pcto-flow-wrap { margin-bottom: 3.5rem; }
        .pcto-flow-title {
          display: flex; align-items: center;
          font-weight: 800; color: #103820;
          font-size: 1.05rem; margin-bottom: 1rem;
        }
        .pcto-flow {
          display: flex;
          align-items: stretch;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .pcto-flow-step { display: flex; align-items: center; flex: 1 1 0; min-width: 130px; }
        .pcto-flow-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.2rem;
          padding: 1rem 0.5rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-radius: 14px;
          height: 100%;
        }
        .pcto-flow-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 48px; height: 48px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.10);
          color: #1F6B3D;
          margin-bottom: 0.35rem;
        }
        .pcto-flow-label { font-weight: 700; color: #103820; font-size: 0.95rem; }
        .pcto-flow-sub { font-size: 0.76rem; color: #6b8275; }
        .pcto-flow-arrow { color: rgba(47, 125, 74, 0.55); flex-shrink: 0; margin: 0 0.1rem; }
        @media (max-width: 767.98px) {
          .pcto-flow { flex-direction: column; }
          .pcto-flow-step { width: 100%; flex-direction: column; }
          .pcto-flow-arrow { transform: rotate(90deg); margin: 0.25rem 0; }
        }

        /* Capitoli narrati */
        .pcto-story { display: flex; flex-direction: column; gap: 2.75rem; }
        .pcto-story-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 2.5rem;
          align-items: center;
        }
        .pcto-story-row--rev .pcto-story-art { order: 2; }
        .pcto-art-frame {
          border: 1px solid rgba(47, 125, 74, 0.20);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(16, 56, 32, 0.07);
        }
        .pcto-art-img {
          width: 100%;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          display: block;
        }
        .pcto-story-step {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          font-size: 1.2rem; font-weight: 800;
          margin-bottom: 0.75rem;
        }
        .pcto-story-text .text-muted { font-size: 1.05rem; line-height: 1.7; }
        @media (max-width: 767.98px) {
          .pcto-story-row { grid-template-columns: 1fr; gap: 1.25rem; }
          .pcto-story-row--rev .pcto-story-art { order: 0; }
        }

        /* Strumenti */
        .pcto-tools-wrap { margin-top: 3.5rem; }
        .pcto-tool-card {
          display: flex; flex-direction: column;
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-left: 4px solid #2F7D4A;
          border-radius: 12px;
        }
        .pcto-tool-name { font-weight: 800; font-size: 1.15rem; color: #103820; }
        .pcto-tool-who {
          font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
          font-weight: 700; color: #1F6B3D; margin-bottom: 0.5rem;
        }
        .pcto-tool-desc { font-size: 0.92rem; color: #5a6f63; line-height: 1.55; }

        /* Ore in struttura */
        .pcto-hours-wrap { margin-top: 3.5rem; }
        .pcto-hours {
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
        }
        .pcto-hours-row {
          display: grid;
          grid-template-columns: 130px 1fr auto 160px;
          align-items: center;
          gap: 1rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(47, 125, 74, 0.12);
        }
        .pcto-hours-row:last-child { border-bottom: none; }
        .pcto-hours-row--total { font-weight: 800; }
        .pcto-hours-row--total .pcto-hours-h { color: #103820; font-size: 1.15rem; }
        .pcto-hours-year { font-weight: 700; color: #1F6B3D; font-size: 0.9rem; }
        .pcto-hours-bar {
          height: 12px; border-radius: 6px;
          background: rgba(47, 125, 74, 0.12);
          overflow: hidden;
        }
        .pcto-hours-fill { display: block; height: 100%; background: #2F7D4A; border-radius: 6px; }
        .pcto-hours-h { font-weight: 800; color: #1F6B3D; }
        .pcto-hours-note { font-size: 0.82rem; color: #6b8275; text-align: right; }
        @media (max-width: 575.98px) {
          .pcto-hours-row { grid-template-columns: 1fr auto; }
          .pcto-hours-bar, .pcto-hours-note { display: none; }
        }

        /* Chiusura */
        .pcto-closing {
          margin-top: 3.5rem;
          padding: 2.5rem;
          border-radius: 18px;
          color: #ffffff;
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 100%);
          box-shadow: 0 14px 36px rgba(16, 56, 32, 0.18);
        }
        .pcto-closing p { font-size: 1.15rem; line-height: 1.7; opacity: 0.96; max-width: 54rem; }
        .pcto-closing strong { color: #ffffff; }
        @media (max-width: 575.98px) { .pcto-closing { padding: 1.75rem; } }

        /* Banner full-width del team davanti alla sede */
        .pcto-team-banner {
          position: relative;
          width: 100%;
          min-height: clamp(240px, 34vw, 440px);
          display: flex;
          align-items: center;
          overflow: hidden;
          /* fallback neroverde finché l'immagine non è presente */
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 60%, #3F8F5A 100%);
        }
        .pcto-team-banner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 26%;
          z-index: 0;
        }
        .pcto-team-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image: linear-gradient(
            90deg,
            rgba(16, 56, 32, 0.80) 0%,
            rgba(16, 56, 32, 0.45) 42%,
            rgba(16, 56, 32, 0.05) 72%,
            rgba(16, 56, 32, 0) 100%
          );
        }
        .pcto-team-overlay { position: relative; z-index: 2; width: 100%; }
        .pcto-team-kicker {
          color: rgba(255, 255, 255, 0.88);
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        .pcto-team-title {
          color: #ffffff;
          font-weight: 800;
          font-size: clamp(1.85rem, 4.4vw, 3.1rem);
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin-bottom: 0;
          max-width: 22ch;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.28);
        }

        /* Footer */
        .pcto-footer { background-color: #103820; color: #ffffff; }
      `}</style>
    </div>
  );
}
