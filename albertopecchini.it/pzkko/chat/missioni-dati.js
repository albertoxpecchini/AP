// Le side quest (23.10): storie a bivi, brevi, con cose di Mantova e di pzk. Ogni missione si fa una volta e dà un premio.
//
// missione: { id, nome, icona, breve, liv (livello minimo), richiede: [oggetti che servono per cominciare], consuma: [oggetti
//   che si perdono cominciando], premio: { pzk, xp, oggetto? }, nodi: { start: nodo, … } }
// nodo: { t: testo, scelte: [scelta], fine?: true (è l'ultimo: dà il premio) }
// scelta: { eti, vai, richiede? (un oggetto), uno? ([oggetti]: ne basta uno, e si consuma), costo? ($pzk da pagare),
//           perde? ($pzk persi, senza poter dire no), segna? (una bandierina), se? ([bandierine che devono esserci]),
//           non? (una bandierina che NON deve esserci), caso? { p, ko: nodo } (con probabilità p va in vai, se no in ko) }

import { MISSIONI_NUOVE } from './missioni-altre.js'

const PRIME = [
  {
    id: 'civico28', nome: 'Il civico 28', icona: 'citofono', breve: 'una porta che dice «chiuso» dal 1987', liv: 1, richiede: ['citofono'], premio: { pzk: 450, xp: 80, oggetto: 'chiave-vecchia' },
    nodi: {
      start: { t: 'La porta col numero 28 è chiusa. Sopra c’è scritto «CHIUSO» e sotto, a penna, «torno subito» (l’ha scritto qualcuno nel 1987). Il citofono che hai comprato ha un solo tasto, ed è molto invitante.', scelte: [
        { eti: 'premi il tasto', vai: 'voce' }, { eti: 'bussa sul vetro', vai: 'vetro' },
      ] },
      vetro: { t: 'Bussi sul vetro. Dentro qualcosa si muove, poi più niente. Una mosca ti guarda dal lato sbagliato del vetro, offesa.', scelte: [{ eti: 'premi il tasto', vai: 'voce' }] },
      voce: { t: 'Il citofono gracchia: «Chi è?». Una voce che sembra una chiocciola con l’influenza.', scelte: [
        { eti: 'sono la banca $pzk', vai: 'banca' }, { eti: 'sono il rider, ho una pizza', vai: 'dentro', caso: { p: 0.5, ko: 'pizza' } }, { eti: 'sono Virgilio', vai: 'virgilio' },
      ] },
      banca: { t: '«La banca non fa beneficenza» dice la voce. «Ma ha un debito con me, da quando ha messo gli occhiali da sole.» La porta scatta di un dito.', scelte: [{ eti: 'spingi la porta', vai: 'dentro' }] },
      pizza: { t: '«Non ho ordinato niente!» Una pizza fredda ti arriva in faccia da una finestra. Perdi 50 $pzk di dignità (e di mancia).', scelte: [{ eti: 'riprova', vai: 'voce', perde: 50 }] },
      virgilio: { t: '«Virgilio? Quello vero? Cantami, o diva…» La voce singhiozza dalla commozione. La porta si apre da sola.', scelte: [{ eti: 'entra', vai: 'dentro' }] },
      dentro: { t: 'Dentro c’è un negozio che non ha mai aperto: scaffali di roba del brand, tutta impolverata, e una scrivania con un registro. Sul registro: «cassa: 0 $pzk». Sopra, una chiave di ferro.', scelte: [
        { eti: 'sfoglia il registro', vai: 'registro' }, { eti: 'prendi la chiave', vai: 'chiave' },
      ] },
      registro: { t: 'Il registro dice che ogni sera alle 19 una chiocciola passava a contare i soldi. Poi un giorno ha messo gli occhiali da sole e non è più tornata. L’ultima riga è un conto: sono i tuoi $pzk, anzi i suoi.', scelte: [{ eti: 'prendi la chiave', vai: 'chiave' }] },
      chiave: { fine: true, t: 'Prendi la chiave. Esci, chiudi la porta, e il cartello cambia: adesso dice «chiuso (per te)». È un inizio. Nella tasca ti ritrovi una chiave di ferro vecchia e, chissà come, dei $pzk.' },
    },
  },
  {
    id: 'pomodoro', nome: 'Il pomodoro che scoppia', icona: 'pomodoro', breve: 'un pomodoro troppo maturo e una telecamera', liv: 1, richiede: ['pomodoro'], consuma: ['pomodoro'], premio: { pzk: 220, xp: 45, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'Hai in mano un pomodoro maturo. Anzi: troppo maturo. Si gonfia, trema, pulsa. Ti ricorda qualcosa: una schermata di caricamento.', scelte: [
        { eti: 'tienilo in mano', vai: 'mano' }, { eti: 'mettilo sul davanzale', vai: 'davanzale' }, { eti: 'lancialo', vai: 'lancio' },
      ] },
      mano: { t: 'Lo tieni stretto. Il pomodoro si ingrandisce: ora è grande come un pallone. Un pomodoro non dovrebbe fare così.', scelte: [{ eti: 'allontanati piano', vai: 'boom' }, { eti: 'cerca una telecamera', vai: 'camera' }] },
      davanzale: { t: 'Il sole lo cuoce lentamente. Cresce fino a riempire tutto il davanzale. Sotto passa una nutria che si ferma a guardarlo, con rispetto.', scelte: [{ eti: 'aspetta', vai: 'boom' }] },
      lancio: { t: 'Lo lanci in alto. Resta fermo in aria un secondo di troppo, come nei film, e poi comincia a scendere con una calma inquietante.', scelte: [{ eti: 'corri', vai: 'boom', caso: { p: 0.5, ko: 'macchia' } }] },
      macchia: { t: 'Non sei stato abbastanza veloce: ti arriva addosso uno schizzo rosso. Lavare la maglietta costa 40 $pzk.', scelte: [{ eti: 'ripulisciti e riprova', vai: 'start', perde: 40 }] },
      camera: { t: 'Trovi la telecamera di sorveglianza di via Chiassi e ci punti contro il pomodoro. Lui, finalmente, capisce.', scelte: [{ eti: 'conta fino a tre', vai: 'boom' }] },
      boom: { t: 'BUM. Il pomodoro scoppia e macchia l’obiettivo della telecamera. Poi, piano piano e velocemente, la macchia sparisce. Sulla lente resta una buccia, e dentro la buccia, un seme d’oro.', scelte: [{ eti: 'prendi il seme', vai: 'seme' }] },
      seme: { fine: true, t: 'Il seme d’oro è un regalo del pomodoro: se lo pianti, qualcosa cresce. Intanto lo scambi in cassa, e la cassa ti restituisce una cassa. Matematica del Mincio.' },
    },
  },
  {
    id: 'petizione', nome: 'La petizione', icona: 'petizione', breve: 'tre firme prima del tramonto', liv: 1, richiede: ['petizione'], premio: { pzk: 350, xp: 70, oggetto: 'estathe' },
    nodi: {
      start: { t: 'La petizione «pzkko.it è un bel sito?» ha tre penne BIC attaccate con la corda e lo scotch. Ti servono tre firme prima del tramonto. Chi ti sembra più facile?', scelte: [
        { eti: 'la nonna di via Chiassi', vai: 'nonna', non: 'nonna' }, { eti: 'il bidello di unimore', vai: 'bidello', non: 'bidello' }, { eti: 'Virgilio, la statua', vai: 'virgilio', non: 'virgilio' },
        { eti: 'consegna la petizione', vai: 'fine', se: ['nonna', 'bidello', 'virgilio'] },
      ] },
      nonna: { t: '«Firmo, ma solo se mi dici che il sito è bello. Ai miei tempi i siti si facevano col gesso.» Hai due secondi.', scelte: [
        { eti: 'è bellissimo', vai: 'start', segna: 'nonna' }, { eti: 'è un sito', vai: 'rifiuto' },
      ] },
      rifiuto: { t: '«Allora non firmo.» E si rimette a guardare il carrello della spesa. Va bene, si riprova.', scelte: [{ eti: 'torna alla lista', vai: 'start' }] },
      bidello: { t: 'Il bidello apre e chiude un’aula senza guardarti. «Firmo se mi paghi un caffè. O se prometti che lasci l’aula pulita.»', scelte: [
        { eti: 'pagagli il caffè (250 $pzk)', vai: 'start', costo: 250, segna: 'bidello' }, { eti: 'prometti di lasciare l’aula pulita', vai: 'start', segna: 'bidello', caso: { p: 0.5, ko: 'rifiuto' } },
      ] },
      virgilio: { t: 'Virgilio non firma: ha le mani di bronzo e il piedistallo alto tre metri. Ma c’è un modo: se gli metti la penna fra le dita, la mano la stringe.', scelte: [
        { eti: 'metti la penna fra le dita della statua', vai: 'start', segna: 'virgilio' },
      ] },
      fine: { fine: true, t: 'Tre firme: la nonna, il bidello, e quella di Virgilio (che per l’occasione è la «X» di una statua). La petizione ora è pubblica, e tutti i nomi sono scritti, con la data.' },
    },
  },
  {
    id: 'landini', nome: 'Il Landini non parte', icona: 'landini', breve: 'testa calda del 1957, da scaldare col fuoco', liv: 2, richiede: ['landini'], premio: { pzk: 600, xp: 90, oggetto: 'cassa-comune' },
    nodi: {
      start: { t: 'Il Landini L25 testa calda del 1957 non parte. Per accenderlo si scalda il bulbo col fuoco e poi si dà un colpo di volano, nel verso giusto. Non ricordi qual è il verso giusto.', scelte: [
        { eti: 'scalda il bulbo col fuoco', vai: 'fuoco' }, { eti: 'leggi il manuale', vai: 'manuale', richiede: 'manuale-landini' }, { eti: 'dagli un calcio', vai: 'calcio' },
      ] },
      fuoco: { t: 'Scaldi il bulbo. Rosso, poi più rosso. Senti odore di vernice del 1957, di olio e di nostalgia di gente che non conosci.', scelte: [{ eti: 'dai il colpo di volano', vai: 'parte', caso: { p: 0.55, ko: 'indietro' } }] },
      manuale: { t: 'Il manuale (con la macchia di caffè) dice: «scaldare il bulbo fino al colore ciliegia, poi volano in senso orario, MAI antiorario». Sul margine, a matita: «mai».', scelte: [{ eti: 'segui le istruzioni', vai: 'parte' }] },
      calcio: { t: 'Il Landini non apprezza. Ti cade sul piede il volano, che pesa quanto un cinghiale. Il medico è gratis, la dignità no: 100 $pzk.', scelte: [{ eti: 'riprova con la testa', vai: 'start', perde: 100 }] },
      indietro: { t: 'Il volano gira all’indietro. Il trattore parte, sì, ma in retromarcia, dritto nel fosso. Per tirarlo fuori ci vogliono 80 $pzk e un vicino gentile.', scelte: [{ eti: 'riprova', vai: 'start', perde: 80 }] },
      parte: { fine: true, t: 'TUM. TUM. TUM. Il Landini parte con un rumore che si sente fino a Rivalta sul Mincio. I vicini applaudono dalla finestra. Uno di loro chiama i carabinieri, ma per chiedere dove si compra.' },
    },
  },
  {
    id: 'drago', nome: 'Il drago del Mincio', icona: 'drago', breve: 'dorme sotto il ponte, ha fame', liv: 3, richiede: [], premio: { pzk: 1000, xp: 150, oggetto: 'cassa-rara' },
    nodi: {
      start: { t: 'Sull’argine del Mincio, dove l’acqua è più ferma, c’è un fumo che non è nebbia. Sotto il ponte dorme il drago. Ha un occhio mezzo aperto, e la pancia che brontola.', scelte: [
        { eti: 'avvicinati piano', vai: 'piano' }, { eti: 'lancia un sasso', vai: 'sasso' }, { eti: 'offrigli da mangiare', vai: 'offri', uno: ['tortelli', 'mortadella', 'ramen', 'sbrisolona', 'grissini'] },
      ] },
      piano: { t: 'Ti avvicini. Il drago apre un occhio. È giallo come la mostarda.', scelte: [{ eti: 'sussurra «sono della banca»', vai: 'amico', caso: { p: 0.5, ko: 'sputo' } }, { eti: 'scappa', vai: 'fuga' }] },
      sasso: { t: 'Il sasso rimbalza sul drago. Il drago apre anche l’altro occhio, che è molto più arrabbiato. Starnutisce fuoco e ti brucia le sopracciglia (150 $pzk di parrucchiere).', scelte: [{ eti: 'scappa', vai: 'start', perde: 150 }] },
      sputo: { t: '«La banca?!» ruggisce. Il drago sputa fuoco sui tuoi $pzk. Ne restano meno (200 $pzk in cenere).', scelte: [{ eti: 'scappa', vai: 'fuga', perde: 200 }] },
      fuga: { t: 'Corri. Il drago non ti insegue: ti guarda con pena. Torni indietro e riprovi, magari con un piano.', scelte: [{ eti: 'riprova', vai: 'start' }] },
      offri: { t: 'Il drago annusa. Mangia. Sorride (un drago che sorride è un’esperienza che ti cambia). Poi ti guarda come si guarda un amico.', scelte: [{ eti: 'siediti vicino a lui', vai: 'amico' }] },
      amico: { fine: true, t: 'Il drago ti lascia una scaglia d’oro, poi si rimette a dormire. Il Mincio torna silenzioso. Domani nessuno ti crederà: ma la scaglia c’è.' },
    },
  },
]
export const MISSIONI = [...PRIME, ...MISSIONI_NUOVE]
export const PER_ID = Object.fromEntries(MISSIONI.map((m) => [m.id, m]))
