// Resa della firma: HTML (riquadro scuro coerente con `[data-theme='ink']`) e
// testo semplice. Modulo puro, senza accesso ai file: il logo arriva già
// risolto in data URI (vedi `resolveFooterLogo` in footers.js), così lo stesso
// codice gira nel generatore da riga di comando e nel compositore in pagina.
import { escapeHtml } from './util.js'

/**
 * Footer in HTML: riquadro dedicato, tema scuro coerente con `[data-theme='ink']`.
 * @param {object|null} footer versione attiva della firma
 * @param {object} theme tema email
 * @param {{src: string, alt: string, width: number, padding: number}|null} logo logo già risolto
 */
export function renderFooterHtml(footer, theme, logo = null) {
  if (!footer) return ''
  const c = theme.color
  const sp = theme.space
  const sans = theme.font.sans
  const mono = theme.font.mono

  const labelStyle = `font-family:${mono};font-size:${theme.size.label}px;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.darkMuted};`
  const linkStyle = `color:${c.darkAccent};text-decoration:none;`
  const rows = []

  // Logo dell'ente, sopra il nome. È incorporato come data URI: i client di
  // posta bloccano le immagini remote, e l'SVG non è supportato quasi da
  // nessuno — per questo il file di riferimento è un PNG.
  // Il logo NON si ritocca: i marchi istituzionali vanno riprodotti come sono.
  // Poiché il pannello della firma è scuro e il logo è pensato per fondo
  // chiaro, si dà al logo un riquadro chiaro suo, che fa da «carta».
  if (logo) {
    const pad = logo.padding ?? 12
    rows.push(
      `<tr><td style="padding:0 0 ${sp.s5}px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:${c.paper};border-radius:${theme.radius.r2};padding:${pad}px ${pad + 2}px;line-height:0;"><img src="${logo.src}" alt="${escapeHtml(logo.alt)}" width="${logo.width}" style="display:block;width:${logo.width}px;max-width:100%;height:auto;border:0;" /></td></tr></table></td></tr>`,
    )
  }

  if (footer.name) {
    rows.push(
      `<tr><td style="padding:0 0 4px;font-family:${sans};font-size:${theme.size.h3}px;line-height:1.15;font-weight:600;letter-spacing:-0.015em;color:${c.darkFg};">${escapeHtml(footer.name)}</td></tr>`,
    )
  }
  if (footer.role) {
    rows.push(
      `<tr><td style="padding:0 0 2px;font-family:${sans};font-size:${theme.size.small}px;line-height:1.4;color:${c.darkFg};">${escapeHtml(footer.role)}</td></tr>`,
    )
  }
  if (footer.org) {
    rows.push(
      `<tr><td style="padding:0 0 ${sp.s4}px;font-family:${sans};font-size:${theme.size.small}px;line-height:1.4;color:${c.darkMuted};">${escapeHtml(footer.org)}</td></tr>`,
    )
  }

  const contactCells = (footer.contacts ?? []).map((contact) => {
    const value = contact.href
      ? `<a href="${escapeHtml(contact.href)}" style="${linkStyle}">${escapeHtml(contact.value)}</a>`
      : escapeHtml(contact.value)
    return `<tr><td style="padding:0 0 6px;font-family:${sans};font-size:${theme.size.small}px;line-height:1.4;color:${c.darkFg};"><span style="${labelStyle}">${escapeHtml(contact.label)}</span>&nbsp;&nbsp;${value}</td></tr>`
  })

  if (contactCells.length) {
    rows.push(
      `<tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${contactCells.join('')}</table></td></tr>`,
    )
  }

  if (footer.address) {
    rows.push(
      `<tr><td style="padding:6px 0 0;font-family:${sans};font-size:${theme.size.small}px;line-height:1.4;color:${c.darkMuted};">${escapeHtml(footer.address)}</td></tr>`,
    )
  }

  const linkParts = [
    ...(footer.links ?? []).map(
      (link) => `<a href="${escapeHtml(link.url)}" style="${linkStyle}">${escapeHtml(link.label)}</a>`,
    ),
    ...(footer.social ?? []).map(
      (social) =>
        `<a href="${escapeHtml(social.url)}" style="${linkStyle}">${escapeHtml(social.label)}${social.handle ? ` ${escapeHtml(social.handle)}` : ''}</a>`,
    ),
  ]

  if (linkParts.length) {
    rows.push(
      `<tr><td style="padding:${sp.s4}px 0 0;border-top:1px solid ${c.darkLine};font-family:${sans};font-size:${theme.size.small}px;line-height:1.5;color:${c.darkMuted};">${linkParts.join(
        ` <span style="color:${c.darkLine};">·</span> `,
      )}</td></tr>`,
    )
  }

  for (const note of footer.notes ?? []) {
    rows.push(
      `<tr><td style="padding:8px 0 0;font-family:${mono};font-size:${theme.size.label}px;letter-spacing:0.04em;line-height:1.5;color:${c.darkMuted};">${escapeHtml(note)}</td></tr>`,
    )
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${c.darkBg};border-radius:${theme.radius.r2};">
        <tr>
          <td style="padding:${sp.s5}px ${theme.layout.gutter}px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows.join('')}</table>
          </td>
        </tr>
      </table>`
}

/** Footer in testo semplice, per `email.txt`. */
export function renderFooterText(footer) {
  if (!footer) return ''
  const lines = []
  if (footer.name) lines.push(footer.name)
  if (footer.role) lines.push(footer.role)
  if (footer.org) lines.push(footer.org)
  for (const contact of footer.contacts ?? []) lines.push(`${contact.label}: ${contact.value}`)
  if (footer.address) lines.push(footer.address)
  for (const link of footer.links ?? []) lines.push(link.url)
  for (const social of footer.social ?? []) lines.push(`${social.label}: ${social.url}`)
  for (const note of footer.notes ?? []) lines.push(note)
  return lines.join('\n')
}
