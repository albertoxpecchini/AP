import { Anthropic } from "@anthropic-ai/sdk";

const client = new Anthropic();

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { word } = req.query;

  if (!word || typeof word !== "string" || word.length < 3) {
    return res.status(400).json({ error: "Invalid word parameter" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Genera una breve curiosità o fatto interessante sulla parola italiana "${word.toUpperCase()}" in 1-2 frasi. Sii creativo, informativo e interessante. Scrivi direttamente il fatto senza premesse.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache per 24h
    return res.status(200).json({ word, trivia: text.trim() });
  } catch (error) {
    console.error("Error generating trivia:", error);
    return res.status(500).json({ error: "Failed to generate trivia" });
  }
}
