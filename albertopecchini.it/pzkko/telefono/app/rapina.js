// L'app Rapina (26.10, Alberto: «modalità rapina con rischio prigione, minimo in due, contro pzk»): il colpo alla cassa di pzk
// (api/wallet.mjs, colpo). Chi organizza apre il colpo e ha un codice di quattro lettere da dare ai complici; i complici
// entrano col codice (al più quattro); chi ha organizzato dà il via. Va a segno nel 32 % dei casi in due, 40 % in tre, 48 % in
// quattro; il bottino (il 3 % della cassa più l'1 % a testa, al più 15.000 a testa) è SPORCO: si vede nel saldo ma con pzk
// non si spende (la lavatrice lo pulisce, o 96 giorni). Se va male: sei ore di galera e una multa (il 20 % dei puliti, al più
// 5.000). Un colpo al giorno, col conto di almeno 48 ore. Mentre un colpo è aperto l'app chiede lo stato ogni tre secondi.
// In galera l'app è la cella: quanto manca, e la cauzione (3.000 $pzk puliti) per uscire prima.

import * as pzk from '../../games/pzk.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const resta = (t) => { const m = Math.max(0, Math.ceil((t - Date.now()) / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min` }
const p = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
const PROB = { 2: 32, 3: 40, 4: 48 }

let host = null, ctx = null, S = { colpo: null, cassa: null, errore: null, codice: '' }, giro = 0

function telaio(corpo) { host.innerHTML = `${ctx.testata('Rapina', pzk.conto() ? `<span class="t-sh-piede" style="margin:0">cassa di pzk ${S.cassa != null ? pzk.fmtCorto(S.cassa) : '…'}</span>` : '')}<div class="t-corpo-app t-ra">${S.errore ? `<p class="t-ac-esito male">${esc(S.errore)}</p>` : ''}${corpo}</div>` }

function disegna() {
  if (!pzk.conto()) return telaio(`<div class="t-ac-fuori">${icona('lucchettone')}<p>i colpi si fanno col conto: la galera si sconta lì.</p><button class="c-b" type="button" data-vai="account">crea il conto</button></div>`)
  if (pzk.inGalera()) return telaio(`<div class="t-ra-cella"><div class="t-ra-sbarre"></div>${icona('bot-triste', 't-ra-dentro')}<b>sei in galera</b><span>fuori alle ${ora(pzk.galera())} · fra ${resta(pzk.galera())}</span></div>
    <p class="t-ac-nota">niente lavoro, niente giochi, niente colpi. Si esce prima con la <b>cauzione</b>: 3.000 $pzk puliti, alla cassa di pzk.</p>
    <div class="t-ac-azioni"><button class="c-b rosso" type="button" data-fai="cauzione">paga la cauzione (3.000)</button></div>`)
  const k = S.colpo
  if (k?.stato === 'fatto' && k.io) {
    const e = k.esito ?? {}
    return telaio(`<div class="t-ra-esito ${e.ok ? 'ok' : 'no'}">${icona(e.ok ? 'sacco' : 'sirena')}<b>${e.ok ? 'colpo riuscito' : 'presi'}</b>
      <span>${e.ok ? `${p(e.quota)} a testa · ${p(e.bottino)} in tutto` : `${e.ore} ore di galera e la multa`}</span></div>
      <p class="t-ac-nota">${e.ok ? 'sono <b>soldi sporchi</b>: si vedono nel saldo ma con pzk non si spendono (né giochi né shop), non si mandano. Lavali nella <b>lavatrice</b> (fino a 50.000 in 10 minuti, 2.000 puliti) o aspetta 96 giorni.' : 'la cassa di pzk ha chiamato i carabinieri. La prossima volta, più complici.'}</p>
      <div class="t-ac-azioni">${e.ok ? '<button class="c-b" type="button" data-vai="lavatrice">alla lavatrice</button>' : ''}<button class="c-b nero" type="button" data-fai="nuovo">va bene</button></div>`)
  }
  if (k?.stato === 'aperto' && k.io) {
    const n = k.membri.length
    return telaio(`<div class="t-ra-codice"><small>il codice del colpo: dallo ai complici</small><b>${k.codice}</b><span>scade alle ${ora(k.scade)}</span></div>
      <h4 class="t-sh-sez">la banda · ${n}/4 · riuscita ${PROB[Math.max(2, n)]} %</h4>
      <ul class="t-ra-banda">${k.membri.map((m, i) => `<li>${icona(i ? 'bot-occhiolino' : 'bot-ricco')}<b>${esc(m.nome)}</b><small>${esc(m.ind)}${i ? '' : ' · organizza'}</small></li>`).join('')}${n < 2 ? '<li class="manca">serve almeno un complice…</li>' : ''}</ul>
      <div class="t-ac-azioni">${k.capo ? `<button class="c-b rosso" type="button" data-fai="vai"${n < 2 ? ' disabled' : ''}>via! (${PROB[Math.max(2, n)]} %)</button>` : '<span class="t-ac-nota">aspetta il via di chi ha organizzato…</span>'}<button class="c-b nero" type="button" data-fai="esci">esci dal colpo</button></div>`)
  }
  const ultimo = pzk.conto().colpo ?? 0, domani = ultimo + 864e5
  return telaio(`<div class="t-ra-cassa">${icona('lucchettone')}<div><b>la cassa di pzk</b><span>${S.cassa != null ? p(S.cassa) : '…'}</span><small>dentro ci sono le puntate perse, gli acquisti, le multe: i soldi dei giocatori</small></div></div>
    ${domani > Date.now() ? `<p class="t-ac-esito male">un colpo al giorno: il prossimo dalle ${ora(domani)}</p>` : ''}
    <div class="t-ra-scelta">
      <button class="c-b rosso" type="button" data-fai="apri">organizza un colpo</button>
      <form class="t-ra-entra"><input name="codice" maxlength="4" autocomplete="off" placeholder="ABCD" value="${esc(S.codice)}" aria-label="il codice del colpo"><button class="c-b" type="submit">entra</button></form>
    </div>
    <h4 class="t-sh-sez">come funziona</h4>
    <table class="t-ra-regole"><tr><th>banda</th><th>riuscita</th><th>bottino a testa</th></tr>${[2, 3, 4].map((n) => `<tr><td>${n}</td><td>${PROB[n]} %</td><td>${S.cassa != null ? p(Math.min((S.cassa * (0.03 + 0.01 * n)) / n, 15000)) : '…'}</td></tr>`).join('')}</table>
    <p class="t-ac-nota">⚠ se va male: <b>6 ore di galera</b> e una multa (il 20 % dei soldi puliti, al più 5.000). Il bottino è sporco. Un colpo al giorno; il conto deve avere 48 ore.</p>`)
}

async function stato() {
  if (!pzk.conto()) return
  const mio = ++giro, d = await pzk.colpo('stato')
  if (mio !== giro || !d?.ok) return
  S.colpo = d.colpo; S.cassa = d.cassa
  if (!host.hidden) disegna()
}
let timer = 0
const sveglia = () => { clearInterval(timer); timer = setInterval(() => { if (!host.hidden && (S.colpo?.stato === 'aperto' || pzk.inGalera())) stato() }, 3000) }

async function fai(cosa, extra = '') {
  S.errore = null
  if (cosa === 'nuovo') { S.colpo = null; return stato() }
  if (cosa === 'cauzione') { const d = await pzk.cauzione(); if (!d.ok) S.errore = d.errore; else ctx.toast('fuori: cauzione pagata', { icona: 'lucchettone' }); return disegna() }
  if (cosa === 'vai' && !confirm('si va? se va male sono sei ore di galera per tutti.')) return
  const d = await pzk.colpo(cosa, extra)
  if (!d.ok) S.errore = d.errore
  if ('colpo' in d) S.colpo = d.colpo
  if (cosa === 'vai' && d.colpo?.esito) ctx.toast(d.colpo.esito.ok ? `colpo riuscito: +${pzk.fmt(d.colpo.esito.quota)} sporchi` : 'presi: galera', { icona: d.colpo.esito.ok ? 'sacco' : 'sirena' })
  await stato()
  disegna()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'rapina')
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fai]'), v = e.target.closest('[data-vai]')
    if (b && !b.disabled) fai(b.dataset.fai)
    if (v) ctx.vai(v.dataset.vai)
  })
  host.addEventListener('submit', (e) => { e.preventDefault(); const c = e.target.codice?.value.toUpperCase().replace(/[^A-Z]/g, ''); S.codice = c; if (c?.length === 4) fai('entra', c); else { S.errore = 'il codice è di quattro lettere'; disegna() } })
  pzk.osserva(() => { if (!host.hidden && !host.contains(document.activeElement?.closest('form'))) disegna() })
  disegna()
  return { mostra: () => { disegna(); stato(); sveglia() }, nascondi: () => clearInterval(timer) }
}
