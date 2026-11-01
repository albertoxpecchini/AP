// La logica del Profilo (26.10) in comune col profilo del cercapersone zero (telefono/zero/os/profilo.js) e con la pagina
// /oggetti/ (oggetti/oggetti.js, facce): la faccia (gli avatar di art/chat-avatar/ e gli adesivi del bot, in cinque rarità:
// cinque comuni sono di tutti, le altre si comprano coi $pzk, le leggendarie vanno prima sbloccate), il colore, la cornice e
// il motto. Si salvano nello zaino e col conto vanno nella riga pubblica del database (api/_giocatori.mjs): nell'app
// Giocatori gli altri vedono la tua faccia, il colore e il motto. (31.10) L'interfaccia HTML di qui (le schede profilo e
// modifica, il cartellino, i numeri) se n'è andata col cercapersone vecchio.
// (31.10, Alberto: «il browser non decide più niente») comprare una faccia e salvare il profilo sono azioni della banca
// (giochi/app-profilo.mjs sul server di Alberto, «profilo.compraFaccia» e «profilo.salva»): i prezzi sono i suoi, e salva solo
// le facce tue, i colori e le cornici di queste liste, il motto corto. Le liste e i prezzi qui servono a mostrarli.

import * as zaino from '../../chat/zaino.js'
import * as pzk from '../../games/pzk.js'
import { nomeDi } from '../../chat/testi.js'
import { esiste } from '../../chat/icone.js'

// i colori del cartellino e le cornici: solo questi nomi vanno sul server (che controlla la forma, non la lista)
export const COLORI = { verde: '#46ff7d', giallo: '#ffd400', rosso: '#ff5a4a', arancio: '#ff9a3c', rosa: '#ff7ac8', viola: '#b47cff', blu: '#4aa8ff', bianco: '#e9efe6' }
export const CORNICI = [['nastro', 'nastro'], ['oro', 'oro'], ['neon', 'neon'], ['pixel', 'pixel'], ['nessuna', 'niente']]
// le facce, per rarità (26.10, Alberto: «rankale come comuni rare… e mettile a pagamento almeno il 70 %»): cinque comuni sono
// di tutti, le altre 28 su 33 (85 %) si comprano coi $pzk; le leggendarie, prima, vanno anche sbloccate
export const RARITA = {
  comune: { nome: 'comune', colore: '#b9c4b4', prezzo: 250 },
  'non-comune': { nome: 'non comune', colore: '#46ff7d', prezzo: 600 },
  raro: { nome: 'raro', colore: '#4aa8ff', prezzo: 1500 },
  epico: { nome: 'epico', colore: '#b47cff', prezzo: 4000 },
  leggendario: { nome: 'leggendario', colore: '#ffd400', prezzo: 12000 },
}
const GRATIS = new Set(['bot', 'bot-occhiolino', 'bot-ride', 'nutria', 'piccione'])
const raro = (id) => (zaino.stato().rari ?? []).includes(id)
const AVATAR = [
  ...['bot', 'bot-occhiolino', 'bot-ride', 'nutria', 'piccione', 'bot-pensa', 'rana', 'zanzara', 'riccio', 'zucca', 'tortelli'].map((id) => [id, 'comune']),
  ...['volpe', 'cinghiale', 'cervo', 'luccio', 'siluro', 'peluche', 'av-piccione', 'av-zucca', 'av-rana'].map((id) => [id, 'non-comune']),
  ...['av-nutria', 'av-carpa', 'av-zanzara', 'av-gatto', 'av-tortello', 'av-pager'].map((id) => [id, 'raro']),
  ...['av-virgilio', 'av-gonzaga', 'av-nonna'].map((id) => [id, 'epico']),
  ['bot-ricco', 'leggendario', () => (zaino.livello() >= 10 ? null : 'arriva al livello 10')],
  ['carpa-oro', 'leggendario', () => (raro('carpa-oro') ? null : 'pesca la carpa d’oro')],
  ['drago', 'leggendario', () => (raro('drago') ? null : 'caccia il drago')],
  ['tesoro', 'leggendario', () => (raro('tesoro') ? null : 'scava il tesoro')],
].filter(([id]) => esiste(id))
const PER_AV = Object.fromEntries(AVATAR.map(([id, r, s]) => [id, { r, s }]))
export const rarita = (id) => RARITA[PER_AV[id]?.r] ?? null
const bloccato = (id) => PER_AV[id]?.s?.() ?? null
const prezzo = (id) => (GRATIS.has(id) ? 0 : rarita(id)?.prezzo ?? 0)
const mio = (id) => GRATIS.has(id) || (zaino.profilo().avs ?? []).includes(id)
/** Le facce con la rarità, il prezzo e se sono tue (la pagina /oggetti/). */
export const facce = () => AVATAR.map(([id]) => ({ id, rarita: rarita(id), prezzo: prezzo(id), mia: mio(id), bloccata: mio(id) ? null : bloccato(id) }))
/** La faccia di uno: quella scelta se c'è, se no il mestiere, se no il bot. */
export const faccia = (av, mest) => (av && esiste(av) ? av : mest && esiste(mest) ? mest : 'bot')

export const nomeAv = (id) => (id.startsWith('av-') ? id.slice(3) : nomeDi(id))
/** Compra una faccia (la banca, coi suoi prezzi). Il profilo del cercapersone zero (telefono/zero/os/profilo.js) passa
 *  da qui: una regola sola. → Promise<{ ok: true } | { ok: false, errore, bloccata }> */
export async function compraFaccia(id) {
  const b = bloccato(id)
  if (b) return { ok: false, errore: `prima va sbloccata: ${b}`, bloccata: true }
  const d = await pzk.fai('profilo.compraFaccia', { id })
  return d?.ok ? { ok: true } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova', bloccata: !!d?.bloccata }
}
/** Salva i pezzi del profilo che cambiano ({ av?, col?, cor?, mot? }) sulla banca. → Promise<{ ok } | { ok: false, errore }> */
export async function salva(cambia) {
  const d = await pzk.fai('profilo.salva', cambia)
  return d?.ok ? { ok: true } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
}
