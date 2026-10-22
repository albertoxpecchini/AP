#!/usr/bin/env node
// Le firme della petizione di pzkko.it («pzkko.it è un bel sito?», pzkko/api/firme.mjs): elencarle e, se ce n'è una che
// non va, cancellarla. Chiede al sito vero (o al server di prova con --locale, npm run dev:pzkko).
//
//   node tools/pzkko/firme.mjs                  le ultime firme: id, data e ora di Mantova, penna, nome
//   node tools/pzkko/firme.mjs via <id>         cancella la firma <id>
//
// Per cancellare serve FIRME_ADMIN_KEY: la stessa nel progetto pzkko su Vercel (Settings › Environment Variables) e qui,
// nell'ambiente o in albertopecchini.it/.env.local (escluso da Git).
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
try { process.loadEnvFile(join(QUI, '../../.env.local')) } catch {}
const BASE = process.argv.includes('--locale') ? 'http://localhost:5182' : 'https://www.pzkko.it'
const [cmd, id] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const PENNE = ['blu', 'nera', 'rossa']
const quando = (t) => new Date(t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const chiedi = async (init) => {
  const r = await fetch(`${BASE}/api/firme/`, init)
  const d = await r.json().catch(() => ({}))
  if (d.offline) { console.error('✗ la petizione è offline: manca lo store Blob nel progetto pzkko (vedi pzkko/README.md, «Vercel»)'); process.exit(1) }
  return { r, d }
}

if (cmd === 'via') {
  if (!id) { console.error('uso: node tools/pzkko/firme.mjs via <id>'); process.exit(1) }
  const key = process.env.FIRME_ADMIN_KEY
  if (!key) { console.error('✗ manca FIRME_ADMIN_KEY (nell\'ambiente o in .env.local)'); process.exit(1) }
  const { r, d } = await chiedi({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ a: 'via', key, id }) })
  if (!r.ok) { console.error(`✗ ${d.errore || r.status}`); process.exit(1) }
  console.log(`✓ cancellata ${id}: restano ${d.totale} firme`)
} else {
  const { d } = await chiedi()
  console.log(`${d.totale} firme${d.totale > d.firme.length ? ` (le ultime ${d.firme.length})` : ''} su ${BASE}`)
  for (const f of d.firme) console.log(`${f.id.padEnd(14)} ${quando(f.t)}  ${(PENNE[f.c] ?? '?').padEnd(5)}  ${f.n}`)
}
