// Pagina /servizi/informatica/: l'area D dei servizi (assistenza informatica)
// vista da vicino. I servizi vengono da services.js, raggruppati con `group`;
// versioni, regalo, passaggi, regole e FAQ da src/data/informatica.js.

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { serviceAreas } from '../../data/services.js'
import { informatica as it } from '../../data/informatica.js'
import { abs } from '../layout.js'
import { button, media, sectionHead, splitWords, icon, figurina, figName } from '../components/ui.js'
import { head } from './info.js'

const area = serviceAreas.find((a) => a.key === 'informatica')
const numbered = area.services.map((s, i) => ({ ...s, n: `${area.letter}.${String(i + 1).padStart(2, '0')}` }))

const cifre = site.contact.phone.replace(/\D/g, '')
const contactHref = `/contatti/?tipo=${encodeURIComponent(it.cta.tipo)}#modulo`
const whatsappHref = `https://wa.me/${cifre}?text=${encodeURIComponent('Ciao Alberto, ho un problema con il computer: ')}`

const facts = [
  { label: 'Dove', value: `${site.location.city}, Mantova e dintorni · da remoto` },
  { label: 'Per chi', value: 'Privati, famiglie, piccoli uffici' },
  { label: 'Risposta', value: site.contact.reply },
  { label: it.gift.label, value: 'Installazione di Windows o Office in regalo sopra i 50 €' },
]

const versions = (title, fig, list) => html`
  <div class="itv__col" data-reveal="up">
    <div class="itv__top">
      <h3 class="h3">${esc(title)}</h3>
      ${figurina(fig, { className: 'itv__fig' })}
    </div>
    <dl class="itv__list">
      ${list.map((v) => `<div><dt>${esc(v.name).replaceAll(' · ', '&nbsp;· ')}</dt><dd>${esc(v.note)}</dd></div>`)}
    </dl>
  </div>
`

export function informaticaPage() {
  return html`
    ${head({
      crumbs: [{ label: 'Home', href: '/' }, { label: 'Servizi', href: '/servizi/' }, { label: 'Informatica', href: it.path }],
      index: area.letter,
      label: it.head.label,
      title: it.head.title,
      accent: it.head.accent,
      lead: it.head.lead,
      meta: `${String(area.services.length).padStart(2, '0')} servizi · Windows XP → 11`,
    })}

    <section class="itc">
      <div class="container">
        ${media(area.art, { ratio: '16/9', caption: null, className: 'itc__cover', lazy: false })}
        <dl class="itc__facts">
          ${facts.map((f, i) => `<div data-reveal="up" style="--d:${i * 45}ms"><dt class="label">${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`)}
        </dl>
      </div>
    </section>

    <nav class="anchors anchors--sm" aria-label="Gruppi di servizi">
      <div class="container anchors__inner">
        ${it.groups.map((g, i) => `<a class="anchors__link" href="#${g.key}"><span class="label">${area.letter}${i + 1}</span><span>${esc(g.title)}</span><span class="label">${String(numbered.filter((s) => s.group === g.key).length).padStart(2, '0')}</span></a>`)}
      </div>
    </nav>

    ${it.groups.map(
      (g, gi) => html`
        <section class="sarea itc-group" id="${g.key}" aria-labelledby="itc-${g.key}">
          <div class="container sarea__grid">
            <div class="sarea__side">
              <div class="sarea__sticky">
                <p class="label"><span class="sec-head__index">${area.letter}${gi + 1}</span>${String(numbered.filter((s) => s.group === g.key).length).padStart(2, '0')} servizi</p>
                <h2 class="h2" id="itc-${g.key}">${esc(g.title)}</h2>
                <p class="sarea__intro">${esc(g.text)}</p>
              </div>
            </div>
            <ol class="sarea__list">
              ${numbered
                .filter((s) => s.group === g.key)
                .map(
                  (s) => html`
                    <li class="sitem" data-reveal="up">
                      ${figurina(figName(area.key, s.title), { className: 'sitem__fig' })}
                      <span class="sitem__n label">${s.n}</span>
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

    <section class="section itv" id="versioni" data-theme="ink">
      <div class="container">
        ${sectionHead({ index: 'V', label: 'Versioni', title: 'Windows e Office, dal vecchio al nuovo', lead: 'Installo, riparo e configuro tutte queste versioni. Per ognuna, quello che conviene sapere prima.' })}
        <div class="itv__grid">
          ${versions('Windows', 'informatica-windows', it.windows)}
          ${versions('Office', 'informatica-microsoft-office', it.office)}
        </div>
        <p class="itv__note" data-reveal="up">${esc(it.versionsNote)}</p>
      </div>
    </section>

    <section class="section itg" aria-labelledby="itg-title">
      <div class="container">
        <div class="itg__box" data-reveal="up">
          <p class="itg__price" aria-hidden="true"><span class="itg__zero">0</span><span class="itg__cur">€</span></p>
          <div class="itg__body">
            <p class="label">${esc(it.gift.label)} · sopra i 50 €</p>
            <h2 class="h2" id="itg-title">${esc(it.gift.title)}</h2>
            <p>${esc(it.gift.text)}</p>
            <p class="itg__note">${esc(it.gift.note)}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section its" data-theme="tint">
      <div class="container">
        ${sectionHead({ index: '→', label: 'Come si svolge', title: 'Cinque passaggi, nessuna sorpresa' })}
        <ol class="its__grid">
          ${it.steps.map((s, i) => `<li data-reveal="up" style="--d:${i * 50}ms"><span class="its__n">0${i + 1}</span><h3 class="h4">${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`)}
        </ol>
      </div>
    </section>

    <section class="section prin">
      <div class="container">
        ${sectionHead({ index: '∑', label: 'Regole fisse', title: 'Quello che vale per ogni computer' })}
        <ul class="prin__grid">
          ${it.rules.map((p, i) => `<li data-reveal="up" style="--d:${i * 50}ms"><span class="label">0${i + 1}</span><h3 class="h3">${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`)}
        </ul>
      </div>
    </section>

    <section class="section faq" data-theme="tint">
      <div class="container faq__grid">
        <div>
          <p class="label"><span class="sec-head__index">?</span>Domande frequenti</p>
          <h2 class="h2" data-reveal="words">${splitWords('Prima di chiamarmi')}</h2>
        </div>
        <div class="faq__list">
          ${it.faq.map((f) => `<details class="faq__item"><summary><span>${esc(f.q)}</span>${icon('plus')}</summary><p>${esc(f.a)}</p></details>`)}
        </div>
      </div>
    </section>

    <section class="section itk" aria-labelledby="itk-title">
      <div class="container itk__grid">
        <h2 class="itk__title" id="itk-title" data-reveal="words">${splitWords(it.cta.title, { accent: it.cta.accent })}</h2>
        <div class="itk__side" data-reveal="up">
          <p class="lead">${esc(it.cta.text)}</p>
          <div class="itk__actions">
            ${button({ href: contactHref, label: 'Scrivimi' })}
            ${button({ href: whatsappHref, label: 'WhatsApp', variant: 'ghost', iconName: 'arrowUpRight', external: true })}
            ${button({ href: `tel:+${cifre}`, label: `Chiama ${site.contact.phone}`, variant: 'ghost', iconName: 'arrowUpRight' })}
          </div>
        </div>
      </div>
    </section>
  `
}

// Dati strutturati: il servizio con il suo catalogo e le domande frequenti.
export const informaticaLd = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(`${it.path}#servizio`),
    name: 'Assistenza informatica',
    serviceType: 'Assistenza informatica',
    description: it.description,
    url: abs(it.path),
    provider: { '@id': abs('/#studio') },
    areaServed: { '@type': 'AdministrativeArea', name: 'Provincia di Mantova' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Assistenza informatica',
      itemListElement: area.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.text } })),
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: it.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]
