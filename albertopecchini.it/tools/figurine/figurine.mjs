#!/usr/bin/env node
// Figurine del sito con openai/gpt-image-2 su Replicate: un'immagine, nove figurine.
//
//   node tools/figurine/figurine.mjs genera <foglio|tutti>
//       disegna il foglio (2048 × 2048, qualità high, fondo trasparente) in tools/figurine/lavoro/<foglio>/
//   node tools/figurine/figurine.mjs ritaglia <foglio> <file.png>
//       ritaglia le nove figurine in public/media/figurine/<nome>.webp e aggiorna src/data/figurine.js
//   node tools/figurine/figurine.mjs recupera <foglio> <id-predizione>
//       scarica un foglio già pagato (se l'attesa si è interrotta)
//
// I fogli e i prompt stanno in fogli.js; token e chiamate in tools/replicate.mjs.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ROOT, die, predict, prediction, salva } from '../replicate.mjs'
import { STILE, fogli } from './fogli.js'

const LAVORO = join(ROOT, 'tools/figurine/lavoro')
// FIGURINE_PROVA=<cartella> scrive ritagli e manifest lì invece che nel sito (per provare il ritaglio)
const PROVA = process.env.FIGURINE_PROVA
const OUT = PROVA ? resolve(PROVA) : join(ROOT, 'public/media/figurine')
const MANIFEST = PROVA ? join(resolve(PROVA), 'figurine.js') : join(ROOT, 'src/data/figurine.js')
const GRID = 3
const MAX = 440 // lato lungo massimo: basta per 220 px CSS su schermi 2x (la più grande, la 404, arriva a 240); un foglio può alzarlo con `max`

const foglio = (nome) => fogli[nome] || die(`nessun foglio «${nome}». Disponibili: ${Object.keys(fogli).join(', ')}`)

async function genera(nome) {
  const f = foglio(nome)
  const elenco = f.figurine.map((x, i) => `${i + 1}. ${x.soggetto}.`).join('\n')
  const input = {
    // un foglio può avere uno stile e un'introduzione propri (i tasti)
    prompt: `${f.stile || STILE}\n\n${f.intro || 'The nine figurine, row by row, left to right:'}\n${elenco}`,
    aspect_ratio: '2048x2048',
    quality: 'high',
    number_of_images: 1,
    output_format: 'png',
    background: 'transparent',
  }
  console.log(`→ ${nome}: ${f.titolo} — qualità high, 2048 × 2048, attendo il modello…`)
  const p = await predict(input, `node tools/figurine/figurine.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { foglio: nome })
}

// ── Ritaglio ─────────────────────────────────────────────────────────────────
// Le figurine si separano dalla trasparenza: la maschera (alpha > SOGLIA) si
// riduce a blocchi di B px, i blocchi si raggruppano in componenti connesse e
// ogni componente va alla cella della griglia in cui cade il suo baricentro
// (così un pezzo staccato, un raggio di sole o una graffetta, resta con la sua
// figurina). Le briciole sotto MIN blocchi si scartano. Se il modello ha
// restituito un fondo pieno, prima lo si toglie riempiendo dai bordi.
const SOGLIA = 24
const B = 4
const MIN = 16

// gpt-image-2 lascia le figurine a alpha ~253 (non del tutto opache) e un alone
// quasi invisibile (alpha 1–15) intorno: sul fondo scuro si vedrebbe. Si pulisce
// tutto il sotto 16 e si rende pieno il sopra 240; il bordo antialias resta.
const alfa = (a) => (a < 16 ? 0 : a >= 240 ? 255 : a)

function scontorna(px, w, h) {
  let opaque = true
  for (let i = 3; i < px.length; i += 4 * 97) if (px[i] < 250) { opaque = false; break }
  if (!opaque) return 'trasparente'
  const bg = [0, 1, 2].map((k) => Math.round((px[k] + px[(w - 1) * 4 + k] + px[(h - 1) * w * 4 + k] + px[(h * w - 1) * 4 + k]) / 4))
  const near = (i) => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) < 30
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p] || !near(p * 4)) continue
    seen[p] = 1
    px[p * 4 + 3] = 0
    const x = p % w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (p >= w) stack.push(p - w)
    if (p < w * (h - 1)) stack.push(p + w)
  }
  return `fondo pieno rgb(${bg}) tolto dai bordi`
}

async function ritaglia(nome, file) {
  const f = foglio(nome)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim()
  const [w, h] = probe.split(',').map(Number)
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 })
  console.log(`→ ${nome}: ${w} × ${h}, ${scontorna(px, w, h)}`)

  // maschera a blocchi e componenti connesse (8 vicini)
  const [bw, bh] = [Math.ceil(w / B), Math.ceil(h / B)]
  const mask = new Uint8Array(bw * bh)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > SOGLIA) mask[((y / B) | 0) * bw + ((x / B) | 0)] = 1
  const label = new Int32Array(bw * bh).fill(-1)
  const comps = []
  for (let s = 0; s < bw * bh; s++) {
    if (!mask[s] || label[s] !== -1) continue
    const c = { n: 0, sx: 0, sy: 0, x0: bw, y0: bh, x1: 0, y1: 0 }
    const id = comps.push(c) - 1
    const stack = [s]
    label[s] = id
    while (stack.length) {
      const p = stack.pop()
      const [x, y] = [p % bw, (p / bw) | 0]
      c.n++, (c.sx += x), (c.sy += y)
      c.x0 = Math.min(c.x0, x), (c.y0 = Math.min(c.y0, y)), (c.x1 = Math.max(c.x1, x)), (c.y1 = Math.max(c.y1, y))
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const [nx, ny] = [x + dx, y + dy]
          if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue
          const q = ny * bw + nx
          if (mask[q] && label[q] === -1) (label[q] = id), stack.push(q)
        }
    }
  }
  for (const c of comps) c.cell = c.n < MIN ? -1 : Math.min(GRID - 1, ((c.sy / c.n / bh) * GRID) | 0) * GRID + Math.min(GRID - 1, ((c.sx / c.n / bw) * GRID) | 0)

  await mkdir(OUT, { recursive: true })
  const misure = {}
  for (const [cell, fig] of f.figurine.entries()) {
    const mine = comps.filter((c) => c.cell === cell)
    if (!mine.length) {
      console.warn(`  ! ${fig.nome}: cella ${cell + 1} vuota, salto`)
      continue
    }
    const pad = 3 // blocchi di margine intorno alla figurina
    const x0 = Math.max(0, (Math.min(...mine.map((c) => c.x0)) - pad) * B)
    const y0 = Math.max(0, (Math.min(...mine.map((c) => c.y0)) - pad) * B)
    const x1 = Math.min(w, (Math.max(...mine.map((c) => c.x1)) + 1 + pad) * B)
    const y1 = Math.min(h, (Math.max(...mine.map((c) => c.y1)) + 1 + pad) * B)
    const [cw, ch] = [x1 - x0, y1 - y0]
    const crop = Buffer.alloc(cw * ch * 4)
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = ((y0 + y) * w + x0 + x) * 4
        const o = (y * cw + x) * 4
        const l = label[(((y0 + y) / B) | 0) * bw + (((x0 + x) / B) | 0)]
        const keep = l === -1 || comps[l].cell === cell // i pixel di altre figurine o delle briciole si svuotano
        crop[o] = px[i]
        crop[o + 1] = px[i + 1]
        crop[o + 2] = px[i + 2]
        crop[o + 3] = keep ? alfa(px[i + 3]) : 0
      }
    }
    const scale = Math.min(1, (f.max || MAX) / Math.max(cw, ch))
    const [ow, oh] = [Math.round(cw * scale), Math.round(ch * scale)]
    const out = join(OUT, `${fig.nome}.webp`)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${cw}x${ch}`, '-i', '-', '-vf', `scale=${ow}:${oh}:flags=lanczos`, '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '88', '-compression_level', '6', '-map_metadata', '-1', out], { input: crop })
    misure[fig.nome] = { w: ow, h: oh, foglio: nome }
    console.log(`  ✓ ${fig.nome}.webp ${ow} × ${oh} (${mine.length} ${mine.length === 1 ? 'pezzo' : 'pezzi'})`)
  }
  const scarti = comps.filter((c) => c.cell === -1).length
  if (scarti) console.log(`  ${scarti} briciole scartate`)
  await aggiornaManifest(misure)
}

async function aggiornaManifest(misure) {
  const prima = existsSync(MANIFEST) ? (await import(`${pathToFileURL(MANIFEST).href}?t=${Date.now()}`)).figurine : {}
  const tutte = { ...prima, ...misure }
  const righe = Object.keys(tutte)
    .sort()
    .map((k) => `  '${k}': { w: ${tutte[k].w}, h: ${tutte[k].h}, foglio: '${tutte[k].foglio}' },`)
  await writeFile(
    MANIFEST,
    `// Generato da tools/figurine/figurine.mjs: non modificare a mano.\n// Le figurine ritagliate in public/media/figurine/<nome>.webp, con le misure in px.\n// Le usa figurina() in src/templates/components/ui.js; un nome assente non disegna nulla.\n\nexport const figurine = {\n${righe.join('\n')}\n}\n`,
  )
  console.log(`  src/data/figurine.js: ${Object.keys(tutte).length} figurine`)
}

const [cmd, nome, arg] = process.argv.slice(2)
if (cmd === 'genera' && nome) {
  for (const n of nome === 'tutti' ? Object.keys(fogli) : [nome]) await genera(n)
} else if (cmd === 'ritaglia' && nome && arg) {
  await ritaglia(nome, arg)
} else if (cmd === 'recupera' && nome && arg) {
  foglio(nome)
  await salva(await prediction(arg), join(LAVORO, nome), { foglio: nome })
} else {
  die('uso: figurine.mjs genera <foglio|tutti> · ritaglia <foglio> <file.png> · recupera <foglio> <id>')
}
