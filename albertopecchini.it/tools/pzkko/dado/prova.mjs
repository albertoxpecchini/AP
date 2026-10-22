#!/usr/bin/env node
// Le prove del dado (il sic bo) di pzkko.it, senza browser: la stessa campana
// del gioco (pzkko/games/dado/campana.js, con il Rapier della pagina) si scuote
// N volte di fila in più thread, come nel gioco (i dadi ripartono da dove si
// sono fermati), e per ogni colpo si controlla:
//   - che i dadi non escano mai dal vetro, che si fermino dritti sul panno e che
//     le facce lette siano quelle in alto; che mezzo secondo dopo siano ancora lì;
//   - quanto dura il colpo e quanto spesso un dado resta storto (si riscuote);
//   - con delle puntate a caso, con tutte e due le tabelle, che le regole
//     (regole.js) paghino come un conto fatto qui in un altro modo (le puntate
//     vincenti ricavate dai dadi, invece dei dadi ricavati dalla puntata).
// Prima, una volta sola, le 216 uscite: per ogni puntata il conto esatto delle
// regole contro quello di qui, e il vantaggio del banco contro quello che
// riporta wizardofodds.com. Alla fine la distribuzione delle facce e dei totali
// (chi quadro) e quella delle facce da un colpo al successivo, per ogni dado: i
// dadi non devono ricordarsi da che faccia sono partiti.
//
//   node tools/pzkko/dado/prova.mjs [colpi=41220] [--thread=18] [--seme=4122]
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import os from 'node:os'

const QUI = dirname(fileURLToPath(import.meta.url))
const GIOCO = join(QUI, '../../../pzkko/games')
const imp = (f) => import(pathToFileURL(join(GIOCO, f)).href)

// generatore seminato (le prove si possono rifare uguali)
const TOLL_MM = 3
const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// Le puntate vincenti ricavate dai dadi (il conto «in un altro modo»): id → quanto torna per 1 puntato.
function vincenti(dadi, R) {
  const quanti = [0, 0, 0, 0, 0, 0, 0]
  for (const d of dadi) quanti[d]++
  const tot = dadi.reduce((a, b) => a + b, 0)
  const tripla = quanti.includes(3)
  const v = new Map()
  if (!tripla) {
    v.set(tot < 11 ? 'piccolo' : 'grande', 2)
    if (R.pariDispari) v.set(tot % 2 ? 'dispari' : 'pari', 2)
  } else {
    v.set(`tripla:${dadi[0]}`, R.tripla + 1)
    v.set('triple', R.triple + 1)
  }
  if (tot >= 4 && tot <= 17) v.set(`totale:${tot}`, R.totali[tot] + 1) // 3 e 18 sono triple: sul tavolo non ci sono
  const usciti = []
  for (let n = 1; n <= 6; n++) {
    if (!quanti[n]) continue
    usciti.push(n)
    v.set(`singolo:${n}`, [2, 3, 4][quanti[n] - 1])
    if (quanti[n] >= 2) v.set(`coppia:${n}`, R.coppia + 1)
  }
  for (let i = 0; i < usciti.length; i++) for (let j = i + 1; j < usciti.length; j++) v.set(`combinazione:${usciti[i]}-${usciti[j]}`, R.combinazione + 1)
  return v
}
// le 216 uscite, ognuna una volta
const USCITE = []
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) USCITE.push([a, b, c])

// il vantaggio del banco come lo riporta wizardofodds.com/games/sic-bo (in %, due decimali)
const WOO = {
  macao: { piccolo: 2.78, grande: 2.78, pari: 2.78, dispari: 2.78, 'totale:4': 29.17, 'totale:5': 47.22, 'totale:6': 30.56, 'totale:7': 9.72, 'totale:8': 12.5, 'totale:9': 18.98, 'totale:10': 12.5, coppia: 33.33, tripla: 30.09, triple: 30.56, combinazione: 16.67, singolo: 7.87 },
  atlantic: { piccolo: 2.78, grande: 2.78, 'totale:4': 15.28, 'totale:5': 13.89, 'totale:6': 16.67, 'totale:7': 9.72, 'totale:8': 12.5, 'totale:9': 18.98, 'totale:10': 12.5, coppia: 18.52, tripla: 16.2, triple: 13.89, combinazione: 16.67, singolo: 7.87 },
}

if (isMainThread) {
  const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 41220)
  const T = Math.max(1, Number((process.argv.find((a) => a.startsWith('--thread=')) ?? '').split('=')[1]) || Math.min(18, os.cpus().length - 2))
  const SEME = Number((process.argv.find((a) => a.startsWith('--seme=')) ?? '').split('=')[1]) || 4122

  // ── le regole sulle 216 uscite ──
  const { REGOLE, PUNTATE, rende } = await imp('dado/regole.js')
  const errori = []
  const vantaggi = {}
  for (const [k, R] of Object.entries(REGOLE)) {
    vantaggi[k] = {}
    const attese = 4 + 14 + 6 + 6 + 1 + 15 + 6 - (R.pariDispari ? 0 : 2)
    if (PUNTATE[k].length !== attese) errori.push(`${k}: le puntate sul tavolo sono ${PUNTATE[k].length}, non ${attese}`)
    if (new Set(PUNTATE[k].map((p) => p.id)).size !== PUNTATE[k].length) errori.push(`${k}: due puntate con lo stesso id`)
    const tabelle = USCITE.map((d) => vincenti(d, R))
    for (const p of PUNTATE[k]) {
      let resa = 0
      USCITE.forEach((d, i) => {
        const a = rende(p, d, R), b = tabelle[i].get(p.id) ?? 0
        if (a !== b) errori.push(`${k}: ${p.id} con ${d.join('-')} rende ${a}, il conto a mano ${b}`)
        resa += a
      })
      const he = Math.round((1 - resa / 216) * 10000) / 100
      vantaggi[k][p.id] = he
      const chiave = p.tipo === 'totale' ? `totale:${Math.min(p.n, 21 - p.n)}` : p.tipo === 'singolo' || p.tipo === 'coppia' || p.tipo === 'tripla' || p.tipo === 'combinazione' ? p.tipo : p.id
      const woo = WOO[k][chiave]
      if (woo === undefined) errori.push(`${k}: ${p.id} non è nella tabella di wizardofodds`)
      else if (Math.abs(woo - he) > 0.005) errori.push(`${k}: ${p.id} ha il ${he}% per il banco, wizardofodds dice ${woo}%`)
    }
    // ogni puntata vincente ricavata dai dadi esiste sul tavolo
    for (const t of tabelle) for (const id of t.keys()) if (!PUNTATE[k].some((p) => p.id === id)) errori.push(`${k}: la puntata ${id} vince ma non c'è sul tavolo`)
  }
  console.log('vantaggio del banco, esatto (216 uscite):')
  for (const [k, v] of Object.entries(vantaggi)) {
    const righe = ['piccolo', 'grande', 'pari', 'dispari', 'totale:4', 'totale:5', 'totale:6', 'totale:7', 'totale:8', 'totale:9', 'totale:10', 'coppia:1', 'tripla:1', 'triple', 'combinazione:1-2', 'singolo:1'].filter((id) => id in v)
    console.log(`  ${k}: ${righe.map((id) => `${id.replace(/^totale:/, 'totale ').replace(/:[d-]+$/, '')} ${v[id].toFixed(2)}%`).join(' · ')}`)
  }
  if (errori.length) { console.log(`\nerrori nelle regole: ${errori.length}\n  ${errori.slice(0, 30).join('\n  ')}`); process.exit(1) }
  console.log('regole: ogni puntata, su ogni uscita, come il conto fatto a mano e come wizardofodds')

  // ── la campana ──
  const quote = Array.from({ length: T }, (_, i) => Math.floor(N / T) + (i < N % T ? 1 : 0))
  console.log(`\n→ ${N} colpi della campana in ${T} thread…`)
  const t0 = Date.now()
  let fatti = 0
  const risultati = await Promise.all(quote.map((n, i) => new Promise((ok, ko) => {
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: { n, seme: SEME + i * 1000003 } })
    w.on('message', (m) => {
      if (m.colpo) { fatti++; if (fatti % 2000 === 0) console.log(`  ${fatti}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)`) }
      if (m.fine) ok(m.fine)
    })
    w.on('error', ko)
  })))
  const colpi = risultati.flatMap((r) => r.colpi)
  errori.push(...risultati.flatMap((r) => r.errori))
  const conti = risultati.reduce((a, r) => a + r.conti, 0)
  const nonvale = risultati.flatMap((r) => r.nonvale)
  const colpiTot = colpi.length + nonvale.length

  // le facce, per dado e in tutto
  const facce = [0, 1, 2].map(() => new Array(6).fill(0))
  const totali = new Array(19).fill(0)
  let triple = 0
  for (const c of colpi) { c.dadi.forEach((d, i) => facce[i][d - 1]++); totali[c.dadi[0] + c.dadi[1] + c.dadi[2]]++; if (c.dadi[0] === c.dadi[1] && c.dadi[1] === c.dadi[2]) triple++ }
  const chiFacce = facce.map((f) => chiQuadro(f, f.map(() => colpi.length / 6)))
  const tutte = facce[0].map((_, j) => facce[0][j] + facce[1][j] + facce[2][j])
  const chiTutte = chiQuadro(tutte, tutte.map(() => (3 * colpi.length) / 6))
  const pTot = new Array(19).fill(0)
  for (const d of USCITE) pTot[d[0] + d[1] + d[2]]++
  const chiTotali = chiQuadro(totali.slice(3), pTot.slice(3).map((k) => (k / 216) * colpi.length))
  // da un colpo al successivo: per ogni dado, la faccia di prima contro quella di dopo (6 righe da 6, 30 gradi di libertà)
  const passaggi = Array.from({ length: 6 }, () => new Array(6).fill(0))
  for (const r of risultati) for (const [a, b] of r.passaggi) passaggi[a - 1][b - 1]++
  let chiP = 0, stesse = 0, nP = 0
  for (let i = 0; i < 6; i++) { const riga = passaggi[i].reduce((a, b) => a + b, 0); nP += riga; stesse += passaggi[i][i]; for (let j = 0; j < 6; j++) chiP += (passaggi[i][j] - riga / 6) ** 2 / (riga / 6) }
  const pP = 1 - gammaP(30 / 2, chiP / 2)
  const stat = (k) => { const v = colpi.map((g) => g[k]).sort((a, b) => a - b); return { min: v[0], mediana: v[v.length >> 1], max: v.at(-1), media: v.reduce((a, b) => a + b, 0) / v.length } }
  const f = (s, d = 2) => `min ${s.min.toFixed(d)} · mediana ${s.mediana.toFixed(d)} · media ${s.media.toFixed(d)} · max ${s.max.toFixed(d)}`
  const motivi = nonvale.reduce((a, n) => ((a[n] = (a[n] ?? 0) + 1), a), {})
  const rapporto = {
    colpi: colpi.length, thread: T, seme: SEME, secondi: (Date.now() - t0) / 1000, errori, nonvale: motivi, conti, vantaggi,
    facce, chiFacce: chiFacce.map((c) => ({ chi2: c.chi2, p: c.p })), chiTutte, totali, chiTotali, triple,
    passaggi, chiPassaggi: chiP, pPassaggi: pP, stessaFaccia: stesse / nP,
    durata: stat('durata'), salto: stat('salto'), vetro: stat('vetro'), assesta: stat('assesta'),
  }
  console.log(`\n${colpi.length} colpi validi in ${rapporto.secondi.toFixed(0)} s`)
  console.log(`errori: ${errori.length}${errori.length ? '\n  ' + errori.slice(0, 20).join('\n  ') : ''}`)
  console.log(`colpi da rifare (un dado storto): ${nonvale.length} su ${colpiTot} (${((100 * nonvale.length) / colpiTot).toFixed(2)}%)${nonvale.length ? ' — ' + JSON.stringify(motivi) : ''}`)
  console.log(`un colpo dura ${f(rapporto.durata)} s;  il dado più alto arriva a ${f(rapporto.salto, 1)} mm`)
  console.log(`il vetro (o il panno) entra nei dadi al più di ${f(rapporto.vetro)} mm (la sfera dentro il dado; errore oltre ${TOLL_MM} mm)`)
  console.log(`fermi, nel mezzo secondo dopo si assestano di ${f(rapporto.assesta)} mm`)
  console.log(`facce: ${facce.map((x, i) => `dado ${i + 1} [${x.join(' ')}] p = ${chiFacce[i].p.toFixed(3)}`).join(' · ')}`)
  console.log(`  tutte e tre: chi quadro ${chiTutte.chi2.toFixed(1)} con 5 gradi di libertà, p = ${chiTutte.p.toFixed(3)}`)
  console.log(`totali: chi quadro ${chiTotali.chi2.toFixed(1)} con 13 gradi di libertà, p = ${chiTotali.p.toFixed(3)}; triple ${triple} (attese ${((colpi.length * 6) / 216).toFixed(0)})`)
  console.log(`da un colpo al successivo (${nP} passaggi): stessa faccia ${((100 * stesse) / nP).toFixed(2)}% (atteso 16,67%), chi quadro ${chiP.toFixed(1)} con 30 gradi di libertà, p = ${pP.toFixed(3)}`)
  console.log(`conti delle vincite controllati: ${conti}`)
  await mkdir(join(QUI, '../lavoro'), { recursive: true })
  await writeFile(join(QUI, '../lavoro/prova-dado.json'), JSON.stringify(rapporto, null, 1))
  if (errori.length) process.exit(1)
} else {
  const RAPIER = (await imp('roulette/lib/rapier.mjs')).default
  const { Campana, FISICA, LATO, R_CAMPANA, PARETE, CIMA, facciaSu, ruota } = await imp('dado/campana.js')
  // dentro il vetro? (r, y nel riferimento della campana, che si muove: la parete dritta, poi il quarto d'ellisse)
  const dentro = (r, y) => y <= CIMA && r <= (y <= PARETE ? R_CAMPANA : R_CAMPANA * Math.sqrt(Math.max(0, 1 - ((y - PARETE) / (CIMA - PARETE)) ** 2)))
  const TOLL = TOLL_MM / 1000 // quanto il vetro può entrare in un dado mentre si scuote (Rapier lascia compenetrare un poco i corpi)
  // di quanto la sfera dentro il dado esce dal vetro o scende sotto il panno (0 se è tutta dentro)
  const esce = (r, y) => { let lo = 0, hi = LATO / 2; if (y >= hi && dentro(r + hi, y) && dentro(r, y + hi)) return 0; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (y >= m && dentro(r + m, y) && dentro(r, y + m)) lo = m; else hi = m } return LATO / 2 - lo }
  const { REGOLE, PUNTATE, esito } = await imp('dado/regole.js')
  await RAPIER.init()
  const { n, seme } = workerData
  const rnd = mulberry(seme)
  const errori = [], colpi = [], nonvale = [], passaggi = []
  let conti = 0

  const campana = new Campana(RAPIER, { rnd })
  let prima = campana.risultato
  for (let g = 0; g < n; g++) {
    let risultato = null, tentativi = 0, fuori = 0, salto = 0, passi = 0, dentroVetro = 0
    while (risultato === null) {
      campana.scuoti()
      tentativi++
      let e = null, k = 0
      while (e === null && k < 480 * 30) {
        e = campana.passo(); k++
        const t = campana.piatto.translation(), q = campana.piatto.rotation()
        const inv = { x: -q.x, y: -q.y, z: -q.z, w: q.w }
        for (const b of campana.dadi) {
          const w = b.translation()
          const [x, y, z] = ruota(inv, [w.x - t.x, w.y - t.y, w.z - t.z])
          salto = Math.max(salto, y)
          // la sfera dentro il dado (raggio mezzo lato) resta dentro il vetro e sopra il panno
          const e = esce(Math.hypot(x, z), y)
          if (e > dentroVetro) dentroVetro = e
          if (e > TOLL) fuori++
        }
      }
      passi += k
      if (e === 'nonvale' || e === null) { nonvale.push(e === null ? 'mai fermi' : campana.ultimo); if (tentativi > 4) { errori.push(`colpo ${g}: cinque colpi non validi di fila`); break } continue }
      risultato = e
    }
    if (risultato === null) { campana.metti(); prima = campana.risultato; continue }
    if (!risultato.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)) errori.push(`colpo ${g}: facce strane ${risultato}`)
    if (fuori) errori.push(`colpo ${g}: un dado è entrato nel vetro più di ${TOLL_MM} mm per ${fuori} passi (${(dentroVetro * 1000).toFixed(1)} mm)`)
    // i dadi sono davvero dritti, sul panno, con quelle facce in alto
    campana.dadi.forEach((b, i) => {
      const p = b.translation(), fs = facciaSu(b.rotation())
      if (fs.valore !== risultato[i]) errori.push(`colpo ${g}: il dado ${i + 1} dice ${risultato[i]} ma ha in alto il ${fs.valore}`)
      if (fs.su < FISICA.dritto) errori.push(`colpo ${g}: il dado ${i + 1} è storto (${fs.su.toFixed(4)})`)
      if (Math.abs(p.y - LATO / 2) > 0.0012) errori.push(`colpo ${g}: il dado ${i + 1} non è sul panno (y ${(p.y * 1000).toFixed(2)} mm)`)
    })
    // mezzo secondo dopo è tutto fermo (due dadi che si toccano si possono ancora scostare di un filo: la faccia no)
    const prima0 = campana.dadi.map((b) => ({ ...b.translation() }))
    let assesta = 0
    for (let i = 0; i < 240; i++) campana.world.step() // la campana ferma: il mondo va avanti da solo
    campana.dadi.forEach((b, i) => {
      const p = b.translation(), fs = facciaSu(b.rotation())
      if (fs.valore !== risultato[i]) errori.push(`colpo ${g}: dopo mezzo secondo il dado ${i + 1} è passato dal ${risultato[i]} al ${fs.valore}`)
      const d = Math.hypot(p.x - prima0[i].x, p.y - prima0[i].y, p.z - prima0[i].z)
      assesta = Math.max(assesta, d)
      if (d > 0.003) errori.push(`colpo ${g}: dopo mezzo secondo il dado ${i + 1} si è mosso di ${(d * 1000).toFixed(1)} mm`)
    })
    // i conti: puntate a caso, con le due tabelle
    for (const R of Object.values(REGOLE)) {
      const giocate = new Map()
      const tutte = PUNTATE[R.id]
      for (let k = 0, q = 1 + Math.floor(rnd() * 10); k < q; k++) { const p = tutte[Math.floor(rnd() * tutte.length)]; giocate.set(p.id, (giocate.get(p.id) ?? 0) + [1, 5, 25, 100, 500][Math.floor(rnd() * 5)]) }
      const e = esito(giocate, risultato, R)
      const v = vincenti(risultato, R)
      let torna = 0, puntato = 0
      for (const [id, imp] of giocate) { puntato += imp; torna += imp * (v.get(id) ?? 0) }
      if (e.torna !== torna || e.puntato !== puntato) errori.push(`colpo ${g} (${R.nome}): escono ${risultato}, le regole rendono ${e.torna} su ${e.puntato}, il conto a mano ${torna} su ${puntato}`)
      if (e.vinte.length + e.perse.length !== giocate.size) errori.push(`colpo ${g} (${R.nome}): puntate perse per strada`)
      conti++
    }
    risultato.forEach((d, i) => passaggi.push([prima[i], d]))
    prima = risultato
    colpi.push({ dadi: risultato, durata: passi * FISICA.dt, salto: salto * 1000, vetro: dentroVetro * 1000, assesta: assesta * 1000, tentativi })
    parentPort.postMessage({ colpo: true })
  }
  parentPort.postMessage({ fine: { colpi, errori, conti, nonvale, passaggi } })
}

function chiQuadro(osservati, attesi) {
  const chi2 = osservati.reduce((a, o, i) => a + (o - attesi[i]) ** 2 / attesi[i], 0)
  return { chi2, p: 1 - gammaP((osservati.length - 1) / 2, chi2 / 2) }
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
