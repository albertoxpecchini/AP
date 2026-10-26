// L'app Decifratore (26.10): si installa dalla chat («installa decifratore», chat/comandi/app.js) e apre i wallet pzk e le
// chiavette usb che lo spazzino trova sul nastro (chat/minigiochi.js, nastro). Ogni pezzo vuole tre giochini di decodifica,
// facili (PEGI 13): la parola spostata di una lettera (il cifrario di Cesare), il numero in binario, la sequenza da
// completare, la parola allo specchio. Due errori si perdonano, al terzo il wallet si blocca (resta nello zaino: si riprova).
// Aperto, i $pzk escono dal fondo dei portafogli smarriti (api/wallet.mjs, decifra: tre al giorno): soldi puliti, perché
// erano destinati a sparire. Il pezzo aperto lascia lo zaino.

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const caso = (a) => a[Math.floor(Math.random() * a.length)]
const mescola = (a) => [...a].sort(() => Math.random() - 0.5)
const PAROLE = ['MANTOVA', 'MINCIO', 'TORTELLI', 'GONZAGA', 'NUTRIA', 'VIRGILIO', 'ZUCCA', 'SBRISOLONA', 'LUCCIO', 'CHIOCCIOLA', 'PIAZZA', 'SARACINESCA']
const sposta = (w, k) => w.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 65 + k + 26) % 26) + 65))
// i giochini: → { domanda (html), giusta, scelte }
const GIOCHINI = {
  cesare: () => { const w = caso(PAROLE); return { domanda: `ogni lettera è spostata di uno in avanti (A→B). Cosa c’era scritto?<code>${sposta(w, 1)}</code>`, giusta: w, scelte: mescola([w, ...mescola(PAROLE.filter((x) => x !== w)).slice(0, 3)]) } },
  binario: () => { const n = 3 + Math.floor(Math.random() * 13); const b = n.toString(2).padStart(4, '0'); return { domanda: `il pin è in binario: quanto fa in decimale?<code>${b}</code><small>(da destra: 1, 2, 4, 8)</small>`, giusta: String(n), scelte: mescola([n, n + 1, n - 1, n + 2].map(String)) } },
  sequenza: () => { const a = 2 + Math.floor(Math.random() * 4), d = 2 + Math.floor(Math.random() * 4), s = [0, 1, 2, 3].map((i) => a + i * d); return { domanda: `la prossima cifra della chiave?<code>${s.join(' · ')} · ?</code>`, giusta: String(a + 4 * d), scelte: mescola([a + 4 * d, a + 4 * d + 1, a + 4 * d - 2, a + 5 * d].map(String)) } },
  specchio: () => { const w = caso(PAROLE); return { domanda: `la password è scritta al contrario: qual è?<code>${[...w].reverse().join('')}</code>`, giusta: w, scelte: mescola([w, ...mescola(PAROLE.filter((x) => x !== w)).slice(0, 3)]) } },
}
const TIPI = { 'wallet-pzk': ['wallet', 'wallet pzk cifrato'], chiavetta: ['chiavetta', 'chiavetta usb'] }

let host = null, ctx = null
let P = null // la partita: { id, prove: [giochino…], i, errori, esito }

function lista() {
  const pezzi = Object.keys(TIPI).map((id) => [id, zaino.quanti(id)]).filter(([, n]) => n > 0)
  const oggi = pzk.conto()?.decifrati ?? 0
  return `<p class="t-ac-nota">i wallet e le chiavette che lo spazzino trova sul nastro. Tre giochini a pezzo, due errori perdonati. I soldi che escono sono <b>puliti</b>: erano destinati a sparire. Oggi: ${oggi}/3.</p>
    ${pezzi.length ? `<div class="t-de-pezzi">${pezzi.map(([id, n]) => `<button type="button" class="t-de-pezzo" data-apri="${id}">${icona(id)}<b>${TIPI[id][1]}</b><small>ne hai ${n}</small><span class="c-b">decifra</span></button>`).join('')}</div>`
      : `<div class="t-ac-fuori">${icona('chiavetta')}<p>niente da decifrare: fai lo <b>spazzino di uffici</b> (in chat: «lavora come spazzino») e tieni quello che scotta.</p></div>`}`
}
function partita() {
  if (P.esito) {
    const e = P.esito
    return `<div class="t-ra-esito ${e.ok ? 'ok' : 'no'}">${icona(e.ok ? (e.n ? 'bot-ricco' : 'bot-pensa') : 'lucchetto')}<b>${e.ok ? (e.n ? 'aperto' : 'aperto, ma vuoto') : 'bloccato'}</b><span>${e.ok ? (e.n ? `<span class="pzk">+${pzk.fmt(e.n)} $pzk</span> puliti` : 'qualcuno l’aveva già svuotato') : esc(e.errore ?? 'tre errori: riprova più tardi, il pezzo resta nello zaino')}</span></div>
      <div class="t-ac-azioni"><button class="c-b" type="button" data-fai="lista">va bene</button></div>`
  }
  const g = P.prove[P.i]
  return `<div class="t-de-schermo"><small>${TIPI[P.id][1]} · passo ${P.i + 1}/3 · errori ${P.errori}/2</small><p>${g.domanda}</p></div>
    <div class="t-de-scelte">${g.scelte.map((x) => `<button type="button" class="c-b nero" data-r="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
}
function disegna() {
  const corpo = !pzk.conto() ? `<div class="t-ac-fuori">${icona('lucchetto')}<p>il decifratore lavora col conto.</p><button class="c-b" type="button" data-vai="account">crea il conto</button></div>` : P ? partita() : lista()
  host.innerHTML = `${ctx.testata('Decifratore')}<div class="t-corpo-app t-de">${corpo}</div>`
}

async function risposta(r, b) {
  const g = P.prove[P.i]
  if (r !== g.giusta) {
    b.classList.add('sbagliata'); P.errori++
    if (P.errori > 2) { P.esito = { ok: false }; return disegna() }
    setTimeout(() => { P.prove[P.i] = GIOCHINI[caso(Object.keys(GIOCHINI))](); disegna() }, 450)
    return
  }
  b.classList.add('giusta')
  if (++P.i < 3) return setTimeout(disegna, 300)
  const d = await pzk.decifra(TIPI[P.id][0])
  if (d.ok) { zaino.togli(P.id); P.esito = { ok: true, n: d.fatto.n } } else P.esito = { ok: false, errore: d.errore }
  disegna()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'decifratore')
  host.addEventListener('click', (e) => {
    const a = e.target.closest('[data-apri]'), r = e.target.closest('[data-r]'), f = e.target.closest('[data-fai]'), v = e.target.closest('[data-vai]')
    if (a) { const tipi = mescola(Object.keys(GIOCHINI)).slice(0, 3); P = { id: a.dataset.apri, prove: tipi.map((t) => GIOCHINI[t]()), i: 0, errori: 0, esito: null }; return disegna() }
    if (r && !r.classList.contains('giusta') && !r.classList.contains('sbagliata')) return risposta(r.dataset.r, r)
    if (f?.dataset.fai === 'lista') { P = null; return disegna() }
    if (v) ctx.vai(v.dataset.vai)
  })
  // (la freccia indietro chiude la partita, prima di uscire dall'app)
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && P) { e.stopPropagation(); P = null; disegna() } }, true)
  zaino.ascolta(() => { if (!host.hidden && !P) disegna() })
  disegna()
  return { mostra: () => { if (!P) disegna() } }
}
