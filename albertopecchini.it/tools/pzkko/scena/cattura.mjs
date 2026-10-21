#!/usr/bin/env node
// Fotografa i volantini della home (quello della 404 e i fogli della storia) per la scena 3D: ogni
// .vol è carta fotografata con sopra il testo vero in HTML, e la scena lo vuole
// come immagine da stendere su un foglio di poligoni (così anche le altre cose fatte in HTML, .it.foto:
// le scritte sprayate della storia). Apre le pagine in Chromium
// (desktop 1440, parete 1280, 2 px per unità), isola un volantino alla volta
// (niente ombra, niente rotazione, sfondo trasparente) e lo ritaglia con un
// margine, così ci sta anche quello che sporge (l'adesivo di «chi sono»).
//
//   node tools/pzkko/scena/cattura.mjs      (dalla cartella albertopecchini.it)
//
// Due volte: col computer (1440 px, art/scena/vol/ e vol.json) e col telefono (390 px, la disposizione a due
// colonne, art/scena/vol-m/ e vol-m.json), perché sul telefono i volantini hanno il testo un po' più grande.
//
// Scrive in pzkko/art/scena/vol/: <nome>.webp (il foglio intero) e, per i fogli
// coi tagliandi, <nome>-senza.webp (la fascia dei tagliandi tolta: in 3D ogni
// tagliando è un pezzo a sé che si strappa) e pzkko/art/scena/vol.json con le
// misure (per le stampe della storia anche dov'è la foto, su cui la scena stende il video della Live Photo).
// Da rilanciare dopo ogni modifica ai testi dei volantini (e dopo
// genera-404.mjs e genera-storia.mjs). Serve puppeteer-core in tools/catture e un browser
// (il Chromium di Playwright o Edge: ../browser.mjs), come per disponi.mjs.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const VISTE = [
  { w: 1440, h: 1000, cartella: 'vol', json: 'vol.json' },
  { w: 390, h: 844, cartella: 'vol-m', json: 'vol-m.json' },
]
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')
const SCALA = 2 // px della tela per px CSS (1 px CSS = 1 unità della parete a 1440): sullo schermo i fogli sono ~200-250 px, con le mipmap bastano
const MARGINE = 0.08 // del lato del foglio, per lato

const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript', '.css': 'text/css' }
const puppeteer = browser.puppeteer()
const server = createServer(async (req, res) => {
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })

for (const vista of VISTE) {
const OUT = join(ROOT, 'art/scena', vista.cartella)
await mkdir(OUT, { recursive: true })
for (const f of await readdir(OUT)) await rm(join(OUT, f))
const manifesto = {}

// (?muro=1: la pagina senza la scena 3D, che sposterebbe il muro e cambierebbe le misure dei fogli)
for (const pagina of ['/?ora=12:00&muro=1', '/404.html?ora=12:00&muro=1', '/storia/?ora=12:00&muro=1']) {
  const page = await aperto.newPage()
  await page.setViewport({ width: vista.w, height: vista.h, deviceScaleFactor: SCALA })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(base + pagina, { waitUntil: 'networkidle0' })
  await page.evaluate(async () => {
    document.querySelector('.auguri')?.remove()
    for (const i of document.querySelectorAll('img[loading=lazy]')) i.loading = 'eager'
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))))
    await document.fonts.ready
    // la pagina spoglia: solo il volantino scelto, senza ombre né rotazione, su trasparente
    const s = document.createElement('style')
    s.textContent = `html,body,.strada,.muro{background:none!important}.muro{box-shadow:none!important}.muro::before,.muro::after,.buio,.fari,.freni,.neonauto,.portale,.goccia,.spruzzo,.formica,.mosca{display:none!important}
      .it{visibility:hidden}.it.scatto{visibility:visible;filter:none!important;transform:none!important;z-index:99!important}.it.scatto *{transition:none!important}`
    document.head.appendChild(s)
  })
  const vols = await page.$$('.parete .vol, .parete .it.foto')
  for (const vol of vols) {
    const info = await vol.evaluate((el, SCALA, MARGINE) => {
      for (const x of document.querySelectorAll('.it.scatto')) x.classList.remove('scatto')
      el.classList.add('scatto')
      el.scrollIntoView({ block: 'center' })
      const r = el.getBoundingClientRect()
      const m = r.width * MARGINE
      // il ritaglio è in coordinate di pagina (il foglio è nella finestra: scrollIntoView)
      const clip = { x: r.left + scrollX - m, y: r.top + scrollY - m, width: r.width + 2 * m, height: r.height + 2 * m }
      const chiave = el.id || (el.querySelector('h3, .titolo')?.textContent ?? 'foglio')
      const nome = chiave.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const tag = el.querySelector('.tagliandi'), live = el.querySelector('.live-foto')
      const rel = (b) => ({ x: Math.round((b.left + scrollX - clip.x) * SCALA), y: Math.round((b.top + scrollY - clip.y) * SCALA), w: Math.round(b.width * SCALA), h: Math.round(b.height * SCALA) })
      return {
        nome, clip, cw: r.width,
        fascia: tag ? rel(tag.getBoundingClientRect()) : null,
        tagliandi: tag ? [...tag.querySelectorAll('button')].map((b) => rel(b.getBoundingClientRect())) : null,
        live: live ? rel(live.getBoundingClientRect()) : null,
      }
    }, SCALA, MARGINE)
    if (manifesto[info.nome]) throw new Error(`due fogli si chiamano «${info.nome}» (${pagina}): la scena non saprebbe quale foto usare`)
    const png = await page.screenshot({ clip: info.clip, omitBackground: true, captureBeyondViewport: false })
    const img = sharp(png)
    const meta = await img.metadata()
    await img.webp({ quality: 84, alphaQuality: 88 }).toFile(join(OUT, `${info.nome}.webp`))
    if (info.fascia) {
      const f = info.fascia
      const buco = { create: { width: f.w, height: f.h + 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }
      await sharp(png).composite([{ input: await sharp(buco).png().toBuffer(), left: f.x, top: f.y - 1, blend: 'dest-out' }]).webp({ quality: 84, alphaQuality: 88 }).toFile(join(OUT, `${info.nome}-senza.webp`))
    }
    manifesto[info.nome] = { w: meta.width, h: meta.height, m: Math.round(info.clip.width * MARGINE / (1 + 2 * MARGINE) * SCALA), cw: Math.round(info.cw * 100) / 100, scala: SCALA, tagliandi: info.tagliandi, ...(info.live ? { live: info.live } : {}) }
    console.log(`${info.nome}: ${meta.width}×${meta.height}${info.tagliandi ? ` (${info.tagliandi.length} tagliandi)` : ''}${info.live ? ' (live photo)' : ''}`)
  }
  await page.close()
}
await writeFile(join(ROOT, 'art/scena', vista.json), JSON.stringify(manifesto, null, 1))
console.log(`scritti ${Object.keys(manifesto).length} volantini in ${OUT} e ${vista.json}`)
}
await aperto.close()
// le anteprime (128 px) di queste foto, che la scena mette subito mentre arrivano quelle vere
await (await import('./anteprime.mjs')).anteprime()
server.close()
