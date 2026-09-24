// Pagina /stile/: il sistema visivo del sito su un piano navigabile, come in
// un programma di disegno — cinque tavole a 1440 px (home, colore, tipografia,
// forma e movimento, componenti). Le tavole usano gli stessi componenti e gli
// stessi token del sito; zoom e spostamento stanno in src/client/canvas.js.
// I contenuti (palette, scala, spazi…) vengono da src/data/stile.js.

import { html, esc, cx, pad } from '../html.js'
import { site, nav, cta, stats, closing } from '../../data/site.js'
import { projects, byArea, allAreas } from '../../data/projects.js'
import * as S from '../../data/stile.js'
import { logo, button, textLink, tagList, picture, icon } from '../components/ui.js'
import { COORDS } from '../layout.js'

const em = (word) => `<em class="serif-i">${esc(word)}</em>`
const marks = '<span class="mark mark--tl" aria-hidden="true"></span><span class="mark mark--tr" aria-hidden="true"></span><span class="mark mark--bl" aria-hidden="true"></span><span class="mark mark--br" aria-hidden="true"></span>'

/** Titolo con le parole d'accento in corsivo graziato (come il footer). */
const accented = (text, accent = []) =>
  text
    .split(' ')
    .map((w) => (accent.includes(w.replace(/[.,;:!?]/g, '')) ? em(w) : esc(w)))
    .join(' ')

// ── Pezzi comuni alle tavole del sistema ─────────────────────────────────────

const head = (b, mid, right) => html`
  <div class="bd-head label" data-bd="fade"><span><span class="bd-idx">${b.index}</span>${esc(b.title)}</span><span>${esc(mid)}</span><span>${esc(right)}</span></div>
`

const intro = (titleHtml, text) => html`
  <div class="bd-intro">
    <h3 class="bd-h2" data-bd="up">${titleHtml}</h3>
    <p class="bd-intro__text" data-bd="up" style="--d:120ms">${esc(text)}</p>
  </div>
`

const sub = (left, right, { top = false, muted = false, plain = false } = {}) =>
  `<div class="${cx('bd-sub label', top && 'bd-sub--top', muted && 'bd-sub--muted', plain && 'bd-sub--plain')}"><span class="bd-sub__l">${left}</span><span>${right}</span></div>`

const board = (b, content) => html`
  <article class="board" id="tavola-${b.key}" data-board="${b.key}" style="--x:${b.x}px;--y:${b.y}px;--w:${b.w}px;--h:${b.h}px" aria-labelledby="tavola-${b.key}-nome">
    <h2 class="board__name label" id="tavola-${b.key}-nome"><span>${esc(b.title)}</span><span aria-hidden="true">${b.w} × ${b.h}</span></h2>
    <span class="board__ring" aria-hidden="true"></span>
    <div class="board__frame" data-theme="paper">${content}</div>
  </article>
`

// ── 00 · Home: l'hero a 1440 px ──────────────────────────────────────────────

function heroBoard(b) {
  return board(
    b,
    html`
      <div class="bd-hero">
        <div class="bd-hero__lines" aria-hidden="true"><i style="--x:0"></i><i style="--x:25%"></i><i style="--x:70%"></i><i style="--x:100%"></i></div>
        <header class="bd-hero__bar">
          ${logo()}
          <nav class="bd-nav" aria-label="Navigazione principale (esempio)">
            <ul>
              ${nav.map((item, i) => `<li><a href="${item.href}"><span class="bd-nav__n">${pad(i + 1)}</span>${esc(item.label)}</a>${item.children ? `<span class="bd-nav__plus" aria-hidden="true">${icon('plus')}</span>` : ''}</li>`)}
            </ul>
          </nav>
          ${button({ href: cta.href, label: cta.label, size: 'sm' })}
        </header>
        <div class="bd-hero__main">
          <div class="bd-hero__meta label" data-bd="fade"><span>${esc(site.edition)}</span><span>${esc(site.location.city)} — Italia</span><span>${COORDS}</span></div>
          <p class="bd-hero__name" aria-hidden="true"><span class="bd-hero__word"><span>${esc(site.firstName)}</span></span> <span class="bd-hero__word bd-hero__word--2"><span>${esc(site.lastName)}</span></span></p>
          <p class="sr-only">${esc(site.name)}</p>
          <div class="rule rule--ticks bd-hero__rule" data-bd="line" style="--d:200ms" aria-hidden="true"></div>
          <div class="bd-hero__body">
            <div class="bd-hero__roles" data-bd="up" style="--d:250ms">
              <p class="label">Discipline</p>
              <ul>
                ${site.roles.map((r, i) => `<li><button class="bd-hero__role${i === 0 ? ' is-active' : ''}" type="button" aria-pressed="${i === 0}"><span class="label">0${i + 1}</span><span class="bd-hero__role-name">${esc(r.label)}</span><span class="label">${esc(r.note)}</span></button></li>`)}
              </ul>
            </div>
            <figure class="bd-hero__figure" data-bd="clip" style="--d:150ms">
              <div class="bd-hero__stage">
                <div class="bd-hero__frame" data-clip>${picture({ art: 'floorplan', variant: 'casa', code: 'AP-26-004', alt: 'Pianta architettonica quotata di un’abitazione, scala 1:100' }, { lazy: false })}</div>
                ${marks}
              </div>
              <figcaption class="bd-hero__caption label"><span>Fig. 01 — Pianta piano terra · scala 1:100</span><span class="bd-hero__ticks" aria-hidden="true"><i class="is-active"></i><i></i><i></i></span></figcaption>
            </figure>
            <div class="bd-hero__pitch">
              <p class="bd-hero__claim" data-bd="up" style="--d:300ms">Progetto ${em('spazi,')} strumenti e ${em('identità')} digitali.</p>
              <p class="bd-hero__lead" data-bd="up" style="--d:380ms">Diplomato geometra, in provincia di Mantova. Rilevo e disegno edifici, sviluppo siti web, costruisco marchi: con lo stesso metodo e la stessa tolleranza.</p>
              <div class="bd-hero__actions" data-bd="up" style="--d:460ms">${button({ href: '/portfolio/', label: 'Guarda i progetti' })}${button({ href: cta.href, label: cta.label, variant: 'ghost' })}</div>
            </div>
          </div>
          <div class="bd-hero__foot label" data-bd="fade" style="--d:600ms">
            <span class="bd-hero__avail"><span class="dot dot--live" aria-hidden="true"></span>${esc(site.availability.label)}</span>
            <span class="bd-hero__cue"><span class="bd-hero__cue-line" aria-hidden="true"></span>Scorri</span>
            <span>Attivo dal ${site.activeSince}</span>
          </div>
        </div>
      </div>
    `,
  )
}

// ── 01 · Colore ──────────────────────────────────────────────────────────────

function coloreBoard(b) {
  return board(
    b,
    html`
      <div class="bd">
        ${head(b, 'Carta · Inchiostro · Minio', '10 token + ruoli semantici')}
        ${intro(`Carta, inchiostro, ${em('minio')}.`, 'Due neutri caldi, da tavolo da disegno, e un solo colore. Il minio segna ciò che si muove o è attivo — riempimento al passaggio, avanzamento, selezione — e non decora.')}
        <div class="bd-swatches">
          ${S.palette.map(
            (c, i) => html`
              <div class="bd-swatch">
                <div class="bd-swatch__chip" style="--c:${c.hex};--i:${i}" aria-hidden="true"></div>
                <div class="bd-swatch__row"><span class="bd-name">${esc(c.name)}</span><span class="bd-swatch__hex">${c.hex}</span></div>
                <p class="bd-cap bd-swatch__token">${c.token}</p>
                <p class="bd-note bd-swatch__use">${esc(c.use)}</p>
              </div>
            `,
          )}
        </div>
        ${sub('Ruoli semantici', 'Il tema scuro si applica a sezioni intere, mai a singoli elementi', { top: true, muted: true })}
        <div class="bd-themes">
          ${S.themes.map(
            (t) => html`
              <div class="bd-theme" data-theme="${t.key}">
                <div class="bd-theme__top label"><span>${esc(t.title)}</span><span>${esc(t.attr)}</span></div>
                <div class="bd-theme__rows">
                  ${t.rows.map(
                    (r) =>
                      `<div class="bd-theme__row">${
                        r.line
                          ? `<span class="bd-theme__line" style="--l1:${r.line[0]};--l2:${r.line[1]}" aria-hidden="true"></span>`
                          : `<span class="${cx('bd-theme__chip', r.border && 'bd-theme__chip--border')}" style="--c:${r.color}" aria-hidden="true"></span>`
                      }<span>${r.token}</span><span>${esc(r.name)}</span></div>`,
                  )}
                </div>
                <div class="bd-theme__demo">
                  <span class="btn" style="--btn-bg:${t.accent};--btn-fg:var(--c-ink)"><span class="btn__label">Inchiostro su minio</span><span class="btn__icon">${icon('arrow')}</span></span>
                  <span class="label">${esc(t.contrast)}</span>
                </div>
              </div>
            `,
          )}
        </div>
        <div class="bd-colore__foot">
          <p class="bd-note">${esc(S.colorNotes.foot)}</p>
          <p class="bd-colore__status label"><span class="dot" aria-hidden="true"></span>${esc(S.colorNotes.status)}</p>
        </div>
      </div>
    `,
  )
}

// ── 02 · Tipografia ──────────────────────────────────────────────────────────

function tipografiaBoard(b) {
  return board(
    b,
    html`
      <div class="bd">
        ${head(b, 'Archivo · Instrument Serif · IBM Plex Mono', 'Ospitati in locale, nessuna richiesta a terzi')}
        ${intro(`Un grottesco che si ${em('stringe')}, un corsivo per l’accento.`, 'Archivo è variabile su peso e larghezza: i titoli stanno a 560 e al 94%, il nome in copertina all’86%. Il corsivo graziato entra una parola per titolo. Il mono misura: etichette, bottoni, dati.')}
        <div class="bd-types">
          ${S.typefaces.map(
            (t) => html`
              <div class="bd-type">
                <div class="bd-type__top label"><span>${esc(t.name)}</span><span>${esc(t.axis)}</span></div>
                <p class="bd-type__glyph bd-type__glyph--${t.key}" aria-hidden="true">Aa</p>
                <p class="bd-type__alpha bd-type__alpha--${t.key}">${esc(t.alphabet)}</p>
                <p class="bd-note bd-type__note">${esc(t.note)}</p>
              </div>
            `,
          )}
        </div>
        ${sub('Asse della larghezza · wdth', 'Archivo 540–600', { top: true, muted: true })}
        <div class="bd-widths">
          ${S.widths.map((w) => `<div><p class="bd-width__sample" style="--wght:${w.weight};--wdth:${w.pct};--track:${w.track}">Metodo</p><p class="bd-width__cap label"><b>${w.pct}</b> · ${esc(w.use)}</p></div>`)}
        </div>
        ${sub('Scala fluida · clamp()', 'Valori a 1440 px · minimo → massimo', { top: true, muted: true })}
        <div class="bd-scale">
          ${S.scale.map(
            (r) =>
              `<div class="bd-scale__row"><span class="bd-scale__token">${r.token}</span><span class="bd-cap">${esc(r.meta)}</span><span class="${r.style === 'label' ? 'label' : `bd-scale__s bd-scale__s--${r.style}`}">${r.accent ? accented(r.sample, [r.accent]) : esc(r.sample)}</span></div>`,
          )}
        </div>
      </div>
    `,
  )
}

// ── 03 · Forma e movimento ───────────────────────────────────────────────────

// La curva di cubic-bezier(x1, y1, x2, y2) disegnata in un riquadro 100×100
// con origine in (10, 110): i punti di controllo sono i due parametri.
const curvePath = (bezier) => {
  const [x1, y1, x2, y2] = bezier.split(',').map(Number)
  return `M10 110C${10 + 100 * x1} ${110 - 100 * y1} ${10 + 100 * x2} ${110 - 100 * y2} 110 10`
}

function formaBoard(b) {
  return board(
    b,
    html`
      <div class="bd">
        ${head(b, 'Base 4 px · raggi minimi · ingressi lenti', 'Mobile-first · 480 / 768 / 1024 / 1280 / 1600')}
        ${intro(`Un linguaggio ${em('ortogonale')}, preso dal tavolo da disegno.`, 'Griglia a 12 colonne, margini che crescono con lo schermo, raggi da 2 px. Fili, righelli e crocini di registro fanno parte del sistema, non della decorazione.')}
        <div class="bd-forma__grid">
          <div>
            ${sub('Spazi', '--sp-1 … --sp-10')}
            <div class="bd-spaces">
              <div>
                ${S.spaces.map(([t, px], i) => `<div class="bd-sp"><span>${t}</span><span>${px}</span><span class="bd-sp__bar" style="--w:${px}px;--i:${i}" aria-hidden="true"></span></div>`)}
              </div>
              <div>
                ${S.layoutTokens.map(([t, v, d]) => `<div class="bd-sp bd-lt"><span>${t}</span><span>${v}</span><span>${esc(d)}</span></div>`)}
                <p class="label bd-grid12__label">Griglia · 12 colonne</p>
                <div class="bd-grid12" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<span style="--i:${i}"></span>`)}</div>
              </div>
            </div>
          </div>
          <div>
            ${sub('Raggi', '--r-0 … --r-full')}
            <div class="bd-radii">
              ${S.radii.map(
                (r, i) =>
                  `<div>${r.pill ? `<div class="bd-radius__pill"><span style="--i:${i}"></span></div>` : `<div class="bd-radius__box" style="--r:${r.px}px;--i:${i}"></div>`}<p class="bd-radius__cap bd-cap">${r.token} <span>· ${esc(r.use)}</span></p></div>`,
              )}
            </div>
          </div>
        </div>
        ${sub('Elementi grafici ricorrenti', '.rule · .rule--ticks · .mark · .dot--live', { top: true, muted: true })}
        <div class="bd-els">
          <div><div class="bd-el__box"><div class="bd-el__rule" aria-hidden="true"></div></div><p class="bd-el__name">Filo</p><p class="bd-note bd-el__note">1 px, si stende da sinistra all’ingresso.</p></div>
          <div><div class="bd-el__box"><div class="rule rule--ticks bd-el__ticks" aria-hidden="true"></div></div><p class="bd-el__name">Righello</p><p class="bd-note bd-el__note">Tacche ogni 8 px, più lunghe ogni 40.</p></div>
          <div><div class="bd-el__box"><div class="bd-el__marks">${marks}</div></div><p class="bd-el__name">Crocini di registro</p><p class="bd-note bd-el__note">Agli angoli di immagini e tavole, al 70%.</p></div>
          <div><div class="bd-el__box label"><span class="dot dot--live" aria-hidden="true"></span>Disponibile</div><p class="bd-el__name">Punto attivo</p><p class="bd-note bd-el__note">Pulsa ogni 2,4 s. Unico uso del verde.</p></div>
        </div>
        ${sub('Movimento', 'Rispetta prefers-reduced-motion · senza JS tutto è visibile', { top: true, muted: true })}
        <div class="bd-eases">
          ${S.easings.map(
            (e) => html`
              <div class="bd-ease" style="--e:cubic-bezier(${e.bezier})">
                <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><path class="bd-ease__axis" d="M10 110H110M10 110V10"/><path class="bd-ease__curve" pathLength="1" d="${curvePath(e.bezier)}"/></svg>
                <div class="bd-ease__body">
                  <p class="bd-ease__name">${e.token}</p>
                  <p class="bd-cap bd-ease__bezier">${e.bezier}</p>
                  <p class="bd-note bd-ease__use">${esc(e.use)}</p>
                  <div class="bd-ease__track" aria-hidden="true"><span class="bd-ease__knob"></span></div>
                </div>
              </div>
            `,
          )}
          <div>
            <p class="bd-ease__name">Durate e ingressi</p>
            <div class="bd-durs">${S.durations.map((d) => `<span class="bd-dur" style="--t:${d.s}s">${d.label}</span>`)}</div>
            <p class="bd-note bd-durs__note">${esc(S.motionNote)}</p>
          </div>
        </div>
      </div>
    `,
  )
}

// ── 04 · Componenti ──────────────────────────────────────────────────────────

const demoLink = ({ href, label }) => `<a class="link is-hover" href="${href}" data-demo="hover"><span class="link__label">${esc(label)}</span>${icon('arrow')}</a>`

function componentiBoard(b) {
  const rows = projects.slice(0, 3)
  const counts = { all: projects.length, tecnico: byArea('tecnico').length, web: byArea('web').length }
  const computed = { projects: projects.length, sites: byArea('web').length, years: new Date().getFullYear() - site.activeSince }
  const numbers = stats.map((s) => ({ ...s, value: s.value ?? computed[s.key] ?? 0 }))
  const updated = new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const webTypes = ['Siti web', 'UI/UX', 'Sviluppo frontend', 'Responsive', 'Accessibilità', 'SEO tecnica', 'Prestazioni']

  return board(
    b,
    html`
      <div class="bd">
        ${head(b, 'Riposo · passaggio · attivo', 'Bersagli ≥ 44 px')}
        ${intro(`Pochi pezzi, ${em('sempre')} gli stessi.`, 'Bottoni in mono maiuscolo che al passaggio si riempiono di minio da sinistra; link sottolineati che si ritirano; chip a pillola per i filtri, tag squadrati per le etichette.')}
        <div class="bd-comp">
          <div class="bd-col">
            <section>
              ${sub('Bottoni', '.btn · --ghost · --sm · --lg')}
              <div class="bd-btns">
                <div>${button({ href: '/portfolio/', label: 'Guarda i progetti' })}<p class="bd-cap">Pieno · riposo</p></div>
                <div>${button({ href: '/portfolio/', label: 'Guarda i progetti', className: 'is-hover', attrs: { 'data-demo': 'hover' } })}<p class="bd-cap">Pieno · passaggio: il minio entra da sinistra, la freccia avanza di 5 px</p></div>
                <div>${button({ href: cta.href, label: cta.label, variant: 'ghost' })}<p class="bd-cap">Contorno · riposo</p></div>
                <div>${button({ href: cta.href, label: cta.label, variant: 'ghost', className: 'is-hover', attrs: { 'data-demo': 'hover' } })}<p class="bd-cap">Contorno · passaggio: si riempie d’inchiostro</p></div>
                <div class="bd-btns__sm">${button({ href: cta.href, label: cta.label, size: 'sm' })}<p class="bd-cap">Piccolo · 44 px · intestazione</p></div>
                <div>${button({ href: cta.href, label: closing.label, size: 'lg' })}<p class="bd-cap">Grande · 60 px</p></div>
              </div>
            </section>
            <section>
              ${sub('Link', '.link · link nel testo')}
              <div class="bd-links">
                ${textLink({ href: '/portfolio/', label: `Tutti i progetti (${counts.all})` })}
                ${demoLink({ href: '/portfolio/', label: `Tutti i progetti (${counts.all})` })}
                <span class="bd-cap">riposo → passaggio: il filo si ritira verso destra</span>
              </div>
              <p class="bd-text">Nel testo corrente il link è sottolineato con un filo leggero: scrivimi dalla <a href="/contatti/">pagina contatti</a>, al passaggio diventa <a class="is-hover" href="/contatti/">minio profondo</a>.</p>
            </section>
            <section>
              ${sub('Chip e tag', 'Filtri a pillola · etichette squadrate')}
              <div class="bd-chips">
                <button class="chip is-active" type="button" aria-pressed="true">Tutti<sup>${counts.all}</sup></button>
                <button class="chip" type="button" aria-pressed="false">Tecnico<sup>${counts.tecnico}</sup></button>
                <button class="chip is-hover" type="button" aria-pressed="false" data-demo="hover">Web<sup>${counts.web}</sup></button>
                <span class="bd-cap">attivo · riposo · passaggio</span>
              </div>
              ${tagList(webTypes, { max: 4 })}
            </section>
            <section>
              ${sub('Campi', '.field · modulo contatti')}
              <div class="bd-fields">
                <div class="field">
                  <label class="field__label label" for="stile-nome">Nome e cognome <span class="field__req">*</span></label>
                  <input class="field__input" id="stile-nome" type="text" placeholder="Come ti chiami" autocomplete="off">
                  <span class="bd-note">Riposo</span>
                </div>
                <div class="field">
                  <label class="field__label label" for="stile-email">Email <span class="field__req">*</span></label>
                  <input class="field__input is-focus" id="stile-email" type="email" value="nome@dominio.it" autocomplete="off">
                  <span class="bd-note">Fuoco</span>
                </div>
              </div>
            </section>
          </div>
          <div class="bd-col">
            <section>
              ${sub('<span class="bd-idx">02</span>Progetti selezionati', '01 / 03')}
              <div class="bd-sechead"><h4 class="bd-h2">Lavori scelti</h4>${textLink({ href: '/portfolio/', label: `Tutti (${counts.all})` })}</div>
              <p class="bd-cap bd-sechead__cap">Testata di sezione: indice in minio, contatore a destra</p>
            </section>
            <section>
              ${sub('Indice dei progetti', `${pad(rows.length)} di ${counts.all}`, { plain: true })}
              <ul class="bd-rows is-demo" data-demo-rows>
                ${rows.map(
                  (p, i) => html`
                    <li class="bd-row${i === 0 ? ' is-hover' : ''}" data-demo-row>
                      <a class="bd-row__link" href="/portfolio/${p.slug}/"><span class="bd-row__n label">${pad(i + 1, 3)}</span><span class="bd-row__title">${esc(p.title)}</span><span class="bd-row__year label">${p.year}</span><span class="bd-row__type label">${esc(p.types.slice(0, 2).join(' · '))} · ${esc(allAreas[p.area].short)}</span></a>
                    </li>
                  `,
                )}
              </ul>
              <p class="bd-cap bd-sechead__cap">Passaggio: la riga puntata rientra di 16 px, le altre scendono al 35%</p>
            </section>
            <section>
              ${sub('Numeri', `Aggiornati al ${updated}`)}
              <div class="bd-stats">
                ${numbers.map(
                  (n) => html`
                    <div class="bd-stat">
                      <p class="bd-stat__value"><span data-bd-count="${n.value}">${n.value}</span>${n.suffix && `<span class="bd-stat__plus">${esc(n.suffix)}</span>`}</p>
                      <p class="bd-stat__label label">${esc(n.label)}</p>
                      <p class="bd-note bd-stat__note">${esc(n.note)}</p>
                    </div>
                  `,
                )}
              </div>
            </section>
          </div>
        </div>
        <section class="bd-foot" data-theme="ink">
          <div class="bd-foot__eyebrow label"><span><span class="dot dot--accent" aria-hidden="true"></span>${esc(site.availability.label)}</span><span>Footer · palette propria su fondo #0D0D0C</span></div>
          <p class="bd-foot__title">${accented(closing.title, closing.accent)}</p>
          <div class="bd-foot__row">
            <p class="bd-note bd-foot__note">${esc(closing.note)}</p>
            <a class="cta is-hover" href="${cta.href}" data-demo="hover">
              <span class="cta__label"><span class="cta__roll" data-text="${esc(closing.label)}"><span>${esc(closing.label)}</span></span></span>
              <span class="cta__arrow" aria-hidden="true">${icon('arrow')}</span>
            </a>
          </div>
        </section>
      </div>
    `,
  )
}

// ── Pagina ───────────────────────────────────────────────────────────────────

const renderers = { home: heroBoard, colore: coloreBoard, tipografia: tipografiaBoard, forma: formaBoard, componenti: componentiBoard }

const minus = '<svg class="icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>'

export function stilePage() {
  return html`
    <section class="canvas" data-canvas>
      <div class="canvas__bg" aria-hidden="true"></div>
      <div class="canvas__viewport" data-canvas-viewport tabindex="0" role="region" aria-label="Piano delle tavole: trascina per spostarti, Ctrl e rotella per ingrandire">
        <div class="canvas__world" data-canvas-world>
          <p class="canvas__note" data-canvas-note style="--x:0px;--y:-330px" aria-hidden="true">${esc(S.canvasTitle)}</p>
          ${S.boards.map((b) => renderers[b.key](b))}
        </div>
      </div>
      <div class="canvas__top" aria-hidden="true"></div>
      <div class="canvas__panel">
        <div class="canvas__head">
          <h1 class="canvas__title">Stile</h1>
          <p class="canvas__lead">Il sistema visivo del sito in cinque tavole: la home a 1440 px, colore, tipografia, forma e movimento, componenti.</p>
        </div>
        <nav class="canvas__layers" aria-label="Tavole">
          <ul>
            ${S.boards.map((b) => `<li><button class="canvas__layer" type="button" data-canvas-go="${b.key}"><span class="label">${b.index}</span><span>${esc(b.short)}</span><span class="label">${b.w} × ${b.h}</span></button></li>`)}
          </ul>
        </nav>
        <p class="canvas__keys label"><kbd>1</kbd>–<kbd>5</kbd> tavole · <kbd>F</kbd> tutte · <kbd>0</kbd> scala 1:1 · <kbd>+</kbd> <kbd>−</kbd> zoom<br>trascina o rotella per spostarti · <kbd>Ctrl</kbd> + rotella per ingrandire</p>
      </div>
      <div class="canvas__tools" role="group" aria-label="Zoom">
        <button class="canvas__tool" type="button" data-canvas-zoom-out aria-label="Riduci">${minus}</button>
        <span class="canvas__tool canvas__zoom" data-canvas-zoom aria-live="polite">100%</span>
        <button class="canvas__tool" type="button" data-canvas-zoom-in aria-label="Ingrandisci">${icon('plus')}</button>
        <button class="canvas__tool" type="button" data-canvas-fit>Adatta</button>
        <button class="canvas__tool" type="button" data-canvas-one>1:1</button>
      </div>
    </section>
  `
}
