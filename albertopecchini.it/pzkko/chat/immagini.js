// Le immagini vere dei quiz e delle app del telefono (23.10): foto di Mantova, del cibo e delle cose citate da Alberto, prese
// da Wikimedia Commons (libere, con l'autore e la licenza da citare: la scheda li mostra sotto la foto). Nel browser si
// caricano da lì, mai copiate nel repository. Per usare invece IMGUR basta aggiungere una voce con `imgur: 'AbC123x'`
// (l'id dell'immagine, quello di https://i.imgur.com/AbC123x.jpg) al posto di `url`: src() la trasforma nel link giusto.
// Il caricamento è `referrerpolicy="no-referrer"` e senza chiavi; se un'immagine non si carica, la scheda va avanti senza.

export const IMMAGINI = {
  'ducale': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Mantoue_palais_ducal.jpg/500px-Mantoue_palais_ducal.jpg', cosa: 'il Palazzo Ducale', autore: 'Velvet', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Mantoue_palais_ducal.jpg' },
  'giganti': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Ceiling_of_the_Room_of_the_giants_in_Palazzo_Te%2C_Mantua.jpg/500px-Ceiling_of_the_Room_of_the_giants_in_Palazzo_Te%2C_Mantua.jpg', cosa: 'la Sala dei Giganti di Palazzo Te', autore: 'Wikimedia Commons', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Ceiling_of_the_Room_of_the_giants_in_Palazzo_Te,_Mantua.jpg' },
  'torre': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Mantova_Palazzo_della_Ragione_Torre_dell%27Orologio_1.jpg/500px-Mantova_Palazzo_della_Ragione_Torre_dell%27Orologio_1.jpg', cosa: 'la Torre dell’Orologio', autore: 'Zairon', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Mantova_Palazzo_della_Ragione_Torre_dell%27Orologio_1.jpg' },
  'lago': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Mantova_dock%2C_Lago_Superiore%2C_Mantova%2C_MN.jpg/500px-Mantova_dock%2C_Lago_Superiore%2C_Mantova%2C_MN.jpg', cosa: 'il Lago Superiore', autore: 'Gianfranco Manuali', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Mantova_dock,_Lago_Superiore,_Mantova,_MN.jpg' },
  'sandrea': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Mantoue_basilique_saint_andre_bis.jpg/500px-Mantoue_basilique_saint_andre_bis.jpg', cosa: 'la basilica di Sant’Andrea', autore: 'Velvet', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Mantoue_basilique_saint_andre_bis.jpg' },
  'rotonda': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/20110720_Rotonda_di_San_Lorenzo_3607.jpg/500px-20110720_Rotonda_di_San_Lorenzo_3607.jpg', cosa: 'la Rotonda di San Lorenzo', autore: 'Jakub Hałun', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:20110720_Rotonda_di_San_Lorenzo_3607.jpg' },
  'rigoletto': { url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/3541MantovaCasaRigoletto.jpg', cosa: 'la casa di Rigoletto', autore: 'Geobia', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:3541MantovaCasaRigoletto.jpg' },
  'mulini': { url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Ponte_dei_Mulini_di_Mantova.jpg', cosa: 'il Ponte dei Mulini (una cartolina d’epoca)', autore: 'autore ignoto', licenza: 'Public domain', pagina: 'https://commons.wikimedia.org/wiki/File:Ponte_dei_Mulini_di_Mantova.jpg' },
  'tortelli': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Tortelli_di_Zucca_1.jpg/500px-Tortelli_di_Zucca_1.jpg', cosa: 'i tortelli di zucca', autore: 'MS-R / Michael S-R', licenza: 'CC BY-SA 2.0', pagina: 'https://commons.wikimedia.org/wiki/File:Tortelli_di_Zucca_1.jpg' },
  'sbrisolona': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Sbrisolona.jpg/500px-Sbrisolona.jpg', cosa: 'la sbrisolona', autore: 'ho visto nina volare', licenza: 'CC BY-SA 2.0', pagina: 'https://commons.wikimedia.org/wiki/File:Sbrisolona.jpg' },
  'landini': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Landini_L25_25PS_1954.jpg/500px-Landini_L25_25PS_1954.jpg', cosa: 'un trattore Landini L25', autore: 'Späth Chr. (user ChiemseeMan)', licenza: 'Public domain', pagina: 'https://commons.wikimedia.org/wiki/File:Landini_L25_25PS_1954.jpg' },
  'ciao': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Piaggio_Ciao_front.jpg/500px-Piaggio_Ciao_front.jpg', cosa: 'un Piaggio Ciao', autore: 'Corvettec6r', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Piaggio_Ciao_front.jpg' },
  'sposi': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/Andrea_Mantegna_-_Camera_picta%2C_la_corte_01.jpg/500px-Andrea_Mantegna_-_Camera_picta%2C_la_corte_01.jpg', cosa: 'la Camera degli Sposi di Mantegna', autore: 'Andrea Mantegna', licenza: 'Public domain', pagina: 'https://commons.wikimedia.org/wiki/File:Andrea_Mantegna_-_Camera_picta,_la_corte_01.jpg' },
  'mostarda': { url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Sapori_mantovani_-_La_mostarda_di_frutta.jpg/500px-Sapori_mantovani_-_La_mostarda_di_frutta.jpg', cosa: 'la mostarda di frutta', autore: 'Maddy16869', licenza: 'CC BY-SA 4.0', pagina: 'https://commons.wikimedia.org/wiki/File:Sapori_mantovani_-_La_mostarda_di_frutta.jpg' },
}

/** L'indirizzo di un'immagine (Commons o Imgur). */
export const src = (id) => { const x = IMMAGINI[id]; return x ? (x.imgur ? `https://i.imgur.com/${x.imgur}.jpg` : x.url) : null }
/** Il credito da scrivere sotto la foto: «autore · licenza · Wikimedia Commons». */
export const credito = (id) => { const x = IMMAGINI[id]; return x?.url ? `foto: ${x.autore} · ${x.licenza} · Wikimedia Commons` : x?.imgur ? 'foto: Imgur' : '' }
/** Le immagini adatte a una domanda «che cos'è?»: [id, …]. */
export const ids = () => Object.keys(IMMAGINI)
