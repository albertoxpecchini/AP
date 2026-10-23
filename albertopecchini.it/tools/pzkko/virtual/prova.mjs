#!/usr/bin/env node
// Le prove di «Virtual» (pzkko/games/virtual/partita.js): costruisce N partite di fila dal calendario (indici
// consecutivi, come quelle che il sito farà vedere) e controlla, senza browser:
// - che la stessa partita chiesta due volte sia identica (il determinismo: due schede vedono la stessa cosa);
// - che le quote seguano la forza: la favorita (forza più alta) ha la quota più bassa, sempre; la correlazione fra la
//   differenza di forza e la quota dell'1 è forte e negativa; 1 X 2 sommano a ~106% in probabilità implicita e
//   over/under della stessa soglia pure; nessuna quota sotto 1,05;
// - che i risultati NON dipendano dalla forza: la favorita vince quanto la sfavorita (percentuali e un chi quadro
//   fra «chi è più forte» e l'esito 1/X/2), la correlazione fra differenza di forza e differenza di gol è ~0, i gol a
//   squadra fanno in media GOL_MEDI con la varianza di una Poisson, la quota non predice niente;
// - che la cronaca sia sensata: i gol della cronaca sono quelli del risultato, gli eventi stanno in ordine e dentro i 60
//   secondi, i grandi eventi ad almeno 3 s l'uno dall'altro, mai a cavallo dell'intervallo; il rosso lascia la squadra in
//   quattro; il tavolino dà 3–0 e paga come tale;
// - che le puntate paghino giuste: per ogni partita, ogni puntata vincente è coerente col risultato (un conto fatto in un
//   altro modo), e il ritorno al giocatore di chi punta sempre la stessa cosa sta attorno a 100% − margine.
//
//   node tools/pzkko/virtual/prova.mjs [partite, 2000] [--da=indice]

import { partita, vince, PUNTATE, GOL_MEDI, MARGINE, QUOTA_MINIMA, SOGLIE, T, indiceAdesso } from '../../../pzkko/games/virtual/partita.js'

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d }
const N = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 2000)
const DA = Number(arg('da', indiceAdesso()))
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
let golTot = 0, golQ = 0, nGol = 0, tavolini = 0, rossi = 0, rigori = 0, infortuni = 0, incroci = 0
const ritorno = Object.fromEntries(PUNTATE.map((p) => [p.id, { puntato: 0, tornato: 0 }]))
const casaVince = { si: 0, tot: 0 }
const meteo = {}
let sommaMedia = 0

for (let k = 0; k < N; k++) {
  const i = DA + k
  const p = partita(i), p2 = partita(i)
  if (JSON.stringify(p) !== JSON.stringify(p2)) err(`${i}: due costruzioni diverse`)
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
  // la cronaca
  const ev = p.eventi
  let c = 0, o = 0, prima = -1, ultimoGrande = -10, inCampo = { casa: 5, ospite: 5 }
  for (const e of ev) {
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
console.log(`incroci A–B ${pct(incroci / N)} · tavolini ${tavolini} (${pct(tavolini / N)}) · rossi ${rossi} · rigori ${rigori} · infortuni ${infortuni}`)
console.log(`meteo: ${Object.entries(meteo).map(([k, v]) => `${k} ${pct(v / N)}`).join(', ')}`)
console.log(`\nLE QUOTE SEGUONO LA FORZA`)
console.log(`  1 X 2 in probabilità implicita: ${pct(sommaMedia / N)} in media (atteso ${pct(1 + MARGINE)})`)
const df = perForza.map((x) => x[0]), q1 = perQuota.map((x) => x[0])
console.log(`  correlazione fra (forza casa − forza ospite) e quota dell'1: ${corr(df, q1).toFixed(3)} (forte e negativa: più forte la casa, più bassa la quota)`)
console.log(`\nI RISULTATI NON DIPENDONO DALLA FORZA`)
const dg = perForza.map((x) => x[1])
console.log(`  correlazione fra (forza casa − forza ospite) e (gol casa − gol ospite): ${corr(df, dg).toFixed(3)} (atteso ~0)`)
console.log(`  correlazione fra la quota dell'1 e «la casa vince»: ${corr(q1, perQuota.map((x) => x[1])).toFixed(3)} (atteso ~0: la quota non predice niente)`)
const tf = esiti.fav[1] + esiti.fav.X + esiti.fav[2], ts = esiti.sfav[1] + esiti.sfav.X + esiti.sfav[2]
console.log(`  partite con una favorita netta (≥ 15 punti di forza), ${tf}: vince la favorita ${pct(esiti.fav[1] / tf)}, pareggio ${pct(esiti.fav.X / tf)}, vince la sfavorita ${pct(esiti.fav[2] / tf)}`)
console.log(`  partite equilibrate, ${ts}: vince la «favorita» ${pct(esiti.sfav[1] / ts)}, pareggio ${pct(esiti.sfav.X / ts)}, vince l'altra ${pct(esiti.sfav[2] / ts)}`)
// chi quadro: favorita netta vs equilibrate, sugli esiti
{
  const righe = [esiti.fav, esiti.sfav], tot = tf + ts
  let chi = 0
  for (const e of ['1', 'X', '2']) { const col = esiti.fav[e] + esiti.sfav[e]; for (const r of righe) { const n = r[1] + r.X + r[2], att = (n * col) / tot; if (att > 0) chi += (r[e] - att) ** 2 / att } }
  console.log(`  chi quadro «favorita netta o no» × esito: ${chi.toFixed(2)} su 2 gradi, p = ${pChi(chi, 2).toFixed(2)} (se dipendesse dalla forza sarebbe ~0)`)
}
console.log(`  la casa vince ${pct(casaVince.si / casaVince.tot)} (nessun fattore campo nei risultati: quanto gli ospiti, 36,1% per due Poisson di media 1,35)`)
const media = golTot / nGol, varianza = golQ / nGol - media ** 2
console.log(`  gol a squadra: media ${media.toFixed(3)} (atteso ${GOL_MEDI}), varianza ${varianza.toFixed(3)} (Poisson: uguale alla media)`)
console.log(`\nLE PUNTATE PAGANO GIUSTE`)
for (const pu of PUNTATE) { const r = ritorno[pu.id]; console.log(`  ${pu.nome.padEnd(10)} ritorno ${pct(r.tornato / r.puntato)}`) }
console.log(`  (chi punta a caso sulle quote «vere» con risultati a caso: la favorita paga poco e vince come l'altra, quindi sull'1 e sul 2 il ritorno dipende da chi si sceglie; over/under ~${pct(1 / (1 + MARGINE))})`)
console.log(errori.length ? `\n${errori.length} ERRORI:\n  ${errori.join('\n  ')}` : '\nnessun errore')
process.exit(errori.length ? 1 : 0)
