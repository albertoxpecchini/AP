// Rigenera pzkko/404.html da pzkko/index.html, così la pagina non trovata ha lo
// stesso CSS, lo stesso dock fisso e lo stesso script della home senza copiarli a
// mano. Da rilanciare dopo ogni modifica a index.html:
//
//   node tools/pzkko/genera-404.mjs
//
// Cambiano solo <title>, i meta (noindex, niente canonical/og), i link del menu
// e del dock (assoluti verso la home) e il contenuto di <main>.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../pzkko')
let html = readFileSync(path.join(dir, 'index.html'), 'utf8')
// la home può avere fine riga CRLF (Windows): il generatore ragiona in LF
html = html.replace(/\r\n/g, '\n')

const rep = (from, to) => {
  const found = from instanceof RegExp ? from.test(html) : html.includes(from)
  if (!found) throw new Error(`ancora non trovata: ${String(from).slice(0, 70)}…`)
  html = html.replace(from, to)
}

// testata del documento
rep('<title>pzkko, i social di Alberto Pecchini</title>', '<title>Pagina non trovata, pzkko</title>')
rep(/<meta name="description" content="[^"]*">/, '<meta name="description" content="L\'indirizzo non esiste o è cambiato. Torna alla home di pzkko.it.">')
rep('<link rel="canonical" href="https://www.pzkko.it/">', '<meta name="robots" content="noindex">')
html = html.replace(/<meta property="og:[^"]*" content="[^"]*">\n/g, '').replace(/<meta name="twitter:card" content="[^"]*">\n/, '')
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '')

// link verso la home: dal 404 le ancore non bastano
html = html.replace(/href="#(social|tools|games)"/g, 'href="/#$1"')

// contenuto: lo stesso hero a tutto schermo col dock, col messaggio al posto del nome
const main = html.match(/<main>[\s\S]*?<\/main>/)
if (!main) throw new Error('main non trovato')
const dock = main[0].match(/ *<div class="dockwrap">[\s\S]*?\n    <\/div>\n/)
if (!dock) throw new Error('dock non trovato dentro l\'hero')
rep(main[0], `<main class="p404">
  <section class="hero">
    <div class="field" aria-hidden="true"></div>
    <div class="intro">
      <h1>questa pagina non c'è.</h1>
      <p class="lede">l'indirizzo non esiste o è cambiato. i social, gli strumenti e i giochi stanno tutti nella home.</p>
      <a class="go" href="/">torna a pzkko.it<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
    </div>

${dock[0].trimEnd()}
  </section>
</main>`)

// stile in più solo per questa pagina
rep('</style>\n</head>', `/* 404: titolo più piccolo del nome, link sotto la riga */
.p404 h1{font-size:clamp(2.25rem,6vw,4rem);line-height:1.05;letter-spacing:-.03em;text-wrap:balance}
.p404 .go{margin-top:28px;font-size:19px}
.p404 .go svg{width:18px;height:18px}
</style>
</head>`)

html = html.replace('<!-- il dock: in fondo al primo schermo, poi scorre via col resto -->', '<!-- il dock, come nella home: questo file è generato da tools/pzkko/genera-404.mjs -->')
writeFileSync(path.join(dir, '404.html'), html)
console.log('scritto', path.join(dir, '404.html'), html.length, 'byte')
