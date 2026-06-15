// ─── Copertura personale (locale) ───────────────────────────────────────────
//
// Traccia quali domande UNICHE il giocatore ha già VISTO, per mostrare la
// percentuale di db esplorata ("Hai visto il 42% delle domande"). È un
// incentivo a completare tutto. Per-dispositivo, niente backend.
//
// Salviamo il set di id visti in localStorage. Gli id sono stabili (vedi
// parseTrivia: `${chapterId}-${indice}`), quindi sopravvivono ai rebuild
// finché non si riordinano le domande nel .md.

import { ALL_QUESTIONS, TOTAL_QUESTIONS, CHAPTERS } from "./questions";

const SEEN_KEY = "trivia-seen";

function readSeen(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch { return new Set(); }
}
function writeSeen(set: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch {}
}

/** Marca come viste le domande con questi id. */
export function markSeen(ids: string[]): void {
  if (!ids.length) return;
  const set = readSeen();
  let changed = false;
  for (const id of ids) if (!set.has(id)) { set.add(id); changed = true; }
  if (changed) writeSeen(set);
}

/** Insieme degli id visti (filtra eventuali id non più esistenti). */
function seenValid(): Set<string> {
  const valid = new Set(ALL_QUESTIONS.map(q => q.id));
  const seen = readSeen();
  return new Set([...seen].filter(id => valid.has(id)));
}

/** Percentuale di domande viste sul totale del db (0–100, arrotondata). */
export function coveragePct(): number {
  if (TOTAL_QUESTIONS === 0) return 0;
  return Math.round((seenValid().size / TOTAL_QUESTIONS) * 100);
}

/** Numero di domande viste sul totale (per il testo "12 / 30"). */
export function coverageCount(): { seen: number; total: number } {
  return { seen: seenValid().size, total: TOTAL_QUESTIONS };
}

/** Percentuale vista per un singolo capitolo. */
export function chapterCoveragePct(chapterId: string): number {
  const chap = CHAPTERS.find(c => c.id === chapterId);
  if (!chap || chap.questions.length === 0) return 0;
  const seen = seenValid();
  const n = chap.questions.filter(q => seen.has(q.id)).length;
  return Math.round((n / chap.questions.length) * 100);
}

/** Domande viste sul totale per un capitolo (per il cerchio "12 / 30"). */
export function chapterCoverageCount(chapterId: string): { seen: number; total: number } {
  const chap = CHAPTERS.find(c => c.id === chapterId);
  if (!chap) return { seen: 0, total: 0 };
  const seen = seenValid();
  const n = chap.questions.filter(q => seen.has(q.id)).length;
  return { seen: n, total: chap.questions.length };
}
