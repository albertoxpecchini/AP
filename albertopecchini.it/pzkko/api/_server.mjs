// Il server dei dati sul pc di Alberto (28.10, C:\pzkko-server\server.mjs): dalla notte del 28.10 Vercel Blob è bloccato
// su tutto l'account (le soglie gratuite del piano Hobby superate), e i file JSON che stavano lì stanno là. Questo è il
// pezzo delle funzioni: lo stesso archivio di _archivio.mjs ({ etag(), read(), write(db, etag) }), con le richieste al
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

/** { url, segreto } se il server è configurato (https, o http solo verso questo computer), se no null. */
export function serverOpzioni() {
  const url = String(process.env.PZKKO_SERVER_URL ?? '').trim().replace(/\/+$/, '')
  const segreto = String(process.env.PZKKO_SERVER_SECRET ?? '').trim()
  if (segreto.length < 32) return null
  if (!/^https:\/\/[^/?#]+$/.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) return null
  return { url, segreto }
}
/** Il server non ha risposto da poco: meglio dire subito «in pausa». */
export const serverGiu = () => Date.now() < stato.giuFino

const sha = (b) => createHash('sha256').update(b).digest('hex')
const errore = (msg, extra = {}) => Object.assign(new Error(`server dei dati: ${msg}`), extra)

async function chiama({ url, segreto }, metodo, nome, { corpo = null, ifMatch = '', ifNoneMatch = '' } = {}) {
  const indirizzo = `/v1/f/${nome}`
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
    throw errore(`risposta senza la firma giusta (HTTP ${r.status}: il segreto o l'ora non tornano, o non è il server di Alberto)`, { offline: true })
  }
  stato.giuFino = 0
  return { status: r.status, etag, testo }
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
