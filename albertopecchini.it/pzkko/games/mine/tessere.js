// Le facce delle tessere delle mine di pzkko.it, disegnate in un canvas (diventano
// le texture delle tessere 3D, vedi scena.js): il dorso rosso pzkko con la trama
// fine delle carte del blackjack, la faccia color avorio con la cornice stampata
// e sopra la gemma (stampata in serigrafia, tre verdi e il nero un filo fuori
// registro) o la bomba del volantino (art/arte2/bomba.webp, la stessa
// illustrazione). E le macchie degli effetti: la scintilla della miccia, il
// lampo, il fumo.

export const W = 256
const ROSSO = '#a50d25', CREMA = '#f6f0e2', NERO = '#161616'
const VERDI = ['#9be8bd', '#3cc77f', '#17914f', '#0b5d33']

const tela = (w = W, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

let bomba = null
/** Carica la bomba del volantino: va atteso prima di disegnare le facce. */
export async function preparaTessere() {
  if (bomba) return
  bomba = await new Promise((ok) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = '/art/arte2/bomba.webp' })
}

// la grana della vernice: un velo di puntini, sempre lo stesso
let grana = null
function granata(g) {
  if (!grana) {
    grana = tela(128)
    const q = grana.getContext('2d'), d = q.createImageData(128, 128)
    let a = 2511
    const rnd = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
    for (let i = 0; i < d.data.length; i += 4) { const v = 200 + rnd() * 55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 }
    q.putImageData(d, 0, 0)
  }
  g.save()
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 0.07
  g.fillStyle = g.createPattern(grana, 'repeat')
  g.fillRect(0, 0, W, W)
  g.restore()
}

let dorsoTela = null
/** Il dorso: rosso fino al bordo, due fasci di righe sottili, i fili color crema e il rombo in mezzo. */
export function dorso() {
  if (dorsoTela) return dorsoTela
  const c = tela(), g = c.getContext('2d')
  g.fillStyle = ROSSO
  g.fillRect(0, 0, W, W)
  g.save()
  g.strokeStyle = 'rgba(255,240,230,.3)'
  g.lineWidth = 1.2
  for (const a of [Math.PI / 3, -Math.PI / 3]) {
    g.save()
    g.translate(W / 2, W / 2)
    g.rotate(a)
    for (let k = -30; k <= 30; k++) { g.beginPath(); g.moveTo(-300, k * 10); g.lineTo(300, k * 10); g.stroke() }
    g.restore()
  }
  g.fillStyle = 'rgba(80,0,10,.35)'
  for (let y = 4; y < W; y += 17.3) for (let x = 4 + ((Math.round(y / 17.3) % 2) * 5); x < W; x += 10) { g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill() }
  g.restore()
  // i fili intorno (dentro lo smusso, che si mangia il bordo)
  g.strokeStyle = CREMA
  g.lineWidth = 4
  const f1 = new Path2D(); f1.roundRect(26, 26, W - 52, W - 52, 16); g.stroke(f1)
  g.lineWidth = 1.5
  const f2 = new Path2D(); f2.roundRect(35, 35, W - 70, W - 70, 11); g.stroke(f2)
  // il rombo, col rombo pieno dentro
  g.save()
  g.translate(W / 2, W / 2)
  g.fillStyle = CREMA
  g.beginPath(); g.moveTo(0, -44); g.lineTo(38, 0); g.lineTo(0, 44); g.lineTo(-38, 0); g.closePath(); g.fill()
  g.fillStyle = ROSSO
  g.beginPath(); g.moveTo(0, -25); g.lineTo(21, 0); g.lineTo(0, 25); g.lineTo(-21, 0); g.closePath(); g.fill()
  g.strokeStyle = ROSSO
  g.lineWidth = 1.5
  g.beginPath(); g.moveTo(0, -36); g.lineTo(30, 0); g.lineTo(0, 36); g.lineTo(-30, 0); g.closePath(); g.stroke()
  g.restore()
  granata(g)
  dorsoTela = c
  return c
}

// la gemma vista di lato, come l'icona: corona, cintura, padiglione; le faccette in tre verdi, il nero fuori registro
function gemma(g, s, cx, cy) {
  const P = (x, y) => [cx + x * s, cy + y * s]
  const GL = P(-0.5, -0.12), GR = P(0.5, -0.12), TL = P(-0.29, -0.36), TR = P(0.29, -0.36), M1 = P(-0.12, -0.12), M2 = P(0.12, -0.12), C = P(0, 0.44)
  const facce = [[[GL, TL, M1], 1], [[TL, TR, M2, M1], 0], [[TR, GR, M2], 1], [[GL, M1, C], 2], [[M1, M2, C], 1], [[M2, GR, C], 3]]
  const via = (pp, dx = 0, dy = 0) => { g.beginPath(); pp.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); g.closePath() }
  for (const [pp, k] of facce) { via(pp); g.fillStyle = VERDI[k]; g.fill() }
  // il nero, spostato di un pelo come una serigrafia a due passaggi
  g.strokeStyle = NERO
  g.lineJoin = 'round'
  g.lineWidth = s * 0.035
  const dx = s * 0.018, dy = s * 0.012
  via([GL, TL, TR, GR, C], dx, dy); g.stroke()
  g.lineWidth = s * 0.018
  for (const [a, b] of [[GL, GR], [TL, M1], [TR, M2], [M1, C], [M2, C]]) { g.beginPath(); g.moveTo(a[0] + dx, a[1] + dy); g.lineTo(b[0] + dx, b[1] + dy); g.stroke() }
  // il luccichio: una stella a quattro punte bianca
  const [sx, sy] = P(-0.3, -0.46)
  g.fillStyle = '#fff'
  g.beginPath()
  for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, r = k % 2 ? s * 0.025 : s * 0.11; g.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r) }
  g.closePath(); g.fill()
}

const facce = new Map()
/** La faccia: 'vuota' (sotto la gemma 3D), 'gemma' (stampata) o 'mina' (la bomba del volantino). */
export function faccia(tipo) {
  if (facce.has(tipo)) return facce.get(tipo)
  const c = tela(), g = c.getContext('2d')
  g.fillStyle = CREMA
  g.fillRect(0, 0, W, W)
  // la cornice stampata
  g.strokeStyle = 'rgba(22,22,22,.5)'
  g.lineWidth = 2
  const f = new Path2D(); f.roundRect(28, 28, W - 56, W - 56, 12); g.stroke(f)
  if (tipo === 'gemma') gemma(g, W * 0.56, W / 2, W * 0.53)
  if (tipo === 'mina' && bomba) {
    // tutta l'illustrazione del volantino, bomba e bandierina, in multiply come la stampa
    const h = W * 0.66, w = (h * bomba.naturalWidth) / bomba.naturalHeight
    g.save()
    g.globalCompositeOperation = 'multiply'
    g.drawImage(bomba, (W - w) / 2 + W * 0.02, (W - h) / 2, w, h)
    g.restore()
  }
  granata(g)
  facce.set(tipo, c)
  return c
}

/** La scintilla della miccia (come quella del volantino): raggi gialli, il cuore bianco. */
export function scintilla() {
  const c = tela(128), g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 30)
  r.addColorStop(0, 'rgba(255,255,240,1)'); r.addColorStop(0.35, 'rgba(255,220,80,.9)'); r.addColorStop(1, 'rgba(255,160,0,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = '#ffd400'
  g.lineCap = 'round'
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + (k % 3) * 0.1, r0 = 10 + (k % 2) * 6, r1 = 34 + ((k * 37) % 22)
    g.lineWidth = k % 2 ? 2 : 3.5
    g.beginPath(); g.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); g.lineTo(64 + Math.cos(a) * r1, 64 + Math.sin(a) * r1); g.stroke()
  }
  return c
}

/** Il lampo dello scoppio: bianco al centro, poi giallo e arancio che sfuma. */
export function lampo() {
  const c = tela(256), g = c.getContext('2d')
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  r.addColorStop(0, 'rgba(255,255,245,1)'); r.addColorStop(0.18, 'rgba(255,236,150,.95)'); r.addColorStop(0.45, 'rgba(255,150,40,.55)'); r.addColorStop(0.75, 'rgba(200,60,10,.18)'); r.addColorStop(1, 'rgba(120,20,0,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 256, 256)
  return c
}

/** Una nuvola di fumo: tante macchie morbide grigio bruno, più dense al centro. */
export function fumo(seme = 1) {
  const c = tela(128), g = c.getContext('2d')
  let a = seme * 7919
  const rnd = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
  for (let k = 0; k < 16; k++) {
    const t = rnd() * Math.PI * 2, d = rnd() * 30, x = 64 + Math.cos(t) * d, y = 64 + Math.sin(t) * d, rr = 18 + rnd() * 22
    const r = g.createRadialGradient(x, y, 0, x, y, rr)
    const v = 70 + Math.round(rnd() * 50)
    r.addColorStop(0, `rgba(${v + 8},${v},${v - 8},.34)`); r.addColorStop(1, `rgba(${v},${v},${v},0)`)
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  }
  return c
}
