// Prova della macchina del tempo (3.11.2026): apre ogni versione depositata come la
// apre il pubblico, cioè attraverso il Funnel di Tailscale, dove solo /tempo/… porta a
// questo archivio e la radice (/assets/…, /sw.js…) porta al server di pzkko. Qui il
// server è quello locale (127.0.0.1:8789, o uno acceso apposta con --server) e ogni
// richiesta fuori da /tempo/ viene bloccata, come succede dal tunnel. Per ogni versione
// dice: errori JavaScript, richieste locali fallite o fuori dall'archivio, file che
// ricevono HTML al posto del loro tipo, pagine vuote o «non trovata» (il router delle app
// React che non riconosce l'indirizzo), dati riservati rimasti nella pagina.
//
//   node tools/tempo/prova.mjs                    tutte le versioni di stato.json, tutti i siti
//   node tools/tempo/prova.mjs --sito=rivalta     un sito (anche più, separati da virgola)
//   node tools/tempo/prova.mjs 965daa2 bc7ba74    solo quelle
//   node tools/tempo/prova.mjs --server           accende il server del deposito su una porta sua
//
// Le richieste a servizi esterni (API di GitHub, font di Google…) non contano: sono
// di allora e non si possono riportare in vita.

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import * as browser from '../pzkko/browser.mjs'
import { SITI, prefisso } from './siti.mjs'
import { stato as diretta, log } from './diretta.mjs'

const argv = process.argv.slice(2)
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=')
const DEPOSITO = opt('deposito') || 'C:/pzkko-server/tempo'
const stato = JSON.parse(readFileSync(`${DEPOSITO}/stato.json`, 'utf8'))
const scelte = argv.filter((a) => !a.startsWith('--'))
const siti = SITI.filter((s) => !opt('sito') || opt('sito').split(',').includes(s.id))

// Gli errori che c'erano nel sito vero quel giorno (controllati sul codice di allora): l'archivio
// li mostra com'erano, la prova non li conta.
const DI_ALLORA = {
  // il 24.4.2026 js/gallery.js di Cascina Fontana non esportava fetchGalleria, che il resto chiedeva
  'cascina cebe4aa': /does not provide an export named 'fetchGalleria'/,
}

let BASE = process.env.TEMPO_URL || 'http://127.0.0.1:8789'
let server = null
if (argv.includes('--server') || !(await fetch(`${BASE}/stato.json`).then((r) => r.ok).catch(() => false))) {
  const porta = await new Promise((ok) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const p = s.address().port
      s.close(() => ok(p))
    })
  })
  server = spawn(process.execPath, [`${DEPOSITO}/server.mjs`], { env: { ...process.env, TEMPO_PORTA: String(porta) }, stdio: 'ignore' })
  BASE = `http://127.0.0.1:${porta}`
  await new Promise((r) => setTimeout(r, 900))
}
const origine = new URL(BASE).origin

const lista = siti.flatMap((s) => (stato.siti?.[s.id] || (s.id === 'ap' ? stato.versioni : []) || []).filter((sha) => !scelte.length || scelte.includes(sha)).map((sha) => ({ s, sha })))
const b = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const risultati = []
let fatte = 0
for (const { s, sha } of lista) {
  diretta('prova', { tipo: 'sito', id: 'prova', nome: 'prova dal tunnel', ordine: 9, fase: 'prova', totale: lista.length, fatte, ok: fatte - risultati.filter((r) => r.guai.length).length, errori: risultati.filter((r) => r.guai.length).length, corrente: { data: s.nome, short: sha, passo: 'apro', da: Date.now() } })
  const page = await b.newPage()
  const guai = new Set()
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    const u = new URL(r.url())
    // /favicon.ico lo chiede il browser da sé quando la pagina non ne dichiara uno: non è un guasto della versione
    if (u.origin === origine && u.pathname === '/favicon.ico') return r.abort()
    if (u.origin === origine && !u.pathname.startsWith('/tempo/')) {
      guai.add(`fuori dall'archivio: ${u.pathname}`)
      return r.abort()
    }
    r.continue()
  })
  // un errore che nasce da uno script esterno (un CDN di allora: lenis@1.0.29 a Rivalta in maggio)
  // c'era anche nel sito vero, non è un guasto dell'archivio
  page.on('pageerror', (e) => {
    const da = (String(e.stack || '').match(/\((https?:\/\/[^/)]+)/) || [])[1]
    if (da && da !== origine) return
    if (DI_ALLORA[`${s.id} ${sha}`]?.test(e.message)) return
    guai.add(`errore JS: ${e.message.split('\n')[0].slice(0, 140)}`)
  })
  page.on('response', (r) => {
    const u = new URL(r.url())
    if (u.origin !== origine) return
    const tipo = r.request().resourceType()
    const ct = r.headers()['content-type'] || ''
    // le API di allora che non ci sono più (la fetch riceve «non c'è») non sono un guasto dell'archivio
    if (r.status() >= 400 && !(r.status() === 404 && (tipo === 'fetch' || tipo === 'xhr'))) guai.add(`${r.status()} ${u.pathname}`)
    else if (tipo !== 'document' && ct.includes('text/html') && r.status() < 300) guai.add(`HTML al posto di ${tipo}: ${u.pathname}`)
  })
  page.on('requestfailed', (r) => {
    const u = new URL(r.url())
    if (u.origin === origine && u.pathname.startsWith('/tempo/') && !/ERR_ABORTED/.test(r.failure()?.errorText || '')) guai.add(`fallita: ${u.pathname}`)
  })
  await page.setViewport({ width: 1280, height: 800 })
  try {
    await page.goto(`${BASE}${prefisso(s, sha)}/`, { waitUntil: 'networkidle2', timeout: 45000 })
  } catch (e) {
    guai.add(`apertura: ${e.message.slice(0, 80)}`)
  }
  await new Promise((r) => setTimeout(r, 1500))
  const { testo, titolo } = await page.evaluate(() => ({ testo: (document.body?.innerText || '').trim(), titolo: document.title })).catch(() => ({ testo: '', titolo: '' }))
  if (testo.length < 40) guai.add(`pagina quasi vuota (${testo.length} caratteri)`)
  if (/\b404\b|non trovata|not found|pagina inesistente/i.test(titolo) || (testo.length < 600 && /\b404\b|non trovata|not found/i.test(testo))) guai.add(`pagina «non trovata»: ${titolo.slice(0, 60)}`)
  if (/via belvedere,?\s*1(?![0-9a-z])|331\s?407\s?4198|0376\s?681052/i.test(testo)) guai.add('dati riservati rimasti nella pagina')
  risultati.push({ sito: s.id, sha, guai: [...guai] })
  fatte++
  const riga = `${guai.size ? '×' : '√'} ${s.id} ${sha}${guai.size ? ' · ' + [...guai].join(' · ') : ''}`
  console.log(riga)
  log('prova', riga.slice(0, 400))
  await page.close()
}
await b.close()
if (server) server.kill()
const rotte = risultati.filter((r) => r.guai.length)
diretta('prova', { tipo: 'sito', id: 'prova', nome: 'prova dal tunnel', ordine: 9, fase: 'prova', totale: lista.length, fatte, ok: fatte - rotte.length, errori: rotte.length, fine: true, ultimo: `${fatte - rotte.length} a posto su ${fatte}` }, { subito: true })
console.log(`\n${risultati.length - rotte.length} versioni a posto su ${risultati.length}`)
process.exit(rotte.length ? 1 : 0)
