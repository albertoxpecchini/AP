// Il sito di pzkko servito in locale per il bot dei bug (bot.mjs): la cartella pzkko/ così com'è, con le regole di
// Vercel (pzkko/vercel.json: /x → /x/, 404.html per quello che non c'è). Le funzioni di /api/ rispondono come quando il
// server di Alberto è spento («in pausa»): è lo stato peggiore in cui il sito deve restare in piedi, e i dati veri non
// si toccano. Tiene il conto di ogni richiesta finita in 404, con la pagina che l'ha fatta.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve, sep } from 'node:path'

const TIPI = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.zip': 'application/zip', '.ico': 'image/x-icon',
}
const PAUSA = JSON.stringify({ ok: false, offline: true, errore: 'la banca è in pausa (il server di pzkko è spento): riprova fra poco' })
const file = async (f) => { try { return (await stat(f)).isFile() } catch { return false } }

/** Accende il sito su una porta libera: { base, mancanti (Map indirizzo → Set di pagine), chiudi() }. */
export async function accendi(radice) {
  radice = resolve(radice)
  const mancanti = new Map()
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    let p
    try { p = decodeURIComponent(url.pathname) } catch { res.writeHead(400).end(); return }
    if (p.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': TIPI['.json'], 'Cache-Control': 'no-store' }).end(PAUSA); return }
    const f = resolve(join(radice, p))
    if (f !== radice && !f.startsWith(radice + sep)) { res.writeHead(403).end(); return }
    const manda = async (status, quale) => { res.writeHead(status, { 'Content-Type': TIPI[extname(quale).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : await readFile(quale)) }
    try {
      if (p.endsWith('/')) { if (await file(join(f, 'index.html'))) return await manda(200, join(f, 'index.html')) }
      else if (p.endsWith('.html') && await file(f)) return res.writeHead(308, { Location: p.replace(/(\/index)?\.html$/, '/') + url.search }).end() // cleanUrls
      else if (await file(f)) return await manda(200, f)
      else if (await file(join(f, 'index.html')) || await file(f + '.html')) return res.writeHead(308, { Location: p + '/' + url.search }).end() // trailingSlash
      else if (p.endsWith('/') === false && await file(f.replace(/[\\/]$/, '') + '.html')) return await manda(200, f + '.html')
      if (p.endsWith('/') && await file(f.replace(/[\\/]$/, '') + '.html')) return await manda(200, f.replace(/[\\/]$/, '') + '.html')
      const da = req.headers.referer ? new URL(req.headers.referer).pathname : '(diretto)'
      if (!mancanti.has(p)) mancanti.set(p, new Set())
      mancanti.get(p).add(da)
      await manda(404, join(radice, '404.html'))
    } catch (e) { res.writeHead(500).end(String(e.message)) }
  })
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
  return { base: `http://127.0.0.1:${server.address().port}`, mancanti, chiudi: () => new Promise((ok) => server.close(ok)) }
}
