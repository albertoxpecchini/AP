// Tavole varie: ritratto segnaposto e carta dell'area operativa.

import { svg, line, path, text, circle, poly, cross, blob, rect, n } from './kit.js'

// ── Ritratto (segnaposto dichiarato) ─────────────────────────────────────────

export function portrait({ w = 1200, h = 1500, tone = 'tint', label } = {}) {
  const cx = w / 2
  const head = w * 0.155
  const hy = h * 0.37
  let out = ''
  // griglia proporzionale
  let grid = ''
  for (let i = 1; i < 8; i++) grid += `M${n((w / 8) * i)} 0V${h}`
  for (let i = 1; i < 10; i++) grid += `M0 ${n((h / 10) * i)}H${w}`
  out += path(grid, 'a-s2', ' style="opacity:.35"')
  // busto
  const sh = h * 0.6
  out += path(
    `M${n(cx - w * 0.36)} ${h}C${n(cx - w * 0.36)} ${n(sh + h * 0.08)} ${n(cx - w * 0.2)} ${n(sh)} ${n(cx - w * 0.07)} ${n(sh - h * 0.02)}V${n(hy + head * 0.8)}H${n(cx + w * 0.07)}V${n(sh - h * 0.02)}C${n(cx + w * 0.2)} ${n(sh)} ${n(cx + w * 0.36)} ${n(sh + h * 0.08)} ${n(cx + w * 0.36)} ${h}Z`,
    'a-fill',
  )
  out += `<ellipse class="a-fill" cx="${n(cx)}" cy="${n(hy)}" rx="${n(head)}" ry="${n(head * 1.22)}"/>`
  // colletto e risvolti
  out += path(`M${n(cx - w * 0.07)} ${n(sh - h * 0.02)}L${n(cx)} ${n(sh + h * 0.09)}L${n(cx + w * 0.07)} ${n(sh - h * 0.02)}`, 'a-si', ' style="stroke-width:3"')
  // costruzione
  out += circle(cx, hy, head * 1.6, 'a-s2 a-dash') + circle(cx, hy, head * 2.6, 'a-s2 a-dash')
  out += path(`M${n(cx)} ${n(h * 0.08)}V${n(h * 0.95)}`, 'a-sa a-dashdot') + line(w * 0.1, hy, w * 0.9, hy, 'a-sa a-dashdot')
  out += cross(cx, hy, 14, 'a-sa')
  for (const [x, y] of [[w * 0.1, h * 0.08], [w * 0.9, h * 0.08], [w * 0.1, h * 0.95], [w * 0.9, h * 0.95]]) out += cross(x, y, 10, 'a-s')
  out += text(w * 0.1, h * 0.105, 'RITRATTO · 4:5', { size: 20, spacing: '.12em' }) + text(w * 0.9, h * 0.105, 'FIG. 00', { c: 'a-tm', size: 20, anchor: 'end', spacing: '.12em' })
  out += text(w * 0.1, h * 0.13, 'SEGNAPOSTO — SOSTITUIRE CON FOTOGRAFIA', { c: 'a-ta', size: 17, spacing: '.1em' })
  return svg({ w, h, tone, label: label || 'Segnaposto del ritratto professionale', body: out })
}

// ── Carta dell'area operativa ────────────────────────────────────────────────

const CENTER = { lat: 45.1564, lon: 10.7914 }
const KM_LAT = 111.2
const KM_LON = 111.32 * Math.cos((CENTER.lat * Math.PI) / 180)

const CITIES = [
  ['Verona', 45.4384, 10.9916, 'l'],
  ['Brescia', 45.5416, 10.2118, 'l'],
  ['Cremona', 45.1332, 10.0227, 'l'],
  ['Parma', 44.8015, 10.3279, 'l'],
  ['Reggio Emilia', 44.6983, 10.6312, 'l'],
  ['Modena', 44.6471, 10.9252, 'l'],
  ['Ferrara', 44.8381, 11.6198, 'l'],
  ['Vicenza', 45.5455, 11.5354, 'l'],
  ['Legnago', 45.1929, 11.3113, 's'],
  ['Suzzara', 44.9925, 10.743, 's'],
  ['Castiglione d/S', 45.3906, 10.4894, 's'],
  ['Asola', 45.2206, 10.4131, 's'],
  ['Ostiglia', 45.0706, 11.1339, 's'],
  ['Goito', 45.2535, 10.663, 's'],
  ['Viadana', 44.927, 10.52, 's'],
]

const RIVERS = {
  Po: [[45.1, 9.9], [45.03, 10.12], [44.99, 10.3], [44.985, 10.42], [44.92, 10.52], [44.93, 10.66], [45.05, 10.75], [45.05, 10.93], [45.06, 11.13], [45.01, 11.29], [44.95, 11.43], [44.89, 11.61], [44.95, 11.9]],
  Mincio: [[45.44, 10.69], [45.35, 10.73], [45.3, 10.72], [45.25, 10.67], [45.18, 10.68], [45.157, 10.71], [45.166, 10.775], [45.15, 10.82], [45.09, 10.96], [45.06, 10.985]],
  Adige: [[45.7, 10.95], [45.55, 10.9], [45.44, 10.99], [45.33, 11.12], [45.19, 11.31], [45.13, 11.6], [45.12, 11.9]],
  Oglio: [[45.62, 9.9], [45.42, 9.98], [45.3, 10.1], [45.22, 10.3], [45.13, 10.43], [45.06, 10.6], [45.04, 10.67]],
}

const GARDA = [[45.44, 10.69], [45.47, 10.72], [45.505, 10.725], [45.55, 10.715], [45.58, 10.7], [45.63, 10.7], [45.72, 10.74], [45.72, 10.64], [45.66, 10.6], [45.61, 10.55], [45.6, 10.52], [45.57, 10.55], [45.54, 10.56], [45.5, 10.53], [45.465, 10.54], [45.455, 10.58], [45.475, 10.6], [45.495, 10.607], [45.47, 10.62], [45.445, 10.65]]

export function areamap({ w = 1200, h = 900, tone = 'paper', label } = {}) {
  const scale = w / 165 // px per km
  const X = (lon) => w / 2 + (lon - CENTER.lon) * KM_LON * scale
  const Y = (lat) => h / 2 - (lat - CENTER.lat) * KM_LAT * scale
  const P = ([lat, lon]) => [X(lon), Y(lat)]
  let out = ''

  // reticolo geografico ogni 15′
  for (let lon = 9.75; lon <= 12; lon += 0.25) {
    out += line(X(lon), 0, X(lon), h, 'a-s2') + text(X(lon) + 5, 16, `${Math.floor(lon)}°${String(Math.round((lon % 1) * 60)).padStart(2, '0')}′E`, { c: 'a-tm', size: 10 })
  }
  for (let lat = 44.5; lat <= 45.75; lat += 0.25) {
    out += line(0, Y(lat), w, Y(lat), 'a-s2') + text(6, Y(lat) - 5, `${Math.floor(lat)}°${String(Math.round((lat % 1) * 60)).padStart(2, '0')}′N`, { c: 'a-tm', size: 10 })
  }

  // lago di Garda e fiumi
  out += path(blob(GARDA.map(P)), 'a-soft2 a-s')
  out += text(X(10.63), Y(45.56), 'GARDA', { c: 'a-tm', size: 10, anchor: 'middle', spacing: '.2em' })
  for (const [name, pts] of Object.entries(RIVERS)) {
    out += path(blob(pts.map(P), false), name === 'Po' ? 'a-s' : 'a-s2', name === 'Po' ? ' style="stroke-width:2.4"' : ' style="stroke-width:1.5"')
  }
  out += text(X(11.22), Y(45.035), 'PO', { c: 'a-tm', size: 10, spacing: '.2em' }) + text(X(10.745), Y(45.3), 'MINCIO', { c: 'a-tm', size: 10, spacing: '.2em', rotate: -80 })
  // laghi di Mantova
  out += path(blob([[45.168, 10.73], [45.172, 10.765], [45.165, 10.79], [45.156, 10.812], [45.148, 10.818], [45.153, 10.8], [45.16, 10.78], [45.161, 10.75]].map(P)), 'a-soft2 a-s')

  // raggi d'azione
  for (const km of [10, 25, 50]) {
    out += circle(w / 2, h / 2, km * scale, km === 25 ? 'a-sa a-dash' : 'a-s2 a-dash')
    out += rect(w / 2 - 22, h / 2 - km * scale - 8, 44, 15, 'a-bg') + text(w / 2, h / 2 - km * scale + 4, `${km} km`, { c: km === 25 ? 'a-ta' : 'a-tm', size: 10.5, anchor: 'middle' })
  }

  // città
  for (const [name, lat, lon, size] of CITIES) {
    const [x, y] = P([lat, lon])
    if (x < 30 || x > w - 60 || y < 30 || y > h - 20) continue
    out += size === 'l' ? rect(x - 4, y - 4, 8, 8, 'a-fill') : circle(x, y, 3, 'a-bg a-s')
    out += text(x + 10, y + 4, size === 'l' ? name.toUpperCase() : name, { c: size === 'l' ? 'a-t' : 'a-tm', size: size === 'l' ? 11.5 : 10.5, spacing: size === 'l' ? '.08em' : undefined })
  }

  // Mantova
  out += cross(w / 2, h / 2, 26, 'a-sa') + circle(w / 2, h / 2, 7, 'a-acc') + circle(w / 2, h / 2, 14, 'a-sa')
  out += rect(w / 2 + 24, h / 2 + 12, 232, 42, 'a-bg a-sa') + text(w / 2 + 36, h / 2 + 30, 'MANTOVA — SEDE', { c: 'a-ta', size: 12, weight: 500, spacing: '.08em' }) + text(w / 2 + 36, h / 2 + 46, '45°09′23″N  10°47′29″E', { size: 10.5 })

  // scala
  out += rect(40, h - 58, 25 * scale + 40, 38, 'a-bg') + line(56, h - 34, 56 + 25 * scale, h - 34, 'a-sb') + line(56, h - 40, 56, h - 28, 'a-s') + line(56 + 25 * scale, h - 40, 56 + 25 * scale, h - 28, 'a-s')
  out += text(56, h - 44, '0', { c: 'a-tm', size: 10 }) + text(56 + 25 * scale, h - 44, '25 km', { c: 'a-tm', size: 10, anchor: 'end' })
  out += poly([[w - 60, 78], [w - 50, 46], [w - 40, 78], [w - 50, 70]], 'a-fill') + text(w - 50, 38, 'N', { size: 12, anchor: 'middle', weight: 500 })

  return svg({ w, h, tone, label: label || 'Carta dell’area operativa: Mantova con raggi di 10, 25 e 50 chilometri', body: out })
}
