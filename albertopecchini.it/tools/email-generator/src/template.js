// Motore del modello HTML dell'email.
//
// Impianto a tabelle annidate, l'unico che Outlook (motore Word) compone in modo
// prevedibile. Gli stili sono inline sugli elementi; il blocco <style> serve solo
// per le media query e il tema scuro, che inline non si possono esprimere.
//
// Il linguaggio visivo viene dal sito — carta/inchiostro/minio, etichette in
// monospaziato maiuscolo, righello a tacche, filetti sottili — ma il layout è
// pensato per la posta: una colonna da 600px, nessuna unità viewport, niente
// posizionamento assoluto, niente JavaScript.
import { escapeHtml } from './util.js'
import { renderFooterHtml } from './footers.js'

// GIF trasparente di 1px: Outlook comprime le celle prive di contenuto, e un
// `&nbsp;` imporrebbe l'altezza di una riga di testo.
const PIXEL_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * Filetto di separazione, ripreso da `.rule` del sito.
 *
 * Il sito ha anche un righello a tacche (`.rule--ticks`), costruito con
 * gradienti ripetuti: nella posta i gradienti non sono affidabili e l'unica
 * alternativa — una tabella di celle da 1px — viene deformata dai motori di
 * Outlook e Gmail, che arrotondano le larghezze frazionarie. Meglio il filetto
 * pieno, che appartiene allo stesso linguaggio e si vede uguale ovunque.
 */
function rulerHtml(theme) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr><td style="height:1px;background:${theme.color.lineStrong};font-size:1px;line-height:1px;"><img src="${PIXEL_GIF}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" /></td></tr>
          </table>`
}

/**
 * Compone l'HTML completo dell'email.
 */
export function renderEmailHtml({
  subject,
  preheader,
  eyebrow,
  title,
  subtitle,
  bodyHtml,
  footer,
  attachments = [],
  links = [],
  theme,
  fontCss = '',
  dateLabel = '',
}) {
  const c = theme.color
  const sp = theme.space
  const sans = theme.font.sans
  const mono = theme.font.mono
  const width = theme.layout.width
  const gutter = theme.layout.gutter

  const labelStyle = `font-family:${mono};font-size:${theme.size.label}px;letter-spacing:${theme.tracking.label};text-transform:uppercase;color:${c.graphite};`

  const headerRows = []

  if (eyebrow || dateLabel) {
    headerRows.push(`<tr>
      <td style="padding:0 0 ${sp.s5}px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="${labelStyle}">${escapeHtml(eyebrow ?? '')}</td>
            <td align="right" style="${labelStyle}">${escapeHtml(dateLabel ?? '')}</td>
          </tr>
        </table>
      </td>
    </tr>`)
  }

  if (title) {
    headerRows.push(`<tr>
      <td style="padding:0 0 ${subtitle ? sp.s3 : sp.s5}px;font-family:${sans};font-size:${theme.size.h1}px;line-height:1.06;font-weight:600;letter-spacing:${theme.tracking.display};color:${c.ink};">${escapeHtml(title)}</td>
    </tr>`)
  }

  if (subtitle) {
    headerRows.push(`<tr>
      <td style="padding:0 0 ${sp.s5}px;font-family:${sans};font-size:${theme.size.lead}px;line-height:1.45;color:${c.graphite};">${escapeHtml(subtitle)}</td>
    </tr>`)
  }

  const headerBlock = headerRows.length
    ? `<tr><td style="padding:${sp.s7}px ${gutter}px 0;">
         <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${headerRows.join('')}</table>
       </td></tr>
       <tr><td style="padding:0 ${gutter}px ${sp.s5}px;">${rulerHtml(theme)}</td></tr>`
    : ''

  // Allegati: elencati nell'email solo se dichiarati, mai dedotti.
  const attachmentRows = attachments
    .map(
      (file) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid ${c.line};font-family:${sans};font-size:${theme.size.small}px;color:${c.ink2};">
            ${escapeHtml(file.name)}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid ${c.line};font-family:${mono};font-size:${theme.size.label}px;letter-spacing:0.04em;text-transform:uppercase;color:${c.graphite};">
            ${escapeHtml(file.type)}
          </td>
        </tr>`,
    )
    .join('')

  const attachmentBlock = attachments.length
    ? `<tr><td style="padding:0 ${gutter}px ${sp.s5}px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${c.paper2};border-radius:${theme.radius.r2};">
          <tr><td style="padding:${sp.s4}px ${sp.s4}px ${sp.s2}px;">
            <div style="${labelStyle}margin-bottom:6px;">${attachments.length === 1 ? 'Allegato' : 'Allegati'}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${attachmentRows}</table>
          </td></tr>
        </table>
      </td></tr>`
    : ''

  const linkItems = links
    .map(
      (link) =>
        `<tr><td style="padding:4px 0;font-family:${sans};font-size:${theme.size.small}px;line-height:1.5;">
          <a href="${escapeHtml(link)}" style="color:${c.accentDeep};text-decoration:underline;word-break:break-all;">${escapeHtml(link)}</a>
        </td></tr>`,
    )
    .join('')

  const linkBlock = links.length
    ? `<tr><td style="padding:0 ${gutter}px ${sp.s5}px;">
        <div style="${labelStyle}margin-bottom:6px;">Collegamenti</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${linkItems}</table>
      </td></tr>`
    : ''

  const footerHtml = renderFooterHtml(footer, theme)
  const footerBlock = footerHtml
    ? `<tr><td style="padding:${sp.s5}px ${gutter}px ${sp.s6}px;">${footerHtml}</td></tr>`
    : ''

  // Il preheader è l'anteprima nella lista dei messaggi: presente nel sorgente,
  // invisibile all'apertura.
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${c.paper};opacity:0;">${escapeHtml(preheader)}&#8203;${'&#847;&zwnj;&nbsp;&#8199;&shy;'.repeat(40)}</div>`
    : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="it" xml:lang="it">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <style type="text/css">
    ${fontCss}

    /* Reset dei client */
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    table { border-collapse:collapse !important; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { text-decoration:underline; }

    /* Outlook ignora i web font: gli si impone la sostituzione di sistema */
    @media screen {
      .ap-sans { font-family: ${sans} !important; }
    }

    /* Mobile */
    @media only screen and (max-width: ${width - 1}px) {
      .ap-wrap { width:100% !important; }
      .ap-pad { padding-left:20px !important; padding-right:20px !important; }
      .ap-title { font-size:${Math.round(theme.size.h1 * 0.78)}px !important; }
      .ap-h2 { font-size:${Math.round(theme.size.h2 * 0.82)}px !important; }
      .ap-stack { display:block !important; width:100% !important; }
    }

    /* Tema scuro dei client: il corpo resta su carta, il contrasto è garantito */
    @media (prefers-color-scheme: dark) {
      .ap-body, .ap-card { background:${c.paper} !important; }
    }
  </style>
</head>
<body class="ap-body" style="margin:0;padding:0;background:${c.paper3};">
  ${preheaderHtml}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${c.paper3};">
    <tr>
      <td align="center" style="padding:${sp.s5}px ${sp.s3}px;">
        <table role="presentation" class="ap-wrap ap-card" cellpadding="0" cellspacing="0" border="0" width="${width}" style="width:${width}px;max-width:${width}px;background:${c.paper};border:1px solid ${c.line};border-radius:${theme.radius.r2};">
          ${headerBlock}
          <tr>
            <td class="ap-pad" style="padding:${headerBlock ? 0 : sp.s7}px ${gutter}px ${sp.s5}px;">
              ${bodyHtml}
            </td>
          </tr>
          ${attachmentBlock}
          ${linkBlock}
          ${footerBlock}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
