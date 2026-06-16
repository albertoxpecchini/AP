// ─── Derivati dal progresso PER ACCOUNT (vedi progressApi.ts) ────────────────
//
// Da una ProgressMap (question_id → {ok, ms}) ricaviamo:
//   • la copertura per capitolo (quante domande "viste");
//   • i voti per pacchetto (argomento × tipo) in modo CUMULATIVO: un pacchetto è
//     completo quando hai risposto GIUSTO almeno una volta a TUTTE le sue domande.
// Niente più localStorage globale: tutto deriva dal progresso dell'account.

import type { QType } from "./parseTrivia";
import { gradeFromPct } from "./grade";
import type { PackageGrade } from "./packageGrades";
import { CHAPTERS } from "./questions";
import type { ProgressMap } from "./progressApi";

/** Copertura di un capitolo dal progresso account: domande viste / totale. */
export function chapterCoverageFrom(progress: ProgressMap, chapterId: string): { seen: number; total: number; pct: number } {
  const chap = CHAPTERS.find(c => c.id === chapterId);
  if (!chap || chap.questions.length === 0) return { seen: 0, total: 0, pct: 0 };
  let seen = 0;
  for (const q of chap.questions) if (progress.has(q.id)) seen++;
  const total = chap.questions.length;
  return { seen, total, pct: Math.round((seen / total) * 100) };
}

/** Copertura totale del db (per il riquadro "Db esplorato"). */
export function totalCoverageFrom(progress: ProgressMap): number {
  let total = 0, seen = 0;
  for (const c of CHAPTERS) for (const q of c.questions) {
    total++; if (progress.has(q.id)) seen++;
  }
  return total ? Math.round((seen / total) * 100) : 0;
}

const keyOf = (argomento: string, type: QType) => `${argomento} ${type}`;

/**
 * Voti per pacchetto CUMULATIVI: un pacchetto (argomento × tipo) è "completato"
 * quando hai risposto GIUSTO almeno una volta a TUTTE le sue domande nel db.
 * Un pacchetto è VOTABILE quando hai VISTO tutte le sue domande (25/25). Il voto
 * riflette quante ne hai indovinate (best per domanda) — non per forza 100%.
 */
export function cumulativePackageGrades(progress: ProgressMap): PackageGrade[] {
  type Agg = { argomento: string; type: QType; total: number; seenCount: number; okCount: number; ms: number };
  const byKey = new Map<string, Agg>();
  for (const c of CHAPTERS) {
    for (const q of c.questions) {
      const k = keyOf(q.argomento, q.type);
      let a = byKey.get(k);
      if (!a) { a = { argomento: q.argomento, type: q.type, total: 0, seenCount: 0, okCount: 0, ms: 0 }; byKey.set(k, a); }
      a.total++;
      const st = progress.get(q.id);
      if (st) {            // domanda VISTA (tentata almeno una volta)
        a.seenCount++;
        if (st.ok) { a.okCount++; a.ms += st.ms; }
      }
    }
  }
  const out: PackageGrade[] = [];
  for (const a of byKey.values()) {
    // Pacchetto VOTABILE quando hai VISTO tutte le sue domande (finito il "25/25").
    // Il voto riflette quante ne hai indovinate (best per domanda), non per forza 100%.
    if (a.seenCount < a.total) continue;
    const accuracy = Math.round((a.okCount / a.total) * 100);
    out.push({ argomento: a.argomento, type: a.type, correct: a.okCount, total: a.total, accuracy, grade: gradeFromPct(accuracy), ms: a.ms });
  }
  const typeRank: Record<QType, number> = { multipla: 0, "vero-falso": 1, aperta: 2 };
  out.sort((x, y) => x.argomento.localeCompare(y.argomento, "it") || typeRank[x.type] - typeRank[y.type]);
  return out;
}

/** Applica in memoria gli esiti di una partita alla ProgressMap (per la UI live). */
export function applyResults(progress: ProgressMap, played: { question: { id: string }; correct: boolean; ms?: number }[]): ProgressMap {
  const m = new Map(progress);
  for (const p of played) {
    const id = p.question.id;
    const ms = Math.max(0, p.ms ?? 0);
    const prev = m.get(id);
    if (!prev) m.set(id, { ok: p.correct, ms: p.correct ? ms : 0 });
    else m.set(id, {
      ok: prev.ok || p.correct,
      ms: p.correct ? (prev.ok && prev.ms ? Math.min(prev.ms, ms) : ms) : prev.ms,
    });
  }
  return m;
}
