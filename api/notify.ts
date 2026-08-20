// ─── Festa · notifica email dei voti (Resend) ───────────────────────────────
//
// Funzione serverless Vercel + helper d'invio email, tutto in un solo file.
// IMPORTANTE: niente import relativi di file con prefisso "_" dentro /api —
// Vercel li esclude dal bundle e la funzione crasha (FUNCTION_INVOCATION_FAILED).
// Per questo "sendVoteEmail" vive qui ed è esportato per il middleware dev.
//
// Richiede la env RESEND_API_KEY (lato server, NON esposta al client).

import { collectDiagnostics, getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";
import { guscio, righe } from "../lib/emailStile.js";

export const config = {
  runtime: "nodejs",
};

// Host da cui accettiamo l'invio (blocca script esterni e curl "nudo"). I
// sottodomini (festa., www., …) sono coperti da sameOriginOk; vercel.app tiene
// funzionanti i deploy di anteprima.
const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];

export interface VotePayload {
  nome: string;
  presenza: "pomeriggio" | "sera" | "no";
  giorno: "27" | "28";
  cibo?: string | null;
}

export interface SendResult { ok: boolean; status: number; detail?: string }

// Dominio verificato su Resend → invio dal proprio dominio (più affidabile).
const DEST = "pzkko@yahoo.com";
const FROM = "Alberto Pecchini <festa@albertopecchini.it>";

const GIORNO_LABEL: Record<VotePayload["giorno"], string> = {
  "27": "Sabato 27 giugno",
  "28": "Domenica 28 giugno",
};

// Etichette "umane" della presenza. NB: il codice DB "sera" è riusato come
// «a cena» (niente migrazione dello schema) → qui lo rendo leggibile.
const PRESENZA_LABEL: Record<VotePayload["presenza"], string> = {
  pomeriggio: "🏊 Ci sono al pomeriggio",
  sera: "🍕 Resto a cena",
  no: "🙁 Non riesce a venire",
};

/** L'email del voto: oggetto e corpo, senza spedire niente (così si può anche
 *  guardare, con `node scripts/anteprima-email.mjs`).
 *
 *  La veste è quella di tutte le altre — la home — e non più il verde della
 *  pagina della festa: le email arrivano tutte nella stessa casella, e una
 *  casella con quattro palette diverse non è quattro sezioni, è disordine. */
export function emailVoto(p: VotePayload, diagHtml = ""): { subject: string; html: string } {
  const presenza = PRESENZA_LABEL[p.presenza] ?? p.presenza;
  const giorno = GIORNO_LABEL[p.giorno] ?? p.giorno;

  const html = guscio(
    "Nuovo voto per la festa",
    `Festa · ${giorno}`,
    `${righe([
      ["Giorno", giorno],
      ["Nome", p.nome],
      ["Presenza", presenza],
      ["Cibo d'asporto", p.cibo || "—"],
    ])}
    ${diagHtml}`,
  );

  return { subject: `Festa ${p.giorno}/06: ${p.nome} ha votato (${p.presenza})`, html };
}

/** Invia l'email del voto. Non lancia: ritorna esito così il chiamante decide.
 *  `diagHtml` (facoltativo) è il blocco diagnostico su chi ha compilato. */
export async function sendVoteEmail(p: VotePayload, diagHtml = ""): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, status: 500, detail: "RESEND_API_KEY mancante" };

  const { subject, html } = emailVoto(p, diagHtml);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: DEST, subject, html }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, detail: await res.text() };
    }
    return { ok: true, status: 200 };
  } catch (err: any) {
    return { ok: false, status: 500, detail: err?.message ?? "fetch error" };
  }
}

const VALID = new Set(["pomeriggio", "sera", "no"]);
const VALID_GIORNO = new Set(["27", "28"]);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Solo richieste che arrivano da una pagina del sito.
  if (!sameOriginOk(req, ALLOWED_HOSTS)) {
    return res.status(403).json({ error: "Origine non consentita" });
  }

  // Anti-spam: max 5 invii/minuto per IP (best-effort, senza database).
  const gate = rateLimit(`notify:${getClientIp(req) || "ignoto"}`, 5, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppi invii, riprova tra poco" });
  }

  // Su Vercel il body JSON è già parsato; in dev arriva una stringa.
  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const presenza = body?.presenza;
  // Compat: vecchi payload senza "giorno" → 27 (sabato).
  const giorno = VALID_GIORNO.has(body?.giorno) ? body.giorno : "27";
  // Cap di lunghezza sugli input liberi (difesa da payload gonfiati).
  const cibo = typeof body?.cibo === "string" ? body.cibo.slice(0, 200) : null;

  if (!nome || !VALID.has(presenza)) {
    return res.status(400).json({ error: "Payload non valido" });
  }

  const payload: VotePayload = { nome: nome.slice(0, 40), presenza, giorno, cibo };
  const { html: diagHtml } = collectDiagnostics(req);
  const result = await sendVoteEmail(payload, diagHtml);

  if (!result.ok) {
    console.error("[notify] invio fallito:", result.status, result.detail);
    return res.status(result.status).json({ error: result.detail ?? "invio fallito" });
  }
  return res.status(200).json({ ok: true });
}
