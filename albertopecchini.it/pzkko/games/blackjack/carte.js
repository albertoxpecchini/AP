// Le facce e il dorso delle carte del blackjack di pzkko.it, disegnati in un
// canvas (diventano le texture delle carte 3D, vedi scena.js). Carte da casinò
// a indice grande: il valore in Anton (il carattere dei volantini), i semi
// disegnati qui sotto, le figure (fanti, regine, re) a due teste fatte con la
// metà disegnata da gpt-image-2 (art/blackjack/, tools/pzkko/blackjack/figure.mjs)
// e la stessa metà girata di 180°. Il dorso è rosso pzkko con una trama fine.

export const W = 360, H = 504 // 63 × 88 mm, le carte «poker» dei casinò
export const ROSSO = '#c8102e', NERO = '#121212', CARTA = '#fdfcfa'
const ART = '/art/blackjack/'

// i quattro semi in una scatola 100 × 100
const PERCORSI = {
  c: 'M50 96C44 86 6 62 6 32C6 15 18 4 32 4C41 4 47 9 50 17C53 9 59 4 68 4C82 4 94 15 94 32C94 62 56 86 50 96Z',
  q: 'M50 2C60 22 74 38 92 50C74 62 60 78 50 98C40 78 26 62 8 50C26 38 40 22 50 2Z',
  p: 'M50 2C56 16 94 38 94 62C94 77 83 86 70 86C61 86 55 81 52 74C53 84 57 92 66 98L34 98C43 92 47 84 48 74C45 81 39 86 30 86C17 86 6 77 6 62C6 38 44 16 50 2Z',
  f: 'M71 28A21 21 0 1 1 29 28A21 21 0 1 1 71 28ZM48 59A21 21 0 1 1 6 59A21 21 0 1 1 48 59ZM94 59A21 21 0 1 1 52 59A21 21 0 1 1 94 59ZM50 40L60 64L40 64ZM54 60C54 80 59 90 68 98L32 98C41 90 46 80 46 60Z',
}
export const PERCORSO_SEME = PERCORSI
const tracce = {}
const traccia = (s) => (tracce[s] ??= new Path2D(PERCORSI[s]))
export const rosso = (s) => s === 'c' || s === 'q'

/** Un seme largo `l` px centrato in (x, y), girato di 180° se `giu`. */
function seme(g, s, x, y, l, giu = false) {
  g.save()
  g.translate(x, y)
  if (giu) g.rotate(Math.PI)
  g.scale(l / 100, l / 100)
  g.translate(-50, -50)
  g.fillStyle = rosso(s) ? ROSSO : NERO
  g.fill(traccia(s))
  g.restore()
}

let figure = null
/** Carica il carattere e le figure: va atteso prima di disegnare le carte. */
export async function preparaCarte() {
  if (figure) return figure
  const carica = (src) => new Promise((ok) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })
  const nomi = ['J', 'Q', 'K'].flatMap((f) => ['c', 'q', 'f', 'p'].map((s) => f + s))
  const [imgs] = await Promise.all([Promise.all(nomi.map((n) => carica(`${ART}${n}.webp`))), document.fonts.load(`400 80px Anton`).catch(() => {})])
  figure = Object.fromEntries(nomi.map((n, i) => [n, imgs[i]]))
  return figure
}

function tela() {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  return c
}

// la grana della carta telata dei casinò: un velo di puntini, sempre lo stesso
let grana = null
function telata(g) {
  if (!grana) {
    grana = document.createElement('canvas')
    grana.width = 128; grana.height = 128
    const q = grana.getContext('2d'), d = q.createImageData(128, 128)
    let a = 4122
    const rnd = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
    for (let i = 0; i < d.data.length; i += 4) { const v = 200 + rnd() * 55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 }
    q.putImageData(d, 0, 0)
  }
  g.save()
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 0.06
  g.fillStyle = g.createPattern(grana, 'repeat')
  g.fillRect(0, 0, W, H)
  g.restore()
}

const NOMI = { A: 'A', J: 'J', Q: 'Q', K: 'K' }
// l'indice grande: il valore e il seme sotto, in alto a sinistra e (girato) in basso a destra
function indice(g, r, s) {
  const col = rosso(s) ? ROSSO : NERO
  for (const giu of [false, true]) {
    g.save()
    if (giu) { g.translate(W, H); g.rotate(Math.PI) }
    g.fillStyle = col
    g.textAlign = 'center'
    g.textBaseline = 'alphabetic'
    const t = NOMI[r] ?? r
    g.font = `400 ${r === '10' ? 70 : 78}px Anton, Impact, sans-serif`
    // il 10 si stringe un po', come sulle carte vere
    g.save()
    g.translate(44, 92)
    if (r === '10') g.scale(0.78, 1)
    g.fillText(t, 0, 0)
    g.restore()
    seme(g, s, 44, 124, 44)
    g.restore()
  }
}

// le posizioni dei semi delle carte numerate, in colonne (s, c, d) e righe 0…6
const L = 0.335, C = 0.5, R = 0.665
const DISPOSIZIONI = {
  2: [[C, 0], [C, 6]],
  3: [[C, 0], [C, 3], [C, 6]],
  4: [[L, 0], [R, 0], [L, 6], [R, 6]],
  5: [[L, 0], [R, 0], [C, 3], [L, 6], [R, 6]],
  6: [[L, 0], [R, 0], [L, 3], [R, 3], [L, 6], [R, 6]],
  7: [[L, 0], [R, 0], [C, 1.5], [L, 3], [R, 3], [L, 6], [R, 6]],
  8: [[L, 0], [R, 0], [C, 1.5], [L, 3], [R, 3], [C, 4.5], [L, 6], [R, 6]],
  9: [[L, 0], [R, 0], [L, 2], [R, 2], [C, 3], [L, 4], [R, 4], [L, 6], [R, 6]],
  10: [[L, 0], [R, 0], [C, 1], [L, 2], [R, 2], [L, 4], [R, 4], [C, 5], [L, 6], [R, 6]],
}

const facce = new Map()
/** La faccia di una carta (rango 'A' '2'…'10' 'J' 'Q' 'K', seme c q f p), in un canvas W × H. */
export function faccia(r, s) {
  const k = r + s
  if (facce.has(k)) return facce.get(k)
  const c = tela(), g = c.getContext('2d')
  g.fillStyle = CARTA
  g.fillRect(0, 0, W, H)
  telata(g)
  indice(g, r, s)
  if (DISPOSIZIONI[r]) {
    const y0 = H * 0.17, y1 = H * 0.83, l = r === '10' || r === '9' ? 64 : 70
    for (const [x, riga] of DISPOSIZIONI[r]) seme(g, s, x * W, y0 + ((y1 - y0) * riga) / 6, l, riga > 3)
  } else if (r === 'A') {
    if (s === 'p') {
      // l'asso di picche: grande, con un filo intorno e il nome sotto
      seme(g, s, W / 2, H / 2 - 6, 190)
      g.save()
      g.strokeStyle = NERO
      g.translate(W / 2, H / 2 - 6)
      g.scale(212 / 100, 212 / 100)
      g.translate(-50, -50)
      g.lineWidth = 1.1
      g.stroke(traccia('p'))
      g.restore()
      g.fillStyle = NERO
      g.font = '400 22px Anton, Impact, sans-serif'
      g.textAlign = 'center'
      g.fillText('pzkko', W / 2, H / 2 + 128)
    } else seme(g, s, W / 2, H / 2, 112)
  } else figura(g, r, s)
  return facce.set(k, c), c
}

// fanti, regine, re: il riquadro, la metà di sopra, la stessa girata sotto, un seme piccolo accanto alla testa
function figura(g, r, s) {
  const x0 = 68, x1 = W - 68, y0 = 26, y1 = H - 26, ym = H / 2
  const img = figure?.[r + s]
  g.save()
  g.beginPath()
  g.rect(x0, y0, x1 - x0, y1 - y0)
  g.clip()
  if (img) {
    const fw = x1 - x0 - 6, fh = ym - y0 - 6
    const k = Math.min((fw * 1.1) / img.width, fh / img.height) // può sbordare un poco ai lati: il riquadro taglia
    const w = img.width * k, h = img.height * k
    for (const giu of [false, true]) {
      g.save()
      if (giu) { g.translate(W, H); g.rotate(Math.PI) }
      g.globalCompositeOperation = 'multiply'
      g.drawImage(img, (W - w) / 2, ym - h, w, h)
      g.restore()
    }
  }
  g.restore()
  // il filo del riquadro e la riga in mezzo
  g.strokeStyle = NERO
  g.lineWidth = 2.2
  g.strokeRect(x0, y0, x1 - x0, y1 - y0)
  g.lineWidth = 1.2
  g.beginPath()
  g.moveTo(x0, ym); g.lineTo(x1, ym)
  g.stroke()
  seme(g, s, x0 + 22, y0 + 26, 28)
  seme(g, s, x1 - 22, y1 - 26, 28, true)
}

let dorsoTela = null
/** Il dorso: bordo bianco, campo rosso con una trama a rombi e il medaglione pzkko. */
export function dorso() {
  if (dorsoTela) return dorsoTela
  const c = tela(), g = c.getContext('2d')
  g.fillStyle = CARTA
  g.fillRect(0, 0, W, H)
  const m = 20, rr = 14
  const campo = new Path2D()
  campo.roundRect(m, m, W - 2 * m, H - 2 * m, rr)
  g.fillStyle = '#a50d25'
  g.fill(campo)
  g.save()
  g.clip(campo)
  // la trama: due fasci di righe sottili a ±60°, poi i rombi piccoli
  g.strokeStyle = 'rgba(255,240,230,.33)'
  g.lineWidth = 1.3
  for (const a of [Math.PI / 3, -Math.PI / 3]) {
    g.save()
    g.translate(W / 2, H / 2)
    g.rotate(a)
    for (let k = -40; k <= 40; k++) { g.beginPath(); g.moveTo(-500, k * 12); g.lineTo(500, k * 12); g.stroke() }
    g.restore()
  }
  g.fillStyle = 'rgba(80,0,10,.35)'
  for (let y = m; y < H - m; y += 20.8) for (let x = m + ((Math.round((y - m) / 20.8) % 2) * 6); x < W - m; x += 12) { g.beginPath(); g.arc(x, y, 1.2, 0, Math.PI * 2); g.fill() }
  g.restore()
  // i fili bianchi intorno
  g.strokeStyle = CARTA
  g.lineWidth = 3
  const f1 = new Path2D(); f1.roundRect(m + 10, m + 10, W - 2 * m - 20, H - 2 * m - 20, 9); g.stroke(f1)
  g.lineWidth = 1.2
  const f2 = new Path2D(); f2.roundRect(m + 17, m + 17, W - 2 * m - 34, H - 2 * m - 34, 6); g.stroke(f2)
  // il medaglione: un rombo bianco con il nome
  g.save()
  g.translate(W / 2, H / 2)
  g.fillStyle = CARTA
  g.beginPath(); g.moveTo(0, -112); g.lineTo(96, 0); g.lineTo(0, 112); g.lineTo(-96, 0); g.closePath(); g.fill()
  g.strokeStyle = '#a50d25'
  g.lineWidth = 2
  g.beginPath(); g.moveTo(0, -100); g.lineTo(84, 0); g.lineTo(0, 100); g.lineTo(-84, 0); g.closePath(); g.stroke()
  g.fillStyle = '#a50d25'
  g.font = '400 44px Anton, Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('pzkko', 0, 2)
  seme(g, 'c', 0, -62, 22); seme(g, 'p', 0, 62, 22, true); seme(g, 'q', -56, 0, 16); seme(g, 'f', 56, 0, 16)
  g.restore()
  telata(g)
  dorsoTela = c
  return c
}

let costaTela = null
/** Il fianco di un mazzo: tante righe sottili (per il sabot e la vaschetta degli scarti). */
export function costa() {
  if (costaTela) return costaTela
  const c = document.createElement('canvas')
  c.width = 8; c.height = 256
  const g = c.getContext('2d')
  for (let y = 0; y < 256; y++) { const k = y % 4 === 0 ? 205 : 244 - ((y * 37) % 9); g.fillStyle = `rgb(${k},${k - 2},${k - 6})`; g.fillRect(0, y, 8, 1) }
  costaTela = c
  return c
}
