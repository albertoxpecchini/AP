// ─── Genera un link tracciabile "usa e getta" (locale, niente endpoint pubblico) ──
//
// Crea una riga in public.tracked_links (Supabase) e stampa il link corto
//   https://albertopecchini.it/d/<id>
// da incollare nell'email. Scade da solo dopo N giorni (default 7).
//
// Due modi:
//   1) URL già online     → il link reindirizza lì
//   2) FILE sul tuo PC     → lo carica in Supabase Storage (bucket privato
//      (pdf, ecc.)           "documenti"), crea un link FIRMATO valido quanto il
//                            link stesso, e a scadenza cancella ANCHE il file.
//
// Perché in locale e non via API: creare i link non ha un endpoint pubblico
// apposta — meno superficie d'attacco. Serve la SERVICE_ROLE, che sta solo qui.
//
// USO (Node 20+, legge il .env da solo con --env-file):
//   node --env-file=.env scripts/make-link.mjs "https://esempio.it/file.pdf" "Preventivo Rossi"
//   node --env-file=.env scripts/make-link.mjs "./documenti/preventivo.pdf" "Preventivo Rossi"
//   node --env-file=.env scripts/make-link.mjs "<url-o-file>" "<etichetta>" --days 14
//
// ENV richieste (nel .env): VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname } from "node:path";

const BUCKET = "documenti"; // bucket privato per gli allegati usa-e-getta

const MIME = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", txt: "text/plain",
  zip: "application/zip", csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));

const input = positional[0];
let label = positional[1] ?? "";
const days = Math.min(Math.max(parseInt(flag("days", "7"), 10) || 7, 1), 30);

if (!input) {
  console.error("✗ Serve un URL http/https OPPURE il percorso di un file locale.\n" +
    '  Es: node --env-file=.env scripts/make-link.mjs "./preventivo.pdf" "Preventivo Rossi"');
  process.exit(1);
}

const SUPA_URL = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !KEY) {
  console.error("✗ Mancano VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY nel .env.");
  process.exit(1);
}
const sHead = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const isUrl = /^https?:\/\//i.test(input);
let targetUrl;
let storagePath = null;

if (isUrl) {
  targetUrl = input;
} else {
  // ── Ramo FILE LOCALE ──────────────────────────────────────────────────────
  if (!existsSync(input) || !statSync(input).isFile()) {
    console.error(`✗ File non trovato: ${input}`);
    process.exit(1);
  }
  const raw = basename(input);
  const safeName = raw.normalize("NFKD").replace(/[^\w.\-]+/g, "_"); // niente spazi/accenti nella chiave
  const ext = extname(raw).slice(1).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const objectPath = `${randomBytes(6).toString("base64url")}/${safeName}`; // cartella casuale = non indovinabile
  storagePath = `${BUCKET}/${objectPath}`;
  if (!label) label = raw;

  // 1) Assicura il bucket privato (idempotente: se esiste, ignora l'errore)
  await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...sHead, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  }).catch(() => {});

  // 2) Carica il file
  const up = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { ...sHead, "Content-Type": mime, "x-upsert": "true" },
    body: readFileSync(input),
  });
  if (!up.ok) {
    console.error(`✗ Upload fallito (${up.status}): ${await up.text()}`);
    process.exit(1);
  }

  // 3) Link FIRMATO valido quanto il link tracciabile (bucket resta privato)
  const sign = await fetch(`${SUPA_URL}/storage/v1/object/sign/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: { ...sHead, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: days * 86400 }),
  });
  if (!sign.ok) {
    console.error(`✗ Firma URL fallita (${sign.status}): ${await sign.text()}`);
    process.exit(1);
  }
  const { signedURL } = await sign.json();
  targetUrl = `${SUPA_URL}/storage/v1${signedURL}`;
}

// ── Crea la riga tracciabile ─────────────────────────────────────────────────
const id = randomBytes(8).toString("base64url"); // ~11 caratteri URL-safe
const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();

const r = await fetch(`${SUPA_URL}/rest/v1/tracked_links`, {
  method: "POST",
  headers: { ...sHead, "Content-Type": "application/json", Prefer: "return=representation" },
  body: JSON.stringify({ id, target_url: targetUrl, label: label || null, storage_path: storagePath, expires_at: expiresAt }),
});

if (!r.ok) {
  console.error(`✗ Inserimento fallito (${r.status}): ${await r.text()}`);
  console.error("  Hai eseguito supabase/tracked_links.sql? La SERVICE_ROLE è giusta?");
  process.exit(1);
}

const link = `https://albertopecchini.it/d/${id}`;
console.log("\n✓ Link creato\n");
console.log("  " + link);
console.log(`\n  → ${storagePath ? "file caricato" : "punta a"}: ${storagePath ? storagePath : targetUrl}`);
console.log(`  → scade il: ${new Date(expiresAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })} (${days}g)`);
if (label) console.log(`  → etichetta: ${label}`);
console.log("");
