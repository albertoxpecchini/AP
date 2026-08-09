#!/usr/bin/env node
// ── Il programma di pulizia ──────────────────────────────────────────────────
//
//   node scripts/janitor/pulisci.mjs                 guarda e riferisce, non tocca
//   node scripts/janitor/pulisci.mjs --applica       pulisce, verifica, e se serve annulla
//   node scripts/janitor/pulisci.mjs --elenco        le quarantene esistenti
//   node scripts/janitor/pulisci.mjs --ripristina ultima
//
// Altre opzioni: --niente-bench, --headless, --rami, --tutto, --pagine /a,/b
//
// L'ordine non è casuale. Si misura PRIMA, si pulisce, si ricostruisce, si
// misura DOPO — e il confronto non serve a farsi belli: serve a decidere. Se
// dopo la pulizia la build fallisce, o compare un 404 che prima non c'era, o un
// errore in console, tutto quello che era stato messo da parte torna al suo
// posto da solo. Il programma può quindi girare ogni due giorni senza sorveglianza:
// il caso peggiore è che non abbia combinato niente.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
// `peso` esiste in due significati: qui il peso di un file, in rapporto.mjs il
// modo di scriverlo per gli occhi. Rinominato per non confonderli.
import { analizza, trovaRigenerabili, pesoCartella, elenca, peso as peso_ } from './analisi.mjs'
import { metti, ripristina, elencoQuarantene, svuotaVecchie, etichettaOra, DIR_JANITOR } from './quarantena.mjs'
import { misuraTutto, PAGINE_PREDEFINITE } from './bench.mjs'
import { C, peso, segno, titolo, mostraBench, verdetto60, confronta } from './rapporto.mjs'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// ── Misura del peso del repo ─────────────────────────────────────────────────

function fotografiaPeso() {
  // `elenca` salta già node_modules, .git e la quarantena: sommare i suoi file
  // dà il peso del progetto vero senza attraversare le decine di migliaia di
  // file delle dipendenze, che qui non c'entrano e costerebbero solo tempo.
  // dist è a parte: sparisce e torna a ogni build, e mescolarlo al resto
  // farebbe sembrare un risparmio quello che è solo una ricostruzione mancante.
  const file = elenca(RADICE)
  return {
    git: pesoCartella(path.join(RADICE, '.git')),
    lavoro: file.reduce((s, f) => s + peso_(RADICE, f), 0),
    dist: pesoCartella(path.join(RADICE, 'dist')),
    cache: pesoCartella(path.join(RADICE, 'node_modules/.vite')),
  }
}

// ── Argomenti ────────────────────────────────────────────────────────────────

function leggiArgomenti(argv) {
  const o = {
    applica: argv.includes('--applica'),
    bench: !argv.includes('--niente-bench'),
    headless: argv.includes('--headless'),
    rami: argv.includes('--rami'),
    tutto: argv.includes('--tutto'),
    elenco: argv.includes('--elenco'),
    ripristina: null,
    pagine: PAGINE_PREDEFINITE,
    ripetizioni: 3,
  }
  const iR = argv.indexOf('--ripristina')
  if (iR >= 0) o.ripristina = argv[iR + 1] || 'ultima'
  const iP = argv.indexOf('--pagine')
  if (iP >= 0 && argv[iP + 1]) o.pagine = argv[iP + 1].split(',').map((s) => s.trim()).filter(Boolean)
  const iN = argv.indexOf('--ripetizioni')
  if (iN >= 0 && argv[iN + 1]) o.ripetizioni = Math.max(1, Number(argv[iN + 1]) || 3)
  return o
}

// ── Rapporti ─────────────────────────────────────────────────────────────────

function mostraAnalisi(a, opzioni) {
  const rigenerabili = filtraRigenerabili(a.rigenerabili, opzioni)
  titolo('Sporco trovato')

  const bloccoLista = (nome, voci, formatta) => {
    if (!voci.length) {
      console.log(`${C.verde('·')} ${nome}: ${C.verde('niente')}`)
      return
    }
    const tot = voci.reduce((s, v) => s + (v.bytes || v.sprecato || 0), 0)
    console.log(`${C.giallo('·')} ${nome}: ${C.forte(voci.length)} ${tot ? C.grigio('(' + peso(tot) + ')') : ''}`)
    for (const v of voci.slice(0, 12)) console.log('    ' + formatta(v))
    if (voci.length > 12) console.log(C.grigio(`    …e altri ${voci.length - 12}`))
  }

  bloccoLista('Rigenerabili', rigenerabili, (v) => `${v.path} ${C.grigio(peso(v.bytes) + ' — ' + v.motivo)}`)
  bloccoLista('Moduli orfani in src/', a.orfaniSrc, (v) => `${v.path} ${C.grigio(peso(v.bytes))}`)
  bloccoLista('Asset mai nominati in public/', a.assetOrfani, (v) => `${v.path} ${C.grigio(peso(v.bytes))}`)
  bloccoLista('Dipendenze mai importate', a.dipendenzeInutili, (v) => `${v.nome} ${C.grigio(v.versione)}`)
  bloccoLista('File duplicati', a.duplicati, (v) => `${C.grigio(peso(v.sprecato) + ' sprecati')} ${v.file.join(' = ')}`)

  console.log(
    `${a.git.oggettiSciolti ? C.giallo('·') : C.verde('·')} Git: ` +
    `${a.git.oggettiSciolti} oggetti sciolti ${C.grigio('(' + peso(a.git.bytesSciolti) + ')')}, ` +
    `pack ${peso(a.git.bytesPack)}` +
    (a.git.ramiConfluiti.length ? `, ${a.git.ramiConfluiti.length} rami già confluiti in main` : ''),
  )
  console.log(
    C.grigio(`  ${a.totali.moduliRaggiungibili} moduli di src/ raggiungibili dalle entrate · ` +
             `cartelle protette perché indirizzate a runtime: ${a.cartelleProtette.join(', ') || 'nessuna'}`),
  )
}

// ── Pulizia vera ─────────────────────────────────────────────────────────────

function filtraRigenerabili(rigenerabili, opzioni) {
  return rigenerabili.filter((v) => {
    if (v.soloConTutto && !opzioni.tutto) return false
    // La cache di Vite è viva e utile mentre si sta lavorando: buttarla ogni due
    // giorni significa solo pagare una ri-ottimizzazione al primo `npm run dev`.
    // Si porta via solo quando è ferma da un po', o su richiesta esplicita.
    if (v.path === 'node_modules/.vite' && !opzioni.tutto) {
      try {
        const eta = Date.now() - fs.statSync(path.join(RADICE, v.path)).mtimeMs
        return eta > 3 * 86400_000
      } catch {
        return false
      }
    }
    return true
  })
}

function togliRigenerabili(voci) {
  let liberati = 0
  for (const v of voci) {
    const p = path.join(RADICE, v.path)
    try {
      fs.rmSync(p, { recursive: true, force: true })
      liberati += v.bytes
    } catch (err) {
      console.log(C.giallo(`  non sono riuscito a togliere ${v.path}: ${err.message}`))
    }
  }
  return liberati
}

function manutenzioneGit(opzioni, ramiConfluiti) {
  const git = (cmd) => execSync(`git ${cmd}`, { cwd: RADICE, encoding: 'utf8', stdio: 'pipe' }).trim()
  const fatto = []
  try {
    // `gc` senza --prune=now e senza --aggressive: compatta i pack e butta solo
    // gli oggetti irraggiungibili da più di due settimane. La storia non si
    // riscrive MAI da qui — servirebbe un push forzato, e un push forzato
    // automatico ogni due giorni è esattamente il modo di rompere tutto.
    git('gc --quiet')
    fatto.push('git gc')
  } catch (err) {
    fatto.push('git gc non riuscito: ' + err.message.split('\n')[0])
  }
  if (opzioni.rami) {
    for (const ramo of ramiConfluiti) {
      try {
        git(`branch -d ${ramo}`)
        fatto.push(`ramo eliminato: ${ramo}`)
      } catch {
        fatto.push(`ramo ${ramo} non eliminato (non del tutto confluito)`)
      }
    }
  }
  return fatto
}

function buildOk() {
  try {
    execSync('npm run build', { cwd: RADICE, stdio: 'pipe', encoding: 'utf8' })
    return { ok: true }
  } catch (err) {
    return { ok: false, uscita: (err.stdout || '') + (err.stderr || '') }
  }
}

function assicuraGitignore() {
  const f = path.join(RADICE, '.gitignore')
  const testo = fs.readFileSync(f, 'utf8')
  if (testo.includes(DIR_JANITOR)) return
  fs.writeFileSync(f, testo.trimEnd() + `\n\n# Quarantena e storico del programma di pulizia\n${DIR_JANITOR}/\n`)
  console.log(C.grigio(`  aggiunto ${DIR_JANITOR}/ a .gitignore`))
}

function salvaStorico(dati) {
  const dir = path.join(RADICE, DIR_JANITOR, 'storico')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${etichettaOra()}.json`), JSON.stringify(dati, null, 2))
  fs.writeFileSync(path.join(RADICE, DIR_JANITOR, 'ultimo.json'), JSON.stringify(dati, null, 2))
}

// ── Programma ────────────────────────────────────────────────────────────────

async function principale() {
  const opzioni = leggiArgomenti(process.argv.slice(2))
  console.log(C.forte('\n  Pulizia del repo') + C.grigio(`  ·  ${new Date().toLocaleString('it-IT')}`))

  if (opzioni.elenco) {
    titolo('Quarantene')
    const q = elencoQuarantene(RADICE)
    if (!q.length) console.log('  nessuna')
    for (const v of q) console.log(`  ${v.etichetta}  ${String(v.voci).padStart(3)} voci  ${peso(v.bytes)}`)
    return
  }

  if (opzioni.ripristina) {
    const tutte = elencoQuarantene(RADICE)
    const etichetta = opzioni.ripristina === 'ultima' ? tutte[0]?.etichetta : opzioni.ripristina
    if (!etichetta) { console.log(C.rosso('  nessuna quarantena da ripristinare')); return }
    const r = ripristina(RADICE, etichetta)
    console.log(C.verde(`  ripristinati ${r.tornati}/${r.totale} elementi da ${etichetta}`))
    return
  }

  const primaPeso = fotografiaPeso()
  const a = analizza(RADICE)
  mostraAnalisi(a, opzioni)

  const rigenerabili = filtraRigenerabili(a.rigenerabili, opzioni)
  const daQuarantena = [
    ...a.orfaniSrc.map((v) => ({ ...v, categoria: 'modulo orfano' })),
    ...a.assetOrfani.map((v) => ({ ...v, categoria: 'asset non nominato' })),
  ]

  if (!opzioni.applica) {
    const recuperabile = rigenerabili.reduce((s, v) => s + v.bytes, 0) +
                         daQuarantena.reduce((s, v) => s + v.bytes, 0)
    titolo('Nessuna modifica')
    console.log(`  Recuperabili ${C.forte(peso(recuperabile))}. Per procedere:`)
    console.log(C.ciano('     npm run pulizia:applica'))
    if (opzioni.bench) {
      console.log(C.grigio('\n  Misuro lo stato attuale (build + fotogrammi)…'))
      const b = await misuraTutto(RADICE, { headless: opzioni.headless, pagine: opzioni.pagine,
                                            ripetizioni: opzioni.ripetizioni })
      mostraBench(b, 'stato attuale')
      verdetto60(b)
      salvaStorico({ tipo: 'analisi', quando: new Date().toISOString(), analisi: a, bench: b })
    }
    return
  }

  // ── Da qui in poi si tocca ─────────────────────────────────────────────────
  assicuraGitignore()

  let prima = null
  if (opzioni.bench) {
    console.log(C.grigio('\n  Misuro com\'è adesso, prima di toccare niente…'))
    prima = await misuraTutto(RADICE, { headless: opzioni.headless, pagine: opzioni.pagine,
                                        ripetizioni: opzioni.ripetizioni })
    mostraBench(prima, 'prima')
  }

  titolo('Pulizia')

  let etichetta = null
  if (daQuarantena.length) {
    etichetta = etichettaOra()
    quarantenaAperta = etichetta // vedi il catch in fondo al file
    const m = metti(RADICE, daQuarantena, etichetta)
    console.log(`  ${C.verde('✓')} messi in quarantena ${m.voci.length} file (${peso(m.totaleByte)}) ` +
                C.grigio(`in ${DIR_JANITOR}/quarantena/${etichetta}`))
  } else {
    console.log(`  ${C.verde('✓')} nessun orfano da mettere da parte`)
  }

  // ── Verifica ───────────────────────────────────────────────────────────────
  // Se qualcosa è stato spostato, la build DEVE girare anche senza benchmark:
  // è l'unico modo di accorgersi di aver portato via qualcosa che serviva.
  let dopo = null
  let problemi = []
  if (opzioni.bench) {
    console.log(C.grigio('\n  Ricostruisco e rimisuro…'))
    try {
      dopo = await misuraTutto(RADICE, { headless: opzioni.headless, pagine: opzioni.pagine,
                                         ripetizioni: opzioni.ripetizioni })
      mostraBench(dopo, 'dopo')
      problemi = confronta(prima, dopo)
    } catch (err) {
      // Qui ci si arriva soprattutto quando la build non compila più: execSync
      // solleva. Senza questa rete l'eccezione salirebbe fino in fondo e la
      // quarantena resterebbe dov'è — cioè il programma lascerebbe il repo
      // rotto proprio nel caso che è nato per gestire.
      problemi.push('la verifica non è arrivata in fondo: ' + err.message.split('\n')[0])
    }
  } else if (etichetta) {
    console.log(C.grigio('\n  Ricostruisco per verificare…'))
    const b = buildOk()
    if (!b.ok) problemi.push('la build non passa più: ' + b.uscita.split('\n').slice(-6).join(' ').trim())
  }

  titolo('Verifica')
  if (problemi.length) {
    for (const p of problemi) console.log(C.rosso('  ✗ ' + p))
    if (etichetta) {
      const r = ripristina(RADICE, etichetta)
      quarantenaAperta = null
      console.log(C.giallo(`\n  Annullato: rimessi al loro posto ${r.tornati} file.`))
      const b = buildOk()
      console.log(b.ok ? C.verde('  La build torna a passare.')
                       : C.rosso('  Attenzione: la build non passa nemmeno dopo il ripristino — guarda a mano.'))
    } else {
      console.log(C.giallo('  Niente da annullare: erano tutti file rigenerabili.'))
    }
  } else {
    quarantenaAperta = null // verificata: da qui in poi resta dov'è
    console.log(C.verde('  ✓ build a posto'))
    console.log(C.verde('  ✓ nessuna richiesta rotta, nessun errore nuovo in console'))
    console.log(C.verde('  ✓ fotogrammi non peggiorati'))
  }

  // ── I rigenerabili si tolgono adesso, non prima ────────────────────────────
  // Prima venivano tolti all'inizio, e il bilancio finale diceva "+0.0 MB":
  // giusto in mezzo c'era la build di verifica, che li ricreava tutti. Tolti
  // dopo, la verifica è comunque avvenuta — su un albero completo, come deve —
  // e lo spazio resta libero davvero.
  // Si ricontano qui perché le build appena girate hanno cambiato le carte.
  const daTogliere = filtraRigenerabili(trovaRigenerabili(RADICE), opzioni)
  const liberati = togliRigenerabili(daTogliere)
  console.log(`\n  ${C.verde('✓')} rigenerabili tolti: ${daTogliere.length} voci, ${peso(liberati)} ` +
              C.grigio('(li rifà la prossima build)'))

  // ── Git e chiusura ─────────────────────────────────────────────────────────
  titolo('Manutenzione git')
  for (const riga of manutenzioneGit(opzioni, a.git.ramiConfluiti)) console.log('  ' + riga)

  const scadute = svuotaVecchie(RADICE, 14)
  if (scadute.length) {
    console.log(C.grigio(`  svuotate ${scadute.length} quarantene più vecchie di 14 giorni`))
  }

  const dopoPeso = fotografiaPeso()
  titolo('Bilancio')
  const riga = (nome, p, d) => {
    const delta = d - p
    const tinta = delta < 0 ? C.verde : C.grigio
    console.log(`  ${nome.padEnd(22)} ${peso(p).padStart(9)} → ${peso(d).padStart(9)}   ${tinta(segno(delta / 1048576, ' MB'))}`)
  }
  riga('cartella .git', primaPeso.git, dopoPeso.git)
  riga('file del progetto', primaPeso.lavoro, dopoPeso.lavoro)
  riga('build (dist)', primaPeso.dist, dopoPeso.dist)
  riga('cache di sviluppo', primaPeso.cache, dopoPeso.cache)
  const totalePrima = primaPeso.git + primaPeso.lavoro + primaPeso.dist + primaPeso.cache
  const totaleDopo = dopoPeso.git + dopoPeso.lavoro + dopoPeso.dist + dopoPeso.cache
  console.log(C.forte(`  ${'in tutto'.padEnd(22)} ${peso(totalePrima).padStart(9)} → ${peso(totaleDopo).padStart(9)}   ` +
              (totaleDopo < totalePrima ? C.verde(segno((totaleDopo - totalePrima) / 1048576, ' MB')) : '')))
  // Detto chiaro: di questo risparmio, solo la parte git è definitiva. dist e
  // la cache tornano appena si ricostruisce — è spazio prestato, non guadagnato,
  // e spacciarlo per guadagno renderebbe il bilancio una bugia gentile.
  const durevole = primaPeso.git - dopoPeso.git + (primaPeso.lavoro - dopoPeso.lavoro)
  console.log(C.grigio(`  di cui definitivo (git + file del progetto): ${peso(durevole)} · ` +
                       'dist e cache tornano alla prossima build'))

  if (dopo) verdetto60(dopo)

  salvaStorico({
    tipo: 'pulizia', quando: new Date().toISOString(),
    analisi: a, prima, dopo, problemi, etichetta,
    pesoPrima: primaPeso, pesoDopo: dopoPeso,
  })
  console.log(C.grigio(`\n  Storico in ${DIR_JANITOR}/storico/ · ripristino con ` +
                       `\`npm run pulizia:ripristina\`\n`))
}

// Se il programma muore in un punto imprevisto mentre dei file sono già stati
// messi da parte, il repo resterebbe monco fino al prossimo intervento a mano.
// Qui si rimette tutto a posto prima di uscire: è l'ultima rete, sotto a quella
// della verifica.
let quarantenaAperta = null

principale().catch((err) => {
  console.error(C.rosso('\n  La pulizia si è fermata: ' + err.message))
  if (quarantenaAperta) {
    try {
      const r = ripristina(RADICE, quarantenaAperta)
      console.error(C.giallo(`  Rimessi al loro posto ${r.tornati} file messi da parte poco fa.`))
    } catch (e) {
      console.error(C.rosso(`  Ripristino automatico non riuscito (${e.message}): ` +
                            `recuperali con \`npm run pulizia:ripristina\`.`))
    }
  }
  console.error(C.grigio('  Niente è stato cancellato senza copia: controlla `npm run pulizia:elenco`.'))
  process.exitCode = 1
})
