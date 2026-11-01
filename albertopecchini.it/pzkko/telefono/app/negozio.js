// La logica dello Shop dei $pzk (23.10) in comune con lo shop del cercapersone zero (telefono/zero/os/negozio.js): le chiavi
// del carrello e dei preferiti, gli ordini, i prodotti di un reparto, il conto alla rovescia delle offerte del giorno (a
// mezzanotte), l'acquisto delle righe del carrello. Tutto il catalogo, i prezzi e gli acquisti sono quelli della chat
// (chat/testi.js, chat/oggetti.js, chat/mercato.js): quello che compri lo trovi nello zaino e viceversa. (31.10) L'interfaccia
// HTML di qui (la vetrina, la scheda del prodotto, il carrello, lo scontrino) se n'è andata col cercapersone vecchio.

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'
import { NEGOZIO, PER_ID } from '../../chat/testi.js'
import * as mercato from '../../chat/mercato.js'

// (lo shop del cercapersone zero, telefono/zero/os/negozio.js, tiene il carrello e i preferiti in localStorage con queste chiavi)
export const CHIAVE_CARRELLO = 'pzkko-carrello'
export const CHIAVE_PREF = 'pzkko-preferiti'

export const ORDINI = [['top', 'in evidenza'], ['prezzo-su', 'prezzo: dal più basso'], ['prezzo-giu', 'prezzo: dal più alto'], ['bonus', 'bonus più grossi']]
const peso = (x) => Object.values(x.bonus ?? {}).reduce((a, n) => a + Math.abs(n), 0)

/** I secondi che mancano a mezzanotte (di Mantova). */
function aMezzanotte() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(new Date())
  const v = (t) => Number(p.find((x) => x.type === t).value)
  return 86400 - ((v('hour') % 24) * 3600 + v('minute') * 60 + v('second'))
}
export const contoAllaRovescia = () => { const s = aMezzanotte(); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

/** I prodotti di un reparto ('tutti', 'offerte' o un reparto), con la ricerca, l'ordine e «posso comprarli»: la vetrina
 *  del cercapersone zero (telefono/zero/os/negozio.js). */
export function prodotti({ rep = 'tutti', q = '', ordine = 'top', solo = false } = {}) {
  q = q.trim().toLowerCase()
  let l = NEGOZIO.filter((x) => (rep === 'tutti' || (rep === 'offerte' ? mercato.scontoDi(x.id) : x.reparto === rep)) && (!q || x.nome.toLowerCase().includes(q) || x.cosa.toLowerCase().includes(q) || x.id.includes(q)))
  if (solo) l = l.filter((x) => mercato.prezzoDi(x) <= pzk.saldo() && !(x.unico && zaino.ha(x.id)))
  const o = ordine
  return [...l].sort(o === 'prezzo-su' ? (a, b) => mercato.prezzoDi(a) - mercato.prezzoDi(b) : o === 'prezzo-giu' ? (a, b) => mercato.prezzoDi(b) - mercato.prezzoDi(a) : o === 'bonus' ? (a, b) => peso(b) - peso(a) : (a, b) => (mercato.scontoDi(b.id) - mercato.scontoDi(a.id)) || (a.prezzo - b.prezzo))
}

/** Compra le righe [[id, n], …] coi prezzi di oggi: → { manca } se non bastano, { errore } se la banca dice di no, se no lo
 *  scontrino { t, righe: [{ id, n, tot }], tot, risparmio } (righe vuote: c'erano solo cose che hai già). tolto(id): una riga
 *  comprata (per il carrello). Lo shop del cercapersone zero passa da qui.
 *  (31.10) compra la banca, tutto il carrello in una volta ('chat.carrello': prezzi, offerte e soldi puliti sono i suoi;
 *  se non bastano per tutto non compra niente). */
export async function compraRighe(righe, tolto = () => {}) {
  const tot = righe.reduce((a, [id, n]) => a + mercato.prezzoDi(PER_ID[id]) * n, 0)
  if (tot > pzk.puliti()) return { manca: tot - pzk.puliti() }
  const r = await pzk.fai('chat.carrello', { righe: righe.map(([id, n]) => [id, n]) })
  if (!r.ok) return { errore: r.errore ?? 'non è andata: riprova' }
  for (const x of r.esito.righe) tolto(x.id)
  return { t: Date.now(), righe: r.esito.righe.map(({ id, n, tot }) => ({ id, n, tot })), tot: r.esito.tot, risparmio: r.esito.risparmio }
}
