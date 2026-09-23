// Composizione del corpo dell'email.
//
// REGOLA: i fatti vengono dal materiale grezzo e dalle fonti lette. Qui si dà
// forma — saluto, apertura, corpo, chiusura — senza aggiungere informazioni.
// Se il materiale contiene già un saluto o una chiusura non se ne aggiungono
// altri; se manca il destinatario nominato, il saluto resta impersonale invece
// di inventare un nome.
import { markdownToText } from './markdown.js'

const GREETING_RE = /^(gentile|gentilissim|egregi|spettabile|buongiorno|buonasera|salve|ciao|caro|cara)\b/i
const CLOSING_RE = /(cordiali saluti|distinti saluti|cordialmente|a presto|ci sentiamo|grazie e (?:a presto|buona)|un saluto|buon lavoro|resto a disposizione|in attesa di)/i

const CLOSINGS = {
  formale: 'Cordiali saluti,',
  professionale: 'Cordiali saluti,',
  cordiale: 'Un caro saluto,',
  informale: 'A presto,',
  diretto: 'Grazie,',
}

/** Il materiale grezzo apre già con un saluto? */
export function hasGreeting(text) {
  const first = String(text ?? '').trim().split(/\n/)[0] ?? ''
  return GREETING_RE.test(first.trim())
}

export function hasClosing(text) {
  // Righe unite con uno spazio: «cordiali» a fine riga e «saluti» a capo
  // sono comunque un saluto, e non va aggiunto un secondo congedo.
  const tail = String(text ?? '').trim().split(/\n/).slice(-6).join(' ').replace(/\s+/g, ' ')
  return CLOSING_RE.test(tail)
}

/**
 * Saluto d'apertura.
 * Senza un nome esplicito resta impersonale: non si deduce dall'indirizzo email.
 */
export function buildGreeting({ recipientName, tone }) {
  if (recipientName) {
    const formal = tone === 'informale' || tone === 'cordiale' ? 'Ciao' : 'Gentile'
    return `${formal} ${recipientName},`
  }
  if (tone === 'informale') return 'Ciao,'
  return 'Buongiorno,'
}

export function buildClosing(tone) {
  return CLOSINGS[tone] ?? CLOSINGS.professionale
}

/**
 * Nome del destinatario, solo se scritto nella forma `Nome Cognome <mail@dominio>`.
 * Da un indirizzo nudo NON si ricava un nome: `m.rossi@…` non è «M Rossi».
 */
export function recipientNameFrom(to) {
  const first = (to ?? [])[0]
  if (!first) return ''
  const match = /^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/.exec(String(first))
  if (!match) return ''
  const name = match[1].trim()
  return name && !name.includes('@') ? name : ''
}

/**
 * Assembla il Markdown finale del corpo.
 * @returns {{markdown: string, notes: string[]}}
 */
export function composeBody({ rawBody, tone, to, signOff = true, senderName = '' }) {
  const notes = []
  const material = String(rawBody ?? '').trim()

  if (!material) {
    return { markdown: '', notes: ['Materiale grezzo assente: il corpo dell’email è vuoto.'] }
  }

  const parts = []
  const recipientName = recipientNameFrom(to)

  if (!hasGreeting(material)) {
    parts.push(buildGreeting({ recipientName, tone }))
    parts.push('')
    if (!recipientName) {
      notes.push(
        'Il destinatario non è indicato nella forma «Nome Cognome <indirizzo>»: il saluto è impersonale («Buongiorno,»). Per personalizzarlo, scrivere il nome nel campo `to`.',
      )
    }
  }

  parts.push(material)

  if (signOff && !hasClosing(material)) {
    parts.push('')
    // Saluto e nome vanno su due righe: separati da una riga vuota diventerebbero
    // due paragrafi distanti, sulla stessa riga si fonderebbero in una frase.
    // La doppia spaziatura finale è l'interruzione di riga del Markdown.
    parts.push(senderName ? `${buildClosing(tone)}  \n${senderName}` : buildClosing(tone))
  }

  return { markdown: parts.join('\n').replace(/\n{3,}/g, '\n\n').trim(), notes }
}

/** Anteprima nella lista messaggi: prima frase utile del corpo. */
export function buildPreheader(markdown, limit = 140) {
  const text = markdownToText(markdown)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !GREETING_RE.test(line))
    .join(' ')
  if (!text) return ''
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1).replace(/\s+\S*$/, '')}…`
}
