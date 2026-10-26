// La pagina /traguardi/ (26.10, la voce «traguardi» della barra: gli achievement): chat/traguardi.js dice a che punto sei
// di ognuno; qui si mettono in fila per gruppo, coi fatti accesi e la barretta di quelli da fare.

import { tutti, GRUPPI } from '../chat/traguardi.js'
import * as zaino from '../chat/zaino.js'
import * as pzk from '../games/pzk.js'
import { src, esiste } from '../chat/icone.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function disegna() {
  const t = tutti(), fatti = t.filter((x) => x.fatto).length, c = pzk.conto()
  document.querySelector('.riassunto').innerHTML = `<b>${fatti} su ${t.length}</b> · ${c ? `del conto ${esc(c.nome)} (${esc(c.ind)})` : 'di questa scheda del browser: senza conto si perdono chiudendola (il conto si crea nell’app account del cercapersone)'}`
  document.querySelector('.elenco').innerHTML = Object.entries(GRUPPI).map(([g, titolo]) => {
    const v = t.filter((x) => x.gruppo === g)
    return `<section><h2>${titolo} <small>${v.filter((x) => x.fatto).length}/${v.length}</small></h2><div class="griglia">${v.map((x) => `<div class="scheda ${x.fatto ? 'fatto' : 'spento'}">${esiste(x.icona) ? `<img src="${src(x.icona)}" alt="" width="56" height="56" loading="lazy">` : '<span></span>'}<div><b>${esc(x.nome)}</b><small>${esc(x.cosa)}</small>
      ${x.fatto ? '<span class="pr">fatto</span>' : `<div class="barretta" title="${x.n} su ${x.di}"><i style="width:${(100 * x.n) / x.di}%"></i></div><small>${x.n.toLocaleString('it-IT')} su ${x.di.toLocaleString('it-IT')}</small>`}</div></div>`).join('')}</div></section>`
  }).join('')
}

zaino.ascolta(disegna)
pzk.osserva(disegna)
disegna()
