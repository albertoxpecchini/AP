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
import { testoHaParolacce, testoHaLink, linkPulito } from "../lib/parolacce.js";

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
    // Il link è di chi compra lo sponsor, e va in un href della pagina: qui
    // dentro passa solo un http/https vero (linkPulito butta via il resto).
    link: linkPulito(trimOrNull(row?.link, 200)),
  };
}

// ─── Il filtro ───────────────────────────────────────────────────────────────
// Il libro è pubblico e la firma non passa da nessuna approvazione: appare
// subito, in una pagina che è la mia. Il primo che è passato di qui ha lasciato
// un insulto, quindi il controllo si fa qui — lato server, dove non lo si
// aggira con curl — e non solo nel form.
//
// Niente stelline al posto delle lettere: la firma viene rifiutata e chi
// scrive lo legge. Un asterisco al posto di una parola resta un insulto in
// mostra, e lascia il "gioco" aperto a chi ci prova.
const MOTIVO_PAROLACCE = "Il testo contiene parole non consentite: riscrivilo, per favore.";
const MOTIVO_LINK = "Niente indirizzi web nel nome o nel messaggio.";

function motivoRifiuto(clean: { nome: string; messaggio: string | null }): string | null {
  if (testoHaParolacce(clean.nome) || testoHaParolacce(clean.messaggio ?? "")) return MOTIVO_PAROLACCE;
  if (testoHaLink(clean.nome) || testoHaLink(clean.messaggio ?? "")) return MOTIVO_LINK;
  return null;
}

type Result = { ok: true; row: any } | { ok: false; status: number; error: string };

/** Inserisce una firma sanificata. Esportata anche per il middleware dev. */
export async function insertDonatore(input: any): Promise<Result> {
  const clean = sanitize(input);
  if (!clean.nome) return { ok: false, status: 400, error: "Nome mancante" };
  const motivo = motivoRifiuto(clean);
  if (motivo) return { ok: false, status: 400, error: motivo };
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
