#!/usr/bin/env node
// Le foto vere sul muro di pzkko.it: gli adesivi di Alberto e degli amici (la persona
// scontornata col bordo bianco, come un adesivo fustellato) e la foto della Ciao per
// il volantino «vendo il ciao». Le foto restano sul disco di Alberto: qui entrano
// solo i ritagli, senza metadati (niente GPS nei file).
//
//   node tools/pzkko/amici.mjs scontorna <nome…|tutti>
//       ruota, ritaglia e riduce la foto in tools/pzkko/lavoro/amici/<nome>.jpg e la manda a
//       bria/remove-background su Replicate (la maschera resta lì: rilanciando si riusa, non si ripaga)
//   node tools/pzkko/amici.mjs adesivi <nome…|tutti>
//       dalla foto e dalla maschera fa l'adesivo: pzkko/art/amici/<nome>.webp
//   node tools/pzkko/amici.mjs ciao
//       l'anteprima a piena risoluzione dentro il CR2 della Canon, raddrizzata e ritagliata:
//       pzkko/art/annunci/ciao.webp
//
// Dalla cartella albertopecchini.it. Il token di Replicate in .env.local.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { ROOT, die, predict, upload } from '../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/amici')
const ART = join(ROOT, 'pzkko/art')
const RULLINO = 'D:/disco immagini/Rullino'
const CARICAMENTI = `${RULLINO}/Caricamenti dalla fotocamera dal 26 dicembre 2025`

// ritaglio: x0, y0, x1, y1 in frazioni della foto già ruotata, attorno alle persone (il resto il modello lo
// toglierebbe comunque, ma meno fondo vuol dire meno sbagli: la signora dietro, l'auto)
const FOTO = {
  negozio: { src: `${RULLINO}/Anno 2024/09/IMG_0231.JPG`, ritaglio: [0.2, 0.14, 0.84, 1] },
  jager: { src: `${CARICAMENTI}/2026-08-23 00.02.52.jpg`, ritaglio: [0, 0.27, 1, 1] },
  ypsilon: { src: `${CARICAMENTI}/2026-08-22 23.44.38.jpg`, ritaglio: [0.36, 0.3, 0.7, 1] },
  keglevich: { src: `${CARICAMENTI}/2026-09-12 00.08.12.jpg`, ritaglio: [0, 0.37, 1, 1] },
  // la foto è di simo4gantos8 (la sua firma, in basso, resta fuori dal ritaglio): il credito va sull'adesivo
  landini: { src: `${CARICAMENTI}/2026-09-20 10.44.47.jpg`, ritaglio: [0.28, 0.1, 0.73, 0.935], credito: 'foto: simo4gantos8' },
}
const LATO = 2048 // la foto che va al modello
const FINALE = 820 // il lato lungo dell'adesivo
const BORDO = 0.026 // il bordo bianco, in frazioni del lato lungo del soggetto

const nomi = (args) => (args[0] === 'tutti' ? Object.keys(FOTO) : args).map((n) => (FOTO[n] ? n : die(`nessuna foto «${n}»: ${Object.keys(FOTO).join(', ')}`)))

async function prepara(nome) {
  const f = FOTO[nome]
  const out = join(LAVORO, `${nome}.jpg`)
  if (existsSync(out)) return out
  const ruotata = await sharp(f.src).rotate().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = ruotata.info
  const [x0, y0, x1, y1] = f.ritaglio
  await mkdir(LAVORO, { recursive: true })
  await sharp(ruotata.data)
    .extract({ left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) })
    .resize(LATO, LATO, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toFile(out)
  return out
}

async function scontorna(nome) {
  const foto = await prepara(nome)
  const maschera = join(LAVORO, `${nome}-modello.png`)
  if (existsSync(maschera)) return console.log(`→ ${nome}: la maschera c'è già (${maschera})`)
  console.log(`→ ${nome}: carico la foto e la mando a bria/remove-background…`)
  const p = await predict({ image: await upload(foto), preserve_alpha: true }, '(predizione da scaricare a mano dalla dashboard di Replicate)', 'bria/remove-background')
  const url = [p.output].flat()[0]
  const res = await fetch(url)
  if (!res.ok) die(`download ${url}: ${res.status}`)
  await writeFile(maschera, Buffer.from(await res.arrayBuffer()))
  console.log(`  ✓ ${maschera}`)
}

/** Il canale alfa di un'immagine come buffer a un canale, portato a w × h. */
const alfa = async (file, w, h) => (await sharp(file).ensureAlpha().extractChannel(3).resize(w, h, { fit: 'fill' }).raw().toBuffer())

async function adesivo(nome) {
  const f = FOTO[nome]
  const foto = join(LAVORO, `${nome}.jpg`), maschera = join(LAVORO, `${nome}-modello.png`)
  if (!existsSync(maschera)) die(`${nome}: prima node tools/pzkko/amici.mjs scontorna ${nome}`)
  const { data: rgb, info } = await sharp(foto).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const a = await alfa(maschera, w, h)
  // il riquadro del soggetto, e il margine per il bordo (e per l'etichetta del credito)
  let x0 = w, y0 = h, x1 = 0, y1 = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  if (x1 <= x0) die(`${nome}: la maschera è vuota`)
  const lato = Math.max(x1 - x0, y1 - y0)
  const b = Math.round(lato * BORDO)
  const etichetta = f.credito ? Math.round(lato * 0.075) : 0
  const pad = b * 2
  const W = x1 - x0 + 1 + pad * 2, H = y1 - y0 + 1 + pad * 2 + etichetta
  // la foto con l'alfa del modello, su una tela col margine
  const px = Buffer.alloc(W * H * 4), soggetto = Buffer.alloc(W * H)
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x, o = (y - y0 + pad) * W + (x - x0 + pad)
      px[o * 4] = rgb[i * 3], (px[o * 4 + 1] = rgb[i * 3 + 1]), (px[o * 4 + 2] = rgb[i * 3 + 2]), (px[o * 4 + 3] = a[i])
      soggetto[o] = a[i] > 110 ? 255 : 0
    }
  // il bordo: la sagoma sfocata e tagliata bassa si allarga di ~1,75 σ e arrotonda gli angoli (e chiude i buchi
  // piccoli, fra le dita e il collo della bottiglia), come la fustella di un adesivo. Sfocatura e soglia in due
  // passi: in una catena sola sharp fa prima la soglia (ha un ordine suo), e da un canale ne dà tre
  const sfoca = async (buf, s) => sharp(buf, { raw: { width: W, height: H, channels: 1 } }).blur(s).extractChannel(0).raw().toBuffer()
  const soglia = (buf, t) => { for (let i = 0; i < buf.length; i++) buf[i] = buf[i] >= t ? 255 : 0; return buf }
  let sagoma = soglia(await sfoca(soggetto, b / 1.75), 10)
  if (etichetta) {
    // l'etichetta del credito: una striscia bianca arrotondata sotto il soggetto, unita alla sagoma, larga quanto il
    // testo (Arial grassetto: ~0,6 em a lettera)
    const lw = Math.round(f.credito.length * etichetta * 0.62 * 0.6 + b * 3), lh = etichetta + b, lx = Math.round((W - lw) / 2), ly = H - lh - Math.round(b * 0.4)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="${lh / 2}" fill="#fff"/></svg>`
    const r = await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer()
    for (let i = 0; i < sagoma.length; i++) sagoma[i] = Math.max(sagoma[i], r[i])
    sagoma = soglia(await sfoca(sagoma, b * 0.35), 128) // il raccordo fra l'etichetta e la sagoma
  }
  sagoma = await sfoca(sagoma, 0.8)
  // il vinile bianco appena caldo, sotto la foto
  const fondo = Buffer.alloc(W * H * 4)
  for (let i = 0; i < W * H; i++) fondo[i * 4] = 250, (fondo[i * 4 + 1] = 249), (fondo[i * 4 + 2] = 245), (fondo[i * 4 + 3] = sagoma[i])
  const strati = [{ input: px, raw: { width: W, height: H, channels: 4 } }]
  if (f.credito) {
    const fs = Math.round(etichetta * 0.62)
    strati.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="${W / 2}" y="${H - Math.round(b * 0.4) - (etichetta + b) / 2 + fs * 0.36}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fs}" fill="#3a3632">${f.credito}</text></svg>`) })
  }
  const pieno = await sharp(fondo, { raw: { width: W, height: H, channels: 4 } }).composite(strati).png().toBuffer()
  const dir = join(ART, 'amici')
  await mkdir(dir, { recursive: true })
  const out = join(dir, `${nome}.webp`)
  const res = await sharp(pieno).resize(FINALE, FINALE, { fit: 'inside' }).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(out)
  await writeFile(`${out}.json`, JSON.stringify({ origine: `foto vera di Alberto Pecchini${f.credito ? ` (${f.credito})` : ''}, scontornata con bria/remove-background su Replicate e fatta adesivo (bordo bianco) da tools/pzkko/amici.mjs il ${new Date().toISOString().slice(0, 10)}` }, null, 1) + '\n')
  console.log(`  ✓ ${out} ${res.width} × ${res.height} (${(res.size / 1024).toFixed(0)} kB)`)
}

// la Ciao: il CR2 della EOS 4000D ha dentro un JPEG a piena risoluzione (5184 × 3456), che basta; la foto è
// scattata con la macchina di traverso e l'anteprima non lo sa: si gira a mano
const CIAO = { src: 'D:/disco immagini/rullino con etichetta/EOS 4000D/IMG_0165 (2).CR2', ruota: 270, ritaglio: [0.02, 0.27, 0.98, 0.97] }

/** Il JPEG normale (SOF0–2) più grande dentro un file raw. */
function anteprima(buf) {
  let best = null
  for (let i = 0; i < buf.length - 3; i++) {
    if (!(buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff)) continue
    let j = i + 2, sof = null
    while (j < buf.length - 9 && buf[j] === 0xff) {
      const m = buf[j + 1]
      if (m >= 0xc0 && m <= 0xc2) sof = { w: buf.readUInt16BE(j + 7), h: buf.readUInt16BE(j + 5) }
      if (m === 0xda) break
      j += 2 + buf.readUInt16BE(j + 2)
    }
    if (!sof) continue
    let k = j
    while (k < buf.length - 1 && !(buf[k] === 0xff && buf[k + 1] === 0xd9)) k++
    if (!best || sof.w * sof.h > best.w * best.h) best = { ...sof, da: i, a: k + 2 }
    i = k
  }
  return best && buf.subarray(best.da, best.a)
}

async function ciao() {
  const jpg = anteprima(await readFile(CIAO.src)) || die('nel CR2 non trovo il JPEG')
  const r = await sharp(jpg).rotate(CIAO.ruota).toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = r.info
  const [x0, y0, x1, y1] = CIAO.ritaglio
  const dir = join(ART, 'annunci')
  await mkdir(dir, { recursive: true })
  const out = join(dir, 'ciao.webp')
  const res = await sharp(r.data)
    .extract({ left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) })
    .resize(720)
    .modulate({ brightness: 1.06, saturation: 1.05 })
    .webp({ quality: 80, effort: 6 })
    .toFile(out)
  console.log(`✓ ${out} ${res.width} × ${res.height} (${(res.size / 1024).toFixed(0)} kB)`)
}

const [cmd, ...args] = process.argv.slice(2)
if (cmd === 'scontorna' && args.length) for (const n of nomi(args)) await scontorna(n)
else if (cmd === 'adesivi' && args.length) for (const n of nomi(args)) await adesivo(n)
else if (cmd === 'ciao') await ciao()
else die('uso: amici.mjs scontorna <nome…|tutti> · adesivi <nome…|tutti> · ciao')
