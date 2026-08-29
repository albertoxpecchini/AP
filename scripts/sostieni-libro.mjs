// ─── Sostieni · manutenzione del libro dei donatori (tabella `donatori`) ─────
//
// Il libro di /sostieni è pubblico: chiunque passi può firmarlo. Quando dentro
// finisce spazzatura (prove, doppioni, insulti) serve un modo per guardarci
// dentro e per fare piazza pulita senza aprire il dashboard di Supabase.
//
// USO:
//   node scripts/sostieni-libro.mjs                → elenca le firme
//   node scripts/sostieni-libro.mjs --reset        → svuota il libro
//   node scripts/sostieni-libro.mjs --reset --dry  → dice cosa cancellerebbe
//
// Prima di cancellare salva SEMPRE una copia in .backup-donatori-<data>.json
// (fuori dal repo non serve: il file è ignorato da git, vedi .gitignore).
//
// Chiavi: --url/--key, oppure le env, oppure .env.local / .env. La cancellazione
// pretende la SERVICE_ROLE: l'anon key non può cancellare (RLS).

import { readFileSync, existsSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const argVal = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const RESET = args.includes("--reset");
const DRY = args.includes("--dry");

function fromEnvFiles(name) {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}
const URL_ = (argVal("--url") ?? process.env.VITE_SUPABASE_URL ?? fromEnvFiles("VITE_SUPABASE_URL"))?.replace(/\/+$/, "");
const KEY = argVal("--key") ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? fromEnvFiles("SUPABASE_SERVICE_ROLE_KEY")
  ?? process.env.VITE_SUPABASE_ANON_KEY ?? fromEnvFiles("VITE_SUPABASE_ANON_KEY");

if (!URL_ || !KEY) {
  console.error("Config mancante: servono VITE_SUPABASE_URL e una chiave (SUPABASE_SERVICE_ROLE_KEY per cancellare).");
  process.exit(1);
}
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const righe = await fetch(
  `${URL_}/rest/v1/donatori?select=*&order=created_at.desc&limit=1000`,
  { headers: HEADERS },
).then(async (r) => {
  if (!r.ok) throw new Error(`lettura ${r.status}: ${await r.text()}`);
  return r.json();
});

console.log(`Firme nel libro: ${righe.length}`);
for (const r of righe) {
  const quando = (r.created_at || "").slice(0, 16).replace("T", " ");
  console.log(`  #${r.id}  ${quando}  [${r.tipo}]  ${r.nome}${r.link ? `  <${r.link}>` : ""}`);
  if (r.messaggio) console.log(`        « ${String(r.messaggio).replace(/\s+/g, " ")} »`);
}

if (!RESET) process.exit(0);
if (!righe.length) { console.log("Niente da cancellare."); process.exit(0); }

const backup = `.backup-donatori-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(backup, JSON.stringify(righe, null, 2), "utf8");
console.log(`\nCopia di sicurezza → ${backup}`);

if (DRY) { console.log(`--dry: cancellerei ${righe.length} righe.`); process.exit(0); }

const res = await fetch(`${URL_}/rest/v1/donatori?id=gte.0`, { method: "DELETE", headers: HEADERS });
if (!res.ok) {
  console.error(`Cancellazione fallita ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`Libro svuotato: ${righe.length} firme rimosse.`);
