// ─── Link tracciabili · apertura + redirect + autodelete ─────────────────────
//
// GET /d/<id>  (riscritto a /api/d?id=<id> in vercel.json)
//
// Flusso:
//   · id mancante / sconosciuto           → 404 (pagina "link non valido")
//   · link scaduto (expires_at < adesso)  → lo CANCELLA (+ eventuale file in
//                                            Storage) e risponde 410 Gone
//   · altrimenti                          → +1 al contatore, e alla PRIMA
//                                            apertura invia l'email di notifica,
//                                            poi 302 verso target_url
//
// PRIVACY: in DB si tocca solo il contatore. I dettagli del "chi" (IP, device,
// località approssimativa) sono raccolti da collectDiagnostics e finiscono SOLO
// nell'email — non vengono archiviati (stessa linea di /api/notify).
//
// Nota onesta: molti client/antivirus PRE-APRONO i link in arrivo (SafeLinks,
// scanner). La "prima apertura" può quindi essere un bot, non il destinatario.
// È un limite intrinseco del tracking via link: la notifica è un indizio, non
// una prova. Per ridurre il rumore l'email parte solo alla prima apertura.

import { collectDiagnostics, getClientIp, rateLimit } from "../lib/serverSecurity.js";

export const config = { runtime: "nodejs" };

const DEST = "pzkko@yahoo.com";
const FROM = "Link tracker <link@albertopecchini.it>";

function supa(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // serve la service_role: la tabella è privata
  return url && key ? { url, key } : null;
}
const sHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Paginetta minimale in stile sito per gli errori (scaduto / non valido). */
function errorPage(res: any, status: number, titolo: string, testo: string) {
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titolo)}</title></head>
<body style="margin:0;background:#faf8f6;font-family:'Ubuntu',Calibri,Cambria,'Times New Roman',serif">
<div style="max-width:520px;margin:12vh auto;background:#fff;border:1px solid rgba(233,84,32,.15);border-radius:10px;overflow:hidden">
<div style="height:4px;background:#e95420"></div>
<div style="padding:28px 32px">
<h1 style="margin:0 0 10px;font-size:22px;color:#1C1A17">${esc(titolo)}</h1>
<p style="margin:0;font-size:16px;line-height:1.6;color:#6b675f">${esc(testo)}</p>
</div></div></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).send(html);
}

/** Cancella la riga e, se indicato, l'oggetto in Supabase Storage. Best-effort. */
async function purge(s: { url: string; key: string }, id: string, storagePath?: string | null) {
  try {
    await fetch(`${s.url}/rest/v1/tracked_links?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: sHeaders(s.key),
    });
  } catch { /* best-effort */ }
  if (storagePath) {
    try {
      await fetch(`${s.url}/storage/v1/object/${storagePath.replace(/^\/+/, "")}`, {
        method: "DELETE",
        headers: { apikey: s.key, Authorization: `Bearer ${s.key}` },
      });
    } catch { /* best-effort */ }
  }
}

async function sendOpenEmail(label: string, target: string, diagHtml: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const html = `
    <div style="font-family:'Ubuntu',Calibri,Cambria,'Times New Roman',serif;max-width:520px;margin:0 auto;color:#1c1a17">
      <div style="background:#e95420;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:20px">📬 Link aperto</h2>
        <p style="margin:6px 0 0;font-size:14px;opacity:.92">${esc(label || "(senza etichetta)")}</p>
      </div>
      <div style="border:1px solid #e2e0da;border-top:none;border-radius:0 0 12px 12px;padding:20px 22px">
        <p style="margin:0 0 12px"><strong>Bersaglio:</strong> ${esc(target)}</p>
        <p style="margin:0;font-size:13px;color:#6b675f">È la prima apertura registrata di questo link.</p>
      </div>
      ${diagHtml}
    </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: DEST, subject: `📬 Link aperto: ${label || "documento"}`, html }),
    });
  } catch { /* best-effort: l'apertura non deve fallire per colpa dell'email */ }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Freno anti-abuso: non deve diventare un amplificatore di email/redirect.
  const gate = rateLimit(`d:${getClientIp(req) || "ignoto"}`, 60, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).send("Troppe richieste");
  }

  const id = String(req.query?.id ?? "").trim();
  if (!id || !/^[A-Za-z0-9_-]{6,64}$/.test(id)) {
    return errorPage(res, 404, "Link non valido", "Questo link non esiste o è stato digitato male.");
  }

  const s = supa();
  if (!s) return errorPage(res, 503, "Servizio non disponibile", "Riprova più tardi.");

  // 1) Leggi la riga
  let row: any;
  try {
    const r = await fetch(
      `${s.url}/rest/v1/tracked_links?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: sHeaders(s.key) },
    );
    if (!r.ok) return errorPage(res, 502, "Errore temporaneo", "Riprova tra poco.");
    row = (await r.json())?.[0];
  } catch {
    return errorPage(res, 502, "Errore temporaneo", "Riprova tra poco.");
  }

  if (!row) return errorPage(res, 404, "Link non valido", "Questo link non esiste (o è già stato rimosso).");

  // 2) Scaduto → cancella e 410
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await purge(s, id, row.storage_path);
    return errorPage(res, 410, "Link scaduto", "Questo link non è più attivo: è passato oltre una settimana.");
  }

  // 3) Registra l'apertura (solo contatore) e notifica alla prima
  const firstOpen = (row.open_count ?? 0) === 0;
  try {
    await fetch(`${s.url}/rest/v1/tracked_links?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: sHeaders(s.key),
      body: JSON.stringify({ open_count: (row.open_count ?? 0) + 1, last_opened_at: new Date().toISOString() }),
    });
  } catch { /* best-effort: non blocca il redirect */ }

  if (firstOpen) {
    const { html: diagHtml } = collectDiagnostics(req);
    await sendOpenEmail(row.label ?? "", row.target_url, diagHtml);
  }

  // 4) Redirect al bersaglio (302, senza cache)
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = 302;
  res.setHeader("Location", row.target_url);
  return res.end();
}
