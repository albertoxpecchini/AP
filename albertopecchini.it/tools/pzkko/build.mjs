// Comando di build su Vercel (vercel.json → buildCommand). Il progetto «pzkko» ha
// ancora Root Directory = albertopecchini.it (l'MCP non può cambiarla): qui, se la
// build gira per pzkko.it, l'output è la cartella pzkko/ copiata così com'è in
// dist/; in tutti gli altri casi è la build normale del sito serio (npm run build).
// Quando la Root Directory del progetto sarà albertopecchini.it/pzkko, questo
// file non serve più.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const env = process.env
const pzkko =
  env.SITE === 'pzk' ||
  (env.VERCEL_PROJECT_PRODUCTION_URL || '').endsWith('pzkko.it') ||
  env.VERCEL_PROJECT_ID === 'prj_XBqwaDsSTn1kVkHwa1LkU4gJlMof'

if (pzkko) {
  rmSync('dist', { recursive: true, force: true })
  mkdirSync('dist')
  cpSync('pzkko', 'dist', { recursive: true })
  console.log('pzkko.it: copiata la cartella pzkko/ in dist/, nessuna build')
} else {
  const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
  process.exit(r.status ?? 1)
}
