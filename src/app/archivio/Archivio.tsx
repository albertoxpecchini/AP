import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {
  Folder,
  FolderOpen,
  Monitor,
  Star,
  Gamepad2,
  Globe,
  FileText,
  GraduationCap,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Scissors,
  Copy,
  ClipboardPaste,
  Pencil,
  Share2,
  Trash2,
  MoreHorizontal,
  Plus,
  Minus,
  Square,
  X,
  List,
  LayoutGrid,
  Download,
  ExternalLink,
  Link2,
  Check,
} from "lucide-react";
import {
  PROJECTS,
  MATERIALS,
  MATURITA_URLS,
  GAMES_URLS,
  ProjectIcon,
  typeLabel,
  formatBytes,
  formatDate,
  parseModified,
  zipHref,
  type Project,
} from "../site/projects";
import "./archivio.css";

// ─────────────────────────────────────────────────────────────────────────────
// "Esplora File di Windows 11" per i progetti. Contiene tutto il lavoro
// (progetti + materiali PDF), con colonne ordinabili/ridimensionabili, menu
// colonne col tasto destro, selezione a rettangolo (marquee) blu come Windows,
// download ZIP per progetto e apertura online. Segue il tema globale chiaro/
// scuro (CSS su html.dark); etichette in italiano; font del Design System Italia.
//
// <ArchivioExplorer/> è riusabile: la pagina /archivio lo avvolge in .ax-root
// (finestra a tutto schermo), la home lo incorpora in .ax-embed.
//   · pulsanti finestra: − e × tornano alla pagina precedente; □ apre /archivio.
// ─────────────────────────────────────────────────────────────────────────────

const ALL: Project[] = [...PROJECTS, ...MATERIALS];
const ACTIONS_W = 104;

type ColKey =
  | "name" | "modified" | "type" | "size"
  | "created" | "authors" | "categories" | "tags" | "title";

interface Col {
  key: ColKey;
  label: string;
  min: number;
  def: number;
  optional: boolean;
  numeric?: boolean;
}

const COLUMNS: Col[] = [
  { key: "name",       label: "Nome",            min: 170, def: 290, optional: false },
  { key: "modified",   label: "Ultima modifica", min: 120, def: 150, optional: true },
  { key: "type",       label: "Tipo",            min: 120, def: 190, optional: true },
  { key: "size",       label: "Dimensione",      min: 96,  def: 120, optional: true, numeric: true },
  { key: "created",    label: "Data creazione",  min: 120, def: 150, optional: true },
  { key: "authors",    label: "Autori",          min: 120, def: 160, optional: true },
  { key: "categories", label: "Categorie",       min: 140, def: 210, optional: true },
  { key: "tags",       label: "Tag",             min: 140, def: 240, optional: true },
  { key: "title",      label: "Titolo",          min: 140, def: 200, optional: true },
];

const DEF_WIDTHS = Object.fromEntries(COLUMNS.map((c) => [c.key, c.def])) as Record<ColKey, number>;
const DEFAULT_VISIBLE: ColKey[] = ["modified", "type", "size"];

type FolderId = "root" | "maturita" | "giochi" | "siti" | "documenti";
type SortState = { col: ColKey; dir: "asc" | "desc" };

const AUTHOR = "Alberto Pecchini";

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

function defaultDir(col: ColKey): "asc" | "desc" {
  return col === "modified" || col === "created" || col === "size" ? "desc" : "asc";
}

export function ArchivioExplorer({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();

  const [folder, setFolder] = useState<FolderId>("root");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortState>(() => load("ap-archivio-sort", { col: "modified", dir: "desc" } as SortState));
  const [visible, setVisible] = useState<Set<ColKey>>(() => new Set(load<ColKey[]>("ap-archivio-cols", DEFAULT_VISIBLE)));
  const [widths, setWidths] = useState<Record<ColKey, number>>(() => ({ ...DEF_WIDTHS, ...load("ap-archivio-widths", {}) }));
  const [view, setView] = useState<"details" | "icons">(() => load("ap-archivio-view", "details"));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Persistenza impostazioni (come Windows che "ricorda")
  useEffect(() => save("ap-archivio-sort", sort), [sort]);
  useEffect(() => save("ap-archivio-cols", Array.from(visible)), [visible]);
  useEffect(() => save("ap-archivio-widths", widths), [widths]);
  useEffect(() => save("ap-archivio-view", view), [view]);

  useEffect(() => {
    if (!embedded) document.title = "Archivio progetti — Alberto Pecchini";
  }, [embedded]);

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

  // Cartelle "in evidenza"
  const folders = useMemo(() => {
    const find = (u: string) => PROJECTS.find((p) => p.url === u);
    const maturita = MATURITA_URLS.map(find).filter(Boolean) as Project[];
    const giochi = GAMES_URLS.map(find).filter(Boolean) as Project[];
    const siti = PROJECTS.filter((p) => p.kind === "site");
    const documenti = MATERIALS;
    return [
      { id: "maturita" as FolderId, label: "Esame di Maturità", Icon: GraduationCap, items: maturita },
      { id: "giochi" as FolderId,   label: "Giochi Web",        Icon: Gamepad2,      items: giochi },
      { id: "siti" as FolderId,     label: "Siti web",          Icon: Globe,         items: siti },
      { id: "documenti" as FolderId, label: "Documenti",        Icon: FileText,      items: documenti },
    ];
  }, []);

  const currentItems = useMemo(() => {
    if (folder === "root") return ALL;
    return folders.find((f) => f.id === folder)?.items ?? ALL;
  }, [folder, folders]);

  const folderLabel = folder === "root" ? null : folders.find((f) => f.id === folder)?.label ?? null;

  // Valore di cella (testo mostrato)
  const cellValue = (p: Project, key: ColKey): string => {
    switch (key) {
      case "name":       return p.title;
      case "modified":   return formatDate(p.modified);
      case "type":       return typeLabel(p.kind);
      case "size":       return formatBytes(sizes[p.id]);
      case "created":    return formatDate(p.modified);
      case "authors":    return AUTHOR;
      case "categories": return p.category;
      case "tags":       return (p.tags ?? []).join(", ");
      case "title":      return p.title;
    }
  };

  // Valore di ordinamento (numerico o stringa)
  const sortVal = (p: Project, key: ColKey): number | string => {
    if (key === "size") return sizes[p.id] ?? -1;
    if (key === "modified" || key === "created") return parseModified(p.modified);
    return cellValue(p, key).toLowerCase();
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? currentItems.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
        )
      : currentItems;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sort.col);
      const vb = sortVal(b, sort.col);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "it") * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItems, query, sort, sizes]);

  const visibleCols = COLUMNS.filter((c) => c.key === "name" || visible.has(c.key));
  const totalWidth = visibleCols.reduce((s, c) => s + (widths[c.key] ?? c.def), 0) + ACTIONS_W;

  // ── Azioni ──
  const toggleSort = (col: ColKey) =>
    setSort((s) => (s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: defaultDir(col) }));

  const toggleCol = (col: ColKey) =>
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });

  const autoFit = () => setWidths({ ...DEF_WIDTHS });

  const startResize = (key: ColKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widths[key] ?? DEF_WIDTHS[key];
    const min = COLUMNS.find((c) => c.key === key)!.min;
    const move = (ev: PointerEvent) => {
      const w = Math.max(min, startW + (ev.clientX - startX));
      setWidths((p) => ({ ...p, [key]: w }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const openOnline = (p: Project) => {
    if (p.url.startsWith("/") && p.kind !== "doc") navigate(p.url);
    else window.open(p.url, "_blank", "noopener,noreferrer");
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

  const copyLink = (p: Project) => {
    const url = p.url.startsWith("/") ? window.location.origin + p.url : p.url;
    navigator.clipboard?.writeText(url).then(
      () => showFlash("Link copiato negli appunti"),
      () => showFlash(url),
    );
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2200);
  };

  // ── Selezione di una riga (click): singola, o aggiungi/togli con Ctrl/⌘ ──
  const selectItem = (e: React.MouseEvent, id: string) => {
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

  // ── Selezione a rettangolo (marquee) blu, come su Windows ──
  const startMarquee = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    // lascia gestire a righe, schede, header, pulsanti, link, input, tile
    if (t.closest(".ax-row, .ax-card, .ax-th, button, a, input, .ax-tile")) return;
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

  // ── Pulsanti finestra: − e × tornano indietro; □ apre /archivio "puro" ──
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  // ── Icona-tipo (glifo bianco su riquadro colorato) ──
  const TypeGlyph = ({ p, size = 14 }: { p: Project; size?: number }) =>
    p.kind === "doc" ? <FileText size={size} strokeWidth={2.1} /> : <ProjectIcon thumb={p.thumb} size={size} />;

  return (
    <div className="ax-window" role="application" aria-label="Archivio progetti — esplora file">
      {/* ── Barra del titolo + tab + controlli finestra ── */}
      <div className="ax-titlebar">
        <span className="ax-tab">
          <FolderOpen size={16} aria-hidden="true" /> Archivio
        </span>
        <span className="ax-tab-new" aria-hidden="true"><Plus size={16} /></span>
        <div className="ax-winctl">
          <button className="ax-winbtn" onClick={goBack} title="Riduci a icona" aria-label="Riduci a icona"><Minus size={16} /></button>
          <button className="ax-winbtn" onClick={() => navigate("/archivio")} title="Ingrandisci" aria-label="Apri a tutto schermo"><Square size={12} /></button>
          <button className="ax-winbtn ax-winbtn--close" onClick={goBack} title="Chiudi" aria-label="Chiudi"><X size={17} /></button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="ax-toolbar">
        <button className="ax-tbtn ax-tbtn--solid" disabled><Plus size={16} /> <span className="ax-tbtn-lbl">Nuovo</span></button>
        <span className="ax-tsep" />
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Taglia"><Scissors size={16} /></button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Copia"><Copy size={16} /></button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Incolla"><ClipboardPaste size={16} /></button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Rinomina"><Pencil size={16} /></button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Condividi"><Share2 size={16} /></button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Elimina"><Trash2 size={16} /></button>
        <span className="ax-tsep" />
        <button
          className="ax-tbtn"
          onClick={() => setSort((s) => ({ col: s.col, dir: s.dir === "asc" ? "desc" : "asc" }))}
          title="Inverti ordinamento"
        >
          <List size={16} /> <span className="ax-tbtn-lbl">Ordina</span>
        </button>
        <button className="ax-tbtn ax-tbtn--ico" disabled title="Altro"><MoreHorizontal size={16} /></button>
        <span className="ax-tspring" />
        <div className="ax-seg" role="group" aria-label="Vista">
          <button className={view === "details" ? "is-on" : ""} onClick={() => setView("details")} title="Dettagli">
            <List size={15} /> Dettagli
          </button>
          <button className={view === "icons" ? "is-on" : ""} onClick={() => setView("icons")} title="Icone">
            <LayoutGrid size={15} /> Icone
          </button>
        </div>
      </div>

      {/* ── Barra indirizzi + ricerca ── */}
      <div className="ax-address">
        <button className="ax-navbtn" onClick={() => setFolder("root")} disabled={folder === "root"} title="Indietro"><ArrowLeft size={17} /></button>
        <button className="ax-navbtn" disabled title="Avanti"><ArrowRight size={17} /></button>
        <button className="ax-navbtn" onClick={() => setFolder("root")} disabled={folder === "root"} title="Su"><ArrowUp size={17} /></button>
        <button className="ax-navbtn" onClick={loadManifest} title="Aggiorna"><RotateCw size={15} /></button>

        <div className="ax-crumbs">
          <button className="ax-crumb" onClick={() => setFolder("root")}>
            <FolderOpen size={15} /> Archivio
          </button>
          <ChevronRight size={14} className="ax-crumb-sep" />
          <button className={`ax-crumb${folder === "root" ? " is-last" : ""}`} onClick={() => setFolder("root")}>
            <Monitor size={15} /> Questo PC
          </button>
          {folderLabel && (
            <>
              <ChevronRight size={14} className="ax-crumb-sep" />
              <span className="ax-crumb is-last">{folderLabel}</span>
            </>
          )}
        </div>

        <div className={`ax-search${searchOpen ? " is-open" : ""}`}>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            style={{ display: "contents" }}
            aria-label="Cerca"
          >
            <Search size={15} />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={folderLabel ? `Cerca in ${folderLabel}` : "Cerca nell'archivio"}
            aria-label="Cerca nell'archivio"
          />
        </div>
      </div>

      {/* ── Corpo ── */}
      <div className="ax-body">
        {/* Sidebar */}
        <aside className="ax-side">
          <div className="ax-side-group">
            <div className="ax-side-title"><Star size={11} style={{ marginRight: 6 }} />In evidenza</div>
            {folders.map((f) => (
              <button
                key={f.id}
                className={`ax-side-item${folder === f.id ? " is-on" : ""}`}
                onClick={() => { setFolder(f.id); setSelected(new Set()); }}
              >
                <span className="ax-side-ico"><f.Icon size={17} /></span>
                {f.label}
                <span className="ax-side-count">{f.items.length}</span>
              </button>
            ))}
          </div>
          <div className="ax-side-group">
            <div className="ax-side-title">Posizioni</div>
            <button className={`ax-side-item${folder === "root" ? " is-on" : ""}`} onClick={() => { setFolder("root"); setSelected(new Set()); }}>
              <span className="ax-side-ico"><Monitor size={17} /></span>
              Questo PC
              <span className="ax-side-count">{ALL.length}</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ax-main">
          <div className="ax-scroll" ref={scrollRef} onPointerDown={startMarquee}>
            {/* Cartelle (solo radice) */}
            {folder === "root" && !query && (
              <>
                <div className="ax-section-h">Cartelle in evidenza</div>
                <div className="ax-tiles">
                  {folders.map((f) => (
                    <button key={f.id} className="ax-tile" onClick={() => setFolder(f.id)} onDoubleClick={() => setFolder(f.id)}>
                      <span className="ax-tile-ico"><Folder size={24} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="ax-tile-name">{f.label}</span>
                        <span className="ax-tile-sub">{f.items.length} elementi</span>
                        <span className="ax-tile-bar"><i style={{ width: `${Math.min(100, (f.items.length / ALL.length) * 100 + 20)}%` }} /></span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="ax-section-h">Tutti gli elementi</div>
              </>
            )}

            {/* Vista Dettagli */}
            {view === "details" ? (
              <table className="ax-table" style={{ width: totalWidth }}>
                <colgroup>
                  {visibleCols.map((c) => (
                    <col key={c.key} style={{ width: widths[c.key] ?? c.def }} />
                  ))}
                  <col style={{ width: ACTIONS_W }} />
                </colgroup>
                <thead>
                  <ContextMenu.Root>
                    <ContextMenu.Trigger asChild>
                      <tr>
                        {visibleCols.map((c) => (
                          <th key={c.key} className="ax-th">
                            <div className="ax-th-inner" onClick={() => toggleSort(c.key)} title={`Ordina per ${c.label}`}>
                              <span className="ax-th-label">{c.label}</span>
                              {sort.col === c.key && (
                                <span className="ax-th-sort">
                                  {sort.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                              )}
                            </div>
                            <div className="ax-th-resizer" onPointerDown={(e) => startResize(c.key, e)} aria-hidden="true" />
                          </th>
                        ))}
                        <th className="ax-th">
                          <div className="ax-th-inner" style={{ cursor: "default" }}>
                            <span className="ax-th-label">Azioni</span>
                          </div>
                        </th>
                      </tr>
                    </ContextMenu.Trigger>
                    <ContextMenu.Portal>
                      <ContextMenu.Content className="ax-menu">
                        <div className="ax-menu-label">Mostra colonne</div>
                        {COLUMNS.filter((c) => c.optional).map((c) => (
                          <ContextMenu.CheckboxItem
                            key={c.key}
                            className="ax-mi"
                            checked={visible.has(c.key)}
                            onCheckedChange={() => toggleCol(c.key)}
                            onSelect={(e) => e.preventDefault()}
                          >
                            <ContextMenu.ItemIndicator className="ax-mi-check"><Check size={14} /></ContextMenu.ItemIndicator>
                            {c.label}
                          </ContextMenu.CheckboxItem>
                        ))}
                        <div className="ax-menu-sep" />
                        <ContextMenu.Item className="ax-mi" onSelect={autoFit}>
                          Adatta tutte le colonne
                        </ContextMenu.Item>
                      </ContextMenu.Content>
                    </ContextMenu.Portal>
                  </ContextMenu.Root>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const href = zipHref(p);
                    return (
                      <ContextMenu.Root key={p.id}>
                        <ContextMenu.Trigger asChild>
                          <tr
                            data-id={p.id}
                            className={`ax-row${selected.has(p.id) ? " is-sel" : ""}`}
                            onClick={(e) => selectItem(e, p.id)}
                            onDoubleClick={() => openOnline(p)}
                          >
                            {visibleCols.map((c) =>
                              c.key === "name" ? (
                                <td key={c.key}>
                                  <span className="ax-name">
                                    <span className="ax-name-ico" data-kind={p.kind}><TypeGlyph p={p} /></span>
                                    <span className="ax-name-txt">{p.title}</span>
                                  </span>
                                </td>
                              ) : (
                                <td key={c.key} title={cellValue(p, c.key)}>{cellValue(p, c.key)}</td>
                              ),
                            )}
                            <td>
                              <span className="ax-actions">
                                <button className="ax-act" title="Apri online" onClick={(e) => { e.stopPropagation(); openOnline(p); }}>
                                  <ExternalLink size={15} />
                                </button>
                                <button
                                  className="ax-act"
                                  title={href ? (p.kind === "doc" ? "Scarica PDF" : "Scarica ZIP") : "Download non disponibile"}
                                  disabled={!href}
                                  onClick={(e) => { e.stopPropagation(); download(p); }}
                                >
                                  <Download size={15} />
                                </button>
                              </span>
                            </td>
                          </tr>
                        </ContextMenu.Trigger>
                        <ContextMenu.Portal>
                          <ContextMenu.Content className="ax-menu">
                            <ContextMenu.Item className="ax-mi" onSelect={() => openOnline(p)}>
                              <span className="ax-mi-ico"><ExternalLink size={15} /></span> Apri online
                            </ContextMenu.Item>
                            <ContextMenu.Item className="ax-mi" disabled={!href} onSelect={() => download(p)}>
                              <span className="ax-mi-ico"><Download size={15} /></span>
                              {p.kind === "doc" ? "Scarica PDF" : "Scarica ZIP"}
                            </ContextMenu.Item>
                            <div className="ax-menu-sep" />
                            <ContextMenu.Item className="ax-mi" onSelect={() => copyLink(p)}>
                              <span className="ax-mi-ico"><Link2 size={15} /></span> Copia link
                            </ContextMenu.Item>
                          </ContextMenu.Content>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Vista Icone */
              <div className="ax-grid">
                {rows.map((p) => (
                  <div
                    key={p.id}
                    data-id={p.id}
                    className={`ax-card${selected.has(p.id) ? " is-sel" : ""}`}
                    onClick={(e) => selectItem(e, p.id)}
                    onDoubleClick={() => openOnline(p)}
                    title={p.category}
                  >
                    <span className="ax-card-ico" data-kind={p.kind}><TypeGlyph p={p} size={26} /></span>
                    <span className="ax-card-name">{p.title}</span>
                  </div>
                ))}
              </div>
            )}

            {rows.length === 0 && <div className="ax-empty">Nessun elemento corrisponde alla ricerca.</div>}
          </div>

          {/* Barra di stato */}
          <div className="ax-status">
            <span>{rows.length} elementi</span>
            {selected.size > 0 && <span>{selected.size === 1 ? "1 selezionato" : `${selected.size} selezionati`}</span>}
            <span className="ax-status-sp" />
            {flash && <span>{flash}</span>}
          </div>
        </main>
      </div>

      {/* Rettangolo di selezione (marquee) — posizione fissa, coord. viewport */}
      {marquee && (
        <div
          className="ax-marquee"
          style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Pagina /archivio "pura": la finestra a tutto schermo sulla "scrivania".
export default function Archivio() {
  return (
    <div className="ax-root">
      <ArchivioExplorer />
    </div>
  );
}
