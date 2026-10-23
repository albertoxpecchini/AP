// L'app Zaino (23.10): quello che hai (chat/zaino.js), in una griglia. In alto i bonus di adesso e gli effetti in corso col
// tempo che resta; i filtri (da usare, da tenere, attrezzi, casse, da vendere); toccando un pezzo si apre la sua scheda con
// cosa fa e i tasti: «usa» (il cibo e le cose da usare si consumano qui), «apri» o «gratta» (lo fa la chat, che ha le
// animazioni), «vendi» (anche quello in chat, che fa i conti col bonus della vendita), «compra ancora» (lo shop).

import * as zaino from '../../chat/zaino.js'
import { PER_ID, PESCI, ANIMALI, REPERTI, nomeDi } from '../../chat/testi.js'
import { testoBonus } from '../../chat/oggetti.js'
import { icona } from '../../chat/icone.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const VENDIBILI = new Set([...PESCI, ...ANIMALI, ...REPERTI].map((x) => x.id))
const FILTRI = [['tutto', 'tutto'], ['usa', 'da usare'], ['tieni', 'da tenere'], ['attrezzo', 'attrezzi'], ['cassa', 'casse'], ['vendi', 'da vendere']]
const tipoDi = (id) => (VENDIBILI.has(id) ? 'vendi' : PER_ID[id]?.tipo ?? 'tieni')
const resto = (ms) => { const m = Math.ceil(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min` }

let host = null, ctx = null, timer = 0
// il filtro e la cosa aperta si ricordano (telefono/ricordi.js), anche riaprendo la pagina
let { filtro, scelto } = ricordo('zaino', { filtro: 'tutto', scelto: null })

function disegna() {
  const ogg = zaino.oggetti().filter(([id]) => filtro === 'tutto' || tipoDi(id) === filtro)
  const eff = zaino.effetti(), bonus = testoBonus(zaino.bonusTutti())
  const x = scelto && PER_ID[scelto], n = scelto ? zaino.quanti(scelto) : 0
  if (scelto && !n) scelto = null
  ricorda('zaino', { filtro, scelto })
  host.innerHTML = `${ctx.testata('Zaino', `<span class="t-sh-piede" style="margin:0">${zaino.oggetti().reduce((a, [, q]) => a + q, 0)} pezzi</span>`)}
    <div class="t-corpo-app t-za">
      ${bonus || eff.length ? `<div class="t-za-bonus">${eff.map(([id, t]) => `<span class="eff">${icona(id)} ${esc(nomeDi(id))} · ${resto(t - Date.now())}</span>`).join('')}${bonus ? bonus.split(' · ').map((b) => `<span>${b}</span>`).join('') : ''}</div>` : ''}
      <div class="t-za-filtri">${FILTRI.map(([id, nome]) => `<button type="button" class="${filtro === id ? 'on' : ''}" data-filtro="${id}">${nome}</button>`).join('')}</div>
      ${ogg.length ? `<div class="t-za-griglia">${ogg.map(([id, q]) => `<button type="button" class="t-za-p${scelto === id ? ' on' : ''}" data-id="${id}">${icona(id)}<span>${esc(nomeDi(id))}</span>${q > 1 ? `<i>×${q}</i>` : ''}</button>`).join('')}</div>`
        : `<div class="t-vuoto">${icona('zaino')}<p>${filtro === 'tutto' ? 'lo zaino è vuoto: lo shop vende, pesca caccia e scava riempiono.' : 'niente qui.'}</p><button class="c-b" type="button" data-shop>vai allo shop</button></div>`}
      ${x ? `<section class="t-za-dett">
        <header>${icona(scelto)}<div><h3>${esc(x.nome ? x.nome.replace(/^(un’|un |una |uno |il |la |l’)/i, '') : nomeDi(scelto))}</h3><small class="t-sh-piede" style="margin:0">ne hai ${n}${x.vale ? ` · vale ${x.vale} $pzk l’uno` : ''}</small></div></header>
        <p>${esc(x.cosa ?? (x.leggendario ? 'leggendario: ne esce uno ogni cento.' : x.schifo ? 'vale quasi niente, ma l’hai preso tu.' : 'si vende.'))}${testoBonus(x.bonus) ? `<br><b class="pzk">${testoBonus(x.bonus)}</b>` : ''}</p>
        <div class="t-sh-cta">${azioni(scelto, x)}</div>
      </section>` : ''}
    </div>`
}

function azioni(id, x) {
  const t = tipoDi(id), b = []
  if (t === 'usa' && x.effetto) b.push(`<button class="c-b" type="button" data-usa="${id}">usa</button>`)
  if (id === 'gratta') b.push(`<button class="c-b" type="button" data-chat="gratta">gratta</button>`)
  if (t === 'cassa') b.push(`<button class="c-b" type="button" data-chat="apri ${id}">apri</button>`)
  if (t === 'vendi') b.push(`<button class="c-b" type="button" data-chat="vendi ${id} ${zaino.quanti(id)}">vendi</button>`, '<button class="c-b nero" type="button" data-chat="vendi tutto">vendi tutto</button>')
  if (x.prezzo) b.push(`<button class="c-b nero" type="button" data-shop>${x.unico ? 'allo shop' : 'compra ancora'}</button>`)
  return b.join('')
}

function clic(e) {
  const f = e.target.closest('[data-filtro]'), p = e.target.closest('[data-id]'), u = e.target.closest('[data-usa]'), c = e.target.closest('[data-chat]')
  if (f) { if (filtro !== f.dataset.filtro) dallAlto(host); filtro = f.dataset.filtro; scelto = null; return disegna() } // un altro filtro: la lista riparte dall'alto
  if (p) { scelto = scelto === p.dataset.id ? null : p.dataset.id; disegna(); requestAnimationFrame(() => host.querySelector('.t-za-dett')?.scrollIntoView({ block: 'nearest' })); return } // dopo che la lista è tornata dov'era: si sposta solo quanto basta
  if (u) {
    const x = PER_ID[u.dataset.usa]
    if (!zaino.togli(x.id)) return
    zaino.attiva(x.id, x.effetto)
    ctx.toast(`${esc(x.nome)}: ${testoBonus(x.bonus)} per ${resto(x.effetto)}`, { icona: x.id })
    return disegna()
  }
  if (c) return ctx.vai('chat', { comando: c.dataset.chat })
  if (e.target.closest('[data-shop]')) return ctx.vai('negozio')
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'zaino')
  host.addEventListener('click', clic)
  zaino.ascolta(() => { if (!host.hidden) disegna() })
  disegna()
  return { mostra: () => { disegna(); clearInterval(timer); timer = setInterval(() => { if (!host.hidden && zaino.effetti().length) disegna() }, 30_000) }, nascondi: () => clearInterval(timer) }
}
