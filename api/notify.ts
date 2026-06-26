import { sendVoteEmail, type VotePayload } from "./_festaEmail";

export const config = {
  runtime: "nodejs",
};

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
