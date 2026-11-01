// Il cercapersone (23.10; dal 31.10 c'è solo lo zero): si apre dal tasto sul muro (chat/chat.js → apri), il cercapersone
// zero in 3D (telefono/zero/zero.js, il gadget bianco coi tasti arancioni) con dentro pzk os a 8 bit (zero/os/os.js).
//
// LO ZERO PER TUTTI (31.10, Alberto: «fai che cercapersone zero è predefinito e quello attuale si elimina per sempre»): fino
// al 31.10 lo zero si comprava nello shop (9.999 $pzk) e agli altri si apriva il cercapersone nero, una foto
// (art/chat-pager-grande/) con le app in HTML (telefono/app/) nello schermo. Il nero non c'è più, né la sua foto né le sue
// app: di quelle restano in telefono/app/ solo le logiche che pzk os usa. Lo zero non si vende più; chi l'aveva comprato
// tiene i suoi bonus.
//
// Come lo vuole Alberto:
// - L'APERTURA (29.10, Alberto: «voglio lui come mockup, deve aprirsi con le stesse logiche… è in 3d mi raccomando»; poi:
//   «non fare una finestra sopra il modello 3d… lo schermo lo metti esattamente dove è nel modello… rifai da 0 pzk os
//   adattato allo strumento»): la tela di zero.js prende la finestra e lo schermo è DENTRO il 3D, la trama dell'lcd sotto il
//   vetro trasparente del modello. Il tasto sul muro «si ingrandisce» (vola la telecamera, dalla posa della foto a quella
//   zoomata sullo schermo, 420 ms), lo schermo si accende (la retroilluminazione, 400 ms; Alberto: «appena premo il
//   cercapers no caricamento ma solo animazione che lo accendo tipo 400ms») e sotto c'è già pzk os: l'app chiesta da chi
//   l'ha aperto, se no l'ultima aperta, se no il desktop con la chiocciolina.
// - I TASTI SONO QUELLI VERI: la croce e OK muovono pzk os, INDIETRO è una mossa indietro, tenuto tre secondi spegne
//   (Alberto: «indietro premo una volta, spegni 3 secondi premuto indietro»). Dalla tastiera: le frecce, Invio, Backspace,
//   Esc. Chiudendo, la chiocciolina saluta sull'lcd e la telecamera torna sul tasto del muro.
// - LA BARRA DI STATO VERA (29.10, Alberto: «nella topbar del cercapersone metti dati veri tipo quelli del pc tipo wifi»).
// Sul cellulare la tela prende tutta la finestra e sotto c'è una barra coi due tasti (indietro, chiudi), perché i tasti 3D
// sono piccoli da toccare. (Il nome «telefono» è rimasto dalla prima versione, che era un telefono.)
//
//   apri(app?, opz?)   apre il cercapersone (sull'app, se chiesta); opz.da: il tasto da cui si apre (vola da lì)
//   chiudi()           spegne, saluta e torna nel tasto
//   home()             il desktop di pzk os
//   indietro()         una mossa indietro
//   vai(app, opz?)     cambia app (opz.comando: per la chat, un comando da mandare appena aperta)

import * as pzk from '../games/pzk.js'
import * as zaino from '../chat/zaino.js'
import * as tomodachi from '../chat/tomodachi.js'
import * as led from '../chat/led.js'
// le musichette e i suonini (26.10, suono/interfaccia.js)
import { musichetta } from '../suono/interfaccia.js'
import { ricordo, ricorda } from './ricordi.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const PIENO = matchMedia('(max-width:700px),(max-height:520px)') // il cellulare: schermo intero
const sorgenteLcd = () => origine?.querySelector('.ct-lcd canvas') ?? document.querySelector('.chat-tasto .ct-lcd canvas')

/** Le app del menu di pzk os: icona (una delle nostre), badge (quanti «da fare»: accendono il led). */
export const APP = [
  { id: 'chat', nome: 'chat', icona: 'app-chat', badge: () => (zaino.manca('giornaliero') === 0 ? 1 : 0) },
  // il profilo (26.10): tutti i numeri e la faccia, il colore, la cornice e il motto che vedono gli altri
  { id: 'profilo', nome: 'profilo', icona: 'app-profilo' },
  // l'account (26.10): il conto, il cambio, gli invii e il resto, che prima stavano nelle pagine del wallet
  { id: 'account', nome: 'account', icona: 'app-account' },
  { id: 'negozio', nome: 'shop', icona: 'app-shop' },
  // il pzkstore (29.10): le app da comprare (la lavatrice, il decifratore). Il pallino: quelle che ti servirebbero e non hai
  { id: 'pzkstore', nome: 'pzkstore', icona: 'app-pzkstore', badge: () => (pzk.conto() ? import('./app/pzkstore.js').then((m) => m.daComprare()) : 0) },
  { id: 'sfide', nome: 'sfide', icona: 'app-sfide', badge: () => import('../chat/sfide.js').then((m) => m.daRiscuotere()) },
  { id: 'quiz', nome: 'quiz', icona: 'app-quiz' },
  { id: 'missioni', nome: 'quest', icona: 'app-quest', badge: () => import('../chat/missioni.js').then((m) => m.pronte()) },
  { id: 'giocatori', nome: 'giocatori', icona: 'app-giocatori', badge: () => import('../chat/lumaca-avvisi.js').then((m) => m.daVedere().length) }, // la lumachina ha combinato qualcosa
  { id: 'zaino', nome: 'zaino', icona: 'app-zaino' },
  // la miniera (23.10): il pallino quando la memoria è piena (la postazione non mina più finché non incassi)
  { id: 'miniera', nome: 'miniera', icona: 'app-miniera', badge: () => import('../chat/miniera.js').then((m) => (m.piena?.() ? 1 : 0)).catch(() => 0) },
  { id: 'foto', nome: 'foto', icona: 'app-foto' },
  // virtual (23.10 sera): le scommesse sul calcio inventato; il pallino: le vincite non ancora viste, o le scommesse aperte
  // sulla partita che sta per chiudere (meno di un minuto)
  { id: 'virtual', nome: 'virtual', icona: 'app-virtual', badge: () => import('../games/virtual/schedina.js').then((m) => { m.avvia(); return m.daVedere().length + m.aperteInChiusura() }) },
  { id: 'banca', nome: 'banca', icona: 'app-banca', azione: () => pzk.apriWallet() },
  // l'economia (26.10, api/_economia.mjs): il colpo alla cassa di pzk, la lavatrice dei soldi sporchi, il decifratore dei wallet
  // trovati dallo spazzino. Il pallino della rapina: la galera. Dal 29.10 la lavatrice e il decifratore si comprano nel
  // pzkstore (store: true): ci sono solo se installati (se), e aperti senza averli portano alla loro scheda (vai)
  { id: 'rapina', nome: 'rapina', icona: 'app-rapina', badge: () => (pzk.inGalera() ? 1 : 0) },
  { id: 'lavatrice', nome: 'lavatrice', icona: 'app-lavatrice', store: true, se: () => zaino.installata('lavatrice'), badge: () => (zaino.installata('lavatrice') && pzk.lavaggio()?.fino <= Date.now() ? 1 : 0) },
  { id: 'decifratore', nome: 'decifra', icona: 'app-decifratore', store: true, se: () => zaino.installata('decifratore'), badge: () => (zaino.installata('decifratore') ? zaino.quanti('wallet-pzk') + zaino.quanti('chiavetta') : 0) },
  // le app veloci (26.10): le conversioni fra basi, la calcolatrice da geometra, il compilatore C, la cucina del Mincio
  { id: 'conversioni', nome: 'bin·hex', icona: 'app-conversioni' },
  { id: 'calcolatrice', nome: 'calcoli', icona: 'app-calcolatrice' },
  { id: 'compilatore', nome: 'codice C', icona: 'app-compilatore' },
  { id: 'cucina', nome: 'cucina', icona: 'app-cucina' },
]

let dlg = null, ledEl = null
let zero = null // il rig 3D (zero/zero.js)
let os = null // pzk os a 8 bit (zero/os/os.js), lo stesso che gira sul muro
let orologio = 0
let dentro = false // acceso: da quando si apre a quando si chiude
let giro = 0 // cresce a ogni apertura e chiusura: un'apertura vecchia non apre niente
let chiudendo = null, sveglia = null // la chiusura in corso, e come accorciarla (un secondo «chiudi»)
let origine = null // il tasto da cui si è aperto

const ora = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
/** Un'attesa che un secondo «chiudi» può accorciare. */
const aspetta = (ms) => new Promise((ok) => { const t = setTimeout(ok, ms); sveglia = () => { clearTimeout(t); ok() } })
const visibile = (r) => r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth

// le regole del dialog e del tasto vestito (zero.css): index.html la mette già nella testa, qui si aspetta che ci sia
let css = null
const stile = () => (css ??= new Promise((ok) => {
  const c = document.querySelector('link[data-zero]')
  if (c?.sheet) return ok()
  const l = c ?? Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/telefono/zero/zero.css' })
  l.setAttribute('data-zero', '')
  l.addEventListener('load', ok, { once: true }); l.addEventListener('error', ok, { once: true })
  if (!c) document.head.appendChild(l)
}))

// ── costruzione: il dialog vuoto, la tela 3D (zero.js), pzk os e i tasti ──
async function costruisci() {
  if (dlg) return
  dlg = document.createElement('dialog')
  dlg.className = 'tel zero'
  dlg.setAttribute('aria-label', 'il cercapersone dei $pzk')
  // il led (nascosto: zero.js lo guarda e accende quello 3D) e, sul cellulare, la barra dei due tasti
  dlg.innerHTML = `<div class="t-corpo" tabindex="-1"><i class="t-led" aria-hidden="true"></i></div>
    <nav class="t-nav" aria-label="i tasti"><button type="button" data-t="indietro">indietro</button><button type="button" data-t="chiudi">chiudi</button></nav>`
  document.body.appendChild(dlg)
  ledEl = dlg.querySelector('.t-led')
  led.collega(ledEl) // sfarfalla quando il sistema lavora (chat/led.js)
  const [m, o] = await Promise.all([import('./zero/zero.js'), import('./zero/os/os.js')])
  os = o
  zero = m.crea({ dlg, ledEl })
  // le app del menu di pzk os: quelle di serie e quelle installate dal pzkstore; si rifà quando lo zaino cambia (un'app
  // comprata compare subito, una tolta sparisce)
  const appOs = () => APP.filter((a) => !a.se || a.se()).map((a) => ({ id: a.id, nome: a.nome, icona: a.icona }))
  os.configura({ app: appOs(), tomodachi: sorgenteLcd() })
  let ultimeApp = appOs().map((a) => a.id).join()
  zaino.ascolta(() => {
    const ids = appOs().map((a) => a.id).join()
    if (ids !== ultimeApp) { ultimeApp = ids; os.configura({ app: appOs() }) }
    if (dlg.open) { aggiornaStato(); aggiornaLed() }
  })
  pzk.osserva(() => { if (dlg.open) aggiornaLed() })
  os.ascoltaVista((v) => { if (dentro) ricorda('cercapersone', { app: v?.app ?? null }) }) // riaprendo si torna all'app di prima
  zero.onTasto = (nome, verso) => { if (!dentro || chiudendo) return; if (nome === 'lcd') { if (os.tocca(verso.x, verso.y)) led.colpo(40); return } led.colpo(60); if (nome === 'spegni') chiudi(); else os.tasto(nome === 'croce' ? verso : nome) } // (lcd: il clic del mouse sullo schermo)
  zero.cliccabile = (x, y) => dentro && !chiudendo && os.cliccabile(x, y)
  zero.onFuori = () => chiudi()

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (chiudendo || !dentro || !os.tasto('indietro')) chiudi() }) // Esc: prima indietro, dal desktop si chiude
  dlg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')
    if (t?.dataset.t === 'chiudi') chiudi()
    else if (t?.dataset.t === 'indietro') indietro()
  })
  tastiera()
  // la barra di stato vera: la rete e la batteria cambiano da sole
  for (const ev of ['online', 'offline']) addEventListener(ev, () => { if (dlg.open) misuraPing() })
  navigator.connection?.addEventListener?.('change', () => { if (dlg.open) aggiornaStato() })
  navigator.getBattery?.().then((b) => {
    pila = b
    for (const ev of ['levelchange', 'chargingchange']) b.addEventListener(ev, () => { if (dlg.open) aggiornaStato() })
    if (dlg.open) aggiornaStato()
  }).catch(() => {})
  // chiuso da fuori (Esc che il browser non lascia fermare, un altro script): si rimette a posto quello che il volo di
  // ritorno avrebbe fatto (il tasto sul muro, il 3D fermo, pzk os al desktop)
  dlg.addEventListener('close', () => { if (chiudendo || !dentro) return; dentro = false; giro++; clearInterval(orologio); clearInterval(timerPing); if (origine) origine.style.visibility = ''; dlg.classList.remove('fermo', 'zoom', 'zoom-nascosto', 'zoom-sfondo'); zero.cavo(false); zero.ferma(); os.home() })
  new ResizeObserver(adatta).observe(dlg)
  PIENO.addEventListener('change', adatta)
  adatta()
}
/** La posa aperta rifatta se la finestra cambia; sul cellulare la barra dei tasti. */
function adatta() {
  dlg.classList.toggle('pieno', PIENO.matches)
  if (dlg.open && dentro && !dlg.classList.contains('zoom')) zero.misura()
}

// ── la tastiera: tutto a pzk os (le frecce sono la croce, Invio è OK, Backspace è INDIETRO o cancella, le lettere si
// scrivono). INDIETRO premuto e lasciato è una mossa indietro, tenuto tre secondi spegne; mentre si scrive, Backspace
// cancella una lettera (os.scrivendo) ──
let tenutaIndietro = 0, spentoDaIndietro = false
function tieniIndietro() {
  if (tenutaIndietro) return
  spentoDaIndietro = false
  zero.premi('indietro', null, { tieni: true })
  tenutaIndietro = setTimeout(() => { tenutaIndietro = 0; spentoDaIndietro = true; zero.lascia('indietro'); chiudi() }, 3000)
}
function lasciaIndietro() {
  zero.lascia('indietro')
  if (!tenutaIndietro) return
  clearTimeout(tenutaIndietro); tenutaIndietro = 0
  if (!spentoDaIndietro) { led.colpo(60); os.tasto('indietro') }
}
function tastiera() {
  dlg.addEventListener('keydown', (e) => {
    const ctrlInvio = e.key === 'Enter' && (e.ctrlKey || e.metaKey) // (Ctrl+Invio è il tasto OK, anche dove Invio va a capo: l'editor di «codice C»)
    if (!dentro || e.altKey || ((e.ctrlKey || e.metaKey) && !ctrlInvio) || e.target.closest?.('input, textarea, select, [contenteditable]')) return
    const v = { ArrowRight: 'dx', ArrowLeft: 'sx', ArrowUp: 'su', ArrowDown: 'giu' }[e.key]
    if (v) { e.preventDefault(); zero.premi('croce', v, { tieni: true }); led.colpo(40); os.tasto(v) } // (giù finché il tasto resta premuto)
    else if (e.key === 'Enter') { e.preventDefault(); if (!e.repeat) { zero.premi('ok', null, { tieni: true }); led.colpo(40); if (ctrlInvio) os.tasto('ok'); else os.invio() } }
    else if (e.key === 'Backspace') { e.preventDefault(); if (os.scrivendo()) os.cancella(); else if (!e.repeat) tieniIndietro() }
    else if (e.key === 'Tab') { e.preventDefault(); os.tasto('dx') }
    else if (e.key === 'Escape') { e.preventDefault(); if (!e.repeat && !chiudendo) { if (!os.tasto('indietro')) chiudi() } } // (qui e non nel cancel del dialog: il secondo Esc di fila Chrome lo chiude senza chiedere)
    else if (e.key.length === 1) { e.preventDefault(); os.carattere(e.key) }
  })
  dlg.addEventListener('keyup', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
    if (e.key === 'Backspace') lasciaIndietro()
    else if (e.key.startsWith('Arrow')) zero.lascia('croce')
    else if (e.key === 'Enter') zero.lascia('ok')
  })
}

// ── la barra di stato vera (29.10) ──
// La rete, l'ora e la batteria del computer o del telefono di chi guarda. La rete: online o no (navigator.onLine), il tipo
// quando il browser lo dice (navigator.connection.type: wifi, ethernet, cellulare, sui telefoni Android), il ping vero (una
// richiesta HEAD piccola a pzkko.it all'apertura e ogni 30 secondi, a cercapersone aperto). Le tre tacche del wifi le dà il
// ping. La batteria: navigator.getBattery (Chrome ed Edge, anche sul pc: un fisso dice 100 % in carica, e il cavo usb-c
// entra); dove il browser non la dice (Safari, Firefox) resta quella del gioco qui sotto, come nel wallet.
let ping = null, pila = null, timerPing = 0
async function misuraPing() {
  if (!navigator.onLine) { ping = null; return aggiornaStato() }
  const t0 = performance.now()
  try { await fetch(`/favicon.png?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }); ping = Math.round(performance.now() - t0) } catch { ping = null }
  if (dlg?.open) aggiornaStato()
}
function tacche() {
  const c = navigator.connection
  if (!navigator.onLine || c?.type === 'none') return 0
  const ms = ping ?? (c?.rtt || null)
  return ms == null ? 2 : ms <= 80 ? 3 : ms <= 250 ? 2 : 1
}
const batteriaVera = () => (pila ? { pct: Math.round(pila.level * 100), carica: pila.charging } : batteria())

// ── la batteria del gioco, come quella del wallet: 100 % alle 7, 2 % alle 19, poi in carica fino alle 7 (col cavo usb-c
// nella testata). L'ora è quella del gioco (window.pzkkoOrologio.perGioco, come nel wallet) ──
function oraMantova() {
  const o = window.pzkkoOrologio, ms = o?.perGioco?.() ?? o?.adesso?.() ?? Date.now()
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date(ms))
  return (Number(p.find((x) => x.type === 'hour').value) % 24) + Number(p.find((x) => x.type === 'minute').value) / 60
}
function batteria() {
  const h = oraMantova()
  if (h >= 7 && h < 19) return { pct: Math.round(100 - 98 * ((h - 7) / 12)), carica: false }
  return { pct: Math.round(2 + 98 * ((h >= 19 ? h - 19 : h + 5) / 12)), carica: true }
}

function aggiornaStato() {
  const b = batteriaVera()
  dlg.classList.toggle('carica', b.carica) // il cavo usb-c nella testata
  os.stato({ ora: ora(), nome: pzk.conto()?.nome ?? '', pct: b.pct, carica: b.carica, tacche: tacche() })
}
/** Il led rosso del cercapersone: lampeggia quando qualche app ha qualcosa da fare (i pallini, chiesti tutti insieme). */
async function aggiornaLed() {
  const n = await Promise.all(APP.map((a) => (a.badge ? Promise.resolve().then(a.badge).catch(() => 0) : 0)))
  ledEl?.classList.toggle('on', n.some((x) => Number(x) > 0))
}

// ── l'apertura: la tela 3D a tutta finestra disegna il cercapersone esattamente sopra il tasto del muro (la stessa posa della
// foto, storto uguale), il tasto si nasconde e la telecamera vola alla posa zoomata sullo schermo (420 ms) con pzk os acceso
// sull'lcd (lo stesso del muro: il desktop con la chiocciolina); arrivata, l'accensione: la retroilluminazione cala e risale
// (400 ms) e sotto c'è già l'app chiesta. Chiudendo, al contrario: la luce cala, pzk os torna al desktop, la chiocciolina
// saluta e la telecamera torna sul tasto ──
async function ingrandisci(prepara) {
  const r0 = origine?.getBoundingClientRect()
  const volo = !RIDOTTO.matches && visibile(r0)
  dlg.classList.add('fermo', 'zoom', 'zoom-nascosto')
  dlg.showModal(); dlg.querySelector('.t-corpo').focus({ preventScroll: true })
  zero.riprendi(); os.avvia()
  os.configura({ tomodachi: sorgenteLcd() })
  os.home()
  zero.luce(1)
  if (volo) {
    await zero.muro(origine) // il 3D sopra il tasto, identico alla foto: il tasto «parte»
    origine.style.visibility = 'hidden'
    requestAnimationFrame(() => dlg.classList.add('zoom-sfondo'))
  }
  await zero.apri({ ms: volo ? 420 : 0 })
  if (dlg.classList.contains('carica') && !PIENO.matches) zero.cavo(true) // la spina 3D, nella porta sulla testata
  musichetta('accendi')
  led.colpo(400)
  await zero.luce(0.2, 130)
  await prepara()
  dlg.classList.remove('zoom-nascosto', 'zoom', 'zoom-sfondo')
  await zero.luce(1, 270)
  // al primo accesso la guida (Alberto: «al primo accesso spiega come funziona»); poi, senza conto, l'account (senza conto
  // non si entra: la home col lucchetto, os.js)
  Promise.resolve(os.guidaVista() ? null : os.guida()).then(() => { if (dentro && !pzk.conto()) os.apri('account') })
}
async function rimpicciolisci() {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) return false
  dlg.classList.add('zoom', 'zoom-nascosto')
  await zero.chiudi(origine)
  origine.style.visibility = ''
  dlg.close()
  dlg.classList.remove('zoom', 'zoom-nascosto')
  zero.cavo(false); zero.ferma()
  return true
}
/** Lo spegnimento: la retroilluminazione cala, pzk os torna al desktop e la luce risale sulla chiocciolina. */
async function spegni() {
  musichetta('spegni')
  await zero.luce(0.2, 300)
  os.home()
  await zero.luce(1, 200)
}

// ── apri, chiudi, vai ──
export async function apri(app = null, opz = {}) {
  await stile()
  await costruisci()
  if (chiudendo) return // sta salutando: prima finisce di chiudersi
  if (dlg.open) { if (app) await vai(app, opz); else home(); return }
  if (opz.da) origine = opz.da
  const mio = ++giro
  dentro = true
  dlg.classList.remove('chiude')
  aggiornaStato()
  aggiornaLed()
  misuraPing()
  // sotto lo schermo spento, pzk os: l'app chiesta da chi apre vince; se nessuno ne chiede una, quella che era aperta l'ultima
  // volta (Alberto, 23.10: «memorizza sempre le azioni»; da scassato solo la chat), se no il desktop
  const ultima = ricordo('cercapersone', { app: null }).app
  const a = app ?? (ultima && APP.some((x) => x.id === ultima) && (!zaino.pagerRotto() || ultima === 'chat') ? ultima : null)
  await ingrandisci(async () => { if (a) await vai(a, { ...opz, muto: true }); else home() })
  if (mio !== giro) return // chiuso mentre si accendeva
  clearInterval(orologio); clearInterval(timerPing)
  orologio = setInterval(() => { if (dlg.open) aggiornaStato() }, 15_000)
  timerPing = setInterval(() => { if (dlg.open && !document.hidden) misuraPing() }, 30_000)
}
/** Spegne lo schermo, la chiocciolina saluta, e il cercapersone torna nel tasto da solo. */
export async function chiudi() {
  if (!dlg?.open) return
  if (chiudendo) { sveglia?.(); return chiudendo } // un secondo «chiudi» mentre saluta: si chiude subito
  if (dlg.classList.contains('zoom')) return
  chiudendo = (async () => {
    giro++
    clearInterval(orologio); clearInterval(timerPing)
    if (dentro) { led.colpo(400); await spegni() } else os.home()
    dentro = false
    tomodachi.saluta?.(2600)
    await aspetta(RIDOTTO.matches ? 1200 : 2300)
    sveglia = null
    if (!(await rimpicciolisci())) {
      if (origine) origine.style.visibility = ''
      if (!RIDOTTO.matches) {
        dlg.classList.add('chiude')
        await new Promise((ok) => dlg.addEventListener('animationend', ok, { once: true }))
        dlg.classList.remove('chiude')
      }
      dlg.close()
      zero.ferma()
    }
    dlg.classList.remove('fermo')
  })()
  try { await chiudendo } finally { chiudendo = null }
}
/** Il desktop di pzk os. */
export function home() { os?.home() }
/** Una mossa indietro (pzk os: la pagina interna dell'app, poi il menu, poi il desktop). */
export function indietro() {
  if (dentro && !chiudendo) { led.colpo(60); os.tasto('indietro') }
}
export async function vai(id, opz = {}) {
  const a = APP.find((x) => x.id === id)
  if (!a || !os) return
  if (a.azione && !os.pronta(id)) { a.azione(); return } // (un'app con l'azione la fa solo se pzk os non ha la sua)
  led.colpo(140)
  if (a.store && a.se && !a.se()) { await os.apri('pzkstore', { comando: id }); return } // un'app del pzkstore che non hai: la sua scheda
  await os.apri(id)
  if (id === 'chat' && opz.comando && pzk.conto()) (await import('./zero/os/chat.js')).vista().comando(opz.comando) // (senza conto si è aperto l'account: il comando aspetta)
}
export const aperto = () => !!dlg?.open
