// Dal modello letto (src/dwg/dwg.js) alla scena da disegnare: tracciati
// raggruppati per stile, riempimenti in ordine, tratteggi con il proprio
// contorno di ritaglio, testi con la loro impostazione, puntini. I blocchi
// vengono espansi con la loro trasformazione; i colori «da layer» e «da
// blocco» risolti; layer spenti o congelati saltati. Tutto in coordinate
// del mondo (unità del disegno).

import { IDENTITY, multiply, apply, translation, rotation, scaling, similarity, ocsMatrix, arcPoints, bulgeArc, nurbsPoints, fitPoints, ellipsePoints, hatchLines, ACI, LINEWEIGHTS } from './geom.js'
import { parseMtext } from './mtext.js'

const DEFAULT_LW = 0.25 // mm: lo spessore «default» di AutoCAD
const TAU = Math.PI * 2

/** Nome di un carattere AutoCAD → famiglia CSS. */
export function fontFamily(name) {
  const n = (name || '').toLowerCase().replace(/\.(ttf|shx|otf)$/, '')
  if (!n) return 'Arial, Helvetica, sans-serif'
  if (n.startsWith('times')) return '"Times New Roman", Times, serif'
  if (n.startsWith('cambria')) return 'Cambria, Georgia, serif'
  if (n.startsWith('calibri')) return 'Calibri, "Segoe UI", Arial, sans-serif'
  if (n.startsWith('georgia')) return 'Georgia, serif'
  if (n.startsWith('verdana')) return 'Verdana, Geneva, sans-serif'
  if (n.startsWith('tahoma')) return 'Tahoma, Geneva, sans-serif'
  if (n.startsWith('courier') || n.startsWith('consola')) return '"Courier New", Courier, monospace'
  if (n.startsWith('isocp')) return '"Arial Narrow", Arial, sans-serif'
  if (n.startsWith('roman') || n === 'txt' || n.startsWith('simplex') || n.startsWith('complex') || n.startsWith('italic')) return 'Arial, Helvetica, sans-serif'
  return `"${name.replace(/\.(ttf|shx|otf)$/i, '')}", Arial, Helvetica, sans-serif`
}

class Bounds {
  constructor() {
    this.x0 = Infinity
    this.y0 = Infinity
    this.x1 = -Infinity
    this.y1 = -Infinity
  }
  add(x, y) {
    if (x < this.x0) this.x0 = x
    if (x > this.x1) this.x1 = x
    if (y < this.y0) this.y0 = y
    if (y > this.y1) this.y1 = y
  }
  addBox(b) {
    if (!b || b[0] > b[2]) return
    this.add(b[0], b[1])
    this.add(b[2], b[3])
  }
  get empty() {
    return this.x0 > this.x1
  }
  box() {
    return this.empty ? null : [this.x0, this.y0, this.x1, this.y1]
  }
}

/** Un tracciato in costruzione: opcodes in un array di numeri, più i limiti. */
class Path {
  constructor() {
    this.ops = []
    this.b = new Bounds()
  }
  move(x, y) {
    this.ops.push(0, x, y)
    this.b.add(x, y)
  }
  line(x, y) {
    this.ops.push(1, x, y)
    this.b.add(x, y)
  }
  arc(cx, cy, r, a0, a1, ccw) {
    this.ops.push(2, cx, cy, r, a0, a1, ccw ? 1 : 0)
    this.b.add(cx - r, cy - r)
    this.b.add(cx + r, cy + r)
  }
  close() {
    this.ops.push(3)
  }
  points(pts, closed = false) {
    if (pts.length < 2) return
    this.move(pts[0], pts[1])
    for (let i = 2; i < pts.length; i += 2) this.line(pts[i], pts[i + 1])
    if (closed) this.close()
  }
  get empty() {
    return this.ops.length === 0
  }
}

/**
 * @param {ReturnType<import('./dwg.js').parseDwg>} dwg
 * @param {{ darken?: boolean }} [options]
 */
export function buildScene(dwg, options = {}) {
  const layers = new Map()
  for (const [h, l] of dwg.layers) {
    layers.set(h, {
      name: l.name,
      rgb: colorRgb(l.color, null, null),
      off: !l.on,
      frozen: l.frozen,
      noPlot: l.noPlot,
      lw: lwMm(l.linewt, null, null),
      dash: dashOf(dwg, l.ltype, 1),
    })
  }
  const styles = new Map()
  for (const [h, s] of dwg.styles) styles.set(h, { family: fontFamily(s.font), wf: s.widthFactor || 1, oblique: s.oblique || 0 })

  const strokes = new Map() // stile → blocco corrente
  const strokeList = [] // tutti i blocchi, a pezzi di ~6000 operazioni così il ritaglio della vista li salta
  const fills = []
  const hatches = []
  const texts = []
  const dots = new Map()
  const bounds = new Bounds()
  const stats = { entities: 0, skipped: 0, unsupported: new Map(), hatchesTooDense: 0 }

  const strokeBatch = (rgb, alpha, lw, lwWorld, dash) => {
    const key = `${rgb.join(',')}|${alpha}|${lw}|${lwWorld}|${dash ? dash.join(',') : ''}`
    let b = strokes.get(key)
    if (!b || b.path.ops.length > 6000) {
      strokes.set(key, (b = { rgb, alpha, lw, lwWorld, dash, path: new Path() }))
      strokeList.push(b)
    }
    return b.path
  }

  /** Contesto di disegno dentro un blocco. */
  const rootCtx = { m: IDENTITY, byblockRgb: [0, 0, 0], byblockLw: DEFAULT_LW, byblockDash: null, insertLayer: null, depth: 0 }

  const layerOf = (e, ctx) => {
    const l = layers.get(e.layer)
    if (l && l.name === '0' && ctx.insertLayer) return ctx.insertLayer
    return l
  }
  const visible = (e, ctx) => {
    const l = layers.get(e.layer)
    if (!l) return true
    if (l.off || l.frozen) return false
    if (l.noPlot && ctx.depth === 0) return false
    if (l.name === '0' && ctx.insertLayer && (ctx.insertLayer.off || ctx.insertLayer.frozen)) return false
    return true
  }
  const rgbOf = (e, ctx) => {
    const c = e.color || {}
    let rgb
    if (c.rgb != null) rgb = [(c.rgb >> 16) & 0xff, (c.rgb >> 8) & 0xff, c.rgb & 0xff]
    else if (c.index === 256 || c.index == null) rgb = layerOf(e, ctx)?.rgb || [0, 0, 0]
    else if (c.index === 0) rgb = ctx.byblockRgb
    else rgb = ACI[c.index] || [0, 0, 0]
    return options.darken ? darken(rgb) : rgb
  }
  const alphaOf = (e) => (e.color && e.color.alpha != null ? e.color.alpha : 1)
  const lwOf = (e, ctx) => {
    if (e.linewt === 29 || e.linewt == null) return layerOf(e, ctx)?.lw ?? DEFAULT_LW
    if (e.linewt === 30) return ctx.byblockLw
    return lwMm(e.linewt)
  }
  const dashOfEntity = (e, ctx) => {
    const scale = (e.ltypeScale || 1) * dwg.header.ltscale
    if (e.ltypeFlags === 2) return null
    if (e.ltypeFlags === 1) return scaleDash(ctx.byblockDash, e.ltypeScale || 1)
    if (e.ltypeFlags === 3) return dashOf(dwg, e.ltype, scale)
    const l = layerOf(e, ctx)
    return l ? scaleDash(l.dash, scale) : null
  }
  const style = (e, ctx) => ({ rgb: rgbOf(e, ctx), alpha: alphaOf(e), lw: lwOf(e, ctx), dash: dashOfEntity(e, ctx) })

  // ── Primitive ─────────────────────────────────────────────────────────

  const emitPolyline = (pts, closed, st, m, lwWorld = 0) => {
    const path = strokeBatch(st.rgb, st.alpha, st.lw, lwWorld, st.dash)
    const out = []
    for (let i = 0; i < pts.length; i += 2) {
      const [x, y] = apply(m, pts[i], pts[i + 1])
      out.push(x, y)
    }
    path.points(out, closed)
    bounds.addBox(path.b.box())
  }

  /** Arco in coordinate locali → tracciato nel mondo (arco vero se la trasformazione lo permette). */
  const addArc = (path, m, cx, cy, r, a0, a1, ccw) => {
    const sim = similarity(m)
    if (sim) {
      // l'ampiezza si conserva (un cerchio intero resta intero): si ricalcola solo l'angolo iniziale
      let sweep = ccw ? a1 - a0 : a0 - a1
      sweep = ((sweep % TAU) + TAU) % TAU
      if (sweep < 1e-12) sweep = TAU
      const [wx, wy] = apply(m, cx, cy)
      const [sx, sy] = apply(m, cx + r * Math.cos(a0), cy + r * Math.sin(a0))
      const start = Math.atan2(sy - wy, sx - wx)
      const dir = (ccw ? 1 : -1) * (sim.mirror ? -1 : 1)
      path.arc(wx, wy, r * sim.scale, start, start + dir * sweep, dir > 0)
    } else {
      const pts = arcPoints(cx, cy, r, a0, a1, ccw)
      for (let i = 0; i < pts.length; i += 2) {
        const [x, y] = apply(m, pts[i], pts[i + 1])
        path.line(x, y)
      }
    }
  }

  /** Vertici con bulge (x, y, bulge…) → tracciato; usato da polilinee e contorni. */
  const bulgePath = (path, m, pts, bulges, closed) => {
    const n = pts.length / 2
    if (n === 0) return
    const [x0, y0] = apply(m, pts[0], pts[1])
    path.move(x0, y0)
    const segs = closed ? n : n - 1
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % n
      const ax = pts[i * 2]
      const ay = pts[i * 2 + 1]
      const bx = pts[j * 2]
      const by = pts[j * 2 + 1]
      const bulge = bulges ? bulges[i] || 0 : 0
      const arc = bulge ? bulgeArc(ax, ay, bx, by, bulge) : null
      if (arc) addArc(path, m, arc.cx, arc.cy, arc.r, arc.a0, arc.a1, arc.ccw)
      else {
        const [x, y] = apply(m, bx, by)
        path.line(x, y)
      }
    }
    if (closed) path.close()
  }

  const addText = (item) => {
    texts.push(item)
    const r = Math.max(item.h * 2, item.extW || 0, item.extH || 0, item.h * 0.75 * (item.text ? item.text.length : 40))
    bounds.add(item.x - r, item.y - r)
    bounds.add(item.x + r, item.y + r)
  }

  // ── Entità ────────────────────────────────────────────────────────────

  const emit = (e, ctx) => {
    stats.entities++
    if (e.invisible) return
    if (!visible(e, ctx)) return
    const m = ctx.m
    switch (e.type) {
      case 'LINE': {
        const st = style(e, ctx)
        emitPolyline([e.start[0], e.start[1], e.end[0], e.end[1]], false, st, m)
        break
      }
      case 'RAY':
      case 'XLINE': {
        const st = style(e, ctx)
        const L = 1e6
        const [px, py] = e.point
        const [vx, vy] = e.vector
        const len = Math.hypot(vx, vy) || 1
        const s = e.type === 'RAY' ? 0 : -L
        emitPolyline([px + (vx / len) * s, py + (vy / len) * s, px + (vx / len) * L, py + (vy / len) * L], false, st, m)
        break
      }
      case 'CIRCLE':
      case 'ARC': {
        const st = style(e, ctx)
        const mo = multiply(m, ocsMatrix(e.ext))
        const path = strokeBatch(st.rgb, st.alpha, st.lw, 0, st.dash)
        const a0 = e.type === 'ARC' ? e.startAngle : 0
        const a1 = e.type === 'ARC' ? e.endAngle : Math.PI * 2
        const [sx, sy] = apply(mo, e.center[0] + e.radius * Math.cos(a0), e.center[1] + e.radius * Math.sin(a0))
        path.move(sx, sy)
        addArc(path, mo, e.center[0], e.center[1], e.radius, a0, a1, true)
        bounds.addBox(path.b.box())
        break
      }
      case 'ELLIPSE': {
        const st = style(e, ctx)
        const pts = ellipsePoints(e.center[0], e.center[1], e.major[0], e.major[1], e.ratio, e.startParam, e.endParam)
        const closed = Math.abs(e.endParam - e.startParam - Math.PI * 2) < 1e-9
        emitPolyline(pts, closed, st, e.ext && e.ext[2] < 0 ? multiply(m, [-1, 0, 0, 1, 0, 0]) : m)
        break
      }
      case 'LWPOLYLINE': {
        const st = style(e, ctx)
        const mo = multiply(m, ocsMatrix(e.ext))
        let lwWorld = 0
        if (e.constWidth > 0) lwWorld = e.constWidth * (similarity(m)?.scale || 1)
        else if (e.widths && e.widths.length) {
          const avg = e.widths.reduce((s, w) => s + w[0] + w[1], 0) / (e.widths.length * 2)
          if (avg > 0) lwWorld = avg * (similarity(m)?.scale || 1)
        }
        const path = strokeBatch(st.rgb, st.alpha, st.lw, lwWorld, st.dash)
        bulgePath(path, mo, e.pts, e.bulges, e.closed)
        bounds.addBox(path.b.box())
        break
      }
      case 'POLYLINE_2D': {
        const st = style(e, ctx)
        const mo = multiply(m, ocsMatrix(e.ext))
        let verts = e.verts || []
        if (verts.some((v) => v.flag & 8)) verts = verts.filter((v) => v.flag & 8)
        else verts = verts.filter((v) => !(v.flag & 16))
        const pts = []
        const bulges = []
        let width = 0
        for (const v of verts) {
          pts.push(v.point[0], v.point[1])
          bulges.push(v.bulge || 0)
          width += (v.startWidth || 0) + (v.endWidth || 0)
        }
        width = width / (verts.length * 2 || 1)
        if (!width && (e.startWidth || e.endWidth)) width = ((e.startWidth || 0) + (e.endWidth || 0)) / 2
        const path = strokeBatch(st.rgb, st.alpha, st.lw, width > 0 ? width * (similarity(m)?.scale || 1) : 0, st.dash)
        bulgePath(path, mo, pts, bulges, !!(e.flag & 1))
        bounds.addBox(path.b.box())
        break
      }
      case 'POLYLINE_3D': {
        const st = style(e, ctx)
        const verts = (e.verts || []).filter((v) => !(v.flag & 16))
        const pts = []
        for (const v of verts) pts.push(v.point[0], v.point[1])
        emitPolyline(pts, !!(e.flag & 1), st, m)
        break
      }
      case 'SPLINE': {
        const st = style(e, ctx)
        let pts
        if (e.scenario & 1 && e.ctrl && e.ctrl.length) {
          const samples = Math.min(4000, Math.max(24, e.ctrl.length * 16))
          pts = nurbsPoints(e.degree, e.knots, e.ctrl, e.weights, samples)
        } else if (e.fit && e.fit.length) pts = fitPoints(e.fit, !!e.closed)
        else break
        emitPolyline(pts, false, st, m)
        break
      }
      case 'POINT': {
        if (dwg.header.pdmode === 1) break
        const rgb = rgbOf(e, ctx)
        const key = rgb.join(',')
        let d = dots.get(key)
        if (!d) dots.set(key, (d = { rgb, pts: [] }))
        const [x, y] = apply(m, e.point[0], e.point[1])
        d.pts.push(x, y)
        bounds.add(x, y)
        break
      }
      case 'SOLID':
      case 'TRACE': {
        const mo = multiply(m, ocsMatrix(e.ext))
        const [c1, c2, c3, c4] = e.corners
        const path = new Path()
        const order = [c1, c2, c4, c3]
        order.forEach((c, i) => {
          const [x, y] = apply(mo, c[0], c[1])
          i ? path.line(x, y) : path.move(x, y)
        })
        path.close()
        fills.push({ rgb: rgbOf(e, ctx), alpha: alphaOf(e), path })
        bounds.addBox(path.b.box())
        break
      }
      case '3DFACE': {
        const st = style(e, ctx)
        const pts = []
        for (const c of e.corners) pts.push(c[0], c[1])
        emitPolyline(pts, true, st, m)
        break
      }
      case 'HATCH':
        emitHatch(e, ctx)
        break
      case 'TEXT':
      case 'ATTRIB': {
        if (e.type === 'ATTRIB' && e.flags & 1) break
        if (!e.text || !e.text.trim()) break
        const mo = multiply(m, ocsMatrix(e.ext))
        const sim = similarity(m) || { scale: 1, angle: 0, mirror: false }
        const anchorLocal = e.halign === 0 && e.valign === 0 ? e.insert : e.align
        const [x, y] = apply(mo, anchorLocal[0], anchorLocal[1])
        const [ix, iy] = apply(mo, e.insert[0], e.insert[1])
        const [ax, ay] = apply(mo, e.align[0], e.align[1])
        const st = styles.get(e.style)
        addText({
          kind: 'text',
          x,
          y,
          ix,
          iy,
          ax,
          ay,
          rot: e.rotation + sim.angle,
          h: e.height * sim.scale,
          wf: (e.widthFactor || 1) * (st?.wf && e.widthFactor == null ? st.wf : 1),
          oblique: e.oblique || 0,
          halign: e.halign,
          valign: e.valign,
          family: st?.family || 'Arial, Helvetica, sans-serif',
          bold: false,
          italic: false,
          rgb: rgbOf(e, ctx),
          alpha: alphaOf(e),
          text: e.text,
          mirror: sim.mirror,
        })
        break
      }
      case 'MTEXT': {
        if (!e.text || !e.text.trim()) break
        const sim = similarity(m) || { scale: 1, angle: 0, mirror: false }
        const [x, y] = apply(m, e.insert[0], e.insert[1])
        const paragraphs = parseMtext(e.text)
        if (!paragraphs.some((p) => p.runs.some((r) => r.text.trim()))) break
        const fam = paragraphs.flatMap((p) => p.runs).find((r) => r.family)?.family
        addText({
          kind: 'mtext',
          x,
          y,
          rot: Math.atan2(e.xdir[1], e.xdir[0]) + sim.angle,
          h: e.height * sim.scale,
          wf: 1,
          attachment: e.attachment || 1,
          rectWidth: (e.rectWidth || 0) * sim.scale,
          lineSpacing: (e.lineSpaceFactor || 1) * (5 / 3),
          family: fontFamily(fam),
          rgb: rgbOf(e, ctx),
          alpha: alphaOf(e),
          paragraphs,
          extW: (e.extWidth || 0) * sim.scale,
          extH: (e.extHeight || 0) * sim.scale,
          mask: e.bgFlag & 1 ? { scale: e.bgScale || 1.5 } : null,
          mirror: sim.mirror,
        })
        break
      }
      case 'INSERT':
      case 'MINSERT':
        emitInsert(e, ctx)
        break
      case 'DIMENSION_ORDINATE':
      case 'DIMENSION_LINEAR':
      case 'DIMENSION_ALIGNED':
      case 'DIMENSION_ANG3PT':
      case 'DIMENSION_ANG2LN':
      case 'DIMENSION_RADIUS':
      case 'DIMENSION_DIAMETER': {
        const b = dwg.blocks.get(e.block)
        if (!b || !b.entities || ctx.depth > 8) break
        const l = layers.get(e.layer)
        const sub = { ...ctx, byblockRgb: rgbOf(e, ctx), byblockLw: lwOf(e, ctx), byblockDash: dashOfEntity(e, ctx), insertLayer: l || ctx.insertLayer, depth: ctx.depth + 1 }
        for (const c of b.entities) emit(c, sub)
        break
      }
      case 'LEADER': {
        const st = style(e, ctx)
        const pts = []
        for (const p of e.points) pts.push(p[0], p[1])
        if (e.pathType === 1 && e.points.length > 2) emitPolyline(fitPoints(e.points, false), false, st, m)
        else emitPolyline(pts, false, st, m)
        break
      }
      case 'WIPEOUT': {
        const pts = imageOutline(e)
        if (!pts) break
        const path = new Path()
        for (let i = 0; i < pts.length; i += 2) {
          const [x, y] = apply(m, pts[i], pts[i + 1])
          i ? path.line(x, y) : path.move(x, y)
        }
        path.close()
        fills.push({ rgb: [255, 255, 255], alpha: 1, path, paper: true })
        break
      }
      case 'IMAGE':
      case 'SEQEND':
      case 'BLOCK':
      case 'ENDBLK':
      case 'ATTDEF':
      case 'VIEWPORT':
        break
      default:
        stats.unsupported.set(e.type, (stats.unsupported.get(e.type) || 0) + 1)
    }
  }

  const emitInsert = (e, ctx) => {
    const b = dwg.blocks.get(e.block)
    if (!b || !b.entities || ctx.depth > 12) return
    const l = layers.get(e.layer)
    const sub = {
      byblockRgb: rgbOf(e, ctx),
      byblockLw: lwOf(e, ctx),
      byblockDash: dashOfEntity(e, ctx),
      insertLayer: l && l.name !== '0' ? l : ctx.insertLayer,
      depth: ctx.depth + 1,
      m: ctx.m,
    }
    const [sx, sy] = e.scale
    const base = b.basePt || [0, 0, 0]
    const local = multiply(multiply(multiply(translation(e.insert[0], e.insert[1]), rotation(e.rotation)), scaling(sx, sy)), translation(-base[0], -base[1]))
    const ocs = ocsMatrix(e.ext)
    const cols = e.type === 'MINSERT' ? Math.max(1, e.cols) : 1
    const rows = e.type === 'MINSERT' ? Math.max(1, e.rows) : 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let mm = local
        if (cols > 1 || rows > 1) {
          // gli spostamenti di riga e colonna seguono la rotazione del blocco
          mm = multiply(multiply(multiply(translation(e.insert[0], e.insert[1]), rotation(e.rotation)), translation(c * e.colSpacing, r * e.rowSpacing)), multiply(scaling(sx, sy), translation(-base[0], -base[1])))
        }
        sub.m = multiply(ctx.m, multiply(ocs, mm))
        for (const c2 of b.entities) emit(c2, sub)
        if (e.attribEntities) for (const a of e.attribEntities) emit(a, { ...sub, m: ctx.m })
      }
    }
  }

  /** Contorno di un'immagine o di un wipeout in coordinate del disegno. */
  const imageOutline = (e) => {
    const [ox, oy] = e.origin
    const [ux, uy] = e.u
    const [vx, vy] = e.v
    const [w, h] = e.size
    const map = (px, py) => [ox + ux * px + vx * py, oy + uy * px + vy * py]
    let pts
    if (e.clip && e.clip.length > 2) pts = e.clip
    else if (e.clip && e.clip.length === 2) {
      const [a, b] = e.clip
      pts = [a, [b[0], a[1]], b, [a[0], b[1]]]
    } else pts = [[-0.5, -0.5], [w - 0.5, -0.5], [w - 0.5, h - 0.5], [-0.5, h - 0.5]]
    const out = []
    // le coordinate dei pixel hanno la y verso il basso: v punta in su
    for (const [px, py] of pts) {
      const [x, y] = map(px + 0.5, h - (py + 0.5))
      out.push(x, y)
    }
    return out
  }

  const emitHatch = (e, ctx) => {
    const m = multiply(ctx.m, ocsMatrix(e.ext))
    const clip = new Path()
    for (const p of e.paths) {
      if (p.poly) {
        bulgePath(clip, m, p.poly.pts, p.poly.bulges, true)
        continue
      }
      if (!p.segs || !p.segs.length) continue
      let first = true
      for (const s of p.segs) {
        if (s.type === 1) {
          const [x0, y0] = apply(m, s.start[0], s.start[1])
          const [x1, y1] = apply(m, s.end[0], s.end[1])
          if (first) clip.move(x0, y0)
          clip.line(x1, y1)
        } else if (s.type === 2) {
          const a0 = s.ccw ? s.startAngle : s.endAngle
          const a1 = s.ccw ? s.endAngle : s.startAngle
          const [sx, sy] = apply(m, s.center[0] + s.radius * Math.cos(s.ccw ? s.startAngle : s.endAngle), s.center[1] + s.radius * Math.sin(s.ccw ? s.startAngle : s.endAngle))
          if (first) clip.move(sx, sy)
          // gli archi non antiorari sono descritti al contrario: si percorrono da end a start
          if (s.ccw) addArc(clip, m, s.center[0], s.center[1], s.radius, a0, a1, true)
          else {
            const pts = arcPoints(s.center[0], s.center[1], s.radius, s.endAngle, s.startAngle, false)
            for (let i = 0; i < pts.length; i += 2) {
              const [x, y] = apply(m, pts[i], pts[i + 1])
              clip.line(x, y)
            }
          }
        } else if (s.type === 3) {
          let pts = ellipsePoints(s.center[0], s.center[1], s.major[0], s.major[1], s.ratio, s.startAngle, s.endAngle)
          if (!s.ccw) {
            const rev = []
            for (let i = pts.length - 2; i >= 0; i -= 2) rev.push(pts[i], pts[i + 1])
            pts = rev
          }
          for (let i = 0; i < pts.length; i += 2) {
            const [x, y] = apply(m, pts[i], pts[i + 1])
            if (first && i === 0) clip.move(x, y)
            else clip.line(x, y)
          }
        } else if (s.type === 4) {
          let pts
          if (s.ctrl && s.ctrl.length > s.degree) pts = nurbsPoints(s.degree, s.knots, s.ctrl, s.weights, Math.min(2000, Math.max(16, s.ctrl.length * 12)))
          else if (s.fit && s.fit.length) pts = fitPoints(s.fit, false)
          else continue
          for (let i = 0; i < pts.length; i += 2) {
            const [x, y] = apply(m, pts[i], pts[i + 1])
            if (first && i === 0) clip.move(x, y)
            else clip.line(x, y)
          }
        }
        first = false
      }
      clip.close()
    }
    if (clip.empty) return
    const box = clip.b.box()
    bounds.addBox(box)
    const rgb = rgbOf(e, ctx)
    const alpha = alphaOf(e)
    if (e.solid || e.gradient) {
      fills.push({ rgb: e.gradient && e.gradientColors?.[0]?.color ? colorRgb(e.gradientColors[0].color, rgb) : rgb, alpha, path: clip })
      return
    }
    if (!e.deflines || !e.deflines.length) return
    // le linee del motivo sono già in coordinate del disegno (scala e angolo applicati)
    const sim = similarity(m)
    let deflines = e.deflines
    if (sim && (sim.scale !== 1 || sim.angle !== 0 || sim.mirror)) {
      deflines = e.deflines.map((d) => {
        const [ox, oy] = apply(m, d.origin[0], d.origin[1])
        const [fx, fy] = [m[0] * d.offset[0] + m[2] * d.offset[1], m[1] * d.offset[0] + m[3] * d.offset[1]]
        return { angle: d.angle + sim.angle * (sim.mirror ? -1 : 1), origin: [ox, oy], offset: [fx, fy], dashes: d.dashes.map((v) => v * sim.scale) }
      })
    }
    const lines = hatchLines(deflines, box)
    if (!lines) {
      stats.hatchesTooDense++
      fills.push({ rgb: options.darken ? rgb : rgb, alpha: alpha * 0.18, path: clip })
      return
    }
    hatches.push({ rgb: options.darken ? darken(rgb) : rgb, alpha, clip, segs: lines, lw: lwOf(e, ctx) })
  }

  for (const e of dwg.modelSpace) emit(e, rootCtx)

  const pack = (path) => ({ ops: Float64Array.from(path.ops), bounds: path.b.box() })
  return {
    bounds: bounds.box() || [0, 0, 1, 1],
    strokes: strokeList.map((b) => ({ rgb: b.rgb, alpha: b.alpha, lw: b.lw, lwWorld: b.lwWorld, dash: b.dash, ...pack(b.path) })),
    fills: fills.map((f) => ({ rgb: f.rgb, alpha: f.alpha, paper: !!f.paper, ...pack(f.path) })),
    hatches: hatches.map((h) => ({ rgb: h.rgb, alpha: h.alpha, lw: h.lw, clip: pack(h.clip), segs: Float64Array.from(h.segs), bounds: h.clip.b.box() })),
    texts,
    dots: [...dots.values()].map((d) => ({ rgb: d.rgb, pts: Float64Array.from(d.pts) })),
    stats: { ...stats, unsupported: Object.fromEntries(stats.unsupported), strokes: strokeList.length, fills: fills.length, hatches: hatches.length, texts: texts.length },
  }
}

// ── Aiuti ──────────────────────────────────────────────────────────────────

/** Colore CMC di una tabella/oggetto → [r, g, b]; l'indice 7 è il colore di primo piano (nero su bianco). */
function colorRgb(c, fallback = [0, 0, 0]) {
  if (!c) return fallback
  if (c.rgb != null) return [(c.rgb >> 16) & 0xff, (c.rgb >> 8) & 0xff, c.rgb & 0xff]
  const i = c.index
  if (i === 7 || i === 256 || i == null) return [0, 0, 0]
  return ACI[i] || fallback
}

function lwMm(index) {
  if (index == null || index === 29 || index === 30 || index === 31) return DEFAULT_LW
  if (index >= 0 && index < LINEWEIGHTS.length) return LINEWEIGHTS[index]
  return DEFAULT_LW
}

/** Il tipo di linea come sequenza di tratti e spazi per setLineDash (unità del disegno). */
function dashOf(dwg, handle, scale) {
  const lt = dwg.ltypes.get(handle)
  if (!lt || !lt.dashes || !lt.dashes.length) return null
  // setLineDash vuole coppie tratto/spazio: i tratti positivi si sommano, gli
  // spazi (negativi) pure, i punti (0) diventano tratti minimi (con le
  // estremità tonde si vedono come puntini)
  const total = lt.dashes.reduce((s, d) => s + Math.abs(d.length), 0) || 1
  const out = []
  let dash = 0
  let gap = 0
  for (const d of lt.dashes) {
    const l = Math.abs(d.length) * scale
    if (d.length < 0) {
      gap += l
      continue
    }
    if (gap > 0) {
      out.push(dash, gap)
      dash = 0
      gap = 0
    }
    dash += d.length > 0 ? l : total * scale * 0.002
  }
  if (dash > 0 || gap > 0) out.push(dash, gap)
  if (!out.some((v) => v > 0) || out.length < 2) return null
  return out
}

function scaleDash(dash, k) {
  if (!dash || k === 1) return dash
  return dash.map((v) => v * k)
}

/** Scurisce un colore mantenendone la tinta finché la luminanza non scende a 0,32. */
function darken(rgb) {
  const lum = (c) => {
    const ch = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])
  }
  let k = 1
  let c = rgb
  while (lum(c) > 0.32 && k > 0.05) {
    k -= 0.02
    c = rgb.map((v) => Math.round(v * k))
  }
  return c
}
