// ─── Leaderboard backend (Supabase, gratis + realtime) ──────────────────────
//
// Stessa infrastruttura di Angoli/Parole: REST per leggere/scrivere, WebSocket
// Realtime per gli aggiornamenti live. Servono solo due valori PUBBLICI:
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Se non configurati, la classifica lavora in modalità "solo locale"
// (localStorage), così il gioco resta sempre funzionante.
//
// Schema atteso (SQL in TRIVIA-LEADERBOARD.md):
//   create table trivia_scores (
//     id bigint generated always as identity primary key,
//     nick text not null,
//     score int not null,
//     chapter text not null,        -- id capitolo o "all"
//     accuracy int not null,        -- % risposte corrette (0–100)
//     best_streak int not null default 0,
//     created_at timestamptz not null default now()
//   );

export interface ScoreRow {
  id?: number;
  nick: string;
  score: number;
  chapter: string;     // id capitolo (es. "gotico") oppure "all"
  accuracy: number;    // 0–100
  best_streak: number;
  created_at?: string;
}

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "trivia_scores";

export const leaderboardConfigured = Boolean(URL && ANON);

const LOCAL_KEY = "trivia-scores-local";

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
    chapter: row.chapter,
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
 * Top punteggi. `chapter` opzionale filtra per capitolo.
 * Ordinati per punteggio decrescente (sempre desc, come da preferenza utente).
 */
export async function fetchTop(limit = 50, chapter?: string): Promise<ScoreRow[]> {
  if (!leaderboardConfigured) {
    let rows = readLocal();
    if (chapter != null) rows = rows.filter(r => r.chapter === chapter);
    return rows.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "*",
    order: "score.desc",
    limit: String(limit),
  });
  if (chapter != null) params.set("chapter", `eq.${chapter}`);

  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchTop ${res.status}: ${await res.text()}`);
  return (await res.json()) as ScoreRow[];
}

// ─── Classifica "Totale" (somma del miglior punteggio per capitolo) ─────────
//
// Confronto equo fra giocatori: NON la somma di tutte le partite (chi gioca di
// più vincerebbe sempre), ma per ogni giocatore la somma del SUO miglior
// punteggio in ciascun CAPITOLO singolo. Le partite "misto"/"all" non contano.

export interface TotalRow {
  nick: string;
  score: number;        // somma dei best per capitolo
  chapters: number;     // quanti capitoli distinti ha giocato
  accuracy: number;     // media (pesata sui best) — indicativa
}

/**
 * Aggrega i punteggi per capitolo singolo in un totale per giocatore.
 * @param chapterIds capitoli "veri" da considerare (esclude misto/all)
 */
export async function fetchTotals(chapterIds: string[], limit = 50): Promise<TotalRow[]> {
  const chapSet = new Set(chapterIds);

  let all: ScoreRow[];
  if (!leaderboardConfigured) {
    all = readLocal().filter(r => chapSet.has(r.chapter));
  } else {
    // Scarica tutti i punteggi dei capitoli veri (no misto/all) in un colpo.
    const params = new URLSearchParams({
      select: "nick,score,chapter,accuracy",
      chapter: `in.(${chapterIds.join(",")})`,
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

  // best per (nick, chapter) — nick aggregato CASE-INSENSITIVE (alberto == Alberto)
  type Best = { score: number; accuracy: number };
  const byNick = new Map<string, { label: string; chaps: Map<string, Best> }>();
  for (const r of all) {
    if (!chapSet.has(r.chapter)) continue;
    const key = r.nick.trim().toLowerCase();
    let e = byNick.get(key);
    if (!e) { e = { label: r.nick, chaps: new Map() }; byNick.set(key, e); }
    const prev = e.chaps.get(r.chapter);
    if (!prev || r.score > prev.score) e.chaps.set(r.chapter, { score: r.score, accuracy: r.accuracy });
  }

  const out: TotalRow[] = [];
  for (const { label, chaps } of byNick.values()) {
    let score = 0, accSum = 0;
    for (const b of chaps.values()) { score += b.score; accSum += b.accuracy; }
    out.push({ nick: label, score, chapters: chaps.size, accuracy: Math.round(accSum / chaps.size) });
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
