// L'app Virtual del cercapersone (23.10 sera, Alberto: «il gioco dovrebbe essere anche dentro al cercapersone»): la stessa
// partita del gioco grande (games/virtual/partita.js: il campionato a cicli di cinque minuti, deciso dall'orario) sullo
// stesso schermino a pixel (games/virtual/schermo.js), col tabellone, il conto alla rovescia, le quote 1 X 2 e over/under,
// le fiches, e la schedina. Le scommesse e i pagamenti passano dalla STESSA schedina della finestra grande
// (games/virtual/schedina.js: localStorage pzkko-virtual, il tavolo di games/pzk.js): quello che si punta qui si vede là e
// viceversa, nessun doppione di logica. Il tasto «apri il gioco grande» apre la finestra sopra il muro.
//
// Lo stile è quello delle altre app: l'lcd nero, Fake Receipt, il palco di 760 punti (sul cellulare a tutta finestra, in
// colonna). Lo schermino si disegna solo quando l'app è in primo piano (mostra / nascondi) e la pagina è visibile.

import * as pzk from '../../games/pzk.js'
import { PUNTATE, PER_PUNTATA, fase, partita, minuto, punteggioA, scriviRisultato } from '../../games/virtual/partita.js'
import { stemmaSVG } from '../../games/virtual/squadre.js'
import { Schermo } from '../../games/virtual/schermo.js'
import * as SC from '../../games/virtual/schedina.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt, fmtQuota = SC.fmtQuota
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const suona = (nome, d = {}) => window.pzkkoSuono?.evento(nome, d)
const METEO = { sereno: 'sereno', nuvole: 'nuvoloso', pioggia: 'pioggia', nebbia: 'nebbia', neve: 'neve', vento: 'vento forte' }

let host = null, ctx = null, schermo = null, canvas = null, raf = 0, ultimoT = 0, aperta = false
let corrente = fase(), P = null, ultimoEvento = null, ultimaVoce = ''
let el = {}

// ── il disegno dell'app (si rifà quando cambia la partita o la fase; i numeri vivi si toccano a parte) ──
function disegna() {
  corrente = fase()
  P = partita(corrente.indice)
  const aperte = corrente.fase === 'scommesse'
  const ordine = [...PUNTATE.filter((p) => p.id.length === 1), ...PUNTATE.filter((p) => p.id[0] === 'O'), ...PUNTATE.filter((p) => p.id[0] === 'U')]
  const fav = P.quote[1] < P.quote[2] ? '1' : '2'
  const quota = (p) => `<button type="button" class="t-vi-q${p.id.length === 1 ? ' esito' : ''}${p.id === fav ? ' fav' : ''}" data-q="${p.id}" ${aperte ? '' : 'disabled'} title="${esc(p.dice)}"><span>${esc(p.nome)}</span><b>${fmtQuota(P.quote[p.id])}</b><i class="t-vi-pila" hidden></i></button>`
  host.innerHTML = `${ctx.testata('Virtual', `<button class="c-b nero t-vi-grande" type="button" data-grande title="apre la finestra del gioco sopra il muro">gioco grande</button>`)}
    <div class="t-corpo-app t-vi">
      <section class="t-vi-sx">
        <div class="t-vi-schermo"><canvas aria-label="la partita, sullo schermino" role="img"></canvas></div>
        <div class="t-vi-tab">
          <div class="t-vi-sq"><span class="t-vi-st">${stemmaSVG(P.casa)}</span><div><b><span class="lungo">${esc(P.casa.nome)}</span><span class="corto">${P.casa.sigla}</span></b><small>${esc(P.casa.citta)} · ${P.forze.casa}</small><span class="t-vi-cart" data-cart="casa"></span></div></div>
          <div class="t-vi-centro"><b class="t-vi-punti">–</b><small class="t-vi-min">scommesse aperte</small><em class="t-vi-conto"></em></div>
          <div class="t-vi-sq ospite"><div><b><span class="lungo">${esc(P.ospite.nome)}</span><span class="corto">${P.ospite.sigla}</span></b><small>${esc(P.ospite.citta)} · ${P.forze.ospite}</small><span class="t-vi-cart" data-cart="ospite"></span></div><span class="t-vi-st">${stemmaSVG(P.ospite)}</span></div>
        </div>
        <p class="t-vi-voce" aria-live="polite">${esc(ultimaVoce || `a ${P.casa.citta}: ${METEO[P.meteo.tipo]}, ${P.meteo.temp}°`)}</p>
      </section>
      <section class="t-vi-dx">
        <div class="t-vi-quote">
          <div class="t-vi-esiti">${ordine.filter((p) => p.id.length === 1).map(quota).join('')}</div>
          <small class="t-vi-eti">gol in tutto</small>
          <div class="t-vi-ou">${ordine.filter((p) => p.id.length > 1).map(quota).join('')}</div>
        </div>
        <div class="t-vi-banco">
          <div class="t-vi-saldo"><small>hai</small><b class="pzk">${pzk.fmtCorto(pzk.saldo())} $pzk</b><small class="t-vi-sul"></small></div>
          <div class="t-vi-fiches" role="group" aria-label="scegli la fiche">${pzk.FICHES.map((v) => `<button type="button" data-f="${v}" aria-pressed="${v === SC.S.fiche}" ${aperte ? '' : 'disabled'} aria-label="fiche da ${v}"><img src="/art/fiches/f${v}.webp" alt="" width="170" height="174"></button>`).join('')}</div>
          <button class="c-b nero t-vi-togli" type="button" data-togli ${aperte ? '' : 'disabled'}>togli</button>
        </div>
        <ol class="t-vi-sched" aria-label="la schedina"></ol>
        <p class="t-vi-nota">le quote copiano la Serie A vera, i risultati no. soldi finti.</p>
      </section>
    </div>`
  const q = (s) => host.querySelector(s)
  el = { box: q('.t-vi-schermo'), punti: q('.t-vi-punti'), min: q('.t-vi-min'), conto: q('.t-vi-conto'), voce: q('.t-vi-voce'), saldo: q('.t-vi-saldo b'), sul: q('.t-vi-sul'), sched: q('.t-vi-sched') }
  canvas = q('canvas')
  schermo = new Schermo(canvas)
  ultimiPunti = ''; ultimoMin = ''
  pile(); schedina(); banco(); misura()
}
function voce(t) { ultimaVoce = t; if (el.voce) el.voce.textContent = t }
function misura() { if (schermo && el.box?.clientWidth) schermo.misura(el.box.clientWidth, el.box.clientHeight) }

// le fiches sulle quote: quanto c'è su ognuna
function pile() {
  for (const b of host.querySelectorAll('.t-vi-q')) {
    const mie = SC.diPartita(corrente.indice).filter((x) => x.id === b.dataset.q && !x.pagata).reduce((a, x) => a + x.puntata, 0)
    const p = b.querySelector('.t-vi-pila')
    p.hidden = !mie
    p.textContent = mie ? fmt(mie) : ''
  }
}
function banco() {
  if (!el.saldo) return
  el.saldo.textContent = `${pzk.fmtCorto(pzk.saldo())} $pzk` // (il riquadro è stretto: i numeri corti, games/pzk.js)
  const sul = SC.sulTavolo(corrente.indice)
  el.sul.textContent = sul ? `sulla partita: ${fmt(sul)}` : ''
  for (const b of host.querySelectorAll('[data-f]')) b.setAttribute('aria-pressed', String(Number(b.dataset.f) === SC.S.fiche))
  const t = host.querySelector('[data-togli]'); if (t) t.disabled = corrente.fase !== 'scommesse' || !SC.diPartita(corrente.indice).some((b) => !b.pagata)
}
function schedina() {
  const mie = [...SC.S.schedina].reverse().slice(0, 10)
  if (!mie.length) { el.sched.innerHTML = `<li class="vuota">${icona('bot')}<span>la schedina è vuota: tocca una quota</span></li>`; return }
  el.sched.innerHTML = mie.map((b) => {
    const pu = PER_PUNTATA.get(b.id), diQuesta = b.indice === corrente.indice, vinc = SC.vincitaDi(b)
    const esito = b.pagata ? (b.esito === 'vinta' ? `<b class="vinta">+${fmt(vinc)}</b>` : '<b class="persa">persa</b>') : diQuesta && corrente.fase === 'partita' ? '<b class="corso">in corso</b>' : `<b class="attesa">→ ${fmt(vinc)}</b>`
    return `<li class="${b.pagata ? b.esito : diQuesta ? 'aperta' : ''}"><small>${esc(b.casa)}–${esc(b.ospite)}${b.risultato ? ` <i>${esc(b.risultato)}</i>` : ''}</small><span>${esc(pu.nome)} @ ${fmtQuota(b.quota)} · <em>${fmt(b.puntata)}</em></span>${esito}</li>`
  }).join('')
}

// ── le mosse ──
function allOra() { const f = fase(); if (f.indice !== corrente.indice || f.fase !== corrente.fase) aggiorna() }
function punta(id) {
  allOra()
  if (corrente.fase !== 'scommesse') return ctx.toast('la partita è in corso: si punta sulla prossima', { icona: 'bot-pensa' })
  const v = SC.S.fiche
  const r = SC.punta(P, id, v)
  if (r.ricaricato) ctx.toast(`altri <b class="pzk">${fmt(pzk.INIZIALE)} $pzk</b> finti: punta`, { icona: 'regalo' })
  if (!r.ok) {
    if (r.motivo === 'secco') ctx.toast(esc(pzk.perche()), { icona: 'bot-triste' })
    else ctx.toast(r.motivo === 'nonbastano' ? `non ti bastano: hai <b class="pzk">${fmt(pzk.saldo())} $pzk</b>` : 'hai finito i $pzk', { icona: 'bot-triste' })
    return banco()
  }
  suona('virtual-fiche')
  const pu = PER_PUNTATA.get(id)
  voce(`${pu.nome} a ${fmtQuota(r.quota)}: se va, ${fmt(Math.round(v * r.quota * 2) / 2)} $pzk`)
  pile(); schedina(); banco()
}
function togli() {
  allOra()
  if (corrente.fase !== 'scommesse') return
  const t = SC.togli(corrente.indice)
  if (!t) return
  voce(`tolta la fiche da ${t.v}`)
  pile(); schedina(); banco()
}
function clic(e) {
  const q = e.target.closest('[data-q]'), f = e.target.closest('[data-f]')
  if (q && !q.disabled) return punta(q.dataset.q)
  if (f) { SC.S.fiche = Number(f.dataset.f); return banco() }
  if (e.target.closest('[data-togli]')) return togli()
  if (e.target.closest('[data-grande]')) { import('../../games/virtual/virtual.js').then((m) => m.apri()); return }
}

// ── il ciclo: la fase, il pagamento, lo schermino ──
function aggiorna() {
  const prima = corrente
  corrente = fase()
  if (prima.indice !== corrente.indice) {
    const r = SC.paga(prima.indice)
    if (r) {
      const { p, torna, risultato } = r
      ctx.toast(torna > 0 ? `${esc(p.casa.sigla)}–${esc(p.ospite.sigla)} ${scriviRisultato(risultato)}: <b class="pzk">+${fmt(torna)} $pzk</b>` : `${esc(p.casa.sigla)}–${esc(p.ospite.sigla)} ${scriviRisultato(risultato)}: niente, stavolta`, { icona: torna > 0 ? 'bot-ricco' : 'bot-triste', ms: 4500 })
      if (torna > 0) suona('virtual-vinta')
      SC.viste()
    } else SC.pagaScadute()
    ultimaVoce = ''
  } else if (prima.fase !== corrente.fase && corrente.fase === 'partita') { suona('virtual-fischio'); ultimaVoce = '' }
  disegna()
}
let ultimiPunti = '', ultimoMin = ''
function vivo(t) {
  if (!el.punti) return
  if (corrente.fase === 'partita') {
    const pt = punteggioA(P, Math.max(0, t)), sospesa = P.eventi.find((e) => e.tipo === 'sospesa' && e.t <= t)
    const punti = sospesa ? `${P.risultato.casa} – ${P.risultato.ospite}` : `${pt.casa} – ${pt.ospite}`, mn = sospesa ? 'sospesa' : minuto(t).scritta
    if (punti !== ultimiPunti) { el.punti.textContent = punti; ultimiPunti = punti }
    if (mn !== ultimoMin) { el.min.textContent = mn === 'INT' ? 'intervallo' : mn === 'FINE' ? 'finale' : mn; ultimoMin = mn }
    el.conto.textContent = `in diretta · ${Math.ceil(corrente.manca / 1000)}s`
    const c = schermo.cartelliniA(P, t)
    for (const sq of ['casa', 'ospite']) host.querySelector(`[data-cart="${sq}"]`).innerHTML = '<i class="g"></i>'.repeat(c.gialli[sq]) + '<i class="r"></i>'.repeat(c.rossi[sq])
  } else {
    const s = Math.ceil(corrente.manca / 1000)
    el.conto.textContent = `si chiude tra ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
}
function ciclo(now) {
  raf = 0
  if (!aperta || host.hidden || document.hidden) return
  const f = fase()
  if (f.indice !== corrente.indice || f.fase !== corrente.fase) aggiorna()
  else corrente = f
  let t, fs
  if (corrente.fase === 'partita') { t = (Date.now() - P.inizio) / 1000; fs = 'partita' } else { t = -(corrente.manca / 1000); fs = 'scommesse' }
  schermo.disegna(P, { fase: fs, t, ridotto: RIDOTTO.matches, dt: (now - ultimoT) / 1000 })
  ultimoT = now
  vivo(t)
  const e = schermo.evento
  if (e !== ultimoEvento) {
    ultimoEvento = e
    if (e && corrente.fase === 'partita') {
      if (e.tipo === 'gol') { suona('virtual-gol'); voce(`GOL! ${e.chi.nome} (${P[e.squadra].nome}) al ${e.minuto}`) }
      else if (e.tipo === 'tiro' && e.esito === 'palo') { suona('virtual-palo'); voce(`palo di ${P[e.squadra].sigla} al ${e.minuto}!`) }
      else if (e.tipo === 'rigore') voce(`rigore per ${P[e.squadra].nome}: ${e.esito}`)
      else if (e.tipo === 'rosso') voce(`espulso ${e.chi.nome}: ${P[e.squadra].nome} in quattro`)
      else if (e.tipo === 'giallo') voce(`ammonito ${e.chi.nome} (${P[e.squadra].sigla})`)
      else if (e.tipo === 'infortunio') voce(`${e.chi.nome} esce in barella, entra ${e.entra.nome}`)
      else if (e.tipo === 'sospesa') voce(`sospesa: ${e.causa}. ${scriviRisultato(P.risultato)}`)
      else if (e.tipo === 'intervallo') { suona('virtual-fischio'); voce('intervallo') }
      else if (e.tipo === 'fine') { suona('virtual-fischio'); voce(`finale: ${scriviRisultato(P.risultato)}`) }
    }
  }
  if (RIDOTTO.matches) setTimeout(sveglia, 500)
  else raf = requestAnimationFrame(ciclo)
}
function sveglia() { if (!raf && aperta && !host.hidden) { ultimoT = performance.now(); raf = requestAnimationFrame(ciclo) } }

export function monta(h, c) {
  host = h; ctx = c
  SC.avvia()
  host.addEventListener('click', clic)
  SC.ascolta(() => { if (!host.hidden && el.sched) { pile(); schedina(); banco() } })
  pzk.ascolta(() => { if (!host.hidden) banco() })
  new ResizeObserver(() => { if (!host.hidden) misura() }).observe(host)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sveglia() })
  disegna()
  tieni(host, 'virtual') // la schedina resta dov'era quando si ridisegna (telefono/ricordi.js)
  return {
    mostra: () => { aperta = true; aggiorna(); SC.viste(); sveglia() }, // (prima si pagano le partite finite, poi gli esiti sono «visti»: il pallino si spegne)
    nascondi: () => { aperta = false; cancelAnimationFrame(raf); raf = 0 },
  }
}
