// ─── Shooting · la decisione, e l'album di chi è stato autorizzato ───────────
//
// Tre cose in una funzione sola (le funzioni serverless su Vercel si contano, e
// queste tre condividono tutto: la tabella, i token, il magazzino).
//
//   GET  /api/scatti-accesso?id=…&t=…        la pagina della decisione (la apri tu)
//   POST /api/scatti-accesso                 autorizza · rifiuta · revoca
//   GET  /api/scatti-accesso?album=<token>   il manifesto firmato, per chi è autorizzato
//
// ── Perché decidere è un POST ────────────────────────────────────────────────
// Il link nell'email non decide niente: apre una pagina. Gli scanner antivirus
// e i "link protetti" delle caselle di posta PRE-APRONO i link in arrivo — sta
// scritto anche in cima ad api/d.ts, dove il danno era solo un contatore
// sballato. Qui un GET che autorizza verrebbe cliccato dal primo antivirus di
// passaggio, e la foto sarebbe autorizzata da una macchina. Un modulo, invece,
// nessuno scanner lo compila.
//
// ── Cosa vede chi è autorizzato ──────────────────────────────────────────────
// Solo la SUA sessione, e solo con indirizzi firmati che scadono in un'ora. Il
// bucket è privato: senza firma non c'è URL che risponda, quindi non c'è niente
// da indovinare né da conservare.
//
// Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

import { collectDiagnostics, getClientIp, rateLimit } from "../lib/serverSecurity.js";
import {
  aggiorna, dataItaliana, emailAutorizzato, emailPrimaApertura, esc, firma, impronta,
  invia, manifestoBucket, nuovoToken, origine, pagina, paginaDecisione, perAccesso, perId,
  sessioniCaricate, ugualiInSicurezza, DEST, ORE_ACCESSO, type Richiesta,
} from "../lib/scattiAccesso.js";

export const config = { runtime: "nodejs" };

function html(res: any, stato: number, corpo: string) {
  res.status(stato);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Una pagina con un token dentro non deve restare in nessuna cache.
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.send(corpo);
}

/** La riga giusta, col token giusto, non scaduta. Altrimenti niente. */
async function richiestaAdmin(id: unknown, t: unknown): Promise<Richiesta | null> {
  if (typeof id !== "string" || typeof t !== "string" || !id || !t) return null;
  const r = await perId(id);
  if (!r) return null;
  if (!ugualiInSicurezza(impronta(t), r.admin_hash)) return null;
  if (new Date(r.admin_scade_il) < new Date()) return null;
  return r;
}

export default async function handler(req: any, res: any) {
  const q = req.query ?? {};

  // ── Per quali sessioni ha senso chiedere ───────────────────────────────────
  // Non è un'informazione riservata — dice solo quali sessioni SAREBBERO
  // mostrabili a chi venisse autorizzato — e serve a non far compilare un
  // modulo che finirebbe comunque in un rifiuto tecnico.
  if (req.method === "GET" && q.disponibili) {
    const nomi = await sessioniCaricate();
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({ sessioni: nomi });
  }

  // ── L'album di chi è autorizzato ───────────────────────────────────────────
  if (req.method === "GET" && typeof q.album === "string") {
    return album(req, res, q.album);
  }

  // ── La decisione ───────────────────────────────────────────────────────────
  if (req.method === "POST") {
    let body: any = req.body;
    if (typeof body === "string") {
      // Il modulo della pagina è un form vero: arriva urlencoded.
      body = Object.fromEntries(new URLSearchParams(body));
    }
    const r = await richiestaAdmin(body?.id, body?.t);
    if (!r) {
      return html(res, 404, pagina("Link non valido", "<p style=\"margin:0;color:#525252\">Questo link non vale più: o è scaduto, o non è quello giusto.</p>"));
    }
    return decidi(req, res, r, String(body?.esito ?? ""), String(body?.t ?? ""));
  }

  // ── La pagina della decisione ──────────────────────────────────────────────
  if (req.method === "GET" && typeof q.id === "string") {
    const gate = rateLimit(`scatti-admin:${getClientIp(req) || "ignoto"}`, 30, 60_000);
    if (!gate.ok) return html(res, 429, pagina("Troppi tentativi", "<p style=\"margin:0;color:#525252\">Riprova fra un minuto.</p>"));

    const r = await richiestaAdmin(q.id, q.t);
    if (!r) {
      return html(res, 404, pagina("Link non valido", "<p style=\"margin:0;color:#525252\">Questo link non vale più: o è scaduto, o non è quello giusto.</p>"));
    }
    const man = await manifestoBucket(r.sessione);
    return html(res, 200, paginaDecisione(r, String(q.t), man?.titolo ?? r.sessione));
  }

  return res.status(404).json({ error: "Non trovato" });
}

// ── Autorizza · rifiuta · revoca ─────────────────────────────────────────────

async function decidi(req: any, res: any, r: Richiesta, esito: string, tokenAdmin: string) {
  const man = await manifestoBucket(r.sessione);
  const etichetta = man?.titolo ?? r.sessione;

  if (esito === "si") {
    if (r.stato !== "in_attesa") {
      return html(res, 409, paginaDecisione(r, tokenAdmin, etichetta));
    }
    const tokenAccesso = nuovoToken();
    const scade = new Date(Date.now() + ORE_ACCESSO * 3600_000).toISOString();

    const ok = await aggiorna(r.id, {
      stato: "autorizzata",
      decisa_il: new Date().toISOString(),
      accesso_hash: impronta(tokenAccesso),
      accesso_scade_il: scade,
    });
    if (!ok) return html(res, 503, pagina("Non ha funzionato", "<p style=\"margin:0;color:#525252\">La decisione non è stata registrata. Riprova.</p>"));

    const mail = emailAutorizzato({ ...r, accesso_scade_il: scade }, tokenAccesso, etichetta, origine(req));
    const inviata = await invia(r.email, mail.subject, mail.html);

    return html(
      res,
      200,
      pagina(
        "Autorizzata",
        `<p style="margin:0 0 10px;color:#525252">${esc(r.nome)} può vedere <strong style="color:#171717">${esc(etichetta)}</strong> fino a <strong style="color:#171717">${esc(dataItaliana(scade))}</strong>.</p>
         <p style="margin:0;color:${inviata ? "#8f8f8f" : "#525252"}">${
           inviata
             ? `Il link è appena partito verso ${esc(r.email)}.`
             : "⚠ L'email però non è partita: l'accesso è attivo ma il link non è arrivato a nessuno. Controlla RESEND_API_KEY."
         }</p>`,
      ),
    );
  }

  if (esito === "no") {
    await aggiorna(r.id, { stato: "rifiutata", decisa_il: new Date().toISOString() });
    return html(
      res,
      200,
      pagina(
        "Rifiutata",
        `<p style="margin:0;color:#525252">Non è partita nessuna email: ${esc(r.nome)} non riceve niente. La riga si cancella da sola entro trenta giorni.</p>`,
      ),
    );
  }

  if (esito === "revoca") {
    await aggiorna(r.id, { stato: "revocata", accesso_hash: null, accesso_scade_il: null });
    return html(
      res,
      200,
      pagina(
        "Revocato",
        `<p style="margin:0;color:#525252">Il link di ${esc(r.nome)} è spento da adesso. Se ha una scheda aperta, alla prossima immagine non riceve più niente.</p>`,
      ),
    );
  }

  return html(res, 400, pagina("Non ho capito", "<p style=\"margin:0;color:#525252\">Azione sconosciuta.</p>"));
}

// ── Il manifesto firmato ─────────────────────────────────────────────────────

async function album(req: any, res: any, token: string) {
  res.setHeader("Cache-Control", "no-store");

  const gate = rateLimit(`scatti-album:${getClientIp(req) || "ignoto"}`, 60, 60_000);
  if (!gate.ok) {
    res.setHeader("Retry-After", String(gate.retryAfterSec));
    return res.status(429).json({ error: "Troppe richieste" });
  }

  const r = await perAccesso(impronta(token));
  // Stessa risposta per "token inesistente" e "token revocato": chi prova a
  // indovinare non impara niente dalla differenza.
  if (!r || r.stato !== "autorizzata" || !r.accesso_scade_il) {
    return res.status(403).json({ errore: "chiuso", error: "Questo accesso non è valido." });
  }
  if (new Date(r.accesso_scade_il) < new Date()) {
    return res.status(403).json({ errore: "scaduto", error: "Questo accesso è scaduto." });
  }

  const man = await manifestoBucket(r.sessione);
  if (!man) return res.status(404).json({ error: "Album non disponibile." });

  // Un indirizzo per ogni misura di ogni foto, tutti firmati in un colpo solo.
  const percorsi = man.foto.flatMap((f) => [f.mini, f.medio, f.originale]);
  const firmati = await firma(percorsi);

  const foto = man.foto
    .map((f) => ({
      id: f.id,
      mini: firmati.get(f.mini),
      medio: firmati.get(f.medio),
      originale: firmati.get(f.originale),
      w: f.w, h: f.h, wo: f.wo, ho: f.ho,
      blur: f.blur,
      ora: f.ora,
      iso: f.iso, focale: f.focale, apertura: f.apertura, tempo: f.tempo,
      peso: f.peso, nome: f.nome,
    }))
    // Una foto senza firma non si vedrebbe comunque: meglio non mandarla.
    .filter((f) => f.mini && f.medio && f.originale);

  // Prima apertura: te lo dico, una volta sola.
  if (r.aperture === 0) {
    const { html: diagHtml } = collectDiagnostics(req);
    const mail = emailPrimaApertura(r, man.titolo, diagHtml);
    void invia(DEST, mail.subject, mail.html);
  }
  void aggiorna(r.id, { aperture: r.aperture + 1, ultima_apertura: new Date().toISOString() });

  return res.status(200).json({
    ok: true,
    titolo: man.titolo,
    sessione: r.sessione,
    nome: r.nome,
    scade: r.accesso_scade_il,
    // Quanto vale una firma: la pagina se ne serve per ricaricare il manifesto
    // prima che gli indirizzi le muoiano in mano.
    firmaSecondi: 3600,
    foto,
  });
}
