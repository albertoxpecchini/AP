// I burattini del piè di pagina: la chiocciola, la nutria, l'airone, la gazza
// e la vespa (tools/mascotte, comando «burattini»). I pezzi, con misure, perno e
// occhi, li scrive lo script in burattini-pezzi.js; qui si monta a mano ciascun
// animale.
//
// Tutte le misure sono in pixel dell'immagine del pezzo (public/media/mascotte/<nome>/<pezzo>.webp).
//   parent   il pezzo a cui è attaccato (il primo pezzo, senza parent, è il corpo)
//   at       dove va il perno del pezzo, nelle coordinate del genitore
//   z        -1 dietro al genitore, 1 (o più) davanti
//   rest     angolo a riposo, in gradi (positivo = orario)
//   min/max  escursione rispetto al riposo, in gradi
//   tip      la punta del pezzo (becco, pungiglione…): con `look` il pezzo la gira
//            verso il puntatore, `look` è quanto (0–1)
//   drag     si può tirare col puntatore; `k` è la rigidità della molla che lo
//            riporta a riposo (bassa = molle, alta = scatta), `damp` lo smorzamento
//            (0,32 di solito: ricade oscillando; verso 1 si ferma composto)
//   pin      corregge il perno trovato dallo script
//   skin     corregge il colore delle palpebre (testa)
//   hide     come si ritira il pezzo: { x, y } spostamento in % del pezzo stesso
//            (nelle direzioni del genitore; con `own` nelle sue, lungo il pezzo
//            anche quando gira), s scala, r rotazione in gradi, tutti a ritiro
//            completo; `out` quanto può uscire oltre il riposo, `manual` se lo
//            muove solo il carattere (il ciuffo d'erba della nutria che si
//            consuma); il ritiro lo comanda il carattere (i peduncoli della
//            chiocciola)
//   img      usa l'immagine di un altro pezzo (il braccio lontano della nutria)
//   mouth    [x, y, w, h] il buio della bocca, dietro al pezzo: si vede quando
//            la mascella si apre
// `scena` (per animale) va allo script così com'è: `lift` il corpo si solleva
// col mouse, `blink` quanto dura un battito di palpebre in ms.
// Il carattere di ciascuno (i peduncoli che si ritirano, la nutria che mangia
// e strappa l'erba, l'inchino dell'airone, la gazza che nasconde la chiave, la
// vespa che prende la mira) sta in src/client/puppet.js.

import { pezzi } from './burattini-pezzi.js'

export const burattini = {
  lumaca: {
    alt: 'La chiocciola gigante africana, burattino del sito',
    parti: {
      corpo: {},
      peduncolo: { parent: 'corpo', at: [548, 52], z: -1, rest: -14, min: -20, max: 16, look: 0.3, tip: [66.8, 73.3], drag: true, k: 55, damp: 0.4, hide: { s: 0.06 } },
      peduncolo2: { parent: 'corpo', at: [606, 58], z: -1, rest: 16, min: -16, max: 20, look: 0.3, tip: [72.3, 69.5], drag: true, k: 55, damp: 0.4, hide: { s: 0.06 } },
      guscio: { parent: 'corpo', at: [285, 335], pin: [365, 554.5], z: 1, min: -5, max: 5, drag: true, k: 160 },
      stazione: { parent: 'corpo', at: [655, 488], z: 2, min: -9, max: 9, drag: true, k: 120 },
    },
  },
  // La nutria (18.10.2026, al posto della tartaruga): di profilo, seduta, il
  // corpo è il tronco. La testa sta sulle spalle (perno dietro la nuca) e la
  // mascella dietro alla testa si apre in negativo (masticate, boccone, con il
  // buio della bocca `mouth`). Il braccio vicino gira sulla spalla: a riposo
  // (rest 30) porta la mano alla bocca, verso -90 scende al cespo; quello
  // lontano riusa la stessa immagine (`img`), più scuro in CSS, dietro al
  // corpo. Il ciuffo d'erba sta nella mano (figlio del braccio) e si consuma
  // riducendosi intorno al perno (`hide` manuale, dal carattere). Il piede e
  // la coda dietro al corpo; il cespo a terra davanti, senza perno suo (il
  // perno è il centro della base), oscilla quando lo si strappa. `lift`: il
  // corpo si prende col mouse e si solleva, lei scalcia.
  nutria: {
    alt: 'La nutria golosa, burattino del sito',
    scena: { lift: true },
    parti: {
      corpo: {},
      coda: { parent: 'corpo', scala: 0.66, at: [183, 467], z: -1, min: -30, max: 12, drag: true, k: 60, damp: 0.35 },
      cespo: { parent: 'corpo', scala: 0.7, at: [-5, 490], pin: [119, 192], z: -1, min: 0, max: 0, k: 160, damp: 0.3 },
      zampa: { parent: 'corpo', scala: 0.55, at: [120, 440], z: -1, min: -25, max: 20, drag: true, k: 150, damp: 0.5 },
      braccio2: { img: 'braccio', parent: 'corpo', scala: 0.9, at: [95, 178], z: -1, rest: 38, min: -100, max: 8, k: 90, damp: 0.7 },
      // davanti anche alla testa (z 3): la mano sta sotto il muso, come nell'intero
      braccio: { parent: 'corpo', scala: 0.9, at: [73, 187], z: 3, rest: 38, min: -100, max: 8, drag: true, k: 90, damp: 0.7 },
      // il ciuffo nella mano: il perno è dove la mano lo stringe; `s` è quanto
      // ne resta quando è tutto mangiato
      erba: { parent: 'braccio', scala: 0.5, at: [40, 90], z: -1, rest: -22, min: -12, max: 12, drag: true, k: 120, damp: 0.4, hide: { manual: true, s: 0.12 } },
      // min < max in modulo: il tocco (grab senza trascinare) la fa scattare col naso in su
      testa: { parent: 'corpo', at: [201, 66], z: 2, min: -20, max: 22, look: 0.35, tip: [90, 150], drag: true, k: 90, damp: 0.5, mouth: [72, 212, 120, 46, -6] },
      mascella: { parent: 'testa', scala: 0.85, at: [260, 187], z: -1, min: -32, max: 4, drag: true, k: 160, damp: 0.5 },
    },
  },
  airone: {
    alt: "L'airone elegante, burattino del sito",
    parti: {
      corpo: {},
      zampa: { parent: 'corpo', at: [292, 440], z: -1, min: -8, max: 8, drag: true, k: 160 },
      zampaAlzata: { parent: 'corpo', at: [322, 432], z: -1, min: -40, max: 35, drag: true, k: 70 },
      collo: { parent: 'corpo', at: [372, 238], z: 1, min: -14, max: 22, look: 0.25, tip: [105, 40], drag: true, k: 45, damp: 0.75 },
      testa: { parent: 'collo', at: [108, 42], z: 1, min: -30, max: 30, look: 0.7, tip: [318, 200], drag: true, k: 60, damp: 0.7, skin: '#e7e3da' },
      ala: { parent: 'corpo', at: [345, 262], z: 2, min: -8, max: 75, drag: true, k: 55 },
    },
  },
  gazza: {
    alt: 'La gazza furbissima, burattino del sito',
    parti: {
      corpo: {},
      coda: { parent: 'corpo', at: [300, 225], z: -1, min: -18, max: 28, drag: true, k: 110 },
      zampa: { parent: 'corpo', at: [150, 300], z: -1, min: -25, max: 25, drag: true, k: 180 },
      zampa2: { parent: 'corpo', at: [215, 305], z: -1, min: -25, max: 25, drag: true, k: 180 },
      testa: { parent: 'corpo', at: [95, 60], z: 1, min: -28, max: 22, look: 0.55, tip: [35, 176], drag: true, k: 260, skin: '#2f3440' },
      ala: { parent: 'corpo', at: [120, 110], z: 2, min: -55, max: 12, drag: true, k: 120 },
    },
  },
  vespa: {
    alt: 'La vespa cattiva ma precisa, burattino del sito',
    parti: {
      corpo: {},
      addome: { parent: 'corpo', at: [400, 110], z: -1, min: -38, max: 42, look: 0.95, tip: [345, 270], drag: true, k: 220 },
      ala2: { parent: 'corpo', at: [345, 50], z: 1, min: -30, max: 30, drag: true, k: 90 },
      ala: { parent: 'corpo', at: [330, 40], z: 2, min: -30, max: 30, drag: true, k: 90 },
      testa: { parent: 'corpo', at: [235, 95], z: 3, min: -15, max: 15, look: 0.25, tip: [0, 136], drag: true, k: 160, skin: '#f0cb2c' },
      antenna: { parent: 'testa', at: [130, 30], z: -1, rest: 49, min: -30, max: 30, drag: true, k: 70 },
      antenna2: { parent: 'testa', at: [190, 25], z: -1, rest: -47, min: -30, max: 30, drag: true, k: 70 },
    },
  },
}

/** Pezzi e montaggio insieme: per ogni parte misure, perno, occhi e regole. */
export function burattino(nome) {
  const rig = burattini[nome]
  const img = pezzi[nome]?.pezzi
  if (!rig || !img) return null
  const parti = Object.entries(rig.parti).map(([id, p]) => {
    const i = img[p.img || id]
    // `scala` riduce il pezzo (la mascella, il braccio, la coda della nutria):
    // misure, perno, occhi, punta e bocca sono in pixel dell'immagine e si
    // riducono con lui
    const s = p.scala || 1
    const sc = (v) => (v ? v.map((n, k) => (k < 4 ? n * s : n)) : v)
    const eyes = i.eyes.map((e) => ({ x: e.x * s, y: e.y * s, rx: e.rx * s, ry: e.ry * s, skin: p.skin || e.skin }))
    return { id, ...p, w: i.w * s, h: i.h * s, pin: p.parent ? sc(p.pin || i.pin) : [0, 0], tip: sc(p.tip), mouth: sc(p.mouth), eyes, rest: p.rest || 0, z: p.z || 0 }
  })
  return { nome, alt: rig.alt, scena: rig.scena, parti }
}
