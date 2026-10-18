// «usa» dei burattini: dal foglio dei pezzi (2048 × 2048, fondo trasparente) ai
// file del sito.
//
//   node tools/mascotte/burattini.mjs usa <nome> <pezzi.png>
//       elenca i pezzi trovati (numerati in ordine di lettura) con il loro riquadro
//   node tools/mascotte/burattini.mjs usa <nome> <pezzi.png> corpo,collo,testa,…
//       dà un nome a ciascun pezzo nello stesso ordine («-» scarta il pezzo) e scrive
//       public/media/mascotte/<nome>/<pezzo>.webp e src/data/burattini-pezzi.js
//
// Per ogni pezzo lo script cerca il fermacampioni (un disco dorato quasi tondo:
// è il perno su cui il pezzo gira) e, nella testa (o nei peduncoli), gli occhi. Se sbaglia, il
// perno si corregge a mano in src/data/burattini.js (`pin`), che ha la
// precedenza su quello trovato qui.

import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { ROOT, die } from '../replicate.mjs'
import { burattini } from './burattini.js'
import { chiave, fondoMagenta, leggi, macchie, occhi, ritaglia, scriviWebp } from './immagine.mjs'

const OUT = join(ROOT, 'public/media/mascotte')
const MANIFEST = join(ROOT, 'src/data/burattini-pezzi.js')
const B = 4 // lato dei blocchi con cui si separano i pezzi
const MIN = 60 // blocchi: sotto è una briciola

/** I pezzi come componenti connesse della trasparenza, su una griglia di blocchi B × B. */
function pezzi(img) {
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
  const briciole = comps.length - grandi.length
  // ordine di lettura: per righe (a tolleranza di 1/8 del foglio), poi da sinistra
  const riga = (c) => Math.round(((c.y0 + c.y1) / 2) / (gh / 8))
  grandi.sort((a, b) => riga(a) - riga(b) || a.x0 - b.x0)
  return { grandi, briciole, label, gw }
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
      // i blocchi vicini (anche il margine) valgono se appartengono a questo pezzo
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

/** Il fermacampioni: macchie dorate quasi tonde tra l'1% e il 4% del foglio; la più tonda vince. */
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

export async function usa(nome, file, nomi) {
  const b = burattini[nome] || die(`nessun burattino «${nome}»`)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const img = leggi(src)
  // dal 30.09.2026 i fogli arrivano su fondo magenta (vedi FONDO in burattini.js)
  if (fondoMagenta(img)) {
    chiave(img)
    console.log('  fondo magenta tolto con la chiave cromatica')
  }
  const trovati = pezzi(img)
  const { grandi, briciole } = trovati
  console.log(`→ ${nome}: ${grandi.length} pezzi (${briciole} briciole scartate) in un foglio ${img.w} × ${img.h}`)
  grandi.forEach((c, i) => console.log(`  ${i + 1}. x ${c.x0 * B}–${(c.x1 + 1) * B}, y ${c.y0 * B}–${(c.y1 + 1) * B} (${(c.n * B * B / 1000).toFixed(0)}k px)`))
  if (!nomi) return console.log('  dai un nome ai pezzi in quest\'ordine: … usa <nome> <file> corpo,testa,…  («-» per scartarne uno)')

  const elenco = nomi.split(',').map((s) => s.trim())
  if (elenco.length !== grandi.length) die(`${elenco.length} nomi per ${grandi.length} pezzi`)
  const scala = b.scala || 0.5
  const dir = join(OUT, nome)
  if (existsSync(dir)) await rm(dir, { recursive: true })
  await mkdir(dir, { recursive: true })

  const voce = { scala, pezzi: {} }
  const r1 = (v) => Math.round(v * scala * 10) / 10
  for (const [i, c] of grandi.entries()) {
    const pezzo = elenco[i]
    if (pezzo === '-') continue
    let piece = estrai(img, trovati, c)
    // `ritaglia` in burattini.js: si tiene solo un riquadro del pezzo (il collo
    // della vecchia tartaruga, che il modello disegnava lungo: la parte dentro il guscio
    // non serve e uscirebbe da dietro quando la testa rientra)
    const taglio = b.ritaglia?.[pezzo]
    if (taglio) {
      const [x0, y0] = [taglio.x || 0, taglio.y || 0]
      piece = { ...ritaglia(piece, x0, y0, Math.min(taglio.w || piece.w, piece.w - x0), Math.min(taglio.h || piece.h, piece.h - y0)), ox: piece.ox + x0, oy: piece.oy + y0 }
    }
    const pins = perni(piece, img.w)
    // gli occhi stanno sulla testa, o in cima ai peduncoli della chiocciola (uno per peduncolo)
    const eyes = /^testa/.test(pezzo) ? occhi(piece, { rif: img.w }) : /^peduncolo/.test(pezzo) ? occhi(piece, { rif: img.w, quanti: 1 }) : []
    const [w, h] = await scriviWebp(piece, join(dir, `${pezzo}.webp`), scala)
    voce.pezzi[pezzo] = {
      w,
      h,
      pin: pins[0] ? [r1(pins[0].x), r1(pins[0].y)] : null,
      eyes: eyes.map((e) => ({ x: r1(e.cx), y: r1(e.cy), rx: r1(e.rx), ry: r1(e.ry), skin: e.skin })),
    }
    const altri = pins.slice(1).map((p) => `(${r1(p.x)}, ${r1(p.y)})`).join(' ')
    console.log(`  ✓ ${pezzo}.webp ${w} × ${h}${pins[0] ? `, perno (${r1(pins[0].x)}, ${r1(pins[0].y)}) ⌀ ${r1(pins[0].d)}` : ', nessun perno'}${altri ? `, altri candidati ${altri}` : ''}${eyes.length ? `, ${eyes.length} occhi` : ''}`)
  }

  const prima = existsSync(MANIFEST) ? (await import(`${pathToFileURL(MANIFEST).href}?t=${Date.now()}`)).pezzi : {}
  const tutti = { ...prima, [nome]: voce }
  const righe = Object.keys(tutti)
    .sort()
    .map((k) => {
      const v = tutti[k]
      const ps = Object.entries(v.pezzi).map(([p, d]) => {
        const eyes = d.eyes.map((e) => `{ x: ${e.x}, y: ${e.y}, rx: ${e.rx}, ry: ${e.ry}, skin: '${e.skin}' }`).join(', ')
        return `      ${p}: { w: ${d.w}, h: ${d.h}, pin: ${d.pin ? `[${d.pin.join(', ')}]` : 'null'}, eyes: [${eyes}] },`
      })
      return `  ${k}: {\n    scala: ${v.scala},\n    pezzi: {\n${ps.join('\n')}\n    },\n  },`
    })
  await writeFile(
    MANIFEST,
    `// Generato da tools/mascotte/burattini.mjs usa: i pezzi dei burattini in\n// public/media/mascotte/<nome>/<pezzo>.webp, con misure, perno (il fermacampioni\n// trovato dallo script) e occhi, in pixel dell'immagine del pezzo. Il montaggio\n// (dove si attacca ogni pezzo, quanto gira) sta a mano in burattini.js.\n\nexport const pezzi = {\n${righe.join('\n')}\n}\n`,
  )
  console.log(`  src/data/burattini-pezzi.js: ${Object.keys(tutti).length} burattini`)
}
