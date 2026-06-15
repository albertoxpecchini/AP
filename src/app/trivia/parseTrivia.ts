// ─── Parser dei capitoli .md → domande tipizzate (build-time) ────────────────
//
// I capitoli sono file Markdown in /content/trivia/*.md, uno per capitolo.
// Questo modulo NON tocca il filesystem: riceve il testo grezzo e lo trasforma
// in `Question[]`. Il caricamento dei file avviene in questions.ts via Vite glob.
//
// Schema atteso (vedi anche TRIVIA-LEADERBOARD.md / esempio gotico.md):
//
//   # Titolo del Capitolo
//
//   ## Domanda
//   type: multipla
//   Testo della domanda?
//   - [ ] opzione errata
//   - [x] opzione corretta
//   - [ ] altra opzione
//   > Spiegazione: testo opzionale
//   foto: query foto opzionale (override)
//
//   ## Domanda
//   type: vero-falso
//   Affermazione da valutare.
//   risposta: vero | falso
//
//   ## Domanda
//   type: aperta
//   Domanda a risposta libera?
//   risposta: risposta canonica
//   accetta: variante 1; variante 2
//
// Regole: `type` ∈ multipla|vero-falso|aperta. Multipla → ≥2 opzioni con
// ESATTAMENTE una `- [x]`. Vero/falso → `risposta: vero|falso`. Aperta →
// `risposta:` obbligatoria, `accetta:` opzionale (varianti separate da `;`).
// `> Spiegazione:` opzionale. Se manca `foto:`, la query si deriva dal testo.
//
// In caso di domanda malformata si lancia un Error con messaggio chiaro: così
// `npm run build` fallisce subito e l'errore di battitura nel .md è evidente.

export type QType = "multipla" | "vero-falso" | "aperta";

export interface QOption {
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;          // stabile: <chapterId>-<indice> → usato per la copertura
  chapter: string;     // titolo leggibile del capitolo
  chapterId: string;   // slug del capitolo (dal nome file)
  type: QType;
  text: string;
  options?: QOption[]; // solo multipla
  answer?: string;     // vero-falso ("vero"/"falso") | aperta (canonica)
  accept?: string[];   // aperta: varianti accettate (oltre ad `answer`)
  explanation?: string;
  photoQuery: string;  // keyword per la foto Wikimedia
}

export interface Chapter {
  id: string;
  title: string;
  questions: Question[];
}

// ── Slug del capitolo dal path del file (es. "/content/trivia/gotico.md" → "gotico") ──
export function chapterIdFromPath(path: string): string {
  const base = path.split("/").pop() || path;
  return base.replace(/\.md$/i, "").trim();
}

// Deriva una query-foto sensata dal testo della domanda: toglie la
// punteggiatura finale e taglia a una lunghezza ragionevole per la ricerca.
function derivePhotoQuery(text: string): string {
  return text
    .replace(/[?!.…]+\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function fail(chapterId: string, qIdx: number, msg: string): never {
  // qIdx è 0-based internamente; in messaggio mostriamo 1-based (più umano).
  throw new Error(`[trivia] ${chapterId}.md · Domanda ${qIdx + 1}: ${msg}`);
}

/**
 * Converte il testo di un capitolo in una lista di domande tipizzate.
 * `chapterId` = slug dal nome file (usato per gli id stabili e i messaggi).
 */
export function parseChapter(chapterId: string, raw: string): Chapter {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  let title = chapterId;
  // Blocchi domanda: ogni "## Domanda" (o "## " generico) apre un nuovo blocco.
  const blocks: string[][] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1 && !line.startsWith("##")) {
      title = h1[1].trim();
      continue;
    }
    if (/^##\s+/.test(line)) {
      current = [];
      blocks.push(current);
      continue;
    }
    if (current) current.push(line);
  }

  const questions: Question[] = blocks
    .map((blk, idx) => parseBlock(chapterId, idx, blk))
    .filter((q): q is Question => q !== null)
    // id stabile sull'indice finale + titolo capitolo iniettato in ogni domanda
    .map((q, i) => ({ ...q, id: `${chapterId}-${i}`, chapter: title }));

  if (questions.length === 0) {
    throw new Error(`[trivia] ${chapterId}.md: nessuna domanda trovata (manca "## Domanda"?)`);
  }

  return { id: chapterId, title, questions };
}

function parseBlock(chapterId: string, idx: number, block: string[]): Question | null {
  const lines = block.map(l => l).filter(l => l.trim() !== "" || true); // mantiene struttura
  const nonEmpty = block.map(l => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return null; // blocco vuoto → ignorato

  let type: QType | "" = "";
  let answer: string | undefined;
  let accept: string[] | undefined;
  let explanation: string | undefined;
  let photoOverride: string | undefined;
  const options: QOption[] = [];
  const textLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const mType = line.match(/^type:\s*(.+)$/i);
    if (mType) {
      const t = mType[1].trim().toLowerCase();
      if (t !== "multipla" && t !== "vero-falso" && t !== "aperta") {
        fail(chapterId, idx, `type "${t}" non valido (usa multipla | vero-falso | aperta)`);
      }
      type = t as QType;
      continue;
    }

    const mOpt = line.match(/^[-*]\s*\[( |x|X)\]\s*(.+)$/);
    if (mOpt) {
      options.push({ text: mOpt[2].trim(), correct: mOpt[1].toLowerCase() === "x" });
      continue;
    }

    const mAns = line.match(/^risposta:\s*(.+)$/i);
    if (mAns) { answer = mAns[1].trim(); continue; }

    const mAcc = line.match(/^accetta:\s*(.+)$/i);
    if (mAcc) {
      accept = mAcc[1].split(";").map(s => s.trim()).filter(Boolean);
      continue;
    }

    const mExp = line.match(/^>\s*(?:spiegazione:\s*)?(.+)$/i);
    if (mExp) { explanation = (explanation ? explanation + " " : "") + mExp[1].trim(); continue; }

    const mFoto = line.match(/^foto:\s*(.+)$/i);
    if (mFoto) { photoOverride = mFoto[1].trim(); continue; }

    // Tutto il resto è testo della domanda.
    textLines.push(line);
  }

  const text = textLines.join(" ").trim();
  if (!text) fail(chapterId, idx, "manca il testo della domanda");
  if (!type) fail(chapterId, idx, 'manca la riga "type:" (multipla | vero-falso | aperta)');

  const base = {
    chapter: "", // riempito dal chiamante via spread, non necessario qui
    chapterId,
    text,
    explanation,
    photoQuery: photoOverride || derivePhotoQuery(text),
  };

  if (type === "multipla") {
    if (options.length < 2) fail(chapterId, idx, "una domanda multipla richiede almeno 2 opzioni");
    const correctCount = options.filter(o => o.correct).length;
    if (correctCount !== 1) {
      fail(chapterId, idx, `serve ESATTAMENTE una opzione corretta (- [x]); trovate ${correctCount}`);
    }
    return { id: "", type, options, ...base } as Question;
  }

  if (type === "vero-falso") {
    const a = (answer || "").toLowerCase();
    if (a !== "vero" && a !== "falso") {
      fail(chapterId, idx, 'vero-falso richiede "risposta: vero" oppure "risposta: falso"');
    }
    return { id: "", type, answer: a, ...base } as Question;
  }

  // aperta
  if (!answer) fail(chapterId, idx, 'una domanda aperta richiede "risposta: <testo>"');
  return { id: "", type, answer, accept, ...base } as Question;
}

// ─── Match flessibile per le risposte aperte ────────────────────────────────
//
// Confronta la risposta digitata con quelle accettate ignorando maiuscole,
// accenti e spazi, con una piccola tolleranza ai refusi (distanza di
// Levenshtein proporzionale alla lunghezza). Tutto locale, gratis, offline.

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // toglie accenti
    .replace(/[^a-z0-9\s]/g, " ")                      // via punteggiatura
    .replace(/\s+/g, " ")                              // collassa spazi
    .trim();
}

// Distanza di Levenshtein classica (DP su due righe).
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// Soglia di refusi tollerati in base alla lunghezza della parola di riferimento.
function tolerance(len: number): number {
  if (len <= 3) return 0;   // parole cortissime: match esatto
  if (len <= 6) return 1;
  if (len <= 10) return 2;
  return 3;
}

/**
 * True se `guess` corrisponde alla risposta canonica o a una delle varianti
 * accettate, con tolleranza ai refusi. Vuoto → sempre false.
 */
export function isAnswerCorrect(guess: string, question: Question): boolean {
  const g = normalizeAnswer(guess);
  if (!g) return false;

  const candidates = [question.answer, ...(question.accept || [])]
    .filter((c): c is string => Boolean(c))
    .map(normalizeAnswer)
    .filter(Boolean);

  for (const c of candidates) {
    if (g === c) return true;
    const dist = levenshtein(g, c);
    if (dist <= tolerance(c.length)) return true;
  }
  return false;
}
