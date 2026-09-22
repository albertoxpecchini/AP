// Percorsi del progetto, risolti una sola volta a partire da questo file.
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

// tools/email-generator/src → tools/email-generator → tools → radice del sito
export const ROOT = path.resolve(here, '..', '..', '..')

export const paths = {
  root: ROOT,
  config: path.join(ROOT, 'config'),
  senderProfiles: path.join(ROOT, 'config', 'sender-profiles.json'),
  emailTheme: path.join(ROOT, 'config', 'email-theme.json'),
  profiles: path.join(ROOT, 'profiles'),
  footersJson: path.join(ROOT, 'profiles', 'footers.json'),
  footersMd: path.join(ROOT, 'profiles', 'footers.md'),
  emails: path.join(ROOT, 'emails'),
  in: path.join(ROOT, 'emails', 'in'),
  out: path.join(ROOT, 'emails', 'out'),
  attachments: path.join(ROOT, 'emails', 'attachments'),
  archive: path.join(ROOT, 'emails', 'archive'),
  logs: path.join(ROOT, 'emails', 'logs'),
  styleCss: path.join(ROOT, 'src', 'style.css'),
  stylesDir: path.join(ROOT, 'src', 'styles'),
  nodeModules: path.join(ROOT, 'node_modules'),
  template: path.join(ROOT, 'EMAIL_INPUT_TEMPLATE.md'),
}

export const GENERATOR_VERSION = '1.0.0'
