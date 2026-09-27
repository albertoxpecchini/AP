#!/usr/bin/env node
// Compone gli annunci di «Better Call Pekko» a strati — sfondo, ritagli di
// Alberto, oggetti, testo Impact 3D — e li rende come immagini del 2008:
// JPEG con i suoi artefatti per i banner fissi, GIF a pochi fotogrammi per
// quelli che «lampeggiano». Ogni fotogramma è una pagina HTML (annunci.js)
// fotografata da Edge o Chromium headless alla misura esatta, poi ffmpeg.
//
//   node tools/assistenza/rendi.mjs tutti            # tutti gli annunci con gli ingredienti pronti
//   node tools/assistenza/rendi.mjs header fashion   # solo questi
//   node tools/assistenza/rendi.mjs lista            # nomi, misure e ingredienti mancanti
//   node tools/assistenza/rendi.mjs tutti --html     # scrive solo gli HTML dei fotogrammi (per guardarli)
//
// Gli ingredienti stanno in tools/assistenza/lavoro/scelte/<nome>.png (scritti da
// spot.mjs «ritaglia» e «usa»); un annuncio con un ingrediente mancante viene saltato.
// Uscita in public/media/assistenza/ad-<nome>.jpg|gif, misure nel manifest.

import { writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { ROOT, die } from '../replicate.mjs'
import { aggiornaManifest } from './spot.mjs'
import { annunci, CSS, SCELTE_DIR } from './annunci.js'

const LAVORO = join(ROOT, 'tools/assistenza/lavoro/annunci')
const OUT = join(ROOT, 'public/media/assistenza')
const WEB = '/media/assistenza'

const BROWSERS = [
  process.env.CHROME,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean)
const browser = () => BROWSERS.find((b) => existsSync(b)) || die('nessun browser headless: imposta CHROME=<percorso di msedge.exe o chrome.exe>')

const args = process.argv.slice(2)
const soloHtml = args.includes('--html')
const nomi = args.filter((a) => !a.startsWith('--'))

const mancanti = (a) => (a.richiede || []).filter((n) => !existsSync(join(SCELTE_DIR, `${n}.png`)))

const pagina = (a, corpo) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}\nbody{width:${a.w}px;height:${a.h}px}</style></head><body>${corpo}</body></html>`

function fotografa(html, png, w, h) {
  const profilo = join(LAVORO, '_profilo')
  execFileSync(
    browser(),
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profilo}`, '--force-device-scale-factor=1', `--window-size=${w},${h}`, '--virtual-time-budget=4000', `--screenshot=${png}`, `file:///${html.replaceAll('\\', '/')}`],
    { stdio: 'ignore', timeout: 60000 },
  )
  if (!existsSync(png)) die(`screenshot non scritto: ${png}`)
}

async function rendi(nome) {
  const a = annunci[nome] || die(`nessun annuncio «${nome}». Disponibili: ${Object.keys(annunci).join(', ')}`)
  const manca = mancanti(a)
  if (manca.length) {
    console.warn(`  ! ${nome}: mancano ${manca.join(', ')}, salto`)
    return false
  }
  const dir = join(LAVORO, nome)
  await mkdir(dir, { recursive: true })
  await mkdir(OUT, { recursive: true })
  const frames = typeof a.frames === 'function' ? a.frames() : a.frames
  const pngs = []
  for (const [i, corpo] of frames.entries()) {
    const n = String(i + 1).padStart(2, '0')
    const html = join(dir, `f${n}.html`)
    const png = join(dir, `f${n}.png`)
    await writeFile(html, pagina(a, corpo))
    if (soloHtml) continue
    fotografa(html, png, a.w, a.h)
    pngs.push(png)
  }
  if (soloHtml) {
    console.log(`  · ${nome}: ${frames.length} HTML in ${dir}`)
    return true
  }
  let out
  if (frames.length > 1) {
    out = join(OUT, `ad-${nome}.gif`)
    const vf = `split[a][b];[a]palettegen=max_colors=${a.colori || 128}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(a.fps || 1), '-i', join(dir, 'f%02d.png'), '-vf', vf, '-loop', '0', out])
  } else {
    out = join(OUT, `ad-${nome}.jpg`)
    // mjpeg: q:v 2 = quasi perfetto, 8 = molto compresso; il 2008 sta intorno a 5
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', pngs[0], '-q:v', String(a.q || 5), '-pix_fmt', 'yuvj420p', out])
  }
  console.log(`  ✓ ad-${nome}.${frames.length > 1 ? 'gif' : 'jpg'} ${a.w} × ${a.h}${frames.length > 1 ? `, ${frames.length} fotogrammi` : ''}`)
  await aggiornaManifest({ [`ad-${nome}`]: { w: a.w, h: a.h, src: `${WEB}/ad-${nome}.${frames.length > 1 ? 'gif' : 'jpg'}` } })
  return true
}

if (!nomi.length || nomi[0] === 'lista') {
  const pronti = existsSync(SCELTE_DIR) ? new Set((await readdir(SCELTE_DIR)).map((f) => f.replace(/\.png$/, ''))) : new Set()
  for (const [nome, a] of Object.entries(annunci)) {
    const manca = (a.richiede || []).filter((n) => !pronti.has(n))
    console.log(`${nome.padEnd(14)} ${String(a.w).padStart(4)} × ${String(a.h).padEnd(4)} ${typeof a.frames === 'function' ? a.frames().length : a.frames.length} fotogr. ${manca.length ? '— mancano: ' + manca.join(', ') : '— pronto'}`)
  }
} else {
  const lista = nomi[0] === 'tutti' ? Object.keys(annunci) : nomi
  let fatti = 0
  for (const n of lista) if (await rendi(n)) fatti++
  console.log(`${fatti}/${lista.length} annunci`)
}
