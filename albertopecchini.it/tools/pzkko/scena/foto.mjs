#!/usr/bin/env node
// Fotografa la scena 3D della home senza browser aperto: Chromium headless con
// WebGL sulla scheda grafica del PC (headless usa la GPU vera), per controllare
// com'è a un'ora data e a un certo scorrimento.
//
//   node tools/pzkko/scena/foto.mjs [--ora=12:00] [--scroll=0|0.5|1] [--larg=1440] [--alt=900] [--q=…] [--nome=x]
//     dalla cartella albertopecchini.it; le foto vanno in tools/pzkko/lavoro/scena-<nome>.png
//   ?q= aggiunge parametri all'indirizzo (es. --q=notte=1&auto=1 oppure --q=allinea=1)
//   --dpr=3 la densità dei pixel (telefono: --larg=390 --alt=844 --dpr=3)
//   --subito non aspetta l'arrivo: fotografa la scena da lontano --attesa ms dopo che è comparsa; con
//     --sequenza=N --passo=ms fa N foto una dopo l'altra (scena-<nome>-1.png …) per vedere il volo
//   Alla fine dice i tempi dei fotogrammi durante l'arrivo (media, 95° percentile, massimo, quanti sopra 33 ms).
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
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
const inietta = arg('inietta', ''), dpr = Number(arg('dpr', '1')), subito = process.argv.includes('--subito'), sequenza = Number(arg('sequenza', '1')), passo = Number(arg('passo', '400'))

const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.css': 'text/css', '.json': 'application/json' }
const puppeteer = createRequire(join(QUI, '../../catture/package.json'))('puppeteer-core')
const server = createServer(async (req, res) => {
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}${pagina}?ora=${ora}${extra ? '&' + extra : ''}`
// il browser: --chrome=<exe> o la variabile CHROME; se no il Chromium di Playwright, se no Edge (c'è su ogni Windows)
const exe = arg('chrome', process.env.CHROME) || [join(process.env.LOCALAPPDATA ?? '', 'ms-playwright/chromium-1243/chrome-win64/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => existsSync(p))
if (!exe) { console.error('non trovo un browser: --chrome=<percorso di chrome.exe o msedge.exe>'); process.exit(1) }
// --libero: senza il ritmo dello schermo (vsync), così i fotogrammi al secondo sono quelli veri e non 60 o 30
const libero = process.argv.includes('--libero') ? ['--disable-gpu-vsync', '--disable-frame-rate-limit'] : []
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist', ...libero] })
const page = await browser.newPage()
page.on('console', (m) => { if ((m.type() !== 'log' && m.type() !== 'info' && m.type() !== 'debug') || m.text().startsWith('scena 3D')) console.log(`[browser ${m.type()}]`, m.text()) })
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.setViewport({ width: larg, height: alt, deviceScaleFactor: dpr })
// --inietta=<js> : codice eseguito nella pagina prima di tutto il resto (per le prove)
if (inietta) await page.evaluateOnNewDocument(inietta)
// (si aspetta il load, non la rete ferma: il segnale vero è html[data-scena="pronta"], sotto)
await page.goto(url, { waitUntil: subito ? 'domcontentloaded' : 'load', timeout: 120000 })
await page.evaluate(() => document.querySelector('.auguri')?.remove())
const t0 = Date.now()
await mkdir(LAVORO, { recursive: true })
if (subito) {
  // la scena da lontano (e il volo, con --sequenza): niente scorrimento né variabili, solo foto
  try { await page.waitForSelector('html.scena-vista', { timeout: 40000 }) } catch { console.log('la scena non compare (html.scena-vista non arriva)') }
  console.log(`scena comparsa dopo ${((Date.now() - t0) / 1000).toFixed(1)} s`)
  await new Promise((r) => setTimeout(r, attesa))
  for (let i = 1; i <= sequenza; i++) {
    const out = join(LAVORO, sequenza > 1 ? `scena-${nome}-${i}.png` : `scena-${nome}.png`)
    const t = Date.now()
    await page.screenshot({ path: out, captureBeyondViewport: false })
    const fase = await page.evaluate(() => window.pzkkoScena?.fase())
    console.log('scritta', out, fase)
    if (i < sequenza) await new Promise((r) => setTimeout(r, Math.max(0, passo - (Date.now() - t))))
  }
  await browser.close(); server.close(); process.exit(0)
}
try { await page.waitForSelector('html[data-scena="pronta"]', { timeout: 40000 }) } catch { console.log('la scena non è partita (html[data-scena] non arriva)') }
console.log(`scena pronta in ${((Date.now() - t0) / 1000).toFixed(1)} s`)
// i fotogrammi dell'arrivo: quanto sono durati
const tempi = await page.evaluate(() => window.pzkkoTempi || [])
if (tempi.length > 10) {
  const ord = [...tempi.slice(3)].sort((a, b) => a - b), media = ord.reduce((a, b) => a + b, 0) / ord.length
  console.log(`arrivo: ${tempi.length} fotogrammi, media ${media.toFixed(1)} ms, 95° ${ord[Math.floor(ord.length * 0.95)]} ms, massimo ${ord.at(-1)} ms, sopra 33 ms: ${ord.filter((x) => x > 33).length}${tempi.some((x) => x > 33) ? ' (ai fotogrammi ' + tempi.map((x, i) => (x > 33 ? i : -1)).filter((i) => i >= 0).join(', ') + ' dalla comparsa)' : ''}`)
}
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
