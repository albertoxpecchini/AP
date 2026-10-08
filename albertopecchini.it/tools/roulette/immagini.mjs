#!/usr/bin/env node
// Le immagini della roulette di pzkko.it con openai/gpt-image-2 su Replicate,
// sempre in qualità high (vedi tools/roulette/fogli.js). È lo stesso strumento
// del blackjack (tools/blackjack/immagini.mjs), con la sua cartella.
//
//   node tools/roulette/immagini.mjs genera <foglio> [--candidati=2]
//       disegna un foglio (ruota, rotore, oggetti, tavolo) in tools/roulette/lavoro/<foglio>/
//   node tools/roulette/immagini.mjs genera tutti
//   node tools/roulette/immagini.mjs recupera <foglio> <id-predizione>
//       scarica un foglio già pagato (se l'attesa si è interrotta)
//   node tools/roulette/immagini.mjs usa <foglio> <file.png>
//       toglie il fondo magenta, separa i pezzi e li elenca (numerati in ordine di lettura)
//   node tools/roulette/immagini.mjs usa <foglio> <file.png> nome1,nome2,…
//       dà un nome ai pezzi in quell'ordine («-» scarta) e scrive
//       pzkko/games/roulette/art/<foglio>/<nome>.webp più art/pezzi.json
//   node tools/roulette/immagini.mjs intero <foglio> <file.png> <nome> [--scala=0.5]
//       un foglio con un solo pezzo (la ruota, il rotore, il tavolo): chiave
//       cromatica, rifilatura e scrittura senza separare (i buchi magenta
//       interni restano trasparenti)

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ROOT, die, predict, prediction, salva } from '../replicate.mjs'
import { chiave, fondoMagenta, leggi, macchie, rifila, scriviWebp } from '../mascotte/immagine.mjs'
import { FOGLI } from './fogli.js'

const LAVORO = join(ROOT, 'tools/roulette/lavoro')
const OUT = join(ROOT, 'pzkko/games/roulette/art')
const MANIFEST = join(OUT, 'pezzi.json')
const opz = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const SCALA = Number(opz('scala', 0.6))
const CANDIDATI = Math.max(1, Math.min(4, Number(opz('candidati', 1)) || 1))

async function genera(nome) {
  const f = FOGLI[nome] || die(`nessun foglio «${nome}»: ${Object.keys(FOGLI).join(', ')}`)
  const input = { prompt: f.prompt, aspect_ratio: f.aspetto, quality: 'high', number_of_images: CANDIDATI, output_format: 'png', background: 'opaque' }
  console.log(`→ ${nome}: ${f.titolo} — qualità high, ${f.aspetto}, attendo il modello…`)
  const p = await predict(input, `node tools/roulette/immagini.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { foglio: nome })
}

// ── usa: dal foglio ai pezzi (come nel blackjack) ────────────────────────────
const B = 4
const MIN = 60
function separa(img) {
  const { w, h, px } = img
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
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const [nx, ny] = [x + dx, y + dy]
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
          const q = ny * gw + nx
          if (pieno[q] && label[q] === -1) (label[q] = c.id), stack.push(q)
        }
    }
  }
  const grandi = comps.filter((c) => c.n >= MIN)
  const riga = (c) => Math.round((c.y0 + c.y1) / 2 / (gh / 8))
  grandi.sort((a, b) => riga(a) - riga(b) || a.x0 - b.x0)
  return { grandi, briciole: comps.length - grandi.length, label, gw }
}
function estrai(img, { label, gw }, c, pad = 4) {
  const { w, h, px } = img
  const x0 = Math.max(0, c.x0 * B - pad), y0 = Math.max(0, c.y0 * B - pad)
  const x1 = Math.min(w, (c.x1 + 1) * B + pad), y1 = Math.min(h, (c.y1 + 1) * B + pad)
  const [cw, ch] = [x1 - x0, y1 - y0]
  const out = Buffer.alloc(cw * ch * 4)
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const [sx, sy] = [x0 + x, y0 + y]
      let mio = false
      for (let dy = -1; dy <= 1 && !mio; dy++)
        for (let dx = -1; dx <= 1 && !mio; dx++) {
          const [bx, by] = [((sx / B) | 0) + dx, ((sy / B) | 0) + dy]
          if (bx >= 0 && by >= 0 && bx < gw && label[by * gw + bx] === c.id) mio = true
        }
      if (mio) px.copy(out, (y * cw + x) * 4, (sy * w + sx) * 4, (sy * w + sx) * 4 + 4)
    }
  return { w: cw, h: ch, px: out, ox: x0, oy: y0 }
}
function perni(piece, rif) {
  const { px } = piece
  const oro = (i) => {
    const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]]
    if (a < 200) return false
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    if (max < 70 || max !== r || (max - min) / max < 0.3) return false
    const hue = (60 * (g - b)) / (max - min)
    return hue >= 28 && hue <= 65
  }
  return macchie(piece, oro)
    .filter((c) => c.bw > rif * 0.008 && c.bw < rif * 0.045 && c.bh > rif * 0.008 && c.bh < rif * 0.045)
    .map((c) => ({ x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2, d: (c.bw + c.bh) / 2, aspetto: c.bw / c.bh, pieno: c.n / ((Math.PI / 4) * c.bw * c.bh) }))
    .filter((c) => c.aspetto > 0.6 && c.aspetto < 1.6 && c.pieno > 0.45)
    .sort((a, b) => a.x - b.x)
}
async function manifest() { try { return JSON.parse(await readFile(MANIFEST, 'utf8')) } catch { return {} } }

async function usa(nome, file, nomi) {
  if (!FOGLI[nome]) die(`nessun foglio «${nome}»`)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const img = leggi(src)
  if (fondoMagenta(img)) { chiave(img, [30, 30, 32]); console.log('  fondo magenta tolto con la chiave cromatica') }
  const trovati = separa(img)
  const { grandi, briciole } = trovati
  console.log(`→ ${nome}: ${grandi.length} pezzi (${briciole} briciole scartate) in un foglio ${img.w} × ${img.h}`)
  grandi.forEach((c, i) => console.log(`  ${i + 1}. x ${c.x0 * B}–${(c.x1 + 1) * B}, y ${c.y0 * B}–${(c.y1 + 1) * B} (${((c.n * B * B) / 1000).toFixed(0)}k px)`))
  if (!nomi) return console.log('  dai un nome ai pezzi in quest’ordine: … usa <foglio> <file> nome1,nome2,…  («-» per scartarne uno)')
  const elenco = nomi.split(',').map((s) => s.trim())
  if (elenco.length !== grandi.length) die(`${elenco.length} nomi per ${grandi.length} pezzi`)
  const dir = join(OUT, nome)
  await mkdir(dir, { recursive: true })
  const man = await manifest()
  man[nome] = man[nome] || {}
  for (const [i, c] of grandi.entries()) {
    const n = elenco[i]
    if (n === '-') continue
    const piece = estrai(img, trovati, c)
    const pin = perni(piece, img.w)
    const [w, h] = await scriviWebp(piece, join(dir, `${n}.webp`), SCALA)
    man[nome][n] = { w, h, perni: pin.map((p) => [Math.round(p.x * SCALA), Math.round(p.y * SCALA)]) }
    console.log(`  ${n}: ${w} × ${h}${pin.length ? `, perni ${man[nome][n].perni.map((p) => p.join(':')).join(' ')}` : ', nessun perno'}`)
  }
  await writeFile(MANIFEST, JSON.stringify(man, null, 2))
  console.log(`✓ ${MANIFEST}`)
}

/** Un foglio con un solo oggetto (ruota, rotore, tavolo): chiave, rifilatura, scrittura. I buchi magenta interni restano trasparenti. */
async function intero(nome, file, n) {
  if (!FOGLI[nome]) die(`nessun foglio «${nome}»`)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const img = leggi(src)
  if (fondoMagenta(img)) { chiave(img, [30, 30, 32]); console.log('  fondo magenta tolto con la chiave cromatica') }
  const piece = rifila(img, 2)
  const dir = join(OUT, nome)
  await mkdir(dir, { recursive: true })
  const man = await manifest()
  man[nome] = man[nome] || {}
  const [w, h] = await scriviWebp(piece, join(dir, `${n}.webp`), SCALA)
  man[nome][n] = { w, h, perni: [] }
  await writeFile(MANIFEST, JSON.stringify(man, null, 2))
  console.log(`  ${n}: ${w} × ${h} (dal foglio ${img.w} × ${img.h}, scala ${SCALA})\n✓ ${MANIFEST}`)
}

const [cmd, a, b, c] = process.argv.slice(2).filter((x) => !x.startsWith('--'))
switch (cmd) {
  case 'genera':
    if (a === 'tutti') await Promise.all(Object.keys(FOGLI).map(genera))
    else await genera(a)
    break
  case 'recupera':
    if (!FOGLI[a]) die(`nessun foglio «${a}»`)
    await salva(await prediction(b), join(LAVORO, a), { foglio: a })
    break
  case 'usa':
    await usa(a, b, c)
    break
  case 'intero':
    await intero(a, b, c)
    break
  default:
    console.log('comandi: genera <foglio|tutti>, recupera <foglio> <id>, usa <foglio> <file> [nomi], intero <foglio> <file> <nome> [--scala=0.5]')
}
