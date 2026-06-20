// ─── Leaderboard backend (Supabase, gratis + realtime) ──────────────────────
//
// Stessa infrastruttura di Trivia/Angoli/Parole: REST per leggere/scrivere,
// WebSocket Realtime per gli aggiornamenti live. Servono solo due valori
// PUBBLICI (le stesse env condivise da tutti i giochi):
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Se non configurati, la classifica lavora in modalità "solo locale"
// (localStorage), così il gioco resta sempre funzionante.
//
// Schema atteso (SQL in supabase/mappa_scores.sql):
//   create table mappa_scores (
//     id bigint generated always as identity primary key,
//     nick text not null,
//     score int not null,
//     mode text not null,           -- livello di difficoltà (es. "esploratore")
//     accuracy int not null,        -- % città trovate (0–100)
//     best_streak int not null default 0,
//     created_at timestamptz not null default now()
//   );

export interface ScoreRow {
  id?: number;
  nick: string;
  score: number;
  mode: string;        // livello di difficoltà oppure "all"
  accuracy: number;    // 0–100
  best_streak: number;
  created_at?: string;
}

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "mappa_scores";

export const leaderboardConfigured = Boolean(URL && ANON);

const LOCAL_KEY = "mappa-scores-local";

function readLocal(): ScoreRow[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function writeLocal(rows: ScoreRow[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 100))); } catch {}
}

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

/** Inserisce un punteggio. Ritorna la riga salvata (o quella locale di fallback). */
export async function submitScore(row: ScoreRow): Promise<ScoreRow> {
  const clean: ScoreRow = {
    nick: row.nick.slice(0, 10),
    score: Math.max(0, Math.round(row.score)),
    mode: row.mode,
    accuracy: Math.min(100, Math.max(0, Math.round(row.accuracy))),
    best_streak: Math.max(0, Math.round(row.best_streak)),
  };

  if (!leaderboardConfigured) {
    const stored: ScoreRow = { ...clean, id: Date.now(), created_at: new Date().toISOString() };
    writeLocal([stored, ...readLocal()]);
    return stored;
  }

  const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...restHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(clean),
  });
  if (!res.ok) throw new Error(`submitScore ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as ScoreRow[];
  return data[0];
}

/**
 * Top punteggi. `mode` opzionale filtra per livello di difficoltà.
 * Ordinati per punteggio decrescente (sempre desc, come da preferenza utente).
 */
export async function fetchTop(limit = 50, mode?: string): Promise<ScoreRow[]> {
  if (!leaderboardConfigured) {
    let rows = readLocal();
    if (mode != null) rows = rows.filter(r => r.mode === mode);
    return rows.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "*",
    order: "score.desc",
    limit: String(limit),
  });
  if (mode != null) params.set("mode", `eq.${mode}`);

  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchTop ${res.status}: ${await res.text()}`);
  return (await res.json()) as ScoreRow[];
}

// ─── Record personali PER ACCOUNT (miglior precisione + streak record) ──────
//
// Letti da Supabase (tabella scores), legati al NOME (case-insensitive). Così
// "Miglior streak" e "Record" nel menu NON sono più per-dispositivo.
export interface PlayerBests { bestScore: number; bestStreak: number }

export async function fetchPlayerBests(nick: string): Promise<PlayerBests> {
  const key = nick.trim().toLowerCase();
  if (!key) return { bestScore: 0, bestStreak: 0 };

  let rows: ScoreRow[];
  if (!leaderboardConfigured) {
    rows = readLocal().filter(r => r.nick.trim().toLowerCase() === key);
  } else {
    const params = new URLSearchParams({ select: "nick,score,best_streak", order: "score.desc", limit: "2000" });
    try {
      const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
      rows = res.ok ? ((await res.json()) as ScoreRow[]).filter(r => r.nick.trim().toLowerCase() === key) : [];
    } catch { rows = []; }
  }
  let bestScore = 0, bestStreak = 0;
  for (const r of rows) {
    bestScore = Math.max(bestScore, r.score || 0);
    bestStreak = Math.max(bestStreak, r.best_streak || 0);
  }
  return { bestScore, bestStreak };
}

// ─── Classifica "Totale" (somma del miglior punteggio per livello) ──────────
//
// Confronto equo fra giocatori: per ogni giocatore la somma del SUO miglior
// punteggio in ciascun LIVELLO singolo. Così non vince solo chi gioca di più.

export interface TotalRow {
  nick: string;
  score: number;        // somma dei best per livello
  modes: number;        // quanti livelli distinti ha giocato
  accuracy: number;     // media (pesata sui best) — indicativa
}

/**
 * Aggrega i punteggi per livello singolo in un totale per giocatore.
 * @param modeIds livelli "veri" da considerare
 */
export async function fetchTotals(modeIds: string[], limit = 50): Promise<TotalRow[]> {
  const modeSet = new Set(modeIds);

  let all: ScoreRow[];
  if (!leaderboardConfigured) {
    all = readLocal().filter(r => modeSet.has(r.mode));
  } else {
    const params = new URLSearchParams({
      select: "nick,score,mode,accuracy",
      mode: `in.(${modeIds.join(",")})`,
      order: "score.desc",
      limit: "2000",
    });
    try {
      const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
      all = res.ok ? ((await res.json()) as ScoreRow[]) : [];
    } catch {
      all = [];
    }
  }

  // best per (nick, mode) — nick aggregato CASE-INSENSITIVE (alberto == Alberto)
  type Best = { score: number; accuracy: number };
  const byNick = new Map<string, { label: string; modes: Map<string, Best> }>();
  for (const r of all) {
    if (!modeSet.has(r.mode)) continue;
    const key = r.nick.trim().toLowerCase();
    let e = byNick.get(key);
    if (!e) { e = { label: r.nick, modes: new Map() }; byNick.set(key, e); }
    const prev = e.modes.get(r.mode);
    if (!prev || r.score > prev.score) e.modes.set(r.mode, { score: r.score, accuracy: r.accuracy });
  }

  const out: TotalRow[] = [];
  for (const { label, modes } of byNick.values()) {
    let score = 0, accSum = 0;
    for (const b of modes.values()) { score += b.score; accSum += b.accuracy; }
    out.push({ nick: label, score, modes: modes.size, accuracy: Math.round(accSum / modes.size) });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

// ─── Realtime: nuovi punteggi in tempo reale via WebSocket ──────────────────

export type Unsubscribe = () => void;

export function subscribeToScores(onInsert: (row: ScoreRow) => void): Unsubscribe {
  if (!leaderboardConfigured) return () => {};

  let ws: WebSocket | null = null;
  let hb: ReturnType<typeof setInterval> | null = null;
  let ref = 0;
  let closed = false;

  const wsUrl = `${URL!.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws!.send(JSON.stringify({
        topic: `realtime:public:${TABLE}`,
        event: "phx_join",
        payload: {
          config: {
            postgres_changes: [{ event: "INSERT", schema: "public", table: TABLE }],
          },
        },
        ref: String(++ref),
      }));
      hb = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(++ref) }));
        }
      }, 30000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === "postgres_changes" && msg.payload?.data?.type === "INSERT") {
          onInsert(msg.payload.data.record as ScoreRow);
        }
      } catch {}
    };

    ws.onclose = () => {
      if (hb) { clearInterval(hb); hb = null; }
      if (!closed) setTimeout(connect, 2000);
    };

    ws.onerror = () => { try { ws?.close(); } catch {} };
  };

  connect();

  return () => {
    closed = true;
    if (hb) clearInterval(hb);
    try { ws?.close(); } catch {}
  };
}
