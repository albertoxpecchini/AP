#!/usr/bin/env node
// Il bot dei bug di pzkko.it (6.11.2026, Alberto: «ci sono bugs ovunque io guardo, devi creare un bot che verifichi
// tutti sti errori»). Cerca da solo quello che di solito trova Alberto guardando il sito, in due giri:
//
// 1. I FILE (senza browser, pochi secondi): ogni .js e .mjs del sito e dei suoi strumenti si legge senza errori di
//    sintassi; ogni import, ogni new URL(…, import.meta.url), ogni indirizzo scritto per intero in una pagina, in un
//    foglio di stile o in uno script (/art/…webp, /fonts/…, href, src, url()) porta a un file che c'è, con le
//    maiuscole giuste (su Windows «Foto.webp» e «foto.webp» sono lo stesso file, su Vercel no); i JSON sono JSON; i
//    moduli di dati degli strumenti si caricano (fogli.js: il 6.11 un pezzo in più in una griglia fermava immagini.mjs
//    da una settimana e nessuno lo sapeva); la sitemap porta a pagine vere; ogni pagina ha la guardia della
//    manutenzione in testa.
// 2. IL BROWSER (Chromium senza finestra, sul computer e sul telefono): apre ogni pagina e ogni finestra del sito (i
//    sei giochi, il wallet, la regia, lo scontrino, la 404, il cartello della manutenzione) e segna gli errori di
//    JavaScript, quello che la pagina stessa dice di non essere riuscita a fare («… non aperta»), i file che non
//    arrivano, le immagini rotte, «undefined» e «NaN» scritti nella pagina, la pagina più larga dello schermo, le
//    finestre che non si aprono, i link interni che non portano da nessuna parte. Una foto per pagina.
//
//   node tools/pzkko/bot/bot.mjs               tutti e due i giri sulla cartella pzkko/ (un server suo, le api «in pausa»)
//   node tools/pzkko/bot/bot.mjs --file        solo i file
//   node tools/pzkko/bot/bot.mjs --browser     solo il browser
//   node tools/pzkko/bot/bot.mjs --online      il browser sul sito vero, https://www.pzkko.it (o --online=https://…)
//   node tools/pzkko/bot/bot.mjs --collaudi    in più i collaudi che ci sono già (le regole dei giochi, la wiki)
//   node tools/pzkko/bot/bot.mjs --zero        in più il collaudo di tutte le app di pzk os (zero/prova.mjs --app=…: vuole
//                                              la scheda video vera, minuti); --zero=chat,quiz solo quelle
//   node tools/pzkko/bot/bot.mjs --banca       in più le prove della banca (C:\pzkko-server\banca\prove, in memoria: i dati
//                                              veri non si toccano); solo sul pc di Alberto, la banca non sta su GitHub
//   node tools/pzkko/bot/bot.mjs --tutto       tutto quanto: file, browser, collaudi, banca, zero
//   … --solo=roulette,wiki                     solo le pagine con quei nomi   … --senza-foto
//
// Esce con 0 se non trova niente («nessun bug»), con 1 se trova qualcosa. Il rapporto e le foto vanno in
// tools/pzkko/lavoro/bot/ (rapporto.md); su GitHub (.github/workflows/bot.yml: a ogni push che tocca pzkko, e ogni tre
// ore sul sito vero) i bug diventano annotazioni ::error, il commit prende la ❌ e arriva l'email.
// Serve puppeteer-core in tools/catture e un browser (tools/pzkko/browser.mjs: --chrome= o CHROME).
//
// Un falso allarme si toglie qui, in TOLLERATI, con accanto il perché: mai allargando le maglie per tutti.
import { readFile, writeFile, mkdir, readdir, stat, appendFile } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, extname, relative, resolve, sep, posix } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { cpus } from 'node:os'
import { accendi } from './sito.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..') // albertopecchini.it
const PZKKO = join(SITO, 'pzkko')
const ATTREZZI = join(SITO, 'tools/pzkko')
const LAVORO = join(ATTREZZI, 'lavoro/bot')
const tutto = process.argv.includes('--tutto')
const arg = (n) => process.argv.includes(`--${n}`) || (tutto && ['collaudi', 'banca', 'zero'].includes(n))
const val = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').slice(n.length + 3)
const online = arg('online') || val('online') ? (val('online') || 'https://www.pzkko.it').replace(/\/$/, '') : ''
const giroFile = !online && !arg('browser')
const giroBrowser = !arg('file')
const solo = val('solo') ? val('solo').split(',') : null
const conFoto = !arg('senza-foto')

// quello che non è un bug, col perché (espressioni cercate in «dove: cosa»)
const TOLLERATI = [
  /\/__dev\/accesso/, // la porta del conto in locale (tools/dev.mjs): fuori da lì non c'è, e games/pzk.js lo sa
  /favicon\.ico/, // i browser la chiedono da soli; il sito ha favicon.png
]

// i bug veri che aspettano una decisione di Alberto: il bot li ripete a ogni giro («da decidere»), ma non diventa rosso
// per quelli, se no la ❌ non direbbe più niente. Appena deciso, la riga si toglie
const DA_DECIDERE = [
  // dal 31.10 la banca sta sul server e api/_giocatori.mjs non c'è più: questa prova non parte. Toglierla (le prove dei
  // lotti sono quelle della banca, C:\pzkko-server\banca\prove\wallet.mjs) o rifarla lì? Ne parlano il README e tre voci della wiki
  [/prova-lotti\.mjs: importa «\.\.\/\.\.\/pzkko\/api\/_giocatori\.mjs»/, 'toglierla o rifarla sulle prove della banca'],
]

const bug = [] // { giro, dove, cosa }
const sospesi = [] // { dove, cosa, perche }: i DA_DECIDERE trovati anche stavolta
const note = []
const segna = (giro, dove, cosa) => {
  const riga = `${dove}: ${cosa}`
  if (TOLLERATI.some((t) => t.test(riga))) return
  const noto = DA_DECIDERE.find(([t]) => t.test(riga))
  if (noto) { if (!sospesi.some((s) => s.dove === dove && s.cosa === cosa)) sospesi.push({ dove, cosa, perche: noto[1] }); return }
  if (!bug.some((b) => b.dove === dove && b.cosa === cosa)) bug.push({ giro, dove, cosa })
}
const nota = (dove, cosa) => { cosa = cosa.slice(0, 170); const n = note.find((x) => x.cosa === cosa); if (!n) note.push({ cosa, dove: [dove] }); else if (!n.dove.includes(dove)) n.dove.push(dove) }
const rel = (f) => relative(SITO, f).split(sep).join('/')

// ── i file ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const SALTA_CARTELLE = new Set(['node_modules', 'lavoro', '.git'])
async function cammina(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SALTA_CARTELLE.has(e.name)) await cammina(join(dir, e.name), out) }
    else out.push(join(dir, e.name))
  }
  return out
}
// i pacchetti di altri (three.js, rapier…): esistono e basta, non si leggono
const altrui = (f) => /[\\/]lib[\\/]/.test(f) || /\.min\.js$/.test(f)
// i testi della wiki parlano di file e di indirizzi (anche di quelli che non ci sono più): non sono riferimenti
const racconta = (f) => /[\\/]wiki[\\/](voci[\\/]|cronologia\.js|voci\.js)/.test(f)

// c'è, con le stesse maiuscole (come su Vercel)? Le cartelle si leggono una volta sola
const elenchi = new Map()
const elenco = (dir) => { if (!elenchi.has(dir)) { let l = null; try { l = new Set(readdirSync(dir)) } catch {} elenchi.set(dir, l) } return elenchi.get(dir) }
function ceFile(f) {
  f = resolve(f)
  const radice = resolve(SITO, '..')
  if (!f.startsWith(radice + sep)) return existsSync(f)
  let qui = radice
  for (const pezzo of relative(radice, f).split(sep)) {
    if (pezzo === '..' || pezzo === '.') return existsSync(f)
    if (!elenco(qui)?.has(pezzo)) return false
    qui = join(qui, pezzo)
  }
  return true
}
const eFile = (f) => { try { return statSync(f).isFile() } catch { return false } }
const eCartella = (f) => { try { return statSync(f).isDirectory() } catch { return false } }
/** Un indirizzo del sito (/x/y?z#w) porta a qualcosa? Le regole di Vercel: cartella → index.html, /x → x.html, /api/x → api/x.mjs. */
function ceIndirizzo(p) {
  p = p.replace(/[?#].*$/, '')
  try { p = decodeURIComponent(p) } catch {}
  if (p.startsWith('/api/')) { const n = p.slice(5).replace(/\/.*$/, ''); return ceFile(join(PZKKO, 'api', n + '.mjs')) || ceFile(join(SITO, 'api', n + '.js')) }
  if (p.startsWith('/__')) return true // gli indirizzi del server di sviluppo
  const f = join(PZKKO, p)
  if (!ceFile(f)) return ceFile(f.replace(/[\\/]$/, '') + '.html')
  return eFile(f) || eFile(join(f, 'index.html'))
}
const fuori = (u) => /^(https?:)?\/\/|^(data|mailto|tel|javascript|blob|about|sms|whatsapp):/i.test(u)
const senzaCommenti = (t, tipo) => tipo === '.html' ? t.replace(/<!--[\s\S]*?-->/g, '') : t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

function sintassi(file) {
  return new Promise((ok) => {
    const p = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    p.stderr.on('data', (d) => { err += d })
    p.on('close', (codice) => ok(codice ? err.split(SITO + sep).join('').split('\n').filter((r) => r.trim() && !/^\s+at |^Node\.js v/.test(r)).slice(0, 6).join(' ').replace(/\s+/g, ' ').slice(0, 300) : ''))
  })
}
async function aGruppi(cose, quanti, fai) {
  const coda = [...cose]
  await Promise.all(Array.from({ length: quanti }, async () => { while (coda.length) await fai(coda.shift()) }))
}

async function file() {
  const G = 'file'
  const delSito = (await cammina(PZKKO)).filter((f) => !f.includes(`${sep}wiki${sep}img${sep}`))
  const degliAttrezzi = await cammina(ATTREZZI)
  const script = [...delSito, ...degliAttrezzi].filter((f) => /\.(js|mjs)$/.test(f) && !altrui(f))

  // 1. la sintassi
  await aGruppi(script, Math.max(2, Math.min(8, cpus().length)), async (f) => { const e = await sintassi(f); if (e) segna(G, rel(f), `errore di sintassi: ${e}`) })

  // 2. gli import e i new URL(…, import.meta.url)
  for (const f of script) {
    const t = senzaCommenti(await readFile(f, 'utf8'), '.js')
    const trovati = new Set()
    for (const re of [/(?:^|[\s;}])(?:import|export)\s[^'"`;()]*?\bfrom\s*['"]([^'"\n]+)['"]/g, /(?:^|[\s;}])import\s*['"]([^'"\n]+)['"]/g, /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g, /new URL\(\s*['"]([^'"\n]+)['"]\s*,\s*import\.meta\.url\s*\)/g])
      for (const m of t.matchAll(re)) trovati.add(m[1])
    for (const dove of trovati) {
      if (fuori(dove) || dove.includes('${')) continue
      const netto = dove.replace(/[?#].*$/, '')
      let bersaglio
      if (netto.startsWith('/')) { if (!f.startsWith(PZKKO + sep)) continue; bersaglio = join(PZKKO, netto) }
      else if (netto.startsWith('.')) bersaglio = resolve(dirname(f), netto)
      else continue // un pacchetto, o node:…
      if (!ceFile(bersaglio)) segna(G, rel(f), `importa «${dove}», che non c'è${existsSync(bersaglio) ? ' con queste maiuscole (su Vercel non lo trova)' : ''}`)
    }
  }

  // 3. gli indirizzi scritti per intero nelle pagine, negli stili e negli script del sito
  const ESTENSIONI = 'webp|png|jpe?g|svg|gif|ico|woff2|mp3|ogg|wav|json|css|js|mjs|glb|bin|wasm|zip|pdf|xml|txt'
  const scritto = new RegExp(`(['"\`(])(\\/[A-Za-z0-9_\\-./%]+\\.(?:${ESTENSIONI}))(?=[?#][^'"\`)]*['"\`)]|['"\`)])`, 'g')
  for (const f of delSito) {
    const tipo = extname(f).toLowerCase()
    if (!['.html', '.css', '.js', '.mjs'].includes(tipo) || altrui(f) || racconta(f) || f.includes(`${sep}api${sep}`)) continue
    const t = senzaCommenti(await readFile(f, 'utf8'), tipo)
    const pagina = '/' + relative(PZKKO, f).split(sep).join('/')
    const visti = new Set()
    const guarda = (u, come) => {
      if (!u || fuori(u) || u.startsWith('#') || /[${}<>\s]|\+/.test(u)) return
      let p
      try { p = new URL(u, 'http://x' + pagina).pathname } catch { return }
      if (visti.has(p)) return
      visti.add(p)
      if (!ceIndirizzo(p)) segna(G, rel(f), `${come} «${u}», che non c'è`)
    }
    for (const m of t.matchAll(scritto)) guarda(m[2], 'nomina')
    if (tipo === '.html') {
      // (solo fuori dagli script: dentro, un href="…" è un pezzo di pagina che lo script sta scrivendo, coi suoi ${…})
      const fermo = t.replace(/<script\b[\s\S]*?<\/script>/gi, '')
      for (const m of fermo.matchAll(/\s(?:href|src|poster|data-full)\s*=\s*"([^"]*)"/g)) guarda(m[1], 'punta a')
      for (const m of fermo.matchAll(/\ssrcset\s*=\s*"([^"]*)"/g)) for (const pezzo of m[1].split(',')) guarda(pezzo.trim().split(/\s+/)[0], 'punta a')
    }
    if (tipo === '.css' || tipo === '.html') for (const m of t.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/g)) guarda(m[1], 'disegna')
  }

  // 4. i JSON
  for (const f of [...delSito, join(SITO, 'vercel.json'), join(SITO, 'package.json')].filter((x) => x.endsWith('.json') && !altrui(x))) {
    try { JSON.parse((await readFile(f, 'utf8')).replace(/^﻿/, '')) } catch (e) { segna(G, rel(f), `non è un JSON: ${e.message.slice(0, 160)}`) }
  }

  // 5. i moduli di dati degli strumenti si caricano (non gli strumenti: quelli partono, se li importi)
  for (const f of degliAttrezzi.filter((x) => x.endsWith('.js') && dirname(x) === ATTREZZI)) {
    try { await import(pathToFileURL(f).href) } catch (e) { segna(G, rel(f), `non si carica: ${String(e.message).slice(0, 200)}`) }
  }

  // 6. le pagine: la guardia della manutenzione in testa, e la sitemap che porta a pagine vere
  const pagine = delSito.filter((f) => f.endsWith('.html'))
  for (const f of pagine) {
    const r = rel(f)
    if (/pzkko\/(manutenzione|server)\//.test(r)) continue
    const t = await readFile(f, 'utf8')
    const testa = t.slice(0, t.indexOf('</head>') < 0 ? 4000 : t.indexOf('</head>'))
    const dove = testa.indexOf('/manutenzione/guardia.js')
    if (dove < 0) segna(G, r, 'manca la guardia della manutenzione in testa (<script src="/manutenzione/guardia.js"> subito dopo <meta charset>): con il sito chiuso questa pagina resterebbe aperta')
    else if (/<script|<link[^>]+stylesheet/i.test(testa.slice(0, testa.lastIndexOf('<', dove)))) segna(G, r, 'la guardia della manutenzione non è la prima cosa che la pagina carica')
    if (!/<title>[^<]{3,}<\/title>/.test(t)) segna(G, r, 'non ha il titolo')
    if (!/<html[^>]*\slang=/.test(t)) segna(G, r, 'non dice in che lingua è (<html lang>)')
    if (!/<meta name="viewport"/.test(t)) segna(G, r, 'non ha il viewport: sul telefono si vede piccola')
  }
  try {
    const mappa = await readFile(join(PZKKO, 'sitemap.xml'), 'utf8')
    for (const m of mappa.matchAll(/<loc>([^<]+)<\/loc>/g)) { const p = new URL(m[1]).pathname; if (!ceIndirizzo(p)) segna(G, 'pzkko/sitemap.xml', `porta a ${p}, che non c'è`) }
  } catch (e) { segna(G, 'pzkko/sitemap.xml', `non si legge: ${e.message}`) }

  // 7. i pezzi delle immagini (art/pezzi.json): ogni pezzo scritto lì ha il suo file
  try {
    const pezzi = JSON.parse(await readFile(join(PZKKO, 'art/pezzi.json'), 'utf8'))
    for (const [foglio, cose] of Object.entries(pezzi)) for (const nome of Object.keys(cose)) {
      const posti = [`art/${foglio}/${nome}.webp`, `art/${nome}.webp`, `art/${foglio}.webp`, `art/${foglio}/${nome}.svg`]
      if (!posti.some((p) => ceFile(join(PZKKO, p)))) segna(G, 'pzkko/art/pezzi.json', `il pezzo «${nome}» del foglio «${foglio}» non ha il suo file (art/${foglio}/${nome}.webp)`)
    }
  } catch (e) { segna(G, 'pzkko/art/pezzi.json', `non si legge: ${e.message}`) }

  return { script: script.length, pagine: pagine.length, file: delSito.length }
}

// ── il browser ───────────────────────────────────────────────────────────────────────────────────────────────────────
// [nome, indirizzo, cosa deve esserci (un selettore) o null, opzioni]
const FINESTRA = 'dialog[open]'
const NON_ESISTE = '/una-pagina-che-non-esiste/'
const PAGINE = [
  ['home', '/', null],
  ['storia', '/storia/', null],
  ['gadget', '/gadget/', null],
  ['oggetti', '/oggetti/', null],
  ['traguardi', '/traguardi/', null],
  ['info', '/info/', null],
  ['wiki', '/wiki/', '#testo', { racconta: true }],
  ['lezioni', '/tools/lezioni/', null],
  ['404', NON_ESISTE, null, { stato: 404 }],
  ['manutenzione', '/manutenzione/?vedi', '.foglio #quanto'],
  ['scontrino', '/?novita', FINESTRA, { finestra: true }],
  ['roulette', '/#roulette', FINESTRA, { finestra: true }],
  ['blackjack', '/#blackjack', FINESTRA, { finestra: true }],
  ['mine', '/#mine', FINESTRA, { finestra: true }],
  ['dado', '/#dado', FINESTRA, { finestra: true }],
  ['moneta', '/#moneta', FINESTRA, { finestra: true }],
  ['virtual', '/#virtual', FINESTRA, { finestra: true }],
  ['wallet', '/?wallet#wallet', FINESTRA, { finestra: true }],
  ['regia', '/#regia', FINESTRA, { finestra: true }],
]
const SCHERMI = [['computer', { width: 1366, height: 900, deviceScaleFactor: 1 }], ['telefono', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]
// quello che una pagina dice quando non le riesce qualcosa e va avanti lo stesso (console.warn('… non aperta', e))
const NON_RIUSCITO = /\bnon (si )?(è |e' )?(apert[ao]|partit[ao]|caricat[ao]|vestit[ao]|preparat[ao]|riuscit[ao]|trovat[ao]|pront[ao])\b|\bfallit[ao]\b/i
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))

async function giraBrowser() {
  const G = 'browser'
  const browser = await import('../browser.mjs')
  const sito = online ? null : await accendi(PZKKO)
  const base = online || sito.base
  const origine = new URL(base).origin
  if (conFoto) await mkdir(LAVORO, { recursive: true })
  const aperto = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const link = new Map() // indirizzo interno → la prima pagina che ce l'ha
  let viste = 0
  try {
    for (const [nome, indirizzo, attesa, opz = {}] of PAGINE) {
      if (solo && !solo.includes(nome)) continue
      for (const [schermo, misure] of SCHERMI) {
        const dove = `${nome} (${schermo})`
        const ctx = await aperto.createBrowserContext()
        const page = await ctx.newPage()
        try {
          await page.setViewport(misure)
          if (misure.isMobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
          page.on('pageerror', (e) => segna(G, dove, `errore di JavaScript: ${String(e.message).split('\n')[0].slice(0, 300)}`))
          page.on('console', (m) => {
            const t = m.text().replace(/\s+/g, ' ').slice(0, 300)
            if (/^Failed to load resource/.test(t)) return // contati sotto, col nome del file
            if (m.type() === 'error') segna(G, dove, `errore in console: ${t}`)
            else if (m.type() === 'warn' || m.type() === 'warning') (NON_RIUSCITO.test(t) ? segna(G, dove, `la pagina dice: ${t}`) : nota(dove, `avviso in console: ${t}`))
          })
          page.on('response', (r) => {
            const u = new URL(r.url())
            if (r.status() < 400) return
            if (u.origin !== origine) return nota(dove, `da fuori: ${u.host}${u.pathname} → ${r.status()}`)
            if (u.pathname.startsWith('/api/')) return r.status() === 503 ? nota('la banca', 'le api rispondono «in pausa» (503): il server di casa è spento, o è la prova in locale') : segna(G, dove, `${u.pathname} risponde ${r.status()}`)
            if (opz.stato === r.status() && r.request().isNavigationRequest()) return
            segna(G, dove, `non arriva ${u.pathname} (${r.status()})`)
          })
          page.on('requestfailed', (r) => {
            const perche = r.failure()?.errorText ?? ''
            if (/ERR_ABORTED|ERR_CACHE_MISS/.test(perche)) return
            const u = new URL(r.url())
            if (u.origin !== origine) return nota(dove, `da fuori: ${u.host} non risponde (${perche})`)
            segna(G, dove, `non arriva ${u.pathname} (${perche})`)
          })
          const risposta = await page.goto(base + indirizzo, { waitUntil: 'load', timeout: 90_000 })
          const stato = risposta?.status() ?? 0
          if (stato !== (opz.stato ?? 200)) segna(G, dove, `risponde ${stato} invece di ${opz.stato ?? 200}`)
          await page.waitForNetworkIdle({ idleTime: 700, timeout: 20_000 }).catch(() => {})
          if (attesa) {
            const c = await page.waitForSelector(attesa, { timeout: 45_000 }).catch(() => null)
            if (!c) segna(G, dove, opz.finestra ? 'la finestra non si apre (dopo 45 secondi niente)' : `manca ${attesa}`)
            await page.waitForNetworkIdle({ idleTime: 700, timeout: 20_000 }).catch(() => {})
            await dorm(1200)
          } else {
            // giù fino in fondo e di nuovo su: le immagini pigre arrivano solo se ci passi
            await page.evaluate(async () => { const passo = innerHeight * 0.8; for (let y = 0; y < document.documentElement.scrollHeight && y < 30000; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)) } scrollTo(0, 0) })
            await page.waitForNetworkIdle({ idleTime: 500, timeout: 15_000 }).catch(() => {})
          }
          const visto = await page.evaluate((racconta) => {
            const radice = document.querySelector('dialog[open]') ?? document.body
            const testo = radice.innerText ?? ''
            return {
              titolo: document.title.trim(),
              rotte: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.getAttribute('src'))).map((i) => i.currentSrc || i.getAttribute('src')),
              brutti: racconta ? [] : [...new Set(testo.match(/\bundefined\b|\bNaN\b|\[object Object\]/g) ?? [])].map((b) => { const i = testo.indexOf(b); return `${b} («…${testo.slice(Math.max(0, i - 30), i + b.length + 20).replace(/\s+/g, ' ')}…»)` }),
              largo: Math.round(document.documentElement.scrollWidth - innerWidth),
              vuota: testo.trim().length < 20 && !document.querySelector('canvas'),
              doppi: [...new Set([...document.querySelectorAll('[id]')].map((e) => e.id).filter((id, i, tutti) => id && tutti.indexOf(id) !== i))].slice(0, 8),
              link: [...document.querySelectorAll('a[href]')].map((a) => a.href),
            }
          }, !!opz.racconta)
          if (!visto.titolo) segna(G, dove, 'la pagina non ha titolo')
          if (visto.vuota) segna(G, dove, 'non c’è scritto niente')
          for (const id of visto.doppi) segna(G, dove, `due cose con lo stesso id «${id}» (getElementById ne trova una sola)`)
          for (const i of new Set(visto.rotte)) segna(G, dove, `immagine rotta: ${i.replace(origine, '')}`)
          for (const b of visto.brutti) segna(G, dove, `nella pagina c’è scritto ${b}`)
          if (visto.largo > 2) segna(G, dove, `la pagina è più larga dello schermo di ${visto.largo} px (scorre di lato)`)
          for (const l of visto.link) { try { const u = new URL(l); if (u.origin === origine && u.pathname !== NON_ESISTE && !link.has(u.pathname)) link.set(u.pathname, dove) } catch {} }
          if (conFoto) await page.screenshot({ path: join(LAVORO, `${nome}-${schermo}.png`) }).catch((e) => nota(dove, `foto non fatta: ${e.message}`))
          viste++
        } catch (e) {
          segna(G, dove, `non si apre: ${String(e.message).split('\n')[0].slice(0, 200)}`)
        } finally { await ctx.close().catch(() => {}) }
      }
    }
    // i link interni trovati in giro: ognuno porta a qualcosa?
    if (!solo) for (const [p, da] of link) {
      if (online) { const r = await fetch(base + p, { method: 'GET', redirect: 'follow' }).catch(() => null); if (!r || r.status >= 400) segna(G, da, `il link a ${p} non porta da nessuna parte (${r?.status ?? 'non risponde'})`) }
      else if (!ceIndirizzo(p)) segna(G, da, `il link a ${p} non porta da nessuna parte`)
    }
    // quello che il server ha visto chiedere e non aveva (anche dai fogli di stile e dagli script)
    if (sito) for (const [p, da] of sito.mancanti) if (p !== NON_ESISTE) segna(G, [...da].join(', '), `chiede ${p}, che non c'è`)
  } finally { await aperto.close().catch(() => {}); await sito?.chiudi() }
  return { viste, link: link.size, base }
}

// ── i collaudi che ci sono già ───────────────────────────────────────────────────────────────────────────────────────
const COLLAUDI = [['le regole del blackjack', 'tools/pzkko/blackjack/prova.mjs'], ['le regole delle mine', 'tools/pzkko/mine/prova.mjs'], ['pzkkopedia', 'tools/pzkko/wiki/controlla.mjs', '--solo-voci']]
function lancia(nome, script, ...argomenti) {
  const cwd = argomenti.at(-1)?.cwd ?? SITO
  if (argomenti.at(-1)?.cwd) argomenti.pop()
  return new Promise((ok) => {
    const p = spawn(process.execPath, [script, ...argomenti], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    const fine = setTimeout(() => { p.kill(); out += '\n(fermato dopo 10 minuti)' }, 600_000)
    p.stdout.on('data', (d) => { out += d }); p.stderr.on('data', (d) => { out += d })
    p.on('close', (codice) => { clearTimeout(fine); if (codice) segna('collaudi', nome, `${script} è uscito con ${codice}: ${out.trim().split('\n').slice(-4).join(' · ').slice(0, 400)}`); ok(codice) })
  })
}

// le app di pzk os, una alla volta, col collaudo di REGOLE.md: «COLLAUDO <app>: tutto a posto», o l'elenco dei problemi
const APP = ['chat', 'profilo', 'account', 'negozio', 'pzkstore', 'sfide', 'quiz', 'missioni', 'giocatori', 'zaino', 'miniera', 'foto', 'virtual', 'banca', 'rapina', 'lavatrice', 'decifratore', 'conversioni', 'calcolatrice', 'compilatore', 'cucina', 'impostazioni']
function collaudaApp(app) {
  return new Promise((ok) => {
    const p = spawn(process.execPath, ['tools/pzkko/zero/prova.mjs', '--giorno', '--suoni', `--app=${app}`], { cwd: SITO, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    const fine = setTimeout(() => { p.kill(); out += '\n(fermato dopo 6 minuti)' }, 360_000)
    p.stdout.on('data', (d) => { out += d }); p.stderr.on('data', (d) => { out += d })
    p.on('close', () => {
      clearTimeout(fine)
      const i = out.indexOf(`COLLAUDO ${app}:`)
      if (i < 0) segna('zero', `app ${app}`, `il collaudo non è arrivato in fondo: ${out.trim().split('\n').slice(-3).join(' · ').slice(0, 300)}`)
      else if (!/^COLLAUDO \S+: tutto a posto/.test(out.slice(i))) for (const r of out.slice(i).split('\n').slice(1).filter((x) => /^\s+- /.test(x)).slice(0, 12)) segna('zero', `app ${app}`, r.replace(/^\s+- /, '').slice(0, 300))
      ok()
    })
  })
}

// ── il rapporto ──────────────────────────────────────────────────────────────────────────────────────────────────────
const inizio = Date.now()
const fatto = []
if (giroFile) { const n = await file(); fatto.push(`i file: ${n.file} del sito, ${n.script} script letti, ${n.pagine} pagine`) }
if (giroBrowser) { const n = await giraBrowser(); fatto.push(`il browser su ${n.base.replace(/^https?:\/\//, '')}: ${n.viste} aperture (pagine e finestre, computer e telefono), ${n.link} link interni`) }
if (arg('zero') || val('zero')) { const quali = val('zero') ? val('zero').split(',') : APP; for (const a of quali) { process.stdout.write(`zero: ${a}… `); await collaudaApp(a) } console.log(); fatto.push(`il collaudo di ${quali.length} app di pzk os`) }
if (arg('banca')) {
  const banca = process.env.PZKKO_BANCA || 'C:\\pzkko-server\\banca'
  const prove = existsSync(join(banca, 'prove')) ? readdirSync(join(banca, 'prove')).filter((f) => f.endsWith('.mjs') && !f.startsWith('aiuto')) : []
  if (!prove.length) nota('la banca', `le prove non ci sono (${join(banca, 'prove')}): la banca sta solo sul pc di Alberto`)
  else {
    let male = 0
    for (const f of prove) { process.stdout.write(`banca: ${f.replace('.mjs', '')}… `); if (await lancia(`banca, ${f.replace('.mjs', '')}`, join('prove', f), { cwd: banca })) male++ }
    console.log()
    fatto.push(`le prove della banca: ${prove.length}, ${male ? male + ' storte' : 'tutte buone'}`)
  }
}
if (arg('collaudi')) { for (const [nome, ...c] of COLLAUDI) await lancia(nome, ...c); fatto.push(`i collaudi: ${COLLAUDI.map((c) => c[0]).join(', ')}`) }

const secondi = Math.round((Date.now() - inizio) / 1000)
const perPosto = new Map()
for (const b of bug) { if (!perPosto.has(b.dove)) perPosto.set(b.dove, []); perPosto.get(b.dove).push(b.cosa) }
const righe = [`# Il bot dei bug di pzkko.it`, '', `${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })} · ${secondi} s · ${fatto.join(' · ')}`, '']
if (!bug.length) righe.push('**Nessun bug.**', '')
else {
  righe.push(`**${bug.length} ${bug.length === 1 ? 'bug' : 'bug'} in ${perPosto.size} ${perPosto.size === 1 ? 'posto' : 'posti'}.**`, '')
  for (const [dove, cose] of perPosto) { righe.push(`## ${dove}`, ''); for (const c of cose) righe.push(`- ${c}`); righe.push('') }
}
if (sospesi.length) { righe.push('## Da decidere (bug veri, in attesa di Alberto)', ''); for (const s of sospesi) righe.push(`- ${s.dove}: ${s.cosa} — ${s.perche}`); righe.push('') }
if (note.length) { righe.push('## Da sapere (non sono bug)', ''); for (const n of note) righe.push(`- ${n.cosa} — ${n.dove.join(', ')}`); righe.push('') }
const rapporto = righe.join('\n')

console.log(`\nil bot dei bug · ${fatto.join(' · ')} · ${secondi} s`)
for (const [dove, cose] of perPosto) { console.log(`\n✗ ${dove}`); for (const c of cose) console.log(`    ${c}`) }
if (sospesi.length) { console.log('\nda decidere (bug veri, in attesa di Alberto):'); for (const s of sospesi) console.log(`    ${s.dove}: ${s.cosa} — ${s.perche}`) }
if (note.length) { console.log('\nda sapere (non sono bug):'); for (const n of note.slice(0, 12)) console.log(`    ${n.cosa} (${n.dove.length > 3 ? n.dove.slice(0, 3).join(', ') + ' e altre ' + (n.dove.length - 3) : n.dove.join(', ')})`); if (note.length > 12) console.log(`    … e altre ${note.length - 12} nel rapporto`) }
console.log(bug.length ? `\n${bug.length} bug in ${perPosto.size} ${perPosto.size === 1 ? 'posto' : 'posti'}.` : '\nnessun bug.')
await mkdir(LAVORO, { recursive: true })
await writeFile(join(LAVORO, 'rapporto.md'), rapporto)
console.log(`il rapporto${giroBrowser && conFoto ? ' e le foto' : ''}: tools/pzkko/lavoro/bot/`)
if (process.env.GITHUB_ACTIONS) {
  for (const b of bug) console.log(`::error title=${b.dove.replace(/[\r\n,:]/g, ' ')}::${b.cosa.replace(/%/g, '%25').replace(/\r?\n/g, ' ')}`)
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, rapporto + '\n')
}
process.exit(bug.length ? 1 : 0)
