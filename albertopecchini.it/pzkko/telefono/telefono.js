// Il cercapersone grande (23.10): si apre dal cercapersone piccolo sotto il wallet (chat/chat.js → apri), che si ingrandisce e
// diventa lo stesso cercapersone, disegnato in alta qualità (art/chat-pager-grande/pager-grande.webp, gpt-image-2, fogli-chat.js),
// orizzontale come quello piccolo. Nello schermo vive «pzk os»: la barra di stato (la rete, l'ora e la batteria vere di chi
// guarda), la home con i widget (il saldo, le sfide, le notizie dei giocatori) e le app: Chat (il bot), Shop, Sfide, Quiz,
// Quest, Giocatori, Zaino, Foto, Banca (il wallet) e le altre.
//
// Come lo vuole Alberto:
// - L'ACCENSIONE (29.10, Alberto: «appena premo il cercapers no caricamento ma solo animazione che lo accendo tipo 400ms»):
//   il cercapersone piccolo si ingrandisce, il suo lcd si spegne e lo schermo grande si accende come un vecchio televisore,
//   un punto che diventa una riga e poi tutto lo schermo, in 400 ms; sotto c'è già pzk os (l'app chiesta da chi l'ha aperto,
//   se no l'ultima aperta, se no la home). Dal 23.10 sera al 29.10 c'era la porta: il tomodachi, il tasto ACCEDI e tre
//   secondi di baggianate. La porta è rimasta per il saluto.
// - IL TASTO DI SOPRA È ROSSO E SI CHIAMA CHIUDI: lo schermo si spegne come un vecchio tubo catodico (si schiaccia in una riga
//   bianca, poi in un punto), ricompare il tomodachi che saluta e dopo un paio di secondi il cercapersone si chiude da solo,
//   rimpicciolendosi nel tasto. Toccare fuori o Esc nella home fanno lo stesso; un secondo «chiudi» mentre saluta chiude subito.
// - IL TASTO DI SOTTO È INDIETRO, ROSSO ANCHE LUI (29.10, Alberto: «tasto indietro rosso come chiudi così uno non lo preme
//   perché verde ma legge prima»; prima era verde): torna indietro di una mossa (la pagina interna dell'app, poi l'app di
//   prima, poi la home) e si può premere a raffica; nella home non fa niente, perché si è già usciti da tutto.
// - LA HOME A PAGINE (29.10, Alberto: «spazio per icone 3x3 poi deve scorrere … come l'iphone dei puntini sotto in mezzo»): a
//   sinistra l'ora e i widget, a destra le app nove per pagina, divise per genere (PAGINE); si scorrono di lato col dito, la
//   rotella, il mouse trascinato o le frecce, e i puntini sotto in mezzo dicono quante pagine ci sono e dove sei (si possono
//   premere). Un puntino cerchiato di rosso: in quella pagina c'è un'app col pallino.
// Sul cellulare niente cornice: lo schermo prende tutta la finestra e i due tasti diventano una barra in basso.
// Ogni app è un modulo di telefono/app/ che si carica la prima volta che la apri e poi resta montata (la chat non perde i
// messaggi quando torni alla home). (Il nome «telefono» è rimasto dalla prima versione, che era un telefono.)
//
//   apri(app?, opz?)   apre il cercapersone sulla porta (poi la home o l'app); opz.da: il tasto da cui si apre (si ingrandisce lui)
//   chiudi()           spegne, saluta e lo rimpicciolisce dentro il tasto
//   home()             torna alla home
//   indietro()         una mossa indietro
//   vai(app, opz?)     cambia app
// Un'app esporta `monta(host, ctx)` e ritorna { mostra(opz), nascondi() } se le servono; dal ctx ha testata(titolo, destra),
// home, vai, toast(html, { icona }). La freccia della testata (.t-indietro) fa come il tasto verde: se l'app ha una pagina
// interna da chiudere la intercetta lei (in cattura, con stopPropagation), se no si torna all'app di prima o alla home.

import * as pzk from '../games/pzk.js'
import * as zaino from '../chat/zaino.js'
import * as tomodachi from '../chat/tomodachi.js'
import { icona } from '../chat/icone.js'
import * as led from '../chat/led.js'
// le musichette e i suonini (26.10, suono/interfaccia.js: ogni app ha la sua sigla, ogni tasto il suo bip)
import { musichetta } from '../suono/interfaccia.js'
import { tubo, allinea } from '../games/crt.js'
import { tieni, ricordo, ricorda } from './ricordi.js'

const CREPE = '/art/chat-pager-crepe/crepe.webp', CREPE_PICCOLA = '/art/chat-pager-crepe/crepe-piccola.webp' // il vetro rotto del cercapersone scassato (la piccola è quella del tasto, chat.js)

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const PIENO = matchMedia('(max-width:700px),(max-height:520px)') // il cellulare: schermo intero
// il tasto sotto il wallet è LA STESSA FOTO rimpicciolita (pager-piccolo.webp), con l'lcd nelle stesse quote: così
// l'apertura è un ingrandimento puro e non si vede mai il cambio da una foto all'altra
const PAGER = { src: '/art/chat-pager-grande/pager-grande.webp', w: 1341, h: 774, lcd: [8.352, 24.677, 66.294, 56.202] }
const precarica = new Image()
precarica.src = PAGER.src // la foto grande è già pronta quando si tocca il tasto

/** Le app: icona (una delle nostre), colore della piastrella, badge (quanti «da fare» mostrare sul pallino). */
export const APP = [
  { id: 'chat', nome: 'chat', icona: 'app-chat', carica: () => import('./app/chat.js'), badge: () => (zaino.manca('giornaliero') === 0 ? 1 : 0) },
  // il profilo (26.10): tutti i numeri e la faccia, il colore, la cornice e il motto che vedono gli altri
  { id: 'profilo', nome: 'profilo', icona: 'app-profilo', carica: () => import('./app/profilo.js') },
  // l'account (26.10): il conto, il cambio, gli invii e il resto, che prima stavano nelle pagine del wallet
  { id: 'account', nome: 'account', icona: 'app-account', carica: () => import('./app/account.js') },
  { id: 'negozio', nome: 'shop', icona: 'app-shop', carica: () => import('./app/negozio.js') },
  { id: 'sfide', nome: 'sfide', icona: 'app-sfide', carica: () => import('./app/sfide.js'), badge: () => import('../chat/sfide.js').then((m) => m.daRiscuotere()) },
  { id: 'quiz', nome: 'quiz', icona: 'app-quiz', carica: () => import('./app/quiz.js') },
  { id: 'missioni', nome: 'quest', icona: 'app-quest', carica: () => import('./app/missioni.js'), badge: () => import('../chat/missioni.js').then((m) => m.pronte()) },
  { id: 'giocatori', nome: 'giocatori', icona: 'app-giocatori', carica: () => import('./app/giocatori.js'), badge: () => import('../chat/lumaca-avvisi.js').then((m) => m.daVedere().length) }, // la lumachina ha combinato qualcosa
  { id: 'zaino', nome: 'zaino', icona: 'app-zaino', carica: () => import('./app/zaino.js') },
  // la miniera (23.10): il pallino quando la memoria è piena (la postazione non mina più finché non incassi)
  { id: 'miniera', nome: 'miniera', icona: 'app-miniera', carica: () => import('./app/miniera.js'), badge: () => import('../chat/miniera.js').then((m) => (m.piena?.() ? 1 : 0)).catch(() => 0) },
  { id: 'foto', nome: 'foto', icona: 'app-foto', carica: () => import('./app/foto.js') },
  // virtual (23.10 sera): le scommesse sul calcio inventato, la stessa partita e la stessa schedina del gioco grande; il
  // pallino: le vincite non ancora viste, o le scommesse aperte sulla partita che sta per chiudere (meno di un minuto)
  { id: 'virtual', nome: 'virtual', icona: 'app-virtual', carica: () => import('./app/virtual.js'), badge: () => import('../games/virtual/schedina.js').then((m) => { m.avvia(); return m.daVedere().length + m.aperteInChiusura() }) },
  { id: 'banca', nome: 'banca', icona: 'app-banca', azione: () => pzk.apriWallet() },
  // l'economia (26.10, api/_economia.mjs): il colpo alla cassa di pzk, la lavatrice dei soldi sporchi, il decifratore dei wallet
  // trovati dallo spazzino (solo se installato dalla chat: «installa decifratore»). Il pallino della rapina: la galera
  { id: 'rapina', nome: 'rapina', icona: 'app-rapina', carica: () => import('./app/rapina.js'), badge: () => (pzk.inGalera() ? 1 : 0) },
  { id: 'lavatrice', nome: 'lavatrice', icona: 'app-lavatrice', carica: () => import('./app/lavatrice.js'), badge: () => (pzk.lavaggio()?.fino <= Date.now() ? 1 : 0) },
  { id: 'decifratore', nome: 'decifra', icona: 'app-decifratore', carica: () => import('./app/decifratore.js'), se: () => zaino.installata('decifratore'), badge: () => (zaino.installata('decifratore') ? zaino.quanti('wallet-pzk') + zaino.quanti('chiavetta') : 0) },
  // le app veloci (26.10): le conversioni fra basi, la calcolatrice da geometra, il compilatore C, la cucina del Mincio
  { id: 'conversioni', nome: 'bin·hex', icona: 'app-conversioni', carica: () => import('./app/conversioni.js') },
  { id: 'calcolatrice', nome: 'calcoli', icona: 'app-calcolatrice', carica: () => import('./app/calcolatrice.js') },
  { id: 'compilatore', nome: 'codice C', icona: 'app-compilatore', carica: () => import('./app/compilatore.js') },
  { id: 'cucina', nome: 'cucina', icona: 'app-cucina', carica: () => import('./app/cucina.js') },
]

// le pagine della home (29.10): nove app per pagina (3 × 3), divise per genere; un genere con più di nove app va a capo in
// una pagina sua, e un'app nuova che non sta in nessuna lista finisce nell'ultima
const PAGINE = [
  ['chat', 'profilo', 'account', 'negozio', 'sfide', 'quiz', 'missioni', 'giocatori', 'zaino'], // tu e il gioco
  ['miniera', 'foto', 'virtual', 'banca', 'rapina', 'lavatrice', 'decifratore'], // i soldi
  ['conversioni', 'calcolatrice', 'compilatore', 'cucina'], // gli attrezzi
]
const PER_PAGINA = 9

let dlg = null, corpo = null, schermo = null, palco = null, vista = null, homeEl = null, tostoEl = null, statoEl = null, ledEl = null, porta = null
let corrente = null // l'id dell'app in primo piano (null: la home)
const storia = [] // le app aperte prima, per il tasto «indietro»
const montate = new Map() // id → { host, ist }
let cssPronto = null
let orologio = 0
let dentro = false // acceso: da quando si apre a quando si chiude
// SENZA CONTO NON SI ENTRA (26.10, Alberto: «non puoi accedere al cercapersone se non ti registri/accedi»): acceso, finché
// non c'è un conto l'unica app è l'Account (vai e home ci rimandano); l'app che si voleva aprire aspetta qui, e quando il conto
// c'è (ctx.dopoAccesso, chiamato dall'app Account) si apre.
let daFare = null // { id, opz }
let giro = 0 // cresce a ogni apertura e chiusura: il caricamento di una porta vecchia non apre niente
let chiudendo = null, sveglia = null // la chiusura in corso, e come accorciarla (un secondo «chiudi»)

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const ora = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

function caricaStile() {
  const foglio = (href, marca) => new Promise((ok) => {
    if (document.querySelector(`link[href="${href}"]`) || document.querySelector(`link[${marca}]`)) return ok()
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = href; l.setAttribute(marca, '')
    l.onload = l.onerror = () => ok()
    document.head.appendChild(l)
  })
  // chat.css ha le variabili e la tipografia di tutte le app, telefono.css il cercapersone e le app
  return (cssPronto ??= Promise.all([foglio('/chat/chat.css', 'data-chat-css'), foglio('/telefono/telefono.css', 'data-telefono')]))
}

// ── la barra di stato vera (29.10, Alberto: «nella topbar del cercapersone metti dati veri tipo quelli del pc tipo wifi») ──
// La rete, l'ora e la batteria del computer o del telefono di chi guarda. La rete: online o no (navigator.onLine), il tipo
// quando il browser lo dice (navigator.connection.type: wifi, ethernet, cellulare, sui telefoni Android), il ping vero (una
// richiesta HEAD piccola a pzkko.it all'apertura e ogni 30 secondi, a cercapersone aperto) e la banda (connection.downlink,
// Chrome ed Edge, che si fermano a 10 Mb/s). Le tre tacche del wifi le dà il ping. La batteria: navigator.getBattery (Chrome
// ed Edge, anche sul pc: un fisso dice 100 % in carica, e il cavo usb-c entra); dove il browser non la dice (Safari,
// Firefox) resta quella del gioco qui sotto, come nel wallet.
let ping = null, pila = null, timerPing = 0
async function misuraPing() {
  if (!navigator.onLine) { ping = null; return aggiornaStato() }
  const t0 = performance.now()
  try { await fetch(`/favicon.png?ping=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }); ping = Math.round(performance.now() - t0) } catch { ping = null }
  if (dlg?.open) aggiornaStato()
}
function rete() {
  const c = navigator.connection
  if (!navigator.onLine || c?.type === 'none') return { tacche: 0, testo: 'offline' }
  const tipo = { wifi: 'wifi', ethernet: 'eth', cellular: c?.effectiveType ?? 'cell', bluetooth: 'bt', wimax: 'wimax' }[c?.type] ?? ''
  const ms = ping ?? (c?.rtt || null)
  const banda = c?.downlink ? `${c.downlink >= 10 ? '10+' : String(c.downlink).replace('.', ',')} mb/s` : ''
  return { tacche: ms == null ? 2 : ms <= 80 ? 3 : ms <= 250 ? 2 : 1, testo: [tipo, ms != null && `${ms} ms`, banda].filter(Boolean).join(' · ') }
}
const batteriaVera = () => (pila ? { pct: Math.round(pila.level * 100), carica: pila.charging } : batteria())

// ── la batteria del gioco, come quella del wallet: 100 % alle 7, 2 % alle 19, poi in carica fino alle 7 (col cavo usb-c
// sotto). È quella della barra solo dove il browser non dice quella vera. L'ora è quella del gioco
// (window.pzkkoOrologio.perGioco, come nel wallet): quella vera anche quando la pagina sta ferma a mezzogiorno per la luce;
// se la regia sposta l'orologio per provare, tutti e due si caricano insieme.
function oraMantova() {
  const o = window.pzkkoOrologio, ms = o?.perGioco?.() ?? o?.adesso?.() ?? Date.now()
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date(ms))
  return (Number(p.find((x) => x.type === 'hour').value) % 24) + Number(p.find((x) => x.type === 'minute').value) / 60
}
export function batteria() {
  const h = oraMantova()
  if (h >= 7 && h < 19) return { pct: Math.round(100 - 98 * ((h - 7) / 12)), carica: false }
  return { pct: Math.round(2 + 98 * ((h >= 19 ? h - 19 : h + 5) / 12)), carica: true }
}

// ── costruzione ──
function costruisci() {
  if (dlg) return
  dlg = document.createElement('dialog')
  dlg.className = 'tel'
  dlg.setAttribute('aria-label', 'il cercapersone dei $pzk')
  dlg.innerHTML = `<div class="t-corpo" tabindex="-1">
    <img class="t-cornice" src="${PAGER.src}" width="${PAGER.w}" height="${PAGER.h}" alt="" draggable="false">
    <div class="t-cavo-scatola" aria-hidden="true"><div class="t-cavo-gruppo"><div class="t-cavo-filo"></div><img class="t-cavo" src="/art/chat-pager-cavo/spina.webp" width="132" height="556" alt="" loading="lazy" draggable="false"></div></div>
    <div class="t-schermo chat" data-in="home">
      <div class="t-palco">
        <div class="t-stato" aria-hidden="true">
          <span class="t-rete"><svg class="t-wifi" viewBox="0 0 16 13"><circle cx="8" cy="11.5" r="1.3"/><path d="M5.9 9.4a3 3 0 0 1 4.2 0"/><path d="M3.4 6.9a6.5 6.5 0 0 1 9.2 0"/><path d="M.9 4.4a10 10 0 0 1 14.2 0"/></svg><b></b></span>
          <span class="t-ora"></span>
          <span class="t-batt"><i></i><i></i><i></i><i></i><i></i><b></b></span>
        </div>
        <div class="t-vista"><div class="t-home"></div></div>
        <div class="t-toast" role="status" aria-live="polite"></div>
        <nav class="t-nav" aria-label="i tasti"><button type="button" data-t="indietro">indietro</button><button type="button" data-t="chiudi">chiudi</button></nav>
      </div>
      <div class="t-porta" hidden><div class="t-porta-lcd"></div></div>
    </div>
    <i class="t-led" aria-hidden="true"></i>
    <button class="t-tasto su" type="button" data-t="chiudi" aria-label="tasto rosso di sopra: chiudi"></button>
    <button class="t-tasto giu" type="button" data-t="indietro" aria-label="tasto rosso di sotto: indietro"></button>
  </div>`
  document.body.appendChild(dlg)
  corpo = dlg.querySelector('.t-corpo')
  schermo = dlg.querySelector('.t-schermo')
  palco = dlg.querySelector('.t-palco')
  vista = dlg.querySelector('.t-vista')
  homeEl = dlg.querySelector('.t-home')
  tieni(homeEl, 'home') // la home si ridisegna a ogni cambio dello zaino: resta dov'è (telefono/ricordi.js)
  tostoEl = dlg.querySelector('.t-toast')
  statoEl = dlg.querySelector('.t-stato')
  ledEl = dlg.querySelector('.t-led')
  porta = dlg.querySelector('.t-porta')
  led.collega(ledEl) // sfarfalla quando il sistema lavora (chat/led.js)
  // lo schermo è un vecchio tubo catodico che sfarfalla, come quelli del wallet (games/crt.js), anche prima di accedere
  // (Alberto, 23.10): z 50, sopra la porta (45), la barra di stato e la barra dei tasti del cellulare, sotto il bianco dello
  // spegnimento (60). È «insieme» al cercapersone piccolo e al doppione che vola (chat/chat.js, doppione()): tremano
  // allo stesso ritmo, e allo scambio fra l'uno e l'altro il tubo non salta
  tubo(schermo, { z: 50, insieme: true })
  // le crepe del cercapersone scassato (23.10, dopo una morte: fa solo lavorare e ricomprare il nuovo): sopra le righe del
  // tubo (z 55), sotto il bianco dello spegnimento; prima del vetro, che resta l'ultimo figlio. L'immagine c'è da subito,
  // nascosta (.tel.scassato la mostra): quando muori non arriva dopo
  const crepe = new Image()
  Object.assign(crepe, { className: 't-crepe', src: CREPE, alt: '', draggable: false })
  schermo.insertBefore(crepe, schermo.querySelector('.crt-vetro'))
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); dentro && corrente && !chiudendo ? indietro() : chiudi() }) // Esc: prima indietro, dalla home si chiude
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  dlg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')
    if (!t) return
    const v = t.dataset.t
    if (v === 'chiudi') chiudi()
    else if (v === 'indietro') indietro({ daFreccia: t.classList.contains('t-indietro') })
    else if (v === 'home') home()
    else if (v.startsWith('app:')) vai(v.slice(4))
  })
  homeEl.addEventListener('click', (e) => {
    const p = e.target.closest('.t-punto')
    if (p) return vaiPagina(Number(p.dataset.pagina))
    const b = e.target.closest('[data-app]')
    if (b) vai(b.dataset.app, { tab: b.dataset.tab })
  })
  sfoglia()
  // un'app si carica appena il mouse ci passa sopra o il dito la tocca: al clic è già pronta, e lo spinner non si vede
  const scalda = (e) => { const b = e.target.closest?.('[data-app]'); APP.find((x) => x.id === b?.dataset.app)?.carica?.().catch(() => {}) }
  homeEl.addEventListener('pointerdown', scalda, { passive: true })
  homeEl.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') scalda(e) }, { passive: true })
  zaino.ascolta(() => { if (dlg.open) { aggiornaStato(); if (corrente) aggiornaLed(); else disegnaHome() } }) // lo stato: anche scassato o no (la home conta già i pallini e accende il led)
  pzk.osserva(() => {
    if (!corrente && dlg.open) disegnaHome()
    if (dlg.open && dentro && !pzk.conto() && corrente !== 'account') vai('account', { scheda: 'conto' }) // (uscito dal conto, anche da un'altra scheda)
  })
  // la barra di stato vera: la rete e la batteria cambiano da sole
  for (const ev of ['online', 'offline']) addEventListener(ev, () => { if (dlg.open) misuraPing() })
  navigator.connection?.addEventListener?.('change', () => { if (dlg.open) aggiornaStato() })
  navigator.getBattery?.().then((b) => {
    pila = b
    for (const ev of ['levelchange', 'chargingchange']) b.addEventListener(ev, () => { if (dlg.open) aggiornaStato() })
    if (dlg.open) aggiornaStato()
  }).catch(() => {})
  new ResizeObserver(adatta).observe(dlg)
  PIENO.addEventListener('change', adatta)
}

function aggiornaStato() {
  const b = batteriaVera(), r = rete()
  statoEl.querySelector('.t-ora').textContent = ora()
  const rt = statoEl.querySelector('.t-rete')
  rt.classList.toggle('giu', !r.tacche)
  rt.querySelectorAll('.t-wifi circle, .t-wifi path').forEach((s, i) => s.classList.toggle('on', r.tacche > 0 && i <= r.tacche))
  rt.querySelector('b').textContent = r.testo
  const bt = statoEl.querySelector('.t-batt')
  bt.classList.toggle('carica', b.carica); bt.classList.toggle('bassa', b.pct <= 15 && !b.carica)
  dlg.classList.toggle('carica', b.carica) // il cavo usb-c sotto il cercapersone, come quello del wallet
  dlg.classList.toggle('scassato', zaino.pagerRotto()) // dopo una morte: le crepe, e le app spente tranne la chat
  bt.querySelectorAll('i').forEach((s, i) => s.classList.toggle('on', b.pct > i * 20))
  bt.querySelector('b').textContent = `${b.pct}%`
}
/** I pallini di tutte le app, chiesti insieme (non uno dopo l'altro): id → quanti. */
async function contaBadge() {
  const n = await Promise.all(APP.map((a) => (a.badge ? Promise.resolve().then(a.badge).catch(() => 0) : 0)))
  return new Map(APP.map((a, i) => [a.id, Number(n[i]) || 0]))
}
/** Il led rosso del cercapersone: lampeggia quando qualche app ha qualcosa da fare. */
async function aggiornaLed() {
  let n = 0
  for (const v of (await contaBadge()).values()) n += v
  ledEl?.classList.toggle('on', n > 0)
}

// ── il palco: lo schermo vero si misura, e il palco (largo 760 punti) ci si adatta, così tutto cresce col cercapersone ──
const BASE = 760
function adatta() {
  if (!dlg || !schermo) return
  dlg.classList.toggle('pieno', PIENO.matches)
  if (PIENO.matches) { palco.style.transform = ''; palco.style.width = ''; palco.style.height = '' }
  else {
    const k = schermo.clientWidth / BASE
    if (!k) return
    palco.style.width = `${BASE}px`
    palco.style.height = `${schermo.clientHeight / k}px`
    palco.style.transform = `scale(${k})`
  }
  if (!corrente) vaiPagina(pagina, { liscio: false }) // le pagine cambiano larghezza: si resta su quella di prima
}
/** Quanto è ingrandito il palco: un pixel del mouse diviso questo è un punto del palco. */
const scala = () => (PIENO.matches ? 1 : schermo.clientWidth / BASE) || 1

// ── la home: a sinistra l'ora e i widget, a destra le app a pagine di 3 × 3 ──
const piastrella = (a, i) => `<button class="t-ico" type="button" data-app="${a.id}" style="--r:${[-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5, -1][i % 9]}deg"><span class="t-ico-q">${icona(a.icona)}<i class="t-badge" hidden></i></span><span class="t-ico-n">${a.nome}</span></button>`
/** Le app di ogni pagina (PAGINE, nove alla volta). */
function pagine() {
  const visibili = APP.filter((a) => !a.se || a.se())
  const gruppi = PAGINE.map((ids) => ids.map((id) => visibili.find((a) => a.id === id)).filter(Boolean))
  gruppi.at(-1).push(...visibili.filter((a) => !PAGINE.some((ids) => ids.includes(a.id))))
  const out = []
  for (const g of gruppi) for (let i = 0; i < g.length; i += PER_PAGINA) out.push(g.slice(i, i + PER_PAGINA))
  return out
}

// ── sfogliare le pagine: il dito (lo scorrimento del browser, con gli agganci di telefono.css), la rotella, il mouse
// trascinato, le frecce e i puntini. La pagina si ricorda (riaprendo si torna lì) ──
let pagina = ricordo('home', { pagina: 0 }).pagina
const pagineEl = () => homeEl?.querySelector('.t-pagine')
/** Va alla pagina n (liscio: scorrendo, come col dito; se no di colpo). */
function vaiPagina(n, { liscio = true } = {}) {
  const el = pagineEl()
  if (!el) return
  n = Math.max(0, Math.min(el.children.length - 1, n))
  if (el.clientWidth) el.scrollTo({ left: n * el.clientWidth, behavior: liscio && !RIDOTTO.matches ? 'smooth' : 'instant' })
  segnaPagina(n)
}
/** Il puntino acceso: quello della pagina n (di serie quella che si vede adesso). */
function segnaPagina(n) {
  const el = pagineEl()
  if (n === undefined) { if (!el?.clientWidth) return; n = Math.round(el.scrollLeft / el.clientWidth) }
  for (const p of homeEl.querySelectorAll('.t-punto')) p.classList.toggle('on', Number(p.dataset.pagina) === n)
  if (n !== pagina) { pagina = n; ricorda('home', { pagina }) }
}
function sfoglia() {
  let fotogramma = 0, ruota = 0
  homeEl.addEventListener('scroll', (e) => {
    if (!e.target.classList?.contains('t-pagine')) return
    cancelAnimationFrame(fotogramma); fotogramma = requestAnimationFrame(() => segnaPagina())
  }, { capture: true, passive: true })
  // la rotella: una tacca, una pagina (il trackpad che scorre di lato fa da sé; se la home scorre in su e in giù, come sul
  // cellulare in verticale, la rotella è sua)
  homeEl.addEventListener('wheel', (e) => {
    if (!e.target.closest?.('.t-pagine') || Math.abs(e.deltaX) >= Math.abs(e.deltaY) || homeEl.scrollHeight > homeEl.clientHeight + 4) return
    e.preventDefault()
    if (performance.now() < ruota || Math.abs(e.deltaY) < 4) return
    ruota = performance.now() + 380
    vaiPagina(pagina + Math.sign(e.deltaY))
  }, { passive: false })
  // il mouse trascina le pagine come un dito: oltre un sesto di pagina si gira, e il clic che segue non apre l'app sotto
  homeEl.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.t-pagine')
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
    const x0 = e.clientX, s0 = el.scrollLeft
    let mosso = false
    const muovi = (ev) => {
      const dx = (ev.clientX - x0) / scala()
      if (!mosso && Math.abs(dx) > 6) { mosso = true; homeEl.classList.add('trascina') }
      if (mosso) el.scrollLeft = s0 - dx
    }
    const fine = (ev) => {
      removeEventListener('pointermove', muovi); removeEventListener('pointerup', fine); removeEventListener('pointercancel', fine)
      if (!mosso) return
      homeEl.classList.remove('trascina')
      const dx = (ev.clientX - x0) / scala(), da = Math.round(s0 / el.clientWidth)
      vaiPagina(Math.abs(dx) > el.clientWidth / 6 ? da - Math.sign(dx) : da)
      const blocca = (c) => { c.stopPropagation(); c.preventDefault() }
      homeEl.addEventListener('click', blocca, { capture: true, once: true })
      setTimeout(() => homeEl.removeEventListener('click', blocca, { capture: true }), 0)
    }
    addEventListener('pointermove', muovi); addEventListener('pointerup', fine); addEventListener('pointercancel', fine)
  })
  // le frecce (e pagina su, pagina giù) nella home
  dlg.addEventListener('keydown', (e) => {
    if (corrente || !dentro || e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return
    const verso = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key]
    if (verso) { e.preventDefault(); vaiPagina(pagina + verso) }
  })
}
async function disegnaHome() {
  const d = new Date()
  const sfide = await import('../chat/sfide.js')
  const o = sfide.oggi()
  const liv = zaino.livello(), xp = zaino.xp(), da = zaino.xpPer(liv), a = zaino.xpPer(liv + 1)
  const pct = Math.max(0, Math.min(100, Math.round((100 * (xp - da)) / Math.max(1, a - da))))
  const e = pzk.euro()
  const html = `
    <div class="t-h-sx">
      <div class="t-w-ora"><b>${ora()}</b><span>${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div class="t-widget">
        <button class="t-w t-w-saldo" type="button" data-app="banca"><small>saldo</small><b class="pzk" title="${pzk.fmt(pzk.saldo())} $pzk">${pzk.fmtCorto(pzk.saldo())} $pzk</b>${e >= 0.01 ? `<span class="eur">EUR€ ${pzk.fmtEur(e)}</span>` : ''}<div class="t-xp"><i style="width:${pct}%"></i></div><small>livello ${liv} · ${xp - da}/${a - da} xp</small></button>
        <button class="t-w t-w-sfide" type="button" data-app="sfide"><small>sfide di oggi</small><b>${o.sfide.filter((x) => x.riscossa).length}/3</b><div class="t-pips">${o.sfide.map((x) => `<i class="${x.riscossa ? 'fatta' : x.pronta ? 'pronta' : ''}"></i>`).join('')}</div><small>${o.sfide.some((x) => x.pronta) ? 'da riscuotere!' : o.tutte ? 'tutte fatte' : 'da fare'}</small></button>
      </div>
      <button class="t-w t-w-notizie" type="button" data-app="giocatori" data-tab="notizie"><small>dalla banca</small><div class="t-notizia">…</div></button>
    </div>
    ${(() => { const ps = pagine(); return `<div class="t-app-pagine">
      <div class="t-pagine">${ps.map((p, n) => `<div class="t-pagina" role="group" aria-label="app, pagina ${n + 1} di ${ps.length}">${p.map(piastrella).join('')}</div>`).join('')}</div>
      <div class="t-puntini">${ps.length > 1 ? ps.map((_, n) => `<button class="t-punto" type="button" data-pagina="${n}" aria-label="pagina ${n + 1}"></button>`).join('') : ''}</div>
    </div>` })()}`
  // si ridisegna solo se è cambiato qualcosa: rifare la home uguale ricrea le icone, che possono lampeggiare un fotogramma
  if (html === ultimaHome && homeEl.childElementCount) { segnaLumaca(); return aggiornaBadge() }
  ultimaHome = html
  homeEl.innerHTML = html
  vaiPagina(pagina, { liscio: false })
  aggiornaBadge()
  segnaLumaca() // subito, senza aspettare le notizie dalla rete
  caricaNotizia()
}
let ultimaHome = ''
async function aggiornaBadge() {
  const conti = await contaBadge()
  let tot = 0
  for (const [id, n] of conti) {
    tot += n
    for (const el of homeEl.querySelectorAll(`[data-app="${id}"] .t-badge`)) { el.hidden = !n; el.textContent = n > 9 ? '9+' : n }
  }
  // i puntini delle pagine con un pallino sono cerchiati di rosso: si sa dove andare senza sfogliarle tutte
  homeEl.querySelectorAll('.t-pagina').forEach((p, i) => {
    const c = [...p.querySelectorAll('[data-app]')].some((b) => conti.get(b.dataset.app))
    homeEl.querySelector(`.t-punto[data-pagina="${i}"]`)?.classList.toggle('avviso', c)
  })
  ledEl?.classList.toggle('on', tot > 0)
}
let notiziaHtml = null // l'ultima notizia della banca: torna quando la lumachina non ha più niente da dire
async function caricaNotizia() {
  const db = await import('../chat/db.js')
  const d = await db.notizie()
  const n = d.ok && d.notizie[0]
  notiziaHtml = n ? (({ icona: i, html }) => `${icona(i)}<span>${html}</span>`)(db.testoNotizia(n)) : `${icona('bot')}<span>in banca è tutto tranquillo. Per ora.</span>`
  segnaLumaca()
}
/** Il riquadro «dalla banca»: se la lumachina ha combinato qualcosa che non hai ancora visto (chat/lumaca-avvisi.js), diventa
 *  un avviso urgente e porta alla scheda «io» dei Giocatori; se no è l'ultima notizia della banca. */
async function segnaLumaca() {
  const w = homeEl.querySelector('.t-w-notizie'), el = w?.querySelector('.t-notizia')
  if (!el) return
  const nuove = (await import('../chat/lumaca-avvisi.js')).daVedere()
  if (!homeEl.contains(el)) return
  w.classList.toggle('urgente', nuove.length > 0)
  w.dataset.tab = nuove.length ? 'io' : 'notizie'
  w.querySelector('small').textContent = nuove.length ? 'urgente · la tua lumachina' : 'dalla banca'
  if (!nuove.length) { el.innerHTML = notiziaHtml ?? '…'; return }
  const tot = nuove.reduce((a, v) => a + v.n, 0)
  el.innerHTML = `${icona(tot < 0 ? 'bot-triste' : 'bot-ride')}<span>${nuove.length === 1 ? 'ha combinato qualcosa' : `ha combinato qualcosa per ${nuove.length} giorni`} mentre non c’eri: <b class="${tot < 0 ? 'meno' : 'piu'}">${tot < 0 ? '−' : '+'}${pzk.fmt(Math.abs(tot))} $pzk</b></span>`
}

// ── la transizione: il cercapersone piccolo si ingrandisce e diventa quello grande ──
// Un doppione del tasto (la foto del cercapersone piccolo, con la chiocciolina viva sul suo lcd) parte dal tasto e si allarga
// fino al posto del cercapersone grande. Lì sotto c'è già il cercapersone vero con la porta accesa: lo stesso lcd verde con la
// stessa chiocciolina a tutto schermo; appare DI COLPO e il doppione sparisce, e non si vede niente perché sono identici.
// Alla chiusura il contrario: lo schermo mostra di nuovo la porta (il tomodachi che saluta) e il doppione si rimpicciolisce.
// Il doppione sta DENTRO il dialog (che è nel top layer), con position:fixed.
let origine = null // il tasto da cui si è aperto
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
/** Un'attesa che un secondo «chiudi» può accorciare. */
const aspetta = (ms) => new Promise((ok) => { const t = setTimeout(ok, ms); sveglia = () => { clearTimeout(t); ok() } })
const visibile = (r) => r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
const rett = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
/** Una copia viva del canvas della chiocciolina (si ridisegna mentre l'animazione va). */
function copiaLcd() {
  const src = origine?.querySelector('.ct-lcd canvas') ?? document.querySelector('.chat-tasto .ct-lcd canvas'), cv = document.createElement('canvas')
  cv.width = src?.width || 64; cv.height = src?.height || 32
  const copia = () => { if (!src) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0) }
  copia()
  cv.vivo = setInterval(copia, 120)
  return cv
}
/** Le crepe nel doppione che vola: piccolo ha quelle del tasto (crepe-piccola.webp, ridotta col massimo), grande quelle
 *  dello schermo (crepe.webp), che a 74 px sparirebbero. Il doppione cambia misura a ogni fotogramma: a ogni misura si vede
 *  la versione giusta (fino a 120 px la piccola, da 400 la grande, in mezzo tutte e due in proporzione), così all'inizio e
 *  alla fine dello zoom le crepe sono quelle del tasto e dello schermo, senza salti. */
function crepeNelDoppione(lcd) {
  lcd.insertAdjacentHTML('beforeend', `<img class="t-crepe piccola" src="${CREPE_PICCOLA}" alt=""><img class="t-crepe" src="${CREPE}" alt="">`)
  const ro = new ResizeObserver(([e]) => {
    if (!lcd.isConnected) return ro.disconnect()
    lcd.style.setProperty('--crepe-grande', Math.min(1, Math.max(0, (e.contentRect.width - 120) / 280)).toFixed(3))
  })
  ro.observe(lcd)
}
/** Il doppione del cercapersone piccolo: la foto e, nel suo lcd, la chiocciolina. */
function doppione() {
  const d = document.createElement('div')
  d.className = 't-doppio'
  d.setAttribute('aria-hidden', 'true')
  const [l, t, w, h] = PAGER.lcd
  const src = precarica.complete ? PAGER.src : origine?.querySelector('img')?.src ?? PAGER.src // se la grande non è ancora arrivata, la piccola (è la stessa)
  d.innerHTML = `<img src="${src}" alt=""><div class="t-doppio-lcd" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></div>`
  const cv = copiaLcd()
  d.querySelector('.t-doppio-lcd').appendChild(cv)
  if (zaino.pagerRotto()) crepeNelDoppione(d.querySelector('.t-doppio-lcd')) // scassato: le stesse crepe del tasto e dello schermo grande, prima del vetro
  tubo(d.querySelector('.t-doppio-lcd'), { insieme: true }) // lo stesso tubo del tasto e dello schermo grande
  d.vivo = cv.vivo
  return d
}
/** Il rettangolo del cercapersone grande (sul cellulare: il cercapersone che entra nella larghezza della finestra). */
function doveGrande() {
  if (!PIENO.matches) return corpo.getBoundingClientRect()
  const w = innerWidth * 0.94, h = w * (PAGER.h / PAGER.w)
  return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h }
}
/** Si apre: il doppione vola dal tasto al posto del cercapersone grande (420 ms; il suo lcd si spegne arrivando), e lo
 *  schermo grande si accende. `prepara()` mette pzk os sotto lo schermo spento: parte appena il cercapersone vero è al suo
 *  posto (invisibile ma misurabile, le app si montano con le loro misure) e lavora mentre il doppione vola. */
async function ingrandisci(prepara) {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) { // niente volo: si apre e si accende
    dlg.showModal(); corpo.focus({ preventScroll: true }); allinea(schermo); adatta(); inserisciCavo()
    const acceso = accendiSchermo()
    await prepara()
    return acceso
  }
  // «fermo»: l'animazione d'apertura normale del dialog resta spenta finché è aperto (se no, tolto «zoom», ripartirebbe e il
  // cercapersone farebbe un saltello un secondo dopo essersi aperto)
  dlg.classList.add('fermo', 'zoom', 'zoom-nascosto')
  dlg.showModal(); corpo.focus({ preventScroll: true })
  allinea(schermo)
  adatta()
  const pronto = prepara()
  const r1 = doveGrande()
  const d = doppione()
  Object.assign(d.style, rett(r0))
  dlg.appendChild(d)
  allinea(d)
  origine.style.visibility = 'hidden' // il tasto «parte»: non resta lì mentre il suo doppione vola
  requestAnimationFrame(() => dlg.classList.add('zoom-sfondo'))
  const tempi = { duration: 420, easing: 'cubic-bezier(.6,0,.25,1)', fill: 'forwards' }
  d.querySelector('.t-doppio-lcd').animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1)', offset: 0.5 }, { filter: 'brightness(0)' }], tempi) // l'lcd piccolo si spegne
  await d.animate([{ ...rett(r0), transform: 'rotate(0deg)' }, { offset: 0.55, transform: 'rotate(-2deg)' }, { ...rett(r1), transform: 'rotate(0deg)' }], tempi).finished
  // arrivato: il cercapersone vero compare di colpo sotto il doppione, con lo schermo che si accende (il primo fotogramma è
  // già il punto bianco sul nero: il contenuto non si vede prima del tempo), e il doppione sparisce. Sul cellulare lo schermo
  // vero è a tutta finestra, diverso dal doppione: lì il doppione sfuma.
  inserisciCavo()
  const acceso = accendiSchermo()
  dlg.classList.remove('zoom-nascosto')
  if (PIENO.matches) { d.classList.add('via'); await dorm(320) }
  clearInterval(d.vivo); d.remove()
  dlg.classList.remove('zoom', 'zoom-sfondo')
  await Promise.all([acceso, pronto])
}
async function rimpicciolisci() {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) return false
  const r1 = doveGrande()
  // lo schermo mostra già la porta (l'lcd verde con la chiocciolina): sopra il cercapersone vero compare il doppione,
  // identico, e il vero sparisce DI COLPO; il doppione si rimpicciolisce fino al tasto, dove torna il tasto vero (la stessa
  // foto, piccola). Sul cellulare il doppione (che lì è diverso dallo schermo a tutta finestra) prima sfuma dentro.
  const d = doppione()
  Object.assign(d.style, rett(r1))
  dlg.appendChild(d)
  allinea(d)
  dlg.classList.add('zoom', 'zoom-sfondo')
  if (PIENO.matches) await d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'forwards' }).finished
  dlg.classList.add('zoom-nascosto')
  dlg.classList.remove('zoom-sfondo')
  await d.animate([{ ...rett(r1) }, { ...rett(r0) }], { duration: 480, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished
  clearInterval(d.vivo)
  origine.style.visibility = ''
  dlg.close()
  d.remove()
  dlg.classList.remove('zoom', 'zoom-nascosto')
  return true
}

// ── il cavo usb-c che s'inserisce (Alberto, 23.10 sera: «quando apro il cercapersone ed è in carica voglio che il cavo si
// inserisca e che faccia lo scatto che entra tutto, tipo si inclina per entrare meglio» — l'unica animazione permessa) ──
// Il gruppo spina + filo sale da sotto il bordo della finestra (non compare dal nulla), arriva alla porta inclinato, la punta
// tocca e la spina si raddrizza cercando il buco (un po' a destra, un po' a sinistra), spinge con fatica, poi SCATTA dentro
// di colpo, va un filo oltre (lo scatto) e si assesta. Si gira attorno alla cima della punta (transform-origin in
// telefono.css); la scatola taglia quello che è già dentro la porta.
function inserisciCavo() {
  if (!dlg.classList.contains('carica') || PIENO.matches || RIDOTTO.matches) return
  const scatola = dlg.querySelector('.t-cavo-scatola'), gruppo = scatola?.querySelector('.t-cavo-gruppo')
  if (!gruppo) return
  for (const a of gruppo.getAnimations()) a.cancel()
  const k = (corpo.clientWidth * 0.0387) / 39.5 // un pixel della spina (come --k)
  const punta = 62 * k // la punta d'argento: quanto deve entrare
  // tutto sotto il bordo della finestra, anche la cima della punta (che sta `punta` sopra il corpo) e lo spigolo che
  // l'inclinazione di 9° alza (mezza spina × sen 9° ≈ 10 k)
  const giu = Math.max(0, innerHeight - scatola.getBoundingClientRect().top) + punta + 10 * k + 20
  const p = (y, r) => `translateY(${y.toFixed(1)}px) rotate(${r}deg)`
  gruppo.animate([
    { transform: p(giu, 9), easing: 'cubic-bezier(.15,.7,.3,1)' }, // sale, inclinato
    { transform: p(punta * 1.2, 4), offset: 0.46, easing: 'ease-in-out' }, // la punta arriva sotto la porta
    { transform: p(punta * 0.92, -2.5), offset: 0.6, easing: 'ease-in-out' }, // tocca, si piega dall'altra parte
    { transform: p(punta * 0.8, 1.2), offset: 0.7, easing: 'ease-in-out' }, // e ritorna: cerca il buco
    { transform: p(punta * 0.64, 0), offset: 0.8, easing: 'cubic-bezier(.8,0,1,.5)' }, // dritto, spinge con fatica
    { transform: p(-2.5 * k, 0), offset: 0.88, easing: 'cubic-bezier(.2,.8,.3,1)' }, // SCATTO: dentro tutto, un filo oltre
    { transform: p(0, 0) }, // si assesta
  ], { duration: 1300 })
}

// ── la porta: il tomodachi a tutto schermo, che alla chiusura saluta ──
let lcdVivo = null // la copia viva della chiocciolina sulla porta
function mostraPorta() {
  porta.hidden = false
  if (!lcdVivo) { lcdVivo = copiaLcd(); porta.querySelector('.t-porta-lcd').replaceChildren(lcdVivo) }
}
function nascondiPorta() {
  porta.hidden = true
  clearInterval(lcdVivo?.vivo); lcdVivo = null
  porta.querySelector('.t-porta-lcd').replaceChildren()
}

// ── l'accensione (29.10): come un vecchio televisore, un punto bianco che si allunga in una riga, la riga che si apre in tutto
// lo schermo e la luce in più che si spegne, in 400 ms. Il primo fotogramma (il punto sul nero) c'è subito: chi la chiama
// prima di mostrare lo schermo non vede mai pzk os prima del tempo. Lo spegnimento, qui sotto, è la stessa cosa al contrario ──
function accendiSchermo() {
  for (const a of schermo.getAnimations()) a.cancel()
  schermo.querySelector('.t-bianco')?.remove()
  musichetta('accendi')
  led.colpo(400)
  if (RIDOTTO.matches) return Promise.resolve()
  const bianco = document.createElement('i')
  bianco.className = 't-bianco'
  schermo.appendChild(bianco)
  const tempi = { duration: 400 }
  bianco.animate([{ opacity: 1 }, { opacity: 1, offset: 0.3 }, { opacity: 0.4, offset: 0.62 }, { opacity: 0 }], tempi)
  return schermo.animate([
    { transform: 'scale(.03,.012)', filter: 'brightness(2.4)', easing: 'cubic-bezier(.3,.6,.4,1)' },
    { transform: 'scale(1,.012)', filter: 'brightness(2.4)', offset: 0.3, easing: 'cubic-bezier(.5,0,.2,1)' },
    { transform: 'scale(1,1)', filter: 'brightness(1.5)', offset: 0.62 },
    { transform: 'scale(1,1)', filter: 'brightness(1)' },
  ], tempi).finished.catch(() => {}).finally(() => bianco.remove())
}

// ── lo spegnimento: come un vecchio tubo catodico, l'immagine si schiaccia in una riga bianca, poi in un punto, e sparisce ──
async function spegni() {
  for (const a of schermo.getAnimations()) a.cancel() // (chiuso mentre si accendeva)
  schermo.querySelector('.t-bianco')?.remove()
  musichetta('spegni')
  if (RIDOTTO.matches) return
  const bianco = document.createElement('i')
  bianco.className = 't-bianco'
  schermo.appendChild(bianco)
  // tre tempi, ognuno col suo passo: si schiaccia in fretta (180 ms), la riga si accorcia piano (260 ms), il punto resta un
  // attimo e si spegne
  const tempi = { duration: 620, fill: 'forwards' }
  bianco.animate([{ opacity: 0, easing: 'ease-in' }, { opacity: 0.95, offset: 0.3 }, { opacity: 1 }], tempi)
  await schermo.animate([
    { transform: 'scale(1,1)', filter: 'brightness(1)', easing: 'cubic-bezier(.6,0,.9,.4)' },
    { transform: 'scale(1,.012)', filter: 'brightness(2)', offset: 0.3, easing: 'cubic-bezier(.3,0,.7,1)' },
    { transform: 'scale(.012,.012)', filter: 'brightness(2.4)', offset: 0.72 },
    { transform: 'scale(.012,.012)', filter: 'brightness(2.4)', opacity: 1, offset: 0.84 },
    { transform: 'scale(0,0)', filter: 'brightness(2.4)', opacity: 0 },
  ], tempi).finished
  bianco.remove()
  await dorm(180) // un attimo di nero
}
/** Lo schermo si riaccende (il tomodachi ricompare): a scatti, come un lcd. */
async function riaccendi() {
  for (const a of schermo.getAnimations()) a.cancel()
  if (RIDOTTO.matches) return
  await schermo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'steps(3)' }).finished
}

// ── apri, chiudi, vai ──
export async function apri(app = null, opz = {}) {
  await caricaStile()
  costruisci()
  if (chiudendo) return // sta salutando: prima finisce di chiudersi
  if (dlg.open) { if (app) await vai(app, opz); else home(); return }
  if (opz.da) origine = opz.da
  const mio = ++giro
  dentro = true
  dlg.classList.remove('chiude')
  aggiornaStato()
  misuraPing()
  // sotto lo schermo spento, pzk os: l'app chiesta da chi apre vince; se nessuno ne chiede una, quella che era aperta l'ultima
  // volta (Alberto, 23.10: «memorizza sempre le azioni»; da scassato solo la chat), se no la home. Senza sigla: suona
  // l'accensione
  const ultima = ricordo('cercapersone', { app: null }).app
  const a = app ?? (ultima && APP.some((x) => x.id === ultima) && (!zaino.pagerRotto() || ultima === 'chat') ? ultima : null)
  await ingrandisci(async () => { if (a) await vai(a, { ...opz, muto: true }); else home({ subito: true, muto: true }) })
  if (mio !== giro) return // chiuso mentre si accendeva
  if (!corrente) vaiPagina(pagina, { liscio: false })
  clearInterval(orologio); clearInterval(timerPing)
  orologio = setInterval(() => { if (dlg.open) { aggiornaStato(); if (!corrente) { const o = homeEl.querySelector('.t-w-ora b'); if (o) o.textContent = ora() } } }, 15_000)
  timerPing = setInterval(() => { if (dlg.open && !document.hidden) misuraPing() }, 30_000)
}
/** Il tasto rosso: spegne lo schermo, il tomodachi ricompare e saluta, e il cercapersone si chiude da solo. */
export async function chiudi() {
  if (!dlg?.open) return
  if (chiudendo) { sveglia?.(); return chiudendo } // un secondo «chiudi» mentre saluta: si chiude subito
  if (dlg.classList.contains('zoom')) return
  chiudendo = (async () => {
    giro++
    clearInterval(orologio); clearInterval(timerPing)
    if (dentro) { led.colpo(400); await spegni(); mostraPorta(); await riaccendi() }
    else mostraPorta()
    dentro = false
    daFare = null
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
    }
    dlg.classList.remove('fermo')
    for (const a of schermo.getAnimations()) a.cancel()
    nascondiPorta()
    home()
  })()
  try { await chiudendo } finally { chiudendo = null }
}
/** La home. subito: senza l'animazione di ritorno (il tasto indietro: premuto a raffica, ogni volta ripartirebbe); muto:
 *  senza sigla (accendendo). */
export function home({ subito = false, muto = false } = {}) {
  if (!dlg) return
  if (dentro && !pzk.conto()) { vai('account', { scheda: 'conto', muto }); return } // (senza conto non c'è una home: vedi daFare)
  const prima = corrente
  corrente = null
  if (prima && dentro) musichetta('home')
  if (dentro) ricorda('cercapersone', { app: null }) // (da chiuso no: la chiusura riporta alla home, e riaprendo si torna all'ultima app)
  storia.length = 0
  for (const { host, ist } of montate.values()) { if (!host.hidden) ist?.nascondi?.(); host.hidden = true; host.classList.remove('entra') }
  homeEl.hidden = false
  schermo.dataset.in = 'home'
  disegnaHome()
  homeEl.classList.remove('torna')
  if (prima && !subito && !RIDOTTO.matches) { void homeEl.offsetWidth; homeEl.classList.add('torna') }
}
/** Il tasto verde: una mossa indietro. Prima chiede all'app (la sua freccia: se ha una pagina interna aperta la chiude lei),
 *  poi torna all'app di prima, poi alla home; nella home (o sulla porta) non fa niente. daFreccia: il clic viene già dalla
 *  freccia dell'app e l'app non l'ha voluto. */
export function indietro({ daFreccia = false } = {}) {
  if (!dentro || !corrente || chiudendo) return
  led.colpo(60)
  if (!daFreccia) {
    const freccia = montate.get(corrente)?.host.querySelector('.t-indietro')
    if (freccia) { freccia.click(); return } // ripassa di qui con daFreccia se l'app non lo ferma
  }
  // la mossa indietro è secca, senza animazioni: a raffica non deve tremare niente
  const prima = storia.pop()
  if (prima) vai(prima, { daIndietro: true })
  else home({ subito: true })
}
export async function vai(id, opz = {}) {
  let rimandata = false
  if (dentro && !pzk.conto() && id !== 'account') { daFare = { id, opz }; id = 'account'; opz = { scheda: 'conto' }; rimandata = true }
  const a = APP.find((x) => x.id === id)
  if (!a) return
  // scassato (dopo una morte) si apre solo la chat: lì si lavora e si ricompra il cercapersone nuovo
  if (zaino.pagerRotto() && id !== 'chat') { toast('è <b>scassato</b>: funziona solo la chat, per <b>lavorare</b> e <b>comprare il nuovo</b>', { icona: 'pager' }); return }
  if (a.azione) { a.azione(); return }
  led.colpo(140)
  if (corrente && corrente !== id && !opz.daIndietro) storia.push(corrente)
  if (corrente !== id && !opz.daIndietro && !opz.muto && dentro) musichetta(id) // la sigla dell'app (tornando indietro no: solo il bip; accendendo suona l'accensione)
  let m = montate.get(id)
  if (!m) {
    const host = document.createElement('section')
    host.className = 't-app'
    host.dataset.app = id
    host.innerHTML = '<div class="t-carico"><i></i></div>'
    host.hidden = true
    vista.appendChild(host)
    m = { host, ist: null }
    montate.set(id, m)
    try {
      const mod = await led.mentre(a.carica())
      host.innerHTML = ''
      m.ist = (await mod.monta(host, ctxApp(id))) ?? {}
    } catch (e) {
      console.error('app non caricata', id, e)
      host.innerHTML = `<div class="t-errore">${icona('bot-triste')}<p>l’app «${esc(a.nome)}» non si apre.</p><button class="c-b" type="button" data-t="home">torna alla home</button></div>`
      montate.delete(id)
    }
  }
  for (const [k, x] of montate) if (k !== id && !x.host.hidden) { x.ist?.nascondi?.(); x.host.hidden = true }
  homeEl.hidden = true
  corrente = id
  if (!rimandata) ricorda('cercapersone', { app: id }) // riaprendo il cercapersone si torna qui
  schermo.dataset.in = id
  m.host.hidden = false
  m.host.classList.remove('entra')
  if (!RIDOTTO.matches && !opz.daIndietro) { void m.host.offsetWidth; m.host.classList.add('entra') }
  m.ist?.mostra?.(opz)
}

// ── quello che si dà alle app ──
function ctxApp(id) {
  return {
    id, home, vai, esc, icona,
    /** Il conto c'è (l'app Account l'ha appena creato o aperto): si va dove si voleva andare, o alla home. */
    dopoAccesso: () => { const d = daFare; daFare = null; if (d) vai(d.id, d.opz); else home() },
    /** La testata di un'app: freccia indietro (come il tasto verde), titolo, e (se serve) altro html a destra. */
    testata: (titolo, destra = '') => `<header class="t-testata"><button class="t-indietro" type="button" data-t="indietro" aria-label="indietro">‹</button><h2>${titolo}</h2><div class="t-az">${destra}</div></header>`,
    toast,
  }
}
/** Una notifica che scende dall'alto dello schermo: toast('<b>+150 $pzk</b>', { icona: 'regalo' }). */
let timerToast = 0
export function toast(html, { icona: nome = 'bot', ms = 3200 } = {}) {
  if (!tostoEl) return
  tostoEl.innerHTML = `<div class="t-t">${icona(nome)}<span>${html}</span></div>`
  tostoEl.classList.add('su')
  clearTimeout(timerToast)
  timerToast = setTimeout(() => tostoEl.classList.remove('su'), ms)
}
export const aperto = () => !!dlg?.open
