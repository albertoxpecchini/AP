// Il cercapersone grande (23.10): si apre dal cercapersone piccolo sotto il wallet (chat/chat.js → apri), che si ingrandisce e
// diventa lo stesso cercapersone, disegnato in alta qualità (art/chat-pager-grande/pager-grande.webp, gpt-image-2, fogli-chat.js),
// orizzontale come quello piccolo. Nello schermo vive «pzk os»: la barra di stato (la rete pzkkonet, l'ora, la batteria
// che si scarica dalle 7 alle 19 come quella del wallet), la home con i widget (il saldo, le sfide, le notizie dei giocatori) e
// le app: Chat (il bot), Shop, Sfide, Quiz, Quest, Giocatori, Zaino, Foto e Banca (il wallet).
//
// Come lo vuole Alberto (23.10 sera):
// - LA PORTA: quando si apre, sullo schermo resta il tomodachi (la chiocciolina dell'lcd piccolo, a tutto schermo) e compare
//   il tasto ACCEDI; si preme, parte il caricamento con le baggianate e la barra, e poi si è dentro (nella home, o nell'app
//   chiesta da chi l'ha aperto).
// - IL TASTO DI SOPRA È ROSSO E SI CHIAMA CHIUDI: lo schermo si spegne come un vecchio tubo catodico (si schiaccia in una riga
//   bianca, poi in un punto), ricompare il tomodachi che saluta e dopo un paio di secondi il cercapersone si chiude da solo,
//   rimpicciolendosi nel tasto. Toccare fuori o Esc nella home fanno lo stesso; un secondo «chiudi» mentre saluta chiude subito.
// - IL TASTO DI SOTTO È VERDE E RESTA INDIETRO: torna indietro di una mossa (la pagina interna dell'app, poi l'app di prima,
//   poi la home) e si può premere a raffica; nella home non fa niente, perché si è già usciti da tutto.
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
import { tubo, allinea } from '../games/crt.js'

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
  { id: 'negozio', nome: 'shop', icona: 'app-shop', carica: () => import('./app/negozio.js') },
  { id: 'sfide', nome: 'sfide', icona: 'app-sfide', carica: () => import('./app/sfide.js'), badge: () => import('../chat/sfide.js').then((m) => m.daRiscuotere()) },
  { id: 'quiz', nome: 'quiz', icona: 'app-quiz', carica: () => import('./app/quiz.js') },
  { id: 'missioni', nome: 'quest', icona: 'app-quest', carica: () => import('./app/missioni.js'), badge: () => import('../chat/missioni.js').then((m) => m.pronte()) },
  { id: 'giocatori', nome: 'giocatori', icona: 'app-giocatori', carica: () => import('./app/giocatori.js'), badge: () => import('../chat/lumaca-avvisi.js').then((m) => m.daVedere().length) }, // la lumachina ha combinato qualcosa
  { id: 'zaino', nome: 'zaino', icona: 'app-zaino', carica: () => import('./app/zaino.js') },
  { id: 'foto', nome: 'foto', icona: 'app-foto', carica: () => import('./app/foto.js') },
  { id: 'banca', nome: 'banca', icona: 'app-banca', azione: () => pzk.apriWallet() },
]

// le baggianate del caricamento: ne escono quattro a caso ogni volta, scritte come il registro di un vecchio computer
const BAGGIANATE = [
  'scaldo i fosfori verdi', 'sveglio i criceti nella ruota del server', 'conto i $pzk a mano, uno per uno',
  'convinco la chiocciola a spostarsi', 'lucido i pixel uno a uno', 'cerco pzkkonet sotto il divano',
  'carico la mortadella in memoria', 'stiro le righe del tubo catodico', 'soffio nella cartuccia', 'scongelo il cornetto di emergenza',
  'aspetto che il modem finisca di cantare', 'rimetto in fila i bit scappati', 'nascondo gli euroshit sotto il materasso',
  'do da mangiare al tomodachi', 'litigo con la stampante (ha vinto lei)', 'meteo di mantova: nebbia, come sempre',
  'metto i $pzk in borsa e prego', 'allineo i pixel (alberto controlla)', 'accordo il cicalino in la', 'scarico internet: 3 %… 7 %…',
  'riavvolgo la cassetta con la bic', 'tolgo la polvere dal tubo', 'cerco il senso della vita: errore 404', 'faccio finta di caricare qualcosa',
  'chiedo la password ai pesci rossi', 'inserisco il gettone', 'stampo lo scontrino di prova', 'pago la bolletta del led rosso',
  'dico ai giocatori di fare silenzio', 'lancio il dado: 7. ricomincio', 'do una botta al cercapersone (funziona sempre)',
  'gonfio le gomme alla chiocciola', 'compilo i sogni del bot', 'sposto la virgola dei $pzk (scherzo)',
]

let dlg = null, corpo = null, schermo = null, palco = null, vista = null, homeEl = null, tostoEl = null, statoEl = null, ledEl = null, porta = null
let corrente = null // l'id dell'app in primo piano (null: la home)
const storia = [] // le app aperte prima, per il tasto «indietro»
const montate = new Map() // id → { host, ist }
let cssPronto = null
let orologio = 0
let dentro = false // passata la porta: si è premuto ACCEDI e il caricamento è finito
let attesa = null // l'app chiesta da chi ha aperto il cercapersone, che si apre dopo la porta: { app, opz }
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

// ── la batteria, come quella del wallet: 100 % alle 7, 2 % alle 19, poi in carica fino alle 7 (col cavo usb-c sotto) ──
// L'ora è quella del gioco (window.pzkkoOrologio.perGioco, come nel wallet): quella vera anche quando la pagina sta
// ferma a mezzogiorno per la luce; se la regia sposta l'orologio per provare, tutti e due si caricano insieme.
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
          <span class="t-rete"><i></i><i></i><i></i><i></i><b>pzkkonet</b></span>
          <span class="t-ora"></span>
          <span class="t-batt"><i></i><i></i><i></i><i></i><i></i><b></b></span>
        </div>
        <div class="t-vista"><div class="t-home"></div></div>
        <div class="t-toast" role="status" aria-live="polite"></div>
        <nav class="t-nav" aria-label="i tasti"><button type="button" data-t="indietro">indietro</button><button type="button" data-t="chiudi">chiudi</button></nav>
      </div>
      <div class="t-porta" data-fase="attesa" hidden>
        <div class="t-porta-lcd"></div>
        <button class="t-accedi" type="button">accedi</button>
        <div class="t-porta-txt" aria-live="polite"><b>pzk os</b><ol class="t-frasi"></ol><i class="t-barra"><em></em></i></div>
      </div>
    </div>
    <i class="t-led" aria-hidden="true"></i>
    <button class="t-tasto su" type="button" data-t="chiudi" aria-label="tasto rosso: chiudi"></button>
    <button class="t-tasto giu" type="button" data-t="indietro" aria-label="tasto verde: indietro"></button>
  </div>`
  document.body.appendChild(dlg)
  corpo = dlg.querySelector('.t-corpo')
  schermo = dlg.querySelector('.t-schermo')
  palco = dlg.querySelector('.t-palco')
  vista = dlg.querySelector('.t-vista')
  homeEl = dlg.querySelector('.t-home')
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
  porta.querySelector('.t-accedi').addEventListener('click', accedi)
  homeEl.addEventListener('click', (e) => { const b = e.target.closest('[data-app]'); if (b) vai(b.dataset.app, { tab: b.dataset.tab }) })
  zaino.ascolta(() => { if (dlg.open) { aggiornaStato(); aggiornaLed(); if (!corrente) disegnaHome() } }) // lo stato: anche scassato o no
  pzk.osserva(() => { if (!corrente && dlg.open) disegnaHome() })
  new ResizeObserver(adatta).observe(dlg)
  PIENO.addEventListener('change', adatta)
}

function aggiornaStato() {
  const b = batteria()
  statoEl.querySelector('.t-ora').textContent = ora()
  const bt = statoEl.querySelector('.t-batt')
  bt.classList.toggle('carica', b.carica); bt.classList.toggle('bassa', b.pct <= 15 && !b.carica)
  dlg.classList.toggle('carica', b.carica) // il cavo usb-c sotto il cercapersone, come quello del wallet
  dlg.classList.toggle('scassato', zaino.pagerRotto()) // dopo una morte: le crepe, e le app spente tranne la chat
  bt.querySelectorAll('i').forEach((s, i) => s.classList.toggle('on', b.pct > i * 20))
  bt.querySelector('b').textContent = `${b.pct}%`
}
/** Il led rosso del cercapersone: lampeggia quando qualche app ha qualcosa da fare. */
async function aggiornaLed() {
  let n = 0
  for (const a of APP) if (a.badge) n += (await a.badge()) || 0
  ledEl?.classList.toggle('on', n > 0)
}

// ── il palco: lo schermo vero si misura, e il palco (largo 760 punti) ci si adatta, così tutto cresce col cercapersone ──
const BASE = 760
function adatta() {
  if (!dlg || !schermo) return
  dlg.classList.toggle('pieno', PIENO.matches)
  if (PIENO.matches) { palco.style.transform = ''; palco.style.width = ''; palco.style.height = ''; return }
  const k = schermo.clientWidth / BASE
  if (!k) return
  palco.style.width = `${BASE}px`
  palco.style.height = `${schermo.clientHeight / k}px`
  palco.style.transform = `scale(${k})`
}

// ── la home: a sinistra l'ora e i widget, a destra le app ──
const piastrella = (a, i) => `<button class="t-ico" type="button" data-app="${a.id}" style="--r:${[-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5, -1][i % 9]}deg"><span class="t-ico-q">${icona(a.icona)}<i class="t-badge" hidden></i></span><span class="t-ico-n">${a.nome}</span></button>`
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
        <button class="t-w t-w-saldo" type="button" data-app="banca"><small>saldo</small><b class="pzk">${pzk.fmt(pzk.saldo())} $pzk</b>${e >= 0.01 ? `<span class="eur">EUR€ ${pzk.fmtEur(e)}</span>` : ''}<div class="t-xp"><i style="width:${pct}%"></i></div><small>livello ${liv} · ${xp - da}/${a - da} xp</small></button>
        <button class="t-w t-w-sfide" type="button" data-app="sfide"><small>sfide di oggi</small><b>${o.sfide.filter((x) => x.riscossa).length}/3</b><div class="t-pips">${o.sfide.map((x) => `<i class="${x.riscossa ? 'fatta' : x.pronta ? 'pronta' : ''}"></i>`).join('')}</div><small>${o.sfide.some((x) => x.pronta) ? 'da riscuotere!' : o.tutte ? 'tutte fatte' : 'da fare'}</small></button>
      </div>
      <button class="t-w t-w-notizie" type="button" data-app="giocatori" data-tab="notizie"><small>dalla banca</small><div class="t-notizia">…</div></button>
    </div>
    <div class="t-griglia">${APP.map(piastrella).join('')}</div>`
  // si ridisegna solo se è cambiato qualcosa: rifare la home uguale ricrea le icone, che possono lampeggiare un fotogramma
  if (html === ultimaHome && homeEl.childElementCount) { segnaLumaca(); return aggiornaBadge() }
  ultimaHome = html
  homeEl.innerHTML = html
  aggiornaBadge()
  segnaLumaca() // subito, senza aspettare le notizie dalla rete
  caricaNotizia()
}
let ultimaHome = ''
async function aggiornaBadge() {
  let tot = 0
  for (const a of APP) {
    if (!a.badge) continue
    const n = (await a.badge()) || 0
    tot += n
    for (const el of homeEl.querySelectorAll(`[data-app="${a.id}"] .t-badge`)) { el.hidden = !n; el.textContent = n > 9 ? '9+' : n }
  }
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
async function ingrandisci() {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) { dlg.showModal(); corpo.focus({ preventScroll: true }); adatta(); return false } // niente transizione: si apre e basta
  // «fermo»: l'animazione d'apertura normale del dialog resta spenta finché è aperto (se no, tolto «zoom», ripartirebbe e il
  // cercapersone farebbe un saltello un secondo dopo essersi aperto)
  dlg.classList.add('fermo', 'zoom', 'zoom-nascosto')
  dlg.showModal(); corpo.focus({ preventScroll: true })
  allinea(schermo)
  adatta()
  const r1 = doveGrande()
  const d = doppione()
  Object.assign(d.style, rett(r0))
  dlg.appendChild(d)
  allinea(d)
  origine.style.visibility = 'hidden' // il tasto «parte»: non resta lì mentre il suo doppione vola
  requestAnimationFrame(() => dlg.classList.add('zoom-sfondo'))
  await d.animate([{ ...rett(r0), transform: 'rotate(0deg)' }, { offset: 0.55, transform: 'rotate(-2deg)' }, { ...rett(r1), transform: 'rotate(0deg)' }], { duration: 620, easing: 'cubic-bezier(.6,0,.25,1)', fill: 'forwards' }).finished
  // arrivato: il cercapersone vero (con la porta: lcd e chiocciolina identici a quelli del doppione) compare di colpo sotto il
  // doppione, che sparisce. Sul cellulare lo schermo vero è a tutta finestra, diverso dal doppione: lì il doppione sfuma.
  inserisciCavo()
  dlg.classList.remove('zoom-nascosto')
  if (PIENO.matches) { d.classList.add('via'); await dorm(320) }
  clearInterval(d.vivo); d.remove()
  dlg.classList.remove('zoom', 'zoom-sfondo')
  return true
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

// ── la porta: il tomodachi a tutto schermo e il tasto ACCEDI; poi il caricamento con le baggianate ──
let lcdVivo = null // la copia viva della chiocciolina sulla porta
function mostraPorta(fase) {
  porta.dataset.fase = fase
  porta.classList.remove('via', 'pronta')
  porta.hidden = false
  if (!lcdVivo) { lcdVivo = copiaLcd(); porta.querySelector('.t-porta-lcd').replaceChildren(lcdVivo) }
}
function nascondiPorta() {
  porta.hidden = true
  porta.classList.remove('via', 'pronta')
  clearInterval(lcdVivo?.vivo); lcdVivo = null
  porta.querySelector('.t-porta-lcd').replaceChildren()
}
/** Il tasto ACCEDI compare (a scatti, come i segmenti di un lcd) e prende il fuoco: Invio lo preme. */
function portaPronta() {
  if (porta.hidden || porta.dataset.fase !== 'attesa') return
  porta.classList.add('pronta')
  porta.querySelector('.t-accedi').focus({ preventScroll: true })
}
const mescola = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
/** Scrive una riga del registro lettera per lettera, in `ms` millisecondi. */
async function scrivi(el, testo, ms) {
  if (RIDOTTO.matches) { el.textContent = testo; return }
  const passi = Math.min(testo.length, 14)
  for (let i = 1; i <= passi; i++) { el.textContent = testo.slice(0, Math.ceil((testo.length * i) / passi)); await dorm(ms / passi) }
}
/** Il caricamento: quattro baggianate a caso (ognuna finisce con «ok»), la barra che si riempie a scatti, poi «accesso
 *  consentito». Circa tre secondi: abbastanza per leggerle, non tanto da annoiare. */
async function carica(mio) {
  const lista = porta.querySelector('.t-frasi'), barra = porta.querySelector('.t-barra em')
  lista.replaceChildren()
  barra.style.width = '0%'
  await dorm(RIDOTTO.matches ? 0 : 420) // la chiocciolina si sposta a sinistra e compare la scritta
  const frasi = [...mescola(BAGGIANATE).slice(0, 4), 'accesso consentito']
  for (let i = 0; i < frasi.length; i++) {
    if (mio !== giro) return
    const li = document.createElement('li')
    if (i === frasi.length - 1) li.className = 'fine'
    lista.appendChild(li)
    while (lista.children.length > 3) lista.firstElementChild.remove()
    await scrivi(li, frasi[i], 240)
    barra.style.width = `${Math.round(((i + 1) / frasi.length) * 100)}%`
    await dorm(RIDOTTO.matches ? 300 : i === frasi.length - 1 ? 420 : 220 + Math.random() * 180)
    li.classList.add('ok')
  }
}
async function accedi() {
  if (dentro || chiudendo || porta.hidden || porta.dataset.fase !== 'attesa') return
  const mio = giro
  tomodachi.attendi?.(false)
  porta.dataset.fase = 'carica'
  led.inizia()
  try { await carica(mio) } finally { led.finisci() }
  if (mio !== giro || !dlg.open) return // chiuso durante il caricamento
  dentro = true
  const a = attesa
  attesa = null
  if (a?.app) await vai(a.app, a.opz)
  else home()
  porta.classList.add('via') // la porta sfuma e sotto c'è pzk os
  await dorm(RIDOTTO.matches ? 0 : 320)
  if (mio !== giro) return
  nascondiPorta()
  corpo.focus({ preventScroll: true })
}

// ── lo spegnimento: come un vecchio tubo catodico, l'immagine si schiaccia in una riga bianca, poi in un punto, e sparisce ──
async function spegni() {
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
  if (!dlg.open) {
    if (opz.da) origine = opz.da
    giro++
    dentro = false
    attesa = app ? { app, opz } : null
    dlg.classList.remove('chiude')
    aggiornaStato()
    home() // la home è pronta sotto la porta
    mostraPorta('attesa')
    tomodachi.attendi?.(true) // la chiocciolina si mette a sinistra e guarda il tasto ACCEDI
    if (opz.da) await ingrandisci()
    else { dlg.showModal(); corpo.focus({ preventScroll: true }); allinea(schermo); adatta(); inserisciCavo() }
    await dorm(RIDOTTO.matches ? 0 : 160)
    portaPronta()
    clearInterval(orologio)
    orologio = setInterval(() => { if (dlg.open) { aggiornaStato(); if (!corrente) { const o = homeEl.querySelector('.t-w-ora b'); if (o) o.textContent = ora() } } }, 20_000)
    return
  }
  if (!dentro) { if (app) attesa = { app, opz }; return } // ancora sulla porta: l'app si apre dopo ACCEDI
  if (app) await vai(app, opz)
  else home()
}
/** Il tasto rosso: spegne lo schermo, il tomodachi ricompare e saluta, e il cercapersone si chiude da solo. */
export async function chiudi() {
  if (!dlg?.open) return
  if (chiudendo) { sveglia?.(); return chiudendo } // un secondo «chiudi» mentre saluta: si chiude subito
  if (dlg.classList.contains('zoom')) return
  chiudendo = (async () => {
    giro++
    clearInterval(orologio)
    tomodachi.attendi?.(false)
    if (dentro) { led.colpo(400); await spegni(); mostraPorta('saluta'); await riaccendi() }
    else mostraPorta('saluta')
    dentro = false
    attesa = null
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
/** La home. subito: senza l'animazione di ritorno (il tasto indietro: premuto a raffica, ogni volta ripartirebbe). */
export function home({ subito = false } = {}) {
  if (!dlg) return
  const prima = corrente
  corrente = null
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
  const a = APP.find((x) => x.id === id)
  if (!a) return
  // scassato (dopo una morte) si apre solo la chat: lì si lavora e si ricompra il cercapersone nuovo
  if (zaino.pagerRotto() && id !== 'chat') { toast('è <b>scassato</b>: funziona solo la chat, per <b>lavorare</b> e <b>comprare il nuovo</b>', { icona: 'pager' }); return }
  if (a.azione) { a.azione(); return }
  led.colpo(140)
  if (corrente && corrente !== id && !opz.daIndietro) storia.push(corrente)
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
