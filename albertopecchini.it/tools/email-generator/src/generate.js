// Orchestrazione: dal file di input ai file di output.
//
// Ordine: leggi input → risolvi mittente → leggi fonti → impara la firma →
// componi → rendi HTML → valida → scrivi → registra. Ogni passo è delegato al
// proprio modulo; qui si tiene solo il filo.
import fs from 'node:fs'
import path from 'node:path'

import { paths, GENERATOR_VERSION } from './paths.js'
import { parseInputFile } from './parse-input.js'
import { resolveSender } from './senders.js'
import { loadEmailTheme } from './theme.js'
import { buildEmbeddedFontCss } from './fonts.js'
import { readSource, checkAttachments } from './sources.js'
import { getFooter, learnFooter, renderFooterText, resolveFooterLogo } from './footers.js'
import { iconDataUri } from './assets.js'
import { composeBody, buildPreheader } from './compose.js'
import { renderMarkdown, markdownToText } from './markdown.js'
import { renderEmailHtml } from './template.js'
import { renderPreviewHtml } from './preview.js'
import { validate } from './validate.js'
import { buildReport, buildLogLine } from './report.js'
import { slugify, formatDateIt, todayIso } from './util.js'

/** Nome della cartella di output: `AAAA-MM-GG_identificativo`. */
function outputDirName(input) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.meta.date) ? input.meta.date : todayIso()
  const base = input.meta.id || path.basename(input.sourceFile, '.md')
  // L'id del template contiene spesso già la data: non va ripetuta.
  const slug = slugify(String(base).replace(/^\d{4}-\d{2}-\d{2}[-_]?/, ''), 'email')
  return `${date}_${slug}`
}

/**
 * Genera una email a partire da un file di input.
 * @param {string} inputFile percorso del .md
 * @param {{outDir?: string}} [options]
 */
export function generateEmail(inputFile, options = {}) {
  const absoluteInput = path.resolve(inputFile)
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`File di input non trovato: ${inputFile}`)
  }

  const input = parseInputFile(absoluteInput)
  const baseDir = path.dirname(absoluteInput)
  const theme = loadEmailTheme()

  // ── Mittente ───────────────────────────────────────────────────────────────
  const senderResult = resolveSender(input.meta.fromProfile)
  const profile = senderResult.ok ? senderResult.profile : null
  const senderError = senderResult.ok ? null : senderResult.reason

  // ── Fonti e allegati ───────────────────────────────────────────────────────
  const sources = input.filesToRead.map((entry) => readSource(entry, baseDir))
  const attachments = checkAttachments(input.attachments, baseDir)

  // ── Firma ──────────────────────────────────────────────────────────────────
  let footerLearn = { changed: false, message: '' }
  if (profile && input.footerLearn.text) {
    footerLearn = learnFooter({
      footerId: profile.footerId,
      text: input.footerLearn.text,
      action: input.footerLearn.action,
    })
  }

  // `footer_profile` permette di usare la firma di un altro profilo.
  let footerId = profile?.footerId ?? null
  if (input.meta.footerProfile && input.meta.footerProfile !== 'auto') {
    const override = resolveSender(input.meta.footerProfile)
    if (override.ok) footerId = override.profile.footerId
  }
  const footer = footerId ? getFooter(footerId) : null

  // ── Composizione ───────────────────────────────────────────────────────────
  const composed = composeBody({
    rawBody: input.rawBody,
    tone: input.meta.tone,
    to: input.meta.to,
    senderName: footer?.name ?? '',
  })

  const bodyHtml = renderMarkdown(composed.markdown, theme, { icon: iconDataUri })
  const preheader = buildPreheader(composed.markdown)

  const attachmentList = attachments.map((file) => ({
    name: path.basename(file.entry),
    type: file.type,
  }))

  const dateLabel = input.meta.date ? formatDateIt(input.meta.date) : ''

  const common = {
    subject: input.meta.subject,
    preheader,
    eyebrow: profile?.label ?? '',
    title: '',
    subtitle: '',
    bodyHtml,
    footer,
    footerLogo: resolveFooterLogo(footer),
    attachments: attachmentList,
    links: input.links,
    theme,
    dateLabel,
  }

  // Variante completa, con carattere incorporato.
  const font = buildEmbeddedFontCss({ embed: true })
  const html = renderEmailHtml({ ...common, fontCss: font.css })

  // Variante leggera: stessa email senza il font, per Gmail (soglia di ritaglio).
  const liteHtml = renderEmailHtml({ ...common, fontCss: '' })

  // ── Testo semplice ─────────────────────────────────────────────────────────
  const textParts = [markdownToText(composed.markdown)]
  if (input.links.length) textParts.push('', 'Collegamenti:', ...input.links.map((l) => `- ${l}`))
  if (attachmentList.length) {
    textParts.push('', 'Allegati:', ...attachmentList.map((f) => `- ${f.name} (${f.type})`))
  }
  const footerText = renderFooterText(footer)
  if (footerText) textParts.push('', '—', footerText)
  const emailText = `${textParts.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`

  // ── Validazione ────────────────────────────────────────────────────────────
  const validation = validate({
    input,
    profile,
    footer,
    bodyMarkdown: composed.markdown,
    html,
    attachments,
    sources,
  })
  if (senderError) validation.errors.unshift(senderError)
  if (validation.errors.length) validation.status = 'MISSING_REQUIRED_DATA'

  // ── Scrittura ──────────────────────────────────────────────────────────────
  const outDir = options.outDir ?? path.join(paths.out, outputDirName(input))
  fs.mkdirSync(outDir, { recursive: true })

  const preview = renderPreviewHtml({
    emailHtml: html,
    subject: input.meta.subject || '(senza oggetto)',
    profile,
    to: input.meta.to,
    theme,
    variants: [
      { file: 'email.html', label: 'Apri HTML' },
      { file: 'email-lite.html', label: 'Variante leggera' },
    ],
  })

  const htmlBytes = Buffer.byteLength(html, 'utf8')
  const liteBytes = Buffer.byteLength(liteHtml, 'utf8')

  const stats = {
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    words: markdownToText(composed.markdown).split(/\s+/).filter(Boolean).length,
    htmlBytes,
    liteBytes,
    fontEmbedded: font.available,
    fontBytes: font.bytes,
    fontBase64Bytes: font.base64Bytes,
    footerVersion: footerId ? (getFooterVersionId(footerId) ?? '—') : '—',
    themeSource: theme.source,
    inputFile: path.relative(paths.root, absoluteInput).replace(/\\/g, '/'),
  }

  const outputs = {
    html: 'email.html',
    lite: 'email-lite.html',
    text: 'email.txt',
    preview: 'preview.html',
    report: 'report.md',
    attachments: attachments.length ? 'attachments.md' : null,
  }

  fs.writeFileSync(path.join(outDir, 'email.html'), html, 'utf8')
  fs.writeFileSync(path.join(outDir, 'email-lite.html'), liteHtml, 'utf8')
  fs.writeFileSync(path.join(outDir, 'email.txt'), emailText, 'utf8')
  fs.writeFileSync(path.join(outDir, 'preview.html'), preview, 'utf8')

  if (attachments.length) {
    fs.writeFileSync(path.join(outDir, 'attachments.md'), buildAttachmentsMd(attachments), 'utf8')
  }

  const report = buildReport({
    input,
    profile,
    footer,
    footerLearn,
    validation,
    attachments,
    sources,
    outputs,
    stats,
    composeNotes: composed.notes,
    generatorVersion: GENERATOR_VERSION,
  })
  fs.writeFileSync(path.join(outDir, 'report.md'), report, 'utf8')

  // ── Log ────────────────────────────────────────────────────────────────────
  fs.mkdirSync(paths.logs, { recursive: true })
  fs.appendFileSync(
    path.join(paths.logs, 'generations.log'),
    `${buildLogLine({ input, profile, validation, outputs, stats, generatorVersion: GENERATOR_VERSION })}\n`,
    'utf8',
  )

  return {
    outDir,
    reportPath: path.join(outDir, 'report.md'),
    status: validation.status,
    validation,
    stats,
  }
}

function getFooterVersionId(footerId) {
  try {
    const data = JSON.parse(fs.readFileSync(paths.footersJson, 'utf8'))
    return data.footers?.[footerId]?.current ?? null
  } catch {
    return null
  }
}

function buildAttachmentsMd(attachments) {
  const lines = ['# Allegati', '', 'Solo i file elencati qui vanno allegati al messaggio.', '']
  lines.push('| File | Percorso | Tipo | Stato |', '| --- | --- | --- | --- |')
  for (const file of attachments) {
    lines.push(
      `| ${path.basename(file.entry)} | \`${file.path ?? file.entry}\` | ${file.type} | ${file.exists ? 'presente' : '**non trovato**'} |`,
    )
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}
