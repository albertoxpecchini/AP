import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router";
import { activateLocalMode } from "./utils/local";
import { isIOS } from "./utils/device";
import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Menu,
  X,
  GraduationCap,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  Bike,
  Dumbbell,
  Gamepad2,
  Music,
  Plane,
  Cpu,
  Palette,
  Lightbulb,
  Camera,
  Car,
  Film,
  Mountain,
  ShoppingBag,
  Tag,
  FileText,
  Globe2,
  Compass,
  Footprints,
  Type,
  BrainCircuit,
  Ruler,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiX,
  SiYoutube,
  SiGithub,
  SiWhatsapp,
  SiTelegram,
  SiSnapchat,
  SiPinterest,
  SiReddit,
  SiTwitch,
  SiSpotify,
  SiThreads,
  SiSteam,
  SiVinted,
  SiOpenstreetmap,
  SiEbay,
} from "react-icons/si";

const NAV_LINKS = [
  { href: "#progetti", label: "Progetti" },
  { href: "#chi-sono", label: "Chi sono" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#hobby", label: "Hobby" },
  { href: "#passioni", label: "Passioni" },
  { href: "#contatti", label: "Contatti" },
];

// Contatti
const EMAIL = "pzkko@yahoo.com";
const PHONE_DISPLAY = "+39 331 407 4198";
const PHONE_HREF = "tel:+393314074198";
const WHATSAPP_HREF = "https://wa.me/447340995142";

// lucide-react non include un'icona brand di WhatsApp: la definiamo inline.
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.58-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

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

// Social del footer. href "#" = profilo da fornire (verranno rimossi quelli non usati).
const SOCIALS = [
  { name: "Instagram", Icon: SiInstagram, href: "https://www.instagram.com/albertoxpecchini" },
  { name: "TikTok", Icon: SiTiktok, href: "https://www.tiktok.com/@albertoxpecchini" },
  { name: "X (Twitter)", Icon: SiX, href: "https://x.com/ygpzk" },
  { name: "YouTube", Icon: SiYoutube, href: "https://www.youtube.com/@alberto-h7y3h" },
  { name: "GitHub", Icon: SiGithub, href: "https://github.com/albertoxpecchini" },
  { name: "WhatsApp", Icon: SiWhatsapp, href: WHATSAPP_HREF },
  { name: "Telegram", Icon: SiTelegram, href: "https://t.me/albertopecchini" },
  { name: "Snapchat", Icon: SiSnapchat, href: "https://www.snapchat.com/add/albertoxpecchini" },
  { name: "Pinterest", Icon: SiPinterest, href: "https://www.pinterest.com/albertoxpecchini" },
  { name: "Reddit", Icon: SiReddit, href: "https://www.reddit.com/user/yungpzkko" },
  { name: "Twitch", Icon: SiTwitch, href: "https://www.twitch.tv/pzkko" },
  { name: "Spotify", Icon: SiSpotify, href: "https://open.spotify.com/user/qeefs44bv4bpoa7dk8epagrxf" },
  { name: "Threads", Icon: SiThreads, href: "https://www.threads.net/@albertoxpecchini" },
  { name: "Steam", Icon: SiSteam, href: "https://steamcommunity.com/profiles/76561198971719489/" },
  { name: "Vinted", Icon: SiVinted, href: "https://www.vinted.it/member/237170304" },
  { name: "Subito.it", Icon: SiEbay, href: "https://www.subito.it/utente/127591135" },
  { name: "OpenStreetMap", Icon: SiOpenstreetmap, href: "https://www.openstreetmap.org/user/albertoxpecchini" },
];

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

const SKILLS = [
  { title: "Sviluppo front-end", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia", "Responsive Design"] },
  { title: "AI & sviluppo assistito", items: ["Claude Code", "Codex", "GitHub Copilot", "Gemini", "DeepSeek", "Grok"] },
  { title: "Strumenti & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code", "PowerShell", "LaTeX / Overleaf"] },
  { title: "Windows & IT Support", items: ["Troubleshooting PC", "Setup hardware & reti", "Ottimizzazione Windows", "File system 2.5 TB", "Malware removal", "Gestione periferiche"] },
  { title: "Multimedia & Content", items: ["Fotografia commerciale", "DaVinci Resolve", "Adobe Premiere Pro", "Canva", "iPhone 16 Pro"] },
  { title: "Area tecnica CAT", items: ["Disegno tecnico / CAD", "AutoCAD", "Topografia", "Progettazione edilizia", "Estimo", "Excel avanzato"] },
  { title: "Lingue", items: ["Italiano — madrelingua", "Inglese — C1 (IELTS)"] },
];

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

const HOBBY = [
  {
    Icon: Bike,
    label: "Moto",
    img: "/images/hobby-moto.jpg",
    desc: "Le due ruote rappresentano per me libertà allo stato puro. Mi affascina la tecnica di guida, la meccanica dei motori e il senso di controllo totale che si prova su una moto. Seguire il mondo delle moto — dalle naked alle supersportive — è una delle cose che mi appassiona di più.",
  },
  {
    Icon: Dumbbell,
    label: "Sport",
    img: "/images/hobby-sport.jpg",
    desc: "Mi alleno regolarmente in palestra: trovo che la disciplina sportiva migliori non solo il fisico ma anche la concentrazione e la costanza nel lavoro quotidiano. Mi interessano i workout di forza e mi documento continuamente su allenamento e nutrizione sportiva.",
  },
  {
    Icon: Gamepad2,
    label: "Videogiochi",
    img: "/images/hobby-videogiochi.jpg",
    desc: "I videogiochi mi hanno avvicinato al mondo del design e della tecnologia fin da giovane. Apprezzo i titoli con una forte identità visiva, una narrativa curata e un gameplay profondo — sia esperienze single player immersive che titoli competitivi. Ne ho anche realizzato uno: Parole, un Wordle in italiano.",
    link: "/parole",
    linkLabel: "Gioca a Parole",
  },
  {
    Icon: Music,
    label: "Musica",
    img: "/images/hobby-musica.jpg",
    desc: "La musica è una presenza costante mentre lavoro e mi rilasso. Ascolto generi molto diversi: dalla musica elettronica all'hip-hop, passando per colonne sonore cinematografiche. Il ritmo e l'atmosfera di un brano influenzano molto il mio approccio creativo.",
  },
  {
    Icon: Plane,
    label: "Viaggi",
    img: "/images/hobby-viaggi.jpg",
    desc: "Viaggiare mi permette di osservare architetture, design urbano e culture diverse che poi rientrano inconsciamente nel mio lavoro creativo. Mi piace esplorare posti nuovi con curiosità, annotare dettagli visivi e portarli nei miei progetti.",
  },
  {
    Icon: Cpu,
    label: "Tecnologia",
    img: "/images/hobby-tecnologia.jpg",
    desc: "Sono attratto da tutto ciò che è nuovo nel mondo tech: hardware, software, intelligenza artificiale, smartphone. Seguire le novità tecnologiche non è solo un hobby ma un modo per restare aggiornato e trovare ispirazione per i miei progetti digitali.",
  },
];

const PASSIONI = [
  {
    Icon: Palette,
    label: "Web design",
    img: "/images/passione-webdesign.jpg",
    desc: "Il web design è la mia passione principale: creare interfacce belle e funzionali dove ogni dettaglio — dalla tipografia al ritmo degli spazi — contribuisce all'esperienza dell'utente. Studio continuamente trend di design e mi ispiro a designer internazionali per affinare il mio gusto visivo.",
  },
  {
    Icon: Lightbulb,
    label: "Innovazione digitale",
    img: "/images/passione-innovazione.jpg",
    desc: "Mi affascina il modo in cui la tecnologia trasforma prodotti, servizi e abitudini quotidiane. Seguo con interesse l'evoluzione dell'intelligenza artificiale, dei tool creativi generativi e delle nuove piattaforme digitali che ridefiniscono il modo di costruire e vivere il web.",
  },
  {
    Icon: Camera,
    label: "Fotografia",
    img: "/images/passione-fotografia.jpg",
    desc: "Attraverso la fotografia imparo a vedere il mondo con occhio compositivo: luce, prospettiva, equilibrio visivo. Questi concetti si trasferiscono direttamente nel mio approccio al design delle interfacce, dove la gerarchia visiva e il contrasto sono tutto.",
  },
  {
    Icon: Car,
    label: "Motori",
    img: "/images/passione-motori.jpg",
    desc: "La passione per i motori va oltre le moto: seguo l'automotive design, la Formula 1 e l'ingegneria meccanica applicata alle auto. L'estetica di un'auto ben disegnata o la perfezione tecnica di un motore mi affascinano tanto quanto un'interfaccia web riuscita.",
  },
  {
    Icon: Film,
    label: "Cinema",
    img: "/images/passione-cinema.jpg",
    desc: "Il cinema mi interessa per il suo linguaggio visivo: composizione dell'inquadratura, uso del colore, ritmo del montaggio. I registi che usano l'immagine come strumento narrativo primario sono una grande fonte di ispirazione per il mio lavoro di design.",
  },
  {
    Icon: Mountain,
    label: "Outdoor",
    img: "/images/passione-outdoor.jpg",
    desc: "Staccare dallo schermo e stare all'aria aperta mi aiuta a ricaricare la creatività. Che sia una gita in moto, una camminata tra la natura mantovana o semplicemente del tempo fuori, il contrasto con il lavoro digitale è fondamentale per tornare ai progetti con occhi freschi.",
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

function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.dataset.scrollLockY = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflowY = "scroll";
}

function unlockBodyScroll() {
  const scrollY = parseInt(document.body.dataset.scrollLockY || "0", 10);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflowY = "";
  delete document.body.dataset.scrollLockY;
  // 'instant' bypasses CSS scroll-behavior: smooth (incl. Bootstrap Italia !important)
  window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const now = new Date();
  const currentDate = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const currentYear = now.getFullYear();

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const birthDate = new Date(2006, 5, 28);
  let age = currentYear - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  // Lock body scroll while the mobile menu overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const [selectedItem, setSelectedItem] = useState<{ Icon: any; label: string; desc: string; img?: string } | null>(null);
  const [modalImgStatus, setModalImgStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setModalImgStatus("loading");
  }, [selectedItem]);

  const [ghData, setGhData] = useState<Record<string, { pushedAt: string; version?: string }>>({});
  const [projectImages, setProjectImages] = useState<Record<string, string>>({});

  useEffect(() => {
    PROJECTS.forEach(async (p) => {
      const repo = p.githubRepo;
      if (!repo) return;
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`);
        if (!repoRes.ok) return;
        const repoJson = await repoRes.json();

        let version: string | undefined;
        const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
        if (releaseRes.ok) {
          const rel = await releaseRes.json();
          version = rel.tag_name;
        } else {
          const tagsRes = await fetch(`https://api.github.com/repos/${repo}/tags`);
          if (tagsRes.ok) {
            const tags = await tagsRes.json();
            if (Array.isArray(tags) && tags.length > 0) version = tags[0].name;
          }
        }

        setGhData((prev) => ({ ...prev, [repo]: { pushedAt: repoJson.pushed_at, version } }));
      } catch {}
    });

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
  useEffect(() => {
    if (!selectedItem) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedItem(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [selectedItem]);

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

      <header className={`ap-hdr ${scrolled ? "ap-hdr--scrolled" : ""}`}>
        <div className="ap-wrap ap-hdr-inner">
          <a href="#home" className="ap-hdr-brand" aria-label="Alberto Pecchini, torna su">
            <img src="/alberto-pecchini.jpg" alt="" className="ap-hdr-avatar" width={36} height={36} loading="eager" />
            <span className="ap-hdr-name">Alberto Pecchini</span>
            {localMode ? <span className="ap-hdr-local">Local</span> : null}
          </a>

          <nav className="ap-hdr-nav" aria-label="Navigazione principale">
            {NAV_LINKS.filter((l) => l.href !== "#contatti").map((link) => (
              <a key={link.href} className="ap-hdr-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ap-hdr-right">
            <div className="ap-hdr-social">
              <a href="https://github.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="GitHub" title="GitHub">
                <SiGithub size={18} aria-hidden="true" />
              </a>
              <a href="https://www.instagram.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="Instagram" title="Instagram">
                <SiInstagram size={18} aria-hidden="true" />
              </a>
              <a href="https://x.com/ygpzk" target="_blank" rel="noreferrer noopener" aria-label="X" title="X">
                <SiX size={18} aria-hidden="true" />
              </a>
            </div>
            <a href="#contatti" className="ap-hdr-cta">Contatti</a>
            <button
              className="ap-hdr-burger"
              type="button"
              aria-controls="ap-drawer"
              aria-expanded={menuOpen}
              aria-label="Apri il menu di navigazione"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Drawer mobile */}
        <div className={`ap-drawer ${menuOpen ? "open" : ""}`} id="ap-drawer">
          <div className="ap-drawer-backdrop" onClick={closeMenu} aria-hidden="true" />
          <div className="ap-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu di navigazione">
            <button className="ap-drawer-close" type="button" aria-label="Chiudi il menu" onClick={closeMenu}>
              <X size={22} aria-hidden="true" />
            </button>
            <nav className="ap-drawer-nav" aria-label="Navigazione">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="ap-drawer-contacts">
              <a href={`mailto:${EMAIL}`}>
                <Mail size={18} aria-hidden="true" /> {EMAIL}
              </a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
              <a href={PHONE_HREF}>
                <Phone size={18} aria-hidden="true" /> {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section id="home" className="ap-hero2">
          <div className="ap-wrap ap-hero2-grid">
            <div className="ap-hero2-main">
              <p className="ap-eyebrow">Studente CAT · Front-end Developer</p>
              <h1 className="ap-hero2-title">
                Studente CAT che progetta <span className="ap-hero2-accent">siti web</span> e{" "}
                <span className="ap-hero2-accent">web game</span>.
              </h1>
              <p className="ap-hero2-lead">
                Creo esperienze digitali eleganti con un approccio moderno e funzionale.
                Web design, sviluppo e animazioni curate per ogni schermo.
              </p>
              <div className="ap-hero2-actions">
                <a href="#progetti" className="ap-pill ap-pill--solid">Progetti</a>
                <a href="#chi-sono" className="ap-pill ap-pill--ghost">Chi sono</a>
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
                <p className="ap-eyebrow">Progetti</p>
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

        <section id="chi-sono" className="ap-sec ap-sec--alt">
          <div className="ap-wrap ap-bio">
            <div className="ap-bio-main">
              <p className="ap-eyebrow">Chi sono</p>
              <h2 className="ap-sec-title">Creo esperienze digitali pulite ed eleganti.</h2>
              <p className="ap-bio-p">
                Mi chiamo Alberto Pecchini, ho {age} anni e frequento il quinto anno della
                sezione CAT all'Istituto Tecnico Tecnologico <strong>«Carlo d'Arco»</strong> di
                Mantova.
              </p>
              <p className="ap-bio-p">
                Sono uno sviluppatore web e designer appassionato di user experience e design
                minimalista. Utilizzo Next.js, TypeScript, GSAP e Tailwind CSS per creare siti
                web responsivi, veloci e raffinati.
              </p>
              <p className="ap-bio-p">
                La mia missione è trasformare le idee in{" "}
                <strong>esperienze digitali memorabili</strong>, mantenendo un design pulito,
                una tipografia curata e animazioni che valorizzano i contenuti.
              </p>
              <p className="ap-bio-p mb-0">
                Fuori dallo schermo sono un <strong>tifoso del Sassuolo</strong>: il neroverde
                è anche il filo conduttore cromatico di questo sito.
              </p>
            </div>

            <aside className="ap-bio-side">
              <div className="ap-side-box">
                <p className="ap-side-label">Dove</p>
                <p className="ap-side-based">
                  <MapPin size={16} aria-hidden="true" /> Mantova · Italia
                </p>
              </div>

              <div className="ap-side-box">
                <p className="ap-side-label">Competenze</p>
                {SKILLS.map((group) => (
                  <div className="ap-side-skill" key={group.title}>
                    <span className="ap-side-skill-title">{group.title}</span>
                    <div className="ap-side-chips">
                      {group.items.map((item) => (
                        <span key={item} className="chip chip-simple chip-primary">
                          <span className="chip-label">{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="ap-side-box">
                <p className="ap-side-label">Formazione</p>
                <p className="ap-side-edu-lead">
                  Diploma CAT in corso all'ITT «Carlo d'Arco» di Mantova; inglese C1 (IELTS)
                  conseguito a Dublino.
                </p>
                <ul className="ap-side-edu">
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> ITT «Carlo d'Arco» — Diploma CAT
                  </li>
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> CES Dublino — IELTS, livello C1
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section id="curriculum" className="ap-sec">
          <div className="ap-wrap">
            <div className="mb-5">
              <p className="ap-eyebrow">Curriculum</p>
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

        <section id="hobby" className="ap-sec ap-sec--alt">
          <div className="ap-wrap">
            <div className="ap-sec-head">
              <div>
                <p className="ap-eyebrow">Hobby</p>
                <h2 className="ap-sec-title">Nel tempo libero</h2>
                <p className="ap-sec-sub">Le cose che faccio quando non sono davanti allo schermo</p>
              </div>
            </div>
            <div className="ap-cards">
              {HOBBY.map((item) => (
                <button
                  type="button"
                  className="ap-card ap-card--btn"
                  key={item.label}
                  onClick={() => setSelectedItem(item)}
                  aria-label={`Scopri di più: ${item.label}`}
                >
                  <div className="ap-card-media">
                    {item.img ? (
                      <img className="ap-project-screenshot" src={item.img} alt={item.label} loading="lazy" />
                    ) : (
                      <div className="ap-project-placeholder">
                        <span className="ap-interest-icon" aria-hidden="true">
                          <item.Icon size={26} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ap-card-body">
                    <span className="ap-card-meta">
                      <item.Icon size={14} aria-hidden="true" /> Hobby
                    </span>
                    <span className="ap-card-title">{item.label}</span>
                    <p className="ap-card-desc ap-card-desc--clamp">{item.desc}</p>
                    <span className="ap-card-link">
                      Scopri di più <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="passioni" className="ap-sec">
          <div className="ap-wrap">
            <div className="ap-sec-head">
              <div>
                <p className="ap-eyebrow">Passioni</p>
                <h2 className="ap-sec-title">Cosa mi appassiona</h2>
                <p className="ap-sec-sub">I temi che alimentano il mio modo di progettare</p>
              </div>
            </div>
            <div className="ap-cards">
              {PASSIONI.map((item) => (
                <button
                  type="button"
                  className="ap-card ap-card--btn"
                  key={item.label}
                  onClick={() => setSelectedItem(item)}
                  aria-label={`Scopri di più: ${item.label}`}
                >
                  <div className="ap-card-media">
                    {item.img ? (
                      <img className="ap-project-screenshot" src={item.img} alt={item.label} loading="lazy" />
                    ) : (
                      <div className="ap-project-placeholder">
                        <span className="ap-interest-icon" aria-hidden="true">
                          <item.Icon size={26} />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ap-card-body">
                    <span className="ap-card-meta">
                      <item.Icon size={14} aria-hidden="true" /> Passione
                    </span>
                    <span className="ap-card-title">{item.label}</span>
                    <p className="ap-card-desc ap-card-desc--clamp">{item.desc}</p>
                    <span className="ap-card-link">
                      Scopri di più <ArrowUpRight size={15} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="contatti" className="ap-contact">
          <div className="ap-wrap ap-contact-inner">
            <p className="ap-eyebrow ap-eyebrow--light">Contatti</p>
            <h2 className="ap-contact-title">Parliamone.</h2>
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

      <footer className="ap-foot">
        <div className="ap-wrap">
          <div className="ap-foot-top">
            <div>
              <p className="ap-foot-name">Alberto Pecchini</p>
              <p className="ap-foot-role">Designer &amp; Developer · ITT «Carlo d'Arco» — Mantova</p>
            </div>
            <div className="ap-foot-social">
              {SOCIALS.map(({ name, Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  title={name}
                  {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="ap-foot-bottom">
            <span>© {currentYear} Alberto Pecchini — Tutti i diritti riservati</span>
            <span>Aggiornato il {currentDate}</span>
          </div>
        </div>
      </footer>

      {selectedItem && (
        <>
          <div
            className="ap-modal-backdrop"
            onClick={() => setSelectedItem(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            style={{ transform: "translate(-50%, -50%)" }}
            className="ap-modal"
          >
            <button
              type="button"
              className="ap-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
            {selectedItem.img && modalImgStatus !== "error" && (
              <div className={`ap-modal-photo${modalImgStatus === "loaded" ? " ap-modal-photo--ready" : ""}`}>
                <img
                  src={selectedItem.img}
                  alt={selectedItem.label}
                  loading="lazy"
                  onLoad={() => setModalImgStatus("loaded")}
                  onError={() => setModalImgStatus("error")}
                />
              </div>
            )}
            <div className="ap-modal-inner">
              <div className="ap-modal-icon-wrap">
                <selectedItem.Icon size={32} />
              </div>
              <h2 id="modal-title" className="ap-modal-title">{selectedItem.label}</h2>
              <p className="ap-modal-body">{selectedItem.desc}</p>
              {(selectedItem as any).link && (
                <a
                  href={(selectedItem as any).link}
                  className="btn btn-primary fw-semibold mt-2 d-inline-flex align-items-center"
                >
                  <Gamepad2 size={18} className="me-2" aria-hidden="true" />
                  {(selectedItem as any).linkLabel ?? "Apri"}
                </a>
              )}
            </div>
          </div>
        </>
      )}

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

      <style>{`
        /* Palette neroverde: override del primario di Bootstrap Italia
           (era blu #06c) per uniformare bg-primary, text-primary, btn-*-primary. */
        :root {
          --bs-primary: #2F7D4A;
          --bs-primary-rgb: 47, 125, 74;
          --bs-link-color: #1F6B3D;
          --bs-link-color-rgb: 31, 107, 61;
          --bs-link-hover-color: #155030;
          --bs-link-hover-color-rgb: 21, 80, 48;
        }
        .it-page-wrapper .bg-primary { background-color: #2F7D4A !important; }
        .it-page-wrapper .text-primary { color: #1F6B3D !important; }
        .it-page-wrapper .border-primary { border-color: #2F7D4A !important; }
        .it-page-wrapper .btn-primary {
          background-color: #2F7D4A;
          border-color: #2F7D4A;
        }
        .it-page-wrapper .btn-primary:hover,
        .it-page-wrapper .btn-primary:focus {
          background-color: #1F6B3D;
          border-color: #1F6B3D;
        }
        .it-page-wrapper .btn-outline-primary {
          color: #1F6B3D !important;
          border-color: #2F7D4A !important;
        }
        .it-page-wrapper .btn-outline-primary:hover,
        .it-page-wrapper .btn-outline-primary:focus {
          background-color: #2F7D4A !important;
          border-color: #2F7D4A !important;
          color: #ffffff !important;
        }
        .it-page-wrapper .chip-primary,
        .it-page-wrapper .chip.chip-primary,
        .it-page-wrapper .chip.chip-simple.chip-primary {
          background-color: rgba(47, 125, 74, 0.12) !important;
          color: #1F6B3D !important;
          border-color: rgba(47, 125, 74, 0.28) !important;
        }
        .it-page-wrapper .chip-primary .chip-label,
        .it-page-wrapper .chip.chip-primary .chip-label {
          color: #1F6B3D !important;
        }
        .it-page-wrapper .theme-dark {
          background-color: #103820 !important;
        }
        .it-page-wrapper .it-footer-main {
          background-color: #103820 !important;
        }
        .it-page-wrapper .it-footer-main .border-top {
          border-color: rgba(255, 255, 255, 0.18) !important;
        }

        .it-page-wrapper {
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background-color: #ffffff;
        }

        /* Marchio nel center header */
        .ap-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          overflow: hidden;
          margin-right: 12px;
        }
        .ap-brand-mark img {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Navbar sticky */
        .ap-navbar {
          position: sticky;
          top: 0;
          z-index: 3;
        }
        .ap-navbar--scrolled {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
        }

        /*
         * Menu mobile: nel Design System l'apertura del drawer è gestita dal JS
         * di Bootstrap Italia. Qui la navigazione è controllata da React, quindi
         * rendiamo lo stato .expanded autosufficiente in CSS (sotto i 992px).
         */
        @media (max-width: 991.98px) {
          .ap-navbar .navbar-collapsable.expanded {
            display: block;
          }
          .ap-navbar .navbar-collapsable .menu-wrapper {
            height: 100%;
            padding: 1.5rem;
            overflow-y: auto;
          }
          .ap-navbar .navbar-collapsable .overlay {
            display: none;
          }
          .ap-navbar .navbar-collapsable.expanded .overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
          }

          /* ── Nascondi topbar e header centrale ── */
          .it-header-slim-wrapper,
          .it-header-center-wrapper {
            display: none !important;
          }

          /* ── Navbar: overlay trasparente fisso, abbassato di 18px ── */
          .ap-navbar {
            position: fixed !important;
            top: 18px !important;
            left: 0 !important;
            right: 0 !important;
            background-color: transparent !important;
            box-shadow: none !important;
            transition: background-color 0.25s ease, top 0.2s ease !important;
            z-index: 100 !important;
            /* Blocca BI da animare padding-top sul wrapper */
            padding: 0 !important;
            overflow: visible !important;
          }
          /* Quando scrollato: sale a top:0 e sfondo verde scuro */
          .ap-navbar.ap-navbar--scrolled {
            top: 0 !important;
            background-color: #103820 !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.22) !important;
          }

          /* Rimuovi i vincoli del container Bootstrap per usare tutta la larghezza */
          .ap-navbar .container {
            max-width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .ap-navbar .row { margin: 0 !important; }
          .ap-navbar .col-12 { padding: 0 !important; }

          /* Flex row con safe-area e padding laterale corretto */
          .ap-navbar .navbar {
            display: flex !important;
            align-items: center !important;
            padding-top: calc(env(safe-area-inset-top) + 8px) !important;
            padding-bottom: 8px !important;
            padding-left: 6px !important;
            padding-right: 10px !important;
            min-height: calc(env(safe-area-inset-top) + 62px) !important;
            overflow: visible !important;
          }

          /* ── Hamburger: visibile su mobile, nascosto su desktop ── */
          .ap-hamburger {
            display: flex;
          }

          /* ── Menu drawer: full-screen, sfondo verde scuro ── */
          .ap-navbar .navbar-collapsable.expanded {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 200 !important;
            background-color: #103820 !important;
          }
          .ap-navbar .navbar-collapsable,
          .ap-navbar .navbar-collapsable .menu-wrapper,
          .ap-navbar .navbar-collapsable .close-div {
            background-color: #103820 !important;
          }
          .ap-navbar .navbar-collapsable .nav-link {
            color: #ffffff !important;
            font-size: 1.15rem;
            padding: 0.75rem 0 !important;
          }
          .ap-navbar .navbar-collapsable .nav-link:hover,
          .ap-navbar .navbar-collapsable .nav-link:focus {
            color: rgba(255, 255, 255, 0.72) !important;
          }
          .ap-navbar .close-menu {
            color: #ffffff !important;
          }
          .ap-navbar .close-menu svg {
            stroke: #ffffff !important;
          }

          /* ── Bottoni contatto mobile ── */
          .ap-mobile-contacts {
            gap: 6px !important;
            align-items: center !important;
            padding-right: 4px !important;
            flex-shrink: 0 !important;
          }
          .ap-mobile-contact-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            color: #ffffff;
            text-decoration: none;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.18);
            flex-shrink: 0;
            transition: background 0.15s ease;
          }
          .ap-mobile-contact-btn:hover,
          .ap-mobile-contact-btn:focus-visible {
            background: rgba(255, 255, 255, 0.30);
            color: #ffffff;
          }
        }

        /* Hero */
        .ap-hero {
          min-height: 100vh;
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          background-color: #1F6B3D;
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 60%, #3F8F5A 100%);
        }
        .ap-hero h1 {
          overflow-wrap: anywhere;
        }
        .ap-hero .lead {
          color: rgba(255, 255, 255, 0.9);
        }
        .ap-kicker {
          letter-spacing: 0.18em;
          font-size: 0.875rem;
        }
        .ap-scroll-hint {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.85);
        }

        /* ═══════ Vetrina progetti "a diapositive" (card uniformi, icona tonda
           che sporge dal bordo superiore) — stile games, palette viola+verde ═══════ */
        .ap-slides-section {
          background: linear-gradient(160deg,#1a0b2e 0%,#2a1150 42%,#103820 130%);
          padding: 4.5rem 0 4rem;
          position: relative; overflow: hidden;
        }
        .ap-slides-section::before, .ap-slides-section::after {
          content:""; position:absolute; width:55%; height:55%; border-radius:50%;
          filter:blur(80px); opacity:0.28; pointer-events:none;
        }
        .ap-slides-section::before { background:#7c3aed; top:-12%; left:-10%; }
        .ap-slides-section::after  { background:#2F9E5A; bottom:-15%; right:-8%; opacity:0.22; }
        .ap-slides-head { position:relative; z-index:1; margin-bottom: 3rem; }
        .ap-slides-kicker { color:#b794ff !important; }

        .ap-slides-grid {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr;
          gap: 2.2rem 1.5rem;
        }
        @media (min-width: 576px) { .ap-slides-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 992px) { .ap-slides-grid { grid-template-columns: repeat(4, 1fr); } }

        .ap-slide {
          position: relative;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 2.9rem 1.3rem 1.6rem;            /* spazio in alto per l'icona che sporge */
          margin-top: 1.7rem;                        /* lascia spazio all'icona sopra il bordo */
          border: 1px solid rgba(155,92,246,0.26);
          border-radius: 18px;
          background: rgba(124,58,237,0.10);
          text-decoration: none; color: inherit;
          transition: transform .16s ease, border-color .16s, box-shadow .16s, background .16s;
        }
        .ap-slide:hover {
          transform: translateY(-4px);
          border-color: rgba(155,92,246,0.55);
          background: rgba(124,58,237,0.16);
          box-shadow: 0 16px 38px rgba(0,0,0,0.45);
        }
        /* icona tonda che ESCE dal bordo superiore (come lo screenshot) */
        .ap-slide-icon {
          position: absolute; top: 0; left: 50%;
          transform: translate(-50%, -50%);
          width: 60px; height: 60px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: #fff; color: #6024c4;
          box-shadow: 0 8px 24px rgba(91,33,182,0.45);
          border: 1px solid rgba(124,58,237,0.25);
          transition: transform .16s ease, box-shadow .16s;
          overflow: hidden;
        }
        .ap-slide:hover .ap-slide-icon { transform: translate(-50%, -50%) scale(1.07); box-shadow: 0 12px 30px rgba(91,33,182,0.6); }
        .ap-slide-icon svg { width: 36px; height: 36px; display:block; }
        .ap-slide-cat {
          font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.12em; color: #9c86d6; margin-bottom: 0.45rem;
        }
        .ap-slide-title {
          font-size: 1.18rem; font-weight: 900; color: #fff;
          line-height: 1.15; margin-bottom: 0.55rem; letter-spacing: 0.01em;
        }
        .ap-slide-desc {
          font-size: 0.85rem; line-height: 1.5; color: rgba(231,222,247,0.78);
          display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .ap-slide, .ap-slide-icon { transition: none; }
        }

        /* Griglia progetti: 5 per riga su desktop, poi a capo. Responsive. */
        .ap-project-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 576px) {
          .ap-project-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 768px) {
          .ap-project-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1200px) {
          .ap-project-grid { grid-template-columns: repeat(5, 1fr); }
        }
        .ap-project-cell { min-width: 0; }

        /* Card progetto */
        .ap-project-card {
          overflow: hidden;
        }
        .ap-project-wip {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1.25rem;
          background: #fef9c3;
          color: #854d0e;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #fde047;
        }
        .ap-project-gh-date {
          font-size: 0.78rem;
          color: #888;
        }
        .ap-project-version {
          display: inline-block;
          padding: 0.18rem 0.55rem;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 0.03em;
        }
        /* Anteprima sito */
        .ap-project-preview {
          width: 100%;
          height: 220px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          overflow: hidden;
        }
        .ap-project-preview--wip {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #fef9c3 0%,
            #fef3c7 50%,
            #fef9c3 100%
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-project-cantiere {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: #854d0e;
          text-align: center;
          opacity: 0.6;
        }
        .ap-project-cantiere span {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .ap-project-screenshot {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ap-project-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #DCEFE2 0%, #EAF6EE 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ap-project-placeholder-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1F6B3D;
          text-align: center;
          padding: 1rem;
        }
        /* Miniatura SVG (progetti interni) */
        .ap-project-thumb {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #DCEFE2 0%, #EAF6EE 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
        }
        .ap-project-thumb svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .ap-project-card .it-card-title a {
          display: inline-flex;
          align-items: center;
          color: inherit;
        }

        /* Icone social nei contatti */
        .ap-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.45);
          color: #ffffff;
        }
        .ap-social:hover,
        .ap-social:focus-visible {
          background-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }
        .ap-social--sm {
          width: 40px;
          height: 40px;
        }

        /* Card competenze */
        .ap-skill-card {
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 8px;
          padding: 1.5rem;
        }

        /* Timeline curriculum */
        .ap-timeline {
          position: relative;
          padding-left: 2rem;
        }
        .ap-timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 6px;
          bottom: 6px;
          width: 2px;
          background: rgba(47, 125, 74, 0.28);
        }
        .ap-timeline-item {
          position: relative;
          padding-bottom: 2rem;
        }
        .ap-timeline-item:last-child {
          padding-bottom: 0;
        }
        .ap-timeline-item::before {
          content: "";
          position: absolute;
          left: -2rem;
          top: 4px;
          width: 16px;
          height: 16px;
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
        /* Variante "zona desideri" */
        .ap-timeline-item--wish::before {
          background: #f59e0b;
          border-color: #fef3c7;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
        }
        .ap-timeline-period--wish {
          color: #b45309;
        }
        .ap-wish-role {
          color: #92400e;
        }
        .ap-timeline-item--wish {
          opacity: 0.85;
        }

        /* Bottone documento allegato (apre il visore PDF) nella timeline CV */
        button.ap-cv-doc {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.9rem;
          background: rgba(47, 125, 74, 0.08);
          border: 1px solid rgba(47, 125, 74, 0.28);
          border-radius: 999px;
          color: #1F6B3D;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          appearance: none;
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        button.ap-cv-doc:hover,
        button.ap-cv-doc:focus-visible {
          background: #2F7D4A;
          border-color: #2F7D4A;
          color: #ffffff;
          outline: none;
        }

        /* Card hobby / passioni */
        .ap-interest-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.75rem 1rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 8px;
          text-align: center;
        }
        .ap-interest-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
        }
        .ap-interest-label {
          font-weight: 600;
        }

        /* Modale hobby / passioni */
        .ap-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 1000;
          cursor: pointer;
        }
        .ap-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          z-index: 1001;
          background: #ffffff;
          border-radius: 14px;
          max-width: 480px;
          width: calc(100% - 2rem);
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
        }
        .ap-modal-photo {
          height: 0;
          overflow: hidden;
          flex-shrink: 0;
          visibility: hidden;
          transition: height 0.2s ease;
        }
        .ap-modal-photo--ready {
          height: 220px;
          visibility: visible;
        }
        .ap-modal-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ap-modal-inner {
          padding: 1.5rem 2.5rem 2.5rem;
        }
        .ap-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          cursor: pointer;
          color: #444;
          z-index: 1;
          padding: 0;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .ap-modal-close:hover,
        .ap-modal-close:focus-visible {
          background-color: rgba(255, 255, 255, 1);
          color: #111;
        }
        .ap-modal-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          margin-bottom: 1.25rem;
        }
        .ap-modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F6B3D;
          margin-bottom: 1rem;
        }
        .ap-modal-body {
          font-size: 1rem;
          line-height: 1.75;
          color: #444;
          margin: 0;
          padding: 0;
        }
        /* Reset pulsante per le card interesse */
        button.ap-interest-card {
          cursor: pointer;
          appearance: none;
          font-family: inherit;
          font-size: inherit;
          width: 100%;
        }

        /* Visualizzatore CV (modale con anteprima PDF) */
        .ap-cv-modal {
          position: fixed;
          inset: 0;
          z-index: 1080;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(0.5rem, 2vw, 2rem);
        }
        .ap-cv-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(2px);
        }
        .ap-cv-dialog {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: min(940px, 100%);
          height: min(92vh, 100%);
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
        }
        .ap-cv-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.6rem 0.85rem;
          background: #2F7D4A;
          color: #ffffff;
        }
        .ap-cv-title {
          font-weight: 600;
          font-size: 0.95rem;
        }
        .ap-cv-frame {
          flex: 1 1 auto;
          width: 100%;
          min-height: 0;
          border: 0;
          background: #525659;
        }
        .ap-cv-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          background: transparent;
          color: #ffffff;
          transition: background-color 0.2s ease;
        }
        .ap-cv-close:hover,
        .ap-cv-close:focus-visible {
          background: rgba(255, 255, 255, 0.18);
        }
        .ap-cv-fallback {
          display: block;
          padding: 0.75rem 0.85rem;
          background: #FFF7CC;
          color: #1F6B3D;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          border-bottom: 1px solid #FDE68A;
        }
        .ap-cv-fallback:hover,
        .ap-cv-fallback:focus-visible {
          background: #FEF3A6;
          color: #155030;
        }

        /* ===== Ottimizzazioni mobile ===== */
        @media (max-width: 575.98px) {
          .ap-hero {
            min-height: 100vh;
            min-height: min(85svh, 640px);
            padding-bottom: 3rem;
          }
          .ap-hero h1.display-1 {
            font-size: clamp(2.25rem, 11vw, 3.25rem);
            max-width: 100% !important;
            line-height: 1.1;
          }
          .ap-hero .lead {
            font-size: 1rem;
          }
          .ap-hero .ap-kicker {
            font-size: 0.75rem;
          }

          /* Modali hobby/passioni */
          .ap-modal {
            border-radius: 12px;
          }
          .ap-modal-inner {
            padding: 1.25rem 1.25rem 1.75rem;
          }
          .ap-modal-title {
            font-size: 1.25rem;
          }
          .ap-modal-body {
            font-size: 0.95rem;
            line-height: 1.65;
          }
          .ap-modal-photo--ready {
            height: 180px;
          }
          .ap-modal-icon-wrap {
            width: 56px;
            height: 56px;
            margin-bottom: 1rem;
          }

          /* Touch target ≥ 44px */
          .ap-modal-close,
          .ap-cv-close {
            width: 44px;
            height: 44px;
          }

          /* CV modal: più spazio in basso per safe-area iOS */
          .ap-cv-dialog {
            height: min(94svh, 100%);
          }

          /* Header slim: più respiro tra le icone, niente strizzature */
          .it-header-slim-right-zone {
            gap: 0.5rem;
          }
          .it-header-slim-right-zone .me-3 {
            margin-right: 0 !important;
          }

          /* Titoli sezione: scala il display-5 per evitare strizzature */
          section h2.display-5 {
            font-size: clamp(1.75rem, 7vw, 2.5rem);
          }

          /* Card progetto: preview più compatta su mobile */
          .ap-project-preview {
            height: 180px;
          }
        }

        /* ═══════════════════════════════════════════════════════════════
           LAYOUT "vetrina" — composizione a sezioni con label, hero col
           ritratto, griglie di card e bio a due colonne. Palette neroverde.
           ═══════════════════════════════════════════════════════════════ */

        /* Contenitore comune */
        .ap-wrap {
          width: 100%;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }
        section[id] { scroll-margin-top: 84px; }

        /* Etichette di sezione */
        .ap-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #2F7D4A;
          margin: 0 0 0.5rem;
        }
        .ap-eyebrow--light { color: rgba(255, 255, 255, 0.85); }

        .ap-sec { padding: 4.5rem 0; background: #ffffff; }
        .ap-sec--alt { background: #F4FAF6; }
        .ap-sec-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
        }
        .ap-sec-title {
          font-size: clamp(1.9rem, 4vw, 2.6rem);
          font-weight: 800;
          line-height: 1.1;
          color: #14241b;
          margin: 0;
        }
        .ap-sec-sub { color: #5b6b62; margin: 0.6rem 0 0; font-size: 1rem; }
        .ap-sec-action {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #1F6B3D;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          white-space: nowrap;
        }
        .ap-sec-action:hover { color: #155030; }

        /* ── Header chiaro minimale ── */
        .ap-hdr {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: saturate(180%) blur(12px);
          -webkit-backdrop-filter: saturate(180%) blur(12px);
          border-bottom: 1px solid rgba(47, 125, 74, 0.12);
        }
        .ap-hdr--scrolled { box-shadow: 0 6px 20px rgba(16, 56, 32, 0.08); }
        .ap-hdr-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 64px;
        }
        .ap-hdr-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          color: #14241b;
          font-weight: 800;
          flex-shrink: 0;
        }
        .ap-hdr-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center 18%;
          border: 1px solid rgba(47, 125, 74, 0.25);
        }
        .ap-hdr-name { font-size: 1rem; white-space: nowrap; }
        .ap-hdr-local {
          font-size: 0.7rem;
          background: #198754;
          color: #fff;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
        }
        .ap-hdr-nav {
          display: flex;
          align-items: center;
          gap: 1.35rem;
          margin-left: auto;
        }
        .ap-hdr-link {
          color: #3a4a41;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 600;
        }
        .ap-hdr-link:hover { color: #1F6B3D; }
        .ap-hdr-right { display: flex; align-items: center; gap: 0.8rem; }
        .ap-hdr-social { display: flex; gap: 0.55rem; }
        .ap-hdr-social a { color: #3a4a41; display: inline-flex; }
        .ap-hdr-social a:hover { color: #1F6B3D; }
        .ap-hdr-cta {
          background: #103820;
          color: #ffffff !important;
          padding: 0.5rem 1.1rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .ap-hdr-cta:hover { background: #1F6B3D; }
        .ap-hdr-burger {
          display: none;
          background: none;
          border: none;
          color: #14241b;
          cursor: pointer;
          padding: 6px;
          line-height: 1;
        }

        /* ── Drawer mobile ── */
        .ap-drawer { position: fixed; inset: 0; z-index: 100; visibility: hidden; }
        .ap-drawer.open { visibility: visible; }
        .ap-drawer-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(16, 56, 32, 0.5);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .ap-drawer.open .ap-drawer-backdrop { opacity: 1; }
        .ap-drawer-panel {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: min(82vw, 340px);
          background: #103820;
          color: #fff;
          padding: calc(env(safe-area-inset-top) + 1.5rem) 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .ap-drawer.open .ap-drawer-panel { transform: translateX(0); }
        .ap-drawer-close {
          align-self: flex-end;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 6px;
          line-height: 1;
        }
        .ap-drawer-nav { display: flex; flex-direction: column; }
        .ap-drawer-nav a {
          color: #fff;
          text-decoration: none;
          font-size: 1.15rem;
          font-weight: 600;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ap-drawer-nav a:hover { color: rgba(255, 255, 255, 0.72); }
        .ap-drawer-contacts {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .ap-drawer-contacts a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.95rem;
        }
        .ap-drawer-contacts a:hover { color: #fff; }

        /* ── Hero a due colonne ── */
        .ap-hero2 {
          background: linear-gradient(180deg, #EAF6EE 0%, #F4FAF6 45%, #ffffff 100%);
          padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(3rem, 7vw, 6rem);
          overflow: hidden;
        }
        .ap-hero2-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: center;
        }
        .ap-hero2-main { min-width: 0; }
        .ap-hero2-title {
          font-size: clamp(2.2rem, 5.2vw, 3.6rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.01em;
          color: #14241b;
          margin: 0.4rem 0 1.1rem;
          overflow-wrap: anywhere;
        }
        .ap-hero2-accent { color: #2F7D4A; }
        .ap-hero2-lead {
          font-size: clamp(1.05rem, 1.6vw, 1.2rem);
          line-height: 1.6;
          color: #46564c;
          max-width: 44rem;
          margin: 0 0 1.6rem;
        }
        .ap-hero2-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.8rem; }
        .ap-hero2-quick { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: center; }

        /* Pillole */
        .ap-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.5rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
        }
        .ap-pill--solid { background: #103820; color: #fff; }
        .ap-pill--solid:hover { background: #1F6B3D; }
        .ap-pill--ghost { background: transparent; color: #14241b; border-color: rgba(47, 125, 74, 0.4); }
        .ap-pill--ghost:hover { background: #fff; border-color: #2F7D4A; color: #1F6B3D; }
        .ap-pill--light { background: #fff; color: #1F6B3D; }
        .ap-pill--light:hover { background: #eafaf0; }
        .ap-pill--lightghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, 0.5); }
        .ap-pill--lightghost:hover { background: rgba(255, 255, 255, 0.12); }

        /* Quick-link progetti nell'hero */
        .ap-quick {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.95rem 0.4rem 0.4rem;
          background: #fff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-radius: 999px;
          text-decoration: none;
          color: #14241b;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 2px 10px rgba(16, 56, 32, 0.05);
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s, color 0.15s;
        }
        .ap-quick:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16, 56, 32, 0.12);
          border-color: #2F7D4A;
          color: #1F6B3D;
        }
        .ap-quick-ic {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(47, 125, 74, 0.12);
          color: #1F6B3D;
          flex-shrink: 0;
        }
        .ap-quick-ic svg { width: 20px; height: 20px; }

        /* Ritratto hero */
        .ap-hero2-aside { display: flex; justify-content: center; }
        .ap-hero2-portrait {
          position: relative;
          width: 100%;
          max-width: 360px;
          border-radius: 22px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 30px 60px rgba(16, 56, 32, 0.22);
        }
        .ap-hero2-portrait img {
          width: 100%;
          height: auto;
          display: block;
          aspect-ratio: 3 / 4;
          object-fit: cover;
        }

        /* ── Griglia di card ── */
        .ap-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.6rem;
        }
        .ap-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          text-align: left;
          transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
        }
        .ap-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(16, 56, 32, 0.12);
          border-color: rgba(47, 125, 74, 0.3);
        }
        .ap-card--btn {
          cursor: pointer;
          appearance: none;
          font-family: inherit;
          width: 100%;
          padding: 0;
        }
        .ap-card-media {
          height: 200px;
          background: #f4faf6;
          border-bottom: 1px solid rgba(47, 125, 74, 0.12);
          overflow: hidden;
        }
        .ap-card-body {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          padding: 1.25rem 1.25rem 1.4rem;
        }
        .ap-card-titlerow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.6rem;
          margin-bottom: 0.3rem;
        }
        .ap-card-title { font-size: 1.15rem; font-weight: 800; color: #14241b; line-height: 1.2; }
        .ap-card-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2F7D4A;
          margin-bottom: 0.4rem;
        }
        .ap-card-date {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7c8a82;
          margin-bottom: 0.6rem;
        }
        .ap-card-desc { font-size: 0.92rem; line-height: 1.55; color: #56655c; margin: 0 0 1rem; }
        .ap-card-desc--clamp {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ap-card-link {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #1F6B3D;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .ap-card:hover .ap-card-link { color: #155030; }

        /* Badge stato */
        .ap-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
        }
        .ap-badge--active { background: rgba(47, 125, 74, 0.12); color: #1F6B3D; }
        .ap-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2F9E5A;
          box-shadow: 0 0 0 3px rgba(47, 158, 90, 0.18);
        }

        /* ── Bio a due colonne ── */
        .ap-bio {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: start;
        }
        .ap-bio-main { min-width: 0; }
        .ap-bio-p { font-size: 1.05rem; line-height: 1.7; color: #46564c; margin: 0 0 1rem; }
        .ap-bio-side { display: flex; flex-direction: column; gap: 1.2rem; }
        .ap-side-box {
          background: #fff;
          border: 1px solid rgba(47, 125, 74, 0.14);
          border-radius: 14px;
          padding: 1.25rem 1.35rem;
        }
        .ap-side-label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #2F7D4A;
          margin: 0 0 0.8rem;
        }
        .ap-side-based {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: #14241b;
          margin: 0;
        }
        .ap-side-skill { margin-bottom: 1rem; }
        .ap-side-skill:last-child { margin-bottom: 0; }
        .ap-side-skill-title {
          display: block;
          font-weight: 700;
          font-size: 0.9rem;
          color: #14241b;
          margin-bottom: 0.5rem;
        }
        .ap-side-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ap-side-edu-lead { color: #56655c; font-size: 0.92rem; line-height: 1.5; margin: 0 0 0.8rem; }
        .ap-side-edu { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
        .ap-side-edu li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.92rem;
          color: #14241b;
        }
        .ap-side-edu li svg { color: #2F7D4A; flex-shrink: 0; }

        /* ── Band contatti ── */
        .ap-contact {
          background: linear-gradient(135deg, #103820 0%, #1F6B3D 70%, #2F7D4A 120%);
          color: #fff;
          padding: clamp(3.5rem, 7vw, 5.5rem) 0;
        }
        .ap-contact-inner { text-align: center; max-width: 46rem; margin: 0 auto; }
        .ap-contact-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin: 0.3rem 0 1rem; }
        .ap-contact-lead {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 auto 2rem;
          max-width: 38rem;
        }
        .ap-contact-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: center; }

        /* ── Footer minimale ── */
        .ap-foot { background: #0c2a18; color: #fff; padding: 2.5rem 0 2rem; }
        .ap-foot-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }
        .ap-foot-name { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.2rem; }
        .ap-foot-role { margin: 0; opacity: 0.75; font-size: 0.92rem; }
        .ap-foot-social { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; }
        .ap-foot-social a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          transition: background 0.15s ease;
        }
        .ap-foot-social a:hover { background: rgba(255, 255, 255, 0.14); }
        .ap-foot-bottom {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 1.25rem;
          font-size: 0.82rem;
          opacity: 0.7;
        }

        /* ── Responsive ── */
        @media (max-width: 991.98px) {
          .ap-hdr-nav, .ap-hdr-social, .ap-hdr-cta { display: none; }
          .ap-hdr-burger { display: inline-flex; }
          .ap-hdr-right { margin-left: auto; }
          .ap-hero2-grid { grid-template-columns: 1fr; }
          .ap-cards { grid-template-columns: repeat(2, 1fr); }
          .ap-bio { grid-template-columns: 1fr; }
        }
        @media (max-width: 575.98px) {
          .ap-sec { padding: 3rem 0; }
          .ap-cards { grid-template-columns: 1fr; }
          .ap-card-media { height: 180px; }
          .ap-hero2-portrait { max-width: 280px; }
          .ap-foot-social { justify-content: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ap-card, .ap-quick, .ap-pill, .ap-drawer-panel, .ap-drawer-backdrop { transition: none; }
        }

      `}</style>
    </div>
  );
}
