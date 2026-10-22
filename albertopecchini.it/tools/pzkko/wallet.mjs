#!/usr/bin/env node
// I conti del wallet dei $pzk di pzkko.it (pzkko/api/wallet.mjs), da riga di comando, con la chiave di amministrazione
// (PZKKO_ADMIN_KEY o FIRME_ADMIN_KEY, nell'ambiente o in albertopecchini.it/.env.local: la stessa del progetto Vercel).
//
//   node tools/pzkko/wallet.mjs                      elenca i conti (nome, indirizzo, $pzk, EUR€, nato quando)
//   node tools/pzkko/wallet.mjs via <nome>           cancella un conto
//   node tools/pzkko/wallet.mjs crea <nome> <pin>    crea un conto riservato (es. «pzkko», che nasce come pzk398893)
//   node tools/pzkko/wallet.mjs borsa                il cambio di adesso, le variazioni e i fattori
//   --locale                                         il server di npm run dev:pzkko (http://localhost:5182) invece di pzkko.it
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
try { process.loadEnvFile(join(ROOT, '.env.local')) } catch {}
const KEY = process.env.PZKKO_ADMIN_KEY || process.env.FIRME_ADMIN_KEY
const locale = process.argv.includes('--locale')
const BASE = locale ? 'http://localhost:5182' : 'https://www.pzkko.it'
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const [cmd, nome, pin] = args

const post = async (body) => {
  const r = await fetch(`${BASE}/api/wallet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}
const quando = (t) => new Date(t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

if (cmd === 'borsa') {
  const d = await (await fetch(`${BASE}/api/borsa?da=24h`)).json()
  if (!d.ok) { console.error(d.errore || d); process.exit(1) }
  const pc = (v) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)} %`)
  console.log(`1 $pzk = ${d.tasso.toFixed(4)} €  (1 € = ${d.inverso.toFixed(3)} $pzk)  nata il ${quando(d.nata)}`)
  console.log(`1 h ${pc(d.var1h)} · 24 h ${pc(d.var24)} · 7 g ${pc(d.var7g)} · 30 g ${pc(d.var30g)}`)
  console.log(`fattori: ${JSON.stringify(d.fattori)} → deriva ${pc(d.deriva)} al giorno; umore di oggi ${pc(d.umore?.deriva)}${d.umore?.ecc ? ' (eccezione!)' : ''}`)
  console.log(`capitalizzazione: ${d.cap.pzk} $pzk (${d.cap.conti} conti), ${d.cap.eur} EUR€ parcheggiati; ${d.punti.length} punti nelle ultime 24 ore`)
  process.exit(0)
}
if (!KEY) { console.error('manca PZKKO_ADMIN_KEY (o FIRME_ADMIN_KEY): nel progetto Vercel e in albertopecchini.it/.env.local'); process.exit(1) }
if (cmd === 'via') {
  if (!nome) { console.error('uso: via <nome>'); process.exit(1) }
  const r = await post({ a: 'via', key: KEY, nome })
  console.log(r.ok ? `✓ ${nome} cancellato` : `✗ ${r.errore}`); process.exit(r.ok ? 0 : 1)
}
if (cmd === 'crea') {
  if (!nome || !/^\d{4}$/.test(pin ?? '')) { console.error('uso: crea <nome> <pin di quattro cifre>'); process.exit(1) }
  const r = await post({ a: 'crea', key: KEY, nome, pin })
  console.log(r.ok ? `✓ ${r.conto.nome}: ${r.conto.ind}, ${r.conto.pzk} $pzk` : `✗ ${r.errore}`); process.exit(r.ok ? 0 : 1)
}
const r = await post({ a: 'lista', key: KEY })
if (!r.ok) { console.error(`✗ ${r.errore}${r.offline ? ' (lo store Blob non è collegato al progetto)' : ''}`); process.exit(1) }
console.log(`${r.conti.length} conti · ${r.pzk} $pzk in tutto, ${r.eur} EUR€ parcheggiati\n`)
for (const c of r.conti) console.log(`${c.ind}  ${c.nome.padEnd(20)}  ${String(c.pzk).padStart(9)} $pzk  ${String(c.eur.toFixed(2)).padStart(9)} EUR€  nato ${quando(c.creato)}${c.indCambiato ? '  (indirizzo suo)' : ''}${c.ig ? '  ig' : ''}${c.pin ? '' : '  SENZA PIN'}`)
