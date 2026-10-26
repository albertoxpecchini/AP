// I conti del wallet dei $pzk (api/wallet.mjs): dove stanno e i conti che fanno tutti insieme (la capitalizzazione, che
// api/borsa.mjs mostra). Un file solo, pzkko/wallet.json: pochi conti, e così un invio fra due conti è una scrittura sola.
import { offertaTotale } from './_economia.mjs'

export const PATH = process.env.WALLET_BLOB_PATH || 'pzkko/wallet.json'
export const vuoto = () => ({ conti: [] })

/** I $pzk che esistono (dal 26.10, _economia.mjs: i giocatori, la cassa di pzk, i portafogli smarriti), gli EUR€ dei
 *  giocatori, quanti conti; e il conio e la distruzione di oggi e di ieri. */
export const offerta = (db) => offertaTotale(db)
