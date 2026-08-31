// ─── Numero di commit del repository, tenuto nel repository ──────────────────
//
// È il numero del muro dei commit, in home, sezione «Open source dal primo
// giorno». Il patto è uno solo:
//
//   il conto si fa dove la storia c'è tutta, e si TRASPORTA dove non c'è.
//
// Il problema. Vercel clona in shallow: su un clone troncato
// `git rev-list --count HEAD` conta i commit che ha sotto mano, non quelli che
// esistono. Lo stesso codice diceva 400 in locale e 10 in produzione, e quel
// 10 non misurava il repository, misurava la profondità del clone del builder.
// Non si risolve con `git fetch --unshallow` in fase di build: ci si prova qui
// sotto, ma su Vercel il repository è privato e lì non ci sono le credenziali
// per andare a prendere il resto della storia.
//
// La soluzione, in tre regole:
//   ① si conta solo con la storia COMPLETA — cioè in locale;
//   ② il numero vive in src/app/site/commits.json, generato E versionato,
//      così al builder arriva già col checkout;
//   ③ il numero non torna MAI indietro: se il conteggio è più basso di quello
//      che c'è nel file (storia troncata, riscritta, o build fuori da git),
//      vince il file. È la regola che rende innocuo ogni caso strano: nel
//      dubbio il sito dice il numero di ieri, mai un numero sbagliato.
//
// In più rispetto a Trivia, e solo perché qui serviva: una seconda fonte per
// quando la storia è troncata ma nelle env var della build c'è un GITHUB_TOKEN.
// Il repository è privato, quindi dal browser non si potrebbe chiedere — ma
// questa è la BUILD, e il token non entra nel bundle. Il totale esce
// dall'intestazione Link: chiedendo una pagina da un commit solo, il numero
// dell'ultima pagina È il totale. Senza token non succede niente di male: si
// resta sulla regola ③ e il numero è quello dell'ultima build fatta in locale.
//
// Chi lo legge: src/app/site/homeLive.tsx (il muro) e build-repo-tree.mjs, che
// se lo mette nel payload dell'archivio. Nessuno dei due conta più niente da
// sé — il numero ha UN padrone solo, ed è questo script.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(root, "src", "app", "site", "commits.json");
const REPO_SLUG = "albertoxpecchini/AP";

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return ""; // git assente, o comando non applicabile: chi chiama decide
  }
}

// Valore trasportato dal checkout: è la base di partenza e il valore di ripiego.
let stored = { count: 0, sha: "", date: "", fonte: "committato" };
try {
  const j = JSON.parse(readFileSync(OUT, "utf8"));
  stored = { ...stored, ...j, count: Number(j.count) || 0 };
} catch {
  /* prima esecuzione, o file illeggibile: si riparte da 0 */
}

/** Il totale secondo l'API di GitHub, o 0 se non si può chiedere. */
async function daGitHub() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return 0;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO_SLUG}/commits?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return 0;
    const m = /[?&]page=(\d+)>;\s*rel="last"/.exec(r.headers.get("link") || "");
    return m ? Number(m[1]) : 0;
  } catch {
    return 0;
  }
}

// Clone troncato? Un tentativo di completarlo si fa — in locale non serve, su
// Vercel non riesce, ma su una CI con le credenziali giuste cambia tutto.
let shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
if (shallow) {
  git(["fetch", "--unshallow", "--quiet"]);
  shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
}

// Regola ①: si conta solo con la storia completa. Su clone troncato il
// conteggio sarebbe un numero più piccolo e casuale: meglio non contare.
let counted = shallow ? 0 : Number(git(["rev-list", "--count", "HEAD"])) || 0;
let fonte = counted ? "git" : "";
if (!counted) {
  counted = await daGitHub();
  if (counted) fonte = "api";
}

// Regola ③: il numero non torna mai indietro.
if (counted > stored.count) {
  const sha = git(["rev-parse", "HEAD"]) || process.env.VERCEL_GIT_COMMIT_SHA || stored.sha;
  const date = git(["log", "-1", "--date=short", "--format=%ad"]) || stored.date;
  writeFileSync(OUT, JSON.stringify({ count: counted, sha, date, fonte }, null, 2) + "\n");
  console.log(`[commits] ${stored.count} → ${counted} commit (fonte: ${fonte})`);
} else {
  const perche = shallow ? "storia troncata" : counted ? "già aggiornato" : "git non disponibile";
  console.log(`[commits] ${stored.count} commit (${perche}, fonte: ${stored.fonte})`);
}
