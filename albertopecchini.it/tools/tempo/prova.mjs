// Prova della macchina del tempo (3.11.2026): apre ogni versione depositata come la
// apre il pubblico, cioè attraverso il Funnel di Tailscale, dove solo /tempo/… porta a
// questo archivio e la radice (/assets/…, /sw.js…) porta al server di pzkko. Qui il
// server è quello locale (127.0.0.1:8789) e ogni richiesta fuori da /tempo/ viene
// bloccata, come succede dal tunnel. Per ogni versione dice: errori JavaScript,
// richieste locali fallite o fuori dall'archivio, file che ricevono HTML al posto del
// loro tipo, e se la pagina mostra qualcosa.
//
//   node tools/tempo/prova.mjs                 tutte le versioni di stato.json
//   node tools/tempo/prova.mjs 965daa2 bc7ba74 solo quelle
//
// Le richieste a servizi esterni (API di GitHub, font di Google…) non contano: sono
// di allora e non si possono riportare in vita.

import { readFileSync } from 'node:fs'
import * as browser from '../pzkko/browser.mjs'

const BASE = process.env.TEMPO_URL || 'http://127.0.0.1:8789'
const stato = JSON.parse(readFileSync(process.env.TEMPO_STATO || 'C:/pzkko-server/tempo/stato.json', 'utf8'))
const scelte = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const versioni = scelte.length ? scelte : stato.versioni

const b = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const risultati = []
for (const sha of versioni) {
  const page = await b.newPage()
  const guai = new Set()
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    const u = new URL(r.url())
    // /favicon.ico lo chiede il browser da sé quando la pagina non ne dichiara uno: non è un guasto della versione
    if (u.origin === new URL(BASE).origin && u.pathname === '/favicon.ico') return r.abort()
    if (u.origin === new URL(BASE).origin && !u.pathname.startsWith('/tempo/')) {
      guai.add(`fuori dall'archivio: ${u.pathname}`)
      return r.abort()
    }
    r.continue()
  })
  page.on('pageerror', (e) => guai.add(`errore JS: ${e.message.split('\n')[0].slice(0, 140)}`))
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.origin !== new URL(BASE).origin) return
    const tipo = r.request().resourceType()
    const ct = r.headers()['content-type'] || ''
    if (r.status() >= 400) guai.add(`${r.status()} ${u.pathname}`)
    else if (tipo !== 'document' && ct.includes('text/html') && r.status() < 300) guai.add(`HTML al posto di ${tipo}: ${u.pathname}`)
  })
  page.on('requestfailed', (r) => {
    const u = new URL(r.url())
    if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/tempo/')) guai.add(`fallita: ${u.pathname}`)
  })
  await page.setViewport({ width: 1280, height: 800 })
  try {
    await page.goto(`${BASE}/tempo/${sha}/`, { waitUntil: 'networkidle2', timeout: 45000 })
  } catch (e) {
    guai.add(`apertura: ${e.message.slice(0, 80)}`)
  }
  await new Promise((r) => setTimeout(r, 1500))
  const testo = await page.evaluate(() => (document.body?.innerText || '').trim().length).catch(() => 0)
  if (testo < 40) guai.add(`pagina quasi vuota (${testo} caratteri)`)
  risultati.push({ sha, guai: [...guai] })
  console.log(`${guai.size ? '✗' : '✓'} ${sha}${guai.size ? '\n    ' + [...guai].join('\n    ') : ''}`)
  await page.close()
}
await b.close()
const rotte = risultati.filter((r) => r.guai.length)
console.log(`\n${risultati.length - rotte.length} versioni a posto su ${risultati.length}`)
process.exit(rotte.length ? 1 : 0)
