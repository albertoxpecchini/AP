// L'app Lavatrice (26.10, Alberto: «una lavatrice di denaro che ti permette in solo 10 minuti di pulire fino a 50000 pzk: costa
// 2000 pzk puliti»): i soldi sporchi (il bottino delle rapine: api/_economia.mjs) diventano puliti. Si sceglie quanto (al più
// 50.000, al più quelli che si hanno), si paga la commissione alla cassa di pzk e il cestello gira dieci minuti (api/wallet.mjs,
// lava); finito, si ritira (il server li pulisce alla prima richiesta dopo). Una lavatrice alla volta. Senza lavarli, i soldi
// sporchi si puliscono da soli dopo 96 giorni.

import * as pzk from '../../games/pzk.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const p = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
const MAX = 50000, COSTO = 2000
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }

let host = null, ctx = null, errore = null, quanto = null, timer = 0

function disegna() {
  const c = pzk.conto()
  const corpo = !c ? `<div class="t-ac-fuori">${icona('lucchettone')}<p>la lavatrice è per i conti: i soldi sporchi stanno lì.</p><button class="c-b" type="button" data-vai="account">crea il conto</button></div>` : vista(c)
  host.innerHTML = `${ctx.testata('Lavatrice')}<div class="t-corpo-app t-la">${errore ? `<p class="t-ac-esito male">${esc(errore)}</p>` : ''}${corpo}</div>`
}
function vista(c) {
  const sp = pzk.sporchi(), pu = pzk.puliti(), lav = pzk.lavaggio(), gira = lav && lav.fino > Date.now(), pronto = lav && !gira
  const max = Math.min(MAX, sp)
  quanto = Math.min(quanto ?? max, max)
  const oblo = `<div class="t-la-macchina${gira ? ' gira' : ''}"><div class="t-la-pannello"><i></i><i></i><b>${gira ? mmss(lav.fino - Date.now()) : pronto ? 'fine' : 'pronta'}</b></div>
    <div class="t-la-oblo"><div class="t-la-cestello">${gira || pronto ? Array.from({ length: 6 }, (_, i) => `<img src="/art/chat-stati/banconota.webp" alt="" style="--a:${i * 60}deg">`).join('') : ''}</div></div></div>`
  return `<div class="t-la-conti"><div class="t-ca-r"><span>puliti</span><b class="pzk">${pzk.fmt(pu)}</b></div><div class="t-ca-r sporchi"><span>sporchi</span><b>${pzk.fmt(sp)}</b><small>${c.pulizia ? `si puliscono da soli il ${new Date(c.pulizia).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}` : ''}</small></div></div>
    ${oblo}
    ${gira ? `<p class="t-ac-nota">lavo ${p(lav.n)}: dieci minuti, e sono puliti.</p>`
      : pronto ? `<div class="t-ac-azioni"><button class="c-b" type="button" data-fai="ritira">ritira ${p(lav.n)} puliti</button></div>`
      : sp <= 0 ? '<p class="t-ac-nota">niente da lavare: i soldi sporchi vengono dalle rapine alla cassa di pzk (l’app rapina).</p>'
      : `<div class="t-ac-fader"><input type="range" min="1" max="${max}" step="1" value="${quanto}" data-k="quanto" aria-label="quanti lavarne"><b class="t-ac-pct">${pzk.fmtCorto(quanto)}</b></div>
        <div class="t-ac-azioni"><button class="c-b" type="button" data-fai="lava"${pu < COSTO ? ' disabled' : ''}>lava ${pzk.fmt(quanto)} · costa ${pzk.fmt(COSTO)} puliti</button><button class="c-b nero" type="button" data-fai="tutti">al massimo</button></div>
        <p class="t-ac-nota">al più ${pzk.fmt(MAX)} per lavaggio, dieci minuti. La commissione (${pzk.fmt(COSTO)} $pzk puliti) va alla cassa di pzk.${pu < COSTO ? ` <b>Ti mancano ${pzk.fmt(COSTO - pu)} puliti.</b>` : ''}</p>`}`
}

async function fai(cosa) {
  errore = null
  if (cosa === 'tutti') { quanto = Math.min(MAX, pzk.sporchi()); return disegna() }
  if (cosa === 'lava') { const d = await pzk.lava(quanto); if (!d.ok) errore = d.errore; else ctx.toast(`in lavatrice: ${pzk.fmt(d.fatto.lavaggio.n)} $pzk`, { icona: 'banconota' }) }
  if (cosa === 'ritira') { const d = await pzk.sincronizza(); if (!d.ok) errore = d.errore; else ctx.toast('lavati: ora sono puliti', { icona: 'si' }) }
  disegna()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'lavatrice')
  host.addEventListener('click', (e) => { const b = e.target.closest('[data-fai]'), v = e.target.closest('[data-vai]'); if (b && !b.disabled) fai(b.dataset.fai); if (v) ctx.vai(v.dataset.vai) })
  host.addEventListener('input', (e) => { if (e.target.dataset.k === 'quanto') { quanto = Number(e.target.value); host.querySelector('.t-ac-pct').textContent = pzk.fmtCorto(quanto); const b = host.querySelector('[data-fai="lava"]'); if (b) b.firstChild.textContent = `lava ${pzk.fmt(quanto)} · costa ${pzk.fmt(COSTO)} puliti` } })
  pzk.osserva(() => { if (!host.hidden && !host.contains(document.activeElement?.closest('.t-ac-fader'))) disegna() })
  disegna()
  return {
    // il timer del cestello: si ridisegna ogni secondo mentre gira (e quando finisce si vede «ritira»)
    mostra: () => { disegna(); clearInterval(timer); timer = setInterval(() => { if (!host.hidden && pzk.lavaggio()) { const b = host.querySelector('.t-la-pannello b'), l = pzk.lavaggio(); if (l.fino > Date.now()) { if (b) b.textContent = mmss(l.fino - Date.now()) } else disegna() } }, 1000) },
    nascondi: () => clearInterval(timer),
  }
}
