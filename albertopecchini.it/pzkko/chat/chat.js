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

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const mezzi = (n) => Math.round(n * 2) / 2
export const fmt = pzk.fmt
export const pzkHtml = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
export const eurHtml = (n) => `<span class="eur">EUR€ ${pzk.fmtEur(n)}</span>`

let tasto = null, dlg = null, lista = null, input = null, sugg = null, saldoEl = null
let aspettaTesto = null // { risolvi, nascosto } quando un minigioco aspetta che si scriva qualcosa
const storia = [] // i comandi scritti, per le frecce
let iStoria = -1
const inCorso = new Set() // i comandi che stanno girando (un minigioco alla volta per comando)
let salutato = false

// ── il tasto ──
export function prepara(b) {
  tasto = b
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

// ── il pannello ──
function costruisci() {
  if (dlg) return
  dlg = document.createElement('dialog')
  dlg.className = 'chat'
  dlg.setAttribute('aria-label', 'la chat col bot dei $pzk')
  dlg.innerHTML = `<div class="c-corpo">
    <button class="c-chiudi" type="button" aria-label="chiudi">×</button>
    <div class="c-schermo">
      <div class="c-testa">${icona('bot')}<div class="c-nome">pzk<small>bot · online</small></div><div class="c-saldo" aria-live="off"></div></div>
      <div class="c-lista" role="log" aria-live="polite"></div>
      <form class="c-riga" autocomplete="off">
        <ul class="c-sugg" role="listbox" hidden></ul>
        <span class="c-prompt" aria-hidden="true">›</span>
        <input type="text" name="c" placeholder="scrivi un comando: aiuto" aria-label="il comando" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" maxlength="120">
        <button class="c-b c-invia" type="submit">invia</button>
      </form>
    </div>
  </div>`
  document.body.appendChild(dlg)
  lista = dlg.querySelector('.c-lista')
  input = dlg.querySelector('input')
  sugg = dlg.querySelector('.c-sugg')
  saldoEl = dlg.querySelector('.c-saldo')
  dlg.querySelector('.c-chiudi').addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  dlg.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); invia() })
  input.addEventListener('input', suggerisci)
  input.addEventListener('keydown', tasti)
  input.addEventListener('blur', () => setTimeout(() => { sugg.hidden = true }, 150))
  sugg.addEventListener('mousedown', (e) => { const li = e.target.closest('li'); if (li) { e.preventDefault(); input.value = li.dataset.nome + ' '; sugg.hidden = true; input.focus() } })
  aggiornaSaldo()
}
function aggiornaSaldo() {
  if (!saldoEl) return
  const e = pzk.euro()
  saldoEl.innerHTML = `<b>${pzk.fmt(pzk.saldo())} $pzk</b>${e >= 0.01 ? `<span class="eur">EUR€ ${pzk.fmtEur(e)}</span>` : ''}liv. ${zaino.livello()}`
}
export function apri(comando = null) {
  costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    if (!salutato) { salutato = true; salutoIniziale(ctxDi([], '')) }
  }
  if (typeof comando === 'string' && comando.trim()) { input.value = comando; invia() }
  else requestAnimationFrame(() => input.focus()) // dopo che il dialog ha preso il fuoco
}
export function chiudi() {
  if (!dlg?.open) return
  if (RIDOTTO.matches) return dlg.close()
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', () => { dlg.classList.remove('chiude'); dlg.close() }, { once: true })
}

// ── i messaggi ──
function aggiungi(el) {
  lista.appendChild(el)
  while (lista.children.length > 160) lista.firstElementChild.remove()
  lista.scrollTop = lista.scrollHeight
  return el
}
export function utente(testo) {
  const m = document.createElement('div')
  m.className = 'c-msg tu'
  m.innerHTML = `<div class="c-bolla"></div>`
  m.firstElementChild.textContent = testo
  return aggiungi(m)
}
export function sistema(testo) {
  const m = document.createElement('div')
  m.className = 'c-msg sistema'
  m.innerHTML = conIcone(testo)
  return aggiungi(m)
}
/** Il contenuto di una scheda: { t: titolo, d: testo (con :icone: e <b>), html, campi: [[nome, valore, largo?]], img, pie, colore, av } */
function riempi(s, e) {
  s.className = `c-scheda ${e.colore ?? 'verde'}`
  s.innerHTML = `${e.t ? `<h4>${conIcone(e.t)}</h4>` : ''}${e.d ? `<p class="c-testo">${conIcone(e.d)}</p>` : ''}${e.html ? conIcone(e.html) : ''}` +
    `${e.campi?.length ? `<dl class="c-campi">${e.campi.map(([n, v, largo]) => `<div${largo ? ' class="largo"' : ''}><dt>${conIcone(n)}</dt><dd>${conIcone(v)}</dd></div>`).join('')}</dl>` : ''}` +
    `${e.img ? `<img class="c-img" src="${e.img}" alt="">` : ''}${e.pie ? `<div class="c-pie">${conIcone(e.pie)}</div>` : ''}`
}
export function scheda(e) {
  const m = document.createElement('div')
  m.className = 'c-msg'
  m.innerHTML = `<div class="c-av">${icona(e.av ?? 'bot')}</div><div class="c-scheda"></div>`
  riempi(m.lastElementChild, e)
  aggiungi(m)
  return m.lastElementChild
}
export function aggiorna(s, e) {
  if (e.av) s.parentElement.firstElementChild.innerHTML = icona(e.av)
  riempi(s, e)
  lista.scrollTop = lista.scrollHeight
  return s
}
/** La barra del tempo in fondo alla scheda; → ferma() */
export function tempo(s, ms) {
  const b = document.createElement('div')
  b.className = 'c-tempo'
  b.style.setProperty('--ms', `${ms}ms`)
  b.innerHTML = '<i></i>'
  s.appendChild(b)
  return () => b.classList.add('ferma')
}
/** I pulsanti sotto la scheda: → Promise dell'id premuto, o null allo scadere. { griglia: 'g5'|'g3', resta: true tiene i pulsanti attivi (li gestisce chi chiama) } */
export function scegli(s, bottoni, ms = 0, { griglia = null, onPremuto = null } = {}) {
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
  lista.scrollTop = lista.scrollHeight
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
    esegui, apriWallet: (sez) => pzk.apriWallet(sez), comandi: COMANDI, perNome: PER_NOME, categorie: CATEGORIE,
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
  const persi = mezzi(Math.min(MORTE.max, pzk.saldo() * MORTE.quota))
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
  if (!muto) utente(riga.replace(/^\/+/, ''))
  const c = PER_NOME.get(nome)
  if (!c) { scheda({ colore: 'rosso', av: 'bot-pensa', t: 'eh?', d: `«${nome}» non lo conosco. Scrivi <code>aiuto</code> per l'elenco dei comandi.` }); return }
  const chiave = c.nomi[0]
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
    aggiornaSaldo()
    aggiornaTasto()
  }
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
