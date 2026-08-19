// ─── Le email, viste ─────────────────────────────────────────────────────────
//
//   node scripts/anteprima-email.mjs
//
// Le email non si guardano finché non arrivano, e per farle arrivare bisogna
// spedirle: qui invece si costruiscono tutte con dati finti e si scrivono su
// disco, così il ritocco allo stile (lib/emailStile.ts) si vede in un browser
// prima che parta qualcosa verso qualcuno. Non spedisce niente e non tocca né
// Supabase né Resend: chiama solo le funzioni che compongono il corpo.
//
// Esce una cartella nel temporaneo di sistema con una pagina per ogni email,
// più un indice. I percorsi li stampa alla fine.

import { build } from "esbuild";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const fuori = mkdtempSync(join(tmpdir(), "anteprima-email-"));

// I file veri sono TypeScript: esbuild li impacchetta in un modulo solo, che
// poi si importa. Niente compilazione permanente, niente artefatti nel repo.
const ponte = join(fuori, "moduli.mjs");
await build({
  stdin: {
    contents: `
      export { emailVoto } from "./api/notify.js";
      export { emailApertura } from "./api/d.js";
      export {
        emailRichiesta, emailAutorizzato, emailPrimaApertura, paginaDecisione, pagina,
      } from "./lib/scattiAccesso.js";
      export { collectDiagnostics } from "./lib/serverSecurity.js";
    `,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: ponte,
  logLevel: "warning",
});

const M = await import(pathToFileURL(ponte).href);

// Una richiesta finta, con gli header che Vercel mette davvero: serve a far
// uscire il riquadro della diagnostica come lo si riceve.
const req = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "accept-language": "it-IT,it;q=0.9",
    referer: "https://albertopecchini.it/shooting",
    "x-forwarded-for": "93.45.12.7",
    "x-vercel-ip-city": "Brescia",
    "x-vercel-ip-country-region": "BS",
    "x-vercel-ip-country": "IT",
    "x-vercel-ip-timezone": "Europe/Rome",
  },
};
const { html: diag } = M.collectDiagnostics(req);

const ora = new Date();
const richiesta = {
  id: "aBcDeFgHi",
  sessione: "s1",
  nome: "Giulia Rossi",
  email: "giulia.rossi@example.com",
  rapporto: "sono la ragazza ritratta",
  motivo: "vorrei stamparne una grande per il salotto",
  stato: "in_attesa",
  admin_hash: "",
  admin_scade_il: new Date(+ora + 7 * 86400_000).toISOString(),
  accesso_hash: null,
  accesso_scade_il: new Date(+ora + 24 * 3600_000).toISOString(),
  creata_il: ora.toISOString(),
  decisa_il: null,
  aperture: 0,
  ultima_apertura: null,
};

const base = "https://albertopecchini.it";
const pezzi = [
  ["voto-festa", "Festa · nuovo voto", M.emailVoto({ nome: "Marco", presenza: "sera", giorno: "27", cibo: "porchetta" }, diag).html],
  ["link-aperto", "Link · prima apertura", M.emailApertura("Curriculum per lo studio", "https://albertopecchini.it/cv.pdf", diag).html],
  ["scatti-richiesta", "Shooting · la richiesta (arriva a te)", M.emailRichiesta(richiesta, "token-finto", "Sessione di marzo", base, diag).html],
  ["scatti-autorizzato", "Shooting · l'accesso (arriva a chi ha chiesto)", M.emailAutorizzato(richiesta, "token-finto", "Sessione di marzo", base).html],
  ["scatti-apertura", "Shooting · album aperto", M.emailPrimaApertura(richiesta, "Sessione di marzo", diag).html],
  ["pagina-decisione", "Pagina · la decisione", M.paginaDecisione(richiesta, "token-finto", "Sessione di marzo")],
  ["pagina-errore", "Pagina · link non valido", M.pagina("Link non valido", '<p style="margin:0">Questo link non vale più: o è scaduto, o non è quello giusto.</p>')],
];

for (const [nome, , html] of pezzi) writeFileSync(join(fuori, `${nome}.html`), html, "utf8");

const indice = `<!doctype html><meta charset="utf-8"><title>Anteprima email</title>
<body style="margin:0;padding:24px;font-family:'Titillium Web',system-ui,sans-serif;background:#fcfcfc;color:#171717">
<h1 style="font-size:20px;font-weight:600;margin:0 0 4px">Anteprima email</h1>
<p style="margin:0 0 20px;color:#8f8f8f;font-size:14px">Dati finti. Per lo scuro, cambia tema al sistema: le pagine lo seguono.</p>
${pezzi
  .map(
    ([nome, titolo]) =>
      `<section style="margin:0 0 28px">
  <p style="margin:0 0 6px;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:#8f8f8f">${titolo}</p>
  <iframe src="./${nome}.html" style="width:100%;max-width:640px;height:620px;border:1px solid #e8e8e8;background:#fff"></iframe>
</section>`,
  )
  .join("\n")}
</body>`;
writeFileSync(join(fuori, "indice.html"), indice, "utf8");

console.log(`\n${pezzi.length} email e pagine scritte in:\n  ${fuori}\n`);
console.log(`Apri l'indice:\n  ${pathToFileURL(join(fuori, "indice.html")).href}\n`);
