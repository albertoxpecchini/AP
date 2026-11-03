// Guscio di ogni pagina: <head>, header, menu mobile, footer (con l'invito finale),
// e gli elementi globali (barra di avanzamento, tendina di transizione,
// cursore, luce, lightbox, anteprima flottante).
//
// Dal 2.11.2026 l'impaginazione segue reflection.ai (e per un quinto
// anthropic.com): testata sottile con il marchio a sinistra, le voci in mezzo e
// l'invito a pillola a destra; piè di pagina scuro a colonne, con l'invito
// grande in cima e la firma custodita dagli animali — la chiocciola gigante
// africana e gli altri burattini (puppet(), src/client/puppet.js), e la
// tartaruga di terra col casco da cantiere, una mascotte intera (mascot(),
// src/client/mascot.js), tutti con gli occhi che seguono il puntatore — in fondo.

import { html, esc, jsonLd, cx } from './html.js'
import { site, nav, cta, closing } from '../data/site.js'
import { serviceAreas } from '../data/services.js'
import { logo, monogram, signature, splitWords, icon, button, puppet, mascot } from './components/ui.js'

const abs = (path) => site.url + path

// Coordinate della sede ricavate da `site.location`, così da non doverle
// aggiornare a mano in due posti. Fermate al primo (≈ 1,8 km): indicano il
// paese, non la casa — coerente con l'indirizzo che non viene pubblicato.
const dms = (v, [pos, neg]) => {
  const a = Math.abs(v)
  const d = Math.floor(a)
  const m = Math.round((a - d) * 60)
  return `${d}°${String(m).padStart(2, '0')}′${v < 0 ? neg : pos}`
}
const COORDS = `${dms(site.location.lat, ['N', 'S'])} · ${dms(site.location.lon, ['E', 'W'])}`

export function layout({ route, title, description, body, assets, jsonld = [], headerTheme = 'paper', pageClass, ogImage = '/og.png', noindex = false, hideCta = false, head = '' }) {
  const fullTitle = route.path === '/' ? title : `${title} — ${site.name}`
  const url = abs(route.canonical || route.path)

  return html`<!doctype html>
<html lang="${site.lang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="author" content="${esc(site.name)}">
<link rel="author" href="${esc(site.url)}">
<meta name="theme-color" content="#f8f6f0">
<meta name="format-detection" content="telephone=no">
<meta name="google-adsense-account" content="ca-pub-6444827793145583">
<meta property="og:type" content="${route.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(abs(ogImage))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.name)} — ${esc(site.roles.map((r) => r.label).join(', '))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(abs(ogImage))}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${assets.preloadFonts.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`)}
${assets.styles.map((s) => `<link rel="stylesheet" href="${s}">`)}
<script>
(function(d){var c=d.documentElement.classList;c.remove('no-js');c.add('js');
try{if(sessionStorage.getItem('ap:nav')==='1'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){c.add('is-entering','nav-in')}sessionStorage.removeItem('ap:nav')}catch(e){}
setTimeout(function(){if(!c.contains('is-ready')){c.remove('js','is-entering');c.add('no-js')}},4000);
})(document);
</script>
${jsonld.map((data) => `<script type="application/ld+json">${jsonLd(data)}</script>`)}
<script type="speculationrules">{"prefetch":[{"source":"document","where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/media/*"}}]},"eagerness":"moderate"}]}</script>
${head}
</head>
<body class="${cx('page', pageClass)}" data-header-theme="${headerTheme}">
<a class="skip" href="#main">Vai al contenuto</a>
<div class="progress" aria-hidden="true"><span class="progress__bar" data-progress></span></div>
${header(route)}
${mobileMenu(route)}
<main id="main" tabindex="-1">
${body}
</main>
${!route.noFooter && footer({ route, compact: hideCta })}
${globals()}
${assets.scripts.map((s) => `<script type="module" src="${s}"></script>`)}
</body>
</html>`
}

// ── Header ───────────────────────────────────────────────────────────────────
// Una riga sottile: il marchio a sinistra, le voci di testo al centro, l'invito
// a pillola a destra. Sotto i 1100 px restano il marchio e, a destra, i due
// tasti tondi dei contatti e del menu.

const isCurrent = (route, href) => (href === '/' ? route.path === '/' : route.path.startsWith(href))

const roundButton = ({ href, label, iconName, className, attrs = {}, current = false }) => {
  const inner = `${icon(iconName)}<span class="sr-only">${esc(label)}</span>`
  const a = Object.entries(attrs)
    .map(([k, v]) => (v === true ? ` ${k}` : v === false || v == null ? '' : ` ${k}="${esc(String(v))}"`))
    .join('')
  if (href) return `<a class="${cx('hbtn', className)}" href="${href}"${current ? ' aria-current="page"' : ''}${a}>${inner}</a>`
  return `<button class="${cx('hbtn', className)}" type="button"${a}>${inner}</button>`
}

function navItem(route, item, i) {
  const current = isCurrent(route, item.href)
  const link = `<a class="site-nav__link" href="${item.href}"${current ? ' aria-current="page"' : ''}><span>${esc(item.label)}</span></a>`
  if (!item.children) return `<li class="site-nav__item">${link}</li>`
  return html`
    <li class="site-nav__item site-nav__item--sub" data-subnav>
      ${link}
      <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="subnav-${i}" aria-label="Apri il sottomenu ${esc(item.label)}">${icon('plus')}</button>
      <div class="subnav" id="subnav-${i}">
        <ul class="subnav__list">
          ${item.children.map(
            (c, k) => `<li><a class="subnav__link" href="${c.href}"${route.path === c.href ? ' aria-current="page"' : ''}><span class="label">${String(k + 1).padStart(2, '0')}</span><span class="subnav__label">${esc(c.label)}</span><span class="subnav__note">${esc(c.note)}</span></a></li>`,
          )}
        </ul>
      </div>
    </li>
  `
}

function header(route) {
  return html`
    <header class="site-header" data-header>
      <div class="site-header__inner container--wide">
        ${logo()}
        <nav class="site-nav" aria-label="Navigazione principale">
          <ul class="site-nav__list">${nav.map((it, i) => navItem(route, it, i))}</ul>
        </nav>
        <div class="site-header__side">
          ${button({ href: cta.href, label: cta.label, size: 'sm', className: 'site-header__cta', iconName: null })}
          ${roundButton({ href: cta.href, label: 'Contatti', iconName: 'mail', className: 'site-header__mail', current: isCurrent(route, cta.href) })}
          ${roundButton({ label: 'Apri il menu', iconName: 'menu', className: 'menu-toggle', attrs: { 'data-menu-open': true, 'aria-expanded': 'false', 'aria-controls': 'menu' } })}
        </div>
      </div>
    </header>
  `
}

// ── Menu mobile a tutto schermo ──────────────────────────────────────────────

function mobileMenu(route) {
  return html`
    <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menu di navigazione" data-theme="ink" hidden>
      <div class="menu__top container--wide">
        ${logo()}
        ${roundButton({ label: 'Chiudi il menu', iconName: 'close', className: 'menu-toggle menu-toggle--close', attrs: { 'data-menu-close': true } })}
      </div>
      <div class="menu__body container--wide">
        <nav aria-label="Menu principale">
          <ul class="menu__list">
            <li class="menu__item" style="--i:0"><a class="menu__link" href="/"${route.path === '/' ? ' aria-current="page"' : ''}><span class="label">00</span><span class="menu__text">Home</span></a></li>
            ${nav.map(
              (item, i) => html`
                <li class="menu__item" style="--i:${i + 1}">
                  <a class="menu__link" href="${item.href}"${isCurrent(route, item.href) ? ' aria-current="page"' : ''}><span class="label">${String(i + 1).padStart(2, '0')}</span><span class="menu__text">${esc(item.label)}</span></a>
                  ${item.children && `<ul class="menu__sub">${item.children.slice(1).map((c) => `<li><a class="pill menu__pill" href="${c.href}"${route.path === c.href ? ' aria-current="page"' : ''}>${esc(c.label.replace('Progetti ', ''))}</a></li>`).join('')}</ul>`}
                </li>
              `,
            )}
          </ul>
        </nav>
        <div class="menu__aside">
          <div class="menu__block" style="--i:6">
            <p class="label">Contatti</p>
            <p><a href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></p>
            <p><a href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></p>
            <p class="menu__note">${esc(site.contact.reply)}</p>
          </div>
          <div class="menu__block" style="--i:7">
            <p class="label">Social</p>
            <ul class="menu__social">${site.social.map((s) => `<li><a class="pill menu__pill" href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}<span class="sr-only"> (nuova scheda)</span></a></li>`)}</ul>
          </div>
          <div class="menu__block menu__block--cta" style="--i:8">
            ${button({ href: cta.href, label: cta.label, size: 'lg' })}
          </div>
        </div>
      </div>
      <div class="menu__foot container--wide label">
        <span>${esc(site.location.city)} · ${COORDS}</span>
        <span><span class="dot dot--accent" aria-hidden="true"></span>${esc(site.availability.label)}</span>
      </div>
    </div>
  `
}

// ── Footer ───────────────────────────────────────────────────────────────────
// Scuro, a colonne, dall'alto in basso: l'invito grande con i due tasti, le
// quattro colonne (marchio e disponibilità · pagine · contatti · social e note),
// la firma custodita dalle mascotte e dai burattini, la riga legale con il
// credito e «torna su».
//
// `compact`: nelle pagine che sono già la chiamata all'azione (contatti, note
// legali, 404) l'invito rimanda alla posta invece che a sé stesso.

function footer({ route, compact = false }) {
  const year = new Date().getFullYear()
  const mail = `mailto:${site.contact.email}`
  const tel = `tel:${site.contact.phone.replace(/\s/g, '')}`
  const pages = [{ label: 'Home', href: '/' }, ...nav.map(({ label, href }) => ({ label, href }))]
  const legal = site.legal.albo ? `${site.legal.albo.collegio} · n. ${site.legal.albo.numero}` : site.legal.note
  const label = compact ? closing.labelCompact : closing.label
  const availability = `${site.availability.label}${site.availability.from ? ` — da ${site.availability.from}` : ''}`
  const notes = [
    { label: 'Privacy', href: '/privacy/' },
    { label: 'Cookie', href: '/cookie/' },
    { label: 'Crediti immagini', href: '/crediti/' },
    { label: 'Stile', href: '/stile/' },
    { label: 'L’aragosta', href: '/aragosta/' },
    { label: 'La macchina del tempo', href: '/tempo/' },
  ]
  const flink = (p) => `<a class="foot-link" href="${p.href}"${isCurrent(route, p.href) && p.href !== '/' ? ' aria-current="page"' : ''}>${esc(p.label)}</a>`

  return html`
    <footer class="site-footer" data-theme="ink">
      <div class="container--wide site-footer__inner">

        <section class="foot-cta" aria-labelledby="foot-title">
          <p class="foot-cta__eyebrow pill" data-reveal="fade"><span class="dot dot--live" aria-hidden="true"></span>${esc(availability)}</p>
          <h2 class="foot-cta__title" id="foot-title" data-reveal="words">${splitWords(closing.title, { accent: closing.accent })}</h2>
          <p class="foot-cta__note" data-reveal="up">${esc(closing.note)}</p>
          <div class="foot-cta__row" data-reveal="up" style="--d:120ms">
            ${button({ href: compact ? mail : cta.href, label, size: 'lg', magnetic: true })}
            ${!compact && button({ href: mail, label: closing.labelCompact, variant: 'ghost', size: 'lg', iconName: 'mail' })}
          </div>
        </section>

        <div class="foot-grid" data-reveal="up">
          <div class="foot-col foot-col--brand">
            ${logo()}
            <p class="foot-col__tag">${esc(site.tagline)}</p>
            <p class="foot-col__place label">${esc(site.location.city)} (${esc(site.location.province)}) · ${COORDS}</p>
          </div>
          <nav class="foot-col" aria-label="Pagine del sito">
            <p class="foot-col__head label">Pagine</p>
            <ul class="foot-col__list">${pages.map((p) => `<li>${flink(p)}</li>`)}</ul>
          </nav>
          <div class="foot-col">
            <p class="foot-col__head label">Contatti</p>
            <ul class="foot-col__list">
              <li><a class="foot-link" href="${mail}">${esc(site.contact.email)}</a></li>
              <li><a class="foot-link" href="${tel}">${esc(site.contact.phone)}</a></li>
              <li class="foot-col__note">${esc(site.contact.hours)} · ${esc(site.contact.reply)}</li>
              <li class="foot-col__note">${esc(site.location.area)}</li>
            </ul>
          </div>
          <div class="foot-col">
            <p class="foot-col__head label">Social</p>
            <ul class="foot-col__list">
              ${site.social.map((s) => `<li><a class="foot-link" href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}<span class="foot-link__ext" aria-hidden="true">${icon('arrowUpRight')}</span><span class="sr-only"> (nuova scheda)</span></a></li>`)}
            </ul>
            <p class="foot-col__head label">Note</p>
            <ul class="foot-col__list">${notes.map((n) => `<li>${flink(n)}</li>`)}</ul>
          </div>
        </div>

        <div class="foot-sign" data-reveal="draw">
          ${puppet('airone', { className: 'foot-sign__guard foot-sign__pup foot-sign__pup--airone' })}
          ${puppet('lumaca', { className: 'foot-sign__guard foot-sign__guard--l' })}
          <div class="foot-sign__center">
            ${puppet('vespa', { className: 'foot-sign__guard foot-sign__pup foot-sign__pup--vespa' })}
            <a class="foot-sign__mark" href="/" aria-label="${esc(site.monogram)} — ${esc(site.name)}, pagina iniziale">
              <span class="foot-sign__float" data-parallax="0.04">${signature()}</span>
            </a>
          </div>
          ${mascot('tartaruga', { className: 'foot-sign__guard foot-sign__guard--r' })}
          ${puppet('gazza', { className: 'foot-sign__guard foot-sign__pup foot-sign__pup--gazza' })}
          <p class="foot-sign__name">${esc(site.name)}</p>
          <p class="foot-sign__tag">${esc(site.title)} · ${esc(site.tagline)}</p>
        </div>

        <div class="foot-legal" data-reveal="fade">
          <p class="foot-legal__id label">© ${year} ${esc(site.name)} · ${esc(legal)} · ${esc(site.location.city)} (${esc(site.location.province)}), Italia</p>
          <p class="foot-legal__credit label"><a class="uline" href="${esc(site.url)}" rel="author">Sito di ${esc(site.name)}</a> · ${esc(site.edition)}</p>
          <!-- Distintivo FrogDR col Domain Rating del dominio: è l'unica immagine
               caricata da un server esterno (vedi «Risorse di terze parti» in /cookie/). -->
          <a class="foot-legal__badge" href="https://frogdr.com/albertopecchini.it?utm_source=albertopecchini.it" target="_blank" rel="noopener"><img src="https://frogdr.com/albertopecchini.it/badge-dark-tiny.svg?round=1" alt="Domain Rating di albertopecchini.it misurato da FrogDR" width="224" height="20" loading="lazy" decoding="async"><span class="sr-only"> (nuova scheda)</span></a>
          <a class="foot-top link" href="#main" data-top><span class="link__label">Torna su</span>${icon('arrowUp')}</a>
        </div>

      </div>
    </footer>
  `
}

// ── Elementi globali ─────────────────────────────────────────────────────────

function globals() {
  return html`
    <div class="curtain" aria-hidden="true" data-curtain>
      <div class="curtain__panel"></div>
      <div class="curtain__mark">${monogram({ className: 'monogram--draw' })}<span class="label" data-curtain-label>${esc(site.name)}</span></div>
    </div>
    <div class="lume" aria-hidden="true" data-lume></div>
    <div class="cursor" aria-hidden="true" data-cursor-el><span class="cursor__label"></span></div>
    <div class="preview" aria-hidden="true" data-preview-el></div>
    <div class="lightbox" role="dialog" aria-modal="true" aria-label="Galleria immagini" data-theme="ink" data-lightbox-el hidden>
      <div class="lightbox__bar">
        <p class="label lightbox__count" aria-live="polite"><span data-lb-current>01</span> / <span data-lb-total>01</span></p>
        <div class="lightbox__tools">
          <button class="lightbox__btn" type="button" data-lb-full aria-label="Schermo intero">${icon('expand')}</button>
          <button class="lightbox__btn" type="button" data-lb-close aria-label="Chiudi la galleria">${icon('close')}</button>
        </div>
      </div>
      <button class="lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="Immagine precedente">${icon('arrowLeft')}</button>
      <div class="lightbox__stage" data-lb-stage></div>
      <button class="lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="Immagine successiva">${icon('arrow')}</button>
      <p class="lightbox__caption label" data-lb-caption></p>
    </div>
  `
}

// ── Dati strutturati condivisi ───────────────────────────────────────────────

export const personLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': abs('/#person'),
  name: site.name,
  url: site.url,
  jobTitle: site.roles.map((r) => r.label),
  description: site.description,
  email: `mailto:${site.contact.email}`,
  address: { '@type': 'PostalAddress', addressLocality: site.location.city, addressRegion: site.location.region, postalCode: site.location.cap, addressCountry: site.location.country },
  knowsAbout: ['Rilievo topografico', 'Catasto', 'AutoCAD', 'BIM', 'Web design', 'Sviluppo frontend', 'Brand identity', 'Graphic design', 'Assistenza informatica', 'Microsoft Windows', 'Microsoft Office'],
  sameAs: site.social.map((s) => s.url),
})

export const serviceLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': abs('/#studio'),
  name: `${site.name} — ${site.title}`,
  url: site.url,
  image: abs('/og.png'),
  description: site.description,
  founder: { '@id': abs('/#person') },
  email: site.contact.email,
  telephone: site.contact.phone,
  priceRange: '€€',
  // Nessuno `streetAddress`: l'indirizzo di casa resta fuori dai dati strutturati.
  address: { '@type': 'PostalAddress', addressLocality: site.location.city, addressRegion: site.location.province, postalCode: site.location.cap, addressCountry: site.location.country },
  geo: { '@type': 'GeoCoordinates', latitude: site.location.lat, longitude: site.location.lon },
  areaServed: ['Mantova', 'Lombardia', 'Emilia-Romagna', 'Veneto', 'Italia'],
  // Nessun `openingHoursSpecification`: si riceve su appuntamento, non a orari fissi.
  availableLanguage: 'it',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servizi',
    itemListElement: serviceAreas.map((a) => ({ '@type': 'OfferCatalog', name: a.title, itemListElement: a.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.text } })) })),
  },
})

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: abs(it.href) })),
})

export { abs, COORDS }
