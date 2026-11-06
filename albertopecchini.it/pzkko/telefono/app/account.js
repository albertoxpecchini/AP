// La logica dell'account in comune con l'app Account del cercapersone zero (telefono/zero/os/account.js): i nomi riservati
// ad Alberto e le mosse del conto in parole. (31.10) Col cercapersone vecchio se n'è andata anche la sua interfaccia HTML
// (le quattro schede conto, cambio, invia, altro): le fa lo zero a 8 bit. I soldi e le chiamate restano quelli di games/pzk.js
// (entra, crea, esci, sincronizza, converti, invia…).

import * as pzk from '../../games/pzk.js'

export const RISERVATI = /^\s*(pzkko|alberto|albertopecchini|pecchini|admin|banca|bancapzk|root)\s*$/i // come NOMI_PROTETTI in api/wallet.mjs (anche lo zero, os/account.js)
const fmt = pzk.fmt, fmtEur = pzk.fmtEur

const NOMI_MOSSE = { nato: 'conto aperto', 'in-eur': 'in EUR€', 'in-pzk': 'in $pzk', inviato: 'inviati a', ricevuto: 'ricevuti da', indirizzo: 'indirizzo cambiato', instagram: 'regalo di instagram', trovato: 'trovati per terra', sussidio: 'sussidio', lumaca: 'la lumachina', rapina: 'rapina alla cassa (sporchi)', arresto: 'arresto: multa', cauzione: 'cauzione', lavatrice: 'lavatrice (commissione)', lavati: 'lavati: ora puliti', puliti: 'puliti dal tempo', decifrato: 'wallet decifrato', regalo: 'regalo di pzkko' }
/** Una mossa del conto in parole: { quando, cosa, n, segno }. L'account del cercapersone zero (telefono/zero/os/account.js)
 *  passa da qui. */
export function descriviMossa(m) {
  const NOMI = NOMI_MOSSE
  const pct = (p) => `${p < 0 ? '−' : '+'}${Math.abs(p).toFixed(2).replace('.', ',')} %`
  const quando = new Date(m.t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const segno = ['in-eur', 'inviato', 'cauzione', 'lavatrice'].includes(m.tipo) || m.verso === 'meno' ? 'meno' : ['indirizzo', 'lavati', 'puliti'].includes(m.tipo) ? '' : 'piu'
  const cosa = m.tipo === 'inviato' || m.tipo === 'ricevuto' ? `${NOMI[m.tipo]} ${m.nome ?? ''} (${m.a ?? m.da})` : m.tipo === 'indirizzo' ? `${NOMI[m.tipo]}: ${m.da} → ${m.a}` : m.tipo === 'in-eur' || m.tipo === 'in-pzk' ? `${NOMI[m.tipo]} a ${m.cambio?.toFixed(4)}` : m.tipo === 'lumaca' && typeof m.pct === 'number' ? `${NOMI.lumaca} ${pct(m.pct)}` : NOMI[m.tipo] ?? m.tipo
  const n = m.tipo === 'in-eur' ? `−${fmt(m.n)} $pzk → +${fmtEur(m.eur)} €` : m.tipo === 'in-pzk' ? `−${fmtEur(m.eur)} € → +${fmt(m.n)} $pzk` : m.n != null ? `${segno === 'meno' ? '−' : '+'}${fmt(m.n)} $pzk` : ''
  return { quando, cosa, n, segno }
}
