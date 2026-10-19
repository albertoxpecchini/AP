#!/usr/bin/env node
// Prepara le trame della scena 3D che prima si disegnavano al volo (pzkko/scena/materiali.js: l'intonaco, le lastre
// del marciapiede, l'asfalto): calcolarle nel browser costava ~2 s di pagina ferma sul computer, molti di più sul
// telefono. Le disegna le stesse funzioni, nel browser (Chromium headless, come foto.mjs), e le salva in
// pzkko/art/scena/trame/ in webp a qualità alta (la mappa delle pozzanghere quasi senza perdite).
// Da rilanciare solo se cambiano quelle funzioni:
//
//   node tools/pzkko/scena/trame.mjs        (dalla cartella albertopecchini.it; prima `npm ci` in tools/catture)
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const OUT = join(ROOT, 'art/scena/trame')
const req = createRequire(join(QUI, '../../catture/package.json'))
const puppeteer = req('puppeteer-core'), sharp = req('sharp')

const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webp': 'image/webp' }
const server = createServer(async (q, r) => {
  const f = join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) throw 0; r.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); r.end(await readFile(f)) }
  catch { r.setHeader('Content-Type', 'text/html'); r.end('<!doctype html><title>trame</title>') }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const exe = process.env.CHROME || [join(process.env.LOCALAPPDATA ?? '', 'ms-playwright/chromium-1243/chrome-win64/chrome.exe'), 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => existsSync(p))
const browser = await puppeteer.launch({ executablePath: exe, headless: true })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${server.address().port}/vuota`)
// gli stessi argomenti di mondo.js; ogni trama torna come PNG (senza perdite) da comprimere qui
const png = await page.evaluate(async () => {
  const m = await import('/scena/materiali.js')
  const url = (t) => t.image.toDataURL('image/png')
  const i = m.intonaco(512, 7), l = m.lastre(512, 21), a = m.asfalto(256, 33)
  return {
    'intonaco': url(i.map), 'intonaco-n': url(i.normalMap),
    'lastre': url(l.map), 'lastre-n': url(l.normalMap), 'lastre-a': url(l.asciutto),
    'asfalto': url(a.map), 'asfalto-n': url(a.normalMap),
  }
})
await browser.close(); server.close()
await mkdir(OUT, { recursive: true })
for (const [nome, dati] of Object.entries(png)) {
  const buf = Buffer.from(dati.split(',')[1], 'base64')
  // (le normali a qualità alta ma con perdite: senza erano 120 KB l'una per un rilievo che si vede appena)
  const maschera = nome.endsWith('-a')
  const out = join(OUT, `${nome}.webp`)
  await sharp(buf).webp(maschera ? { nearLossless: true, quality: 80 } : { quality: 92 }).toFile(out)
  console.log('scritta', out, Math.round((await stat(out)).size / 1024), 'KB')
}
