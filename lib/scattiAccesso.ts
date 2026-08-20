// ─── Shooting · il permesso di vedere le foto ────────────────────────────────
//
// Il cuore condiviso dalle due funzioni serverless (api/scatti-richiesta.ts e
// api/scatti-accesso.ts) e dai loro gemelli in sviluppo (vite.config.ts). Qui
// dentro non c'è nessun handler HTTP: solo lo stato, i token, il magazzino e
// le due email.
//
// ── Il giro, in quattro passi ────────────────────────────────────────────────
//
//   ① qualcuno compila il modulo su /shooting — nome, email, che rapporto ha
//      con chi è ritratto, perché, e IL CODICE, che gli hai dato tu a voce.
//      Senza codice la richiesta non parte nemmeno: il modulo non è aperto al
//      mondo, è una porta con il campanello che sa suonare solo chi conosci.
//   ② arriva a te un'email con quello che ha scritto e da dove scrive, e due
//      bottoni: Autorizza, Rifiuta.
//   ③ tocchi Autorizza → al richiedente parte un link che vale 24 ORE.
//   ④ lui apre il link e vede QUELLA sessione, servita da indirizzi firmati
//      che scadono in un'ora.
//
// ── Le tre cose che tengono in piedi il resto ────────────────────────────────
//
//   · Il bucket è PRIVATO. Non esiste un indirizzo indovinabile: ogni immagine
//     si apre solo con una firma che il server rilascia a chi ha un token vivo.
//   · In tabella i token NON ci sono: c'è il loro SHA-256. Il valore vero vive
//     solo dentro le due email. Una tabella letta non autorizza nessuno.
//   · La decisione NON si prende con un GET. Gli scanner antivirus e i
//     "link protetti" delle caselle di posta pre-aprono i link in arrivo — è
//     scritto anche in cima ad api/d.ts, dove il problema era solo un contatore
//     sballato. Qui un GET pre-aperto autorizzerebbe una richiesta da solo.
//     Quindi il link della mail apre una PAGINA, e l'autorizzazione parte da un
//     bottone che fa POST. Nessuno scanner compila moduli.
//
// Serve: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
// SHOOTING_CODICE (il codice del modulo). Schema: supabase/shooting_richieste.sql
// ─────────────────────────────────────────────────────────────────────────────

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  bottone, bottoneModulo, esc, forte, guscio, nota, pagina as paginaStile, righe, testo,
} from "./emailStile.js";

export const BUCKET = "scatti";
export const DEST = "pzkko@yahoo.com";
export const FROM = "Alberto Pecchini <shooting@albertopecchini.it>";

/** Quanto vive un accesso autorizzato. */
export const ORE_ACCESSO = 24;
/** Quanto vive la firma di una singola immagine. */
export const SECONDI_FIRMA = 3600;
/** Oltre questo, il link della decisione nella TUA email non vale più. */
export const GIORNI_DECISIONE = 7;

export type Stato = "in_attesa" | "autorizzata" | "rifiutata" | "revocata";

export interface Richiesta {
  id: string;
  sessione: string;
  nome: string;
  email: string;
  rapporto: string | null;
  motivo: string | null;
  stato: Stato;
  admin_hash: string;
  admin_scade_il: string;
  accesso_hash: string | null;
  accesso_scade_il: string | null;
  creata_il: string;
  decisa_il: string | null;
  aperture: number;
  ultima_apertura: string | null;
}

/** Una foto come sta nel manifesto del bucket (percorsi, non indirizzi). */
export interface ScattoBucket {
  id: string;
  mini: string;
  medio: string;
  originale: string;
  w: number;
  h: number;
  wo: number;
  ho: number;
  blur: string;
  ora: string;
  iso?: number;
  focale?: number;
  apertura?: number;
  tempo?: string;
  peso: number;
  nome: string;
}

export interface ManifestoBucket {
  sessione: string;
  titolo: string;
  caricato: string;
  foto: ScattoBucket[];
}

// ── Utilità ──────────────────────────────────────────────────────────────────

// L'escape sta con lo stile delle email, che è chi lo usa di più; di qui esce
// ancora col suo nome perché lo importano le funzioni serverless.
export { esc };

/** Un token che non si indovina: 32 byte veri, scritti in base64url. */
export function nuovoToken(): string {
  return randomBytes(32).toString("base64url");
}

export function impronta(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Confronto a tempo costante: due stringhe di lunghezza diversa non passano. */
export function ugualiInSicurezza(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Il codice del modulo, quello che consegni a voce. */
export function codiceGiusto(dato: unknown): boolean {
  const atteso = (process.env.SHOOTING_CODICE || "").trim();
  // Senza codice configurato il modulo NON si apre a tutti: si chiude.
  if (!atteso) return false;
  if (typeof dato !== "string") return false;
  const dato2 = dato.trim().toLowerCase().replace(/\s+/g, "");
  const atteso2 = atteso.toLowerCase().replace(/\s+/g, "");
  // Lunghezze diverse → falso subito; è la stessa informazione che darebbe il
  // confronto, e timingSafeEqual pretende buffer della stessa misura.
  return dato2.length === atteso2.length && ugualiInSicurezza(dato2, atteso2);
}

export function dataItaliana(iso: string | Date): string {
  return new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome", dateStyle: "medium", timeStyle: "short",
  });
}

/** L'indirizzo pubblico del sito, ricavato dalla richiesta in arrivo. */
export function origine(req: any): string {
  const proto = (req.headers?.["x-forwarded-proto"] as string) || "https";
  const host = (req.headers?.["x-forwarded-host"] as string) || req.headers?.host || "albertopecchini.it";
  return `${proto}://${host}`;
}

// ── Supabase ─────────────────────────────────────────────────────────────────

export function supa(): { url: string; key: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // la tabella è privata: serve la service_role
  return url && key ? { url, key } : null;
}

const sHeaders = (key: string) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
});

const TABELLA = "shooting_richieste";

export async function inserisci(r: Partial<Richiesta>): Promise<Richiesta | null> {
  const s = supa();
  if (!s) return null;
  const res = await fetch(`${s.url}/rest/v1/${TABELLA}`, {
    method: "POST",
    headers: { ...sHeaders(s.key), Prefer: "return=representation" },
    body: JSON.stringify(r),
  });
  if (!res.ok) return null;
  const righe = (await res.json()) as Richiesta[];
  return righe[0] ?? null;
}

export async function perId(id: string): Promise<Richiesta | null> {
  const s = supa();
  if (!s) return null;
  const res = await fetch(
    `${s.url}/rest/v1/${TABELLA}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { headers: sHeaders(s.key) },
  );
  if (!res.ok) return null;
  const righe = (await res.json()) as Richiesta[];
  return righe[0] ?? null;
}

export async function perAccesso(hash: string): Promise<Richiesta | null> {
  const s = supa();
  if (!s) return null;
  const res = await fetch(
    `${s.url}/rest/v1/${TABELLA}?accesso_hash=eq.${encodeURIComponent(hash)}&select=*&limit=1`,
    { headers: sHeaders(s.key) },
  );
  if (!res.ok) return null;
  const righe = (await res.json()) as Richiesta[];
  return righe[0] ?? null;
}

export async function aggiorna(id: string, patch: Partial<Richiesta>): Promise<boolean> {
  const s = supa();
  if (!s) return false;
  const res = await fetch(`${s.url}/rest/v1/${TABELLA}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: sHeaders(s.key),
    body: JSON.stringify(patch),
  });
  return res.ok;
}

// ── Il magazzino delle foto ──────────────────────────────────────────────────

/** Il manifesto di una sessione, che sta nel bucket insieme alle sue immagini. */
export async function manifestoBucket(sessione: string): Promise<ManifestoBucket | null> {
  const s = supa();
  if (!s) return null;
  const res = await fetch(
    `${s.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(sessione)}/manifesto.json`,
    { headers: { apikey: s.key, Authorization: `Bearer ${s.key}` } },
  );
  if (!res.ok) return null;
  return (await res.json()) as ManifestoBucket;
}

/**
 * Quali sessioni stanno davvero nel secchio. Le cartelle di primo livello del
 * bucket sono gli id delle sessioni ("s1", "s2"): l'elenco dice per cosa ha
 * senso far compilare un modulo, e niente di più.
 */
export async function sessioniCaricate(): Promise<string[]> {
  const s = supa();
  if (!s) return [];
  const res = await fetch(`${s.url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: sHeaders(s.key),
    body: JSON.stringify({ prefix: "", limit: 100, sortBy: { column: "name", order: "asc" } }),
  });
  if (!res.ok) return [];
  const voci = (await res.json()) as { name: string; id: string | null }[];
  // Le cartelle arrivano con id nullo: sono quelle che ci interessano.
  return voci.filter((v) => v.id === null && /^s\d{1,2}$/.test(v.name)).map((v) => v.name);
}

/**
 * Gli indirizzi firmati, in blocco. Un URL firmato è l'unico modo di leggere un
 * oggetto di un bucket privato, e smette di funzionare da solo dopo `secondi`:
 * anche se qualcuno lo copiasse e lo passasse in giro, quello che passa è una
 * chiave che sta già scadendo.
 */
export async function firma(
  percorsi: string[],
  secondi = SECONDI_FIRMA,
): Promise<Map<string, string>> {
  const mappa = new Map<string, string>();
  const s = supa();
  if (!s || !percorsi.length) return mappa;

  const res = await fetch(`${s.url}/storage/v1/object/sign/${BUCKET}`, {
    method: "POST",
    headers: sHeaders(s.key),
    body: JSON.stringify({ expiresIn: secondi, paths: percorsi }),
  });
  if (!res.ok) return mappa;

  const righe = (await res.json()) as { path: string; signedURL?: string; error?: string }[];
  for (const r of righe) {
    if (r.signedURL) mappa.set(r.path, `${s.url}/storage/v1${r.signedURL}`);
  }
  return mappa;
}

// ── Email ────────────────────────────────────────────────────────────────────
// Il disegno non è più qui: guscio, righe, bottoni e paginette stanno in
// ./emailStile.ts, che è la faccia unica di TUTTE le email del sito — quella
// della home. Qui restano solo le parole.

/** L'email che arriva A TE: chi ha chiesto, cosa ha scritto, e i due bottoni. */
export function emailRichiesta(
  r: Richiesta,
  tokenAdmin: string,
  etichettaSessione: string,
  base: string,
  diagHtml: string,
): { subject: string; html: string } {
  const link = `${base}/api/scatti-accesso?id=${encodeURIComponent(r.id)}&t=${encodeURIComponent(tokenAdmin)}`;
  const html = guscio(
    "Qualcuno chiede di vedere le foto",
    `Shooting · ${etichettaSessione}`,
    `
    ${righe([
      ["Nome", r.nome],
      ["Email", r.email],
      ["Sessione", etichettaSessione],
      ["Rapporto", r.rapporto || "—"],
      ["Motivo", r.motivo || "—"],
      ["Richiesta", dataItaliana(r.creata_il)],
    ])}
    <div style="margin-top:18px">${testo(
      `Il bottone apre una pagina di conferma: la decisione si prende lì, con un secondo tocco.
       Serve perché gli scanner delle caselle di posta aprono i link da soli, e un link che
       autorizza da solo sarebbe autorizzato dal primo antivirus che passa.`,
    )}</div>
    <p style="margin:0 0 14px">${bottone(link, "Apri e decidi")}</p>
    ${nota(
      `Se autorizzi, a ${esc(r.nome)} arriva un link che vale ${ORE_ACCESSO} ore e che puoi
       revocare quando vuoi dalla stessa pagina. Questo link scade fra ${GIORNI_DECISIONE} giorni.
       Se non fai niente, non succede niente.`,
    )}
    ${diagHtml}`,
  );
  return { subject: `Shooting · ${r.nome} chiede di vedere ${etichettaSessione}`, html };
}

/** L'email che arriva A CHI HA CHIESTO, quando autorizzi. */
export function emailAutorizzato(
  r: Richiesta,
  tokenAccesso: string,
  etichettaSessione: string,
  base: string,
): { subject: string; html: string } {
  const link = `${base}/shooting?accesso=${encodeURIComponent(tokenAccesso)}`;
  const html = guscio(
    "Le foto sono tue per le prossime 24 ore",
    "Shooting · accesso autorizzato",
    `
    ${testo(
      `Ciao ${esc(r.nome)}, ho autorizzato la tua richiesta per ${forte(etichettaSessione)}.
       Il link qui sotto apre l'album e scade ${forte(dataItaliana(r.accesso_scade_il || new Date()))}.`,
    )}
    <p style="margin:0 0 16px">${bottone(link, "Apri l'album")}</p>
    ${testo(
      `Dentro trovi le foto a piena risoluzione, scaricabili una per una. Il link è personale:
       tienilo per te, perché chiunque ce l'abbia entra al posto tuo finché non scade.`,
    )}
    ${nota("Se hai bisogno di più tempo scrivimi e te ne mando un altro.")}`,
  );
  return { subject: `Le foto di ${etichettaSessione} — accesso per 24 ore`, html };
}

/** L'avviso che qualcuno ha aperto l'album per la prima volta. */
export function emailPrimaApertura(
  r: Richiesta,
  etichettaSessione: string,
  diagHtml: string,
): { subject: string; html: string } {
  const html = guscio(
    `${r.nome} ha aperto l'album`,
    `Shooting · ${etichettaSessione}`,
    `${righe([
      ["Nome", r.nome],
      ["Email", r.email],
      ["Sessione", etichettaSessione],
      ["Aperto", dataItaliana(new Date())],
      ["Scade", r.accesso_scade_il ? dataItaliana(r.accesso_scade_il) : "—"],
    ])}
    <div style="margin-top:16px">${nota(
      `Arriva una volta sola, alla prima apertura. Le aperture successive le conta la tabella
       e basta.`,
    )}</div>
    ${diagHtml}`,
  );
  return { subject: `Shooting · ${r.nome} ha aperto ${etichettaSessione}`, html };
}

export async function invia(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[scatti] RESEND_API_KEY mancante: email non inviata a", to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[scatti] invio fallito:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e: any) {
    console.error("[scatti] invio fallito:", e?.message);
    return false;
  }
}

// ── La paginetta delle decisioni ─────────────────────────────────────────────
// La apri tu dal telefono, quindi è una pagina vera e non un JSON: stessa
// lastra e stessa palette delle email (./emailStile.ts), chiara o scura come ce
// l'hai tu. Il modulo fa POST, e questo è il motivo per cui esiste (vedi la
// nota in cima al file).

export function paginaDecisione(r: Richiesta, tokenAdmin: string, etichetta: string): string {
  const stati: Record<Stato, string> = {
    in_attesa: "in attesa di una risposta",
    autorizzata: "già autorizzata",
    rifiutata: "già rifiutata",
    revocata: "revocata",
  };
  const attiva = r.stato === "autorizzata" && !!r.accesso_scade_il && new Date(r.accesso_scade_il) > new Date();

  const azioni = r.stato === "in_attesa"
    ? `${bottoneModulo("esito", "si", `Autorizza per ${ORE_ACCESSO} ore`)}
       ${bottoneModulo("esito", "no", "Rifiuta", false)}`
    : attiva
      ? bottoneModulo("esito", "revoca", "Revoca l'accesso adesso", false)
      : "";

  return pagina(
    "Richiesta di accesso",
    `
    <div style="margin:0 0 18px">${nota(
      `La richiesta è ${esc(stati[r.stato])}${
        attiva ? `, e scade ${esc(dataItaliana(r.accesso_scade_il!))}` : ""
      }.`,
    )}</div>
    ${righe([
      ["Nome", r.nome],
      ["Email", r.email],
      ["Sessione", etichetta],
      ["Rapporto", r.rapporto || "—"],
      ["Motivo", r.motivo || "—"],
      ["Richiesta", dataItaliana(r.creata_il)],
      ["Aperture", String(r.aperture)],
    ])}
    ${
      azioni
        ? `<form method="post" style="margin:22px 0 0">
             <input type="hidden" name="id" value="${esc(r.id)}">
             <input type="hidden" name="t" value="${esc(tokenAdmin)}">
             ${azioni}
           </form>`
        : ""
    }`,
  );
}

export function pagina(titolo: string, corpo: string): string {
  return paginaStile(titolo, corpo, "Shooting");
}
