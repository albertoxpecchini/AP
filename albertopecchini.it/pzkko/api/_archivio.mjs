// L'archivio delle funzioni di pzkko.it che devono ricordare qualcosa (il wallet dei $pzk e la borsa, api/wallet.mjs e
// api/borsa.mjs; i giocatori; la petizione, api/firme.mjs, e Better Call Pekko, ../api/bcp.js, hanno il loro uguale): un
// file JSON per ognuna, letto e riscritto solo se l'ETag è ancora quello, così due scritture nello stesso istante non si
// cancellano (chi perde rilegge e riprova).
// I file stanno SUL PC DI ALBERTO, C:\pzkko-server, dietro il tunnel (vedi _server.mjs), con PZKKO_SERVER_URL e
// PZKKO_SERVER_SECRET nel progetto. Fino al 28.10 stavano su Vercel Blob, che quella notte si è bloccato su tutto
// l'account (le soglie gratuite superate); il 29.10 Blob è uscito dal codice per sempre (Alberto: «togli vercel come
// server per sempre; restiamo da me e dal tunnel»).
// Senza il server, online, l'archivio non c'è (null: la funzione risponde «offline»); in locale (il server di npm run
// dev:pzkko, o PZKKO_STORE=memory) tutto sta in memoria finché il server non si ferma.
// (Comincia per _ : Vercel non ne fa una funzione.)
import { archivioServer, serverGiu, serverOpzioni } from './_server.mjs'

const memorie = (globalThis.__pzkkoArchivi ??= new Map())

/** I file stanno in memoria (le prove in locale): con PZKKO_STORE=memory, o fuori da Vercel senza il server. */
export const inMemoria = () => process.env.PZKKO_STORE === 'memory' || (!serverOpzioni() && !process.env.VERCEL)

/** L'archivio del file `path` (es. pzkko/wallet.json): { etag(), read() → { db, etag }, write(db, etag) → bool }, o null. */
export async function archivio(path, vuoto) {
  if (!inMemoria()) {
    const srv = serverOpzioni()
    return srv && !serverGiu() ? archivioServer(path, vuoto, srv) : null // (il server non ha risposto da poco: «in pausa»)
  }
  const m = memorie.get(path) ?? memorie.set(path, { db: null, etag: 0 }).get(path)
  return {
    async etag() { return String(m.etag) },
    async read() { return { db: structuredClone(m.db ?? vuoto()), etag: String(m.etag) } },
    async write(db, etag) { if (etag !== String(m.etag)) return false; m.db = structuredClone(db); m.etag++; return true },
  }
}

/**
 * Legge, applica `cambia(db)` e riscrive; se qualcuno ha scritto nel frattempo, riprova coi dati nuovi.
 * `cambia` restituisce quello che vuole far sapere (con `errore` non si scrive niente; con `invariato` nemmeno).
 */
export async function aggiorna(store, cambia) {
  for (let i = 0; i < 9; i++) {
    const { db, etag } = await store.read()
    const esito = (await cambia(db)) ?? {}
    if (esito.errore || esito.invariato) return { db, ...esito }
    if (await store.write(db, etag)) return { db, ...esito }
    await new Promise((r) => setTimeout(r, (80 + Math.random() * 220) * (1 + i / 2)))
  }
  throw Object.assign(new Error('troppe scritture insieme'), { occupato: true })
}

export const json = (res, status, body, cache = 'no-store') => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.end(JSON.stringify(body))
}

/** Il corpo JSON di una richiesta (al massimo `max` byte). */
export async function corpo(req, max = 4 * 1024) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const parti = []
  let n = 0
  for await (const p of req) { n += p.length; if (n > max) throw new Error('corpo troppo grande'); parti.push(p) }
  return JSON.parse(Buffer.concat(parti).toString('utf8') || '{}')
}

export const ipDi = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'

/** Un limite di frequenza in memoria (per istanza; niente si salva): al massimo `n` volte in `ms` per chiave. */
export function limite(nome, n, ms) {
  const visti = (globalThis.__pzkkoLimiti ??= new Map()).get(nome) ?? (globalThis.__pzkkoLimiti.set(nome, new Map()), globalThis.__pzkkoLimiti.get(nome))
  return {
    troppe(chiave, now = Date.now()) {
      const v = (visti.get(chiave) ?? []).filter((t) => now - t < ms)
      visti.set(chiave, v)
      if (visti.size > 5000) for (const k of [...visti.keys()].slice(0, 1000)) visti.delete(k)
      return v.length >= n
    },
    segna(chiave, now = Date.now()) { visti.get(chiave)?.push(now) ?? visti.set(chiave, [now]) },
  }
}

/** Il giorno di Mantova (AAAA-MM-GG) di un istante. */
export const giornoDi = (ms = Date.now()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
