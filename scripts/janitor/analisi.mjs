// ── Dove sta lo sporco ───────────────────────────────────────────────────────
//
// Sei categorie, in ordine di quanto è sicuro toccarle:
//
//   1. rigenerabili   — dist, cache di Vite, log, file prodotti dagli script di
//                       build. Già in .gitignore, li rifà `npm run build`.
//   2. orfaniSrc      — moduli in src/ che nessuno importa, partendo dalle
//                       entrate vere (index.html, api/, script, vite.config).
//   3. assetOrfani    — file in public/ che nessun testo del repo nomina.
//   4. dipendenzeInutili — pacchetti in package.json mai importati.
//   5. duplicati      — stesso contenuto byte per byte in due percorsi.
//   6. git            — oggetti sciolti, rami già confluiti in main.
//
// Le prime cinque le trova questo file; agire è compito di quarantena.mjs, e
// solo dopo che la build ha confermato che il sito sta ancora in piedi.
//
// La regola che tiene insieme tutto: nel dubbio, NON è sporco. Un file lasciato
// dentro per prudenza costa qualche kB; un file portato via per sbaglio rompe
// una pagina. Per questo ogni candidato deve superare due prove indipendenti
// (irraggiungibile dal grafo E mai nominato in nessun testo), e chi viene
// nominato in modo dinamico è protetto in blocco.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'

const IGNORA_SEMPRE = new Set([
  'node_modules', '.git', '.janitor', '.vercel', 'dist', '.vscode', '.claude',
])

const ESTENSIONI_TESTO = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json',
  '.md', '.py', '.sql', '.webmanifest', '.txt', '.svg', '.yml', '.yaml',
])

const ESTENSIONI_MODULO = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.css']

/** Percorre l'albero saltando le cartelle che non ci riguardano. */
export function elenca(radice, sotto = '') {
  const out = []
  const dir = path.join(radice, sotto)
  let voci
  try {
    voci = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const v of voci) {
    if (IGNORA_SEMPRE.has(v.name)) continue
    const rel = sotto ? `${sotto}/${v.name}` : v.name
    if (v.isDirectory()) out.push(...elenca(radice, rel))
    else if (v.isFile()) out.push(rel)
  }
  return out
}

export function peso(radice, rel) {
  try {
    return fs.statSync(path.join(radice, rel)).size
  } catch {
    return 0
  }
}

/** Peso complessivo di una cartella, ricorsivo. 0 se non esiste. */
export function pesoCartella(dir) {
  let tot = 0
  const pila = [dir]
  while (pila.length) {
    const d = pila.pop()
    let voci
    try {
      voci = fs.readdirSync(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const v of voci) {
      const p = path.join(d, v.name)
      if (v.isDirectory()) pila.push(p)
      else {
        try {
          tot += fs.statSync(p).size
        } catch {}
      }
    }
  }
  return tot
}

// ── Grafo degli import ───────────────────────────────────────────────────────

function risolvi(radice, spec, daFile) {
  if (!spec) return null
  // I pacchetti di node_modules non ci interessano: qui si cerca codice nostro.
  if (!spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('@/')) return null

  let base
  if (spec.startsWith('@/')) base = path.join(radice, 'src', spec.slice(2))
  else if (spec.startsWith('/')) base = path.join(radice, spec.slice(1))
  else base = path.resolve(path.dirname(path.join(radice, daFile)), spec)

  for (const est of ESTENSIONI_MODULO) {
    const p = base + est
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return path.relative(radice, p).replace(/\\/g, '/')
  }
  for (const est of ESTENSIONI_MODULO.filter(Boolean)) {
    const p = path.join(base, 'index' + est)
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return path.relative(radice, p).replace(/\\/g, '/')
  }
  return null
}

function specificatori(testo, est) {
  const spec = []
  const aggiungi = (re, gruppo = 1) => {
    for (const m of testo.matchAll(re)) if (m[gruppo]) spec.push(m[gruppo])
  }
  if (est === '.css') {
    aggiungi(/@import\s+(?:url\()?["']([^"']+)["']/g)
    aggiungi(/url\(\s*["']?([^"')]+)["']?\s*\)/g)
  } else if (est === '.html') {
    aggiungi(/<script[^>]+src=["']([^"']+)["']/g)
    aggiungi(/<link[^>]+href=["']([^"']+)["']/g)
  } else {
    aggiungi(/\bfrom\s+["']([^"']+)["']/g)
    aggiungi(/\bimport\s+["']([^"']+)["']/g)
    aggiungi(/\bimport\(\s*["']([^"']+)["']\s*\)/g)
    aggiungi(/\brequire\(\s*["']([^"']+)["']\s*\)/g)
    aggiungi(/\bexport\s+\*\s+from\s+["']([^"']+)["']/g)
  }
  return spec
}

/**
 * Le radici del grafo: tutto ciò che viene eseguito senza che nessuno lo
 * importi. Sbagliare qui è l'unico modo serio di fare danni — una radice
 * dimenticata renderebbe "orfano" un intero ramo di codice vivo — quindi la
 * lista è larga di proposito.
 */
function radiciGrafo(radice, tuttiIFile) {
  const r = ['index.html', 'vite.config.ts', 'postcss.config.mjs']
  for (const f of tuttiIFile) {
    // Funzioni serverless: le invoca Vercel, non un import.
    if (f.startsWith('api/')) r.push(f)
    // Script di build e utilità: li invoca npm o l'utente.
    if (f.startsWith('scripts/')) r.push(f)
  }
  return r.filter((f) => fs.existsSync(path.join(radice, f)))
}

export function grafoRaggiungibile(radice, tuttiIFile) {
  const visti = new Set()
  const pila = radiciGrafo(radice, tuttiIFile)
  for (const r of pila) visti.add(r)

  while (pila.length) {
    const file = pila.pop()
    const est = path.extname(file)
    if (!ESTENSIONI_TESTO.has(est)) continue
    let testo
    try {
      testo = fs.readFileSync(path.join(radice, file), 'utf8')
    } catch {
      continue
    }
    for (const s of specificatori(testo, est)) {
      const ris = risolvi(radice, s.split('?')[0], file)
      if (ris && !visti.has(ris)) {
        visti.add(ris)
        pila.push(ris)
      }
    }
  }
  return visti
}

// ── Testo di tutto il repo, letto una volta sola ─────────────────────────────

function corpusTesto(radice, tuttiIFile) {
  const corpus = new Map()
  for (const f of tuttiIFile) {
    if (!ESTENSIONI_TESTO.has(path.extname(f))) continue
    if (peso(radice, f) > 2_000_000) continue // i pacchetti i18n non nominano file
    try {
      corpus.set(f, fs.readFileSync(path.join(radice, f), 'utf8'))
    } catch {}
  }
  return corpus
}

/** Il nome compare da qualche parte, escludendo il file stesso? */
function nominatoAltrove(corpus, ago, esclusi = new Set()) {
  for (const [file, testo] of corpus) {
    if (esclusi.has(file)) continue
    if (testo.includes(ago)) return file
  }
  return null
}

/**
 * Cartelle di public/ raggiunte per nome costruito a runtime — `/emoji/${nome}`,
 * `/zips/${slug}.zip`, `/models/tex/${auto}-${i}.webp`. Il contenuto di queste
 * cartelle non compare MAI per esteso nel codice: cercarne il nome darebbe zero
 * riscontri e le dichiarerebbe tutte orfane. Sono intoccabili in blocco.
 */
function cartelleDinamiche(corpus) {
  const protette = new Set()
  const re = /["'`]\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)\/(?:\$\{|["'`]\s*\+|\+)/g
  for (const testo of corpus.values()) {
    for (const m of testo.matchAll(re)) protette.add(m[1])
    // Anche la forma senza slash iniziale, es. `models/tex/` + nome.
    for (const m of testo.matchAll(/["'`]([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)\/["'`]\s*\+/g)) {
      protette.add(m[1])
    }
  }
  return protette
}

// ── Le sei categorie ─────────────────────────────────────────────────────────

export function trovaRigenerabili(radice) {
  // Ognuna di queste è (a) ignorata da git e (b) ricostruita da uno script
  // dichiarato in package.json. Il commento dice CHI la rifà: se un domani lo
  // script sparisce, la voce va tolta da qui.
  //
  // `soloConTutto` distingue i rigenerabili che non conviene togliere di
  // routine. Li rifà il `prebuild`, che gira su `npm run build` ma NON su
  // `npm run dev`: portarli via ogni due giorni vuol dire che chi apre il dev
  // server si ritrova /archivio senza ZIP da scaricare finché non fa una build.
  // Sono ~440 kB in tutto — non valgono quel fastidio, e restano lì salvo
  // richiesta esplicita con --tutto.
  const voci = [
    ['dist', 'la rifà `npm run build`', false],
    ['node_modules/.vite', 'cache di Vite, si riscalda da sola al prossimo dev', false],
    ['content/trivia/raw/_IMPORT_REPORT.md', 'report di importazione, rigenerabile', false],
    ['.offline-markdown-preview', 'anteprima temporanea', false],
    ['public/zips', 'la rifà scripts/build-zips.mjs, ma solo in prebuild', true],
    ['public/repo-tree.json', 'lo rifà scripts/build-repo-tree.mjs, ma solo in prebuild', true],
    ['src/app/i18n/generated', 'la rifà scripts/build-i18n.mjs (prebuild e predev)', true],
  ]
  const out = []
  for (const [rel, motivo, soloConTutto] of voci) {
    const p = path.join(radice, rel)
    if (!fs.existsSync(p)) continue
    const bytes = fs.statSync(p).isDirectory() ? pesoCartella(p) : fs.statSync(p).size
    if (bytes > 0) out.push({ path: rel, bytes, motivo, soloConTutto })
  }
  // I log sparsi.
  for (const f of elenca(radice)) {
    if (/\.log$/.test(f)) out.push({ path: f, bytes: peso(radice, f), motivo: 'file di log', soloConTutto: false })
  }
  return out
}

function trovaOrfaniSrc(radice, tuttiIFile, raggiungibili, corpus) {
  const out = []
  for (const f of tuttiIFile) {
    if (!f.startsWith('src/')) continue
    if (!/\.(ts|tsx|js|jsx|css)$/.test(f)) continue
    if (raggiungibili.has(f)) continue
    // Seconda prova, indipendente dalla prima: il nome del file non deve
    // comparire da nessun'altra parte. Copre gli import che il regex non vede
    // (glob, stringhe composte, riferimenti in configurazione).
    const nome = path.basename(f)
    const senzaEst = nome.replace(/\.[^.]+$/, '')
    const citato =
      nominatoAltrove(corpus, nome, new Set([f])) ||
      nominatoAltrove(corpus, `/${senzaEst}'`, new Set([f])) ||
      nominatoAltrove(corpus, `/${senzaEst}"`, new Set([f]))
    if (citato) continue
    out.push({ path: f, bytes: peso(radice, f), motivo: 'nessun import lo raggiunge, nessun testo lo nomina' })
  }
  return out
}

function trovaAssetOrfani(radice, tuttiIFile, corpus, protette) {
  const out = []
  // Questi li chiede il browser o la piattaforma per convenzione, non il codice.
  const perConvenzione = /^public\/(favicon|apple-touch-icon|icon-|site\.webmanifest|robots\.txt|sitemap|manifest)/
  for (const f of tuttiIFile) {
    if (!f.startsWith('public/')) continue
    if (perConvenzione.test(f)) continue
    const pubblico = '/' + f.slice('public/'.length)
    const cartella = path.dirname(f.slice('public/'.length)).replace(/\\/g, '/')
    // Sta in una cartella indirizzata a runtime? Allora non si tocca.
    let dinamica = false
    for (const p of protette) {
      if (cartella === p || cartella.startsWith(p + '/')) dinamica = true
    }
    if (dinamica) continue

    const nome = path.basename(f)
    const citato =
      nominatoAltrove(corpus, pubblico) ||
      nominatoAltrove(corpus, nome, new Set([f]))
    if (citato) continue
    out.push({ path: f, bytes: peso(radice, f), motivo: 'nessun file del repo lo nomina' })
  }
  return out
}

function trovaDipendenzeInutili(radice, corpus) {
  const pkg = JSON.parse(fs.readFileSync(path.join(radice, 'package.json'), 'utf8'))
  const dichiarate = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  // react e react-dom sono in peerDependencies e li usa tutto: non si discutono.
  // Gli altri sono strumenti che nessun import nomina perché li invoca Vite o npm.
  const intoccabili = new Set([
    'react', 'react-dom', 'vite', 'tailwindcss', '@tailwindcss/vite',
    '@vitejs/plugin-react', 'vite-plugin-pwa', '@types/node', '@types/react',
    '@types/react-dom', '@types/geojson',
  ])
  const out = []
  for (const nome of Object.keys(dichiarate)) {
    if (intoccabili.has(nome)) continue
    let usata = false
    for (const testo of corpus.values()) {
      if (
        testo.includes(`'${nome}'`) || testo.includes(`"${nome}"`) ||
        testo.includes(`'${nome}/`) || testo.includes(`"${nome}/`) ||
        testo.includes(`from '${nome}`) || testo.includes(`from "${nome}`)
      ) { usata = true; break }
    }
    if (!usata) out.push({ nome, versione: dichiarate[nome], motivo: 'mai importata, mai nominata' })
  }
  return out
}

function trovaDuplicati(radice, tuttiIFile) {
  const perHash = new Map()
  for (const f of tuttiIFile) {
    const b = peso(radice, f)
    if (b < 4096) continue // sotto i 4 kB il doppione non è un problema di peso
    try {
      const h = crypto.createHash('sha1').update(fs.readFileSync(path.join(radice, f))).digest('hex')
      if (!perHash.has(h)) perHash.set(h, [])
      perHash.get(h).push(f)
    } catch {}
  }
  const out = []
  for (const [, gruppo] of perHash) {
    if (gruppo.length > 1) {
      out.push({ file: gruppo, bytes: peso(radice, gruppo[0]), sprecato: peso(radice, gruppo[0]) * (gruppo.length - 1) })
    }
  }
  return out.sort((a, b) => b.sprecato - a.sprecato)
}

function analizzaGit(radice) {
  const git = (cmd) => {
    try {
      return execSync(`git ${cmd}`, { cwd: radice, encoding: 'utf8' }).trim()
    } catch {
      return ''
    }
  }
  const conta = git('count-objects -v')
  const num = (chiave) => Number((conta.match(new RegExp(`${chiave}: (\\d+)`)) || [])[1] || 0)
  const ramiConfluiti = git('branch --merged main')
    .split('\n')
    .map((r) => r.replace(/^\*?\s*/, '').trim())
    .filter((r) => r && r !== 'main')
  return {
    oggettiSciolti: num('count'),
    bytesSciolti: num('size') * 1024,
    bytesPack: num('size-pack') * 1024,
    ramiConfluiti,
  }
}

export function analizza(radice) {
  const tuttiIFile = elenca(radice)
  const corpus = corpusTesto(radice, tuttiIFile)
  const raggiungibili = grafoRaggiungibile(radice, tuttiIFile)
  const protette = cartelleDinamiche(corpus)

  return {
    rigenerabili: trovaRigenerabili(radice),
    orfaniSrc: trovaOrfaniSrc(radice, tuttiIFile, raggiungibili, corpus),
    assetOrfani: trovaAssetOrfani(radice, tuttiIFile, corpus, protette),
    dipendenzeInutili: trovaDipendenzeInutili(radice, corpus),
    duplicati: trovaDuplicati(radice, tuttiIFile),
    git: analizzaGit(radice),
    cartelleProtette: [...protette].sort(),
    totali: {
      fileTracciati: tuttiIFile.length,
      moduliRaggiungibili: [...raggiungibili].filter((f) => f.startsWith('src/')).length,
    },
  }
}
