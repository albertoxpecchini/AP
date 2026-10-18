// /studio/, le ultime due sezioni: «Tempo libero» (Better Call Saul, la saga e
// bettercallpekko.it, con la legenda dei riferimenti) e le domande personali.
//
// Le risposte le scrive Alberto nel documento «Studio — tempo libero e FAQ
// personali (da compilare)» e si copiano qui così come sono. Una risposta vuota
// non compare; un gruppo tutto vuoto sparisce, e con lui la sezione. Finché ne
// mancano, la build le conta tra i segnaposto (vedi `tempoLiberoTodo`).
//
// La legenda spiega i riferimenti con parole nostre: niente battute né frasi
// della serie citate alla lettera, solo cosa richiamano e dove. Le righe con
// `ok: false` aspettano la conferma di Alberto e non vanno online.

export const saga = {
  label: 'Tempo libero',
  title: 'Fuori orario: Better Call Saul',
  intro: [
    'Fuori dal lavoro la mia passione è Better Call Saul, con tutta la saga di Breaking Bad attorno. Ci tengo abbastanza da averle dedicato un sito intero.',
    'Su bettercallpekko.it «Pekko», il mio soprannome, ripara computer come Saul Goodman difende i suoi clienti, nello stile del sito promozionale che AMC pubblicò nel 2009. È uno scherzo fatto sul serio: i contatori, il forum e il modulo funzionano davvero, e l’assistenza è quella vera, raccontata seriamente nella pagina Informatica.',
  ],
  sito: {
    url: 'https://www.bettercallpekko.it',
    nome: 'bettercallpekko.it',
    cattura: { src: '/media/assistenza/shot-bcp.webp', width: 1200, height: 2834, alt: 'La pagina intera di bettercallpekko.it: testata gialla, colonna blu, annunci e scritte in 3D' },
  },
  nota: 'Le serie e i loro personaggi appartengono ai rispettivi titolari: bettercallpekko.it è l’omaggio di un fan e non ha legami con AMC né con Sony Pictures Television.',

  // Le mie risposte sulla saga (documento, «Le tue risposte»).
  risposte: [
    { q: 'Come ho conosciuto la saga', a: '' },
    { q: 'Quante volte l’ho vista', a: '' },
    { q: 'Il personaggio che preferisco', a: '' },
    { q: 'Il momento che mi è rimasto addosso', a: '' },
    { q: 'Breaking Bad o Better Call Saul?', a: '' },
    { q: 'Cosa mi ha lasciato', a: '' },
    { q: 'Perché «Pekko»', a: '' },
    { q: 'Perché ho fatto bettercallpekko.it', a: '' },
  ],

  // Come la legenda di una tavola: cosa c'è sul sito di Pekko, cosa richiama, dove.
  legenda: [
    { sito: 'Il nome «Better Call Pekko»', richiama: 'Il titolo della serie, che è anche lo slogan pubblicitario di Saul Goodman, l’avvocato da spot televisivo.', dove: 'Breaking Bad, 2ª stagione, episodio 8, che porta lo stesso titolo: la prima volta di Saul (2009).', ok: true },
    { sito: 'L’impianto della pagina: 960 px, giallo, rosso e blu, scritte bianche in 3D, colonna blu con i tasti gialli, pop-up', richiama: 'Il sito promozionale che AMC mise online nel 2009 come se fosse lo studio di Saul: stessa disposizione, stessi colori, stesso gusto da web di quegli anni.', dove: 'Uscito con la 2ª stagione di Breaking Bad (2009).', ok: true },
    { sito: 'Il riquadro giallo sui guai col computer, con i quattro video', richiama: 'La domanda sui guai con la legge che apriva il sito di Saul, sopra i suoi video.', dove: 'Il sito promozionale del 2009.', ok: true },
    { sito: 'Il monologo sui diritti del computer, innocente fino a prova d’infezione', richiama: 'Lo spot di Saul: i diritti del cittadino, la presunzione d’innocenza, la chiusa col suo nome. Pekko ne rifà la struttura, con i PC al posto degli imputati.', dove: 'Breaking Bad 2×08, lo spot che si vede nell’episodio.', ok: true },
    { sito: '«As seen on TV» e lo spot di notte sul canale 47', richiama: 'Gli spot a basso costo di Saul sulle TV locali di Albuquerque; in Better Call Saul si vede Jimmy girarli da solo, con mezzi di fortuna.', dove: 'Breaking Bad dalla 2ª stagione; Better Call Saul, 2ª e 3ª stagione.', ok: true },
    { sito: 'La scheda «real name» col mio nome vero', richiama: 'Saul Goodman è un nome d’arte: all’anagrafe è James «Jimmy» McGill. Lo rivela lui a Walt al primo incontro.', dove: 'Breaking Bad 2×08; la scelta del nome in Better Call Saul, fine della 4ª stagione.', ok: true },
    { sito: 'Lo slogan sul «tutto a posto»', richiama: 'Il gioco di parole nascosto in «Saul Goodman»: detto di corsa, suona come l’inglese per «va tutto bene, amico». Jimmy lo scioglie quando annuncia il nuovo nome.', dove: 'Better Call Saul 4×10, ultima scena della stagione.', ok: true },
    { sito: '«slippin pekko» tra i soprannomi', richiama: 'Slippin’ Jimmy, il soprannome di Jimmy da ragazzo a Cicero, Illinois, quando fingeva di scivolare per farsi pagare i danni.', dove: 'Better Call Saul, 1ª stagione, nei ricordi di Cicero.', ok: true },
    { sito: '«Pekko’s Outfit» e le foto nei completi sgargianti', richiama: 'I completi di Saul, colori accesi e camicie a contrasto per farsi notare; in Better Call Saul Jimmy li adotta quando diventa Saul a tempo pieno.', dove: 'Breaking Bad, ogni apparizione di Saul; Better Call Saul dalla 5ª stagione.', ok: true },
    { sito: 'Pekko col dito puntato verso chi guarda', richiama: 'La posa di Saul nei suoi manifesti e nella testata del suo sito.', dove: 'Il sito del 2009 e gli annunci di Saul.', ok: true },
    { sito: '«Los Backups Hermanos»', richiama: 'Los Pollos Hermanos, la catena di pollo fritto di Gus Fring, facciata dei suoi traffici; anche il sito di Saul aveva uno spazio per i Pollos.', dove: 'Breaking Bad 2×11: prima apparizione di Gus e del ristorante.', ok: true },
    { sito: 'Il riquadro sulla «tragedia» di Windows Vista', richiama: 'L’annuncio con cui Saul cercava clienti tra le persone colpite dal disastro aereo del volo Wayfarer 515 sopra Albuquerque.', dove: 'Breaking Bad 2×13, il finale della 2ª stagione; il sito del 2009.', ok: true },
    { sito: 'Il piede: nessun legame con reti TV, studi legali, ristoranti di pollo', richiama: 'Una presa di distanza da AMC, dagli studi legali della saga e da Los Pollos Hermanos (e dalla mela morsicata).', dove: 'Tutta la saga.', ok: true },
    // da confermare (documento, righe 14–19)
    { sito: 'L’e-card n. 4, quella sul mandato d’arresto per il disco fisso', richiama: 'Saul che conosce sempre qualcuno che conosce qualcuno: è così che risolve i problemi di Walt.', dove: 'Breaking Bad, 2ª stagione, quando procura a Walt un nuovo distributore.', ok: false },
    { sito: 'L’e-card n. 2, i file doppi che «spariscono»', richiama: 'L’uomo che fa sparire le persone con una nuova identità, dietro un negozio di aspirapolvere, a cui Saul manda i clienti.', dove: 'Breaking Bad, 5ª stagione; El Camino.', ok: false },
    { sito: 'Le e-card da mandare agli amici', richiama: 'Le cartoline elettroniche del sito promozionale di Saul.', dove: 'Il sito del 2009.', ok: false },
    { sito: '«SI PARLA ITALIANO»', richiama: 'Gli annunci di Saul che promettevano assistenza in spagnolo.', dove: 'Breaking Bad.', ok: false },
    { sito: '«Niente ufficio con le colonne (per ora)»', richiama: 'Lo studio di Saul in Breaking Bad, in un piccolo centro commerciale e in finto stile istituzionale; e il primo ufficio di Jimmy, nel retro di un salone di manicure.', dove: 'Breaking Bad dalla 2ª stagione; Better Call Saul, 1ª stagione.', ok: false },
    { sito: 'Il telefono scritto all’americana, a trattini', richiama: 'Il numero di Saul come appare nei suoi annunci.', dove: 'Breaking Bad.', ok: false },
  ],
}

// Le domande personali, nell'ordine del documento: dalla saga alle cose più
// tue. Si pubblicano solo le risposte scritte.
export const faqPersonali = {
  label: 'Domande personali',
  title: 'Quello che sanno gli amici',
  lead: 'Il lato che conoscono amici e parenti, in poche risposte.',
  gruppi: [
    {
      nome: 'Serie TV',
      voci: [
        { q: 'Oltre a Better Call Saul, cosa guardi?', a: '' },
        { q: 'La serie che consigli sempre?', a: '' },
        { q: 'Una puntata alla volta o tutta di fila?', a: '' },
        { q: 'E i film?', a: '' },
        { q: 'Quella che piace a tutti tranne a te?', a: '' },
      ],
    },
    {
      nome: 'Natura e animali',
      voci: [
        { q: 'Chi sono la chiocciola e la nutria?', a: '' },
        { q: 'Dove vai quando vuoi stare all’aperto?', a: '' },
        { q: 'Cosa fai all’aria aperta?', a: '' },
        { q: 'La stagione che preferisci?', a: '' },
        { q: 'Fotografi quello che vedi?', a: '' },
      ],
    },
    {
      nome: 'Veicoli',
      voci: [
        { q: 'Cosa guidi?', a: '' },
        { q: 'Le metti le mani sopra?', a: '' },
        { q: 'Il veicolo dei sogni?', a: '' },
        { q: 'Un giro che ricordi?', a: '' },
      ],
    },
    {
      nome: 'Vacanze',
      voci: [
        { q: 'Mare, montagna o città?', a: '' },
        { q: 'Il posto più bello dove sei stato?', a: '' },
        { q: 'Tutto organizzato o all’avventura?', a: '' },
        { q: 'Il prossimo posto che vuoi vedere?', a: '' },
      ],
    },
    {
      nome: 'Amici',
      voci: [
        { q: 'Cosa fate quando vi trovate?', a: '' },
        { q: 'Cosa ti chiedono sempre?', a: '' },
        { q: 'Come ti descriverebbero in tre parole?', a: '' },
        { q: 'Il tuo ruolo nel gruppo?', a: '' },
      ],
    },
  ],
}

const vuote = (voci) => voci.filter((v) => !v.a.trim()).length

/** Per la build: quante risposte mancano ancora (elenco dei segnaposto). */
export function tempoLiberoTodo() {
  const todo = []
  const saga_ = vuote(saga.risposte)
  if (saga_) todo.push(`/studio/ · tempo libero: ${saga_} risposte sulla saga da compilare (src/data/tempo-libero.js)`)
  const faq = faqPersonali.gruppi.reduce((n, g) => n + vuote(g.voci), 0)
  if (faq) todo.push(`/studio/ · domande personali: ${faq} risposte da compilare (src/data/tempo-libero.js)`)
  const daConfermare = saga.legenda.filter((r) => !r.ok).length
  if (daConfermare) todo.push(`/studio/ · legenda di Better Call Pekko: ${daConfermare} riferimenti da confermare (ok: false)`)
  return todo
}
