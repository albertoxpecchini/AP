#!/usr/bin/env node
// Mascotte del sito con openai/gpt-image-2 su Replicate, sempre in qualità high.
//
//   node tools/mascotte/mascotte.mjs genera <lumaca|tartaruga|tutte>
//       disegna la mascotte (1536 × 1024, fondo trasparente) in tools/mascotte/lavoro/<nome>/
//   node tools/mascotte/mascotte.mjs usa <nome> <file.png>
//       pulisce la trasparenza, rifila i margini, trova gli occhi e scrive
//       public/media/mascotte/<nome>.webp + le misure in src/data/mascotte.js
//   node tools/mascotte/mascotte.mjs recupera <nome> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//
// Gli occhi: il modello li disegna bianchi, tondi, con la pupilla al centro. Lo
// script li cerca come macchie bianche quasi circolari e ne salva centro e raggio
// (in percentuale dell'immagine); il sito ci mette sopra il proprio occhio con la
// pupilla mobile (src/client/mascot.js). Il «naso», cioè la zona in cui il
// puntatore fa incrociare gli occhi, si segna a mano in src/data/mascotte.js:
// lo script lo conserva se c'è già.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ROOT, die, predict, prediction, salva } from '../replicate.mjs'
import { STILE, mascotte } from './mascotte.js'

const LAVORO = join(ROOT, 'tools/mascotte/lavoro')
const OUT = join(ROOT, 'public/media/mascotte')
const MANIFEST = join(ROOT, 'src/data/mascotte.js')
const MAX_W = 1200 // larghezza massima in pagina: la chiocciola del piè di pagina arriva a ~360 px CSS

const mascotteDi = (nome) => mascotte[nome] || die(`nessuna mascotte «${nome}». Disponibili: ${Object.keys(mascotte).join(', ')}`)

async function genera(nome) {
  const m = mascotteDi(nome)
  const input = {
    prompt: `${m.soggetto}\n\n${STILE}`,
    aspect_ratio: '3:2',
    quality: 'high',
    number_of_images: 1,
    output_format: 'png',
    background: 'transparent',
  }
  console.log(`→ ${nome}: ${m.titolo} — qualità high, 3:2, attendo il modello…`)
  const p = await predict(input, `node tools/mascotte/mascotte.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { mascotte: nome })
}

// ── Preparazione ─────────────────────────────────────────────────────────────

// come per le figurine: sotto 16 sparisce, sopra 240 diventa pieno
const alfa = (a) => (a < 16 ? 0 : a >= 240 ? 255 : a)

function leggi(file) {
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim()
  const [w, h] = probe.split(',').map(Number)
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 })
  for (let i = 3; i < px.length; i += 4) px[i] = alfa(px[i])
  return { w, h, px }
}

/** Riquadro dei pixel visibili, con un po' di margine. */
function rifila({ w, h, px }, pad = 6) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
  if (x1 < 0) die('immagine vuota')
  x0 = Math.max(0, x0 - pad), (y0 = Math.max(0, y0 - pad)), (x1 = Math.min(w - 1, x1 + pad)), (y1 = Math.min(h - 1, y1 + pad))
  const [cw, ch] = [x1 - x0 + 1, y1 - y0 + 1]
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) px.copy(out, y * cw * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + cw) * 4)
  return { w: cw, h: ch, px: out }
}

/**
 * Gli occhi: macchie di pixel bianchi (neutri e chiari) quasi circolari, tra lo
 * 0,8% e il 14% della larghezza. La pupilla nera al centro è un buco nella
 * macchia, quindi il riquadro della macchia è l'occhio intero. Restituisce le
 * due più grandi, da sinistra a destra.
 */
function occhi({ w, h, px }) {
  const bianco = (i) => px[i + 3] > 200 && px[i] > 222 && px[i + 1] > 222 && px[i + 2] > 222 && Math.abs(px[i] - px[i + 2]) < 16 && Math.abs(px[i + 1] - px[i + 2]) < 16
  const label = new Int32Array(w * h).fill(-1)
  const comps = []
  for (let s = 0; s < w * h; s++) {
    if (label[s] !== -1 || !bianco(s * 4)) continue
    const c = { n: 0, x0: w, y0: h, x1: 0, y1: 0 }
    const id = comps.push(c) - 1
    const stack = [s]
    label[s] = id
    while (stack.length) {
      const p = stack.pop()
      const [x, y] = [p % w, (p / w) | 0]
      c.n++
      if (x < c.x0) c.x0 = x
      if (x > c.x1) c.x1 = x
      if (y < c.y0) c.y0 = y
      if (y > c.y1) c.y1 = y
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const [nx, ny] = [x + dx, y + dy]
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const q = ny * w + nx
        if (label[q] === -1 && bianco(q * 4)) (label[q] = id), stack.push(q)
      }
    }
  }
  const tondi = comps
    .map((c) => ({ ...c, bw: c.x1 - c.x0 + 1, bh: c.y1 - c.y0 + 1 }))
    .filter((c) => c.bw > w * 0.008 && c.bw < w * 0.14 && c.bh > w * 0.008 && c.bh < w * 0.14)
    .map((c) => ({ ...c, aspetto: c.bw / c.bh, pieno: c.n / ((Math.PI / 4) * c.bw * c.bh) }))
    // quasi circolare, o un'ellisse vista di tre quarti (la pupilla al centro toglie fino a un quarto dell'area)
    .filter((c) => c.aspetto > 0.55 && c.aspetto < 1.8 && c.pieno > 0.45 && c.pieno < 1.05)
    .sort((a, b) => b.n - a.n)
    .slice(0, 2)
    .sort((a, b) => a.x0 - b.x0)
  return tondi.map((c) => {
    const cx = (c.x0 + c.x1) / 2
    const cy = (c.y0 + c.y1) / 2
    // semiassi: l'occhio visto di tre quarti è un'ellisse
    const [rx, ry] = [c.bw / 2, c.bh / 2]
    return { cx, cy, rx, ry, skin: pelle({ w, h, px }, cx, cy, (rx + ry) / 2) }
  })
}

/** Colore della palpebra: la mediana dei pixel pieni, non bianchi né neri, in un anello intorno all'occhio. */
function pelle({ w, h, px }, cx, cy, r) {
  const campioni = []
  for (let y = Math.max(0, cy - 2.4 * r) | 0; y < Math.min(h, cy + 2.4 * r); y++)
    for (let x = Math.max(0, cx - 2.4 * r) | 0; x < Math.min(w, cx + 2.4 * r); x++) {
      const d = Math.hypot(x - cx, y - cy)
      if (d < r * 1.35 || d > r * 2.3) continue
      const i = (y * w + x) * 4
      const [R, G, B, A] = [px[i], px[i + 1], px[i + 2], px[i + 3]]
      if (A < 250) continue
      const l = (R + G + B) / 3
      if (l > 225 || l < 45) continue
      campioni.push([R, G, B])
    }
  if (campioni.length < 30) return '#8b7d6b'
  const med = (k) => campioni.map((c) => c[k]).sort((a, b) => a - b)[campioni.length >> 1]
  return '#' + [med(0), med(1), med(2)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

async function usa(nome, file) {
  const m = mascotteDi(nome)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const img = rifila(leggi(src))
  console.log(`→ ${nome}: ${img.w} × ${img.h} dopo il rifilo`)
  const eyes = occhi(img)
  if (eyes.length !== 2) console.warn(`  ! trovati ${eyes.length} occhi invece di 2: da sistemare a mano in src/data/mascotte.js`)
  for (const e of eyes) console.log(`  occhio a (${e.cx.toFixed(0)}, ${e.cy.toFixed(0)}) semiassi ${e.rx.toFixed(0)} × ${e.ry.toFixed(0)} px, palpebra ${e.skin}`)

  await mkdir(OUT, { recursive: true })
  const scale = Math.min(1, MAX_W / img.w)
  const [ow, oh] = [Math.round(img.w * scale), Math.round(img.h * scale)]
  const out = join(OUT, `${nome}.webp`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${img.w}x${img.h}`, '-i', '-', '-vf', `scale=${ow}:${oh}:flags=lanczos`, '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '90', '-compression_level', '6', '-map_metadata', '-1', out], { input: img.px })
  console.log(`  ✓ public/media/mascotte/${nome}.webp ${ow} × ${oh}`)

  const pct = (v, tot) => Number(((v / tot) * 100).toFixed(2))
  const prima = existsSync(MANIFEST) ? (await import(`${pathToFileURL(MANIFEST).href}?t=${Date.now()}`)).mascotte : {}
  const voce = {
    w: ow,
    h: oh,
    alt: m.alt,
    // centro e semiassi in percentuale: x e rx sulla larghezza, y e ry sull'altezza
    eyes: eyes.map((e) => ({ x: pct(e.cx, img.w), y: pct(e.cy, img.h), rx: pct(e.rx, img.w), ry: pct(e.ry, img.h), skin: e.skin })),
    nose: prima[nome]?.nose || null,
  }
  await scriviManifest({ ...prima, [nome]: voce })
}

async function scriviManifest(tutte) {
  const righe = Object.keys(tutte)
    .sort()
    .map((k) => {
      const v = tutte[k]
      const eyes = v.eyes.map((e) => `{ x: ${e.x}, y: ${e.y}, rx: ${e.rx}, ry: ${e.ry}, skin: '${e.skin}' }`).join(', ')
      const nose = v.nose ? `{ x: ${v.nose.x}, y: ${v.nose.y}, rx: ${v.nose.rx}, ry: ${v.nose.ry} }` : 'null'
      return `  ${k}: {\n    w: ${v.w},\n    h: ${v.h},\n    alt: '${String(v.alt).replace(/'/g, '\\\'')}',\n    eyes: [${eyes}],\n    nose: ${nose},\n  },`
    })
  await writeFile(
    MANIFEST,
    `// Generato da tools/mascotte/mascotte.mjs (occhi trovati dallo script; il naso si segna a mano).\n// Le mascotte in public/media/mascotte/<nome>.webp. Centro e semiassi in percentuale:\n// x e rx sulla larghezza dell'immagine, y e ry sull'altezza. \`skin\` è il colore della palpebra.\n// Le usa mascot() in src/templates/components/ui.js e src/client/mascot.js le anima.\n\nexport const mascotte = {\n${righe.join('\n')}\n}\n`,
  )
  console.log(`  src/data/mascotte.js: ${Object.keys(tutte).length} mascotte`)
}

const [cmd, nome, arg] = process.argv.slice(2)
if (cmd === 'genera' && nome) {
  for (const n of nome === 'tutte' ? Object.keys(mascotte) : [nome]) await genera(n)
} else if (cmd === 'usa' && nome && arg) {
  await usa(nome, arg)
} else if (cmd === 'recupera' && nome && arg) {
  mascotteDi(nome)
  await salva(await prediction(arg), join(LAVORO, nome), { mascotte: nome })
} else {
  die('uso: mascotte.mjs genera <nome|tutte> · usa <nome> <file.png> · recupera <nome> <id>')
}
