// Immagini incorporate nell'email (icone dei pulsanti) → data URI.
//
// Modulo con accesso ai file, separato da markdown.js così che il renderer resti
// puro e possa girare anche nel browser (compositore in pagina), dove le stesse
// immagini arrivano già codificate dal template.
import fs from 'node:fs'
import path from 'node:path'
import { paths } from './paths.js'

const iconCache = new Map()

/** Icona del pulsante → data URI, come il logo della firma. Un file assente dà stringa vuota. */
export function iconDataUri(file) {
  if (!file) return ''
  if (!iconCache.has(file)) {
    const full = path.resolve(paths.root, file)
    iconCache.set(file, fs.existsSync(full) ? `data:image/png;base64,${fs.readFileSync(full).toString('base64')}` : '')
  }
  return iconCache.get(file)
}
