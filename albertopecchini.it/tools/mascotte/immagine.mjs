// Strumenti comuni a mascotte.mjs e burattini: leggere un PNG in RGBA, pulire
// la trasparenza, rifilare, trovare gli occhi e il colore della palpebra.

import { execFileSync } from 'node:child_process'
import { die } from '../replicate.mjs'

// come per le figurine: sotto 16 sparisce, sopra 240 diventa pieno
export const alfa = (a) => (a < 16 ? 0 : a >= 240 ? 255 : a)

export function leggi(file) {
  const probe = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim()
  const [w, h] = probe.split(',').map(Number)
  const px = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 })
  for (let i = 3; i < px.length; i += 4) px[i] = alfa(px[i])
  return { w, h, px }
}

/** Come leggi, ma se ffmpeg non c'è (non è su tutti i PC) legge con sharp, che sta fra le dipendenze del sito. */
export async function leggiA(file) {
  try { return leggi(file) } catch (e) { if (e.code !== 'ENOENT') throw e }
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) data[i] = alfa(data[i])
  return { w: info.width, h: info.height, px: data }
}

/**
 * Chiave cromatica per i fogli su fondo magenta pieno: il fondo diventa
 * trasparente. «Quanto magenta» è min(R, B) − G: ~225 sul fondo (il modello non
 * lo fa mai puro, e verso gli angoli sbiadisce), zero o meno sui colori degli
 * animali (il magenta non è nella loro tavolozza). Il fondo di riferimento è la
 * mediana della cornice del foglio. Sopra i due terzi di quel valore il pixel
 * sparisce, sotto un quinto resta pieno, in mezzo sfuma (il bordo adesivo resta
 * morbido); al colore si toglie la parte di fondo mescolata, così il bordo non
 * resta rosa. I pixel spariti prendono il colore del bordo adesivo: nella
 * riduzione e nel WebP (crominanza a metà risoluzione) il loro colore si mescola
 * a quello dei vicini, e il magenta farebbe un alone rosa sul fondo scuro.
 * Modifica l'immagine e la restituisce.
 */
export function chiave(img, bordo = [243, 241, 236]) {
  const { px } = img
  const { m: mk, rgb: K } = fondo(img)
  const [hi, lo] = [mk * 0.66, mk * 0.2]
  for (let i = 0; i < px.length; i += 4) {
    const [r, g, b] = [px[i], px[i + 1], px[i + 2]]
    const m = Math.min(r, b) - g
    if (m <= lo) continue
    const a = m >= hi ? 0 : alfa(Math.round(((hi - m) / (hi - lo)) * 255))
    if (a === 0) {
      ;[px[i], px[i + 1], px[i + 2], px[i + 3]] = [...bordo, 0]
      continue
    }
    const k = Math.max(0, Math.min(1, 1 - m / mk)) // quanto del pixel è figura
    if (a > 0 && k > 0.05) {
      const pulito = (v, key) => Math.max(0, Math.min(255, Math.round((v - (1 - k) * key) / k)))
      px[i] = pulito(r, K[0])
      px[i + 1] = pulito(g, K[1])
      px[i + 2] = pulito(b, K[2])
    }
    px[i + 3] = a
  }
  return img
}

/** Il colore del fondo: mediana dei pixel della cornice del foglio (16 px), con la sua misura di magenta. */
export function fondo({ w, h, px }, bordo = 16) {
  const c = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (x >= bordo && x < w - bordo && y >= bordo && y < h - bordo) continue
      const i = (y * w + x) * 4
      c.push([px[i], px[i + 1], px[i + 2]])
    }
  const med = (k) => c.map((v) => v[k]).sort((a, b) => a - b)[c.length >> 1]
  const rgb = [med(0), med(1), med(2)]
  return { rgb, m: Math.min(rgb[0], rgb[2]) - rgb[1] }
}

/** Il foglio è su fondo pieno (niente alfa) e magenta? Allora va chiave(). */
export function fondoMagenta(img) {
  const { px } = img
  if (px[3] !== 255) return false
  return fondo(img).m > 120
}

/** Ritaglia il riquadro (x0, y0, w, h) di un'immagine RGBA. */
export function ritaglia({ w, px }, x0, y0, cw, ch) {
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++) px.copy(out, y * cw * 4, ((y0 + y) * w + x0) * 4, ((y0 + y) * w + x0 + cw) * 4)
  return { w: cw, h: ch, px: out }
}

/** Riquadro dei pixel visibili, con un po' di margine. Restituisce anche l'origine del ritaglio. */
export function rifila(img, pad = 6) {
  const { w, h, px } = img
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
  return { ...ritaglia(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1), ox: x0, oy: y0 }
}

/**
 * Macchie di pixel che soddisfano `test(i)` (i = indice nel buffer RGBA), come
 * componenti connesse a 4 vicini, con riquadro e numero di pixel.
 */
export function macchie({ w, h }, test) {
  const label = new Int32Array(w * h).fill(-1)
  const comps = []
  for (let s = 0; s < w * h; s++) {
    if (label[s] !== -1 || !test(s * 4)) continue
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
        if (label[q] === -1 && test(q * 4)) (label[q] = id), stack.push(q)
      }
    }
  }
  return comps.map((c) => ({ ...c, bw: c.x1 - c.x0 + 1, bh: c.y1 - c.y0 + 1 }))
}

/**
 * Gli occhi: macchie di pixel bianchi (neutri e chiari) quasi circolari, tra lo
 * 0,8% e il 14% di `rif` (di solito la larghezza dell'immagine). La pupilla nera
 * al centro è un buco nella macchia, quindi il riquadro della macchia è l'occhio
 * intero. Restituisce le `quanti` più grandi, da sinistra a destra.
 */
export function occhi(img, { rif = img.w, quanti = 2 } = {}) {
  const { px } = img
  const bianco = (i) => px[i + 3] > 200 && px[i] > 222 && px[i + 1] > 222 && px[i + 2] > 222 && Math.abs(px[i] - px[i + 2]) < 16 && Math.abs(px[i + 1] - px[i + 2]) < 16
  const tondi = macchie(img, bianco)
    .filter((c) => c.bw > rif * 0.008 && c.bw < rif * 0.14 && c.bh > rif * 0.008 && c.bh < rif * 0.14)
    .map((c) => ({ ...c, aspetto: c.bw / c.bh, pieno: c.n / ((Math.PI / 4) * c.bw * c.bh) }))
    // quasi circolare, o un'ellisse vista di tre quarti (la pupilla al centro toglie fino a un quarto dell'area)
    .filter((c) => c.aspetto > 0.55 && c.aspetto < 1.8 && c.pieno > 0.45 && c.pieno < 1.05)
    .sort((a, b) => b.n - a.n)
    .slice(0, quanti)
    .sort((a, b) => a.x0 - b.x0)
  return tondi.map((c) => {
    const cx = (c.x0 + c.x1) / 2
    const cy = (c.y0 + c.y1) / 2
    // semiassi: l'occhio visto di tre quarti è un'ellisse
    const [rx, ry] = [c.bw / 2, c.bh / 2]
    return { cx, cy, rx, ry, skin: pelle(img, cx, cy, (rx + ry) / 2) }
  })
}

/** Colore della palpebra: la mediana dei pixel pieni, non bianchi né neri, in un anello intorno all'occhio. */
export function pelle({ w, h, px }, cx, cy, r) {
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

/**
 * Scrive un WebP con alfa, ridotto di `scala` (1 = misura piena). Con sharp,
 * non con ffmpeg: ffmpeg lasciava l'alfa a 1 invece che a 0 nel vuoto intorno
 * ai pezzi (un riquadro appena visibile sui fondi chiari) e nella riduzione
 * mescolava ai bordi il colore dei pixel trasparenti; sharp riduce con l'alfa
 * premoltiplicato e tiene l'alfa senza perdite.
 */
export async function scriviWebp(img, out, scala = 1, quality = 90) {
  const [ow, oh] = [Math.round(img.w * scala), Math.round(img.h * scala)]
  const { default: sharp } = await import('sharp')
  await sharp(img.px, { raw: { width: img.w, height: img.h, channels: 4 } })
    .resize(ow, oh, { kernel: 'lanczos3' })
    .webp({ quality, alphaQuality: 100, effort: 6 })
    .toFile(out)
  return [ow, oh]
}
