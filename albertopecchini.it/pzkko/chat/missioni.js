// Il motore delle side quest (23.10): le storie sono in missioni-dati.js, qui si gioca. Lo stato sta nello zaino
// (zaino.missioniStato: { attive: { id: { nodo, flags } }, fatte: { id: ts } }). Una missione si comincia se si ha il livello e
// gli oggetti che chiede (alcuni si consumano), si va avanti scegliendo, e al nodo finale si prende il premio (una volta).
// Lo usano il comando «missioni» della chat e l'app Missioni del telefono. Niente interfaccia qui: tutto torna come dati.

import * as zaino from './zaino.js'
import * as pzk from '../games/pzk.js'
import { incassa } from './mercato.js'
import { MISSIONI, PER_ID } from './missioni-dati.js'
import { nomeDi } from './testi.js'

const stato = () => { const q = zaino.missioniStato(); return { attive: { ...q.attive }, fatte: { ...q.fatte } } }

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
  if (!a) return { m, nonIniziata: true, t: m.breve, manca: manca(m), scelte: [] }
  const nodo = m.nodi[a.nodo]
  const scelte = (nodo.scelte ?? []).map((s, i) => {
    if (s.se && !s.se.every((f) => a.flags.includes(f))) return null
    if (s.non && a.flags.includes(s.non)) return null
    let motivo = null
    if (s.richiede && !zaino.ha(s.richiede)) motivo = `ti serve ${nomeDi(s.richiede)}`
    else if (s.uno && !s.uno.some((o) => zaino.ha(o))) motivo = `ti serve del cibo (${s.uno.slice(0, 3).map(nomeDi).join(', ')}…)`
    else if (s.costo && pzk.saldo() < s.costo) motivo = `costa ${s.costo} $pzk`
    return { i, eti: s.eti, ok: !motivo, motivo, costo: s.costo ?? 0, azzardo: s.caso ? Math.round(s.caso.p * 100) : 0 }
  }).filter(Boolean)
  return { m, t: nodo.t, scelte, passi: a.passi ?? 0, flags: a.flags }
}

/** Comincia una missione. → { ok } o { ok: false, errore } */
export function inizia(id) {
  const m = PER_ID[id]
  const q = stato()
  if (!m) return { ok: false, errore: 'non c’è questa missione' }
  if (q.fatte[id]) return { ok: false, errore: 'questa l’hai già fatta' }
  if (q.attive[id]) return { ok: true, gia: true }
  const mm = manca(m)
  if (mm.length) return { ok: false, errore: `ti manca: ${mm.join(', ')}` }
  for (const o of m.consuma ?? []) zaino.togli(o)
  q.attive[id] = { nodo: 'start', flags: [], passi: 0 }
  zaino.salvaMissioni(q)
  return { ok: true }
}

/** Abbandona una missione in corso (si può ricominciare da capo: gli oggetti consumati non tornano). */
export function abbandona(id) {
  const q = stato()
  delete q.attive[id]
  zaino.salvaMissioni(q)
}

/** Fa una scelta. → { ok, vista, esito: { perso, speso, caso: 'ok'|'ko'|null, fine?, premio?, livello? } } o { ok: false, errore } */
export function scegli(id, i) {
  const m = PER_ID[id]
  const q = stato()
  const a = q.attive[id]
  if (!m || !a) return { ok: false, errore: 'missione non in corso' }
  const s = m.nodi[a.nodo].scelte?.[i]
  const v = vista(id).scelte.find((x) => x.i === i)
  if (!s || !v) return { ok: false, errore: 'scelta non valida' }
  if (!v.ok) return { ok: false, errore: v.motivo }
  const esito = { perso: 0, speso: 0, caso: null }
  if (s.costo) { if (!pzk.punta('chat', s.costo)) return { ok: false, errore: `costa ${s.costo} $pzk` }; pzk.regola('chat', s.costo, 0); esito.speso = s.costo }
  if (s.uno) { const o = s.uno.find((x) => zaino.ha(x)); zaino.togli(o); esito.consumato = o }
  if (s.perde) { const n = Math.min(s.perde, pzk.saldo()); if (n > 0 && pzk.punta('chat', n)) { pzk.regola('chat', n, 0); esito.perso = n } }
  if (s.segna && !a.flags.includes(s.segna)) a.flags = [...a.flags, s.segna]
  let vai = s.vai
  if (s.caso) { const bene = Math.random() < s.caso.p; esito.caso = bene ? 'ok' : 'ko'; if (!bene) { vai = s.caso.ko; a.flags = a.flags.filter((f) => f !== s.segna) } }
  a.nodo = vai
  a.passi = (a.passi ?? 0) + 1
  zaino.conta('passiMissione')
  if (m.nodi[vai].fine) {
    delete q.attive[id]
    q.fatte[id] = Date.now()
    zaino.salvaMissioni(q)
    const pz = incassa(m.premio.pzk)
    const livello = zaino.daiXp(m.premio.xp)
    if (m.premio.oggetto) zaino.aggiungi(m.premio.oggetto)
    zaino.conta('missioniFatte')
    esito.fine = true
    esito.premio = { pzk: pz, xp: m.premio.xp, oggetto: m.premio.oggetto ?? null }
    esito.livello = livello
    return { ok: true, vista: { m, fatta: true, t: m.nodi[vai].t, scelte: [] }, esito }
  }
  q.attive[id] = a
  zaino.salvaMissioni(q)
  return { ok: true, vista: vista(id), esito }
}
