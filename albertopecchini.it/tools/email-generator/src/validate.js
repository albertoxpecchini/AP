// Validazione: errori bloccanti separati dagli avvisi.
//
// Un errore impedisce di dichiarare l'email pronta (stato MISSING_REQUIRED_DATA);
// un avviso la lascia utilizzabile ma va letto prima dell'invio.
import { looksLikeEmail, addressOf } from './util.js'

// Soglia oltre la quale Gmail tronca il messaggio e mostra «Visualizza messaggio completo».
const GMAIL_CLIP_BYTES = 102 * 1024

export function validate({ input, profile, footer, bodyMarkdown, html, attachments, sources }) {
  const errors = []
  const warnings = []

  // ── Campi obbligatori ──────────────────────────────────────────────────────
  if (!profile) errors.push('Account mittente non risolto: compilare `from_profile` con yahoo, proton o gmail.')
  if (!input.meta.to.length) errors.push('Destinatario mancante: compilare il campo `to`.')
  if (!String(input.meta.subject ?? '').trim()) errors.push('Oggetto mancante: compilare il campo `subject`.')
  if (!String(bodyMarkdown ?? '').trim()) errors.push('Corpo dell’email vuoto: compilare la sezione «MATERIALE GREZZO».')
  if (!footer) errors.push(`Firma non trovata per il profilo «${profile?.footerId ?? '—'}» in profiles/footers.json.`)

  // ── Indirizzi ──────────────────────────────────────────────────────────────
  for (const [field, list] of [
    ['to', input.meta.to],
    ['cc', input.meta.cc],
    ['bcc', input.meta.bcc],
  ]) {
    for (const entry of list) {
      if (!looksLikeEmail(entry)) {
        errors.push(`Indirizzo non plausibile nel campo \`${field}\`: «${entry}».`)
      }
    }
  }

  if (input.meta.replyTo && !looksLikeEmail(input.meta.replyTo)) {
    warnings.push(`\`reply_to\` non sembra un indirizzo valido: «${input.meta.replyTo}».`)
  }

  // Il mittente non deve comparire fra i destinatari senza motivo.
  if (profile) {
    const self = profile.email.toLowerCase()
    if (input.meta.to.some((entry) => addressOf(entry).toLowerCase() === self)) {
      warnings.push('Il destinatario coincide con l’account mittente: verificare che sia voluto.')
    }
  }

  // ── Allegati ───────────────────────────────────────────────────────────────
  for (const file of attachments) {
    if (!file.exists) errors.push(`Allegato dichiarato ma non trovato: «${file.entry}».`)
  }

  const totalAttachmentBytes = attachments.filter((f) => f.exists).reduce((sum, f) => sum + f.bytes, 0)
  if (totalAttachmentBytes > 20 * 1024 * 1024) {
    warnings.push(
      `Allegati per ${(totalAttachmentBytes / 1024 / 1024).toFixed(1)} MB: molti provider rifiutano oltre 25 MB. Valutare un link al posto dei file.`,
    )
  }

  // ── Fonti ──────────────────────────────────────────────────────────────────
  for (const source of sources) {
    if (!source.exists) warnings.push(`Fonte indicata ma non trovata: «${source.entry}». Non è stata usata.`)
    else if (source.note) warnings.push(`${source.entry}: ${source.note}`)
  }

  // ── HTML ───────────────────────────────────────────────────────────────────
  if (html) {
    if (/<script\b/i.test(html)) errors.push('L’HTML contiene <script>: nessun JavaScript è ammesso in un’email.')
    if (/\son\w+\s*=/i.test(html)) errors.push('L’HTML contiene gestori di eventi inline (onclick…): vanno rimossi.')
    if (/<link\b[^>]+stylesheet/i.test(html)) errors.push('L’HTML richiama un foglio di stile esterno: l’email non sarebbe autosufficiente.')
    if (/@import\s+url/i.test(html)) errors.push('L’HTML usa @import: dipendenza esterna non ammessa.')
    if (/javascript:/i.test(html)) errors.push('L’HTML contiene un URL javascript:.')

    // Riferimenti a file locali: non si vedrebbero nel client.
    for (const match of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
      const src = match[1]
      if (!/^(https?:|data:|cid:)/i.test(src)) {
        warnings.push(`Immagine con percorso locale «${src}»: non sarà visibile nel client. Usare un URL assoluto o incorporarla.`)
      }
    }
    for (const match of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)) {
      warnings.push('Immagine senza attributo alt: aggiungere un testo alternativo.')
      break
    }

    const bytes = new TextEncoder().encode(html).length
    if (bytes > GMAIL_CLIP_BYTES) {
      warnings.push(
        `L’HTML pesa ${(bytes / 1024).toFixed(0)} KB: Gmail tronca oltre ${Math.round(GMAIL_CLIP_BYTES / 1024)} KB e mostra «Visualizza messaggio completo». Il font incorporato è la voce principale; usare email-lite.html per Gmail.`,
      )
    }

    if (!/viewport/i.test(html)) warnings.push('Manca il meta viewport: la resa su telefono può risultare compressa.')
    if (!/@media/i.test(html)) warnings.push('Nessuna media query: l’email non si adatta agli schermi stretti.')
  }

  // ── Link ───────────────────────────────────────────────────────────────────
  for (const link of input.links) {
    if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(link)) {
      warnings.push(`Link probabilmente incompleto: «${link}».`)
    }
  }

  return {
    errors,
    warnings,
    status: errors.length ? 'MISSING_REQUIRED_DATA' : warnings.length ? 'WARNING' : 'READY',
  }
}
