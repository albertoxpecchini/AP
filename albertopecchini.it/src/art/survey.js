// Tavole di rilievo e territorio: nuvola di punti, ortofoto da drone,
// estratto di mappa catastale, planivolumetrico, layout di cantiere.

import { svg, sheet, rect, line, path, text, dim, north, circle, ellipse, poly, polyline, hatch, cross, leader, rng, nextId, n } from './kit.js'

// ── Nuvola di punti ──────────────────────────────────────────────────────────

export function pointcloud({ w = 1200, h = 900, tone = 'ink', code = 'AP-00', tav = 'TAV. 01', seed = 7, label, bare = false } = {}) {
  const R = rng(seed)
  const sh = bare ? { markup: '', box: { x: 60, y: 60, w: w - 120, h: h - 120 } } : sheet(w, h, { code, title: 'NUVOLA DI PUNTI · REGISTRAZIONE GLOBALE', scale: '12,4 M PUNTI', tav })

  // camera assonometrica
  const th = (38 * Math.PI) / 180
  const ph = (30 * Math.PI) / 180
  const k = Math.min(sh.box.w / 39, sh.box.h / 27)
  const cx = sh.box.x + sh.box.w / 2
  const cy = sh.box.y + sh.box.h / 2 + 3.6 * k
  const P = (x, y, z) => {
    const xr = x * Math.cos(th) - y * Math.sin(th)
    const yr = x * Math.sin(th) + y * Math.cos(th)
    return [cx + xr * k, cy + yr * Math.sin(ph) * k - z * Math.cos(ph) * k]
  }

  const bands = { ground: [], low: [], high: [] }
  const push = (x, y, z) => {
    const [px, py] = P(x + R.range(-0.06, 0.06), y + R.range(-0.06, 0.06), z)
    const band = z < 0.25 ? bands.ground : z < 5.2 ? bands.low : bands.high
    band.push(`M${Math.round(px)} ${Math.round(py)}h0`)
  }

  // fabbricati: [x, y, lunghezza, profondità, gronda, colmo]
  const blocks = [
    [-13, -6, 18, 7.5, 5.6, 7.6],
    [5, -6, 7, 6, 3.4, 4.8],
    [-13, 5, 8, 5, 3, 4.2],
  ]
  const inside = (x, y) => blocks.some(([bx, by, bl, bd]) => x > bx && x < bx + bl && y > by && y < by + bd)

  // terreno: densità che decresce con la distanza dalle stazioni
  const stations = [[-4, 7.5], [10, 5], [13.5, -6]]
  for (let i = 0; i < 950; i++) {
    const x = R.range(-19, 17)
    const y = R.range(-13, 13)
    if (inside(x, y)) continue
    const d = Math.min(...stations.map(([sx, sy]) => Math.hypot(x - sx, y - sy)))
    if (R.next() > 1.15 - d / 17) continue
    push(x, y, 0)
  }
  // pareti e coperture
  for (const [bx, by, bl, bd, eaves, ridge] of blocks) {
    const dens = (bl + bd) * 13
    // vuoti delle aperture sul fronte: la facciata resta leggibile
    const isOpening = (u, z) => {
      const m = u % 2.9
      return m > 0.95 && m < 2.0 && ((z > 0.95 && z < 2.4) || (z > 3.7 && z < 5.0 && eaves > 5))
    }
    for (let i = 0; i < dens; i++) {
      const z = R.range(0, eaves)
      const u = R.range(0, bl)
      if (R.chance(0.7)) {
        if (!isOpening(u, z)) push(bx + u, by + bd, z)
      } else push(bx + bl, by + R.range(0, bd), z)
    }
    // timpano
    for (let i = 0; i < bd * 9; i++) {
      const t = R.next()
      const zmax = eaves + (ridge - eaves) * (1 - Math.abs(t - 0.5) * 2)
      push(bx + bl, by + t * bd, R.range(eaves, zmax))
    }
    // falde
    for (let i = 0; i < bl * bd * 2.5; i++) {
      const t = R.next()
      push(bx + R.range(0, bl), by + t * bd, eaves + (ridge - eaves) * (1 - Math.abs(t - 0.5) * 2))
    }
    // spigoli più densi
    for (let i = 0; i < eaves * 7; i++) {
      push(bx + bl, by + bd, R.range(0, eaves))
      push(bx, by + bd, R.range(0, eaves))
    }
    for (let i = 0; i < bl * 5; i++) push(bx + R.range(0, bl), by + bd, eaves)
  }
  // alberature
  for (const [tx, ty, tr] of [[13, -9, 2.6], [14.5, 8, 2.1], [-16.5, 2, 2.8], [10, 10.5, 1.7]]) {
    for (let i = 0; i < 70; i++) {
      const a = R.range(0, Math.PI * 2)
      const b = Math.acos(R.range(-1, 1))
      const rr = tr * R.range(0.78, 1)
      push(tx + Math.cos(a) * Math.sin(b) * rr, ty + Math.sin(a) * Math.sin(b) * rr, 3.4 + Math.cos(b) * rr)
    }
    for (let i = 0; i < 14; i++) push(tx, ty, R.range(0, 2))
  }

  let out = sh.markup
  out += path(bands.ground.join(''), 'a-s2 a-dots') + path(bands.low.join(''), 'a-s a-dots') + path(bands.high.join(''), 'a-sa a-dots')

  // volume di ingombro del corpo principale
  const [bx, by, bl, bd] = blocks[0]
  const top = 8.2
  const c = [[bx - 0.8, by - 0.8], [bx + bl + 0.8, by - 0.8], [bx + bl + 0.8, by + bd + 0.8], [bx - 0.8, by + bd + 0.8]]
  out += poly(c.map(([x, y]) => P(x, y, top)), 'a-s2 a-dash')
  for (const [x, y] of c) out += line(...P(x, y, 0), ...P(x, y, top), 'a-s2 a-dash')
  out += poly(c.map(([x, y]) => P(x, y, 0)), 'a-s2 a-dash')

  // stazioni di scansione e poligonale
  out += polyline(stations.map(([x, y]) => P(x, y, 0)), 'a-sa a-dash')
  stations.forEach(([x, y], i) => {
    const [px, py] = P(x, y, 0)
    out += ellipse(px, py, 1.5 * k, 1.5 * k * Math.sin(ph), 'a-sa') + ellipse(px, py, 3.2 * k, 3.2 * k * Math.sin(ph), 'a-sa a-dash')
    out += line(px, py, px, py - 1.7 * k, 'a-sa') + circle(px, py - 1.7 * k, 4, 'a-acc')
    if (!bare) out += text(px + 10, py - 1.7 * k - 6, `S${i + 1}`, { c: 'a-ta', size: 12, weight: 500 })
  })

  if (!bare) {
    const [ax, ay] = P(bx + bl + 0.8, by + bd + 0.8, top)
    out += leader(ax, ay, ax + 46, ay - 34, '18.0 × 7.5 × 7.6 m')
    const lx = sh.box.x - 8
    const ly = sh.box.y + 6
    ;['STAZIONI · 03', 'TARGET · 09', 'ERR. MEDIO · 4 mm', 'PASSO · 6 mm @ 10 m'].forEach((t, i) => {
      out += text(lx, ly + i * 17, t, { c: i === 2 ? 'a-ta' : 'a-tm', size: 11, spacing: '.05em' })
    })
    // legenda quote
    const gx = sh.box.x + sh.box.w - 150
    const gy = sh.box.y + 2
    ;[['a-acc', '> 5.20 m'], ['a-fill', '0.25 — 5.20 m'], ['a-soft2', 'TERRENO']].forEach(([cl, t], i) => {
      out += rect(gx, gy + i * 17 - 8, 9, 9, cl) + text(gx + 17, gy + i * 17, t, { c: 'a-tm', size: 10.5 })
    })
  }

  return svg({ w, h, tone, label: label || 'Nuvola di punti registrata da tre stazioni di scansione laser', body: out })
}

// ── Ortofoto da drone ────────────────────────────────────────────────────────

export function ortho({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 03', seed = 3, label, bare = false } = {}) {
  const R = rng(seed)
  const sh = bare ? { markup: '', box: { x: 0, y: 0, w, h } } : sheet(w, h, { code, title: 'ORTOFOTO · GSD 1,2 cm/px', scale: 'SCALA 1:500', tav })
  const m = bare ? 0 : 26
  const strip = bare ? 0 : 34
  const area = { x: m, y: m, w: w - m * 2, h: h - m * 2 - strip }

  const clip = nextId('c')
  const pats = [hatch({ angle: 0, gap: 6 }), hatch({ angle: 90, gap: 9 }), hatch({ angle: 0, gap: 12 }), hatch({ angle: 90, gap: 5 }), hatch({ angle: 45, gap: 7 })]
  let defs = `<clipPath id="${clip}"><rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}"/></clipPath>` + pats.map((p) => p.def).join('')

  // campi: suddivisione ricorsiva in un sistema ruotato
  const fields = []
  const split = (x, y, ww, hh, depth) => {
    if (depth === 0 || (depth < 3 && R.chance(0.22))) return fields.push([x, y, ww, hh])
    const t = R.range(0.36, 0.64)
    if (ww > hh * 0.9) {
      split(x, y, ww * t, hh, depth - 1)
      split(x + ww * t, y, ww * (1 - t), hh, depth - 1)
    } else {
      split(x, y, ww, hh * t, depth - 1)
      split(x, y + hh * t, ww, hh * (1 - t), depth - 1)
    }
  }
  split(-w * 0.25, -h * 0.3, w * 1.5, h * 1.6, 4)

  let land = ''
  for (const [x, y, ww, hh] of fields) {
    const p = R.pick(pats)
    const tone_ = R.pick(['a-soft', 'a-soft2', 'a-bg', 'a-bg'])
    land += rect(x, y, ww, hh, tone_) + rect(x, y, ww, hh, 'a-s2', R.chance(0.72) ? ` ${p.fill}` : '')
  }

  // strada bianca e fosso
  const road = `M${n(-w * 0.2)} ${n(h * 0.66)}C${n(w * 0.25)} ${n(h * 0.6)} ${n(w * 0.5)} ${n(h * 0.78)} ${n(w * 1.2)} ${n(h * 0.7)}`
  land += path(road, 'a-bg', ' style="fill:none;stroke:var(--art-bg);stroke-width:26"') + path(road, 'a-s2', ' style="stroke-width:28;opacity:.35;fill:none"') + path(road, 'a-bg', ' style="fill:none;stroke:var(--art-bg);stroke-width:24"')
  const ditch = `M${n(w * 0.08)} ${n(-h * 0.2)}C${n(w * 0.16)} ${n(h * 0.3)} ${n(w * 0.05)} ${n(h * 0.6)} ${n(w * 0.12)} ${n(h * 1.2)}`
  land += path(ditch, 'a-s', ' style="stroke-width:5"') + path(ditch, 'a-si', ' style="stroke-width:2"')

  // corte: aia + fabbricati con falde
  const cxp = w * 0.53
  const cyp = h * 0.4
  land += rect(cxp - 190, cyp - 130, 380, 270, 'a-bg a-s2')
  const roofs = [
    [cxp - 170, cyp - 112, 250, 86, 'h'],
    [cxp + 96, cyp - 112, 76, 190, 'v'],
    [cxp - 170, cyp + 56, 120, 66, 'h'],
  ]
  const slopeA = hatch({ angle: 90, gap: 4 })
  const slopeB = hatch({ angle: 0, gap: 4 })
  defs += slopeA.def + slopeB.def
  for (const [x, y, ww, hh, dir] of roofs) {
    if (dir === 'h') {
      land += rect(x, y, ww, hh / 2, 'a-bg a-s', ` ${slopeA.fill}`) + rect(x, y + hh / 2, ww, hh / 2, 'a-soft2 a-s') + rect(x, y + hh / 2, ww, hh / 2, 'a-none', ` ${slopeA.fill}`)
      land += line(x, y + hh / 2, x + ww, y + hh / 2, 'a-sb')
    } else {
      land += rect(x, y, ww / 2, hh, 'a-bg a-s', ` ${slopeB.fill}`) + rect(x + ww / 2, y, ww / 2, hh, 'a-soft2 a-s') + rect(x + ww / 2, y, ww / 2, hh, 'a-none', ` ${slopeB.fill}`)
      land += line(x + ww / 2, y, x + ww / 2, y + hh, 'a-sb')
    }
  }
  // alberi: filare lungo la strada e macchie
  for (let i = 0; i < 17; i++) {
    const t = i / 16
    const x = -w * 0.1 + t * w * 1.2
    const y = h * (0.575 + 0.085 * Math.sin(t * 3.1 + 0.4)) + R.range(-4, 4)
    land += circle(x, y, R.range(9, 14), 'a-soft2 a-s2') + circle(x + 3, y + 3, 2, 'a-fill')
  }
  for (let i = 0; i < 9; i++) land += circle(cxp + 215 + R.range(0, 70), cyp - 100 + R.range(0, 210), R.range(10, 18), 'a-soft2 a-s2')

  let out = `<g clip-path="url(#${clip})"><g transform="rotate(-11 ${w / 2} ${h / 2})">${land}</g>`

  // piano di volo
  let flight = ''
  const rows = 7
  for (let i = 0; i < rows; i++) {
    const y = area.y + 50 + ((area.h - 100) / (rows - 1)) * i
    flight += (i ? 'L' : 'M') + (i % 2 ? `${n(area.x + area.w - 60)} ${n(y)}L${n(area.x + 60)} ${n(y)}` : `${n(area.x + 60)} ${n(y)}L${n(area.x + area.w - 60)} ${n(y)}`)
  }
  out += path(flight, 'a-sa a-dash', ' style="opacity:.75"') + '</g>'

  // GCP
  const gcps = [[0.2, 0.22], [0.78, 0.17], [0.86, 0.72], [0.3, 0.8], [0.52, 0.52]]
  gcps.forEach(([gx, gy], i) => {
    const x = area.x + area.w * gx
    const y = area.y + area.h * gy
    out += circle(x, y, 11, 'a-bg a-sa') + path(`M${n(x)} ${n(y)}V${n(y - 11)}A11 11 0 0 1 ${n(x + 11)} ${n(y)}ZM${n(x)} ${n(y)}V${n(y + 11)}A11 11 0 0 1 ${n(x - 11)} ${n(y)}Z`, 'a-acc')
    if (!bare) out += rect(x + 15, y - 19, 58, 16, 'a-bg') + text(x + 19, y - 7, `GCP ${String(i + 1).padStart(2, '0')}`, { c: 'a-ta', size: 11, weight: 500 })
  })

  // reticolo chilometrico
  if (!bare) {
    for (let i = 1; i < 5; i++) for (let j = 1; j < 4; j++) out += cross(area.x + (area.w / 5) * i, area.y + (area.h / 4) * j, 8, 'a-s')
    for (let i = 1; i < 5; i++) out += text(area.x + (area.w / 5) * i + 5, area.y + 14, `E ${634100 + i * 50}`, { c: 'a-t', size: 9.5 })
    for (let j = 1; j < 4; j++) out += text(area.x + 6, area.y + (area.h / 4) * j - 6, `N ${5003400 - j * 50}`, { c: 'a-t', size: 9.5 })
    out += rect(area.x + area.w - 86, area.y + area.h - 84, 70, 70, 'a-bg') + north(area.x + area.w - 51, area.y + area.h - 44, 20)
  }
  out += sh.markup

  return svg({ w, h, tone, defs, label: label || 'Ortofoto da drone di una corte rurale con punti di controllo a terra', body: out })
}

// ── Estratto di mappa catastale ──────────────────────────────────────────────

export function cadastral({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 01', seed = 5, label, bare = false } = {}) {
  const R = rng(seed)
  const sh = bare ? { markup: '' } : sheet(w, h, { code, title: 'ESTRATTO DI MAPPA · FRAZIONAMENTO', scale: 'SCALA 1:2000', tav })
  const m = bare ? 0 : 26
  const strip = bare ? 0 : 34
  const area = { x: m, y: m, w: w - m * 2, h: h - m * 2 - strip }
  const clip = nextId('c')
  const build = hatch({ angle: 45, gap: 5, c: 'a-s' })
  const subject = hatch({ angle: -45, gap: 8, c: 'a-sa' })
  const defs = `<clipPath id="${clip}"><rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}"/></clipPath>` + build.def + subject.def

  const parcels = []
  const split = (x, y, ww, hh, depth) => {
    if (depth === 0 || (depth < 3 && R.chance(0.18))) return parcels.push([x, y, ww, hh])
    const t = R.range(0.34, 0.66)
    if (ww > hh) {
      split(x, y, ww * t, hh, depth - 1)
      split(x + ww * t, y, ww * (1 - t), hh, depth - 1)
    } else {
      split(x, y, ww, hh * t, depth - 1)
      split(x, y + hh * t, ww, hh * (1 - t), depth - 1)
    }
  }
  // due isolati separati da una strada
  split(-120, -200, w * 0.56 + 120, h + 400, 4)
  split(w * 0.56 + 46, -200, w * 0.6, h + 400, 4)

  // particella oggetto: la più vicina al centro tra quelle abbastanza grandi
  const centre = [w * 0.36, h * 0.46]
  const target = parcels
    .filter(([, , ww, hh]) => ww > 150 && hh > 120)
    .sort((a, b) => Math.hypot(a[0] + a[2] / 2 - centre[0], a[1] + a[3] / 2 - centre[1]) - Math.hypot(b[0] + b[2] / 2 - centre[0], b[1] + b[3] / 2 - centre[1]))[0]

  let map = ''
  let num = 171
  for (const p of parcels) {
    const [x, y, ww, hh] = p
    const isTarget = p === target
    map += rect(x, y, ww, hh, isTarget ? 'a-sa' : 'a-s', isTarget ? ` style="fill:url(#${subject.id});stroke-width:2.4"` : '')
    num += R.int(1, 4)
    if (ww > 60 && hh > 40 && !isTarget) map += text(x + ww / 2, y + hh / 2 + 4, String(num), { size: 12, anchor: 'middle' })
    // fabbricati
    if (!isTarget && ww > 90 && hh > 80 && R.chance(0.5)) {
      const bw = R.range(34, Math.min(90, ww * 0.5))
      const bh = R.range(28, Math.min(70, hh * 0.45))
      map += rect(x + R.range(8, ww - bw - 8), y + R.range(8, hh - bh - 8), bw, bh, 'a-s', ` ${build.fill}`)
    }
  }
  // frazionamento della particella oggetto
  if (target) {
    const [x, y, ww, hh] = target
    const cut = y + hh * 0.56
    map += rect(x + 18, y + 16, ww * 0.42, hh * 0.3, 'a-s', ` ${build.fill}`)
    map += line(x, cut, x + ww, cut, 'a-sa a-dash')
    map += rect(x + ww / 2 - 30, y + hh * 0.3 - 11, 60, 20, 'a-bg') + text(x + ww / 2, y + hh * 0.3 + 4, '187/a', { c: 'a-ta', size: 13, anchor: 'middle', weight: 500 })
    map += rect(x + ww / 2 - 30, y + hh * 0.8 - 11, 60, 20, 'a-bg') + text(x + ww / 2, y + hh * 0.8 + 4, '187/b', { c: 'a-ta', size: 13, anchor: 'middle', weight: 500 })
    map += dim(x, cut, x + ww, cut, (ww / 9.4).toFixed(2), { off: 0, tc: 'a-ta', c: 'a-sa', ext: false })
    for (const [px, py] of [[x, cut], [x + ww, cut]]) map += circle(px, py, 4, 'a-bg a-sa')
  }
  // strada
  const rx = w * 0.56
  map += rect(rx, -200, 46, h + 400, 'a-bg')
  map += line(rx, -200, rx, h + 400, 'a-s') + line(rx + 46, -200, rx + 46, h + 400, 'a-s')
  map += text(rx + 28, h * 0.72, 'STRADA COMUNALE DELLA CORTE', { c: 'a-tm', size: 11, rotate: -90, spacing: '.12em' })

  let out = `<g clip-path="url(#${clip})"><g transform="rotate(-8 ${w / 2} ${h / 2}) skewX(-4)">${map}</g></g>`

  // punti fiduciali
  if (!bare) {
    const pf = [[0.14, 0.2, 'PF03/0240/E897'], [0.82, 0.3, 'PF07/0240/E897'], [0.6, 0.84, 'PF11/0240/E897']]
    for (const [fx, fy, name] of pf) {
      const x = area.x + area.w * fx
      const y = area.y + area.h * fy
      out += poly([[x, y - 11], [x + 10, y + 7], [x - 10, y + 7]], 'a-bg a-s') + circle(x, y + 1, 2, 'a-fill')
      out += rect(x + 14, y - 10, 112, 17, 'a-bg') + text(x + 18, y + 3, name, { size: 10 })
    }
    out += polyline(pf.map(([fx, fy]) => [area.x + area.w * fx, area.y + area.h * fy]), 'a-s2 a-dash')
    out += rect(area.x + 16, area.y + area.h - 62, 172, 46, 'a-bg a-s2')
    out += text(area.x + 28, area.y + area.h - 42, 'COMUNE DI MANTOVA · E897', { size: 10 }) + text(area.x + 28, area.y + area.h - 26, 'FOGLIO 24 · MAPP. 187', { c: 'a-ta', size: 10, weight: 500 })
    out += rect(area.x + area.w - 78, area.y + 12, 62, 72, 'a-bg') + north(area.x + area.w - 47, area.y + 56, 19)
  }
  out += sh.markup
  return svg({ w, h, tone, defs, label: label || 'Estratto di mappa catastale con linea di frazionamento', body: out })
}

// ── Planivolumetrico / piano attuativo ───────────────────────────────────────

export function urban({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 02', seed = 9, label, bare = false } = {}) {
  const R = rng(seed)
  const sh = bare ? { markup: '' } : sheet(w, h, { code, title: 'PLANIVOLUMETRICO · AMBITO DI TRASFORMAZIONE', scale: 'SCALA 1:500', tav })
  const m = bare ? 0 : 26
  const strip = bare ? 0 : 34
  const area = { x: m, y: m, w: w - m * 2, h: h - m * 2 - strip }
  const clip = nextId('c')
  const green = hatch({ angle: 45, gap: 6 })
  const shadow = hatch({ angle: -45, gap: 3.5, c: 'a-s' })
  const defs = `<clipPath id="${clip}"><rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.h}"/></clipPath>` + green.def + shadow.def

  let map = ''
  // viabilità: strada di lottizzazione ad anello
  const ringX = 250
  const ringY = 190
  const ringW = 640
  const ringH = 470
  const roadW = 38
  map += rect(ringX, ringY, ringW, ringH, 'a-bg a-s', ' rx="70"') + rect(ringX + roadW, ringY + roadW, ringW - roadW * 2, ringH - roadW * 2, 'a-bg a-s', ' rx="36"')
  map += rect(ringX + roadW / 2, ringY + roadW / 2, ringW - roadW, ringH - roadW, 'a-s2 a-dashdot', ' rx="54"')
  // strada esistente
  map += rect(-100, 742, w + 200, 48, 'a-bg a-s') + line(-100, 766, w + 100, 766, 'a-s2 a-dashdot')
  map += rect(ringX + 270, ringY + ringH - 4, 56, 86, 'a-bg') + line(ringX + 270, ringY + ringH, ringX + 270, 742, 'a-s') + line(ringX + 326, ringY + ringH, ringX + 326, 742, 'a-s')

  // verde pubblico centrale
  const gx = ringX + roadW + 24
  const gy = ringY + roadW + 24
  const gw = ringW - roadW * 2 - 48
  const gh = ringH - roadW * 2 - 48
  map += rect(gx, gy, gw * 0.46, gh, 'a-s', ` ${green.fill}`)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) map += circle(gx + 34 + i * 60, gy + 36 + j * ((gh - 72) / 4), 15, 'a-bg a-s2')
  map += rect(gx + gw * 0.3 - 24, gy + gh / 2 - 12, 48, 22, 'a-bg') + text(gx + gw * 0.3, gy + gh / 2 + 4, 'VP', { size: 13, anchor: 'middle', weight: 500 })
  // parcheggio
  const px = gx + gw * 0.52
  map += rect(px, gy, gw * 0.48, 92, 'a-s')
  for (let i = 1; i < 12; i++) map += line(px + ((gw * 0.48) / 12) * i, gy, px + ((gw * 0.48) / 12) * i, gy + 38, 'a-s2') + line(px + ((gw * 0.48) / 12) * i, gy + 54, px + ((gw * 0.48) / 12) * i, gy + 92, 'a-s2')
  map += text(px + gw * 0.24, gy + 51, 'P · 24 STALLI', { c: 'a-tm', size: 10, anchor: 'middle' })
  // edificio a corte nel cuore del lotto
  map += building(px + 10, gy + 128, gw * 0.48 - 20, gh - 140, 'L')

  // lotti esterni all'anello
  let lot = 1
  const lots = []
  for (let i = 0; i < 4; i++) lots.push([ringX + 12 + i * ((ringW - 24) / 4), 40, (ringW - 24) / 4 - 10, 136])
  for (let i = 0; i < 3; i++) lots.push([68, ringY + 8 + i * ((ringH - 16) / 3), 168, (ringH - 16) / 3 - 10])
  for (let i = 0; i < 3; i++) lots.push([ringX + ringW + 14, ringY + 8 + i * ((ringH - 16) / 3), 180, (ringH - 16) / 3 - 10])
  for (const [x, y, ww, hh] of lots) {
    map += rect(x, y, ww, hh, 'a-s2 a-dash')
    const bw = ww * R.range(0.42, 0.56)
    const bh = hh * R.range(0.42, 0.56)
    const bx2 = x + (ww - bw) * R.range(0.35, 0.65)
    const by2 = y + (hh - bh) * R.range(0.35, 0.65)
    map += building(bx2, by2, bw, bh)
    map += text(x + 8, y + 15, `L${String(lot++).padStart(2, '0')}`, { c: 'a-tm', size: 10 })
    for (let k = 0; k < 2; k++) map += circle(x + ww - 14 - k * 22, y + hh - 14, 8, 'a-s2')
  }

  let out = `<g clip-path="url(#${clip})"><g transform="rotate(-6 ${w / 2} ${h / 2})">${map}</g></g>`

  if (!bare) {
    // tabella dei dati urbanistici
    const tx = area.x + 18
    const ty = area.y + area.h - 118
    out += rect(tx, ty, 232, 102, 'a-bg a-s2')
    ;[['ST', '18 420 m²'], ['SLP', '5 526 m²'], ['It', '0,30 m²/m²'], ['H max', '7,50 m'], ['Verde + P', '4 105 m²']].forEach(([a, b], i) => {
      out += text(tx + 12, ty + 20 + i * 17, a, { c: 'a-tm', size: 10.5 }) + text(tx + 220, ty + 20 + i * 17, b, { size: 10.5, anchor: 'end' })
    })
    out += rect(area.x + area.w - 78, area.y + 12, 62, 72, 'a-bg') + north(area.x + area.w - 47, area.y + 56, 19)
  }
  out += sh.markup
  return svg({ w, h, tone, defs, label: label || 'Planivolumetrico di un ambito residenziale con verde e parcheggi', body: out })

  function building(x, y, ww, hh, kind) {
    const off = 9
    let o = ''
    if (kind === 'L') {
      const d = `M${n(x)} ${n(y)}H${n(x + ww)}V${n(y + hh)}H${n(x + ww * 0.62)}V${n(y + hh * 0.42)}H${n(x)}Z`
      o += path(d, 'a-none', ` transform="translate(${off} ${off})" ${shadow.fill}`) + path(d, 'a-soft2 a-s')
    } else {
      o += rect(x + off, y + off, ww, hh, 'a-none', ` ${shadow.fill}`) + rect(x, y, ww, hh, 'a-soft2 a-s')
      o += ww > hh ? line(x, y + hh / 2, x + ww, y + hh / 2, 'a-s2') : line(x + ww / 2, y, x + ww / 2, y + hh, 'a-s2')
    }
    return o
  }
}

// ── Layout di cantiere + cronoprogramma ──────────────────────────────────────

export function sitelayout({ w = 1200, h = 900, tone = 'paper', code = 'AP-00', tav = 'TAV. 06', label, bare = false } = {}) {
  const sh = bare ? { markup: '', box: { x: 50, y: 50, w: w - 100, h: h - 100 } } : sheet(w, h, { code, title: 'LAYOUT DI CANTIERE · CRONOPROGRAMMA', scale: 'SCALA 1:200', tav })
  const b = sh.box
  const stock = hatch({ angle: 45, gap: 7 })
  let defs = stock.def
  let out = sh.markup

  const planH = b.h * 0.62
  // recinzione e accesso
  const fx = b.x + 10
  const fy = b.y + 4
  const fw = b.w - 20
  const fh = planH
  out += path(`M${n(fx + fw * 0.3)} ${n(fy + fh)}H${n(fx)}V${n(fy)}H${n(fx + fw)}V${n(fy + fh)}H${n(fx + fw * 0.3 + 74)}`, 'a-sb a-dash')
  out += line(fx + fw * 0.3, fy + fh, fx + fw * 0.3 + 60, fy + fh - 34, 'a-s')
  out += text(fx + fw * 0.3 + 37, fy + fh + 18, 'ACCESSO CARRAIO', { c: 'a-tm', size: 10, anchor: 'middle' })

  // fabbricato e ponteggio
  const bx = fx + fw * 0.4
  const by = fy + fh * 0.2
  const bw = fw * 0.34
  const bh = fh * 0.52
  out += rect(bx - 16, by - 16, bw + 32, bh + 32, 'a-s2') + rect(bx - 7, by - 7, bw + 14, bh + 14, 'a-s2')
  for (let x = bx - 16; x <= bx + bw + 16; x += (bw + 32) / 12) out += line(x, by - 16, x, by - 7, 'a-s2') + line(x, by + bh + 7, x, by + bh + 16, 'a-s2')
  for (let y = by - 16; y <= by + bh + 16; y += (bh + 32) / 8) out += line(bx - 16, y, bx - 7, y, 'a-s2') + line(bx + bw + 7, y, bx + bw + 16, y, 'a-s2')
  out += rect(bx, by, bw, bh, 'a-soft2 a-sb')
  out += text(bx + bw / 2, by + bh / 2, 'FABBRICATO', { size: 11, anchor: 'middle', spacing: '.08em' }) + text(bx + bw / 2, by + bh / 2 + 15, 'PONTEGGIO SU 4 LATI', { c: 'a-tm', size: 9.5, anchor: 'middle' })

  // gru con raggio d'azione
  const gx = bx - 66
  const gy = by + bh + 40
  const gr = Math.hypot(bx + bw - gx, by - gy) + 8
  const clip = nextId('c')
  defs += `<clipPath id="${clip}"><rect x="${n(b.x - 20)}" y="${n(b.y - 20)}" width="${n(b.w + 40)}" height="${n(planH + 50)}"/></clipPath>`
  out += `<g clip-path="url(#${clip})">${circle(gx, gy, gr, 'a-sa a-dashdot')}</g>`
  out += rect(gx - 12, gy - 12, 24, 24, 'a-bg a-sa') + line(gx - 12, gy - 12, gx + 12, gy + 12, 'a-sa') + line(gx + 12, gy - 12, gx - 12, gy + 12, 'a-sa')
  out += line(gx, gy, gx + gr * 0.8, gy - gr * 0.6, 'a-sa') + circle(gx + gr * 0.8, gy - gr * 0.6, 4, 'a-acc')
  out += text(gx - 18, gy + 30, 'GRU · R 32 m', { c: 'a-ta', size: 10.5, anchor: 'end', weight: 500 })

  // baracche, depositi, betoniera
  const zones = [
    [fx + 22, fy + 22, 128, 46, 'UFFICIO · SPOGLIATOIO', false],
    [fx + 22, fy + 78, 60, 46, 'WC', false],
    [fx + 22, fy + fh * 0.5, 150, 96, 'DEPOSITO MATERIALI', true],
    [fx + fw - 176, fy + 24, 150, 84, 'STOCCAGGIO FERRI', true],
    [fx + fw - 150, fy + fh - 110, 124, 84, 'RIFIUTI · CER', true],
  ]
  for (const [x, y, ww, hh, name, hatched] of zones) {
    out += rect(x, y, ww, hh, 'a-bg a-s', hatched ? ` ${stock.fill}` : '')
    out += rect(x + 6, y + hh / 2 - 9, Math.min(ww - 12, name.length * 6.4 + 10), 17, 'a-bg') + text(x + 11, y + hh / 2 + 4, name, { size: 9.5 })
  }
  out += circle(bx + bw + 70, by + bh + 46, 22, 'a-s') + circle(bx + bw + 70, by + bh + 46, 9, 'a-s2') + text(bx + bw + 100, by + bh + 50, 'BETONIERA', { c: 'a-tm', size: 9.5 })
  // percorso dei mezzi
  out += path(`M${n(fx + fw * 0.3 + 34)} ${n(fy + fh - 10)}C${n(fx + fw * 0.3 + 30)} ${n(fy + fh * 0.72)} ${n(bx - 70)} ${n(by + bh * 0.4)} ${n(bx - 40)} ${n(by - 34)}`, 'a-s2 a-dash')

  // cronoprogramma
  const gy0 = b.y + planH + 58
  const gh = b.h - planH - 58
  const labW = 150
  const weeks = 20
  const colW = (b.w - labW) / weeks
  out += line(b.x, gy0, b.x + b.w, gy0, 'a-s')
  for (let i = 0; i <= weeks; i++) {
    out += line(b.x + labW + i * colW, gy0 - (i % 4 ? 4 : 9), b.x + labW + i * colW, gy0 + gh, i % 4 ? 'a-s2' : 'a-s2')
    if (i % 4 === 0 && i < weeks) out += text(b.x + labW + i * colW + 4, gy0 - 8, `SETT. ${String(i + 1).padStart(2, '0')}`, { c: 'a-tm', size: 9 })
  }
  const tasks = [
    ['ALLESTIMENTO', 0, 2],
    ['DEMOLIZIONI', 1.5, 3.5],
    ['STRUTTURE', 4, 7, true],
    ['COPERTURA', 9, 4],
    ['IMPIANTI', 11, 6],
    ['FINITURE', 14.5, 5.5],
  ]
  const rowH = gh / tasks.length
  tasks.forEach(([name, start, len, critical], i) => {
    const y = gy0 + i * rowH
    out += text(b.x, y + rowH / 2 + 4, name, { size: 10, spacing: '.05em' })
    out += rect(b.x + labW + start * colW, y + rowH * 0.24, len * colW, rowH * 0.52, critical ? 'a-acc' : 'a-fill')
    if (i) out += line(b.x, y, b.x + b.w, y, 'a-s2')
  })

  return svg({ w, h, tone, defs, label: label || 'Layout di cantiere con gru, ponteggi e cronoprogramma dei lavori', body: out })
}
