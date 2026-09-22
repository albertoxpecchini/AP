// Studio / Chi sono: biografia breve, fatti, timeline, approccio, valori, strumenti.
// I contenuti biografici derivano dal curriculum dell'autore: verificarli e aggiornarli.

export const bio = {
  headline: 'Un tecnico che scrive codice, un grafico che sa leggere una sezione.',
  paragraphs: [
    'Mi chiamo Alberto Pecchini e lavoro a Mantova. Ho studiato Costruzioni, Ambiente e Territorio, ho passato tre anni nell’ufficio tecnico di un’azienda di strutture in legno e oggi frequento il corso di laurea in Costruzioni e gestione del territorio a Modena.',
    'Nel frattempo ho imparato a progettare e sviluppare siti web, prima per curiosità e poi per i primi clienti. La grafica è arrivata per necessità: ogni tavola e ogni interfaccia hanno bisogno di gerarchie chiare.',
    'Non le considero tre attività separate. È lo stesso mestiere — misurare, ordinare, rendere leggibile — applicato a tre materiali diversi.',
  ],
}

// Fotografie. Il ritratto è una fotografia reale in public/media/studio/.
export const photos = {
  portrait: { src: '/media/studio/ritratto.webp', width: 1400, height: 1750, alt: 'Alberto Pecchini seduto su una panca di pietra davanti a un muro intonacato, con la giacca da moto e il casco in mano', caption: 'FIG. 01 — Ritratto, 2024' },
}

export const facts = [
  { label: 'Base', value: 'Mantova, Lombardia' },
  { label: 'Attivo dal', value: '2023' },
  { label: 'Formazione', value: 'Diploma CAT · Laurea in corso' },
  { label: 'Lingue', value: 'Italiano · Inglese C1 (IELTS)' },
  { label: 'Lavoro', value: 'In sede e da remoto' },
]

export const timeline = [
  { year: '2021', title: 'I.T.T. «Carlo d’Arco», Mantova', text: 'Inizio del percorso in Costruzioni, Ambiente e Territorio: disegno tecnico, topografia, estimo, gestione del cantiere.', tag: 'Formazione' },
  { year: '2023', title: 'Ufficio tecnico, reparto legno', text: 'Prima di tre sessioni di PCTO in Caem Group a Castellucchio: modellazione 3D di tettoie, preventivi, archivio tecnico. Strutture in lamellare e X-LAM.', tag: 'Tecnico' },
  { year: '2024', title: 'Dublino, inglese C1', text: 'Corso intensivo al CES di Dublino e certificazione IELTS. Documentazione tecnica e strumenti di sviluppo si leggono in inglese: meglio farlo bene.', tag: 'Formazione' },
  { year: '2026', title: 'Primi siti per clienti', text: 'Online il sito dello studio dell’ing. Dario Donelli, il dossier informativo di Rivalta sul Mincio e il sito dell’azienda agricola Cascina Fontana. Next.js, React, TypeScript.', tag: 'Web' },
  { year: '2026', title: 'Diploma CAT', text: 'Diploma di Costruzioni, Ambiente e Territorio dopo cinque anni di AutoCAD, rilievo strumentale ed estimo.', tag: 'Tecnico' },
  { year: '2026', title: 'Università di Modena e Reggio Emilia', text: 'Immatricolazione al corso di laurea in Costruzioni e gestione del territorio, Dipartimento di Ingegneria «Enzo Ferrari».', tag: 'Formazione' },
]

export const approach = [
  { n: '01', title: 'Prima la misura', text: 'Nessun progetto parte da un’idea: parte da un rilievo. Di un edificio, di un pubblico, di un mercato. Poi si disegna.' },
  { n: '02', title: 'Una cosa alla volta, per intero', text: 'Preferisco pochi incarichi seguiti dall’inizio alla fine a molti lavori tenuti aperti. Chi mi scrive parla con chi esegue.' },
  { n: '03', title: 'Ciò che consegno si può usare', text: 'File ordinati, layer con un nome, codice commentato, manuali di una pagina. Il lavoro deve funzionare anche quando io non ci sono.' },
]

export const values = [
  { title: 'Tolleranze dichiarate', text: 'Ogni misura ha un errore, ogni preventivo un margine, ogni sito un limite. Li scrivo, invece di nasconderli.' },
  { title: 'Niente che non serva', text: 'Una linea in più su una tavola, un’animazione in più su un sito, un colore in più in un marchio: se non ha una funzione, si toglie.' },
  { title: 'Tempi scritti', text: 'Le scadenze si concordano all’inizio e si rispettano. Quando non è possibile, lo dico il giorno in cui lo scopro.' },
  { title: 'Strumenti aperti', text: 'Formati standard, sorgenti consegnati, nessun vincolo a piattaforme proprietarie. Devi poter cambiare fornitore senza perdere il lavoro.' },
]

export const tools = [
  { group: 'Rilievo e disegno', items: ['AutoCAD', 'cadwork', 'Archicad', 'QGIS', 'CloudCompare', 'Agisoft Metashape', 'Pregeo · Docfa'] },
  { group: 'Web', items: ['HTML · CSS', 'JavaScript · TypeScript', 'React · Next.js', 'Astro · Vite', 'Tailwind CSS', 'GSAP', 'Git · Vercel'] },
  { group: 'Grafica', items: ['Figma', 'Illustrator', 'InDesign', 'Photoshop', 'DaVinci Resolve', 'Fotografia commerciale'] },
]

// Curriculum sintetico per la pagina /studio/profilo/
// `detail` (facoltativo) elenca le voci puntate sotto la riga: cosa è stato
// fatto davvero nell'incarico. Senza `detail` la voce resta su una riga sola.
export const profile = {
  summary:
    'Diplomato in Costruzioni, Ambiente e Territorio e studente di Costruzioni e gestione del territorio all’Università di Modena e Reggio Emilia. Unisco la formazione tecnica su progettazione, rilievo e disegno allo sviluppo di interfacce web curate e veloci e alla progettazione grafica: rilevo, disegno e metto online, senza passare il lavoro di mano.',
  education: [
    {
      period: '2026 — oggi',
      title: 'Università di Modena e Reggio Emilia',
      role: 'Corso di laurea in Costruzioni e gestione del territorio · Dip. di Ingegneria «Enzo Ferrari»',
      detail: ['Area costruzioni, rilievo del territorio e gestione del processo edilizio.'],
    },
    {
      period: '2021 — 2026',
      title: 'I.T.T. «Carlo d’Arco», Mantova',
      role: 'Diploma di Costruzioni, Ambiente e Territorio',
      detail: [
        'Disegno tecnico e progettazione architettonica in AutoCAD, dal rilievo alle tavole esecutive.',
        'Topografia e rilievo strumentale con stazione totale, livello e GPS; restituzione e calcolo delle poligonali.',
        'Estimo, costruzioni, gestione del cantiere e sicurezza; tre percorsi PCTO in ufficio tecnico.',
      ],
    },
    {
      period: 'ago 2024',
      title: 'Centre of English Studies, Dublino',
      role: 'General English Intensive · livello in uscita Advanced C1',
      detail: ['Grammatica e struttura, sviluppo lessicale, comunicazione e consapevolezza linguistica; scuola riconosciuta ACELS, accreditata Eaquals e IALC.'],
    },
    {
      period: 'dic 2023',
      title: 'Formazione generale e specifica dei lavoratori — rischio basso',
      role: 'LTO Mantova · ForMa Formazione Mantova, in accordo con ATS Val Padana · 4 ore, e-learning',
      detail: ['Accordo Stato-Regioni 21 dicembre 2011, art. 37 D.lgs. 81/08: rischio elettrico, cadute dall’alto, microclima e illuminazione, videoterminali, organizzazione del lavoro, primo soccorso, antincendio ed esodo.'],
    },
  ],
  experience: [
    {
      period: '2023 — 2026',
      title: 'Caem Group S.p.A., Castellucchio (MN)',
      role: 'Ufficio tecnico, reparto strutture in legno — tre percorsi PCTO',
      detail: [
        'Modellazione 3D di tettoie e coperture in lamellare e X-LAM con AutoCAD e cadwork.',
        'Computi e supporto alla preventivazione: estrazione delle quantità dai modelli e verifica degli abachi.',
        'Riordino dell’archivio tecnico e delle tavole di commessa, con criteri di denominazione dei file.',
      ],
    },
    {
      period: '2026',
      title: 'Ing. Dario Donelli — studio di ingegneria',
      role: 'Identità visiva, web design e sviluppo frontend · React, Vite, OpenStreetMap, Vercel',
      detail: [
        'Identità costruita sul segno della targa dello studio: scala di grigi, tipografia incisa, griglia in filigrana.',
        'Pagina unica con sei sezioni numerate, mappa OpenStreetMap senza cookie di profilazione e quindi senza banner.',
        'Fotografia dello studio e SEO tecnica; online su dariodonelli.vercel.app.',
      ],
    },
    {
      period: '2026',
      title: 'Rivalta sul Mincio — dossier informativo del paese',
      role: 'Progetto, design e sviluppo · Next.js, TypeScript, GSAP',
      detail: ['Architettura dei contenuti, impaginazione tipografica e animazioni allo scorrimento su un sito interamente redazionale.'],
    },
    {
      period: '2026',
      title: 'Cascina Fontana — azienda agricola',
      role: 'Web design e sviluppo · React, TypeScript, Tailwind CSS',
      detail: ['Sito vetrina con presentazione dell’azienda, dei prodotti e dei recapiti, ottimizzato per la consultazione da smartphone.'],
    },
    {
      period: '2019 — oggi',
      title: 'Fotografia commerciale e vendita online',
      role: 'In proprio · fotografia di prodotto, schede e assistenza clienti',
      detail: ['Set, scatto e post-produzione dei prodotti; redazione delle schede, gestione degli ordini e rapporto diretto con l’acquirente.'],
    },
  ],
  skills: [
    { group: 'Area tecnica', items: ['AutoCAD 2D/3D', 'cadwork', 'Archicad', 'Topografia e rilievo strumentale', 'Estimo', 'Disegno tecnico', 'Pratiche edilizie e catastali', 'QGIS', 'Excel avanzato'] },
    { group: 'Sviluppo web', items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Astro', 'Tailwind CSS', 'GSAP', 'Accessibilità e performance', 'SEO tecnica', 'Git', 'Vite', 'Vercel'] },
    { group: 'Design', items: ['UI/UX', 'Figma', 'Design system', 'Identità visiva', 'Impaginazione', 'Motion', 'Illustrator · InDesign · Photoshop', 'Fotografia di prodotto'] },
  ],
  languages: [
    { name: 'Italiano', level: 'Madrelingua' },
    { name: 'Inglese', level: 'C1 · CES Dublino, 2024' },
  ],
  certifications: [
    { title: 'English Advanced C1', issuer: 'Centre of English Studies, Dublino', year: '2024' },
    { title: 'Sicurezza dei lavoratori — rischio basso, 4 ore', issuer: 'LTO Mantova · ForMa Formazione Mantova', year: '2023' },
  ],
  extra: ['Patente A1 e B · automunito', 'Disponibile a trasferte', 'Volontariato educativo 2024 — 2025'],
}
