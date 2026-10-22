// Le sfide giornaliere (23.10): ogni giorno (di Mantova) tre sfide, una facile, una media, una difficile, fatte con quello
// che il giocatore sa fare (niente «pesca 10 volte» a chi non ha la canna). Si misurano con le statistiche dello zaino
// (pescati, guadagnati, comandi…): all'inizio del giorno si fotografano i numeri, il progresso è la differenza. Chi le
// riscuote tutte e tre prende il bonus del giorno (e una cassa), e la serie dei giorni di fila lo fa crescere (+10 % al
// giorno, fino a 7). Il pzkkonet (oggetto) aggiunge il 10 % ai premi. Lo stato sta nello zaino (zaino.sfideStato).
// Lo usano il comando «sfide» della chat e l'app Sfide del telefono.

import * as zaino from './zaino.js'
import { conSeme, giornoDi, incassa } from './mercato.js'

const g = (n) => n.toLocaleString('it-IT')
/** I modelli di sfida: la statistica che si misura, i tre traguardi (facile, media, difficile), come si dice, quando c'è. */
export const MODELLI = [
  { id: 'pesca', stat: 'pescati', icona: 'canna', obiettivi: [3, 6, 10], testo: (n) => `pesca ${n} ${n === 1 ? 'pesce' : 'pesci'} nel Mincio`, c: () => zaino.ha('canna') },
  { id: 'caccia', stat: 'cacciati', icona: 'fionda', obiettivi: [2, 5, 8], testo: (n) => `caccia ${n} bestie`, c: () => zaino.ha('fionda') || zaino.ha('fucile') },
  { id: 'scava', stat: 'scavati', icona: 'pala', obiettivi: [2, 5, 8], testo: (n) => `scava ${n} volte`, c: () => zaino.ha('pala') },
  { id: 'comandi', stat: 'comandi', icona: 'telefono', obiettivi: [8, 16, 30], testo: (n) => `scrivi ${n} comandi al bot`, c: () => true },
  { id: 'guadagna', stat: 'guadagnati', icona: 'pzk', obiettivi: [200, 600, 1500], testo: (n) => `guadagna ${g(n)} $pzk`, c: () => true },
  { id: 'vinci', stat: 'vinti', icona: 'sette', obiettivi: [60, 250, 800], testo: (n) => `vinci ${g(n)} $pzk ai giochi`, c: () => zaino.livello() >= 2 || zaino.stat('vinti') > 0 },
  { id: 'compra', stat: 'acquisti', icona: 'sacco', obiettivi: [1, 2, 4], testo: (n) => `compra ${n} ${n === 1 ? 'pezzo' : 'pezzi'} allo shop`, c: () => true },
  { id: 'quiz', stat: 'quizGiusti', icona: 'quiz', obiettivi: [2, 5, 8], testo: (n) => `rispondi giusto a ${n} domande dei quiz`, c: () => true },
  { id: 'lavora', stat: 'turniLavoro', icona: 'rider', obiettivi: [1, 2, 4], testo: (n) => `fai ${n} ${n === 1 ? 'turno' : 'turni'} di lavoro`, c: () => !!zaino.mestiere() },
  { id: 'missione', stat: 'passiMissione', icona: 'chiave-vecchia', obiettivi: [1, 3, 5], testo: (n) => `fai ${n} ${n === 1 ? 'passo' : 'passi'} in una side quest`, c: () => true },
]
const PER_MODELLO = Object.fromEntries(MODELLI.map((m) => [m.id, m]))
/** I premi per difficoltà (prima del moltiplicatore): $pzk e xp. */
export const PREMI = [{ pzk: 150, xp: 15 }, { pzk: 320, xp: 35 }, { pzk: 650, xp: 70 }]
export const NOMI_DIFF = ['facile', 'media', 'difficile']
export const BONUS_GIORNO = { pzk: 500, cassa: 'cassa-comune' }
const SERIE_MAX = 7

const ieri = (giorno) => giornoDi(new Date(`${giorno}T12:00:00+01:00`).getTime() - 24 * 3600_000)

/** Lo stato di oggi: se è un giorno nuovo, sceglie le tre sfide e fotografa i numeri. */
function stato() {
  const oggi = giornoDi()
  const s = zaino.sfideStato()
  if (s?.g === oggi) return s
  const r = conSeme(`sfide-${oggi}-${zaino.livello()}`)
  const adatti = MODELLI.filter((m) => m.c())
  const scelti = []
  for (let diff = 0; diff < 3; diff++) {
    const libere = adatti.filter((m) => !scelti.some((x) => x.id === m.id))
    const m = libere[Math.floor(r() * libere.length)] ?? MODELLI[3]
    const soldi = m.stat === 'guadagnati' || m.stat === 'vinti' // i traguardi in $pzk crescono col livello (+10 % per livello), arrotondati a 10
    scelti.push({ id: m.id, diff, target: soldi ? Math.round((m.obiettivi[diff] * (1 + (zaino.livello() - 1) * 0.1)) / 10) * 10 : m.obiettivi[diff] })
  }
  const nuovo = { g: oggi, sfide: scelti, base: Object.fromEntries(scelti.map((x) => [PER_MODELLO[x.id].stat, zaino.stat(PER_MODELLO[x.id].stat)])), riscosse: [], bonus: false, serie: s?.serie ?? { ultimo: '', n: 0 } }
  zaino.salvaSfide(nuovo)
  return nuovo
}

/** Le sfide di oggi, con il progresso. → { giorno, sfide: [{ id, diff, nome, icona, testo, target, fatto, premio, pronta, riscossa }], tutte, bonusPronto, bonusRiscosso, serie } */
export function oggi() {
  const s = stato()
  const bonusSfide = 1 + zaino.bonus('sfide')
  const lista = s.sfide.map((x) => {
    const m = PER_MODELLO[x.id]
    const fatto = Math.max(0, zaino.stat(m.stat) - (s.base[m.stat] ?? 0))
    const riscossa = s.riscosse.includes(x.id)
    return { id: x.id, diff: x.diff, nome: NOMI_DIFF[x.diff], icona: m.icona, testo: m.testo(x.target), target: x.target, fatto: Math.min(fatto, x.target), pronta: !riscossa && fatto >= x.target, riscossa,
      premio: { pzk: Math.round(PREMI[x.diff].pzk * zaino.moltiplicatore() * bonusSfide), xp: PREMI[x.diff].xp } }
  })
  const tutte = lista.every((x) => x.riscossa)
  return { giorno: s.g, sfide: lista, tutte, bonusPronto: tutte && !s.bonus, bonusRiscosso: s.bonus, serie: s.serie.ultimo === s.g || s.serie.ultimo === ieri(s.g) ? s.serie.n : 0, serieOggi: s.serie.ultimo === s.g,
    bonusGiorno: Math.round(BONUS_GIORNO.pzk * (1 + 0.1 * (Math.min(SERIE_MAX, (s.serie.ultimo === ieri(s.g) ? s.serie.n : 0) + 1) - 1))) }
}

/** Riscuote una sfida finita. → { ok, pzk, xp, livello } oppure { ok: false, errore } */
export function riscuoti(id) {
  const o = oggi()
  const x = o.sfide.find((s) => s.id === id)
  if (!x) return { ok: false, errore: 'questa sfida non c’è oggi' }
  if (x.riscossa) return { ok: false, errore: 'già riscossa' }
  if (!x.pronta) return { ok: false, errore: `mancano ancora ${x.target - x.fatto}` }
  const s = { ...zaino.sfideStato(), riscosse: [...zaino.sfideStato().riscosse, id] }
  zaino.salvaSfide(s)
  const pzk = incassa(PREMI[x.diff].pzk, { sfide: true })
  const livello = zaino.daiXp(x.premio.xp)
  zaino.conta('sfideFatte')
  return { ok: true, pzk, xp: x.premio.xp, livello }
}

/** Riscuote il bonus del giorno (le tre sfide fatte): $pzk, una cassa, e la serie di giorni di fila. */
export function riscuotiBonus() {
  const o = oggi()
  if (!o.bonusPronto) return { ok: false, errore: o.bonusRiscosso ? 'il bonus di oggi l’hai già preso' : 'prima le tre sfide' }
  const s = zaino.sfideStato()
  const n = s.serie.ultimo === ieri(s.g) ? Math.min(SERIE_MAX, s.serie.n + 1) : 1
  zaino.salvaSfide({ ...s, bonus: true, serie: { ultimo: s.g, n } })
  const pzk = incassa(500 * (1 + 0.1 * (n - 1)), { sfide: true })
  zaino.aggiungi(BONUS_GIORNO.cassa)
  return { ok: true, pzk, cassa: BONUS_GIORNO.cassa, serie: n }
}

/** Quante sfide riscuotibili ci sono adesso (per il pallino rosso sull'icona). */
export const daRiscuotere = () => { const o = oggi(); return o.sfide.filter((x) => x.pronta).length + (o.bonusPronto ? 1 : 0) }
/** Quante ne mancano ancora da fare oggi. */
export const rimaste = () => oggi().sfide.filter((x) => !x.riscossa).length
