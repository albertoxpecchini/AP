#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Controllo pre-commit / pre-push — versione automatica di CHECKLIST.md.
// Esegue le verifiche automatizzabili e stampa un riepilogo.
//
//   npm run check              → controlli statici + build di produzione
//   npm run check -- --quick   → solo controlli statici (salta la build)
//
// Esce con codice ≠ 0 se un controllo BLOCCANTE fallisce (build o secret staged).
// Il resto (console.log, TODO) è segnalato ma non blocca.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, statSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const quick = process.argv.includes("--quick");

const CODE_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "scratchpad", "public"]);

let hardFail = false;
const item = (icon, msg) => console.log(`  ${icon}  ${msg}`);
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

/** Raccoglie ricorsivamente i file di codice sotto una cartella. */
function collect(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collect(full, out);
    else if (CODE_EXT.test(name)) out.push(full);
  }
  return out;
}

const files = collect(join(ROOT, "src"));

// ── 1 · Pulizia del codice ───────────────────────────────────────────────────
section("1 · Pulizia del codice");
const stray = [];
let todos = 0;
for (const f of files) {
  const txt = readFileSync(f, "utf8");
  txt.split(/\r?\n/).forEach((l, i) => {
    if (/\bconsole\.(log|debug)\s*\(/.test(l) || /\bdebugger\b/.test(l)) stray.push(`${relative(ROOT, f)}:${i + 1}`);
  });
  const m = txt.match(/\b(TODO|FIXME)\b/g);
  if (m) todos += m.length;
}
if (stray.length) {
  item("⚠", `${stray.length} console.log/debugger da rivedere:`);
  stray.slice(0, 12).forEach((s) => item(" ", s));
  if (stray.length > 12) item(" ", `…e altri ${stray.length - 12}`);
} else item("✓", "nessun console.log/debugger");
item(todos ? "ℹ" : "✓", todos ? `${todos} TODO/FIXME nel codice` : "nessun TODO/FIXME");

// ── 2 · Sicurezza (secret in staging) ────────────────────────────────────────
section("2 · Sicurezza");
let staged = [];
try {
  staged = execSync("git diff --cached --name-only", { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
} catch { /* fuori da un repo git */ }
const risky = staged.filter((p) => /(^|\/)\.env($|\.)|\.pem$|\.key$|id_rsa|secret|credentials/i.test(p));
if (risky.length) {
  hardFail = true;
  item("✗", "possibili SECRET in staging (BLOCCANTE):");
  risky.forEach((p) => item(" ", p));
} else item("✓", "nessun .env/secret in staging");

// ── 3 · Build di produzione ──────────────────────────────────────────────────
section("3 · Build");
if (quick) {
  item("–", "build saltata (--quick)");
} else {
  try {
    execSync("npm run build", { stdio: "inherit" });
    item("✓", "build completata");
  } catch {
    hardFail = true;
    item("✗", "build FALLITA (BLOCCANTE)");
  }
}

// ── Esito ────────────────────────────────────────────────────────────────────
section(hardFail ? "❌ Controlli falliti — sistema prima di pushare" : "✅ Pronto per commit & push");
if (!hardFail) {
  console.log("  Restano i controlli manuali: tema chiaro/scuro, 4 lingue, iOS/desktop, rilettura del git diff.");
}
process.exit(hardFail ? 1 : 0);
