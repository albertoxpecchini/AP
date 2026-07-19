// ─── Sostieni · scrittura firma libro donatori/sponsor — endpoint blindato ───
//
// La firma NON parte più direttamente dal client verso Supabase: passa da qui,
// con controllo d'origine + rate-limit, e l'INSERT avviene con la SERVICE_ROLE
// (se presente). Così, dopo aver revocato l'insert all'anon (supabase/
// donatori_lock.sql), nessuno può inserire firme fasulle con la anon key
// pubblica. Le LETTURE del libro restano dirette e pubbliche.
//
// Import con estensione .js: su Vercel le funzioni sono ESM.

import { getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];
const TABLE = "donatori";

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

const trimOrNull = (s: unknown, max: number): string | null => {
  const v = (s == null ? "" : String(s)).trim().slice(0, max);
  return v || null;
};
function sanitize(row: any) {
  return {
    nome: String(row?.nome ?? "").trim().slice(0, 40),
    tipo: row?.tipo === "sponsor" ? "sponsor" : "donatore",
    importo: trimOrNull(row?.importo, 20),
    messaggio: trimOrNull(row?.messaggio, 280),
    link: trimOrNull(row?.link, 200),
  };
}

type Result = { ok: true; row: any } | { ok: false; status: number; error: string };

/** Inserisce una firma sanificata. Esportata anche per il middleware dev. */
export async function insertDonatore(input: any): Promise<Result> {
  const clean = sanitize(input);
  if (!clean.nome) return { ok: false, status: 400, error: "Nome mancante" };
  const s = supa();
  if (!s) return { ok: false, status: 503, error: "Backend non configurato" };
  try {
    const r = await fetch(`${s.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(s.key), Prefer: "return=representation" },
      body: JSON.stringify(clean),
    });
    if (!r.ok) return { ok: false, status: 502, error: `DB ${r.status}` };
    const data = (await r.json()) as any[];
    return { ok: true, row: data[0] };
  } catch {
    return { ok: false, status: 502, error: "DB irraggiungibile" };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!sameOriginOk(req, ALLOWED_HOSTS)) return res.status(403).json({ error: "Origine non consentita" });
  const gate = rateLimit(`sponsor:${getClientIp(req) || "ignoto"}`, 10, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste, riprova tra poco" });
  }
  const out = await insertDonatore(req.body ?? {});
  if (!out.ok) return res.status(out.status).json({ error: out.error });
  return res.status(200).json(out.row);
}
