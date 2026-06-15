// ─── Foto pertinenti dalle parole della domanda (Wikipedia/Wikimedia) ────────
//
// Per ogni domanda cerchiamo un'immagine pertinente usando le API pubbliche di
// Wikipedia (REST + Action API, niente API key, licenze libere). L'obiettivo è
// che la foto sia INERENTE alla domanda e che si carichi quasi sempre.
//
// Strategia a cascata (ci si ferma alla prima che dà un'immagine valida):
//   1. REST summary della pagina più probabile per la query → originalimage/thumbnail
//   2. generator=search + pageimages (immagine principale della miglior pagina)
//   3. come (1)/(2) ma sulla query "di ripiego" (+ "architettura")
//
// Tutto è progettato per NON bloccare mai il gioco:
//  • cache in-memory + sessionStorage (anche i "miss");
//  • prefetch della domanda successiva mentre giochi quella corrente;
//  • timeout breve e fallback silenzioso (il gioco mostra una card grafica).

const REST = "https://it.wikipedia.org/api/rest_v1/page/summary/";
const ACTION = "https://it.wikipedia.org/w/api.php";
const THUMB_PX = 800;
const MIN_PX = 200;          // scarta immagini troppo piccole (icone/loghi)
const TIMEOUT_MS = 7000;
const SS_PREFIX = "trivia-photo:";

const memCache = new Map<string, Promise<string | null>>();

/** Entità strutturate del capitolo: i migliori indizi per una foto pertinente. */
export interface PhotoHints {
  edificio?: string;
  autore?: string;
  argomento?: string;
}

function ssGet(key: string): string | null | undefined {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key);
    if (raw == null) return undefined;
    return raw === "" ? null : raw;
  } catch { return undefined; }
}
function ssSet(key: string, url: string | null) {
  try { sessionStorage.setItem(SS_PREFIX + key, url ?? ""); } catch {}
}

function withTimeout(): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

// Scarta immagini palesemente non-foto (loghi, icone, mappe, stemmi, bandiere).
// IMPORTANTE: si analizza SOLO il nome file, non l'host: ogni foto Wikimedia sta
// su "upload.wikimedia.org", quindi cercare "wikimedia" nell'intero URL scartava
// QUALSIASI immagine (era la causa per cui non caricava mai nessuna foto).
function looksBad(url: string): boolean {
  const file = (url.split("/").pop() || url).toLowerCase();
  if (file.endsWith(".svg")) return true;
  return /logo|icon|flag|coat[_-]?of[_-]?arms|stemma|bandiera|[_-]map[_.-]|mappa|disambig|commons-logo|edit-icon|ambox|question_book/.test(file);
}

// ── (1) REST summary: di solito l'immagine più rappresentativa della pagina ──
async function viaSummary(query: string): Promise<string | null> {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(REST + encodeURIComponent(query), {
      signal, headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.type === "disambiguation") return null;
    const orig = data?.originalimage?.source as string | undefined;
    const thumb = data?.thumbnail?.source as string | undefined;
    const url = orig || thumb;
    if (!url || looksBad(url)) return null;
    // se è un thumbnail di Wikimedia, alziamo la risoluzione richiesta
    return bumpThumb(url);
  } catch { return null; }
  finally { done(); }
}

// ── (2) Action API: miglior pagina della ricerca + sua pageimage ──
async function viaSearch(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*",
    generator: "search", gsrsearch: query, gsrlimit: "3", gsrnamespace: "0",
    prop: "pageimages", piprop: "thumbnail|original", pithumbsize: String(THUMB_PX),
  });
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${ACTION}?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, any> | undefined;
    if (!pages) return null;
    const list = Object.values(pages).sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99));
    for (const p of list) {
      const orig = p?.original?.source as string | undefined;
      const thumb = p?.thumbnail?.source as string | undefined;
      const w = p?.thumbnail?.width ?? p?.original?.width ?? 0;
      const url = orig || thumb;
      if (url && !looksBad(url) && w >= MIN_PX) return bumpThumb(url);
    }
    return null;
  } catch { return null; }
  finally { done(); }
}

// Alza la dimensione di un thumbnail Wikimedia (…/NNNpx-…) a THUMB_PX.
function bumpThumb(url: string): string {
  return url.replace(/\/(\d+)px-/, `/${THUMB_PX}px-`);
}

// Estrae una query "mirata" dalla domanda: privilegia i nomi propri (parole
// con iniziale maiuscola, anche multiple consecutive → "Santa Maria del Fiore").
function focusQuery(text: string): string {
  const cleaned = text.replace(/[?!.…,;:()"]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const stop = new Set(["Che", "Chi", "Come", "Dove", "Quale", "Quali", "Quando", "Quanto", "Quanti", "Perché", "Cosa", "In", "Il", "La", "Lo", "Le", "Gli", "Un", "Una"]);
  const groups: string[] = [];
  let cur: string[] = [];
  const isCap = (w: string) => /^[A-ZÀ-Þ]/.test(w);
  const isLinker = (w: string) => /^(del|della|dei|degli|delle|di|da|de|d'|al|alla|e|in|su|sul|sulla|the|of|von|van)$/i.test(w);
  for (const w of words) {
    if (isCap(w) && !stop.has(w)) {
      cur.push(w);
    } else if (cur.length && isLinker(w)) {
      cur.push(w); // tiene insieme "Santa Maria del Fiore"
    } else {
      if (cur.length) { groups.push(cur.join(" ")); cur = []; }
    }
  }
  if (cur.length) groups.push(cur.join(" "));
  // gruppo più lungo (più specifico); altrimenti niente → useremo tutta la frase
  const best = groups.sort((a, b) => b.length - a.length)[0];
  return (best && best.trim().split(" ").length >= 1 && /[A-ZÀ-Þ]/.test(best)) ? best.trim() : "";
}

/**
 * Pulisce un campo "edificio/argomento" che può essere una LISTA con parentesi,
 * es. "Barcellona (Palau Güell, Park Güell)" → "Barcellona", oppure
 * "Villa Savoye, Poissy" → "Villa Savoye". Toglie contenuto tra parentesi,
 * poi prende la prima voce prima di "," "/" ";".
 */
export function cleanEntity(s?: string): string {
  if (!s) return "";
  return s
    .replace(/\([^)]*\)?/g, " ")   // via "(... )" anche se non chiusa
    .replace(/[,/;].*$/, " ")       // via tutto dopo la prima virgola/slash
    .replace(/\s+/g, " ")
    .trim();
}

async function resolve(query: string, hints?: PhotoHints): Promise<string | null> {
  // Priorità ai candidati PIÙ SPECIFICI della singola domanda: l'entità estratta
  // dalla frase/risposta (focus) batte i campi di CAPITOLO, che sono spesso liste
  // generiche (es. "Barcellona (Palau Güell, Park Güell)") e darebbero foto
  // sbagliate per domande su altri soggetti dello stesso capitolo.
  //
  // Ordine: focus (domanda) → edificio pulito → "edificio + autore" → autore →
  //         argomento → query intera → query + "architettura".
  const focus = focusQuery(query);
  const ediShort = cleanEntity(hints?.edificio);
  const argShort = cleanEntity(hints?.argomento);
  const candidates = [
    focus,
    ediShort,
    ediShort && hints?.autore ? `${ediShort} ${hints.autore}` : "",
    hints?.autore,
    argShort,
    query,
    `${query} architettura`,
  ].filter(Boolean) as string[];

  const tried = new Set<string>();
  for (const c of candidates) {
    const key = c.trim().toLowerCase();
    if (!key || tried.has(key)) continue;
    tried.add(key);
    const hit = (await viaSummary(c)) || (await viaSearch(c));
    if (hit) return hit;
  }
  return null;
}

/**
 * Ritorna l'URL di una foto pertinente alla query, oppure null se non trovata.
 * Memoizza risultati e "miss" per evitare richieste ripetute.
 */
export function fetchPhoto(query: string, hints?: PhotoHints): Promise<string | null> {
  // La chiave include gli indizi: capitoli diversi con la stessa domanda generica
  // ("Chi lo progettò?") devono poter avere foto diverse.
  const key = [query, hints?.edificio, hints?.autore, hints?.argomento]
    .filter(Boolean).join("|").trim().toLowerCase();
  if (!key) return Promise.resolve(null);

  const cached = memCache.get(key);
  if (cached) return cached;

  const fromSS = ssGet(key);
  if (fromSS !== undefined) {
    const p = Promise.resolve(fromSS);
    memCache.set(key, p);
    return p;
  }

  const p = resolve(query, hints).then(url => { ssSet(key, url); return url; });
  memCache.set(key, p);
  return p;
}

/** Avvia il fetch senza attenderlo: scalda la cache per la domanda successiva. */
export function prefetchPhoto(query: string, hints?: PhotoHints): void {
  void fetchPhoto(query, hints);
}
