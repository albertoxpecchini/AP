// La guardia della manutenzione (6.11.2026, Alberto: «fai che c'è solo quello e non puoi usare il sito in generale»).
// Sta in testa a ogni pagina del sito (<script src="/manutenzione/guardia.js">, prima di tutto il resto): finché dura
// la manutenzione manda a /manutenzione/, il cartello sul muro della stazione di Monaco, e del sito non si vede altro.
// Fuori da quelle ore non fa niente. Le date stanno solo qui: il cartello le legge da window.pzkkoManutenzione.
//
// Passano lo stesso: chi apre una pagina con ?lavori (Alberto che lavora da remoto: resta valido su quel browser fino
// alla fine), il sito in locale (localhost, la rete di casa, Tailscale), gli strumenti che fotografano e collaudano le
// pagine (navigator.webdriver) e i motori di ricerca (che se no leggerebbero il cartello al posto del sito).
//
// Per un'altra manutenzione: INIZIO e FINE qui sotto, e le righe del volantino in manutenzione/index.html.
(function () {
  var INIZIO = Date.parse('2026-11-06T14:00:00+01:00') // venerdì 6 novembre, ore 14 di Mantova
  var FINE = Date.parse('2026-11-08T14:00:00+01:00') // domenica 8 novembre, ore 14
  var CHIAVE = 'pzkko-lavori'
  window.pzkkoManutenzione = { INIZIO: INIZIO, FINE: FINE }
  var ora = Date.now()
  if (ora < INIZIO || ora >= FINE) return
  if (/^\/manutenzione(\/|$)/.test(location.pathname)) return
  try {
    if (/[?&]lavori\b/.test(location.search)) localStorage.setItem(CHIAVE, String(FINE))
    if (localStorage.getItem(CHIAVE) === String(FINE)) return
  } catch (e) {}
  var casa = /^(localhost$|127\.|192\.168\.|10\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)|\.ts\.net$/.test(location.hostname)
  var macchina = navigator.webdriver || /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|discord|preview|lighthouse/i.test(navigator.userAgent)
  if (casa || macchina) return
  location.replace('/manutenzione/')
})()
