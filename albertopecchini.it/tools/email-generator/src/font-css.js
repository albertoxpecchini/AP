// Regola @font-face del carattere incorporato. Modulo puro: il base64 del file
// woff2 arriva da fonts.js (lettura dal disco) o dal browser (fetch).

/**
 * `font-weight: 100 900` dichiara l'asse variabile; i client che non
 * supportano le varianti variabili ricadono sul peso statico più vicino.
 */
export function fontFaceCss(base64) {
  return `@font-face {
      font-family: 'Archivo Variable';
      font-style: normal;
      font-display: swap;
      font-weight: 100 900;
      src: url(data:font/woff2;charset=utf-8;base64,${base64}) format('woff2-variations');
    }`
}
