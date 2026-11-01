// Le regole della Rapina (26.10, Alberto: «modalità rapina con rischio prigione, minimo in due, contro pzk») in comune con la
// rapina del cercapersone zero (telefono/zero/os/rapina.js): il colpo alla cassa di pzk (api/wallet.mjs, colpo; pzk.colpo e
// pzk.cauzione in games/pzk.js). Chi organizza apre il colpo e ha un codice di quattro lettere da dare ai complici; i
// complici entrano col codice (al più quattro); chi ha organizzato dà il via. Va a segno nel 32 % dei casi in due, 40 % in
// tre, 48 % in quattro; il bottino (il 3 % della cassa più l'1 % a testa, al più 15.000 a testa) è SPORCO: si vede nel saldo
// ma con pzk non si spende (la lavatrice lo pulisce, o 96 giorni). Se va male: sei ore di galera e una multa (il 20 % dei
// puliti, al più 5.000). Un colpo al giorno, col conto di almeno 48 ore. In galera si esce prima con la cauzione (3.000 $pzk
// puliti). (31.10) L'interfaccia HTML di qui (la cassa, la banda, la cella) se n'è andata col cercapersone vecchio.

export const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
export const resta = (t) => { const m = Math.max(0, Math.ceil((t - Date.now()) / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min` }
// (esportati dal 29.10 per la rapina di pzk os, telefono/zero/os/rapina.js: le stesse probabilità e lo stesso bottino del server)
export const PROB = { 2: 32, 3: 40, 4: 48 }
/** Il bottino a testa in una banda di n, con la cassa che c'è (api/wallet.mjs, colpo: il 3 % più l'1 % a testa, al più 15.000). */
export const bottino = (cassa, n) => Math.min((cassa * (0.03 + 0.01 * n)) / n, 15000)
export const CAUZIONE = 3000, ORE_GALERA = 6 // (come CAUZIONE di api/_economia.mjs e le sei ore del colpo andato male: il browser l'api non la può importare)
