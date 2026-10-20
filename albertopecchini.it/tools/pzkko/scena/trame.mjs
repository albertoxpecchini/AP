#!/usr/bin/env node
// Prepara le trame della scena 3D che prima si disegnavano al volo (pzkko/scena/materiali.js: l'intonaco e
// l'asfalto; le lastre del marciapiede e le pozzanghere le disegna lo shader, scena/marciapiede.js): calcolarle nel
// browser costava ~2 s di pagina ferma sul computer, molti di più sul telefono. Le disegna le stesse funzioni, nel
// browser (headless, come foto.mjs), e le salva in pzkko/art/scena/trame/ in webp a qualità alta.
// Da rilanciare solo se cambiano quelle funzioni:
//
//   node tools/pzkko/scena/trame.mjs        (dalla cartella albertopecchini.it; prima `npm ci` in tools/catture)
import { createServer } from 'node:http'
import { readFile, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../browser.mjs'

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
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true })
const page = await aperto.newPage()
await page.goto(`http://127.0.0.1:${server.address().port}/vuota`)
// gli stessi argomenti di mondo.js; ogni trama torna come PNG (senza perdite) da comprimere qui
const png = await page.evaluate(async () => {
  const m = await import('/scena/materiali.js')
  const url = (t) => t.image.toDataURL('image/png')
  const i = m.intonaco(512, 7), a = m.asfalto(256, 33)
  return {
    'intonaco': url(i.map), 'intonaco-n': url(i.normalMap),
    'asfalto': url(a.map), 'asfalto-n': url(a.normalMap),
  }
})
await aperto.close(); server.close()
await mkdir(OUT, { recursive: true })
for (const [nome, dati] of Object.entries(png)) {
  const buf = Buffer.from(dati.split(',')[1], 'base64')
  // (le normali a qualità alta ma con perdite: senza erano 120 KB l'una per un rilievo che si vede appena)
  const out = join(OUT, `${nome}.webp`)
  await sharp(buf).webp({ quality: 92 }).toFile(out)
  console.log('scritta', out, Math.round((await stat(out)).size / 1024), 'KB')
}
