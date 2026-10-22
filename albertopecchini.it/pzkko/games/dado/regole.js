// Le regole del sic bo di pzkko.it (tre dadi, «dai siu», grande e piccolo): le
// puntate del tavolo, quando vincono e quanto pagano. Le usa la finestra del
// gioco (dado.js) e le usano le prove (tools/pzkko/dado/prova.mjs), che le
// confrontano con un conto fatto in un altro modo e ricavano il vantaggio del
// banco esatto, sulle 216 uscite. Soldi finti: $pzk (vedi ../pzk.js).
//
// Due tabelle vere, scelte dal giocatore (i pagamenti come li riporta
// wizardofodds.com/games/sic-bo):
// - macao: quella dei casinò di Macao, coi pagamenti più bassi, e con pari e
//   dispari, che si trovano solo lì;
// - atlantic city: quella del New Jersey, che paga di più i totali estremi, le
//   coppie e le triple; niente pari e dispari.
// Piccolo, grande, pari e dispari perdono quando esce una tripla. Il numero
// singolo paga 1, 2 o 3 a 1 se il numero esce su uno, due o tre dadi; la coppia
// vince anche con la tripla di quel numero.

const totali = (t) => Object.fromEntries([4, 5, 6, 7, 8, 9, 10].flatMap((n, i) => [[n, t[i]], [21 - n, t[i]]]))

export const REGOLE = {
  macao: {
    id: 'macao', nome: 'macao', pariDispari: true,
    totali: totali([50, 18, 14, 12, 8, 6, 6]), coppia: 8, tripla: 150, triple: 24, combinazione: 5, singolo: [1, 2, 3],
  },
  atlantic: {
    id: 'atlantic', nome: 'atlantic city', pariDispari: false,
    totali: totali([60, 30, 17, 12, 8, 6, 6]), coppia: 10, tripla: 180, triple: 30, combinazione: 5, singolo: [1, 2, 3],
  },
}

// le quindici combinazioni di due numeri diversi, nell'ordine del tavolo (1-2, 1-3 … 5-6)
export const COMBINAZIONI = []
for (let a = 1; a <= 6; a++) for (let b = a + 1; b <= 6; b++) COMBINAZIONI.push([a, b])

/**
 * Le puntate del tavolo con questo regolamento: id, tipo, il numero (o i due
 * numeri) a cui si riferisce, il nome e quanto paga (a 1; per il singolo la
 * tabella 1, 2, 3).
 */
export function puntate(R) {
  const p = []
  const add = (id, tipo, nome, paga, extra = {}) => p.push({ id, tipo, nome, paga, ...extra })
  add('piccolo', 'piccolo', 'piccolo, da 4 a 10', 1)
  add('grande', 'grande', 'grande, da 11 a 17', 1)
  if (R.pariDispari) { add('pari', 'pari', 'pari', 1); add('dispari', 'dispari', 'dispari', 1) }
  for (let n = 4; n <= 17; n++) add(`totale:${n}`, 'totale', `totale ${n}`, R.totali[n], { n })
  for (let n = 1; n <= 6; n++) add(`coppia:${n}`, 'coppia', `coppia di ${n}`, R.coppia, { n })
  for (let n = 1; n <= 6; n++) add(`tripla:${n}`, 'tripla', `tripla di ${n}`, R.tripla, { n })
  add('triple', 'triple', 'qualsiasi tripla', R.triple)
  for (const [a, b] of COMBINAZIONI) add(`combinazione:${a}-${b}`, 'combinazione', `combinazione ${a} e ${b}`, R.combinazione, { a, b })
  for (let n = 1; n <= 6; n++) add(`singolo:${n}`, 'singolo', `il ${n}`, R.singolo, { n })
  return p
}

export const PUNTATE = Object.fromEntries(Object.keys(REGOLE).map((k) => [k, puntate(REGOLE[k])]))
export const PER_ID = Object.fromEntries(Object.keys(REGOLE).map((k) => [k, new Map(PUNTATE[k].map((p) => [p.id, p]))]))

/** Quanto torna per ogni $pzk puntato su `p` quando escono `dadi` (la puntata più la vincita; 0 se perde). */
export function rende(p, dadi, R) {
  const [a, b, c] = dadi
  const tot = a + b + c, tripla = a === b && b === c
  const quanti = (n) => (a === n) + (b === n) + (c === n)
  switch (p.tipo) {
    case 'piccolo': return !tripla && tot <= 10 ? 2 : 0
    case 'grande': return !tripla && tot >= 11 ? 2 : 0
    case 'pari': return !tripla && tot % 2 === 0 ? 2 : 0
    case 'dispari': return !tripla && tot % 2 === 1 ? 2 : 0
    case 'totale': return tot === p.n ? R.totali[p.n] + 1 : 0
    case 'coppia': return quanti(p.n) >= 2 ? R.coppia + 1 : 0
    case 'tripla': return tripla && a === p.n ? R.tripla + 1 : 0
    case 'triple': return tripla ? R.triple + 1 : 0
    case 'combinazione': return quanti(p.a) && quanti(p.b) ? R.combinazione + 1 : 0
    case 'singolo': { const k = quanti(p.n); return k ? R.singolo[k - 1] + 1 : 0 }
  }
  throw new Error(`puntata sconosciuta: ${p.id}`)
}

/**
 * Il conto di un colpo: `giocate` = Map id → importo, `dadi` le tre facce.
 * Restituisce quanto torna al giocatore, quanto era puntato, le puntate vinte
 * (con quanto torna ciascuna) e quelle perse.
 */
export function esito(giocate, dadi, R) {
  const per = PER_ID[R.id]
  let torna = 0, puntato = 0
  const vinte = [], perse = []
  for (const [id, importo] of giocate) {
    if (!(importo > 0)) continue
    const p = per.get(id)
    if (!p) throw new Error(`puntata sconosciuta: ${id}`)
    puntato += importo
    const k = rende(p, dadi, R)
    if (k) { torna += importo * k; vinte.push({ id, torna: importo * k }) } else perse.push(id)
  }
  return { torna, puntato, netto: torna - puntato, vinte, perse }
}

/** Il totale, e come si chiama il colpo: «tripla», «piccolo» o «grande». */
export function leggi(dadi) {
  const tot = dadi[0] + dadi[1] + dadi[2]
  const tripla = dadi[0] === dadi[1] && dadi[1] === dadi[2]
  return { tot, tripla, nome: tripla ? `tripla di ${dadi[0]}` : tot <= 10 ? 'piccolo' : 'grande', pari: tot % 2 === 0 }
}
