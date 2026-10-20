// Il browser per gli strumenti di pzkko che aprono la pagina (disponi.mjs, scena/cattura.mjs, scena/foto.mjs):
// --chrome=<exe> o la variabile CHROME; se no il Chromium di Playwright, se no Edge (c'è su ogni Windows).
// E puppeteer-core, che sta in tools/catture (npm ci dentro quella cartella).
import { existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))

export function puppeteer() {
  try { return createRequire(join(QUI, '../catture/package.json'))('puppeteer-core') }
  catch { throw new Error('manca puppeteer-core: npm ci dentro tools/catture') }
}

export function eseguibile() {
  const chiesto = (process.argv.find((a) => a.startsWith('--chrome=')) ?? '').slice(9) || process.env.CHROME
  if (chiesto) return chiesto
  // il Chromium di Playwright, qualunque versione ci sia
  const pw = join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
  const playwright = existsSync(pw) ? readdirSync(pw).filter((d) => d.startsWith('chromium-')).sort().reverse().map((d) => join(pw, d, 'chrome-win64/chrome.exe')) : []
  const exe = [...playwright, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => existsSync(p))
  if (!exe) throw new Error('non trovo un browser: --chrome=<percorso di chrome.exe o msedge.exe>, o la variabile CHROME')
  return exe
}
