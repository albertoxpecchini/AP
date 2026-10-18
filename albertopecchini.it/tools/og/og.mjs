// Immagine di anteprima per i social (public/og.png, 1200 × 630): la stessa
// carta della home — nome in minuscolo con il cognome a filo, monogramma,
// claim, aree — composta in HTML con i caratteri del sito e fotografata da
// Chromium. I testi vengono da src/data/site.js, così restano quelli del sito.
//
//   node tools/og/og.mjs            → scrive public/og.png
//   node tools/og/og.mjs --html     → stampa solo l'HTML (per guardarlo nel browser)
//
// Il browser è quello delle catture (puppeteer-core in tools/catture, Chromium
// di Playwright o Chrome/Edge di sistema; CHROME_PATH per indicarne un altro).

import { createRequire } from 'node:module'
import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { site } from '../../src/data/site.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const W = 1200
const H = 630

// coordinate al primo, come nel piè di pagina (indicano il paese, non la casa)
const dms = (v, [pos, neg]) => {
  const a = Math.abs(v)
  const d = Math.floor(a)
  const m = Math.round((a - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${v < 0 ? neg : pos}`
}
const coords = `${dms(site.location.lat, ['N', 'S'])} · ${dms(site.location.lon, ['E', 'W'])}`

const font = (p) => pathToFileURL(join(root, 'node_modules', p)).href
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// le parole del claim composte in corsivo graziato, come nella home
const claim = esc(site.claim).replace(/\b(spazi|identità)\b/g, '<i>$1</i>')
const areas = site.tagline.split(' · ')

export const html = () => `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<style>
@font-face{font-family:Archivo;font-weight:100 900;font-stretch:62% 125%;src:url('${font('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')}') format('woff2-variations')}
@font-face{font-family:Cascadia;font-weight:200 700;src:url('${font('@fontsource-variable/cascadia-code/files/cascadia-code-latin-wght-normal.woff2')}') format('woff2-variations')}
@font-face{font-family:Instrument;font-style:italic;src:url('${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}') format('woff2')}
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{
  position:relative;padding:44px 60px 40px;
  background:#f3f1ec;color:#10110f;font-family:Archivo,sans-serif;text-transform:lowercase;
  -webkit-font-smoothing:antialiased;
}
/* la carta: puntini come nella home, assi verticali come nel sistema grafico */
body::before{content:'';position:absolute;inset:0;
  background:
    radial-gradient(circle at center,rgb(16 17 15/.16) 0 1px,transparent 1.5px) 0 0/20px 20px,
    repeating-linear-gradient(90deg,rgb(16 17 15/.11) 0 1px,transparent 1px 25%) 60px 0/calc(100% - 120px) 100% no-repeat;
  pointer-events:none}
.top{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-family:Cascadia,monospace;font-size:15px;color:#5a5b55}
.top .r{text-align:right}
.mark{width:52px;height:52px;display:block}
.name{position:relative;margin-top:38px;font-weight:600;font-stretch:86%;letter-spacing:-.055em;line-height:.82;font-size:178px}
.name span{display:block}
.name .out{color:transparent;-webkit-text-stroke:2px #10110f}
.claim{position:relative;margin-top:40px;font-size:42px;font-weight:560;font-stretch:94%;letter-spacing:-.03em;line-height:1.05}
.claim i{font-family:Instrument,serif;font-style:italic;font-weight:400;font-stretch:100%;font-size:1.08em;letter-spacing:-.01em}
.foot{position:absolute;left:60px;right:60px;bottom:40px}
.rule{height:9px;background:
  linear-gradient(rgb(16 17 15/.42),rgb(16 17 15/.42)) 0 0/100% 1px no-repeat,
  repeating-linear-gradient(90deg,rgb(16 17 15/.42) 0 1px,transparent 1px 40px) 0 0/100% 9px no-repeat,
  repeating-linear-gradient(90deg,rgb(16 17 15/.16) 0 1px,transparent 1px 8px) 0 0/100% 5px no-repeat}
.row{display:flex;justify-content:space-between;gap:24px;margin-top:16px;font-family:Cascadia,monospace;font-size:15px;color:#5a5b55}
.row ol{display:flex;gap:30px;list-style:none;padding:0}
.row b{font-weight:500;color:#b5360f;margin-right:8px}
.row .r{color:#10110f}
</style></head><body>
<header class="top">
  <svg class="mark" viewBox="0 0 48 48" fill="none" stroke="#10110f" stroke-width="2.6" stroke-linejoin="miter" aria-hidden="true">
    <path d="M7 43 23.5 5"/><path d="M23.5 5v38"/><path d="M13.5 28h10m0-23h8.5a11.5 11.5 0 0 1 0 23h-8.5"/>
    <circle cx="23.5" cy="5" r="1.9" fill="#e5481f" stroke="none"/>
  </svg>
  <span>${esc(site.edition)}</span>
  <span class="r">${esc(site.location.city)} (${esc(site.location.province)}) · ${esc(coords)}</span>
</header>
<h1 class="name"><span>${esc(site.firstName)}</span><span class="out">${esc(site.lastName)}</span></h1>
<p class="claim">${claim}</p>
<footer class="foot">
  <div class="rule"></div>
  <div class="row">
    <ol>${areas.map((a, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b>${esc(a)}</li>`).join('')}</ol>
    <span class="r">${esc(site.title)}</span>
  </div>
</footer>
</body></html>`

function chrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const candidati = []
  if (process.platform === 'win32') {
    const pw = join(process.env.LOCALAPPDATA || '', 'ms-playwright')
    if (existsSync(pw)) for (const d of readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) candidati.push(join(pw, d, 'chrome-win64/chrome.exe'))
    candidati.push('C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')
  } else if (process.platform === 'darwin') {
    candidati.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
  } else {
    candidati.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser')
  }
  const trovato = candidati.find((c) => existsSync(c))
  if (!trovato) throw new Error('Nessun Chrome/Chromium trovato: indicarlo con CHROME_PATH')
  return trovato
}

if (process.argv.includes('--html')) {
  process.stdout.write(html())
} else {
  // puppeteer-core sta fra le dipendenze dello strumento delle catture
  const require = createRequire(join(root, 'tools/catture/package.json'))
  const puppeteer = require('puppeteer-core')
  const browser = await puppeteer.launch({ executablePath: chrome(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--font-render-hinting=none'] })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
    await page.setContent(html(), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const out = join(root, 'public/og.png')
    writeFileSync(out, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } }))
    console.log(`✓ ${out} (${W}×${H})`)
  } finally {
    await browser.close()
  }
}
