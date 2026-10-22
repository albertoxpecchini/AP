#!/usr/bin/env node
// Le prove di testa o croce di pzkko.it, senza browser: la stessa moneta del gioco
// (pzkko/games/moneta/lancio.js, con il Rapier della roulette) si lancia N volte di
// fila in più thread, come nel gioco (sale dal fondo, il pollice la tira su, vola,
// cade nel piatto, rimbalza, rotola, si ferma; il lancio dopo parte da dov'è), e
// per ogni lancio si controlla:
//   - che la moneta non esca mai dal piatto e non passi sotto il fondo;
//   - che quando si dice ferma sia piatta, e che mezzo secondo dopo sia ancora
//     ferma con la stessa faccia in su;
//   - quanto sale, quanti giri fa, quante volte rimbalza, quanto ci mette;
//   - i lanci che non valgono (appoggiata al bordo, o che non si ferma), rifatti.
// Alla fine: testa contro croce (chi quadro), quante volte esce la faccia che
// stava in su prima del lancio e quante volte la stessa del lancio prima (devono
// essere metà e metà anche quelle: niente memoria), quante volte quella in su
// quando il pollice la lascia (la preferenza della fisica, che il mezzo giro a
// caso del pollice pareggia), i tempi, gli errori.
//
//   node tools/pzkko/moneta/prova.mjs [lanci=10000] [--thread=18] [--seme=4122]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'

const QUI = dirname(fileURLToPath(import.meta.url))
const GIOCHI = join(QUI, '../../../pzkko/games')
const imp = (f) => import(pathToFileURL(join(GIOCHI, f)).href)

// generatore seminato (le prove si possono rifare uguali)
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

if (isMainThread) {
  const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 10000)
  const T = Math.max(1, Number((process.argv.find((a) => a.startsWith('--thread=')) ?? '').split('=')[1]) || Math.min(18, os.cpus().length - 2))
  const SEME = Number((process.argv.find((a) => a.startsWith('--seme=')) ?? '').split('=')[1]) || 4122
  const quote = Array.from({ length: T }, (_, i) => Math.floor(N / T) + (i < N % T ? 1 : 0))
  console.log(`→ ${N} lanci della moneta in ${T} thread…`)
  const t0 = Date.now()
  let fatti = 0
  const risultati = await Promise.all(quote.map((n, i) => new Promise((ok, ko) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { n, seme: SEME + i * 1000003 } })
    w.on('message', (m) => {
      if (m.lancio) { fatti++; if (fatti % 1000 === 0) console.log(`  ${fatti}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`) }
      if (m.fine) ok(m.fine)
    })
    w.on('error', ko)
  })))
  const lanci = risultati.flatMap((r) => r.lanci)
  const errori = risultati.flatMap((r) => r.errori)
  const nonvale = risultati.flatMap((r) => r.nonvale)
  const n = lanci.length
  const testa = lanci.filter((l) => l.esito === 'testa').length
  // testa contro croce: chi quadro con 1 grado di libertà; p = erfc(√(χ²/2))
  const chi = (k, tot) => ((k - tot / 2) ** 2) / (tot / 2) * 2
  const p1 = (x) => erfc(Math.sqrt(x / 2))
  const stessaPrima = lanci.filter((l) => l.esito === l.prima).length
  const stessaPartenza = lanci.filter((l) => l.esito === l.partenza).length
  const coppie = risultati.reduce((a, r) => a + r.coppie, 0), uguali = risultati.reduce((a, r) => a + r.uguali, 0)
  const stat = (k) => { const v = lanci.map((g) => g[k]).sort((a, b) => a - b); return { min: v[0], mediana: v[v.length >> 1], max: v.at(-1), media: v.reduce((a, b) => a + b, 0) / v.length } }
  const f = (s, d = 2) => `min ${s.min.toFixed(d)} · mediana ${s.mediana.toFixed(d)} · media ${s.media.toFixed(d)} · max ${s.max.toFixed(d)}`
  const rapporto = {
    lanci: n, thread: T, secondi: (Date.now() - t0) / 1000, seme: SEME,
    errori, nonvale: nonvale.length, perche: nonvale.reduce((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {}),
    testa, croce: n - testa, chi2: chi(testa, n), p: p1(chi(testa, n)),
    stessaPrima, pPrima: p1(chi(stessaPrima, n)), stessaPartenza, pPartenza: p1(chi(stessaPartenza, n)), coppie, uguali, pUguali: p1(chi(uguali, coppie)),
    tempo: stat('t'), alto: stat('alto'), giri: stat('giri'), rimbalzi: stat('rimbalzi'),
    fotogrammi: risultati.reduce((a, r) => a + r.fotogrammi, 0), affonda: risultati.reduce((a, r) => a + r.affonda, 0), dentro: Math.max(...risultati.map((r) => r.dentro)),
  }
  const pc = (k, tot) => `${((100 * k) / tot).toFixed(2)}%`
  console.log(`\n${n} lanci validi in ${rapporto.secondi.toFixed(0)} s`)
  console.log(`errori: ${errori.length}${errori.length ? '\n  ' + errori.slice(0, 20).join('\n  ') : ''}`)
  console.log(`lanci non validi (rifatti): ${nonvale.length}${nonvale.length ? ' — ' + JSON.stringify(rapporto.perche) : ''}`)
  console.log(`testa ${testa} (${pc(testa, n)}), croce ${n - testa} (${pc(n - testa, n)}): chi quadro ${rapporto.chi2.toFixed(2)}, p = ${rapporto.p.toFixed(3)} (giusta se p non è minuscolo)`)
  console.log(`esce la faccia che era in su prima del lancio: ${pc(stessaPrima, n)}, p = ${rapporto.pPrima.toFixed(3)}`)
  console.log(`(la fisica da sola: esce la faccia in su quando il pollice la lascia ${pc(stessaPartenza, n)}, p = ${rapporto.pPartenza.toFixed(3)}; il mezzo giro a caso del pollice la pareggia)`)
  console.log(`esce la stessa del lancio prima: ${pc(uguali, coppie)} su ${coppie} coppie, p = ${rapporto.pUguali.toFixed(3)}`)
  console.log(`sale fino a ${f(rapporto.alto, 3)} m sul foglio`)
  console.log(`giri in aria e sul piatto: ${f(rapporto.giri, 1)};  rimbalzi: ${f(rapporto.rimbalzi, 0)}`)
  console.log(`fotogrammi col bordo più di 1 mm dentro il legno: ${pc(rapporto.affonda, rapporto.fotogrammi)} (al più ${(rapporto.dentro * 1000).toFixed(1)} mm, per un attimo)`)
  console.log(`ferma dopo: ${f(rapporto.tempo)} s (dal lancio, compresa la salita dal fondo)`)
  await mkdir(join(QUI, '../lavoro'), { recursive: true })
  await writeFile(join(QUI, '../lavoro/prova-moneta.json'), JSON.stringify(rapporto, null, 1))
  if (errori.length) process.exit(1)
} else {
  const RAPIER = (await imp('roulette/lib/rapier.mjs')).default
  const { Moneta, FISICA, FONDO, BORDO, MONETA } = await imp('moneta/lancio.js')
  await RAPIER.init()
  const { n, seme } = workerData
  const rnd = mulberry(seme)
  const m = new Moneta(RAPIER, { rnd })
  const errori = [], lanci = [], nonvale = []
  let coppie = 0, uguali = 0, precedente = null, fotogrammi = 0, affonda = 0, dentro = 0
  for (let i = 0; i < n; i++) {
    const prima = m.faccia()
    let tentativi = 0, esito = null, alto = 0, t = 0
    while (!esito) {
      if (++tentativi > 10) { errori.push(`lancio ${i}: dieci lanci di fila non validi`); break }
      m.lancia()
      alto = 0
      for (let k = 0; ; k++) {
        const e = m.passo()
        const p = m.pose().p
        alto = Math.max(alto, p.y)
        const r = Math.hypot(p.x, p.z)
        // fuori dal piatto, o col centro sotto il fondo (passata attraverso); di quanto il bordo entra nel legno (il motore
        // lo tollera per un attimo negli urti e mentre ondeggia), un fotogramma ogni 10 passi
        if (r > BORDO || p.y < FONDO.y) { errori.push(`lancio ${i}: la moneta è uscita (r ${(r * 1000).toFixed(1)} mm, y ${(p.y * 1000).toFixed(2)} mm)`); break }
        if (k % 10 === 9 && m.stato !== 'presa') { const c = Math.abs(m.su()), sn = Math.sqrt(Math.max(0, 1 - c * c)); const pen = FONDO.y - (p.y - (MONETA.r * sn + (MONETA.h / 2) * c)); fotogrammi++; if (pen > 0.001) affonda++; dentro = Math.max(dentro, pen) }
        if (e === 'nonvale') { nonvale.push(m.ultimo); break }
        if (e) { esito = e; t = m.t; break }
        if (k > (FISICA.attesa + 5) / FISICA.dt) { errori.push(`lancio ${i}: la fisica non risponde`); break }
      }
      if (errori.length > 50) break
    }
    if (!esito) continue
    // ferma davvero: mezzo secondo dopo è ancora lì, con la stessa faccia
    const p0 = m.pose().p
    for (let k = 0; k < 0.5 / FISICA.dt; k++) m.passo()
    const p1 = m.pose().p, v = m.corpo.linvel()
    if (m.faccia() !== esito) errori.push(`lancio ${i}: detto ${esito}, mezzo secondo dopo ${m.faccia() ?? 'non piatta'}`)
    if (Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z) > 0.002 || Math.hypot(v.x, v.y, v.z) > 0.01) errori.push(`lancio ${i}: detta ferma ma si muove ancora`)
    lanci.push({ esito, prima, partenza: m.partenza, t, alto, giri: m.giri, rimbalzi: m.rimbalzi })
    if (precedente) { coppie++; if (precedente === esito) uguali++ }
    precedente = esito
    parentPort.postMessage({ lancio: true })
  }
  parentPort.postMessage({ fine: { lanci, errori, nonvale, coppie, uguali, fotogrammi, affonda, dentro } })
}

// la funzione d'errore complementare (Abramowitz e Stegun 7.1.26, errore < 1,5·10⁻⁷)
function erfc(x) {
  const t = 1 / (1 + 0.3275911 * x)
  return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x)
}
