// Le voci di pzkkopedia: per ora NESSUNA, la wiki è uno scheletro vuoto. wiki.js legge da qui.
//
// FORMATO
//   chiave  = il titolo della voce con gli spazi (non i trattini bassi) e la prima lettera maiuscola:
//             'Chiocciola', 'Categoria:Molluschi', 'Pzkkopedia:Informativa sulla privacy', 'Discussione:Chiocciola'
//   valore  = il wikitesto, una stringa; oppure { testo: '…', data: '2026-10-26' } se si vuole la data
//             dell’ultima modifica nel piè di pagina (senza, vale quella della nascita della wiki)
//   Il wikitesto capisce: '''grassetto''', ''corsivo'', == titolo ==, === sottotitolo ===, [[voce]], [[voce|testo]],
//   [[voce#sezione]], [[#sezione]], [https://… testo], elenchi con * e #, ---- e [[Categoria:X]] in fondo.
//   I link a voci che non esistono vengono rossi, come su ogni wiki.
//
// LA PAGINA PRINCIPALE
//   'Pagina principale' (se c’è) prende il posto di quella di serie. Altrimenti ogni riquadro cerca la sua sottopagina, e
//   se non c’è mostra «nessun contenuto ancora»: 'Pagina principale/Benvenuti', '…/Voce in vetrina', '…/Lo sapevi che',
//   '…/Ricorrenze', '…/Eventi correnti', '…/Nelle altre lingue', '…/Portali', '…/Progetti fratelli'.
//
// ESEMPIO (da togliere dal commento quando c’è qualcosa da dire)
//   'Chiocciola': { data: '2026-10-26', testo: `La '''chiocciola''' è un animale lento.
//   == Dove vive ==
//   Sul [[muro]] e sotto le foglie.
//   [[Categoria:Molluschi]]` },

export const VOCI = {}
