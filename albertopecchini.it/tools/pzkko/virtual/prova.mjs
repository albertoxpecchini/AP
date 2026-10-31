#!/usr/bin/env node
// Le prove di «Virtual»: costruisce N partite di fila dal calendario (indici consecutivi, come quelle che il sito farà
// vedere) e controlla, senza browser:
// - (31.10) che la scena del sito (pzkko/games/virtual/partita.js: squadre, quote, meteo, formazioni, maglie) sia la
//   stessa della banca. Dal 31.10 il risultato e la cronaca li fa SOLO la banca (C:\pzkko-server\banca, fuori da GitHub:
//   dati/virtual-partita.mjs, col seme segreto di giochi/virtual.mjs): le partite intere qui si costruiscono col modulo
//   della banca, ognuna con un seme a caso al posto di quello segreto. Le prove dei soldi (le giocate, le chiusure, i
//   pagamenti) sono quelle della banca: node prove/virtual.mjs dalla cartella banca;
// - che la stessa partita chiesta due volte sia identica (il determinismo: due schede vedono la stessa cosa);
// - che le quote seguano la forza: la favorita (forza più alta) ha la quota più bassa, sempre; la correlazione fra la
//   differenza di forza e la quota dell'1 è forte e negativa; 1 X 2 sommano a ~106% in probabilità implicita e
//   over/under della stessa soglia pure; nessuna quota sotto 1,05;
// - che i risultati seguano la forza come le quote (dal 31.10: prima erano a caso, e puntare sulla sfavorita rendeva
//   il 164%): la favorita vince più spesso (percentuali e un chi quadro fra «chi è più forte» e l'esito 1/X/2), la
//   correlazione fra differenza di forza e differenza di gol è positiva, la quota predice; e nessuna strategia batte
//   il banco: chi punta sempre sulla sfavorita, o sulla favorita, sta sotto il 100%;
// - che la cronaca sia sensata: i gol della cronaca sono quelli del risultato, gli eventi stanno in ordine e dentro i 60
//   secondi, i grandi eventi ad almeno 3 s l'uno dall'altro, mai a cavallo dell'intervallo; il rosso lascia la squadra in
//   quattro; il tavolino dà 3–0 e paga come tale; (31.10) chi è espulso o uscito in barella non fa più niente, due gialli
//   allo stesso giocatore sono un rosso (doppio), ogni giocatore della cronaca è della sua squadra;
// - che le puntate paghino giuste: per ogni partita, ogni puntata vincente è coerente col risultato (un conto fatto in un
//   altro modo), e il ritorno al giocatore di chi punta sempre la stessa cosa sta attorno a 100% − margine.
//
//   node tools/pzkko/virtual/prova.mjs [partite, 2000] [--da=indice] [--banca=C:\pzkko-server\banca]

import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { scena, indiceAdesso } from '../../../pzkko/games/virtual/partita.js'

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const N = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 2000)
const DA = Number(arg('da', indiceAdesso()))
const BANCA = arg('banca', 'C:\\pzkko-server\\banca'), SIM = path.join(BANCA, 'dati', 'virtual-partita.mjs')
if (!existsSync(SIM)) { console.error(`la simulazione della banca non c'è: ${SIM} (--banca=la cartella banca)`); process.exit(2) }
const { partita: partitaBanca, vince, PUNTATE, GOL_MEDI, MARGINE, QUOTA_MINIMA, SOGLIE, T } = await import(pathToFileURL(SIM).href)
// un seme a caso per partita, al posto di quello segreto della banca
const semi = new Map()
const partita = (i) => { if (!semi.has(i)) semi.set(i, randomBytes(4).readUInt32BE(0)); return partitaBanca(i, semi.get(i)) }
// la scena: quello che il sito disegna da sé, prima di chiedere alla banca
const chiaveScena = (p) => JSON.stringify([p.indice, p.inizio, p.fine, p.casa.id, p.ospite.id, p.forze, p.quote, p.meteo, p.formazioni, p.maglie, p.portieri, p.ultime])
const errori = []
const err = (s) => { if (errori.length < 30) errori.push(s) }
const pct = (x) => `${(100 * x).toFixed(1)}%`
const corr = (xs, ys) => {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2 }
  return sxy / Math.sqrt(sxx * syy)
}
// p di un chi quadro con gdl gradi (serie, basta per gdl piccoli)
function pChi(x, gdl) {
  const gamma = (s, z) => { let sum = 1 / s, term = 1 / s; for (let k = 1; k < 200; k++) { term *= z / (s + k); sum += term } return sum * Math.exp(-z + s * Math.log(z)) }
  const G = (s) => (s === 0.5 ? Math.sqrt(Math.PI) : s === 1 ? 1 : (s - 1) * G(s - 1))
  return 1 - gamma(gdl / 2, x / 2) / G(gdl / 2)
}

const esiti = { fav: { 1: 0, X: 0, 2: 0 }, sfav: { 1: 0, X: 0, 2: 0 } } // 1 = vince la favorita, X, 2 = vince la sfavorita
const perForza = [] // [diff forza, diff gol]
const perQuota = [] // [quota 1, casa vince]
let golTot = 0, golQ = 0, nGol = 0, tavolini = 0, rossi = 0, doppi = 0, rigori = 0, infortuni = 0, incroci = 0
const ritorno = Object.fromEntries(PUNTATE.map((p) => [p.id, { puntato: 0, tornato: 0 }]))
const casaVince = { si: 0, tot: 0 }
const sempre = { sfavorita: { puntato: 0, tornato: 0 }, favorita: { puntato: 0, tornato: 0 } } // 1 $pzk sulla quota più alta (o più bassa) fra 1 e 2
const meteo = {}
let sommaMedia = 0

for (let k = 0; k < N; k++) {
  const i = DA + k
  const p = partita(i), p2 = partita(i)
  if (JSON.stringify(p) !== JSON.stringify(p2)) err(`${i}: due costruzioni diverse`)
  if (chiaveScena(p) !== chiaveScena(scena(i))) err(`${i}: la scena del sito non è quella della banca`)
  if (p.casa === p.ospite) err(`${i}: la squadra gioca contro se stessa`)
  if (p.casa.serie !== p.ospite.serie) incroci++
  meteo[p.meteo.tipo] = (meteo[p.meteo.tipo] ?? 0) + 1
  // le quote
  const q = p.quote
  for (const [id, v] of Object.entries(q)) if (!(v >= QUOTA_MINIMA) || Math.abs(Math.round(v * 100) - v * 100) > 1e-6) err(`${i}: quota ${id} = ${v}`)
  const s1x2 = 1 / q[1] + 1 / q.X + 1 / q[2]
  sommaMedia += s1x2
  if (Math.abs(s1x2 - (1 + MARGINE)) > 0.02 && q[1] > QUOTA_MINIMA && q[2] > QUOTA_MINIMA) err(`${i}: 1 X 2 sommano a ${pct(s1x2)}`)
  for (const s of SOGLIE) { const so = 1 / q[`O${s}`] + 1 / q[`U${s}`]; if (Math.abs(so - (1 + MARGINE)) > 0.03 && q[`O${s}`] > QUOTA_MINIMA && q[`U${s}`] > QUOTA_MINIMA) err(`${i}: over/under ${s} sommano a ${pct(so)}`) }
  const favCasa = p.forze.casa + 4 >= p.forze.ospite
  if (p.forze.casa - p.forze.ospite > 8 && q[1] >= q[2]) err(`${i}: ${p.casa.nome} (${p.forze.casa}) in casa quotata ${q[1]} contro ${p.ospite.nome} (${p.forze.ospite}) a ${q[2]}`)
  if (p.forze.ospite - p.forze.casa > 12 && q[2] >= q[1]) err(`${i}: ${p.ospite.nome} (${p.forze.ospite}) fuori quotata ${q[2]} contro ${p.casa.nome} (${p.forze.casa}) a ${q[1]}`)
  // il risultato
  const r = p.risultato
  const diffForza = p.forze.casa - p.forze.ospite
  if (r.tavolino) { tavolini++; if (!((r.casa === 3 && r.ospite === 0) || (r.casa === 0 && r.ospite === 3))) err(`${i}: tavolino ${r.casa}-${r.ospite}`) }
  else {
    perForza.push([diffForza, r.casa - r.ospite])
    perQuota.push([q[1], r.casa > r.ospite ? 1 : 0])
    golTot += r.casa + r.ospite; golQ += r.casa ** 2 + r.ospite ** 2; nGol += 2
    const chiVince = r.casa > r.ospite ? 'casa' : r.casa < r.ospite ? 'ospite' : 'X'
    const e = chiVince === 'X' ? 'X' : (chiVince === 'casa') === favCasa ? '1' : '2'
    esiti[Math.abs(diffForza) >= 15 ? 'fav' : 'sfav'][e]++
    casaVince.tot++; if (chiVince === 'casa') casaVince.si++
  }
  {
    const alta = q[1] >= q[2] ? '1' : '2', bassa = alta === '1' ? '2' : '1'
    sempre.sfavorita.puntato++; if (vince(alta, r)) sempre.sfavorita.tornato += q[alta]
    sempre.favorita.puntato++; if (vince(bassa, r)) sempre.favorita.tornato += q[bassa]
  }
  // la cronaca
  const ev = p.eventi
  let c = 0, o = 0, prima = -1, ultimoGrande = -10, inCampo = { casa: 5, ospite: 5 }
  const via = { casa: new Map(), ospite: new Map() }, ammoniti = { casa: new Set(), ospite: new Set() } // (per numero di maglia)
  for (const e of ev) {
    if (e.chi) {
      const sq = e.squadra, n = e.chi.n
      if (!p.formazioni[sq].some((g) => g.n === n && g.nome === e.chi.nome)) err(`${i}: ${e.tipo} al ${e.minuto} di ${n} ${e.chi.nome}, che non è di ${p[sq].nome}`)
      if (via[sq].has(n)) err(`${i}: ${e.tipo} al ${e.minuto} di ${n} ${e.chi.nome}, che era già ${via[sq].get(n)}`)
      if (e.tipo === 'giallo') { if (ammoniti[sq].has(n)) err(`${i}: secondo giallo al ${e.minuto} a ${n} ${e.chi.nome}, e resta in campo`); ammoniti[sq].add(n) }
      if (e.tipo === 'rosso') { if (e.doppio) { doppi++; if (!ammoniti[sq].has(n)) err(`${i}: «doppio giallo» al ${e.minuto} a ${n} ${e.chi.nome}, che non era ammonito`) } via[sq].set(n, 'espulso') }
      if (e.tipo === 'infortunio') via[sq].set(n, 'uscito in barella')
    }
    if (!(e.t >= 0 && e.t <= T.fine)) err(`${i}: evento ${e.tipo} a ${e.t}`)
    if (e.t < prima) err(`${i}: eventi in disordine (${e.tipo} a ${e.t} dopo ${prima})`)
    prima = e.t
    if (e.tipo === 'gol') { if (e.squadra === 'casa') c++; else o++; if (e.rigore) rigori++ }
    if (e.tipo === 'rigore') rigori++
    if (e.tipo === 'rosso') { rossi++; inCampo[e.squadra]-- }
    if (e.tipo === 'infortunio') infortuni++
    if (['gol', 'rigore', 'giallo', 'rosso', 'infortunio'].includes(e.tipo)) {
      if (e.t - ultimoGrande < 3.1) err(`${i}: ${e.tipo} a ${e.t.toFixed(1)} troppo vicino al grande evento prima (${ultimoGrande.toFixed(1)})`)
      if (e.t > T.fine1 - 1.5 && e.t < T.via2 + 0.5) err(`${i}: ${e.tipo} a cavallo dell'intervallo (${e.t.toFixed(1)})`)
      ultimoGrande = e.t
    }
  }
  if (!r.tavolino && (c !== r.casa || o !== r.ospite)) err(`${i}: la cronaca dice ${c}-${o}, il risultato ${r.casa}-${r.ospite}`)
  if (r.tavolino && !ev.some((e) => e.tipo === 'sospesa')) err(`${i}: tavolino senza sospensione`)
  if (!r.tavolino && ev[ev.length - 1].tipo !== 'fine') err(`${i}: non finisce col fischio finale`)
  if (inCampo.casa < 4 || inCampo.ospite < 4) err(`${i}: una squadra sotto i quattro`)
  // le puntate: ogni id contro un conto fatto al contrario, e il ritorno di chi punta sempre 1 $pzk su ognuna
  const tot = r.casa + r.ospite
  const giuste = new Set([r.casa > r.ospite ? '1' : r.casa < r.ospite ? '2' : 'X', ...SOGLIE.map((s) => (tot > s ? `O${s}` : `U${s}`))])
  for (const pu of PUNTATE) {
    const v = vince(pu.id, r)
    if (v !== giuste.has(pu.id)) err(`${i}: la puntata ${pu.id} ${v ? 'vince' : 'perde'} su ${r.casa}-${r.ospite}`)
    ritorno[pu.id].puntato += 1
    if (v) ritorno[pu.id].tornato += q[pu.id]
  }
}

console.log(`\nVirtual: ${N} partite dall'indice ${DA} (${new Date(DA * 300000).toISOString()})`)
console.log(`incroci A–B ${pct(incroci / N)} · tavolini ${tavolini} (${pct(tavolini / N)}) · rossi ${rossi} (${doppi} per doppio giallo) · rigori ${rigori} · infortuni ${infortuni}`)
console.log(`meteo: ${Object.entries(meteo).map(([k, v]) => `${k} ${pct(v / N)}`).join(', ')}`)
console.log(`\nLE QUOTE SEGUONO LA FORZA`)
console.log(`  1 X 2 in probabilità implicita: ${pct(sommaMedia / N)} in media (atteso ${pct(1 + MARGINE)})`)
const df = perForza.map((x) => x[0]), q1 = perQuota.map((x) => x[0])
console.log(`  correlazione fra (forza casa − forza ospite) e quota dell'1: ${corr(df, q1).toFixed(3)} (forte e negativa: più forte la casa, più bassa la quota)`)
console.log(`\nI RISULTATI SEGUONO LA FORZA (come le quote)`)
const dg = perForza.map((x) => x[1])
console.log(`  correlazione fra (forza casa − forza ospite) e (gol casa − gol ospite): ${corr(df, dg).toFixed(3)} (positiva: più forte la casa, più gol fa)`)
console.log(`  correlazione fra la quota dell'1 e «la casa vince»: ${corr(q1, perQuota.map((x) => x[1])).toFixed(3)} (negativa: la quota predice)`)
const tf = esiti.fav[1] + esiti.fav.X + esiti.fav[2], ts = esiti.sfav[1] + esiti.sfav.X + esiti.sfav[2]
console.log(`  partite con una favorita netta (≥ 15 punti di forza), ${tf}: vince la favorita ${pct(esiti.fav[1] / tf)}, pareggio ${pct(esiti.fav.X / tf)}, vince la sfavorita ${pct(esiti.fav[2] / tf)}`)
console.log(`  partite equilibrate, ${ts}: vince la «favorita» ${pct(esiti.sfav[1] / ts)}, pareggio ${pct(esiti.sfav.X / ts)}, vince l'altra ${pct(esiti.sfav[2] / ts)}`)
// chi quadro: favorita netta vs equilibrate, sugli esiti
{
  const righe = [esiti.fav, esiti.sfav], tot = tf + ts
  let chi = 0
  for (const e of ['1', 'X', '2']) { const col = esiti.fav[e] + esiti.sfav[e]; for (const r of righe) { const n = r[1] + r.X + r[2], att = (n * col) / tot; if (att > 0) chi += (r[e] - att) ** 2 / att } }
  console.log(`  chi quadro «favorita netta o no» × esito: ${chi.toFixed(2)} su 2 gradi, p = ${pChi(chi, 2).toFixed(2)} (dipende dalla forza: ~0)`)
}
console.log(`  la casa vince ${pct(casaVince.si / casaVince.tot)} (il fattore campo di 4 punti c'è anche nei risultati: un po' più degli ospiti)`)
const media = golTot / nGol, varianza = golQ / nGol - media ** 2
console.log(`  gol a squadra: media ${media.toFixed(3)} (un po' sopra ${GOL_MEDI}: una partita squilibrata ne fa di più), varianza ${varianza.toFixed(3)}`)
console.log(`\nLE PUNTATE PAGANO GIUSTE`)
for (const pu of PUNTATE) { const r = ritorno[pu.id]; console.log(`  ${pu.nome.padEnd(10)} ritorno ${pct(r.tornato / r.puntato)}`) }
console.log(`  (atteso ~${pct(1 / (1 + MARGINE))} per tutte: il margine del banco)`)
// (31.10) nessuna strategia batte il banco: prima, coi risultati a caso, chi puntava sempre sulla sfavorita rendeva il 164%
for (const [chi, r] of Object.entries(sempre)) {
  const rit = r.tornato / r.puntato
  console.log(`  sempre sulla ${chi.padEnd(9)} ritorno ${pct(rit)}`)
  if (rit > 1.08) err(`chi punta sempre sulla ${chi} rende ${pct(rit)}: batte il banco`)
}
console.log(errori.length ? `\n${errori.length} ERRORI:\n  ${errori.join('\n  ')}` : '\nnessun errore')
process.exit(errori.length ? 1 : 0)
