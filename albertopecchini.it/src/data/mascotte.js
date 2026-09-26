// Generato da tools/mascotte/mascotte.mjs (occhi trovati dallo script; il naso si segna a mano).
// Le mascotte in public/media/mascotte/<nome>.webp. Centro e semiassi in percentuale:
// x e rx sulla larghezza dell'immagine, y e ry sull'altezza. `skin` è il colore della palpebra.
// Le usa mascot() in src/templates/components/ui.js e src/client/mascot.js le anima.

export const mascotte = {
  lumaca: {
    w: 1099,
    h: 988,
    alt: 'La chiocciola gigante africana, mascotte del sito',
    eyes: [{ x: 71.11, y: 9.06, rx: 5.19, ry: 5.67, skin: '#947664' }, { x: 92.36, y: 14.93, rx: 5.05, ry: 5.57, skin: '#967766' }],
    nose: { x: 74, y: 41, rx: 10, ry: 11 },
  },
  tartaruga: {
    w: 1193,
    h: 966,
    alt: 'La tartaruga di terra, mascotte del sito',
    eyes: [{ x: 11.94, y: 32.71, rx: 3.1, ry: 5.54, skin: '#c1985b' }, { x: 28.25, y: 28, rx: 4.15, ry: 5.8, skin: '#be9257' }],
    nose: { x: 20, y: 36, rx: 6.5, ry: 8 },
  },
}
