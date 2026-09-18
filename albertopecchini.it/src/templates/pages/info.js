// Pagine Servizi, Metodo, Studio e Profilo.

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { serviceAreas, bundles, faq } from '../../data/services.js'
import { methodIntro, steps, principles } from '../../data/method.js'
import { bio, photos, facts, timeline, approach, values, tools, profile } from '../../data/studio.js'
import { button, textLink, media, tagList, icon, splitWords, breadcrumb, sectionHead, monogram } from '../components/ui.js'
import { signature } from './home.js'

const head = ({ crumbs, index, label, title, accent, lead, meta }) => html`
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

// ── /servizi/ ────────────────────────────────────────────────────────────────

export function serviziPage() {
  const total = serviceAreas.reduce((n, a) => n + a.services.length, 0)
  return html`
    ${head({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Servizi', href: '/servizi/' }],
      index: '02',
      label: 'Servizi',
      title: 'Cosa posso fare, e cosa ricevi.',
      accent: ['ricevi.'],
      lead: 'Tre macroaree, ventuno servizi. Per ognuno trovi una descrizione breve e l’elenco di ciò che ti viene consegnato: così confronti i preventivi sulle stesse voci.',
      meta: `${String(total).padStart(2, '0')} servizi · 3 aree`,
    })}

    <nav class="anchors" aria-label="Aree di servizio">
      <div class="container anchors__inner">
        ${serviceAreas.map((a) => `<a class="anchors__link" href="#${a.key}"><span class="label">${a.letter}</span><span>${esc(a.title)}</span><span class="label">${String(a.services.length).padStart(2, '0')}</span></a>`)}
      </div>
    </nav>

    ${serviceAreas.map(
      (a, ai) => html`
        <section class="sarea${ai === 1 ? ' sarea--ink' : ''}" id="${a.key}"${ai === 1 ? ' data-theme="ink"' : ''} aria-labelledby="sarea-${a.key}">
          <div class="container sarea__grid">
            <div class="sarea__side">
              <div class="sarea__sticky">
                <p class="sarea__letter" aria-hidden="true">${a.letter}</p>
                <h2 class="sarea__title h1" id="sarea-${a.key}">${esc(a.title)}</h2>
                <p class="sarea__lead serif-i">${esc(a.lead)}</p>
                <p class="sarea__intro">${esc(a.intro)}</p>
                ${media(a.art, { ratio: '4/3', caption: null, className: 'sarea__art' })}
                ${textLink({ href: a.portfolio, label: `Progetti: ${a.title.toLowerCase()}` })}
              </div>
            </div>
            <ol class="sarea__list">
              ${a.services.map(
                (s, i) => html`
                  <li class="sitem" data-reveal="up">
                    <span class="sitem__n label">${a.letter}.${String(i + 1).padStart(2, '0')}</span>
                    <h3 class="sitem__title h3">${esc(s.title)}</h3>
                    <p class="sitem__text">${esc(s.text)}</p>
                    <p class="sitem__out"><span class="label">Consegno</span>${esc(s.output)}</p>
                  </li>
                `,
              )}
            </ol>
          </div>
        </section>
      `,
    )}

    <section class="section bund">
      <div class="container">
        ${sectionHead({ index: 'A+B+C', label: 'Lavori trasversali', title: 'Quando le aree si sommano', lead: 'Il motivo per cui tre mestieri stanno nello stesso studio: certi problemi si risolvono meglio senza passare il lavoro di mano.' })}
        <ul class="bund__grid">
          ${bundles.map(
            (b, i) => html`
              <li class="bund__card" data-reveal="up" style="--d:${i * 90}ms">
                <p class="bund__code">${esc(b.code)}</p>
                <h3 class="h3">${esc(b.title)}</h3>
                <p>${esc(b.text)}</p>
                ${tagList(b.parts)}
              </li>
            `,
          )}
        </ul>
      </div>
    </section>

    <section class="section faq" data-theme="tint">
      <div class="container faq__grid">
        <div>
          <p class="label"><span class="sec-head__index">?</span>Domande frequenti</p>
          <h2 class="h2" data-reveal="words">${splitWords('Prima di scrivermi')}</h2>
        </div>
        <div class="faq__list">
          ${faq.map((f) => `<details class="faq__item"><summary><span>${esc(f.q)}</span>${icon('plus')}</summary><p>${esc(f.a)}</p></details>`)}
        </div>
      </div>
    </section>
  `
}

// ── /metodo/ ─────────────────────────────────────────────────────────────────

/** Cerchio graduato da teodolite: la lettura ruota con la fase attiva. */
function dial() {
  let ticks = ''
  for (let g = 0; g < 400; g += 5) {
    const long = g % 50 === 0
    const mid = g % 25 === 0
    const r1 = 176
    const r2 = long ? 150 : mid ? 160 : 167
    const a = ((g * 0.9 - 90) * Math.PI) / 180
    ticks += `M${(200 + Math.cos(a) * r1).toFixed(1)} ${(200 + Math.sin(a) * r1).toFixed(1)}L${(200 + Math.cos(a) * r2).toFixed(1)} ${(200 + Math.sin(a) * r2).toFixed(1)}`
  }
  let labels = ''
  for (let g = 0; g < 400; g += 50) {
    const a = ((g * 0.9 - 90) * Math.PI) / 180
    labels += `<text x="${(200 + Math.cos(a) * 132).toFixed(1)}" y="${(200 + Math.sin(a) * 132 + 4).toFixed(1)}" text-anchor="middle">${g}</text>`
  }
  const nodes = steps
    .map((s, i) => {
      const a = ((s.gon * 0.9 - 90) * Math.PI) / 180
      return `<circle class="dial__node" data-dial-node="${i}" cx="${(200 + Math.cos(a) * 176).toFixed(1)}" cy="${(200 + Math.sin(a) * 176).toFixed(1)}" r="5"/>`
    })
    .join('')
  return html`
    <div class="dial" data-dial aria-hidden="true">
      <svg viewBox="0 0 400 400" class="dial__svg">
        <circle cx="200" cy="200" r="190" class="dial__ring"/>
        <circle cx="200" cy="200" r="176" class="dial__ring"/>
        <circle cx="200" cy="200" r="112" class="dial__ring dial__ring--dash"/>
        <path d="${ticks}" class="dial__ticks"/>
        <g class="dial__labels">${labels}</g>
        ${nodes}
        <g class="dial__needle" data-dial-needle>
          <path d="M200 200V18" /><path d="M200 18l-6 14h12z" class="dial__tip"/>
          <circle cx="200" cy="200" r="7" class="dial__hub"/>
        </g>
        <path d="M180 200h40M200 180v40" class="dial__cross"/>
      </svg>
      <div class="dial__read">
        <p class="dial__n"><span data-dial-n>01</span><span class="dial__of"> / 0${steps.length}</span></p>
        <p class="dial__title" data-dial-title>${esc(steps[0].title)}</p>
        <p class="label">Lettura <span data-dial-gon>0,000</span> gon</p>
      </div>
    </div>
  `
}

export function metodoPage() {
  return html`
    ${head({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Metodo', href: '/metodo/' }],
      index: '04',
      label: 'Metodo di lavoro',
      title: methodIntro.title + '.',
      accent: ['stesse.'],
      lead: methodIntro.lead,
      meta: '07 fasi · 400 gon',
    })}

    <section class="mtd" data-method>
      <div class="container mtd__grid">
        <aside class="mtd__side">
          <div class="mtd__sticky">
            ${dial()}
          </div>
        </aside>
        <ol class="mtd__steps">
          <li class="mtd__axis" aria-hidden="true"><span data-method-axis></span></li>
          ${steps.map(
            (s, i) => html`
              <li class="mstep" data-method-step="${i}" data-gon="${s.gon}" data-title="${esc(s.title)}" id="${s.key}">
                <div class="mstep__marker" aria-hidden="true"><span></span></div>
                <p class="mstep__n" aria-hidden="true">${s.n}</p>
                <div class="mstep__body">
                  <h2 class="mstep__title h2"><span class="sr-only">Fase ${s.n}: </span>${esc(s.title)}</h2>
                  <p class="mstep__text">${esc(s.text)}</p>
                  <dl class="mstep__facts">
                    <div><dt class="label">Cosa ricevi</dt><dd>${esc(s.output)}</dd></div>
                    <div><dt class="label">Durata tipica</dt><dd>${esc(s.time)}</dd></div>
                  </dl>
                </div>
              </li>
            `,
          )}
        </ol>
      </div>
    </section>

    <section class="section prin" data-theme="ink">
      <div class="container">
        ${sectionHead({ index: '∑', label: 'Regole fisse', title: 'Quattro cose che non cambiano mai' })}
        <ul class="prin__grid">
          ${principles.map((p, i) => `<li data-reveal="up" style="--d:${i * 80}ms"><span class="label">0${i + 1}</span><h3 class="h3">${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`)}
        </ul>
      </div>
    </section>
  `
}

// ── /studio/ ─────────────────────────────────────────────────────────────────

export function studioPage() {
  return html`
    <header class="shero">
      <div class="container">
        ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Studio', href: '/studio/' }])}
        <div class="shero__grid">
          <div class="shero__copy">
            <p class="label" data-reveal="fade"><span class="sec-head__index">03</span>Studio · Chi sono</p>
            <h1 class="shero__title" data-reveal="words">${splitWords(bio.headline, { accent: ['codice,', 'sezione.'] })}</h1>
            <dl class="shero__facts" data-reveal="up">
              ${facts.map((f) => `<div><dt class="label">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)}
              ${site.legal.albo
                ? `<div><dt class="label">Albo</dt><dd>${esc(site.legal.albo.collegio)} · n. ${esc(site.legal.albo.numero)}</dd></div>`
                : `<div><dt class="label">Qualifica</dt><dd>${esc(site.legal.note)}</dd></div>`}
            </dl>
          </div>
          <div class="shero__photo">${media(photos.portrait, { ratio: '4/5', marks: true, lazy: false, parallax: true })}</div>
        </div>
      </div>
    </header>

    <section class="section sbio">
      <div class="container sbio__grid">
        <div class="sbio__mark" aria-hidden="true">${monogram({ className: 'monogram--draw monogram--huge' })}</div>
        <div class="sbio__text">
          ${bio.paragraphs.map((p, i) => `<p class="${i === 0 ? 'cs-lead' : ''}" data-reveal="up">${esc(p)}</p>`)}
          <div class="sbio__sign" data-reveal="up">${signature()}</div>
        </div>
      </div>
    </section>

    <section class="section sapp" data-theme="tint">
      <div class="container">
        ${sectionHead({ index: 'A', label: 'Approccio al lavoro', title: 'Tre abitudini, prima che tre principi' })}
        <ol class="sapp__grid">
          ${approach.map((a, i) => `<li data-reveal="up" style="--d:${i * 90}ms"><span class="sapp__n">${a.n}</span><h3 class="h3">${esc(a.title)}</h3><p>${esc(a.text)}</p></li>`)}
        </ol>
      </div>
    </section>

    <section class="section stl">
      <div class="container">
        ${sectionHead({ index: 'B', label: 'Timeline professionale', title: 'Da dove arrivo', meta: `${timeline[0].year} — ${timeline.at(-1).year}`, link: { href: '/studio/profilo/', label: 'Profilo e curriculum' } })}
        <ol class="stl__list">
          ${timeline.map(
            (t) => html`
              <li class="stl__item" data-reveal="up">
                <span class="stl__year">${esc(t.year)}</span>
                <span class="stl__node" aria-hidden="true"></span>
                <div class="stl__body"><p class="label">${esc(t.tag)}</p><h3 class="h4">${esc(t.title)}</h3><p>${esc(t.text)}</p></div>
              </li>
            `,
          )}
        </ol>
      </div>
    </section>

    <section class="sfull" aria-label="Lo studio">
      ${media(photos.studio, { ratio: '21/9', parallax: 0.1, className: 'sfull__media' })}
    </section>

    <section class="section sval">
      <div class="container">
        ${sectionHead({ index: 'C', label: 'Valori', title: 'Quello su cui non tratto' })}
        <ul class="sval__grid">
          ${values.map((v, i) => `<li data-reveal="up" style="--d:${i * 70}ms"><span class="label">0${i + 1}</span><h3 class="h3">${esc(v.title)}</h3><p>${esc(v.text)}</p></li>`)}
        </ul>
      </div>
    </section>

    <section class="section stools" data-theme="ink">
      <div class="container">
        ${sectionHead({ index: 'D', label: 'Strumenti', title: 'Con cosa lavoro' })}
        <div class="stools__grid">
          ${tools.map((g) => `<div data-reveal="up"><h3 class="label">${esc(g.group)}</h3><ul>${g.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul></div>`)}
        </div>
      </div>
    </section>
  `
}

// ── /studio/profilo/ ─────────────────────────────────────────────────────────

const cvList = (items) => html`
  <ol class="cv__list">
    ${items.map((e) => `<li><span class="label cv__period">${esc(e.period)}</span><div><h3 class="h4">${esc(e.title)}</h3><p>${esc(e.role)}</p></div></li>`)}
  </ol>
`

export function profiloPage() {
  return html`
    <article class="cv">
      <div class="container cv__wrap">
        ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Studio', href: '/studio/' }, { label: 'Profilo', href: '/studio/profilo/' }])}
        <header class="cv__head">
          <div>
            <p class="label">Curriculum vitae · agg. ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
            <h1 class="cv__name">${esc(site.name)}</h1>
            <p class="cv__role">${site.roles.map((r) => esc(r.label)).join(' · ')}</p>
          </div>
          <div class="cv__contact">
            <p><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></p>
            <p><a href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></p>
            <p>${esc(site.location.city)}, Italia</p>
            <p><a href="/">${esc(site.url.replace('https://', ''))}</a></p>
          </div>
        </header>
        <div class="cv__actions">
          ${button({ label: 'Stampa o salva in PDF', variant: 'ghost', iconName: 'arrowDown', attrs: { 'data-print': true } })}
          ${textLink({ href: '/contatti/', label: 'Contattami' })}
        </div>

        <section class="cv__sec"><h2 class="label">Profilo</h2><p class="cs-lead">${esc(profile.summary)}</p></section>
        <section class="cv__sec"><h2 class="label">Esperienze e progetti</h2>${cvList(profile.experience)}</section>
        <section class="cv__sec"><h2 class="label">Formazione</h2>${cvList(profile.education)}</section>
        <section class="cv__sec">
          <h2 class="label">Competenze</h2>
          <div class="cv__skills">${profile.skills.map((g) => `<div><h3 class="h4">${esc(g.group)}</h3>${tagList(g.items)}</div>`)}</div>
        </section>
        <section class="cv__sec cv__sec--cols">
          <div><h2 class="label">Lingue</h2><ul class="cv__plain">${profile.languages.map((l) => `<li><span>${esc(l.name)}</span><span class="label">${esc(l.level)}</span></li>`)}</ul></div>
          <div><h2 class="label">Altro</h2><ul class="cv__plain">${profile.extra.map((e) => `<li><span>${esc(e)}</span></li>`)}</ul></div>
        </section>
        <p class="cv__privacy">Autorizzo il trattamento dei dati personali contenuti nel presente curriculum ai sensi del Reg. UE 2016/679 (GDPR) e del D.lgs. 196/2003.</p>
      </div>
    </article>
  `
}
