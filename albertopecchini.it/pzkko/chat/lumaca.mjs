// La salute della lumachina (23.10 sera, Alberto): la chiocciolina del cercapersone ha una vita sua. Ogni giorno di Mantova
// (dalle 00:00 alle 00:00) si sveglia con una salute e decide lei com'è la giornata: se sta male prende medicine e spende i
// tuoi soldi, se ha una visione ti fa guadagnare o perdere, a volte combina affari, disastri o miracoli, a volte niente.
// Il giocatore non può farci niente: la giornata è decisa da un dado DETERMINISTICO (il conto e il giorno), quindi è la stessa
// sul server e nel browser, a ogni ricarica, su ogni dispositivo, e non si può rigiocare.
//
// Modulo puro (niente DOM): lo usano il server (api/wallet.mjs: applica i soldi ai conti, una volta per giorno) e il
// cercapersone (telefono/app/giocatori.js, la scheda «io»: racconta). Gli eventi, coi testi e le percentuali, sono in
// lumaca-dati.mjs (100 negativi, 100 positivi, 100 neutri, fra cui 3 catastrofi e 3 miracoli).
//
// Come si decide una giornata:
//   1. la SALUTE (0–100 %, un decimale): un rumore che per il 70 % dipende da ieri (una lumachina malata resta malata
//      qualche giorno, una in forma resta in forma), passato nella funzione di ripartizione della normale, così ogni
//      salute da 0 a 100 è ugualmente possibile nel lungo periodo;
//   2. la CATEGORIA: neutra il 30 % delle volte; negativa con probabilità 0,1 + 0,5 × (1 − salute) − INCLINA, positiva
//      con 0,1 + 0,5 × salute + INCLINA (malata: ~59 % nera, ~11 % buona; in piena forma il contrario);
//   3. l'EVENTO: uno della categoria fra quelli credibili con la salute di oggi (il suo intervallo `salute`).
//   Prima di tutto questo, un dado a parte per le GRAVI: lo 0,5 % dei giorni è una catastrofe, lo 0,5 % un miracolo, a
//   qualunque salute. Stessa probabilità e importi rovesciati (ogni miracolo annulla una catastrofe: −50 % e +100 %),
//   così nel lungo periodo le gravi non svuotano né gonfiano i conti: fanno solo paura e festa.
// Ogni evento sposta la sua percentuale dei $pzk liberi del conto (a mezzi $pzk, mai sotto zero); gli EUR€ non li tocca.

import { EVENTI } from './lumaca-dati.mjs'

export { EVENTI }
export const RECUPERO = 30 // i giorni persi che il server recupera al più, quando torni dopo tanto
export const TIENI = 14 // le giornate che il conto ricorda (la storia nella scheda «io»)
const P_NEUTRA = 0.3, P_GRAVE = 0.005, MEMORIA = 0.7, PASSATO = 24 // giorni di storia per la salute (0,7^24 ≈ 0,0002)
// le giornate nere dei dati tolgono in media un filo più di quanto diano le buone (−2,50 % contro +2,28 %), e perdere e
// guadagnare la stessa percentuale non si compensa: 1,2 punti di probabilità passano dalle nere alle buone, così il conto
// tipico dopo un anno resta dov'era (simulazione su 300 conti da 10.000: mediana 9.900; senza, 8.300; la media sale
// comunque, ~18.000, perché chi ha un miracolo raddoppia)
const INCLINA = 0.012
const PER_ID = new Map(EVENTI.map((e) => [e.id, e]))
export const evento = (id) => PER_ID.get(id) ?? null

// ── il dado: un numero in [0, 1) da (seme, giorno, cosa), sempre lo stesso (cyrb53) ──
function cyrb53(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677) }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}
const dado = (seme, g, cosa) => (cyrb53(`${seme}|${g}|${cosa}`) % 1e9) / 1e9
// una normale standard (Box-Muller) e la sua ripartizione (Abramowitz-Stegun 7.1.26, errore < 1,5e-7)
const normale = (seme, g) => Math.sqrt(-2 * Math.log(1 - dado(seme, g, 'n1'))) * Math.cos(2 * Math.PI * dado(seme, g, 'n2'))
function ripartizione(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2)
  const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2)
  return 0.5 * (1 + Math.sign(x) * e)
}

// ── i giorni: 'AAAA-MM-GG' di Mantova; i conti coi giorni si fanno in UTC, dove un giorno è sempre di 24 ore ──
export const giornoDi = (ms = Date.now()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
export const giornoPiu = (g, n) => new Date(Date.UTC(+g.slice(0, 4), +g.slice(5, 7) - 1, +g.slice(8, 10) + n)).toISOString().slice(0, 10)

/** La salute della lumachina in un giorno (0–100, un decimale). */
export function salute(seme, g) {
  let x = normale(seme, giornoPiu(g, -PASSATO))
  for (let i = PASSATO - 1; i >= 0; i--) x = MEMORIA * x + Math.sqrt(1 - MEMORIA * MEMORIA) * normale(seme, giornoPiu(g, -i))
  return Math.min(99.9, Math.max(0.1, Math.round(1000 * ripartizione(x)) / 10))
}
/** Come sta, in parole. */
export function umore(h) {
  return h < 8 ? 'a pezzi' : h < 20 ? 'malconcia' : h < 35 ? 'giù di guscio' : h < 50 ? 'così così' : h < 65 ? 'discreta' : h < 80 ? 'in forma' : h < 92 ? 'pimpante' : 'euforica'
}

/** La giornata della lumachina: { g, salute, umore, evento }. `seme`: chi è (il conto: la sua data di nascita). */
export function giornata(seme, g) {
  const h = salute(seme, g)
  const ug = dado(seme, g, 'grave')
  if (ug < 2 * P_GRAVE) { // una catastrofe o un miracolo, a qualunque salute
    const gravi = EVENTI.filter((e) => e.grave && Math.sign(e.pct) === (ug < P_GRAVE ? -1 : 1))
    if (gravi.length) return { g, salute: h, umore: umore(h), evento: gravi[Math.floor(dado(seme, g, 'quale') * gravi.length)] }
  }
  const pNeg = 0.1 + 0.5 * (1 - h / 100) - INCLINA, pPos = 1 - P_NEUTRA - pNeg // 0,1 + 0,5 × salute + INCLINA
  const u = dado(seme, g, 'categoria')
  const segno = u < pNeg ? -1 : u < pNeg + pPos ? 1 : 0
  const della = EVENTI.filter((e) => !e.grave && Math.sign(e.pct) === segno)
  const qui = della.filter((e) => e.salute[0] <= h && h <= e.salute[1])
  const scelta = qui.length ? qui : della
  return { g, salute: h, umore: umore(h), evento: scelta[Math.floor(dado(seme, g, 'evento') * scelta.length)] }
}

const mezzi = (n) => Math.round(n * 2) / 2
/** Quanti $pzk sposta un evento su un saldo: la sua percentuale, a mezzi $pzk, mai sotto zero. */
export function effetto(pzk, ev) {
  const d = mezzi((pzk * ev.pct) / 100)
  return Math.max(-pzk, d)
}

/** I giorni ancora da vivere per un conto: dal giorno dopo l'ultimo vissuto fino a oggi (la prima volta solo oggi), al più
 *  RECUPERO (se manchi da più di un mese, la lumachina ricorda solo l'ultimo). */
export function daVivere(ultimo, oggi) {
  if (!ultimo) return [oggi]
  let g = giornoPiu(ultimo, 1)
  const primo = giornoPiu(oggi, -(RECUPERO - 1))
  if (g < primo) g = primo
  const out = []
  for (; g <= oggi; g = giornoPiu(g, 1)) out.push(g)
  return out
}

/**
 * Il server fa vivere la lumachina di un conto fino a oggi: per ogni giorno da vivere applica l'evento ai suoi $pzk e lo
 * ricorda in `c.lumaca` ({ g: l'ultimo giorno vissuto, ultime: [{ g, ev, pct, s, n, prima }] }, le ultime TIENI).
 * Restituisce { delta, nuove } (i $pzk spostati in tutto e le giornate appena vissute), o null se non c'era niente da vivere.
 * `nota(voce)` (facoltativa) per ogni giornata che sposta $pzk: il server ci fa la mossa e, per le gravi, la notizia.
 */
export function vivi(c, oggi, nota) {
  const giorni = daVivere(c.lumaca?.g, oggi)
  if (!giorni.length) return null
  const seme = String(c.creato)
  const l = (c.lumaca ??= { g: null, ultime: [] })
  let delta = 0
  const nuove = []
  for (const g of giorni) {
    const gi = giornata(seme, g), ev = gi.evento
    const prima = c.pzk, n = effetto(prima, ev)
    c.pzk = mezzi(prima + n)
    delta += n
    const voce = { g, ev: ev.id, pct: ev.pct, s: gi.salute, n, prima }
    l.ultime.push(voce)
    nuove.push(voce)
    if (ev.pct !== 0) nota?.(voce, ev)
  }
  l.g = oggi
  if (l.ultime.length > TIENI) l.ultime.splice(0, l.ultime.length - TIENI)
  return { delta: mezzi(delta), nuove }
}
