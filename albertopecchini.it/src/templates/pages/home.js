// La home, nell'ordine di reflection.ai (2.11.2026): hero centrato con l'invito e
// il terminale · l'idea in una frase · le quattro aree in schede · i siti web in
// vetrina col carosello · la fila dei siti online che scorre · il manifesto a
// tutta larghezza · le tre convinzioni · il metodo · i numeri · lo studio ·
// l'indice degli ultimi lavori. L'invito finale sta nel piè di pagina.

import { html, esc } from '../html.js'
import { site, stats, cta } from '../../data/site.js'
import { projects, byArea } from '../../data/projects.js'
import { serviceAreas } from '../../data/services.js'
import { steps } from '../../data/method.js'
import { bio, photos, facts } from '../../data/studio.js'
import { button, textLink, sectionHead, media, picture, stat, icon, splitWords, figurina, figName } from '../components/ui.js'
import { siteCard, indexRow } from '../components/project.js'
import { versioni } from '../../data/tempo.js'
import { COORDS } from '../layout.js'

// I siti mostrati nel carosello: prima quelli in evidenza, poi gli altri.
const webSites = () => [...byArea('web')].filter((p) => p.web).sort((a, b) => Number(b.featured) - Number(a.featured))

const NUMBERS = ['Zero', 'Un', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto', 'Nove', 'Dieci']
const sitesPhrase = (n) => (n === 1 ? 'Un sito' : `${NUMBERS[n] || n} siti`)

// Il terminale dell'hero: un comando per ogni cosa che un cliente può chiedere.
// Ogni comando ha il suo adesivo (foglio «hero» in tools/figurine), quattro
// righe di fatti — gli stessi delle pagine Servizi e Metodo — e il rimando alla
// pagina dove continuare. Il primo, «tutto», è quello che si vede senza script.
const heroCommands = () => {
  const online = webSites().filter((p) => p.web.url).length
  return [
    {
      key: 'tutto',
      rows: [['casa', 'rilievo, CAD, 3D'], ['sito', 'scritto a mano'], ['marchio', 'disegnato su griglia'], ['computer', 'virus, backup, Wi-Fi']],
      link: { href: '/servizi/', label: 'tutti i servizi' },
    },
    {
      key: 'casa',
      rows: [['rilievo', 'al millimetro'], ['disegni', 'DWG e PDF in scala'], ['modello 3D', 'viste e assonometrie'], ['sorgenti', 'sempre consegnati']],
      link: { href: '/portfolio/tecnico/', label: 'i progetti tecnici' },
    },
    {
      key: 'sito',
      rows: [['online adesso', sitesPhrase(online).toLowerCase()], ['codice', 'scritto a mano'], ['telefono', 'progettato a parte'], ['dominio', 'intestato a te']],
      link: { href: '#siti', label: 'apri i siti' },
    },
    {
      key: 'marchio',
      rows: [['logo', 'disegnato su griglia'], ['versioni', 'positivo e negativo'], ['file', 'vettoriali'], ['stampa', 'PDF per la tipografia']],
      link: { href: '/servizi/#grafica', label: 'i servizi grafici' },
    },
    {
      key: 'pc',
      rows: [['virus', 'tolti, e non tornano'], ['dati', 'copiati prima di tutto'], ['Windows', 'installato e aggiornato'], ['stampante', 'che stampa']],
      link: { href: '/servizi/informatica/', label: 'l’assistenza informatica' },
    },
  ]
}

// I siti online, in piccolo: la prova che si può aprire subito. Questo sito non
// rimanda a sé stesso ma alla sua scheda.
const heroSites = () =>
  webSites()
    .filter((p) => p.web.url)
    .map((p) => {
      const here = p.web.url === site.url
      return { p, here, href: here ? `/portfolio/${p.slug}/` : p.web.url }
    })

function heroTerminal() {
  const commands = heroCommands()
  const total = String(commands.length).padStart(2, '0')
  return html`
    <div class="hero__stage" data-hero data-reveal="soft" style="--d:640ms">
      <div class="hero__stage-in" data-tilt>
        <div class="term">
          <div class="term__bar">
            <span class="term__lights" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="term__file">alberto.sh</span>
            <span class="term__count" aria-hidden="true"><span data-hero-n>01</span>/${total}</span>
          </div>
          <div class="term__tabs" role="group" aria-label="Cosa ti serve?">
            ${commands.map((c, i) => `<button class="term__tab${i === 0 ? ' is-active' : ''}" type="button" data-hero-go="${i}" aria-pressed="${i === 0}">${esc(c.key)}</button>`)}
          </div>
          <div class="term__screen">
            ${commands.map(
              (c, i) => html`
                <div class="term__panel${i === 0 ? ' is-active' : ''}" data-hero-panel="${i}">
                  <p class="term__cmd"><span class="term__prompt" aria-hidden="true">$</span><span data-hero-cmd="alberto --${esc(c.key)}">alberto --${esc(c.key)}</span></p>
                  <ul class="term__rows">
                    ${c.rows.map(([k, v], n) => `<li style="--i:${n}"><span class="term__ok" aria-hidden="true">✓</span><span class="term__k">${esc(k)}</span><span class="term__dots" aria-hidden="true"></span><span class="term__v">${esc(v)}</span></li>`)}
                  </ul>
                  <p class="term__out" style="--i:${c.rows.length}"><span aria-hidden="true">→ </span><a href="${c.link.href}">${esc(c.link.label)}</a><span class="term__cursor" aria-hidden="true"></span></p>
                </div>
              `,
            )}
          </div>
        </div>
        <div class="hero__stickers" aria-hidden="true">
          ${commands.map((c, i) => figurina(`hero-${c.key}`, { className: `hero__sticker${i === 0 ? ' is-active' : ''}`, lazy: i > 0, sizes: '(min-width: 900px) 17rem, 36vw' }).replace('<img', `<img data-hero-sticker="${i}"`))}
        </div>
      </div>
    </div>
  `
}

// ── Hero: tutto centrato, come il primo schermo di reflection ────────────────

function hero() {
  return html`
    <section class="hero" data-section="Intro" aria-labelledby="hero-title">
      <div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="container hero__wrap" data-ink>
        <div class="hero__eyebrow" data-reveal="up" style="--d:40ms">
          <span class="pill"><span class="hero__avatar"><img src="${photos.avatar.src}" width="${photos.avatar.width}" height="${photos.avatar.height}" sizes="1.5rem" alt="" decoding="async" fetchpriority="high"></span>${esc(site.location.city)}<span class="hero__coords"> · ${COORDS}</span></span>
          <span class="pill" data-ink-bed><span class="dot${site.availability.open ? ' dot--live' : ''}" aria-hidden="true"></span>${esc(site.availability.label)}</span>
        </div>
        <!-- il nome gigante com'era (Archivo stretto, il cognome in contorno che
             l'aragosta riempie d'inchiostro: client/ink.js), più piccolo di prima -->
        <p class="hero__name" aria-hidden="true"><span class="hero__word"><span>${esc(site.firstName)}</span></span> <span class="hero__word hero__word--2"><span data-ink-word>${esc(site.lastName)}</span></span></p>
        <h1 class="hero__title" id="hero-title" data-reveal="words" style="--d:140ms"><span class="sr-only">${esc(site.name)} — ${site.roles.map((r) => esc(r.label)).join(', ')} a ${esc(site.location.city)}. </span>${splitWords('Casa, sito, marchio. Un solo referente.', { accent: ['referente.'] })}</h1>
        <p class="hero__lead" data-reveal="up" style="--d:460ms">Diplomato geometra a ${esc(site.location.city)}: rilevo e disegno edifici, scrivo siti web a mano, costruisco marchi. Lo stesso metodo, la stessa cura.</p>
        <div class="hero__actions" data-reveal="up" style="--d:540ms">
          ${button({ href: cta.href, label: cta.label, size: 'lg', magnetic: true })}
          ${button({ href: '/portfolio/', label: 'Guarda i lavori', variant: 'ghost', size: 'lg' })}
        </div>
        <button class="hero__copy" type="button" data-hero-copy="${esc(site.contact.email)}" data-reveal="fade" style="--d:700ms">
          ${figurina('hero-email', { className: 'hero__copy-fig', lazy: false, sizes: '2.25rem' })}
          <span class="hero__copy-ask"><span class="hero__copy-fine">Premi <kbd>C</kbd> per copiare la mia email</span><span class="hero__copy-touch">Tocca per copiare la mia email</span></span>
          <span class="hero__copy-done" aria-hidden="true"><span class="hero__copy-tick">✓</span> Copiata: ${esc(site.contact.email)}</span>
        </button>
      </div>
      <div class="container hero__stage-wrap">${heroTerminal()}</div>
      <div class="container hero__beam" aria-hidden="true"><i></i></div>
    </section>
  `
}

// ── 01 · L'idea, in una frase ────────────────────────────────────────────────

function mission() {
  return html`
    <section class="section mission" id="idea" data-section="Idea">
      <div class="container mission__grid">
        <p class="label mission__label" data-reveal="fade"><span class="sec-head__index">01</span>L’idea</p>
        <div class="mission__body">
          <p class="mission__text" data-reveal="words">
            ${splitWords('Rilevo un edificio al millimetro, scrivo l’interfaccia che lo racconta, disegno il marchio di chi lo abita. Tre mestieri, un solo metodo: misurare, ordinare, rendere leggibile.', { accent: ['misurare,', 'ordinare,', 'leggibile.'] })}
          </p>
          <div data-reveal="up">${textLink({ href: '/studio/', label: 'Chi sono' })}</div>
        </div>
      </div>
    </section>
  `
}

// ── 02 · Le quattro aree, in schede ──────────────────────────────────────────

const AREA_FIG = { tecnico: 'tecnico-rilievi', digitale: 'digitale-siti-web', grafica: 'grafica-logo', informatica: 'informatica-pulizia-da-virus' }
const AREA_COUNT = { tecnico: () => byArea('tecnico').length, digitale: () => byArea('web').length, grafica: () => byArea('grafica').length }

function aree() {
  const total = serviceAreas.reduce((n, a) => n + a.services.length, 0)
  return html`
    <section class="section aree" id="aree" data-section="Aree">
      <div class="container">
        ${sectionHead({ index: '02', label: 'Quattro aree', title: 'Un solo interlocutore, dallo stato di fatto alla messa online.', meta: `${total} servizi`, link: { href: '/servizi/', label: 'Tutti i servizi' } })}
        <ul class="aree__grid" data-spot-group>
          ${serviceAreas.map((a, i) => {
            const count = AREA_COUNT[a.key]?.() || 0
            const href = a.portfolio && count ? a.portfolio : `/servizi/#${a.key}`
            return html`
              <li class="acard spot" data-spot data-reveal="up" style="--d:${i * 70}ms">
                <a class="acard__link" href="${href}" data-cursor="Vedi">
                  <p class="acard__top label"><span>${a.letter} — ${esc(a.title)}</span>${count ? `<span>${String(count).padStart(2, '0')} progetti</span>` : ''}</p>
                  ${figurina(AREA_FIG[a.key] || figName(a.key, a.services[0].title), { className: 'acard__fig' })}
                  <h3 class="acard__title h3">${esc(a.lead)}</h3>
                  <p class="acard__list">${(a.footer || a.services.slice(0, 3).map((s) => s.title)).map((t) => esc(t)).join(' · ')}</p>
                  <span class="link acard__more"><span class="link__label">${count ? 'I progetti' : 'Il servizio'}</span>${icon('arrow')}</span>
                </a>
              </li>
            `
          })}
        </ul>
      </div>
    </section>
  `
}

// ── 03 · I siti web in vetrina, col carosello ────────────────────────────────
// Desktop: griglia ferma; telefono e tablet: fila che scorre col dito
// (scroll-snap nativo, vedi initCarousel).

function selected() {
  const list = webSites()
  const allOnline = list.every((p) => p.web.url)
  const total = String(list.length).padStart(2, '0')
  return html`
    <section class="section wsel" id="siti" data-carousel data-section="Siti web" aria-labelledby="sel-title">
      <div class="container wsel__head">
        <div class="wsel__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">03</span>Siti web</p>
          <h2 class="h2 wsel__title" id="sel-title" data-reveal="words">${splitWords(`${sitesPhrase(list.length)}${allOnline ? ', tutti online.' : '.'}`, { accent: ['online.'] })}</h2>
        </div>
        <div class="wsel__aside">
          <p class="wsel__lead lead" data-reveal="up">Progettati e scritti a mano, dal primo schizzo alla messa online. Niente temi, niente page builder: struttura prima dell’estetica, contenuti veri prima dei layout, prestazioni misurate.</p>
          <div class="wsel__tools" data-reveal="up" style="--d:80ms">
            ${button({ href: '/portfolio/web/', label: 'I progetti web', variant: 'dark' })}
            ${button({ href: '/servizi/#digitale', label: 'I servizi web', variant: 'ghost' })}
          </div>
        </div>
      </div>
      <div class="wsel__viewport" data-carousel-viewport tabindex="-1" role="region" aria-label="Siti web">
        <div class="wsel__track">
          ${list.map((p, i) => siteCard(p, i))}
          <div class="wcard wcard--end" data-carousel-item>
            <a class="wcard__all" href="/portfolio/" data-cursor="Vai">
              <span class="label">Non solo siti</span>
              <span class="h3">Strade, edifici, cantieri: i progetti tecnici</span>
              <span class="wcard__all-foot"><span class="label">Tutti i progetti (${projects.length})</span>${icon('arrow')}</span>
            </a>
          </div>
        </div>
      </div>
      <div class="container wsel__foot">
        <div class="wsel__bar" aria-hidden="true"><span data-carousel-bar></span></div>
        <p class="label wsel__count" aria-hidden="true"><span data-carousel-current>01</span> / ${total}</p>
        <button class="wsel__btn" type="button" data-carousel-prev aria-label="Sito precedente" disabled>${icon('arrowLeft')}</button>
        <button class="wsel__btn" type="button" data-carousel-next aria-label="Sito successivo">${icon('arrow')}</button>
      </div>
    </section>
  `
}

// ── La fila dei siti online: scorre da sola, si ferma col mouse ──────────────
// (il posto dei loghi dei partner in reflection: qui i partner sono i siti veri)

function strip() {
  const sites = heroSites()
  if (!sites.length) return ''
  const list = (hidden) => html`
    <ul class="hero__sites strip__list"${hidden ? ' aria-hidden="true"' : ''}>
      ${sites.map(
        ({ p, here, href }) => html`
          <li>
            <a class="hsite" href="${href}"${here ? '' : ' target="_blank" rel="noopener"'}${hidden ? ' tabindex="-1"' : ''}>
              <span class="hsite__shot">${picture({ ...p.web.desktop, alt: '' }, { sizes: '10rem' })}</span>
              <span class="hsite__text">
                <span class="hsite__name">${esc(p.title)}</span>
                <span class="hsite__domain">${esc(p.web.domain)}</span>
              </span>
              <span class="hsite__badge${here ? ' hsite__badge--here' : ''}">${here ? 'Sei qui' : 'Online'}</span>
              <span class="hsite__arrow" aria-hidden="true">${icon(here ? 'arrow' : 'arrowUpRight')}</span>
              ${here ? '' : '<span class="sr-only"> (si apre in una nuova scheda)</span>'}
            </a>
          </li>
        `,
      )}
    </ul>
  `
  return html`
    <section class="strip" data-section="Online" aria-label="Siti online">
      <div class="container strip__head">
        <p class="label strip__label">${figurina('hero-online', { className: 'strip__fig', sizes: '2rem' }) || '<span class="dot dot--live" aria-hidden="true"></span>'}<span>Online adesso</span><span class="strip__note">${sitesPhrase(sites.length)} veri: aprili</span></p>
      </div>
      <div class="marquee" data-reveal="fade">
        <div class="marquee__track">${list(false)}${list(true)}</div>
      </div>
    </section>
  `
}

// ── La macchina del tempo: la novità, a metà home ────────────────────────────
// Alberto (3.11.2026): «metti a metà home questa novità con una frase simpatica».
// Quattro foto prese lungo la strada (la prima, due in mezzo, l'ultima) e il link.

function tempo() {
  const conFoto = versioni.filter((v) => v.d)
  if (!conFoto.length) return ''
  const prime = conFoto[0]
  const ultime = conFoto.at(-1)
  const scelte = [0, 1 / 3, 2 / 3, 1].map((t) => conFoto[Math.round(t * (conFoto.length - 1))])
  const data = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
  return html`
    <section class="section tmz" id="tempo" data-theme="tint" data-section="Tempo" aria-labelledby="tmz-title">
      <div class="container tmz__grid">
        <div class="tmz__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">↺</span>Novità · la macchina del tempo</p>
          <h2 class="h2 tmz__title" id="tmz-title" data-reveal="words">${splitWords(`Ho cambiato idea ${versioni.length} volte. Le ho tenute tutte.`, { accent: ['tenute', 'tutte.'] })}</h2>
          <p class="lead tmz__lead" data-reveal="up">Dal ${data(prime.data)} ogni giorno di lavoro è una versione di questo sito, ricostruita dal codice di allora: Figma Make, Bootstrap Italia, il neroverde del Sassuolo, il viola, i giochi, i burattini… fino a questa. Una copia della Wayback Machine, con l’istogramma dei miei commit.</p>
          <div class="tmz__actions" data-reveal="up" style="--d:80ms">
            ${button({ href: '/tempo/', label: 'Torna indietro nel tempo', variant: 'dark' })}
            <span class="label">${conFoto.length === versioni.length ? `${versioni.length} versioni` : `${conFoto.length} versioni pronte su ${versioni.length}`} · dal ${data(prime.data)} al ${data(ultime.data)}</span>
          </div>
        </div>
        <ul class="tmz__film" data-reveal="up" style="--d:120ms">
          ${scelte.map(
            (v, k) => html`
              <li class="tmz__frame" style="--i:${k}">
                <a href="/tempo/#v=${v.short}" aria-label="Il sito il ${data(v.data)}">
                  <span class="tmz__shot"><img src="/media/tempo/ap/${v.short}-d.webp" width="960" height="${v.d.h}" alt="" loading="lazy" decoding="async" data-no-srcset></span>
                  <span class="label tmz__date">${data(v.data)}</span>
                </a>
              </li>
            `,
          )}
        </ul>
      </div>
    </section>
  `
}

// ── Il manifesto a tutta larghezza ───────────────────────────────────────────
// La frase a sinistra, Alberto scontornato a destra (la foto «curioso» dello studio) (come il «The most
// important technology…» di reflection).

function banner() {
  const photo = photos.curious
  return html`
    <section class="section banner-wrap" data-section="Web">
      <div class="container--wide">
        <div class="banner" data-theme="ink" data-reveal="soft">
          <img class="banner__img" src="${photo.src}" srcset="${photo.small} 900w, ${photo.src} 1600w" sizes="(min-width: 1100px) 44rem, 90vw" width="${photo.width}" height="${photo.height}" alt="${esc(photo.alt)}" loading="lazy" decoding="async">
          <div class="banner__shade" aria-hidden="true"></div>
          <div class="banner__body">
            <p class="label banner__label" data-reveal="fade">Web design e sviluppo</p>
            <h2 class="banner__title" data-reveal="words">${splitWords('Anche un sito si progetta in scala.', { accent: ['scala.'] })}</h2>
            <p class="banner__lead" data-reveal="up">Mobile progettato a parte, HTML semantico accessibile da tastiera, dominio e sorgenti intestati a te.</p>
            <div data-reveal="up" style="--d:80ms">${button({ href: '/servizi/#digitale', label: 'Come lavoro sul web', variant: 'light' })}</div>
          </div>
        </div>
      </div>
    </section>
  `
}

// ── 04 · Le tre convinzioni ──────────────────────────────────────────────────

const CONVICTIONS = [
  { title: 'Misurare', text: 'Prima di disegnare si misura: un rilievo al millimetro, un contenuto letto davvero, un marchio provato in piccolo. Si progetta bene solo ciò che si è misurato bene.' },
  { title: 'Ordinare', text: 'Layer, griglie, cartelle, nomi. Quello che è in ordine si trova, si aggiorna e si consegna: a chi costruisce, a chi stampa, a chi verrà dopo di me.' },
  { title: 'Rendere leggibile', text: 'Una tavola, una pagina, un logo devono capirsi al primo sguardo, da chi li usa e da chi li paga. Meno effetti, più regole; e le regole scritte.' },
]

function convictions() {
  return html`
    <section class="section conv" id="convinzioni" data-theme="tint" data-section="Convinzioni">
      <div class="container">
        ${sectionHead({ index: '04', label: 'Convinzioni', title: 'Tre regole, per un rilievo come per un sito.', link: { href: '/metodo/', label: 'Il metodo nel dettaglio' } })}
        <ol class="conv__grid">
          ${CONVICTIONS.map(
            (c, i) => html`
              <li class="conv__item" data-reveal="up" style="--d:${i * 90}ms">
                <span class="conv__n label">0${i + 1}</span>
                <h3 class="conv__title">${esc(c.title)}</h3>
                <p class="conv__text">${esc(c.text)}</p>
              </li>
            `,
          )}
        </ol>
      </div>
    </section>
  `
}

// ── 05 · Il metodo, in sintesi ───────────────────────────────────────────────

function method() {
  return html`
    <section class="section mth" id="metodo" data-section="Metodo">
      <div class="container">
        ${sectionHead({ index: '05', label: 'Metodo di lavoro', title: 'Sette fasi, sempre le stesse.', lead: 'Dal primo incontro all’assistenza dopo la consegna: sai sempre a che punto siamo e cosa succede dopo.', link: { href: '/metodo/', label: 'Il metodo nel dettaglio' } })}
        <div class="mth__scroll" role="region" aria-label="Le sette fasi del metodo" data-scroll-region data-reveal="fade">
          <ol class="mth__track">
            ${steps.map(
              (s, i) => html`
                <li class="mth__step" style="--i:${i}">
                  <span class="mth__node" aria-hidden="true"></span>
                  ${figurina(figName('metodo', s.key), { className: 'mth__fig' })}
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

// ── 06 · I numeri ────────────────────────────────────────────────────────────

function numbers() {
  const computed = {
    projects: projects.length,
    sites: byArea('web').filter((p) => p.web?.url).length,
    years: new Date().getFullYear() - site.activeSince,
  }
  const list = stats.map((s) => ({ ...s, value: s.value ?? computed[s.key] }))
  return html`
    <section class="section nums" data-theme="ink" data-section="Numeri" aria-labelledby="nums-title">
      <div class="container">
        <div class="nums__head">
          <p class="label"><span class="sec-head__index">06</span>Numeri e dati</p>
          <h2 class="sr-only" id="nums-title">Numeri dello studio</h2>
          <p class="label nums__note">Aggiornati al ${new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div class="nums__grid">${list.map((s, i) => stat(s, i))}</div>
      </div>
    </section>
  `
}

// ── 07 · Lo studio ───────────────────────────────────────────────────────────

function studio() {
  return html`
    <section class="section std" id="studio" data-section="Studio">
      <div class="container std__card">
        <div class="std__photo">${media(photos.portrait, { ratio: '4/5', parallax: true })}</div>
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

// ── 08 · L'indice degli ultimi lavori ────────────────────────────────────────

function index() {
  const list = [...projects].sort((a, b) => b.year - a.year).slice(0, 10)
  return html`
    <section class="section idx" data-section="Indice">
      <div class="container">
        ${sectionHead({ index: '08', label: 'Indice dei progetti', title: 'Ultimi lavori.', meta: `${String(list.length).padStart(2, '0')} di ${projects.length}`, link: { href: '/portfolio/', label: 'Portfolio completo con filtri' } })}
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
    <span class="secind__n"><span data-secind-n>01</span> / <span data-secind-total>10</span></span>
    <span class="secind__bar"><i data-secind-bar></i></span>
    <span data-secind-name>Intro</span>
  </div>
`

export function homePage() {
  return [hero(), mission(), aree(), selected(), strip(), tempo(), banner(), convictions(), method(), numbers(), studio(), index(), sectionIndicator()].join('\n')
}
