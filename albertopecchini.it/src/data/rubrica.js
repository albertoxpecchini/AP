// ─────────────────────────────────────────────────────────────────────────────
//  RUBRICA — mittenti, firme, tema, toni e contatti del compositore email (/email/).
//
//  Tutto ciò che riguarda l'email viene dal generatore da riga di comando
//  (tools/email-generator): account da config/sender-profiles.json, firme da
//  profiles/footers.json, tema derivato da src/styles/tokens.css, logo e icone
//  già codificati in data URI. Una fonte sola: la pagina e il generatore
//  producono la stessa email. Qui si aggiungono solo presentazione, consigli
//  e contatti conosciuti.
// ─────────────────────────────────────────────────────────────────────────────

import { loadSenderProfiles } from '../../tools/email-generator/src/senders.js'
import { getFooter, resolveFooterLogo } from '../../tools/email-generator/src/footers.js'
import { renderFooterText } from '../../tools/email-generator/src/footer-html.js'
import { loadEmailTheme } from '../../tools/email-generator/src/theme.js'
import { iconDataUri } from '../../tools/email-generator/src/assets.js'
import { BUTTON_VARIANTS } from '../../tools/email-generator/src/markdown.js'
import { GENERATOR_VERSION } from '../../tools/email-generator/src/paths.js'
import { STILI, resolveStyle } from '../../tools/email-generator/src/stili.js'

// ── Account mittente ─────────────────────────────────────────────────────────
// Ordine e voce di ogni account: scuola, personale, società.

const KINDS = {
  gmail: {
    order: 0,
    kind: 'scuola',
    kindLabel: 'Scuola',
    webmail: 'gmail',
    intro: 'Sono Alberto Pecchini, studente al primo anno di Costruzioni e gestione del territorio (L-P01) all’Università di Modena e Reggio Emilia, matricola 223824.',
    tips: [
      'Nell’oggetto metti corso e matricola: «… — L-P01, matricola 223824». La segreteria smista a colpo d’occhio.',
      'Ai docenti si dà del Lei; ai colleghi del voi, con gli indirizzi in Ccn e senza «a presto».',
      'Alla prof.ssa Giacomoni si risponde a chiara@unirsm.sm, non all’indirizzo pubblico.',
      'Una richiesta per email: se sono due cose diverse, meglio due email.',
    ],
  },
  yahoo: {
    order: 1,
    kind: 'personale',
    kindLabel: 'Personale',
    webmail: 'yahoo',
    intro: 'Sono Alberto Pecchini.',
    tips: [
      'Tono libero, ma oggetto chiaro: chi legge decide in due secondi se aprire.',
      'Da qui partono le email a privati e conoscenti.',
    ],
  },
  // Proton è la casella ordinaria della società (firma Primo Pecchini); la PEC
  // cascinafontana@pec.it è un profilo a parte e qui non compare.
  proton: {
    order: 2,
    kind: 'societa',
    kindLabel: 'Società',
    webmail: 'proton',
    intro: 'Sono Primo Pecchini, della Società Agricola Cascina Fontana S.S.',
    tips: [
      'Ragione sociale sempre per esteso: Società Agricola Cascina Fontana S.S.',
      'Questa è la casella ordinaria: per le comunicazioni che devono avere valore legale si usa la PEC cascinafontana@pec.it.',
      'Lo stile di Primo è breve: «Bonjour Mme …», «ns», congedo «Cdt». Si ritocca la punteggiatura, non il tono.',
    ],
  },
}

export const senders = loadSenderProfiles()
  .profiles.filter((p) => KINDS[p.key])
  .map((p) => {
    const { order, ...kind } = KINDS[p.key]
    const footer = getFooter(p.footerId)
    return {
      key: p.key,
      label: p.label,
      provider: p.provider,
      email: p.email,
      footerId: p.footerId,
      style: resolveStyle(p.style),
      styleLabel: STILI[resolveStyle(p.style)].label,
      name: footer?.name || 'Alberto Pecchini',
      footer,
      logo: resolveFooterLogo(footer),
      signature: footer ? renderFooterText(footer) : p.email,
      ...kind,
      order,
    }
  })
  .sort((a, b) => a.order - b.order)

// ── Tema e immagini incorporate ──────────────────────────────────────────────
// Lo stesso tema del generatore (rigenerato se tokens.css è più recente) e le
// icone dei pulsanti «:::bottone», già in data URI come nelle email generate.

export const emailTheme = loadEmailTheme()

export const emailAssets = Object.fromEntries(
  Object.values(BUTTON_VARIANTS)
    .map((v) => v.icon)
    .filter(Boolean)
    .map((file) => [file, iconDataUri(file)]),
)

// ── Toni ─────────────────────────────────────────────────────────────────────
// Le stesse chiusure del generatore (tools/email-generator/src/compose.js).

export const tones = [
  { key: 'professionale', label: 'Professionale', greeting: 'Gentile', greetingPlain: 'Buongiorno,', closing: 'Cordiali saluti,', formal: true },
  { key: 'formale', label: 'Formale', greeting: 'Gentile', greetingPlain: 'Buongiorno,', closing: 'Cordiali saluti,', formal: true },
  { key: 'cordiale', label: 'Cordiale', greeting: 'Ciao', greetingPlain: 'Buongiorno,', closing: 'Un caro saluto,', formal: false },
  { key: 'informale', label: 'Informale', greeting: 'Ciao', greetingPlain: 'Ciao,', closing: 'A presto,', formal: false },
  { key: 'diretto', label: 'Diretto', greeting: 'Gentile', greetingPlain: 'Buongiorno,', closing: 'Grazie,', formal: true },
]

// ── Contatti conosciuti ──────────────────────────────────────────────────────
// `salutation` è il saluto già pronto quando il contatto è il primo destinatario.
// I gruppi: universita · lavoro · personale · me (i miei indirizzi).

export const contactGroups = {
  universita: 'Università',
  lavoro: 'Lavoro',
  personale: 'Personale',
  me: 'I miei indirizzi',
}

export const contacts = [
  {
    id: 'lanzoni',
    name: 'Prof. Luca Lanzoni',
    email: 'luca.lanzoni@unimore.it',
    role: 'Presidente del corso di laurea L-P01 · UNIMORE',
    group: 'universita',
    salutation: 'Gentile Prof. Lanzoni',
  },
  {
    id: 'ceccoli',
    name: 'Dott. Francesco Ceccoli',
    email: 'francesco.ceccoli@unirsm.sm',
    role: 'Tecnologo UNIRSM · Teams, aule e credenziali',
    group: 'universita',
    salutation: 'Gentile Dott. Ceccoli',
  },
  {
    id: 'giacomoni',
    name: 'Prof.ssa Chiara Giacomoni',
    email: 'chiara@unirsm.sm',
    role: 'Analisi matematica e geometria · UNIRSM',
    group: 'universita',
    salutation: 'Gentile Professoressa Giacomoni',
    note: 'Risponde da questo indirizzo; quello pubblico è c.giacomoni@unirsm.sm.',
  },
  {
    id: 'venturini',
    name: 'Prof.ssa Marta Venturini',
    email: 'm.venturini2@unirsm.sm',
    role: 'Docente UNIRSM',
    group: 'universita',
    salutation: 'Gentile Professoressa Venturini',
    note: 'Da aggiungere solo con un motivo preciso.',
  },
  {
    id: 'segreteria-ingegneria',
    name: 'Segreteria Studenti Ingegneria',
    email: 'segrstud.ingegneria@unimore.it',
    role: 'Segreteria studenti · Dipartimento di Ingegneria «Enzo Ferrari»',
    group: 'universita',
    salutation: 'Spett.le Segreteria Studenti',
  },
  {
    id: 'me-unimore',
    name: 'Alberto Pecchini — ateneo',
    email: '398893@studenti.unimore.it',
    role: 'Il mio indirizzo di ateneo: in Ccn per tenere copia',
    group: 'me',
  },
  {
    id: 'me-yahoo',
    name: 'Alberto Pecchini — personale',
    email: 'pzkko@yahoo.com',
    role: 'Il mio indirizzo personale',
    group: 'me',
  },
  {
    id: 'me-proton',
    name: 'Cascina Fontana — società',
    email: 'pecchini@protonmail.com',
    role: 'La casella della società (firma Primo Pecchini)',
    group: 'me',
  },
]

/** Tutto ciò che la pagina passa al browser, in un solo oggetto. */
export const emailData = {
  senders,
  tones,
  contacts,
  contactGroups,
  theme: emailTheme,
  assets: emailAssets,
  generatorVersion: GENERATOR_VERSION,
}
