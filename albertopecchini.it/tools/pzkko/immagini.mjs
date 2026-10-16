#!/usr/bin/env node
// Le immagini del «muro» di pzkko.it con openai/gpt-image-2 su Replicate, sempre
// in qualità high (vedi tools/pzkko/fogli.js). Fogli su fondo magenta, chiave cromatica, pezzi in
// pzkko/art/<foglio>/<nome>.webp con le misure in pzkko/art/pezzi.json.
//
//   node tools/pzkko/immagini.mjs genera <foglio|tutti> [--parallelo=4]
//       disegna i fogli in tools/pzkko/lavoro/<foglio>/
//   node tools/pzkko/immagini.mjs recupera <foglio> <id-predizione>
//       scarica un foglio già pagato (se l'attesa si è interrotta)
//   node tools/pzkko/immagini.mjs usa <foglio> <file.png> [--scala=0.5]
//       un foglio a griglia: toglie il magenta, assegna i pezzi alle celle e li
//       scrive con i nomi di fogli.js; un foglio «intero» (l'insegna): chiave
//       cromatica, rifilatura e scrittura; il foglio «tela» (la lamiera): lo
//       riduce a --lato px e lo specchia 2 × 2 così si ripete senza giunte
//   node tools/pzkko/immagini.mjs usa tutti
//       usa l'ultimo PNG di ogni foglio in lavoro/

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../replicate.mjs'
import { chiave, fondo, fondoMagenta, leggi, rifila, scriviWebp } from '../mascotte/immagine.mjs'
import { FOGLI } from './fogli.js'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro')
const OUT = join(ROOT, 'pzkko/art')
const MANIFEST = join(OUT, 'pezzi.json')
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const SCALA = Number(opz('scala', 0.5))
const LATO = Number(opz('lato', 1600))
const PARALLELO = Math.max(1, Math.min(5, Number(opz('parallelo', 4)) || 4))
const BORDO = [120, 120, 118] // il colore che prendono i pixel spariti: quello del muro, così nei bordi sfumati non resta il rosa

const foglio = (nome) => FOGLI[nome] || die(`nessun foglio «${nome}»: ${Object.keys(FOGLI).join(', ')}`)

async function genera(nome) {
  const f = foglio(nome)
  const input = { prompt: f.prompt, aspect_ratio: f.aspetto, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  if (f.riferimento) input.input_images = [await upload(f.riferimento)] // il foglio parte da un'immagine già nel sito (es. l'insegna di giorno)
  console.log(`→ ${nome}: ${f.titolo} — qualità high, ${f.aspetto}, attendo il modello…`)
  const p = await predict(input, `node tools/pzkko/immagini.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { foglio: nome })
}

async function generaTutti(nomi) {
  const coda = [...nomi]
  const errori = []
  await Promise.all(
    Array.from({ length: PARALLELO }, async () => {
      while (coda.length) {
        const n = coda.shift()
        try { await genera(n) } catch (e) { errori.push(`${n}: ${e.message}`); console.error(`✗ ${n}: ${e.message}`) }
      }
    }),
  )
  if (errori.length) die(`fogli non riusciti:\n  ${errori.join('\n  ')}`)
}

// ── usa ──────────────────────────────────────────────────────────────────────
const B = 4      // lato dei blocchi della maschera
const MIN = 40   // blocchi: sotto è una briciola

/** Componenti connesse dei pixel visibili, in blocchi di B px. */
function componenti({ w, h, px }) {
  const [gw, gh] = [Math.ceil(w / B), Math.ceil(h / B)]
  const pieno = new Uint8Array(gw * gh)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 24) pieno[((y / B) | 0) * gw + ((x / B) | 0)] = 1
  const label = new Int32Array(gw * gh).fill(-1)
  const comps = []
  for (let s = 0; s < gw * gh; s++) {
    if (!pieno[s] || label[s] !== -1) continue
    const c = { id: comps.length, n: 0, sx: 0, sy: 0, x0: gw, y0: gh, x1: 0, y1: 0 }
    comps.push(c)
    const stack = [s]
    label[s] = c.id
    while (stack.length) {
      const p = stack.pop()
      const [x, y] = [p % gw, (p / gw) | 0]
      c.n++, (c.sx += x), (c.sy += y)
      c.x0 = Math.min(c.x0, x), (c.y0 = Math.min(c.y0, y)), (c.x1 = Math.max(c.x1, x)), (c.y1 = Math.max(c.y1, y))
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const [nx, ny] = [x + dx, y + dy]
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const q = ny * gw + nx
          if (pieno[q] && label[q] === -1) (label[q] = c.id), stack.push(q)
        }
    }
  }
  return { comps, label, gw, gh }
}

/** Ritaglia dall'immagine i pixel delle componenti `mie` (le altre si svuotano), con margine. */
function estrai(img, { label, gw }, mie, pad = 6) {
  const { w, h, px } = img
  const set = new Set(mie.map((c) => c.id))
  const x0 = Math.max(0, Math.min(...mie.map((c) => c.x0)) * B - pad)
  const y0 = Math.max(0, Math.min(...mie.map((c) => c.y0)) * B - pad)
  const x1 = Math.min(w, (Math.max(...mie.map((c) => c.x1)) + 1) * B + pad)
  const y1 = Math.min(h, (Math.max(...mie.map((c) => c.y1)) + 1) * B + pad)
  const [cw, ch] = [x1 - x0, y1 - y0]
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const [sx, sy] = [x0 + x, y0 + y]
      let mio = false
      for (let dy = -1; dy <= 1 && !mio; dy++)
        for (let dx = -1; dx <= 1 && !mio; dx++) {
          const [bx, by] = [((sx / B) | 0) + dx, ((sy / B) | 0) + dy]
          if (bx >= 0 && by >= 0 && bx < gw && set.has(label[by * gw + bx])) mio = true
        }
      const i = (sy * w + sx) * 4, o = (y * cw + x) * 4
      out[o] = px[i], (out[o + 1] = px[i + 1]), (out[o + 2] = px[i + 2]), (out[o + 3] = mio ? px[i + 3] : 0)
    }
  return { w: cw, h: ch, px: out }
}

/**
 * Le illustrazioni dei volantini escono stampate su un cartoncino color crema:
 * qui il cartoncino diventa trasparente e resta solo l'inchiostro, così la
 * pagina lo stampa sulla carta del volantino (mix-blend-mode: multiply) come
 * una serigrafia a un colore. Il colore della carta è la mediana dei pixel
 * chiari del pezzo; un pixel sparisce quando dista poco da quel colore e si
 * «smescola» dove è a metà fra carta e inchiostro.
 */
/**
 * Chiave cromatica per i pezzi traslucidi (lo scotch, le ombre sotto la carta):
 * ogni pixel è pezzo × k + magenta × (1 − k), e «quanto magenta» resta misura
 * direttamente k = 1 − m / m_fondo. Il pixel prende alfa k e il colore
 * smescolato, così lo scotch resta trasparente e non rosa. Per i pezzi opachi
 * con bordi morbidi (i graffiti) va meglio chiave() di tools/mascotte.
 */
function chiaveK(img, bordo = BORDO, tinta = TINTA_SCOTCH) {
  const { px } = img
  const { m: mk, rgb: K } = fondo(img)
  for (let i = 0; i < px.length; i += 4) {
    const m = Math.min(px[i], px[i + 2]) - px[i + 1]
    if (m <= 4) continue
    const k = Math.max(0, Math.min(1, 1 - m / mk))
    if (k < 0.08) { px[i] = bordo[0], (px[i + 1] = bordo[1]), (px[i + 2] = bordo[2]), (px[i + 3] = 0); continue }
    for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - (1 - k) * K[c]) / k)))
    // Nei pixel traslucidi (lo scotch, le ombre) il colore smescolato resta
    // rosa: il modello ha filtrato il magenta attraverso il nastro ingiallito.
    // Si tiene solo la luminosità e si dà la tinta di un nastro ingiallito.
    if (k < 0.9 || Math.min(px[i], px[i + 2]) - px[i + 1] > 12) {
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 200
      for (let c = 0; c < 3; c++) px[i + c] = Math.min(255, Math.round(tinta[c] * lum))
    }
    px[i + 3] = Math.round(px[i + 3] * k)
  }
  return img
}
const TINTA_SCOTCH = [238, 226, 190]

function togliCarta(piece) {
  const { w, h, px } = piece
  // il bordo del cartoncino (ombra e filo scuro) va via: una fascia di ERODI px
  // dentro il riquadro dei pixel pieni sparisce prima della chiave
  const ERODI = Math.round(w * 0.022)
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 128) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x < x0 + ERODI || x > x1 - ERODI || y < y0 + ERODI || y > y1 - ERODI) px[(y * w + x) * 4 + 3] = 0
  const chiari = [[], [], []]
  for (let i = 0; i < px.length; i += 16) {
    if (px[i + 3] < 200 || px[i] + px[i + 1] + px[i + 2] < 560) continue
    chiari[0].push(px[i]), chiari[1].push(px[i + 1]), chiari[2].push(px[i + 2])
  }
  if (chiari[0].length < 100) return
  const K = chiari.map((c) => c.sort((a, b) => a - b)[c.length >> 1])
  const [lo, hi] = [24, 64]
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const d = Math.max(Math.abs(px[i] - K[0]), Math.abs(px[i + 1] - K[1]), Math.abs(px[i + 2] - K[2]))
    if (d >= hi) continue
    if (d <= lo) { px[i] = K[0], (px[i + 1] = K[1]), (px[i + 2] = K[2]), (px[i + 3] = 0); continue }
    const a = (d - lo) / (hi - lo)
    for (let k = 0; k < 3; k++) px[i + k] = Math.max(0, Math.min(255, Math.round((px[i + k] - (1 - a) * K[k]) / a)))
    px[i + 3] = Math.round(px[i + 3] * a)
  }
}

async function manifest() { try { return JSON.parse(await readFile(MANIFEST, 'utf8')) } catch { return {} } }
async function scriviManifest(man) {
  await mkdir(OUT, { recursive: true })
  await writeFile(MANIFEST, JSON.stringify(man, null, 1) + '\n')
}

async function usaGriglia(nome, file) {
  const f = foglio(nome)
  const [cols, rows] = f.griglia
  const img = leggi(file)
  if (fondoMagenta(img)) { f.traslucido ? chiaveK(img, BORDO, f.tinta) : chiave(img, BORDO); console.log(`  fondo magenta tolto con la chiave cromatica${f.traslucido ? ' per pezzi traslucidi' : ''}`) }
  else console.warn('  ! il foglio non è su fondo magenta: ritaglio quello che è trasparente')
  const trovati = componenti(img)
  const { comps, gw, gh } = trovati
  // ogni componente va alla cella in cui cade il suo baricentro; le briciole si scartano
  for (const c of comps) {
    c.cell = c.n < MIN ? -1 : Math.min(rows - 1, ((c.sy / c.n / gh) * rows) | 0) * cols + Math.min(cols - 1, ((c.sx / c.n / gw) * cols) | 0)
  }
  const man = await manifest()
  man[nome] = {}
  const dir = join(OUT, nome)
  await mkdir(dir, { recursive: true })
  console.log(`→ ${nome}: ${img.w} × ${img.h}, ${comps.filter((c) => c.cell === -1).length} briciole scartate`)
  for (const [cell, n] of f.pezzi.entries()) {
    const mie = comps.filter((c) => c.cell === cell)
    if (!mie.length) { console.warn(`  ! ${n}: cella ${cell + 1} vuota`); continue }
    const piece = estrai(img, trovati, mie)
    if (f.senzaCarta) togliCarta(piece)
    const [w, h] = await scriviWebp(piece, join(dir, `${n}.webp`), f.scala ?? SCALA, 82)
    man[nome][n] = { w, h }
    console.log(`  ✓ ${n}.webp ${w} × ${h} (${mie.length} ${mie.length === 1 ? 'pezzo' : 'pezzi'})`)
  }
  await scriviManifest(man)
}

async function usaIntero(nome, file) {
  const f = foglio(nome)
  const img = leggi(file)
  if (fondoMagenta(img)) { chiave(img, BORDO); console.log('  fondo magenta tolto con la chiave cromatica') }
  const piece = rifila(img, 8)
  await mkdir(OUT, { recursive: true })
  const [w, h] = await scriviWebp(piece, join(OUT, `${f.intero}.webp`), f.scala ?? SCALA, 82)
  const man = await manifest()
  man[nome] = { [f.intero]: { w, h } }
  await scriviManifest(man)
  console.log(`  ✓ ${f.intero}.webp ${w} × ${h}`)
}

/**
 * La lamiera: le doghe della saracinesca si ripetono già da sole in verticale,
 * quindi si misura il passo (autocorrelazione della luminosità per riga), si
 * taglia un numero intero di doghe da una scanalatura all'altra e in larghezza
 * si specchia (flop): così la tela si ripete senza giunte e senza capovolgere
 * l'ombra delle doghe. Ridotta a LATO px di larghezza prima dello specchio.
 */
async function usaTela(nome, file) {
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(file).resize({ width: LATO, kernel: 'lanczos3' }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  // luminosità media di ogni riga
  const riga = new Float64Array(H)
  for (let y = 0; y < H; y++) {
    let s = 0
    for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; s += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 }
    riga[y] = s / W
  }
  const media = riga.reduce((a, b) => a + b, 0) / H
  const p = riga.map((v) => v - media)
  // il passo: il ritardo con la correlazione più alta fra 1/40 e 1/4 dell'altezza
  let passo = 0, best = -Infinity
  for (let lag = Math.round(H / 40); lag < H / 4; lag++) {
    let c = 0
    for (let y = 0; y + lag < H; y++) c += p[y] * p[y + lag]
    c /= H - lag
    if (c > best) { best = c; passo = lag }
  }
  // la fase: la scanalatura più scura entro il primo passo, poi quella omologa in fondo
  const scuro = (da, a) => { let m = Infinity, k = da; for (let y = da; y < a; y++) if (riga[y] < m) { m = riga[y]; k = y }; return k }
  const y0 = scuro(0, passo)
  const n = Math.floor((H - y0 - 4) / passo)
  const y1 = scuro(y0 + n * passo - Math.round(passo * 0.15), Math.min(H, y0 + n * passo + Math.round(passo * 0.15)))
  const h = y1 - y0
  console.log(`  passo delle doghe ${passo} px, ${n} doghe da y ${y0} a ${y1} (${h} px)`)
  const fetta = await sharp(data, { raw: { width: W, height: H, channels: 3 } }).extract({ left: 0, top: y0, width: W, height: h }).png().toBuffer()
  const specchio = await sharp(fetta).flop().png().toBuffer()
  await mkdir(OUT, { recursive: true })
  const out = join(OUT, `${nome}.webp`)
  const res = await sharp({ create: { width: W * 2, height: h, channels: 3, background: '#8e8e8a' } })
    .composite([{ input: fetta, left: 0, top: 0 }, { input: specchio, left: W, top: 0 }])
    .webp({ quality: 70, effort: 6 })
    .toFile(out)
  const man = await manifest()
  man[nome] = { [nome]: { w: res.width, h: res.height, doga: passo } }
  await scriviManifest(man)
  console.log(`  ✓ ${nome}.webp ${res.width} × ${res.height} (${(res.size / 1024).toFixed(0)} kB), una doga ogni ${passo} px`)
}

async function ultimoPng(nome) {
  const dir = join(LAVORO, nome)
  if (!existsSync(dir)) die(`nessun foglio generato in ${dir}`)
  const png = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort().at(-1)
  if (!png) die(`nessun PNG in ${dir}`)
  return join(dir, png)
}

async function usa(nome, file) {
  const f = foglio(nome)
  const src = file ? resolve(file) : await ultimoPng(nome)
  if (!existsSync(src)) die(`non trovo ${src}`)
  console.log(`→ ${nome} da ${src}`)
  if (f.tela) return usaTela(nome, src)
  if (f.intero) return usaIntero(nome, src)
  return usaGriglia(nome, src)
}

const [cmd, nome, arg] = process.argv.slice(2)
if (cmd === 'genera' && nome) {
  await generaTutti(nome === 'tutti' ? Object.keys(FOGLI) : nome.split(','))
} else if (cmd === 'recupera' && nome && arg) {
  foglio(nome)
  await salva(await prediction(arg), join(LAVORO, nome), { foglio: nome })
} else if (cmd === 'usa' && nome) {
  for (const n of nome === 'tutti' ? Object.keys(FOGLI) : nome.split(',')) await usa(n, nome === 'tutti' ? undefined : arg)
} else {
  die('uso: immagini.mjs genera <foglio|tutti> · recupera <foglio> <id> · usa <foglio|tutti> [file.png]')
}
