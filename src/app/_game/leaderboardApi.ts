// ─── MOTORE GIOCHI · Leaderboard backend (Supabase, gratis + realtime) ──────
//
// Fonte unica del backend classifiche, condivisa da tutti i giochi. Prima ogni
// gioco aveva una copia quasi identica di questo file (~230 righe × 4): cambiava
// solo il nome tabella, la chiave localStorage e le colonne extra. Il Realtime
// WebSocket era IDENTICO al 100%.
//
// Niente SDK: parliamo con Supabase via REST (fetch) per leggere/scrivere e via
// WebSocket Realtime (Phoenix channels) per gli aggiornamenti live. Servono solo
// due valori PUBBLICI, letti dalle env di Vite (gli stessi per tutti i giochi):
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Se non configurati, la classifica lavora in modalità "solo locale"
// (localStorage), così ogni gioco resta sempre funzionante anche senza backend.
//
// Ogni gioco crea la sua API con createScoreApi({ table, localKey, ... }) e
// re-esporta i metodi: la superficie pubblica del gioco resta identica.

export interface BaseScoreRow {
  id?: number;
  nick: string;
  score: number;
  best_streak: number;
  created_at?: string;
}

export type Unsubscribe = () => void;

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const leaderboardConfigured = Boolean(URL && ANON);

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

export interface ScoreApiConfig<Row extends BaseScoreRow> {
  /** Nome tabella Supabase (es. "trivia_scores"). */
  table: string;
  /** Chiave localStorage per il fallback offline (es. "trivia-scores-local"). */
  localKey: string;
  /** Colonna usata per filtrare fetchTop (es. "chapter" | "mode"). Assente = nessun filtro. */
  partitionKey?: keyof Row & string;
  /** Normalizza/clampa la riga prima di inserirla e salvarla in locale. */
  sanitize: (row: Row) => Partial<Row>;
}

export interface FetchRowsOpts {
  select?: string;
  order?: string;
  limit?: number;
  /** Filtri PostgREST già formattati, es. { mode: "in.(a,b)" } oppure { chapter: "eq.gotico" }. */
  filter?: Record<string, string>;
}

export interface ScoreApi<Row extends BaseScoreRow> {
  submitScore: (row: Row) => Promise<Row>;
  fetchTop: (limit?: number, partitionValue?: Row[keyof Row]) => Promise<Row[]>;
  /** Primitiva GET remota grezza, per le aggregazioni specifiche del gioco. */
  fetchRows: (opts?: FetchRowsOpts) => Promise<Row[]>;
  readLocal: () => Row[];
  subscribeToScores: (onInsert: (row: Row) => void) => Unsubscribe;
}

export function createScoreApi<Row extends BaseScoreRow>(cfg: ScoreApiConfig<Row>): ScoreApi<Row> {
  const { table, localKey, partitionKey, sanitize } = cfg;

  const readLocal = (): Row[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(localKey) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  };
  const writeLocal = (rows: Row[]) => {
    try { localStorage.setItem(localKey, JSON.stringify(rows.slice(0, 100))); } catch {}
  };

  /** Inserisce un punteggio. Ritorna la riga salvata (o quella locale di fallback). */
  const submitScore = async (row: Row): Promise<Row> => {
    const clean = sanitize(row) as Row;

    if (!leaderboardConfigured) {
      const stored = { ...clean, id: Date.now(), created_at: new Date().toISOString() } as Row;
      writeLocal([stored, ...readLocal()]);
      return stored;
    }

    const res = await fetch(`${URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...restHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(clean),
    });
    if (!res.ok) throw new Error(`submitScore ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as Row[];
    return data[0];
  };

  const fetchRows = async (opts: FetchRowsOpts = {}): Promise<Row[]> => {
    const { select = "*", order = "score.desc", limit = 50, filter } = opts;
    const params = new URLSearchParams({ select, order, limit: String(limit) });
    if (filter) for (const [k, v] of Object.entries(filter)) params.set(k, v);
    const res = await fetch(`${URL}/rest/v1/${table}?${params}`, { headers: restHeaders() });
    if (!res.ok) throw new Error(`fetchRows ${res.status}: ${await res.text()}`);
    return (await res.json()) as Row[];
  };

  /**
   * Top punteggi. `partitionValue` opzionale filtra per la colonna `partitionKey`.
   * Ordinati per punteggio DECRESCENTE (sempre desc, come da preferenza utente).
   */
  const fetchTop = async (limit = 50, partitionValue?: Row[keyof Row]): Promise<Row[]> => {
    if (!leaderboardConfigured) {
      let rows = readLocal();
      if (partitionKey && partitionValue != null) rows = rows.filter(r => r[partitionKey] === partitionValue);
      return rows.sort((a, b) => b.score - a.score).slice(0, limit);
    }
    const filter: Record<string, string> = {};
    if (partitionKey && partitionValue != null) filter[partitionKey] = `eq.${partitionValue}`;
    return fetchRows({ select: "*", order: "score.desc", limit, filter });
  };

  // ─── Realtime: nuovi punteggi in tempo reale via WebSocket ────────────────
  const subscribeToScores = (onInsert: (row: Row) => void): Unsubscribe => {
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
          topic: `realtime:public:${table}`,
          event: "phx_join",
          payload: {
            config: {
              postgres_changes: [{ event: "INSERT", schema: "public", table }],
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
            onInsert(msg.payload.data.record as Row);
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
  };

  return { submitScore, fetchTop, fetchRows, readLocal, subscribeToScores };
}

// ─── Helper di aggregazione condivisi ───────────────────────────────────────

export interface TotalAgg {
  nick: string;
  score: number;     // somma dei best per gruppo singolo
  count: number;     // quanti gruppi distinti ha giocato
  accuracy: number;  // media (sui best) — indicativa
}

/**
 * Classifica "Totale": per ogni giocatore somma il SUO miglior punteggio in
 * ciascun gruppo singolo (così non vince solo chi gioca di più). Nick aggregato
 * CASE-INSENSITIVE (alberto == Alberto). I gruppi fuori da `allowed` (es.
 * "misto"/"all") sono ignorati.
 */
export function aggregateTotals<Row extends BaseScoreRow & { accuracy: number }>(
  rows: Row[],
  key: keyof Row,
  allowed: Set<Row[keyof Row]>,
  limit = 50,
): TotalAgg[] {
  type Best = { score: number; accuracy: number };
  const byNick = new Map<string, { label: string; groups: Map<unknown, Best> }>();
  for (const r of rows) {
    if (!allowed.has(r[key] as Row[keyof Row])) continue;
    const k = r.nick.trim().toLowerCase();
    let e = byNick.get(k);
    if (!e) { e = { label: r.nick, groups: new Map() }; byNick.set(k, e); }
    const prev = e.groups.get(r[key]);
    if (!prev || r.score > prev.score) e.groups.set(r[key], { score: r.score, accuracy: r.accuracy });
  }

  const out: TotalAgg[] = [];
  for (const { label, groups } of byNick.values()) {
    let score = 0, accSum = 0;
    for (const b of groups.values()) { score += b.score; accSum += b.accuracy; }
    out.push({ nick: label, score, count: groups.size, accuracy: Math.round(accSum / groups.size) });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
