// Il calendario e le partite di «Virtual», il campionato inventato di pzkko.it. Niente disegno qui: la finestra
// (virtual.js) e lo schermino (schermo.js) chiedono a questo modulo cosa succede, e la prova
// (tools/pzkko/virtual/prova.mjs) lo fa girare su migliaia di partite senza browser.
//
// IL TEMPO. Il tempo è diviso in cicli di cinque minuti allineati all'orologio: i primi quattro minuti del ciclo le
// scommesse sono aperte, l'ultimo minuto la partita è in diretta (90' più il recupero compressi in 60 secondi), allo
// scoccare del ciclo dopo è finita, si paga e si apre la successiva. L'indice della partita è Math.floor(Date.now() /
// 300000): da quell'indice, con un generatore seminato, escono le squadre, le quote, il meteo e tutta la cronaca. Così
// chiunque apra pzkko.it vede LA STESSA partita nello stesso momento, chi arriva a metà la vede dal punto giusto e
// ricaricare non cambia niente.
//
// LE QUOTE SEGUONO LA REALTÀ, I RISULTATI NO. Le quote si calcolano dalla forza vera delle squadre (squadre.js: le big
// alte, le neopromosse e la Serie B basse) con un fattore campo leggero e un pizzico di rumore dal seme, come farebbe un
// bookmaker: gol attesi dalla differenza di forza, probabilità di 1 X 2 e dei totali da una Poisson, un margine del
// 6,5%, arrotondate ai centesimi e mai sotto 1,05. Il risultato invece esce da una Poisson di media fissa (GOL_MEDI,
// 1,35 a squadra) uguale per tutte, che della forza non sa niente: la sfavorita vince quanto la favorita. È voluto, è la
// battuta del gioco. Anche il meteo è solo scena: non tocca il risultato.

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

// ── l'orologio del campionato ────────────────────────────────────────────────
export const indiceAdesso = (now = Date.now()) => Math.floor(now / CICLO)
/** Dove siamo nel ciclo: { indice, fase: 'scommesse' | 'partita', manca (ms alla chiusura o alla fine), t (secondi di partita, 0–60) }. */
export function fase(now = Date.now()) {
  const indice = Math.floor(now / CICLO), dentro = now - indice * CICLO
  if (dentro < SCOMMESSE) return { indice, fase: 'scommesse', manca: SCOMMESSE - dentro, t: 0 }
  return { indice, fase: 'partita', manca: CICLO - dentro, t: (dentro - SCOMMESSE) / 1000 }
}

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
// due semi diversi per la stessa partita: uno per squadre, quote e scena (che DEVONO dipendere dall'indice), uno a parte
// per il risultato. Così è anche evidente nel codice che il risultato non legge niente delle squadre
const semeScena = (indice) => (Math.imul(indice, 2654435761) ^ 0x5bd1e995) >>> 0
const semeRisultato = (indice) => (Math.imul(indice ^ 0x7f4a7c15, 1597334677) + 0x3c6ef372) >>> 0

/** Una Poisson di media `media`, con rand. */
export function poisson(media, rand) {
  const L = Math.exp(-media)
  let k = 0, p = rand()
  while (p > L) { k++; p *= rand() }
  return k
}

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
/** Il secondo di partita in cui cade il minuto m (1–93), con una frazione a caso dentro il minuto. */
function secondoDelMinuto(m, frazione = 0.5) {
  if (m <= 45) return ((m - 1 + frazione) / 45) * T.fine1
  if (m <= 90) return T.via2 + ((m - 46 + frazione) / 45) * (T.fine2 - T.via2)
  return T.fine2 + ((m - 91 + frazione) / 3) * (T.fine - T.fine2)
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

// ── le cause buffe della vittoria a tavolino ─────────────────────────────────
export const CAUSE = [
  'blackout dei riflettori', 'invasione di nutrie', 'il pallone è finito nel canale e non ce n\'era un altro', 'gli ospiti hanno sbagliato stadio',
  'l\'arbitro ha perso il fischietto', 'il bar dello stadio ha finito le brioche', 'un drone del fantacalcio sul campo', 'la squadra di casa è rimasta chiusa negli spogliatoi',
]
const CAUSA_NEBBIA = 'nebbia fitta: non si vede la porta'

// ── la partita ───────────────────────────────────────────────────────────────
const cache = new Map()
/**
 * La partita con quell'indice: squadre, quote, meteo, formazioni, le ultime cinque «uscite» inventate, il risultato
 * ufficiale e la cronaca (eventi con il secondo in cui cadono). Tutto dal seme: uguale per chiunque la chieda.
 */
export function partita(indice) {
  let p = cache.get(indice)
  if (p) return p
  p = costruisci(indice)
  if (cache.size > 40) cache.delete(cache.keys().next().value)
  cache.set(indice, p)
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

  // ── IL RISULTATO: dal suo seme, con la Poisson fissa. Non legge niente di quanto sopra ──
  const rr = generatore(semeRisultato(indice))
  const golCasa = poisson(GOL_MEDI, rr), golOspite = poisson(GOL_MEDI, rr)
  const tavolino = rr() < 1 / 120 ? (rr() < 0.5 ? 'casa' : 'ospite') : null

  // ── la cronaca: i gol veri messi al loro minuto, e intorno la scena (dal seme della scena) ──
  const eventi = cronaca({ golCasa, golOspite, tavolino, rand, formazioni, meteo })
  const risultato = tavolino ? { casa: tavolino === 'casa' ? 3 : 0, ospite: tavolino === 'ospite' ? 3 : 0, tavolino, causa: eventi.find((e) => e.tipo === 'sospesa').causa } : { casa: golCasa, ospite: golOspite, tavolino: null }
  // il punteggio sul campo, prima della sospensione (per il tabellone durante la partita)
  return { indice, inizio, fine: inizio + DURATA, casa, ospite, forze: { casa: casa.forza, ospite: ospite.forza }, quote, prob, attesi: { casa: lc, ospite: lo }, meteo, formazioni, maglie, portieri, ultime, risultato, eventi }
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

// Gli eventi della cronaca, ognuno con il secondo t in cui cade e quanto dura la sua messa in scena (dur). Tipi:
// inizio, intervallo, ripresa, fine, gol (squadra, chi, rigore?, punteggio), tiro (esito: fuori | palo | parata),
// rimessa, fallo, giallo, rosso, rigore (esito: parato | fuori: quelli segnati sono «gol» con rigore: true),
// infortunio (chi, entra), sospesa (causa). I grandi eventi stanno ad almeno 3,2 s l'uno dall'altro.
function cronaca({ golCasa, golOspite, tavolino, rand, formazioni, meteo }) {
  const ev = []
  const minutoLibero = (occupati, lontano = 2) => {
    for (let k = 0; k < 40; k++) {
      const m = 2 + Math.floor(rand() * 90) // 2..91
      if (occupati.every((o) => Math.abs(o - m) >= lontano)) return m
    }
    return 2 + Math.floor(rand() * 90)
  }
  const chi = (squadra, { noPortiere = true } = {}) => { const f = formazioni[squadra]; const i = noPortiere ? 1 + Math.floor(rand() * 4) : Math.floor(rand() * 5); return { i, n: f[i].n, nome: f[i].nome } }
  const grandi = [] // i minuti già presi dai grandi eventi
  // i gol
  const gol = []
  for (let i = 0; i < golCasa; i++) gol.push({ squadra: 'casa', m: minutoLibero(grandi, 3) });
  for (let i = 0; i < golOspite; i++) gol.push({ squadra: 'ospite', m: minutoLibero(grandi, 3) })
  for (const g of gol) grandi.push(g.m)
  gol.sort((a, b) => a.m - b.m)
  // il rigore: una partita su sette ne ha uno; se quella squadra ha segnato, uno dei suoi gol è su rigore, se no è sbagliato
  let rigoreSbagliato = null
  if (rand() < 0.14) {
    const sq = rand() < 0.5 ? 'casa' : 'ospite'
    const suoi = gol.filter((g) => g.squadra === sq)
    if (suoi.length && rand() < 0.75) suoi[Math.floor(rand() * suoi.length)].rigore = true
    else { const m = minutoLibero(grandi, 3); grandi.push(m); rigoreSbagliato = { squadra: sq, m, esito: rand() < 0.6 ? 'parato' : 'fuori' } }
  }
  // cartellini: gialli (in media 2,5, al più 4), un rosso una partita su quattordici
  const gialli = Math.min(4, poisson(2.5, rand))
  const cartellini = []
  const ammoniti = { casa: new Set(), ospite: new Set() }
  for (let i = 0; i < gialli; i++) {
    const sq = rand() < 0.5 ? 'casa' : 'ospite', c = chi(sq), m = minutoLibero(grandi, 3)
    grandi.push(m)
    cartellini.push({ tipo: 'giallo', squadra: sq, m, chi: c })
    ammoniti[sq].add(c.i)
  }
  let rosso = null
  if (rand() < 1 / 14) {
    const sq = rand() < 0.5 ? 'casa' : 'ospite', c = chi(sq), m = 15 + Math.floor(rand() * 70)
    grandi.push(m)
    rosso = { tipo: 'rosso', squadra: sq, m, chi: c, doppio: ammoniti[sq].has(c.i) && cartellini.some((k) => k.squadra === sq && k.chi.i === c.i && k.m < m) }
  }
  // l'infortunio: una su otto; esce in barella ed entra la riserva
  let infortunio = null
  if (rand() < 0.125) {
    const sq = rand() < 0.5 ? 'casa' : 'ospite', c = chi(sq), m = minutoLibero(grandi, 3)
    grandi.push(m)
    infortunio = { tipo: 'infortunio', squadra: sq, m, chi: c, entra: formazioni[sq][5 + Math.floor(rand() * 2)] }
  }
  // i quasi gol, le rimesse e i falli: la scena fra un grande evento e l'altro
  const piccoli = []
  const nTiri = 4 + poisson(3, rand), nRimesse = 2 + Math.floor(rand() * 3), nFalli = 2 + Math.floor(rand() * 3)
  const occupati = [...grandi]
  for (let i = 0; i < nTiri; i++) { const m = minutoLibero(occupati, 2); occupati.push(m); const r = rand(); piccoli.push({ tipo: 'tiro', squadra: rand() < 0.5 ? 'casa' : 'ospite', m, esito: r < 0.45 ? 'fuori' : r < 0.6 ? 'palo' : 'parata' }) }
  for (let i = 0; i < nRimesse; i++) { const m = minutoLibero(occupati, 2); occupati.push(m); piccoli.push({ tipo: 'rimessa', squadra: rand() < 0.5 ? 'casa' : 'ospite', m, lato: rand() < 0.5 ? 'alto' : 'basso' }) }
  for (let i = 0; i < nFalli; i++) { const m = minutoLibero(occupati, 2); occupati.push(m); piccoli.push({ tipo: 'fallo', squadra: rand() < 0.5 ? 'casa' : 'ospite', m }) }
  // con la pioggia qualcuno scivola (solo scena)
  if (meteo.tipo === 'pioggia') for (let i = 0; i < 1 + Math.floor(rand() * 2); i++) { const m = minutoLibero(occupati, 2); occupati.push(m); piccoli.push({ tipo: 'scivola', squadra: rand() < 0.5 ? 'casa' : 'ospite', m, chi: chi(rand() < 0.5 ? 'casa' : 'ospite') }) }

  // tutti insieme, in secondi, poi la sospensione se c'è
  let punteggio = { casa: 0, ospite: 0 }
  const tutti = []
  for (const g of gol) tutti.push({ tipo: 'gol', squadra: g.squadra, m: g.m, rigore: !!g.rigore, chi: chi(g.squadra) })
  if (rigoreSbagliato) tutti.push({ tipo: 'rigore', ...rigoreSbagliato, chi: chi(rigoreSbagliato.squadra) })
  tutti.push(...cartellini)
  if (rosso) tutti.push(rosso)
  if (infortunio) tutti.push(infortunio)
  tutti.push(...piccoli)
  for (const e of tutti) e.t = secondoDelMinuto(e.m, 0.15 + rand() * 0.7)
  tutti.sort((a, b) => a.t - b.t)
  // i grandi eventi ad almeno 3,2 s l'uno dall'altro, i piccoli ad almeno 1,2 s da tutto (spostati in avanti); un piccolo
  // evento che non ci sta più (la fine, l'intervallo) si lascia cadere, un grande si schiaccia all'indietro quanto basta
  const grande = (e) => ['gol', 'rigore', 'giallo', 'rosso', 'infortunio'].includes(e.tipo)
  const sistemati = []
  let ultimoGrande = -10, ultimo = 0.6 // (il primo evento dopo il fischio d'inizio)
  for (const e of tutti) {
    const minimo = grande(e) ? Math.max(ultimoGrande + 3.2, ultimo + 1.4) : ultimo + 1.2
    if (e.t < minimo) e.t = minimo
    // mai a cavallo dell'intervallo
    if (e.t > T.fine1 - 1.6 && e.t < T.via2 + 0.6) e.t = T.via2 + 0.6 + (e.t - (T.fine1 - 1.6)) * 0.2
    if (e.t > T.fine - 1.4) {
      if (!grande(e)) continue
      e.t = T.fine - 1.4
      // i grandi di prima arretrano, a catena, finché stanno a 3,2 s
      for (let j = sistemati.length - 1, lim = e.t; j >= 0; j--) { const g = sistemati[j]; if (!grande(g)) continue; if (g.t > lim - 3.2) g.t = lim - 3.2; lim = g.t }
    }
    sistemati.push(e)
    ultimo = e.t
    if (grande(e)) ultimoGrande = e.t
  }
  tutti.length = 0
  tutti.push(...sistemati)
  // (i piccoli che l'arretramento ha lasciato addosso a un grande si tolgono)
  for (let j = tutti.length - 1; j >= 0; j--) { const e = tutti[j]; if (grande(e)) continue; if (tutti.some((g) => g !== e && grande(g) && Math.abs(g.t - e.t) < 1.1)) tutti.splice(j, 1) }
  tutti.sort((a, b) => a.t - b.t)
  for (const e of tutti) { e.m = minuto(e.t).min; e.minuto = minuto(e.t).scritta }
  // il punteggio dopo ogni gol, i secondi gialli diventano l'espulsione già scritta
  for (const e of tutti) if (e.tipo === 'gol') { punteggio = { ...punteggio, [e.squadra]: punteggio[e.squadra] + 1 }; e.punteggio = punteggio }
  ev.push({ tipo: 'inizio', t: 0, dur: 1.2, minuto: "1'" })
  ev.push(...tutti)
  ev.push({ tipo: 'intervallo', t: T.fine1, dur: T.via2 - T.fine1, minuto: '45\'' }, { tipo: 'ripresa', t: T.via2, dur: 1, minuto: '46\'' })
  if (tavolino) {
    const ts = secondoDelMinuto(12 + Math.floor(rand() * 70), 0.5)
    const causa = meteo.tipo === 'nebbia' ? CAUSA_NEBBIA : CAUSE[Math.floor(rand() * CAUSE.length)]
    const prima = ev.filter((e) => e.t < ts - 1.5 || e.tipo === 'inizio')
    prima.push({ tipo: 'sospesa', t: Math.max(ts, 4), dur: T.fine - Math.max(ts, 4), minuto: minuto(ts).scritta, causa, aChi: tavolino })
    prima.sort((a, b) => a.t - b.t)
    for (const e of prima) e.dur ??= durata(e)
    return prima
  }
  ev.push({ tipo: 'fine', t: T.fine, dur: 10, minuto: 'FINE' })
  ev.sort((a, b) => a.t - b.t)
  for (const e of ev) e.dur ??= durata(e)
  return ev
}
/** Quanto dura la messa in scena di un evento, in secondi. */
export function durata(e) {
  switch (e.tipo) {
    case 'gol': return e.rigore ? 5.2 : 4.4
    case 'rigore': return 4.2
    case 'giallo': return 2.6
    case 'rosso': return 3.4
    case 'infortunio': return 3.6
    case 'tiro': return 1.1
    case 'rimessa': return 0.9
    case 'fallo': return 0.9
    case 'scivola': return 1
    default: return 1
  }
}

/** Il punteggio sul campo a t secondi (prima dell'eventuale sospensione). */
export function punteggioA(p, t) {
  let c = 0, o = 0
  for (const e of p.eventi) if (e.tipo === 'gol' && e.t <= t) { if (e.squadra === 'casa') c++; else o++ }
  return { casa: c, ospite: o }
}

/** Una puntata vince? (`id` di PUNTATE, sul risultato ufficiale, tavolino compreso). */
export function vince(id, risultato) {
  const { casa, ospite } = risultato, tot = casa + ospite
  if (id === '1') return casa > ospite
  if (id === 'X') return casa === ospite
  if (id === '2') return casa < ospite
  const s = Number(id.slice(1))
  return id[0] === 'O' ? tot > s : tot < s
}
/** Il risultato come si scrive: «2–1», «3–0 a tavolino». */
export const scriviRisultato = (r) => `${r.casa}–${r.ospite}${r.tavolino ? ' a tavolino' : ''}`
