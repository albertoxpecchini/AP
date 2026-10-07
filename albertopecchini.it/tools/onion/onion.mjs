// Indirizzo .onion del sito, servito da questo PC: Tor riceve le visite e le
// passa a questo server, che risponde con l'ultima build pubblicata da
// pubblica.mjs in %LOCALAPPDATA%\Tor\www. Vercel non c'entra. Spento il PC,
// spento l'indirizzo. Un secondo indirizzo, «nuovo», serve così com'è la
// cartella %USERPROFILE%\ygdrgs\sito. Istruzioni in README.md.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { promisify } from 'node:util'
import { spawn } from 'node:child_process'

const PORT = 8099
const SOCKS = 9250
const BASE = path.join(process.env.LOCALAPPDATA, 'Tor')
const TOR = path.join(BASE, 'bundle', 'tor', 'tor.exe')
const SERVICE = path.join(BASE, 'onion', 'albertopecchini')
const WWW = path.join(BASE, 'www')
const ATTIVA = path.join(WWW, 'attiva.txt')

// Il secondo servizio: le pagine che il generatore di ygdrgs scrive in sito\,
// servite così come sono (solo quella cartella: dati e strumenti restano fuori).
const NUOVO_PORT = 8100
const NUOVO_SERVICE = path.join(BASE, 'onion', 'nuovo')
// Immagini e foto del negozio hanno nell'indirizzo una marca che cambia con il
// contenuto (o un nome unico): il browser può tenerle un giorno senza
// richiederle a ogni pagina, che su Tor è la parte lenta.
const NUOVO = {
  root: path.join(process.env.USERPROFILE, 'ygdrgs', 'sito'),
  redirects: [],
  headers: [{ re: /^\/(img|foto)\//, headers: { 'cache-control': 'public, max-age=86400' } }],
  packed: new Map(),
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.dwg': 'application/acad',
  '.wasm': 'application/wasm',
}
const COMPRESS = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg)/
const brotli = promisify(zlib.brotliCompress)
const gzip = promisify(zlib.gzip)

function log(...a) {
  const line = `${new Date().toISOString()} ${a.join(' ')}\n`
  fs.appendFileSync(path.join(BASE, 'onion.log'), line)
  process.stdout.write(line)
}

// ── Pubblicazione attiva ─────────────────────────────────────────────────────
// pubblica.mjs scrive la nuova build nell'altra cartella e poi attiva.txt: qui
// si cambia cartella appena attiva.txt cambia, senza riavviare nulla.

let site = null
function current() {
  let stamp
  try { stamp = fs.statSync(ATTIVA).mtimeMs } catch { return null }
  if (site?.stamp === stamp) return site
  try {
    const slot = fs.readFileSync(ATTIVA, 'utf8').trim()
    const meta = JSON.parse(fs.readFileSync(path.join(WWW, `${slot}.json`), 'utf8'))
    site = {
      stamp,
      root: path.join(WWW, slot),
      redirects: meta.redirects,
      headers: meta.headers.map((h) => ({ re: new RegExp(h.source), headers: h.headers })),
      packed: new Map(), // file compressi, per non rifarli a ogni visita
    }
    log(`servo la cartella ${slot}: build del ${meta.built}, commit ${meta.commit}`)
  } catch (e) {
    log('pubblicazione illeggibile:', e.message)
  }
  return site
}

// ── Risposte ─────────────────────────────────────────────────────────────────

function text(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
  res.end(body)
}

async function pack(s, file, st, enc) {
  const key = `${enc} ${file}`
  const hit = s.packed.get(key)
  if (hit?.mtime === st.mtimeMs) return hit.body
  const raw = await fs.promises.readFile(file)
  const body = enc === 'br' ? await brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 10 } }) : await gzip(raw, { level: 9 })
  s.packed.set(key, { mtime: st.mtimeMs, body })
  return body
}

async function send(req, res, s, file, status = 200) {
  const st = await fs.promises.stat(file)
  const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'
  const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`
  res.setHeader('content-type', type)
  if (status !== 200) res.setHeader('cache-control', 'no-cache')
  else if (!res.hasHeader('cache-control')) res.setHeader('cache-control', 'public, max-age=0, must-revalidate')
  if (status === 200) {
    res.setHeader('etag', etag)
    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304
      return res.end()
    }
  }

  if (COMPRESS.test(type)) {
    res.setHeader('vary', 'Accept-Encoding')
    const accept = req.headers['accept-encoding'] || ''
    const enc = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null
    if (enc) {
      const body = await pack(s, file, st, enc)
      res.writeHead(status, { 'content-encoding': enc, 'content-length': body.length })
      return res.end(req.method === 'HEAD' ? undefined : body)
    }
  }

  // Le tavole (PDF, DWG) si possono chiedere a pezzi.
  let start = 0
  let end = st.size - 1
  res.setHeader('accept-ranges', 'bytes')
  const range = status === 200 && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (range) {
    if (range[1]) {
      start = Number(range[1])
      if (range[2]) end = Math.min(Number(range[2]), end)
    } else if (range[2]) start = Math.max(st.size - Number(range[2]), 0)
    if (start > end || start >= st.size) {
      res.writeHead(416, { 'content-range': `bytes */${st.size}` })
      return res.end()
    }
    status = 206
    res.setHeader('content-range', `bytes ${start}-${end}/${st.size}`)
  }
  res.writeHead(status, { 'content-length': end - start + 1 })
  if (req.method === 'HEAD') return res.end()
  fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res)
}

const isFile = (f) => fs.promises.stat(f).then((st) => st.isFile(), () => false)

function notFound(req, res, s) {
  const page = path.join(s.root, '404.html')
  return fs.existsSync(page) ? send(req, res, s, page, 404) : text(res, 404, 'Pagina non trovata.')
}

async function handle(s, req, res) {
  if (!s) return text(res, 503, 'Il sito non è ancora pubblicato su questo indirizzo.')
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD')
    return text(res, 405, 'Metodo non ammesso.')
  }

  let url, p
  try {
    url = new URL(req.url, 'http://onion')
    p = decodeURIComponent(url.pathname)
  } catch {
    return text(res, 400, 'Indirizzo non valido.')
  }

  for (const rule of s.headers) if (rule.re.test(url.pathname)) for (const [k, v] of Object.entries(rule.headers)) res.setHeader(k, v)

  const redirect = s.redirects.find((r) => r.source === url.pathname)
  if (redirect) {
    res.writeHead(redirect.status, { location: redirect.destination })
    return res.end()
  }

  // Niente funzioni di api/ su questo indirizzo, e niente /email/ (lo strumento
  // privato, che senza api/ non funziona). Fuori anche file nascosti e i nomi
  // che Windows interpreta a modo suo (flussi alternativi, barre rovesciate).
  p = path.posix.normalize(p)
  if (/^\/(api|email)(\/|$)/.test(p) || /[\\:\0]|\/\./.test(p)) return notFound(req, res, s)

  // Indirizzi «puliti» con la barra finale, come su Vercel (cleanUrls, trailingSlash).
  if (p.endsWith('/index.html')) {
    res.writeHead(308, { location: encodeURI(p.slice(0, -'index.html'.length)) + url.search })
    return res.end()
  }
  let file = path.join(s.root, ...p.split('/').filter(Boolean))
  if (file !== s.root && !file.startsWith(s.root + path.sep)) return notFound(req, res, s)
  if (p.endsWith('/')) file = path.join(file, 'index.html')
  else if (!path.extname(p) && (await isFile(path.join(file, 'index.html')))) {
    res.writeHead(308, { location: `${encodeURI(p)}/${url.search}` })
    return res.end()
  }
  if (!(await isFile(file))) return notFound(req, res, s)
  return send(req, res, s, file)
}

const serve = (site) => http.createServer((req, res) => {
  res.sendDate = false // l'ora del PC non serve a chi visita
  handle(site(), req, res).catch((e) => {
    log('errore:', req.url, e.message)
    if (!res.headersSent) text(res, 500, 'Errore del server.')
    else res.destroy()
  })
})
const server = serve(current)
const nuovo = serve(() => NUOVO)

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { log(`porta ${PORT} occupata: il servizio è già acceso`); process.exit(0) }
  throw e
})

// «nuovo» va nel torrc solo se la sua porta è di questo processo: se fosse di
// un altro programma, Tor passerebbe a quello le visite all'indirizzo.
server.listen(PORT, '127.0.0.1', () => {
  const skip = (e) => { log(`porta ${NUOVO_PORT} non disponibile (${e.code}): l'indirizzo «nuovo» resta spento`); start([]) }
  nuovo.once('error', skip)
  nuovo.listen(NUOVO_PORT, '127.0.0.1', () => {
    nuovo.off('error', skip)
    start([[NUOVO_SERVICE, NUOVO_PORT]])
  })
})

function start(altri) {
  const services = [[SERVICE, PORT], ...altri]
  fs.mkdirSync(path.join(BASE, 'data'), { recursive: true })
  fs.mkdirSync(path.dirname(SERVICE), { recursive: true })
  const torrc = path.join(BASE, 'torrc')
  fs.writeFileSync(torrc, [
    `DataDirectory ${path.join(BASE, 'data')}`,
    `GeoIPFile ${path.join(BASE, 'bundle', 'data', 'geoip')}`,
    `GeoIPv6File ${path.join(BASE, 'bundle', 'data', 'geoip6')}`,
    `SocksPort 127.0.0.1:${SOCKS}`,
    `Log notice file ${path.join(BASE, 'tor.log')}`,
    ...services.flatMap(([dir, port]) => [`HiddenServiceDir ${dir}`, `HiddenServicePort 80 127.0.0.1:${port}`]),
    '',
  ].join('\n'))

  // __OwningControllerProcess: tor si chiude da solo se questo processo muore.
  const tor = spawn(TOR, ['-f', torrc, '__OwningControllerProcess', String(process.pid)], { stdio: 'ignore', windowsHide: true })
  tor.on('exit', (code) => { log('tor si è fermato, codice', code); process.exit(1) })
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { tor.kill(); process.exit(0) })

  log(`server su 127.0.0.1:${services.map(([, port]) => port).join(' e ')}, tor avviato`)
  if (!current()) log('nessuna pubblicazione: lancia «npm run onion» dalla cartella del sito')
  for (const [dir] of services) {
    const wait = setInterval(() => {
      const f = path.join(dir, 'hostname')
      if (fs.existsSync(f)) { clearInterval(wait); log(`indirizzo ${path.basename(dir)}:`, 'http://' + fs.readFileSync(f, 'utf8').trim()) }
    }, 1000)
  }
}
