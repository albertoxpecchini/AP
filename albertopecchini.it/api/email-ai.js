// Assistente IA del compositore email (/email/).
//
// Funzione serverless Vercel, runtime Node. Riceve l'email in lavorazione e la
// restituisce migliorata — o corretta, accorciata, resa più formale, scritta da
// appunti, con oggetti alternativi o con un giudizio. Due fornitori:
//
// - «openai» (di serie): IBM Granite 4.2 8B attraverso un endpoint compatibile
//   con l'API OpenAI (Chat Completions): OpenRouter in produzione, Ollama o vLLM
//   in locale. Nessun SDK: basta fetch.
// - «claude-code», SOLO in locale: lancia Claude Code (`claude -p`) sul computer
//   di Alberto, che usa il login del suo abbonamento Claude. Senza strumenti,
//   impostazioni, MCP né sessioni salvate: il modello riceve il testo e risponde
//   con il JSON dello schema, niente altro. Non va mai attivato su Vercel.
//
// Variabili d'ambiente (i segreti mai nel repository):
//   EMAIL_TOOL_KEY         la chiave di accesso allo strumento: è quella nel link
//                          /email/?k=… e ogni richiesta la porta in X-Email-Key
//   EMAIL_AI_PROVIDER      facoltativa: «claude-code» per l'abbonamento Claude
//   EMAIL_AI_CLAUDE_MODEL  facoltativa, di serie opus (l'Opus più recente)
//   EMAIL_AI_CLAUDE_BIN    facoltativa, di serie claude (dal PATH)
//   EMAIL_AI_API_KEY       la chiave del fornitore (OpenRouter); vuota per un server locale
//   EMAIL_AI_BASE_URL      facoltativa, di serie https://openrouter.ai/api/v1
//                          (Ollama: http://localhost:11434/v1 · vLLM: http://localhost:8000/v1)
//   EMAIL_AI_MODEL         facoltativa, di serie ibm-granite/granite-4.2-8b
//                          (Ollama: granite4.2:8b · vLLM: il --served-model-name)
//
// Catena di controlli: metodo e dimensione → chiave di accesso → limite di
// frequenza per IP → validazione dei campi → chiamata al modello → JSON.

import { timingSafeEqual } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hasClosing } from '../tools/email-generator/src/compose.js'

export const config = { runtime: 'nodejs', maxDuration: 60 }

const BASE_URL = (process.env.EMAIL_AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '')
const MODEL = process.env.EMAIL_AI_MODEL || 'ibm-granite/granite-4.2-8b'
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(BASE_URL)
const HOST = LOCAL ? 'in locale' : BASE_URL.replace(/^https?:\/\/([^/:]+).*$/i, '$1')
const CLAUDE = process.env.EMAIL_AI_PROVIDER === 'claude-code'
const CLAUDE_MODEL = process.env.EMAIL_AI_CLAUDE_MODEL || 'opus'
const CLAUDE_BIN = process.env.EMAIL_AI_CLAUDE_BIN || 'claude'
const CLAUDE_TAG = 'abbonamento Claude'
// «claude-opus-5-5» → «Claude Opus 5.5»; «opus» → «Claude Opus».
function prettyModel(id) {
  const [name, ...version] = String(id).replace(/^claude-/, '').replace(/-\d{8}$/, '').split('-')
  return `Claude ${name.charAt(0).toUpperCase()}${name.slice(1)}${version.length ? ` ${version.join('.')}` : ''}`
}
const MODEL_LABEL = CLAUDE ? `${prettyModel(CLAUDE_MODEL)} · ${CLAUDE_TAG}` : `${/granite[-_]?4\.2[-_:]?8b/i.test(MODEL) ? 'Granite 4.2 8B' : MODEL} · ${HOST}`
const MAX_BODY = 64 * 1024
const RATE_LIMIT = { max: 60, windowMs: 60 * 60 * 1000 } // 60 richieste l'ora per IP
const EFFORTS = new Set(['low', 'medium', 'high'])
const TONES = new Set(['professionale', 'formale', 'cordiale', 'informale', 'diretto'])

// Lo «sforzo» della pagina diventa il ragionamento di Granite: Rapido risponde
// subito, Normale ragiona poco, Accurato ragiona per esteso. `reasoning` lo
// leggono OpenRouter e Ollama, `chat_template_kwargs` il template di vLLM.
const THINKING = {
  low: { reasoning: { effort: 'none' }, chat_template_kwargs: { enable_thinking: false } },
  medium: { reasoning: { effort: 'low' }, chat_template_kwargs: { enable_thinking: true, low_effort: true } },
  high: { reasoning: { effort: 'high' }, chat_template_kwargs: { enable_thinking: true } },
}

// ── Azioni ───────────────────────────────────────────────────────────────────

const ACTIONS = {
  migliora: 'Migliora l’email: chiarezza, scorrevolezza, paragrafi brevi, registro coerente con il tono richiesto. Conserva tutti i fatti, i nomi, le date, i numeri e le richieste. Non allungare senza motivo.',
  correggi: 'Correggi soltanto errori di ortografia, grammatica, punteggiatura, accenti e maiuscole. Non cambiare parole, ordine delle frasi o stile: chi legge deve riconoscere il proprio testo.',
  formale: 'Riscrivi in registro più formale (Lei, formule istituzionali sobrie), senza diventare burocratico o prolisso. Conserva fatti e richieste.',
  cordiale: 'Rendi il tono più caldo e cordiale senza perdere professionalità. Conserva fatti e richieste.',
  breve: 'Accorcia: togli ripetizioni, giri di parole e premesse inutili, mantenendo ogni informazione necessaria e la richiesta. Punta a ridurre di almeno un terzo.',
  chiaro: 'Rendi la richiesta inequivocabile: una richiesta esplicita, scadenze in evidenza, elenco puntato (con il trattino) se i punti sono più di due. Conserva i fatti.',
  appunti: 'Il testo ricevuto è materiale grezzo: appunti, frasi sparse, punti. Scrivi l’email completa a partire da quel materiale: saluto, una riga di presentazione se il destinatario non conosce il mittente, corpo, richiesta, chiusura. Non aggiungere informazioni che non ci sono: se manca un dato essenziale lascia un segnaposto tra parentesi quadre.',
  oggetto: 'Proponi cinque oggetti alternativi per questa email nel campo subjects: brevi (30–60 caratteri), specifici, con l’informazione chiave all’inizio. Nel campo subject metti il migliore. Lascia il body identico all’originale.',
  giudizio: 'Valuta l’email senza riscriverla. Nel campo tips elenca, in ordine di importanza, cosa migliorare (chiarezza, tono, struttura, errori, cosa manca) e cosa funziona già; nel campo score dai un voto da 0 a 100. Restituisci subject e body identici all’originale e lascia changes vuoto.',
}

const SYSTEM = `Sei l’assistente di scrittura di Alberto Pecchini per le sue email in italiano. Scrivi in un italiano naturale e corretto, con paragrafi brevi e frasi che si leggono in un fiato.

Regole:
- Non inventare fatti, nomi, date, numeri o impegni: usa solo quello che c’è nel testo o nelle istruzioni. Se manca un dato essenziale, lascia un segnaposto tra parentesi quadre.
- Rispetta il tono richiesto e la forma di cortesia già usata dal testo (Lei, tu o voi); se il testo non ne usa una, scegli quella coerente con tono e destinatario. Ai docenti si dà del Lei, ai colleghi del voi.
- Il saluto iniziale e la chiusura restano nel body; la chiusura è la formula di congedo con il nome sotto («Cordiali saluti,» a capo «Alberto Pecchini»). La firma NON va nel body: è il blocco con ruolo e recapiti (telefono, email, sito) e la aggiunge lo strumento dopo il testo. Se il testo contiene già una firma di quel tipo, toglila.
- Il nome del destinatario non si ricava dall’indirizzo email: se non è scritto nel testo o nelle istruzioni, usa un saluto impersonale («Buongiorno,»).
- Solo testo semplice: niente grassetti, Markdown o intestazioni. Un elenco puntato con il trattino solo quando serve davvero. Tra un paragrafo e l’altro lascia una riga vuota.
- Se l’oggetto inizia con «Re:», tienilo.
- Alberto si presenta come «diplomato geometra», mai come «geometra» o «perito geometra»: è un titolo riservato agli iscritti all’albo.
- Con l’azione «correggi» cambia il meno possibile.

Contesto sul mittente, a seconda dell’account:
- Scuola (Università): studente al primo anno di Costruzioni e gestione del territorio (L-P01) all’Università di Modena e Reggio Emilia, matricola 223824; segue Analisi matematica e Fisica in videolezione dall’Università di San Marino.
- Società (Cascina Fontana): casella ordinaria della Società Agricola Cascina Fontana S.S. di Rodigo (Mantova); scrive e firma Primo Pecchini, con uno stile breve e diretto: se il testo usa «Bonjour», «ns» o «Cdt», lasciali. Per le comunicazioni con valore legale la società usa la PEC, che non è questa casella.
- Personale: email private, tono libero.

Rispondi SOLO con un oggetto JSON, senza testo attorno, con questi campi: subject (stringa), body (stringa, il testo dell’email senza firma, con gli a capo come \\n), changes (al massimo cinque frasi brevi in italiano, una per voce, che dicono cosa hai cambiato), tips (consigli o osservazioni, una per voce, anche vuoto), subjects (oggetti alternativi, anche vuoto), score (intero da 0 a 100, 0 se non richiesto).`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['subject', 'body', 'changes', 'tips', 'subjects', 'score'],
  properties: {
    subject: { type: 'string' },
    body: { type: 'string' },
    changes: { type: 'array', items: { type: 'string' } },
    tips: { type: 'array', items: { type: 'string' } },
    subjects: { type: 'array', items: { type: 'string' } },
    score: { type: 'integer' },
  },
}

// ── Limite di frequenza (memoria dell'istanza, come in api/contatti.js) ──────

const hits = new Map()

function rateLimited(ip) {
  const now = Date.now()
  const fresh = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs)
  if (hits.size > 500) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_LIMIT.windowMs)) hits.delete(k)
  if (fresh.length >= RATE_LIMIT.max) {
    hits.set(ip, fresh)
    return true
  }
  fresh.push(now)
  hits.set(ip, fresh)
  return false
}

// ── Accesso ──────────────────────────────────────────────────────────────────

function keyMatches(given) {
  const expected = process.env.EMAIL_TOOL_KEY || ''
  if (!expected || !given) return false
  const a = Buffer.from(String(given))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Claude Code e un server locale (Ollama, vLLM) non chiedono chiave; un
// fornitore in rete sì.
const configured = () => CLAUDE || LOCAL || Boolean(process.env.EMAIL_AI_API_KEY)

// ── Validazione ──────────────────────────────────────────────────────────────

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function validate(body) {
  const data = {
    action: str(body.action, 20),
    effort: EFFORTS.has(body.effort) ? body.effort : 'medium',
    tone: TONES.has(body.tone) ? body.tone : 'professionale',
    sender: {
      key: str(body.sender?.key, 20),
      label: str(body.sender?.label, 60),
      kind: str(body.sender?.kind, 30),
      email: str(body.sender?.email, 120),
      name: str(body.sender?.name, 80) || 'Alberto Pecchini',
    },
    to: Array.isArray(body.to) ? body.to.slice(0, 20).map((t) => str(t, 200)).filter(Boolean) : [],
    subject: str(body.subject, 300),
    body: str(body.body, 12000),
    instructions: str(body.instructions, 600),
  }
  const errors = []
  if (!ACTIONS[data.action]) errors.push('action')
  if (!data.body) errors.push('body')
  return { data, errors }
}

// ── Richiesta al modello ─────────────────────────────────────────────────────

function buildPrompt(d) {
  return [
    `AZIONE: ${ACTIONS[d.action]}`,
    `TONO RICHIESTO: ${d.tone}`,
    `ACCOUNT MITTENTE: ${d.sender.kind || '—'} · ${d.sender.label || '—'} — ${d.sender.name} <${d.sender.email || '—'}>`,
    `DESTINATARI: ${d.to.join(', ') || '(non indicati)'}`,
    `ISTRUZIONI DI ALBERTO: ${d.instructions || '(nessuna)'}`,
    '',
    'OGGETTO ATTUALE:',
    d.subject || '(vuoto)',
    '',
    'TESTO ATTUALE:',
    '<<<',
    d.body,
    '>>>',
  ].join('\n')
}

class ModelError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function post(body) {
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.EMAIL_AI_API_KEY) headers.Authorization = `Bearer ${process.env.EMAIL_AI_API_KEY}`
  // Su Vercel la funzione vive al massimo 60 s; in locale il primo avvio carica
  // il modello in memoria e può richiedere più di un minuto.
  const res = await fetch(`${BASE_URL}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(LOCAL ? 180_000 : 55_000) })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* risposta non JSON: la si riporta com'è */
  }
  if (!res.ok || json?.error) throw new ModelError(res.ok ? 502 : res.status, String(json?.error?.message || json?.error || text).slice(0, 400))
  return json
}

async function askGranite({ prompt, effort, action }) {
  const base = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: prompt },
    ],
    max_tokens: 8192,
    // Correggere chiede fedeltà al testo e senza ragionamento l'8B sbaglia di
    // più se si allarga la scelta: in quei casi temperatura bassa.
    temperature: action === 'correggi' || effort === 'low' ? 0.2 : 0.6,
    top_p: 0.95,
  }
  try {
    return await post({ ...base, ...THINKING[effort], response_format: { type: 'json_schema', json_schema: { name: 'email', strict: true, schema: SCHEMA } } })
  } catch (error) {
    // Se il server non accetta formato strutturato o controlli del ragionamento,
    // si ripiega sulla richiesta semplice: il JSON è comunque chiesto nel prompt.
    if (error instanceof ModelError && error.status === 400) return post(base)
    throw error
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch {
        /* non è JSON */
      }
    }
  }
  return null
}

// Se il server non separa il ragionamento (vLLM senza --reasoning-parser),
// il blocco <think> arriva nel testo: lo si toglie.
const stripThinking = (text) => text.replace(/^[\s\S]*?<\/think>/, '').replace(/<think>[\s\S]*$/, '').trim()

// L'8B a volte mette più voci in una sola stringa, a righe: le si separa.
const list = (v) =>
  Array.isArray(v)
    ? v
        .flatMap((x) => String(x ?? '').split(/\n+/))
        .map((x) => x.replace(/^\s*[-•*]\s+/, '').trim())
        .filter(Boolean)
        .slice(0, 12)
    : []

// Il congedo dell'originale («Cordiali saluti,» e il nome sotto), cercato con
// le stesse regole del generatore: l'8B a volte lo perde o lascia solo il nome,
// e allora il generatore ne aggiungerebbe un secondo dopo il nome rimasto.
function closingBlock(text) {
  const lines = text.trimEnd().split('\n')
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
    if (hasClosing(lines.slice(i).join('\n'))) return lines.slice(i).join('\n')
  }
  return ''
}

function keepClosing(original, body, senderName) {
  const closing = closingBlock(original)
  if (!closing || !body.trim() || hasClosing(body)) return body
  const lines = body.trimEnd().split('\n')
  const name = senderName.toLowerCase()
  while (lines.length && (!lines.at(-1).trim() || name.startsWith(lines.at(-1).trim().toLowerCase()))) lines.pop()
  return `${lines.join('\n').trimEnd()}\n\n${closing}`
}

// Congedo e nome su due righe: nel Markdown del generatore un a capo semplice
// unisce le righe, servono due spazi prima (il modello tende a perderli).
const keepSignOff = (body) => body.replace(/,[ \t]*\n([^\n]{1,60})$/, ',  \n$1')

function explain(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return [504, 'Granite non ha risposto in tempo: riprova con lo sforzo «Rapido».']
  if (!(error instanceof ModelError)) {
    return [502, LOCAL ? `Il server del modello non risponde su ${BASE_URL}: avvia Ollama (o vLLM) e riprova.` : `Il fornitore del modello non è raggiungibile (${HOST}).`]
  }
  if (error.status === 401 || error.status === 403) return [502, 'La chiave del fornitore non è valida: controlla EMAIL_AI_API_KEY.']
  if (error.status === 402) return [402, 'Il conto del fornitore non ha credito: ricarica (su OpenRouter: Settings → Credits) e riprova.']
  if (error.status === 404 || /not found|does not exist/i.test(error.message)) {
    return [502, LOCAL ? `Modello «${MODEL}» non trovato: scaricalo con «ollama pull ${MODEL}».` : `Modello «${MODEL}» non disponibile presso il fornitore: controlla EMAIL_AI_MODEL.`]
  }
  if (error.status === 429) return [429, 'Il fornitore del modello è al limite di richieste: riprova tra qualche secondo.']
  return [502, `Il modello ha risposto con un errore (${error.status}).`]
}

// ── Fornitori ────────────────────────────────────────────────────────────────
// Ognuno restituisce { parsed, text, model, usage } o lancia ReplyError con il
// messaggio già pronto per la pagina.

class ReplyError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function viaOpenAI(d) {
  let response
  try {
    response = await askGranite({ prompt: buildPrompt(d), effort: d.effort, action: d.action })
  } catch (error) {
    console.error('email-ai: errore', error?.status || error?.name, error?.message)
    throw new ReplyError(...explain(error))
  }
  const choice = response.choices?.[0]
  if (choice?.finish_reason === 'content_filter') throw new ReplyError(422, 'La richiesta è stata bloccata dai filtri del fornitore.')
  if (choice?.finish_reason === 'length') throw new ReplyError(502, 'Risposta troppo lunga e troncata: riprova con «Rapido», «Più breve» o con meno testo.')
  const text = stripThinking(String(choice?.message?.content || ''))
  const u = response.usage || {}
  return {
    parsed: parseJson(text),
    text,
    model: MODEL_LABEL,
    usage: {
      input: u.prompt_tokens || 0,
      output: u.completion_tokens || 0,
      reasoning: u.completion_tokens_details?.reasoning_tokens || 0,
      // OpenRouter riporta il costo in dollari; un server locale non costa nulla.
      cost: typeof u.cost === 'number' ? u.cost : LOCAL ? 0 : null,
    },
  }
}

// Claude Code parte in una cartella vuota tutta sua, senza le variabili della
// Claude API (con ANTHROPIC_API_KEY userebbe la chiave invece dell'abbonamento)
// né quelle dello strumento.
const CLAUDE_CWD = join(tmpdir(), 'albertopecchini-email-ai')
// Nessuno strumento né impostazione: il testo dell'email non può far eseguire
// comandi o leggere file, e gli hook dell'utente non partono.
const CLAUDE_SAFE = ['--tools', '', '--restricted', '--strict-mcp-config', '--no-session-persistence']

// Lancia `claude` e passa a onEvent ogni riga JSON dell'uscita appena arriva
// (con --output-format stream-json sono gli eventi della sessione).
function runClaude(args, input, timeoutMs, onEvent = () => {}) {
  const env = { ...process.env }
  for (const key of Object.keys(env)) if (/^(ANTHROPIC_|EMAIL_)/.test(key)) delete env[key]
  mkdirSync(CLAUDE_CWD, { recursive: true })
  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: CLAUDE_CWD, env, windowsHide: true })
    const events = []
    let buffer = ''
    let tail = ''
    let stderr = ''
    const take = (line) => {
      if (!line.trim()) return
      try {
        const event = JSON.parse(line)
        events.push(event)
        onEvent(event)
      } catch {
        tail = `${tail}${line}\n`.slice(-2000)
      }
    }
    const timer = setTimeout(() => {
      child.kill()
      reject(new ReplyError(504, 'Claude non ha risposto in tempo: riprova con lo sforzo «Rapido».'))
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      buffer += chunk
      let nl
      while ((nl = buffer.indexOf('\n')) >= 0) {
        take(buffer.slice(0, nl))
        buffer = buffer.slice(nl + 1)
      }
    })
    child.stderr.on('data', (b) => (stderr = `${stderr}${b}`.slice(-2000)))
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(
        error.code === 'ENOENT'
          ? new ReplyError(502, `Claude Code non è installato su questo computer (comando «${CLAUDE_BIN}» non trovato). Installalo da claude.com/claude-code, oppure togli EMAIL_AI_PROVIDER da .env.local per usare Granite.`)
          : error,
      )
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      take(buffer)
      resolve({ code, events, tail, stderr })
    })
    child.stdin.end(input)
  })
}

const resultOf = (events) => events.findLast((e) => e.type === 'result')

// ── Limiti dell'abbonamento ──────────────────────────────────────────────────
// Due fonti: l'evento rate_limit_event che accompagna ogni richiesta (sessione
// di 5 ore e settimana, in frazioni) e il comando /usage, che non consuma token
// e aggiunge i limiti settimanali per modello. Stessa forma per entrambe.

const WINDOW_LABELS = { five_hour: 'Sessione (5 ore)', seven_day: 'Settimana · tutti i modelli' }
const iso = (seconds) => (seconds ? new Date(seconds * 1000).toISOString() : null)

function limitsFromEvent(info = {}) {
  const windows = Object.entries(info.unifiedWindows || {})
    .filter(([key]) => WINDOW_LABELS[key])
    .map(([key, w]) => ({ key, label: WINDOW_LABELS[key], pct: Math.round((Number(w?.utilization) || 0) * 100), resetsAt: iso(w?.resetsAt) }))
  return { at: new Date().toISOString(), source: 'richiesta', status: info.status || null, windows }
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// «Sep 25, 3:39am», «Oct 1, 12am», «3:39am» nel fuso di questo computer.
function parseReset(text) {
  const m = /^(?:([A-Za-z]{3}) (\d{1,2}), )?(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(String(text).trim())
  if (!m) return null
  const now = new Date()
  const hour = (Number(m[3]) % 12) + (m[5].toLowerCase() === 'pm' ? 12 : 0)
  const month = m[1] ? MONTHS.indexOf(m[1].toLowerCase()) : now.getMonth()
  if (month < 0) return null
  const date = new Date(now.getFullYear(), month, m[2] ? Number(m[2]) : now.getDate(), hour, Number(m[4] || 0))
  if (date < now - 12 * 3600 * 1000) m[2] ? date.setFullYear(date.getFullYear() + 1) : date.setDate(date.getDate() + 1)
  return date.toISOString()
}

function limitsFromUsage(text) {
  const windows = []
  const re = /^Current (session|week)(?: \(([^)]+)\))?: (\d+)% used(?: · resets (.+?))?(?: \([^)]*\))?\s*$/gm
  for (const m of String(text).matchAll(re)) {
    const scope = m[2] || ''
    const key = m[1] === 'session' ? 'five_hour' : /^all models$/i.test(scope) || !scope ? 'seven_day' : `week_${scope.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const label = WINDOW_LABELS[key] || `Settimana · ${scope}`
    windows.push({ key, label, pct: Number(m[3]), resetsAt: m[4] ? parseReset(m[4]) : null })
  }
  const subscription = /using your subscription/i.test(text)
  return { at: new Date().toISOString(), source: 'usage', status: null, subscription, windows }
}

async function claudeLimits() {
  const { events, tail, stderr } = await runClaude(['-p', '/usage', '--output-format', 'json', ...CLAUDE_SAFE], '', 30_000)
  const out = resultOf(events)
  if (!out || out.is_error) {
    console.error('email-ai: /usage non leggibile', out?.result || stderr || tail)
    throw new ReplyError(502, 'Claude Code non ha restituito i limiti dell’abbonamento.')
  }
  return limitsFromUsage(out.result)
}

// ── Richiesta a Claude Code ──────────────────────────────────────────────────
// Con stream-json gli eventi arrivano mentre Claude lavora: send() li gira alla
// pagina (limiti, fase, token stimati) quando la richiesta è in streaming.

async function viaClaudeCode(d, send = () => {}) {
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    '--json-schema', JSON.stringify(SCHEMA),
    '--system-prompt', SYSTEM,
    '--model', CLAUDE_MODEL,
    '--effort', d.effort,
    '--disable-slash-commands',
    ...CLAUDE_SAFE,
  ]
  const live = { phase: 'avvio', thinking: 0, chars: 0 }
  let limits = null
  let sentAt = 0
  const progress = (force = false) => {
    const now = Date.now()
    if (!force && now - sentAt < 250) return
    sentAt = now
    // ~4 caratteri per token in italiano: è una stima, il conto esatto arriva alla fine.
    send({ type: 'progress', phase: live.phase, thinking: live.thinking, output: Math.round(live.chars / 4) })
  }
  const onEvent = (e) => {
    if (e.type === 'rate_limit_event') {
      limits = limitsFromEvent(e.rate_limit_info)
      send({ type: 'limits', limits })
    } else if (e.type === 'system' && e.subtype === 'status' && e.status === 'requesting') {
      live.phase = 'richiesta'
      progress(true)
    } else if (e.type === 'system' && e.subtype === 'thinking_tokens') {
      const first = live.phase !== 'ragiona'
      live.phase = 'ragiona'
      live.thinking = Number(e.estimated_tokens) || live.thinking
      progress(first)
    } else if (e.type === 'stream_event' && e.event?.type === 'content_block_delta') {
      const delta = e.event.delta || {}
      const piece = delta.partial_json ?? delta.text ?? ''
      if (!piece) return
      const first = live.phase !== 'scrive'
      live.phase = 'scrive'
      live.chars += piece.length
      progress(first)
    }
  }
  const { code, events, tail, stderr } = await runClaude(args, buildPrompt(d), 180_000, onEvent)
  const out = resultOf(events)
  if (!out) {
    console.error('email-ai: uscita di Claude Code non leggibile', code, stderr.slice(-300), tail.slice(-300))
    throw new ReplyError(502, `Claude Code non ha risposto come previsto${code ? ` (uscita ${code})` : ''}: ${(stderr || tail).trim().slice(-200) || 'nessun messaggio'}.`)
  }
  if (out.is_error) {
    const message = String(out.result || [].concat(out.errors || []).join(' ') || out.subtype || '')
    console.error('email-ai: errore di Claude Code', out.subtype, message.slice(0, 300))
    if (/limit/i.test(message)) throw new ReplyError(429, 'Hai raggiunto il limite di utilizzo dell’abbonamento Claude: riprova quando si azzera, oppure togli EMAIL_AI_PROVIDER da .env.local per usare Granite.')
    if (/log ?in|auth|credential|oauth|401/i.test(message)) throw new ReplyError(502, 'Claude Code non è collegato al tuo account: apri un terminale, lancia «claude» e fai /login con l’account dell’abbonamento.')
    throw new ReplyError(502, `Claude Code ha risposto con un errore: ${message.slice(0, 200) || 'sconosciuto'}.`)
  }
  // Il modello principale è quello che ha scritto di più (Claude Code usa anche
  // Haiku per piccoli compiti di contorno).
  const main = Object.entries(out.modelUsage || {}).sort((a, b) => (b[1]?.outputTokens || 0) - (a[1]?.outputTokens || 0))[0]?.[0]
  const u = out.usage || {}
  return {
    parsed: out.structured_output && typeof out.structured_output === 'object' ? out.structured_output : parseJson(String(out.result || '')),
    text: String(out.result || ''),
    model: `${prettyModel(main || CLAUDE_MODEL)} · ${CLAUDE_TAG}`,
    limits,
    usage: {
      input: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0),
      output: u.output_tokens || 0,
      reasoning: u.output_tokens_details?.thinking_tokens || 0,
      cost: null,
      // total_cost_usd è la stima a prezzi API: con l'abbonamento non si paga.
      apiValue: typeof out.total_cost_usd === 'number' ? out.total_cost_usd : null,
      note: 'incluso nell’abbonamento',
    },
  }
}

// ── Gestore ──────────────────────────────────────────────────────────────────

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new Error('corpo troppo grande')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return json(res, 204, {})
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return json(res, 405, { ok: false, error: 'Metodo non consentito.' })
  }

  if (!process.env.EMAIL_TOOL_KEY) return json(res, 503, { ok: false, error: 'Strumento non configurato: manca EMAIL_TOOL_KEY tra le variabili d’ambiente.' })
  if (!keyMatches(req.headers['x-email-key'])) return json(res, 401, { ok: false, error: 'Chiave di accesso mancante o errata.' })

  // GET: controllo del collegamento, senza chiamare il modello. Con ?limiti i
  // limiti dell'abbonamento Claude (comando /usage: nessun token consumato).
  if (req.method === 'GET') {
    if (!/[?&]limiti\b/.test(req.url || '')) {
      return json(res, 200, { ok: true, model: MODEL_LABEL, modelId: CLAUDE ? CLAUDE_MODEL : MODEL, provider: CLAUDE ? 'claude-code' : 'openai', configured: configured() })
    }
    if (!CLAUDE) return json(res, 200, { ok: true, limits: null })
    try {
      return json(res, 200, { ok: true, limits: await claudeLimits() })
    } catch (error) {
      if (error instanceof ReplyError) return json(res, error.status, { ok: false, error: error.message })
      console.error('email-ai: errore', error)
      return json(res, 500, { ok: false, error: 'Errore imprevisto nella funzione.' })
    }
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip sconosciuto'
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'Troppe richieste in un’ora: riprova più tardi.' })

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { ok: false, error: 'Richiesta non leggibile.' })
  }
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'Richiesta non leggibile.' })

  const { data, errors } = validate(body)
  if (errors.length) return json(res, 422, { ok: false, error: 'Alcuni campi non sono validi.', fields: errors })

  if (!configured()) return json(res, 503, { ok: false, error: 'IA non configurata: manca EMAIL_AI_API_KEY tra le variabili d’ambiente di Vercel.' })

  // Con Claude Code la pagina può chiedere la risposta in streaming (NDJSON):
  // riceve limiti e avanzamento mentre Claude lavora, poi l'esito. Lo stato
  // HTTP resta 200 e l'eventuale errore viaggia nell'ultimo evento.
  const stream = CLAUDE && /application\/x-ndjson/.test(req.headers.accept || '')
  if (stream) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.setHeader('X-Accel-Buffering', 'no')
  }
  const send = (event) => stream && !res.writableEnded && res.write(`${JSON.stringify(event)}\n`)
  const finish = (status, body) => (stream ? res.end(`${JSON.stringify({ type: body.ok ? 'done' : 'error', status, ...body })}\n`) : json(res, status, body))

  let reply
  try {
    reply = await (CLAUDE ? viaClaudeCode(data, send) : viaOpenAI(data))
  } catch (error) {
    if (error instanceof ReplyError) return finish(error.status, { ok: false, error: error.message })
    console.error('email-ai: errore', error)
    return finish(500, { ok: false, error: 'Errore imprevisto nella funzione.' })
  }

  const { parsed } = reply
  if (!parsed || typeof parsed !== 'object') {
    console.error('email-ai: risposta non JSON', reply.text.slice(0, 300))
    return finish(502, { ok: false, error: 'Risposta del modello non leggibile: riprova.' })
  }

  const result = {
    subject: str(parsed.subject, 300),
    body: typeof parsed.body === 'string' ? keepSignOff(keepClosing(data.body, parsed.body.trim().slice(0, 20000), data.sender.name)) : '',
    changes: list(parsed.changes),
    tips: list(parsed.tips),
    subjects: list(parsed.subjects),
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
  }
  // «oggetto» e «giudizio» non riscrivono: il testo resta quello dell'utente.
  if (data.action === 'oggetto' || data.action === 'giudizio') result.body = data.body
  if (data.action === 'giudizio') result.subject = data.subject

  return finish(200, { ok: true, model: reply.model, result, usage: reply.usage, limits: reply.limits || null })
}
