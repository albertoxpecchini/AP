// Le sfide giornaliere (23.10): ogni giorno (di Mantova) tre sfide, una facile, una media, una difficile, fatte con quello
// che il giocatore sa fare (niente «pesca 10 volte» a chi non ha la canna). Si misurano con le statistiche dello zaino
// (pescati, guadagnati, comandi…): all'inizio del giorno si fotografano i numeri, il progresso è la differenza. Chi le
// riscuote tutte e tre prende il bonus del giorno (e una cassa), e la serie dei giorni di fila lo fa crescere (+10 % al
// giorno, fino a 7). Il pzkkonet (oggetto) aggiunge il 10 % ai premi. Lo stato sta nello zaino (zaino.sfideStato).
// Lo usano il comando «sfide» della chat e l'app Sfide del telefono.
//
// DAL 31.10 LE DECIDE LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-sfide.mjs sul server di Alberto): la
// scelta del giorno, la fotografia dei numeri, i premi, il bonus e la serie. Qui restano le parole e la vista: oggi() legge
// la copia dello zaino che la banca manda, e se il giorno non c'è ancora chiede alla banca di prepararlo ('sfide.oggi');
// riscuoti e riscuotiBonus sono azioni della banca (pzk.fai), e il premio arriva col conto nuovo.

import * as zaino from './zaino.js'
import * as pzk from '../games/pzk.js'
import { giornoDi } from './mercato.js'

const g = (n) => n.toLocaleString('it-IT')
/** I modelli di sfida: la statistica che si misura, i tre traguardi (facile, media, difficile), come si dice. Quando c'è lo sa la banca. */
export const MODELLI = [
  { id: 'pesca', stat: 'pescati', icona: 'canna', obiettivi: [3, 6, 10], testo: (n) => `pesca ${n} ${n === 1 ? 'pesce' : 'pesci'} nel Mincio` },
  { id: 'caccia', stat: 'cacciati', icona: 'fionda', obiettivi: [2, 5, 8], testo: (n) => `caccia ${n} bestie` },
  { id: 'scava', stat: 'scavati', icona: 'pala', obiettivi: [2, 5, 8], testo: (n) => `scava ${n} volte` },
  { id: 'comandi', stat: 'comandi', icona: 'telefono', obiettivi: [8, 16, 30], testo: (n) => `scrivi ${n} comandi al bot` },
  { id: 'guadagna', stat: 'guadagnati', icona: 'pzk', obiettivi: [200, 600, 1500], testo: (n) => `guadagna ${g(n)} $pzk` },
  { id: 'vinci', stat: 'vinti', icona: 'sette', obiettivi: [60, 250, 800], testo: (n) => `vinci ${g(n)} $pzk ai giochi` },
  { id: 'compra', stat: 'acquisti', icona: 'sacco', obiettivi: [1, 2, 4], testo: (n) => `compra ${n} ${n === 1 ? 'pezzo' : 'pezzi'} allo shop` },
  { id: 'quiz', stat: 'quizGiusti', icona: 'quiz', obiettivi: [2, 5, 8], testo: (n) => `rispondi giusto a ${n} domande dei quiz` },
  { id: 'lavora', stat: 'turniLavoro', icona: 'rider', obiettivi: [1, 2, 4], testo: (n) => `fai ${n} ${n === 1 ? 'turno' : 'turni'} di lavoro` },
  { id: 'missione', stat: 'passiMissione', icona: 'chiave-vecchia', obiettivi: [1, 3, 5], testo: (n) => `fai ${n} ${n === 1 ? 'passo' : 'passi'} in una side quest` },
]
const PER_MODELLO = Object.fromEntries(MODELLI.map((m) => [m.id, m]))
/** I premi per difficoltà (prima del moltiplicatore): $pzk e xp. (Quelli che contano li ha la banca: sono gli stessi.) */
export const PREMI = [{ pzk: 150, xp: 15 }, { pzk: 320, xp: 35 }, { pzk: 650, xp: 70 }]
export const NOMI_DIFF = ['facile', 'media', 'difficile']
export const BONUS_GIORNO = { pzk: 500, cassa: 'cassa-comune' }
const SERIE_MAX = 7

const ieri = (giorno) => giornoDi(new Date(`${giorno}T12:00:00+01:00`).getTime() - 24 * 3600_000)

// il giorno nuovo lo prepara la banca: una richiesta sola per giorno (oggi() si chiama a ogni disegno)
let chiesto = ''
function prepara(oggi) {
  if (chiesto === oggi) return
  // prima della prima risposta della banca l'ospite non ha ancora il biglietto: chiedere adesso torna 401 («entra di
  // nuovo») a ogni visita nuova (trovato dal bot dei bug, 6.11). Si chiede al disegno dopo, quando lo zaino è arrivato
  if (pzk.ospite() && pzk.zainoBanca() === null) return
  chiesto = oggi
  pzk.fai('sfide.oggi').then((d) => { if (!d?.ok) chiesto = '' }).catch(() => { chiesto = '' }) // (riprova al prossimo disegno; quando arriva, zaino.ascolta ridisegna)
}

/** Le sfide di oggi, con il progresso. → { giorno, sfide: [{ id, diff, nome, icona, testo, target, fatto, premio, pronta, riscossa }], tutte, bonusPronto, bonusRiscosso, serie }
 *  (Finché la banca non ha preparato il giorno: nessuna sfida, e niente da riscuotere.) */
export function oggi() {
  const giorno = giornoDi(), s = zaino.sfideStato()
  if (s?.g !== giorno || !Array.isArray(s.sfide)) {
    prepara(giorno)
    const n = s?.serie && (s.serie.ultimo === giorno || s.serie.ultimo === ieri(giorno)) ? s.serie.n : 0
    return { giorno, sfide: [], tutte: false, bonusPronto: false, bonusRiscosso: false, serie: n, serieOggi: false, bonusGiorno: Math.round(BONUS_GIORNO.pzk * (1 + 0.1 * (Math.min(SERIE_MAX, n + 1) - 1))) }
  }
  const bonusSfide = 1 + zaino.bonus('sfide')
  const lista = s.sfide.filter((x) => PER_MODELLO[x.id]).map((x) => {
    const m = PER_MODELLO[x.id]
    const fatto = Math.max(0, zaino.stat(m.stat) - (s.base?.[m.stat] ?? 0))
    const riscossa = s.riscosse.includes(x.id)
    return { id: x.id, diff: x.diff, nome: NOMI_DIFF[x.diff], icona: m.icona, testo: m.testo(x.target), target: x.target, fatto: Math.min(fatto, x.target), pronta: !riscossa && fatto >= x.target, riscossa,
      premio: { pzk: Math.round(PREMI[x.diff].pzk * zaino.moltiplicatore() * bonusSfide), xp: PREMI[x.diff].xp } }
  })
  const tutte = lista.length > 0 && lista.every((x) => x.riscossa)
  return { giorno: s.g, sfide: lista, tutte, bonusPronto: tutte && !s.bonus, bonusRiscosso: s.bonus, serie: s.serie.ultimo === s.g || s.serie.ultimo === ieri(s.g) ? s.serie.n : 0, serieOggi: s.serie.ultimo === s.g,
    bonusGiorno: Math.round(BONUS_GIORNO.pzk * (1 + 0.1 * (Math.min(SERIE_MAX, (s.serie.ultimo === ieri(s.g) ? s.serie.n : 0) + 1) - 1))) }
}

const esito = (d) => (d?.ok ? { ok: true, ...d.esito } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' })
/** Riscuote una sfida finita (la banca controlla e paga). → Promise<{ ok, pzk, xp, livello } | { ok: false, errore }> */
export const riscuoti = (id) => pzk.fai('sfide.riscuoti', { id }).then(esito)
/** Riscuote il bonus del giorno (le tre sfide fatte): $pzk, una cassa, e la serie di giorni di fila. → Promise<{ ok, pzk, cassa, serie }> */
export const riscuotiBonus = () => pzk.fai('sfide.bonus').then(esito)

/** Quante sfide riscuotibili ci sono adesso (per il pallino rosso sull'icona). */
export const daRiscuotere = () => { const o = oggi(); return o.sfide.filter((x) => x.pronta).length + (o.bonusPronto ? 1 : 0) }
/** Quante ne mancano ancora da fare oggi. */
export const rimaste = () => { const o = oggi(); return o.sfide.length ? o.sfide.filter((x) => !x.riscossa).length : 3 }
