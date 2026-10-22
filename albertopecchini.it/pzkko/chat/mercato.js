// Il mercato (23.10): i prezzi di oggi e gli acquisti, in un posto solo, perché lo usano sia il comando «compra» della chat
// sia lo shop del telefono (telefono/app/negozio.js). Le OFFERTE DEL GIORNO sono tre pezzi a prezzo scontato (−20, −30,
// −40 %) scelti a sorte con il giorno come seme: tutti vedono le stesse, e cambiano a mezzanotte (di Mantova).

import * as pzk from '../games/pzk.js'
import * as zaino from './zaino.js'
import { NEGOZIO, PER_ID } from './testi.js'

/** Il giorno di Mantova, AAAA-MM-GG. */
export const giornoDi = (ms = Date.now()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))

/** Un generatore a caso che dal seme (una stringa) dà sempre la stessa fila di numeri (mulberry32). */
export function conSeme(seme) {
  let h = 1779033703 ^ seme.length
  for (let i = 0; i < seme.length; i++) { h = Math.imul(h ^ seme.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  let a = (h ^ (h >>> 16)) >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Le offerte di oggi: [{ id, sconto }] (tre, i pezzi da 5 a 5.000 $pzk, uno per reparto diverso se si può). */
export function offerte(giorno = giornoDi()) {
  const r = conSeme('offerte-' + giorno)
  const scelti = [], reparti = new Set()
  const pool = NEGOZIO.filter((x) => x.prezzo >= 5 && x.prezzo <= 5000 && x.tipo !== 'cassa')
  for (let tentativi = 0; scelti.length < 3 && tentativi < 60; tentativi++) {
    const x = pool[Math.floor(r() * pool.length)]
    if (scelti.includes(x) || (reparti.has(x.reparto) && tentativi < 40)) continue
    scelti.push(x); reparti.add(x.reparto)
  }
  return scelti.map((x, i) => ({ id: x.id, sconto: [0.2, 0.3, 0.4][i] }))
}
/** Lo sconto di oggi su un pezzo (0 se non è in offerta). */
export const scontoDi = (id) => offerte().find((o) => o.id === id)?.sconto ?? 0
/** Il prezzo di oggi di un pezzo (con l'offerta, se c'è). */
export const prezzoDi = (x) => Math.max(1, Math.round(x.prezzo * (1 - scontoDi(x.id))))

/** Incassa un premio (sfide, quiz, missioni): col moltiplicatore del livello e dei bonus «paga», e dei bonus «sfide» se `sfide`. → quanto è arrivato */
export function incassa(n, { sfide = false } = {}) {
  const tot = Math.round(n * zaino.moltiplicatore() * (sfide ? 1 + zaino.bonus('sfide') : 1) * 2) / 2
  if (tot > 0) { pzk.regola('chat', 0, tot); zaino.conta('guadagnati', tot) }
  return tot
}

/** Compra n pezzi: toglie i $pzk e mette nello zaino. → { ok, x, n, tot, sconto } oppure { ok: false, errore } */
export function compra(id, n = 1) {
  const x = PER_ID[id]
  if (!x?.prezzo) return { ok: false, errore: 'non lo vendo' }
  if (x.unico && zaino.ha(id)) return { ok: false, errore: 'ce l’hai già' }
  n = x.unico ? 1 : Math.max(1, Math.min(50, Math.floor(n) || 1))
  const tot = prezzoDi(x) * n
  if (!pzk.punta('chat', tot)) return { ok: false, errore: `costa ${tot} $pzk e ne hai ${pzk.saldo()}`, manca: tot - pzk.saldo() }
  pzk.regola('chat', tot, 0)
  zaino.aggiungi(id, n)
  zaino.conta('comprati', tot)
  zaino.conta('acquisti', n)
  return { ok: true, x, n, tot, sconto: scontoDi(id) }
}
