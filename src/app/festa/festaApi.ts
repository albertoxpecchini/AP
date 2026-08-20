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
// Se non configurate, la LETTURA lavora in modalità "solo locale"
// (localStorage), così la pagina resta funzionante anche senza backend. La
// scrittura invece passa da /api/festa-rsvp, che inserisce con la service-role
// e della anon key non sa che farsene: vedi submitPresenza.

export type Presenza = "pomeriggio" | "sera" | "no";

// Giorno della festa: "27" = sabato 27, "28" = domenica 28. Separa i due inviti.
export type Giorno = "27" | "28";

export interface PresenzaRow {
  id?: number;
  nome: string;
  presenza: Presenza;
  giorno: Giorno;
  cibo?: string | null;
  created_at?: string;
}

export type Unsubscribe = () => void;

const TABLE = "festa_presenze";
const LOCAL_KEY = "festa-presenze-local";

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Vero quando le LETTURE pubbliche (lista + realtime) possono partire. */
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
  giorno: row.giorno,
  cibo: (row.cibo ?? "").trim().slice(0, 200) || null,
});

/** Inserisce una presenza. Ritorna la riga salvata (o quella locale di fallback). */
export async function submitPresenza(row: PresenzaRow): Promise<PresenzaRow> {
  const clean = sanitize(row);

  // Scrittura via endpoint blindato (origine + rate-limit, insert con
  // service-role). Si prova SEMPRE, anche senza anon key: quella serve alle
  // letture, non a questo. (Stessa logica in sostieni/donazioniApi.ts.)
  let res: Response | null = null;
  try {
    res = await fetch("/api/festa-rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
  } catch {
    res = null; // rete assente, o endpoint non montato (sito statico)
  }

  if (res?.ok) return (await res.json()) as PresenzaRow;

  // 503 = il server non ha le env Supabase, cioè "niente backend": lì si
  // ripiega in locale. Ogni altro rifiuto (400, 429, 502) resta un errore
  // vero e viene lanciato, come prima.
  if (res && res.status !== 503) {
    throw new Error(`submitPresenza ${res.status}: ${await res.text()}`);
  }

  const stored = { ...clean, id: Date.now(), created_at: new Date().toISOString() };
  writeLocal([stored, ...readLocal()]);
  return stored;
}

/** Elenco presenze di un dato giorno, dal più recente (newest-first). */
export async function fetchPresenze(giorno: Giorno, limit = 200): Promise<PresenzaRow[]> {
  if (!festaConfigured) {
    return readLocal().filter((r) => r.giorno === giorno).slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "id,nome,presenza,giorno,cibo,created_at",
    giorno: `eq.${giorno}`,
    order: "created_at.desc",
    limit: String(limit),
  });
  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchPresenze ${res.status}: ${await res.text()}`);
  return (await res.json()) as PresenzaRow[];
}

// ─── Realtime: nuove presenze in tempo reale ───────────────────────────────
export function subscribePresenze(onInsert: (row: PresenzaRow) => void): Unsubscribe {
  // ── Modalità statica/locale: niente backend, ma comunque "live" tra schede ──
  // Quando un'altra scheda/sessione scrive su localStorage il browser emette un
  // evento `storage` (solo nelle ALTRE schede): da lì ricaviamo le righe nuove e
  // le inoltriamo, così la lista si aggiorna in tempo reale anche senza Supabase.
  if (!festaConfigured) {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== LOCAL_KEY) return;
      let oldRows: PresenzaRow[] = [];
      let newRows: PresenzaRow[] = [];
      try { oldRows = ev.oldValue ? JSON.parse(ev.oldValue) : []; } catch {}
      try { newRows = ev.newValue ? JSON.parse(ev.newValue) : []; } catch {}
      const oldIds = new Set(oldRows.map((r) => r.id));
      // writeLocal mette le nuove in testa: le emetto dalla più vecchia alla più
      // nuova così l'ordine finale lato UI resta newest-first.
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
    // Il costruttore può lanciare in modo sincrono (es. WS bloccato dalla CSP su
    // Safari): va contenuto o l'errore risale nell'effect e imbianca la pagina.
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }

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
