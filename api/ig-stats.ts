// ─── Contatore confronti "Compare Two Lists" — endpoint hardenizzato ─────────
//
// L'incremento NON parte direttamente dal client verso Supabase: passa da qui,
// con controllo d'origine + rate-limit (come /api/trivia). La lettura è pubblica.
//
// NB: gli helper di sicurezza sono INLINE (non importati da ../lib) di proposito:
// su Vercel le funzioni girano come ESM e un import relativo senza estensione
// (../lib/serverSecurity) non si risolve a runtime (ERR_MODULE_NOT_FOUND). Così
// l'endpoint è autosufficiente e non dipende da quella risoluzione.
//
// Usa la SERVICE_ROLE se presente (vedi supabase/tool_stats_lock.sql), altrimenti
// l'anon key (già pubblica). Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
// VITE_SUPABASE_ANON_KEY.

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];
const STAT_ID = "instagram_compare";

// ── Helper di sicurezza (inline) ─────────────────────────────────────────────
function getHeader(req: any, name: string): string {
  const h = req?.headers?.[name.toLowerCase()];
  if (Array.isArray(h)) return h[0] ?? "";
  return h ?? "";
}
function getClientIp(req: any): string {
  const xff = getHeader(req, "x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return getHeader(req, "x-real-ip") || getHeader(req, "x-vercel-forwarded-for") || "";
}
function sameOriginOk(req: any, hosts: string[]): boolean {
  const src = getHeader(req, "origin") || getHeader(req, "referer");
  if (!src) return false;
  try {
    const host = new URL(src).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    return hosts.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}
const HITS = new Map<string, number[]>();
function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (HITS.get(key) ?? []).filter((t) => t > cutoff);
  hits.push(now);
  HITS.set(key, hits);
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (v.every((t) => t <= cutoff)) HITS.delete(k);
  }
  if (hits.length > max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ── Supabase ─────────────────────────────────────────────────────────────────
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
