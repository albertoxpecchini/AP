import { Anthropic } from "@anthropic-ai/sdk";
import { getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";

const client = new Anthropic();

export const config = {
  runtime: "nodejs",
};

// Host consentiti: l'endpoint chiama Claude a pagamento, quindi accettiamo solo
// richieste che partono dal sito (blocca l'uso come proxy AI gratuito altrui).
const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];

// Solo lettere (con accenti) e spazi: una "parola" del gioco, non un prompt.
const WORD_RE = /^[\p{L} ]{3,40}$/u;

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOriginOk(req, ALLOWED_HOSTS)) {
    return res.status(403).json({ error: "Origine non consentita" });
  }

  // Anti-abuso di costo: max 20 richieste/minuto per IP (best-effort).
  const gate = rateLimit(`trivia:${getClientIp(req) || "ignoto"}`, 20, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste, riprova tra poco" });
  }

  const { word } = req.query;

  // Vincolo forte sull'input: niente prompt injection da 100 KB, tetto a 40 char.
  if (!word || typeof word !== "string" || !WORD_RE.test(word)) {
    return res.status(400).json({ error: "Invalid word parameter" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-fable-5",
      // Fable 5 pensa SEMPRE (adaptive), e max_tokens è il tetto su pensiero +
      // risposta: 150 non basterebbe. Diamo margine e teniamo l'effort "low",
      // perché una curiosità di 1-2 frasi non richiede ragionamento profondo.
      max_tokens: 2048,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `Genera una breve curiosità o fatto interessante sulla parola italiana "${word.toUpperCase()}" in 1-2 frasi. Sii creativo, informativo e interessante. Scrivi direttamente il fatto senza premesse.`,
        },
      ],
    });

    // Su Fable 5 il primo blocco è di pensiero (testo vuoto): prendo il primo
    // blocco di testo vero, non content[0].
    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache per 24h
    return res.status(200).json({ word, trivia: text.trim() });
  } catch (error) {
    console.error("Error generating trivia:", error);
    return res.status(500).json({ error: "Failed to generate trivia" });
  }
}
