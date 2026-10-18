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
  nutria: {
    w: 1062,
    h: 905,
    alt: 'La nutria golosa, mascotte del sito',
    eyes: [{ x: 20.57, y: 14.42, rx: 1.88, ry: 2.32, skin: '#6a5243' }, { x: 32.3, y: 15.14, rx: 2.4, ry: 2.93, skin: '#60493b' }],
    nose: { x: 18.4, y: 23.5, rx: 5, ry: 6 },
  },
}
