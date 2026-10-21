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
  fs.watch(root, { recursive: true }, (_, file) => {
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

const SITI = { bcp: () => bcp(5181), pzkko: () => pzkko(5182) }
const sito = SITI[process.argv[2]]
if (!sito) {
  console.error(`uso: node tools/dev.mjs ${Object.keys(SITI).join('|')}`)
  process.exit(1)
}
await sito()
