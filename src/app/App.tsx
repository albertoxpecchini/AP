import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router";
import { activateLocalMode } from "./utils/local";
import { isIOS } from "./utils/device";
import { lockBodyScroll, unlockBodyScroll } from "./utils/scrollLock";
import {
  Mail,
  Phone,
  ArrowUpRight,
  X,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  Compass,
  Footprints,
  Type,
  BrainCircuit,
  Ruler,
} from "lucide-react";
import SiteHeader from "./site/SiteHeader";
import SiteFooter from "./site/SiteFooter";
import { EMAIL, PHONE_HREF, WHATSAPP_HREF, WhatsAppIcon } from "./site/data";

// ── Miniature SVG dei progetti interni (line-art neroverde, discrete) ──
function AngoliThumb() {
  const vx = 96, vy = 158, r = 188, arcR = 48;
  const a1 = 0, a2 = -(48 * Math.PI) / 180, steps = 18;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = a1 + (a2 - a1) * (i / steps);
    pts.push(`${(vx + arcR * Math.cos(t)).toFixed(1)} ${(vy + arcR * Math.sin(t)).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d={`M ${vx} ${vy} L ${pts.join(" L ")} Z`} fill="rgba(47,125,74,0.10)" />
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke="rgba(31,107,61,0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={vx} y1={vy} x2={vx + r} y2={vy} stroke="rgba(31,107,61,0.55)" strokeWidth="2.6" strokeLinecap="round" />
      <line x1={vx} y1={vy} x2={vx + r * Math.cos(a2)} y2={vy + r * Math.sin(a2)} stroke="rgba(31,107,61,0.55)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx={vx} cy={vy} r="4" fill="#1F6B3D" />
    </svg>
  );
}

function ParoleThumb() {
  const cols = 5, w = 44, gap = 11, rx = 7;
  const rowW = cols * w + (cols - 1) * gap;
  const startX = (360 - rowW) / 2;
  const y1 = 50, y2 = 105;
  const states = ["correct", "empty", "present", "empty", "empty"];
  const fillFor: Record<string, string> = { correct: "rgba(47,125,74,0.20)", present: "rgba(214,158,46,0.22)", empty: "none" };
  const strokeFor: Record<string, string> = { correct: "rgba(47,125,74,0.55)", present: "rgba(214,158,46,0.60)", empty: "rgba(31,107,61,0.35)" };
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {Array.from({ length: cols }).map((_, i) => (
        <rect key={`t${i}`} x={startX + i * (w + gap)} y={y1} width={w} height={w} rx={rx} fill="none" stroke="rgba(31,107,61,0.22)" strokeWidth="2" />
      ))}
      {states.map((s, i) => (
        <rect key={`b${i}`} x={startX + i * (w + gap)} y={y2} width={w} height={w} rx={rx} fill={fillFor[s]} stroke={strokeFor[s]} strokeWidth="2.2" />
      ))}
    </svg>
  );
}

function PctoThumb() {
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <path d="M118 92 L118 118 Q118 143 180 147 Q242 143 242 118 L242 92 Z" fill="rgba(47,125,74,0.08)" stroke="rgba(31,107,61,0.5)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M180 52 L264 86 L180 120 L96 86 Z" fill="rgba(47,125,74,0.12)" stroke="rgba(31,107,61,0.6)" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="180" cy="86" r="4.5" fill="#1F6B3D" />
      <path d="M180 86 L266 86 L288 138" fill="none" stroke="rgba(31,107,61,0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="288" cy="143" r="5.5" fill="rgba(47,125,74,0.20)" stroke="rgba(31,107,61,0.55)" strokeWidth="2" />
    </svg>
  );
}

function TriviaThumb() {
  // Tre "card domanda" stilizzate + check, in palette neroverde.
  const card = (x: number, fill: string, stroke: string) => (
    <g key={x}>
      <rect x={x} y={64} width={64} height={72} rx={10} fill={fill} stroke={stroke} strokeWidth="2.2" />
      <rect x={x + 12} y={80} width={40} height={6} rx={3} fill={stroke} opacity="0.6" />
      <rect x={x + 12} y={96} width={28} height={6} rx={3} fill={stroke} opacity="0.35" />
    </g>
  );
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {card(70, "rgba(47,125,74,0.08)", "rgba(31,107,61,0.5)")}
      {card(148, "rgba(217,164,0,0.10)", "rgba(192,120,0,0.55)")}
      {card(226, "rgba(47,125,74,0.12)", "rgba(31,107,61,0.6)")}
      <circle cx="258" cy="78" r="13" fill="#2F7D4A" />
      <path d="M252 78 l4 4 7 -8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MovimentoThumb() {
  // Percorso a "S" su griglia con nodi: l'identità di Movimento (memoria spaziale).
  const nodes = [[88,150],[176,108],[130,64],[252,82],[290,40]];
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      {[1, 2, 3].map(i => (
        <g key={i}>
          <line x1={90 + i * 60} y1="30" x2={90 + i * 60} y2="170" stroke="rgba(31,107,61,0.16)" strokeWidth="1.5" />
          <line x1="80" y1={50 + i * 40} x2="300" y2={50 + i * 40} stroke="rgba(31,107,61,0.16)" strokeWidth="1.5" />
        </g>
      ))}
      <polyline points={nodes.map(n => n.join(",")).join(" ")} fill="none" stroke="rgba(31,107,61,0.6)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      {nodes.map((n, i) => <circle key={i} cx={n[0]} cy={n[1]} r={i === 0 ? 5.5 : 4} fill={i === 0 ? "#1F6B3D" : "rgba(47,125,74,0.55)"} />)}
    </svg>
  );
}

function MappaThumb() {
  // Globo con meridiani + pin di localizzazione: l'identità di Mappa (città dal satellite).
  return (
    <svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <circle cx="180" cy="100" r="62" fill="none" stroke="rgba(124,58,237,0.55)" strokeWidth="3.2" />
      <ellipse cx="180" cy="100" rx="26" ry="62" fill="none" stroke="rgba(124,58,237,0.4)" strokeWidth="2.6" />
      <line x1="118" y1="100" x2="242" y2="100" stroke="rgba(124,58,237,0.4)" strokeWidth="2.6" />
      <path d="M126 70 Q180 88 234 70" fill="none" stroke="rgba(124,58,237,0.35)" strokeWidth="2.4" />
      <path d="M126 130 Q180 112 234 130" fill="none" stroke="rgba(124,58,237,0.35)" strokeWidth="2.4" />
      <path d="M180 74c-11 0-18 7-18 18 0 13 18 32 18 32s18-19 18-32c0-11-7-18-18-18z" fill="rgba(47,125,74,0.65)" stroke="#1F6B3D" strokeWidth="2" />
      <circle cx="180" cy="92" r="6" fill="#fff" />
    </svg>
  );
}

function ProjectThumb({ name }: { name: string }) {
  if (name === "angoli") return <AngoliThumb />;
  if (name === "parole") return <ParoleThumb />;
  if (name === "trivia") return <TriviaThumb />;
  if (name === "pcto") return <PctoThumb />;
  if (name === "movimento") return <MovimentoThumb />;
  if (name === "mappa") return <MappaThumb />;
  return null;
}

// Glyph singolo per la card "diapositiva" (bolla tonda): icona pulita e
// riconoscibile a 36px, scelta in base al progetto. I siti esterni usano il globo.
function ProjectIcon({ thumb }: { thumb?: string }) {
  switch (thumb) {
    case "angoli":    return <Compass size={32} strokeWidth={2.1} />;
    case "parole":    return <Type size={32} strokeWidth={2.1} />;
    case "trivia":    return <BrainCircuit size={32} strokeWidth={2.1} />;
    case "pcto":      return <Ruler size={32} strokeWidth={2.1} />;
    case "movimento": return <Footprints size={32} strokeWidth={2.1} />;
    case "mappa":     return <Globe2 size={32} strokeWidth={2.1} />;
    default:          return <Globe2 size={30} strokeWidth={2.1} />;
  }
}

const PROJECTS = [
  {
    category: "Scuola-lavoro · PCTO",
    date: "2023 — 2026",
    title: "PCTO",
    url: "/pcto",
    thumb: "pcto",
    desc: "Tre anni di alternanza scuola-lavoro al Caem Group S.p.A. di Castellucchio, nell'ufficio tecnico del reparto legno: modellazione 3D di tettoie in AutoCAD, osservazione del calcolo strutturale e archiviazione dei preventivi. Racconto del percorso con illustrazioni dei legni.",
    tags: ["Reparto legno", "AutoCAD 3D", "Strutture in legno", "Ufficio tecnico"],
  },
  {
    category: "Web game",
    date: "20 giu 2026",
    title: "Mappa",
    url: "/mappa",
    thumb: "mappa",
    desc: "Riconosci la città del mondo dalla sua vista satellitare reale: trascina e zooma la mappa a caccia di indizi (monumenti, fiumi, la forma delle strade), poi scrivi il nome. Cinque livelli di difficoltà, indizi progressivi (continente, iniziale, Paese), punteggio con bonus combo, account col nome, classifica live e tema chiaro/scuro. Mappe Esri, mouse e touch.",
    tags: ["React", "TypeScript", "Leaflet", "Game design"],
  },
  {
    category: "Web game",
    date: "18 giu 2026",
    title: "Movimento",
    url: "/movimento",
    thumb: "movimento",
    desc: "Allena la memoria spaziale: un pallino traccia un percorso su una griglia e poi sparisce; tu lo ridisegni a memoria con un solo gesto continuo. Cinque livelli di difficoltà (da 3×3 a 6×6), valutazione della precisione del tracciato, streak con trofei e tema chiaro/scuro. Mouse e touch.",
    tags: ["React", "TypeScript", "Canvas", "Game design"],
  },
  {
    category: "Web game",
    date: "15 giu 2026",
    title: "Trivia",
    url: "/trivia",
    thumb: "trivia",
    desc: "Trivia quiz sulla storia dell'architettura: domande a scelta multipla, vero o falso e a risposta aperta, suddivise in capitoli. Foto pertinenti per ogni domanda, punteggio con bonus velocità, streak con trofei, voto finale in stile americano (A–F) e classifica live. Pensato come un vero gioco, leggero e animato, per PC e mobile.",
    tags: ["React", "TypeScript", "Game design", "UI/UX"],
  },
  {
    category: "Web game",
    date: "30 mag 2026",
    title: "Angoli",
    url: "/angoli",
    thumb: "angoli",
    desc: "Indovina l'angolo in gradianti tra due semirette ruotate casualmente. Feedback binario (Maggiore/Minore), cinque modalità di difficoltà (da 20g a 1g), sistema di strike consecutivi e trofei geometrici.",
    tags: ["React", "TypeScript", "SVG", "Game design"],
  },
  {
    category: "Web game",
    date: "29 mag 2026",
    title: "Parole",
    url: "/parole",
    thumb: "parole",
    desc: "Gioco di parole in stile Wordle, in italiano. Sei tentativi per indovinare una parola di cinque lettere: le caselle diventano verdi se la lettera è al posto giusto, gialle se è presente ma in posizione errata, grigie se assente. Tastiera fisica e a schermo, validazione sul dizionario e parola casuale a ogni partita.",
    tags: ["React", "TypeScript", "react-router", "Game design"],
  },
  {
    category: "Sito web istituzionale",
    date: "27 apr 2026",
    title: "Rivalta sul Mincio",
    url: "https://rivaltasulmincio.it",
    desc: "Sito web responsive per la località turistica di Rivalta sul Mincio. Design minimalista con tipografia editoriale, palette calda monocromatica, griglie bento gapless, animazioni GSAP ScrollTrigger e composizione image-led.",
    tags: ["Next.js", "TypeScript", "GSAP", "Tailwind CSS", "Design minimalista"],
    githubRepo: "albertoxpecchini/rivaltasulmincio",
    screenshotUrl: "https://rivaltasulmincio.it",
  },
  {
    category: "Sito web aziendale",
    date: "20 apr 2026",
    title: "Cascina Fontana",
    url: "https://cascinafontana.xyz",
    desc: "Sito web per Cascina Fontana. Design curato e layout responsive ottimizzato per presentare l'attività e i servizi offerti.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Responsive Design"],
    screenshotUrl: "https://cascinafontana.xyz",
    previewImg: "/cascina-preview.png",
  },
];

// Emoji per ogni progetto (mostrata nella riga "categoria" della card).
const PROJECT_EMOJI: Record<string, string> = {
  "PCTO": "🪵",
  "Mappa": "🗺️",
  "Movimento": "👣",
  "Trivia": "🧠",
  "Angoli": "📐",
  "Parole": "🔤",
  "Rivalta sul Mincio": "🏞️",
  "Cascina Fontana": "🏡",
};

const CV = [
  {
    period: "12 set 2018 — 8 giu 2021",
    title: "Scuola secondaria di primo grado — Mantova",
    role: "Istituto Redentore · Fondazione «Casa dello studente Beato Contardo Ferrini»",
    desc: "Percorso triennale con solida base in italiano, matematica, storia, scienze e lingua inglese. Sviluppo del metodo di studio e delle competenze trasversali. Diploma conseguito con profitto.",
  },
  {
    period: "2021 — oggi",
    title: "Istituto Tecnico Tecnologico «Carlo d'Arco» — Mantova",
    role: "Diploma CAT · Costruzioni, Ambiente e Territorio (5º anno) · Classe 5T",
    desc: "Percorso quinquennale di indirizzo tecnico-tecnologico. Materie principali: progettazione architettonica e disegno tecnico (AutoCAD), topografia e rilievo strumentale, estimo e valutazione immobiliare, gestione del cantiere, fisica tecnica, matematica e inglese tecnico. Codice meccanografico MNTL009017.",
  },
  {
    period: "2019 — oggi",
    title: "Vendite online — Vinted & Subito",
    role: "E-commerce · Fotografia commerciale · Customer care",
    desc: "Gestione autonoma dell'intero ciclo di vendita su Vinted e Subito: valutazione del prodotto, definizione del prezzo di mercato, fotografia con Canon EOS 4000D e iPhone 16 Pro, pubblicazione degli annunci, comunicazione con i potenziali acquirenti, trattativa, spedizione e gestione dei feedback. Prima operazione nel dicembre 2019. Attività personale sistematica dall'autunno 2024. Categorie: abbigliamento, collezionabili cinematografici, dispositivi tech (Apple Watch, Nintendo Switch, Flipper Zero).",
  },
  {
    period: "continuativo",
    title: "Cascina di famiglia — Rivalta sul Mincio",
    role: "Collaboratore agricolo · Logistica · Coordinamento operativo",
    desc: "Collaborazione continuativa nell'attività agricola familiare. Attività svolte: cura e manutenzione delle piante (annaffiamento, potatura di diverse tipologie e dimensioni), trasporto di materiali e attrezzature su trattore con rimorchio, raccolta del fieno da prato stabile, coordinamento delle operazioni con il team durante le fasi di lavoro intensivo, supporto logistico e assistenza negli spostamenti. Gestione autonoma di attrezzature agricole e risoluzione di problemi operativi sul campo.",
  },
  {
    period: "19 dic 2023",
    title: "Corso Sicurezza Lavoratori — Rischio Basso",
    role: "Attestato di frequenza · LTO Mantova / FORMA · Regione Lombardia (ATS Val Padana) · 4 ore E-Learning",
    desc: "Corso conforme all'Accordo Stato Regioni 21 dicembre 2011 (D.Lgs. 81/08, Art. 37), destinato ai lavoratori che svolgono attività d'ufficio. Contenuti: rischio elettrico, cadute dall'alto, microclima e illuminazione, videoterminali, organizzazione del lavoro e stress lavoro correlato, procedure di primo soccorso, segnaletica e antincendio (procedure di esodo). Attestato rilasciato in qualità di studente dal Laboratorio Territoriale Occupabilità di Mantova.",
    pdf: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    pdfLabel: "Apri attestato (PDF)",
  },
  {
    period: "11 — 25 ago 2024",
    title: "CES IELTS Test Centre — Dublino, Irlanda",
    role: "General English Intensive · 26 lezioni/settimana · Livello C1",
    desc: "Corso intensivo di inglese generale presso il centro CES di Dame Court, Dublino 2. Quattro settimane di full immersion con focus su speaking, writing, reading e comprensione orale a livello avanzato (C1). Superamento dell'esame IELTS al termine del corso. Esplorazione autonoma del territorio: Howth, Balbriggan, North Bull Island, Bray, Greystones, Glendalough, Powerscourt Estate e Galway.",
  },
  {
    period: "2024 — 2025",
    title: "Grest Parrocchiale · Parrocchia SS. Donato e Vigilio Martiri",
    role: "Animatore volontario · Rivalta sul Mincio · 6 settimane/anno · 2 edizioni",
    desc: "Servizio di animazione volontaria durante il Grest estivo parrocchiale — due edizioni consecutive (estate 2024 e 2025), per un totale di dodici settimane di attività. Responsabilità diretta su gruppi di bambini di diverse fasce d'età. Pianificazione e conduzione di giochi, laboratori e attività educative. Gestione delle dinamiche di gruppo, mediazione, comunicazione con i genitori. Referente: don Andrea Grandi.",
  },
  {
    period: "estate 2024",
    title: "CRED · Scuola Secondaria di Rodigo",
    role: "Supporto educativo volontario · Comune di Rodigo · 2 settimane",
    desc: "Supporto educativo e animazione durante il Centro Ricreativo Estivo Diurno del Comune di Rodigo. Affiancamento agli educatori nella conduzione delle attività, gestione dei gruppi, supporto individualizzato agli alunni e organizzazione di momenti di gioco strutturato e libero.",
  },
  {
    period: "23 lug — 1 ago 2025",
    title: "Parigi · Le Havre · Rouen · Étretat — Francia",
    role: "Viaggio culturale",
    desc: "Itinerario tra Normandia e Île-de-France: le scogliere di Étretat, la cattedrale gotica di Rouen, il porto storico di Le Havre e i principali musei e quartieri di Parigi.",
  },
  {
    period: "26 — 29 dic 2025",
    title: "Edimburgo — Scozia, Regno Unito",
    role: "Viaggio culturale",
    desc: "Visita della capitale scozzese durante le festività natalizie: Old Town, Edinburgh Castle, Royal Mile e l'atmosfera unica dei vicoli storici nel periodo natalizio.",
  },
  {
    period: "22 — 23 mar 2026",
    title: "Scrutatore — Sezione 5, Rivalta sul Mincio",
    role: "Operazioni elettorali · Comune di Rodigo · Referendum",
    desc: "Incarico ufficiale di scrutatore presso la sezione elettorale n. 5 di Rivalta sul Mincio (Comune di Rodigo) in occasione del Referendum del 22 e 23 marzo 2026. Attività: verifica dell'identità degli elettori, gestione delle operazioni di voto, scrutinio delle schede, redazione dei verbali e trasmissione dei risultati. Incarico retribuito con onorari di 119,60 €.",
  },
  {
    period: "20 apr 2026",
    title: "Cascina Fontana — Sito web",
    role: "Web design & sviluppo front-end",
    desc: "Progettazione e sviluppo del sito web ufficiale di Cascina Fontana. Analisi delle esigenze del cliente, definizione dell'architettura dell'informazione e realizzazione di un'interfaccia responsive, curata nel design e ottimizzata per la presentazione dei prodotti e servizi aziendali. Collaborazione diretta con il cliente per la definizione dei contenuti. Stack: React, TypeScript, Tailwind CSS.",
  },
  {
    period: "27 apr 2026",
    title: "Rivalta sul Mincio — Sito web",
    role: "Web design & sviluppo front-end",
    desc: "Progettazione e sviluppo del sito web istituzionale e turistico per la località di Rivalta sul Mincio. Design editoriale minimalista con tipografia curata, palette cromatica calda e animazioni avanzate tramite GSAP ScrollTrigger (pinning, stacking, scrubbing parallax). Griglie bento gapless e composizione image-led per una narrazione visiva immersiva. Stack: Next.js, TypeScript, GSAP, Tailwind CSS.",
  },
  // --- zona desideri ---
  {
    period: "✦ desidero",
    title: "Testata giornalistica — fondare la mia",
    role: "Giornalismo indipendente · Reportage · Editoria",
    desc: "Costruire un mezzo di informazione personale: andare sul campo, raccontare storie vere senza filtri, con la stessa aggressività e coraggio che ammiro in chi non si ferma davanti a nulla pur di portare la notizia.",
    wish: true,
  },
];

const ITA_MONTHS: Record<string, number> = {
  gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
  lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11,
};
const ITA_MONTH_RE = "gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic";

function parsePeriodStart(period: string): number {
  if (!period) return 0;
  const p = period.toLowerCase().trim();

  // "continuativo" — collaborazione di lunga data, la trattiamo come molto antica.
  if (p.includes("continuativo")) return new Date(1900, 0, 1).getTime();

  // "estate YYYY" → 21 giugno YYYY.
  const summer = p.match(/estate\s+(\d{4})/);
  if (summer) return new Date(+summer[1], 5, 21).getTime();

  // "DD MMM YYYY" all'inizio (data completa: "12 set 2018 — 8 giu 2021", "19 dic 2023").
  const dmy = p.match(new RegExp(`^(\\d{1,2})\\s+(${ITA_MONTH_RE})\\s+(\\d{4})`));
  if (dmy) return new Date(+dmy[3], ITA_MONTHS[dmy[2]], +dmy[1]).getTime();

  // "DD MMM — ... YYYY" (es. "23 lug — 1 ago 2025"): anno dalla coda.
  const dmRange = p.match(new RegExp(`^(\\d{1,2})\\s+(${ITA_MONTH_RE})\\s*—.*?(\\d{4})`));
  if (dmRange) return new Date(+dmRange[3], ITA_MONTHS[dmRange[2]], +dmRange[1]).getTime();

  // "DD — DD MMM YYYY" (es. "11 — 25 ago 2024"): mese/anno dalla coda.
  const dRange = p.match(new RegExp(`^(\\d{1,2})\\s*—\\s*\\d{1,2}\\s+(${ITA_MONTH_RE})\\s+(\\d{4})`));
  if (dRange) return new Date(+dRange[3], ITA_MONTHS[dRange[2]], +dRange[1]).getTime();

  // "YYYY ..." (es. "2021 — oggi", "2024 — 2025").
  const year = p.match(/^(\d{4})/);
  if (year) return new Date(+year[1], 0, 1).getTime();

  return 0;
}

export default function App() {
  const [localMode, setLocalMode] = useState(false);
  const [docOpen, setDocOpen] = useState<{ url: string; title: string } | null>(null);

  const sortedCV = useMemo(() => {
    const wishes = CV.filter((c) => (c as any).wish);
    const items = CV.filter((c) => !(c as any).wish);
    const sorted = items.slice().sort((a, b) => {
      const da = parsePeriodStart(a.period);
      const db = parsePeriodStart(b.period);
      return db - da;
    });
    return [...sorted, ...wishes];
  }, []);

  const CV_PDF = "/cv-alberto-pecchini.pdf";

  useEffect(() => {
    activateLocalMode(() => {
      setLocalMode(true);
      console.info("Local mode attivo");
    });
  }, []);

  useEffect(() => {
    if (isIOS()) document.documentElement.classList.add("ios");
    return () => document.documentElement.classList.remove("ios");
  }, []);

  // Arrivo con un hash nell'URL (es. /#progetti da un'altra rotta): lo scroll
  // nativo del browser scatta prima che il contenuto (lista CV, progetti,
  // immagini lazy) sia montato e dimensionato, quindi finisce in cima. Qui
  // riportiamo lo scroll sulla sezione giusta dopo il layout, con qualche
  // tentativo per assorbire l'aumento di altezza dei contenuti tardivi.
  useLayoutEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    // Primo allineamento SINCRONO, prima del paint: così tornando dal gioco la
    // home appare già sulla sezione giusta, senza il salto "parte in cima poi
    // scende" che si vedeva con lo scroll asincrono.
    const jump = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    };
    jump();
    // Ritenta per assorbire l'aumento di altezza dei contenuti che montano dopo.
    let tries = 0;
    const align = () => {
      jump();
      if (++tries < 6) timer = window.setTimeout(align, 120);
    };
    let timer = window.setTimeout(align, 120);
    return () => clearTimeout(timer);
  }, []);

  const [projectImages, setProjectImages] = useState<Record<string, string>>({});

  useEffect(() => {
    PROJECTS.forEach(async (p) => {
      if (!p.screenshotUrl) return;
      try {
        const dataUrl = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(p.screenshotUrl)}&screenshot=true&viewport.width=600&viewport.height=300`)
          .then(r => r.json())
          .then(d => d.data?.screenshot?.url || null);
        if (dataUrl) setProjectImages((prev) => ({ ...prev, [p.title]: dataUrl }));
      } catch {}
    });
  }, []);

  // Visualizzatore documenti PDF: blocco scroll + chiusura con Esc.
  useEffect(() => {
    if (!docOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDocOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [docOpen]);


  return (
    <div className="it-page-wrapper">
      {/* Skiplinks — requisito di accessibilità del Design System */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          Vai al contenuto principale
        </a>
        <a className="visually-hidden-focusable" href="#contatti">
          Vai ai contatti
        </a>
      </div>

      <SiteHeader localMode={localMode} />

      <main id="main-content">
        <section id="home" className="ap-hero2">
          <div className="ap-wrap ap-hero2-grid">
            <div className="ap-hero2-main">
              <p className="ap-eyebrow">💻 Studente CAT · Front-end Developer</p>
              <h1 className="ap-hero2-title">
                Studente CAT che progetta <span className="ap-hero2-accent">siti web</span> 🌐 e{" "}
                <span className="ap-hero2-accent">web game</span> 🎮.
              </h1>
              <p className="ap-hero2-lead">
                Creo esperienze digitali eleganti con un approccio moderno e funzionale.
                Web design, sviluppo e animazioni curate per ogni schermo.
              </p>
              <div className="ap-hero2-actions">
                <a href="#progetti" className="ap-pill ap-pill--solid">🚀 Progetti</a>
                <Link to="/bio" className="ap-pill ap-pill--ghost">👋 Chi sono</Link>
              </div>
              <div className="ap-hero2-quick">
                {["Trivia", "Mappa", "Angoli"].map((t) => {
                  const p = PROJECTS.find((x) => x.title === t);
                  if (!p) return null;
                  return (
                    <Link key={t} to={p.url} className="ap-quick" aria-label={`Vai a ${p.title}`}>
                      <span className="ap-quick-ic" aria-hidden="true">
                        <ProjectIcon thumb={(p as any).thumb} />
                      </span>
                      <span>{p.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="ap-hero2-aside">
              <div className="ap-hero2-portrait">
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
        </section>

        <section id="progetti" className="ap-sec">
          <div className="ap-wrap">
            <div className="ap-sec-head">
              <div>
                <p className="ap-eyebrow">🚀 Progetti</p>
                <h2 className="ap-sec-title">Il mio lavoro</h2>
              </div>
              <Link to="/trivia" className="ap-sec-action">
                Apri il progetto in evidenza <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="ap-cards">
              {PROJECTS.map((p) => {
                const internal = p.url.startsWith("/");
                const shot = projectImages[p.title] || (p as any).previewImg;
                const media = shot ? (
                  <img className="ap-project-screenshot" src={shot} alt={`Anteprima di ${p.title}`} loading="lazy" />
                ) : (p as any).thumb ? (
                  <div className="ap-project-thumb">
                    <ProjectThumb name={(p as any).thumb} />
                  </div>
                ) : (
                  <div className="ap-project-placeholder">
                    <span className="ap-project-placeholder-text">{p.title}</span>
                  </div>
                );
                const body = (
                  <>
                    <div className="ap-card-media">{media}</div>
                    <div className="ap-card-body">
                      <span className="ap-card-meta">
                        <span aria-hidden="true">{PROJECT_EMOJI[p.title] ?? "📦"}</span> {p.category}
                      </span>
                      <div className="ap-card-titlerow">
                        <span className="ap-card-title">{p.title}</span>
                        <span className="ap-badge ap-badge--active">
                          <span className="ap-badge-dot" aria-hidden="true" />Attivo
                        </span>
                      </div>
                      <span className="ap-card-date">{p.date}</span>
                      <p className="ap-card-desc">{p.desc}</p>
                      <span className="ap-card-link">
                        Apri progetto <ArrowUpRight size={15} aria-hidden="true" />
                      </span>
                    </div>
                  </>
                );
                return internal ? (
                  <Link key={p.title} to={p.url} className="ap-card" aria-label={p.title}>
                    {body}
                  </Link>
                ) : (
                  <a
                    key={p.title}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="ap-card"
                    aria-label={p.title}
                  >
                    {body}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section id="curriculum" className="ap-sec">
          <div className="ap-wrap">
            <div className="mb-5">
              <p className="ap-eyebrow">🎓 Curriculum</p>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                <h2 className="ap-sec-title mb-0">Formazione &amp; esperienze</h2>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDocOpen({ url: CV_PDF, title: "Curriculum Vitae — Alberto Pecchini" })}
                    className="btn btn-primary fw-semibold d-inline-flex align-items-center"
                    aria-haspopup="dialog"
                  >
                    <Eye size={18} className="me-2" aria-hidden="true" /> Visualizza il CV
                  </button>
                  <div className="d-flex flex-column gap-1">
                    <a
                      href={CV_PDF}
                      className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center"
                      download
                    >
                      <Download size={18} className="me-2" aria-hidden="true" /> Scarica (PDF)
                    </a>
                    <span className="text-muted" style={{ fontSize: "0.8rem", lineHeight: 1 }}>3 pagine · 990 KB</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-9">
                <div className="ap-timeline">
                  {sortedCV.map((item) => (
                    <div
                      className={`ap-timeline-item${(item as any).wish ? " ap-timeline-item--wish" : ""}`}
                      key={item.title}
                    >
                      <span className={`ap-timeline-period${ (item as any).wish ? " ap-timeline-period--wish" : ""}`}>
                        {item.period}
                      </span>
                      <h3 className={`h5 mb-1${(item as any).wish ? " fst-italic fw-normal" : " fw-bold"}`}>
                        {item.title}
                      </h3>
                      <p className={`fw-semibold mb-2${(item as any).wish ? " ap-wish-role" : " text-primary"}`}>
                        {item.role}
                      </p>
                      <p className="text-muted mb-0">{item.desc}</p>
                      {(item as any).pdf && (
                        <button
                          type="button"
                          onClick={() => setDocOpen({ url: (item as any).pdf, title: item.title })}
                          className="ap-cv-doc mt-3"
                          aria-haspopup="dialog"
                        >
                          <FileText size={16} aria-hidden="true" />
                          <span>{(item as any).pdfLabel || "Apri documento (PDF)"}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contatti" className="ap-contact">
          <div className="ap-wrap ap-contact-inner">
            <p className="ap-eyebrow ap-eyebrow--light">✉️ Contatti</p>
            <h2 className="ap-contact-title">Parliamone. 💬</h2>
            <p className="ap-contact-lead">
              Per collaborazioni, progetti web o semplicemente per uno scambio di idee — sono
              disponibile.
            </p>
            <div className="ap-contact-actions">
              <a href={`mailto:${EMAIL}`} className="ap-pill ap-pill--light">
                <Mail size={18} aria-hidden="true" /> Scrivimi
              </a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener" className="ap-pill ap-pill--lightghost">
                <WhatsAppIcon size={18} /> WhatsApp
              </a>
              <a href={PHONE_HREF} className="ap-pill ap-pill--lightghost">
                <Phone size={18} aria-hidden="true" /> Chiamami
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Visualizzatore PDF generico: usato sia per il CV che per gli attestati */}
      {docOpen && (
        <div
          className="ap-cv-modal"
          role="dialog"
          aria-modal="true"
          aria-label={docOpen.title}
        >
          <div className="ap-cv-backdrop" onClick={() => setDocOpen(null)} aria-hidden="true" />
          <div className="ap-cv-dialog">
            <div className="ap-cv-bar">
              <span className="ap-cv-title">{docOpen.title}</span>
              <div className="d-flex align-items-center gap-2">
                <a
                  href={docOpen.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-sm btn-outline-light fw-semibold d-none d-sm-inline-flex align-items-center"
                >
                  <ExternalLink size={15} className="me-1" aria-hidden="true" /> Nuova scheda
                </a>
                <a
                  href={docOpen.url}
                  download
                  className="btn btn-sm btn-light fw-semibold text-primary d-inline-flex align-items-center"
                >
                  <Download size={15} className="me-1" aria-hidden="true" /> Scarica
                </a>
                <button
                  type="button"
                  className="ap-cv-close"
                  onClick={() => setDocOpen(null)}
                  aria-label="Chiudi l'anteprima del documento"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <a
              href={docOpen.url}
              target="_blank"
              rel="noreferrer noopener"
              className="ap-cv-fallback d-sm-none"
            >
              Su mobile l'anteprima PDF potrebbe non caricare — tocca qui per aprire il file →
            </a>
            <iframe
              className="ap-cv-frame"
              src={`${docOpen.url}#view=FitH&toolbar=1&navpanes=0`}
              title={`Anteprima: ${docOpen.title}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
