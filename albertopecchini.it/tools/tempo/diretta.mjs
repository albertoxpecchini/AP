// La diretta della macchina del tempo (3.11.2026): ogni processo che lavora (lo scarico
// dei repository, la ricostruzione di un sito, le foto) scrive il suo stato in
// lavoro/diretta/<chi>.json e le sue righe in lavoro/diretta/log.txt. Il cruscotto
// (cruscotto.mjs, aperto da cruscotto.ps1) li legge e li disegna: barre e log in diretta.
//
//   node tools/tempo/diretta.mjs "sto scrivendo il selettore dei siti"   la nota in cima al cruscotto
//   node tools/tempo/diretta.mjs --pulisci                              via gli stati dei giri finiti

import { appendFileSync, mkdirSync, writeFileSync, renameSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
export const DIRETTA = join(QUI, 'lavoro', 'diretta')
mkdirSync(DIRETTA, { recursive: true })

const ora = () => new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour12: false })
const ultimi = new Map()

// lo stato di un processo: scrittura atomica (il cruscotto non legge mai mezzo file),
// al più cinque volte al secondo se non si chiede `subito`
export function stato(chi, s, { subito = false } = {}) {
  const adesso = Date.now()
  if (!subito && adesso - (ultimi.get(chi) || 0) < 200) return
  ultimi.set(chi, adesso)
  const f = join(DIRETTA, `${chi}.json`)
  try {
    writeFileSync(f + '.tmp', JSON.stringify({ ...s, chi, agg: adesso, pid: process.pid }))
    renameSync(f + '.tmp', f)
  } catch {
    // il cruscotto può tenere il file aperto per un attimo: si riprova al giro dopo
  }
}

export function log(chi, riga) {
  for (const r of String(riga).split('\n')) if (r.trim()) appendFileSync(join(DIRETTA, 'log.txt'), `${ora()}\t${chi}\t${r}\n`)
}

export function nota(testo) {
  stato('claude', { tipo: 'nota', nota: testo }, { subito: true })
  log('claude', testo)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv.slice(2)
  if (arg[0] === '--pulisci') {
    for (const f of readdirSync(DIRETTA)) if (f.endsWith('.json') && f !== 'claude.json') rmSync(join(DIRETTA, f), { force: true })
  } else if (arg.length) nota(arg.join(' '))
  else console.log(existsSync(DIRETTA) ? DIRETTA : 'niente diretta')
}
