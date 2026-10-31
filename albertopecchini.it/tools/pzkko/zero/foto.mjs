#!/usr/bin/env node
// La foto del cercapersone zero per il tasto sul muro (29.10): la stessa scena 3D di pzkko/telefono/zero/zero.js nella
// posa «muro» (di tre quarti), disegnata in Chromium su sfondo trasparente e scritta in pzkko/art/zero/zero-piccolo.webp
// (1344 × 776, le proporzioni del tasto di prima, 336 × 194), più pzkko/telefono/zero/muro-dati.js con dove finiscono
// nella foto l'lcd (i quattro angoli, in frazioni) e il led: lì il tasto mette la chiocciolina viva e il led rosso
// (telefono/zero/muro.js). Aprendo il cercapersone, la tela 3D parte da questa stessa posa sopra il tasto: la foto e
// il 3D coincidono e non si vede il cambio.
//
//   node tools/pzkko/zero/foto.mjs               (dalla cartella albertopecchini.it)
//   node tools/pzkko/zero/foto.mjs --prova       solo lavoro/zero/prova.png, senza toccare il sito
// Serve puppeteer-core in tools/catture e un browser (tools/pzkko/browser.mjs). Da rilanciare se cambiano i materiali,
// le luci o la posa del muro in zero.js.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const LAVORO = join(QUI, '../lavoro/zero')
const prova = process.argv.includes('--prova')
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' } // (gli stessi di prova.mjs: pzk os importa anche la chat del sito)
const server = createServer(async (req, res) => {
  const via = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (via === '/__foto') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<!doctype html><meta charset="utf-8"><title>foto</title><body style="margin:0;background:#888">') } // la pagina vuota dove si disegna
  const f = join(ROOT, via)
  try { await stat(f); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const puppeteer = browser.puppeteer()
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  const page = await aperto.newPage()
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 })
  page.on('console', (m) => console.log('  [pagina]', m.text()))
  page.on('pageerror', (e) => console.log('  [errore]', e.message))
  await page.goto(`${base}/__foto`)
  const dati = await page.evaluate(async () => {
    const { crea } = await import('/telefono/zero/zero.js')
    const dlg = document.createElement('div')
    document.body.appendChild(dlg)
    const rig = crea({ dlg, schermo: null, ledEl: null })
    return rig.fotografa({ w: 1344, h: 776 })
  })
  await mkdir(LAVORO, { recursive: true })
  const png = Buffer.from(dati.png.split(',')[1], 'base64')
  await writeFile(join(LAVORO, 'prova.png'), png)
  console.log('lcd', dati.lcd.map((p) => p.map((v) => v.toFixed(4)).join(',')).join('  '), 'led', JSON.stringify(dati.led))
  if (!prova) {
    const OUT = join(ROOT, 'art/zero')
    await mkdir(OUT, { recursive: true })
    await sharp(png).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(join(OUT, 'zero-piccolo.webp'))
    const js = `// Generato da tools/pzkko/zero/foto.mjs: dove stanno l'lcd (i quattro angoli, da in alto a sinistra in senso orario) e il led\n// nella foto del cercapersone zero sul muro (art/zero/zero-piccolo.webp), in frazioni della foto. Non si scrive a mano.\nexport default ${JSON.stringify({ w: dati.w, h: dati.h, lcd: dati.lcd.map((p) => p.map((v) => Math.round(v * 10000) / 10000)), led: { x: Math.round(dati.led.x * 10000) / 10000, y: Math.round(dati.led.y * 10000) / 10000, r: Math.round(dati.led.r * 10000) / 10000 } })}\n`
    await writeFile(join(ROOT, 'telefono/zero/muro-dati.js'), js)
    console.log('scritto', join(OUT, 'zero-piccolo.webp'), 'e telefono/zero/muro-dati.js')
  }
  console.log('prova:', join(LAVORO, 'prova.png'))
} finally {
  await aperto.close()
  server.close()
}
