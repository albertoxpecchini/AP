// ── Come si raccontano i numeri ──────────────────────────────────────────────
//
// Sta qui, e non dentro i due comandi, perché `pulizia` e `bench` devono
// stampare le stesse tabelle: un numero presentato in due modi diversi è un
// numero di cui non ci si fida più.

// I colori servono a chi guarda lo schermo. Quando l'uscita finisce in un file
// — ed è quello che succede ogni due giorni col compito pianificato — le
// sequenze di escape diventano "[90m" sparsi in mezzo alle parole, e il log
// che dovrebbe rassicurare diventa illeggibile. Se non c'è un terminale
// dall'altra parte, si scrive in chiaro.
const aColori = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR

const tinta = (codice) => (s) => (aColori ? `\x1b[${codice}m${s}\x1b[0m` : String(s))

export const C = {
  grigio: tinta(90),
  verde: tinta(32),
  giallo: tinta(33),
  rosso: tinta(31),
  ciano: tinta(36),
  forte: tinta(1),
}

export const peso = (b) =>
  b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' kB'

export const segno = (n, unita = '') => (n > 0 ? '+' : '') + n.toFixed(1) + unita

export function titolo(t) {
  console.log('\n' + C.forte(t))
  console.log(C.grigio('─'.repeat(Math.max(24, t.length))))
}

// Oltre questa cadenza il browser non disegna: i numeri lì sopra vogliono dire
// "costa meno di quanto lo strumento sappia misurare", non "va a 165".
const TETTO_FPS = 150

// Rumore che c'è sempre e non dipende da noi. Segnalarlo in rosso a ogni
// esecuzione insegnerebbe solo a ignorare il rosso.
const RUMORE_NOTO = [
  '/_vercel/speed-insights/script.js', // esiste solo su Vercel: in locale 404 per forza
  'net::ERR_ABORTED',                  // conseguenza del 404 qui sopra
]
const eRumore = (s) => RUMORE_NOTO.some((r) => s.includes(r))

function tabella(pagine, { etichetta }) {
  console.log(C.grigio(`  ${etichetta}`))
  console.log(C.grigio('  pagina         fps   1% peggiore   entro 16.7ms   frame lunghi      LCP      CLS'))
  for (const [pagina, m] of Object.entries(pagine)) {
    if (m.errore) {
      console.log(`  ${pagina.padEnd(13)} ${C.rosso('errore: ' + m.errore)}`)
      continue
    }
    const colonna = m.dentroBudget >= 95 ? C.verde : m.dentroBudget >= 85 ? C.giallo : C.rosso
    // Prima si allinea il testo visibile, poi si aggiunge il marcatore: farlo al
    // contrario significherebbe contare nella larghezza anche i codici colore,
    // che occupano spazio nella stringa ma non sullo schermo — e senza colori
    // (log su file) le colonne si spostavano di otto caratteri.
    const fps = String(m.fps).padStart(5) + (m.fps >= TETTO_FPS ? C.grigio('†') : ' ')
    console.log(
      `  ${pagina.padEnd(13)} ${fps} ${String(m.fpsMinimo).padStart(13)} ` +
      `${colonna((m.dentroBudget + '%').padStart(14))} ${String(m.frameLunghi).padStart(14)} ` +
      `${String(m.lcp + 'ms').padStart(8)} ${String(m.cls).padStart(8)}`,
    )
    const rotte = (m.rotte || []).filter((r) => !eRumore(r))
    const errori = (m.errori || []).filter((e) => !eRumore(e))
    if (rotte.length) console.log(C.rosso(`      richieste rotte: ${rotte.join(' · ')}`))
    if (errori.length) console.log(C.rosso(`      errori console: ${errori.join(' · ')}`))
  }
}

export function mostraBench(b, etichetta) {
  titolo(`Benchmark · ${etichetta}`)
  if (b.build?.ms != null) {
    console.log(`  build ${C.forte((b.build.ms / 1000).toFixed(1) + 's')}   ` +
                `dist ${C.forte(peso(b.build.totale))}   ` +
                `js gzip ${C.forte(peso(b.build.gzJs))}   css gzip ${C.forte(peso(b.build.gzCss))}\n`)
  }
  tabella(b.pagine, { etichetta: 'a piena potenza' })
  if (b.frenate) {
    console.log('')
    tabella(b.frenate, { etichetta: `con la CPU ${b.freno || 4}× più lenta (telefono di fascia media)` })
  }
  if (Object.values(b.pagine).some((m) => m.fps >= TETTO_FPS)) {
    console.log(C.grigio(`\n  † il browser non disegna oltre ~${TETTO_FPS} fps: lì sopra vuol dire ` +
                         `"costa meno di quanto si riesca a misurare". Il numero che distingue è quello frenato.`))
  }
}

/**
 * I chunk più pesanti: è la lista da cui si parte quando il problema non è lo
 * sporco sul disco ma il peso che il visitatore scarica davvero.
 */
export function mostraChunk(build, quanti = 6) {
  if (!build?.chunk?.length) return
  titolo('Cosa pesa nella build')
  for (const c of build.chunk.slice(0, quanti)) {
    console.log(`  ${peso(c.gz).padStart(9)} gzip  ${C.grigio(peso(c.bytes).padStart(9) + ' crudi')}  ${c.nome}`)
  }
}

export function verdetto60(bench) {
  titolo('I 60 fps')
  const frenate = bench.frenate || {}
  let peggiore = null

  for (const [pagina, m] of Object.entries(bench.pagine)) {
    if (m.errore) continue
    const f = frenate[pagina]
    const rif = f && !f.errore ? f : m
    if (!peggiore || rif.dentroBudget < peggiore.rif.dentroBudget) peggiore = { pagina, m, rif }

    const esito =
      m.dentroBudget >= 98 ? C.verde('60 fps pieni   ')
      : m.dentroBudget >= 90 ? C.giallo('quasi, con scatti')
      : C.rosso('sotto i 60      ')
    const conFreno = f && !f.errore
      ? ` · frenato 4×: ${f.dentroBudget}% dei fotogrammi entro budget, fotogramma ${(1000 / f.fps).toFixed(1)}ms`
      : ''
    console.log(
      `  ${pagina.padEnd(13)} ${esito}  ${C.grigio(
        `blocco più lungo ${m.bloccoPiuLungo}ms · ${m.nodi} nodi${conFreno}`)}`,
    )
  }

  if (peggiore && peggiore.rif.dentroBudget < 98) {
    console.log(C.grigio(`\n  Il punto più debole è ${peggiore.pagina}: ` +
      `${(100 - peggiore.rif.dentroBudget).toFixed(1)}% dei fotogrammi sfora i 16.7ms, ` +
      `il peggiore a ${peggiore.rif.peggiore}ms.`))
  }

  // Un blocco lungo non si vede negli fps dello scorrimento — succede prima,
  // mentre la pagina si apre — ma è esattamente ciò che si percepisce come
  // "parte lento". Vale la pena dirlo a parte.
  const bloccati = Object.entries(bench.pagine)
    .filter(([, m]) => !m.errore && m.bloccoPiuLungo >= 50)
    .sort((a, b) => b[1].bloccoPiuLungo - a[1].bloccoPiuLungo)
  if (bloccati.length) {
    console.log(C.grigio(`\n  All'apertura il thread principale resta bloccato: ` +
      bloccati.map(([p, m]) => `${p} ${m.bloccoPiuLungo}ms`).join(' · ') +
      `. Non tocca lo scorrimento, ma è il ritardo che si sente al primo colpo d'occhio.`))
  }
}

/**
 * Confronta due misure e restituisce l'elenco dei PROBLEMI (vuoto = tutto bene).
 * È questa lista che decide se una pulizia si tiene o si annulla.
 */
export function confronta(prima, dopo, { titoloBlocco = 'Prima e dopo' } = {}) {
  titolo(titoloBlocco)
  if (prima.build?.ms != null && dopo.build?.ms != null) {
    const d = ((dopo.build.ms - prima.build.ms) / prima.build.ms) * 100
    console.log(`  build      ${(prima.build.ms / 1000).toFixed(1)}s → ${(dopo.build.ms / 1000).toFixed(1)}s   ` +
                C.grigio(segno(d, '%')))
  }
  if (prima.build && dopo.build) {
    const dg = ((dopo.build.gzJs - prima.build.gzJs) / (prima.build.gzJs || 1)) * 100
    console.log(`  js gzip    ${peso(prima.build.gzJs)} → ${peso(dopo.build.gzJs)}   ${C.grigio(segno(dg, '%'))}`)
  }

  const problemi = []

  // Il confronto degli fps si fa sulla passata FRENATA: quella a piena potenza
  // è appiattita contro il tetto del browser e direbbe "tutto uguale" anche
  // dopo un peggioramento vero.
  const pA = prima.frenate || prima.pagine
  const pB = dopo.frenate || dopo.pagine
  const quale = dopo.frenate ? 'frenato 4×' : 'a piena potenza'
  console.log(C.grigio(`  fotogrammi confrontati ${quale}`))

  for (const [pagina, d] of Object.entries(pB)) {
    const p = pA[pagina]
    if (!p || p.errore || d.errore) {
      if (d.errore) problemi.push(`${pagina}: ${d.errore}`)
      continue
    }
    const dFps = ((d.fps - p.fps) / (p.fps || 1)) * 100
    const dBudget = d.dentroBudget - p.dentroBudget
    const colonna = dFps >= -3 ? C.verde : dFps >= -10 ? C.giallo : C.rosso
    console.log(
      `  ${pagina.padEnd(11)} fps ${p.fps} → ${d.fps} ${colonna(segno(dFps, '%'))}   ` +
      `1% peggiore ${p.fpsMinimo} → ${d.fpsMinimo}   ` +
      `LCP ${p.lcp} → ${d.lcp}ms   ` +
      `entro budget ${p.dentroBudget}% → ${d.dentroBudget}% ${C.grigio(segno(dBudget, ' punti'))}`,
    )
    if (dFps < -15) problemi.push(`${pagina}: fps crollati del ${Math.abs(dFps).toFixed(0)}%`)

    // La media satura contro il tetto del browser: su un sito già leggero è il
    // fotogramma peggiore a muoversi per primo, ed è anche quello che si vede.
    const dMin = ((d.fpsMinimo - p.fpsMinimo) / (p.fpsMinimo || 1)) * 100
    if (dMin < -25 && d.fpsMinimo < 60) {
      problemi.push(`${pagina}: l'1% peggiore è sceso da ${p.fpsMinimo} a ${d.fpsMinimo} fps`)
    }
    // LCP non ha tetto e reagisce a tutto ciò che appesantisce l'avvio: è la
    // spia più sensibile che abbiamo. Soglia larga perché è anche rumorosa.
    if (p.lcp > 0 && d.lcp > p.lcp * 1.4 && d.lcp - p.lcp > 200) {
      problemi.push(`${pagina}: LCP peggiorato da ${p.lcp}ms a ${d.lcp}ms`)
    }
  }

  // Un file tolto per sbaglio non fa calare gli fps: fa comparire un 404. Per
  // questo il segnale che decide davvero è questo, e si guarda su TUTTE e due
  // le passate — un asset che manca manca comunque.
  for (const [insieme, etichettaIns] of [[dopo.pagine, 'piena potenza'], [dopo.frenate || {}, 'frenato']]) {
    const riferimento = etichettaIns === 'frenato' ? (prima.frenate || {}) : prima.pagine
    for (const [pagina, d] of Object.entries(insieme)) {
      if (d.errore) continue
      const p = riferimento[pagina] || {}
      const nuoveRotte = (d.rotte || []).filter((r) => !eRumore(r) && !(p.rotte || []).includes(r))
      const nuoviErrori = (d.errori || []).filter((e) => !eRumore(e) && !(p.errori || []).includes(e))
      if (nuoveRotte.length) problemi.push(`${pagina}: richieste rotte che prima non c'erano → ${nuoveRotte.join(' · ')}`)
      if (nuoviErrori.length) problemi.push(`${pagina}: nuovi errori in console → ${nuoviErrori.join(' · ')}`)
    }
  }
  return problemi
}
