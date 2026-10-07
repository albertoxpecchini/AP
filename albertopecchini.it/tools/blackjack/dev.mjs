// Server di sviluppo del blackjack di pzkko.it: serve la cartella pzkko/ come
// fa Vercel (URL puliti, barra finale) e passa /api/blackjack/ alla funzione
// vera, con l'archivio in memoria. Con --bot N mette al tavolo N giocatori
// finti che entrano dall'API come farebbe un amico dal telefono e giocano con
// la strategia di base, così si vede il tavolo vivo anche da soli.
//
//   node tools/blackjack/dev.mjs                 http://localhost:5190/games/blackjack/
//   node tools/blackjack/dev.mjs --bot 4         quattro amici finti al tavolo
//   node tools/blackjack/dev.mjs --port 5191
//   node tools/blackjack/dev.mjs --redis         archivio Redis vero di .env.local, su chiavi a parte (bj-prova:*)
//
// La chiave di amministrazione è BJ_ADMIN_KEY di .env.local; se manca, qui
// vale «prova-locale» (solo in memoria, mai online).
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const qui = path.dirname(fileURLToPath(import.meta.url))
const radice = path.resolve(qui, '../..')
const pubblica = path.join(radice, 'pzkko')
const args = process.argv.slice(2)
const opz = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)
const PORT = Number(opz('--port', 5190))
const BOT = Math.min(5, Number(opz('--bot', 0)) || 0)

// .env.local come fa il plugin api-dev: le variabili già presenti vincono
try {
  for (const riga of fs.readFileSync(path.join(radice, '.env.local'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(riga)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}
if (args.includes('--redis')) {
  process.env.BJ_KEY_PREFIX = process.env.BJ_KEY_PREFIX || 'bj-prova'
  if (!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)) {
    console.error('--redis: mancano KV_REST_API_URL e KV_REST_API_TOKEN in .env.local')
    process.exit(1)
  }
} else process.env.BJ_STORE = 'memory'
if (!process.env.BJ_ADMIN_KEY) process.env.BJ_ADMIN_KEY = 'prova-locale'

const { default: api } = await import('../../api/blackjack.js')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
}

function statico(req, res, urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0])
  if (p.includes('..')) return rispondi(res, 400, 'no')
  // URL puliti con barra finale, come vercel.json: /games/blackjack/ → index.html
  if (p.endsWith('/')) p += 'index.html'
  else if (!path.extname(p)) {
    if (fs.existsSync(path.join(pubblica, p, 'index.html'))) {
      res.writeHead(308, { Location: p + '/' })
      return res.end()
    }
    if (fs.existsSync(path.join(pubblica, p + '.html'))) p += '.html'
  }
  const file = path.join(pubblica, p)
  if (!file.startsWith(pubblica) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const f404 = path.join(pubblica, '404.html')
    res.writeHead(404, { 'Content-Type': MIME['.html'] })
    return res.end(fs.existsSync(f404) ? fs.readFileSync(f404) : 'non trovato')
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}

const rispondi = (res, code, testo) => {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(testo)
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/'
  if (/^\/api\/blackjack\/?(\?|$)/.test(url)) {
    try {
      await api(req, res)
    } catch (e) {
      console.error(e)
      rispondi(res, 500, 'errore')
    }
    return
  }
  if (url.startsWith('/api/')) return rispondi(res, 404, 'solo /api/blackjack/ qui')
  statico(req, res, url)
})

server.listen(PORT, '0.0.0.0', () => {
  const rete = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address)
  console.log(`blackjack di pzkko, archivio ${process.env.BJ_STORE === 'memory' ? 'in memoria' : 'Redis (' + process.env.BJ_KEY_PREFIX + ')'}`)
  console.log(`  Local:    http://localhost:${PORT}/games/blackjack/`)
  for (const ip of rete) console.log(`  Network:  http://${ip}:${PORT}/games/blackjack/`)
  console.log(`  admin:    http://localhost:${PORT}/games/blackjack/admin/  (chiave: ${process.env.BJ_ADMIN_KEY})`)
  if (BOT) avviaBot(BOT).catch((e) => console.error('bot:', e))
})

// ── Amici finti ──────────────────────────────────────────────────────────────

const API = `http://localhost:${PORT}/api/blackjack/`
const NOMI = ['ada', 'bea', 'cri', 'dan', 'eva']
const dormi = (ms) => new Promise((r) => setTimeout(r, ms))
const aCaso = (a, b) => a + Math.random() * (b - a)

async function chiama(body) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}

const val = (c) => {
  const r = c.slice(0, -1)
  return r === 'A' ? 11 : 'JQK'.includes(r) || r === '10' ? 10 : Number(r)
}
function tot(carte) {
  let t = 0
  let assi = 0
  for (const { c } of carte) {
    const v = val(c)
    t += v
    if (v === 11) assi++
  }
  while (t > 21 && assi) {
    t -= 10
    assi--
  }
  return { t, morbida: assi > 0 }
}

/** Strategia di base (semplificata) contro la carta scoperta del banco. */
function mossa(mano, banco, puoDividere, puoRaddoppiare) {
  const { t, morbida } = tot(mano.carte)
  const b = val(banco)
  const r1 = mano.carte[0].c.slice(0, -1)
  if (puoDividere) {
    if (r1 === 'A' || r1 === '8') return 'dividi'
    if (r1 === '9' && b >= 2 && b <= 9 && b !== 7) return 'dividi'
    if (['2', '3', '7'].includes(r1) && b <= 7) return 'dividi'
    if (r1 === '6' && b <= 6) return 'dividi'
  }
  if (morbida) {
    if (t >= 19) return 'stai'
    if (t === 18) return b >= 9 ? 'carta' : puoRaddoppiare && b >= 3 && b <= 6 ? 'raddoppia' : 'stai'
    if (puoRaddoppiare && b >= 4 && b <= 6) return 'raddoppia'
    return 'carta'
  }
  if (t >= 17) return 'stai'
  if (t >= 13) return b <= 6 ? 'stai' : 'carta'
  if (t === 12) return b >= 4 && b <= 6 ? 'stai' : 'carta'
  if (t === 11 && puoRaddoppiare) return 'raddoppia'
  if (t === 10 && puoRaddoppiare && b <= 9) return 'raddoppia'
  if (t === 9 && puoRaddoppiare && b >= 3 && b <= 6) return 'raddoppia'
  return 'carta'
}

async function avviaBot(n) {
  await dormi(500)
  const bot = []
  for (let i = 0; i < n; i++) {
    const e = await chiama({ a: 'entra', nome: NOMI[i] })
    if (!e.ok) {
      console.error('bot', NOMI[i], e.error)
      continue
    }
    await chiama({ a: 'ammin', key: process.env.BJ_ADMIN_KEY, cmd: 'dai', chi: NOMI[i], quanti: 1000 })
    const s = await chiama({ a: 'siedi', tok: e.io.tok })
    bot.push({ nome: NOMI[i], tok: e.io.tok, id: e.io.id, posto: s.io ? s.io.posto : null, occupato: false, puntato: 0 })
    console.log(`bot ${NOMI[i]} al tavolo con 1000 $pzk`)
  }
  setInterval(() => bot.forEach((b) => chiama({ a: 'ping', tok: b.tok }).catch(() => {})), 25000)
  for (;;) {
    await dormi(700)
    let st
    try {
      st = await (await fetch(API)).json()
    } catch {
      continue
    }
    if (!st.ok) continue
    for (const b of bot) {
      if (b.occupato) continue
      const posto = st.posti.findIndex((p) => p && p.id === b.id)
      if (posto < 0) {
        // si è alzato (assenza): si risiede
        b.occupato = true
        chiama({ a: 'siedi', tok: b.tok }).finally(() => (b.occupato = false))
        continue
      }
      const p = st.posti[posto]
      if ((st.fase === 'attesa' || st.fase === 'puntate') && !p.puntata && !p.salta && b.puntato !== st.mano + 1) {
        b.occupato = true
        b.puntato = st.mano + 1
        const fiche = [5, 10, 25, 50, 100][Math.floor(Math.random() * 5)]
        dormi(aCaso(800, 4000))
          .then(() => chiama(p.pzk >= fiche ? { a: 'punta', tok: b.tok, importo: Math.min(fiche, p.pzk) } : { a: 'salta', tok: b.tok }))
          .finally(() => (b.occupato = false))
      } else if (st.fase === 'turno' && st.turno && st.turno.posto === posto) {
        const m = p.mani[st.turno.mano]
        if (!m || m.stato !== 'gioca') continue
        const due = m.carte.length === 2
        const puoRad = due && p.pzk >= m.puntata
        const puoDiv = due && p.mani.length === 1 && p.pzk >= m.puntata && val(m.carte[0].c) === val(m.carte[1].c)
        const mo = mossa(m, st.banco.carte[0].c, puoDiv, puoRad)
        b.occupato = true
        dormi(aCaso(900, 3500))
          .then(() => chiama({ a: 'gioca', tok: b.tok, mossa: mo }))
          .then((r) => {
            if (!r.ok && r.error !== 'non è il tuo turno') console.log(`bot ${b.nome}: ${mo} → ${r.error}`)
          })
          .finally(() => (b.occupato = false))
      }
    }
  }
}
