// ─── Sicurezza e diagnostica lato server (condivise dalle funzioni /api) ─────
//
// Questo file vive FUORI da /api apposta: Vercel considera ogni file dentro
// /api un endpoint pubblico, quindi gli helper condivisi vanno tenuti altrove e
// importati (../lib/serverSecurity). Non finisce nel bundle del client: lo
// importano solo le funzioni serverless e il middleware dev di Vite.
//
// Contiene:
//   · getClientIp / getHeader   — lettura robusta degli header di richiesta
//   · rateLimit                 — freno anti-abuso in memoria (best-effort)
//   · sameOriginOk              — accetta solo richieste che arrivano dal sito
//   · collectDiagnostics        — riepilogo tecnico di CHI invia (per l'email)
//
// Il riquadro HTML della diagnostica è montato coi pezzi di ./emailStile.ts,
// che è lo stile unico delle email: qui dentro non ci sono più colori propri.
//
// NB sui dati diagnostici: IP, località e device sono DATI PERSONALI (per l'IP
// vale la sentenza UE Breyer). Qui vengono solo allegati all'email che l'utente
// invia deliberatamente (una sua azione volontaria sul form), a fini anti-abuso.
// Non vengono salvati da nessuna parte: nessun archivio, niente da esfiltrare.
// La località da IP è approssimativa (spesso la centrale dell'operatore).

import { nota, righe, riquadro } from "./emailStile.js";

type Req = { headers?: Record<string, string | string[] | undefined>; method?: string };

/** Legge un header (case-insensitive) restituendo sempre una stringa singola. */
export function getHeader(req: Req, name: string): string {
  const h = req.headers?.[name.toLowerCase()];
  if (Array.isArray(h)) return h[0] ?? "";
  return h ?? "";
}

/** IP pubblico del chiamante. Su Vercel il primo hop di x-forwarded-for è il client. */
export function getClientIp(req: Req): string {
  const xff = getHeader(req, "x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return getHeader(req, "x-real-ip") || getHeader(req, "x-vercel-forwarded-for") || "";
}

// ─── Rate limit in memoria ───────────────────────────────────────────────────
// Nota onesta sui limiti: le funzioni serverless sono effimere e possono girare
// su istanze diverse, quindi questo freno è "best-effort" (vale finché l'istanza
// resta calda). Ferma comunque il caso concreto — un singolo client che martella
// l'endpoint in loop — senza bisogno di un database o di Redis.
const HITS = new Map<string, number[]>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (HITS.get(key) ?? []).filter((t) => t > cutoff);
  hits.push(now);
  HITS.set(key, hits);
  // Pulizia opportunistica per non far crescere la mappa all'infinito.
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (v.every((t) => t <= cutoff)) HITS.delete(k);
  }
  if (hits.length > max) {
    const retryAfterSec = Math.ceil((hits[0]! + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// ─── Controllo d'origine ─────────────────────────────────────────────────────
// Accetta la richiesta solo se arriva da una pagina del sito (Origin/Referer su
// uno degli host consentiti). Blocca a costo zero l'abuso da script esterni e da
// curl "nudo". In sviluppo (nessun host di produzione) lascia passare localhost.
export function sameOriginOk(req: Req, allowedHosts: string[]): boolean {
  const origin = getHeader(req, "origin");
  const referer = getHeader(req, "referer");
  const src = origin || referer;
  if (!src) return false;
  try {
    const host = new URL(src).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    return allowedHosts.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

// ─── Parsing user-agent + client hints (senza dipendenze) ────────────────────
// Il "modello del telefono" è leggibile solo in parte: gli UA Android lo
// contengono (es. "SM-A536B"); iOS espone solo "iPhone" (limite di Safari). I
// client hints ad alta entropia (sec-ch-ua-model) arrivano solo da Chromium e
// solo se il sito ha inviato Accept-CH (vedi header in vercel.json).
function parseUserAgent(ua: string, hints: { model: string; platform: string; mobile: string }) {
  const has = (re: RegExp) => re.test(ua);

  let os = "sconosciuto";
  let osVer = "";
  let model = hints.model || "";
  if (has(/Windows NT 10/)) { os = "Windows"; osVer = "10/11"; }
  else if (has(/Windows NT/)) { os = "Windows"; }
  else if (has(/Android/)) {
    os = "Android";
    osVer = (ua.match(/Android ([\d.]+)/) || [])[1] || "";
    // Modello nell'UA Android: "Android 13; SM-A536B Build/..." → "SM-A536B".
    if (!model) model = (ua.match(/Android[\d.; ]+;\s*([^;)]+?)(?:\s+Build|\))/) || [])[1]?.trim() || "";
  }
  else if (has(/iPhone/)) { os = "iOS"; osVer = (ua.match(/OS ([\d_]+)/) || [])[1]?.replace(/_/g, ".") || ""; if (!model) model = "iPhone"; }
  else if (has(/iPad/)) { os = "iPadOS"; if (!model) model = "iPad"; }
  else if (has(/Mac OS X/)) { os = "macOS"; osVer = (ua.match(/Mac OS X ([\d_]+)/) || [])[1]?.replace(/_/g, ".") || ""; }
  else if (has(/Linux/)) { os = "Linux"; }
  if (hints.platform && os === "sconosciuto") os = hints.platform.replace(/"/g, "");

  let browser = "sconosciuto";
  let bVer = "";
  const m = (re: RegExp) => (ua.match(re) || [])[1] || "";
  if (has(/Edg\//)) { browser = "Edge"; bVer = m(/Edg\/([\d.]+)/); }
  else if (has(/OPR\/|Opera/)) { browser = "Opera"; bVer = m(/(?:OPR|Opera)\/([\d.]+)/); }
  else if (has(/SamsungBrowser/)) { browser = "Samsung Internet"; bVer = m(/SamsungBrowser\/([\d.]+)/); }
  else if (has(/Firefox\//)) { browser = "Firefox"; bVer = m(/Firefox\/([\d.]+)/); }
  else if (has(/Chrome\//)) { browser = "Chrome"; bVer = m(/Chrome\/([\d.]+)/); }
  else if (has(/Safari\//) && has(/Version\//)) { browser = "Safari"; bVer = m(/Version\/([\d.]+)/); }

  const isMobile = hints.mobile === "?1" || has(/Mobi|Android|iPhone|iPad/);
  const isTablet = has(/iPad|Tablet/);
  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

  return {
    os: osVer ? `${os} ${osVer}` : os,
    browser: bVer ? `${browser} ${bVer.split(".")[0]}` : browser,
    device,
    model,
  };
}

/** Riepilogo tecnico del chiamante: righe testo + blocco HTML per l'email. */
export function collectDiagnostics(req: Req): { rows: [string, string][]; html: string } {
  const ip = getClientIp(req) || "n/d";
  const ua = getHeader(req, "user-agent") || "n/d";
  const lang = getHeader(req, "accept-language").split(",")[0] || "n/d";
  const referer = getHeader(req, "referer") || "diretto / app";

  const parsed = parseUserAgent(ua, {
    model: getHeader(req, "sec-ch-ua-model").replace(/"/g, ""),
    platform: getHeader(req, "sec-ch-ua-platform"),
    mobile: getHeader(req, "sec-ch-ua-mobile"),
  });

  const city = decodeURIComponent(getHeader(req, "x-vercel-ip-city") || "");
  const region = getHeader(req, "x-vercel-ip-country-region");
  const country = getHeader(req, "x-vercel-ip-country");
  const tz = getHeader(req, "x-vercel-ip-timezone");
  const geo = [city, region, country].filter(Boolean).join(", ") || "n/d";

  const when = new Date().toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const rows: [string, string][] = [
    ["Orario (Italia)", when],
    ["IP pubblico", ip],
    ["Località (da IP, approssimativa)", geo],
    ["Fuso orario", tz || "n/d"],
    ["Dispositivo", parsed.model ? `${parsed.device} · ${parsed.model}` : parsed.device],
    ["Sistema", parsed.os],
    ["Browser", parsed.browser],
    ["Lingua", lang],
    ["Provenienza", referer],
  ];

  const html = riquadro(
    "Chi ha compilato",
    `${righe(rows)}
      <div style="margin-top:10px">${nota(
        "Dati approssimativi da IP e browser, allegati solo a questa email e non archiviati.",
      )}</div>`,
  );

  return { rows, html };
}
