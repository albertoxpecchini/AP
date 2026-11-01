// La logica della Cucina (26.10): le ricette del Mincio alla Cooking Mama, con la nonna (l'avatar av-nonna) che guarda e
// commenta. (31.10) È in comune con la cucina del cercapersone zero (telefono/zero/os/cucina.js), che gioca i minigiochi a
// 8 bit; l'interfaccia HTML di qui (il menù, le scene, i minigiochi col dito) se n'è andata col cercapersone vecchio.
// Ogni ricetta è una fila di passi, ognuno un minigioco di pochi secondi:
//   taglia   il coltello va avanti e indietro: si tocca quando è sulla riga tratteggiata (più vicino, meglio)
//   ordina   gli ingredienti nell'ordine detto: ogni sbaglio costa
//   mescola  si gira in tondo attorno alla pentola (dito o mouse): quanti giri prima che scada il tempo
//   impasta  si tocca più in fretta che si può (stendere, sbriciolare)
//   versa    si tiene premuto e si lascia quando il livello è nella fascia verde
//   cuoci    la lancetta va su e giù: si ferma nella fascia verde
// Ogni passo vale da 0 a 100; la media dà la medaglia (oro 90, argento 70, bronzo 45). Le prime tre ricette del giorno con
// una medaglia pagano $pzk (col moltiplicatore, come la chat) e xp; con l'oro, una volta al giorno per ricetta, il piatto
// vero va nello zaino quando esiste (i tortelli, la sbrisolona). Lo stato sta nello zaino (zaino.cucinaStato).
//
// DAL 31.10 I VOTI LI DÀ LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-cucina.mjs sul server di Alberto).
// I minigiochi si giocano sullo zero, ma la ricetta la apre la banca ('cucina.apri') con la sua ora e i numeri a caso di ogni passo
// (dove sono le righe da tagliare, l'ordine delle carte, la fascia del versa e del cuoci); finito un passo, si manda
// quello che si è fatto ('cucina.passo': i millisecondi dei tagli, gli ingredienti toccati, i quarti di giro, i colpi, quanto è
// stato aperto il sacco, quando si è fermata la lancetta), e la banca fa il voto con le stesse formule e controlla che i tempi
// stiano nel tempo passato davvero. All'ultimo passo la banca dà la medaglia e i premi. Il coltello, la lancetta e il sacco si
// muovono col tempo, non coi fotogrammi, uguali qui (votoDi), nella cucina di pzk os e sulla banca: il voto che si vede subito è
// quello che darà la banca.

import * as zaino from '../../chat/zaino.js'
import * as pzk from '../../games/pzk.js'
import { oggi } from '../../games/pzk.js'
import { PER_ID } from '../../chat/testi.js'

// (dal 29.10 le ricette, le medaglie e i premi si esportano: li usa la cucina di pzk os, telefono/zero/os/cucina.js)
// (31.10: i passi e i premi che contano sono quelli della banca, giochi/app-cucina.mjs: si cambiano insieme)
export const RICETTE = [
  { id: 'tortelli', nome: 'tortelli di zucca', piatto: 'tortelli', dove: 'la vigilia di Natale, in tutta Mantova', passi: [
    ['taglia', 'taglia la zucca', { icona: 'zucca', tagli: 3 }],
    ['ordina', 'il ripieno, in quest’ordine', { seq: ['zucca', 'amaretti', 'mostarda', 'parmigiano'] }],
    ['mescola', 'mescola il ripieno', { icona: 'mestolo', giri: 4 }],
    ['impasta', 'stendi la sfoglia col mattarello', { icona: 'mattarello', colpi: 22 }],
    ['cuoci', 'scolali quando vengono a galla', { icona: 'pentola' }],
  ] },
  { id: 'pilota', nome: 'risotto alla pilota', piatto: 'risotto', dove: 'quello dei piloti delle risaie, a Villimpenta', passi: [
    ['versa', 'il cono di riso nell’acqua: fermati al punto giusto', { icona: 'riso' }],
    ['cuoci', 'spegni il fuoco al momento giusto', { icona: 'pentola' }],
    ['taglia', 'taglia la salamella', { icona: 'salamella', tagli: 2 }],
    ['mescola', 'sgrana la salamella e mescola', { icona: 'mestolo', giri: 5 }],
    ['ordina', 'mantecalo', { seq: ['burro', 'parmigiano', 'salamella'] }],
  ] },
  { id: 'sbrisolona', nome: 'torta sbrisolona', piatto: 'sbrisolona', dove: 'il dolce che si rompe col pugno', passi: [
    ['ordina', 'nella ciotola, in quest’ordine', { seq: ['farina', 'mandorle', 'burro', 'uova'] }],
    ['impasta', 'sbriciola l’impasto con le dita', { icona: 'farina', colpi: 26 }],
    ['versa', 'le briciole nella teglia: non troppe', { icona: 'mandorle' }],
    ['cuoci', 'tirala fuori dal forno quando è dorata', { icona: 'forno' }],
  ] },
  { id: 'luccio', nome: 'luccio in salsa', piatto: 'luccio-salsa', dove: 'il pesce del Mincio, con la salsa verde', passi: [
    ['taglia', 'pulisci il luccio', { icona: 'luccio', tagli: 3 }],
    ['cuoci', 'lessalo piano: spegni al momento giusto', { icona: 'pentola' }],
    ['taglia', 'trita il prezzemolo', { icona: 'prezzemolo', tagli: 4 }],
    ['mescola', 'la salsa: olio, prezzemolo e capperi', { icona: 'mestolo', giri: 4 }],
  ] },
]
export const MEDAGLIE = [[0.9, 'oro', '#ffd400', 60], [0.7, 'argento', '#d7dde2', 35], [0.45, 'bronzo', '#d08a4a', 15]]
export const medaglia = (v) => MEDAGLIE.find(([m]) => v >= m) ?? null
export const PAGATE = 3
export const commento = (v) => (v >= 0.9 ? 'perfetto! meglio della nonna' : v >= 0.7 ? 'brava, così si fa' : v >= 0.45 ? 'mmh… si può mangiare' : 'la nonna sospira')
/** Il nome di un ingrediente senza l'articolo (il ripieno: zucca, amaretti…). */
export const nomeIng = (s) => (PER_ID[s]?.nome ?? s).replace(/^(un’|un |una |uno |il |la |l’|i |le |gli )/i, '')
export const COME = { taglia: 'tocca quando il coltello è sulla riga', ordina: 'tocca gli ingredienti nell’ordine', mescola: 'gira in tondo attorno alla pentola', impasta: 'tocca più in fretta che puoi', versa: 'tieni premuto, lascia nella fascia verde', cuoci: 'tocca quando la lancetta è nel verde' }

// ── il movimento e il voto: uguali alla banca (giochi/app-cucina.mjs) ──
export const TEMPO = { taglia: 12000, ordina: 14000, mescola: 7000, impasta: 5000, versa: 9000, cuoci: 8000 }
/** Dov'è il coltello (0…1) dopo ms: va e viene, 0,66 al secondo. */
export const coltello = (ms) => { const p = ((ms / 1000) * 0.66) % 2; return p <= 1 ? p : 2 - p }
/** Dov'è la lancetta (0…1) dopo ms. */
export const lancetta = (ms) => 0.5 - 0.5 * Math.cos((ms / 1000) * 2.6)
/** Quanto è pieno il bicchiere (0…1) dopo ms di sacco aperto. */
export const livello = (ms) => Math.min(1, (ms / 1000) * 0.48)
const fascia = (x, a, b, k) => { const c = (a + b) / 2; return x >= a && x <= b ? 1 - (Math.abs(x - c) / (b - a)) * 0.4 : Math.max(0, 1 - Math.abs(x - c) * k) }
/** Il voto (0…1) di un passo dalle mosse, coi numeri della banca: lo stesso che darà lei (qui per mostrarlo subito). */
export function votoDi([tipo, , o], par, mosse) {
  let v = 0
  if (tipo === 'taglia') {
    const righe = par.righe.map((x) => ({ x, fatto: false }))
    for (const ms of [...mosse].sort((a, b) => a - b)) { const xc = coltello(ms), r = righe.filter((q) => !q.fatto).sort((a, b) => Math.abs(a.x - xc) - Math.abs(b.x - xc))[0]; r.fatto = true; v += Math.max(0, 1 - Math.abs(r.x - xc) / 0.14) }
    v /= o.tagli
  } else if (tipo === 'ordina') {
    let prossimo = 0, sbagli = 0
    const messe = new Set()
    for (const s of mosse) { if (prossimo >= o.seq.length) break; if (messe.has(s)) continue; if (s === o.seq[prossimo]) { messe.add(s); prossimo++ } else sbagli++ }
    v = prossimo === o.seq.length ? 1 - sbagli * 0.2 : prossimo / o.seq.length - sbagli * 0.2
  } else if (tipo === 'mescola') v = Math.min(mosse, o.giri * 4) / 4 / o.giri
  else if (tipo === 'impasta') v = Math.min(mosse, o.colpi) / o.colpi
  else if (tipo === 'versa') v = fascia(livello(mosse ?? 0), par.a, par.b, 4)
  else if (tipo === 'cuoci') v = mosse === null ? 0 : fascia(lancetta(mosse), par.a, par.b, 3.5)
  return Math.max(0, Math.min(1, v))
}
let coda = Promise.resolve()
/** Apre una ricetta sulla banca. → Promise<{ ok, par: [i numeri di ogni passo] } | { ok: false, errore }> */
export async function apri(r) {
  coda = Promise.resolve()
  const d = await pzk.fai('cucina.apri', { ricetta: r.id })
  return d?.ok ? { ok: true, par: d.esito.par } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
}
/** Manda le mosse del passo i alla banca (in fila, uno alla volta). All'ultimo la banca chiude la ricetta: fine = { v, m (la
 *  medaglia, come in MEDAGLIE), pzk, xp, piatto, record }. → Promise<{ ok, v, fine? } | { ok: false, errore }> */
export function passo(i, mosse) {
  const p = coda.then(() => pzk.fai('cucina.passo', { i, mosse })).then((d) => {
    if (!d?.ok) return { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
    const f = d.esito.fine
    return { ok: true, v: d.esito.v, ...(f && { fine: { ...f, m: MEDAGLIE.find((x) => x[1] === f.m) ?? null } }) }
  }, () => ({ ok: false, errore: 'niente rete: riprova' }))
  coda = p
  return p
}

/** Lo stato della cucina di oggi (zaino.cucinaStato): se è di un altro giorno, le pagate e i piatti ripartono da zero. */
export const stato = () => { const c = zaino.cucinaStato(); return c.g === oggi() ? c : { ...c, g: oggi(), pagate: 0, piatti: [] } }
