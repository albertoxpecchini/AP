// Le regole della roulette di pzkko.it (europea, un solo zero): le puntate che
// si possono fare sul tavolo, quali numeri coprono, quanto pagano. Le usa la
// finestra del gioco e le usano le prove (tools/pzkko/roulette/prova.mjs), che
// le confrontano con un conto fatto in un altro modo. Soldi finti: $pzk.

import { ROSSI } from './ruota.js'

// quanto paga ogni tipo di puntata (a 1: si riprende la puntata più tanto così)
export const PAGA = { pieno: 35, cavallo: 17, terzina: 11, quartina: 8, sestina: 5, colonna: 2, dozzina: 2, semplice: 1 }
export const NOMI = { pieno: 'pieno', cavallo: 'cavallo', terzina: 'terzina', quartina: 'quartina', sestina: 'sestina', colonna: 'colonna', dozzina: 'dozzina', semplice: '' }
export const FICHES = [1, 5, 25, 100, 500]
export const SALDO_INIZIALE = 1000

// il tavolo è in verticale: lo zero in cima, poi 12 righe da 3 numeri (1 2 3 / 4 5 6 / …)
export const riga = (n) => Math.ceil(n / 3) - 1 // 0…11
export const colonna = (n) => (n - 1) % 3 // 0…2

/**
 * Tutte le puntate possibili, ognuna con: id, tipo, numeri coperti, quanto paga
 * e dove sta sul tavolo (`dove`: la cella o il bordo o l'incrocio, in unità del
 * tavolo: x in colonne dei numeri, y in righe; lo zero sta sopra la riga 0).
 */
export function puntate() {
  const p = []
  const add = (tipo, numeri, dove, nome) => p.push({ id: `${tipo}:${numeri.join('-')}`, tipo, numeri, paga: PAGA[tipo], dove, nome: nome ?? `${NOMI[tipo]} ${numeri.join('-')}` })
  // pieni
  add('pieno', [0], { tipo: 'zero' }, 'pieno 0')
  for (let n = 1; n <= 36; n++) add('pieno', [n], { tipo: 'cella', x: colonna(n) + 0.5, y: riga(n) + 0.5 }, `pieno ${n}`)
  // cavalli: fra due numeri della stessa riga, fra una riga e la successiva, con lo zero
  for (let n = 1; n <= 36; n++) {
    if (colonna(n) < 2) add('cavallo', [n, n + 1], { tipo: 'verticale', x: colonna(n) + 1, y: riga(n) + 0.5 })
    if (n <= 33) add('cavallo', [n, n + 3], { tipo: 'orizzontale', x: colonna(n) + 0.5, y: riga(n) + 1 })
  }
  for (const n of [1, 2, 3]) add('cavallo', [0, n], { tipo: 'orizzontale', x: colonna(n) + 0.5, y: 0 })
  // terzine: le righe (sul bordo sinistro della riga) e le due con lo zero
  for (let r = 0; r < 12; r++) add('terzina', [3 * r + 1, 3 * r + 2, 3 * r + 3], { tipo: 'bordo', x: 0, y: r + 0.5 })
  add('terzina', [0, 1, 2], { tipo: 'incrocio', x: 1, y: 0 })
  add('terzina', [0, 2, 3], { tipo: 'incrocio', x: 2, y: 0 })
  // quartine: all'incrocio di quattro numeri, e i primi quattro (0-1-2-3) all'angolo
  for (let n = 1; n <= 32; n++) if (colonna(n) < 2) add('quartina', [n, n + 1, n + 3, n + 4], { tipo: 'incrocio', x: colonna(n) + 1, y: riga(n) + 1 })
  add('quartina', [0, 1, 2, 3], { tipo: 'incrocio', x: 0, y: 0 }, 'i primi quattro 0-1-2-3')
  // sestine: due righe, sul bordo sinistro fra l'una e l'altra
  for (let r = 0; r < 11; r++) add('sestina', Array.from({ length: 6 }, (_, i) => 3 * r + 1 + i), { tipo: 'incrocio', x: 0, y: r + 1 })
  // colonne (in fondo), dozzine e semplici (a sinistra)
  for (let c = 0; c < 3; c++) add('colonna', Array.from({ length: 12 }, (_, i) => 3 * i + 1 + c), { tipo: 'colonna', c }, `colonna ${c + 1}`)
  for (let d = 0; d < 3; d++) add('dozzina', Array.from({ length: 12 }, (_, i) => 12 * d + 1 + i), { tipo: 'dozzina', d }, `${['prima', 'seconda', 'terza'][d]} dozzina`)
  const num = Array.from({ length: 36 }, (_, i) => i + 1)
  const semplici = [
    ['1-18', num.filter((n) => n <= 18)],
    ['pari', num.filter((n) => n % 2 === 0)],
    ['rosso', num.filter((n) => ROSSI.has(n))],
    ['nero', num.filter((n) => !ROSSI.has(n))],
    ['dispari', num.filter((n) => n % 2 === 1)],
    ['19-36', num.filter((n) => n >= 19)],
  ]
  semplici.forEach(([nome, numeri], s) => p.push({ id: `semplice:${nome}`, tipo: 'semplice', numeri, paga: 1, dove: { tipo: 'semplice', s }, nome }))
  return p
}

/**
 * Quanto torna al giocatore quando esce `numero`: per ogni puntata vinta la
 * puntata più la vincita, niente per le perse (sullo zero le semplici si perdono
 * tutte, senza «la partage»). `giocate` = Map id → importo.
 */
export function esito(giocate, numero, tutte = PUNTATE_PER_ID) {
  let torna = 0, puntato = 0
  const vinte = [], perse = []
  for (const [id, importo] of giocate) {
    if (!(importo > 0)) continue
    const p = tutte.get(id)
    if (!p) throw new Error(`puntata sconosciuta: ${id}`)
    puntato += importo
    if (p.numeri.includes(numero)) { torna += importo * (p.paga + 1); vinte.push(id) } else perse.push(id)
  }
  return { torna, puntato, netto: torna - puntato, vinte, perse }
}

export const PUNTATE = puntate()
export const PUNTATE_PER_ID = new Map(PUNTATE.map((p) => [p.id, p]))

/** Spezza un importo nelle fiches del tavolo, dalle più grandi (per disegnare la pila). */
export function inFiches(importo) {
  const out = []
  for (const f of [...FICHES].reverse()) while (importo >= f) { out.push(f); importo -= f }
  return out
}
