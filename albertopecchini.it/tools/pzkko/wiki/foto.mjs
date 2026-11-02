#!/usr/bin/env node
// Le foto del sito per pzkkopedia (2.11): apre le pagine di pzkko/ in Chromium senza finestra (il muro senza 3D, `?muro=1`)
// e scrive i WebP in pzkko/wiki/img/. Poi copia e converte le foto di collaudo di tools/pzkko/lavoro/ (la scena 3D, il
// cercapersone zero, l'lcd delle app), che fanno gli altri strumenti.
//
//   node tools/pzkko/wiki/foto.mjs                  tutte
//   node tools/pzkko/wiki/foto.mjs home-giorno wallet    solo queste
//   node tools/pzkko/wiki/foto.mjs --solo-copie     solo le copie da lavoro/ (senza browser)
//   node tools/pzkko/wiki/foto.mjs --lista          i nomi
//
// Serve puppeteer-core in tools/catture e un browser (tools/pzkko/browser.mjs); sharp dal node_modules del sito.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..')
const PZKKO = join(SITO, 'pzkko')
const IMG = join(PZKKO, 'wiki/img')
const LAVORO = join(SITO, 'tools/pzkko/lavoro')
const sharp = createRequire(join(SITO, 'package.json'))('sharp')
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const soloCopie = process.argv.includes('--solo-copie')
const vuole = (nome) => !args.length || args.includes(nome)
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }

// [nome, pagina, { larg, alt, dpr, intera, prima(page), clip, attesa, telefono }]
const DESK = { larg: 1366, alt: 860 }, TEL = { larg: 390, alt: 844, dpr: 2, telefono: true }
const FOTO = [
  ['home-giorno', '/?muro=1&ora=12:00&notte=0&chat&wallet', DESK],
  ['home-notte', '/?muro=1&ora=22:00&notte=1&chat&wallet', DESK],
  ['home-intera', '/?muro=1&ora=12:00&notte=0&chat&wallet', { ...DESK, intera: true, larghezzaFinale: 900 }],
  ['home-telefono', '/?muro=1&ora=12:00&notte=0&chat&wallet', TEL],
  ['storia', '/storia/?muro=1&ora=12:00&notte=0', DESK],
  ['storia-intera', '/storia/?muro=1&ora=12:00&notte=0', { ...DESK, intera: true, larghezzaFinale: 900 }],
  ['404', '/questa-pagina-non-esiste?muro=1&ora=12:00&notte=0', DESK],
  ['gadget', '/gadget/', DESK],
  ['oggetti', '/oggetti/', DESK],
  ['traguardi', '/traguardi/', DESK],
  ['info', '/info/', DESK],
  ['wiki', '/wiki/', DESK],
  ['wiki-voce', '/wiki/#/Il_cercapersone_zero', DESK],
  ['benvenuto', '/?muro=1&ora=12:00&notte=0&novita', { ...DESK, attesa: 1500 }],
  ['wallet', '/?muro=1&ora=12:00&notte=0&chat&wallet#wallet', { ...DESK, attesa: 2500 }],
  ['regia', '/?muro=1&ora=12:00&notte=0#regia', { ...DESK, attesa: 2500 }],
  ['petizione', '/?muro=1&ora=12:00&notte=0&petizione#petizione', { ...DESK, attesa: 3500 }],
  ['lezioni', '/tools/lezioni/', DESK],
  ['barra', '/gadget/', { ...DESK, clip: { x: 0, y: 0, width: 1366, height: 110 } }],
  ['roulette', '/?muro=1&ora=12:00&notte=0#roulette', { ...DESK, attesa: 6000 }],
  ['blackjack', '/?muro=1&ora=12:00&notte=0#blackjack', { ...DESK, attesa: 6000 }],
  ['mine', '/?muro=1&ora=12:00&notte=0#mine', { ...DESK, attesa: 6000 }],
  ['dado', '/?muro=1&ora=12:00&notte=0#dado', { ...DESK, attesa: 6000 }],
  ['moneta', '/?muro=1&ora=12:00&notte=0#moneta', { ...DESK, attesa: 6000 }],
  ['virtual', '/?muro=1&ora=12:00&notte=0#virtual', { ...DESK, attesa: 6000 }],
  // (2.11) la pagina vera del repository su GitHub, per la mattonella «Il repository»
  ['github', 'https://github.com/albertoxpecchini/AP', { ...DESK, attesa: 2500 }],
]
// le copie dalle foto di collaudo: [nome in wiki/img, file in lavoro/, larghezza massima]
const COPIE = [
  ['scena-cima', 'scena-serranda-cima.png', 1280], ['scena-meta', 'scena-serranda-meta.png', 1280], ['scena-fondo', 'scena-serranda-fondo.png', 1280],
  ['scena-telefono', 'scena-serranda-telefono.png', 780], ['scena-storia', 'scena-serranda-storia.png', 1280], ['scena-vivi', 'scena-vivi3d.png', 1280],
  ['muro-desk', 'muro-desk.png', 1000], ['muro-telefono', 'muro-mob.png', 560], ['storia-desk', 'storia-desk.png', 1000],
  ['zero-muro', 'zero/giorno-muro.png', 1280], ['zero-aperto', 'zero/giorno-aperto.png', 1280], ['zero-menu', 'zero/giorno-menu.png', 1280],
  ['zero-cavo', 'zero/larga-cavo.png', 1280], ['zero-volo', 'zero/larga-volo.png', 1280], ['zero-saluto', 'zero/larga-saluto.png', 1280],
  ['zero-tasto', 'zero/prova-tasto.png', 1280], ['zero-guida', 'zero/prova-guida.png', 1280], ['zero-telefono', 'zero/telefono-aperto.png', 780],
  ['zero-lampo', 'zero/lampo-muro.png', 1280],
]
// (2.11) le catture dei siti fratelli, dal sito serio (le rifà da sole ogni ora il workflow delle catture): copiate qui perché
// le mattonelle della pagina principale non dipendano da un altro dominio. Un percorso che comincia con / è dalla cartella del sito
for (const [nome, file] of [['sito-ap', 'ap-desktop'], ['sito-rivalta', 'rivalta-desktop'], ['sito-cascina', 'cascina-desktop'], ['sito-donelli', 'dd-desktop']]) COPIE.push([nome, `/public/media/web/${file}.webp`, 960])
COPIE.push(['sito-bcp', '/public/media/assistenza/shot-bcp.webp', 960])
const APP = ['chat', 'profilo', 'account', 'negozio', 'pzkstore', 'sfide', 'quiz', 'missioni', 'giocatori', 'zaino', 'miniera', 'foto', 'virtual', 'banca', 'rapina', 'lavatrice', 'decifratore', 'conversioni', 'calcolatrice', 'compilatore', 'cucina', 'impostazioni']
for (const a of APP) { COPIE.push([`app-${a}`, `zero/prova-app-${a}-0-apri.png`, 768]); COPIE.push([`app-${a}-collaudo`, `zero/prova-app-${a}.png`, 1400]) }

if (process.argv.includes('--lista')) { console.log([...FOTO.map((f) => f[0]), ...COPIE.map((c) => c[0])].join('\n')); process.exit(0) }
await mkdir(IMG, { recursive: true })

// ---------------------------------------------------------------------------------------------------- le copie
let copiate = 0, mancanti = []
for (const [nome, file, larg] of COPIE) {
  if (!vuole(nome)) continue
  const da = file.startsWith('/') ? join(SITO, file) : join(LAVORO, file), a = join(IMG, `${nome}.webp`)
  if (!existsSync(da)) { mancanti.push(`${nome} (manca lavoro/${file})`); continue }
  try {
    const img = sharp(da), meta = await img.metadata()
    // l'lcd di un'app (768 × 384 a un bit) resta senza perdita: pesa pochissimo; i fogli di collaudo e le foto grandi no
    const lcd = /prova-app-[a-z]+-\d+-/.test(file)
    const grande = /muro-|storia-desk/.test(file)
    await img.resize({ width: Math.min(larg, meta.width ?? larg), withoutEnlargement: true }).webp(lcd ? { lossless: true } : { quality: grande ? 70 : 80 }).toFile(a)
    copiate++
  } catch (e) { mancanti.push(`${nome}: ${e.message}`) }
}
console.log(`copie: ${copiate} scritte${mancanti.length ? `, ${mancanti.length} saltate (${mancanti.slice(0, 5).join('; ')}${mancanti.length > 5 ? '…' : ''})` : ''}`)
if (soloCopie) process.exit(0)

// ---------------------------------------------------------------------------------------------------- il server e le foto
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ ok: false, errore: 'offline' })) }
  let f = join(PZKKO, decodeURIComponent(url.pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(await readFile(join(PZKKO, '404.html')).catch(() => '')) }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const puppeteer = browser.puppeteer()
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
let fatte = 0
try {
  for (const [nome, pagina, o] of FOTO) {
    if (!vuole(nome)) continue
    const page = await aperto.newPage()
    try {
      await page.setViewport({ width: o.larg, height: o.alt, deviceScaleFactor: o.dpr ?? 1, isMobile: !!o.telefono, hasTouch: !!o.telefono })
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      await page.evaluateOnNewDocument(() => { try { localStorage.setItem('pzkko-3d', 'no'); localStorage.setItem('pzkko-suono', 'no'); localStorage.setItem('pzkko-zero-guida', '1'); sessionStorage.setItem('pzkko-benvenuto-visto', '1') } catch {} })
      await page.goto(/^https?:/.test(pagina) ? pagina : base + pagina, { waitUntil: 'networkidle2', timeout: 90000 })
      if (o.intera) { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) } window.scrollTo(0, 0) }) }
      await dorm(o.attesa ?? 1200)
      const png = await page.screenshot({ type: 'png', fullPage: !!o.intera, clip: o.clip, captureBeyondViewport: !!o.intera })
      let img = sharp(png)
      if (o.larghezzaFinale) img = img.resize({ width: o.larghezzaFinale })
      await img.webp({ quality: 78 }).toFile(join(IMG, `${nome}.webp`))
      fatte++
      console.log(`  ${nome}.webp`)
    } catch (e) { console.log(`  ${nome}: NO (${e.message.split('\n')[0]})`) }
    finally { await page.close() }
  }
} finally { await aperto.close(); server.close() }
console.log(`foto: ${fatte} scritte in pzkko/wiki/img/`)
