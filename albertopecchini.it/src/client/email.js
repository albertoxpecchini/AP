// Compositore email (/email/): mittente, guida con i tasti, campi, output,
// miglioramento con l'IA, statistiche e rubrica.
//
// L'output è la stessa email del generatore da riga di comando: qui girano i
// suoi moduli puri (tools/email-generator/src) — composizione di saluto e
// chiusura, Markdown, modello HTML a tabelle, firma, validazione, report —
// con il tema, la firma, il logo e le icone che il template ha già messo nel
// blocco JSON della pagina. Il carattere Archivo viene incorporato in base64
// appena scaricato, come in email.html.
//
// Tutto lo stato vive nella pagina e nel localStorage di questo browser (bozza
// corrente, bozze salvate, preferiti, indirizzi nuovi, chiave di accesso).
// L'unica chiamata di rete verso terzi è /api/email-ai, che parla con Granite.

import { $, $$, announce } from './utils.js'
import { renderEmailHtml } from '../../tools/email-generator/src/template.js'
import { renderMarkdown, markdownToText } from '../../tools/email-generator/src/markdown.js'
import { composeBody, buildPreheader, buildGreeting, buildClosing, hasGreeting, hasClosing } from '../../tools/email-generator/src/compose.js'
import { validate } from '../../tools/email-generator/src/validate.js'
import { buildReport } from '../../tools/email-generator/src/report.js'
import { fontFaceCss } from '../../tools/email-generator/src/font-css.js'
import { formatDateIt, todayIso, slugify } from '../../tools/email-generator/src/util.js'
import { themeFor } from '../../tools/email-generator/src/stili.js'
import archivoUrl from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url'

const API = '/api/email-ai'
// Sul dev server di questo computer (`npm run dev`) la chiave di accesso la
// aggiunge il server stesso (plugins/api-dev.js): la pagina non la chiede.
const LOCAL_DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
const keyHeader = (key) => (key ? { 'X-Email-Key': key } : {})
const LS = { key: 'ap:email:key', draft: 'ap:email:draft', fav: 'ap:email:fav', contacts: 'ap:email:contacts', drafts: 'ap:email:drafts', usage: 'ap:email:usage', limits: 'ap:email:limits' }
const USAGE_MAX = 500 // richieste tenute nel registro dei consumi
const USAGE_ROWS = 30 // righe mostrate nella tabella
const GMAIL_CLIP_BYTES = 102 * 1024

const STATUS_LABEL = {
  READY: 'READY — email pronta',
  WARNING: 'WARNING — email generata, ci sono avvisi da leggere',
  MISSING_REQUIRED_DATA: 'MISSING_REQUIRED_DATA — dati obbligatori mancanti, email non pronta',
}

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* memoria non disponibile: si lavora senza salvataggio */
    }
  },
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])
const num = new Intl.NumberFormat('it-IT')
const kb = (bytes) => `${(bytes / 1024).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} KB`
const bytesOf = (s) => new TextEncoder().encode(s).length

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/
const TITLE_RE = /^(prof\.ssa|prof\.|prof|dott\.ssa|dott\.|dott|ing\.|arch\.|geom\.|avv\.|sig\.ra|sig\.|sig)\s+/i
const ACRONYMS = /^(UNIMORE|UNIRSM|WHATSAPP|MICROSOFT|AUTOCAD|ARCHICAD|SKETCHUP|REVIT|GITHUB|VERCEL)$/i

const AI_LABELS = {
  migliora: 'Migliora',
  correggi: 'Correggi',
  formale: 'Più formale',
  cordiale: 'Più cordiale',
  breve: 'Più breve',
  chiaro: 'Richiesta chiara',
  appunti: 'Scrivi da appunti',
  oggetto: 'Proponi oggetti',
  giudizio: 'Giudizio',
}

const EFFORT_LABEL = { low: 'Rapido', medium: 'Normale', high: 'Accurato' }

// Fasi di una richiesta a Claude Code, come le riporta la funzione in streaming.
const PHASES = { avvio: 'Claude Code si avvia', richiesta: 'richiesta inviata, attesa del modello', ragiona: 'Claude ragiona', scrive: 'Claude scrive la risposta' }

// ── Destinatari e righe ──────────────────────────────────────────────────────

function parseRecipients(value) {
  return String(value || '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = /^"?([^"<]*?)"?\s*<([^>]+)>$/.exec(raw)
      const email = (m ? m[2] : raw).trim()
      const name = m ? m[1].trim() : ''
      return { raw, name, email, valid: EMAIL_RE.test(email) }
    })
}

const formatRecipient = (r) => (r.name ? `${r.name} <${r.email}>` : r.email)
const firstName = (name) => String(name).replace(TITLE_RE, '').trim().split(/\s+/)[0] || ''
const lines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
const extType = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return m ? m[1].toUpperCase() : '—'
}

// ── Testo ────────────────────────────────────────────────────────────────────

function analyze(text) {
  text = String(text || '').trim()
  const words = text ? text.split(/\s+/).filter(Boolean) : []
  const letters = (text.match(/\p{L}/gu) || []).length
  const sentences = text
    .split(/(?:[.!?…]+["»)]?\s+)|\n+/)
    .map((s) => s.trim())
    .filter((s) => /\p{L}/u.test(s))
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim()).length
  const W = words.length
  const S = Math.max(sentences.length, W ? 1 : 0)
  const gulpease = W ? Math.max(0, Math.min(100, Math.round(89 + (300 * S - 10 * letters) / W))) : null
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 30).length
  const shouting = (text.match(/\b[A-ZÀ-Ü]{5,}\b/g) || []).filter((w) => !ACRONYMS.test(w)).length
  const exclamations = (text.match(/!/g) || []).length
  const placeholders = (text.match(/\[[^\]\n]{1,80}\]|\.\.\./g) || []).length
  const sloppySpaces = /[^\S\n][^\S\n]|\s[,.;:!?]/.test(text)
  return { text, words: W, letters, sentences: S, paragraphs, gulpease, longSentences, shouting, exclamations, placeholders, sloppySpaces, readingSeconds: Math.round((W / 200) * 60), avg: S ? Math.round((W / S) * 10) / 10 : 0 }
}

const readabilityLabel = (g) => (g === null ? '—' : g >= 80 ? `${g} · molto facile` : g >= 60 ? `${g} · facile` : g >= 40 ? `${g} · media` : `${g} · difficile`)
const readingLabel = (s) => (s < 5 ? '< 5 s' : s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`)

function toBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
const utf8Base64 = (s) => toBase64(new TextEncoder().encode(s))
const encodeHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${utf8Base64(s)}?=`)

// ── Appunti e download ───────────────────────────────────────────────────────

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
    document.body.append(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      /* niente */
    }
    ta.remove()
    return ok
  }
}

async function copyRich(html, text) {
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })])
      return true
    } catch {
      /* si prova la via successiva */
    }
  }
  const box = document.createElement('div')
  box.contentEditable = 'true'
  box.innerHTML = html
  box.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
  document.body.append(box)
  const range = document.createRange()
  range.selectNodeContents(box)
  const sel = getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    /* niente */
  }
  sel.removeAllRanges()
  box.remove()
  return ok
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Modulo ───────────────────────────────────────────────────────────────────

export function initEmail() {
  const root = $('[data-email]')
  if (!root) return
  const data = JSON.parse($('#email-data').textContent)

  const els = {
    to: $('[data-em-field="to"]', root),
    cc: $('[data-em-field="cc"]', root),
    bcc: $('[data-em-field="bcc"]', root),
    subject: $('[data-em-field="subject"]', root),
    tone: $('[data-em-field="tone"]', root),
    body: $('[data-em-field="body"]', root),
    links: $('[data-em-field="links"]', root),
    attachments: $('[data-em-field="attachments"]', root),
    signature: $('[data-em-field="signature"]', root),
    form: $('[data-em-form]', root),
    senderMail: $('[data-em-sender-mail]', root),
    tips: $('[data-em-tips]', root),
    signaturePreview: $('[data-em-signature]', root),
    autosave: $('[data-em-autosave]', root),
    progress: $('[data-em-progress]', root),
    progressValue: $('[data-em-progress-value]', root),
    progressNote: $('[data-em-progress-note]', root),
    subjectHint: $('[data-em-subject-hint]', root),
    subjectCount: $('[data-em-subject-count]', root),
    bodyCount: $('[data-em-body-count]', root),
    outMeta: $('[data-em-out-meta]', root),
    outFrom: $('[data-em-out-from]', root),
    outTo: $('[data-em-out-to]', root),
    outCc: $('[data-em-out-cc]', root),
    outCcRow: $('[data-em-out-cc-row]', root),
    outBcc: $('[data-em-out-bcc]', root),
    outBccRow: $('[data-em-out-bcc-row]', root),
    outSubject: $('[data-em-out-subject]', root),
    outPreheader: $('[data-em-out-preheader]', root),
    stateDot: $('[data-em-state-dot]', root),
    stateText: $('[data-em-state]', root),
    iframe: $('[data-em-iframe]', root),
    outText: $('[data-em-out-text]', root),
    outReport: $('[data-em-out-report]', root),
    outSource: $('[data-em-out-source]', root),
    validation: $('[data-em-validation]', root),
    outStatus: $('[data-em-out-status]', root),
    mailto: $('[data-em-open="mailto"]', root),
    webmail: $('[data-em-open="webmail"]', root),
    drafts: $('[data-em-drafts]', root),
    draftsList: $('[data-em-drafts-list]', root),
    ai: $('.em-ai', root),
    aiNotes: $('[data-em-ai-notes]', root),
    aiStatus: $('[data-em-ai-status]', root),
    aiResult: $('[data-em-ai-result]', root),
    aiAction: $('[data-em-ai-action]', root),
    aiUsage: $('[data-em-ai-usage]', root),
    aiScore: $('[data-em-ai-score]', root),
    aiSubject: $('[data-em-ai-subject]', root),
    aiBody: $('[data-em-ai-body]', root),
    aiSubjects: $('[data-em-ai-subjects]', root),
    aiChanges: $('[data-em-ai-changes]', root),
    aiTips: $('[data-em-ai-tips]', root),
    aiModel: $('[data-em-ai-model]', root),
    checks: $('[data-em-checks]', root),
    checksCount: $('[data-em-checks-count]', root),
    search: $('[data-em-search]', root),
    contactForm: $('[data-em-contact-form]', root),
    contactStatus: $('[data-em-contact-status]', root),
    rubricaCount: $('[data-em-rubrica-count]', root),
    datalist: $('#em-rubrica', root),
    accessDot: $('[data-em-access-dot]', root),
    accessText: $('[data-em-access-text]', root),
    accessForm: $('[data-em-access-form]', root),
    accessInput: $('[data-em-access-input]', root),
    usageRows: $('[data-em-usage-rows]', root),
    limits: $('[data-em-limits]', root),
    limitsAt: $('[data-em-limits-at]', root),
    limitsNote: $('[data-em-limits-note]', root),
  }

  const state = { sender: data.senders[0]?.key, tone: 'professionale', to: '', cc: '', bcc: '', subject: '', body: '', links: '', attachments: '', signature: true }
  const font = { css: '', bytes: 0, base64Bytes: 0 }
  let extra = store.get(LS.contacts, []).filter((c) => c && c.email)
  let favs = new Set(store.get(LS.fav, []))
  let aiProposal = null
  let aiBusy = false
  let aiProvider = ''
  let live = null
  let usage = store.get(LS.usage, []).filter((e) => e && e.t)
  let limits = store.get(LS.limits, null)
  let saveTimer = null
  let frameTimer = null
  let current = null

  const currentSender = () => data.senders.find((s) => s.key === state.sender) || data.senders[0]
  const currentTone = () => data.tones.find((t) => t.key === state.tone) || data.tones[0]
  const currentEffort = () => $('input[name="effort"]:checked', root)?.value || 'medium'
  const currentView = () => $('input[name="em-view"]:checked', root)?.value || 'html'
  const allContacts = () => [...data.contacts, ...extra]
  const findContact = (email) => allContacts().find((c) => c.email.toLowerCase() === String(email).toLowerCase())
  const iconOf = (file) => data.assets?.[file] || ''

  // ── Stato ↔ campi ────────────────────────────────────────────────────────

  function readFields() {
    state.to = els.to.value
    state.cc = els.cc.value
    state.bcc = els.bcc.value
    state.subject = els.subject.value
    state.tone = els.tone.value
    state.body = els.body.value
    state.links = els.links.value
    state.attachments = els.attachments.value
    state.signature = els.signature.checked
    state.sender = $('input[name="mittente"]:checked', root)?.value || state.sender
  }

  function writeFields() {
    els.to.value = state.to
    els.cc.value = state.cc
    els.bcc.value = state.bcc
    els.subject.value = state.subject
    els.tone.value = state.tone
    els.body.value = state.body
    els.links.value = state.links
    els.attachments.value = state.attachments
    els.signature.checked = state.signature
    const radio = $(`input[name="mittente"][value="${state.sender}"]`, root)
    if (radio) radio.checked = true
  }

  function restoreDraft() {
    const saved = store.get(LS.draft, null)
    if (!saved || typeof saved !== 'object') return
    for (const k of Object.keys(state)) if (k in saved) state[k] = saved[k]
    if (!data.senders.some((s) => s.key === state.sender)) state.sender = data.senders[0]?.key
    if (!data.tones.some((t) => t.key === state.tone)) state.tone = 'professionale'
    writeFields()
  }

  function scheduleSave() {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      store.set(LS.draft, { ...state })
      const when = new Intl.DateTimeFormat('it-IT', { timeStyle: 'short' }).format(new Date())
      els.autosave.textContent = `Bozza salvata alle ${when}`
    }, 400)
  }

  // ── Composizione: gli stessi passi di generate.js ───────────────────────

  function build() {
    const sender = currentSender()
    // Lo stile della casella, come in generate.js (stili.js).
    const theme = themeFor(sender.style, data.theme)
    const to = parseRecipients(state.to)
    const cc = parseRecipients(state.cc)
    const bcc = parseRecipients(state.bcc)
    const toList = to.map(formatRecipient)
    const ccList = cc.map(formatRecipient)
    const bccList = bcc.map(formatRecipient)
    const subject = state.subject.trim()
    const date = todayIso()
    const slug = slugify(subject, 'email')
    const id = `${date}-${slug}`

    const footer = state.signature ? sender.footer : null
    const composed = composeBody({ rawBody: state.body, tone: state.tone, to: toList, senderName: footer?.name ?? '' })
    const bodyHtml = renderMarkdown(composed.markdown, theme, { icon: iconOf })
    const preheader = buildPreheader(composed.markdown)
    const links = lines(state.links)
    // Come in generate.js: nell'email compare il nome del file, non il percorso.
    const attachmentEntries = lines(state.attachments)
    const attachments = attachmentEntries.map((entry) => ({ entry, name: entry.split(/[\\/]/).pop(), type: extType(entry) }))

    const common = {
      subject,
      preheader,
      eyebrow: sender.label,
      title: '',
      subtitle: '',
      bodyHtml,
      footer,
      footerLogo: footer ? sender.logo : null,
      attachments,
      links,
      theme,
      dateLabel: formatDateIt(date),
    }
    const liteHtml = renderEmailHtml({ ...common, fontCss: '' })
    const html = font.css && theme.font.embed !== false ? renderEmailHtml({ ...common, fontCss: font.css }) : liteHtml

    // Testo semplice, come in generate.js.
    const textParts = [markdownToText(composed.markdown)]
    if (links.length) textParts.push('', 'Collegamenti:', ...links.map((l) => `- ${l}`))
    if (attachments.length) textParts.push('', 'Allegati:', ...attachments.map((f) => `- ${f.name} (${f.type})`))
    if (footer) textParts.push('', '—', sender.signature)
    const text = `${textParts.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`

    const input = {
      meta: { id, date, fromProfile: sender.key, to: toList, cc: ccList, bcc: bccList, replyTo: '', subject, language: 'it', tone: state.tone, priority: 'normal', footerProfile: 'auto', requestConfirmation: false },
      purpose: '',
      links,
      attachments: attachmentEntries,
    }
    const profile = { key: sender.key, email: sender.email, label: sender.label, provider: sender.provider, footerId: sender.footerId }
    const validation = validate({ input, profile, footer, bodyMarkdown: composed.markdown, html, attachments: [], sources: [] })

    return { sender, theme, to, cc, bcc, toList, ccList, bccList, subject, date, slug, id, footer, composed, preheader, links, attachments, html, liteHtml, text, input, profile, validation }
  }

  function reportOf(b) {
    const stats = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      words: markdownToText(b.composed.markdown).split(/\s+/).filter(Boolean).length,
      htmlBytes: bytesOf(b.html),
      liteBytes: bytesOf(b.liteHtml),
      fontEmbedded: Boolean(font.css) && b.theme.font.embed !== false,
      fontBytes: b.theme.font.embed !== false ? font.bytes : 0,
      fontBase64Bytes: b.theme.font.embed !== false ? font.base64Bytes : 0,
      footerVersion: b.footer?.id ?? '—',
      themeSource: b.theme.source,
      inputFile: `emails/in/${b.id}.md (compositore online /email/)`,
    }
    const outputs = { html: 'email.html', lite: 'email-lite.html', text: 'email.txt', preview: null, report: 'report.md', attachments: null }
    const attachments = b.attachments.map((f) => ({ entry: f.entry, path: null, exists: true, type: f.type, bytes: 0 }))
    return buildReport({ input: b.input, profile: b.profile, footer: b.footer, footerLearn: { message: '' }, validation: b.validation, attachments, sources: [], outputs, stats, composeNotes: b.composed.notes, generatorVersion: data.generatorVersion })
      .replace('- [preview.html](./preview.html) — anteprima con il pulsante «Copia email formattata»\n', '- la pagina /email/ fa da anteprima, con il pulsante «Copia email formattata»\n')
      .replace('1. Apri **preview.html** nel browser.', '1. Resta sulla pagina /email/: l’anteprima è lì.')
      .replace(/ · 0 B/g, ' · dichiarato in pagina, da allegare a mano')
  }

  /** Il file di input del generatore, per rigenerare la stessa email da riga di comando. */
  function inputMdOf(b) {
    const fence = /```/.test(state.body) ? '````' : '```'
    const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    const yamlList = (arr) => (arr.length ? `\n${arr.map((v) => `  - ${q(v)}`).join('\n')}` : ' []')
    const listBlock = (arr) => (arr.length ? arr.map((v) => `- ${v}`).join('\n') : '')
    return [
      '# EMAIL INPUT TEMPLATE',
      '',
      `> Generato dal compositore online (/email/) il ${formatDateIt(b.date)}: si rigenera con`,
      `> \`npm run email emails/in/${b.id}.md\`.`,
      '',
      '---',
      '',
      '## METADATI',
      '',
      '```yaml',
      `id: ${q(b.id)}`,
      `date: ${q(b.date)}`,
      `from_profile: ${q(b.sender.key)}`,
      `to:${yamlList(b.toList)}`,
      `cc:${yamlList(b.ccList)}`,
      `bcc:${yamlList(b.bccList)}`,
      'reply_to: ""',
      `subject: ${q(b.subject)}`,
      'language: "it"',
      `tone: ${q(state.tone)}`,
      'priority: "normal"',
      'footer_profile: "auto"',
      'request_confirmation: false',
      '```',
      '',
      '---',
      '',
      "## SCOPO DELL'EMAIL",
      '',
      '```text',
      'Email composta nel compositore online (/email/).',
      '```',
      '',
      '---',
      '',
      '## MATERIALE GREZZO',
      '',
      `${fence}text`,
      state.body.replace(/\s+$/, ''),
      fence,
      '',
      '---',
      '',
      '## FILE DA ALLEGARE',
      '',
      '```text',
      listBlock(b.attachments.map((f) => f.entry)),
      '```',
      '',
      '---',
      '',
      '## LINK DA INSERIRE',
      '',
      '```text',
      listBlock(b.links),
      '```',
      '',
      '---',
      '',
      '## FOOTER DA IMPARARE / AGGIORNARE',
      '',
      '```text',
      '[INIZIO FOOTER]',
      '[FINE FOOTER]',
      '```',
      '',
      '### Regola aggiornamento footer',
      '',
      '```text',
      'Azione footer: KEEP_EXISTING',
      '```',
      '',
      '---',
      '',
      '## COMANDO DESIDERATO',
      '',
      '```text',
      'GENERATE_EMAIL',
      '```',
      '',
    ].join('\n')
  }

  function emlOf(b) {
    const boundary = `ap-${Date.now().toString(36)}`
    const addr = (r) => (r.name ? `${encodeHeader(r.name)} <${r.email}>` : r.email)
    return [
      `From: ${encodeHeader(b.sender.name)} <${b.sender.email}>`,
      `To: ${b.to.map(addr).join(', ')}`,
      b.cc.length ? `Cc: ${b.cc.map(addr).join(', ')}` : null,
      b.bcc.length ? `Bcc: ${b.bcc.map(addr).join(', ')}` : null,
      `Subject: ${encodeHeader(b.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      'X-Unsent: 1',
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      b.text,
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      utf8Base64(b.liteHtml).replace(/(.{76})/g, '$1\r\n'),
      `--${boundary}--`,
      '',
    ]
      .filter((l) => l !== null)
      .join('\r\n')
  }

  function mailtoOf(b) {
    const params = new URLSearchParams()
    if (b.cc.length) params.set('cc', b.cc.map((r) => r.email).join(','))
    if (b.bcc.length) params.set('bcc', b.bcc.map((r) => r.email).join(','))
    if (b.subject) params.set('subject', b.subject)
    params.set('body', b.text)
    return `mailto:${b.to.map((r) => r.email).join(',')}?${params.toString().replace(/\+/g, '%20')}`
  }

  function webmailOf(b) {
    const to = b.to.map((r) => r.email).join(',')
    const cc = b.cc.map((r) => r.email).join(',')
    const bcc = b.bcc.map((r) => r.email).join(',')
    if (b.sender.webmail === 'gmail') {
      const p = new URLSearchParams({ view: 'cm', fs: '1', to, cc, bcc, su: b.subject, body: b.text })
      return { href: `https://mail.google.com/mail/?${p}`, label: 'Apri in Gmail (testo)' }
    }
    if (b.sender.webmail === 'yahoo') {
      const p = new URLSearchParams({ to, cc, bcc, subject: b.subject, body: b.text })
      return { href: `https://compose.mail.yahoo.com/?${p}`, label: 'Apri in Yahoo Mail (testo)' }
    }
    return null
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  function renderSender() {
    const s = currentSender()
    els.senderMail.textContent = `${s.name} <${s.email}>`
    els.tips.innerHTML = s.tips.map((t) => `<li>${esc(t)}</li>`).join('')
    els.signaturePreview.textContent = s.signature
  }

  function renderOutput(b) {
    els.outFrom.textContent = `${b.sender.name} <${b.sender.email}>`
    els.outTo.textContent = b.toList.join(', ') || '—'
    els.outCcRow.hidden = !b.cc.length
    els.outCc.textContent = b.ccList.join(', ')
    els.outBccRow.hidden = !b.bcc.length
    els.outBcc.textContent = b.bccList.join(', ')
    els.outSubject.textContent = b.subject || '—'
    els.outPreheader.textContent = b.preheader || '—'

    const status = b.validation.status
    els.stateText.textContent = STATUS_LABEL[status] || status
    els.stateDot.className = `dot ${status === 'READY' ? 'dot--ok' : status === 'WARNING' ? 'dot--warn' : 'dot--error'}`

    els.outText.textContent = b.text
    els.outReport.textContent = reportOf(b)
    els.outSource.textContent = b.liteHtml
    els.outMeta.textContent = `email.html ${kb(bytesOf(b.html))} · email-lite.html ${kb(bytesOf(b.liteHtml))} · email.txt ${kb(bytesOf(b.text))}`

    // L'anteprima è un documento a sé (iframe), come preview.html del generatore:
    // si aggiorna con un piccolo ritardo per non ricomporla a ogni tasto.
    clearTimeout(frameTimer)
    frameTimer = setTimeout(() => {
      els.iframe.srcdoc = b.html
    }, 180)

    els.mailto.href = mailtoOf(b)
    const wm = webmailOf(b)
    els.webmail.hidden = !wm
    if (wm) {
      els.webmail.href = wm.href
      els.webmail.textContent = wm.label
    }

    const items = [
      ...b.validation.errors.map((text) => ({ level: 'error', tag: '✕ Errore', text })),
      ...b.validation.warnings.map((text) => ({ level: 'warn', tag: '▲ Avviso', text })),
      ...b.composed.notes.map((text) => ({ level: 'info', tag: '· Nota', text })),
    ]
    els.validation.innerHTML = items.map((it) => `<li class="em-check em-check--${it.level}"><span class="em-check__tag label">${esc(it.tag)}</span><span>${esc(it.text)}</span></li>`).join('')
  }

  function showView(view) {
    for (const el of $$('[data-em-view]', root)) el.hidden = el.dataset.emView !== view
  }

  function renderProgress(b, a) {
    const steps = {
      mittente: true,
      destinatari: b.to.length > 0 && b.to.every((r) => r.valid),
      oggetto: b.subject.length >= 3,
      saluto: hasGreeting(state.body),
      corpo: a.words >= 25,
      chiusura: hasClosing(state.body),
    }
    let done = 0
    for (const [key, ok] of Object.entries(steps)) {
      $(`[data-step="${key}"]`, root)?.classList.toggle('is-done', ok)
      if (ok) done++
    }
    const total = Object.keys(steps).length
    const pct = Math.round((done / total) * 100)
    els.progress.style.setProperty('--p', String(done / total))
    els.progress.classList.toggle('is-complete', done === total)
    els.progress.setAttribute('aria-label', `Completamento ${pct}%`)
    els.progressValue.textContent = `${pct}%`
    const missing = Object.entries(steps)
      .filter(([, ok]) => !ok)
      .map(([k]) => k)
    els.progressNote.textContent = done === total ? 'Tutti i passi sono a posto: controlla lo stato dell’output e copia.' : `Mancano: ${missing.join(', ')}.${!steps.saluto || !steps.chiusura ? ' Saluto e chiusura mancanti li aggiunge l’output.' : ''}`
  }

  function gauge(name, ratio, label, status) {
    const box = $(`[data-em-gauge="${name}"]`, root)
    if (!box) return
    $('[data-em-gauge-fill]', box).style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`
    $('[data-em-gauge-label]', box).textContent = label
    box.classList.remove('is-low', 'is-ok', 'is-high')
    if (status) box.classList.add(`is-${status}`)
  }

  function renderStats(b, a) {
    const set = (key, value, unit) => {
      const el = $(`[data-em-stat="${key}"]`, root)
      if (el) el.innerHTML = unit ? `${esc(value)}<small>${esc(unit)}</small>` : esc(value)
    }
    const htmlBytes = bytesOf(b.html)
    set('words', num.format(a.words))
    set('chars', num.format(a.text.length))
    set('sentences', num.format(a.sentences))
    set('paragraphs', num.format(a.paragraphs))
    set('avg', a.avg ? a.avg.toLocaleString('it-IT') : '0')
    set('reading', a.words ? readingLabel(a.readingSeconds) : '0 s')
    set('weightHtml', kb(htmlBytes))
    set('weightLite', kb(bytesOf(b.liteHtml)))
    set('weightText', kb(bytesOf(b.text)))
    set('recipients', num.format(b.to.length + b.cc.length + b.bcc.length))

    const sl = b.subject.length
    els.subjectCount.textContent = `${sl} / 60`
    els.subjectHint.textContent = sl === 0 ? 'Tra 30 e 60 caratteri.' : sl < 30 ? 'Ancora corto: aggiungi il «per cosa».' : sl <= 60 ? 'Lunghezza giusta.' : sl <= 80 ? 'Un po’ lungo: sul telefono si taglia.' : 'Troppo lungo: verrà troncato.'
    gauge('subject', sl / 80, `${sl} caratteri`, sl === 0 ? '' : sl < 30 ? 'low' : sl <= 60 ? 'ok' : 'high')

    const raw = analyze(state.body)
    els.bodyCount.textContent = `${num.format(raw.words)} parole`
    gauge('length', a.words / 400, `${num.format(a.words)} parole`, a.words === 0 ? '' : a.words < 50 ? 'low' : a.words <= 200 ? 'ok' : 'high')
    gauge('readability', (a.gulpease ?? 0) / 100, readabilityLabel(a.gulpease), a.gulpease === null ? '' : a.gulpease >= 60 ? 'ok' : a.gulpease >= 40 ? '' : 'low')
    gauge('weight', htmlBytes / GMAIL_CLIP_BYTES, `${kb(htmlBytes)} di 102 KB`, htmlBytes > GMAIL_CLIP_BYTES ? 'high' : 'ok')
  }

  function renderChecks(b, a) {
    const items = []
    const warn = (text) => items.push({ level: 'warn', tag: 'Attenzione', text })
    const info = (text) => items.push({ level: 'info', tag: 'Nota', text })
    const invalid = [...b.to, ...b.cc, ...b.bcc].filter((r) => !r.valid)
    if (invalid.length) warn(`Indirizzo non valido: ${invalid.map((r) => r.raw).join(', ')}.`)
    const seen = new Map()
    for (const [field, list] of [
      ['A', b.to],
      ['Cc', b.cc],
      ['Ccn', b.bcc],
    ]) {
      for (const r of list) {
        const k = r.email.toLowerCase()
        if (seen.has(k) && seen.get(k) !== field) warn(`${r.email} compare sia in ${seen.get(k)} sia in ${field}.`)
        seen.set(k, field)
      }
    }
    if (b.sender.key === 'gmail' && b.to.length + b.cc.length >= 4) info('Più di tre destinatari visibili: per i colleghi meglio gli indirizzi in Ccn.')
    if (b.subject && b.subject.length < 12) warn('Oggetto troppo generico: chi legge deve capire di cosa si tratta senza aprire.')
    else if (b.subject.length > 80) warn('Oggetto oltre 80 caratteri: verrà troncato nell’elenco dei messaggi.')
    if (/^(re|r|fwd|i):/i.test(b.subject) && !/^(re|r|fwd|i): \S/i.test(b.subject)) info('Dopo «Re:» ci vuole uno spazio.')
    if (state.body.trim() && !hasGreeting(state.body)) info(`Il testo non inizia con un saluto: l’output apre con «${buildGreeting({ recipientName: b.to[0]?.name || '', tone: state.tone })}».`)
    if (state.body.trim() && !hasClosing(state.body)) info(`Manca la chiusura: l’output chiude con «${buildClosing(state.tone)}» e il nome.`)
    if (a.words && a.words < 20) info('Corpo molto breve: va bene per una conferma, meno per una richiesta.')
    if (a.words > 300) warn(`Email lunga (${num.format(a.words)} parole): valuta due email o un allegato.`)
    if (a.longSentences) warn(`${a.longSentences} ${a.longSentences === 1 ? 'frase supera' : 'frasi superano'} le 30 parole: spezzala.`)
    if (a.exclamations > 1) info(`${a.exclamations} punti esclamativi: in un’email formale al massimo uno.`)
    if (a.shouting) warn(`${a.shouting} ${a.shouting === 1 ? 'parola' : 'parole'} tutta in maiuscolo: sembra urlata.`)
    if (a.placeholders) warn(`${a.placeholders} segnaposto tra parentesi quadre o puntini da compilare.`)
    if (a.sloppySpaces) info('Spazi doppi o spazi prima della punteggiatura: usa «Pulisci spazi».')
    if (a.gulpease !== null && a.gulpease < 40 && a.words > 30) info('Lettura difficile (indice Gulpease sotto 40): frasi più corte e parole più semplici.')
    if (/geometra/i.test(a.text) && !/diplomato geometra/i.test(a.text) && b.sender.key === 'proton') warn('«Geometra» da solo è un titolo riservato agli iscritti all’albo: scrivi «diplomato geometra».')
    if (/urgente|urgentissim|asap/i.test(`${b.subject} ${a.text}`)) info('«Urgente» nell’oggetto o nel testo: meglio una data precisa.')
    if (/^(https?:\/\/\S+)$/m.test(state.body)) info('Un link su una riga da solo: se serve un pulsante usa «Pulsante» (:::bottone).')

    if (!items.length) items.push({ level: 'ok', tag: 'Ok', text: a.words ? 'Nessuna segnalazione: l’email regge. Rileggila una volta ad alta voce e copia.' : 'Scrivi il testo: le segnalazioni compaiono qui.' })
    els.checks.innerHTML = items.map((it) => `<li class="em-check em-check--${it.level}"><span class="em-check__tag label">${it.level === 'warn' ? '▲ ' : it.level === 'ok' ? '✓ ' : '· '}${esc(it.tag)}</span><span>${esc(it.text)}</span></li>`).join('')
    const warnings = items.filter((it) => it.level === 'warn').length + b.validation.errors.length
    els.checksCount.textContent = warnings ? `${warnings} ${warnings === 1 ? 'segnalazione' : 'segnalazioni'}` : 'Nessuna segnalazione'
  }

  function update() {
    readFields()
    const b = build()
    current = b
    const a = analyze(markdownToText(b.composed.markdown))
    renderSender()
    renderOutput(b)
    renderProgress(b, a)
    renderStats(b, a)
    renderChecks(b, a)
    scheduleSave()
  }

  // ── Pezzi di testo ───────────────────────────────────────────────────────

  function greeting() {
    const tone = currentTone()
    const first = parseRecipients(state.to)[0]
    if (first) {
      const known = findContact(first.email)
      if (known?.salutation && tone.formal) return `${known.salutation},`
      const name = first.name || (known && known.group !== 'me' ? known.name : '')
      if (name) return buildGreeting({ recipientName: tone.formal ? name : firstName(name), tone: tone.key })
    }
    return buildGreeting({ recipientName: '', tone: tone.key })
  }

  function insert(text, { where = 'cursor', paragraph = true } = {}) {
    const ta = els.body
    const value = ta.value
    let start = ta.selectionStart ?? value.length
    let end = ta.selectionEnd ?? value.length
    if (where === 'top') start = end = 0
    if (where === 'bottom') start = end = value.length
    const before = value.slice(0, start)
    const after = value.slice(end)
    let piece = text
    if (paragraph) {
      if (before && !/\n\n$/.test(before)) piece = (/\n$/.test(before) ? '\n' : '\n\n') + piece
      if (after && !/^\n\n/.test(after)) piece += /^\n/.test(after) ? '\n' : '\n\n'
    } else {
      if (before && !/\s$/.test(before)) piece = ' ' + piece
      if (after && !/^\s/.test(after)) piece += ' '
    }
    ta.value = before + piece + after
    const pos = before.length + piece.length - (paragraph && after ? (/^\n/.test(after) ? 1 : 2) : after && !/^\s/.test(after) ? 1 : 0)
    ta.focus()
    ta.setSelectionRange(pos, pos)
    update()
  }

  function snippet(kind) {
    readFields()
    const tone = currentTone()
    const s = currentSender()
    const greeted = hasGreeting(state.body)
    switch (kind) {
      case 'saluto':
        if (greeted) {
          els.body.value = els.body.value.replace(/^[^\n]*\n?/, `${greeting()}\n`)
          update()
          flash(els.outStatus, 'Saluto aggiornato in base al tono e al destinatario.')
        } else insert(greeting(), { where: 'top' })
        return
      case 'presentazione':
        return insert(s.intro, { where: greeted ? 'cursor' : 'top' })
      case 'richiesta':
        return insert(tone.formal ? 'Le chiedo cortesemente di ' : 'Ti chiedo se puoi ', { paragraph: false })
      case 'scadenza':
        return insert('se possibile entro [giorno e data]', { paragraph: false })
      case 'elenco':
        return insert('- \n- \n- ')
      case 'titolo':
        return insert('## Titolo del paragrafo')
      case 'nota':
        return insert(':::nota\nTesto della nota in evidenza.\n:::')
      case 'pulsante':
        return insert(':::bottone\nEtichetta del pulsante\nhttps://\n:::')
      case 'ringraziamento':
        return insert(tone.formal ? 'La ringrazio per la disponibilità.' : 'Grazie per la disponibilità.')
      case 'disponibilita':
        return insert(tone.formal ? 'Resto a disposizione per qualsiasi chiarimento.' : 'Per qualsiasi cosa, scrivimi pure.')
      case 'chiusura':
        if (hasClosing(state.body)) return flash(els.outStatus, 'C’è già una chiusura in fondo al testo.')
        // Congedo e nome su due righe, con i due spazi che in Markdown fanno l'a capo.
        return insert(`${buildClosing(tone.key)}  \n${s.name}`, { where: 'bottom' })
      case 're':
        if (!/^re:/i.test(state.subject.trim())) els.subject.value = `Re: ${state.subject.trim()}`.trim()
        els.subject.focus()
        return update()
      case 'data':
        return insert(formatDateIt(todayIso()), { paragraph: false })
      case 'pulisci':
        els.body.value = els.body.value
          .replace(/[ \t]+\n/g, (m) => (m.length >= 3 ? '  \n' : '\n'))
          .replace(/[^\S\n]{2,}(?!\n)/g, ' ')
          .replace(/ ([,.;:!?])(?=\s|$)/g, '$1')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
        update()
        return flash(els.outStatus, 'Spazi sistemati (i due spazi di fine riga che fanno l’a capo restano).')
      default:
    }
  }

  // ── Copia, apertura, download ───────────────────────────────────────────

  let flashTimer = null
  function flash(el, text, kind = '') {
    if (!el) return
    el.textContent = text
    el.classList.remove('is-error', 'is-ok')
    if (kind) el.classList.add(`is-${kind}`)
    announce(text)
    clearTimeout(flashTimer)
    if (el === els.outStatus) flashTimer = setTimeout(() => (el.textContent = ''), 5000)
  }

  /** Come preview.js del generatore: si copia solo il corpo, senza il preheader nascosto. */
  function renderedClipboard(b) {
    const doc = new DOMParser().parseFromString(b.liteHtml, 'text/html')
    doc.body.querySelectorAll('[style*="display:none"], [style*="display: none"]').forEach((node) => node.remove())
    return { html: doc.body.innerHTML, text: b.text }
  }

  async function copy(what, button) {
    const b = current || build()
    let ok = false
    let msg = ''
    if (what === 'rich') {
      const { html, text } = renderedClipboard(b)
      ok = await copyRich(html, text)
      msg = 'Email formattata copiata: incollala nel corpo del messaggio con Ctrl+V.'
    } else if (what === 'text') {
      ok = await copyText(b.text)
      msg = 'Copiato email.txt: testo semplice con la firma.'
    } else if (what === 'subject') {
      ok = await copyText(b.subject)
      msg = 'Oggetto copiato.'
    } else if (what === 'to') {
      ok = await copyText(b.toList.join(', '))
      msg = 'Destinatari copiati.'
    }
    flash(els.outStatus, ok ? msg : 'Copia non riuscita: apri la vista «Sorgente» o «email.txt», seleziona tutto e copia a mano.', ok ? 'ok' : 'error')
    if (ok && button) {
      const label = $('.btn__label', button) || button
      const original = label.textContent
      label.textContent = 'Copiato'
      button.classList.add('is-done')
      setTimeout(() => {
        label.textContent = original
        button.classList.remove('is-done')
      }, 1600)
    }
  }

  function downloadAs(kind) {
    const b = current || build()
    const files = {
      html: ['email.html', b.html, 'text/html;charset=utf-8'],
      lite: ['email-lite.html', b.liteHtml, 'text/html;charset=utf-8'],
      text: ['email.txt', b.text, 'text/plain;charset=utf-8'],
      report: ['report.md', reportOf(b), 'text/markdown;charset=utf-8'],
      input: [`${b.id}.md`, inputMdOf(b), 'text/markdown;charset=utf-8'],
      eml: [`${b.id}.eml`, emlOf(b), 'message/rfc822'],
    }
    const file = files[kind]
    if (!file) return
    download(...file)
    const note = {
      html: 'email.html scaricato: la stessa variante completa del generatore, con il carattere incorporato.',
      lite: 'email-lite.html scaricato: senza carattere, per Gmail.',
      text: 'email.txt scaricato.',
      report: 'report.md scaricato.',
      input: `Input scaricato: mettilo in emails/in/ e lancia «npm run email ${b.id}» per rigenerare la stessa email da riga di comando.`,
      eml: 'File .eml scaricato: aprilo con il programma di posta per trovare la bozza pronta (testo e HTML).',
    }
    flash(els.outStatus, note[kind], 'ok')
  }

  // ── Bozze ────────────────────────────────────────────────────────────────

  function renderDrafts() {
    const drafts = store.get(LS.drafts, [])
    els.drafts.hidden = !drafts.length
    els.draftsList.innerHTML = drafts
      .map((d) => {
        const when = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d.when))
        const sender = data.senders.find((s) => s.key === d.sender)
        return `<li class="em-draft" data-draft="${d.id}"><div class="em-draft__meta"><span class="em-draft__subject">${esc(d.subject || '(senza oggetto)')}</span><span class="label">${esc(when)} · ${esc(sender?.kindLabel || d.sender)} · ${esc(String(d.body || '').split(/\s+/).filter(Boolean).length)} parole</span></div><button class="em-chip em-chip--sm" type="button" data-draft-open>Apri</button><button class="em-chip em-chip--sm" type="button" data-draft-del>Elimina</button></li>`
      })
      .join('')
  }

  function saveDraft() {
    readFields()
    if (!state.subject.trim() && !state.body.trim()) return flash(els.outStatus, 'Niente da salvare: scrivi almeno l’oggetto o il testo.', 'error')
    const drafts = store.get(LS.drafts, [])
    drafts.unshift({ id: Date.now(), when: new Date().toISOString(), ...state })
    store.set(LS.drafts, drafts.slice(0, 20))
    renderDrafts()
    flash(els.outStatus, 'Bozza salvata in questo browser.', 'ok')
  }

  function openDraft(id) {
    const d = store.get(LS.drafts, []).find((x) => String(x.id) === String(id))
    if (!d) return
    for (const k of Object.keys(state)) if (k in d) state[k] = d[k]
    writeFields()
    update()
    $('#scrivi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    flash(els.outStatus, 'Bozza aperta.', 'ok')
  }

  function deleteDraft(id) {
    store.set(
      LS.drafts,
      store.get(LS.drafts, []).filter((x) => String(x.id) !== String(id)),
    )
    renderDrafts()
  }

  // ── IA ───────────────────────────────────────────────────────────────────

  function setAiStatus(text, kind = '') {
    els.aiStatus.textContent = text
    els.aiStatus.classList.remove('is-error', 'is-ok')
    if (kind) els.aiStatus.classList.add(`is-${kind}`)
  }

  async function runAi(action) {
    if (aiBusy || !AI_LABELS[action]) return
    readFields()
    const key = store.get(LS.key, '')
    if (!key && !LOCAL_DEV) {
      setAiStatus('Serve la chiave di accesso: inseriscila nel riquadro in cima alla pagina.', 'error')
      showAccessForm(true)
      return
    }
    const b = current || build()
    if (!state.body.trim()) {
      setAiStatus(action === 'appunti' ? 'Scrivi gli appunti nel campo del testo: l’IA li trasforma in email.' : 'Scrivi prima il testo: l’IA lavora su quello.', 'error')
      els.body.focus()
      return
    }
    const payload = {
      action,
      effort: currentEffort(),
      tone: state.tone,
      sender: { key: b.sender.key, label: b.sender.label, kind: b.sender.kindLabel, email: b.sender.email, name: b.sender.name },
      to: b.toList,
      subject: b.subject,
      body: state.body,
      instructions: els.aiNotes.value.trim(),
    }
    aiBusy = true
    els.ai.classList.add('is-busy')
    const button = $(`[data-em-ai="${action}"]`, els.ai)
    button?.classList.add('is-busy')
    const started = Date.now()
    // La richiesta in corso è la prima riga del registro dei consumi, aggiornata
    // dagli eventi che Claude Code manda mentre lavora.
    live = { t: started, action, effort: payload.effort, phase: '', thinking: 0, output: 0 }
    const showLive = () => {
      setAiStatus(liveText(live))
      renderUsageLog()
    }
    const tick = setInterval(showLive, 1000)
    setAiStatus(`${AI_LABELS[action]}: invio…`)
    renderUsageLog()
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson, application/json', ...keyHeader(key) },
        body: JSON.stringify(payload),
      })
      const streamed = /ndjson/.test(res.headers.get('content-type') || '')
      const json = streamed
        ? await readStream(res, (event) => {
            if (event.type === 'limits') mergeLimits(event.limits)
            if (event.type === 'progress') {
              Object.assign(live, { phase: event.phase, thinking: event.thinking, output: event.output })
              showLive()
            }
          })
        : await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Errore ${res.status}`)
      logUsage({ ok: true, ms: Date.now() - started, model: json.model, ...json.usage })
      if (json.limits) mergeLimits(json.limits)
      aiProposal = { action, ...json.result }
      renderAi(json)
      const secs = Math.round((Date.now() - started) / 10) / 100
      setAiStatus(`${AI_LABELS[action]}: pronto in ${secs.toLocaleString('it-IT')} s. Leggi la proposta e applicala se ti convince.`, 'ok')
    } catch (error) {
      const message = error instanceof TypeError ? 'Funzione /api/email-ai non raggiungibile: online funziona su Vercel; in locale avvia «npm run dev».' : String(error.message || error)
      logUsage({ ok: false, ms: Date.now() - started, error: message })
      setAiStatus(message, 'error')
    } finally {
      clearInterval(tick)
      live = null
      renderUsageLog()
      aiBusy = false
      els.ai.classList.remove('is-busy')
      button?.classList.remove('is-busy')
    }
  }

  /** Legge una risposta NDJSON: gli eventi intermedi a onEvent, l'ultimo (done/error) come esito. */
  async function readStream(res, onEvent) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let final = null
    const take = (line) => {
      if (!line.trim()) return
      const event = JSON.parse(line)
      if (event.type === 'done' || event.type === 'error') final = event
      else onEvent(event)
    }
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl
      while ((nl = buffer.indexOf('\n')) >= 0) {
        take(buffer.slice(0, nl))
        buffer = buffer.slice(nl + 1)
      }
    }
    take(buffer)
    return final || { ok: false, error: 'La risposta si è interrotta prima della fine.' }
  }

  // ── Consumi dell'IA ──────────────────────────────────────────────────────
  // Registro delle richieste (in questo browser), contatori per periodo e
  // limiti dell'abbonamento Claude: dal comando /usage all'apertura e ogni
  // minuto, dall'evento che accompagna ogni richiesta mentre Claude lavora.

  function liveText(l) {
    const secs = Math.round((Date.now() - l.t) / 1000)
    const parts = [`${AI_LABELS[l.action]}: ${PHASES[l.phase] || 'l’IA sta lavorando'}… ${secs} s`]
    if (l.thinking) parts.push(`≈ ${num.format(l.thinking)} token di ragionamento`)
    if (l.output) parts.push(`≈ ${num.format(l.output)} token di risposta`)
    return parts.join(' · ')
  }

  function logUsage(entry) {
    const { action, effort } = live || {}
    usage.push({ t: live?.t || Date.now(), action, effort, model: '', input: 0, output: 0, reasoning: 0, apiValue: null, cost: null, ...entry })
    usage = usage.slice(-USAGE_MAX)
    store.set(LS.usage, usage)
    renderUsageStats()
  }

  const usageRange = () => $('input[name="em-usage-range"]:checked', root)?.value || 'today'
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
  const dur = (ms) => `${(ms / 1000).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`
  const usd = (v, digits = 2) => v.toLocaleString('it-IT', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits })

  function renderUsageStats() {
    const now = Date.now()
    const range = usageRange()
    const list = usage.filter((e) => (range === 'today' ? sameDay(e.t, now) : range === 'week' ? now - e.t < 7 * 864e5 : true))
    const ok = list.filter((e) => e.ok)
    const sum = (key, from = list) => from.reduce((n, e) => n + (Number(e[key]) || 0), 0)
    const errors = list.length - ok.length
    const values = list.filter((e) => typeof e.apiValue === 'number')
    const paid = sum('cost')
    const set = (key, value, note) => {
      $(`[data-em-usage-stat="${key}"]`, root).textContent = value
      $(`[data-em-usage-note="${key}"]`, root).textContent = note
    }
    set('requests', num.format(list.length), errors ? `di cui ${num.format(errors)} con errore` : 'nessun errore')
    set('input', num.format(sum('input')), 'prompt, istruzioni e testo')
    set('output', num.format(sum('output')), `di cui ${num.format(sum('reasoning'))} di ragionamento`)
    set('time', ok.length ? dur(sum('ms', ok) / ok.length) : '—', `totale ${dur(sum('ms'))}`)
    if (values.length) set('value', usd(sum('apiValue', values)), paid ? `speso davvero ${usd(paid, 4)}` : 'stima a prezzi API: con l’abbonamento non si paga')
    else set('value', paid ? usd(paid, 4) : usd(0), paid ? 'speso sul fornitore' : 'nessun costo registrato')
    renderUsageLog()
  }

  function renderUsageLog() {
    const now = Date.now()
    const when = (t) =>
      sameDay(t, now)
        ? new Date(t).toLocaleTimeString('it-IT')
        : new Date(t).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    const cell = (v, cls = '') => `<td${cls ? ` class="${cls}"` : ''}>${v}</td>`
    const rows = usage
      .slice(-USAGE_ROWS)
      .reverse()
      .map((e) =>
        [
          `<tr class="${e.ok ? '' : 'is-error'}">`,
          cell(esc(when(e.t))),
          cell(esc(AI_LABELS[e.action] || e.action || '—')),
          cell(esc(EFFORT_LABEL[e.effort] || '—')),
          cell(esc(String(e.model || '—').replace(/ · .*$/, ''))),
          cell(dur(e.ms || 0), 'num'),
          cell(e.ok ? num.format(e.input) : '—', 'num'),
          cell(e.ok ? num.format(e.output) : '—', 'num'),
          cell(e.ok ? num.format(e.reasoning) : '—', 'num'),
          cell(typeof e.apiValue === 'number' ? usd(e.apiValue, 4) : typeof e.cost === 'number' ? usd(e.cost, 4) : '—', 'num'),
          cell(e.ok ? 'ok' : `<span title="${esc(e.error)}">${esc(String(e.error || 'errore').slice(0, 60))}</span>`),
          '</tr>',
        ].join(''),
      )
    if (live) {
      rows.unshift(
        [
          '<tr class="is-live">',
          cell('<span class="dot em-busy-dot"></span>adesso'),
          cell(esc(AI_LABELS[live.action])),
          cell(esc(EFFORT_LABEL[live.effort] || '—')),
          cell('…'),
          cell(dur(now - live.t), 'num'),
          cell('…', 'num'),
          cell(live.output ? `≈ ${num.format(live.output)}` : '…', 'num'),
          cell(live.thinking ? `≈ ${num.format(live.thinking)}` : '…', 'num'),
          cell('…', 'num'),
          cell(esc({ richiesta: 'attesa', ragiona: 'ragiona', scrive: 'scrive' }[live.phase] || 'in corso')),
          '</tr>',
        ].join(''),
      )
    }
    els.usageRows.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="10" class="em-table__empty">Nessuna richiesta registrata in questo browser.</td></tr>'
  }

  function exportUsage() {
    if (!usage.length) return setAiStatus('Il registro dei consumi è vuoto.', 'error')
    const dec = (v, d) => (typeof v === 'number' ? v.toFixed(d).replace('.', ',') : '')
    const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = ['data e ora', 'azione', 'sforzo', 'modello', 'durata (s)', 'token in', 'token out', 'di cui ragionamento', 'valore API (USD)', 'costo (USD)', 'esito']
    const lines = usage.map((e) =>
      [new Date(e.t).toLocaleString('it-IT'), AI_LABELS[e.action] || e.action, EFFORT_LABEL[e.effort] || '', e.model, dec((e.ms || 0) / 1000, 1), e.input, e.output, e.reasoning, dec(e.apiValue, 4), dec(e.cost, 4), e.ok ? 'ok' : e.error]
        .map(q)
        .join(';'),
    )
    // BOM e punto e virgola: Excel in italiano apre il file senza chiedere nulla.
    download(`consumi-ia-${todayIso()}.csv`, `﻿${[head.map(q).join(';'), ...lines].join('\r\n')}`, 'text/csv;charset=utf-8')
  }

  function clearUsage() {
    if (!usage.length || !confirm('Azzerare il registro dei consumi di questo browser? I limiti dell’abbonamento non cambiano.')) return
    usage = []
    store.set(LS.usage, usage)
    renderUsageStats()
  }

  function mergeLimits(next) {
    if (!next?.windows) return
    const map = new Map((limits?.windows || []).map((w) => [w.key, w]))
    for (const w of next.windows) map.set(w.key, w)
    const order = (key) => ['five_hour', 'seven_day'].indexOf(key) + 1 || 9
    limits = { ...limits, ...next, windows: [...map.values()].sort((a, b) => order(a.key) - order(b.key)) }
    store.set(LS.limits, limits)
    renderLimits()
  }

  function resetText(isoDate) {
    const d = new Date(isoDate)
    const hm = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    if (sameDay(d, Date.now())) return `alle ${hm}`
    if (sameDay(d, Date.now() + 864e5)) return `domani alle ${hm}`
    return `${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} alle ${hm}`
  }

  function renderLimits() {
    const windows = limits?.windows || []
    if (!windows.length) {
      els.limits.innerHTML = ''
      els.limitsAt.textContent = '—'
      els.limitsNote.textContent =
        aiProvider === 'claude-code' ? 'Limiti dell’abbonamento non ancora letti: premi «Aggiorna limiti».' : 'I limiti dell’abbonamento compaiono qui quando l’IA è Claude Code (in locale, con npm run dev).'
      return
    }
    els.limits.innerHTML = windows
      .map(
        (w) => `<div class="em-gauge${w.pct >= 80 ? ' is-high' : ''}">
          <div class="em-gauge__head"><span class="label">${esc(w.label)}</span><span class="label">${w.pct}% usato</span></div>
          <div class="em-gauge__bar"><span class="em-gauge__fill" style="width:${Math.min(100, Math.max(0, w.pct))}%"></span></div>
          <p class="em-gauge__note">${w.resetsAt ? `Si azzera ${esc(resetText(w.resetsAt))}.` : ''}</p>
        </div>`,
      )
      .join('')
    const at = new Date(limits.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    els.limitsAt.textContent = `Limiti letti alle ${at}${limits.source === 'richiesta' ? ' (dall’ultima richiesta)' : ''}`
    els.limitsNote.textContent =
      limits.status === 'rejected'
        ? 'Limite raggiunto: le richieste a Claude sono ferme fino all’azzeramento.'
        : limits.status === 'allowed_warning'
          ? 'Sei vicino al limite dell’abbonamento.'
          : 'Sessione e settimana sono condivise con Claude Code e claude.ai: contano anche le altre sessioni aperte.'
  }

  let limitsBusy = false
  async function refreshLimits(manual = false) {
    if (aiProvider !== 'claude-code' || limitsBusy) return
    limitsBusy = true
    const chipEl = $('[data-em-limits-refresh]', root)
    if (manual && chipEl) chipEl.textContent = 'Aggiorno…'
    try {
      const res = await fetch(`${API}?limiti=1`, { headers: keyHeader(store.get(LS.key, '')) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) throw new Error(json.error || `Errore ${res.status}`)
      mergeLimits(json.limits)
    } catch (error) {
      if (manual) setAiStatus(`Limiti non aggiornati: ${error.message || error}`, 'error')
    } finally {
      limitsBusy = false
      if (chipEl) chipEl.textContent = 'Aggiorna limiti'
    }
  }

  // Ogni minuto, solo con la scheda in vista e nessuna richiesta in corso.
  let limitsWatched = false
  function watchLimits() {
    if (aiProvider !== 'claude-code') return
    refreshLimits()
    if (limitsWatched) return
    limitsWatched = true
    setInterval(() => document.visibilityState === 'visible' && !aiBusy && refreshLimits(), 60_000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - new Date(limits?.at || 0) > 60_000) refreshLimits()
    })
  }

  function renderAi({ result, usage, model }) {
    els.aiResult.hidden = false
    els.aiAction.textContent = AI_LABELS[aiProposal.action]
    if (usage) {
      // Il costo lo dà il fornitore (OpenRouter); in locale è zero; con
      // l'abbonamento Claude la funzione manda una nota al posto del prezzo.
      const cost = usage.note ? usage.note : usage.cost === 0 ? 'gratis' : typeof usage.cost === 'number' ? `≈ ${usage.cost.toLocaleString('it-IT', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : ''
      els.aiUsage.textContent = [`${num.format(usage.input)} token in`, `${num.format(usage.output)} out`, usage.reasoning ? `di cui ${num.format(usage.reasoning)} di ragionamento` : '', cost].filter(Boolean).join(' · ')
    } else els.aiUsage.textContent = ''
    if (model) els.aiModel.textContent = model
    const score = Number(result.score)
    els.aiScore.hidden = !(aiProposal.action === 'giudizio' && score > 0)
    els.aiScore.textContent = `Voto ${score}/100`
    els.aiSubject.textContent = result.subject || '—'
    els.aiBody.textContent = result.body || '—'
    const fill = (key, items, pick = false) => {
      const wrap = $(`[data-em-ai-wrap="${key}"]`, root)
      const list = items.filter(Boolean)
      wrap.hidden = !list.length
      const el = { subjects: els.aiSubjects, changes: els.aiChanges, tips: els.aiTips }[key]
      el.innerHTML = list.map((t) => (pick ? `<li><span>${esc(t)}</span><button class="em-chip em-chip--sm" type="button" data-pick-subject="${esc(t)}">Usa</button></li>` : `<li>${esc(t)}</li>`)).join('')
    }
    fill('subjects', result.subjects || [], true)
    fill('changes', result.changes || [])
    fill('tips', result.tips || [])
    els.aiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function applyAi(what) {
    if (!aiProposal) return
    if (what === 'discard') {
      aiProposal = null
      els.aiResult.hidden = true
      setAiStatus('Proposta scartata: il tuo testo è rimasto com’era.')
      return
    }
    if (what === 'all' || what === 'subject') if (aiProposal.subject) els.subject.value = aiProposal.subject
    if (what === 'all' || what === 'body') if (aiProposal.body) els.body.value = aiProposal.body
    update()
    setAiStatus(what === 'subject' ? 'Oggetto applicato.' : what === 'body' ? 'Testo applicato.' : 'Oggetto e testo applicati.', 'ok')
    $('#scrivi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Accesso ──────────────────────────────────────────────────────────────

  function setAccess(kind, text) {
    els.accessDot.className = `dot${kind ? ` dot--${kind}` : ''}`
    els.accessText.textContent = text
  }

  function showAccessForm(show) {
    els.accessForm.hidden = !show
    if (show) els.accessInput.focus()
  }

  async function checkAccess() {
    const key = store.get(LS.key, '')
    if (!key && !LOCAL_DEV) {
      setAccess('warn', 'Chiave di accesso mancante: l’IA resta spenta, tutto il resto funziona.')
      showAccessForm(true)
      return
    }
    setAccess('', 'Controllo del collegamento…')
    try {
      const res = await fetch(API, { headers: keyHeader(key) })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setAccess(json.configured ? 'ok' : 'warn', json.configured ? `IA collegata · ${json.model}` : 'Chiave giusta, ma sul server manca EMAIL_AI_API_KEY.')
        if (json.model) els.aiModel.textContent = json.model
        aiProvider = json.provider || ''
        renderLimits()
        watchLimits()
      } else if (res.status === 401) {
        setAccess('warn', 'Chiave di accesso errata: controlla il link.')
        showAccessForm(true)
      } else setAccess('warn', json.error || `Servizio IA non disponibile (${res.status}).`)
    } catch {
      setAccess('warn', 'Funzione /api/email-ai non raggiungibile: online funziona su Vercel; in locale avvia «npm run dev».')
    }
  }

  function initAccess() {
    const url = new URL(location.href)
    const k = url.searchParams.get('k')
    if (k) {
      store.set(LS.key, k.trim())
      url.searchParams.delete('k')
      history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
    els.accessForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const value = els.accessInput.value.trim()
      if (!value) return
      store.set(LS.key, value)
      els.accessInput.value = ''
      showAccessForm(false)
      checkAccess()
    })
    checkAccess()
  }

  // ── Carattere incorporato (come fonts.js del generatore) ─────────────────

  async function loadFont() {
    try {
      const res = await fetch(archivoUrl)
      if (!res.ok) throw new Error(String(res.status))
      const bytes = new Uint8Array(await res.arrayBuffer())
      const base64 = toBase64(bytes)
      font.css = fontFaceCss(base64)
      font.bytes = bytes.length
      font.base64Bytes = base64.length
      update()
    } catch {
      /* senza carattere l'email usa la catena di ripiego, come email-lite.html */
    }
  }

  // ── Rubrica ──────────────────────────────────────────────────────────────

  function contactCard(c) {
    const isNew = Boolean(c.new)
    return `<li class="em-contact${isNew ? ' em-contact--new' : ''}" data-contact="${esc(c.id)}">
      <div class="em-contact__main">
        <p class="em-contact__name">${esc(c.name || c.email)}</p>
        <p class="em-contact__mail">${esc(c.email)}</p>
        ${c.role ? `<p class="em-contact__role label">${esc(c.role)}</p>` : ''}
        ${c.note ? `<p class="em-contact__note">${esc(c.note)}</p>` : ''}
      </div>
      <div class="em-contact__actions">
        <button class="em-chip em-chip--sm" type="button" data-add="to" aria-label="Aggiungi ${esc(c.name || c.email)} in A">A</button>
        <button class="em-chip em-chip--sm" type="button" data-add="cc" aria-label="Aggiungi ${esc(c.name || c.email)} in Cc">Cc</button>
        <button class="em-chip em-chip--sm" type="button" data-add="bcc" aria-label="Aggiungi ${esc(c.name || c.email)} in Ccn">Ccn</button>
        <button class="em-chip em-chip--sm em-chip--star" type="button" data-fav aria-pressed="${favs.has(c.id)}" aria-label="${favs.has(c.id) ? 'Togli dai preferiti' : 'Metti tra i preferiti'}">★</button>
        ${isNew ? '<button class="em-chip em-chip--sm" type="button" data-del>Elimina</button>' : ''}
      </div>
    </li>`
  }

  function renderContacts() {
    const q = els.search.value.trim().toLowerCase()
    const match = (c) => !q || [c.name, c.email, c.role, data.contactGroups[c.group]].join(' ').toLowerCase().includes(q)
    const lists = {
      fav: allContacts().filter((c) => favs.has(c.id) && match(c)),
      new: extra.filter(match),
      known: data.contacts.filter(match),
    }
    for (const [key, list] of Object.entries(lists)) {
      $(`[data-em-list="${key}"]`, root).innerHTML = list.map(contactCard).join('')
      const empty = $(`[data-em-empty="${key}"]`, root)
      if (empty) empty.hidden = list.length > 0 || (key !== 'known' && Boolean(q))
    }
    els.datalist.innerHTML = allContacts()
      .map((c) => `<option value="${esc(c.group === 'me' ? `Alberto Pecchini <${c.email}>` : `${c.name} <${c.email}>`)}">${esc(c.role || '')}</option>`)
      .join('')
    const total = allContacts().length
    els.rubricaCount.textContent = `${total} contatti · ${favs.size} preferiti · ${extra.length} nuovi`
  }

  function addRecipient(field, c) {
    readFields()
    const existing = parseRecipients(state[field])
    const fieldLabel = field === 'to' ? 'A' : field === 'cc' ? 'Cc' : 'Ccn'
    if (existing.some((r) => r.email.toLowerCase() === c.email.toLowerCase())) return flash(els.outStatus, `${c.email} è già in ${fieldLabel}.`)
    const name = c.group === 'me' ? 'Alberto Pecchini' : c.name
    const piece = name ? `${name} <${c.email}>` : c.email
    els[field].value = existing.length ? `${els[field].value.trim().replace(/[,;]\s*$/, '')}, ${piece}` : piece
    update()
    flash(els.outStatus, `${c.name || c.email} aggiunto in ${fieldLabel}.`, 'ok')
    els[field].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function toggleFav(id) {
    if (favs.has(id)) favs.delete(id)
    else favs.add(id)
    store.set(LS.fav, [...favs])
    renderContacts()
  }

  function addContact(e) {
    e.preventDefault()
    const f = new FormData(els.contactForm)
    const email = String(f.get('email') || '').trim()
    if (!EMAIL_RE.test(email)) return flash(els.contactStatus, 'Indirizzo non valido.', 'error')
    if (findContact(email)) return flash(els.contactStatus, 'Indirizzo già in rubrica.', 'error')
    const contact = {
      id: `new-${Date.now()}`,
      name: String(f.get('name') || '').trim(),
      email,
      role: String(f.get('role') || '').trim(),
      group: String(f.get('group') || 'universita'),
      salutation: String(f.get('salutation') || '').trim(),
      new: true,
    }
    extra.push(contact)
    store.set(LS.contacts, extra)
    els.contactForm.reset()
    renderContacts()
    flash(els.contactStatus, `${contact.name || contact.email} aggiunto.`, 'ok')
  }

  function deleteContact(id) {
    extra = extra.filter((c) => c.id !== id)
    favs.delete(id)
    store.set(LS.contacts, extra)
    store.set(LS.fav, [...favs])
    renderContacts()
  }

  function exportContacts() {
    if (!extra.length) return flash(els.contactStatus, 'Nessun indirizzo nuovo da esportare.', 'error')
    download(`rubrica-${todayIso()}.json`, JSON.stringify(extra, null, 2), 'application/json')
    flash(els.contactStatus, 'Rubrica esportata.', 'ok')
  }

  async function importContacts(file) {
    if (!file) return
    try {
      const list = JSON.parse(await file.text())
      if (!Array.isArray(list)) throw new Error('formato')
      let added = 0
      for (const c of list) {
        if (!c || !EMAIL_RE.test(String(c.email || '')) || findContact(c.email)) continue
        extra.push({ id: `new-${Date.now()}-${added}`, name: String(c.name || ''), email: String(c.email), role: String(c.role || ''), group: data.contactGroups[c.group] ? c.group : 'universita', salutation: String(c.salutation || ''), new: true })
        added++
      }
      store.set(LS.contacts, extra)
      renderContacts()
      flash(els.contactStatus, added ? `${added} ${added === 1 ? 'indirizzo importato' : 'indirizzi importati'}.` : 'Nessun indirizzo nuovo nel file.', added ? 'ok' : '')
    } catch {
      flash(els.contactStatus, 'File non leggibile: serve il JSON esportato da qui.', 'error')
    }
  }

  // ── Eventi ───────────────────────────────────────────────────────────────

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button, a')
    if (!t || !root.contains(t)) return
    if (t.dataset.emSnippet) return snippet(t.dataset.emSnippet)
    if (t.dataset.emGo) {
      e.preventDefault()
      return $(t.dataset.emGo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (t.dataset.emAi) return runAi(t.dataset.emAi)
    if (t.dataset.emCopy) return copy(t.dataset.emCopy, t)
    if (t.dataset.emDownload) return downloadAs(t.dataset.emDownload)
    if ('emDraftSave' in t.dataset) return saveDraft()
    if ('emClear' in t.dataset) {
      if (!els.body.value.trim() || confirm('Svuotare oggetto e testo? Le bozze salvate restano.')) {
        els.subject.value = ''
        els.body.value = ''
        els.links.value = ''
        els.attachments.value = ''
        aiProposal = null
        els.aiResult.hidden = true
        update()
        els.body.focus()
      }
      return
    }
    if (t.dataset.emAiApply) return applyAi(t.dataset.emAiApply)
    if ('emLimitsRefresh' in t.dataset) return refreshLimits(true)
    if ('emUsageCsv' in t.dataset) return exportUsage()
    if ('emUsageClear' in t.dataset) return clearUsage()
    if ('emAccessEdit' in t.dataset) return showAccessForm(els.accessForm.hidden)
    if ('emContactsExport' in t.dataset) return exportContacts()
    if (t.dataset.pickSubject !== undefined) {
      els.subject.value = t.dataset.pickSubject
      update()
      return setAiStatus('Oggetto applicato.', 'ok')
    }
    const card = t.closest('[data-contact]')
    if (card) {
      const c = allContacts().find((x) => x.id === card.dataset.contact)
      if (!c) return
      if (t.dataset.add) return addRecipient(t.dataset.add, c)
      if ('fav' in t.dataset) return toggleFav(c.id)
      if ('del' in t.dataset) return deleteContact(c.id)
    }
    const draft = t.closest('[data-draft]')
    if (draft) {
      if ('draftOpen' in t.dataset) return openDraft(draft.dataset.draft)
      if ('draftDel' in t.dataset) return deleteDraft(draft.dataset.draft)
    }
  })

  els.form.addEventListener('submit', (e) => e.preventDefault())
  els.form.addEventListener('input', update)
  els.form.addEventListener('change', update)
  $$('input[name="mittente"]', root).forEach((r) => r.addEventListener('change', update))
  $$('input[name="em-view"]', root).forEach((r) => r.addEventListener('change', () => showView(currentView())))
  $$('input[name="em-usage-range"]', root).forEach((r) => r.addEventListener('change', renderUsageStats))
  els.search.addEventListener('input', renderContacts)
  els.contactForm.addEventListener('submit', addContact)
  $('[data-em-contacts-import]', root).addEventListener('change', (e) => {
    importContacts(e.target.files?.[0])
    e.target.value = ''
  })

  // L'anteprima prende l'altezza del documento che contiene, come preview.html.
  els.iframe.addEventListener('load', () => {
    try {
      const doc = els.iframe.contentDocument
      const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
      els.iframe.style.height = `${height + 24}px`
    } catch {
      /* altezza di ripiego dal CSS */
    }
  })

  // Scorciatoie: Ctrl/Cmd+Shift+C copia l'email formattata, Ctrl/Cmd+S salva la bozza.
  root.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return
    if (e.key.toLowerCase() === 's') {
      e.preventDefault()
      saveDraft()
    } else if (e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      copy('rich')
    }
  })

  // ── Avvio ────────────────────────────────────────────────────────────────

  restoreDraft()
  renderContacts()
  renderDrafts()
  showView(currentView())
  update()
  els.autosave.textContent = 'Bozza salvata in automatico'
  renderUsageStats()
  renderLimits()
  initAccess()
  loadFont()
}
