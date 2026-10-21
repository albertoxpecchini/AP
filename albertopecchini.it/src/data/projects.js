// ─────────────────────────────────────────────────────────────────────────────
//  PORTFOLIO — unica fonte dei progetti. Card, filtri, pagine d'area, case study,
//  sitemap e dati strutturati nascono tutti da questo array.
//
//  AGGIUNGERE UN PROGETTO: copiare un oggetto, cambiare `slug` e i contenuti.
//  La pagina /portfolio/<slug>/ viene generata da sola.
//
//  IMMAGINI: ogni voce di `images` è una tavola generata (segnaposto)
//      { art: 'floorplan', variant: 'casa', alt: '…', caption: '…' }
//  oppure un file reale in /public
//      { src: '/media/progetti/<slug>/01.webp', width: 1600, height: 1200, alt: '…', caption: '…' }
//
//  `sample: true` = progetto DIMOSTRATIVO: mostra come si presenta un lavoro di
//  quel tipo. Va sostituito con un lavoro reale (o rimosso) prima della messa online.
// ─────────────────────────────────────────────────────────────────────────────

import { catture } from './catture.js'

/** Categorie dei filtri principali (l'ordine è quello della barra filtri). */
export const categories = [
  { key: 'tecnico', label: 'Tecnico' },
  { key: 'web', label: 'Web' },
  { key: 'grafica', label: 'Grafica' },
  { key: 'branding', label: 'Branding' },
  { key: '3d', label: '3D' },
  { key: 'cad', label: 'CAD' },
  { key: 'altro', label: 'Altro' },
]

/** Le aree del portfolio, ognuna con la propria pagina.
 *  `hidden: true` = area senza lavori reali da mostrare: la pagina non viene
 *  generata e l'area sparisce da menù, indici e rimandi. Togliere `hidden`
 *  quando c'è almeno un progetto pubblicato di quell'area. */
export const allAreas = {
  tecnico: { label: 'Progetti tecnici', short: 'Tecnico', href: '/portfolio/tecnico/' },
  web: { label: 'Progetti web', short: 'Web', href: '/portfolio/web/' },
  grafica: { label: 'Progetti grafici', short: 'Grafica', href: '/portfolio/grafica/', hidden: true },
}

/** Le aree effettivamente pubblicate. `allAreas` resta la fonte per le briciole
 *  di navigazione dei singoli progetti, che devono funzionare comunque. */
export const areas = Object.fromEntries(Object.entries(allAreas).filter(([, a]) => !a.hidden))

const img = (art, options, alt, caption) => ({ art, ...options, alt, caption })

// Catture dei siti in /media/web/: tools/catture le rifà quando un sito cambia e
// scrive in catture.js misure e versione di ogni file (le misure qui sotto valgono
// solo per un file che il manifesto non conosce ancora).
const shot = (file, width, height, alt, caption) => {
  const c = catture[file]
  return { src: `/media/web/${file}${c ? `?v=${c.v}` : ''}`, width: c?.w ?? width, height: c?.h ?? height, alt, caption }
}
// Pagina intera a strisce (<prefisso>-01.webp, -02…): quante sono lo decide la cattura.
const strisce = (prefisso, alt) =>
  Object.keys(catture)
    .filter((f) => f.startsWith(`${prefisso}-`) && /-\d+\.webp$/.test(f))
    .sort()
    .map((f, i) => shot(f, 0, 0, i ? '' : alt))

// ── Tavole vere ──────────────────────────────────────────────────────────────
// SI MOSTRANO, dal 2.10.2026 (richiesta di Alberto: «mostra nei progetti il
// visualizzatore DWG e PDF»): la sezione «Tavole» dei case study, la pagina
// /portfolio/tavole/ e la sua voce nel menù. Dal 26.09 al 2.10 erano spente
// («mai mostrare i documenti»): con `showSheets = false` spariscono di nuovo e
// restano solo le illustrazioni (copertina e galleria da tools/copertine).
export const showSheets = true

// Ogni tavola di `sheets` sta in /public/media/tavole/<slug>/: <n>.svg è il
// disegno vettoriale che il visualizzatore ingrandisce, <n>.webp la miniatura
// (1200 px di larghezza, width/height sono le sue misure), <n>-mini.webp quella
// da 320 px per l'elenco delle tavole e <n>.pdf il file da scaricare. `full` sostituisce l'SVG quando la tavola è un'immagine (le pagine
// di una relazione), `pdf: null` toglie il download. `from` dice da che file
// viene la tavola; `scale` e `paper` finiscono nella riga dati del visualizzatore.
//
// TAVOLE DWG: con `dwg` (nome del file .dwg nella cartella della tavola) e `box`
// (x0, y0, x1, y1: il riquadro dello spazio modello, in unità del disegno) la
// tavola È il DWG, letto e disegnato nel browser da src/dwg/ senza conversioni;
// non serve l'SVG e `h` si ricava dalle proporzioni del riquadro. `darken`
// scurisce i colori chiari pensati per lo sfondo nero di AutoCAD; `paper` dà
// la larghezza del foglio, da cui gli spessori di linea in millimetri.
// La barra di scala del visualizzatore misura in metri veri se c'è `scale` (dal
// formato del foglio) o, per un riquadro DWG senza scala, se `unit: 'm'` dice che
// il disegno è in metri; altrimenti in millimetri di foglio.
const sheet = (slug, n, { title, alt, note, w = 1200, h, scale = null, unit = null, paper = 'A3', from = 'DWG', full = null, pdf, dwg = null, box = null, darken = false }) => ({
  id: `${slug}-${n}`,
  n,
  title,
  alt,
  note,
  scale,
  unit,
  paper,
  from,
  dwg: dwg ? `/media/tavole/${slug}/${dwg}` : null,
  box,
  darken,
  src: dwg ? `/media/tavole/${slug}/${dwg}` : full || `/media/tavole/${slug}/${n}.svg`,
  thumb: `/media/tavole/${slug}/${n}.webp`,
  mini: `/media/tavole/${slug}/${n}-mini.webp`,
  pdf: pdf === undefined ? `/media/tavole/${slug}/${n}.pdf` : pdf,
  width: w,
  height: box ? Math.round((w * (box[3] - box[1])) / (box[2] - box[0])) : h,
})

/** Copertina di un progetto con tavole: non la tavola, ma un'illustrazione in
 *  assonometria del progetto, che fa da miniatura e da copertina. Nasce da
 *  tools/copertine/ (gpt-image-2 su Replicate, con le tavole come riferimento);
 *  1920 × 1280 con margine di carta, così regge i ritagli 4:3 e 16:9. */
const drawnCover = (slug, alt) => ({ src: `/media/progetti/${slug}/copertina.webp`, width: 1920, height: 1280, alt })

/** Le altre illustrazioni di un progetto, per la galleria del case study: stesso
 *  strumento e stesso disegno delle copertine (tools/copertine, `viste`). 1600 × 900
 *  in pagina, `-full` a piena risoluzione per il lightbox. `ai` fa dire alla
 *  galleria che sono illustrazioni generate. */
const drawnView = (slug, n, alt, caption) => ({
  src: `/media/progetti/${slug}/vista-${n}.webp`,
  full: `/media/progetti/${slug}/vista-${n}-full.webp`,
  width: 1600,
  height: 900,
  alt,
  caption,
  ai: true,
})

const TETTOIE = 'tettoie-legno-lamellare'

const STRADA = 'progetto-stradale'
// le prime cinque tavole sono riquadri del DWG; i colori del file sono pensati
// per lo sfondo scuro di AutoCAD e sul bianco si scuriscono
const stradaDwg = (box) => ({ dwg: 'progetto-stradale.dwg', box, darken: true, unit: 'm' })
const stradaSheets = [
  sheet(STRADA, '01', {
    title: 'Studio del tracciato',
    ...stradaDwg([2270, 380, 4130, 1650]),
    alt: 'Quattro planimetrie sulla stessa carta a curve di livello: due tracciolini con i cerchi del compasso e due poligonali d’asse tra partenza e arrivo',
    note: 'Due tracciolini a pendenza costante del 5,3% da un estremo all’altro, con il compasso aperto a 37,74 m tra una curva di livello e l’altra, e le due poligonali d’asse che ne ricavo: una a quattro vertici di 968 m e una a due vertici di 892 m.',
  }),
  sheet(STRADA, '02', {
    title: 'Costruzione dei raccordi',
    ...stradaDwg([4570, 380, 5430, 1000]),
    alt: 'Poligonale d’asse a quattro vertici con i cerchi di raggio 80 m costruiti sui vertici',
    note: 'Il tracciato definitivo segue il secondo tracciolino: cinque rettifili, quattro vertici e su ogni vertice il cerchio di raggio 80 m che raccorda i due lati.',
  }),
  sheet(STRADA, '03', {
    title: 'Curve circolari',
    ...stradaDwg([5582, 380, 6442, 1000]),
    alt: 'Asse stradale con i quattro raccordi circolari di raggio 80 m e le lunghezze di rettifili e archi',
    note: 'Quattro curve di raggio 80 m con deviazioni di 67,1°, 67,6°, 67,0° e 10,3°: 296 m di archi sui 934 m dell’asse, con rettifili e archi quotati uno per uno.',
  }),
  sheet(STRADA, '04', {
    title: 'Picchettamento',
    ...stradaDwg([6582, 378, 7442, 998]),
    alt: 'Asse stradale con i 28 picchetti numerati e le tracce delle sezioni trasversali',
    note: '28 picchetti numerati dalla partenza all’arrivo, dove l’asse incrocia le curve di livello e nei punti notevoli del tracciato, con le tracce delle sezioni trasversali.',
  }),
  sheet(STRADA, '05', {
    title: 'Planimetria di progetto',
    ...stradaDwg([7582, 380, 8442, 1000]),
    alt: 'Planimetria della strada di progetto larga 10 metri, con le tracce delle sezioni e il corso d’acqua nel fondovalle',
    note: 'La strada finita sulla carta: piattaforma di 10 m, le tracce delle 28 sezioni e il corso d’acqua attraversato nel fondovalle.',
  }),
  sheet(STRADA, '06', {
    title: 'Profilo longitudinale',
    h: 848,
    from: 'PDF',
    alt: 'Profilo longitudinale con la linea del terreno, le tre livellette di progetto e la tabella di picchetti, distanze e quote',
    note: 'Terreno e progetto lungo i 934 m dell’asse, con le altezze esagerate dieci volte: tre livellette (−6,52%, 0%, +4,45%), quote del terreno e di progetto, distanze parziali e progressive dei 28 picchetti.',
  }),
  sheet(STRADA, '07', {
    title: 'Sezioni trasversali',
    h: 848,
    from: 'PDF',
    alt: 'Tavola con le 28 sezioni trasversali, lo sterro campito in rosso e il riporto in giallo',
    note: 'Le 28 sezioni, una per picchetto: piattaforma di 10 m, cunetta di 0,90 × 0,30 m dal lato in scavo, scarpate con pendenza 2 su 3. In rosso lo sterro, in giallo il riporto.',
  }),
  sheet(STRADA, '08', {
    title: 'Calcolo dei volumi',
    h: 848,
    from: 'Excel',
    alt: 'Tabella di calcolo dei volumi di sterro e riporto per i 27 tronchi, con i totali e la legenda dei colori',
    note: 'Il foglio Excel: aree di sterro e riporto delle sezioni, volume di ogni tronco con il metodo delle sezioni ragguagliate, totali e saldo.',
  }),
]

const CANTIERE = 'layout-cantiere'
const cantiereSheets = [
  sheet(CANTIERE, '01', {
    title: 'Inquadramento',
    h: 1697,
    from: 'PDF',
    alt: 'Planimetria del lotto con l’area di cantiere recintata, gli accessi dalla strada, la legenda dei simboli e la tabella delle dotazioni',
    note: 'Il lotto intero con l’area di cantiere, gli accessi dalla strada, la legenda dei simboli e la dotazione del cantiere. Il nome della strada è stato tolto.',
  }),
  sheet(CANTIERE, '02', {
    title: 'Layout di cantiere',
    h: 1697,
    from: 'PDF',
    alt: 'Layout di cantiere con l’edificio, il raggio d’azione dell’autogru, depositi, baracche, parcheggio e percorso dei mezzi',
    note: 'L’area recintata in dettaglio: il raggio d’azione dell’autogru, le baracche, i depositi, le postazioni fisse, i servizi e il percorso dei mezzi.',
  }),
  sheet(CANTIERE, '03', {
    title: 'Pianta piano terra',
    h: 848,
    from: 'PDF',
    alt: 'Pianta del piano terra con magazzino, portico, uffici e servizi, cucina, lavanderia e ingresso',
    note: 'L’edificio da costruire: il magazzino al centro con il portico, a sinistra ingresso, cucina e lavanderia, a destra uffici, servizi e WC.',
  }),
  sheet(CANTIERE, '04', {
    title: 'Pianta piano primo',
    h: 848,
    from: 'PDF',
    alt: 'Pianta del piano primo con due camere, bagno, disimpegno e magazzino',
    note: 'Al piano primo due camere, un bagno e il disimpegno sull’ala di sinistra, e il magazzino sopra quello del piano terra.',
  }),
]

const BAR = 'bar-caffetteria-esame-di-stato'
// ogni tavola è una squadratura A3 (42 × 29,7 unità, scala 1:100) nello spazio modello del DWG
const barBox = (n) => [2296.2 + 50 * (n - 1), 2014.13, 2338.22 + 50 * (n - 1), 2043.85]
const barSheet = (n, o) => sheet(BAR, n, { scale: '1:100', dwg: 'bar-caffetteria.dwg', box: barBox(Number(n)), ...o })
const barSheets = [
  barSheet('01', {
    title: 'Planimetria generale',
    scale: '1:500',
    alt: 'Planimetria generale a colori del parco con il bar-caffetteria, l’orto, i percorsi e le alberature',
    note: 'Il parco intorno al bar: percorsi pedonali dal disegno organico, prati e alberature, l’orto didattico e le strutture leggere, con il commento al progetto del verde.',
  }),
  barSheet('02', {
    title: 'Prospetti',
    alt: 'Prospetti nord, est, ovest e sud del bar con le quote di livello e i gazebo',
    note: 'I quattro prospetti con le quote di livello da 0,00 a 3,50 m, le travi lignee a vista in copertura e i gazebo in legno accanto all’edificio.',
  }),
  barSheet('03', {
    title: 'Pianta delle coperture',
    alt: 'Pianta delle coperture quotata, 13,90 per 14,40 metri',
    note: 'La copertura del blocco principale, 13,90 × 14,40 m, con le travi lignee sul bordo e le coperture delle tre strutture esterne.',
  }),
  barSheet('04', {
    title: 'Pianta e prospetti ribaltati',
    alt: 'Pianta del bar con i quattro prospetti ribaltati sui lati',
    note: 'La pianta con i quattro prospetti ribaltati sui lati, per leggere insieme la distribuzione interna e le aperture.',
  }),
  barSheet('05', {
    title: 'Pianta arredata',
    alt: 'Pianta arredata con il bancone, i tavoli, la cucina, i servizi igienici e i gazebo',
    note: 'La sala bar con il bancone e i tavoli, la cucina, il laboratorio, i due blocchi di servizi e le tre strutture esterne arredate.',
  }),
  barSheet('06', {
    title: 'Pianta quotata',
    alt: 'Pianta quotata del bar con le misure interne ed esterne',
    note: 'Le quote di pianta: ingombri esterni, spessori dei muri, aperture e dimensioni delle strutture esterne, 4,20 × 2,70 m.',
  }),
  barSheet('07', {
    title: 'Quadro funzionale e superfici',
    alt: 'Pianta con le schede dei locali, il quadro delle superfici e le verifiche dei rapporti aeroilluminanti',
    note: 'Destinazioni d’uso, superfici e verifica del rapporto aeroilluminante di 1/8, locale per locale: la sala bar ha 24,26 m² di aperture contro i 13,4 richiesti.',
  }),
  barSheet('08', {
    title: 'Sezione A-A',
    alt: 'Pianta con la traccia della sezione e la sezione A-A del bar',
    note: 'La traccia in pianta e la sezione A-A, con la nota sui vuoti chiusi ricavati nella copertura.',
  }),
]

const MUSEO = 'museo-mestieri-del-fiume'
// Le pagine della relazione sono immagini: `full` a 1600 px per lo zoom, un solo
// PDF per tutte. Nomi dei compagni e volti sono oscurati sia nelle pagine sia nel PDF.
const museoSheet = (n, o) =>
  sheet(MUSEO, n, { w: 800, h: 1132, paper: 'A4', from: 'Word', full: `/media/tavole/${MUSEO}/${n}-full.webp`, pdf: `/media/tavole/${MUSEO}/relazione.pdf`, ...o })
const museoSheets = [
  museoSheet('01', {
    title: 'Introduzione',
    alt: 'Prima pagina della relazione, con la fotografia del museo e l’introduzione alla visita',
    note: 'Il museo, il Loghino Ariello e la riserva delle Valli del Mincio: com’è andata la mattina della visita.',
  }),
  museoSheet('02', {
    title: 'Oggetti esposti',
    alt: 'Seconda pagina con le fotografie e le descrizioni del corno, del tostacaffè e del cardatore',
    note: 'Tre oggetti descritti uno per uno: un grande corno con l’anello per appenderlo, un tostacaffè di inizio Novecento e un cardatore per la lana.',
  }),
  museoSheet('03', {
    title: 'Impressioni personali',
    alt: 'Terza pagina con le impressioni personali sulla visita',
    note: 'Le impressioni personali: la mia è sulla stufa in ghisa della cucina d’epoca. Nomi dei compagni e volti sono oscurati.',
  }),
  museoSheet('04', {
    title: 'Conclusioni',
    alt: 'Quarta pagina con le conclusioni e le fotografie della giornata',
    note: 'Il legame tra lavoro, risorse naturali e manualità nel territorio del Mincio. Le fotografie in cui si riconoscono i compagni sono sfocate.',
  }),
]

// Le fotografie della visita, scelte tra le 162 scattate quel giorno. Dal 25.09.2026
// ci sono anche i compagni di classe (Alberto ne ha l'autorizzazione, 62–80); restano
// fuori le foto in cui si riconoscono insegnanti o guida, e alcune delle prime sono
// ritagliate per lasciarli fuori. WebP senza metadati (niente GPS): 720 px per la
// griglia, 1600 per il lightbox.
const foto = (n, width, height, caption, alt) => ({
  src: `/media/progetti/${MUSEO}/${n}.webp`,
  full: `/media/progetti/${MUSEO}/${n}-full.webp`,
  width,
  height,
  alt,
  caption,
})
const museoPhotos = {
  lead: 'La mattina con la classe, dalla strada in bicicletta al pontile sul Mincio, e poi il museo stanza per stanza: la cucina del cannaiolo, gli animali della valle, la canna, la caccia e la pesca.',
  groups: [
    {
      title: 'In bicicletta fino al museo',
      items: [
        foto('62', 720, 540, 'Il ritrovo prima di partire', 'La classe radunata su una piazza lastricata accanto alla base di un monumento, sotto gli alberi d’autunno'),
        foto('63', 720, 540, 'In attesa della partenza', 'Quattro compagni di classe in piedi sulla piazza, con giacche e felpe invernali'),
        foto('64', 720, 540, 'Pronti a partire', 'Tre compagni di classe con le mani in tasca sulla piazza coperta di foglie'),
        foto('65', 720, 960, 'Le biciclette pronte', 'Due compagni di classe sorridenti davanti alle biciclette, sotto gli alberi'),
        foto('66', 720, 960, 'In sella', 'La strada vista dal manubrio: la mano sul freno e i compagni in bicicletta dietro'),
        foto('67', 720, 960, 'La sosta al monumento ai caduti', 'I compagni con le biciclette davanti all’obelisco del monumento ai caduti, con la croce in cima'),
        foto('68', 720, 960, 'La piazza delle Grazie', 'Compagni in bicicletta sulla piazza del santuario delle Grazie, con il portico e la facciata della chiesa'),
        foto('69', 720, 960, 'Davanti al santuario', 'Un compagno con la bicicletta davanti al portico ad archi del santuario delle Grazie'),
      ],
    },
    {
      title: 'La classe al museo',
      items: [
        foto('70', 720, 960, 'In ascolto', 'Due compagne di classe in ascolto nella sala del museo, sotto il soffitto di travi'),
        foto('71', 720, 960, 'Tra una sala e l’altra', 'Un compagno e una compagna di classe nella sala del museo, con le travi di legno a vista'),
        foto('72', 720, 960, 'Un selfie con un compagno', 'Autoscatto di Alberto con un compagno di classe alle spalle, nella sala con le travi a vista'),
        foto('73', 720, 960, 'Le schede degli attrezzi', 'Due compagni di classe leggono i fogli con i disegni degli attrezzi'),
        foto('74', 720, 540, 'Un selfie a tre', 'Autoscatto di tre compagni di classe sorridenti nella sala del museo'),
        foto('75', 720, 960, 'In posa davanti ai pannelli', 'Due compagni di classe in posa davanti a un pannello rosso del museo e a un fascio di canne'),
        foto('76', 720, 960, 'Sotto le nasse', 'Compagni di classe nella sala della pesca, sotto le nasse appese al soffitto di legno'),
        foto('77', 720, 960, 'La donnola, in mano a un compagno', 'Un compagno di classe guarda da vicino la donnola imbalsamata che tiene in mano'),
        foto('78', 720, 960, 'Sul pontile del Mincio', 'Compagni di classe sul pontile di legno davanti al museo, con il Mincio e le sponde alberate alle spalle'),
        foto('79', 720, 960, 'La pausa sulla panchina', 'Tre compagni di classe seduti su una panchina di pietra nel prato del museo'),
        foto('80', 720, 960, 'Nel prato davanti al museo', 'Due compagni di classe accanto a una panchina nel prato, davanti agli edifici rossi del museo'),
      ],
    },
    {
      title: 'Il museo e il fiume',
      items: [
        foto('01', 720, 960, 'La facciata rossa del museo', 'Una finestra con l’inferriata nella facciata rossa del museo'),
        foto('02', 720, 960, 'Il Mincio dal pontile del museo', 'Il Mincio visto dal pontile davanti al museo, con le sponde alberate e il cielo coperto'),
        foto('03', 720, 960, 'La sala vista dal ballatoio', 'La sala del museo vista dall’alto: le vetrate sul prato, la scala e le teche'),
        foto('04', 720, 691, 'Il plastico della valle', 'Il plastico della valle del Mincio con i canali e le località segnate da cartellini'),
        foto('05', 720, 960, '«Dalla preistoria alla storia»', 'La vetrina «Dalla preistoria alla storia» con i pannelli, un reperto su un sostegno di legno e un libro aperto'),
        foto('06', 720, 960, 'La carta del Parco del Mincio', 'Anatre imbalsamate su uno scaffale, sotto la carta del Parco del Mincio'),
      ],
    },
    {
      title: 'La cucina del cannaiolo',
      items: [
        foto('07', 720, 960, 'La legenda della cucina del cannaiolo', 'Il pannello con la legenda della cucina del cannaiolo: ogni oggetto ha un numero'),
        foto('08', 720, 818, 'Il tavolo della cucina', 'Il tavolo della cucina con una rete, una scopetta di saggina, una pentola, un frullino e un piatto di vetro'),
        foto('09', 720, 960, 'Il macinacaffè e le catene del camino', 'Una mensola con il macinacaffè, una fiasca a forma di zucca e una padella; sotto, le catene del camino'),
        foto('10', 720, 960, 'Il ferro da stiro a brace', 'Il ferro da stiro a brace e un macinino sulla mensola, accanto a una lunga catena'),
        foto('11', 720, 960, 'Il tostacaffè', 'Il tostacaffè con il lungo manico di legno appoggiato sulla mensola, sopra una rastrelliera di piatti'),
        foto('12', 720, 1091, 'Fiaschi impagliati', 'Quattro fiaschi e damigiane impagliati su una mensola di legno'),
        foto('13', 720, 960, 'La sporta di paglia', 'Una sporta di paglia intrecciata appesa al muro con una corda'),
        foto('14', 720, 960, 'Attrezzi di legno sulla sedia', 'Due attrezzi di legno torniti appoggiati a una sedia impagliata'),
        foto('15', 720, 960, 'Il mantice del fuoco', 'Un mantice per ravvivare il fuoco appoggiato a una seggiola impagliata'),
        foto('16', 720, 960, 'Un piatto di vetro lavorato', 'Un piatto di vetro lavorato sul tavolo della cucina'),
        foto('17', 720, 960, 'La rete e il trapano a mano', 'Una rete in lavorazione e un trapano a mano sul tavolo di legno'),
      ],
    },
    {
      title: 'Gli animali della valle',
      items: [
        foto('18', 720, 1043, 'La garzetta davanti al canneto', 'Una garzetta e altri uccelli di palude imbalsamati davanti a un covone di canne'),
        foto('19', 720, 960, 'Uccelli d’acqua', 'Un uccello acquatico imbalsamato sul pavimento della sala'),
        foto('20', 720, 960, 'Libri e uccelli sugli scaffali', 'Scaffali con libri sul territorio e un picchio imbalsamato'),
        foto('21', 720, 960, 'La civetta e il martin pescatore', 'Una civetta e un martin pescatore imbalsamati tra i libri dello scaffale'),
        foto('22', 720, 1143, 'Aironi nella sala', 'Aironi e altri uccelli di palude imbalsamati accanto agli scaffali'),
        foto('23', 720, 1372, 'La teca degli uccelli di palude', 'Una teca con uccelli di palude imbalsamati nel corridoio del museo'),
        foto('24', 720, 960, 'Sotto le travi', 'Uccelli di palude imbalsamati visti dal basso, sotto le travi del soffitto'),
        foto('25', 720, 960, 'Il barbagianni', 'Un barbagianni imbalsamato, da vicino'),
        foto('26', 720, 960, 'Un airone con il ciuffo', 'Un airone imbalsamato con il ciuffo arruffato e il becco giallo'),
        foto('27', 720, 960, 'Lo stesso airone, da vicino', 'La testa di un airone imbalsamato con il ciuffo arruffato'),
        foto('28', 720, 960, 'Uccelli di ripa', 'Uccelli di ripa imbalsamati sulla pedana, accanto a un nido'),
        foto('29', 720, 960, 'L’upupa tra i libri', 'Un’upupa imbalsamata su uno scaffale, davanti a una guida agli uccelli'),
        foto('30', 720, 960, 'L’albero degli uccelli', 'Uccelli imbalsamati in volo intorno a un albero di legno dipinto'),
        foto('31', 720, 960, 'Il gufo sull’albero', 'Un gufo e altri uccelli sull’albero di legno, accanto alla vetrata'),
        foto('32', 720, 960, 'In volo sul canneto', 'Uccelli imbalsamati in volo sopra una ricostruzione del canneto'),
        foto('33', 720, 960, 'Un volo tra le canne', 'Un uccello imbalsamato ad ali aperte tra le canne'),
        foto('34', 720, 960, 'Il chiurlo e l’upupa', 'Un chiurlo e un’upupa imbalsamati vicino a un nido con le uova'),
        foto('35', 720, 960, 'Un’anatra, da vicino', 'La testa di un’anatra imbalsamata'),
        foto('36', 720, 528, 'Il nido appeso al soffitto', 'Un ramo di legno a forma di stella appeso sotto il ballatoio, con un nido e un uccello'),
        foto('37', 720, 960, 'Il nido di pendolino', 'Il nido di pendolino appeso a un ramo, con il foro d’ingresso laterale'),
        foto('38', 720, 960, 'L’albero accanto alla vetrata', 'Uccelli imbalsamati su un albero di legno accanto alla vetrata sul prato'),
        foto('39', 720, 960, 'Sul ballatoio', 'Piccoli mammiferi imbalsamati in fila sul ballatoio di legno'),
        foto('40', 720, 960, 'La donnola', 'Una donnola imbalsamata su un ramo, con il cartellino scritto a mano'),
        foto('41', 720, 960, 'La testa del luccio', 'La testa di un luccio montata sulla parete'),
        foto('42', 720, 960, 'I pesci del fiume', 'Una vetrina con le piante d’acqua e i pesci del fiume'),
      ],
    },
    {
      title: 'Canna, caccia e pesca',
      items: [
        foto('43', 720, 960, 'Gli attrezzi del cannaiolo', 'Graticci di canne appesi alla parete con gli attrezzi del cannaiolo'),
        foto('44', 720, 960, 'Attrezzi sul graticcio', 'Pinze, una pialla e altri attrezzi da lavoro su un graticcio di canne'),
        foto('45', 720, 1412, 'La canna e il carice', 'Fascine di canna palustre davanti ai pannelli «La canna e il carice» e agli attrezzi per tagliarla'),
        foto('46', 720, 715, 'La barca da pesca', 'La barca da pesca piatta e stretta, con le reti e i remi, accanto al pannello «La caccia»'),
        foto('47', 720, 1079, 'La sala della pesca', 'La sala della pesca: la barca, le reti al soffitto e un video sulla valle'),
        foto('48', 720, 595, 'Le nasse appese', 'Le nasse per i pesci appese al soffitto di legno'),
        foto('49', 720, 960, 'Una nassa', 'Una nassa di rete appoggiata al muro'),
        foto('50', 720, 960, 'Il fucile da caccia', 'Un fucile da caccia e altri attrezzi appesi alla parete'),
        foto('51', 720, 960, 'Le canne della doppietta', 'Le due canne di un fucile viste di fronte'),
        foto('52', 720, 960, 'Fiocine e rastrelli', 'Fiocine, rastrelli e un fucile appesi alla parete sotto una cassetta di legno'),
        foto('53', 720, 960, 'Fiocine e retino', 'Fiocine, un retino e un fucile appesi alla parete'),
        foto('54', 720, 672, 'Gli stampi da richiamo', 'Due stampi di anatra da richiamo su una cassetta di legno'),
        foto('55', 720, 854, 'La ricarica delle cartucce', 'La vetrina con gli attrezzi per ricaricare le cartucce da caccia, le scatole e i piombini'),
        foto('56', 720, 615, 'La vetrina della caccia', 'Una vetrina con scarpe da lavoro, rocchetti e attrezzi da caccia'),
        foto('57', 720, 960, 'Le scarpe da lavoro', 'Due scarpe da lavoro di cuoio nella vetrina'),
        foto('58', 720, 960, 'Un biglietto nella scarpa', 'Un biglietto scritto a mano infilato in una vecchia scarpa di cuoio'),
        foto('59', 720, 960, 'Gli zoccoli di legno', 'Due zoccoli di legno su uno sgabello davanti a una capanna di tavole'),
        foto('60', 720, 960, 'Fotografia d’epoca: il bagno nel fiume', 'Una fotografia d’epoca in bianco e nero di quattro ragazzi che fanno il bagno nel fiume'),
        foto('61', 720, 960, 'Fotografia d’epoca: i cannaioli', 'Una fotografia d’epoca in bianco e nero di un gruppo di uomini con le fascine di canna'),
      ],
    },
  ],
}

const allProjects = [
  // ═══ TECNICO ═══════════════════════════════════════════════════════════════
  {
    slug: 'recupero-annesso-rustico',
    code: 'AP-25-011',
    title: 'Recupero di un annesso rustico',
    subtitle: 'Da fienile a residenza, senza perdere il fronte',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Recupero edilizio', 'Progettazione', 'Pratiche edilizie', 'Planimetrie', 'Sezioni', 'Prospetti'],
    client: 'Committente privato',
    sector: 'Residenziale',
    location: 'Goito (MN)',
    year: 2025,
    services: ['Rilievo dello stato di fatto', 'Progetto architettonico', 'Pratica edilizia (SCIA)', 'Tavole esecutive'],
    technologies: ['AutoCAD', 'Stazione totale', 'QGIS', 'Excel'],
    summary: 'Cambio d’uso di un fienile ottocentesco: rilievo, progetto e pratica edilizia conservando arco, gelosie e proporzioni del fronte sud.',
    description:
      'Un annesso rustico a due piani, in parte crollato nel colmo, da trasformare in abitazione per una giovane coppia. Il vincolo non era normativo ma di buon senso: il fronte sulla corte doveva restare riconoscibile.',
    goal: 'Ottenere il cambio di destinazione d’uso e una distribuzione interna abitabile — zona giorno, due camere, due bagni — toccando il meno possibile le murature in laterizio pieno.',
    problem:
      'Solaio ligneo ammalorato, colmo insellato di oltre venti centimetri, nessun elaborato storico disponibile. Il grande arco del fienile, largo quasi quattro metri, rischiava di diventare un problema termico e strutturale invece che il punto di forza del progetto.',
    strategy:
      'Partire da un rilievo affidabile e disegnare il nuovo dentro il vecchio: la vetrata sta arretrata rispetto all’arco, la scala occupa la campata già priva di solaio, gli impianti corrono in un controsoffitto tecnico che non intacca le travi recuperabili.',
    development: [
      { title: 'Rilievo', text: 'Poligonale con stazione totale, trilaterazioni interne e fotopiani dei quattro prospetti. Restituzione in scala 1:50 con mappatura del degrado.' },
      { title: 'Progetto', text: 'Tre ipotesi distributive confrontate con i committenti su planimetrie arredate; scelta la soluzione con zona giorno a tutta profondità.' },
      { title: 'Pratica', text: 'SCIA per ristrutturazione con cambio d’uso, relazione tecnica, verifica dei rapporti aeroilluminanti e tavola comparativa gialli/rossi.' },
      { title: 'Esecutivi', text: 'Tavole di dettaglio per cordolo, vespaio aerato e nodo serramento-arco, con abaco dei serramenti.' },
    ],
    result: 'Titolo edilizio efficace senza richieste di integrazione, 142 m² abitabili e un fronte sud che chi passa in corte riconosce ancora come quello del fienile.',
    metrics: [
      { value: '142 m²', label: 'Superficie utile' },
      { value: '7', label: 'Tavole di progetto' },
      { value: '0', label: 'Integrazioni richieste' },
    ],
    cover: img('elevation', { state: 'after', code: 'AP-25-011' }, 'Prospetto sud dell’annesso rustico nello stato di progetto'),
    images: [
      img('elevation', { state: 'after', code: 'AP-25-011' }, 'Prospetto sud dell’annesso rustico nello stato di progetto', 'TAV. 05 — Prospetto sud, stato di progetto'),
      img('floorplan', { variant: 'rustico', code: 'AP-25-011' }, 'Pianta del piano terra con zona giorno, scala, bagno e camera', 'TAV. 02 — Pianta piano terra, scala 1:100'),
      img('section', { code: 'AP-25-011', tone: 'ink' }, 'Sezione trasversale con scala, solaio in legno e copertura ventilata', 'TAV. 04 — Sezione A—A′, scala 1:50'),
      img('elevation', { state: 'before', code: 'AP-25-011' }, 'Prospetto sud nello stato di fatto con mappatura del degrado', 'TAV. 01 — Prospetto sud, stato di fatto'),
    ],
    compare: {
      before: img('elevation', { state: 'before', code: 'AP-25-011' }, 'Prospetto sud prima dell’intervento: intonaco distaccato, colmo insellato, arco tamponato da assi'),
      after: img('elevation', { state: 'after', code: 'AP-25-011' }, 'Prospetto sud dopo l’intervento: serramenti in legno, vetrata sull’arco, manto in coppi di recupero'),
      labelBefore: 'Stato di fatto',
      labelAfter: 'Progetto',
    },
    featured: true,
    sample: true,
  },
  {
    slug: 'rilievo-corte-rurale',
    code: 'AP-25-008',
    title: 'Rilievo integrato di una corte rurale',
    subtitle: 'Laser scanner, drone e GNSS in un unico sistema di riferimento',
    area: 'tecnico',
    categories: ['tecnico', '3d'],
    types: ['Rilievi', 'Nuvole di punti', 'Fotogrammetria', 'Ortofoto', 'Planimetrie'],
    client: 'Azienda agricola',
    sector: 'Agricolo',
    location: 'Rodigo (MN)',
    year: 2025,
    services: ['Rilievo laser scanner', 'Fotogrammetria da drone', 'Appoggio GNSS', 'Restituzione CAD'],
    technologies: ['Laser scanner terrestre', 'Drone RTK', 'GNSS', 'Agisoft Metashape', 'CloudCompare', 'AutoCAD'],
    summary: 'Tre stazioni laser, un volo a 40 metri e nove target: una corte di 2.400 m² restituita in piante, prospetti e ortofoto con 4 mm di errore medio.',
    description:
      'Una corte agricola con tre fabbricati di epoche diverse e nessun disegno attendibile. Serviva una base geometrica unica su cui innestare, negli anni, pratiche catastali, progetto di recupero e computo delle coperture.',
    goal: 'Consegnare un modello misurabile dell’intero complesso — terreno, fabbricati, coperture — da cui estrarre elaborati bidimensionali alla scala 1:50.',
    problem:
      'Le coperture non erano ispezionabili in sicurezza e i cortili interni, stretti e ingombri di attrezzi, rendevano lento e impreciso un rilievo tradizionale. Due tecniche diverse andavano fatte parlare tra loro.',
    strategy:
      'Appoggiare tutto agli stessi nove target: il laser scanner per i fronti e gli interni, il drone per tetti e terreno, il GNSS per la georeferenziazione. Una sola nuvola, un solo sistema di coordinate.',
    development: [
      { title: 'Campagna', text: 'Una giornata in sito: materializzazione dei target, tre stazioni di scansione, volo nadirale e obliquo a 40 m con sovrapposizione 80/70.' },
      { title: 'Elaborazione', text: 'Allineamento fotogrammetrico, registrazione cloud-to-cloud e verifica sui target: scarto medio di 4 mm, massimo di 11.' },
      { title: 'Restituzione', text: 'Sezioni della nuvola ogni 50 cm, vettorializzazione di piante, prospetti e coperture; ortofoto con GSD di 1,2 cm.' },
    ],
    result: 'Un archivio di 12,4 milioni di punti consultabile dal committente e nove tavole CAD già usate per il frazionamento e per il primo progetto di recupero.',
    metrics: [
      { value: '12,4 M', label: 'Punti registrati' },
      { value: '4 mm', label: 'Errore medio' },
      { value: '1 giorno', label: 'Di campagna' },
    ],
    cover: img('pointcloud', { code: 'AP-25-008' }, 'Nuvola di punti della corte con le tre stazioni di scansione'),
    images: [
      img('pointcloud', { code: 'AP-25-008' }, 'Nuvola di punti della corte con le tre stazioni di scansione', 'TAV. 01 — Registrazione globale della nuvola'),
      img('ortho', { code: 'AP-25-008' }, 'Ortofoto della corte con piano di volo e punti di controllo a terra', 'TAV. 03 — Ortofoto, GSD 1,2 cm/px'),
      img('elevation', { state: 'before', code: 'AP-25-008', tav: 'TAV. 06' }, 'Prospetto del fabbricato principale restituito dalla nuvola', 'TAV. 06 — Prospetto sud da nuvola di punti'),
      img('floorplan', { variant: 'rustico', code: 'AP-25-008', tone: 'ink', tav: 'TAV. 04' }, 'Pianta del piano terra restituita dal rilievo', 'TAV. 04 — Pianta piano terra, restituzione'),
    ],
    featured: true,
    sample: true,
  },
  {
    slug: TETTOIE,
    code: 'AP-24-001',
    title: 'Tettoie in legno lamellare',
    subtitle: 'Modellazione 3D in ufficio tecnico, reparto legno',
    area: 'tecnico',
    categories: ['tecnico', '3d', 'cad'],
    types: ['Modellazione 3D', 'CAD', 'Strutture in legno'],
    client: 'Caem Group S.p.A. — percorso PCTO',
    sector: 'Industria del legno',
    location: 'Castellucchio (MN)',
    year: 2026,
    period: '2023 — 2026',
    services: ['Modellazione 3D', 'Supporto ai preventivi', 'Archiviazione tecnica'],
    technologies: ['AutoCAD 3D', 'cadwork', 'Excel'],
    summary: 'Tre sessioni in un ufficio tecnico che progetta strutture in lamellare e X-LAM: modelli 3D di tettoie, preventivi seguiti dal vivo, archivio ordinato.',
    description:
      'Il mio primo lavoro vero su commesse reali. In tre anni di PCTO ho affiancato i tecnici del reparto legno: dal magazzino, dove travi e travetti si toccano con mano, al modello tridimensionale che diventa distinta di taglio.',
    goal: 'Imparare il flusso completo di un ufficio tecnico — dal disegno al preventivo alla documentazione — e rendermi utile modellando le strutture più semplici in autonomia.',
    problem:
      'Una tettoia sembra banale finché non bisogna far tornare pendenza, interassi, sezioni commerciali e nodi. Ogni incongruenza del modello si paga in officina, dove il legno viene tagliato una volta sola.',
    strategy:
      'Modellare per solidi con le sezioni reali del lamellare, partire sempre dai fili fissi del cliente e verificare il modello sulle viste quotate prima di passarlo ai tecnici che lo importavano in cadwork.',
    development: [
      { title: 'Prima sessione', text: 'Affiancamento, prime modellazioni in AutoCAD e visite al magazzino per conoscere travi, travetti e lavorazioni.' },
      { title: 'Seconda sessione', text: 'Maggiore autonomia nel disegno 3D delle tettoie e supporto quotidiano all’ufficio tecnico.' },
      { title: 'Terza sessione', text: 'Flusso completo: modello 3D, stesura dei preventivi seguita in diretta con il cliente, archiviazione della documentazione.' },
    ],
    result: 'Un metodo di lavoro: modelli puliti, nomi di file che si capiscono, documenti che si ritrovano. È la base di tutto quello che faccio oggi, anche quando il progetto è un sito.',
    metrics: [
      { value: '3', label: 'Sessioni di tirocinio' },
      { value: '72 — 80 h', label: 'Per sessione' },
      { value: 'GL24h', label: 'Lamellare e X-LAM' },
    ],
    cover: drawnCover(TETTOIE, 'Illustrazione in assonometria: una tettoia in legno lamellare a falda unica addossata a una casa, con i pilastri, le travi e i travetti color miele e la copertura in lamiera minio posata solo in parte, sopra un’auto e un tavolo da giardino'),
    images: [
      drawnView(TETTOIE, '01', 'Illustrazione in esploso assonometrico di una tettoia in legno lamellare: plinti, pilastri, travi principali, travetti, tavolato e lamiera sollevati uno sopra l’altro, con le piastre e le staffe d’acciaio in minio', 'La tettoia in esploso'),
      drawnView(TETTOIE, '02', 'Illustrazione dell’interno del magazzino di un’azienda del legno: cataste di travi lamellari e pannelli X-LAM, una macchina a controllo numerico sul fondo, un tirocinante e un tecnico che misurano la testa di una trave, un carrello elevatore minio', 'In magazzino, tra travi e pannelli'),
      drawnView(TETTOIE, '03', 'Illustrazione di una tettoia in legno lamellare addossata a una casa, vista dal giardino: pilastri e travetti color miele, il bordo della copertura in minio, sotto un’auto e un tavolo con le sedie', 'La tettoia finita'),
    ],
    featured: false,
    sample: false,
  },
  {
    slug: STRADA,
    code: 'AP-26-T01',
    title: 'Una strada tra due punti',
    subtitle: 'Dal tracciolino ai metri cubi di scavo, su una carta a curve di livello',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Progetto stradale', 'Topografia', 'Planimetrie', 'Profili', 'Sezioni', 'Computo'],
    client: 'Esercitazione di topografia — classe 5ª BT',
    sector: 'Infrastrutture stradali',
    location: 'I.T.T. «Carlo d’Arco», Mantova',
    year: 2026,
    services: ['Tracciolini a pendenza costante', 'Poligonale d’asse e curve circolari', 'Picchettamento', 'Profilo longitudinale e livellette', 'Sezioni trasversali', 'Calcolo dei movimenti di terra'],
    technologies: ['AutoCAD LT', 'Excel'],
    summary: 'Una strada di 934 m tra due punti di una carta a curve di livello: due tracciolini al 5,3%, quattro curve di raggio 80 m, 28 picchetti, profilo, sezioni e il calcolo dei 23.447 m³ di scavo.',
    description:
      'Un progetto stradale completo, dal primo tracciato sulla carta al conto della terra da muovere: collegare la partenza, a quota 300 m, con l’arrivo, a quota 286 m, su una carta con le curve di livello ogni 2 m e un corso d’acqua nel fondovalle.',
    goal: 'Tracciare una strada che scenda nel fondovalle e risalga dall’altra parte con pendenze regolari, e arrivare a sapere quanta terra scavare e quanta riportare.',
    problem:
      'Tra partenza e arrivo ci sono 31 metri da scendere e 17 da risalire, con il fondovalle a quota 269 e il corso d’acqua da attraversare. La linea più breve è impraticabile: la strada deve seguire il terreno, e ogni scelta in pianta cambia il profilo, le sezioni e i volumi.',
    strategy:
      'Ho seguito il metodo in ordine. Prima i tracciolini, spezzate a pendenza costante del 5,3% costruite con il compasso aperto a 37,74 m tra una curva di livello e l’altra; poi le poligonali d’asse che li regolarizzano, le curve, i picchetti, e solo alla fine profilo, sezioni e volumi. Ho confrontato due ipotesi e ho sviluppato la seconda.',
    development: [
      { title: 'Tracciato', text: 'Due tracciolini da un estremo all’altro e due poligonali d’asse, una a quattro vertici di 968 m e una a due vertici di 892 m. Quella definitiva segue il secondo tracciolino con quattro vertici.' },
      { title: 'Curve', text: 'Quattro curve circolari di raggio 80 m, con deviazioni di 67,1°, 67,6°, 67,0° e 10,3°: 296 m di archi sui 934 m dell’asse, picchettato in 28 punti dalla partenza all’arrivo.' },
      { title: 'Profilo', text: 'Altezze esagerate dieci volte e tre livellette: −6,52% per 475,75 m fino al fondovalle, un tratto in piano di 76,16 m e +4,45% per 382,06 m fino a B. Lo scavo più profondo, 5,22 m, è al picchetto 26.' },
      { title: 'Volumi', text: '28 sezioni con piattaforma di 10 m, aree di sterro e riporto misurate in AutoCAD e un foglio Excel che calcola i volumi con le sezioni ragguagliate: 23.447 m³ di scavo e 569 m³ di riporto.' },
    ],
    result: 'Otto tavole e un foglio di calcolo che si tengono insieme: la strada scende e risale lungo 934 m e il bilancio delle terre chiude con 22.878 m³ di scavo in eccesso, da portare via.',
    metrics: [
      { value: '934 m', label: 'Lunghezza dell’asse' },
      { value: '28', label: 'Picchetti e sezioni' },
      { value: '23.447 m³', label: 'Volume di sterro' },
    ],
    sheets: stradaSheets,
    cover: drawnCover(STRADA, 'Illustrazione in assonometria: un blocco di collina a curve di livello con la strada di progetto in minio che scende nel fondovalle, attraversa il corso d’acqua e risale; sul fronte del blocco, il profilo longitudinale'),
    images: [
      drawnView(STRADA, '01', 'Illustrazione a volo d’uccello della strada finita: scende il versante con lunghi rettifili e curve, attraversa il torrente nel fondovalle su un piccolo ponte e risale il pendio opposto, con la linea di mezzeria in minio', 'La strada nella valle'),
      drawnView(STRADA, '02', 'Illustrazione in assonometria di una fetta di collina tagliata di traverso alla strada: la piattaforma di 10 metri incassata nel pendio, la cunetta dal lato a monte, la scarpata a valle, con lo scavo in minio e il riporto in giallo sulla faccia tagliata', 'Sterro e riporto in una sezione'),
      drawnView(STRADA, '03', 'Illustrazione di un versante erboso: un topografo di spalle alla stazione totale sul treppiede e una fila di picchetti con la testa minio che scende a valle seguendo le curve della futura strada, oltre il torrente e su per il pendio opposto', 'Il picchettamento dell’asse'),
    ],
    featured: true,
    sample: false,
  },
  {
    slug: BAR,
    code: 'AP-26-T03',
    title: 'Bar-caffetteria in un’area verde',
    subtitle: '«Officina del gusto e orto della salute»: il tema d’esame in otto tavole',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Progettazione', 'Planimetrie', 'Prospetti', 'Sezioni', 'Verifiche igienico-sanitarie', 'CAD'],
    client: 'Esame di Stato 2026 — Progettazione, Costruzioni e Impianti',
    sector: 'Ristorazione e verde pubblico',
    location: 'I.T.T. «Carlo d’Arco», Mantova',
    year: 2026,
    services: ['Planimetria generale del parco', 'Piante, prospetti e sezione', 'Quadro delle superfici', 'Verifica dei rapporti aeroilluminanti', 'Strutture leggere in legno'],
    technologies: ['AutoCAD LT'],
    summary: 'Il tema d’esame di Progettazione, Costruzioni e Impianti: un bar-caffetteria di 161 m² in un parco con orto didattico, due gazebo e una struttura per l’orto, in otto tavole A3 con superfici e verifiche aeroilluminanti.',
    description:
      'Il primo quesito della seconda parte chiedeva un bar-caffetteria dentro un parco pensato per scoprire il mondo agricolo, «Officina del gusto e orto della salute». Ho disegnato il parco in scala 1:500 e l’edificio in scala 1:100, dalla pianta arredata alla sezione, con il quadro delle superfici scritto direttamente sulle tavole.',
    goal: 'Un locale aperto sul verde, con i servizi per il pubblico e per il personale separati, e i conti delle superfici e dell’illuminazione naturale che tornano locale per locale.',
    problem:
      'Un programma fitto per un edificio di un piano: sala per il pubblico, bancone, cucina, laboratorio, due blocchi di servizi, strutture esterne e il parco intorno. La sala e i locali di lavoro dovevano rispettare il rapporto aeroilluminante di 1/8, e i servizi senza finestre andavano risolti con l’aerazione meccanica.',
    strategy:
      'Ho tenuto l’edificio compatto, 13,90 × 14,40 m con struttura portante in cemento armato, e l’ho aperto verso il parco con ampie vetrate. Le travi lignee a vista in copertura non portano nulla: fanno da schermatura solare e disegnano il prospetto. Fuori, tre strutture leggere in legno di 4,20 × 2,70 m con telo in PVC, reversibili e senza impermeabilizzare il suolo.',
    development: [
      { title: 'Parco', text: 'Planimetria in scala 1:500 con percorsi pedonali dal disegno organico, prati e alberature irregolari, l’orto didattico collegato al bar e il commento al progetto del verde.' },
      { title: 'Edificio', text: 'Pianta arredata, pianta quotata, pianta delle coperture, quattro prospetti e la sezione A-A in scala 1:100, con le quote di livello da 0,00 a 3,50 m.' },
      { title: 'Verifiche', text: 'Una scheda per locale e il riepilogo delle superfici: 161,24 m² interni, 34,02 m² di strutture esterne, 195,26 m² in tutto. Sala bar e laboratorio superano il rapporto aeroilluminante di 1/8.' },
    ],
    result: 'Otto tavole A3 con cartiglio, scale e quadro delle superfici. La sala bar, 107 m², ha 24,26 m² di superfici aeroilluminanti: quasi il doppio dei 13,4 richiesti.',
    metrics: [
      { value: '161,24 m²', label: 'Superficie interna' },
      { value: '8', label: 'Tavole A3' },
      { value: '24,26 m²', label: 'Aperture della sala bar' },
    ],
    sheets: barSheets,
    cover: drawnCover(BAR, 'Illustrazione in assonometria del parco: il bar-caffetteria a un piano con le travi di legno a vista, la terrazza con gli ombrelloni tra i due gazebo, la piazza a quadrifoglio con la fontana, gli alberi e l’orto didattico'),
    images: [
      drawnView(BAR, '01', 'Illustrazione del bar-caffetteria visto dal prato: l’edificio a un piano verde oliva e grigio con le grandi vetrate e le travi di legno a vista, la terrazza con gli ombrelloni minio tra i due gazebo, le persone ai tavoli e l’orto a lato', 'Il bar visto dal parco'),
      drawnView(BAR, '02', 'Illustrazione dell’interno della sala bar: il lungo bancone con il fronte minio e gli sgabelli, i tavolini, la parete di vetrate aperta sul parco con i gazebo e le teste delle travi di legno fuori', 'Dentro la sala bar'),
      drawnView(BAR, '03', 'Illustrazione in assonometria del bar senza tetto, con i muri tagliati a metà altezza: la sala con il bancone minio e i tavoli, la cucina, il laboratorio, i due blocchi di servizi, e fuori la terrazza con i gazebo', 'La pianta arredata, in volume'),
    ],
    featured: true,
    sample: false,
  },
  {
    slug: CANTIERE,
    code: 'AP-26-T02',
    title: 'Layout di cantiere',
    subtitle: 'Gru, baracche e depositi per un edificio a elementi prefabbricati',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Cantiere', 'Sicurezza', 'Planimetrie', 'CAD'],
    client: 'Esercitazione — classe 5ª BT',
    sector: 'Organizzazione del cantiere',
    location: 'I.T.T. «Carlo d’Arco», Mantova',
    year: 2026,
    services: ['Layout di cantiere', 'Legenda dei simboli', 'Dotazione del cantiere', 'Piante dell’edificio'],
    technologies: ['AutoCAD LT'],
    summary: 'Il layout di cantiere per un edificio a elementi prefabbricati: recinzione, due accessi, autogru, due baracche, depositi e postazioni fisse, con una legenda di 24 simboli e le piante dell’edificio.',
    description:
      'Un edificio con magazzino, portico, uffici e abitazione, montato con pilastri, travi, solai e pannelli prefabbricati. Qui il progetto è il cantiere: dove entrano i camion con gli elementi, dove lavora la gru, dove si appoggiano pilastri e pannelli in attesa del montaggio, dove stanno uffici, servizi e depositi.',
    goal: 'Organizzare l’area perché mezzi pesanti, gru e persone non si intralcino, e perché ogni zona del cantiere si riconosca a colpo d’occhio sulla tavola.',
    problem:
      'Gli elementi prefabbricati arrivano con trasporti eccezionali e li solleva un’autogru: servono un accesso carrabile adatto, una viabilità interna che regga i mezzi e un’area di deposito raggiungibile dalla gru, oltre a uffici, servizi e depositi per chi ci lavora.',
    strategy:
      'Ho diviso l’area in zone con una funzione sola e un simbolo per ciascuna: 24 voci di legenda, dalla recinzione al quadro principale. Accanto alla legenda la dotazione del cantiere è scritta per esteso, così la tavola si legge anche senza conoscere i simboli.',
    development: [
      { title: 'Inquadramento', text: 'Il lotto intero, la strada, i due accessi, uno carrabile e uno pedonale, e la recinzione alta 2 m intorno all’area di cantiere.' },
      { title: 'Layout', text: 'L’autogru con il suo raggio d’azione; la baracca A per l’ufficio di cantiere e la direzione lavori, con WC e pronto soccorso; la baracca B per l’impresa e la guardiola; depositi, postazioni per malta e ferro, parcheggio e percorso dei mezzi.' },
      { title: 'Edificio', text: 'Le piante del piano terra e del piano primo: magazzino con portico, uffici e servizi, cucina, lavanderia, due camere e un bagno.' },
    ],
    result: 'Quattro tavole A3 in cui il cantiere si capisce prima ancora di leggere la legenda: un accesso per i mezzi e uno per le persone, un posto per ogni materiale e la gru al centro del lavoro.',
    metrics: [
      { value: '24', label: 'Voci di legenda' },
      { value: '2', label: 'Accessi, carrabile e pedonale' },
      { value: '2,00 m', label: 'Altezza della recinzione' },
    ],
    sheets: cantiereSheets,
    cover: drawnCover(CANTIERE, 'Illustrazione in assonometria del cantiere: l’edificio prefabbricato in montaggio, l’autogru in minio con il suo raggio d’azione, la recinzione, le baracche, i depositi e i mezzi'),
    images: [
      drawnView(CANTIERE, '01', 'Illustrazione dentro il cantiere: l’autogru minio solleva un pannello prefabbricato di calcestruzzo guidato da due operai con il gilet ad alta visibilità, accanto a pilastri e travi già montati', 'Il montaggio con l’autogru'),
      drawnView(CANTIERE, '02', 'Illustrazione dell’ingresso carrabile del cantiere: un autoarticolato con una lunga trave prefabbricata passa dal cancello aperto nella recinzione; dentro le baracche, il bagno chimico, i bancali e, davanti all’edificio in costruzione, l’autogru minio che solleva una trave', 'L’arrivo di una trave'),
      drawnView(CANTIERE, '03', 'Illustrazione in assonometria dell’edificio finito sul suo lotto: il magazzino alto al centro con il portico minio sul fronte, l’ala a due piani con l’abitazione, l’ala degli uffici, il piazzale, i parcheggi e gli alberi giovani', 'L’edificio finito'),
    ],
    featured: false,
    sample: false,
  },
  {
    slug: MUSEO,
    code: 'AP-25-T04',
    title: 'Museo dei Mestieri del Fiume',
    subtitle: 'Una mattina al museo etnografico del mio paese, in quattro pagine e 80 fotografie',
    area: 'tecnico',
    categories: ['altro'],
    types: ['Relazione', 'Territorio', 'Fotografia', 'Impaginazione'],
    client: 'Educazione civica — classe 5ª BT',
    sector: 'Cultura e territorio',
    location: 'Rivalta sul Mincio, Rodigo (MN)',
    year: 2025,
    services: ['Relazione di visita', 'Schede degli oggetti', 'Fotografie', 'Impaginazione'],
    technologies: ['Word'],
    summary: 'La relazione sull’uscita didattica al Museo Etnografico dei Mestieri del Fiume di Rivalta sul Mincio, con 80 fotografie della giornata: la strada in bicicletta con la classe, la cucina del cannaiolo, gli animali della valle, gli attrezzi della canna, della caccia e della pesca.',
    description:
      'Il 15 novembre 2025 la classe ha visitato il Museo Etnografico dei Mestieri del Fiume a Rivalta sul Mincio, il paese dove vivo, arrivandoci in bicicletta da Mantova per Montanara e le Grazie. La guida era un operatore del Parco del Mincio; la visita è partita dal Loghino Ariello e ha attraversato la cucina ricostruita di un pescatore-contadino e il cortile con barche, reti e trappole.',
    goal: 'Raccontare la visita in modo che si capisca cosa conserva il museo e perché conta per chi vive lungo il Mincio: la vita quotidiana, i mestieri della palude, il rapporto tra le persone e il fiume.',
    problem:
      'Un museo di oggetti d’uso, non di opere con la didascalia: per descriverli bisognava ascoltare la guida, guardarli da vicino e ricostruire a cosa servivano, come si usavano e in che epoca.',
    strategy:
      'Ho diviso la relazione in quattro parti — introduzione, oggetti osservati, impressioni personali, conclusioni — e ho messo ogni oggetto accanto alla sua fotografia, con il testo che le scorre intorno.',
    development: [
      { title: 'Percorso', text: 'La riserva delle Valli del Mincio e la storia della valle, dalle palafitte agli Etruschi alla regolazione delle acque nel Medioevo; poi la cucina d’epoca e gli attrezzi del cortile, con il mestiere del calafato.' },
      { title: 'Oggetti', text: 'Tre schede: un grande corno con l’anello per appenderlo, usato come contenitore e per richiamare il bestiame; un tostacaffè domestico di inizio Novecento; un cardatore manuale per la lana.' },
      { title: 'Impressioni', text: 'Nelle impressioni personali ho scritto della stufa in ghisa della cucina: tutto, dalle pentole al tostacaffè, era organizzato intorno a lei.' },
    ],
    result: 'Quattro pagine A4 impaginate in Word e 80 fotografie della giornata, dalla partenza in bicicletta con la classe alla barca da pesca.',
    metrics: [
      { value: '4', label: 'Pagine A4' },
      { value: '80', label: 'Fotografie della visita' },
      { value: '15.11.2025', label: 'Data della visita' },
    ],
    sheets: museoSheets,
    cover: drawnCover(MUSEO, 'Illustrazione in assonometria del museo sul Mincio: gli edifici rurali rossi intorno al prato, il pontile di legno con la barca da pesca, il canneto sull’altra sponda e le biciclette della classe all’ingresso'),
    images: [
      drawnView(MUSEO, '01', 'Illustrazione della cucina d’epoca ricostruita nel museo: la stufa in ghisa minio al centro, il tavolo con la rete e la pentola, le mensole con il tostacaffè, il macinino e i fiaschi impagliati', 'La cucina del cannaiolo'),
      drawnView(MUSEO, '02', 'Illustrazione da catalogo dei tre oggetti descritti nella relazione: un grande corno con l’anello per appenderlo, un tostacaffè di inizio Novecento con il manico di legno e un cardatore per la lana, ciascuno con un cartellino legato da un filo minio', 'Il corno, il tostacaffè, il cardatore'),
      drawnView(MUSEO, '03', 'Illustrazione della sala della pesca del museo: la barca piatta e stretta di legno con remi, pertica e reti, le nasse con la rete minio appese alle travi del soffitto e le fascine di canna contro il muro', 'La barca e le nasse'),
    ],
    photos: museoPhotos,
    featured: false,
    sample: false,
  },
  {
    slug: 'casa-xlam-bim',
    code: 'AP-26-004',
    title: 'Casa unifamiliare in X-LAM',
    subtitle: 'Un modello BIM che serve al cantiere, non solo alla presentazione',
    area: 'tecnico',
    categories: ['tecnico', '3d'],
    types: ['BIM', 'Modellazione 3D', 'Rendering', 'Progettazione'],
    client: 'Committente privato',
    sector: 'Residenziale',
    location: 'Curtatone (MN)',
    year: 2026,
    services: ['Modellazione BIM', 'Abachi e computi', 'Rendering', 'Tavole di progetto'],
    technologies: ['Archicad', 'Twinmotion', 'AutoCAD', 'Excel'],
    summary: 'Modello informativo LOD 300 di un’abitazione a pannelli X-LAM: abachi, computo dei pannelli e viste neutre per decidere senza farsi distrarre dai materiali.',
    description:
      'Una casa di 160 m² su due livelli, struttura a pannelli in legno massiccio a strati incrociati. Il modello doveva rispondere a domande concrete: quanti metri quadri di pannello, quali aperture, dove passano gli impianti.',
    goal: 'Costruire un modello da cui estrarre in automatico piante, sezioni, abaco dei serramenti e quantità dei pannelli, mantenendolo leggero e aggiornabile.',
    problem: 'Le modifiche del committente arrivavano a progetto avanzato: con un flusso 2D ogni variante avrebbe significato ridisegnare piante, prospetti e computo a mano.',
    strategy:
      'Modellare per stratigrafie reali, legare ogni elaborato al modello e presentare le varianti con rendering volutamente neutri, in scala di grigi: si discute di volumi e luce, i materiali vengono dopo.',
    development: [
      { title: 'Impostazione', text: 'Griglia strutturale, livelli, stratigrafie di pareti, solai e copertura ventilata.' },
      { title: 'Modello', text: 'Pannelli X-LAM 100 e 160, forometrie, scala, nodo parete-platea con cordolo di rialzo.' },
      { title: 'Estrazione', text: 'Abaco serramenti, superfici dei pannelli per spessore, tavole in scala 1:100 e 1:50.' },
      { title: 'Viste', text: 'Esploso assonometrico per il committente e quattro rendering clay per le varianti di facciata.' },
    ],
    result: 'Tre varianti valutate in una settimana, con quantità sempre allineate ai disegni. Il fornitore dei pannelli ha ricevuto un file, non una cartella di PDF da interpretare.',
    metrics: [
      { value: 'LOD 300', label: 'Livello di sviluppo' },
      { value: '412 m²', label: 'Di pannelli computati' },
      { value: '3', label: 'Varianti confrontate' },
    ],
    cover: img('bim', { code: 'AP-26-004' }, 'Esploso assonometrico del modello BIM con i cinque livelli costruttivi'),
    images: [
      img('bim', { code: 'AP-26-004' }, 'Esploso assonometrico del modello BIM con i cinque livelli costruttivi', 'TAV. 04 — Esploso assonometrico'),
      img('render', {}, 'Rendering volumetrico neutro dell’abitazione con annesso', 'Vista clay — variante B'),
      img('floorplan', { variant: 'casa', code: 'AP-26-004' }, 'Pianta del piano terra estratta dal modello', 'TAV. 02 — Pianta piano terra, scala 1:100'),
      img('render', { tone: 'ink' }, 'Rendering volumetrico in versione notturna', 'Vista clay — studio delle ombre'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'frazionamento-accatastamento',
    code: 'AP-24-005',
    title: 'Frazionamento e accatastamento',
    subtitle: 'Una particella, due proprietà, zero sorprese dal notaio',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Catasto', 'Rilievi', 'Planimetrie', 'CAD'],
    client: 'Committenti privati',
    sector: 'Residenziale',
    location: 'Mantova',
    year: 2024,
    services: ['Rilievo celerimetrico', 'Tipo di frazionamento', 'Tipo mappale', 'Planimetrie catastali'],
    technologies: ['GNSS', 'Stazione totale', 'Pregeo', 'Docfa', 'AutoCAD'],
    summary: 'Divisione di un lotto tra due eredi: rilievo appoggiato ai punti fiduciali, tipo di frazionamento e nuove planimetrie approvati al primo invio.',
    description:
      'Due fratelli, un lotto con casa e terreno da dividere. La linea di confine andava decisa sul posto, misurata bene e scritta negli atti in modo che tra vent’anni nessuno debba discuterne.',
    goal: 'Frazionare la particella in due lotti funzionali, aggiornare la mappa e allineare le planimetrie dell’abitazione allo stato reale prima del rogito.',
    problem: 'La mappa catastale riportava un fabbricato ampliato negli anni Ottanta e mai aggiornato; i punti fiduciali più vicini erano in parte irreperibili.',
    strategy: 'Ricostruire l’inquadramento su tre fiduciali attendibili, picchettare la dividente insieme ai proprietari e presentare in sequenza tipo mappale, frazionamento e variazione Docfa.',
    development: [
      { title: 'Ricerca', text: 'Visure, estratto di mappa, monografie dei fiduciali e verifica della conformità edilizia.' },
      { title: 'Rilievo', text: 'GNSS sui fiduciali, stazione totale per fabbricato e confini, picchettamento della nuova dividente.' },
      { title: 'Atti', text: 'Pregeo per mappale e frazionamento, Docfa con nuove planimetrie ed elaborato planimetrico.' },
    ],
    result: 'Atti approvati al primo invio, due lotti con accessi indipendenti e planimetrie conformi. Il rogito si è fatto nella data già fissata.',
    metrics: [
      { value: '3', label: 'Punti fiduciali' },
      { value: '24,60 m', label: 'Nuova dividente' },
      { value: '1°', label: 'Invio approvato' },
    ],
    cover: img('cadastral', { code: 'AP-24-005' }, 'Estratto di mappa catastale con la particella da frazionare evidenziata'),
    images: [
      img('cadastral', { code: 'AP-24-005' }, 'Estratto di mappa catastale con la particella da frazionare evidenziata', 'TAV. 01 — Estratto di mappa con dividente'),
      img('floorplan', { variant: 'casa', code: 'AP-24-005', tav: 'TAV. 03' }, 'Planimetria dell’abitazione aggiornata allo stato reale', 'TAV. 03 — Planimetria aggiornata'),
      img('ortho', { code: 'AP-24-005', tone: 'ink', bare: true }, 'Inquadramento territoriale del lotto', 'Inquadramento su ortofoto'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'planivolumetrico-ambito-residenziale',
    code: 'AP-25-014',
    title: 'Planivolumetrico di un ambito residenziale',
    subtitle: 'Dieci lotti, un anello, un parco al centro',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Urbanistica', 'Progettazione', 'Planimetrie', 'CAD'],
    client: 'Studio tecnico associato',
    sector: 'Urbanistica',
    location: 'Porto Mantovano (MN)',
    year: 2025,
    services: ['Studio di fattibilità', 'Planivolumetrico', 'Verifica degli standard', 'Tavole di piano'],
    technologies: ['AutoCAD', 'QGIS', 'Excel'],
    summary: 'Collaborazione a un piano attuativo: disegno dei lotti, verifica di standard e indici, tavole di piano pronte per l’istruttoria.',
    description:
      'Un’area di diciottomila metri quadri ai margini dell’abitato. Lo studio incaricato aveva bisogno di qualcuno che trasformasse schizzi e numeri in un planivolumetrico verificabile.',
    goal: 'Disporre dieci lotti residenziali, viabilità, parcheggi e verde pubblico rispettando indice territoriale, altezze e dotazioni minime.',
    problem: 'Ogni spostamento di un lotto cambiava superfici fondiarie, standard e sviluppo delle reti. Senza un disegno parametrico le verifiche andavano rifatte ogni volta.',
    strategy: 'Un file CAD con le superfici collegate a un foglio di calcolo: si muove una linea, si aggiornano gli indici. Le tavole escono dal modello, non lo inseguono.',
    development: [
      { title: 'Analisi', text: 'Vincoli, fasce di rispetto, reti esistenti e lettura del tessuto edilizio circostante in QGIS.' },
      { title: 'Schema', text: 'Viabilità ad anello a senso unico, verde baricentrico, lotti sul perimetro con fronte di 22 metri.' },
      { title: 'Verifiche', text: 'Superficie territoriale, SLP, rapporto di copertura, parcheggi e verde: tabella collegata al disegno.' },
    ],
    result: 'Planivolumetrico e tabelle consegnati allo studio in tre settimane, recepiti nel piano senza modifiche allo schema.',
    metrics: [
      { value: '18.420 m²', label: 'Superficie territoriale' },
      { value: '10', label: 'Lotti edificabili' },
      { value: '4.105 m²', label: 'Verde e parcheggi' },
    ],
    cover: img('urban', { code: 'AP-25-014' }, 'Planivolumetrico con viabilità ad anello, lotti, parcheggi e verde centrale'),
    images: [
      img('urban', { code: 'AP-25-014' }, 'Planivolumetrico con viabilità ad anello, lotti, parcheggi e verde centrale', 'TAV. 02 — Planivolumetrico, scala 1:500'),
      img('ortho', { code: 'AP-25-014', seed: 8, tav: 'TAV. 01' }, 'Inquadramento dell’ambito su ortofoto', 'TAV. 01 — Inquadramento'),
      img('render', {}, 'Studio volumetrico dei tipi edilizi', 'Tipi edilizi — studio volumetrico'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'cantiere-rifacimento-facciate',
    code: 'AP-26-002',
    title: 'Cantiere per il rifacimento delle facciate',
    subtitle: 'Layout, cronoprogramma e contabilità di un condominio abitato',
    area: 'tecnico',
    categories: ['tecnico', 'cad'],
    types: ['Cantiere', 'Pratiche edilizie', 'CAD'],
    client: 'Condominio',
    sector: 'Residenziale',
    location: 'Mantova',
    year: 2026,
    services: ['Layout di cantiere', 'Cronoprogramma', 'Contabilità lavori', 'Pratica CILA'],
    technologies: ['AutoCAD', 'Primus', 'Excel'],
    summary: 'Venti settimane di lavori con sedici famiglie in casa: un layout che tiene liberi gli accessi e un cronoprogramma che tutti possono leggere.',
    description:
      'Rifacimento di intonaci e cappotto su un condominio di quattro piani. Il lavoro tecnico era ordinario; la difficoltà stava nel farlo convivere con chi ci abita.',
    goal: 'Organizzare il cantiere in modo che ponteggi, gru e depositi non bloccassero mai ingressi, box e raccolta rifiuti, e rendicontare i lavori in modo trasparente all’assemblea.',
    problem: 'Un solo accesso carraio condiviso tra mezzi di cantiere e residenti, un cortile di 400 m² e un’assemblea diffidente dopo un precedente appalto sforato.',
    strategy: 'Disegnare il layout prima di chiedere i preventivi, così le imprese quotano la stessa organizzazione; pubblicare ogni venerdì stato di avanzamento e contabilità in una pagina condivisa.',
    development: [
      { title: 'Layout', text: 'Ponteggio sui quattro lati, gru a torre con raggio di 32 m, percorso dei mezzi separato dagli ingressi pedonali.' },
      { title: 'Tempi', text: 'Cronoprogramma a sei fasi con percorso critico evidenziato e finestre meteo per le rasature.' },
      { title: 'Conti', text: 'Libretto delle misure e stati di avanzamento con fotografie georiferite per ogni voce.' },
    ],
    result: 'Lavori chiusi in diciannove settimane su venti, con uno scostamento di spesa dell’1,8%. Nessun giorno di accessi bloccati.',
    metrics: [
      { value: '19 / 20', label: 'Settimane impiegate' },
      { value: '+1,8%', label: 'Scostamento di spesa' },
      { value: '1.260 m²', label: 'Di facciata' },
    ],
    cover: img('sitelayout', { code: 'AP-26-002' }, 'Layout di cantiere con gru, ponteggi, depositi e cronoprogramma'),
    images: [
      img('sitelayout', { code: 'AP-26-002' }, 'Layout di cantiere con gru, ponteggi, depositi e cronoprogramma', 'TAV. 06 — Layout e cronoprogramma'),
      img('elevation', { state: 'after', code: 'AP-26-002', tav: 'TAV. 03' }, 'Prospetto tipo con le lavorazioni di facciata', 'TAV. 03 — Prospetto con lavorazioni'),
      img('section', { code: 'AP-26-002', tav: 'TAV. 05' }, 'Sezione con il nodo del cappotto in gronda', 'TAV. 05 — Sezione e nodi'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'planimetrie-immobiliari',
    code: 'AP-24-009',
    title: 'Planimetrie per la vendita immobiliare',
    subtitle: 'Un formato solo per quaranta annunci',
    area: 'tecnico',
    categories: ['tecnico', 'cad', 'grafica'],
    types: ['Planimetrie', 'CAD', 'Rilievi', 'Rendering'],
    client: 'Agenzia immobiliare',
    sector: 'Immobiliare',
    location: 'Mantova',
    year: 2024,
    services: ['Rilievo speditivo', 'Planimetrie arredate', 'Template grafico', 'Esportazione per il web'],
    technologies: ['Distanziometro laser', 'AutoCAD', 'Illustrator'],
    summary: 'Planimetrie arredate, tutte nella stessa grafica, consegnate entro 48 ore dal sopralluogo: qui il disegno tecnico incontra l’impaginazione.',
    description:
      'Un’agenzia che pubblicava planimetrie di ogni provenienza: scansioni catastali, schizzi, fotografie storte. Serviva uno standard riconoscibile, veloce da produrre.',
    goal: 'Definire un formato unico — spessori, arredi, quote, superfici — e un flusso che porti dal sopralluogo al file per il portale in due giorni.',
    problem: 'Le planimetrie catastali non si possono pubblicare così come sono e spesso non corrispondono più allo stato dei luoghi.',
    strategy: 'Rilievo speditivo con distanziometro, libreria di blocchi arredo disegnata una volta sola, template con cartiglio dell’agenzia ed esportazione in SVG leggero.',
    development: [
      { title: 'Standard', text: 'Muri campiti, arredi al tratto sottile, superfici per vano, nord e scala grafica sempre nella stessa posizione.' },
      { title: 'Libreria', text: 'Sessanta blocchi dinamici tra arredi, sanitari e serramenti.' },
      { title: 'Consegna', text: 'PDF per la stampa e SVG sotto i 60 KB per il sito dell’agenzia.' },
    ],
    result: 'Quaranta immobili pubblicati con lo stesso linguaggio grafico. L’agenzia ora riconosce i propri annunci a colpo d’occhio, e così i clienti.',
    metrics: [
      { value: '40', label: 'Immobili disegnati' },
      { value: '48 h', label: 'Dal sopralluogo al file' },
      { value: '< 60 KB', label: 'Per planimetria web' },
    ],
    cover: img('floorplan', { variant: 'casa', code: 'AP-24-009', tone: 'ink', tav: 'TAV. 01' }, 'Planimetria arredata di un’abitazione su un piano'),
    images: [
      img('floorplan', { variant: 'casa', code: 'AP-24-009', tone: 'ink', tav: 'TAV. 01' }, 'Planimetria arredata di un’abitazione su un piano', 'Scheda tipo — abitazione su un piano'),
      img('floorplan', { variant: 'rustico', code: 'AP-24-009', tav: 'TAV. 02' }, 'Planimetria arredata di un rustico ristrutturato', 'Scheda tipo — rustico con portico'),
      img('render', {}, 'Vista volumetrica usata come immagine di copertina dell’annuncio', 'Vista volumetrica per l’annuncio'),
    ],
    featured: false,
    sample: true,
  },

  // ═══ WEB ═══════════════════════════════════════════════════════════════════
  {
    // Il dominio con il trattino, come albertopecchini-it: con `trailingSlash`
    // Vercel tratta «.it» come l'estensione di un file e toglie la barra finale.
    // vercel.json porta qui /portfolio/rivalta-sul-mincio/ e /portfolio/rivaltasulmincio.it.
    slug: 'rivaltasulmincio-it',
    code: 'AP-26-W01',
    title: 'Rivalta sul Mincio',
    subtitle: 'Un paese sul Mincio, letto luogo per luogo',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'UI/UX', 'Sviluppo frontend', 'Dati aperti'],
    client: 'Progetto indipendente',
    sector: 'Territorio e informazione locale',
    location: 'Rivalta sul Mincio, Rodigo (MN)',
    year: 2026,
    services: ['Architettura dei contenuti', 'Web design', 'Sviluppo frontend', 'Integrazione dati OpenStreetMap', 'Fotografia'],
    technologies: ['Vite', 'TypeScript', 'OpenStreetMap', 'Leaflet', 'Web Animations API', 'Vercel'],
    summary: 'Un atlante digitale di Rivalta sul Mincio: 184 luoghi da OpenStreetMap su mappa e in 124 schede, il meteo della stazione del paese, un giornale locale e la fonte di ogni dato.',
    description:
      'Rivalta sul Mincio è una frazione di Rodigo, in provincia di Mantova, affacciata sulla Riserva Naturale Valli del Mincio. Il sito non è il portale del Comune né una guida turistica: è un atlante del paese fatto di dati verificabili, in cui ogni numero dice da dove viene e quando è stato controllato.',
    goal: 'Serve a chi abita a Rivalta, a chi ne è originario e a chi ci passa, per sapere cosa c’è in paese, dove si trova e da quale fonte arriva ogni informazione.',
    problem:
      'Le informazioni su Rivalta stanno in posti diversi — OpenStreetMap, la stazione meteo del paese, il sito del Comune, le locandine delle associazioni — ognuno con il suo formato e la sua data. Metterle insieme senza inventare nulla voleva dire tenere ogni dato legato alla sua fonte e poterlo aggiornare senza rifare le pagine.',
    strategy:
      'Prima delle pagine ho scritto le regole: diciannove documenti di specifica, dal contratto architetturale ai colori. I dati vivono in file JSON separati dall’interfaccia e ogni pagina è HTML statico generato al build, senza framework. L’aspetto è quello di uno strumento da consultare: carta crema a quadretti, pannelli marrone scuro, etichette in monospace, coordinate e date di aggiornamento accanto ai numeri.',
    development: [
      { title: 'Dati', text: 'Uno script interroga OpenStreetMap entro 2,5 km dal paese, traduce i tag in 9 categorie e 71 tipi e confronta il risultato con l’archivio: gli identificativi non cambiano e un luogo sparito resta, segnato come rimosso.' },
      { title: 'Mappa', text: 'Leaflet con i marker raggruppati per categoria, caricato solo quando la mappa entra nello schermo; sul telefono la scheda del luogo sale dal basso. L’elenco dei luoghi ne è l’alternativa testuale completa, leggibile anche senza JavaScript.' },
      { title: 'Meteo', text: 'La stazione MeteoMincio non ha API: due funzioni su Vercel leggono i suoi file, li normalizzano e li tengono in cache per 60 secondi e 15 minuti. La pagina dice anche quando il dato è vecchio o non arriva.' },
    ],
    result: 'Il sito è online in beta su rivaltasulmincio.it con 132 pagine statiche, circa 3 KB di JavaScript all’apertura e nessun sistema di tracciamento. Il giornale è partito con la Sagra dei Patroni 2026, pubblicata insieme alla locandina originale degli organizzatori.',
    metrics: [
      { value: '184', label: 'Luoghi da OpenStreetMap' },
      { value: '50', label: 'Fotografie originali' },
      { value: '132', label: 'Pagine statiche generate' },
    ],
    web: {
      url: 'https://www.rivaltasulmincio.it',
      domain: 'rivaltasulmincio.it',
      desktop: shot('rivalta-desktop.webp', 1200, 750, 'Home page di rivaltasulmincio.it su desktop'),
      desktopTall: shot('rivalta-desktop-tall.webp', 1200, 2833, 'Home page di rivaltasulmincio.it, pagina intera'),
      tablet: shot('rivalta-tablet.webp', 720, 1036, 'Home page di rivaltasulmincio.it su tablet'),
      mobile: shot('rivalta-mobile.webp', 600, 1298, 'Home page di rivaltasulmincio.it su smartphone'),
      mobileTall: shot('rivalta-mobile-tall.webp', 600, 4000, 'Home page di rivaltasulmincio.it su smartphone, pagina intera'),
      palette: ['#F3EDE0', '#1F1A16', '#4A2B1A', '#A63A1A', '#E9E1D0'],
    },
    cover: shot('rivalta-desktop.webp', 1200, 750, 'Home page di rivaltasulmincio.it'),
    // La home è già nei dispositivi in apertura: la galleria mostra le pagine interne.
    images: [
      shot('rivalta-mappa-desktop.webp', 1200, 750, 'La mappa di rivaltasulmincio.it con i marker per categoria e la scheda della chiesa dei Santi Vigilio e Donato aperta', 'Mappa — desktop 1440 px'),
      shot('rivalta-luogo-tablet.webp', 720, 960, 'La scheda della chiesa dei Santi Vigilio e Donato su rivaltasulmincio.it: fotografia, dati del luogo e mappa', 'Scheda di un luogo — tablet 820 px'),
      shot('rivalta-mappa-mobile.webp', 600, 1298, 'La mappa di rivaltasulmincio.it su smartphone, con la scheda del luogo aperta dal basso', 'Mappa, scheda dal basso — smartphone 390 px'),
    ],
    featured: true,
    sample: false,
  },
  {
    slug: 'cascina-fontana',
    code: 'AP-26-W02',
    title: 'Cascina Fontana',
    subtitle: 'Sessantatré biolche tra l’Oglio e il Mincio',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'UI/UX', 'Sviluppo frontend', 'Responsive'],
    client: 'Progetto di famiglia',
    sector: 'Agricoltura',
    location: 'Rodigo (MN)',
    year: 2026,
    services: ['Architettura dei contenuti', 'Testi', 'Fotografia', 'Web design', 'Sviluppo frontend'],
    technologies: ['Vite', 'HTML', 'CSS', 'JavaScript', 'AVIF/WebP', 'Vercel'],
    summary: 'Il sito dell’azienda agricola della mia famiglia, a Rodigo: cinque pagine in HTML, CSS e JavaScript vanilla, nove fotografie scattate da me e nessun servizio di terzi.',
    description:
      'Cascina Fontana è l’azienda agricola della mia famiglia, a Rodigo, in provincia di Mantova, avviata nel 2007. Porta il latte alla filiera del Grana Padano DOP, coltiva mais, frumento ed erba medica su sessantatré biolche e vende fieno, legna da ardere e fiori direttamente in cascina, su appuntamento.',
    goal: 'Far sapere a chi cerca fieno, legna o fiori in zona cosa produce la cascina e in quale mese, e portarlo a una telefonata.',
    problem:
      'Un’azienda senza punto vendita né orari fissi, che non vuole pubblicare l’indirizzo perché la cascina è anche casa. La versione precedente, un’applicazione React in quattro lingue con il tema a sensore orario, pesava più di quanto servisse a cinque pagine e raccontava origini che nessun documento conferma.',
    strategy:
      'Ho tenuto solo ciò che è documentato e ho fatto della telefonata l’unica azione del sito: un numero, una PEC, nessuna mappa e nessun modulo. Ogni prodotto ha il suo calendario dei dodici mesi, così la stagione si legge prima di chiamare. Sotto ci sono cinque file HTML veri, senza framework né dipendenze a runtime.',
    development: [
      { title: 'Contenuti', text: 'Con mio padre ho riscritto la storia a partire dal 2007, senza secoli né leggende, e ho riunito le novità nella pagina Prodotti: sei schede con stagionalità, disponibilità e calendario dei mesi.' },
      { title: 'Immagini', text: 'Ho fotografato la cascina e ogni foto esce in quattro larghezze AVIF e WebP, con srcset calcolati sullo spazio che occupa. Il video dell’hero, montato con le stesse foto, parte solo su schermi grandi, con una rete veloce e senza riduzione del movimento.' },
      { title: 'Codice', text: 'Vite con HTML, CSS e JavaScript vanilla: testata e piè di pagina in partial inseriti in build, design token in un file solo, caratteri serviti dal sito. Nessun cookie e nessuna richiesta a server di terzi.' },
    ],
    result: 'La versione attuale è online su cascinafontana.xyz da settembre 2026: cinque pagine leggere che dicono cosa c’è in cascina e quando, e i vecchi indirizzi portano ancora alla pagina giusta.',
    metrics: [
      { value: '0', label: 'Dipendenze a runtime' },
      { value: '0', label: 'Cookie e servizi terzi' },
      { value: '221', label: 'Righe di JavaScript' },
    ],
    web: {
      url: 'https://www.cascinafontana.xyz',
      domain: 'cascinafontana.xyz',
      desktop: shot('cascina-desktop.webp', 1200, 750, 'Home page di cascinafontana.xyz su desktop'),
      desktopTall: shot('cascina-desktop-tall.webp', 1200, 2833, 'Home page di cascinafontana.xyz, pagina intera'),
      tablet: shot('cascina-tablet.webp', 720, 1036, 'Home page di cascinafontana.xyz su tablet'),
      mobile: shot('cascina-mobile.webp', 600, 1298, 'Home page di cascinafontana.xyz su smartphone'),
      mobileTall: shot('cascina-mobile-tall.webp', 600, 4000, 'Home page di cascinafontana.xyz su smartphone, pagina intera'),
      palette: ['#F3EFE5', '#1B1E19', '#1D2F23', '#B2532C', '#8C9B85'],
    },
    cover: shot('cascina-desktop.webp', 1200, 750, 'Home page di cascinafontana.xyz'),
    // La home è già nei dispositivi in apertura: la galleria mostra le pagine interne.
    images: [
      shot('cascina-prodotti-desktop.webp', 1200, 750, 'La pagina Prodotti di cascinafontana.xyz: la fascia scura del latte e la scheda dell’erba medica, con i mesi dei tagli in terracotta sul calendario', 'Prodotti — desktop 1440 px'),
      shot('cascina-galleria-tablet.webp', 720, 960, 'La galleria di cascinafontana.xyz con la lightbox aperta sulla fotografia del viale dei platani', 'Galleria, lightbox — tablet 820 px'),
      shot('cascina-contatti-mobile.webp', 600, 1298, 'La pagina Contatti di cascinafontana.xyz su smartphone: il numero di telefono e la PEC, senza indirizzo né modulo', 'Contatti — smartphone 390 px'),
    ],
    featured: true,
    sample: false,
  },
  {
    slug: 'albertopecchini-it',
    code: 'AP-26-W03',
    title: 'Alberto Pecchini',
    subtitle: 'Il sito che stai guardando',
    area: 'web',
    categories: ['web', 'grafica'],
    types: ['Sito web', 'UI/UX', 'Sviluppo frontend', 'Identità visiva'],
    client: 'Progetto personale',
    sector: 'Studio professionale',
    location: 'Mantova',
    year: 2026,
    services: ['Identità visiva', 'Web design', 'Sviluppo frontend', 'Illustrazioni tecniche generate', 'SEO tecnica'],
    technologies: ['Vite', 'JavaScript', 'CSS', 'SVG', 'HTML statico'],
    summary: 'Un portfolio statico senza framework: pagine generate dai dati, tavole tecniche disegnate dal codice, nessun tracciamento.',
    description:
      'Volevo un sito che mostrasse le tre cose che faccio usando tutte e tre: la precisione del disegno tecnico, il mestiere del frontend e la cura della grafica.',
    goal: 'Presentare lavori tecnici, web e grafici con un linguaggio unico, veloce da caricare e facile da aggiornare: aggiungere un progetto deve voler dire scrivere dei dati, non del markup.',
    problem: 'Tre mestieri in un sito rischiano di sembrare tre siti. E un portfolio tecnico, senza fotografie patinate, rischia di sembrare vuoto.',
    strategy:
      'Prendere in prestito il linguaggio delle tavole: squadrature, cartigli, quote, codici progetto. Le illustrazioni — piante, sezioni, nuvole di punti — sono SVG generati in fase di build dallo stesso codice che impagina il sito.',
    development: [
      { title: 'Sistema', text: 'Token di design per colori, tipografia, spazi e movimento; tre famiglie di caratteri ospitate localmente.' },
      { title: 'Generatore', text: 'Un plugin Vite trasforma dati e template in pagine HTML statiche, sitemap e dati strutturati.' },
      { title: 'Interazioni', text: 'Filtri reali, lightbox, confronto prima/dopo, transizioni di pagina: JavaScript scritto a mano, senza librerie.' },
    ],
    result: 'Pagine statiche leggere, accessibili da tastiera, senza cookie di profilazione. E un portfolio che si aggiorna modificando un solo file.',
    metrics: [
      { value: '0', label: 'Framework a runtime' },
      { value: '0', label: 'Cookie di tracciamento' },
      { value: '1', label: 'File per aggiungere un progetto' },
    ],
    web: {
      // con il www: l'apice rimanda lì, e i link al sito vanno sempre al www
      url: 'https://www.albertopecchini.it',
      domain: 'albertopecchini.it',
      // Nome mostrato al posto del dominio (carosello, anteprime scorrevoli).
      name: 'Alberto Pecchini',
      desktop: shot('ap-desktop.webp', 1200, 750, 'Home page di Alberto Pecchini su desktop'),
      desktopTall: shot('ap-desktop-tall.webp', 1200, 2833, 'Home page di Alberto Pecchini, pagina intera'),
      tablet: shot('ap-tablet.webp', 720, 1036, 'Home page di Alberto Pecchini su tablet'),
      mobile: shot('ap-mobile.webp', 600, 1298, 'Home page di Alberto Pecchini su smartphone'),
      mobileTall: shot('ap-mobile-tall.webp', 600, 4000, 'Home page di Alberto Pecchini su smartphone, pagina intera'),
      palette: ['#F3F1EC', '#EAE7E0', '#10110F', '#5A5B55', '#E5481F'],
    },
    // La home intera su iPhone 18 Pro, in una sezione tutta sua: strisce della
    // stessa cattura (402 px @2x), una sotto l'altra. Vedi il README, «iPhone 18 Pro».
    iphone: {
      lead: 'La home di Alberto Pecchini su iPhone, pagina intera: dal saluto con la pianta del piano terra fino al piè di pagina, sotto l’isola dinamica e la barra di Safari.',
      pages: strisce('ap-iphone', 'Home page di Alberto Pecchini su iPhone, pagina intera: saluto e nome, pianta del piano terra, siti web, discipline, servizi, numeri, metodo, studio, indice dei progetti e piè di pagina'),
    },
    cover: shot('ap-desktop.webp', 1200, 750, 'Home page di Alberto Pecchini'),
    images: [
      shot('ap-desktop.webp', 1200, 750, 'Home page di Alberto Pecchini su desktop', 'Home — desktop 1440 px'),
      shot('ap-tablet.webp', 720, 1036, 'Home page di Alberto Pecchini su tablet', 'Home — tablet 820 px'),
      shot('ap-mobile.webp', 600, 1298, 'Home page di Alberto Pecchini su smartphone', 'Home — smartphone 390 px'),
    ],
    featured: false,
    sample: false,
  },
  {
    slug: 'dario-donelli',
    code: 'AP-26-W04',
    title: 'Ing. Dario Donelli',
    subtitle: 'Un sito composto come la targa dello studio',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'UI/UX', 'Identità visiva', 'Sviluppo frontend'],
    client: 'Ing. Dario Donelli',
    sector: 'Ingegneria e progettazione edilizia',
    location: 'Rivalta sul Mincio, Rodigo (MN)',
    year: 2026,
    services: ['Architettura dei contenuti', 'Web design', 'Sviluppo frontend', 'Cartografia', 'Dominio e pubblicazione'],
    technologies: ['React', 'Vite', 'CSS scroll-driven', 'SVG', 'OpenStreetMap', 'Vercel'],
    summary:
      'Il sito dello studio tecnico dell’Ing. Dario Donelli a Rivalta sul Mincio: una pagina sola in bianco e nero, costruita sulla targa dello studio, con una carta del territorio disegnata a mano.',
    description:
      'Dario Donelli è ingegnere edile-architetto, iscritto all’Ordine di Mantova dal 2010, con studio a Rivalta sul Mincio, alle porte del Parco del Mincio. Segue di persona ogni incarico, dal progetto alle strutture fino alla chiusura del cantiere, per privati e opere civili in provincia.',
    goal: 'Far capire in pochi secondi, a chi deve costruire, ristrutturare o mettere in sicurezza un edificio nel mantovano, chi è lo studio, cosa fa e come contattarlo.',
    problem:
      'Uno studio di una persona sola, senza un archivio di lavori fotografati né numeri da esibire. Il rischio era un sito generico, uguale a quello di qualsiasi studio tecnico, o riempito di referenze non verificabili.',
    strategy:
      'Ho preso come riferimento la targa sull’ingresso dello studio: incisione nera su metallo chiaro, filetti sottili, nessun colore. Da lì vengono il bianco e nero, il nome in maiuscolo e la «D» del logo che torna come punto elenco, marcatore e cursore. Al posto delle referenze ho messo dati verificabili: l’iscrizione all’albo, la sede, il territorio su una carta.',
    development: [
      { title: 'Targa', text: 'L’apertura è alta tre schermi: mentre si scorre, il nome atterra in alto, entra la targa e il manifesto compare riga per riga. È tutto CSS legato allo scorrimento, senza librerie; su telefono o con il movimento ridotto diventa un’apertura statica con gli stessi elementi.' },
      { title: 'Carta', text: 'Ho disegnato in SVG una carta della provincia di Mantova, con la proiezione corretta alla latitudine dello studio: 21 comuni, il Mincio, i laghi, il parco, i raggi da 5 a 20 km, scala grafica e rosa dei venti. Accanto, la fotografia della sede con tre punti che raccontano l’ingresso.' },
      { title: 'Dati', text: 'Testi, recapiti, credenziali d’albo e dati societari stanno in un unico file, separati dall’impaginazione. La mappa di dettaglio usa OpenStreetMap al posto di Google: nessuna chiave, nessun cookie di profilazione, nessun banner.' },
    ],
    result:
      'Il sito è online su Vercel e sta passando al dominio dariodonelli.com: una pagina sola, senza cookie di profilazione, con circa 90 kB di codice compresso oltre alle fotografie.',
    metrics: [
      { value: '22', label: 'Località sulla carta' },
      { value: '0', label: 'Cookie di profilazione' },
      { value: '90 kB', label: 'Codice compresso' },
    ],
    web: {
      url: 'https://dariodonelli.vercel.app',
      domain: 'dariodonelli.vercel.app',
      desktop: shot('dd-desktop.webp', 1200, 750, 'Home page di dariodonelli.vercel.app su desktop'),
      desktopTall: shot('dd-desktop-tall.webp', 1200, 2833, 'Home page di dariodonelli.vercel.app, pagina intera'),
      tablet: shot('dd-tablet.webp', 720, 1036, 'Home page di dariodonelli.vercel.app su tablet'),
      mobile: shot('dd-mobile.webp', 600, 1298, 'Home page di dariodonelli.vercel.app su smartphone'),
      mobileTall: shot('dd-mobile-tall.webp', 600, 4000, 'Home page di dariodonelli.vercel.app su smartphone, pagina intera'),
      palette: ['#F6F6F4', '#000000', '#4A4A4A', '#FFFFFF', '#EBEBE8'],
    },
    cover: shot('dd-desktop.webp', 1200, 750, 'Home page di dariodonelli.vercel.app'),
    images: [
      shot('dd-desktop.webp', 1200, 750, 'Home page di dariodonelli.vercel.app su desktop', 'Home — desktop 1440 px'),
      shot('dd-tablet.webp', 720, 1036, 'Home page di dariodonelli.vercel.app su tablet', 'Home — tablet 820 px'),
      shot('dd-mobile.webp', 600, 1298, 'Home page di dariodonelli.vercel.app su smartphone', 'Home — smartphone 390 px'),
    ],
    featured: true,
    sample: false,
  },
  {
    // Il dominio col trattino, come albertopecchini-it (vedi Rivalta qui sopra).
    slug: 'pzkko-it',
    code: 'AP-26-W05',
    title: 'pzkko',
    subtitle: 'Il mio nome in rete, attaccato a un muro',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'Direzione artistica', 'Sviluppo frontend', 'Gioco 3D'],
    client: 'Progetto personale',
    sector: 'Siti, social e giochi',
    location: 'Mantova',
    year: 2026,
    services: ['Direzione artistica', 'Immagini generate con l’IA', 'Web design', 'Sviluppo frontend', 'Gioco in 3D'],
    technologies: ['HTML', 'CSS', 'JavaScript', 'SVG', 'three.js', 'Rapier', 'gpt-image-2', 'Vercel'],
    summary: 'Una saracinesca coperta di volantini, uno per ogni sito e social, con i tagliandi da strappare, la sera all’ora di Mantova e una roulette in 3D. Una pagina sola, senza build.',
    description:
      'pzkko è il nome che uso in rete, da «Pekko», il mio soprannome. pzkko.it mette in un posto solo i miei siti e i miei social e, a poco a poco, i giochi e gli strumenti che faccio per divertimento. Non è il sito dello studio: è il posto dove provo quello che lì non starebbe.',
    goal: 'Dare a chi mi cerca un indirizzo solo per trovare i miei siti e i miei contatti, e a me un muro dove attaccare le idee nuove.',
    problem:
      'Una pagina di link somiglia a tutte le altre: una colonna di bottoni. E un sito fatto per gioco rischia di restare un esercizio: questo doveva funzionare davvero, come una pagina di contatti.',
    strategy:
      'Ho preso come riferimento la foto di una saracinesca chiusa a Bologna, coperta di graffiti e di manifesti. Ogni sito, social e gioco è un volantino attaccato col nastro, e in mezzo c’è la roba degli altri, come su un muro vero. La lamiera, la carta, i nastri e le illustrazioni sono immagini generate con gpt-image-2; l’insegna e il muro del palazzo sono disegnati in SVG; i testi sui fogli sono HTML vero, che si legge e si seleziona.',
    development: [
      { title: 'Volantini', text: 'Ogni foglio è una carta fotografata vuota, coi bordi misurati, e sopra il testo in HTML in unità del foglio, così si legge a ogni larghezza. I volantini dei social finiscono coi tagliandi da strappare: toccarne uno lo stacca e copia il contatto. La disposizione a pile la calcola uno script che misura i fogli in Chromium.' },
      { title: 'La sera', text: 'La pagina calcola alba e tramonto di Mantova con l’algoritmo della NOAA, senza chiamate in rete, e vive a quell’ora da qualunque posto la si guardi: da quaranta minuti prima del tramonto il muro imbrunisce, poi si accende l’insegna al neon, coi tubi che sfarfallano, e di notte passano i fari delle auto.' },
      { title: 'Roulette', text: 'Il volantino della roulette apre una finestra con la ruota in 3D, disegnata con three.js, e la pallina mossa da un motore fisico vero, Rapier: si ferma dove si ferma. Si gioca a soldi finti su tutte le 157 puntate della roulette europea; una prova senza browser ha fatto 4.122 giri senza un errore.' },
    ],
    // La foto vera da cui è nato il muro, con la sua Live Photo (tools/pzkko/storia/storia.mjs); la storia intera,
    // coi meme bolognesi, è su pzkko.it/storia/.
    funFact: {
      lead: 'Il muro di pzkko.it esiste davvero: l’ho fotografato a Bologna, in via Rizzoli, a un centinaio di metri dalle Due Torri, domenica 22 settembre 2024 alle 12:28. Era la prima volta in vita mia a Bologna, in gita con Veronica, e l’iPhone 16 Pro era uscito due giorni prima: fotografavo tutto per provarlo.',
      text: 'Un ingresso della Coin chiuso da una saracinesca: lamiera grigia, graffiti, più di venti volantini e sopra l’insegna con le lettere a scatola. Da lì vengono le lettere tonde di «pzkko», l’adesivo tondo sull’insegna (sul puntino della i c’era un cono gelato, sulla mia c’è la chiocciola) e i manifesti degli altri in mezzo ai miei volantini. Ci ho pensato per due anni; a ottobre 2026 è diventato il sito.',
      photo: {
        src: '/media/web/pzk-bologna.webp',
        small: '/media/web/pzk-bologna-m.webp',
        live: '/media/web/pzk-bologna.mp4',
        w: 1080,
        h: 1440,
        alt: 'La saracinesca di un ingresso della Coin in via Rizzoli a Bologna: lamiera grigia coperta di graffiti e di volantini, sopra l’insegna «coin» con le lettere a scatola.',
      },
      caption: 'Bologna, via Rizzoli · 22.09.2024, 12:28 · iPhone 16 Pro, Live Photo',
      link: { href: 'https://www.pzkko.it/storia/', label: 'La storia intera su pzkko.it' },
    },
    result:
      'pzkko.it è online dal 7 ottobre 2026: una pagina in HTML, CSS e JavaScript scritti a mano, senza build né framework, con una 404 fatta di un volantino strappato. Il codice della roulette si carica solo quando la si apre.',
    metrics: [
      { value: '0', label: 'Passaggi di build' },
      { value: '18', label: 'Volantini sul muro' },
      { value: '157', label: 'Puntate della roulette' },
    ],
    web: {
      url: 'https://www.pzkko.it',
      domain: 'pzkko.it',
      desktop: shot('pzk-desktop.webp', 1200, 750, 'Home page di pzkko.it su desktop'),
      desktopTall: shot('pzk-desktop-tall.webp', 1200, 2833, 'Home page di pzkko.it, pagina intera'),
      tablet: shot('pzk-tablet.webp', 720, 1036, 'Home page di pzkko.it su tablet'),
      mobile: shot('pzk-mobile.webp', 600, 1298, 'Home page di pzkko.it su smartphone'),
      mobileTall: shot('pzk-mobile-tall.webp', 600, 4000, 'Home page di pzkko.it su smartphone, pagina intera'),
      palette: ['#7F7569', '#858785', '#161616', '#FBD711', '#A50D25'],
    },
    cover: shot('pzk-desktop.webp', 1200, 750, 'Home page di pzkko.it'),
    // La home è già nei dispositivi in apertura: la galleria mostra la notte, la roulette e la 404.
    images: [
      shot('pzk-notte-desktop.webp', 1200, 750, 'La saracinesca di pzkko.it di notte: il muro imbrunito, l’insegna al neon accesa e i volantini dei siti', 'Di notte — desktop 1440 px'),
      shot('pzk-roulette-tablet.webp', 720, 960, 'La roulette di pzkko.it: la ruota in 3D, le fiches e il tavolo stampato sul foglio', 'Roulette — tablet 820 px'),
      shot('pzk-404-mobile.webp', 600, 1298, 'La pagina 404 di pzkko.it su smartphone: i resti di un volantino strappato e il foglio che rimanda alla home', '404 — smartphone 390 px'),
    ],
    featured: false,
    sample: false,
  },
  {
    slug: 'edilcorte',
    code: 'AP-25-W04',
    title: 'Edilcorte',
    subtitle: 'Un’impresa edile che si fa capire prima del sopralluogo',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'Landing page', 'UI/UX', 'Sviluppo frontend'],
    client: 'Edilcorte — impresa edile',
    sector: 'Edilizia',
    location: 'Mantova',
    year: 2025,
    services: ['Struttura dei contenuti', 'Web design', 'Sviluppo frontend', 'Modulo di richiesta sopralluogo', 'Ottimizzazione'],
    technologies: ['Astro', 'TypeScript', 'CSS', 'Netlify Forms'],
    summary: 'Sito per un’impresa di ristrutturazioni: meno aggettivi, più cantieri documentati e un modulo che chiede le informazioni giuste.',
    description:
      'Un’impresa con diciotto anni di cantieri e un sito fermo al 2012. I clienti arrivavano per passaparola e scoprivano solo al telefono cosa l’impresa facesse davvero.',
    goal: 'Spiegare con chiarezza i tre tipi di intervento dell’impresa e ricevere richieste di sopralluogo già complete di luogo, tipo di immobile e tempi.',
    problem: 'Le richieste arrivavano vaghe — «vorrei un preventivo» — e metà dei sopralluoghi si rivelava fuori zona o fuori scala per l’impresa.',
    strategy: 'Scrivere come parla il titolare: cantieri puliti, tempi scritti, prezzi chiusi. Ogni cantiere pubblicato ha durata, superficie e importo indicativo; il modulo filtra prima di far perdere tempo a tutti.',
    development: [
      { title: 'Contenuti', text: 'Interviste al titolare e ai capicantiere, dodici cantieri documentati con dati e fotografie.' },
      { title: 'Design', text: 'Palette calda di terre e laterizio, tipografia grande, schede cantiere confrontabili.' },
      { title: 'Modulo', text: 'Cinque domande, validazione lato client, riepilogo via email al titolare.' },
    ],
    result: 'Richieste dimezzate nel numero e raddoppiate nella qualità: i sopralluoghi a vuoto sono passati da uno su due a uno su sei.',
    metrics: [
      { value: '12', label: 'Cantieri documentati' },
      { value: '1 su 6', label: 'Sopralluoghi a vuoto' },
      { value: '98', label: 'Performance Lighthouse' },
    ],
    web: {
      url: null,
      domain: 'edilcorte.example',
      desktop: img('webpage', { site: 'edilcorte', device: 'desktop', tall: false }, 'Home page del sito Edilcorte su desktop'),
      desktopTall: img('webpage', { site: 'edilcorte', device: 'desktop' }, 'Home page del sito Edilcorte, pagina intera'),
      tablet: img('webpage', { site: 'edilcorte', device: 'tablet', tall: false }, 'Home page del sito Edilcorte su tablet'),
      mobile: img('webpage', { site: 'edilcorte', device: 'mobile', tall: false }, 'Home page del sito Edilcorte su smartphone'),
      mobileTall: img('webpage', { site: 'edilcorte', device: 'mobile' }, 'Home page del sito Edilcorte su smartphone, pagina intera'),
      palette: ['#F4F1EA', '#E6E0D3', '#22211D', '#6B675E', '#C4511F'],
    },
    cover: img('webpage', { site: 'edilcorte', device: 'desktop', tall: false }, 'Home page del sito Edilcorte'),
    images: [
      img('webpage', { site: 'edilcorte', device: 'desktop', tall: false }, 'Home page del sito Edilcorte su desktop', 'Home — desktop 1440 px'),
      img('webpage', { site: 'edilcorte', device: 'tablet', tall: false }, 'Home page del sito Edilcorte su tablet', 'Home — tablet 820 px'),
      img('webpage', { site: 'edilcorte', device: 'mobile', tall: false }, 'Home page del sito Edilcorte su smartphone', 'Home — smartphone 390 px'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'studio-kinesi',
    code: 'AP-25-W05',
    title: 'Studio Kinesi',
    subtitle: 'Prenotare una visita senza telefonare',
    area: 'web',
    categories: ['web'],
    types: ['Sito web', 'UI/UX', 'Sviluppo frontend', 'Manutenzione'],
    client: 'Studio Kinesi — fisioterapia',
    sector: 'Sanità',
    location: 'Mantova',
    year: 2025,
    services: ['UX della prenotazione', 'Web design', 'Sviluppo frontend', 'Integrazione calendario', 'Manutenzione'],
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Cal.com API', 'Vercel'],
    summary: 'Sito e prenotazione online per uno studio di fisioterapia: disponibilità reali, conferma via email, disdetta in un clic.',
    description: 'Sei fisioterapisti, una segreteria part-time e un telefono che squilla mentre si lavora. Lo studio cercava un modo per farsi trovare e farsi prenotare senza assumere nessuno.',
    goal: 'Portare online almeno metà delle prenotazioni, ridurre le telefonate in orario di trattamento e le mancate presentazioni.',
    problem: 'I moduli «richiedi appuntamento» generano solo altro lavoro: qualcuno deve richiamare. Serviva il calendario vero, con le regole dello studio.',
    strategy: 'Disegnare il percorso a partire dal paziente al telefono in pausa pranzo: tre passaggi, pollice solo, nessuna registrazione. Il resto del sito serve a scegliere il trattamento giusto.',
    development: [
      { title: 'Percorso', text: 'Prototipo navigabile provato con otto pazienti dello studio prima di scrivere una riga di codice.' },
      { title: 'Interfaccia', text: 'Verde salvia, superfici morbide, testi grandi; contrasto AA ovunque, focus sempre visibile.' },
      { title: 'Integrazione', text: 'Disponibilità lette dal calendario dello studio, promemoria automatico, disdetta fino a 24 ore prima.' },
    ],
    result: 'Dopo tre mesi il 58% delle prenotazioni arriva dal sito e le telefonate in segreteria sono calate del 41%.',
    metrics: [
      { value: '58%', label: 'Prenotazioni online' },
      { value: '−41%', label: 'Telefonate' },
      { value: '2 min', label: 'Per prenotare' },
    ],
    web: {
      url: null,
      domain: 'studiokinesi.example',
      desktop: img('webpage', { site: 'kinesi', device: 'desktop', tall: false }, 'Home page del sito Studio Kinesi su desktop'),
      desktopTall: img('webpage', { site: 'kinesi', device: 'desktop' }, 'Home page del sito Studio Kinesi, pagina intera'),
      tablet: img('webpage', { site: 'kinesi', device: 'tablet', tall: false }, 'Home page del sito Studio Kinesi su tablet'),
      mobile: img('webpage', { site: 'kinesi', device: 'mobile', tall: false }, 'Home page del sito Studio Kinesi su smartphone'),
      mobileTall: img('webpage', { site: 'kinesi', device: 'mobile' }, 'Home page del sito Studio Kinesi su smartphone, pagina intera'),
      palette: ['#F2F7F5', '#DAE9E4', '#11302A', '#55716B', '#1F8A70'],
    },
    cover: img('webpage', { site: 'kinesi', device: 'desktop', tall: false }, 'Home page del sito Studio Kinesi'),
    images: [
      img('webpage', { site: 'kinesi', device: 'desktop', tall: false }, 'Home page del sito Studio Kinesi su desktop', 'Home — desktop 1440 px'),
      img('webpage', { site: 'kinesi', device: 'tablet', tall: false }, 'Home page del sito Studio Kinesi su tablet', 'Home — tablet 820 px'),
      img('webpage', { site: 'kinesi', device: 'mobile', tall: false }, 'Home page del sito Studio Kinesi su smartphone', 'Home — smartphone 390 px'),
    ],
    featured: false,
    sample: true,
  },

  // ═══ GRAFICA ═══════════════════════════════════════════════════════════════
  {
    slug: 'tavolato-brand-identity',
    code: 'AP-25-G01',
    title: 'Tavolato',
    subtitle: 'Identità per un’azienda di strutture in legno',
    area: 'grafica',
    categories: ['grafica', 'branding'],
    types: ['Logo', 'Brand identity', 'Palette', 'Tipografia', 'Biglietti da visita', 'Carta intestata', 'Insegne', 'Targhe'],
    client: 'Tavolato — strutture in legno',
    sector: 'Industria del legno',
    location: 'Mantova',
    year: 2025,
    services: ['Naming', 'Marchio e logotipo', 'Sistema di identità', 'Immagine coordinata', 'Insegna e targa'],
    technologies: ['Illustrator', 'InDesign', 'Figma'],
    summary: 'Cinque anelli di accrescimento tagliati a quarto: un marchio che si costruisce con riga e compasso, come le strutture che rappresenta.',
    description: 'Una carpenteria che progetta e monta coperture, tettoie e case in legno. Lavorava da anni con il cognome del fondatore scritto in un carattere di sistema.',
    goal: 'Un’identità sobria e industriale che stesse bene tanto su una carta intestata quanto marchiata a fuoco su una trave.',
    problem: 'Il settore è pieno di alberelli, casette e foglie verdi. Serviva un segno riconoscibile che parlasse di legno senza disegnare un albero.',
    strategy: 'Guardare il materiale da vicino: la sezione di un tronco. Cinque archi concentrici inscritti in un quadrato, modulo pari a un quinto del lato; logotipo in un grottesco largo, tutto maiuscolo.',
    development: [
      { title: 'Segno', text: 'Costruzione geometrica su griglia 5×5, area di rispetto pari a un modulo, versione minima a 12 mm.' },
      { title: 'Sistema', text: 'Palette di cinque colori presi da resina, abete, segatura, muschio e minio; due caratteri, uno per i titoli e uno per i dati.' },
      { title: 'Applicazioni', text: 'Carta intestata, busta, biglietti, insegna 300×90 cm in dibond, targa 40×40, timbro a fuoco.' },
    ],
    result: 'Un manuale di sedici pagine e un’identità che l’azienda applica da sola, dal preventivo al furgone, senza chiedere ogni volta «dove va il logo?».',
    metrics: [
      { value: '5×5', label: 'Griglia di costruzione' },
      { value: '5', label: 'Colori di sistema' },
      { value: '16 pp.', label: 'Manuale d’uso' },
    ],
    brand: 'tavolato',
    typefaces: [
      { name: 'Archivo Expanded', role: 'Titoli e logotipo', sample: 'TAVOLATO', style: 'font-stretch:122%;font-weight:700;text-transform:uppercase' },
      { name: 'IBM Plex Mono', role: 'Dati e didascalie', sample: 'GL24h · 20 × 36', style: "font-family:'IBM Plex Mono',monospace" },
    ],
    cover: img('brandmark', { brand: 'tavolato' }, 'Marchio Tavolato su fondo verde resina'),
    images: [
      img('brandmark', { brand: 'tavolato' }, 'Marchio Tavolato su fondo verde resina', 'Marchio e logotipo'),
      img('brandmark', { brand: 'tavolato', construction: true }, 'Costruzione geometrica del marchio Tavolato su griglia', 'Costruzione e area di rispetto'),
      img('stationery', { brand: 'tavolato' }, 'Carta intestata, busta e biglietti da visita Tavolato', 'Immagine coordinata'),
      img('signage', { brand: 'tavolato' }, 'Insegna a parete, targa e insegna a bandiera Tavolato', 'Insegna e targa'),
    ],
    featured: true,
    sample: true,
  },
  {
    slug: 'corte-bassa-restyling',
    code: 'AP-25-G02',
    title: 'Corte Bassa',
    subtitle: 'Restyling del marchio e linea di etichette',
    area: 'grafica',
    categories: ['grafica', 'branding'],
    types: ['Restyling logo', 'Brand identity', 'Packaging', 'Palette', 'Materiale aziendale'],
    client: 'Corte Bassa — azienda agricola',
    sector: 'Agricolo',
    location: 'Provincia di Mantova',
    year: 2025,
    services: ['Restyling del marchio', 'Linea di etichette', 'Palette', 'File per la stampa'],
    technologies: ['Illustrator', 'InDesign', 'Photoshop'],
    summary: 'Da un ovale con montagne che in pianura non esistono a un sole che tramonta sui campi: stesso nome, stessa storia, segno nuovo.',
    description: 'Un’azienda agricola che dal 1961 vende miele, vino e mostarde ai mercati contadini. Il vecchio logo, disegnato da un parente nel 2009, non reggeva più la stampa in piccolo sulle etichette.',
    goal: 'Aggiornare il marchio senza tradire i clienti affezionati e progettare tre etichette riconoscibili sullo scaffale come parte della stessa famiglia.',
    problem: 'Il marchio storico aveva sette colori, un’ombra e un testo in corsivo illeggibile sotto i 30 mm. Ma i clienti lo riconoscevano: buttarlo via del tutto sarebbe stato un errore.',
    strategy: 'Tenere ciò che funzionava — il cerchio, il sole, il tono caldo — e togliere il resto. Un segno a un colore, un carattere graziato con personalità, una palette che viene dai prodotti.',
    development: [
      { title: 'Analisi', text: 'Raccolta di tutte le versioni in uso: undici varianti diverse del vecchio logo tra etichette, cartelli e furgone.' },
      { title: 'Segno', text: 'Sole dimezzato sull’orizzonte e tre solchi, inscritti in un anello; versione positiva, negativa e a un colore.' },
      { title: 'Etichette', text: 'Tre referenze, una griglia comune, colore di fondo che cambia con il prodotto.' },
    ],
    result: 'Etichette leggibili a due metri, un solo file master per tutte le referenze e un marchio che si stampa bene anche a 15 mm.',
    metrics: [
      { value: '11 → 1', label: 'Versioni del logo in uso' },
      { value: '3', label: 'Etichette di linea' },
      { value: '15 mm', label: 'Dimensione minima' },
    ],
    brand: 'cortebassa',
    typefaces: [
      { name: 'Instrument Serif', role: 'Logotipo e nomi prodotto', sample: 'Miele di tiglio', style: 'font-family:var(--font-serif)' },
      { name: 'IBM Plex Mono', role: 'Dati di legge e lotti', sample: '250 g · LOTTO 04', style: "font-family:'IBM Plex Mono',monospace" },
    ],
    cover: img('packaging', { brand: 'cortebassa' }, 'Tre prodotti Corte Bassa con le nuove etichette'),
    images: [
      img('packaging', { brand: 'cortebassa' }, 'Tre prodotti Corte Bassa con le nuove etichette', 'Linea etichette — tre referenze'),
      img('restyle', { brand: 'cortebassa' }, 'Confronto tra il vecchio e il nuovo marchio Corte Bassa', 'Prima e dopo'),
      img('brandmark', { brand: 'cortebassa' }, 'Nuovo marchio Corte Bassa su fondo lambrusco', 'Marchio — versione principale'),
      img('stationery', { brand: 'cortebassa' }, 'Carta intestata e biglietti da visita Corte Bassa', 'Materiale aziendale'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'argini-festival',
    code: 'AP-26-G03',
    title: 'Argini',
    subtitle: 'Manifesti e social per un festival sull’acqua',
    area: 'grafica',
    categories: ['grafica'],
    types: ['Manifesti', 'Locandine', 'Social', 'Materiale pubblicitario', 'Logo'],
    client: 'Associazione culturale',
    sector: 'Cultura ed eventi',
    location: 'Mantova',
    year: 2026,
    services: ['Identità dell’evento', 'Serie di manifesti', 'Kit social', 'File per la stampa'],
    technologies: ['Illustrator', 'InDesign', 'Figma', 'After Effects'],
    summary: 'Tre serate, tre manifesti, un solo sistema: numeri enormi in un grottesco stretto e onde che salgono dal basso.',
    description: 'Un piccolo festival estivo di musica sul lungolago, organizzato da volontari con un budget di stampa minimo e molta concorrenza sui muri della città.',
    goal: 'Farsi notare a dieci metri con tre colori, e dare ai volontari un kit social che potessero aggiornare da soli ogni sera.',
    problem: 'Le locandine degli anni precedenti cambiavano stile a ogni edizione: nessuno riconosceva il festival finché non leggeva il nome.',
    strategy: 'Un sistema invece di un’immagine: la data è il protagonista, le onde sono la firma, i tre colori ruotano tra fondo, testo e accento. Ogni manifesto è diverso e inconfondibilmente lo stesso.',
    development: [
      { title: 'Sistema', text: 'Griglia a otto colonne, numeri a tutta larghezza, corsivo graziato per i nomi degli artisti.' },
      { title: 'Stampa', text: 'Manifesti 70×100 a tre colori piatti, locandine A3, pieghevole del programma.' },
      { title: 'Social', text: 'Sei formati quadrati e tre storie animate, tutti modificabili in Figma dai volontari.' },
    ],
    result: 'Tre serate esaurite e una serie che la gente ha staccato dai muri per portarsela a casa. L’associazione ha confermato il sistema per l’edizione successiva.',
    metrics: [
      { value: '3', label: 'Colori piatti' },
      { value: '70×100', label: 'Formato manifesto' },
      { value: '9', label: 'Formati social' },
    ],
    brand: 'argini',
    typefaces: [
      { name: 'Archivo Condensed', role: 'Date e titoli', sample: '12 LUG', style: 'font-stretch:62%;font-weight:800' },
      { name: 'Instrument Serif Italic', role: 'Artisti', sample: 'Coro sull’acqua', style: 'font-family:var(--font-serif);font-style:italic' },
    ],
    cover: img('poster', { brand: 'argini' }, 'Serie di tre manifesti del festival Argini'),
    images: [
      img('poster', { brand: 'argini' }, 'Serie di tre manifesti del festival Argini', 'Serie manifesti 70×100'),
      img('social', { brand: 'argini' }, 'Griglia di sei contenuti social del festival Argini', 'Kit social — formati quadrati'),
      img('brandmark', { brand: 'argini' }, 'Marchio del festival Argini su fondo blu notte', 'Marchio dell’evento'),
    ],
    featured: true,
    sample: true,
  },
  {
    slug: 'studio-quadra-editoria',
    code: 'AP-24-G04',
    title: 'Studio Quadra',
    subtitle: 'Brochure, presentazioni e modelli per uno studio tecnico',
    area: 'grafica',
    categories: ['grafica'],
    types: ['Brochure', 'Presentazioni', 'Template', 'Carta intestata', 'Materiale aziendale'],
    client: 'Studio Quadra — ingegneria e architettura',
    sector: 'Studio professionale',
    location: 'Mantova',
    year: 2024,
    services: ['Brochure istituzionale', 'Modello di presentazione', 'Modelli Word ed Excel', 'Carta intestata'],
    technologies: ['InDesign', 'Illustrator', 'PowerPoint', 'Word'],
    summary: 'Uno studio tecnico produce soprattutto documenti. Li ho ridisegnati tutti: dalla relazione alla slide, dal computo alla brochure.',
    description: 'Dieci anni di attività, sei professionisti e documenti impaginati ognuno a modo suo. La brochure era solo l’inizio: il vero lavoro era dare una forma comune a tutto ciò che esce dallo studio.',
    goal: 'Una brochure di presentazione e una famiglia di modelli che chiunque in studio potesse usare senza aprire un programma di grafica.',
    problem: 'Un tecnico non ha tempo di impaginare. Se il modello è complicato torna a usare il documento dell’anno scorso, con il logo sgranato.',
    strategy: 'Pochi stili, bloccati. Un blu cianografia come unico accento, una griglia che funziona in Word come in InDesign, e istruzioni d’uso lunghe una pagina.',
    development: [
      { title: 'Brochure', text: 'Tre ante, numeri dello studio in evidenza, fotografie di cantiere trattate in bicromia.' },
      { title: 'Presentazione', text: 'Dodici layout di slide per incontri con i committenti, con grafici già impostati.' },
      { title: 'Modelli', text: 'Relazione tecnica, lettera, verbale, computo: stili di paragrafo e tabelle pronti.' },
    ],
    result: 'Dopo sei mesi tutti i documenti in uscita usano i modelli. Il tempo medio per preparare una presentazione è passato da mezza giornata a un’ora.',
    metrics: [
      { value: '12', label: 'Layout di slide' },
      { value: '4', label: 'Modelli Office' },
      { value: '1 h', label: 'Per una presentazione' },
    ],
    brand: 'quadra',
    typefaces: [
      { name: 'Archivo', role: 'Titoli e testi', sample: 'Dieci anni di cantieri', style: 'font-weight:600' },
      { name: 'Instrument Serif Italic', role: 'Enfasi', sample: 'misurati.', style: 'font-family:var(--font-serif);font-style:italic' },
    ],
    cover: img('brochure', { brand: 'quadra' }, 'Brochure a tre ante dello Studio Quadra'),
    images: [
      img('brochure', { brand: 'quadra' }, 'Brochure a tre ante dello Studio Quadra', 'Brochure a tre ante'),
      img('slides', { brand: 'quadra' }, 'Quattro slide del modello di presentazione', 'Modello di presentazione'),
      img('stationery', { brand: 'quadra' }, 'Carta intestata e biglietti da visita Studio Quadra', 'Carta intestata e biglietti'),
      img('brandmark', { brand: 'quadra', invert: true }, 'Marchio Studio Quadra in versione positiva', 'Marchio — versione positiva'),
    ],
    featured: false,
    sample: true,
  },
  {
    slug: 'anello-dei-laghi-segnaletica',
    code: 'AP-26-G05',
    title: 'Anello dei Laghi',
    subtitle: 'Pittogrammi e segnaletica per un percorso ciclopedonale',
    area: 'grafica',
    categories: ['grafica', 'altro'],
    types: ['Icone', 'Targhe', 'Insegne', 'Logo', 'Template'],
    client: 'Consorzio di enti locali',
    sector: 'Territorio e comunità',
    location: 'Mantova',
    year: 2026,
    services: ['Marchio del percorso', 'Set di pittogrammi', 'Segnaletica', 'Abaco dei supporti'],
    technologies: ['Illustrator', 'Figma', 'AutoCAD'],
    summary: 'Trentasei pittogrammi disegnati su una griglia di 32 pixel e una segnaletica dimensionata come un elaborato tecnico.',
    description: 'Un anello di ventotto chilometri attorno ai laghi, segnalato negli anni da enti diversi con cartelli diversi. Chi lo percorreva non sapeva mai se era ancora sulla strada giusta.',
    goal: 'Un linguaggio unico — marchio, colori, pittogrammi, frecce — e un abaco di supporti che un’officina qualsiasi possa realizzare senza interpretazioni.',
    problem: 'La segnaletica si legge in movimento, con il sole contro, da persone di ogni età. E viene prodotta da fornitori che non hanno mai parlato con il grafico.',
    strategy: 'Disegnare le icone come si disegna un particolare costruttivo: griglia, spessore costante, raggi dichiarati. Accompagnare ogni supporto con una tavola quotata, materiali e altezze di posa.',
    development: [
      { title: 'Pittogrammi', text: 'Trentasei icone su griglia 32 px, tratto 2,4, testate a 8 metri di distanza e in scala di grigi.' },
      { title: 'Colori', text: 'Verde bosco, giallo segnale e azzurro acqua, con contrasti verificati per la leggibilità all’aperto.' },
      { title: 'Abaco', text: 'Cinque tipi di supporto con tavole quotate, grafiche in scala 1:1 e capitolato dei materiali.' },
    ],
    result: 'Un sistema che tre officine diverse hanno realizzato ottenendo cartelli identici. Il percorso oggi si segue senza guardare il telefono.',
    metrics: [
      { value: '36', label: 'Pittogrammi' },
      { value: '28 km', label: 'Di percorso segnalato' },
      { value: '5', label: 'Tipi di supporto' },
    ],
    brand: 'anello',
    typefaces: [
      { name: 'Archivo SemiCondensed', role: 'Segnaletica', sample: 'Lago di Mezzo 2,4 km', style: 'font-stretch:88%;font-weight:700' },
      { name: 'IBM Plex Mono', role: 'Distanze e codici', sample: 'AL-14 · 45.1601 N', style: "font-family:'IBM Plex Mono',monospace" },
    ],
    cover: img('icons', { brand: 'anello' }, 'Set di dodici pittogrammi per il percorso Anello dei Laghi'),
    images: [
      img('icons', { brand: 'anello' }, 'Set di dodici pittogrammi per il percorso Anello dei Laghi', 'Pittogrammi — estratto dal set'),
      img('signage', { brand: 'anello' }, 'Cartello direzionale, targa e insegna a bandiera del percorso', 'Supporti — tavola quotata'),
      img('brandmark', { brand: 'anello' }, 'Marchio Anello dei Laghi su fondo verde bosco', 'Marchio del percorso'),
    ],
    featured: false,
    sample: true,
  },

  // ═══ ALTRO ═════════════════════════════════════════════════════════════════
  {
    slug: 'sistema-tavole-cartiglio',
    code: 'AP-26-X01',
    title: 'Sistema di tavole e cartiglio',
    subtitle: 'Il graphic design applicato al disegno tecnico',
    area: 'grafica',
    categories: ['altro', 'cad', 'grafica'],
    types: ['Template', 'CAD', 'Tipografia', 'Materiale aziendale'],
    client: 'Progetto interno allo studio',
    sector: 'Studio professionale',
    location: 'Mantova',
    year: 2026,
    services: ['Squadratura e cartiglio', 'Standard dei layer', 'Stili di stampa', 'File modello'],
    technologies: ['AutoCAD', 'Illustrator', 'InDesign'],
    summary: 'Un file modello con squadrature dall’A4 all’A1, cartiglio parametrico, dodici layer e cinque spessori. Ogni tavola parte già in ordine.',
    description: 'Le tavole sono il prodotto finale di un geometra, eppure quasi nessuno le progetta. Ho trattato le mie come un’identità visiva: griglia, gerarchie, caratteri, regole.',
    goal: 'Un modello di disegno in cui cartiglio, layer, stili di quota e penne siano già definiti, così che il tempo vada nel progetto e non nell’impaginazione.',
    problem: 'Cartigli copiati da vecchi file, layer chiamati «Layer1», quote con tre altezze di testo diverse nella stessa tavola. Il disordine grafico fa dubitare anche dei contenuti.',
    strategy: 'Partire dalla stampa e tornare indietro: cinque spessori che si distinguono davvero su carta, una sola famiglia di caratteri, un codice progetto che dice anno e numero.',
    development: [
      { title: 'Cartiglio', text: 'Blocco con attributi: progetto, committente, oggetto, scala, formato, codice, data, revisione, fase, numero di tavola.' },
      { title: 'Standard', text: 'Dodici layer con prefisso di disciplina, cinque penne da 0,13 a 0,70 mm, stile CTB unico.' },
      { title: 'Formati', text: 'Squadrature da A4 ad A1 con tacche di piegatura UNI e riferimenti di zona.' },
    ],
    result: 'È lo standard con cui sono disegnate tutte le tavole di questo portfolio. Una nuova commessa parte in dieci minuti, con il cartiglio già compilato.',
    metrics: [
      { value: '12', label: 'Layer standard' },
      { value: '5', label: 'Spessori di penna' },
      { value: 'A4 → A1', label: 'Formati previsti' },
    ],
    cover: img('titleblock', {}, 'Tavola modello con squadratura, cartiglio, spessori e formati'),
    images: [
      img('titleblock', {}, 'Tavola modello con squadratura, cartiglio, spessori e formati', 'Tavola modello'),
      img('floorplan', { variant: 'casa', code: 'AP-26-X01' }, 'Pianta impaginata con il sistema di tavole', 'Applicazione — pianta'),
      img('section', { code: 'AP-26-X01' }, 'Sezione impaginata con il sistema di tavole', 'Applicazione — sezione'),
    ],
    featured: false,
    sample: true,
  },
]

// ── Progetti dimostrativi ────────────────────────────────────────────────────
// I progetti con `sample: true` restano nel file ma non vengono pubblicati:
// sono modelli di come si presenta un lavoro di quel tipo, pronti da riattivare
// uno alla volta sostituendoli con un incarico reale (basta togliere `sample`).
// Portare `showSamples` a `true` per rivederli tutti online, contrassegnati
// dal rombo ◇ (l'avviso si regola con `showSampleNotice` in site.js).
export const showSamples = false

const published = showSamples ? allProjects : allProjects.filter((p) => !p.sample)

// Con le tavole spente i progetti escono senza `sheets`: il case study mostra la
// galleria di `images` e withSheets() è vuoto, quindi niente /portfolio/tavole/.
export const projects = showSheets ? published : published.map(({ sheets, ...p }) => p)

// ── Selettori ────────────────────────────────────────────────────────────────

export const bySlug = (slug) => projects.find((p) => p.slug === slug)
export const byArea = (area) => projects.filter((p) => p.area === area)
export const featured = () => projects.filter((p) => p.featured)
export const years = () => [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a)
export const sectors = () => [...new Set(projects.map((p) => p.sector))].sort((a, b) => a.localeCompare(b, 'it'))
export const technologies = () => [...new Set(projects.flatMap((p) => p.technologies))].sort((a, b) => a.localeCompare(b, 'it'))
export const types = (list = projects) => [...new Set(list.flatMap((p) => p.types))].sort((a, b) => a.localeCompare(b, 'it'))
/** Progetti con tavole vere da sfogliare nel visualizzatore (/portfolio/tavole/). */
export const withSheets = () => projects.filter((p) => p.sheets?.length)

/** Progetto successivo nell'ordine del portfolio (ciclico). */
export const nextOf = (slug) => {
  const i = projects.findIndex((p) => p.slug === slug)
  return projects[(i + 1) % projects.length]
}
