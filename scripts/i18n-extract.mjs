// ─────────────────────────────────────────────────────────────────────────────
// Estrattore stringhe per il multilingua (src/app/i18n).
//
// Fa il crawl di tutte le pagine con il motore di traduzione DISATTIVATO
// (window.__AP_NO_I18N__), raccoglie ogni testo visibile (nodi di testo +
// attributi placeholder/title/aria-label/alt) con la stessa normalizzazione del
// motore, e lo confronta con src/app/i18n/translations.json per dire quali
// stringhe sono ANCORA da tradurre.
//
// Uso:
//   1) build + preview:  npx vite build && npx vite preview --port 4173
//   2) node scripts/i18n-extract.mjs            (scrive scripts/i18n-todo.json)
//      node scripts/i18n-extract.mjs --all      (anche l'elenco completo)
//
// Richiede Playwright (già in devDependencies) e il browser chromium installato.
// ─────────────────────────────────────────────────────────────────────────────
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.I18N_BASE || "http://localhost:4173";
const ROUTES = [
  "/", "/bio", "/trivia", "/pcto", "/me-stesso",
  "/dubliners", "/gattopardo", "/letteratura", 
  "/festa", "/archivio", "/sostieni",
];

// Stessa logica di skip/normalizzazione del motore (translateDom.ts).
const extract = () => {
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);
  const norm = (s) => s.replace(/ /g, " ").trim().replace(/\s+/g, " ");
  const out = new Set();
  const keep = (s) => {
    const k = norm(s);
    if (!k || k.length < 2) return;
    if (!/\p{L}/u.test(k)) return;
    if (/^[\d\s.,:;/€%+\-—–()]+$/.test(k)) return;
    out.add(k);
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) return (SKIP.has(n.tagName) || n.closest("[data-no-i18n]")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n = w.nextNode();
  while (n) {
    if (n.nodeType === 3) keep(n.nodeValue || "");
    else for (const a of ["placeholder", "title", "aria-label", "alt"]) if (n.hasAttribute(a)) keep(n.getAttribute(a) || "");
    n = w.nextNode();
  }
  return [...out];
};

const known = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, "src/app/i18n/translations.json"), "utf8"));
    return new Set(Object.keys(j).map((s) => s.replace(/ /g, " ").trim().replace(/\s+/g, " ")));
  } catch {
    return new Set();
  }
})();

const all = new Map(); // string -> routes[]
const browser = await chromium.launch();
for (const r of ROUTES) {
  const page = await browser.newPage();
  await page.addInitScript(() => { window.__AP_NO_I18N__ = true; });
  try {
    await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(900);
    for (const s of await page.evaluate(extract)) {
      if (!all.has(s)) all.set(s, []);
      all.get(s).push(r);
    }
    process.stdout.write(`${r.padEnd(14)} ok\n`);
  } catch (e) {
    process.stdout.write(`${r.padEnd(14)} ERR ${String(e.message).slice(0, 60)}\n`);
  }
  await page.close();
}
await browser.close();

const list = [...all.keys()];
const missing = list.filter((s) => !known.has(s));
fs.writeFileSync(path.join(__dirname, "i18n-todo.json"), JSON.stringify(missing, null, 0));
if (process.argv.includes("--all")) fs.writeFileSync(path.join(__dirname, "i18n-all.json"), JSON.stringify(list, null, 0));

console.log(`\nUniche: ${list.length} | già tradotte: ${list.length - missing.length} | DA TRADURRE: ${missing.length}`);
console.log(`→ scripts/i18n-todo.json`);
