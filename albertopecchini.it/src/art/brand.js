// Tavole per i progetti grafici: marchi, costruzione, immagine coordinata,
// manifesti, social, brochure, packaging, insegne, icone, presentazioni.
// Ogni tavola riceve una `brand` (chiave di BRANDS): palette e marchio cambiano,
// la composizione resta. I colori qui sono quelli del cliente, non del sito.

import { svg, n, nextId } from './kit.js'

const SANS = "var(--font-sans)"
const SERIF = "var(--font-serif)"
const MONO = "var(--font-mono)"

export const BRANDS = {
  tavolato: {
    name: 'Tavolato',
    tagline: 'STRUTTURE IN LEGNO',
    mark: 'rings',
    font: { family: SANS, weight: 700, stretch: 122, spacing: '-0.01em', upper: true },
    palette: [
      { name: 'Resina', hex: '#1E2A23' },
      { name: 'Abete', hex: '#C9A36B' },
      { name: 'Segatura', hex: '#EDE6D8' },
      { name: 'Muschio', hex: '#6F8168' },
      { name: 'Minio', hex: '#D9582B' },
    ],
  },
  cortebassa: {
    name: 'Corte Bassa',
    tagline: 'AZIENDA AGRICOLA · DAL 1961',
    mark: 'sun',
    font: { family: SERIF, weight: 400, stretch: 100, spacing: '-0.01em' },
    palette: [
      { name: 'Lambrusco', hex: '#6E1D2A' },
      { name: 'Paglia', hex: '#E7C36C' },
      { name: 'Latte', hex: '#F5ECDD' },
      { name: 'Siepe', hex: '#2E3B2D' },
      { name: 'Cotto', hex: '#B4622A' },
    ],
  },
  argini: {
    name: 'Argini',
    tagline: 'FESTIVAL DI MUSICA SULL’ACQUA',
    mark: 'waves',
    font: { family: SANS, weight: 800, stretch: 68, spacing: '-0.02em', upper: true },
    palette: [
      { name: 'Notte', hex: '#0D2743' },
      { name: 'Corallo', hex: '#F25C3B' },
      { name: 'Sabbia', hex: '#F3EADB' },
      { name: 'Canneto', hex: '#7FB7BE' },
    ],
  },
  quadra: {
    name: 'Studio Quadra',
    tagline: 'INGEGNERIA E ARCHITETTURA',
    mark: 'quadra',
    font: { family: SANS, weight: 600, stretch: 100, spacing: '-0.02em' },
    palette: [
      { name: 'Nero china', hex: '#121212' },
      { name: 'Carta', hex: '#F3F1EC' },
      { name: 'Cianografia', hex: '#2C49F5' },
      { name: 'Cemento', hex: '#B8B3A6' },
    ],
  },
  anello: {
    name: 'Anello dei Laghi',
    tagline: 'PERCORSO CICLOPEDONALE',
    mark: 'loop',
    font: { family: SANS, weight: 700, stretch: 88, spacing: '-0.015em' },
    palette: [
      { name: 'Bosco', hex: '#1D4A38' },
      { name: 'Segnale', hex: '#F2C12E' },
      { name: 'Ghiaia', hex: '#F6F2E8' },
      { name: 'Acqua', hex: '#3A7CA5' },
    ],
  },
}

// ── helper ───────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function T(x, y, str, { fill = '#000', size = 16, family = SANS, weight = 400, anchor = 'start', stretch, spacing, italic, opacity, rotate } = {}) {
  const style = [`font-family:${family}`, stretch && `font-stretch:${stretch}%`, italic && 'font-style:italic'].filter(Boolean).join(';')
  return `<text x="${n(x)}" y="${n(y)}" fill="${fill}" font-size="${size}" font-weight="${weight}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity ? ` opacity="${opacity}"` : ''}${rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : ''} style="${style}">${esc(str)}</text>`
}
const Rc = (x, y, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`
const Ln = (x1, y1, x2, y2, stroke, sw = 1, extra = '') => `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${stroke}" stroke-width="${sw}" fill="none"${extra}/>`
const shadow = (x, y, w, h, o = 0.16) => Rc(x + 10, y + 14, w, h, '#000', ` opacity="${o}" filter="url(#SHADOW)"`)
const shadowDef = (id) => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation="14"/></filter>`

function wordmark(b, x, y, size, fill, anchor = 'start') {
  const f = b.font
  return T(x, y, f.upper ? b.name.toUpperCase() : b.name, { fill, size, family: f.family, weight: f.weight, stretch: f.stretch, spacing: f.spacing, anchor })
}

/** Marchio centrato in (cx, cy) inscritto in un quadrato di lato s. */
function mark(kind, cx, cy, s, fg, bg = 'none', guides = false) {
  const h = s / 2
  const sw = s * 0.075
  let o = ''
  if (kind === 'rings') {
    const id = nextId('m')
    o += `<clipPath id="${id}"><rect x="${n(cx - h)}" y="${n(cy - h)}" width="${n(s)}" height="${n(s)}"/></clipPath><g clip-path="url(#${id})" fill="none" stroke="${fg}" stroke-width="${n(sw)}">`
    for (let i = 1; i <= 5; i++) o += `<circle cx="${n(cx - h)}" cy="${n(cy + h)}" r="${n((s / 5) * i * 1.06 - sw / 2)}"/>`
    o += '</g>'
  } else if (kind === 'sun') {
    o += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h - sw / 2)}" fill="none" stroke="${fg}" stroke-width="${n(sw)}"/>`
    o += `<path d="M${n(cx - h * 0.52)} ${n(cy + h * 0.02)}A${n(h * 0.52)} ${n(h * 0.52)} 0 0 1 ${n(cx + h * 0.52)} ${n(cy + h * 0.02)}Z" fill="${fg}"/>`
    for (let i = 0; i < 3; i++) {
      const y = cy + h * (0.22 + i * 0.2)
      const half = Math.sqrt(Math.max(0, (h - sw * 1.6) ** 2 - (y - cy) ** 2))
      o += Ln(cx - half, y, cx + half, y, fg, sw * 0.8)
    }
  } else if (kind === 'waves') {
    for (let i = 0; i < 3; i++) {
      const y = cy - h * 0.5 + i * h * 0.5
      const q = s / 4
      o += `<path d="M${n(cx - h)} ${n(y)}q${n(q / 2)} ${n(-q * 0.7)} ${n(q)} 0t${n(q)} 0t${n(q)} 0t${n(q)} 0" fill="none" stroke="${fg}" stroke-width="${n(sw * 1.25)}" stroke-linecap="round" opacity="${1 - i * 0.28}"/>`
    }
  } else if (kind === 'quadra') {
    o += `<rect x="${n(cx - h + sw)}" y="${n(cy - h + sw)}" width="${n(s - sw * 2)}" height="${n(s - sw * 2)}" fill="none" stroke="${fg}" stroke-width="${n(sw * 2)}"/>`
    o += Ln(cx + h * 0.12, cy + h * 0.12, cx + h + sw, cy + h + sw, fg, sw * 2)
  } else if (kind === 'loop') {
    o += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h - sw * 1.2)}" fill="none" stroke="${fg}" stroke-width="${n(sw * 2.4)}" stroke-dasharray="${n(s * 1.92)} ${n(s * 0.5)}" stroke-linecap="round" transform="rotate(-62 ${n(cx)} ${n(cy)})"/>`
    o += `<circle cx="${n(cx + h * 0.62)}" cy="${n(cy - h * 0.62)}" r="${n(sw * 1.9)}" fill="${bg === 'none' ? fg : bg}"/>`
  }
  if (guides) {
    const g = 'rgba(255,255,255,.55)'
    o += `<g fill="none" stroke="${guides === true ? g : guides}" stroke-width="1" stroke-dasharray="4 4">`
    o += `<rect x="${n(cx - h)}" y="${n(cy - h)}" width="${n(s)}" height="${n(s)}"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h)}"/>`
    o += `<path d="M${n(cx - h * 1.5)} ${n(cy)}H${n(cx + h * 1.5)}M${n(cx)} ${n(cy - h * 1.5)}V${n(cy + h * 1.5)}M${n(cx - h * 1.3)} ${n(cy - h * 1.3)}L${n(cx + h * 1.3)} ${n(cy + h * 1.3)}"/></g>`
  }
  return o
}

// ogni tavola ha il proprio filtro d'ombra: gli id restano univoci nella pagina
const out = (w, h, label, body, defs = '') => {
  const id = nextId('f')
  return svg({ w, h, tone: 'bare', bg: false, label, defs: shadowDef(id) + defs, body: body.replaceAll('url(#SHADOW)', `url(#${id})`) })
}
const get = (key) => BRANDS[key] || BRANDS.tavolato

// ── 1 · Marchio su campo colore / costruzione ────────────────────────────────

export function brandmark({ w = 1200, h = 900, brand = 'tavolato', construction = false, invert = false, label } = {}) {
  const b = get(brand)
  const [c0, c1, c2] = b.palette.map((p) => p.hex)
  const bg = invert ? c2 : c0
  const fg = invert ? c0 : c2
  const s = h * 0.3
  let o = Rc(0, 0, w, h, bg)
  if (construction) {
    const step = s / 5
    let grid = ''
    for (let x = (w / 2) % step; x < w; x += step) grid += `M${n(x)} 0V${h}`
    for (let y = (h * 0.42) % step; y < h; y += step) grid += `M0 ${n(y)}H${w}`
    o += `<path d="${grid}" stroke="${fg}" stroke-width="1" opacity=".13" fill="none"/>`
  }
  o += mark(b.mark, w / 2, h * 0.42, s, construction ? fg : c1, bg, construction ? fg : false)
  o += wordmark(b, w / 2, h * 0.42 + s * 0.5 + h * 0.13, h * 0.082, fg, 'middle')
  o += T(w / 2, h * 0.42 + s * 0.5 + h * 0.185, b.tagline, { fill: fg, size: h * 0.0185, family: MONO, anchor: 'middle', spacing: '.22em', opacity: 0.75 })
  if (construction) {
    const x = w / 2 + s / 2 + 34
    o += Ln(x, h * 0.42 - s / 2, x, h * 0.42 + s / 2, fg, 1) + Ln(x - 6, h * 0.42 - s / 2, x + 6, h * 0.42 - s / 2, fg, 1) + Ln(x - 6, h * 0.42 + s / 2, x + 6, h * 0.42 + s / 2, fg, 1)
    o += T(x + 14, h * 0.42 + 4, '5x', { fill: fg, size: 13, family: MONO })
    o += T(40, h - 40, 'COSTRUZIONE DEL MARCHIO · MODULO x = 1/5', { fill: fg, size: 12, family: MONO, spacing: '.1em', opacity: 0.7 })
    o += T(w - 40, h - 40, 'AREA DI RISPETTO ≥ 1x', { fill: fg, size: 12, family: MONO, spacing: '.1em', anchor: 'end', opacity: 0.7 })
  }
  return out(w, h, label || `Marchio ${b.name}${construction ? ' con griglia di costruzione' : ''}`, o)
}

// ── 2 · Restyling: prima → dopo ──────────────────────────────────────────────

export function restyle({ w = 1200, h = 900, brand = 'cortebassa', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w / 2, h, '#E4DED2') + Rc(w / 2, 0, w / 2, h, c0)
  // prima: marchio datato
  const cx = w * 0.25
  o += `<ellipse cx="${n(cx)}" cy="${n(h * 0.4)}" rx="150" ry="104" fill="none" stroke="#5B4A2F" stroke-width="5"/><ellipse cx="${n(cx)}" cy="${n(h * 0.4)}" rx="136" ry="90" fill="none" stroke="#5B4A2F" stroke-width="1.5"/>`
  o += `<path d="M${n(cx - 70)} ${n(h * 0.44)}l32 -46l26 30l30 -58l52 74Z" fill="#7C8B4A"/><circle cx="${n(cx + 62)}" cy="${n(h * 0.33)}" r="17" fill="#E0A11B"/>`
  o += T(cx, h * 0.62, 'Az. Agr. CORTE BASSA', { fill: '#5B4A2F', size: 30, family: 'Georgia, serif', weight: 700, anchor: 'middle', italic: true })
  o += T(cx, h * 0.665, 'di Fratelli B. — prodotti genuini dal 1961', { fill: '#5B4A2F', size: 15, family: 'Georgia, serif', anchor: 'middle' })
  // dopo
  const dx = w * 0.75
  o += mark(b.mark, dx, h * 0.39, 190, c1, c0) + wordmark(b, dx, h * 0.635, 66, c2, 'middle')
  o += T(dx, h * 0.685, b.tagline, { fill: c2, size: 13, family: MONO, anchor: 'middle', spacing: '.22em', opacity: 0.8 })
  // etichette
  o += T(40, 56, 'PRIMA · 2009', { fill: '#5B4A2F', size: 12, family: MONO, spacing: '.12em' }) + T(w / 2 + 40, 56, 'DOPO · 2025', { fill: c2, size: 12, family: MONO, spacing: '.12em' })
  o += `<circle cx="${w / 2}" cy="${h / 2}" r="30" fill="${c1}"/><path d="M${w / 2 - 11} ${h / 2}h20m-8 -8l8 8l-8 8" fill="none" stroke="${c0}" stroke-width="2.5"/>`
  return out(w, h, label || `Restyling del marchio ${b.name}: versione precedente e nuova`, o)
}

// ── 3 · Immagine coordinata ──────────────────────────────────────────────────

export function stationery({ w = 1200, h = 900, brand = 'tavolato', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, c3 || c1)
  // carta intestata
  const lx = w * 0.1
  const ly = h * 0.1
  const lw = h * 0.58
  const lh = lw * 1.414
  o += shadow(lx, ly, lw, lh) + Rc(lx, ly, lw, lh, '#FDFCF9')
  o += mark(b.mark, lx + 56, ly + 62, 44, c0, '#FDFCF9') + wordmark(b, lx + 92, ly + 70, 22, c0)
  for (let i = 0; i < 13; i++) o += Rc(lx + 56, ly + 190 + i * 22, lw * (i % 5 === 4 ? 0.42 : 0.7) , 5, c0, ' opacity=".16"')
  o += Rc(lx + 56, ly + 150, lw * 0.3, 7, c0, ' opacity=".5"')
  o += Ln(lx + 56, ly + lh - 74, lx + lw - 56, ly + lh - 74, c0, 1) + T(lx + 56, ly + lh - 48, 'via dell’Industria 12 · 46100 Mantova · P.IVA 00000000000', { fill: c0, size: 9.5, family: MONO, opacity: 0.7 })
  // busta
  const ex = w * 0.5
  const ey = h * 0.5
  o += shadow(ex, ey, 470, 228) + Rc(ex, ey, 470, 228, c2) + `<path d="M${n(ex)} ${n(ey)}L${n(ex + 235)} ${n(ey + 120)}L${n(ex + 470)} ${n(ey)}" fill="none" stroke="${c0}" stroke-width="1" opacity=".25"/>`
  o += mark(b.mark, ex + 410, ey + 178, 34, c0, c2)
  // biglietti da visita
  const bx = w * 0.56
  const by = h * 0.16
  o += `<g transform="rotate(-7 ${n(bx + 170)} ${n(by + 100)})">` + shadow(bx, by, 340, 200) + Rc(bx, by, 340, 200, c0) + mark(b.mark, bx + 170, by + 84, 74, c1, c0) + wordmark(b, bx + 170, by + 162, 22, c2, 'middle') + '</g>'
  o += `<g transform="rotate(5 ${n(bx + 300)} ${n(by + 160)})">` + shadow(bx + 150, by + 90, 340, 200) + Rc(bx + 150, by + 90, 340, 200, '#FDFCF9')
  o += T(bx + 178, by + 142, 'Marta Ferrari', { fill: c0, size: 21, weight: 600 }) + T(bx + 178, by + 164, 'RESPONSABILE TECNICO', { fill: c0, size: 9.5, family: MONO, spacing: '.12em', opacity: 0.7 })
  o += T(bx + 178, by + 238, '+39 000 000 0000', { fill: c0, size: 10.5, family: MONO }) + T(bx + 178, by + 256, 'marta@esempio.it', { fill: c0, size: 10.5, family: MONO }) + mark(b.mark, bx + 448, by + 246, 36, c0, '#FDFCF9') + '</g>'
  return out(w, h, label || `Immagine coordinata ${b.name}: carta intestata, busta e biglietti da visita`, o)
}

// ── 4 · Manifesti / locandine ────────────────────────────────────────────────

export function poster({ w = 1200, h = 900, brand = 'argini', count = 3, label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, '#D9D4C9')
  const pw = Math.min((h * 0.8) / 1.414, (w - 56 * (count + 1)) / count)
  const ph = pw * 1.414
  const gap = (w - pw * count) / (count + 1)
  const themes = [[c0, c2, c1], [c1, c0, c2], [c2, c0, c1]]
  const nights = [['12', 'LUG', 'Quartetto d’archi'], ['19', 'LUG', 'Elettronica al tramonto'], ['26', 'LUG', 'Coro sull’acqua']]
  for (let i = 0; i < count; i++) {
    const x = gap + i * (pw + gap)
    const y = (h - ph) / 2
    const [bg, fg, ac] = themes[i % 3]
    const [day, month, act] = nights[i % 3]
    o += shadow(x, y, pw, ph, 0.22) + Rc(x, y, pw, ph, bg)
    const id = nextId('p')
    o += `<clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(pw)}" height="${n(ph)}"/></clipPath><g clip-path="url(#${id})">`
    // onde che salgono dal basso
    for (let k = 0; k < 7; k++) {
      const yy = y + ph * (0.5 + k * 0.075)
      const q = pw / 3
      o += `<path d="M${n(x - q + (i + k) * 17)} ${n(yy)}q${n(q / 2)} ${n(-26 - k * 3)} ${n(q)} 0t${n(q)} 0t${n(q)} 0t${n(q)} 0t${n(q)} 0" fill="none" stroke="${k % 3 === 1 ? ac : fg}" stroke-width="${3 + k * 1.6}" opacity="${0.9 - k * 0.06}"/>`
    }
    o += T(x + pw * 0.08, y + ph * 0.3, day, { fill: fg, size: pw * 0.52, family: SANS, weight: 800, stretch: 62, spacing: '-0.04em' })
    o += T(x + pw * 0.64, y + ph * 0.3, month, { fill: ac, size: pw * 0.13, family: SANS, weight: 800, stretch: 62 })
    o += '</g>'
    o += T(x + pw * 0.08, y + ph * 0.075, 'ARGINI ’26', { fill: fg, size: 13, family: MONO, spacing: '.16em' }) + T(x + pw * 0.92, y + ph * 0.075, `N. 0${i + 1}`, { fill: fg, size: 13, family: MONO, anchor: 'end', spacing: '.1em' })
    o += T(x + pw * 0.08, y + ph * 0.39, act, { fill: fg, size: pw * 0.072, family: SERIF, italic: true })
    o += T(x + pw * 0.08, y + ph * 0.95, 'LUNGOLAGO · ORE 21:30 · INGRESSO LIBERO', { fill: bg === c2 ? c0 : c2, size: 9.5, family: MONO, spacing: '.1em' })
  }
  return out(w, h, label || `Serie di ${count} manifesti per il festival ${b.name}`, o)
}

// ── 5 · Social ───────────────────────────────────────────────────────────────

export function social({ w = 1200, h = 900, brand = 'argini', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3 = c1] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, '#E5E1D8')
  const s = Math.min((w - 160) / 3, (h - 130) / 2)
  const gx = (w - s * 3 - 40) / 2
  const gy = (h - s * 2 - 20) / 2
  const cells = [[c0, c2], [c1, c0], [c2, c0], [c3, c0], [c0, c1], [c2, c1]]
  cells.forEach(([bg, fg], i) => {
    const x = gx + (i % 3) * (s + 20)
    const y = gy + Math.floor(i / 3) * (s + 20)
    o += Rc(x, y, s, s, bg)
    if (i === 0) o += mark(b.mark, x + s / 2, y + s * 0.42, s * 0.36, fg, bg) + wordmark(b, x + s / 2, y + s * 0.8, s * 0.12, fg, 'middle')
    else if (i === 1) o += T(x + s * 0.09, y + s * 0.5, '3 notti', { fill: fg, size: s * 0.2, family: SERIF, italic: true }) + T(x + s * 0.09, y + s * 0.7, 'sull’acqua', { fill: fg, size: s * 0.2, family: SERIF, italic: true })
    else if (i === 2) o += T(x + s * 0.08, y + s * 0.62, '12.07', { fill: fg, size: s * 0.33, family: SANS, weight: 800, stretch: 62, spacing: '-0.03em' }) + T(x + s * 0.09, y + s * 0.78, 'APRE IL QUARTETTO D’ARCHI', { fill: fg, size: s * 0.04, family: MONO, spacing: '.1em' })
    else if (i === 3) {
      for (let k = 0; k < 6; k++) o += `<path d="M${n(x)} ${n(y + s * (0.25 + k * 0.11))}q${n(s / 6)} ${n(-s * 0.08)} ${n(s / 3)} 0t${n(s / 3)} 0t${n(s / 3)} 0" fill="none" stroke="${fg}" stroke-width="${2 + k}" opacity=".85"/>`
    } else if (i === 4) o += T(x + s * 0.09, y + s * 0.2, 'PROGRAMMA', { fill: fg, size: s * 0.045, family: MONO, spacing: '.16em' }) + ['21:30 — Apertura', '22:00 — Concerto', '23:30 — Dj set', '01:00 — Chiusura'].map((t, k) => T(x + s * 0.09, y + s * (0.4 + k * 0.13), t, { fill: c2, size: s * 0.07, weight: 500 })).join('')
    else o += T(x + s / 2, y + s * 0.56, '→', { fill: fg, size: s * 0.4, anchor: 'middle', weight: 300 }) + T(x + s / 2, y + s * 0.8, 'SCORRI IL PROGRAMMA', { fill: c0, size: s * 0.04, family: MONO, anchor: 'middle', spacing: '.14em' })
  })
  return out(w, h, label || `Griglia di sei contenuti social per ${b.name}`, o)
}

// ── 6 · Brochure ─────────────────────────────────────────────────────────────

export function brochure({ w = 1200, h = 900, brand = 'quadra', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3 = c1] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, '#CFCABE')
  const pw = w * 0.27
  const ph = pw * 1.42
  const x0 = (w - pw * 3) / 2
  const y0 = (h - ph) / 2
  o += shadow(x0, y0, pw * 3, ph, 0.24)
  // anta 1 — copertina
  o += Rc(x0, y0, pw, ph, c2) + mark(b.mark, x0 + pw * 0.2, y0 + ph * 0.14, pw * 0.16, c1, c2)
  o += T(x0 + pw * 0.1, y0 + ph * 0.62, 'Dieci anni', { fill: c1, size: pw * 0.135, weight: 600, spacing: '-0.03em' }) + T(x0 + pw * 0.1, y0 + ph * 0.72, 'di cantieri', { fill: c1, size: pw * 0.135, weight: 600, spacing: '-0.03em' }) + T(x0 + pw * 0.1, y0 + ph * 0.82, 'misurati.', { fill: c1, size: pw * 0.15, family: SERIF, italic: true })
  o += T(x0 + pw * 0.1, y0 + ph * 0.93, 'PROFILO DELLO STUDIO · 2026', { fill: c1, size: 9.5, family: MONO, spacing: '.12em', opacity: 0.8 })
  // anta 2 — testo + immagine
  const x1 = x0 + pw
  o += Rc(x1, y0, pw, ph, c1) + Rc(x1 + pw * 0.1, y0 + ph * 0.08, pw * 0.8, ph * 0.36, c3)
  o += `<path d="M${n(x1 + pw * 0.1)} ${n(y0 + ph * 0.44)}l${n(pw * 0.3)} ${n(-ph * 0.2)}l${n(pw * 0.22)} ${n(ph * 0.12)}l${n(pw * 0.28)} ${n(-ph * 0.18)}V${n(y0 + ph * 0.44)}Z" fill="${c0}" opacity=".85"/>`
  o += T(x1 + pw * 0.1, y0 + ph * 0.54, '01 — Rilievo', { fill: c0, size: pw * 0.062, weight: 600 })
  for (let i = 0; i < 9; i++) o += Rc(x1 + pw * 0.1, y0 + ph * 0.59 + i * 17, pw * (i % 4 === 3 ? 0.5 : 0.8), 4.5, c0, ' opacity=".2"')
  // anta 3 — numeri
  const x2 = x0 + pw * 2
  o += Rc(x2, y0, pw, ph, c0)
  ;[['148', 'PRATICHE CHIUSE'], ['36', 'CANTIERI DIRETTI'], ['12', 'COMUNI SERVITI']].forEach(([num, lab], i) => {
    o += T(x2 + pw * 0.1, y0 + ph * (0.22 + i * 0.26), num, { fill: c1, size: pw * 0.3, weight: 600, stretch: 75, spacing: '-0.04em' }) + T(x2 + pw * 0.1, y0 + ph * (0.27 + i * 0.26), lab, { fill: c1, size: 9.5, family: MONO, spacing: '.14em', opacity: 0.7 })
  })
  o += Ln(x1, y0, x1, y0 + ph, '#000', 1, ' opacity=".12"') + Ln(x2, y0, x2, y0 + ph, '#000', 1, ' opacity=".2"')
  return out(w, h, label || `Brochure a tre ante per ${b.name}`, o)
}

// ── 7 · Packaging ────────────────────────────────────────────────────────────

export function packaging({ w = 1200, h = 900, brand = 'cortebassa', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3, c4 = c1] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, c2) + Rc(0, h * 0.78, w, h * 0.22, c1, ' opacity=".55"')
  const items = [
    { x: w * 0.2, jw: 190, jh: 300, body: '#D7A84A', lbl: c0, fg: c2, name: 'Miele di tiglio', kind: 'jar' },
    { x: w * 0.5, jw: 150, jh: 470, body: '#2A1216', lbl: c2, fg: c0, name: 'Lambrusco', kind: 'bottle' },
    { x: w * 0.8, jw: 190, jh: 300, body: '#B9772E', lbl: c3, fg: c2, name: 'Mostarda di mele', kind: 'jar' },
  ]
  for (const it of items) {
    const base = h * 0.82
    const x = it.x - it.jw / 2
    const y = base - it.jh
    o += `<ellipse cx="${n(it.x)}" cy="${n(base + 4)}" rx="${n(it.jw * 0.62)}" ry="16" fill="#000" opacity=".16" filter="url(#SHADOW)"/>`
    if (it.kind === 'jar') {
      o += Rc(x + 14, y - 34, it.jw - 28, 40, c4, ' rx="6"') + Rc(x, y, it.jw, it.jh, it.body, ' rx="26"') + Rc(x + 12, y + 14, 16, it.jh - 60, '#fff', ' rx="8" opacity=".22"')
      o += Rc(x, y + 70, it.jw, 170, it.lbl)
      o += mark(b.mark, it.x, y + 122, 62, it.fg === c2 ? c1 : it.fg, it.lbl) + T(it.x, y + 190, it.name, { fill: it.fg, size: 21, family: SERIF, anchor: 'middle' }) + T(it.x, y + 214, '250 g · LOTTO 04', { fill: it.fg, size: 9, family: MONO, anchor: 'middle', spacing: '.14em', opacity: 0.8 })
    } else {
      o += `<path d="M${n(it.x - 22)} ${n(y)}h44v${n(it.jh * 0.25)}c0 40 ${n(it.jw / 2 - 22)} 40 ${n(it.jw / 2 - 22)} 90V${n(base - 14)}q0 14 -14 14H${n(x + 14)}q-14 0 -14 -14V${n(y + it.jh * 0.25 + 90)}c0 -50 ${n(it.jw / 2 - 22)} -50 ${n(it.jw / 2 - 22)} -90Z" fill="${it.body}"/>`
      o += Rc(it.x - 24, y - 6, 48, 64, c0) + Rc(x, base - 250, it.jw, 190, it.lbl)
      o += mark(b.mark, it.x, base - 196, 58, c0, it.lbl) + T(it.x, base - 128, it.name, { fill: it.fg, size: 25, family: SERIF, anchor: 'middle' }) + T(it.x, base - 104, 'DELL’EMILIA IGT', { fill: it.fg, size: 8.5, family: MONO, anchor: 'middle', spacing: '.16em' }) + T(it.x, base - 78, '2025', { fill: it.fg, size: 13, family: MONO, anchor: 'middle', spacing: '.1em' })
    }
  }
  o += T(40, 56, 'LINEA ETICHETTE · 3 REFERENZE', { fill: c0, size: 12, family: MONO, spacing: '.12em' })
  return out(w, h, label || `Etichette e packaging per i prodotti ${b.name}`, o)
}

// ── 8 · Insegne e targhe ─────────────────────────────────────────────────────

export function signage({ w = 1200, h = 900, brand = 'tavolato', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, '#C9C3B5')
  // parete intonacata con zoccolo
  let bricks = ''
  for (let y = 0; y < h * 0.78; y += 46) bricks += `M0 ${y}H${w}`
  o += `<path d="${bricks}" stroke="#000" opacity=".05" fill="none"/>` + Rc(0, h * 0.78, w, h * 0.22, '#8E897C') + Rc(0, h * 0.78, w, 6, '#000', ' opacity=".18"')
  // insegna a parete
  const sx = w * 0.12
  const sy = h * 0.2
  const sw_ = w * 0.5
  const shh = h * 0.2
  o += shadow(sx, sy, sw_, shh, 0.3) + Rc(sx, sy, sw_, shh, c0)
  o += mark(b.mark, sx + shh * 0.5, sy + shh / 2, shh * 0.52, c1, c0) + wordmark(b, sx + shh * 0.98, sy + shh * 0.6, shh * 0.34, c2)
  for (const [px, py] of [[sx + 12, sy + 12], [sx + sw_ - 12, sy + 12], [sx + 12, sy + shh - 12], [sx + sw_ - 12, sy + shh - 12]]) o += `<circle cx="${n(px)}" cy="${n(py)}" r="4" fill="${c2}" opacity=".6"/>`
  // quote
  const qc = '#2a2a26'
  o += Ln(sx, sy - 30, sx + sw_, sy - 30, qc) + Ln(sx, sy - 38, sx, sy - 22, qc) + Ln(sx + sw_, sy - 38, sx + sw_, sy - 22, qc) + T(sx + sw_ / 2, sy - 38, '300', { fill: qc, size: 12, family: MONO, anchor: 'middle' })
  o += Ln(sx - 30, sy, sx - 30, sy + shh, qc) + Ln(sx - 38, sy, sx - 22, sy, qc) + Ln(sx - 38, sy + shh, sx - 22, sy + shh, qc) + T(sx - 38, sy + shh / 2, '90', { fill: qc, size: 12, family: MONO, anchor: 'middle', rotate: -90 })
  // targa
  const tx = w * 0.72
  const ty = h * 0.4
  o += shadow(tx, ty, 190, 190, 0.3) + Rc(tx, ty, 190, 190, c2) + mark(b.mark, tx + 95, ty + 76, 70, c0, c2) + wordmark(b, tx + 95, ty + 146, 19, c0, 'middle') + T(tx + 95, ty + 168, 'UFFICI · 1° PIANO', { fill: c0, size: 8.5, family: MONO, anchor: 'middle', spacing: '.14em' })
  // insegna a bandiera
  o += Rc(w * 0.9, h * 0.14, 8, 150, '#2a2a26') + Rc(w * 0.9 - 130, h * 0.16, 130, 110, c1) + mark(b.mark, w * 0.9 - 65, h * 0.16 + 55, 62, c0, c1)
  o += T(40, h - 40, 'INSEGNA 300 × 90 cm · TARGA 40 × 40 cm · DIBOND 3 mm', { fill: '#fff', size: 12, family: MONO, spacing: '.1em', opacity: 0.85 })
  return out(w, h, label || `Insegna a parete, targa e insegna a bandiera ${b.name}`, o)
}

// ── 9 · Set di icone ─────────────────────────────────────────────────────────

const ICONS = [
  'M-14 12L0 -14L14 12ZM-6 12V2H6V12', // rifugio
  'M-16 8Q-8 -2 0 8T16 8M-16 0Q-8 -10 0 0T16 0', // acqua
  'M0 -16V16M0 -16L10 -6M0 -16L-10 -6', // direzione
  'M-12 10A6 6 0 1 0 -12 9.9M12 10A6 6 0 1 0 12 9.9M-12 4L-4 -8H6L12 4M-4 -8L2 4H-12', // bici
  'M0 14C-14 0 -8 -14 0 -14S14 0 0 14ZM0 -4A3 3 0 1 0 0 -3.9', // punto
  'M-14 12H14M-10 12V-4L0 -14L10 -4V12M-3 12V3H3V12', // casa
  'M0 -14L4 -4L14 -4L6 3L9 13L0 7L-9 13L-6 3L-14 -4L-4 -4Z', // interesse
  'M-12 -12H12V12H-12ZM-12 0H12M0 -12V12', // mappa
  'M-14 8Q0 -18 14 8M-8 8V14M8 8V14M-14 8H14', // ponte
  'M0 -15A15 15 0 1 0 0 15A15 15 0 1 0 0 -15M0 -8V1L7 5', // tempo
  'M-10 14V-2C-10 -16 10 -16 10 -2V14M-10 4H10', // fontana
  'M-14 12L-6 -6L0 4L6 -10L14 12Z', // rilievo
]

export function icons({ w = 1200, h = 900, brand = 'anello', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3 = c0] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, c2)
  const cols = 4
  const rows = 3
  const cell = Math.min((w - 140) / cols, (h - 170) / rows)
  const gx = (w - cell * cols) / 2
  const gy = (h - cell * rows) / 2 + 12
  ICONS.forEach((d, i) => {
    const x = gx + (i % cols) * cell
    const y = gy + Math.floor(i / cols) * cell
    const hot = i === 2 || i === 7
    const blue = i === 1 || i === 10
    o += Rc(x + 8, y + 8, cell - 16, cell - 16, hot ? c1 : blue ? c3 : c0, ' rx="14"')
    o += `<path d="${d}" transform="translate(${n(x + cell / 2)} ${n(y + cell / 2)}) scale(${n(cell / 62)})" fill="none" stroke="${hot ? c0 : c2}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
  })
  o += T(gx + 8, gy - 22, 'PITTOGRAMMI · GRIGLIA 32 px · TRATTO 2,4', { fill: c0, size: 12, family: MONO, spacing: '.1em' }) + T(gx + cell * cols - 8, gy - 22, '12 / 36', { fill: c0, size: 12, family: MONO, anchor: 'end' })
  return out(w, h, label || `Set di dodici pittogrammi per ${b.name}`, o)
}

// ── 10 · Presentazione ───────────────────────────────────────────────────────

export function slides({ w = 1200, h = 900, brand = 'quadra', label } = {}) {
  const b = get(brand)
  const [c0, c1, c2, c3 = c1] = b.palette.map((p) => p.hex)
  let o = Rc(0, 0, w, h, '#D4CFC4')
  const sw_ = (w - 150) / 2
  const shh = (sw_ * 9) / 16
  const gx = 50
  const gy = (h - shh * 2 - 50) / 2
  const pos = (i) => [gx + (i % 2) * (sw_ + 50), gy + Math.floor(i / 2) * (shh + 50)]
  // 1 · titolo
  let [x, y] = pos(0)
  o += shadow(x, y, sw_, shh) + Rc(x, y, sw_, shh, c0) + mark(b.mark, x + 56, y + 56, 40, c2, c0)
  o += T(x + 36, y + shh * 0.62, 'Riqualificazione', { fill: c1, size: shh * 0.13, weight: 600, spacing: '-0.03em' }) + T(x + 36, y + shh * 0.78, 'dell’ex filanda', { fill: c1, size: shh * 0.13, family: SERIF, italic: true })
  o += T(x + 36, y + shh - 26, 'PRESENTAZIONE AL COMMITTENTE · 03.2026', { fill: c1, size: 9, family: MONO, spacing: '.12em', opacity: 0.7 })
  // 2 · dati
  ;[x, y] = pos(1)
  o += shadow(x, y, sw_, shh) + Rc(x, y, sw_, shh, c1) + T(x + 36, y + 50, '02 — I numeri dell’intervento', { fill: c0, size: 17, weight: 600 })
  ;[[0.78, c0], [0.52, c2], [0.9, c0], [0.36, c3], [0.64, c0]].forEach(([v, c], i) => {
    const bw = (sw_ - 72 - 16 * 4) / 5
    o += Rc(x + 36 + i * (bw + 16), y + shh - 44 - (shh - 140) * v, bw, (shh - 140) * v, c)
  })
  o += Ln(x + 36, y + shh - 44, x + sw_ - 36, y + shh - 44, c0, 1)
  // 3 · immagine + testo
  ;[x, y] = pos(2)
  o += shadow(x, y, sw_, shh) + Rc(x, y, sw_, shh, c1) + Rc(x, y, sw_ * 0.48, shh, c3)
  o += `<path d="M${n(x)} ${n(y + shh)}V${n(y + shh * 0.55)}l${n(sw_ * 0.16)} ${n(-shh * 0.22)}l${n(sw_ * 0.14)} ${n(shh * 0.14)}l${n(sw_ * 0.18)} ${n(-shh * 0.2)}V${n(y + shh)}Z" fill="${c0}" opacity=".8"/>`
  o += T(x + sw_ * 0.54, y + 58, '03 — Stato di fatto', { fill: c0, size: 17, weight: 600 })
  for (let i = 0; i < 7; i++) o += Rc(x + sw_ * 0.54, y + 84 + i * 18, sw_ * (i % 3 === 2 ? 0.24 : 0.38), 5, c0, ' opacity=".2"')
  // 4 · chiusura
  ;[x, y] = pos(3)
  o += shadow(x, y, sw_, shh) + Rc(x, y, sw_, shh, c2) + T(x + 36, y + shh * 0.58, 'Prossimi passi', { fill: c1, size: shh * 0.14, weight: 600, spacing: '-0.03em' })
  ;['Rilievo laser · 2 gg', 'Progetto definitivo · 5 sett.', 'Pratica SCIA · 30 gg'].forEach((t, i) => (o += T(x + 36, y + shh * 0.72 + i * 19, `0${i + 1}  ${t}`, { fill: c1, size: 11, family: MONO })))
  return out(w, h, label || `Quattro slide del modello di presentazione ${b.name}`, o)
}

// ── 11 · Sistema di tavole e cartiglio ───────────────────────────────────────

export function titleblock({ w = 1200, h = 900, label } = {}) {
  const ink = '#10110F'
  const paper = '#FBFAF6'
  const acc = '#E5481F'
  let o = Rc(0, 0, w, h, '#CFCABD')
  const sx = 70
  const sy = 60
  const sw_ = w - 140
  const shh = h - 120
  o += shadow(sx, sy, sw_, shh, 0.22) + Rc(sx, sy, sw_, shh, paper)
  o += `<rect x="${sx + 22}" y="${sy + 22}" width="${sw_ - 44}" height="${shh - 44}" fill="none" stroke="${ink}" stroke-width="1.6"/>`
  // area disegno con griglia modulare
  let grid = ''
  for (let i = 1; i < 12; i++) grid += `M${n(sx + 22 + ((sw_ - 44) / 12) * i)} ${sy + 22}V${sy + shh - 22}`
  o += `<path d="${grid}" stroke="${acc}" stroke-width="1" opacity=".28" fill="none"/>`
  // cartiglio
  const cw = 470
  const ch = 210
  const cx = sx + sw_ - 22 - cw
  const cy = sy + shh - 22 - ch
  o += Rc(cx, cy, cw, ch, paper) + `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="none" stroke="${ink}" stroke-width="1.6"/>`
  const rowsY = [48, 104, 150]
  for (const r of rowsY) o += Ln(cx, cy + r, cx + cw, cy + r, ink, 1)
  o += Ln(cx + 300, cy + 48, cx + 300, cy + ch, ink, 1) + Ln(cx + 386, cy + 104, cx + 386, cy + ch, ink, 1) + Ln(cx + 150, cy + 150, cx + 150, cy + ch, ink, 1)
  const cap = (x, y, t) => T(x, y, t, { fill: ink, size: 7.5, family: MONO, spacing: '.12em', opacity: 0.6 })
  o += `<g transform="translate(${cx + 16} ${cy + 10}) scale(.62)" fill="none" stroke="${ink}" stroke-width="3"><path d="M8 42L24 6V42M14.2 28H24M24 6H32A11 11 0 0 1 32 28H24"/></g>`
  o += T(cx + 56, cy + 31, 'Alberto Pecchini', { fill: ink, size: 16, weight: 600 }) + T(cx + cw - 14, cy + 30, 'DISEGNO TECNICO', { fill: ink, size: 8.5, family: MONO, anchor: 'end', spacing: '.14em' })
  o += cap(cx + 14, cy + 64, 'PROGETTO') + T(cx + 14, cy + 90, 'Recupero di annesso rustico', { fill: ink, size: 17, weight: 500 })
  o += cap(cx + 314, cy + 64, 'COMMITTENTE') + T(cx + 314, cy + 90, 'Privato', { fill: ink, size: 14 })
  o += cap(cx + 14, cy + 120, 'OGGETTO') + T(cx + 14, cy + 140, 'Pianta piano terra — stato di progetto', { fill: ink, size: 12.5 })
  o += cap(cx + 314, cy + 120, 'SCALA') + T(cx + 314, cy + 140, '1:100', { fill: ink, size: 13, family: MONO })
  o += cap(cx + 400, cy + 120, 'FORMATO') + T(cx + 400, cy + 140, 'A1', { fill: ink, size: 13, family: MONO })
  o += cap(cx + 14, cy + 166, 'CODICE') + T(cx + 14, cy + 192, 'AP-25-011', { fill: acc, size: 15, family: MONO, weight: 500 })
  o += cap(cx + 164, cy + 166, 'DATA · REV.') + T(cx + 164, cy + 192, '14.03.2025 · R02', { fill: ink, size: 12, family: MONO })
  o += cap(cx + 314, cy + 166, 'FASE') + T(cx + 314, cy + 192, 'PD', { fill: ink, size: 15, family: MONO })
  o += cap(cx + 400, cy + 166, 'TAVOLA') + T(cx + 400, cy + 196, '02', { fill: ink, size: 26, weight: 600 })
  // legenda penne
  const lx = sx + 60
  const ly = sy + 70
  o += cap(lx, ly, 'SPESSORI · LAYER')
  ;[[0.13, 'A-QUOTE'], [0.25, 'A-ARREDI'], [0.35, 'A-PROIEZIONE'], [0.5, 'A-SEZIONE'], [0.7, 'A-TERRENO']].forEach(([mm, name], i) => {
    o += Ln(lx, ly + 28 + i * 24, lx + 120, ly + 28 + i * 24, ink, mm * 5.2) + T(lx + 136, ly + 32 + i * 24, `${mm.toFixed(2)} mm`, { fill: ink, size: 10.5, family: MONO }) + T(lx + 216, ly + 32 + i * 24, name, { fill: ink, size: 10.5, family: MONO, opacity: 0.6 })
  })
  // formati
  const fx = lx
  const fy = ly + 200
  o += cap(fx, fy, 'FORMATI · PIEGATURA UNI')
  let fw = 300
  let fh = 212
  ;['A1', 'A2', 'A3', 'A4'].forEach((name, i) => {
    o += `<rect x="${fx}" y="${n(fy + 16)}" width="${n(fw)}" height="${n(fh)}" fill="${i === 3 ? acc : 'none'}" stroke="${ink}" stroke-width="1" opacity="${i === 3 ? 0.9 : 1}"/>` + T(fx + fw - 8, fy + 16 + fh - 8, name, { fill: i === 3 ? paper : ink, size: 10, family: MONO, anchor: 'end' })
    if (i % 2 === 0) fw /= 2
    else fh /= 2
  })
  return out(w, h, label || 'Sistema di tavole: squadratura, cartiglio, spessori e formati', o)
}
