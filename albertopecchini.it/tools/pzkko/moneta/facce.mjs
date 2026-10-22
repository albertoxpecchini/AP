#!/usr/bin/env node
// Le due facce della moneta del gioco «testa o croce» di pzkko.it, disegnate da
// openai/gpt-image-2 su Replicate in qualità high: un foglio solo con la testa e
// la croce una accanto all'altra, come mappe delle altezze (bianco = il rilievo
// più alto). Da lì, una volta qui e non nel browser, per ogni faccia:
//   <faccia>-colore.webp  l'ottone con la patina scura nei fondi e i rilievi lucidati
//   <faccia>-normali.webp le normali (spazio tangente) per la luce sui rilievi
//   <faccia>-lucido.webp  ruvido (verde) e metallo (blu), come quelle della scena
//   <faccia>-frottage.webp la moneta ricalcata a matita sul foglio del tavolo
// in pzkko/art/moneta/. Il bordo rialzato lo rifà il codice (un cerchio perfetto).
//
//   node tools/pzkko/moneta/facce.mjs genera
//       disegna il foglio in tools/pzkko/lavoro/moneta/
//   node tools/pzkko/moneta/facce.mjs recupera <id-predizione>
//   node tools/pzkko/moneta/facce.mjs usa [file.png]
//       (senza file: l'ultimo PNG del foglio)

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva } from '../../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/moneta')
const OUT = join(ROOT, 'pzkko/art/moneta')
const FACCE = ['testa', 'croce'] // a sinistra, a destra
const LATO = 1024 // le mappe: la moneta riempie il quadrato
const ASPETTO = '2048x1152'

// (il primo foglio, 21.10, era una moneta illuminata da sinistra invece di una mappa delle altezze, e sulla croce la
// scritta girava male, «CORSET»: qui la croce non ha scritte e si chiede, con insistenza, il grigio solo dall'altezza)
export const PROMPT = `This is NOT a picture of a coin: it is a technical GRAYSCALE DEPTH MAP (a height map, like the Z-depth pass of a 3D renderer or the elevation map used for CNC bas-relief carving) of the two faces of the same fictional coin, side by side, seen perfectly straight on (orthographic), on a pure flat black background (#000000).
Each face is a perfect circle, both exactly the same size (diameter 46% of the image width), the left one centred in the left half of the image, the right one centred in the right half, nothing touching the image edges or each other.
The grey of every point says only how high it is: pure white = the highest raised surfaces, black = the lowest. Points at the same height have exactly the same grey whatever their orientation: the left and right sides, the top and bottom sides of every raised shape are equally bright, like a topographic elevation map. The flat field of each coin is one uniform dark grey (#404040). Around the edge of each face a narrow raised rim: a uniform light grey ring (#c8c8c8) of constant width (4% of the diameter). The relief is low and sculpted like a real struck coin: smooth rounded gradients rising toward the middle of each modelled shape, crisp steep edges on the lettering.
Left, the obverse: the head and neck of a classical young man in profile facing left, short curly hair bound by a laurel wreath (a fictional person, in the style of an ancient Roman coin); along the rim, above the head, the raised capital letters «PZKKO» following the curve, and at the bottom, along the rim, «MMXXVI».
Right, the reverse: a large ornate cross in the centre, with four equal flared arms ending in small fleurs-de-lis (like the cross on medieval Italian coins), a small raised dot between each pair of arms, and just inside the rim a ring of small raised beads all around. NO letters and NO numbers on this face.
Absolutely no lighting: no light direction, no shading, no ambient occlusion, no shadows, no highlights, no metal colour, no texture noise, no perspective. Only height as brightness.`

async function genera() {
  const input = { prompt: PROMPT, aspect_ratio: ASPETTO, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  console.log('→ moneta: testa e croce, qualità high, attendo il modello…')
  const p = await predict(input, 'node tools/pzkko/moneta/facce.mjs recupera')
  await salva(p, LAVORO, { foglio: 'moneta' })
}

const liscia = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }

async function usa(file) {
  if (!file) {
    const png = (await readdir(LAVORO)).filter((f) => f.endsWith('.png')).sort().at(-1)
    if (!png) die(`nessun PNG in ${LAVORO}`)
    file = join(LAVORO, png)
  }
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  await mkdir(OUT, { recursive: true })
  for (const [k, nome] of FACCE.entries()) {
    // la moneta nella sua metà: il riquadro di quello che non è fondo nero
    const x0 = k * (W / 2), x1 = (k + 1) * (W / 2)
    let a = W, b = H, d = 0, e = 0
    for (let y = 0; y < H; y++) for (let x = x0; x < x1; x++) if (data[(y * W + x) * C] > 24) { a = Math.min(a, x); b = Math.min(b, y); d = Math.max(d, x); e = Math.max(e, y) }
    // (il modello la disegna appena schiacciata, 844 × 868 il 21.10: si riporta tonda)
    const cx = (a + d) / 2, cy = (b + e) / 2, Rx = (d - a) / 2, Ry = (e - b) / 2, R = Math.max(Rx, Ry)
    if (!(Math.min(Rx, Ry) > 100)) die(`${nome}: la moneta non si trova`)
    console.log(`  ${nome}: centro ${cx.toFixed(0)}, ${cy.toFixed(0)}, ${(d - a)} × ${(e - b)} px`)
    // il campo: il grigio più frequente dentro la moneta (lontano dal bordo e dal centro, dove c'è il disegno)
    const istogramma = new Array(256).fill(0)
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const r = Math.hypot(x - cx, y - cy) / R
      if (r < 0.88 && x >= 0 && y >= 0 && x < W && y < H) istogramma[data[(y * W + x) * C]]++
    }
    const campo = istogramma.indexOf(Math.max(...istogramma.slice(25)), 25)
    let tot = istogramma.reduce((s, n) => s + n, 0), su = 0, alto = 255
    for (let v = 255; v >= 0; v--) { su += istogramma[v]; if (su > tot * 0.004) { alto = v; break } }
    console.log(`    campo ${campo}, rilievo più alto ${alto}`)
    // la mappa nel quadrato LATO × LATO: 0 = il campo, 1 = il rilievo più alto; il bordo rialzato e lo spigolo li fa il codice
    const h = new Float32Array(LATO * LATO)
    const leggi = (x, y) => { // bilineare
      const ix = Math.max(0, Math.min(W - 2, Math.floor(x))), iy = Math.max(0, Math.min(H - 2, Math.floor(y))), fx = x - ix, fy = y - iy
      const p = (xx, yy) => data[(yy * W + xx) * C]
      return (p(ix, iy) * (1 - fx) + p(ix + 1, iy) * fx) * (1 - fy) + (p(ix, iy + 1) * (1 - fx) + p(ix + 1, iy + 1) * fx) * fy
    }
    for (let y = 0; y < LATO; y++) for (let x = 0; x < LATO; x++) {
      const u = (x + 0.5) / LATO * 2 - 1, v = (y + 0.5) / LATO * 2 - 1, r = Math.hypot(u, v)
      const disegno = r < 0.93 ? Math.max(-0.15, (leggi(cx + u * Rx, cy + v * Ry) - campo) / (alto - campo)) : 0
      // il bordo: sale dal campo a 0,62 fra 0,925 e 0,945, piano, poi lo spigolo arrotondato che scende a 0,3 sul bordo
      const bordo = 0.62 * liscia(0.925, 0.945, r) - 0.32 * liscia(0.975, 1.0, r)
      h[y * LATO + x] = r <= 1 ? Math.max(disegno * (1 - liscia(0.915, 0.93, r)), bordo) : 0.3
    }
    // una sfocatura leggera: niente scalini dagli 8 bit del disegno
    const liscio = sfoca(h, LATO, 1)
    await scrivi(sharp, nome, liscio)
    await writeFile(join(OUT, `${nome}.json`), JSON.stringify({ fonte: 'openai/gpt-image-2 su Replicate, qualità high', foglio: 'tools/pzkko/moneta/facce.mjs', faccia: nome, file, prompt: PROMPT }, null, 2))
  }
}

// sfocatura gaussiana separabile, raggio in px
function sfoca(h, n, s) {
  const k = [], r = Math.ceil(s * 2.5)
  for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * s * s)))
  const somma = k.reduce((a, b) => a + b, 0)
  const tmp = new Float32Array(n * n), out = new Float32Array(n * n)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let a = 0; for (let i = -r; i <= r; i++) a += h[y * n + Math.min(n - 1, Math.max(0, x + i))] * k[i + r]; tmp[y * n + x] = a / somma }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let a = 0; for (let i = -r; i <= r; i++) a += tmp[Math.min(n - 1, Math.max(0, y + i)) * n + x] * k[i + r]; out[y * n + x] = a / somma }
  return out
}

async function scrivi(sharp, nome, h) {
  const n = LATO
  const at = (x, y) => h[Math.min(n - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))]
  // il rilievo vero è di un paio di decimi di millimetro su 28 mm: le pendenze in unità del pixel
  const PROFONDO = 0.22 / (28 / n) // 1 in altezza = 0,22 mm, in pixel
  const col = Buffer.alloc(n * n * 3), nor = Buffer.alloc(n * n * 3), orm = Buffer.alloc(n * n * 3), fro = Buffer.alloc(n * n * 4)
  // la patina: quanto un punto è più basso di quello che ha attorno (i fondi fra i rilievi si sporcano, i rilievi si lucidano)
  const intorno = sfoca(h, n, 9)
  // la grana della carta e il tratto della matita, per il ricalco
  let seme = 4122
  const caso = () => { seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme / 0x7fffffff }
  const grana = new Float32Array(n * n).map(() => caso())
  const granaS = sfoca(grana, n, 0.8)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, u = (x + 0.5) / n * 2 - 1, v = (y + 0.5) / n * 2 - 1, r = Math.hypot(u, v)
    const dx = (at(x + 1, y) - at(x - 1, y)) * PROFONDO / 2, dy = (at(x, y + 1) - at(x, y - 1)) * PROFONDO / 2, len = Math.hypot(dx, dy, 1)
    nor[i * 3] = 128 + (-dx / len) * 127; nor[i * 3 + 1] = 128 + (dy / len) * 127; nor[i * 3 + 2] = 128 + (1 / len) * 127
    const fondo = Math.max(0, Math.min(1, (intorno[i] - h[i]) * 5)) // nei fondi
    const cima = Math.max(0, Math.min(1, (h[i] - intorno[i]) * 5)) // sulle creste
    // l'ottone: un oro caldo, scuro e bruno nei fondi, chiaro sulle creste consumate
    const k = 1 - 0.55 * fondo + 0.12 * cima
    col[i * 3] = Math.min(255, 214 * k + 8 * fondo); col[i * 3 + 1] = Math.min(255, 188 * k - 12 * fondo); col[i * 3 + 2] = Math.min(255, 126 * k - 16 * fondo)
    orm[i * 3] = 255; orm[i * 3 + 1] = 255 * (0.34 + 0.4 * fondo - 0.18 * cima); orm[i * 3 + 2] = 255 * (1 - 0.35 * fondo)
    // il ricalco a matita: la mina tocca le parti alte (rispetto al vicinato) e il bordo, a tratti obliqui
    const tratto = 0.5 + 0.5 * Math.sin((x + y * 0.35) * 1.9 + granaS[i] * 6)
    const tocco = Math.max(0, Math.min(1, 0.25 + (h[i] - intorno[i]) * 7 + h[i] * 0.35)) * (0.55 + 0.45 * tratto) * (0.75 + 0.5 * granaS[i])
    // la grafite: un grigio scuro, e quanto ce n'è nella trasparenza (sopra l'evidenziatore giallo resta matita)
    fro[i * 4] = 44; fro[i * 4 + 1] = 44; fro[i * 4 + 2] = 50; fro[i * 4 + 3] = r <= 0.995 ? Math.min(235, 255 * tocco) : 0
  }
  const file = (s) => join(OUT, `${nome}-${s}.webp`)
  await sharp(col, { raw: { width: n, height: n, channels: 3 } }).webp({ quality: 82, effort: 6 }).toFile(file('colore'))
  await sharp(nor, { raw: { width: n, height: n, channels: 3 } }).webp({ quality: 90, effort: 6 }).toFile(file('normali'))
  await sharp(orm, { raw: { width: n, height: n, channels: 3 } }).resize(512).webp({ quality: 80, effort: 6 }).toFile(file('lucido'))
  await sharp(fro, { raw: { width: n, height: n, channels: 4 } }).resize(360).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(file('frottage'))
  console.log(`  ✓ ${nome}: colore, normali, lucido, frottage`)
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'genera') await genera()
else if (cmd === 'recupera') { if (!arg) die('serve l\'id della predizione'); await salva(await prediction(arg), LAVORO, { foglio: 'moneta' }) }
else if (cmd === 'usa') await usa(arg)
else die('uso: facce.mjs genera | recupera <id> | usa [file.png]')
