// I quiz retributivi (23.10): il motore, senza interfaccia (la usano il comando «quiz» della chat e l'app Quiz del telefono).
// Una PARTITA è di 8 domande su un argomento, più due argomenti speciali: «foto» (che cos'è nella foto?) e «giocatori»
// (domande fatte coi dati veri del database: chi ha più $pzk, chi è di livello più alto…). Ogni risposta GIUSTA PAGA: 20, 40
// o 80 $pzk per difficoltà, fino al +50 % se si risponde in fretta, +10 % per ogni risposta giusta di fila (fino a +50 %);
// una partita perfetta aggiunge 100 $pzk. Pagano solo le prime 40 risposte giuste di ogni giorno: dopo, il quiz resta un
// allenamento (punti esperienza, niente $pzk). Le ultime domande fatte si ricordano (zaino.quizStato.visti).
//
// DAL 31.10 IL QUIZ LO FA LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-quiz.mjs sul server di Alberto).
// Prima questo file aveva tutte le domande con la risposta giusta, misurava il tempo da sé e si pagava: bastava la console.
// Ora le domande e le risposte giuste stanno solo sulla banca, che ne manda una alla volta SENZA la giusta (le risposte già
// mescolate); qui si risponde con l'indice, e la banca dice se era giusta, quanto paga (col bonus di velocità misurato con
// la sua ora: il tempo parte quando la domanda si apre, 'quiz.prossima') e com'è la partita. Restano qui solo i nomi degli
// argomenti e i numeri delle regole, per scriverle.
//   const p = await nuova(arg)          // la partita: { arg, n, i, d: null, giuste, serie, guadagnato, xp, pagate, finita } o { errore }
//   await prossima(p)                   // apre la domanda p.i: p.d = { q, risposte, diff, vf?, img?, credito? }
//   const r = await rispondi(p, i)      // i: l'indice, null se il tempo è scaduto → { giusta, indiceGiusto, premio, xp, … } o { errore }

import * as zaino from './zaino.js'
import * as pzk from '../games/pzk.js'
import { giornoDi } from './mercato.js'
import { ARGOMENTI } from './quiz-dati.js'
import { ARGOMENTI_NUOVI } from './quiz-altre.js'

export const PER_PARTITA = 8
export const TEMPO = 15 // secondi per domanda
export const PAGATE_AL_GIORNO = 40
export const PAGA = [0, 20, 40, 80]
export const BONUS_PERFETTA = 100

/** Gli argomenti: i fissi, «vario» (le vecchie domande della chat), «foto» e «giocatori». id → [nome, icona]. */
export const TUTTI_ARGOMENTI = [...ARGOMENTI, ...ARGOMENTI_NUOVI, ['foto', 'foto', 'quiz'], ['giocatori', 'giocatori', 'trofeo'], ['vario', 'a caso', 'dado']]

/** La partita come la manda la banca, nei campi della partita di qui. */
const prendi = (p, v) => { if (v) Object.assign(p, { arg: v.arg, n: v.n, i: v.i, giuste: v.giuste, serie: v.serie, guadagnato: v.guadagnato, xp: v.xp, pagate: v.pagate }); return p }

/** Prepara una partita sulla banca: n domande dell'argomento (o di tutti), pochi ripetuti, dalle facili alle difficili.
 *  → { arg, n, i, d, giuste, serie, guadagnato, xp, pagate, finita } oppure { errore } (niente domande, niente rete, niente conto) */
export async function nuova(arg = null) {
  const r = await pzk.fai('quiz.nuova', { arg: arg || null })
  if (!r?.ok) return { errore: r?.errore ?? 'la banca non risponde: riprova' }
  return prendi({ d: null, finita: false, bonus: 0 }, r.esito.partita)
}

/** Apre la domanda di adesso (la prima, o quella dopo l'esito): il tempo della banca parte qui. → true, o { errore } */
export async function prossima(p) {
  const r = await pzk.fai('quiz.prossima')
  if (!r?.ok || !r.esito.partita?.d) return { errore: r?.errore ?? 'la banca non risponde: riprova' }
  prendi(p, r.esito.partita)
  p.d = r.esito.partita.d
  return true
}

/** Le risposte pagate che restano oggi (dalla copia dello zaino della banca). */
export function restanti() {
  const q = zaino.quizStato()
  return q.g === giornoDi() ? Math.max(0, PAGATE_AL_GIORNO - (q.pagati ?? 0)) : PAGATE_AL_GIORNO
}

/** Risponde alla domanda aperta: scelta = indice della risposta (null: tempo scaduto). La banca controlla, misura e paga.
 *  → { giusta, indiceGiusto, premio, xp, livello, pagato, serie, nota, perfetta?, bonus? } (e la partita avanza), o { errore } */
export async function rispondi(p, scelta) {
  const r = await pzk.fai('quiz.rispondi', { i: scelta === null || scelta === undefined ? null : Number(scelta) })
  if (!r?.ok) return { errore: r?.errore ?? 'la banca non risponde: riprova' }
  const e = r.esito
  prendi(p, e.partita)
  p.finita = !!e.finita
  if (e.bonus) p.bonus = e.bonus
  return e
}

/** Il record di serie, per il profilo. */
export const record = () => zaino.quizStato().migliore ?? 0
