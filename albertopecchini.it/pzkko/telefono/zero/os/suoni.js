// I suoni di pzk os (29.10, Alberto: «regole… per creare app in pzk os… con l'aggiunta di icone, animazioni e suoni tutti
// funzionanti»): un posto solo. Tutto passa da suono/interfaccia.js (sintetizzato dal vivo, niente file: le sue sigle
// MUSICHE e i suonini TASTI), e tace se nelle impostazioni di pzk os i suoni sono spenti (impostazioni.js, `suoni`, che è
// lo stesso interruttore pzkko-suono del sito).
//
//   bip(tipo)    un suonino da tasto: 'pager' (OK, la croce), 'pagerGiu' (INDIETRO), 'scheda' (cambio di scheda o di
//                pagina), 'cursore' (un passo che scorre), 'plastica', 'meccanico', 'tavolo', 'morbido'
//   sigla(nome)  una sigla di interfaccia.js: quella di un'app (chat, negozio, sfide, quiz, zaino…) o di un momento
//                (moneta, dado, mine, roulette, accendi, spegni…)
//
// os.js fa già il bip di OGNI tasto (os.tasto, os.invio) e la sigla di ogni app che si apre (os.apri): un'app chiama
// bip e sigla solo per i SUOI eventi (una vincita, un errore, un conto alla rovescia). Un suono nuovo si scrive in
// suono/interfaccia.js (MUSICHE o TASTI), mai un file audio, mai un AudioContext qui.
import * as impostazioni from './impostazioni.js'

let ui = null
// (interfaccia.js si carica la prima volta che serve: telefono.js l'ha già in memoria, qui non costa niente)
const modulo = () => (ui ??= import('../../../suono/interfaccia.js').catch(() => { ui = null; return null }))
const zitto = () => !impostazioni.leggi().suoni

/** Un suonino da tasto (vedi sopra i tipi). Silenzioso se i suoni sono spenti. */
export function bip(tipo = 'pager') {
  if (zitto()) return
  modulo().then((m) => m?.tasto(tipo, true))
}
/** Una sigla di suono/interfaccia.js; un nome che non c'è non suona (e non rompe niente). */
export function sigla(nome) {
  if (zitto() || !nome) return
  modulo().then((m) => m?.musichetta(nome, true))
}
