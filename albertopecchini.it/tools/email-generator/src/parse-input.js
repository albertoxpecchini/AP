// Lettura del file di input (copia di EMAIL_INPUT_TEMPLATE.md).
//
// Il template è Markdown con sezioni intitolate e un blocco YAML di metadati.
// Per non aggiungere dipendenze si interpreta il sottoinsieme di YAML usato dal
// template: coppie chiave/valore e liste di stringhe. Nulla viene dedotto: i
// campi assenti restano vuoti e la validazione deciderà se sono indispensabili.
import fs from 'node:fs'

/** Rimuove virgolette e spazi da un valore YAML scalare. */
function unquote(value) {
  const trimmed = String(value ?? '').trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1)
    }
  }
  return trimmed
}

function coerce(value) {
  const raw = unquote(value)
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw === 'null' || raw === '~' || raw === '') return ''
  return raw
}

/**
 * YAML ridotto: `chiave: valore`, `chiave: []`, e liste con `-` indentato.
 * Non gestisce mappe annidate perché il template non ne usa.
 */
export function parseSimpleYaml(text) {
  const out = {}
  const lines = String(text).split(/\r?\n/)
  let currentKey = null

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue

    const item = /^\s*-\s*(.*)$/.exec(line)
    if (item && currentKey) {
      const value = coerce(item[1])
      if (value !== '') out[currentKey].push(value)
      continue
    }

    const pair = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (!pair) continue

    const [, key, rest] = pair
    const trimmedRest = rest.trim()

    if (trimmedRest === '' ) {
      // Chiave senza valore: apre una lista sulle righe seguenti.
      out[key] = []
      currentKey = key
      continue
    }
    if (trimmedRest === '[]') {
      out[key] = []
      currentKey = null
      continue
    }
    // Lista inline: [a, b]
    const inline = /^\[(.*)\]$/.exec(trimmedRest)
    if (inline) {
      out[key] = inline[1]
        .split(',')
        .map((part) => coerce(part))
        .filter((part) => part !== '')
      currentKey = null
      continue
    }

    out[key] = coerce(trimmedRest)
    currentKey = null
  }

  return out
}

/**
 * Blocchi recintati di una sezione.
 *
 * Scansione riga per riga, non espressione regolare: il materiale grezzo può
 * contenere a sua volta blocchi di codice, e una ricerca non voluta si
 * fermerebbe alla prima chiusura interna troncando il contenuto. Come in
 * CommonMark, una recinzione si chiude solo con una recinzione dello stesso
 * carattere e lunghezza almeno pari a quella di apertura.
 */
function allFencedBlocks(section) {
  const lines = String(section).replace(/\r\n/g, '\n').split('\n')
  const blocks = []

  let open = null
  let buffer = []

  for (const line of lines) {
    const fence = /^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*$/.exec(line)

    if (open) {
      // Chiusura: stesso carattere, lunghezza almeno pari, nessun linguaggio.
      if (fence && fence[2][0] === open.char && fence[2].length >= open.length && !fence[3]) {
        blocks.push({ lang: open.lang, body: buffer.join('\n').replace(/\s+$/, '') })
        open = null
        buffer = []
        continue
      }
      buffer.push(line)
      continue
    }

    if (fence) {
      open = { char: fence[2][0], length: fence[2].length, lang: fence[3] ?? '' }
      buffer = []
    }
  }

  // Recinzione lasciata aperta: si tiene comunque quel che è stato raccolto.
  if (open && buffer.length) {
    blocks.push({ lang: open.lang, body: buffer.join('\n').replace(/\s+$/, '') })
  }

  return blocks
}

/** Contenuto del primo blocco recintato dentro un testo. */
function firstFencedBlock(section) {
  return allFencedBlocks(section)[0]?.body ?? ''
}

// Frammenti che compaiono solo nei blocchi illustrativi del template: servono a
// spiegare la sintassi, non sono contenuto da mandare per email.
const TEMPLATE_SAMPLES = [
  /^\.\.\.$/,
  /^Testo della nota\.$/m,
  /^\s*:::nota\s*\n\s*Testo della nota\.\s*\n\s*:::\s*$/,
  /Inserisci qui la firma completa/i,
  /^percorso\//m,
  /^https:\/\/\.\.\.$/m,
]

function looksLikeSample(body) {
  const text = String(body).trim()
  if (!text) return true
  return TEMPLATE_SAMPLES.some((pattern) => pattern.test(text))
}

/**
 * Blocco compilato dall'utente in una sezione.
 *
 * Alcune sezioni del template contengono prima uno o più blocchi d'esempio che
 * illustrano la sintassi, e solo in fondo quello da riempire. Si scartano gli
 * esempi riconoscibili e si prende l'ultimo blocco rimasto: è quello che
 * l'utente ha davanti al cursore quando compila il file.
 */
function userFencedBlock(section) {
  const blocks = allFencedBlocks(section)
  if (!blocks.length) return ''
  const real = blocks.filter((block) => !looksLikeSample(block.body))
  if (!real.length) return ''
  return real[real.length - 1].body
}

/** Righe di una lista `- voce`, ignorando i segnaposto del template. */
function listFromBlock(block) {
  return String(block)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .filter((line) => !/^percorso\/|^https:\/\/\.\.\.$|^\.\.\.$/.test(line))
}

// Titoli di sezione del template. Solo questi delimitano il documento: un
// `## Record da inserire` scritto dall'utente dentro il materiale grezzo è
// contenuto, non una nuova sezione.
const SECTION_TITLES = [
  'METADATI',
  'METADATA',
  "SCOPO DELL'EMAIL",
  'SCOPO DELL’EMAIL',
  'SCOPO',
  'ISTRUZIONI DI SCRITTURA',
  'ISTRUZIONI',
  'MATERIALE GREZZO',
  'MATERIALE',
  'FILE DA LEGGERE',
  'FILE DA ALLEGARE',
  'LINK DA INSERIRE',
  'LINK',
  'FOOTER DA IMPARARE / AGGIORNARE',
  'FOOTER DA IMPARARE',
  'FOOTER',
  'NOTE INTERNE',
  'NOTE',
  'CHECK FINALE UMANO',
  'COMANDO DESIDERATO',
  'COMANDO',
]

/** Confronto dei titoli senza accenti né punteggiatura: «SCOPO DELL’EMAIL» = «SCOPO DELL'EMAIL». */
function titleKey(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
}

const SECTION_KEYS = new Set(SECTION_TITLES.map(titleKey))

/**
 * Divide il documento nelle sezioni del template.
 *
 * Scansione riga per riga: le righe dentro una recinzione ``` non vengono mai
 * interpretate come titoli, e un `##` diventa confine solo se corrisponde a un
 * titolo noto. Così il Markdown scritto dall'utente resta intatto.
 */
function splitSections(markdown) {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n')
  const sections = new Map()

  let currentTitle = null
  let buffer = []
  let fence = null

  const flush = () => {
    if (currentTitle) sections.set(currentTitle, buffer.join('\n'))
    buffer = []
  }

  for (const line of lines) {
    const fenceMatch = /^(\s*)(`{3,}|~{3,})/.exec(line)
    if (fenceMatch) {
      const char = fenceMatch[2][0]
      const length = fenceMatch[2].length
      if (!fence) fence = { char, length }
      else if (char === fence.char && length >= fence.length) fence = null
      buffer.push(line)
      continue
    }

    // Dentro una recinzione tutto è contenuto.
    if (!fence) {
      const heading = /^##\s+(.+?)\s*$/.exec(line)
      if (heading && SECTION_KEYS.has(titleKey(heading[1]))) {
        flush()
        currentTitle = titleKey(heading[1])
        continue
      }
    }

    buffer.push(line)
  }

  flush()
  return sections
}

function findSection(sections, ...names) {
  for (const name of names) {
    const key = titleKey(name)
    if (sections.has(key)) return sections.get(key)
  }
  // Ricerca tollerante: il titolo contiene il nome cercato.
  for (const [title, body] of sections) {
    if (names.some((name) => title.includes(titleKey(name)))) return body
  }
  return ''
}

/** Estrae il footer racchiuso fra [INIZIO FOOTER] e [FINE FOOTER]. */
function parseFooterBlock(section) {
  const match = /\[INIZIO FOOTER\]([\s\S]*?)\[FINE FOOTER\]/i.exec(section)
  if (!match) return { text: '', action: null }

  let text = match[1].trim()

  // Il template contiene un esempio illustrativo: se è rimasto tale e quale,
  // non va imparato come firma reale.
  const looksLikeTemplate =
    /Inserisci qui la firma completa/i.test(text) ||
    /^Esempio:/im.test(text) ||
    /Nome Cognome/i.test(text)
  if (looksLikeTemplate) text = ''

  const actionMatch = /Azione footer:\s*([A-Z_]+)/i.exec(section)
  const action = actionMatch ? actionMatch[1].toUpperCase() : null

  return { text, action }
}

/**
 * Legge un file di input e restituisce la struttura normalizzata.
 * @param {string} file percorso del .md
 */
export function parseInputFile(file) {
  const markdown = fs.readFileSync(file, 'utf8')
  const sections = splitSections(markdown)

  const metaSection = findSection(sections, 'METADATI', 'METADATA')
  const metaBlocks = allFencedBlocks(metaSection)
  const yamlBlock = metaBlocks.find((b) => b.lang === 'yaml' || b.lang === 'yml') ?? metaBlocks[0]
  const meta = yamlBlock ? parseSimpleYaml(yamlBlock.body) : {}

  const purpose = userFencedBlock(findSection(sections, "SCOPO DELL'EMAIL", 'SCOPO')).trim()
  const instructionsRaw = userFencedBlock(findSection(sections, 'ISTRUZIONI DI SCRITTURA', 'ISTRUZIONI')).trim()
  // La sezione del materiale grezzo contiene anche l'esempio della nota: va preso
  // il blocco compilato, non il primo che capita.
  const bodyRaw = userFencedBlock(findSection(sections, 'MATERIALE GREZZO', 'MATERIALE')).trim()

  const filesToRead = listFromBlock(userFencedBlock(findSection(sections, 'FILE DA LEGGERE')))
  const attachments = listFromBlock(userFencedBlock(findSection(sections, 'FILE DA ALLEGARE')))
  const links = listFromBlock(userFencedBlock(findSection(sections, 'LINK DA INSERIRE', 'LINK')))
  const notes = userFencedBlock(findSection(sections, 'NOTE INTERNE', 'NOTE')).trim()

  const footerSection = findSection(sections, 'FOOTER DA IMPARARE', 'FOOTER')
  const footer = parseFooterBlock(footerSection)

  const commandBlock = firstFencedBlock(findSection(sections, 'COMANDO DESIDERATO', 'COMANDO')).trim()

  // Il segnaposto `...` del template equivale a «non compilato».
  const clean = (text) => (text === '...' ? '' : text)

  const toList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string' && value.trim()) return [value.trim()]
    return []
  }

  return {
    sourceFile: file,
    meta: {
      id: meta.id ?? '',
      date: meta.date ?? '',
      fromProfile: meta.from_profile ?? '',
      to: toList(meta.to),
      cc: toList(meta.cc),
      bcc: toList(meta.bcc),
      replyTo: meta.reply_to ?? '',
      subject: meta.subject ?? '',
      language: meta.language || 'it',
      tone: meta.tone || 'professionale',
      priority: meta.priority || 'normal',
      footerProfile: meta.footer_profile || 'auto',
      requestConfirmation: meta.request_confirmation === true,
    },
    purpose: clean(purpose),
    instructions: clean(instructionsRaw),
    rawBody: clean(bodyRaw),
    filesToRead,
    attachments,
    links,
    notes: clean(notes),
    footerLearn: footer,
    command: commandBlock || 'GENERATE_EMAIL',
  }
}
