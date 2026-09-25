// Disegno di una scena (src/dwg/scene.js) su un canvas 2D. La vista è un
// rettangolo del disegno (unità del DWG) portato su un rettangolo di pixel;
// l'asse y del disegno va in su, quello del canvas in giù. Gli spessori di
// linea sono in millimetri di carta: si converte con i pixel per millimetro
// del foglio. I testi sono disposti con le misure vere del carattere e
// tenuti in cache tra un disegno e l'altro.

import { ACI } from './geom.js'

const CAP = 0.72 // altezza delle maiuscole rispetto al corpo del carattere (Arial ≈ 0,716)

const rgba = (rgb, a = 1) => (a >= 1 ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`)

/** Un tracciato codificato (opcodes) → chiamate al contesto. */
function tracePath(ctx, ops) {
  const n = ops.length
  let i = 0
  while (i < n) {
    const op = ops[i]
    if (op === 0) {
      ctx.moveTo(ops[i + 1], ops[i + 2])
      i += 3
    } else if (op === 1) {
      ctx.lineTo(ops[i + 1], ops[i + 2])
      i += 3
    } else if (op === 2) {
      ctx.arc(ops[i + 1], ops[i + 2], ops[i + 3], ops[i + 4], ops[i + 5], !ops[i + 6])
      i += 7
    } else if (op === 3) {
      ctx.closePath()
      i += 1
    } else if (op === 4) {
      ctx.ellipse(ops[i + 1], ops[i + 2], ops[i + 3], ops[i + 4], ops[i + 5], ops[i + 6], ops[i + 7], !ops[i + 8])
      i += 9
    } else break
  }
}

const overlaps = (b, v) => !b || (b[0] <= v[2] && b[2] >= v[0] && b[1] <= v[3] && b[3] >= v[1])

/**
 * Disegna la scena.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} scene
 * @param {{ view: number[], px: number[], pxPerMm: number, paper?: number[], clip?: number[], minPx?: number }} o
 *   `view`: [x0, y0, x1, y1] del disegno da mostrare; `px`: [x, y, w, h] in pixel
 *   del canvas dove va; `pxPerMm`: pixel per millimetro di carta (spessori);
 *   `clip`: rettangolo del disegno oltre il quale non si disegna (il foglio).
 */
export function drawScene(ctx, scene, o) {
  const [vx0, vy0, vx1, vy1] = o.view
  const [px, py, pw, ph] = o.px
  const s = pw / (vx1 - vx0)
  const sy = ph / (vy1 - vy0)
  const scale = Math.min(s, sy)
  const minPx = o.minPx ?? 0.8
  const paper = o.paper || [255, 255, 255]

  ctx.save()
  ctx.beginPath()
  ctx.rect(px, py, pw, ph)
  ctx.clip()
  ctx.fillStyle = rgba(paper)
  ctx.fillRect(px, py, pw, ph)

  // mondo → canvas: x' = px + (x - vx0)·scale ; y' = py + (vy1 - y)·scale
  const base = [scale, 0, 0, -scale, px - vx0 * scale, py + vy1 * scale]
  ctx.setTransform(...base)
  if (o.clip) {
    ctx.beginPath()
    ctx.rect(o.clip[0], o.clip[1], o.clip[2] - o.clip[0], o.clip[3] - o.clip[1])
    ctx.clip()
  }
  const view = [vx0, vy0, vx1, vy1]
  const lineWidth = (mm, world) => {
    if (world > 0) return world
    return Math.max(minPx, mm * o.pxPerMm) / scale
  }
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // riempimenti (solidi, tratteggi pieni, wipeout) nell'ordine del disegno
  for (const f of scene.fills) {
    if (!overlaps(f.bounds, view)) continue
    ctx.beginPath()
    tracePath(ctx, f.ops)
    ctx.fillStyle = f.paper ? rgba(paper) : rgba(f.rgb, f.alpha)
    ctx.fill('evenodd')
  }

  // motivi di tratteggio: righe ritagliate dal contorno
  for (const h of scene.hatches) {
    if (!overlaps(h.bounds, view)) continue
    ctx.save()
    ctx.beginPath()
    tracePath(ctx, h.clip.ops)
    ctx.clip('evenodd')
    ctx.beginPath()
    const g = h.segs
    for (let i = 0; i < g.length; i += 4) {
      ctx.moveTo(g[i], g[i + 1])
      ctx.lineTo(g[i + 2], g[i + 3])
    }
    ctx.strokeStyle = rgba(h.rgb, h.alpha)
    ctx.lineWidth = lineWidth(h.lw, 0)
    ctx.setLineDash([])
    ctx.stroke()
    ctx.restore()
  }

  // tracciati, un tratto per stile
  for (const b of scene.strokes) {
    if (!overlaps(b.bounds, view)) continue
    ctx.beginPath()
    tracePath(ctx, b.ops)
    ctx.strokeStyle = rgba(b.rgb, b.alpha)
    ctx.lineWidth = lineWidth(b.lw, b.lwWorld)
    if (b.dash) {
      // i tratti restano leggibili anche da lontano: sotto i 3 px diventano linea continua
      const period = b.dash.reduce((a, v) => a + v, 0) * scale
      ctx.setLineDash(period < 3 ? [] : b.dash)
    } else ctx.setLineDash([])
    ctx.stroke()
  }
  ctx.setLineDash([])

  // punti
  const dotR = Math.max(1.2, 0.18 * o.pxPerMm) / scale
  for (const d of scene.dots) {
    ctx.fillStyle = rgba(d.rgb)
    ctx.beginPath()
    const p = d.pts
    for (let i = 0; i < p.length; i += 2) {
      if (p[i] < vx0 || p[i] > vx1 || p[i + 1] < vy0 || p[i + 1] > vy1) continue
      ctx.moveTo(p[i] + dotR, p[i + 1])
      ctx.arc(p[i], p[i + 1], dotR, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  // testi, con la maschera di sfondo se c'è
  for (const t of scene.texts) {
    const r = Math.max(t.h * 2, t.extW || 0, t.extH || 0, t.h * 0.75 * (t.text ? t.text.length : 40))
    if (t.x + r < vx0 || t.x - r > vx1 || t.y + r < vy0 || t.y - r > vy1) continue
    if (t.h * scale < 0.6) continue // più piccolo di un pixel: non si vede
    drawText(ctx, t, base, scale, paper)
  }
  ctx.restore()
}

// ── Testi ──────────────────────────────────────────────────────────────────

let measurer = null
const REF = 100 // corpo di riferimento per le misure, in px
const widthCache = new Map()

function measureWidth(text, family, bold, italic) {
  const key = `${bold ? 'b' : ''}${italic ? 'i' : ''}|${family}|${text}`
  let w = widthCache.get(key)
  if (w != null) return w
  if (!measurer) {
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(8, 8) : document.createElement('canvas')
    measurer = c.getContext('2d')
  }
  measurer.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${REF}px ${family}`
  w = measurer.measureText(text).width / REF // in em
  if (widthCache.size > 20000) widthCache.clear()
  widthCache.set(key, w)
  return w
}

/** Larghezza nel mondo di un testo alto `h` (altezza delle maiuscole). */
const worldWidth = (text, h, wf, family, bold, italic) => (measureWidth(text, family, bold, italic) * h * wf) / CAP

/**
 * Impaginazione di un MTEXT: righe di run con posizione, calcolata una volta.
 * Ogni riga: { runs: [{text, x, h, wf, family, bold, italic, rgb, underline}], width, height, baseline }
 */
function layoutMtext(t) {
  if (t.layout) return t.layout
  const lines = []
  const maxW = t.rectWidth > 0 ? t.rectWidth : Infinity
  for (const p of t.paragraphs) {
    // parole con il proprio stile
    const words = []
    for (const r of p.runs) {
      const parts = r.text.split(/(\s+)/)
      for (const part of parts) {
        if (!part) continue
        const h = t.h * (r.h || 1)
        words.push({ text: part, space: /^\s+$/.test(part), h, wf: (r.w || 1) * t.wf, family: r.family ? familyOf(r.family) : t.family, bold: r.bold, italic: r.italic, rgb: r.rgb != null ? rgbOfInt(r.rgb) : r.color != null ? aciOf(r.color, t.rgb) : t.rgb, underline: r.underline })
      }
    }
    let line = { runs: [], width: 0, height: t.h }
    const push = () => {
      lines.push(line)
      line = { runs: [], width: 0, height: t.h }
    }
    for (const w of words) {
      const ww = worldWidth(w.text, w.h, w.wf, w.family, w.bold, w.italic)
      if (!w.space && line.width + ww > maxW && line.runs.length) {
        // toglie lo spazio finale della riga
        while (line.runs.length && line.runs[line.runs.length - 1].space) line.width -= line.runs.pop().width
        push()
      }
      if (w.space && !line.runs.length) continue
      line.runs.push({ ...w, x: line.width, width: ww })
      line.width += ww
      if (w.h > line.height) line.height = w.h
    }
    while (line.runs.length && line.runs[line.runs.length - 1].space) line.width -= line.runs.pop().width
    push()
  }
  const lineStep = t.h * t.lineSpacing
  let width = 0
  for (const l of lines) if (l.width > width) width = l.width
  const height = lines.length ? lines[0].height + (lines.length - 1) * lineStep : 0
  t.layout = { lines, width, height, lineStep }
  return t.layout
}

const familyCache = new Map()
function familyOf(name) {
  let f = familyCache.get(name)
  if (!f) familyCache.set(name, (f = `"${name}", Arial, Helvetica, sans-serif`))
  return f
}
const rgbOfInt = (v) => [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]
function aciOf(i, fallback) {
  if (i === 256 || i === 0) return fallback
  if (i === 7) return [0, 0, 0]
  return ACI[i] || fallback
}

function setFont(ctx, h, scale, family, bold, italic) {
  const px = (h * scale) / CAP
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${px.toFixed(3)}px ${family}`
}

/** Porta il contesto in pixel con l'origine nel punto (x, y) del mondo, ruotato: da qui si scrive in px. */
function textFrame(ctx, base, x, y, rot, mirror) {
  const sx = base[0] * x + base[2] * y + base[4]
  const sy = base[1] * x + base[3] * y + base[5]
  ctx.setTransform(1, 0, 0, 1, sx, sy)
  ctx.rotate(-rot)
  if (mirror) ctx.scale(-1, 1)
}

function drawText(ctx, t, base, scale, paper) {
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  if (t.kind === 'text') {
    const w = worldWidth(t.text, t.h, t.wf, t.family, t.bold, t.italic)
    let x = t.x
    let y = t.y
    let rot = t.rot
    let wf = t.wf
    let h = t.h
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
        else {
          const k = span / w
          h = t.h * k
          wf = t.wf
        }
      }
    } else {
      const ww = w
      if (t.halign === 1 || t.halign === 4) dx = -ww / 2
      else if (t.halign === 2) dx = -ww
      if (t.valign === 1) dy = 0
      else if (t.valign === 2 || t.halign === 4) dy = -h / 2
      else if (t.valign === 3) dy = -h
      if (t.valign === 1) dy = 0
    }
    textFrame(ctx, base, x, y, rot, t.mirror)
    setFont(ctx, h, scale, t.family, t.bold, t.italic)
    ctx.fillStyle = rgba(t.rgb, t.alpha)
    ctx.save()
    ctx.translate(dx * scale, -dy * scale)
    if (t.oblique) ctx.transform(1, 0, Math.tan(t.oblique), 1, 0, 0)
    ctx.scale(wf, 1)
    ctx.fillText(t.text, 0, 0)
    ctx.restore()
    ctx.restore()
    return
  }
  // MTEXT
  const L = layoutMtext(t)
  if (!L.lines.length) {
    ctx.restore()
    return
  }
  const a = t.attachment
  const col = (a - 1) % 3 // 0 sinistra, 1 centro, 2 destra
  const row = Math.floor((a - 1) / 3) // 0 alto, 1 mezzo, 2 basso
  const boxW = t.rectWidth > 0 ? t.rectWidth : L.width
  const boxH = L.height
  // origine del blocco (angolo in alto a sinistra) rispetto al punto di inserimento
  const ox = col === 0 ? 0 : col === 1 ? -boxW / 2 : -boxW
  const oy = row === 0 ? 0 : row === 1 ? boxH / 2 : boxH
  textFrame(ctx, base, t.x, t.y, t.rot, t.mirror)
  if (t.mask) {
    const mw = t.extW || L.width
    const mh = t.extH || L.height
    const pad = (t.mask.scale - 1) * t.h
    const mx = col === 0 ? 0 : col === 1 ? -mw / 2 : -mw
    const my = row === 0 ? 0 : row === 1 ? mh / 2 : mh
    ctx.fillStyle = rgba(paper)
    ctx.fillRect((mx - pad) * scale, -(my + pad) * scale, (mw + pad * 2) * scale, (mh + pad * 2) * scale)
  }
  let baseline = oy - L.lines[0].height
  for (const line of L.lines) {
    const lx = ox + (col === 0 ? 0 : col === 1 ? (boxW - line.width) / 2 : boxW - line.width)
    for (const r of line.runs) {
      if (r.space) continue
      setFont(ctx, r.h, scale, r.family, r.bold, r.italic)
      ctx.fillStyle = rgba(r.rgb, t.alpha)
      ctx.save()
      ctx.translate((lx + r.x) * scale, -baseline * scale)
      ctx.scale(r.wf, 1)
      ctx.fillText(r.text, 0, 0)
      if (r.underline) {
        ctx.fillRect(0, r.h * scale * 0.12, (r.width / r.wf) * scale, Math.max(1, r.h * scale * 0.06))
      }
      ctx.restore()
    }
    baseline -= L.lineStep
  }
  ctx.restore()
}

/** Prepara le misure dei testi (utile per farlo una volta sola). */
export function prepareTexts(scene) {
  for (const t of scene.texts) if (t.kind === 'mtext') layoutMtext(t)
}
