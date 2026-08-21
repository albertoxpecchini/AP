// ─── Fotografia del repository per l'archivio (/archivio) ────────────────────
//
// Scrive public/repo-tree.json con l'elenco ESATTO dei file versionati (git
// ls-files: gli stessi che stanno su GitHub, .gitignore incluso), la loro
// dimensione reale e la data dell'ultimo commit che li ha toccati, più i dati
// del commit corrente (sha, messaggio, autore, data).
//
// Perché non le API di GitHub: il repository è PRIVATO, quindi api.github.com
// risponde 404 senza token — e un token nel front-end non si mette. Git in fase
// di build è la fonte più fedele: gira in `prebuild` (anche su Vercel), quindi
// il file si rigenera ad OGNI commit deployato.
//
// Storia troncata (clone shallow di CI): le date per file che non compaiono
// nella storia disponibile ripiegano sulla data del commit corrente, e il JSON
// lo dichiara con "history": "shallow".
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { statSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUT = join(root, "public", "repo-tree.json");
const REPO_SLUG = "albertoxpecchini/AP";

function git(args, { optional = false } = {}) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch (e) {
    if (optional) return "";
    throw e;
  }
}

/** File versionati, ordinati (percorsi POSIX relativi alla radice del repo). */
function trackedFiles() {
  const out = git(["ls-files", "-z"]);
  return out.split("\0").filter(Boolean).sort();
}

/**
 * Data dell'ultimo commit per ciascun file, in UNA sola passata sulla storia
 * (git log --name-only dal più recente: il primo che nomina un file è l'ultimo
 * che l'ha toccato). Le rinomine contano come modifica del nuovo percorso.
 */
function lastCommitDates(paths) {
  const wanted = new Set(paths);
  const dates = new Map();
  const log = git(["log", "--no-merges", "--date=short", "--format=%x01%ad", "--name-only"], { optional: true });
  let current = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("\x01")) { current = line.slice(1).trim(); continue; }
    const p = line.trim();
    if (!p || !current) continue;
    if (wanted.has(p) && !dates.has(p)) dates.set(p, current);
    if (dates.size === wanted.size) break;
  }
  return dates;
}

/* ── Il numero di commit, che è più difficile di quanto sembri ────────────────
   `git rev-list --count HEAD` dice la verità solo se la storia c'è tutta. Su
   Vercel non c'è: il clone è troncato, --unshallow qui sopra ci prova e non ci
   riesce (i permessi del clone non bastano a riscaricare il resto), e il conto
   che ne usciva era 10. Non 400: dieci. Ed è finito in pagina come "1.200+",
   che era un numero scritto a mano nel 2026 e mai più guardato.

   Tre fonti, in ordine di fiducia:

   ① la storia completa, quando c'è — cioè in locale, e allora il numero lo
      RISCRIVIAMO in src/app/site/commits.json, che è versionato apposta (stesso
      patto di src/app/trivia/version.json: un dato generato ma committato,
      perché in CI non si può rigenerare);
   ② l'API di GitHub, se nelle env var della build c'è un token. Il repo è
      privato, quindi dal browser non si può chiedere — ma questa è la BUILD, e
      il token non entra nel bundle. Il conteggio esce dall'intestazione Link:
      chiedendo una pagina da un commit solo, l'ultima pagina È il totale;
   ③ il valore committato, se le prime due non rispondono. Vecchio di un build
      locale, non di mille commit.

   Quello che NON si fa più è fidarsi del conteggio troncato. */
const COUNT_FILE = join(root, "src", "app", "site", "commits.json");

function contoCommittato() {
  try {
    return Number(JSON.parse(readFileSync(COUNT_FILE, "utf8")).count) || 0;
  } catch {
    return 0;
  }
}

async function contoDaGitHub() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return 0;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO_SLUG}/commits?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return 0;
    // Link: <…&page=400>; rel="last" — l'ultima pagina da un commit l'una è il totale.
    const m = /[?&]page=(\d+)>;\s*rel="last"/.exec(r.headers.get("link") || "");
    return m ? Number(m[1]) : 0;
  } catch {
    return 0;
  }
}

/** Il conteggio buono, e da dove è uscito. Scrive commits.json quando può. */
async function contaCommit(shallow, sha, date) {
  if (!shallow) {
    const n = Number(git(["rev-list", "--count", "HEAD"], { optional: true })) || 0;
    if (n) {
      writeFileSync(COUNT_FILE, JSON.stringify({ count: n, sha, date, fonte: "git" }, null, 2) + "\n");
      return { count: n, fonte: "git" };
    }
  }
  const daApi = await contaDaGitHub();
  if (daApi) {
    writeFileSync(COUNT_FILE, JSON.stringify({ count: daApi, sha, date, fonte: "api" }, null, 2) + "\n");
    return { count: daApi, fonte: "api" };
  }
  return { count: contoCommittato(), fonte: "committato" };
}

async function main() {
  const files = trackedFiles();
  if (!files.length) throw new Error("git ls-files non ha restituito nulla");

  // Clone troncato (CI): proviamo a completarlo, altrimenti lo dichiariamo.
  let shallow = git(["rev-parse", "--is-shallow-repository"], { optional: true }) === "true";
  if (shallow) {
    git(["fetch", "--unshallow", "--quiet"], { optional: true });
    shallow = git(["rev-parse", "--is-shallow-repository"], { optional: true }) === "true";
  }

  const sha = git(["rev-parse", "HEAD"], { optional: true }) || process.env.VERCEL_GIT_COMMIT_SHA || "";
  const date = git(["log", "-1", "--date=short", "--format=%ad"], { optional: true });
  const conta = await contaCommit(shallow, sha, date);
  const commit = {
    sha,
    short: sha.slice(0, 7),
    date,
    message: git(["log", "-1", "--format=%s"], { optional: true }) || process.env.VERCEL_GIT_COMMIT_MESSAGE || "",
    author: git(["log", "-1", "--format=%an"], { optional: true }) || "Alberto Pecchini",
    count: conta.count,
    fonteConteggio: conta.fonte,
  };
  const branch =
    git(["rev-parse", "--abbrev-ref", "HEAD"], { optional: true }) ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    "main";

  const dates = lastCommitDates(files);
  let bytes = 0;
  const tree = files.map((p) => {
    let b = 0;
    try { b = statSync(join(root, p)).size; } catch { /* file rimosso dal working tree */ }
    bytes += b;
    return { p, b, d: dates.get(p) || commit.date };
  });

  const data = {
    repo: REPO_SLUG,
    url: `https://github.com/${REPO_SLUG}`,
    branch,
    commit,
    history: shallow ? "shallow" : "full",
    generatedAt: new Date().toISOString(),
    files: tree.length,
    bytes,
    tree,
  };

  mkdirSync(join(root, "public"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data));
  console.log(
    `✓ repo-tree.json — ${tree.length} file · ${(bytes / 1024 / 1024).toFixed(1)} MB · ` +
      `commit ${commit.short} (${commit.date})${shallow ? " · storia troncata" : ""} · ` +
      `${commit.count} commit (fonte: ${commit.fonteConteggio})`,
  );
}

try {
  await main();
} catch (e) {
  // Senza git (o senza repo) l'archivio nasconde la sezione: non blocchiamo la build.
  console.warn("! repo-tree.json non generato:", e?.message ?? e);
}
