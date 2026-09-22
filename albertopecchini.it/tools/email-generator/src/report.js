// Report finale: l'unico documento che l'utente deve leggere dopo la generazione.
// Non contiene il corpo dell'email, solo ciò che serve a decidere se inviarla.
import { formatBytes } from './sources.js'
import { formatDateIt } from './util.js'

const STATUS_LABEL = {
  READY: 'READY — email pronta',
  WARNING: 'WARNING — email generata, ci sono avvisi da leggere',
  MISSING_REQUIRED_DATA: 'MISSING_REQUIRED_DATA — dati obbligatori mancanti, email NON pronta',
}

export function buildReport({
  input,
  profile,
  footer,
  footerLearn,
  validation,
  attachments,
  sources,
  outputs,
  stats,
  composeNotes = [],
  generatorVersion,
}) {
  const lines = []
  const list = (values) => (values.length ? values.join(', ') : '—')

  lines.push('# Email generata', '')

  // ── Dati ───────────────────────────────────────────────────────────────────
  lines.push('## Dati', '')
  lines.push(`- **Da:** ${profile ? `${profile.email} (${profile.label} · ${profile.provider})` : '— non risolto'}`)
  lines.push(`- **A:** ${list(input.meta.to)}`)
  lines.push(`- **CC:** ${list(input.meta.cc)}`)
  lines.push(`- **BCC:** ${list(input.meta.bcc)}`)
  if (input.meta.replyTo) lines.push(`- **Reply-to:** ${input.meta.replyTo}`)
  lines.push(`- **Oggetto:** ${input.meta.subject || '— mancante'}`)
  lines.push(`- **Profilo:** ${profile?.key ?? '—'}`)
  lines.push(`- **Firma:** ${footer ? `${profile?.footerId} · versione ${stats.footerVersion}` : '— non trovata'}`)
  lines.push(`- **ID interno:** ${input.meta.id || '—'}`)
  lines.push(`- **Data:** ${input.meta.date ? formatDateIt(input.meta.date) : '—'}`)
  lines.push(`- **Tono:** ${input.meta.tone} · **Lingua:** ${input.meta.language} · **Priorità:** ${input.meta.priority}`)
  if (input.meta.requestConfirmation) lines.push('- **Conferma di lettura:** richiesta (va attivata a mano nel client)')
  lines.push(`- **Stato:** ${STATUS_LABEL[validation.status] ?? validation.status}`)
  lines.push('')

  // ── Riepilogo ──────────────────────────────────────────────────────────────
  lines.push('## Riepilogo', '')
  if (input.purpose) {
    lines.push(input.purpose, '')
  }
  lines.push(
    `Email in ${input.meta.language}, tono ${input.meta.tone}, composta a partire da ${
      sources.length ? `${sources.filter((s) => s.exists).length} fonte/i lette e dal` : 'il solo'
    } materiale grezzo del file di input. Corpo di ${stats.words} parole; HTML autosufficiente di ${formatBytes(stats.htmlBytes)}${
      stats.liteBytes ? `, variante leggera di ${formatBytes(stats.liteBytes)}` : ''
    }.`,
    '',
  )

  // ── File da inviare ────────────────────────────────────────────────────────
  lines.push('## File da inviare', '')
  lines.push(`- [email.html](./email.html) — sorgente HTML completo${stats.fontEmbedded ? ', font incorporato' : ''}`)
  if (outputs.lite) lines.push(`- [email-lite.html](./email-lite.html) — stessa email senza font incorporato (consigliata per Gmail)`)
  lines.push('- [preview.html](./preview.html) — anteprima con il pulsante «Copia email formattata»')
  lines.push('- [email.txt](./email.txt) — versione in testo semplice')
  if (attachments.length) {
    lines.push('')
    lines.push('**Allegati dichiarati:**', '')
    for (const file of attachments) {
      const label = file.exists ? `${file.type} · ${formatBytes(file.bytes)}` : '**NON TROVATO**'
      lines.push(`- \`${file.entry}\` — ${label}${file.path ? ` → \`${file.path}\`` : ''}`)
    }
  } else {
    lines.push('- Nessun allegato dichiarato.')
  }
  lines.push('')

  // ── File letti ─────────────────────────────────────────────────────────────
  lines.push('## File letti', '')
  if (!sources.length) {
    lines.push('- Nessuna fonte esterna indicata.')
  } else {
    for (const source of sources) {
      if (!source.exists) {
        lines.push(`- \`${source.entry}\` — **non trovato**, non utilizzato`)
        continue
      }
      const chars = source.text ? `${source.text.length} caratteri estratti` : 'nessun testo estratto'
      lines.push(`- \`${source.path}\` — ${source.kind.toUpperCase()} · ${formatBytes(source.bytes)} · ${chars}`)
    }
  }
  lines.push('')
  lines.push('> Le fonti servono a scrivere l’email e **non** vengono allegate.')
  lines.push('')

  // ── Link ───────────────────────────────────────────────────────────────────
  if (input.links.length) {
    lines.push('## Link inseriti', '')
    for (const link of input.links) lines.push(`- ${link}`)
    lines.push('')
  }

  // ── Come inviarla ──────────────────────────────────────────────────────────
  lines.push('## Come inviarla', '')
  lines.push(`1. Apri **preview.html** nel browser.`)
  lines.push('2. Premi **«Copia email formattata»**: il contenuto va negli appunti con la formattazione.')
  lines.push(
    `3. Apri un nuovo messaggio da **${profile?.email ?? 'l’account indicato'}** (${profile?.provider ?? '—'}) e incolla con \`Ctrl+V\`.`,
  )
  lines.push(`4. Oggetto: \`${input.meta.subject || '—'}\``)
  if (attachments.some((f) => f.exists)) lines.push('5. Allega i file elencati sopra.')
  lines.push('')

  // ── Note ───────────────────────────────────────────────────────────────────
  lines.push('## Note', '')
  const notes = []

  if (validation.errors.length) {
    notes.push('**Errori bloccanti:**')
    for (const error of validation.errors) notes.push(`- ❌ ${error}`)
    notes.push('')
  }

  if (validation.warnings.length) {
    notes.push('**Avvisi:**')
    for (const warning of validation.warnings) notes.push(`- ⚠️ ${warning}`)
    notes.push('')
  }

  for (const note of composeNotes) notes.push(`- ℹ️ ${note}`)

  if (footerLearn?.message) notes.push(`- 🖊️ ${footerLearn.message}`)

  if (stats.fontEmbedded) {
    notes.push(
      `- ℹ️ Carattere **Archivo Variable** incorporato (${formatBytes(stats.fontBytes)} → ${formatBytes(stats.fontBase64Bytes)} in base64). Apple Mail e i client WebKit lo applicano; **Outlook per Windows e Gmail lo ignorano** e useranno la catena di ripiego (Helvetica Neue → Segoe UI → Arial). La resa resta coerente, cambia solo il disegno dei caratteri.`,
    )
  }

  notes.push('- ℹ️ Nessun JavaScript e nessun CSS esterno nell’email: il file è autosufficiente.')

  if (!notes.length) notes.push('- Nessun rilievo.')
  lines.push(...notes)
  lines.push('')

  lines.push('---', '')
  lines.push(
    `<sub>Generato il ${stats.timestamp} · generatore v${generatorVersion} · tema da \`${stats.themeSource}\` · input \`${stats.inputFile}\`</sub>`,
  )

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}

/** Riga di log per `emails/logs/generations.log`. */
export function buildLogLine({ input, profile, validation, outputs, stats, generatorVersion }) {
  return JSON.stringify({
    timestamp: stats.timestamp,
    generator: generatorVersion,
    id: input.meta.id || null,
    inputFile: stats.inputFile,
    profile: profile?.key ?? null,
    from: profile?.email ?? null,
    to: input.meta.to,
    subject: input.meta.subject || null,
    status: validation.status,
    errors: validation.errors.length,
    warnings: validation.warnings.length,
    outputs: Object.values(outputs).filter(Boolean),
    htmlBytes: stats.htmlBytes,
  })
}
