import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { allAreas, nextOf } from '../../data/projects.js'
import { BRANDS } from '../../art/brand.js'
import { button, media, deviceStage, iphoneSite, iphoneCredit, dataSheet, tagList, icon, splitWords, breadcrumb, sampleMark, figurina } from '../components/ui.js'
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

// Le sezioni di un progetto: con le tavole vere, prima della galleria c'è «Tavole»
// (il visualizzatore dei DWG e dei PDF, solo con `showSheets` acceso in
// projects.js); con le fotografie o con la pagina intera su iPhone si aggiunge una
// sezione subito dopo la galleria.
const sectionsOf = (p) =>
  SECTIONS.flatMap(([id, label]) =>
    id === 'galleria'
      ? [...(p.sheets ? [['tavole', 'Tavole']] : []), [id, label], ...(p.photos ? [['fotografie', 'Fotografie']] : []), ...(p.iphone ? [['iphone', 'iPhone']] : [])]
      : [[id, label]],
  )

// Le figurine delle sezioni dei progetti web (tools/figurine, foglio «computer»).
const WEB_FIGS = { risultato: 'computer-lighthouse', tecnologie: 'computer-stack', dati: 'computer-lancio' }

const sec = (list, id, body, extraClass = '', theme = '', fig = '') => {
  const i = list.findIndex(([key]) => key === id)
  const label = list[i][1]
  const n = String(i + 1).padStart(2, '0')
  return html`
    <section class="cs-sec ${extraClass}" id="${id}" data-spy aria-labelledby="cs-${id}"${theme && ` data-theme="${theme}"`}>
      <div class="container cs-sec__grid">
        <header class="cs-sec__head">
          <p class="cs-sec__n" aria-hidden="true" data-reveal="up">${n}</p>
          <h2 class="cs-sec__label label" id="cs-${id}"><span class="sr-only">${n} — </span>${esc(label)}</h2>
          ${fig && figurina(fig, { className: 'cs-sec__fig' })}
        </header>
        <div class="cs-sec__body">${body}</div>
      </div>
    </section>
  `
}

/** Le fotografie di un progetto, a gruppi, in colonne; si aprono nel lightbox. */
function photoSection(p) {
  let index = 0
  const total = p.photos.groups.reduce((n, g) => n + g.items.length, 0)
  return html`
    <p class="cs-lead" data-reveal="up">${esc(p.photos.lead)}</p>
    ${p.photos.groups.map(
      (g, k) => html`
        <div class="cs-photos__group">
          <h3 class="cs-photos__title"><span class="label">${String(k + 1).padStart(2, '0')}</span>${esc(g.title)}<span class="label">${g.items.length} foto</span></h3>
          <div class="cs-photos">
            ${g.items.map((im) => media(im, { zoom: true, group: `${p.slug}-foto`, index: index++, reveal: 'fade' }))}
          </div>
        </div>
      `,
    )}
    <p class="label cs-gallery__hint">${icon('expand')}<span>${total} fotografie · seleziona una foto per aprirla a tutto schermo · frecce per scorrere · Esc per chiudere</span></p>
  `
}

/** La pagina intera del sito su iPhone 18 Pro, che scorre al passaggio. */
function iphoneSection(p) {
  return html`
    <div class="cs-iphone">
      <figure class="cs-iphone__phone" data-reveal="up">
        ${iphoneSite({ domain: p.web.domain, pages: p.iphone.pages })}
        <figcaption>${iphoneCredit()}</figcaption>
      </figure>
      <div class="cs-iphone__copy">
        <p class="cs-lead" data-reveal="up">${esc(p.iphone.lead)}</p>
        <p class="label cs-gallery__hint cs-iphone__hint" data-reveal="up">${icon('arrowDown')} Passa sopra lo schermo o raggiungilo con Tab: la pagina scorre fino in fondo · sul telefono tocca per avviare, ritocca per tornare in cima</p>
      </div>
    </div>
  `
}

// Titolo del progetto successivo: l'ultima parola e la freccia non si separano
// mai (la freccia da sola su una riga sembrava un errore).
const nextTitle = (title) => {
  const words = esc(title).split(' ')
  const last = words.pop()
  return `${words.join(' ')}${words.length ? ' ' : ''}<span class="cs-next__end">${last}<span class="cs-next__arrow" aria-hidden="true">${icon('arrow')}</span></span>`
}

export function caseStudyPage(p) {
  const area = allAreas[p.area]
  const next = nextOf(p.slug)
  const nextPv = previewOf(next)
  const brand = p.brand && BRANDS[p.brand]
  const palette = brand ? brand.palette : p.web?.palette
  const isWeb = p.area === 'web' && p.web
  const list = sectionsOf(p)
  const section = (id, body, extraClass, theme) => sec(list, id, body, extraClass, theme, isWeb ? WEB_FIGS[id] : '')

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
          ${list.map(([id, label], i) => `<li><a href="#${id}" data-tooltip="${esc(label)}"><span class="label">${String(i + 1).padStart(2, '0')}</span><span class="sr-only"> ${esc(label)}</span></a></li>`)}
        </ol>
      </nav>

      ${section(
        'overview',
        html`
          <p class="cs-lead" data-reveal="up">${esc(p.description)}</p>
          <p data-reveal="up">${esc(p.summary)}</p>
          <div class="cs-services" data-reveal="up">
            <p class="label">Servizi forniti</p>
            <ul class="cs-list">${p.services.map((s, i) => `<li><span class="label">${String(i + 1).padStart(2, '0')}</span>${esc(s)}</li>`)}</ul>
          </div>
          ${isWeb && p.web.url ? `<div data-reveal="up">${button({ href: p.web.url, label: p.web.name ? 'Visita il sito' : `Visita ${p.web.domain}`, variant: 'ghost', iconName: 'arrowUpRight', external: true })}</div>` : ''}
        `,
      )}
      ${section('obiettivo', `<p class="cs-big" data-reveal="up">${esc(p.goal)}</p>`)}
      ${section('problema', `<p class="cs-lead" data-reveal="up">${esc(p.problem)}</p>`, 'cs-sec--tint', 'tint')}
      ${section(
        'strategia',
        html`
          <p class="cs-lead" data-reveal="up">${esc(p.strategy)}</p>
          ${palette ? `<div class="cs-block" data-reveal="up"><p class="label">Palette</p>${swatches(palette)}</div>` : ''}
          ${p.typefaces ? `<div class="cs-block" data-reveal="up"><p class="label">Tipografia</p>${specimens(p.typefaces)}</div>` : ''}
        `,
      )}
      ${section(
        'sviluppo',
        html`
          <ol class="cs-steps">
            ${p.development.map((d, i) => `<li class="cs-step" data-reveal="up" style="--d:${i * 45}ms"><span class="cs-step__n label">${String(i + 1).padStart(2, '0')}</span><h3 class="cs-step__title h4">${esc(d.title)}</h3><p>${esc(d.text)}</p></li>`)}
          </ol>
        `,
      )}
      ${section(
        'risultato',
        html`
          <p class="cs-big" data-reveal="up">${esc(p.result)}</p>
          <ul class="cs-metrics${p.metrics.some((m) => m.value.length > 6) ? ' cs-metrics--fit' : ''}">
            ${p.metrics.map((m, i) => `<li data-reveal="up" style="--d:${i * 55}ms"><span class="cs-metrics__v">${esc(m.value)}</span><span class="label">${esc(m.label)}</span></li>`)}
          </ul>
        `,
        'cs-sec--ink',
        'ink',
      )}
      ${p.sheets
        ? section(
            'tavole',
            html`
              ${sheetViewer([{ project: p, sheets: p.sheets }])}
              <p class="label cs-gallery__hint">${icon('expand')}<span>I disegni veri, non immagini: i DWG e i PDF letti e disegnati dalla scheda grafica · trascina per spostarti · Ctrl + rotella o due dita per ingrandire · frecce per cambiare tavola · doppio clic per avvicinarti</span></p>
            `,
            'cs-sec--wide cs-sec--sheets',
          )
        : ''}
      ${section(
        'galleria',
        html`
          ${p.compare ? compare(p.compare) : ''}
          <div class="cs-gallery cs-gallery--${p.area}">
            ${p.images.map((im, i) => media(im, { zoom: true, group: p.slug, index: i, ratio: isWeb ? (i === 0 ? '16/10' : i === 1 ? '3/4' : '9/16') : undefined }))}
          </div>
          <p class="label cs-gallery__hint">${icon('expand')}<span>${p.images.some((im) => im.ai) ? 'Illustrazioni generate con l’intelligenza artificiale (<a href="/crediti/">crediti</a>) · ' : ''}Seleziona un’immagine per aprirla a tutto schermo · frecce per scorrere · Esc per chiudere</span></p>
        `,
        'cs-sec--wide',
      )}
      ${p.photos ? section('fotografie', photoSection(p), 'cs-sec--wide cs-sec--photos') : ''}
      ${p.iphone ? section('iphone', iphoneSection(p), 'cs-sec--iphone') : ''}
      ${section(
        'tecnologie',
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
      ${section(
        'dati',
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
        <p class="cs-next__title">${nextTitle(next.title)}</p>
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
