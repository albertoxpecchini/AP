// La diretta della regia di Claude (3.11.2026): qualsiasi lavoro, da qualsiasi cartella, scrive
// qui cosa sta facendo e la regia (cruscotto.mjs) lo disegna. Nata per la macchina del tempo,
// poi Alberto: «impara per qualsiasi task di aprirlo».
//
// Tutto sta in C:\Users\Alberto\.cruscotto (CRUSCOTTO per un'altra cartella):
//   stati/<chi>.json   lo stato di un processo: una barra, un sito della macchina del tempo…
//   log.txt            una riga per evento: «ora \t chi \t testo»
//   claude.json        quello che scrivono i ganci di Claude Code (gancio.mjs): la richiesta di
//                      Alberto, lo strumento in corso, i conti della sessione
//   piano.json         i passi del lavoro, con quello in corso
//   finestra.json      il battito della finestra aperta (pid e ora)
//
//   node tools/cruscotto/diretta.mjs "sto scrivendo il selettore"     la nota di Claude
//   node tools/cruscotto/diretta.mjs --piano "scarico|compilo|provo"   i passi del lavoro
//   node tools/cruscotto/diretta.mjs --passo 2                        il passo in corso (da 1); --passo fine
//   node tools/cruscotto/diretta.mjs --barra build "Build" 3 10       una barra: fatte su totale
//   node tools/cruscotto/diretta.mjs --log "testo"                    una riga nel log
//   node tools/cruscotto/diretta.mjs --pulisci                        via stati e barre dei lavori finiti

import { appendFileSync, mkdirSync, writeFileSync, renameSync, readdirSync, rmSync, readFileSync, existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const CARTELLA = process.env.CRUSCOTTO || join(homedir(), '.cruscotto')
export const STATI = join(CARTELLA, 'stati')
export const LOG = join(CARTELLA, 'log.txt')
// (per chi la chiamava così: la macchina del tempo)
export const DIRETTA = STATI
mkdirSync(STATI, { recursive: true })

const ora = () => new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour12: false })
const ultimi = new Map()

// scrittura atomica: la regia non legge mai mezzo file
export function scrivi(file, dati) {
  try {
    writeFileSync(file + `.${process.pid}.tmp`, JSON.stringify(dati))
    renameSync(file + `.${process.pid}.tmp`, file)
  } catch {
    // la regia può tenere il file aperto per un attimo: si riprova alla prossima
  }
}

export function leggi(file, altrimenti = null) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return altrimenti
  }
}

// lo stato di un processo, al più cinque volte al secondo se non si chiede `subito`
export function stato(chi, s, { subito = false } = {}) {
  const adesso = Date.now()
  if (!subito && adesso - (ultimi.get(chi) || 0) < 200) return
  ultimi.set(chi, adesso)
  scrivi(join(STATI, `${chi}.json`), { ...s, chi, agg: adesso, pid: process.pid })
}

export function log(chi, riga) {
  try {
    // il log non cresce all'infinito: oltre 4 MB si ricomincia (il vecchio resta in log-1.txt)
    if (existsSync(LOG) && statSync(LOG).size > 4 * 1024 * 1024) renameSync(LOG, join(CARTELLA, 'log-1.txt'))
    for (const r of String(riga).split('\n')) if (r.trim()) appendFileSync(LOG, `${ora()}\t${chi}\t${r.replace(/\t/g, ' ')}\n`)
  } catch {}
}

export function nota(testo) {
  stato('claude-nota', { tipo: 'nota', nota: testo }, { subito: true })
  log('claude', testo)
}

export function piano(passi) {
  scrivi(join(CARTELLA, 'piano.json'), { passi, corrente: 0, inizio: Date.now(), agg: Date.now() })
  log('claude', `piano: ${passi.join(' → ')}`)
}

export function passo(n) {
  const p = leggi(join(CARTELLA, 'piano.json'))
  if (!p) return
  p.corrente = n === 'fine' ? p.passi.length : Math.max(0, Number(n) - 1)
  p.agg = Date.now()
  scrivi(join(CARTELLA, 'piano.json'), p)
  log('claude', n === 'fine' ? 'piano finito' : `passo ${n}: ${p.passi[p.corrente] || ''}`)
}

export function barra(chi, nome, fatte, totale, testo = '') {
  stato(chi, { tipo: 'barra', nome, fatte: Number(fatte), totale: Number(totale), testo, fine: Number(fatte) >= Number(totale), inizio: leggi(join(STATI, `${chi}.json`))?.inizio || Date.now() }, { subito: true })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [primo, ...resto] = process.argv.slice(2)
  if (primo === '--pulisci') {
    for (const f of readdirSync(STATI)) {
      const s = leggi(join(STATI, f))
      if (!s || s.fine || s.tipo === 'nota') rmSync(join(STATI, f), { force: true })
    }
  } else if (primo === '--piano') piano(resto.join(' ').split('|').map((x) => x.trim()).filter(Boolean))
  else if (primo === '--passo') passo(resto[0])
  else if (primo === '--barra') barra(resto[0], resto[1], resto[2], resto[3], resto.slice(4).join(' '))
  else if (primo === '--log') log('claude', resto.join(' '))
  else if (primo) nota([primo, ...resto].join(' '))
  else console.log(CARTELLA)
}
