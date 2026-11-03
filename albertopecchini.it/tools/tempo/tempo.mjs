// La macchina del tempo (/tempo/): ricostruisce il sito com'era a ogni giorno di
// lavoro, dal primo commit (24.5.2026, Figma Make) a oggi, lo fotografa e, se si
// chiede, lo deposita intero per il server di casa.
//
//   node tools/tempo/tempo.mjs                 un giorno alla volta: l'ultimo commit di ogni giorno
//   node tools/tempo/tempo.mjs --forza         rifà anche le versioni già fatte
//   node tools/tempo/tempo.mjs --solo=<sha>    una versione sola (anche più sha, separati da virgola)
//   node tools/tempo/tempo.mjs --da=2026-09-01 solo da quel giorno in poi
//   node tools/tempo/tempo.mjs --limite=5      al massimo cinque versioni, poi si ferma
//   node tools/tempo/tempo.mjs --manifesto     riscrive solo src/data/tempo.js da quello che c'è (le misure dalle foto sul disco)
//   node tools/tempo/tempo.mjs --corte         rifà le foto rimaste al primo schermo (alte 600 px)
//   node tools/tempo/tempo.mjs --deposito=C:\pzkko-server\tempo
//                                              deposita anche il sito intero di ogni versione (HTML,
//                                              CSS, JS, immagini) in <deposito>/versioni/<sha>/, coi
//                                              percorsi assoluti riscritti su /tempo/<sha>/ e i file
//                                              binari in comune fra le versioni (<deposito>/store,
//                                              collegamenti fisici): è quello che il server di casa
//                                              serve a /tempo/, perché la pagina mostri gli HTML veri
//                                              e non le foto (Alberto, 3.11.2026)
//
// Per ogni versione: `git archive` del commit in tools/tempo/lavoro/sito (le
// dipendenze restano se il package-lock non è cambiato, altrimenti `npm ci`),
// `npm run build`, un server statico sulla cartella dist, Chromium headless
// (puppeteer-core di tools/catture, il browser di tools/pzkko/browser.mjs):
// la home a 1280 px a tutta altezza e a 390 px, ridotte in WebP in
// public/media/tempo/<sha>-d.webp e -m.webp. Il manifesto è src/data/tempo.js
// (GENERATO): una riga per versione, con misure, titolo della pagina e commit.
// Una versione che non si compila o non si fotografa resta nel manifesto con
// il suo errore, così la pagina la racconta lo stesso.

import { execSync, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, readdirSync, statSync, createReadStream, copyFileSync, linkSync } from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import { dirname, join, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../pzkko/browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../..') // albertopecchini.it/
const REPO = resolve(SITO, '..') // AP/
const LAVORO = join(QUI, 'lavoro')
const CASA = join(LAVORO, 'sito')
const OUT = join(SITO, 'public/media/tempo')
const MANIFESTO = join(SITO, 'src/data/tempo.js')
const sharp = createRequire(join(SITO, 'tools/catture/package.json'))('sharp')

const argv = process.argv.slice(2)
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=')
const forza = argv.includes('--forza')
const solo = opt('solo') ? opt('solo').split(',') : null
const da = opt('da')
const limite = Number(opt('limite')) || Infinity
const soloManifesto = argv.includes('--manifesto')
const deposito = opt('deposito') ? resolve(opt('deposito')) : null

// quello che cambia il sito di Alberto: fuori pzkko, Better Call Pekko, i workflow e i documenti di radice,
// e fuori quello che produce la macchina del tempo stessa (foto, manifesto, strumento): altrimenti ogni
// aggiornamento delle foto diventava il «giorno di oggi» da fotografare, all'infinito (3.11.2026)
const FUORI = [':!albertopecchini.it/src/data/tempo.js', ':!albertopecchini.it/public/media/tempo', ':!albertopecchini.it/tools/tempo',':!albertopecchini.it/pzkko', ':!albertopecchini.it/tools/pzkko', ':!albertopecchini.it/public/bcp', ':!albertopecchini.it/src/data/assistenza.js', ':!albertopecchini.it/src/templates/pages/assistenza.js', ':!albertopecchini.it/api/bcp.js', ':!.github', ':!README.md', ':!CLAUDE.md', ':!PRODUCT.md', ':!DESIGN.md', ':!.claude']

const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
const hashOf = (file) => (existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12) : 'nessuno')

// ── Il manifesto ─────────────────────────────────────────────────────────────

const leggiManifesto = () => {
  if (!existsSync(MANIFESTO)) return []
  const m = readFileSync(MANIFESTO, 'utf8').match(/export const versioni = (\[[\s\S]*?\n\])/)
  return m ? JSON.parse(m[1]) : []
}

const scriviManifesto = (versioni) => {
  const ok = versioni.filter((v) => v.d)
  const testo = `// GENERATO da tools/tempo/tempo.mjs — non toccare a mano: le versioni del sito,
// una per giorno di lavoro, con le foto in public/media/tempo/. ${ok.length} fotografate su ${versioni.length}.
// Rigenera con \`node tools/tempo/tempo.mjs\` (vedi tools/tempo/README.md).

export const versioni = ${JSON.stringify(versioni, null, 2)}

export const aggiornato = ${JSON.stringify(new Date().toISOString().slice(0, 10))}
`
  // scrittura atomica: se il processo muore a metà il manifesto di prima resta intero
  writeFileSync(MANIFESTO + '.tmp', testo)
  renameSync(MANIFESTO + '.tmp', MANIFESTO)
}

// ── I giorni ─────────────────────────────────────────────────────────────────
// L'ultimo commit di ogni giorno (ora italiana), con quanti commit ha avuto il giorno.

function giorni() {
  const righe = git('log', '--reverse', '--format=%H|%h|%ct|%s', '--', '.', ...FUORI).split('\n').filter(Boolean)
  const perGiorno = new Map()
  for (const r of righe) {
    const [sha, short, ct, ...resto] = r.split('|')
    const quando = new Date(Number(ct) * 1000)
    const data = quando.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
    const ora = quando.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
    const g = perGiorno.get(data) || { data, commit: 0 }
    Object.assign(g, { sha, short, ora, msg: resto.join('|').trim(), commit: g.commit + 1 })
    perGiorno.set(data, g)
  }
  return [...perGiorno.values()]
}

// ── Il server statico della cartella dist ────────────────────────────────────

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' }

function servi(dist) {
  const trova = (p) => {
    const pulito = decodeURIComponent(p.split('?')[0])
    const candidati = [pulito, pulito.replace(/\/$/, '') + '/index.html', pulito + '.html', pulito + '/index.html']
    for (const c of candidati) {
      const f = join(dist, c)
      if (existsSync(f) && statSync(f).isFile()) return f
    }
    return join(dist, 'index.html') // le app a pagina singola rispondono sempre con la home
  }
  const server = http.createServer((req, res) => {
    const f = trova(req.url || '/')
    if (!existsSync(f)) {
      res.statusCode = 404
      return res.end()
    }
    res.setHeader('Content-Type', MIME[extname(f).toLowerCase()] || 'application/octet-stream')
    createReadStream(f).pipe(res)
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, porta: server.address().port })))
}

// ── Costruzione di una versione ──────────────────────────────────────────────

let ultimoLock = null

function estrai(sha) {
  // le dipendenze sopravvivono fra una versione e l'altra: node_modules va in disparte e torna se il lock è lo stesso
  mkdirSync(LAVORO, { recursive: true })
  const nm = join(LAVORO, 'node_modules')
  if (existsSync(CASA)) {
    for (const d of [join(CASA, 'albertopecchini.it/node_modules'), join(CASA, 'node_modules')]) {
      if (existsSync(d)) {
        if (existsSync(nm)) rmSync(nm, { recursive: true, force: true })
        renameSync(d, nm)
      }
    }
    rmSync(CASA, { recursive: true, force: true })
  }
  mkdirSync(CASA, { recursive: true })
  // percorsi relativi: il tar di Git legge «C:» come un host remoto
  const tar = join(LAVORO, 'versione.tar')
  execFileSync('git', ['archive', '--format=tar', '-o', tar, sha], { cwd: REPO })
  execFileSync('tar', ['-xf', 'versione.tar', '-C', 'sito'], { cwd: LAVORO })
  rmSync(tar, { force: true })
  const dir = existsSync(join(CASA, 'albertopecchini.it/package.json')) ? join(CASA, 'albertopecchini.it') : CASA
  if (existsSync(nm)) renameSync(nm, join(dir, 'node_modules'))
  return dir
}

function dipendenze(dir) {
  const lock = join(dir, 'package-lock.json')
  const h = hashOf(lock) + ':' + hashOf(join(dir, 'package.json'))
  const ci = existsSync(lock)
  if (h !== ultimoLock || !existsSync(join(dir, 'node_modules'))) {
    console.log(`  npm ${ci ? 'ci' : 'install'}…`)
    execSync(`npm ${ci ? 'ci' : 'install'} --no-audit --no-fund --loglevel=error${ci ? '' : ' --package-lock=false'}`, { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'], timeout: 15 * 60 * 1000, env: { ...process.env, CI: '1', HUSKY: '0' } })
    ultimoLock = h
  }
}

function compila(dir) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const comando = pkg.scripts?.build ? 'npm run build' : 'npx vite build'
  console.log(`  ${comando}…`)
  execSync(comando, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'], timeout: 15 * 60 * 1000, env: { ...process.env, CI: '1', NODE_ENV: 'production', BCP_STORE: 'memory' } })
  for (const d of ['dist', 'build', 'out']) if (existsSync(join(dir, d, 'index.html'))) return join(dir, d)
  throw new Error('nessuna cartella dist con index.html')
}

async function fotografa(dist, short) {
  const { server, porta } = await servi(dist)
  const puppeteer = browser.puppeteer()
  const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--lang=it-IT', '--font-render-hinting=none'] })
  try {
    const page = await aperto.newPage()
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    const scatta = async (w, h, nome, larghezza) => {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 })
      await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
      await page.evaluate(async () => {
        await (document.fonts?.ready || Promise.resolve())
        // Dal 14.6 al 17.9.2026 il sito scorreva dentro il body (html alto quanto la
        // finestra, body con overflow: auto): la foto «a tutta altezza» prendeva solo il
        // primo schermo. Si fa scorrere chi scorre davvero, poi lo si sblocca.
        const scorre = (e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)
        const contenitori = [...document.querySelectorAll('html, body, body > *, #root, #app, main')].filter(scorre)
        const tutti = [document.scrollingElement || document.documentElement, ...contenitori]
        for (const el of tutti) {
          for (let y = 0; y < el.scrollHeight && y < 30000; y += 600) {
            el.scrollTop = y
            await new Promise((r) => setTimeout(r, 60))
          }
          el.scrollTop = 0
        }
        if (contenitori.length) {
          const s = document.createElement('style')
          s.textContent = 'html, body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; }'
          document.head.append(s)
          for (const el of contenitori) Object.assign(el.style, { height: 'auto', maxHeight: 'none', overflow: 'visible' })
        }
        // via i pannelli fissi (cookie, modali di benvenuto) che coprirebbero la foto
        document.querySelectorAll('[class*="cookie" i], [id*="cookie" i]').forEach((el) => (el.style.display = 'none'))
      })
      await dorm(1800)
      const titolo = await page.title()
      const png = await page.screenshot({ fullPage: true, captureBeyondViewport: true })
      const img = sharp(png).resize({ width: larghezza, withoutEnlargement: true })
      const meta = await img.clone().toBuffer({ resolveWithObject: true })
      const H = Math.min(meta.info.height, 6000)
      await img.extract({ left: 0, top: 0, width: meta.info.width, height: H }).webp({ quality: 64, effort: 5 }).toFile(join(OUT, nome))
      return { w: meta.info.width, h: H, titolo }
    }
    const d = await scatta(1280, 800, `${short}-d.webp`, 960)
    const m = await scatta(390, 844, `${short}-m.webp`, 390)
    return { d: { w: d.w, h: d.h }, m: { w: m.w, h: m.h }, titolo: d.titolo }
  } finally {
    await aperto.close()
    server.close()
  }
}

// ── Il deposito: il sito intero di una versione, coi percorsi riscritti ─────
// Come fa la Wayback Machine: gli indirizzi assoluti (/assets/…, /media/…, href="/")
// diventano /tempo/<sha>/…, così la pagina servita sotto quel prefisso trova le sue
// cose e i link restano dentro la versione. I file binari uguali fra le versioni
// (le immagini, i font) stanno una volta sola in store/<hash>, con collegamenti fisici.

const RISCRIVI = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.webmanifest', '.json'])
const SEGUE = '[A-Za-z0-9_.@%~-]' // dopo la barra deve venire un pezzo di percorso: «//cdn» e «/"» restano com'erano

// Le stringhe fra virgolette si riscrivono solo se puntano a qualcosa che c'è davvero
// nella versione: il primo pezzo del percorso deve essere un file o una cartella in
// cima alla dist (assets, media, favicon.svg…). Prima si riscriveva ogni "/qualcosa", e
// il voto «8.5» col suffisso "/10" diventava «8.5/tempo/540d403/10» (3.11.2026).
// Gli attributi dell'HTML (href, src, action, poster, srcset) sono sempre indirizzi:
// quelli si riscrivono tutti.
//
// Un indirizzo già riscritto non si tocca più (NON, qui sotto): dal 3.11.2026 il sito
// ha una cartella tempo/ (la macchina del tempo stessa), e il passaggio delle stringhe
// prendeva "/tempo/<sha>/assets/…", appena scritto dagli attributi, per un percorso
// che esiste e ci rimetteva il prefisso davanti: «/tempo/bc7ba74/tempo/bc7ba74/…».

function riscrivi(testo, ext, prefisso, cima) {
  const P = prefisso.replace(/\$/g, '$$$$')
  const NON = '(?!' + prefisso.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/)'
  const reUrl = new RegExp('url\\(\\s*(["\']?)\\/' + NON + '(?=' + SEGUE + ')', 'g')
  if (ext === '.css') return testo.replace(reUrl, `url($1${P}/`)
  const reAttr = new RegExp('\\b(href|src|action|poster|data-src)=(["\'])\\/' + NON + '(?=' + SEGUE + '|\\2)', 'g')
  const reSrcset = new RegExp('(^\\s*|,\\s*)\\/' + NON + '(?=' + SEGUE + ')', 'g')
  const reStringa = new RegExp('(["\'`])\\/' + NON + '(' + SEGUE + '[^"\'`\\s]*)', 'g')
  // un «%» che non è una sequenza valida (un testo, non un indirizzo) non fa cadere il deposito
  const esiste = (resto) => {
    const primo = resto.split(/[/?#]/)[0]
    try {
      return cima.has(decodeURIComponent(primo))
    } catch {
      return cima.has(primo)
    }
  }
  let out = testo
  if (ext === '.html' || ext === '.htm') {
    out = out.replace(reAttr, `$1=$2${P}/`)
    out = out.replace(/srcset="([^"]*)"/g, (m, v) => `srcset="${v.replace(reSrcset, `$1${P}/`)}"`)
  }
  // le stringhe nel JS (e negli script dentro l'HTML): "/assets/x.js", '/media/y.webp'
  out = out.replace(reStringa, (m, q, resto) => (esiste(resto) ? `${q}${prefisso}/${resto}` : m))
  if (ext !== '.json' && ext !== '.webmanifest') out = out.replace(reUrl, `url($1${P}/`)
  return out
}


function deposita(dist, short) {
  const dest = join(deposito, 'versioni', short)
  const store = join(deposito, 'store')
  mkdirSync(store, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  const prefisso = `/tempo/${short}`
  const cima = new Set(readdirSync(dist))
  let n = 0
  let byte = 0
  const giro = (dir, rel) => {
    for (const nome of readdirSync(dir)) {
      const f = join(dir, nome)
      const r = rel ? `${rel}/${nome}` : nome
      const st = statSync(f)
      if (st.isDirectory()) {
        mkdirSync(join(dest, r), { recursive: true })
        giro(f, r)
        continue
      }
      const ext = extname(nome).toLowerCase()
      mkdirSync(dirname(join(dest, r)), { recursive: true })
      if (RISCRIVI.has(ext)) {
        const t = riscrivi(readFileSync(f, 'utf8'), ext, prefisso, cima)
        writeFileSync(join(dest, r), t)
        byte += Buffer.byteLength(t)
      } else {
        // binario (o testo che non si riscrive): nello store una volta sola, e un collegamento fisico qui
        const h = createHash('sha1').update(readFileSync(f)).digest('hex')
        const inStore = join(store, h.slice(0, 2), h + ext)
        if (!existsSync(inStore)) {
          mkdirSync(dirname(inStore), { recursive: true })
          copyFileSync(f, inStore)
          byte += st.size
        }
        try {
          linkSync(inStore, join(dest, r))
        } catch {
          copyFileSync(inStore, join(dest, r))
        }
      }
      n++
    }
  }
  giro(dist, '')
  return { file: n, kb: Math.round(byte / 1024) }
}

function statoDeposito(versioni) {
  if (!deposito) return
  const pronte = versioni.filter((v) => existsSync(join(deposito, 'versioni', v.short, 'index.html'))).map((v) => v.short)
  writeFileSync(join(deposito, 'stato.json'), JSON.stringify({ aggiornato: new Date().toISOString(), versioni: pronte }, null, 1))
}

// ── Il giro ──────────────────────────────────────────────────────────────────

mkdirSync(OUT, { recursive: true })
const fatte = new Map(leggiManifesto().map((v) => [v.sha, v]))
const tutte = giorni()
let versioni = tutte.map((g) => ({ ...(fatte.get(g.sha) || {}), ...g }))

// le misure delle foto che ci sono già sul disco ma non nel manifesto (un giro interrotto)
async function misureDalDisco(v) {
  if (v.d) return
  const fd = join(OUT, `${v.short}-d.webp`)
  const fm = join(OUT, `${v.short}-m.webp`)
  if (!existsSync(fd) || !existsSync(fm)) return
  const [a, b] = await Promise.all([sharp(fd).metadata(), sharp(fm).metadata()])
  Object.assign(v, { d: { w: a.width, h: a.height }, m: { w: b.width, h: b.height } })
}
for (const v of versioni) await misureDalDisco(v)
// il numero si riscrive sugli stessi oggetti: il giro qui sotto li modifica, e una copia
// nuova a ogni passo (com'era prima del 3.11.2026) faceva perdere le misure appena prese
const numera = () => versioni.forEach((v, i) => (v.n = i + 1))

if (soloManifesto) {
  numera()
  scriviManifesto(versioni)
  statoDeposito(versioni)
  console.log(`manifesto: ${versioni.length} versioni, ${versioni.filter((v) => v.d).length} con la foto`)
  process.exit(0)
}

// --corte: rifà le foto rimaste al primo schermo (alte quanto la finestra: 600 px su 960)
const corte = argv.includes('--corte')
const depositata = (v) => deposito && existsSync(join(deposito, 'versioni', v.short, 'index.html'))
const serveFoto = (v) => forza || !v.d || (corte && v.d.h <= 620)
const serveDeposito = (v) => Boolean(deposito) && (forza || !depositata(v))
const daFare = versioni.filter((v) => (solo ? solo.some((s) => v.sha.startsWith(s) || v.short === s) : true) && (!da || v.data >= da) && (serveFoto(v) || serveDeposito(v)))
console.log(`${versioni.length} giorni di lavoro, ${daFare.length} da ricostruire${Number.isFinite(limite) ? ` (al massimo ${limite})` : ''}${deposito ? ` · deposito in ${deposito}` : ''}`)

let n = 0
const t0 = Date.now()
for (const v of daFare) {
  if (n >= limite) break
  n++
  const inizio = Date.now()
  console.log(`\n[${n}/${Math.min(daFare.length, limite)}] ${v.data} ${v.short} · ${v.msg.slice(0, 70)}`)
  const errore = (e) => String(e.stderr || e.message || e).split('\n').filter(Boolean).slice(-3).join(' · ').slice(0, 300)
  let dist
  try {
    const dir = estrai(v.sha)
    dipendenze(dir)
    dist = compila(dir)
  } catch (e) {
    // non si compila più: è l'unico caso in cui la versione resta senza foto
    v.errore = errore(e)
    if (!existsSync(join(OUT, `${v.short}-d.webp`))) {
      delete v.d
      delete v.m
    }
    console.log(`  ✗ ${v.errore}`)
  }
  if (dist) {
    delete v.errore
    if (serveFoto(v)) {
      try {
        const foto = await fotografa(dist, v.short)
        Object.assign(v, foto)
        console.log(`  ✓ ${foto.d.w}×${foto.d.h} · ${foto.m.w}×${foto.m.h} · «${foto.titolo}»`)
      } catch (e) {
        console.log(`  ✗ foto: ${errore(e)}`) // resta la foto di prima, se c'era
      }
    }
    if (serveDeposito(v)) {
      try {
        const d = deposita(dist, v.short)
        delete v.erroreDeposito
        console.log(`  ✓ deposito: ${d.file} file, ${d.kb} KB nuovi`)
      } catch (e) {
        v.erroreDeposito = errore(e)
        console.log(`  ✗ deposito: ${v.erroreDeposito}`)
      }
    }
  }
  console.log(`  ${Math.round((Date.now() - inizio) / 1000)} s`)
  numera()
  scriviManifesto(versioni)
  statoDeposito(versioni)
}

const ok = versioni.filter((x) => x.d).length
console.log(`\n${ok} versioni con la foto su ${versioni.length} · ${Math.round((Date.now() - t0) / 60000)} min`)
