// Indirizzo .onion del sito: Tor riceve le visite e le passa a questo proxy, che le
// gira a www.albertopecchini.it. Gira su questo PC: spento il PC, spento
// l'indirizzo. Istruzioni in README.md.

import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { spawn } from 'node:child_process'

const ORIGIN = 'www.albertopecchini.it'
const PORT = 8099
const SOCKS = 9250
const BASE = path.join(process.env.LOCALAPPDATA, 'Tor')
const TOR = path.join(BASE, 'bundle', 'tor', 'tor.exe')
const SERVICE = path.join(BASE, 'onion', 'albertopecchini')

const HOP = new Set(['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'host', 'forwarded', 'via'])
const agent = new https.Agent({ keepAlive: true })

// Tor Browser 15 (Firefox 140) tratta l'onion come contesto sicuro e porta a https
// le immagini caricate da maschere CSS, <image> SVG e icone: sull'onion https non
// c'è e non si vedono (tor-browser#43012, Mozilla 1918915, corretto in Firefox 158).
// Gli indirizzi già https non vengono toccati, quindi le immagini si chiedono al
// dominio vero, sempre attraverso Tor.
const TEXT = /^(text\/(html|css|javascript)|application\/(javascript|json|manifest\+json))/
const ASSET = /(^|[\s"'`(=,;])\/(media\/|art\/|favicon\.svg|favicon-32\.png|apple-touch-icon\.png|icon-512\.png|og\.png)/g

async function rewrite(r) {
  const enc = r.headers['content-encoding']
  const src = enc === 'br' ? r.pipe(zlib.createBrotliDecompress()) : enc === 'gzip' ? r.pipe(zlib.createGunzip()) : r
  const chunks = []
  for await (const c of src) chunks.push(c)
  return zlib.gzipSync(Buffer.concat(chunks).toString('utf8').replace(ASSET, `$1https://${ORIGIN}/$2`))
}

function log(...a) {
  const line = `${new Date().toISOString()} ${a.join(' ')}\n`
  fs.appendFileSync(path.join(BASE, 'onion.log'), line)
  process.stdout.write(line)
}

const server = http.createServer((req, res) => {
  const headers = { host: ORIGIN }
  for (const [k, v] of Object.entries(req.headers)) {
    if (!HOP.has(k) && !k.startsWith('x-forwarded-')) headers[k] = v
  }
  headers['accept-encoding'] = 'br, gzip'
  const up = https.request({ host: ORIGIN, path: req.url, method: req.method, headers, agent }, async (r) => {
    const out = { ...r.headers }
    for (const k of HOP) delete out[k]
    delete out['strict-transport-security']
    if (out.location) out.location = out.location.replace(/^https?:\/\/(www\.)?albertopecchini\.it(?=\/|$)/, '') || '/'
    if (req.method === 'HEAD' || ![200, 404].includes(r.statusCode) || !TEXT.test(out['content-type'] || '')) {
      res.writeHead(r.statusCode, out)
      return r.pipe(res)
    }
    try {
      const body = await rewrite(r)
      for (const k of ['content-length', 'etag', 'last-modified']) delete out[k]
      res.writeHead(r.statusCode, { ...out, 'content-encoding': 'gzip', 'content-length': body.length, vary: 'Accept-Encoding' })
      res.end(body)
    } catch (e) {
      log('riscrittura fallita:', req.url, e.message)
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Il sito non risponde, riprova tra poco.')
    }
  })
  up.on('error', (e) => {
    log('origine irraggiungibile:', e.code || e.message)
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Il sito non risponde, riprova tra poco.')
  })
  req.pipe(up)
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { log(`porta ${PORT} occupata: il servizio è già acceso`); process.exit(0) }
  throw e
})

server.listen(PORT, '127.0.0.1', () => {
  fs.mkdirSync(path.join(BASE, 'data'), { recursive: true })
  fs.mkdirSync(path.dirname(SERVICE), { recursive: true })
  const torrc = path.join(BASE, 'torrc')
  fs.writeFileSync(torrc, [
    `DataDirectory ${path.join(BASE, 'data')}`,
    `GeoIPFile ${path.join(BASE, 'bundle', 'data', 'geoip')}`,
    `GeoIPv6File ${path.join(BASE, 'bundle', 'data', 'geoip6')}`,
    `SocksPort 127.0.0.1:${SOCKS}`,
    `Log notice file ${path.join(BASE, 'tor.log')}`,
    `HiddenServiceDir ${SERVICE}`,
    `HiddenServicePort 80 127.0.0.1:${PORT}`,
    '',
  ].join('\n'))

  // __OwningControllerProcess: tor si chiude da solo se questo processo muore.
  const tor = spawn(TOR, ['-f', torrc, '__OwningControllerProcess', String(process.pid)], { stdio: 'ignore', windowsHide: true })
  tor.on('exit', (code) => { log('tor si è fermato, codice', code); process.exit(1) })
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { tor.kill(); process.exit(0) })

  log(`proxy su 127.0.0.1:${PORT} → https://${ORIGIN}, tor avviato`)
  const wait = setInterval(() => {
    const f = path.join(SERVICE, 'hostname')
    if (fs.existsSync(f)) { clearInterval(wait); log('indirizzo:', 'http://' + fs.readFileSync(f, 'utf8').trim()) }
  }, 1000)
})
