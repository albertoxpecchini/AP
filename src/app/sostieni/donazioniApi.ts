// ─── Sostieni · API libro dei donatori e sponsor (Supabase, gratis + realtime) ──
//
// Stesso approccio della festa e dei giochi: niente SDK, parliamo con Supabase
// via REST (fetch) per leggere/scrivere e via WebSocket Realtime per gli
// aggiornamenti live. Riusa le STESSE due env PUBBLICHE di Vite:
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Schema tabella in supabase/donatori.sql:
//   id, nome, tipo ('donatore'|'sponsor'), importo, messaggio, link, created_at
//
// Se non configurate, lavora in modalità "solo locale" (localStorage), così il
// libro resta funzionante anche senza backend.

export type Tipo = "donatore" | "sponsor";

export interface DonatoreRow {
  id?: number;
  nome: string;
  tipo: Tipo;
  importo?: string | null;
  messaggio?: string | null;
  link?: string | null;
  created_at?: string;
}

export type Unsubscribe = () => void;

const TABLE = "donatori";
const LOCAL_KEY = "donatori-local";

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const donazioniConfigured = Boolean(URL && ANON);

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

// ─── Fallback locale ────────────────────────────────────────────────────────
const readLocal = (): DonatoreRow[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
};
const writeLocal = (rows: DonatoreRow[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 200))); } catch {}
};

const trimOrNull = (s: string | null | undefined, max: number): string | null => {
  const v = (s ?? "").trim().slice(0, max);
  return v || null;
};

const sanitize = (row: DonatoreRow): DonatoreRow => ({
  nome: row.nome.trim().slice(0, 40),
  tipo: row.tipo === "sponsor" ? "sponsor" : "donatore",
  importo: trimOrNull(row.importo, 20),
  messaggio: trimOrNull(row.messaggio, 280),
  link: trimOrNull(row.link, 200),
});

/** Firma il libro. Ritorna la riga salvata (o quella locale di fallback). */
export async function submitDonatore(row: DonatoreRow): Promise<DonatoreRow> {
  const clean = sanitize(row);

  if (!donazioniConfigured) {
    const stored = { ...clean, id: Date.now(), created_at: new Date().toISOString() };
    writeLocal([stored, ...readLocal()]);
    return stored;
  }

  const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...restHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(clean),
  });
  if (!res.ok) throw new Error(`submitDonatore ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as DonatoreRow[];
  return data[0];
}

/** Elenco firme dal più recente (newest-first). */
export async function fetchDonatori(limit = 200): Promise<DonatoreRow[]> {
  if (!donazioniConfigured) {
    return readLocal().slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "id,nome,tipo,importo,messaggio,link,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });
  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchDonatori ${res.status}: ${await res.text()}`);
  return (await res.json()) as DonatoreRow[];
}

// ─── Realtime: nuove firme in tempo reale ──────────────────────────────────
export function subscribeDonatori(onInsert: (row: DonatoreRow) => void): Unsubscribe {
  // ── Modalità statica/locale: niente backend, ma comunque "live" tra schede ──
  if (!donazioniConfigured) {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== LOCAL_KEY) return;
      let oldRows: DonatoreRow[] = [];
      let newRows: DonatoreRow[] = [];
      try { oldRows = ev.oldValue ? JSON.parse(ev.oldValue) : []; } catch {}
      try { newRows = ev.newValue ? JSON.parse(ev.newValue) : []; } catch {}
      const oldIds = new Set(oldRows.map((r) => r.id));
      newRows.filter((r) => !oldIds.has(r.id)).reverse().forEach(onInsert);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }

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
          onInsert(msg.payload.data.record as DonatoreRow);
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
