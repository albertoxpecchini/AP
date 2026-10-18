#!/usr/bin/env node
// Fotografa la scena 3D della home senza browser aperto: Chromium headless con
// WebGL sulla scheda grafica del PC (headless usa la GPU vera), per controllare
// com'è a un'ora data e a un certo scorrimento.
//
//   node tools/pzkko/scena/foto.mjs [--ora=12:00] [--scroll=0|0.5|1] [--larg=1440] [--alt=900] [--q=…] [--nome=x]
//     dalla cartella albertopecchini.it; le foto vanno in tools/pzkko/lavoro/scena-<nome>.png
//   ?q= aggiunge parametri all'indirizzo (es. --q=notte=1&auto=1 oppure --q=allinea=1)
import { createServer } from 'node:http'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const LAVORO = join(QUI, '../lavoro')
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=').slice(1).join('=') || d
const ora = arg('ora', '12:00'), scroll = Number(arg('scroll', '0')), larg = Number(arg('larg', '1440')), alt = Number(arg('alt', '900')), extra = arg('q', ''), attesa = Number(arg('attesa', '2500')), vars = arg('vars', ''), prova = arg('prova', ''), hover = arg('hover', ''), nome = arg('nome', `${ora.replace(':', '')}-${scroll}`)
const pagina = arg('pagina', '/')

const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.json': 'application/json' }
const puppeteer = createRequire(join(QUI, '../../catture/package.json'))('puppeteer-core')
const server = createServer(async (req, res) => {
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}${pagina}?ora=${ora}${extra ? '&' + extra : ''}`
const exe = join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1243/chrome-win64/chrome.exe')
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
page.on('console', (m) => { if (m.type() !== 'log' && m.type() !== 'info' && m.type() !== 'debug') console.log(`[browser ${m.type()}]`, m.text()) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.setViewport({ width: larg, height: alt, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 })
await page.evaluate(() => document.querySelector('.auguri')?.remove())
const t0 = Date.now()
try { await page.waitForSelector('html[data-scena="pronta"]', { timeout: 40000 }) } catch { console.log('la scena non è partita (html[data-scena] non arriva)') }
console.log(`scena pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
await page.evaluate((s) => { scrollTo(0, s * (document.documentElement.scrollHeight - innerHeight)) }, scroll)
// --vars=--auto-l:0.9;--auto-x:0.45 : variabili CSS imposte alla pagina (per fermare un'auto, provare le luci)
if (vars) await page.evaluate((v) => { for (const kv of v.split(';')) { const [k, val] = kv.split(/:(.*)/); document.documentElement.style.setProperty(k.trim(), val.trim()) } }, vars)
// --prova=<js> : codice eseguito nella pagina prima della foto (per spegnere pezzi e misurare)
if (prova) await page.evaluate((p) => { const s = window.pzkkoScena; new Function('s', p)(s) }, prova)
// --hover=<selettore> : il puntatore sopra un elemento (il foglio si alza)
if (hover) { const el = await page.$(hover); if (el) { await el.scrollIntoView(); await el.hover() } else console.log('hover: non trovo', hover) }
await new Promise((r) => setTimeout(r, attesa))
await mkdir(LAVORO, { recursive: true })
const out = join(LAVORO, `scena-${nome}.png`)
await page.screenshot({ path: out, captureBeyondViewport: false })
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 90) requestAnimationFrame(f); else r(1000 / ((performance.now() - t0) / n)) }; requestAnimationFrame(f) }))
console.log(`${fps.toFixed(0)} fotogrammi al secondo`)
const info = await page.evaluate(() => ({ scroll: scrollY, altezza: document.documentElement.scrollHeight, muro: document.querySelector('.muro').getBoundingClientRect().toJSON() }))
console.log('scritta', out, JSON.stringify(info))
await browser.close()
server.close()
