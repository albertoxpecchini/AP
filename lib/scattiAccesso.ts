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

export const BUCKET = "scatti";
export const DEST = "pzkko@yahoo.com";
export const FROM = "Shooting <shooting@albertopecchini.it>";

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

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

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
// Stessa grammatica del sito, non quella della festa: grigi neutri, un solo
// azzurro, niente arrotondamenti grossi. I colori sono i token .sb- tradotti in
// esadecimale, perché l'hsl() e le custom property nelle email non si possono
// usare (Outlook le butta via).

const C = {
  fg: "#171717",
  fgLight: "#525252",
  fgMuted: "#8f8f8f",
  bordo: "#e8e8e8",
  fondo: "#fcfcfc",
  superficie: "#f6f6f6",
  brand: "#00b3fa",
  brandTesto: "#0a6285",
};

function guscio(titolo: string, occhiello: string, corpo: string): string {
  return `
<div style="background:${C.fondo};padding:24px 12px;font-family:'Titillium Web',Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;border:1px solid ${C.bordo};background:#fff">
    <div style="border-bottom:1px solid ${C.bordo};padding:18px 22px">
      <p style="margin:0 0 4px;font-family:'Roboto Mono',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.fgMuted}">${esc(occhiello)}</p>
      <h1 style="margin:0;font-size:20px;font-weight:500;color:${C.fg}">${esc(titolo)}</h1>
    </div>
    <div style="padding:20px 22px">${corpo}</div>
  </div>
</div>`;
}

function righe(dati: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">${dati
    .map(
      ([k, v]) =>
        `<tr><td style="padding:5px 12px 5px 0;color:${C.fgMuted};white-space:nowrap;vertical-align:top">${esc(k)}</td>` +
        `<td style="padding:5px 0;color:${C.fg}">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function bottone(href: string, testo: string, primario: boolean): string {
  const sfondo = primario ? C.brand : C.superficie;
  const testoCol = primario ? "#101010" : C.fgLight;
  const bordo = primario ? C.brandTesto : C.bordo;
  return `<a href="${esc(href)}" style="display:inline-block;padding:10px 18px;margin:0 8px 8px 0;font-size:14px;text-decoration:none;color:${testoCol};background:${sfondo};border:1px solid ${bordo}">${esc(testo)}</a>`;
}

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
    <p style="margin:18px 0 10px;font-size:14px;line-height:1.6;color:${C.fgLight}">
      Il bottone apre una pagina di conferma: la decisione si prende lì, con un secondo tocco.
      Serve perché gli scanner delle caselle di posta aprono i link da soli, e un link che
      autorizza da solo sarebbe autorizzato dal primo antivirus che passa.
    </p>
    <p style="margin:0 0 14px">
      ${bottone(link, "Apri e decidi", true)}
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:${C.fgMuted}">
      Se autorizzi, a ${esc(r.nome)} arriva un link che vale ${ORE_ACCESSO} ore e che puoi
      revocare quando vuoi dalla stessa pagina. Questo link scade fra ${GIORNI_DECISIONE} giorni.
      Se non fai niente, non succede niente.
    </p>
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
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${C.fgLight}">
      Ciao ${esc(r.nome)}, ho autorizzato la tua richiesta per <strong style="color:${C.fg};font-weight:600">${esc(etichettaSessione)}</strong>.
      Il link qui sotto apre l'album e scade <strong style="color:${C.fg};font-weight:600">${esc(dataItaliana(r.accesso_scade_il || new Date()))}</strong>.
    </p>
    <p style="margin:0 0 16px">${bottone(link, "Apri l'album", true)}</p>
    <p style="margin:0 0 10px;font-size:13px;line-height:1.65;color:${C.fgLight}">
      Dentro trovi le foto a piena risoluzione, scaricabili una per una. Il link è personale:
      tienilo per te, perché chiunque ce l'abbia entra al posto tuo finché non scade.
    </p>
    <p style="margin:0;font-size:12px;line-height:1.6;color:${C.fgMuted}">
      Se hai bisogno di più tempo scrivimi e te ne mando un altro.
    </p>`,
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
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${C.fgMuted}">
      Arriva una volta sola, alla prima apertura. Le aperture successive le conta la tabella
      e basta.
    </p>
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
// palette del sito, tema chiaro, nessuna dipendenza. Il modulo fa POST, e
// questo è il motivo per cui esiste (vedi la nota in cima al file).

export function paginaDecisione(r: Richiesta, tokenAdmin: string, etichetta: string): string {
  const stati: Record<Stato, string> = {
    in_attesa: "in attesa di una risposta",
    autorizzata: "già autorizzata",
    rifiutata: "già rifiutata",
    revocata: "revocata",
  };
  const attiva = r.stato === "autorizzata" && !!r.accesso_scade_il && new Date(r.accesso_scade_il) > new Date();

  const azioni = r.stato === "in_attesa"
    ? `<button name="esito" value="si" style="padding:10px 20px;font:inherit;color:#101010;background:${C.brand};border:1px solid ${C.brandTesto};cursor:pointer">Autorizza per ${ORE_ACCESSO} ore</button>
       <button name="esito" value="no" style="padding:10px 20px;font:inherit;color:${C.fgLight};background:${C.superficie};border:1px solid ${C.bordo};cursor:pointer">Rifiuta</button>`
    : attiva
      ? `<button name="esito" value="revoca" style="padding:10px 20px;font:inherit;color:${C.fgLight};background:${C.superficie};border:1px solid ${C.bordo};cursor:pointer">Revoca l'accesso adesso</button>`
      : "";

  return pagina(
    "Richiesta di accesso",
    `
    <p style="margin:0 0 18px;font-size:14px;color:${C.fgMuted}">La richiesta è ${esc(stati[r.stato])}${
      attiva ? `, e scade ${esc(dataItaliana(r.accesso_scade_il!))}` : ""
    }.</p>
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
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(titolo)} · Shooting</title></head>
<body style="margin:0;background:${C.fondo};font-family:'Titillium Web',Segoe UI,Arial,sans-serif;color:${C.fg}">
<div style="max-width:560px;margin:10vh auto;padding:0 16px">
  <div style="border:1px solid ${C.bordo};background:#fff;padding:24px">
    <p style="margin:0 0 6px;font-family:'Roboto Mono',Consolas,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${C.fgMuted}">Shooting</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:500">${esc(titolo)}</h1>
    ${corpo}
  </div>
</div></body></html>`;
}
