// L'atlante delle lettere per la scheda grafica. Ogni lettera usata nel disegno
// viene scritta una volta, grande, su un canvas e trasformata in un campo di
// distanze: ogni punto dell'immagine dice quanto dista dal bordo della lettera
// (dentro o fuori). Lo shader ricostruisce il bordo da lì, quindi la stessa
// immagine dà lettere nitide a qualunque ingrandimento e inclinazione, senza
// riscrivere niente quando si zooma.
//
// Gira nel worker (serve OffscreenCanvas). Le distanze si calcolano con la
// trasformata di Felzenszwalb e Huttenlocher, partendo dalla copertura
// sfumata dei bordi per non perdere la precisione sotto il pixel.

export const SDF_EM = 96 // corpo con cui si scrivono le lettere, in pixel
export const SDF_RAD = 12 // fin dove arriva il campo di distanze, in pixel

const ATLAS_W = 2048
const MAX_H = 4096
const INF = 1e20

export const canMakeGlyphs = () => typeof OffscreenCanvas !== 'undefined'

function edt1d(grid, offset, stride, length, f, v, z) {
  v[0] = 0
  z[0] = -INF
  z[1] = INF
  f[0] = grid[offset]
  for (let q = 1, k = 0, s = 0; q < length; q++) {
    f[q] = grid[offset + q * stride]
    const q2 = q * q
    do {
      const r = v[k]
      s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2
    } while (s <= z[k] && --k > -1)
    k++
    v[k] = q
    z[k] = s
    z[k + 1] = INF
  }
  for (let q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) k++
    const r = v[k]
    const qr = q - r
    grid[offset + q * stride] = f[r] + qr * qr
  }
}

function edt(data, x0, y0, width, height, gridSize, f, v, z) {
  for (let x = x0; x < x0 + width; x++) edt1d(data, y0 * gridSize + x, gridSize, height, f, v, z)
  for (let y = y0; y < y0 + height; y++) edt1d(data, y * gridSize + x0, 1, width, f, v, z)
}

export class GlyphAtlas {
  constructor() {
    this.w = ATLAS_W
    this.h = 256
    this.data = new Uint8Array(this.w * this.h)
    this.x = 0
    this.y = 0
    this.rowH = 0
    this.count = 0
    this.glyphs = new Map()
    this.prefixes = new Map()
    const side = SDF_EM * 3
    this.canvas = new OffscreenCanvas(side, side)
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })
    this.ctx.textBaseline = 'alphabetic'
    this.ctx.fillStyle = '#000'
    this.font = ''
    const n = side + SDF_RAD * 2
    this.outer = new Float64Array(n * n)
    this.inner = new Float64Array(n * n)
    this.f = new Float64Array(n)
    this.z = new Float64Array(n + 1)
    this.v = new Uint16Array(n)
  }

  setFont(family, bold, italic) {
    const font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${SDF_EM}px ${family}`
    if (font !== this.font) this.ctx.font = this.font = font
    return font
  }

  /** Dove comincia ogni lettera di `text` lungo la riga, in em (con il kerning del carattere). */
  advances(text, family, bold, italic) {
    const font = this.setFont(family, bold, italic)
    const key = `${font}|${text}`
    let adv = this.prefixes.get(key)
    if (adv) return adv
    const chars = Array.from(text)
    adv = new Float32Array(chars.length)
    let prefix = ''
    for (let i = 0; i < chars.length; i++) {
      adv[i] = prefix ? this.ctx.measureText(prefix).width / SDF_EM : 0
      prefix += chars[i]
    }
    if (this.prefixes.size > 20000) this.prefixes.clear()
    this.prefixes.set(key, adv)
    return adv
  }

  /**
   * La lettera nell'atlante: il suo riquadro in texel (u0, v0, u1, v1) e sul
   * foglio in em (x0, y0, x1, y1, con la y verso l'alto dalla linea di base).
   * `null` per gli spazi e per ciò che non lascia segno.
   */
  glyph(ch, family, bold, italic) {
    const font = this.setFont(family, bold, italic)
    const key = `${font}|${ch}`
    let g = this.glyphs.get(key)
    if (g !== undefined) return g
    g = this.make(ch)
    this.glyphs.set(key, g)
    return g
  }

  make(ch) {
    const { ctx, canvas } = this
    const m = ctx.measureText(ch)
    const left = Math.ceil(m.actualBoundingBoxLeft) + 1
    const right = Math.ceil(m.actualBoundingBoxRight) + 1
    const up = Math.ceil(m.actualBoundingBoxAscent) + 1
    const down = Math.ceil(m.actualBoundingBoxDescent) + 1
    const gw = left + right
    const gh = up + down
    if (!(gw > 2 && gh > 2) || gw > canvas.width || gh > canvas.height) return null
    ctx.clearRect(0, 0, gw, gh)
    ctx.fillText(ch, left, up)
    const img = ctx.getImageData(0, 0, gw, gh).data

    const pad = SDF_RAD
    const cw = gw + pad * 2
    const chh = gh + pad * 2
    const len = cw * chh
    const { outer, inner } = this
    outer.fill(INF, 0, len)
    inner.fill(0, 0, len)
    let ink = false
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const a = img[(y * gw + x) * 4 + 3] / 255
        if (a === 0) continue
        ink = true
        const j = (y + pad) * cw + x + pad
        if (a === 1) {
          outer[j] = 0
          inner[j] = INF
        } else {
          const d = 0.5 - a
          outer[j] = d > 0 ? d * d : 0
          inner[j] = d < 0 ? d * d : 0
        }
      }
    }
    if (!ink) return null
    edt(outer, 0, 0, cw, chh, cw, this.f, this.v, this.z)
    edt(inner, pad, pad, gw, gh, cw, this.f, this.v, this.z)

    // posto nell'atlante: righe di celle, una dopo l'altra
    if (this.x + cw > this.w) {
      this.x = 0
      this.y += this.rowH
      this.rowH = 0
    }
    if (this.y + chh > this.h) {
      let h = this.h
      while (this.y + chh > h) h *= 2
      if (h > MAX_H) return null
      const data = new Uint8Array(this.w * h)
      data.set(this.data)
      this.data = data
      this.h = h
    }
    const { data, w } = this
    for (let y = 0; y < chh; y++) {
      for (let x = 0; x < cw; x++) {
        const d = Math.sqrt(outer[y * cw + x]) - Math.sqrt(inner[y * cw + x])
        data[(this.y + y) * w + this.x + x] = Math.max(0, Math.min(255, Math.round(255 * (0.5 - d / (2 * SDF_RAD)))))
      }
    }
    const g = {
      u0: this.x,
      v0: this.y,
      u1: this.x + cw,
      v1: this.y + chh,
      x0: -(left + pad) / SDF_EM,
      y0: -(down + pad) / SDF_EM,
      x1: (right + pad) / SDF_EM,
      y1: (up + pad) / SDF_EM,
    }
    this.x += cw
    if (chh > this.rowH) this.rowH = chh
    this.count++
    return g
  }

  /** L'immagine dell'atlante (un byte per punto), tagliata all'altezza usata. */
  done() {
    if (!this.count) return null
    const h = Math.min(this.h, this.y + this.rowH)
    return { data: this.data.slice(0, this.w * h), w: this.w, h }
  }
}
