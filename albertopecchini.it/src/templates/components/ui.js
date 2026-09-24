// Componenti di base riutilizzati da tutte le pagine.

import { html, esc, attrs, cx, pad } from '../html.js'
import { renderArt, isSheet } from '../../art/index.js'
import { site } from '../../data/site.js'

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

export const logo = ({ compact = false } = {}) => html`
  <a class="logo" href="/">
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
    })}>`
  }
  const { caption, ...spec } = image
  return renderArt(spec)
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
  return html`
    <div class="${cx('stage', className)}">
      ${deviceMockup('laptop', { domain: w.domain, screen: w.desktop, tall: scroll && w.desktopTall, lazy, className: 'stage__desktop' })}
      ${w.tablet && deviceMockup('tablet', { domain: w.domain, screen: w.tablet, lazy: true, className: 'stage__tablet' })}
      ${w.mobile && deviceMockup('phone', { domain: w.domain, screen: w.mobile, tall: scroll === true && w.mobileTall, lazy, className: 'stage__phone' })}
    </div>
  `
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
  <div class="stat" data-reveal="up" style="--d:${i * 90}ms">
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
