// Il database dei giocatori, visto dal browser (23.10): api/giocatori.mjs (le righe stanno in api/_giocatori.mjs). Ogni
// risposta si tiene un po' in memoria (30 s) così aprire e chiudere le schede non martella il server. Tutto qui è «best
// effort»: se il server non risponde (il wallet è in pausa, offline), si torna { ok: false } e chi chiama va avanti senza.
// Da qui attingono il comando «top/cerca/giocatore/notizie» della chat, l'app Giocatori del telefono, le domande «dal
// database» del quiz e le notizie sulla home del telefono.

import * as pzk from '../games/pzk.js'

const API = '/api/giocatori/' // con la barra finale (trailingSlash): niente redirect
const cache = new Map()

async function leggi(q, ttl = 30_000) {
  const c = cache.get(q)
  if (c && Date.now() - c.t < ttl) return c.d
  try {
    const d = await (await fetch(`${API}?${q}`)).json()
    if (d?.ok) cache.set(q, { t: Date.now(), d })
    return d ?? { ok: false }
  } catch { return { ok: false, errore: 'il server non risponde' } }
}

/** Le metriche delle classifiche: id → [nome, come si scrive il valore, icona]. */
export const METRICHE = {
  pzk: ['$pzk liberi', 'pzk', 'pzk'], xp: ['esperienza', 'xp', 'xp'], liv: ['livello', 'livello', 'livello'], guadagnati: ['guadagnati in tutto', 'pzk', 'banconota'], vinti: ['vinti ai giochi', 'pzk', 'sette'],
  pescati: ['pescati', 'n', 'canna'], cacciati: ['cacciati', 'n', 'fionda'], scavati: ['scavati', 'n', 'pala'], morti: ['morti', 'n', 'teschio'], comandi: ['comandi scritti', 'n', 'telefono'],
  quiz: ['risposte giuste ai quiz', 'n', 'quiz'], sfide: ['sfide fatte', 'n', 'fulmine'], missioni: ['side quest fatte', 'n', 'chiave-vecchia'], serie: ['serie di giorni', 'n', 'fuoco'], acquisti: ['pezzi comprati', 'n', 'sacco'],
  vecchiaia: ['giorni di vita', 'n', 'clessidra'], eur: ['EUR€', 'eur', 'eur'], persi: ['persi ai giochi', 'pzk', 'no'],
}
// i valori corti (1,0K, 13,3K, 1,0M…: games/pzk.js fmtCorto) perché nelle classifiche e nei podi stiano nella riga
export const valoreHtml = (metrica, v) => { const t = METRICHE[metrica]?.[1]; const n = t === 'eur' ? Number(v).toLocaleString('it-IT') : pzk.fmtCorto(Number(v)); return t === 'pzk' ? `<span class="pzk">${n} $pzk</span>` : t === 'eur' ? `<span class="eur">EUR€ ${n}</span>` : n }

export const top = (metrica, n = 10) => leggi(`top=${encodeURIComponent(metrica)}&n=${n}`)
export const cerca = (testo) => leggi(`cerca=${encodeURIComponent(testo)}`, 15_000)
export const profilo = (ind) => leggi(`ind=${encodeURIComponent(ind)}`, 20_000)
export const statistiche = () => leggi('stats=1')
export const notizie = () => leggi('notizie=1')

/** Il mio profilo (serve un conto) e, se vuoi, chi mi sta sopra e sotto in una classifica. */
export async function io(vicini = null) {
  const token = pzk.token()
  if (!token) return { ok: false, errore: 'serve un conto: entra nel wallet' }
  try {
    const d = await (await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...(vicini && { vicini }) }) })).json()
    return d ?? { ok: false }
  } catch { return { ok: false, errore: 'il server non risponde' } }
}
/** Dimentica quello che si è tenuto in memoria (dopo aver salvato lo zaino, per esempio). */
export const dimentica = () => cache.clear()

/** Una notizia come riga di testo con le nostre icone: { icona, html }. */
export function testoNotizia(n) {
  const chi = `<b>${n.nome}</b>`
  const D = n.dato
  switch (n.tipo) {
    case 'livello': return { icona: 'livello', html: `${chi} è salito al livello <b>${D}</b>` }
    case 'leggenda': return { icona: D, html: `${chi} ha preso <b>${{ 'carpa-oro': 'la carpa d’oro dei Gonzaga', drago: 'il drago del Mincio', tesoro: 'il tesoro dei Gonzaga' }[D] ?? D}</b>` }
    case 'vincita': return { icona: 'sette', html: `${chi} ha vinto <span class="pzk">${Number(D).toLocaleString('it-IT')} $pzk</span> ai giochi` }
    case 'mestiere': return { icona: D, html: `${chi} ora fa il mestiere: <b>${D}</b>` }
    case 'sfide': return { icona: 'fulmine', html: `${chi} ha fatto <b>${D}</b> sfide giornaliere` }
    case 'missione': return { icona: 'chiave-vecchia', html: `${chi} ha finito la side quest numero <b>${D}</b>` }
    case 'quiz': return { icona: 'quiz', html: `${chi} ha azzeccato <b>${D}</b> domande di fila ai quiz` }
    case 'serie': return { icona: 'fuoco', html: `${chi} è a <b>${D}</b> giorni di fila` }
    case 'nuovo': return { icona: 'bot-ride', html: `${chi} è arrivato in banca` }
    case 'lumaca': { // le catastrofi e i miracoli della lumachina (api/wallet.mjs): { ev, pct, titolo }
      const p = Number(D?.pct) || 0, titolo = String(D?.titolo ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
      return { icona: p < 0 ? 'bot-triste' : 'bot-ricco', html: `la lumachina di ${chi}: <b>${titolo}</b> (${p < 0 ? '−' : '+'}${Math.abs(p).toLocaleString('it-IT', { maximumFractionDigits: 2 })} % dei $pzk)` }
    }
    default: return { icona: 'bot', html: `${chi}: ${n.tipo}` }
  }
}
