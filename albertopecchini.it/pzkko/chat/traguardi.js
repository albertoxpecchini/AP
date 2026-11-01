// I traguardi di pzkko (26.10, gli «achievement» della barra in alto: la pagina /traguardi/): quello che hai fatto, letto
// dallo zaino (chat/zaino.js: le statistiche, i giochi grandi, la cucina, le facce, i leggendari) e dai soldi
// (games/pzk.js). Non si salvano a parte: ogni traguardo è una funzione che dice a che punto sei, quindi valgono anche
// quelli fatti prima che esistessero. Col conto lo zaino è quello del conto; senza, quello di questa scheda del browser.
//
//   tutti()  → [{ id, nome, cosa, icona, gruppo, n, di, fatto }]   (n su di: il progresso)

import * as zaino from './zaino.js'
import * as pzk from '../games/pzk.js'

const s = (k) => zaino.stat(k)
const rari = () => zaino.stato().rari ?? []
const giochi = () => Object.values(zaino.giochi())
const cucina = () => Object.values(zaino.cucinaStato().record ?? {})
// [id, gruppo, icona, nome, cosa, (→ [n, di])]
const LISTA = [
  ['conto', 'banca', 'app-account', 'mettersi in regola', 'crea il conto: i $pzk diventano tuoi', () => [pzk.conto() ? 1 : 0, 1]],
  ['ricco', 'banca', 'bot-ricco', 'riccone', 'arriva a 50.000 $pzk liberi', () => [pzk.saldo(), 50000]],
  ['livello5', 'esperienza', 'livello', 'si comincia', 'arriva al livello 5', () => [zaino.livello(), 5]],
  ['livello10', 'esperienza', 'livello', 'veterano', 'arriva al livello 10', () => [zaino.livello(), 10]],
  ['livello20', 'esperienza', 'livello', 'leggenda del muro', 'arriva al livello 20', () => [zaino.livello(), 20]],
  ['comandi', 'chat', 'bot', 'chiacchierone', 'scrivi 100 comandi al bot', () => [s('comandi'), 100]],
  ['lavoro', 'chat', 'rider', 'stakanovista', 'fai 50 turni di lavoro', () => [s('turniLavoro'), 50]],
  ['pesca', 'chat', 'canna', 'pescatore del Mincio', 'pesca 50 volte', () => [s('pescati'), 50]],
  ['carpa', 'chat', 'carpa-oro', 're del Mincio', 'pesca la carpa d’oro', () => [rari().includes('carpa-oro') ? 1 : 0, 1]],
  ['caccia', 'chat', 'fionda', 'cacciatore di nutrie', 'caccia 50 volte', () => [s('cacciati'), 50]],
  ['drago', 'chat', 'drago', 'ammazzadraghi', 'caccia il drago', () => [rari().includes('drago') ? 1 : 0, 1]],
  ['scavo', 'chat', 'pala', 'tombarolo gonzaghesco', 'scava 50 volte', () => [s('scavati'), 50]],
  ['tesoro', 'chat', 'tesoro', 'il tesoro dei Gonzaga', 'scava il tesoro', () => [rari().includes('tesoro') ? 1 : 0, 1]],
  ['morte', 'chat', 'teschio', 'anche questo è un traguardo', 'muori una volta', () => [s('morti'), 1]],
  ['immortale', 'chat', 'bot-morto', 'immortale (a metà)', 'muori 15 volte', () => [s('morti'), 15]],
  ['mani', 'giochi', 'carte', 'giocatore', 'gioca 100 mani ai giochi grandi', () => [s('giri'), 100]],
  ['tutti', 'giochi', 'dadi', 'girandola', 'gioca almeno una mano in tutti e sei i giochi grandi', () => [giochi().filter((g) => g[0] > 0).length, 6]],
  ['colpo', 'giochi', 'sette', 'colpo grosso', 'vinci 1.000 $pzk in una mano sola', () => [Math.max(0, ...giochi().map((g) => g[4])), 1000]],
  ['quiz', 'cervello', 'quiz', 'cervellone', 'rispondi giusto a 50 quiz', () => [s('quizGiusti'), 50]],
  ['serie', 'cervello', 'fuoco', 'costante', 'prendi il premio giornaliero 7 giorni di fila', () => [zaino.serie('giornaliero').n, 7]],
  ['sfide', 'cervello', 'fulmine', 'ossessionato', 'completa 30 sfide giornaliere', () => [s('sfideFatte'), 30]],
  ['quest', 'cervello', 'chiave-vecchia', 'eroe di Mantova', 'completa 5 side quest', () => [s('missioniFatte'), 5]],
  ['nonna', 'cucina', 'av-nonna', 'la nonna è fiera', 'prendi una medaglia d’oro in cucina', () => [cucina().some((v) => v >= 0.9) ? 1 : 0, 1]],
  ['chef', 'cucina', 'tortelli', 'chef del Mincio', 'l’oro in tutte e quattro le ricette', () => [cucina().filter((v) => v >= 0.9).length, 4]],
  ['facce', 'profilo', 'app-profilo', 'collezionista di facce', 'abbi 10 facce del profilo (le 5 di tutti contano)', () => [5 + (zaino.profilo().avs ?? []).length, 10]],
  // (26.10 sera, «altri obbiettivi/traguardi»)
  ['milionario', 'banca', 'bot-ricco', 'miliardario in sedicesimi', 'arriva a 500.000 $pzk liberi', () => [pzk.saldo(), 500000]],
  ['livello15', 'esperienza', 'livello', 'ormai di casa', 'arriva al livello 15', () => [zaino.livello(), 15]],
  ['livello30', 'esperienza', 'livello', 'mito vivente', 'arriva al livello 30', () => [zaino.livello(), 30]],
  ['comandi500', 'chat', 'bot', 'amico del bot', 'scrivi 500 comandi al bot', () => [s('comandi'), 500]],
  ['lavoro200', 'chat', 'rider', 'schiavo del sistema', 'fai 200 turni di lavoro', () => [s('turniLavoro'), 200]],
  ['pesca200', 'chat', 'canna', 'il Mincio è casa mia', 'pesca 200 volte', () => [s('pescati'), 200]],
  ['caccia200', 'chat', 'fionda', 'incubo delle nutrie', 'caccia 200 volte', () => [s('cacciati'), 200]],
  ['scavo200', 'chat', 'pala', 'talpa umana', 'scava 200 volte', () => [s('scavati'), 200]],
  ['morte50', 'chat', 'teschio', 'abitué del purgatorio', 'muori 50 volte', () => [s('morti'), 50]],
  ['mani500', 'giochi', 'carte', 'habitué del tavolo', 'gioca 500 mani ai giochi grandi', () => [s('giri'), 500]],
  ['mani2000', 'giochi', 'dadi', 'il banco ringrazia', 'gioca 2.000 mani ai giochi grandi', () => [s('giri'), 2000]],
  ['colpo5000', 'giochi', 'sette', 'jackpot', 'vinci 5.000 $pzk in una mano sola', () => [Math.max(0, ...giochi().map((g) => g[4])), 5000]],
  ['quiz200', 'cervello', 'quiz', 'enciclopedia ambulante', 'rispondi giusto a 200 quiz', () => [s('quizGiusti'), 200]],
  ['quiz500', 'cervello', 'quiz', 'Quark in persona', 'rispondi giusto a 500 quiz', () => [s('quizGiusti'), 500]],
  ['quizcurioso', 'cervello', 'quiz', 'curioso', 'rispondi a 100 domande dei quiz (giuste o no)', () => [s('quizTotali'), 100]],
  ['quizserie', 'cervello', 'fuoco', 'a raffica', 'indovina 8 quiz di fila', () => [zaino.quizStato().migliore ?? 0, 8]],
  ['serie30', 'cervello', 'fuoco', 'puntuale come le tasse', 'prendi il premio giornaliero 30 giorni di fila', () => [zaino.serie('giornaliero').n, 30]],
  ['sfide100', 'cervello', 'fulmine', 'sfida infinita', 'completa 100 sfide giornaliere', () => [s('sfideFatte'), 100]],
  ['quest10', 'cervello', 'chiave-vecchia', 'cavaliere del Mincio', 'completa 10 side quest', () => [s('missioniFatte'), 10]],
  ['quest13', 'cervello', 'chiave-vecchia', 'ogni bivio è mio', 'completa tutte le side quest', () => [s('missioniFatte'), 13]],
  ['facce20', 'profilo', 'app-profilo', 'camerino dei travestimenti', 'abbi 20 facce del profilo', () => [5 + (zaino.profilo().avs ?? []).length, 20]],
  ['motto', 'profilo', 'telefono', 'filosofo', 'scrivi il tuo motto nel profilo', () => [zaino.profilo().mot ? 1 : 0, 1]],
]
export const GRUPPI = { banca: 'la banca', esperienza: 'l’esperienza', chat: 'la chat col bot', giochi: 'i giochi', cervello: 'testa e costanza', cucina: 'la cucina', profilo: 'il profilo' }

export function tutti() {
  return LISTA.map(([id, gruppo, icona, nome, cosa, punto]) => {
    let [n, di] = punto()
    n = Math.max(0, Math.min(di, Math.floor(n ?? 0)))
    return { id, gruppo, icona, nome, cosa, n, di, fatto: n >= di }
  })
}
