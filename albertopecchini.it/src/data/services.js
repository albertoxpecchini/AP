// Servizi, organizzati in quattro macroaree. Ogni servizio ha una descrizione breve
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
    // Nessun rimando al portfolio: l'area Grafica è nascosta finché non c'è un
    // lavoro reale (`hidden` su allAreas.grafica). Il servizio resta offerto.
    portfolio: null,
    services: [
      { title: 'Logo', text: 'Marchio e logotipo disegnati su griglia, con versioni positiva, negativa e a un colore, dimensione minima e area di rispetto.', output: 'File vettoriali · scheda d’uso' },
      { title: 'Branding', text: 'Palette, tipografia, tono, applicazioni: un sistema completo raccolto in un manuale breve, scritto per chi lo userà ogni giorno.', output: 'Manuale di identità · libreria file' },
      { title: 'Brochure', text: 'Pieghevoli, cataloghi e profili aziendali. Impaginazione su griglia, immagini trattate in modo coerente, file pronti per la stampa.', output: 'PDF/X per la tipografia' },
      { title: 'Social', text: 'Modelli per post, storie e copertine che il cliente può aggiornare da solo, senza perdere coerenza dopo la terza settimana.', output: 'Kit di modelli modificabili' },
      { title: 'Locandine', text: 'Manifesti e locandine per eventi, aperture, iniziative. Leggibili a dieci metri, riconoscibili a venti.', output: 'Esecutivi di stampa · versioni digitali' },
      { title: 'Materiale aziendale', text: 'Biglietti da visita, carta intestata, buste, insegne, targhe, modelli Word e PowerPoint, cartigli per tavole tecniche.', output: 'File di stampa · modelli Office' },
    ],
  },
  {
    key: 'informatica',
    letter: 'D',
    title: 'Informatica',
    lead: 'Computer che si accendono, stampano e ritrovano i file.',
    footer: ['Pulizia da virus', 'Windows', 'Backup e recupero dati'],
    intro:
      'Assistenza informatica per privati, famiglie e piccoli uffici. Prima di toccare il sistema faccio una copia dei tuoi dati; alla fine ti dico cosa ho trovato e cosa ho cambiato.',
    art: { src: '/media/servizi/informatica/copertina.webp', width: 1920, height: 1280, alt: 'Illustrazione in assonometria di un piccolo studio in ordine: una persona alla scrivania con monitor e portatile, accanto il computer fisso aperto e il suo pannello laterale in minio appoggiato alla gamba del tavolo; sul mobile basso la stampante, il router, il disco esterno e i raccoglitori' },
    portfolio: null,
    // Al posto del portfolio, la pagina dell'area: versioni di Windows e Office,
    // come si svolge un intervento, domande frequenti (src/data/informatica.js).
    page: { href: '/servizi/informatica/', label: 'Assistenza informatica nel dettaglio' },
    // `group` raggruppa i servizi nella pagina dell'area (gruppi in src/data/informatica.js).
    services: [
      { group: 'sicurezza', title: 'Pulizia da virus', text: 'Virus, malware, pubblicità che si aprono da sole, estensioni del browser mai installate, programmi che partono all’avvio. Li tolgo, controllo che non tornino e lascio una protezione configurata, senza abbonamenti che non servono.', output: 'Computer pulito · elenco di cosa è stato rimosso' },
      { group: 'sicurezza', title: 'Aggiornamento hardware', text: 'Un SSD al posto del disco meccanico, più memoria RAM, pulizia interna dalla polvere e pasta termica nuova: un computer di qualche anno torna veloce e silenzioso.', output: 'Computer più veloce · pezzi sostituiti restituiti' },
      { group: 'sicurezza', title: 'Posta e account', text: 'Email configurata su computer e telefono, accessi persi da recuperare, verifica in due passaggi, un gestore di password al posto del foglietto sotto la tastiera.', output: 'Accessi in ordine · codici di recupero consegnati' },
      { group: 'file', title: 'File doppioni', text: 'La stessa foto salvata quattro volte, «Copia di copia di». Confronto i file per contenuto, non per nome, e cancello solo quello che approvi tu.', output: 'Spazio liberato · elenco dei doppioni' },
      { group: 'file', title: 'Riordino cartelle', text: 'Desktop pieno, Download che traboccano, foto sparse fra computer, chiavette e telefono. Una struttura di cartelle semplice, con nomi coerenti, che resta in ordine anche dopo.', output: 'Archivio ordinato · schema delle cartelle' },
      { group: 'file', title: 'Backup e recupero dati', text: 'Copie automatiche su un disco esterno o nel cloud, prima che servano. E quando è tardi, recupero dei file cancellati da dischi, chiavette e schede SD, finché il supporto lo permette.', output: 'Backup configurato · file recuperati' },
      { group: 'file', title: 'Impaginazione documenti', text: 'Tesi, relazioni, curriculum, regolamenti, menù: stili, indice automatico, numeri di pagina, intestazioni, immagini che restano al loro posto. Stesso testo, forma ordinata.', output: 'Documento Word e PDF · modello riutilizzabile' },
      { group: 'file', title: 'Conversione di formati', text: 'DOC, DOCX, ODT, Pages, PDF, immagini, audio e video. PDF da rendere modificabili, scansioni da trasformare in testo ricercabile, file vecchi che nessun programma apre più.', output: 'File nel formato che ti serve' },
      { group: 'periferiche', title: 'Stampanti e scanner', text: 'La stampante che non stampa, la coda bloccata, lo scanner che non vede il computer, la stampante Wi-Fi che sparisce dalla rete. Installazione, driver e collegamento a tutti i dispositivi di casa o dell’ufficio.', output: 'Pagina di prova · scansione verificata' },
      { group: 'periferiche', title: 'Audio e periferiche', text: 'Casse mute, microfono che gracchia, cuffie Bluetooth che non si collegano, webcam che non viene riconosciuta. Capisco se è un’impostazione, un driver o il cavo, e lo sistemo.', output: 'Audio, microfono e webcam provati' },
      { group: 'periferiche', title: 'Driver', text: 'Scheda video, audio, rete, chipset: i driver giusti, presi dal produttore e non dai programmi che promettono di aggiornarli tutti. Se un aggiornamento rompe qualcosa, si torna alla versione che funzionava.', output: 'Driver aggiornati · punto di ripristino' },
      { group: 'periferiche', title: 'Rete e Wi-Fi', text: 'Router, ripetitori, stanze dove il segnale non arriva, stampanti e dischi condivisi in rete, la password del Wi-Fi che nessuno ricorda più.', output: 'Rete funzionante · credenziali annotate per te' },
      { group: 'sistemi', title: 'Windows', text: 'Installazione pulita, aggiornamento e riparazione di Windows 11 e 10, delle edizioni LTSC, ARM64 e Server, e delle versioni precedenti fino a XP per i computer e i programmi che devono restare com’erano.', output: 'Sistema installato e aggiornato · dati riportati' },
      { group: 'sistemi', title: 'Microsoft Office', text: 'Installazione, riparazione e configurazione di Microsoft 365 e di Office dal 2010 al 2024, anche su Mac. Solo i programmi che usi, Outlook collegato alla tua posta.', output: 'Office attivato con la tua licenza · posta configurata' },
      { group: 'sistemi', title: 'Ripristino del sistema', text: 'Il computer torna com’era il primo giorno senza perdere foto, documenti e posta: copia dei dati, ripristino, programmi e stampante reinstallati.', output: 'Sistema ripristinato · copia dei dati' },
      { group: 'sistemi', title: 'Cambio di sistema operativo', text: 'Da Windows 10 a 11, da Windows a Linux, su un disco nuovo. Prima verifico che programmi e periferiche funzionino sul nuovo sistema, poi sposto dati, impostazioni e posta.', output: 'Nuovo sistema · dati e programmi trasferiti' },
      { group: 'sistemi', title: 'Computer nuovo', text: 'Configurazione, via i programmi di prova superflui, trasferimento di file, posta, preferiti e stampante dal computer vecchio, che poi viene cancellato in modo sicuro.', output: 'Computer pronto all’uso · dati trasferiti' },
    ],
  },
]

// Pacchetti trasversali: il motivo per cui i quattro mestieri stanno nello stesso studio.
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
  {
    code: 'B + D',
    title: 'Il sito e i computer dell’ufficio',
    text: 'Chi ha fatto il sito configura anche la posta sul dominio in tutti i computer e i telefoni, la stampante di rete e i backup. Quando qualcosa non va, non si rimbalza fra due tecnici.',
    parts: ['Sito web', 'Posta sul dominio', 'Rete e stampanti', 'Backup'],
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
