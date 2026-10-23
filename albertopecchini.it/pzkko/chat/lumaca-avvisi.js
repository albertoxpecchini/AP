// Le notifiche della lumachina (23.10 sera): le giornate che la lumachina ha vissuto sul tuo conto (api/wallet.mjs, c.lumaca)
// e che non hai ancora visto. Fanno il pallino rosso sull'app Giocatori e sulla scheda «io» del cercapersone (e il led
// lampeggia), il riquadro «dalla banca» della home diventa urgente, e nella scheda «io» c'è l'avviso finché non premi
// «ho capito». Solo col conto: senza, la lumachina non tocca i $pzk e non c'è niente da notificare. Cosa hai visto lo
// ricorda il browser (localStorage, per conto). Le parole e la salute le fa chat/lumaca.mjs.

import { conto } from '../games/pzk.js'

const CHIAVE = 'pzkko-lumaca-visto' // { [creato del conto]: 'AAAA-MM-GG' dell'ultima giornata vista }
const leggi = () => { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') ?? {} } catch { return {} } }

/** Le giornate non ancora viste che hanno spostato $pzk (o ci hanno provato), dalla più vecchia: [{ g, ev, pct, s, n }]. */
export function daVedere() {
  const c = conto()
  if (!c?.lumaca?.ultime?.length) return []
  const visto = leggi()[c.creato] ?? ''
  return c.lumaca.ultime.filter((v) => v.g > visto && v.pct !== 0)
}
/** «Ho capito»: tutto quello che la lumachina ha fatto finora è visto. */
export function visto() {
  const c = conto()
  if (!c?.lumaca?.g) return
  const t = leggi()
  t[c.creato] = c.lumaca.g
  try { localStorage.setItem(CHIAVE, JSON.stringify(t)) } catch {}
}
