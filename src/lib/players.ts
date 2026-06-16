// ─── Account giocatori "col nome" (condiviso fra Trivia / Angoli / Parole) ───
//
// Login leggero senza password: scegliendo un nome viene creato/aggiornato un
// record su Supabase (tabella `players`, SQL in supabase/players.sql). Da
// qualsiasi dispositivo basta riselezionare il nome dalla lista per loggarsi.
//
// Usa le STESSE env pubbliche dei giochi:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
//
// Se non configurate, lavora in "solo locale": il nome resta su questo browser
// e la lista mostra i nomi già usati qui. Il gioco resta sempre funzionante.

export interface Player {
  nick: string;
  last_seen?: string;
}

const URL  = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, "");
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const TABLE = "players";

export const playersConfigured = Boolean(URL && ANON);

// Nome dell'account loggato: condiviso fra TUTTI i giochi (una sola chiave).
const ACCOUNT_KEY = "kit-account-nick";
// Lista nomi vista in modalità solo-locale.
const LOCAL_LIST_KEY = "kit-players-local";

const restHeaders = () => ({
  "apikey": ANON!,
  "Authorization": `Bearer ${ANON!}`,
  "Content-Type": "application/json",
});

/** Forma normalizzata usata come chiave di unicità (minuscolo, trim). */
function nickKey(nick: string): string {
  return nick.trim().toLowerCase();
}

// ─── Account locale (vale per tutti i giochi) ────────────────────────────────

export function getAccountNick(): string {
  try { return (localStorage.getItem(ACCOUNT_KEY) || "").slice(0, 10); } catch { return ""; }
}
export function setAccountNick(nick: string) {
  try { localStorage.setItem(ACCOUNT_KEY, nick.slice(0, 10)); } catch {}
}
export function clearAccountNick() {
  try { localStorage.removeItem(ACCOUNT_KEY); } catch {}
}

function readLocalList(): Player[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_LIST_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function writeLocalList(rows: Player[]) {
  try { localStorage.setItem(LOCAL_LIST_KEY, JSON.stringify(rows.slice(0, 200))); } catch {}
}

// ─── Backend ─────────────────────────────────────────────────────────────────

/**
 * Crea l'account col nome scelto (se non esiste) o ne aggiorna `last_seen`.
 * È il "login/registrazione": idempotente sul nome (unico case-insensitive).
 * Salva anche il nome come account corrente su questo dispositivo.
 */
export async function upsertPlayer(nick: string): Promise<void> {
  const clean = nick.trim().slice(0, 10);
  if (!clean) return;
  setAccountNick(clean);

  if (!playersConfigured) {
    const key = nickKey(clean);
    const list = readLocalList().filter(p => nickKey(p.nick) !== key);
    writeLocalList([{ nick: clean, last_seen: new Date().toISOString() }, ...list]);
    return;
  }

  // Upsert via PostgREST: on_conflict sulla chiave unica `nick_key`, merge.
  try {
    await fetch(`${URL}/rest/v1/${TABLE}?on_conflict=nick_key`, {
      method: "POST",
      headers: { ...restHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        nick: clean,
        nick_key: nickKey(clean),
        last_seen: new Date().toISOString(),
      }),
    });
  } catch {
    // Rete assente: l'account locale è comunque impostato, il gioco continua.
  }
}

/** Tutti i nomi registrati, dal più recente. Per la lista "scegli il tuo nome". */
export async function fetchPlayers(limit = 200): Promise<Player[]> {
  if (!playersConfigured) {
    return readLocalList().slice(0, limit);
  }

  const params = new URLSearchParams({
    select: "nick,last_seen",
    order: "last_seen.desc",
    limit: String(limit),
  });

  try {
    const res = await fetch(`${URL}/rest/v1/${TABLE}?${params}`, { headers: restHeaders() });
    if (!res.ok) return [];
    return (await res.json()) as Player[];
  } catch {
    return [];
  }
}
