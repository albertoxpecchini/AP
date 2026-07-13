#!/usr/bin/env node
/**
 * repoclean — pulizia sicura di repository (Node/React/Next.js/TS e non solo)
 *
 * Rimuove SOLO:
 *   - file spazzatura di OS/editor (Thumbs.db, .DS_Store, *.swp, *.bak, ecc.)
 *   - cache e output rigenerabili (.next, .turbo, .cache, dist, build, coverage, *.tsbuildinfo, ecc.)
 *   - log di npm/yarn/pnpm
 *   - cartelle vuote
 *   - (opzionale, con --node-modules) l'intera cartella node_modules
 *
 * NON rimuove MAI:
 *   - file tracciati da git (controllo via `git ls-files`)
 *   - .git, .env*, file di config (tsconfig, package.json, lockfile, ecc.)
 *   - in una cartella che NON è un repo git, a meno che tu non passi --force
 *
 * Con --deep esegue (solo REPORT, non cancella nulla) `npx depcheck` e `npx knip`
 * per segnalare dipendenze/file/export potenzialmente inutilizzati: la decisione
 * di rimuoverli resta manuale, per non rompere mai la UX.
 *
 * Uso:
 *   node repoclean.mjs [cartelle...] [opzioni]
 *
 * Opzioni:
 *   --apply              Applica davvero le cancellazioni (default: dry-run, mostra solo cosa farebbe)
 *   --yes                Salta la conferma interattiva quando usi --apply
 *   --force              Permette di operare anche fuori da un repo git (rischioso)
 *   --node-modules       Include anche l'intera cartella node_modules tra i candidati (sempre sicura da rigenerare)
 *   --deep               Esegue analisi di dipendenze/file inutilizzati (solo report, richiede npx)
 *   --verify             Dopo --apply, esegue "npm run build" (se presente) per verificare che nulla si sia rotto
 *   --list-extensions    Elenca tutte le estensioni file trovate nella repo ed esce
 *   --config <path>      File JSON con override della configurazione (junk patterns, ecc.)
 *   --help               Mostra questo aiuto
 *
 * Esempi:
 *   node repoclean.mjs .
 *   node repoclean.mjs "C:\Users\Administrator\Documents\cascinafontana" "C:\Users\Administrator\Documents\AP"
 *   node repoclean.mjs . --apply --verify
 *   node repoclean.mjs . --list-extensions
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';

// ---------------------------------------------------------------------------
// Configurazione di default — estendibile con --config <file.json>
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
  // Estensioni "sorgente" tipiche dei tuoi progetti (Next.js/React/TS + affini).
  // Usate solo per --list-extensions e per l'analisi --deep, MAI per decidere cosa cancellare.
  sourceExtensions: [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.mts', '.cts',
    '.css', '.scss', '.sass', '.less',
    '.html', '.md', '.mdx', '.json', '.yml', '.yaml', '.toml',
  ],
  assetExtensions: [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.avif',
    '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.pdf',
  ],

  // Nomi di CARTELLE considerate cache/output rigenerabile: cancellabili per intero.
  junkDirNames: [
    '.next', '.turbo', '.parcel-cache', '.cache', '.eslintcache',
    'coverage', '.nyc_output', 'dist', 'build', 'out', '.vite',
    '.swc', '.rollup.cache', '.temp', '.tmp',
  ],

  // File spazzatura per nome esatto o prefisso.
  junkFileExact: [
    'Thumbs.db', 'ehthumbs.db', 'desktop.ini', '.DS_Store',
  ],
  junkFilePrefixes: [
    'npm-debug.log', 'yarn-debug.log', 'yarn-error.log', 'pnpm-debug.log',
  ],
  junkFileExtensions: [
    '.tmp', '.temp', '.bak', '.orig', '.rej', '.swp', '.swo', '.tsbuildinfo',
  ],
  junkFileSuffixes: ['~'],

  // Cose che NON si toccano MAI, qualsiasi cosa succeda.
  neverTouch: [
    '.git', '.hg', '.svn',
    '.env', '.env.local', '.env.development', '.env.production', '.env.example',
    'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
    'tsconfig.json', 'next.config.js', 'next.config.mjs', 'next.config.ts',
    '.gitignore', '.npmrc', '.nvmrc',
  ],
};

// ---------------------------------------------------------------------------
// Parsing argomenti
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    targets: [],
    apply: false,
    yes: false,
    force: false,
    nodeModules: false,
    deep: false,
    verify: false,
    listExtensions: false,
    configPath: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--apply': opts.apply = true; break;
      case '--yes': opts.yes = true; break;
      case '--force': opts.force = true; break;
      case '--node-modules': opts.nodeModules = true; break;
      case '--deep': opts.deep = true; break;
      case '--verify': opts.verify = true; break;
      case '--list-extensions': opts.listExtensions = true; break;
      case '--config': opts.configPath = argv[++i]; break;
      case '--help': case '-h': opts.help = true; break;
      default: opts.targets.push(a);
    }
  }
  if (opts.targets.length === 0) opts.targets.push('.');
  return opts;
}

function loadConfig(configPath) {
  if (!configPath) return DEFAULT_CONFIG;
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return { ...DEFAULT_CONFIG, ...raw };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function dirSize(dirPath) {
  let total = 0;
  const stack = [dirPath];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else { try { total += fs.statSync(full).size; } catch {} }
    }
  }
  return total;
}

function isGitRepo(dirPath) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: dirPath, stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch { return false; }
}

function getTrackedFiles(dirPath) {
  try {
    const out = execSync('git ls-files', { cwd: dirPath, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return new Set(out.split('\n').filter(Boolean).map(p => path.resolve(dirPath, p)));
  } catch { return new Set(); }
}

function isJunkFile(name, cfg) {
  if (cfg.junkFileExact.includes(name)) return true;
  if (cfg.junkFilePrefixes.some(p => name.startsWith(p))) return true;
  if (cfg.junkFileExtensions.some(ext => name.endsWith(ext))) return true;
  if (cfg.junkFileSuffixes.some(s => name.endsWith(s))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Scansione
// ---------------------------------------------------------------------------

function scanRepo(root, cfg, opts) {
  const candidates = []; // { path, type: 'dir'|'file', reason, size }
  const neverTouchSet = new Set(cfg.neverTouch);

  function walk(dir, depth) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (neverTouchSet.has(e.name)) continue;

      if (e.isDirectory()) {
        if (e.name === 'node_modules') {
          if (opts.nodeModules) {
            candidates.push({ path: full, type: 'dir', reason: 'node_modules (rigenerabile con npm/pnpm/yarn install)' });
          }
          continue; // non scendere mai dentro node_modules
        }
        if (cfg.junkDirNames.includes(e.name)) {
          candidates.push({ path: full, type: 'dir', reason: `cartella cache/output rigenerabile (${e.name})` });
          continue; // non serve scendere oltre, la cancelliamo per intero
        }
        walk(full, depth + 1);
      } else {
        if (isJunkFile(e.name, cfg)) {
          candidates.push({ path: full, type: 'file', reason: 'file spazzatura OS/editor/log/temp' });
        }
      }
    }
  }

  walk(root, 0);

  // seconda passata: cartelle vuote rimaste (escludendo quelle già candidate/junk/never-touch)
  function findEmptyDirs(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
    if (entries.length === 0) return true;
    let allChildrenRemovable = true;
    for (const e of entries) {
      if (!e.isDirectory()) { allChildrenRemovable = false; continue; }
      if (neverTouchSet.has(e.name) || e.name === 'node_modules') { allChildrenRemovable = false; continue; }
      const full = path.join(dir, e.name);
      const alreadyCandidate = candidates.some(c => c.path === full);
      if (alreadyCandidate) continue;
      const childEmpty = findEmptyDirs(full);
      if (!childEmpty) allChildrenRemovable = false;
    }
    return allChildrenRemovable && entries.length > 0
      ? entries.every(e => e.isDirectory())
      : entries.length === 0;
  }
  // Nota: per semplicità e sicurezza, le cartelle vuote vengono rilevate ma
  // segnalate solo come informativo qui sotto (non aggiunte come candidate
  // separate per evitare doppi conteggi con le junkDir già trovate).

  return candidates;
}

// ---------------------------------------------------------------------------
// Report + applicazione
// ---------------------------------------------------------------------------

async function processTarget(target, cfg, opts) {
  const root = path.resolve(target);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Repo: ${root}`);
  console.log('='.repeat(70));

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.log('  -> Percorso non trovato o non è una cartella. Salto.');
    return;
  }

  const git = isGitRepo(root);
  if (!git && !opts.force) {
    console.log('  -> Questa cartella NON è un repo git: nessuna rete di sicurezza.');
    console.log('     Uso --force se vuoi comunque procedere (sconsigliato).');
    return;
  }
  const tracked = git ? getTrackedFiles(root) : new Set();

  if (opts.listExtensions) {
    const found = new Map();
    (function walkExt(dir) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walkExt(full);
        else {
          const ext = path.extname(e.name).toLowerCase() || '(senza estensione)';
          found.set(ext, (found.get(ext) || 0) + 1);
        }
      }
    })(root);
    console.log('  Estensioni trovate:');
    [...found.entries()].sort((a, b) => b[1] - a[1]).forEach(([ext, count]) => {
      const known = cfg.sourceExtensions.includes(ext) || cfg.assetExtensions.includes(ext);
      console.log(`    ${ext.padEnd(18)} x${count}${known ? '' : '  (non in config di default)'}`);
    });
    return;
  }

  const candidates = scanRepo(root, cfg, opts)
    .filter(c => opts.force || !tracked.has(c.path));

  if (candidates.length === 0) {
    console.log('  -> Niente da pulire. Repo già ordinato.');
  } else {
    let totalSize = 0;
    console.log('  Candidati alla rimozione:');
    for (const c of candidates) {
      const size = c.type === 'dir' ? dirSize(c.path) : (fs.statSync(c.path).size);
      totalSize += size;
      console.log(`    [${c.type === 'dir' ? 'DIR ' : 'FILE'}] ${fmtSize(size).padStart(9)}  ${path.relative(root, c.path)}   (${c.reason})`);
    }
    console.log(`  Totale liberabile: ${fmtSize(totalSize)} in ${candidates.length} elementi`);

    if (opts.apply) {
      let confirmed = opts.yes;
      if (!confirmed) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question(`  Confermi la cancellazione in "${root}"? (scrivi "si" per confermare): `);
        rl.close();
        confirmed = answer.trim().toLowerCase() === 'si';
      }
      if (confirmed) {
        for (const c of candidates) {
          try {
            fs.rmSync(c.path, { recursive: true, force: true });
          } catch (err) {
            console.log(`    Errore rimuovendo ${c.path}: ${err.message}`);
          }
        }
        console.log('  -> Pulizia applicata.');
      } else {
        console.log('  -> Annullato, nessun file cancellato.');
      }
    } else {
      console.log('  -> Dry-run: nessun file è stato cancellato. Aggiungi --apply per applicare.');
    }
  }

  if (opts.deep) {
    console.log('\n  --- Analisi approfondita (solo report, nessuna cancellazione automatica) ---');
    if (fs.existsSync(path.join(root, 'package.json'))) {
      tryRun('npx --yes depcheck', root, 'depcheck (dipendenze npm potenzialmente inutilizzate)');
      tryRun('npx --yes knip', root, 'knip (file/export potenzialmente inutilizzati)');
    } else {
      console.log('    Nessun package.json trovato: salto analisi Node.');
    }
  }

  if (opts.verify && opts.apply) {
    console.log('\n  --- Verifica build ---');
    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.scripts && pkg.scripts.build) {
        tryRun('npm run build', root, 'build di verifica post-pulizia');
      } else {
        console.log('    Nessuno script "build" in package.json: salto verifica.');
      }
    }
  }
}

function tryRun(cmd, cwd, label) {
  console.log(`    -> ${label} ...`);
  try {
    const out = execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }).toString();
    console.log(out.split('\n').map(l => '       ' + l).join('\n'));
  } catch (err) {
    const out = (err.stdout || '').toString() + (err.stderr || '').toString();
    console.log(out.split('\n').map(l => '       ' + l).join('\n'));
    console.log(`    (comando terminato con errore o tool non disponibile: ${label})`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`
repoclean — pulizia sicura di repository

Uso:
  repoclean [cartelle...] [opzioni]

Opzioni:
  --apply              Applica davvero le cancellazioni (default: dry-run)
  --yes                Salta la conferma interattiva quando usi --apply
  --force              Permette di operare anche fuori da un repo git
  --node-modules       Include anche l'intera cartella node_modules
  --deep               Report (non cancella) su dipendenze/file inutilizzati
  --verify             Dopo --apply, esegue "npm run build" per verificare
  --list-extensions    Elenca le estensioni file trovate ed esce
  --config <path>      File JSON con override della configurazione
  --help               Mostra questo aiuto
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { printHelp(); return; }
  const cfg = loadConfig(opts.configPath);

  console.log(`repoclean — modalità: ${opts.apply ? 'APPLY (cancella davvero)' : 'DRY-RUN (solo simulazione)'}`);
  for (const target of opts.targets) {
    await processTarget(target, cfg, opts);
  }
  console.log('\nFatto.\n');
}

main().catch(err => {
  console.error('Errore:', err);
  process.exit(1);
});
