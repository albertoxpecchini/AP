// La logica del Decifratore (26.10), per l'app del cercapersone zero (dall'1.11 telefono/zero/os/decifratore.js): si compra
// nel pzkstore (dal 29.10, telefono/app/pzkstore.js: 1.500 $pzk puliti) o dalla chat («installa decifratore»,
// chat/comandi/app.js, che passa dallo stesso pzkstore) e apre i wallet pzk e le chiavette usb che lo spazzino trova sul
// nastro (chat/minigiochi.js, nastro). Ogni pezzo vuole tre giochini di decodifica, facili (PEGI 13): la parola spostata di
// una lettera (il cifrario di Cesare), il numero in binario, la sequenza da completare, la parola allo specchio. Due errori si
// perdonano, al terzo il wallet si blocca (resta nello zaino: si riprova). Aperto, i $pzk escono dal fondo dei portafogli
// smarriti (api/wallet.mjs, decifra: tre al giorno): soldi puliti, perché erano destinati a sparire. Il pezzo aperto lascia
// lo zaino.
//
// DAL 31.10 I GIOCHINI LI PREPARA LA BANCA (Alberto: «decifra un wallet devi farlo se hai un wallet»; giochi/app-decifratore.mjs
// sul server di Alberto): 'decifratore.apri' (apri) controlla che il decifratore sia installato e il pezzo nello zaino, e
// manda un giochino alla volta senza la risposta; 'decifratore.risolvi' (risolvi) dice se è giusta; risolti tutti e tre,
// pzk.decifra(v.tipo) (la banca: consuma il pezzo e paga). (31.10) L'interfaccia HTML di qui (la lista dei pezzi, lo schermo
// del giochino, le scelte) se n'è andata col cercapersone vecchio; dall'1.11 la faccia è l'app di pzk os (os/decifratore.js).

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'

// le parole intorno al codice, per tipo di giochino (il codice e le scelte li manda la banca): { testo, codice }, da scrivere
// sull'lcd di pzk os (os/decifratore.js; fino al 31.10 erano html, con <code>, per il cercapersone nero)
export const DOMANDE = {
  cesare: (c) => ({ testo: 'ogni lettera è spostata di uno in avanti (A→B). Cosa c’era scritto?', codice: c }),
  binario: (c) => ({ testo: 'il pin è in binario: quanto fa in decimale? Da destra le cifre valgono 1, 2, 4, 8.', codice: c }),
  sequenza: (c) => ({ testo: 'la chiave è una sequenza: qual è il numero dopo?', codice: `${c} · ?` }),
  specchio: (c) => ({ testo: 'la password è scritta al contrario: qual è?', codice: c }),
}
/** Quanti $pzk ci sono dentro, da quanto a quanto (wallet.mjs, decifra: le regole della banca, qui solo da scrivere). */
export const DENTRO = { wallet: [150, 1500], chiavetta: [400, 4000] }
/** I pezzi che si decifrano: l'id nello zaino → [il tipo per la banca, il nome]. */
export const TIPI = { 'wallet-pzk': ['wallet', 'wallet pzk cifrato'], chiavetta: ['chiavetta', 'chiavetta usb'] }
/** I pezzi da decifrare nello zaino: [[id, quanti]]. */
export const pezzi = () => Object.keys(TIPI).map((id) => [id, zaino.quanti(id)]).filter(([, n]) => n > 0)
/** Quanti ne ha decifrati oggi il conto (al più tre al giorno). */
export const decifratiOggi = () => pzk.conto()?.decifrati ?? 0
const nonRisponde = (d) => ({ ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' })

/** Apre un pezzo sulla banca: il primo giochino. → { ok, v: { tipo, i, errori, prova: { k, codice, scelte } } } | { ok: false, errore } */
export async function apri(id) {
  const d = await pzk.fai('decifratore.apri', { tipo: TIPI[id][0] })
  return d?.ok ? { ok: true, v: d.esito } : nonRisponde(d)
}
/** Una risposta: la banca dice se è giusta. → { ok, e: { giusta, bloccato, sparito, risolto, … e il giochino dopo, come v } }
 *  | { ok: false, errore }. Bloccato: tre errori (o sparito: il pezzo non è più nello zaino). Risolto: tocca a pzk.decifra(v.tipo). */
export async function risolvi(risposta) {
  const d = await pzk.fai('decifratore.risolvi', { risposta })
  return d?.ok ? { ok: true, e: d.esito } : nonRisponde(d)
}
