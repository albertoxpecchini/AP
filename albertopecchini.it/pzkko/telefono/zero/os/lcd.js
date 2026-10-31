// L'lcd di pzk os (29.10): 256 × 128 pixel a un bit (acceso = inchiostro scuro, spento = l'arancione della
// retroilluminazione), il doppio del Flipper (128 × 64), a 8 bit come lui. Qui c'è il disegno nel buffer (pixel, righe,
// riquadri, testo col carattere di font.js, bitmap delle icone, l'inversione, il ritaglio) e la tela che ne viene fuori:
// 768 × 384, tre texel per pixel con un filo di griglia, la stessa tela che zero.js stende sotto il vetro del 3D e che
// muro.js ricopia sul tasto del muro. La retroilluminazione (luce 0–1) cambia la tavolozza: spenta, lo schermo resta
// leggibile ma scuro, come un lcd vero senza luce.
import { glifo, PASSO, ALTEZZA } from './font.js'

export const W = 256, H = 128
const K = 3 // texel per pixel
// la tavolozza, misurata sulle foto del Flipper vero: arancione caldo, inchiostro quasi nero; spenta, bruna
const ACCESO = { fondo: [247, 161, 58], aria: [238, 151, 50], inchiostro: [34, 20, 8] }
const SPENTO = { fondo: [98, 68, 40], aria: [92, 63, 37], inchiostro: [28, 18, 8] }
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t))

export class Lcd {
  constructor() {
    this.fb = new Uint8Array(W * H)
    this.canvas = document.createElement('canvas')
    this.canvas.width = W * K; this.canvas.height = H * K
    this.ctx = this.canvas.getContext('2d', { alpha: false })
    this.img = this.ctx.createImageData(W * K, H * K)
    this.luce = 1
    this.massima = 1 // la luminosità delle impostazioni: la luce vera è luce × massima
    this.sporco = true
    this.clip = null // [x0, y0, x1, y1] esclusi
    this.ascolti = new Set()
  }
  /** Chiama fn ogni volta che la tela cambia (dopo disegna()). */
  ascolta(fn) { this.ascolti.add(fn); return () => this.ascolti.delete(fn) }

  // ── il buffer ──
  pulisci(v = 0) { this.fb.fill(v); this.sporco = true }
  px(x, y, v = 1) {
    x |= 0; y |= 0
    if (x < 0 || y < 0 || x >= W || y >= H) return
    if (this.clip && (x < this.clip[0] || y < this.clip[1] || x >= this.clip[2] || y >= this.clip[3])) return
    this.fb[y * W + x] = v
    this.sporco = true
  }
  riempi(x, y, w, h, v = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, v) }
  riquadro(x, y, w, h, v = 1) { this.orizz(x, y, w, v); this.orizz(x, y + h - 1, w, v); this.vert(x, y, h, v); this.vert(x + w - 1, y, h, v) }
  /** Un riquadro con gli angoli smussati (come i dialoghi del Flipper). */
  cornice(x, y, w, h, v = 1) {
    this.orizz(x + 1, y, w - 2, v); this.orizz(x + 1, y + h - 1, w - 2, v); this.vert(x, y + 1, h - 2, v); this.vert(x + w - 1, y + 1, h - 2, v)
  }
  orizz(x, y, w, v = 1) { for (let i = 0; i < w; i++) this.px(x + i, y, v) }
  vert(x, y, h, v = 1) { for (let j = 0; j < h; j++) this.px(x, y + j, v) }
  inverti(x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = x + i, Y = y + j
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue
      if (this.clip && (X < this.clip[0] || Y < this.clip[1] || X >= this.clip[2] || Y >= this.clip[3])) continue
      this.fb[Y * W + X] ^= 1
    }
    this.sporco = true
  }
  /** Il ritaglio: fuori dal rettangolo non si disegna. ritaglia(null) lo toglie. */
  ritaglia(r) { this.clip = r ? [r[0], r[1], r[0] + r[2], r[1] + r[3]] : null }

  // ── il testo ──
  /** Scrive s da (x, y) in alto a sinistra; scala 2 raddoppia; inv scrive spento su acceso. → la larghezza in pixel. */
  testo(x, y, s, { scala = 1, inv = false } = {}) {
    let cx = x
    for (const ch of String(s)) {
      const g = glifo(ch)
      for (let r = 0; r < ALTEZZA; r++) for (let c = 0; c < 5; c++) {
        if (g[r][c] !== '#') continue
        if (scala === 1) this.px(cx + c, y + r, inv ? 0 : 1)
        else this.riempi(cx + c * scala, y + r * scala, scala, scala, inv ? 0 : 1)
      }
      cx += PASSO * scala
    }
    return cx - x - (scala)
  }
  static larghezza(s, scala = 1) { return Math.max(0, [...String(s)].length * PASSO * scala - scala) }
  /** Spezza s in righe di al più n caratteri, sulle parole (le parole più lunghe si tagliano). */
  static acapo(s, n) {
    n = Math.max(1, Math.floor(n)) // (n ≤ 0, da uno spazio stretto: il while qui sotto non finiva più)
    const out = []
    for (const par of String(s).split('\n')) {
      let riga = ''
      for (const parola of par.split(/\s+/).filter(Boolean)) {
        let p = parola
        while (p.length > n) { if (riga) { out.push(riga); riga = '' } out.push(p.slice(0, n)); p = p.slice(n) }
        if (!riga) riga = p
        else if (riga.length + 1 + p.length <= n) riga += ' ' + p
        else { out.push(riga); riga = p }
      }
      out.push(riga)
    }
    return out
  }

  // ── le bitmap (le icone, icone.js): { w, h, bit: Uint8Array w × h } ──
  bitmap(b, x, y, { inv = false } = {}) {
    if (!b) return
    for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.bit[j * b.w + i]) this.px(x + i, y + j, inv ? 0 : 1)
  }

  // ── la tela ──
  /** Ridisegna la tela se qualcosa è cambiato (il buffer o la luce). → true se l'ha ridisegnata */
  disegna() {
    if (!this.sporco) return false
    this.sporco = false
    const lu = this.luce * this.massima
    const p = { fondo: mix(SPENTO.fondo, ACCESO.fondo, lu), aria: mix(SPENTO.aria, ACCESO.aria, lu), inchiostro: mix(SPENTO.inchiostro, ACCESO.inchiostro, lu) }
    const d = this.img.data, LW = W * K
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const on = this.fb[y * W + x]
      for (let sy = 0; sy < K; sy++) {
        let o = ((y * K + sy) * LW + x * K) * 4
        for (let sx = 0; sx < K; sx++) {
          const bordo = sx === K - 1 || sy === K - 1
          const c = on ? p.inchiostro : bordo ? p.aria : p.fondo
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255
          o += 4
        }
      }
    }
    this.ctx.putImageData(this.img, 0, 0)
    for (const f of this.ascolti) f()
    return true
  }
  /** La retroilluminazione (0–1). */
  accendi(v) { v = Math.max(0, Math.min(1, v)); if (v !== this.luce) { this.luce = v; this.sporco = true } }
  /** La luminosità massima (le impostazioni, 0.3–1). */
  regola(v) { v = Math.max(0.2, Math.min(1, v)); if (v !== this.massima) { this.massima = v; this.sporco = true } }
}
