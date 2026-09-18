// Metodo di lavoro: sette fasi, identiche per un rilievo, un sito o un marchio.
// `gon` è la lettura del cerchio graduato nella pagina Metodo (400 gon = giro completo).

export const methodIntro = {
  title: 'Sette fasi, sempre le stesse',
  lead: 'Che si tratti di un rilievo, di un sito o di un marchio, il percorso non cambia: prima si ascolta e si misura, poi si progetta, infine si costruisce e si resta a disposizione.',
}

export const steps = [
  {
    n: '01',
    key: 'ascolto',
    title: 'Ascolto',
    text: 'Un incontro, di persona o in videochiamata, per capire cosa serve davvero. Spesso la richiesta iniziale — «mi serve un sito», «devo fare una pratica» — nasconde un problema diverso, più semplice o più urgente.',
    output: 'Verbale dell’incontro con obiettivi, vincoli e domande aperte',
    time: '1 incontro',
    gon: 0,
  },
  {
    n: '02',
    key: 'analisi',
    title: 'Analisi',
    text: 'Sopralluogo, rilievo, visure, studio dei concorrenti, lettura dei dati esistenti. È la fase che nessuno vede e che decide la qualità di tutte le altre: si progetta bene solo ciò che si è misurato bene.',
    output: 'Stato di fatto documentato · preventivo dettagliato',
    time: '2 — 7 giorni',
    gon: 57,
  },
  {
    n: '03',
    key: 'progettazione',
    title: 'Progettazione',
    text: 'Due o tre ipotesi messe a confronto, mai una sola. Planimetrie arredate, wireframe o bozzetti: in questa fase si decide su carta, dove cambiare idea costa poco.',
    output: 'Ipotesi a confronto · soluzione scelta insieme',
    time: '1 — 3 settimane',
    gon: 114,
  },
  {
    n: '04',
    key: 'sviluppo',
    title: 'Sviluppo',
    text: 'La soluzione scelta diventa esecutiva: tavole definitive e pratica, codice e contenuti, file vettoriali e applicazioni. Ricevi aggiornamenti a scadenze fisse, non quando capita.',
    output: 'Elaborati esecutivi · versione di prova',
    time: '2 — 6 settimane',
    gon: 171,
  },
  {
    n: '05',
    key: 'revisione',
    title: 'Revisione',
    text: 'Si controlla tutto insieme, con una lista scritta. Due giri di revisione sono compresi in ogni preventivo: bastano quasi sempre, se l’analisi è stata fatta bene.',
    output: 'Lista di controllo condivisa · correzioni applicate',
    time: '3 — 5 giorni',
    gon: 229,
  },
  {
    n: '06',
    key: 'consegna',
    title: 'Consegna',
    text: 'Deposito della pratica, messa online del sito, invio dei file alla tipografia. Insieme al lavoro finito consegno sempre i sorgenti e una nota che spiega come sono organizzati.',
    output: 'Lavoro finito · sorgenti · nota di consegna',
    time: '1 — 2 giorni',
    gon: 286,
  },
  {
    n: '07',
    key: 'assistenza',
    title: 'Assistenza',
    text: 'Resto reperibile. Un’integrazione richiesta dal Comune, un testo da aggiornare sul sito, un formato del logo che manca: i primi trenta giorni di assistenza sono inclusi.',
    output: '30 giorni inclusi · manutenzione su richiesta',
    time: 'Continuativa',
    gon: 343,
  },
]

export const principles = [
  { title: 'Preventivi scritti, a voci separate', text: 'Sai cosa paghi e cosa puoi togliere.' },
  { title: 'Scadenze concordate all’inizio', text: 'Se slittano, lo sai prima tu di chiunque altro.' },
  { title: 'Un solo referente', text: 'Parli sempre con chi sta facendo il lavoro.' },
  { title: 'Sorgenti sempre consegnati', text: 'Il lavoro è tuo, in ogni formato.' },
]
