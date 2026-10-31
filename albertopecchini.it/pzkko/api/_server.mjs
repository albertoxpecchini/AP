// Il server dei dati sul pc di Alberto (28.10, C:\pzkko-server\server.mjs): dalla notte del 28.10 Vercel Blob è bloccato
// su tutto l'account (le soglie gratuite del piano Hobby superate), e i file JSON che stavano lì stanno là. Questo è il
// pezzo delle funzioni: un archivio ({ etag(), read(), write(db, etag) }), con le richieste al
// server invece che a Blob.
//
// Si accende con due variabili nel progetto Vercel: PZKKO_SERVER_URL (l'indirizzo del tunnel, https) e
// PZKKO_SERVER_SECRET (il segreto di C:\pzkko-server\config\config.json). Ogni richiesta è firmata (HMAC-SHA256 su metodo,
// indirizzo, ora, un nonce, la lunghezza e l'impronta del corpo, le condizioni) e ogni risposta pure: una risposta senza
// la firma giusta (un server finto, un tunnel che risponde da sé, un segreto sbagliato) è un errore, mai un file vuoto.
//
// Se il server non risponde (il pc spento, il tunnel giù), per 15 secondi archivio() dà null e le funzioni rispondono
// «in pausa» come quando l'archivio non c'è, invece di aspettare ogni volta. La lettura manda l'ETag dell'ultima copia
// che la funzione ha già (x-pzk-if-none-match): se è quella, il server risponde 304 senza rimandare il file.
// (Comincia per _ : Vercel non ne fa una funzione.)
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const stato = (globalThis.__pzkkoServer ??= { copie: new Map(), giuFino: 0 })
const PAUSA = 15_000

// le variabili come vengono incollate nel pannello di Vercel (29.10: il segreto giusto con un carattere in più, e nessuna
// firma tornava): il segreto è sempre 43 caratteri base64url (32 byte, installa.ps1), e si pesca anche fra virgolette,
// «PZKKO_SERVER_SECRET=», la riga del JSON o le due righe incollate insieme; l'indirizzo è il primo https://host
const SEGRETO = /(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/
const INDIRIZZO = /https:\/\/[A-Za-z0-9.-]+(:\d+)?|http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/
const segretoDi = (v) => { const s = String(v ?? '').trim(); return SEGRETO.exec(s)?.[0] ?? s }

/** { url, segreto } se il server è configurato (https, o http solo verso questo computer), se no null. */
export function serverOpzioni() {
  const url = INDIRIZZO.exec(String(process.env.PZKKO_SERVER_URL ?? ''))?.[0] ?? ''
  const segreto = segretoDi(process.env.PZKKO_SERVER_SECRET)
  if (segreto.length < 32 || !url) return null
  return { url, segreto }
}
/** Il server non ha risposto da poco: meglio dire subito «in pausa». */
export const serverGiu = () => Date.now() < stato.giuFino

const sha = (b) => createHash('sha256').update(b).digest('hex')
const errore = (msg, extra = {}) => Object.assign(new Error(`server dei dati: ${msg}`), extra)

async function chiama({ url, segreto }, metodo, nome, { corpo = null, ifMatch = '', ifNoneMatch = '', indirizzo = `/v1/f/${nome}` } = {}) {
  const ts = String(Date.now()), nonce = randomBytes(24).toString('base64url')
  const buf = corpo === null ? null : Buffer.from(corpo, 'utf8')
  const lung = String(buf?.length ?? 0), impronta = buf ? sha(buf) : ''
  const hmac = (s) => createHmac('sha256', segreto).update(s).digest()
  const firma = hmac(['pzk1', metodo, indirizzo, ts, nonce, lung, impronta, ifMatch, ifNoneMatch].join('\n')).toString('base64url')
  let r, testo
  try {
    r = await fetch(url + indirizzo, {
      method: metodo,
      headers: {
        'x-pzk-ts': ts, 'x-pzk-nonce': nonce, 'x-pzk-firma': firma, 'x-pzk-lunghezza': lung,
        ...(impronta && { 'x-pzk-corpo': impronta, 'Content-Type': 'application/json' }),
        ...(ifMatch && { 'x-pzk-if-match': ifMatch }), ...(ifNoneMatch && { 'x-pzk-if-none-match': ifNoneMatch }),
      },
      body: buf ?? undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(metodo === 'PUT' ? 20_000 : 10_000),
    })
    testo = metodo === 'HEAD' || r.status === 304 ? Buffer.alloc(0) : Buffer.from(await r.arrayBuffer())
  } catch (e) {
    stato.giuFino = Date.now() + PAUSA
    throw errore(`non risponde (${e.name === 'TimeoutError' ? 'troppo lento' : e.message})`, { offline: true })
  }
  const etag = r.headers.get('x-pzk-etag') ?? ''
  const attesa = hmac(['pzk1r', nonce, r.status, etag, testo.length ? sha(testo) : ''].join('\n'))
  const data = r.headers.get('x-pzk-firma') ?? ''
  const b = /^[A-Za-z0-9_-]{43}$/.test(data) ? Buffer.from(data, 'base64url') : null
  if (!b || b.length !== attesa.length || !timingSafeEqual(b, attesa)) {
    stato.giuFino = Date.now() + PAUSA
    // (del segreto si dice solo quanto è lungo e se è un segreto pulito: basta a capire se è stato incollato male)
    throw errore(`risposta senza la firma giusta (HTTP ${r.status}: il segreto o l'ora non tornano, o non è il server di Alberto; il segreto qui è di ${segreto.length} caratteri${SEGRETO.test(segreto) && segreto.length === 43 ? '' : ', non i 43 di installa.ps1'})`, { offline: true })
  }
  stato.giuFino = 0
  return { status: r.status, etag, testo }
}

/**
 * IL PONTE (31.10, Alberto: «tutti i dati degli account nel mio server … nessun codice accessibile da fuori»): la banca
 * (i conti, i giochi, lo zaino, la borsa, i giocatori) gira sul pc di Alberto, dentro C:\pzkko-server, e il suo codice non
 * sta in questo repository. Le funzioni /api/wallet, /api/borsa e /api/giocatori fanno solo da passaggio: portano la
 * richiesta del browser al server (POST /v1/api/<nome>, firmata come le altre, con l'indirizzo di chi chiede, che così il
 * server può usare per i limiti) e ne riportano la risposta, la cui firma si controlla prima di consegnarla.
 */
export async function ponte(nome, req, res, { max = 16 * 1024 } = {}) {
  const opz = serverOpzioni()
  const manda = (status, body, cache = 'no-store') => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', cache); res.end(typeof body === 'string' ? body : JSON.stringify(body)) }
  const pausa = { ok: false, offline: true, errore: 'la banca è in pausa (il server di pzkko è spento): riprova fra poco' }
  if (!opz || serverGiu()) return manda(503, pausa, 'public, s-maxage=5')
  let testo = ''
  if (req.method === 'POST') {
    try {
      if (req.body !== undefined && req.body !== null) testo = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      else { const parti = []; let n = 0; for await (const p of req) { n += p.length; if (n > max) throw new Error('troppo'); parti.push(p) } testo = Buffer.concat(parti).toString('utf8') }
    } catch { return manda(400, { ok: false, errore: 'richiesta sbagliata' }) }
    if (testo.length > max) return manda(413, { ok: false, errore: 'richiesta troppo grande' })
  } else if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, POST'); return manda(405, { ok: false, errore: 'solo GET e POST' }) }
  const q = new URL(req.url, 'http://x').search
  const busta = JSON.stringify({ m: req.method === 'HEAD' ? 'GET' : req.method, q, ip: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim().slice(0, 64), ua: String(req.headers['user-agent'] ?? '').slice(0, 200), corpo: testo })
  let r
  try { r = await chiama(opz, 'PUT', null, { corpo: busta, indirizzo: `/v1/api/${nome}` }) } catch (e) { console.warn(`ponte ${nome}:`, e.message); return manda(503, pausa) }
  let d
  try { d = JSON.parse(r.testo.toString('utf8')) } catch { return manda(502, { ok: false, errore: 'la banca ha risposto male' }) }
  return manda(d.status ?? 200, d.corpo ?? '{}', d.cache ?? 'no-store')
}

/** L'archivio del file `nome` (es. pzkko/wallet.json) sul server: { etag(), read() → { db, etag }, write(db, etag) → bool }. */
export function archivioServer(nome, vuoto, opz = serverOpzioni()) {
  if (!opz) return null
  return {
    async etag() {
      const r = await chiama(opz, 'HEAD', nome)
      if (r.status === 404) return null
      if (r.status !== 200) throw errore(`HEAD ${nome}: ${r.status}`)
      return r.etag
    },
    async read() {
      const c = stato.copie.get(nome)
      const r = await chiama(opz, 'GET', nome, { ifNoneMatch: c?.etag ?? '' })
      if (r.status === 404) { stato.copie.delete(nome); return { db: vuoto(), etag: null } }
      if (r.status === 304 && c && r.etag === c.etag) return { db: JSON.parse(c.testo), etag: c.etag }
      if (r.status !== 200 || !r.etag) throw errore(`GET ${nome}: ${r.status}`)
      const testo = r.testo.toString('utf8')
      const db = JSON.parse(testo)
      stato.copie.set(nome, { etag: r.etag, testo })
      return { db, etag: r.etag }
    },
    // (come con Blob: senza etag si crea soltanto, con l'etag si sostituisce soltanto quella versione; false = qualcuno ha
    // scritto nel frattempo, aggiorna() rilegge e riprova. Una scrittura che non ha risposta non si ripete: potrebbe essere
    // passata, e rifarla due volte rifarebbe due volte un invio)
    async write(db, etag) {
      const testo = JSON.stringify(db)
      const r = await chiama(opz, 'PUT', nome, { corpo: testo, ...(etag ? { ifMatch: etag } : { ifNoneMatch: '*' }) })
      if (r.status === 412) return false
      if (r.status !== 200 || !r.etag) throw errore(`PUT ${nome}: ${r.status}`)
      stato.copie.set(nome, { etag: r.etag, testo })
      return true
    },
  }
}
