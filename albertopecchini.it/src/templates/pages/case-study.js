import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { allAreas, nextOf } from '../../data/projects.js'
import { BRANDS } from '../../art/brand.js'
import { button, media, deviceStage, dataSheet, tagList, icon, splitWords, breadcrumb, sampleMark } from '../components/ui.js'
import { projectHref, previewOf } from '../components/project.js'
import { compare, swatches, specimens } from './portfolio.js'
import { sheetViewer } from '../components/viewer.js'

const SECTIONS = [
  ['overview', 'Overview'],
  ['obiettivo', 'Obiettivo'],
  ['problema', 'Problema'],
  ['strategia', 'Strategia'],
  ['sviluppo', 'Sviluppo'],
  ['risultato', 'Risultato'],
  ['galleria', 'Galleria'],
  ['tecnologie', 'Tecnologie'],
  ['dati', 'Dati progetto'],
]

// Nei progetti con tavole vere la galleria diventa il visualizzatore
const labelOf = (p, i) => (i === 6 && p.sheets ? 'Tavole' : SECTIONS[i][1])

const sec = (i, body, extraClass = '', theme = '', label = SECTIONS[i][1]) => {
  const [id] = SECTIONS[i]
  const n = String(i + 1).padStart(2, '0')
  return html`
    <section class="cs-sec ${extraClass}" id="${id}" data-spy aria-labelledby="cs-${id}"${theme && ` data-theme="${theme}"`}>
      <div class="container cs-sec__grid">
        <header class="cs-sec__head">
          <p class="cs-sec__n" aria-hidden="true" data-reveal="up">${n}</p>
          <h2 class="cs-sec__label label" id="cs-${id}"><span class="sr-only">${n} — </span>${esc(label)}</h2>
        </header>
        <div class="cs-sec__body">${body}</div>
      </div>
    </section>
  `
}

export function caseStudyPage(p) {
  const area = allAreas[p.area]
  const next = nextOf(p.slug)
  const nextPv = previewOf(next)
  const brand = p.brand && BRANDS[p.brand]
  const palette = brand ? brand.palette : p.web?.palette
  const isWeb = p.area === 'web' && p.web

  return html`
    <article class="cs">
      <header class="cs-hero">
        <div class="container">
          ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Portfolio', href: '/portfolio/' }, { label: area.short, href: area.href }, { label: p.title, href: projectHref(p) }])}
          <div class="cs-hero__top label" data-reveal="fade">
            <span>${esc(p.code)}</span><span>Case study</span><span>${esc(p.period || p.year)}</span>
          </div>
          <h1 class="cs-hero__title" data-reveal="words">${splitWords(p.title)}</h1>
          <p class="cs-hero__sub" data-reveal="up"><span class="serif-i">${esc(p.subtitle)}</span>${sampleMark(p)}</p>
          <div class="rule rule--ticks" aria-hidden="true"></div>
          <dl class="cs-hero__meta" data-reveal="up">
            <div><dt class="label">Cliente</dt><dd>${esc(p.client)}</dd></div>
            <div><dt class="label">Settore</dt><dd>${esc(p.sector)}</dd></div>
            <div><dt class="label">Località</dt><dd>${esc(p.location)}</dd></div>
            <div><dt class="label">Area</dt><dd><a href="${area.href}">${esc(area.label)}</a></dd></div>
          </dl>
        </div>
        <div class="cs-hero__cover${isWeb ? ' cs-hero__cover--web' : ''}"${isWeb ? ' data-theme="ink"' : ''}>
          ${isWeb ? `<div class="container">${deviceStage(p, { lazy: false, scroll: 'desktop' })}</div>` : `<div class="container container--wide">${media(p.cover, { ratio: '16/9', lazy: false, parallax: 0.06, caption: null })}</div>`}
        </div>
      </header>

      <nav class="cs-nav" aria-label="Sezioni del case study" data-spy-nav>
        <ol>
          ${SECTIONS.map(([id], i) => `<li><a href="#${id}" data-tooltip="${esc(labelOf(p, i))}"><span class="label">${String(i + 1).padStart(2, '0')}</span><span class="sr-only"> ${esc(labelOf(p, i))}</span></a></li>`)}
        </ol>
      </nav>

      ${sec(
        0,
        html`
          <p class="cs-lead" data-reveal="up">${esc(p.description)}</p>
          <p data-reveal="up">${esc(p.summary)}</p>
          <div class="cs-services" data-reveal="up">
            <p class="label">Servizi forniti</p>
            <ul class="cs-list">${p.services.map((s, i) => `<li><span class="label">${String(i + 1).padStart(2, '0')}</span>${esc(s)}</li>`)}</ul>
          </div>
          ${isWeb && p.web.url ? `<div data-reveal="up">${button({ href: p.web.url, label: `Visita ${p.web.domain}`, variant: 'ghost', iconName: 'arrowUpRight', external: true })}</div>` : ''}
        `,
      )}
      ${sec(1, `<p class="cs-big" data-reveal="up">${esc(p.goal)}</p>`)}
      ${sec(2, `<p class="cs-lead" data-reveal="up">${esc(p.problem)}</p>`, 'cs-sec--tint', 'tint')}
      ${sec(
        3,
        html`
          <p class="cs-lead" data-reveal="up">${esc(p.strategy)}</p>
          ${palette ? `<div class="cs-block" data-reveal="up"><p class="label">Palette</p>${swatches(palette)}</div>` : ''}
          ${p.typefaces ? `<div class="cs-block" data-reveal="up"><p class="label">Tipografia</p>${specimens(p.typefaces)}</div>` : ''}
        `,
      )}
      ${sec(
        4,
        html`
          <ol class="cs-steps">
            ${p.development.map((d, i) => `<li class="cs-step" data-reveal="up" style="--d:${i * 70}ms"><span class="cs-step__n label">${String(i + 1).padStart(2, '0')}</span><h3 class="cs-step__title h4">${esc(d.title)}</h3><p>${esc(d.text)}</p></li>`)}
          </ol>
        `,
      )}
      ${sec(
        5,
        html`
          <p class="cs-big" data-reveal="up">${esc(p.result)}</p>
          <ul class="cs-metrics">
            ${p.metrics.map((m, i) => `<li data-reveal="up" style="--d:${i * 90}ms"><span class="cs-metrics__v">${esc(m.value)}</span><span class="label">${esc(m.label)}</span></li>`)}
          </ul>
        `,
        'cs-sec--ink',
        'ink',
      )}
      ${p.sheets
        ? sec(
            6,
            html`
              ${sheetViewer([{ project: p, sheets: p.sheets }])}
              <p class="label cs-gallery__hint">${icon('expand')} Trascina per spostarti · Ctrl + rotella o due dita per ingrandire · frecce per cambiare tavola · doppio clic per avvicinarti</p>
            `,
            'cs-sec--wide cs-sec--sheets',
            '',
            labelOf(p, 6),
          )
        : sec(
            6,
            html`
              ${p.compare ? compare(p.compare) : ''}
              <div class="cs-gallery cs-gallery--${p.area}">
                ${p.images.map((im, i) => media(im, { zoom: true, group: p.slug, index: i, marks: p.area === 'tecnico', ratio: isWeb ? (i === 0 ? '16/10' : i === 1 ? '3/4' : '9/16') : undefined }))}
              </div>
              <p class="label cs-gallery__hint">${icon('expand')} Seleziona un’immagine per aprirla a tutto schermo · frecce per scorrere · Esc per chiudere</p>
            `,
            'cs-sec--wide',
          )}
      ${sec(
        7,
        html`
          <div class="cs-tech" data-reveal="up">
            <p class="label">${isWeb ? 'Stack e strumenti' : 'Software e strumenti'}</p>
            ${tagList(p.technologies, { className: 'tags--lg' })}
          </div>
          <div class="cs-tech" data-reveal="up">
            <p class="label">Tipologie</p>
            ${tagList(p.types)}
          </div>
        `,
      )}
      ${sec(
        8,
        html`
          <div class="cs-data" data-reveal="up">
            ${dataSheet(p)}
            <div class="cs-data__foot label">
              <span>Codice ${esc(p.code)}</span>
              <span>${p.sample && site.showSampleNotice ? '◇ Progetto dimostrativo' : 'Progetto realizzato'}</span>
              <span>Scheda agg. ${new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>
          <div class="cs-cta" data-reveal="up">
            <p class="h3">Hai un lavoro simile?</p>
            ${button({ href: '/contatti/', label: 'Parliamone', magnetic: true })}
          </div>
        `,
      )}
    </article>

    <a class="cs-next" href="${projectHref(next)}" data-theme="ink" data-cursor="Apri" data-preview="${nextPv.src}" data-preview-ratio="${nextPv.ratio}">
      <div class="container cs-next__inner">
        <p class="label"><span>Progetto successivo</span><span>${esc(next.code)}</span></p>
        <p class="cs-next__title">${esc(next.title)}<span class="cs-next__arrow" aria-hidden="true">${icon('arrow')}</span></p>
        <p class="cs-next__sub serif-i">${esc(next.subtitle)}</p>
      </div>
    </a>
  `
}

export const caseStudyLd = (p, abs) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: p.title,
  headline: `${p.title} — ${p.subtitle}`,
  description: p.summary,
  url: abs(projectHref(p)),
  dateCreated: String(p.year),
  inLanguage: 'it',
  creator: { '@id': abs('/#person') },
  genre: allAreas[p.area].label,
  keywords: [...p.types, ...p.technologies].join(', '),
  locationCreated: { '@type': 'Place', name: p.location },
})
