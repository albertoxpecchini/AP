// Il gancio di Claude Code per la regia (3.11.2026, Alberto: «impara per qualsiasi task di
// aprirlo»). Lo lanciano i ganci di ~/.claude/settings.json, in qualsiasi progetto, in
// background (async): legge l'evento da stdin e lo scrive nella diretta, senza mai bloccare
// e senza mai fallire (esce sempre con 0).
//
//   SessionStart, UserPromptSubmit   apre la regia se è chiusa; la richiesta di Alberto in cima
//   PreToolUse                       cosa sta facendo Claude adesso, e una riga nel log
//   PostToolUseFailure               lo strumento che è andato storto
//   Notification                     Claude aspetta Alberto (un permesso, una risposta): suona
//   Stop                             Claude ha finito il turno: tocca ad Alberto, suona

import { execFileSync } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CARTELLA, log, leggi, scrivi } from './diretta.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const FILE = join(CARTELLA, 'claude.json')

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
  const s = leggi(FILE, {})
  const adesso = Date.now()
  if (e.session_id && s.sessione !== e.session_id) Object.assign(s, { sessione: e.session_id, inizioSessione: adesso, conteggi: {}, file: [], errori: 0, strumenti: 0 })
  s.cwd = e.cwd || s.cwd
  s.agg = adesso
  s.conteggi ||= {}
  s.file ||= []

  if (evento === 'SessionStart') {
    apri(s)
    log('alberto', `sessione nuova in ${basename(s.cwd || '')}`)
  } else if (evento === 'UserPromptSubmit') {
    apri(s)
    Object.assign(s, { stato: 'lavora', richiesta: { testo: corto(e.prompt, 400), da: adesso }, adesso: null, avviso: null })
    log('alberto', corto(e.prompt, 300))
  } else if (evento === 'PreToolUse') {
    const tool = e.tool_name || '?'
    const cosa = descrivi(tool, e.tool_input)
    Object.assign(s, { stato: 'lavora', adesso: { tool, testo: cosa, da: adesso }, avviso: null, strumenti: (s.strumenti || 0) + 1 })
    s.conteggi[tool] = (s.conteggi[tool] || 0) + 1
    const f = e.tool_input?.file_path
    if (f && /^(Edit|Write|NotebookEdit|MultiEdit)$/.test(tool)) s.file = [f, ...s.file.filter((x) => x !== f)].slice(0, 40)
    log(`claude-${tool}`, cosa)
  } else if (evento === 'PostToolUseFailure') {
    s.errori = (s.errori || 0) + 1
    log(`claude-${e.tool_name || '?'}`, `× ${corto(e.error || e.tool_response?.error || 'non è andato', 200)}`)
  } else if (evento === 'Notification') {
    Object.assign(s, { stato: 'aspetta', avviso: corto(e.message, 160), suona: (s.suona || 0) + 1 })
    log('alberto', `⚠ ${corto(e.message, 200)}`)
  } else if (evento === 'Stop') {
    Object.assign(s, { stato: 'fermo', adesso: null, fineTurno: adesso, suona: (s.suona || 0) + 1 })
    log('claude', '√ ho finito: tocca a te')
  }
  scrivi(FILE, s)
}
