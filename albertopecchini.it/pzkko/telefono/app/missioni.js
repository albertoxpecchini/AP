// L'app Quest (23.10): le side quest (chat/missioni.js, missioni-dati.js) come un libro a bivi. L'elenco mostra ogni missione
// con il suo stato (pronta, in corso, finita, bloccata: cosa manca, col tasto per andarlo a comprare nello shop); la storia è
// una pagina alla volta, il testo che si scrive, le scelte grandi (col costo, il rischio, o l'oggetto che manca), e alla fine
// il premio. Le regole e lo stato sono quelli della chat («missioni», «quest»): si può cominciare qui e finire là.

import * as missioni from '../../chat/missioni.js'
import { PER_ID as OGGETTI, nomeDi } from '../../chat/testi.js'
import { icona } from '../../chat/icone.js'
import { fmt } from '../../games/pzk.js'

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const STATI = { pronta: ['da fare', 'verde'], 'in corso': ['in corso', 'ambra'], fatta: ['finita', 'grigio'], bloccata: ['bloccata', 'rosso'] }
let host = null, ctx = null, aperta = null, scrittura = 0

const premio = (p) => `<span class="pzk">+${fmt(p.pzk)} $pzk</span> · +${p.xp} xp${p.oggetto ? ` · ${icona(p.oggetto)} ${esc(nomeDi(p.oggetto))}` : ''}`

function elenco() {
  aperta = null
  const el = missioni.elenco()
  host.innerHTML = `${ctx.testata('Quest')}
    <div class="t-corpo-app t-mi">
      <p class="t-mi-intro">Storie brevi a bivi, di Mantova e del muro. Ognuna si fa una volta e paga. Finite: <b>${el.filter((m) => m.stato === 'fatta').length} di ${el.length}</b>.</p>
      ${el.map((m) => {
        const [st, col] = STATI[m.stato]
        const servono = (m.richiede ?? []).filter((o) => !m.manca.includes(nomeDi(o)) ? false : true)
        return `<article class="t-mi-c ${m.stato.replace(' ', '-')}" ${m.stato === 'bloccata' ? '' : `data-apri="${m.id}" role="button" tabindex="0"`}>
          <div class="t-mi-ico">${icona(m.icona)}${m.stato === 'bloccata' ? `<i>${icona('lucchetto')}</i>` : m.stato === 'fatta' ? `<i>${icona('si')}</i>` : ''}</div>
          <div class="t-mi-txt"><span class="t-mi-st ${col}">${st}</span><h3>${esc(m.nome)}</h3><p>${esc(m.breve)}</p><small>${premio(m.premio)}</small>
            ${m.stato === 'bloccata' ? `<div class="t-mi-manca">ti manca: ${esc(m.manca.join(', '))}${servono.map((o) => OGGETTI[o]?.prezzo ? ` <button class="t-mi-compra" type="button" data-compra="${o}">${icona(o)} compra</button>` : '').join('')}</div>` : ''}
          </div>
        </article>`
      }).join('')}
    </div>`
}

function pagina(id, esito = null) {
  aperta = id
  const v = missioni.vista(id)
  const m = v.m
  const avviso = esito ? [esito.speso ? `hai pagato ${esito.speso} $pzk` : '', esito.perso ? `hai perso ${esito.perso} $pzk` : '', esito.consumato ? `hai usato ${nomeDi(esito.consumato)}` : '', esito.caso === 'ko' ? 'non è andata bene…' : esito.caso === 'ok' ? 'è andata!' : ''].filter(Boolean) : []
  host.innerHTML = `${ctx.testata(esc(m.nome), v.fatta ? '' : `<button class="t-mi-lascia" type="button" data-lascia>lascia</button>`)}
    <div class="t-corpo-app t-mi t-mi-storia">
      <div class="t-mi-eroe">${icona(m.icona)}<span>${v.fatta ? 'fine' : `passo ${v.passi + 1}`}</span></div>
      ${avviso.length ? `<div class="t-mi-avviso ${esito.caso === 'ko' || esito.perso ? 'male' : ''}">${avviso.map(esc).join(' · ')}</div>` : ''}
      <p class="t-mi-testo" data-testo></p>
      ${v.fatta ? `<div class="t-mi-premio">${icona('regalo')}<div><small>${esito?.premio ? 'il premio' : 'già fatta'}</small><b>${premio(esito?.premio ?? m.premio)}</b></div></div><button class="c-b t-mi-fine" type="button" data-elenco>alle altre quest</button>` : `
      <div class="t-mi-scelte" hidden>${v.scelte.map((s) => `<button type="button" class="t-mi-s${s.ok ? '' : ' no'}" data-scelta="${s.i}" ${s.ok ? '' : 'aria-disabled="true"'}><span>${esc(s.eti)}</span>${s.costo ? `<em>${s.costo} $pzk</em>` : ''}${s.azzardo ? `<em class="rischio">${s.azzardo} % che vada bene</em>` : ''}${s.ok ? '' : `<em class="manca">${esc(s.motivo)}</em>`}</button>`).join('')}</div>`}
    </div>`
  scrivi(host.querySelector('[data-testo]'), v.t, () => { const s = host.querySelector('.t-mi-scelte'); if (s) s.hidden = false })
}

/** Il testo della pagina che si scrive da solo, in un secondo (come i messaggi del bot); un tocco lo finisce subito. */
function scrivi(el, testo, poi) {
  clearInterval(scrittura)
  const t0 = performance.now(), n = testo.length
  const passo = () => {
    const k = Math.min(1, (performance.now() - t0) / 1000)
    el.textContent = testo.slice(0, Math.round(n * k))
    if (k >= 1) { clearInterval(scrittura); el.textContent = testo; poi?.() }
  }
  el.onclick = () => { clearInterval(scrittura); el.textContent = testo; poi?.() }
  scrittura = setInterval(passo, 30)
  passo()
}

function clic(e) {
  const c = e.target.closest('[data-compra]')
  if (c) { e.stopPropagation(); return ctx.vai('negozio') }
  const a = e.target.closest('[data-apri]')
  if (a) {
    const r = missioni.inizia(a.dataset.apri)
    if (!r.ok) return ctx.toast(esc(r.errore), { icona: 'bot-pensa' })
    return pagina(a.dataset.apri)
  }
  const s = e.target.closest('[data-scelta]')
  if (s && aperta) {
    const r = missioni.scegli(aperta, Number(s.dataset.scelta))
    if (!r.ok) return ctx.toast(esc(r.errore), { icona: 'bot-pensa' })
    if (r.esito.fine) ctx.toast(`quest finita: ${premio(r.esito.premio)}`, { icona: 'regalo', ms: 4500 })
    if (r.esito.livello) setTimeout(() => ctx.toast(`sei salito al <b>livello ${r.esito.livello}</b>!`, { icona: 'livello' }), 1800)
    return pagina(aperta, r.esito)
  }
  if (e.target.closest('[data-lascia]') && aperta) { missioni.abbandona(aperta); ctx.toast('quest lasciata: puoi ricominciarla da capo', { icona: 'bot-pensa' }); return elenco() }
  if (e.target.closest('[data-elenco]')) return elenco()
}

export function monta(h, c) {
  host = h; ctx = c
  host.addEventListener('click', clic)
  host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click() } })
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && aperta) { e.stopPropagation(); clearInterval(scrittura); elenco() } }, true)
  elenco()
  return { mostra: () => (aperta ? pagina(aperta) : elenco()), nascondi: () => clearInterval(scrittura) }
}
