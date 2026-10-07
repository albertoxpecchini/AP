import { html, esc } from '../html.js'
import { site, stats, cta } from '../../data/site.js'
import { projects, byArea, bySlug, areas } from '../../data/projects.js'
import { serviceAreas } from '../../data/services.js'
import { steps } from '../../data/method.js'
import { bio, photos, facts } from '../../data/studio.js'
import { button, textLink, sectionHead, media, picture, stat, icon, splitWords, figurina, figName } from '../components/ui.js'
import { siteCard, indexRow } from '../components/project.js'
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
    <div class="hero__stage" data-hero data-reveal="up" style="--d:230ms">
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

function hero() {
  const sites = heroSites()
  const tilts = [-1.3, 0.9, -0.7, 1.2]
  return html`
    <section class="hero" data-section="Intro" aria-labelledby="hero-title">
      <div class="hero__glow" aria-hidden="true"></div>
      <div class="hero__lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="container hero__wrap" data-ink>
        <div class="hero__hello" data-reveal="up" style="--d:30ms">
          <p class="hero__hi">
            <span class="hero__avatar"><span class="hero__avatar-ph"><img src="${photos.avatar.src}" width="${photos.avatar.width}" height="${photos.avatar.height}" sizes="2.75rem" alt="" decoding="async" fetchpriority="high"></span>${site.availability.open ? '<span class="hero__avatar-dot" aria-hidden="true"></span>' : ''}</span>
            <span class="hero__hi-text">Ciao, sono</span>
          </p>
          <p class="hero__place label">${esc(site.location.city)} — Italia<span class="hero__coords"> · ${COORDS}</span></p>
          <p class="hero__avail label" data-ink-bed><span class="dot${site.availability.open ? ' dot--live' : ''}" aria-hidden="true"></span>${esc(site.availability.label)}</p>
        </div>

        <h1 class="hero__title" id="hero-title">
          <span class="hero__name" aria-hidden="true"><span class="hero__word"><span>Alberto</span></span> <span class="hero__word hero__word--2"><span data-ink-word>Pecchini</span></span></span>
          <span class="sr-only">${esc(site.name)} — ${site.roles.map((r) => esc(r.label)).join(', ')} a ${esc(site.location.city)}</span>
        </h1>
        <div class="rule rule--ticks hero__rule" data-ink-rule aria-hidden="true"></div>

        <div class="hero__body">
          <div class="hero__pitch">
            <p class="hero__kicker" data-reveal="up" style="--d:120ms"><span class="hero__slashes" aria-hidden="true">//</span><span class="hero__pill">casa · sito · marchio</span><span>un solo referente</span></p>
            <p class="hero__myth" data-reveal="up" style="--d:160ms">
              <s><span class="hero__strike">“Servono tre</span> <span class="hero__strike hero__strike--2">professionisti.”</span></s>
              <strong class="hero__stamp">Falso</strong>
            </p>
            <p class="hero__claim" data-reveal="up" style="--d:200ms">Ne basta <em class="serif-i">uno.</em></p>
            <p class="hero__lead" data-reveal="up" style="--d:240ms">Diplomato geometra a ${esc(site.location.city)}: rilevo e disegno edifici, scrivo siti web a mano, costruisco marchi. Con lo stesso metodo e la stessa cura.</p>
            <div class="hero__actions" data-reveal="up" style="--d:280ms">
              ${button({ href: cta.href, label: cta.label, size: 'lg', magnetic: true })}
              <button class="hero__copy" type="button" data-hero-copy="${esc(site.contact.email)}">
                <span class="hero__copy-ask"><span class="hero__copy-fine">Premi <kbd>C</kbd> per copiare la mia email</span><span class="hero__copy-touch">Tocca per copiare la mia email</span></span>
                <span class="hero__copy-done" aria-hidden="true"><span class="hero__copy-tick">✓</span> Copiata: ${esc(site.contact.email)}</span>
                ${figurina('hero-email', { className: 'hero__copy-fig', lazy: false, sizes: '3rem' })}
              </button>
            </div>
            <ul class="hero__trust label" data-reveal="up" style="--d:320ms">
              <li>Primo colloquio gratuito</li>
              <li>Preventivo scritto</li>
              <li>${esc(site.contact.reply.replace(/\.$/, ''))}</li>
            </ul>
          </div>

          ${heroTerminal()}

          <div class="hero__live" data-reveal="up" style="--d:380ms">
            <p class="hero__live-label label">${figurina('hero-online', { className: 'hero__live-fig', sizes: '2rem' }) || '<span class="dot dot--live" aria-hidden="true"></span>'}<span>Online adesso</span><span class="hero__live-note">${sitesPhrase(sites.length)} veri: aprili</span></p>
            <ul class="hero__sites">
              ${sites.map(
                ({ p, here, href }, i) => html`
                  <li>
                    <a class="hsite" href="${href}"${here ? '' : ' target="_blank" rel="noopener"'} style="--r:${tilts[i % tilts.length]}deg">
                      <span class="hsite__shot">${picture({ ...p.web.desktop, alt: '' }, { sizes: '(min-width: 1100px) 6rem, (min-width: 768px) 23vw, 45vw' })}</span>
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
          </div>
        </div>
      </div>
    </section>
  `
}

function disciplines() {
  const cards = [
    // niente disegni tecnici in vista: l'area si presenta con l'illustrazione di un suo progetto
    { area: serviceAreas[0], count: byArea('tecnico').length, href: '/portfolio/tecnico/', image: { ...bySlug('layout-cantiere').cover, alt: 'Illustrazione in assonometria di un cantiere con l’autogru in minio' } },
    // Il sito in vetrina è questo: il primo schermo della home, quotato (src/art/sitespec.js);
    // `variant`: schermi · rilievo · scala · sistema.
    { area: serviceAreas[1], count: byArea('web').length, href: '/portfolio/web/', image: { art: 'sitespec', variant: 'schermi', alt: 'Il primo schermo della home di Alberto Pecchini a tre larghezze, desktop, tablet e telefono, con le misure' } },
    // La grafica resta una delle tre discipline anche senza progetti pubblicati:
    // finché l'area è nascosta la scheda rimanda ai servizi invece che al portfolio.
    // L'immagine è l'identità di questo sito, quotata (src/art/identity.js);
    // `variant`: fogli · tavola · notte · sistema.
    { area: serviceAreas[2], count: byArea('grafica').length, href: areas.grafica ? '/portfolio/grafica/' : '/servizi/#grafica', image: { art: 'identity', variant: 'fogli', alt: 'Tre tavole di costruzione dell’identità di Alberto Pecchini: marchio, icona e logotipo' } },
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
              <a class="disc__card" href="${c.href}" data-reveal="up" style="--d:${i * 65}ms" data-cursor="Vedi">
                <div class="disc__top label"><span>${c.area.letter} — ${esc(c.area.title)}</span>${c.count ? `<span>${String(c.count).padStart(2, '0')} progetti</span>` : ''}</div>
                ${media(c.image, { ratio: '4/3', reveal: null, caption: null, className: 'disc__media' })}
                <h2 class="disc__title h3">${esc(c.area.lead)}</h2>
                <p class="disc__list">${c.area.services.slice(0, 5).map((s) => esc(s.title)).join(' · ')}</p>
                <span class="link disc__link"><span class="link__label">${esc(c.count ? (c.area.title === 'Digitale' ? 'Progetti web' : c.area.title === 'Grafica' ? 'Progetti grafici' : 'Progetti tecnici') : 'Come lavoro')}</span>${icon('arrow')}</span>
              </a>
            `,
          )}
        </div>
      </div>
    </section>
  `
}

// Carosello dei siti: su desktop una griglia ferma, su telefono e tablet
// una fila che scorre col dito (scroll-snap nativo, vedi initCarousel).
function selected() {
  const list = webSites()
  const allOnline = list.every((p) => p.web.url)
  const total = String(list.length).padStart(2, '0')
  return html`
    <section class="section wsel" id="siti" data-carousel data-section="Siti web" aria-labelledby="sel-title">
      <div class="container wsel__head">
        <p class="label" data-reveal="fade"><span class="sec-head__index">02</span>Siti web</p>
        <h2 class="h2 wsel__title" id="sel-title" data-reveal="up">${sitesPhrase(list.length)}${allOnline ? ', <em class="serif-i">tutti online</em>' : ''}</h2>
        <div class="wsel__aside">
          ${figurina('computer-siti', { className: 'wsel__fig' })}
          <p class="wsel__lead" data-reveal="up">Progettati e scritti a mano, dal primo schizzo alla messa online. Sono tutti pubblicati: puoi aprirli e provarli davvero.</p>
          <div class="wsel__tools" data-reveal="fade">${textLink({ href: '/portfolio/web/', label: 'Tutti i progetti web' })}</div>
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

// Come si lavora sul web: solo testo. I siti veri sono già nel carosello qui sopra.
function webTeaser() {
  return html`
    <section class="section webt" id="web" data-theme="ink" data-section="Web">
      <div class="container webt__grid">
        <div class="webt__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">03</span>Web design e sviluppo</p>
          <h2 class="h1 webt__title" data-reveal="words">${splitWords('Anche un sito si progetta in scala.', { accent: ['scala.'] })}</h2>
          ${figurina('computer-postazione', { className: 'webt__desk' })}
        </div>
        <div class="webt__side">
          <p class="lead" data-reveal="up">Struttura prima dell’estetica, contenuti veri prima dei layout, prestazioni misurate. Scrivo il codice a mano: niente temi, niente page builder.</p>
          <ul class="webt__points" data-reveal="up">
            <li><span class="label">01</span><span>Mobile progettato a parte, non ridotto</span>${figurina('computer-mobile', { className: 'webt__fig' })}</li>
            <li><span class="label">02</span><span>HTML semantico, accessibile da tastiera</span>${figurina('computer-tastiera', { className: 'webt__fig' })}</li>
            <li><span class="label">03</span><span>Dominio, hosting e sorgenti intestati a te</span>${figurina('computer-dominio', { className: 'webt__fig' })}</li>
          </ul>
          <div data-reveal="up">${textLink({ href: '/servizi/#digitale', label: 'I servizi web' })}</div>
        </div>
      </div>
    </section>
  `
}

// Le voci in vetrina nella home: cinque per area, di lunghezza simile, così
// le righe pesano uguale. L'elenco completo sta in /servizi/.
const HOME_ITEMS = {
  informatica: ['Pulizia da virus', 'Backup e recupero dati', 'Stampanti e scanner', 'Windows', 'Rete e Wi-Fi'],
}
const homeItems = (a) => HOME_ITEMS[a.key] || a.services.slice(0, 5).map((s) => s.title)

function services() {
  return html`
    <section class="section svc" data-section="Servizi">
      <div class="container">
        ${sectionHead({ index: '04', label: 'Servizi', title: 'Quattro aree, un interlocutore', meta: `${serviceAreas.reduce((n, a) => n + a.services.length, 0)} servizi`, link: { href: '/servizi/', label: 'Tutti i servizi' } })}
        <ul class="svc__rows">
          ${serviceAreas.map(
            (a, i) => html`
              <li class="svc__row" data-reveal="up" style="--d:${i * 50}ms">
                <a class="svc__link" href="/servizi/#${a.key}">
                  <span class="svc__letter label">${a.letter}</span>
                  <span class="svc__name">${esc(a.title)}</span>
                  <span class="svc__items">${homeItems(a).map((t) => `<span>${esc(t)}</span>`).join('')}</span>
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
    <section class="section mth" id="metodo" data-section="Metodo">
      <div class="container">
        ${sectionHead({ index: '06', label: 'Metodo di lavoro', title: 'Sette fasi, sempre le stesse', lead: 'Dal primo incontro all’assistenza dopo la consegna: sai sempre a che punto siamo e cosa succede dopo.', link: { href: '/metodo/', label: 'Il metodo nel dettaglio' } })}
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

function studio() {
  return html`
    <section class="section std" id="studio" data-section="Studio">
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
