// ─── Numero di versione di Trivia, tenuto nel repository ─────────────────────
//
// La versione mostrata dal gioco è "1.<numero di commit che hanno toccato
// src/app/trivia/>". Il conteggio si fa con git, ma git da solo NON basta:
// va calcolato dove la storia c'è tutta, e trasportato dove non c'è.
//
// Il problema che questo script risolve. Vercel clona il repository in shallow
// (pochi commit), e su un clone troncato `git rev-list --count` conta solo i
// commit che ha sotto mano: lo stesso identico codice diceva "v1.56" in locale
// e "v1.2" in produzione. Quel numero non misurava la versione del gioco,
// misurava la profondità del clone del builder. E no, non si risolve con un
// `git fetch --unshallow` in fase di build: ci prova già build-repo-tree.mjs e
// su Vercel fallisce (il repository è privato e lì non ci sono le credenziali
// per andare a prendere il resto della storia) — infatti il repo-tree pubblicato
// si dichiara "history": "shallow".
//
// La soluzione: il numero diventa un dato VERSIONATO (version.json). Qui lo si
// ricalcola solo quando la storia è completa — cioè sulla macchina di sviluppo,
// dove il clone è intero — e lo si riscrive nel file solo se è cresciuto. Sul
// builder, che la storia intera non ce l'ha, non si conta niente: si usa il
// valore che è arrivato col checkout. Così locale e produzione dicono lo stesso
// numero, che è tutto quello che si chiede a un numero di versione.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(root, "src", "app", "trivia", "version.json");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return ""; // git assente, o comando non applicabile: chi chiama decide
  }
}

// Valore trasportato dal checkout: è la base di partenza e il valore di ripiego.
let stored = 0;
try {
  stored = Number(JSON.parse(readFileSync(OUT, "utf8")).commits) || 0;
} catch {
  /* prima esecuzione, o file illeggibile: si riparte da 0 */
}

// Si conta SOLO con la storia completa. Su clone troncato il conteggio sarebbe
// un numero più piccolo e casuale: meglio non contare affatto.
const shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
const counted = shallow ? 0 : Number(git(["rev-list", "--count", "HEAD", "--", "src/app/trivia/"])) || 0;

// Il numero non torna mai indietro: se il conteggio è più basso (storia
// troncata, riscritta, o build fuori da git) vince quello che c'è nel file.
if (counted > stored) {
  writeFileSync(OUT, JSON.stringify({ commits: counted }, null, 2) + "\n");
  console.log(`[trivia-version] 1.${stored} → 1.${counted} (aggiornato ${OUT.replace(root, "")})`);
} else {
  const perche = shallow ? "storia troncata" : counted ? "già aggiornato" : "git non disponibile";
  console.log(`[trivia-version] 1.${stored} (${perche})`);
}
