#!/usr/bin/env node
// Copertine dei progetti con openai/gpt-image-2 su Replicate, sempre in qualità high.
//
//   node tools/copertine/genera.mjs <slug|tutte> [--n 2]
//       disegna le candidate in tools/copertine/lavoro/<slug>/ (PNG + JSON col prompt)
//   node tools/copertine/genera.mjs usa <slug> <file.png>
//       la candidata scelta diventa public/media/progetti/<slug>/copertina.webp
//   node tools/copertine/genera.mjs recupera <slug> <id-predizione>
//       scarica le immagini di una predizione già pagata (se il controllo si è interrotto)
//   node tools/copertine/genera.mjs schema
//       stampa gli input che il modello accetta oggi
//
//   node tools/copertine/genera.mjs vista <slug|tutte> [nome…]
//       disegna le viste della galleria (una per nome, 2048 × 1152) in lavoro/<slug>/<nome>/
//   node tools/copertine/genera.mjs usa-vista <slug> <nome> <file.png>
//       la vista scelta diventa public/media/progetti/<slug>/<nome>.webp (+ -full.webp per il lightbox)
//   node tools/copertine/genera.mjs recupera-vista <slug> <nome> <id-predizione>
//
// Token e chiamate: tools/replicate.mjs.

import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { ROOT, die, upload, predict, prediction, salva, inputSchema, printSchema } from '../replicate.mjs'
import { STILE, STILI, copertine, viste } from './copertine.js'

const LAVORO = join(ROOT, 'tools/copertine/lavoro')

const args = process.argv.slice(2)
const nIndex = args.indexOf('--n')
const n = nIndex === -1 ? 2 : Number(args[nIndex + 1])
const positional = args.filter((a, i) => !a.startsWith('--') && (nIndex === -1 || i !== nIndex + 1))

async function genera(slug) {
  const c = copertine[slug]
  if (!c) die(`nessuna copertina per «${slug}». Disponibili: ${Object.keys(copertine).join(', ')}`)
  console.log(`→ ${slug}: carico ${c.riferimenti.length} tavole di riferimento`)
  const refs = []
  for (const f of c.riferimenti) refs.push(await upload(f))
  console.log(`→ ${slug}: ${n} × qualità high, attendo il modello…`)
  const input = {
    prompt: `${c.soggetto}\n\n${STILE}`,
    ...(refs.length && { input_images: refs }),
    aspect_ratio: '3:2',
    quality: 'high',
    number_of_images: n,
    output_format: 'png',
    background: 'opaque',
  }
  const p = await predict(input, `node tools/copertine/genera.mjs recupera ${slug}`)
  await salva(p, join(LAVORO, slug), { riferimenti: c.riferimenti })
}

const vistaDi = (slug, nome) => viste[slug]?.find((v) => v.nome === nome) || die(`nessuna vista «${nome}» per «${slug}»`)

// Una vista della galleria: una sola immagine per volta, 16:9 alla misura più
// grande che il modello regge bene. Si rifà solo quella che non convince.
async function vista(slug, nome) {
  const v = vistaDi(slug, nome)
  const refs = []
  for (const f of v.riferimenti) refs.push(await upload(f))
  console.log(`→ ${slug} ${nome} (${v.stile}, ${refs.length} riferimenti): qualità high, 2048 × 1152, attendo il modello…`)
  const input = {
    prompt: `${v.soggetto}\n\n${STILI[v.stile]}`,
    ...(refs.length && { input_images: refs }),
    aspect_ratio: '2048x1152',
    quality: 'high',
    number_of_images: 1,
    output_format: 'png',
    background: 'opaque',
  }
  const p = await predict(input, `node tools/copertine/genera.mjs recupera-vista ${slug} ${nome}`)
  await salva(p, join(LAVORO, slug, nome), { riferimenti: v.riferimenti })
}

// La candidata scelta → WebP nella cartella del progetto.
// Il modello riempie quasi tutta la larghezza anche quando gli si chiede margine,
// e le copertine si ritagliano a 4:3 (card) e a 16:9 (case study): la tela si
// allarga di un ottavo per lato con il colore della carta (la mediana dei bordi,
// con un filo di grana) e l'originale sfuma nella carta negli ultimi FEATHER px,
// così il disegno resta intero in ogni ritaglio e non si vede la giunta. Tutta
// l'immagine si bilancia poi perché la carta diventi esattamente --c-paper del
// sito: la copertina si fonde con la pagina invece di staccarsi come un riquadro.
const FEATHER = 32
const PAPER = [0xf3, 0xf1, 0xec] // --c-paper in src/styles/tokens.css

// Senza margine (le viste `scena`, piene fino al bordo) l'immagine resta com'è:
// niente carta intorno e niente bilanciamento, perché il bordo non è carta.
async function tela(file, { margine = true } = {}) {
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const head = await readFile(src) // intestazione PNG: larghezza e altezza nel blocco IHDR
  const [iw, ih] = [head.readUInt32BE(16), head.readUInt32BE(20)]
  const img = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
  const at = (x, y) => (y * iw + x) * 3
  if (!margine) return { w: iw, h: ih, raw: img }

  const border = [[], [], []]
  for (let x = 0; x < iw; x += 2) for (const y of [0, 4, ih - 5, ih - 1]) for (let k = 0; k < 3; k++) border[k].push(img[at(x, y) + k])
  for (let y = 0; y < ih; y += 2) for (const x of [0, 4, iw - 5, iw - 1]) for (let k = 0; k < 3; k++) border[k].push(img[at(x, y) + k])
  const paper = border.map((v) => v.sort((a, b) => a - b)[v.length >> 1])
  const gain = PAPER.map((t, k) => t / paper[k])

  const [px, py] = [Math.round(iw / 8), Math.round(ih / 8)]
  const [w, h] = [iw + 2 * px, ih + 2 * py]
  const tela = Buffer.alloc(w * h * 3)
  const smooth = (t) => t * t * (3 - 2 * t)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 3
      const grain = (Math.random() - 0.5) * 4
      const [ox, oy] = [x - px, y - py]
      const inside = ox >= 0 && oy >= 0 && ox < iw && oy < ih
      const a = inside ? smooth(Math.min(1, Math.min(ox, oy, iw - 1 - ox, ih - 1 - oy) / FEATHER)) : 0
      for (let k = 0; k < 3; k++) tela[o + k] = Math.min(255, Math.round((PAPER[k] + grain) * (1 - a) + (inside ? img[at(ox, oy) + k] * gain[k] : 0) * a))
    }
  }
  return { w, h, raw: tela }
}

// La tela → WebP; `width` la riduce (in pagina), senza resta intera (lightbox).
function webp({ w, h, raw }, out, width) {
  const scale = width && width < w ? ['-vf', `scale=${width}:-2:flags=lanczos`] : []
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', ...scale, '-c:v', 'libwebp', '-quality', '84', '-compression_level', '6', '-map_metadata', '-1', out], { input: raw })
  console.log(`✓ ${out}`)
}

async function usa(slug, file) {
  if (!copertine[slug]) die(`nessuna copertina per «${slug}»`)
  const outDir = join(ROOT, 'public/media/progetti', slug)
  await mkdir(outDir, { recursive: true })
  const t = await tela(file)
  webp(t, join(outDir, 'copertina.webp'))
  console.log(`  in projects.js: cover: drawnCover('${slug}', '…') — ${t.w}×${t.h}`)
  console.log(`  alt suggerito: ${copertine[slug].alt}`)
}

// Le viste: 1600 px di larghezza in pagina, l'originale (con il margine di carta
// e la carta portata a --c-paper per `blocco` e `oggetti`) per il lightbox.
async function usaVista(slug, nome, file) {
  const v = vistaDi(slug, nome)
  const outDir = join(ROOT, 'public/media/progetti', slug)
  await mkdir(outDir, { recursive: true })
  const t = await tela(file, { margine: v.stile !== 'scena' })
  webp(t, join(outDir, `${nome}.webp`), 1600)
  webp(t, join(outDir, `${nome}-full.webp`))
  console.log(`  in projects.js: drawnView('${slug}', '${nome.replace('vista-', '')}', '…', '${v.didascalia}') — originale ${t.w}×${t.h}`)
}

const [cmd, ...rest] = positional
if (!cmd) die('uso: genera.mjs <slug|tutte> [--n 2] · usa <slug> <file> · recupera <slug> <id> · vista <slug|tutte> [nome…] · usa-vista <slug> <nome> <file> · recupera-vista <slug> <nome> <id> · schema')

if (cmd === 'schema') {
  printSchema(await inputSchema())
} else if (cmd === 'recupera') {
  const [slug, id] = rest
  if (!copertine[slug] || !id) die('uso: genera.mjs recupera <slug> <id-predizione>')
  await salva(await prediction(id), join(LAVORO, slug), { riferimenti: copertine[slug].riferimenti })
} else if (cmd === 'usa') {
  await usa(rest[0], rest[1])
} else if (cmd === 'vista') {
  const [slug, ...nomi] = rest
  for (const s of slug === 'tutte' ? Object.keys(viste) : [slug]) {
    if (!viste[s]) die(`nessuna vista per «${s}». Disponibili: ${Object.keys(viste).join(', ')}`)
    for (const nome of nomi.length ? nomi : viste[s].map((v) => v.nome)) await vista(s, nome)
  }
} else if (cmd === 'usa-vista') {
  await usaVista(rest[0], rest[1], rest[2])
} else if (cmd === 'recupera-vista') {
  const [slug, nome, id] = rest
  if (!id) die('uso: genera.mjs recupera-vista <slug> <nome> <id-predizione>')
  await salva(await prediction(id), join(LAVORO, slug, nome), { riferimenti: vistaDi(slug, nome).riferimenti })
} else {
  for (const slug of cmd === 'tutte' ? Object.keys(copertine) : [cmd]) await genera(slug)
}
