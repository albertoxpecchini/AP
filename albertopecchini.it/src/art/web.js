// Pagine web generate: servono da schermata segnaposto nei mockup (browser,
// tablet, smartphone) dei progetti web dimostrativi. Layout unico e responsive:
// `device` cambia larghezza e composizione, `site` cambia tema e contenuti.
// Con `tall: true` la pagina è lunga, così l'anteprima può scorrere al passaggio.

import { svg, n, nextId } from './kit.js'

const SANS = 'var(--font-sans)'
const SERIF = 'var(--font-serif)'
const MONO = 'var(--font-mono)'

export const SITES = {
  edilcorte: {
    brand: 'Edilcorte',
    domain: 'edilcorte.example',
    theme: { bg: '#F4F1EA', fg: '#1B1B19', muted: '#6B675E', surface: '#E6E0D3', accent: '#C4511F', dark: '#22211D', onAccent: '#fff' },
    nav: ['Interventi', 'Cantieri', 'Metodo', 'Contatti'],
    cta: 'Richiedi sopralluogo',
    eyebrow: 'RISTRUTTURAZIONI · MANTOVA E PROVINCIA',
    headline: ['Cantieri puliti,', 'tempi scritti,', 'prezzi chiusi.'],
    lead: ['Ristrutturiamo case e corti rurali con una squadra sola,', 'un capitolato leggibile e un cronoprogramma che firmiamo.'],
    stats: [['126', 'cantieri chiusi'], ['18', 'anni di attività'], ['94%', 'consegne nei tempi'], ['1', 'referente unico']],
    servicesTitle: 'Cosa facciamo, senza giri di parole',
    services: [['Ristrutturazione completa', 'Dalle demolizioni alle finiture, chiavi in mano.'], ['Coperture e isolamento', 'Tetti ventilati, cappotti, ponti termici risolti.'], ['Recupero di rustici', 'Consolidamenti, solai in legno, intonaci a calce.']],
    splitTitle: ['Un preventivo che', 'si capisce da solo'],
    bullets: ['Voci di capitolato con quantità e prezzi unitari', 'Varianti solo scritte e firmate', 'Stato avanzamento lavori ogni venerdì'],
    galleryTitle: 'Ultimi cantieri',
    quote: ['«Hanno consegnato due giorni prima.', 'E il conto era quello del preventivo.»'],
    quoteBy: 'Famiglia R. — recupero di un fienile, Goito',
    band: 'Hai un immobile da sistemare?',
    pic: 'facade',
  },
  kinesi: {
    brand: 'Studio Kinesi',
    domain: 'studiokinesi.example',
    theme: { bg: '#F2F7F5', fg: '#11302A', muted: '#55716B', surface: '#DAE9E4', accent: '#1F8A70', dark: '#11302A', onAccent: '#fff' },
    nav: ['Trattamenti', 'Équipe', 'Tariffe', 'Dove siamo'],
    cta: 'Prenota una visita',
    eyebrow: 'FISIOTERAPIA E RIABILITAZIONE',
    headline: ['Prenoti in due', 'minuti, torni a', 'muoverti bene.'],
    lead: ['Scegli il trattamento, vedi le disponibilità reali della', 'settimana e ricevi la conferma via email. Senza telefonate.'],
    stats: [['2 min', 'per prenotare'], ['6', 'fisioterapisti'], ['−41%', 'telefonate in segreteria'], ['4,9', 'voto medio dei pazienti']],
    servicesTitle: 'Trattamenti prenotabili online',
    services: [['Valutazione iniziale', '45 minuti per capire da dove partire.'], ['Riabilitazione post-operatoria', 'Percorsi concordati con l’ortopedico.'], ['Terapia manuale', 'Cervicale, schiena, spalla, ginocchio.']],
    splitTitle: ['Il calendario vero,', 'non un modulo'],
    bullets: ['Disponibilità aggiornate in tempo reale', 'Promemoria automatico il giorno prima', 'Disdetta in un clic fino a 24 ore prima'],
    galleryTitle: 'Lo studio',
    quote: ['«Ho prenotato dal telefono in pausa', 'pranzo. La sera ero già in studio.»'],
    quoteBy: 'Paziente — riabilitazione del ginocchio',
    band: 'Pronto a ricominciare?',
    pic: 'soft',
  },
}

const DEVICES = {
  desktop: { W: 1440, pad: 104, fold: 900, h1: 86, lead: 20, body: 16, cols: 3 },
  tablet: { W: 820, pad: 48, fold: 1100, h1: 62, lead: 18, body: 15, cols: 3 },
  mobile: { W: 390, pad: 22, fold: 800, h1: 40, lead: 15, body: 14, cols: 1 },
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function webpage({ site = 'edilcorte', device = 'desktop', tall = true, label } = {}) {
  const S = SITES[site] || SITES.edilcorte
  const D = DEVICES[device] || DEVICES.desktop
  const t = S.theme
  const { W, pad } = D
  const mobile = device === 'mobile'
  let o = ''
  let y = 0

  const T = (x, yy, str, { fill = t.fg, size = D.body, family = SANS, weight = 400, anchor = 'start', spacing, italic, opacity } = {}) =>
    `<text x="${n(x)}" y="${n(yy)}" fill="${fill}" font-size="${size}" font-weight="${weight}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity ? ` opacity="${opacity}"` : ''} style="font-family:${family}${italic ? ';font-style:italic' : ''}">${esc(str)}</text>`
  const Rc = (x, yy, w, h, fill, extra = '') => `<rect x="${n(x)}" y="${n(yy)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`
  const button = (x, yy, text, solid = true) => {
    const bw = text.length * (mobile ? 7.4 : 8.6) + 44
    const bh = mobile ? 44 : 52
    return (solid ? Rc(x, yy, bw, bh, t.accent, ' rx="4"') : `<rect x="${n(x)}" y="${n(yy)}" width="${n(bw)}" height="${bh}" rx="4" fill="none" stroke="${t.fg}" stroke-width="1.4"/>`) + T(x + bw / 2, yy + bh / 2 + 5, text, { fill: solid ? t.onAccent : t.fg, size: mobile ? 13.5 : 15, weight: 600, anchor: 'middle' })
  }

  /** "Fotografia" astratta coerente con il tema. */
  const picture = (x, yy, w, h, seed = 1) => {
    const id = nextId('w')
    let p = `<clipPath id="${id}"><rect x="${n(x)}" y="${n(yy)}" width="${n(w)}" height="${n(h)}" rx="6"/></clipPath><g clip-path="url(#${id})">` + Rc(x, yy, w, h, t.surface)
    if (S.pic === 'facade') {
      p += Rc(x, yy + h * 0.72, w, h * 0.28, t.dark, ' opacity=".18"')
      const bw = w * 0.62
      const bx = x + w * (seed % 2 ? 0.1 : 0.28)
      p += Rc(bx, yy + h * 0.22, bw, h * 0.56, t.bg) + `<path d="M${n(bx - 12)} ${n(yy + h * 0.22)}L${n(bx + bw / 2)} ${n(yy + h * 0.06)}L${n(bx + bw + 12)} ${n(yy + h * 0.22)}Z" fill="${t.accent}"/>`
      const cols = 4
      for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) p += Rc(bx + bw * (0.1 + i * 0.22), yy + h * (0.3 + j * 0.22), bw * 0.12, h * 0.13, j === 1 && i === 1 ? t.accent : t.dark, ' opacity=".8"')
      // ponteggio
      for (let i = 0; i <= 5; i++) p += `<path d="M${n(bx + (bw / 5) * i)} ${n(yy + h * 0.2)}V${n(yy + h * 0.78)}" stroke="${t.dark}" stroke-width="1.5" opacity=".4"/>`
      for (let j = 0; j < 3; j++) p += `<path d="M${n(bx)} ${n(yy + h * (0.36 + j * 0.16))}H${n(bx + bw)}" stroke="${t.dark}" stroke-width="1.5" opacity=".4"/>`
      p += `<circle cx="${n(x + w * (seed % 2 ? 0.86 : 0.12))}" cy="${n(yy + h * 0.2)}" r="${n(h * 0.09)}" fill="${t.accent}" opacity=".5"/>`
    } else {
      p += `<circle cx="${n(x + w * 0.7)}" cy="${n(yy + h * 0.42)}" r="${n(h * 0.46)}" fill="${t.accent}" opacity=".22"/><circle cx="${n(x + w * 0.34)}" cy="${n(yy + h * 0.74)}" r="${n(h * 0.38)}" fill="${t.dark}" opacity=".12"/>`
      // figura stilizzata
      const fx = x + w * (seed % 2 ? 0.56 : 0.44)
      p += `<circle cx="${n(fx)}" cy="${n(yy + h * 0.3)}" r="${n(h * 0.085)}" fill="${t.dark}"/><path d="M${n(fx - h * 0.2)} ${n(yy + h)}C${n(fx - h * 0.2)} ${n(yy + h * 0.5)} ${n(fx + h * 0.2)} ${n(yy + h * 0.5)} ${n(fx + h * 0.2)} ${n(yy + h)}Z" fill="${t.dark}"/>`
      p += `<path d="M${n(x)} ${n(yy + h * 0.9)}Q${n(x + w * 0.5)} ${n(yy + h * 0.7)} ${n(x + w)} ${n(yy + h * 0.86)}V${n(yy + h)}H${n(x)}Z" fill="${t.accent}" opacity=".55"/>`
    }
    return p + '</g>'
  }

  // 1 · navigazione
  const navH = mobile ? 64 : 88
  o += Rc(0, 0, W, navH, t.bg) + T(pad, navH / 2 + 7, S.brand, { size: mobile ? 19 : 23, weight: 700, spacing: '-0.02em' })
  if (device === 'desktop') {
    S.nav.forEach((l, i) => (o += T(W * 0.42 + i * 118, navH / 2 + 5, l, { size: 15, fill: t.muted })))
    o += button(W - pad - (S.cta.length * 8.6 + 44), navH / 2 - 26, S.cta)
  } else {
    o += Rc(W - pad - 26, navH / 2 - 7, 26, 2, t.fg) + Rc(W - pad - 26, navH / 2 + 5, 26, 2, t.fg)
  }
  o += Rc(0, navH, W, 1, t.fg, ' opacity=".1"')
  y = navH

  // 2 · hero
  const split = device === 'desktop'
  const heroTop = y + (mobile ? 40 : 84)
  o += T(pad, heroTop, S.eyebrow, { size: mobile ? 10 : 12.5, family: MONO, fill: t.accent, spacing: '.12em', weight: 500 })
  S.headline.forEach((l, i) => (o += T(pad, heroTop + D.h1 * (0.95 + i * 1.02), l, { size: D.h1, weight: 600, spacing: '-0.035em' })))
  let ty = heroTop + D.h1 * (0.95 + S.headline.length * 1.02) + (mobile ? 0 : 6)
  const leadLines = mobile ? wrap(S.lead.join(' '), 40) : S.lead
  leadLines.forEach((l, i) => (o += T(pad, ty + i * D.lead * 1.5, l, { size: D.lead, fill: t.muted })))
  ty += leadLines.length * D.lead * 1.5 + (mobile ? 14 : 22)
  o += button(pad, ty, S.cta) + (mobile ? '' : button(pad + S.cta.length * 8.6 + 60, ty, 'Guarda i lavori', false))
  ty += mobile ? 72 : 100
  if (split) {
    o += picture(W * 0.56, y + 56, W * 0.44 - pad, 560, 1)
    y = Math.max(ty, y + 56 + 560) + 70
  } else {
    o += picture(pad, ty, W - pad * 2, mobile ? 250 : 430, 1)
    y = ty + (mobile ? 250 : 430) + (mobile ? 44 : 70)
  }

  // 3 · numeri
  o += Rc(0, y, W, 1, t.fg, ' opacity=".12"')
  const sCols = mobile ? 2 : 4
  S.stats.forEach(([num, lab], i) => {
    const cw = (W - pad * 2) / sCols
    const sx = pad + (i % sCols) * cw
    const sy = y + 62 + Math.floor(i / sCols) * 98
    o += T(sx, sy, num, { size: mobile ? 34 : 48, weight: 600, spacing: '-0.03em' }) + T(sx, sy + 26, lab, { size: mobile ? 12 : 14, fill: t.muted })
  })
  y += 62 + Math.ceil(S.stats.length / sCols) * 98 - 20
  o += Rc(0, y, W, 1, t.fg, ' opacity=".12"')
  y += mobile ? 56 : 104

  // 4 · servizi
  o += T(pad, y, S.servicesTitle, { size: mobile ? 25 : 40, weight: 600, spacing: '-0.03em' })
  y += mobile ? 32 : 56
  const cardW = mobile ? W - pad * 2 : (W - pad * 2 - 28 * 2) / 3
  const cardH = mobile ? 150 : 250
  S.services.forEach(([title, desc], i) => {
    const cx = mobile ? pad : pad + i * (cardW + 28)
    const cy = mobile ? y + i * (cardH + 14) : y
    o += Rc(cx, cy, cardW, cardH, i === 1 ? t.dark : t.surface, ' rx="8"')
    const fg = i === 1 ? t.bg : t.fg
    o += Rc(cx + 26, cy + 26, 40, 40, i === 1 ? t.accent : t.bg, ' rx="6"') + T(cx + 46, cy + 52, `0${i + 1}`, { size: 13, family: MONO, fill: i === 1 ? t.onAccent : t.fg, anchor: 'middle' })
    o += T(cx + 26, cy + (mobile ? 96 : 146), title, { size: mobile ? 18 : 22, weight: 600, fill: fg, spacing: '-0.02em' })
    wrap(desc, mobile ? 44 : device === 'tablet' ? 26 : 40).forEach((l, k) => (o += T(cx + 26, cy + (mobile ? 120 : 178) + k * 21, l, { size: mobile ? 13.5 : 15, fill: fg, opacity: 0.72 })))
  })
  y += (mobile ? (cardH + 14) * 3 : cardH) + (mobile ? 50 : 120)

  if (tall) {
    // 5 · immagine + testo
    const picW = split ? W * 0.44 : W - pad * 2
    const picH = mobile ? 230 : 460
    o += picture(pad, y, picW, picH, 2)
    const tx = split ? pad + picW + 84 : pad
    let yy = split ? y + 84 : y + picH + (mobile ? 46 : 64)
    S.splitTitle.forEach((l, i) => (o += T(tx, yy + i * (mobile ? 32 : 50), l, { size: mobile ? 26 : 42, weight: 600, spacing: '-0.03em' })))
    yy += S.splitTitle.length * (mobile ? 32 : 50) + 18
    S.bullets.forEach((bl, i) => {
      o += `<circle cx="${n(tx + 9)}" cy="${n(yy + i * 44 - 5)}" r="9" fill="${t.accent}"/><path d="M${n(tx + 5)} ${n(yy + i * 44 - 5)}l3 3l5 -6" fill="none" stroke="${t.onAccent}" stroke-width="1.8"/>`
      wrap(bl, mobile ? 38 : 60).slice(0, 1).forEach((l) => (o += T(tx + 32, yy + i * 44, l, { size: mobile ? 13.5 : 16.5 })))
    })
    y = (split ? y + picH : yy + S.bullets.length * 44) + (mobile ? 56 : 120)

    // 6 · galleria
    o += T(pad, y, S.galleryTitle, { size: mobile ? 25 : 40, weight: 600, spacing: '-0.03em' }) + T(W - pad, y, 'Vedi tutti →', { size: mobile ? 13 : 15, fill: t.accent, anchor: 'end', weight: 600 })
    y += mobile ? 26 : 44
    if (mobile) {
      o += picture(pad, y, W - pad * 2, 210, 3) + picture(pad, y + 224, W - pad * 2, 210, 4)
      y += 448 + 56
    } else {
      const gw = W - pad * 2
      o += picture(pad, y, gw * 0.58, 420, 3) + picture(pad + gw * 0.58 + 24, y, gw * 0.42 - 24, 198, 4) + picture(pad + gw * 0.58 + 24, y + 222, gw * 0.42 - 24, 198, 5)
      y += 420 + 120
    }

    // 7 · testimonianza
    o += Rc(0, y, W, mobile ? 250 : 360, t.surface)
    const quote = mobile ? wrap(S.quote.join(' '), 30) : S.quote
    quote.forEach((l, i) => (o += T(W / 2, y + (mobile ? 70 : 130) + i * (mobile ? 32 : 58), l, { size: mobile ? 24 : 46, family: SERIF, italic: true, anchor: 'middle' })))
    o += T(W / 2, y + (mobile ? 70 + quote.length * 32 + 14 : 130 + quote.length * 58 + 16), S.quoteBy, { size: mobile ? 11 : 14, fill: t.muted, anchor: 'middle', family: MONO })
    y += mobile ? 250 : 360

    // 8 · fascia finale + piè di pagina
    const bandH = mobile ? 210 : 300
    o += Rc(0, y, W, bandH, t.accent)
    if (mobile) wrap(S.band, 22).forEach((l, i) => (o += T(pad, y + 66 + i * 36, l, { size: 30, weight: 600, fill: t.onAccent, spacing: '-0.03em' })))
    else o += T(pad, y + bandH / 2 + 18, S.band, { size: 56, weight: 600, fill: t.onAccent, spacing: '-0.035em' })
    const bw = S.cta.length * 8.6 + 44
    o += Rc(mobile ? pad : W - pad - bw, mobile ? y + bandH - 70 : y + bandH / 2 - 26, bw, mobile ? 44 : 52, t.bg, ' rx="4"') + T((mobile ? pad : W - pad - bw) + bw / 2, (mobile ? y + bandH - 70 + 27 : y + bandH / 2 + 5), S.cta, { size: mobile ? 13.5 : 15, weight: 600, anchor: 'middle' })
    y += bandH
    const footH = mobile ? 250 : 300
    o += Rc(0, y, W, footH, t.dark) + T(pad, y + 70, S.brand, { size: mobile ? 22 : 28, weight: 700, fill: t.bg, spacing: '-0.02em' })
    const fCols = mobile ? 2 : 3
    for (let c = 0; c < fCols; c++) for (let r = 0; r < 4; r++) o += Rc((mobile ? pad : W * 0.46) + c * (mobile ? 170 : 240), y + (mobile ? 112 : 62) + r * 26, r === 0 ? 70 : 96 + ((c + r) % 3) * 22, r === 0 ? 7 : 5, t.bg, ` opacity="${r === 0 ? 0.85 : 0.3}"`)
    o += Rc(pad, y + footH - 56, W - pad * 2, 1, t.bg, ' opacity=".2"') + T(pad, y + footH - 26, `© 2026 ${S.brand} — P.IVA 00000000000`, { size: 11, family: MONO, fill: t.bg, opacity: 0.6 })
    y += footH
  }

  const H = tall ? Math.round(y) : D.fold
  return svg({ w: W, h: H, tone: 'bare', bg: false, par: 'xMidYMin meet', label: label || `Pagina principale del sito ${S.brand}, versione ${device}`, body: Rc(0, 0, W, H, t.bg) + o })
}

function wrap(str, max) {
  const lines = []
  let cur = ''
  for (const word of str.split(' ')) {
    if ((cur + ' ' + word).trim().length > max) {
      lines.push(cur)
      cur = word
    } else cur = (cur + ' ' + word).trim()
  }
  if (cur) lines.push(cur)
  return lines
}
