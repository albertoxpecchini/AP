// Dev server dei siti col loro dominio, accanto a `npm run dev` (albertopecchini.it, :5173):
//
//   npm run dev:bcp    → bettercallpekko.it su :5181 (Vite con SITE=bcp, database delle visite in memoria)
//   npm run dev:pzkko  → pzkko.it su :5182 (la cartella pzkko/ così com'è, si ricarica a ogni modifica)
//
// Porte fisse perché gli indirizzi inoltrati di VS Code (pannello Porte) restino validi. Come
// `npm run dev`: in ascolto su tutte le interfacce, con l'indirizzo Local e quello Network.
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

// bettercallpekko.it è il sito Vite con SITE=bcp. La variabile va messa prima che Vite
// carichi vite.config.js: site-pages e src/data/assistenza.js la leggono all'import.
// BCP_STORE=memory vince sulla chiave del Blob in .env.local: in locale non si scrive
// mai nel database vero. Cache delle dipendenze a parte, per non disturbare `npm run dev`.
const bcp = async (port) => {
  Object.assign(process.env, { SITE: 'bcp', BCP_STORE: 'memory' })
  const { createServer } = await import('vite')
  const dev = await createServer({ root: ROOT, cacheDir: 'node_modules/.vite-bcp', server: { port, strictPort: true } })
  await dev.listen()
  dev.printUrls()
  dev.bindCLIShortcuts({ print: true })
}

// pzkko.it non ha build: va online la cartella così com'è. Niente Vite, che riscrive
// `new URL('.', import.meta.url)` dei giochi senza la barra finale (roulette e blackjack
// non trovano più i loro file): un server di file che fa come Vercel con pzkko/vercel.json
// (cleanUrls, trailingSlash, 404.html, intestazioni) e ricarica la pagina quando cambia un file.
const pzkko = (port) => {
  const root = path.join(ROOT, 'pzkko')
  // le pagine di prova di tools/pzkko/prove/<nome>.html, su /prova/<nome>/: un pezzo del sito da solo (la chat col bot),
  // con i file veri di pzkko/ (/chat/, /games/pzk.js, /art/, /fonts/, /api/); online non ci sono
  const prove = path.join(ROOT, 'tools/pzkko/prove')
  const { headers } = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
  const intestazioni = Object.fromEntries(headers.filter((h) => h.source === '/(.*)').flatMap((h) => h.headers.map((x) => [x.key, x.value])))
  const TIPI = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wasm': 'application/wasm',
    '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  }

  // Ricarica: le pagine ascoltano /__ricarica (server-sent events, passano anche dai tunnel).
  const RICARICA = '/__ricarica'
  const SCRIPT = `<script>new EventSource('${RICARICA}').onmessage = () => location.reload()</script>`
  const pagine = new Set()
  let attesa
  // Su Windows fs.watch segnala anche i semplici accessi in lettura: la pagina che si ricarica rilegge i suoi file, il
  // server li prende per modifiche e la ricarica ancora, ogni due secondi, all'infinito. Si ricarica solo se un file è
  // cambiato davvero: data di modifica e dimensione, a confronto con quelle viste l'ultima volta.
  const firma = (f) => { try { const s = fs.statSync(f); return s.isFile() ? `${s.mtimeMs}:${s.size}` : null } catch { return 'sparito' } }
  const visti = new Map()
  for (const dir of [root, prove]) if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir, { recursive: true })) { const p = path.join(dir, f), v = firma(p); if (v) visti.set(p, v) }
  for (const dir of [root, prove]) if (fs.existsSync(dir)) fs.watch(dir, { recursive: true }, (_, file) => {
    if (!file) return
    const p = path.join(dir, String(file)), v = firma(p)
    if (v === null || visti.get(p) === v) return // una cartella, o un file solo letto
    visti.set(p, v)
    clearTimeout(attesa)
    attesa = setTimeout(() => {
      for (const res of pagine) res.write('data: ricarica\n\n')
      console.log(`  ↻ ${String(file).replaceAll('\\', '/')}`)
    }, 80)
  })
  setInterval(() => { for (const res of pagine) res.write(': \n\n') }, 25_000)

  const invia = (res, status, file) => {
    let body = fs.readFileSync(file)
    if (file.endsWith('.html')) {
      const html = body.toString()
      const i = html.lastIndexOf('</body>')
      body = i < 0 ? html + SCRIPT : html.slice(0, i) + SCRIPT + html.slice(i)
    }
    res.writeHead(status, { ...intestazioni, 'Content-Type': TIPI[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' })
    res.end(body)
  }
  const esiste = (file) => fs.statSync(file, { throwIfNoEntry: false })?.isFile()
  const sposta = (res, dove) => res.writeHead(308, { Location: dove }).end()

  const server = http.createServer((req, res) => {
    const { pathname, search } = new URL(req.url, 'http://x')
    if (pathname === RICARICA) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' })
      res.write(': collegata\n\n')
      pagine.add(res)
      return req.on('close', () => pagine.delete(res))
    }
    // le funzioni di pzkko/api (come su Vercel: /api/meteo → pzkko/api/meteo.mjs)
    const funzione = /^\/api\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1]
    if (funzione && esiste(path.join(root, 'api', funzione + '.mjs'))) {
      return import(`./../pzkko/api/${funzione}.mjs?${Date.now()}`).then((m) => m.default(req, res)).catch((e) => { console.error(e); res.writeHead(500).end() })
    }
    const prova = /^\/prova\/([a-z0-9-]+)\/$/.exec(pathname)?.[1]
    if (prova && esiste(path.join(prove, prova + '.html'))) return invia(res, 200, path.join(prove, prova + '.html'))
    let nome = pathname
    try { nome = decodeURIComponent(pathname) } catch {}
    const file = path.join(root, nome)
    if (path.relative(root, file).startsWith('..')) return invia(res, 404, path.join(root, '404.html'))

    // cleanUrls + trailingSlash: /x.html → /x/, /index.html → /, /x → /x/
    if (nome.endsWith('.html')) return sposta(res, pathname.replace(/(index)?\.html$/, (m, idx) => (idx ? '' : '/')) + search)
    if (!nome.endsWith('/') && !path.extname(nome)) return sposta(res, pathname + '/' + search)

    const trovato = nome.endsWith('/') ? [path.join(file, 'index.html'), file.replace(/[\\/]$/, '') + '.html'].find(esiste) : esiste(file) && file
    if (trovato) return invia(res, 200, trovato)
    invia(res, 404, path.join(root, '404.html'))
  })
  server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `la porta ${port} è occupata: c'è già un dev:pzkko acceso?` : e)
    process.exit(1)
  })
  server.listen(port, () => {
    const rete = Object.values(os.networkInterfaces()).flat().filter((i) => i.family === 'IPv4' && !i.internal)
    console.log(`\n  pzkko.it · la cartella pzkko/ così com'è, la pagina si ricarica a ogni modifica\n`)
    console.log(`  ➜  Local:   http://localhost:${port}/`)
    for (const i of rete) console.log(`  ➜  Network: http://${i.address}:${port}/`)
  })
}

const SITI = { bcp: () => bcp(5181), pzkko: () => pzkko(Number(process.env.PZKKO_PORT) || 5182) }
const sito = SITI[process.argv[2]]
if (!sito) {
  console.error(`uso: node tools/dev.mjs ${Object.keys(SITI).join('|')}`)
  process.exit(1)
}
await sito()
