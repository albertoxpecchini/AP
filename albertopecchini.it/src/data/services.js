// Servizi, organizzati in tre macroaree. Ogni servizio ha una descrizione breve
// e ciò che viene consegnato (`output`), così il cliente sa cosa riceve.
//
// `footer`: le voci richiamate nel footer di ogni pagina. È una scelta esplicita,
// non le prime della lista: in vetrina vanno le competenze più solide, mentre
// le altre restano consultabili nella pagina Servizi.

export const serviceAreas = [
  {
    key: 'tecnico',
    letter: 'A',
    title: 'Tecnico',
    lead: 'Misurare, disegnare, depositare.',
    footer: ['Rilievi', 'CAD', 'Modellazione 3D'],
    intro:
      'Il lavoro del geometra, fatto con strumenti di oggi: rilievi che diventano modelli, modelli che diventano tavole, tavole che diventano pratiche approvate.',
    art: { art: 'floorplan', variant: 'casa', bare: true, tone: 'tint', alt: 'Pianta architettonica al tratto' },
    portfolio: '/portfolio/tecnico/',
    services: [
      { title: 'Progettazione', text: 'Nuove costruzioni di piccola scala, ampliamenti, ristrutturazioni e cambi d’uso: dal primo schema distributivo alle tavole esecutive.', output: 'Tavole di progetto · relazione tecnica' },
      { title: 'Rilievi', text: 'Rilievo topografico e architettonico con stazione totale, GNSS, laser scanner e drone. Un solo sistema di riferimento, errori dichiarati.', output: 'Nuvola di punti · restituzione CAD · ortofoto' },
      { title: 'CAD', text: 'Restituzione grafica, digitalizzazione di elaborati cartacei, tavole per imprese e studi che hanno bisogno di un disegnatore affidabile.', output: 'DWG ordinati per layer · PDF in scala' },
      { title: 'Catasto', text: 'Tipi mappali e di frazionamento, accatastamenti, variazioni, volture e visure. Pratiche Pregeo e Docfa seguite fino all’approvazione.', output: 'Atti di aggiornamento approvati' },
      { title: 'Pratiche edilizie', text: 'CILA, SCIA, permessi di costruire, sanatorie e agibilità. Verifico la conformità prima di iniziare, non quando il Comune la chiede.', output: 'Pratica completa · protocollo' },
      { title: 'Modellazione 3D', text: 'Modelli tridimensionali di edifici, strutture in legno e dettagli costruttivi, utili per decidere e per farsi capire da chi costruisce.', output: 'Modello 3D · viste e assonometrie' },
      { title: 'BIM', text: 'Modelli informativi da cui estrarre piante, sezioni, abachi e quantità sempre allineati tra loro. Livello di dettaglio proporzionato al progetto.', output: 'Modello IFC · abachi · computi' },
      { title: 'Rendering', text: 'Viste realistiche o volutamente neutre: le prime per vendere, le seconde per scegliere. Dico sempre quale delle due serve.', output: 'Immagini ad alta risoluzione' },
    ],
  },
  {
    key: 'digitale',
    letter: 'B',
    title: 'Digitale',
    lead: 'Siti che si caricano, si leggono, si aggiornano.',
    footer: ['Siti web', 'Landing page', 'Sviluppo frontend'],
    intro:
      'Progetto e sviluppo siti web scritti a mano, senza temi preconfezionati. Parto dai contenuti e da chi li leggerà: il design viene di conseguenza, il codice resta pulito.',
    art: { art: 'webpage', site: 'kinesi', device: 'desktop', tall: false, alt: 'Pagina principale di un sito web' },
    portfolio: '/portfolio/web/',
    services: [
      { title: 'Siti web', text: 'Siti istituzionali e di presentazione per professionisti, aziende e realtà del territorio. Struttura chiara, testi veri, tempi di caricamento bassi.', output: 'Sito online · dominio e hosting configurati' },
      { title: 'Landing page', text: 'Una pagina, un obiettivo: una richiesta di contatto, un’iscrizione, una vendita. Misurabile dal primo giorno.', output: 'Pagina pubblicata · modulo collegato' },
      { title: 'UI/UX', text: 'Architettura dell’informazione, wireframe e prototipi navigabili in Figma. Si prova con persone vere prima di scrivere il codice.', output: 'Prototipo · design system' },
      { title: 'Sviluppo frontend', text: 'HTML semantico, CSS moderno, JavaScript o TypeScript con React e Next.js quando servono davvero. Animazioni dosate, mai gratuite.', output: 'Codice versionato su Git' },
      { title: 'Responsive', text: 'Il telefono non è una versione ridotta del desktop: la composizione mobile si progetta a parte, dal pollice e non dal mouse.', output: 'Layout verificati da 320 a 1920 px' },
      { title: 'Manutenzione', text: 'Aggiornamenti, correzioni, nuovi contenuti e backup. Un referente che conosce il sito perché l’ha costruito.', output: 'Interventi entro 2 giorni lavorativi' },
      { title: 'Ottimizzazione', text: 'Prestazioni, accessibilità e SEO tecnica di siti esistenti: immagini, font, markup, dati strutturati. Prima e dopo misurati con Lighthouse.', output: 'Report prima/dopo · interventi applicati' },
    ],
  },
  {
    key: 'grafica',
    letter: 'C',
    title: 'Grafica',
    lead: 'Identità che si riconoscono e si usano.',
    footer: ['Logo', 'Branding', 'Materiale aziendale'],
    intro:
      'Marchi costruiti con geometria dichiarata, sistemi visivi semplici da applicare, stampati che arrivano in tipografia già corretti. Meno effetti, più regole.',
    art: { art: 'brandmark', brand: 'tavolato', construction: true, alt: 'Costruzione geometrica di un marchio' },
    portfolio: '/portfolio/grafica/',
    services: [
      { title: 'Logo', text: 'Marchio e logotipo disegnati su griglia, con versioni positiva, negativa e a un colore, dimensione minima e area di rispetto.', output: 'File vettoriali · scheda d’uso' },
      { title: 'Branding', text: 'Palette, tipografia, tono, applicazioni: un sistema completo raccolto in un manuale breve, scritto per chi lo userà ogni giorno.', output: 'Manuale di identità · libreria file' },
      { title: 'Brochure', text: 'Pieghevoli, cataloghi e profili aziendali. Impaginazione su griglia, immagini trattate in modo coerente, file pronti per la stampa.', output: 'PDF/X per la tipografia' },
      { title: 'Social', text: 'Modelli per post, storie e copertine che il cliente può aggiornare da solo, senza perdere coerenza dopo la terza settimana.', output: 'Kit di modelli modificabili' },
      { title: 'Locandine', text: 'Manifesti e locandine per eventi, aperture, iniziative. Leggibili a dieci metri, riconoscibili a venti.', output: 'Esecutivi di stampa · versioni digitali' },
      { title: 'Materiale aziendale', text: 'Biglietti da visita, carta intestata, buste, insegne, targhe, modelli Word e PowerPoint, cartigli per tavole tecniche.', output: 'File di stampa · modelli Office' },
    ],
  },
]

// Pacchetti trasversali: il motivo per cui i tre mestieri stanno nello stesso studio.
export const bundles = [
  {
    code: 'A + C',
    title: 'Immobile pronto per la vendita',
    text: 'Rilievo, planimetrie arredate, verifica catastale e scheda grafica dell’immobile. Chi vende ha i documenti in ordine, chi compra capisce cosa sta guardando.',
    parts: ['Rilievo', 'Planimetrie', 'Catasto', 'Scheda immobile'],
  },
  {
    code: 'B + C',
    title: 'Identità e sito, insieme',
    text: 'Marchio, palette e caratteri nascono già pensati per lo schermo; il sito non deve adattare un logo disegnato per un biglietto da visita.',
    parts: ['Logo', 'Sistema visivo', 'Sito web', 'Materiale aziendale'],
  },
  {
    code: 'A + B',
    title: 'Il progetto, online',
    text: 'Una pagina riservata per il committente con tavole, modello 3D navigabile, stato della pratica e avanzamento del cantiere. Niente più allegati persi nelle email.',
    parts: ['Modello 3D', 'Tavole', 'Area riservata', 'Aggiornamenti'],
  },
]

export const faq = [
  {
    q: 'Lavori solo a Mantova?',
    a: 'Per rilievi, cantieri e pratiche mi muovo tra Mantova e le province vicine: serve essere sul posto. Siti web e grafica li seguo da remoto in tutta Italia, con incontri in videochiamata.',
  },
  {
    q: 'Come si calcola un preventivo?',
    a: 'Dopo un primo colloquio, gratuito, ricevi un preventivo scritto con le voci separate: cosa faccio, cosa consegno, in quanto tempo, a quale costo. Le varianti si concordano per iscritto prima di eseguirle.',
  },
  {
    q: 'Posso affidarti solo una parte del lavoro?',
    a: 'Sì. Collaboro spesso con studi e imprese che hanno bisogno solo del rilievo, solo della restituzione CAD, solo del frontend di un sito o solo del marchio.',
  },
  {
    q: 'Di chi sono i file a lavoro concluso?',
    a: 'Tuoi. Consegno sempre i sorgenti: DWG, modelli, file vettoriali, repository del codice. Non lavoro con formati o piattaforme che ti legano a me.',
  },
  {
    q: 'Chi gestisce dominio e hosting del sito?',
    a: 'Li intesto a te e li configuro io. Se preferisci occupartene in autonomia ti lascio una guida di due pagine; se no resto il referente con un contratto di manutenzione annuale.',
  },
]
