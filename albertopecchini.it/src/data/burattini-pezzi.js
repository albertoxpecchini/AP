// Generato da tools/mascotte/burattini.mjs usa: i pezzi dei burattini in
// public/media/mascotte/<nome>/<pezzo>.webp, con misure, perno (il fermacampioni
// trovato dallo script) e occhi, in pixel dell'immagine del pezzo. Il montaggio
// (dove si attacca ogni pezzo, quanto gira) sta a mano in burattini.js.

export const pezzi = {
  airone: {
    scala: 0.5,
    pezzi: {
      testa: { w: 326, h: 224, pin: [102, 141.3], eyes: [{ x: 187, y: 99, rx: 26.3, ry: 26.8, skin: '#bfb989' }, { x: 250.5, y: 109.5, rx: 19.3, ry: 23.3, skin: '#f6c556' }] },
      corpo: { w: 456, h: 602, pin: [164, 259.5], eyes: [] },
      collo: { w: 204, h: 360, pin: [127.8, 324.8], eyes: [] },
      zampaAlzata: { w: 188, h: 250, pin: [87.5, 34], eyes: [] },
      ala: { w: 328, h: 416, pin: [293, 36], eyes: [] },
      zampa: { w: 212, h: 446, pin: [77.3, 36], eyes: [] },
    },
  },
  gazza: {
    scala: 0.5,
    pezzi: {
      testa: { w: 372, h: 340, pin: [333.8, 229.3], eyes: [{ x: 87, y: 123, rx: 19.8, ry: 27.8, skin: '#666369' }, { x: 196.8, y: 100.8, rx: 30.5, ry: 32.5, skin: '#394251' }] },
      ala: { w: 362, h: 240, pin: [31.3, 54.5], eyes: [] },
      corpo: { w: 350, h: 340, pin: null, eyes: [] },
      coda: { w: 448, h: 478, pin: [31, 441.5], eyes: [] },
      zampa: { w: 182, h: 250, pin: [134.3, 31.8], eyes: [] },
      zampa2: { w: 164, h: 246, pin: [47.8, 33], eyes: [] },
    },
  },
  lumaca: {
    scala: 0.5,
    pezzi: {
      guscio: { w: 544, h: 594, pin: [318.5, 396.8], eyes: [] },
      peduncolo: { w: 136, h: 376, pin: [65.8, 321.5], eyes: [{ x: 66.8, y: 73.3, rx: 45.5, ry: 45.5, skin: '#97745d' }] },
      peduncolo2: { w: 138, h: 370, pin: [47.3, 315.3], eyes: [{ x: 72.3, y: 69.5, rx: 44, ry: 44.3, skin: '#987760' }] },
      corpo: { w: 688, h: 508, pin: [364.5, 406.5], eyes: [] },
      stazione: { w: 166, h: 322, pin: [62.8, 282], eyes: [] },
    },
  },
  tartaruga: {
    scala: 0.5,
    pezzi: {
      testa: { w: 266, h: 170, pin: [227.5, 97], eyes: [{ x: 40, y: 69.5, rx: 22.8, ry: 25.8, skin: '#aa8663' }, { x: 134.5, y: 69.5, rx: 25.8, ry: 25.8, skin: '#9f7d60' }] },
      corpo: { w: 688, h: 420, pin: [557.8, 212], eyes: [] },
      mascella: { w: 232, h: 104, pin: [194, 42.5], eyes: [] },
      elmetto: { w: 232, h: 134, pin: [196.3, 96.8], eyes: [] },
      collo: { w: 250, h: 130, pin: null, eyes: [] },
      anteriore: { w: 172, h: 272, pin: [62.5, 102], eyes: [] },
      posteriore: { w: 204, h: 264, pin: [77.3, 147.3], eyes: [] },
      coda: { w: 182, h: 112, pin: [39, 46.3], eyes: [] },
    },
  },
  vespa: {
    scala: 0.5,
    pezzi: {
      ala: { w: 534, h: 334, pin: [30.5, 305], eyes: [] },
      testa: { w: 338, h: 242, pin: [300.3, 136], eyes: [{ x: 53.8, y: 124.8, rx: 30.5, ry: 36.5, skin: '#fcd92d' }, { x: 171.8, y: 121.3, rx: 38, ry: 39, skin: '#dba733' }] },
      ala2: { w: 400, h: 126, pin: [28.8, 76.8], eyes: [] },
      corpo: { w: 664, h: 416, pin: [420.5, 242.5], eyes: [] },
      addome: { w: 360, h: 286, pin: [29.5, 48.8], eyes: [] },
      antenna: { w: 304, h: 192, pin: [274, 132.3], eyes: [] },
      antenna2: { w: 312, h: 190, pin: [28.5, 139], eyes: [] },
    },
  },
}
