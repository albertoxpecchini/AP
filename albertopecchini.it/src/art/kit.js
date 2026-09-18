// ─────────────────────────────────────────────────────────────────────────────
//  KIT DI DISEGNO — primitive SVG condivise dalle tavole generate.
//
//  Le tavole sono i segnaposto visivi del portfolio: disegni vettoriali
//  generati a build-time, coerenti con il linguaggio tecnico del sito.
//  I colori arrivano dalle custom properties definite in `styles/art.css`
//  (classi `a-*`), quindi ogni tavola si adatta ai temi chiaro e scuro.
// ─────────────────────────────────────────────────────────────────────────────

/** PRNG deterministico: stessa `seed`, stesso disegno. */
export function rng(seed = 1) {
  let a = (seed * 2654435761) >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  }
}

/** Numero compatto per gli attributi SVG. */
export const n = (v) => {
  const r = Math.round(v * 10) / 10
  return Object.is(r, -0) ? 0 : r
}

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

let uid = 0
/** Id univoco per pattern e clipPath (più tavole convivono nella stessa pagina). */
export const nextId = (prefix = 'a') => `${prefix}${(++uid).toString(36)}`

// ── Primitive ────────────────────────────────────────────────────────────────

export const line = (x1, y1, x2, y2, c = 'a-s') => `<path class="${c}" d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}"/>`

export const path = (d, c = 'a-s', extra = '') => `<path class="${c}" d="${d}"${extra}/>`

export const rect = (x, y, w, h, c = 'a-s', extra = '') =>
  `<rect class="${c}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${extra}/>`

export const circle = (cx, cy, r, c = 'a-s') => `<circle class="${c}" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"/>`

export const ellipse = (cx, cy, rx, ry, c = 'a-s', extra = '') =>
  `<ellipse class="${c}" cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"${extra}/>`

export const pts = (points) => points.map(([x, y]) => `${n(x)} ${n(y)}`).join(' ')

export const poly = (points, c = 'a-s') => `<polygon class="${c}" points="${pts(points)}"/>`

export const polyline = (points, c = 'a-s') => `<polyline class="${c}" points="${pts(points)}"/>`

export const group = (children, extra = '') => `<g${extra}>${Array.isArray(children) ? children.join('') : children}</g>`

/**
 * Testo. `size` in unità del viewBox; `anchor`: start | middle | end.
 * Classi: a-t (inchiostro) · a-tm (attenuato) · a-ta (accento) · a-ti (invertito)
 */
export function text(x, y, str, { c = 'a-t', size = 12, anchor = 'start', rotate = 0, weight, spacing, family } = {}) {
  const a = [
    `class="${c}"`,
    `x="${n(x)}"`,
    `y="${n(y)}"`,
    `font-size="${size}"`,
    anchor !== 'start' && `text-anchor="${anchor}"`,
    rotate && `transform="rotate(${rotate} ${n(x)} ${n(y)})"`,
    weight && `font-weight="${weight}"`,
    spacing !== undefined && `letter-spacing="${spacing}"`,
    family && `font-family="${family}"`,
  ]
  return `<text ${a.filter(Boolean).join(' ')}>${escText(str)}</text>`
}

/** Curva chiusa morbida (Catmull-Rom → Bézier) attraverso i punti dati. */
export function blob(points, closed = true) {
  const p = points
  const len = p.length
  const at = (i) => p[(i + len) % len]
  let d = `M${n(p[0][0])} ${n(p[0][1])}`
  const last = closed ? len : len - 1
  for (let i = 0; i < last; i++) {
    const p0 = closed ? at(i - 1) : p[Math.max(0, i - 1)]
    const p1 = at(i)
    const p2 = closed ? at(i + 1) : p[Math.min(len - 1, i + 1)]
    const p3 = closed ? at(i + 2) : p[Math.min(len - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`
  }
  return d + (closed ? 'Z' : '')
}

// ── Elementi da elaborato tecnico ────────────────────────────────────────────

/** Pattern di tratteggio. Restituisce { id, def }. */
export function hatch({ angle = 45, gap = 7, c = 'a-s2', width } = {}) {
  const id = nextId('h')
  const sw = width ? ` stroke-width="${width}"` : ''
  const def = `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><path class="${c}" d="M0 0V${gap}"${sw}/></pattern>`
  return { id, def, fill: `style="fill:url(#${id})"` }
}

/** Crocino di registro. */
export const cross = (x, y, s = 7, c = 'a-s2') =>
  `<path class="${c}" d="M${n(x - s)} ${n(y)}H${n(x + s)}M${n(x)} ${n(y - s)}V${n(y + s)}"/>`

/**
 * Linea di quota orizzontale o verticale con tacche a 45° e testo centrato.
 * (x1,y1)-(x2,y2) sono i punti quotati; `off` sposta la linea di quota.
 */
export function dim(x1, y1, x2, y2, label, { off = 0, size = 11, c = 'a-s2', tc = 'a-tm', ext = true } = {}) {
  const horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1)
  const t = 4.5
  let out = ''
  if (horizontal) {
    const y = y1 + off
    if (ext && off) out += line(x1, y1 + Math.sign(off) * 4, x1, y + Math.sign(off) * 5, c) + line(x2, y2 + Math.sign(off) * 4, x2, y + Math.sign(off) * 5, c)
    out += line(x1 - 6, y, x2 + 6, y, c)
    out += line(x1 - t, y + t, x1 + t, y - t, 'a-s') + line(x2 - t, y + t, x2 + t, y - t, 'a-s')
    if (label) out += text((x1 + x2) / 2, y - 6, label, { c: tc, size, anchor: 'middle' })
  } else {
    const x = x1 + off
    if (ext && off) out += line(x1 + Math.sign(off) * 4, y1, x + Math.sign(off) * 5, y1, c) + line(x2 + Math.sign(off) * 4, y2, x + Math.sign(off) * 5, y2, c)
    out += line(x, y1 - 6, x, y2 + 6, c)
    out += line(x - t, y1 + t, x + t, y1 - t, 'a-s') + line(x - t, y2 + t, x + t, y2 - t, 'a-s')
    if (label) out += text(x - 6, (y1 + y2) / 2, label, { c: tc, size, anchor: 'middle', rotate: -90 })
  }
  return out
}

/** Quota altimetrica: triangolo + linea + testo. */
export function level(x, y, label, { flip = false, size = 11, len = 70 } = {}) {
  const dir = flip ? -1 : 1
  return (
    line(x, y, x + dir * len, y, 'a-s2') +
    poly([[x + dir * 8, y], [x + dir * 20, y], [x + dir * 14, y - 9]], 'a-fill') +
    text(x + dir * 26, y - 5, label, { c: 'a-tm', size, anchor: flip ? 'end' : 'start' })
  )
}

/** Pallino d'asse (A, B, 1, 2…). */
export const bubble = (x, y, label, r = 12) =>
  circle(x, y, r, 'a-s') + text(x, y + 4, label, { size: 11, anchor: 'middle' })

/** Freccia del nord. */
export function north(x, y, r = 22) {
  return (
    circle(x, y, r, 'a-s2') +
    poly([[x, y - r + 3], [x + r * 0.34, y + r * 0.5], [x, y + r * 0.22]], 'a-fill') +
    polyline([[x, y - r + 3], [x - r * 0.34, y + r * 0.5], [x, y + r * 0.22]], 'a-s') +
    text(x, y - r - 7, 'N', { size: 12, anchor: 'middle', weight: 500 })
  )
}

/** Scala grafica: `count` segmenti da `unit` px. */
export function scaleBar(x, y, unit, count, labels = []) {
  let out = ''
  for (let i = 0; i < count; i++) out += rect(x + i * unit, y, unit, 5, i % 2 ? 'a-s' : 'a-fill a-s')
  labels.forEach((l, i) => {
    out += text(x + i * unit, y - 7, l, { c: 'a-tm', size: 10, anchor: 'middle' })
  })
  return out
}

/** Richiamo con linea e pallino: etichetta collegata a un punto del disegno. */
export function leader(x, y, tx, ty, label, { size = 11, anchor = 'start', c = 'a-tm' } = {}) {
  const dir = anchor === 'end' ? -1 : 1
  return (
    circle(x, y, 2.6, 'a-fill') +
    polyline([[x, y], [tx, ty], [tx + dir * 26, ty]], 'a-s2') +
    text(tx + dir * 32, ty + 4, label, { c, size, anchor })
  )
}

/**
 * Squadratura della tavola: cornice, riferimenti di zona (lettere/numeri) e
 * mini-cartiglio in basso. Restituisce il markup e il riquadro utile per il disegno.
 */
export function sheet(w, h, { code = '', title = '', scale = '', tav = '', zones = true, margin = 26 } = {}) {
  const m = margin
  const strip = title || code || scale ? 34 : 0
  let out = rect(m, m, w - m * 2, h - m * 2, 'a-s2')

  if (zones) {
    const cols = Math.max(4, Math.round((w - m * 2) / 190))
    const rows = Math.max(3, Math.round((h - m * 2) / 190))
    for (let i = 1; i < cols; i++) {
      const x = m + ((w - m * 2) / cols) * i
      out += line(x, m, x, m - 7, 'a-s2') + line(x, h - m, x, h - m + 7, 'a-s2')
    }
    for (let i = 0; i < cols; i++) {
      const x = m + ((w - m * 2) / cols) * (i + 0.5)
      out += text(x, m - 8, String(i + 1), { c: 'a-tm', size: 9, anchor: 'middle' })
    }
    for (let i = 1; i < rows; i++) {
      const y = m + ((h - m * 2) / rows) * i
      out += line(m, y, m - 7, y, 'a-s2') + line(w - m, y, w - m + 7, y, 'a-s2')
    }
    for (let i = 0; i < rows; i++) {
      const y = m + ((h - m * 2) / rows) * (i + 0.5)
      out += text(m - 13, y + 3, String.fromCharCode(65 + i), { c: 'a-tm', size: 9, anchor: 'middle' })
    }
  }

  if (strip) {
    const y = h - m - strip
    out += line(m, y, w - m, y, 'a-s2')
    const cells = [
      [code, 0.16],
      [title, 0.5],
      [scale, 0.17],
      [tav, 0.17],
    ]
    let x = m
    cells.forEach(([value, frac], i) => {
      const cw = (w - m * 2) * frac
      if (i) out += line(x, y, x, h - m, 'a-s2')
      out += text(x + 12, y + 21, value, { c: i === 1 ? 'a-t' : 'a-tm', size: 11, spacing: '.04em' })
      x += cw
    })
  }

  const pad = 34
  return {
    markup: out,
    box: { x: m + pad, y: m + pad, w: w - (m + pad) * 2, h: h - (m + pad) * 2 - strip },
  }
}

/** Trasformazione che adatta un riquadro in unità reali (metri…) dentro `box`. */
export function fit(bounds, box, align = 0.5) {
  const s = Math.min(box.w / bounds.w, box.h / bounds.h)
  const ox = box.x + (box.w - bounds.w * s) * align - bounds.x * s
  const oy = box.y + (box.h - bounds.h * s) * align - bounds.y * s
  return { s, X: (v) => ox + v * s, Y: (v) => oy + v * s, P: ([x, y]) => [ox + x * s, oy + y * s] }
}

/** Contenitore <svg> di una tavola. `tone`: paper | ink | tint | accent */
export function svg({ w = 1200, h = 900, tone = 'paper', label = '', defs = '', body = '', slice = true, bg = true, par }) {
  return (
    `<svg class="art art--${tone}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escText(label).replace(/"/g, '&quot;')}"` +
    ` preserveAspectRatio="${par || `xMidYMid ${slice ? 'slice' : 'meet'}`}" xmlns="http://www.w3.org/2000/svg">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    (bg ? `<rect class="a-bg" width="${w}" height="${h}"/>` : '') +
    body +
    `</svg>`
  )
}
