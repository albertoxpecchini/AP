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
import { esc, guscio, nota, pagina, righe } from "../lib/emailStile.js";

export const config = { runtime: "nodejs" };

const DEST = "pzkko@yahoo.com";
const FROM = "Link tracker <link@albertopecchini.it>";

function supa(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // serve la service_role: la tabella è privata
  return url && key ? { url, key } : null;
}
const sHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

/** Paginetta minimale in stile sito per gli errori (scaduto / non valido). */
function errorPage(res: any, status: number, titolo: string, testo: string) {
  const html = pagina(titolo, `<p style="margin:0">${esc(testo)}</p>`, "Link");
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

/** L'email della prima apertura: oggetto e corpo, senza spedire niente (così si
 *  può anche guardare, con `node scripts/anteprima-email.mjs`). */
export function emailApertura(label: string, target: string, diagHtml = ""): { subject: string; html: string } {
  const html = guscio(
    "Link aperto",
    `Link · ${label || "senza etichetta"}`,
    `${righe([["Bersaglio", target]])}
    <div style="margin-top:16px">${nota("È la prima apertura registrata di questo link.")}</div>
    ${diagHtml}`,
  );
  return { subject: `Link aperto · ${label || "documento"}`, html };
}

async function sendOpenEmail(label: string, target: string, diagHtml: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const { subject, html } = emailApertura(label, target, diagHtml);
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: DEST, subject, html }),
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
