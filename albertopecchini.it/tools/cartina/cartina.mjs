#!/usr/bin/env node
// La carta dell'area operativa (/contatti/, FIG. 01) con openai/gpt-image-2 su Replicate.
//
//   node tools/cartina/cartina.mjs genera [--n 2]
//       disegna le candidate in tools/cartina/lavoro/ (PNG 1536 × 1152, qualità high)
//   node tools/cartina/cartina.mjs usa <file.png>
//       la candidata scelta diventa public/media/mappa/area-operativa.webp
//   node tools/cartina/cartina.mjs recupera <id-predizione>
//       scarica una predizione già pagata (se l'attesa si è interrotta)
//
// Il modello disegna solo il fondo illustrato: acque, rilievi, campi. Come
// riferimento riceve lago e fiumi resi da areamap({ solo: 'acque' }) in
// src/art/misc.js, con la stessa proiezione e la stessa scala della carta, così
// li ridisegna al posto giusto. Reticolo, raggi, città, scritte, nord e scala
// grafica li aggiunge poi areamap({ base }) in vettoriale: restano esatti.

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ROOT, die, upload, predict, prediction, salva } from '../replicate.mjs'

const LAVORO = join(ROOT, 'tools/cartina/lavoro')
const OUT = join(ROOT, 'public/media/mappa/area-operativa.webp')
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const [W, H] = [1536, 1152] // il 4:3 più grande di gpt-image-2, come la carta (1200 × 900)
const PAPER = [0xf3, 0xf1, 0xec] // --c-paper in src/styles/tokens.css

const PROMPT = `Turn the attached reference into a finished illustrated map, keeping its geometry exactly: same framing, Lake Garda in the same place at the top left, every river on exactly the same path. The thick river crossing the lower part is the Po; the Mincio flows from the southern tip of Lake Garda down to the three small lakes at the exact centre of the image, which surround the city of Mantua, and then on to the Po; the Oglio is on the left, the Adige on the right. The three small lakes must stay exactly at the centre.
Style: a hand-drawn cartographic illustration on warm off-white paper (#f3f1ec), with fine ink lines and flat, very light watercolour washes, like a precise nineteenth-century survey map redrawn by a contemporary architect. Water in pale blue-grey with fine ink shorelines and a few parallel ripple lines on Lake Garda. The morainic hills south of Lake Garda and the pre-Alpine relief to the north drawn with delicate hachures in warm grey. The Po plain as a faint patchwork of fields in pale sage and paper tones, with thin rows of trees and small canals. No towns or buildings.
Keep everything light and low in contrast, because dark text, dashed circles and a coordinate grid will be printed on top later: leave the image completely free of text, labels, letters, numbers, symbols, compass rose, scale bar, circles, grid lines, legend, border or frame. No red or orange anywhere. Straight top-down view, no perspective, no paper edges or shadows: the map fills the whole image edge to edge.`

async function riferimento() {
  const { areamap } = await import(pathToFileURL(join(ROOT, 'src/art/misc.js')).href)
  // le classi dell'SVG, rese esplicite: acqua in azzurro, fiumi più spessi perché il modello li veda
  const css = `html,body{margin:0;background:#fff}svg{display:block;width:${W}px;height:${H}px}.a-bg{fill:#fff}
    path{fill:none;stroke:#3b7ea8;stroke-linecap:round;stroke-linejoin:round}
    .a-s{stroke-width:4px!important}.a-s2{stroke-width:2.6px!important}.a-soft2,.a-soft2.a-s{fill:#9ec3d6}`
  await mkdir(LAVORO, { recursive: true })
  const html = join(LAVORO, 'riferimento.html')
  const png = join(LAVORO, 'riferimento.png')
  await writeFile(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${areamap({ solo: 'acque' })}</body></html>`)
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${W},${H}`, `--screenshot=${png}`, pathToFileURL(html).href], { stdio: 'ignore' })
  if (!existsSync(png)) die('Edge non ha scritto il riferimento')
  console.log(`→ riferimento: ${png}`)
  return png
}

async function genera(n) {
  const ref = await riferimento()
  console.log(`→ ${n} × qualità high, ${W} × ${H}, attendo il modello…`)
  const input = {
    prompt: PROMPT,
    input_images: [await upload(ref)],
    aspect_ratio: `${W}x${H}`,
    quality: 'high',
    number_of_images: n,
    output_format: 'png',
    background: 'opaque',
  }
  const p = await predict(input, 'node tools/cartina/cartina.mjs recupera')
  await salva(p, LAVORO, { riferimento: 'areamap({ solo: "acque" })' })
}

// La candidata scelta → WebP. Si bilancia il colore perché la carta (la mediana
// dei pixel più chiari) sia esattamente --c-paper, come per le copertine.
async function usa(file) {
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const size = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim().split(',').map(Number)
  const [w, h] = size
  const img = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
  const lum = []
  for (let i = 0; i < img.length; i += 3 * 7) lum.push([0.2126 * img[i] + 0.7152 * img[i + 1] + 0.0722 * img[i + 2], i])
  lum.sort((a, b) => b[0] - a[0])
  const chiari = lum.slice(0, Math.round(lum.length * 0.15)) // il 15% più chiaro: la carta
  const paper = [0, 1, 2].map((k) => {
    const v = chiari.map(([, i]) => img[i + k]).sort((a, b) => a - b)
    return v[v.length >> 1]
  })
  const gain = PAPER.map((t, k) => t / paper[k])
  for (let i = 0; i < img.length; i += 3) for (let k = 0; k < 3; k++) img[i + k] = Math.min(255, Math.round(img[i + k] * gain[k]))
  await mkdir(join(ROOT, 'public/media/mappa'), { recursive: true })
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', '-c:v', 'libwebp', '-quality', '86', '-compression_level', '6', '-map_metadata', '-1', OUT], { input: img })
  console.log(`✓ ${OUT} (${w} × ${h}, carta rgb(${paper}) → #f3f1ec)`)
}

const args = process.argv.slice(2)
const nIndex = args.indexOf('--n')
const [cmd, arg] = args.filter((a, i) => !a.startsWith('--') && (nIndex === -1 || i !== nIndex + 1))
if (cmd === 'genera') await genera(nIndex === -1 ? 2 : Number(args[nIndex + 1]))
else if (cmd === 'usa' && arg) await usa(arg)
else if (cmd === 'recupera' && arg) await salva(await prediction(arg), LAVORO, { riferimento: 'areamap({ solo: "acque" })' })
else die('uso: cartina.mjs genera [--n 2] · usa <file.png> · recupera <id>')
