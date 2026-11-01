// I pezzi dei Giocatori (23.10) in comune con l'app Giocatori del cercapersone zero (telefono/zero/os/giocatori.js): quanto
// tempo fa, i giorni corti, i $pzk e le percentuali col segno, e il seme della lumachina senza conto (chat/lumaca.mjs).
// (31.10) L'interfaccia HTML di qui (le schede classifiche, notizie, cerca, io, la scheda di un giocatore, la lumachina e il
// suo avviso urgente) se n'è andata col cercapersone vecchio: il database lo sfoglia lo zero (chat/db.js, api/giocatori).

import { fmt } from '../../games/pzk.js'
import * as L from '../../chat/lumaca.mjs'

export const fa = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'adesso' : s < 3600 ? `${Math.floor(s / 60)} min fa` : s < 86400 ? `${Math.floor(s / 3600)} h fa` : `${Math.floor(s / 86400)} g fa` }

// ── la lumachina ──
const CHIAVE_SEME = 'pzkko-lumaca-seme' // senza conto: la lumachina di questo browser (non tocca i $pzk)
export function semeSessione() {
  try { let s = localStorage.getItem(CHIAVE_SEME); if (!s) { s = 's' + Math.random().toString(36).slice(2, 10); localStorage.setItem(CHIAVE_SEME, s) } return s } catch { return 'sessione' }
}
// «gio 22», col mese solo se non è quello di oggi («mer 30 set»)
export const giornoBreve = (g) => new Date(`${g}T12:00:00Z`).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', ...(g.slice(0, 7) !== L.giornoDi().slice(0, 7) && { month: 'short' }), timeZone: 'UTC' })
const conSegno = (x, testo) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${testo}`
export const pctTesto = (p) => conSegno(p, `${Math.abs(p).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`)
export const pzkTesto = (n) => conSegno(n, `${fmt(Math.abs(n))} $pzk`)
