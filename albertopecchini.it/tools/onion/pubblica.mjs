// Pubblica sull'indirizzo .onion il sito com'è su questo PC, senza passare da
// Vercel: build in una delle due cartelle di %LOCALAPPDATA%\Tor\www (a, b),
// ritocchi per Tor Browser, poi lo scambio. Il servizio (onion.mjs) serve la
// cartella scritta in www/attiva.txt, quindi chi visita durante la build vede
// ancora la versione di prima. Uso: npm run onion (dalla cartella del sito).

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const WWW = path.join(process.env.LOCALAPPDATA, 'Tor', 'www')
const ATTIVA = path.join(WWW, 'attiva.txt')
const HOSTNAME = path.join(process.env.LOCALAPPDATA, 'Tor', 'onion', 'albertopecchini', 'hostname')

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif' }

// Tor Browser 15 (Firefox 140) tratta l'onion come contesto sicuro e porta a
// https le immagini di maschere e sfondi CSS, delle <image> SVG e le icone: su
// questo onion https non c'è e resterebbero vuote (tor-browser#43012, Mozilla
// 1918915, corretto in Firefox 158). Gli indirizzi data: e blob: non vengono
// toccati: le immagini CSS diventano variabili in onion-<hash>.css, le <image>
// SVG (aragosta, mappa dei contatti) le scarica questo script con fetch, che
// sull'onion resta in http, e le ripassa come blob:.
const SHIM = `(function(){var c={},S='http://www.w3.org/2000/svg';function get(u){return c[u]||(c[u]=fetch(u).then(function(r){if(!r.ok)throw r.status;return r.blob()}).then(function(b){return URL.createObjectURL(b)}))}
function fix(e){if(e.namespaceURI!==S||e.localName!=='image')return;var h=e.getAttribute('href');if(h&&h[0]==='/'&&h[1]!=='/')get(h).then(function(b){if(e.getAttribute('href')===h)e.setAttribute('href',b)},function(){})}
new MutationObserver(function(l){l.forEach(function(m){if(m.type==='attributes')return fix(m.target);m.addedNodes.forEach(function(n){if(n.nodeType!==1)return;fix(n);if(n.querySelectorAll)n.querySelectorAll('image').forEach(fix)})})}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']})})()`

const current = fs.existsSync(ATTIVA) ? fs.readFileSync(ATTIVA, 'utf8').trim() : ''
const slot = current === 'a' ? 'b' : 'a'
const out = path.join(WWW, slot)

// ── Build ────────────────────────────────────────────────────────────────────
// Il sito principale (non SITE=bcp), nella cartella libera.
const env = { ...process.env }
delete env.SITE
const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const build = spawnSync(process.execPath, [vite, 'build', '--outDir', out, '--emptyOutDir'], { cwd: ROOT, env, stdio: 'inherit' })
if (build.status !== 0) {
  console.error('\nBuild non riuscita: l’onion resta com’era.')
  process.exit(build.status || 1)
}

// ── Ritocchi per l'onion ─────────────────────────────────────────────────────

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
const fileOf = (p) => path.join(out, ...p.split('/').filter(Boolean))
const exists = (p) => !p.startsWith('//') && fs.existsSync(fileOf(p)) && fs.statSync(fileOf(p)).isFile()
const dataUri = (p) => `data:${MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(fileOf(p)).toString('base64')}`

const vars = new Map() // '/media/…' → '--onion-N'
const varOf = (p) => {
  if (!vars.has(p)) vars.set(p, `--onion-${vars.size}`)
  return vars.get(p)
}

const pages = walk(out)
  .filter((f) => f.endsWith('.html'))
  .map((file) => {
    let html = fs.readFileSync(file, 'utf8')
    let usesVars = false
    // url(/media/…) negli stili (i tasti «sasso»: --pb-img) → variabile con data:
    html = html.replace(/url\((&quot;|["']?)(\/[^)"'&\s]+)\1\)/g, (m, q, p) => {
      if (!exists(p)) return m
      usesVars = true
      return `var(${varOf(p)})`
    })
    // icone della scheda dentro la pagina
    html = html.replace(/(<link rel="icon"[^>]*?href=")(\/[^"]+)"/g, (m, a, p) => (exists(p) ? `${a}${dataUri(p)}"` : m))
    // il modulo di contatto senza /api/contatti: compone l'email nel programma
    // di posta di chi scrive (il ramo già previsto in src/client/form.js)
    html = html.replace(/(<form\b[^>]*?)\sdata-endpoint="[^"]*"/g, '$1')
    // collegamenti alle pagine del sito: restano sull'onion. Il credito nel piè
    // di pagina (https://www.albertopecchini.it, senza percorso) non si tocca.
    html = html.replace(/(<a\b[^>]*?\shref=")https:\/\/www\.albertopecchini\.it(\/[^"]*)"/g, '$1$2"')
    return { file, html, usesVars }
  })

const css = `:root{${[...vars].map(([p, v]) => `${v}:url("${dataUri(p)}")`).join(';')}}\n`
const cssName = `onion-${crypto.createHash('sha256').update(css).digest('hex').slice(0, 10)}.css`
fs.writeFileSync(path.join(out, cssName), css)

for (const { file, html, usesVars } of pages) {
  const head = (usesVars ? `<link rel="stylesheet" href="/${cssName}">` : '') + `<script>${SHIM}</script>`
  fs.writeFileSync(file, html.replace('</head>', `${head}\n</head>`))
}

// ── Regole di Vercel che valgono anche qui ───────────────────────────────────
// Rinvii e intestazioni da vercel.json: le legge onion.mjs da www/<slot>.json.

const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
const git = (...args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
const meta = {
  built: new Date().toISOString(),
  commit: git('rev-parse', '--short', 'HEAD'),
  modifiche: git('status', '--porcelain').split('\n').filter(Boolean).length,
  redirects: (vercel.redirects || []).map((r) => ({ source: r.source, destination: r.destination, status: r.statusCode || (r.permanent ? 308 : 307) })),
  headers: [
    ...(vercel.headers || []).filter((h) => !h.source.includes(':')).map((h) => ({ source: `^${h.source}$`, headers: Object.fromEntries(h.headers.map((x) => [x.key, x.value])) })),
    { source: '^/onion-[0-9a-f]+\\.css$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
  ],
}
fs.writeFileSync(path.join(WWW, `${slot}.json`), JSON.stringify(meta, null, 2))
fs.writeFileSync(ATTIVA, slot)

const host = fs.existsSync(HOSTNAME) ? fs.readFileSync(HOSTNAME, 'utf8').trim() : '(indirizzo non ancora creato: avvia onion.mjs)'
console.log(`\nOnion aggiornato: cartella ${slot}, commit ${meta.commit}${meta.modifiche ? ` + ${meta.modifiche} file non committati` : ''}.`)
console.log(`${pages.length} pagine, ${vars.size} immagini CSS in ${cssName} (${Math.round(css.length / 1024)} KB).`)
console.log(`http://${host}`)
