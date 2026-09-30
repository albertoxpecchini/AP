// L'aragosta di fiume della home: dorme sopra «Disponibile per nuovi incarichi»,
// e quando il visitatore sta fermo si sveglia e riempie d'inchiostro PECCHINI con
// l'annaffiatoio azzurro. I pezzi (con misure, perno e occhi) li scrive
// tools/aragosta/aragosta.mjs in aragosta-pezzi.js; qui si monta a mano, come i
// burattini del piè di pagina (src/data/burattini.js). Il movimento e
// l'inchiostro stanno in src/client/ink.js.
//
// Misure in pixel dell'immagine del pezzo (public/media/aragosta/<pezzo>.webp).
//   parent  il pezzo a cui è attaccato (il corpo non ne ha)
//   at      dove va il perno del pezzo, nelle coordinate del genitore
//   pin     corregge il perno trovato dallo script
//   scale   grandezza rispetto al corpo: i pezzi del foglio non escono tutti in
//           scala (le chele e l'annaffiatoio sono più grandi che nell'intero)
//   flip    specchiato in orizzontale (le antenne, disegnate col perno a destra)
// `ordine` è l'ordine di disegno, dal fondo: le chele escono da dietro la testa
// (così i perni restano nascosti) e l'annaffiatoio sta davanti a tutto; `presa`
// ridisegna la sola pinza sopra il manico, perché lo stringa.
// Gli angoli delle pose sono in gradi, positivi in senso orario; `y` è quanto il
// corpo si alza (negativo = su), in pixel del corpo; `lid` quanto sono chiuse
// le palpebre (0–1).

import { pezzi } from './aragosta-pezzi.js'

export const aragosta = {
  alt: 'L’aragosta di fiume rossa con l’annaffiatoio azzurro',
  // dove poggiano le zampe, e il punto su cui il corpo si inclina
  ground: 284,
  pivot: [250, 284],
  parti: {
    corpo: {},
    antenna2: { parent: 'corpo', at: [150, 62], scale: 0.8, flip: true },
    antenna: { parent: 'corpo', at: [118, 70], scale: 0.84, flip: true },
    coda: { parent: 'corpo', at: [362, 124], scale: 0.9 },
    chela: { parent: 'corpo', at: [90, 158], scale: 0.93 },
    annaffiatoio: { parent: 'chela', at: [60, 110], pin: [190, 60], scale: 0.7 },
    chela2: { parent: 'corpo', at: [205, 200], scale: 0.78 },
  },
  ordine: ['antenna2', 'antenna', 'coda', 'chela', 'chela2', 'corpo', 'annaffiatoio', 'presa'],
  presa: { pezzo: 'chela', clip: [0, 0, 118, 156] },
  // la bocca del beccuccio e la direzione in cui esce l'inchiostro, in pixel di annaffiatoio.webp
  spout: { tip: [21, 131], dir: [-0.72, -0.69] },
  pose: {
    // l'annaffiatoio poggia sull'etichetta, la chela sul manico
    dorme: { y: 0, r: 1.5, coda: 7, chela: 8, annaffiatoio: -9.5, chela2: 0, antenna: 12, antenna2: 9, lid: 1 },
    // sveglia: lo alza appena, dritto
    sveglia: { y: 0, r: -2, coda: -5, chela: 16, annaffiatoio: -14, chela2: 6, antenna: -4, antenna2: -7, lid: 0 },
    // versa: il manico sale, il beccuccio scende di 55° e resta sopra l'etichetta
    versa: { y: 0, r: -4, coda: 0, chela: 24, annaffiatoio: -75, chela2: 3, antenna: -2, antenna2: -5, lid: 0.1 },
    // guarda le gocce che cadono, un po' in pensiero
    guarda: { y: 0, r: -4, coda: 2, chela: 21, annaffiatoio: -17, chela2: 2, antenna: 2, antenna2: -2, lid: 0 },
  },
  pezzi,
}
