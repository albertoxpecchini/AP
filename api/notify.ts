// ─── Festa · notifica email dei voti (Resend) ───────────────────────────────
//
// Funzione serverless Vercel + helper d'invio email, tutto in un solo file.
// IMPORTANTE: niente import relativi di file con prefisso "_" dentro /api —
// Vercel li esclude dal bundle e la funzione crasha (FUNCTION_INVOCATION_FAILED).
// Per questo "sendVoteEmail" vive qui ed è esportato per il middleware dev.
//
// Richiede la env RESEND_API_KEY (lato server, NON esposta al client).

export const config = {
  runtime: "nodejs",
};

export interface VotePayload {
  nome: string;
  presenza: "pomeriggio" | "sera" | "no";
  giorno: "27" | "28";
  cibo?: string | null;
}

export interface SendResult { ok: boolean; status: number; detail?: string }

// Dominio verificato su Resend → invio dal proprio dominio (più affidabile).
const DEST = "pzkko@yahoo.com";
const FROM = "Festa Alberto <festa@albertopecchini.it>";

const GIORNO_LABEL: Record<VotePayload["giorno"], string> = {
  "27": "Sabato 27 giugno",
  "28": "Domenica 28 giugno",
};

const PRESENZA_LABEL: Record<VotePayload["presenza"], string> = {
  pomeriggio: "🏊 Ci sono al bagno (pomeriggio)",
  sera: "🌙 Resto anche alla sera",
  no: "🙁 Non riesce a venire",
};

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

/** Invia l'email del voto. Non lancia: ritorna esito così il chiamante decide. */
export async function sendVoteEmail(p: VotePayload): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, status: 500, detail: "RESEND_API_KEY mancante" };

  const nome = esc(p.nome);
  const presenza = PRESENZA_LABEL[p.presenza] ?? esc(p.presenza);
  const giorno = GIORNO_LABEL[p.giorno] ?? esc(p.giorno);
  const cibo = p.cibo ? esc(p.cibo) : "—";

  const html = `
    <div style="font-family:'Titillium Web',Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1a17">
      <div style="background:#2F7D4A;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">🎉 Nuovo voto per la festa</h2>
        <p style="margin:6px 0 0;font-size:14px;opacity:.92">${giorno}</p>
      </div>
      <div style="border:1px solid #e2e0da;border-top:none;border-radius:0 0 12px 12px;padding:20px 22px">
        <p style="margin:0 0 12px"><strong>Giorno:</strong> ${giorno}</p>
        <p style="margin:0 0 12px"><strong>Nome:</strong> ${nome}</p>
        <p style="margin:0 0 12px"><strong>Presenza:</strong> ${presenza}</p>
        <p style="margin:0"><strong>Cibo d'asporto:</strong> ${cibo}</p>
      </div>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: DEST,
        subject: `Festa ${p.giorno}/06: ${p.nome} ha votato (${p.presenza})`,
        html,
      }),
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

  // Su Vercel il body JSON è già parsato; in dev arriva una stringa.
  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
  const presenza = body?.presenza;
  // Compat: vecchi payload senza "giorno" → 27 (sabato).
  const giorno = VALID_GIORNO.has(body?.giorno) ? body.giorno : "27";
  const cibo = typeof body?.cibo === "string" ? body.cibo : null;

  if (!nome || !VALID.has(presenza)) {
    return res.status(400).json({ error: "Payload non valido" });
  }

  const payload: VotePayload = { nome: nome.slice(0, 40), presenza, giorno, cibo };
  const result = await sendVoteEmail(payload);

  if (!result.ok) {
    console.error("[notify] invio fallito:", result.status, result.detail);
    return res.status(result.status).json({ error: result.detail ?? "invio fallito" });
  }
  return res.status(200).json({ ok: true });
}
