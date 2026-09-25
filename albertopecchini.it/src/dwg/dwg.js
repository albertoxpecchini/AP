// Lettura completa di un DWG: apre il file, indicizza gli oggetti, legge
// tabelle (layer, tipi di linea, stili, blocchi) ed entità dello spazio
// modello e dei blocchi. Restituisce un modello semplice, pronto per il
// disegno, senza toccare il file: il DWG resta DWG.

import { openR2004 } from './file.js'
import { readObjectMap, readClasses, openObject, TYPES, ENTITY_TYPES, readEntityCommon, readEntityHandles, readObjectCommon, readObjectHandles } from './objects.js'
import { PARSERS, blockHeaderHandles, blockControlHandles } from './entities.js'
import { readHeaderVars } from './header.js'

/** Tipi di classe (oltre il 500) che sappiamo leggere, per nome DXF. */
const CLASS_ENTITIES = new Set(['IMAGE', 'WIPEOUT'])

/**
 * @param {Uint8Array} buf il file
 * @param {{ debug?: object, onProgress?: (done: number, total: number) => void }} [options]
 */
export function parseDwg(buf, options = {}) {
  const file = openR2004(buf)
  const v = file.version
  const classes = readClasses(file.section('AcDb:Classes'), v)
  const map = readObjectMap(file.section('AcDb:Handles'))
  const objects = file.section('AcDb:AcDbObjects')
  const header = readHeaderVars(file.section('AcDb:Header'), v)
  const debug = options.debug

  const typeName = (type) => TYPES[type] || classes.get(type)?.dxfname || `T${type}`
  const isEntity = (type) => ENTITY_TYPES.has(type) || (type >= 500 && !!classes.get(type)?.isEntity)

  // ── Indice: handle → offset e tipo ──────────────────────────────────────
  const index = new Map()
  const byType = new Map()
  for (const [handle, offset] of map) {
    try {
      const o = openObject(objects, offset, v)
      if (o.handle !== handle) continue
      const name = typeName(o.type)
      index.set(handle, { offset, type: o.type, name })
      let list = byType.get(name)
      if (!list) byType.set(name, (list = []))
      list.push(handle)
    } catch {
      // oggetto illeggibile: si salta
    }
  }

  const note = (kind, o, err) => {
    if (!debug) return
    const st = debug[kind] || (debug[kind] = { n: 0, errors: 0, dataSlack: new Map(), hdlSlack: new Map(), samples: [] })
    st.n++
    if (err) {
      st.errors++
      if (st.samples.length < 3) st.samples.push(`${o.handle}: ${err.message}`)
      return
    }
    const target = o.str ? o.str.start : o.origin + o.bitsize
    const ds = target - o.r.pos
    const hs = o.end - o.hdl.pos
    st.dataSlack.set(ds, (st.dataSlack.get(ds) || 0) + 1)
    st.hdlSlack.set(hs, (st.hdlSlack.get(hs) || 0) + 1)
  }

  // ── Tabelle ─────────────────────────────────────────────────────────────
  const readTable = (name, fn) => {
    const out = new Map()
    for (const h of byType.get(name) || []) {
      const { offset } = index.get(h)
      const o = openObject(objects, offset, v)
      try {
        const common = readObjectCommon(o, v)
        const t = PARSERS[name](o, v)
        const handles = readObjectHandles(o, common, v)
        fn?.(o, t, handles)
        t.handle = h
        out.set(h, t)
        note(name, o)
      } catch (err) {
        note(name, o, err)
      }
    }
    return out
  }

  const layers = readTable('LAYER', (o, t, handles) => {
    // dopo gli handle comuni: xref (nullo), stile di stampa (R2000+), materiale (R2007+), tipo di linea
    const H = () => o.hdl.H().value
    t.xref = H()
    if (v >= 2000) t.plotstyle = H()
    if (v >= 2007) t.material = H()
    t.ltype = H()
  })
  const ltypes = readTable('LTYPE')
  const styles = readTable('STYLE')
  const headers = new Map()
  for (const h of byType.get('BLOCK_HEADER') || []) {
    const { offset } = index.get(h)
    const o = openObject(objects, offset, v)
    try {
      const common = readObjectCommon(o, v)
      const t = PARSERS.BLOCK_HEADER(o, v)
      readObjectHandles(o, common, v)
      blockHeaderHandles(o, v, t)
      t.handle = h
      headers.set(h, t)
      note('BLOCK_HEADER', o)
    } catch (err) {
      note('BLOCK_HEADER', o, err)
    }
  }

  // Ordine di disegno (SORTENTSTABLE, «porta in secondo piano/primo piano»):
  // per ogni blocco, entità → handle fittizio con cui si ordina. Gli handle
  // di ordinamento stanno nel flusso dei dati, le entità in quello degli handle.
  const sortTables = new Map()
  for (const h of byType.get('SORTENTSTABLE') || []) {
    const { offset } = index.get(h)
    const o = openObject(objects, offset, v)
    try {
      const common = readObjectCommon(o, v)
      const n = o.r.BL()
      const ranks = []
      for (let i = 0; i < n; i++) ranks.push(o.r.H().value)
      readObjectHandles(o, common, v)
      const block = o.hdl.H().value
      const table = new Map()
      for (let i = 0; i < n; i++) table.set(o.hdl.H().value, ranks[i])
      if (table.size) sortTables.set(block, table)
      note('SORTENTSTABLE', o)
    } catch (err) {
      note('SORTENTSTABLE', o, err)
    }
  }

  let modelSpaceHandle = null
  for (const h of byType.get('BLOCK_CONTROL') || []) {
    const { offset } = index.get(h)
    const o = openObject(objects, offset, v)
    try {
      const common = readObjectCommon(o, v)
      const t = PARSERS.BLOCK_CONTROL(o, v)
      readObjectHandles(o, common, v)
      blockControlHandles(o, t)
      modelSpaceHandle = t.modelSpace
      note('BLOCK_CONTROL', o)
    } catch (err) {
      note('BLOCK_CONTROL', o, err)
    }
  }
  if (!headers.has(modelSpaceHandle)) {
    for (const [h, t] of headers) if (t.name.toLowerCase() === '*model_space') modelSpaceHandle = h
  }

  // ── Entità ──────────────────────────────────────────────────────────────
  const total = index.size
  let done = 0

  /** Legge un'entità dal suo handle; null se non la sappiamo leggere. */
  const readEntity = (h) => {
    const info = index.get(h)
    if (!info || !isEntity(info.type)) return null
    const name = info.name
    const fn = PARSERS[name]
    if (!fn) return { type: name, handle: h, unsupported: true }
    const o = openObject(objects, info.offset, v)
    try {
      const common = readEntityCommon(o, v)
      const handles = readEntityHandles(o, common, v)
      const data = fn(o, v)
      note(name, o)
      return {
        type: name,
        handle: h,
        layer: handles.layer,
        owner: handles.owner,
        color: common.color,
        ltype: common.ltypeFlags === 3 ? handles.ltype : null,
        ltypeFlags: common.ltypeFlags,
        ltypeScale: common.ltypeScale,
        linewt: common.linewt,
        invisible: common.invisible,
        entmode: common.entmode,
        ...data,
      }
    } catch (err) {
      note(name, o, err)
      return { type: name, handle: h, error: err.message }
    }
  }

  /** Le entità di un blocco: la lista del BLOCK_HEADER (R2004+), altrimenti la catena. */
  const blockEntities = (hdr) => {
    const list = []
    const handles = v >= 2004 ? hdr.entities : chain(hdr.firstEntity, hdr.lastEntity)
    for (const h of handles) {
      const e = readEntity(h)
      done++
      if (options.onProgress && done % 500 === 0) options.onProgress(done, total)
      if (!e || e.error || e.unsupported) continue
      // le polilinee vecchie portano i vertici come entità separate
      if (e.type === 'POLYLINE_2D' || e.type === 'POLYLINE_3D') {
        e.verts = []
        const vh = v >= 2004 ? e.vertices : chain(e.firstVertex, e.lastVertex)
        for (const k of vh) {
          const ve = readEntity(k)
          if (ve && !ve.error && ve.type.startsWith('VERTEX')) e.verts.push(ve)
        }
      } else if ((e.type === 'INSERT' || e.type === 'MINSERT') && e.hasAttribs) {
        e.attribEntities = []
        const ah = v >= 2004 ? e.attribs : chain(e.firstAttrib, e.lastAttrib)
        for (const k of ah) {
          const ae = readEntity(k)
          if (ae && !ae.error && ae.type === 'ATTRIB') e.attribEntities.push(ae)
        }
      }
      list.push(e)
    }
    const table = sortTables.get(hdr.handle)
    if (table) {
      const rank = (e) => table.get(e.handle) ?? e.handle
      list.sort((a, b) => rank(a) - rank(b))
    }
    return list
  }

  // catena R13-R2000: si segue `next` da first a last (non usata dai file R2004+)
  const chain = (first, last) => {
    const out = []
    let h = first
    let guard = 0
    while (h && guard++ < 1e6) {
      out.push(h)
      if (h === last) break
      const e = readEntity(h)
      h = e?.next
    }
    return out
  }

  const blocks = new Map()
  for (const [h, hdr] of headers) {
    blocks.set(h, { handle: h, name: hdr.name, basePt: hdr.basePt, anonymous: hdr.anonymous, isXref: hdr.isXref, header: hdr, entities: null })
  }
  const loadBlock = (h) => {
    const b = blocks.get(h)
    if (!b) return null
    if (!b.entities) {
      b.entities = []
      b.entities = blockEntities(b.header)
    }
    return b
  }

  const msBlock = modelSpaceHandle ? loadBlock(modelSpaceHandle) : null
  const modelSpace = msBlock ? msBlock.entities : []
  // i blocchi usati dagli inserimenti (anche dentro altri blocchi) e dalle quote
  const pending = [...modelSpace]
  let guard = 0
  while (pending.length && guard++ < 1e6) {
    const e = pending.pop()
    const ref = e.type === 'INSERT' || e.type === 'MINSERT' ? e.block : e.type.startsWith('DIMENSION') ? e.block : null
    if (!ref) continue
    const b = blocks.get(ref)
    if (b && !b.entities) {
      loadBlock(ref)
      pending.push(...b.entities)
    }
  }

  return {
    version: v,
    header,
    classes,
    layers,
    ltypes,
    styles,
    blocks,
    modelSpace,
    modelSpaceHandle,
    counts: Object.fromEntries([...byType].map(([k, l]) => [k, l.length])),
  }
}
