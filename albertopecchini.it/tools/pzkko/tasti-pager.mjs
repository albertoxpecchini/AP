#!/usr/bin/env node
// I due tasti del cercapersone grande di pzkko.it colorati: quello di sopra ROSSO (chiudi), quello di sotto VERDE
// (indietro). gpt-image-2 li disegna di gomma grigia (foglio «chat-pager-grande» di fogli-chat.js): questo script rifà
// pager-grande.webp dal PNG di Replicate con la stessa catena di `immagini.mjs usa` (chiave cromatica, ritaglio,
// riduzione a 0,75 con lanczos3, webp 82), ma ricolora la gomma PRIMA della compressione; poi rifà la piccola (il
// cercapersone sotto il wallet, .chat-tasto). Sulla gomma stampa anche i simboli (spegni e indietro, art/chat-pager-simboli/,
// vedi «i simboli stampati sulla gomma»). Va lanciato dopo ogni nuova generazione, dopo
// `node tools/pzkko/immagini.mjs usa chat-pager-grande` (che scrive la grande grigia e le misure in pezzi.json).
//
//   node tools/pzkko/tasti-pager.mjs                (dalla cartella albertopecchini.it)
//   --png=<file>     il PNG di Replicate (di serie l'ultimo di tools/pzkko/lavoro/chat-pager-grande/, come `usa`)
//   --a=<cartella>   dove scrivere pager-grande.webp e pager-piccolo.webp (di serie pzkko/art/chat-pager-grande)
//   --lossless       la grande senza compressione, per le prove (~780 KB invece di ~143)
//
// Le quote non sono a occhio, si misurano ogni volta sulla foto ridotta (1341 × 774, prima della compressione). I
// tasti sono le due macchie di gomma (luminosità ≥ 80 su 255, pixel pieni) nella striscia a destra dello schermo,
// larghe quanto alte e piene come un disco. Il bordo di ogni gomma si cerca su 720 raggi (uno ogni mezzo grado): è il
// punto in cui la luminosità scende sotto la metà fra la gomma (mediana del disco) e l'anello scuro incassato che la
// circonda, interpolato sotto il pixel; sui 720 punti si stima il cerchio ai minimi quadrati. Sulla foto del 23.10
// (i pixel hanno il centro a +0,5):
//   sopra  centro (1151,91; 356,65) raggio 58,90 px → left 81,507 %, top 38,468 %, width 8,785 % (scarto rms 0,36 px)
//   sotto  centro (1151,95; 541,56) raggio 59,38 px → left 81,475 %, top 62,298 %, width 8,855 % (scarto rms 0,34 px)
// I tasti di telefono/telefono.css, un solo left e una sola larghezza per i due, ne sono la media: left 81,490 %,
// width 8,821 %, top 38,440 % e 62,328 % (centri (1151,93; 356,67) e (1151,93; 541,56), raggio 59,14 px).
//
// Il colore: in Lab (D65) ogni pixel tiene la sua luminosità L* (le luci, le ombre e la grana della gomma), spostata
// appena perché la media arrivi a quella del colore scelto (la gomma grigia è L* 47,2 sopra e 46,0 sotto), e prende la
// tinta di quel colore; il croma va con la luminosità come in HSL (le ombre del bordo restano scure, il lucido in alto
// a sinistra resta chiaro e meno carico) e se esce dal gamut sRGB si riduce. La maschera è il disco misurato, piena
// fino a mezzo pixel oltre il bordo e sfumata a zero in 1,5 px: copre i pixel a metà fra gomma e anello scuro (che
// restano scuri: il croma va con la luminosità), si ferma prima del bordino lucido (che comincia 6,7 px oltre il bordo
// sopra e 6,8 sotto: lo script lo misura e si ferma se è più vicino di 3 px) e non tocca il led né la plastica.
//
// Il formato: la grande è webp lossy con i parametri di immagini.mjs (scriviWebp: quality 82, alphaQuality 100,
// effort 6). Senza il colore la catena rifà la grande grigia del 23.10 byte per byte: lo script la comprime anche
// così e ci confronta la nuova. La foto resta di prima generazione, alla stessa qualità di prima; il rumore di
// compressione invece è un altro, perché il webp lossy predice ogni blocco dai vicini e il cambiamento dei tasti si
// spande in basso a destra (il 31 % dei pixel fuori dai tasti, di 2,7 livelli in media, al massimo 27). Ricomprimere
// la grande già scritta sarebbe peggio (seconda generazione: tre pixel su quattro, fino a 59 livelli). Lo script misura
// anche la frangia: il croma in più che la crominanza dimezzata del webp porta nella corona scura fra la gomma e il
// bordino lucido (il 23.10: +1 in media, al massimo +9 su pixel quasi neri, L* 6: non si vede nemmeno a 8×).
// La piccola si fa come quella del 23.10: sharp(grande).resize({ width: 336 }).webp({ quality: 88 }) con le altre
// opzioni di serie (effort 4, alphaQuality 100); rifatta così dalla grande grigia è identica a quella byte per byte.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chiave, fondoMagenta, leggiA } from '../mascotte/immagine.mjs'
import { FOGLI } from './fogli.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../package.json'))('sharp')
const NOME = 'chat-pager-grande', FOGLIO = FOGLI[NOME]
const ART = join(QUI, '../../pzkko/art', NOME)
const LAVORO = join(QUI, 'lavoro', NOME)
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const ultimoPng = () => { const p = existsSync(LAVORO) && readdirSync(LAVORO).filter((f) => f.endsWith('.png')).sort().at(-1); return p ? join(LAVORO, p) : null }
const PNG = opz('png') ? resolve(opz('png')) : ultimoPng()
const A = resolve(opz('a', ART))
const LOSSLESS = process.argv.includes('--lossless')
const WEBP = LOSSLESS ? { lossless: true, quality: 100, effort: 6 } : { quality: 82, alphaQuality: 100, effort: 6 } // come scriviWebp in immagini.mjs
const PICCOLA = 336 // larghezza della piccola (index.html: <img width="336" height="194">)
if (!PNG || !existsSync(PNG)) { console.error(`✗ manca il PNG di Replicate (${PNG ?? LAVORO}): node tools/pzkko/immagini.mjs genera ${NOME}, o --png=<file>`); process.exit(1) }

// il colore medio che deve avere la gomma: rosso e verde da gomma vera, più profondi del --rosso (#ff5b4a) e del --led
// (#46ff7d) della pagina
const TASTI = [
  { nome: 'sopra', fa: 'chiudi', colore: '#c74337' }, // L* 47,5, croma 63, tinta 35°: il rosso di un tasto d'accensione
  { nome: 'sotto', fa: 'indietro', colore: '#3d824f' }, // L* 49, croma 40, tinta 148°: il verde di un vecchio apparecchio
]

// ── colore: sRGB ↔ Lab (D65) ──────────────────────────────────────────────────────────────────────────────────────
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
function lineare(L, a, b) { // Lab → sRGB lineare, anche fuori da [0, 1]
  const fy = (L + 16) / 116
  const [X, Y, Z] = [fi(fy + a / 500) * BIANCO[0], fi(fy), fi(fy - b / 200) * BIANCO[2]]
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z]
}
/** sRGB (0–255, non arrotondato) di luminosità L, tinta h, croma C: il croma cala finché il colore sta nel gamut. */
function srgb(L, h, C) {
  const dentro = (c) => lineare(L, c * Math.cos(h), c * Math.sin(h)).every((v) => v >= -1e-7 && v <= 1 + 1e-7)
  if (!dentro(C)) { let [lo, hi] = [0, C]; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; dentro(m) ? (lo = m) : (hi = m) } C = lo }
  return lineare(L, C * Math.cos(h), C * Math.sin(h)).map((v) => gam(Math.min(1, Math.max(0, v))))
}
const croma = (d, i) => { const [, a, b] = lab(d[i], d[i + 1], d[i + 2]); return Math.hypot(a, b) }
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const daHex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))

// ── la foto come la fa `immagini.mjs usa` (usaGriglia), fino a prima della compressione ─────────────────────────────
// componenti() ed estrai() sono copiate da tools/pzkko/immagini.mjs, che non le esporta
const BORDO = [120, 120, 118], B = 4, MIN = FOGLIO.briciole ?? 40
function componenti({ w, h, px }) {
  const [gw, gh] = [Math.ceil(w / B), Math.ceil(h / B)]
  const pieno = new Uint8Array(gw * gh)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) pieno[((y / B) | 0) * gw + ((x / B) | 0)] = 1
  const label = new Int32Array(gw * gh).fill(-1)
  const comps = []
  for (let s = 0; s < gw * gh; s++) {
    if (!pieno[s] || label[s] !== -1) continue
    const c = { id: comps.length, n: 0, x0: gw, y0: gh, x1: 0, y1: 0 }
    comps.push(c)
    const stack = [s]
    label[s] = c.id
    while (stack.length) {
      const p = stack.pop()
      const [x, y] = [p % gw, (p / gw) | 0]
      c.n++
      c.x0 = Math.min(c.x0, x), (c.y0 = Math.min(c.y0, y)), (c.x1 = Math.max(c.x1, x)), (c.y1 = Math.max(c.y1, y))
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const [nx, ny] = [x + dx, y + dy]
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
        const q = ny * gw + nx
        if (pieno[q] && label[q] === -1) (label[q] = c.id), stack.push(q)
      }
    }
  }
  return { comps, label, gw, gh }
}
function estrai(img, { label, gw }, mie, pad = 6) {
  const { w, h, px } = img
  const set = new Set(mie.map((c) => c.id))
  const x0 = Math.max(0, Math.min(...mie.map((c) => c.x0)) * B - pad)
  const y0 = Math.max(0, Math.min(...mie.map((c) => c.y0)) * B - pad)
  const x1 = Math.min(w, (Math.max(...mie.map((c) => c.x1)) + 1) * B + pad)
  const y1 = Math.min(h, (Math.max(...mie.map((c) => c.y1)) + 1) * B + pad)
  const [cw, ch] = [x1 - x0, y1 - y0]
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const [sx, sy] = [x0 + x, y0 + y]
    let mio = false
    for (let dy = -1; dy <= 1 && !mio; dy++) for (let dx = -1; dx <= 1 && !mio; dx++) {
      const [bx, by] = [((sx / B) | 0) + dx, ((sy / B) | 0) + dy]
      if (bx >= 0 && by >= 0 && bx < gw && set.has(label[by * gw + bx])) mio = true
    }
    const i = (sy * w + sx) * 4, o = (y * cw + x) * 4
    out[o] = px[i], (out[o + 1] = px[i + 1]), (out[o + 2] = px[i + 2]), (out[o + 3] = mio ? px[i + 3] : 0)
  }
  return { w: cw, h: ch, px: out }
}
const foglio = await leggiA(PNG)
if (!fondoMagenta(foglio)) { console.error(`✗ ${PNG} non è su fondo magenta`); process.exit(1) }
chiave(foglio, BORDO)
const trovati = componenti(foglio)
const pezzo = estrai(foglio, trovati, trovati.comps.filter((c) => c.n >= MIN)) // griglia 1 × 1: tutto quello che non è briciola
const [W, H] = [Math.round(pezzo.w * FOGLIO.scala), Math.round(pezzo.h * FOGLIO.scala)]
const RAW = { raw: { width: W, height: H, channels: 4 } }
const px = await sharp(pezzo.px, { raw: { width: pezzo.w, height: pezzo.h, channels: 4 } }).resize(W, H, { kernel: 'lanczos3' }).raw().toBuffer()

// ── misura ────────────────────────────────────────────────────────────────────────────────────────────────────────
const Y = new Float32Array(W * H)
for (let p = 0; p < W * H; p++) Y[p] = 0.2126 * px[p * 4] + 0.7152 * px[p * 4 + 1] + 0.0722 * px[p * 4 + 2]
/** luminosità nel punto (u, v) della foto (i centri dei pixel stanno a +0,5), bilineare */
function Yb(u, v) {
  const [x, y] = [u - 0.5, v - 0.5], [x0, y0] = [Math.floor(x), Math.floor(y)], [tx, ty] = [x - x0, y - y0]
  const q = (a, b) => Y[Math.min(H - 1, Math.max(0, b)) * W + Math.min(W - 1, Math.max(0, a))]
  return (q(x0, y0) * (1 - tx) + q(x0 + 1, y0) * tx) * (1 - ty) + (q(x0, y0 + 1) * (1 - tx) + q(x0 + 1, y0 + 1) * tx) * ty
}
const mediana = (a) => { const s = Float64Array.from(a).sort(); return s[s.length >> 1] }

// 1. le macchie di gomma: componenti connesse (4 vicini) dei pixel pieni con luminosità ≥ 80, nel terzo destro
const gomma = new Uint8Array(W * H), visto = new Uint8Array(W * H), macchie = []
for (let y = 0; y < H; y++) for (let x = Math.floor(W * 0.7); x < W; x++) { const p = y * W + x; if (px[p * 4 + 3] === 255 && Y[p] >= 80) gomma[p] = 1 }
for (let s = 0; s < W * H; s++) {
  if (!gomma[s] || visto[s]) continue
  const m = { n: 0, sx: 0, sy: 0, x0: W, y0: H, x1: 0, y1: 0, pixel: [] }, pila = [s]
  visto[s] = 1
  while (pila.length) {
    const p = pila.pop(), [x, y] = [p % W, (p / W) | 0]
    m.n++, (m.sx += x + 0.5), (m.sy += y + 0.5), m.pixel.push(p)
    m.x0 = Math.min(m.x0, x), (m.y0 = Math.min(m.y0, y)), (m.x1 = Math.max(m.x1, x)), (m.y1 = Math.max(m.y1, y))
    for (const q of [x > 0 && p - 1, x < W - 1 && p + 1, y > 0 && p - W, y < H - 1 && p + W]) if (q !== false && gomma[q] && !visto[q]) (visto[q] = 1), pila.push(q)
  }
  const [bw, bh] = [m.x1 - m.x0 + 1, m.y1 - m.y0 + 1]
  if (m.n >= 1500 && bw / bh > 0.85 && bw / bh < 1.18 && m.n / ((Math.PI * bw * bh) / 4) > 0.85) macchie.push(m)
}
if (macchie.length !== 2) { console.error(`✗ cercavo 2 tasti di gomma, ne ho trovati ${macchie.length}: la foto è cambiata?`); process.exit(1) }
macchie.sort((a, b) => a.sy - b.sy)

/** Il bordo su 720 raggi dal centro (cx, cy): dove la luminosità scende sotto T, e dove risale (il bordino lucido). */
function raggi(cx, cy, r0, T) {
  const punti = []
  for (let k = 0; k < 720; k++) {
    const t = (k / 720) * 2 * Math.PI, [dx, dy] = [Math.cos(t), Math.sin(t)]
    let [rp, yp] = [0.6 * r0, Yb(cx + dx * 0.6 * r0, cy + dy * 0.6 * r0)], bordo = null, fuori = null
    for (let r = rp + 0.05; r < r0 + 20; r += 0.05) {
      const y = Yb(cx + dx * r, cy + dy * r)
      if (bordo === null && yp >= T && y < T) bordo = rp + ((r - rp) * (yp - T)) / (yp - y)
      else if (bordo !== null && y >= T) { fuori = r; break }
      ;[rp, yp] = [r, y]
    }
    if (bordo !== null) punti.push({ t, r: bordo, x: cx + dx * bordo, y: cy + dy * bordo, varco: fuori === null ? Infinity : fuori - bordo })
  }
  return punti
}
/** Il cerchio dei minimi quadrati per i punti (metodo di Bullock, coordinate centrate). */
function cerchio(punti) {
  const n = punti.length, mx = punti.reduce((s, p) => s + p.x, 0) / n, my = punti.reduce((s, p) => s + p.y, 0) / n
  let [uu, uv, vv, uuu, vvv, uvv, vuu] = [0, 0, 0, 0, 0, 0, 0]
  for (const p of punti) { const [u, v] = [p.x - mx, p.y - my]; uu += u * u, (uv += u * v), (vv += v * v), (uuu += u ** 3), (vvv += v ** 3), (uvv += u * v * v), (vuu += v * u * u) }
  const [bu, bv] = [(uuu + uvv) / 2, (vvv + vuu) / 2], det = uu * vv - uv * uv
  const [uc, vc] = [(bu * vv - bv * uv) / det, (uu * bv - uv * bu) / det]
  return { cx: uc + mx, cy: vc + my, r: Math.sqrt(uc * uc + vc * vc + (uu + vv) / n) }
}

const misure = macchie.map((m, i) => {
  const yGomma = mediana(m.pixel.map((p) => Y[p]))
  let c = { cx: m.sx / m.n, cy: m.sy / m.n, r: Math.sqrt(m.n / Math.PI) }
  let T = yGomma / 2
  for (let giro = 0; giro < 3; giro++) {
    c = cerchio(raggi(c.cx, c.cy, c.r, T))
    // l'anello: la mediana della corona da 1,5 a 3,5 px fuori dal bordo; la soglia sta a metà fra gomma e anello
    const anello = []
    for (let y = Math.floor(c.cy - c.r - 5); y <= c.cy + c.r + 5; y++) for (let x = Math.floor(c.cx - c.r - 5); x <= c.cx + c.r + 5; x++) {
      const d = Math.hypot(x + 0.5 - c.cx, y + 0.5 - c.cy) - c.r
      if (d >= 1.5 && d <= 3.5) anello.push(Y[y * W + x])
    }
    T = (yGomma + mediana(anello)) / 2
  }
  const punti = raggi(c.cx, c.cy, c.r, T), fine = cerchio(punti)
  const res = punti.map((p) => Math.hypot(p.x - fine.cx, p.y - fine.cy) - fine.r)
  return { ...TASTI[i], ...fine, T, yGomma, punti: punti.length, rms: Math.sqrt(res.reduce((s, v) => s + v * v, 0) / res.length), resMax: Math.max(...res.map(Math.abs)), varco: Math.min(...punti.map((p) => p.varco)) }
})

// ── maschera e colore ─────────────────────────────────────────────────────────────────────────────────────────────
const [PIENA, SFUMA] = [0.5, 1.5] // piena fino a 0,5 px oltre il bordo, poi a zero in 1,5 px
const peso = (d, r) => Math.max(0, Math.min(1, (r + PIENA + SFUMA - d) / SFUMA))
const out = Buffer.from(px)
const maschera = new Float32Array(W * H)
for (const t of misure) {
  if (t.varco < PIENA + SFUMA + 1) { console.error(`✗ tasto ${t.nome}: il bordino lucido comincia a ${t.varco.toFixed(1)} px dalla gomma, la sfumatura lo toccherebbe`); process.exit(1) }
  // la gomma com'è: luminosità e croma medi del disco pieno (fino a 3 px dal bordo)
  const dentro = []
  for (let y = Math.floor(t.cy - t.r); y <= t.cy + t.r; y++) for (let x = Math.floor(t.cx - t.r); x <= t.cx + t.r; x++) if (Math.hypot(x + 0.5 - t.cx, y + 0.5 - t.cy) <= t.r - 3) dentro.push((y * W + x) * 4)
  const labs = dentro.map((i) => lab(px[i], px[i + 1], px[i + 2]))
  const L0 = labs.reduce((s, v) => s + v[0], 0) / labs.length, C0 = labs.reduce((s, v) => s + Math.hypot(v[1], v[2]), 0) / labs.length
  if (C0 > 8) { console.error(`✗ tasto ${t.nome}: la gomma del PNG non è grigia (croma medio ${C0.toFixed(1).replace('.', ',')})`); process.exit(1) }
  const [Lt, at, bt] = lab(...daHex(t.colore)), [h, Ct] = [Math.atan2(bt, at), Math.hypot(at, bt)]
  const dL = Lt - L0
  for (let y = Math.floor(t.cy - t.r - 3); y <= t.cy + t.r + 3; y++) for (let x = Math.floor(t.cx - t.r - 3); x <= t.cx + t.r + 3; x++) {
    const w = peso(Math.hypot(x + 0.5 - t.cx, y + 0.5 - t.cy), t.r)
    if (!w) continue
    const p = y * W + x, i = p * 4
    maschera[p] = Math.max(maschera[p], w)
    const L = lab(px[i], px[i + 1], px[i + 2])[0]
    const L2 = Math.min(100, L + dL * Math.min(1, L / L0)) // i neri dell'anello restano neri
    const nuovo = srgb(L2, h, Ct * (L2 <= Lt ? L2 / Lt : (100 - L2) / (100 - Lt)))
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(px[i + c] + (nuovo[c] - px[i + c]) * w)
  }
  Object.assign(t, { L0, C0, Lt, dentro })
}

// ── i simboli stampati sulla gomma (23.10, Alberto: «per sicurezza»; e «una cosa unica» con la foto, così ci sono anche
// da chiuso, nella piccola e nel doppione dello zoom, e non arrivano dopo) ──────────────────────────────────────────
// L'accensione sul rosso (chiudi), la freccia indietro sul verde: art/chat-pager-simboli/ (gpt-image-2, foglio
// «chat-pager-simboli» di fogli-chat.js), vernice bianco sporco. Stessa scala per tutti e due, così il tratto è uguale:
// l'inchiostro dell'accensione (alto 224 px) è alto il 42 % del diametro. Il centro della scatola d'inchiostro va sul
// centro del cerchio misurato, sotto il pixel: ogni pixel della foto è la media di 6 × 6 campioni bilineari del simbolo
// (alfa premoltiplicata). La vernice prende la luce della cupola: il suo colore per la luminosità della gomma grigia in
// quel punto, divisa per la mediana della gomma.
const SIMBOLI = { chiudi: { file: 'spegni', centro: [106, 116] }, indietro: { file: 'indietro', centro: [123, 83] } } // centri dell'inchiostro, misurati
const [ALTO, INCHIOSTRO, CAMPIONI] = [0.42, 224, 6]
for (const t of misure) {
  const s = SIMBOLI[t.fa]
  const { data: sp, info: si } = await sharp(join(QUI, '../../pzkko/art/chat-pager-simboli', `${s.file}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const k = (ALTO * 2 * t.r) / INCHIOSTRO // pixel della foto per pixel del simbolo
  const px4 = (x, y) => { if (x < 0 || y < 0 || x >= si.width || y >= si.height) return [0, 0, 0, 0]; const i = (y * si.width + x) * 4, a = sp[i + 3] / 255; return [sp[i] * a, sp[i + 1] * a, sp[i + 2] * a, a] }
  const leggi = (u, v) => {
    const [x, y] = [u - 0.5, v - 0.5], [x0, y0] = [Math.floor(x), Math.floor(y)], [tx, ty] = [x - x0, y - y0]
    const [a, b, c, d] = [px4(x0, y0), px4(x0 + 1, y0), px4(x0, y0 + 1), px4(x0 + 1, y0 + 1)]
    return a.map((_, j) => (a[j] * (1 - tx) + b[j] * tx) * (1 - ty) + (c[j] * (1 - tx) + d[j] * tx) * ty)
  }
  let [inchiostro, xa, xb, ya, yb] = [0, W, 0, H, 0], stampati = new Set()
  for (let y = Math.floor(t.cy - s.centro[1] * k) - 1; y <= Math.ceil(t.cy + (si.height - s.centro[1]) * k) + 1; y++) {
    for (let x = Math.floor(t.cx - s.centro[0] * k) - 1; x <= Math.ceil(t.cx + (si.width - s.centro[0]) * k) + 1; x++) {
      const acc = [0, 0, 0, 0]
      for (let j = 0; j < CAMPIONI; j++) for (let i = 0; i < CAMPIONI; i++) {
        const v = leggi(s.centro[0] + (x + (i + 0.5) / CAMPIONI - t.cx) / k, s.centro[1] + (y + (j + 0.5) / CAMPIONI - t.cy) / k)
        for (let c = 0; c < 4; c++) acc[c] += v[c]
      }
      const a = acc[3] / CAMPIONI ** 2
      if (a < 1 / 255) continue
      const p = y * W + x, o = p * 4, luce = Math.min(1.2, Math.max(0.55, Y[p] / t.yGomma))
      stampati.add(o)
      for (let c = 0; c < 3; c++) out[o + c] = Math.round(out[o + c] * (1 - a) + Math.min(255, (acc[c] / acc[3]) * luce) * a)
      if (a > 0.5) inchiostro++, (xa = Math.min(xa, x)), (xb = Math.max(xb, x)), (ya = Math.min(ya, y)), (yb = Math.max(yb, y))
    }
  }
  t.simbolo = { file: s.file, k, inchiostro, scatola: [xa, ya, xb + 1, yb + 1] }
  t.dentro = t.dentro.filter((i) => !stampati.has(i)) // il colore medio della gomma, nel resoconto, senza la vernice
}

// ── scrittura ─────────────────────────────────────────────────────────────────────────────────────────────────────
mkdirSync(A, { recursive: true })
const [fileGrande, filePiccola] = [join(A, 'pager-grande.webp'), join(A, 'pager-piccolo.webp')]
const prima = [fileGrande, filePiccola].map((f) => (existsSync(f) ? readFileSync(f).length : null))
const grande = await sharp(out, RAW).webp(WEBP).toBuffer()
const grigia = await sharp(px, RAW).webp(WEBP).toBuffer() // la stessa foto con i tasti grigi: il confronto
const piccola = await sharp(grande).resize({ width: PICCOLA }).webp({ quality: 88 }).toBuffer()
await writeFile(fileGrande, grande)
await writeFile(filePiccola, piccola)

// ── verifica: la nuova grande contro la grigia, decodificate ────────────────────────────────────────────────────
// fuori dalla maschera cambia solo il rumore di compressione; nella corona scura fra la maschera e il bordino lucido
// (da 2 a 6 px oltre il bordo) si misura il croma in più (la frangia)
const [gn, gg] = [await sharp(grande).ensureAlpha().raw().toBuffer(), await sharp(grigia).ensureAlpha().raw().toBuffer()]
let [fuori, cambiati, somma, massimo, alfa] = [0, 0, 0, 0, 0]
for (let p = 0; p < W * H; p++) {
  const i = p * 4
  if (gn[i + 3] !== gg[i + 3]) alfa++
  if (maschera[p] > 0 || !gg[i + 3]) continue
  fuori++
  const d = Math.max(Math.abs(gn[i] - gg[i]), Math.abs(gn[i + 1] - gg[i + 1]), Math.abs(gn[i + 2] - gg[i + 2]))
  if (d) cambiati++, (somma += d), (massimo = Math.max(massimo, d))
}
const num = (v, k = 2) => v.toFixed(k).replace('.', ',')
const pc = (v, tot) => num((100 * v) / tot, 3)
for (const t of misure) {
  let [n, cs, cm] = [0, 0, 0]
  for (let y = Math.floor(t.cy - t.r - 7); y <= t.cy + t.r + 7; y++) for (let x = Math.floor(t.cx - t.r - 7); x <= t.cx + t.r + 7; x++) {
    const d = Math.hypot(x + 0.5 - t.cx, y + 0.5 - t.cy) - t.r
    if (d < PIENA + SFUMA || d > 6) continue
    const i = (y * W + x) * 4, dc = croma(gn, i) - croma(gg, i)
    n++, (cs += dc), (cm = Math.max(cm, dc))
  }
  const media = (b) => [0, 1, 2].map((c) => t.dentro.reduce((s, i) => s + b[i + c], 0) / t.dentro.length)
  console.log(`tasto ${t.nome} (${t.fa}): centro (${num(t.cx)}; ${num(t.cy)}) px, raggio ${num(t.r)} px → left ${pc(t.cx - t.r, W)} %, top ${pc(t.cy - t.r, H)} %, width ${pc(2 * t.r, W)} %, centro ${pc(t.cx, W)} % / ${pc(t.cy, H)} %`)
  console.log(`  bordo su ${t.punti} raggi a luminosità ${num(t.T, 1)} (gomma ${num(t.yGomma, 1)}): scarto dal cerchio rms ${num(t.rms)} px, max ${num(t.resMax)} px; bordino lucido a ≥ ${num(t.varco, 1)} px dal bordo`)
  console.log(`  gomma ${hex(media(gg))} (L* ${num(t.L0, 1)}, croma ${num(t.C0, 1)}) → ${hex(media(gn))} (scelto ${t.colore}, L* ${num(t.Lt, 1)})`)
  if (t.simbolo) { const [xa, ya, xb, yb] = t.simbolo.scatola; console.log(`  simbolo ${t.simbolo.file}: ${num(t.simbolo.k * 100, 1)} % del disegno, inchiostro (alfa > ½) da ${xa} a ${xb} × da ${ya} a ${yb} px, centro (${num((xa + xb) / 2, 1)}; ${num((ya + yb) / 2, 1)}) contro la gomma (${num(t.cx, 1)}; ${num(t.cy, 1)})`) }
  console.log(`  frangia: nella corona da 2 a 6 px fuori dalla gomma (${n} px) il croma cresce in media di ${num(cs / n)}, al massimo di ${num(cm, 1)}`)
}
console.log(`fuori dai tasti, contro la grigia compressa uguale: cambiati ${cambiati} px su ${fuori} (${num((100 * cambiati) / fuori, 1)} %), di ${num(somma / Math.max(1, cambiati))} livelli in media, al massimo ${massimo}; alfa diversa: ${alfa}`)
const kb = (b) => (b == null ? '' : ` (prima ${b} B)`)
console.log(`✓ ${fileGrande} ${W} × ${H}, ${LOSSLESS ? 'lossless' : 'webp 82'}, ${grande.length} B${kb(prima[0])}; la grigia sarebbe ${grigia.length} B`)
const { width: pw, height: ph } = await sharp(piccola).metadata()
console.log(`✓ ${filePiccola} ${pw} × ${ph}, webp 88, ${piccola.length} B${kb(prima[1])}`)
