// ─── Caricamento dei capitoli a build-time ──────────────────────────────────
//
// Tutti i file in /content/trivia/*.md vengono importati come testo grezzo da
// Vite (import.meta.glob, eager) e parsati una sola volta. Da qui escono i
// capitoli ordinati e l'elenco piatto di tutte le domande.
//
// Per aggiungere domande: basta modificare/aggiungere un file .md in
// content/trivia/. Niente da toccare qui.

import { parseChapter, chapterIdFromPath, type Chapter, type Question } from "./parseTrivia";

const modules = import.meta.glob("/content/trivia/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const CHAPTERS: Chapter[] = Object.entries(modules)
  .map(([path, raw]) => parseChapter(chapterIdFromPath(path), raw))
  // capitoli in ordine alfabetico di titolo, stabile e prevedibile
  .sort((a, b) => a.title.localeCompare(b.title, "it"));

export const ALL_QUESTIONS: Question[] = CHAPTERS.flatMap(c => c.questions);

export const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

/** Domande di un capitolo (o tutte se `chapterId` assente / "all"). */
export function questionsFor(chapterId?: string | "all"): Question[] {
  if (!chapterId || chapterId === "all") return ALL_QUESTIONS;
  return CHAPTERS.find(c => c.id === chapterId)?.questions ?? [];
}

// Mescola e prende le prime `n` (Fisher–Yates su copia).
export function pickQuestions(pool: Question[], n: number): Question[] {
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}
