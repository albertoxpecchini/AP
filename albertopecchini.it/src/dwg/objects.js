// Mappa degli oggetti, classi e intestazione comune degli oggetti DWG
// (R2010+: AC1024, AC1027, AC1032). Ogni oggetto sta nella sezione
// AcDb:AcDbObjects; la sezione AcDb:Handles dice a che offset trovarlo a
// partire dal suo handle. Dalla R2007 ogni oggetto ha tre flussi: i dati,
// le stringhe (in coda ai dati, lette all'indietro) e gli handle (in fondo).

import { BitReader, resolveHandle } from './bits.js'

export const TYPES = {
  1: 'TEXT',
  2: 'ATTRIB',
  3: 'ATTDEF',
  4: 'BLOCK',
  5: 'ENDBLK',
  6: 'SEQEND',
  7: 'INSERT',
  8: 'MINSERT',
  10: 'VERTEX_2D',
  11: 'VERTEX_3D',
  12: 'VERTEX_MESH',
  13: 'VERTEX_PFACE',
  14: 'VERTEX_PFACE_FACE',
  15: 'POLYLINE_2D',
  16: 'POLYLINE_3D',
  17: 'ARC',
  18: 'CIRCLE',
  19: 'LINE',
  20: 'DIMENSION_ORDINATE',
  21: 'DIMENSION_LINEAR',
  22: 'DIMENSION_ALIGNED',
  23: 'DIMENSION_ANG3PT',
  24: 'DIMENSION_ANG2LN',
  25: 'DIMENSION_RADIUS',
  26: 'DIMENSION_DIAMETER',
  27: 'POINT',
  28: '3DFACE',
  29: 'POLYLINE_PFACE',
  30: 'POLYLINE_MESH',
  31: 'SOLID',
  32: 'TRACE',
  33: 'SHAPE',
  34: 'VIEWPORT',
  35: 'ELLIPSE',
  36: 'SPLINE',
  37: 'REGION',
  38: '3DSOLID',
  39: 'BODY',
  40: 'RAY',
  41: 'XLINE',
  42: 'DICTIONARY',
  43: 'OLEFRAME',
  44: 'MTEXT',
  45: 'LEADER',
  46: 'TOLERANCE',
  47: 'MLINE',
  48: 'BLOCK_CONTROL',
  49: 'BLOCK_HEADER',
  50: 'LAYER_CONTROL',
  51: 'LAYER',
  52: 'STYLE_CONTROL',
  53: 'STYLE',
  56: 'LTYPE_CONTROL',
  57: 'LTYPE',
  60: 'VIEW_CONTROL',
  61: 'VIEW',
  62: 'UCS_CONTROL',
  63: 'UCS',
  64: 'VPORT_CONTROL',
  65: 'VPORT',
  66: 'APPID_CONTROL',
  67: 'APPID',
  68: 'DIMSTYLE_CONTROL',
  69: 'DIMSTYLE',
  70: 'VX_CONTROL',
  71: 'VX_TABLE_RECORD',
  72: 'GROUP',
  73: 'MLINESTYLE',
  74: 'OLE2FRAME',
  75: 'DUMMY',
  76: 'LONG_TRANSACTION',
  77: 'LWPOLYLINE',
  78: 'HATCH',
  79: 'XRECORD',
  80: 'ACDBPLACEHOLDER',
  81: 'VBA_PROJECT',
  82: 'LAYOUT',
}

/** I tipi che sono entità (disegnabili), non oggetti di servizio. */
export const ENTITY_TYPES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 74, 77, 78])

// ── Mappa degli oggetti (AcDb:Handles) ─────────────────────────────────────

/**
 * @param {Uint8Array} data sezione AcDb:Handles
 * @returns {Map<number, number>} handle → offset nella sezione AcDb:AcDbObjects
 */
export function readObjectMap(data) {
  const r = new BitReader(data)
  const map = new Map()
  while (r.byte + 2 <= data.length) {
    const size = r.RSbe()
    if (size <= 2) break
    const end = r.byte + size - 2
    let handle = 0
    let offset = 0
    while (r.byte < end) {
      handle += r.UMC()
      offset += r.MC()
      map.set(handle, offset)
    }
    r.seek(end * 8)
    r.RS() // CRC della sezione
  }
  return map
}

// ── Classi (AcDb:Classes) ──────────────────────────────────────────────────

/**
 * Le classi definiscono i tipi oltre il 500 (IMAGE, WIPEOUT, MLEADER…).
 * @returns {Map<number, {dxfname: string, cppname: string, appname: string, isEntity: boolean}>}
 */
export function readClasses(data, version) {
  const classes = new Map()
  // 16 byte di sentinella, RL dimensione dei dati, RL (parte alta, 0), poi i
  // dati: RL posizione in bit della fine (da qui), BS numero massimo di
  // classe, RC 0, RC 0, B 1 e le classi; le stringhe stanno in coda come
  // negli oggetti.
  const r = new BitReader(data, 16 * 8)
  const size = r.RL()
  if (version >= 2010) r.RL()
  const origin = r.pos
  const bitsize = version >= 2010 ? r.RL() : 0
  r.BS() // numero massimo di classe
  r.RC()
  r.RC()
  r.B()
  const dataEnd = origin + size * 8
  let str = null
  let limit = dataEnd
  if (version >= 2007 && bitsize) {
    str = stringStream(r, origin, bitsize)
    if (str) limit = str.start
  }
  while (r.pos + 16 < limit) {
    const classnum = r.BS()
    const proxyflag = r.BS()
    const s = str ? str.reader : r
    const appname = version >= 2007 ? s.TU() : s.TV()
    const cppname = version >= 2007 ? s.TU() : s.TV()
    const dxfname = version >= 2007 ? s.TU() : s.TV()
    r.B() // was a zombie
    const itemClass = r.BS()
    if (version >= 2004) {
      r.BL() // istanze
      r.BL() // versione dwg
      r.BL() // versione di manutenzione
      r.BL()
      r.BL()
    }
    if (classnum < 500 || classnum > 32000) break
    classes.set(classnum, { dxfname, cppname, appname, proxyflag, isEntity: itemClass === 0x1f2 })
  }
  return classes
}

/**
 * Trova il flusso delle stringhe R2007+: l'ultimo bit prima del flusso degli
 * handle dice se c'è; i 16 bit prima danno la dimensione (con un secondo RS
 * se il bit alto è acceso); i dati stanno prima ancora.
 * @param {BitReader} r lettore posizionato sull'oggetto
 * @param {number} origin posizione in bit da cui si misura `bitsize`
 * @param {number} bitsize posizione in bit dell'inizio del flusso degli handle
 */
export function stringStream(r, origin, bitsize) {
  const endbit = origin + bitsize - 1
  if (endbit <= origin) return null
  const t = r.clone(endbit)
  if (!t.B()) return null
  t.seek(endbit - 16)
  let size = t.RS()
  let dataEnd = endbit - 16
  if (size & 0x8000) {
    t.seek(endbit - 32)
    const hi = t.RS()
    size = (size & 0x7fff) | (hi << 15)
    dataEnd = endbit - 32
  }
  const start = dataEnd - size
  if (start < origin) return null
  return { start, end: dataEnd, reader: r.clone(start) }
}

// ── Oggetti ────────────────────────────────────────────────────────────────

/**
 * Legge l'intestazione di un oggetto e prepara i tre flussi.
 * @param {Uint8Array} objects sezione AcDb:AcDbObjects
 * @param {number} offset
 * @param {number} version
 */
export function openObject(objects, offset, version) {
  const r = new BitReader(objects, offset * 8)
  // MS dimensione dei dati (senza MS, contatore degli handle e CRC); dalla
  // R2010 segue il contatore in bit del flusso degli handle e il tipo è un
  // BOT (00 = un byte, 01 = un byte + 0x1F0, 10 = due byte).
  const size = r.MS()
  let hdlsize = 0
  if (version >= 2010) hdlsize = r.UMC()
  const origin = r.pos
  const end = origin + size * 8
  if (end > r.end) throw new RangeError('oggetto oltre la fine della sezione')
  r.end = end
  let type
  if (version >= 2010) {
    const code = r.BB()
    type = code === 0 ? r.RC() : code === 1 ? r.RC() + 0x1f0 : r.RS()
  } else type = r.BS()
  const bitsize = size * 8 - hdlsize
  const hdl = r.clone(origin + bitsize)
  hdl.end = end
  const str = version >= 2007 ? stringStream(r, origin, bitsize) : null
  const s = str ? str.reader : r
  if (str) str.reader.end = str.end
  const own = r.H()
  // EED (dati estesi): coppie dimensione + appid + byte, finché la dimensione non è 0
  let eedSize
  while ((eedSize = r.BS()) !== 0) {
    r.H()
    r.seek(r.pos + eedSize * 8)
  }
  return { r, s, hdl, str, type, size, origin, end, bitsize, handle: own.value }
}

/**
 * Dati comuni delle entità (R2010+). Lascia i lettori subito dopo.
 * @param {ReturnType<typeof openObject>} o
 */
export function readEntityCommon(o, version) {
  const { r } = o
  const e = {}
  if (r.B()) {
    // anteprima: dimensione e byte
    const n = version >= 2010 ? r.BLL() : r.RL()
    r.seek(r.pos + n * 8)
  }
  e.entmode = r.BB()
  e.numReactors = r.BL()
  if (version >= 2004) e.xdicMissing = r.B()
  if (version >= 2013) e.hasDsData = r.B()
  if (version < 2004) e.nolinks = r.B()
  e.color = readEntityColor(o, version)
  e.ltypeScale = r.BD()
  e.ltypeFlags = r.BB()
  e.plotstyleFlags = r.BB()
  if (version >= 2007) {
    e.materialFlags = r.BB()
    e.shadowFlags = r.RC()
  }
  if (version >= 2010) {
    e.fullVisual = r.B()
    e.faceVisual = r.B()
    e.edgeVisual = r.B()
  }
  e.invisible = r.BS()
  e.linewt = r.RC()
  return e
}

/** Colore di un'entità (ENC, R2004+): indice più eventuali trasparenza, handle e RGB. */
function readEntityColor(o, version) {
  const { r } = o
  const raw = r.BS()
  if (version < 2004) return { index: raw }
  // bit 0x80: segue il colore RGB (BL, tipo 0xC2 nel byte alto); 0x40: un
  // handle nel flusso degli handle; 0x20: segue la trasparenza (BL)
  const flags = raw >> 8
  const c = { index: raw & 0x1ff }
  if (flags & 0x40) c.hasHandle = true
  if (flags & 0x80) {
    const v = r.BL()
    if (v >>> 24 === 0xc2) c.rgb = v & 0xffffff
    else if (v >>> 24 === 0xc3) c.index = v & 0xff
  }
  if (flags & 0x20) {
    const t = r.BL()
    if (t >>> 24 === 2) c.alpha = (t & 0xff) / 255
  }
  return c
}

/** Colore di un oggetto (CMC, R2004+): indice, RGB, flag; i nomi stanno nel flusso delle stringhe. */
export function readObjectColor(o, version) {
  const { r, s } = o
  const c = { index: r.BS() }
  if (version >= 2004) {
    const v = r.BL()
    c.rgbRaw = v
    if (v >>> 24 === 0xc2) c.rgb = v & 0xffffff
    else if (v >>> 24 === 0xc3) c.index = v & 0xff
    const flag = r.RC()
    if (flag & 1) c.name = s.TU()
    if (flag & 2) c.book = s.TU()
  }
  return c
}

/** Gli handle comuni delle entità, nell'ordine del flusso degli handle. */
export function readEntityHandles(o, e, version) {
  const { hdl } = o
  const H = () => resolveHandle(hdl.H(), o.handle)
  const h = {}
  if (e.entmode === 0) h.owner = H()
  h.reactors = []
  for (let i = 0; i < e.numReactors; i++) h.reactors.push(H())
  if (version < 2004 || !e.xdicMissing) h.xdic = H()
  if (version < 2004 && !e.nolinks) {
    h.prev = H()
    h.next = H()
  }
  h.layer = H()
  if (e.ltypeFlags === 3) h.ltype = H()
  if (version >= 2007 && e.materialFlags === 3) h.material = H()
  if (e.plotstyleFlags === 3) h.plotstyle = H()
  if (version >= 2010) {
    if (e.fullVisual) h.fullVisual = H()
    if (e.faceVisual) h.faceVisual = H()
    if (e.edgeVisual) h.edgeVisual = H()
  }
  if (e.color.hasHandle) h.color = H()
  return h
}

/** Dati comuni degli oggetti non entità (R2010+). */
export function readObjectCommon(o, version) {
  const { r } = o
  const x = {}
  x.numReactors = r.BL()
  if (version >= 2004) x.xdicMissing = r.B()
  if (version >= 2013) x.hasDsData = r.B()
  return x
}

export function readObjectHandles(o, x, version) {
  const { hdl } = o
  const H = () => resolveHandle(hdl.H(), o.handle)
  const h = { owner: H(), reactors: [] }
  for (let i = 0; i < x.numReactors; i++) h.reactors.push(H())
  if (version < 2004 || !x.xdicMissing) h.xdic = H()
  return h
}

/** Campi comuni delle voci di tabella (layer, blocchi, tipi di linea, stili). */
export function readTableEntry(o, version) {
  const { r, s } = o
  const t = { name: version >= 2007 ? s.TU() : s.TV() }
  if (version >= 2007) {
    // un solo BS con i bit 16 (dipende da un xref) e 64 (referenziata da un xref)
    const f = r.BS()
    t.xrefDep = !!(f & 16)
    t.xrefRef = !!(f & 64)
  } else {
    t.xrefRef = r.B()
    t.xrefIndex = r.BS()
    t.xrefDep = r.B()
  }
  return t
}
