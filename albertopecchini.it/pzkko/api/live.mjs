// /api/live: il canale sempre aperto di pzkko.it (26.10, Alberto: «fai un server sempre connesso e che registra tutto
// subito»). Il browser lo apre col conto (POST { token }, il token non sta nell'indirizzo) e la risposta resta aperta: ogni
// riga è un avviso in JSON, uno per riga, quando lo zaino o il conto di CHI È CONNESSO cambiano sul server (anche da un altro
// dispositivo): { k: 'zaino', t }, { k: 'conto', pzk, es, fn }. All'apertura, { k: 'ciao', t, pzk, es, fn } dice com'è adesso:
// chi si è riconnesso lo confronta con quello che ha (se in mezzo è cambiato qualcosa, lo scopre da lì). Il browser poi chiede
// i dati veri (api/wallet.mjs). Vercel non tiene una funzione accesa per sempre: dopo ~50 secondi manda { k: 'riconnetti' } e
// chiude, e il browser riapre da sé (games/live.js): dal di fuori è sempre connesso.
// Dentro, UN SOLO controllo per istanza, comune a tutte le connessioni: ogni 3 secondi guarda l'ETag dei due file su Blob
// (una richiesta leggera ciascuno) e, solo se è cambiato, scarica quel file una volta e lo confronta con quello che ogni
// connessione sa. Si ferma da solo quando non c'è più nessuno.
// Sta qui (.mjs) come le altre; albertopecchini.it/api/live.js la riesporta.
import { archivio, corpo, json, limite } from './_archivio.mjs'
import { PATH, vuoto } from './_conti.mjs'
import { idDaToken } from './wallet.mjs'

const PATH_CHAT = process.env.CHAT_BLOB_PATH || 'pzkko/chat.json'
const DURATA = 50_000, GIRO = 3_000, CUORE = 15_000
const limiti = { aperture: limite('live', 400, 10 * 60_000) }
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

// il controllo comune: le connessioni aperte e quello che si sa dei due file (chi c'è dentro, per id)
const connessioni = new Set()
const visto = (globalThis.__pzkkoLive ??= { eC: null, eZ: null, conti: new Map(), zaini: new Map(), acceso: false, archivi: null })

const firmaConto = (c) => (c ? { pzk: c.pzk, es: c.es ?? 0, fn: c.fn ?? 0, firma: JSON.stringify([c.pzk, c.es ?? 0, c.fn ?? 0, c.eur, c.mosse?.length ?? 0, c.lumaca?.g]) } : null)

/** Un giro: se un file è cambiato lo si legge (l'ETag nuovo si segna solo a lettura riuscita) e si avvisa chi ne ha bisogno. */
async function guarda() {
  const { conti, chat } = visto.archivi
  const [ec, ez] = await Promise.all([conti.etag(), chat.etag()])
  if (ec !== visto.eC) {
    const { db } = await conti.read()
    visto.conti = new Map(db.conti.map((c) => [c.id, firmaConto(c)]))
    visto.eC = ec
    for (const k of connessioni) {
      const n = visto.conti.get(k.id)
      if (n && n.firma !== k.conto?.firma) { k.conto = n; k.manda({ k: 'conto', pzk: n.pzk, es: n.es, fn: n.fn }) }
    }
  }
  if (ez !== visto.eZ) {
    const { db } = await chat.read()
    visto.zaini = new Map(Object.entries(db.zaini ?? {}).map(([id, z]) => [id, z?.t ?? 0]))
    visto.eZ = ez
    for (const k of connessioni) {
      const t = visto.zaini.get(k.id) ?? 0
      if (t !== k.zaino) { k.zaino = t; k.manda({ k: 'zaino', t }) }
    }
  }
}
async function ciclo() {
  if (visto.acceso) return
  visto.acceso = true
  try {
    while (connessioni.size) {
      try { await guarda() } catch (e) { console.warn('live:', e.message) }
      await pausa(GIRO)
    }
  } finally { visto.acceso = false }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { ok: false, errore: 'solo POST' }) }
    const now = Date.now()
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
    if (limiti.aperture.troppe(ip, now)) return json(res, 429, { ok: false, errore: 'con calma' })
    limiti.aperture.segna(ip, now)
    let body
    try { body = await corpo(req, 1024) } catch { return json(res, 400, { ok: false, errore: 'richiesta sbagliata' }) }
    const id = idDaToken(body?.token, now)
    if (!id) return json(res, 401, { ok: false, errore: 'entra di nuovo', esci: true })
    const conti = await archivio(PATH, vuoto), chat = await archivio(PATH_CHAT, () => ({ zaini: {} }))
    if (!conti || !chat) return json(res, 503, { ok: false, offline: true, errore: 'il server è in pausa' })
    visto.archivi = { conti, chat }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders?.()
    // (res, non req: `close` di req scatta quando il corpo è stato letto, non quando se ne va chi è connesso)
    let chiuso = false
    const k = { id, conto: null, zaino: null, manda: (o) => { if (!chiuso) res.write(JSON.stringify(o) + String.fromCharCode(10)) } }
    res.on('close', () => { chiuso = true; connessioni.delete(k) })

    // com'è adesso: un controllo adesso (due richieste leggere; i file si scaricano solo se sono cambiati: il controllo comune
    // può essere fermo da un po', e la sua cache vecchia)
    await guarda().catch(() => {})
    k.conto = visto.conti.get(id) ?? null
    k.zaino = visto.zaini.get(id) ?? 0
    k.manda({ k: 'ciao', t: k.zaino, pzk: k.conto?.pzk ?? null, es: k.conto?.es ?? 0, fn: k.conto?.fn ?? 0 })
    connessioni.add(k)
    ciclo()

    const fine = Date.now() + DURATA
    let cuore = Date.now()
    while (!chiuso && Date.now() < fine) {
      await pausa(1000)
      if (Date.now() - cuore > CUORE) { cuore = Date.now(); k.manda({ k: '.' }) }
    }
    k.manda({ k: 'riconnetti' })
    connessioni.delete(k)
    res.end()
  } catch (e) {
    console.error('live:', e)
    if (!res.headersSent) return json(res, 500, { ok: false, errore: 'qualcosa non va: riprova' })
    res.end()
  }
}
