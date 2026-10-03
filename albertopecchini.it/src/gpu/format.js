// Il formato dei dati che il worker prepara e la scheda grafica disegna
// (src/client/gl-sheet.js). Tre elenchi, ognuno un blocco di byte con le voci
// una dopo l'altra, già pronto da caricare in un buffer WebGL:
//
//   TRATTI (40 byte): un segmento o un pezzo d'arco, disegnato come un rettangolo
//     dentro cui lo shader calcola la distanza dalla linea (bordi sfumati esatti)
//       f32 x0, y0, x1, y1    estremi
//       f32 bulge             tan(ampiezza / 4), come nelle polilinee DWG; 0 = dritto
//       f32 dist0             lunghezza del tracciato prima del pezzo (per i tratteggi)
//       f32 lwMm, lwWorld     spessore in mm di carta oppure in unità del disegno
//       u8  r, g, b, a
//       u8  riga del tipo di linea (0 = continua), flag
//       u16 ordine di disegno
//   TRIANGOLI (16 byte per vertice): i riempimenti, già tassellati
//       f32 x, y · u8 r, g, b, a · u16 ordine · 2 byte liberi
//   GLIFI (52 byte): una lettera dell'atlante (src/gpu/sdf.js) o un rettangolo pieno
//       f32 ox, oy            origine della riga di testo
//       f32 ax, ay, bx, by    quanto vale 1 em lungo la riga e in altezza
//       f32 x0, y0, x1, y1    il riquadro della lettera, in em
//       u16 u0, v0, u1, v1    il riquadro nell'atlante, in texel (65535 = pieno)
//       u8  r, g, b, a
//
// Le coordinate sono relative a `origin`: tolta in doppia precisione prima di
// passare ai float a 32 bit, così un disegno lontano dallo zero resta fermo
// anche al massimo ingrandimento.

export const SEG_STRIDE = 40
export const TRI_STRIDE = 16
export const GLYPH_STRIDE = 52

export const FLAG_BUTT0 = 1 // estremità iniziale tagliata dritta (non tonda)
export const FLAG_BUTT1 = 2 // estremità finale tagliata dritta
export const FLAG_DOT = 4 // un punto: diametro minimo 2,4 px

export const DASH_W = 34 // una riga per tipo di linea: periodo, n, poi tratto/spazio…
export const SOLID_UV = 65535

/** Un blocco di voci a misura fissa che cresce da solo. */
export class Buf {
  constructor(stride, capacity = 4096) {
    this.stride = stride
    this.n = 0
    this.cap = 0
    this.grow(capacity)
  }

  grow(capacity) {
    const buf = new ArrayBuffer(capacity * this.stride)
    if (this.u8) new Uint8Array(buf).set(this.u8.subarray(0, this.n * this.stride))
    this.buf = buf
    this.f32 = new Float32Array(buf)
    this.u8 = new Uint8Array(buf)
    this.u16 = new Uint16Array(buf)
    this.cap = capacity
  }

  /** Posto per una voce nuova: restituisce il suo indice. */
  next() {
    if (this.n === this.cap) this.grow(this.cap * 2)
    return this.n++
  }

  done() {
    return this.buf.slice(0, this.n * this.stride)
  }
}

/** Scrittori delle tre voci su tre `Buf`; l'origine è già tolta da chi chiama. */
export function writers(segs, tris, glyphs) {
  return {
    seg(x0, y0, x1, y1, bulge, dist0, lwMm, lwWorld, r, g, b, a, row, flags, order) {
      const i = segs.next()
      const f = segs.f32
      const k = i * 10
      f[k] = x0
      f[k + 1] = y0
      f[k + 2] = x1
      f[k + 3] = y1
      f[k + 4] = bulge
      f[k + 5] = dist0
      f[k + 6] = lwMm
      f[k + 7] = lwWorld
      const u = segs.u8
      const o = i * SEG_STRIDE + 32
      u[o] = r
      u[o + 1] = g
      u[o + 2] = b
      u[o + 3] = a
      u[o + 4] = row
      u[o + 5] = flags
      segs.u16[i * 20 + 19] = order
    },
    vert(x, y, r, g, b, a, order) {
      const i = tris.next()
      tris.f32[i * 4] = x
      tris.f32[i * 4 + 1] = y
      const u = tris.u8
      const o = i * TRI_STRIDE + 8
      u[o] = r
      u[o + 1] = g
      u[o + 2] = b
      u[o + 3] = a
      tris.u16[i * 8 + 6] = order
    },
    glyph(ox, oy, ax, ay, bx, by, x0, y0, x1, y1, u0, v0, u1, v1, r, g, b, a) {
      const i = glyphs.next()
      const f = glyphs.f32
      const k = i * 13
      f[k] = ox
      f[k + 1] = oy
      f[k + 2] = ax
      f[k + 3] = ay
      f[k + 4] = bx
      f[k + 5] = by
      f[k + 6] = x0
      f[k + 7] = y0
      f[k + 8] = x1
      f[k + 9] = y1
      const s = glyphs.u16
      const j = i * 26 + 20
      s[j] = u0
      s[j + 1] = v0
      s[j + 2] = u1
      s[j + 3] = v1
      const u = glyphs.u8
      const o = i * GLYPH_STRIDE + 48
      u[o] = r
      u[o + 1] = g
      u[o + 2] = b
      u[o + 3] = a
    },
  }
}

/** I tipi di linea come tabella: ogni sequenza tratto/spazio una riga sola. */
export class DashTable {
  constructor() {
    this.rows = [null] // la riga 0 è la linea continua
    this.index = new Map()
  }

  /** @param {number[]|null} dash coppie tratto/spazio in unità del disegno */
  row(dash) {
    if (!dash || dash.length < 2) return 0
    const list = dash.slice(0, DASH_W - 2)
    const key = list.join(',')
    let i = this.index.get(key)
    if (i == null) {
      if (this.rows.length > 255) return 0
      i = this.rows.length
      this.rows.push(list)
      this.index.set(key, i)
    }
    return i
  }

  done() {
    const data = new Float32Array(DASH_W * this.rows.length)
    this.rows.forEach((list, i) => {
      if (!list) return
      const o = i * DASH_W
      data[o] = list.reduce((s, v) => s + v, 0)
      data[o + 1] = list.length
      data.set(list, o + 2)
    })
    return { data, rows: this.rows.length }
  }
}
