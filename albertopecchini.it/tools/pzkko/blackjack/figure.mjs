#!/usr/bin/env node
// Le figure delle carte del blackjack di pzkko.it (fanti, regine e re dei quattro
// semi), disegnate da openai/gpt-image-2 su Replicate in qualità high. Il modello
// disegna su fondo bianco la metà di sopra di ogni figura, tagliata dritta in
// vita, come la metà di una figura a due teste: la carta (games/blackjack/carte.js)
// la mette nel riquadro e ci mette sotto la stessa metà girata di 180°, gli
// indici e i semi; il bianco sparisce in «multiply» sulla carta.
//
//   node tools/pzkko/blackjack/figure.mjs genera
//       disegna il foglio in tools/pzkko/lavoro/figure-blackjack/
//   node tools/pzkko/blackjack/figure.mjs recupera <id-predizione>
//   node tools/pzkko/blackjack/figure.mjs usa [file.png]
//       taglia le 12 celle, rifila il bianco e scrive pzkko/art/blackjack/<J|Q|K><c|q|f|p>.webp
//       (senza file: l'ultimo PNG del foglio)

import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva } from '../../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/figure-blackjack')
const OUT = join(ROOT, 'pzkko/art/blackjack')
const SEMI = ['c', 'q', 'f', 'p'] // cuori, quadri, fiori, picche: le colonne
const FIGURE = ['J', 'Q', 'K'] // fante, regina, re: le righe
const ASPETTO = '2048x1152' // celle 512 × 384: le mezze figure sono più larghe che alte

export const PROMPT = `A printed sheet of the twelve court figures of a classic casino deck of playing cards, laid out in a 4 × 3 grid (four columns, three rows) on a pure flat white background (#ffffff), each figure alone in its cell with generous empty white space around it, none touching another, nothing cropped by the edge, all drawn at exactly the same scale and the same height.
Each figure is ONE HALF of a double-headed court card: the figure from the top of the crown or hat down to the waist, and there the figure ends in a perfectly straight, clean HORIZONTAL cut that runs across the whole width of the robes, with nothing at all below it (the other half is added later, mirrored). The figures face the viewer, slightly turned, the classic English/French pattern of real casino cards.
Columns, left to right: hearts, diamonds, clubs, spades. Rows, top to bottom: jacks, queens, kings.
- Row 1, jacks: young men with shoulder-length hair under a flat cap; the jack of hearts in profile holding a feather, the jack of diamonds in profile holding a halberd, the jack of clubs holding an arrow, the jack of spades in profile holding a long staff.
- Row 2, queens: crowned queens with long hair and a veil; the queen of hearts holding a rose, the queen of diamonds holding a tulip, the queen of clubs holding a flower, the queen of spades holding a sceptre.
- Row 3, kings: crowned bearded kings with ermine collars; the king of hearts with a sword raised behind his head, the king of diamonds in profile holding an axe, the king of clubs holding an orb, the king of spades holding an upright sword.
Style: crisp traditional playing-card printing, like a premium casino deck: fine black ink linework with delicate engraved hatching, filled with flat spot colours only: bright red (#c8102e), royal blue (#1d3f8f), golden yellow (#f2b632) and black, on white. Every figure uses the same four inks; the robes have the classic geometric folds, borders and patterns of court cards. No gradients, no shading other than ink hatching, no texture of paper.
ABSOLUTELY NO suit symbols, NO letters, NO numbers, NO card border, NO frame, NO rectangle around the figures, NO shadows: only the twelve half-figures on white.`

async function genera() {
  const input = { prompt: PROMPT, aspect_ratio: ASPETTO, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  console.log('→ figure: 12 mezze figure, qualità high, attendo il modello…')
  const p = await predict(input, 'node tools/pzkko/blackjack/figure.mjs recupera')
  await salva(p, LAVORO, { foglio: 'figure-blackjack' })
}

async function usa(file) {
  if (!file) {
    const png = (await readdir(LAVORO)).filter((f) => f.endsWith('.png')).sort().at(-1)
    if (!png) die(`nessun PNG in ${LAVORO}`)
    file = join(LAVORO, png)
  }
  const { default: sharp } = await import('sharp')
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const cw = W / 4, ch = H / 3
  await mkdir(OUT, { recursive: true })
  // l'inchiostro in blocchi di 4 px, le macchie connesse, e ogni macchia alla cella del suo baricentro
  // (le celle non bastano: la spada del re di picche sale fin quasi nella cella sopra)
  const B = 4, gw = Math.ceil(W / B), gh = Math.ceil(H / B)
  const pieno = new Uint8Array(gw * gh)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; if (data[i] + data[i + 1] + data[i + 2] < 3 * 232) pieno[((y / B) | 0) * gw + ((x / B) | 0)] = 1 }
  const visto = new Uint8Array(gw * gh)
  const celle = Array.from({ length: 12 }, () => ({ a: W, b: H, d: 0, e: 0 }))
  for (let s = 0; s < gw * gh; s++) {
    if (!pieno[s] || visto[s]) continue
    const pila = [s], blocchi = []
    visto[s] = 1
    while (pila.length) {
      const p = pila.pop()
      blocchi.push(p)
      const x = p % gw, y = (p / gw) | 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
        const q = ny * gw + nx
        if (pieno[q] && !visto[q]) { visto[q] = 1; pila.push(q) }
      }
    }
    if (blocchi.length < 4) continue // una briciola
    let sx = 0, sy = 0
    for (const p of blocchi) { sx += p % gw; sy += (p / gw) | 0 }
    const cx = ((sx / blocchi.length) * B) / cw | 0, cy = ((sy / blocchi.length) * B) / ch | 0
    const k = celle[Math.min(2, cy) * 4 + Math.min(3, cx)]
    for (const p of blocchi) { const x = (p % gw) * B, y = ((p / gw) | 0) * B; k.a = Math.min(k.a, x); k.b = Math.min(k.b, y); k.d = Math.max(k.d, x + B - 1); k.e = Math.max(k.e, y + B - 1) }
  }
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const nome = `${FIGURE[r]}${SEMI[c]}`
    let { a, b, d, e } = celle[r * 4 + c]
    if (d <= a || e <= b) die(`cella ${r},${c} vuota`)
    // il taglio in vita: l'ultima riga con l'inchiostro (al pixel, non al blocco), così la figura combacia con la sua metà girata
    const riga = (y) => { let n = 0; for (let x = a; x <= Math.min(W - 1, d); x++) { const i = (y * W + x) * 3; if (data[i] + data[i + 1] + data[i + 2] < 3 * 232) n++ } return n }
    while (e > b && riga(Math.min(H - 1, e)) < 3) e--
    const box = { left: Math.max(0, a - 4), top: Math.max(0, b - 4), width: Math.min(W, d + 5) - Math.max(0, a - 4), height: Math.min(H, e + 1) - Math.max(0, b - 4) }
    const out = join(OUT, `${nome}.webp`)
    await sharp(file).removeAlpha().extract(box).webp({ quality: 90, effort: 6 }).toFile(out)
    await writeFile(`${out}.json`, JSON.stringify({ fonte: 'openai/gpt-image-2 su Replicate, qualità high', foglio: 'tools/pzkko/blackjack/figure.mjs', cella: [c, r], prompt: PROMPT }, null, 2))
    console.log(`  ✓ ${nome}.webp ${box.width} × ${box.height}`)
  }
}

const [cmd, arg] = process.argv.slice(2)
if (cmd === 'genera') await genera()
else if (cmd === 'recupera') { if (!arg) die('serve l\'id della predizione'); await salva(await prediction(arg), LAVORO, { foglio: 'figure-blackjack' }) }
else if (cmd === 'usa') await usa(arg)
else die('uso: figure.mjs genera | recupera <id> | usa [file.png]')
