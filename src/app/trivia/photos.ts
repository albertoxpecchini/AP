// ─── Foto pertinenti dalle parole della domanda (Wikipedia/Wikimedia) ────────
//
// Per ogni domanda cerchiamo un'immagine pertinente usando l'API pubblica di
// Wikipedia italiana (REST, niente API key, licenze libere). Cerchiamo la
// pagina più rilevante per la query e ne prendiamo l'immagine principale
// (pageimage) in versione thumbnail.
//
// Tutto è progettato per NON bloccare mai il gioco:
//  • cache in-memory + sessionStorage (anche i "miss", per non riprovare);
//  • prefetch della domanda successiva mentre giochi quella corrente;
//  • timeout breve e fallback silenzioso (il gioco mostra una card grafica).

const ENDPOINT = "https://it.wikipedia.org/w/api.php";
const THUMB_PX = 640;
const TIMEOUT_MS = 6000;
const SS_PREFIX = "trivia-photo:";

// Cache in-memory per la sessione corrente (Promise → dedup richieste in volo).
const memCache = new Map<string, Promise<string | null>>();

function ssGet(key: string): string | null | undefined {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key);
    if (raw == null) return undefined;        // mai cercato
    return raw === "" ? null : raw;            // "" = miss memorizzato
  } catch { return undefined; }
}
function ssSet(key: string, url: string | null) {
  try { sessionStorage.setItem(SS_PREFIX + key, url ?? ""); } catch {}
}

async function wikiSearchImage(query: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",                 // CORS anonimo
    generator: "search",
    gsrsearch: query,
    gsrlimit: "1",
    gsrnamespace: "0",
    prop: "pageimages",
    piprop: "thumbnail",
    pithumbsize: String(THUMB_PX),
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages as Record<string, any> | undefined;
    if (!pages) return null;
    // generator=search restituisce pagine non ordinate: prendiamo quella con index minore
    const list = Object.values(pages).sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99));
    for (const p of list) {
      const src = p?.thumbnail?.source;
      if (src) return src as string;
    }
    return null;
  } catch {
    return null; // abort/network/parse → nessuna foto, fallback grafico
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ritorna l'URL di una foto pertinente alla query, oppure null se non trovata.
 * Memoizza risultati e "miss" per evitare richieste ripetute.
 */
export function fetchPhoto(query: string): Promise<string | null> {
  const key = query.trim().toLowerCase();
  if (!key) return Promise.resolve(null);

  const cached = memCache.get(key);
  if (cached) return cached;

  const fromSS = ssGet(key);
  if (fromSS !== undefined) {
    const p = Promise.resolve(fromSS);
    memCache.set(key, p);
    return p;
  }

  const p = wikiSearchImage(key).then(url => { ssSet(key, url); return url; });
  memCache.set(key, p);
  return p;
}

/** Avvia il fetch senza attenderlo: scalda la cache per la domanda successiva. */
export function prefetchPhoto(query: string): void {
  void fetchPhoto(query);
}
