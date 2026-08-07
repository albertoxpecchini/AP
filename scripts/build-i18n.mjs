// ─────────────────────────────────────────────────────────────────────────────
// Spacchetta il dizionario generato in QUATTRO pacchetti, uno per lingua.
//
// Perché. `src/app/i18n/translations.json` sono 230 kB di JSON con dentro tutte
// e quattro le lingue, ed era importato in cima a dictionary.ts — cioè finiva
// nel bundle iniziale di ogni pagina, per intero. Un visitatore italiano
// scaricava anche il francese, il tedesco e l'inglese; e chi non cambia mai
// lingua (quasi tutti) scaricava tre quarti di roba per niente.
//
// Cosa esce di qui: `src/app/i18n/generated/<lingua>.json`, mappe piatte
// chiave → testo tradotto, con dentro solo le voci che quella lingua ha
// davvero. Il motore carica SOLO quella attiva, con un import() dinamico
// (vedi dictionary.ts → ensurePack), quindi il pacchetto è un chunk a parte che
// il browser mette in cache per conto suo.
//
// Il file sorgente translations.json NON si tocca: resta la fonte unica, si
// continua a modificare quello. Questo script gira a ogni build e a ogni
// `npm run dev` (vedi prebuild/predev in package.json); la cartella generated/
// è un artefatto rigenerabile ed è in .gitignore.
//
// Le voci curate a mano in dictionary.ts (RAW) NON passano di qui: sono poche,
// servono per le stringhe dinamiche che il crawl non vede, e restano nel bundle.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const I18N_DIR = path.resolve(__dirname, "../src/app/i18n");
const SRC = path.join(I18N_DIR, "translations.json");
const OUT_DIR = path.join(I18N_DIR, "generated");

const LANGS = ["it", "en", "fr", "de"];

/** Stessa normalizzazione di dictionary.ts: spazi singoli, niente bordi. */
function normalizeKey(s) {
  return s.replace(/\u00A0/g, " ").trim().replace(/\s+/g, " ");
}

// Una chiave ha senso solo se contiene almeno una lettera: numeri, date e
// simboli sono identici in tutte le lingue. (Stesso filtro di dictionary.ts —
// qui però si applica a build-time, così quei byte non partono nemmeno.)
function isTranslatableKey(k) {
  return /\p{L}/u.test(k);
}

if (!existsSync(SRC)) {
  console.warn("[i18n] translations.json non trovato: nessun pacchetto generato");
  process.exit(0);
}

const all = JSON.parse(readFileSync(SRC, "utf8"));
mkdirSync(OUT_DIR, { recursive: true });

const report = [];
for (const lang of LANGS) {
  /** @type {Record<string, string>} */
  const pack = {};
  for (const raw in all) {
    const key = normalizeKey(raw);
    if (!isTranslatableKey(key)) continue;
    const value = all[raw]?.[lang];
    // Niente voci a vuoto: se la traduzione coincide con la chiave, il motore
    // otterrebbe lo stesso risultato non trovando niente.
    if (typeof value !== "string" || !value || value === key) continue;
    pack[key] = value;
  }
  const file = path.join(OUT_DIR, `${lang}.json`);
  const json = JSON.stringify(pack);
  writeFileSync(file, json);
  report.push(`${lang} ${Object.keys(pack).length} voci · ${(json.length / 1024).toFixed(0)} kB`);
}

console.log(`[i18n] pacchetti generati — ${report.join(" | ")}`);
