#!/usr/bin/env node
// Ingredienti fotografici di «Better Call Pekko» (/assistenza/) con openai/gpt-image-2
// su Replicate, sempre in qualità high. Gli annunci finiti li compone rendi.mjs.
//
//   node tools/assistenza/spot.mjs genera <foglio|spot|fogli-tutti|spot-tutti>
//       disegna l'immagine in tools/assistenza/lavoro/<nome>/ (PNG + JSON col prompt)
//   node tools/assistenza/spot.mjs recupera <nome> <id-predizione>
//       scarica una predizione già pagata (se l'attesa si è interrotta)
//   node tools/assistenza/spot.mjs ritaglia <foglio> <file.png> [--max 900]
//       ritaglia le figure del foglio (griglia 3 × 3, o 1 per i fogli da una figura)
//       in public/media/assistenza/<nome>.webp con la trasparenza pulita
//   node tools/assistenza/spot.mjs usa <spot> <file.png> [--w 1400]
//       uno sfondo scelto: copia in lavoro/scelte/ e public/media/assistenza/<spot>.webp
//
// Ogni comando che scrive in public/ aggiorna src/data/assistenza-media.js (misure).
// Prompt e voci: spot.js. Token e chiamate: tools/replicate.mjs. Ritaglio come tools/figurine.

import { writeFile, mkdir, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ROOT, die, upload, predict, prediction, salva } from '../replicate.mjs'
import { RIFERIMENTO, spot, fogli, voce } from './spot.js'

const LAVORO = join(ROOT, 'tools/assistenza/lavoro')
const SCELTE = join(LAVORO, 'scelte')
const OUT = join(ROOT, 'public/media/assistenza')
const MANIFEST = join(ROOT, 'src/data/assistenza-media.js')
const WEB = '/media/assistenza'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : Number(args[i + 1])
}
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))

// ── Generazione ──────────────────────────────────────────────────────────────
// I fogli con persone (intro che cita il volto) ricevono la fototessera; gli
// altri no, così il modello non ci infila Alberto tra gli oggetti.

async function genera(nome) {
  const s = spot[nome]
  const f = fogli[nome]
  if (!s && !f) die(`nessuno spot o foglio «${nome}». Fogli: ${Object.keys(fogli).join(', ')}. Spot: ${Object.keys(spot).join(', ')}`)
  let input
  if (f) {
    const conVolto = f.intro.includes('reference photo')
    input = {
      prompt: `${f.intro}\n${f.figurine.map(voce).join('\n')}`,
      ...(conVolto && { input_images: [await upload(RIFERIMENTO)] }),
      aspect_ratio: f.aspect || '2048x2048',
      quality: 'high',
      number_of_images: 1,
      output_format: 'png',
      background: 'transparent',
    }
    console.log(`→ ${nome}: ${f.titolo} — ${input.aspect_ratio} trasparente, qualità high${conVolto ? ', con la fototessera' : ''}, attendo il modello…`)
  } else {
    input = { prompt: s.prompt, aspect_ratio: s.aspect, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
    console.log(`→ ${nome}: ${s.titolo} — ${s.aspect}, qualità high, attendo il modello…`)
  }
  const p = await predict(input, `node tools/assistenza/spot.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { nome })
}

// ── Misure e manifest ────────────────────────────────────────────────────────

const probe = (file) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file])
    .toString()
    .trim()
    .split(',')
    .map(Number)

export async function aggiornaManifest(nuove) {
  const prima = existsSync(MANIFEST) ? (await import(`${pathToFileURL(MANIFEST).href}?t=${Date.now()}`)).media : {}
  const tutte = { ...prima, ...nuove }
  const righe = Object.keys(tutte)
    .sort()
    .map((k) => `  '${k}': { w: ${tutte[k].w}, h: ${tutte[k].h}, src: '${tutte[k].src}' },`)
  await writeFile(
    MANIFEST,
    `// Generato da tools/assistenza (spot.mjs, rendi.mjs): non modificare a mano.\n// Le immagini di /assistenza/ in public/media/assistenza/, con le misure in px.\n\nexport const media = {\n${righe.join('\n')}\n}\n`,
  )
  console.log(`  src/data/assistenza-media.js: ${Object.keys(tutte).length} immagini`)
}

// ── Sfondo scelto ────────────────────────────────────────────────────────────

async function usa(nome, file) {
  if (!spot[nome]) die(`nessuno spot «${nome}»`)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  await mkdir(SCELTE, { recursive: true })
  await mkdir(OUT, { recursive: true })
  await copyFile(src, join(SCELTE, `${nome}.png`))
  const [w] = probe(src)
  const larg = Math.min(opt('w', 1400), w)
  const out = join(OUT, `${nome}.webp`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', `scale=${larg}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '84', '-compression_level', '6', '-map_metadata', '-1', out])
  const [ow, oh] = probe(out)
  console.log(`  ✓ ${nome}.webp ${ow} × ${oh}`)
  await aggiornaManifest({ [nome]: { w: ow, h: oh, src: `${WEB}/${nome}.webp` } })
}

// ── Ritaglio dei fogli (come tools/figurine/figurine.mjs) ────────────────────
// La maschera (alpha > SOGLIA) si riduce a blocchi di B px, i blocchi si
// raggruppano in componenti connesse e ogni componente va alla cella della
// griglia in cui cade il suo baricentro. Le briciole sotto MIN blocchi si
// scartano. Sotto 16 di alpha si azzera, sopra 240 si porta a 255. Il PNG
// pulito resta anche in lavoro/scelte/<nome>.png, per rendi.mjs.

const SOGLIA = 24
const B = 4
const MIN = 16
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
  const f = fogli[nome] || die(`nessun foglio «${nome}». Disponibili: ${Object.keys(fogli).join(', ')}`)
  const GRID = f.griglia || 3
  // «celle»: ogni cella della griglia è una figura, senza cercare le componenti
  // connesse; serve quando le figure si toccano (i mezzi busti in colonna).
  const celle = f.taglio === 'celle' || args.includes('--celle')
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const [w, h] = probe(src)
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 })
  console.log(`→ ${nome}: ${w} × ${h}, ${scontorna(px, w, h)}${celle ? ', taglio a celle' : ''}`)

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
  if (celle) {
    comps.length = 0
    label.fill(-1)
    for (let cell = 0; cell < GRID * GRID; cell++) {
      const c = { n: 0, sx: 0, sy: 0, x0: bw, y0: bh, x1: 0, y1: 0, cell }
      comps.push(c)
      const [cx0, cx1] = [Math.floor(((cell % GRID) * bw) / GRID), Math.floor((((cell % GRID) + 1) * bw) / GRID)]
      const [cy0, cy1] = [Math.floor((Math.floor(cell / GRID) * bh) / GRID), Math.floor(((Math.floor(cell / GRID) + 1) * bh) / GRID)]
      for (let y = cy0; y < cy1; y++)
        for (let x = cx0; x < cx1; x++) {
          const q = y * bw + x
          if (!mask[q]) continue
          label[q] = cell
          c.n++
          c.x0 = Math.min(c.x0, x), (c.y0 = Math.min(c.y0, y)), (c.x1 = Math.max(c.x1, x)), (c.y1 = Math.max(c.y1, y))
        }
      if (c.n < MIN) c.cell = -1
    }
  } else {
    for (const c of comps) c.cell = c.n < MIN ? -1 : Math.min(GRID - 1, ((c.sy / c.n / bh) * GRID) | 0) * GRID + Math.min(GRID - 1, ((c.sx / c.n / bw) * GRID) | 0)
  }

  await mkdir(OUT, { recursive: true })
  await mkdir(SCELTE, { recursive: true })
  const misure = {}
  const max = opt('max', f.max || 900)
  for (const [cell, fig] of f.figurine.entries()) {
    const mine = comps.filter((c) => c.cell === cell)
    if (!mine.length) {
      console.warn(`  ! ${fig.nome}: cella ${cell + 1} vuota, salto`)
      continue
    }
    const pad = 2
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
        const keep = l === -1 || comps[l].cell === cell
        crop[o] = px[i]
        crop[o + 1] = px[i + 1]
        crop[o + 2] = px[i + 2]
        crop[o + 3] = keep ? alfa(px[i + 3]) : 0
      }
    }
    const scale = Math.min(1, max / Math.max(cw, ch))
    const [ow, oh] = [Math.round(cw * scale), Math.round(ch * scale)]
    const out = join(OUT, `${fig.nome}.webp`)
    const png = join(SCELTE, `${fig.nome}.png`)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${cw}x${ch}`, '-i', '-', '-vf', `scale=${ow}:${oh}:flags=lanczos`, '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '86', '-compression_level', '6', '-map_metadata', '-1', out], { input: crop })
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${cw}x${ch}`, '-i', '-', '-vf', `scale=${ow}:${oh}:flags=lanczos`, png], { input: crop })
    misure[fig.nome] = { w: ow, h: oh, src: `${WEB}/${fig.nome}.webp` }
    console.log(`  ✓ ${fig.nome}.webp ${ow} × ${oh} (${mine.length} ${mine.length === 1 ? 'pezzo' : 'pezzi'})`)
  }
  const scarti = comps.filter((c) => c.cell === -1).length
  if (scarti) console.log(`  ${scarti} briciole scartate`)
  await aggiornaManifest(misure)
}

// ── Comandi ──────────────────────────────────────────────────────────────────

const [cmd, nome, ...resto] = positional
if (cmd === 'genera' && nome) {
  const nomi = nome === 'fogli-tutti' ? Object.keys(fogli) : nome === 'spot-tutti' ? Object.keys(spot) : [nome]
  for (const n of nomi) await genera(n)
} else if (cmd === 'recupera' && nome && resto[0]) {
  if (!spot[nome] && !fogli[nome]) die(`nessuno spot o foglio «${nome}»`)
  await salva(await prediction(resto[0]), join(LAVORO, nome), { nome })
} else if (cmd === 'usa' && nome && resto[0]) {
  await usa(nome, resto[0])
} else if (cmd === 'ritaglia' && nome && resto[0]) {
  await ritaglia(nome, resto[0])
} else if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  die('uso: spot.mjs genera <nome|fogli-tutti|spot-tutti> · recupera <nome> <id> · ritaglia <foglio> <file.png> [--max N] · usa <spot> <file.png> [--w N]')
}
