#!/usr/bin/env node
// ── Il benchmark da solo ─────────────────────────────────────────────────────
//
//   npm run bench                  costruisce, misura, confronta con l'ultima volta
//   npm run bench -- --veloce      salta la build e misura la dist che c'è
//   npm run bench -- --headless    finestra invisibile (come nel compito pianificato)
//   npm run bench -- --pagine /,/trivia
//
// Serve a due cose diverse. La prima è rispondere a "siamo a 60?". La seconda,
// meno vistosa ma più utile nel tempo, è accorgersi del peggioramento lento:
// ogni esecuzione si confronta con quella precedente, così un commit che costa
// tre fotogrammi si vede il giorno stesso e non fra sei mesi.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { misuraTutto, PAGINE_PREDEFINITE } from './bench.mjs'
import { C, titolo, mostraBench, mostraChunk, verdetto60, confronta } from './rapporto.mjs'
import { etichettaOra, DIR_JANITOR, tieniGliUltimi } from './quarantena.mjs'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR_BENCH = path.join(RADICE, DIR_JANITOR, 'bench')

function ultimaMisura() {
  if (!fs.existsSync(DIR_BENCH)) return null
  const file = fs.readdirSync(DIR_BENCH).filter((f) => f.endsWith('.json')).sort()
  if (!file.length) return null
  try {
    return { nome: file.at(-1), dato: JSON.parse(fs.readFileSync(path.join(DIR_BENCH, file.at(-1)), 'utf8')) }
  } catch {
    return null
  }
}

function salva(dato) {
  fs.mkdirSync(DIR_BENCH, { recursive: true })
  fs.writeFileSync(path.join(DIR_BENCH, `${etichettaOra()}.json`), JSON.stringify(dato, null, 2))
  // Le misure servono per il confronto nel tempo, ma trenta bastano e avanzano:
  // senza un tetto questa cartella cresceva a ogni esecuzione, per sempre.
  tieniGliUltimi(DIR_BENCH, 30)
}

async function principale() {
  const argv = process.argv.slice(2)
  const veloce = argv.includes('--veloce')
  const headless = argv.includes('--headless')
  const iP = argv.indexOf('--pagine')
  const pagine = iP >= 0 && argv[iP + 1]
    ? argv[iP + 1].split(',').map((s) => s.trim()).filter(Boolean)
    : PAGINE_PREDEFINITE
  const iN = argv.indexOf('--ripetizioni')
  const ripetizioni = iN >= 0 && argv[iN + 1] ? Math.max(1, Number(argv[iN + 1]) || 3) : 3

  console.log(C.forte('\n  Benchmark') + C.grigio(`  ·  ${new Date().toLocaleString('it-IT')}`))
  console.log(C.grigio(`  ${pagine.length} pagine × ${ripetizioni} passate` +
    `${veloce ? ', build saltata' : ', build compresa'}${headless ? ', finestra invisibile' : ''}`))

  const precedente = ultimaMisura()
  const adesso = await misuraTutto(RADICE, { saltaBuild: veloce, headless, pagine, ripetizioni })

  mostraBench(adesso, 'adesso')
  mostraChunk(adesso.build)
  verdetto60(adesso)

  if (precedente) {
    const quando = new Date(precedente.dato.quando).toLocaleString('it-IT')
    confronta(precedente.dato, adesso, { titoloBlocco: `Rispetto all'ultima misura (${quando})` })
  } else {
    titolo('Riferimento')
    console.log(C.grigio('  Prima misura salvata: da qui in avanti ogni benchmark si confronta con questa.'))
  }

  salva(adesso)
  console.log(C.grigio(`\n  Misura salvata in ${DIR_JANITOR}/bench/\n`))
}

principale().catch((err) => {
  console.error(C.rosso('\n  Il benchmark si è fermato: ' + err.message + '\n'))
  process.exitCode = 1
})
