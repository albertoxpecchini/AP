// La cornice (26.10, Alberto: «fai che la musica non si interrompa quando cambio pagina»). pzkko.it è fatto di pagine
// vere: cambiare pagina butta via il documento, e con lui il contesto audio e la musica. Allora, mentre la musica suona,
// la pagina in cui si è entrati resta e fa da cornice: un link del sito non la lascia, apre l'altra pagina in un riquadro
// grande quanto la finestra, sopra di lei, e la musica va avanti fuori. La pagina di fuori dorme (nascosta, la scena 3D
// ferma, la strada zitta: evento pzkko-altrove, window.pzkkoSuono.altrove); l'indirizzo e il titolo seguono quella dentro,
// e avanti e indietro funzionano (i passi dentro il riquadro sono del browser; il primo, quello che entra, lo mette qui).
// Dentro, le pagine non suonano musica loro (interfaccia.js chiede a quella di fuori, `fuori`), i link verso un altro sito
// cambiano la finestra intera e quello verso la pagina di fuori la risveglia. Senza musica (i suoni spenti, prima del
// primo gesto) i link fanno come sempre. Ricaricando si carica la pagina vera, e la musica riprende da dov'era al primo
// gesto. Va col permesso di farsi incorniciare dallo stesso sito: X-Frame-Options SAMEORIGIN in albertopecchini.it/vercel.json,
// che è quello che conta anche per pzkko.it (il progetto ha la cartella radice lì; pzkko/vercel.json non lo legge nessuno).

const chiave = (u) => u.pathname.replace(/\/?$/, '/') + u.search
const stessa = (u) => u.origin === location.origin
/** Un indirizzo che la cornice apre: dello stesso sito, un'altra pagina (non un'ancora di questa), non un file né un'API */
const vale = (u) => stessa(u) && !/^\/(api|tools)\//.test(u.pathname) && !/\.(?!html?$)\w{2,5}$/.test(u.pathname) && chiave(u) !== chiave(location)

/** Siamo nel riquadro di un'altra pagina del sito? → la sua cornice ({ casa, chiudi, abbassa }), se no null */
export const fuori = (() => {
  if (window.parent === window) return null
  try { return window.parent.pzkkoCornice ?? null } catch { return null }
})()

let f = null, casa = null, sincro = 0
const unirl = (url) => new URL(url, location.href)

/** Va a `url`: dentro la cornice se si può (la musica suona), se no come sempre. */
export function vai(url) {
  const u = unirl(url)
  if (fuori) {
    if (!stessa(u)) window.top.location.href = u.href
    else if (fuori.casa(u.href)) fuori.chiudi()
    else location.href = u.href
  } else if (window.pzkkoCornice?.apre(u)) apri(u.href)
  else location.href = u.href
}

// ── fuori: la pagina che fa da cornice ──
function dorme(si) {
  document.documentElement.classList.toggle('in-cornice', si)
  if (window.pzkkoSuono) window.pzkkoSuono.altrove = si
  document.dispatchEvent(new CustomEvent('pzkko-altrove', { detail: si }))
}
function apri(url, storia = true) {
  if (f) { f.src = url; return }
  casa = { url: location.href, titolo: document.title }
  f = document.createElement('iframe')
  f.className = 'cornice'
  f.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write; web-share'
  f.style.background = getComputedStyle(document.documentElement).backgroundColor
  f.addEventListener('load', caricata)
  f.src = url
  document.body.append(f)
  if (storia) history.pushState({ pzkkoCornice: 1 }, '', url)
}
/** Ogni pagina che arriva nel riquadro: l'indirizzo e il titolo di sopra diventano i suoi, e la pagina di fuori dorme. */
function caricata() {
  let w
  try { w = f.contentWindow; if (w.location.origin !== location.origin) throw 0 } catch { return chiudi() } // (un altro sito: non si sa dove; si torna fuori)
  if (w.location.href === 'about:blank') return
  allinea()
  if (!document.documentElement.classList.contains('in-cornice')) dorme(true)
  try { w.focus() } catch {}
  // (le pagine che cambiano indirizzo o titolo da sole, senza ricaricarsi)
  clearInterval(sincro)
  sincro = setInterval(allinea, 1000)
}
function allinea() {
  try {
    const w = f?.contentWindow
    if (!w || w.location.href === 'about:blank') return
    if (w.location.href !== location.href) history.replaceState(history.state, '', w.location.href)
    if (w.document.title && w.document.title !== document.title) document.title = w.document.title
  } catch {}
}
/** Via il riquadro, si risveglia la pagina di fuori. `storia`: un passo avanti nella cronologia (se no ci si è tornati). */
function chiudi(storia = true) {
  if (!f) return
  clearInterval(sincro)
  f.remove(); f = null
  dorme(false)
  document.title = casa.titolo
  if (storia) history.pushState(null, '', casa.url)
}

/** La cornice nella pagina di fuori. `suona()`: la musica sta suonando (solo allora i link restano qui); `abbassa(sec)`. */
export function avviaCornice({ suona, abbassa }) {
  if (fuori || window.pzkkoCornice) return
  const s = document.createElement('style')
  s.textContent = 'iframe.cornice{position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;z-index:2147483647;visibility:hidden}'
    + '.in-cornice iframe.cornice{visibility:visible}.in-cornice body{overflow:hidden}'
    + '.in-cornice body>:not(iframe.cornice){visibility:hidden!important;pointer-events:none!important}'
  document.head.append(s)
  window.pzkkoCornice = {
    apre: (u) => suona() && vale(u),
    casa: (url) => !!casa && chiave(unirl(url)) === chiave(unirl(casa.url)),
    chiudi: () => chiudi(),
    abbassa,
  }
  // i link della pagina: quelli che qualcuno ha già preso (la barra, che aspetta il fruscio e poi chiama vai) no
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href]')
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
    const u = unirl(a.href)
    if (!window.pzkkoCornice.apre(u)) return
    e.preventDefault()
    apri(u.href)
  })
  // avanti e indietro fino alla pagina di fuori, e di nuovo dentro
  addEventListener('popstate', (e) => {
    if (e.state?.pzkkoCornice) { if (!f) apri(location.href, false) }
    else if (f) chiudi(false)
  })
}

// ── dentro: una pagina nel riquadro. I link verso un altro sito cambiano la finestra intera (un altro sito non si fa
// incorniciare); quello verso la pagina di fuori la risveglia ──
if (fuori) {
  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href]')
    if (!a || a.hasAttribute('download')) return
    const u = unirl(a.href)
    if (!stessa(u)) { if (!a.target || a.target === '_self') a.target = '_top'; return }
    if (!a.target && !e.defaultPrevented && fuori.casa(u.href) && !u.hash) { e.preventDefault(); fuori.chiudi() }
  })
}
