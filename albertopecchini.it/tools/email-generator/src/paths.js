// Percorsi del progetto, risolti una sola volta a partire da questo file.
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

// tools/email-generator/src → tools/email-generator → tools → radice del sito
export const ROOT = path.resolve(here, '..', '..', '..')
// i dati del generatore (account, firme, email) stanno accanto al generatore
const DATI = path.resolve(here, '..')

export const paths = {
  root: ROOT,
  config: path.join(DATI, 'config'),
  senderProfiles: path.join(DATI, 'config', 'sender-profiles.json'),
  emailTheme: path.join(DATI, 'config', 'email-theme.json'),
  profiles: path.join(DATI, 'profiles'),
  footersJson: path.join(DATI, 'profiles', 'footers.json'),
  footersMd: path.join(DATI, 'profiles', 'footers.md'),
  emails: path.join(DATI, 'emails'),
  in: path.join(DATI, 'emails', 'in'),
  out: path.join(DATI, 'emails', 'out'),
  attachments: path.join(DATI, 'emails', 'attachments'),
  archive: path.join(DATI, 'emails', 'archive'),
  logs: path.join(DATI, 'emails', 'logs'),
  styleCss: path.join(ROOT, 'src', 'style.css'),
  stylesDir: path.join(ROOT, 'src', 'styles'),
  nodeModules: path.join(ROOT, 'node_modules'),
  template: path.join(DATI, 'EMAIL_INPUT_TEMPLATE.md'),
}

export const GENERATOR_VERSION = '1.0.0'
