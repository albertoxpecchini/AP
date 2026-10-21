// Cosa fotografare di ogni sito: formati di catalogo e catture per progetto.
// L'indirizzo di ogni sito viene da `web.url` in src/data/projects.js (qui solo
// quando va forzato); i file finiscono in public/media/web/. Vedi README.md.

// Formati di catalogo: viewport CSS → larghezza del file (l'altezza segue in proporzione).
// `alta` = pagina intera tagliata a quell'altezza CSS; `strisce` = pagina intera a strisce.
export const formati = {
  desktop: { viewport: [1440, 900], scala: 1, larghezza: 1200 },
  desktopTall: { viewport: [1440, 900], scala: 1, larghezza: 1200, alta: 3400 },
  tablet: { viewport: [820, 1180], scala: 1, larghezza: 720 },
  mobile: { viewport: [390, 844], scala: 2, larghezza: 600, telefono: true },
  mobileTall: { viewport: [390, 844], scala: 2, larghezza: 600, telefono: true, alta: 2600 },
  // iPhone 18 Pro del case study: 402 punti @2x, strisce sotto i 16.384 px di Chromium
  iphone: { viewport: [402, 812], scala: 2, larghezza: 804, telefono: true, strisce: 2400, qualita: 78 },
}

// Le cinque catture della home che usano i mockup (web.desktop … web.mobileTall).
const casa = (prefisso, percorso = '/') =>
  ['desktop', 'desktopTall', 'tablet', 'mobile', 'mobileTall'].map((formato) => ({
    file: `${prefisso}-${formato.replace('Tall', '-tall')}.webp`,
    percorso,
    formato,
  }))

// Porta un elemento a `margine` px dal bordo alto della finestra.
const scorriA = (selettore, margine = 0) => (page) =>
  page.evaluate(
    (s, m) => {
      const el = document.querySelector(s)
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - m)
    },
    selettore,
    margine,
  )

export const siti = {
  'rivaltasulmincio-it': {
    catture: [
      ...casa('rivalta'),
      // #place-049 = chiesa dei Santi Vigilio e Donato: la mappa la centra e apre la scheda
      { file: 'rivalta-mappa-desktop.webp', percorso: '/mappa#place-049', formato: 'desktop', prima: scorriA('.map-block', 20) },
      { file: 'rivalta-luogo-tablet.webp', percorso: '/luoghi/chiesa-santi-vigilio-e-donato', formato: 'tablet', viewport: [820, 1093] },
      {
        file: 'rivalta-mappa-mobile.webp',
        percorso: '/mappa#place-049',
        formato: 'mobile',
        prima: async (page) => {
          // un secondo clic sul marker scelto sposta la mappa sopra la scheda che sale dal basso
          await page.evaluate(() => document.querySelector('.leaflet-marker-icon .is-selected, .leaflet-marker-icon.is-selected')?.closest('.leaflet-marker-icon')?.click())
          await new Promise((r) => setTimeout(r, 600))
          await scorriA('.map-block', 12)(page)
        },
      },
    ],
  },

  'cascina-fontana': {
    catture: [
      ...casa('cascina'),
      { file: 'cascina-prodotti-desktop.webp', percorso: '/prodotti/', formato: 'desktop', prima: scorriA('#latte') },
      {
        file: 'cascina-galleria-tablet.webp',
        percorso: '/galleria/',
        formato: 'tablet',
        viewport: [820, 1093],
        prima: (page) => page.click('[data-photo="viale-platani"]'),
      },
      { file: 'cascina-contatti-mobile.webp', percorso: '/contatti/', formato: 'mobile' },
    ],
  },

  'albertopecchini-it': {
    // l'apex ha ancora un record DNS del vecchio hosting: si passa da www
    url: 'https://www.albertopecchini.it',
    // senza barra di scorrimento, `scrollbar-gutter: stable` lascerebbe una striscia vuota a destra
    stile: 'html { scrollbar-gutter: auto !important; }',
    // la hero cambia figura da sola: si fotografa sempre la prima
    prima: (page) => page.evaluate(() => document.querySelector('[data-hero-go="0"]')?.click()),
    catture: [...casa('ap'), { file: 'ap-iphone', percorso: '/', formato: 'iphone' }],
  },

  'dario-donelli': {
    catture: casa('dd'),
  },

  'pzkko-it': {
    // il muro vive all'ora di Mantova: ?ora=12:00&notte=0 lo tiene di giorno, ?ora=22:00&notte=1 a notte piena. L'ora
    // serve alla scena 3D, che mette il sole dove sta davvero: col solo ?notte=0, di sera, era una notte con le luci
    // spente e la cattura usciva nera (fino al 21.10, quando il giro di GitHub cadeva di sera).
    // Dal 18.10 la home è una scena 3D, che arriva dopo il caricamento (col movimento ridotto senza il volo): le catture
    // della finestra la aspettano pronta, se no erano il nero del caricamento (21.10). Le pagine intere sono il muro di
    // sempre (?muro=1): la scena è una tela fissa grande quanto la finestra, a strisce non si fotografa.
    // Su GitHub non c'è scheda video: la scena gira in software (SwiftShader), lenta, e la pagina non arrivava mai a
    // «rete ferma» entro i 60 s di goto. Si carica fino al documento (carica) e la scena si aspetta fino a 3 minuti
    carica: 'domcontentloaded',
    prima: async (page) => {
      await page
        .waitForFunction(() => document.documentElement.dataset.scena === 'pronta' || !document.documentElement.classList.contains('scena-carico'), { timeout: 180_000, polling: 1000 })
        .catch(() => console.log(`! ${page.url()}: la scena 3D non è arrivata`))
      await page.evaluate(() => scrollTo(0, 0))
      await new Promise((r) => setTimeout(r, 2000))
    },
    catture: [
      ...casa('pzk', '/?ora=12:00&notte=0').map((c) => (c.formato.endsWith('Tall') ? { ...c, percorso: '/?ora=12:00&notte=0&muro=1' } : c)),
      { file: 'pzk-notte-desktop.webp', percorso: '/?ora=22:00&notte=1', formato: 'desktop' },
      {
        file: 'pzk-roulette-tablet.webp',
        // #roulette apre la finestra appena la pagina è pronta
        percorso: '/?ora=12:00&notte=0#roulette',
        formato: 'tablet',
        viewport: [820, 1093],
        prima: (page) => page.waitForSelector('dialog[open] canvas', { timeout: 20_000 }),
      },
      { file: 'pzk-404-mobile.webp', percorso: '/404/?ora=12:00&notte=0', formato: 'mobile' },
    ],
  },
}
