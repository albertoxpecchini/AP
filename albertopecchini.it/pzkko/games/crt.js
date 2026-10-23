// Il tubo catodico degli schermi a fosfori di pzkko (23.10): gli schermi verdi alla Fallout del wallet (wallet/wallet.js)
// e del cercapersone (telefono/) devono sembrare vecchi tubi veri («VOGLIO LO SCHERMO CHE SFARFALLA E CHE ABBIA EFFETTO
// TUBO CATODICO CON FILTRO», Alberto). tubo(el) appoggia sopra lo schermo un vetro: un elemento vero, l'ultimo figlio di
// `el`, largo e alto quanto lo schermo, che non tocca né la grandezza né il padding né il layout di `el` (nel wallet le
// pagine dei tasti sono misurate perché stiano tutte nello schermo del grafico). Dentro il vetro ci sono gli strati
// (crt.css): le righe di scansione, la maschera dei fosfori, la banda che scorre, lo sfarfallio e il vetro bombato
// (vignetta, angoli scuri, riflesso, bagliore). Si muovono solo lo sfarfallio e la banda, in CSS, con opacity e transform
// (animazioni composite): niente JS a ogni fotogramma; il JS serve solo a montarlo e a rifare le misure quando cambiano
// lo zoom o la grandezza. Il «filtro» è il vetro stesso: il filtro SVG sul contenuto è stato provato e scartato (i numeri
// sono in cima a crt.css).
//
//   import { tubo } from '../games/crt.js'
//   tubo(el)                                  // fosfori verdi
//   tubo(el, { fosforo: 'ambra', z: 3 })      // fosfori ambra (o '#rrggbb'); z: lo z-index degli strati (40 se non si dice)
//   tubo(el, { insieme: true })               // trema insieme agli altri «insieme» (lo stesso schermo in posti diversi)
//   allinea(el)                               // riallinea subito i tubi «insieme» dentro el (dopo averlo fatto comparire)
//
// Chiamarla due volte non duplica niente: aggiorna le opzioni e rimette il vetro in fondo se qualcuno ha aggiunto figli.

const FOSFORI = { verde: '70 255 125', ambra: '255 176 46' }

// il foglio si chiede già quando il modulo si carica (non al primo tubo()): il wallet si apre subito dopo averlo
// importato, e il vetro deve esserci dal primo fotogramma, non accendersi un attimo dopo
let foglio = null
function caricaStile() {
  return (foglio ??= new Promise((ok) => {
    if (document.querySelector('link[data-crt]')) return ok()
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = new URL('./crt.css', import.meta.url).href; l.setAttribute('data-crt', '')
    l.onload = l.onerror = () => ok()
    document.head.appendChild(l)
  }))
}
caricaStile()

// le righe di scansione e la maschera dei fosfori si misurano in pixel VERI del display: con lo zoom del browser o coi
// display di Windows al 125 / 150 %, un passo di 3 px CSS cade a cavallo dei pixel e le righe vengono una spessa e una
// sottile (il moiré). Il passo si arrotonda a pixel interi (3 a 100 %, 4 a 125 %, 6 a 200 %, 9 sui telefoni a 3x) e la riga
// scura è un terzo del passo: fini e regolari a ogni zoom. Il vetro sta fuori da eventuali palchi scalati (il
// cercapersone scala il suo .t-palco con transform): per questo le misure sono quelle dello schermo vero.
function passi(v) {
  const d = devicePixelRatio || 1, passo = Math.max(2, Math.round(3 * d)), filo = Math.max(1, Math.round(passo / 3))
  v.style.setProperty('--crt-passo', `${passo / d}px`)
  v.style.setProperty('--crt-filo', `${filo / d}px`)
}
let zoom = null
function seguiZoom() { // un ascolto solo per la pagina: quando cambia lo zoom si rifanno i passi di tutti i vetri
  zoom?.removeEventListener('change', seguiZoom)
  zoom = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`)
  zoom.addEventListener('change', seguiZoom)
  for (const v of document.querySelectorAll('.crt-vetro')) passi(v)
}
// l'ombra del bordo bombato va col lato corto dello schermo (su quello piccolo degli EUR€ come su quello grande del
// cercapersone): si rimisura solo quando lo schermo cambia grandezza
let misura = null
const lato = () => (misura ??= new ResizeObserver((voci) => {
  for (const { target, contentRect: r } of voci) if (r.width && r.height) target.style.setProperty('--crt-lato', `${Math.min(r.width, r.height).toFixed(1)}px`)
}))

const rgb = (c) => {
  if (FOSFORI[c]) return FOSFORI[c]
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(c ?? ''))
  return m ? m.slice(1).map((h) => parseInt(h, 16)).join(' ') : FOSFORI.verde
}

/**
 * Monta il tubo catodico sullo schermo `el` (che deve essere posizionato, cioè fare da contenitore degli assoluti, e
 * di solito ha già overflow:hidden e i suoi angoli tondi) e restituisce il vetro: `<i class="crt-vetro" aria-hidden="true">`,
 * ultimo figlio di `el`, con dentro gli strati. Opzioni: `fosforo` 'verde' (di solito), 'ambra' o '#rrggbb', il colore
 * del bagliore e della banda; `z` lo z-index degli strati, 40 se non si dice (stanno nel contesto d'impilamento dello
 * schermo: vedi crt.css).
 */
export function tubo(el, { fosforo = 'verde', z = null, insieme = false } = {}) {
  if (!el) return null
  caricaStile()
  el.classList.add('crt')
  let v = el.querySelector(':scope > .crt-vetro')
  if (!v) {
    v = document.createElement('i')
    v.className = 'crt-vetro'
    v.setAttribute('aria-hidden', 'true')
    v.innerHTML = '<i class="crt-maschera"></i><i class="crt-banda"></i><i class="crt-buio"></i>'
    if (insieme) {
      // gli schermi che sono LO STESSO schermo in momenti diversi (il cercapersone piccolo, il suo doppione che vola, il
      // cercapersone grande: 23.10) tremano insieme, agganciati all'orologio della pagina: allo scambio fra l'uno e
      // l'altro la banda e lo sfarfallio non fanno salti. Le animazioni ripartono ogni volta che lo schermo ricompare
      // (un dialog che si riapre, un tasto che torna visibile): ad ogni partenza si riallineano da sole
      v.dataset.insieme = ''
      v.addEventListener('animationstart', () => allinea(v))
    } else {
      // ogni schermo ha il suo tubo: lo sfarfallio e la banda partono da un punto a caso del giro (deciso una volta, qui),
      // così due schermi vicini non tremano insieme
      v.style.setProperty('--crt-fase', `${(-Math.random() * 5.3).toFixed(2)}s`)
      v.style.setProperty('--crt-fase-banda', `${(-Math.random() * 9).toFixed(2)}s`)
    }
    passi(v)
    if (!zoom) seguiZoom()
    lato().observe(v)
  }
  if (el.lastElementChild !== v) el.appendChild(v)
  v.style.setProperty('--crt-fosforo', rgb(fosforo))
  if (z === null || z === undefined) v.style.removeProperty('--crt-z')
  else v.style.setProperty('--crt-z', String(z))
  return v
}

/** Riallinea all'orologio della pagina i tubi «insieme» dentro `el` (o `el` stesso): ogni animazione parte dall'istante
 *  zero del documento, quindi a ogni momento sono tutte allo stesso punto del giro. Da chiamare subito dopo aver fatto
 *  comparire uno schermo, se non si può aspettare il primo fotogramma (l'animationstart arriva un fotogramma dopo). */
export function allinea(el) {
  if (!el) return
  const vetri = el.matches?.('.crt-vetro[data-insieme]') ? [el] : el.querySelectorAll('.crt-vetro[data-insieme]')
  for (const v of vetri) for (const a of v.getAnimations({ subtree: true })) if (a.startTime !== 0) a.startTime = 0
}
