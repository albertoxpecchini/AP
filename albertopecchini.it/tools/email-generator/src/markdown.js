// Markdown → HTML per email.
//
// Non è un parser generico: copre la gerarchia richiesta (H1/H2/H3, sottotitolo,
// testo, testo secondario, link, citazione, elenchi, tabelle, badge, nota, codice
// inline e a blocchi) e produce markup con stili INLINE, perché i client di posta
// scartano con frequenza i fogli incorporati. Le classi restano come appiglio per
// i pochi client che onorano <style>.
import { escapeHtml } from './util.js'

// Varianti del pulsante «:::bottone». Per i marchi colori e glifo sono quelli
// ufficiali; il verde WhatsApp è #008069 (quello dei pulsanti di WhatsApp Web)
// perché con il bianco regge il contrasto AA (4,9:1): il #25D366 del logo si
// ferma a 2:1. Il glifo è un PNG: Gmail e Outlook non mostrano l'SVG.
export const BUTTON_VARIANTS = {
  whatsapp: { background: '#008069', color: '#ffffff', icon: 'src/assets/email/whatsapp-glyph.png' },
}

/** Righe del blocco pulsante → { label, url }: l'URL è la riga che inizia con http(s). */
function parseButton(lines) {
  const clean = lines.map((line) => line.trim()).filter(Boolean)
  const url = clean.find((line) => /^https?:\/\/\S+$/i.test(line)) ?? ''
  const label = clean.filter((line) => line !== url).join(' ') || url
  return { label, url }
}

/**
 * Pulsante «a prova di client»: tabella con fondo sul <td> (Outlook) e padding
 * sul link (tutta l'area è cliccabile negli altri client). Sotto, il link in
 * chiaro per chi ha le immagini bloccate o un client che non rende il pulsante.
 */
function renderButton(variant, lines, theme, st, iconOf) {
  const { label, url } = parseButton(lines)
  if (!url) return label ? `<p style="${st.p}">${renderInline(label, st)}</p>` : ''

  const c = theme.color
  // In «Fine settembre» ogni pulsante è nero e squadrato, anche WhatsApp (che
  // tiene il suo glifo bianco).
  const fine = isFineSettembre(theme)
  const brand = BUTTON_VARIANTS[variant]
  const look = fine
    ? { background: c.ink, color: c.paper, icon: brand?.icon ?? '' }
    : brand ?? { background: c.ink, color: c.paper, icon: '' }
  const radius = fine ? '0' : '999px'
  const icon = iconOf(look.icon)
  const href = escapeHtml(url)
  const sp = theme.space

  const iconHtml = icon
    ? `<img src="${icon}" width="24" height="24" alt="" style="display:inline-block;width:24px;height:24px;border:0;outline:none;vertical-align:middle;margin:0 10px 0 0;" />`
    : ''

  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${sp.s2}px 0 ${sp.s3}px;border-collapse:separate;">`,
    `<tr><td align="center" bgcolor="${look.background}" style="background:${look.background};border-radius:${radius};">`,
    `<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px 14px ${icon ? 22 : 28}px;font-family:${theme.font.sans};font-size:${fine ? theme.size.body : 17}px;line-height:24px;font-weight:${fine ? 700 : 600};color:${look.color};text-decoration:none;border-radius:${radius};">`,
    `${iconHtml}<span style="color:${look.color};vertical-align:middle;">${escapeHtml(label)}</span></a>`,
    `</td></tr></table>`,
    `<p style="${st.small}">Link diretto: <a href="${href}" style="${st.link}word-break:break-all;">${href}</a></p>`,
  ].join('')
}

/** Lo stile «Fine settembre» (stili.js): bianco e nero, niente riquadri? */
export const isFineSettembre = (theme) => theme?.style === 'fine-settembre'

/**
 * Stili inline di «Fine settembre». Nessun fondo e nessun bordo che chiuda un
 * blocco: la citazione ha solo un filo a sinistra, il codice solo il carattere
 * monospaziato, le tabelle filetti orizzontali. Sei livelli di titolo distinti,
 * H6 è l'etichetta maiuscola che fa anche da intestazione dei gruppi.
 */
function fineStyles(theme) {
  const c = theme.color
  const s = theme.size
  const sans = theme.font.sans
  const mono = theme.font.mono
  const head = (size, lh, margin, extra = '') =>
    `margin:${margin};font-family:${sans};font-size:${size}px;line-height:${lh};font-weight:700;color:${c.ink};text-align:left;${extra}`

  return {
    h1: head(s.h1, 1.1, '0 0 16px', 'letter-spacing:-0.02em;'),
    h2: head(s.h2, 1.15, '32px 0 12px', 'letter-spacing:-0.015em;'),
    h3: head(s.h3, 1.25, '24px 0 8px', 'letter-spacing:-0.01em;'),
    h4: head(s.h4, 1.3, '20px 0 6px'),
    h5: head(s.h5, 1.35, '16px 0 4px'),
    h6: head(s.h6, 1.4, '16px 0 6px', `letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.graphite};`),
    subtitle: `margin:0 0 24px;font-family:${sans};font-size:${s.lead}px;line-height:1.45;font-weight:400;color:${c.graphite};text-align:left;`,
    p: `margin:0 0 16px;font-family:${sans};font-size:${s.body}px;line-height:${theme.leading.body};color:${c.ink};text-align:left;`,
    small: `margin:0 0 16px;font-family:${sans};font-size:${s.small}px;line-height:1.5;color:${c.graphite};text-align:left;`,
    link: `color:${c.ink};text-decoration:underline;`,
    quote: `margin:0 0 16px;padding:0 0 0 16px;border-left:2px solid ${c.ink};font-family:${sans};font-style:italic;font-size:${s.h4}px;line-height:1.5;color:${c.ink};text-align:left;`,
    ul: `margin:0 0 16px;padding:0 0 0 24px;font-family:${sans};font-size:${s.body}px;line-height:${theme.leading.body};color:${c.ink};text-align:left;`,
    li: 'margin:0 0 6px;',
    code: `font-family:${mono};font-size:${s.small}px;color:${c.ink};`,
    pre: 'margin:0 0 16px;padding:0;',
    preCode: `font-family:${mono};font-size:${s.small}px;line-height:1.55;color:${c.ink};white-space:pre;`,
    table: `width:100%;margin:0 0 24px;border-collapse:collapse;font-family:${sans};font-size:${s.small + 1}px;`,
    th: `padding:8px 16px 8px 0;border-bottom:2px solid ${c.ink};text-align:left;font-family:${sans};font-size:${s.h6}px;font-weight:700;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.ink};`,
    td: `padding:8px 16px 8px 0;border-bottom:1px solid ${c.line};color:${c.ink};vertical-align:top;text-align:left;`,
    badge: `font-family:${sans};font-size:${s.h6}px;font-weight:700;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.ink};`,
    note: `margin:0 0 16px;font-family:${sans};font-size:${s.body}px;line-height:${theme.leading.body};color:${c.ink};text-align:left;`,
    hr: `margin:32px 0;border:0;border-top:1px solid ${c.ink};height:1px;`,
  }
}

/** Stili inline dei blocchi, derivati dal tema. */
function styles(theme) {
  if (isFineSettembre(theme)) return fineStyles(theme)
  const c = theme.color
  const s = theme.size
  const sp = theme.space
  const sans = theme.font.sans
  const mono = theme.font.mono
  const serif = theme.font.serif

  return {
    h1: `margin:0 0 ${sp.s4}px;font-family:${sans};font-size:${s.h1}px;line-height:1.06;font-weight:600;letter-spacing:${theme.tracking.display};color:${c.ink};`,
    h2: `margin:${sp.s6}px 0 ${sp.s3}px;font-family:${sans};font-size:${s.h2}px;line-height:1.1;font-weight:600;letter-spacing:${theme.tracking.display};color:${c.ink};`,
    h3: `margin:${sp.s5}px 0 ${sp.s2}px;font-family:${sans};font-size:${s.h3}px;line-height:1.2;font-weight:600;letter-spacing:-0.015em;color:${c.ink};`,
    subtitle: `margin:0 0 ${sp.s5}px;font-family:${sans};font-size:${s.lead}px;line-height:1.45;font-weight:400;color:${c.graphite};`,
    p: `margin:0 0 ${sp.s4}px;font-family:${sans};font-size:${s.body}px;line-height:${theme.leading.body};color:${c.ink2};`,
    small: `margin:0 0 ${sp.s4}px;font-family:${sans};font-size:${s.small}px;line-height:1.55;color:${c.graphite};`,
    link: `color:${c.accentDeep};text-decoration:underline;`,
    quote: `margin:0 0 ${sp.s4}px;padding:${sp.s3}px 0 ${sp.s3}px ${sp.s4}px;border-left:3px solid ${c.accent};font-family:${serif};font-style:italic;font-size:${s.lead}px;line-height:1.45;color:${c.ink2};`,
    ul: `margin:0 0 ${sp.s4}px;padding:0 0 0 ${sp.s5}px;font-family:${sans};font-size:${s.body}px;line-height:${theme.leading.body};color:${c.ink2};`,
    li: `margin:0 0 ${sp.s2}px;`,
    code: `font-family:${mono};font-size:${Math.max(13, s.small - 1)}px;background:${c.paper3};padding:2px 5px;border-radius:${theme.radius.r1};color:${c.ink};`,
    pre: `margin:0 0 ${sp.s4}px;padding:${sp.s4}px;background:${c.ink};border-radius:${theme.radius.r2};overflow-x:auto;`,
    preCode: `font-family:${mono};font-size:14px;line-height:1.55;color:${c.paper};white-space:pre;`,
    table: `width:100%;margin:0 0 ${sp.s5}px;border-collapse:collapse;font-family:${sans};font-size:${s.small}px;`,
    th: `padding:${sp.s3}px ${sp.s3}px;border-bottom:2px solid ${c.lineStrong};text-align:left;font-family:${mono};font-size:${s.label}px;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.graphite};font-weight:400;`,
    td: `padding:${sp.s3}px ${sp.s3}px;border-bottom:1px solid ${c.line};color:${c.ink2};vertical-align:top;`,
    badge: `display:inline-block;padding:4px 9px;border:1px solid ${c.lineStrong};border-radius:${theme.radius.r1};font-family:${mono};font-size:${s.label}px;letter-spacing:0.04em;text-transform:uppercase;color:${c.ink};`,
    note: `margin:0 0 ${sp.s5}px;padding:${sp.s4}px;background:${c.paper2};border-left:3px solid ${c.accent};border-radius:0 ${theme.radius.r2} ${theme.radius.r2} 0;font-family:${sans};font-size:${s.small}px;line-height:1.55;color:${c.ink2};`,
    hr: `margin:${sp.s6}px 0;border:0;border-top:1px solid ${c.line};height:1px;`,
  }
}

/** Segmenti inline: **grassetto**, *corsivo*, `codice`, [testo](url), ~~barrato~~. */
function renderInline(text, st) {
  // Il codice inline si estrae per primo e si reinserisce alla fine, così il suo
  // contenuto non viene reinterpretato come marcatura.
  const stash = []
  let out = String(text).replace(/`([^`]+)`/g, (_, code) => {
    stash.push(`<code style="${st.code}">${escapeHtml(code)}</code>`)
    return `%%CODE${stash.length - 1}%%`
  })

  out = escapeHtml(out)

  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => {
    const safeSrc = /^(https?:|cid:|data:image\/)/i.test(src) ? src : ''
    if (!safeSrc) return escapeHtml(alt)
    return `<img src="${safeSrc}" alt="${alt}" style="max-width:100%;height:auto;display:block;border:0;" />`
  })

  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) => {
    // Solo schemi sicuri: niente javascript: dentro un'email.
    if (!/^(https?:|mailto:|tel:|#)/i.test(href)) return whole
    return `<a href="${href}" style="${st.link}">${label}</a>`
  })

  out = out
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:600;">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')

  // URL nudi → link cliccabili (non dentro un href già scritto).
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (whole, prefix, url) => {
    return `${prefix}<a href="${url}" style="${st.link}">${url}</a>`
  })

  return out.replace(/%%CODE(\d+)%%/g, (_, index) => stash[Number(index)])
}

function renderTable(rows, st) {
  const [head, , ...body] = rows
  const cells = (line) =>
    line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim())

  const thead = `<tr>${cells(head)
    .map((cell) => `<th style="${st.th}">${renderInline(cell, st)}</th>`)
    .join('')}</tr>`

  const tbody = body
    .map((line) => `<tr>${cells(line).map((cell) => `<td style="${st.td}">${renderInline(cell, st)}</td>`).join('')}</tr>`)
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="${st.table}"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}

/**
 * Converte Markdown in HTML per email.
 * @param {string} markdown
 * @param {object} theme
 * @param {{icon?: (file: string) => string}} [options] `icon` risolve il file di un'icona in data URI
 *   (nel generatore è `iconDataUri` di assets.js; nel browser una mappa già codificata)
 */
export function renderMarkdown(markdown, theme, { icon } = {}) {
  const st = styles(theme)
  const iconOf = typeof icon === 'function' ? icon : () => ''
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    // Blocco di codice
    if (/^```/.test(line.trim())) {
      const buffer = []
      i += 1
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buffer.push(lines[i])
        i += 1
      }
      i += 1
      out.push(`<pre style="${st.pre}"><code style="${st.preCode}">${escapeHtml(buffer.join('\n'))}</code></pre>`)
      continue
    }

    // Pulsante: «:::bottone [variante]», etichetta e URL su righe proprie, «:::».
    const button = /^:::\s*(?:bottone|pulsante)\b\s*([\w-]*)/i.exec(line.trim())
    if (button) {
      const buffer = []
      i += 1
      while (i < lines.length && !/^:::/.test(lines[i].trim())) {
        buffer.push(lines[i])
        i += 1
      }
      i += 1
      out.push(renderButton(button[1].toLowerCase(), buffer, theme, st, iconOf))
      continue
    }

    // Nota: riga che inizia con «> [!NOTA]» o «:::nota»
    if (/^:::\s*nota/i.test(line.trim())) {
      const buffer = []
      i += 1
      while (i < lines.length && !/^:::/.test(lines[i].trim())) {
        buffer.push(lines[i])
        i += 1
      }
      i += 1
      const note = renderInline(buffer.join(' ').trim(), st)
      // Senza riquadro, la nota è un'etichetta H6 sopra il suo paragrafo.
      if (isFineSettembre(theme)) out.push(`<h6 style="${st.h6}">Nota</h6>`, `<p style="${st.note}">${note}</p>`)
      else out.push(`<div style="${st.note}">${note}</div>`)
      continue
    }

    // Citazione
    if (/^>\s?/.test(line)) {
      const buffer = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buffer.push(lines[i].replace(/^>\s?/, ''))
        i += 1
      }
      out.push(`<blockquote style="${st.quote}">${renderInline(buffer.join(' ').trim(), st)}</blockquote>`)
      continue
    }

    // Tabella
    if (/^\|/.test(line.trim()) && i + 1 < lines.length && /^\|?[\s:-]+\|/.test(lines[i + 1].trim())) {
      const buffer = []
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        buffer.push(lines[i].trim())
        i += 1
      }
      out.push(renderTable(buffer, st))
      continue
    }

    // Linea orizzontale
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      out.push(`<hr style="${st.hr}" />`)
      i += 1
      continue
    }

    // Titoli
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      const level = heading[1].length
      const content = renderInline(heading[2].trim(), st)
      // «Fine settembre» ha sei livelli distinti; «Metà settembre» ne ha tre,
      // e dal quarto in giù resta com'era (H3).
      if (isFineSettembre(theme)) out.push(`<h${level} style="${st[`h${level}`]}">${content}</h${level}>`)
      else if (level === 1) out.push(`<h1 style="${st.h1}">${content}</h1>`)
      else if (level === 2) out.push(`<h2 style="${st.h2}">${content}</h2>`)
      else out.push(`<h3 style="${st.h3}">${content}</h3>`)
      i += 1
      continue
    }

    // Elenco numerato
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''))
        i += 1
        // Righe successive senza numero: sono la continuazione della stessa voce,
        // non un elenco nuovo. Si accodano invece di chiudere l'elenco.
        while (i < lines.length && lines[i].trim() && !/^\s*(\d+[.)]|[-*+])\s+/.test(lines[i]) && !/^(#{1,6}\s|>\s?|\||```|:::)/.test(lines[i].trim())) {
          items[items.length - 1] += ` ${lines[i].trim()}`
          i += 1
        }
      }
      const body = items.map((item) => `<li style="${st.li}">${renderInline(item, st)}</li>`).join('')
      out.push(`<ol style="${st.ul}">${body}</ol>`)
      continue
    }

    // Elenco puntato
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''))
        i += 1
        // Come sopra: le righe indentate proseguono la voce corrente.
        while (i < lines.length && lines[i].trim() && !/^\s*(\d+[.)]|[-*+])\s+/.test(lines[i]) && !/^(#{1,6}\s|>\s?|\||```|:::)/.test(lines[i].trim())) {
          items[items.length - 1] += ` ${lines[i].trim()}`
          i += 1
        }
      }
      const body = items.map((item) => `<li style="${st.li}">${renderInline(item, st)}</li>`).join('')
      out.push(`<ul style="${st.ul}">${body}</ul>`)
      continue
    }

    // Paragrafo: righe consecutive fino a una vuota o a un blocco nuovo.
    const buffer = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>\s?|\||```|:::|\s*[-*+]\s|\s*\d+[.)]\s)/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      // Non si applica trim() qui: gli spazi finali segnano l'interruzione di riga.
      buffer.push(lines[i].replace(/^\s+/, ''))
      i += 1
    }
    if (buffer.length) {
      // Due spazi a fine riga = interruzione di riga (saluto e firma, indirizzi…).
      const paragraph = buffer
        .map((line, index) => (index < buffer.length - 1 && /\s{2,}$/.test(line) ? `${line.trim()}%%BR%%` : line.trim()))
        .join(' ')
      const rendered = renderInline(paragraph, st).replace(/%%BR%%\s*/g, '<br />')
      out.push(`<p style="${st.p}">${rendered}</p>`)
    }
  }

  return out.join('\n')
}

/**
 * Tabella Markdown → testo allineato.
 * In un client testuale una tabella con le pipe è illeggibile: si rende come
 * righe «etichetta: valore», che restano comprensibili a qualsiasi larghezza.
 */
function tableToText(block) {
  const rows = block
    .split('\n')
    .filter((line) => /^\s*\|/.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((cell) => cell.trim()),
    )
  if (rows.length < 2) return block

  const [head, separator, ...body] = rows
  if (!/^[\s:-]+$/.test(separator.join(''))) return block

  return body
    .map((row) => row.map((cell, index) => `${head[index] ?? ''}: ${cell}`.replace(/^: /, '')).join('\n'))
    .join('\n\n')
}

/** Markdown → testo semplice, per la versione `.txt` dell'email. */
export function markdownToText(markdown) {
  return String(markdown ?? '')
    .replace(/\r\n/g, '\n')
    // Le tabelle si convertono prima che il resto della pulizia le smonti.
    .replace(/(?:^\s*\|.*\n)+/gm, (block) => `${tableToText(block.replace(/\n$/, ''))}\n`)
    // Pulsante → «Etichetta: URL», prima che la pulizia dei «:::» lo smonti.
    .replace(/^:::\s*(?:bottone|pulsante)\b[^\n]*\n([\s\S]*?)^:::[ \t]*$/gim, (_, body) => {
      const { label, url } = parseButton(body.split('\n'))
      return url && label !== url ? `${label}: ${url}` : label
    })
    .replace(/[ \t]{2,}\n/g, '\n')
    .replace(/```[\w-]*\n([\s\S]*?)```/g, (_, code) => code.trim())
    .replace(/^:::\s*nota\s*/gim, '')
    .replace(/^:::\s*$/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s?/gm, '')
    // [ \t] e non \s: con /m, \s* ingoierebbe la riga vuota prima dell'elenco.
    .replace(/^[ \t]*[-*+]\s+/gm, '— ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export { styles as blockStyles }
