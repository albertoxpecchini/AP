// La barra in alto di pzkko.it (26.10, Alberto: «fai una topbar con sezioni dove c'è la storia del sito, i gadget, elenchi di
// oggetti, achievement, account, info e copyright»; poi: «più in stile pzk, senza sfondo: pixel che escono dall'alto, tasti
// che sono pezzi di carta, scritte di vari font»). Niente striscia: dall'alto colano pixel scuri (la frangia, un SVG a
// pixel che si ripete in orizzontale, e qualche pixel colorato che si stacca e cade), e sotto le voci sono pezzi di carta
// strappati attaccati col nastro, ognuno la sua carta, il suo carattere e la sua storta, in fila al centro (Alberto: «niente
// tasto pzk, allinea tutto centralmente»: il muro c'è già sotto). I bordi strappati e la frangia
// vengono da un caso col seme fisso: sono sempre gli stessi, a ogni visita.
// La mette questo modulo in ogni pagina che lo carica (la home, la storia e la 404 che si generano da lei, e le pagine
// nuove: gadget, oggetti, traguardi, info), così le voci stanno in un posto solo. L'altezza è --barra (barra.css): la home
// ci sposta sotto il wallet e il cercapersone.
// ACCOUNT nella home apre il cercapersone sull'app Account (games/pzk.js, apriWallet('conto')); nelle altre pagine porta
// alla home con #account, che fa lo stesso. WIKI (pzkkopedia, /wiki/) c'è ma è vuota: una voce senza indirizzo (null) si
// vedrebbe sbiadita, con «presto».

import { src } from '../chat/icone.js'
// il fruscio dei pezzi di carta (e i suonini dei tasti e le musichette di tutta la pagina: suono/interfaccia.js)
// (vai: nella cornice, se la musica suona, la pagina nuova si apre senza lasciare questa: suono/cornice.js)
import { fruscio, vai } from '../suono/interfaccia.js'

// [indirizzo, nome, icona, a cosa serve, la carta, il carattere]
const VOCI = [
  ['/storia/', 'storia', 'clessidra', 'com’è nato pzkko', 'scontrino', 'macchina'],
  ['/gadget/', 'gadget', 'pager', 'il wallet, il cercapersone e le sue app, i giochi', 'cartone', 'stencil'],
  ['/oggetti/', 'oggetti', 'zaino', 'tutto quello che si compra, si pesca, si caccia, si scava', 'postit', 'pennarello'],
  ['/traguardi/', 'traguardi', 'trofeo', 'gli achievement: quelli fatti e quelli da fare', 'rosa', 'tondo'],
  ['#account', 'account', 'app-account', 'il conto: crealo, entra, cambia, invia', 'quaderno', 'mono'],
  ['/info/', 'info', 'cuore', 'cos’è pzkko, chi l’ha fatto, il copyright', 'bianca', 'mano'],
  ['/wiki/', 'wiki', 'manuale-landini', 'pzkkopedia, la wiki del sito: per ora è vuota', 'grigia', 'bungee'],
]

// il caso col seme (mulberry32): la barra è uguale a ogni visita
const caso = (seme) => () => { seme |= 0; seme = (seme + 0x6d2b79f5) | 0; let t = Math.imul(seme ^ (seme >>> 15), 1 | seme); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

/** Il bordo strappato di un pezzo di carta: un poligono con i denti piccoli e storti su tutti e quattro i lati. */
function strappo(r) {
  const p = [], lato = (n, f) => { for (let i = 0; i <= n; i++) p.push(f(i / n, r() * 3.2)) }
  lato(9, (t, d) => `${(t * 100).toFixed(1)}% ${d.toFixed(1)}px`)
  lato(3, (t, d) => `calc(100% - ${d.toFixed(1)}px) ${(t * 100).toFixed(1)}%`)
  lato(9, (t, d) => `${(100 - t * 100).toFixed(1)}% calc(100% - ${d.toFixed(1)}px)`)
  lato(3, (t, d) => `${d.toFixed(1)}px ${(100 - t * 100).toFixed(1)}%`)
  return `polygon(${p.join(',')})`
}

/** La frangia di pixel che cola dall'alto: 48 colonne da 6 px, ognuna lunga a caso (qualche goccia più lunga, qualche
 *  pixel staccato sotto), scura con rari pixel colorati in fondo. Un SVG da ripetere in orizzontale. */
function frangia() {
  const r = caso(1981), P = 6, N = 48, rett = []
  for (let c = 0; c < N; c++) {
    const lungo = r() < 0.12, h = lungo ? 4 + Math.floor(r() * 5) : 1 + Math.floor(r() * 3)
    rett.push(`<rect x="${c * P}" y="0" width="${P}" height="${h * P}" fill="#0e0d0c"/>`)
    if (r() < 0.11) rett.push(`<rect x="${c * P}" y="${(h - 1) * P}" width="${P}" height="${P}" fill="${['#ffd400', '#46ff7d', '#ff5a4a', '#4aa8ff'][Math.floor(r() * 4)]}"/>`)
    if (lungo && r() < 0.6) rett.push(`<rect x="${c * P}" y="${(h + 1 + Math.floor(r() * 2)) * P}" width="${P}" height="${P}" fill="#0e0d0c"/>`)
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${N * P}" height="${12 * P}" shape-rendering="crispEdges">${rett.join('')}</svg>`)}")`
}

function barra() {
  if (document.querySelector('.barra')) return
  const qui = location.pathname.replace(/\/?$/, '/'), r = caso(26101)
  const nav = document.createElement('nav')
  nav.className = 'barra'
  nav.setAttribute('aria-label', 'le sezioni di pzkko')
  nav.style.setProperty('--frangia', frangia())
  // i pixel che si staccano e cadono: pochi, ognuno col suo posto, il suo colore e il suo ritmo
  const cadono = Array.from({ length: 9 }, () => `<i style="left:${(r() * 100).toFixed(1)}%;--c:${['#0e0d0c', '#0e0d0c', '#ffd400', '#46ff7d', '#ff5a4a'][Math.floor(r() * 5)]};animation-delay:${(-r() * 9).toFixed(2)}s;animation-duration:${(5 + r() * 5).toFixed(2)}s"></i>`).join('')
  // INDIETRO (26.10, Alberto: «premendo i tasti in topbar non ho modo di tornare indietro»): in ogni pagina che non è il
  // muro, primo della fila, un pezzo di carta rosso; porta sempre alla home pulita, «/» (Alberto: «quando faccio indietro deve
  // tornare in home», non alla pagina di prima: quella poteva essere /#account, che riapriva l'account)
  const indietro = qui === '/' ? '' : `<li style="--r:-2deg;--y:1px;--n:-12deg"><a class="pezzo c-indietro f-pennarello" href="/" data-indietro title="torna indietro"><span class="carta" style="clip-path:${strappo(caso(7)) }"></span>← indietro</a></li>`
  nav.innerHTML = `<div class="barra-pixel" aria-hidden="true">${cadono}</div>
    <ul>${indietro}${VOCI.map(([href, nome, ic, cosa, carta, font]) => {
      const stile = `--r:${((r() - 0.5) * 6).toFixed(1)}deg;--y:${(r() * 6).toFixed(1)}px;--n:${((r() - 0.5) * 30).toFixed(0)}deg`
      // la carta strappata è un livello sotto (span.carta): il clip-path non taglia il nastro né l'ombra del pezzo
      const dentro = `<span class="carta" style="clip-path:${strappo(r)}"></span><img src="${src(ic)}" alt="" width="16" height="16">${nome}${href ? '' : '<small>presto</small>'}`
      const attr = `class="pezzo c-${carta} f-${font}" title="${cosa}"`
      return `<li style="${stile}">${href ? `<a ${attr} href="${href}"${href === qui ? ' aria-current="page"' : ''}${href === '#account' ? ' data-account' : ''}>${dentro}</a>` : `<span ${attr} aria-disabled="true">${dentro}</span>`}</li>`
    }).join('')}</ul>`
  document.body.prepend(nav)
  document.documentElement.classList.add('con-barra')
  // il fruscio, e il link parte un attimo dopo (se no la pagina nuova lo tronca); coi tasti modificatori (nuova scheda) subito
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a.pezzo')
    if (!a) return
    fruscio()
    if (a.hasAttribute('data-account') || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return
    e.preventDefault()
    setTimeout(() => vai(a.href), 120) // (INDIETRO compreso: il suo link è la home, «/»)
  })
  nav.querySelector('[data-account]')?.addEventListener('click', (e) => {
    e.preventDefault()
    if (qui === '/') import('../games/pzk.js').then((p) => p.apriWallet('conto')) // nella home: il cercapersone sull'account
    else vai('/#account')
  })
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', barra)
else barra()
// il canale sempre aperto col server (games/live.js): solo chi è entrato nel conto, e quando il browser è tranquillo
try { if (localStorage.getItem('pzkko-wallet')) (window.requestIdleCallback ?? setTimeout)(() => import('../games/live.js').catch(() => {}), { timeout: 3000 }) } catch {}
