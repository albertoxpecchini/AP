// La pagina /oggetti/ (26.10, la voce «oggetti» della barra): tutto quello che finisce nello zaino, dai dati veri della chat
// (chat/testi.js e chat/oggetti.js: lo shop per reparto, i pesci, gli animali, i reperti) e del profilo (le facce con la
// rarità e il prezzo). Quelli che hai già (lo zaino di questa scheda, o del conto) sono segnati. Si cerca per nome.

import { NEGOZIO, PESCI, ANIMALI, REPERTI } from '../chat/testi.js'
import { REPARTI } from '../chat/oggetti.js'
import { src, esiste } from '../chat/icone.js'
import * as zaino from '../chat/zaino.js'
import { fmt } from '../games/pzk.js'
import { facce } from '../telefono/app/profilo.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const nome = (x) => (x.nome ?? x.id).replace(/^(un’|un |una |uno |il |la |l’|i |le |gli )/i, '')
const img = (id) => (esiste(id) ? `<img src="${src(id)}" alt="" width="56" height="56" loading="lazy">` : '<span></span>')
const minuti = (ms) => (ms >= 3600000 ? `${Math.round(ms / 3600000)} h` : `${Math.round(ms / 60000)} min`)

function scheda(id, titolo, righe, pr, tuo) {
  return `<div class="scheda${tuo ? ' tuo' : ''}" data-cerca="${esc(`${titolo} ${id} ${righe}`.toLowerCase())}">${img(id)}<div><b>${esc(titolo)}</b><small>${righe}</small>${pr ? `<span class="pr">${pr}</span>` : ''}${tuo ? `<span class="pr tuo">${tuo}</span>` : ''}</div></div>`
}
const tuoi = (id) => { const n = zaino.quanti(id); return n > 0 ? (n > 1 ? `ne hai ${n}` : 'ce l’hai') : '' }

function bottino(lista) {
  const tot = lista.reduce((a, x) => a + (x.peso ?? 0), 0)
  return lista.map((x) => {
    const p = tot && x.peso ? (100 * x.peso) / tot : 0
    return scheda(x.id, nome(x), `${x.leggendario ? '<b>leggendario</b> · ' : ''}${p ? `esce ${p < 1 ? p.toFixed(1).replace('.', ',') : Math.round(p)} volte su 100` : ''}${x.cosa ? ` · ${esc(x.cosa)}` : ''}`, x.vale ? `vale ${fmt(x.vale)} $pzk` : '', tuoi(x.id))
  }).join('')
}

function disegna() {
  const sezioni = []
  for (const [rep, titolo] of REPARTI) {
    const r = NEGOZIO.filter((x) => x.reparto === rep)
    if (!r.length) continue
    sezioni.push([`lo shop: ${titolo}`, r.map((x) => scheda(x.id, nome(x), [esc(x.cosa ?? ''), x.effetto ? `dura ${minuti(x.effetto)}` : x.tipo === 'tieni' ? 'vale finché lo tieni' : ''].filter(Boolean).join(' · '), x.prezzo ? `${fmt(x.prezzo)} $pzk` : '', tuoi(x.id))).join('')])
  }
  sezioni.push(['il Mincio: si pesca', bottino(PESCI)], ['la caccia', bottino(ANIMALI)], ['gli scavi', bottino(REPERTI)])
  sezioni.push(['le facce del profilo', facce().map((f) => scheda(f.id, f.id.replace(/^av-/, ''), `<span style="color:${f.rarita.colore === '#b9c4b4' ? '#6a6458' : f.rarita.colore}">●</span> ${f.rarita.nome}${f.bloccata ? ` · prima va sbloccata: ${esc(f.bloccata)}` : ''}`, f.prezzo ? `${fmt(f.prezzo)} $pzk` : 'di tutti', f.mia ? 'è tua' : '')).join('')])
  document.querySelector('.elenco').innerHTML = sezioni.map(([t, html]) => `<section><h2>${t}</h2><div class="griglia">${html}</div></section>`).join('')
  filtra()
}
function filtra() {
  const q = document.querySelector('.cerca').value.trim().toLowerCase()
  for (const s of document.querySelectorAll('.elenco section')) {
    let visti = 0
    for (const c of s.querySelectorAll('[data-cerca]')) { const si = !q || c.dataset.cerca.includes(q); c.hidden = !si; visti += si }
    s.hidden = !visti
  }
}

document.querySelector('.cerca').addEventListener('input', filtra)
zaino.ascolta(disegna) // col conto lo zaino arriva dal server un attimo dopo
disegna()
