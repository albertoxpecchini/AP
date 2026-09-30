#!/usr/bin/env node
// L'aragosta di fiume della home (vedi aragosta.js) con openai/gpt-image-2 su
// Replicate, sempre in qualità high.
//
//   node tools/aragosta/aragosta.mjs intero [--candidati=2]
//       l'animale completo (1536 × 1024, fondo magenta), con la chiocciola come
//       riferimento di stile, in tools/aragosta/lavoro/intero/
//   node tools/aragosta/aragosta.mjs pezzi <intero.png> [--candidati=2]
//       lo stesso animale smontato in pezzi di burattino (2048 × 2048), in lavoro/pezzi/
//   node tools/aragosta/aragosta.mjs usa <pezzi.png> [corpo,coda,…]
//       senza nomi elenca i pezzi trovati (per righe, da sinistra); con i nomi
//       («-» scarta un pezzo) scrive public/media/aragosta/<pezzo>.webp e
//       src/data/aragosta-pezzi.js (misure, perno, occhi)
//   node tools/aragosta/aragosta.mjs recupera <intero|pezzi> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//
// Il montaggio (dove si attacca ogni pezzo, la punta del beccuccio) si scrive a
// mano in src/data/aragosta.js; il movimento sta in src/client/ink.js.

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../replicate.mjs'
import { chiave, fondoMagenta, leggi, macchie, occhi, scriviWebp } from '../mascotte/immagine.mjs'
import { INTERO, PEZZI, PEZZI_ELENCO, SOGGETTO, STILE } from './aragosta.js'

const LAVORO = join(ROOT, 'tools/aragosta/lavoro')
const OUT = join(ROOT, 'public/media/aragosta')
const MANIFEST = join(ROOT, 'src/data/aragosta-pezzi.js')
const RIFERIMENTO = 'public/media/mascotte/lumaca.webp'
const SCALA = 0.5 // i pezzi si scrivono a metà misura del foglio

const CANDIDATI = Math.max(1, Math.min(4, Number(process.argv.find((x) => x.startsWith('--candidati='))?.split('=')[1]) || 1))

async function intero() {
  const input = {
    prompt: `${INTERO}\n\n${SOGGETTO}\n\n${STILE}`,
    input_images: [await upload(RIFERIMENTO)],
    aspect_ratio: '3:2',
    quality: 'high',
    number_of_images: CANDIDATI,
    output_format: 'png',
    background: 'opaque', // fondo magenta, tolto da `usa`
  }
  console.log('→ aragosta, intero — qualità high, 3:2, attendo il modello…')
  const p = await predict(input, 'node tools/aragosta/aragosta.mjs recupera intero')
  await salva(p, join(LAVORO, 'intero'), { fase: 'intero' })
}

async function pezzi(file) {
  const input = {
    prompt: `${PEZZI}\n${PEZZI_ELENCO.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n${STILE}`,
    input_images: [await upload(file)],
    aspect_ratio: '2048x2048',
    quality: 'high',
    number_of_images: CANDIDATI,
    output_format: 'png',
    background: 'opaque',
  }
  console.log(`→ aragosta, ${PEZZI_ELENCO.length} pezzi — qualità high, 2048 × 2048, attendo il modello…`)
  const p = await predict(input, 'node tools/aragosta/aragosta.mjs recupera pezzi')
  await salva(p, join(LAVORO, 'pezzi'), { fase: 'pezzi' })
}

// ── usa: dal foglio ai file del sito (come tools/mascotte/burattini-usa.mjs) ──

const B = 4 // lato dei blocchi con cui si separano i pezzi
const MIN = 40 // blocchi: sotto è una briciola (le antenne sono sottili)

/** I pezzi come componenti connesse della trasparenza, su una griglia di blocchi B × B. */
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

/** Solo i pixel del pezzo `c`, rifilati con un margine. */
function estrai(img, { label, gw }, c, pad = 4) {
  const { w, h, px } = img
  const x0 = Math.max(0, c.x0 * B - pad)
  const y0 = Math.max(0, c.y0 * B - pad)
  const x1 = Math.min(w, (c.x1 + 1) * B + pad)
  const y1 = Math.min(h, (c.y1 + 1) * B + pad)
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
  return { w: cw, h: ch, px: out }
}

/** Il fermacampioni: macchie dorate quasi tonde tra l'1% e il 4,5% del foglio; la più tonda vince. */
function perni(piece, rif) {
  const { px } = piece
  const oro = (i) => {
    const [r, g, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]]
    return a > 200 && r > 140 && g > 100 && r >= g && r - b > 60 && g - b > 35 && r - g < 90
  }
  return macchie(piece, oro)
    .filter((c) => c.bw > rif * 0.01 && c.bw < rif * 0.045 && c.bh > rif * 0.01 && c.bh < rif * 0.045)
    .map((c) => ({ x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2, d: (c.bw + c.bh) / 2, aspetto: c.bw / c.bh, pieno: c.n / ((Math.PI / 4) * c.bw * c.bh) }))
    .filter((c) => c.aspetto > 0.7 && c.aspetto < 1.4 && c.pieno > 0.55)
    .sort((a, b) => Math.abs(1 - a.aspetto) + Math.abs(0.85 - a.pieno) - (Math.abs(1 - b.aspetto) + Math.abs(0.85 - b.pieno)))
}

async function usa(file, nomi) {
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const img = leggi(src)
  if (fondoMagenta(img)) {
    chiave(img)
    console.log('  fondo magenta tolto con la chiave cromatica')
  }
  const trovati = separa(img)
  const { grandi, briciole } = trovati
  console.log(`→ aragosta: ${grandi.length} pezzi (${briciole} briciole scartate) in un foglio ${img.w} × ${img.h}`)
  grandi.forEach((c, i) => console.log(`  ${i + 1}. x ${c.x0 * B}–${(c.x1 + 1) * B}, y ${c.y0 * B}–${(c.y1 + 1) * B} (${((c.n * B * B) / 1000).toFixed(0)}k px)`))
  if (!nomi) return console.log("  dai un nome ai pezzi in quest'ordine: … usa <file> corpo,coda,…  («-» per scartarne uno)")

  const elenco = nomi.split(',').map((s) => s.trim())
  if (elenco.length !== grandi.length) die(`${elenco.length} nomi per ${grandi.length} pezzi`)
  if (existsSync(OUT)) await rm(OUT, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const r1 = (v) => Math.round(v * SCALA * 10) / 10
  const voci = {}
  for (const [i, c] of grandi.entries()) {
    const nome = elenco[i]
    if (nome === '-') continue
    const piece = estrai(img, trovati, c)
    const pins = perni(piece, img.w)
    const eyes = nome === 'corpo' ? occhi(piece, { rif: img.w }) : []
    const [w, h] = await scriviWebp(piece, join(OUT, `${nome}.webp`), SCALA)
    voci[nome] = { w, h, pin: pins[0] ? [r1(pins[0].x), r1(pins[0].y)] : null, eyes: eyes.map((e) => ({ x: r1(e.cx), y: r1(e.cy), rx: r1(e.rx), ry: r1(e.ry), skin: e.skin })) }
    const altri = pins.slice(1).map((p) => `(${r1(p.x)}, ${r1(p.y)})`).join(' ')
    console.log(`  ✓ ${nome}.webp ${w} × ${h}${pins[0] ? `, perno (${r1(pins[0].x)}, ${r1(pins[0].y)})` : ', nessun perno'}${altri ? `, altri candidati ${altri}` : ''}${eyes.length ? `, ${eyes.length} occhi` : ''}`)
  }

  const righe = Object.entries(voci).map(([p, d]) => {
    const eyes = d.eyes.map((e) => `{ x: ${e.x}, y: ${e.y}, rx: ${e.rx}, ry: ${e.ry}, skin: '${e.skin}' }`).join(', ')
    return `  ${p}: { w: ${d.w}, h: ${d.h}, pin: ${d.pin ? `[${d.pin.join(', ')}]` : 'null'}, eyes: [${eyes}] },`
  })
  await writeFile(
    MANIFEST,
    `// Generato da tools/aragosta/aragosta.mjs usa: i pezzi dell'aragosta in\n// public/media/aragosta/<pezzo>.webp, con misure, perno (il fermacampioni\n// trovato dallo script) e occhi, in pixel dell'immagine del pezzo. Il montaggio\n// sta a mano in aragosta.js.\n\nexport const pezzi = {\n${righe.join('\n')}\n}\n`,
  )
  console.log('  src/data/aragosta-pezzi.js scritto')
}

const [cmd, a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'))
if (cmd === 'intero') await intero()
else if (cmd === 'pezzi' && a) await pezzi(a)
else if (cmd === 'usa' && a) await usa(a, b)
else if (cmd === 'recupera' && ['intero', 'pezzi'].includes(a) && b) await salva(await prediction(b), join(LAVORO, a), { fase: a })
else die('uso: aragosta.mjs intero · pezzi <intero.png> · usa <pezzi.png> [nomi] · recupera <intero|pezzi> <id>')
