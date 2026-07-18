// ─── Contatore confronti "Compare Two Lists" — endpoint hardenizzato ─────────
//
// L'incremento NON parte più direttamente dal client verso Supabase: passa da
// qui, dove applichiamo controllo d'origine (sameOriginOk) e rate-limit, come
// /api/trivia e /api/notify. Così il contatore si alza solo da una pagina del
// sito. La lettura è pubblica (il totale è per definizione visibile a tutti).
//
// Usa la SERVICE_ROLE se presente (così si può revocare l'accesso anon alla RPC
// e blindare del tutto — vedi supabase/tool_stats_lock.sql); altrimenti ripiega
// sull'anon key (già pubblica). Env lette a runtime: VITE_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY | VITE_SUPABASE_ANON_KEY.

import { getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity";

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];
const STAT_ID = "instagram_compare";

function supa(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

const headers = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
});

/** Totale attuale dei confronti (o null se non disponibile). */
export async function readCount(): Promise<number | null> {
  const s = supa();
  if (!s) return null;
  try {
    const r = await fetch(`${s.url}/rest/v1/tool_stats?id=eq.${STAT_ID}&select=count`, { headers: headers(s.key) });
    if (!r.ok) return null;
    const rows = (await r.json()) as { count: number }[];
    return rows[0]?.count ?? 0;
  } catch {
    return null;
  }
}

/** Incremento atomico via RPC; ritorna il nuovo totale (o null). */
export async function incrementCount(): Promise<number | null> {
  const s = supa();
  if (!s) return null;
  try {
    const r = await fetch(`${s.url}/rest/v1/rpc/bump_tool_stat`, {
      method: "POST",
      headers: headers(s.key),
      body: JSON.stringify({ p_id: STAT_ID }),
    });
    if (!r.ok) return null;
    const v = await r.json();
    return typeof v === "number" ? v : (v?.count ?? null);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const count = await readCount();
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ count });
  }

  if (req.method === "POST") {
    // Blindatura: solo dal sito + freno anti-abuso per IP.
    if (!sameOriginOk(req, ALLOWED_HOSTS)) {
      return res.status(403).json({ error: "Origine non consentita" });
    }
    const gate = rateLimit(`igstats:${getClientIp(req) || "ignoto"}`, 30, 60_000);
    if (!gate.ok) {
      res.setHeader("Retry-After", String(gate.retryAfterSec));
      return res.status(429).json({ error: "Troppe richieste, riprova tra poco" });
    }
    const count = await incrementCount();
    return res.status(200).json({ count });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
