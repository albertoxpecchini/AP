// Componenti di base riutilizzati da tutte le pagine.

import { html, esc, attrs, cx, pad } from '../html.js'
import { renderArt, isSheet } from '../../art/index.js'
import { site } from '../../data/site.js'
import { figurine } from '../../data/figurine.js'
import { mascotte } from '../../data/mascotte.js'
import { burattino } from '../../data/burattini.js'

// ── Icone (inline, 1em) ──────────────────────────────────────────────────────

const ICON_PATHS = {
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  arrowUpRight: 'M7 17 17 7M8 7h9v9',
  arrowDown: 'M12 4v15m-6-6 6 6 6-6',
  arrowLeft: 'M20 12H5m6 6-6-6 6-6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M4 6h16M4 12h16M4 18h16',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  check: 'm5 12 5 5 9-10',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  minus: 'M5 12h14',
  download: 'M12 4v11m-5-5 5 5 5-5M5 20h14',
  shrink: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  fit: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M9 9h6v6H9z',
  arrowUp: 'M12 20V5m-6 6 6-6 6 6',
  mail: 'M3.5 6h17v12h-17zM3.5 7l8.5 6.5L20.5 7',
  menu: 'M4 7h16M4 12h16M4 17h16',
}

export const icon = (name, { size = '1em', className } = {}) =>
  `<svg class="${cx('icon', className)}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="${ICON_PATHS[name]}"/></svg>`

// ── Monogramma AP ────────────────────────────────────────────────────────────
// A e P condividono l'asta verticale; la traversa della A prosegue nell'occhiello della P.
// La geometria vive in un solo posto: la usano il marchio piccolo (header,
// tendina) e la firma grande del footer, che vi aggiunge le linee di costruzione.

const MARK = {
  a: 'M7 43 23.5 5',
  stem: 'M23.5 5v38',
  p: 'M13.5 28h10m0-23h8.5a11.5 11.5 0 0 1 0 23h-8.5',
  apex: { cx: 23.5, cy: 5 },
  // centro e raggio dell'occhiello: servono alle guide della firma
  bowl: { cx: 32, cy: 16.5, r: 11.5 },
}

const markPaths = (prefix) => html`
  <path class="${prefix}__a" pathLength="1" d="${MARK.a}"/>
  <path class="${prefix}__stem" pathLength="1" d="${MARK.stem}"/>
  <path class="${prefix}__p" pathLength="1" d="${MARK.p}"/>
`

export const monogram = ({ className, title } = {}) => html`
  <svg class="${cx('monogram', className)}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="miter" ${title ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"'} focusable="false">
    ${markPaths('monogram')}
    <circle class="monogram__node" cx="${MARK.apex.cx}" cy="${MARK.apex.cy}" r="1.9" fill="currentColor" stroke="none"/>
  </svg>
`

/**
 * Firma del footer: lo stesso monogramma, a tratto sottile e in grande, con le
 * linee di costruzione di una tavola tecnica — capitello, traversa, base,
 * asse dell'asta, prolungamento della diagonale, cerchio completo dell'occhiello
 * con il suo centro. Le guide restano tenui e si accendono al passaggio.
 */
export const signature = ({ className } = {}) => {
  const { bowl, apex } = MARK
  // la diagonale della A prolungata fino ai bordi del riquadro (0 e 48)
  const slope = (23.5 - 7) / (5 - 43)
  const xTop = 23.5 + slope * (0 - 5)
  const xBottom = 7 + slope * (48 - 43)
  return html`
  <svg class="${cx('sig', className)}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linejoin="miter" stroke-linecap="butt" aria-hidden="true" focusable="false">
    <g class="sig__guides">
      <path class="sig__guide" d="M0 5H48M0 28H48M0 43H48"/>
      <path class="sig__guide" d="M23.5 0V48"/>
      <path class="sig__guide" d="M${xBottom.toFixed(2)} 48 ${xTop.toFixed(2)} 0"/>
      <circle class="sig__guide sig__guide--bowl" cx="${bowl.cx}" cy="${bowl.cy}" r="${bowl.r}"/>
      <path class="sig__guide sig__guide--center" d="M${bowl.cx - 1.6} ${bowl.cy}h3.2M${bowl.cx} ${bowl.cy - 1.6}v3.2"/>
    </g>
    <g class="sig__mark">
      ${markPaths('sig')}
    </g>
    <circle class="sig__node" cx="${apex.cx}" cy="${apex.cy}" r="1" fill="currentColor" stroke="none"/>
  </svg>
`
}

export const logo = ({ compact = false, className } = {}) => html`
  <a class="${cx('logo', className)}" href="/">
    ${monogram()}
    <span class="${cx('logo__text', compact && 'logo__text--compact')}">
      <span class="logo__name">${esc(site.name)}</span>
      <span class="logo__role">${esc(site.title)}</span>
    </span>
    <span class="sr-only"> — pagina iniziale</span>
  </a>
`

// ── Bottoni e link ───────────────────────────────────────────────────────────

/**
 * @param {{href?: string, label: string, variant?: 'primary'|'ghost'|'light', size?: 'sm'|'md'|'lg',
 *          iconName?: string, magnetic?: boolean, external?: boolean, type?: string, attrs?: object}} o
 */
export function button({ href, label, variant = 'primary', size = 'md', iconName = 'arrow', magnetic = false, external = false, type, className, attrs: extra = {} }) {
  const inner = html`<span class="btn__label">${esc(label)}</span>${iconName && `<span class="btn__icon">${icon(iconName)}</span>`}`
  const common = {
    class: cx('btn', `btn--${variant}`, `btn--${size}`, className),
    'data-magnetic': magnetic,
    ...extra,
  }
  if (href) {
    return `<a${attrs({ ...common, href, target: external && '_blank', rel: external && 'noopener' })}>${inner}</a>`
  }
  return `<button${attrs({ ...common, type: type || 'button' })}>${inner}</button>`
}

export const textLink = ({ href, label, iconName = 'arrow', external = false, className }) =>
  `<a${attrs({ class: cx('link', className), href, target: external && '_blank', rel: external && 'noopener' })}><span class="link__label">${esc(label)}</span>${icon(iconName)}${external ? '<span class="sr-only"> (si apre in una nuova scheda)</span>' : ''}</a>`

// ── Testo ────────────────────────────────────────────────────────────────────

/** Titolo con rivelazione parola per parola (markup statico: nessun layout shift). */
export function splitWords(text, { accent = [] } = {}) {
  const words = String(text).split(' ')
  return (
    `<span class="sr-only">${esc(text)}</span>` +
    `<span class="words" aria-hidden="true">` +
    words
      .map((w, i) => {
        const isAccent = accent.includes(i) || accent.includes(w.replace(/[.,;:!?]/g, ''))
        return `<span class="w"><span class="w__i${isAccent ? ' serif-i' : ''}" style="--i:${i}">${esc(w)}</span></span>`
      })
      .join(' ') +
    `</span>`
  )
}

export const tagList = (items, { className, max } = {}) => {
  const shown = max ? items.slice(0, max) : items
  const rest = max ? items.length - shown.length : 0
  return html`<ul class="${cx('tags', className)}">${shown.map((t) => `<li class="tag">${esc(t)}</li>`)}${rest > 0 && `<li class="tag tag--more">+${rest}</li>`}</ul>`
}

/** Intestazione di sezione: indice, etichetta, titolo, metadati a destra. */
export function sectionHead({ index, label, title, titleHtml, lead, meta, level = 2, className, link }) {
  const H = `h${level}`
  return html`
    <header class="${cx('sec-head', className)}">
      <div class="sec-head__top" data-reveal="fade">
        <p class="label sec-head__label">${index && `<span class="sec-head__index">${esc(index)}</span>`}<span>${esc(label)}</span></p>
        ${meta && `<p class="label sec-head__meta">${esc(meta)}</p>`}
      </div>
      <div class="rule rule--ticks" aria-hidden="true"></div>
      <div class="sec-head__body">
        <${H} class="sec-head__title h2" data-reveal="words">${titleHtml || splitWords(title)}</${H}>
        ${(lead || link) && html`<div class="sec-head__side" data-reveal="up">${lead && `<p class="lead">${esc(lead)}</p>`}${link && textLink(link)}</div>`}
      </div>
    </header>
  `
}

// ── Immagini ─────────────────────────────────────────────────────────────────

/** Rapporto d'aspetto naturale di un'immagine (tavola o file). */
export function ratioOf(image, fallback = '4/3') {
  if (!image) return fallback
  if (image.ratio) return image.ratio
  if (image.width && image.height) return `${image.width}/${image.height}`
  return fallback
}

/** Solo il contenuto grafico: <img> per i file, <svg> per le tavole generate. */
export function picture(image, { lazy = true, sizes, className } = {}) {
  if (!image) return ''
  if (image.src) {
    return `<img${attrs({
      class: cx('pic', className),
      src: image.src,
      width: image.width,
      height: image.height,
      alt: image.alt || '',
      loading: lazy ? 'lazy' : 'eager',
      decoding: 'async',
      fetchpriority: lazy ? null : 'high',
      sizes,
      // versione grande per il lightbox, quando l'immagine in pagina è ridotta
      'data-full': image.full,
    })}>`
  }
  const { caption, ...spec } = image
  return renderArt(spec)
}

// ── Figurine ─────────────────────────────────────────────────────────────────
// Piccole illustrazioni scontornate (tools/figurine) accanto a servizi, fasi,
// strumenti. Sono decorative: il testo accanto dice già cosa rappresentano.

/** Nome di una figurina: le parti unite, minuscole, senza accenti né simboli («Modellazione 3D» → modellazione-3d). */
export const figName = (...parts) =>
  parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * La figurina `name`, se è stata ritagliata; altrimenti niente.
 * `sizes`: quanto è larga in pagina (per il srcset aggiunto in build); le figurine
 * restano sotto i 17rem, di solito sotto i 10.
 */
export function figurina(name, { className, lazy = true, sizes } = {}) {
  const f = figurine[name]
  if (!f) return ''
  return `<img${attrs({ class: cx('fig', className), src: `/media/figurine/${name}.webp`, width: f.w, height: f.h, alt: '', loading: lazy ? 'lazy' : 'eager', decoding: 'async', draggable: 'false', sizes: sizes || (lazy ? 'auto, 10rem' : '15rem') })}>`
}

// ── Tasti «sasso» ────────────────────────────────────────────────────────────
// I tasti di testata e piè di pagina: una sagoma irregolare disegnata da
// gpt-image-2 (foglio «tasti» in tools/figurine/fogli.js), resa premibile e in
// rilievo dal CSS (src/styles/pebble.css) e inclinata dal puntatore
// (src/client/pebble.js). Il testo lo mette il sito, la sagoma è vuota.
//
// Tre toni: «carta» (chiaro, scritta in inchiostro), «minio» (l'accento, per la
// chiamata all'azione) e «inchiostro» (scuro, scritta in carta: sul fondo scuro
// del piè di pagina per le voci secondarie). Le sagome larghe si alternano con
// `shape` (0, 1, 2…) così due tasti vicini non sono mai uguali; `round`
// prende la sagoma quasi tonda per i tasti con la sola icona.
// Se la sagoma non è ancora stata ritagliata, il tasto si disegna in CSS.

const PEBBLES = {
  carta: { wide: ['tasto-carta-1', 'tasto-carta-2', 'tasto-carta-3', 'tasto-carta-4'], round: 'tasto-carta-tondo' },
  minio: { wide: ['tasto-minio-1', 'tasto-minio-2'], round: 'tasto-carta-tondo' },
  inchiostro: { wide: ['tasto-inchiostro-1'], round: 'tasto-inchiostro-tondo' },
}

/**
 * @param {{href?: string, label: string, tone?: 'carta'|'minio'|'inchiostro', size?: 'sm'|'md'|'lg',
 *          shape?: number, round?: boolean, iconName?: string, iconBefore?: boolean, fig?: string,
 *          srLabel?: string, external?: boolean, current?: boolean, type?: string, className?: string, attrs?: object}} o
 */
export function pebble({ href, label, tone = 'carta', size = 'md', shape = 0, round = false, iconName, iconBefore = false, fig, srLabel, external = false, current = false, type, className, attrs: extra = {} }) {
  const set = PEBBLES[tone] || PEBBLES.carta
  const name = round ? set.round : set.wide[shape % set.wide.length]
  const has = Boolean(figurine[name])
  const ico = iconName ? `<span class="pb__icon" aria-hidden="true">${icon(iconName)}</span>` : fig ? `<span class="pb__fig" aria-hidden="true">${figurina(fig, { lazy: true, sizes: 'auto, 2.5em' })}</span>` : ''
  // con `srLabel` il nome accessibile è l'attributo aria-label: niente testo visibile
  const text = srLabel ? '' : `<span class="pb__label">${esc(label)}</span>`
  const inner =
    `<span class="pb__side" aria-hidden="true"></span>` +
    `<span class="pb__top"><span class="pb__face" aria-hidden="true"></span>${iconBefore ? ico : ''}${text}${iconBefore ? '' : ico}${external ? '<span class="sr-only"> (nuova scheda)</span>' : ''}</span>`
  const common = {
    class: cx('pb', `pb--${tone}`, `pb--${size}`, round && 'pb--round', !has && 'pb--fallback', current && 'is-current', className),
    style: has ? `--pb-img:url(/media/figurine/${name}.webp)` : null,
    'aria-current': current ? 'page' : null,
    'aria-label': srLabel || null,
    'data-pebble': true,
    ...extra,
  }
  if (href) return `<a${attrs({ ...common, href, target: external && '_blank', rel: external && 'noopener' })}>${inner}</a>`
  return `<button${attrs({ ...common, type: type || 'button' })}>${inner}</button>`
}

// ── Mascotte ─────────────────────────────────────────────────────────────────
// La chiocciola gigante africana e la tartaruga di terra (tools/mascotte),
// custodi di testata e piè di pagina. L'immagine ha gli occhi bianchi; sopra ci
// stanno due occhi del sito, con la pupilla che segue il puntatore e la
// palpebra che sbatte (src/client/mascot.js). Il «naso» è la zona in cui il
// puntatore fa incrociare gli occhi. Centri e semiassi (x, rx in % della
// larghezza; y, ry in % dell'altezza) in src/data/mascotte.js.
//
// `crop`: ritaglio in percentuale dell'immagine ({ x, y, w, h }), per mostrare
// solo la testa quando lo spazio è poco (la testata).

export function mascot(name, { className, crop, lazy = true, decorative = true, sizes } = {}) {
  const m = mascotte[name]
  if (!m) return ''
  const ar = (m.w / m.h).toFixed(4)
  const eye = (e, i) =>
    `<span class="masc__eye" style="--x:${e.x}%;--y:${e.y}%;--rx:${e.rx}%;--ry:${e.ry}%;--skin:${e.skin}" data-eye="${i}"><span class="masc__pupil"></span><span class="masc__lid"></span></span>`
  const nose = m.nose ? `<span class="masc__nose" style="--x:${m.nose.x}%;--y:${m.nose.y}%;--rx:${m.nose.rx}%;--ry:${m.nose.ry}%"></span>` : ''
  const body =
    `<span class="masc__body">` +
    `<img class="masc__img" src="/media/mascotte/${name}.webp" width="${m.w}" height="${m.h}" alt="${decorative ? '' : esc(m.alt)}" loading="${lazy ? 'lazy' : 'eager'}" sizes="${sizes || (lazy ? 'auto, 15rem' : '15rem')}" decoding="async" draggable="false">` +
    m.eyes.map(eye).join('') +
    nose +
    `</span>`
  const style = crop ? `--ar:${ar};--cx:${crop.x};--cy:${crop.y};--cw:${crop.w};--ch:${crop.h}` : `--ar:${ar}`
  return `<span${attrs({ class: cx('masc', `masc--${name}`, crop && 'masc--crop', className), style, 'data-mascot': name, 'aria-hidden': decorative ? 'true' : null, role: decorative ? null : 'img', 'aria-label': decorative ? null : m.alt })}>${body}</span>`
}

// ── Burattini ────────────────────────────────────────────────────────────────
// La chiocciola, la tartaruga, l'airone, la gazza e la vespa (tools/mascotte,
// «burattini»): burattini di carta a pezzi uniti da fermacampioni, montati come
// nel file src/data/burattini.js. Ogni pezzo è un riquadro che contiene i suoi figli
// (dietro con z negativo, davanti con z positivo) e gira intorno al proprio
// perno; src/client/puppet.js li muove: occhi che seguono il puntatore, pezzi
// da tirare, e il carattere di ciascun animale.
//
// `inside`: HTML in più dentro un pezzo, per nome ({ testa: '…' }): gira con
// lui. La 404 ci mette il foglio che la gazza tiene nel becco.
// `gaze`: selettore di ciò che il burattino guarda quando il puntatore non c'è
// (l'airone accanto alla carta guarda la sede), al posto dello sguardo che vaga.
// `skip`: pezzi da lasciare fuori, per nome (in testata la chiocciola non ha
// la stazione totale); `lazy` e `sizes` come in mascot(), perché in testata le
// immagini servono subito.
// Dal montaggio: `img` (un pezzo che riusa l'immagine di un altro), `mouth`
// (il buio della bocca dietro alla testa, che puppet.js apre con --open) e
// `scena` (regole per lo script, in data-scene: il corpo che si solleva…).

const DEG = Math.PI / 180
// trasformazioni affini [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f
const mul = ([a, b, c, d, e, f], [A, B, C, D, E, F]) => [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f]
const move = (x, y) => [1, 0, 0, 1, x, y]
const turn = (deg) => [Math.cos(deg * DEG), Math.sin(deg * DEG), -Math.sin(deg * DEG), Math.cos(deg * DEG), 0, 0]

export function puppet(name, { className, inside = {}, gaze, skip = [], lazy = true, sizes } = {}) {
  const b = burattino(name)
  if (!b) return ''
  const parti = b.parti.filter((p) => !skip.includes(p.id))
  const kids = (id) => parti.filter((p) => p.parent === id).sort((p, q) => p.z - q.z)
  const root = parti.find((p) => !p.parent)

  // il riquadro del burattino a riposo, nelle coordinate del corpo
  const box = [Infinity, Infinity, -Infinity, -Infinity]
  const walk = (p, m) => {
    for (const [u, v] of [[0, 0], [p.w, 0], [0, p.h], [p.w, p.h]]) {
      const [x, y] = [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5]]
      box[0] = Math.min(box[0], x), (box[1] = Math.min(box[1], y)), (box[2] = Math.max(box[2], x)), (box[3] = Math.max(box[3], y))
    }
    for (const c of kids(p.id)) walk(c, mul(m, mul(move(...c.at), mul(turn(c.rest), move(-c.pin[0], -c.pin[1])))))
  }
  walk(root, move(0, 0))
  const [fw, fh] = [box[2] - box[0], box[3] - box[1]]

  const pct = (v, total) => Number(((v / total) * 100).toFixed(3))
  const eye = (p) => (e, i) =>
    `<span class="masc__eye" style="--x:${pct(e.x, p.w)}%;--y:${pct(e.y, p.h)}%;--rx:${pct(e.rx, p.w)}%;--ry:${pct(e.ry, p.h)}%;--skin:${e.skin}" data-eye="${i}"><span class="masc__pupil"></span><span class="masc__lid"></span></span>`
  const part = (p, parent) => {
    const [x, y, w] = parent ? [pct(p.at[0] - p.pin[0], parent.w), pct(p.at[1] - p.pin[1], parent.h), pct(p.w, parent.w)] : [pct(-box[0], fw), pct(-box[1], fh), pct(p.w, fw)]
    const style = `left:${x}%;top:${y}%;width:${w}%;--ar:${p.w}/${p.h};--o:${pct(p.pin[0], p.w)}% ${pct(p.pin[1], p.h)}%${p.rest ? `;--rest:${p.rest}deg` : ''}${p.z ? `;z-index:${p.z}` : ''}`
    return (
      `<span class="pup__part pup__part--${p.id}" data-part="${p.id}"${p.drag ? ' data-drag' : ''} style="${style}">` +
      `<img class="pup__img" src="/media/mascotte/${name}/${p.img || p.id}.webp" width="${p.w}" height="${p.h}" alt="" loading="${lazy ? 'lazy' : 'eager'}" sizes="${sizes || (lazy ? 'auto, 8rem' : '8rem')}" decoding="async" draggable="false">` +
      `<span class="pup__pin" style="left:${pct(p.pin[0], p.w)}%;top:${pct(p.pin[1], p.h)}%"></span>` +
      (p.mouth ? `<span class="pup__mouth" style="left:${pct(p.mouth[0], p.w)}%;top:${pct(p.mouth[1], p.h)}%;width:${pct(p.mouth[2], p.w)}%;height:${pct(p.mouth[3], p.h)}%;--tilt:${p.mouth[4] || 0}deg"></span>` : '') +
      p.eyes.map(eye(p)).join('') +
      (inside[p.id] || '') +
      kids(p.id).map((c) => part(c, p)).join('') +
      `</span>`
    )
  }

  // le regole per lo script: escursione, sguardo (direzione della punta nel pezzo), molla
  const rig = Object.fromEntries(
    parti
      .filter((p) => p.parent)
      .map((p) => [p.id, { min: p.min ?? 0, max: p.max ?? 0, rest: p.rest, look: p.look || 0, dir: p.tip ? Math.round(Math.atan2(p.tip[1] - p.pin[1], p.tip[0] - p.pin[0]) / DEG) : 0, drag: Boolean(p.drag), k: p.k || 90, damp: p.damp || 0.32, ...(p.hide && { hide: p.hide }) }]),
  )
  return `<span${attrs({ class: cx('pup', `pup--${name}`, className), style: `--ar:${fw.toFixed(0)}/${fh.toFixed(0)}`, 'data-puppet': name, 'data-rig': JSON.stringify(rig), 'data-scene': b.scena ? JSON.stringify(b.scena) : null, 'data-gaze': gaze || null, 'aria-hidden': 'true' })}><span class="pup__stage">${part(root)}</span></span>`
}

/**
 * Riquadro immagine con rapporto fisso, crocini di registro e didascalia opzionale.
 * `zoom` lo rende apribile nel lightbox (gruppo = galleria di appartenenza).
 */
export function media(image, { ratio, caption, reveal = 'clip', parallax = false, zoom = false, group, index, lazy = true, className, marks = false, fit } = {}) {
  if (!image) return ''
  const r = ratio || ratioOf(image)
  const cap = caption === undefined ? image.caption : caption
  // le tavole con squadratura si mostrano intere: niente parallasse che le ritagli
  const move = parallax && !isSheet(image)
  const inner = html`<div class="media__inner"${move ? ` data-parallax="${parallax === true ? 0.08 : parallax}"` : ''}>${picture(image, { lazy })}</div>`
  // Il bottone del lightbox è un velo sopra l'immagine, non il suo contenitore:
  // così il testo interno alle tavole SVG non entra nel nome accessibile del bottone.
  const frame = zoom
    ? `<div class="media__frame media__frame--zoom" data-clip>${inner}<button class="media__open" type="button" data-lightbox="${esc(group || 'gallery')}" data-index="${index ?? 0}" data-caption="${esc(cap || image.alt || '')}" aria-label="Ingrandisci: ${esc(image.alt || cap || 'immagine')}" data-cursor="Apri"><span class="media__zoom" aria-hidden="true">${icon('expand')}</span></button></div>`
    : `<div class="media__frame" data-clip>${inner}</div>`
  return html`
    <figure class="${cx('media', fit && `media--${fit}`, marks && 'media--marks', className)}" style="--ratio:${r}"${reveal ? ` data-reveal="${reveal}"` : ''}>
      <div class="media__box">
        ${frame}
        ${marks && '<span class="mark mark--tl" aria-hidden="true"></span><span class="mark mark--tr" aria-hidden="true"></span><span class="mark mark--bl" aria-hidden="true"></span><span class="mark mark--br" aria-hidden="true"></span>'}
      </div>
      ${cap && `<figcaption class="media__caption label">${esc(cap)}</figcaption>`}
    </figure>
  `
}

// ── Mockup dispositivi ───────────────────────────────────────────────────────
// Cornici del file Figma «Device Mockups (iMac, Macbook, iPad, iPhone)» della
// Figma Community: MacBook Pro per il desktop, iPad Pro 12,9″ per il tablet,
// iPhone 14 Pro per lo smartphone. Le immagini dei dispositivi stanno in
// public/media/mockup/ (bordo trasparente ritagliato); lo schermo è un riquadro
// sopra l'immagine con le quote del livello «Paste image here» del file, scritte
// in percentuale in components.css. Sull'iPhone l'isola dinamica torna sopra lo
// screenshot, come nel file.

const DEVICES = {
  laptop: { src: '/media/mockup/macbook-pro.webp', width: 1244, height: 736, on: '' },
  tablet: { src: '/media/mockup/ipad-pro.webp', width: 906, height: 1180, on: ' su tablet' },
  phone: { src: '/media/mockup/iphone-14-pro.webp', width: 720, height: 1466, on: ' su smartphone' },
}

const island = (loading) =>
  `<img class="device__island" src="/media/mockup/iphone-14-pro-isola.png" width="313" height="92" alt="" loading="${loading}" decoding="async">` +
  `<img class="device__camera" src="/media/mockup/iphone-14-pro-camera.png" width="69" height="75" alt="" loading="${loading}" decoding="async">`

/**
 * Dispositivo con lo screenshot sullo schermo: `laptop`, `tablet` o `phone`.
 * `tall` abilita lo scorrimento della pagina al passaggio.
 */
export function deviceMockup(kind, { domain, screen, tall, className, lazy = true, label }) {
  const d = DEVICES[kind]
  const scroll = Boolean(tall)
  const loading = lazy ? 'lazy' : 'eager'
  return html`
    <div class="${cx('device', `device--${kind}`, className)}"${scroll ? ` data-scroll-preview tabindex="0" role="group" aria-label="${esc(label || `Anteprima scorrevole di ${domain}${d.on}`)}"` : ''}>
      <img class="device__frame" src="${d.src}" width="${d.width}" height="${d.height}" alt="" loading="${loading}" decoding="async">
      <div class="device__screen"><div class="device__page">${picture(tall || screen, { lazy })}</div></div>
      ${kind === 'phone' && island(loading)}
    </div>
  `
}

/**
 * Scena completa MacBook + iPad + iPhone per un progetto web.
 * `scroll`: true = portatile e telefono scorrono al passaggio · 'desktop' = solo il portatile
 * (meno byte quando la scena è in cima alla pagina) · false = immagini ferme.
 */
export function deviceStage(project, { lazy = true, scroll = true, className } = {}) {
  const w = project.web
  if (!w) return ''
  const domain = w.name || w.domain
  return html`
    <div class="${cx('stage', className)}">
      ${deviceMockup('laptop', { domain, screen: w.desktop, tall: scroll && w.desktopTall, lazy, className: 'stage__desktop' })}
      ${w.tablet && deviceMockup('tablet', { domain, screen: w.tablet, lazy: true, className: 'stage__tablet' })}
      ${w.mobile && deviceMockup('phone', { domain, screen: w.mobile, tall: scroll === true && w.mobileTall, lazy, className: 'stage__phone' })}
    </div>
  `
}

// ── iPhone 18 Pro ────────────────────────────────────────────────────────────
// Cornice vettoriale «IPhone 18 Pro Vector.svg» di Rafael Fernandez, da Wikimedia
// Commons, in licenza CC BY-SA 4.0: dove compare va citata (`iphoneCredit`).
// Schermo e isola dinamica ricalcano le quote del disegno (73 × 150 mm), in
// percentuale in components.css; dentro lo schermo le misure sono in punti iOS,
// su uno schermo largo 402, e seguono la larghezza del telefono.

const IPHONE = {
  src: '/media/mockup/iphone-18-pro.svg',
  width: 438,
  height: 900,
  source: 'https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg',
}

const statusBar = html`
  <div class="iphone__status" aria-hidden="true">
    <span class="iphone__time">9:41</span>
    <span class="iphone__icons">
      <svg viewBox="0 0 19 12" width="19" height="12" fill="currentColor"><rect y="7.5" width="3.2" height="4.5" rx="1"/><rect x="5.1" y="5.2" width="3.2" height="6.8" rx="1"/><rect x="10.2" y="2.7" width="3.2" height="9.3" rx="1"/><rect x="15.3" width="3.2" height="12" rx="1" opacity=".3"/></svg>
      <svg viewBox="0 0 17 12" width="17" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M1.6 4.6a10 10 0 0 1 13.8 0M4.4 7.5a6 6 0 0 1 8.2 0"/><circle cx="8.5" cy="10.3" r="1.6" fill="currentColor" stroke="none"/></svg>
      <svg viewBox="0 0 28 13" width="28" height="13" fill="currentColor"><rect width="25" height="13" rx="4.3" opacity=".35"/><path d="M4.3 0H18v13H4.3A4.3 4.3 0 0 1 0 8.7V4.3A4.3 4.3 0 0 1 4.3 0z"/><path d="M26.4 4.3v4.4c.9-.3 1.4-1.2 1.4-2.2s-.5-1.9-1.4-2.2z" opacity=".4"/></svg>
    </span>
  </div>
`

/** Il credito della cornice, obbligatorio con la licenza CC BY-SA. */
export const iphoneCredit = ({ className } = {}) =>
  `<p class="${cx('iphone-credit label', className)}"></p>`

/**
 * iPhone 18 Pro con `screen` sullo schermo, sotto la barra di stato e l'isola.
 * `attrs` finisce sul contenitore (per esempio lo scorrimento al passaggio).
 */
export function iphone(screen, { className, lazy = true, attrs: extra = {} } = {}) {
  return html`
    <div${attrs({ class: cx('iphone', className), ...extra })}>
      <img class="iphone__frame" src="${IPHONE.src}" width="${IPHONE.width}" height="${IPHONE.height}" alt="" loading="${lazy ? 'lazy' : 'eager'}" decoding="async">
      <div class="iphone__screen">
        ${screen}
        ${statusBar}
        <span class="iphone__home" aria-hidden="true"></span>
      </div>
      <span class="iphone__island" aria-hidden="true"></span>
    </div>
  `
}

/**
 * Un sito web in Safari su iPhone: la pagina intera (`pages`, strisce una sotto
 * l'altra) scorre al passaggio come negli altri mockup, sotto la barra degli indirizzi.
 */
export function iphoneSite({ domain, pages, label, lazy = true, className }) {
  return iphone(
    html`
      <div class="iphone__view">
        <div class="device__page">${pages.map((page) => picture(page, { lazy }))}</div>
      </div>
      <div class="iphone__safari" aria-hidden="true">
        <span class="iphone__glass iphone__glass--round"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4.5 7.5 12l7.5 7.5"/></svg></span>
        <span class="iphone__glass iphone__url">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9h8M8 12.5h8M8 16h5"/></svg>
          <span>${esc(domain)}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15"/></svg>
        </span>
        <span class="iphone__glass iphone__glass--round"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18.5" cy="12" r="2"/></svg></span>
      </div>
    `,
    {
      className: cx('iphone--site', className),
      lazy,
      // la pagina è lunga: scorre più piano delle anteprime dei portatili
      attrs: { 'data-scroll-preview': true, 'data-scroll-speed': 700, 'data-scroll-max': 16, tabindex: 0, role: 'group', 'aria-label': label || `Anteprima scorrevole di ${domain} su iPhone` },
    },
  )
}

// ── Dati ─────────────────────────────────────────────────────────────────────

export const sampleMark = (project) =>
  site.showSampleNotice && project.sample
    ? `<span class="sample" data-tooltip="Progetto dimostrativo" tabindex="0" role="note" aria-label="Progetto dimostrativo">◇</span>`
    : ''

/** Scheda dati del progetto (voci in stile cartiglio). */
export function dataSheet(project, { compact = false } = {}) {
  const rows = [
    ['Cliente', project.client],
    ['Settore', project.sector],
    ['Località', project.location],
    ['Anno', project.period || project.year],
    ['Tipologia', project.types.slice(0, compact ? 3 : 99).join(' · ')],
    !compact && ['Servizi', project.services.join(' · ')],
    [project.area === 'web' ? 'Tecnologie' : 'Software', project.technologies.join(' · ')],
  ].filter(Boolean)
  return html`
    <dl class="${cx('sheet', compact && 'sheet--compact')}">
      ${rows.map(([k, v]) => `<div class="sheet__row"><dt class="label">${esc(k)}</dt><dd>${esc(v)}</dd></div>`)}
    </dl>
  `
}

export const stat = ({ value, suffix = '', label, note }, i = 0) => html`
  <div class="stat" data-reveal="up" style="--d:${i * 55}ms">
    <p class="stat__value"><span data-count="${value}">${value}</span>${suffix && `<span class="stat__suffix">${esc(suffix)}</span>`}</p>
    <div class="stat__dim" aria-hidden="true"><span></span></div>
    <p class="stat__label label">${esc(label)}</p>
    ${note && `<p class="stat__note">${esc(note)}</p>`}
  </div>
`

export const breadcrumb = (items) => html`
  <nav class="crumbs label" aria-label="Percorso">
    <ol>
      ${items.map((it, i) => (i < items.length - 1 ? `<li><a href="${it.href}">${esc(it.label)}</a></li>` : `<li aria-current="page">${esc(it.label)}</li>`))}
    </ol>
  </nav>
`

export { pad }
