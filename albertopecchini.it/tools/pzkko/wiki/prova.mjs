#!/usr/bin/env node
// Il collaudo di pzkkopedia nel browser (2.11): apre la wiki in Chromium senza finestra, visita la pagina principale, le
// pagine speciali e un campione di voci (o quelle chieste), e per ognuna conta gli errori di JavaScript, i link rossi, le
// immagini che non si caricano, e fotografa. Le foto in tools/pzkko/lavoro/wiki/.
//
//   node tools/pzkko/wiki/prova.mjs                       la principale, le speciali e 12 voci a caso
//   node tools/pzkko/wiki/prova.mjs "Il muro" "Chat (app)" solo queste
//   node tools/pzkko/wiki/prova.mjs --tutte                tutte le voci (minuti), senza foto tranne le prime
import { createServer } from 'node:http'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..')
const PZKKO = join(SITO, 'pzkko')
const LAVORO = join(SITO, 'tools/pzkko/lavoro/wiki')
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const tutte = process.argv.includes('--tutte')
const chieste = process.argv.slice(2).filter((a) => !a.startsWith('--'))

const { VOCI } = await import(pathToFileURL(join(PZKKO, 'wiki/voci.js')).href)
const titoli = Object.keys(VOCI).filter((t) => !t.startsWith('Pagina principale/') && !/^#RINVIA/i.test(typeof VOCI[t] === 'string' ? VOCI[t] : VOCI[t].testo ?? ''))
const campione = chieste.length ? chieste : tutte ? titoli : [...titoli].sort(() => Math.random() - 0.5).slice(0, 12)
const percorso = (t) => '#/' + encodeURIComponent(t.replace(/ /g, '_')).replace(/%3A/gi, ':').replace(/%2F/gi, '/')
const pagine = chieste.length ? campione.map((t) => [t, percorso(t)]) : [['Pagina principale', '#/'], ['Speciale:UltimeModifiche', '#/Speciale:UltimeModifiche'], ['Speciale:Statistiche', '#/Speciale:Statistiche'], ['Speciale:Categorie', '#/Speciale:Categorie'], ['Speciale:Immagini', '#/Speciale:Immagini'], ['Speciale:LinkRossi', '#/Speciale:LinkRossi'], ['Speciale:Cerca', '#/Speciale:Cerca?q=chiocciola'], ['Cronologia di Il muro', '#/Il_muro?action=history'], ['Categoria:Le app di pzk os', '#/Categoria:Le_app_di_pzk_os'], ...campione.map((t) => [t, percorso(t)])]

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); return res.end('{"ok":false}') }
  let f = join(PZKKO, decodeURIComponent(url.pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}/wiki/`
await mkdir(LAVORO, { recursive: true })
const puppeteer = browser.puppeteer()
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
let problemi = 0, foto = 0
try {
  const page = await aperto.newPage()
  await page.setViewport({ width: 1366, height: 900 })
  const errori = []
  page.on('pageerror', (e) => errori.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()) })
  await page.goto(base, { waitUntil: 'networkidle2', timeout: 60000 })
  if (errori.length) { console.log('ERRORI AL CARICAMENTO:', errori.slice(0, 3).join(' | ').slice(0, 600)); problemi++ }
  for (const [nome, hash] of pagine) {
    errori.length = 0
    await page.evaluate((h) => { location.hash = h }, hash)
    await new Promise((r) => setTimeout(r, 700))
    const dati = await page.evaluate(() => {
      const t = document.getElementById('testo')
      const rossi = [...document.querySelectorAll('#testo a.new, .infobox a.new')].map((a) => a.title.replace(/ \(la pagina non esiste\)$/, ''))
      const img = [...document.querySelectorAll('#testo img')]
      const rotte = img.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src'))
      return { titolo: document.title, caratteri: t?.textContent.length ?? 0, immagini: img.length, rotte, rossi: [...new Set(rossi)], ignoti: [...document.querySelectorAll('.template-ignoto')].map((x) => x.textContent), h1: document.getElementById('h1')?.textContent }
    })
    const brutti = errori.filter((e) => !/favicon|net::ERR_|i\.imgur|wikimedia|albertopecchini\.it/.test(e))
    const riga = `${nome}: ${dati.caratteri} caratteri, ${dati.immagini} immagini${dati.rotte.length ? `, ${dati.rotte.length} ROTTE (${dati.rotte.slice(0, 3).join(', ')})` : ''}${dati.rossi.length ? `, ${dati.rossi.length} link rossi (${dati.rossi.slice(0, 4).join(', ')}${dati.rossi.length > 4 ? '…' : ''})` : ''}${dati.ignoti.length ? `, template ignoti: ${dati.ignoti.join(' ')}` : ''}${brutti.length ? `, ERRORI: ${brutti.slice(0, 2).join(' | ').slice(0, 300)}` : ''}`
    console.log(riga)
    if (brutti.length || dati.rotte.length || dati.ignoti.length || dati.caratteri < 40) problemi++
    if (!tutte || foto < 12) { await page.screenshot({ path: join(LAVORO, `prova-${nome.replace(/[^\w]+/g, '_').slice(0, 40)}.png`) }); foto++ }
  }
} finally { await aperto.close(); server.close() }
console.log(`\npzkkopedia nel browser: ${pagine.length} pagine, ${problemi} con problemi, ${foto} foto in tools/pzkko/lavoro/wiki/`)
process.exit(problemi ? 1 : 0)
