// La macchina del tempo (/tempo/): i siti e le loro versioni, una per giorno di lavoro.
// I manifesti stanno in src/data/tempo/<id>.js, GENERATI da tools/tempo/tempo.mjs (uno per
// sito, così i siti si ricostruiscono insieme senza pestarsi i piedi); qui solo l'ordine.
// Dal 3.11.2026 i siti sono cinque, coi loro repository (tools/tempo/siti.mjs).

import ap from './tempo/ap.js'
import rivalta from './tempo/rivalta.js'
import cascina from './tempo/cascina.js'
import pzkko from './tempo/pzkko.js'
import bcp from './tempo/bcp.js'

export const siti = [ap, rivalta, cascina, pzkko, bcp].filter((s) => s.versioni.length)

// la home (src/templates/pages/home.js) racconta le versioni di albertopecchini.it
export const versioni = ap.versioni
export const aggiornato = siti.map((s) => s.aggiornato).sort().at(-1)
