// ─── Shooting · «vorrei vedere le foto» ──────────────────────────────────────
//
// POST /api/scatti-richiesta
//
// Riceve il modulo di /shooting, lo scrive nella tabella privata e ti manda
// l'email con i due bottoni. Non decide niente: la decisione è tua, e si prende
// in api/scatti-accesso.ts.
//
// Tre porte prima di arrivare al database, nell'ordine in cui costano meno:
//   ① l'origine — solo le pagine del sito, non un curl nudo;
//   ② il ritmo — poche richieste al minuto per IP;
//   ③ il CODICE, che consegni a voce. Senza quello il modulo non è aperto al
//      mondo: è una porta con un campanello che sa suonare solo chi conosci.
//      Se SHOOTING_CODICE non è configurato il modulo si CHIUDE, non si apre.
//
// Il "chi è" tecnico (IP, dispositivo, zona) finisce solo nell'email, come in
// /api/notify e /api/d: nel database non ci va.
//
// Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SHOOTING_CODICE

import { collectDiagnostics, getClientIp, rateLimit, sameOriginOk } from "../lib/serverSecurity.js";
import {
  codiceGiusto, emailRichiesta, impronta, inserisci, invia, manifestoBucket,
  nuovoToken, origine, DEST, GIORNI_DECISIONE, type Richiesta,
} from "../lib/scattiAccesso.js";
import { randomBytes } from "node:crypto";

export const config = { runtime: "nodejs" };

const ALLOWED_HOSTS = ["albertopecchini.it", "vercel.app"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const SESSIONE_RE = /^s\d{1,2}$/;

const testo = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!sameOriginOk(req, ALLOWED_HOSTS)) {
    return res.status(403).json({ error: "Origine non consentita" });
  }

  const ip = getClientIp(req) || "ignoto";
  const gate = rateLimit(`scatti-richiesta:${ip}`, 4, 10 * 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste, riprova fra poco" });
  }

  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  // ① Il codice, prima di tutto il resto: se non torna, non si guarda nemmeno
  //    cosa ha scritto. Un tentativo sbagliato costa caro in fretta, così
  //    provarli a macchina non porta da nessuna parte.
  if (!codiceGiusto(body?.codice)) {
    const brute = rateLimit(`scatti-codice:${ip}`, 5, 30 * 60_000);
    if (!brute.ok) {
      res.setHeader("Retry-After", String(brute.retryAfterSec));
      return res.status(429).json({ error: "Troppi tentativi. Riprova più tardi." });
    }
    return res.status(403).json({ errore: "codice", error: "Il codice non è quello giusto." });
  }

  // ② I dati.
  const nome = testo(body?.nome, 60);
  const email = testo(body?.email, 120);
  const rapporto = testo(body?.rapporto, 200);
  const motivo = testo(body?.motivo, 600);
  const sessione = testo(body?.sessione, 4);

  if (nome.length < 2 || !EMAIL_RE.test(email) || !SESSIONE_RE.test(sessione) || rapporto.length < 2) {
    return res.status(400).json({ error: "Manca qualcosa, o non è nel formato giusto." });
  }
  if (body?.consenso !== true) {
    return res.status(400).json({ error: "Serve la spunta sul trattamento dei dati." });
  }

  // ③ La sessione dev'essere davvero disponibile: se non è mai stata caricata
  //    nel bucket, autorizzarla non mostrerebbe niente a nessuno.
  const man = await manifestoBucket(sessione);
  if (!man) {
    return res.status(409).json({ error: "Questa sessione non è disponibile per la richiesta." });
  }

  const id = randomBytes(9).toString("base64url");
  const tokenAdmin = nuovoToken();

  const riga = await inserisci({
    id,
    sessione,
    nome,
    email,
    rapporto,
    motivo: motivo || null,
    stato: "in_attesa",
    admin_hash: impronta(tokenAdmin),
    admin_scade_il: new Date(Date.now() + GIORNI_DECISIONE * 86400_000).toISOString(),
  });

  if (!riga) return res.status(503).json({ error: "Non riesco a registrare la richiesta." });

  const { html: diagHtml } = collectDiagnostics(req);
  const mail = emailRichiesta(riga as Richiesta, tokenAdmin, man.titolo, origine(req), diagHtml);
  const inviata = await invia(DEST, mail.subject, mail.html);

  if (!inviata) {
    // La richiesta è salva: il link della decisione si ricava dalla riga, e
    // senza email resta comunque raggiungibile. Meglio dirlo che fingere.
    console.error("[scatti] richiesta", id, "salvata ma email non partita");
  }

  return res.status(200).json({ ok: true });
}
