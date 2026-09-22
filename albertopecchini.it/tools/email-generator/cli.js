#!/usr/bin/env node
// Interfaccia a riga di comando del generatore di email.
//
//   node tools/email-generator/cli.js <file.md>   genera una email
//   … new <nome>                                  crea un input dal template
//   … list                                        elenca gli input disponibili
//   … profiles                                    mostra gli account configurati
//   … theme                                       rigenera il tema dal CSS del sito
//
// L'output a schermo è deliberatamente scarno: il risultato è il report .md.
import fs from 'node:fs'
import path from 'node:path'

import { paths, GENERATOR_VERSION } from './src/paths.js'
import { generateEmail } from './src/generate.js'
import { loadSenderProfiles } from './src/senders.js'
import { writeEmailTheme } from './src/theme.js'
import { slugify, todayIso } from './src/util.js'

const args = process.argv.slice(2)
const command = args[0] ?? 'help'

/** Percorso relativo alla radice, con separatori uniformi. */
const rel = (target) => path.relative(paths.root, target).replace(/\\/g, '/')

function fail(message) {
  console.error(`\n  ✕ ${message}\n`)
  process.exit(1)
}

function commandNew(name) {
  if (!name) fail('Indicare un nome: `new richiesta-preventivo`')
  if (!fs.existsSync(paths.template)) fail('EMAIL_INPUT_TEMPLATE.md non trovato nella radice del sito.')

  const slug = slugify(name)
  const file = path.join(paths.in, `${todayIso()}-${slug}.md`)
  if (fs.existsSync(file)) fail(`Esiste già: ${rel(file)}`)

  const template = fs.readFileSync(paths.template, 'utf8')
  // Si precompilano id e data: gli unici campi deducibili senza inventare nulla.
  const prepared = template
    .replace(/id:\s*"[^"]*"/, `id: "${todayIso()}-${slug}"`)
    .replace(/date:\s*"[^"]*"/, `date: "${todayIso()}"`)

  fs.mkdirSync(paths.in, { recursive: true })
  fs.writeFileSync(file, prepared, 'utf8')
  console.log(`\n  Creato  ${rel(file)}\n  Compila il file, poi:  node tools/email-generator/cli.js ${rel(file)}\n`)
}

function commandList() {
  if (!fs.existsSync(paths.in)) fail('La cartella emails/in non esiste.')
  const files = fs.readdirSync(paths.in).filter((f) => f.endsWith('.md')).sort()
  if (!files.length) {
    console.log('\n  Nessun file in emails/in/. Crea il primo con:  node tools/email-generator/cli.js new <nome>\n')
    return
  }
  console.log('\n  Input disponibili in emails/in/:\n')
  for (const file of files) console.log(`    ${file}`)
  console.log('')
}

function commandProfiles() {
  const config = loadSenderProfiles()
  console.log('\n  Account configurati (config/sender-profiles.json):\n')
  for (const profile of config.profiles) {
    console.log(`    ${profile.key.padEnd(8)} ${profile.email}`)
    console.log(`    ${''.padEnd(8)} ${profile.label} · ${profile.provider}`)
    console.log(`    ${''.padEnd(8)} alias: ${profile.aliases.join(', ')}\n`)
  }
}

function commandTheme() {
  const theme = writeEmailTheme()
  console.log(`\n  Tema rigenerato da ${theme.source} → ${rel(paths.emailTheme)}\n`)
}

function commandGenerate(file) {
  // Comodità: si accetta il solo nome del file dentro emails/in/.
  let target = path.resolve(file)
  if (!fs.existsSync(target)) {
    const candidate = path.join(paths.in, file.endsWith('.md') ? file : `${file}.md`)
    if (fs.existsSync(candidate)) target = candidate
  }
  if (!fs.existsSync(target)) fail(`File non trovato: ${file}`)

  const result = generateEmail(target)
  const reportPath = rel(result.reportPath)

  const mark = result.status === 'READY' ? '✓' : result.status === 'WARNING' ? '!' : '✕'
  console.log(`\n  ${mark} ${result.status}`)

  if (result.validation.errors.length) {
    console.log(`\n    ${result.validation.errors.length} errore/i bloccante/i — dettagli nel report.`)
  }
  if (result.validation.warnings.length) {
    console.log(`    ${result.validation.warnings.length} avviso/i — dettagli nel report.`)
  }

  // Unico risultato mostrato: il link al report.
  console.log(`\n  Report:  ${reportPath}\n`)

  if (result.status === 'MISSING_REQUIRED_DATA') process.exitCode = 2
}

function commandHelp() {
  console.log(`
  Generatore di email HTML — v${GENERATOR_VERSION}

    node tools/email-generator/cli.js new <nome>      crea un input da EMAIL_INPUT_TEMPLATE.md
    node tools/email-generator/cli.js <file.md>       genera l'email
    node tools/email-generator/cli.js list            elenca gli input in emails/in/
    node tools/email-generator/cli.js profiles        mostra gli account configurati
    node tools/email-generator/cli.js theme           rigenera il tema da src/styles/tokens.css

  Il risultato di ogni generazione è il file report.md indicato a schermo.
`)
}

try {
  switch (command) {
    case 'new':
      commandNew(args.slice(1).join(' '))
      break
    case 'list':
      commandList()
      break
    case 'profiles':
      commandProfiles()
      break
    case 'theme':
      commandTheme()
      break
    case 'help':
    case '--help':
    case '-h':
      commandHelp()
      break
    default:
      commandGenerate(command)
  }
} catch (error) {
  fail(error.message)
}
