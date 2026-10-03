// Le tavole che vengono da un PDF (stampato da AutoCAD o da Excel e portato in
// SVG da pdftocairo, vedi tools/tavole) → dati per la scheda grafica, come per
// i DWG (src/gpu/format.js). Non è un lettore SVG completo: capisce quello che
// c'è in quei file, cioè tracciati (M L H V C Z) con riempimento e contorno,
// una matrice di trasformazione, gruppi con ritaglio rettangolare e le lettere
// come sagome richiamate con <use>. Se trova altro (immagini, sfumature,
// maschere, testo vero) si ferma con un errore e la tavola torna a essere
// disegnata dal browser.
//
// L'ordine dei tracciati nel file è l'ordine di disegno: un riempimento bianco
// copre le linee venute prima. Ogni tracciato porta il suo numero d'ordine, e la
// scheda grafica lo usa come profondità.

import { Buf, writers, DashTable, SEG_STRIDE, TRI_STRIDE, GLYPH_STRIDE, FLAG_BUTT0, FLAG_BUTT1 } from './format.js'
import { tessellate, loopEdges, clipToEdges, clipToRect } from './tess.js'

const TAG = /<(\/?)([A-Za-z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g
const ATTR = /([\w:-]+)\s*=\s*"([^"]*)"/g
const TOKEN = /([MLHVCZmlhvcz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([A-Za-z])/g
const UNSUPPORTED = new Set(['image', 'text', 'tspan', 'linearGradient', 'radialGradient', 'mask', 'pattern', 'filter', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'symbol', 'style', 'foreignObject'])

function attrsOf(src) {
  const a = {}
  let m
  ATTR.lastIndex = 0
  while ((m = ATTR.exec(src))) a[m[1]] = m[2]
  if (a.style) {
    for (const part of a.style.split(';')) {
      const k = part.indexOf(':')
      if (k > 0) a[part.slice(0, k).trim()] ??= part.slice(k + 1).trim()
    }
  }
  return a
}

/** Colore SVG → [r, g, b] o null per «none». */
function colorOf(v) {
  if (!v || v === 'none') return null
  if (v[0] === '#') {
    if (v.length === 4) return [parseInt(v[1] + v[1], 16), parseInt(v[2] + v[2], 16), parseInt(v[3] + v[3], 16)]
    return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]
  }
  const m = /^rgb\(\s*([\d.]+)(%?)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/.exec(v)
  if (m) {
    const k = m[2] ? 2.55 : 1
    return [Math.round(m[1] * k), Math.round(m[3] * k), Math.round(m[4] * k)]
  }
  if (v === 'black') return [0, 0, 0]
  if (v === 'white') return [255, 255, 255]
  throw new Error(`colore «${v}»`)
}

function matrixOf(v) {
  if (!v) return null
  const m = /^\s*(matrix|translate|scale)\(([^)]*)\)\s*$/.exec(v)
  if (!m) throw new Error(`trasformazione «${v}»`)
  const n = m[2].split(/[\s,]+/).filter(Boolean).map(Number)
  if (m[1] === 'matrix') return n
  if (m[1] === 'translate') return [1, 0, 0, 1, n[0], n[1] || 0]
  return [n[0], 0, 0, n[1] ?? n[0], 0, 0]
}

/**
 * I dati di un tracciato → sottotracciati di punti (le curve spezzate quanto
 * basta per non vedersi), già trasformati e riferiti all'origine.
 */
function pathOf(d, m, tol, ox, oy) {
  const subs = []
  let pts = null
  let cmd = ''
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const nums = []
  const tx = (px, py) => (m ? m[0] * px + m[2] * py + m[4] : px) - ox
  const ty = (px, py) => (m ? m[1] * px + m[3] * py + m[5] : py) - oy
  const to = (px, py) => {
    if (!pts) subs.push((pts = { p: [tx(x, y), ty(x, y)], closed: false }))
    pts.p.push(tx(px, py), ty(px, py))
    x = px
    y = py
  }
  const run = () => {
    const rel = cmd >= 'a'
    const c = cmd.toUpperCase()
    const need = c === 'C' ? 6 : c === 'H' || c === 'V' ? 1 : 2
    for (let i = 0; i + need <= nums.length; i += need) {
      if (c === 'M' && i === 0) {
        x = sx = nums[0] + (rel ? x : 0)
        y = sy = nums[1] + (rel ? y : 0)
        pts = null
      } else if (c === 'M' || c === 'L') to(nums[i] + (rel ? x : 0), nums[i + 1] + (rel ? y : 0))
      else if (c === 'H') to(nums[i] + (rel ? x : 0), y)
      else if (c === 'V') to(x, nums[i] + (rel ? y : 0))
      else {
        const bx = rel ? x : 0
        const by = rel ? y : 0
        const x1 = nums[i] + bx
        const y1 = nums[i + 1] + by
        const x2 = nums[i + 2] + bx
        const y2 = nums[i + 3] + by
        const x3 = nums[i + 4] + bx
        const y3 = nums[i + 5] + by
        // quanti pezzi: dallo scarto massimo tra la curva e la sua corda, sul foglio
        const ax = tx(x, y) - 2 * tx(x1, y1) + tx(x2, y2)
        const ay = ty(x, y) - 2 * ty(x1, y1) + ty(x2, y2)
        const cx = tx(x1, y1) - 2 * tx(x2, y2) + tx(x3, y3)
        const cy = ty(x1, y1) - 2 * ty(x2, y2) + ty(x3, y3)
        const dev = Math.sqrt(Math.max(ax * ax + ay * ay, cx * cx + cy * cy))
        const n = Math.max(1, Math.min(64, Math.ceil(Math.sqrt((0.75 * dev) / tol))))
        const x0 = x
        const y0 = y
        for (let k = 1; k <= n; k++) {
          const t = k / n
          const u = 1 - t
          const a = u * u * u
          const b = 3 * u * u * t
          const cc = 3 * u * t * t
          const e = t * t * t
          to(a * x0 + b * x1 + cc * x2 + e * x3, a * y0 + b * y1 + cc * y2 + e * y3)
        }
      }
    }
    nums.length = 0
  }
  let t
  TOKEN.lastIndex = 0
  while ((t = TOKEN.exec(d))) {
    if (t[2] !== undefined) {
      nums.push(Number(t[2]))
      continue
    }
    if (t[3]) throw new Error(`comando «${t[3]}» nei tracciati`)
    if (cmd) run()
    cmd = t[1]
    if (cmd === 'Z' || cmd === 'z') {
      if (pts) pts.closed = true
      x = sx
      y = sy
      pts = null
      cmd = ''
    }
  }
  if (cmd) run()
  return subs
}

/** Un tracciato di ritaglio: se è un rettangolo dritto lo dice, altrimenti resta un contorno. */
function clipOf(subs) {
  if (subs.length === 1) {
    const p = subs[0].p
    const n = p.length >> 1
    const k = n === 5 && p[0] === p[8] && p[1] === p[9] ? 4 : n
    if (k === 4) {
      const xs = [p[0], p[2], p[4], p[6]]
      const ys = [p[1], p[3], p[5], p[7]]
      if (new Set(xs).size === 2 && new Set(ys).size === 2) return { rect: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] }
    }
  }
  const loops = subs.map((s) => s.p)
  return { loops, edges: loopEdges(loops) }
}

const rectLoop = (r) => [r[0], r[1], r[2], r[1], r[2], r[3], r[0], r[3]]

/**
 * @param {string} src il file SVG
 * @param {{ maxPx?: number }} [o] larghezza del foglio in pixel al massimo ingrandimento
 */
export function packSvg(src, { maxPx = 32000 } = {}) {
  const head = /<svg\b[^>]*>/.exec(src)
  const vbText = head && /\bviewBox="([^"]+)"/.exec(head[0])
  if (!vbText) throw new Error('SVG senza viewBox')
  const vb = vbText[1].trim().split(/[\s,]+/).map(Number)
  const ox = vb[0] + vb[2] / 2
  const oy = vb[1] + vb[3] / 2
  const tol = (0.2 * vb[2]) / maxPx

  const segs = new Buf(SEG_STRIDE, 1 << 15)
  const tris = new Buf(TRI_STRIDE, 1 << 15)
  const W = writers(segs, tris, null)
  const dashes = new DashTable()

  const defs = new Map() // id → dati dei tracciati della sagoma (le lettere)
  const shapes = new Map() // id → { loops, tris, box } pronti da copiare
  const clips = new Map()
  const stack = [{ fill: '#000000', clip: null }]
  let inDefs = false
  let defId = null
  let clipId = null
  let order = 0

  const fillLoops = (loops, evenodd, clip, rgb, a) => {
    const [r, g, b] = rgb
    const o = order
    tessellate(loops, evenodd, clip, (x0, y0, x1, y1, x2, y2) => {
      W.vert(x0, y0, r, g, b, a, o)
      W.vert(x1, y1, r, g, b, a, o)
      W.vert(x2, y2, r, g, b, a, o)
    })
  }
  const boxOf = (subs) => {
    const b = [Infinity, Infinity, -Infinity, -Infinity]
    for (const s of subs)
      for (let i = 0; i < s.p.length; i += 2) {
        if (s.p[i] < b[0]) b[0] = s.p[i]
        if (s.p[i] > b[2]) b[2] = s.p[i]
        if (s.p[i + 1] < b[1]) b[1] = s.p[i + 1]
        if (s.p[i + 1] > b[3]) b[3] = s.p[i + 1]
      }
    return b
  }
  /** Il ritaglio serve davvero? 0 = tutto fuori, 1 = tutto dentro (non serve), 2 = a cavallo. */
  const clipState = (clip, b, grow = 0) => {
    if (!clip) return 1
    const r = clip.rect || clip.edges.box
    if (b[2] + grow < r[0] || b[0] - grow > r[2] || b[3] + grow < r[1] || b[1] - grow > r[3]) return 0
    if (clip.rect && b[0] - grow >= r[0] && b[2] + grow <= r[2] && b[1] - grow >= r[1] && b[3] + grow <= r[3]) return 1
    return 2
  }
  const clipLoops = (clip) => clip.loops || [rectLoop(clip.rect)]

  const drawPath = (a, top) => {
    const fill = colorOf(a.fill ?? top.fill)
    const stroke = colorOf(a.stroke)
    if (!a.d || (!fill && !stroke)) return
    const m = matrixOf(a.transform)
    const subs = pathOf(a.d, m, tol, ox, oy)
    if (!subs.length) return
    if (order >= 65535) throw new Error('troppi tracciati')
    order++
    const box = boxOf(subs)
    const opacity = a.opacity != null ? Number(a.opacity) : 1

    if (fill) {
      const state = clipState(top.clip, box)
      if (state) fillLoops(subs.map((s) => s.p), a['fill-rule'] === 'evenodd', state === 2 ? clipLoops(top.clip) : null, fill, Math.round(255 * opacity * (a['fill-opacity'] != null ? Number(a['fill-opacity']) : 1)))
    }
    if (!stroke) return
    const k = m ? Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) : 1
    const lw = (a['stroke-width'] != null ? Number(a['stroke-width']) : 1) * k
    if (!(lw > 0)) return
    const state = clipState(top.clip, box, lw / 2)
    if (!state) return
    const clip = state === 2 ? top.clip : null
    const [r, g, b] = stroke
    const alpha = Math.round(255 * opacity * (a['stroke-opacity'] != null ? Number(a['stroke-opacity']) : 1))
    const round = a['stroke-linecap'] === 'round'
    const dash = a['stroke-dasharray'] && a['stroke-dasharray'] !== 'none' ? a['stroke-dasharray'].split(/[\s,]+/).map((v) => Number(v) * k) : null
    const row = dashes.row(dash && dash.length % 2 ? [...dash, ...dash] : dash)
    for (const s of subs) {
      const p = s.p
      const n = p.length >> 1
      const last = s.closed ? n : n - 1
      let dist = 0
      for (let i = 0; i < last; i++) {
        const j = i + 1 === n ? 0 : i + 1
        const x0 = p[2 * i]
        const y0 = p[2 * i + 1]
        const x1 = p[2 * j]
        const y1 = p[2 * j + 1]
        const len = Math.hypot(x1 - x0, y1 - y0)
        // estremità dritte se il file non le chiede tonde; le giunture restano tonde
        let flags = round || s.closed ? 0 : (i === 0 ? FLAG_BUTT0 : 0) | (i === last - 1 ? FLAG_BUTT1 : 0)
        if (len === 0 && !round) continue // un punto senza estremità tonde non lascia segno
        if (!clip) W.seg(x0, y0, x1, y1, 0, dist, 0, lw, r, g, b, alpha, row, flags, order)
        else if (clip.rect) {
          const t = clipToRect(clip.rect, x0, y0, x1, y1)
          if (t) {
            if (t[0] > 0) flags |= FLAG_BUTT0
            if (t[1] < 1) flags |= FLAG_BUTT1
            W.seg(x0 + (x1 - x0) * t[0], y0 + (y1 - y0) * t[0], x0 + (x1 - x0) * t[1], y0 + (y1 - y0) * t[1], 0, dist + len * t[0], 0, lw, r, g, b, alpha, row, flags, order)
          }
        } else {
          const d0 = dist
          clipToEdges(clip.edges, x0, y0, x1, y1, (cx0, cy0, cx1, cy1, t0, t1) =>
            W.seg(cx0, cy0, cx1, cy1, 0, d0 + len * t0, 0, lw, r, g, b, alpha, row, flags | (t0 > 0 ? FLAG_BUTT0 : 0) | (t1 < 1 ? FLAG_BUTT1 : 0), order),
          )
        }
        dist += len
      }
    }
  }

  /** Una sagoma dei <defs> (una lettera): tassellata una volta, poi copiata dove serve. */
  const shapeOf = (id) => {
    let s = shapes.get(id)
    if (s) return s
    const list = defs.get(id)
    if (!list) return null
    const subs = list.flatMap((d) => pathOf(d.d, matrixOf(d.transform), tol, 0, 0))
    const loops = subs.map((q) => q.p)
    const t = []
    tessellate(loops, false, null, (x0, y0, x1, y1, x2, y2) => t.push(x0, y0, x1, y1, x2, y2))
    shapes.set(id, (s = { loops, tris: Float32Array.from(t), box: boxOf(subs) }))
    return s
  }

  const drawUse = (a, top) => {
    const id = (a['xlink:href'] || a.href || '').slice(1)
    const s = shapeOf(id)
    const fill = colorOf(a.fill ?? top.fill)
    if (!s || !fill || !s.tris.length) return
    if (order >= 65535) throw new Error('troppi tracciati')
    order++
    const dx = (Number(a.x) || 0) - ox
    const dy = (Number(a.y) || 0) - oy
    const state = clipState(top.clip, [s.box[0] + dx, s.box[1] + dy, s.box[2] + dx, s.box[3] + dy])
    if (!state) return
    if (state === 2) {
      fillLoops(s.loops.map((p) => p.map((v, i) => v + (i & 1 ? dy : dx))), false, clipLoops(top.clip), fill, 255)
      return
    }
    const [r, g, b] = fill
    const t = s.tris
    for (let i = 0; i < t.length; i += 2) W.vert(t[i] + dx, t[i + 1] + dy, r, g, b, 255, order)
  }

  let m
  TAG.lastIndex = 0
  while ((m = TAG.exec(src))) {
    const name = m[2]
    if (m[1]) {
      if (name === 'defs') inDefs = false
      else if (name === 'clipPath') clipId = null
      else if (name === 'g') {
        if (inDefs) defId = null
        else if (stack.length > 1) stack.pop()
      }
      continue
    }
    if (UNSUPPORTED.has(name)) throw new Error(`<${name}> non previsto`)
    const a = attrsOf(m[3])
    const top = stack[stack.length - 1]
    if (name === 'defs') inDefs = true
    else if (name === 'clipPath') clipId = a.id
    else if (name === 'g') {
      if (inDefs) {
        if (a.id) defId = a.id
      } else if (!m[4]) {
        let clip = top.clip
        const ref = a['clip-path'] && /url\(#([^)]+)\)/.exec(a['clip-path'])
        if (ref && clips.has(ref[1])) {
          const c = clips.get(ref[1])
          // due rettangoli annidati si intersecano; altrimenti vale il più interno
          clip = clip && clip.rect && c.rect ? { rect: [Math.max(clip.rect[0], c.rect[0]), Math.max(clip.rect[1], c.rect[1]), Math.min(clip.rect[2], c.rect[2]), Math.min(clip.rect[3], c.rect[3])] } : c
        }
        if (a.transform) throw new Error('gruppo con trasformazione')
        stack.push({ fill: a.fill ?? top.fill, clip })
      }
    } else if (name === 'path') {
      if (inDefs) {
        if (clipId) clips.set(clipId, clipOf(pathOf(a.d || '', matrixOf(a.transform), tol, ox, oy)))
        else if (defId) defs.set(defId, [...(defs.get(defId) || []), { d: a.d || '', transform: a.transform }])
      } else drawPath(a, top)
    } else if (name === 'use') {
      if (!inDefs) drawUse(a, top)
    }
  }

  const table = dashes.done()
  return {
    kind: 'svg',
    origin: [ox, oy],
    viewBox: vb,
    yUp: false,
    ordered: true,
    segs: segs.done(),
    segCount: segs.n,
    tris: tris.done(),
    triCount: tris.n,
    glyphs: new ArrayBuffer(0),
    glyphCount: 0,
    atlas: null,
    em: 1,
    rad: 1,
    dashes: table.data,
    dashRows: table.rows,
    texts: true,
  }
}
