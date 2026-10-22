// /api/borsa: la borsa dei $pzk di pzkko.it (il cambio PZK/EUR€). La funzione sta in pzkko/api/borsa.mjs, così va online
// anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko; finché la radice è qui, la pubblica
// questo file (come api/meteo.js e api/firme.js).
export { default } from '../pzkko/api/borsa.mjs'
