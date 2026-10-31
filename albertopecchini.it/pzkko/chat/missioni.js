// Il motore delle side quest (23.10): le storie sono in missioni-dati.js, qui si gioca. Lo stato sta nello zaino
// (zaino.missioniStato: { attive: { id: { nodo, flags } }, fatte: { id: ts } }). Una missione si comincia se si ha il livello e
// gli oggetti che chiede (alcuni si consumano), si va avanti scegliendo, e al nodo finale si prende il premio (una volta).
// Lo usano il comando «missioni» della chat e l'app Missioni del telefono. Niente interfaccia qui: tutto torna come dati.
//
// DAL 31.10 LE GIOCA LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-missioni.mjs sul server di Alberto):
// cominciare, scegliere e abbandonare sono azioni della banca, che controlla il livello, gli oggetti, il cibo e i $pzk, tira
// il caso e paga il premio. Qui restano le storie (per scriverle) e la vista: cosa si vede, cosa manca, perché una scelta è
// spenta. Lo stato è la copia dello zaino che la banca manda con la risposta.

import * as zaino from './zaino.js'
import * as pzk from '../games/pzk.js'
import { MISSIONI, PER_ID } from './missioni-dati.js'
import { nomeDi } from './testi.js'

/** Cosa manca per cominciare una missione: [] se niente. */
export function manca(m) {
  const r = []
  if (zaino.livello() < (m.liv ?? 1)) r.push(`livello ${m.liv}`)
  for (const o of m.richiede ?? []) if (!zaino.ha(o)) r.push(nomeDi(o))
  return r
}

/** Tutte le missioni con il loro stato: 'fatta' | 'in corso' | 'pronta' | 'bloccata'. */
export function elenco() {
  const q = zaino.missioniStato()
  return MISSIONI.map((m) => ({ ...m, stato: q.fatte[m.id] ? 'fatta' : q.attive[m.id] ? 'in corso' : manca(m).length ? 'bloccata' : 'pronta', manca: manca(m), fattaIl: q.fatte[m.id] ?? 0 }))
}
export const inCorso = () => elenco().filter((m) => m.stato === 'in corso')
/** Quante missioni si possono cominciare adesso (per il pallino sull'icona). */
export const pronte = () => elenco().filter((m) => m.stato === 'pronta').length

/** Il nodo di una missione come lo vede chi gioca: testo, scelte (con perché non si può, se non si può), fine. */
export function vista(id) {
  const m = PER_ID[id]
  const q = zaino.missioniStato()
  if (!m) return null
  if (q.fatte[id]) return { m, fatta: true, t: m.nodi[Object.keys(m.nodi).find((k) => m.nodi[k].fine)]?.t ?? '', scelte: [] }
  const a = q.attive[id]
  if (!a || !m.nodi[a.nodo]) return { m, nonIniziata: true, t: m.breve, manca: manca(m), scelte: [] }
  const nodo = m.nodi[a.nodo]
  const scelte = (nodo.scelte ?? []).map((s, i) => {
    if (s.se && !s.se.every((f) => a.flags.includes(f))) return null
    if (s.non && a.flags.includes(s.non)) return null
    let motivo = null
    if (s.richiede && !zaino.ha(s.richiede)) motivo = `ti serve ${nomeDi(s.richiede)}`
    else if (s.uno && !s.uno.some((o) => zaino.ha(o))) motivo = `ti serve del cibo (${s.uno.slice(0, 3).map(nomeDi).join(', ')}…)`
    else if (s.costo && pzk.puliti() < s.costo) motivo = `costa ${s.costo} $pzk`
    return { i, eti: s.eti, ok: !motivo, motivo, costo: s.costo ?? 0, azzardo: s.caso ? Math.round(s.caso.p * 100) : 0 }
  }).filter(Boolean)
  return { m, t: nodo.t, scelte, passi: a.passi ?? 0, flags: a.flags }
}

const errore = (d) => ({ ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' })

/** Comincia una missione (la banca controlla e consuma). → Promise<{ ok, gia? } | { ok: false, errore }> */
export async function inizia(id) {
  const m = PER_ID[id]
  if (!m) return { ok: false, errore: 'non c’è questa missione' }
  const mm = manca(m) // (detto prima con i nomi; la banca lo ricontrolla)
  if (mm.length && !zaino.missioniStato().attive[id]) return { ok: false, errore: `ti manca: ${mm.join(', ')}` }
  const d = await pzk.fai('missioni.inizia', { id })
  return d?.ok ? { ok: true, gia: !!d.esito.gia } : errore(d)
}

/** Abbandona una missione in corso (si può ricominciare da capo: gli oggetti consumati non tornano). → Promise<{ ok }> */
export async function abbandona(id) {
  const d = await pzk.fai('missioni.abbandona', { id })
  return d?.ok ? { ok: true } : errore(d)
}

/** Fa una scelta (la banca la gioca). → Promise<{ ok, vista, esito: { perso, speso, caso: 'ok'|'ko'|null, fine?, premio?, livello? } } | { ok: false, errore }> */
export async function scegli(id, i) {
  const m = PER_ID[id]
  const v = m && vista(id)?.scelte.find((x) => x.i === i)
  if (!v) return { ok: false, errore: 'scelta non valida' }
  if (!v.ok) return { ok: false, errore: v.motivo }
  const d = await pzk.fai('missioni.scegli', { id, i })
  if (!d?.ok) return errore(d)
  const esito = d.esito
  // (la fine: il testo del nodo dove si è arrivati; lo zaino della risposta dice già «fatta»)
  return { ok: true, vista: esito.fine ? { m, fatta: true, t: m.nodi[esito.nodo]?.t ?? '', scelte: [] } : vista(id), esito }
}
