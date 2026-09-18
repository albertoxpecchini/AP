import { html, esc } from '../html.js'
import { site, stats, cta } from '../../data/site.js'
import { projects, featured, byArea, bySlug } from '../../data/projects.js'
import { serviceAreas } from '../../data/services.js'
import { steps } from '../../data/method.js'
import { bio, photos, facts } from '../../data/studio.js'
import { button, textLink, sectionHead, media, picture, browserMockup, phoneMockup, stat, icon, splitWords } from '../components/ui.js'
import { featureCard, indexRow } from '../components/project.js'
import { COORDS } from '../layout.js'

// Le tre figure dell'hero: una per disciplina, sincronizzate con l'elenco dei ruoli.
const heroSlides = () => {
  const web = bySlug('rivalta-sul-mincio')
  return [
    { key: 'tecnico', caption: 'FIG. 01 — Pianta piano terra · scala 1:100', body: picture({ art: 'floorplan', variant: 'casa', code: 'AP-26-004', alt: 'Pianta architettonica quotata di un’abitazione' }, { lazy: false }) },
    {
      key: 'web',
      caption: `FIG. 02 — ${web.web.domain} · 2026`,
      body: `<div class="hero__web" data-theme="ink">${browserMockup({ domain: web.web.domain, screen: web.web.desktop, lazy: false })}</div>`,
    },
    { key: 'grafica', caption: 'FIG. 03 — Costruzione geometrica di un marchio', body: picture({ art: 'brandmark', brand: 'tavolato', construction: true, alt: 'Costruzione geometrica di un marchio su griglia' }, { lazy: false }) },
  ]
}

function hero() {
  const slides = heroSlides()
  return html`
    <section class="hero" data-section="Intro" aria-labelledby="hero-title">
      <div class="hero__lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="container hero__wrap">
        <div class="hero__meta label" data-reveal="fade">
          <span>${esc(site.edition)}</span>
          <span class="hero__meta-mid">${esc(site.location.city)} — Italia</span>
          <span>${COORDS}</span>
        </div>

        <h1 class="hero__title" id="hero-title">
          <span class="hero__name" aria-hidden="true"><span class="hero__word"><span>Alberto</span></span> <span class="hero__word hero__word--2"><span>Pecchini</span></span></span>
          <span class="sr-only">${esc(site.name)} — ${site.roles.map((r) => esc(r.label)).join(', ')} a ${esc(site.location.city)}</span>
        </h1>
        <div class="rule rule--ticks hero__rule" aria-hidden="true"></div>

        <div class="hero__body">
          <div class="hero__roles-wrap" data-reveal="up" style="--d:250ms">
            <p class="label hero__roles-label">Discipline</p>
            <ul class="hero__roles" data-hero-roles>
              ${site.roles.map(
                (r, i) => `<li><button class="hero__role${i === 0 ? ' is-active' : ''}" type="button" data-hero-go="${i}" aria-pressed="${i === 0}"><span class="label">0${i + 1}</span><span class="hero__role-name">${esc(r.label)}</span><span class="hero__role-note label">${esc(r.note)}</span></button></li>`,
              )}
            </ul>
          </div>

          <figure class="hero__visual" data-hero data-reveal="clip" style="--d:150ms">
            <div class="hero__stage">
              <div class="hero__frame" data-tilt data-clip>
                ${slides.map((s, i) => `<div class="hero__slide${i === 0 ? ' is-active' : ''}" data-hero-slide="${i}"${i ? ' aria-hidden="true"' : ''}>${s.body}</div>`)}
              </div>
              <span class="mark mark--tl" aria-hidden="true"></span><span class="mark mark--tr" aria-hidden="true"></span><span class="mark mark--bl" aria-hidden="true"></span><span class="mark mark--br" aria-hidden="true"></span>
            </div>
            <figcaption class="hero__caption label">
              <span data-hero-caption>${esc(slides[0].caption)}</span>
              <span class="hero__ticks" aria-hidden="true">${slides.map((_, i) => `<i${i === 0 ? ' class="is-active"' : ''}></i>`)}</span>
            </figcaption>
            <template data-hero-captions>${esc(JSON.stringify(slides.map((s) => s.caption)))}</template>
          </figure>

          <div class="hero__pitch">
            <p class="hero__claim" data-reveal="up" style="--d:300ms">Progetto <em class="serif-i">spazi,</em> strumenti e <em class="serif-i">identità</em> digitali.</p>
            <p class="hero__lead" data-reveal="up" style="--d:380ms">Diplomato geometra, in provincia di Mantova. Rilevo e disegno edifici, sviluppo siti web, costruisco marchi: con lo stesso metodo e la stessa tolleranza.</p>
            <div class="hero__actions" data-reveal="up" style="--d:460ms">
              ${button({ href: '/portfolio/', label: 'Guarda i progetti', size: 'lg', magnetic: true })}
              ${button({ href: cta.href, label: cta.label, variant: 'ghost', size: 'lg' })}
            </div>
          </div>
        </div>

        <div class="hero__foot label" data-reveal="fade" style="--d:600ms">
          <span class="hero__avail"><span class="dot${site.availability.open ? ' dot--live' : ''}"></span>${esc(site.availability.label)}</span>
          <a class="scroll-cue" href="#discipline"><span class="scroll-cue__line" aria-hidden="true"></span><span>Scorri</span></a>
          <span>Attivo dal ${site.activeSince}</span>
        </div>
      </div>
    </section>
  `
}

function disciplines() {
  const cards = [
    { area: serviceAreas[0], count: byArea('tecnico').length, href: '/portfolio/tecnico/', image: { art: 'section', bare: true, tone: 'tint', alt: 'Sezione trasversale di un edificio' } },
    { area: serviceAreas[1], count: byArea('web').length, href: '/portfolio/web/', image: { art: 'webpage', site: 'edilcorte', device: 'desktop', tall: false, alt: 'Pagina principale di un sito web' } },
    { area: serviceAreas[2], count: byArea('grafica').length, href: '/portfolio/grafica/', image: { art: 'poster', brand: 'argini', alt: 'Serie di manifesti' } },
  ]
  return html`
    <section class="section intro" id="discipline" data-section="Discipline">
      <div class="container">
        <div class="intro__statement">
          <p class="label" data-reveal="fade"><span class="sec-head__index">01</span>Tre discipline</p>
          <p class="intro__text" data-reveal="words">
            ${splitWords('Rilevo un edificio al millimetro, scrivo l’interfaccia che lo racconta, disegno il marchio di chi lo abita. Tre discipline, un solo metodo: misurare, ordinare, rendere leggibile.', { accent: ['misurare', 'ordinare', 'leggibile'] })}
          </p>
        </div>
        <div class="disc">
          ${cards.map(
            (c, i) => html`
              <a class="disc__card" href="${c.href}" data-reveal="up" style="--d:${i * 110}ms" data-cursor="Vedi">
                <div class="disc__top label"><span>${c.area.letter} — ${esc(c.area.title)}</span><span>${String(c.count).padStart(2, '0')} progetti</span></div>
                ${media(c.image, { ratio: '4/3', reveal: null, caption: null, className: 'disc__media' })}
                <h2 class="disc__title h3">${esc(c.area.lead)}</h2>
                <p class="disc__list">${c.area.services.slice(0, 5).map((s) => esc(s.title)).join(' · ')}</p>
                <span class="link disc__link"><span class="link__label">${esc(c.area.title === 'Digitale' ? 'Progetti web' : c.area.title === 'Grafica' ? 'Progetti grafici' : 'Progetti tecnici')}</span>${icon('arrow')}</span>
              </a>
            `,
          )}
        </div>
      </div>
    </section>
  `
}

function selected() {
  const list = featured()
  return html`
    <section class="hscroll" data-hscroll data-section="Progetti" aria-labelledby="sel-title">
      <div class="hscroll__sticky">
        <div class="container hscroll__head">
          <p class="label"><span class="sec-head__index">02</span>Progetti selezionati</p>
          <h2 class="h2 hscroll__title" id="sel-title">Lavori <em class="serif-i">scelti</em></h2>
          <div class="hscroll__tools">
            <p class="label hscroll__count" aria-hidden="true"><span data-hscroll-current>01</span> / ${String(list.length).padStart(2, '0')}</p>
            ${textLink({ href: '/portfolio/', label: `Tutti i progetti (${projects.length})` })}
          </div>
        </div>
        <div class="hscroll__viewport" data-hscroll-viewport tabindex="0" role="region" aria-label="Progetti selezionati, scorrimento orizzontale">
          <div class="hscroll__track" data-hscroll-track>
            ${list.map((p, i) => featureCard(p, i, list.length))}
            <div class="fcard fcard--end">
              <a class="fcard__all" href="/portfolio/" data-cursor="Vai">
                <span class="label">Indice completo</span>
                <span class="h2">${projects.length} progetti</span>
                <span class="fcard__all-icon">${icon('arrow')}</span>
              </a>
            </div>
          </div>
        </div>
        <div class="container hscroll__bar" aria-hidden="true"><span data-hscroll-bar></span></div>
      </div>
    </section>
  `
}

function webTeaser() {
  const p = bySlug('cascina-fontana')
  return html`
    <section class="section webt" data-theme="ink" data-section="Web">
      <div class="container webt__grid">
        <div class="webt__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">03</span>Web design e sviluppo</p>
          <h2 class="h1 webt__title" data-reveal="words">${splitWords('Anche un sito si progetta in scala.', { accent: ['scala.'] })}</h2>
          <p class="lead" data-reveal="up">Struttura prima dell’estetica, contenuti veri prima dei layout, prestazioni misurate. Scrivo il codice a mano: niente temi, niente page builder.</p>
          <ul class="webt__points" data-reveal="up">
            <li><span class="label">01</span>Mobile progettato a parte, non ridotto</li>
            <li><span class="label">02</span>HTML semantico, accessibile da tastiera</li>
            <li><span class="label">03</span>Dominio, hosting e sorgenti intestati a te</li>
          </ul>
          <div data-reveal="up">${button({ href: '/portfolio/web/', label: 'Progetti web', variant: 'light' })}</div>
        </div>
        <div class="webt__visual" data-reveal="up">
          <div class="webt__stage">
            ${browserMockup({ domain: p.web.domain, screen: p.web.desktop, tall: p.web.desktopTall, className: 'webt__browser' })}
            ${phoneMockup({ screen: p.web.mobile, tall: p.web.mobileTall, className: 'webt__phone' })}
          </div>
          <p class="label webt__caption"><span>${esc(p.web.domain)} · ${p.year}</span><span class="hint-hover">Passa il puntatore per scorrere la pagina</span><span class="hint-touch">Tocca lo schermo per scorrere la pagina</span></p>
        </div>
      </div>
    </section>
  `
}

function services() {
  return html`
    <section class="section svc" data-section="Servizi">
      <div class="container">
        ${sectionHead({ index: '04', label: 'Servizi', title: 'Tre aree, un interlocutore', meta: `${serviceAreas.reduce((n, a) => n + a.services.length, 0)} servizi`, link: { href: '/servizi/', label: 'Tutti i servizi' } })}
        <ul class="svc__rows">
          ${serviceAreas.map(
            (a, i) => html`
              <li class="svc__row" data-reveal="up" style="--d:${i * 80}ms">
                <a class="svc__link" href="/servizi/#${a.key}">
                  <span class="svc__letter label">${a.letter}</span>
                  <span class="svc__name">${esc(a.title)}</span>
                  <span class="svc__items">${a.services.map((s) => `<span>${esc(s.title)}</span>`).join('')}</span>
                  <span class="svc__arrow" aria-hidden="true">${icon('arrowUpRight')}</span>
                </a>
              </li>
            `,
          )}
        </ul>
      </div>
    </section>
  `
}

function numbers() {
  const computed = {
    projects: projects.length,
    sites: byArea('web').filter((p) => p.web?.url).length,
    years: new Date().getFullYear() - site.activeSince,
  }
  const list = stats.map((s) => ({ ...s, value: s.value ?? computed[s.key] }))
  return html`
    <section class="section nums" data-theme="tint" data-section="Numeri" aria-labelledby="nums-title">
      <div class="container">
        <div class="nums__head">
          <p class="label"><span class="sec-head__index">05</span>Numeri e dati</p>
          <h2 class="sr-only" id="nums-title">Numeri dello studio</h2>
          <p class="label nums__note">Aggiornati al ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div class="nums__grid">${list.map((s, i) => stat(s, i))}</div>
      </div>
    </section>
  `
}

function method() {
  return html`
    <section class="section mth" data-section="Metodo">
      <div class="container">
        ${sectionHead({ index: '06', label: 'Metodo di lavoro', title: 'Sette fasi, sempre le stesse', lead: 'Dal primo incontro all’assistenza dopo la consegna: sai sempre a che punto siamo e cosa succede dopo.', link: { href: '/metodo/', label: 'Il metodo nel dettaglio' } })}
        <div class="mth__scroll" role="region" aria-label="Le sette fasi del metodo" data-scroll-region data-reveal="fade">
          <ol class="mth__track">
            ${steps.map(
              (s, i) => html`
                <li class="mth__step" style="--i:${i}">
                  <span class="mth__node" aria-hidden="true"></span>
                  <span class="mth__n">${s.n}</span>
                  <span class="mth__title">${esc(s.title)}</span>
                  <span class="mth__time label">${esc(s.time)}</span>
                </li>
              `,
            )}
          </ol>
        </div>
      </div>
    </section>
  `
}

function studio() {
  return html`
    <section class="section std" data-section="Studio">
      <div class="container std__grid">
        <div class="std__photo">${media(photos.portrait, { ratio: '4/5', marks: true, parallax: true })}</div>
        <div class="std__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">07</span>Studio</p>
          <h2 class="h2 std__title" data-reveal="words">${splitWords(bio.headline, { accent: ['codice,', 'sezione.'] })}</h2>
          <p class="lead" data-reveal="up">${esc(bio.paragraphs[2])}</p>
          <dl class="std__facts" data-reveal="up">
            ${facts.slice(0, 4).map((f) => `<div><dt class="label">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)}
          </dl>
          <div class="std__sign" data-reveal="up">
            ${signature()}
            ${button({ href: '/studio/', label: 'Chi sono', variant: 'ghost' })}
          </div>
        </div>
      </div>
    </section>
  `
}

/** Firma: testo in corsivo con tratto disegnato. Sostituibile con l'SVG della firma reale. */
export const signature = () => html`
  <div class="sign" role="img" aria-label="Firma di ${esc(site.name)}">
    <span class="sign__text" aria-hidden="true">${esc(site.name)}</span>
    <svg class="sign__stroke" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 26C60 8 120 34 170 20s88-10 126 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    <span class="label sign__meta">${esc(site.title)} · ${esc(site.location.city)}</span>
  </div>
`

function index() {
  const list = [...projects].sort((a, b) => b.year - a.year).slice(0, 10)
  return html`
    <section class="section idx" data-section="Indice">
      <div class="container">
        ${sectionHead({ index: '08', label: 'Indice dei progetti', title: 'Ultimi lavori', meta: `${String(list.length).padStart(2, '0')} di ${projects.length}`, link: { href: '/portfolio/', label: 'Portfolio completo con filtri' } })}
        <ul class="irows" data-preview-list>
          ${list.map((p, i) => indexRow(p, i))}
        </ul>
      </div>
    </section>
  `
}

/** Indicatore di posizione: sezione corrente della pagina (solo schermi larghi, decorativo). */
const sectionIndicator = () => html`
  <div class="secind label" aria-hidden="true" data-secind>
    <span class="secind__n"><span data-secind-n>01</span> / <span data-secind-total>09</span></span>
    <span class="secind__bar"><i data-secind-bar></i></span>
    <span data-secind-name>Intro</span>
  </div>
`

export function homePage() {
  return [hero(), disciplines(), selected(), webTeaser(), services(), numbers(), method(), studio(), index(), sectionIndicator()].join('\n')
}
