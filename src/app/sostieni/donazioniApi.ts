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
// Se non configurate, la LETTURA lavora in modalità "solo locale"
// (localStorage), così il libro resta funzionante anche senza backend.
//
// La SCRITTURA no: quella passa da /api/sponsor, che inserisce con la
// service-role e non ha bisogno della anon key. Vale la pena distinguere,
// perché sono due chiavi diverse in due posti diversi: legarle insieme voleva
// dire che un ambiente con la sola service-role (il .env di sviluppo, per
// mesi) mandava le firme in localStorage senza dirlo a nessuno, mentre
// l'endpoint che avrebbe potuto scriverle stava lì acceso.

// Il filtro (parolacce, insulti, link di spam) è lo STESSO del server: la lista
// vive in lib/parolacce.ts e la usano tutt'e due. Qui serve solo a dirlo subito
// a chi scrive, senza un giro in rete; la porta chiusa è quella di /api/sponsor.
import { testoHaParolacce, testoHaLink, linkPulito } from "../../../lib/parolacce";

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

/** Vero quando le LETTURE pubbliche (lista + realtime) possono partire. */
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
  link: linkPulito(trimOrNull(row.link, 200)),
});

/**
 * Motivo per cui una firma non è accettabile, in italiano e già pronto da
 * mostrare — oppure null se va bene. Le stesse regole di /api/sponsor: qui
 * anticipano il no, lì lo impongono.
 */
export function motivoRifiuto(nome: string, messaggio?: string | null): string | null {
  const testo = `${nome} ${messaggio ?? ""}`;
  if (!nome.trim()) return "Serve almeno il nome.";
  if (testoHaParolacce(testo)) return "Il testo contiene parole non consentite: riscrivilo, per favore.";
  if (testoHaLink(testo)) return "Niente indirizzi web nel nome o nel messaggio.";
  return null;
}

/** Firma il libro. Ritorna la riga salvata (o quella locale di fallback). */
export async function submitDonatore(row: DonatoreRow): Promise<DonatoreRow> {
  const clean = sanitize(row);

  // Anche il ripiego locale passa dal filtro: senza, bastava staccare la rete
  // per vedersi la parolaccia stampata nel libro (e restarci, in quel browser).
  const motivo = motivoRifiuto(clean.nome, clean.messaggio);
  if (motivo) throw new Error(motivo);

  // Scrittura via endpoint blindato (origine + rate-limit, insert con
  // service-role). Si prova SEMPRE, anche senza anon key: quella serve alle
  // letture, non a questo.
  let res: Response | null = null;
  try {
    res = await fetch("/api/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });
  } catch {
    res = null; // rete assente, o endpoint non montato (sito statico)
  }

  if (res?.ok) return (await res.json()) as DonatoreRow;

  // 503 è l'unico "no" che vuol dire davvero niente backend: lo restituisce
  // insertDonatore quando al server mancano URL o chiave. Ogni altro rifiuto
  // (400 dati non validi, 429 rate-limit, 502 DB irraggiungibile) deve
  // arrivare in faccia a chi ha compilato, non diventare un finto «salvato».
  if (res && res.status !== 503) {
    // Il server risponde con { error } in italiano (filtro, rate-limit): quel
    // testo è già la frase da mostrare, non va sepolto in un messaggio tecnico.
    let detto = "";
    try { detto = String((await res.clone().json())?.error ?? ""); } catch {}
    throw new Error(detto || `submitDonatore ${res.status}: ${await res.text()}`);
  }

  const stored = { ...clean, id: Date.now(), created_at: new Date().toISOString() };
  writeLocal([stored, ...readLocal()]);
  return stored;
}

/**
 * Ultimo filtro, in lettura: una riga che non passerebbe oggi il controllo non
 * si mostra, da qualunque parte sia entrata — dal libro vecchio, da una
 * scrittura diretta sul database, da un domani in cui la lista si allunga.
 */
export const firmaMostrabile = (r: DonatoreRow): boolean =>
  !motivoRifiuto(r.nome ?? "", r.messaggio);

/** Elenco firme dal più recente (newest-first). */
export async function fetchDonatori(limit = 200): Promise<DonatoreRow[]> {
  if (!donazioniConfigured) {
    return readLocal().filter(firmaMostrabile).slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "id,nome,tipo,importo,messaggio,link,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });
  const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
  if (!res.ok) throw new Error(`fetchDonatori ${res.status}: ${await res.text()}`);
  return ((await res.json()) as DonatoreRow[]).filter(firmaMostrabile);
}

// ─── Realtime: nuove firme in tempo reale ──────────────────────────────────
export function subscribeDonatori(onGrezzo: (row: DonatoreRow) => void): Unsubscribe {
  // Anche le firme che arrivano in tempo reale passano dal filtro.
  const onInsert = (row: DonatoreRow) => { if (firmaMostrabile(row)) onGrezzo(row); };

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
