// ─── Genera un link tracciabile "usa e getta" (locale, niente endpoint pubblico) ──
//
// Crea una riga in public.tracked_links (Supabase) e stampa il link corto
//   https://albertopecchini.it/d/<id>
// da incollare nell'email. Scade da solo dopo N giorni (default 7).
//
// Perché in locale e non via API: creare i link non ha un endpoint pubblico
// apposta — meno superficie d'attacco. Serve la SERVICE_ROLE, che sta solo qui.
//
// USO (Node 20+, legge il .env da solo con --env-file):
//   node --env-file=.env scripts/make-link.mjs "https://esempio.it/file.pdf" "Preventivo Rossi"
//   node --env-file=.env scripts/make-link.mjs "<url>" "<etichetta>" --days 14
//   node --env-file=.env scripts/make-link.mjs "<url>" "<etichetta>" --storage documenti/rossi.pdf
//
// ENV richieste (nel .env):
//   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const flag = (name, def = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
// I posizionali sono gli argomenti che non iniziano con -- e non sono valori di flag.
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));

const targetUrl = positional[0];
const label = positional[1] ?? "";
const days = Math.min(Math.max(parseInt(flag("days", "7"), 10) || 7, 1), 30);
const storagePath = flag("storage");

if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
  console.error("✗ Primo argomento: un URL http/https di destinazione.\n" +
    '  Es: node --env-file=.env scripts/make-link.mjs "https://esempio.it/file.pdf" "Etichetta"');
  process.exit(1);
}

const SUPA_URL = process.env.VITE_SUPABASE_URL?.replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !KEY) {
  console.error("✗ Mancano VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY nel .env.");
  process.exit(1);
}

const id = randomBytes(8).toString("base64url"); // ~11 caratteri URL-safe
const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();

const r = await fetch(`${SUPA_URL}/rest/v1/tracked_links`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    id,
    target_url: targetUrl,
    label: label || null,
    storage_path: storagePath || null,
    expires_at: expiresAt,
  }),
});

if (!r.ok) {
  console.error(`✗ Inserimento fallito (${r.status}): ${await r.text()}`);
  console.error("  Hai eseguito supabase/tracked_links.sql? La SERVICE_ROLE è giusta?");
  process.exit(1);
}

const link = `https://albertopecchini.it/d/${id}`;
console.log("\n✓ Link creato\n");
console.log("  " + link);
console.log(`\n  → punta a : ${targetUrl}`);
console.log(`  → scade il: ${new Date(expiresAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" })} (${days}g)`);
if (label) console.log(`  → etichetta: ${label}`);
console.log("");
