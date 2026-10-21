#!/usr/bin/env node
// Catture dei siti mostrati nei progetti web (public/media/web/), rifatte da sole
// quando un sito cambia. Vedi README.md.
//
//   node tools/catture/catture.mjs                  rifà i siti cambiati dall'ultima volta
//   node tools/catture/catture.mjs rivalta ap       solo quei siti (slug o prefisso dei file)
//   node tools/catture/catture.mjs --controlla      dice solo quali sono cambiati
//   node tools/catture/catture.mjs --forza [siti]   rifà anche se non sono cambiati
//   node tools/catture/catture.mjs --prova <dir>    scrive le immagini in <dir>: sito e stato restano come sono
//   node tools/catture/catture.mjs --manifesto      riscrive solo src/data/catture.js
//
// Un sito è «cambiato» quando cambia l'HTML delle pagine che si fotografano (con Vite
// i nomi di CSS e JS portano l'impronta del contenuto: ogni deploy che cambia qualcosa
// cambia l'HTML) oppure lo strumento stesso (siti.js, questo file). L'ultima impronta
// di ogni sito sta in stato.json; su GitHub Actions nella cache del workflow.

import { createHash } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'
import { appendFile, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { projects } from '../../src/data/projects.js'
import { formati, siti } from './siti.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../..')
const WEB = join(SITO, 'public/media/web')
const MANIFESTO = join(SITO, 'src/data/catture.js')
const STATO = join(QUI, 'stato.json')

const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'

// Animazioni e transizioni ferme sullo stato finale, niente cursore di testo lampeggiante.
const FERMO = `
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
    transition-duration: 0s !important; transition-delay: 0s !important;
    caret-color: transparent !important; scroll-behavior: auto !important;
  }
`

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const inCI = !!process.env.GITHUB_ACTIONS
const avviso = (m) => console.log(inCI ? `::warning::${m}` : `! ${m}`)
const errore = (m) => console.log(inCI ? `::error::${m.split('\n')[0]}\n${m}` : `✗ ${m}`)
const uscita = (k, v) => process.env.GITHUB_OUTPUT && appendFile(process.env.GITHUB_OUTPUT, `${k}=${v}\n`)

// ── Argomenti ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const iProva = argv.indexOf('--prova')
const prova = iProva >= 0 ? resolve(argv[iProva + 1] || 'prova') : null
const opzioni = { controlla: argv.includes('--controlla'), forza: argv.includes('--forza'), manifesto: argv.includes('--manifesto') }
const filtri = argv
  .filter((a, i) => !a.startsWith('--') && !(iProva >= 0 && i === iProva + 1))
  .flatMap((a) => a.split(/[\s,]+/))
  .filter(Boolean)

// ── Siti ─────────────────────────────────────────────────────────────────────

const progetti = new Map(projects.map((p) => [p.slug, p]))
const elenco = Object.entries(siti).map(([slug, conf]) => {
  const url = (conf.url || progetti.get(slug)?.web?.url || '').replace(/\/$/, '')
  if (!url) throw new Error(`${slug}: manca web.url in src/data/projects.js`)
  return { ...conf, slug, url }
})
const corrisponde = (sito, f) => sito.slug.includes(f) || sito.catture.some((c) => c.file.startsWith(`${f}-`))

// L'impronta dello strumento: se cambia il modo di fotografare, si rifà tutto.
const strumento = createHash('sha256')
  .update(await readFile(join(QUI, 'siti.js')))
  .update(await readFile(fileURLToPath(import.meta.url)))
  .digest('hex')

async function impronta(sito) {
  const h = createHash('sha256').update(strumento)
  for (const percorso of new Set(sito.catture.map((c) => c.percorso.split('#')[0]))) {
    const risposta = await fetch(sito.url + percorso, {
      headers: { 'user-agent': UA_DESKTOP, accept: 'text/html' },
      signal: AbortSignal.timeout(30_000),
    })
    if (!risposta.ok) throw new Error(`${sito.url + percorso}: HTTP ${risposta.status}`)
    // le versioni ?v= delle catture non contano: sono le catture stesse
    const html = (await risposta.text()).replace(/(\/media\/web\/[\w.-]+)\?v=\w+/g, '$1')
    h.update(`${percorso}\n${html}\n`)
  }
  return h.digest('hex').slice(0, 16)
}

// ── Browser ──────────────────────────────────────────────────────────────────

function chrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidati = []
  if (process.platform === 'win32') {
    const pw = join(process.env.LOCALAPPDATA || '', 'ms-playwright')
    if (existsSync(pw)) {
      for (const d of readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) candidati.push(join(pw, d, 'chrome-win64/chrome.exe'))
    }
    candidati.push('C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
  } else if (process.platform === 'darwin') {
    candidati.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
  } else {
    candidati.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser')
  }
  const trovato = candidati.find((c) => existsSync(c))
  if (!trovato) throw new Error('Nessun Chrome/Chromium trovato: indicarlo con CHROME_PATH')
  return trovato
}

async function avvia() {
  const { default: puppeteer } = await import('puppeteer-core')
  return puppeteer.launch({
    executablePath: chrome(),
    headless: true,
    args: ['--hide-scrollbars', '--no-sandbox', '--lang=it-IT', '--font-render-hinting=none'],
  })
}

// Scorre tutta la pagina (le immagini pigre e i reveal partono), poi torna in cima.
async function prepara(page) {
  await page.evaluate(async () => {
    const attesa = (ms) => new Promise((r) => setTimeout(r, ms))
    const eager = () => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'))
    eager()
    const passo = Math.round(innerHeight * 0.7)
    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
      scrollTo(0, y)
      await attesa(120)
    }
    scrollTo(0, document.documentElement.scrollHeight)
    await attesa(300)
    eager()
    document.querySelectorAll('video').forEach((v) => {
      v.pause()
      v.currentTime = 0
    })
    scrollTo(0, 0)
  })
  await assesta(page)
}

// Aspetta rete, font, immagini e tessere delle mappe.
async function assesta(page) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15_000 }).catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete && (i.naturalWidth > 0 || !i.currentSrc)), { timeout: 25_000 })
    .catch(() => avviso(`${page.url()}: alcune immagini non si sono caricate`))
  if (await page.$('.leaflet-container')) {
    await page
      .waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].every((t) => t.classList.contains('leaflet-tile-loaded')), { timeout: 20_000 })
      .catch(() => avviso(`${page.url()}: alcune tessere della mappa non si sono caricate`))
    // ridipinge le tessere: a volte resta una fuga chiara tra due righe
    await page.addStyleTag({ content: '.leaflet-tile { mix-blend-mode: normal !important; }' })
  }
  await pausa(400)
}

// Nelle pagine intere gli elementi fissi (barre, indicatori) finirebbero in fondo o
// stirati: restano solo le testate in cima.
function nascondiFisse() {
  for (const el of document.querySelectorAll('body *')) {
    if (getComputedStyle(el).position !== 'fixed') continue
    const r = el.getBoundingClientRect()
    const testata = r.top <= 1 && r.height < 160 && r.width >= innerWidth * 0.9
    if (!testata) el.style.setProperty('visibility', 'hidden', 'important')
  }
}

async function webp(png, formato) {
  const { default: sharp } = await import('sharp')
  let img = sharp(png)
  const { width } = await img.metadata()
  if (width !== formato.larghezza) img = img.resize({ width: formato.larghezza, kernel: 'lanczos3' })
  return img.webp({ quality: formato.qualita || 84, effort: 6, smartSubsample: true }).toBuffer()
}

async function fotografa(page, cattura, formato, larghezza) {
  if (formato.alta || formato.strisce) {
    await page.evaluate(nascondiFisse)
    await page.evaluate(() => scrollTo(0, 0))
    await pausa(300)
  }
  const altezza = await page.evaluate(() => document.documentElement.scrollHeight)
  if (formato.strisce) {
    const n = Math.ceil(altezza / formato.strisce)
    const passo = Math.ceil(altezza / n)
    const out = []
    for (let i = 0; i < n; i++) {
      const y = i * passo
      const png = await page.screenshot({ clip: { x: 0, y, width: larghezza, height: Math.min(passo, altezza - y) }, captureBeyondViewport: true })
      out.push({ nome: `${cattura.file}-${String(i + 1).padStart(2, '0')}.webp`, webp: await webp(png, formato) })
    }
    return out
  }
  // (la finestra così com'è: con captureBeyondViewport, che puppeteer accende da sé, Chrome ridimensiona la vista per lo
  // scatto e una tela WebGL, la scena 3D di pzkko.it, esce nera)
  const png = formato.alta
    ? await page.screenshot({ clip: { x: 0, y: 0, width: larghezza, height: Math.min(formato.alta, altezza) }, captureBeyondViewport: true })
    : await page.screenshot({ captureBeyondViewport: false })
  return [{ nome: cattura.file, webp: await webp(png, formato) }]
}

async function scattaSito(browser, sito) {
  const out = []
  for (const cattura of sito.catture) {
    const formato = formati[cattura.formato]
    const [w, h] = cattura.viewport || formato.viewport
    const page = await browser.newPage()
    try {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: formato.scala, isMobile: !!formato.telefono, hasTouch: !!formato.telefono })
      await page.setUserAgent({ userAgent: formato.telefono ? UA_IPHONE : UA_DESKTOP })
      await page.setExtraHTTPHeaders({ 'accept-language': 'it-IT,it;q=0.9' })
      await page.emulateTimezone('Europe/Rome')
      await page.emulateMediaFeatures([
        { name: 'prefers-reduced-motion', value: 'reduce' },
        { name: 'prefers-color-scheme', value: 'light' },
      ])
      // (sito.carica: fin dove aspettare il caricamento; pzkko.it, con la scena 3D in software su GitHub, solo il documento)
      await page.goto(sito.url + cattura.percorso, { waitUntil: sito.carica || 'networkidle2', timeout: sito.carica ? 180_000 : 60_000 })
      await page.addStyleTag({ content: FERMO + (sito.stile || '') })
      await prepara(page)
      if (sito.prima) await sito.prima(page)
      if (cattura.prima) await cattura.prima(page)
      await assesta(page)
      const foto = await fotografa(page, cattura, formato, w)
      out.push(...foto.map((f) => ({ ...f, famiglia: formato.strisce ? cattura.file : null })))
      console.log(`  ✓ ${cattura.file}${formato.strisce ? ` (${foto.length} strisce)` : ''}`)
    } finally {
      await page.close()
    }
  }
  return out
}

// ── File ─────────────────────────────────────────────────────────────────────

// Due catture sono «uguali» se differiscono al più per qualche pixel di rumore:
// così un sito rifatto senza cambiamenti visibili non produce un commit.
async function simili(a, b) {
  if (a.equals(b)) return true
  const { default: sharp } = await import('sharp')
  const [x, y] = await Promise.all([a, b].map((buf) => sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true })))
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) return false
  let diversi = 0
  for (let i = 0; i < x.data.length; i += 3) {
    const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]))
    if (d > 48 && ++diversi > 32) return false
  }
  return true
}

async function salva({ nome, webp: buf }) {
  const vecchio = await readFile(join(WEB, nome)).catch(() => null)
  const esito = !vecchio ? 'nuova' : (await simili(vecchio, buf)) ? 'invariata' : 'aggiornata'
  if (prova || esito !== 'invariata') await writeFile(join(prova || WEB, nome), buf)
  return { nome, esito, kb: Math.round(buf.length / 1024) }
}

async function scriviManifesto() {
  const { default: sharp } = await import('sharp')
  const righe = []
  for (const nome of (await readdir(WEB)).filter((n) => n.endsWith('.webp')).sort()) {
    const buf = await readFile(join(WEB, nome))
    const { width, height } = await sharp(buf).metadata()
    const v = createHash('sha256').update(buf).digest('hex').slice(0, 8)
    righe.push(`  '${nome}': { w: ${width}, h: ${height}, v: '${v}' },`)
  }
  const testo = `// Generato da tools/catture/catture.mjs: non modificare a mano.
// Le catture dei siti in public/media/web/: misure in px e versione (\`v\`, impronta del
// file), che shot() in projects.js aggiunge all'indirizzo perché i browser non tengano
// la copia vecchia dopo un aggiornamento.

export const catture = {
${righe.join('\n')}
}
`
  const prima = await readFile(MANIFESTO, 'utf8').catch(() => '')
  if (testo !== prima) await writeFile(MANIFESTO, testo)
  return testo !== prima
}

// ── Via ──────────────────────────────────────────────────────────────────────

const stato = JSON.parse(await readFile(STATO, 'utf8').catch(() => '{}'))

if (opzioni.manifesto) {
  console.log((await scriviManifesto()) ? 'src/data/catture.js aggiornato' : 'src/data/catture.js già in pari')
} else {
  const daFare = await controlla()
  await uscita('siti', daFare.map((s) => s.slug).join(' '))
  if (!opzioni.controlla && daFare.length) process.exitCode = (await scatta(daFare)) ? 1 : 0
}

// I siti cambiati dall'ultima volta (tutti con --forza).
async function controlla() {
  const scelti = elenco.filter((s) => !filtri.length || filtri.some((f) => corrisponde(s, f)))
  if (!scelti.length) throw new Error(`Nessun sito corrisponde a: ${filtri.join(' ')}`)

  const daFare = []
  for (const sito of scelti) {
    try {
      sito.impronta = await impronta(sito)
    } catch (e) {
      avviso(`${sito.slug}: sito non raggiungibile, si riprova al prossimo giro (${e.message})`)
      continue
    }
    const cambiato = opzioni.forza || stato[sito.slug]?.impronta !== sito.impronta
    console.log(`${cambiato ? '●' : '○'} ${sito.slug} ${sito.impronta}${cambiato ? ' → da rifare' : ''}`)
    if (cambiato) daFare.push(sito)
  }
  return daFare
}

// Fotografa i siti, salva le catture cambiate, aggiorna manifesto e stato.
// Restituisce quanti siti sono falliti.
async function scatta(daFare) {
  const browser = await avvia()
  const risultati = []
  let falliti = 0
  try {
    for (const sito of daFare) {
      console.log(`\n${sito.slug} — ${sito.url}`)
      try {
        const foto = await scattaSito(browser, sito)
        for (const f of foto) risultati.push({ sito: sito.slug, ...(await salva(f)) })
        if (!prova) {
          // strisce avanzate da una pagina che prima era più lunga
          for (const famiglia of new Set(foto.map((f) => f.famiglia).filter(Boolean))) {
            const nuove = new Set(foto.filter((f) => f.famiglia === famiglia).map((f) => f.nome))
            for (const n of await readdir(WEB)) {
              if (n.startsWith(`${famiglia}-`) && /-\d+\.webp$/.test(n) && !nuove.has(n)) {
                await rm(join(WEB, n))
                risultati.push({ sito: sito.slug, nome: n, esito: 'tolta', kb: 0 })
              }
            }
          }
          // se il sito è cambiato mentre lo si fotografava, lo stato resta vecchio e si rifà al prossimo giro
          const dopo = await impronta(sito).catch(() => null)
          if (dopo === sito.impronta) stato[sito.slug] = { impronta: sito.impronta, url: sito.url, fotografato: new Date().toISOString() }
          else avviso(`${sito.slug}: il sito è cambiato durante le catture, si rifà al prossimo giro`)
        }
      } catch (e) {
        falliti++
        errore(`${sito.slug}: ${e.stack || e.message}`)
      }
    }
  } finally {
    await browser.close()
  }

  if (!prova) {
    await scriviManifesto()
    await writeFile(STATO, `${JSON.stringify(stato, null, 2)}\n`)
  }

  const cambiate = risultati.filter((r) => r.esito !== 'invariata')
  console.log(`\n${cambiate.length} catture cambiate su ${risultati.length}${prova ? ` (prova: file in ${prova})` : ''}`)
  for (const r of cambiate) console.log(`  ${r.esito.padEnd(10)} ${r.nome} ${r.kb ? `${r.kb} KB` : ''}`)

  const toccati = [...new Set(cambiate.map((r) => r.sito))]
  await uscita('cambiate', cambiate.length)
  await uscita('messaggio', `Catture aggiornate: ${toccati.map((s) => progetti.get(s)?.title || s).join(', ')}`)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const righe = risultati.map((r) => `| ${r.sito} | \`${r.nome}\` | ${r.esito} | ${r.kb || ''} |`)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Catture dei siti\n\n| Sito | File | Esito | KB |\n| --- | --- | --- | --- |\n${righe.join('\n')}\n`)
  }
  return falliti
}
