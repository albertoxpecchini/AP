#!/usr/bin/env node
// Rende gli annunci disegnati nel canvas di Claude Design «Better Call Pekko —
// banner» (https://claude.ai/artifact/EqJtdNAsANcHWZd8cLVBck) come immagini del
// sito. Il canvas è la fonte: ogni artboard è un file .dc.html in
// tools/assistenza/design/project/, vettoriale, con i font veri (Google Fonts) e
// le immagini caricate nel canvas come /_blob/<id>; design/assets.json dice da
// quale file locale viene ogni /_blob/.
//
// Dentro un artboard, ogni elemento con data-out="<nome>" diventa un'immagine:
//   data-frames="4" data-period="8000"  GIF: 4 fotogrammi presi a metà di ogni
//                                       quarto di un ciclo di 8 s delle animazioni
//                                       CSS dell'artboard (le stesse che il canvas
//                                       mostra in movimento)
//   data-format="jpg|png|gif"           di norma gif se ci sono fotogrammi, sennò jpg
//   data-scale="2"                      densità: 2 per i fissi (testo nitido sugli
//                                       schermi di oggi), 1 per le GIF (come nel 2008)
//   data-q="3"                          qualità JPEG di ffmpeg (2 ottima … 8 da 2008)
//
//   node tools/assistenza/design.mjs lista             # artboard e uscite
//   node tools/assistenza/design.mjs tutti             # rende tutto in public/media/assistenza/
//   node tools/assistenza/design.mjs ad-web-header     # solo queste uscite
//   node tools/assistenza/design.mjs tutti --prova     # solo i PNG dei fotogrammi in lavoro/design/
//
// Usa puppeteer-core di tools/catture (npm install lì) e ffmpeg nel PATH.
// Se l'artboard è stato modificato a mano nel canvas, prima si rilegge dal
// canvas e si aggiorna il file in design/project/ (lo fa Claude con lo strumento
// Artifact, azione read), poi si rende.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { ROOT, die } from '../replicate.mjs'
import { aggiornaManifest } from './spot.mjs'

const DESIGN = join(ROOT, 'tools/assistenza/design')
const PROJECT = join(DESIGN, 'project')
const LAVORO = join(ROOT, 'tools/assistenza/lavoro/design')
const OUT = join(ROOT, 'public/media/assistenza')
const WEB = '/media/assistenza'

const BROWSERS = [
  process.env.CHROME,
  `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean)

const args = process.argv.slice(2)
const prova = args.includes('--prova')
const nomi = args.filter((a) => !a.startsWith('--'))

async function puppeteer() {
  const pkg = join(ROOT, 'tools/catture/package.json')
  let path
  try {
    path = createRequire(pkg).resolve('puppeteer-core')
  } catch {
    die('manca puppeteer-core: cd tools/catture && npm install')
  }
  const mod = await import(pathToFileURL(path).href)
  return mod.default?.launch ? mod.default : mod.default.default
}

/** Un artboard .dc.html diventa una pagina semplice: il contenuto di <helmet> nel
 *  <head>, il resto di <x-dc> nel <body>, i /_blob/ sostituiti coi file locali. */
function pagina(src, assets, file) {
  const helmet = src.match(/<helmet>([\s\S]*?)<\/helmet>/)?.[1] ?? ''
  const corpo = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)?.[1] ?? src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1]
  if (!corpo) die(`${file}: niente <x-dc>`)
  if (/\{\{/.test(corpo)) console.warn(`  ! ${file}: contiene {{…}}: qui non si interpretano, restano come testo`)
  const sostituisci = (s) =>
    s.replace(/\/_blob\/[0-9a-f]{32}/g, (b) => {
      if (!assets[b]) die(`${file}: ${b} non è in design/assets.json`)
      const p = join(ROOT, assets[b])
      if (!existsSync(p)) die(`${file}: ${assets[b]} non esiste`)
      return pathToFileURL(p).href
    })
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${sostituisci(helmet)}<style>html,body{margin:0;padding:0}</style></head><body>${sostituisci(corpo)}</body></html>`
}

async function artboards() {
  const assets = JSON.parse(await readFile(join(DESIGN, 'assets.json'), 'utf8'))
  const files = (await readdir(PROJECT)).filter((f) => f.endsWith('.dc.html'))
  const lista = []
  for (const f of files) {
    const src = await readFile(join(PROJECT, f), 'utf8')
    const uscite = [...src.matchAll(/data-out="([a-z0-9-]+)"/g)].map((m) => m[1])
    lista.push({ file: f, html: pagina(src, assets, f), uscite })
  }
  return lista
}

async function rendi(board, browser, scelte) {
  const uscite = board.uscite.filter((n) => !scelte || scelte.has(n))
  if (!uscite.length) return 0
  await mkdir(LAVORO, { recursive: true })
  const html = join(LAVORO, board.file.replace(/\.dc\.html$/, '.html'))
  await writeFile(html, board.html)
  const page = await browser.newPage()
  let fatti = 0
  for (const nome of uscite) {
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 })
    const info0 = await (async () => {
      await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle0', timeout: 60000 })
      await page.evaluate(() => document.fonts.ready)
      return page.evaluate((n) => {
        const el = document.querySelector(`[data-out="${n}"]`)
        const d = el.dataset
        const r = el.getBoundingClientRect()
        return { w: Math.round(r.width), h: Math.round(r.height), frames: +(d.frames || 1), period: +(d.period || 0), format: d.format || '', scale: +(d.scale || 0), q: +(d.q || 0) }
      }, nome)
    })()
    const { w, h, frames, period } = info0
    const format = info0.format || (frames > 1 ? 'gif' : 'jpg')
    const scale = info0.scale || (format === 'gif' ? 1 : 2)
    // Il layout a densità diversa: si ricarica con la scala giusta.
    await page.setViewport({ width: Math.max(1600, w + 40), height: Math.max(1200, h + 40), deviceScaleFactor: scale })
    await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle0', timeout: 60000 })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))))
    const dir = join(LAVORO, nome)
    await mkdir(dir, { recursive: true })
    const pngs = []
    for (let i = 0; i < frames; i++) {
      const t = period ? ((i + 0.5) * period) / frames : 0
      await page.evaluate((t) => {
        for (const a of document.getAnimations()) {
          a.pause()
          a.currentTime = t
        }
      }, t)
      const clip = await page.evaluate((n) => {
        const r = document.querySelector(`[data-out="${n}"]`).getBoundingClientRect()
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }
      }, nome)
      const png = join(dir, `f${String(i + 1).padStart(2, '0')}.png`)
      await page.screenshot({ path: png, clip })
      pngs.push(png)
    }
    if (prova) {
      console.log(`  · ${nome}: ${frames} PNG in ${dir}`)
      fatti++
      continue
    }
    await mkdir(OUT, { recursive: true })
    const out = join(OUT, `${nome}.${format}`)
    if (format === 'gif') {
      const vf = `split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String((frames * 1000) / (period || frames * 1000)), '-i', join(dir, 'f%02d.png'), '-vf', vf, '-loop', '0', out])
    } else if (format === 'jpg') {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', pngs[0], '-q:v', String(info0.q || 3), '-pix_fmt', 'yuvj420p', out])
    } else {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', pngs[0], '-compression_level', '9', out])
    }
    console.log(`  ✓ ${nome}.${format} ${w} × ${h}${scale > 1 ? ` @${scale}x` : ''}${frames > 1 ? `, ${frames} fotogrammi` : ''}`)
    await aggiornaManifest({ [nome]: { w, h, src: `${WEB}/${nome}.${format}` } })
    fatti++
  }
  await page.close()
  return fatti
}

const lista = await artboards()
if (!nomi.length || nomi[0] === 'lista') {
  for (const b of lista) console.log(`${b.file.padEnd(24)} ${b.uscite.join(', ') || '(nessuna uscita)'}`)
} else {
  const scelte = nomi[0] === 'tutti' ? null : new Set(nomi)
  const exe = BROWSERS.find((b) => existsSync(b)) || die('nessun browser: imposta CHROME=<percorso>')
  const browser = await (await puppeteer()).launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--allow-file-access-from-files'] })
  let fatti = 0
  try {
    for (const b of lista) fatti += await rendi(b, browser, scelte)
  } finally {
    await browser.close()
  }
  console.log(`${fatti} immagini`)
}
