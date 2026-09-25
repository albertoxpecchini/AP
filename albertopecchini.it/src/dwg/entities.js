// Decodifica delle entità e delle tabelle di un DWG (R2010+), campo per
// campo secondo la specifica ODA. Ogni funzione riceve l'oggetto aperto
// (`o`: lettori dei dati `r`, delle stringhe `s`, degli handle `hdl`) e la
// versione; restituisce un oggetto semplice con la geometria.

import { resolveHandle } from './bits.js'
import { readObjectColor, readTableEntry } from './objects.js'

const H = (o) => resolveHandle(o.hdl.H(), o.handle)

// ── Entità ─────────────────────────────────────────────────────────────────

export function LINE(o, v) {
  const { r } = o
  let start
  let end
  if (v < 2000) {
    start = r.P3BD()
    end = r.P3BD()
  } else {
    const zZero = r.B()
    const sx = r.RD()
    const ex = r.DD(sx)
    const sy = r.RD()
    const ey = r.DD(sy)
    let sz = 0
    let ez = 0
    if (!zZero) {
      sz = r.RD()
      ez = r.DD(sz)
    }
    start = [sx, sy, sz]
    end = [ex, ey, ez]
  }
  const thickness = v < 2000 ? r.BD() : r.BT()
  const ext = r.BE()
  return { start, end, thickness, ext }
}

export function CIRCLE(o, v) {
  const { r } = o
  const center = r.P3BD()
  const radius = r.BD()
  const thickness = v < 2000 ? r.BD() : r.BT()
  const ext = r.BE()
  return { center, radius, thickness, ext }
}

export function ARC(o, v) {
  const { r } = o
  const center = r.P3BD()
  const radius = r.BD()
  const thickness = v < 2000 ? r.BD() : r.BT()
  const ext = r.BE()
  const startAngle = r.BD()
  const endAngle = r.BD()
  return { center, radius, thickness, ext, startAngle, endAngle }
}

export function ELLIPSE(o) {
  const { r } = o
  const center = r.P3BD()
  const major = r.P3BD()
  const ext = r.P3BD()
  const ratio = r.BD()
  const startParam = r.BD()
  const endParam = r.BD()
  return { center, major, ext, ratio, startParam, endParam }
}

export function POINT(o, v) {
  const { r } = o
  const point = r.P3BD()
  const thickness = v < 2000 ? r.BD() : r.BT()
  const ext = r.BE()
  const angle = r.BD()
  return { point, thickness, ext, angle }
}

export function RAY(o) {
  const { r } = o
  return { point: r.P3BD(), vector: r.P3BD() }
}
export const XLINE = RAY

export function LWPOLYLINE(o, v) {
  const { r } = o
  const flag = r.BS()
  const constWidth = flag & 4 ? r.BD() : 0
  const elevation = flag & 8 ? r.BD() : 0
  const thickness = flag & 2 ? r.BD() : 0
  const ext = flag & 1 ? r.P3BD() : [0, 0, 1]
  const n = r.BL()
  const nBulges = flag & 16 ? r.BL() : 0
  const nIds = v >= 2010 && flag & 1024 ? r.BL() : 0
  const nWidths = flag & 32 ? r.BL() : 0
  const pts = new Float64Array(n * 2)
  if (n) {
    if (v < 2000) {
      for (let i = 0; i < n; i++) {
        pts[i * 2] = r.RD()
        pts[i * 2 + 1] = r.RD()
      }
    } else {
      let x = (pts[0] = r.RD())
      let y = (pts[1] = r.RD())
      for (let i = 1; i < n; i++) {
        x = pts[i * 2] = r.DD(x)
        y = pts[i * 2 + 1] = r.DD(y)
      }
    }
  }
  let bulges = null
  if (nBulges) {
    bulges = new Float64Array(nBulges)
    for (let i = 0; i < nBulges; i++) bulges[i] = r.BD()
  }
  for (let i = 0; i < nIds; i++) r.BL()
  let widths = null
  if (nWidths) {
    widths = []
    for (let i = 0; i < nWidths; i++) widths.push([r.BD(), r.BD()])
  }
  return { flag, closed: !!(flag & 512), constWidth, elevation, thickness, ext, n, pts, bulges, widths }
}

/** Campi del testo semplice (R2000+), comuni a TEXT, ATTRIB e ATTDEF. */
function textFields(o, v) {
  const { r, s } = o
  const t = {}
  if (v < 2000) {
    t.elevation = r.BD()
    t.insert = r.P2RD()
    t.align = r.P2RD()
    t.ext = r.P3BD()
    t.thickness = r.BD()
    t.oblique = r.BD()
    t.rotation = r.BD()
    t.height = r.BD()
    t.widthFactor = r.BD()
    t.text = s.TV()
    t.generation = r.BS()
    t.halign = r.BS()
    t.valign = r.BS()
    return t
  }
  const f = r.RC()
  t.elevation = f & 1 ? 0 : r.RD()
  t.insert = r.P2RD()
  t.align = f & 2 ? t.insert.slice() : r.P2DD(t.insert)
  t.ext = r.BE()
  t.thickness = r.BT()
  t.oblique = f & 4 ? 0 : r.RD()
  t.rotation = f & 8 ? 0 : r.RD()
  t.height = r.RD()
  t.widthFactor = f & 0x10 ? 1 : r.RD()
  t.text = v >= 2007 ? s.TU() : s.TV()
  t.generation = f & 0x20 ? 0 : r.BS()
  t.halign = f & 0x40 ? 0 : r.BS()
  t.valign = f & 0x80 ? 0 : r.BS()
  return t
}

export function TEXT(o, v) {
  const t = textFields(o, v)
  t.style = H(o)
  return t
}

export function ATTRIB(o, v) {
  const { r, s } = o
  const t = textFields(o, v)
  if (v >= 2010) t.classVersion = r.RC()
  if (v >= 2018) {
    t.attrType = r.RC()
    if (t.attrType > 1) {
      // attributo multilinea: dentro c'è un MTEXT intero; teniamo il testo semplice
      t.mtext = MTEXT(o, v, true)
      t.text = t.mtext.text || t.text
      r.BS() // dimensione dei dati annotativi
    }
  }
  t.tag = v >= 2007 ? s.TU() : s.TV()
  t.fieldLength = r.BS()
  t.flags = r.RC()
  if (v >= 2007) t.lockPosition = r.B()
  return t
}

export function ATTDEF(o, v) {
  const { r, s } = o
  const t = textFields(o, v)
  if (v >= 2010) t.classVersion = r.RC()
  if (v >= 2018) {
    t.attrType = r.RC()
    if (t.attrType > 1) {
      t.mtext = MTEXT(o, v, true)
      r.BS()
    }
  }
  t.tag = v >= 2007 ? s.TU() : s.TV()
  t.fieldLength = r.BS()
  t.flags = r.RC()
  if (v >= 2007) t.lockPosition = r.B()
  if (v >= 2010) t.attdefVersion = r.RC()
  t.prompt = v >= 2007 ? s.TU() : s.TV()
  return t
}

export function MTEXT(o, v, embedded = false) {
  const { r, s } = o
  const t = {}
  t.insert = r.P3BD()
  t.ext = r.P3BD()
  t.xdir = r.P3BD()
  t.rectWidth = r.BD()
  if (v >= 2007) t.rectHeight = r.BD()
  t.height = r.BD()
  t.attachment = r.BS()
  t.flowDir = r.BS()
  t.extHeight = r.BD()
  t.extWidth = r.BD()
  t.text = v >= 2007 ? s.TU() : s.TV()
  if (v >= 2000) {
    t.lineSpaceStyle = r.BS()
    t.lineSpaceFactor = r.BD()
    r.B()
  }
  // Sfondo (R2004+): bit 1 = maschera, bit 2 = del colore dello sfondo. Nei
  // file 2018 seguono altri dati (colonne, contesto annotativo) che non
  // servono al disegno: da qui in poi un errore non butta via il testo.
  if (v >= 2004) {
    t.bgFlag = r.BL()
    try {
      if (t.bgFlag & 0x01) {
        t.bgScale = r.BD()
        t.bgColor = readObjectColor(o, v)
        t.bgTransparency = r.BL()
      }
    } catch {
      t.bgScale = 1.5
    }
  }
  return t
}

function insertFields(o, v) {
  const { r } = o
  const t = {}
  t.insert = r.P3BD()
  if (v < 2000) {
    t.scale = r.P3BD()
  } else {
    const f = r.BB()
    if (f === 3) t.scale = [1, 1, 1]
    else if (f === 1) {
      const y = r.DD(1)
      const z = r.DD(1)
      t.scale = [1, y, z]
    } else if (f === 2) {
      const x = r.RD()
      t.scale = [x, x, x]
    } else {
      const x = r.RD()
      const y = r.DD(x)
      const z = r.DD(x)
      t.scale = [x, y, z]
    }
  }
  t.rotation = r.BD()
  t.ext = r.P3BD()
  t.hasAttribs = r.B()
  if (v >= 2004 && t.hasAttribs) t.numOwned = r.BL()
  return t
}

function insertHandles(o, v, t) {
  t.block = H(o)
  t.attribs = []
  if (t.hasAttribs) {
    if (v < 2004) {
      t.firstAttrib = H(o)
      t.lastAttrib = H(o)
    } else for (let i = 0; i < t.numOwned; i++) t.attribs.push(H(o))
    t.seqend = H(o)
  }
}

export function INSERT(o, v) {
  const t = insertFields(o, v)
  insertHandles(o, v, t)
  return t
}

export function MINSERT(o, v) {
  const { r } = o
  const t = insertFields(o, v)
  t.cols = r.BS()
  t.rows = r.BS()
  t.colSpacing = r.BD()
  t.rowSpacing = r.BD()
  insertHandles(o, v, t)
  return t
}

export function POLYLINE_2D(o, v) {
  const { r } = o
  const t = {}
  t.flag = r.BS()
  t.curveType = r.BS()
  t.startWidth = r.BD()
  t.endWidth = r.BD()
  t.thickness = v < 2000 ? r.BD() : r.BT()
  t.elevation = r.BD()
  t.ext = r.BE()
  ownedHandles(o, v, t)
  return t
}

export function POLYLINE_3D(o, v) {
  const { r } = o
  const t = {}
  t.curveType = r.RC()
  t.flag = r.RC()
  ownedHandles(o, v, t)
  return t
}

function ownedHandles(o, v, t) {
  const { r } = o
  if (v >= 2004) t.numOwned = r.BL()
  t.vertices = []
  if (v < 2004) {
    t.firstVertex = H(o)
    t.lastVertex = H(o)
  } else for (let i = 0; i < t.numOwned; i++) t.vertices.push(H(o))
  t.seqend = H(o)
}

export function VERTEX_2D(o, v) {
  const { r } = o
  const t = {}
  t.flag = r.RC()
  t.point = r.P3BD()
  const sw = r.BD()
  if (sw < 0) {
    t.startWidth = t.endWidth = -sw
  } else {
    t.startWidth = sw
    t.endWidth = r.BD()
  }
  t.bulge = r.BD()
  if (v >= 2010) t.id = r.BL()
  t.tangent = r.BD()
  return t
}

export function VERTEX_3D(o) {
  const { r } = o
  return { flag: r.RC(), point: r.P3BD() }
}
export const VERTEX_MESH = VERTEX_3D
export const VERTEX_PFACE = VERTEX_3D

export function SEQEND() {
  return {}
}

export function SOLID(o, v) {
  const { r } = o
  const t = {}
  t.thickness = v < 2000 ? r.BD() : r.BT()
  t.elevation = r.BD()
  t.corners = [r.P2RD(), r.P2RD(), r.P2RD(), r.P2RD()]
  t.ext = r.BE()
  return t
}
export const TRACE = SOLID

export function FACE3D(o, v) {
  const { r } = o
  const t = {}
  if (v < 2000) {
    t.corners = [r.P3BD(), r.P3BD(), r.P3BD(), r.P3BD()]
    t.invis = r.BS()
    return t
  }
  const noFlags = r.B()
  const zZero = r.B()
  const c1 = [r.RD(), r.RD(), zZero ? 0 : r.RD()]
  const c2 = r.P3DD(c1)
  const c3 = r.P3DD(c2)
  const c4 = r.P3DD(c3)
  t.corners = [c1, c2, c3, c4]
  t.invis = noFlags ? 0 : r.BS()
  return t
}

export function SPLINE(o, v) {
  const { r } = o
  const t = {}
  let scenario = r.BL()
  if (v >= 2013) {
    t.splineFlags = r.BL()
    t.knotParam = r.BL()
    if (t.splineFlags & 1) scenario = 2
  }
  t.scenario = scenario
  t.degree = r.BL()
  if (scenario & 2) {
    t.fitTol = r.BD()
    t.begTangent = r.P3BD()
    t.endTangent = r.P3BD()
    t.numFit = r.BL()
  }
  if (scenario & 1) {
    t.rational = r.B()
    t.closed = r.B()
    t.periodic = r.B()
    t.knotTol = r.BD()
    t.ctrlTol = r.BD()
    t.numKnots = r.BL()
    t.numCtrl = r.BL()
    t.weighted = r.B()
  }
  if (scenario & 1) {
    t.knots = new Float64Array(t.numKnots)
    for (let i = 0; i < t.numKnots; i++) t.knots[i] = r.BD()
    t.ctrl = []
    t.weights = t.weighted ? [] : null
    for (let i = 0; i < t.numCtrl; i++) {
      t.ctrl.push(r.P3BD())
      if (t.weighted) t.weights.push(r.BD())
    }
  }
  if (scenario & 2) {
    t.fit = []
    for (let i = 0; i < t.numFit; i++) t.fit.push(r.P3BD())
  }
  return t
}

export function HATCH(o, v) {
  const { r, s } = o
  const t = {}
  if (v >= 2004) {
    t.gradient = r.BL()
    r.BL()
    t.gradientAngle = r.BD()
    t.gradientShift = r.BD()
    t.singleColorGradient = r.BL()
    t.gradientTint = r.BD()
    const nColors = r.BL()
    t.gradientColors = []
    for (let i = 0; i < nColors; i++) {
      const shift = r.BD()
      const color = readObjectColor(o, v)
      t.gradientColors.push({ shift, color })
    }
    t.gradientName = v >= 2007 ? s.TU() : s.TV()
  }
  t.elevation = r.BD()
  t.ext = r.P3BD()
  t.name = v >= 2007 ? s.TU() : s.TV()
  t.solid = r.B()
  t.associative = r.B()
  const nPaths = r.BL()
  t.paths = []
  let derived = false
  for (let p = 0; p < nPaths; p++) {
    const flag = r.BL()
    if (flag & 4) derived = true
    const path = { flag, segs: null, poly: null }
    if (!(flag & 2)) {
      const nSegs = r.BL()
      path.segs = []
      for (let k = 0; k < nSegs; k++) {
        const type = r.RC()
        if (type === 1) path.segs.push({ type, start: r.P2RD(), end: r.P2RD() })
        else if (type === 2) path.segs.push({ type, center: r.P2RD(), radius: r.BD(), startAngle: r.BD(), endAngle: r.BD(), ccw: r.B() })
        else if (type === 3) path.segs.push({ type, center: r.P2RD(), major: r.P2RD(), ratio: r.BD(), startAngle: r.BD(), endAngle: r.BD(), ccw: r.B() })
        else if (type === 4) {
          const sp = { type }
          sp.degree = r.BL()
          sp.rational = r.B()
          sp.periodic = r.B()
          const nKnots = r.BL()
          const nCtrl = r.BL()
          sp.knots = new Float64Array(nKnots)
          for (let i = 0; i < nKnots; i++) sp.knots[i] = r.BD()
          sp.ctrl = []
          sp.weights = sp.rational ? [] : null
          for (let i = 0; i < nCtrl; i++) {
            sp.ctrl.push(r.P2RD())
            if (sp.rational) sp.weights.push(r.BD())
          }
          if (v >= 2010) {
            const nFit = r.BL()
            sp.fit = []
            for (let i = 0; i < nFit; i++) sp.fit.push(r.P2RD())
            if (nFit) {
              sp.startTangent = r.P2RD()
              sp.endTangent = r.P2RD()
            }
          }
          path.segs.push(sp)
        } else throw new Error(`tratteggio: segmento di tipo ${type}`)
      }
    } else {
      const hasBulges = r.B()
      const closed = r.B()
      const n = r.BL()
      const pts = new Float64Array(n * 2)
      const bulges = hasBulges ? new Float64Array(n) : null
      for (let i = 0; i < n; i++) {
        pts[i * 2] = r.RD()
        pts[i * 2 + 1] = r.RD()
        if (hasBulges) bulges[i] = r.BD()
      }
      path.poly = { closed, n, pts, bulges }
    }
    path.numBoundaryHandles = r.BL()
    t.paths.push(path)
  }
  t.style = r.BS()
  t.patternType = r.BS()
  if (!t.solid) {
    t.angle = r.BD()
    t.scale = r.BD()
    t.double = r.B()
    const nDef = r.BS()
    t.deflines = []
    for (let i = 0; i < nDef; i++) {
      const d = { angle: r.BD(), origin: [r.BD(), r.BD()], offset: [r.BD(), r.BD()] }
      const nDash = r.BS()
      d.dashes = []
      for (let k = 0; k < nDash; k++) d.dashes.push(r.BD())
      t.deflines.push(d)
    }
  }
  if (derived) t.pixelSize = r.BD()
  const nSeeds = r.BL()
  t.seeds = []
  for (let i = 0; i < nSeeds; i++) t.seeds.push(r.P2RD())
  for (const p of t.paths) {
    p.boundaryHandles = []
    for (let i = 0; i < p.numBoundaryHandles; i++) p.boundaryHandles.push(H(o))
  }
  return t
}

function dimensionCommon(o, v) {
  const { r, s } = o
  const t = {}
  if (v >= 2010) t.classVersion = r.RC()
  t.ext = r.P3BD()
  t.textMid = r.P2RD()
  t.elevation = r.BD()
  t.flag = r.RC()
  t.userText = v >= 2007 ? s.TU() : s.TV()
  t.textRotation = r.BD()
  t.horizDir = r.BD()
  t.insScale = r.P3BD()
  t.insRotation = r.BD()
  if (v >= 2000) {
    t.attachment = r.BS()
    t.lineSpaceStyle = r.BS()
    t.lineSpaceFactor = r.BD()
    t.actMeasurement = r.BD()
  }
  if (v >= 2007) {
    r.B()
    t.flipArrow1 = r.B()
    t.flipArrow2 = r.B()
  }
  t.cloneInsert = r.P2RD()
  return t
}

function dimensionHandles(o, t) {
  t.dimstyle = H(o)
  t.block = H(o)
}

export function DIMENSION_ORDINATE(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.defPt = r.P3BD()
  t.feature = r.P3BD()
  t.leaderEnd = r.P3BD()
  t.flag2 = r.RC()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_LINEAR(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.xline1 = r.P3BD()
  t.xline2 = r.P3BD()
  t.defPt = r.P3BD()
  t.extRotation = r.BD()
  t.dimRotation = r.BD()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_ALIGNED(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.xline1 = r.P3BD()
  t.xline2 = r.P3BD()
  t.defPt = r.P3BD()
  t.extRotation = r.BD()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_ANG3PT(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.defPt = r.P3BD()
  t.xline1 = r.P3BD()
  t.xline2 = r.P3BD()
  t.center = r.P3BD()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_ANG2LN(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.defPt16 = r.P2RD()
  t.xline1Start = r.P3BD()
  t.xline1End = r.P3BD()
  t.xline2Start = r.P3BD()
  t.xline2End = r.P3BD()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_RADIUS(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.defPt = r.P3BD()
  t.arcPt = r.P3BD()
  t.leaderLen = r.BD()
  dimensionHandles(o, t)
  return t
}

export function DIMENSION_DIAMETER(o, v) {
  const { r } = o
  const t = dimensionCommon(o, v)
  t.arcPt = r.P3BD()
  t.defPt = r.P3BD()
  t.leaderLen = r.BD()
  dimensionHandles(o, t)
  return t
}

export function LEADER(o, v) {
  const { r } = o
  const t = {}
  r.B()
  t.annotType = r.BS()
  t.pathType = r.BS()
  const n = r.BL()
  t.points = []
  for (let i = 0; i < n; i++) t.points.push(r.P3BD())
  t.origin = r.P3BD()
  t.ext = r.P3BD()
  t.xdir = r.P3BD()
  t.offset = r.P3BD()
  if (v >= 14) t.endProj = r.P3BD()
  if (v < 2000) t.dimGap = r.BD()
  t.boxHeight = r.BD()
  t.boxWidth = r.BD()
  t.hookDir = r.B()
  t.arrowOn = r.B()
  return t
}

export function BLOCK(o, v) {
  const { s } = o
  return { name: v >= 2007 ? s.TU() : s.TV() }
}

export function ENDBLK() {
  return {}
}

/** Entità di classe (IMAGE, WIPEOUT): la cornice basta per il disegno. */
export function IMAGE(o, v) {
  const { r } = o
  const t = {}
  t.classVersion = r.BL()
  t.origin = r.P3BD()
  t.u = r.P3BD()
  t.v = r.P3BD()
  t.size = r.P2RD()
  t.displayProps = r.BS()
  t.clipping = r.B()
  t.brightness = r.RC()
  t.contrast = r.RC()
  t.fade = r.RC()
  if (v >= 2010) t.clipMode = r.B()
  t.clipType = r.BS()
  t.clip = []
  if (t.clipType === 1) {
    t.clip.push(r.P2RD(), r.P2RD())
  } else {
    const n = r.BL()
    for (let i = 0; i < n; i++) t.clip.push(r.P2RD())
  }
  return t
}
export const WIPEOUT = IMAGE

// ── Tabelle ────────────────────────────────────────────────────────────────

export function LAYER(o, v) {
  const { r } = o
  const t = readTableEntry(o, v)
  if (v < 2000) {
    t.frozen = r.B()
    t.on = r.B()
    t.frozenNew = r.B()
    t.locked = r.B()
    t.linewt = 29
  } else {
    const f = r.BS()
    t.flag = f
    t.frozen = !!(f & 1)
    t.on = !(f & 2)
    t.frozenNew = !!(f & 4)
    t.locked = !!(f & 8)
    t.noPlot = !(f & 16) // il bit 16 acceso vuol dire «si stampa»
    t.linewt = (f & 0x03e0) >> 5
  }
  t.color = readObjectColor(o, v)
  return t
}

export function LTYPE(o, v) {
  const { r, s } = o
  const t = readTableEntry(o, v)
  t.description = v >= 2007 ? s.TU() : s.TV()
  t.patternLength = r.BD()
  t.alignment = r.RC()
  const n = r.RC()
  t.dashes = []
  let hasText = false
  for (let i = 0; i < n; i++) {
    const d = { length: r.BD(), shapeCode: r.BS(), xOffset: r.RD(), yOffset: r.RD(), scale: r.BD(), rotation: r.BD(), flag: r.BS() }
    if (d.flag & 2) hasText = true
    t.dashes.push(d)
  }
  if (v < 2007) r.seek(r.pos + 256 * 8)
  else if (hasText) r.seek(r.pos + 512 * 8)
  return t
}

export function STYLE(o, v) {
  const { r, s } = o
  const t = readTableEntry(o, v)
  t.vertical = r.B()
  t.shapeFile = r.B()
  t.fixedHeight = r.BD()
  t.widthFactor = r.BD()
  t.oblique = r.BD()
  t.generation = r.RC()
  t.lastHeight = r.BD()
  t.font = v >= 2007 ? s.TU() : s.TV()
  t.bigFont = v >= 2007 ? s.TU() : s.TV()
  return t
}

export function BLOCK_HEADER(o, v) {
  const { r, s } = o
  const t = readTableEntry(o, v)
  t.anonymous = r.B()
  t.hasAttribs = r.B()
  t.isXref = r.B()
  t.xrefOverlaid = r.B()
  if (v >= 2000) t.loaded = r.B()
  if (v >= 2004) t.numOwned = r.BL()
  t.basePt = r.P3BD()
  t.xrefPath = v >= 2007 ? s.TU() : s.TV()
  if (v >= 2000) {
    t.numInserts = 0
    while (r.RC() !== 0) t.numInserts++
    t.description = v >= 2007 ? s.TU() : s.TV()
    const previewSize = r.BL()
    r.seek(r.pos + previewSize * 8)
  }
  if (v >= 2007) {
    t.units = r.BS()
    t.explodable = r.B()
    t.scaling = r.RC()
  }
  return t
}

/** Handle di un BLOCK_HEADER dopo quelli comuni: NULL, BLOCK, entità (R2004+), ENDBLK, inserimenti, layout. */
export function blockHeaderHandles(o, v, t) {
  H(o) // NULL
  t.blockEntity = H(o)
  t.entities = []
  if (v < 2004) {
    if (!t.isXref && !t.xrefOverlaid) {
      t.firstEntity = H(o)
      t.lastEntity = H(o)
    }
  } else for (let i = 0; i < t.numOwned; i++) t.entities.push(H(o))
  t.endblkEntity = H(o)
}

export function BLOCK_CONTROL(o) {
  const { r } = o
  return { numEntries: r.BL() }
}

export function blockControlHandles(o, t) {
  t.entries = []
  for (let i = 0; i < t.numEntries; i++) t.entries.push(H(o))
  t.modelSpace = H(o)
  t.paperSpace = H(o)
}

export const PARSERS = {
  LINE,
  CIRCLE,
  ARC,
  ELLIPSE,
  POINT,
  RAY,
  XLINE,
  LWPOLYLINE,
  TEXT,
  ATTRIB,
  ATTDEF,
  MTEXT,
  INSERT,
  MINSERT,
  POLYLINE_2D,
  POLYLINE_3D,
  VERTEX_2D,
  VERTEX_3D,
  VERTEX_MESH,
  VERTEX_PFACE,
  SEQEND,
  SOLID,
  TRACE,
  '3DFACE': FACE3D,
  SPLINE,
  HATCH,
  DIMENSION_ORDINATE,
  DIMENSION_LINEAR,
  DIMENSION_ALIGNED,
  DIMENSION_ANG3PT,
  DIMENSION_ANG2LN,
  DIMENSION_RADIUS,
  DIMENSION_DIAMETER,
  LEADER,
  BLOCK,
  ENDBLK,
  IMAGE,
  WIPEOUT,
  LAYER,
  LTYPE,
  STYLE,
  BLOCK_HEADER,
  BLOCK_CONTROL,
}
