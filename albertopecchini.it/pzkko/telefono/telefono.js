// Il cercapersone grande (23.10): si apre dal cercapersone piccolo sotto il wallet (chat/chat.js → apri), che si ingrandisce e
// diventa lo stesso cercapersone, disegnato in alta qualità (art/chat-pager-grande/pager-grande.webp, gpt-image-2, fogli-chat.js),
// orizzontale come quello piccolo. Nello schermo lcd vive «pzk os»: la barra di stato (la rete pzkkonet, l'ora, la batteria
// che si scarica dalle 7 alle 19 come quella del wallet), la home con i widget (il saldo, le sfide, le notizie dei giocatori) e
// le app: Chat (il bot), Shop, Sfide, Quiz, Quest, Giocatori, Zaino, Foto e Banca (il wallet). I due tasti grigi sono veri:
// quello di sopra torna alla home, quello di sotto torna indietro; il led rosso lampeggia quando c'è qualcosa da fare.
// Sul cellulare niente cornice: lo schermo prende tutta la finestra e i tasti diventano una barra in basso.
// Ogni app è un modulo di telefono/app/ che si carica la prima volta che la apri e poi resta montata (la chat non perde i
// messaggi quando torni alla home). (Il nome «telefono» è rimasto dalla prima versione, che era un telefono.)
//
//   apri(app?, opz?)   apre il cercapersone (sulla home o su un'app); opz.da: il tasto da cui si apre (si ingrandisce lui)
//   chiudi()           lo rimpicciolisce dentro il tasto
//   home()             torna alla home
//   vai(app, opz?)     cambia app
// Un'app esporta `monta(host, ctx)` e ritorna { mostra(opz), nascondi() } se le servono; dal ctx ha testata(titolo, destra),
// home, vai, toast(html, { icona }).

import * as pzk from '../games/pzk.js'
import * as zaino from '../chat/zaino.js'
import { icona } from '../chat/icone.js'
import * as led from '../chat/led.js'

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
  { id: 'giocatori', nome: 'giocatori', icona: 'app-giocatori', carica: () => import('./app/giocatori.js') },
  { id: 'zaino', nome: 'zaino', icona: 'app-zaino', carica: () => import('./app/zaino.js') },
  { id: 'foto', nome: 'foto', icona: 'app-foto', carica: () => import('./app/foto.js') },
  { id: 'banca', nome: 'banca', icona: 'app-banca', azione: () => pzk.apriWallet() },
]

let dlg = null, corpo = null, schermo = null, palco = null, vista = null, homeEl = null, tostoEl = null, statoEl = null, ledEl = null
let corrente = null // l'id dell'app in primo piano (null: la home)
const storia = [] // le app aperte prima, per il tasto «indietro»
const montate = new Map() // id → { host, ist }
let cssPronto = null
let orologio = 0

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

// ── la batteria, come quella del wallet: 100 % alle 7, 2 % alle 19, poi in carica fino alle 7 ──
function oraMantova() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date())
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
  dlg.innerHTML = `<div class="t-corpo">
    <img class="t-cornice" src="${PAGER.src}" width="${PAGER.w}" height="${PAGER.h}" alt="" draggable="false">
    <div class="t-schermo chat" data-in="home">
      <div class="t-palco">
        <div class="t-stato" aria-hidden="true">
          <span class="t-rete"><i></i><i></i><i></i><i></i><b>pzkkonet</b></span>
          <span class="t-ora"></span>
          <span class="t-batt"><i></i><i></i><i></i><i></i><i></i><b></b></span>
        </div>
        <div class="t-vista"><div class="t-home"></div></div>
        <div class="t-toast" role="status" aria-live="polite"></div>
        <nav class="t-nav" aria-label="i tasti"><button type="button" data-t="indietro" aria-label="indietro">${icona('app-indietro')}</button><button type="button" data-t="home" aria-label="home">${icona('app-home')}</button></nav>
      </div>
    </div>
    <i class="t-led" aria-hidden="true"></i>
    <button class="t-tasto su" type="button" data-t="home" aria-label="tasto di sopra: la home"></button>
    <button class="t-tasto giu" type="button" data-t="indietro" aria-label="tasto di sotto: indietro"></button>
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
  led.collega(ledEl) // sfarfalla quando il sistema lavora (chat/led.js)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); corrente ? indietro() : chiudi() }) // Esc: prima indietro, poi si chiude
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  dlg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]')
    if (!t) return
    const v = t.dataset.t
    if (v === 'home') (corrente ? home() : chiudi()) // home quando sei già nella home: lo metti via
    else if (v === 'indietro') indietro()
    else if (v === 'chiudi') chiudi()
    else if (v.startsWith('app:')) vai(v.slice(4))
  })
  homeEl.addEventListener('click', (e) => { const b = e.target.closest('[data-app]'); if (b) vai(b.dataset.app, { tab: b.dataset.tab }) })
  zaino.ascolta(() => { if (dlg.open) { aggiornaLed(); if (!corrente) disegnaHome() } })
  pzk.osserva(() => { if (!corrente && dlg.open) disegnaHome() })
  new ResizeObserver(adatta).observe(dlg)
  PIENO.addEventListener('change', adatta)
}

function aggiornaStato() {
  const b = batteria()
  statoEl.querySelector('.t-ora').textContent = ora()
  const bt = statoEl.querySelector('.t-batt')
  bt.classList.toggle('carica', b.carica); bt.classList.toggle('bassa', b.pct <= 15 && !b.carica)
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
  homeEl.innerHTML = `
    <div class="t-h-sx">
      <div class="t-w-ora"><b>${ora()}</b><span>${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div class="t-widget">
        <button class="t-w t-w-saldo" type="button" data-app="banca"><small>saldo</small><b class="pzk">${pzk.fmt(pzk.saldo())} $pzk</b>${e >= 0.01 ? `<span class="eur">EUR€ ${pzk.fmtEur(e)}</span>` : ''}<div class="t-xp"><i style="width:${pct}%"></i></div><small>livello ${liv} · ${xp - da}/${a - da} xp</small></button>
        <button class="t-w t-w-sfide" type="button" data-app="sfide"><small>sfide di oggi</small><b>${o.sfide.filter((x) => x.riscossa).length}/3</b><div class="t-pips">${o.sfide.map((x) => `<i class="${x.riscossa ? 'fatta' : x.pronta ? 'pronta' : ''}"></i>`).join('')}</div><small>${o.sfide.some((x) => x.pronta) ? 'da riscuotere!' : o.tutte ? 'tutte fatte' : 'da fare'}</small></button>
      </div>
      <button class="t-w t-w-notizie" type="button" data-app="giocatori" data-tab="notizie"><small>dalla banca</small><div class="t-notizia">…</div></button>
    </div>
    <div class="t-griglia">${APP.map(piastrella).join('')}</div>`
  aggiornaBadge()
  caricaNotizia()
}
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
async function caricaNotizia() {
  const el = homeEl.querySelector('.t-notizia')
  if (!el) return
  const db = await import('../chat/db.js')
  const d = await db.notizie()
  const n = d.ok && d.notizie[0]
  if (!homeEl.contains(el)) return
  el.innerHTML = n ? (({ icona: i, html }) => `${icona(i)}<span>${html}</span>`)(db.testoNotizia(n)) : `${icona('bot')}<span>in banca è tutto tranquillo. Per ora.</span>`
}

// ── la transizione: il cercapersone piccolo si ingrandisce e diventa quello grande ──
// Un doppione del tasto (la foto del cercapersone piccolo, con la chiocciolina viva sul suo lcd) parte dal tasto e si allarga
// fino al posto del cercapersone grande; lì sfuma nella versione in alta qualità, e lo schermo si accende: la prima volta con
// l'accensione «pzk os» (la chiocciolina a pixel grossi e la barra di caricamento, nello stile del tomodachi). Alla chiusura
// il contrario. Il doppione sta DENTRO il dialog (che è nel top layer), con position:fixed.
let origine = null // il tasto da cui si è aperto
let acceso = false // l'accensione si vede una volta per pagina
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
const visibile = (r) => r && r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
const rett = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
/** Una copia viva del canvas della chiocciolina (si ridisegna mentre l'animazione va). */
function copiaLcd() {
  const src = origine?.querySelector('.ct-lcd canvas'), cv = document.createElement('canvas')
  cv.width = src?.width || 64; cv.height = src?.height || 32
  const copia = () => { if (!src) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0) }
  copia()
  cv.vivo = setInterval(copia, 120)
  return cv
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
  d.vivo = cv.vivo
  return d
}
/** Lo schermo che si accende: lcd verde, la chiocciolina grande, «pzk os» e la barra. */
function accensione() {
  const z = document.createElement('div')
  z.className = 't-boot'
  z.setAttribute('aria-hidden', 'true')
  const cv = copiaLcd()
  z.appendChild(cv)
  z.insertAdjacentHTML('beforeend', '<div class="t-boot-txt"><b>pzk os</b><span>pzkkonet · in linea</span><i><em></em></i></div>')
  z.vivo = cv.vivo
  return z
}
/** Il rettangolo del cercapersone grande (sul cellulare: il cercapersone che entra nella larghezza della finestra). */
function doveGrande() {
  if (!PIENO.matches) return corpo.getBoundingClientRect()
  const w = innerWidth * 0.94, h = w * (PAGER.h / PAGER.w)
  return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h }
}
async function ingrandisci() {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) { dlg.showModal(); adatta(); return false } // niente transizione: si apre e basta
  // «fermo»: l'animazione d'apertura normale del dialog resta spenta finché è aperto (se no, tolto «zoom», ripartirebbe e il
  // cercapersone farebbe un saltello un secondo dopo essersi aperto)
  dlg.classList.add('fermo', 'zoom', 'zoom-nascosto')
  dlg.showModal()
  adatta()
  const r1 = doveGrande()
  const d = doppione()
  Object.assign(d.style, rett(r0))
  dlg.appendChild(d)
  origine.style.visibility = 'hidden' // il tasto «parte»: non resta lì mentre il suo doppione vola
  requestAnimationFrame(() => dlg.classList.add('zoom-sfondo'))
  await d.animate([{ ...rett(r0), transform: 'rotate(0deg)' }, { offset: 0.55, transform: 'rotate(-2deg)' }, { ...rett(r1), transform: 'rotate(0deg)' }], { duration: 620, easing: 'cubic-bezier(.6,0,.25,1)', fill: 'forwards' }).finished
  // arrivato. Il cercapersone vero compare DI COLPO sotto il doppione: è la stessa foto nello stesso posto, quindi non si vede
  // niente; poi cambia solo lo schermo. La prima volta l'accensione parte dall'lcd identico a quello del doppione (la
  // chiocciolina a tutto schermo) e solo dopo la chiocciolina si sposta per far posto a «pzk os»; le altre volte il verde
  // dell'lcd sfuma nelle app.
  dlg.classList.remove('zoom-nascosto')
  if (!acceso) {
    acceso = true
    const boot = accensione()
    Object.assign(boot.style, rett(schermo.getBoundingClientRect()))
    dlg.appendChild(boot)
    clearInterval(d.vivo); d.remove()
    await dorm(60)
    boot.classList.add('su')
    await dorm(1250)
    boot.classList.add('via')
    await dorm(300)
    clearInterval(boot.vivo); boot.remove()
  } else {
    d.classList.add('via')
    await dorm(320)
    clearInterval(d.vivo); d.remove()
  }
  dlg.classList.remove('zoom', 'zoom-sfondo')
  return true
}
async function rimpicciolisci() {
  const r0 = origine?.getBoundingClientRect()
  if (RIDOTTO.matches || !visibile(r0)) return false
  const r1 = doveGrande()
  // lo schermo si spegne: sopra il cercapersone vero compare il doppione, identico, con l'lcd verde della chiocciolina (la
  // cornice non cambia, cambia solo lo schermo); poi il vero sparisce DI COLPO sotto il doppione, che si rimpicciolisce
  // fino al tasto, dove torna il tasto vero (la stessa foto, piccola)
  const d = doppione()
  Object.assign(d.style, rett(r1))
  const lcd = d.querySelector('.t-doppio-lcd'), img = d.querySelector('img')
  lcd.style.opacity = '0'
  dlg.appendChild(d)
  dlg.classList.add('zoom', 'zoom-sfondo')
  img.style.opacity = '1'
  await lcd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'forwards' }).finished
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

// ── apri, chiudi, vai ──
export async function apri(app = null, opz = {}) {
  await caricaStile()
  costruisci()
  if (!dlg.open) {
    if (opz.da) origine = opz.da
    dlg.classList.remove('chiude')
    aggiornaStato()
    const transizione = opz.da ? ingrandisci() : (dlg.showModal(), adatta(), Promise.resolve(false))
    if (app) await vai(app, opz)
    else home()
    await transizione
    clearInterval(orologio)
    orologio = setInterval(() => { if (dlg.open) { aggiornaStato(); if (!corrente) { const o = homeEl.querySelector('.t-w-ora b'); if (o) o.textContent = ora() } } }, 20_000)
    return
  }
  if (app) await vai(app, opz)
  else home()
}
export async function chiudi() {
  clearInterval(orologio)
  if (!dlg?.open || dlg.classList.contains('zoom')) return
  if (await rimpicciolisci()) { dlg.classList.remove('fermo'); return }
  if (origine) origine.style.visibility = ''
  dlg.classList.remove('fermo')
  if (RIDOTTO.matches) return dlg.close()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', () => { dlg.classList.remove('chiude'); dlg.close() }, { once: true })
}
export function home() {
  if (!dlg) return
  const prima = corrente
  corrente = null
  storia.length = 0
  for (const { host, ist } of montate.values()) { if (!host.hidden) ist?.nascondi?.(); host.hidden = true; host.classList.remove('entra') }
  homeEl.hidden = false
  schermo.dataset.in = 'home'
  disegnaHome()
  if (prima && !RIDOTTO.matches) { homeEl.classList.remove('torna'); void homeEl.offsetWidth; homeEl.classList.add('torna') }
}
/** Il tasto di sotto: dentro un'app chiede all'app (la sua freccia indietro), se no torna all'app di prima, o alla home. */
export function indietro() {
  if (!corrente) return
  const freccia = montate.get(corrente)?.host.querySelector('.t-indietro, .c-indietro')
  if (freccia && !freccia.matches('.c-indietro')) { freccia.click(); return }
  const prima = storia.pop()
  if (prima) vai(prima, { daIndietro: true })
  else home()
}
export async function vai(id, opz = {}) {
  const a = APP.find((x) => x.id === id)
  if (!a) return
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
  if (!RIDOTTO.matches) { m.host.classList.remove('entra'); void m.host.offsetWidth; m.host.classList.add('entra') }
  m.ist?.mostra?.(opz)
}

// ── quello che si dà alle app ──
function ctxApp(id) {
  return {
    id, home, vai, esc, icona,
    /** La testata di un'app: freccia indietro, titolo, e (se serve) altro html a destra. */
    testata: (titolo, destra = '') => `<header class="t-testata"><button class="t-indietro" type="button" data-t="home" aria-label="torna alla home">‹</button><h2>${titolo}</h2><div class="t-az">${destra}</div></header>`,
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
