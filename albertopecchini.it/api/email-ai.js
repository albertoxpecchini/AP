// Assistente IA del compositore email (/email/).
//
// Funzione serverless Vercel, runtime Node. Riceve l'email in lavorazione e la
// restituisce migliorata — o corretta, accorciata, resa più formale, scritta da
// appunti, con oggetti alternativi o con un giudizio — chiamando Claude Opus 5.5
// con l'SDK ufficiale (@anthropic-ai/sdk).
//
// Segreti, solo nelle variabili d'ambiente (mai nel repository):
//   ANTHROPIC_API_KEY  la chiave della Claude API
//   EMAIL_TOOL_KEY     la chiave di accesso allo strumento: è quella nel link
//                      /email/?k=… e ogni richiesta la porta in X-Email-Key
//
// Catena di controlli: metodo e dimensione → chiave di accesso → limite di
// frequenza per IP → validazione dei campi → chiamata al modello → JSON.

import { timingSafeEqual } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'nodejs', maxDuration: 60 }

const MODEL = 'claude-opus-5-5'
const MODEL_LABEL = 'Claude Opus 5.5'
const MAX_BODY = 64 * 1024
const RATE_LIMIT = { max: 60, windowMs: 60 * 60 * 1000 } // 60 richieste l'ora per IP
const EFFORTS = new Set(['low', 'medium', 'high'])
const TONES = new Set(['professionale', 'formale', 'cordiale', 'informale', 'diretto'])

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
- Il saluto iniziale e la chiusura restano nel body. La firma NON va nel body: la aggiunge lo strumento dopo il testo. Se il testo contiene già una firma, toglila.
- Solo testo semplice: niente grassetti, Markdown o intestazioni. Un elenco puntato con il trattino solo quando serve davvero.
- Se l’oggetto inizia con «Re:», tienilo.
- Il mittente si presenta come «diplomato geometra», mai come «geometra» o «perito geometra»: è un titolo riservato agli iscritti all’albo.
- Con l’azione «correggi» cambia il meno possibile.

Contesto sul mittente, a seconda dell’account:
- Scuola (Università): studente al primo anno di Costruzioni e gestione del territorio (L-P01) all’Università di Modena e Reggio Emilia, matricola 223824; segue Analisi matematica e Fisica in videolezione dall’Università di San Marino.
- Aziendale: diplomato geometra, non iscritto all’albo, senza partita IVA (prestazione occasionale); si occupa di rilievi, CAD, 3D, siti web e identità visive, a Rivalta sul Mincio (Mantova).
- Personale: email private, tono libero.

Rispondi con un oggetto JSON con questi campi: subject (stringa), body (stringa, il testo dell’email senza firma), changes (elenco di frasi brevi in italiano che dicono cosa hai cambiato), tips (consigli o osservazioni, anche vuoto), subjects (oggetti alternativi, anche vuoto), score (intero da 0 a 100, 0 se non richiesto).`

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

async function askClaude(client, { prompt, effort }) {
  const base = { model: MODEL, max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }
  try {
    return await client.messages.create({ ...base, output_config: { effort, format: { type: 'json_schema', schema: SCHEMA } } })
  } catch (error) {
    // Se il formato strutturato non fosse accettato, si ripiega sul JSON chiesto nel prompt.
    if (error instanceof Anthropic.BadRequestError && /output_config|format|schema/i.test(error.message)) {
      return client.messages.create({ ...base, output_config: { effort }, messages: [{ role: 'user', content: `${prompt}\n\nRispondi SOLO con l’oggetto JSON, senza testo attorno.` }] })
    }
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

const list = (v) => (Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean).slice(0, 12) : [])

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

  // GET: controllo del collegamento, senza chiamare il modello.
  if (req.method === 'GET') return json(res, 200, { ok: true, model: MODEL_LABEL, modelId: MODEL, configured: Boolean(process.env.ANTHROPIC_API_KEY) })

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

  if (!process.env.ANTHROPIC_API_KEY) return json(res, 503, { ok: false, error: 'IA non configurata: manca ANTHROPIC_API_KEY tra le variabili d’ambiente di Vercel.' })

  const client = new Anthropic({ timeout: 55_000, maxRetries: 1 })
  let response
  try {
    response = await askClaude(client, { prompt: buildPrompt(data), effort: data.effort })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json(res, 502, { ok: false, error: 'La chiave API di Claude non è valida: controlla ANTHROPIC_API_KEY su Vercel.' })
    if (error instanceof Anthropic.BadRequestError && /credit balance/i.test(error.message)) {
      return json(res, 402, { ok: false, error: 'Il conto Anthropic non ha credito: ricarica su console.anthropic.com → Plans & Billing, poi riprova.' })
    }
    if (error instanceof Anthropic.RateLimitError) return json(res, 429, { ok: false, error: 'Claude è al limite di richieste: riprova tra qualche secondo.' })
    if (error instanceof Anthropic.APIConnectionError) return json(res, 504, { ok: false, error: 'Claude non ha risposto in tempo: riprova.' })
    if (error instanceof Anthropic.APIError) {
      console.error('email-ai: errore API', error.status, error.message)
      return json(res, 502, { ok: false, error: `Claude ha risposto con un errore (${error.status}).` })
    }
    console.error('email-ai: errore', error)
    return json(res, 500, { ok: false, error: 'Errore imprevisto nella funzione.' })
  }

  if (response.stop_reason === 'refusal') {
    return json(res, 422, { ok: false, error: `La richiesta è stata rifiutata dai filtri di sicurezza del modello${response.stop_details?.explanation ? `: ${response.stop_details.explanation}` : '.'}` })
  }
  if (response.stop_reason === 'max_tokens') return json(res, 502, { ok: false, error: 'Risposta troppo lunga e troncata: riprova con «Più breve» o con meno testo.' })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const parsed = parseJson(text)
  if (!parsed || typeof parsed !== 'object') {
    console.error('email-ai: risposta non JSON', text.slice(0, 300))
    return json(res, 502, { ok: false, error: 'Risposta del modello non leggibile: riprova.' })
  }

  const result = {
    subject: str(parsed.subject, 300),
    body: typeof parsed.body === 'string' ? parsed.body.trim().slice(0, 20000) : '',
    changes: list(parsed.changes),
    tips: list(parsed.tips),
    subjects: list(parsed.subjects),
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
  }
  // «oggetto» e «giudizio» non riscrivono: il testo resta quello dell'utente.
  if (data.action === 'oggetto' || data.action === 'giudizio') result.body = data.body
  if (data.action === 'giudizio') result.subject = data.subject

  return json(res, 200, {
    ok: true,
    model: MODEL_LABEL,
    result,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  })
}
