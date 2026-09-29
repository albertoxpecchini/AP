// Componenti legati ai progetti: card, riga d'indice, copertina.

import { html, esc } from '../html.js'
import { media, deviceMockup, sampleMark, icon } from './ui.js'
import { allAreas, categories } from '../../data/projects.js'

const catLabel = (key) => categories.find((c) => c.key === key)?.label || key

export const projectHref = (p) => `/portfolio/${p.slug}/`

/** Attributi data-* su cui lavorano i filtri (src/client/filters.js). */
export const filterAttrs = (p) =>
  ` data-project data-cat="${esc(p.categories.join(' '))}" data-area="${p.area}" data-year="${p.year}" data-sector="${esc(p.sector)}" data-tech="${esc(p.technologies.join('|'))}" data-type="${esc(p.types.join('|'))}"`

/** Copertina: i progetti web stanno su un MacBook, gli altri in tavola. */
export function cover(p, { ratio = '4/3', lazy = true, parallax = false } = {}) {
  if (p.area === 'web' && p.web) {
    return html`
      <div class="cover cover--web" style="--ratio:${ratio}" data-reveal="clip">
        <div class="cover__frame" data-clip>
          <div class="cover__inner"${parallax ? ' data-parallax="0.05"' : ''}>
            ${deviceMockup('laptop', { domain: p.web.domain, screen: p.web.desktop, lazy })}
          </div>
        </div>
      </div>
    `
  }
  return media(p.cover, { ratio, lazy, parallax, caption: null, className: 'cover' })
}

/** Card della griglia portfolio. `preview` aggiunge la miniatura usata dalla vista a elenco. */
export function projectCard(p, { span = 6, lazy = true, headingLevel = 3, preview = false } = {}) {
  const H = `h${headingLevel}`
  const pv = preview ? previewOf(p) : null
  return html`
    <article class="card" data-span="${span}"${filterAttrs(p)}${pv && ` data-preview="${pv.src}" data-preview-ratio="${pv.ratio}"`}>
      <a class="card__link" href="${projectHref(p)}" data-cursor="Apri">
        <div class="card__media">${cover(p, { ratio: span >= 7 ? '16/10' : '4/3', lazy })}</div>
        <div class="card__body">
          <p class="card__meta label"><span class="card__code">${esc(p.code)}</span><span>${esc(p.categories.map(catLabel).join(' · '))}</span><span>${p.year}</span></p>
          <${H} class="card__title"><span class="card__title-text">${esc(p.title)}</span><span class="card__arrow" aria-hidden="true">${icon('arrowUpRight')}</span></${H}>
          <p class="card__sub">${esc(p.subtitle)}</p>
          <p class="card__foot label"><span>${esc(p.location)}</span><span>${esc(p.types.slice(0, 2).join(' · '))}</span></p>
        </div>
      </a>
      ${sampleMark(p)}
    </article>
  `
}

/**
 * Card di un sito per il carosello della home: MacBook e iPhone con gli
 * screenshot fermi (niente anteprima scorrevole), dominio e stato online.
 */
export function siteCard(p, i) {
  const w = p.web
  return html`
    <article class="wcard" data-carousel-item data-reveal="up" style="--d:${(i % 2) * 70}ms">
      <a class="wcard__link" href="${projectHref(p)}" data-cursor="Apri">
        <div class="wcard__stage">
          ${deviceMockup('laptop', { domain: w.domain, screen: w.desktop, className: 'wcard__laptop' })}
          ${w.mobile && deviceMockup('phone', { domain: w.domain, screen: w.mobile, className: 'wcard__phone' })}
        </div>
        <div class="wcard__body">
          <p class="label wcard__meta"><span class="wcard__n">${String(i + 1).padStart(2, '0')}</span><span class="wcard__domain">${w.url ? '<span class="dot dot--live" aria-hidden="true"></span>' : ''}${esc(w.name || w.domain)}</span><span>${p.year}</span></p>
          <h3 class="wcard__title h3"><span>${esc(p.title)}</span><span class="wcard__arrow" aria-hidden="true">${icon('arrowUpRight')}</span></h3>
          <p class="wcard__sub">${esc(p.subtitle)}</p>
          <p class="label wcard__foot">${esc(p.client)} · ${esc(p.types.slice(0, 2).join(' · '))}</p>
        </div>
      </a>
      ${sampleMark(p)}
    </article>
  `
}

// Miniatura per l'anteprima flottante: file reale oppure tavola esportata in /art/<slug>.svg
export function previewOf(p) {
  const image = p.area === 'web' && p.web ? p.web.desktop : p.cover
  if (image?.src) return { src: image.src, ratio: '16/10' }
  return { src: `/art/${p.slug}.svg`, ratio: p.area === 'web' ? '16/10' : '4/3' }
}

// Riga dell'indice progetti, con anteprima al passaggio del puntatore.
export function indexRow(p, i) {
  const pv = previewOf(p)
  return html`
    <li class="irow"${filterAttrs(p)}>
      <a class="irow__link" href="${projectHref(p)}" data-preview="${pv.src}" data-preview-ratio="${pv.ratio}">
        <span class="irow__n label">${String(i + 1).padStart(3, '0')}</span>
        <span class="irow__title">${esc(p.title)}</span>
        <span class="irow__type label">${esc(p.types.slice(0, 2).join(' · '))}</span>
        <span class="irow__area label">${esc(allAreas[p.area].short)}</span>
        <span class="irow__year label">${p.year}</span>
        <span class="irow__arrow" aria-hidden="true">${icon('arrowUpRight')}</span>
      </a>
      ${sampleMark(p)}
    </li>
  `
}
