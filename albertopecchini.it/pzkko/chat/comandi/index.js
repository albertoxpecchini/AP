// I comandi della chat col bot, una famiglia per file. Ogni comando: { nomi: ['pesca', 'fish'] (il primo è quello vero,
// gli altri alias), cat: la categoria dell'aiuto, icona, breve: una riga per l'elenco, uso: come si scrive, attesa: i
// secondi prima di poterlo rifare (0 = mai), senzaEventi: niente eventi casuali dopo, nascosto: non nei suggerimenti,
// fai(ctx): quello che fa (→ false: niente attesa, es. manca l'attrezzo) }.

import { SOLDI } from './soldi.js'
import { ATTIVITA } from './attivita.js'
import { LAVORO } from './lavoro.js'
import { GIOCHI } from './giochi.js'
import { NEGOZIO } from './negozio.js'
import { APP } from './app.js'
import { GIOCATORI } from './giocatori.js'
import { SVAGO } from './svago.js'

export const CATEGORIE = [
  ['soldi', 'i soldi', ':pzk:'],
  ['attività', 'le attività', ':canna:'],
  ['lavoro', 'il lavoro', ':rider:'],
  ['giochi', 'i giochi', ':carte:'],
  ['negozio', 'lo zaino e il negozio', ':zaino:'],
  ['app', 'telefono, sfide e side quest', ':telefono:'],
  ['giocatori', 'i giocatori', ':trofeo:'],
]
export const COMANDI = [...SOLDI, ...ATTIVITA, ...LAVORO, ...GIOCHI, ...NEGOZIO, ...APP, ...GIOCATORI, ...SVAGO]
export const PER_NOME = new Map(COMANDI.flatMap((c) => c.nomi.map((n) => [n, c])))
