// ─── MiMa · lista alcolici condivisa (Supabase REST + Realtime) ─────────────
//
// Stesso approccio di src/app/festa/festaApi.ts: niente SDK, si parla con
// Supabase via REST (fetch) per leggere e via WebSocket Realtime (canali
// Phoenix) per gli aggiornamenti dal vivo. Le stesse due env pubbliche di Vite:
//
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Schema in supabase/mima_alcolici.sql. Le scritture NON vanno dritte al DB:
// passano da /api/mima-alcolici (origine + rate-limit + service-role).
//
// Rispetto alla festa qui servono tre eventi e non uno solo: la lista si
// aggiunge, si spunta e si cancella, quindi il canale ascolta INSERT, UPDATE e
// DELETE — e per avere la riga intera nel payload di DELETE la tabella è in
// `replica identity full`.
//
// Senza env configurate lavora in "solo locale" (localStorage): la lista resta
// nel browser di chi la scrive, ma fra SCHEDE dello stesso browser continua ad
// aggiornarsi dal vivo grazie all'evento `storage`. Non è la condivisione fra
// noi tre, ed è per questo che la pagina lo dice a chiare lettere invece di
// far finta di niente.

export interface Alcolico {
  id: number;
  chi: string;
  voce: string;
  qta?: string | null;
  note?: string | null;
  preso: boolean;
  created_at?: string;
}

export type Unsubscribe = () => void;

const TABLE = "mima_alcolici";
const LOCAL_KEY = "mima-alcolici-local";
const SELECT = "id,chi,voce,qta,note,preso,created_at";

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Vero quando la lista è davvero condivisa fra dispositivi diversi. */
export const alcoliciShared = Boolean(URL && ANON);

const restHeaders = () => ({
  apikey: ANON!,
  Authorization: `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

const clip = (v: string | null | undefined, max: number) =>
  (v ?? "").trim().slice(0, max) || null;

// ─── Ripiego locale ─────────────────────────────────────────────────────────
function readLocal(): Alcolico[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
function writeLocal(rows: Alcolico[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* storage pieno o negato: la lista vive solo in memoria */
  }
}

async function post(method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const res = await fetch("/api/mima-alcolici", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} /api/mima-alcolici ${res.status}: ${await res.text()}`);
  return res.json();
}

/** La lista intera, dalla più vecchia alla più nuova (si legge come una lista). */
export async function fetchAlcolici(limit = 200): Promise<Alcolico[]> {
  if (!alcoliciShared) return readLocal();

  const params = new URLSearchParams({
    select: SELECT,
    order: "created_at.asc",
    limit: String(limit),
  });
  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchAlcolici ${res.status}: ${await res.text()}`);
  return (await res.json()) as Alcolico[];
}

export async function addAlcolico(input: {
  chi: string;
  voce: string;
  qta?: string;
  note?: string;
}): Promise<Alcolico> {
  const clean = {
    chi: (input.chi ?? "").trim().slice(0, 40),
    voce: (input.voce ?? "").trim().slice(0, 80),
    qta: clip(input.qta, 30),
    note: clip(input.note, 200),
  };
  if (!clean.chi || !clean.voce) throw new Error("Servono almeno il nome e la voce");

  if (!alcoliciShared) {
    const row: Alcolico = {
      ...clean,
      id: Date.now(),
      preso: false,
      created_at: new Date().toISOString(),
    };
    writeLocal([...readLocal(), row]);
    return row;
  }
  return (await post("POST", clean)) as Alcolico;
}

export async function toggleAlcolico(id: number, preso: boolean): Promise<void> {
  if (!alcoliciShared) {
    writeLocal(readLocal().map((r) => (r.id === id ? { ...r, preso } : r)));
    return;
  }
  await post("PATCH", { id, preso });
}

export async function removeAlcolico(id: number): Promise<void> {
  if (!alcoliciShared) {
    writeLocal(readLocal().filter((r) => r.id !== id));
    return;
  }
  await post("DELETE", { id });
}

// ─── Realtime ───────────────────────────────────────────────────────────────
export interface AlcoliciEvents {
  onInsert: (row: Alcolico) => void;
  onUpdate: (row: Alcolico) => void;
  onDelete: (id: number) => void;
}

export function subscribeAlcolici(ev: AlcoliciEvents): Unsubscribe {
  // Modalità locale: l'evento `storage` scatta solo nelle ALTRE schede, quindi
  // basta rileggere e confrontare per capire cos'è cambiato.
  if (!alcoliciShared) {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCAL_KEY) return;
      let before: Alcolico[] = [];
      let after: Alcolico[] = [];
      try { before = e.oldValue ? JSON.parse(e.oldValue) : []; } catch { /* valore illeggibile */ }
      try { after = e.newValue ? JSON.parse(e.newValue) : []; } catch { /* valore illeggibile */ }
      const beforeById = new Map(before.map((r) => [r.id, r]));
      const afterIds = new Set(after.map((r) => r.id));
      for (const r of after) {
        const old = beforeById.get(r.id);
        if (!old) ev.onInsert(r);
        else if (old.preso !== r.preso) ev.onUpdate(r);
      }
      for (const r of before) if (!afterIds.has(r.id)) ev.onDelete(r.id);
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
    // Il costruttore può lanciare in modo sincrono (WebSocket bloccato dalla
    // CSP su Safari): va contenuto, o l'errore risale nell'effect e imbianca
    // la pagina.
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
            postgres_changes: [
              { event: "INSERT", schema: "public", table: TABLE },
              { event: "UPDATE", schema: "public", table: TABLE },
              { event: "DELETE", schema: "public", table: TABLE },
            ],
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

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event !== "postgres_changes") return;
        const d = msg.payload?.data;
        if (!d) return;
        if (d.type === "INSERT") ev.onInsert(d.record as Alcolico);
        else if (d.type === "UPDATE") ev.onUpdate(d.record as Alcolico);
        else if (d.type === "DELETE") {
          const id = Number(d.old_record?.id);
          if (Number.isFinite(id)) ev.onDelete(id);
        }
      } catch {
        /* messaggio non nostro o malformato */
      }
    };

    ws.onclose = () => {
      if (hb) { clearInterval(hb); hb = null; }
      if (!closed) setTimeout(connect, 2000);
    };

    ws.onerror = () => { try { ws?.close(); } catch { /* già chiuso */ } };
  };

  connect();

  return () => {
    closed = true;
    if (hb) clearInterval(hb);
    try { ws?.close(); } catch { /* già chiuso */ }
  };
}
