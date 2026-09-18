// Pianta architettonica: muri campiti, porte con battuta, finestre, arredi
// schematici, catene di quote, nord, scala grafica e linea di sezione.
// Le misure dei layout sono in metri: aggiungere un layout = aggiungere dati.

import { svg, sheet, fit, rect, line, path, text, dim, north, scaleBar, circle, ellipse, poly, n } from './kit.js'

const WALL_IN = 0.07 // semi-spessore tramezza
const WALL_OUT = 0.27 // quota esterna del muro perimetrale dall'asse

const LAYOUTS = {
  casa: {
    title: 'PIANTA PIANO TERRA · PROGETTO',
    xs: [0, 4, 6.6, 10.2, 12.6],
    ys: [0, 3.4, 5, 8.4],
    rooms: [
      { name: 'Camera 1', x: 0, y: 0, w: 4, h: 3.4, kit: 'bed' },
      { name: 'Bagno', x: 4, y: 0, w: 2.6, h: 3.4, kit: 'bath', at: [5.3, 2.2] },
      { name: 'Cucina', x: 6.6, y: 0, w: 3.6, h: 3.4, kit: 'kitchen' },
      { name: 'Lavanderia', x: 10.2, y: 0, w: 2.4, h: 3.4, kit: 'laundry' },
      { name: 'Disimpegno', x: 0, y: 3.4, w: 6.6, h: 1.6 },
      { name: 'Camera 2', x: 0, y: 5, w: 3.8, h: 3.4, kit: 'bed2' },
      { name: 'Studio', x: 3.8, y: 5, w: 2.8, h: 3.4, kit: 'desk' },
      { name: 'Soggiorno · Pranzo', x: 6.6, y: 3.4, w: 6, h: 5, kit: 'living', at: [8.35, 5.7] },
    ],
    doors: [
      { x: 2.7, y: 3.4, dir: 'h', w: 0.9, hinge: 1, side: -1 },
      { x: 4.5, y: 3.4, dir: 'h', w: 0.8, hinge: 0, side: -1 },
      { x: 0.5, y: 5, dir: 'h', w: 0.9, hinge: 0, side: 1 },
      { x: 4.4, y: 5, dir: 'h', w: 0.9, hinge: 0, side: 1 },
      { x: 6.6, y: 3.65, dir: 'v', w: 1.1, leaf: false },
      { x: 7.7, y: 3.4, dir: 'h', w: 2.2, leaf: false },
      { x: 10.2, y: 1.3, dir: 'v', w: 0.8, hinge: 0, side: 1 },
      { x: 7.5, y: 8.4, dir: 'h', w: 1.1, hinge: 0, side: -1, ext: true },
    ],
    windows: [
      { x: 1.2, y: 0, dir: 'h', w: 1.6, out: -1 },
      { x: 4.9, y: 0, dir: 'h', w: 0.8, out: -1 },
      { x: 7.5, y: 0, dir: 'h', w: 1.8, out: -1 },
      { x: 12.6, y: 1.2, dir: 'v', w: 1, out: 1 },
      { x: 12.6, y: 3.9, dir: 'v', w: 1.7, out: 1 },
      { x: 9.1, y: 8.4, dir: 'h', w: 2.2, out: 1 },
      { x: 0, y: 5.9, dir: 'v', w: 1.6, out: -1 },
      { x: 1, y: 8.4, dir: 'h', w: 1.6, out: 1 },
      { x: 4.5, y: 8.4, dir: 'h', w: 1.4, out: 1 },
    ],
    porch: { x: 6.6, y: 8.4, w: 6, h: 2.2, cols: 3 },
    cut: { y: 7.55, label: 'A' },
  },

  rustico: {
    title: 'PIANTA PIANO TERRA · RECUPERO',
    xs: [0, 7.2, 9.6, 14],
    ys: [0, 3.6, 6.4],
    rooms: [
      { name: 'Zona giorno', x: 0, y: 0, w: 7.2, h: 6.4, kit: 'living2' },
      { name: 'Scala', x: 7.2, y: 0, w: 2.4, h: 3.6, kit: 'stair' },
      { name: 'Bagno', x: 7.2, y: 3.6, w: 2.4, h: 2.8, kit: 'bath', at: [8.4, 5.55] },
      { name: 'Camera', x: 9.6, y: 0, w: 4.4, h: 6.4, kit: 'bed' },
    ],
    doors: [
      { x: 7.2, y: 0.5, dir: 'v', w: 1.3, leaf: false },
      { x: 7.2, y: 4.3, dir: 'v', w: 0.8, hinge: 0, side: 1 },
      { x: 9.6, y: 2.4, dir: 'v', w: 0.9, hinge: 1, side: 1 },
      { x: 1.95, y: 6.4, dir: 'h', w: 1.1, hinge: 0, side: -1, ext: true },
    ],
    windows: [
      { x: 1, y: 0, dir: 'h', w: 1.6, out: -1 },
      { x: 4.2, y: 0, dir: 'h', w: 1.6, out: -1 },
      { x: 10.8, y: 0, dir: 'h', w: 1.6, out: -1 },
      { x: 0.4, y: 6.4, dir: 'h', w: 1.2, out: 1 },
      { x: 5, y: 6.4, dir: 'h', w: 1.5, out: 1 },
      { x: 10.6, y: 6.4, dir: 'h', w: 2, out: 1 },
      { x: 14, y: 2.2, dir: 'v', w: 2, out: 1 },
      { x: 0, y: 2, dir: 'v', w: 2.4, out: -1 },
      { x: 7.9, y: 6.4, dir: 'h', w: 0.8, out: 1 },
    ],
    porch: { x: 0, y: 6.4, w: 7.2, h: 2.4, cols: 4 },
    cut: { y: 2.6, label: 'B' },
  },
}

export function floorplan({ w = 1200, h = 900, tone = 'paper', variant = 'casa', code = 'AP-00', tav = 'TAV. 02', label, bare = false } = {}) {
  const L = LAYOUTS[variant] || LAYOUTS.casa
  const width = L.xs.at(-1)
  const depth = L.ys.at(-1) + (L.porch ? L.porch.h : 0)

  const sh = bare
    ? { markup: '', box: { x: w * 0.12, y: h * 0.14, w: w * 0.76, h: h * 0.72 } }
    : sheet(w, h, { code, title: L.title, scale: 'SCALA 1:100', tav })
  // margine per le catene di quote (in alto e a sinistra)
  const box = { x: sh.box.x + 58, y: sh.box.y + 62, w: sh.box.w - 80, h: sh.box.h - 84 }
  const T = fit({ x: 0, y: 0, w: width, h: depth }, box)
  const { X, Y, s } = T
  const R = (x, y, ww, hh, c, extra) => rect(X(x), Y(y), ww * s, hh * s, c, extra)

  let out = sh.markup

  // 1 · muri: campitura piena, poi i vani "scavati"
  const e = WALL_OUT
  for (const r of L.rooms) out += R(r.x - e, r.y - e, r.w + e * 2, r.h + e * 2, 'a-fill')
  for (const r of L.rooms) out += R(r.x + WALL_IN, r.y + WALL_IN, r.w - WALL_IN * 2, r.h - WALL_IN * 2, 'a-bg')

  // 2 · portico
  if (L.porch) {
    const p = L.porch
    out += R(p.x, p.y + e, p.w, p.h - e, 'a-s2 a-dash')
    for (let i = 0; i < p.cols; i++) {
      const cx = p.x + 0.2 + ((p.w - 0.4) / (p.cols - 1)) * i
      out += R(cx - 0.15, p.y + p.h - 0.3, 0.3, 0.3, 'a-fill')
    }
    out += text(X(p.x + p.w / 2), Y(p.y + p.h / 2 + 0.35), 'PORTICO', { c: 'a-tm', size: 10, anchor: 'middle', spacing: '.08em' })
  }

  // 3 · aperture
  for (const d of L.doors) out += door(d, T)
  for (const win of L.windows) out += windowSymbol(win, T)

  // 4 · arredi
  for (const r of L.rooms) if (r.kit && KITS[r.kit]) out += KITS[r.kit](r, T)

  // 5 · etichette dei vani
  for (const r of L.rooms) {
    if (r.kit === 'stair') continue
    const cx = X(r.at ? r.at[0] : r.x + r.w / 2)
    const cy = Y(r.at ? r.at[1] : r.y + r.h / 2)
    const area = ((r.w - WALL_IN * 2) * (r.h - WALL_IN * 2)).toFixed(2)
    const small = r.w * s < 150
    out += rect(cx - (small ? 40 : 62), cy - 17, small ? 80 : 124, 34, 'a-bg')
    out += text(cx, cy - 2, r.name.toUpperCase(), { size: small ? 9 : 10.5, anchor: 'middle', spacing: '.06em' })
    out += text(cx, cy + 12, `${area} m²`, { c: 'a-tm', size: 9.5, anchor: 'middle' })
  }

  // 6 · linea di sezione (accento)
  if (L.cut && !bare) {
    const y = Y(L.cut.y)
    const x1 = X(-e) - 34
    const x2 = X(width + e) + 34
    out += path(`M${n(x1)} ${n(y)}H${n(x2)}`, 'a-sa a-dashdot')
    out += poly([[x1, y - 12], [x1 + 9, y], [x1 - 9, y]], 'a-acc') + poly([[x2, y - 12], [x2 + 9, y], [x2 - 9, y]], 'a-acc')
    out += text(x1, y + 18, L.cut.label, { c: 'a-ta', size: 13, anchor: 'middle', weight: 500 })
    out += text(x2, y + 18, L.cut.label + '′', { c: 'a-ta', size: 13, anchor: 'middle', weight: 500 })
  }

  // 7 · quote
  if (!bare) {
    const top = Y(-e)
    for (let i = 0; i < L.xs.length - 1; i++) {
      out += dim(X(L.xs[i]), top, X(L.xs[i + 1]), top, (L.xs[i + 1] - L.xs[i]).toFixed(2), { off: -24 })
    }
    out += dim(X(0), top, X(width), top, width.toFixed(2), { off: -48 })
    const left = X(-e)
    for (let i = 0; i < L.ys.length - 1; i++) {
      out += dim(left, Y(L.ys[i]), left, Y(L.ys[i + 1]), (L.ys[i + 1] - L.ys[i]).toFixed(2), { off: -24 })
    }
    out += dim(left, Y(0), left, Y(L.ys.at(-1)), L.ys.at(-1).toFixed(2), { off: -48 })

    out += north(sh.box.x + sh.box.w - 8, sh.box.y + sh.box.h - 16, 20)
    out += scaleBar(sh.box.x - 8, sh.box.y + sh.box.h + 6, s, 5, ['0', '1', '2', '3', '4', '5 m'])
  }

  return svg({ w, h, tone, label: label || 'Pianta architettonica quotata, scala 1:100', body: out })
}

// ── Aperture ─────────────────────────────────────────────────────────────────

function door({ x, y, dir, w, hinge = 0, side = 1, leaf = true, ext = false }, { X, Y, s }) {
  const half = ext ? 0.33 : 0.11
  let out = ''
  if (dir === 'h') {
    out += rect(X(x), Y(y - half), w * s, half * 2 * s, 'a-bg')
    if (!leaf) return out + line(X(x), Y(y), X(x + w), Y(y), 'a-s2 a-dash')
    const hx = x + (hinge ? w : 0)
    const ox = x + (hinge ? 0 : w)
    out += arcLeaf([hx, y], [hx, y + side * w], [ox, y], w, { X, Y, s })
  } else {
    out += rect(X(x - half), Y(y), half * 2 * s, w * s, 'a-bg')
    if (!leaf) return out + line(X(x), Y(y), X(x), Y(y + w), 'a-s2 a-dash')
    const hy = y + (hinge ? w : 0)
    const oy = y + (hinge ? 0 : w)
    out += arcLeaf([x, hy], [x + side * w, hy], [x, oy], w, { X, Y, s })
  }
  return out
}

function arcLeaf(c, a, b, r, { X, Y, s }) {
  const crossP = (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0])
  const sweep = crossP > 0 ? 1 : 0
  return (
    line(X(c[0]), Y(c[1]), X(a[0]), Y(a[1]), 'a-s') +
    path(`M${n(X(a[0]))} ${n(Y(a[1]))}A${n(r * s)} ${n(r * s)} 0 0 ${sweep} ${n(X(b[0]))} ${n(Y(b[1]))}`, 'a-s2')
  )
}

function windowSymbol({ x, y, dir, w, out: o }, { X, Y, s }) {
  const outer = o * WALL_OUT
  const inner = -o * WALL_IN
  let out = ''
  if (dir === 'h') {
    const y1 = Math.min(y + outer, y + inner)
    out += rect(X(x), Y(y1 - 0.02), w * s, (WALL_OUT + WALL_IN + 0.04) * s, 'a-bg')
    out += rect(X(x), Y(y1), w * s, (WALL_OUT + WALL_IN) * s, 'a-s')
    out += line(X(x), Y(y + (outer + inner) / 2), X(x + w), Y(y + (outer + inner) / 2), 'a-s2')
    out += line(X(x - 0.06), Y(y + outer + o * 0.05), X(x + w + 0.06), Y(y + outer + o * 0.05), 'a-s2')
  } else {
    const x1 = Math.min(x + outer, x + inner)
    out += rect(X(x1 - 0.02), Y(y), (WALL_OUT + WALL_IN + 0.04) * s, w * s, 'a-bg')
    out += rect(X(x1), Y(y), (WALL_OUT + WALL_IN) * s, w * s, 'a-s')
    out += line(X(x + (outer + inner) / 2), Y(y), X(x + (outer + inner) / 2), Y(y + w), 'a-s2')
    out += line(X(x + outer + o * 0.05), Y(y - 0.06), X(x + outer + o * 0.05), Y(y + w + 0.06), 'a-s2')
  }
  return out
}

// ── Arredi schematici (coordinate in metri, relative al vano) ────────────────

const KITS = {
  bed(r, T) {
    const bx = r.x + r.w - 2.1 - 0.5
    const by = r.y + 0.25
    return (
      box(T, bx, by, 1.7, 2.05) +
      box(T, bx + 0.1, by + 0.1, 0.7, 0.42, 'a-s2', 3) +
      box(T, bx + 0.9, by + 0.1, 0.7, 0.42, 'a-s2', 3) +
      seg(T, bx, by + 0.75, bx + 1.7, by + 0.75) +
      box(T, bx - 0.5, by, 0.42, 0.42) +
      box(T, bx + 1.78, by, 0.42, 0.42) +
      wardrobe(T, r.x + 0.2, r.y + 0.2, 0.6, Math.min(2.2, r.h - 1.4))
    )
  },
  bed2(r, T) {
    const bx = r.x + 0.95
    const by = r.y + r.h - 2.2
    return (
      box(T, bx, by, 1.7, 2.0) +
      box(T, bx + 0.1, by + 1.5, 0.7, 0.4, 'a-s2', 3) +
      box(T, bx + 0.9, by + 1.5, 0.7, 0.4, 'a-s2', 3) +
      seg(T, bx, by + 1.3, bx + 1.7, by + 1.3) +
      wardrobe(T, r.x + r.w - 0.8, r.y + 0.25, 0.6, 1.9)
    )
  },
  bath(r, T) {
    const { X, Y, s } = T
    const x = r.x + 0.2
    const y = r.y + 0.2
    return (
      box(T, x, y, 0.9, 0.9) +
      seg(T, x, y, x + 0.9, y + 0.9) +
      seg(T, x + 0.9, y, x, y + 0.9) +
      box(T, r.x + r.w - 0.72, y + 0.15, 0.52, 0.2) +
      ellipse(X(r.x + r.w - 0.46), Y(y + 0.62), 0.2 * s, 0.27 * s, 'a-s2') +
      box(T, x + 1.05, y, 0.6, 0.45, 'a-s2', 4) +
      circle(X(x + 1.35), Y(y + 0.22), 0.12 * s, 'a-s2')
    )
  },
  kitchen(r, T) {
    const { X, Y, s } = T
    const x = r.x + 0.15
    const y = r.y + 0.15
    let out = path(
      `M${n(X(x))} ${n(Y(y))}H${n(X(x + r.w - 0.3))}V${n(Y(y + 0.62))}H${n(X(x + 0.62))}V${n(Y(y + 2.5))}H${n(X(x))}Z`,
      'a-s2',
    )
    for (const [cx, cy] of [[0, 0], [0.32, 0], [0, 0.3], [0.32, 0.3]]) out += circle(X(x + 1.3 + cx), Y(y + 0.17 + cy), 0.1 * s, 'a-s2')
    out += box(T, x + 2.2, y + 0.1, 0.7, 0.42, 'a-s2', 4)
    out += box(T, x + 0.04, y + 1.7, 0.54, 0.7)
    return out
  },
  laundry(r, T) {
    const { X, Y, s } = T
    let out = ''
    for (let i = 0; i < 2; i++) {
      const x = r.x + 0.25 + i * 0.72
      out += box(T, x, r.y + 0.2, 0.62, 0.62) + circle(X(x + 0.31), Y(r.y + 0.51), 0.2 * s, 'a-s2')
    }
    return out + box(T, r.x + 0.25, r.y + r.h - 0.75, r.w - 0.5, 0.5)
  },
  desk(r, T) {
    const { X, Y, s } = T
    return (
      box(T, r.x + 0.35, r.y + r.h - 1.0, r.w - 0.7, 0.72) +
      circle(X(r.x + r.w / 2), Y(r.y + r.h - 1.42), 0.25 * s, 'a-s2') +
      box(T, r.x + r.w - 0.62, r.y + 0.3, 0.4, 1.5)
    )
  },
  living(r, T) {
    const { X, Y, s } = T
    // divano contro la parete est, tappeto e tavolino; tavolo da pranzo verso la cucina
    const sx = r.x + r.w - 1.12
    const sy = r.y + r.h - 2.75
    let out =
      box(T, sx, sy, 0.95, 2.4, 'a-s2', 4) +
      seg(T, sx + 0.68, sy + 0.06, sx + 0.68, sy + 2.34) +
      box(T, sx - 2.35, sy + 0.2, 2.0, 2.0, 'a-s2 a-dash') +
      box(T, sx - 1.8, sy + 0.75, 0.9, 0.9, 'a-s2', 3)
    const tx = r.x + 3.1
    const ty = r.y + 0.95
    out += box(T, tx, ty, 2.0, 0.95)
    for (let i = 0; i < 3; i++) {
      out += box(T, tx + 0.15 + i * 0.64, ty - 0.5, 0.42, 0.42, 'a-s2', 3)
      out += box(T, tx + 0.15 + i * 0.64, ty + 1.03, 0.42, 0.42, 'a-s2', 3)
    }
    // pianta in vaso accanto all'ingresso
    return out + circle(X(r.x + 0.55), Y(r.y + r.h - 0.55), 0.28 * s, 'a-s2') + circle(X(r.x + 0.55), Y(r.y + r.h - 0.55), 0.1 * s, 'a-s2')
  },
  living2(r, T) {
    const { X, Y, s } = T
    const kx = r.x + 0.15
    const ky = r.y + 0.15
    let out = box(T, kx, ky, 0.62, 3.4)
    for (const cy of [0.5, 0.85]) for (const cx of [0.16, 0.46]) out += circle(X(kx + cx), Y(ky + cy), 0.1 * s, 'a-s2')
    out += box(T, kx + 0.08, ky + 1.5, 0.46, 0.7, 'a-s2', 4)
    out += box(T, r.x + 1.6, r.y + 1.0, 2.2, 0.95)
    for (let i = 0; i < 3; i++) {
      out += box(T, r.x + 1.75 + i * 0.7, r.y + 0.5, 0.42, 0.42, 'a-s2', 3)
      out += box(T, r.x + 1.75 + i * 0.7, r.y + 2.03, 0.42, 0.42, 'a-s2', 3)
    }
    const sx = r.x + 3.2
    const sy = r.y + r.h - 2.9
    out += box(T, sx, sy + 1.7, 2.6, 0.9, 'a-s2', 4) + seg(T, sx + 0.05, sy + 2.35, sx + 2.55, sy + 2.35)
    out += box(T, sx + 0.3, sy, 2.0, 1.3, 'a-s2 a-dash') + box(T, sx + 0.75, sy + 0.4, 1.1, 0.5, 'a-s2', 3)
    // camino
    out += box(T, r.x + r.w - WALL_IN - 0.36, r.y + 2.45, 0.36, 1.3, 'a-fill')
    return out
  },
  stair(r, T) {
    const { X, Y, s } = T
    const x = r.x + 0.25
    const y = r.y + 0.2
    const ww = r.w - 0.5
    const hh = r.h - 0.4
    let out = box(T, x, y, ww, hh)
    const steps = Math.floor(hh / 0.27)
    for (let i = 1; i < steps; i++) out += seg(T, x, y + i * 0.27, x + ww, y + i * 0.27)
    const cx = x + ww / 2
    out += line(X(cx), Y(y + hh - 0.15), X(cx), Y(y + 0.35), 'a-s')
    out += poly([[X(cx), Y(y + 0.2)], [X(cx) - 5, Y(y + 0.45)], [X(cx) + 5, Y(y + 0.45)]], 'a-fill')
    out += circle(X(cx), Y(y + hh - 0.15), 3, 'a-fill')
    out += path(`M${n(X(x - 0.08))} ${n(Y(y + hh * 0.52))}L${n(X(x + ww + 0.08))} ${n(Y(y + hh * 0.38))}`, 'a-s')
    out += text(X(cx + 0.35), Y(y + hh - 0.25), 'SALE', { c: 'a-tm', size: 9 })
    return out
  },
}

const box = ({ X, Y, s }, x, y, w, h, c = 'a-s2', rx = 0) => rect(X(x), Y(y), w * s, h * s, c, rx ? ` rx="${rx}"` : '')
const seg = ({ X, Y }, x1, y1, x2, y2, c = 'a-s2') => line(X(x1), Y(y1), X(x2), Y(y2), c)
const wardrobe = (T, x, y, w, h) => box(T, x, y, w, h) + seg(T, x, y, x + w, y + h) + seg(T, x + w, y, x, y + h)
