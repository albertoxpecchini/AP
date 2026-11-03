// Il gancio di Claude Code per la regia (3.11.2026, Alberto: «impara per qualsiasi task di
// aprirlo»). Lo lanciano i ganci di ~/.claude/settings.json, in qualsiasi progetto, in
// background (async): legge l'evento da stdin e lo scrive nella diretta, senza mai bloccare
// e senza mai fallire (esce sempre con 0).
//
//   SessionStart, UserPromptSubmit   apre la regia se è chiusa; la richiesta di Alberto in cima
//   PreToolUse                       cosa sta facendo Claude adesso, e una riga nel log
//   PostToolUseFailure               lo strumento che è andato storto
//   Notification                     Claude aspetta Alberto (un permesso, una risposta): suona
//   Stop                             Claude ha finito il turno: tocca ad Alberto, suona; l'inizio
//                                    della risposta, quanto è durato il turno e con quanti strumenti
//   SessionEnd                       la sessione è chiusa: la regia la toglie dalle altre

import { execFileSync } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync, readdirSync, rmSync, openSync, readSync, fstatSync, closeSync } from 'node:fs'
import { CARTELLA, log, leggi, scrivi } from './diretta.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
// Una cartella per sessione: i ganci sono di tutto l'utente, e le altre sessioni di Claude aperte
// insieme si sovrascrivevano lo stato e i conti (3.11.2026). Nel log la sessione è il «#xxxx»
// dopo chi scrive, perché la regia dia a ognuna il suo colore.
const SESSIONI = join(CARTELLA, 'sessioni')
mkdirSync(SESSIONI, { recursive: true })
const sigla = (id) => String(id || 'anon').replace(/[^a-z0-9]/gi, '').slice(0, 4)

let testo = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (d) => (testo += d))
process.stdin.on('end', () => {
  try {
    gestisci(JSON.parse(testo || '{}'))
  } catch (e) {
    // CRUSCOTTO_DEBUG=1 per vedere cosa non va; ai ganci veri non si risponde mai con un errore
    if (process.env.CRUSCOTTO_DEBUG) console.error(e)
  }
  process.exit(0)
})
setTimeout(() => process.exit(0), 12000).unref()

const corto = (s, n = 90) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
const file = (p) => (p ? `${basename(dirname(p))}/${basename(p)}` : '')

// in una riga, cosa fa lo strumento
function descrivi(tool, i = {}) {
  if (/^(Bash|PowerShell)$/.test(tool)) return corto(i.description || i.command)
  if (/^(Read|Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) return file(i.file_path || i.notebook_path)
  if (tool === 'Grep') return `cerca «${corto(i.pattern, 50)}»${i.path ? ' in ' + basename(i.path) : ''}`
  if (tool === 'Glob') return `trova ${corto(i.pattern, 60)}`
  if (tool === 'Agent' || tool === 'Task') return corto(i.description || i.prompt)
  if (tool === 'Skill') return corto(i.skill)
  if (tool === 'WebFetch') return corto(i.url)
  if (tool === 'WebSearch') return `cerca sul web «${corto(i.query, 60)}»`
  if (tool === 'ToolSearch') return corto(i.query)
  if (tool === 'Artifact') return corto(`${i.action || 'pubblica'} ${i.file_path || i.url || ''}`)
  if (tool === 'TaskStop') return corto(i.task_id)
  if (tool.startsWith('mcp__')) return corto(tool.split('__').slice(1).join(' · '))
  return corto(Object.values(i).find((x) => typeof x === 'string') || '')
}

// L'ultimo messaggio scritto, dalla coda della trascrizione (JSONL): «assistant» la risposta di
// Claude, «user» la richiesta di Alberto (non i risultati degli strumenti, non i pezzi <…> che
// aggiunge l'editor, non il riassunto della compattazione)
function ultimo(trascrizione, tipo, kb = 512) {
  if (!trascrizione) return null
  const fd = openSync(trascrizione, 'r')
  try {
    const size = fstatSync(fd).size
    const quanto = Math.min(size, kb * 1024)
    const buf = Buffer.alloc(quanto)
    readSync(fd, buf, 0, quanto, size - quanto)
    for (const riga of buf.toString('utf8').split('\n').reverse()) {
      if (!riga.includes(`"${tipo}"`)) continue
      let m
      try {
        m = JSON.parse(riga)
      } catch {
        continue
      }
      if (m.type !== tipo || m.isMeta || m.isCompactSummary) continue
      const c = m.message?.content
      const pezzi = typeof c === 'string' ? [c] : Array.isArray(c) ? c.filter((p) => p.type === 'text').map((p) => p.text) : []
      const testo = pezzi.filter((p) => !p.trimStart().startsWith('<')).join(' ')
      if (testo.trim()) return { testo, da: Date.parse(m.timestamp) || Date.now() }
    }
    return null
  } finally {
    closeSync(fd)
  }
}

// le sessioni ferme da più di tre giorni non servono più a nessuno
function pulisci() {
  for (const f of readdirSync(SESSIONI)) {
    const s = leggi(join(SESSIONI, f))
    if (!s || Date.now() - (s.agg || 0) > 3 * 86400 * 1000) rmSync(join(SESSIONI, f), { force: true })
  }
}

// la regia è aperta? se no la si apre (non più di una volta ogni 20 secondi)
function apri(s) {
  const f = leggi(join(CARTELLA, 'finestra.json'))
  if (f && Date.now() - f.battito < 5000) return
  if (Date.now() - (s.apertura || 0) < 20000) return
  s.apertura = Date.now()
  // La finestra la fa nascere WMI (Win32_Process.Create), fuori dall'albero di questo processo:
  // un figlio «detached» del gancio moriva con lui, perché Claude Code chiude tutto il gruppo
  // del gancio quando finisce (3.11.2026)
  const ps1 = join(QUI, 'cruscotto.ps1')
  const comando = `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${ps1}"`
  try {
    const r = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `(Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${comando.replace(/'/g, "''")}' }).ReturnValue`], { timeout: 9000, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    log('regia', String(r).trim() === '0' ? 'apro la regia (era chiusa)' : `× la regia non si apre (WMI ${String(r).trim()})`)
  } catch (e) {
    log('regia', `× la regia non si apre: ${corto(e.message, 120)}`)
  }
}

function gestisci(e) {
  const evento = e.hook_event_name || ''
  const id = sigla(e.session_id)
  const FILE = join(SESSIONI, `${id}.json`)
  const s = leggi(FILE, null) || { sessione: e.session_id, sigla: id, inizioSessione: Date.now(), conteggi: {}, file: [], errori: 0, strumenti: 0 }
  const adesso = Date.now()
  s.cwd = e.cwd || s.cwd
  // il progetto è la cartella in cui la sessione è nata: i comandi poi la portano altrove
  s.radice ||= s.cwd
  s.agg = adesso
  s.conteggi ||= {}
  s.file ||= []
  const scrive = (chi, testo) => log(`${chi}#${id}`, testo)
  // una sessione che la regia vede per la prima volta a metà (ganci nuovi, compattazione): la
  // richiesta di Alberto la si ripesca dalla trascrizione, una volta sola
  if (!s.richiesta && !s.cercata && evento !== 'UserPromptSubmit') {
    s.cercata = true
    try {
      const u = ultimo(e.transcript_path, 'user', 24 * 1024)
      if (u) s.richiesta = { testo: corto(u.testo, 400), da: u.da }
    } catch {}
  }

  if (evento === 'SessionStart') {
    apri(s)
    pulisci()
    // «resume» e «compact» riprendono la stessa sessione: non è nuova
    Object.assign(s, { stato: s.stato === 'chiusa' ? 'fermo' : s.stato || 'fermo' })
    scrive('alberto', e.source === 'compact' ? 'la conversazione si è compattata e riprende' : e.source === 'resume' ? `riprendo la sessione in ${basename(s.cwd || '')}` : `sessione nuova in ${basename(s.cwd || '')}`)
  } else if (evento === 'UserPromptSubmit') {
    apri(s)
    Object.assign(s, { stato: 'lavora', richiesta: { testo: corto(e.prompt, 400), da: adesso }, adesso: null, avviso: null, turno: 0 })
    scrive('alberto', corto(e.prompt, 300))
  } else if (evento === 'PreToolUse') {
    const tool = e.tool_name || '?'
    const cosa = descrivi(tool, e.tool_input)
    Object.assign(s, { stato: 'lavora', adesso: { tool, testo: cosa, da: adesso }, avviso: null, strumenti: (s.strumenti || 0) + 1, turno: (s.turno || 0) + 1 })
    s.conteggi[tool] = (s.conteggi[tool] || 0) + 1
    const f = e.tool_input?.file_path
    if (f && /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) s.file = [f, ...s.file.filter((x) => x !== f)].slice(0, 40)
    scrive(`claude-${tool}`, cosa)
  } else if (evento === 'PostToolUseFailure') {
    s.errori = (s.errori || 0) + 1
    scrive(`claude-${e.tool_name || '?'}`, `× ${corto(e.error || e.tool_response?.error || 'non è andato', 200)}`)
  } else if (evento === 'Notification') {
    Object.assign(s, { stato: 'aspetta', avviso: corto(e.message, 160), suona: (s.suona || 0) + 1 })
    scrive('alberto', `⚠ ${corto(e.message, 200)}`)
  } else if (evento === 'Stop') {
    let testo = e.last_assistant_message || ''
    try {
      testo ||= ultimo(e.transcript_path, 'assistant')?.testo || ''
    } catch {}
    const durata = s.richiesta?.da ? Math.round((adesso - s.richiesta.da) / 1000) : null
    Object.assign(s, { stato: 'fermo', adesso: null, fineTurno: adesso, suona: (s.suona || 0) + 1, risposta: { testo: corto(testo, 400), da: adesso, secondi: durata, strumenti: s.turno || 0 } })
    scrive('claude', `√ ho finito${durata != null ? ` in ${durata < 60 ? durata + 's' : Math.floor(durata / 60) + 'm ' + String(durata % 60).padStart(2, '0') + 's'}` : ''}${s.turno ? ` con ${s.turno} ${s.turno === 1 ? 'strumento' : 'strumenti'}` : ''}: ${corto(testo, 160) || 'tocca a te'}`)
  } else if (evento === 'SessionEnd') {
    Object.assign(s, { stato: 'chiusa', adesso: null, chiusa: adesso })
    scrive('alberto', `sessione chiusa${e.reason && e.reason !== 'other' ? ` (${e.reason})` : ''}`)
  }
  scrivi(FILE, s)
}
