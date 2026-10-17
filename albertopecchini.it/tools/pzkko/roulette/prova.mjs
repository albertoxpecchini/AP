#!/usr/bin/env node
// Le prove della roulette di pzkko.it, senza browser: la stessa ruota del gioco
// (pzkko/games/roulette/ruota.js, con il Rapier della pagina) gira N volte di
// fila in più thread, come nel gioco (la pallina salta fuori dalla casella, va
// sulla pista, corre, cade, si ferma), e per ogni giro si controlla:
//   - che la pallina non esca mai dalla ruota e si fermi in una casella vera,
//     che resti nella stessa casella mezzo secondo dopo, e che il numero sia
//     quello della casella sotto di lei;
//   - quanto corre sulla pista (secondi e giri) e quanto ci mette a fermarsi;
//   - fra un giro e l'altro passano da 2 a 8 secondi, come quando si punta;
//   - con delle puntate a caso, che le regole (regole.js) paghino come un conto
//     fatto qui in un altro modo (dalla geometria del tavolo e da 36/k − 1).
// Alla fine: la distribuzione dei 37 numeri (chi quadro), i tempi, gli errori.
//
//   node tools/pzkko/roulette/prova.mjs [giri=4122] [--thread=18] [--seme=4122]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'

const QUI = dirname(fileURLToPath(import.meta.url))
const GIOCO = join(QUI, '../../../pzkko/games/roulette')
const imp = (f) => import(pathToFileURL(join(GIOCO, f)).href)

// generatore seminato (le prove si possono rifare uguali)
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

if (isMainThread) {
  const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 4122)
  const T = Math.max(1, Number((process.argv.find((a) => a.startsWith('--thread=')) ?? '').split('=')[1]) || Math.min(18, os.cpus().length - 2))
  const SEME = Number((process.argv.find((a) => a.startsWith('--seme=')) ?? '').split('=')[1]) || 4122
  const quote = Array.from({ length: T }, (_, i) => Math.floor(N / T) + (i < N % T ? 1 : 0))
  console.log(`→ ${N} giri della ruota in ${T} thread…`)
  const t0 = Date.now()
  let fatti = 0
  const risultati = await Promise.all(quote.map((n, i) => new Promise((ok, ko) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { n, seme: SEME + i * 1000003 } })
    w.on('message', (m) => {
      if (m.giro) { fatti++; if (fatti % 200 === 0) console.log(`  ${fatti}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`) }
      if (m.fine) ok(m.fine)
    })
    w.on('error', ko)
  })))
  const giri = risultati.flatMap((r) => r.giri)
  const errori = risultati.flatMap((r) => r.errori)
  const conti = risultati.reduce((a, r) => a + r.conti, 0)
  const nonvale = risultati.flatMap((r) => r.nonvale)
  const differenze = risultati.flatMap((r) => r.differenze)

  // la distribuzione dei numeri
  const conta = new Array(37).fill(0)
  for (const g of giri) conta[g.esito]++
  const atteso = giri.length / 37
  const chi2 = conta.reduce((a, c) => a + (c - atteso) ** 2 / atteso, 0)
  const p = 1 - gammaP(36 / 2, chi2 / 2)
  // l'indipendenza: di quante caselle si sposta il numero da un giro al successivo (deve essere uniforme anche questo)
  const cd = new Array(37).fill(0)
  for (const d of differenze) cd[d]++
  const ad = differenze.length / 37
  const chi2d = cd.reduce((a, c) => a + (c - ad) ** 2 / ad, 0)
  const pd = 1 - gammaP(36 / 2, chi2d / 2)
  const stat = (k) => { const v = giri.map((g) => g[k]).sort((a, b) => a - b); return { min: v[0], mediana: v[v.length >> 1], max: v.at(-1), media: v.reduce((a, b) => a + b, 0) / v.length } }
  const f = (s, d = 1) => `min ${s.min.toFixed(d)} · mediana ${s.mediana.toFixed(d)} · media ${s.media.toFixed(d)} · max ${s.max.toFixed(d)}`
  const rapporto = {
    giri: giri.length, thread: T, secondi: (Date.now() - t0) / 1000,
    errori, nonvale: nonvale.length, spinte: giri.filter((g) => g.spinta).length,
    conti, chi2, p, conta, chi2d, pd,
    pista: stat('tPista'), giriPista: stat('giri'), fermata: stat('tTot'),
  }
  console.log(`\n${giri.length} giri validi in ${rapporto.secondi.toFixed(0)} s`)
  console.log(`errori: ${errori.length}${errori.length ? '\n  ' + errori.slice(0, 20).join('\n  ') : ''}`)
  console.log(`giri non validi (rifatti): ${nonvale.length}${nonvale.length ? ' — ' + JSON.stringify(nonvale.reduce((a, n) => ((a[n] = (a[n] ?? 0) + 1), a), {})) : ''}`)
  console.log(`spinte leggere (pallina in bilico dopo 45 s): ${rapporto.spinte}`)
  console.log(`sulla pista: ${f(rapporto.pista)} s;  giri sulla pista: ${f(rapporto.giriPista)};  ferma dopo: ${f(rapporto.fermata)} s`)
  console.log(`numeri: chi quadro ${chi2.toFixed(1)} con 36 gradi di libertà, p = ${p.toFixed(3)} (uniforme se p non è minuscolo)`)
  console.log(`  ${conta.map((c, n) => `${n}:${c}`).join(' ')}`)
  console.log(`da un giro al successivo (caselle di distanza sulla ruota, ${differenze.length} coppie): chi quadro ${chi2d.toFixed(1)}, p = ${pd.toFixed(3)}`)
  console.log(`conti delle vincite controllati: ${conti}`)
  await mkdir(join(QUI, '../lavoro'), { recursive: true })
  await writeFile(join(QUI, '../lavoro/prova-roulette.json'), JSON.stringify(rapporto, null, 1))
  if (errori.length) process.exit(1)
} else {
  const RAPIER = (await imp('lib/rapier.mjs')).default
  const { Ruota, NUMERI, N: NC, PALETTA, ROSSI } = await imp('ruota.js')
  const { PUNTATE, PUNTATE_PER_ID, esito } = await imp('regole.js')
  await RAPIER.init()
  const { n, seme } = workerData
  const rnd = mulberry(seme)
  const errori = [], giri = [], nonvale = [], differenze = []
  let prec = null
  let conti = 0

  // ── i controlli sulle regole (una volta per thread: costano poco) ──
  const ROSSI_A_MANO = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
  if (ROSSI_A_MANO.some((x) => !ROSSI.has(x)) || ROSSI.size !== 18) errori.push('i rossi non sono i 18 giusti')
  // sulla ruota i colori si alternano (tranne lo zero) e ci sono tutti i numeri una volta
  if (new Set(NUMERI).size !== 37 || NUMERI.length !== 37) errori.push('la ruota non ha 37 numeri diversi')
  for (let i = 1; i < 37; i++) {
    const a = NUMERI[i], b = NUMERI[(i % 36) + 1]
    if (i < 36 && ROSSI_A_MANO.includes(a) === ROSSI_A_MANO.includes(b)) errori.push(`colori non alternati sulla ruota: ${a} e ${b}`)
  }
  if (PUNTATE.length !== 157) errori.push(`le puntate sul tavolo sono ${PUNTATE.length}, non 157`)
  const pos = (x) => (x === 0 ? null : { r: Math.ceil(x / 3) - 1, c: (x - 1) % 3 })
  for (const p of PUNTATE) {
    const k = p.numeri.length
    // ogni puntata paga 36/k − 1: il banco tiene sempre 1/37
    if (p.paga !== 36 / k - 1) errori.push(`${p.id} paga ${p.paga}, dovrebbe ${36 / k - 1}`)
    // i numeri di una puntata interna devono stare vicini sul tavolo
    if (['cavallo', 'terzina', 'quartina', 'sestina'].includes(p.tipo)) {
      const ps = p.numeri.filter((x) => x > 0).map(pos)
      const rr = ps.map((q) => q.r), cc = ps.map((q) => q.c)
      const altR = Math.max(...rr) - Math.min(...rr), altC = Math.max(...cc) - Math.min(...cc)
      const ok = p.numeri.includes(0) ? Math.max(...rr) === 0 : { cavallo: altR + altC === 1, terzina: altR === 0 && altC === 2, quartina: altR === 1 && altC === 1, sestina: altR === 1 && altC === 2 }[p.tipo]
      if (!ok) errori.push(`${p.id}: numeri non vicini sul tavolo`)
    }
  }
  // il conto fatto in un altro modo: chi copre cosa, dalle regole del tavolo
  const copre = (p, x) => {
    switch (p.tipo) {
      case 'colonna': return x > 0 && (x - 1) % 3 === p.dove.c
      case 'dozzina': return x > 0 && Math.floor((x - 1) / 12) === p.dove.d
      case 'semplice': return x > 0 && { '1-18': x <= 18, '19-36': x >= 19, pari: x % 2 === 0, dispari: x % 2 === 1, rosso: ROSSI_A_MANO.includes(x), nero: !ROSSI_A_MANO.includes(x) }[p.id.split(':')[1]]
      default: return p.id.split(':')[1].split('-').map(Number).includes(x)
    }
  }
  const pagaTeorica = (p) => 36 / p.numeri.length - 1

  // ── la ruota: N giri di fila, come nel gioco ──
  let ruota = new Ruota(RAPIER, { rnd })
  for (let i = 0; i < 480; i++) ruota.passo()
  for (let g = 0; g < n; g++) {
    if (g > 0 && g % 60 === 0) { ruota = new Ruota(RAPIER, { rnd }); for (let i = 0; i < 480; i++) ruota.passo(); prec = null }
    // puntate a caso
    const giocate = new Map()
    const quante = 1 + Math.floor(rnd() * 12)
    for (let k = 0; k < quante; k++) { const p = PUNTATE[Math.floor(rnd() * PUNTATE.length)]; giocate.set(p.id, (giocate.get(p.id) ?? 0) + [1, 5, 25, 100, 500][Math.floor(rnd() * 5)]) }

    let risultato = null, tentativi = 0, tPista = null, giriPista = 0, tTot = 0, fuoriLimite = 0
    while (risultato === null) {
      // fra un giro e l'altro chi gioca punta: da 2 a 8 secondi (il rotore intanto gira)
      for (let i = 0, n = Math.floor(480 * (2 + 6 * rnd())); i < n; i++) ruota.passo()
      ruota.gira({ presa: 0.9 })
      tentativi++
      let k = 0, e = null
      while (e === null && k < 480 * 100) {
        e = ruota.passo(); k++
        if (ruota.stato === 'gira') {
          const p = ruota.pallina.translation(), rr = Math.hypot(p.x, p.z)
          if (rr > 0.4 || p.y > 0.158 || p.y < 0.035) fuoriLimite++
          if (tPista === null && rr < 0.345) { tPista = ruota.tGiro; giriPista = ruota.giri }
        }
      }
      if (e === 'nonvale' || e === null) { nonvale.push(e === null ? 'mai ferma' : ruota.ultimo); if (tentativi > 3) { errori.push(`giro ${g}: tre giri non validi di fila`); break } continue }
      risultato = e
      tTot = ruota.tGiro
    }
    if (risultato === null) continue
    // la pallina è davvero nella casella del numero?
    const p = ruota.pallina.translation(), rr = Math.hypot(p.x, p.z)
    if (!(rr > PALETTA.r0 && rr < PALETTA.r1 && p.y < PALETTA.y1)) errori.push(`giro ${g}: ferma fuori dalle caselle (r ${rr.toFixed(4)}, y ${p.y.toFixed(4)})`)
    if (NUMERI[ruota.casella()] !== risultato) errori.push(`giro ${g}: esce ${risultato} ma la pallina è sul ${NUMERI[ruota.casella()]}`)
    if (fuoriLimite) errori.push(`giro ${g}: la pallina è uscita dai limiti della ruota per ${fuoriLimite} passi`)
    // mezzo secondo dopo è ancora lì
    for (let i = 0; i < 240; i++) ruota.passo()
    if (NUMERI[ruota.casella()] !== risultato) errori.push(`giro ${g}: dopo mezzo secondo la pallina è passata dal ${risultato} al ${NUMERI[ruota.casella()]}`)
    // i conti
    const e = esito(giocate, risultato)
    let torna = 0, puntato = 0
    for (const [id, imp] of giocate) { const pt = PUNTATE_PER_ID.get(id); puntato += imp; if (copre(pt, risultato)) torna += imp * (pagaTeorica(pt) + 1) }
    if (e.torna !== torna || e.puntato !== puntato) errori.push(`giro ${g}: esce ${risultato}, le regole rendono ${e.torna} su ${e.puntato}, il conto a mano ${torna} su ${puntato}`)
    // e ogni puntata del tavolo, su questo numero
    for (const pt of PUNTATE) if (pt.numeri.includes(risultato) !== copre(pt, risultato)) errori.push(`giro ${g}: ${pt.id} sul ${risultato} non torna`)
    conti++
    if (prec !== null) differenze.push((NUMERI.indexOf(risultato) - NUMERI.indexOf(prec) + 37) % 37)
    prec = risultato
    giri.push({ esito: risultato, tPista: tPista ?? 0, giri: giriPista, tTot, spinta: ruota.spinta, tentativi })
    parentPort.postMessage({ giro: true })
  }
  parentPort.postMessage({ fine: { giri, errori, conti, nonvale, differenze } })
}

// P(a, x): la gamma incompleta regolarizzata (per il p del chi quadro)
function gammaP(a, x) {
  if (x <= 0) return 0
  const lg = lnGamma(a)
  if (x < a + 1) { let s = 1 / a, t = s; for (let n = 1; n < 500; n++) { t *= x / (a + n); s += t; if (t < s * 1e-14) break } return s * Math.exp(-x + a * Math.log(x) - lg) }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d
  for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break }
  return 1 - Math.exp(-x + a * Math.log(x) - lg) * h
}
function lnGamma(z) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z)
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
