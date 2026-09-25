// Struttura del file DWG dalla versione R2004 in poi (AC1018, AC1024,
// AC1027, AC1032: AutoCAD 2004, 2010, 2013, 2018). Il file è diviso in
// pagine: una mappa delle pagine dice dove stanno, una mappa delle sezioni
// dice quali pagine compongono ogni sezione (AcDb:Header, AcDb:Classes,
// AcDb:Handles, AcDb:AcDbObjects…). Le pagine sono compresse con una
// variante di LZ77; l'intestazione del file (a 0x80) e quelle delle pagine
// dati sono offuscate con uno XOR.

const VERSIONS = { AC1015: 2000, AC1018: 2004, AC1021: 2007, AC1024: 2010, AC1027: 2013, AC1032: 2018 }

export class DwgFormatError extends Error {}

/** Legge la firma e restituisce l'anno della versione (2000, 2004, 2007, 2010, 2013, 2018). */
export function readVersion(buf) {
  const sig = String.fromCharCode(...buf.subarray(0, 6))
  const v = VERSIONS[sig]
  if (!v) throw new DwgFormatError(`Non è un DWG che conosco (firma «${sig.replace(/[^\x20-\x7e]/g, '?')}»)`)
  return v
}

const u32 = (buf, off) => (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0
const u64 = (buf, off) => u32(buf, off + 4) * 4294967296 + u32(buf, off)

/** L'intestazione a 0x80: 0x6C byte XOR-ati con una sequenza pseudocasuale. */
function decryptHeader(buf) {
  const out = new Uint8Array(0x6c)
  let seed = 1
  for (let i = 0; i < 0x6c; i++) {
    seed = (Math.imul(seed, 0x343fd) + 0x269ec3) >>> 0
    out[i] = buf[0x80 + i] ^ ((seed >>> 16) & 0xff)
  }
  const magic = String.fromCharCode(...out.subarray(0, 11))
  if (magic !== 'AcFssFcAJMB') throw new DwgFormatError('Intestazione del file non riconosciuta')
  return {
    rootTreeNodeGap: u32(out, 0x18),
    lastPageId: u32(out, 0x28),
    lastPageEnd: u64(out, 0x2c),
    secondHeaderAddr: u64(out, 0x34),
    gapAmount: u32(out, 0x3c),
    pageAmount: u32(out, 0x40),
    pageMapId: u32(out, 0x50),
    pageMapAddr: u64(out, 0x54) + 0x100,
    sectionMapId: u32(out, 0x5c),
    pageArraySize: u32(out, 0x60),
    gapArraySize: u32(out, 0x64),
  }
}

// ── Decompressione LZ77 (specifica ODA 4.7) ────────────────────────────────

function literalLength(src, st) {
  let b = src[st.i++]
  if (b >= 0x01 && b <= 0x0f) return { lit: b + 3, op: 0 }
  if (b === 0) {
    let total = 0x0f
    while ((b = src[st.i++]) === 0 && st.i < src.length) total += 0xff
    return { lit: total + b + 3, op: 0 }
  }
  return { lit: 0, op: b }
}

function longOffset(src, st) {
  let b = src[st.i++]
  let total = 0
  if (b === 0) {
    total = 0xff
    while ((b = src[st.i++]) === 0 && st.i < src.length) total += 0xff
  }
  return total + b
}

function twoByteOffset(src, st) {
  const a = src[st.i++]
  const b = src[st.i++]
  return { off: (a >> 2) | (b << 6), lit: a & 0x03 }
}

/**
 * @param {Uint8Array} src dati compressi
 * @param {number} outSize dimensione attesa in uscita
 */
export function decompress(src, outSize) {
  const dst = new Uint8Array(outSize)
  const st = { i: 0 }
  let d = 0
  let { lit, op } = literalLength(src, st)
  for (let k = 0; k < lit && d < outSize; k++) dst[d++] = src[st.i++]

  while (st.i < src.length && d < outSize) {
    if (op === 0) op = src[st.i++]
    let n
    let off
    if (op >= 0x40) {
      n = ((op & 0xf0) >> 4) - 1
      const op2 = src[st.i++]
      off = (op2 << 2) | ((op & 0x0c) >> 2)
      if (op & 0x03) {
        lit = op & 0x03
        op = 0
      } else ({ lit, op } = literalLength(src, st))
    } else if (op >= 0x21 && op <= 0x3f) {
      n = op - 0x1e
      ;({ off, lit } = twoByteOffset(src, st))
      if (lit) op = 0
      else ({ lit, op } = literalLength(src, st))
    } else if (op === 0x20) {
      n = longOffset(src, st) + 0x21
      ;({ off, lit } = twoByteOffset(src, st))
      if (lit) op = 0
      else ({ lit, op } = literalLength(src, st))
    } else if (op >= 0x12 && op <= 0x1f) {
      n = (op & 0x0f) + 2
      ;({ off, lit } = twoByteOffset(src, st))
      off += 0x3fff
      if (lit) op = 0
      else ({ lit, op } = literalLength(src, st))
    } else if (op === 0x10) {
      n = longOffset(src, st) + 9
      ;({ off, lit } = twoByteOffset(src, st))
      off += 0x3fff
      if (lit) op = 0
      else ({ lit, op } = literalLength(src, st))
    } else if (op === 0x11) {
      break
    } else {
      throw new DwgFormatError(`Dati compressi non validi (opcode 0x${op.toString(16)})`)
    }
    let s = d - (off + 1)
    if (s < 0) throw new DwgFormatError('Dati compressi non validi (riferimento all’indietro)')
    for (let k = 0; k < n && d < outSize; k++) dst[d++] = dst[s++]
    for (let k = 0; k < lit && d < outSize; k++) dst[d++] = src[st.i++]
  }
  return dst
}

// ── Pagine di sistema e pagine dati ────────────────────────────────────────

const PAGE_MAP_TYPE = 0x41630e3b
const SECTION_MAP_TYPE = 0x4163003b
const DATA_PAGE_TYPE = 0x4163043b

/** Una pagina di sistema: 20 byte di intestazione in chiaro, poi dati compressi. */
function readSystemPage(buf, addr, expectType) {
  const type = u32(buf, addr)
  if (type !== expectType) throw new DwgFormatError(`Pagina di sistema non valida a 0x${addr.toString(16)}`)
  const decompSize = u32(buf, addr + 4)
  const compSize = u32(buf, addr + 8)
  const compType = u32(buf, addr + 12)
  const data = buf.subarray(addr + 20, addr + 20 + compSize)
  return compType === 2 ? decompress(data, decompSize) : data.slice(0, decompSize)
}

/** Mappa delle pagine: coppie (numero, dimensione), i numeri negativi sono vuoti. */
function readPageMap(buf, hdr) {
  const data = readSystemPage(buf, hdr.pageMapAddr, PAGE_MAP_TYPE)
  const pages = new Map()
  let addr = 0x100
  for (let i = 0; i + 8 <= data.length; ) {
    const num = u32(data, i) | 0
    const size = u32(data, i + 4)
    i += 8
    if (num < 0) {
      i += 16 // parent, left, right, 0
    } else pages.set(num, { addr, size })
    addr += size
  }
  return pages
}

/** Mappa delle sezioni: per ogni sezione nome, dimensione e le pagine che la compongono. */
function readSectionMap(buf, hdr, pages) {
  const page = pages.get(hdr.sectionMapId)
  if (!page) throw new DwgFormatError('Mappa delle sezioni assente')
  const data = readSystemPage(buf, page.addr, SECTION_MAP_TYPE)
  const count = u32(data, 0)
  const sections = new Map()
  let i = 20
  for (let s = 0; s < count && i + 96 <= data.length; s++) {
    const size = u64(data, i)
    const pageCount = u32(data, i + 8)
    const maxDecomp = u32(data, i + 12)
    const compressed = u32(data, i + 20)
    const id = u32(data, i + 24)
    const encrypted = u32(data, i + 28)
    let name = ''
    for (let k = 0; k < 64; k++) {
      const c = data[i + 32 + k]
      if (!c) break
      name += String.fromCharCode(c)
    }
    i += 96
    const list = []
    for (let p = 0; p < pageCount; p++) {
      list.push({ num: u32(data, i), size: u32(data, i + 4), offset: u64(data, i + 8) })
      i += 16
    }
    sections.set(name, { name, size, maxDecomp, compressed, id, encrypted, pages: list })
  }
  return sections
}

/** Ricompone una sezione dalle sue pagine dati (intestazione di 32 byte XOR-ata con 0x4164536b ^ indirizzo). */
function readSection(buf, pages, sec) {
  const out = new Uint8Array(sec.size)
  for (const p of sec.pages) {
    const page = pages.get(p.num)
    if (!page) continue
    const a = page.addr
    const mask = (0x4164536b ^ a) >>> 0
    const h = []
    for (let k = 0; k < 8; k++) h.push((u32(buf, a + k * 4) ^ mask) >>> 0)
    const [type, , dataSize, pageSize, start] = h
    if (type !== DATA_PAGE_TYPE) throw new DwgFormatError(`Pagina dati non valida (${sec.name})`)
    const data = buf.subarray(a + 32, a + 32 + dataSize)
    const want = Math.min(sec.maxDecomp, sec.size - start)
    if (want <= 0) continue
    const chunk = sec.compressed === 2 ? decompress(data, want) : data.subarray(0, want)
    out.set(chunk.subarray(0, want), start)
  }
  return out
}

/**
 * Apre un DWG R2004+ e restituisce le sezioni decompresse che servono.
 * @param {Uint8Array} buf
 */
export function openR2004(buf) {
  const version = readVersion(buf)
  if (version < 2004) throw new DwgFormatError('I DWG fino ad AutoCAD 2000 non sono supportati')
  if (version === 2007) throw new DwgFormatError('I DWG di AutoCAD 2007 (AC1021) non sono supportati')
  const hdr = decryptHeader(buf)
  const pages = readPageMap(buf, hdr)
  const sections = readSectionMap(buf, hdr, pages)
  const section = (name) => {
    const sec = sections.get(name)
    if (!sec) throw new DwgFormatError(`Sezione ${name} assente`)
    return readSection(buf, pages, sec)
  }
  return {
    version,
    codepage: buf[0x13] | (buf[0x14] << 8),
    maintenance: buf[0x0b],
    sectionNames: [...sections.keys()],
    section,
  }
}
