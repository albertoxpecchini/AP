#!/usr/bin/env node
// Controllo delle pagine prodotte dalla build. Lo fa girare a ogni push
// .github/workflows/build.yml; in locale:
//
//   npm run build && node tools/controllo/controllo.mjs                 # dist/
//   SITE=bcp npx vite build --outDir dist-bcp && SITE=bcp node tools/controllo/controllo.mjs dist-bcp
//
// In ogni pagina HTML guarda che ci siano:
//  · il credito all'autore, un link esattamente a https://www.albertopecchini.it
//    (con https e www, senza slash finale: la regola di tutti i siti di Alberto);
//  · nessun indirizzo verso albertopecchini.it senza www o verso un *.vercel.app del sito;
//  · i file dei riferimenti interni (href, src, srcset, poster, data-full, url()),
//    tolte le funzioni di api/ e i redirect di vercel.json;
//  · titolo, descrizione e lingua;
//  · niente «undefined», «NaN» o «[object Object]» nella pagina: il segno di un
//    dato mancante in un template.
// Poi che ogni indirizzo della sitemap sia una pagina. Esce con 1 se trova problemi.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = resolve(ROOT, process.argv[2] || 'dist')
const SITE = 'https://www.albertopecchini.it'
const CI = Boolean(process.env.GITHUB_ACTIONS)
// la build di bettercallpekko.it (SITE=bcp, come per vite build) non contiene le pagine del sito serio
const BCP = process.env.SITE === 'bcp'

// Pagine senza il credito per scelta: il compositore email è uno strumento
// privato (noindex, raggiungibile solo col link che porta la chiave), non una
// pagina del sito; il visualizzatore delle tavole occupa tutta la finestra
// senza piè di pagina, e il credito sta su ogni altra pagina del sito.
const SENZA_CREDITO = new Set(['/email/', '/portfolio/tavole/'])

if (!existsSync(OUT)) {
  console.error(`controllo: la cartella ${relative(process.cwd(), OUT) || OUT} non esiste (manca la build?)`)
  process.exit(1)
}

// i redirect di vercel.json: le loro sorgenti sono indirizzi validi anche senza file
const redirects = new Set(JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).redirects?.map((r) => r.source) || [])

const pages = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) walk(file)
    else if (name.endsWith('.html')) pages.push(file)
  }
}
walk(OUT)

/** Il percorso con cui si apre una pagina: dist/servizi/index.html → /servizi/. */
const urlOf = (file) => {
  const rel = '/' + relative(OUT, file).replaceAll('\\', '/')
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel
}

/** Esiste nella build il file che risponde a `path` (con cleanUrls e trailingSlash di vercel.json)? */
const exists = (path) => {
  if (redirects.has(path)) return true
  const p = join(OUT, path)
  if (path.endsWith('/')) return existsSync(join(p, 'index.html'))
  if (existsSync(p) && statSync(p).isFile()) return true
  return existsSync(p + '.html') || existsSync(join(p, 'index.html'))
}

const SKIP = /^(#|mailto:|tel:|sms:|javascript:|data:|blob:|about:|whatsapp:)/i

/** Il percorso interno di un riferimento, o null se punta fuori (o non va controllato). */
function internal(ref, base) {
  ref = ref.trim().replaceAll('&amp;', '&')
  if (!ref || SKIP.test(ref)) return null
  let url
  if (/^https?:\/\//i.test(ref)) {
    url = new URL(ref)
    // gli indirizzi assoluti del sito serio si controllano solo nella sua build
    if (url.host !== 'www.albertopecchini.it' || BCP) return null
  } else if (ref.startsWith('//')) {
    return null
  } else {
    url = new URL(ref, 'https://x' + base)
  }
  let path = url.pathname
  try {
    path = decodeURIComponent(path)
  } catch {}
  if (path.startsWith('/api/')) return null
  return path
}

const problems = []
const problem = (page, msg) => problems.push({ page, msg })

const REF = /(?:\s|:)(?:href|src|poster|data-full)="([^"]*)"/g
const SRCSET = /\ssrcset="([^"]*)"/g
const CSS_URL = /url\((['"]?)([^'")]+)\1\)/g
const LEAK = /\bundefined\b|\bNaN\b|\[object Object\]/

for (const file of pages.sort()) {
  const html = readFileSync(file, 'utf8')
  const page = urlOf(file)

  // credito
  if (!SENZA_CREDITO.has(page) && !/<a\b[^>]*\shref="https:\/\/www\.albertopecchini\.it"[^>]*>/.test(html)) {
    problem(page, `manca il credito: un <a href="${SITE}"> (con www, senza slash finale)`)
  }
  for (const m of html.matchAll(/(?:https?:)?\/\/albertopecchini\.it\b[^"'\s<)]*/g)) problem(page, `indirizzo senza www: ${m[0]}`)
  for (const m of html.matchAll(/[\w.-]*albertopecchini[\w-]*\.vercel\.app[^"'\s<)]*/g)) problem(page, `indirizzo *.vercel.app del sito: ${m[0]}`)

  // intestazione
  if (!/<html\b[^>]*\slang="[a-z]{2}/.test(html)) problem(page, 'manca la lingua in <html lang>')
  if (!/<title>[^<]*\S[^<]*<\/title>/.test(html)) problem(page, 'manca il <title>')
  if (!/<meta name="description" content="[^"]*\S[^"]*"/.test(html)) problem(page, 'manca la meta description')

  // dati mancanti nei template: nel testo e negli attributi, non negli script
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '')
  const leak = visible.match(LEAK)
  if (leak) {
    const at = visible.indexOf(leak[0])
    problem(page, `«${leak[0]}» nella pagina: …${visible.slice(Math.max(0, at - 60), at + 40).replace(/\s+/g, ' ')}…`)
  }

  // riferimenti interni
  const refs = new Set()
  for (const m of html.matchAll(REF)) refs.add(m[1])
  for (const m of html.matchAll(SRCSET)) for (const part of m[1].split(',')) refs.add(part.trim().split(/\s+/)[0])
  for (const m of visible.matchAll(CSS_URL)) refs.add(m[2])
  const missing = []
  for (const ref of refs) {
    const path = internal(ref, page)
    if (path && !exists(path)) missing.push(path)
  }
  if (missing.length) problem(page, `${missing.length} riferimenti senza file: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`)
}

// sitemap
const sitemap = join(OUT, 'sitemap.xml')
if (existsSync(sitemap)) {
  for (const [, loc] of readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(loc)
    if (!BCP && url.origin !== SITE) problem('/sitemap.xml', `indirizzo fuori dal sito: ${loc}`)
    else if (!exists(url.pathname)) problem('/sitemap.xml', `pagina inesistente: ${loc}`)
  }
}

const where = relative(process.cwd(), OUT) || OUT
if (!problems.length) {
  console.log(`controllo: ${pages.length} pagine in ${where}, nessun problema`)
  process.exit(0)
}
console.log(`controllo: ${pages.length} pagine in ${where}, ${problems.length} problemi\n`)
for (const { page, msg } of problems) console.log(CI ? `::error title=${page}::${msg}` : `  ${page}  ${msg}`)
process.exit(1)
