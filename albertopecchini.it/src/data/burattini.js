// I burattini del piè di pagina: la chiocciola, la tartaruga, l'airone, la gazza
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
//            completo; `out` quanto può uscire oltre il riposo (il collo della
//            tartaruga che si allunga), `manual` se lo muove solo il carattere; il
//            ritiro lo comanda il carattere (i peduncoli della chiocciola, testa e
//            zampe della tartaruga)
//   img      usa l'immagine di un altro pezzo (le zampe lontane della tartaruga)
//   mouth    [x, y, w, h] il buio della bocca, dietro al pezzo: si vede quando
//            la mascella si apre
// `scena` (per animale) va allo script così com'è: `lift` il corpo si solleva
// col mouse, `blink` quanto dura un battito di palpebre in ms.
// Il carattere di ciascuno (i peduncoli che si ritirano, la tartaruga che si
// chiude nel guscio, l'inchino dell'airone, la gazza che nasconde la chiave, la
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
  // La tartaruga (rifatta il 1°.10.2026): di profilo, il guscio è il corpo. Il
  // collo, dietro al guscio, scorre lungo il proprio asse (hide.own) e porta
  // dentro la testa; le zampe salgono e si piegano sotto la corazza; la coda si
  // tira sotto. Le zampe lontane riusano le immagini di quelle vicine (`img`),
  // più scure in CSS. La mascella si apre (sbadiglio, morso), l'elmetto salta
  // (hide manuale, dal carattere) e scivola sugli occhi quando dorme. `lift`:
  // il guscio si prende col mouse e si solleva, lei scalcia.
  tartaruga: {
    alt: 'La tartaruga di terra, burattino del sito',
    scena: { lift: true, blink: 240 },
    parti: {
      corpo: {},
      // il perno del collo è a 184 px dalla punta, dentro al guscio; a riposo il
      // collo esce dalla corazza inclinato di 15° e la testa (rest -13) resta
      // quasi in piano; rientrando scorre di 160% della sua larghezza (400 px)
      collo: { parent: 'corpo', at: [158, 198], pin: [230, 65], z: -1, rest: 15, min: -24, max: 18, look: 0.22, tip: [40, 65], drag: true, k: 60, damp: 0.6, hide: { own: true, x: 160, out: 0.28 } },
      testa: { parent: 'collo', at: [58, 64], z: 1, rest: -13, min: -24, max: 24, look: 0.4, tip: [85, 158], drag: true, k: 80, damp: 0.55, mouth: [88, 156, 110, 60, -12] },
      // la mascella del modello è lunga quanto la testa: ridotta al 70%, perno al
      // fondo della bocca, si apre in negativo (la punta scende)
      mascella: { parent: 'testa', scala: 0.7, at: [188, 128], z: -1, min: -38, max: 5, drag: true, k: 140, damp: 0.5 },
      elmetto: { parent: 'testa', at: [208, 24], z: 1, rest: -5, min: -28, max: 22, drag: true, k: 150, damp: 0.45, hide: { manual: true, y: -45, r: -10 } },
      anteriore2: { img: 'anteriore', parent: 'corpo', at: [262, 262], pin: [108.3, 34], z: -2, min: -30, max: 26, drag: true, k: 130, damp: 0.5, hide: { y: -62, r: -30 } },
      anteriore: { parent: 'corpo', at: [185, 266], pin: [108.3, 34], z: -1, min: -30, max: 26, drag: true, k: 130, damp: 0.5, hide: { y: -62, r: -30 } },
      posteriore2: { img: 'posteriore', parent: 'corpo', at: [490, 278], pin: [136.3, 35], z: -2, min: -26, max: 26, drag: true, k: 130, damp: 0.5, hide: { y: -60, r: 25 } },
      posteriore: { parent: 'corpo', at: [560, 282], pin: [136.3, 35], z: -1, min: -26, max: 26, drag: true, k: 130, damp: 0.5, hide: { y: -60, r: 25 } },
      coda: { parent: 'corpo', at: [600, 350], z: -1, min: -30, max: 25, drag: true, k: 90, damp: 0.3, hide: { x: -70, y: -20, r: -25 } },
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
    // `scala` riduce il pezzo (la mascella della tartaruga): misure, perno,
    // occhi, punta e bocca sono in pixel dell'immagine e si riducono con lui
    const s = p.scala || 1
    const sc = (v) => (v ? v.map((n, k) => (k < 4 ? n * s : n)) : v)
    const eyes = i.eyes.map((e) => ({ x: e.x * s, y: e.y * s, rx: e.rx * s, ry: e.ry * s, skin: p.skin || e.skin }))
    return { id, ...p, w: i.w * s, h: i.h * s, pin: p.parent ? sc(p.pin || i.pin) : [0, 0], tip: sc(p.tip), mouth: sc(p.mouth), eyes, rest: p.rest || 0, z: p.z || 0 }
  })
  return { nome, alt: rig.alt, scena: rig.scena, parti }
}
