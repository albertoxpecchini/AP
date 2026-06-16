// ─── Progresso per domanda, PER ACCOUNT (Supabase) ──────────────────────────
//
// Sostituisce gli store locali per-dispositivo (copertura + best per domanda):
// ora il progresso è legato al NOME dell'account, quindi:
//   • account diversi = progressi diversi (niente mischiamento);
//   • sincronizzato fra dispositivi.
//
// Tabella: trivia_progress (SQL in supabase/trivia_progress.sql).
// RPC bulk: trivia_progress_record(p_nick, p_rows jsonb[{id,ok,ms}]).
//
// Fallback solo-locale: se Supabase non è configurato, usa localStorage ma
// SEPARATO per account (chiave per nick), così resta isolato anche offline.

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "trivia_progress";

export const progressConfigured = Boolean(URL && ANON);

const restHeaders = () => ({
  apikey: ANON!,
  Authorization: `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

const nickKey = (n: string) => n.trim().toLowerCase();

// best per domanda
export interface QProgress { ok: boolean; ms: number }
// mappa question_id → progresso
export type ProgressMap = Map<string, QProgress>;

// ─── fallback locale, separato per account ───────────────────────────────────
const localKey = (nick: string) => `trivia-progress::${nickKey(nick)}`;
function readLocal(nick: string): ProgressMap {
  try {
    const raw = JSON.parse(localStorage.getItem(localKey(nick)) || "{}");
    const m: ProgressMap = new Map();
    if (raw && typeof raw === "object") for (const id of Object.keys(raw)) {
      const v = raw[id]; m.set(id, { ok: !!v?.ok, ms: Math.max(0, v?.ms | 0) });
    }
    return m;
  } catch { return new Map(); }
}
function writeLocal(nick: string, m: ProgressMap) {
  const obj: Record<string, QProgress> = {};
  for (const [id, v] of m) obj[id] = v;
  try { localStorage.setItem(localKey(nick), JSON.stringify(obj)); } catch {}
}

// ─── lettura ─────────────────────────────────────────────────────────────────
/** Tutto il progresso dell'account (question_id → {ok, ms}). Vuoto se nuovo. */
export async function fetchProgress(nick: string): Promise<ProgressMap> {
  const key = nickKey(nick);
  if (!key) return new Map();
  if (!progressConfigured) return readLocal(nick);

  const params = new URLSearchParams({
    select: "question_id,ok,best_ms",
    nick_key: `eq.${key}`,
    limit: "5000",
  });
  try {
    const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
    if (!res.ok) return new Map();
    const rows = (await res.json()) as { question_id: string; ok: boolean; best_ms: number }[];
    const m: ProgressMap = new Map();
    for (const r of rows) m.set(r.question_id, { ok: !!r.ok, ms: Math.max(0, r.best_ms | 0) });
    return m;
  } catch { return new Map(); }
}

// ─── scrittura ───────────────────────────────────────────────────────────────
/** Registra gli esiti di una partita (bulk). */
export async function recordProgress(
  nick: string,
  rows: { id: string; ok: boolean; ms: number }[],
): Promise<void> {
  const clean = nick.trim().slice(0, 10);
  if (!clean || !rows.length) return;

  if (!progressConfigured) {
    const m = readLocal(clean);
    for (const r of rows) {
      const prev = m.get(r.id);
      const ms = Math.max(0, r.ms | 0);
      if (!prev) m.set(r.id, { ok: r.ok, ms: r.ok ? ms : 0 });
      else m.set(r.id, {
        ok: prev.ok || r.ok,
        ms: r.ok ? (prev.ok && prev.ms ? Math.min(prev.ms, ms) : ms) : prev.ms,
      });
    }
    writeLocal(clean, m);
    return;
  }

  try {
    await fetch(`${URL}/rest/v1/rpc/trivia_progress_record`, {
      method: "POST",
      headers: restHeaders(),
      body: JSON.stringify({ p_nick: clean, p_rows: rows.map(r => ({ id: r.id, ok: r.ok, ms: Math.max(0, r.ms | 0) })) }),
    });
  } catch { /* offline: la prossima partita riproverà */ }
}
