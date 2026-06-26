// ─── Festa · API presenze (Supabase, gratis + realtime) ─────────────────────
//
// Stesso approccio dei giochi: niente SDK, parliamo con Supabase via REST
// (fetch) per leggere/scrivere e via WebSocket Realtime (Phoenix channels) per
// gli aggiornamenti live. Riusa le stesse due env PUBBLICHE di Vite:
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Schema tabella in supabase/festa_presenze.sql:
//   id, nome, presenza ('pomeriggio'|'sera'|'no'), cibo, created_at
//
// Se non configurate, lavora in modalità "solo locale" (localStorage), così la
// pagina resta funzionante anche senza backend.

export type Presenza = "pomeriggio" | "sera" | "no";

export interface PresenzaRow {
  id?: number;
  nome: string;
  presenza: Presenza;
  cibo?: string | null;
  created_at?: string;
}

export type Unsubscribe = () => void;

const TABLE = "festa_presenze";
const LOCAL_KEY = "festa-presenze-local";

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const festaConfigured = Boolean(URL && ANON);

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

// ─── Fallback locale ────────────────────────────────────────────────────────
const readLocal = (): PresenzaRow[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
};
const writeLocal = (rows: PresenzaRow[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 200))); } catch {}
};

const sanitize = (row: PresenzaRow): PresenzaRow => ({
  nome: row.nome.trim().slice(0, 40),
  presenza: row.presenza,
  cibo: (row.cibo ?? "").trim().slice(0, 200) || null,
});

/** Inserisce una presenza. Ritorna la riga salvata (o quella locale di fallback). */
export async function submitPresenza(row: PresenzaRow): Promise<PresenzaRow> {
  const clean = sanitize(row);

  if (!festaConfigured) {
    const stored = { ...clean, id: Date.now(), created_at: new Date().toISOString() };
    writeLocal([stored, ...readLocal()]);
    return stored;
  }

  const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...restHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(clean),
  });
  if (!res.ok) throw new Error(`submitPresenza ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as PresenzaRow[];
  return data[0];
}

/** Elenco presenze, dal più recente (newest-first). */
export async function fetchPresenze(limit = 200): Promise<PresenzaRow[]> {
  if (!festaConfigured) return readLocal().slice(0, limit);

  const params = new URLSearchParams({
    select: "id,nome,presenza,cibo,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });
  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchPresenze ${res.status}: ${await res.text()}`);
  return (await res.json()) as PresenzaRow[];
}

// ─── Realtime: nuove presenze in tempo reale via WebSocket ──────────────────
export function subscribePresenze(onInsert: (row: PresenzaRow) => void): Unsubscribe {
  if (!festaConfigured) return () => {};

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
          onInsert(msg.payload.data.record as PresenzaRow);
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
