// ─── MiMa · lista alcolici — endpoint blindato per le scritture ──────────────
//
// Stessa forma di api/festa-rsvp.ts: la LETTURA della lista resta diretta e
// pubblica (serve al realtime), le scritture passano da qui con controllo
// d'origine + rate-limit e usano la SERVICE_ROLE. Così la anon key pubblica
// non basta a riempire — o a svuotare — la lista di qualcun altro.
//
// POST   { chi, voce, qta?, note? }   aggiunge una voce
// PATCH  { id, preso }                spunta / despunta
// DELETE { id }                       toglie una voce

import { getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];
const TABLE = "mima_alcolici";

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

const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** Aggiunge una voce validata. Esportata anche per il middleware di sviluppo. */
export async function addVoce(input: any): Promise<Result> {
  const chi = clean(input?.chi, 40);
  const voce = clean(input?.voce, 80);
  const qta = clean(input?.qta, 30) || null;
  const note = clean(input?.note, 200) || null;
  if (!chi || !voce) return { ok: false, status: 400, error: "Servono almeno il nome e la voce" };

  const s = supa();
  if (!s) return { ok: false, status: 503, error: "Backend non configurato" };
  try {
    const r = await fetch(`${s.url}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...headers(s.key), Prefer: "return=representation" },
      body: JSON.stringify({ chi, voce, qta, note }),
    });
    if (!r.ok) return { ok: false, status: 502, error: `DB ${r.status}` };
    const data = (await r.json()) as any[];
    return { ok: true, row: data[0] };
  } catch {
    return { ok: false, status: 502, error: "DB irraggiungibile" };
  }
}

/** Spunta o despunta una voce. */
export async function setPreso(input: any): Promise<Result> {
  const id = Number(input?.id);
  if (!Number.isFinite(id) || id <= 0) return { ok: false, status: 400, error: "id non valido" };
  const preso = Boolean(input?.preso);

  const s = supa();
  if (!s) return { ok: false, status: 503, error: "Backend non configurato" };
  try {
    const r = await fetch(`${s.url}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers(s.key), Prefer: "return=representation" },
      body: JSON.stringify({ preso }),
    });
    if (!r.ok) return { ok: false, status: 502, error: `DB ${r.status}` };
    const data = (await r.json()) as any[];
    return { ok: true, row: data[0] ?? { id, preso } };
  } catch {
    return { ok: false, status: 502, error: "DB irraggiungibile" };
  }
}

/** Toglie una voce. */
export async function removeVoce(input: any): Promise<Result> {
  const id = Number(input?.id);
  if (!Number.isFinite(id) || id <= 0) return { ok: false, status: 400, error: "id non valido" };

  const s = supa();
  if (!s) return { ok: false, status: 503, error: "Backend non configurato" };
  try {
    const r = await fetch(`${s.url}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: "DELETE",
      headers: headers(s.key),
    });
    if (!r.ok) return { ok: false, status: 502, error: `DB ${r.status}` };
    return { ok: true, row: { id } };
  } catch {
    return { ok: false, status: 502, error: "DB irraggiungibile" };
  }
}

export default async function handler(req: any, res: any) {
  const method = String(req.method || "").toUpperCase();
  if (!["POST", "PATCH", "DELETE"].includes(method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!sameOriginOk(req, ALLOWED_HOSTS)) {
    return res.status(403).json({ error: "Origine non consentita" });
  }
  // Più generoso della festa: qui si scrive una voce alla volta e capita di
  // buttarne dentro sei di fila mentre si fa la lista.
  const gate = rateLimit(`mima-alcolici:${getClientIp(req) || "ignoto"}`, 40, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste, riprova tra poco" });
  }

  const body = req.body ?? {};
  const out =
    method === "POST" ? await addVoce(body)
    : method === "PATCH" ? await setPreso(body)
    : await removeVoce(body);

  if (!out.ok) return res.status(out.status).json({ error: out.error });
  return res.status(200).json(out.row);
}
