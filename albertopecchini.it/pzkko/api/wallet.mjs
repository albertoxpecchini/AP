// /api/wallet (31.10): un ponte. La banca di pzkko.it (i conti, i giochi, lo zaino, la borsa, i giocatori) gira sul pc di
// Alberto, dentro C:\pzkko-server, e il suo codice non sta in questo repository (Alberto: «nessun codice accessibile da
// fuori, solo da me stanno i dati»). Questa funzione porta la richiesta del browser al server, firmata, e ne riporta la
// risposta (_server.mjs, ponte). Albertopecchini.it/api/wallet.js la riesporta.
import { ponte } from './_server.mjs'

export default (req, res) => ponte('wallet', req, res)
