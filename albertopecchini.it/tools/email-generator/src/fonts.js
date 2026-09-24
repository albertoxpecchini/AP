// Incorporamento del carattere nell'email.
//
// Il sito usa Archivo Variable ospitato localmente (@fontsource). Qui il file
// woff2 viene letto e convertito in data URI, così l'HTML non dipende dalla rete
// né da Google Fonts. Nessun client è obbligato a onorarlo: la catena di
// fallback del tema garantisce una resa dignitosa anche quando viene ignorato.
//
// Nota di compatibilità: Outlook su Windows (motore Word) e Gmail scartano i
// @font-face; Apple Mail e i client basati su WebKit li applicano. Il peso
// aggiunto conta: oltre ~102 KB Gmail tronca il messaggio, perciò si usa il
// sottoinsieme `latin` a peso variabile (il più leggero che copra l'italiano).
import fs from 'node:fs'
import path from 'node:path'
import { paths } from './paths.js'
import { fontFaceCss } from './font-css.js'

// Sottoinsieme scelto: solo latin, asse del peso. ~32 KB → ~43 KB in base64.
const ARCHIVO_WOFF2 = path.join(
  paths.nodeModules,
  '@fontsource-variable',
  'archivo',
  'files',
  'archivo-latin-wght-normal.woff2',
)

/**
 * @returns {{available: boolean, css: string, bytes: number, base64Bytes: number, file: string|null, note: string}}
 */
export function buildEmbeddedFontCss({ embed = true } = {}) {
  if (!embed) {
    return {
      available: false,
      css: '',
      bytes: 0,
      base64Bytes: 0,
      file: null,
      note: 'Incorporamento disattivato: l’email usa solo la catena di fallback.',
    }
  }

  if (!fs.existsSync(ARCHIVO_WOFF2)) {
    return {
      available: false,
      css: '',
      bytes: 0,
      base64Bytes: 0,
      file: null,
      note: `Font non trovato in ${path.relative(paths.root, ARCHIVO_WOFF2)} — eseguire «npm install». L’email usa la catena di fallback.`,
    }
  }

  const buffer = fs.readFileSync(ARCHIVO_WOFF2)
  const base64 = buffer.toString('base64')

  const css = fontFaceCss(base64)

  return {
    available: true,
    css,
    bytes: buffer.length,
    base64Bytes: base64.length,
    file: path.relative(paths.root, ARCHIVO_WOFF2).replace(/\\/g, '/'),
    note: 'Archivo Variable (sottoinsieme latin, asse del peso) incorporato in base64.',
  }
}
