// «Virtual», le scommesse sul calcio inventato di pzkko.it, in una finestra sopra il muro come gli altri giochi: il foglio
// grande col nastro, lo schermino a pixel in stile tamagotchi (schermo.js) con la partita, il tabellone (stemmi, nomi,
// punteggio, minuto, cartellini), le quote stampate sul foglio come un tavolo, le fiches fotografate (le stesse degli
// altri giochi) e la schedina. Il campionato è infinito e uguale per tutti: ogni cinque minuti una partita (quattro di
// scommesse, uno di diretta), tutto deciso dall'orario (partita.js). Le quote copiano la forza vera delle squadre, i
// risultati sono a caso: è la battuta del gioco. Soldi finti: i $pzk di ../pzk.js.
//
// Le scommesse fatte restano nella schedina (localStorage, pzkko-virtual) e si pagano al fischio finale anche se la
// finestra era chiusa: riaprendo si trova l'esito. I $pzk puntati stanno sul «tavolo» di pzk.js finché la partita non è
// pagata, come negli altri giochi (così se la pagina si chiude a metà tornano nel saldo).
//
// index.html la apre con import('/games/virtual/virtual.js').then((m) => m.apri()).

import * as pzk from '../pzk.js'
import { PUNTATE, PER_PUNTATA, fase, partita, minuto, punteggioA, scriviRisultato, GOL_MEDI } from './partita.js'
import { stemmaSVG } from './squadre.js'
import { Schermo } from './schermo.js'
import * as SC from './schedina.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const GIOCO = SC.GIOCO
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt
const fmtQuota = SC.fmtQuota
const suona = (nome, d = {}) => window.pzkkoSuono?.evento(nome, d)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ── lo stato ─────────────────────────────────────────────────────────────────
// la schedina, la fiche scelta e le «ultime» stanno in schedina.js (in comune con l'app del cercapersone)
const stato = SC.S
const diAdesso = () => SC.diPartita(corrente.indice)
const sulTavolo = () => SC.sulTavolo(corrente.indice)

// ── la finestra ──────────────────────────────────────────────────────────────
let dlg, el = {}, schermo = null, raf = 0, ultimoT = 0
let corrente = fase() // dove siamo nel ciclo
let detto = false // la voce ha appena detto l'esito: aggiorna() non la copre
let P = null // la partita in scena

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    el.regole.hidden = true
  }
  misura()
  aggiorna(true)
  sveglia()
}

async function costruisci() {
  SC.avvia()
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'virtual.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'vi'
  dlg.setAttribute('aria-labelledby', 'vi-titolo')
  dlg.innerHTML = `
    <div class="vi-dentro">
      <header class="vi-testa">
        <h2 id="vi-titolo">virtual</h2>
        <p class="vi-voce" aria-live="polite"></p>
        <button class="vi-piccolo vi-regole-tasto" type="button" aria-expanded="false">come si gioca</button>
        <button class="vi-chiudi" type="button" aria-label="chiudi virtual"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <section class="vi-diretta">
        <div class="vi-schermo"><canvas aria-label="la partita, sullo schermino" role="img"></canvas></div>
        <div class="vi-tabellone" aria-live="off">
          <div class="vi-sq casa"><span class="vi-st"></span><b class="vi-nome"></b><small class="vi-citta"></small><span class="vi-cart"></span></div>
          <div class="vi-centro"><b class="vi-punti">0 – 0</b><span class="vi-minuto"></span><span class="vi-conto"></span></div>
          <div class="vi-sq ospite"><span class="vi-st"></span><b class="vi-nome"></b><small class="vi-citta"></small><span class="vi-cart"></span></div>
        </div>
        <p class="vi-meteo"></p>
      </section>
      <section class="vi-tavolo">
        <div class="vi-quote" role="group" aria-label="le quote"><div class="vi-esiti"></div><p class="vi-ou-titolo">gol in tutto</p><div class="vi-ou"></div></div>
        <ol class="vi-schedina" aria-label="la schedina"></ol>
      </section>
      <div class="vi-banco">
        <p class="vi-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
        <div class="vi-scegli" role="group" aria-label="scegli la fiche"></div>
        <div class="vi-tasti">
          <button class="vi-piccolo vi-togli" type="button">togli</button>
          <button class="vi-piccolo vi-rifai" type="button">rifai</button>
          <span class="vi-stato"></span>
          <button class="vi-piccolo vi-regole-tasto vi-regole-tel" type="button" aria-expanded="false">come si gioca</button>
        </div>
      </div>
      <section class="vi-regole" hidden>
        <h3>come si gioca</h3>
        <p>ogni cinque minuti una partita del campionato inventato di pzkko: quattro minuti per scommettere, un minuto di diretta sullo schermino. È la stessa partita per chiunque sia sul sito in quel momento: se arrivi a metà la vedi dal punto giusto.</p>
        <p>si punta coi $pzk, che non valgono niente fuori da pzkko.it, su <b>1 X 2</b> e su <b>over / under</b> 1,5 · 2,5 · 3,5 · 4,5 gol. anche più puntate insieme. vincita = puntata × quota, al fischio finale, anche se hai chiuso la finestra.</p>
        <p class="vi-battuta"><b>le quote copiano la Serie A vera, i risultati no:</b> la forte è quotata bassa e la scarsa alta come da un bookmaker, ma il risultato esce a caso (gol a Poisson, media ${GOL_MEDI.toLocaleString('it-IT')} a squadra, uguale per tutte). la sfavorita vince quanto la favorita. anche il meteo è solo scena.</p>
        <p>squadre, stemmi e cognomi sono inventati: Juvenclub, Inder, Napule e Mantua non c'entrano con nessuno. rara ma possibile la vittoria a tavolino (3–0), per nebbia, nutrie o blackout: paga lo stesso.</p>
        <button class="vi-piccolo vi-regole-chiudi" type="button">ho capito</button>
      </section>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.vi-voce'), chiudi: q('.vi-chiudi'), schermoBox: q('.vi-schermo'), canvas: q('canvas'), tab: q('.vi-tabellone'), punti: q('.vi-punti'), minuto: q('.vi-minuto'), conto: q('.vi-conto'), meteo: q('.vi-meteo'),
    casa: q('.vi-sq.casa'), ospite: q('.vi-sq.ospite'), quote: q('.vi-quote'), schedina: q('.vi-schedina'), saldo: q('.vi-saldo b'), puntato: q('.vi-saldo .puntato'), scegli: q('.vi-scegli'),
    togli: q('.vi-togli'), rifai: q('.vi-rifai'), statoT: q('.vi-stato'), regole: q('.vi-regole'), regoleTasto: q('.vi-regole-tasto'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.vi-saldo').appendChild(pzk.linkInstagram({ fatto: () => voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`) }))
  // col conto, gli EUR€ parcheggiati nel wallet (../pzk.js, wallet/)
  q('.vi-saldo').appendChild(pzk.rigaEuro())
  for (const v of pzk.FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `fiche da ${v}`)
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    b.addEventListener('click', () => { stato.fiche = v; aggiornaBanco() })
    el.scegli.appendChild(b)
  }
  // le quote: 1 X 2 su una riga; sotto gli over in fila e gli under in fila (per soglia)
  const ordine = [...PUNTATE.filter((p) => p.id.length === 1), ...PUNTATE.filter((p) => p.id[0] === 'O'), ...PUNTATE.filter((p) => p.id[0] === 'U')]
  for (const p of ordine) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = `vi-quota ${p.id[0] === 'O' ? 'over' : p.id[0] === 'U' ? 'under' : 'esito'}`
    b.dataset.id = p.id
    b.title = p.dice
    b.innerHTML = `<span class="vi-q-nome">${esc(p.nome)}</span><b class="vi-q-val">–</b><span class="vi-q-pila"></span>`
    b.addEventListener('click', () => punta(p.id))
    el.quote.querySelector(p.id.length === 1 ? '.vi-esiti' : '.vi-ou').appendChild(b)
  }
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  const regole = (si) => { el.regole.hidden = !si; for (const b of dlg.querySelectorAll('.vi-regole-tasto')) b.setAttribute('aria-expanded', String(si)); if (si) el.regole.scrollTop = 0 }
  for (const b of dlg.querySelectorAll('.vi-regole-tasto')) b.addEventListener('click', () => regole(el.regole.hidden))
  q('.vi-regole-chiudi').addEventListener('click', () => regole(false))
  new ResizeObserver(() => { if (dlg.open) { misura(); disegna(true) } }).observe(el.schermoBox)
  pzk.ascolta(() => aggiornaBanco()) // il saldo cambia anche giocando agli altri giochi
  document.addEventListener('visibilitychange', () => { if (!document.hidden && dlg.open) { aggiorna(true); sveglia() } })
  // un'altra scheda (o l'app del cercapersone) ha puntato o pagato: si ridisegna
  SC.ascolta(() => { if (dlg.open) { quote(); schedina(); aggiornaBanco() } })
  schermo = new Schermo(el.canvas)
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); if (location.hash === '#virtual') history.replaceState(null, '', location.pathname + location.search) }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  setTimeout(fine, 220)
}
function voce(t) { if (el.voce) el.voce.textContent = t }
function misura() { if (schermo && el.schermoBox.clientWidth) schermo.misura(el.schermoBox.clientWidth, el.schermoBox.clientHeight) }

// ── il ciclo: ogni fotogramma si guarda dove siamo nel ciclo e si disegna di conseguenza ──
function sveglia() { if (!raf && dlg?.open) { ultimoT = performance.now(); raf = requestAnimationFrame(ciclo) } }
function ciclo(now) {
  raf = 0
  if (!dlg.open || document.hidden) return
  const f = fase()
  // è cambiata la fase o la partita: si rifanno il tabellone, le quote, i pagamenti
  if (f.indice !== corrente.indice || f.fase !== corrente.fase) aggiorna()
  else corrente = f
  disegna(false, (now - ultimoT) / 1000)
  ultimoT = now
  // sui tempi lunghi (le scommesse, senza movimento ridotto) si va comunque a pieno ritmo: il riscaldamento si muove;
  // col movimento ridotto bastano due fotogrammi al secondo
  if (RIDOTTO.matches) setTimeout(sveglia, 500)
  else raf = requestAnimationFrame(ciclo)
}

/** La fase è cambiata (o la finestra si è aperta): la partita di adesso, le quote, i pagamenti, il tabellone. */
function aggiorna(apertura = false) {
  const prima = corrente
  corrente = fase()
  P = partita(corrente.indice)
  if (!apertura && prima.indice !== corrente.indice) {
    // la partita prima è finita: si paga (le scommesse di quella partita)
    paga(prima.indice)
  } else pagaScadute()
  if (corrente.fase === 'partita' && (apertura || prima.fase !== 'partita')) { if (!apertura) suona('virtual-fischio'); voce(`in diretta: ${P.casa.nome} – ${P.ospite.nome}`) }
  else if (corrente.fase === 'scommesse' && !detto) voce(sulTavolo() ? `hai ${fmt(sulTavolo())} $pzk sulla partita: puoi ancora puntare` : `${P.casa.nome} – ${P.ospite.nome}: scegli una fiche e tocca una quota`)
  detto = false
  tabellone()
  quote()
  schedina()
  aggiornaBanco()
}

const pagaScadute = () => SC.pagaScadute()
function paga(indice) {
  const r = SC.paga(indice)
  if (!r) return
  const { p, torna, risultato } = r
  voce(torna > 0 ? `${p.casa.sigla}–${p.ospite.sigla} ${scriviRisultato(risultato)}: hai vinto ${fmt(torna)} $pzk` : `${p.casa.sigla}–${p.ospite.sigla} ${scriviRisultato(risultato)}: niente, stavolta`)
  detto = true
  if (torna > 0) suona('virtual-vinta')
  SC.viste() // (il badge del cercapersone: l'esito l'ha visto chi ha la finestra aperta)
}

// ── il tabellone ─────────────────────────────────────────────────────────────
function tabellone() {
  for (const sq of ['casa', 'ospite']) {
    const e = el[sq], s = P[sq]
    e.querySelector('.vi-st').innerHTML = stemmaSVG(s)
    e.querySelector('.vi-nome').textContent = s.nome
    e.querySelector('.vi-citta').textContent = `${s.citta} · ${P.forze[sq]}`
  }
  const m = P.meteo
  const meteoTxt = { sereno: 'sereno', nuvole: 'nuvoloso', pioggia: 'pioggia', nebbia: 'nebbia', neve: 'neve', vento: 'vento forte' }[m.tipo]
  el.meteo.textContent = `a ${P.casa.citta}: ${meteoTxt}, ${m.temp}°${m.notte ? ', in notturna coi riflettori' : m.sera ? ', al tramonto' : ''} · ultime 5 (inventate): ${P.casa.sigla} ${P.ultime.casa.join('')} · ${P.ospite.sigla} ${P.ultime.ospite.join('')}`
  dlg.classList.toggle('diretta', corrente.fase === 'partita')
}
let ultimoMin = '', ultimiPunti = ''
function tabelloneVivo(t) {
  if (corrente.fase === 'partita') {
    const pt = punteggioA(P, Math.max(0, t))
    const sospesa = P.eventi.find((e) => e.tipo === 'sospesa' && e.t <= t)
    const punti = sospesa ? `${P.risultato.casa} – ${P.risultato.ospite}` : `${pt.casa} – ${pt.ospite}`
    const mn = sospesa ? 'SOSP.' : minuto(t).scritta
    if (punti !== ultimiPunti) { el.punti.textContent = punti; ultimiPunti = punti; if (!RIDOTTO.matches) { el.punti.classList.remove('salta'); void el.punti.offsetWidth; el.punti.classList.add('salta') } }
    if (mn !== ultimoMin) { el.minuto.textContent = mn === 'INT' ? 'intervallo' : mn === 'FINE' ? 'finale' : mn; ultimoMin = mn }
    const manca = Math.ceil(corrente.manca / 1000)
    el.conto.textContent = `IN DIRETTA · finisce tra ${manca}s`
    // i cartellini
    const c = schermo.cartelliniA(P, t)
    for (const sq of ['casa', 'ospite']) el[sq].querySelector('.vi-cart').innerHTML = '<i class="g"></i>'.repeat(c.gialli[sq]) + '<i class="r"></i>'.repeat(c.rossi[sq])
  } else {
    const s = Math.ceil(corrente.manca / 1000), mm = Math.floor(s / 60), ss = s % 60
    const txt = `si chiude tra ${mm}:${String(ss).padStart(2, '0')}`
    if (el.conto.textContent !== txt) el.conto.textContent = txt
    if (ultimiPunti !== '–') { el.punti.textContent = '–'; ultimiPunti = '–'; el.minuto.textContent = 'scommesse aperte'; ultimoMin = ''; for (const sq of ['casa', 'ospite']) el[sq].querySelector('.vi-cart').innerHTML = '' }
  }
}

// ── le quote ─────────────────────────────────────────────────────────────────
function quote() {
  const aperte = corrente.fase === 'scommesse'
  for (const b of el.quote.querySelectorAll('.vi-quota')) {
    const id = b.dataset.id
    b.querySelector('.vi-q-val').textContent = fmtQuota(P.quote[id])
    b.disabled = !aperte
    const mie = diAdesso().filter((x) => x.id === id).reduce((a, x) => a + x.puntata, 0)
    pila(b.querySelector('.vi-q-pila'), mie)
  }
  // la favorita evidenziata a pennarello
  const fav = P.quote[1] < P.quote[2] ? '1' : '2'
  for (const b of el.quote.querySelectorAll('.vi-quota')) b.classList.toggle('fav', b.dataset.id === fav)
}
function pila(cont, importo) {
  cont.innerHTML = ''
  if (!importo) return
  const f = pzk.inFiches(importo).slice(0, 8)
  f.forEach((v, i) => { const img = document.createElement('img'); img.src = `${ART}fiches/f${v}.webp`; img.alt = ''; img.style.transform = `translateY(${-i * 2.4}px) rotate(${((v * 37 + i * 101) % 23) - 11}deg)`; cont.appendChild(img) })
  const n = document.createElement('b'); n.textContent = fmt(importo); cont.appendChild(n)
}

// prima di puntare o togliere si guarda l'orologio vero (col movimento ridotto il ciclo passa solo ogni mezzo secondo)
function allOra() { const f = fase(); if (f.indice !== corrente.indice || f.fase !== corrente.fase) aggiorna() }
function punta(id) {
  allOra()
  if (corrente.fase !== 'scommesse') { voce('la partita è in corso: si punta sulla prossima'); return }
  const v = stato.fiche
  const r = SC.punta(P, id, v)
  if (r.ricaricato) voce(`altri ${fmt(pzk.INIZIALE)} $pzk finti: punta`)
  if (!r.ok) {
    aggiornaBanco()
    if (r.motivo === 'secco') voce(pzk.perche())
    else { voce(r.motivo === 'nonbastano' ? pzk.nonBasta() : 'hai finito i $pzk'); scuoti(el.saldo) }
    return
  }
  const b = el.quote.querySelector(`[data-id="${id}"]`)
  vola(v, centro(el.scegli.querySelector(`[data-v="${v}"] img`) ?? el.saldo), centro(b.querySelector('.vi-q-pila')), { alto: 30 }).then(() => { pila(b.querySelector('.vi-q-pila'), diAdesso().filter((x) => x.id === id).reduce((a, x) => a + x.puntata, 0)) })
  suona('virtual-fiche')
  schedina()
  aggiornaBanco()
  const pu = PER_PUNTATA.get(id)
  voce(`${pu.nome} a ${fmtQuota(r.quota)}: se va, ${fmt(Math.round(v * r.quota * 2) / 2)} $pzk`)
}
// «togli»: l'ultima fiche posata su questa partita torna nel saldo
function togli() {
  allOra()
  if (corrente.fase !== 'scommesse') return
  const t = SC.togli(corrente.indice)
  if (!t) return
  const q = el.quote.querySelector(`[data-id="${t.id}"] .vi-q-pila`)
  vola(t.v, centro(q), centro(el.scegli.querySelector(`[data-v="${t.v}"] img`) ?? el.saldo), { durata: 300, alto: 24 })
  quote(); schedina(); aggiornaBanco()
}
// «rifai»: le puntate dell'ultima partita sulla partita di adesso (alle quote di adesso)
async function rifai() {
  if (corrente.fase !== 'scommesse' || !stato.ultime?.length || sulTavolo()) return
  const tot = stato.ultime.reduce((a, b) => a + b.puntata, 0)
  if (tot > pzk.saldo()) { voce(`per rifare servono ${fmt(tot)} $pzk`); scuoti(el.saldo); return }
  const prima = stato.fiche
  for (const u of stato.ultime) for (const v of pzk.inFiches(u.puntata)) { stato.fiche = v; punta(u.id); await new Promise((r) => setTimeout(r, RIDOTTO.matches ? 0 : 70)) }
  stato.fiche = prima
  aggiornaBanco()
}

// ── la schedina ──────────────────────────────────────────────────────────────
function schedina() {
  const mie = [...stato.schedina].reverse().slice(0, 12)
  if (!mie.length) { el.schedina.innerHTML = '<li class="vuota">la schedina è vuota: tocca una quota</li>'; return }
  el.schedina.innerHTML = mie.map((b) => {
    const pu = PER_PUNTATA.get(b.id), diQuesta = b.indice === corrente.indice
    const vinc = SC.vincitaDi(b)
    const esito = b.pagata ? (b.esito === 'vinta' ? `<b class="vinta">+${fmt(vinc)}</b>` : `<b class="persa">persa</b>`) : diQuesta && corrente.fase === 'partita' ? '<b class="corso">in corso</b>' : `<b class="attesa">→ ${fmt(vinc)}</b>`
    return `<li class="${b.pagata ? b.esito : diQuesta ? 'aperta' : ''}"><span class="vi-s-partita">${esc(b.casa)}–${esc(b.ospite)}${b.risultato ? ` <i>${esc(b.risultato)}</i>` : ''}</span><span class="vi-s-cosa">${esc(pu.nome)} <small>@ ${fmtQuota(b.quota)}</small></span><span class="vi-s-punt">${fmt(b.puntata)}</span>${esito}</li>`
  }).join('')
}

// ── il banco ─────────────────────────────────────────────────────────────────
function aggiornaBanco() {
  if (!el.saldo) return
  el.saldo.textContent = `$pzk ${fmt(pzk.saldo())}`
  const p = pzk.sulTavolo(GIOCO)
  el.puntato.textContent = p ? `sulla partita: ${fmt(p)}` : ''
  const aperte = corrente.fase === 'scommesse'
  for (const b of el.scegli.children) { b.setAttribute('aria-pressed', String(Number(b.dataset.v) === stato.fiche)); b.disabled = !aperte }
  el.togli.disabled = !aperte || !diAdesso().length
  el.rifai.disabled = !aperte || !stato.ultime?.length || !!sulTavolo()
  el.statoT.textContent = aperte ? 'scommesse aperte' : 'scommesse chiuse: si gioca'
  dlg.classList.toggle('chiuso', !aperte)
}
function scuoti(e) { if (!RIDOTTO.matches) e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 }) }
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
// l'ingrandimento del foglio sullo schermo (sul computer grande del 20 %: CSS, scale sul foglio); sul telefono 1
const zoom = () => { const d = dlg.querySelector('.vi-dentro'), r = d?.getBoundingClientRect(); return r ? r.width / (d.offsetWidth || r.width) || 1 : 1 }
/** Una fiche che vola da a a b (coordinate della finestra), con l'arco e l'ombra, come negli altri giochi. */
function vola(v, a, b, { durata = 380, alto = 40, svanisce = false } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  const img = document.createElement('img')
  img.className = 'vi-volo'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  dlg.appendChild(img)
  const z = zoom(), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - alto * z
  const anim = img.animate([
    { transform: `translate(${a.x}px, ${a.y}px) scale(${z})`, opacity: 1 },
    { offset: 0.5, transform: `translate(${mx}px, ${my}px) scale(${1.3 * z})`, opacity: 1 },
    { transform: `translate(${b.x}px, ${b.y}px) scale(${z})`, opacity: svanisce ? 0 : 1 },
  ], { duration: durata, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' })
  return anim.finished.then(() => img.remove(), () => img.remove())
}

// ── il disegno dello schermino e del tabellone, a ogni fotogramma ───────────
let ultimoEvento = null
function disegna(forza = false, dt = 1 / 60) {
  if (!schermo || !P) return
  const f = corrente
  const now = Date.now()
  let t, fs
  if (f.fase === 'partita') { t = (now - P.inizio) / 1000; fs = 'partita' }
  else { t = -(f.manca / 1000); fs = 'scommesse' }
  schermo.disegna(P, { fase: fs, t, ridotto: RIDOTTO.matches, dt })
  tabelloneVivo(t)
  // i suoni degli eventi (una volta per evento), e la voce
  const e = schermo.evento
  if (e !== ultimoEvento) {
    ultimoEvento = e
    if (e && f.fase === 'partita') {
      if (e.tipo === 'gol') { suona('virtual-gol'); voce(`GOL! ${e.chi.nome} (${P[e.squadra].nome}) al ${e.minuto}`) }
      else if (e.tipo === 'tiro' && e.esito === 'palo') { suona('virtual-palo'); voce(`palo di ${P[e.squadra].sigla} al ${e.minuto}!`) }
      else if (e.tipo === 'rigore') voce(`rigore per ${P[e.squadra].nome}: ${e.esito}`)
      else if (e.tipo === 'rosso') voce(`espulso ${e.chi.nome}: ${P[e.squadra].nome} in quattro`)
      else if (e.tipo === 'giallo') voce(`ammonito ${e.chi.nome} (${P[e.squadra].sigla})`)
      else if (e.tipo === 'infortunio') voce(`${e.chi.nome} esce in barella, entra ${e.entra.nome}`)
      else if (e.tipo === 'sospesa') voce(`partita sospesa: ${e.causa}. ${scriviRisultato(P.risultato)}`)
      else if (e.tipo === 'intervallo') { suona('virtual-fischio'); voce('intervallo') }
      else if (e.tipo === 'fine') { suona('virtual-fischio'); voce(`finale: ${scriviRisultato(P.risultato)}`) }
    }
  }
}
