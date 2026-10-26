// Informativa privacy e avviso di riservatezza: chiudono ogni email, sotto la
// firma, in tutti gli stili. Modulo puro, come footer-html.js: lo stesso codice
// gira nel generatore da riga di comando e nel compositore in pagina.
//
// Il titolare è quello della casella che scrive (`privacy.holder` in
// config/sender-profiles.json): Alberto per le caselle personali, la società
// per quelle di Cascina Fontana. Le richieste vanno all'indirizzo della casella
// stessa, salvo un `privacy.email` diverso.
//
// Il corpo è quello «n. 2» dei client di posta (`<font size="2">`, 13px), fisso
// in tutti gli stili; i titoli restano in minuscolo, senza il maiuscolo
// spaziato delle etichette H6.
import { escapeHtml } from './util.js'

const SIZE = 13

/** Titolare e indirizzo per le richieste; null se la casella non ne ha uno. */
export function privacyOf(profile) {
  const holder = profile?.privacy?.holder
  return holder ? { holder, email: profile.privacy.email || profile.email } : null
}

function sections({ holder, email }) {
  return [
    {
      title: 'Informativa Privacy',
      text: `«I vostri dati di contatto sono trattati e tutelati da ${holder} nel rispetto della normativa vigente sulla protezione dei dati personali (Reg. UE 2016/679). Per richiedere informazioni, variazioni o la cancellazione dei vostri dati potete scrivere a ${email}.»`,
    },
    {
      title: 'Avviso di Riservatezza',
      text: '«Il contenuto di questa e-mail e degli eventuali allegati, è strettamente confidenziale e destinato alla/e persona/e a cui è indirizzato. Se avete ricevuto per errore questa e-mail, vi preghiamo di segnalarcelo immediatamente e di cancellarla dal vostro computer. È fatto divieto di copiare e divulgare il contenuto di questa e-mail. Ogni utilizzo abusivo delle informazioni qui contenute da parte di persone terze o comunque non indicate nella presente e-mail, potrà essere perseguito ai sensi di legge.»',
    },
  ]
}

/** I paragrafi dell'informativa, senza contenitore: il filetto lo mette ciascun impianto. */
export function renderInformativaHtml(theme, privacy) {
  if (!privacy) return ''
  const c = theme.color
  const base = `font-family:${theme.font.sans};font-size:${SIZE}px;line-height:1.5;color:${c.graphite};text-align:left;`
  const address = escapeHtml(privacy.email)
  const mail = `<a href="mailto:${address}" style="color:${c.graphite};text-decoration:underline;">${address}</a>`
  return sections(privacy)
    .map(
      ({ title, text }, i) =>
        `<p style="margin:${i ? 12 : 0}px 0 0;${base}font-weight:700;">${escapeHtml(title)}</p>` +
        `<p style="margin:2px 0 0;${base}">${escapeHtml(text).replace(address, mail)}</p>`,
    )
    .join('')
}

/** L'informativa in testo semplice, per `email.txt`. */
export function renderInformativaText(privacy) {
  if (!privacy) return ''
  return sections(privacy)
    .map(({ title, text }) => `${title}\n${text}`)
    .join('\n\n')
}
