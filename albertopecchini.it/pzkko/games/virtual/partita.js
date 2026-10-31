// Il calendario e le partite di «Virtual», il campionato inventato di pzkko.it. Niente disegno qui: la finestra
// (virtual.js) e lo schermino (schermo.js) chiedono a questo modulo cosa succede.
//
// IL TEMPO. Il tempo è diviso in cicli di cinque minuti allineati all'orologio: i primi quattro minuti del ciclo le
// scommesse sono aperte, l'ultimo minuto la partita è in diretta (90' più il recupero compressi in 60 secondi), allo
// scoccare del ciclo dopo è finita, si paga e si apre la successiva. L'indice della partita è Math.floor(ora / 300000):
// da quell'indice, con un generatore seminato, escono le squadre, le quote, il meteo e le formazioni. Così chiunque apra
// pzkko.it vede LA STESSA partita nello stesso momento, chi arriva a metà la vede dal punto giusto e ricaricare non cambia
// niente. (31.10) L'ora è quella della banca: adesso() corregge l'orologio del browser con quello che la banca dice a ogni
// palinsesto (orologio), così un telefono avanti di un minuto non chiude le scommesse quando per la banca sono aperte.
//
// LE QUOTE SEGUONO LA REALTÀ. Le quote si calcolano dalla forza vera delle squadre (squadre.js: le big alte, le
// neopromosse e la Serie B basse) con un fattore campo leggero e un pizzico di rumore dal seme, come farebbe un
// bookmaker: gol attesi dalla differenza di forza, probabilità di 1 X 2 e dei totali da una Poisson, un margine del
// 6,5%, arrotondate ai centesimi e mai sotto 1,05. Il meteo è solo scena: non tocca il risultato.
//
// IL RISULTATO E LA CRONACA NON SONO PIÙ QUI (31.10, Alberto: «il browser non decide più niente»). Fino a oggi il
// risultato usciva da un secondo seme, anche lui dall'indice (mulberry32), scritto qui: chiunque poteva calcolare in
// anticipo i risultati di tutte le partite. Ora li decide la banca (C:\pzkko-server, giochi/virtual.mjs: il seme è un
// HMAC del segreto del server, i gol dalle stesse forze delle quote, il doppio giallo che diventa rosso, gli espulsi che
// non giocano più), che li manda solo a partita iniziata, col palinsesto (schedina.js). Qui resta la scena, che serve per
// disegnare anche prima di chiedere (e senza rete): la stessa che costruisce la banca, dallo stesso seme pubblico, con le
// stesse quote. dallaBanca() aggiunge alla scena quello che la banca ha detto (le quote, il risultato, la cronaca), e
// partita() li dà insieme: risultato null ed eventi vuoti finché la banca non li ha dati. La prova
// tools/pzkko/virtual/prova.mjs controlla che la scena di qui e quella della banca siano la stessa.

import { SQUADRE, SERIE_A, SERIE_B, cognome } from './squadre.js'

export const CICLO = 5 * 60 * 1000 // ms
export const SCOMMESSE = 4 * 60 * 1000 // i primi quattro minuti del ciclo
export const DURATA = CICLO - SCOMMESSE // il minuto della partita
export const GOL_MEDI = 1.35
export const MARGINE = 0.065
export const QUOTA_MINIMA = 1.05
export const CAMPO = 4 // il fattore campo, in punti di forza
export const SOGLIE = [1.5, 2.5, 3.5, 4.5]
/** Le puntate possibili: 1 X 2 e over/under sulle quattro soglie. */
export const PUNTATE = [
  { id: '1', nome: '1', dice: 'vince chi gioca in casa' },
  { id: 'X', nome: 'X', dice: 'pareggio' },
  { id: '2', nome: '2', dice: 'vince chi gioca fuori' },
  ...SOGLIE.flatMap((s) => [{ id: `O${s}`, nome: `over ${s.toLocaleString('it-IT')}`, dice: `più di ${s.toLocaleString('it-IT')} gol in tutto` }, { id: `U${s}`, nome: `under ${s.toLocaleString('it-IT')}`, dice: `meno di ${s.toLocaleString('it-IT')} gol in tutto` }]),
]
export const PER_PUNTATA = new Map(PUNTATE.map((p) => [p.id, p]))
/** (31.10) Le giocate si chiudono 5 secondi prima del fischio: lo decide la banca (giochi/virtual.mjs, CHIUDE). */
export const CHIUDE = 5000

// ── l'orologio del campionato ────────────────────────────────────────────────
// (31.10) quanto l'orologio della banca è avanti rispetto a quello del browser
let scarto = 0
/** L'ora della banca, come la sa il browser. */
export const adesso = () => Date.now() + scarto
/** La banca ha detto che ore sono (`ora`), in una risposta chiesta a `mandata` e arrivata a `ricevuta` (Date.now()). */
export function orologio(ora, mandata, ricevuta) {
  if (!Number.isFinite(ora) || !(ricevuta >= mandata) || ricevuta - mandata > 10_000) return // (una risposta lenta non dice l'ora giusta)
  scarto = ora - (mandata + ricevuta) / 2
}
export const indiceAdesso = (now = adesso()) => Math.floor(now / CICLO)
/** Dove siamo nel ciclo: { indice, fase: 'scommesse' | 'partita', manca (ms alla chiusura o alla fine), t (secondi di partita, 0–60) }. */
export function fase(now = adesso()) {
  const indice = Math.floor(now / CICLO), dentro = now - indice * CICLO
  if (dentro < SCOMMESSE) return { indice, fase: 'scommesse', manca: SCOMMESSE - dentro, t: 0 }
  return { indice, fase: 'partita', manca: CICLO - dentro, t: (dentro - SCOMMESSE) / 1000 }
}
/** Le giocate sono aperte nella fase `f` (fino a CHIUDE prima del fischio). */
export const aperte = (f = fase()) => f.fase === 'scommesse' && f.manca > CHIUDE

// ── il generatore seminato (mulberry32) ──────────────────────────────────────
/** Un generatore riproducibile: rand() dà un numero fra 0 e 1, sempre gli stessi per lo stesso seme. */
export function generatore(seme) {
  let a = (seme ^ 0x9e3779b9) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// il seme della scena: squadre, quote, meteo, formazioni (dall'indice: è pubblico). Il seme del risultato lo ha la banca
const semeScena = (indice) => (Math.imul(indice, 2654435761) ^ 0x5bd1e995) >>> 0

// ── le probabilità da cui nascono le quote ───────────────────────────────────
const fattoriale = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f }
const pPoisson = (l, k) => (Math.exp(-l) * l ** k) / fattoriale(k)
/**
 * Dai gol attesi delle due squadre, le probabilità di 1, X, 2 e di over/under per ogni soglia (Poisson indipendenti,
 * fino a 10 gol a testa). È il modello del bookmaker: con le forze vere dà quote credibili.
 */
export function probabilita(lc, lo) {
  let p1 = 0, pX = 0, p2 = 0
  const tot = new Array(21).fill(0)
  for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) {
    const p = pPoisson(lc, a) * pPoisson(lo, b)
    if (a > b) p1 += p; else if (a === b) pX += p; else p2 += p
    tot[a + b] += p
  }
  const s = p1 + pX + p2
  const over = {}, under = {}
  for (const soglia of SOGLIE) {
    let o = 0
    for (let n = Math.ceil(soglia); n <= 20; n++) o += tot[n]
    over[soglia] = o / s; under[soglia] = 1 - o / s
  }
  return { 1: p1 / s, X: pX / s, 2: p2 / s, over, under }
}
/** I gol attesi che il bookmaker dà a casa e ospite dalle loro forze (già col rumore). */
export function golAttesi(forzaCasa, forzaOspite) {
  const d = (forzaCasa + CAMPO - forzaOspite) / 100
  return { lc: GOL_MEDI * Math.exp(1.25 * d), lo: GOL_MEDI * Math.exp(-1.25 * d) }
}
const quota = (p) => Math.max(QUOTA_MINIMA, Math.round(100 / (p * (1 + MARGINE))) / 100)
/** Le quote dalle probabilità: margine, centesimi, mai sotto 1,05. */
export function quoteDa(P) {
  const q = { 1: quota(P[1]), X: quota(P.X), 2: quota(P[2]) }
  for (const s of SOGLIE) { q[`O${s}`] = quota(P.over[s]); q[`U${s}`] = quota(P.under[s]) }
  return q
}

// ── il tempo di gioco: 90' + recupero in 60 secondi ──────────────────────────
// primo tempo 0–27 s (0'–45'), intervallo 27–29,5 s, secondo tempo 29,5–57 s (45'–90'), recupero 57–60 s (90+1'…90+3')
export const T = { fine1: 27, via2: 29.5, fine2: 57, fine: 60 }
/** Il minuto da scrivere sul tabellone a t secondi: { min, extra, scritta } (scritta: «34'», «90+2'», «INT», «FINE»). */
export function minuto(t) {
  if (t < 0) return { min: 0, extra: 0, scritta: "0'" }
  if (t < T.fine1) { const m = Math.floor((t / T.fine1) * 45) + 1; return { min: m, extra: 0, scritta: `${m}'` } }
  if (t < T.via2) return { min: 45, extra: 0, scritta: 'INT', intervallo: true }
  if (t < T.fine2) { const m = 45 + Math.floor(((t - T.via2) / (T.fine2 - T.via2)) * 45) + 1; return { min: m, extra: 0, scritta: `${m}'` } }
  if (t < T.fine) { const e = Math.floor(((t - T.fine2) / (T.fine - T.fine2)) * 3) + 1; return { min: 90, extra: e, scritta: `90+${e}'` } }
  return { min: 90, extra: 3, scritta: 'FINE', finita: true }
}

// ── il meteo della città di casa, coerente col clima e con la stagione ──────
// Per ogni clima, mese per mese, quanto spesso c'è sereno, nuvole, pioggia, nebbia, neve, vento (pesi). Medie climatiche a
// occhio, non previsioni: a ottobre a Bergamo può piovere o esserci nebbia, a Palermo è sereno e caldo, al nord d'inverno
// può nevicare. È solo scena: il risultato non lo guarda.
const METEO = ['sereno', 'nuvole', 'pioggia', 'nebbia', 'neve', 'vento']
//                     ser nuv pio neb nev ven
const CLIMA = {
  nord: {
    inverno: [20, 25, 15, 28, 8, 4], primavera: [35, 30, 25, 4, 0, 6], estate: [60, 20, 14, 0, 0, 6], autunno: [25, 25, 22, 22, 1, 5],
    temp: { inverno: [0, 7], primavera: [10, 20], estate: [22, 33], autunno: [8, 18] },
  },
  alpi: {
    inverno: [35, 25, 5, 5, 28, 2], primavera: [35, 30, 20, 2, 8, 5], estate: [50, 25, 20, 0, 0, 5], autunno: [35, 25, 20, 5, 10, 5],
    temp: { inverno: [-4, 5], primavera: [6, 17], estate: [16, 28], autunno: [4, 15] },
  },
  liguria: {
    inverno: [35, 30, 25, 0, 2, 8], primavera: [40, 30, 22, 0, 0, 8], estate: [65, 20, 8, 0, 0, 7], autunno: [30, 25, 35, 0, 0, 10],
    temp: { inverno: [6, 12], primavera: [12, 20], estate: [22, 30], autunno: [11, 19] },
  },
  centro: {
    inverno: [35, 30, 22, 6, 2, 5], primavera: [45, 28, 20, 1, 0, 6], estate: [70, 18, 7, 0, 0, 5], autunno: [38, 25, 28, 4, 0, 5],
    temp: { inverno: [4, 12], primavera: [11, 21], estate: [22, 33], autunno: [10, 20] },
  },
  sud: {
    inverno: [45, 28, 18, 1, 1, 7], primavera: [58, 24, 11, 0, 0, 7], estate: [85, 10, 2, 0, 0, 3], autunno: [52, 24, 17, 0, 0, 7],
    temp: { inverno: [8, 15], primavera: [13, 23], estate: [24, 34], autunno: [14, 23] },
  },
}
const stagione = (mese) => (mese === 11 || mese <= 1 ? 'inverno' : mese <= 4 ? 'primavera' : mese <= 7 ? 'estate' : 'autunno')
// l'ora e il mese di Mantova (Europe/Rome) dell'istante
function oraRoma(ms) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', month: 'numeric', hour12: false }).formatToParts(new Date(ms))
  const v = (t) => Number(p.find((x) => x.type === t)?.value)
  return { ora: v('hour') % 24 + v('minute') / 60, mese: v('month') - 1 }
}
// tramonto e alba a occhio per l'Italia del nord, mese per mese (ora locale): basta per decidere se i riflettori sono accesi
const TRAMONTO = [17.0, 17.7, 18.3, 20.0, 20.6, 21.1, 21.1, 20.6, 19.7, 18.7, 17.0, 16.8]
const ALBA = [7.9, 7.4, 6.7, 6.8, 6.0, 5.6, 5.8, 6.3, 6.9, 7.4, 7.1, 7.8]
function meteoDi(squadra, inizio, rand) {
  const { ora, mese } = oraRoma(inizio)
  const c = CLIMA[squadra.clima], st = stagione(mese), pesi = c[st]
  let r = rand() * pesi.reduce((a, b) => a + b, 0), tipo = 'sereno'
  for (let i = 0; i < pesi.length; i++) { if (r < pesi[i]) { tipo = METEO[i]; break } r -= pesi[i] }
  const [tmin, tmax] = c.temp[st]
  // la temperatura: fra minima e massima della stagione, più fresca di notte e col maltempo
  let temp = tmin + (tmax - tmin) * (0.25 + 0.5 * rand())
  const notte = ora < ALBA[mese] || ora >= TRAMONTO[mese]
  const sera = !notte && ora >= TRAMONTO[mese] - 0.75 // la luce bassa prima del tramonto
  if (notte) temp -= 3
  if (tipo === 'pioggia' || tipo === 'nebbia') temp -= 2
  if (tipo === 'neve') temp = Math.min(temp, 1)
  return { tipo, temp: Math.round(temp), notte, sera, forza: 0.5 + rand() * 0.5, mese, ora }
}

// ── la partita ───────────────────────────────────────────────────────────────
const scene = new Map(), dalla = new Map(), pronte = new Map()
const tieni = (m, k, v, max) => { m.set(k, v); if (m.size > max) m.delete(m.keys().next().value) }
/** La scena della partita con quell'indice: squadre, quote, meteo, formazioni, maglie, le ultime cinque «uscite». */
export function scena(indice) {
  let p = scene.get(indice)
  if (!p) { p = costruisci(indice); tieni(scene, indice, p, 40) }
  return p
}
let avvisato = false
/**
 * (31.10) Quello che la banca dice di una partita (una voce del palinsesto: { indice, casa, ospite, quote, stato,
 * risultato?, eventi? }). Il risultato e gli eventi ci sono solo dal fischio d'inizio.
 */
export function dallaBanca(v) {
  if (!Number.isInteger(v?.indice)) return
  const s = scena(v.indice)
  if ((v.casa !== s.casa.id || v.ospite !== s.ospite.id) && !avvisato) { avvisato = true; console.warn('virtual: la scena del sito e quella della banca non sono la stessa partita', v.indice) }
  const prima = dalla.get(v.indice)
  if (prima?.eventi && !v.eventi) return // (la cronaca, una volta data, resta)
  tieni(dalla, v.indice, v, 40)
  pronte.delete(v.indice)
}
/**
 * La partita con quell'indice: la scena, con le quote, il risultato ufficiale e la cronaca (eventi con il secondo in cui
 * cadono) come li ha detti la banca. Finché la banca non ha dato la cronaca: risultato null, eventi [], cronaca false.
 */
export function partita(indice) {
  let p = pronte.get(indice)
  if (p) return p
  const s = scena(indice), b = dalla.get(indice)
  p = { ...s, quote: b?.quote ?? s.quote, risultato: b?.risultato ?? null, eventi: b?.eventi ?? [], cronaca: !!b?.eventi, stato: b?.stato ?? null }
  tieni(pronte, indice, p, 40)
  return p
}

function costruisci(indice) {
  const rand = generatore(semeScena(indice))
  const inizio = indice * CICLO + SCOMMESSE // il fischio d'inizio, in ms
  // le squadre: di solito A contro A o B contro B, una su sette un incrocio
  const A = SQUADRE.filter((s) => s.serie === SERIE_A), B = SQUADRE.filter((s) => s.serie === SERIE_B)
  const r = rand()
  let lista1, lista2
  if (r < 0.52) lista1 = lista2 = A
  else if (r < 0.86) lista1 = lista2 = B
  else if (rand() < 0.5) { lista1 = A; lista2 = B } else { lista1 = B; lista2 = A }
  const casa = lista1[Math.floor(rand() * lista1.length)]
  let ospite = lista2[Math.floor(rand() * lista2.length)]
  while (ospite === casa) ospite = lista2[Math.floor(rand() * lista2.length)]

  // le quote: dalla forza vera, col fattore campo e un filo di rumore (così due partite uguali non hanno quote identiche)
  const fc = casa.forza + (rand() - 0.5) * 6, fo = ospite.forza + (rand() - 0.5) * 6
  const { lc, lo } = golAttesi(fc, fo)
  const prob = probabilita(lc, lo)
  const quote = quoteDa(prob)

  const meteo = meteoDi(casa, inizio, rand)
  const formazioni = { casa: formazione(rand), ospite: formazione(rand) }
  const ultime = { casa: Array.from({ length: 5 }, () => 'VNP'[Math.floor(rand() * 3)]), ospite: Array.from({ length: 5 }, () => 'VNP'[Math.floor(rand() * 3)]) }
  // le maglie: gli ospiti giocano in trasferta se la loro prima maglia somiglia a quella di casa
  const maglie = { casa: { colori: casa.casa, disegno: casa.disegno }, ospite: simili(casa.casa, ospite.casa) ? { colori: ospite.fuori, disegno: 'pieno' } : { colori: ospite.casa, disegno: ospite.disegno } }
  if (simili(maglie.casa.colori, maglie.ospite.colori)) maglie.ospite = { colori: ospite.fuori, disegno: 'pieno' } // (fuori è sempre diversa da casa)
  const portieri = { casa: portiere(maglie.casa.colori, maglie.ospite.colori), ospite: portiere(maglie.ospite.colori, maglie.casa.colori) }

  return { indice, inizio, fine: inizio + DURATA, casa, ospite, forze: { casa: casa.forza, ospite: ospite.forza }, quote, prob, attesi: { casa: lc, ospite: lo }, meteo, formazioni, maglie, portieri, ultime }
}

// due maglie si somigliano se i colori principali sono vicini
const esa = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const vicini = (a, b) => { const [r1, g1, b1] = esa(a), [r2, g2, b2] = esa(b); return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < 150 }
const simili = (a, b) => vicini(a[0], b[0]) || (a[1] && b[0] && vicini(a[1], b[0]) && vicini(a[0], b[1] ?? b[0]))
// il portiere di un colore che non c'è nelle due squadre
const PORTIERI = ['#1a8a3a', '#e8742a', '#f2c230', '#8e44ad', '#7fc4ea', '#e889b4']
function portiere(nostri, loro) { return PORTIERI.find((c) => !nostri.some((n) => vicini(c, n)) && !loro.some((n) => vicini(c, n))) ?? '#8a8a8a' }

/** Cinque in campo e due in panchina, con numeri e cognomi inventati; [0] è il portiere. */
function formazione(rand) {
  const usati = new Set(), numeri = [1]
  while (numeri.length < 7) { const n = 2 + Math.floor(rand() * 22); if (!usati.has(n)) { usati.add(n); numeri.push(n) } }
  return numeri.map((n, i) => ({ n, nome: cognome(rand), ruolo: i === 0 ? 'P' : i <= 2 ? 'D' : i === 3 ? 'C' : i === 4 ? 'A' : 'R' }))
}

/** Il punteggio sul campo a t secondi (prima dell'eventuale sospensione). */
export function punteggioA(p, t) {
  let c = 0, o = 0
  for (const e of p.eventi) if (e.tipo === 'gol' && e.t <= t) { if (e.squadra === 'casa') c++; else o++ }
  return { casa: c, ospite: o }
}
/** Il risultato come si scrive: «2–1», «3–0 a tavolino». */
export const scriviRisultato = (r) => `${r.casa}–${r.ospite}${r.tavolino ? ' a tavolino' : ''}`
