// I premi della chat (giornaliero, settimanale, mensile): quanto valgono e ogni quanto tornano. Li chiede la chat
// (chat/comandi/soldi.js) e, col conto, li decide il server (api/wallet.mjs, azione «premio»), che tiene la serie nel conto:
// 27.10, Alberto ne aveva riscossi 20.000 di fila perché l'attesa stava solo nello zaino del browser, e due salvataggi dello
// zaino accavallati la perdevano.

const GIORNO = 24 * 3600_000
export const PREMI = {
  giornaliero: { ogni: GIORNO, base: 300, bonus: 50, max: 7, xp: 20 },
  settimanale: { ogni: 7 * GIORNO, base: 1500, bonus: 200, max: 4, xp: 60 },
  mensile: { ogni: 30 * GIORNO, base: 5000, bonus: 500, max: 3, xp: 150 },
}
/** Il moltiplicatore più alto che il server accetta dal browser (il livello e i bonus delle paghe: chat/zaino.js). */
export const MAX_MOLT = 3

/** La serie dopo questo premio: continua se si torna entro due periodi. `s`: { ultimo, n } o niente. */
export const serieDopo = (P, s, now) => (s?.ultimo && now - s.ultimo < 2 * P.ogni ? Math.min(P.max, (s.n ?? 0) + 1) : 1)
/** Quanto vale il premio con la serie n, prima del moltiplicatore. */
export const valore = (P, n) => P.base + P.bonus * (n - 1)
