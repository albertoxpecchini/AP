// Dalla scena del DWG (src/dwg/scene.js) ai dati per la scheda grafica
// (src/gpu/format.js). Si fa una volta sola, nel worker, quando il file è stato
// letto; poi ogni fotogramma è solo «disegna questi elenchi con questa vista».
//
//   · i tracciati diventano tratti: le linee un pezzo ciascuna, gli archi pochi
//     pezzi curvi (lo shader disegna l'arco vero, non una spezzata)
//   · le righe dei tratteggi sono ritagliate qui dal loro contorno
//   · i riempimenti sono scomposti in triangoli (src/gpu/tess.js)
//   · i testi sono lettere dell'atlante (src/gpu/sdf.js), una per una, messe
//     dove le metterebbe il canvas (stesse misure di src/dwg/render.js)
//
// L'ordine è quello del disegno su canvas: riempimenti, tratteggi, tracciati,
// punti, testi.

import { Buf, writers, DashTable, SEG_STRIDE, TRI_STRIDE, GLYPH_STRIDE, FLAG_BUTT0, FLAG_BUTT1, FLAG_DOT, SOLID_UV } from './format.js'
import { tessellate, loopEdges, clipToEdges } from './tess.js'
import { GlyphAtlas, canMakeGlyphs, SDF_EM, SDF_RAD } from './sdf.js'
import { layoutMtext, worldWidth, CAP } from '../dwg/render.js'

const SAG = 24 // freccia massima di un pezzo d'arco al massimo ingrandimento, in px
const QUARTER = Math.PI / 2
const a255 = (a) => Math.round(Math.max(0, Math.min(1, a ?? 1)) * 255)

/**
 * @param {object} scene da buildScene()
 * @param {{ focus?: number[]|null, maxScale?: number }} [o]
 *   `focus`: la zona del disegno che si guarda (l'unione dei riquadri delle
 *   tavole), al cui centro va l'origine; `maxScale`: pixel per unità del
 *   disegno al massimo ingrandimento, da cui la finezza di archi e curve
 */
export function packDwg(scene, { focus = null, maxScale = 100 } = {}) {
  const fb = focus || scene.bounds
  const ox = (fb[0] + fb[2]) / 2
  const oy = (fb[1] + fb[3]) / 2
  const tol = 0.25 / maxScale

  const segs = new Buf(SEG_STRIDE, 1 << 15)
  const tris = new Buf(TRI_STRIDE, 1 << 15)
  const glyphs = new Buf(GLYPH_STRIDE, 1 << 12)
  const W = writers(segs, tris, glyphs)
  const dashes = new DashTable()

  /** Tracciato (opcodes) → contorni chiusi di soli punti, per riempire e ritagliare. */
  const loopsOf = (ops) => {
    const loops = []
    let cur = null
    let i = 0
    const n = ops.length
    while (i < n) {
      const op = ops[i]
      if (op === 0) {
        loops.push((cur = [ops[i + 1] - ox, ops[i + 2] - oy]))
        i += 3
      } else if (op === 1) {
        cur.push(ops[i + 1] - ox, ops[i + 2] - oy)
        i += 3
      } else if (op === 2) {
        const cx = ops[i + 1] - ox
        const cy = ops[i + 2] - oy
        const r = ops[i + 3]
        const a0 = ops[i + 4]
        const sweep = ops[i + 5] - a0
        const step = 2 * Math.acos(Math.max(-1, 1 - tol / r))
        const k = Math.max(2, Math.min(720, Math.ceil(Math.abs(sweep) / (step || 1))))
        if (!cur) loops.push((cur = []))
        // l'arco riparte da dove si è: l'inizio si aggiunge solo se è un altro punto
        const m = cur.length
        const joined = m > 0 && Math.abs(cur[m - 2] - (cx + r * Math.cos(a0))) + Math.abs(cur[m - 1] - (cy + r * Math.sin(a0))) < tol
        for (let j = joined ? 1 : 0; j <= k; j++) {
          const a = a0 + (sweep * j) / k
          cur.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
        }
        i += 7
      } else if (op === 3) i += 1
      else break
    }
    return loops
  }

  // ── Riempimenti ─────────────────────────────────────────────────────────
  for (const f of scene.fills) {
    const [r, g, b] = f.paper ? [255, 255, 255] : f.rgb
    const a = a255(f.alpha)
    tessellate(loopsOf(f.ops), true, null, (x0, y0, x1, y1, x2, y2) => {
      W.vert(x0, y0, r, g, b, a, 0)
      W.vert(x1, y1, r, g, b, a, 0)
      W.vert(x2, y2, r, g, b, a, 0)
    })
  }

  // ── Motivi di tratteggio: le righe ritagliate dal contorno ──────────────
  for (const h of scene.hatches) {
    const edges = loopEdges(loopsOf(h.clip.ops))
    const [r, g, b] = h.rgb
    const a = a255(h.alpha)
    const s = h.segs
    const emit = (x0, y0, x1, y1) => W.seg(x0, y0, x1, y1, 0, 0, h.lw, 0, r, g, b, a, 0, FLAG_BUTT0 | FLAG_BUTT1, 0)
    for (let i = 0; i < s.length; i += 4) clipToEdges(edges, s[i] - ox, s[i + 1] - oy, s[i + 2] - ox, s[i + 3] - oy, emit)
  }

  // ── Tracciati ───────────────────────────────────────────────────────────
  for (const st of scene.strokes) {
    const [r, g, b] = st.rgb
    const a = a255(st.alpha)
    const row = dashes.row(st.dash)
    const lwMm = st.lwWorld > 0 ? 0 : st.lw
    const lwWorld = st.lwWorld > 0 ? st.lwWorld : 0
    const ops = st.ops
    const n = ops.length
    let i = 0
    let x = 0
    let y = 0
    let sx = 0
    let sy = 0
    let has = false
    let dist = 0
    const line = (x1, y1) => {
      W.seg(x, y, x1, y1, 0, dist, lwMm, lwWorld, r, g, b, a, row, 0, 0)
      dist += Math.hypot(x1 - x, y1 - y)
      x = x1
      y = y1
    }
    while (i < n) {
      const op = ops[i]
      if (op === 0) {
        x = sx = ops[i + 1] - ox
        y = sy = ops[i + 2] - oy
        has = true
        dist = 0
        i += 3
      } else if (op === 1) {
        line(ops[i + 1] - ox, ops[i + 2] - oy)
        i += 3
      } else if (op === 2) {
        const cx = ops[i + 1] - ox
        const cy = ops[i + 2] - oy
        const rad = ops[i + 3]
        const a0 = ops[i + 4]
        const sweep = ops[i + 5] - a0
        const ax = cx + rad * Math.cos(a0)
        const ay = cy + rad * Math.sin(a0)
        if (!has) {
          x = sx = ax
          y = sy = ay
          has = true
          dist = 0
        } else if (Math.abs(ax - x) + Math.abs(ay - y) > tol) line(ax, ay)
        // pezzi abbastanza corti da stare in un rettangolo stretto anche da vicino
        const piece = Math.min(QUARTER, Math.sqrt((8 * SAG) / (rad * maxScale)))
        const k = Math.max(1, Math.min(256, Math.ceil(Math.abs(sweep) / piece)))
        const bulge = Math.tan(sweep / k / 4)
        const len = (rad * Math.abs(sweep)) / k
        for (let j = 1; j <= k; j++) {
          const t = a0 + (sweep * j) / k
          const x1 = cx + rad * Math.cos(t)
          const y1 = cy + rad * Math.sin(t)
          W.seg(x, y, x1, y1, bulge, dist, lwMm, lwWorld, r, g, b, a, row, 0, 0)
          dist += len
          x = x1
          y = y1
        }
        i += 7
      } else if (op === 3) {
        if (has && (x !== sx || y !== sy)) line(sx, sy)
        i += 1
      } else break
    }
  }

  // ── Punti ───────────────────────────────────────────────────────────────
  for (const d of scene.dots) {
    const [r, g, b] = d.rgb
    const p = d.pts
    for (let i = 0; i < p.length; i += 2) W.seg(p[i] - ox, p[i + 1] - oy, p[i] - ox, p[i + 1] - oy, 0, 0, 0.36, 0, r, g, b, 255, 0, FLAG_DOT, 0)
  }

  // ── Testi ───────────────────────────────────────────────────────────────
  let atlas = null
  if (scene.texts.length && canMakeGlyphs()) {
    atlas = new GlyphAtlas()
    /** Una riga di lettere: origine sulla linea di base, `a` = 1 em lungo la riga, `b` = 1 em in su. */
    const run = (text, family, bold, italic, x, y, ax, ay, bx, by, rgb, alpha) => {
      const adv = atlas.advances(text, family, bold, italic)
      const a = a255(alpha)
      let i = 0
      for (const ch of text) {
        const g = atlas.glyph(ch, family, bold, italic)
        if (g) W.glyph(x + ax * adv[i], y + ay * adv[i], ax, ay, bx, by, g.x0, g.y0, g.x1, g.y1, g.u0, g.v0, g.u1, g.v1, rgb[0], rgb[1], rgb[2], a)
        i++
      }
    }
    const rect = (x, y, ax, ay, bx, by, x0, y0, x1, y1, rgb, alpha) =>
      W.glyph(x, y, ax, ay, bx, by, x0, y0, x1, y1, SOLID_UV, SOLID_UV, SOLID_UV, SOLID_UV, rgb[0], rgb[1], rgb[2], a255(alpha))

    for (const t of scene.texts) {
      if (t.kind === 'text') {
        const w = worldWidth(t.text, t.h, t.wf, t.family, t.bold, t.italic)
        let { x, y, rot, wf, h } = t
        let dx = 0
        let dy = 0
        if (t.halign === 3 || t.halign === 5) {
          // allineato/adattato tra i due punti
          const span = Math.hypot(t.ax - t.ix, t.ay - t.iy)
          rot = Math.atan2(t.ay - t.iy, t.ax - t.ix)
          x = t.ix
          y = t.iy
          if (span > 0 && w > 0) {
            if (t.halign === 5) wf = (t.wf * span) / w
            else h = (t.h * span) / w
          }
        } else {
          if (t.halign === 1 || t.halign === 4) dx = -w / 2
          else if (t.halign === 2) dx = -w
          if (t.valign === 2 || t.halign === 4) dy = -h / 2
          else if (t.valign === 3) dy = -h
          if (t.valign === 1) dy = 0
        }
        const m = t.mirror ? -1 : 1
        const Xx = Math.cos(rot) * m
        const Xy = Math.sin(rot) * m
        const Yx = -Math.sin(rot)
        const Yy = Math.cos(rot)
        const em = h / CAP
        const lean = t.oblique ? Math.tan(t.oblique) : 0
        run(t.text, t.family, t.bold, t.italic, x + Xx * dx + Yx * dy - ox, y + Xy * dx + Yy * dy - oy, Xx * em * wf, Xy * em * wf, (Yx + Xx * lean) * em, (Yy + Xy * lean) * em, t.rgb, t.alpha)
        continue
      }
      // MTEXT: righe e parole già impaginate
      const L = layoutMtext(t)
      if (!L.lines.length) continue
      const col = (t.attachment - 1) % 3 // 0 sinistra, 1 centro, 2 destra
      const rowN = Math.floor((t.attachment - 1) / 3) // 0 alto, 1 mezzo, 2 basso
      const boxW = t.rectWidth > 0 ? t.rectWidth : L.width
      const boxH = L.height
      const left = col === 0 ? 0 : col === 1 ? -boxW / 2 : -boxW
      const top = rowN === 0 ? 0 : rowN === 1 ? boxH / 2 : boxH
      const m = t.mirror ? -1 : 1
      const Xx = Math.cos(t.rot) * m
      const Xy = Math.sin(t.rot) * m
      const Yx = -Math.sin(t.rot)
      const Yy = Math.cos(t.rot)
      const x = t.x - ox
      const y = t.y - oy
      if (t.mask) {
        const mw = t.extW || L.width
        const mh = t.extH || L.height
        const pad = (t.mask.scale - 1) * t.h
        const mx = col === 0 ? 0 : col === 1 ? -mw / 2 : -mw
        const my = rowN === 0 ? 0 : rowN === 1 ? mh / 2 : mh
        rect(x, y, Xx, Xy, Yx, Yy, mx - pad, my - mh - pad, mx + mw + pad, my + pad, [255, 255, 255], 1)
      }
      let baseline = top - L.lines[0].height
      for (const line of L.lines) {
        const lx = left + (col === 0 ? 0 : col === 1 ? (boxW - line.width) / 2 : boxW - line.width)
        for (const r of line.runs) {
          if (r.space) continue
          const px = x + Xx * (lx + r.x) + Yx * baseline
          const py = y + Xy * (lx + r.x) + Yy * baseline
          const em = r.h / CAP
          run(r.text, r.family, r.bold, r.italic, px, py, Xx * em * r.wf, Xy * em * r.wf, Yx * em, Yy * em, r.rgb, t.alpha)
          if (r.underline) rect(px, py, Xx, Xy, Yx, Yy, 0, -r.h * 0.18, r.width, -r.h * 0.12, r.rgb, t.alpha)
        }
        baseline -= L.lineStep
      }
    }
  }

  const table = dashes.done()
  return {
    kind: 'dwg',
    origin: [ox, oy],
    yUp: true,
    ordered: false,
    segs: segs.done(),
    segCount: segs.n,
    tris: tris.done(),
    triCount: tris.n,
    glyphs: glyphs.done(),
    glyphCount: glyphs.n,
    atlas: atlas ? atlas.done() : null,
    em: SDF_EM,
    rad: SDF_RAD,
    dashes: table.data,
    dashRows: table.rows,
    texts: !scene.texts.length || !!atlas,
  }
}

/** I blocchi di byte da cedere (senza copia) insieme al messaggio. */
export const transferOf = (p) => [p.segs, p.tris, p.glyphs, p.dashes.buffer, ...(p.atlas ? [p.atlas.data.buffer] : [])]
