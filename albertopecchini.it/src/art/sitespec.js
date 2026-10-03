// Tavole del sito stesso: il primo schermo della home ridisegnato in vettoriale
// e quotato, a tre larghezze. Come identity.js, non sono segnaposto: i numeri
// vengono da un rilievo della pagina vera nel browser (riquadri, corpi e linee
// di base degli elementi) e dai token di styles/tokens.css.
//
// Rilievo del 2.10.2026, larghezza d'impaginazione uguale alla finestra. Se
// l'hero o la testata cambiano, i numeri di HOME vanno rimisurati. Le immagini
// (chiocciola, ritratto, figurine) sono riquadri tratteggiati con la croce.
// I testi sono già minuscoli, come il sito.

import { n, nextId } from './kit.js'
import { C, SANS, SERIF, MONO, T, Rc, Ln, Ci, it, quota, shadow, out, lockup } from './identity.js'

const GREEN = '#2f9e5b'
const LEAD = {
  wide: ['diplomato geometra a rivalta sul mincio: rilevo e disegno edifici, scrivo siti web a', 'mano, costruisco marchi. con lo stesso metodo e la stessa cura.'],
  narrow: ['diplomato geometra a rivalta sul mincio: rilevo', 'e disegno edifici, scrivo siti web a mano,', 'costruisco marchi. con lo stesso metodo e la', 'stessa cura.'],
}

const HOME = {
  date: '2.10.2026',
  desktop: {
    key: 'desktop', W: 1440, H: 900, g: 49.6, hh: 84,
    pills: [[278.4, 89.3, 'portfolio'], [401.3, 77.7, 'servizi'], [485.3, 76, 'studio'], [878.6, 85.1, 'metodo'], [970.1, 84.1, 'contatti'], [1066.2, 191.7, 'parliamo del progetto', true]],
    pillY: 19.6, snail: [590.2, 9.9, 70.4, 64.3], logo: [669.4, 22],
    avatar: [49.6, 104], hi: [106.4, 140.2, 43.7], place: [527.2, 130.9], avail: { dot: [1118.5, 121.9], lines: [[1136.1, 130.2, 'disponibile per nuovi incarichi']] },
    fs: 236.7, words: [[49.6, 343.3, 590.7], [668, 343.3, 720.6]], title: [160.8, 404.5], rule: 420.5, body: 429.5,
    kicker: { fs: 15, slashes: [49.6, 471.5], pill: [76.8, 452.9, 203.8, 26.7], rest: [290.1, 471.5] },
    myth: { fs: 72, lines: [[549.4, 354], [617.1, 440.1]], stamp: [421, 483.3, 104.4, 59, 24.5] },
    claim: { base: 691.3, em: 304.4, emFs: 77 },
    lead: { ys: [720.4, 747.6], text: LEAD.wide },
    btn: [49.6, 790.8, 289.8], copy: [349, 790.8, 336.8],
    trust: [[49.6, 866.8, 'primo colloquio gratuito'], [277.3, 866.8, 'preventivo scritto'], [49.6, 892.8, 'rispondo entro un giorno lavorativo']],
    cols: [[49.6, 687.1], [801.5, 588.9]],
    term: [801.5, 452.9, 589], sticker: [1165.5, 685.3, 238.3],
  },
  tablet: {
    key: 'tablet', W: 768, H: 1024, g: 29.4, hh: 84,
    round: [[29.4, 17.6, 'menu'], [694.6, 17.6, 'mail']], snail: [262.1, 17.2, 54.4, 49.6], logo: [325.3, 22],
    avatar: [29.4, 100], hi: [86.2, 132.9, 32.3], avail: { dot: [466.7, 117.9], lines: [[484.3, 126.2, 'disponibile per nuovi incarichi']] },
    fs: 125.2, words: [[29.4, 253.8, 312.4], [356.5, 253.8, 381.1]], title: [156.8, 285.7], rule: 301.7, body: 310.7,
    kicker: { fs: 15, slashes: [29.4, 353.3], pill: [56.6, 334.7, 203.8, 26.7], rest: [270, 353.3] },
    myth: { fs: 72, lines: [[431.2, 354], [498.8, 440.1]], stamp: [400.8, 365.1, 104.4, 59, 24.5] },
    claim: { base: 573.1, em: 284.3, emFs: 77 },
    lead: { ys: [602.2, 629.4], text: LEAD.wide },
    btn: [29.4, 672.5, 289.8], copy: [328.8, 672.5, 336.8],
    trust: [[29.4, 748.5, 'primo colloquio gratuito'], [257.1, 748.5, 'preventivo scritto'], [435.6, 748.5, 'rispondo entro un giorno lavorativo']],
    term: [29.4, 808.1, 709],
  },
  phone: {
    key: 'telefono', W: 390, H: 844, g: 18.1, hh: 72,
    round: [[18.1, 11.6, 'menu'], [327.9, 11.6, 'mail']], snail: [74.1, 11.2, 54.4, 49.6], logo: [137.3, 16],
    avatar: [18.1, 88], hi: [74.9, 119, 28], avail: { dot: [231.3, 96.1], lines: [[248.8, 104.4, 'disponibile per'], [248.8, 124, 'nuovi incarichi']] },
    fs: 116, words: [[18.1, 235.4, 289.6], [18.1, 337.5, 353.3]], title: [144.8, 368.8], rule: 384.8, body: 393.8,
    kicker: { fs: 14, slashes: [18.1, 435.3], pill: [44.1, 417.8, 191.5, 25.4], rest: [18.1, 463.5] },
    myth: { fs: 40.3, lines: [[512.5, 198.3], [550.4, 246.5]], stamp: [225.3, 472.6, 90.5, 51.5, 21] },
    claim: { base: 592.3, em: 160.8, emFs: 43.2 },
    lead: { ys: [616.6, 643.8, 671, 698.2], text: LEAD.narrow },
    btn: [18.1, 741.4, 353.8], copy: [18.1, 811, 353.8],
  },
}

// ── Pezzi della pagina (coordinate in px CSS della pagina vera) ──────────────

/** Riquadro di un'immagine: tratteggio e croce, come nei wireframe. */
const picture = (x, y, w, h, { round = false, c = C.ink, sw = 1 } = {}) =>
  (round
    ? `<ellipse cx="${n(x + w / 2)}" cy="${n(y + h / 2)}" rx="${n(w / 2)}" ry="${n(h / 2)}" fill="${C.paper3}" fill-opacity=".55" stroke="${c}" stroke-width="${sw}" stroke-dasharray="${n(sw * 4)} ${n(sw * 3)}"/>`
    : `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${C.paper3}" fill-opacity=".55" stroke="${c}" stroke-width="${sw}" stroke-dasharray="${n(sw * 4)} ${n(sw * 3)}"/>`) +
  `<path d="M${n(x + w * (round ? 0.15 : 0))} ${n(y + h * (round ? 0.15 : 0))}L${n(x + w * (round ? 0.85 : 1))} ${n(y + h * (round ? 0.85 : 1))}M${n(x + w * (round ? 0.85 : 1))} ${n(y + h * (round ? 0.15 : 0))}L${n(x + w * (round ? 0.15 : 0))} ${n(y + h * (round ? 0.85 : 1))}" stroke="${c}" stroke-width="${sw * 0.7}" opacity=".45" fill="none"/>`

const arrow = (x, y, s, c, sw = 1.6) => `<path d="M${n(x)} ${n(y)}h${n(s)}m${n(-s * 0.4)} ${n(-s * 0.4)}l${n(s * 0.4)} ${n(s * 0.4)}l${n(-s * 0.4)} ${n(s * 0.4)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`
const tick = (x, y, s, c, sw = 2) => `<path d="M${n(x)} ${n(y)}l${n(s * 0.35)} ${n(s * 0.35)}l${n(s * 0.65)} ${n(-s * 0.8)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`

/** Tasto «sasso» della testata: sagoma arrotondata con lo spessore sotto. */
function pebble(x, y, w, label, minio) {
  const h = 40
  const face = minio ? C.minio : C.paper
  const side = minio ? '#7c2308' : '#6b665d'
  return (
    `<rect x="${n(x)}" y="${n(y + 4.8)}" width="${n(w)}" height="${h}" rx="20" fill="${side}"/>` +
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${h}" rx="20" fill="${face}" stroke="${C.ink}" stroke-width="1.6"/>` +
    (label ? T(x + 18.4, y + 25, label, { fill: C.ink, size: 14, family: SANS, weight: 580, spacing: '-0.01em' }) : '') +
    (minio ? arrow(x + w - 37, y + 20, 13, C.ink, 1.6) : '')
  )
}

function roundButton(x, y, kind) {
  const cx = x + 22
  const cy = y + 22
  const glyph =
    kind === 'menu'
      ? `<path d="M${n(cx - 8)} ${n(cy - 5)}h16M${n(cx - 8)} ${cy}h16M${n(cx - 8)} ${n(cy + 5)}h16" stroke="${C.ink}" stroke-width="1.6" fill="none"/>`
      : `<path d="M${n(cx - 8.5)} ${n(cy - 6)}h17v12h-17ZM${n(cx - 8.5)} ${n(cy - 5)}l8.5 6.5l8.5 -6.5" stroke="${C.ink}" stroke-width="1.6" fill="none"/>`
  return Ci(cx, cy + 4.8, 22, ` fill="#6b665d"`) + Ci(cx, cy, 22, ` fill="${C.paper}" stroke="${C.ink}" stroke-width="1.6"`) + glyph
}

/** Il terminale dell'hero, disegnato alla sua misura di base (589 px) e poi scalato. */
function terminal(x, y, w) {
  const k = w / 589
  const W = 589
  const H = 306
  const soft = '#e9e6df'
  const tabs = [['--tutto', 86.1], ['--casa', 77.4], ['--sito', 77.4], ['--marchio', 103.6], ['--pc', 59.9]]
  const rows = [['casa', 'rilievo, cad, 3d'], ['sito', 'scritto a mano'], ['marchio', 'disegnato su griglia'], ['computer', 'virus, backup, wi-fi']]
  let o = `<g transform="translate(${n(x)} ${n(y)}) scale(${Number(k.toFixed(4))}) rotate(-1.1 ${W / 2} ${H / 2})">`
  o += `<rect y="7.2" width="${W}" height="${H}" rx="12" fill="${C.minio}"/><rect width="${W}" height="${H}" rx="12" fill="${C.ink}"/>`
  o += Ci(20.5, 33, 5.5, ` fill="${C.minio}"`) + Ci(38, 33, 5.5, ` fill="${C.paper}"`) + Ci(55.5, 33, 5.5, ` fill="${GREEN}"`)
  o += T(73, 38, 'alberto.sh', { fill: soft, size: 14.7, opacity: 0.7 })
  o += `<rect x="${W - 74}" y="11" width="58" height="26" rx="6" fill="none" stroke="${soft}" stroke-opacity=".3"/>` + T(W - 45, 29, '01/05', { fill: soft, size: 13.6, anchor: 'middle', weight: 600 })
  let tx = 15
  tabs.forEach(([name, tw], i) => {
    o += `<rect x="${n(tx)}" y="70" width="${tw}" height="34" rx="17" fill="${i ? 'none' : C.paper}" stroke="${soft}" stroke-opacity="${i ? 0.3 : 1}"/>` + T(tx + tw / 2, 92, name, { fill: i ? '#cfccc4' : C.ink, size: 14.7, anchor: 'middle' })
    if (!i) o += Ln(tx + 12, 100, tx + 44, 100, C.minio, 2.5)
    tx += tw + 5.8
  })
  o += T(18, 132, '$', { fill: C.bright, size: 16, weight: 600 }) + T(36, 132, 'alberto --tutto', { fill: C.paper, size: 16, weight: 600 })
  rows.forEach(([key, val], i) => {
    const ry = 162 + i * 24.8
    o += tick(19, ry - 6, 9, '#4cc27f', 2) + T(37, ry, key, { fill: soft, size: 16, weight: 500 }) + Ln(121, ry - 5, 150, ry - 5, soft, 1.6, ' stroke-dasharray="1.6 3" opacity=".5"') + T(159, ry, val, { fill: C.paper, size: 16, weight: 600 })
  })
  o += arrow(20, 265, 11, C.bright, 1.8) + T(40, 270, 'tutti i servizi', { fill: C.bright, size: 16 }) + Rc(190, 255, 10, 19, '#4cc27f')
  return o + '</g>'
}

/**
 * Primo schermo della home alla larghezza `d`, in scala s, con l'angolo in alto
 * a sinistra in (x, y) e ritagliato alla piega. Dentro il gruppo le coordinate
 * sono i px della pagina vera.
 */
function screen(x, y, s, d) {
  const id = nextId('s')
  const dots = nextId('d')
  const hair = 1 / s
  const line = `stroke="${C.ink}" stroke-opacity=".16" stroke-width="${n(hair)}"`
  const nameStyle = { size: d.fs, family: SANS, weight: 600, stretch: 86, spacing: '-0.055em' }
  let o = `<defs><clipPath id="${id}"><rect width="${d.W}" height="${d.H}"/></clipPath><pattern id="${dots}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="${C.ink}" opacity=".16"/></pattern></defs>`
  o += `<g transform="translate(${n(x)} ${n(y)}) scale(${Number(s.toFixed(4))})" clip-path="url(#${id})">`
  o += Rc(0, 0, d.W, d.H, C.paper) + Rc(0, d.body, d.W, d.H - d.body, `url(#${dots})`)
  // fili dei margini e bordo della testata
  o += `<path d="M${d.g} 0V${d.H}M${n(d.W - d.g)} 0V${d.H}M0 ${d.hh}H${d.W}" fill="none" ${line}/>`

  // testata
  if (d.pills) for (const [px, pw, label, minio] of d.pills) o += pebble(px, d.pillY, pw, label, minio)
  if (d.round) for (const [rx, ry, kind] of d.round) o += roundButton(rx, ry, kind)
  o += picture(...d.snail, { round: true, sw: hair })
  o += lockup(d.logo[0], d.logo[1], 1)

  // saluto
  o += Ci(d.avatar[0] + 22, d.avatar[1] + 22, 22, ` fill="${C.paper3}" stroke="${C.minio}" stroke-width="1.5"`) + `<path d="M${n(d.avatar[0] + 9)} ${n(d.avatar[1] + 9)}l26 26m0 -26l-26 26" stroke="${C.ink}" stroke-width="${n(hair * 0.7)}" opacity=".4"/>` + Ci(d.avatar[0] + 39, d.avatar[1] + 39, 6, ` fill="${GREEN}" stroke="${C.paper}" stroke-width="2"`)
  o += T(d.hi[0], d.hi[1], 'ciao, sono', { size: d.hi[2], family: SERIF, italic: true, spacing: '-0.02em' })
  if (d.place) o += T(d.place[0], d.place[1], 'rivalta sul mincio — italia · 45°14′n · 10°41′e', { fill: C.graphite, size: 14 })
  o += Ci(d.avail.dot[0] + 4, d.avail.dot[1] + 4, 4, ` fill="${GREEN}"`)
  for (const [ax, ab, txt] of d.avail.lines) o += T(ax, ab, txt, { size: 14 })

  // nome: «alberto» pieno, «pecchini» a filo (l'inchiostro lo riempie dopo)
  o += T(d.words[0][0], d.words[0][1], 'alberto', nameStyle)
  o += T(d.words[1][0], d.words[1][1], 'pecchini', nameStyle).replace(`fill="${C.ink}"`, `fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"`)

  // filo con le tacche: una ogni 8 px, più lunga ogni 40
  let ticks = ''
  for (let tx = 0; tx <= d.W - d.g * 2; tx += 8) ticks += `M${n(d.g + tx)} ${d.rule}v${tx % 40 === 0 ? 9 : 5}`
  o += `<path d="M${d.g} ${d.rule}H${n(d.W - d.g)}${ticks}" fill="none" stroke="${C.ink}" stroke-opacity=".42" stroke-width="1"/>`

  // «// casa · sito · marchio  un solo referente»
  const kk = d.kicker
  o += T(kk.slashes[0], kk.slashes[1], '//', { fill: C.minio, size: kk.fs, weight: 600 })
  o += Rc(kk.pill[0], kk.pill[1], kk.pill[2], kk.pill[3], C.ink, ' rx="6"') + T(kk.pill[0] + kk.pill[2] / 2, kk.pill[1] + kk.pill[3] / 2 + kk.fs * 0.34, 'casa · sito · marchio', { fill: C.paper, size: kk.fs, weight: 600, anchor: 'middle' })
  o += T(kk.rest[0], kk.rest[1], 'un solo referente', { size: kk.fs })

  // il luogo comune sbarrato, il timbro, la risposta
  const my = d.myth
  const big = { size: my.fs, family: SANS, weight: 800, stretch: 88, spacing: '-0.05em' }
  ;['“servono tre', 'professionisti.”'].forEach((txt, i) => {
    const [base, lw] = my.lines[i]
    const mid = base - my.fs * (i ? 0.25 : 0.29)
    o += T(d.g, base, txt, big)
    o += `<path d="M${n(d.g - my.fs * 0.12)} ${n(mid)}H${n(d.g + lw + my.fs * 0.14)}" stroke="${C.minio}" stroke-width="${n(my.fs * 0.13)}" fill="none" transform="rotate(${i ? 1.1 : -1.7} ${n(d.g + lw / 2)} ${n(mid)})"/>`
  })
  const [sx, sy, sw, sh, sf] = my.stamp
  o += `<g transform="rotate(8 ${n(sx + sw / 2)} ${n(sy + sh / 2)})"><rect x="${n(sx + 4)}" y="${n(sy + 7)}" width="${n(sw - 8)}" height="${n(sh - 14)}" rx="${n(sf * 0.5)}" fill="${C.paper}" stroke="${C.minio}" stroke-width="${n(sf * 0.16)}"/><rect x="${n(sx + 4 + sf * 0.3)}" y="${n(sy + 7 + sf * 0.3)}" width="${n(sw - 8 - sf * 0.6)}" height="${n(sh - 14 - sf * 0.6)}" rx="${n(sf * 0.3)}" fill="none" stroke="${C.minio}" stroke-width="${n(sf * 0.07)}"/>${T(sx + sw / 2, sy + sh / 2 + sf * 0.34, 'falso', { fill: C.minio, size: sf, family: SANS, weight: 800, anchor: 'middle', spacing: '-0.01em' })}</g>`
  o += T(d.g, d.claim.base, 'ne basta', big) + T(d.claim.em, d.claim.base, 'uno.', { size: d.claim.emFs, family: SERIF, italic: true, spacing: '-0.01em' })

  // testo, tasti, garanzie
  d.lead.ys.forEach((ly, i) => (o += T(d.g, ly + 15.2, d.lead.text[i], { fill: C.graphite, size: 17, family: SANS })))
  o += Rc(d.btn[0], d.btn[1], d.btn[2], 60, C.ink, ' rx="2"') + T(d.btn[0] + 26.5, d.btn[1] + 35.5, 'parliamo del progetto', { fill: C.paper, size: 15, weight: 500 }) + arrow(d.btn[0] + d.btn[2] - 44, d.btn[1] + 30, 14, C.paper)
  o += `<rect x="${n(d.copy[0])}" y="${n(d.copy[1])}" width="${n(d.copy[2])}" height="60" rx="2" fill="#fff" fill-opacity=".55" stroke="${C.ink}" stroke-opacity=".42"/>`
  o += T(d.copy[0] + 15.5, d.copy[1] + 35.5, 'premi', { size: 15 }) + `<rect x="${n(d.copy[0] + 72)}" y="${n(d.copy[1] + 17)}" width="26" height="26" rx="5" fill="${C.paper}" stroke="${C.ink}" stroke-opacity=".5"/>` + T(d.copy[0] + 85, d.copy[1] + 35.5, 'c', { size: 15, weight: 600, anchor: 'middle' }) + T(d.copy[0] + 110, d.copy[1] + 35.5, 'per copiare la mia email', { size: 15 })
  if (d.trust) for (const [tx, ty, txt] of d.trust) o += tick(tx, ty + 9, 9, '#1d7a46', 1.8) + T(tx + 16, ty + 14.7, txt, { size: 14 })

  // terminale e figurina
  if (d.term) o += terminal(...d.term)
  if (d.sticker) o += picture(d.sticker[0], d.sticker[1], d.sticker[2], d.sticker[2], { round: true, sw: hair })
  o += '</g>'
  return o + `<rect x="${n(x)}" y="${n(y)}" width="${n(d.W * s)}" height="${n(d.H * s)}" fill="none" stroke="${C.ink}" stroke-width="1.2"/>`
}

// ── 1 · Tre schermi sul tavolo, nella stessa scala ───────────────────────────

function schermi({ w = 1200, h = 900, label } = {}) {
  const s = 0.39
  const top = 196
  const gap = 50
  const note = { fill: C.ink, size: 12, opacity: 0.6 }
  let o = Rc(0, 0, w, h, C.table)
  o += T(30, 62, 'la home di alberto pecchini', note) + T(w - 30, 62, `primo schermo a tre larghezze · rilievo del ${HOME.date}`, { ...note, anchor: 'end' })
  o += T(30, h - 36, 'misure in px della pagina vera', note) + T(w - 30, h - 36, 'scala 39 : 100 · immagini a tratteggio', { ...note, anchor: 'end' })

  let x = 56
  for (const d of [HOME.desktop, HOME.tablet, HOME.phone]) {
    const sw = d.W * s
    const sh = d.H * s
    const X = (v) => x + v * s
    const Y = (v) => top + v * s
    o += shadow(x, top, sw, sh, 0.22) + screen(x, top, s, d)

    // sopra: finestra, margini e contenuto
    const q1 = top - 22
    const q2 = top - 54
    for (const v of [0, d.g, d.W - d.g, d.W]) o += Ln(X(v), top - 6, X(v), (v === 0 || v === d.W ? q2 : q1) - 6, C.ink, 1, ' opacity=".35"')
    o += quota(X(0), q1, X(d.g), q1, '', {}) + quota(X(d.g), q1, X(d.W - d.g), q1, d.W < 500 ? it(d.W - d.g * 2) : `contenuto ${it(d.W - d.g * 2)}`, { size: 11 }) + quota(X(d.W - d.g), q1, X(d.W), q1, '', {})
    o += quota(X(0), q2, X(d.W), q2, d.W < 500 ? `${d.W}` : `finestra ${d.W}`, { size: 11 })
    o += T(X(0) - 7, q1 - 5, it(d.g), { size: 10, anchor: 'end', fill: C.deep })

    // a sinistra: testata e nome
    const qx = x - 20
    for (const v of [0, d.hh, d.title[0], d.title[1]]) o += Ln(qx - 6, Y(v), x - 6, Y(v), C.ink, 1, ' opacity=".35"')
    o += quota(qx, Y(0), qx, Y(d.hh), String(d.hh), { size: 10 }) + quota(qx, Y(d.hh), qx, Y(d.title[0]), '', {}) + quota(qx, Y(d.title[0]), qx, Y(d.title[1]), it(d.title[1] - d.title[0]), { size: 10 })
    // linea di base del nome
    const baseY = d.words[d.words.length - 1][1]
    o += Ln(x - 6, Y(baseY), x + sw + 6, Y(baseY), C.minio, 1, ' stroke-dasharray="6 4"')

    // sotto: nome dello schermo e misure
    const ty = top + 1024 * s + 62
    const cols = d.W >= 900 ? 2 : 1
    const specs = [
      `margine ${it(d.g)}`,
      `testata ${d.hh}`,
      `nome: corpo ${it(d.fs)}`,
      d.W >= 900 ? 'nome = 17,65 % del contenuto' : d.W >= 768 ? 'nome = 17,65 % del contenuto' : 'nome = 32,8 % del contenuto',
      d.cols ? `colonne 7 + 6 · ${it(d.cols[0][1])} e ${it(d.cols[1][1])}` : d.W >= 768 ? 'una colonna, nome su una riga' : 'una colonna, nome su due righe',
      d.cols ? 'distanza 64,8 · terminale 589 × 306' : `piega a ${d.H}`,
    ]
    o += T(x, ty, d.key, { size: 34, family: SANS, weight: 600, stretch: 94, spacing: '-0.035em' }) + T(x, ty + 27, `${d.W} × ${d.H}`, { size: 20, family: SERIF, italic: true })
    o += Ln(x, ty + 44, x + sw, ty + 44, C.ink, 1, ' opacity=".3"')
    const per = Math.ceil(specs.length / cols)
    specs.forEach((t, i) => (o += T(x + Math.floor(i / per) * (sw / cols), ty + 64 + (i % per) * 15, t, { size: 9.5, opacity: 0.8 })))
    x += sw + gap
  }
  return out(w, h, label || 'Il primo schermo della home di Alberto Pecchini a tre larghezze, desktop, tablet e telefono, nella stessa scala e con le misure', o)
}

// ── 2 · Rilievo del primo schermo a 1440 px ──────────────────────────────────

const PARTS = [
  [1408, 42, 'testata 84 · tasti a sasso alti 40'],
  [276, 126, 'saluto: instrument serif corsivo, corpo 43,7'],
  [1404, 186, 'nome: archivo 600, larghezza 86 %, corpo 236,7'],
  [720, 420.5, 'filo con una tacca ogni 8 px, lunga ogni 40'],
  [556, 590, 'titolo sbarrato: archivo 800, corpo 72'],
  [706, 820, 'tasti 289,8 × 60 e 336,8 × 60'],
  [1338, 566, 'terminale 589 × 306, ruotato di −1,1°'],
  [1284, 712, 'figurina 238,3 × 238,3'],
]

function rilievo({ w = 1200, h = 900, label } = {}) {
  const d = HOME.desktop
  const ink = C.ink
  const m = 26
  const strip = 40
  const s = 0.66
  const x0 = 124
  const y0 = 94
  const sw = d.W * s
  const sh = d.H * s
  const X = (v) => x0 + v * s
  const Y = (v) => y0 + v * s
  let o = Rc(0, 0, w, h, C.paper2)
  o += `<rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" fill="none" stroke="${ink}" stroke-width="1.3"/>` + Ln(m, h - m - strip, w - m, h - m - strip, ink, 1.3)
  let cx = m
  ;[['ap · web · 01', 0.14], ['home — rilievo del primo schermo', 0.4], [`1440 × 900 · scala 66 : 100 · ${HOME.date}`, 0.32], ['tav. 1 / 4', 0.14]].forEach(([txt, frac], i) => {
    if (i) o += Ln(cx, h - m - strip, cx, h - m, ink, 1)
    o += T(cx + 14, h - m - strip + 25, txt, { size: 13, weight: i === 1 ? 500 : 400, opacity: i === 1 ? 1 : 0.7 })
    cx += (w - m * 2) * frac
  })

  o += screen(x0, y0, s, d)
  // le due colonne del corpo: 7 fr e 6 fr
  for (const [cxx, cw] of d.cols) o += Rc(X(cxx), Y(d.body), cw * s, (d.H - d.body) * s, C.minio, ' opacity=".1" style="mix-blend-mode:multiply"')
  // linee del nome
  const base = d.words[0][1]
  const nameLines = [[base - d.fs * 0.73, `asc. ${it(d.fs * 0.73)}`], [base - d.fs * 0.53, `x ${it(d.fs * 0.53)}`], [base, `base ${it(base)}`]]
  for (const [ly, name] of nameLines) o += Ln(X(d.g) - 8, Y(ly), x0 + sw + 10, Y(ly), C.minio, 1) + T(x0 + sw + 14, Y(ly) + 4, name, { fill: C.deep, size: 10.5 })

  // sopra: margini e contenuto
  const q0 = y0 - 22
  for (const v of [0, d.g, d.W - d.g, d.W]) o += Ln(X(v), y0 - 6, X(v), q0 - 6, ink, 1, ' opacity=".35"')
  o += quota(X(0), q0, X(d.g), q0, it(d.g), { size: 10.5, tc: C.deep }) + quota(X(d.g), q0, X(d.W - d.g), q0, `contenuto ${it(d.W - d.g * 2)}`, { size: 12 }) + quota(X(d.W - d.g), q0, X(d.W), q0, it(d.g), { size: 10.5, tc: C.deep })
  // a sinistra: i livelli
  const q1 = x0 - 30
  const q2 = x0 - 66
  const levels = [0, d.hh, d.title[0], d.title[1], d.H]
  for (const v of levels) o += Ln(q2 - 6, Y(v), x0 - 6, Y(v), ink, 1, ' opacity=".35"')
  levels.slice(1).forEach((v, i) => (o += quota(q1, Y(levels[i]), q1, Y(v), it(v - levels[i]), { size: 12 })))
  o += quota(q2, Y(0), q2, Y(d.H), 'piega a 900', { size: 12 })
  // sotto: le colonne e la finestra
  const b1 = y0 + sh + 28
  const b2 = y0 + sh + 58
  const [[px, pw], [tx, tw]] = d.cols
  for (const v of [0, px, px + pw, tx, tx + tw, d.W]) o += Ln(X(v), y0 + sh + 6, X(v), (v === 0 || v === d.W ? b2 : b1) + 6, ink, 1, ' opacity=".35"')
  o += quota(X(px), b1, X(px + pw), b1, `colonna 7 fr · ${it(pw)}`, { size: 12 }) + quota(X(px + pw), b1, X(tx), b1, it(tx - px - pw), { size: 10.5, tc: C.deep }) + quota(X(tx), b1, X(tx + tw), b1, `colonna 6 fr · ${it(tw)}`, { size: 12 })
  o += quota(X(0), b2, X(d.W), b2, 'finestra 1440', { size: 12 })

  // richiami numerati e legenda
  PARTS.forEach(([ux, uy], i) => {
    o += Ci(X(ux), Y(uy), 9, ` fill="${C.minio}" stroke="${C.paper}" stroke-width="1.5"`) + T(X(ux), Y(uy) + 4, String(i + 1), { size: 11, weight: 600, anchor: 'middle' })
  })
  const lx = x0
  const lw = (w - m - 30 - lx) / 3
  PARTS.forEach(([, , txt], i) => {
    const col = Math.floor(i / 3)
    const ly = y0 + sh + 86 + (i % 3) * 16
    o += T(lx + col * lw, ly, String(i + 1), { fill: C.deep, size: 10.5, weight: 600 }) + T(lx + col * lw + 16, ly, txt, { size: 10.5, opacity: 0.8 })
  })
  return out(w, h, label || 'Rilievo quotato del primo schermo della home a 1440 pixel: margini, colonne, livelli, linee del nome e otto richiami', o)
}

// ── 3 · La scala dei caratteri: clamp() disegnato ────────────────────────────

// clamp(min, a + b·vw, max) in px (1 rem = 16 px), da styles/tokens.css
const SCALE = [
  { name: 'mega', min: 52, a: 19.2, b: 10.4, max: 200 },
  { name: 'display', min: 44, a: 22.4, b: 6.4, max: 128 },
  { name: 'h1', min: 38, a: 24, b: 4.2, max: 88 },
  { name: 'h2', min: 30, a: 20.8, b: 2.6, max: 60 },
  { name: 'h3', min: 22, a: 18.4, b: 1, max: 32 },
  { name: 'lead', min: 18, a: 16, b: 0.6, max: 24 },
]
const BREAKS = [[480, 'sm'], [768, 'md'], [1024, 'lg'], [1280, 'xl'], [1600, '2xl']]
const sizeAt = (t, vw) => Math.min(t.max, Math.max(t.min, t.a + (t.b * vw) / 100))

/** Grafico corpo/larghezza della finestra: una spezzata per ogni livello della scala. */
function typeChart(x, y, cw, ch, { fg = C.paper, acc = C.bright, size = 11, labels = true, v0 = 320, v1 = 1920, top = 210 } = {}) {
  const X = (v) => x + ((v - v0) / (v1 - v0)) * cw
  const Y = (px) => y + ch - (px / top) * ch
  let o = ''
  let grid = ''
  for (let px = 0; px <= top; px += 20) {
    grid += `M${n(x)} ${n(Y(px))}H${n(x + cw)}`
    if (labels && px % 40 === 0) o += T(x - 8, Y(px) + 4, String(px), { fill: fg, size, anchor: 'end', opacity: 0.6 })
  }
  o += `<path d="${grid}" stroke="${fg}" stroke-width="1" opacity=".1" fill="none"/>`
  o += `<path d="M${n(x)} ${n(y)}V${n(y + ch)}H${n(x + cw)}" stroke="${fg}" stroke-width="1" opacity=".5" fill="none"/>`
  for (const [bp, name] of BREAKS) {
    o += Ln(X(bp), y, X(bp), y + ch + 6, acc, 1, ' stroke-dasharray="3 5" opacity=".8"')
    if (labels) o += T(X(bp), y + ch + 20, String(bp), { fill: fg, size, anchor: 'middle' }) + T(X(bp), y + ch + 34, name, { fill: acc, size, anchor: 'middle' })
  }
  if (labels) o += T(X(v0), y + ch + 20, String(v0), { fill: fg, size, anchor: 'middle', opacity: 0.6 }) + T(X(v1), y + ch + 20, String(v1), { fill: fg, size, anchor: 'middle', opacity: 0.6 })
  SCALE.forEach((t, i) => {
    const w0 = ((t.min - t.a) / t.b) * 100
    const w1 = ((t.max - t.a) / t.b) * 100
    const pts = [[v0, sizeAt(t, v0)], [Math.max(v0, w0), sizeAt(t, Math.max(v0, w0))], [w1, t.max], [v1, t.max]]
    o += `<path d="M${pts.map(([vx, px]) => `${n(X(vx))} ${n(Y(px))}`).join('L')}" fill="none" stroke="${i === 0 ? acc : fg}" stroke-width="${labels ? 2 : 1.5}" stroke-linejoin="round"/>`
    o += Ci(X(w1), Y(t.max), labels ? 3.6 : 2.4, ` fill="${fg === C.paper ? C.ink : C.sheet}" stroke="${i === 0 ? acc : fg}" stroke-width="1.5"`)
    if (labels) o += T(x + cw + 10, Y(t.max) + 4, `${t.name} ${t.max}`, { fill: i === 0 ? acc : fg, size })
  })
  return o
}

function scala({ w = 1200, h = 900, label } = {}) {
  const fg = C.paper
  const acc = C.bright
  const dim = { fill: fg, size: 11.5, opacity: 0.72 }
  let o = Rc(0, 0, w, h, C.ink)
  o += T(40, 78, 'scala fluida', { fill: fg, size: 31, family: SANS, weight: 600, stretch: 94, spacing: '-0.035em' }) + T(40, 108, 'un corpo per ogni larghezza', { fill: fg, size: 21, family: SERIF, italic: true })
  const cx = 96
  const cy = 150
  const cw = 640
  const ch = 620
  o += typeChart(cx, cy, cw, ch, { fg, acc })
  o += T(cx - 44, cy - 14, 'corpo in px', dim) + T(cx + cw, cy + ch + 52, 'larghezza della finestra in px', { ...dim, anchor: 'end' })
  // i valori a 1440 px, la larghezza del rilievo
  const X1440 = cx + ((1440 - 320) / 1600) * cw
  o += Ln(X1440, cy, X1440, cy + ch, fg, 1, ' opacity=".45"') + T(X1440 - 6, cy + 14, 'a 1440', { fill: fg, size: 11, anchor: 'end', opacity: 0.8 })
  for (const t of SCALE) {
    const v = sizeAt(t, 1440)
    o += Ci(X1440, cy + ch - (v / 210) * ch, 3, ` fill="${fg}"`) + T(X1440 - 7, cy + ch - (v / 210) * ch - 6, it(v), { fill: fg, size: 10.5, anchor: 'end' })
  }

  // colonna destra: le formule
  const rx = 862
  const rw = w - 40 - rx
  o += T(rx, 78, 'clamp ( minimo, crescita, massimo )', { fill: fg, size: 12, weight: 500 }) + T(rx, 96, 'in px, con 1 rem = 16 px', dim)
  SCALE.forEach((t, i) => {
    const ry = 150 + i * 62
    o += Ln(rx, ry - 20, rx + rw, ry - 20, fg, 1, ' opacity=".14"')
    o += T(rx, ry, t.name, { fill: i ? fg : acc, size: 15, weight: 600 }) + T(rx + rw, ry, `${t.min} → ${t.max}`.replace('→', 'a'), { fill: fg, size: 13, anchor: 'end' })
    o += T(rx, ry + 19, `clamp(${t.min}, ${it(t.a)} + ${it(t.b)} vw, ${t.max})`, dim)
  })
  const fy = 150 + SCALE.length * 62
  o += Ln(rx, fy - 20, rx + rw, fy - 20, fg, 1, ' opacity=".14"')
  o += T(rx, fy, 'testo 17 · piccolo 15 · etichette 14', { fill: fg, size: 11.5 }) + T(rx, fy + 18, 'fissi: si leggono uguali ovunque', dim)
  // gli stessi corpi a 1440 px, in scala 1 : 2
  const sy = fy + 136
  o += T(rx, fy + 62, 'i sei corpi a 1440 px, scala 1 : 2', { fill: fg, size: 12, weight: 500 })
  let ax = rx
  for (const t of SCALE) {
    const v = sizeAt(t, 1440) / 2
    o += T(ax, sy, 'a', { fill: t.name === 'mega' ? acc : fg, size: n(v), family: SANS, weight: 600, stretch: 86, spacing: '-0.05em' })
    ax += v * 0.56 + 9
  }
  o += Ln(rx, sy + 1, rx + rw, sy + 1, acc, 1, ' opacity=".7"')
  o += T(40, h - 40, 'ap · web · 03', dim) + T(w - 40, h - 40, 'punti di rottura: 480 · 768 · 1024 · 1280 · 1600', { ...dim, anchor: 'end' })
  return out(w, h, label || 'La scala tipografica fluida del sito: per ogni livello il corpo in funzione della larghezza della finestra, con le formule clamp', o)
}

// ── 4 · Il sito in una tavola ────────────────────────────────────────────────

const SECTIONS = [['intro', 1076], ['discipline', 1483], ['siti web', 2084], ['web', 899], ['servizi', 1287], ['numeri', 616], ['metodo', 897], ['studio', 951], ['indice', 1279], ['piè di pagina', 1929]]
const EASINGS = [['ease-out', 0.16, 1, 0.3, 1, 'ingressi, tasti, fili'], ['ease-in-out', 0.65, 0, 0.35, 1, 'tavole, monogramma'], ['ease-soft', 0.33, 1, 0.68, 1, 'movimenti morbidi']]
const FLUID = [['margine', 18.1, 29.4, 49.6], ['tra colonne', 12, 17.1, 26.5], ['tra sezioni', 77.3, 105.6, 156]]

function sistema({ w = 1200, h = 900, label } = {}) {
  const ink = C.ink
  const g = 12
  const m = 24
  const lw = 560
  const rx = m + lw + g
  const rw = w - m - rx
  const topH = 500
  const by = m + topH + g
  let o = Rc(0, 0, w, h, C.paper3)
  const cell = (x, y, cw, ch, fill, letter, name, side, fg = ink) =>
    Rc(x, y, cw, ch, fill) + T(x + 18, y + 28, `${letter} — ${name}`, { fill: fg, size: 12, weight: 500 }) + (side ? T(x + cw - 18, y + 28, side, { fill: fg, size: 11, anchor: 'end', opacity: 0.65 }) : '')

  // a · la pagina
  {
    const d = HOME.desktop
    const s = 0.335
    const x = m
    const y = m
    const sx = x + 54
    const sy = y + 84
    const X = (v) => sx + v * s
    const Y = (v) => sy + v * s
    o += cell(x, y, lw, topH, C.sheet, 'a', 'pagina', `home a 1440 px · ${HOME.date}`)
    o += screen(sx, sy, s, d)
    const q0 = sy - 18
    for (const v of [0, d.g, d.W - d.g, d.W]) o += Ln(X(v), sy - 5, X(v), q0 - 5, ink, 1, ' opacity=".35"')
    o += quota(X(0), q0, X(d.g), q0, '', {}) + quota(X(d.g), q0, X(d.W - d.g), q0, `contenuto ${it(d.W - d.g * 2)}`, { size: 10.5 }) + quota(X(d.W - d.g), q0, X(d.W), q0, '', {})
    o += T(X(0) - 6, q0 - 4, it(d.g), { fill: C.deep, size: 9.5, anchor: 'end' })
    const qx = sx - 20
    const levels = [0, d.hh, d.title[0], d.title[1], d.H]
    for (const v of levels) o += Ln(qx - 5, Y(v), sx - 5, Y(v), ink, 1, ' opacity=".35"')
    levels.slice(1).forEach((v, i) => (o += quota(qx, Y(levels[i]), qx, Y(v), i === 1 ? '' : it(v - levels[i]), { size: 9.5 })))
    const b1 = sy + d.H * s + 22
    const [[px, pw], [tx, tw]] = d.cols
    for (const v of [px, px + pw, tx, tx + tw]) o += Ln(X(v), sy + d.H * s + 5, X(v), b1 + 5, ink, 1, ' opacity=".35"')
    o += quota(X(px), b1, X(px + pw), b1, `7 fr · ${it(pw)}`, { size: 10.5 }) + quota(X(px + pw), b1, X(tx), b1, '', {}) + quota(X(tx), b1, X(tx + tw), b1, `6 fr · ${it(tw)}`, { size: 10.5 })
    const b2 = b1 + 28
    for (const v of [0, d.W]) o += Ln(X(v), sy + d.H * s + 5, X(v), b2 + 5, ink, 1, ' opacity=".35"')
    o += quota(X(0), b2, X(d.W), b2, 'finestra 1440', { size: 10.5 })
    ;[`nome: archivo 600, larghezza 86 %, corpo ${it(d.fs)} = 17,65 % del contenuto`, 'testata 84 · piega a 900 · distanza tra le colonne 64,8', 'terminale 589 × 306, ruotato di −1,1° · immagini a tratteggio'].forEach((t, i) => (o += T(x + 18, y + topH - 48 + i * 16, t, { size: 10, opacity: 0.75 })))
  }

  // b · caratteri
  {
    const x = rx
    const y = m
    o += cell(x, y, rw, topH, ink, 'b', 'scala dei caratteri', 'clamp ( min, crescita, max )', C.paper)
    o += typeChart(x + 46, y + 56, rw - 46 - 96, topH - 56 - 58, { size: 9.5 })
  }

  // c · margini e punti di rottura
  const bw = (w - m * 2 - g * 2) / 3
  const bh = h - m - by
  {
    const x = m
    const y = by
    o += cell(x, y, bw, bh, C.sheet, 'c', 'margini', 'a 390 · 768 · 1440')
    const colX = [x + 150, x + 226, x + 302]
    ;['390', '768', '1440'].forEach((t, i) => (o += T(colX[i], y + 64, t, { size: 10.5, anchor: 'end', opacity: 0.65 })))
    FLUID.forEach(([name, ...vals], i) => {
      const ry = y + 98 + i * 40
      o += Ln(x + 18, ry - 20, x + bw - 18, ry - 20, ink, 1, ' opacity=".14"') + T(x + 18, ry, name, { size: 11.5 })
      vals.forEach((v, j) => (o += T(colX[j], ry, it(v), { size: 11.5, anchor: 'end', weight: j === 2 ? 600 : 400 })))
    })
    // i punti di rottura su un righello da 320 a 1920
    const ax = x + 18
    const aw = bw - 36
    const ay = y + 262
    const AX = (v) => ax + ((v - 320) / 1600) * aw
    o += Ln(ax, ay, ax + aw, ay, ink, 1.2)
    for (let v = 320; v <= 1920; v += 80) o += Ln(AX(v), ay, AX(v), ay + (v % 320 === 0 ? 7 : 4), ink, 1, ' opacity=".5"')
    for (const [bp, name] of BREAKS) o += Ln(AX(bp), ay - 16, AX(bp), ay, C.minio, 1.6) + T(AX(bp), ay - 21, name, { fill: C.deep, size: 9.5, anchor: 'middle' }) + T(AX(bp), ay + 21, String(bp), { size: 9, anchor: 'middle', opacity: 0.75 })
    o += T(ax, y + bh - 14, 'contenuto al massimo 1680 px', { size: 9.5, opacity: 0.7 })
  }

  // d · movimento
  {
    const x = m + bw + g
    const y = by
    o += cell(x, y, bw, bh, C.sheet, 'd', 'movimento', 'cubic-bezier')
    const b = 96
    const gapX = (bw - 36 - b * 3) / 2
    EASINGS.forEach(([name, x1, y1, x2, y2, use], i) => {
      const ex = x + 18 + i * (b + gapX)
      const ey = y + 62
      o += `<rect x="${n(ex)}" y="${n(ey)}" width="${b}" height="${b}" fill="none" stroke="${ink}" stroke-opacity=".3"/>` + Ln(ex, ey + b, ex + b, ey, ink, 1, ' stroke-dasharray="2 4" opacity=".4"')
      o += Ln(ex, ey + b, ex + x1 * b, ey + b - y1 * b, C.minio, 1) + Ln(ex + b, ey, ex + x2 * b, ey + b - y2 * b, C.minio, 1) + Ci(ex + x1 * b, ey + b - y1 * b, 3, ` fill="${C.minio}"`) + Ci(ex + x2 * b, ey + b - y2 * b, 3, ` fill="${C.minio}"`)
      o += `<path d="M${n(ex)} ${n(ey + b)}C${n(ex + x1 * b)} ${n(ey + b - y1 * b)} ${n(ex + x2 * b)} ${n(ey + b - y2 * b)} ${n(ex + b)} ${n(ey)}" fill="none" stroke="${ink}" stroke-width="2.2"/>`
      o += T(ex, ey + b + 18, name, { size: 10.5, weight: 600 }) + T(ex, ey + b + 32, `${it(x1, 2)} · ${it(y1, 2)} · ${it(x2, 2)} · ${it(y2, 2)}`, { size: 8.5, opacity: 0.75 }) + T(ex, ey + b + 45, use, { size: 8.5, opacity: 0.6 })
    })
    const dy = y + bh - 52
    o += Ln(x + 18, dy - 12, x + bw - 18, dy - 12, ink, 1, ' opacity=".2"')
    const unit = (bw - 36 - 3 * 8) / (0.15 + 0.3 + 0.55 + 0.8)
    let dx = x + 18
    for (const dur of [0.15, 0.3, 0.55, 0.8]) {
      o += Rc(dx, dy, dur * unit, 9, dur === 0.8 ? C.minio : ink) + T(dx, dy + 24, it(dur, 2) + (dur === 0.8 ? ' secondi' : ''), { size: 9.5, opacity: 0.75 })
      dx += dur * unit + 8
    }
  }

  // e · la home intera, sezione per sezione
  {
    const x = m + (bw + g) * 2
    const y = by
    const total = SECTIONS.reduce((sum, [, v]) => sum + v, 0)
    o += cell(x, y, bw, bh, C.sheet, 'e', 'la home intera', `${String(total).replace(/(\d)(\d{3})$/, '$1 $2')} px`)
    const rowH = 24
    const maxW = bw - 36 - 132
    const maxV = Math.max(...SECTIONS.map(([, v]) => v))
    SECTIONS.forEach(([name, v], i) => {
      const ry = y + 52 + i * rowH
      o += T(x + 18, ry + 9, name, { size: 9.5 }) + Rc(x + 104, ry, (v / maxV) * maxW, 10, i === 0 ? C.minio : ink) + T(x + bw - 18, ry + 9, String(v), { size: 9.5, anchor: 'end', opacity: 0.75 })
    })
    o += T(x + 18, y + bh - 14, `altezze a 1440 px · ${it(total / 900)} schermi da 900`, { size: 9.5, opacity: 0.7 })
  }

  return out(w, h, label || 'Il sito in una tavola: il primo schermo quotato, la scala dei caratteri, margini e punti di rottura, le curve di movimento e le altezze delle sezioni della home', o)
}

// ── Registro ─────────────────────────────────────────────────────────────────

const VARIANTS = { schermi, rilievo, scala, sistema }

/** Tavola del sito. `variant`: schermi · rilievo · scala · sistema. */
export function sitespec({ variant = 'schermi', ...options } = {}) {
  return (VARIANTS[variant] || schermi)(options)
}
