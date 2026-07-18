// ─────────────────────────────────────────────────────────────────────────────
// Dati condivisi dei progetti — UNICA fonte di verità per la home (App.tsx) e
// per l'archivio "Esplora File" (/archivio). Qui vivono l'elenco dei progetti,
// i materiali (PDF), gli accorpamenti "in evidenza" e i piccoli helper.
//
// Ogni progetto porta i metadati che servono alle colonne dell'archivio:
//  · kind     → tipo (gioco / pagina / sito / documento)
//  · modified → data reale (ISO) ordinabile
//  · srcDir   → cartella sorgente (per lo ZIP generato in build), solo interni
//  · id       → chiave breve (= nome cartella per gli interni)
// ─────────────────────────────────────────────────────────────────────────────

import {
  Globe2,
  BrainCircuit,
  Ruler,
  UserRound,
  BookOpen,
  Cat,
  Instagram,
} from "lucide-react";

export type ProjectKind = "game" | "page" | "site" | "doc" | "tool";

export interface Project {
  /** Chiave breve: per gli interni coincide col nome cartella (es. "trivia"). */
  id: string;
  category: string;
  /** Data "umana" già formattata, mostrata nelle card della home. */
  date: string;
  /** Data reale ISO (YYYY-MM-DD), usata per ordinare nell'archivio. */
  modified: string;
  title: string;
  url: string;
  kind: ProjectKind;
  thumb?: string;
  desc: string;
  tags?: string[];
  /** Cartella sorgente da zippare (solo progetti interni). */
  srcDir?: string;
  githubRepo?: string;
  screenshotUrl?: string;
  previewImg?: string;
}

// Glyph del progetto (lucide). I siti esterni usano il globo.
export function ProjectIcon({ thumb, size = 32 }: { thumb?: string; size?: number }) {
  const sw = 2.1;
  switch (thumb) {
    case "trivia":      return <BrainCircuit size={size} strokeWidth={sw} />;
    case "instagram":   return <Instagram size={size} strokeWidth={sw} />;
    case "pcto":        return <Ruler size={size} strokeWidth={sw} />;
    case "mestesso":    return <UserRound size={size} strokeWidth={sw} />;
    case "dubliners":   return <BookOpen size={size} strokeWidth={sw} />;
    case "gattopardo":  return <Cat size={size} strokeWidth={sw} />;
    default:            return <Globe2 size={size} strokeWidth={sw} />;
  }
}

export const PROJECTS: Project[] = [
  {
    id: "pcto",
    category: "Work placement · PCTO",
    date: "2023 — 2026",
    modified: "2026-06-21",
    title: "PCTO",
    url: "/pcto",
    kind: "page",
    thumb: "pcto",
    srcDir: "src/app/pcto",
    desc: "Three years of work-based learning (PCTO) at Caem Group S.p.A. in Castellucchio, in the technical office of the timber department: 3D modelling of canopies in AutoCAD, observing structural design and archiving quotes. The journey told through illustrations of the woods.",
    tags: ["Timber dept.", "AutoCAD 3D", "Timber structures", "Technical office"],
  },
  {
    id: "me-stesso",
    category: "Personal presentation",
    date: "Jun 22, 2026",
    modified: "2026-06-22",
    title: "About Me",
    url: "/me-stesso",
    kind: "page",
    thumb: "mestesso",
    srcDir: "src/app/me-stesso",
    desc: "My personal presentation for the 2026 final state exam: who I am, my roots in the family business in Rivalta, the CAT path, my passions (web, travel, shooting, motorbikes) and the future — a single narrated scroll built with my neroverde design system, in the style of /pcto.",
    tags: ["Presentation", "Design system", "Storytelling", "React"],
  },
  {
    id: "dubliners",
    category: "Literature deep-dive",
    date: "Jun 23, 2026",
    modified: "2026-06-23",
    title: "Dubliners",
    url: "/dubliners",
    kind: "page",
    thumb: "dubliners",
    srcDir: "src/app/dubliners",
    desc: "James Joyce's «Dubliners» in 3 minutes: who the author is, what the collection of 15 stories is, the characters (ordinary people, no heroes), the plot in which almost nothing happens and the real theme — being trapped. A narrated scroll built with my «dark premium» violet design system, in the style of /me-stesso, closing on the famous last lines of «The Dead».",
    tags: ["Literature", "Storytelling", "Design system", "React"],
  },
  {
    id: "gattopardo",
    category: "Literature deep-dive",
    date: "Jun 23, 2026",
    modified: "2026-06-23",
    title: "The Leopard",
    url: "/gattopardo",
    kind: "page",
    thumb: "gattopardo",
    srcDir: "src/app/gattopardo",
    desc: "Tomasi di Lampedusa's «The Leopard» in 3 minutes: who the author is (a single novel, famous only after his death), Sicily in 1860 with the Unification of Italy, the characters (Prince Fabrizio, Tancredi, the Salinas), the collapse of the old order and the theme — «if we want things to stay as they are, things will have to change». A narrated scroll built with my «dark premium» violet design system, in the style of /me-stesso.",
    tags: ["Literature", "Risorgimento", "Storytelling", "React"],
  },
  {
    id: "trivia",
    category: "Web game",
    date: "Jun 15, 2026",
    modified: "2026-06-15",
    title: "Trivia",
    url: "/trivia",
    kind: "game",
    thumb: "trivia",
    srcDir: "src/app/trivia",
    desc: "Trivia quiz on the history of architecture: multiple-choice, true-or-false and open-answer questions, organised in chapters. A relevant photo for every question, scoring with speed bonus, streaks with trophies, an American-style final grade (A–F) and a live leaderboard. Designed as a real game — light and animated — for desktop and mobile.",
    tags: ["React", "TypeScript", "Game design", "UI/UX"],
  },
  {
    id: "instagram",
    category: "Web tool",
    date: "Jul 18, 2026",
    modified: "2026-07-18",
    title: "Compare Two Lists",
    url: "/instagram",
    kind: "tool",
    thumb: "instagram",
    srcDir: "src/app/instagram",
    desc: "A privacy-first tool that compares two lists right in your browser. Built for Instagram: load your following.html and followers.html and instantly see who doesn't follow you back, who you don't follow back and your mutuals — with monogram avatars, follow dates, name/chronological sorting, a compare-over-time mode, an illustrated step-by-step tutorial and downloadable HTML reports. Nothing is uploaded, nothing is stored: the comparison runs entirely client-side.",
    tags: ["React", "TypeScript", "Client-side", "Privacy", "UI/UX"],
  },
  {
    id: "rivalta",
    category: "Institutional website",
    date: "Apr 27, 2026",
    modified: "2026-04-27",
    title: "Rivalta sul Mincio",
    url: "https://rivaltasulmincio.it",
    kind: "site",
    desc: "Responsive website for the tourist destination of Rivalta sul Mincio. Minimalist design with editorial typography, a warm monochrome palette, gapless bento grids, GSAP ScrollTrigger animations and an image-led composition.",
    tags: ["Next.js", "TypeScript", "GSAP", "Tailwind CSS", "Minimal design"],
    githubRepo: "albertoxpecchini/rivaltasulmincio",
    screenshotUrl: "https://rivaltasulmincio.it",
  },
  {
    id: "cascina-fontana",
    category: "Business website",
    date: "Apr 20, 2026",
    modified: "2026-04-20",
    title: "Cascina Fontana",
    url: "https://cascinafontana.xyz",
    kind: "site",
    desc: "Website for Cascina Fontana. Polished design and a responsive layout optimised to present the business and the services it offers.",
    tags: ["React", "TypeScript", "Tailwind CSS", "Responsive Design"],
    screenshotUrl: "https://cascinafontana.xyz",
    previewImg: "/cascina-preview.png",
  },
];

// Materiali (PDF già in public/): rientrano nell'archivio come "documenti".
export const MATERIALS: Project[] = [
  {
    id: "cv",
    category: "Documento personale",
    date: "Jun 2026",
    modified: "2026-06-01",
    title: "Curriculum Vitae",
    url: "/cv-alberto-pecchini.pdf",
    kind: "doc",
    desc: "Curriculum vitae di Alberto Pecchini: istruzione, esperienze, competenze e progetti, in formato PDF.",
    tags: ["PDF", "CV"],
  },
  {
    id: "attestato-sicurezza",
    category: "Certificato",
    date: "Dec 19, 2023",
    modified: "2023-12-19",
    title: "Attestato sicurezza lavoratori",
    url: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    kind: "doc",
    desc: "Attestato del corso sulla sicurezza dei lavoratori a rischio basso (Accordo Stato–Regioni 21/12/2011, D.Lgs. 81/08), 4 ore e-learning.",
    tags: ["PDF", "Certificato", "Sicurezza"],
  },
];

// Emoji per ogni progetto (riga "categoria" della card della home).
export const PROJECT_EMOJI: Record<string, string> = {
  "PCTO": "🪵",
  "About Me": "🎓",
  "Dubliners": "📖",
  "The Leopard": "🐆",
  "Trivia": "🧠",
  "Compare Two Lists": "👀",
  "Rivalta sul Mincio": "🏞️",
  "Cascina Fontana": "🏡",
  "Curriculum Vitae": "📄",
  "Attestato sicurezza lavoratori": "📜",
};

// Cartella "in evidenza": tutti i materiali per l'Esame di Maturità 2026.
// L'ordine segue quello qui sotto; questi progetti vengono mostrati SOLO dentro
// la cartella e tolti dalla griglia "Work" per non duplicarli.
export const MATURITA_URLS = ["/me-stesso", "/pcto", "/dubliners", "/gattopardo"];

// Cartella "Giochi Web · In evidenza": i web game del progetto (oggi solo Trivia).
// Anche questi vengono tolti dalla griglia "Work" per non duplicarli.
export const GAMES_URLS = ["/trivia"];

// Siti esterni (clienti).
export const EXTERNAL_URLS = ["https://rivaltasulmincio.it", "https://cascinafontana.xyz"];

// ── Helper condivisi ────────────────────────────────────────────────────────

/** Etichetta italiana del tipo, per la colonna "Tipo" dell'archivio. */
export function typeLabel(kind: ProjectKind): string {
  switch (kind) {
    case "game": return "Gioco web";
    case "page": return "Pagina · approfondimento";
    case "site": return "Sito web";
    case "tool": return "Strumento web";
    case "doc":  return "Documento PDF";
  }
}

/** Byte → stringa stile Windows (KB / MB), separatore decimale italiano. */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("it-IT")} KB`;
  }
  return `${(bytes / 1024 / 1024).toLocaleString("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}

/** Data ISO → "23/06/2026" (formato Windows IT). */
export function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString("it-IT");
}

/** Data ISO → timestamp per l'ordinamento (0 se non valida). */
export function parseModified(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** È un progetto interno (route dell'app, non sito esterno né PDF)? */
export function isInternal(p: Project): boolean {
  return p.url.startsWith("/") && p.kind !== "doc";
}

/**
 * Link di download dello ZIP/file per una voce, o null se non scaricabile:
 *  · doc           → il PDF stesso
 *  · interno       → /zips/<id>.zip (generato in build da scripts/build-zips.mjs)
 *  · sito + GitHub → ZIP del repo su GitHub
 *  · altro         → null (es. Cascina: solo "Apri online")
 */
export function zipHref(p: Project): string | null {
  if (p.kind === "doc") return p.url;
  if (isInternal(p)) return `/zips/${p.id}.zip`;
  if (p.githubRepo) return `https://github.com/${p.githubRepo}/archive/refs/heads/main.zip`;
  return null;
}
