import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { projects, categories, areas, byArea, years, sectors, technologies, types, bySlug } from '../../data/projects.js'
import { BRANDS } from '../../art/brand.js'
import { button, textLink, media, deviceStage, dataSheet, tagList, icon, splitWords, breadcrumb, sampleMark } from '../components/ui.js'
import { projectCard, projectHref, filterAttrs } from '../components/project.js'

// Ritmo della griglia: larghezze in dodicesimi, ripetute ogni sei card.
export const SPAN_PATTERN = [7, 5, 4, 4, 4, 5, 7, 6, 6]

const count = (n) => String(n).padStart(2, '0')

const sampleLegend = () =>
  site.showSampleNotice && projects.some((p) => p.sample)
    ? `<p class="legend label"><span class="sample" aria-hidden="true">◇</span> I progetti contrassegnati sono dimostrativi: mostrano come presento un lavoro di quel tipo.</p>`
    : ''

function pageHead({ crumbs, index, label, title, accent = [], lead, meta }) {
  return html`
    <header class="phead">
      <div class="container">
        ${breadcrumb(crumbs)}
        <div class="phead__top label" data-reveal="fade"><span><span class="sec-head__index">${index}</span>${esc(label)}</span><span>${esc(meta)}</span></div>
        <h1 class="phead__title" data-reveal="words">${splitWords(title, { accent })}</h1>
        <div class="rule rule--ticks" aria-hidden="true"></div>
        <p class="phead__lead lead" data-reveal="up">${esc(lead)}</p>
      </div>
    </header>
  `
}

// ── /portfolio/ — indice completo con filtri ─────────────────────────────────

const select = (name, label, options) => html`
  <label class="fselect">
    <span class="label">${esc(label)}</span>
    <select name="${name}" data-filter-select="${name}">
      <option value="">Tutti</option>
      ${options.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)}
    </select>
    ${icon('plus')}
  </label>
`

export function portfolioPage() {
  const catCount = (key) => projects.filter((p) => p.categories.includes(key)).length
  return html`
    ${pageHead({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Portfolio', href: '/portfolio/' }],
      index: '00',
      label: 'Portfolio',
      title: 'Tutto il lavoro, in un indice.',
      accent: ['indice.'],
      lead: 'Rilievi, pratiche e modelli. Siti web. Marchi e stampati. Filtra per categoria, anno, settore, tecnologia o tipologia: ogni progetto apre il proprio case study.',
      meta: `${count(projects.length)} progetti · ${years().at(-1)} — ${years()[0]}`,
    })}

    <section class="pf" data-filters aria-label="Progetti">
      <div class="pf__bar" data-filter-bar>
        <div class="container pf__bar-inner">
          <div class="pf__cats" role="group" aria-label="Filtra per categoria">
            <button class="chip is-active" type="button" data-filter-cat="" aria-pressed="true">Tutti<sup>${count(projects.length)}</sup></button>
            ${categories.map((c) => `<button class="chip" type="button" data-filter-cat="${c.key}" aria-pressed="false">${esc(c.label)}<sup>${count(catCount(c.key))}</sup></button>`)}
          </div>
          <div class="pf__more">
            <button class="pf__toggle label" type="button" aria-expanded="false" aria-controls="pf-advanced" data-filter-advanced>${icon('plus')}<span>Altri filtri</span><span class="pf__badge" data-filter-badge hidden>0</span></button>
            <div class="pf__view" role="group" aria-label="Visualizzazione">
              <button class="pf__viewbtn is-active" type="button" data-view="grid" aria-pressed="true" aria-label="Griglia" data-tooltip="Griglia">${icon('grid')}</button>
              <button class="pf__viewbtn" type="button" data-view="list" aria-pressed="false" aria-label="Elenco" data-tooltip="Elenco">${icon('list')}</button>
            </div>
          </div>
          <div class="pf__advanced" id="pf-advanced" hidden>
            ${select('year', 'Anno', years())}
            ${select('sector', 'Settore', sectors())}
            ${select('tech', 'Tecnologia', technologies())}
            ${select('type', 'Tipologia', types())}
          </div>
        </div>
      </div>

      <div class="container">
        <div class="pf__status label">
          <p aria-live="polite" aria-atomic="true"><span data-filter-count>${count(projects.length)}</span> <span data-filter-noun>progetti</span><span data-filter-summary></span></p>
          <button class="pf__reset link" type="button" data-filter-reset hidden><span class="link__label">Azzera i filtri</span>${icon('close')}</button>
        </div>

        <div class="pf__grid" data-filter-grid data-view="grid">
          ${projects.map((p, i) => projectCard(p, { span: SPAN_PATTERN[i % SPAN_PATTERN.length], lazy: i > 1, headingLevel: 2, preview: true }))}
        </div>

        <div class="pf__empty" data-filter-empty hidden>
          <p class="h3">Nessun progetto con questa combinazione.</p>
          <p>Prova a togliere un filtro: il portfolio cresce un progetto alla volta.</p>
          ${button({ label: 'Azzera i filtri', variant: 'ghost', iconName: 'close', attrs: { 'data-filter-reset': true } })}
        </div>

        ${sampleLegend()}
      </div>
    </section>

    ${areaLinks()}
  `
}

function areaLinks(current) {
  return html`
    <section class="section alinks">
      <div class="container">
        <p class="label alinks__label">Esplora per area</p>
        <ul class="alinks__list">
          ${Object.entries(areas)
            .filter(([key]) => key !== current)
            .map(([key, a]) => `<li><a class="alinks__link" href="${a.href}" data-cursor="Vai"><span class="label">${count(byArea(key).length)} progetti</span><span class="alinks__name">${esc(a.label)}</span>${icon('arrowUpRight')}</a></li>`)}
          ${current ? `<li><a class="alinks__link" href="/portfolio/" data-cursor="Vai"><span class="label">${count(projects.length)} progetti</span><span class="alinks__name">Portfolio completo</span>${icon('arrowUpRight')}</a></li>` : ''}
        </ul>
      </div>
    </section>
  `
}

// ── /portfolio/tecnico/ ──────────────────────────────────────────────────────

export function tecnicoPage() {
  const list = byArea('tecnico')
  const allTypes = types(list)
  const showcase = bySlug('recupero-annesso-rustico')
  return html`
    ${pageHead({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Portfolio', href: '/portfolio/' }, { label: 'Tecnico', href: '/portfolio/tecnico/' }],
      index: 'A',
      label: 'Progetti tecnici',
      title: 'Misurato, disegnato, depositato.',
      accent: ['depositato.'],
      lead: 'Rilievi, progetti, pratiche edilizie e catastali, modelli 3D e BIM, cantieri. Ogni scheda riporta committente, luogo, strumenti e risultato: come un cartiglio.',
      meta: `${count(list.length)} progetti · ${count(allTypes.length)} tipologie`,
    })}

    <section class="tec" data-filters>
      <div class="container">
        <div class="tec__index">
          <p class="label">Indice delle tipologie — seleziona per filtrare</p>
          <div class="tec__types" role="group" aria-label="Filtra per tipologia">
            <button class="chip chip--sm is-active" type="button" data-filter-type="" aria-pressed="true">Tutte</button>
            ${allTypes.map((t) => `<button class="chip chip--sm" type="button" data-filter-type="${esc(t)}" aria-pressed="false">${esc(t)}</button>`)}
          </div>
          <p class="label tec__status" aria-live="polite"><span data-filter-count>${count(list.length)}</span> <span data-filter-noun>progetti</span></p>
        </div>

        <div class="tec__list" data-filter-grid>
          ${list.map(
            (p, i) => html`
              <article class="tsheet"${filterAttrs(p)}${i % 2 ? ' data-flip' : ''}>
                <div class="tsheet__media">
                  <a href="${projectHref(p)}" data-cursor="Apri" aria-label="${esc(p.title)} — apri il case study" tabindex="-1">
                    ${media(p.cover, { ratio: '4/3', marks: true, caption: null, lazy: i > 0 })}
                  </a>
                </div>
                <div class="tsheet__body">
                  <p class="label tsheet__code"><span>${esc(p.code)}</span><span>TAV. ${count(i + 1)} / ${count(list.length)}</span></p>
                  <h2 class="tsheet__title h3"><a href="${projectHref(p)}">${esc(p.title)}</a>${sampleMark(p)}</h2>
                  <p class="tsheet__sum">${esc(p.summary)}</p>
                  ${dataSheet(p, { compact: true })}
                  <p class="tsheet__result"><span class="label">Risultato</span>${esc(p.result)}</p>
                  ${textLink({ href: projectHref(p), label: 'Apri il case study' })}
                </div>
              </article>
            `,
          )}
        </div>
        <div class="pf__empty" data-filter-empty hidden><p class="h3">Nessun progetto per questa tipologia.</p></div>
      </div>
    </section>

    <section class="section cmp-sec" data-theme="tint">
      <div class="container cmp-sec__grid">
        <div class="cmp-sec__copy">
          <p class="label"><span class="sec-head__index">±</span>Prima / dopo</p>
          <h2 class="h2" data-reveal="words">${splitWords('Lo stesso fronte, due stati.', { accent: ['due', 'stati.'] })}</h2>
          <p class="lead" data-reveal="up">Trascina il cursore per confrontare lo stato di fatto con il progetto di recupero dell’annesso rustico. Stessa geometria, stesse quote: cambia solo ciò che l’intervento ha toccato.</p>
          ${textLink({ href: projectHref(showcase), label: 'Il progetto completo' })}
        </div>
        ${compare(showcase.compare)}
      </div>
    </section>

    ${sampleLegendSection()}
    ${areaLinks('tecnico')}
  `
}

const sampleLegendSection = () => (sampleLegend() ? `<div class="container">${sampleLegend()}</div>` : '')

/** Confronto prima/dopo con cursore trascinabile (accessibile da tastiera). */
export function compare(c) {
  if (!c) return ''
  return html`
    <figure class="cmp" data-compare style="--pos:50%" data-reveal="up">
      <div class="cmp__frame">
        <div class="cmp__layer cmp__layer--after">${media(c.after, { ratio: '4/3', reveal: null, caption: null })}</div>
        <div class="cmp__layer cmp__layer--before" aria-hidden="true">${media(c.before, { ratio: '4/3', reveal: null, caption: null })}</div>
        <span class="cmp__tag cmp__tag--before label">${esc(c.labelBefore)}</span>
        <span class="cmp__tag cmp__tag--after label">${esc(c.labelAfter)}</span>
        <div class="cmp__handle" aria-hidden="true"><span>${icon('arrowLeft')}${icon('arrow')}</span></div>
        <input class="cmp__range" type="range" min="0" max="100" value="50" step="1" aria-label="Confronto tra ${esc(c.labelBefore.toLowerCase())} e ${esc(c.labelAfter.toLowerCase())}: sposta per rivelare" data-cursor="Trascina">
      </div>
      <figcaption class="label media__caption">${esc(c.labelBefore)} ↔ ${esc(c.labelAfter)} — ${esc(c.before.alt)}</figcaption>
    </figure>
  `
}

// ── /portfolio/web/ ──────────────────────────────────────────────────────────

export function webPage() {
  const list = byArea('web')
  return html`
    <div data-theme="ink" class="webp">
      ${pageHead({
        crumbs: [{ label: 'Home', href: '/' }, { label: 'Portfolio', href: '/portfolio/' }, { label: 'Web', href: '/portfolio/web/' }],
        index: 'B',
        label: 'Progetti web',
        title: 'Siti che si caricano, si leggono, si aggiornano.',
        accent: ['aggiornano.'],
        lead: 'Ogni progetto parte da un problema concreto e finisce online: qui trovi obiettivo, soluzione, tecnologie e — quando il sito è pubblico — il link per provarlo.',
        meta: `${count(list.length)} progetti · ${count(list.filter((p) => p.web?.url).length)} online`,
      })}

      <section class="webl">
        ${list.map(
          (p, i) => html`
            <article class="wproj" id="${p.slug}">
              <div class="container wproj__grid">
                <div class="wproj__stage" data-reveal="up">${deviceStage(p, { lazy: i > 0 })}</div>
                <div class="wproj__info">
                  <p class="label wproj__meta"><span>${count(i + 1)} / ${count(list.length)}</span><span>${esc(p.code)}</span><span>${p.year}</span></p>
                  <h2 class="wproj__title h1"><a href="${projectHref(p)}">${esc(p.title)}</a>${sampleMark(p)}</h2>
                  <p class="wproj__sub lead">${esc(p.subtitle)}</p>
                  <dl class="wproj__facts">
                    <div><dt class="label">Cliente</dt><dd>${esc(p.client)}</dd></div>
                    <div><dt class="label">Settore</dt><dd>${esc(p.sector)}</dd></div>
                    <div class="wproj__wide"><dt class="label">Obiettivo</dt><dd>${esc(p.goal)}</dd></div>
                    <div class="wproj__wide"><dt class="label">Soluzione</dt><dd>${esc(p.strategy)}</dd></div>
                  </dl>
                  ${tagList(p.technologies)}
                  <div class="wproj__actions">
                    ${button({ href: projectHref(p), label: 'Case study', variant: 'light' })}
                    ${p.web.url ? button({ href: p.web.url, label: 'Visita il sito', variant: 'ghost', iconName: 'arrowUpRight', external: true }) : `<span class="label wproj__offline">Sito dimostrativo · non online</span>`}
                  </div>
                </div>
              </div>
            </article>
          `,
        )}
      </section>
      ${sampleLegendSection()}
    </div>
    ${areaLinks('web')}
  `
}

// ── /portfolio/grafica/ ──────────────────────────────────────────────────────

export const swatches = (palette) => html`
  <ul class="swatches" aria-label="Palette">
    ${palette.map((c) => {
      const hex = typeof c === 'string' ? c : c.hex
      const name = typeof c === 'string' ? '' : c.name
      return `<li><button class="swatch" type="button" style="--c:${hex}" data-copy="${hex}" data-tooltip="Copia ${hex}" aria-label="Copia il colore ${esc(name || hex)} ${hex}"><span class="swatch__chip"></span><span class="swatch__name">${esc(name)}</span><span class="swatch__hex label">${hex}</span></button></li>`
    })}
  </ul>
`

export const specimens = (faces) => html`
  <ul class="specimens">
    ${faces.map((f) => `<li class="specimen"><span class="specimen__sample" style="${esc(f.style)}" aria-hidden="true">${esc(f.sample)}</span><span class="specimen__meta"><span>${esc(f.name)}</span><span class="label">${esc(f.role)}</span></span></li>`)}
  </ul>
`

export function graficaPage() {
  const list = byArea('grafica')
  const allTypes = types(list)
  return html`
    ${pageHead({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Portfolio', href: '/portfolio/' }, { label: 'Grafica', href: '/portfolio/grafica/' }],
      index: 'C',
      label: 'Progetti grafici',
      title: 'Marchi costruiti, non decorati.',
      accent: ['costruiti,'],
      lead: 'Identità visive, restyling, manifesti, packaging, segnaletica, modelli. Ogni marchio ha una griglia dichiarata, ogni sistema un manuale breve.',
      meta: `${count(list.length)} progetti · ${count(allTypes.length)} tipologie`,
    })}

    <section class="gra">
      <div class="container">
        <ul class="gra__types label" aria-label="Tipologie presenti">${allTypes.map((t) => `<li>${esc(t)}</li>`)}</ul>
      </div>
      ${list.map((p, i) => {
        const brand = p.brand && BRANDS[p.brand]
        const [first, ...rest] = p.images
        return html`
          <article class="gproj gproj--${i % 2 ? 'b' : 'a'}">
            <div class="container gproj__grid">
              <header class="gproj__head">
                <p class="gproj__n" aria-hidden="true">${count(i + 1)}</p>
                <div>
                  <p class="label"><span>${esc(p.code)}</span> · <span>${esc(p.categories.includes('branding') ? 'Branding' : 'Grafica')}</span> · <span>${p.year}</span></p>
                  <h2 class="gproj__title"><a href="${projectHref(p)}">${esc(p.title)}</a>${sampleMark(p)}</h2>
                  <p class="gproj__sub serif-i">${esc(p.subtitle)}</p>
                </div>
              </header>
              <a class="gproj__cover" href="${projectHref(p)}" data-cursor="Apri" aria-label="${esc(p.title)} — apri il case study" tabindex="-1">${media(first, { ratio: '16/10', caption: null, parallax: true, lazy: i > 0 })}</a>
              <div class="gproj__text">
                <p class="lead">${esc(p.summary)}</p>
                ${tagList(p.types, { max: 6 })}
                ${textLink({ href: projectHref(p), label: 'Apri il case study' })}
              </div>
              <div class="gproj__system">
                ${brand ? html`<div class="gproj__block"><p class="label">Palette</p>${swatches(brand.palette)}</div>` : ''}
                ${p.typefaces ? html`<div class="gproj__block"><p class="label">Tipografia</p>${specimens(p.typefaces)}</div>` : ''}
                ${!brand && !p.typefaces ? dataSheet(p, { compact: true }) : ''}
              </div>
              <div class="gproj__mosaic">
                ${rest.slice(0, 3).map((im, k) => media(im, { ratio: k === 0 ? '4/3' : '1/1', zoom: true, group: p.slug, index: k + 1, caption: im.caption }))}
              </div>
            </div>
          </article>
        `
      })}
      ${sampleLegendSection()}
    </section>
    ${areaLinks('grafica')}
  `
}
