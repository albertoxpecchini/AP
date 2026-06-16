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

// Chiave = CAPITOLO + tipo. NON l'argomento: è condiviso da più capitoli
// (es. "Movimento moderno" = Marsiglia + Ronchamp + …) e li faceva collassare
// in un unico pacchetto enorme → mai votabile (25/25 di un'unità non bastavano).
const keyOf = (chapterId: string, type: QType) => `${chapterId} ${type}`;

/**
 * Voti per pacchetto CUMULATIVI: un pacchetto (capitolo × tipo) è VOTABILE
 * quando hai VISTO tutte le sue domande (finito il "25/25" di quell'unità). Il
 * voto riflette quante ne hai indovinate (best per domanda) — non per forza 100%.
 */
export function cumulativePackageGrades(progress: ProgressMap): PackageGrade[] {
  type Agg = { chapterId: string; label: string; type: QType; total: number; seenCount: number; okCount: number; ms: number };
  const byKey = new Map<string, Agg>();
  for (const c of CHAPTERS) {
    for (const q of c.questions) {
      const k = keyOf(q.chapterId, q.type);
      let a = byKey.get(k);
      if (!a) { a = { chapterId: q.chapterId, label: c.title, type: q.type, total: 0, seenCount: 0, okCount: 0, ms: 0 }; byKey.set(k, a); }
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
    out.push({ chapterId: a.chapterId, argomento: a.label, type: a.type, correct: a.okCount, total: a.total, accuracy, grade: gradeFromPct(accuracy), ms: a.ms });
  }
  const typeRank: Record<QType, number> = { multipla: 0, "vero-falso": 1, aperta: 2 };
  out.sort((x, y) => x.argomento.localeCompare(y.argomento, "it") || typeRank[x.type] - typeRank[y.type]);
  return out;
}

/**
 * RECUPERO PROGRESSI dalle pagelle già esistenti.
 *
 * Se un voto in pagella (capitolo × tipo) esiste, significa che a suo tempo hai
 * VISTO tutte le domande di quel capitolo×tipo (la pagella si sblocca solo a
 * pacchetto completo) e ne hai indovinate `best_correct` su `best_total`. Ma quel
 * progresso può non essere finito su `trivia_progress` (es. partite vecchie, altri
 * dispositivi). Qui lo ricostruiamo: per ogni pacchetto votato, marchiamo le sue
 * domande come VISTE, e ne marchiamo `best_correct` come GIUSTE — così copertura e
 * voto ricalcolato COINCIDONO con la pagella (i dati restano uguali, non si perde
 * nulla). Non sovrascrive mai progressi reali già "ok" (li conta come già giusti).
 *
 * `rows` = righe pagella { arg_key=chapterId, type, best_correct, best_total }.
 * Robusto ai dati STORICI per-argomento: se `arg_key`/`best_total` non combaciano
 * con nessun capitolo×tipo reale, la riga viene semplicemente ignorata.
 */
export function backfillProgressFromGrades(
  progress: ProgressMap,
  rows: { arg_key: string; type: QType; best_correct: number; best_total: number }[],
): ProgressMap {
  if (!rows.length) return progress;
  const m = new Map(progress);
  let changed = false;

  for (const r of rows) {
    const chap = CHAPTERS.find(c => c.id === r.arg_key);
    if (!chap) continue; // riga storica (chiave = argomento) o capitolo sconosciuto
    const qs = chap.questions.filter(q => q.type === r.type);
    if (qs.length === 0 || qs.length !== r.best_total) continue; // non combacia → salta

    // Quante sono GIÀ giuste nel progresso reale (quelle non le tocchiamo).
    const already = qs.filter(q => m.get(q.id)?.ok).length;
    let toMarkOk = Math.max(0, Math.min(qs.length, r.best_correct) - already);

    for (const q of qs) {
      const st = m.get(q.id);
      if (st?.ok) continue;            // già giusta: lasciala com'è
      if (!st) { changed = true; }     // non vista: la marchiamo (vista, e ok se ne restano)
      if (toMarkOk > 0) { m.set(q.id, { ok: true, ms: st?.ms ?? 0 }); toMarkOk--; changed = true; }
      else if (!st) { m.set(q.id, { ok: false, ms: 0 }); } // vista ma non giusta
    }
  }
  return changed ? m : progress;
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
