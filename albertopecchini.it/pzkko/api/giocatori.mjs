// /api/giocatori: il database dei giocatori di pzkko.it (23.10), da leggere. Le righe stanno in api/_giocatori.mjs (e si
// scrivono da api/wallet.mjs quando la chat salva lo zaino); qui si chiede, e si risponde con quello che è pubblico:
// nome, indirizzo, livello, titolo, mestiere e le statistiche, mai il PIN né gli oggetti uno per uno.
//
//   GET ?top=<metrica>[&n=10]   la classifica (pzk, eur, xp, liv, guadagnati, vinti, persi, pescati, cacciati, scavati,
//                               morti, comandi, quiz, sfide, missioni, serie, acquisti, vecchiaia)
//   GET ?cerca=<testo>          chi ha un nome (o un indirizzo) così
//   GET ?ind=pzk123456          il profilo di uno, con la posizione in ogni classifica
//   GET ?stats=1                i numeri di tutta la banca
//   GET ?notizie=1              le ultime cose successe
//   POST { token, vicini?: metrica }   il tuo profilo, e chi ti sta sopra e sotto in classifica (per sfidarlo)
// Sta qui (.mjs) come le altre; albertopecchini.it/api/giocatori.js la riesporta.
import { archivio, corpo, json, limite } from './_archivio.mjs'
import { PATH, vuoto } from './_conti.mjs'
import { PATH_GIOCATORI, vuotoG, METRICHE, unisci, top, cerca, profilo, vicini, statistiche, ultimeNotizie } from './_giocatori.mjs'
import { idDaToken } from './wallet.mjs'

const limiti = { tutte: limite('giocatori', 120, 5 * 60_000) }
const CACHE = 'public, max-age=0, s-maxage=30, stale-while-revalidate=120'

export default async function handler(req, res) {
  const conti = await archivio(PATH, vuoto)
  const giocatori = await archivio(PATH_GIOCATORI, vuotoG)
  if (!conti || !giocatori) return json(res, 503, { ok: false, offline: true, errore: 'il database è in pausa' }, 'public, s-maxage=30')
  const now = Date.now()
  try {
    const carica = async () => {
      const [{ db: w }, { db: g }] = await Promise.all([conti.read(), giocatori.read()])
      return { g, righe: unisci(g, w.conti) }
    }
    if (req.method === 'GET' || req.method === 'HEAD') {
      const q = new URL(req.url, 'http://x').searchParams
      const { g, righe } = await carica()
      if (q.has('top')) {
        const t = top(righe, q.get('top'), parseInt(q.get('n')) || 10)
        return t ? json(res, 200, { ok: true, metrica: q.get('top'), top: t, giocatori: righe.length }, CACHE) : json(res, 400, { ok: false, errore: `classifiche: ${Object.keys(METRICHE).join(', ')}` })
      }
      if (q.has('cerca')) return json(res, 200, { ok: true, trovati: cerca(righe, q.get('cerca')) }, 'public, s-maxage=15')
      if (q.has('ind')) {
        const ind = /^(?:pzk)?(\d{6})$/i.exec(String(q.get('ind')).trim())?.[1]
        const r = righe.find((x) => x.ind === ind)
        return r ? json(res, 200, { ok: true, profilo: profilo(righe, r) }, 'public, s-maxage=20') : json(res, 404, { ok: false, errore: 'nessun giocatore con questo indirizzo' })
      }
      if (q.has('notizie')) return json(res, 200, { ok: true, notizie: ultimeNotizie(g) }, CACHE)
      return json(res, 200, { ok: true, stats: statistiche(righe, g.notizie, now), metriche: Object.keys(METRICHE) }, CACHE)
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return json(res, 405, { ok: false, errore: 'solo GET e POST' }) }
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
    if (limiti.tutte.troppe(ip, now)) return json(res, 429, { ok: false, errore: 'con calma' })
    limiti.tutte.segna(ip, now)
    let body
    try { body = await corpo(req, 2 * 1024) } catch { return json(res, 400, { ok: false, errore: 'richiesta sbagliata' }) }
    const id = idDaToken(body?.token, now)
    if (!id) return json(res, 401, { ok: false, errore: 'entra di nuovo', esci: true })
    const { righe } = await carica()
    const r = righe.find((x) => x.id === id)
    if (!r) return json(res, 404, { ok: false, errore: 'conto sparito' })
    return json(res, 200, { ok: true, profilo: profilo(righe, r), ...(body.vicini && { vicini: vicini(righe, r, body.vicini) }) })
  } catch (e) {
    console.error('giocatori:', e)
    return json(res, 500, { ok: false, errore: 'qualcosa non va: riprova' })
  }
}
