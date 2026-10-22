// /api/borsa: la borsa dei $pzk per il wallet (pzkko/wallet/): il cambio PZK/EUR€ adesso, le variazioni e la serie
// (?da=24h|7g|30g|tutto, dieci minuti per punto nell'ultima settimana, poi un'ora, poi un giorno: _borsa.mjs), la
// capitalizzazione (i $pzk di tutti i conti, _wallet). Solo da guardare: gli EUR€ non si comprano né si vendono per
// davvero. Un minuto di cache sulla rete di Vercel.
// Sta qui (.mjs) perché vada online anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko;
// finché la radice è albertopecchini.it, la pubblica albertopecchini.it/api/borsa.js, che la riesporta.
import { archivio, json } from './_archivio.mjs'
import { borsa, pubblico } from './_borsa.mjs'
import { PATH as WALLET, offerta } from './_conti.mjs'

const DA = { '1h': 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000, '7g': 7 * 24 * 60 * 60 * 1000, '30g': 30 * 24 * 60 * 60 * 1000, tutto: Infinity }

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return json(res, 405, { ok: false, errore: 'solo GET' }) }
  try {
    const now = Date.now()
    const db = await borsa(now)
    if (!db) return json(res, 503, { ok: false, offline: true, errore: 'la borsa è chiusa: riprova più tardi' }, 'public, s-maxage=30')
    const da = DA[new URL(req.url, 'http://x').searchParams.get('da')] ?? DA['7g']
    const conti = await archivio(WALLET, () => ({ conti: [] }))
    const { db: w } = await conti.read()
    const cap = offerta(w)
    json(res, 200, { ok: true, ...pubblico(db, now, da), cap: { pzk: cap.pzk, eur: cap.eur, conti: cap.conti, valore: cap.pzk * pubblico(db, now, 0).tasso } }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
  } catch (e) {
    console.error('borsa:', e)
    json(res, e.occupato ? 503 : 500, { ok: false, errore: 'la borsa non risponde: riprova' })
  }
}
