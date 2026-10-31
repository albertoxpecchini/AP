// L'app Decifratore (26.10): si compra nel pzkstore (dal 29.10, telefono/app/pzkstore.js: 1.500 $pzk puliti) o dalla chat
// («installa decifratore», chat/comandi/app.js, che passa dallo stesso pzkstore) e apre i wallet pzk e le chiavette usb
// che lo spazzino trova sul nastro (chat/minigiochi.js, nastro). Ogni pezzo vuole tre giochini di decodifica, facili (PEGI 13): la parola spostata di una lettera (il cifrario di Cesare), il numero in binario, la sequenza da
// completare, la parola allo specchio. Due errori si perdonano, al terzo il wallet si blocca (resta nello zaino: si riprova).
// Aperto, i $pzk escono dal fondo dei portafogli smarriti (api/wallet.mjs, decifra: tre al giorno): soldi puliti, perché
// erano destinati a sparire. Il pezzo aperto lascia lo zaino.
//
// DAL 31.10 I GIOCHINI LI PREPARA LA BANCA (Alberto: «decifra un wallet devi farlo se hai un wallet»; giochi/app-decifratore.mjs
// sul server di Alberto): prima qui si inventavano, si sapevano le risposte e alla fine si chiedevano i soldi. Ora
// 'decifratore.apri' controlla che il decifratore sia installato e il pezzo nello zaino, e manda un giochino alla volta senza
// la risposta; 'decifratore.risolvi' dice se è giusta; risolti tutti e tre, pzk.decifra (la banca: consuma il pezzo e paga).

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'
import { icona } from '../../chat/icone.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// le parole intorno al codice, per tipo di giochino (il codice e le scelte li manda la banca)
export const DOMANDE = {
  cesare: (c) => `ogni lettera è spostata di uno in avanti (A→B). Cosa c’era scritto?<code>${esc(c)}</code>`,
  binario: (c) => `il pin è in binario: quanto fa in decimale?<code>${esc(c)}</code><small>(da destra: 1, 2, 4, 8)</small>`,
  sequenza: (c) => `la prossima cifra della chiave?<code>${esc(c)} · ?</code>`,
  specchio: (c) => `la password è scritta al contrario: qual è?<code>${esc(c)}</code>`,
}
const TIPI = { 'wallet-pzk': ['wallet', 'wallet pzk cifrato'], chiavetta: ['chiavetta', 'chiavetta usb'] }

let host = null, ctx = null
let P = null // la partita: { id, v (quello che la banca fa vedere: tipo, i, errori, prova), esito }
let occupato = false

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
  const g = P.v.prova
  return `<div class="t-de-schermo"><small>${TIPI[P.id][1]} · passo ${P.v.i + 1}/3 · errori ${P.v.errori}/2</small><p>${DOMANDE[g.k]?.(g.codice) ?? esc(g.codice)}</p></div>
    <div class="t-de-scelte">${g.scelte.map((x) => `<button type="button" class="c-b nero" data-r="${esc(x)}">${esc(x)}</button>`).join('')}</div>`
}
function disegna() {
  const corpo = !pzk.conto() ? `<div class="t-ac-fuori">${icona('lucchetto')}<p>il decifratore lavora col conto.</p><button class="c-b" type="button" data-vai="account">crea il conto</button></div>` : P ? partita() : lista()
  host.innerHTML = `${ctx.testata('Decifratore')}<div class="t-corpo-app t-de">${corpo}</div>`
}

/** Apre un pezzo sulla banca: il primo giochino. */
async function apri(id) {
  const d = await pzk.fai('decifratore.apri', { tipo: TIPI[id][0] })
  if (!d?.ok) return ctx.toast(esc(d?.errore ?? 'la banca non risponde: riprova'), { icona: 'bot-pensa' })
  P = { id, v: d.esito, esito: null }
  disegna()
}
/** Una risposta: la banca dice se è giusta; tre giuste, la banca decifra e paga. */
async function risposta(r, b) {
  const q = P
  const d = await pzk.fai('decifratore.risolvi', { risposta: r })
  if (q !== P) return
  if (!d?.ok) { P.esito = { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }; return disegna() }
  const e = d.esito
  b.classList.add(e.giusta ? 'giusta' : 'sbagliata')
  if (e.bloccato) { P.esito = { ok: false, ...(e.sparito && { errore: 'il pezzo non è più nello zaino' }) }; return setTimeout(disegna, 450) }
  if (!e.risolto) { P.v = e; return setTimeout(disegna, e.giusta ? 300 : 450) }
  const f = await pzk.decifra(P.v.tipo)
  if (q !== P) return
  P.esito = f.ok ? { ok: true, n: f.fatto.n } : { ok: false, errore: f.errore }
  disegna()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'decifratore')
  host.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-apri]'), r = e.target.closest('[data-r]'), f = e.target.closest('[data-fai]'), v = e.target.closest('[data-vai]')
    if ((a || r) && occupato) return // (la banca sta rispondendo: niente doppi invii)
    if (a) { occupato = true; try { await apri(a.dataset.apri) } finally { occupato = false } return }
    if (r && !r.classList.contains('giusta') && !r.classList.contains('sbagliata')) { occupato = true; try { await risposta(r.dataset.r, r) } finally { occupato = false } return }
    if (f?.dataset.fai === 'lista') { P = null; return disegna() }
    if (v) ctx.vai(v.dataset.vai)
  })
  // (la freccia indietro chiude la partita, prima di uscire dall'app)
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && P) { e.stopPropagation(); P = null; disegna() } }, true)
  zaino.ascolta(() => { if (!host.hidden && !P) disegna() })
  disegna()
  return { mostra: () => { if (!P) disegna() } }
}
