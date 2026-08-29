import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { SiteLink as Link } from "./site/nav";
import { activateLocalMode } from "./utils/local";
import { isIOS } from "./utils/device";
import { lockBodyScroll, unlockBodyScroll } from "./utils/scrollLock";
import {
  SiGithub,
  SiReact,
  SiTypescript,
  SiVite,
  SiTailwindcss,
  SiFramer,
  SiReactrouter,
  SiSupabase,
  SiVercel,
  SiClaude,
} from "react-icons/si";
import {
  IcMenu,
  IcClose,
  IcArrowRight,
  IcArrowUpRight,
  IcExternal,
  IcDownload,
  IcEye,
  IcMail,
  IcHeart,
  IcStar,
  IcFolder,
  IcGrad,
  IcGlobe,
  IcPen,
  IcGame,
  IcVenn,
  IcRuler,
  IcUser,
  IcBook,
  IcCat,
  IcId,
} from "./site/homeIcons";
import { useHomeMotion } from "./site/homeMotion";
import { useNavPill, useNavAccent } from "./site/GlassMotion";
// Effetti "pronti" della home (React Bits) — vedi site/homeFx.tsx per il
// raccordo con tema, movimento ridotto e caricamento pigro.
import { AuroraBackdrop, ShinyBrandline, SparkGroup } from "./site/homeFx";
import {
  NowBuilding,
  MosaicCard,
  LiveKicker,
  CommitWall,
  TrustedDot,
} from "./site/homeLive";
import { EMAIL } from "./site/data";
import { PROJECTS } from "./site/projects";
import { LANGS } from "./i18n/langCore";
import { ArchivioExplorer } from "./archivio/Archivio";
import WhenVisible from "./site/WhenVisible";
/* La finestra video dei progetti in evidenza, con l’anello di tessere che le
   gira intorno. Viene dall’artboard «Finestra video mosaico» e ha preso il
   posto di site/SitePreview.tsx, che era usato solo qui ed è stato cancellato:
   la disciplina del video (parte a vista, si ferma uscendo, resta fermo con
   movimento ridotto) è passata dentro al componente nuovo. */
import VideoWindowMosaic from "./site/VideoWindowMosaic";
/* Il muro del curriculum, con il suo «Mostra tutto». In un file suo per la
   stessa ragione dello scaffale: lo stato qui rifaceva tutta la home. */
import CvWall from "./site/CvWall";
import SiteFooter from "./site/SiteFooter";
import "./home.css";

// ─────────────────────────────────────────────────────────────────────────────
// Home "piattaforma" — rifatta da zero sulla homepage di Supabase e adattata
// ai contenuti del sito. Ordine del <main>: hero a due colonne, griglia
// prodotti (cinque card), terminale clienti + fascia «lavoro fresco»,
// story-card dei due siti clienti, pannello archivio (il "dashboard"),
// switcher dello stack con codice vero, riga delle altre pagine, muro del
// curriculum, sezione open source e CTA finale. Tema chiaro/scuro nativo
// (vedi home.css), testi in inglese tradotti a runtime dal motore i18n.
// Header e menu sono inline qui dentro.
// ─────────────────────────────────────────────────────────────────────────────

const CV = [
  {
    period: "Sep 2018 — Jun 2021",
    title: "Lower secondary school — Mantua",
    role: "Istituto Redentore — «Beato Contardo Ferrini» Student House Foundation",
    desc: "A three-year programme with a solid grounding in Italian, mathematics, history, science and English. Development of study method and cross-disciplinary skills. Diploma achieved with merit.",
  },
  {
    period: "2021 — 2026",
    title: "«Carlo d'Arco» Technical Institute — Mantua",
    role: "CAT diploma — Construction, Environment and Territory, Class 5T",
    desc: "A five-year technical programme. Core subjects: architectural design and technical drawing (AutoCAD), topography and instrumental surveying, valuation and real-estate appraisal, site management, applied physics, mathematics and technical English. School code MNTL009017. Diploma achieved in 2026.",
  },
  {
    period: "2026 — present",
    title: "University of Modena and Reggio Emilia — «Enzo Ferrari» Eng. Dept.",
    role: "BSc in Construction and Land Management — Full-time",
    desc: "Enrolled in the professional bachelor's degree in Construction and Land Management, continuing on from the CAT technical track. Admission through the TOLC-LP entrance test, passed in July 2026.",
  },
  {
    period: "2019 — present",
    title: "Online sales — Vinted & Subito",
    role: "E-commerce — Commercial photography, Customer care",
    desc: "End-to-end management of the entire sales cycle on Vinted and Subito: product appraisal, market pricing, photography with a Canon EOS 4000D and iPhone 16 Pro, listing, communication with prospective buyers, negotiation, shipping and feedback handling. First sale in December 2019. A systematic personal activity since autumn 2024. Categories: clothing, film collectibles, tech devices (Apple Watch, Nintendo Switch, Flipper Zero).",
  },
  {
    period: "Dec 19, 2023",
    title: "Workers' Safety Course — Low Risk",
    role: "Certificate of attendance — LTO Mantua / FORMA, Lombardy Region (ATS Val Padana), 4 hours e-learning",
    desc: "Course compliant with the State–Regions Agreement of 21 December 2011 (Legislative Decree 81/08, Art. 37), aimed at office workers. Contents: electrical risk, falls from height, microclimate and lighting, display screens, work organisation and work-related stress, first-aid procedures, signage and fire safety (evacuation procedures). Certificate issued as a student by the Mantua Territorial Employability Laboratory.",
    pdf: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    pdfLabel: "Open certificate (PDF)",
  },
  {
    period: "Aug 11 — 25, 2024",
    title: "CES IELTS Test Centre — Dublin, Ireland",
    role: "General English Intensive — 26 lessons/week, Level C1",
    desc: "Intensive general English course at the CES centre on Dame Court, Dublin 2. Four weeks of full immersion focused on speaking, writing, reading and listening at advanced level (C1). Passed the IELTS exam at the end of the course. Independent exploration of the area: Howth, Balbriggan, North Bull Island, Bray, Greystones, Glendalough, Powerscourt Estate and Galway.",
    pdf: "/attestato-ces-ielts-c1.pdf",
    pdfLabel: "Open certificate (PDF)",
  },
  {
    period: "2024 — 2025",
    title: "Parish summer camp — SS. Donato e Vigilio Martiri Parish",
    role: "Volunteer youth leader — Rivalta sul Mincio, 6 weeks/year, 2 editions",
    desc: "Volunteer youth-leader service during the parish summer camp (Grest) — two consecutive editions (summer 2024 and 2025), for a total of twelve weeks. Direct responsibility for groups of children of different ages. Planning and running games, workshops and educational activities. Managing group dynamics, mediation, communication with parents. Reference: Fr. Andrea Grandi.",
  },
  {
    period: "Summer 2024",
    title: "CRED — Rodigo Secondary School",
    role: "Volunteer educational support — Municipality of Rodigo, 2 weeks",
    desc: "Educational support and youth activities during the Municipality of Rodigo's summer day camp. Assisting educators in running activities, managing groups, individual support for pupils and organising structured and free play.",
  },
  {
    period: "Jul 23 — Aug 1, 2025",
    title: "Paris, Le Havre, Rouen, Étretat — France",
    role: "Cultural trip",
    desc: "An itinerary across Normandy and Île-de-France: the cliffs of Étretat, the Gothic cathedral of Rouen, the historic port of Le Havre and the main museums and quarters of Paris.",
  },
  {
    period: "Dec 26 — 29, 2025",
    title: "Edinburgh — Scotland, United Kingdom",
    role: "Cultural trip",
    desc: "A visit to the Scottish capital over the Christmas holidays: the Old Town, Edinburgh Castle, the Royal Mile and the unique atmosphere of the historic closes at Christmas.",
  },
  {
    period: "Mar 22 — 23, 2026",
    title: "Polling clerk — Section 5, Rivalta sul Mincio",
    role: "Electoral operations — Municipality of Rodigo, Referendum",
    desc: "Official appointment as a polling clerk at electoral section no. 5 of Rivalta sul Mincio (Municipality of Rodigo) for the Referendum of 22–23 March 2026. Tasks: verifying voters' identity, managing voting operations, counting ballots, drafting reports and transmitting results. Paid appointment with a fee of €119.60.",
  },
  {
    period: "Apr 20, 2026",
    title: "Cascina Fontana — Website",
    role: "Web design & website development",
    desc: "Design and development of the official Cascina Fontana website. Analysis of the client's needs, definition of the information architecture and creation of a responsive, carefully designed interface optimised to present the company's products and services. Direct collaboration with the client to define the content. Stack: React, TypeScript, Tailwind CSS.",
    pin: true,
  },
  {
    period: "Apr 27, 2026",
    title: "Rivalta sul Mincio — Website",
    role: "Web design & website development",
    desc: "Design and development of the institutional and tourist website for Rivalta sul Mincio. Minimalist editorial design with careful typography and a warm palette. Rebuilt as nine pages of plain static HTML — no framework and no dependencies — with every figure about the village backed by a public OpenStreetMap dataset. Stack: HTML, CSS, JavaScript.",
    pin: true,
  },
  {
    period: "Jun 30 — Jul 1, 2026",
    title: "Film extra — «House of Gonzaga» TV series",
    role: "Background performer — Crowd scene, Piazza Broletto, Mantua",
    desc: "Background acting (figurazione) for the television series «House of Gonzaga», shot in the historic centre of Mantua. Part of the crowd in a night-time DJ-set scene filmed in Piazza Broletto, over two days (30 June – 1 July 2026) for around 10 hours on set.",
  },
  // --- wishlist ---
  {
    period: "✦ wish",
    title: "Found my own news outlet",
    role: "Independent journalism — Reportage, Publishing",
    desc: "To build a personal news medium: go out into the field and tell true stories without filters, with the same drive and courage I admire in those who stop at nothing to get the story.",
    wish: true,
  },
];

// Parsing della data d'inizio (formato inglese) per l'ordinamento del CV.
const EN_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
const EN_MONTH_RE = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

function parsePeriodStart(period: string): number {
  if (!period) return 0;
  const p = period.toLowerCase().trim();

  // "ongoing" — collaborazione di lunga data: la trattiamo come molto antica.
  if (p.includes("ongoing")) return new Date(1900, 0, 1).getTime();

  // "Summer YYYY" → 21 June YYYY.
  const summer = p.match(/summer\s+(\d{4})/);
  if (summer) return new Date(+summer[1], 5, 21).getTime();

  // Primo mese + giorno (il lookahead evita di scambiare le cifre dell'anno
  // per un giorno, es. "Sep 2018"); l'anno è il primo gruppo di 4 cifre.
  const md = p.match(new RegExp(`(${EN_MONTH_RE})\\s+(\\d{1,2})(?!\\d)`));
  const year = p.match(/(\d{4})/);
  if (md && year) return new Date(+year[1], EN_MONTHS[md[1]], +md[2]).getTime();

  // Solo anno (es. "2021 — present", "2024 — 2025").
  if (year) return new Date(+year[1], 0, 1).getTime();

  return 0;
}

const NAV = [
  { href: "#progetti", label: "Projects" },
  { href: "#archivio", label: "Archive" },
  { href: "/bio", label: "About", route: true },
  { href: "#curriculum", label: "Résumé" },
  { href: "/sostieni", label: "Support", route: true },
];

// Le altre pagine del sito, come riga di link e non più come scaffale a mezzo
// schermo: quattro nate per la scuola (le prime), poi il profilo lungo e la
// pagina di sostegno. Lo scaffale vero è ancora in site/PagesShelf.tsx.
const MORE_PAGES = [
  { title: "About Me", url: "/me-stesso", Icon: IcUser },
  { title: "PCTO", url: "/pcto", Icon: IcRuler },
  { title: "Dubliners", url: "/dubliners", Icon: IcBook },
  { title: "The Leopard", url: "/gattopardo", Icon: IcCat },
  { title: "Bio", url: "/bio", Icon: IcId },
  { title: "Support", url: "/sostieni", Icon: IcHeart },
];

// ── Sezione archivio: schede che filtrano il pannello dell'archivio ─────────
const ARCH_TABS = [
  {
    id: "featured",
    label: "Featured",
    Icon: IcStar,
    urls: ["/shooting", "https://rivaltasulmincio.it", "https://cascinafontana.xyz"],
  },
  {
    id: "maturita",
    label: "Exam 2026",
    Icon: IcGrad,
    urls: ["/me-stesso", "/pcto", "/dubliners", "/gattopardo"],
  },
  {
    id: "clienti",
    label: "Client sites",
    Icon: IcGlobe,
    urls: ["https://rivaltasulmincio.it", "https://cascinafontana.xyz"],
  },
];

// ── Sezione stack: un'icona per tecnologia, con snippet vero del progetto ───
interface StackEntry {
  id: string;
  name: string;
  Icon: (p: { size?: number }) => JSX.Element;
  url: string;
  file: string;
  lang: "ts" | "css" | "json" | "shell";
  code: string;
}

const STACK: StackEntry[] = [
  {
    id: "react",
    name: "React",
    Icon: (p) => <SiReact {...p} />,
    url: "https://react.dev",
    file: "src/app/App.tsx",
    lang: "ts",
    code: `import { useState, useEffect } from "react";

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  // La nav diventa "solida" dopo 60px di scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <Home nav={scrolled ? "solid" : "glass"} />;
}`,
  },
  {
    id: "typescript",
    name: "TypeScript",
    Icon: (p) => <SiTypescript {...p} />,
    url: "https://www.typescriptlang.org",
    file: "src/app/site/projects.tsx",
    lang: "ts",
    code: `export type ProjectKind = "game" | "page" | "site" | "doc" | "tool";

export interface Project {
  id: string;
  title: string;
  url: string;
  kind: ProjectKind;
  desc: string;
  tags?: string[];
  githubRepo?: string;
}

// UNICA fonte di verità per home e archivio
export const PROJECTS: Project[] = [
  { id: "trivia", title: "Trivia", url: "/trivia", kind: "game" /* … */ },
];`,
  },
  {
    id: "vite",
    name: "Vite",
    Icon: (p) => <SiVite {...p} />,
    url: "https://vite.dev",
    file: "vite.config.ts",
    lang: "ts",
    code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Il sito è una PWA: offline + icona installabile
    VitePWA({ registerType: "autoUpdate" }),
  ],
});`,
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    Icon: (p) => <SiTailwindcss {...p} />,
    url: "https://tailwindcss.com",
    file: "src/styles/tailwind.css",
    lang: "css",
    code: `@import "tailwindcss";

/* Tailwind 4: un solo import, niente config file.
   Scansiona i sorgenti e genera solo le classi
   usate davvero — il CSS resta piccolo. */

.card {
  @apply rounded-xl border p-6 shadow-sm;
}`,
  },
  {
    id: "motion",
    name: "Motion",
    Icon: (p) => <SiFramer {...p} />,
    url: "https://motion.dev",
    file: "src/app/trivia/Trivia.tsx",
    lang: "ts",
    code: `import { motion } from "motion/react";

<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.4 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
>
  <QuestionCard question={current} />
</motion.section>`,
  },
  {
    id: "router",
    name: "React Router",
    Icon: (p) => <SiReactrouter {...p} />,
    url: "https://reactrouter.com",
    file: "src/main.tsx",
    lang: "ts",
    code: `<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/trivia" element={<Trivia />} />
    <Route path="/archivio" element={<Archivio />} />
    <Route path="/instagram" element={<Instagram />} />
    {/* ogni pagina ha anche il suo sottodominio:
        trivia.albertopecchini.it, bio.… ecc. */}
  </Routes>
</BrowserRouter>`,
  },
  {
    id: "supabase",
    name: "Supabase",
    Icon: (p) => <SiSupabase {...p} />,
    url: "https://supabase.com",
    file: "src/app/trivia/leaderboardApi.ts",
    lang: "ts",
    code: `import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Classifica live di Trivia
const { data } = await supabase
  .from("trivia_scores")
  .select("nickname, score")
  .order("score", { ascending: false })
  .limit(10);`,
  },
  {
    id: "vercel",
    name: "Vercel",
    Icon: (p) => <SiVercel {...p} />,
    url: "https://vercel.com",
    file: "vercel.json",
    lang: "json",
    code: `{
  "rewrites": [
    { "source": "/d/:id", "destination": "/api/d?id=:id" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "crons": [
    { "path": "/api/cron-cleanup", "schedule": "0 3 * * *" }
  ]
}`,
  },
  {
    id: "claude",
    name: "Claude Code",
    Icon: (p) => <SiClaude {...p} />,
    url: "https://claude.com/claude-code",
    file: "terminal",
    lang: "shell",
    code: `$ claude "rifai da zero la home usando
  supabase.com come riferimento,
  adattandola ai miei testi"

● Leggo l'HTML salvato e i componenti…
● Riscrivo App.tsx, home.css e le icone

3 files changed, build ok`,
  },
];

// Mini-evidenziatore di sintassi per gli snippet (parole chiave, stringhe,
// commenti, numeri): quanto basta per il look da editor, senza librerie.
const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|export|default|const|let|var|function|return|await|async|new|type|interface|as|extends|if|else|apply)\b|(@[a-z-]+)|\b(\d+(?:\.\d+)?)\b/g;

function highlight(code: string, lang: StackEntry["lang"]): ReactNode[] {
  if (lang === "shell") {
    return code.split("\n").map((line, i) => (
      <span key={i}>
        {line.startsWith("$") ? (
          <>
            <span className="tk-s">$</span>
            <span className="tk-k">{line.slice(1)}</span>
          </>
        ) : line.startsWith("●") ? (
          <span className="tk-c">{line}</span>
        ) : (
          line
        )}
        {"\n"}
      </span>
    ));
  }
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? "tk-c" : m[2] ? "tk-s" : m[3] ? "tk-k" : m[4] ? "tk-f" : "tk-n";
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

// ── I progetti in evidenza ──────────────────────────────────────────────────
// Due, e sono i due siti fatti per clienti veri. `acc` è la tinta: da sola
// ritinge il campo di tessere, il caret e l'etichetta (blocco «La tavolozza»
// in home.css). Titolo, indirizzo e anteprima non si scrivono qui — si leggono
// da PROJECTS, che resta la fonte unica di verità.
//
// `kind` non dice più che tipo di sito è ma A CHE PUNTO È, ed è quel che resta
// della fascia «lavoro fresco» che stava più in su: quella diceva a mezzo
// schermo che rivaltasulmincio.it era appena tornato online, e una notizia
// tenuta in pagina invecchia. Ridotta a etichetta, la stessa cosa continua a
// essere vera. Che tipo di sito sia lo dice già `quote`, e con più sostanza.
//
// `lines` sono le righe che girano nel piede della finestra, ed è la parte
// VIVA del testo: tre dati a testa, e ognuno è un fatto verificabile, non un
// aggettivo. Una riga che gira per dire tre volte «bello» è un fastidio; una
// che gira per dire «nove pagine», «zero dipendenze», «dati OpenStreetMap» è
// una scheda tecnica che si legge da sola.
const STORIES: {
  id: string;
  kind: string;
  acc: string;
  quote: ReactNode;
  lines: string[];
}[] = [
  {
    id: "rivalta",
    kind: "Just shipped",
    acc: "verde",
    // La copy precedente descriveva la versione vecchia del sito (bento grid,
    // GSAP ScrollTrigger, Next.js). Quello online adesso è l'opposto: nove
    // pagine di HTML statico, e i numeri del paese non sono affermazioni ma un
    // estratto OpenStreetMap pubblicato lì accanto.
    quote: (
      <>
        Nine pages of plain static HTML — no framework, no dependencies — and{" "}
        <strong>every number backed by a dataset</strong> anyone can download.
      </>
    ),
    lines: ["nine static pages", "zero dependencies", "OpenStreetMap data"],
  },
  {
    id: "cascina-fontana",
    kind: "Live and maintained",
    acc: "ambra",
    quote: (
      <>
        A responsive, carefully designed interface built{" "}
        <strong>with the client, for the client</strong> — from brief to launch.
      </>
    ),
    lines: ["React and TypeScript", "responsive layout", "from brief to launch"],
  },
  // /instagram («Compare Two Lists») stava qui come terza scheda. È uscito: è
  // uno strumento, non un progetto commissionato, e questa sezione racconta
  // COME NASCONO i lavori per i clienti. Resta nell'archivio, dove sta con gli
  // altri strumenti.
];

// La mappa di Rivalta stava qui sotto, in coda ai progetti in evidenza. È
// passata alla bio («Based & trained»), dove il paese è già l'argomento: le
// coordinate e il collegamento a Google Maps vivono adesso in site/Bio.tsx.

// Qui c'era ProductCard: la scocca delle card della griglia prodotti — il vetro
// (.sb-panel) avvolto in SpotlightCard, l'alone che segue il puntatore. Se n'è
// andata con le sei tavole blueprint: la scheda del mosaico si porta la sua
// scocca dietro (site/homeLive.tsx, MosaicCard), ed è una lastra `--solid` —
// dietro a un mosaico che copre la card al vivo non c'è niente da sfocare, e
// l'alone del puntatore non ha più una superficie vuota su cui posarsi.

// I clienti, come output di un comando. Due nomi non riempiono un nastro che
// scorre — ma sono esattamente due righe di `ls`, e quello è un formato che di
// righe ne vuole poche. Il sito ha già la sua grammatica da terminale
// (.sb-codehead, .sb-term-line, .sb-cursor): qui si riusa quella.
const CLIENTS = [
  { host: "cascinafontana.xyz", url: "https://cascinafontana.xyz", dot: 0 },
  { host: "rivaltasulmincio.it", url: "https://rivaltasulmincio.it", dot: 0.9 },
];

export default function App() {
  const [localMode, setLocalMode] = useState(false);
  const [docOpen, setDocOpen] = useState<{ url: string; title: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [archTab, setArchTab] = useState(ARCH_TABS[0].id);
  const [tech, setTech] = useState(STACK[0].id);

  const sortedCV = useMemo(() => {
    const byDateDesc = (a: typeof CV[number], b: typeof CV[number]) =>
      parsePeriodStart(b.period) - parsePeriodStart(a.period);
    // Il muro apre con UNA fila a riposo: per data pura, in cima finivano la
    // comparsa in TV e lo scrutinio di seggio. Su una pagina che vende siti,
    // in testa ci vanno i due siti clienti (pin: true); poi tutto il resto per
    // data, e in fondo i desideri.
    const pinned = CV.filter((c) => (c as any).pin).sort(byDateDesc);
    const rest = CV.filter((c) => !(c as any).pin && !(c as any).wish).sort(byDateDesc);
    const wishes = CV.filter((c) => (c as any).wish);
    return [...pinned, ...rest, ...wishes];
  }, []);

  const activeTab = ARCH_TABS.find((t) => t.id === archTab) ?? ARCH_TABS[0];
  const activeTech = STACK.find((t) => t.id === tech) ?? STACK[0];

  // Le due cose care di questa pagina, tenute ferme finché non cambia davvero
  // quello da cui dipendono. Non è microottimizzazione: qui dentro c'è tutta la
  // home in un componente solo, quindi QUALUNQUE setState — la scheda
  // dell'archivio, la tecnologia dello stack, il menu che si apre — rifà anche
  // il resto. L'archivio è un esploratore di file da 1.300 righe, e
  // l'evidenziatore ritokenizza lo snippet carattere per carattere.
  const archivio = useMemo(
    () => <ArchivioExplorer key={activeTab.id} embedded onlyUrls={activeTab.urls} />,
    [activeTab],
  );
  const codice = useMemo(() => highlight(activeTech.code, activeTech.lang), [activeTech]);

  // Apre un documento: su telefono (<576px) direttamente in una nuova scheda —
  // il viewer PDF nativo è molto meno invasivo dell'iframe incorniciato; su
  // desktop resta l'anteprima in modale.
  const openDoc = (url: string, title: string) => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 575.98px)").matches) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setDocOpen({ url, title });
    }
  };

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [menuOpen]);

  // Arrivo con un hash nell'URL: riallinea lo scroll dopo il layout (i contenuti
  // lazy montano dopo e cambiano l'altezza), evitando il salto "parte in cima".
  useLayoutEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const jump = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    };
    jump();
    let tries = 0;
    const align = () => {
      jump();
      if (++tries < 6) timer = window.setTimeout(align, 120);
    };
    let timer = window.setTimeout(align, 120);
    return () => clearTimeout(timer);
  }, []);

  // Visualizzatore documenti PDF: blocco scroll + chiusura con Esc.
  useEffect(() => {
    if (!docOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDocOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [docOpen]);

  const closeMenu = () => setMenuOpen(false);

  const projectByI = (id: string) => PROJECTS.find((p) => p.id === id);

  // Regia GSAP della home (entrate, riflessi, contatori): vedi site/homeMotion.
  const homeRef = useRef<HTMLDivElement>(null);
  useHomeMotion(homeRef);

  // La pillola della nav sta qui e non in <GlassMotion /> (che è globale):
  // .sb-nav-link esiste solo in questa nav, e legandola al ciclo di vita di
  // App trova il DOM già montato senza sorvegliare i cambi di rotta.
  const navRef = useRef<HTMLElement>(null);
  useNavPill(navRef);

  // …e la tinta della nav, che è la stessa storia: la sezione a schermo le
  // passa il suo data-acc, così la barra in cima non resta l'unico pezzo
  // azzurro sopra una sezione verde.
  const navBarRef = useRef<HTMLElement>(null);
  useNavAccent(navBarRef);

  return (
    <div className="sb-home" ref={homeRef}>
      {/* Fondale continuo di TUTTA la pagina: è fisso alla finestra, quindi
          nessun bordo di sezione può tagliarlo a metà mentre si scorre. Fra
          una sezione e l'altra non c'è nessun confine. */}
      <div className="sb-bg" aria-hidden="true">
        {/* La banda di colore sta SOTTO la griglia: è la griglia sopra che la
            tiene attaccata al sito invece di farla sembrare un poster
            incollato. Il movimento del fondale non è qui: sono i due aloni di
            .sb-home, che seguono lo scroll e il puntatore. */}
        <AuroraBackdrop />

        {/* Le macchie: tre tavolozze sovrapposte che si danno il cambio
            scendendo. Stanno ai BORDI della finestra — il centro è mascherato,
            perché è dove sta il testo. Il colore lo scorre site/macchie.ts, il
            movimento è una keyframe in home.css. */}
        <div className="sb-blobs">
          <div className="sb-blobset sb-blobset--a">
            <span className="sb-blob sb-blob--1" />
            <span className="sb-blob sb-blob--2" />
            <span className="sb-blob sb-blob--3" />
          </div>
          <div className="sb-blobset sb-blobset--b">
            <span className="sb-blob sb-blob--1" />
            <span className="sb-blob sb-blob--2" />
            <span className="sb-blob sb-blob--3" />
          </div>
          <div className="sb-blobset sb-blobset--c">
            <span className="sb-blob sb-blob--1" />
            <span className="sb-blob sb-blob--2" />
            <span className="sb-blob sb-blob--3" />
          </div>
        </div>

        <span className="sb-bg-grid" />
      </div>

      {/* Skiplinks — requisito di accessibilità */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
        <a className="visually-hidden-focusable" href="#contatti">Skip to contacts</a>
      </div>

      {/* ── Nav ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`} ref={navBarRef}>
        <div className="sb-container sb-nav-inner">
          <a href="#home" className="sb-nav-brand" aria-label="Alberto Pecchini — back to top">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            {localMode ? <span className="sb-local">Local</span> : null}
          </a>

          <nav className="sb-nav-links" aria-label="Primary navigation" ref={navRef}>
            {/* Pillola di vetro che scivola sotto la voce puntata e, tolto il
                puntatore, torna sulla sezione a schermo. Decorativa: chi
                naviga da tastiera o con lo screen reader ha aria-current sul
                link, che è l'informazione vera. */}
            <span className="sb-nav-pill" aria-hidden="true" />
            {NAV.map((l) =>
              l.route ? (
                <Link key={l.href} to={l.href} className="sb-nav-link">{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} className="sb-nav-link">{l.label}</a>
              ),
            )}
          </nav>

          <div className="sb-nav-right">
            <a
              href="https://github.com/albertoxpecchini"
              target="_blank"
              rel="noreferrer noopener"
              className="sb-btn sb-btn--sm sb-btn--ghost"
              aria-label="GitHub"
              title="GitHub"
            >
              <SiGithub size={16} aria-hidden="true" />
              <span className="sb-btn--gh-label" translate="no">GitHub</span>
            </a>
            <a href="#contatti" className="sb-btn sb-btn--sm sb-btn--primary sb-btn--keep">Contact</a>
            <button
              className="sb-burger"
              type="button"
              aria-controls="sb-drawer"
              aria-expanded={menuOpen}
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
            >
              <IcMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu mobile (fuori da <header>: il backdrop-filter della nav farebbe
           da containing-block al position:fixed) ── */}
      <div className={`sb-menu ${menuOpen ? "open" : ""}`} id="sb-drawer" aria-hidden={!menuOpen}>
        <button className="sb-menu-scrim" type="button" aria-label="Close the menu" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu} />
        <div className="sb-menu-sheet" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="sb-menu-head">
            <span className="sb-nav-brand">
              <img src="/favicon.svg" alt="" width={28} height={28} />
              <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            </span>
            <button className="sb-burger" style={{ display: "inline-flex" }} type="button" aria-label="Close the menu" onClick={closeMenu}>
              <IcClose size={20} />
            </button>
          </div>

          <nav className="sb-menu-nav" aria-label="Navigation">
            {NAV.map((l) =>
              l.route ? (
                <Link key={l.href} to={l.href} onClick={closeMenu}>
                  <span>{l.label}</span><IcArrowUpRight size={18} />
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={closeMenu}>
                  <span>{l.label}</span><IcArrowUpRight size={18} />
                </a>
              ),
            )}
          </nav>

          <div className="sb-menu-foot">
            <a href="#contatti" className="sb-btn sb-btn--primary" onClick={closeMenu}>Contact</a>
            <a
              href="https://github.com/albertoxpecchini"
              target="_blank"
              rel="noreferrer noopener"
              className="sb-btn sb-btn--secondary"
            >
              <SiGithub size={16} aria-hidden="true" /> <span translate="no">GitHub</span>
            </a>
            <a className="sb-menu-mail" href={`mailto:${EMAIL}`}>
              <IcMail size={16} /> {EMAIL}
            </a>
          </div>
        </div>
      </div>

      <main id="main-content" className="sb-main">
        {/* ① Hero — titolo a sinistra, testo a destra (come Supabase).
             Nessun fondale suo: usa quello continuo della pagina.

             ── A che serve questa pagina, detto nel primo schermo ────────────
             Prima la hero diceva chi sono e cosa so fare, e poi lasciava un
             campo vuoto alto duecento pixel prima di qualsiasi cosa da
             guardare: sotto arrivava una fascia su UN cliente, e la griglia
             dei progetti cominciava a 1043px — cioè fuori dal primo schermo,
             su un portatile. Un portfolio che al primo sguardo non fa vedere
             niente di quello che ha fatto è un biglietto da visita.

             Adesso il primo schermo dice le due cose per cui il sito esiste —
             guarda i progetti, e conosci chi li ha fatti — e le dice con
             quello che ha: due bottoni che sono quelle due cose, tre numeri
             veri (progetti, siti online, commit) al posto del vuoto nella
             colonna di destra, e la griglia che comincia subito sotto e si
             affaccia dentro la piega. La fascia «lavoro fresco» è scesa dopo
             la griglia: è un cliente solo, e viene dopo il lavoro. */}
        <section id="home" className="sb-hero">
          <div className="sb-container">
            <div className="sb-hero-grid">
              <h1 className="sb-hero-title">
                <span translate="no">Alberto Pecchini</span>
                <ShinyBrandline text="Surveyor & Website Developer" className="sb-brandline" />
              </h1>
              <div className="sb-hero-copy">
                <p>
                  <strong>This is my portfolio.</strong> Client websites —{" "}
                  <strong translate="no">Rivalta sul Mincio</strong>,{" "}
                  <strong translate="no">Cascina Fontana</strong> — and every page of this
                  one, designed and built end to end with React and TypeScript.
                </p>
                {/* I tre numeri sono la sola cosa verificabile del primo
                    schermo, e nessuno è scritto a mano: i clienti li conta la
                    lista dei domini, i progetti l'elenco, le lingue il
                    pacchetto i18n. Ora dicono le cose che un cliente pesa —
                    consegne vere e la cura — invece di «421 commit», che a chi
                    deve comprare un sito non dice niente. Salgono arrivando a
                    vista: [data-count-to] è la stessa regia dei contatori del
                    resto della home (site/homeMotion.ts ②). */}
                <ul className="sb-hero-stats">
                  <li>
                    <b data-count-to={CLIENTS.length}>0</b>
                    <span>client sites, live</span>
                  </li>
                  <li>
                    <b data-count-to={PROJECTS.filter((p) => p.kind !== "doc").length}>0</b>
                    <span>projects shipped end to end</span>
                  </li>
                  <li>
                    <b data-count-to={LANGS.length}>0</b>
                    <span>languages, hand-translated</span>
                  </li>
                </ul>
              </div>
            </div>
            <SparkGroup className="sb-hero-actions">
              <a href="#progetti" className="sb-btn sb-btn--primary">Explore my projects</a>
              <Link to="/bio" className="sb-btn sb-btn--secondary">Get to know me</Link>
            </SparkGroup>
            <NowBuilding />
          </div>
        </section>

        {/* ② Griglia — cinque card, cinque tinte, una riga di testo l'una.

            Ogni card porta il suo accento in --sb-accent, e da lì scende su
            tutto — icona, disegno, spunte, alone. Le tinte stanno in home.css,
            blocco «La tavolozza».

            Cosa dice la griglia: siti (la card grande), i due clienti veri,
            lo sviluppo con l'AI, la fotografia e l'area geometra/università.
            Le auto e la loro sezione 3D sono uscite: non c'entravano niente
            con il lavoro che questa pagina vende. La griglia era «una grande
            più cinque» a sei totali; adesso è «una grande più quattro», e la
            seconda fila si ripartisce in due mezzi da 6 colonne (home.css).

            Il visual di ogni card è lo stesso componente <Mosaic>, cambiato di
            tema (traiettoria + modulo) e di accento — vedi la nota in testa a
            site/homeLive.tsx. L'accento di ogni card viene dal canvas «Sistema
            blueprint tecnico animato», Turno 3: archivio→viola, siti→blu,
            IA→ambra, foto→rosa, geometra→verde. */}
        <section id="progetti" className="sb-container sb-products" aria-label="What I do">
          {/* ── Prima riga: due schede larghe ─────────────────────────────── */}

          {/* I due clienti veri, con il loro nome — la scheda blu */}
          <a href="#lavori" className="sb-card" data-acc="blu">
            <MosaicCard topic="web" />
          </a>

          {/* Archivio progetti — la scheda viola */}
          <Link to="/archivio" className="sb-card" data-acc="viola">
            <MosaicCard topic="archive" />
          </Link>

          {/* ── Seconda riga: tre schede ──────────────────────────────────── */}

          {/* Sviluppo assistito dall'AI — la scheda ambra */}
          <a
            href="https://github.com/albertoxpecchini"
            target="_blank"
            rel="noreferrer noopener"
            className="sb-card"
            data-acc="ambra"
          >
            <MosaicCard topic="claude" />
          </a>

          {/* Fotografia — la scheda rosa */}
          <Link to="/shooting" className="sb-card" data-acc="rosa">
            <MosaicCard topic="photo" />
          </Link>

          {/* Università e area tecnica — la scheda verde */}
          <Link to="/pcto" className="sb-card" data-acc="verde">
            <MosaicCard topic="autocad" />
          </Link>
        </section>

        {/* Coda della griglia: tagline + clienti */}
        <div className="sb-container sb-prodfoot">
          <p className="sb-prodfoot-tag">
            <strong>One hand alone, from the beginning to the end.</strong> Drawing, code,
            words and the setting to work — one single body.
          </p>
          <span className="sb-trusted-label">Trusted by real clients</span>
          {/* data-no-i18n su tutto il blocco: è output di un comando, e il sito
              tratta così anche gli altri pannelli di codice (vedi .sb-codehead
              nella sezione «Built with»). I nomi a dominio non si traducono. */}
          <div className="sb-trusted" data-no-i18n>
            <div className="sb-panel">
              <div className="sb-panel-inner">
                <div className="sb-codehead">
                  <i /><i /><i />
                  <span>clients — bash</span>
                </div>
                <div className="sb-trust-out">
                  <p className="sb-term-line">
                    <span className="p">$</span>
                    <span>ls ./clients --status</span>
                  </p>
                  {CLIENTS.map((c) => (
                    <a
                      key={c.host}
                      className="sb-trust-row"
                      href={c.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span className="sb-trust-host">{c.host}</span>
                      <span className="sb-trust-live">
                        <TrustedDot /> LIVE
                      </span>
                    </a>
                  ))}
                  <p className="sb-term-line">
                    <span className="c">#</span>
                    <span className="c">2 shipped, 2 online</span>
                  </p>
                  <p className="sb-term-line">
                    <span className="p">$</span>
                    <i className="sb-cursor" aria-hidden="true" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Qui stava la fascia «lavoro fresco»: mezzo schermo per dire che
            rivaltasulmincio.it era tornato online, col video del sito che
            girava in loop. Era vera quando è stata scritta, e una notizia che
            resta in pagina diventa una notizia vecchia. Il sito non è sparito:
            sta qui sotto, fra i progetti in evidenza, che è il posto dove le
            cose durano. Il componente e il suo foglio sono stati cancellati; i
            video no, li usa l'anteprima. */}

        {/* Story-card dei progetti di punta — spostata qui, subito dopo la
            fascia «lavoro fresco»: griglia (cosa faccio) → terminale clienti e
            «appena pubblicato» (è vero) → QUESTA (ecco come sono fatti i due
            siti veri). Prima stava all'80% dello scroll, dopo archivio, stack
            e scaffale — cioè il blocco che vende di più era l'ultimo a
            comparire. */}
        {/* ③ I progetti in evidenza.

             Com'era: tre story-card affiancate, ognuna con una miniatura del
             sito, un titolo, un indirizzo, una citazione e tre etichette. Il
             risultato era una griglia di riquadri parlanti in cui l'anteprima —
             cioè la sola cosa che dimostra qualcosa — era il pezzo più piccolo.

             Com'è: DUE finestre grandi, una per cliente vero, e l'anteprima è
             la sezione. Ognuna poggia su un campo di tessere della tinta da cui
             sbuca sui quattro lati: è il vocabolario delle cinque schede della
             griglia prodotti — tessere, una tinta sola — portato su un oggetto
             diverso, così le due sezioni si leggono come due capitoli e non
             come due siti. Il campo è fermo, e la finestra è una lastra come
             tutte le altre della pagina: il mosaico qui fa da pavimento, non
             da cornice.

             Il movimento è tutto nel testo, tranne una banda che attraversa il
             video una volta per giro. Il sopratitolo della sezione gira sui tre
             modi in cui un lavoro nasce; il piede di ogni finestra gira su tre
             dati veri di quel progetto. */}
        <section id="lavori" className="sb-section sb-works" aria-label="Featured work" data-acc="verde">
          <div className="sb-container">
            <div className="sb-works-head">
              <div className="sb-works-title">
                <LiveKicker />
                {/* Il titolo prende la banda di luce delle brandline: è la
                    stessa che passa su «Surveyor & Website Developer» nella
                    hero e su «Let's talk.» nella CTA, e la porta il puntatore —
                    attraversi la pagina e la riga si illumina al tuo passaggio. */}
                <h3><ShinyBrandline text="How the featured projects are built" /></h3>
              </div>
              <Link to="/archivio" className="sb-btn sb-btn--sm sb-btn--secondary">More in the archive</Link>
            </div>

            <div className="sb-works-grid">
              {STORIES.map((s, i) => {
                const p = projectByI(s.id);
                if (!p) return null;
                const external = !p.url.startsWith("/");
                // L'indirizzo com'è scritto sulla barra: senza schema per i
                // siti veri, com'è per le pagine di casa.
                const host = external ? p.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : p.url;
                const inner = (
                  <>
                    <VideoWindowMosaic
                      src={p.previewVideo}
                      poster={p.previewPoster}
                      img={p.previewImg}
                      thumb={p.thumb}
                      url={host}
                      lines={s.lines}
                      alt={
                        p.previewVideo
                          ? `Screen recording: a scroll through the ${p.title} website`
                          : `Screenshot of ${p.title}`
                      }
                      loop={11}
                      // Mezzo giro di scarto fra le due: due finestre che
                      // pulsano all'unisono sono una finestra sola grande.
                      phase={i * 0.5}
                    />
                    <div className="sb-works-say">
                      <span className="sb-works-kind">
                        <i className="sb-chip-dot sb-chip-dot--sm" aria-hidden="true" />
                        {s.kind}
                      </span>
                      <span className="sb-works-name" translate="no">{p.title}</span>
                      <p className="sb-works-quote">{s.quote}</p>
                      <span className="sb-works-foot">
                        Open the project {external ? <IcExternal size={14} /> : <IcArrowRight size={14} />}
                      </span>
                    </div>
                  </>
                );
                return external ? (
                  <a
                    key={s.id}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="sb-work"
                    data-acc={s.acc}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={s.id} to={p.url} className="sb-work" data-acc={s.acc}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* La fascia «fotografia» stava qui: un intero schermo su ritratti
             amatoriali, con la copy che lo diceva pure («as an amateur, and
             with no illusions about it»). Su una pagina che vende siti era un
             passo indietro. Il mestiere resta detto nella card «Fotografia»
             della griglia, che porta a /shooting per chi vuole i numeri. */}

        {/* ④ Archivio — la "dashboard": il pannello dell'archivio incorporato */}
        <section id="archivio" className="sb-section" data-acc="blu">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3>Browse the featured projects without leaving the home</h3>
              <p>
                The archive is a small file browser: open the folders, star your
                favourites, check the properties and download the sources as ZIPs.
              </p>
            </div>

            <div className="sb-tabs" role="tablist" aria-label="Archive filters">
              {ARCH_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={archTab === t.id}
                  className="sb-tab"
                  onClick={() => setArchTab(t.id)}
                >
                  <t.Icon size={15} /> {t.label}
                </button>
              ))}
            </div>

            <div className="sb-arch-frame">
              <div className="sb-panel">
                <div className="sb-panel-inner">
                  {archivio}
                </div>
              </div>
            </div>

            <div className="sb-arch-cta">
              <Link to="/archivio" className="sb-link">
                Open the full archive <IcArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ⑤ Stack — "Built with …" con switcher e codice vero */}
        <section className="sb-section" aria-label="Stack" data-acc="viola">
          <div className="sb-container">
            <div className="sb-stack-grid">
              <div>
                <h3 className="sb-stack-title">
                  {/* key sul nome: cambiando framework React monta uno <span>
                      nuovo, e il lampo di luce di .tech (che è un'animazione a
                      colpo singolo, non più un ciclo) riparte da sé. */}
                  Built with <span className="tech" translate="no" key={activeTech.name}>{activeTech.name}</span>
                </h3>
                <div className="sb-techrow" role="tablist" aria-label="Technologies">
                  {STACK.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={tech === t.id}
                      aria-label={t.name}
                      title={t.name}
                      className="sb-tech"
                      onClick={() => setTech(t.id)}
                    >
                      <t.Icon size={22} />
                    </button>
                  ))}
                </div>
                <p className="sb-stack-note">
                  The whole site runs on this stack — no CMS, no page builders. Real snippets
                  from the repository, one per technology.
                </p>
                <a
                  className="sb-link"
                  href={activeTech.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span>Read the docs</span>
                  <span translate="no">— {activeTech.name}</span>
                  <IcArrowRight size={15} />
                </a>
              </div>

              <div className="sb-panel">
                <div className="sb-panel-inner">
                  <div className="sb-codehead" data-no-i18n>
                    <i /><i /><i />
                    <span>{activeTech.file}</span>
                  </div>
                  <pre className="sb-code"><code>{codice}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Le altre pagine del sito. Era uno scaffale a mezzo schermo che
            metteva in vetrina quattro pagine d'esame di Maturità — craft, ma
            «studente», e proprio dove la pagina deve dire «assumimi». Adesso è
            una riga: chi vuole ci va, chi cerca un sito non ci inciampa. Lo
            scaffale (site/PagesShelf.tsx) resta nel repo, non più montato. */}
        <section className="sb-section" aria-label="Pages" data-acc="viola">
          <div className="sb-container">
            <div className="sb-splithead">
              <div>
                <h3>Other pages on this site</h3>
                <p>
                  Built with the same hand and the same design system — some for
                  school, some to keep the lights on.
                </p>
              </div>
              <Link to="/archivio" className="sb-btn sb-btn--sm sb-btn--secondary">View them all</Link>
            </div>
            <div className="sb-morelinks">
              {MORE_PAGES.map((p) => (
                <Link key={p.url} to={p.url} className="sb-btn sb-btn--sm sb-btn--ghost">
                  <p.Icon size={15} /> <span>{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ⑥ Curriculum — muro di card (≈ muro community) */}
        <section id="curriculum" className="sb-section" aria-label="Résumé" data-acc="ambra">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3>Education &amp; experience</h3>
              <p>
                The full story behind the CV — school, work, volunteering, travel and one wish.
              </p>
            </div>

            {/* Il CV non è più un PDF allegato: è la pagina /cv, scritta nelle
                quattro lingue del sito. «Download» apre la stessa pagina con
                ?print, che fa partire la stampa — il PDF È quella pagina. */}
            <div className="sb-cv-actions">
              <Link to="/cv" className="sb-btn sb-btn--primary">
                <IcEye size={16} /> View CV
              </Link>
              <Link to="/cv?print" className="sb-btn sb-btn--secondary">
                <IcDownload size={16} /> Download (PDF)
              </Link>
            </div>

            {/* Sedici schede: a riposo se ne vede una fila, il resto sfocato
                sotto la sfumatura. Stato e collasso stanno in site/CvWall.tsx
                — qui rifarebbero anche il muro dei commit e l'archivio. */}
            <CvWall items={sortedCV as any} onOpenDoc={openDoc} />
          </div>
        </section>


        {/* ⑦ Open source */}
        <section className="sb-section" aria-label="Open source" data-acc="viola">
          <div className="sb-container">
            <div className="sb-open">
              <div>
                <h2>Open source from day one</h2>
                <p>
                  This site is built in the open: code, content and even the AI workflow live
                  in one public repository. <strong>Read it, download any project as a ZIP,
                  reuse what helps you.</strong>
                </p>
                <p>
                  One design system across the whole site, one repository, nothing hidden —
                  and the archive lets you take the sources home.
                </p>
                <a
                  href="https://github.com/albertoxpecchini/AP"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="sb-btn sb-btn--secondary"
                >
                  <SiGithub size={16} aria-hidden="true" /> View on GitHub
                </a>
              </div>

              <div className="sb-panel">
                <div className="sb-panel-inner sb-ghcard-inner">
                  <div className="sb-ghcard-id">
                    <img src="/alberto-pecchini-square.jpg" alt="Portrait of Alberto Pecchini" width={56} height={56} />
                    <div>
                      <div className="sb-ghcard-name" translate="no">Alberto Pecchini</div>
                      <div className="sb-ghcard-handle" translate="no">@albertoxpecchini</div>
                    </div>
                  </div>
                  <p className="sb-ghcard-bio">
                    Surveyor &amp; website developer — Mantua, Italy. CAT diploma, now
                    studying Construction and Land Management.
                  </p>
                  <a
                    href="https://github.com/albertoxpecchini/AP"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="sb-ghcard-repo"
                    data-no-i18n
                  >
                    <IcFolder size={15} /> albertoxpecchini/AP
                    <span className="badge">this site</span>
                  </a>
                </div>
              </div>

              {/* Il muro dei commit: fondale della metà destra, sotto al
                  pannello. Va per ULTIMO fra i figli di .sb-open — da lg in su
                  esce dal flusso e l'ordine non conta, sotto resta una colonna
                  sola e finisce in fondo, che è dove Supabase lo mette da
                  mobile. Montato all'ingresso in scena e non prima: sono 1.100
                  rect, e l'accensione a cascata deve partire quando la sezione
                  si vede, non mentre è ancora due schermate più giù. Margine 0
                  perché qui non c'è niente da precaricare — a differenza del
                  garage 3D, che è il caso per cui WhenVisible era nato. */}
              <WhenVisible className="sb-cwall-wrap" rootMargin="0px">
                <CommitWall />
              </WhenVisible>
            </div>
          </div>
        </section>

        {/* ⑧ CTA finale */}
        <section id="contatti" className="sb-section sb-cta">
          <div className="sb-container">
            <h2>
              Have a project in mind?
              <span className="sb-brandline">
                <ShinyBrandline text="Let's talk." />
                <i className="sb-caret" aria-hidden="true" />
              </span>
            </h2>
            <p>For collaborations, web projects or simply to exchange ideas — I'm available.</p>
            <SparkGroup className="sb-cta-actions">
              <a href={`mailto:${EMAIL}`} className="sb-btn sb-btn--primary"><IcMail size={16} /> Email me</a>
              <Link to="/sostieni" className="sb-btn sb-btn--secondary"><IcHeart size={16} /> Support me</Link>
            </SparkGroup>
          </div>
        </section>
      </main>

      {/* ── Footer condiviso: lo stesso, tradotto, su ogni pagina ── */}
      <SiteFooter />

      {/* Visualizzatore PDF generico (CV + attestati) */}
      {docOpen && (
        <div className="ap-cv-modal" role="dialog" aria-modal="true" aria-label={docOpen.title}>
          <div className="ap-cv-backdrop" onClick={() => setDocOpen(null)} aria-hidden="true" />
          <div className="ap-cv-dialog">
            <div className="ap-cv-bar">
              <span className="ap-cv-title">{docOpen.title}</span>
              {/* Pulsanti del design system (.sb-btn) al posto di quelli di
                  Bootstrap Italia: era l'ultimo pezzo della home fuori dai
                  token, e teneva in piedi da solo un CSS+JS interi. */}
              <div className="ap-cv-actions">
                <a href={docOpen.url} target="_blank" rel="noreferrer noopener" className="sb-btn sb-btn--sm sb-btn--secondary ap-cv-newtab">
                  <IcExternal size={15} /> New tab
                </a>
                <a href={docOpen.url} download className="sb-btn sb-btn--sm sb-btn--primary">
                  <IcDownload size={15} /> Download
                </a>
                <button type="button" className="ap-cv-close" onClick={() => setDocOpen(null)} aria-label="Close the document preview">
                  <IcClose size={20} />
                </button>
              </div>
            </div>
            <a href={docOpen.url} target="_blank" rel="noreferrer noopener" className="ap-cv-fallback">
              On mobile the PDF preview may not load — tap here to open the file →
            </a>
            <iframe className="ap-cv-frame" src={`${docOpen.url}#view=FitH&toolbar=1&navpanes=0`} title={`Preview: ${docOpen.title}`} />
          </div>
        </div>
      )}
    </div>
  );
}
