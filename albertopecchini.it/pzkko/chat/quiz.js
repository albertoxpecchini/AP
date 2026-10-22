// I quiz retributivi (23.10): il motore, senza interfaccia (la usano il comando «quiz» della chat e l'app Quiz del telefono).
// Una PARTITA è di 8 domande su un argomento (quiz-dati.js), più due argomenti speciali: «foto» (che cos'è nella foto?, dalle
// immagini di immagini.js) e «giocatori» (domande fatte coi dati veri del database: chi ha più $pzk, chi è di livello più
// alto…). Ogni risposta GIUSTA PAGA: 20, 40 o 80 $pzk per difficoltà, fino al +50 % se si risponde in fretta, +10 % per ogni
// risposta giusta di fila (fino a +50 %); una partita perfetta aggiunge 100 $pzk. I premi passano dal mercato.incassa (livello
// e bonus). Per non regalare soldi all'infinito pagano solo le prime 40 risposte giuste di ogni giorno: dopo, il quiz resta un
// allenamento (punti esperienza, niente $pzk). Le ultime domande fatte si ricordano (zaino.quizStato.visti) per non ripeterle.

import * as zaino from './zaino.js'
import { giornoDi, incassa } from './mercato.js'
import { DOMANDE, ARGOMENTI } from './quiz-dati.js'
import { QUIZ as VECCHIE } from './testi.js'
import { IMMAGINI, src, credito } from './immagini.js'
import * as db from './db.js'

export const PER_PARTITA = 8
export const TEMPO = 15 // secondi per domanda
export const PAGATE_AL_GIORNO = 40
export const PAGA = [0, 20, 40, 80]
export const BONUS_PERFETTA = 100

/** Gli argomenti: i fissi, «vario» (le vecchie domande della chat), «foto» e «giocatori». id → [nome, icona]. */
export const TUTTI_ARGOMENTI = [...ARGOMENTI, ['foto', 'foto', 'quiz'], ['giocatori', 'giocatori', 'trofeo'], ['vario', 'a caso', 'dado']]

const mescola = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const caso = (a) => a[Math.floor(Math.random() * a.length)]

/** Una domanda pronta: { id, q, risposte: [4 testi], giusta: indice, diff, img?, credito?, nota? }. */
function pronta(id, q, risposte, diff, extra = {}) {
  const ord = mescola(risposte.map((t, i) => [t, i === 0]))
  return { id, q, risposte: ord.map(([t]) => t), giusta: ord.findIndex(([, g]) => g), diff, ...extra }
}
const daDati = ([arg, q, r, d, nota], i) => pronta(`${arg}:${i}`, q, r, d, { arg, nota })
const BANCA = DOMANDE.map(daDati)
const VARIE = VECCHIE.map(([q, r, d], i) => pronta(`vario:${i}`, q, r, d, { arg: 'vario' }))

/** Le domande «che cos'è nella foto?» dalle immagini. */
function domandeFoto() {
  const ids = Object.keys(IMMAGINI)
  return ids.map((id) => {
    const altri = mescola(ids.filter((x) => x !== id)).slice(0, 3).map((x) => IMMAGINI[x].cosa)
    return pronta(`foto:${id}`, 'Che cos’è nella foto?', [IMMAGINI[id].cosa, ...altri], 2, { arg: 'foto', img: src(id), credito: credito(id), nota: `era ${IMMAGINI[id].cosa}.` })
  })
}

/** Le domande fatte col database dei giocatori (se ce ne sono abbastanza): chi ha più…, a che livello è…, che titolo ha… */
async function domandeGiocatori() {
  const fuori = []
  const metriche = [['pzk', 'più $pzk', (v) => `${Number(v).toLocaleString('it-IT')} $pzk`], ['xp', 'più esperienza', (v) => `${v} xp`], ['pescati', 'pescato più pesci', (v) => `${v} pesci`], ['quiz', 'indovinato più quiz', (v) => `${v} risposte giuste`]]
  for (const [m, frase, fmt] of metriche) {
    const d = await db.top(m, 12)
    const t = d.ok ? d.top : []
    if (t.length < 3) continue
    const [primo, ...resto] = t
    const sbagliati = mescola(resto).slice(0, 3)
    if (sbagliati.length < 3) continue
    fuori.push(pronta(`giocatori:${m}`, `Chi, fra questi giocatori, ha ${frase}?`, [primo.nome, ...sbagliati.map((x) => x.nome)], 2, { arg: 'giocatori', nota: `${primo.nome}, con ${fmt(primo.valore)}.` }))
  }
  const d = await db.top('liv', 12)
  if (d.ok && d.top.length >= 4) {
    const x = caso(d.top)
    const vicini = new Set([x.liv]); const risp = [String(x.liv)]
    for (const k of [1, 2, -1, 3, -2, 4]) { const v = Math.max(1, x.liv + k); if (!vicini.has(v) && risp.length < 4) { vicini.add(v); risp.push(String(v)) } }
    if (risp.length === 4) fuori.push(pronta(`giocatori:liv:${x.nome}`, `A che livello è ${x.nome}?`, risp, 3, { arg: 'giocatori', nota: `${x.nome} è al livello ${x.liv}${x.titolo ? `: «${x.titolo}»` : ''}.` }))
  }
  return fuori
}

const livelloVisti = () => zaino.quizStato().visti ?? []
/** Prepara una partita: n domande dell'argomento (o di tutti), pochi ripetuti, dalle facili alle difficili. → { arg, domande, i, giuste, serie, pagate, guadagnato, finita } */
export async function nuova(arg = null, n = PER_PARTITA) {
  let pool
  if (arg === 'foto') pool = domandeFoto()
  else if (arg === 'giocatori') pool = await domandeGiocatori()
  else if (arg === 'vario') pool = VARIE
  else if (arg && BANCA.some((d) => d.arg === arg)) pool = BANCA.filter((d) => d.arg === arg)
  else pool = [...BANCA, ...domandeFoto()]
  if (!pool.length) return null
  const visti = new Set(livelloVisti())
  const nuove = mescola(pool.filter((d) => !visti.has(d.id)))
  const vecchie = mescola(pool.filter((d) => visti.has(d.id)))
  const scelte = [...nuove, ...vecchie].slice(0, Math.min(n, pool.length)).sort((a, b) => a.diff - b.diff)
  return { arg: arg ?? 'tutti', domande: scelte, i: 0, giuste: 0, serie: 0, guadagnato: 0, xp: 0, pagate: 0, finita: false }
}

/** Le risposte pagate che restano oggi. */
export function restanti() {
  const q = zaino.quizStato()
  return q.g === giornoDi() ? Math.max(0, PAGATE_AL_GIORNO - (q.pagati ?? 0)) : PAGATE_AL_GIORNO
}

/** Risponde alla domanda corrente: scelta = indice della risposta (null: tempo scaduto), restoMs = quanto tempo avanzava.
 *  → { giusta, indiceGiusto, premio, xp, livello, pagato, serie, perfetta?, bonus? } e la partita avanza. */
export function rispondi(p, scelta, restoMs = 0) {
  const d = p.domande[p.i]
  const giusta = scelta === d.giusta
  zaino.conta('quizTotali')
  const stato = { ...zaino.quizStato() }
  if (stato.g !== giornoDi()) { stato.g = giornoDi(); stato.pagati = 0 }
  stato.visti = [d.id, ...(stato.visti ?? []).filter((x) => x !== d.id)].slice(0, 60)
  const r = { giusta, indiceGiusto: d.giusta, premio: 0, xp: 0, livello: 0, pagato: false, nota: d.nota }
  if (giusta) {
    zaino.conta('quizGiusti')
    p.giuste++; p.serie++
    stato.serie = (stato.serie ?? 0) + 1
    stato.migliore = Math.max(stato.migliore ?? 0, p.serie)
    const veloce = 1 + 0.5 * Math.max(0, Math.min(1, restoMs / (TEMPO * 1000)))
    const serie = 1 + 0.1 * Math.min(5, p.serie - 1)
    r.xp = 4 * d.diff
    if ((stato.pagati ?? 0) < PAGATE_AL_GIORNO) { stato.pagati = (stato.pagati ?? 0) + 1; r.pagato = true; r.premio = incassa(PAGA[d.diff] * veloce * serie); p.pagate++ }
    r.livello = zaino.daiXp(r.xp)
  } else { p.serie = 0; stato.serie = 0 }
  p.guadagnato += r.premio; p.xp += r.xp
  p.i++
  if (p.i >= p.domande.length) {
    p.finita = true
    if (p.giuste === p.domande.length && p.domande.length >= 5 && p.pagate > 0) { r.bonus = incassa(BONUS_PERFETTA); p.guadagnato += r.bonus; r.perfetta = true; zaino.daiXp(20) }
  }
  r.serie = p.serie
  zaino.salvaQuiz(stato)
  return r
}

/** Quante partite perfette / il record di serie, per il profilo. */
export const record = () => zaino.quizStato().migliore ?? 0
