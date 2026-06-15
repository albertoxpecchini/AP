// ─── Foto pertinenti dalle parole della domanda (multi-fonte, licenze libere) ─
//
// Per ogni domanda cerchiamo un'immagine pertinente e di qualità da PIÙ fonti
// pubbliche, tutte senza API key e con licenze aperte/CC. Nessuno scraping di
// immagini protette (illegale e instabile): usiamo provider che espongono
// immagini legalmente riutilizzabili e affidabili nel tempo.
//
// Cascata (ci si ferma alla prima immagine valida):
//   1. Wikipedia IT → EN: REST summary + generator=search (foto rappresentativa)
//   2. Wikimedia Commons: ricerca DIRETTA dei file (namespace 6) → enorme
//      copertura anche senza un articolo con lead image (es. ponti di R. Emilia)
//   3. Openverse: aggregatore Creative Commons (Flickr, musei, collezioni…)
// I candidati di query vanno dal più specifico (entità della domanda) ai campi
// di capitolo (edificio/autore/argomento), così la foto resta inerente.
//
// Tutto è progettato per NON bloccare mai il gioco:
//  • cache in-memory + sessionStorage (anche i "miss");
//  • prefetch della domanda successiva mentre giochi quella corrente;
//  • timeout breve per fonte e fallback silenzioso (card grafica col capitolo).

// Più fonti = più copertura. Tutte ad accesso libero, senza API key, con
// immagini di licenza aperta (Wikimedia/Commons) o CC (Openverse).
const WIKIS = ["it", "en"] as const;           // Wikipedia IT poi EN (fallback)
const COMMONS = "https://commons.wikimedia.org/w/api.php"; // repository foto diretto
const OPENVERSE = "https://api.openverse.org/v1/images/";  // aggregatore CC (Flickr, musei…)
const wikiRest = (lang: string) => `https://${lang}.wikipedia.org/api/rest_v1/page/summary/`;
const wikiAction = (lang: string) => `https://${lang}.wikipedia.org/w/api.php`;
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
async function viaSummary(lang: string, query: string): Promise<string | null> {
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(wikiRest(lang) + encodeURIComponent(query), {
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
async function viaSearch(lang: string, query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*",
    generator: "search", gsrsearch: query, gsrlimit: "3", gsrnamespace: "0",
    prop: "pageimages", piprop: "thumbnail|original", pithumbsize: String(THUMB_PX),
  });
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${wikiAction(lang)}?${params}`, { signal });
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

// ── (3) Commons: cerca DIRETTAMENTE i file foto (namespace 6). È il repository
// di Wikimedia: trova immagini anche quando nessun articolo ha una lead image
// (qui sta la vera ampiezza di copertura, es. i ponti di Reggio Emilia). ──
async function viaCommons(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query", format: "json", origin: "*",
    generator: "search", gsrsearch: `${query} filetype:bitmap`, gsrlimit: "8", gsrnamespace: "6",
    prop: "imageinfo", iiprop: "url|size", iiurlwidth: String(THUMB_PX),
  });
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${COMMONS}?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, any> | undefined;
    if (!pages) return null;
    const list = Object.values(pages).sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99));
    for (const p of list) {
      const ii = p?.imageinfo?.[0];
      const url = (ii?.thumburl || ii?.url) as string | undefined;
      const w = ii?.thumbwidth ?? ii?.width ?? 0;
      if (url && !looksBad(url) && w >= MIN_PX) return url;
    }
    return null;
  } catch { return null; }
  finally { done(); }
}

// ── (4) Openverse: aggregatore di immagini Creative Commons (Flickr, musei,
// collezioni…). Allarga la copertura oltre Wikimedia, sempre con licenza CC. ──
async function viaOpenverse(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: query, page_size: "5", mature: "false",
    // formati comuni e dimensione "large" per qualità
    size: "large",
  });
  const { signal, done } = withTimeout();
  try {
    const res = await fetch(`${OPENVERSE}?${params}`, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data?.results ?? []) as any[];
    for (const r of results) {
      const url = (r?.url || r?.thumbnail) as string | undefined;
      const w = r?.width ?? 0;
      if (url && !looksBad(url) && (w === 0 || w >= MIN_PX)) return url;
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
  const uniq = candidates
    .map(c => c.trim())
    .filter(c => { const k = c.toLowerCase(); if (!k || tried.has(k)) return false; tried.add(k); return true; });

  // Passata 1: Wikipedia (IT poi EN) per OGNI candidato. Voci enciclopediche →
  // foto più "rappresentative" e pertinenti. È la fonte preferita.
  for (const c of uniq) {
    for (const lang of WIKIS) {
      const hit = (await viaSummary(lang, c)) || (await viaSearch(lang, c));
      if (hit) return hit;
    }
  }

  // Passata 2: Commons (file diretti) sui candidati migliori. Copre i casi in
  // cui esiste la FOTO ma nessun articolo la usa come immagine principale
  // (es. ponti di Reggio Emilia). Limitata ai primi 3 per restare veloce.
  for (const c of uniq.slice(0, 3)) {
    const hit = await viaCommons(c);
    if (hit) return hit;
  }

  // Passata 3: Openverse (Creative Commons oltre Wikimedia) come ultima rete.
  for (const c of uniq.slice(0, 2)) {
    const hit = await viaOpenverse(c);
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
