// Rifà pzkko/storia/index.html da pzkko/index.html, come genera-404.mjs: la storia ha la stessa strada, la stessa
// insegna, lo stesso CSS, lo stesso script (la sera di Mantova, le auto, le mosche, i tagliandi, la regia) e la stessa
// scena 3D della home, senza copiarli a mano. Della storia restano i suoi pezzi, che stanno nella pagina stessa:
//
//   <!-- storia: testa --> … <!-- /storia: testa -->     il titolo, la descrizione, og e i dati strutturati
//   /* storia: stile */ … /* /storia: stile */           il CSS dei suoi fogli (le stampe con la Live Photo, i confronti,
//                                                         lo scontrino, il banner di bologna 2.0, i meme)
//   <div class="parete storia"> … </div></main>          i fogli: le posizioni le scrive disponi.mjs --pagina=storia
//   <!-- storia: script --> … <!-- /storia: script -->   le Live Photo
//
// e le sue misure: l'altezza della parete (disponi.mjs) e le foto del caricamento (FOTO, scena/carico.mjs --pagina=storia).
// I testi della storia si cambiano lì, in pzkko/storia/index.html; questo si rilancia dopo ogni modifica a index.html
// (lo fa serranda.mjs rifai):
//
//   node tools/pzkko/genera-storia.mjs
//
// Cambia anche l'insegna: nella storia è un link che riporta al muro (l'h1 è il titolo del primo volantino).
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../pzkko')
const FILE = path.join(dir, 'storia/index.html')
let html = readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/\r\n/g, '\n')
const storia = readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n')

const pezzo = (re, nome) => {
  const m = storia.match(re)
  if (!m) throw new Error(`in storia/index.html manca ${nome}`)
  return m[0]
}
const testa = pezzo(/<!-- storia: testa[\s\S]*?<!-- \/storia: testa -->\n/, '«<!-- storia: testa -->»')
const stile = pezzo(/\/\* storia: stile \*\/[\s\S]*?\/\* \/storia: stile \*\/\n/, '«/* storia: stile */»')
const parete = pezzo(/ {4}<div class="parete storia">[\s\S]*?\n {4}<\/div>\n {2}<\/main>/, 'la parete (<div class="parete storia">)')
const script = pezzo(/<!-- storia: script -->[\s\S]*?<!-- \/storia: script -->\n/, '«<!-- storia: script -->»')
// le misure della storia, se ci sono già (alla prima volta: due altezze qualunque, poi le scrive disponi.mjs)
const alta = storia.match(/\.parete\{position:relative;height:calc\((\d+) \* var\(--u\)\)\}/)?.[1] ?? '2400'
const altaM = storia.match(/\.parete\{height:calc\((\d+) \* var\(--u\)\);max-width:600px/)?.[1] ?? '4800'
const foto = storia.match(/ {2}const FOTO = .*\n/)?.[0] ?? '  const FOTO = null // (la storia: le sue foto del caricamento le fa tools/pzkko/scena/carico.mjs --pagina=storia)\n'

const rep = (from, to) => {
  const found = from instanceof RegExp ? from.test(html) : html.includes(from)
  if (!found) throw new Error(`nella home non trovo: ${String(from).slice(0, 70)}…`)
  html = html.replace(from, typeof to === 'string' ? () => to : to)
}

// la testa: via quella della home (titolo, descrizione, canonical, og, twitter, dati strutturati), dentro quella della storia
rep(/<title>[^<]*<\/title>\n/, '')
rep(/<meta name="description" content="[^"]*">\n/, '')
rep(/<link rel="canonical" href="[^"]*">\n/, '')
html = html.replace(/<meta property="og:[^"]*" content="[^"]*">\n/g, '').replace(/<meta name="twitter:card" content="[^"]*">\n/, '')
rep(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '')
rep(/(<meta name="viewport" content="[^"]*">\n)/, (_, v) => v + testa)

// l'insegna: un link che riporta al muro (l'h1 della storia è il titolo del primo volantino)
rep(/<h1>(<span class="insegna-luce"[\s\S]*?)<\/h1>/, (_, dentro) => `<a class="insegna-h" href="/">${dentro.replace('alt="pzkko"', 'alt="pzkko: torna al muro"')}</a>`)
// il meme degli auguri a matti era solo per la home
html = html.replace(/<!-- auguri a matti[^\n]*\n<dialog class="auguri"[\s\S]*?<\/dialog>\n/, '')

// il CSS della storia in fondo a quello della home, con l'altezza della sua parete
rep('</style>\n</head>', `${stile}</style>\n</head>`)
rep(/\.parete\{position:relative;height:calc\(\d+ \* var\(--u\)\)\}/, `.parete{position:relative;height:calc(${alta} * var(--u))}`)
rep(/\.parete\{height:calc\(\d+ \* var\(--u\)\);max-width:600px/, `.parete{height:calc(${altaM} * var(--u));max-width:600px`)

// i fogli
rep(/ {4}<div class="parete">[\s\S]*?\n {4}<\/div>\n {2}<\/main>/, parete)

// le Live Photo, prima della scena; e le foto del caricamento della storia (la strada da lontano col suo muro)
rep('<!-- La scena 3D (scena/)', `${script}<!-- La scena 3D (scena/)`)
rep(/ {2}const FOTO = .*\n/, foto)

writeFileSync(FILE, html)
console.log('scritto', FILE, html.length, 'byte')
