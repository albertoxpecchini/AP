// ─── Festa · scrittura presenza (RSVP) — endpoint blindato ───────────────────
//
// L'RSVP non parte più direttamente dal client verso Supabase: passa da qui,
// con controllo d'origine + rate-limit, e l'INSERT usa la SERVICE_ROLE (se
// presente). Dopo il revoke all'anon (supabase/festa_presenze_lock.sql) nessuno
// può iniettare presenze fasulle con la anon key pubblica. La LETTURA della
// lista resta diretta e pubblica.

import { getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];
const TABLE = "festa_presenze";
const PRESENZE = new Set(["pomeriggio", "sera", "no"]);

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

type Result = { ok: true; row: any } | { ok: false; status: number; error: string };

/** Inserisce una presenza validata. Esportata anche per il middleware dev. */
export async function insertPresenza(input: any): Promise<Result> {
  const nome = String(input?.nome ?? "").trim().slice(0, 40);
  const presenza = String(input?.presenza ?? "");
  const giorno = input?.giorno === "27" || input?.giorno === "28" ? input.giorno : "27";
  const cibo = (String(input?.cibo ?? "").trim().slice(0, 200)) || null;
  if (!nome || !PRESENZE.has(presenza)) return { ok: false, status: 400, error: "Payload non valido" };

  const s = supa();
  if (!s) return { ok: false, status: 503, error: "Backend non configurato" };
  try {
    const r = await fetch(`${s.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(s.key), Prefer: "return=representation" },
      body: JSON.stringify({ nome, presenza, giorno, cibo }),
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
  const gate = rateLimit(`festa:${getClientIp(req) || "ignoto"}`, 10, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste, riprova tra poco" });
  }
  const out = await insertPresenza(req.body ?? {});
  if (!out.ok) return res.status(out.status).json({ error: out.error });
  return res.status(200).json(out.row);
}
