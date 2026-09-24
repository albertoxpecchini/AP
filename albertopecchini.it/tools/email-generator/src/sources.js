// Lettura delle fonti indicate in «FILE DA LEGGERE» e verifica degli allegati.
//
// I formati di testo vengono letti davvero; PDF e DOCX sono archivi/binari e
// senza dipendenze esterne se ne estrae quel che si può, dichiarando sempre
// nel report quando l'estrazione è parziale. Un'estrazione incerta non deve mai
// diventare una fonte di fatti dati per buoni.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { paths } from './paths.js'

const TEXT_EXT = new Set(['.md', '.txt', '.html', '.htm', '.json', '.csv', '.tsv', '.yml', '.yaml'])
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'])

/** Risolve un percorso relativo rispetto al file di input, poi alla radice. */
export function resolveSourcePath(entry, baseDir) {
  const candidates = [
    path.resolve(baseDir, entry),
    path.resolve(paths.root, entry),
    path.resolve(paths.attachments, entry),
    path.resolve(paths.in, entry),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/** Testo leggibile da un DOCX: `word/document.xml` dentro lo zip. */
function extractDocx(buffer) {
  // Lettura minimale di uno ZIP: si cercano le voci deflate di document.xml.
  try {
    const text = buffer.toString('latin1')
    const marker = 'word/document.xml'
    let index = text.indexOf(marker)
    while (index !== -1) {
      // Intestazione locale: firma PK\x03\x04, il nome inizia a offset 30.
      const headerStart = text.lastIndexOf('PK\x03\x04', index)
      if (headerStart !== -1) {
        const compressedSize = buffer.readUInt32LE(headerStart + 18)
        const nameLength = buffer.readUInt16LE(headerStart + 26)
        const extraLength = buffer.readUInt16LE(headerStart + 28)
        const name = buffer.toString('utf8', headerStart + 30, headerStart + 30 + nameLength)
        if (name === marker && compressedSize > 0) {
          const dataStart = headerStart + 30 + nameLength + extraLength
          const method = buffer.readUInt16LE(headerStart + 8)
          const chunk = buffer.subarray(dataStart, dataStart + compressedSize)
          const xml = method === 0 ? chunk.toString('utf8') : zlib.inflateRawSync(chunk).toString('utf8')
          return xmlToText(xml)
        }
      }
      index = text.indexOf(marker, index + 1)
    }
  } catch {
    /* si ricade sul messaggio di estrazione non riuscita */
  }
  return null
}

function xmlToText(xml) {
  return xml
    .replace(/<w:p\b[^>]*>/g, '\n')
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Testo da un PDF: si decomprimono gli stream e si leggono gli operatori di testo. */
function extractPdf(buffer) {
  try {
    const chunks = []
    const raw = buffer.toString('latin1')
    const streamRe = /stream\r?\n/g
    let match
    while ((match = streamRe.exec(raw)) !== null) {
      const start = match.index + match[0].length
      const end = raw.indexOf('endstream', start)
      if (end === -1) continue
      const slice = buffer.subarray(start, end)
      let text = null
      try {
        text = zlib.inflateSync(slice).toString('latin1')
      } catch {
        try {
          text = zlib.inflateRawSync(slice).toString('latin1')
        } catch {
          text = null
        }
      }
      if (text && /\bTJ\b|\bTj\b/.test(text)) chunks.push(text)
    }

    if (!chunks.length) return null

    const out = []
    for (const chunk of chunks) {
      // Stringhe fra parentesi tonde negli operatori Tj / TJ.
      for (const m of chunk.matchAll(/\(((?:\\.|[^\\()])*)\)\s*Tj/g)) out.push(unescapePdf(m[1]))
      for (const m of chunk.matchAll(/\[((?:\\.|[^\]])*)\]\s*TJ/g)) {
        const parts = [...m[1].matchAll(/\(((?:\\.|[^\\()])*)\)/g)].map((p) => unescapePdf(p[1]))
        if (parts.length) out.push(parts.join(''))
      }
    }
    const text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    return text || null
  } catch {
    return null
  }
}

function unescapePdf(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\([()\\])/g, '$1')
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Legge una fonte e ne restituisce il testo quando possibile.
 * @returns {{entry, path, exists, kind, text, bytes, note}}
 */
export function readSource(entry, baseDir) {
  const resolved = resolveSourcePath(entry, baseDir)
  if (!resolved) {
    return { entry, path: null, exists: false, kind: 'missing', text: '', bytes: 0, note: 'File non trovato.' }
  }

  const ext = path.extname(resolved).toLowerCase()
  const stat = fs.statSync(resolved)
  const rel = path.relative(paths.root, resolved).replace(/\\/g, '/')
  const base = { entry, path: rel, absolute: resolved, exists: true, bytes: stat.size }

  if (TEXT_EXT.has(ext)) {
    const raw = fs.readFileSync(resolved, 'utf8')
    const text = ext === '.html' || ext === '.htm' ? htmlToText(raw) : raw
    return { ...base, kind: 'text', text, note: '' }
  }

  if (ext === '.docx') {
    const text = extractDocx(fs.readFileSync(resolved))
    return text
      ? { ...base, kind: 'docx', text, note: '' }
      : { ...base, kind: 'docx', text: '', note: 'Testo del DOCX non estraibile automaticamente: contenuto da riportare a mano.' }
  }

  if (ext === '.pdf') {
    const text = extractPdf(fs.readFileSync(resolved))
    return text
      ? { ...base, kind: 'pdf', text, note: 'Estrazione automatica dal PDF: verificare i dati prima dell’invio.' }
      : { ...base, kind: 'pdf', text: '', note: 'Testo del PDF non estraibile (probabile scansione): contenuto da riportare a mano.' }
  }

  if (IMAGE_EXT.has(ext)) {
    return { ...base, kind: 'image', text: '', note: 'Immagine: nessun testo estratto.' }
  }

  return { ...base, kind: 'binary', text: '', note: 'Formato non testuale: nessun testo estratto.' }
}

/** Verifica gli allegati dichiarati. Nessun file viene allegato d'ufficio. */
export function checkAttachments(entries, baseDir) {
  return entries.map((entry) => {
    const resolved = resolveSourcePath(entry, baseDir)
    if (!resolved) {
      return { entry, path: null, exists: false, type: path.extname(entry).replace('.', '').toUpperCase() || '—', bytes: 0 }
    }
    const stat = fs.statSync(resolved)
    return {
      entry,
      path: path.relative(paths.root, resolved).replace(/\\/g, '/'),
      absolute: resolved,
      exists: true,
      type: path.extname(resolved).replace('.', '').toUpperCase() || '—',
      bytes: stat.size,
    }
  })
}

export { formatBytes } from './util.js'
