// La regia di Claude (3.11.2026): la finestra dove Alberto vede quello che Claude sta facendo,
// in qualsiasi lavoro. La apre cruscotto.ps1 al centro dello schermo da 24", e la riaprono da
// soli i ganci di Claude Code (gancio.mjs) quando arriva una richiesta e la finestra è chiusa.
//
// Questo è il guscio: i tasti, il battito (finestra.json, perché i ganci sappiano che è
// aperta), le misure del pc, dei server di casa, di git e del sito. Il disegno sta in
// vista.mjs e si ricarica da solo quando il file cambia: la regia si migliora mentre è aperta.
//
//   node tools/cruscotto/cruscotto.mjs        qui, nella console che c'è

import { execFile } from 'node:child_process'
import { statSync, statfsSync, existsSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import os from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CARTELLA, scrivi, leggi, STATI } from './diretta.mjs'
import { readdirSync, rmSync } from 'node:fs'

const QUI = dirname(fileURLToPath(import.meta.url))
const VISTA = join(QUI, 'vista.mjs')
const out = process.stdout
const E = '\x1b['
process.title = 'Regia di Claude'

// ── la vista, ricaricata quando cambia ──────────────────────────────────────
let vista = null
let versione = 0
let erroreVista = ''
async function caricaVista() {
  try {
    const m = statSync(VISTA).mtimeMs
    if (m === versione && vista) return
    versione = m
    vista = await import(pathToFileURL(VISTA).href + `?v=${m}`)
    erroreVista = ''
  } catch (e) {
    erroreVista = String(e.stack || e).split('\n').slice(0, 4).join('\n')
  }
}

// ── le misure, raccolte in disparte ─────────────────────────────────────────
const misure = { sistema: null, server: [], git: null, sito: null }

let cpuPrima = os.cpus()
function sistema() {
  const ora = os.cpus()
  let attivo = 0
  let totale = 0
  ora.forEach((c, i) => {
    const p = cpuPrima[i]?.times || c.times
    const t = (k) => c.times[k] - p[k]
    const tot = t('user') + t('nice') + t('sys') + t('idle') + t('irq')
    totale += tot
    attivo += tot - t('idle')
  })
  cpuPrima = ora
  const dischi = []
  for (const d of ['C:\\', 'D:\\']) {
    try {
      if (!existsSync(d)) continue
      const s = statfsSync(d)
      dischi.push({ nome: d.slice(0, 2), liberi: s.bavail * s.bsize, totale: s.blocks * s.bsize })
    } catch {}
  }
  misure.sistema = { cpu: totale ? attivo / totale : 0, ramLibera: os.freemem(), ramTotale: os.totalmem(), dischi, node: process.versions.node }
}

const SERVER = [
  { nome: 'pzkko', porta: 8787 },
  { nome: 'regia', porta: 8788 },
  { nome: 'tempo', porta: 8789 },
  { nome: 'vite', porta: 5173 },
]
const prova = (url, modulo = http) =>
  new Promise((ok) => {
    const t0 = Date.now()
    const r = modulo.get(url, { timeout: 3000 }, (res) => {
      res.resume()
      ok({ su: res.statusCode < 500, codice: res.statusCode, ms: Date.now() - t0 })
    })
    r.on('timeout', () => r.destroy())
    r.on('error', () => ok({ su: false, codice: 0, ms: Date.now() - t0 }))
  })
async function server() {
  misure.server = await Promise.all(SERVER.map(async (s) => ({ ...s, ...(await prova(`http://127.0.0.1:${s.porta}/`)) })))
}
async function sito() {
  misure.sito = { nome: 'albertopecchini.it', ...(await prova('https://www.albertopecchini.it/', https)) }
}

const esegui = (cmd, args, cwd) => new Promise((ok) => execFile(cmd, args, { cwd, timeout: 8000, windowsHide: true }, (e, so) => ok(e ? '' : String(so))))
async function git() {
  const cwd = leggi(join(CARTELLA, 'claude.json'), {})?.cwd || 'C:\\Users\\Alberto\\Documents\\AP'
  if (!existsSync(cwd)) return
  const stato = await esegui('git', ['status', '--porcelain=v1', '-b'], cwd)
  if (!stato) return (misure.git = null)
  const [testa, ...file] = stato.split('\n').filter(Boolean)
  const m = testa.match(/^## ([^.\s]+)(?:\.\.\.(\S+))?(?: \[(?:ahead (\d+))?,? ?(?:behind (\d+))?\])?/) || []
  // l'ora del commit come numero: «3 ore fa» lo scrive la vista, in italiano (git lo diceva in inglese)
  const ultimo = (await esegui('git', ['log', '-1', '--format=%h%x09%s%x09%ct'], cwd)).trim().split('\t')
  misure.git = { ramo: m[1], avanti: Number(m[3] || 0), indietro: Number(m[4] || 0), cambiati: file.filter((f) => !f.startsWith('?? node_modules')).length, ultimo: { sha: ultimo[0], msg: ultimo[1], ct: Number(ultimo[2]) } }
}

// ── i tasti ─────────────────────────────────────────────────────────────────
const tasti = { filtro: 'tutto', pausa: false, scorri: 0 }
let fermo = null // le righe del log congelate in pausa
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (k) => {
    if (k === 'q' || k === '\u0003') esci()
    else if (k === 'a') Object.assign(tasti, { filtro: 'tutto', scorri: 0 })
    else if (k === 'c') Object.assign(tasti, { filtro: 'claude', scorri: 0 })
    else if (k === 'l') Object.assign(tasti, { filtro: 'lavori', scorri: 0 })
    else if (k === 'e') Object.assign(tasti, { filtro: 'errori', scorri: 0 })
    else if (k === 'p') tasti.pausa = !tasti.pausa
    else if (k === '\x1b[A') tasti.scorri += 1
    else if (k === '\x1b[B') tasti.scorri = Math.max(0, tasti.scorri - 1)
    else if (k === '\x1b[5~') tasti.scorri += 15
    else if (k === '\x1b[6~') tasti.scorri = Math.max(0, tasti.scorri - 15)
    else if (k === 'x')
      for (const f of readdirSync(STATI)) {
        const s = leggi(join(STATI, f))
        if (s?.fine) rmSync(join(STATI, f), { force: true })
      }
    disegna()
  })
}

function esci() {
  out.write(`${E}?25h${E}0m\n`)
  process.exit(0)
}
process.on('SIGINT', esci)

// ── il giro ─────────────────────────────────────────────────────────────────
let giro = 0
let suonato = null
function disegna() {
  const W = Math.max(90, (out.columns || 150) - 1)
  const H = Math.max(28, out.rows || 48)
  giro++
  if (!vista) return out.write(`${E}H${E}2J la vista non si carica:\n${erroreVista}\n`)
  try {
    const dati = vista.raccogli()
    if (tasti.pausa) dati.righe = fermo ||= dati.righe
    else fermo = null
    // un suono quando Claude ha finito o aspetta (i ganci contano i suoni in claude.json)
    const suona = dati.claude?.suona || 0
    if (suonato !== null && suona > suonato) out.write('\x07')
    suonato = suona
    const frame = vista.disegna({ W, H, giro, dati, ...misure, tasti })
    out.write(`${E}?25l${E}H${frame}${erroreVista ? `\n${E}41m errore nella vista nuova: ${erroreVista.split('\n')[0]}${E}0m` : ''}${E}J`)
  } catch (e) {
    out.write(`${E}H${E}2J errore del disegno (si riprova): ${String(e.stack || e).split('\n').slice(0, 3).join(' · ')}\n`)
  }
}

out.write(`${E}2J`)
out.on('resize', () => out.write(`${E}2J`))
await caricaVista()
sistema()
server()
sito()
git()
setInterval(() => scrivi(join(CARTELLA, 'finestra.json'), { pid: process.pid, battito: Date.now() }), 1000)
scrivi(join(CARTELLA, 'finestra.json'), { pid: process.pid, battito: Date.now() })
setInterval(sistema, 1000)
setInterval(server, 5000)
setInterval(git, 10000)
setInterval(sito, 60000)
setInterval(caricaVista, 700)
setInterval(disegna, 250)
