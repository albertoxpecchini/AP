// «Better Call Pekko» — il database vero della parodia: contavisite (totale,
// per giorno e per sito di provenienza), persone online, like, condivisioni,
// sondaggio, record del gioco, forum, guestbook, shoutbox ed e-card. Una
// funzione sola, un documento JSON solo.
//
// Dove sta: un file privato su Vercel Blob (`bcp/db.json`), letto sempre
// dall'origine (useCache: false) e riscritto con `ifMatch` sull'ETag, così due
// scritture contemporanee non si cancellano a vicenda: chi perde riprova.
// Il token (BLOB_READ_WRITE_TOKEN) lo mette Vercel collegando lo store al
// progetto. Senza token la funzione risponde «offline» e la pagina resta in
// piedi; con BCP_STORE=memory (solo in locale) usa un database in memoria.
//
// Protezioni: campo trappola e tempo minimo di compilazione come il modulo
// contatti, limite di frequenza per IP (in memoria, l'IP non si salva), niente
// link nei testi, lunghezze massime, liste troncate. Moderazione: con
// BCP_ADMIN_KEY impostata, `{ a: 'del', key, what, id }` cancella un messaggio.

export const config = { runtime: 'nodejs' }

// BCP_BLOB_PATH solo per le prove in locale contro lo store vero, su un documento a parte
const PATH = process.env.BCP_BLOB_PATH || 'bcp/db.json'
const MAX_BODY = 8 * 1024
const CAP = { threads: 60, replies: 40, guestbook: 150, shout: 60, scores: 10, online: 80, giorni: 90, ref: 40 }
const ONLINE_MS = 5 * 60 * 1000
const AVATARS = 9

// Il giorno «di oggi» secondo l'orologio di casa (Europe/Rome), non quello UTC del server
const oggi = (now = Date.now()) => new Date(now).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
const NOSTRO = /(^|\.)bettercallpekko\.it$/
/** Il sito di provenienza: solo il nome host, minuscolo, senza www.; vuoto se manca, non è un host o è questo sito. */
function provenienza(v) {
  const h = typeof v === 'string' ? v.trim().toLowerCase().replace(/^www\./, '').slice(0, 60) : ''
  if (!h || !/^[a-z0-9.-]+\.[a-z0-9-]+$/.test(h) || NOSTRO.test(h)) return ''
  return h
}

// ── Il database iniziale: src/data/bcp-seed.js (lo stampa anche il template) ──

import { seed as SEED } from '../src/data/bcp-seed.js'

// ── Archivio: Vercel Blob, oppure memoria (solo in locale), oppure niente ────

let memoria = null
let memoriaEtag = 0

async function backend() {
  // BCP_STORE=memory vince sulla chiave: in locale .env.local ha il token vero, e
  // senza questa precedenza le prove scriverebbero nel database di produzione.
  if (process.env.BLOB_READ_WRITE_TOKEN && process.env.BCP_STORE !== 'memory') {
    const blob = await import('@vercel/blob')
    return {
      async read() {
        // Prima l'ETag vero (head), poi il contenuto (get). La lettura del JSON arriva
        // compressa con un ETag «debole» che ifMatch non accetta; in quest'ordine, se
        // qualcuno scrive nel mezzo, il nostro ifMatch fallisce e si riprova: non si
        // sovrascrive mai una versione più recente.
        const meta = await blob.head(PATH).catch((e) => {
          if (e instanceof blob.BlobNotFoundError) return null
          throw e
        })
        if (!meta) return { db: SEED(), etag: null }
        const r = await blob.get(PATH, { access: 'private', useCache: false })
        if (process.env.BCP_DEBUG) console.warn('bcp read:', meta.etag, r && r.blob && r.blob.etag)
        if (!r || !r.stream) return { db: SEED(), etag: null }
        return { db: await new Response(r.stream).json(), etag: meta.etag }
      },
      async write(db, etag) {
        try {
          await blob.put(PATH, JSON.stringify(db), {
            access: 'private',
            addRandomSuffix: false,
            allowOverwrite: Boolean(etag),
            contentType: 'application/json',
            ...(etag && { ifMatch: etag }),
          })
          return true
        } catch (e) {
          // ETag cambiato nel frattempo (o creato da un'altra richiesta): si riprova
          if (process.env.BCP_DEBUG) console.warn('bcp write:', e.constructor.name, e.message)
          if (e instanceof blob.BlobPreconditionFailedError || /already exists|precondition/i.test(e.message)) return false
          throw e
        }
      },
    }
  }
  if (process.env.BCP_STORE === 'memory') {
    return {
      async read() {
        if (!memoria) memoria = SEED()
        return { db: structuredClone(memoria), etag: String(memoriaEtag) }
      },
      async write(db, etag) {
        if (etag !== String(memoriaEtag)) return false
        memoria = db
        memoriaEtag++
        return true
      },
    }
  }
  return null
}

/** Legge, applica `change` e riscrive; in caso di conflitto riprova con i dati nuovi. */
async function update(store, change) {
  for (let i = 0; i < 9; i++) {
    const { db, etag } = await store.read()
    const esito = change(db)
    if (esito && esito.error) return { db, error: esito.error }
    if (await store.write(db, etag)) return { db }
    await new Promise((r) => setTimeout(r, (80 + Math.random() * 220) * (1 + i / 2)))
  }
  throw Object.assign(new Error('troppi conflitti di scrittura'), { occupato: true })
}

// ── Vista pubblica ───────────────────────────────────────────────────────────

function pubblico(db, now = Date.now()) {
  return {
    visits: db.visits,
    online: Math.max(1, db.online.filter((t) => now - t < ONLINE_MS).length),
    today: (db.giorni || {})[oggi(now)] || 0,
    days: Object.fromEntries(Object.entries(db.giorni || {}).sort().slice(-30)),
    refs: db.ref || {},
    likes: db.likes,
    shares: db.shares,
    ecards: db.ecards,
    poll: db.poll,
    scores: db.scores,
    threads: db.threads,
    guestbook: db.guestbook,
    shout: db.shout,
  }
}

// ── Controlli sui testi ──────────────────────────────────────────────────────

const LINK = /(https?:|www\.|\.(com|it|net|org|ru|xyz|info|biz|io|co|me)\b|\[url)/i
const pulisci = (v, max) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : ''

function testo(v, { min = 2, max }) {
  const t = pulisci(v, max)
  if (t.length < min) return { error: `2 short (min ${min} chars)` }
  if (/[<>]/.test(t)) return { error: 'no html plz. this is not myspace' }
  if (LINK.test(t)) return { error: 'no links plz. this is a family website (since 2006)' }
  if (/(.)\1{9,}/.test(t)) return { error: 'easy on the keyboard there' }
  return { t }
}

function nome(v) {
  const n = pulisci(v, 24).replace(/[^\p{L}\p{N} _.\-]/gu, '')
  if (n.length < 2) return { error: 'type ur name (2+ chars)' }
  if (/^pekko$/i.test(n.trim())) return { error: 'nice try. there is only one pekko' }
  return { n }
}

const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const chiave = (k) => (typeof k === 'string' && /^[a-z0-9-]{1,32}$/.test(k) ? k : null)

// ── Limite di frequenza (in memoria, per istanza) ────────────────────────────

const colpi = new Map()
function troppo(ip, tipo, perMinuto, perOra) {
  const now = Date.now()
  const k = `${tipo}:${ip}`
  const lista = (colpi.get(k) || []).filter((t) => now - t < 3600_000)
  if (colpi.size > 2000) colpi.clear()
  if (lista.filter((t) => now - t < 60_000).length >= perMinuto || lista.length >= perOra) {
    colpi.set(k, lista)
    return true
  }
  lista.push(now)
  colpi.set(k, lista)
  return false
}

// ── Azioni ───────────────────────────────────────────────────────────────────

const SCRITTURE = new Set(['post', 'reply', 'gb', 'shout'])

function azione(body, ip) {
  const a = body.a
  switch (a) {
    case 'hit': {
      const da = provenienza(body.ref)
      return (db) => {
        const now = Date.now()
        if (body.nuovo) {
          db.visits++
          // la stessa visita anche per giorno (gli ultimi CAP.giorni) e per sito di
          // provenienza ('direct' = nessuno, 'other' = oltre i CAP.ref siti distinti)
          const g = { ...(db.giorni || {}) }
          const d = oggi(now)
          g[d] = (g[d] || 0) + 1
          db.giorni = Object.fromEntries(Object.entries(g).sort().slice(-CAP.giorni))
          const r = db.ref || {}
          let k = da || 'direct'
          if (!(k in r) && Object.keys(r).length >= CAP.ref) k = 'other'
          r[k] = (r[k] || 0) + 1
          db.ref = r
        }
        db.online = [...db.online.filter((t) => now - t < ONLINE_MS), now].slice(-CAP.online)
      }
    }
    case 'like': {
      const k = chiave(body.k)
      if (!k) return { error: 'bad like' }
      return (db) => {
        if (!(k in db.likes) && Object.keys(db.likes).length >= 80) return { error: 'too many likes (seriously)' }
        db.likes[k] = (db.likes[k] || 0) + (body.undo ? -1 : 1)
        if (db.likes[k] < 0) db.likes[k] = 0
      }
    }
    case 'share': {
      const k = chiave(body.k)
      if (!k) return { error: 'bad share' }
      return (db) => {
        if (!(k in db.shares) && Object.keys(db.shares).length >= 20) return
        db.shares[k] = (db.shares[k] || 0) + 1
      }
    }
    case 'ecard':
      return (db) => {
        db.ecards++
      }
    case 'vote': {
      const i = Number(body.i)
      if (!Number.isInteger(i) || i < 0 || i > 5) return { error: 'bad vote' }
      return (db) => {
        db.poll[i]++
      }
    }
    case 'score': {
      const ms = Number(body.ms)
      const n = nome(body.name)
      if (n.error) return n
      if (!Number.isFinite(ms) || ms < 400 || ms > 600_000) return { error: 'nice try, hacker' }
      return (db) => {
        db.scores = [...db.scores, { by: n.n, ms: Math.round(ms), ts: Date.now() }].sort((x, y) => x.ms - y.ms).slice(0, CAP.scores)
      }
    }
    case 'post': {
      const n = nome(body.name)
      const t = testo(body.title, { min: 4, max: 80 })
      const x = testo(body.text, { min: 4, max: 600 })
      const err = n.error || t.error || x.error
      if (err) return { error: err }
      return (db) => {
        const now = Date.now()
        db.threads.unshift({ id: id(), title: t.t, by: n.n, ts: now, posts: [{ by: n.n, ts: now, text: x.t }] })
        const fissi = db.threads.filter((th) => th.sticky)
        const altri = db.threads.filter((th) => !th.sticky).slice(0, CAP.threads)
        db.threads = [...fissi, ...altri]
      }
    }
    case 'reply': {
      const n = nome(body.name)
      const x = testo(body.text, { min: 2, max: 600 })
      const err = n.error || x.error
      if (err) return { error: err }
      return (db) => {
        const th = db.threads.find((t) => t.id === body.id)
        if (!th) return { error: 'topic not found (deleted by the turtle?)' }
        if (th.locked) return { error: 'topic locked. call pekko instead' }
        th.posts.push({ by: n.n, ts: Date.now(), text: x.t })
        th.posts = th.posts.slice(0, 1).concat(th.posts.slice(1).slice(-CAP.replies))
      }
    }
    case 'gb': {
      const n = nome(body.name)
      const x = testo(body.text, { min: 4, max: 300 })
      const err = n.error || x.error
      if (err) return { error: err }
      const av = Number(body.av)
      return (db) => {
        db.guestbook.unshift({ id: id(), by: n.n, ts: Date.now(), av: Number.isInteger(av) && av >= 1 && av <= AVATARS ? av : 0, text: x.t })
        db.guestbook = db.guestbook.slice(0, CAP.guestbook)
      }
    }
    case 'shout': {
      const n = nome(body.name)
      const x = testo(body.text, { min: 1, max: 140 })
      const err = n.error || x.error
      if (err) return { error: err }
      return (db) => {
        db.shout.push({ by: n.n, ts: Date.now(), text: x.t })
        db.shout = db.shout.slice(-CAP.shout)
      }
    }
    case 'del': {
      const admin = process.env.BCP_ADMIN_KEY
      if (!admin || body.key !== admin) return { error: 'nope' }
      return (db) => {
        if (body.what === 'thread') db.threads = db.threads.filter((t) => t.id !== body.id)
        if (body.what === 'gb') db.guestbook = db.guestbook.filter((g) => g.id !== body.id)
        if (body.what === 'shout') db.shout = db.shout.filter((s) => String(s.ts) !== String(body.id))
        if (body.what === 'reply') {
          const [tid, i] = String(body.id).split(':')
          const th = db.threads.find((t) => t.id === tid)
          if (th && Number(i) > 0) th.posts.splice(Number(i), 1)
        }
      }
    }
    default:
      return { error: 'unknown action' }
  }
}

// ── Gestore ──────────────────────────────────────────────────────────────────

const json = (res, status, body, cache = 'no-store') => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.setHeader('X-Robots-Tag', 'noindex')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new Error('corpo troppo grande')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

export default async function handler(req, res) {
  const store = await backend()
  if (!store) return json(res, 503, { ok: false, offline: true, error: 'the database is on vacation. try again later (or call pekko)' })

  try {
    if (req.method === 'GET') {
      const { db } = await store.read()
      // qualche secondo di cache sulla rete di Vercel: tante visite, poche letture.
      // Leggibile anche da altre origini (il cruscotto delle visite): sono dati pubblici
      res.setHeader('Access-Control-Allow-Origin', '*')
      return json(res, 200, { ok: true, ...pubblico(db) }, 'public, max-age=0, s-maxage=8, stale-while-revalidate=30')
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return json(res, 405, { ok: false, error: 'method not allowed' })
    }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
    let body
    try {
      body = await readBody(req)
    } catch {
      return json(res, 400, { ok: false, error: 'bad request' })
    }
    if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'bad request' })

    const scrive = SCRITTURE.has(body.a)
    if (scrive) {
      // trappole per i bot, come nel modulo contatti: si finge di aver salvato
      if (body.sito) return json(res, 200, { ok: true, ...pubblico((await store.read()).db) })
      if (typeof body._t !== 'number' || Date.now() - body._t < 3000) return json(res, 429, { ok: false, error: 'slow down cowboy. read the page first' })
    }

    // prima i controlli sui testi (un errore di battitura non consuma il limite), poi la frequenza
    const change = azione(body, ip)
    if (typeof change !== 'function') return json(res, 422, { ok: false, error: change.error })
    if (scrive ? troppo(ip, 'scrivi', 4, 30) : troppo(ip, body.a || 'x', 30, 400)) {
      return json(res, 429, { ok: false, error: scrive ? 'slow down cowboy. max 4 posts a minute' : 'easy there. too many clicks' })
    }
    const { db, error } = await update(store, change)
    if (error) return json(res, 422, { ok: false, error, ...pubblico(db) })
    return json(res, 200, { ok: true, ...pubblico(db) })
  } catch (err) {
    if (err.occupato) return json(res, 503, { ok: false, error: 'too many ppl clicking at once. try again in a sec' })
    console.error('bcp:', err)
    return json(res, 500, { ok: false, error: 'something broke. its not ur fault. better call pekko' })
  }
}
