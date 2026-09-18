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

// Fotografie. Il ritratto è una fotografia reale (public/media/studio/); lo studio
// è ancora una tavola segnaposto, da sostituire con un file così:
//   { src: '/media/studio/studio.webp', width: 2100, height: 900, alt: '…' }
export const photos = {
  portrait: { src: '/media/studio/ritratto.webp', width: 1400, height: 1750, alt: 'Alberto Pecchini seduto su una panca di pietra davanti a un muro intonacato, con la giacca da moto e il casco in mano', caption: 'FIG. 01 — Ritratto, 2024' },
  studio: { art: 'workspace', alt: 'Illustrazione della postazione di lavoro dello studio', caption: 'FIG. 02 — Lo studio, Mantova' },
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
  { year: '2026', title: 'Primi siti per clienti', text: 'Online Rivalta sul Mincio, dossier informativo del paese, e il sito dell’azienda agricola Cascina Fontana. Next.js, React, TypeScript.', tag: 'Web' },
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
export const profile = {
  summary:
    'Diplomato in Costruzioni, Ambiente e Territorio e studente di Costruzioni e gestione del territorio all’Università di Modena e Reggio Emilia. Unisco la formazione tecnica su progettazione e disegno allo sviluppo di interfacce web curate e veloci e alla progettazione grafica.',
  education: [
    { period: '2026 — oggi', title: 'Università di Modena e Reggio Emilia', role: 'Corso di laurea in Costruzioni e gestione del territorio · Dip. di Ingegneria «Enzo Ferrari»' },
    { period: '2021 — 2026', title: 'I.T.T. «Carlo d’Arco», Mantova', role: 'Diploma CAT · Costruzioni, Ambiente e Territorio' },
    { period: '2024', title: 'CES, Dublino', role: 'General English Intensive · livello C1 · certificazione IELTS' },
    { period: '2023', title: 'Sicurezza dei lavoratori', role: 'Attestato rischio basso · D.lgs. 81/08, art. 37' },
  ],
  experience: [
    { period: '2023 — 2026', title: 'Caem Group S.p.A., Castellucchio (MN)', role: 'PCTO in ufficio tecnico, reparto legno · AutoCAD 3D, cadwork · modellazione di tettoie, supporto ai preventivi, archivio' },
    { period: '2026', title: 'Rivalta sul Mincio', role: 'Progetto, design e sviluppo del dossier informativo del paese · Next.js, TypeScript, GSAP' },
    { period: '2026', title: 'Cascina Fontana', role: 'Web design e sviluppo del sito dell’azienda agricola · React, TypeScript, Tailwind CSS' },
    { period: '2019 — oggi', title: 'Fotografia commerciale e vendita online', role: 'Fotografia di prodotto, schede, assistenza clienti' },
  ],
  skills: [
    { group: 'Area tecnica', items: ['AutoCAD 2D/3D', 'cadwork', 'Topografia e rilievo strumentale', 'Estimo', 'Disegno tecnico', 'Excel avanzato'] },
    { group: 'Sviluppo web', items: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'GSAP', 'Git', 'Vite', 'Vercel'] },
    { group: 'Design', items: ['UI/UX', 'Figma', 'Design system', 'Identità visiva', 'Impaginazione', 'Motion'] },
  ],
  languages: [
    { name: 'Italiano', level: 'Madrelingua' },
    { name: 'Inglese', level: 'C1 · IELTS' },
  ],
  extra: ['Patente A1 e B', 'Disponibile a trasferte', 'Volontariato educativo 2024 — 2025'],
}
