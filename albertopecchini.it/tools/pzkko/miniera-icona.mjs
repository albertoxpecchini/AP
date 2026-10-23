// L'icona dell'app Miniera per la home del cercapersone grande (23.10): la piastrella-adesivo come le altre app (art/chat-app/,
// quelle di Replicate), ma disegnata in codice a pixel, come tutta la miniera (pzkko/chat/miniera-pixel.js): il bordo bianco
// dell'adesivo, il contorno nero, il fondo pieno e sopra il PC che mina (lo schermo col grafico che sale), il piccone e la
// moneta $pzk. 48 × 45 pixel logici ingranditi 4 volte = 192 × 180, con 4 pixel vuoti intorno come le altre app-*.webp
// (misurate: 188–194 × 178–184, margini di 3–4 pixel).
//   node tools/pzkko/miniera-icona.mjs [--anteprima=<file.png>]
// Scrive pzkko/art/chat-miniera/app-miniera.webp (in icone.js: il foglio «chat-miniera»).
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../package.json'))('sharp')
const W = 48, H = 45, SCALA = 4
const DOVE = join(QUI, '../../pzkko/art/chat-miniera/app-miniera.webp')

// i colori (quelli della miniera a pixel)
const BIANCO = 0xf6f4ee, NERO = 0x111014, OUT = 0x16121c
const FONDO = 0x8a4fd8, FONDO_S = 0x6f3cb8 // il fondo della piastrella: viola (le altre app hanno già verde, arancio, blu…)
const CORNICE = 0x2a2833, CORNICE_C = 0x3d3a4a, SCH = 0x06140b, VERDE = 0x3be36b, VERDE_S = 0x1d7f3e, GIALLO = 0xd8f25a
const LEGNO = 0xb07a43, LEGNO_S = 0x7a4f27, ACCIAIO = 0xc0c5cd, ACCIAIO_S = 0x8e949e
const ORO = 0xf0c040, ORO_S = 0xb5862a, ORO_C = 0xffe9a0

const px = new Int32Array(W * H).fill(-1)
const P = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = c }
const rett = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c) }
const scatola = (x, y, w, h, c) => { rett(x, y, w, h, OUT); rett(x + 1, y + 1, w - 2, h - 2, c) }
const linea = (x0, y0, x1, y1, c) => { const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (;;) { P(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } } }
const sprite = (x, y, righe, tav) => righe.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && tav[ch] != null) P(x + i, y + j, tav[ch]) }))
/** Il rettangolo con gli angoli tondi (raggio r), pixel per pixel: dentro se il centro del pixel ci sta. */
const tondo = (x0, y0, w, h, r, c) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const cx = Math.min(Math.max(x + 0.5, x0 + r), x0 + w - r), cy = Math.min(Math.max(y + 0.5, y0 + r), y0 + h - r)
    if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) P(x, y, c)
  }
}

// ── la piastrella: il bianco dell'adesivo (2), il contorno nero (2), il fondo con l'ombra in basso ──
tondo(1, 1, 46, 43, 7, BIANCO)
tondo(3, 3, 42, 39, 5, NERO)
tondo(5, 5, 38, 35, 3, FONDO)
rett(6, 36, 36, 3, FONDO_S); tondo(5, 5, 38, 31, 3, FONDO) // la fascia scura in fondo, come il pavimento

// ── il piccone, dietro al PC: il manico di legno in diagonale (spunta in basso a sinistra e in alto a destra) e il ferro
// curvo di traverso in cima, con le punte piegate verso il manico. Il ferro è una maschera col contorno calcolato.
for (let k = 0; k < 29; k++) { const x = 9 + k, y = 38 - k; P(x - 1, y, OUT); P(x, y, LEGNO); P(x + 1, y, LEGNO_S); P(x + 2, y, OUT) }
P(8, 39, OUT); P(9, 39, OUT); P(10, 39, OUT) // il fondo del manico
{
  const cx = 37.5, cy = 10.5, ferro = (x, y) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx + dy) / Math.SQRT2, v = (dx - dy) / Math.SQRT2
    const lato = Math.abs(u) / 7.2
    if (lato > 1) return 0
    const mezzo = v - (0.9 - 2.2 * lato * lato), spess = 1.5 * Math.sqrt(1 - lato * lato) + 0.25
    return Math.abs(mezzo) <= spess ? (mezzo > 0.4 ? 2 : 1) : 0
  }
  const dentro = (x, y) => ferro(x, y) > 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (dentro(x, y)) P(x, y, ferro(x, y) === 2 ? 0xe4e8ee : ACCIAIO)
    else if (dentro(x - 1, y) || dentro(x + 1, y) || dentro(x, y - 1) || dentro(x, y + 1)) P(x, y, OUT)
  }
  P(36, 11, ACCIAIO_S); P(37, 10, ACCIAIO_S); P(36, 10, ACCIAIO_S) // l'occhio dove entra il manico
}

// ── il PC: lo schermo con la schermata da miner, il collo e il piede ──
scatola(8, 10, 25, 19, CORNICE)
rett(9, 11, 23, 1, CORNICE_C)
rett(10, 12, 21, 13, SCH)
for (const [x, y, n] of [[11, 13, 6], [13, 15, 9], [13, 17, 5]]) { rett(x, y, 2, 1, VERDE); rett(x + 2, y, n - 2, 1, VERDE_S) }
// il grafico che sale, in giallo
let prima = 23
for (let i = 0; i < 19; i++) { const y = Math.round(23 - (i / 18) ** 1.6 * 10); for (let j = Math.min(prima, y); j <= Math.max(prima, y); j++) P(11 + i, j, GIALLO); prima = y }
rett(11, 24, 19, 1, VERDE_S)
P(29, 26, VERDE) // la lucina accesa
sprite(17, 29, ['oCCCo', 'oCCCo', 'oCCCo'], { o: OUT, C: CORNICE_C })
sprite(13, 32, ['.ooooooooooo.', 'oCCCCCCCCCCCo', 'ooooooooooooo'], { o: OUT, C: CORNICE_C })

// ── la moneta $pzk davanti, in basso a destra ──
const mx = 34.5, my = 30.5
for (let y = 22; y < 40; y++) for (let x = 25; x < 44; x++) {
  const d = Math.hypot(x + 0.5 - mx, y + 0.5 - my)
  if (d <= 8.6) P(x, y, d > 7.6 ? OUT : d > 6.4 ? ORO_S : ORO)
}
sprite(32, 25, [
  '..o..',
  '.ooo.',
  'oo...',
  '.ooo.',
  '...oo',
  '.ooo.',
  '..o..',
], { o: ORO_S })
P(31, 25, ORO_C); P(30, 26, ORO_C); P(30, 27, ORO_C) // il riflesso

// ── l'esportazione: 4 × 4 pixel veri per ogni pixel, trasparente intorno ──
const raw = Buffer.alloc(W * SCALA * H * SCALA * 4)
for (let y = 0; y < H * SCALA; y++) for (let x = 0; x < W * SCALA; x++) {
  const c = px[Math.floor(y / SCALA) * W + Math.floor(x / SCALA)], o = (y * W * SCALA + x) * 4
  if (c >= 0) { raw[o] = (c >> 16) & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = c & 255; raw[o + 3] = 255 }
}
const img = () => sharp(raw, { raw: { width: W * SCALA, height: H * SCALA, channels: 4 } })
mkdirSync(dirname(DOVE), { recursive: true })
await img().webp({ lossless: true }).toFile(DOVE)
const ant = process.argv.find((a) => a.startsWith('--anteprima='))?.slice(12)
if (ant) await img().png().toFile(ant)
console.log(`scritta ${DOVE} (${W * SCALA} × ${H * SCALA})`)
