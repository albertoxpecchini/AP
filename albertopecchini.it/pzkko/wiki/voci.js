// Le voci di pzkkopedia (2.11): unisce i moduli di voci/*.js in VOCI (titolo → voce) e dice per ogni titolo in quale
// modulo sta (FILE_DI), così «Modifica» e «Il testo su GitHub» portano al file giusto. Il formato di una voce
// ({ data, fonti, testo }) e i titoli canonici sono in tools/pzkko/wiki/README.md. voci/dati.js e cronologia.js li
// genera tools/pzkko/wiki/genera.mjs; gli altri moduli si scrivono a mano.
//
// LA REGOLA (Alberto, 2.11.2026: «ricorda che ad ogni push nuovo bisogna aggiornarla»): prima di ogni push su main,
// `node tools/pzkko/wiki/aggiorna.mjs` e le voci rimaste indietro si rileggono. Lo controlla tools/pzkko/wiki/controlla.mjs.

import { VOCI as principale } from './voci/principale.js'
import { VOCI as sito } from './voci/sito.js'
import { VOCI as scena } from './voci/scena.js'
import { VOCI as giochi } from './voci/giochi.js'
import { VOCI as cercapersone } from './voci/cercapersone.js'
import { VOCI as chat } from './voci/chat.js'
import { VOCI as dietro } from './voci/dietro.js'
import { VOCI as memoria } from './voci/memoria.js'
import { VOCI as dati } from './voci/dati.js'

export const MODULI = { principale, sito, scena, giochi, cercapersone, chat, dietro, memoria, dati }

export const VOCI = {}
export const FILE_DI = {}
for (const [modulo, voci] of Object.entries(MODULI)) {
  for (const [chiave, voce] of Object.entries(voci)) {
    const titolo = chiave.replace(/'/g, '’').replace(/\s+/g, ' ').trim() // l'apostrofo tipografico, come nei link
    if (Object.hasOwn(VOCI, titolo)) { console.warn(`[pzkkopedia] «${titolo}» è scritta due volte (${FILE_DI[titolo]}.js e ${modulo}.js): vale la prima`); continue }
    VOCI[titolo] = voce
    FILE_DI[titolo] = modulo
  }
}
