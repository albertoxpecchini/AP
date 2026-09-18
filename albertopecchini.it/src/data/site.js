// ─────────────────────────────────────────────────────────────────────────────
//  DATI DEL SITO — identità, contatti, dati legali, navigazione, numeri.
//  È il primo file da aprire per personalizzare il sito.
//
//  I valori elencati in `placeholders` (in fondo) sono SEGNAPOSTO: la build li
//  elenca in console finché non vengono compilati e tolti dalla lista.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  url: 'https://albertopecchini.it',
  lang: 'it',
  locale: 'it_IT',

  // Identità
  name: 'Alberto Pecchini',
  firstName: 'Alberto',
  lastName: 'Pecchini',
  monogram: 'AP',
  title: 'Diplomato geometra',
  roles: [
    { key: 'tecnico', label: 'Disegno tecnico e rilievo', note: 'Rilievo · CAD · 3D' },
    { key: 'web', label: 'Web Designer & Developer', note: 'UI · Frontend' },
    { key: 'grafica', label: 'Graphic Designer', note: 'Brand · Editoria' },
  ],
  claim: 'Progetto spazi, strumenti e identità digitali.',
  // Riga sotto il nome nel footer: i tre ambiti, in breve.
  tagline: 'Disegno tecnico · Web · Grafica',
  description:
    'Alberto Pecchini, diplomato geometra, web designer e graphic designer in provincia di Mantova. Rilievi, CAD e modellazione 3D, siti web su misura e identità visive: un solo interlocutore, dallo stato di fatto alla messa online.',
  activeSince: 2023,
  edition: 'Portfolio 2026 — Ed. 01',

  // Sede e area operativa (le coordinate sono quelle di Rivalta sul Mincio)
  location: {
    city: 'Rivalta sul Mincio',
    province: 'MN',
    region: 'Lombardia',
    country: 'IT',
    // Indirizzo completo: NON viene pubblicato in footer né in contatti.
    // Serve a identificare il titolare del trattamento nella privacy policy.
    address: 'Via Belvedere 1',
    cap: '46040',
    lat: 45.2286,
    lon: 10.6786,
    area: 'Mantova e provincia · Lombardia, Emilia e Veneto · da remoto in tutta Italia',
  },

  contact: {
    email: 'pzkko@yahoo.com',
    phone: '+39 351 0355506',
    hours: 'Su appuntamento',
    reply: 'Rispondo entro un giorno lavorativo.',
  },

  legal: {
    // Attività senza partita IVA (prestazione occasionale): `piva` resta null
    // e i blocchi che la mostrano spariscono da soli.
    piva: null,
    // Non iscritto all’albo dei geometri: `albo` è null, la riga non compare
    // e al suo posto il footer mostra `note`.
    albo: null,
    note: 'Diplomato geometra — non iscritto all’albo',
    // Titolare del trattamento per privacy e cookie policy
    owner: 'Alberto Pecchini',
    updated: '2026-09-18',
  },

  social: [
    { key: 'instagram', label: 'Instagram', handle: '@albertoxpecchini', url: 'https://www.instagram.com/albertoxpecchini/' },
    { key: 'github', label: 'GitHub', handle: 'albertoxpecchini', url: 'https://github.com/albertoxpecchini' },
    { key: 'linkedin', label: 'LinkedIn', handle: 'Alberto Pecchini', url: 'https://www.linkedin.com/' },
  ],

  // `from` indica da quando si è liberi: lasciarlo vuoto se la disponibilità
  // è immediata, altrimenti il footer annuncia una data già passata o futura.
  availability: {
    open: true,
    label: 'Disponibile per nuovi incarichi',
    from: '',
  },

  // Modulo contatti. Con `endpoint` vuoto il modulo compone una email nel client
  // di posta del visitatore; con un endpoint (Formspree, Web3Forms, una propria
  // API…) invia i dati in POST come JSON e si aspetta una risposta 2xx.
  form: {
    endpoint: '',
    subject: 'Richiesta dal sito — ',
    projectTypes: [
      'Rilievo o restituzione grafica',
      'Pratica edilizia o catastale',
      'Modellazione 3D, BIM o rendering',
      'Sito web o landing page',
      'Logo e identità visiva',
      'Grafica e materiale stampato',
      'Un progetto che unisce più ambiti',
      'Altro',
    ],
    budgets: ['Da definire insieme', 'Fino a 1.000 €', '1.000 — 3.000 €', '3.000 — 6.000 €', 'Oltre 6.000 €'],
  },

  // Mostra il contrassegno ◇ sui progetti dimostrativi (`sample: true` in projects.js).
  // Portare a `false` quando il portfolio contiene solo lavori reali.
  showSampleNotice: true,
}

// Navigazione principale (header, menu mobile, footer)
export const nav = [
  {
    label: 'Portfolio',
    href: '/portfolio/',
    children: [
      { label: 'Tutti i progetti', href: '/portfolio/', note: 'Indice completo con filtri' },
      { label: 'Progetti tecnici', href: '/portfolio/tecnico/', note: 'Rilievi, CAD, 3D, pratiche' },
      { label: 'Progetti web', href: '/portfolio/web/', note: 'Siti, landing, interfacce' },
      { label: 'Progetti grafici', href: '/portfolio/grafica/', note: 'Brand, stampa, editoria' },
    ],
  },
  { label: 'Servizi', href: '/servizi/' },
  { label: 'Studio', href: '/studio/' },
  { label: 'Metodo', href: '/metodo/' },
  { label: 'Contatti', href: '/contatti/' },
]

export const cta = { label: 'Parliamo del progetto', href: '/contatti/' }

// Chiusura di ogni pagina (footer): titolo a tutta larghezza, invito, nota.
// `accent` indica le parole del titolo composte in corsivo graziato.
export const closing = {
  title: 'Parliamo del tuo prossimo progetto.',
  accent: ['prossimo'],
  label: 'Inizia una conversazione',
  // Nelle pagine che sono già la chiamata all'azione (contatti, note legali,
  // 404) l'invito rimanda alla posta invece che a sé stesso.
  labelCompact: 'Scrivimi una email',
  note: `Raccontami il progetto in due righe. ${site.contact.reply}`,
}

// Numeri della sezione statistiche. `projects` e `sites` vengono calcolati dal
// portfolio se lasciati a `null`; gli altri valori sono da confermare.
export const stats = [
  { key: 'projects', value: null, suffix: '+', label: 'Progetti', note: 'tra tecnico, web e grafica' },
  { key: 'clients', value: 12, suffix: '', label: 'Clienti', note: 'privati, aziende, enti' },
  { key: 'sites', value: null, suffix: '', label: 'Siti online', note: 'progettati e sviluppati' },
  { key: 'years', value: null, suffix: '', label: 'Anni di attività', note: 'dal primo ufficio tecnico' },
]

// Percorsi (dot-path) che contengono ancora valori segnaposto.
// Togliere la voce dalla lista dopo aver inserito il dato reale.
export const placeholders = [
  'site.social[linkedin].url — profilo LinkedIn',
  'stats[clients].value — numero di clienti',
  'studio: fotografia dello studio (src/data/studio.js → photos.studio)',
  'projects: i progetti con `sample: true` sono dimostrativi',
]
