import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { SiGithub } from "react-icons/si";
import { isProdHost, urlForPath, subForPath, SiteLink as Link } from "../site/nav";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  PROJECTS,
  MATERIALS,
  MATURITA_URLS,
  GAMES_URLS,
  typeLabel,
  formatBytes,
  formatDate,
  parseModified,
  zipHref,
  type Project,
  type ProjectKind,
} from "../site/projects";
import { readmeOf } from "../site/readmes";
import SiteFooter from "../site/SiteFooter";
import {
  loadRepoTree, repoTypeLabel, repoIconKind, repoFileUrl, repoHistoryUrl,
  repoCommitUrl, parentDir,
  type RepoTree, type RepoEntry, type RepoMeta,
} from "../site/repoTree";
import {
  IcSearch, IcClose, IcHome, IcClock, IcStar, IcTrash, IcFolder, IcFile, IcGlobe,
  IcGrid, IcList, IcMore, IcCheck, IcChevronRight, IcArrowUp, IcArrowDown,
  IcArrowLeft, IcArrowRight, IcExternal, IcDownload, IcLink, IcRotate, IcGame,
  IcGrad, IcVenn, IcBook, IcCode, IcTerminal, IcImage, IcBraces, IcGitCommit,
  IcGitBranch, ProjectGlyph, type IcProps,
} from "../site/homeIcons";
import { PageBackdrop, ShinyBrandline, SparkGroup } from "../site/homeFx";
import "../home.css";
import "./archivio.css";

// ─────────────────────────────────────────────────────────────────────────────
// /archivio — l'archivio dei progetti in veste "piattaforma" (la grammatica
// Supabase della home): nav sottile, hero a due colonne, striscia di numeri,
// e il pannello-dashboard con side-nav delle posizioni, barra degli strumenti,
// tabella (o griglia), preferiti, menu contestuali e finestra Proprietà con
// README. Tema chiaro/scuro NATIVO: tutto passa dai token --sb-* di home.css.
//
// <ArchivioExplorer/> è riusabile: la pagina /archivio lo pilota (posizione
// controllata dalle card "Cartelle in evidenza"), la home lo incorpora con
// `embedded` e una lista ridotta di progetti.
// ─────────────────────────────────────────────────────────────────────────────

// ── Renderer markdown minimale per i README della finestra Proprietà ──
function mdInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] != null) nodes.push(<strong key={k++}>{m[1]}</strong>);
    else nodes.push(<code key={k++}>{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function ReadmeView({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h4 key={key++} className="sb-ar-md-h">{mdInline(line.slice(3))}</h4>); i++; continue; }
    if (line.startsWith("> ")) { blocks.push(<p key={key++} className="sb-ar-md-note">{mdInline(line.slice(2))}</p>); i++; continue; }
    if (line.startsWith("- ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(<li key={items.length}>{mdInline(lines[i].slice(2))}</li>); i++; }
      blocks.push(<ul key={key++} className="sb-ar-md-ul">{items}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(## |- |> )/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<p key={key++} className="sb-ar-md-p">{mdInline(para.join(" "))}</p>);
  }
  return <>{blocks}</>;
}

const ALL: Project[] = [...PROJECTS, ...MATERIALS];
const AUTHOR = "Alberto Pecchini";
const REPO = "https://github.com/albertoxpecchini/AP";

type FolderId = "maturita" | "giochi" | "siti" | "documenti";
export type PlaceId = "home" | "recenti" | "preferiti" | "cestino" | "codice" | FolderId;
type SortCol = "name" | "size" | "modified";
type SortState = { col: SortCol; dir: "asc" | "desc" };

interface FolderDef {
  id: FolderId;
  label: string;
  Icon: (p: IcProps) => JSX.Element;
  items: Project[];
}

/** Riga della vista (cartella o file), già pronta per tabella/griglia. */
interface Row {
  id: string;
  isFolder: boolean;
  /** Cartella "in evidenza" dell'archivio. */
  folder?: FolderDef;
  /** Voce dell'archivio (progetto o documento). */
  p?: Project;
  /** Voce REALE del repository (cartella o file versionato). */
  node?: RepoEntry;
  name: string;
}

// ── localStorage helpers ──
function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* storage non disponibile */
  }
}

const PLACE_META: Record<Exclude<PlaceId, FolderId>, { label: string; Icon: (p: IcProps) => JSX.Element }> = {
  home:      { label: "Home",      Icon: IcHome },
  recenti:   { label: "Recenti",   Icon: IcClock },
  preferiti: { label: "Preferiti", Icon: (p) => <IcStar {...p} /> },
  cestino:   { label: "Cestino",   Icon: IcTrash },
  codice:    { label: "Codice sorgente", Icon: (p) => <SiGithub size={p.size ?? 18} className={p.className} aria-hidden="true" /> },
};
// "codice" ha un gruppo tutto suo nella side-nav: qui lo escludiamo dal primo.
const MAIN_PLACES: Exclude<PlaceId, FolderId | "codice">[] = ["home", "recenti", "preferiti", "cestino"];

/** Icona di una voce del repository, per categoria di file. */
function repoIcon(e: RepoEntry, size: number) {
  if (e.dir) return <IcFolder size={size} />;
  switch (repoIconKind(e)) {
    case "code":  return <IcCode size={size} />;
    case "shell": return <IcTerminal size={size} />;
    case "data":  return <IcBraces size={size} />;
    case "image": return <IcImage size={size} />;
    default:      return <IcFile size={size} />;
  }
}

/** Icona per tipo di voce: glifo del progetto, globo per i siti, foglio per i PDF. */
function kindIcon(kind: ProjectKind, thumb: string | undefined, size: number) {
  if (kind === "doc") return <IcFile size={size} />;
  if (kind === "site") return <IcGlobe size={size} />;
  return <ProjectGlyph thumb={thumb} size={size} />;
}

/** Cartelle "in evidenza" — stessa fonte di verità per pannello e card. */
export function archiveFolders(): FolderDef[] {
  const find = (u: string) => PROJECTS.find((p) => p.url === u);
  const maturita = MATURITA_URLS.map(find).filter(Boolean) as Project[];
  const giochi = GAMES_URLS.map(find).filter(Boolean) as Project[];
  return [
    { id: "maturita",  label: "Esame di Maturità", Icon: IcGrad,   items: maturita },
    { id: "giochi",    label: "Giochi Web",        Icon: IcGame,   items: giochi },
    { id: "siti",      label: "Siti web",          Icon: IcGlobe,  items: PROJECTS.filter((p) => p.kind === "site") },
    { id: "documenti", label: "Documenti",         Icon: IcFile,   items: MATERIALS },
  ];
}

export function ArchivioExplorer({
  embedded = false,
  onlyUrls,
  place: placeProp,
  onPlace,
}: {
  embedded?: boolean;
  /** Se presente, mostra solo questi progetti (usato dalla home per la vetrina ridotta). */
  onlyUrls?: string[];
  /** Posizione pilotata da fuori (la pagina /archivio); se assente è interna. */
  place?: PlaceId;
  onPlace?: (id: PlaceId) => void;
}) {
  const navigate = useNavigate();

  const [placeState, setPlaceState] = useState<PlaceId>("home");
  const place = placeProp ?? placeState;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(() => load("ap-files-sort", { col: "name", dir: "asc" } as SortState));
  const [view, setView] = useState<"list" | "grid">(() => load("ap-files-view", "list"));
  const [starred, setStarred] = useState<Set<string>>(() => new Set(load<string[]>("ap-files-starred", [])));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [propsRow, setPropsRow] = useState<Row | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [toast, setToast] = useState("");
  // Albero reale del repository + cartella aperta al suo interno.
  const [repo, setRepo] = useState<RepoTree | null>(null);
  const [repoPath, setRepoPath] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Persistenza impostazioni (l'archivio "ricorda" vista, ordine e preferiti)
  useEffect(() => save("ap-files-sort", sort), [sort]);
  useEffect(() => save("ap-files-view", view), [view]);
  useEffect(() => save("ap-files-starred", Array.from(starred)), [starred]);

  // Dimensioni reali dal manifest generato in build
  const loadManifest = () => {
    fetch("/zips/manifest.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((m: Record<string, { bytes: number }>) => {
        const map: Record<string, number> = {};
        for (const [id, v] of Object.entries(m)) if (v?.bytes) map[id] = v.bytes;
        setSizes(map);
      })
      .catch(() => setSizes({}));
  };
  useEffect(loadManifest, []);

  // Elenco reale dei file versionati (public/repo-tree.json, rigenerato ad ogni
  // build → ad ogni commit). La vetrina ridotta della home non lo usa.
  const loadRepo = (force = false) => {
    if (onlyUrls) return;
    loadRepoTree(force).then(setRepo);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => loadRepo(), [onlyUrls]);

  // Chiusura del menu della barra al click fuori / Esc
  useEffect(() => {
    if (!menuOpen) return;
    const down = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".sb-ar-pop, .sb-ar-iconbtn")) setMenuOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [menuOpen]);

  // Esc chiude la finestra Proprietà
  useEffect(() => {
    if (!propsRow) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setPropsRow(null); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [propsRow]);

  // Vista ridotta della home: solo i progetti indicati.
  const items = useMemo(() => {
    if (!onlyUrls) return ALL;
    const allow = new Set(onlyUrls);
    return ALL.filter((p) => allow.has(p.url));
  }, [onlyUrls]);

  // Cartelle (solo archivio completo, non nella vetrina ridotta)
  const folders = useMemo<FolderDef[]>(() => (onlyUrls ? [] : archiveFolders()), [onlyUrls]);

  const currentFolder = folders.find((f) => f.id === place) ?? null;

  // ── Valori per colonne e ordinamento ──
  const objCount = (n: number) => (n === 1 ? "1 oggetto" : `${n} oggetti`);
  const fileCount = (n: number) => (n === 1 ? "1 file" : `${n} file`);
  const rowSizeText = (r: Row) => {
    // Cartella del repository: peso complessivo (il numero di file sta nelle
    // Proprietà) — una misura che si legge uguale in tutte le lingue.
    if (r.node) return formatBytes(r.node.bytes);
    return r.isFolder ? objCount(r.folder!.items.length) : formatBytes(sizes[r.p!.id]);
  };
  const rowDateText = (r: Row) => {
    if (r.node) return formatDate(r.node.date);
    return r.isFolder
      ? formatDate(r.folder!.items.reduce((max, p) => (p.modified > max ? p.modified : max), ""))
      : formatDate(r.p!.modified);
  };
  const rowTypeText = (r: Row) => {
    if (r.node) return repoTypeLabel(r.node);
    return r.isFolder ? "Cartella" : typeLabel(r.p!.kind);
  };
  const rowSortVal = (r: Row, col: SortCol): number | string => {
    if (col === "size") {
      if (r.node) return r.node.bytes;
      return r.isFolder ? r.folder!.items.length : sizes[r.p!.id] ?? -1;
    }
    if (col === "modified") {
      if (r.node) return parseModified(r.node.date);
      return r.isFolder
        ? Math.max(0, ...r.folder!.items.map((p) => parseModified(p.modified)))
        : parseModified(r.p!.modified);
    }
    return r.name.toLowerCase();
  };

  const fileRow = (p: Project): Row => ({ id: p.id, isFolder: false, p, name: p.title });
  const folderRow = (f: FolderDef): Row => ({ id: f.id, isFolder: true, folder: f, name: f.label });
  const nodeRow = (e: RepoEntry): Row => ({ id: e.id, isFolder: e.dir, node: e, name: e.name });

  // ── Contenuto della posizione corrente ──
  const q = query.trim().toLowerCase();
  const rows = useMemo<Row[]>(() => {
    let list: Row[];
    if (place === "codice") {
      // Il repository ha una vita a parte: la ricerca qui cerca nei percorsi
      // dei file versionati, non fra i progetti dell'archivio.
      const files = repo?.allFiles ?? [];
      list = q
        // Nei risultati il nome è il percorso intero: dice da dove viene il file.
        ? files.filter((e) => e.path.toLowerCase().includes(q)).slice(0, 400)
            .map((e) => ({ ...nodeRow(e), name: e.path }))
        : (repo?.byDir.get(repoPath) ?? []).map(nodeRow);
    } else if (q) {
      // La ricerca è globale: cerca in tutto l'archivio, non solo qui dentro.
      list = items
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
        )
        .map(fileRow);
    } else {
      switch (place) {
        case "home": {
          const filed = new Set(folders.flatMap((f) => f.items.map((p) => p.id)));
          list = [
            ...folders.map(folderRow),
            ...items.filter((p) => !filed.has(p.id)).map(fileRow),
          ];
          break;
        }
        case "recenti":
          list = items.map(fileRow);
          break;
        case "preferiti":
          // I preferiti tengono insieme le due nature dell'archivio: i progetti
          // e i file del repository (le loro chiavi sono "repo:<percorso>").
          list = [
            ...items.filter((p) => starred.has(p.id)).map(fileRow),
            ...(repo?.allFiles ?? []).filter((e) => starred.has(e.id)).map(nodeRow),
          ];
          break;
        case "cestino":
          list = [];
          break;
        default:
          list = (currentFolder?.items ?? []).map(fileRow);
      }
    }
    // In "Recenti" comanda la data; altrove l'ordinamento scelto, cartelle prima.
    const eff: SortState = place === "recenti" && !q ? { col: "modified", dir: "desc" } : sort;
    const dir = eff.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      const va = rowSortVal(a, eff.col);
      const vb = rowSortVal(b, eff.col);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "it") * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, folders, place, q, sort, sizes, starred, currentFolder, repo, repoPath]);

  // ── Azioni ──
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  };

  const toggleSort = (col: SortCol) =>
    setSort((s) => (s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: col === "name" ? "asc" : "desc" }));

  const goTo = (id: PlaceId, path = "") => {
    if (onPlace) onPlace(id);
    else setPlaceState(id);
    if (id === "codice") setRepoPath(path);
    setSelected(new Set());
    setQuery("");
  };

  /** Entra in una cartella del repository (o torna alla radice con ""). */
  const goRepo = (path: string) => {
    setRepoPath(path);
    setSelected(new Set());
    setQuery("");
  };

  const openOnline = (p: Project) => {
    if (p.url.startsWith("/") && p.kind !== "doc") {
      // Pagina interna: in produzione vive sul suo sottodominio (cross-origin),
      // in dev/preview resta navigazione SPA.
      if (isProdHost()) window.location.href = urlForPath(p.url);
      else navigate(p.url);
    } else window.open(p.url, "_blank", "noopener,noreferrer");
  };

  const openRow = (r: Row) => {
    if (r.node) {
      // Cartella del repository: ci si entra. File: apre le proprietà (il
      // contenuto del codice non è pubblicato, i metadati sì).
      if (r.node.dir) goRepo(r.node.path);
      else setPropsRow(r);
      return;
    }
    if (r.isFolder) goTo(r.folder!.id);
    else openOnline(r.p!);
  };

  const download = (p: Project) => {
    const href = zipHref(p);
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    if (href.startsWith("/")) a.download = p.kind === "doc" ? "" : `${p.id}.zip`;
    else {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyText = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).then(
      () => showToast(msg),
      () => showToast(text),
    );
  };

  const copyLink = (p: Project) => {
    const url = p.url.startsWith("/")
      ? (isProdHost() ? urlForPath(p.url) : window.location.origin + p.url)
      : p.url;
    copyText(url, "Link copiato negli appunti");
  };

  const toggleStar = (id: string) =>
    setStarred((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectAll = () => setSelected(new Set(rows.map((r) => r.id)));

  // ── Selezione (click): singola, o aggiungi/togli con Ctrl/⌘ ──
  const selectRow = (e: React.MouseEvent, id: string) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      });
    } else {
      setSelected(new Set([id]));
    }
  };

  // "Posizione" di una voce: host canonico. Le pagine interne vivono sul loro
  // sottodominio (trivia.albertopecchini.it); gli asset (PDF/zip) sul dominio hub.
  const locationOf = (p: Project) => {
    if (!p.url.startsWith("/")) return p.url.replace(/^https?:\/\//, "");
    const sub = subForPath(p.url);
    return sub ? `${sub}.albertopecchini.it` : `albertopecchini.it${p.url}`;
  };

  // ── Selezione a rettangolo (rubber band) ──
  const startMarquee = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (e.pointerType === "touch") return;
    const t = e.target as HTMLElement;
    if (t.closest(".sb-ar-row, .sb-ar-tile, .sb-ar-cols, button, a, input")) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    const base = additive ? new Set(selected) : new Set<string>();
    if (!additive) setSelected(new Set());
    let started = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!started && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      started = true;
      const x = Math.min(startX, ev.clientX);
      const y = Math.min(startY, ev.clientY);
      const w = Math.abs(dx);
      const h = Math.abs(dy);
      setMarquee({ x, y, w, h });
      const ids = new Set(base);
      scrollRef.current?.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.left < x + w && r.right > x && r.top < y + h && r.bottom > y) ids.add(el.dataset.id!);
      });
      setSelected(ids);
    };
    const up = () => {
      setMarquee(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ── Icona di una riga ──
  const RowIcon = ({ r, size = 18 }: { r: Row; size?: number }) =>
    r.node ? repoIcon(r.node, size)
      : r.isFolder ? <IcFolder size={size} />
      : kindIcon(r.p!.kind, r.p!.thumb, size);

  // Preferiti: progetti + file del repository (chiavi "repo:<percorso>").
  const starredCount =
    items.filter((p) => starred.has(p.id)).length +
    (repo?.allFiles ?? []).filter((e) => starred.has(e.id)).length;

  const selRows = rows.filter((r) => selected.has(r.id));
  const statusText =
    selRows.length === 1
      ? selRows[0].isFolder
        ? `Selezionato «${selRows[0].name}» (contiene ${
            selRows[0].node ? fileCount(selRows[0].node.files) : objCount(selRows[0].folder!.items.length)
          })`
        : `Selezionato «${selRows[0].name}» (${rowSizeText(selRows[0])})`
      : selRows.length > 1
        ? `Selezionati ${selRows.length} oggetti`
        : "";

  const placeMeta = currentFolder
    ? { label: currentFolder.label, Icon: currentFolder.Icon }
    : PLACE_META[place as Exclude<PlaceId, FolderId>];

  // ── Voci del menu contestuale di una riga ──
  const rowMenuItems = (r: Row) => {
    if (r.node) {
      const e = r.node;
      const meta = repo?.meta;
      return (
        <>
          {e.dir ? (
            <ContextMenu.Item className="sb-ar-mi" onSelect={() => goRepo(e.path)}>Apri</ContextMenu.Item>
          ) : (
            <ContextMenu.Item className="sb-ar-mi" onSelect={() => setPropsRow(r)}>Apri</ContextMenu.Item>
          )}
          {meta && (
            <ContextMenu.Item
              className="sb-ar-mi"
              onSelect={() => window.open(repoFileUrl(meta, e), "_blank", "noopener,noreferrer")}
            >
              Apri su GitHub
            </ContextMenu.Item>
          )}
          <ContextMenu.Item className="sb-ar-mi" onSelect={() => copyText(e.path, "Percorso copiato negli appunti")}>
            Copia percorso
          </ContextMenu.Item>
          {!e.dir && (
            <>
              <div className="sb-ar-menu-sep" />
              <ContextMenu.Item className="sb-ar-mi" onSelect={() => toggleStar(e.id)}>
                {starred.has(e.id) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
              </ContextMenu.Item>
            </>
          )}
          <div className="sb-ar-menu-sep" />
          <ContextMenu.Item className="sb-ar-mi" onSelect={() => setPropsRow(r)}>Proprietà</ContextMenu.Item>
        </>
      );
    }
    if (r.isFolder) {
      return (
        <>
          <ContextMenu.Item className="sb-ar-mi" onSelect={() => goTo(r.folder!.id)}>Apri</ContextMenu.Item>
          <div className="sb-ar-menu-sep" />
          <ContextMenu.Item className="sb-ar-mi" onSelect={() => setPropsRow(r)}>Proprietà</ContextMenu.Item>
        </>
      );
    }
    const p = r.p!;
    const href = zipHref(p);
    return (
      <>
        <ContextMenu.Item className="sb-ar-mi" onSelect={() => openOnline(p)}>Apri</ContextMenu.Item>
        <ContextMenu.Item className="sb-ar-mi" disabled={!href} onSelect={() => download(p)}>
          {p.kind === "doc" ? "Scarica PDF" : "Scarica ZIP"}
        </ContextMenu.Item>
        <ContextMenu.Item className="sb-ar-mi" onSelect={() => copyLink(p)}>Copia link</ContextMenu.Item>
        <div className="sb-ar-menu-sep" />
        <ContextMenu.Item className="sb-ar-mi" onSelect={() => toggleStar(p.id)}>
          {starred.has(p.id) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        </ContextMenu.Item>
        <div className="sb-ar-menu-sep" />
        <ContextMenu.Item className="sb-ar-mi" onSelect={() => setPropsRow(r)}>Proprietà</ContextMenu.Item>
      </>
    );
  };

  const sortArrow = (col: SortCol) =>
    sort.col === col ? (sort.dir === "asc" ? <IcArrowUp size={13} /> : <IcArrowDown size={13} />) : null;

  // Briciole del percorso dentro il repository: src → app → site …
  const repoCrumbs = repoPath
    ? repoPath.split("/").map((name, i, all) => ({ name, path: all.slice(0, i + 1).join("/") }))
    : [];

  return (
    <div className={`sb-ar-ex${embedded ? " sb-ar-ex--embed" : ""}`} role="application" aria-label="Archivio progetti">
      {/* ── Barra degli strumenti: percorso · ricerca · vista · opzioni ── */}
      <div className="sb-ar-bar">
        <nav className="sb-ar-crumbs" aria-label="Percorso">
          <button type="button" className={`sb-ar-crumb${place === "home" && !q ? " is-last" : ""}`} onClick={() => goTo("home")}>
            <IcHome size={14} /> Home
          </button>
          {(place !== "home" || q) && (
            <>
              <span className="sb-ar-crumb-sep" aria-hidden="true"><IcChevronRight size={13} /></span>
              {place === "codice" ? (
                <>
                  {/* Radice del repository, poi una briciola per cartella aperta */}
                  <button
                    type="button"
                    className={`sb-ar-crumb${!repoPath && !q ? " is-last" : ""}`}
                    onClick={() => goRepo("")}
                  >
                    <SiGithub size={13} aria-hidden="true" /> Codice sorgente
                  </button>
                  {q ? (
                    <>
                      <span className="sb-ar-crumb-sep" aria-hidden="true"><IcChevronRight size={13} /></span>
                      <span className="sb-ar-crumb is-last"><IcSearch size={14} /> Risultati</span>
                    </>
                  ) : (
                    repoCrumbs.map((c, i) => (
                      <span key={c.path} className="sb-ar-crumbseg">
                        <span className="sb-ar-crumb-sep" aria-hidden="true"><IcChevronRight size={13} /></span>
                        <button
                          type="button"
                          className={`sb-ar-crumb${i === repoCrumbs.length - 1 ? " is-last" : ""}`}
                          onClick={() => goRepo(c.path)}
                          translate="no"
                        >
                          {c.name}
                        </button>
                      </span>
                    ))
                  )}
                </>
              ) : (
                <span className="sb-ar-crumb is-last">
                  {q ? <><IcSearch size={14} /> Risultati</> : <>{placeMeta && <placeMeta.Icon size={14} />} {placeMeta?.label}</>}
                </span>
              )}
            </>
          )}
        </nav>

        <div className="sb-ar-search">
          <IcSearch size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            placeholder={place === "codice" ? "Cerca fra i file…" : "Cerca nell'archivio…"}
            aria-label={place === "codice" ? "Cerca fra i file del repository" : "Cerca nell'archivio"}
          />
          {q && (
            <button type="button" onClick={() => setQuery("")} aria-label="Chiudi la ricerca"><IcClose size={13} /></button>
          )}
        </div>

        <div className="sb-ar-seg" role="group" aria-label="Vista">
          <button type="button" className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} title="Vista a elenco" aria-label="Vista a elenco" aria-pressed={view === "list"}>
            <IcList size={15} />
          </button>
          <button type="button" className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} title="Vista a griglia" aria-label="Vista a griglia" aria-pressed={view === "grid"}>
            <IcGrid size={15} />
          </button>
        </div>

        <div className="sb-ar-popwrap">
          <button
            type="button"
            className={`sb-ar-iconbtn${menuOpen ? " is-on" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            title="Opzioni di visualizzazione"
            aria-label="Opzioni di visualizzazione"
            aria-expanded={menuOpen}
          >
            <IcMore size={16} />
          </button>
          {menuOpen && (
            <div className="sb-ar-pop" role="menu">
              <div className="sb-ar-pop-label">Ordina</div>
              {([["name", "Nome"], ["size", "Dimensione"], ["modified", "Ultima modifica"]] as [SortCol, string][]).map(([col, label]) => (
                <button
                  key={col}
                  type="button"
                  className="sb-ar-pi"
                  role="menuitemradio"
                  aria-checked={sort.col === col}
                  onClick={() => setSort((s) => ({ col, dir: s.col === col ? s.dir : col === "name" ? "asc" : "desc" }))}
                >
                  <span className="sb-ar-pi-check">{sort.col === col && <IcCheck size={13} />}</span>
                  {label}
                </button>
              ))}
              <div className="sb-ar-menu-sep" />
              {([["asc", "Crescente"], ["desc", "Decrescente"]] as ["asc" | "desc", string][]).map(([dir, label]) => (
                <button key={dir} type="button" className="sb-ar-pi" role="menuitemradio" aria-checked={sort.dir === dir} onClick={() => setSort((s) => ({ ...s, dir }))}>
                  <span className="sb-ar-pi-check">{sort.dir === dir && <IcCheck size={13} />}</span>
                  {label}
                </button>
              ))}
              <div className="sb-ar-menu-sep" />
              <button type="button" className="sb-ar-pi" role="menuitem" onClick={() => { setMenuOpen(false); selectAll(); }}>
                <span className="sb-ar-pi-check" />Seleziona tutto
              </button>
              <button type="button" className="sb-ar-pi" role="menuitem" onClick={() => { setMenuOpen(false); loadManifest(); loadRepo(true); showToast("Archivio aggiornato"); }}>
                <span className="sb-ar-pi-check"><IcRotate size={13} /></span>Aggiorna
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Corpo: side-nav delle posizioni + contenuto ── */}
      <div className="sb-ar-body">
        <aside className="sb-ar-side" aria-label="Risorse">
          <nav className="sb-ar-side-group">
            {MAIN_PLACES.map((id) => {
              const meta = PLACE_META[id];
              const count =
                id === "preferiti" ? starredCount :
                id === "cestino" ? 0 : null;
              return (
                <button type="button" key={id} className={`sb-ar-si${place === id && !q ? " is-on" : ""}`} onClick={() => goTo(id)}>
                  <meta.Icon size={16} />
                  <span className="sb-ar-si-label">{meta.label}</span>
                  {count != null && count > 0 && <span className="sb-ar-si-count">{count}</span>}
                </button>
              );
            })}
          </nav>

          {folders.length > 0 && (
            <nav className="sb-ar-side-group">
              <div className="sb-ar-side-label">Cartelle</div>
              {folders.map((f) => (
                <button type="button" key={f.id} className={`sb-ar-si${place === f.id && !q ? " is-on" : ""}`} onClick={() => goTo(f.id)}>
                  <f.Icon size={16} />
                  <span className="sb-ar-si-label">{f.label}</span>
                  <span className="sb-ar-si-count">{f.items.length}</span>
                </button>
              ))}
            </nav>
          )}

          {repo && (
            <nav className="sb-ar-side-group">
              <div className="sb-ar-side-label">Repository</div>
              <button
                type="button"
                className={`sb-ar-si${place === "codice" && !q ? " is-on" : ""}`}
                onClick={() => goTo("codice")}
              >
                <PLACE_META.codice.Icon size={16} />
                <span className="sb-ar-si-label">{PLACE_META.codice.label}</span>
                <span className="sb-ar-si-count">{repo.meta.files}</span>
              </button>
              <span className="sb-ar-si sb-ar-si--branch" title={`Ramo ${repo.meta.branch}`}>
                <IcGitBranch size={16} />
                <span className="sb-ar-si-label" translate="no">{repo.meta.branch}</span>
                <span className="sb-ar-si-count" translate="no">{repo.meta.commit.short}</span>
              </span>
            </nav>
          )}

          <div className="sb-ar-side-bottom">
            <a
              className="sb-ar-si sb-ar-si--host"
              href="https://albertopecchini.it"
              target="_blank"
              rel="noreferrer noopener"
            >
              <IcGlobe size={16} />
              <span className="sb-ar-si-label" translate="no">albertopecchini.it</span>
              <IcExternal size={13} />
            </a>
          </div>
        </aside>

        <main className="sb-ar-main">
          {/* Striscia dell'ultimo commit: l'elenco qui sotto è quello del
              repository a questo commit, rigenerato ad ogni build. */}
          {place === "codice" && repo && (
            <div className="sb-ar-commit">
              <IcGitCommit size={15} />
              <span className="sb-ar-commit-t">
                Ultimo commit{" "}
                <a
                  className="sb-ar-commit-sha"
                  href={repoCommitUrl(repo.meta)}
                  target="_blank"
                  rel="noreferrer noopener"
                  translate="no"
                >
                  {repo.meta.commit.short}
                </a>{" "}
                · <span translate="no">{repo.meta.commit.message}</span>
              </span>
              <span className="sb-ar-commit-d" translate="no">{formatDate(repo.meta.commit.date)}</span>
            </div>
          )}

          <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
              <div className="sb-ar-scroll" ref={scrollRef} onPointerDown={startMarquee}>
                {view === "list" ? (
                  <div className="sb-ar-table" role="table" aria-label="Elenco elementi">
                    <div className="sb-ar-cols" role="row">
                      <button type="button" className="sb-ar-col sb-ar-col--name" onClick={() => toggleSort("name")} role="columnheader">
                        Nome {sortArrow("name")}
                      </button>
                      <span className="sb-ar-col sb-ar-col--type" role="columnheader">Tipo</span>
                      <button type="button" className="sb-ar-col sb-ar-col--size" onClick={() => toggleSort("size")} role="columnheader">
                        Dimensione {sortArrow("size")}
                      </button>
                      <button type="button" className="sb-ar-col sb-ar-col--date" onClick={() => toggleSort("modified")} role="columnheader">
                        Modificato {sortArrow("modified")}
                      </button>
                      <span className="sb-ar-col sb-ar-col--star" aria-hidden="true" />
                    </div>

                    {rows.map((r) => (
                      <ContextMenu.Root key={r.id}>
                        <ContextMenu.Trigger asChild>
                          <div
                            data-id={r.id}
                            role="row"
                            tabIndex={0}
                            className={`sb-ar-row${selected.has(r.id) ? " is-sel" : ""}`}
                            onClick={(e) => selectRow(e, r.id)}
                            onDoubleClick={() => openRow(r)}
                            onKeyDown={(e) => { if (e.key === "Enter") openRow(r); }}
                            onContextMenu={(e) => e.stopPropagation()}
                          >
                            <span className="sb-ar-cell sb-ar-cell--name">
                              <span className="sb-ar-rowico" aria-hidden="true"><RowIcon r={r} /></span>
                              <span className="sb-ar-cell-txt" translate={r.node ? "no" : undefined}>{r.name}</span>
                            </span>
                            <span className="sb-ar-cell sb-ar-cell--type">{rowTypeText(r)}</span>
                            <span className="sb-ar-cell sb-ar-cell--size">{rowSizeText(r)}</span>
                            <span className="sb-ar-cell sb-ar-cell--date">{rowDateText(r)}</span>
                            <span className="sb-ar-cell sb-ar-cell--star">
                              {!r.isFolder && (
                                <button
                                  type="button"
                                  className={`sb-ar-star${starred.has(r.id) ? " is-on" : ""}`}
                                  onClick={(e) => { e.stopPropagation(); toggleStar(r.id); }}
                                  title={starred.has(r.id) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                                  aria-label={starred.has(r.id) ? `Rimuovi ${r.name} dai preferiti` : `Aggiungi ${r.name} ai preferiti`}
                                >
                                  <IcStar size={15} filled={starred.has(r.id)} />
                                </button>
                              )}
                            </span>
                          </div>
                        </ContextMenu.Trigger>
                        <ContextMenu.Portal>
                          <ContextMenu.Content className="sb-ar-menu">{rowMenuItems(r)}</ContextMenu.Content>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    ))}
                  </div>
                ) : (
                  <div className="sb-ar-grid">
                    {rows.map((r) => (
                      <ContextMenu.Root key={r.id}>
                        <ContextMenu.Trigger asChild>
                          <div
                            data-id={r.id}
                            tabIndex={0}
                            className={`sb-ar-tile${selected.has(r.id) ? " is-sel" : ""}`}
                            onClick={(e) => selectRow(e, r.id)}
                            onDoubleClick={() => openRow(r)}
                            onKeyDown={(e) => { if (e.key === "Enter") openRow(r); }}
                            onContextMenu={(e) => e.stopPropagation()}
                          >
                            <span className="sb-ar-tile-ico" aria-hidden="true">
                              <RowIcon r={r} size={26} />
                              {!r.isFolder && starred.has(r.id) && (
                                <span className="sb-ar-tile-star"><IcStar size={12} filled /></span>
                              )}
                            </span>
                            <span className="sb-ar-tile-name" translate={r.node ? "no" : undefined}>{r.name}</span>
                            <span className="sb-ar-tile-meta">{rowSizeText(r)}</span>
                          </div>
                        </ContextMenu.Trigger>
                        <ContextMenu.Portal>
                          <ContextMenu.Content className="sb-ar-menu">{rowMenuItems(r)}</ContextMenu.Content>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    ))}
                  </div>
                )}

                {/* Stati vuoti */}
                {rows.length === 0 && (
                  <div className="sb-ar-empty">
                    {place === "codice" && !repo ? (
                      <><SiGithub size={40} aria-hidden="true" /><p className="sb-ar-empty-t">Elenco dei file non disponibile</p><p className="sb-ar-empty-s">La fotografia del repository si genera in fase di build.</p></>
                    ) : place === "cestino" && !q ? (
                      <><IcTrash size={40} /><p className="sb-ar-empty-t">Il cestino è vuoto</p><p className="sb-ar-empty-s">Qui non si butta via niente.</p></>
                    ) : place === "preferiti" && !q ? (
                      <><IcStar size={40} /><p className="sb-ar-empty-t">Nessun preferito</p><p className="sb-ar-empty-s">Premi la stellina su un elemento per ritrovarlo qui.</p></>
                    ) : (
                      <><IcSearch size={40} /><p className="sb-ar-empty-t">Nessun risultato</p><p className="sb-ar-empty-s">Prova con un termine diverso.</p></>
                    )}
                  </div>
                )}
              </div>
            </ContextMenu.Trigger>

            {/* Menu tasto-destro sullo sfondo */}
            <ContextMenu.Portal>
              <ContextMenu.Content className="sb-ar-menu" collisionPadding={8}>
                <ContextMenu.Item className="sb-ar-mi" onSelect={selectAll}>Seleziona tutto</ContextMenu.Item>
                <ContextMenu.Item className="sb-ar-mi" onSelect={() => { loadManifest(); loadRepo(true); showToast("Archivio aggiornato"); }}>
                  Aggiorna
                </ContextMenu.Item>
                <div className="sb-ar-menu-sep" />
                <ContextMenu.Item
                  className="sb-ar-mi"
                  disabled={selRows.length === 0}
                  onSelect={() => selRows[0] && setPropsRow(selRows[0])}
                >
                  Proprietà
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>

          {/* Pillola di stato della selezione */}
          {statusText && <div className="sb-ar-status" role="status">{statusText}</div>}

          {/* Notifica breve */}
          {toast && <div className="sb-ar-toast" role="status">{toast}</div>}
        </main>
      </div>

      {/* ── Finestra Proprietà (dialogo modale) ── */}
      {propsRow && (
        <div className="sb-ar-props" role="dialog" aria-modal="true" aria-label={`Proprietà di ${propsRow.name}`}>
          <div className="sb-ar-props-scrim" onClick={() => setPropsRow(null)} aria-hidden="true" />
          <div className="sb-panel sb-ar-props-panel">
            <div className="sb-panel-inner sb-ar-props-inner">
              <div className="sb-ar-props-bar">
                <span>Proprietà</span>
                <button type="button" className="sb-ar-iconbtn" onClick={() => setPropsRow(null)} aria-label="Chiudi"><IcClose size={16} /></button>
              </div>
              <div className="sb-ar-props-scroll">
                <div className="sb-ar-props-hero">
                  <span className="sb-ar-props-ico" aria-hidden="true"><RowIcon r={propsRow} size={26} /></span>
                  <div>
                    <span className="sb-ar-props-name" translate={propsRow.node ? "no" : undefined}>
                      {propsRow.node ? propsRow.node.name : propsRow.name}
                    </span>
                    <span className="sb-ar-props-cat" translate={propsRow.node ? "no" : undefined}>
                      {propsRow.node
                        ? `${repo?.meta.repo ?? ""}/${parentDir(propsRow.node.path)}`.replace(/\/$/, "")
                        : propsRow.isFolder ? "Cartella in evidenza" : propsRow.p!.category}
                    </span>
                  </div>
                </div>

                {propsRow.node && repo && (
                  <>
                    <div className="sb-ar-props-actions">
                      {propsRow.node.dir && (
                        <button
                          type="button"
                          className="sb-btn sb-btn--sm sb-btn--primary"
                          onClick={() => { const e = propsRow.node!; setPropsRow(null); goTo("codice", e.path); }}
                        >
                          <IcFolder size={14} /> Apri cartella
                        </button>
                      )}
                      <a
                        className="sb-btn sb-btn--sm sb-btn--secondary"
                        href={repoFileUrl(repo.meta, propsRow.node)}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <SiGithub size={14} aria-hidden="true" /> Apri su GitHub
                      </a>
                      <button
                        type="button"
                        className="sb-btn sb-btn--sm sb-btn--secondary"
                        onClick={() => copyText(propsRow.node!.path, "Percorso copiato negli appunti")}
                      >
                        <IcLink size={14} /> Copia percorso
                      </button>
                    </div>

                    <div className="sb-ar-props-list">
                      <div className="sb-ar-props-row">
                        <span>Percorso</span>
                        <b translate="no">{propsRow.node.path}</b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>Tipo</span>
                        <b>{rowTypeText(propsRow)}</b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>{propsRow.node.dir ? "Contenuto" : "Dimensione"}</span>
                        <b>
                          {propsRow.node.dir
                            ? `${fileCount(propsRow.node.files)} · ${formatBytes(propsRow.node.bytes)}`
                            : formatBytes(propsRow.node.bytes)}
                        </b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>Ultima modifica</span>
                        <b>{formatDate(propsRow.node.date)}</b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>Repository</span>
                        <b translate="no">{repo.meta.repo} · {repo.meta.branch}</b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>Ultimo commit</span>
                        <b translate="no">{repo.meta.commit.short} · {formatDate(repo.meta.commit.date)}</b>
                      </div>
                      <div className="sb-ar-props-row">
                        <span>Autore</span>
                        <b translate="no">{AUTHOR}</b>
                      </div>
                    </div>

                    <div className="sb-ar-props-sec">Cronologia</div>
                    <p className="sb-ar-props-note">
                      L'elenco è la fotografia dei file versionati a questo commit: si rigenera
                      ad ogni build del sito, quindi segue il repository commit dopo commit.
                    </p>
                    <a
                      className="sb-link"
                      href={repoHistoryUrl(repo.meta, propsRow.node)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Vedi la cronologia su GitHub <IcArrowRight size={14} />
                    </a>
                  </>
                )}

                {!propsRow.node && !propsRow.isFolder && (
                  <div className="sb-ar-props-actions">
                    <button type="button" className="sb-btn sb-btn--sm sb-btn--primary" onClick={() => openOnline(propsRow.p!)}>
                      <IcExternal size={14} /> Apri online
                    </button>
                    {zipHref(propsRow.p!) && (
                      <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={() => download(propsRow.p!)}>
                        <IcDownload size={14} /> {propsRow.p!.kind === "doc" ? "Scarica PDF" : "Scarica ZIP"}
                      </button>
                    )}
                    <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={() => copyLink(propsRow.p!)}>
                      <IcLink size={14} /> Copia link
                    </button>
                  </div>
                )}
                {!propsRow.node && propsRow.isFolder && (
                  <div className="sb-ar-props-actions">
                    <button type="button" className="sb-btn sb-btn--sm sb-btn--primary" onClick={() => { setPropsRow(null); goTo(propsRow.folder!.id); }}>
                      <IcFolder size={14} /> Apri cartella
                    </button>
                  </div>
                )}

                {!propsRow.node && (
                <div className="sb-ar-props-list">
                  <div className="sb-ar-props-row">
                    <span>Tipo</span>
                    <b>{rowTypeText(propsRow)}</b>
                  </div>
                  <div className="sb-ar-props-row">
                    <span>{propsRow.isFolder ? "Contenuto" : "Dimensione"}</span>
                    <b>{rowSizeText(propsRow)}</b>
                  </div>
                  <div className="sb-ar-props-row">
                    <span>Posizione</span>
                    <b translate="no">{propsRow.isFolder ? "albertopecchini.it/archivio" : locationOf(propsRow.p!)}</b>
                  </div>
                  <div className="sb-ar-props-row">
                    <span>Modificato</span>
                    <b>{rowDateText(propsRow)}</b>
                  </div>
                  <div className="sb-ar-props-row">
                    <span>Autore</span>
                    <b translate="no">{AUTHOR}</b>
                  </div>
                  {!propsRow.isFolder && propsRow.p!.tags?.length ? (
                    <div className="sb-ar-props-row">
                      <span>Tag</span>
                      <b>{propsRow.p!.tags!.join(", ")}</b>
                    </div>
                  ) : null}
                </div>
                )}

                {!propsRow.node && !propsRow.isFolder && (
                  <>
                    <div className="sb-ar-props-sec" data-no-i18n>README</div>
                    <div className="sb-ar-props-readme"><ReadmeView text={readmeOf(propsRow.p!)} /></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rettangolo di selezione (rubber band) — coordinate viewport */}
      {marquee && (
        <div
          className="sb-ar-marquee"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagina /archivio
// ─────────────────────────────────────────────────────────────────────────────
export default function Archivio() {
  const [scrolled, setScrolled] = useState(false);
  const [place, setPlace] = useState<PlaceId>("home");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Archivio progetti — Alberto Pecchini";
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const folders = useMemo(archiveFolders, []);
  const lastUpdate = useMemo(
    () => formatDate([...PROJECTS, ...MATERIALS].reduce((max, p) => (p.modified > max ? p.modified : max), "")),
    [],
  );

  // Dati del repository per la striscia di numeri (stesso JSON del pannello:
  // la promessa è in cache, quindi non c'è una seconda richiesta).
  const [repoMeta, setRepoMeta] = useState<RepoMeta | null>(null);
  useEffect(() => {
    loadRepoTree().then((t) => setRepoMeta(t?.meta ?? null));
  }, []);

  // Card "Cartelle in evidenza": aprono la cartella nel pannello e ci portano su.
  const openFolder = (id: PlaceId) => {
    setPlace(id);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const KINDS: { kind: ProjectKind; Icon: (p: IcProps) => JSX.Element }[] = [
    { kind: "page",  Icon: IcBook },
    { kind: "game",  Icon: IcGame },
    { kind: "site",  Icon: IcGlobe },
    { kind: "tool",  Icon: IcVenn },
    { kind: "doc",   Icon: IcFile },
  ];

  return (
    <div className="sb-home sb-home--fx ar-page" data-acc="blu">
      <PageBackdrop />
      {/* Skiplink — requisito di accessibilità (come la home) */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: brand del sito + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-ar-tagline">Archivio progetti</span>
          </Link>
          <div className="sb-nav-right">
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer noopener"
              className="sb-btn sb-btn--sm sb-btn--ghost"
            >
              <SiGithub size={15} aria-hidden="true" />
              <span className="sb-btn--gh-label" translate="no">GitHub</span>
            </a>
            <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-btn--keep">
              <IcArrowLeft size={15} />
              <span>Torna alla home</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero — titolo a sinistra, spiegazione a destra */}
        <section className="sb-hero" aria-labelledby="ar-hero-title">
          <div className="sb-container">
            <div className="sb-hero-grid">
              <h1 className="sb-hero-title" id="ar-hero-title">
                <span>Archivio progetti</span>
                <ShinyBrandline text="Tutto il sito, cartella per cartella" className="sb-brandline" />
              </h1>
              <div className="sb-hero-copy">
                <p>
                  <strong>Qui dentro c'è ogni cosa che ho costruito: pagine, giochi web, siti per clienti e documenti PDF, con data, dimensione e sorgenti.</strong>
                </p>
                <p>
                  Apri le cartelle, ordina le colonne, metti la stellina sui preferiti: le proprietà di ogni voce mostrano il README, e da lì apri il progetto online o scarichi i sorgenti in ZIP.
                </p>
              </div>
            </div>
            <SparkGroup className="sb-hero-actions">
              <a href="#esplora" className="sb-btn sb-btn--primary">Sfoglia l'archivio</a>
              <a href={REPO} target="_blank" rel="noreferrer noopener" className="sb-btn sb-btn--secondary">
                <SiGithub size={16} aria-hidden="true" /> Vedi il codice su GitHub
              </a>
            </SparkGroup>

            {/* Striscia di numeri (≈ i contatori del dashboard) */}
            <div className="sb-ar-stats">
              {[
                { value: `${PROJECTS.length}`, label: "Progetti pubblicati" },
                { value: `${MATERIALS.length}`, label: "Documenti PDF" },
                repoMeta
                  ? { value: `${repoMeta.files}`, label: "File nel repository" }
                  : { value: `${folders.length}`, label: "Cartelle in evidenza" },
                { value: repoMeta ? formatDate(repoMeta.commit.date) : lastUpdate, label: "Ultimo aggiornamento" },
              ].map((s) => (
                <div className="sb-panel sb-ar-stat" key={s.label}>
                  <div className="sb-panel-inner sb-ar-stat-inner">
                    <span className="sb-ar-stat-value" translate="no">{s.value}</span>
                    <span className="sb-ar-stat-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ② Il pannello-dashboard: l'archivio vero e proprio */}
        <section id="esplora" className="sb-section sb-ar-section" ref={panelRef}>
          <div className="sb-container">
            <div className="sb-sechead">
              <h2>Sfoglia l'archivio senza lasciare la pagina</h2>
              <p>
                Elenco o griglia, ricerca globale, preferiti e proprietà con il README: doppio
                clic apre, il tasto destro fa il resto.
              </p>
              <p>
                Nella posizione «Codice sorgente» ci sono i file veri del repository, con
                dimensione e data dell'ultimo commit: l'elenco si rigenera ad ogni build.
              </p>
            </div>

            <div className="sb-ar-frame">
              <div className="sb-panel">
                <div className="sb-panel-inner">
                  <ArchivioExplorer place={place} onPlace={setPlace} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ③ Cartelle in evidenza — card che pilotano il pannello */}
        <section className="sb-section" aria-labelledby="ar-cartelle">
          <div className="sb-container">
            <div className="sb-splithead">
              <h3 id="ar-cartelle">Cartelle in evidenza</h3>
              <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary">Torna alla home</Link>
            </div>
            <div className="sb-ar-folders">
              {folders.map((f) => (
                <button type="button" key={f.id} className="sb-ar-folder" onClick={() => openFolder(f.id)}>
                  <div className="sb-panel">
                    <div className="sb-panel-inner sb-ar-folder-inner">
                      <div className="sb-ar-folder-top">
                        <f.Icon size={20} />
                        <IcArrowRight size={16} className="go" />
                      </div>
                      <h4>{f.label}</h4>
                      <p>{f.items.length === 1 ? "1 oggetto" : `${f.items.length} oggetti`}</p>
                      <span className="sb-ar-folder-list" translate="no">
                        {f.items.map((p) => p.title).join(" · ")}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ④ Legenda dei tipi (le stesse etichette delle colonne "Tipo") */}
        <section className="sb-section" aria-labelledby="ar-tipi">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3 id="ar-tipi">Cosa trovi nell'archivio</h3>
              <p>Ogni voce ha un tipo: le colonne della tabella usano queste etichette.</p>
            </div>
            <div className="sb-chiprow sb-ar-kinds">
              {KINDS.map(({ kind, Icon }) => (
                <span className="sb-chip" key={kind}>
                  <Icon size={15} /> {typeLabel(kind)}
                  <b className="sb-ar-kind-count" translate="no">
                    {[...PROJECTS, ...MATERIALS].filter((p) => p.kind === kind).length}
                  </b>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ CTA finale */}
        <section className="sb-section sb-cta">
          <div className="sb-container">
            <h2>
              Ti serve il codice?
              <ShinyBrandline text="È tutto aperto." className="sb-brandline" />
            </h2>
            <p>
              I sorgenti di ogni progetto sono su GitHub, oppure li scarichi in ZIP dalle
              proprietà di ciascuna voce dell'archivio.
            </p>
            <SparkGroup className="sb-cta-actions">
              <a href={REPO} target="_blank" rel="noreferrer noopener" className="sb-btn sb-btn--primary">
                <SiGithub size={16} aria-hidden="true" /> Vedi il codice su GitHub
              </a>
              <Link to="/" className="sb-btn sb-btn--secondary">
                <IcArrowLeft size={16} /> Torna alla home
              </Link>
            </SparkGroup>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
