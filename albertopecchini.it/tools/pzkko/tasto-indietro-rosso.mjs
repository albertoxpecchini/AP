#!/usr/bin/env node
// Il tasto di sotto (indietro) del cercapersone grande da verde a rosso come quello di sopra (29.10, Alberto: «fai anche
// tasto indietro rosso come chiudi così uno non lo preme perchè verde ma legge prima»). tasti-pager.mjs colora la gomma
// partendo dal PNG di Replicate, che non c'è più (tools/pzkko/lavoro non sta nel repository): questo script ricolora la
// grande già fatta (pager-grande.webp) e rifà la piccola come tasti-pager.mjs. tasti-pager.mjs ha già il rosso per tutti e
// due: rigenerando il cercapersone, questo non serve più.
//
//   node tools/pzkko/tasto-indietro-rosso.mjs   (dalla cartella albertopecchini.it)
//   --q=<n>          la qualità della grande (di serie 90)
//   --prova=<png>    scrive anche il ritaglio dei due tasti, ingrandito 2×, per guardarlo
//
// Il disco è quello misurato da tasti-pager.mjs il 23.10 (sotto: centro (1151,95; 541,56), raggio 59,38 px), con la stessa
// maschera (piena fino a 0,5 px oltre il bordo, sfumata a zero in 1,5 px). Il colore si rifà come in tasti-pager.mjs, ma
// partendo dal verde invece che dal grigio: in Lab ogni pixel perde lo spostamento di luminosità del verde e prende quello
// del rosso (la gomma grigia era L* 46,0; il verde #3d824f è L* 49, il rosso #c74337 L* 47,5), prende la tinta del rosso e
// un croma che sta a quello del rosso come il suo stava a quello del verde: la gomma piena diventa il rosso di sopra, e la
// vernice bianca della freccia, quasi senza croma, resta bianca. È una seconda generazione webp: la grande si scrive a
// quality 90 (la prima era 82), e lo script dice quanto è cambiato il resto della foto.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../package.json'))('sharp')
const ART = join(QUI, '../../pzkko/art/chat-pager-grande')
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const Q = Number(opz('q', 90)), PROVA = opz('prova')
const TASTO = { cx: 1151.95, cy: 541.56, r: 59.38 } // sotto, da tasti-pager.mjs
const L0 = 46.0 // la gomma grigia di sotto, prima del colore (tasti-pager.mjs)
const VERDE = '#3d824f', ROSSO = '#c74337'
const [PIENA, SFUMA] = [0.5, 1.5]

// ── colore: sRGB ↔ Lab (D65), come tasti-pager.mjs ──
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const gam = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
const K = 24389 / 27, E = 216 / 24389, BIANCO = [0.95047, 1, 1.08883]
const f = (t) => (t > E ? Math.cbrt(t) : (K * t + 16) / 116)
const fi = (t) => (t ** 3 > E ? t ** 3 : (116 * t - 16) / K)
function lab(r, g, b) {
  const [R, G, B] = [lin(r), lin(g), lin(b)]
  const fx = f((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / BIANCO[0])
  const fy = f(0.2126729 * R + 0.7151522 * G + 0.072175 * B)
  const fz = f((0.0193339 * R + 0.119192 * G + 0.9503041 * B) / BIANCO[2])
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
function lineare(L, a, b) {
  const fy = (L + 16) / 116
  const [X, Y, Z] = [fi(fy + a / 500) * BIANCO[0], fi(fy), fi(fy - b / 200) * BIANCO[2]]
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z]
}
function srgb(L, h, C) {
  const dentro = (c) => lineare(L, c * Math.cos(h), c * Math.sin(h)).every((v) => v >= -1e-7 && v <= 1 + 1e-7)
  if (!dentro(C)) { let [lo, hi] = [0, C]; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; dentro(m) ? (lo = m) : (hi = m) } C = lo }
  return lineare(L, C * Math.cos(h), C * Math.sin(h)).map((v) => gam(Math.min(1, Math.max(0, v))))
}
const daHex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const tinta = (s) => { const [L, a, b] = lab(...daHex(s)); return { L, C: Math.hypot(a, b), h: Math.atan2(b, a) } }
const [V, R] = [tinta(VERDE), tinta(ROSSO)]
/** il croma che tasti-pager.mjs dà alla luminosità L col colore t (va con la luminosità come in HSL) */
const cromaDi = (t, L) => t.C * (L <= t.L ? L / t.L : (100 - L) / (100 - t.L))

const file = join(ART, 'pager-grande.webp')
const prima = readFileSync(file)
const { data: px, info } = await sharp(prima).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const [W, H] = [info.width, info.height]
if (W !== 1341 || H !== 774) { console.error(`✗ la grande è ${W} × ${H}, non 1341 × 774: è un'altra foto, le quote non valgono`); process.exit(1) }

// la gomma deve essere ancora verde (non si ricolora due volte)
const t = TASTO, out = Buffer.from(px), dentro = []
for (let y = Math.floor(t.cy - t.r); y <= t.cy + t.r; y++) for (let x = Math.floor(t.cx - t.r); x <= t.cx + t.r; x++) if (Math.hypot(x + 0.5 - t.cx, y + 0.5 - t.cy) <= t.r - 3) dentro.push((y * W + x) * 4)
const hMedia = (b) => { let [sa, sb] = [0, 0]; for (const i of dentro) { const [, a, bb] = lab(b[i], b[i + 1], b[i + 2]); sa += a; sb += bb } return (Math.atan2(sb, sa) * 180) / Math.PI }
const h0 = hMedia(px)
if (Math.abs(h0 - (V.h * 180) / Math.PI) > 25) { console.error(`✗ la gomma di sotto ha tinta ${h0.toFixed(0)}°, non quella del verde (${((V.h * 180) / Math.PI).toFixed(0)}°): è già rossa?`); process.exit(1) }

const peso = (d) => Math.max(0, Math.min(1, (t.r + PIENA + SFUMA - d) / SFUMA))
const maschera = new Float32Array(W * H)
for (let y = Math.floor(t.cy - t.r - 3); y <= t.cy + t.r + 3; y++) for (let x = Math.floor(t.cx - t.r - 3); x <= t.cx + t.r + 3; x++) {
  const w = peso(Math.hypot(x + 0.5 - t.cx, y + 0.5 - t.cy))
  if (!w) continue
  const p = y * W + x, i = p * 4
  maschera[p] = w
  const [L, a, b] = lab(px[i], px[i + 1], px[i + 2])
  const L2 = Math.max(0, L - (V.L - R.L) * Math.min(1, L / L0)) // via lo spostamento del verde, dentro quello del rosso (i neri restano neri)
  const cv = cromaDi(V, L)
  const C2 = cv > 1 ? Math.min(Math.hypot(a, b) * (cromaDi(R, L2) / cv), cromaDi(R, L2) * 1.15) : cromaDi(R, L2) * (Math.hypot(a, b) / Math.max(1, cv))
  const nuovo = srgb(L2, R.h, C2)
  for (let c = 0; c < 3; c++) out[i + c] = Math.round(px[i + c] + (nuovo[c] - px[i + c]) * w)
}

const grande = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: Q, alphaQuality: 100, effort: 6 }).toBuffer()
const piccola = await sharp(grande).resize({ width: 336 }).webp({ quality: 88 }).toBuffer() // come tasti-pager.mjs

// quanto è cambiato il resto della foto (fuori dal tasto), e di che colore è venuta la gomma
const gn = await sharp(grande).ensureAlpha().raw().toBuffer()
let [fuori, cambiati, somma, massimo] = [0, 0, 0, 0]
for (let p = 0; p < W * H; p++) {
  const i = p * 4
  if (maschera[p] > 0 || !px[i + 3]) continue
  fuori++
  const d = Math.max(Math.abs(gn[i] - px[i]), Math.abs(gn[i + 1] - px[i + 1]), Math.abs(gn[i + 2] - px[i + 2]))
  if (d) cambiati++, (somma += d), (massimo = Math.max(massimo, d))
}
const media = (b, idx) => [0, 1, 2].map((c) => idx.reduce((s, i) => s + b[i + c], 0) / idx.length)
const sopra = [] // la gomma di sopra, per confronto (centro (1151,91; 356,65), raggio 58,90)
for (let y = 300; y <= 413; y++) for (let x = 1095; x <= 1209; x++) if (Math.hypot(x + 0.5 - 1151.91, y + 0.5 - 356.65) <= 55.9) sopra.push((y * W + x) * 4)
console.log(`gomma di sotto: ${hex(media(px, dentro))} → ${hex(media(gn, dentro))} (quella di sopra è ${hex(media(gn, sopra))}; con le vernici dentro, la media è indicativa)`)
console.log(`fuori dal tasto: cambiati ${cambiati} px su ${fuori} (${((100 * cambiati) / fuori).toFixed(1).replace('.', ',')} %), di ${(somma / Math.max(1, cambiati)).toFixed(2).replace('.', ',')} livelli in media, al massimo ${massimo}`)
await writeFile(file, grande)
await writeFile(join(ART, 'pager-piccolo.webp'), piccola)
console.log(`✓ ${file}: webp ${Q}, ${grande.length} B (prima ${prima.length} B)`)
console.log(`✓ ${join(ART, 'pager-piccolo.webp')}: ${piccola.length} B`)
if (PROVA) { await sharp(grande).extract({ left: 1060, top: 260, width: 190, height: 380 }).resize({ width: 380 }).png().toFile(PROVA); console.log(`  il ritaglio: ${PROVA}`) }
