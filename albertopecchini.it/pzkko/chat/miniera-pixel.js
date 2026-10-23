// La miniera di $pzk a pixel (23.10, Alberto: «fai tutte le immagini piatte e in pixel come tutto il resto… tutto deve
// essere adattabile e tutto deve incastrarsi perfettamente»). Tutta la grafica dell'app Miniera (telefono/app/miniera.js)
// è disegnata qui in codice, come la chiocciolina del tomodachi: niente immagini, niente Replicate. Pixel art PIATTA:
// colori pieni, contorni scuri di 1 pixel, niente sfumature né antialias, e niente animazioni (i disegni stanno fermi).
// Si disegna su una tela logica (ogni pixel è un numero 0xrrggbb, -1 = vuoto) e poi la si copia nel canvas ingrandita per
// la scala intera che sceglie l'app: ogni pixel della pixel art diventa un quadrato di scala × scala pixel veri.
// Le varianti vengono SOLO dalla `vista` dei pezzi (miniera-dati.mjs: i campi e i valori sono scritti in cima a quel file).
//
// LA SCENA (SCENA = 200 × 125): il muro, il pavimento e la postazione vista di fronte e un po' dall'alto (del piano del
// tavolo si vede la faccia di sopra, 9 righe di profondità). Gli ancoraggi sono righe fisse, mai a occhio:
//   il muro finisce alla riga 96 (battiscopa 94–96), sotto c'è il pavimento
//   il tavolo: il piano dalla riga 66 (il bordo contro il muro) alla 74, il bordo davanti 75–77, le gambe 78–105:
//     l'ultima riga delle gambe è la 105, appoggiata al pavimento (PAV = 106)
//   gli schermi stanno in fondo al piano: l'ultima riga del piede è la 68; tastiera e mouse davanti, righe 70–74
//   il case sul piano sta in fondo, accanto agli schermi: i piedini alla riga 69 (tastiera e mouse gli possono passare
//     davanti); per terra alla 105, come le gambe del tavolo
//   la sedia sta davanti a tutto, a sinistra, vista di fianco e girata verso il tavolo: le ruote (o i piedi) alla riga
//     112, il sedile alla 88; entra sotto il tavolo (sotto il bordo, riga 77) con tutto tranne lo schienale, che resta
//     fuori dal piano a 2 pixel dal tavolo
//   senza tavolo le cose stanno per terra: gli schermi coi piedi alla riga 99, tastiera e mouse davanti (101–105)
// In larghezza la postazione è una fila: [sedia][tavolo][case accanto], centrata nella scena. Sul piano gli schermi sono
// centrati (nello spazio libero, se c'è il case), la tastiera è centrata sotto gli schermi e il mouse alla sua destra.
//
// IL CASE: sul piano (a destra) o per terra accanto al tavolo (a destra). La regola, forma × larghezza del tavolo:
//              piccolo   medio     grande
//     mini     piano     piano     piano
//     medio    accanto   piano     piano
//     grande   accanto   accanto   piano
//     aperto   accanto   accanto   piano
//   e in più ci deve stare davvero: 3 pixel d'aria fra il bordo, gli schermi, il case e l'altro bordo; se no scende per
//   terra accanto al tavolo, a 3 pixel. Senza tavolo sta per terra a destra. (Così coi PRONTI: muletto, cameretta, bar,
//   vetro e rig sul piano; geometra, trono e centrale accanto, perché tre schermi e il case grande non ci stanno.)
// Dentro il case (visibile col vetro, o sempre nel telaio aperto): la scheda madre, il dissipatore della cpu (stock: la
// ventolina; torre: le alette; liquido: la pompa coi tubi e il radiatore), la ram (2 o 4 banchi, coi led in cima), la
// memoria (hdd e ssd sul copri-alimentatore, nvme sulla scheda madre), le schede video una sotto l'altra (nel telaio in
// piedi, in fila) e le ventole nei loro posti, sempre nello stesso ordine. Quante ne stanno a disegno: mini 1 gpu e 3
// ventole, medio 4 e 4, grande 6 e 9, aperto 6 e 8 (più dei posti del catalogo); una gpu troppo lunga si ferma al
// posto che c'è. I LED: una striscia sul bordo del tavolo (senza tavolo: sul battiscopa), una sul frontale del case e
// una dentro; le ventole e la ram coi led prendono il colore del kit led montato («arcobaleno»: colori fissi a strisce),
// senza kit fanno l'arcobaleno da sole. Lo schermo: la schermata da miner (righe di codice verdi e il grafico che sale)
// se la postazione è completa (o con { acceso: true }), nero se è spenta.
//
// I PEZZI DA SOLI (PEZZO = 38 × 38, tutti nella stessa cornice, centrati): per le schede del negozio. Gli schermi sono
// quelli della scena (accesi); gli altri sono disegnati più grandi (una gpu nella scena è alta 5 pixel) o più piccoli (un
// case grande nella scena è alto 59), con la stessa palette e gli stessi colori.
//
// API: SCENA, PEZZO, disegnaPostazione(canvas, montati, { scala, acceso }), disegnaPezzo(canvas, id, { scala }); e per le
// prove componi(montati, { acceso }) e componiPezzo(id) → { w, h, pixel, ingombri, fuori }, rgba(tela, scala).

import { PER_ID } from './miniera-dati.mjs'

export const SCENA = { w: 200, h: 125 }
export const PEZZO = { w: 38, h: 38 }

const OBBLIGATORIE = ['tavolo', 'sedia', 'case', 'cpu', 'ram', 'memoria', 'schermo', 'tastiera', 'mouse']

// ── le righe della scena ──
const MURO_FINE = 96 // l'ultima riga del muro (il battiscopa)
const PIANO = 66 // la prima riga del piano del tavolo
const PAV = 106 // la riga sotto i piedi del tavolo e del case per terra
const DAVANTI = 112 // l'ultima riga della sedia
const LARGH_TAVOLO = { piccolo: 76, medio: 104, grande: 128 }
const SUL_PIANO = { piccolo: ['mini'], medio: ['mini', 'medio'], grande: ['mini', 'medio', 'grande', 'aperto'] }

// ── i colori ──
const OUT = 0x16121c // il contorno di tutto
const MURO = 0x2c2a3b, MURO_L = 0x282637, BATTI = 0x3d3850, BATTI_C = 0x524b68
const PAVIM = 0x4a3a31, PAVIM_L = 0x3d2f28, OMBRA = 0x2c221d
const NERO = 0x26242e, GRIGIO = 0x3b3947
const METALLO = 0x8e949e, METALLO_S = 0x5f646e, METALLO_C = 0xc0c5cd
const PCB = 0x1e3d2c, PCB_C = 0x2d5a41, PCB_S = 0x122a1d
const ORO = 0xe2b33c, RAME = 0xd27a3c
const VETRO = 0x141820, RIFLESSO = 0x2a3442
const VELLUTO = 0x8e1b2b, VELLUTO_S = 0x5e1020
const SPENTO = 0x06060a, FONDO_SCH = 0x06140b, VERDE = 0x3be36b, VERDE_S = 0x1d7f3e, GIALLO = 0xd8f25a
const ARCO = [0xff3b3b, 0xff9f1c, 0xffe03b, 0x3bdc5a, 0x2ec5ff, 0x5b6cff, 0xc04bff] // l'arcobaleno, a strisce fisse

const num = (c, d) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? parseInt(c.slice(1), 16) : d)
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]
const mix = (a, b, k) => { const p = rgb(a), q = rgb(b); return p.reduce((s, v, i) => (s << 8) | Math.round(v + (q[i] - v) * k), 0) }
const scuro = (c, k = 0.35) => mix(c, 0x000000, k)
const chiaro = (c, k = 0.3) => mix(c, 0xffffff, k)
const luma = (c) => { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
/** Un colore troppo scuro si perde sul nero del fondo: lo schiarisce un po' (resta piatto, è solo un altro colore). */
const vivo = (c) => (luma(c) < 0.16 ? mix(c, 0xffffff, 0.16) : c)

// ── la tela logica ──
class Tela {
  constructor(w, h) { this.w = w; this.h = h; this.pixel = new Int32Array(w * h).fill(-1); this.fuori = 0; this.ingombri = [] }
  px(x, y, c) {
    if (c == null || c < 0) return
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) { this.fuori++; return } // contati: le prove vogliono zero
    this.pixel[y * this.w + x] = c
  }
  rett(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c) }
  riga(x, y, n, c) { this.rett(x, y, n, 1, c) }
  col(x, y, n, c) { this.rett(x, y, 1, n, c) }
  /** Un rettangolo pieno col contorno scuro di 1 pixel. */
  scatola(x, y, w, h, fondo, bordo = OUT) { this.rett(x, y, w, h, bordo); if (w > 2 && h > 2) this.rett(x + 1, y + 1, w - 2, h - 2, fondo) }
  /** Uno sprite come mappa di caratteri: '.' vuoto, ogni altro carattere un colore della tavolozza. */
  sprite(x, y, righe, tav) { righe.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && tav[ch] != null) this.px(x + i, y + j, tav[ch]) })) }
  /** Una linea a pixel interi (Bresenham). */
  linea(x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let e = dx + dy
    for (;;) { this.px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } }
  }
  /** Un disco: fn(x, y, d) per ogni pixel col centro a distanza d ≤ r da (cx, cy) (anche mezzi pixel). */
  disco(cx, cy, r, fn) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      if (d <= r) fn(x, y, d, Math.atan2(y + 0.5 - cy, x + 0.5 - cx))
    }
  }
  segna(cosa, x, y, w, h) { const r = { cosa, x, y, w, h }; this.ingombri.push(r); return r }
}

/** I pixel della tela, ingranditi per `scala`, in RGBA (per ImageData o per un png). */
export function rgba(tela, scala = 1) {
  const W = tela.w * scala, H = tela.h * scala, out = new Uint8ClampedArray(W * H * 4)
  for (let y = 0; y < tela.h; y++) for (let x = 0; x < tela.w; x++) {
    const c = tela.pixel[y * tela.w + x]
    if (c < 0) continue
    for (let j = 0; j < scala; j++) for (let i = 0; i < scala; i++) {
      const o = ((y * scala + j) * W + x * scala + i) * 4
      out[o] = (c >> 16) & 255; out[o + 1] = (c >> 8) & 255; out[o + 2] = c & 255; out[o + 3] = 255
    }
  }
  return out
}
function suCanvas(canvas, tela, scala) {
  const s = Math.max(1, Math.floor(scala) || 1)
  const g = canvas.getContext('2d')
  g.clearRect(0, 0, canvas.width, canvas.height)
  const W = tela.w * s, H = tela.h * s
  const img = g.createImageData(W, H)
  img.data.set(rgba(tela, s))
  // la tela la misura l'app (SCENA o PEZZO × scala): se fosse più grande, il disegno sta centrato a pixel interi
  g.putImageData(img, Math.max(0, Math.floor((canvas.width - W) / 2 / s) * s), Math.max(0, Math.floor((canvas.height - H) / 2 / s) * s))
}

// ── le luci: il kit led montato decide il colore di tutto quello che si accende ──
/** Il colore della luce numero i di una striscia: col kit, il suo colore (o l'arcobaleno a strisce di 2 pixel); senza,
 *  `pred` (un colore, o 'arco' per l'arcobaleno a strisce). */
function luci(led) {
  return (i, pred = 'arco') => {
    if (led) return led.colore === 'arcobaleno' ? ARCO[Math.floor(i / 2) % ARCO.length] : num(led.colore, ARCO[0])
    return pred === 'arco' ? ARCO[Math.floor(i / 2) % ARCO.length] : pred
  }
}

// ═════════════════════════════ i pezzi piccoli (quelli dentro il case) ═════════════════════════════

/** La ventola 5 × 5: l'anello (acceso col led), le pale in croce e il mozzo. */
function ventola5(t, x, y, v, luce, base = 0) {
  const pala = vivo(num(v?.colore, 0x2a2a30)), fessura = scuro(pala, 0.45), anello = v?.led ? null : 0x2b2933
  const giro = [[1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3], [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1]]
  giro.forEach(([i, j], k) => t.px(x + i, y + j, anello ?? luce(base + k)))
  t.sprite(x + 1, y + 1, ['pfp', 'fmf', 'pfp'], { p: pala, f: fessura, m: METALLO_C })
}

const LUNG_GPU = { corta: 10, media: 14, lunga: 18 }
/** Le ventoline 3 × 3 (a croce) di una gpu, distribuite lungo `L` pixel; fn(centro) per ognuna. */
function ventoleGpu(L, n, fn) {
  n = Math.max(1, Math.min(3, n | 0, Math.floor((L - 2) / 4)))
  for (let i = 0; i < n; i++) fn(1 + Math.round(((L - 2) * (2 * i + 1)) / (2 * n)))
}
/** La scheda video sdraiata, alta 5: la staffa a sinistra (contro il retro del case) e le ventole sul fianco. */
function gpuSdraiata(t, x, y, L, v) {
  const c = vivo(num(v?.colore, 0x2b2b2b)), f = luma(c) > 0.55 ? scuro(c, 0.55) : OUT
  t.scatola(x, y, L, 5, c)
  t.col(x, y, 5, METALLO_C) // la staffa
  t.riga(x + 1, y + 4, L - 2, PCB) // il circuito sotto
  ventoleGpu(L, v?.ventole ?? 1, (cx) => { t.sprite(x + cx - 1, y + 1, ['.f.', 'fmf', '.f.'], { f, m: METALLO_C }) })
}
/** La scheda video in piedi (nel telaio aperto), larga 5: la staffa in cima, le ventole una sopra l'altra. */
function gpuInPiedi(t, x, y, L, v) {
  const c = vivo(num(v?.colore, 0x2b2b2b)), f = luma(c) > 0.55 ? scuro(c, 0.55) : OUT
  t.scatola(x, y, 5, L, c)
  t.riga(x, y, 5, METALLO_C)
  t.col(x + 4, y + 1, L - 2, PCB)
  ventoleGpu(L, v?.ventole ?? 1, (cy) => { t.sprite(x + 1, y + cy - 1, ['.f.', 'fmf', '.f.'], { f, m: METALLO_C }) })
}

/** Il dissipatore della cpu in un riquadro 8 × 11 (x, y in alto a sinistra). Per il liquido solo la pompa (6 × 6 a
 *  x + 1, y + 4): i tubi e il radiatore li disegna il case, che sa dove stanno. */
function dissipatore(t, x, y, v, luce) {
  const tipo = v?.dissipatore
  if (tipo === 'torre') {
    t.scatola(x, y, 6, 9, METALLO_C)
    for (let j = 2; j < 8; j += 2) t.riga(x + 1, y + j, 4, METALLO_S) // le alette
    t.scatola(x + 5, y, 3, 9, NERO) // la ventola vista di taglio
    t.px(x + 6, y + 4, METALLO_C)
    t.sprite(x, y + 9, ['.r.r..', 'oSSSSo'], { r: RAME, S: METALLO_S, o: OUT }) // i tubi di rame e la base
  } else if (tipo === 'liquido') {
    t.scatola(x + 1, y + 4, 6, 6, NERO)
    t.rett(x + 3, y + 6, 2, 2, luce(0, VERDE))
  } else { // stock: il quadrato d'alluminio con la ventolina
    t.scatola(x, y + 2, 7, 7, METALLO)
    t.sprite(x + 1, y + 3, ['.sss.', 'sbgbs', 'sgmgs', 'sbgbs', '.sss.'], { s: METALLO_S, b: NERO, g: 0x141218, m: METALLO_C })
  }
}
/** La ram: `banchi` stecche da 1 pixel con la fessura scura, alte 11; coi led la cima di ogni stecca si accende. */
function ram(t, x, y, v, luce) {
  const b = v?.banchi === 4 ? 4 : 2, c = vivo(num(v?.colore, 0x2c6b35))
  t.scatola(x, y, 2 * b + 1, 11, c)
  for (let k = 0; k < b; k++) {
    if (k) t.col(x + 2 * k, y + 1, 9, OUT)
    if (v?.led) t.rett(x + 1 + 2 * k, y + 1, 1, 2, luce(2 * k))
  }
  return 2 * b + 1
}
/** La memoria nel case: hdd 8 × 5, ssd 7 × 3 (in basso nello stesso posto), nvme 9 × 3 sulla scheda madre. */
function memoriaPiccola(t, x, y, v) {
  const tipo = v?.tipo
  if (tipo === 'ssd') { t.scatola(x, y + 2, 7, 3, NERO); t.riga(x + 2, y + 3, 3, 0x3a6bd8); return { x, y: y + 2, w: 7, h: 3 } }
  if (tipo === 'nvme') return null
  t.scatola(x, y, 8, 5, METALLO); t.rett(x + 2, y + 1, 2, 2, METALLO_S); t.px(x + 2, y + 1, OUT); t.riga(x + 5, y + 2, 2, 0xf2efe6)
  return { x, y, w: 8, h: 5 }
}
function nvme(t, x, y) { t.scatola(x, y, 9, 3, PCB_C); t.px(x + 1, y + 1, ORO); t.px(x + 3, y + 1, NERO); t.px(x + 4, y + 1, NERO); t.px(x + 6, y + 1, NERO) }

// ═════════════════════════════ il case ═════════════════════════════

// le forme nella scena: W × H col contorno e i piedini; dentro (iw × ih) a 2 pixel dal bordo, il frontale a destra è di
// 2 pixel. Le posizioni sono dentro: ventole (in ordine), il riquadro del dissipatore, la ram, l'nvme, la prima gpu e quante
// ne stanno, il copri-alimentatore (riga), il disco; per il telaio aperto tutto a parte.
const FORME = {
  mini: { W: 29, H: 33, ventole: [[0, 4], [19, 17], [19, 23]], gpu: 1, gpuMaxL: 18, alim: [0, 23, 9, 5], disco: [10, 23] },
  medio: { W: 32, H: 51, ventole: [[0, 4], [22, 17], [22, 23], [22, 29]], gpu: 4, gpuMaxL: 18, copri: 40, disco: [19, 35] },
  grande: { W: 38, H: 59, ventole: [[0, 4], [28, 17], [28, 23], [28, 29], [28, 35], [22, 17], [22, 23], [22, 29], [22, 35]], gpu: 6, gpuMaxL: 18, copri: 48, disco: [24, 42] },
  aperto: { W: 46, H: 49, gpu: 6, ventole: 8 },
}
const formaDi = (v) => (FORME[v?.forma] ? v.forma : 'medio')

/** Il guscio chiuso: contorno, cornice del colore del case, il frontale a destra (col tasto e la striscia led), i
 *  piedini; dentro il vetro (col riflesso) o il pannello pieno con le fessure. Restituisce il dentro. */
function guscio(t, x, y, W, H, v, { acceso, luce, led }) {
  const c = vivo(num(v?.colore, 0x2b2b31)), s = scuro(c, 0.3)
  t.scatola(x, y, W, H - 1, c)
  t.rett(x + W - 3, y + 1, 2, H - 3, s) // il frontale
  t.px(x + W - 2, y + 2, acceso ? VERDE : scuro(VERDE, 0.6)) // la lucina dell'accensione
  if (led) for (let j = 4; j < H - 5; j++) t.px(x + W - 3, y + j, luce(j)) // la striscia led sul frontale
  t.riga(x + 1, y + H - 1, 3, OUT); t.riga(x + W - 4, y + H - 1, 3, OUT) // i piedini
  const d = { x: x + 2, y: y + 2, w: W - 5, h: H - 5 }
  if (v?.vetro) {
    t.rett(d.x, d.y, d.w, d.h, VETRO)
    for (let k = 0; k < 4; k++) { t.px(d.x + d.w - 2 - k, d.y + k, RIFLESSO); t.px(d.x + d.w - 5 - k, d.y + k, RIFLESSO) }
  } else {
    t.rett(d.x, d.y, d.w, d.h, c)
    t.scatola(d.x + 1, d.y + 1, d.w - 2, d.h - 2, c, s) // la linea del pannello
    for (let j = 3; j < Math.min(d.h - 3, 12); j += 2) for (let i = 3; i < d.w - 3; i += 2) t.px(d.x + i, d.y + j, s) // le fessure
  }
  return d
}

/** Il case della scena coi pezzi dentro. (x, yb): a sinistra e l'ultima riga (i piedini). */
function caseScena(t, x, yb, m, opz) {
  const v = m.case.v, forma = formaDi(v), F = FORME[forma]
  if (forma === 'aperto') return telaioScena(t, x, yb - F.H + 1, m, opz)
  const y = yb - F.H + 1, { luce } = opz
  const box = t.segna('case', x, y, F.W, F.H)
  const d = guscio(t, x, y, F.W, F.H, v, opz)
  if (!v?.vetro) return box // senza vetro dentro non si vede niente
  const P = (i, j) => [d.x + i, d.y + j]
  // la scheda madre, dietro a tutto
  const mbH = forma === 'mini' ? 22 : F.copri - 2
  t.scatola(d.x, d.y + 1, 24, mbH, PCB)
  for (let j = 3; j < mbH - 1; j += 4) for (let i = 2; i < 23; i += 5) t.px(d.x + i, d.y + 1 + j, PCB_C) // le piste
  // il dissipatore (o lo zoccolo vuoto) e la ram (o i banchi vuoti)
  const [cx, cy] = P(6, 3)
  if (m.cpu) {
    dissipatore(t, cx, cy, m.cpu.v, luce)
    t.segna('cpu', cx, cy, 8, 11)
    if (m.cpu.v?.dissipatore === 'liquido') { // i tubi su fino al radiatore in cima
      t.col(cx + 2, d.y + 3, cy + 4 - d.y - 3, OUT); t.col(cx + 5, d.y + 3, cy + 4 - d.y - 3, OUT)
      t.scatola(d.x, d.y, 24, 3, METALLO_S)
      for (let i = 2; i < 23; i += 2) t.px(d.x + i, d.y + 1, OUT)
    }
  } else { t.scatola(cx + 1, cy + 3, 6, 6, METALLO_C); t.rett(cx + 3, cy + 5, 2, 2, METALLO_S) }
  const [rx, ry] = P(15, 3)
  if (m.ram) t.segna('ram', rx, ry, ram(t, rx, ry, m.ram.v, luce), 11)
  else for (let k = 0; k < 4; k++) t.col(rx + 1 + 2 * k, ry + 1, 9, PCB_S)
  if (m.memoria?.v?.tipo === 'nvme') { const [nx, ny] = P(3, 14); nvme(t, nx, ny); t.segna('memoria', nx, ny, 9, 3) }
  // le schede video, dalla staffa sul retro verso il frontale, una sotto l'altra
  if (m.gpu) {
    const L = Math.min(LUNG_GPU[m.gpu.v?.lunghezza] ?? 14, F.gpuMaxL)
    for (let k = 0; k < Math.min(m.gpu.n, F.gpu); k++) { const [gx, gy] = P(0, 17 + 5 * k); gpuSdraiata(t, gx, gy, L, m.gpu.v); t.segna('gpu', gx, gy, L, 5) }
  }
  // l'alimentatore: il copri (medio, grande) o il blocchetto sfx (mini); coi led la striscia sul bordo del copri
  if (F.copri) {
    const [ax, ay] = P(0, F.copri), c = vivo(num(v?.colore, 0x2b2b31))
    t.scatola(ax, ay, d.w, d.h - F.copri, scuro(c, 0.15))
    for (let i = 3; i < d.w - 3; i += 2) t.px(ax + i, ay + 3, OUT)
    if (opz.led) for (let i = 1; i < d.w - 1; i++) t.px(ax + i, ay + 1, luce(i))
  } else {
    const [ax, ay, aw, ah] = [...P(F.alim[0], F.alim[1]), F.alim[2], F.alim[3]]
    t.scatola(ax, ay, aw, ah, GRIGIO); t.sprite(ax + 2, ay + 1, ['o.o.o', '.o.o.', 'o.o.o'], { o: OUT })
    if (opz.led) for (let i = 0; i < d.w; i++) t.px(d.x + i, d.y + d.h - 1, luce(i))
  }
  // il disco (hdd o ssd) e le ventole
  if (m.memoria && m.memoria.v?.tipo !== 'nvme') { const [mx, my] = P(...F.disco), r = memoriaPiccola(t, mx, my, m.memoria.v); if (r) t.segna('memoria', r.x, r.y, r.w, r.h) }
  if (m.ventole) for (let k = 0; k < Math.min(m.ventole.n, F.ventole.length); k++) {
    const [fx, fy] = P(...F.ventole[k]); ventola5(t, fx, fy, m.ventole.v, luce, 3 * k); t.segna('ventola', fx, fy, 5, 5)
  }
  return box
}

/** Il telaio aperto da mining, 46 × 49: montanti e traversi da 3 pixel; in alto la fila di ventole, sotto le schede in
 *  piedi sul binario, in basso la scheda madre sul ripiano con l'alimentatore e il disco. Dentro si vede il muro. */
function telaioScena(t, x, y, m, opz) {
  const v = m.case.v, F = FORME.aperto, c = vivo(num(v?.colore, 0x7a7f88)), { luce } = opz
  const box = t.segna('case', x, y, F.W, F.H)
  const sbarra = (bx, by, w, h) => { t.scatola(bx, by, w, h, c) }
  // dietro: la scheda madre e il resto del ripiano
  t.scatola(x + 3, y + 31, 24, 14, PCB)
  for (let j = 2; j < 13; j += 4) for (let i = 2; i < 23; i += 5) t.px(x + 3 + i, y + 31 + j, PCB_C)
  if (m.ram) t.segna('ram', x + 4, y + 32, ram(t, x + 4, y + 32, m.ram.v, luce), 11)
  else for (let k = 0; k < 4; k++) t.col(x + 5 + 2 * k, y + 33, 9, PCB_S)
  if (m.cpu) {
    dissipatore(t, x + 15, y + 31, m.cpu.v, luce); t.segna('cpu', x + 15, y + 31, 8, 11)
    if (m.cpu.v?.dissipatore === 'liquido') { // i tubi a destra fino al radiatore in piedi
      t.riga(x + 22, y + 36, 6, OUT); t.riga(x + 22, y + 39, 6, OUT)
      t.scatola(x + 28, y + 31, 3, 14, METALLO_S); for (let j = 2; j < 13; j += 2) t.px(x + 29, y + 31 + j, OUT)
    }
  } else { t.scatola(x + 16, y + 34, 6, 6, METALLO_C); t.rett(x + 18, y + 36, 2, 2, METALLO_S) }
  if (m.memoria?.v?.tipo === 'nvme') { nvme(t, x + 14, y + 42); t.segna('memoria', x + 14, y + 42, 9, 3) }
  t.scatola(x + 32, y + 38, 11, 7, GRIGIO); t.sprite(x + 34, y + 39, ['o.o.o.o', '.o.o.o.', 'o.o.o.o'], { o: OUT }) // l'alimentatore
  if (m.memoria && m.memoria.v?.tipo !== 'nvme') { const r = memoriaPiccola(t, x + 33, y + 32, m.memoria.v); if (r) t.segna('memoria', r.x, r.y, r.w, r.h) }
  // il telaio
  sbarra(x, y, F.W, 3); sbarra(x, y + 45, F.W, 3); sbarra(x, y, 3, 48); sbarra(x + F.W - 3, y, 3, 48)
  sbarra(x, y + 27, F.W, 3) // il binario delle schede
  if (opz.led) for (let i = 3; i < F.W - 3; i++) t.px(x + i, y + 28, luce(i))
  t.riga(x, y + 48, 4, OUT); t.riga(x + F.W - 4, y + 48, 4, OUT) // i piedini
  // le schede in piedi sul binario e le ventole appese sotto il traverso
  if (m.gpu) {
    const L = LUNG_GPU[m.gpu.v?.lunghezza] ?? 14
    for (let k = 0; k < Math.min(m.gpu.n, F.gpu); k++) { const gx = x + 3 + 7 * k, gy = y + 27 - L; gpuInPiedi(t, gx, gy, L, m.gpu.v); t.segna('gpu', gx, gy, 5, L) }
  }
  if (m.ventole) for (let k = 0; k < Math.min(m.ventole.n, F.ventole); k++) { const fx = x + 3 + 5 * k; ventola5(t, fx, y + 3, m.ventole.v, luce, 3 * k); t.segna('ventola', fx, y + 3, 5, 5) }
  return box
}

// ═════════════════════════════ gli schermi, la tastiera, il mouse ═════════════════════════════

const MON = { piccolo: [24, 17], medio: [30, 20], grande: [36, 23] } // larghezza e altezza del pannello; + 5 il piede
const monMisure = (v) => MON[v?.pollici] ?? MON.medio

/** Un generatore di numeri sempre uguale (la schermata è ferma e non cambia da un disegno all'altro). */
function semi(s) { return () => { s = (s + 0x6d2b79f5) | 0; let x = Math.imul(s ^ (s >>> 15), 1 | s); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296 } }

/** La schermata da miner in un rettangolo w × h: righe di codice verdi, il grafico che sale (o tutte e due). */
function schermata(put, w, h, tipo, seme) {
  const r = semi(seme)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(i, j, FONDO_SCH)
  const codice = (y0, y1) => {
    for (let j = y0 + 1; j < y1 - 1; j += 2) {
      const rientro = Math.floor(r() * 3) * 2, lung = 3 + Math.floor(r() * Math.max(1, w - 5 - rientro))
      for (let i = 0; i < lung; i++) put(1 + rientro + i, j, i < 2 ? VERDE : VERDE_S)
    }
  }
  const grafico = (y0, y1) => {
    const alto = y1 - y0
    for (let j = y0 + 1; j < y1 - 1; j++) put(1, j, VERDE_S)
    for (let i = 1; i < w - 1; i++) put(i, y1 - 2, VERDE_S)
    let prima = null
    for (let i = 2; i < w - 1; i++) {
      const k = (i - 2) / Math.max(1, w - 4)
      const yy = Math.max(y0 + 1, Math.min(y1 - 3, Math.round(y1 - 3 - (alto - 5) * k * k * 0.9 - (alto - 5) * 0.1 * k + (r() < 0.35 ? 1 : 0))))
      if (prima != null) for (let j = Math.min(prima, yy); j <= Math.max(prima, yy); j++) put(i, j, GIALLO)
      put(i, yy, GIALLO); prima = yy
    }
    put(w - 2, y0 + 1, VERDE)
  }
  if (tipo === 'grafico') grafico(0, h)
  else if (tipo === 'misto') { codice(0, Math.floor(h / 2)); grafico(Math.floor(h / 2) - 1, h) }
  else codice(0, h)
}

/** Lo schermo: il pannello (curvo: il centro più basso di 1 pixel sopra e sotto, come quelli veri visti di fronte), la
 *  cornice, il collo e il piede. (x, yb): a sinistra e l'ultima riga del piede. */
function schermo(t, x, yb, v, { k = 0, n = 1, acceso = false } = {}) {
  const [w, H] = monMisure(v), cor = num(v?.cornice, 0x1b1b1b), cv = vivo(cor)
  const top = yb - 4 - H, q = Math.floor(w / 4)
  const su = (c) => (v?.curvo && c >= q && c < w - q ? 1 : 0)
  const dentro = (c, r) => c > 0 && c < w - 1 && r > su(c) && r < H - 1 - su(c)
  const cornice = (c, r) => c === 1 || c === w - 2 || r === su(c) + 1 || r >= H - 1 - su(c) - 2
  for (let c = 0; c < w; c++) for (let r = su(c); r <= H - 1 - su(c); r++) t.px(x + c, top + r, dentro(c, r) ? (cornice(c, r) ? cor : SPENTO) : OUT)
  // la schermata: lo schermo è (w - 4) × (H - 5) da (2, 2), tagliato dalla curva
  const put = (i, j, col) => { const c = i + 2, r = j + 2; if (dentro(c, r) && !cornice(c, r)) t.px(x + c, top + r, col) }
  if (acceso) schermata(put, w - 4, H - 5, n === 1 ? 'misto' : k === Math.floor(n / 2) ? 'grafico' : 'codice', 7 + 31 * k + w)
  else { put(w - 7, 1, 0x1b1b24); put(w - 8, 2, 0x1b1b24); put(w - 6, 1, 0x1b1b24) } // spento: nero, con un riflesso
  // il collo e il piede
  const cx = x + Math.floor(w / 2), pw = w < 28 ? 10 : 12
  for (let j = yb - 4; j <= yb - 2; j++) { t.px(cx - 2, j, OUT); t.px(cx - 1, j, cv); t.px(cx, j, cv); t.px(cx + 1, j, OUT) }
  t.px(cx - pw / 2, yb - 1, OUT); t.riga(cx - pw / 2 + 1, yb - 1, pw - 2, cv); t.px(cx + pw / 2 - 1, yb - 1, OUT)
  t.riga(cx - pw / 2, yb, pw, OUT)
  return { x, y: top, w, h: H + 5 }
}

/** Il colore dei tasti: chiaro su una tastiera scura, un po' più scuro su una chiara. */
const tastoDi = (corpo) => (luma(corpo) > 0.5 ? scuro(corpo, 0.22) : chiaro(corpo, 0.28))

/** La tastiera della scena, 26 × 5 vista dall'alto e un po' di fronte: due file di tasti e il fianco. */
function tastiera(t, x, y, v, luce) {
  const corpo = vivo(num(v?.colore, 0x2a2a2a)), tasto = tastoDi(corpo), tipo = v?.tipo
  t.riga(x + 1, y, 24, OUT); t.riga(x + 1, y + 4, 24, OUT); t.col(x, y + 1, 3, OUT); t.col(x + 25, y + 1, 3, OUT)
  t.rett(x + 1, y + 1, 24, 2, corpo); t.riga(x + 1, y + 3, 24, scuro(corpo, 0.3))
  for (let r = 0; r < 2; r++) for (let c = 0; c < 24; c++) {
    const spazio = r === 1 && c >= 8 && c <= 15
    const col = tipo === 'rgb' ? luce(Math.floor(c / 3) * 2) : tasto
    if (tipo === 'membrana') { if (spazio || (c + r) % 2 === 0) t.px(x + 1 + c, y + 1 + r, tasto) }
    else t.px(x + 1 + c, y + 1 + r, spazio || c % 3 !== 2 ? col : OUT)
  }
  return { x, y, w: 26, h: 5 }
}
/** Il mouse della scena: 5 × 4; il gaming ha la lucina sul fianco e sta sul tappetino 11 × 5. */
function mouse(t, x, y, v, luce) {
  const c = vivo(num(v?.colore, 0x303030)), gaming = v?.tipo === 'gaming'
  if (gaming) { t.scatola(x, y, 11, 5, NERO); t.riga(x + 1, y + 3, 9, GRIGIO) }
  const mx = gaming ? x + 3 : x
  t.sprite(mx, y, ['.ooo.', 'obobo', gaming ? 'oLbbo' : 'obbbo', '.ooo.'], { o: OUT, b: c, L: luce(0, ARCO[0]) })
  return gaming ? { x, y, w: 11, h: 5 } : { x, y, w: 5, h: 4 }
}

// ═════════════════════════════ il tavolo e la sedia ═════════════════════════════

/** Il tavolo: il piano visto un po' dall'alto (prof righe), il bordo davanti (bordo righe) e le gambe (gambe righe).
 *  `striscia`: la luce del led sul bordo (null se non c'è). */
function tavolo(t, x, y, w, v, { prof, bordo, gambe }, striscia) {
  const stile = v?.stile, c = num(v?.colore, 0xb98a55)
  let piano = vivo(c), accento = null
  if (stile === 'gaming') { const scuroC = luma(c) < 0.3; piano = scuroC ? vivo(c) : 0x1d1c24; accento = scuroC ? 0xd12b2b : c }
  const fianco = scuro(piano, 0.3), yb = y + prof, yg = yb + bordo
  // le gambe (prima: il piano ci passa davanti)
  const gamba = (gx) => {
    if (stile === 'metallo') { t.scatola(gx, yg - 1, 3, gambe + 1, METALLO); t.riga(gx - 1, yg + gambe - 1, 5, OUT) }
    else if (stile === 'gaming') {
      t.scatola(gx, yg - 1, 4, gambe + 1, NERO); t.col(gx + 2, yg, gambe - 3, accento)
      const pw = Math.min(12, Math.floor(w / 3)), px0 = gx + 2 - Math.floor(pw / 2)
      t.scatola(px0, yg + gambe - 3, pw, 3, NERO); t.px(px0 + 1, yg + gambe - 2, accento); t.px(px0 + pw - 2, yg + gambe - 2, accento)
    } else { t.scatola(gx, yg - 1, 4, gambe + 1, scuro(piano, 0.22)); t.col(gx + 1, yg, gambe - 1, scuro(piano, 0.4)) }
  }
  if (stile === 'metallo') t.scatola(x + 3, yg + Math.floor(gambe * 0.55), w - 6, 3, METALLO_S) // il traverso dietro
  if (stile === 'gaming') { const pw = Math.min(12, Math.floor(w / 3)); gamba(x + Math.floor(pw / 2) - 1); gamba(x + w - Math.floor(pw / 2) - 3) }
  else if (stile === 'metallo') { gamba(x + 2); gamba(x + w - 5) } else { gamba(x + 2); gamba(x + w - 6) }
  // il piano
  t.scatola(x, y, w, prof + 1, piano)
  t.riga(x + 1, y + prof - 1, w - 2, chiaro(piano, 0.15)) // lo spigolo davanti, in luce
  if (stile === 'legno') for (let j = 2; j < prof - 2; j += 3) for (let i = 3 + ((j * 7) % 11); i < w - 8; i += 17) t.riga(x + i, y + j, 6, scuro(piano, 0.14))
  if (stile === 'gaming') for (let j = 1; j < prof - 1; j++) for (let i = 1 + (j % 2); i < w - 1; i += 4) t.px(x + i, y + j, chiaro(piano, 0.07))
  if (stile === 'metallo') { t.px(x + 2, y + 1, scuro(piano, 0.3)); t.px(x + w - 3, y + 1, scuro(piano, 0.3)) }
  // il bordo davanti, con la striscia (il led, o l'accento del gaming)
  t.scatola(x, yb - 1, w, bordo + 1, fianco)
  t.riga(x + 1, yb - 1, w - 2, chiaro(piano, 0.15))
  if (striscia) for (let i = 2; i < w - 2; i++) t.px(x + i, yb + bordo - 2, striscia(i))
  else if (accento) t.riga(x + 2, yb + bordo - 2, w - 4, accento)
  else if (stile === 'metallo') for (let i = 3; i < w - 3; i += 8) t.px(x + i, yb + bordo - 2, chiaro(fianco, 0.3))
  return { x, y, w, h: prof + bordo + gambe }
}

// le sedie: s = altezza del sedile dal pavimento, b = schienale sopra il sedile, w = sedile. Nella scena il sedile è a 24
// pixel dal pavimento (riga 88: 11 righe sotto il bordo del tavolo, come una sedia vera sotto una scrivania)
const SEDIE_SCENA = { sgabello: { s: 24, w: 16 }, ufficio: { s: 24, b: 23, w: 18 }, gaming: { s: 24, b: 31, w: 18 }, trono: { s: 24, b: 33, w: 22 } }
const SEDIE_PEZZO = { sgabello: { s: 22, w: 16 }, ufficio: { s: 15, b: 16, w: 15 }, gaming: { s: 14, b: 20, w: 15 }, trono: { s: 14, b: 17, w: 18 } }
const SCHIENALE = { sgabello: 0, ufficio: 6, gaming: 7, trono: 8 } // quanto è largo lo schienale (a sinistra)
const tipoSedia = (v) => (SEDIE_SCENA[v?.tipo] ? v.tipo : 'ufficio')
/** Larghezza, altezza, schienale e quanto entra sotto il tavolo (tutto tranne lo schienale, meno 2 pixel d'aria). */
function misuraSedia(tipo, D) {
  const sb = SCHIENALE[tipo]
  const w = tipo === 'sgabello' ? D.w : tipo === 'trono' ? D.w + 6 : D.w + 2
  const h = tipo === 'sgabello' ? D.s + 1 : tipo === 'trono' ? D.s + D.b + 5 : D.s + D.b + 1
  return { w, h, schienale: sb, sotto: tipo === 'sgabello' ? 6 : w - sb - 2 }
}

/** La base con le ruote (ufficio e gaming): il meccanismo, il pistone, la stella vista di fianco e tre ruote. */
function baseRuote(t, x, yb, W, ys, pistone, ruota) {
  const cx = x + 2 + Math.floor((W - 2) / 2) - 1
  t.scatola(cx - 2, ys + 4, 6, 2, NERO)
  for (let j = ys + 6; j <= yb - 4; j++) { const sotto = j > (ys + 6 + yb - 4) / 2; t.px(cx, j, sotto ? METALLO_C : pistone); t.px(cx + 1, j, sotto ? METALLO_S : scuro(pistone, 0.3)) }
  t.riga(cx - 1, yb - 3, 4, OUT); t.riga(x + 1, yb - 2, W - 2, GRIGIO); t.px(x, yb - 2, OUT); t.px(x + W - 1, yb - 2, OUT)
  for (const rx of [x + 1, cx, x + W - 3]) { t.rett(rx, yb - 1, 2, 2, OUT); t.px(rx, yb - 1, ruota) }
}

/** La sedia vista di fianco, girata verso il tavolo (a destra): (x, yb) a sinistra e l'ultima riga. Restituisce
 *  l'ingombro e le parti (lo schienale e il resto) per i controlli. */
function sedia(t, x, yb, v, D) {
  const tipo = tipoSedia(v), c = vivo(num(v?.colore, 0x3a3d48)), M = misuraSedia(tipo, D), ys = yb - D.s
  const fine = (y, parti) => ({ x, y, w: M.w, h: yb - y + 1, parti })
  if (tipo === 'sgabello') {
    const w = D.w, cx = x + Math.floor(w / 2) - 1
    t.linea(cx, yb - 6, x + 1, yb - 1, METALLO_S); t.linea(cx + 1, yb - 6, x + w - 2, yb - 1, METALLO_S) // le gambe
    t.rett(x, yb, 3, 1, OUT); t.rett(x + w - 3, yb, 3, 1, OUT) // i piedini
    t.scatola(x + 2, yb - 11, w - 4, 3, METALLO) // il poggiapiedi
    for (let j = ys + 4; j <= yb - 6; j++) { if (j < yb - 11 || j > yb - 9) { t.px(cx, j, METALLO_C); t.px(cx + 1, j, METALLO_S) } }
    t.sprite(x, ys, ['..' + 'o'.repeat(w - 4) + '..', '.o' + 'c'.repeat(w - 4) + 'o.', 'o' + 's'.repeat(w - 2) + 'o', 'o' + 'S'.repeat(w - 2) + 'o', '.' + 'o'.repeat(w - 2) + '.'],
      { o: OUT, c: chiaro(c, 0.18), s: c, S: scuro(c, 0.25) })
    return fine(ys, [{ cosa: 'sedia', x, y: ys, w, h: yb - ys + 1 }])
  }
  const yt = ys - D.b, W = M.w, sb = M.schienale
  if (tipo === 'trono') {
    // il trono d'oro (il colore è l'oro), col velluto rosso: lo schienale alto con la corona, i braccioli col pomolo,
    // la cassa del sedile, le gambe con le zampe e il traverso
    const oro = vivo(num(v?.colore, 0xd4a017)), oroS = scuro(oro, 0.3), oroC = chiaro(oro, 0.35), ya = ys - 7, gy = ys + 8
    t.scatola(x + 4, gy + Math.floor((yb - gy) / 2) - 1, W - 8, 3, oroS) // il traverso, dietro le gambe
    for (const gx of [x + 3, x + W - 5]) { t.scatola(gx, gy - 1, 3, yb - gy, oro); t.sprite(gx - 1, yb - 1, ['oGGGo', 'ooooo'], { o: OUT, G: oro }) }
    t.scatola(x, yt, sb, ys + 8 - yt, oro) // lo schienale
    t.scatola(x + 2, yt + 2, sb - 4, ys - yt - 2, VELLUTO, oroS)
    for (let j = yt + 5, k = 0; j < ys - 2; j += 4, k++) t.px(x + 3 + (k % 2), j, oroC) // i bottoni del velluto
    t.sprite(x, yt - 4, ['.o.oo.o.', 'oGoGGoGo', 'oGGRRGGo', 'oGGGGGGo'], { o: OUT, G: oro, R: 0xd83a3a }) // la corona
    t.scatola(x + 6, ys + 3, W - 6, 5, oro); t.riga(x + 7, ys + 5, W - 8, oroS) // la cassa del sedile
    for (let i = x + 9; i < x + W - 2; i += 4) t.px(i, ys + 6, oroC)
    t.scatola(x + W - 5, ya + 2, 3, ys - ya - 1, oro) // il montante del bracciolo
    t.sprite(x + 7, ys, ['.' + 'o'.repeat(W - 10) + '.', 'o' + 'v'.repeat(W - 10) + 'o', 'o' + 'V'.repeat(W - 10) + 'o'], { o: OUT, v: VELLUTO, V: VELLUTO_S }) // il cuscino
    t.scatola(x + 7, ya, W - 9, 3, oro) // il bracciolo
    t.sprite(x + W - 4, ya - 1, ['.oo.', 'oGGo', 'oGGo', '.oo.'], { o: OUT, G: oroC }) // il pomolo
    return fine(yt - 4, [{ cosa: 'schienale', x, y: yt - 4, w: sb, h: ya - 1 - (yt - 4) }, { cosa: 'sedia', x, y: ya - 1, w: W, h: yb - ya + 2 }])
  }
  // ufficio e gaming: lo schienale imbottito, il bracciolo, il sedile e la base con le ruote
  const gaming = tipo === 'gaming', fodera = gaming ? NERO : c, ya = ys - 5
  tondo(t, x, yt, sb, ys - yt + 2, fodera)
  t.col(x + 1, yt + 1, ys - yt, scuro(fodera, 0.25))
  if (gaming) { // le strisce del colore, il buco della cintura e il cuscinetto per la testa
    t.col(x + 3, yt + 1, ys - yt, c); t.col(x + 4, yt + 1, ys - yt, c); t.px(x + 3, yt + 4, OUT); t.px(x + 4, yt + 4, OUT)
    t.scatola(x + sb - 2, yt + 2, 3, 4, NERO); t.px(x + sb - 1, yt + 3, c)
  } else t.riga(x + 2, yt + Math.floor((ys - yt) * 0.6), sb - 3, scuro(fodera, 0.2)) // la cucitura lombare
  t.scatola(x + sb - 1, ya, 8, 3, NERO); if (gaming) t.px(x + sb, ya + 1, c) // il bracciolo
  t.col(x + sb + 2, ya + 3, ys - ya - 3, OUT)
  t.scatola(x + 2, ys, W - 2, gaming ? 5 : 4, fodera) // il sedile
  t.riga(x + 3, ys + 1, W - 4, gaming ? c : chiaro(fodera, 0.12))
  if (!gaming) t.riga(x + 3, ys + 2, W - 4, scuro(fodera, 0.2))
  t.px(x + 2, ys, OUT); t.px(x + W - 1, ys, OUT)
  baseRuote(t, x, yb, W, ys + (gaming ? 1 : 0), gaming ? NERO : GRIGIO, gaming ? c : METALLO_S)
  return fine(yt, [{ cosa: 'schienale', x, y: yt, w: sb + (gaming ? 1 : 0), h: ya - yt }, { cosa: 'sedia', x, y: ya, w: W, h: yb - ya + 1 }])
}
/** Una scatola con gli angoli tondi: i quattro pixel d'angolo non si disegnano (si vede quello che c'è dietro). */
function tondo(t, x, y, w, h, fondo) {
  t.riga(x + 1, y, w - 2, OUT); t.riga(x + 1, y + h - 1, w - 2, OUT)
  t.col(x, y + 1, h - 2, OUT); t.col(x + w - 1, y + 1, h - 2, OUT)
  t.rett(x + 1, y + 1, w - 2, h - 2, fondo)
}

// ═════════════════════════════ la postazione ═════════════════════════════

/** I pezzi montati: { cat: id } o { cat: { id, n } } (anche un pezzo intero con la sua vista, per le prove). */
function leggi(montati = {}) {
  const m = {}
  for (const [cat, val] of Object.entries(montati ?? {})) {
    if (!val) continue
    const id = typeof val === 'string' ? val : val.id
    const p = val?.vista ? val : PER_ID[id]
    if (!p?.vista) continue
    m[cat] = { p, v: p.vista, n: Math.max(1, Math.floor(val?.n ?? 1)) }
  }
  return m
}

/** La scena della postazione sulla tela logica (SCENA): { w, h, pixel, ingombri, fuori, acceso, completa, caseDove }. */
export function componi(montati = {}, { acceso } = {}) {
  const m = leggi(montati), t = new Tela(SCENA.w, SCENA.h)
  const completa = OBBLIGATORIE.every((c) => m[c]), on = acceso ?? completa
  const led = m.led?.v ?? null, luce = luci(led)
  // ── le misure ──
  const tv = m.tavolo?.v, tw = tv ? LARGH_TAVOLO[tv.larghezza] ?? LARGH_TAVOLO.medio : 0
  const sv = m.schermo?.v, ns = sv ? Math.min(3, m.schermo.n) : 0, [mw] = sv ? monMisure(sv) : [0]
  const monW = ns ? ns * mw + (ns - 1) * 2 : 0
  const kbW = m.tastiera ? 26 : 0, msW = m.mouse ? (m.mouse.v?.tipo === 'gaming' ? 11 : 5) : 0
  const kmW = kbW + msW + (kbW && msW ? 3 : 0)
  const roba = Math.max(monW, kmW)
  const cv = m.case?.v, forma = formaDi(cv), cW = cv ? FORME[forma].W : 0
  const sulPiano = !!(cv && tv && SUL_PIANO[tv.larghezza]?.includes(forma) && 3 + monW + (monW ? 3 : 0) + cW + 3 <= tw)
  const areaW = tv ? Math.max(tw, roba + 6) : roba ? roba + 6 : 0
  const sd = m.sedia?.v, sTipo = tipoSedia(sd), sM = sd ? misuraSedia(sTipo, SEDIE_SCENA[sTipo]) : null
  // ── la fila: [sedia][tavolo o le cose per terra][case accanto], centrata ──
  const fila = []
  if (sd) fila.push({ k: 'sedia', w: sM.w, gap: 0 })
  if (areaW) fila.push({ k: 'area', w: areaW, gap: sd ? (tv ? -sM.sotto : 2) : 0 })
  if (cv && !sulPiano) fila.push({ k: 'case', w: cW, gap: fila.length ? 3 : 0 })
  let cur = 0
  for (const b of fila) { b.x = cur + b.gap; cur = b.x + b.w }
  const x0 = Math.floor((SCENA.w - cur) / 2), at = (k) => { const b = fila.find((f) => f.k === k); return b ? x0 + b.x : null }
  // ── lo sfondo ──
  t.rett(0, 0, SCENA.w, MURO_FINE + 1, MURO)
  for (let y = 5; y < MURO_FINE - 3; y += 6) { // i mattoni, appena accennati
    t.riga(0, y, SCENA.w, MURO_L)
    for (let x = (y / 6) % 2 ? 0 : 7; x < SCENA.w; x += 14) t.col(x, y + 1, Math.min(5, MURO_FINE - 3 - y - 1), MURO_L)
  }
  t.riga(0, MURO_FINE - 2, SCENA.w, BATTI_C); t.rett(0, MURO_FINE - 1, SCENA.w, 2, BATTI)
  t.rett(0, MURO_FINE + 1, SCENA.w, SCENA.h - MURO_FINE - 1, PAVIM)
  if (led && !tv) for (let x = 0; x < SCENA.w; x++) t.px(x, MURO_FINE - 2, luce(x)) // senza tavolo il led corre sul battiscopa
  ;[100, 105, 111, 118].forEach((y, k) => { t.riga(0, y, SCENA.w, PAVIM_L); for (let x = (k * 23) % 41; x < SCENA.w; x += 41) t.col(x, y + 1, (([105, 111, 118, 125][k]) - y) - 1, PAVIM_L) })
  // ── le ombre sul pavimento ──
  const ax = at('area'), dx = tv ? ax + Math.floor((areaW - tw) / 2) : null
  if (tv) t.rett(dx + 1, PAV, tw - 2, 2, OMBRA)
  if (cv && !sulPiano) t.riga(at('case'), PAV, cW, OMBRA)
  if (sd) t.riga(at('sedia') + 1, DAVANTI + 1, sM.w - 2, OMBRA)
  // ── il case accanto, il tavolo ──
  let caseDove = cv ? (sulPiano ? 'piano' : 'accanto') : null
  const opz = { acceso: on, luce, led: !!led }
  if (cv && !sulPiano) caseScena(t, at('case'), PAV - 1, m, opz)
  let L = 0, R = 0, yMon, yKb
  if (tv) {
    const r = tavolo(t, dx, PIANO, tw, tv, { prof: 9, bordo: 3, gambe: PAV - PIANO - 12 }, led ? luce : null)
    t.segna('tavolo', r.x, r.y, r.w, r.h); t.segna('piano', dx, PIANO, tw, 12)
    L = dx + 3; R = dx + tw - 3; yMon = PIANO + 2; yKb = PIANO + 4
  } else if (areaW) {
    L = ax + 3; R = ax + areaW - 3; yMon = MURO_FINE + 3; yKb = MURO_FINE + 5
    if (ns) t.rett(L, yMon + 1, R - L, 1, OMBRA)
  }
  let cx = null, Rs = R // Rs: dove finiscono gli schermi (prima del case sul piano)
  if (cv && sulPiano) { cx = R - cW; Rs = cx - 3 }
  // ── gli schermi, centrati nello spazio libero ──
  const mx0 = L + Math.floor((Rs - L - monW) / 2)
  for (let k = 0; k < ns; k++) { const r = schermo(t, mx0 + k * (mw + 2), yMon, sv, { k, n: ns, acceso: on }); t.segna('schermo', r.x, r.y, r.w, r.h) }
  // ── il case sul piano ──
  if (cx != null) caseScena(t, cx, PIANO + 3, m, opz) // in fondo al piano, accanto agli schermi
  // ── la tastiera centrata sotto gli schermi, il mouse alla sua destra ──
  if (kmW) {
    // (il case sul piano sta in fondo: se serve, tastiera e mouse gli passano davanti)
    const lim = Rs - L >= kmW ? Rs : R, centro = ns ? mx0 + monW / 2 : (L + lim) / 2
    let kx = Math.round(centro - (kbW ? kbW / 2 : -2))
    kx = Math.max(L, Math.min(lim - kmW, kx))
    if (m.tastiera) { const r = tastiera(t, kx, yKb, m.tastiera.v, luce); t.segna('tastiera', r.x, r.y, r.w, r.h) }
    if (m.mouse) { const r = mouse(t, kx + (kbW ? kbW + 3 : 0), yKb, m.mouse.v, luce); t.segna('mouse', r.x, r.y, r.w, r.h) }
  }
  // ── la sedia, davanti a tutto ──
  if (sd) { const r = sedia(t, at('sedia'), DAVANTI, sd, SEDIE_SCENA[sTipo]); for (const q of r.parti) t.segna(q.cosa, q.x, q.y, q.w, q.h) }
  return { w: t.w, h: t.h, pixel: t.pixel, ingombri: t.ingombri, fuori: t.fuori, acceso: on, completa, caseDove }
}

/** Disegna la postazione nel canvas (grande SCENA × scala, la misura la decide l'app). */
export function disegnaPostazione(canvas, montati, { scala = 1, acceso } = {}) {
  const r = componi(montati, { acceso })
  suCanvas(canvas, r, scala)
  return r
}

// ═════════════════════════════ i pezzi da soli (le schede del negozio) ═════════════════════════════

/** Una ventola grande vista di fronte (r = raggio): il telaio quadrato, le pale a spirale, il mozzo; col led l'anello. */
function ventolaGrande(t, x, y, lato, v, luce) {
  const pala = vivo(num(v?.colore, 0x2a2a30)), telaio = luma(pala) > 0.6 ? scuro(pala, 0.25) : chiaro(NERO, 0.1)
  t.scatola(x, y, lato, lato, telaio)
  for (const [i, j] of [[2, 2], [lato - 3, 2], [2, lato - 3], [lato - 3, lato - 3]]) t.px(x + i, y + j, OUT) // le viti
  const c = lato / 2, R = lato / 2 - 1.5
  t.disco(x + c, y + c, R, (px, py, d, a) => {
    if (d > R - 1.2) t.px(px, py, v?.led ? luce(Math.round(((a + Math.PI) / (2 * Math.PI)) * 14), 'arco') : OUT)
    else if (d < 2.3) t.px(px, py, d < 1.2 ? METALLO_C : OUT)
    else { const f = (((a + d * 0.22) / (2 * Math.PI)) * 7 % 1 + 1) % 1; t.px(px, py, f < 0.55 ? pala : f < 0.65 ? OUT : 0x0f0e13) }
  })
}

/** Il pezzo da solo sulla tela PEZZO, centrato (trasparente intorno). */
export function componiPezzo(id) {
  const p = id?.vista ? id : PER_ID[id], t = new Tela(PEZZO.w, PEZZO.h)
  if (!p?.vista) return { w: t.w, h: t.h, pixel: t.pixel, ingombri: [], fuori: 0 }
  const v = p.vista, luce = luci(null)
  const al = (w, h) => [Math.floor((PEZZO.w - w) / 2), Math.floor((PEZZO.h - h) / 2)] // l'angolo per centrare w × h
  let r = null
  switch (p.cat) {
    case 'tavolo': {
      const w = { piccolo: 24, medio: 30, grande: 36 }[v.larghezza] ?? 30, D = { prof: 6, bordo: 2, gambe: 16 }
      const [x, y] = al(w, 24); r = tavolo(t, x, y, w, v, D, null); break
    }
    case 'sedia': {
      const tipo = tipoSedia(v), D = SEDIE_PEZZO[tipo], M = misuraSedia(tipo, D), [x, y] = al(M.w, M.h)
      r = sedia(t, x, y + M.h - 1, v, D); break
    }
    case 'case': {
      const forma = formaDi(v), [W, H] = { mini: [18, 22], medio: [22, 30], grande: [26, 36], aperto: [34, 30] }[forma], [x, y] = al(W, H)
      if (forma === 'aperto') {
        const c = vivo(num(v.colore, 0x7a7f88))
        t.scatola(x + 3, y + 19, 16, 8, PCB); t.scatola(x + 21, y + 21, 10, 6, GRIGIO); t.sprite(x + 23, y + 22, ['o.o.o.', '.o.o.o', 'o.o.o.'], { o: OUT })
        for (const [bx, by, bw, bh] of [[0, 0, W, 3], [0, 15, W, 3], [0, H - 4, W, 3], [0, 0, 3, H - 1], [W - 3, 0, 3, H - 1]]) t.scatola(x + bx, y + by, bw, bh, c)
        t.riga(x, y + H - 1, 4, OUT); t.riga(x + W - 4, y + H - 1, 4, OUT)
      } else {
        const d = guscio(t, x, y, W, H, v, { acceso: false, luce, led: false })
        if (v.vetro) {
          t.scatola(d.x, d.y + 1, d.w - 3, d.h - (forma === 'mini' ? 7 : 8), PCB)
          for (let j = 3; j < d.h - 9; j += 4) for (let i = 2; i < d.w - 4; i += 5) t.px(d.x + i, d.y + 1 + j, PCB_C)
          if (forma !== 'mini') t.scatola(d.x, d.y + d.h - 5, d.w, 5, scuro(vivo(num(v.colore, 0x2b2b31)), 0.15))
          else t.scatola(d.x, d.y + d.h - 5, 8, 5, GRIGIO)
        }
      }
      r = { x, y, w: W, h: H }; break
    }
    case 'cpu': {
      // il processore (la piastrina verde coi contatti d'oro) col suo dissipatore sopra
      const tipo = v.dissipatore
      if (tipo === 'torre') {
        const [x, y] = al(26, 32)
        t.scatola(x + 2, y + 28, 22, 4, PCB); for (let i = 4; i < 22; i += 3) t.px(x + i, y + 30, ORO)
        t.scatola(x + 5, y + 25, 16, 4, METALLO_S)
        for (const hx of [8, 12, 16]) { t.col(x + hx, y + 2, 23, RAME); t.col(x + hx + 1, y + 2, 23, scuro(RAME, 0.3)) }
        t.scatola(x + 3, y, 14, 24, METALLO_C); for (let j = 2; j < 23; j += 2) t.riga(x + 4, y + j, 12, METALLO_S)
        t.scatola(x + 17, y + 1, 6, 22, NERO); for (let j = 3; j < 21; j += 3) t.riga(x + 18, y + j, 4, GRIGIO)
        r = { x, y, w: 26, h: 32 }
      } else if (tipo === 'liquido') {
        const [x, y] = al(32, 32)
        t.scatola(x, y, 32, 10, METALLO_S); for (let i = 2; i < 30; i += 2) t.col(x + i, y + 1, 8, OUT)
        for (const fx of [3, 17]) t.disco(x + fx + 6, y + 5, 4.6, (px, py, d) => t.px(px, py, d > 3.6 ? OUT : d < 1.3 ? METALLO_C : NERO))
        t.scatola(x + 6, y + 28, 20, 4, PCB); for (let i = 8; i < 25; i += 3) t.px(x + i, y + 30, ORO)
        for (const tx of [11, 19]) { t.col(x + tx, y + 10, 10, OUT); t.col(x + tx + 1, y + 10, 10, GRIGIO) }
        t.scatola(x + 8, y + 18, 16, 11, NERO)
        t.disco(x + 16, y + 23.5, 4.2, (px, py, d) => t.px(px, py, d > 3.2 ? luce(0, VERDE) : d < 1.6 ? OUT : 0x0f0e13))
        r = { x, y, w: 32, h: 32 }
      } else {
        const [x, y] = al(28, 28)
        t.scatola(x, y, 28, 28, PCB); for (let i = 2; i < 26; i += 3) { t.px(x + i, y + 1, ORO); t.px(x + i, y + 26, ORO); t.px(x + 1, y + i, ORO); t.px(x + 26, y + i, ORO) }
        t.scatola(x + 3, y + 3, 22, 22, METALLO)
        for (let i = 4; i < 24; i += 2) { t.px(x + i, y + 4, METALLO_S); t.px(x + i, y + 23, METALLO_S) }
        t.disco(x + 14, y + 14, 9.4, (px, py, d, a) => {
          if (d > 8.4) t.px(px, py, OUT)
          else if (d < 2.3) t.px(px, py, d < 1.3 ? METALLO_C : OUT)
          else { const f = (((a + d * 0.2) / (2 * Math.PI)) * 7 % 1 + 1) % 1; t.px(px, py, f < 0.55 ? NERO : 0x0f0e13) }
        })
        r = { x, y, w: 28, h: 28 }
      }
      break
    }
    case 'gpu': {
      const L = { corta: 24, media: 30, lunga: 36 }[v.lunghezza] ?? 30, [x, y] = al(L, 16), c = vivo(num(v.colore, 0x2b2b2b))
      t.scatola(x + 2, y + 12, L - 6, 3, PCB); for (let i = x + 6; i < x + 16; i++) t.px(i, y + 14, ORO); t.riga(x + 6, y + 15, 10, OUT) // il circuito e i contatti
      t.scatola(x, y, 3, 15, METALLO_C); t.px(x + 1, y + 3, OUT); t.px(x + 1, y + 6, OUT) // la staffa
      t.scatola(x + 2, y, L - 2, 13, c); t.riga(x + 3, y + 1, L - 4, chiaro(c, 0.2))
      const n = Math.min(3, v.ventole ?? 1), passo = (L - 4) / n
      for (let k = 0; k < n; k++) {
        const fx = x + 2 + passo * (k + 0.5)
        t.disco(fx, y + 6.5, 5.2, (px, py, d, a) => {
          if (d > 4.3) t.px(px, py, OUT)
          else if (d < 1.4) t.px(px, py, METALLO_C)
          else { const f = (((a + d * 0.3) / (2 * Math.PI)) * 5 % 1 + 1) % 1; t.px(px, py, f < 0.5 ? scuro(c, 0.5) : 0x0f0e13) }
        })
      }
      r = { x, y, w: L, h: 16 }; break
    }
    case 'ram': {
      // il kit: le stecche sdraiate una davanti all'altra (quella dietro più in alto e più a destra), coi contatti d'oro
      const b = v.banchi === 4 ? 4 : 2, c = vivo(num(v.colore, 0x2c6b35)), W = 30 + (b - 1) * 2, H = 9 + (b - 1) * 5, [x, y] = al(W, H)
      for (let k = 0; k < b; k++) {
        const sx = x + (b - 1 - k) * 2, sy = y + k * 5
        t.scatola(sx, sy, 30, 9, c)
        t.riga(sx + 1, sy + 6, 28, scuro(c, 0.3)); t.riga(sx + 1, sy + 7, 28, PCB)
        for (let i = sx + 3; i < sx + 28; i += 2) t.px(i, sy + 7, ORO)
        if (v.led) for (let i = 1; i < 29; i++) { t.px(sx + i, sy + 1, luce(i + 4 * k)); t.px(sx + i, sy + 2, luce(i + 4 * k)) }
        else t.riga(sx + 2, sy + 1, 26, chiaro(c, 0.2))
        t.rett(sx + 4, sy + 4, 9, 2, luma(c) > 0.5 ? scuro(c, 0.25) : chiaro(c, 0.25)) // l'etichetta
      }
      r = { x, y, w: W, h: H }; break
    }
    case 'ventole': { const [x, y] = al(26, 26); ventolaGrande(t, x, y, 26, v, luce); r = { x, y, w: 26, h: 26 }; break }
    case 'led': {
      // la striscia a zig-zag coi led accesi e la scatoletta del telecomando
      const [x, y] = al(32, 24), kit = luci(v)
      for (let k = 0; k < 3; k++) {
        const sy = y + k * 8
        t.scatola(x, sy, 28, 4, 0xe8e4d8)
        for (let i = 2; i < 26; i += 4) t.rett(x + i, sy + 1, 2, 2, kit(i + k * 28))
        if (k < 2) t.scatola(k % 2 ? x : x + 24, sy + 3, 4, 6, 0xe8e4d8)
      }
      t.scatola(x + 27, y + 17, 5, 7, NERO); t.px(x + 29, y + 19, kit(0)); t.px(x + 29, y + 21, OUT)
      r = { x, y, w: 32, h: 24 }; break
    }
    case 'memoria': {
      if (v.tipo === 'nvme') {
        const [x, y] = al(34, 10)
        t.scatola(x, y, 34, 10, PCB_C); t.rett(x + 1, y + 1, 3, 8, ORO); t.px(x + 2, y + 3, PCB_C)
        t.scatola(x + 7, y + 2, 9, 6, NERO); t.scatola(x + 18, y + 2, 7, 6, NERO); t.scatola(x + 27, y + 3, 4, 4, NERO)
        t.riga(x + 9, y + 4, 5, GRIGIO); t.px(x + 32, y + 4, METALLO_C)
        r = { x, y, w: 34, h: 10 }
      } else if (v.tipo === 'ssd') {
        const [x, y] = al(26, 18)
        t.scatola(x, y, 26, 18, NERO); t.scatola(x + 3, y + 4, 20, 10, 0x3a6bd8); t.riga(x + 5, y + 7, 12, chiaro(0x3a6bd8, 0.5)); t.riga(x + 5, y + 10, 8, chiaro(0x3a6bd8, 0.5))
        t.rett(x + 22, y + 16, 3, 1, ORO)
        r = { x, y, w: 26, h: 18 }
      } else {
        const [x, y] = al(30, 22)
        t.scatola(x, y, 30, 22, METALLO)
        t.disco(x + 11, y + 11, 8.5, (px, py, d) => t.px(px, py, d > 7.5 ? OUT : d < 2 ? METALLO_S : METALLO_C))
        t.px(x + 11, y + 11, OUT); t.linea(x + 14, y + 16, x + 22, y + 5, OUT)
        t.scatola(x + 22, y + 14, 6, 6, 0xf2efe6); t.riga(x + 23, y + 16, 4, GRIGIO)
        for (const [i, j] of [[2, 2], [27, 2], [2, 19], [27, 19]]) t.px(x + i, y + j, METALLO_S)
        r = { x, y, w: 30, h: 22 }
      }
      break
    }
    case 'schermo': {
      const [w, H] = monMisure(v), [x, y] = al(w, H + 5)
      r = schermo(t, x, y + H + 4, v, { k: 0, n: 1, acceso: true }); break
    }
    case 'tastiera': {
      // più grande di quella della scena: quattro file di tasti da 2 pixel e il fianco
      const [x, y] = al(36, 13), corpo = vivo(num(v.colore, 0x2a2a2a)), tasto = tastoDi(corpo)
      t.scatola(x, y, 36, 13, corpo); t.rett(x + 1, y + 10, 34, 2, scuro(corpo, 0.3))
      for (let fila = 0; fila < 4; fila++) for (let c = 0; c < 11; c++) {
        const kx = x + 2 + c * 3 + (fila % 2 ? 1 : 0), ky = y + 2 + fila * 2
        if (kx + 1 > x + 33) continue
        const spazio = fila === 3 && c >= 3 && c <= 7
        const col = v.tipo === 'rgb' ? luce(c * 2) : tasto
        if (spazio) { if (c === 3) t.riga(kx, ky, 14, col) } else t.riga(kx, ky, 2, col)
        if (v.tipo !== 'membrana' && !spazio) t.riga(kx, ky + 1, 2, scuro(v.tipo === 'rgb' ? col : tasto, 0.35))
      }
      r = { x, y, w: 36, h: 13 }; break
    }
    case 'mouse': {
      // visto da sopra: il corpo ovale, i due tasti, la rotella; il gaming ha i fianchi accesi e i tasti laterali
      const [x, y] = al(16, 24), c = vivo(num(v.colore, 0x303030)), gaming = v.tipo === 'gaming'
      const mezza = (j) => (j < 3 ? [4, 6, 7][j] : j > 19 ? [7, 6, 5, 3][j - 20] : 8)
      for (let j = 0; j < 24; j++) { const hw = mezza(j); t.riga(x + 8 - hw, y + j, hw * 2, OUT); if (j > 0 && j < 23) t.riga(x + 9 - hw, y + j, hw * 2 - 2, c) }
      t.col(x + 8, y + 1, 9, OUT); t.riga(x + 2, y + 10, 12, OUT)
      t.rett(x + 7, y + 3, 1, 4, OUT); t.rett(x + 8, y + 3, 1, 4, OUT); t.rett(x + 7, y + 4, 2, 2, GRIGIO)
      t.riga(x + 4, y + 2, 2, chiaro(c, 0.35))
      if (gaming) { for (let j = 12; j < 20; j++) { t.px(x + 1, j + y, luce(j)); t.px(x + 14, j + y, luce(j)) } t.rett(x + 3, y + 12, 2, 2, OUT); t.rett(x + 3, y + 15, 2, 2, OUT) }
      r = { x, y, w: 16, h: 24 }; break
    }
  }
  if (r) t.segna(p.cat, r.x, r.y, r.w, r.h)
  return { w: t.w, h: t.h, pixel: t.pixel, ingombri: t.ingombri, fuori: t.fuori }
}

/** Disegna il pezzo nel canvas (grande PEZZO × scala, la misura la decide l'app). */
export function disegnaPezzo(canvas, id, { scala = 1 } = {}) {
  const r = componiPezzo(id)
  suCanvas(canvas, r, scala)
  return r
}
