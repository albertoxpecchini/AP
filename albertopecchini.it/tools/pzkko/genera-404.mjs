// Rigenera pzkko/404.html da pzkko/index.html, così la pagina non trovata ha lo
// stesso muro, la stessa insegna, lo stesso CSS e lo stesso script della home
// senza copiarli a mano. Da rilanciare dopo ogni modifica a index.html:
//
//   node tools/pzkko/genera-404.mjs
//
// Cambiano <title> e meta (noindex, niente canonical/og) e il contenuto della
// parete: al posto dei volantini restano i resti strappati di uno, e un foglio
// bianco che dice che la pagina non c'è, col link alla home.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../pzkko')
let html = readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/\r\n/g, '\n')

const rep = (from, to) => {
  const found = from instanceof RegExp ? from.test(html) : html.includes(from)
  if (!found) throw new Error(`ancora non trovata: ${String(from).slice(0, 70)}…`)
  html = html.replace(from, to)
}

rep('<title>pzkko, i social di Alberto Pecchini</title>', '<title>Pagina non trovata, pzkko</title>')
rep(/<meta name="description" content="[^"]*">/, '<meta name="description" content="L\'indirizzo non esiste o è cambiato. Torna alla home di pzkko.it.">')
rep('<link rel="canonical" href="https://www.pzkko.it/">', '<meta name="robots" content="noindex">')
html = html.replace(/<meta property="og:[^"]*" content="[^"]*">\n/g, '').replace(/<meta name="twitter:card" content="[^"]*">\n/, '')
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '')

// la parete: pochi pezzi, e il foglio del messaggio
const parete = html.match(/<div class="parete">[\s\S]*?\n    <\/div>\n  <\/main>/)
if (!parete) throw new Error('parete non trovata')
rep(parete[0], `<div class="parete p404">
      <img class="it tag" src="/art/tag/tag-nero.webp" alt="" width="444" height="372" style="--x:30;--y:40;--w:300;--r:-3deg;--mx:-10;--my:20;--mw:230;--mr:-6deg">
      <img class="it tag chiaro" src="/art/tag/throwup-argento.webp" alt="" width="441" height="375" style="--x:960;--y:420;--w:260;--r:-6deg;--mx:180;--my:520;--mw:200;--mr:-5deg">
      <img class="it tag" src="/art/tag/scarabocchio.webp" alt="" width="429" height="444" style="--x:60;--y:420;--w:230;--r:0deg;--mx:200;--my:40;--mw:170;--mr:-5deg">
      <img class="it tag" src="/art/tag/faccia.webp" alt="" width="261" height="408" style="--x:1170;--y:60;--w:95;--r:6deg;--mx:300;--my:300;--mw:70;--mr:8deg">
      <img class="it tag" src="/art/tag/stencil-chiocciola.webp" alt="" width="438" height="315" style="--x:760;--y:560;--w:130;--r:0deg;--mx:40;--my:600;--mw:110;--mr:0deg">
      <!-- quel che resta del volantino strappato -->
      <img class="it pezzo" src="/art/nastro/resto-bianco.webp" alt="" width="429" height="309" style="--x:300;--y:70;--w:220;--r:-6deg;--mx:30;--my:290;--mw:150;--mr:-8deg">
      <img class="it pezzo" src="/art/nastro/resto-giallo.webp" alt="" width="471" height="267" style="--x:860;--y:90;--w:200;--r:8deg;--mx:230;--my:330;--mw:140;--mr:10deg">
      <img class="it pezzo" src="/art/nastro/scotch-storto.webp" alt="" width="435" height="417" style="--x:470;--y:420;--w:150;--r:0deg;--mx:270;--my:0;--mw:110;--mr:0deg">
      <img class="it pezzo" src="/art/nastro/graffette.webp" alt="" width="360" height="252" style="--x:840;--y:470;--w:110;--r:20deg;--mx:300;--my:460;--mw:80;--mr:20deg">

      <article class="vol it c-bianco" style="--x:470;--y:60;--w:340;--r:-2deg;--mx:40;--my:30;--mw:300;--mr:-2deg">
        <div class="foglio" aria-hidden="true"></div>
        <div class="testo">
          <h2 class="titolo">questa pagina non c'è.</h2>
          <p>l'indirizzo non esiste o è cambiato: qualcuno ha strappato il volantino. i siti, i social, i giochi e gli strumenti stanno tutti nella home.</p>
          <p class="mano vai" style="margin-top:auto"><a href="/">torna a pzkko.it</a></p>
        </div>
      </article>
    </div>
  </main>`)

// stile in più solo per questa pagina
rep('</style>\n</head>', `/* 404: un muro corto */
.parete.p404{height:calc(640 * var(--u))}
@media (max-width:899px){.parete.p404{height:calc(720 * var(--u))}}
.p404 .vol .titolo{font-size:max(26px,15cqw)}
</style>
</head>`)

html = html.replace('<!-- quello che c\'era già sul muro: graffiti, resti, manifesti di altri -->', '')
// le foto del caricamento sono la strada della home da lontano, col suo muro alto: sotto il muro corto della 404 non
// coinciderebbero. Qui niente foto: il nero e la tela che sfuma
rep(/  const FOTO = .*\n/, '  const FOTO = null // (la 404: le foto del caricamento sono della home, tools/pzkko/genera-404.mjs)\n')
writeFileSync(path.join(dir, '404.html'), html)
console.log('scritto', path.join(dir, '404.html'), html.length, 'byte')
