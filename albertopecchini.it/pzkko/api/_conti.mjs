// I conti del wallet dei $pzk (api/wallet.mjs): dove stanno e i conti che fanno tutti insieme (la capitalizzazione, che
// api/borsa.mjs mostra). Un file solo, pzkko/wallet.json: pochi conti, e così un invio fra due conti è una scrittura sola.
export const PATH = process.env.WALLET_BLOB_PATH || 'pzkko/wallet.json'
export const vuoto = () => ({ conti: [] })

/** I $pzk e gli EUR€ di tutti i conti insieme (la capitalizzazione: all'inizio 1.000, il conto di Alberto). */
export const offerta = (db) => {
  let pzk = 0, eur = 0
  for (const c of db?.conti ?? []) { pzk += c.pzk || 0; eur += c.eur || 0 }
  return { pzk: Math.round(pzk * 2) / 2, eur: Math.round(eur * 100) / 100, conti: db?.conti?.length ?? 0 }
}
