// Assonometrie: struttura in legno lamellare, modello BIM esploso,
// rendering "clay" neutro e postazione di lavoro dello studio.

import { svg, sheet, line, path, text, poly, polyline, circle, leader, n } from './kit.js'

const C30 = Math.cos(Math.PI / 6)
const S30 = 0.5

/** Proiezione isometrica: restituisce P(x,y,z) → [sx, sy]. Si vedono le facce +x, +y e +z. */
function iso(ox, oy, k) {
  return (x, y, z = 0) => [ox + (x - y) * C30 * k, oy + (x + y) * S30 * k - z * k]
}

/** Centra l'assonometria di un volume [L × D × H] in un riquadro. */
function isoFit(box, L, D, H, pad = 0) {
  const wUnits = (L + D) * C30
  const hUnits = (L + D) * S30 + H
  const k = Math.min((box.w - pad * 2) / wUnits, (box.h - pad * 2) / hUnits)
  const ox = box.x + box.w / 2 + ((D - L) * C30 * k) / 2
  const oy = box.y + (box.h - hUnits * k) / 2 + H * k
  return { P: iso(ox, oy, k), k }
}

const FACE = { top: 'a-bg a-s', left: 'a-soft a-s', right: 'a-soft2 a-s' }

/** Parallelepipedo allineato agli assi: tre facce visibili. */
function box3(P, x, y, z, dx, dy, dz, face = FACE) {
  return (
    poly([P(x, y + dy, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)], face.left) +
    poly([P(x + dx, y, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x + dx, y, z + dz)], face.right) +
    poly([P(x, y, z + dz), P(x + dx, y, z + dz), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)], face.top)
  )
}

/** Riquadro disegnato su una faccia verticale (finestre, porte). */
const onFaceX = (P, x, y0, z0, y1, z1, c) => poly([P(x, y0, z0), P(x, y1, z0), P(x, y1, z1), P(x, y0, z1)], c)
const onFaceY = (P, y, x0, z0, x1, z1, c) => poly([P(x0, y, z0), P(x1, y, z0), P(x1, y, z1), P(x0, y, z1)], c)

function isoGrid(P, x0, y0, x1, y1, step, c = 'a-s2') {
  let d = ''
  for (let x = x0; x <= x1 + 0.01; x += step) d += `M${P(x, y0).map(n).join(' ')}L${P(x, y1).map(n).join(' ')}`
  for (let y = y0; y <= y1 + 0.01; y += step) d += `M${P(x0, y).map(n).join(' ')}L${P(x1, y).map(n).join(' ')}`
  return path(d, c, ' style="opacity:.55"')
}

/** Quota disposta lungo un asse dell'assonometria. */
function isoDim(P, a, b, label, angle) {
  const [x1, y1] = P(...a)
  const [x2, y2] = P(...b)
  return (
    line(x1, y1, x2, y2, 'a-s2') +
    circle(x1, y1, 2.4, 'a-fill') +
    circle(x2, y2, 2.4, 'a-fill') +
    text((x1 + x2) / 2, (y1 + y2) / 2 + 16, label, { c: 'a-tm', size: 11, anchor: 'middle', rotate: angle })
  )
}

// ── Tettoia in legno lamellare ───────────────────────────────────────────────

export function canopy({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 03', label, bare = false } = {}) {
  const sh = bare ? { markup: '', box: { x: 40, y: 40, w: w - 80, h: h - 80 } } : sheet(w, h, { code, title: 'TETTOIA IN LEGNO LAMELLARE · ASSONOMETRIA', scale: 'GL24h', tav })
  const L = 12
  const D = 5
  const { P } = isoFit({ ...sh.box, y: sh.box.y + 10, h: sh.box.h - 30 }, L + 2.4, D + 2.6, 4.2, 10)
  const zBack = 3.5
  const zFront = 2.65
  const zAt = (y) => zBack + ((zFront - zBack) * y) / D
  const frames = [0, 3, 6, 9, 12]

  let out = sh.markup
  out += isoGrid(P, -1, -1, L + 1, D + 1.5, 1)

  // plinti e pilastri (prima la fila arretrata)
  for (const y of [0, D]) {
    for (const x of frames) {
      const top = (y ? zFront : zBack) - 0.36
      out += box3(P, x - 0.3, y - 0.3, 0, 0.6, 0.6, 0.12, { top: 'a-soft2 a-s', left: 'a-soft2 a-s', right: 'a-soft2 a-s' })
      out += box3(P, x - 0.1, y - 0.1, 0.12, 0.2, 0.2, top - 0.12)
      // saette
      const zb = top
      out += polyline([P(x + 0.1, y, zb - 0.9), P(x + 0.95, y, zb)], 'a-sb') + (x > 0 ? polyline([P(x - 0.1, y, zb - 0.9), P(x - 0.95, y, zb)], 'a-sb') : '')
    }
    // trave di banchina
    out += box3(P, -0.5, y - 0.1, (y ? zFront : zBack) - 0.36, L + 1, 0.2, 0.36)
  }

  // travetti inclinati
  const y0 = -0.7
  const y1 = D + 0.9
  for (let x = -0.4; x <= L + 0.41; x += 0.8) {
    const wd = 0.12
    const hh = 0.2
    const zA = zAt(y0) + hh
    const zB = zAt(y1) + hh
    out += poly([P(x + wd, y0, zA - hh), P(x + wd, y1, zB - hh), P(x + wd, y1, zB), P(x + wd, y0, zA)], FACE.right)
    out += poly([P(x, y1, zB - hh), P(x + wd, y1, zB - hh), P(x + wd, y1, zB), P(x, y1, zB)], FACE.left)
    out += poly([P(x, y0, zA), P(x + wd, y0, zA), P(x + wd, y1, zB), P(x, y1, zB)], FACE.top)
  }
  // listelli
  let battens = ''
  for (let y = y0 + 0.2; y <= y1; y += 0.62) battens += `M${P(-0.45, y, zAt(y) + 0.22).map(n).join(' ')}L${P(L + 0.55, y, zAt(y) + 0.22).map(n).join(' ')}`
  out += path(battens, 'a-s')

  if (!bare) {
    out += isoDim(P, [0, D + 1.9, 0], [L, D + 1.9, 0], '12.00', 30)
    out += isoDim(P, [L + 1.6, 0, 0], [L + 1.6, D, 0], '5.00', -30)
    const [ax, ay] = P(L, 0, zBack)
    out += leader(ax, ay - 4, ax + 40, ay - 58, 'TRAVE 20 × 36 · GL24h')
    const [bx, by] = P(3, D, 1.4)
    out += leader(bx, by, bx - 60, by + 92, 'PILASTRO 20 × 20', { anchor: 'end' })
    const [cx, cy] = P(L + 0.4, y1, zAt(y1) + 0.1)
    out += leader(cx, cy, cx + 44, cy + 40, 'TRAVETTI 12 × 20')
    out += text(sh.box.x - 8, sh.box.y + 8, 'PENDENZA 17 %', { c: 'a-ta', size: 11, weight: 500, spacing: '.05em' })
    out += text(sh.box.x - 8, sh.box.y + 25, '5 PORTALI · INTERASSE 3.00', { c: 'a-tm', size: 11, spacing: '.05em' })
  }
  return svg({ w, h, tone, label: label || 'Assonometria di una tettoia in legno lamellare a falda unica', body: out })
}

// ── Modello BIM esploso ──────────────────────────────────────────────────────

function houseRoof(P, L, D, z, rise, over, classes) {
  const ry = D / 2
  const e = over
  // falda arretrata, timpano, falda frontale
  return (
    poly([P(-e, -e, z), P(L + e, -e, z), P(L + e, ry, z + rise), P(-e, ry, z + rise)], classes.far) +
    poly([P(L, 0, z), P(L, D, z), P(L, ry, z + rise * 0.98)], classes.gable) +
    poly([P(-e, ry, z + rise), P(L + e, ry, z + rise), P(L + e, D + e, z), P(-e, D + e, z)], classes.near)
  )
}

function houseWalls(P, L, D, z, H, t, face = FACE, windows = true) {
  let o = ''
  // pareti arretrate, tramezza, pareti frontali
  o += box3(P, 0, 0, z, L, t, H, face) + box3(P, 0, 0, z, t, D, H, face)
  o += box3(P, L * 0.55, t, z, 0.15, D - t * 2, H, face)
  o += box3(P, L - t, 0, z, t, D, H, face) + box3(P, 0, D - t, z, L, t, H, face)
  if (windows) {
    for (const x of [1.2, 4.2, 7.4]) o += onFaceY(P, D, x, z + 0.9, x + 1.3, z + 2.3, 'a-fill')
    for (const y of [1.4, 4.6]) o += onFaceX(P, L, y, z + 0.9, y + 1.5, z + 2.3, 'a-fill')
  }
  return o
}

export function bim({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 04', label, bare = false } = {}) {
  const sh = bare ? { markup: '', box: { x: 40, y: 30, w: w - 80, h: h - 60 } } : sheet(w, h, { code, title: 'MODELLO BIM · ESPLOSO ASSONOMETRICO', scale: 'LOD 300', tav })
  const L = 10
  const D = 7.6
  const gap = 1.7
  const levels = [
    { z: 0, name: 'PLATEA IN C.A.', note: 's = 30 cm' },
    { z: 0.3 + gap, name: 'PARETI PT · X-LAM 100', note: 'h = 2.80 m' },
    { z: 3.1 + gap * 2, name: 'SOLAIO · X-LAM 160', note: 'con massetto a secco', accent: true },
    { z: 3.4 + gap * 3, name: 'PARETI P1 · X-LAM 100', note: 'h = 2.60 m' },
    { z: 6.0 + gap * 4, name: 'COPERTURA VENTILATA', note: 'fibra di legno 160' },
  ]
  const total = levels.at(-1).z + 2.2
  const { P } = isoFit({ x: sh.box.x - 20, y: sh.box.y, w: sh.box.w - 190, h: sh.box.h }, L, D, total, 6)

  let out = sh.markup
  // guide verticali dell'esploso
  for (const [x, y] of [[0, D], [L, D], [L, 0]]) out += line(...P(x, y, 0), ...P(x, y, levels.at(-1).z), 'a-s2 a-dash')

  out += box3(P, -0.4, -0.4, levels[0].z, L + 0.8, D + 0.8, 0.3, { top: 'a-soft a-s', left: 'a-soft2 a-s', right: 'a-soft2 a-s' })
  out += houseWalls(P, L, D, levels[1].z, 2.8, 0.32)
  out += box3(P, 0, 0, levels[2].z, L, D, 0.3, { top: 'a-acc a-s', left: 'a-acc a-s', right: 'a-acc a-s' })
  out += houseWalls(P, L, D, levels[3].z, 2.6, 0.32)
  out += houseRoof(P, L, D, levels[4].z, 2.0, 0.5, { far: 'a-bg a-s', gable: 'a-soft2 a-s', near: 'a-soft a-s' })
  // orditura sulla falda frontale
  let ribs = ''
  for (let x = 0; x <= L; x += 0.8) ribs += `M${P(x, D / 2, levels[4].z + 2.0).map(n).join(' ')}L${P(x, D + 0.5, levels[4].z).map(n).join(' ')}`
  out += path(ribs, 'a-s2')

  if (!bare) {
    const lx = sh.box.x + sh.box.w - 176
    levels.forEach((lv, i) => {
      const [px, py] = P(L, D * 0.35, lv.z + (i === 4 ? 0.9 : i % 2 ? 1.4 : 0.15))
      out += circle(px, py, 2.6, 'a-fill') + polyline([[px, py], [lx - 14, py], [lx - 4, py]], 'a-s2')
      out += text(lx, py - 2, `0${5 - i}`, { c: lv.accent ? 'a-ta' : 'a-tm', size: 10 })
      out += text(lx + 22, py - 2, lv.name, { c: lv.accent ? 'a-ta' : 'a-t', size: 10.5, weight: 500 })
      out += text(lx + 22, py + 12, lv.note, { c: 'a-tm', size: 9.5 })
    })
  }
  return svg({ w, h, tone, label: label || 'Esploso assonometrico di un modello BIM a struttura in X-LAM', body: out })
}

// ── Rendering neutro ─────────────────────────────────────────────────────────

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const crossP = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower = []
  for (const q of p) {
    while (lower.length >= 2 && crossP(lower.at(-2), lower.at(-1), q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper = []
  for (const q of p.reverse()) {
    while (upper.length >= 2 && crossP(upper.at(-2), upper.at(-1), q) <= 0) upper.pop()
    upper.push(q)
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1))
}

export function render({ w = 1200, h = 900, tone = 'paper', label, variant = 'casa' } = {}) {
  const L = 10
  const D = 7.6
  const box = { x: 60, y: 40, w: w - 120, h: h - 70 }
  const { P } = isoFit(box, L + 9, D + 8, 7, 0)
  const clay = { top: 'a-r1', left: 'a-r2', right: 'a-r3' }
  const sun = [0.62, -0.3] // direzione dell'ombra sul piano

  const shadowOf = (x, y, dx, dy, H) => {
    const base = [[x, y], [x + dx, y], [x + dx, y + dy], [x, y + dy]]
    const cast = base.map(([a, b]) => [a + sun[0] * H, b + sun[1] * H])
    return poly(hull(base.concat(cast)).map(([a, b]) => P(a, b, 0)), 'a-r5')
  }

  let out = `<rect class="a-r0" width="${w}" height="${h}"/>`
  // piano d'appoggio
  out += poly([P(-5, -4), P(L + 6, -4), P(L + 6, D + 5), P(-5, D + 5)], 'a-r1')
  const tree = ([x, y, r]) => {
    const [sx, sy] = P(x + sun[0] * 3, y + sun[1] * 3, 0)
    const [tx, ty] = P(x, y, 0)
    const [cx, cy] = P(x, y, 2.6)
    const k = Math.abs(P(1, 0)[0] - P(0, 0)[0]) / C30
    return (
      `<ellipse class="a-r5" cx="${n(sx)}" cy="${n(sy)}" rx="${n(r * k * 0.9)}" ry="${n(r * k * 0.45)}"/>` +
      line(tx, ty, cx, cy, 'a-s2') + circle(cx, cy, r * k, 'a-r2') + circle(cx - r * k * 0.18, cy - r * k * 0.2, r * k * 0.72, 'a-r1')
    )
  }
  // ombre
  out += shadowOf(0, 0, L, D, 6.6) + shadowOf(L + 1.2, 1.4, 3.6, 5, 2.7) + shadowOf(-3.4, D + 1.5, 9, 0.25, 1.1)
  out += tree([-2.8, 1.2, 1.5])
  if (variant === 'casa') {
    out += box3(P, 0, 0, 0, L, D, 5.7, clay)
    for (const x of [1.2, 4.2, 7.4]) out += onFaceY(P, D, x, 0.9, x + 1.3, 2.4, 'a-r4') + onFaceY(P, D, x, 3.7, x + 1.3, 5.0, 'a-r4')
    out += onFaceX(P, L, 1.4, 0, 2.6, 2.3, 'a-r4') + onFaceX(P, L, 4.6, 0.9, 6.3, 2.4, 'a-r4') + onFaceX(P, L, 1.4, 3.7, 2.9, 5.0, 'a-r4') + onFaceX(P, L, 4.6, 3.7, 6.3, 5.0, 'a-r4')
    out += houseRoof(P, L, D, 5.7, 2.0, 0.55, { far: 'a-r1', gable: 'a-r3', near: 'a-r2' })
    // annesso e muro di cinta
    out += box3(P, L + 1.2, 1.4, 0, 3.6, 5, 2.7, clay) + onFaceY(P, 6.4, L + 1.7, 0, L + 4.3, 2.2, 'a-r4')
    out += box3(P, -3.4, D + 1.5, 0, 9, 0.25, 1.1, clay)
  }
  // alberi stilizzati
  for (const t of [[L + 3.2, D + 3, 1.2], [3, D + 3.6, 1]]) out += tree(t)
  return svg({ w, h, tone, bg: false, label: label || 'Rendering volumetrico neutro di un’abitazione con annesso', body: out })
}

// ── Postazione di lavoro (segnaposto per la fotografia dello studio) ─────────

/** La homepage del sito disegnata sul vetro del monitor (faccia y = costante). */
function homeScreen(P, y, x0, z0, x1, z1) {
  const u = (fx, fz) => P(x0 + (x1 - x0) * fx, y, z0 + (z1 - z0) * fz)
  const band = (fx0, fz0, fx1, fz1, c) => poly([u(fx0, fz0), u(fx1, fz0), u(fx1, fz1), u(fx0, fz1)], c)
  const bar = (fx0, fx1, fz, th, c) => band(fx0, fz, fx1, fz + th, c)
  let o = band(0, 0, 1, 1, 'a-fill a-s')
  // barra di navigazione: marchio a sinistra, voci a destra
  o += bar(0.06, 0.2, 0.895, 0.035, 'a-si')
  for (const [a, b] of [[0.57, 0.67], [0.7, 0.78], [0.81, 0.94]]) o += bar(a, b, 0.9, 0.03, 'a-si')
  o += bar(0.06, 0.94, 0.86, 0.014, 'a-si')
  // titolo dell'hero su due righe, filo d'accento
  o += bar(0.06, 0.6, 0.71, 0.075, 'a-si') + bar(0.06, 0.44, 0.6, 0.075, 'a-si')
  o += bar(0.06, 0.3, 0.545, 0.022, 'a-acc')
  // testo di lancio
  for (const [a, b, z] of [[0.06, 0.5, 0.45], [0.06, 0.43, 0.385], [0.06, 0.24, 0.32]]) o += bar(a, b, z, 0.03, 'a-si')
  // due pulsanti
  o += bar(0.06, 0.24, 0.17, 0.065, 'a-acc') + bar(0.27, 0.43, 0.17, 0.065, 'a-si')
  // figura dell'hero: una piantina in miniatura
  o += band(0.55, 0.14, 0.94, 0.5, 'a-si')
  o += band(0.59, 0.2, 0.74, 0.43, 'a-fill a-s') + band(0.77, 0.28, 0.9, 0.43, 'a-fill a-s')
  o += bar(0.59, 0.9, 0.17, 0.02, 'a-acc')
  return o
}

export function workspace({ w = 1200, h = 900, tone = 'tint', label } = {}) {
  const box = { x: 50, y: 40, w: w - 100, h: h - 80 }
  const { P } = isoFit(box, 5.4, 4.2, 2.4, 10)
  const dark = { top: 'a-fill a-s', left: 'a-fill a-s', right: 'a-fill a-s' }
  const clay = { top: 'a-bg a-s', left: 'a-soft2 a-s', right: 'a-soft2 a-s' }
  let out = ''
  // pavimento e pareti di fondo
  out += poly([P(0, 0), P(5.4, 0), P(5.4, 4.2), P(0, 4.2)], 'a-soft a-s2') + isoGrid(P, 0, 0, 5.4, 4.2, 0.6)
  out += poly([P(0, 0, 0), P(5.4, 0, 0), P(5.4, 0, 2.4), P(0, 0, 2.4)], 'a-bg a-s2') + poly([P(0, 0, 0), P(0, 4.2, 0), P(0, 4.2, 2.4), P(0, 0, 2.4)], 'a-bg a-s2')
  // tavole appese alla parete
  for (let i = 0; i < 3; i++) out += onFaceY(P, 0, 0.7 + i * 1.25, 1.15, 1.7 + i * 1.25, 1.95, i === 1 ? 'a-soft2 a-s' : 'a-bg a-s')
  out += polyline([P(0.85, 0, 1.3), P(1.2, 0, 1.75), P(1.55, 0, 1.4)], 'a-s2') + circle(...P(2.45, 0, 1.55), 12, 'a-s2') + line(...P(3.35, 0, 1.3), ...P(4.05, 0, 1.8), 'a-sa')
  // scaffale
  out += box3(P, 0, 0.5, 0, 0.4, 1.7, 1.9)
  for (const z of [0.5, 0.95, 1.4]) out += line(...P(0.4, 0.5, z), ...P(0.4, 2.2, z), 'a-s2')
  for (let i = 0; i < 6; i++) out += circle(...P(0.4, 0.75 + i * 0.22, 1.62), 5.5, 'a-bg a-s')
  // portarotoli: i disegni stanno in piedi in un cesto, appoggiato a terra
  out += box3(P, 0.62, 2.5, 0, 0.42, 0.42, 0.4, clay)
  for (const [rx, ry, rz] of [[0.72, 2.66, 0.58], [0.83, 2.74, 0.74], [0.93, 2.6, 0.5]]) out += line(...P(rx, ry, 0.3), ...P(rx - 0.06, ry - 0.06, 0.4 + rz), 'a-sb')
  // scrivania
  out += box3(P, 1.3, 1.0, 0.72, 2.6, 1.0, 0.05)
  for (const [x, y] of [[1.35, 1.05], [3.8, 1.05], [1.35, 1.9], [3.8, 1.9]]) out += box3(P, x, y, 0, 0.06, 0.06, 0.72)
  // monitor: base, montante, scocca e la homepage sul vetro
  out += box3(P, 2.35, 1.22, 0.77, 0.3, 0.2, 0.03) + box3(P, 2.47, 1.3, 0.8, 0.06, 0.04, 0.2)
  out += box3(P, 1.95, 1.27, 0.98, 1.1, 0.04, 0.62, dark)
  out += homeScreen(P, 1.265, 2.0, 1.02, 3.0, 1.56)
  // tastiera e portatile aperto
  out += box3(P, 2.1, 1.62, 0.77, 0.75, 0.24, 0.02) + box3(P, 3.25, 1.35, 0.77, 0.5, 0.36, 0.02, dark)
  out += poly([P(3.25, 1.35, 0.79), P(3.75, 1.35, 0.79), P(3.75, 1.3, 1.12), P(3.25, 1.3, 1.12)], 'a-soft2 a-s')
  // sedia: seduta, quattro gambe, schienale su montanti
  const cx = 2.35
  const cy = 2.35
  const cw = 0.55
  out += box3(P, cx, cy, 0.44, cw, cw, 0.06)
  for (const [dx, dy] of [[0.02, 0.02], [cw - 0.08, 0.02], [0.02, cw - 0.08], [cw - 0.08, cw - 0.08]]) out += box3(P, cx + dx, cy + dy, 0, 0.06, 0.06, 0.44, clay)
  for (const dx of [0.02, cw - 0.08]) out += box3(P, cx + dx, cy + cw - 0.08, 0.5, 0.06, 0.06, 0.44)
  out += box3(P, cx, cy + cw - 0.09, 0.7, cw, 0.08, 0.24)
  // plotter su mobiletto, col foglio che esce dalla fessura verso la stanza
  out += box3(P, 4.45, 0.4, 0, 0.62, 1.7, 0.66, clay)
  out += line(...P(4.45, 0.4, 0.33), ...P(4.45, 2.1, 0.33), 'a-s2')
  out += box3(P, 4.5, 0.45, 0.66, 0.52, 1.6, 0.3)
  out += poly([P(4.5, 0.6, 0.66), P(4.5, 1.9, 0.66), P(4.12, 1.9, 0.26), P(4.12, 0.6, 0.26)], 'a-bg a-s')
  out += line(...P(4.5, 0.6, 0.68), ...P(4.5, 1.9, 0.68), 'a-s')
  // stazione totale su treppiede
  const tx = 4.35
  const ty = 3.3
  for (const [dx, dy] of [[-0.45, 0.2], [0.4, 0.3], [0, -0.5]]) out += line(...P(tx + dx, ty + dy, 0), ...P(tx, ty, 1.35), 'a-s')
  out += box3(P, tx - 0.11, ty - 0.11, 1.35, 0.22, 0.22, 0.3, { top: 'a-acc a-s', left: 'a-acc a-s', right: 'a-acc a-s' }) + circle(...P(tx + 0.11, ty, 1.52), 5, 'a-bg a-s')
  return svg({ w, h, tone, label: label || 'Illustrazione assonometrica della postazione di lavoro dello studio', body: out })
}
