// Lettore di bit per il formato DWG. Tutto nel file è impacchettato a bit,
// non a byte: un numero può cominciare a metà di un byte. I tipi sono quelli
// della specifica ODA (Open Design Alliance): B (un bit), BB (due), RC (byte
// grezzo), RS/RL/RD (short, long, double grezzi, little-endian), BS/BL/BD
// (short, long, double «bit-coded»: un prefisso di due bit dice se il valore
// segue per intero, sta in un byte, è 0 oppure 1/256), DD (double con
// predefinito), MC/MS (numeri modulari a 7 o 15 bit), H (handle), TU
// (testo UTF-16 a lunghezza esplicita).

export class BitReader {
  /** @param {Uint8Array} buf @param {number} [bitPos] posizione iniziale in bit */
  constructor(buf, bitPos = 0) {
    this.buf = buf
    this.pos = bitPos
    this.end = buf.length * 8
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    this.scratch = new DataView(new ArrayBuffer(8))
  }

  clone(bitPos = this.pos) {
    const r = new BitReader(this.buf, bitPos)
    r.end = this.end
    return r
  }

  get byte() {
    return this.pos >>> 3
  }

  seek(bitPos) {
    this.pos = bitPos
  }

  align() {
    this.pos = (this.pos + 7) & ~7
  }

  B() {
    const p = this.pos
    if (p >= this.end) throw new RangeError('DWG: lettura oltre la fine')
    this.pos = p + 1
    return (this.buf[p >>> 3] >> (7 - (p & 7))) & 1
  }

  BB() {
    const a = this.B()
    return (a << 1) | this.B()
  }

  /** 3 bit grezzi (lunghezza di un BLL). */
  bits3() {
    return (this.BB() << 1) | this.B()
  }

  RC() {
    const p = this.pos
    if (p + 8 > this.end) throw new RangeError('DWG: lettura oltre la fine')
    this.pos = p + 8
    const i = p >>> 3
    const s = p & 7
    if (s === 0) return this.buf[i]
    return ((this.buf[i] << s) | (this.buf[i + 1] >> (8 - s))) & 0xff
  }

  RS() {
    const a = this.RC()
    return a | (this.RC() << 8)
  }

  /** RS big-endian (usato dalla mappa degli oggetti). */
  RSbe() {
    const a = this.RC()
    return (a << 8) | this.RC()
  }

  RL() {
    const a = this.RS()
    return (a | (this.RS() << 16)) >>> 0
  }

  RLL() {
    const lo = this.RL()
    const hi = this.RL()
    return hi * 4294967296 + lo
  }

  RD() {
    const s = this.scratch
    for (let i = 0; i < 8; i++) s.setUint8(i, this.RC())
    return s.getFloat64(0, true)
  }

  BS() {
    switch (this.BB()) {
      case 0:
        return this.RS()
      case 1:
        return this.RC()
      case 2:
        return 0
      default:
        return 256
    }
  }

  BL() {
    switch (this.BB()) {
      case 0:
        return this.RL()
      case 1:
        return this.RC()
      case 2:
        return 0
      default:
        return 0 // non valido nella specifica
    }
  }

  BLL() {
    const n = this.bits3()
    let v = 0
    for (let i = 0; i < n; i++) v = v * 256 + this.RC()
    return v
  }

  BD() {
    switch (this.BB()) {
      case 0:
        return this.RD()
      case 1:
        return 1
      case 2:
        return 0
      default:
        return 0 // non valido nella specifica
    }
  }

  /** Double con valore predefinito: 00 = predefinito, 01 = 4 byte bassi, 10 = 6 byte, 11 = intero. */
  DD(def) {
    const code = this.BB()
    if (code === 0) return def
    if (code === 3) return this.RD()
    const s = this.scratch
    s.setFloat64(0, def, true)
    if (code === 2) {
      s.setUint8(4, this.RC())
      s.setUint8(5, this.RC())
    }
    s.setUint8(0, this.RC())
    s.setUint8(1, this.RC())
    s.setUint8(2, this.RC())
    s.setUint8(3, this.RC())
    return s.getFloat64(0, true)
  }

  /** Modular char con segno: 7 bit per byte, bit 0x40 dell'ultimo = negativo. */
  MC() {
    let v = 0
    let shift = 0
    for (let i = 0; i < 5; i++) {
      const b = this.RC()
      if (b & 0x80) {
        v += (b & 0x7f) * 2 ** shift
        shift += 7
      } else {
        v += (b & 0x3f) * 2 ** shift
        return b & 0x40 ? -v : v
      }
    }
    return v
  }

  /** Modular char senza segno. */
  UMC() {
    let v = 0
    let shift = 0
    for (let i = 0; i < 5; i++) {
      const b = this.RC()
      v += (b & 0x7f) * 2 ** shift
      if (!(b & 0x80)) return v
      shift += 7
    }
    return v
  }

  /** Modular short: 15 bit per parola. */
  MS() {
    let v = 0
    let shift = 0
    for (let i = 0; i < 3; i++) {
      const w = this.RS()
      v += (w & 0x7fff) * 2 ** shift
      if (!(w & 0x8000)) return v
      shift += 15
    }
    return v
  }

  /** Handle: 4 bit di codice, 4 bit di lunghezza, poi i byte del valore (big-endian). */
  H() {
    const b = this.RC()
    const code = b >> 4
    const n = b & 0x0f
    let v = 0
    for (let i = 0; i < n; i++) v = v * 256 + this.RC()
    return { code, value: v }
  }

  /** Testo Unicode (R2007+): BS lunghezza in caratteri UTF-16, poi i caratteri. */
  TU() {
    const n = this.BS()
    let out = ''
    for (let i = 0; i < n; i++) {
      const c = this.RS()
      if (c === 0) continue
      out += String.fromCharCode(c)
    }
    return out
  }

  /** Testo a 8 bit (fino a R2004): BS lunghezza, poi i byte (codepage, qui letta come Latin-1). */
  TV() {
    const n = this.BS()
    let out = ''
    for (let i = 0; i < n; i++) {
      const c = this.RC()
      if (c === 0) continue
      out += String.fromCharCode(c)
    }
    return out
  }

  /** Estrusione (R2000+): un bit a 1 vale (0, 0, 1), altrimenti tre BD. */
  BE() {
    if (this.B()) return [0, 0, 1]
    return [this.BD(), this.BD(), this.BD()]
  }

  /** Spessore (R2000+): un bit a 1 vale 0, altrimenti un BD. */
  BT() {
    if (this.B()) return 0
    return this.BD()
  }

  P2RD() {
    return [this.RD(), this.RD()]
  }

  P3BD() {
    return [this.BD(), this.BD(), this.BD()]
  }

  P2DD(def) {
    return [this.DD(def[0]), this.DD(def[1])]
  }

  P3DD(def) {
    return [this.DD(def[0]), this.DD(def[1]), this.DD(def[2])]
  }
}

/**
 * Risolve un handle letto dal flusso degli handle rispetto all'handle
 * dell'oggetto che lo contiene: i codici 6, 8, 10 e 12 sono relativi.
 */
export function resolveHandle(h, own) {
  switch (h.code) {
    case 6:
      return own + 1
    case 8:
      return own - 1
    case 10:
      return own + h.value
    case 12:
      return own - h.value
    default:
      return h.value
  }
}
