// Il disegno della regia (3.11.2026). cruscotto.mjs lo ricarica da solo quando questo file
// cambia: si migliora la regia mentre è aperta, senza chiuderla. Qui la lettura dei dati della
// diretta, la sessione in cima, i tasti e il disegno; battito, sistema, git e server li raccoglie
// cruscotto.mjs.
//
// Dall'alto: lo stato (lavora, tocca a te, ti aspetta), la richiesta di Alberto, la nota di
// Claude, lo strumento in corso o la fine del turno; le altre sessioni; il piano dei passi; le
// barre (download, siti della macchina del tempo, barre qualsiasi); sistema, server di casa, git,
// sessione; il log in diretta.

import { readdirSync, openSync, readSync, fstatSync, closeSync, existsSync, rmSync } from 'node:fs'
import { basename, join } from 'node:path'
import { STATI, LOG, CARTELLA, leggi } from './diretta.mjs'

// la macchina del tempo prima della regia generale scriveva qui: i giri partiti allora si vedono ancora
const VECCHIA = 'C:/Users/Alberto/Documents/AP/albertopecchini.it/tools/tempo/lavoro/diretta'
// una per sessione di Claude (le scrive gancio.mjs): Alberto ne tiene aperte più d'una
const SESSIONI = join(CARTELLA, 'sessioni')

const E = '\x1b['
const c = (n, s) => `${E}38;5;${n}m${s}${E}39m`
const sf = (n, s) => `${E}48;5;${n}m${s}${E}49m`
const forte = (s) => `${E}1m${s}${E}22m`
const grigio = (s) => c(245, s)
const scuro = (s) => c(239, s)
const VERDE = 71
const ROSSO = 203
const GIALLO = 221
const BLU = 75
const COLORE = { ap: 33, rivalta: 71, cascina: 172, pzkko: 170, bcp: 178, claude: 81, alberto: 221, scarico: 75, prova: 117, tempo: 250, giro: 250 }
const STRUMENTO = { Bash: 75, PowerShell: 75, Edit: 114, Write: 114, MultiEdit: 114, NotebookEdit: 114, Read: 248, Grep: 180, Glob: 180, Agent: 141, Task: 141, Skill: 141, WebFetch: 117, WebSearch: 117, Artifact: 213 }
const colore = (chi = '') => {
  if (chi.startsWith('claude-')) return STRUMENTO[chi.slice(7)] ?? (chi.includes('mcp__') ? 213 : 81)
  return COLORE[chi.split('-').pop()] ?? COLORE[chi.split('-')[0]] ?? 250
}
// ogni sessione il suo colore, sempre lo stesso: viene dalla sigla
const TINTE = [81, 213, 114, 215, 141, 117, 209, 151, 186, 75]
const tinta = (sigla = '') => TINTE[[...sigla].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TINTE.length]
const corto = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
// solo simboli che Consolas, il carattere della console, ha davvero: ✓ e i puntini braille
// uscivano come quadratini (3.11.2026)
const GIRA = ['∙', '•', '●', '•']
const OK = '√'

// ── misure e tagli, coi codici dei colori che non contano ───────────────────
const visibile = (s) => String(s).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
export function taglia(s, w) {
  let n = 0
  let o = ''
  for (const pezzo of String(s).split(/(\x1b\[[0-9;?]*[A-Za-z])/)) {
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
const pad = (s, n) => (visibile(s).length >= n ? taglia(s, n) : s + ' '.repeat(n - visibile(s).length))
const destra = (sx, dx, w) => {
  const spazio = w - visibile(sx).length - visibile(dx).length
  return spazio >= 1 ? sx + ' '.repeat(spazio) + dx : taglia(sx, Math.max(0, w - visibile(dx).length - 1)) + ' ' + dx
}
const aCapo = (testo, w, righe) => {
  const parole = String(testo).split(/\s+/)
  const out = ['']
  for (const p of parole) {
    if ((out.at(-1) + ' ' + p).trim().length > w) {
      if (out.length >= righe) {
        out[out.length - 1] = taglia(out.at(-1), w - 1) + '…'
        return out
      }
      out.push(p)
    } else out[out.length - 1] = (out.at(-1) + ' ' + p).trim()
  }
  return out
}
function barra(frazione, w, col) {
  const f = Math.max(0, Math.min(1, frazione || 0))
  const pieni = Math.floor(f * w)
  const mezzo = f * w - pieni >= 0.5 && pieni < w ? 1 : 0
  return c(col, '█'.repeat(pieni) + (mezzo ? '▌' : '')) + scuro('░'.repeat(w - pieni - mezzo))
}
export const durata = (s) => {
  if (!Number.isFinite(s) || s < 0) return '—'
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`
}
const fra = (ms) => durata((Date.now() - ms) / 1000)
const gb = (b) => `${(b / 1024 ** 3).toLocaleString('it-IT', { maximumFractionDigits: 1 })} GB`

// ── i dati della diretta ─────────────────────────────────────────────────────
const vivo = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function statiDa(cartella) {
  if (!existsSync(cartella)) return []
  const out = []
  for (const f of readdirSync(cartella)) {
    if (!f.endsWith('.json')) continue
    const s = leggi(join(cartella, f))
    if (s) out.push(s)
  }
  return out
}

function coda(file, n) {
  if (!existsSync(file)) return []
  const fd = openSync(file, 'r')
  try {
    const size = fstatSync(fd).size
    const quanto = Math.min(size, 160 * 1024)
    const buf = Buffer.alloc(quanto)
    readSync(fd, buf, 0, quanto, size - quanto)
    return buf.toString('utf8').split('\n').filter(Boolean).slice(-n)
  } finally {
    closeSync(fd)
  }
}

export function raccogli() {
  const stati = [...statiDa(STATI), ...statiDa(VECCHIA)]
  // le note di Claude, la più recente prima: ogni sessione ha la sua (diretta.mjs le firma)
  const note = stati.filter((s) => s.tipo === 'nota').sort((a, b) => b.agg - a.agg)
  // i piani: piano-<sigla>.json per sessione, piano.json di chi scrive da fuori di Claude Code
  const piani = {}
  for (const f of readdirSync(CARTELLA)) {
    const m = f.match(/^piano(?:-(\w+))?\.json$/)
    if (m) piani[m[1] || ''] = leggi(join(CARTELLA, f))
  }
  const righe = [...coda(LOG, 400), ...coda(join(VECCHIA, 'log.txt'), 200).filter((r) => !r.includes('\tclaude\t'))].sort((a, b) => a.slice(0, 8).localeCompare(b.slice(0, 8)))
  const tutte = statiDa(SESSIONI)
  // le sessioni dell'ultimo giorno; quelle chiuse restano un minuto, perché si veda che sono chiuse
  const sessioni = tutte.filter((s) => Date.now() - (s.agg || 0) < 86400 * 1000 && !(s.stato === 'chiusa' && Date.now() - (s.chiusa || 0) > 60 * 1000)).sort((a, b) => b.agg - a.agg)
  return {
    stati: stati.filter((s) => s.tipo !== 'nota'),
    note,
    sessioni,
    // i ganci contano i suoni (fine turno, attesa) in ogni sessione: il guscio suona quando la somma cresce
    suona: tutte.reduce((n, s) => n + (s.suona || 0), 0),
    claude: principale(sessioni) || {},
    piani,
    righe,
  }
}

// La sessione in cima: quella fissata col tasto «s»; se no, fra quelle che lavorano (o aspettano)
// l'ultima a cui Alberto ha chiesto qualcosa, così la cima non salta a ogni strumento quando ne
// lavorano due insieme; se nessuna lavora, l'ultima che si è mossa.
export function principale(sessioni = [], fissata = null) {
  if (fissata) {
    const s = sessioni.find((x) => x.sigla === fissata)
    if (s) return s
  }
  const attive = sessioni.filter((s) => s.stato === 'lavora' || s.stato === 'aspetta')
  if (attive.length) return attive.sort((a, b) => (b.richiesta?.da || b.agg) - (a.richiesta?.da || a.agg))[0]
  return sessioni.find((s) => s.stato !== 'chiusa') || sessioni[0]
}

// la cartella su cui il guscio misura git: quella della sessione in cima
export const cartella = (tasti = {}) => principale(statiDa(SESSIONI).sort((a, b) => b.agg - a.agg), tasti.sessione)?.cwd

// I tasti (tranne «q», che resta al guscio): stanno qui perché se ne aggiungano a regia aperta.
// Torna true se il tasto era suo.
export function tasto(k, tasti) {
  if (k === 'a') Object.assign(tasti, { filtro: 'tutto', scorri: 0 })
  else if (k === 'c') Object.assign(tasti, { filtro: 'claude', scorri: 0 })
  else if (k === 'l') Object.assign(tasti, { filtro: 'lavori', scorri: 0 })
  else if (k === 'e') Object.assign(tasti, { filtro: 'errori', scorri: 0 })
  else if (k === 'p') tasti.pausa = !tasti.pausa
  else if (k === '\x1b[A') tasti.scorri += 1
  else if (k === '\x1b[B') tasti.scorri = Math.max(0, tasti.scorri - 1)
  else if (k === '\x1b[5~') tasti.scorri += 15
  else if (k === '\x1b[6~') tasti.scorri = Math.max(0, tasti.scorri - 15)
  else if (k === 's') {
    // da «tutte» alla prima sessione, alla seconda, … e di nuovo a «tutte»
    const elenco = raccogli().sessioni.filter((s) => s.stato !== 'chiusa').map((s) => s.sigla)
    const i = elenco.indexOf(tasti.sessione)
    tasti.sessione = i + 1 < elenco.length ? elenco[i + 1] : null
    tasti.scorri = 0
  } else if (k === 'x') {
    // via le barre dei lavori finiti e le sessioni chiuse
    for (const f of readdirSync(STATI)) if (leggi(join(STATI, f))?.fine) rmSync(join(STATI, f), { force: true })
    if (existsSync(SESSIONI)) for (const f of readdirSync(SESSIONI)) if (leggi(join(SESSIONI, f))?.stato === 'chiusa') rmSync(join(SESSIONI, f), { force: true })
  } else return false
  return true
}

// ── il disegno ───────────────────────────────────────────────────────────────
export function disegna({ W, H, giro, dati, sistema, server, git, sito, pubblici, tasti }) {
  const righe = []
  const adesso = Date.now()
  const gira = GIRA[giro % GIRA.length]
  const sessioni = dati.sessioni || []
  const cl = principale(sessioni, tasti.sessione) || dati.claude || {}
  const NOME = 22
  const BAR = Math.max(16, Math.min(44, W - 92))
  const progettoDi = (s) => basename(s.radice || s.cwd || '?')

  // lo stato di Claude
  const fermo = cl.stato === 'fermo' || cl.stato === 'chiusa'
  const aspetta = cl.stato === 'aspetta'
  const badge = cl.stato === 'chiusa' ? sf(240, forte(c(231, ' CHIUSA '))) : aspetta ? sf(ROSSO, forte(c(231, ' TI ASPETTA '))) : fermo ? sf(GIALLO, forte(c(232, ' TOCCA A TE '))) : sf(VERDE, forte(c(231, ` ${gira} LAVORA `)))
  const progetto = cl.cwd ? progettoDi(cl) : ''
  // con più sessioni aperte, la sigla di quella in cima (col suo colore, lo stesso dei segni nel log)
  const sigla = sessioni.length > 1 && cl.sigla ? `  ${c(tinta(cl.sigla), '▌#' + cl.sigla)}${tasti.sessione ? grigio(' fissata') : ''}` : ''
  const orologio = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  righe.push(destra(` ${c(33, '■')} ${forte('REGIA DI CLAUDE')}  ${badge}  ${progetto ? grigio('in ') + forte(progetto) : ''}${git?.ramo ? grigio(' · ') + c(141, git.ramo) : ''}${sigla}`, grigio(`${orologio} `), W))
  righe.push(scuro('─'.repeat(W)))

  // la richiesta di Alberto, la nota di Claude, lo strumento in corso
  if (cl.richiesta?.testo) {
    const r = aCapo(cl.richiesta.testo, W - 26, 2)
    righe.push(` ${c(GIALLO, 'Alberto ►')}  ${r[0]}${r.length === 1 ? '  ' + scuro(fra(cl.richiesta.da) + ' fa') : ''}`)
    if (r[1]) righe.push(`            ${r[1]}  ${scuro(fra(cl.richiesta.da) + ' fa')}`)
  }
  // la nota la scrive Claude a mano (diretta.mjs), e la firma con la sua sessione; una senza
  // firma (scritta da fuori) vale solo se è nata durante la richiesta in corso; dopo sei ore tace
  const diQuesta = (x) => x && (x.sessione ? x.sessione === cl.sigla : !cl.sigla || x.agg >= (cl.richiesta?.da || Infinity))
  const n = (dati.note || []).find((x) => x.sessione === cl.sigla) || (dati.note || []).find((x) => !x.sessione && diQuesta(x))
  const nota = n && adesso - (n.agg || 0) < 6 * 3600 * 1000 ? `${n.nota}  ${scuro(fra(n.agg) + ' fa')}` : grigio('—')
  righe.push(` ${c(81, 'Claude  ►')}  ${nota}`)
  if (aspetta) righe.push(` ${c(ROSSO, 'Aspetta ►')}  ${forte(cl.avviso || 'una tua risposta')}  ${scuro(fra(cl.agg) + ' fa')}`)
  else if (fermo) {
    // il turno finito: quanto è durato, con quanti strumenti, e l'inizio della risposta
    const r = cl.risposta
    const come = r?.secondi != null ? ` (ci ho messo ${durata(r.secondi)}${r.strumenti ? `, ${r.strumenti} ${r.strumenti === 1 ? 'strumento' : 'strumenti'}` : ''})` : ''
    righe.push(` ${c(GIALLO, 'Fermo   ►')}  ${grigio(`${cl.stato === 'chiusa' ? 'sessione chiusa' : 'ho finito il turno'} ${fra(cl.fineTurno || cl.chiusa || adesso)} fa${come}: tocca a te`)}`)
    if (r?.testo) for (const riga of aCapo(r.testo, W - 16, 2)) righe.push(`            ${c(252, riga)}`)
  } else if (cl.adesso) righe.push(` ${c(VERDE, 'Adesso  ►')}  ${c(STRUMENTO[cl.adesso.tool] ?? 81, pad(cl.adesso.tool, 10))} ${cl.adesso.testo}  ${scuro(fra(cl.adesso.da))}${cl.turno > 1 ? scuro(` · ${cl.turno}° strumento del turno`) : ''}`)

  // le altre sessioni di Claude aperte (al massimo quattro): progetto, stato, cosa fanno
  const altre = sessioni.filter((s) => s !== cl && adesso - (s.agg || 0) < 3 * 3600 * 1000).slice(0, 4)
  altre.forEach((s, i) => {
    const st = s.stato === 'chiusa' ? scuro('chiusa    ') : s.stato === 'aspetta' ? sf(ROSSO, c(231, 'TI ASPETTA')) : s.stato === 'lavora' ? c(VERDE, pad(`${gira} lavora`, 10)) : c(GIALLO, 'tocca a te')
    const cosa = s.stato === 'aspetta' ? forte(corto(s.avviso, 60)) : s.stato === 'lavora' && s.adesso ? `${c(STRUMENTO[s.adesso.tool] ?? 81, s.adesso.tool)} ${grigio(corto(s.adesso.testo, 50))}` : grigio(corto(s.risposta?.testo, 60))
    const testa = i ? '         ' : c(250, 'Altre   ►')
    righe.push(` ${testa}  ${c(tinta(s.sigla), '▌')}${pad(forte(progettoDi(s)), 18)} ${scuro(pad('#' + s.sigla, 6))} ${st}  ${c(GIALLO, '«' + corto(s.richiesta?.testo || '—', 44) + '»')}  ${cosa}  ${scuro(fra(s.agg) + ' fa')}`)
  })
  righe.push('')

  // il piano
  const p = dati.piani?.[cl.sigla] || (diQuesta(dati.piani?.['']) ? dati.piani[''] : null)
  if (p?.passi?.length && adesso - p.agg < 6 * 3600 * 1000) {
    let voci = p.passi.map((x, i) => (i < p.corrente ? c(VERDE, OK + ' ') + grigio(x) : i === p.corrente ? c(GIALLO, gira + ' ') + forte(x) : scuro('· ' + x)))
    const fatto = Math.min(p.corrente, p.passi.length)
    const testa = ` ${forte('PIANO')} ${grigio(`${fatto}/${p.passi.length}`)}  ${barra(fatto / p.passi.length, 12, VERDE)}  `
    // se non ci sta tutto, i passi fatti diventano uno solo: si vede sempre quello in corso e i prossimi
    if (visibile(testa + voci.join('  →  ')).length > W && fatto > 1) voci = [c(VERDE, `${OK} ${fatto} fatti`), ...voci.slice(fatto)]
    righe.push(testa + voci.join(scuro('  →  ')))
    righe.push('')
  }

  // le barre: download, siti della macchina del tempo, barre qualsiasi
  const download = dati.stati.filter((s) => s.tipo === 'download')
  const siti = dati.stati.filter((s) => s.tipo === 'sito').sort((a, b) => (a.ordine ?? 9) - (b.ordine ?? 9))
  const barre = dati.stati.filter((s) => s.tipo === 'barra' && (!s.fine || adesso - s.agg < 10 * 60 * 1000))
  const recente = (s) => !s.fine || adesso - s.agg < 30 * 60 * 1000
  for (const d of download.filter(recente)) {
    const ferma = !d.fine && !vivo(d.pid)
    righe.push(`  ${pad(c(BLU, d.nome), NOME)} ${barra(d.fine ? 1 : d.pct / 100, BAR, BLU)} ${pad(`${Math.round(d.fine ? 100 : d.pct || 0)}%`, 5)} ${d.fine ? c(VERDE, OK + ' ') + grigio(d.testo || '') : ferma ? c(ROSSO, '× fermo') : gira + ' ' + (d.testo || '')}`)
  }
  for (const b of barre) {
    const f = b.totale ? b.fatte / b.totale : 0
    righe.push(`  ${pad(c(141, b.nome), NOME)} ${barra(f, BAR, 141)} ${pad(`${Math.round(f * 100)}%`, 5)} ${grigio(`${b.fatte}/${b.totale}`)} ${b.fine ? c(VERDE, OK) : gira} ${grigio(b.testo || '')}`)
  }
  const sitiVivi = siti.filter(recente)
  // un giro della macchina del tempo tutto finito: una riga sola
  if (sitiVivi.length && sitiVivi.every((s) => s.fine)) {
    const fatte = sitiVivi.reduce((n, s) => n + (s.fatte || 0), 0)
    const errori = sitiVivi.reduce((n, s) => n + (s.errori || 0), 0)
    const ultimo = Math.max(...sitiVivi.map((s) => s.agg || 0))
    righe.push(`  ${pad(forte('MACCHINA DEL TEMPO'), NOME)} ${barra(1, BAR, VERDE)} ${c(VERDE, OK + ' finito')} ${grigio(`${sitiVivi.map((s) => s.nome).join(' · ')} · ${fatte} ${sitiVivi[0].fase || ''}`)}${errori ? ' ' + c(ROSSO, `×${errori}`) : ''} ${scuro(fra(ultimo) + ' fa')}`)
  } else if (sitiVivi.length) {
    let fatteTot = 0
    let totTot = 0
    let fine = 0
    for (const s of sitiVivi) {
      const col = colore(s.id)
      const ferma = !s.fine && !vivo(s.pid)
      const fr = s.totale ? s.fatte / s.totale : s.fine ? 1 : 0
      fatteTot += s.fatte || 0
      totTot += s.totale || 0
      const media = s.tempi?.length ? s.tempi.reduce((a, b) => a + b, 0) / s.tempi.length : NaN
      const resta = s.fine ? 0 : (media * ((s.totale || 0) - (s.fatte || 0)))
      // un sito che lavora senza ancora una media: la fine non si sa
      fine = Number.isNaN(fine) || (!s.fine && !Number.isFinite(resta)) ? NaN : Math.max(fine, resta || 0)
      const conti = `${pad(`${s.fatte || 0}/${s.totale || 0}`, 8)} ${c(VERDE, `${OK}${s.ok || 0}`)} ${s.errori ? c(ROSSO, `×${s.errori}`) : scuro('×0')}`
      const tempo = s.fine ? c(VERDE, 'finito') : ferma ? c(ROSSO, 'fermo') : `${grigio('~')}${durata(media)}${grigio('/v · resta')} ${durata(resta)}`
      righe.push(`  ${pad(c(col, s.nome), NOME)} ${barra(fr, BAR, col)} ${pad(`${Math.round(fr * 100)}%`, 5)} ${pad(conti, 20)} ${pad(grigio(s.fase || ''), 9)} ${tempo}`)
      if (s.corrente && !s.fine) righe.push(`  ${' '.repeat(NOME)} ${c(col, ferma ? '×' : gira)} ${grigio(s.corrente.data || '')} ${c(250, s.corrente.short || '')} ${s.corrente.passo ? c(col, s.corrente.passo) : ''} ${grigio(s.corrente.da ? fra(s.corrente.da) : '')} ${scuro(s.corrente.msg ? '· ' + s.corrente.msg : '')}`)
    }
    if (sitiVivi.length > 1) {
      const fr = totTot ? fatteTot / totTot : 0
      righe.push(`  ${pad(forte('TOTALE'), NOME)} ${barra(fr, BAR, 255)} ${pad(`${Math.round(fr * 100)}%`, 5)} ${pad(`${fatteTot}/${totTot}`, 20)} ${pad('', 9)} ${grigio('fine fra')} ${forte(durata(fine))}`)
    }
  }
  if (download.length || barre.length || sitiVivi.length) righe.push('')

  // sistema, server di casa, git, sessione
  const etichetta = (t) => forte(pad(t, 9))
  if (sistema) {
    const ram = 1 - sistema.ramLibera / sistema.ramTotale
    const colCpu = sistema.cpu > 0.85 ? ROSSO : sistema.cpu > 0.6 ? GIALLO : VERDE
    const colRam = ram > 0.9 ? ROSSO : ram > 0.75 ? GIALLO : VERDE
    const dischi = (sistema.dischi || []).map((d) => `${d.nome} ${grigio(gb(d.liberi) + ' liberi')}`).join(grigio(' · '))
    righe.push(` ${etichetta('SISTEMA')} CPU ${barra(sistema.cpu, 10, colCpu)} ${pad(Math.round(sistema.cpu * 100) + '%', 4)}  RAM ${barra(ram, 10, colRam)} ${grigio(`${gb(sistema.ramTotale - sistema.ramLibera)}/${gb(sistema.ramTotale)}`)}  ${dischi}  ${grigio(`node ${sistema.node}`)}`)
  }
  if (server?.length) {
    const pallino = (s) => (s.su ? c(VERDE, '●') : c(ROSSO, '●'))
    const dettaglio = server.map((s) => `${pallino(s)} ${s.nome} ${scuro(s.su ? `${s.ms} ms` : 'spento')}`).join('   ')
    // fuori di casa: il sito pubblico e il tunnel della macchina del tempo (quello che vede Gabry)
    const pub = (pubblici || (sito ? [sito] : [])).map((p) => `${p.su ? c(VERDE, '●') : c(ROSSO, '●')} ${p.nome} ${scuro(p.su ? `${p.codice} · ${p.ms} ms` : p.codice || 'non risponde')}`).join('   ')
    righe.push(` ${etichetta('SERVER')} ${dettaglio}   ${pub}`)
  }
  if (git?.ramo) {
    const cambi = git.cambiati ? c(GIALLO, `${git.cambiati} cambiati`) : c(VERDE, 'pulito')
    const sync = `${git.avanti ? c(GIALLO, `↑${git.avanti}`) : scuro('↑0')} ${git.indietro ? c(ROSSO, `↓${git.indietro}`) : scuro('↓0')}`
    const quando = git.ultimo?.ct ? fra(git.ultimo.ct * 1000) + ' fa' : ''
    righe.push(` ${etichetta('GIT')} ${c(141, git.ramo)} ${sync}  ${cambi}  ${grigio('ultimo')} ${c(250, git.ultimo?.sha || '')} ${scuro(taglia(git.ultimo?.msg || '', Math.max(10, W - 80)))} ${grigio(quando)}`)
  }
  if (cl.sessione) {
    const conti = Object.entries(cl.conteggi || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => `${c(STRUMENTO[t] ?? 81, t.replace(/^mcp__\w+__/, ''))} ${n}`).join(grigio(' · '))
    righe.push(` ${etichetta('SESSIONE')} ${forte(String(cl.strumenti || 0))} ${grigio('strumenti')}  ${conti}  ${grigio('·')} ${(cl.file || []).length} ${grigio((cl.file || []).length === 1 ? 'file toccato' : 'file toccati')}${cl.errori ? '  ' + c(ROSSO, `${cl.errori} ${cl.errori === 1 ? 'errore' : 'errori'}`) : ''}  ${grigio('da')} ${fra(cl.inizioSessione || adesso)}`)
    // gli ultimi file che Claude ha scritto o cambiato
    if (cl.file?.length) righe.push(` ${etichetta('FILE')} ${cl.file.slice(0, 8).map((f, i) => (i ? grigio(basename(f)) : c(114, basename(f)))).join(scuro('  ·  '))}`)
  }
  righe.push('')

  // il log in diretta
  const filtro = tasti.filtro
  const nomeFiltro = { tutto: 'tutto', claude: 'solo Claude', errori: 'solo errori', lavori: 'solo i lavori' }[filtro]
  righe.push(destra(` ${forte('LOG IN DIRETTA')} ${grigio('· ' + nomeFiltro)}${tasti.pausa ? '  ' + sf(GIALLO, c(232, ' IN PAUSA ')) : ''}${tasti.scorri ? '  ' + grigio(`↑ ${tasti.scorri} righe indietro`) : ''}`, grigio(`${CARTELLA} `), W))
  righe.push(scuro('─'.repeat(W)))
  const piede = 1
  const spazio = Math.max(3, H - righe.length - piede)
  // «claude-Bash#728a»: chi scrive e, dopo il #, la sessione (le righe dei lavori non ce l'hanno)
  let log = dati.righe.map((r) => {
    const [ora, tutto = '', ...resto] = r.split('\t')
    const [chi, sess] = tutto.split('#')
    return { ora, chi, sess, testo: resto.join(' ') }
  })
  // un errore comincia con ×; per i lavori anche una riga che dice «errore», «fallito»…, ma non
  // per Claude e Alberto, che scrivono «errori» anche solo per dire cosa fanno
  const sbagliato = (l) => /^\s*[×✗⚠!]/.test(l.testo) || (!l.chi.startsWith('claude') && l.chi !== 'alberto' && /errore|error|fallit|non risponde/i.test(l.testo))
  if (tasti.sessione) log = log.filter((l) => !l.sess || l.sess === tasti.sessione)
  if (filtro === 'claude') log = log.filter((l) => l.chi.startsWith('claude') || l.chi === 'alberto')
  else if (filtro === 'errori') log = log.filter(sbagliato)
  else if (filtro === 'lavori') log = log.filter((l) => !l.chi.startsWith('claude') && l.chi !== 'alberto')
  const fino = Math.max(0, log.length - (tasti.scorri || 0))
  const visto = log.slice(Math.max(0, fino - spazio), fino)
  // il segno della sessione solo quando nel log ce n'è più d'una
  const segni = new Set(visto.map((l) => l.sess).filter(Boolean)).size > 1
  for (const l of visto) {
    let testo = l.testo.replace(/✗/g, '×').replace(/⚠/g, '!')
    if (/^\s*(√|✓|ok\b)/.test(testo)) testo = c(VERDE, testo.replace(/✓/g, OK))
    else if (sbagliato(l)) testo = c(ROSSO, testo)
    else if (l.chi === 'alberto') testo = c(GIALLO, testo)
    const chi = l.chi.startsWith('claude-') ? l.chi.slice(7).replace(/^mcp__\w+__/, '') : l.chi
    const segno = segni ? (l.sess ? c(tinta(l.sess), '▌') : ' ') : ''
    righe.push(`${segno || ' '}${scuro(l.ora || '')} ${pad(c(colore(l.chi), chi), 14)} ${testo}`)
  }
  while (righe.length < H - piede) righe.push('')

  // i tasti
  const t = (k, s) => `${sf(238, c(255, ` ${k} `))} ${grigio(s)}`
  const voceSessione = tasti.sessione ? `sessione #${tasti.sessione}` : 'tutte le sessioni'
  righe.push(' ' + [t('a', 'tutto'), t('c', 'Claude'), t('l', 'lavori'), t('e', 'errori'), ...(sessioni.length > 1 || tasti.sessione ? [t('s', voceSessione)] : []), t('p', 'pausa'), t('↑↓', 'scorri'), t('x', 'pulisci finiti'), t('q', 'esci')].join('  '))
  return righe.slice(0, H).map((r) => taglia(r, W) + `${E}0m${E}K`).join('\n')
}
