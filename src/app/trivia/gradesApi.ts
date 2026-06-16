// ─── Pagella per argomento (Supabase) ───────────────────────────────────────
//
// Salva e legge i voti per pacchetto (argomento × tipo), legati al NOME del
// giocatore (account condiviso, vedi src/lib/players.ts). Tiene record + ultimo
// con i tempi; la logica "tieni il migliore" è atomica nella funzione RPC
// `trivia_grade_record` (SQL in supabase/trivia_grades.sql).
//
// Usa le STESSE env pubbliche dei giochi:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
//
// Se non configurate, lavora in "solo locale" (localStorage), così la pagella
// resta visibile sul dispositivo anche senza backend.

import type { QType } from "./parseTrivia";
import { gradeFromPct, type Grade } from "./grade";
import type { PackageGrade } from "./packageGrades";

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "trivia_grades";

export const gradesConfigured = Boolean(URL && ANON);

const LOCAL_KEY = "trivia-grades-local";

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

export const argKey = (argomento: string) => argomento.trim().toLowerCase();

// Riga "grezza" come arriva da Supabase.
export interface GradeRow {
  nick: string;
  arg_key: string;
  argomento: string;
  type: QType;
  best_accuracy: number;
  best_correct: number;
  best_total: number;
  best_ms: number;
  best_at?: string;
  last_accuracy: number;
  last_correct: number;
  last_total: number;
  last_ms: number;
  last_at?: string;
  updated_at?: string;
}

// Voto "pronto per la UI": record + delta dell'ultimo se diverso.
export interface GradeCell {
  argomento: string;
  type: QType;
  best: { accuracy: number; correct: number; total: number; ms: number; grade: Grade; at?: string };
  last: { accuracy: number; correct: number; total: number; ms: number; grade: Grade; at?: string };
  /** Differenza ultimo − record in punti percentuali. 0 se coincidono. */
  deltaPct: number;
  /** true se ultimo e record coincidono (mostra solo il record). */
  same: boolean;
}

// Un argomento con i suoi (fino a 3) voti per tipo + tempo totale.
export interface SubjectReport {
  argomento: string;
  cells: GradeCell[];          // ordinati per tipo (multipla, V/F, aperta)
  totalMs: number;             // somma dei best_ms dei tipi votati
  avgAccuracy: number;         // media delle best_accuracy
  lastAt?: string;             // ultimo aggiornamento fra i tipi
}

// ─── locale ──────────────────────────────────────────────────────────────────

function readLocal(): GradeRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function writeLocal(rows: GradeRow[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 500))); } catch {}
}

function recordLocal(nick: string, p: PackageGrade) {
  const key = nick.trim().toLowerCase();
  const ak = argKey(p.argomento);
  const acc = p.accuracy;
  const rows = readLocal();
  const i = rows.findIndex(r => r.arg_key === ak && r.type === p.type && r.nick.toLowerCase() === key);
  const now = new Date().toISOString();
  if (i < 0) {
    rows.push({
      nick: nick.slice(0, 10), arg_key: ak, argomento: p.argomento, type: p.type,
      best_accuracy: acc, best_correct: p.correct, best_total: p.total, best_ms: p.ms, best_at: now,
      last_accuracy: acc, last_correct: p.correct, last_total: p.total, last_ms: p.ms, last_at: now,
      updated_at: now,
    });
  } else {
    const r = rows[i];
    const better = acc > r.best_accuracy || (acc === r.best_accuracy && p.ms < r.best_ms);
    r.last_accuracy = acc; r.last_correct = p.correct; r.last_total = p.total; r.last_ms = p.ms; r.last_at = now;
    r.updated_at = now;
    if (better) {
      r.best_accuracy = acc; r.best_correct = p.correct; r.best_total = p.total; r.best_ms = p.ms; r.best_at = now;
    }
  }
  writeLocal(rows);
}

// ─── salvataggio ───────────────────────────────────────────────────────────

/** Registra su Supabase (RPC) i voti dei pacchetti completati di una partita. */
export async function saveGrades(nick: string, packages: PackageGrade[]): Promise<void> {
  const clean = nick.trim().slice(0, 10);
  if (!clean || packages.length === 0) return;

  if (!gradesConfigured) {
    for (const p of packages) recordLocal(clean, p);
    return;
  }

  // Una RPC per pacchetto (atomica lato server). In parallelo, errori ignorati.
  await Promise.all(packages.map(p =>
    fetch(`${URL}/rest/v1/rpc/trivia_grade_record`, {
      method: "POST",
      headers: restHeaders(),
      body: JSON.stringify({
        p_nick: clean,
        p_arg_key: argKey(p.argomento),
        p_arg: p.argomento,
        p_type: p.type,
        p_correct: p.correct,
        p_total: p.total,
        p_ms: p.ms,
      }),
    }).catch(() => {})
  ));
}

// ─── lettura ───────────────────────────────────────────────────────────────

function toCell(r: GradeRow): GradeCell {
  const deltaPct = r.last_accuracy - r.best_accuracy;
  return {
    argomento: r.argomento,
    type: r.type,
    best: {
      accuracy: r.best_accuracy, correct: r.best_correct, total: r.best_total,
      ms: r.best_ms, grade: gradeFromPct(r.best_accuracy), at: r.best_at,
    },
    last: {
      accuracy: r.last_accuracy, correct: r.last_correct, total: r.last_total,
      ms: r.last_ms, grade: gradeFromPct(r.last_accuracy), at: r.last_at,
    },
    deltaPct,
    same: deltaPct === 0,
  };
}

const typeRank: Record<QType, number> = { multipla: 0, "vero-falso": 1, aperta: 2 };

/** Raggruppa le righe per argomento → SubjectReport[], ordinati alfabeticamente. */
function groupBySubject(rows: GradeRow[]): SubjectReport[] {
  const byArg = new Map<string, GradeRow[]>();
  for (const r of rows) {
    const k = r.arg_key;
    if (!byArg.has(k)) byArg.set(k, []);
    byArg.get(k)!.push(r);
  }
  const out: SubjectReport[] = [];
  for (const list of byArg.values()) {
    const cells = list.map(toCell).sort((a, b) => typeRank[a.type] - typeRank[b.type]);
    const totalMs = cells.reduce((s, c) => s + c.best.ms, 0);
    const avgAccuracy = Math.round(cells.reduce((s, c) => s + c.best.accuracy, 0) / cells.length);
    const lastAt = list.map(r => r.updated_at).filter(Boolean).sort().pop();
    out.push({ argomento: list[0].argomento, cells, totalMs, avgAccuracy, lastAt });
  }
  out.sort((a, b) => a.argomento.localeCompare(b.argomento, "it"));
  return out;
}

/** Pagella completa di un giocatore. Vuota se il nick non ha voti. */
export async function fetchReport(nick: string): Promise<SubjectReport[]> {
  const key = nick.trim().toLowerCase();
  if (!key) return [];

  if (!gradesConfigured) {
    return groupBySubject(readLocal().filter(r => r.nick.toLowerCase() === key));
  }

  const params = new URLSearchParams({
    select: "nick,arg_key,argomento,type,best_accuracy,best_correct,best_total,best_ms,best_at,last_accuracy,last_correct,last_total,last_ms,last_at,updated_at",
    nick_key: `eq.${key}`,
    order: "argomento.asc",
    limit: "500",
  });
  try {
    const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
    if (!res.ok) return [];
    return groupBySubject((await res.json()) as GradeRow[]);
  } catch {
    return [];
  }
}

/** Solo i voti di un singolo argomento (per il badge in-quiz). */
export async function fetchSubject(nick: string, argomento: string): Promise<SubjectReport | null> {
  const key = nick.trim().toLowerCase();
  const ak = argKey(argomento);
  if (!key || !ak) return null;

  if (!gradesConfigured) {
    const rows = readLocal().filter(r => r.nick.toLowerCase() === key && r.arg_key === ak);
    return rows.length ? groupBySubject(rows)[0] : null;
  }

  const params = new URLSearchParams({
    select: "nick,arg_key,argomento,type,best_accuracy,best_correct,best_total,best_ms,best_at,last_accuracy,last_correct,last_total,last_ms,last_at,updated_at",
    nick_key: `eq.${key}`,
    arg_key: `eq.${ak}`,
  });
  try {
    const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
    if (!res.ok) return null;
    const rows = (await res.json()) as GradeRow[];
    return rows.length ? groupBySubject(rows)[0] : null;
  } catch {
    return null;
  }
}

// ─── helper formato tempo (mm:ss o s.s) ──────────────────────────────────────

export function fmtMs(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}
