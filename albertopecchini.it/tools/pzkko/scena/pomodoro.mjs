#!/usr/bin/env node
// Il pomodoro del caricamento di pzkko.it (21.10): mentre la scena 3D si prepara, al centro dello schermo un pomodoro
// matura e cresce (dal verde al rosso, col contatore sotto); quando la scena è pronta si gonfia, scoppia e macchia la
// telecamera, e la macchia scivola via scoprendo la strada (lo script del caricamento in fondo a pzkko/index.html).
// Le immagini le disegna openai/gpt-image-2 su Replicate (qualità high, come tutte quelle del sito) su un grigio neutro
// pieno, e le scontorna bria/remove-background (lo stesso di tools/scontorna.mjs): la prima volta erano su un blu pieno
// tolto con la chiave cromatica, e nel succo e nei bordi trasparenti il blu si vedeva. Il grigio che resta nei pixel a
// metà si toglie (decontaminazione, sotto): dove ne restasse un filo è neutro, non un colore.
//
//   node tools/pzkko/scena/pomodoro.mjs genera <matura|scoppio|macchia|tutti>
//       disegna in tools/pzkko/lavoro/pomodoro/<nome>/ (scoppio e macchia partono dall'ultimo foglio di matura: prima
//       quello; con «tutti» matura per prima, poi le altre due insieme)
//   node tools/pzkko/scena/pomodoro.mjs recupera <nome> <id-predizione>
//   node tools/pzkko/scena/pomodoro.mjs usa
//       scontorna l'ultimo PNG di ognuno (l'uscita di bria resta accanto, <png>.alfa.png: rifacendo «usa» non si ripaga)
//       e scrive in pzkko/art/scena/pomodoro/ matura.webp (gli 8 fotogrammi in fila, quadrati, il pomodoro allo stesso
//       posto in tutti), scoppio.webp (i 4 dello scoppio, in fila) e macchia.webp (la macchia sulla lente, a tutto
//       schermo); e in pzkko/index.html SCOPPIO, quante volte un fotogramma dello scoppio è più grande di uno di matura
//       perché il pomodoro del primo sia grande quanto l'ultimo maturo, e PRIMO, il primo fotogramma piccolo dentro la
//       pagina (si vede subito, prima che arrivi matura.webp). Poi node tools/pzkko/genera-storia.mjs e
//       node tools/pzkko/genera-404.mjs

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/pomodoro')
const OUT = join(ROOT, 'pzkko/art/scena/pomodoro')
const GRIGIO = 'The background of the whole image is a seamless, perfectly flat, uniform neutral mid-grey studio backdrop (#808080): no shadow cast on it, no reflection, no gradient, no vignette, no texture, no grid lines, no borders, no text, no numbers, no watermark.'

const IMMAGINI = {
  matura: {
    prompt: `Eight frames of a loading animation for a website, laid out as a sprite sheet: a grid of 4 columns × 2 rows of equal cells (each cell exactly 512 px wide and 576 px tall), with no lines between them. Every cell shows the SAME single round tomato (one fruit, with its small green star-shaped calyx and a short stem on top), photographed in exactly the same pose, angle, size and position: centred in its cell, about 60% of the cell wide, seen slightly from above, soft studio light from the upper left, a crisp small white highlight on the glossy skin. Only its colour changes, frame by frame, as it ripens, read left to right and then top to bottom: 1 hard pale green, unripe; 2 green; 3 green with the first yellowish-cream blush at the bottom (the breaker stage); 4 yellow-orange patches spreading over the green; 5 orange and pink, only the shoulders still green; 6 light red; 7 bright red, ripe; 8 deep glossy red, very ripe, plump and slightly swollen. Photorealistic, appetizing, like a high-end food photograph. ${GRIGIO}`,
    aspect_ratio: '2048x1152',
  },
  scoppio: {
    ingresso: 'matura',
    prompt: `The attached image is the sprite sheet of a tomato ripening. Using the SAME tomato as its last frame (deep glossy red, very ripe), with the same photographic style and the same light, draw four new frames of it BURSTING, as a sprite sheet: a grid of 2 columns × 2 rows of equal square cells (each exactly 1024 × 1024 px), with no lines between them, read left to right and then top to bottom. In every frame the tomato (or what is left of it) is centred in its cell at exactly the same place; in frame 1 the tomato is about 30% of the cell wide, so the splash has room around it, and every frame stays inside its own cell with a margin of background around it. 1: the tomato swollen to the limit, the skin stretched tight and shining, a thin split opening on its top; 2: the skin tears open in a star of cracks, red juice and seeds start to spurt out; 3: the tomato bursts apart: chunks of red flesh, shreds of skin, seeds in their jelly and drops of juice fly outwards in every direction; 4: a big explosive splash of tomato pulp, juice and seeds flying straight at the viewer, filling most of the cell, no tomato shape left. The juice is thick and opaque, like fresh tomato purée, never watery or see-through. ${GRIGIO}`,
    aspect_ratio: '2048x2048',
  },
  macchia: {
    ingresso: 'matura',
    prompt: `A very ripe red tomato (the one of the attached sprite sheet) has just smashed against the front glass of a camera lens. What we see is the lens glass itself, from the camera's point of view, covered by the splat: a big irregular splash of thick red tomato pulp in the centre, with seeds in their yellowish jelly, shreds of glossy red skin and juice; thick drips running down toward the bottom edge; smaller drops and spatters radiating out toward all four edges of the image. The pulp and the juice are thick and opaque, like fresh tomato purée, never watery or see-through. Wet and glossy, lit from the front with small bright reflections, slightly soft because it is right on the lens. The splash covers about 60% of the image and the centre is completely covered. Everything that is not tomato is background. ${GRIGIO}`,
    aspect_ratio: '2048x2048',
  },
}

const nomi = (args) => (args.includes('tutti') ? Object.keys(IMMAGINI) : args).map((n) => (IMMAGINI[n] ? n : die(`non conosco «${n}»: ${Object.keys(IMMAGINI).join(', ')}`)))
const ultimo = async (nome) => {
  const png = (await readdir(join(LAVORO, nome)).catch(() => [])).filter((f) => f.endsWith('.png') && !f.endsWith('.alfa.png')).sort().at(-1)
  return png ? join(LAVORO, nome, png) : null
}

async function genera(nome) {
  const d = IMMAGINI[nome]
  const input = { prompt: d.prompt, aspect_ratio: d.aspect_ratio, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  if (d.ingresso) {
    const usato = await ultimo(d.ingresso)
    if (!usato) die(`prima «genera ${d.ingresso}»`)
    input.input_images = [await upload(usato)]
  }
  console.log(`→ ${nome}: attendo il modello…`)
  const p = await predict(input, `node tools/pzkko/scena/pomodoro.mjs recupera ${nome}`)
  return salva(p, join(LAVORO, nome), { pomodoro: nome })
}

// ── usa ──────────────────────────────────────────────────────────────────────
// Lo scontorno: l'alfa la dà bria (l'uscita, che a volte è più piccola, si porta alla misura del foglio); i colori restano
// quelli del foglio. Nei pixel a metà il colore è ancora pomodoro × a + grigio × (1 − a): il grigio del fondo (la mediana
// dei pixel che bria dice fondo) si toglie, pomodoro = (osservato − (1 − a) · grigio) / a. Sotto un'alfa di 0,04 è fondo
async function scontorna(nome, sharp) {
  const f = (await ultimo(nome)) ?? die(`nessun PNG per ${nome}: prima «genera ${nome}»`)
  const alfa = f.replace(/\.png$/, '.alfa.png')
  if (!existsSync(alfa)) {
    console.log(`→ ${nome}: scontorno con bria/remove-background…`)
    const p = await predict({ image: await upload(f), preserve_alpha: true }, '(predizione di bria da scaricare a mano dalla dashboard di Replicate)', 'bria/remove-background')
    const res = await fetch([p.output].flat()[0])
    if (!res.ok) die(`download dello scontorno di ${nome}: ${res.status}`)
    await writeFile(alfa, Buffer.from(await res.arrayBuffer()))
  }
  const { data: px, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { w, h } = { w: info.width, h: info.height }
  const a = (await sharp(alfa).ensureAlpha().resize(w, h, { fit: 'fill' }).extractChannel(3).raw().toBuffer())
  const fondo = [[], [], []]
  for (let i = 0; i < w * h; i += 7) if (a[i] < 8) for (let k = 0; k < 3; k++) fondo[k].push(px[i * 3 + k])
  if (!fondo[0].length) die(`${nome}: bria non ha lasciato fondo`)
  const G = fondo.map((v) => v.sort((x, y) => x - y)[v.length >> 1])
  const out = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const k = a[i] / 255
    if (k < 0.04) continue
    for (let j = 0; j < 3; j++) out[i * 4 + j] = Math.max(0, Math.min(255, Math.round(k > 0.98 ? px[i * 3 + j] : (px[i * 3 + j] - (1 - k) * G[j]) / k)))
    out[i * 4 + 3] = a[i]
  }
  console.log(`  ${nome}: fondo ${G.join(', ')}`)
  return { w, h, px: out }
}

// il rettangolo dei pixel pieni (alfa > soglia) dentro un riquadro, e il loro centro
function scatola({ w, px }, x0, y0, cw, ch, soglia = 128) {
  let a = { x0: Infinity, y0: Infinity, x1: -1, y1: -1 }
  for (let y = y0; y < y0 + ch; y++) for (let x = x0; x < x0 + cw; x++) if (px[(y * w + x) * 4 + 3] > soglia) {
    a.x0 = Math.min(a.x0, x); a.y0 = Math.min(a.y0, y); a.x1 = Math.max(a.x1, x); a.y1 = Math.max(a.y1, y)
  }
  if (a.x1 < 0) die('un fotogramma è vuoto')
  return { ...a, cx: (a.x0 + a.x1 + 1) / 2, cy: (a.y0 + a.y1 + 1) / 2, lato: Math.max(a.x1 - a.x0 + 1, a.y1 - a.y0 + 1) }
}

// un quadrato di lato l centrato in (cx, cy), preso solo dentro la sua cella (fuori: trasparente). bordo: la fascia lungo
// i lati della cella in cui l'alfa sfuma a zero (lo scoppio: il modello lascia uscire gli schizzi dell'ultimo fotogramma
// dalla cella, e lì sarebbero tagliati dritti)
function quadrato({ w, px }, cx, cy, l, cella, bordo = 0) {
  const out = Buffer.alloc(l * l * 4)
  const x0 = Math.round(cx - l / 2), y0 = Math.round(cy - l / 2)
  for (let y = 0; y < l; y++) for (let x = 0; x < l; x++) {
    const sx = x0 + x, sy = y0 + y
    if (sx < cella.x0 || sy < cella.y0 || sx >= cella.x0 + cella.w || sy >= cella.y0 + cella.h) continue
    const o = (y * l + x) * 4
    px.copy(out, o, (sy * w + sx) * 4, (sy * w + sx) * 4 + 4)
    if (bordo) {
      const d = Math.min(sx - cella.x0, cella.x0 + cella.w - 1 - sx, sy - cella.y0, cella.y0 + cella.h - 1 - sy) / bordo
      if (d < 1) out[o + 3] = Math.round(out[o + 3] * d * d * (3 - 2 * d))
    }
  }
  return out
}

async function usa() {
  const { default: sharp } = await import('sharp')
  // una fila di fotogrammi quadrati di lato l, ridotti a lato `fuori`
  const fila = async (quadrati, l, fuori, file, quality) => {
    const pezzi = await Promise.all(quadrati.map((q) => sharp(q, { raw: { width: l, height: l, channels: 4 } }).resize(fuori, fuori).png().toBuffer()))
    const info = await sharp({ create: { width: fuori * pezzi.length, height: fuori, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(pezzi.map((input, i) => ({ input, left: i * fuori, top: 0 }))).webp({ quality, alphaQuality: 80, effort: 6 }).toFile(join(OUT, file))
    console.log(`✓ ${file}: ${pezzi.length} × ${fuori} px, ${(info.size / 1024).toFixed(0)} KB`)
  }
  await mkdir(OUT, { recursive: true })
  const pagina = join(ROOT, 'pzkko/index.html')
  let html = await readFile(pagina, 'utf8')
  const scrivi = (nome, valore) => {
    const re = new RegExp(`const ${nome} = [^\\n]*`)
    if (!re.test(html)) die(`in pzkko/index.html manca «const ${nome} = …»`)
    html = html.replace(re, () => `const ${nome} = ${valore}`)
  }

  // matura: 4 × 2 celle; lo stesso quadrato per tutti, centrato su ognuno (così crescendo e cambiando non trema)
  const M = await scontorna('matura', sharp)
  const cm = { w: M.w / 4, h: M.h / 2 }
  const celleM = Array.from({ length: 8 }, (_, i) => ({ x0: (i % 4) * cm.w, y0: Math.floor(i / 4) * cm.h, w: cm.w, h: cm.h }))
  const sM = celleM.map((c) => scatola(M, c.x0, c.y0, c.w, c.h))
  const lM = Math.ceil(Math.max(...sM.map((s) => s.lato)) * 1.08)
  const R = 320
  const quadriM = celleM.map((c, i) => quadrato(M, sM[i].cx, sM[i].cy, lM, c))
  await fila(quadriM, lM, R, 'matura.webp', 78)
  // il primo fotogramma, piccolo, dentro la pagina: c'è appena c'è la pagina, prima di matura.webp
  const primo0 = await sharp(quadriM[0], { raw: { width: lM, height: lM, channels: 4 } }).resize(112, 112).webp({ quality: 70, alphaQuality: 70, effort: 6 }).toBuffer()
  scrivi('PRIMO', `'data:image/webp;base64,${primo0.toString('base64')}'`)
  console.log(`  PRIMO: ${(primo0.length / 1024).toFixed(1)} KB dentro la pagina`)

  // scoppio: 2 × 2 celle; il centro è quello del pomodoro del primo fotogramma (spostato nella sua cella), il quadrato
  // il più piccolo che contiene tutti gli schizzi. Si vede solo per un terzo di secondo, mentre vola verso la telecamera:
  // basta piccolo (448 px), e la pagina lo ingrandisce di SCOPPIO rispetto al pomodoro
  const S = await scontorna('scoppio', sharp)
  const cs = { w: S.w / 2, h: S.h / 2 }
  const celleS = Array.from({ length: 4 }, (_, i) => ({ x0: (i % 2) * cs.w, y0: Math.floor(i / 2) * cs.h, w: cs.w, h: cs.h }))
  const primo = scatola(S, 0, 0, cs.w, cs.h)
  const centri = celleS.map((c) => [c.x0 + primo.cx, c.y0 + primo.cy])
  const sS = celleS.map((c) => scatola(S, c.x0, c.y0, c.w, c.h, 40))
  const lS = Math.min(cs.w, Math.ceil(2 * Math.max(...sS.map((s, i) => Math.max(centri[i][0] - s.x0, s.x1 + 1 - centri[i][0], centri[i][1] - s.y0, s.y1 + 1 - centri[i][1]))) * 1.04))
  await fila(celleS.map((c, i) => quadrato(S, centri[i][0], centri[i][1], lS, c, 0.12 * cs.w)), lS, 448, 'scoppio.webp', 72)
  const SCOPPIO = ((lS / primo.lato) / (lM / sM[7].lato)).toFixed(3)
  scrivi('SCOPPIO', SCOPPIO)
  console.log(`  SCOPPIO = ${SCOPPIO}`)

  // la macchia: tutta, ridotta (è sulla lente, fuori fuoco: morbida va bene)
  const C = await scontorna('macchia', sharp)
  const info = await sharp(C.px, { raw: { width: C.w, height: C.h, channels: 4 } }).resize(1024, 1024).webp({ quality: 70, alphaQuality: 75, effort: 6 }).toFile(join(OUT, 'macchia.webp'))
  console.log(`✓ macchia.webp: 1024 px, ${(info.size / 1024).toFixed(0)} KB`)
  await writeFile(pagina, html)
  console.log('  scritti PRIMO e SCOPPIO in pzkko/index.html')
}

const [cmd, ...args] = process.argv.slice(2)
if (cmd === 'genera') {
  const n = nomi(args)
  // matura per prima (le altre partono da lei), poi le altre insieme, un processo ciascuna
  if (n.length === 1) await genera(n[0])
  else {
    const qui = fileURLToPath(import.meta.url)
    const lancia = (x) => new Promise((ok) => spawn(process.execPath, [qui, 'genera', x], { stdio: 'inherit' }).on('close', ok))
    if (n.includes('matura')) await lancia('matura')
    await Promise.all(n.filter((x) => x !== 'matura').map(lancia))
  }
} else if (cmd === 'recupera') await salva(await prediction(args[1]), join(LAVORO, nomi([args[0]])[0]), { pomodoro: args[0] })
else if (cmd === 'usa') await usa()
else die('uso: pomodoro.mjs genera|recupera <matura|scoppio|macchia|tutti> | usa')
