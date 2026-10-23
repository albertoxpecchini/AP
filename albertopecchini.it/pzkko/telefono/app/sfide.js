// L'app Sfide (23.10): le tre sfide di oggi (chat/sfide.js) in grande. In alto la serie di giorni di fila e il conto alla
// rovescia per le sfide nuove; per ogni sfida la barra, il premio e un tasto: «vai» porta dove la sfida si fa (la chat per
// pescare, lo shop per comprare, il quiz…), «riscuoti» quando è fatta. Sotto, il bonus del giorno quando sono fatte tutte.

import * as zaino from '../../chat/zaino.js'
import * as sfide from '../../chat/sfide.js'
import { icona } from '../../chat/icone.js'
import { fmt } from '../../games/pzk.js'

// dove si fa ogni sfida: [app, comando per la chat]
const DOVE = { pesca: ['chat', 'pesca'], caccia: ['chat', 'caccia'], scava: ['chat', 'scava'], comandi: ['chat', 'aiuto'], guadagna: ['chat', 'lavora'], vinci: ['chat', 'slot 20'], compra: ['negozio'], quiz: ['quiz'], lavora: ['chat', 'lavora'], missione: ['missioni'] }
const COLORI = ['facile', 'media', 'difficile']

let host = null, ctx = null, timer = 0
function aMezzanotte() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(new Date())
  const v = (t) => Number(p.find((x) => x.type === t).value)
  const s = 86400 - ((v('hour') % 24) * 3600 + v('minute') * 60 + v('second'))
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`
}

function disegna() {
  const o = sfide.oggi()
  const fatte = o.sfide.filter((x) => x.riscossa).length
  host.innerHTML = `${ctx.testata('Sfide')}
    <div class="t-corpo-app t-sf">
      <section class="t-sf-testa">
        <div class="t-sf-serie">${icona('fuoco')}<b>${o.serie}</b><small>giorn${o.serie === 1 ? 'o' : 'i'} di fila</small></div>
        <div class="t-sf-oggi"><small>oggi</small><b>${fatte}/3</b><div class="t-pips">${o.sfide.map((x) => `<i class="${x.riscossa ? 'fatta' : x.pronta ? 'pronta' : ''}"></i>`).join('')}</div><small data-conto>nuove fra ${aMezzanotte()}</small></div>
      </section>
      ${o.sfide.map((x) => `<article class="t-sf-c ${COLORI[x.diff]}${x.riscossa ? ' fatta' : x.pronta ? ' pronta' : ''}">
        <div class="t-sf-ico">${icona(x.icona)}</div>
        <div class="t-sf-txt"><span class="t-sf-diff">${x.nome}</span><h3>${x.testo}</h3>
          <div class="c-barra"><i style="width:${Math.round((100 * x.fatto) / x.target)}%"></i></div>
          <div class="t-sf-num"><span>${x.fatto} / ${x.target}</span><span><b class="pzk">+${fmt(x.premio.pzk)} $pzk</b> · +${x.premio.xp} xp</span></div>
        </div>
        ${x.riscossa ? `<span class="t-sf-ok">${icona('si')}</span>` : x.pronta ? `<button class="c-b t-sf-b" type="button" data-riscuoti="${x.id}">riscuoti</button>` : `<button class="c-b nero t-sf-b" type="button" data-vai="${x.id}">vai</button>`}
      </article>`).join('')}
      <section class="t-sf-bonus${o.bonusPronto ? ' pronto' : o.bonusRiscosso ? ' preso' : ''}">
        <div class="t-sf-ico">${icona(o.bonusRiscosso ? 'si' : 'cassa-comune')}</div>
        <div class="t-sf-txt"><span class="t-sf-diff">bonus del giorno</span><h3>${o.bonusRiscosso ? 'preso: a domani' : `${fmt(o.bonusGiorno)} $pzk e una cassa`}</h3><small>${o.bonusRiscosso ? `serie di ${o.serie}` : `fai tutte e tre${o.serie ? ` · domani la serie sale a ${o.serie + 1}` : ''}`}</small></div>
        ${o.bonusPronto ? '<button class="c-b t-sf-b" type="button" data-bonus>prendi</button>' : ''}
      </section>
      <p class="t-sf-nota">Le sfide sono su misura: niente pesca se non hai la canna. Il ${icona('pzkkonet')} pzkkonet dello shop aggiunge il 10 % ai premi.</p>
    </div>`
}

function clic(e) {
  const r = e.target.closest('[data-riscuoti]'), v = e.target.closest('[data-vai]'), b = e.target.closest('[data-bonus]')
  if (r) {
    const x = sfide.riscuoti(r.dataset.riscuoti)
    if (!x.ok) return ctx.toast(x.errore, { icona: 'bot-pensa' })
    ctx.toast(`sfida fatta: <b class="pzk">+${fmt(x.pzk)} $pzk</b> e +${x.xp} xp${x.livello ? ` · livello ${x.livello}!` : ''}`, { icona: 'regalo' })
    return disegna()
  }
  if (b) {
    const x = sfide.riscuotiBonus()
    if (!x.ok) return ctx.toast(x.errore, { icona: 'bot-pensa' })
    ctx.toast(`bonus del giorno: <b class="pzk">+${fmt(x.pzk)} $pzk</b> e una cassa · serie ${x.serie}`, { icona: 'cassa-comune', ms: 4000 })
    return disegna()
  }
  if (v) { const [app, comando] = DOVE[v.dataset.vai] ?? ['chat']; ctx.vai(app, comando ? { comando } : {}) }
}

export function monta(h, c) {
  host = h; ctx = c
  host.addEventListener('click', clic)
  zaino.ascolta(() => { if (!host.hidden) disegna() })
  disegna()
  return {
    mostra: () => { disegna(); clearInterval(timer); timer = setInterval(() => { const el = host.querySelector('[data-conto]'); if (el) el.textContent = `nuove fra ${aMezzanotte()}` }, 30_000) },
    nascondi: () => clearInterval(timer),
  }
}
