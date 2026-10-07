// Il tavolo di blackjack di pzkko.it (www.pzkko.it/games/blackjack/): una
// stanza sola, il banco è il server, fino a cinque giocatori seduti e chi vuole
// a guardare. Le regole e i tempi stanno in src/blackjack/motore.js; qui ci
// sono l'archivio, le richieste e le protezioni.
//
// Archivio: Redis (Upstash dal Marketplace di Vercel, piano gratuito) letto e
// scritto via REST, due chiavi: `bj:stato` (il JSON) e `bj:ver` (un contatore).
// Ogni scrittura è un confronta-e-scambia in uno script Lua: se nel frattempo
// qualcun altro ha scritto, si rilegge e si riprova. Senza Redis, con
// BJ_STORE=memory (solo in locale) l'archivio è in memoria; senza niente il
// tavolo risponde «chiuso» e la pagina lo dice.
//
// Tempo: il server non ha un orologio che gira da solo. Ogni richiesta, GET o
// POST, prima fa scattare le scadenze (`avanza`) e poi risponde: finché c'è
// qualcuno con la pagina aperta che interroga, il banco gioca da solo.
// La GET è uguale per tutti (niente dati personali) e la rete di Vercel la
// tiene in cache per un secondo: dieci schede aperte costano una lettura.
//
// Amministrazione: con BJ_ADMIN_KEY impostata, `{ a: 'ammin', key, cmd, … }`
// regala o toglie $pzk, registra amici, cambia limiti e tempi (vedi
// tools/blackjack/admin.mjs e la pagina /games/blackjack/admin/).

export const config = { runtime: 'nodejs' }

import { randomBytes } from 'node:crypto'
import * as M from '../src/blackjack/motore.js'

const PREFISSO = process.env.BJ_KEY_PREFIX || 'bj'
const K_STATO = `${PREFISSO}:stato`
const K_VER = `${PREFISSO}:ver`
const MAX_BODY = 4 * 1024
const CACHE_MS = 400 // nella stessa istanza, due letture vicine valgono una
const rnd = () => randomBytes(6).readUIntBE(0, 6) / 2 ** 48 // in [0,1), 48 bit di caso vero

// ── Archivio ─────────────────────────────────────────────────────────────────

let memoria = null
let memoriaVer = 0

async function backend() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token && process.env.BJ_STORE !== 'memory') return redis(url.replace(/\/$/, ''), token)
  if (process.env.BJ_STORE === 'memory') {
    return {
      nome: 'memoria',
      async read() {
        return { st: memoria ? structuredClone(memoria) : null, ver: memoriaVer }
      },
      async write(st, ver) {
        if (ver !== memoriaVer) return false
        memoria = st
        memoriaVer++
        return true
      },
    }
  }
  return null
}

function redis(url, token) {
  async function cmd(...args) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    const j = await r.json().catch(() => ({ error: `risposta non valida (${r.status})` }))
    if (!r.ok || j.error) throw new Error(`redis: ${j.error || r.status}`)
    return j.result
  }
  // confronta-e-scambia: scrive solo se il contatore è ancora quello letto
  const CAS = `local v = redis.call('GET', KEYS[1]) if v == false then v = '0' end if v ~= ARGV[1] then return 0 end redis.call('SET', KEYS[2], ARGV[3]) redis.call('SET', KEYS[1], ARGV[2]) return 1`
  return {
    nome: 'redis',
    async read() {
      const [stato, ver] = await cmd('MGET', K_STATO, K_VER)
      return { st: stato ? JSON.parse(stato) : null, ver: Number(ver) || 0 }
    },
    async write(st, ver) {
      const r = await cmd('EVAL', CAS, '2', K_VER, K_STATO, String(ver), String(ver + 1), JSON.stringify(st))
      return r === 1
    },
  }
}

// l'ultima lettura di questa istanza: le richieste a raffica nello stesso
// mezzo secondo non rileggono l'archivio
let ultima = { st: null, ver: 0, at: 0 }

async function leggi(store, now) {
  if (ultima.st && now - ultima.at < CACHE_MS) return { st: structuredClone(ultima.st), ver: ultima.ver, cache: true }
  const r = await store.read()
  const st = M.ripara(r.st, now, rnd)
  ultima = { st: structuredClone(st), ver: r.ver, at: now }
  return { st, ver: r.ver, cache: false }
}

/**
 * Legge, fa scattare le scadenze, applica `cambia(st)` e riscrive se qualcosa è
 * cambiato; se nel frattempo ha scritto qualcun altro, riprova sui dati nuovi.
 * `cambia` torna { error } oppure { ok, cambiato, ... }.
 */
async function aggiorna(store, now, cambia) {
  for (let i = 0; i < 8; i++) {
    const { st, ver } = i === 0 ? await leggi(store, now) : await (async () => {
      const r = await store.read()
      return { st: M.ripara(r.st, now, rnd), ver: r.ver }
    })()
    let cambiato = M.avanza(st, now, rnd)
    const esito = cambia ? cambia(st) : { ok: true, cambiato: false }
    if (esito && !esito.error && esito.cambiato !== false) cambiato = true
    if (!cambiato) return { st, esito }
    st.v = ver + 1
    if (await store.write(st, ver)) {
      ultima = { st: structuredClone(st), ver: ver + 1, at: now }
      return { st, esito }
    }
    ultima.at = 0
    await new Promise((r) => setTimeout(r, (40 + Math.random() * 120) * (1 + i / 2)))
  }
  throw Object.assign(new Error('troppi conflitti di scrittura'), { occupato: true })
}

// ── Limite di frequenza (in memoria, per istanza; l'IP non si salva) ─────────

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

// ── Richieste ────────────────────────────────────────────────────────────────

const json = (res, status, body, cache = 'no-store') => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.setHeader('X-Robots-Tag', 'noindex')
  res.end(JSON.stringify(body))
}

async function corpo(req) {
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

const tok = (v) => (typeof v === 'string' && /^[a-z0-9]{24}$/.test(v) ? v : null)
const chi = (st, t) => (t ? Object.values(st.giocatori).find((g) => g.tok === t) || null : null)

/** L'azione del corpo come funzione sullo stato (torna { error } o { ok, cambiato, io? }). */
function azione(body, now) {
  const t = tok(body.tok)
  const conIo = (st, g, r) => (r.error ? r : { ...r, io: M.mio(st, g) })
  switch (body.a) {
    case 'entra':
      return (st) => {
        if (t) {
          const r = M.entra(st, { tok: t }, now, rnd)
          return r.error ? r : { ok: true, cambiato: true, io: { ...M.mio(st, r.io), tok: r.io.tok } }
        }
        const r = M.entra(st, { nome: body.nome }, now, rnd)
        return r.error ? r : { ok: true, cambiato: true, io: { ...M.mio(st, r.io), tok: r.io.tok }, nuovo: true }
      }
    case 'ping':
      return (st) => {
        const g = chi(st, t)
        if (!g) return { ok: true, cambiato: false }
        const r = M.ping(st, g.id, now)
        return conIo(st, g, r)
      }
    case 'siedi':
    case 'alzati':
    case 'punta':
    case 'salta':
    case 'gioca':
      return (st) => {
        const g = chi(st, t)
        if (!g) return { error: 'non sei al tavolo: entra col tuo nome' }
        let r
        if (body.a === 'siedi') r = M.siedi(st, g.id, now, Number.isInteger(body.posto) ? body.posto : undefined)
        else if (body.a === 'alzati') r = M.alzati(st, g.id, now)
        else if (body.a === 'punta') r = M.punta(st, g.id, body.importo, now)
        else if (body.a === 'salta') r = M.salta(st, g.id, now)
        else r = M.gioca(st, g.id, String(body.mossa || ''), now, rnd)
        return conIo(st, g, r)
      }
    case 'ammin': {
      const admin = process.env.BJ_ADMIN_KEY
      if (!admin) return { error: 'amministrazione spenta: manca BJ_ADMIN_KEY' }
      if (typeof body.key !== 'string' || body.key.length < 8 || body.key !== admin) return { error: 'chiave sbagliata' }
      const cmd = String(body.cmd || '')
      return (st) => {
        const r = M.ammin(st, cmd, body, now, rnd)
        if (r.error) return r
        return { ...r, privato: M.privato(st) }
      }
    }
    default:
      return { error: 'azione sconosciuta' }
  }
}

export default async function handler(req, res) {
  const store = await backend()
  if (!store) return json(res, 503, { ok: false, chiuso: true, error: 'il tavolo è chiuso: manca l’archivio (Redis)' })
  const now = Date.now()

  try {
    if (req.method === 'GET') {
      const { st } = await aggiorna(store, now, null)
      // uguale per tutti: la rete di Vercel la tiene un secondo, così dieci
      // schede aperte costano una lettura sola
      res.setHeader('Access-Control-Allow-Origin', '*')
      return json(res, 200, { ok: true, now, ...M.pubblico(st, now) }, 'public, max-age=0, s-maxage=1')
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return json(res, 405, { ok: false, error: 'metodo non ammesso' })
    }

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
    let body
    try {
      body = await corpo(req)
    } catch {
      return json(res, 400, { ok: false, error: 'richiesta non valida' })
    }
    if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'richiesta non valida' })

    const cambia = azione(body, now)
    if (typeof cambia !== 'function') return json(res, 422, { ok: false, error: cambia.error })
    if (body.a === 'entra' && !tok(body.tok) && troppo(ip, 'entra', 5, 20)) return json(res, 429, { ok: false, error: 'troppi ingressi: riprova fra un po’' })
    if (body.a !== 'ping' && troppo(ip, 'mosse', 90, 2000)) return json(res, 429, { ok: false, error: 'piano: troppe richieste' })

    const { st, esito } = await aggiorna(store, now, cambia)
    const pub = M.pubblico(st, now)
    if (esito.error) return json(res, 422, { ok: false, error: esito.error, now, ...pub })
    const extra = {}
    if (esito.io) extra.io = esito.io
    if (esito.nuovo) extra.nuovo = true
    if (esito.dopo) extra.dopo = true
    if (esito.esito) extra.esito = esito.esito
    if (esito.privato) extra.privato = esito.privato
    return json(res, 200, { ok: true, now, ...extra, ...pub })
  } catch (err) {
    if (err.occupato) return json(res, 503, { ok: false, error: 'tavolo affollato: riprova fra un attimo' })
    console.error('blackjack:', err)
    return json(res, 500, { ok: false, error: 'qualcosa si è rotto al tavolo: non è colpa tua' })
  }
}
