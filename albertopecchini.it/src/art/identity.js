// Tavole dell'identità di questo sito: monogramma, icona, logotipo, colori e
// caratteri, ognuno con la sua costruzione quotata. A differenza di brand.js
// (marchi dei progetti dimostrativi) qui le misure sono quelle vere:
//   · monogramma → MARK in templates/components/ui.js (riquadro 48 × 48)
//   · icona      → public/favicon.svg (riquadro 64 × 64)
//   · logotipo   → .logo in styles/layout.css, misurato nel browser
//   · colori     → styles/tokens.css
// Se cambiano là, vanno cambiate qui. I testi sono già minuscoli, come il sito.

import { svg, n, nextId, softShadow } from './kit.js'

const SANS = 'var(--font-sans)'
const SERIF = 'var(--font-serif)'
const MONO = 'var(--font-mono)'

const C = {
  paper: '#f3f1ec',
  paper2: '#eae7e0',
  paper3: '#dedad1',
  sheet: '#fbfaf6',
  table: '#d9d4c9',
  ink: '#10110f',
  ink2: '#1b1c19',
  graphite: '#5a5b55',
  minio: '#e5481f',
  deep: '#b5360f',
  bright: '#ff6a3d',
}

// ── Geometria ────────────────────────────────────────────────────────────────

// Monogramma: unità u = 1/48 del lato. A e P sulla stessa asta, la traversa
// parte dalla diagonale e chiude l'occhiello, il nodo copre l'angolo dell'apice.
const M = {
  foot: { x: 7, y: 43 },
  apex: { x: 23.5, y: 5 },
  bar: { x: 13.5, y: 28 },
  bowl: { cx: 32, cy: 16.5, r: 11.5 },
  stroke: 2.6,
  node: 1.9,
}
const PARTS = {
  stem: 'M23.5 5v38',
  a: 'M7 43 23.5 5',
  bar: 'M13.5 28h10',
  bowl: 'M23.5 5h8.5a11.5 11.5 0 0 1 0 23h-8.5',
}
const SLOPE = (M.apex.x - M.foot.x) / (M.apex.y - M.foot.y) // dx/dy della diagonale
const ANGLE = (Math.atan2(M.foot.y - M.apex.y, M.apex.x - M.foot.x) * 180) / Math.PI // 66,53°

// Icona: quadrato 64 con raggio 10, monogramma traslato di (8,5 ; 8) con tratto 4,
// così l'asta cade sull'asse verticale (x = 32) e il segno è centrato in altezza.
const ICON = { size: 64, r: 10, dx: 8.5, dy: 8, stroke: 4, dot: { cx: 32, cy: 13, r: 3.4 } }

// Logotipo della testata, in px a grandezza vera (font-size radice 16 px).
const LOGO = {
  mark: 40,
  gap: 9.6,
  text: 130.9,
  name: { size: 17, weight: 640, track: '-0.02em', base: 19.1, x: 9, asc: 12.4, desc: 3.1, w: 121.6 },
  role: { size: 12, track: '0.02em', base: 33.55, x: 6.2 },
}

// ── Primitive ────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
/** Numero all'italiana: virgola decimale, niente zeri inutili. */
const it = (v, d = 1) => String(Math.round(v * 10 ** d) / 10 ** d).replace('.', ',')
const k4 = (v) => Number(v.toFixed(4))

function T(x, y, str, { fill = C.ink, size = 12, family = MONO, weight = 400, anchor = 'start', stretch, spacing, italic, opacity, rotate } = {}) {
  const style = [`font-family:${family}`, stretch && `font-stretch:${stretch}%`, italic && 'font-style:italic'].filter(Boolean).join(';')
  return `<text x="${n(x)}" y="${n(y)}" fill="${fill}" font-size="${size}" font-weight="${weight}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity ? ` opacity="${opacity}"` : ''}${rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : ''} style="${style}">${esc(str)}</text>`
}
const Rc = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`
const Ln = (x1, y1, x2, y2, stroke, sw = 1, extra = '') => `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${stroke}" stroke-width="${sw}" fill="none"${extra}/>`
const Ci = (cx, cy, r, extra = '') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${extra}/>`
const shadow = (x, y, w, h, o = 0.2) => softShadow(x + 8, y + 12, w, h, { sigma: 12, opacity: o })

const out = (w, h, label, body) => svg({ w, h, tone: 'bare', bg: false, label, body })

/**
 * Quota da tavola: linea sottile, tacche a 45° e misura sopra la linea.
 * Orizzontale se y1 = y2, altrimenti verticale (misura ruotata, a sinistra).
 */
function quota(x1, y1, x2, y2, label, { c = C.ink, size = 12, t = 4, sw = 1, tc = c, gap = 5 } = {}) {
  const tick = (x, y) => Ln(x - t, y + t, x + t, y - t, c, sw * 1.3)
  let o = Ln(x1, y1, x2, y2, c, sw) + tick(x1, y1) + tick(x2, y2)
  if (label === undefined || label === '') return o
  if (Math.abs(y1 - y2) < 0.01) o += T((x1 + x2) / 2, y1 - gap, label, { fill: tc, size, anchor: 'middle' })
  else o += T(x1 - gap, (y1 + y2) / 2, label, { fill: tc, size, anchor: 'middle', rotate: -90 })
  return o
}

/** Reticolo modulare su un quadrato: una linea ogni `step` unità, più marcata ogni `major`. */
function lattice(x, y, s, units, { step = 1, major = 4, c = C.ink, o1 = 0.07, o2 = 0.16, frame = 0.5 } = {}) {
  const u = s / units
  let fine = ''
  let bold = ''
  for (let i = step; i < units; i += step) {
    const d = `M${n(x + i * u)} ${n(y)}V${n(y + s)}M${n(x)} ${n(y + i * u)}H${n(x + s)}`
    if (i % major === 0) bold += d
    else fine += d
  }
  return (
    (fine ? `<path d="${fine}" stroke="${c}" stroke-width="1" opacity="${o1}" fill="none"/>` : '') +
    (bold ? `<path d="${bold}" stroke="${c}" stroke-width="1" opacity="${o2}" fill="none"/>` : '') +
    (frame ? `<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" fill="none" stroke="${c}" stroke-width="1" opacity="${frame}"/>` : '')
  )
}

// ── Il monogramma ────────────────────────────────────────────────────────────

/**
 * Monogramma nel quadrato di lato s con l'angolo in alto a sinistra in (x, y).
 * `colors` sceglie il colore di ogni pezzo (null = non disegnarlo); `axis`
 * aggiunge l'asse del tratto, cioè la linea che le quote misurano.
 */
function apMark(x, y, s, { ink = C.ink, node = C.minio, stroke = M.stroke, colors = {}, axis, opacity } = {}) {
  const k = s / 48
  const col = { stem: ink, a: ink, bar: ink, bowl: ink, node, ...colors }
  let o = `<g transform="translate(${n(x)} ${n(y)}) scale(${k4(k)})" fill="none" stroke-linejoin="miter"${opacity ? ` opacity="${opacity}"` : ''}>`
  for (const key of ['a', 'stem', 'bar', 'bowl']) if (col[key]) o += `<path d="${PARTS[key]}" stroke="${col[key]}" stroke-width="${stroke}"/>`
  if (col.node) o += `<circle cx="${M.apex.x}" cy="${M.apex.y}" r="${M.node}" fill="${col.node}"/>`
  if (axis) o += `<path d="${PARTS.a}${PARTS.stem}${PARTS.bar}${PARTS.bowl}" stroke="${axis}" stroke-width="${k4(1 / k)}"/>`
  return o + '</g>'
}

/**
 * Linee di costruzione: capitello, traversa e base; asse dell'asta; diagonale
 * prolungata; cerchio intero dell'occhiello col suo centro. `over` è di quanto
 * le linee escono dal quadrato; con `bleed` arrivano ai bordi del riquadro dato.
 */
function guides(x, y, s, { c = C.minio, sw = 1, over = 14, bleed, edges = false, o = 1 } = {}) {
  const k = s / 48
  const X = (u) => x + u * k
  const Y = (u) => y + u * k
  const l = bleed ? bleed.x : x - over
  const r = bleed ? bleed.x + bleed.w : x + s + over
  const t = bleed ? bleed.y : y - over
  const b = bleed ? bleed.y + bleed.h : y + s + over
  // la diagonale prolungata da bordo a bordo (in unità, poi in px)
  const uTop = (t - y) / k
  const uBot = (b - y) / k
  const dx = (u) => M.apex.x + SLOPE * (u - M.apex.y)
  let g = `<g fill="none" stroke="${c}" stroke-width="${sw}" opacity="${o}">`
  g += `<path d="M${n(l)} ${n(Y(M.apex.y))}H${n(r)}M${n(l)} ${n(Y(M.bar.y))}H${n(r)}M${n(l)} ${n(Y(M.foot.y))}H${n(r)}"/>`
  g += `<path d="M${n(X(M.apex.x))} ${n(t)}V${n(b)}" stroke-dasharray="14 4 2 4"/>`
  g += `<path d="M${n(X(M.foot.x))} ${n(t)}V${n(b)}M${n(X(M.bowl.cx + M.bowl.r))} ${n(t)}V${n(b)}" stroke-dasharray="3 5"/>`
  g += `<path d="M${n(X(dx(uBot)))} ${n(b)}L${n(X(dx(uTop)))} ${n(t)}" stroke-dasharray="7 5"/>`
  g += Ci(X(M.bowl.cx), Y(M.bowl.cy), M.bowl.r * k, ' stroke-dasharray="7 5"')
  if (edges) g += Ci(X(M.bowl.cx), Y(M.bowl.cy), (M.bowl.r + M.stroke / 2) * k, ' stroke-dasharray="2 5"') + Ci(X(M.bowl.cx), Y(M.bowl.cy), (M.bowl.r - M.stroke / 2) * k, ' stroke-dasharray="2 5"')
  const cr = Math.max(5, k * 0.9)
  g += `<path d="M${n(X(M.bowl.cx) - cr)} ${n(Y(M.bowl.cy))}h${n(cr * 2)}M${n(X(M.bowl.cx))} ${n(Y(M.bowl.cy) - cr)}v${n(cr * 2)}"/>`
  return g + '</g>'
}

/** Arco dell'angolo al piede della A, dalla base alla diagonale, con la misura. */
function angleArc(x, y, s, { c = C.deep, r = 7, size = 13, sw = 1 } = {}) {
  const k = s / 48
  const fx = x + M.foot.x * k
  const fy = y + M.foot.y * k
  const a = (ANGLE * Math.PI) / 180
  const R = r * k
  const mid = a / 2
  return (
    `<path d="M${n(fx + R)} ${n(fy)}A${n(R)} ${n(R)} 0 0 0 ${n(fx + R * Math.cos(a))} ${n(fy - R * Math.sin(a))}" fill="none" stroke="${c}" stroke-width="${sw}"/>` +
    T(fx + (R + size * 0.9) * Math.cos(mid), fy - (R + size * 0.9) * Math.sin(mid) + size * 0.35, `${it(ANGLE)}°`, { fill: c, size })
  )
}

/** Raggio dell'occhiello: dal centro all'asse del tratto, con la misura dentro l'occhio. */
function radius(x, y, s, { c = C.deep, deg = -38, size = 13, sw = 1 } = {}) {
  const k = s / 48
  const cx = x + M.bowl.cx * k
  const cy = y + M.bowl.cy * k
  const a = (deg * Math.PI) / 180
  const R = M.bowl.r * k
  const ex = cx + R * Math.cos(a)
  const ey = cy + R * Math.sin(a)
  const mx = cx + R * 0.46 * Math.cos(a)
  const my = cy + R * 0.46 * Math.sin(a)
  return Ln(cx, cy, ex, ey, c, sw) + Ci(ex, ey, 2.6, ` fill="${c}"`) + `<g transform="rotate(${deg} ${n(mx)} ${n(my)})">${T(mx, my - 5, `r ${it(M.bowl.r)}`, { fill: c, size, anchor: 'middle' })}</g>`
}

// ── 1 · Tavola di costruzione del monogramma ─────────────────────────────────

const STEPS = [
  { name: 'quadrato', note: '48 × 48 u', show: [] },
  { name: 'asta', note: '38 u · asse 23,5', show: ['stem'] },
  { name: 'diagonale', note: `${it(ANGLE)}° dal piede`, show: ['stem', 'a'] },
  { name: 'traversa', note: '10 u a quota 28', show: ['stem', 'a', 'bar'] },
  { name: 'occhiello', note: 'r 11,5 · centro o', show: ['stem', 'a', 'bar', 'bowl'] },
  { name: 'nodo', note: 'ø 3,8 sull’apice', show: ['stem', 'a', 'bar', 'bowl', 'node'] },
]

/** Un passo della costruzione: i pezzi già tracciati in grigio, quello nuovo in minio. */
function step(x, y, s, i, { ink = C.ink, acc = C.minio, old = 0.26 } = {}) {
  const { show } = STEPS[i]
  const last = show[show.length - 1]
  let o = lattice(x, y, s, 48, { step: 8, major: 8, c: ink, o2: i === 0 ? 0.28 : 0.1, frame: i === 0 ? 1 : 0.3 })
  if (i === 0) o += `<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}" fill="none" stroke="${acc}" stroke-width="1.6"/>`
  const colors = { stem: null, a: null, bar: null, bowl: null, node: null }
  const done = show.filter((p) => p !== last)
  if (done.length) o += apMark(x, y, s, { colors: { ...colors, ...Object.fromEntries(done.map((p) => [p, ink])) }, opacity: old })
  if (last) o += apMark(x, y, s, { colors: { ...colors, [last]: acc } })
  return o
}

function tavola({ w = 1200, h = 900, label } = {}) {
  const ink = C.ink
  const acc = C.minio
  const deep = C.deep
  const m = 26
  let o = Rc(0, 0, w, h, C.paper2)
  // squadratura e cartiglio
  const strip = 40
  o += `<rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" fill="none" stroke="${ink}" stroke-width="1.3"/>`
  o += Ln(m, h - m - strip, w - m, h - m - strip, ink, 1.3)
  const cells = [['ap · id · 01', 0.14], ['monogramma ap — costruzione quotata', 0.44], ['u = 1/48 del lato · 1 u = 11,5 px', 0.28], ['tav. 1 / 4', 0.14]]
  let cx = m
  cells.forEach(([txt, frac], i) => {
    if (i) o += Ln(cx, h - m - strip, cx, h - m, ink, 1)
    o += T(cx + 14, h - m - strip + 25, txt, { fill: ink, size: 13, weight: i === 1 ? 500 : 400, opacity: i === 1 ? 1 : 0.7 })
    cx += (w - m * 2) * frac
  })

  // il segno, 12 px per unità
  const k = 11.5
  const s = 48 * k
  const x0 = 150
  const y0 = 96
  const X = (u) => x0 + u * k
  const Y = (u) => y0 + u * k
  o += Rc(x0, y0, s, s, C.sheet)
  o += lattice(x0, y0, s, 48, { c: ink })
  // righelli: una cifra ogni 8 u
  for (let i = 0; i <= 48; i += 8) {
    o += T(X(i), y0 - 9, String(i), { fill: ink, size: 11, anchor: 'middle', opacity: 0.55 })
    o += T(x0 - 9, Y(i) + 4, String(i), { fill: ink, size: 11, anchor: 'end', opacity: 0.55 })
  }
  o += guides(x0, y0, s, { c: acc, over: 16 })
  o += apMark(x0, y0, s, { axis: C.sheet })
  o += angleArc(x0, y0, s, { c: deep })
  o += radius(x0, y0, s, { c: deep })
  // nomi delle linee, a destra del quadrato
  const gx = x0 + s + 22
  ;[[M.apex.y, 'capitello'], [M.bar.y, 'traversa'], [M.foot.y, 'base']].forEach(([u, name]) => {
    o += T(gx, Y(u) - 5, name, { fill: deep, size: 12 }) + T(gx, Y(u) + 13, `y = ${it(u)}`, { fill: deep, size: 11, opacity: 0.75 })
  })
  o += T(X(M.apex.x) + 8, y0 - 26, 'asse dell’asta · x = 23,5', { fill: deep, size: 12 })
  o += T(X(M.bowl.cx) + 9, Y(M.bowl.cy) + 16, 'o', { fill: deep, size: 13 })
  // spessore del tratto, sotto l'asta
  const ty = Y(45.4)
  o += Ln(X(22.2), Y(43.5), X(22.2), ty + 6, ink, 1) + Ln(X(24.8), Y(43.5), X(24.8), ty + 6, ink, 1)
  o += quota(X(22.2), ty, X(24.8), ty, '', { c: ink })
  o += T(X(24.8) + 12, ty + 4, 'tratto 2,6', { fill: ink, size: 12 })
  // traversa: richiamo
  o += Ci(X(18.5), Y(28), 3, ` fill="${C.sheet}"`) + `<path d="M${n(X(18.5))} ${n(Y(28))}L${n(X(16.6))} ${n(Y(33.4))}" stroke="${ink}" stroke-width="1" fill="none"/>`
  o += T(X(16.6) - 2, Y(33.4) + 15, 'traversa 10', { fill: ink, size: 12, anchor: 'middle' })

  // quote verticali (a sinistra) e orizzontali (sotto)
  const q1 = x0 - 54
  const q2 = x0 - 92
  for (const u of [M.apex.y, M.bar.y, M.foot.y]) o += Ln(q2 - 8, Y(u), x0 - 30, Y(u), ink, 1, ' opacity=".35"')
  o += quota(q1, Y(5), q1, Y(28), '23', { size: 13 }) + quota(q1, Y(28), q1, Y(43), '15', { size: 13 })
  o += quota(q2, Y(5), q2, Y(43), '38', { size: 13 })
  const h1 = y0 + s + 42
  const h2 = y0 + s + 80
  const h3 = y0 + s + 118
  for (const u of [0, 7, 23.5, 32, 43.5, 48]) o += Ln(X(u), y0 + s + 8, X(u), (u === 0 || u === 48 ? h3 : u === 7 || u === 43.5 ? h2 : h1) + 8, ink, 1, ' opacity=".35"')
  o += quota(X(0), h1, X(7), h1, '7', { size: 13, tc: C.graphite }) + quota(X(7), h1, X(23.5), h1, '16,5', { size: 13 }) + quota(X(23.5), h1, X(32), h1, '8,5', { size: 13 }) + quota(X(32), h1, X(43.5), h1, '11,5', { size: 13 }) + quota(X(43.5), h1, X(48), h1, '4,5', { size: 13, tc: C.graphite })
  o += quota(X(7), h2, X(43.5), h2, 'larghezza 36,5', { size: 13 })
  o += quota(X(0), h3, X(48), h3, 'quadrato 48', { size: 13 })

  // colonna di destra: i sei passi
  const rx = 822
  const rw = w - m - 28 - rx
  o += T(rx, 86, 'costruzione in sei passi', { fill: ink, size: 13, weight: 500 })
  const ts = (rw - 28) / 3
  STEPS.forEach((st, i) => {
    const tx = rx + (i % 3) * (ts + 14)
    const tyy = 102 + Math.floor(i / 3) * (ts + 52)
    o += step(tx, tyy, ts, i)
    o += T(tx, tyy + ts + 17, `0${i + 1} ${st.name}`, { fill: ink, size: 11.5, weight: 500 })
    o += T(tx, tyy + ts + 32, st.note, { fill: ink, size: 9, opacity: 0.62 })
  })

  // misure
  const my = 102 + 2 * (ts + 52) + 20
  o += Ln(rx, my - 18, rx + rw, my - 18, ink, 1, ' opacity=".3"')
  o += T(rx, my + 4, 'misure in unità u', { fill: ink, size: 13, weight: 500 })
  const rows = [
    ['altezza', '38'],
    ['larghezza', '36,5'],
    ['tratto', '2,6'],
    ['nodo (minio al passaggio)', 'ø 3,8'],
    ['inclinazione', `${it(ANGLE, 2)}°`],
    ['occhiello', 'r 11,5'],
    ['traversa', '10 a quota 28'],
    ['margini sx · su · dx · giù', '7 · 5 · 4,5 · 5'],
  ]
  rows.forEach(([key, val], i) => {
    const yy = my + 30 + i * 23
    o += Ln(rx, yy + 6, rx + rw, yy + 6, ink, 1, ' opacity=".14"')
    o += T(rx, yy, key, { fill: ink, size: 11.5, opacity: 0.7 }) + T(rx + rw, yy, val, { fill: ink, size: 11.5, anchor: 'end' })
  })

  // lo stesso segno, col tratto che il sito usa a ogni grandezza
  const uy = my + 30 + rows.length * 23 + 24
  o += T(rx, uy, 'tratto per grandezza', { fill: ink, size: 13, weight: 500 })
  const uses = [
    { s: 40, stroke: 2.6, a: 'testata', b: '40 px · 2,6', w: 74 },
    { s: 62, stroke: 1.6, a: 'sipario', b: '64 px · 1,6', w: 80 },
    { s: 92, stroke: 0.7, a: 'studio', b: 'grande · 0,7', w: 108 },
  ]
  const baseY = uy + 112
  let ux = rx
  for (const us of uses) {
    o += apMark(ux, baseY - us.s, us.s, { stroke: us.stroke, node: ink })
    o += T(ux, baseY + 17, us.a, { fill: ink, size: 11, weight: 500 }) + T(ux, baseY + 31, us.b, { fill: ink, size: 9, opacity: 0.62 })
    ux += us.w
  }
  o += icon(ux, baseY - 62, 62)
  o += T(ux, baseY + 17, 'icona', { fill: ink, size: 11, weight: 500 }) + T(ux, baseY + 31, '64 u · 4', { fill: ink, size: 9, opacity: 0.62 })

  return out(w, h, label || 'Tavola di costruzione del monogramma AP: reticolo, linee di costruzione, quote e i sei passi del tracciato', o)
}

// ── L'icona ──────────────────────────────────────────────────────────────────

/** Icona del sito (favicon.svg) di lato s. `dark` è la versione per i temi scuri. */
function icon(x, y, s, { dark = false } = {}) {
  const k = s / ICON.size
  const bg = dark ? C.paper : C.ink
  const fg = dark ? C.ink : C.paper
  return (
    `<g transform="translate(${n(x)} ${n(y)}) scale(${k4(k)})">` +
    `<rect width="64" height="64" rx="${ICON.r}" fill="${bg}"/>` +
    `<path transform="translate(${ICON.dx} ${ICON.dy})" d="M7 43 23.5 5v38M13.5 28h10m0-23h8.5a11.5 11.5 0 0 1 0 23h-8.5" fill="none" stroke="${fg}" stroke-width="${ICON.stroke}" stroke-linejoin="miter"/>` +
    `<circle cx="${ICON.dot.cx}" cy="${ICON.dot.cy}" r="${ICON.dot.r}" fill="${C.minio}"/>` +
    '</g>'
  )
}

/** Costruzione dell'icona: reticolo, assi, raggio dell'angolo, linee del segno. */
function iconGuides(x, y, s, { c = C.bright, grid = C.ink, over = 12, size = 10 } = {}) {
  const k = s / ICON.size
  const X = (u) => x + u * k
  const Y = (u) => y + u * k
  let o = lattice(x, y, s, 64, { step: 4, major: 16, c: grid, o1: 0.1, o2: 0.22, frame: 0 })
  o += `<g fill="none" stroke="${c}" stroke-width="1">`
  o += `<path d="M${n(X(32))} ${n(y - over)}V${n(y + s + over)}M${n(x - over)} ${n(Y(32))}H${n(x + s + over)}" stroke-dasharray="14 4 2 4"/>`
  o += `<path d="M${n(x - over)} ${n(Y(13))}H${n(x + s + over)}M${n(x - over)} ${n(Y(51))}H${n(x + s + over)}"/>`
  o += `<path d="M${n(X(15.5))} ${n(y - over)}V${n(y + s + over)}M${n(X(52))} ${n(y - over)}V${n(y + s + over)}" stroke-dasharray="3 5"/>`
  o += Ci(X(ICON.r), Y(ICON.r), ICON.r * k, ' stroke-dasharray="5 4"')
  const d = ICON.r * k * Math.SQRT1_2
  o += `<path d="M${n(X(ICON.r))} ${n(Y(ICON.r))}L${n(X(ICON.r) - d)} ${n(Y(ICON.r) - d)}"/>`
  o += '</g>'
  o += Ci(X(ICON.r), Y(ICON.r), 2.2, ` fill="${c}"`)
  o += T(x - 6, y - 7, `r ${ICON.r}`, { fill: c, size, anchor: 'end' })
  return o
}

// ── Il logotipo ──────────────────────────────────────────────────────────────

/** Logotipo della testata in scala f (1 = grandezza vera): segno, nome, mestiere. */
function lockup(x, y, f, { ink = C.ink, node = ink, muted = C.graphite } = {}) {
  const tx = x + (LOGO.mark + LOGO.gap) * f
  return (
    apMark(x, y, LOGO.mark * f, { ink, node }) +
    T(tx, y + LOGO.name.base * f, 'alberto pecchini', { fill: ink, size: n(LOGO.name.size * f), family: SANS, weight: LOGO.name.weight, spacing: LOGO.name.track }) +
    T(tx, y + LOGO.role.base * f, 'diplomato geometra', { fill: muted, size: n(LOGO.role.size * f), spacing: LOGO.role.track })
  )
}

/** Quote del logotipo: 40 · 9,6 · 130,9 sopra, l'ingombro sotto. */
function lockupDims(x, y, f, { c = C.ink, size = 10, up = 16, down = 20, total = true } = {}) {
  const a = x + LOGO.mark * f
  const b = a + LOGO.gap * f
  const e = b + LOGO.text * f
  const bottom = y + LOGO.mark * f
  let o = `<path d="M${n(x)} ${n(y)}h${n(LOGO.mark * f)}v${n(LOGO.mark * f)}h${n(-LOGO.mark * f)}ZM${n(b)} ${n(y)}V${n(bottom)}M${n(e)} ${n(y)}V${n(bottom)}" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="3 4" opacity=".55"/>`
  o += quota(x, y - up, a, y - up, '40', { c, size }) + quota(a, y - up, b, y - up, '', { c }) + quota(b, y - up, e, y - up, '130,9', { c, size })
  o += T((a + b) / 2, y - up - 5 - size * 1.15, '9,6', { fill: c, size, anchor: 'middle' })
  if (total) o += quota(x, bottom + down, e, bottom + down, '180,5 × 40 px', { c, size })
  return o
}

// ── 2 · Tre fogli sul tavolo: marchio, icona, logotipo ───────────────────────

const sheetHead = (x, y, pw, num, fg) =>
  T(x + 24, y + 36, 'ap — identità', { fill: fg, size: 11, opacity: 0.75 }) + T(x + pw - 24, y + 36, `n. 0${num}`, { fill: fg, size: 11, anchor: 'end', opacity: 0.75 })

const sheetFoot = (x, y, pw, ph, title, sub, spec, fg) =>
  T(x + 24, y + ph - 86, title, { fill: fg, size: 34, family: SANS, weight: 600, stretch: 94, spacing: '-0.035em' }) +
  T(x + 24, y + ph - 59, sub, { fill: fg, size: 20, family: SERIF, italic: true }) +
  Ln(x + 24, y + ph - 40, x + pw - 24, y + ph - 40, fg, 1, ' opacity=".3"') +
  T(x + 24, y + ph - 22, spec, { fill: fg, size: 9.5, opacity: 0.8 })

function fogli({ w = 1200, h = 900, label } = {}) {
  const pw = 368
  const ph = 640
  const gap = (w - pw * 3) / 4
  const y = (h - ph) / 2
  const note = { fill: C.ink, size: 12, opacity: 0.6 }
  let o = Rc(0, 0, w, h, C.table)
  o += T(gap, y - 34, 'identità di alberto pecchini', note) + T(w - gap, y - 34, 'tre tavole di costruzione', { ...note, anchor: 'end' })
  o += T(gap, y + ph + 48, 'misure vere del sito', note) + T(w - gap, y + ph + 48, 'u = 1/48 del lato · px a grandezza naturale', { ...note, anchor: 'end' })

  // 01 · marchio
  let x = gap
  {
    const s = 272
    const bx = x + 66
    const by = y + 70
    const k = s / 48
    const X = (u) => bx + u * k
    const Y = (u) => by + u * k
    o += shadow(x, y, pw, ph) + Rc(x, y, pw, ph, C.sheet) + sheetHead(x, y, pw, 1, C.ink)
    o += lattice(bx, by, s, 48, { step: 2, major: 8, c: C.ink, o1: 0.08, o2: 0.18 })
    o += guides(bx, by, s, { c: C.minio, over: 10 })
    o += apMark(bx, by, s, { axis: C.sheet })
    o += angleArc(bx, by, s, { size: 10 }) + radius(bx, by, s, { size: 10 })
    const qx = bx - 28
    o += Ln(qx - 6, Y(5), bx - 14, Y(5), C.ink, 1, ' opacity=".35"') + Ln(qx - 6, Y(43), bx - 14, Y(43), C.ink, 1, ' opacity=".35"')
    o += quota(qx, Y(5), qx, Y(43), '38', { size: 10.5 })
    const qy = by + s + 30
    for (const u of [7, 23.5, 32, 43.5]) o += Ln(X(u), by + s + 6, X(u), qy + 6, C.ink, 1, ' opacity=".35"')
    o += quota(X(7), qy, X(23.5), qy, '16,5', { size: 10.5 }) + quota(X(23.5), qy, X(32), qy, '8,5', { size: 10.5 }) + quota(X(32), qy, X(43.5), qy, '11,5', { size: 10.5 })
    // i sei passi del tracciato
    const ts = 46
    const tg = (pw - 48 - ts * STEPS.length) / (STEPS.length - 1)
    STEPS.forEach((st, i) => {
      const tx = x + 24 + i * (ts + tg)
      o += step(tx, y + 410, ts, i) + T(tx, y + 470, `0${i + 1}`, { size: 8.5, weight: 500 }) + T(tx, y + 481, st.name, { size: 7.5, opacity: 0.65 })
    })
    o += sheetFoot(x, y, pw, ph, 'marchio', 'a e p sulla stessa asta', `u = 1/48 · tratto 2,6 · nodo ø 3,8 · ${it(ANGLE)}°`, C.ink)
  }

  // 02 · icona (versione per i temi scuri: carta, segno inchiostro, nodo minio)
  x += pw + gap
  {
    const s = 244
    const ix = x + 60
    const iy = y + 78
    const k = s / 64
    const X = (u) => ix + u * k
    const Y = (u) => iy + u * k
    const fg = C.paper
    o += shadow(x, y, pw, ph, 0.3) + Rc(x, y, pw, ph, C.ink) + sheetHead(x, y, pw, 2, fg)
    o += icon(ix, iy, s, { dark: true }) + iconGuides(ix, iy, s)
    // il nodo, col suo richiamo
    o += `<path d="M${n(X(32) + 3.4 * k * 0.7)} ${n(Y(13) - 3.4 * k * 0.7)}L${n(X(40))} ${n(iy - 12)}h8" fill="none" stroke="${fg}" stroke-width="1"/>`
    o += T(X(40) + 12, iy - 8, 'nodo ø 6,8', { fill: fg, size: 10 })
    const qx = ix + s + 26
    for (const u of [0, 13, 51, 64]) o += Ln(ix + s + 14, Y(u), qx + 6, Y(u), fg, 1, ' opacity=".35"')
    o += quota(qx, Y(0), qx, Y(13), '13', { c: fg, size: 10.5 }) + quota(qx, Y(13), qx, Y(51), '38', { c: fg, size: 10.5 }) + quota(qx, Y(51), qx, Y(64), '13', { c: fg, size: 10.5 })
    const qy = iy + s + 32
    for (const u of [0, 15.5, 32, 52, 64]) o += Ln(X(u), iy + s + 14, X(u), qy + 6, fg, 1, ' opacity=".35"')
    o += quota(X(0), qy, X(15.5), qy, '15,5', { c: fg, size: 10.5 }) + quota(X(15.5), qy, X(32), qy, '16,5', { c: fg, size: 10.5 }) + quota(X(32), qy, X(52), qy, '20', { c: fg, size: 10.5 }) + quota(X(52), qy, X(64), qy, '12', { c: fg, size: 10.5 })
    // le due versioni: il file sceglie da solo col tema del sistema
    const vy = y + 400
    o += icon(x + 24, vy, 60) + `<rect x="${n(x + 24)}" y="${n(vy)}" width="60" height="60" rx="${n((60 * ICON.r) / 64)}" fill="none" stroke="${fg}" stroke-opacity=".4"/>`
    o += T(x + 96, vy + 27, 'tema chiaro', { fill: fg, size: 10, weight: 500 }) + T(x + 96, vy + 41, 'fondo inchiostro', { fill: fg, size: 9, opacity: 0.7 })
    o += icon(x + 194, vy, 60, { dark: true })
    o += T(x + 266, vy + 27, 'tema scuro', { fill: fg, size: 10, weight: 500 }) + T(x + 266, vy + 41, 'fondo carta', { fill: fg, size: 9, opacity: 0.7 })
    // le grandezze pubblicate
    let rx = x + pw - 24
    for (const [px, name] of [[14, '16'], [24, '32'], [34, '180'], [46, '512']]) {
      rx -= px
      o += icon(rx, y + ph - 66 - px, px, { dark: true }) + T(rx + px / 2, y + ph - 52, name, { fill: fg, size: 8, anchor: 'middle', opacity: 0.75 })
      rx -= 9
    }
    o += sheetFoot(x, y, pw, ph, 'icona', 'l’asta cade sull’asse', '64 u · raggio 10 · tratto 4 · segno centrato', fg)
  }

  // 03 · logotipo
  x += pw + gap
  {
    const f = 1.72
    const lx = x + 28
    const ly = y + 100
    const fg = C.ink
    o += shadow(x, y, pw, ph) + Rc(x, y, pw, ph, C.minio) + sheetHead(x, y, pw, 3, fg)
    o += lockup(lx, ly, f, { ink: fg, muted: fg }) + lockupDims(lx, ly, f, { c: fg })
    // dettaglio 5:1 del blocco di testo: le linee su cui poggiano nome e mestiere
    const z = 5
    const wx = x + 62
    const wy = y + 252
    const ww = pw - 24 - 62
    const wh = LOGO.mark * z
    const nb = wy + LOGO.name.base * z
    const rb = wy + LOGO.role.base * z
    const id = nextId('l')
    o += T(wx, wy - 9, `dettaglio ${z} : 1`, { fill: fg, size: 10 }) + T(wx + ww, wy - 9, 'linee del carattere', { fill: fg, size: 10, anchor: 'end' })
    o += Rc(wx, wy, ww, wh, C.sheet) + `<clipPath id="${id}"><rect x="${n(wx)}" y="${n(wy)}" width="${n(ww)}" height="${n(wh)}"/></clipPath><g clip-path="url(#${id})">`
    const lines = [nb - LOGO.name.asc * z, nb - LOGO.name.x * z, nb, rb - LOGO.role.x * z, rb]
    o += `<path d="${lines.map((ly2) => `M${n(wx)} ${n(ly2)}H${n(wx + ww)}`).join('')}" stroke="${C.minio}" stroke-width="1" fill="none"/>`
    o += T(wx + 12, nb, 'alberto pecchini', { fill: C.ink, size: LOGO.name.size * z, family: SANS, weight: LOGO.name.weight, spacing: LOGO.name.track })
    o += T(wx + 12, rb, 'diplomato geometra', { fill: C.graphite, size: LOGO.role.size * z, spacing: LOGO.role.track })
    o += '</g>'
    const qx = wx - 22
    for (const yy of [wy, nb, rb, wy + wh]) o += Ln(qx - 6, yy, wx - 4, yy, fg, 1, ' opacity=".4"')
    o += quota(qx, wy, qx, nb, '19,1', { c: fg, size: 10 }) + quota(qx, nb, qx, rb, '14,45', { c: fg, size: 10 }) + quota(qx, rb, qx, wy + wh, '6,45', { c: fg, size: 10 })
    ;['x 9 px — occhio delle minuscole', 'asc. 12,4 px — aste di l, b, h', 'disc. 3,1 px — coda della p'].forEach((t, i) => (o += T(wx, wy + wh + 24 + i * 16, t, { fill: fg, size: 9.5 })))
    o += sheetFoot(x, y, pw, ph, 'logotipo', 'segno, nome, mestiere', 'archivo 640 · 17 px · −0,02 em / cascadia code 12 px', fg)
  }

  return out(w, h, label || 'Tre tavole di costruzione dell’identità di Alberto Pecchini: marchio, icona e logotipo', o)
}

// ── 3 · Il monogramma al buio: linee a tutta tavola e punti notevoli ─────────

const POINTS = [
  ['a', 'piede', 7, 43, -1, 1],
  ['b', 'apice', 23.5, 5, -1, -1],
  ['c', 'base asta', 23.5, 43, 1, 1],
  ['d', 'attacco', 13.5, 28, -1, -1],
  ['e', 'incrocio', 23.5, 28, 1, 1],
  ['f', 'inizio arco', 32, 5, 1, -1],
  ['g', 'fine arco', 32, 28, 1, 1],
  ['o', 'centro', 32, 16.5, 1, 1],
  ['t', 'tangente', 43.5, 16.5, 1, -1],
]

function notte({ w = 1200, h = 900, label } = {}) {
  const fg = C.paper
  const acc = C.bright
  const k = 14
  const s = 48 * k
  const x0 = (w - s) / 2
  const y0 = 80
  const X = (u) => x0 + u * k
  const Y = (u) => y0 + u * k
  let o = Rc(0, 0, w, h, C.ink)
  o += lattice(x0, y0, s, 48, { step: 4, major: 8, c: fg, o1: 0.06, o2: 0.12, frame: 0.35 })
  o += guides(x0, y0, s, { c: acc, bleed: { x: 0, y: 0, w, h }, edges: true, o: 0.8 })
  o += apMark(x0, y0, s, { ink: fg, node: acc, axis: C.ink })
  o += angleArc(x0, y0, s, { c: acc, size: 15 }) + radius(x0, y0, s, { c: acc, size: 15, deg: -60 })

  // punti notevoli
  for (const [name, , ux, uy, dx, dy] of POINTS) {
    const off = name === 'b' ? 40 : name === 'o' ? 16 : 30
    o += Ci(X(ux), Y(uy), 6, ` fill="${C.ink}" stroke="${acc}" stroke-width="1.6"`)
    o += `<text x="${n(X(ux) + dx * off)}" y="${n(Y(uy) + dy * off + 5)}" fill="${acc}" font-size="16" font-weight="500" text-anchor="middle" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round" paint-order="stroke" style="font-family:${MONO}">${name}</text>`
  }

  // quote: catena verticale a destra, orizzontale sotto
  const qx = x0 + s + 30
  for (const u of [5, 28, 43]) o += Ln(x0 + s + 8, Y(u), qx + 6, Y(u), fg, 1, ' opacity=".4"')
  o += quota(qx, Y(5), qx, Y(28), '23', { c: fg, size: 13 }) + quota(qx, Y(28), qx, Y(43), '15', { c: fg, size: 13 })
  const q1 = y0 + s + 36
  const q2 = y0 + s + 72
  for (const u of [7, 23.5, 32, 43.5]) o += Ln(X(u), y0 + s + 8, X(u), (u === 7 || u === 43.5 ? q2 : q1) + 6, fg, 1, ' opacity=".4"')
  o += quota(X(7), q1, X(23.5), q1, '16,5', { c: fg, size: 13 }) + quota(X(23.5), q1, X(32), q1, '8,5', { c: fg, size: 13 }) + quota(X(32), q1, X(43.5), q1, '11,5', { c: fg, size: 13 })
  o += quota(X(7), q2, X(43.5), q2, '36,5', { c: fg, size: 13 })

  // colonna sinistra: titolo, linee, regole
  const lx = 40
  const dim = { fill: fg, size: 11.5, opacity: 0.72 }
  o += T(lx, 78, 'monogramma', { fill: fg, size: 31, family: SANS, weight: 600, stretch: 94, spacing: '-0.035em' })
  o += T(lx, 108, 'a e p, una sola asta', { fill: fg, size: 21, family: SERIF, italic: true })
  ;[[5, 'capitello · y = 5'], [28, 'traversa · y = 28'], [43, 'base · y = 43']].forEach(([u, t]) => (o += T(lx, Y(u) - 8, t, { fill: acc, size: 11.5 })))
  const rules = [
    ['01', 'a e p condividono', 'l’asta: un solo tratto', 'verticale di 38 u.'],
    ['02', 'la traversa nasce sulla', 'diagonale e chiude', 'l’occhiello della p.'],
    ['03', 'il nodo copre l’angolo', 'dell’apice: 1,3 × 1,414', '= 1,84 < 1,9.'],
  ]
  rules.forEach(([num, ...rows], i) => {
    const ry = 204 + i * 88
    o += T(lx, ry, num, { fill: acc, size: 11.5 })
    rows.forEach((r, j) => (o += T(lx + 26, ry + j * 18, r, dim)))
  })
  o += T(lx, Y(28) + 40, 'inclinazione', { fill: fg, size: 11.5, weight: 500 }) + T(lx, Y(28) + 60, 'arctan (38 / 16,5)', dim) + T(lx, Y(28) + 78, `= ${it(ANGLE, 2)}°`, dim)
  o += T(lx, Y(28) + 122, 'tratto', { fill: fg, size: 11.5, weight: 500 }) + T(lx, Y(28) + 142, '2,6 u, taglio netto', dim) + T(lx, Y(28) + 160, 'giunti a spigolo vivo', dim)
  o += T(lx, h - 40, 'ap · id · 03', dim)

  // colonna destra: coordinate
  const rx = 990
  const rw = w - 40 - rx
  o += T(rx, 78, 'punti', { fill: fg, size: 13, weight: 500 }) + T(rx + rw, 78, '(x ; y) in u', { ...dim, anchor: 'end' })
  POINTS.forEach(([name, desc, ux, uy], i) => {
    const ry = 204 + i * 27
    o += Ln(rx, ry + 8, rx + rw, ry + 8, fg, 1, ' opacity=".14"')
    o += T(rx, ry, name, { fill: acc, size: 12, weight: 500 }) + T(rx + 20, ry, desc, dim) + T(rx + rw, ry, `${it(ux)} ; ${it(uy)}`, { fill: fg, size: 11.5, anchor: 'end' })
  })
  o += T(rx, Y(28) + 40, 'occhiello', { fill: fg, size: 11.5, weight: 500 }) + T(rx, Y(28) + 60, 'asse r 11,5', dim) + T(rx, Y(28) + 78, 'bordi r 12,8 e r 10,2', dim)
  o += T(rx, Y(28) + 122, 'nodo', { fill: fg, size: 11.5, weight: 500 }) + T(rx, Y(28) + 142, 'ø 3,8 in b', dim) + T(rx, Y(28) + 160, 'minio acceso', dim)
  o += T(rx + rw, h - 40, 'u = 1/48 · 1 u = 14 px', { ...dim, anchor: 'end' })

  return out(w, h, label || 'Monogramma AP su fondo inchiostro con le linee di costruzione a tutta tavola, i punti notevoli e le loro coordinate', o)
}

// ── 4 · Il sistema in una tavola: marchio, colori, caratteri, logotipo, icona, spazi

const hexOf = (c) => c.toUpperCase()
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** Rapporto di contrasto WCAG tra due colori. */
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

function sistema({ w = 1200, h = 900, label } = {}) {
  const ink = C.ink
  const g = 12
  const m = 24
  const lw = 496
  const rx = m + lw + g
  const rw = w - m - rx
  const topH = 496
  const by = m + topH + g
  const bh = h - m - by
  let o = Rc(0, 0, w, h, C.paper3)
  const cell = (x, y, cw, ch, fill, letter, name, side, fg = ink) =>
    Rc(x, y, cw, ch, fill) + T(x + 18, y + 28, `${letter} — ${name}`, { fill: fg, size: 12, weight: 500 }) + (side ? T(x + cw - 18, y + 28, side, { fill: fg, size: 11, anchor: 'end', opacity: 0.65 }) : '')

  // a · marchio
  {
    const x = m
    const y = m
    const s = 372
    const bx = x + 84
    const byy = y + 56
    const k = s / 48
    const X = (u) => bx + u * k
    const Y = (u) => byy + u * k
    o += cell(x, y, lw, topH, C.sheet, 'a', 'marchio', 'u = 1/48 del lato')
    o += lattice(bx, byy, s, 48, { step: 2, major: 8, c: ink, o1: 0.07, o2: 0.16 })
    o += guides(bx, byy, s, { c: C.minio, over: 12 })
    o += apMark(bx, byy, s, { axis: C.sheet })
    o += angleArc(bx, byy, s, { size: 11.5 }) + radius(bx, byy, s, { size: 11.5 })
    const q1 = bx - 30
    const q2 = bx - 58
    for (const u of [5, 28, 43]) o += Ln(q2 - 6, Y(u), bx - 16, Y(u), ink, 1, ' opacity=".35"')
    o += quota(q1, Y(5), q1, Y(28), '23', { size: 11 }) + quota(q1, Y(28), q1, Y(43), '15', { size: 11 }) + quota(q2, Y(5), q2, Y(43), '38', { size: 11 })
    const qy = byy + s + 32
    for (const u of [7, 23.5, 32, 43.5]) o += Ln(X(u), byy + s + 6, X(u), qy + 6, ink, 1, ' opacity=".35"')
    o += quota(X(7), qy, X(23.5), qy, '16,5', { size: 11 }) + quota(X(23.5), qy, X(32), qy, '8,5', { size: 11 }) + quota(X(32), qy, X(43.5), qy, '11,5', { size: 11 })
    o += T(bx + s + 14, Y(5) + 4, '5', { fill: C.deep, size: 10.5 }) + T(bx + s + 14, Y(28) + 4, '28', { fill: C.deep, size: 10.5 }) + T(bx + s + 14, Y(43) + 4, '43', { fill: C.deep, size: 10.5 })
    o += T(x + 18, y + topH - 16, `tratto 2,6 · nodo ø 3,8 · inclinazione ${it(ANGLE)}°`, { fill: ink, size: 10.5, opacity: 0.7 })
  }

  // b · colori
  {
    const x = rx
    const y = m
    const ch = 242
    o += cell(x, y, rw, ch, C.sheet, 'b', 'colori', 'carta · inchiostro · minio')
    const main = [
      { name: 'carta', hex: C.paper, token: '--c-paper', fg: ink, on: ink },
      { name: 'inchiostro', hex: C.ink, token: '--c-ink', fg: C.paper, on: C.paper },
      { name: 'minio', hex: C.minio, token: '--c-minio', fg: ink, on: ink },
    ]
    const sw = (rw - 36 - 2 * 10) / 3
    main.forEach((c, i) => {
      const sx = x + 18 + i * (sw + 10)
      const sy = y + 44
      const rgb = [1, 3, 5].map((j) => parseInt(c.hex.slice(j, j + 2), 16)).join(' ')
      o += Rc(sx, sy, sw, 118, c.hex, i === 0 ? ` stroke="${ink}" stroke-opacity=".2"` : '')
      o += T(sx + 12, sy + 30, c.name, { fill: c.fg, size: 21, family: SANS, weight: 600, spacing: '-0.02em' })
      o += T(sx + 12, sy + 74, hexOf(c.hex), { fill: c.fg, size: 11.5 }) + T(sx + 12, sy + 90, `rgb ${rgb}`, { fill: c.fg, size: 10, opacity: 0.75 }) + T(sx + 12, sy + 106, c.token, { fill: c.fg, size: 10, opacity: 0.75 })
      o += T(sx + sw - 12, sy + 30, `${it(contrast(c.hex, c.on))} : 1`, { fill: c.fg, size: 11.5, anchor: 'end' })
    })
    const minor = [
      ['carta 2', C.paper2],
      ['carta 3', C.paper3],
      ['grafite', C.graphite],
      ['minio profondo', C.deep],
      ['minio acceso', C.bright],
    ]
    const mw = (rw - 36) / minor.length
    minor.forEach(([name, hex], i) => {
      const sx = x + 18 + i * mw
      const sy = y + 178
      o += Rc(sx, sy, 26, 26, hex, ` stroke="${ink}" stroke-opacity=".2"`) + T(sx + 34, sy + 11, name, { fill: ink, size: 10 }) + T(sx + 34, sy + 24, hexOf(hex), { fill: ink, size: 9, opacity: 0.65 })
    })
    o += T(x + 18, y + ch - 12, 'il numero è il contrasto del testo sul colore: sul minio si scrive in inchiostro, mai in bianco', { fill: ink, size: 9, opacity: 0.6 })
  }

  // c · caratteri
  {
    const x = rx
    const y = m + 242 + g
    const ch = topH - 242 - g
    o += cell(x, y, rw, ch, C.sheet, 'c', 'caratteri', 'archivo · cascadia code · instrument serif')
    // Archivo: le linee del carattere su un corpo di 96 px (x 0,53 · asc. 0,73 · disc. 0,18 em)
    const fs = 96
    const base = y + 142
    const tx = x + 62
    const lines = [[0.73, 'asc.'], [0.53, 'x'], [0, 'base'], [-0.18, 'disc.']]
    for (const [em, name] of lines) {
      o += Ln(x + 18, base - em * fs, x + 372, base - em * fs, C.minio, 1) + T(x + 18, base - em * fs - 4, name, { fill: C.deep, size: 9 })
    }
    o += T(tx, base, 'alberto', { fill: ink, size: fs, family: SANS, weight: 640, stretch: 86, spacing: '-0.055em' })
    o += T(x + 18, y + ch - 44, 'archivo variable', { fill: ink, size: 11.5, weight: 500 }) + T(x + 18, y + ch - 28, 'peso 100–900 · larghezza 62–125 %', { fill: ink, size: 10, opacity: 0.7 }) + T(x + 18, y + ch - 14, 'x 0,53 · asc. 0,73 · disc. 0,18 em', { fill: ink, size: 10, opacity: 0.7 })
    // l'asse della larghezza
    const ax = x + 396
    ;[[62, 'minima'], [86, 'nome e inviti'], [100, 'testo'], [125, 'massima']].forEach(([st, use], i) => {
      const yy = y + 60 + i * 25
      o += T(ax, yy, 'pecchini', { fill: ink, size: 21, family: SANS, weight: 600, stretch: st, spacing: '-0.02em' }) + T(x + rw - 18, yy, `${st} % · ${use}`, { fill: ink, size: 9.5, anchor: 'end', opacity: 0.7 })
    })
    o += Ln(ax, y + 148, x + rw - 18, y + 148, ink, 1, ' opacity=".2"')
    o += T(ax, y + 170, 'diplomato geometra 0123', { fill: ink, size: 14 }) + T(ax, y + 184, 'cascadia code · etichette e dati · 14 px', { fill: ink, size: 9.5, opacity: 0.7 })
    o += T(ax, y + 212, 'misurare, ordinare', { fill: ink, size: 23, family: SERIF, italic: true }) + T(ax, y + 227, 'instrument serif · accenti nei titoli', { fill: ink, size: 9.5, opacity: 0.7 })
  }

  // d · logotipo
  {
    const x = m
    const y = by
    const f = 2.35
    const lx = x + (lw - 180.5 * f) / 2
    const ly = y + 118
    o += cell(x, y, lw, bh, C.paper, 'd', 'logotipo', 'testata · grandezza vera 180,5 × 40 px')
    o += lockup(lx, ly, f) + lockupDims(lx, ly, f, { size: 11, up: 20, down: 26 })
    const tx = lx + (LOGO.mark + LOGO.gap) * f
    const ex = tx + LOGO.text * f
    for (const [yy, name] of [[LOGO.name.base, 'base del nome 19,1'], [LOGO.role.base, 'base del mestiere 33,55']]) {
      o += Ln(tx, ly + yy * f, ex + 10, ly + yy * f, C.minio, 1)
    }
    o += T(x + 18, y + bh - 44, 'nome', { fill: ink, size: 11.5, weight: 500 }) + T(x + 18, y + bh - 28, 'archivo 640 · 17 px · −0,02 em', { fill: ink, size: 10, opacity: 0.7 }) + T(x + 18, y + bh - 14, 'base a 19,1 px dall’alto', { fill: ink, size: 10, opacity: 0.7 })
    o += T(x + lw / 2 + 10, y + bh - 44, 'mestiere', { fill: ink, size: 11.5, weight: 500 }) + T(x + lw / 2 + 10, y + bh - 28, 'cascadia code · 12 px · +0,02 em', { fill: ink, size: 10, opacity: 0.7 }) + T(x + lw / 2 + 10, y + bh - 14, 'base a 33,55 px · distanza 9,6 px', { fill: ink, size: 10, opacity: 0.7 })
  }

  // e · icona
  const ew = (rw - g) / 2
  {
    const x = rx
    const y = by
    const s = 176
    const ix = x + 44
    const iy = y + 62
    const k = s / 64
    const X = (u) => ix + u * k
    const Y = (u) => iy + u * k
    const fg = C.paper
    o += cell(x, y, ew, bh, ink, 'e', 'icona', '64 u', fg)
    o += icon(ix, iy, s, { dark: true }) + iconGuides(ix, iy, s, { size: 10 })
    const qx = ix + s + 24
    for (const u of [0, 13, 51, 64]) o += Ln(ix + s + 14, Y(u), qx + 6, Y(u), fg, 1, ' opacity=".35"')
    o += quota(qx, Y(0), qx, Y(13), '13', { c: fg, size: 10 }) + quota(qx, Y(13), qx, Y(51), '38', { c: fg, size: 10 }) + quota(qx, Y(51), qx, Y(64), '13', { c: fg, size: 10 })
    const qy = iy + s + 30
    for (const u of [0, 15.5, 32, 52, 64]) o += Ln(X(u), iy + s + 14, X(u), qy + 6, fg, 1, ' opacity=".35"')
    o += quota(X(0), qy, X(15.5), qy, '15,5', { c: fg, size: 10 }) + quota(X(15.5), qy, X(32), qy, '16,5', { c: fg, size: 10 }) + quota(X(32), qy, X(52), qy, '20', { c: fg, size: 10 }) + quota(X(52), qy, X(64), qy, '12', { c: fg, size: 10 })
    let sx = x + 18
    for (const [px, name] of [[30, '512'], [22, '180'], [16, '32']]) {
      o += icon(sx, y + bh - 16 - px, px, { dark: true }) + T(sx + px + 5, y + bh - 18, name, { fill: fg, size: 9, opacity: 0.75 })
      sx += px + 30
    }
    o += T(x + ew - 18, y + bh - 30, 'raggio 10 · tratto 4', { fill: fg, size: 9.5, anchor: 'end', opacity: 0.75 }) + T(x + ew - 18, y + bh - 16, 'nodo ø 6,8 minio', { fill: fg, size: 9.5, anchor: 'end', opacity: 0.75 })
  }

  // f · spazi, raggi, griglia
  {
    const x = rx + ew + g
    const y = by
    o += cell(x, y, ew, bh, C.sheet, 'f', 'spazi', 'base 4 px')
    const steps = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128]
    const sx = x + 18
    const scale = (ew - 36 - 34) / 128
    steps.forEach((px, i) => {
      const yy = y + 50 + i * 15
      o += T(sx, yy + 8, String(px), { fill: ink, size: 9.5, opacity: 0.75 }) + Rc(sx + 34, yy, px * scale, 9, i % 2 ? ink : C.minio)
    })
    const ry = y + 216
    o += Ln(sx, ry - 10, x + ew - 18, ry - 10, ink, 1, ' opacity=".2"') + T(sx, ry + 6, 'raggi', { fill: ink, size: 10, weight: 500 })
    ;[0, 2, 6, 12].forEach((r, i) => {
      const qx = sx + 52 + i * 52
      o += `<rect x="${n(qx)}" y="${n(ry - 2)}" width="34" height="34" rx="${r}" fill="none" stroke="${ink}" stroke-width="1.4"/>` + T(qx + 17, ry + 46, String(r), { fill: ink, size: 9.5, anchor: 'middle', opacity: 0.75 })
    })
    const gy = y + bh - 58
    o += Ln(sx, gy - 12, x + ew - 18, gy - 12, ink, 1, ' opacity=".2"')
    const cw = (ew - 36 - 11 * 5) / 12
    for (let i = 0; i < 12; i++) o += Rc(sx + i * (cw + 5), gy, cw, 26, C.minio, ' opacity=".34"')
    o += T(sx, gy + 42, '12 colonne · distanza da 12 a 32 px', { fill: ink, size: 9.5, opacity: 0.75 })
  }

  return out(w, h, label || 'Sistema visivo di Alberto Pecchini in una tavola: marchio, colori, caratteri, logotipo, icona e spazi, ognuno con le sue misure', o)
}

// ── Registro ─────────────────────────────────────────────────────────────────

const VARIANTS = { tavola, fogli, notte, sistema }

/** Tavola dell'identità del sito. `variant`: tavola · fogli · notte · sistema. */
export function identity({ variant = 'tavola', ...options } = {}) {
  return (VARIANTS[variant] || tavola)(options)
}

// Primitive e pezzi dell'identità riusati dalle tavole del sito (sitespec.js).
export { C, SANS, SERIF, MONO, T, Rc, Ln, Ci, it, quota, shadow, out, apMark, lockup }
