// Prospetto e sezione di un fabbricato rurale a due piani.
// `state: 'before' | 'after'` disegna lo stesso edificio prima e dopo il recupero:
// le due tavole condividono la geometria, quindi funzionano nel confronto prima/dopo.

import { svg, sheet, fit, rect, line, path, text, dim, level, leader, circle, polyline, blob, hatch, rng, nextId, n } from './kit.js'

const W = 14 // larghezza fronte (m)
const EAVES = 5.6
const RIDGE = 7.3
const FLOOR = 2.9
const BAYS = [0, 2.8, 5.6, 8.4, 14]

function brickPattern() {
  const id = nextId('b')
  return {
    id,
    def: `<pattern id="${id}" width="22" height="11" patternUnits="userSpaceOnUse"><path class="a-s2" d="M0 .5H22M0 6H22M5 .5V6M16 6V11"/></pattern>`,
  }
}

export function elevation({ w = 1200, h = 900, tone = 'paper', state = 'after', code = 'AP-00', tav = 'TAV. 05', label, bare = false } = {}) {
  const before = state === 'before'
  const R = rng(before ? 11 : 12)
  const sh = bare
    ? { markup: '', box: { x: w * 0.08, y: h * 0.12, w: w * 0.84, h: h * 0.74 } }
    : sheet(w, h, {
        code,
        title: before ? 'PROSPETTO SUD · STATO DI FATTO' : 'PROSPETTO SUD · STATO DI PROGETTO',
        scale: 'SCALA 1:100',
        tav,
      })
  const box = { x: sh.box.x - 6, y: sh.box.y + 10, w: sh.box.w - 150, h: sh.box.h - 70 }
  const T = fit({ x: -3.1, y: -8.4, w: W + 4.7, h: 9.4 }, box)
  const { X, s } = T
  const Y = (m) => T.Y(-m) // altezze positive verso l'alto
  const R_ = (x, y, ww, hh, c, extra) => rect(X(x), Y(y + hh), ww * s, hh * s, c, extra)

  const shade = hatch({ angle: 45, gap: 5 })
  const earth = hatch({ angle: -45, gap: 9 })
  const brick = brickPattern()
  let defs = shade.def + earth.def + brick.def
  let out = sh.markup

  // terreno
  out += rect(X(-3.1), Y(0), (W + 4.7) * s, 0.55 * s, 'a-none', ` ${earth.fill}`)
  out += line(X(-3.1), Y(0), X(W + 1.6), Y(0), 'a-sb')

  // alberi di riferimento
  out += tree(X(-1.15), Y(0), 3.9 * s, R) + tree(X(W + 0.95), Y(0), 3.1 * s, R)

  // corpo di fabbrica
  out += R_(0, 0, W, EAVES, 'a-bg a-s')

  // copertura in coppi
  const roofTop = before ? RIDGE - 0.12 : RIDGE
  let roof = `M${n(X(-0.45))} ${n(Y(EAVES))}L${n(X(-0.45))} ${n(Y(roofTop))}`
  if (before) {
    // colmo insellato
    const steps = 14
    for (let i = 1; i <= steps; i++) {
      const x = -0.45 + ((W + 0.9) / steps) * i
      const sag = Math.sin((i / steps) * Math.PI) * 0.22 + R.range(-0.03, 0.03)
      roof += `L${n(X(x))} ${n(Y(roofTop - sag))}`
    }
  } else roof += `L${n(X(W + 0.45))} ${n(Y(roofTop))}`
  roof += `L${n(X(W + 0.45))} ${n(Y(EAVES))}Z`
  const clip = nextId('c')
  defs += `<clipPath id="${clip}"><path d="${roof}"/></clipPath>`
  let tiles = ''
  for (let x = -0.45; x < W + 0.45; x += 0.235) tiles += `M${n(X(x))} ${n(Y(EAVES))}V${n(Y(RIDGE + 0.1))}`
  out += path(roof, 'a-bg a-s') + `<g clip-path="url(#${clip})">${path(tiles, 'a-s2')}</g>`
  if (before) {
    // coppi mancanti
    for (let i = 0; i < 5; i++) {
      const x = R.range(1, W - 2)
      out += R_(x, R.range(EAVES + 0.3, RIDGE - 0.8), R.range(0.5, 1.1), R.range(0.25, 0.5), 'a-fill')
    }
  }
  out += R_(-0.55, EAVES - 0.12, W + 1.1, 0.16, 'a-fill')
  out += rect(X(0), Y(EAVES - 0.12), W * s, 0.34 * s, 'a-none', ` ${shade.fill}`)
  // comignoli
  for (const cx of before ? [3.4] : [3.4, 9.9]) {
    out += R_(cx, RIDGE - 0.45, 0.62, 1.0, 'a-bg a-s') + R_(cx - 0.08, RIDGE + 0.55, 0.78, 0.12, 'a-fill')
  }
  // pluviali
  for (const px of [0.22, W - 0.34]) out += R_(px, 0, 0.12, EAVES - 0.12, 'a-bg a-s2')
  // marcapiano
  out += line(X(0), Y(FLOOR + 0.2), X(W), Y(FLOOR + 0.2), 'a-s2')

  // aperture — piano terra
  const winW = 1.05
  const gf = [
    { x: 0.9, kind: 'window' },
    { x: 3.6, kind: 'door' },
    { x: 6.45, kind: 'window' },
  ]
  for (const o of gf) {
    if (o.kind === 'door') out += doorEl(o.x, before)
    else out += windowEl(o.x, 0.95, winW, 1.5, before, R)
  }
  // grande apertura del fienile
  const bx = 9.2
  const bw = 3.9
  const bh = 3.5
  const arch = `M${n(X(bx))} ${n(Y(0))}V${n(Y(bh - 1.1))}A${n((bw / 2) * s)} ${n(1.1 * s)} 0 0 1 ${n(X(bx + bw))} ${n(Y(bh - 1.1))}V${n(Y(0))}Z`
  if (before) {
    out += path(arch, 'a-fill')
    for (let i = 0; i < 6; i++) {
      const px = bx + 0.25 + i * 0.62
      out += line(X(px), Y(0), X(px + R.range(-0.08, 0.08)), Y(R.range(1.4, 2.6)), 'a-si')
    }
  } else {
    out += path(arch, 'a-soft a-s')
    for (let i = 1; i < 4; i++) out += line(X(bx + (bw / 4) * i), Y(0), X(bx + (bw / 4) * i), Y(bh - (i === 2 ? 0 : 0.32)), 'a-s')
    out += line(X(bx), Y(2.3), X(bx + bw), Y(2.3), 'a-s')
    out += path(arch, 'a-sb')
  }

  // aperture — piano primo
  for (const x of [0.9, 3.68, 6.45]) out += windowEl(x, FLOOR + 1.0, winW, 1.35, before, R, x === 3.68)
  if (before) {
    // gelosia in laterizio del fienile
    out += rect(X(9.2), Y(FLOOR + 2.3), 3.9 * s, 1.5 * s, 'a-s', ` style="fill:url(#${brick.id})"`)
  } else {
    out += windowEl(9.4, FLOOR + 1.0, winW, 1.35, false, R) + windowEl(11.85, FLOOR + 1.0, winW, 1.35, false, R)
  }

  // degrado / interventi
  if (before) {
    const patches = [
      [1.9, 1.2, 1.1, 0.9],
      [7.9, 3.6, 0.9, 1.3],
      [5.2, 0.55, 1.2, 0.55],
      [12.9, 1.5, 0.8, 1.2],
      [2.2, 4.4, 1.0, 0.5],
    ]
    for (const [px, py, rx, ry] of patches) {
      const pts = []
      for (let a = 0; a < 9; a++) {
        const ang = (a / 9) * Math.PI * 2
        const k = R.range(0.72, 1.18)
        pts.push([X(px + Math.cos(ang) * rx * k), Y(py + Math.sin(ang) * ry * k)])
      }
      out += path(blob(pts), 'a-s2', ` style="fill:url(#${brick.id})"`)
    }
    // lesioni
    out += crack(X(7.5), Y(FLOOR + 1.0), X(8.3), Y(0.4), R) + crack(X(1.95), Y(FLOOR + 2.35), X(2.6), Y(EAVES - 0.3), R)
    if (!bare) {
      out += leader(X(8.2), Y(3.9), X(W) + 26, Y(4.6), 'DISTACCO INTONACO')
      out += leader(X(7.95), Y(1.5), X(W) + 26, Y(1.4), 'LESIONE PASSANTE')
      out += leader(X(11.2), Y(FLOOR + 1.6), X(W) + 26, Y(3.6), 'GELOSIA IN COTTO')
      out += leader(X(7), Y(RIDGE - 0.35), X(W) + 26, Y(6.6), 'COLMO INSELLATO')
    }
  } else if (!bare) {
    out += leader(X(12.4), Y(FLOOR + 1.7), X(W) + 26, Y(4.6), 'SERRAMENTI IN LEGNO')
    out += leader(X(11.2), Y(1.6), X(W) + 26, Y(1.4), 'VETRATA SULL’ARCO')
    out += leader(X(8.15), Y(3.6), X(W) + 26, Y(3.6), 'INTONACO A CALCE')
    out += leader(X(9), Y(RIDGE - 0.4), X(W) + 26, Y(6.6), 'COPPI DI RECUPERO')
  }

  // figura umana (h 1.75 m)
  out += human(X(8.55), Y(0), s)

  if (!bare) {
    // quote altimetriche e catena dei campi
    const lx = X(-3.0)
    for (const [m, l] of [[0, '±0.00'], [FLOOR + 0.2, '+3.10'], [EAVES, '+5.60'], [RIDGE, '+7.30']]) {
      out += line(lx + 62, Y(m), X(m >= EAVES ? -0.55 : 0), Y(m), 'a-s2 a-dash') + level(lx, Y(m), l, { len: 58 })
    }
    const base = Y(0) + 0.55 * s
    for (let i = 0; i < BAYS.length - 1; i++) out += dim(X(BAYS[i]), base, X(BAYS[i + 1]), base, (BAYS[i + 1] - BAYS[i]).toFixed(2), { off: 26 })
  }

  return svg({ w, h, tone, defs, label: label || `Prospetto sud, ${before ? 'stato di fatto' : 'stato di progetto'}`, body: out })

  function windowEl(x, sill, ww, hh, degraded, R, broken = false) {
    let o = R_(x - 0.1, sill - 0.1, ww + 0.2, 0.1, 'a-bg a-s2') // davanzale
    o += R_(x, sill, ww, hh, degraded ? 'a-fill' : 'a-soft2 a-s')
    if (!degraded) {
      o += line(X(x + ww / 2), Y(sill), X(x + ww / 2), Y(sill + hh), 'a-s') + line(X(x), Y(sill + hh * 0.62), X(x + ww), Y(sill + hh * 0.62), 'a-s2')
      o += rect(X(x), Y(sill + hh), ww * s, 0.16 * s, 'a-none', ` ${shade.fill}`)
    }
    // scuri
    const leaves = degraded ? (broken ? [1] : R.chance(0.6) ? [-1, 1] : [-1]) : [-1, 1]
    for (const side of leaves) {
      const lx = side < 0 ? x - ww / 2 - 0.06 : x + ww + 0.06
      let louvers = ''
      for (let k = 1; k < 9; k++) louvers += `M${n(X(lx + 0.06))} ${n(Y(sill + (hh / 9) * k))}H${n(X(lx + ww / 2 - 0.06))}`
      const tilt = degraded && broken ? ` transform="rotate(7 ${n(X(lx))} ${n(Y(sill + hh))})"` : ''
      o += `<g${tilt}>` + R_(lx, sill, ww / 2, hh, 'a-bg a-s') + path(louvers, 'a-s2') + '</g>'
    }
    return o
  }

  function doorEl(x, degraded) {
    const dw = 1.25
    const dh = 2.45
    let o = R_(x - 0.12, 0, dw + 0.24, dh + 0.14, 'a-bg a-s2')
    o += R_(x, 0, dw, dh, degraded ? 'a-fill' : 'a-soft2 a-s')
    if (!degraded) {
      o += line(X(x + dw / 2), Y(0), X(x + dw / 2), Y(dh), 'a-s')
      for (const k of [0.25, 1.3]) o += R_(x + 0.12, k, dw / 2 - 0.24, 0.85, 'a-s2') + R_(x + dw / 2 + 0.12, k, dw / 2 - 0.24, 0.85, 'a-s2')
      o += rect(X(x), Y(dh), dw * s, 0.16 * s, 'a-none', ` ${shade.fill}`)
    }
    return o + R_(x - 0.2, -0.0, dw + 0.4, 0.09, 'a-fill')
  }
}

function crack(x1, y1, x2, y2, R) {
  const pts = [[x1, y1]]
  const steps = 9
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    pts.push([x1 + (x2 - x1) * t + R.range(-7, 7), y1 + (y2 - y1) * t + R.range(-3, 3)])
  }
  pts.push([x2, y2])
  return polyline(pts, 'a-sa')
}

function tree(x, base, size, R) {
  const cy = base - size * 0.66
  const pts = []
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2
    const k = R.range(0.82, 1.1)
    pts.push([x + Math.cos(ang) * size * 0.34 * k, cy + Math.sin(ang) * size * 0.36 * k])
  }
  return line(x, base, x, cy + size * 0.1, 'a-s2') + path(blob(pts), 'a-s2') + line(x, cy + size * 0.1, x - size * 0.1, cy - size * 0.06, 'a-s2') + line(x, cy + size * 0.18, x + size * 0.12, cy, 'a-s2')
}

export function human(x, base, s, c = 'a-fill') {
  const hgt = 1.75 * s
  return (
    circle(x, base - hgt + 0.11 * s, 0.11 * s, c) +
    path(
      `M${n(x - 0.2 * s)} ${n(base - hgt + 0.28 * s)}H${n(x + 0.2 * s)}L${n(x + 0.15 * s)} ${n(base - hgt * 0.5)}L${n(x + 0.12 * s)} ${n(base)}H${n(x + 0.02 * s)}L${n(x)} ${n(base - hgt * 0.46)}L${n(x - 0.02 * s)} ${n(base)}H${n(x - 0.12 * s)}L${n(x - 0.15 * s)} ${n(base - hgt * 0.5)}Z`,
      c,
    )
  )
}

// ── Sezione trasversale ─────────────────────────────────────────────────────

export function section({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 04', label, bare = false } = {}) {
  const D = 7.4 // profondità del corpo di fabbrica
  const sh = bare
    ? { markup: '', box: { x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.78 } }
    : sheet(w, h, { code, title: 'SEZIONE A—A′ · STATO DI PROGETTO', scale: 'SCALA 1:50', tav })
  const box = { x: sh.box.x + 80, y: sh.box.y + 6, w: sh.box.w - 170, h: sh.box.h - 40 }
  const T = fit({ x: -2.2, y: -8.2, w: D + 4.4, h: 9.9 }, box)
  const { X, s } = T
  const Y = (m) => T.Y(-m)
  const R_ = (x, y, ww, hh, c, extra) => rect(X(x), Y(y + hh), ww * s, hh * s, c, extra)

  const earth = hatch({ angle: -45, gap: 9 })
  const gravel = hatch({ angle: 45, gap: 5 })
  const insul = hatch({ angle: 60, gap: 4 })
  const defs = earth.def + gravel.def + insul.def
  let out = sh.markup

  const tw = 0.45 // spessore muri portanti
  // terreno e fondazioni
  out += rect(X(-2.2), Y(0), (D + 4.4) * s, 1.5 * s, 'a-none', ` ${earth.fill}`)
  out += R_(-0.25, -1.2, tw + 0.5, 0.5, 'a-fill') + R_(D - tw - 0.25, -1.2, tw + 0.5, 0.5, 'a-fill')
  out += R_(0, -0.7, tw, 0.7, 'a-fill') + R_(D - tw, -0.7, tw, 0.7, 'a-fill')
  // vespaio e solaio controterra
  out += rect(X(tw), Y(-0.12), (D - tw * 2) * s, 0.42 * s, 'a-bg a-s2') + rect(X(tw), Y(-0.12), (D - tw * 2) * s, 0.42 * s, 'a-none', ` ${gravel.fill}`)
  out += R_(tw, -0.12, D - tw * 2, 0.12, 'a-fill')
  out += line(X(-2.2), Y(0), X(0), Y(0), 'a-sb') + line(X(D), Y(0), X(D + 2.2), Y(0), 'a-sb')

  // muri sezionati con aperture
  const wallSegs = (x, openings) => {
    let o = ''
    let from = 0
    for (const [a, b] of openings) {
      o += R_(x, from, tw, a - from, 'a-fill')
      o += R_(x, a, tw, b - a, 'a-bg') + line(X(x), Y(a), X(x + tw), Y(a), 'a-s') + line(X(x), Y(b), X(x + tw), Y(b), 'a-s')
      o += line(X(x + tw / 2), Y(a), X(x + tw / 2), Y(b), 'a-s2')
      from = b
    }
    return o + R_(x, from, tw, EAVES - from, 'a-fill')
  }
  out += wallSegs(0, [[0.95, 2.45], [FLOOR + 1.0, FLOOR + 2.35]])
  out += wallSegs(D - tw, [[0, 2.45], [FLOOR + 1.0, FLOOR + 2.35]])

  // solaio interpiano in legno: travi + tavolato
  out += R_(tw, FLOOR, D - tw * 2, 0.08, 'a-fill')
  for (let x = tw + 0.35; x < D - tw - 0.2; x += 0.62) out += R_(x, FLOOR - 0.24, 0.16, 0.24, 'a-soft2 a-s')
  out += R_(tw, FLOOR + 0.08, D - tw * 2, 0.12, 'a-bg a-s2')

  // copertura: puntoni, isolamento, manto
  const ridgeX = D / 2
  const over = 0.55
  const slope = (RIDGE - EAVES) / (D / 2)
  const rafter = (t0, t1, c, extra = '') => {
    // fascia parallela alla falda tra gli offset verticali t0 e t1
    const pL = (dx, t) => [X(dx), Y(EAVES + slope * dx + t)]
    const left = [pL(-over, t0), pL(ridgeX, t0), pL(ridgeX, t1), pL(-over, t1)]
    const pR = (dx, t) => [X(D - dx), Y(EAVES + slope * dx + t)]
    const right = [pR(-over, t0), pR(ridgeX, t0), pR(ridgeX, t1), pR(-over, t1)]
    return `<polygon class="${c}" points="${left.map((p) => p.map(n).join(' ')).join(' ')}"${extra}/>` + `<polygon class="${c}" points="${right.map((p) => p.map(n).join(' ')).join(' ')}"${extra}/>`
  }
  out += rafter(0, 0.22, 'a-soft2 a-s')
  out += rafter(0.22, 0.4, 'a-bg a-s2') + rafter(0.22, 0.4, 'a-none', ` ${insul.fill}`)
  out += rafter(0.4, 0.5, 'a-fill')
  // trave di colmo e catena
  out += R_(ridgeX - 0.13, RIDGE - 0.32, 0.26, 0.32, 'a-fill')
  out += R_(tw, EAVES - 0.2, D - tw * 2, 0.2, 'a-soft2 a-s')
  out += line(X(ridgeX), Y(EAVES), X(ridgeX), Y(RIDGE - 0.32), 'a-s')
  // cordolo
  out += R_(0, EAVES - 0.3, tw, 0.3, 'a-acc') + R_(D - tw, EAVES - 0.3, tw, 0.3, 'a-acc')

  // vano scala: foro nel solaio
  out += R_(3.0, FLOOR - 0.26, 2.5, 0.48, 'a-bg') + R_(3.0, FLOOR - 0.24, 2.5, 0.44, 'a-s2 a-dash')

  // scala in sezione
  const steps = 16
  const rise = FLOOR / steps
  const go = 0.27
  let stair = `M${n(X(1.2))} ${n(Y(0))}`
  for (let i = 0; i < steps; i++) stair += `V${n(Y((i + 1) * rise))}H${n(X(1.2 + (i + 1) * go))}`
  out += path(stair, 'a-s')
  out += line(X(1.2), Y(0.9), X(1.2 + steps * go), Y(FLOOR + 0.9), 'a-s2')
  for (let i = 0; i <= steps; i += 3) out += line(X(1.2 + i * go), Y(i * rise), X(1.2 + i * go), Y(i * rise + 0.9), 'a-s2')

  // tramezza oltre il piano di sezione + porta
  out += line(X(5.75), Y(0), X(5.75), Y(FLOOR - 0.24), 'a-s2') + R_(4.55, 0, 0.9, 2.1, 'a-s2')
  out += human(X(2.0), Y(FLOOR + 0.2), s) + human(X(6.35), Y(0), s, 'a-soft2')

  if (!bare) {
    out += text(X(2.35), Y(2.3), 'ZONA GIORNO', { size: 10.5, anchor: 'middle', spacing: '.06em' }) + text(X(2.35), Y(2.3) + 14, 'h 2.66', { c: 'a-tm', size: 9.5, anchor: 'middle' })
    out += text(X(5.1), Y(FLOOR + 1.9), 'CAMERA', { size: 10.5, anchor: 'middle', spacing: '.06em' }) + text(X(5.1), Y(FLOOR + 1.9) + 14, 'h media 3.10', { c: 'a-tm', size: 9.5, anchor: 'middle' })

    const lx = X(D + 2.0)
    for (const [m, l] of [[0, '±0.00'], [FLOOR + 0.2, '+3.10'], [EAVES, '+5.60'], [RIDGE + 0.5, '+7.80']]) {
      out += line(X(D + 0.3), Y(m), lx, Y(m), 'a-s2 a-dash') + level(lx, Y(m), l, { flip: true, len: 58 })
    }
    const dx = X(-1.1)
    out += dim(dx, Y(FLOOR), dx, Y(0), '2.90', { off: -30 }) + dim(dx, Y(EAVES), dx, Y(FLOOR), '2.70', { off: -30 })
    out += dim(X(0), Y(-1.2), X(D), Y(-1.2), D.toFixed(2), { off: 30 })

    out += leader(X(1.6), Y(EAVES + slope * 1.6 + 0.45), X(-0.6), Y(RIDGE + 0.55), 'MANTO IN COPPI', { anchor: 'end' })
    out += leader(X(D - tw / 2), Y(EAVES - 0.15), X(D + 0.5), Y(EAVES - 0.75), 'CORDOLO IN C.A.', {})
    out += leader(X(2.6), Y(-0.3), X(-0.6), Y(-0.95), 'VESPAIO AERATO', { anchor: 'end' })
  }

  return svg({ w, h, tone, defs, label: label || 'Sezione trasversale A—A′, stato di progetto', body: out })
}
