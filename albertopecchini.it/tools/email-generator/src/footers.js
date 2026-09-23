// Libreria firme: lettura, apprendimento versionato e resa HTML.
//
// «Imparare» una firma qui significa scrivere una nuova versione in
// profiles/footers.json. Nessuna versione viene sovrascritta in silenzio:
//   KEEP_EXISTING  la firma nel file di input viene ignorata (comportamento base)
//   ADD_VERSION    si accoda una versione e diventa quella corrente
//   REPLACE        idem, ma il report dichiara la sostituzione esplicita
// Le versioni precedenti restano nel file e possono essere ripristinate a mano.
import fs from 'node:fs'
import path from 'node:path'
import { paths } from './paths.js'
import { escapeHtml } from './util.js'

export function loadFooters() {
  return JSON.parse(fs.readFileSync(paths.footersJson, 'utf8'))
}

export function saveFooters(data) {
  fs.writeFileSync(paths.footersJson, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** Versione attiva di un profilo. */
export function getFooter(footerId, data = loadFooters()) {
  const entry = data.footers?.[footerId]
  if (!entry) return null
  const version = entry.versions?.find((v) => v.id === entry.current) ?? entry.versions?.at(-1)
  return version ?? null
}

/**
 * Interpreta il blocco «FOOTER DA IMPARARE» come firma strutturata.
 * Si riconoscono le righe con etichetta (`Email: …`, `Telefono: …`, URL);
 * le prime righe senza etichetta diventano nome, ruolo e organizzazione.
 * Nessun dato viene inventato: ciò che non è scritto resta vuoto.
 */
export function parseFooterText(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (!lines.length) return null

  const footer = {
    heading: '',
    name: '',
    role: '',
    org: '',
    contacts: [],
    address: '',
    links: [],
    social: [],
    notes: [],
  }

  const plain = []

  for (const line of lines) {
    const labelled = /^([A-Za-zÀ-ÿ ]{3,20})\s*:\s*(.+)$/.exec(line)
    const value = labelled ? labelled[2].trim() : line
    const label = labelled ? labelled[1].trim().toLowerCase() : ''

    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(value)) {
      footer.contacts.push({ type: 'email', label: 'Email', value, href: `mailto:${value}` })
      continue
    }
    if (/^\+?[\d\s().-]{7,}$/.test(value) && /tel|telefono|cell|mobile|phone/.test(label || 'tel')) {
      footer.contacts.push({ type: 'phone', label: 'Telefono', value, href: `tel:${value.replace(/[^\d+]/g, '')}` })
      continue
    }
    if (/^(https?:\/\/|www\.)/i.test(value)) {
      const url = value.startsWith('http') ? value : `https://${value}`
      footer.links.push({ label: value.replace(/^https?:\/\//, '').replace(/\/$/, ''), url })
      continue
    }
    if (/indirizzo|via |viale |piazza |corso /i.test(label || value)) {
      footer.address = value
      continue
    }
    if (label && /nota|note/.test(label)) {
      footer.notes.push(value)
      continue
    }
    plain.push(value)
  }

  footer.name = plain[0] ?? ''
  footer.heading = footer.name
  footer.role = plain[1] ?? ''
  footer.org = plain.slice(2).join(' · ')

  return footer
}

/**
 * Due firme hanno lo stesso contenuto?
 * Si confrontano solo i campi della firma, non id, data e provenienza.
 */
function sameFooter(a, b) {
  const shape = (footer) =>
    JSON.stringify({
      name: footer.name ?? '',
      role: footer.role ?? '',
      org: footer.org ?? '',
      address: footer.address ?? '',
      contacts: (footer.contacts ?? []).map((c) => [c.type, c.label, c.value]),
      links: (footer.links ?? []).map((l) => [l.label, l.url]),
      social: (footer.social ?? []).map((s) => [s.label, s.url, s.handle ?? '']),
      notes: footer.notes ?? [],
    })
  return shape(a) === shape(b)
}

/**
 * Applica l'azione richiesta sulla firma di un profilo.
 * @returns {{changed: boolean, action: string, versionId: string|null, message: string}}
 */
export function learnFooter({ footerId, text, action }) {
  const normalized = (action ?? 'KEEP_EXISTING').toUpperCase()

  if (!text || !text.trim()) {
    return { changed: false, action: normalized, versionId: null, message: '' }
  }

  if (normalized === 'KEEP_EXISTING') {
    return {
      changed: false,
      action: normalized,
      versionId: null,
      message:
        'Nel file di input è presente una firma, ma «Azione footer» è KEEP_EXISTING: la firma in archivio resta invariata. Usare ADD_VERSION o REPLACE per memorizzarla.',
    }
  }

  if (normalized !== 'ADD_VERSION' && normalized !== 'REPLACE') {
    return {
      changed: false,
      action: normalized,
      versionId: null,
      message: `Azione footer «${action}» non riconosciuta: ammessi KEEP_EXISTING, ADD_VERSION, REPLACE. La firma in archivio resta invariata.`,
    }
  }

  const parsed = parseFooterText(text)
  if (!parsed) {
    return { changed: false, action: normalized, versionId: null, message: 'Blocco firma vuoto: niente da memorizzare.' }
  }

  const data = loadFooters()
  data.footers[footerId] ??= { current: null, versions: [] }
  const entry = data.footers[footerId]

  // Rigenerare due volte la stessa email non deve accumulare versioni identiche:
  // se la firma coincide con una già in archivio, si riusa quella.
  const sameAs = entry.versions.find((version) => sameFooter(version, parsed))
  if (sameAs) {
    const wasCurrent = entry.current === sameAs.id
    if (!wasCurrent) {
      entry.current = sameAs.id
      saveFooters(data)
      writeFootersMarkdown(data)
    }
    return {
      changed: !wasCurrent,
      action: normalized,
      versionId: sameAs.id,
      message: wasCurrent
        ? `Firma «${footerId}»: identica alla versione ${sameAs.id} già attiva, nessuna nuova versione creata.`
        : `Firma «${footerId}»: identica alla versione ${sameAs.id} in archivio, che torna attiva.`,
    }
  }

  const nextNumber = entry.versions.length + 1
  const versionId = `v${nextNumber}`
  const previous = entry.current

  entry.versions.push({
    id: versionId,
    createdAt: new Date().toISOString().slice(0, 10),
    source: normalized === 'REPLACE' ? 'replace' : 'add_version',
    replaces: normalized === 'REPLACE' ? previous : null,
    ...parsed,
  })
  entry.current = versionId

  saveFooters(data)
  writeFootersMarkdown(data)

  const message =
    normalized === 'REPLACE'
      ? `Firma «${footerId}» sostituita: nuova versione ${versionId} (la ${previous ?? '—'} resta archiviata nel file).`
      : `Firma «${footerId}»: memorizzata la versione ${versionId}, ora attiva (la ${previous ?? '—'} resta archiviata).`

  return { changed: true, action: normalized, versionId, message }
}

/** Specchio leggibile dell'archivio firme. */
export function writeFootersMarkdown(data = loadFooters()) {
  const lines = [
    '# Firme memorizzate',
    '',
    '> File generato da `profiles/footers.json`. Non modificarlo a mano:',
    '> le firme si aggiornano compilando «FOOTER DA IMPARARE» nel file di input',
    '> con `Azione footer: ADD_VERSION` (o `REPLACE`).',
    '',
  ]

  for (const [id, entry] of Object.entries(data.footers ?? {})) {
    lines.push(`## Profilo \`${id}\``, '', `Versione attiva: **${entry.current ?? '—'}**`, '')
    for (const version of entry.versions ?? []) {
      const active = version.id === entry.current ? ' — attiva' : ''
      lines.push(`### ${version.id} (${version.createdAt})${active}`, '')
      if (version.name) lines.push(`- Nome: ${version.name}`)
      if (version.role) lines.push(`- Ruolo: ${version.role}`)
      if (version.org) lines.push(`- Contesto: ${version.org}`)
      for (const contact of version.contacts ?? []) lines.push(`- ${contact.label}: ${contact.value}`)
      if (version.address) lines.push(`- Indirizzo: ${version.address}`)
      for (const link of version.links ?? []) lines.push(`- Link: ${link.label} (${link.url})`)
      for (const social of version.social ?? []) lines.push(`- ${social.label}: ${social.handle ?? social.url}`)
      for (const note of version.notes ?? []) lines.push(`- Nota: ${note}`)
      lines.push('')
    }
  }

  fs.writeFileSync(paths.footersMd, `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`, 'utf8')
}

/**
 * Footer in HTML: riquadro dedicato, tema scuro coerente con `[data-theme='ink']`.
 */
/**
 * Logo della firma → data URI.
 * `footer.logo` è { file, alt, width }: `file` è relativo alla radice del sito.
 * Un file assente non è un errore: la firma esce semplicemente senza logo.
 */
export function resolveFooterLogo(footer) {
  const logo = footer?.logo
  if (!logo?.file) return null

  const file = path.resolve(paths.root, logo.file)
  if (!fs.existsSync(file)) return null

  const ext = path.extname(file).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : null
  // Niente SVG: Gmail, Outlook e Apple Mail non lo mostrano.
  if (!mime) return null

  const base64 = fs.readFileSync(file).toString('base64')
  return {
    src: `data:${mime};base64,${base64}`,
    alt: logo.alt ?? '',
    width: Number(logo.width) || 180,
    padding: Number(logo.padding) || 12,
    bytes: base64.length,
  }
}

export function renderFooterHtml(footer, theme) {
  if (!footer) return ''
  const c = theme.color
  const sp = theme.space
  const sans = theme.font.sans
  const mono = theme.font.mono

  const labelStyle = `font-family:${mono};font-size:${theme.size.label}px;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.darkMuted};`
  const linkStyle = `color:${c.darkAccent};text-decoration:none;`
  const rows = []

  // Logo dell'ente, sopra il nome. Si incorpora come data URI: i client di
  // posta bloccano le immagini remote, e l'SVG non è supportato quasi da
  // nessuno — per questo il file di riferimento è un PNG.
  // Il logo NON si ritocca: i marchi istituzionali vanno riprodotti come sono.
  // Poiché il pannello della firma è scuro e il logo è pensato per fondo
  // chiaro, si dà al logo un riquadro chiaro suo, che fa da «carta».
  const logo = resolveFooterLogo(footer)
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
