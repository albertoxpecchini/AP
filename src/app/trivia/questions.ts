// ─── Caricamento dei capitoli a build-time ──────────────────────────────────
//
// Tutti i file in /content/trivia/*.md vengono importati come testo grezzo da
// Vite (import.meta.glob, eager) e parsati una sola volta. Da qui escono i
// capitoli ordinati e l'elenco piatto di tutte le domande.
//
// Per aggiungere domande: basta modificare/aggiungere un file .md in
// content/trivia/. Niente da toccare qui.

import { parseChapter, chapterIdFromPath, type Chapter, type Question, type QType } from "./parseTrivia";

const modules = import.meta.glob("/content/trivia/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// README.md (e simili file di documentazione) non sono capitoli.
const IGNORED = /\/readme\.md$/i;

export const CHAPTERS: Chapter[] = Object.entries(modules)
  .filter(([path]) => !IGNORED.test(path))
  .map(([path, raw]) => parseChapter(chapterIdFromPath(path), raw))
  // Ordine CRONOLOGICO di caricamento dei sorgenti (campo `ordine:` nel .md):
  // Neoclassicismo → … → CityLife. A parità di `order`, fallback sul titolo.
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "it"));

export const ALL_QUESTIONS: Question[] = CHAPTERS.flatMap(c => c.questions);

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

/**
 * Domande dai capitoli e tipi selezionati.
 *  • `chapterIds` vuoto → tutti i capitoli.
 *  • `types` vuoto/omesso → tutti i tipi.
 */
export function questionsForMany(chapterIds: string[], types?: QType[]): Question[] {
  const chapSet = chapterIds.length ? new Set(chapterIds) : null;
  const typeSet = types && types.length ? new Set(types) : null;
  let pool = chapSet ? CHAPTERS.filter(c => chapSet.has(c.id)).flatMap(c => c.questions) : ALL_QUESTIONS;
  if (typeSet) pool = pool.filter(q => typeSet.has(q.type));
  return pool;
}

// Fisher–Yates su copia (riusato per domande e opzioni).
function shuffled<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Prepara le domande per una partita: mescola l'ordine E rimescola le opzioni
 * di ogni multipla (così la lettera della risposta corretta cambia posizione
 * a ogni partita → niente "memoria di zona"). Le opzioni sono clonate, i dati
 * globali (`ALL_QUESTIONS`) restano intatti.
 */
export function prepareGame(pool: Question[]): Question[] {
  return shuffled(pool).map(q =>
    q.type === "multipla" && q.options
      ? { ...q, options: shuffled(q.options) }
      : q,
  );
}
