#!/usr/bin/env node
// La prova del cercapersone zero (29.10): apre la home in Chromium con uno zaino finto che ha «zero» (e un conto finto, così
// pzk os mostra la home e non la porta del conto), tocca il tasto sul muro e fotografa il volo, lo schermo acceso, il cavo
// che entra, i tasti e la chiusura. Le foto finiscono in tools/pzkko/lavoro/zero/prova-*.png: si guardano.
//
//   node tools/pzkko/zero/prova.mjs                 computer, 1440 × 900
//   node tools/pzkko/zero/prova.mjs --telefono      390 × 844 (lo schermo a tutta finestra)
//   node tools/pzkko/zero/prova.mjs --larga         1920 × 1080
//   node tools/pzkko/zero/prova.mjs --app=chat      dopo l'apertura apre quell'app e la COLLAUDA (tutti i tasti, l'lcd
//                                                  salvato a ogni passo, angoli, margini, glifi, errori; vedi REGOLE.md)
//   … --suoni                                      coi suoni accesi: il collaudo vuole anche il bip a ogni tasto
// Serve puppeteer-core in tools/catture e un browser (tools/pzkko/browser.mjs). Niente server vero: il wallet e lo zaino
// restano nel browser (le richieste alle api falliscono, e il sito sta in piedi lo stesso).
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const LAVORO = join(QUI, '../lavoro/zero')
const telefono = process.argv.includes('--telefono'), larga = process.argv.includes('--larga'), soloMuro = process.argv.includes('--muro') // --muro: solo il tasto sul muro, a 4× (per vedere se lo schermo sta dritto)
const app = (process.argv.find((a) => a.startsWith('--app=')) ?? '').slice(6)
const misura = (process.argv.find((a) => a.startsWith('--misura=')) ?? '').slice(9).split('x').map(Number) // --misura=3440x1440: una finestra qualsiasi
const peggiori = process.argv.includes('--peggiori') // i dati peggiori (REGOLE.md 4.2): nome di 20 lettere, motto di 60, quasi un miliardo
const rider = process.argv.includes('--rider')
const senzaConto = process.argv.includes('--senzaconto') // nessun conto: il cercapersone chiuso, l'account
const finto = process.argv.includes('--server-finto') // un server del wallet finto (qui sotto): entra (PIN 1234), crea, converti, invia… // un turno da rider: la consegna con le frecce e coi clic del mouse
const suoni = process.argv.includes('--suoni') // i suoni accesi (pzkko-suono = si): il collaudo vuole un bip a ogni tasto
const ora = process.argv.includes('--giorno') ? '12:00' : '21:00&notte=1' // di notte (lampioni, l'auto) o di giorno (il sole)
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' }
const ORA = Date.now()
let contoFinto = { nome: 'prova', ind: 'pzk000001', indCambiato: false, creato: ORA - 3 * 864e5, pzk: 52340, puliti: 52340, sporchi: 0, eur: 12.5, ig: false, invii: true, inviiDa: ORA - 864e5, agg: 1,
  mosse: [{ t: ORA - 3 * 864e5, tipo: 'nato', n: 1000 }, { t: ORA - 2 * 864e5, tipo: 'ricevuto', n: 500, nome: 'mario', da: 'pzk111111' }, { t: ORA - 864e5, tipo: 'in-eur', n: 1000, eur: 12.5, cambio: 0.0125 }, { t: ORA - 36e5 * 5, tipo: 'sussidio', n: 100 }, { t: ORA - 36e5, tipo: 'trovato', n: 25 }] }
const TASSO = 0.0123
const rapina = (process.argv.find((a) => a.startsWith('--rapina=')) ?? '').slice(9) // presi, galera
let colpoFinto = null, cassaFinta = 812345, giriColpo = 0
if (rapina === 'galera') contoFinto.galera = ORA + 4.5 * 36e5
function walletFinto(body) {
  const ok = (extra = {}) => { contoFinto.agg++; contoFinto.puliti = contoFinto.pzk; return { ok: true, conto: contoFinto, tasso: TASSO, t: Date.now(), ...extra } }
  const a = body.a
  if (a === 'entra') return body.pin === '1234' ? ok({ token: 'finto' }) : { ok: false, errore: 'nome o PIN sbagliati' }
  if (a === 'crea') { contoFinto = { ...contoFinto, nome: body.nome, ind: 'pzk123456', creato: Date.now(), pzk: 1000, eur: 0, invii: false, inviiDa: Date.now() + 48 * 36e5, mosse: [{ t: Date.now(), tipo: 'nato', n: 1000 }] }; return ok({ token: 'finto' }) }
  if (a === 'converti') {
    const q = Number(body.quanto)
    if (body.da === 'pzk') { contoFinto.pzk -= q; contoFinto.eur = Math.round((contoFinto.eur + q * TASSO) * 100) / 100; contoFinto.mosse.push({ t: Date.now(), tipo: 'in-eur', n: q, eur: q * TASSO, cambio: TASSO }); return ok({ fatto: { da: 'pzk', n: q, eur: q * TASSO, cambio: TASSO } }) }
    const n = Math.round((q / TASSO) * 2) / 2
    contoFinto.eur = Math.round((contoFinto.eur - q) * 100) / 100; contoFinto.pzk += n; contoFinto.mosse.push({ t: Date.now(), tipo: 'in-pzk', n, eur: q, cambio: TASSO }); return ok({ fatto: { da: 'eur', n, eur: q, cambio: TASSO } })
  }
  if (a === 'invia') { const q = Number(body.quanto); contoFinto.pzk -= q; contoFinto.mosse.push({ t: Date.now(), tipo: 'inviato', n: q, nome: 'mario', a: body.ind }); return ok({ fatto: { a: body.ind, nome: 'mario', n: q } }) }
  // la rapina finta (--rapina=presi: il colpo va male; --rapina=galera: si parte in galera): apri, entra (un colpo di mario),
  // esci, vai, e lo stato, che alla seconda volta fa entrare mario nella banda; la cauzione
  if (a === 'colpo') {
    const op = body.op, ora = Date.now()
    if (op === 'apri') colpoFinto = { codice: 'KRTZ', membri: [{ nome: contoFinto.nome, ind: contoFinto.ind }], stato: 'aperto', scade: ora + 15 * 6e4, esito: null, capo: true, io: true }
    else if (op === 'entra') colpoFinto = body.codice === 'MARI' ? { codice: 'MARI', membri: [{ nome: 'mario', ind: 'pzk111111' }, { nome: contoFinto.nome, ind: contoFinto.ind }], stato: 'aperto', scade: ora + 9 * 6e4, esito: null, capo: false, io: true } : null
    else if (op === 'esci') colpoFinto = null
    else if (op === 'vai') {
      const n = colpoFinto.membri.length
      if (rapina === 'presi') { const m = Math.min(contoFinto.pzk * 0.2, 5000); contoFinto.pzk -= m; contoFinto.galera = ora + 6 * 36e5; colpoFinto = { ...colpoFinto, stato: 'fatto', esito: { ok: false, ore: 6, multa: m } } }
      else { const q = Math.min((cassaFinta * (0.03 + 0.01 * n)) / n, 15000); cassaFinta -= q * n; contoFinto.pzk += q; contoFinto.sporchi = (contoFinto.sporchi ?? 0) + q; colpoFinto = { ...colpoFinto, stato: 'fatto', esito: { ok: true, quota: q, bottino: q * n } } }
    } else if (op === 'stato' && colpoFinto?.stato === 'aperto' && colpoFinto.membri.length === 1 && (giriColpo = (giriColpo ?? 0) + 1) > 1) colpoFinto.membri.push({ nome: 'mario', ind: 'pzk111111' })
    if (op === 'entra' && !colpoFinto) return { ok: false, errore: 'nessun colpo aperto con questo codice' }
    const r = ok({ colpo: colpoFinto, cassa: cassaFinta })
    contoFinto.puliti = contoFinto.pzk - (contoFinto.sporchi ?? 0)
    return r
  }
  if (a === 'cauzione') { if (!(contoFinto.galera > Date.now())) return { ok: false, errore: 'non sei in galera' }; contoFinto.pzk -= 3000; delete contoFinto.galera; contoFinto.mosse.push({ t: Date.now(), tipo: 'cauzione', n: 3000 }); return ok({ fatto: { cauzione: 3000 } }) }
  if (a === 'pin') return body.vecchio === '1234' ? ok() : { ok: false, errore: 'il PIN di adesso è sbagliato' }
  if (a === 'indirizzo') { contoFinto.mosse.push({ t: Date.now(), tipo: 'indirizzo', da: contoFinto.ind, a: 'pzk' + body.nuovo }); contoFinto.ind = 'pzk' + body.nuovo; contoFinto.indCambiato = true; return ok() }
  return ok()
}
// il database dei giocatori finto (api/giocatori.mjs): dodici giocatori, le notizie di ogni tipo, il mio profilo coi rivali
const GIOCATORI = ['mario', 'giulia', 'Bartolomeo Pecchinix', 'nutria92', 'la sciura', 'Gonzaga IV', 'pino', 'ale', 'fede', 'zio tom', 'rana', 'lu'].map((nome, i) => ({
  pos: i + 1, ind: 'pzk' + String(100001 + i), nome, liv: 14 - i, titolo: ['il re del Mincio', 'pescatrice', 'collezionista', 'sindacalista', 'la più vecchia', 'nobile', 'pino', 'ale', 'fede', 'zio', 'rana', 'lu'][i], av: ['bot', 'nutria', 'av-gonzaga', 'nutria', 'av-nonna', 'av-gonzaga', 'bot-ride', 'piccione', 'rana', 'bot', 'rana', 'zucca'][i], mest: i % 3 ? 'rider' : 'pescatore',
}))
const profiloFinto = (g) => ({ ...g, pr: { av: g.av, col: 'blu', mot: g.pos === 3 ? 'chi va piano va sano e va lontano, ma chi va forte arriva prima' : '' }, xp: 60 * (g.liv - 1) ** 2 + 40, xpProssimo: 60 * g.liv ** 2, giocatori: GIOCATORI.length, gal: g.pos === 4 ? Date.now() + 36e5 : null, creato: Date.now() - (g.pos + 2) * 864e5, ult: Date.now() - g.pos * 6e5,
  s: { pescati: 120 - g.pos * 7, cacciati: 30, scavati: 12, quizGiusti: 44, quizTotali: 60, sfideFatte: 18, missioniFatte: 3, morti: 2, giri: 310 }, posizioni: { pzk: { pos: g.pos, valore: 90000 - g.pos * 5000 }, xp: { pos: g.pos + 1, valore: 9000 }, pescati: { pos: 2, valore: 120 } }, rari: g.pos === 1 ? ['carpa-oro', 'drago'] : [], pzk: 90000 - g.pos * 5000, sp: g.pos === 2 ? 12000 : 0, serie: 5 })
function giocatoriFinto(u, metodo) {
  const p = u.searchParams
  if (metodo === 'POST') return { ok: true, profilo: { ...profiloFinto({ ...GIOCATORI[6], nome: 'prova', ind: 'pzk000001' }) }, vicini: { io: 1800, su: { ...GIOCATORI[5], valore: 2100 }, giu: { ...GIOCATORI[7], valore: 1500 } } }
  if (p.has('top')) return { ok: true, top: GIOCATORI.map((g) => ({ ...g, valore: 90000 - g.pos * 5000 })), giocatori: 12 }
  if (p.has('cerca')) { const q = p.get('cerca').toLowerCase(); return { ok: true, trovati: GIOCATORI.filter((g) => g.nome.toLowerCase().includes(q) || g.ind.includes(q)) } }
  if (p.has('ind')) { const g = GIOCATORI.find((x) => x.ind === p.get('ind')); return g ? { ok: true, profilo: profiloFinto(g) } : { ok: false, errore: 'nessuno a questo indirizzo' } }
  if (p.has('stats')) return { ok: true, stats: { giocatori: 12, attivi24h: 7, attivi7g: 11, pzk: 812345, livelloMedio: 8.5, pescati: 1400, quizGiusti: 520, sfideFatte: 210, missioniFatte: 33 } }
  if (p.has('notizie')) { const t = Date.now(); return { ok: true, notizie: [['livello', 14], ['leggenda', 'drago'], ['vincita', 12500], ['mestiere', 'rider'], ['sfide', 30], ['missione', 3], ['quiz', 8], ['serie', 21], ['nuovo', null], ['rapina', { n: 3, bottino: 45000 }], ['retata', { n: 2 }], ['lumaca', { pct: -12.5, titolo: 'la grande alluvione del Mincio' }]].map(([tipo, dato], i) => ({ t: t - i * 7e5, nome: GIOCATORI[i % 12].nome, ind: GIOCATORI[i % 12].ind, tipo, dato })) } }
  return { ok: false, errore: 'richiesta sbagliata' }
}
const server = createServer(async (req, res) => {
  if (finto && req.url.startsWith('/api/borsa')) { // la borsa finta: un'onda lenta con un po' di rumore
    res.setHeader('Content-Type', 'application/json')
    const da = new URL(req.url, 'http://x').searchParams.get('da') ?? '24h', ore = { '24h': 24, '7g': 168, '30g': 720, tutto: 1500 }[da] ?? 24, n = 80, ora = Date.now()
    const punti = Array.from({ length: n }, (_, i) => { const t = ora - (ore * 36e5 * (n - 1 - i)) / (n - 1); return [t, 0.0123 * (1 + 0.08 * Math.sin(i / 9) + 0.03 * Math.sin(i * 1.7) + i * 0.001)] })
    const v = punti.at(-1)[1]
    return res.end(JSON.stringify({ ok: true, tasso: v, inverso: 1 / v, t: ora, nata: ora - 40 * 864e5, var24: 0.0123, var7g: -0.034, var30g: 0.21, punti, cap: { pzk: 812345, conti: 12 } }))
  }
  if (finto && req.url.startsWith('/api/giocatori')) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(giocatoriFinto(new URL(req.url, 'http://x'), req.method))) }
  if (finto && req.url.startsWith('/api/wallet')) {
    res.setHeader('Content-Type', 'application/json')
    const u = new URL(req.url, 'http://x')
    if (req.method === 'GET') { const ind = u.searchParams.get('ind'); return res.end(JSON.stringify(ind === 'pzk999999' ? { ok: false, errore: 'nessun conto a questo indirizzo' } : { ok: true, conto: { nome: 'mario', ind } })) }
    let b = ''; for await (const x of req) b += x
    let body = {}; try { body = JSON.parse(b) } catch {}
    return res.end(JSON.stringify(walletFinto(body)))
  }
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
await mkdir(LAVORO, { recursive: true })
const puppeteer = browser.puppeteer()
// --software: il WebGL di SwiftShader (lento: un fotogramma al secondo, le foto arrivano dopo un minuto l'una); di serie si
// chiede la scheda video vera (ANGLE su Direct3D 11), che in headless su Windows di solito c'è
const software = process.argv.includes('--software')
const gpu = software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--use-angle=d3d11', '--enable-unsafe-swiftshader']
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', ...gpu] })
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  const page = await aperto.newPage()
  await page.setViewport(misura[1] ? { width: misura[0], height: misura[1], deviceScaleFactor: 1 } : telefono ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : larga ? { width: 1920, height: 1080, deviceScaleFactor: 1 } : soloMuro ? { width: 1440, height: 900, deviceScaleFactor: 4 } : { width: 1440, height: 900, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.log('  [errore]', e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn' || process.argv.includes('--debug')) console.log(`  [${m.type()}]`, m.text().slice(0, 200)) })
  page.on('response', (r) => { if (r.status() === 404) console.log('  [404]', r.url()) })
  await page.goto('about:blank')
  console.log('webgl:', await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return 'niente'; const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }))
  // lo zaino con «zero» e il conto finto, prima che la pagina parta
  await page.evaluateOnNewDocument((suoniAccesi, peggiori, senzaConto) => {
    const zaino = { v: 1, t: 0, xp: peggiori ? 987654 : 300, ...(peggiori && { profilo: { av: 'av-gonzaga', avs: ['av-gonzaga'], col: 'blu', cor: 'pixel', mot: 'chi va piano va sano e va lontano, ma chi va forte arriva prima' } }), mestiere: null, turni: 0, oggetti: { zero: 1, canna: 1 }, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] }
    sessionStorage.setItem('pzkko-chat-sessione', JSON.stringify(zaino))
    localStorage.setItem('pzkko-chat', JSON.stringify({ ind: 'pzk000001', zaino, visto: 0 }))
    if (!senzaConto) localStorage.setItem('pzkko-wallet', JSON.stringify({ token: 'prova.prova', conto: { ind: 'pzk000001', nome: peggiori ? 'Bartolomeo Pecchinix' : 'prova', pzk: peggiori ? 987654321 : 52340, ...(peggiori && { creato: Date.UTC(2026, 9, 1), sporchi: 123456 }), eur: 0, mosse: [], t: Date.now() }, tasso: 1, t: Date.now() }))
    localStorage.setItem('pzkko-benvenuto', JSON.stringify({ versione: 99 }))
    if (!location.search.includes('guida')) localStorage.setItem('pzkko-zero-guida', 'si')
    // i suoni: si contano gli oscillatori che nascono (ogni suono di suono/interfaccia.js ne fa almeno uno)
    localStorage.setItem('pzkko-suono', suoniAccesi ? 'si' : 'no')
    const AC = window.AudioContext
    if (AC) { const crea = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { if (/interfaccia.js/.test(new Error().stack ?? '')) window.__oscillatori = (window.__oscillatori ?? 0) + 1; return crea.call(this) } } // (solo i suoni di suono/interfaccia.js: la musica e la strada ne fanno di continuo)
  }, suoni, peggiori, senzaConto)

  await page.goto(`${base}/?muro=1&chat&ora=${ora}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('.chat-tasto.zero', { timeout: 30000 })
  await page.waitForSelector('.chat-tasto.zero.os', { timeout: 30000 }).catch(() => console.log('  (pzk os sul muro non è partito)'))
  await dorm(1500)
  const tasto = await page.$('.chat-tasto')
  await tasto.scrollIntoViewIfNeeded?.()
  const r = await tasto.boundingBox()
  await page.screenshot({ path: join(LAVORO, 'prova-muro.png'), clip: { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 40), width: r.width + 80, height: r.height + 80 } })
  console.log('tasto', JSON.stringify(r))
  if (soloMuro) { await tasto.screenshot({ path: join(LAVORO, 'prova-tasto.png') }); await page.evaluate(() => { document.querySelector('.chat-tasto .ct-lcd').style.visibility = 'hidden' }); await tasto.screenshot({ path: join(LAVORO, 'prova-tasto-nudo.png') }); console.log('prova-tasto.png e prova-tasto-nudo.png (4×)'); await aperto.close(); server.close(); process.exit(0) }
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
  const t0 = Date.now()
  if (process.argv.includes('--debug')) console.log('apri:', await page.evaluate(() => import('/telefono/telefono.js').then((t) => t.apri(null, { da: document.querySelector('.chat-tasto') })).then(() => 'ok', (e) => 'ERRORE ' + (e.stack || e))))
  else { await page.mouse.down(); await page.mouse.up() }
  await page.waitForFunction(() => document.querySelector('.tel.zero')?.open, { timeout: 30000 })
  // il volo: a metà strada (il modello è già in cache: parte subito)
  await page.waitForFunction(() => !document.querySelector('.tel.zero')?.classList.contains('zoom-nascosto') || document.querySelector('.z-tela')?.classList.contains('ombra') === false, { timeout: 30000 }).catch(() => {})
  await dorm(150)
  await page.screenshot({ path: join(LAVORO, 'prova-volo.png') })
  await page.waitForFunction(() => { const d = document.querySelector('.tel.zero'); return d?.open && !d.classList.contains('zoom') }, { timeout: 30000 })
  await page.mouse.move(Math.round(r.x * 0.3), Math.round(r.y * 0.4)) // (il mouse in alto a sinistra: il cercapersone s'inclina verso di lui)
  await dorm(450)
  console.log('aperto dopo', Date.now() - t0, 'ms')
  console.log('dialog:', await page.evaluate(() => document.querySelector('.tel')?.className))
  if (process.argv.includes('--sonda')) {
    console.log('fascia a x 26,5 (y → z della superficie, pezzo):', await page.evaluate(() => { const r = []; for (let y = 3; y >= -5.5; y -= 0.25) { const h = window.pzkkoZero.sonda([26.5, y, 60], [0, 0, -1]); r.push(y + ':' + (h ? h.p[2] + ' ' + h.nome : '-')) } return r.join('  ') }))
    console.log('testata (righe y 16→3, colonne z −12→−4, passo 0,25; # = la faccia a x≈76, . = dentro il buco):')
    console.log(await page.evaluate(() => { const r = []; for (let y = 16; y >= 3; y -= 0.25) { let s = y.toFixed(2).padStart(6) + ' '; for (let z = -12; z <= -4; z += 0.25) { const h = window.pzkkoZero.sonda([95, y, z], [-1, 0, 0]); s += !h ? ' ' : h.p[0] > 75.6 ? '#' : h.p[0] > 70 ? ':' : '.' } r.push(s) } return r.join(String.fromCharCode(10)) }))
  }
  if (process.argv.includes('--debug')) { console.log('scritta:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.scritta?.()))); await dorm(300); await page.screenshot({ path: join(LAVORO, 'prova-porta.png'), clip: { x: 1500, y: 380, width: 420, height: 420 } }); await page.screenshot({ path: join(LAVORO, 'prova-fascia.png'), clip: { x: 300, y: 700, width: 900, height: 220 } }); console.log('scritta +3:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.scritta?.(3)))); await dorm(300); await page.screenshot({ path: join(LAVORO, 'prova-fascia3.png'), clip: { x: 300, y: 700, width: 900, height: 220 } }); await page.evaluate(() => window.pzkkoZero?.scritta?.(-3)) }
  if (process.argv.includes('--debug')) { // il tasto OK premuto col mouse e tenuto: deve restare giù e scuro finché non si lascia
    const ok = await page.evaluate(() => window.pzkkoZero?.dove?.('ok'))
    if (ok) { await page.mouse.move(ok.x, ok.y); await page.mouse.down(); await dorm(400); await page.screenshot({ path: join(LAVORO, 'prova-ok-giu.png'), clip: { x: ok.x - 260, y: ok.y - 230, width: 560, height: 460 } }); await page.mouse.up(); await dorm(400); await page.screenshot({ path: join(LAVORO, 'prova-ok-su.png'), clip: { x: ok.x - 260, y: ok.y - 230, width: 560, height: 460 } }); console.log('ok premuto e lasciato:', JSON.stringify(ok)) }
  }
  if (process.argv.includes('--debug')) console.log('rig:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.debug?.())), 'url:', await page.evaluate(() => location.search))
  if (process.argv.includes('--debug')) console.log('luce:', await page.evaluate(() => import('/telefono/zero/luce.js').then((l) => { const s = l.stato(); return JSON.stringify({ ora: new Date(window.pzkkoOrologio?.adesso?.() ?? 0).toString().slice(16, 24), pagina: window.pzkkoPagina?.luci, giorno: s.giorno, buio: s.buio, notte: s.notte, el: s.sole.el, lampioni: s.lampioni }) })))
  await page.screenshot({ path: join(LAVORO, 'prova-aperto.png') })
  await dorm(1400)
  await page.screenshot({ path: join(LAVORO, 'prova-cavo.png') })
  if (!app && !rider) { // (collaudando un'app sola, il giro di sempre no: senza conto finirebbe a scrivere nell'account)
  // pzk os: OK apre il menu, OK apre la chat (la prima), poi i comandi veri dalla tastiera
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-menu.png') })
  await page.keyboard.press('ArrowDown'); await dorm(200); await page.keyboard.press('ArrowUp'); await dorm(200)
  await page.keyboard.press('Enter'); await dorm(1200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat.png') })
  await page.keyboard.type('saldo', { delay: 40 }); await dorm(400)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-scrive.png') })
  await page.keyboard.press('Enter'); await dorm(2200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-saldo.png') })
  await page.keyboard.type('aiuto', { delay: 30 }); await page.keyboard.press('Enter'); await dorm(2200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-aiuto.png') })
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await dorm(300)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-su.png') })
  await page.keyboard.type('pesca', { delay: 30 }); await page.keyboard.press('Enter'); await dorm(3500)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-pesca.png') })
  await page.keyboard.type('compra ', { delay: 30 }); await dorm(400)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-sugg.png') })
  await page.keyboard.press('Backspace', { delay: 20 }); await dorm(200)
  await page.keyboard.press('Escape'); await dorm(300) // INDIETRO: cancella la riga
  await page.keyboard.press('Escape'); await dorm(500) // INDIETRO: esce dalla chat
  await page.screenshot({ path: join(LAVORO, 'prova-indietro.png') })
  // le impostazioni (l'ultima voce del menu) e la guida
  await page.keyboard.press('ArrowUp'); await dorm(300)
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-impostazioni.png') })
  await page.keyboard.press('ArrowLeft'); await dorm(300) // la luminosità giù di una tacca
  await page.screenshot({ path: join(LAVORO, 'prova-luminosita.png') })
  await page.keyboard.press('ArrowRight'); await dorm(200)
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown'); await dorm(200)
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-guida.png') })
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await dorm(200) }
  await page.keyboard.press('Escape'); await dorm(200); await page.keyboard.press('Escape'); await dorm(400)
  }
  if (rider) {
    // IL TURNO DA RIDER (29.10, Alberto: «come faccio a premere quando faccio lavoro rider? le freccie non vanno per la
    // sequenza… metti per sicurezza anche il click del mouse»): assunto, «lavora», e la consegna rifatta con DUE FRECCE dalla
    // tastiera e DUE CLIC del mouse sul tasto disegnato nello schermo 3D. Il caso è fissato (Math.random 0,1) finché il gioco
    // non parte: il minigioco è quello del rider («strada») e le quattro svolte sono tutte «sinistra»
    const errori = []
    page.on('pageerror', (e) => errori.push('errore nella pagina: ' + e.message))
    const lcdPng = async (nome) => { const png = await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => { os.ridisegna(); return new Promise((r) => setTimeout(() => r(os.lcd.canvas.toDataURL('image/png')), 250)) })); await writeFile(join(LAVORO, `prova-rider-${nome}.png`), Buffer.from(png.split(',')[1], 'base64')) }
    await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.apri('chat'))); await dorm(1200)
    await page.keyboard.type('lavora come rider', { delay: 25 }); await page.keyboard.press('Enter'); await dorm(2500)
    const turni0 = await page.evaluate(() => import('/chat/zaino.js').then((z) => z.stato().turni ?? 0))
    await page.evaluate(() => { window.__random = Math.random; Math.random = () => 0.1 })
    await page.keyboard.type('lavora', { delay: 25 }); await page.keyboard.press('Enter')
    // si aspetta che compaiano i tre tasti della consegna (tre zone cliccabili larghe nella chat)
    let tasti = []
    for (let i = 0; i < 40 && tasti.length < 3; i++) { await dorm(250); tasti = await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.elencoZone().filter((z) => z.h >= 8 && z.w > 30 && z.y > 12))) }
    await page.evaluate(() => { Math.random = window.__random })
    if (tasti.length < 3) errori.push('i tasti della consegna non sono comparsi')
    await lcdPng('0-tasti')
    // due frecce dalla tastiera
    await page.keyboard.press('ArrowLeft'); await dorm(300); await lcdPng('1-freccia')
    await page.keyboard.press('ArrowLeft'); await dorm(300); await lcdPng('2-freccia')
    // due clic del mouse sul tasto «← sinistra»: il più a sinistra dell'ultima fila
    for (const n of [3, 4]) {
      const zz = await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.elencoZone().filter((z) => z.h >= 8 && z.w > 30 && z.y > 12)))
      const yMax = Math.max(...zz.map((z) => z.y)), z = zz.filter((q) => q.y === yMax).sort((a, b) => a.x - b.x)[0]
      if (!z) { errori.push('tasto da cliccare non trovato'); break }
      const p = await page.evaluate((x, y) => window.pzkkoZero.puntoLcd(x, y), z.x + z.w / 2, z.y + z.h / 2)
      await page.mouse.move(p.x, p.y); await dorm(150)
      const cursore = await page.evaluate(() => document.querySelector('.z-tela')?.style.cursor)
      if (cursore !== 'pointer') errori.push(`clic ${n}: sopra il tasto il puntatore non è la manina (${cursore || 'niente'})`)
      await page.mouse.click(p.x, p.y); await dorm(300); await lcdPng(`${n}-clic`)
    }
    await dorm(2500); await lcdPng('5-paga')
    const turni1 = await page.evaluate(() => import('/chat/zaino.js').then((z) => z.stato().turni ?? 0))
    if (turni1 !== turni0 + 1) errori.push(`il turno non è stato contato (turni ${turni0} → ${turni1})`)
    console.log(errori.length ? `RIDER: ${errori.length} problemi\n  - ` + errori.join('\n  - ') : `RIDER: tutto a posto (turni ${turni0} → ${turni1}); guarda prova-rider-*.png`)
    await page.keyboard.press('Escape'); await dorm(400)
  }
  if (app) {
    // IL COLLAUDO DI UN'APP (le regole: pzkko/telefono/zero/os/REGOLE.md): la si apre, si premono tutti e sei i tasti, e a
    // ogni passo si salva l'lcd pixel per pixel (prova-app-<id>-<n>-<tasto>.png, 768 × 384: lo schermo vero, senza 3D) e
    // si controlla da soli: niente inchiostro negli angoli stondati né fuori dal margine, nessun carattere senza glifo,
    // nessun errore nella pagina, il bip a ogni tasto (coi suoni accesi: --suoni), la vista che non resta appesa
    // --tasti=dx,dx,ok,giu…: una sequenza a scelta al posto di quella fissa (per vedere tutte le pagine di un'app)
    const TASTI = { su: 'ArrowUp', giu: 'ArrowDown', sx: 'ArrowLeft', dx: 'ArrowRight', ok: 'Enter', indietro: 'Escape', okvero: 'Control+Enter' } // (okvero: il tasto OK anche dove Invio va a capo, l'editor di «codice C»)
    // (e clic@80x121: un clic del mouse sul pixel 80, 121 dell'lcd, attraverso il 3D vero; scrivi@caf: testo dalla tastiera vera, + per lo spazio;
    // conta@pescati@5: lo zaino conta come dopo cinque pescate, per far avanzare sfide e quest; prendi@caffe@3: tre caffè nello zaino)
    const scelti = (process.argv.find((a) => a.startsWith('--tasti=')) ?? '').slice(8).split(',').filter((k) => TASTI[k] || /^clic@\d+x\d+$/.test(k) || /^scrivi@[\w+]+$/.test(k) || /^(conta|prendi)@[\w-]+@\d+$/.test(k))
    const passo = (k) => (TASTI[k] ? [k, TASTI[k]] : k.startsWith('scrivi@') ? [k.replace('@', '-'), { scrivi: k.slice(7) }] : k.startsWith('conta@') ? [k.split('@').join('-'), { conta: [k.split('@')[1], Number(k.split('@')[2])] }] : k.startsWith('prendi@') ? [k.split('@').join('-'), { prendi: [k.split('@')[1], Number(k.split('@')[2])] }] : [k.replace('@', '-'), { clic: k.slice(5).split('x').map(Number) }])
    const passi = scelti.length ? [['apri', null], ...scelti.map(passo)] : [['apri', null], ['giu', 'ArrowDown'], ['giu', 'ArrowDown'], ['su', 'ArrowUp'], ['dx', 'ArrowRight'], ['sx', 'ArrowLeft'], ['ok', 'Enter'], ['ok', 'Enter'], ['indietro', 'Escape'], ['indietro', 'Escape'], ['indietro', 'Escape']]
    const errori = []
    page.on('pageerror', (e) => errori.push('errore nella pagina: ' + e.message))
    await page.evaluate(async () => {
      const [os, font] = await Promise.all([import('/telefono/zero/os/os.js'), import('/telefono/zero/os/font.js')])
      window.__collaudo = { glifi: new Set(), nulle: 0, larghi: new Set() }
      // un'icona che non c'è: icone.bitmap torna null e al suo posto resta un buco
      const bm = os.lcd.bitmap.bind(os.lcd)
      os.lcd.bitmap = (b, ...r) => { if (!b) window.__collaudo.nulle++; return bm(b, ...r) }
      const testo = os.lcd.testo.bind(os.lcd)
      // un testo più largo del suo spazio (anche se poi il ritaglio lo taglia in silenzio): fuori dal margine di 6 pixel
      const { Lcd } = await import('/telefono/zero/os/lcd.js')
      os.lcd.testo = (x, y, s, o) => { for (const ch of String(s)) if (!font.esiste(ch)) window.__collaudo.glifi.add(ch); const w = Lcd.larghezza(s, o?.scala ?? 1); if (window.__collaudo.misura && y >= os.BARRA && (x < os.MARGINE - 2 || x + w > os.W - os.MARGINE + 2)) window.__collaudo.larghi.add(String(s).slice(0, 40)); return testo(x, y, s, o) }
    })
    const controlla = () => page.evaluate(async () => {
      const os = await import('/telefono/zero/os/os.js'), { W, H, BARRA, MARGINE } = os, fb = os.lcd.fb
      await new Promise((r) => setTimeout(r, 250)) // (le webp di riserva fanno in tempo ad arrivare)
      window.__collaudo.nulle = 0
      window.__collaudo.misura = true // (i testi larghi si contano solo qui, a pagina ferma: mentre scorre di lato sono spostati apposta)
      os.ridisegna(); await new Promise((r) => setTimeout(r, 250))
      window.__collaudo.misura = false
      const fuori = { angoli: 0, margine: 0, dove: [] }
      // gli angoli dello schermo sono stondati (2,2 mm: un quarto d'ellisse di 15 × 13 pixel): lì l'inchiostro non si vede
      const RX = 15, RY = 13
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!fb[y * W + x]) continue
        const cx = x < RX ? RX : x >= W - RX ? W - 1 - RX : null, cy = y < RY ? RY : y >= H - RY ? H - 1 - RY : null
        if (cx !== null && cy !== null && ((x - cx) / RX) ** 2 + ((y - cy) / RY) ** 2 > 1) { fuori.angoli++; if (fuori.dove.length < 6) fuori.dove.push(x + ',' + y) }
        else if (y >= BARRA && (x < MARGINE - 2 || x >= W - MARGINE + 2)) { fuori.margine++; if (fuori.dove.length < 6) fuori.dove.push(x + ',' + y) } // (2 px di tolleranza: le cornici dei dialoghi)
      }
      const v = os.corrente()
      return { vista: v?.nome ?? '?', app: v?.app ?? '', fuori, nulle: window.__collaudo.nulle, glifi: [...window.__collaudo.glifi], png: os.lcd.canvas.toDataURL('image/png') }
    })
    await page.evaluate(() => { window.__oscillatori = 0 })
    let ultimaVista = ''
    for (const [i, [nome, k]] of passi.entries()) {
      if (nome === 'indietro' && i > 0 && ultimaVista === 'home' && !scelti.length) continue
      const prima = await page.evaluate(() => window.__oscillatori ?? 0)
      const accesiPrima = await page.evaluate(() => localStorage.getItem('pzkko-suono') === 'si')
      const giaAperta = !k && (await page.evaluate((a) => import('/telefono/zero/os/os.js').then((os) => os.corrente()?.app === a), app)) // (già aperta da sola, come l'account senza conto: la sigla è già suonata) // (se il collaudo li ha appena spenti dalle impostazioni, il silenzio è giusto)
      if (k?.conta) await page.evaluate(([s, n]) => import('/chat/zaino.js').then((z) => z.conta(s, n)), k.conta)
      else if (k?.prendi) await page.evaluate(([s, n]) => import('/chat/zaino.js').then((z) => z.aggiungi(s, n)), k.prendi)
      else if (k?.scrivi) await page.keyboard.type(k.scrivi.replaceAll('+', ' '), { delay: 40 }) // (scrivi@mine+50: il + è lo spazio)
      else if (k?.clic) { const p = await page.evaluate((x, y) => window.pzkkoZero.puntoLcd(x, y), ...k.clic); await page.mouse.click(p.x, p.y) }
      else if (k === 'Control+Enter') { await page.keyboard.down('Control'); await page.keyboard.press('Enter'); await page.keyboard.up('Control') }
      else if (k) await page.keyboard.press(k)
      else await page.evaluate((a) => import('/telefono/zero/os/os.js').then((os) => os.apri(a)), app)
      await dorm(k ? 450 : 1500)
      const r = await controlla()
      const suono = (await page.evaluate(() => window.__oscillatori ?? 0)) - prima
      ultimaVista = r.vista
      await writeFile(join(LAVORO, `prova-app-${app}-${i}-${nome}.png`), Buffer.from(r.png.split(',')[1], 'base64'))
      console.log(`  ${i} ${nome.padEnd(8)} → ${r.vista}${r.app ? ' (' + r.app + ')' : ''}  angoli ${r.fuori.angoli}  margine ${r.fuori.margine}  icone mancanti ${r.nulle}  suono ${suono}`)
      if (r.nulle) errori.push(`${i} ${nome}: ${r.nulle} icone che non ci sono (icone.bitmap → null: manca il nome in os/icone.js)`)
      if (r.fuori.angoli) errori.push(`${i} ${nome}: ${r.fuori.angoli} pixel negli angoli stondati (${r.fuori.dove.join(' ')})`)
      if (r.fuori.margine) errori.push(`${i} ${nome}: ${r.fuori.margine} pixel fuori dal margine (${r.fuori.dove.join(' ')})`)
      if (suoni && accesiPrima && !suono && !giaAperta && !k?.scrivi && !k?.conta && !k?.prendi) // (le lettere della tastiera vera e i conti dello zaino non suonano) errori.push(`${i} ${nome}: nessun suono`)
      if (i === 0 && r.app !== app && r.vista !== 'presto') errori.push(`l'app ${app} non si è aperta (c'è ${r.vista})`)
    }
    const larghi = await page.evaluate(() => [...window.__collaudo.larghi])
    if (larghi.length) errori.push('testi più larghi dello schermo: ' + larghi.map((t) => JSON.stringify(t)).join(' '))
    const glifi = await page.evaluate(() => [...window.__collaudo.glifi])
    if (glifi.length) errori.push('caratteri senza glifo in font.js: ' + glifi.map((c) => JSON.stringify(c)).join(' '))
    await page.screenshot({ path: join(LAVORO, `prova-app-${app}.png`) })
    console.log(errori.length ? `COLLAUDO ${app}: ${errori.length} problemi\n  - ` + errori.join('\n  - ') : `COLLAUDO ${app}: tutto a posto`)
  }
  // la chiusura: fuori dal cercapersone (un clic sulla tela dove non c'è il cercapersone); sul cellulare, CHIUDI nella barra
  if (telefono) await page.click('.t-nav [data-t="chiudi"]'); else await page.mouse.click(30, 30)
  await dorm(1000)
  await page.screenshot({ path: join(LAVORO, 'prova-saluto.png') })
  await dorm(2600)
  await page.screenshot({ path: join(LAVORO, 'prova-chiuso.png') })
  console.log('foto in', LAVORO)
} finally {
  await aperto.close()
  server.close()
}
