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

/* ── Il numero di commit, che qui si LEGGE e basta ────────────────────────────
   Contarlo è più difficile di quanto sembri (clone troncato, repo privato,
   numeri che tornano indietro) e il ragionamento per esteso sta in
   scripts/build-commits.mjs, che è l'unico padrone di src/app/site/commits.json
   e gira subito prima di questo script. Qui il numero serve solo per metterlo
   nel payload dell'archivio: leggerlo, non ricontarlo. Due posti che contano
   la stessa cosa in due modi sono due posti che prima o poi dicono numeri
   diversi. */
const COUNT_FILE = join(root, "src", "app", "site", "commits.json");

function contoCommit() {
  try {
    const j = JSON.parse(readFileSync(COUNT_FILE, "utf8"));
    return { count: Number(j.count) || 0, fonte: j.fonte || "committato" };
  } catch {
    return { count: 0, fonte: "assente" };
  }
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
  const conta = contoCommit();
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
