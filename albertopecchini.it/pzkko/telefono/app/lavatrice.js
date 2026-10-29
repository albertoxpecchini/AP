// L'app Lavatrice (26.10, Alberto: «una lavatrice di denaro che ti permette in solo 10 minuti di pulire fino a 50000 pzk: costa
// 2000 pzk puliti»): i soldi sporchi (il bottino delle rapine: api/_economia.mjs) diventano puliti. Si sceglie quanto (al più
// 50.000, al più quelli che si hanno), si paga la commissione alla cassa di pzk e dopo dieci minuti sono puliti
// (api/wallet.mjs, lava; il server li pulisce alla prima richiesta dopo la fine). Una lavatrice alla volta. Senza lavarli, i
// soldi sporchi si puliscono da soli dopo 96 giorni.
//
// DAL 29.10 SI COMPRA NEL PZKSTORE (telefono/app/pzkstore.js: 5.000 $pzk puliti, una volta; in chat «installa lavatrice»):
// non è più nella home di tutti. Chi quel giorno aveva soldi sporchi, un lavaggio in corso o l'aveva già usata se la tiene,
// regalata (telefono.js, lavatrice).
//
// RIFATTA IL 29.10 (Alberto: «migliora app lavatrice»), perché si capisca tutto senza chiedere:
// - i numeri in cima: gli sporchi (e quando i primi si puliscono da soli), i puliti, la commissione;
// - quanto lavare: di serie il massimo, perché la commissione è fissa (2.000 sia per 3.000 sia per 50.000): il cursore
//   serve solo per lavarne meno. Sotto, come sarai dopo: sporchi e puliti prima e dopo, quanto si perde di commissione in
//   percentuale, quanti lavaggi servono ancora se sono più di 50.000, l'avviso se si lava meno della commissione;
// - il lavaggio in corso: quanti, l'ora in cui sono pronti, il conto alla rovescia e la barra. Si muovono solo loro, una
//   volta al secondo: il cestello che girava non c'è più (Alberto non vuole cose che si muovono da sole);
// - pronti: «ritira» (se non ritiri, si puliscono la prossima volta che il conto parla col server);
// - la storia: le rapine, le commissioni e i lavaggi fra le ultime mosse del conto;
// - la galera: la lavatrice non parte (il server dice di no), quello che gira finisce lo stesso.
// Sullo schermo largo del cercapersone la macchina sta a sinistra e i conti a destra; sul cellulare in colonna.

import * as pzk from '../../games/pzk.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const p = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
// le regole del server (LAVA in api/_economia.mjs: il browser non la può importare)
const MAX = 50000, COSTO = 2000, DURATA = 10 * 60_000
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const quando = (t) => new Date(t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const pct = (a, b) => `${(Math.round((1000 * a) / b) / 10).toLocaleString('it-IT')} %`

let host = null, ctx = null, errore = null, quanto = null, timer = 0

// ── i pezzi ──
/** La macchina: ferma (niente cestello che gira), col display del pannello e le banconote dentro quando c'è un lavaggio. */
function macchina(lav, gira, pronto, scritta) {
  return `<div class="t-la-macchina"><div class="t-la-pannello"><i></i><i></i><b data-conto>${gira ? mmss(lav.fino - Date.now()) : scritta}</b></div>
    <div class="t-la-oblo"><div class="t-la-cestello">${gira || pronto ? Array.from({ length: 6 }, (_, i) => `<img src="/art/chat-stati/banconota.webp" alt="" style="--a:${i * 60}deg">`).join('') : ''}</div></div></div>`
}
function conti(c, sp, pu) {
  const pulizia = c.pulizia ? `i primi si puliscono da soli il ${new Date(c.pulizia).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short' })}` : 'niente da lavare'
  return `<div class="t-lv-conti">
    <div class="t-ca-r sporchi"><span>sporchi</span><b>${pzk.fmt(sp)}</b><small>${sp > 0 ? pulizia : 'niente da lavare'}</small></div>
    <div class="t-ca-r"><span>puliti</span><b class="pzk">${pzk.fmt(pu)}</b><small>quelli che si spendono</small></div>
    <div class="t-ca-r"><span>commissione</span><b>${pzk.fmt(COSTO)}</b><small>puliti a lavaggio</small></div>
  </div>`
}
/** Accanto al tasto: «al massimo» se se ne lava meno del massimo, se no perché il massimo. */
const massimo = (q, max, sp) => (q < max ? `<button class="t-lv-max" type="button" data-fai="tutti">al massimo: ${pzk.fmt(max)}</button>` : `<span class="t-lv-max-nota">${sp > MAX ? `il massimo di un lavaggio` : 'tutti i tuoi sporchi'}: la commissione è fissa, conviene lavarne il più possibile</span>`)
/** Come sarai dopo un lavaggio di q (la tabellina sotto il cursore). */
function dopo(q, sp, pu) {
  const restano = sp - q, ancora = Math.ceil(restano / MAX)
  return `<table class="t-lv-dopo">
      <tr><th></th><th>adesso</th><th>fra 10 minuti</th></tr>
      <tr><td>sporchi</td><td>${pzk.fmt(sp)}</td><td>${pzk.fmt(restano)}</td></tr>
      <tr><td>puliti</td><td>${pzk.fmt(pu)}</td><td class="piu">${pzk.fmt(pu - COSTO + q)}</td></tr>
    </table>
    <p class="t-ac-nota">${q > COSTO ? `paghi ${p(COSTO)} subito (il ${pct(COSTO, q)} di quello che lavi): ti restano <b>${pzk.fmt(q - COSTO)}</b> puliti in più.` : `paghi ${p(COSTO)} subito per lavarne ${pzk.fmt(q)}.`}${restano > 0 ? ` Ne restano ${pzk.fmt(restano)} sporchi: ${ancora === 1 ? 'un altro lavaggio' : `altri ${ancora} lavaggi`} dopo questo (${pzk.fmt(ancora * COSTO)} puliti di commissione).` : ''}</p>
    ${q <= COSTO ? `<p class="t-ac-esito male">lavi meno della commissione: ci perdi ${pzk.fmt(COSTO - q)} puliti. Conviene lavarne di più, o aspettare che si puliscano da soli.</p>` : ''}`
}
/** Le mosse del conto che parlano di soldi sporchi, dalla più nuova. */
function storia(c) {
  const NOMI = { rapina: ['rapina alla cassa', 'sporchi in più', ''], lavatrice: ['commissione della lavatrice', 'puliti', 'meno'], lavati: ['lavaggio finito', 'ora puliti', 'piu'], puliti: ['puliti dal tempo (96 giorni)', 'ora puliti', 'piu'] }
  const m = (c.mosse ?? []).filter((x) => NOMI[x.tipo]).reverse()
  if (!m.length) return '<p class="t-ac-nota">ancora niente fra le ultime mosse del conto: le rapine, le commissioni e i lavaggi finiscono qui.</p>'
  return `<ul class="t-ac-mosse">${m.map((x) => { const [n, cosa, segno] = NOMI[x.tipo]; return `<li><span>${quando(x.t)} · ${n}</span><b class="${segno}">${segno === 'meno' ? '−' : '+'}${pzk.fmt(x.n)} <small>${cosa}</small></b></li>` }).join('')}</ul>`
}

// ── la vista ──
function vista(c) {
  const sp = pzk.sporchi(), pu = pzk.puliti(), lav = pzk.lavaggio(), gira = !!lav && lav.fino > Date.now(), pronto = !!lav && !gira, dentro = pzk.inGalera()
  const max = Math.min(MAX, sp)
  quanto = Math.max(1, Math.min(quanto ?? max, max))
  let azione
  if (gira) azione = `<div class="t-lv-gira"><b>lavo ${p(lav.n)}</b><span>pronti alle <b>${ora(lav.fino)}</b> · fra <b data-fra>${mmss(lav.fino - Date.now())}</b></span>
      <div class="t-lv-barra"><i data-barra style="width:${Math.min(100, Math.max(0, (100 * (DURATA - (lav.fino - Date.now()))) / DURATA))}%"></i></div></div>
      <p class="t-ac-nota">dieci minuti, poi sono puliti da soli: puoi chiudere il cercapersone. Un lavaggio alla volta: il prossimo quando questo è finito.${dentro ? ' La galera non lo ferma.' : ''}</p>`
  else if (pronto) azione = `<div class="t-lv-gira pronto"><b>${p(lav.n)} lavati</b><span>pronti dalle ${ora(lav.fino)}</span></div>
      <div class="t-ac-azioni"><button class="c-b verde" type="button" data-fai="ritira">ritira ${pzk.fmt(lav.n)} puliti</button></div>
      <p class="t-ac-nota">se non ritiri adesso, si puliscono da soli la prossima volta che usi il conto.</p>`
  else if (sp <= 0) azione = `<div class="t-ac-fuori">${icona('banconota')}<p>niente da lavare. I soldi sporchi vengono dalle <b>rapine</b> alla cassa di pzk: si fanno nell’app rapina, almeno in due.</p><button class="c-b nero" type="button" data-vai="rapina">apri la rapina</button></div>`
  // (il tasto subito sotto il cursore: sullo schermo del cercapersone è la prima cosa che si vede; i conti del dopo sotto)
  else azione = `<h4 class="t-sh-sez">quanto lavare</h4>
      <div class="t-ac-fader"><input type="range" min="1" max="${max}" step="1" value="${quanto}" data-k="quanto" aria-label="quanti sporchi lavare"${dentro ? ' disabled' : ''}><b class="t-ac-pct" data-quanto>${pzk.fmt(quanto)}</b></div>
      <div class="t-ac-azioni t-lv-azioni"><button class="c-b" type="button" data-fai="lava"${pu < COSTO || dentro ? ' disabled' : ''}>lava ${pzk.fmt(quanto)} · paghi ${pzk.fmt(COSTO)}</button><span data-max>${massimo(quanto, max, sp)}</span></div>
      ${dentro ? `<p class="t-ac-esito male">sei in galera fino alle ${ora(pzk.galera())}: la lavatrice non parte. Si esce prima con la cauzione (3.000 puliti) nell’app rapina.</p>`
        : pu < COSTO ? `<p class="t-ac-esito male">la commissione si paga coi puliti: ti mancano ${pzk.fmt(COSTO - pu)}. I puliti vengono dal lavoro, dalle quest, dalle sfide, dai quiz.</p>` : ''}
      <div data-dopo>${dopo(quanto, sp, pu)}</div>`
  return `<div class="t-lv-griglia">
      <div class="t-lv-sx">${macchina(lav, gira, pronto, pronto ? 'fine' : dentro ? 'ferma' : sp > 0 ? 'pronta' : 'vuota')}<p class="t-lv-stato">${gira ? 'sta lavando' : pronto ? 'finito: da ritirare' : dentro ? 'ferma: sei in galera' : sp > 0 ? 'pronta a lavare' : 'vuota'}</p></div>
      <div class="t-lv-dx">
        ${conti(c, sp, pu)}
        ${azione}
        <h4 class="t-sh-sez">la storia</h4>
        ${storia(c)}
        <h4 class="t-sh-sez">le regole</h4>
        <p class="t-ac-nota">al più ${pzk.fmt(MAX)} a lavaggio · dieci minuti · ${pzk.fmt(COSTO)} $pzk puliti di commissione alla cassa di pzk · un lavaggio alla volta · in galera non parte. Senza lavarli, i soldi sporchi si puliscono da soli dopo 96 giorni.</p>
      </div>
    </div>`
}
function disegna() {
  const c = pzk.conto()
  const corpo = !c ? `<div class="t-ac-fuori">${icona('lucchettone')}<p>la lavatrice è per i conti: i soldi sporchi stanno lì.</p><button class="c-b" type="button" data-vai="account">crea il conto</button></div>` : vista(c)
  host.innerHTML = `${ctx.testata('Lavatrice')}<div class="t-corpo-app t-lv">${errore ? `<p class="t-ac-esito male">${esc(errore)}</p>` : ''}${corpo}</div>`
}
/** Il cursore si muove: cambiano solo il numero, la tabellina e il tasto (ridisegnare tutto toglierebbe il cursore di mano). */
function aggiornaForm() {
  const sp = pzk.sporchi(), pu = pzk.puliti()
  const n = host.querySelector('[data-quanto]'), d = host.querySelector('[data-dopo]'), b = host.querySelector('[data-fai="lava"]'), m = host.querySelector('[data-max]')
  if (n) n.textContent = pzk.fmt(quanto)
  if (d) d.innerHTML = dopo(quanto, sp, pu)
  if (m) m.innerHTML = massimo(quanto, Math.min(MAX, sp), sp)
  if (b) b.textContent = `lava ${pzk.fmt(quanto)} · paghi ${pzk.fmt(COSTO)}`
}

async function fai(cosa) {
  errore = null
  if (cosa === 'tutti') { quanto = Math.min(MAX, pzk.sporchi()); return disegna() }
  if (cosa === 'lava') {
    const d = await pzk.lava(quanto)
    if (!d.ok) errore = d.errore
    else { quanto = null; ctx.toast(`in lavatrice: ${pzk.fmt(d.fatto.lavaggio.n)} $pzk, pronti alle ${ora(d.fatto.lavaggio.fino)}`, { icona: 'banconota' }) } // (il prossimo riparte dal massimo)
  }
  if (cosa === 'ritira') { const n = pzk.lavaggio()?.n ?? 0; const d = await pzk.sincronizza(); if (!d.ok) errore = d.errore; else ctx.toast(`lavati: ${pzk.fmt(n)} $pzk ora sono puliti`, { icona: 'si' }) }
  disegna()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'lavatrice')
  host.addEventListener('click', (e) => { const b = e.target.closest('[data-fai]'), v = e.target.closest('[data-vai]'); if (b && !b.disabled) fai(b.dataset.fai); if (v) ctx.vai(v.dataset.vai) })
  host.addEventListener('input', (e) => { if (e.target.dataset.k === 'quanto') { quanto = Number(e.target.value); aggiornaForm() } })
  // (il cursore lasciato: ora si può ridisegnare, e «al massimo» compare o sparisce)
  host.addEventListener('change', (e) => { if (e.target.dataset.k === 'quanto') disegna() })
  pzk.osserva(() => { if (!host.hidden && !host.contains(document.activeElement?.closest('.t-ac-fader'))) disegna() })
  disegna()
  return {
    // il conto alla rovescia: il display del pannello, il «fra» e la barra, una volta al secondo mentre gira; finito, si
    // ridisegna (e si vede «ritira»)
    mostra: () => {
      errore = null
      disegna()
      clearInterval(timer)
      timer = setInterval(() => {
        const l = pzk.lavaggio()
        if (host.hidden || !l) return
        const resta = l.fino - Date.now()
        if (resta <= 0) { if (host.querySelector('[data-fra]')) disegna(); return }
        for (const el of host.querySelectorAll('[data-conto], [data-fra]')) el.textContent = mmss(resta)
        const barra = host.querySelector('[data-barra]')
        if (barra) barra.style.width = `${Math.min(100, (100 * (DURATA - resta)) / DURATA)}%`
      }, 1000)
    },
    nascondi: () => clearInterval(timer),
  }
}
