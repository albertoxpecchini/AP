// ─────────────────────────────────────────────────────────────────────────────
// L'albero REALE del repository, per l'archivio (/archivio → "Codice sorgente").
//
// Dati: public/repo-tree.json, generato in build da scripts/build-repo-tree.mjs
// con `git ls-files` — quindi esattamente i file versionati su GitHub, con la
// dimensione reale e la data dell'ultimo commit che li ha toccati. Il file si
// rigenera ad ogni build, cioè ad ogni commit deployato.
//
// Perché non le API di GitHub: il repository è privato (api.github.com → 404
// senza token) e un token nel front-end non si mette. Vedi l'intestazione dello
// script per il dettaglio.
// ─────────────────────────────────────────────────────────────────────────────

/** Voce grezza del JSON: percorso, byte, data (YYYY-MM-DD) dell'ultimo commit. */
interface RawFile { p: string; b: number; d: string }

export interface RepoCommit {
  sha: string;
  short: string;
  date: string;
  message: string;
  author: string;
  count: number;
}

export interface RepoMeta {
  repo: string;
  url: string;
  branch: string;
  commit: RepoCommit;
  history: "full" | "shallow";
  generatedAt: string;
  files: number;
  bytes: number;
}

/** Voce dell'albero, file o cartella (le cartelle aggregano i figli). */
export interface RepoEntry {
  /** Chiave stabile per selezione/preferiti: "repo:<percorso>". */
  id: string;
  path: string;
  name: string;
  dir: boolean;
  /** File: dimensione reale. Cartella: somma ricorsiva dei file dentro. */
  bytes: number;
  /** File: data dell'ultimo commit. Cartella: la più recente dei figli. */
  date: string;
  /** Cartella: quanti file contiene (ricorsivi). File: 1. */
  files: number;
}

export interface RepoTree {
  meta: RepoMeta;
  /** Figli diretti di ogni cartella ("" = radice), già ordinati. */
  byDir: Map<string, RepoEntry[]>;
  /** Tutte le voci per percorso (file e cartelle). */
  byPath: Map<string, RepoEntry>;
  /** Solo i file, in ordine di percorso (per la ricerca). */
  allFiles: RepoEntry[];
}

export const repoEntryId = (path: string) => `repo:${path}`;

// ── Etichette di tipo (sorgente italiana: la pagina /archivio è in italiano) ──
const TYPE_BY_EXT: Record<string, string> = {
  tsx: "TypeScript React",
  ts: "TypeScript",
  js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
  json: "Dati JSON",
  css: "Foglio di stile",
  html: "Pagina HTML",
  md: "Documento Markdown",
  py: "Script Python",
  svg: "Immagine SVG",
  png: "Immagine bitmap", jpg: "Immagine bitmap", jpeg: "Immagine bitmap",
  webp: "Immagine bitmap", gif: "Immagine bitmap", avif: "Immagine bitmap",
  ico: "Icona del sito",
  pdf: "Documento PDF",
  woff: "Carattere tipografico", woff2: "Carattere tipografico",
  ttf: "Carattere tipografico", otf: "Carattere tipografico",
  csv: "Tabella CSV",
  txt: "File di testo",
  yml: "Configurazione YAML", yaml: "Configurazione YAML",
  sql: "Query SQL",
  sh: "Script shell",
  mp3: "File multimediale", mp4: "File multimediale",
  webm: "File multimediale", mov: "File multimediale",
};

/** Categoria grafica: decide l'icona della riga. */
export type RepoIconKind = "code" | "shell" | "data" | "image" | "doc" | "file";

const ICON_BY_EXT: Record<string, RepoIconKind> = {
  tsx: "code", ts: "code", js: "code", mjs: "code", cjs: "code",
  css: "code", html: "code", sql: "code", py: "code",
  sh: "shell",
  json: "data", yml: "data", yaml: "data", csv: "data",
  svg: "image", png: "image", jpg: "image", jpeg: "image",
  webp: "image", gif: "image", avif: "image", ico: "image",
  md: "doc", txt: "doc", pdf: "doc",
};

export function extOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function repoTypeLabel(e: RepoEntry): string {
  if (e.dir) return "Cartella";
  // I file che iniziano per punto (.gitignore, .env.example…) sono impostazioni,
  // non "file senza estensione".
  if (e.name.startsWith(".")) return "File di configurazione";
  const ext = extOf(e.path);
  if (!ext) return "File senza estensione";
  return TYPE_BY_EXT[ext] ?? `File ${ext.toUpperCase()}`;
}

export function repoIconKind(e: RepoEntry): RepoIconKind {
  if (e.dir) return "file";
  if (e.name.startsWith(".")) return "shell";
  return ICON_BY_EXT[extOf(e.path)] ?? "file";
}

/** Link a GitHub (utile a chi ha accesso al repository). */
export const repoFileUrl = (m: RepoMeta, e: RepoEntry) =>
  `${m.url}/${e.dir ? "tree" : "blob"}/${m.branch}/${e.path}`;
export const repoHistoryUrl = (m: RepoMeta, e: RepoEntry) =>
  `${m.url}/commits/${m.branch}/${e.path}`;
export const repoCommitUrl = (m: RepoMeta) => `${m.url}/commit/${m.commit.sha}`;

/** Percorso padre di una cartella/file ("src/app/site" → "src/app"). */
export const parentDir = (path: string) => {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
};

// ── Costruzione dell'indice ──────────────────────────────────────────────────
function buildTree(meta: RepoMeta, raw: RawFile[]): RepoTree {
  const byPath = new Map<string, RepoEntry>();
  const kids = new Map<string, Set<string>>();
  const allFiles: RepoEntry[] = [];

  const addChild = (dir: string, childPath: string) => {
    let set = kids.get(dir);
    if (!set) { set = new Set(); kids.set(dir, set); }
    set.add(childPath);
  };

  for (const f of raw) {
    const file: RepoEntry = {
      id: repoEntryId(f.p),
      path: f.p,
      name: f.p.slice(f.p.lastIndexOf("/") + 1),
      dir: false,
      bytes: f.b || 0,
      date: f.d || "",
      files: 1,
    };
    byPath.set(f.p, file);
    allFiles.push(file);

    // Ogni antenato del file: creato una volta, poi aggiornato con i totali.
    const parts = f.p.split("/");
    let acc = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      const parent = acc;
      acc = acc ? `${acc}/${parts[i]}` : parts[i];
      let d = byPath.get(acc);
      if (!d) {
        d = { id: repoEntryId(acc), path: acc, name: parts[i], dir: true, bytes: 0, date: "", files: 0 };
        byPath.set(acc, d);
        addChild(parent, acc);
      }
      d.bytes += file.bytes;
      d.files += 1;
      if (file.date > d.date) d.date = file.date;
    }
    addChild(parentDir(f.p), f.p);
  }

  // Figli diretti ordinati: cartelle prima, poi per nome.
  const byDir = new Map<string, RepoEntry[]>();
  for (const [dir, set] of kids) {
    const list = Array.from(set, (p) => byPath.get(p)!).filter(Boolean);
    list.sort((a, b) =>
      a.dir !== b.dir ? (a.dir ? -1 : 1) : a.name.localeCompare(b.name, "it"),
    );
    byDir.set(dir, list);
  }

  return { meta, byDir, byPath, allFiles };
}

// ── Caricamento (una volta per sessione, ricaricabile con force) ─────────────
let cache: Promise<RepoTree | null> | null = null;

export function loadRepoTree(force = false): Promise<RepoTree | null> {
  if (!cache || force) {
    cache = fetch(force ? `/repo-tree.json?t=${Date.now()}` : "/repo-tree.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: (RepoMeta & { tree?: RawFile[] }) | null) => {
        if (!j || !Array.isArray(j.tree) || !j.tree.length) return null;
        const { tree, ...meta } = j;
        return buildTree(meta as RepoMeta, tree);
      })
      .catch(() => null);
  }
  return cache;
}
