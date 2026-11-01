// Il cercapersone sul muro e quello che resta del motore della chat col bot dei $pzk (22.10; dal 31.10 il cercapersone è
// uno solo, lo zero, per tutti). Il tasto sotto il wallet (index.html #cercapersone-muro, .chat-tasto) si veste sempre da
// zero (telefono/zero/muro.js) e, toccato, apre il telefono (telefono/telefono.js), dove la chat è quella a 8 bit di pzk os
// (telefono/zero/os/chat.js): si scrive un comando («pesca», «lavora», «roulette 50 rosso»; anche «pzk pesca» e «/pesca»)
// e il bot pzk, la chiocciola della banca con gli occhiali da sole, risponde con una scheda, come un bot di Discord (sul
// modello di Dank Memer, tutto in italiano e con le cose di Mantova). I soldi sono i $pzk di games/pzk.js; il resto (xp,
// livello, mestiere, oggetti, attese) è lo zaino (zaino.js). I comandi stanno in comandi/ (una famiglia per file).
// (31.10) La chat in HTML del cercapersone vecchio (il pannello, le schede scritte a mano, la storia, i tasti rapidi) non
// c'è più: qui restano il tasto e i pezzi che la chat di pzk os prende da qui (gli importi, le durate, la banca, la morte).
//
// prepara(tasto): accende il cercapersone sul muro («1 msg» quando c'è un premio pronto). apri(comando): apre il telefono
// e, se c'è, scrive il comando nella chat. chiudi(): lo richiude.

import * as pzk from '../games/pzk.js'
import * as zaino from './zaino.js'
import { PER_ID } from './testi.js'
import { prezzoDi } from './mercato.js'
import * as led from './led.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const mezzi = (n) => Math.round(n * 2) / 2
export const fmt = pzk.fmt
export const pzkHtml = (n) => `<span class="pzk">${pzk.fmt(n)} $pzk</span>`
export const eurHtml = (n) => `<span class="eur">EUR€ ${pzk.fmtEur(n)}</span>`

// il vetro rotto del cercapersone scassato, nel tasto piccolo: la versione ridotta col massimo (tools/pzkko/crepe-piccole.mjs),
// perché ridotta con la media ai 74 px dell'lcd sparirebbe. Lo schermo grande (telefono.js) usa crepe.webp
const CREPE = '/art/chat-pager-crepe/crepe-piccola.webp'
let tasto = null

// ── il tasto ──
export function prepara(b) {
  if (tasto === b) return // (una volta sola per tasto)
  tasto = b
  // (31.10) lo zero per tutti: il tasto si veste sempre da zero (muro.js, che lo fa una volta sola: lo chiama anche l'html
  // della pagina, appena letto il tasto), e niente più tubo catodico sull'lcd
  import('../telefono/zero/muro.js').then((m) => m.veste(b)).catch((e) => console.warn('zero non vestito', e))
  led.collega(b.querySelector('.ct-led')) // il led sfarfalla quando il sistema lavora (led.js)
  // le crepe del cercapersone scassato: l'immagine si carica da subito (nascosta), così quando muori non arriva dopo; nell'lcd
  // entra dopo la chiocciolina (avvia() riscrive l'lcd)
  const crepe = new Image()
  Object.assign(crepe, { className: 'ct-crepe', src: CREPE, alt: '', draggable: false })
  aggiornaTasto()
  import('./tomodachi.js').then((m) => m.avvia(b)).catch((e) => console.warn('tomodachi non partito', e)) // la chiocciolina sullo schermo lcd
    .then(() => b.querySelector('.ct-lcd')?.append(crepe))
  zaino.ascolta(aggiornaTasto)
  pzk.osserva(aggiornaTasto)
  setInterval(aggiornaTasto, 30_000)
}
/** Il cercapersone dice «1 msg» quando c'è un premio da riscuotere (il giornaliero, o qualcosa in sospeso). */
function aggiornaTasto() {
  if (!tasto) return
  tasto.classList.toggle('msg', zaino.manca('giornaliero') === 0 && !zaino.pagerRotto())
  tasto.classList.toggle('scassato', zaino.pagerRotto()) // le crepe sul vetro (.ct-crepe): ci sono da morto, fino al nuovo
}

/** Apre il telefono: il cercapersone e l'evento «pzkko-chat» arrivano qui. Col clic si apre la home (lo schermo del
 *  cercapersone si zooma fino al telefono); con un comando, o con #chat nell'indirizzo, si apre direttamente la chat. */
export function apri(comando = null) {
  const conComando = typeof comando === 'string' && comando.trim()
  const app = conComando || location.hash === '#chat' ? 'chat' : null
  return import('../telefono/telefono.js').then((t) => t.apri(app, { comando: conComando ? comando : null, da: tasto }))
}
export function chiudi() { return import('../telefono/telefono.js').then((t) => t.chiudi()) }

// ── i pezzi che la chat di pzk os prende da qui (telefono/zero/os/chat.js) ──
/** I tempi dei messaggi del bot (23.10): «sta scrivendo…» per RITARDO_MS, poi il testo si scrive da solo in SCRITTURA_MS.
 *  Con «riduci animazioni» dormi() taglia corto. */
export const RITARDO_MS = 500, SCRITTURA_MS = 1000
export const dormi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? Math.min(ms, 150) : ms))

// ── i soldi, visti dalla chat ──
// (31.10) DAL 31.10 LA CHAT NON PAGA E NON TOGLIE PIÙ NIENTE: ogni comando chiede alla banca (ctx.fai → pzk.fai,
// 'chat.pesca', 'chat.slot'…), che tira i dadi, paga, toglie, segna le attese e restituisce l'esito e il conto nuovo.
/** Chiede alla banca un'azione della chat. L'evento casuale e la morte che arrivano con l'esito restano al comando
 *  (ctx.__evento, ctx.__morte): li mostra alla fine l'esegui di pzk os (telefono/zero/os/chat.js). → la risposta di pzk.fai ({ ok, esito } o { ok: false, errore }) */
export async function chiedi(ctx, cosa, args = {}) {
  led.inizia()
  let r
  try { r = await pzk.fai(cosa, args) } catch { r = { ok: false, errore: 'niente rete: riprova' } } finally { led.finisci() }
  if (r?.ok && r.esito?.evento) ctx.__evento = r.esito.evento
  if (r?.ok && r.esito?.morte) ctx.__morte = r.esito.morte
  return r ?? { ok: false, errore: 'la banca non risponde' }
}
/** Il no della banca, detto dal bot: l'attesa che non è finita (manca), o il perché. → false (niente evento dopo) */
export function rifiuto(ctx, r, cmd = '') {
  if (r.manca > 0) { const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: calma', d: `${cmd ? `«${cmd}» lo puoi rifare` : 'si può rifare'} fra <b>${durata(r.manca)}</b>.` }); ctx.tempo(s, Math.min(r.manca, 60_000)); return false }
  ctx.dì({ colore: 'rosso', av: 'bot-triste', d: r.errore ?? 'non è andata.' })
  return false
}
/** Il nome di chi parla (quello del conto, o «tu»). */
export const nome = () => pzk.conto()?.nome ?? 'tu'

// ── i comandi ──
/** «pzk pesca», «/pesca», «pesca» → { nome: 'pesca', args: [] }. I numeri: 50, 1k, 2.5k, tutto, metà. */
export function analizza(riga) {
  let t = riga.trim().replace(/^\/+/, '').replace(/^pzk\s+/i, '').trim()
  const [nome, ...args] = t.split(/\s+/)
  return { nome: (nome ?? '').toLowerCase(), args, testo: args.join(' ') }
}
/** Un importo scritto come si scrive: 50, 1k, 1.5k, 1000, tutto/all/max, metà. → numero (a mezzi $pzk) o NaN */
export function importo(s, max = pzk.saldo()) {
  if (s == null) return NaN
  s = String(s).toLowerCase().replace(/\$?pzk$/, '')
  if (['tutto', 'tutti', 'all', 'max'].includes(s)) return mezzi(max)
  if (['metà', 'meta', 'half'].includes(s)) return mezzi(max / 2)
  const m = /^(\d+(?:[.,]\d+)?)(k)?$/.exec(s)
  if (!m) return NaN
  let n = parseFloat(m[1].replace(',', '.'))
  if (m[2]) n *= 1000
  return mezzi(n)
}
export const caso = (a) => a[Math.floor(Math.random() * a.length)]
export const rnd = (n) => Math.floor(Math.random() * n)
export const tra = (a, b) => a + Math.floor(Math.random() * (b - a + 1))
/** Quanto manca, come si dice: 12 s, 3 min, 1 h 20 min, 2 g. */
export function durata(ms) {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.ceil(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  if (h < 24) return r ? `${h} h ${r} min` : `${h} h`
  const g = Math.floor(h / 24)
  return `${g} g ${h % 24} h`
}

/** La morte (Dank Memer docet): si perde il 20 % dei $pzk liberi (al più 5.000), a meno di avere il cornetto, che si consuma.
 *  Dal 31.10 la decide la banca (giochi/chat-comune.mjs, muori) dentro l'azione che fa morire, e la manda nell'esito
 *  (morte: { motivo, cornetto, restano } o { motivo, persi, max }): qui la si racconta e basta. `dì`: chi scrive la scheda
 *  (la chat di pzk os, col suo ctx). */
export const MORTE = { quota: 0.2, max: 5000 }
export function mostraMorte(dì, m) {
  if (m.cornetto) return dì({ colore: 'ambra', av: 'bot-occhiolino', t: ':cornetto: il cornetto ha fatto il suo', d: `${m.motivo}\nSaresti morto, ma il cornetto rosso si è crepato al posto tuo: i $pzk sono salvi. Ne hai ancora ${m.restano}.` })
  dì({ colore: 'rosso', av: 'bot-morto', t: ':teschio: sei morto', d: `${m.motivo}\nHai perso ${pzkHtml(m.persi)} (il ${MORTE.quota * 100} % dei $pzk liberi${m.max ? ', il massimo' : ''}). Gli EUR€ nel wallet non si toccano.\nE il :pager: cercapersone si è <b>scassato</b>: adesso fa solo <code>lavora</code> e <code>compra cercapersone</code> (${pzkHtml(prezzoPager())}).`, pie: 'un :cornetto: dal negozio ti avrebbe salvato', azioni: AZIONI_SCASSATO })
}
// ── il cercapersone scassato: due cose sole, lavorare e ricomprare il nuovo (i tasti sotto la scheda della morte; cosa
// passa da scassato lo decide la chat di pzk os) ──
const prezzoPager = () => prezzoDi(PER_ID.pager)
const AZIONI_SCASSATO = [['lavora', ':rider: lavora', 'oro'], ['compra cercapersone', ':pager: compra il nuovo']]
