// Resa della firma: HTML (riquadro scuro coerente con `[data-theme='ink']`) e
// testo semplice. Modulo puro, senza accesso ai file: il logo arriva già
// risolto in data URI (vedi `resolveFooterLogo` in footers.js), così lo stesso
// codice gira nel generatore da riga di comando e nel compositore in pagina.
import { escapeHtml } from './util.js'
import { isFineSettembre, blockStyles } from './markdown.js'

const table = (inner, attrs = '') =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${attrs}>${inner}</table>`

/** Il logo con `href` è un link; i link della firma uguali a quello non si ripetono. */
const linked = (logo, html) => (logo?.href ? `<a href="${escapeHtml(logo.href)}" style="display:block;line-height:0;text-decoration:none;">${html}</a>` : html)
const otherLinks = (footer, logo) => (footer.links ?? []).filter((link) => !logo?.href || link.url !== logo.href)

/**
 * Firma di «Fine settembre»: nessun pannello, sul bianco della pagina. Un
 * filetto nero la stacca dal testo; il nome è un H3, il ruolo un H5, le
 * etichette dei recapiti sono H6 (maiuscolo spaziato), in colonna come prima.
 * I loghi stanno senza cornice: il fondo è già bianco.
 */
function renderFooterFine(footer, theme, logo) {
  const c = theme.color
  const st = blockStyles(theme)
  const sans = theme.font.sans
  const text = `font-family:${sans};font-size:${theme.size.small + 1}px;line-height:1.5;text-align:left;`
  const label = `font-family:${sans};font-size:${theme.size.h6}px;font-weight:700;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.graphite};`
  const linkStyle = `color:${c.ink};text-decoration:none;`

  const identity = []
  if (footer.name) identity.push(`<h3 style="${st.h3}margin:0;">${escapeHtml(footer.name)}</h3>`)
  if (footer.role) identity.push(`<h5 style="${st.h5}margin:${identity.length ? 4 : 0}px 0 0;">${escapeHtml(footer.role)}</h5>`)
  if (footer.org) identity.push(`<p style="margin:${identity.length ? 2 : 0}px 0 0;${text}color:${c.graphite};">${escapeHtml(footer.org)}</p>`)
  const who = identity.join('')

  let head = who
  if (logo) {
    const img = linked(logo, `<img src="${logo.src}" alt="${escapeHtml(logo.alt)}" width="${logo.width}" style="display:block;width:${logo.width}px;max-width:100%;height:auto;border:0;" />`)
    head =
      logo.placement === 'identity'
        ? img
        : logo.placement === 'side' && who
        ? table(
            `<tr><td width="${logo.width}" style="width:${logo.width}px;padding:0 16px 0 0;vertical-align:middle;line-height:0;">${img}</td><td style="vertical-align:middle;">${who}</td></tr>`,
          )
        : `<div style="margin:0 0 16px;line-height:0;">${img}</div>${who}`
  }

  const details = []
  const contactRows = (footer.contacts ?? []).map((contact, i) => {
    const value = contact.href
      ? `<a href="${escapeHtml(contact.href)}" style="${linkStyle}">${escapeHtml(contact.value)}</a>`
      : escapeHtml(contact.value)
    const top = i ? 4 : 0
    return `<tr><td style="padding:${top}px 16px 0 0;white-space:nowrap;vertical-align:baseline;${label}">${escapeHtml(contact.label)}</td><td style="padding:${top}px 0 0;vertical-align:baseline;${text}color:${c.ink};word-break:break-word;">${value}</td></tr>`
  })
  if (contactRows.length) details.push(table(contactRows.join('')))
  if (footer.address) details.push(`<p style="margin:${details.length ? 8 : 0}px 0 0;${text}color:${c.graphite};">${escapeHtml(footer.address)}</p>`)

  const linkParts = [
    ...otherLinks(footer, logo).map((link) => `<a href="${escapeHtml(link.url)}" style="${st.link}">${escapeHtml(link.label)}</a>`),
    ...(footer.social ?? []).map(
      (social) =>
        `<a href="${escapeHtml(social.url)}" style="${st.link}">${escapeHtml(social.label)}${social.handle ? ` ${escapeHtml(social.handle)}` : ''}</a>`,
    ),
  ]
  if (linkParts.length) details.push(`<p style="margin:${details.length ? 12 : 0}px 0 0;${text}color:${c.ink};">${linkParts.join(' · ')}</p>`)
  for (const note of footer.notes ?? []) {
    details.push(`<p style="margin:${details.length ? 12 : 0}px 0 0;font-family:${sans};font-size:${theme.size.h6}px;line-height:1.5;color:${c.graphite};text-align:left;">${escapeHtml(note)}</p>`)
  }

  const gap = head && details.length ? `<div style="height:16px;line-height:16px;font-size:1px;">&nbsp;</div>` : ''
  return `<div style="border-top:1px solid ${c.ink};padding:${theme.space.s5}px 0 0;text-align:left;">${head}${gap}${details.join('')}</div>`
}

/**
 * Footer in HTML: riquadro dedicato, tema scuro coerente con `[data-theme='ink']`.
 *
 * Impaginazione in due blocchi separati da un filetto: in alto chi scrive
 * (logo, nome, ruolo, contesto), sotto i recapiti. I recapiti stanno in una
 * tabella a due colonne — etichetta e valore — così i valori partono tutti
 * dalla stessa verticale anche con etichette di lunghezza diversa.
 *
 * @param {object|null} footer versione attiva della firma
 * @param {object} theme tema email
 * @param {{src: string, alt: string, width: number, padding: number, placement?: 'top'|'side', frame?: boolean}|null} logo logo già risolto
 */
export function renderFooterHtml(footer, theme, logo = null) {
  if (!footer) return ''
  if (isFineSettembre(theme)) return renderFooterFine(footer, theme, logo)
  const c = theme.color
  const sp = theme.space
  const sans = theme.font.sans
  const mono = theme.font.mono

  const labelStyle = `font-family:${mono};font-size:${theme.size.label}px;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.darkMuted};`
  const smallStyle = `font-family:${sans};font-size:${theme.size.small}px;line-height:1.5;`
  const linkStyle = `color:${c.darkAccent};text-decoration:none;`

  // ── Chi scrive ─────────────────────────────────────────────────────────────
  const identityRows = []
  if (footer.name) {
    identityRows.push(
      `<tr><td style="font-family:${sans};font-size:${theme.size.h3}px;line-height:1.2;font-weight:600;letter-spacing:-0.015em;color:${c.darkFg};">${escapeHtml(footer.name)}</td></tr>`,
    )
  }
  if (footer.role) {
    identityRows.push(
      `<tr><td style="padding:${identityRows.length ? 4 : 0}px 0 0;${smallStyle}line-height:1.4;color:${c.darkFg};">${escapeHtml(footer.role)}</td></tr>`,
    )
  }
  if (footer.org) {
    identityRows.push(
      `<tr><td style="padding:${identityRows.length ? 2 : 0}px 0 0;${smallStyle}line-height:1.45;color:${c.darkMuted};">${escapeHtml(footer.org)}</td></tr>`,
    )
  }
  const identity = identityRows.length ? table(identityRows.join(''), ' width="100%"') : ''

  // Il logo è incorporato come data URI: i client di posta bloccano le immagini
  // remote, e l'SVG non è supportato quasi da nessuno — per questo è un PNG.
  // Il logo NON si ritocca: i marchi istituzionali vanno riprodotti come sono.
  // Un logo pensato per fondo chiaro (`frame`, il caso normale) riceve un
  // riquadro chiaro suo, che fa da «carta»; uno nato per il fondo scuro, come
  // il monogramma AP, si appoggia direttamente sul pannello con un filo sottile.
  // `placement: 'side'` lo mette a sinistra del nome (marchi quadrati),
  // altrimenti sta sopra (marchi larghi, come quello di un ateneo).
  let head = identity
  if (logo) {
    const pad = logo.padding ?? 12
    const framed = logo.frame !== false
    const bare = `<img src="${logo.src}" alt="${escapeHtml(logo.alt)}" width="${logo.width}" style="display:block;width:${logo.width}px;max-width:100%;height:auto;border:0;${framed ? '' : `border:1px solid ${c.darkLine};border-radius:${theme.radius.r2};`}" />`
    const img = linked(logo, bare)
    const mark = framed
      ? table(
          `<tr><td style="background:${c.paper};border-radius:${theme.radius.r2};padding:${pad}px ${pad + 2}px;line-height:0;">${img}</td></tr>`,
        )
      : img

    head =
      logo.placement === 'identity'
        ? table(`<tr><td style="line-height:0;">${mark}</td></tr>`)
        : logo.placement === 'side' && identity
        ? table(
            `<tr><td width="${logo.width}" style="width:${logo.width}px;padding:0 ${sp.s4}px 0 0;vertical-align:middle;line-height:0;">${mark}</td><td style="vertical-align:middle;">${identity}</td></tr>`,
            ' width="100%"',
          )
        : table(
            `<tr><td style="padding:0 0 ${identity ? sp.s4 : 0}px;line-height:0;">${mark}</td></tr>${identity ? `<tr><td>${identity}</td></tr>` : ''}`,
            ' width="100%"',
          )
  }

  // ── Recapiti ───────────────────────────────────────────────────────────────
  const details = []

  const contactRows = (footer.contacts ?? []).map((contact, i) => {
    const value = contact.href
      ? `<a href="${escapeHtml(contact.href)}" style="${linkStyle}">${escapeHtml(contact.value)}</a>`
      : escapeHtml(contact.value)
    const top = i ? 6 : 0
    return `<tr><td style="padding:${top}px ${sp.s4}px 0 0;white-space:nowrap;vertical-align:baseline;${labelStyle}">${escapeHtml(contact.label)}</td><td style="padding:${top}px 0 0;vertical-align:baseline;${smallStyle}color:${c.darkFg};word-break:break-word;">${value}</td></tr>`
  })
  if (contactRows.length) details.push(`<tr><td>${table(contactRows.join(''))}</td></tr>`)

  if (footer.address) {
    details.push(
      `<tr><td style="padding:${details.length ? sp.s2 : 0}px 0 0;${smallStyle}color:${c.darkMuted};">${escapeHtml(footer.address)}</td></tr>`,
    )
  }

  const linkParts = [
    ...otherLinks(footer, logo).map(
      (link) => `<a href="${escapeHtml(link.url)}" style="${linkStyle}">${escapeHtml(link.label)}</a>`,
    ),
    ...(footer.social ?? []).map(
      (social) =>
        `<a href="${escapeHtml(social.url)}" style="${linkStyle}">${escapeHtml(social.label)}${social.handle ? ` ${escapeHtml(social.handle)}` : ''}</a>`,
    ),
  ]
  if (linkParts.length) {
    details.push(
      `<tr><td style="padding:${details.length ? sp.s3 : 0}px 0 0;${smallStyle}color:${c.darkMuted};">${linkParts.join(
        ` <span style="color:${c.darkLine};">·</span> `,
      )}</td></tr>`,
    )
  }

  for (const note of footer.notes ?? []) {
    details.push(
      `<tr><td style="padding:${details.length ? sp.s3 : 0}px 0 0;font-family:${mono};font-size:${theme.size.label}px;letter-spacing:0.04em;line-height:1.55;color:${c.darkMuted};">${escapeHtml(note)}</td></tr>`,
    )
  }

  // ── Montaggio: i due blocchi, con il filetto in mezzo ──────────────────────
  const rows = []
  if (head) rows.push(`<tr><td style="padding:0 0 ${details.length ? sp.s4 : 0}px;">${head}</td></tr>`)
  if (details.length) {
    const rule = head ? `padding:${sp.s4}px 0 0;border-top:1px solid ${c.darkLine};` : 'padding:0;'
    rows.push(`<tr><td style="${rule}">${table(details.join(''), ' width="100%"')}</td></tr>`)
  }

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${c.darkBg};border-radius:${theme.radius.r2};">
        <tr>
          <td style="padding:${sp.s5}px ${theme.layout.gutter}px;">
            ${table(rows.join(''), ' width="100%"')}
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
