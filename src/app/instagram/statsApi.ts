// ─── Contatore confronti (Supabase, gratis + realtime) ──────────────────────
//
// Stesso approccio di festa/giochi: niente SDK, REST via fetch + WebSocket
// Realtime per l'aggiornamento live. Un'unica riga `tool_stats` con un contatore
// globale, incrementato da una RPC atomica (bump_tool_stat) così due utenti
// insieme non si sovrascrivono. Schema in supabase/tool_stats.sql.
//
// Se Supabase non è configurato (VITE_SUPABASE_URL/ANON mancanti) o la tabella
// non esiste ancora, le funzioni degradano in silenzio (ritornano null) e la UI
// nasconde il contatore: la pagina resta perfetta senza backend.

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const statsConfigured = Boolean(URL && ANON);

const TABLE = "tool_stats";
const STAT_ID = "instagram_compare";

// Lettura e incremento passano dall'endpoint hardenizzato /api/ig-stats
// (controllo origine + rate-limit lato server). La sottoscrizione realtime, qui
// sotto, resta diretta a Supabase perché è sola LETTURA pubblica.
const readJsonCount = (j: any): number | null =>
  j && typeof j.count === "number" ? j.count : null;

/** Legge il totale attuale dei confronti, o null se non disponibile. */
export async function fetchCount(): Promise<number | null> {
  try {
    const res = await fetch("/api/ig-stats", { method: "GET" });
    if (!res.ok) return null;
    return readJsonCount(await res.json());
  } catch {
    return null;
  }
}

/** Incrementa il contatore (via endpoint) e ritorna il nuovo totale (o null). */
export async function bumpCount(): Promise<number | null> {
  try {
    const res = await fetch("/api/ig-stats", { method: "POST" });
    if (!res.ok) return null;
    return readJsonCount(await res.json());
  } catch {
    return null;
  }
}

/** Aggiornamenti live del totale (altri utenti). Ritorna la funzione di unsubscribe. */
export function subscribeCount(onChange: (n: number) => void): () => void {
  if (!statsConfigured) return () => {};

  let ws: WebSocket | null = null;
  let hb: ReturnType<typeof setInterval> | null = null;
  let ref = 0;
  let closed = false;

  const wsUrl = `${URL!.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`;

  const grab = (rec: any) => {
    if (rec && rec.id === STAT_ID && typeof rec.count === "number") onChange(rec.count);
  };

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      ws!.send(JSON.stringify({
        topic: `realtime:public:${TABLE}`,
        event: "phx_join",
        payload: { config: { postgres_changes: [{ event: "*", schema: "public", table: TABLE }] } },
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
        if (msg.event === "postgres_changes") grab(msg.payload?.data?.record);
      } catch { /* ignora */ }
    };
    ws.onclose = () => {
      if (hb) { clearInterval(hb); hb = null; }
      if (!closed) setTimeout(connect, 2000);
    };
    ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
  };

  connect();
  return () => {
    closed = true;
    if (hb) clearInterval(hb);
    try { ws?.close(); } catch { /* noop */ }
  };
}
