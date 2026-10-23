// I menù che restano fermi e si ricordano (23.10, Alberto: «applica questa regola a ogni menù del sito e memorizza sempre
// le azioni degli user»; prima, nello shop, aggiungere al carrello riportava la lista in cima e bisognava riscendere).
//
//   tieni(host, nome, { vista })  da qui in poi tutto quello che scorre dentro host (le liste, i caroselli, le file di schede)
//                            ha il suo punto ricordato: quando l'app ridisegna (innerHTML) le cose nuove tornano dov'erano
//                            le loro uguali; tornando a una vista la si ritrova dove la si era lasciata; riaprendo la pagina
//                            pure. Una cosa che scorre si riconosce dalla sua classe e dal suo posto fra le uguali: due viste
//                            diverse devono avere classi diverse (la vetrina e il carrello dello shop). La chat no: si tiene
//                            in fondo da sola.
//                            vista(): quando lo stesso contenitore fa da più pagine (il wallet), il nome della pagina
//                            di adesso: ogni pagina ha i suoi punti
//   riporta(host)            dopo un cambio di pagina senza ridisegno del contenitore: rimette i punti di quella pagina
//                            (host stesso dall'alto se non ne ha uno)
//   dallAlto(host, sel)      la lista di adesso riparte dall'alto (una lista nuova: un altro reparto, un altro filtro);
//                            di serie le liste verticali (.t-corpo-app), le file orizzontali restano dove sono
//   ricordo(nome, predef)    le scelte di un'app (la scheda, il filtro, la cosa aperta), con i valori di serie sotto
//   ricorda(nome, scelte)    le salva
//
// Tutto in localStorage («pzkko-ricordi»), per chi guarda da questo browser; se il browser non lo lascia, si ricorda
// finché la pagina è aperta.

const CHIAVE = 'pzkko-ricordi'
let R = (() => { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') ?? {} } catch { return {} } })()
let attesa = 0
const scriviOra = () => { clearTimeout(attesa); try { localStorage.setItem(CHIAVE, JSON.stringify(R)) } catch {} }
const salva = () => { clearTimeout(attesa); attesa = setTimeout(scriviOra, 300) }
addEventListener('pagehide', scriviOra)
document.addEventListener('visibilitychange', () => { if (document.hidden) scriviOra() })

export const ricordo = (nome, predefinito = {}) => ({ ...predefinito, ...(R[nome]?.scelte ?? {}) })
export function ricorda(nome, scelte) { (R[nome] ??= {}).scelte = scelte; salva() }

// ── il punto di quello che scorre ──
// la chiave di un elemento: tag e classi (in ordine), più il suo posto fra quelli con la stessa chiave dentro host
const chiaveDi = (e) => `${e.tagName.toLowerCase()}.${[...e.classList].sort().join('.')}`
function numera(host) {
  const conti = new Map(), v = host.__vista ? `${host.__vista()}|` : ''
  host.__ricordo = `${v}&` // host stesso può scorrere (la home del cercapersone, la pagina del wallet)
  for (const e of host.querySelectorAll('*')) { const k = chiaveDi(e), n = conti.get(k) ?? 0; conti.set(k, n + 1); e.__ricordo = `${v}${k}#${n}` }
}
const visibile = (e) => e.isConnected && e.getClientRects().length > 0
const qui = (e) => [Math.round(e.scrollLeft), Math.round(e.scrollTop)]
// Le liste che si riempiono dopo (le risposte dalla rete, le immagini) all'inizio sono corte e il punto non ci sta: restano
// «in attesa» e si riprova a ogni cosa nuova che arriva dentro host (e a ogni immagine caricata), finché ci sta o finché
// chi guarda non scorre lui. Gli spostamenti fatti da qui (e.__messo) non si segnano come punti nuovi.
function metti(e, v) {
  e.scrollLeft = v[0]; e.scrollTop = v[1]
  e.__messo = qui(e)
  e.__vuole = e.__messo[0] < v[0] || e.__messo[1] < v[1] ? v : null
}
function rimetti(e, p, nuovo = true) {
  const v = p[e.__ricordo]
  if (!v || (nuovo && (e.scrollTop || e.scrollLeft))) return // l'app l'ha già spostato lei (una scheda portata in vista): resta
  metti(e, v)
}

const tenuti = new WeakSet()
export function tieni(host, nome, { vista = null } = {}) {
  if (!host || tenuti.has(host)) return
  tenuti.add(host)
  host.__ricordi = nome
  host.__vista = vista
  let sporco = true
  const posti = () => ((R[nome] ??= {}).posti ??= {})
  const attesi = host.__attesi = new Set()
  const riprova = () => { for (const e of attesi) { if (!e.isConnected || !e.__vuole) attesi.delete(e); else if (visibile(e)) { metti(e, e.__vuole); if (!e.__vuole) attesi.delete(e) } } }
  const segnaAttesi = (e) => { if (e.__vuole) attesi.add(e) }
  // si scorre: il punto si segna (non quando lo scroll torna a zero perché la vista si nasconde, né quando l'ha messo questo modulo)
  host.addEventListener('scroll', (ev) => {
    const e = ev.target
    if (!(e instanceof Element) || !host.contains(e) || host.hidden || !visibile(e)) return
    const ora = qui(e)
    if (e.__messo && ora[0] === e.__messo[0] && ora[1] === e.__messo[1]) return
    e.__messo = null; e.__vuole = null; attesi.delete(e)
    if (sporco) { numera(host); sporco = false }
    const p = posti()
    if (ora[0] || ora[1]) p[e.__ricordo] = ora
    else delete p[e.__ricordo]
    salva()
  }, { capture: true, passive: true })
  host.addEventListener('load', riprova, { capture: true }) // un'immagine arrivata allunga la lista
  // si ridisegna (cose nuove) o la vista torna visibile: si rimette il punto
  new MutationObserver((cambi) => {
    sporco = true
    let tutto = false
    const nuovi = []
    for (const c of cambi) {
      if (c.type === 'attributes') { if (c.target === host && !host.hidden) tutto = true }
      else for (const n of c.addedNodes) if (n.nodeType === 1) nuovi.push(n)
    }
    if (!tutto && !nuovi.length) return
    const p = R[nome]?.posti
    if (!p || host.hidden) return
    numera(host); sporco = false
    if (tutto) for (const e of [host, ...host.querySelectorAll('*')]) { rimetti(e, p, false); segnaAttesi(e) }
    else for (const n of nuovi) for (const e of [n, ...n.querySelectorAll('*')]) { rimetti(e, p); segnaAttesi(e) }
    riprova()
  }).observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] })
}

export function riporta(host) {
  const p = R[host?.__ricordi]?.posti ?? {}
  numera(host)
  for (const e of [host, ...host.querySelectorAll('*')]) {
    const v = p[e.__ricordo]
    if (v) { metti(e, v); if (e.__vuole) host.__attesi?.add(e) } else if (e === host) { e.scrollTop = 0; e.__messo = qui(e); e.__vuole = null }
  }
}

export function dallAlto(host, sel = '.t-corpo-app') {
  const p = R[host?.__ricordi]?.posti
  if (!p) return
  numera(host)
  for (const e of host.querySelectorAll(sel)) { delete p[e.__ricordo]; e.__vuole = null; e.scrollTop = 0 }
  salva()
}
