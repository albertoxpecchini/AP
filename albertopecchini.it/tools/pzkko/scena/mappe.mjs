#!/usr/bin/env node
// Le mappe della lamiera per la scena 3D (pzkko/scena/): dalla foto della
// saracinesca (pzkko/art/muro.webp, luce piatta con le doghe in ombra) si toglie
// la luce che c'è dentro, così la luce vera la mette la scena sulle doghe fatte di
// poligoni. La foto si ripete in orizzontale specchiata e in verticale a doghe
// intere (13 doghe in 1475 px), come la lamiera della pagina.
//
//   node tools/pzkko/scena/mappe.mjs      (dalla cartella albertopecchini.it)
//
// Scrive in pzkko/art/scena/:
//   lamiera.webp     il colore senza ombre (2048 px): sporco, ruggine, resti di nastro
//   lamiera-r.webp   la rugosità (1024 px, grigio): la vernice è liscia, lo sporco e
//                    la ruggine no
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')
const ART = join(QUI, '../../../pzkko/art')
const OUT = join(ART, 'scena')
await mkdir(OUT, { recursive: true })

const { data, info } = await sharp(join(ART, 'muro.webp')).raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info
const lum = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]

// la luce che c'è dentro la foto: la media di ogni riga (l'ombra delle doghe è uguale
// lungo tutta la riga) e, più larga, la media di ogni colonna (la foto è quasi piatta,
// ma un filo di gradiente c'è)
const riga = new Float32Array(H), col = new Float32Array(W)
for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) s += lum((y * W + x) * C); riga[y] = s / W }
for (let x = 0; x < W; x++) { let s = 0; for (let y = 0; y < H; y++) s += lum((y * W + x) * C); col[x] = s / H }
// le colonne: solo la tendenza larga (media mobile di 200 px)
const colL = new Float32Array(W)
for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let k = -100; k <= 100; k++) { const j = x + k; if (j >= 0 && j < W) { s += col[j]; n++ } } colL[x] = s / n }
let media = 0; for (let y = 0; y < H; y++) media += riga[y]; media /= H
let mediaC = 0; for (let x = 0; x < W; x++) mediaC += colL[x]; mediaC /= W

// il colore della vernice, senza ombre: ogni pixel diviso per la luce della sua riga e
// della sua colonna; poi un filo più chiaro e meno azzurro, come la vernice di giorno
const alb = Buffer.alloc(W * H * 3)
const rug = Buffer.alloc(W * H)
for (let y = 0; y < H; y++) {
  const fy = media / Math.max(40, riga[y])
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C, o = (y * W + x) * 3
    const f = fy * (mediaC / Math.max(40, colL[x]))
    const r = data[i] * f, g = data[i + 1] * f, b = data[i + 2] * f
    alb[o] = Math.min(255, r * 1.02); alb[o + 1] = Math.min(255, g * 1.0); alb[o + 2] = Math.min(255, b * 0.96)
    // rugosità: la vernice chiara è liscia (~0.45), lo sporco scuro e la ruggine (rosso > blu) sono ruvidi
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const ruggine = Math.max(0, (r - b) / 255 - 0.05) * 3
    rug[y * W + x] = Math.round(255 * Math.min(1, Math.max(0, 0.42 + (0.75 - l) * 1.1 + ruggine)))
  }
}
await sharp(alb, { raw: { width: W, height: H, channels: 3 } }).resize(2048).webp({ quality: 86 }).toFile(join(OUT, 'lamiera.webp'))
await sharp(rug, { raw: { width: W, height: H, channels: 1 } }).blur(1.5).resize(1024).webp({ quality: 80 }).toFile(join(OUT, 'lamiera-r.webp'))
console.log(`scritte lamiera.webp e lamiera-r.webp in ${OUT} (luce media ${media.toFixed(1)})`)
