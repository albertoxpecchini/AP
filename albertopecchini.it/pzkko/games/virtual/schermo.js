// Lo schermino di «Virtual»: un piccolo schermo a pixel, pulito come un tamagotchi, su cui si vede la partita del
// campionato inventato (partita.js). È un solo canvas: la tela interna è 192 × 120 «pixel grossi» moltiplicati per un
// fattore intero (misura()), così i pixel restano netti a qualunque misura e su qualunque schermo. Tutto quello che si
// vede è una funzione del tempo (il secondo di partita, o quanto manca al fischio d'inizio): niente stato che si accumula,
// quindi due schede mostrano la stessa cosa, chi arriva a metà vede il punto giusto e una scheda nascosta riprende da dove
// il tempo è arrivato.
//
// Dentro: il campo da calcio a cinque in erba con le righe e le due porte, i dieci omini con le maglie delle loro squadre
// (il portiere di un altro colore), gli spalti coi tifosi pixel nei colori delle due squadre, le bandiere, le panchine;
// la telecamera segue la palla con un po' di inerzia e si avvicina sulle azioni (campo largo, mezzo campo, primo piano);
// per i rigori l'inquadratura da dietro la porta; il replay del gol al rallentatore. Il meteo (sereno, nuvole, pioggia con
// le pozzanghere, nebbia, neve con la palla arancione, vento) e la luce (di giorno, al tramonto, di notte coi riflettori)
// vengono dalla partita e sono solo scena. Le scritte sono in un carattere a pixel 3 × 5 disegnato qui.
//
//   const s = new Schermo(canvas)
//   s.misura(larghezzaCss, altezzaCss)            // il fattore intero e la misura della tela
//   s.disegna(partita, { fase, t, manca, ridotto })  // un fotogramma: fase 'scommesse' | 'partita' | 'finita', t secondi
//   s.evento                                      // dopo disegna(): l'evento in scena (per i suoni e la voce), o null

import { T, minuto, punteggioA } from './partita.js'

export const LARG = 192, ALT = 120
// il campo nel mondo: 160 × 80 unità (un'unità = un pixel con la telecamera larga), centrato in (80, 40); fuori gli spalti
const CAMPO = { x0: 0, y0: 0, x1: 160, y1: 80, cx: 80, cy: 40, porta: 14 } // porta: mezza larghezza della porta
const TRIB = 20 // la profondità degli spalti

// ── il carattere a pixel 3 × 5 ──────────────────────────────────────────────
const GLIFI = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
  H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
  O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101011',
  V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010', 9: '010101011001110',
  ' ': '000000000000000', '!': '010010010000010', "'": '010010000000000', '-': '000000111000000', '–': '000000111000000', ':': '000010000010000', '.': '000000000000010', ',': '000000000010100', '+': '000010111010000', '?': '110001010000010', '/': '001001010100100', '(': '010100100100010', ')': '010001001001010', '°': '010101010000000', '%': '101001010100101', 'È': '111100110100111', 'À': '010101111101101', 'Ù': '101101101101011', 'É': '111100110100111', 'Ì': '111010010010111', 'Ò': '010101101101010',
}
/** Quanto è larga una scritta, in pixel grossi (3 per lettera più uno di spazio). */
export const largTesto = (s) => s.length * 4 - 1

// ── piccoli rumori riproducibili (dal numero della partita e da un indice) ──
const h32 = (a, b) => { let h = (Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x27d4eb2f) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296 }
const lerp = (a, b, u) => a + (b - a) * u
const liscia = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))
const limita = (v, a, b) => Math.max(a, Math.min(b, v))

export class Schermo {
  constructor(canvas) {
    this.c = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.k = 2
    this.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 } // la telecamera di adesso (si muove con inerzia verso la meta)
    this.ultimo = 0
    this.evento = null
    this.scena = null
  }

  /** Il fattore intero della tela dalla misura CSS del contenitore: la tela è LARG × ALT pixel grossi per k, e il CSS la
   *  allarga a tutto il contenitore (image-rendering: pixelated): con k scelto vicino ai pixel veri dello schermo i
   *  pixel grossi restano netti e tutti uguali a meno di un pixel del display. */
  misura(w, h) {
    const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1))
    const k = Math.max(1, Math.round(Math.min((w * dpr) / LARG, (h * dpr) / ALT)))
    if (k !== this.k || this.c.width !== LARG * k) {
      this.k = k
      this.c.width = LARG * k; this.c.height = ALT * k
    }
  }

  // ── le primitive: tutto in pixel grossi, interi ──
  px(x, y, col) { this.ctx.fillStyle = col; this.ctx.fillRect(Math.round(x) * this.k, Math.round(y) * this.k, this.k, this.k) }
  rett(x, y, w, h, col) { const k = this.k, x0 = Math.round(x), y0 = Math.round(y), x1 = Math.round(x + w), y1 = Math.round(y + h); if (x1 <= x0 || y1 <= y0) return; this.ctx.fillStyle = col; this.ctx.fillRect(x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k) }
  testo(s, x, y, col, { centro = false, ombra = null } = {}) {
    s = String(s).toUpperCase()
    if (centro) x -= Math.floor(largTesto(s) / 2)
    if (ombra) this.testo(s, x + 1, y + 1, ombra)
    for (const ch of s) {
      const g = GLIFI[ch] ?? GLIFI['?']
      for (let i = 0; i < 15; i++) if (g[i] === '1') this.px(x + (i % 3), y + Math.floor(i / 3), col)
      x += 4
    }
  }
  /** Una targhetta col testo: fondo scuro, testo chiaro, in basso o dove si dice. */
  targa(s, y, { fondo = '#161616', col = '#ffffff', x = LARG / 2 } = {}) {
    const w = largTesto(s) + 6
    this.rett(x - Math.floor(w / 2), y - 2, w, 9, fondo)
    this.testo(s, x, y, col, { centro: true })
  }

  // il mondo → lo schermo
  sx(wx) { return LARG / 2 + (wx - this.cam.x) * this.cam.z }
  sy(wy) { return ALT / 2 + (wy - this.cam.y) * this.cam.z }
  rw(x, y, w, h, col) { const z = this.cam.z; this.rett(this.sx(x), this.sy(y), w * z, h * z, col) }

  // ── il fotogramma ──
  /**
   * Disegna la partita `p` com'è adesso. stato: { fase: 'scommesse' | 'partita' | 'finita', t: secondi di partita (anche
   * negativi prima del fischio: −240…0), ridotto: movimento ridotto (telecamera ferma, solo scritte), dt: secondi dal
   * fotogramma prima }.
   */
  disegna(p, { fase, t, ridotto = false, dt = 1 / 60 }) {
    this.p = p
    this.t = t
    this.rid = ridotto
    const scena = fase === 'partita' ? this.scenaPartita(p, t) : fase === 'finita' ? this.scenaFinale(p) : this.scenaAttesa(p, t)
    this.scena = scena
    this.evento = scena.evento ?? null
    // la telecamera: con inerzia verso la meta (ferma e larga col movimento ridotto)
    const meta = ridotto ? { x: CAMPO.cx, y: CAMPO.cy, z: 1 } : scena.cam
    const a = ridotto || scena.subito ? 1 : 1 - Math.exp(-dt * (scena.lesto ? 9 : 4.5))
    this.cam.x = lerp(this.cam.x, meta.x, a); this.cam.y = lerp(this.cam.y, meta.y, a); this.cam.z = lerp(this.cam.z, meta.z, a)
    if (scena.scossa && !ridotto) { this.cam.x += (h32(p.indice, Math.floor(t * 30)) - 0.5) * scena.scossa; this.cam.y += (h32(p.indice + 7, Math.floor(t * 30)) - 0.5) * scena.scossa }
    this.ctx.imageSmoothingEnabled = false
    if (scena.dietroPorta && !ridotto) this.disegnaDietroPorta(p, scena)
    else this.disegnaMondo(p, scena)
    this.disegnaMeteoDavanti(p, scena)
    for (const s of scena.scritte ?? []) this.targa(s.t, s.y, s)
    if (scena.pannello) this.pannello(p, scena.pannello)
  }

  // ── il mondo visto dall'alto ──
  disegnaMondo(p, scena) {
    const m = p.meteo, notte = m.notte, sera = m.sera
    const L = this.luce(p)
    // il fondo: il cemento degli spalti; di notte quasi buio
    this.rett(0, 0, LARG, ALT, L.cemento)
    this.spalti(p, scena, L)
    this.panchine(p, scena, L)
    // il prato a strisce
    const z = this.cam.z
    for (let i = 0; i < 8; i++) this.rw(CAMPO.x0 + i * 20, CAMPO.y0, 20, 80, i % 2 ? L.erba1 : L.erba2)
    if (m.tipo === 'neve') for (let i = 0; i < 40; i++) { const r = h32(p.indice, 300 + i); this.rw(CAMPO.x0 + r * 156, CAMPO.y0 + h32(p.indice, 400 + i) * 77, 2 + r * 5, 1 + r * 2, L.neve) }
    if (m.tipo === 'nuvole' || m.tipo === 'pioggia') this.ombreNuvole(p, L)
    // le righe
    const R = L.righe
    this.rw(CAMPO.x0, CAMPO.y0, 160, 1, R); this.rw(CAMPO.x0, CAMPO.y1 - 1, 160, 1, R); this.rw(CAMPO.x0, CAMPO.y0, 1, 80, R); this.rw(CAMPO.x1 - 1, CAMPO.y0, 1, 80, R)
    this.rw(CAMPO.cx, CAMPO.y0, 1, 80, R)
    this.cerchio(CAMPO.cx, CAMPO.cy, 12, R)
    for (const lato of [-1, 1]) {
      const x = lato < 0 ? CAMPO.x0 : CAMPO.x1
      // l'area: un arco di 20 davanti alla porta
      this.arco(x, CAMPO.cy, 20, lato, R)
      this.rw(lato < 0 ? CAMPO.x0 + 24 : CAMPO.x1 - 25, CAMPO.cy, 1, 1, R) // il dischetto
    }
    if (m.tipo === 'pioggia') this.pozzanghere(p, L)
    // le porte (viste dall'alto: la rete dietro la linea)
    for (const lato of [-1, 1]) {
      const x = lato < 0 ? CAMPO.x0 - 4 : CAMPO.x1
      const gonfia = scena.rete === lato ? 2 : 0
      this.rw(x - (lato > 0 ? 0 : gonfia), CAMPO.cy - CAMPO.porta, 4 + gonfia, CAMPO.porta * 2, L.rete)
      this.rw(lato < 0 ? CAMPO.x0 - 1 : CAMPO.x1, CAMPO.cy - CAMPO.porta, 1, 1, '#ffffff'); this.rw(lato < 0 ? CAMPO.x0 - 1 : CAMPO.x1, CAMPO.cy + CAMPO.porta - 1, 1, 1, '#ffffff')
    }
    // gli omini, dal più in alto al più in basso (chi sta più giù copre)
    const omini = [...scena.omini].sort((a, b) => a.y - b.y)
    for (const o of omini) this.omino(o, L)
    if (scena.barella) this.barella(scena.barella, L)
    if (scena.arbitro) this.omino(scena.arbitro, L)
    if (scena.cartellino) this.cartellino(scena.cartellino)
    if (scena.palla) this.palla(scena.palla, L, p)
    if (scena.palla2) this.palla(scena.palla2, L, p)
    if (scena.nutrie) for (const n of scena.nutrie) this.nutria(n, L)
    // i riflettori, di notte: quattro torri agli angoli e la luce che cade sul campo
    if (notte || sera) this.riflettori(p, L, notte)
    if (scena.buio) this.rett(0, 0, LARG, ALT, `rgba(4,6,14,${scena.buio})`)
  }

  luce(p) {
    const m = p.meteo
    const notte = m.notte, sera = m.sera, grigio = m.tipo === 'nuvole' || m.tipo === 'pioggia' || m.tipo === 'nebbia'
    if (notte) return { cemento: '#141724', erba1: '#2c7a3c', erba2: '#266c34', righe: '#e2eedb', rete: '#5b6473', neve: '#d9dfe8', tifosi: 0.55, pelle: '#c48f68', ombra: 'rgba(0,0,0,.35)', cielo: '#0c1020', gradoni: '#232738', neutro: '#3a3d48', pelle2: '#8a6a4a' }
    if (sera) return { cemento: '#6a5850', erba1: '#4f9a3f', erba2: '#459038', righe: '#f4ecd8', rete: '#9a8e86', neve: '#f0e8e0', tifosi: 0.85, pelle: '#d9a37a', ombra: 'rgba(0,0,0,.25)', cielo: '#d87a3c', gradoni: '#5c4c46', neutro: '#6a6358', pelle2: '#a87a56' }
    if (grigio) return { cemento: '#7c7f84', erba1: '#4e9a44', erba2: '#46903d', righe: '#eef2ec', rete: '#a9adb2', neve: '#eef1f4', tifosi: 0.9, pelle: '#d9a37a', ombra: 'rgba(0,0,0,.18)', cielo: '#9aa3ad', gradoni: '#6a6d72', neutro: '#8e9196', pelle2: '#a87a56' }
    if (m.tipo === 'neve') return { cemento: '#9aa0a8', erba1: '#8fb58c', erba2: '#84ad81', righe: '#ffffff', rete: '#c2c7cf', neve: '#f7f9fb', tifosi: 0.9, pelle: '#d9a37a', ombra: 'rgba(0,0,0,.15)', cielo: '#c9d0d8', gradoni: '#8a9098', neutro: '#aab0b8', pelle2: '#a87a56' }
    return { cemento: '#8b8f93', erba1: '#5bb24a', erba2: '#4fa842', righe: '#f6fbf3', rete: '#b9bfc5', neve: '#ffffff', tifosi: 1, pelle: '#d9a37a', ombra: 'rgba(0,0,0,.22)', cielo: '#7fc4ea', gradoni: '#767a7f', neutro: '#9a9ea3', pelle2: '#a87a56' }
  }

  cerchio(cx, cy, r, col) {
    const z = this.cam.z, n = Math.max(16, Math.floor(r * z * 1.2))
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; this.rett(this.sx(cx + Math.cos(a) * r), this.sy(cy + Math.sin(a) * r), 1, 1, col) }
  }
  arco(x, cy, r, lato, col) {
    const z = this.cam.z, n = Math.max(10, Math.floor(r * z))
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; this.rett(this.sx(x + Math.cos(a) * r * (lato < 0 ? 1 : -1)), this.sy(cy + Math.sin(a) * r), 1, 1, col) }
  }

  // ── gli spalti: le file di tifosi coi colori delle due squadre, che si alzano al gol ──
  spalti(p, scena, L) {
    const { indice } = p, piena = scena.folla ?? 1, salto = scena.salto // salto: { squadra, u } i tifosi di quella squadra saltano
    const colori = (sq) => p.maglie[sq].colori
    // chi sta dove: la curva di casa in alto e a sinistra, gli ospiti in basso a destra (un quarto); in basso a sinistra
    // misti, e in alto a destra ancora casa
    const zone = [
      { x: CAMPO.x0 - 6, y: CAMPO.y0 - TRIB - 2, w: 172, h: TRIB, sq: 'casa', file: 5 }, // tribuna alta
      { x: CAMPO.x0 - 6, y: CAMPO.y1 + 2, w: 92, h: TRIB, sq: 'misti', file: 5 }, // bassa, sinistra
      { x: CAMPO.x0 + 88, y: CAMPO.y1 + 2, w: 78, h: TRIB, sq: 'ospite', file: 5 }, // bassa, destra: gli ospiti
      { x: CAMPO.x0 - TRIB - 8, y: CAMPO.y0 - 2, w: TRIB, h: 84, sq: 'casa', file: 5, vert: true },
      { x: CAMPO.x1 + 8, y: CAMPO.y0 - 2, w: TRIB, h: 84, sq: 'casa', file: 5, vert: true },
    ]
    for (const zo of zone) {
      // i gradoni
      const sx = this.sx(zo.x), sy = this.sy(zo.y), z = this.cam.z
      if (sx > LARG || sy > ALT || sx + zo.w * z < 0 || sy + zo.h * z < 0) continue
      this.rw(zo.x, zo.y, zo.w, zo.h, L.gradoni)
      // le file: i tifosi a 2 × 2 con la testa sopra, ogni fila sfalsata di un pixel, qualche posto vuoto e qualche
      // tifoso «neutro» (il cappotto grigio) così non è un tappeto a righe
      const passo = 3
      const n1 = Math.floor((zo.vert ? zo.h : zo.w) / passo), n2 = Math.floor((zo.vert ? zo.w : zo.h) / 4)
      for (let f = 0; f < n2; f++) for (let i = 0; i < n1; i++) {
        const r = h32(indice + f * 977, i + 31 * zone.indexOf(zo))
        if (r > piena * 0.92) continue // il posto è vuoto (o non ancora preso)
        const sq = zo.sq === 'misti' ? (r < 0.5 ? 'casa' : 'ospite') : zo.sq
        const cc = colori(sq)
        const r2 = (r * 13) % 1
        const col = r2 < 0.14 ? L.neutro : r2 < 0.65 ? cc[0] : cc[1] ?? cc[0]
        const sf = f % 2 // la fila sfalsata
        let x = zo.vert ? zo.x + f * 4 : zo.x + i * passo + sf, y = zo.vert ? zo.y + i * passo + sf : zo.y + f * 4 + 1
        // chi salta
        if (salto && salto.squadra === sq && Math.sin(salto.u * 40 + r * 9) > 0.2) y -= 1
        // l'onda del coro: ogni tanto una fila si alza a onda
        if (scena.onda != null && Math.abs((zo.vert ? y : x) - scena.onda) < 6) y -= 1
        this.rw(x, y, 2, 2, this.scuro(col, L.tifosi))
        this.rw(x, y - 1, 2, 1, (r * 29) % 1 < 0.5 ? L.pelle : L.pelle2)
      }
    }
    // le bandiere degli sbandieratori: tre di casa e una ospite, che ondeggiano col vento
    const vento = p.meteo.tipo === 'vento' ? 2.2 : 0.8
    const bandiere = [{ x: 20, y: CAMPO.y0 - TRIB + 2, sq: 'casa' }, { x: 120, y: CAMPO.y0 - TRIB + 2, sq: 'casa' }, { x: 130, y: CAMPO.y1 + TRIB - 2, sq: 'ospite' }, { x: 60, y: CAMPO.y1 + TRIB - 2, sq: 'casa' }]
    for (const [i, b] of bandiere.entries()) {
      if (h32(indice, 900 + i) > piena + 0.2) continue
      const cc = colori(b.sq), ph = this.t * (3 + vento) + i
      const dx = Math.round(Math.sin(ph) * vento)
      this.rw(b.x, b.y - 5, 1, 6, '#e8e4dc')
      this.rw(b.x + 1 + dx * 0.3, b.y - 5, 4, 2, cc[0]); this.rw(b.x + 1 + dx * 0.6, b.y - 3, 4, 2, cc[1] ?? cc[0])
    }
  }
  scuro(col, f) {
    if (f >= 1) return col
    const [r, g, b] = [1, 3, 5].map((i) => Math.round(parseInt(col.slice(i, i + 2), 16) * f))
    return `rgb(${r},${g},${b})`
  }

  panchine(p, scena, L) {
    // due panchine sotto la tribuna alta, ai lati del centro: la tettoia e le riserve sedute
    for (const [i, sq] of ['casa', 'ospite'].entries()) {
      const x = i === 0 ? CAMPO.cx - 34 : CAMPO.cx + 14
      this.rw(x, CAMPO.y0 - 8, 20, 5, '#3a3d44')
      const seduti = scena.inPanchina?.[sq] ?? 2
      for (let j = 0; j < seduti; j++) this.omino({ x: x + 4 + j * 6, y: CAMPO.y0 - 5, sq, seduto: true, maglia: p.maglie[sq], fermo: true }, L)
    }
  }

  // ── un omino: 3 × 6 pixel grossi al mondo (testa, maglia a due righe, pantaloncini, gambe) ──
  omino(o, L) {
    const z = this.cam.z, X = this.sx(o.x), Y = this.sy(o.y)
    const m = o.maglia, c1 = o.portiere ? o.portiere : m.colori[0], c2 = o.portiere ? o.portiere : m.colori[1] ?? m.colori[0]
    const w = Math.max(1, Math.round(z * 3)), u = Math.max(1, Math.round(z)) // un pixel grosso del mondo
    const x0 = Math.round(X - w / 2)
    if (o.aTerra) {
      // steso: lungo, la testa da un lato
      const y0 = Math.round(Y - u)
      this.rett(x0 - u, y0, u, u, L.pelle)
      this.rett(x0, y0, w, u, c1); this.rett(x0 + w, y0, u, u, c2)
      this.rett(x0 + w + u, y0, u * 2, u, '#2b2b2b')
      return
    }
    const alto = o.seduto ? 4 : 6
    const y0 = Math.round(Y - alto * u)
    this.rett(Math.round(X - u / 2), y0, u, u, L.pelle) // la testa
    // la maglia: due righe, col disegno
    const maglia = (yy) => {
      if (o.portiere) { this.rett(x0, yy, w, u, c1); return }
      const d = m.disegno
      if (d === 'strisce') { for (let i = 0; i < w; i += u) this.rett(x0 + i, yy, u, u, Math.floor(i / u) % 2 ? c2 : c1) }
      else if (d === 'meta') { this.rett(x0, yy, Math.ceil(w / 2), u, c1); this.rett(x0 + Math.ceil(w / 2), yy, Math.floor(w / 2), u, c2) }
      else if (d === 'fascia') { this.rett(x0, yy, w, u, yy === y0 + u ? c1 : c2) }
      else if (d === 'croce') { this.rett(x0, yy, w, u, c1); this.rett(x0 + Math.floor(w / 2 / u) * u, yy, u, u, c2); if (yy === y0 + 2 * u) this.rett(x0, yy, w, u, c2) }
      else { this.rett(x0, yy, w, u, c1); if (yy === y0 + u && w >= 3 * u) this.rett(x0, yy, u, u, c2) }
    }
    maglia(y0 + u); maglia(y0 + 2 * u)
    if (o.seduto) { this.rett(x0, y0 + 3 * u, w, u, '#2b2b2b'); return }
    this.rett(x0, y0 + 3 * u, w, u, o.portiere ? '#2b2b2b' : m.colori[1] === '#ffffff' && m.colori[0] !== '#ffffff' ? '#ffffff' : '#2b2b2b') // i pantaloncini
    // le gambe: due pixel che si alternano correndo
    const passo = o.fermo ? 0 : Math.floor(this.t * 10 + (o.i ?? 0)) % 2
    this.rett(x0 + (passo ? u : 0), y0 + 4 * u, u, u, L.pelle); this.rett(x0 + w - u - (passo ? u : 0), y0 + 4 * u, u, u, L.pelle)
    this.rett(x0 + (passo ? 0 : u) + 0, y0 + 5 * u, u, u, '#161616'); this.rett(x0 + w - u - (passo ? 0 : u), y0 + 5 * u, u, u, '#161616')
    if (o.numero != null && z >= 2.4) this.testo(String(o.numero), Math.round(X) - (o.numero >= 10 ? 3 : 1), y0 - 7, '#ffffff', { ombra: '#161616' })
  }
  palla(b, L, p) {
    const z = this.cam.z, s = Math.max(1, Math.round(z * 0.9))
    const col = p.meteo.tipo === 'neve' ? '#ff7a1a' : '#ffffff'
    const alto = b.h ?? 0 // in aria: l'ombra resta sotto
    if (alto > 0) this.rett(this.sx(b.x) - s / 2, this.sy(b.y) - s / 2, s, s, L.ombra)
    this.rett(this.sx(b.x) - s / 2, this.sy(b.y - alto) - s / 2, s, s, col)
    if (s >= 3) this.rett(this.sx(b.x) - s / 2 + 1, this.sy(b.y - alto) - s / 2 + 1, 1, 1, '#161616')
  }
  barella(b, L) {
    // due barellieri in giallo che portano via l'infortunato steso
    const z = this.cam.z, u = Math.max(1, Math.round(z))
    const X = this.sx(b.x), Y = this.sy(b.y)
    this.rett(X - 4 * u, Y - u, 8 * u, u, '#d0cfc8')
    this.rett(X - 3 * u, Y - 2 * u, 6 * u, u, b.maglia.colori[0])
    this.rett(X - 4 * u, Y - 2 * u, u, u, L.pelle)
    for (const dx of [-5, 5]) { this.rett(X + dx * u - u / 2, Y - 5 * u, u, u, L.pelle); this.rett(X + dx * u - u, Y - 4 * u, 2 * u, 2 * u, '#f2c230'); this.rett(X + dx * u - u, Y - 2 * u, u, 2 * u, '#161616'); this.rett(X + dx * u, Y - 2 * u, u, 2 * u, '#161616') }
  }
  cartellino(c) {
    // il primo piano dell'arbitro che alza il cartellino: la mano e il rettangolo
    this.rett(c.x - 1, c.y - 8, 2, 4, '#161616')
    this.rett(c.x - 3, c.y - 16, 6, 9, c.rosso ? '#e0202a' : '#ffd400')
    this.rett(c.x - 2, c.y - 15, 4, 7, c.rosso ? '#f04a52' : '#ffe566')
  }
  nutria(n, L) {
    // la nutria: una salsiccia marrone con la coda, che corre sul prato
    const z = this.cam.z, u = Math.max(1, Math.round(z))
    const X = this.sx(n.x), Y = this.sy(n.y)
    this.rett(X - 2 * u, Y - u, 4 * u, u, '#6b4a2b'); this.rett(X + 2 * u * n.dir, Y - u, u, u, '#4a3220'); this.rett(X - 2 * u * n.dir, Y - u, 2 * u, u * 0.5, '#4a3220')
  }

  pozzanghere(p, L) {
    for (let i = 0; i < 6; i++) { const r = h32(p.indice, 500 + i); this.rw(CAMPO.x0 + 8 + r * 140, CAMPO.y0 + 6 + h32(p.indice, 600 + i) * 66, 5 + r * 6, 2 + r * 2, L.cielo === '#0c1020' ? '#3a4a6a' : '#9db6c8') }
  }
  ombreNuvole(p, L) {
    // tre ombre di nuvola che scorrono piano sul prato
    const t = this.t + 300
    for (let i = 0; i < 3; i++) { const x = ((t * (2 + i) + i * 70) % 240) - 40, y = 10 + i * 25; this.rw(x, y, 36, 14, 'rgba(0,30,0,.14)') }
  }
  riflettori(p, L, notte) {
    // le torri e il bagliore sul campo
    const torri = [[CAMPO.x0 - 10, CAMPO.y0 - 12], [CAMPO.x1 + 10, CAMPO.y0 - 12], [CAMPO.x0 - 10, CAMPO.y1 + 12], [CAMPO.x1 + 10, CAMPO.y1 + 12]]
    for (const [x, y] of torri) { this.rw(x - 1, y - 1, 3, 3, '#fff6c8'); this.rw(x, y, 1, 1, '#ffffff') }
    if (notte) {
      // la luce: più chiara al centro del campo, buia fuori (la vignetta della notte)
      this.ctx.save()
      const k = this.k, g = this.ctx.createRadialGradient(this.sx(CAMPO.cx) * k, this.sy(CAMPO.cy) * k, 30 * k * this.cam.z, this.sx(CAMPO.cx) * k, this.sy(CAMPO.cy) * k, 100 * k * this.cam.z)
      g.addColorStop(0, 'rgba(255,245,200,.14)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,16,.7)')
      this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, LARG * k, ALT * k)
      this.ctx.restore()
    }
  }

  // ── il meteo davanti a tutto: pioggia, neve, nebbia, vento ──
  disegnaMeteoDavanti(p, scena) {
    const m = p.meteo, t = this.t + 1000, vento = m.tipo === 'vento' ? 1.6 : 0.3
    if (m.tipo === 'pioggia') {
      for (let i = 0; i < 46; i++) { const r = h32(p.indice, 700 + i), x = (r * LARG + t * 60 * vento * 0.4) % LARG, y = (h32(p.indice, 800 + i) * ALT + t * 140 * (0.7 + r * 0.6)) % ALT; this.rett(x, y, 1, 3, 'rgba(210,225,240,.55)') }
    } else if (m.tipo === 'neve') {
      for (let i = 0; i < 40; i++) { const r = h32(p.indice, 700 + i), x = (r * LARG + Math.sin(t * 1.3 + i) * 6 + t * 10 * vento) % LARG, y = (h32(p.indice, 800 + i) * ALT + t * (12 + r * 14)) % ALT; this.rett((x + LARG) % LARG, y, 1, 1, '#ffffff') }
    } else if (m.tipo === 'vento') {
      // foglie e carte che volano
      for (let i = 0; i < 7; i++) { const r = h32(p.indice, 700 + i), x = (r * LARG + t * (40 + r * 40)) % LARG, y = (h32(p.indice, 800 + i) * ALT + Math.sin(t * 3 + i) * 5 + ALT) % ALT; this.rett(x, y, 2, 1, i % 2 ? '#c9a94f' : '#e8e4dc') }
    }
    if (m.tipo === 'nebbia' || scena.nebbia) {
      // la nebbia a blocchi: più fitta lontano dal centro dello schermo, e che respira piano
      const forza = scena.nebbia ?? (0.45 + 0.35 * m.forza)
      const B = 8
      for (let y = 0; y < ALT; y += B) for (let x = 0; x < LARG; x += B) {
        const d = Math.hypot(x + B / 2 - LARG / 2, (y + B / 2 - ALT / 2) * 1.4) / 100
        const a = limita(forza * (0.45 + d) + 0.05 * Math.sin(t * 0.7 + x * 0.05 + y * 0.09), 0, 0.92)
        this.rett(x, y, B, B, `rgba(214,218,222,${a.toFixed(2)})`)
      }
    }
  }

  // ── la vista da dietro la porta, per i rigori ──
  disegnaDietroPorta(p, s) {
    const L = this.luce(p), u = s.u // 0..1 dentro il rigore
    this.rett(0, 0, LARG, ALT, L.cielo)
    if (p.meteo.notte) for (let i = 0; i < 12; i++) this.px(h32(p.indice, 1000 + i) * LARG, h32(p.indice, 1100 + i) * 30, '#aab')
    // gli spalti di fronte
    this.rett(0, 28, LARG, 22, L.cemento)
    const cc = p.maglie[s.squadra === 'casa' ? 'ospite' : 'casa'].colori
    for (let f = 0; f < 5; f++) for (let i = 0; i < 48; i++) { const r = h32(p.indice + f, i); this.rett(i * 4 + 1, 30 + f * 4 + (r > 0.5 ? 1 : 0), 1, 2, this.scuro(r < 0.6 ? cc[0] : cc[1] ?? cc[0], L.tifosi)); this.rett(i * 4 + 1, 29 + f * 4 + (r > 0.5 ? 1 : 0), 1, 1, L.pelle) }
    // il prato in prospettiva
    this.rett(0, 50, LARG, ALT - 50, L.erba1)
    for (let y = 50; y < ALT; y += 10) this.rett(0, y, LARG, 5, L.erba2)
    this.rett(0, 50, LARG, 1, L.righe)
    // la porta: i pali e la rete (visti da dietro)
    const gx = 36, gy = 22, gw = 120, gh = 44
    for (let y = gy; y < gy + gh; y += 3) this.rett(gx, y, gw, 1, 'rgba(255,255,255,.35)')
    for (let x = gx; x < gx + gw; x += 3) this.rett(x, gy, 1, gh, 'rgba(255,255,255,.35)')
    this.rett(gx - 2, gy - 2, gw + 4, 2, '#ffffff'); this.rett(gx - 2, gy, 2, gh + 2, '#ffffff'); this.rett(gx + gw, gy, 2, gh + 2, '#ffffff')
    // il portiere: grande, al centro, che si tuffa da un lato dopo il tiro
    const sq = s.squadra === 'casa' ? 'ospite' : 'casa'
    const tuffo = u > 0.62 ? limita((u - 0.62) / 0.12, 0, 1) : 0
    const gkX = LARG / 2 + s.tuffo * tuffo * 34, gkY = 66 + tuffo * 6
    const pc = p.portieri[sq]
    this.rett(gkX - 3, gkY - 22, 6, 6, L.pelle); this.rett(gkX - 7 - tuffo * 6, gkY - 16, 14 + tuffo * 12, 9, pc); this.rett(gkX - 6, gkY - 7, 12, 4, '#2b2b2b'); this.rett(gkX - 5, gkY - 3, 4, 3, L.pelle); this.rett(gkX + 1, gkY - 3, 4, 3, L.pelle)
    if (!tuffo) { this.rett(gkX - 13, gkY - 15, 6, 3, pc); this.rett(gkX + 7, gkY - 15, 6, 3, pc) }
    // il tiratore di spalle, in fondo, e la palla sul dischetto che poi vola verso di noi (cresce) o in porta
    const corsa = limita((u - 0.3) / 0.3, 0, 1)
    const tx = LARG / 2 - 20 + corsa * 18, ty = ALT - 8 - corsa * 4
    if (u < 0.6) {
      // il tiratore di spalle: testa, maglia coi colori, pantaloncini, gambe (grande: è vicino a noi)
      const mg = p.maglie[s.squadra].colori
      this.rett(tx - 3, ty - 24, 6, 6, L.pelle); this.rett(tx - 7, ty - 18, 14, 10, mg[0]); this.rett(tx - 7, ty - 14, 14, 2, mg[1] ?? mg[0]); this.rett(tx - 6, ty - 8, 12, 4, '#2b2b2b')
      const passo = corsa > 0 ? Math.floor(this.t * 12) % 2 : 0
      this.rett(tx - 5, ty - 4 - passo * 2, 4, 4 + passo * 2, L.pelle); this.rett(tx + 1, ty - 4, 4, 4, L.pelle)
    }
    let bx = LARG / 2, by = ALT - 14, bs = 4
    if (u >= 0.6) {
      const v = limita((u - 0.6) / 0.14, 0, 1)
      const destX = s.esito === 'fuori' ? LARG / 2 + s.tuffo * -1 * 76 : LARG / 2 + s.tuffo * -1 * 30 // il portiere va dal lato sbagliato, tranne se para
      const paraX = LARG / 2 + s.tuffo * 32
      bx = lerp(LARG / 2, s.esito === 'parato' ? paraX : destX, v); by = lerp(ALT - 14, s.esito === 'fuori' ? gy - 8 : gy + 14, v); bs = lerp(4, 2, v)
      if (s.esito === 'gol' && v >= 1) { this.rett(gx + (s.tuffo < 0 ? gw - 30 : 6), gy + 6, 24, 20, 'rgba(255,255,255,.25)') }
    }
    this.rett(bx - bs / 2, by - bs / 2, bs, bs, p.meteo.tipo === 'neve' ? '#ff7a1a' : '#ffffff')
    if (bs >= 3) this.rett(bx - bs / 2 + 1, by - bs / 2 + 1, 1, 1, '#161616')
  }

  // ── il pannello della presentazione (prima della partita) ──
  pannello(p, q) {
    // un cartello scuro con i due stemmi a pixel (le forme semplificate), i nomi, la forza e le ultime cinque
    const y0 = 14
    this.rett(14, y0, LARG - 28, 66, 'rgba(22,22,22,.86)')
    this.rett(14, y0, LARG - 28, 1, '#ffd400')
    const col = (sq, i) => p.maglie[sq].colori[i] ?? p.maglie[sq].colori[0]
    for (const [i, sq] of ['casa', 'ospite'].entries()) {
      const x = i === 0 ? 24 : LARG - 24 - 18
      // lo stemmino: la forma dello stemma col fondo e la sigla
      this.stemmino(p[sq], x, y0 + 8)
      this.testo(p[sq].sigla, x + 9, y0 + 30, '#ffffff', { centro: true })
      // la forza come barra
      this.rett(x - 2, y0 + 38, 22, 3, '#3a3a3a'); this.rett(x - 2, y0 + 38, Math.round((22 * p.forze[sq]) / 100), 3, i === 0 ? col('casa', 0) : col('ospite', 0))
      this.testo(`${p.forze[sq]}`, x + 9, y0 + 43, '#b8b8b8', { centro: true })
      // le ultime cinque: V N P (inventate: non contano)
      for (let j = 0; j < 5; j++) { const u = p.ultime[sq][j]; this.rett(x - 2 + j * 5, y0 + 52, 4, 4, u === 'V' ? '#1a8a3a' : u === 'N' ? '#8a8a8a' : '#b3121f'); this.testo(u, x - 2 + j * 5 + 1, y0 + 52, '#ffffff') }
    }
    this.testo('VS', LARG / 2, y0 + 18, '#ffd400', { centro: true })
    if (q.riga) this.testo(q.riga, LARG / 2, y0 + 30, '#ffffff', { centro: true })
    if (q.riga2) this.testo(q.riga2, LARG / 2, y0 + 40, '#b8b8b8', { centro: true })
    if (q.riga3) this.testo(q.riga3, LARG / 2, y0 + 52, '#b8b8b8', { centro: true })
  }
  stemmino(sq, x, y) {
    const { fondo, tinta, forma } = sq.stemma
    const bordo = fondo === '#ffffff' ? tinta : '#161616'
    if (forma === 'tondo' || forma === 'ovale') { this.rett(x + 3, y, 12, 18, fondo); this.rett(x, y + 3, 18, 12, fondo); this.rett(x + 3, y, 12, 1, bordo); this.rett(x + 3, y + 17, 12, 1, bordo); this.rett(x, y + 3, 1, 12, bordo); this.rett(x + 17, y + 3, 1, 12, bordo) }
    else if (forma === 'rombo') { for (let i = 0; i < 9; i++) { this.rett(x + 9 - i, y + i, 2 * i, 1, fondo); this.rett(x + 9 - i, y + 17 - i, 2 * i, 1, fondo) } }
    else { this.rett(x, y, 18, 11, fondo); for (let i = 0; i < 7; i++) this.rett(x + i, y + 11 + i, 18 - 2 * i, 1, fondo); this.rett(x, y, 18, 1, bordo) }
    this.rett(x + 7, y + 5, 4, 6, tinta); this.rett(x + 5, y + 7, 8, 2, tinta)
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LE SCENE: da (partita, tempo) a cosa c'è in campo. Tutto deterministico.
  // ════════════════════════════════════════════════════════════════════════════

  /** Da che parte attacca una squadra a t secondi (si cambia campo nella ripresa): +1 verso destra. */
  verso(squadra, t) { const destra = squadra === 'casa'; return (destra !== t >= T.via2) ? 1 : -1 }
  portaDi(squadra, t) { return this.verso(squadra, t) > 0 ? CAMPO.x1 : CAMPO.x0 } // la porta che la squadra attacca

  /** La palla del gioco «normale»: tappe ogni 1,3 s pescate dal seme, raccordate con morbidezza. */
  pallaBase(p, t) {
    const passo = 1.3, k = Math.floor(t / passo), u = liscia((t - k * passo) / passo)
    const tappa = (j) => ({ x: 14 + h32(p.indice * 3 + 1, j) * 132, y: 8 + h32(p.indice * 3 + 2, j) * 64 })
    const a = tappa(k), b = tappa(k + 1)
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }
  }
  /** I dieci omini attorno alla palla: il portiere sulla sua linea, i quattro in formazione che seguono la palla. */
  omini(p, t, palla, { fuori = {}, sostituiti = {}, corrono = true } = {}) {
    const out = []
    for (const sq of ['casa', 'ospite']) {
      const v = this.verso(sq, t), f = p.formazioni[sq], maglia = p.maglie[sq]
      const px = v > 0 ? CAMPO.x0 + 5 : CAMPO.x1 - 6 // la propria porta
      out.push({ x: px, y: limita(CAMPO.cy + (palla.y - CAMPO.cy) * 0.4, CAMPO.cy - 10, CAMPO.cy + 10), sq, maglia, portiere: p.portieri[sq], numero: f[0].n, i: 0, fermo: !corrono })
      const base = [[-22, -18], [-22, 18], [-6, -6], [8, 8]] // rispetto al centro della squadra, verso la porta avversaria
      for (let j = 1; j <= 4; j++) {
        if (fuori[sq]?.has?.(j)) continue
        const [bx, by] = base[j - 1]
        const cx = lerp(CAMPO.cx - v * 14, palla.x, 0.55), cy = lerp(CAMPO.cy, palla.y, 0.5)
        const jitter = Math.sin(t * 2.1 + j * 1.7 + (sq === 'casa' ? 0 : 2)) * 2
        const chi = sostituiti[sq]?.[j] ?? f[j]
        out.push({ x: limita(cx + v * bx + jitter, CAMPO.x0 + 3, CAMPO.x1 - 4), y: limita(cy + by + jitter * 0.5, CAMPO.y0 + 4, CAMPO.y1 - 2), sq, maglia, numero: chi.n, i: j + (sq === 'casa' ? 0 : 5), fermo: !corrono })
      }
    }
    return out
  }
  // chi è fuori a t secondi (espulso) e chi è entrato al posto di chi
  statoSquadre(p, t) {
    const fuori = { casa: new Set(), ospite: new Set() }, sostituiti = { casa: {}, ospite: {} }, inPanchina = { casa: 2, ospite: 2 }
    for (const e of p.eventi) {
      if (e.t + (e.dur ?? 1) > t) continue
      if (e.tipo === 'rosso') fuori[e.squadra].add(e.chi.i)
      if (e.tipo === 'infortunio') { sostituiti[e.squadra][e.chi.i] = e.entra; inPanchina[e.squadra] = 1 }
    }
    return { fuori, sostituiti, inPanchina }
  }
  cartelliniA(p, t) {
    const g = { casa: 0, ospite: 0 }, r = { casa: 0, ospite: 0 }
    for (const e of p.eventi) if (e.t <= t) { if (e.tipo === 'giallo') g[e.squadra]++; if (e.tipo === 'rosso') r[e.squadra]++ }
    return { gialli: g, rossi: r }
  }

  /** La scena a t secondi di partita. */
  scenaPartita(p, t) {
    const S = this.statoSquadre(p, t)
    // l'evento in corso: quello il cui [t, t + dur] contiene t
    const e = p.eventi.find((x) => t >= x.t && t < x.t + (x.dur ?? 1) && x.tipo !== 'inizio') ?? (t < 1.2 ? p.eventi[0] : null)
    const base = this.pallaBase(p, t)
    const scena = { cam: { x: lerp(CAMPO.cx, base.x, 0.6), y: lerp(CAMPO.cy, base.y, 0.5), z: 1.35 }, palla: base, omini: [], scritte: [], evento: e ?? null, inPanchina: S.inPanchina, folla: 1 }
    const minu = minuto(t)
    // l'onda del coro ogni tanto
    if (Math.floor(t / 7) % 3 === 0) scena.onda = ((t % 7) / 7) * 220 - 20
    if (!e) {
      // fra un evento e l'altro: si gioca. Vicino al prossimo grande evento la palla si porta dove servirà
      const prossimo = p.eventi.find((x) => x.t > t && x.t - t < 1.1 && ['gol', 'tiro', 'rigore'].includes(x.tipo))
      if (prossimo) { const dest = this.puntoDiAttacco(p, prossimo); const u = liscia(1 - (prossimo.t - t) / 1.1); scena.palla = { x: lerp(base.x, dest.x, u), y: lerp(base.y, dest.y, u) }; scena.cam = { x: lerp(CAMPO.cx, dest.x, 0.7), y: lerp(CAMPO.cy, dest.y, 0.5), z: 1.6 } }
      scena.omini = this.omini(p, t, scena.palla, S)
      return scena
    }
    const u = limita((t - e.t) / (e.dur ?? 1), 0, 1)
    const v = e.squadra ? this.verso(e.squadra, t) : 1
    const porta = e.squadra ? this.portaDi(e.squadra, t) : CAMPO.x1
    const att = e.squadra ? this.puntoDiAttacco(p, e) : base
    switch (e.tipo) {
      case 'inizio': {
        scena.palla = { x: CAMPO.cx, y: CAMPO.cy }
        scena.omini = this.omini(p, t, scena.palla, { ...S, corrono: u > 0.7 })
        scena.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 }
        scena.scritte.push({ t: 'FISCHIO D\'INIZIO', y: 104 })
        break
      }
      case 'gol': {
        // 0–0,3 il tiro, 0,3–0,55 la rete che si gonfia e GOL, 0,55–1 l'esultanza e il replay al rallentatore
        const inPorta = { x: porta + v * 2, y: CAMPO.cy + (h32(p.indice, e.t * 100) - 0.5) * 20 }
        const replay = u > 0.58
        const uu = replay ? limita((u - 0.58) / 0.42, 0, 1) * 0.55 : u // il replay rifà il tiro a metà velocità
        const tiro = limita(uu / 0.3, 0, 1)
        scena.palla = { x: lerp(att.x, inPorta.x, tiro), y: lerp(att.y, inPorta.y, tiro), h: Math.sin(tiro * Math.PI) * 3 }
        scena.omini = this.omini(p, t, replay ? att : { x: att.x, y: att.y }, S)
        // chi ha segnato corre verso la palla e poi esulta (salta)
        const chi = scena.omini.find((o) => o.sq === e.squadra && o.i % 5 === e.chi.i)
        if (chi) { chi.x = lerp(att.x - v * 6, att.x - v * 3, tiro); chi.y = att.y + 1; if (!replay && u > 0.4) { chi.y -= Math.abs(Math.sin(u * 30)) * 2; chi.fermo = false } }
        if (!replay && u > 0.3 && u < 0.5) scena.rete = v
        if (replay && uu > 0.3 && uu < 0.5) scena.rete = v
        scena.cam = replay ? { x: lerp(att.x, inPorta.x, 0.6), y: CAMPO.cy, z: 2.6 } : u < 0.3 ? { x: lerp(att.x, porta, 0.5), y: att.y, z: 2.1 } : { x: att.x, y: att.y, z: 2.4 }
        if (u > 0.28 && u < 0.58) { scena.salto = { squadra: e.squadra, u }; if (Math.floor(u * 12) % 2) scena.scritte.push({ t: 'GOL!', y: 30, fondo: '#b3121f' }); scena.scossa = u < 0.4 ? 1.5 : 0 }
        if (u >= 0.5 && u < 0.58) scena.scritte.push({ t: `${e.chi.nome} ${e.minuto}`, y: 104 })
        if (replay) { scena.scritte.push({ t: 'REPLAY', y: 8, fondo: '#ffd400', col: '#161616' }); scena.lesto = true }
        if (e.rigore && u < 0.3) scena.scritte.push({ t: 'RIGORE', y: 104 })
        break
      }
      case 'rigore': {
        // da dietro la porta: 0–0,3 la palla sul dischetto, 0,3–0,6 la rincorsa, 0,6–0,75 il tiro, poi l'esito
        scena.dietroPorta = true; scena.subito = true; scena.u = u; scena.squadra = e.squadra; scena.esito = e.esito; scena.tuffo = h32(p.indice, e.t * 10) < 0.5 ? -1 : 1
        scena.scritte.push({ t: u < 0.75 ? 'RIGORE' : e.esito === 'parato' ? 'PARATO!' : 'FUORI!', y: 8, fondo: u < 0.75 ? '#161616' : '#1446a0' })
        if (u > 0.75) scena.salto = { squadra: e.squadra === 'casa' ? 'ospite' : 'casa', u }
        break
      }
      case 'tiro': {
        const fin = e.esito === 'fuori' ? { x: porta + v * 7, y: CAMPO.cy + (h32(p.indice, e.t * 100) < 0.5 ? -CAMPO.porta - 7 : CAMPO.porta + 7) } : e.esito === 'palo' ? { x: porta, y: CAMPO.cy + (h32(p.indice, e.t * 100) < 0.5 ? -CAMPO.porta : CAMPO.porta - 1) } : { x: porta - v * 3, y: CAMPO.cy + (h32(p.indice, e.t * 100) - 0.5) * 12 }
        const tiro = limita(u / 0.55, 0, 1)
        scena.palla = { x: lerp(att.x, fin.x, tiro), y: lerp(att.y, fin.y, tiro), h: Math.sin(tiro * Math.PI) * 2 }
        if (e.esito === 'palo' && u > 0.55) { const r = limita((u - 0.55) / 0.45, 0, 1); scena.palla = { x: fin.x - v * r * 14, y: fin.y + (fin.y > CAMPO.cy ? -1 : 1) * r * 6 } }
        scena.omini = this.omini(p, t, att, S)
        if (e.esito === 'parata' && u > 0.4) { const gk = scena.omini.find((o) => o.sq !== e.squadra && o.i === 0); if (gk) { gk.y = fin.y; gk.aTerra = u > 0.6 } }
        scena.cam = { x: lerp(att.x, porta, 0.5), y: lerp(att.y, fin.y, 0.5), z: 2 }
        if (u > 0.5) scena.scritte.push({ t: e.esito === 'fuori' ? 'FUORI' : e.esito === 'palo' ? 'PALO!' : 'PARATA', y: 104, fondo: e.esito === 'palo' ? '#1446a0' : '#161616' })
        break
      }
      case 'rimessa': {
        const y = e.lato === 'alto' ? CAMPO.y0 - 1 : CAMPO.y1
        const x = limita(base.x, 20, 140)
        scena.palla = u < 0.5 ? { x, y } : { x: x + v * (u - 0.5) * 30, y: lerp(y, CAMPO.cy + (e.lato === 'alto' ? -10 : 10), (u - 0.5) * 2), h: Math.sin((u - 0.5) * 2 * Math.PI) * 4 }
        scena.omini = this.omini(p, t, { x, y: CAMPO.cy + (e.lato === 'alto' ? -14 : 14) }, S)
        const chi = scena.omini.find((o) => o.sq === e.squadra && o.i % 5 === 1); if (chi) { chi.x = x - v * 1; chi.y = y + (e.lato === 'alto' ? 1 : 2); chi.fermo = u < 0.5 }
        scena.cam = { x, y: lerp(CAMPO.cy, y, 0.6), z: 1.7 }
        if (u < 0.5) scena.scritte.push({ t: 'RIMESSA', y: 104 })
        break
      }
      case 'fallo':
      case 'scivola': {
        scena.palla = base
        scena.omini = this.omini(p, t, base, S)
        const a = scena.omini.find((o) => o.sq === e.squadra && o.i % 5 === 2), b = scena.omini.find((o) => o.sq !== e.squadra && o.i % 5 === 3)
        if (a) { a.x = base.x - 2; a.y = base.y + 1; a.aTerra = e.tipo === 'scivola' || u > 0.2 }
        if (b && e.tipo === 'fallo') { b.x = base.x + 2; b.y = base.y + 1; b.fermo = true }
        scena.cam = { x: base.x, y: base.y, z: 2 }
        scena.scritte.push({ t: e.tipo === 'fallo' ? 'FALLO' : 'SCIVOLA!', y: 104 })
        break
      }
      case 'giallo':
      case 'rosso': {
        const rosso = e.tipo === 'rosso'
        scena.palla = base
        scena.omini = this.omini(p, t, base, S)
        const chi = scena.omini.find((o) => o.sq === e.squadra && o.i % 5 === e.chi.i)
        if (chi) { chi.fermo = true; chi.x = base.x + 3; chi.y = base.y + 2; if (rosso && u > 0.5) { const w = (u - 0.5) * 2; chi.x = lerp(base.x + 3, CAMPO.cx, w); chi.y = lerp(base.y + 2, CAMPO.y0 - 3, w); chi.fermo = false } }
        scena.arbitro = { x: base.x - 3, y: base.y + 2, maglia: { colori: ['#161616', '#161616'], disegno: 'pieno' }, fermo: true }
        scena.cam = { x: base.x, y: base.y, z: 3 }
        if (u > 0.15 && u < 0.7) scena.cartellino = { x: this.sx(base.x - 3) + 4, y: this.sy(base.y + 2) - 10, rosso }
        scena.scritte.push({ t: rosso ? (e.doppio ? 'DOPPIO GIALLO: ROSSO' : 'ROSSO!') : 'GIALLO', y: 8, fondo: rosso ? '#b3121f' : '#ffd400', col: rosso ? '#ffffff' : '#161616' })
        if (u > 0.3) scena.scritte.push({ t: `${e.chi.n} ${e.chi.nome}`, y: 104 })
        if (rosso && u > 0.6) scena.scritte.push({ t: `${p[e.squadra].sigla} IN QUATTRO`, y: 94 })
        break
      }
      case 'infortunio': {
        scena.palla = base
        scena.omini = this.omini(p, t, base, S)
        const chi = scena.omini.find((o) => o.sq === e.squadra && o.i % 5 === e.chi.i)
        if (chi) { chi.aTerra = true; chi.x = base.x + 2; chi.y = base.y + 2; if (u > 0.45) { const w = liscia((u - 0.45) / 0.5); scena.barella = { x: lerp(base.x + 2, CAMPO.cx + (e.squadra === 'casa' ? -20 : 28), w), y: lerp(base.y + 2, CAMPO.y0 - 2, w), maglia: p.maglie[e.squadra] }; chi.x = -100 } }
        if (u > 0.7) { const w = (u - 0.7) / 0.3; scena.omini.push({ x: lerp(CAMPO.cx + (e.squadra === 'casa' ? -20 : 28), base.x, w), y: lerp(CAMPO.y0 - 2, base.y, w), sq: e.squadra, maglia: p.maglie[e.squadra], numero: e.entra.n, i: 9 }) }
        scena.inPanchina = { ...S.inPanchina, [e.squadra]: u > 0.7 ? 1 : S.inPanchina[e.squadra] }
        scena.cam = { x: base.x, y: base.y, z: u < 0.45 ? 2.6 : 1.6 }
        scena.scritte.push({ t: u < 0.45 ? 'INFORTUNIO' : u < 0.7 ? 'BARELLA' : `ENTRA ${e.entra.n} ${e.entra.nome}`, y: 104 })
        break
      }
      case 'intervallo': {
        const pt = punteggioA(p, t)
        scena.palla = { x: CAMPO.cx, y: CAMPO.cy }
        scena.omini = this.omini(p, t, scena.palla, S).map((o) => ({ ...o, y: lerp(o.y, CAMPO.y0 - 4, liscia(u * 1.4)), x: lerp(o.x, CAMPO.cx + (o.sq === 'casa' ? -24 : 24), liscia(u * 1.4)) }))
        scena.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 }
        scena.scritte.push({ t: 'INTERVALLO', y: 8 }, { t: `${p.casa.sigla} ${pt.casa} - ${pt.ospite} ${p.ospite.sigla}`, y: 104 })
        break
      }
      case 'ripresa': {
        scena.palla = { x: CAMPO.cx, y: CAMPO.cy }
        scena.omini = this.omini(p, t, scena.palla, { ...S, corrono: u > 0.6 })
        scena.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 }
        scena.scritte.push({ t: 'SI RIPRENDE', y: 104 })
        break
      }
      case 'sospesa': {
        scena.palla = base
        scena.omini = this.omini(p, t, base, { ...S, corrono: false })
        scena.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 }
        const causa = e.causa
        if (causa.startsWith('nebbia')) scena.nebbia = limita(0.5 + u * 1.5, 0, 0.95)
        else if (causa.startsWith('blackout')) scena.buio = u < 0.1 ? u * 8 : 0.82
        else if (causa.startsWith('invasione')) scena.nutrie = Array.from({ length: 7 }, (_, i) => ({ x: ((h32(p.indice, 1300 + i) * 200 + t * (14 + i * 3)) % 200) - 20, y: 6 + h32(p.indice, 1400 + i) * 68, dir: 1 }))
        const r = p.risultato
        scena.scritte.push({ t: 'PARTITA SOSPESA', y: 8, fondo: '#b3121f' })
        if (u > 0.08) scena.scritte.push({ t: causa.toUpperCase().slice(0, 44), y: 94, col: '#ffd400' })
        if (u > 0.2) scena.scritte.push({ t: `${r.casa}-${r.ospite} A TAVOLINO`, y: 104 })
        break
      }
      case 'fine': {
        const r = p.risultato
        scena.palla = base
        scena.omini = this.omini(p, t, base, { ...S, corrono: false })
        scena.cam = { x: CAMPO.cx, y: CAMPO.cy, z: 1 }
        if (r.casa !== r.ospite) scena.salto = { squadra: r.casa > r.ospite ? 'casa' : 'ospite', u }
        scena.scritte.push({ t: 'FINALE', y: 8 }, { t: `${p.casa.sigla} ${r.casa} - ${r.ospite} ${p.ospite.sigla}`, y: 104 })
        break
      }
      default: {
        scena.omini = this.omini(p, t, base, S)
      }
    }
    return scena
  }
  puntoDiAttacco(p, e) {
    const v = this.verso(e.squadra, e.t), porta = this.portaDi(e.squadra, e.t)
    return { x: porta - v * (22 + h32(p.indice, e.t * 100 + 1) * 10), y: CAMPO.cy + (h32(p.indice, e.t * 100 + 2) - 0.5) * 40 }
  }

  /** Prima della partita (t negativo: secondi al fischio): il riscaldamento, i tifosi che entrano, la presentazione. */
  scenaAttesa(p, t) {
    const manca = -t // secondi al fischio, 0..240
    const folla = limita(1 - (manca - 20) / 200, 0.15, 1)
    const scena = { cam: { x: CAMPO.cx, y: CAMPO.cy, z: 1 }, omini: [], scritte: [], evento: null, folla, inPanchina: { casa: 2, ospite: 2 } }
    // le due squadre si scaldano nella loro metà: corsette e un pallone a testa che gira
    const palle = []
    for (const [i, sq] of ['casa', 'ospite'].entries()) {
      const v = i === 0 ? 1 : -1, f = p.formazioni[sq], maglia = p.maglie[sq]
      const cx = CAMPO.cx - v * 40
      palle.push({ x: cx + Math.cos(this.t * 1.1 + i) * 14, y: CAMPO.cy + Math.sin(this.t * 1.7 + i) * 10 })
      for (let j = 0; j < 5; j++) {
        const a = this.t * 0.7 + j * 1.26 + i
        scena.omini.push({ x: cx + Math.cos(a) * 16, y: CAMPO.cy + Math.sin(a) * 12, sq, maglia, portiere: j === 0 ? p.portieri[sq] : null, numero: f[j].n, i: j + i * 5 })
      }
    }
    scena.palla = palle[0]; scena.palla2 = palle[1]
    // la presentazione: a rotazione, ogni 12 secondi un cartello diverso (le squadre, il meteo, «quote vere, risultati a caso»)
    const tt = manca, giro = Math.floor(tt / 14) % 3, dentro = tt % 14
    if (dentro < 7) {
      const m = p.meteo
      const meteoTxt = { sereno: 'SERENO', nuvole: 'NUVOLOSO', pioggia: 'PIOGGIA', nebbia: 'NEBBIA', neve: 'NEVE', vento: 'VENTO FORTE' }[m.tipo]
      if (giro === 0) scena.pannello = { riga: `${p.casa.citta.toUpperCase().slice(0, 12)}`, riga2: `${meteoTxt} ${m.temp}°`, riga3: m.notte ? 'IN NOTTURNA' : m.sera ? 'AL TRAMONTO' : 'DI GIORNO' }
      else if (giro === 1) scena.pannello = { riga: 'LE QUOTE COPIANO', riga2: 'LA SERIE A VERA', riga3: 'I RISULTATI NO' }
      else scena.pannello = { riga: `SERIE ${p.casa.serie}${p.casa.serie !== p.ospite.serie ? ' CONTRO ' + p.ospite.serie : ''}`, riga2: 'FORZA E ULTIME 5', riga3: '(INVENTATE)' }
    }
    const mm = Math.floor(manca / 60), ss = Math.floor(manca % 60)
    scena.scritte.push({ t: manca > 0 ? `FISCHIO TRA ${mm}:${String(ss).padStart(2, '0')}` : 'SI COMINCIA', y: 104 })
    return scena
  }
  scenaFinale(p) {
    const r = p.risultato
    const scena = { cam: { x: CAMPO.cx, y: CAMPO.cy, z: 1 }, omini: [], scritte: [{ t: 'FINALE', y: 8 }, { t: `${p.casa.sigla} ${r.casa} - ${r.ospite} ${p.ospite.sigla}${r.tavolino ? ' TAV.' : ''}`, y: 104 }], evento: null, folla: 0.6, palla: { x: CAMPO.cx, y: CAMPO.cy }, inPanchina: { casa: 2, ospite: 2 } }
    scena.omini = this.omini(p, T.fine, scena.palla, { corrono: false })
    return scena
  }
}
