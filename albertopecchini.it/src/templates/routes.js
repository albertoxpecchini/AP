// Tabella delle rotte: ogni voce produce una pagina statica.
// Usata dal plugin `plugins/site-pages.js` sia in sviluppo sia in build.

import { site, placeholders } from '../data/site.js'
import { projects, areas, allAreas } from '../data/projects.js'
import { renderArt } from '../art/index.js'
import { layout, personLd, serviceLd, breadcrumbLd, abs } from './layout.js'
import { homePage } from './pages/home.js'
import { portfolioPage, tecnicoPage, webPage, graficaPage } from './pages/portfolio.js'
import { caseStudyPage, caseStudyLd } from './pages/case-study.js'
import { serviziPage, metodoPage, studioPage, profiloPage } from './pages/info.js'
import { contattiPage } from './pages/contact.js'
import { privacyPage, cookiePage, creditiPage, notFoundPage } from './pages/legal.js'
import { stilePage } from './pages/stile.js'
import { tavolePage, sheetCount, hasSheets } from './pages/tavole.js'
import { emailPage } from './pages/email.js'
import { assistenzaPage, assistenzaContattiPage } from './pages/assistenza.js'
import { assistenza } from '../data/assistenza.js'

const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: 'it-IT',
  publisher: { '@id': abs('/#person') },
})

const crumbs = (...items) => breadcrumbLd([{ label: 'Home', href: '/' }, ...items])

export const routes = [
  {
    path: '/',
    priority: 1,
    title: `${site.name} — Disegno tecnico, Web Design e Grafica a Mantova`,
    description: site.description,
    render: homePage,
    jsonld: () => [websiteLd(), personLd(), serviceLd()],
  },
  {
    path: '/portfolio/',
    priority: 0.9,
    title: 'Portfolio — progetti tecnici, web e grafici',
    description: `${projects.length} progetti tra rilievi, pratiche, modelli 3D, siti web e identità visive. Filtra per categoria, anno, settore, tecnologia e tipologia.`,
    render: portfolioPage,
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' })],
  },
  {
    path: '/portfolio/tecnico/',
    priority: 0.8,
    title: 'Progetti tecnici — rilievi, CAD, BIM, catasto, pratiche edilizie',
    description: 'Rilievi con laser scanner e drone, progetti di recupero, pratiche edilizie e catastali, modelli 3D e BIM, cantieri: schede complete di dati, strumenti e risultati.',
    render: tecnicoPage,
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Tecnico', href: '/portfolio/tecnico/' })],
  },
  {
    path: '/portfolio/web/',
    priority: 0.8,
    title: 'Progetti web — siti, landing page, interfacce',
    description: 'Siti web progettati e sviluppati a mano: obiettivo, problema, soluzione, tecnologie e risultati, con mockup desktop, tablet e smartphone.',
    render: webPage,
    headerTheme: 'ink',
    jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Web', href: '/portfolio/web/' })],
  },
  // L'area Grafica è nascosta finché non c'è un lavoro reale da mostrare
  // (`hidden` su allAreas.grafica in src/data/projects.js): la pagina
  // /portfolio/grafica/ non viene generata e graficaPage resta pronta.
  ...(areas.grafica
    ? [
        {
          path: '/portfolio/grafica/',
          priority: 0.8,
          title: 'Progetti grafici — logo, brand identity, stampa, segnaletica',
          description: 'Marchi costruiti su griglia, restyling, immagine coordinata, manifesti, packaging, pittogrammi e modelli: il graphic design con il rigore di una tavola tecnica.',
          render: graficaPage,
          jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Grafica', href: '/portfolio/grafica/' })],
        },
      ]
    : []),
  // Le tavole vere si vedono solo con `showSheets` acceso (src/data/projects.js):
  // spento, la pagina non viene generata e la voce sparisce dal menù.
  ...(hasSheets()
    ? [
        {
          path: '/portfolio/tavole/',
          priority: 0.7,
          title: 'Tavole — il visualizzatore dei disegni',
          description: `${sheetCount()} tavole dei miei progetti tecnici, dal DWG allo schermo: progetto stradale, esame di Stato, layout di cantiere. Ingrandisci, spostati sul foglio, scarica il PDF.`,
          render: tavolePage,
          pageClass: 'page--tavole',
          noFooter: true, // il visualizzatore occupa tutta la finestra: niente chiusura sotto
          jsonld: () => [crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: 'Tavole', href: '/portfolio/tavole/' })],
        },
      ]
    : []),
  ...projects.map((p) => ({
    path: `/portfolio/${p.slug}/`,
    priority: p.featured ? 0.7 : 0.6,
    ogType: 'article',
    title: `${p.title} — ${p.subtitle}`,
    description: p.summary,
    render: () => caseStudyPage(p),
    jsonld: () => [caseStudyLd(p, abs), crumbs({ label: 'Portfolio', href: '/portfolio/' }, { label: allAreas[p.area].short, href: allAreas[p.area].href }, { label: p.title, href: `/portfolio/${p.slug}/` })],
  })),
  {
    path: '/servizi/',
    priority: 0.9,
    title: 'Servizi — tecnico, digitale, grafica',
    description: 'Progettazione, rilievi, CAD, catasto, pratiche, 3D, BIM e rendering; siti web, UI/UX e frontend; logo, branding e stampati. Per ogni servizio, cosa viene consegnato.',
    render: serviziPage,
    jsonld: () => [crumbs({ label: 'Servizi', href: '/servizi/' }), serviceLd()],
  },
  {
    path: '/studio/',
    priority: 0.8,
    title: 'Studio — chi sono, approccio, percorso',
    description: 'Alberto Pecchini: formazione tecnica, tre anni in un ufficio di strutture in legno, siti web e identità visive. Approccio, valori, timeline e strumenti di lavoro.',
    render: studioPage,
    jsonld: () => [crumbs({ label: 'Studio', href: '/studio/' }), personLd()],
  },
  {
    path: '/studio/profilo/',
    priority: 0.5,
    title: 'Profilo e curriculum',
    description: 'Curriculum di Alberto Pecchini: formazione, esperienze, competenze tecniche, web e grafiche. Versione stampabile.',
    render: profiloPage,
    jsonld: () => [crumbs({ label: 'Studio', href: '/studio/' }, { label: 'Profilo', href: '/studio/profilo/' })],
  },
  {
    path: '/metodo/',
    priority: 0.7,
    title: 'Metodo di lavoro — sette fasi dall’ascolto all’assistenza',
    description: 'Ascolto, analisi, progettazione, sviluppo, revisione, consegna, assistenza: come si svolge un incarico, cosa ricevi a ogni fase e in quanto tempo.',
    render: metodoPage,
    jsonld: () => [crumbs({ label: 'Metodo', href: '/metodo/' })],
  },
  {
    path: '/contatti/',
    priority: 0.9,
    title: 'Contatti — parliamo del progetto',
    description: 'Scrivimi per un rilievo, una pratica, un sito web o un’identità visiva. Studio a Mantova, risposta entro un giorno lavorativo.',
    render: contattiPage,
    hideCta: true, // la pagina è già la chiamata all'azione: niente CTA che rimanda a sé stessa
    // Turnstile serve solo qui: lo script non viene caricato sulle altre pagine.
    head: site.form.turnstileSiteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>' : '',
    jsonld: () => [crumbs({ label: 'Contatti', href: '/contatti/' }), serviceLd()],
  },
  {
    path: '/stile/',
    priority: 0.4,
    title: 'Stile — il sistema visivo del sito',
    description: 'Colore, tipografia, forma, movimento e componenti del sito di Alberto Pecchini in cinque tavole su un piano navigabile: ingrandisci e spostati come su un tavolo da disegno.',
    render: stilePage,
    pageClass: 'page--stile',
    noFooter: true, // la pagina è il piano a tutto schermo: niente chiusura sotto
    jsonld: () => [crumbs({ label: 'Stile', href: '/stile/' })],
  },
  {
    // Strumento privato: non è nei menu, nel footer, nella sitemap né nei motori
    // di ricerca (noindex + X-Robots-Tag in vercel.json). Si raggiunge solo dal
    // link diretto, che porta anche la chiave di accesso: /email/?k=…
    path: '/email/',
    title: 'Compositore email',
    description: 'Strumento privato per scrivere, controllare, migliorare con l’IA e copiare le email di Alberto Pecchini.',
    render: emailPage,
    pageClass: 'page--email',
    noindex: true,
    noFooter: true,
    hideCta: true,
  },
  {
    // «Better Call Pekko»: l'assistenza informatica come il sito americano del
    // 2008 di Pekko, «the computer guy», tutto in inglese. Pagine autonome
    // (standalone): niente guscio del portfolio, stile e script in linea nel
    // template. Ogni banner porta a /contatti/assistenza/, mai a /contatti/.
    path: assistenza.path,
    priority: 0.6,
    title: assistenza.titolo,
    description: assistenza.descrizione,
    render: assistenzaPage,
    standalone: true,
  },
  {
    path: assistenza.contatti,
    priority: 0.5,
    title: assistenza.titoloContatti,
    description: assistenza.descrizioneContatti,
    render: assistenzaContattiPage,
    standalone: true,
  },
  { path: '/privacy/', priority: 0.2, title: 'Informativa sulla privacy', description: 'Come vengono trattati i dati personali di chi visita il sito o invia una richiesta.', render: privacyPage, hideCta: true },
  { path: '/cookie/', priority: 0.2, title: 'Cookie policy', description: 'Il sito non usa cookie di profilazione: ecco cosa viene salvato nel browser e perché.', render: cookiePage, hideCta: true },
  { path: '/crediti/', priority: 0.2, title: 'Crediti e fonti delle immagini', description: 'Da dove vengono le immagini del sito: disegni e foto originali, illustrazioni generate con gpt-image-2, mockup della Figma Community.', render: creditiPage, hideCta: true },
  {
    path: '/404/',
    file: '404.html',
    is404: true,
    title: 'Punto non trovato (404)',
    description: 'La pagina cercata non esiste o è stata spostata: torna alla home o apri il portfolio di Alberto Pecchini.',
    render: notFoundPage,
    headerTheme: 'ink',
    noindex: true,
    hideCta: true,
  },
]

const normalize = (pathname) => {
  let p = pathname.replace(/index\.html$/, '')
  if (!p.endsWith('/') && !p.endsWith('.html')) p += '/'
  return p
}

/** Renderizza la pagina di un percorso. Restituisce { html, status }. */
export function renderRoute(pathname, { assets }) {
  const wanted = normalize(pathname)
  const route = routes.find((r) => r.path === wanted) || routes.find((r) => r.is404)
  const status = route.is404 ? 404 : 200
  // Le pagine autonome producono da sole l'intero documento.
  if (route.standalone) return { html: route.render({ route, assets }), status }
  const page = layout({
    route,
    title: route.title,
    description: route.description,
    body: route.render(),
    assets,
    jsonld: route.jsonld ? route.jsonld() : [],
    headerTheme: route.headerTheme,
    noindex: route.noindex,
    hideCta: route.hideCta,
    head: route.head,
    pageClass: route.pageClass || (route.is404 ? 'page--404' : route.path === '/' ? 'page--home' : undefined),
  })
  return { html: page, status }
}

export function renderSitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes
    .filter((r) => !r.noindex && !r.devOnly)
    .map((r) => `  <url><loc>${abs(r.path)}</loc><lastmod>${today}</lastmod><priority>${r.priority ?? 0.5}</priority></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const renderRobots = () => `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${abs('/sitemap.xml')}\n`

export const placeholderReport = () => placeholders

// ── Miniature /art/<slug>.svg ────────────────────────────────────────────────
// Le copertine generate vengono esportate anche come file SVG autonomi, usati
// dalle anteprime al passaggio del puntatore (caricate solo quando servono).

const STANDALONE_FONTS = `:root{--font-sans:system-ui,-apple-system,'Segoe UI',sans-serif;--font-mono:ui-monospace,'SF Mono','Cascadia Mono',Consolas,monospace;--font-serif:Georgia,'Times New Roman',serif}`

export function artFiles(css) {
  return projects
    .filter((p) => !(p.area === 'web' ? p.web?.desktop?.src : p.cover?.src))
    .map((p) => {
      const image = p.area === 'web' && p.web ? p.web.desktop : p.cover
      const { caption, ...spec } = image
      const svg = renderArt(spec).replace(/(<svg[^>]*>)/, `$1<style>${css}${STANDALONE_FONTS}</style>`)
      return { path: `/art/${p.slug}.svg`, body: svg }
    })
}
