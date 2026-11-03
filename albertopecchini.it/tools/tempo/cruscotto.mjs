// Il cruscotto della macchina del tempo (3.11.2026): la finestra dove Alberto vede cosa
// succede mentre i siti si scaricano, si ricostruiscono, si depositano e si fotografano.
// Legge gli stati e il log che i processi scrivono in lavoro/diretta/ (diretta.mjs) e li
// ridisegna quattro volte al secondo: la nota di Claude, le barre dei download, una barra
// per sito con la versione in corso, il totale con la stima della fine, il log in diretta.
//
//   powershell -File tools/tempo/cruscotto.ps1    la apre al centro dello schermo da 24"
//   node tools/tempo/cruscotto.mjs                qui, nella console che c'è

import { readdirSync, readFileSync, openSync, readSync, fstatSync, closeSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { DIRETTA } from './diretta.mjs'

process.title = 'Macchina del tempo - regia'
const out = process.stdout
const E = '\x1b['
const c = (n, s) => `${E}38;5;${n}m${s}${E}0m`
const grigio = (s) => c(245, s)
const scuro = (s) => c(239, s)
const forte = (s) => `${E}1m${s}${E}0m`
const COLORE = { ap: 33, rivalta: 71, cascina: 172, pzkko: 170, bcp: 178, claude: 81, scarico: 75, foto: 117, tempo: 250 }
const colore = (chi) => COLORE[String(chi).split('-').pop()] ?? COLORE[String(chi).split('-')[0]] ?? 250
const GIRA = ['-', '\\', '|', '/']

// la larghezza visibile di una riga, senza i codici dei colori
const visibile = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
function taglia(s, w) {
  let n = 0
  let o = ''
  for (const pezzo of s.split(/(\x1b\[[0-9;?]*[A-Za-z])/)) {
    if (pezzo.startsWith('\x1b[')) {
      o += pezzo
      continue
    }
    for (const ch of pezzo) {
      if (n >= w) return o + `${E}0m`
      o += ch
      n++
    }
  }
  return o
}
const destra = (sx, dx, w) => {
  const spazio = w - visibile(sx).length - visibile(dx).length
  return spazio >= 1 ? sx + ' '.repeat(spazio) + dx : taglia(sx, w - visibile(dx).length - 1) + ' ' + dx
}
const pad = (s, n) => (visibile(s).length >= n ? taglia(s, n) : s + ' '.repeat(n - visibile(s).length))

function barra(frazione, w, col) {
  const f = Math.max(0, Math.min(1, frazione || 0))
  const pieni = Math.floor(f * w)
  const mezzo = f * w - pieni >= 0.5 && pieni < w ? 1 : 0
  return c(col, '█'.repeat(pieni) + (mezzo ? '▓' : '')) + scuro('░'.repeat(w - pieni - mezzo))
}

const durata = (s) => {
  if (!Number.isFinite(s) || s < 0) return '—'
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}

const vivo = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function leggiStati() {
  if (!existsSync(DIRETTA)) return []
  const stati = []
  for (const f of readdirSync(DIRETTA)) {
    if (!f.endsWith('.json')) continue
    try {
      stati.push(JSON.parse(readFileSync(join(DIRETTA, f), 'utf8')))
    } catch {
      // a metà scrittura: al giro dopo
    }
  }
  return stati
}

// le ultime righe del log, leggendo solo la coda del file
function coda(n) {
  const f = join(DIRETTA, 'log.txt')
  if (!existsSync(f)) return []
  const fd = openSync(f, 'r')
  try {
    const size = fstatSync(fd).size
    const quanto = Math.min(size, 96 * 1024)
    const buf = Buffer.alloc(quanto)
    readSync(fd, buf, 0, quanto, size - quanto)
    return buf.toString('utf8').split('\n').filter(Boolean).slice(-n)
  } finally {
    closeSync(fd)
  }
}

const avvio = Date.now()
let giro = 0

function disegna() {
  const W = Math.max(80, (out.columns || 140) - 1)
  const H = Math.max(24, out.rows || 46)
  const stati = leggiStati()
  const righe = []
  const adesso = Date.now()
  giro++
  const gira = GIRA[giro % 4]

  const inizio = Math.min(avvio, ...stati.map((s) => s.inizio || Infinity))
  const orologio = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  righe.push(destra(` ${c(33, '■')} ${forte('MACCHINA DEL TEMPO')} ${grigio('· regia · albertopecchini.it/tempo')}`, grigio(`${orologio} · in giro da ${durata((adesso - inizio) / 1000)} `), W))
  righe.push(scuro('─'.repeat(W)))

  const nota = stati.find((s) => s.tipo === 'nota')
  righe.push(` ${c(81, 'Claude ►')} ${nota ? nota.nota : grigio('—')}`)
  righe.push('')

  const NOME = 22
  const BAR = Math.max(16, Math.min(40, W - 90))

  const download = stati.filter((s) => s.tipo === 'download').sort((a, b) => String(a.nome).localeCompare(b.nome))
  if (download.length) {
    righe.push(` ${forte('DOWNLOAD')} ${grigio('· i repository, con tutta la storia')}`)
    for (const d of download) {
      const fermo = !d.fine && !vivo(d.pid)
      const stato = d.fine ? c(71, '√ ') + grigio(d.testo || 'fatto') : fermo ? c(203, '× fermo ') + grigio(d.testo || '') : `${c(colore(d.chi), gira)} ${d.testo || ''}`
      righe.push(`  ${pad(c(colore(d.id || d.chi), d.nome), NOME)} ${barra(d.fine ? 1 : d.pct / 100, BAR, colore(d.id || d.chi))} ${pad(`${Math.round(d.fine ? 100 : d.pct || 0)}%`, 5)} ${stato}`)
    }
    righe.push('')
  }

  const siti = stati.filter((s) => s.tipo === 'sito').sort((a, b) => (a.ordine ?? 9) - (b.ordine ?? 9))
  let fatteTot = 0
  let totTot = 0
  let fine = 0
  if (siti.length) {
    righe.push(` ${forte('VERSIONI')} ${grigio('· un giorno di lavoro = una versione: compila, deposita, poi la foto')}`)
    for (const s of siti) {
      const col = colore(s.id)
      const fermo = !s.fine && !vivo(s.pid)
      const frazione = s.totale ? s.fatte / s.totale : s.fine ? 1 : 0
      fatteTot += s.fatte || 0
      totTot += s.totale || 0
      const media = s.tempi?.length ? s.tempi.reduce((a, b) => a + b, 0) / s.tempi.length : NaN
      const resta = s.fine ? 0 : media * ((s.totale || 0) - (s.fatte || 0)) / Math.max(1, s.paralleli || 1)
      fine = Math.max(fine, resta || 0)
      const conti = `${pad(`${s.fatte || 0}/${s.totale || 0}`, 8)} ${c(71, `√${s.ok || 0}`)} ${s.errori ? c(203, `×${s.errori}`) : scuro('×0')}`
      const tempo = s.fine ? c(71, 'finito') : fermo ? c(203, 'fermo') : `${grigio('~')}${durata(media)}${grigio('/v · resta')} ${durata(resta)}`
      righe.push(`  ${pad(c(col, s.nome), NOME)} ${barra(frazione, BAR, col)} ${pad(`${Math.round(frazione * 100)}%`, 5)} ${pad(conti, 22)} ${grigio(s.fase || '')} ${tempo}`)
      const cur = s.corrente
      if (cur && !s.fine) {
        const da = cur.da ? durata((adesso - cur.da) / 1000) : ''
        righe.push(`  ${' '.repeat(NOME)} ${c(col, fermo ? '×' : gira)} ${grigio(cur.data || '')} ${c(250, cur.short || '')} ${cur.passo ? c(col, cur.passo) : ''} ${grigio(da)} ${scuro(cur.msg ? '· ' + cur.msg : '')}`)
      } else if (s.ultimo) {
        righe.push(`  ${' '.repeat(NOME)} ${scuro(s.ultimo)}`)
      }
    }
    righe.push('')
    const fr = totTot ? fatteTot / totTot : 0
    righe.push(`  ${pad(forte('TOTALE'), NOME)} ${barra(fr, BAR, 255)} ${pad(`${Math.round(fr * 100)}%`, 5)} ${pad(`${fatteTot}/${totTot}`, 22)} ${grigio('fine stimata fra')} ${forte(durata(fine))}`)
    righe.push('')
  }

  righe.push(destra(` ${forte('LOG IN DIRETTA')}`, grigio(`${DIRETTA} `), W))
  righe.push(scuro('─'.repeat(W)))
  const spazio = Math.max(3, H - righe.length - 1)
  for (const r of coda(spazio)) {
    const [ora, chi, ...resto] = r.split('\t')
    let testo = resto.join('\t').replace(/✓/g, '√').replace(/✗/g, '×')
    if (/^\s*(√|ok\b)/.test(testo)) testo = c(71, testo)
    else if (/^\s*×|errore|error|fallit/i.test(testo)) testo = c(203, testo)
    righe.push(` ${scuro(ora || '')} ${pad(c(colore(chi), chi || ''), 14)} ${testo}`)
  }

  const frame = righe.slice(0, H - 1).map((r) => taglia(r, W) + `${E}K`).join('\n')
  out.write(`${E}?25l${E}H${frame}\n${E}J`)
}

out.write(`${E}2J`)
process.on('SIGINT', () => {
  out.write(`${E}?25h${E}0m\n`)
  process.exit(0)
})
out.on('resize', () => out.write(`${E}2J`))
setInterval(() => {
  try {
    disegna()
  } catch (e) {
    out.write(`${E}H${E}2J errore del cruscotto: ${e.message}\n`)
  }
}, 250)
