// Il giro completo della macchina del tempo (3.11.2026), nell'ordine che ha chiesto Alberto:
// «prima tutti i commit scaricati in locale e per ultimo le foto anteprime fatte bene».
//
//   1. scarica.mjs           la storia intera dei repository (mirror di Rivalta e Cascina, fetch di AP)
//   2. --ripassa             le regole nuove del deposito sulle versioni già depositate
//   3. --fase=versioni       un processo per sito, tutti insieme: ricostruire e depositare
//   4. --fase=foto           finite TUTTE le versioni, le foto dal deposito, un processo per sito
//   5. prova.mjs             ogni versione aperta come dal tunnel
//
// Si segue dal cruscotto (powershell -File tools\tempo\cruscotto.ps1).
//
//   node tools/tempo/giro.mjs                   tutto
//   node tools/tempo/giro.mjs --sito=rivalta    solo quei siti (separati da virgola)
//   node tools/tempo/giro.mjs --senza-scarico   senza riscaricare i repository

import { spawn } from 'node:child_process'
import { openSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITI } from './siti.mjs'
import { nota, log, DIRETTA } from './diretta.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=')
const siti = opt('sito') ? opt('sito').split(',') : SITI.map((s) => s.id)
const avanti = argv.filter((a) => /^--(forza|deposito|da|limite)/.test(a))
mkdirSync(DIRETTA, { recursive: true })

function lancia(script, args, chi) {
  return new Promise((ok) => {
    const out = openSync(join(DIRETTA, `${chi}.out`), 'a')
    const p = spawn(process.execPath, [join(QUI, script), ...args], { cwd: join(QUI, '../..'), stdio: ['ignore', out, out] })
    p.on('close', (code) => ok(code))
  })
}

const t0 = Date.now()
if (!argv.includes('--senza-scarico')) {
  nota('1/5 · scarico la storia intera dei repository')
  await lancia('scarica.mjs', [], 'scarica')
}
if (siti.includes('ap')) {
  nota('2/5 · ripasso le 108 versioni già depositate: riservatezza, scudo, router delle app React')
  await lancia('tempo.mjs', ['--sito=ap', '--ripassa', ...avanti], 'ripassa-ap')
}
nota(`3/5 · ricostruisco e deposito le versioni di ${siti.length} siti insieme`)
const versioni = await Promise.all(siti.map((id) => lancia('tempo.mjs', [`--sito=${id}`, '--fase=versioni', ...avanti], `versioni-${id}`)))
log('giro', `versioni finite: ${versioni.filter((c) => c === 0).length}/${siti.length} processi senza errori, ${Math.round((Date.now() - t0) / 60000)} min`)
nota('4/5 · tutte le versioni sono in locale: ora le foto, dal deposito, come le vede il pubblico')
const foto = await Promise.all(siti.map((id) => lancia('tempo.mjs', [`--sito=${id}`, '--fase=foto', ...avanti], `foto-${id}`)))
log('giro', `foto finite: ${foto.filter((c) => c === 0).length}/${siti.length} processi senza errori`)
nota('5/5 · la prova: ogni versione aperta come dal tunnel')
const prova = await lancia('prova.mjs', siti.length < SITI.length ? [`--sito=${siti.join(',')}`] : [], 'prova')
nota(`giro finito in ${Math.round((Date.now() - t0) / 60000)} min · prova ${prova === 0 ? 'tutta a posto' : 'con qualcosa da guardare (lavoro/diretta/prova.out)'}`)
