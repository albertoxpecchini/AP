#!/usr/bin/env node
// Le bic della petizione di pzkko.it senza cappuccio (per scrivere) e i cappucci a parte (saltano via quando si comincia
// a scrivere, petizione/petizione.js), dai pezzi del foglio «penne» (node tools/pzkko/immagini.mjs usa penne). La
// punta è quella della blu, l'unica disegnata senza cappuccio: il suo fusto e la sua punta sotto il cappuccio della nera
// e della rossa, con l'inchiostro rifatto nero o rosso (l'ottone della punta e la plastica trasparente restano com'erano).
// Scrive in pzkko/art/penne/: nera-aperta.webp, rossa-aperta.webp, tappo-nera.webp, tappo-rossa.webp e penne.json (le
// misure, e dove sta il cappuccio sulla penna, in px dell'immagine).
//
//   node tools/pzkko/penne.mjs        (dalla cartella albertopecchini.it)
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(QUI, '../../package.json'))('sharp')
const DIR = join(QUI, '../../pzkko/art/penne')

const leggi = async (n) => { const { data, info } = await sharp(join(DIR, `${n}.webp`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: data, w: info.width, h: info.height } }
const larghezza = (p, y) => { let a = -1, b = -1; for (let x = 0; x < p.w; x++) if (p.d[(y * p.w + x) * 4 + 3] > 40) { if (a < 0) a = x; b = x } return [a, b] }
const scrivi = (buf, w, h, f) => sharp(buf, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, alphaQuality: 92, effort: 6 }).toFile(join(DIR, f))

const blu = await leggi('blu')
const misure = { blu: { w: blu.w, h: blu.h } }
const [ba, bb] = larghezza(blu, 300)
for (const nome of ['nera', 'rossa']) {
  const p = await leggi(nome), [pa, pb] = larghezza(p, 300), sposta = Math.round((pa + pb) / 2 - (ba + bb) / 2)
  // dove comincia il cappuccio: la punta della clip (la sagoma sporge a sinistra del fusto) e poi il corpo (più largo)
  let clip = 0, corpo = 0
  for (let y = 200; y < p.h && !clip; y++) { const [a] = larghezza(p, y); if (a >= 0 && a < pa - 2) clip = y }
  for (let y = clip; y < p.h && !corpo; y++) { const [a, b] = larghezza(p, y); if (b - a + 1 > pb - pa + 1 + 12) corpo = y }
  const taglio = clip - 2
  // il colore del tubetto di questa penna (e la luce di quello della blu), appena sopra il cappuccio: il tubetto rifatto
  // sotto continua quello di sopra senza giunta
  const media = (q, sx, y0, y1) => {
    const c = Math.round((larghezza(q, 300)[0] + larghezza(q, 300)[1]) / 2) + sx, s = [0, 0, 0]
    let n = 0
    for (let y = y0; y < y1; y++) for (let x = c - 1; x <= c + 1; x++) { const i = (y * q.w + x) * 4; s[0] += q.d[i]; s[1] += q.d[i + 1]; s[2] += q.d[i + 2]; n++ }
    return s.map((v) => v / n)
  }
  const tubo = media(p, 0, taglio - 40, taglio - 4), tuboBlu = media(blu, 0, taglio + 10, taglio + 60), luceBlu = (0.3 * tuboBlu[0] + 0.59 * tuboBlu[1] + 0.11 * tuboBlu[2]) / 255
  // la penna aperta: sopra il taglio la sua, sotto il fusto e la punta della blu, con l'inchiostro di questa penna
  const aperta = Buffer.alloc(p.w * p.h * 4)
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const i = (y * p.w + x) * 4
    if (y < taglio) { p.d.copy(aperta, i, i, i + 4); continue }
    const xb = x - sposta
    if (xb < 0 || xb >= blu.w || y >= blu.h) continue
    const j = (y * blu.w + xb) * 4, [r, g, b, a] = blu.d.subarray(j, j + 4)
    // l'inchiostro blu (tinta fra 180° e 275°, anche poco satura: i bordi sfumati del tubetto) prende il colore nuovo, con la sua luce
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0
    let tinta = 0
    if (mx > mn) tinta = mx === r ? ((g - b) / (mx - mn)) * 60 : mx === g ? (2 + (b - r) / (mx - mn)) * 60 : (4 + (r - g) / (mx - mn)) * 60
    tinta = (tinta + 360) % 360
    if (tinta > 180 && tinta < 275 && sat > 0.12) {
      const luce = (0.3 * r + 0.59 * g + 0.11 * b) / 255, k = Math.min(1.8, luce / Math.max(0.05, luceBlu))
      const c = tubo.map((v) => Math.min(255, Math.round(v * k)))
      aperta.set([...c, a], i)
    } else aperta.set([r, g, b, a], i)
  }
  await scrivi(aperta, p.w, p.h, `${nome}-aperta.webp`)
  // il cappuccio: dal taglio in giù la clip (a sinistra del fusto) e, dal corpo, tutto
  const tappo = Buffer.alloc(p.w * p.h * 4)
  let x0 = p.w, x1 = 0, y0 = p.h, y1 = 0
  for (let y = taglio; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const i = (y * p.w + x) * 4
    if (p.d[i + 3] < 8 || (y < corpo && x >= pa - 1)) continue
    p.d.copy(tappo, i, i, i + 4)
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, solo = Buffer.alloc(tw * th * 4)
  for (let y = 0; y < th; y++) tappo.copy(solo, y * tw * 4, ((y + y0) * p.w + x0) * 4, ((y + y0) * p.w + x1 + 1) * 4)
  await scrivi(solo, tw, th, `tappo-${nome}.webp`)
  misure[nome] = { w: p.w, h: p.h, tappo: { x: x0, y: y0, w: tw, h: th } }
  console.log(`${nome}: cappuccio dalla riga ${taglio} (corpo dalla ${corpo}), ${tw}×${th}; la punta della blu spostata di ${sposta} px`)
}
await writeFile(join(DIR, 'penne.json'), JSON.stringify(misure, null, 1) + '\n')
console.log('scritti nera-aperta, rossa-aperta, tappo-nera, tappo-rossa e penne.json')
