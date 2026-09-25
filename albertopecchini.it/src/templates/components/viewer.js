// Visualizzatore delle tavole: l'elenco dei disegni, un piano con zoom e
// spostamento, la riga dati della tavola e il PDF da scaricare.
//
// Lo stesso componente sta nei case study (le tavole di un progetto, dentro la
// pagina) e in /portfolio/tavole/ (tutte le tavole, a tutto schermo).
// Senza JavaScript resta un elenco di miniature che aprono il disegno vettoriale
// nel browser; src/client/viewer.js lo trasforma nello strumento vero.
// Le tavole vengono da `sheets` in src/data/projects.js.

import { html, esc, attrs, cx, pad } from '../html.js'
import { icon } from './ui.js'
import { projectHref } from './project.js'

// larghezza massima sullo schermo, in px CSS: i disegni vettoriali reggono
// ingrandimenti forti, le pagine raster si fermano al doppio della loro misura
const MAX_VECTOR = 16000
const MAX_DWG = 40000 // il DWG si ridisegna nitido a qualunque scala
const isVector = (s) => s.src.endsWith('.svg') || !!s.dwg

const fromLabel = { DWG: 'DWG originale', PDF: 'da PDF', Excel: 'da Excel', Word: 'da Word' }

/** Riga dati di una tavola: numero, scala, formato, file d'origine. */
const metaOf = (s, total) => [`Tav. ${s.n} / ${pad(total)}`, s.scale && `Scala ${s.scale}`, s.paper, fromLabel[s.from] || s.from].filter(Boolean)

const item = (s, p, total) => html`
  <li>
    <a${attrs({
      class: 'viewer__item',
      href: s.src,
      id: s.id,
      'data-viewer-go': s.id,
      'data-src': s.src,
      'data-thumb': s.thumb,
      'data-w': s.width,
      'data-h': s.height,
      'data-max': s.dwg ? MAX_DWG : isVector(s) ? MAX_VECTOR : s.width * 4,
      'data-dwg': s.dwg,
      'data-box': s.box && s.box.join(','),
      'data-darken': s.darken ? '1' : null,
      'data-paper': s.dwg ? s.paper : null,
      'data-title': s.title,
      'data-alt': s.alt,
      'data-note': s.note,
      'data-meta': metaOf(s, total).join('|'),
      'data-pdf': s.pdf,
      'data-project': p.title,
      'data-href': projectHref(p),
    })}>
      <span class="viewer__mini" style="--ratio:${s.width}/${s.height}"><img src="${s.mini}" width="320" height="${Math.round((320 * s.height) / s.width)}" alt="" loading="lazy" decoding="async"></span>
      <span class="viewer__item-n label">${esc(s.n)}</span>
      <span class="viewer__item-title">${esc(s.title)}</span>
    </a>
  </li>
`

/**
 * @param {{project: object, sheets: object[]}[]} groups tavole raggruppate per progetto
 * @param {{page?: boolean, label?: string, lead?: string}} options
 *   `page`: versione a tutto schermo di /portfolio/tavole/ (titolo e gruppi nel pannello)
 */
export function sheetViewer(groups, { page = false, label = 'Tavole', lead } = {}) {
  const first = groups[0].sheets[0]
  const firstProject = groups[0].project
  const total = (g) => g.sheets.length
  const meta = metaOf(first, total(groups[0]))
  const minus = icon('minus')

  return html`
    <section class="${cx('viewer', page && 'viewer--page')}" data-viewer${page ? ' data-viewer-page' : ''} aria-label="${esc(page ? 'Visualizzatore delle tavole' : `Tavole di ${firstProject.title}`)}">
      <div class="viewer__stage" data-viewer-stage tabindex="0" role="region" aria-roledescription="visualizzatore" aria-label="Tavola: trascina per spostarti, Ctrl e rotella o due dita per ingrandire, frecce per cambiare tavola">
        <div class="viewer__sheet" data-viewer-sheet style="--ratio:${first.width}/${first.height}">
          <img class="viewer__img viewer__img--thumb" src="${first.thumb}" width="${first.width}" height="${first.height}" alt="${esc(first.alt)}" decoding="async" data-viewer-thumb>
        </div>
        <p class="viewer__status label" data-viewer-status aria-live="polite" hidden></p>
        <p class="viewer__hint label" data-viewer-hint aria-hidden="true">Ctrl + rotella per ingrandire</p>
      </div>

      <div class="viewer__panel">
        ${page &&
        html`
          <div class="viewer__head">
            <h1 class="viewer__h1">${esc(label)}</h1>
            ${lead && `<p class="viewer__lead">${esc(lead)}</p>`}
          </div>
        `}
        <nav class="viewer__list" aria-label="Elenco delle tavole" data-viewer-list>
          ${groups.map(
            (g) => html`
              <div class="viewer__group">
                ${page && `<p class="viewer__group-title"><span class="label">${esc(g.project.code)}</span><a href="${projectHref(g.project)}">${esc(g.project.title)}</a></p>`}
                <ol>${g.sheets.map((s) => item(s, g.project, total(g)))}</ol>
              </div>
            `,
          )}
        </nav>
      </div>

      <div class="viewer__info">
        <p class="viewer__meta label" data-viewer-meta>${meta.map((m) => `<span>${esc(m)}</span>`)}</p>
        <p class="viewer__title" data-viewer-title>${page ? `<span class="viewer__project" data-viewer-project>${esc(firstProject.title)}</span>` : ''}<span data-viewer-name>${esc(first.title)}</span></p>
        <p class="viewer__note" data-viewer-note>${esc(first.note)}</p>
        <p class="viewer__links">
          <a class="viewer__link" href="${first.pdf || first.src}" data-viewer-pdf${first.pdf ? ' download' : ''}${first.pdf ? '' : ' hidden'}>${icon('download')}<span>Scarica il PDF</span></a>
          ${page
            ? `<a class="viewer__link" href="${projectHref(firstProject)}" data-viewer-case>${icon('arrowUpRight')}<span>Scheda del progetto</span></a>`
            : `<a class="viewer__link" href="/portfolio/tavole/#${first.id}" data-viewer-all>${icon('arrowUpRight')}<span>Tutte le tavole</span></a>`}
        </p>
      </div>

      <div class="viewer__tools" role="group" aria-label="Strumenti del visualizzatore">
        <button class="viewer__tool" type="button" data-viewer-prev aria-label="Tavola precedente">${icon('arrowLeft')}</button>
        <span class="viewer__tool viewer__count label" data-viewer-count aria-hidden="true">${pad(1)} / ${pad(total(groups[0]))}</span>
        <button class="viewer__tool" type="button" data-viewer-next aria-label="Tavola successiva">${icon('arrow')}</button>
        <button class="viewer__tool" type="button" data-viewer-out aria-label="Riduci">${minus}</button>
        <button class="viewer__tool viewer__zoom" type="button" data-viewer-zoom aria-label="Adatta la tavola allo schermo">100%</button>
        <button class="viewer__tool" type="button" data-viewer-in aria-label="Ingrandisci">${icon('plus')}</button>
        <button class="viewer__tool" type="button" data-viewer-full aria-label="Schermo intero" aria-pressed="false">${icon('expand')}</button>
      </div>
    </section>
  `
}
