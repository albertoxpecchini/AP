// Il pzkstore (29.10, Alberto: «migliora app lavatrice e poi mettila in questo nuovo programma chiamato pzkstore dove si
// possono scaricare app nuove e a pagamento; ovviamente nelle task dove sarà richiesta scrivi tutto»): il negozio delle app
// del cercapersone. Quelle di serie sono già nella home; qui c'è il catalogo di quelle da comprare (CATALOGO: l'icona, due
// righe, il prezzo, e per la scheda tutto quanto: cosa fa, quanto costa, come si usa, cosa serve, le novità) e l'acquisto.
// (31.10) È la logica in comune col pzkstore del cercapersone zero (telefono/zero/os/pzkstore.js), con la chat («installa
// lavatrice», «lavatrice», «pzkstore»: chat/comandi/app.js, CATALOGO, PER_ID, compra) e col testo predittivo
// (chat/predittivo.js, CATALOGO); l'interfaccia HTML di qui (la vetrina e la scheda) se n'è andata col cercapersone vecchio.
//
// - SI PAGA COME NELLO SHOP: coi $pzk PULITI alla cassa di pzk: i soldi sporchi non valgono, in galera non si compra. Senza
//   conto non si compra niente. Dal 31.10 (Alberto: «il browser non decide più niente») comprare e togliere sono azioni della
//   banca (giochi/app-pzkstore.mjs sul server di Alberto, «pzkstore.compra» e «pzkstore.togli»), coi prezzi della banca:
//   qui il catalogo è per la vetrina.
// - L'APP COMPRATA SI INSTALLA nello zaino (lo installa la banca: vale su tutti i dispositivi del conto) e compare nella
//   home del cercapersone, nella pagina dei soldi.
// - SI PUÒ TOGLIERE, SENZA RIMBORSO: i soldi sono già della cassa di pzk, come per tutto quello che si compra; per riaverla
//   la si ricompra a prezzo pieno (così non si compra, si usa e si rende). La lavatrice non si toglie mentre gira.
// - «AGGIORNABILE» NON C'È: le app sono moduli del sito, arrivano sempre nuove a tutti (anche a chi le ha già); la scheda
//   dice la versione e cosa è cambiato.
// - IL PALLINO (daComprare, telefono.js): le app che ti servirebbero e non hai (soldi sporchi senza lavatrice, wallet cifrati
//   nello zaino senza decifratore), così si sa dove andare.

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'

const fmt = (n) => pzk.fmt(n)
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const pezziCifrati = () => zaino.quanti('wallet-pzk') + zaino.quanti('chiavetta')

// ── il catalogo ──
// I PREZZI (29.10):
// - la LAVATRICE 5.000 $pzk puliti, una volta. Un terzo del bottino più grosso di una rapina (15.000 a testa, api/wallet.mjs),
//   due lavaggi e mezzo di commissione (2.000 l'uno), più della cauzione (3.000) e del decifratore: è lei che rende
//   spendibile il bottino senza aspettare 96 giorni. Con un colpo buono si ripaga al primo lavaggio; con un colpo piccolo
//   conviene aspettare i 96 giorni, ed è giusto che sia una scelta.
// - il DECIFRATORE 1.500, quello che costava in chat dal 26.10: i wallet che apre danno da 150 a 1.500 $pzk, le chiavette
//   da 400 a 4.000, tre al giorno.
// Ogni voce: id (quello dell'app nel cercapersone), nome (f: femminile, per «installata»), icona, prezzo (0: gratis), genere
// (la pagina della home dove va), versione e novità, breve (la riga della vetrina), cosa (i paragrafi della scheda), punti
// (le pillole), come (i passi), serve (cosa ci vuole per usarla), utile() (ti servirebbe adesso: il pallino) e perche() (la
// riga «ti serve» della vetrina).
export const CATALOGO = [
  {
    id: 'lavatrice', nome: 'Lavatrice', f: true, icona: 'app-lavatrice', prezzo: 5000, genere: 'i soldi', versione: '2', del: '29.10.2026',
    novita: 'arriva nel pzkstore, rifatta: quanti sporchi e quanti puliti hai, quanto costa e come sarai dopo il lavaggio, il conto alla rovescia con l’ora in cui sono pronti, la storia dei lavaggi, cosa succede in galera. Prima era nella home di tutti: chi aveva soldi sporchi, un lavaggio in corso o l’aveva già usata se la tiene, regalata.',
    breve: 'i soldi sporchi delle rapine diventano puliti: fino a 50.000 in dieci minuti.',
    cosa: [
      'Il bottino delle rapine è <b>sporco</b>: si vede nel saldo, ma con pzk non si spende (né giochi, né shop, né app), non si manda e non si cambia in EUR€. Da solo si pulisce dopo 96 giorni.',
      'La lavatrice lo pulisce adesso: scegli quanti sporchi lavare (al più 50.000 alla volta), paghi la commissione e dopo dieci minuti sono puliti. La commissione è fissa, <b>2.000 $pzk puliti a lavaggio</b>, e va alla cassa di pzk: conviene lavarne il più possibile.',
    ],
    punti: ['fino a 50.000 a lavaggio', '10 minuti', '2.000 puliti di commissione', 'un lavaggio alla volta', 'in galera non parte'],
    come: [
      'la compri qui, una volta sola: <b>5.000 $pzk puliti</b> (in chat: «installa lavatrice»)',
      'la apri dalla home del cercapersone, nella pagina dei soldi',
      'scegli quanti sporchi lavare e paghi <b>2.000 puliti</b> di commissione',
      'dopo dieci minuti sono puliti: «ritira», o si puliscono da soli la prossima volta che usi il conto',
    ],
    serve: 'soldi sporchi da lavare (vengono dalle rapine alla cassa di pzk: l’app rapina, almeno in due) e 2.000 puliti a ogni lavaggio, per la commissione.',
    utile: () => zaino.decisa('lavatrice') && (pzk.sporchi() > 0 || !!pzk.lavaggio()),
    perche: () => `ti serve: hai ${fmt(pzk.sporchi())} $pzk sporchi da lavare`,
  },
  {
    id: 'decifratore', nome: 'Decifratore', icona: 'app-decifratore', prezzo: 1500, genere: 'i soldi', versione: '1', del: '26.10.2026',
    novita: 'dal 29.10 si compra anche qui; «installa decifratore» in chat va ancora, allo stesso prezzo.',
    breve: 'apre i wallet pzk e le chiavette usb che lo spazzino trova nei cestini.',
    cosa: [
      'Lo <b>spazzino di uffici</b> (in chat: «lavora come spazzino») vede passare sul nastro wallet pzk cifrati e chiavette usb: se li tieni finiscono nello zaino, ma chiusi.',
      'Il decifratore li apre con tre giochini facili (la parola spostata di una lettera, il numero in binario, la sequenza, la parola allo specchio; due errori perdonati). Dentro ci sono i $pzk dei portafogli smarriti: soldi <b>puliti</b>, perché erano destinati a sparire.',
    ],
    punti: ['tre giochini a pezzo', 'due errori perdonati', 'soldi puliti', 'tre al giorno'],
    come: [
      'lo compri qui, una volta sola: <b>1.500 $pzk puliti</b> (o in chat: «installa decifratore»)',
      'fai lo spazzino di uffici e tieni i wallet e le chiavette che passano sul nastro',
      'apri il decifratore dalla home, nella pagina dei soldi, e risolvi i tre giochini',
    ],
    serve: 'wallet pzk o chiavette usb nello zaino: li trova lo spazzino di uffici, un lavoro rischioso (in chat: «lavora come spazzino»).',
    utile: () => pezziCifrati() > 0,
    perche: () => `ti serve: hai ${pezziCifrati()} ${pezziCifrati() === 1 ? 'pezzo cifrato' : 'pezzi cifrati'} nello zaino`,
  },
]
export const PER_ID = Object.fromEntries(CATALOGO.map((x) => [x.id, x]))

/** Il pallino dell'icona: le app che ti servirebbero adesso e non hai. */
export const daComprare = () => (pzk.conto() ? CATALOGO.filter((x) => !zaino.installata(x.id) && x.utile()).length : 0)
/** Regalata: l'aveva di serie prima del pzkstore (la lavatrice di prima). */
export const regalata = (id) => zaino.installataIl(id) === zaino.REGALO

/** Perché non si può comprare adesso (o null): il conto, la galera, i soldi. */
function ostacolo(x) {
  if (!pzk.conto()) return { errore: 'il pzkstore vuole il conto: crealo o entra nell’app account del cercapersone' }
  if (pzk.inGalera()) return { errore: `in galera il pzkstore non vende: sei dentro fino alle ${ora(pzk.galera())} (si esce prima con la cauzione, nell’app rapina)` }
  if (x.prezzo > pzk.puliti()) return { errore: `costa ${fmt(x.prezzo)} $pzk puliti e ne hai ${fmt(pzk.puliti())}${pzk.sporchi() > 0 ? ` (i soldi sporchi non valgono: ne hai ${fmt(pzk.sporchi())})` : ''}`, manca: x.prezzo - pzk.puliti() }
  return null
}
/** Compra e installa: (31.10) lo fa la banca (giochi/app-pzkstore.mjs), coi suoi prezzi, alla cassa di pzk; qui si dice prima
 *  quello che manca, con le parole dell'app. → Promise<{ ok, x, tot } | { ok: false, errore, manca? }> */
export async function compra(id) {
  const x = PER_ID[id]
  if (!x) return { ok: false, errore: 'nel pzkstore non c’è' }
  if (zaino.installata(id)) return { ok: false, errore: `${x.nome.toLowerCase()} ce l’hai già: è nella home, nella pagina dei soldi` }
  const no = ostacolo(x)
  if (no) return { ok: false, ...no }
  const d = await pzk.fai('pzkstore.compra', { id })
  return d?.ok ? { ok: true, x, tot: d.esito.tot } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova', ...(d?.manca && { manca: d.manca }) }
}
/** Toglie l'app dal cercapersone (senza rimborso): anche questo sulla banca. → Promise<{ ok, x } | { ok: false, errore }> */
export async function togli(id) {
  const x = PER_ID[id]
  if (!x || !zaino.installata(id)) return { ok: false, errore: 'non è installata nel cercapersone' }
  if (id === 'lavatrice' && pzk.lavaggio()) return { ok: false, errore: 'la lavatrice ha un lavaggio dentro: la togli quando l’hai ritirato' }
  const d = await pzk.fai('pzkstore.togli', { id })
  return d?.ok ? { ok: true, x } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
}
