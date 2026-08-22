import { useState, useEffect, useLayoutEffect, useMemo, useRef, lazy, Suspense } from "react";
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
  IcFile,
  IcMail,
  IcHeart,
  IcCheck,
  IcStar,
  IcFolder,
  IcGrad,
  IcGlobe,
  IcSparkle,
  IcCode,
  IcPen,
  IcGame,
  IcVenn,
  IcCompass,
  IcRuler,
  IcUser,
  IcBook,
  IcCat,
  IcId,
  IcPin,
  IcCamera,
  IcAperture,
  IcCar,
} from "./site/homeIcons";
import { useHomeMotion } from "./site/homeMotion";
import { useNavPill, useNavAccent } from "./site/GlassMotion";
// Effetti "pronti" della home (React Bits) — vedi site/homeFx.tsx per il
// raccordo con tema, movimento ridotto e caricamento pigro.
import { AuroraBackdrop, ShinyBrandline, SparkGroup } from "./site/homeFx";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import {
  NowBuilding,
  BlueprintPage,
  PrismFan,
  GlobeOrbit,
  IrisPlate,
  GaugePlate,
  ContourPlate,
  CommitWall,
  TrustedDot,
} from "./site/homeLive";
import { EMAIL } from "./site/data";
import { PROJECTS } from "./site/projects";
// Il manifesto PUBBLICO degli shooting: date, luoghi e conteggi, niente foto.
// La sezione in fondo alla home legge di qui i suoi numeri, così restano veri
// anche dopo il prossimo `npm run scatti`.
import { SESSIONI } from "./shooting/sessioni";
import { ArchivioExplorer } from "./archivio/Archivio";
const RivaltaMap = lazy(() => import("./site/RivaltaMap"));
/* Stessa cura della mappa: la geometria delle tre auto e il loro renderer non
   c'entrano niente con il primo schermo, e stanno in fondo alla pagina. Lazy +
   WhenVisible = si scaricano quando ci si avvicina, e chi non arriva in fondo
   non li paga. */
const DreamGarage = lazy(() => import("./site/dreamCars"));
import WhenVisible from "./site/WhenVisible";
/* Fascia temporanea: il sito di Rivalta appena tornato online, col video che
   gira in loop. Si spegne con l'interruttore in cima a site/FreshWork.tsx. */
import FreshWork from "./site/FreshWork";
import SiteFooter from "./site/SiteFooter";
import "./home.css";

// ─────────────────────────────────────────────────────────────────────────────
// Home "piattaforma" — rifatta da zero sulla homepage di Supabase e adattata
// ai contenuti del sito: nav sottile, hero a due colonne, griglia prodotti,
// pannello archivio (il "dashboard"), switcher dello stack con codice vero,
// griglia delle pagine, story-card dei progetti, muro del curriculum, sezione
// open source e CTA finale. Tema chiaro/scuro nativo (vedi home.css), testi in
// inglese come il resto della home. Header e menu sono inline qui dentro.
// ─────────────────────────────────────────────────────────────────────────────

const CV = [
  {
    period: "Sep 2018 — Jun 2021",
    title: "Lower secondary school — Mantua",
    role: "Istituto Redentore · «Beato Contardo Ferrini» Student House Foundation",
    desc: "A three-year programme with a solid grounding in Italian, mathematics, history, science and English. Development of study method and cross-disciplinary skills. Diploma achieved with merit.",
  },
  {
    period: "2021 — 2026",
    title: "«Carlo d'Arco» Technical Institute — Mantua",
    role: "CAT diploma · Construction, Environment and Territory · Class 5T",
    desc: "A five-year technical programme. Core subjects: architectural design and technical drawing (AutoCAD), topography and instrumental surveying, valuation and real-estate appraisal, site management, applied physics, mathematics and technical English. School code MNTL009017. Diploma achieved in 2026.",
  },
  {
    period: "2026 — present",
    title: "University of Modena and Reggio Emilia — «Enzo Ferrari» Eng. Dept.",
    role: "BSc in Construction and Land Management · Full-time",
    desc: "Enrolled in the professional bachelor's degree in Construction and Land Management, continuing on from the CAT technical track. Admission through the TOLC-LP entrance test, passed in July 2026.",
  },
  {
    period: "2019 — present",
    title: "Online sales — Vinted & Subito",
    role: "E-commerce · Commercial photography · Customer care",
    desc: "End-to-end management of the entire sales cycle on Vinted and Subito: product appraisal, market pricing, photography with a Canon EOS 4000D and iPhone 16 Pro, listing, communication with prospective buyers, negotiation, shipping and feedback handling. First sale in December 2019. A systematic personal activity since autumn 2024. Categories: clothing, film collectibles, tech devices (Apple Watch, Nintendo Switch, Flipper Zero).",
  },
  {
    period: "ongoing",
    title: "Family farm — Rivalta sul Mincio",
    role: "Agricultural operations · Logistics · Team coordination",
    desc: "Ongoing collaboration in the family farming business. Tasks: plant care and maintenance (watering, pruning of various types and sizes), transport of materials and equipment on a tractor with trailer, hay harvesting from permanent meadow, coordinating operations with the team during intensive work, logistical support and assistance with transfers. Autonomous handling of farm equipment and on-field problem-solving.",
  },
  {
    period: "Dec 19, 2023",
    title: "Workers' Safety Course — Low Risk",
    role: "Certificate of attendance · LTO Mantua / FORMA · Lombardy Region (ATS Val Padana) · 4 hours e-learning",
    desc: "Course compliant with the State–Regions Agreement of 21 December 2011 (Legislative Decree 81/08, Art. 37), aimed at office workers. Contents: electrical risk, falls from height, microclimate and lighting, display screens, work organisation and work-related stress, first-aid procedures, signage and fire safety (evacuation procedures). Certificate issued as a student by the Mantua Territorial Employability Laboratory.",
    pdf: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    pdfLabel: "Open certificate (PDF)",
  },
  {
    period: "Aug 11 — 25, 2024",
    title: "CES IELTS Test Centre — Dublin, Ireland",
    role: "General English Intensive · 26 lessons/week · Level C1",
    desc: "Intensive general English course at the CES centre on Dame Court, Dublin 2. Four weeks of full immersion focused on speaking, writing, reading and listening at advanced level (C1). Passed the IELTS exam at the end of the course. Independent exploration of the area: Howth, Balbriggan, North Bull Island, Bray, Greystones, Glendalough, Powerscourt Estate and Galway.",
    pdf: "/attestato-ces-ielts-c1.pdf",
    pdfLabel: "Open certificate (PDF)",
  },
  {
    period: "2024 — 2025",
    title: "Parish summer camp · SS. Donato e Vigilio Martiri Parish",
    role: "Volunteer youth leader · Rivalta sul Mincio · 6 weeks/year · 2 editions",
    desc: "Volunteer youth-leader service during the parish summer camp (Grest) — two consecutive editions (summer 2024 and 2025), for a total of twelve weeks. Direct responsibility for groups of children of different ages. Planning and running games, workshops and educational activities. Managing group dynamics, mediation, communication with parents. Reference: Fr. Andrea Grandi.",
  },
  {
    period: "Summer 2024",
    title: "CRED · Rodigo Secondary School",
    role: "Volunteer educational support · Municipality of Rodigo · 2 weeks",
    desc: "Educational support and youth activities during the Municipality of Rodigo's summer day camp. Assisting educators in running activities, managing groups, individual support for pupils and organising structured and free play.",
  },
  {
    period: "Jul 23 — Aug 1, 2025",
    title: "Paris · Le Havre · Rouen · Étretat — France",
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
    role: "Electoral operations · Municipality of Rodigo · Referendum",
    desc: "Official appointment as a polling clerk at electoral section no. 5 of Rivalta sul Mincio (Municipality of Rodigo) for the Referendum of 22–23 March 2026. Tasks: verifying voters' identity, managing voting operations, counting ballots, drafting reports and transmitting results. Paid appointment with a fee of €119.60.",
  },
  {
    period: "Apr 20, 2026",
    title: "Cascina Fontana — Website",
    role: "Web design & website development",
    desc: "Design and development of the official Cascina Fontana website. Analysis of the client's needs, definition of the information architecture and creation of a responsive, carefully designed interface optimised to present the company's products and services. Direct collaboration with the client to define the content. Stack: React, TypeScript, Tailwind CSS.",
  },
  {
    period: "Apr 27, 2026",
    title: "Rivalta sul Mincio — Website",
    role: "Web design & website development",
    desc: "Design and development of the institutional and tourist website for Rivalta sul Mincio. Minimalist editorial design with careful typography, a warm colour palette and advanced animations via GSAP ScrollTrigger (pinning, stacking, parallax scrubbing). Gapless bento grids and image-led composition for immersive visual storytelling. Stack: Next.js, TypeScript, GSAP, Tailwind CSS.",
  },
  {
    period: "Jun 30 — Jul 1, 2026",
    title: "Film extra — «House of Gonzaga» TV series",
    role: "Background performer · Crowd scene · Piazza Broletto, Mantua",
    desc: "Background acting (figurazione) for the television series «House of Gonzaga», shot in the historic centre of Mantua. Part of the crowd in a night-time DJ-set scene filmed in Piazza Broletto, over two days (30 June – 1 July 2026) for around 10 hours on set.",
  },
  // --- wishlist ---
  {
    period: "✦ wish",
    title: "Found my own news outlet",
    role: "Independent journalism · Reportage · Publishing",
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

3 files changed · build ok`,
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

// ── Le altre pagine del sito (≈ i "template" di Supabase) ───────────────────
// Le sei pagine dello scaffale (§⑤). Oltre a titolo, riga e rotta portano due
// cose nuove: `kind`, la targhetta di che cosa sono, e `acc` — la tinta, che è
// una delle sei di casa (vedi «La tavolozza» in home.css). Qui la tinta non è
// un accento su fondo bianco ma il FONDO della lastra, quindi l'ordine conta:
// due tinte vicine di giro cromatico non stanno mai una accanto all'altra.
const PAGES = [
  {
    title: "About Me",
    kind: "Personal presentation",
    desc: "My personal presentation for the 2026 final state exam — who I am, my roots and the future, in a single narrated scroll.",
    url: "/me-stesso",
    acc: "verde",
    Icon: IcUser,
  },
  {
    title: "PCTO",
    kind: "Work placement",
    desc: "Three years of work placement at Caem Group's timber department, told through illustrations of the woods.",
    url: "/pcto",
    acc: "ambra",
    Icon: IcRuler,
  },
  {
    title: "Dubliners",
    kind: "English literature",
    desc: "James Joyce's «Dubliners» in 3 minutes — fifteen stories where almost nothing happens, and that's the point.",
    url: "/dubliners",
    acc: "blu",
    Icon: IcBook,
  },
  {
    title: "The Leopard",
    kind: "Italian literature",
    desc: "Tomasi di Lampedusa's novel in 3 minutes — Sicily in 1860 and the art of changing everything to change nothing.",
    url: "/gattopardo",
    acc: "rosso",
    Icon: IcCat,
  },
  {
    title: "Bio",
    kind: "Profile",
    desc: "The long version of the story: interests, skills, socials and everything that doesn't fit in a hero section.",
    url: "/bio",
    acc: "viola",
    Icon: IcId,
  },
  {
    title: "Support",
    kind: "Donations",
    desc: "Ways to support my work — every contribution goes straight into new projects and better tools.",
    url: "/sostieni",
    acc: "rosa",
    Icon: IcHeart,
  },
];

// ── Story-card dei progetti di punta ────────────────────────────────────────
const STORIES: { id: string; kind: string; quote: ReactNode }[] = [
  {
    id: "rivalta",
    kind: "Institutional site",
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
  },
  {
    id: "cascina-fontana",
    kind: "Business site",
    quote: (
      <>
        A responsive, carefully designed interface built{" "}
        <strong>with the client, for the client</strong> — from brief to launch.
      </>
    ),
  },
  {
    id: "instagram",
    kind: "Web tool",
    quote: (
      <>
        Who doesn't follow you back, computed{" "}
        <strong>entirely in your browser</strong> — nothing uploaded, nothing stored.
      </>
    ),
  },
];

// Mappa — Rivalta sul Mincio, il borgo per cui ho realizzato il sito
// ufficiale (vedi STORIES sopra). Coordinate del borgo (Rodigo, Mantova).
const RIVALTA_CENTER: [number, number] = [10.6771374, 45.1801924];
const RIVALTA_GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Rivalta sul Mincio, Italia")}`;

// La scocca delle card della griglia prodotti: il vetro (.sb-panel) più l'alone
// che segue il puntatore. Sta qui e non ripetuto sette volte perché le sette
// card sono la stessa cosa con dentro contenuti diversi — e perché l'alone deve
// stare SOLO su queste. Le altre griglie (pagine, story-card, curriculum) hanno
// già rim, sheen e tilt: un quarto strato lì sarebbe un tic, non un effetto.
function ProductCard({ children }: { children: ReactNode }) {
  return (
    <SpotlightCard>
      <div className="sb-panel">
        <div className="sb-panel-inner">{children}</div>
      </div>
    </SpotlightCard>
  );
}

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
  // Quale delle sei lastre dello scaffale è aperta (§⑤). Ce n'è sempre una:
  // uno scaffale tutto chiuso sarebbe una fila di colori senza contenuto.
  const [openPage, setOpenPage] = useState(0);

  const sortedCV = useMemo(() => {
    const wishes = CV.filter((c) => (c as any).wish);
    const items = CV.filter((c) => !(c as any).wish);
    const sorted = items.slice().sort((a, b) => parsePeriodStart(b.period) - parsePeriodStart(a.period));
    return [...sorted, ...wishes];
  }, []);

  const activeTab = ARCH_TABS.find((t) => t.id === archTab) ?? ARCH_TABS[0];
  const activeTech = STACK.find((t) => t.id === tech) ?? STACK[0];

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
             Nessun fondale suo: usa quello continuo della pagina. */}
        <section id="home" className="sb-hero">
          <div className="sb-container">
            <div className="sb-hero-grid">
              <h1 className="sb-hero-title">
                <span translate="no">Alberto Pecchini</span>
                <ShinyBrandline text="Surveyor & Website Developer" className="sb-brandline" />
              </h1>
              <div className="sb-hero-copy">
                <p>
                  I build client websites —{" "}
                  <strong translate="no">Rivalta sul Mincio</strong>,{" "}
                  <strong translate="no">Cascina Fontana</strong> — with React and
                  TypeScript. And I photograph people.
                </p>
              </div>
            </div>
            <SparkGroup className="sb-hero-actions">
              <a href="#progetti" className="sb-btn sb-btn--primary">Explore my projects</a>
              <a href="#curriculum" className="sb-btn sb-btn--secondary">View my résumé</a>
            </SparkGroup>
            <NowBuilding />
          </div>
        </section>

        {/* Fascia «lavoro fresco» — temporanea, sta qui apposta: è la prima
            cosa che si incontra scendendo dalla hero. Vedi site/FreshWork.tsx
            per l'interruttore che la spegne. */}
        <FreshWork />

        {/* ② Griglia — sei card, sei tinte, una riga di testo l'una.

            Erano sette e parlavano tutte lo stesso azzurro, con due o tre frasi
            a testa: da lontano si leggevano come un blocco solo. Adesso ogni
            card porta il suo accento in --sb-accent, e da lì scende su tutto —
            icona, disegno, spunte, alone. Le tinte stanno in home.css, blocco
            «La tavolozza».

            Cosa è uscito e perché: "Web design" (era lo stesso mestiere della
            prima card, detto due volte), "Web games" e "Web tools" (Trivia e
            l'utility di Instagram, che non sono più il lavoro di adesso). Cosa
            è entrato: le fotografie, i due clienti veri con il loro nome, e le
            auto — che stavano già in pagina ma seicento pixel più in basso. */}
        <section id="progetti" className="sb-container sb-products" aria-label="What I do">
          {/* Siti web — la card grande */}
          <Link to="/archivio" className="sb-card sb-card--lg" data-acc="blu">
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcCode /><h3>Websites</h3></div>
                <p className="sb-card-desc">
                  Designed, written and shipped <strong>end to end</strong> — React and
                  TypeScript, no page builders.
                </p>
                <ul className="sb-checks">
                  <li><IcCheck size={15} /> 100% responsive</li>
                  <li><IcCheck size={15} /> Light and dark, both drawn</li>
                  <li><IcCheck size={15} /> Source downloadable</li>
                </ul>
              </div>
              <div className="sb-card-visual">
                <BlueprintPage />
              </div>
            </ProductCard>
          </Link>

          {/* I due clienti veri, con il loro nome */}
          <a href="#lavori" className="sb-card" data-acc="verde">
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcGlobe /><h3>Rivalta · Cascina Fontana</h3></div>
                <p className="sb-card-desc">
                  Two real businesses online, <strong>from brief to launch</strong>.
                </p>
              </div>
              <div className="sb-card-visual">
                <GlobeOrbit />
              </div>
            </ProductCard>
          </a>

          {/* Sviluppo assistito dall'AI */}
          <a
            href="https://github.com/albertoxpecchini"
            target="_blank"
            rel="noreferrer noopener"
            className="sb-card"
            data-acc="viola"
          >
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcSparkle /><h3>AI-assisted development</h3></div>
                <p className="sb-card-desc">
                  Claude Code, Codex, Copilot — <strong>every line reviewed</strong>.
                </p>
              </div>
              <div className="sb-card-visual">
                <PrismFan />
              </div>
            </ProductCard>
          </a>

          {/* Fotografia */}
          <Link to="/shooting" className="sb-card" data-acc="rosa">
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcCamera /><h3>Photography</h3></div>
                <p className="sb-card-desc">
                  Portraits, as an amateur. <strong>The frames stay private</strong> — only
                  the numbers are public.
                </p>
              </div>
              <div className="sb-card-visual">
                <IrisPlate />
              </div>
            </ProductCard>
          </Link>

          {/* Università e area tecnica */}
          <Link to="/pcto" className="sb-card" data-acc="ambra">
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcRuler /><h3>Surveying · university</h3></div>
                <p className="sb-card-desc">
                  Construction and Land Management, after the <strong>CAT diploma</strong> —
                  AutoCAD, topography, valuation.
                </p>
              </div>
              <div className="sb-card-visual">
                <ContourPlate />
              </div>
            </ProductCard>
          </Link>

          {/* Auto */}
          <a href="#garage" className="sb-card" data-acc="rosso">
            <ProductCard>
              <div className="sb-card-head">
                <div className="sb-card-title"><IcCar /><h3>Cars</h3></div>
                <p className="sb-card-desc">
                  Three I dream about, <strong>drawn live in 3D</strong> by your graphics card.
                </p>
              </div>
              <div className="sb-card-visual">
                <GaugePlate />
              </div>
            </ProductCard>
          </a>
        </section>

        {/* Coda della griglia: tagline + clienti */}
        <div className="sb-container sb-prodfoot">
          <p className="sb-prodfoot-tag">
            <strong>One person, end to end.</strong> Design, code, content and deploy —
            integrated like a platform.
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
                    <span className="c">2 shipped · 2 online</span>
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

        {/* ③ Archivio — la "dashboard": il pannello dell'archivio incorporato */}
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
                  <ArchivioExplorer key={activeTab.id} embedded onlyUrls={activeTab.urls} />
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

        {/* ④ Stack — "Built with …" con switcher e codice vero */}
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
                  <span translate="no">· {activeTech.name}</span>
                  <IcArrowRight size={15} />
                </a>
              </div>

              <div className="sb-panel">
                <div className="sb-panel-inner">
                  <div className="sb-codehead" data-no-i18n>
                    <i /><i /><i />
                    <span>{activeTech.file}</span>
                  </div>
                  <pre className="sb-code"><code>{highlight(activeTech.code, activeTech.lang)}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ Le altre pagine — lo scaffale.

            Erano sei card di vetro in griglia, e una griglia di sei rettangoli
            uguali si legge come un elenco: la si scorre e non ci si ferma su
            niente. Adesso sono sei lastre affiancate, cinque chiuse di taglio
            e una sola aperta — quella che stai guardando. Le tinte sono le sei
            di casa, ma qui non fanno da accento su fondo bianco: sono il fondo,
            e vanno accese fino in fondo (vedi «Il muro delle sei pagine» in
            home.css).

            La sezione porta il data-acc di quella aperta, non uno fisso: la
            tinta esce dallo scaffale e sale fino alla nav, che segue la sezione
            a schermo (useNavAccent in site/GlassMotion.tsx). */}
        <section className="sb-section" aria-label="Pages" data-acc={PAGES[openPage].acc}>
          <div className="sb-container">
            <div className="sb-splithead">
              <div>
                <h3>Six more pages I designed and built</h3>
                <p>
                  Other projects of mine — some born for school, some to support myself.
                  Different subjects, the same hand and the same design system as this page.
                </p>
              </div>
              <Link to="/archivio" className="sb-btn sb-btn--sm sb-btn--secondary">View them all</Link>
            </div>

            <div className="sb-shelf">
              {PAGES.map((p, i) => {
                const open = i === openPage;
                return (
                  <div key={p.url} className="sb-slat" data-acc={p.acc} data-open={open}>
                    {/* Il bersaglio è tutta la lastra, ed è un <button> vero:
                        apre, non naviga. La navigazione è il link in fondo al
                        pannello — un link dentro un bottone non si può fare, e
                        soprattutto sono due gesti diversi. */}
                    <button
                      type="button"
                      className="sb-slat-hit"
                      aria-label={p.title}
                      aria-expanded={open}
                      aria-controls={`sb-slat-${i}`}
                      onClick={() => setOpenPage(i)}
                      onMouseEnter={() => setOpenPage(i)}
                      onFocus={() => setOpenPage(i)}
                    />
                    <span className="sb-slat-mark" aria-hidden="true"><p.Icon size={24} /></span>
                    {/* Lo stesso glifo, in grande e appena visibile: la lastra
                        aperta è alta mezzo schermo e il testo sta tutto in
                        fondo (è lì che il velo scurisce abbastanza da farlo
                        leggere), quindi in mezzo restava un campo di tinta
                        vuoto. Questo lo riempie senza chiedere di essere
                        guardato. */}
                    <span className="sb-slat-ghost" aria-hidden="true"><p.Icon size={200} /></span>
                    {/* Il nome di taglio sul dorso: cinque lastre chiuse senza
                        nome sarebbero cinque colori e basta. aria-hidden perché
                        è lo stesso titolo che portano il bottone e il pannello. */}
                    <span className="sb-slat-rail" aria-hidden="true">{p.title}</span>
                    <div className="sb-slat-body" id={`sb-slat-${i}`}>
                      <span className="sb-slat-kind">{p.kind}</span>
                      <h4 className="sb-slat-name">{p.title}</h4>
                      <p className="sb-slat-line">{p.desc}</p>
                      <Link className="sb-slat-go" to={p.url} tabIndex={open ? 0 : -1}>
                        Open the page <IcArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ⑥ Story-card dei progetti di punta */}
        <section id="lavori" className="sb-section" aria-label="Featured work" data-acc="verde">
          <div className="sb-container">
            <div className="sb-splithead">
              <h3>How the featured projects are built</h3>
              <Link to="/archivio" className="sb-btn sb-btn--sm sb-btn--secondary">More in the archive</Link>
            </div>
            <div className="sb-stories">
              {STORIES.map((s) => {
                const p = projectByI(s.id);
                if (!p) return null;
                const external = !p.url.startsWith("/");
                const inner = (
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-story-inner">
                      <div className="sb-story-top">
                        <span className="sb-story-name" translate="no">{p.title}</span>
                        <span className="sb-story-kind">{s.kind}</span>
                      </div>
                      <p className="sb-story-quote">{s.quote}</p>
                      <span className="sb-story-foot">
                        Open the project {external ? <IcExternal size={14} /> : <IcArrowRight size={14} />}
                      </span>
                    </div>
                  </div>
                );
                return external ? (
                  <a key={s.id} href={p.url} target="_blank" rel="noreferrer noopener" className="sb-story">
                    {inner}
                  </a>
                ) : (
                  <Link key={s.id} to={p.url} className="sb-story">
                    {inner}
                  </Link>
                );
              })}
            </div>

            <div className="sb-panel sb-loc-panel">
              <div className="sb-panel-inner sb-loc-inner">
                <div className="sb-loc-copy">
                  <h4 className="sb-loc-title"><IcPin size={16} /> <span translate="no">Rivalta sul Mincio</span></h4>
                  <p className="sb-loc-desc">
                    The village on the Mincio river where my family's farm is, and where I
                    designed and built the official tourist website above.
                  </p>
                  <a className="sb-btn sb-btn--sm sb-btn--secondary" href={RIVALTA_GMAPS} target="_blank" rel="noreferrer">
                    <IcCompass size={16} /> Google Maps
                  </a>
                </div>
                {/* La mappa non parte col resto della pagina: maplibre-gl sono
                    ~290 kB gzip, e questa sezione sta in fondo. Si scarica
                    quando ci si avvicina — vedi site/WhenVisible. */}
                <WhenVisible className="sb-loc-map">
                  <Suspense fallback={null}>
                    <RivaltaMap center={RIVALTA_CENTER} zoom={13} />
                  </Suspense>
                </WhenVisible>
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Curriculum — muro di card (≈ muro community) */}
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

            <div className="sb-wall">
              {sortedCV.map((item) => (
                <div
                  className={`sb-wall-card${(item as any).wish ? " sb-wall-card--wish" : ""}`}
                  key={item.title}
                >
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-wall-inner">
                      <span className="sb-cv-period">{item.period}</span>
                      <h4 className="sb-cv-title">{item.title}</h4>
                      <p className="sb-cv-role">{item.role}</p>
                      <p className="sb-cv-desc">{item.desc}</p>
                      {(item as any).pdf && (
                        <button
                          type="button"
                          onClick={() => openDoc((item as any).pdf, item.title)}
                          className="sb-cv-doc"
                          aria-haspopup="dialog"
                        >
                          <IcFile size={15} />
                          <span>{(item as any).pdfLabel || "Open document (PDF)"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑧ Garage — le tre auto, in 3D e girabili */}
        {/* ⑦bis Shooting — l'altra metà, quella senza tastiera.
             I numeri non sono scritti a mano: vengono da src/app/shooting/
             sessioni.json, il manifesto PUBBLICO che `npm run scatti` genera
             leggendo gli EXIF. Le foto no: quelle non escono da casa, e questa
             sezione lo dice invece di lasciarlo scoprire a chi clicca. */}
        <section id="shooting" className="sb-section" aria-label="Photography" data-acc="rosa">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3>And on the other side of the lens</h3>
              <p>
                I take portraits of people — as an amateur, and with no illusions about it.
                A Canon EOS 4000D with its kit lens, or the iPhone 16 Pro when the camera
                stayed home.
              </p>
            </div>

            <div className="sb-panel sb-shot-panel">
              <div className="sb-panel-inner sb-shot-inner">
                <div className="sb-shot-copy">
                  <h4 className="sb-shot-title">
                    <IcCamera size={16} /> <span>Shooting</span>
                  </h4>
                  <p className="sb-shot-desc">
                    <strong>The photos of people are not published.</strong> What stays online
                    is what can be told about a session — the date, the place, how many frames,
                    which gear — and those numbers come from the files' own metadata. The album
                    itself opens only on the machine where the photos are.
                  </p>
                  <Link to="/shooting" className="sb-btn sb-btn--sm sb-btn--secondary">
                    <IcAperture size={16} /> See the sessions
                  </Link>
                </div>

                <div className="sb-shot-side">
                  <div className="sb-shot-numeri">
                    {[
                      { k: "frames", v: String(SESSIONI.totale) },
                      { k: SESSIONI.sessioni.length === 1 ? "session" : "sessions", v: String(SESSIONI.sessioni.length) },
                    ].map((n) => (
                      <div key={n.k} className="sb-shot-numero">
                        <span className="sb-shot-numero-v" data-no-i18n translate="no">{n.v}</span>
                        <span className="sb-shot-numero-k">{n.k}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="sb-shot-ferri" data-no-i18n translate="no">
                    <li>Canon EOS 4000D</li>
                    <li>EF-S 18–55 mm</li>
                    <li>iPhone 16 Pro</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="garage" className="sb-section" aria-label="Dream garage" data-acc="rosso">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3>And three cars I dream about</h3>
              <p>
                Not photos and not videos: the 3D models themselves — their own paint,
                wheels and interiors — drawn live by your graphics card. Drag one to turn
                it in any direction.
              </p>
            </div>
            <WhenVisible className="sb-garage-wrap" rootMargin="400px">
              <Suspense fallback={null}>
                <DreamGarage />
              </Suspense>
            </WhenVisible>
          </div>
        </section>

        {/* ⑨ Open source */}
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

        {/* ⑩ CTA finale */}
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
