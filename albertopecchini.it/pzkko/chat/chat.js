// La chat col bot dei $pzk (22.10): si apre dal cercapersone sotto il wallet (index.html, .chat-tasto). Si parla col bot,
// che si chiama pzk ed è la chiocciola della banca con gli occhiali da sole: si scrive un comando («pesca», «lavora»,
// «roulette 50 rosso»; anche «pzk pesca» e «/pesca» vanno bene) e lui risponde con una scheda, come un bot di Discord
// (è fatto sul modello di Dank Memer, tutto in italiano e con le cose di Mantova). I soldi sono i $pzk di games/pzk.js,
// gli stessi dei giochi e del wallet; il resto (xp, livello, mestiere, oggetti, attese) è lo zaino (zaino.js).
// I comandi stanno in comandi/ (una famiglia per file); le icone sono le nostre (icone.js, art/chat-*), mai emoji.
//
// prepara(tasto): accende il cercapersone («1 msg» quando c'è un premio pronto). apri(comando): apre la chat e, se c'è,
// scrive il comando. Un comando riceve un «ctx» con tutto quello che serve per parlare e aspettare risposte: dì(scheda),
// aggiorna(el, scheda), scegli(el, bottoni, ms), scrivi(ms), tempo(el, ms), dormi(ms), pensa(ms), paga(n), spendi(n)…

import * as pzk from '../games/pzk.js'
import * as zaino from './zaino.js'
import { conIcone, icona } from './icone.js'
import { COMANDI, PER_NOME, CATEGORIE } from './comandi/index.js'
import { eventoCasuale, salutoIniziale } from './comandi/eventi.js'
import { NEGOZIO as NEGOZIO_OGGETTI } from './testi.js'
import * as led from './led.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const mezzi = (n) => Math.round(n * 2) / 2
export const fmt = pzk.fmt
export const pzkHtml = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
export const eurHtml = (n) => `<span class="eur">EUR€ ${pzk.fmtEur(n)}</span>`

let tasto = null, dlg = null, lista = null, input = null, sugg = null, saldoEl = null, giuEl = null, rapidiEl = null
let nuovi = 0, ultimoGiorno = '', incollata = true, rapidiFrecce = () => {}
let aspettaTesto = null // { risolvi, nascosto } quando un minigioco aspetta che si scriva qualcosa
const storia = [] // i comandi scritti, per le frecce
let iStoria = -1
const inCorso = new Set() // i comandi che stanno girando (un minigioco alla volta per comando)
let salutato = false

// ── il tasto ──
export function prepara(b) {
  tasto = b
  led.collega(b.querySelector('.ct-led')) // il led sfarfalla quando il sistema lavora (led.js)
  aggiornaTasto()
  import('./tomodachi.js').then((m) => m.avvia(b)).catch((e) => console.warn('tomodachi non partito', e)) // la chiocciolina sullo schermo lcd
  zaino.ascolta(aggiornaTasto)
  pzk.osserva(() => { aggiornaTasto(); aggiornaSaldo() })
  setInterval(aggiornaTasto, 30_000)
}
/** Il cercapersone dice «1 msg» quando c'è un premio da riscuotere (il giornaliero, o qualcosa in sospeso). */
function aggiornaTasto() {
  if (!tasto) return
  tasto.classList.toggle('msg', zaino.manca('giornaliero') === 0)
}

// ── il pannello: dal 23.10 la chat è un'app del telefono (telefono/telefono.js), si monta dentro il suo schermo ──
/** Monta la chat dentro `host` (la fa il telefono una volta sola); poi `mostra()` ogni volta che l'app torna in primo piano. */
export function monta(host) {
  if (dlg) return dlg
  dlg = document.createElement('div')
  dlg.className = 'chat-app'
  dlg.innerHTML = `<div class="c-schermo">
      <div class="c-testa"><button class="c-indietro" type="button" aria-label="torna alla home del telefono">‹</button>${icona('bot')}<div class="c-nome">pzk<small>bot · online</small></div><div class="c-saldo" aria-live="off"></div></div>
      <div class="c-lista" role="log" aria-live="polite"></div>
      <button class="c-giu" type="button" aria-label="vai agli ultimi messaggi" hidden><span>↓</span><b class="c-nuovi"></b></button>
      <div class="c-rapidi-box">
        <button class="c-fr sx" type="button" aria-label="scorri i tasti a sinistra" hidden>‹</button>
        <div class="c-rapidi" role="toolbar" aria-label="le ultime scelte"></div>
        <button class="c-fr dx" type="button" aria-label="scorri i tasti a destra" hidden>›</button>
      </div>
      <form class="c-riga" autocomplete="off">
        <ul class="c-sugg" role="listbox" hidden></ul>
        <span class="c-prompt" aria-hidden="true">›</span>
        <input type="text" name="c" placeholder="scrivi un comando: aiuto" aria-label="il comando" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" maxlength="120">
        <button class="c-b c-invia" type="submit">invia</button>
      </form>
    </div>`
  host.appendChild(dlg)
  lista = dlg.querySelector('.c-lista')
  input = dlg.querySelector('input')
  sugg = dlg.querySelector('.c-sugg')
  saldoEl = dlg.querySelector('.c-saldo')
  giuEl = dlg.querySelector('.c-giu')
  rapidiEl = dlg.querySelector('.c-rapidi')
  lista.addEventListener('scroll', () => { incollata = visteAlFondo(); if (incollata) azzeraNuovi(); else giuEl.hidden = false }, { passive: true })
  lista.addEventListener('load', () => { if (incollata) vaiGiu() }, true) // un'icona che arriva allunga la lista: si resta in fondo
  giuEl.addEventListener('click', () => { azzeraNuovi(); vaiGiu(true) })
  lista.addEventListener('click', clicLista)
  lista.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.cmd')) { e.preventDefault(); clicLista(e) } })
  rapidiEl.addEventListener('click', clicRapidi)
  // le freccette: la fila scorre a passi, e ogni freccia c'è solo se da quel lato c'è altro
  const frecce = () => {
    const sx = dlg.querySelector('.c-fr.sx'), dx = dlg.querySelector('.c-fr.dx')
    sx.hidden = rapidiEl.scrollLeft < 8
    dx.hidden = rapidiEl.scrollLeft + rapidiEl.clientWidth > rapidiEl.scrollWidth - 8
  }
  rapidiFrecce = () => requestAnimationFrame(frecce)
  for (const f of dlg.querySelectorAll('.c-fr')) f.addEventListener('click', () => rapidiEl.scrollBy({ left: (f.classList.contains('sx') ? -1 : 1) * rapidiEl.clientWidth * 0.7, behavior: RIDOTTO.matches ? 'instant' : 'smooth' }))
  rapidiEl.addEventListener('scroll', frecce, { passive: true })
  new ResizeObserver(frecce).observe(rapidiEl)
  disegnaRapidi()
  zaino.ascolta(disegnaRapidi)
  dlg.querySelector('.c-indietro').addEventListener('click', () => import('../telefono/telefono.js').then((t) => t.home()))
  dlg.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); invia() })
  input.addEventListener('input', suggerisci)
  input.addEventListener('keydown', tasti)
  input.addEventListener('blur', () => setTimeout(() => { sugg.hidden = true }, 150))
  sugg.addEventListener('mousedown', (e) => { const li = e.target.closest('li'); if (li) { e.preventDefault(); input.value = li.dataset.nome + ' '; sugg.hidden = true; input.focus() } })
  aggiornaSaldo()
  return dlg
}
function aggiornaSaldo() {
  if (!saldoEl) return
  const e = pzk.euro()
  saldoEl.innerHTML = `<b>${pzk.fmt(pzk.saldo())} $pzk</b>${e >= 0.01 ? `<span class="eur">EUR€ ${pzk.fmtEur(e)}</span>` : ''}liv. ${zaino.livello()}`
}
/** L'app torna in primo piano: il saluto la prima volta, poi (se c'è) un comando da scrivere. */
export function mostra(comando = null) {
  if (!salutato) { salutato = true; salutoIniziale(ctxDi([], '')) }
  aggiornaSaldo()
  if (typeof comando === 'string' && comando.trim()) { input.value = comando; invia() }
  else if (matchMedia('(hover:hover)').matches) requestAnimationFrame(() => input.focus()) // sul telefono vero la tastiera non salta fuori da sola
  vaiGiu()
}
/** Apre il telefono: il cercapersone e l'evento «pzkko-chat» arrivano qui. Col clic si apre la home (lo schermo del
 *  cercapersone si zooma fino al telefono); con un comando, o con #chat nell'indirizzo, si apre direttamente la chat. */
export function apri(comando = null) {
  const conComando = typeof comando === 'string' && comando.trim()
  const app = conComando || location.hash === '#chat' ? 'chat' : null
  return import('../telefono/telefono.js').then((t) => t.apri(app, { comando: conComando ? comando : null, da: tasto }))
}
export function chiudi() { return import('../telefono/telefono.js').then((t) => t.chiudi()) }

// ── i messaggi ──
const visteAlFondo = () => lista.scrollHeight - lista.scrollTop - lista.clientHeight < 60
function vaiGiu(liscio = false) { incollata = true; lista.scrollTo({ top: lista.scrollHeight, behavior: liscio && !RIDOTTO.matches ? 'smooth' : 'instant' }) }
function azzeraNuovi() { nuovi = 0; giuEl.hidden = true; giuEl.querySelector('.c-nuovi').textContent = '' }
/** Dopo un cambio: se si stava guardando in fondo si resta in fondo, se no si segna «n nuovi» sul tasto ↓.
 *  `incollata`: la lista segue il fondo finché chi legge non scorre in su (così anche le icone che arrivano dopo non la staccano). */
function scorri(nuovoMsg = false, mio = false) {
  if (mio || incollata) { vaiGiu(); return }
  if (nuovoMsg) { nuovi++; giuEl.querySelector('.c-nuovi').textContent = nuovi }
  giuEl.hidden = false
}
const ora = (d = new Date()) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
/** Il separatore del giorno («oggi», «ieri», «lun 12 ott») quando cambia. */
function separatore() {
  const g = new Date().toDateString()
  if (g === ultimoGiorno) return
  const prima = ultimoGiorno
  ultimoGiorno = g
  const s = document.createElement('div')
  s.className = 'c-giorno'
  s.textContent = prima ? new Date().toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) : 'oggi'
  lista.appendChild(s)
}
function aggiungi(el, mio = false) {
  separatore()
  lista.appendChild(el)
  while (lista.children.length > 160) lista.firstElementChild.remove()
  scorri(true, mio)
  lista.dataset.letto = '1'
  return el
}
export function utente(testo, { rifai = false } = {}) {
  const m = document.createElement('div')
  m.className = 'c-msg tu'
  m.innerHTML = `<time class="c-ora">${ora()}</time><div class="c-bolla"></div>${rifai ? '<button class="c-rip" type="button" title="rifallo" aria-label="rifai questo comando">↻</button>' : ''}`
  m.querySelector('.c-bolla').textContent = testo
  const rip = m.querySelector('.c-rip')
  if (rip) rip.dataset.cmd = testo
  return aggiungi(m, true)
}
export function sistema(testo) {
  const m = document.createElement('div')
  m.className = 'c-msg sistema'
  m.innerHTML = conIcone(testo)
  return aggiungi(m)
}
/** Il contenuto di una scheda: { t: titolo, d: testo (con :icone: e <b>), html, campi: [[nome, valore, largo?]], img, pie, colore, av } */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
/** I <code>comando</code> dentro il testo diventano tasti: si clicca e il comando parte (se ha parti da riempire, <…> o […], si scrive nella riga). */
function cliccabili(html) {
  return html.replace(/<code>([^<]{1,60})<\/code>/g, (m, t) => {
    const vero = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    const primo = vero.trim().replace(/^\/+/, '').replace(/^pzk\s+/i, '').split(/\s+/)[0]?.toLowerCase()
    if (!primo || !PER_NOME.has(primo)) return m
    return `<code class="cmd" role="button" tabindex="0" data-cmd="${esc(vero)}" title="${/[<[]/.test(vero) ? 'scrivilo nella riga' : 'toccalo per farlo'}">${t}</code>`
  })
}
/** Il contenuto di una scheda: { t, d, html, campi, img, pie, colore, av, azioni: [[comando, etichetta, stile?]] (tasti di seguito) } */
function riempi(s, e) {
  s.className = `c-scheda ${e.colore ?? 'verde'}`
  const campi = e.campi?.length ? `<dl class="c-campi">${e.campi.map(([n, v, largo]) => `<div${largo ? ' class="largo"' : ''}><dt>${conIcone(n)}</dt><dd>${conIcone(v)}</dd></div>`).join('')}</dl>` : ''
  const azioni = e.azioni?.length ? `<div class="c-azioni">${e.azioni.map(([cmd, eti, stile]) => `<button type="button" class="c-az ${stile ?? ''}" data-cmd="${esc(cmd)}">${conIcone(eti ?? cmd)}</button>`).join('')}</div>` : ''
  s.innerHTML = cliccabili(`${e.t ? `<h4>${conIcone(e.t)}</h4>` : ''}${e.d ? `<p class="c-testo">${conIcone(e.d)}</p>` : ''}${e.html ? conIcone(e.html) : ''}${campi}` +
    `${e.img ? `<img class="c-img" src="${esc(e.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}${e.pie ? `<div class="c-pie">${conIcone(e.pie)}</div>` : ''}`) + azioni
}
// I messaggi del bot non spuntano di colpo (23.10): prima «sta scrivendo…» per 500 ms, poi il testo si scrive da solo, tutto,
// in 1000 ms (qualunque sia la lunghezza). La scheda però esiste subito, nascosta (.in-attesa), perché i comandi la usano
// appena creata (ci aggiungono i bottoni, la barra del tempo, la aggiornano): una CODA la mostra a turno, una alla volta,
// nell'ordine in cui sono nate. `scheda.__pronta` è la promessa del momento in cui la scrittura è finita: i bottoni
// (scegli) e il timer dei quiz partono solo allora. Con «riduci animazioni» il messaggio appare subito.
export const RITARDO_MS = 500, SCRITTURA_MS = 1000
let coda = Promise.resolve()
const DA_NASCONDERE = 'img,button,svg,canvas,.c-barra,.c-tempo,.c-azioni,.c-campi,table,ul'

export function scheda(e) {
  const m = document.createElement('div')
  m.className = 'c-msg'
  m.innerHTML = `<div class="c-av">${icona(e.av ?? 'bot')}</div><div class="c-scheda"></div><time class="c-ora">${ora()}</time>`
  const card = m.querySelector('.c-scheda')
  riempi(card, e)
  m.querySelector('.c-img')?.addEventListener('load', () => scorri(), { once: true })
  if (RIDOTTO.matches) { aggiungi(m); card.__pronta = Promise.resolve(); return card }
  m.classList.add('in-attesa')
  aggiungi(m)
  card.__avatar = e.av ?? 'bot'
  card.__pronta = coda = coda.then(() => mostraScrivendo(m, card)).catch((err) => console.warn('scrittura:', err))
  return card
}

/** Il momento del messaggio: puntini per 500 ms, poi la scrittura. */
async function mostraScrivendo(m, card) {
  if (card.__fatto) return
  led.inizia() // il bot «ragiona»: il led lavora finché il messaggio non è scritto
  try { await scriviConPuntini(m, card) } finally { led.finisci() }
}
async function scriviConPuntini(m, card) {
  const ind = document.createElement('div')
  ind.className = 'c-msg'
  ind.innerHTML = `<div class="c-av">${icona('bot-pensa')}</div><div class="c-scrive"><i></i><i></i><i></i></div>`
  lista.insertBefore(ind, m)
  scorri()
  await new Promise((r) => { card.__salta = r; setTimeout(r, RITARDO_MS) })
  ind.remove()
  if (card.__fatto) return
  m.classList.remove('in-attesa')
  await scriviAMano(m, card)
}

/** Fa comparire il testo di una scheda un pezzetto alla volta, in SCRITTURA_MS in tutto; icone, tasti e barre quando arriva il loro turno. */
function scriviAMano(m, card) {
  return new Promise((risolvi) => {
    const nodi = [], blocchi = []
    let totale = 0
    const giro = document.createTreeWalker(card, NodeFilter.SHOW_ALL)
    for (let n = giro.nextNode(); n; n = giro.nextNode()) {
      if (n.nodeType === 3) { if (n.nodeValue) { nodi.push({ n, s: n.nodeValue, da: totale }); totale += n.nodeValue.length } }
      else if (n.nodeType === 1 && n.matches(DA_NASCONDERE) && !n.parentElement.closest(DA_NASCONDERE)) blocchi.push({ n, da: totale })
    }
    if (!totale) return risolvi()
    for (const { n } of nodi) n.nodeValue = ''
    for (const { n } of blocchi) n.classList.add('nasc')
    const inizio = performance.now()
    let finito = false
    const fine = () => {
      if (finito) return
      finito = true
      clearInterval(giroTimer)
      for (const { n, s } of nodi) n.nodeValue = s
      for (const { n } of blocchi) n.classList.remove('nasc')
      card.__fatto = true
      card.__finisci = null
      scorri()
      risolvi()
    }
    card.__finisci = fine
    const passo = () => {
      const k = Math.min(1, (performance.now() - inizio) / SCRITTURA_MS)
      const fino = Math.round(totale * k)
      for (const { n, s, da } of nodi) { const v = s.slice(0, Math.max(0, fino - da)); if (n.nodeValue !== v) n.nodeValue = v }
      for (const { n, da } of blocchi) if (da < fino || k >= 1) n.classList.remove('nasc')
      scorri()
      if (k >= 1) fine()
    }
    const giroTimer = setInterval(passo, 30)
    passo()
  })
}

export function aggiorna(s, e) {
  // un aggiornamento mentre la scheda si sta ancora scrivendo la completa di colpo (e salta la coda)
  if (s.__finisci) s.__finisci()
  if (!s.__fatto && s.__salta) { s.__fatto = true; s.__salta(); s.parentElement.classList.remove('in-attesa') }
  if (e.av) s.parentElement.firstElementChild.innerHTML = icona(e.av)
  riempi(s, e)
  s.parentElement.querySelector('.c-ora')?.replaceChildren(ora())
  scorri()
  return s
}
/** La barra del tempo in fondo alla scheda (parte quando la scheda è scritta tutta); → ferma() */
export function tempo(s, ms) {
  const b = document.createElement('div')
  b.className = 'c-tempo'
  b.style.setProperty('--ms', `${ms}ms`)
  b.innerHTML = '<i></i>'
  s.appendChild(b)
  return () => b.classList.add('ferma')
}
/** I pulsanti sotto la scheda (compaiono a scrittura finita): → Promise dell'id premuto, o null allo scadere. { griglia: 'g5'|'g3', resta: true tiene i pulsanti attivi (li gestisce chi chiama) } */
export async function scegli(s, bottoni, ms = 0, { griglia = null, onPremuto = null } = {}) {
  await s.__pronta
  const riga = document.createElement('div')
  riga.className = griglia ? `c-griglia ${griglia}` : 'c-bottoni'
  for (const b of bottoni) {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = `c-b ${b.stile ?? ''}`
    el.dataset.id = b.id
    el.innerHTML = conIcone(b.eti ?? b.id)
    if (b.title) el.title = b.title
    riga.appendChild(el)
  }
  s.appendChild(riga)
  scorri()
  return new Promise((risolvi) => {
    let timer = 0
    const fine = (id, premuto) => {
      clearTimeout(timer)
      for (const b of riga.querySelectorAll('button')) { b.disabled = true; if (b === premuto) b.classList.add('premuto') }
      risolvi(id)
    }
    riga.addEventListener('click', (e) => {
      const b = e.target.closest('button')
      if (!b || b.disabled) return
      if (onPremuto) { const r = onPremuto(b.dataset.id, b, riga); if (r === 'continua') return; if (r !== undefined) return fine(r, b) }
      fine(b.dataset.id, b)
    })
    if (ms > 0) { timer = setTimeout(() => fine(null, null), ms) }
    riga.querySelector('button')?.focus({ preventScroll: true })
  })
}
/** Aspetta che si scriva qualcosa nella riga: → Promise del testo (o null allo scadere). */
export function scrivi(ms = 0, { segnaposto = 'scrivi qui…' } = {}) {
  return new Promise((risolvi) => {
    const prima = input.placeholder
    input.placeholder = segnaposto
    input.focus()
    let timer = 0
    aspettaTesto = { risolvi: (t) => { clearTimeout(timer); aspettaTesto = null; input.placeholder = prima; risolvi(t) } }
    if (ms > 0) timer = setTimeout(() => aspettaTesto?.risolvi(null), ms)
  })
}
export const dormi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? Math.min(ms, 150) : ms))
/** Il bot «scrive…» per un po'. */
export async function pensa(ms = 700) {
  led.colpo(ms)
  const m = document.createElement('div')
  m.className = 'c-msg'
  m.innerHTML = `<div class="c-av">${icona('bot-pensa')}</div><div class="c-scrive"><i></i><i></i><i></i></div>`
  aggiungi(m)
  await dormi(ms)
  m.remove()
}

// ── i soldi, visti dalla chat ──
/** Paga n $pzk (col moltiplicatore del livello e degli effetti). → quanto è arrivato */
export function paga(n, { puro = false } = {}) {
  const tot = mezzi(puro ? n : n * zaino.moltiplicatore())
  if (tot > 0) { pzk.regola('chat', 0, tot); zaino.conta('guadagnati', tot) }
  return tot
}
/** Toglie n $pzk dal saldo (un acquisto, una multa). → false se non bastano */
export function spendi(n) {
  n = mezzi(n)
  if (n <= 0) return true
  if (!pzk.punta('chat', n)) return false
  pzk.regola('chat', n, 0)
  return true
}
/** Una puntata: mette n sul tavolo del gioco; poi `regola(gioco, n, torna)` chiude il giro. → false se non bastano */
export const punta = (gioco, n) => pzk.punta(gioco, mezzi(n))
export const regola = (gioco, giocato, torna) => { pzk.regola(gioco, giocato, torna); if (torna > giocato) zaino.conta('vinti', torna - giocato); else zaino.conta('persi', giocato - torna) }
/** Il nome di chi parla (quello del conto, o «tu»). */
export const nome = () => pzk.conto()?.nome ?? 'tu'

// ── i comandi ──
/** «pzk pesca», «/pesca», «pesca» → { nome: 'pesca', args: [] }. I numeri: 50, 1k, 2.5k, tutto, metà. */
export function analizza(riga) {
  let t = riga.trim().replace(/^\/+/, '').replace(/^pzk\s+/i, '').trim()
  const [nome, ...args] = t.split(/\s+/)
  return { nome: (nome ?? '').toLowerCase(), args, testo: args.join(' ') }
}
/** Un importo scritto come si scrive: 50, 1k, 1.5k, 1000, tutto/all/max, metà. → numero (a mezzi $pzk) o NaN */
export function importo(s, max = pzk.saldo()) {
  if (s == null) return NaN
  s = String(s).toLowerCase().replace(/\$?pzk$/, '')
  if (['tutto', 'tutti', 'all', 'max'].includes(s)) return mezzi(max)
  if (['metà', 'meta', 'half'].includes(s)) return mezzi(max / 2)
  const m = /^(\d+(?:[.,]\d+)?)(k)?$/.exec(s)
  if (!m) return NaN
  let n = parseFloat(m[1].replace(',', '.'))
  if (m[2]) n *= 1000
  return mezzi(n)
}
export const caso = (a) => a[Math.floor(Math.random() * a.length)]
export const rnd = (n) => Math.floor(Math.random() * n)
export const tra = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
/** Quanto manca, come si dice: 12 s, 3 min, 1 h 20 min, 2 g. */
export function durata(ms) {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.ceil(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  if (h < 24) return r ? `${h} h ${r} min` : `${h} h`
  const g = Math.floor(h / 24)
  return `${g} g ${h % 24} h`
}

function ctxDi(args, testo) {
  return {
    args, testo, zaino, pzk, dì: scheda, scheda, aggiorna, scegli, scrivi, tempo, dormi, pensa, sistema, utente,
    paga, spendi, punta, regola, nome, importo, caso, rnd, tra, durata, fmt, pzkHtml, eurHtml, icona, conIcone,
    esegui, apriWallet: (sez) => pzk.apriWallet(sez), apriApp: (app, opz) => import('../telefono/telefono.js').then((t) => t.apri(app, opz)), comandi: COMANDI, perNome: PER_NOME, categorie: CATEGORIE,
    muori: (motivo) => muori(ctxDi(args, testo), motivo), saleDiLivello: (l) => l && scheda({ colore: 'oro', av: 'bot-ride', t: ':livello: livello ' + l + '!', d: `sei salito di livello: adesso le paghe valgono ×${zaino.moltiplicatore().toLocaleString('it-IT')}.` }),
  }
}

/** La morte (Dank Memer docet): si perde il 20 % dei $pzk liberi (al più 5.000), a meno di avere il cornetto, che si consuma. */
export const MORTE = { quota: 0.2, max: 5000 }
export async function muori(ctx, motivo) {
  zaino.conta('morti')
  if (zaino.togli('cornetto')) {
    scheda({ colore: 'ambra', av: 'bot-occhiolino', t: ':cornetto: il cornetto ha fatto il suo', d: `${motivo}\nSaresti morto, ma il cornetto rosso si è crepato al posto tuo: i $pzk sono salvi. Ne hai ancora ${zaino.quanti('cornetto')}.` })
    return
  }
  const persi = mezzi(Math.min(MORTE.max, pzk.saldo() * MORTE.quota * Math.max(0, 1 + zaino.bonus('morte')))) // il bonsai e il lucchettone ne fanno perdere meno
  if (persi > 0) spendi(persi)
  scheda({ colore: 'rosso', av: 'bot-morto', t: ':teschio: sei morto', d: `${motivo}\nHai perso ${pzkHtml(persi)} (il ${MORTE.quota * 100} % dei $pzk liberi${persi >= MORTE.max ? ', il massimo' : ''}). Gli EUR€ nel wallet non si toccano.`, pie: 'un :cornetto: dal negozio ti avrebbe salvato' })
}

function invia() {
  const riga = input.value.trim()
  if (!riga) return
  input.value = ''
  sugg.hidden = true
  if (aspettaTesto) { utente(riga); aspettaTesto.risolvi(riga); return }
  storia.push(riga); if (storia.length > 50) storia.shift(); iStoria = storia.length
  esegui(riga)
}
/** Esegue una riga come se fosse stata scritta (la mostra nella chat). */
export async function esegui(riga, { muto = false } = {}) {
  const { nome, args, testo } = analizza(riga)
  if (!nome) return
  if (!muto) utente(riga.replace(/^\/+/, ''), { rifai: true })
  const c = PER_NOME.get(nome)
  led.colpo(160)
  if (!c) {
    // non è un comando, ma magari è una cosa del negozio o dello zaino: si propone cosa farne
    const x = NEGOZIO_OGGETTI.find((o) => o.id === nome || o.nome.toLowerCase() === nome)
    if (x) { scheda({ colore: 'ambra', av: 'bot-pensa', t: `:${x.id}: «${nome}» non è un comando`, d: `ma <b>${x.nome}</b> è nel negozio (${pzkHtml(x.prezzo)}). Cosa ne vuoi fare?`, azioni: [[`compra ${x.id}`, 'compra', 'oro'], [`usa ${x.id}`, 'usa'], [`info ${x.id}`, 'info']] }); return }
    scheda({ colore: 'rosso', av: 'bot-pensa', t: 'eh?', d: `«${nome}» non lo conosco. Scrivi <code>aiuto</code> per l'elenco dei comandi.` }); return
  }
  const chiave = c.nomi[0]
  if (!muto) zaino.ricorda(riga)
  if (c.attesa) {
    const m = zaino.manca(chiave)
    if (m > 0) { const s = scheda({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: calma', d: `«${chiave}» lo puoi rifare fra <b>${durata(m)}</b>.${zaino.effetto('caffe') ? '' : ' Un :caffe: dal negozio dimezza le attese.'}` }); tempo(s, Math.min(m, 60_000)); return }
  }
  if (inCorso.has(chiave)) { scheda({ colore: 'ambra', av: 'bot-arrabbiato', d: `stai già facendo «${chiave}»: finisci quello.` }); return }
  inCorso.add(chiave)
  const ctx = ctxDi(args, testo)
  try {
    const r = await c.fai(ctx)
    if (c.attesa && r !== false) zaino.aspetta(chiave, c.attesa * 1000)
    zaino.conta('comandi')
    if (!c.senzaEventi && r !== false && Math.random() < 0.07) await eventoCasuale(ctx)
  } catch (e) {
    console.error('chat:', e)
    scheda({ colore: 'rosso', av: 'bot-arrabbiato', t: 'qualcosa si è rotto', d: `${e.message ?? e}` })
  } finally {
    inCorso.delete(chiave)
    disegnaRapidi()
    aggiornaSaldo()
    aggiornaTasto()
  }
}

// ── i tasti rapidi: le ultime scelte, sempre sotto il pollice ──
const RAPIDI_INIZIALI = ['giornaliero', 'lavora', 'pesca', 'saldo', 'aiuto']
/** Un tasto per ognuna delle ultime scelte (la più recente a sinistra); se non ce ne sono ancora, i comandi per cominciare. */
function disegnaRapidi() {
  if (!rapidiEl) return
  const fatti = zaino.rapidi()
  const righe = fatti.length ? fatti : RAPIDI_INIZIALI
  rapidiEl.classList.toggle('iniziali', !fatti.length)
  rapidiEl.innerHTML = (fatti.length ? '' : '<span class="c-r-eti">per cominciare</span>') + righe.map((r) => {
    const c = PER_NOME.get(analizza(r).nome)
    const attesa = c?.attesa ? zaino.manca(c.nomi[0]) : 0
    return `<span class="c-r${attesa ? ' attesa' : ''}"><button type="button" class="c-r-b" data-cmd="${esc(r)}" title="${attesa ? `fra ${durata(attesa)}` : 'rifallo'}">${c?.icona ? icona(c.icona) : ''}<span>${esc(r)}</span></button>${fatti.length ? `<button type="button" class="c-r-x" data-via="${esc(r)}" aria-label="togli ${esc(r)}">×</button>` : ''}</span>`
  }).join('')
  rapidiFrecce()
}
function clicRapidi(e) {
  const via = e.target.closest('[data-via]')
  if (via) { zaino.scorda(via.dataset.via); return }
  const b = e.target.closest('[data-cmd]')
  if (b && !aspettaTesto) esegui(b.dataset.cmd)
  else if (b) { input.value = b.dataset.cmd; input.focus() }
}
/** Un comando toccato dentro la lista: un <code> di un messaggio, un tasto di seguito, il ↻ dei messaggi tuoi. */
function clicLista(e) {
  const b = e.target.closest('[data-cmd]')
  if (!b || b.disabled) return
  const cmd = b.dataset.cmd
  if (aspettaTesto) { input.focus(); return }
  if (b.classList.contains('cmd') && /[<[]/.test(cmd)) { input.value = cmd.replace(/\s*[<[].*$/, ' '); input.focus(); return } // ha parti da riempire
  esegui(cmd)
}

// ── i suggerimenti e le frecce ──
function suggerisci() {
  const v = input.value.trimStart().replace(/^\/+/, '').replace(/^pzk\s+/i, '')
  if (!v || v.includes(' ') || aspettaTesto) { sugg.hidden = true; return }
  const q = v.toLowerCase()
  const trovati = COMANDI.filter((c) => !c.nascosto && c.nomi.some((n) => n.startsWith(q))).slice(0, 8)
  if (!trovati.length) { sugg.hidden = true; return }
  sugg.innerHTML = trovati.map((c, i) => `<li role="option" data-nome="${c.nomi.find((n) => n.startsWith(q)) ?? c.nomi[0]}"${i === 0 ? ' class="scelta"' : ''}>${c.icona ? icona(c.icona) : ''}<b>${c.nomi.find((n) => n.startsWith(q)) ?? c.nomi[0]}</b><span>${c.breve}</span></li>`).join('')
  sugg.hidden = false
}
function tasti(e) {
  if (!sugg.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault()
    const li = [...sugg.children], i = li.findIndex((l) => l.classList.contains('scelta'))
    li[i]?.classList.remove('scelta')
    li[(i + (e.key === 'ArrowDown' ? 1 : li.length - 1)) % li.length].classList.add('scelta')
    return
  }
  if (!sugg.hidden && (e.key === 'Tab' || (e.key === 'Enter' && !input.value.includes(' ')))) {
    const li = sugg.querySelector('.scelta')
    if (li) { e.preventDefault(); input.value = li.dataset.nome + (e.key === 'Tab' ? ' ' : ''); sugg.hidden = true; if (e.key === 'Enter') invia() }
    return
  }
  if (e.key === 'Escape' && !sugg.hidden) { e.preventDefault(); e.stopPropagation(); sugg.hidden = true; return }
  if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !aspettaTesto && storia.length) {
    e.preventDefault()
    iStoria = Math.max(0, Math.min(storia.length, iStoria + (e.key === 'ArrowUp' ? -1 : 1)))
    input.value = storia[iStoria] ?? ''
  }
}
