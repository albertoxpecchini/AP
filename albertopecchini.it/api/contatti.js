// Ricezione dei moduli di contatto: /contatti/ (modulo «contatti») e
// /contatti/assistenza/ (modulo «assistenza», la pagina «Better Call Pekko»).
//
// Funzione serverless Vercel, runtime Node. Il percorso è /api/contatti e gira
// sotto lo stesso dominio del sito: nessuna dipendenza da installare e i dati
// non transitano da moduli ospitati altrove.
//
// Catena di controlli, dalla più economica alla più costosa:
//   1. metodo e dimensione del corpo
//   2. campo trappola (honeypot) e tempo di compilazione
//   3. limite di frequenza per indirizzo IP (in memoria)
//   4. validazione dei campi, speculare a quella del browser
//   5. verifica del gettone Cloudflare Turnstile
//   6. consegna: email via Resend + notifica WhatsApp via CallMeBot
//
// Se una delle due consegne fallisce ma l'altra riesce, la richiesta è servita:
// il messaggio è comunque arrivato. Fallisce solo se non arriva da nessuna parte.

export const config = { runtime: 'nodejs' }

const MAX_BODY = 16 * 1024 // 16 KB: il modulo ne produce meno di 3
const MIN_FILL_SECONDS = 3 // sotto questa soglia ha compilato un bot
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 } // 5 invii l'ora per IP

// I due moduli: stesse regole, voci diverse. `extra` è il campo facoltativo a
// scelta chiusa (budget per i progetti, urgenza per l'assistenza). Le voci
// devono coincidere con quelle di src/data/site.js e src/data/assistenza.js.
const FORMS = {
  contatti: {
    subject: 'Richiesta dal sito',
    head: 'Modulo di contatto · MOD. 01',
    types: [
      'Rilievo o restituzione grafica',
      'Pratica edilizia o catastale',
      'Modellazione 3D, BIM o rendering',
      'Sito web o landing page',
      'Logo e identità visiva',
      'Grafica e materiale stampato',
      'Un progetto che unisce più ambiti',
      'Altro',
    ],
    extra: { name: 'budget', label: 'Budget', options: ['Da definire insieme', 'Fino a 1.000 €', '1.000 — 3.000 €', '3.000 — 6.000 €', 'Oltre 6.000 €'] },
  },
  assistenza: {
    subject: 'Richiesta di assistenza',
    head: 'Better Call Pekko · MOD. 02',
    types: [
      'Virus / slow PC',
      'Duplicate files & messy folders',
      'Printer or scanner not working',
      'Speakers, sound, microphone, drivers',
      'Windows install or restore',
      'Office install or problems',
      'Change operating system',
      'Documents: layout or format conversion',
      'Backup & data recovery',
      'Wi-Fi & home network',
      'Phone full or slow',
      'New PC setup',
      'Some other computer trouble',
    ],
    extra: { name: 'urgenza', label: 'Urgenza', options: ['Whenever', 'This week', 'By tomorrow', 'NOW, it’s an emergency!!!'] },
  },
}

// ── Limite di frequenza ──────────────────────────────────────────────────────
// Memoria dell'istanza: si azzera a ogni avvio a freddo. Non è una barriera
// invalicabile, ma ferma il caso reale (lo stesso mittente che insiste) senza
// aggiungere un database. Turnstile copre il resto.

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

// ── Validazione ──────────────────────────────────────────────────────────────

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

function validate(body) {
  const form = FORMS[body.modulo] || FORMS.contatti
  const data = {
    nome: str(body.nome, 120),
    email: str(body.email, 180),
    telefono: str(body.telefono, 40),
    tipo: str(body.tipo, 80),
    extra: str(body[form.extra.name], 40),
    messaggio: str(body.messaggio, 2000),
  }
  const errors = []
  if (data.nome.length < 2) errors.push('nome')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.push('email')
  if (data.telefono && !/^[+0-9 ()./-]{6,20}$/.test(data.telefono)) errors.push('telefono')
  if (!form.types.includes(data.tipo)) errors.push('tipo')
  if (data.extra && !form.extra.options.includes(data.extra)) data.extra = ''
  if (data.messaggio.length < 20) errors.push('messaggio')
  if (body.privacy !== true && body.privacy !== 'on' && body.privacy !== 'true') errors.push('privacy')
  // Un ritorno a capo infilato nel nome non deve poter alterare le intestazioni
  // della email in uscita.
  if (/[\r\n]/.test(data.nome + data.email + data.tipo)) errors.push('nome')
  return { data, errors, form }
}

// ── Verifica Turnstile ───────────────────────────────────────────────────────

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, skipped: true } // non configurato: non blocca il modulo
  if (!token) return { ok: false, reason: 'gettone mancante' }
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    })
    const json = await res.json()
    return { ok: json.success === true, reason: (json['error-codes'] || []).join(', ') }
  } catch {
    // Cloudflare irraggiungibile: meglio far passare la richiesta che perderla.
    // Gli altri filtri (trappola, tempo, frequenza) restano attivi.
    return { ok: true, degraded: true }
  }
}

// ── Composizione del messaggio ───────────────────────────────────────────────

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])

function emailHtml(d, meta, form) {
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #e6e2d9;font:600 11px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:#8a8478;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:10px 16px;border-bottom:1px solid #e6e2d9;font:400 15px/1.6 -apple-system,Segoe UI,sans-serif;color:#1c1a17">${value}</td></tr>`
      : ''

  return `<!doctype html><html lang="it"><body style="margin:0;padding:24px;background:#f3f1ec">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;width:100%;background:#fffdf8;border:1px solid #e6e2d9;border-radius:4px">
<tr><td style="padding:20px 16px;border-bottom:2px solid #1c1a17">
<p style="margin:0;font:600 11px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a8478">${esc(form.head)}</p>
<p style="margin:6px 0 0;font:600 20px/1.3 -apple-system,Segoe UI,sans-serif;color:#1c1a17">${esc(d.tipo)}</p>
</td></tr>
<tr><td style="padding:0"><table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${row('Nome', esc(d.nome))}
${row('Email', `<a href="mailto:${esc(d.email)}" style="color:#1c1a17">${esc(d.email)}</a>`)}
${row('Telefono', d.telefono ? `<a href="tel:${esc(d.telefono.replace(/[^\d+]/g, ''))}" style="color:#1c1a17">${esc(d.telefono)}</a>` : '')}
${row(form.extra.label, esc(d.extra))}
</table></td></tr>
<tr><td style="padding:20px 16px">
<p style="margin:0 0 10px;font:600 11px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:#8a8478">Messaggio</p>
<div style="font:400 15px/1.7 -apple-system,Segoe UI,sans-serif;color:#1c1a17;white-space:pre-wrap">${esc(d.messaggio)}</div>
</td></tr>
<tr><td style="padding:14px 16px;border-top:1px solid #e6e2d9;background:#f3f1ec">
<p style="margin:0;font:400 11px/1.6 ui-monospace,Consolas,monospace;color:#8a8478">${esc(meta.when)} · ${esc(meta.ip)}<br>Rispondi a questa email per scrivere direttamente a ${esc(d.nome)}.</p>
</td></tr>
</table></body></html>`
}

const emailText = (d, meta, form) =>
  [
    `${form.subject} — ${d.tipo}`,
    '',
    `Nome:     ${d.nome}`,
    `Email:    ${d.email}`,
    d.telefono ? `Telefono: ${d.telefono}` : null,
    d.extra ? `${form.extra.label.padEnd(9)}${d.extra}` : null,
    '',
    'Messaggio:',
    d.messaggio,
    '',
    `— ${meta.when} · ${meta.ip}`,
  ]
    .filter((line) => line !== null)
    .join('\n')

// CallMeBot passa il testo in una query: niente HTML, solo il grassetto di WhatsApp.
const whatsappText = (d, form) =>
  [
    `*${form.subject}*`,
    d.tipo,
    '',
    `*${d.nome}*`,
    d.email,
    d.telefono || null,
    d.extra ? `${form.extra.label}: ${d.extra}` : null,
    '',
    d.messaggio.length > 600 ? d.messaggio.slice(0, 600) + '…' : d.messaggio,
  ]
    .filter((line) => line !== null)
    .join('\n')

// ── Consegna ─────────────────────────────────────────────────────────────────

async function sendEmail(d, meta, form) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO
  if (!key || !to) return { ok: false, reason: 'non configurato' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || 'Sito Alberto Pecchini <onboarding@resend.dev>',
      to: [to],
      // Rispondere alla notifica scrive direttamente a chi ha compilato il modulo.
      reply_to: `${d.nome} <${d.email}>`,
      subject: `${form.subject} — ${d.tipo}`,
      html: emailHtml(d, meta, form),
      text: emailText(d, meta, form),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status} ${(await res.text()).slice(0, 200)}` }
  return { ok: true }
}

async function sendWhatsApp(d, form) {
  const phone = process.env.CALLMEBOT_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY
  if (!phone || !apikey) return { ok: false, reason: 'non configurato' }

  const query = new URLSearchParams({ phone, apikey, text: whatsappText(d, form) })
  const res = await fetch(`https://api.callmebot.com/whatsapp.php?${query}`, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  return { ok: true }
}

// ── Gestore ──────────────────────────────────────────────────────────────────

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
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
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 204, {})
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return json(res, 405, { ok: false, error: 'Metodo non consentito.' })
  }

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip sconosciuto'

  let body
  try {
    body = await readBody(req)
  } catch {
    return json(res, 400, { ok: false, error: 'Richiesta non leggibile.' })
  }
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'Richiesta non leggibile.' })

  // Trappole per i bot: rispondo «ricevuto» senza consegnare nulla, così chi
  // compila in automatico non capisce di essere stato scartato e non riprova.
  if (body.sito) return json(res, 200, { ok: true })
  if (typeof body._t === 'number' && Date.now() - body._t < MIN_FILL_SECONDS * 1000) return json(res, 200, { ok: true })

  if (rateLimited(ip)) {
    return json(res, 429, { ok: false, error: 'Hai già inviato alcune richieste: riprova tra un’ora oppure scrivimi direttamente via email.' })
  }

  const { data, errors, form } = validate(body)
  if (errors.length) return json(res, 422, { ok: false, error: 'Alcuni campi non sono validi.', fields: errors })

  const check = await verifyTurnstile(body._turnstile, ip)
  if (!check.ok) return json(res, 403, { ok: false, error: 'Verifica antispam non superata: ricarica la pagina e riprova.' })

  const meta = {
    when: new Intl.DateTimeFormat('it-IT', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date()),
    ip,
  }

  const [email, whatsapp] = await Promise.allSettled([sendEmail(data, meta, form), sendWhatsApp(data, form)])
  const outcome = (r) => (r.status === 'fulfilled' ? r.value : { ok: false, reason: String(r.reason).slice(0, 200) })
  const mail = outcome(email)
  const wa = outcome(whatsapp)

  if (!mail.ok && !wa.ok) {
    console.error('contatti: nessuna consegna riuscita', { email: mail.reason, whatsapp: wa.reason })
    return json(res, 502, { ok: false, error: 'L’invio non è riuscito per un problema tecnico. Riprova tra poco oppure scrivimi direttamente.' })
  }
  if (!mail.ok) console.warn('contatti: email non consegnata —', mail.reason)
  if (!wa.ok) console.warn('contatti: notifica WhatsApp non consegnata —', wa.reason)

  return json(res, 200, { ok: true })
}
