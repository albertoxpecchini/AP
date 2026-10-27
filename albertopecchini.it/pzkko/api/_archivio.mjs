// L'archivio delle funzioni di pzkko.it che devono ricordare qualcosa (il wallet dei $pzk e la borsa, api/wallet.mjs e
// api/borsa.mjs; la petizione, api/firme.mjs, ha il suo uguale): un file JSON privato su Vercel Blob per ognuna, letto
// sempre dall'origine e riscritto con `ifMatch` sull'ETag, così due scritture nello stesso istante non si cancellano (chi
// perde rilegge e riprova). Le credenziali le mette Vercel collegando uno store Blob al progetto pzkko: una volta il
// token (BLOB_READ_WRITE_TOKEN), adesso l'id dello store (BLOB_STORE_ID, o col prefisso scelto nel collegamento, come
// BLOB_READ_WRITE_TOKEN_STORE_ID) e il token OIDC della funzione, che @vercel/blob prende da sé.
// Senza credenziali, online, l'archivio non c'è (null: la funzione risponde «offline»); in locale (il server di npm run
// dev:pzkko, o PZKKO_STORE=memory) tutto sta in memoria finché il server non si ferma.
// (Comincia per _ : Vercel non ne fa una funzione.)

const memorie = (globalThis.__pzkkoArchivi ??= new Map())

/** Le opzioni di Blob per arrivare allo store (col token di una volta, nessuna), o null se lo store non è collegato. */
export function blobOpzioni() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return {}
  const storeId = process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN_STORE_ID
  return storeId ? { storeId } : null
}

/** L'archivio del file `path` (es. pzkko/wallet.json): { read() → { db, etag }, write(db, etag) → bool }, o null. */
export async function archivio(path, vuoto) {
  const opz = blobOpzioni()
  if (opz && process.env.PZKKO_STORE !== 'memory') {
    const blob = await import('@vercel/blob')
    return {
      /** Solo l'ETag, senza scaricare il file (null se non c'è): serve a chi guarda se qualcosa è cambiato (api/live.mjs). */
      async etag() { const m = await blob.head(path, opz).catch((e) => { if (e instanceof blob.BlobNotFoundError) return null; throw e }); return m?.etag ?? null },
      async read() {
        const meta = await blob.head(path, opz).catch((e) => { if (e instanceof blob.BlobNotFoundError) return null; throw e })
        if (!meta) return { db: vuoto(), etag: null }
        const r = await blob.get(path, { ...opz, access: 'private', useCache: false })
        if (!r || !r.stream) return { db: vuoto(), etag: null }
        return { db: await new Response(r.stream).json(), etag: meta.etag }
      },
      async write(db, etag) {
        try {
          await blob.put(path, JSON.stringify(db), { ...opz, access: 'private', addRandomSuffix: false, allowOverwrite: Boolean(etag), contentType: 'application/json', ...(etag && { ifMatch: etag }) })
          return true
        } catch (e) {
          if (e instanceof blob.BlobPreconditionFailedError || /already exists|precondition/i.test(e.message)) return false
          throw e
        }
      },
    }
  }
  if (process.env.PZKKO_STORE === 'memory' || !process.env.VERCEL) {
    const m = memorie.get(path) ?? memorie.set(path, { db: null, etag: 0 }).get(path)
    return {
      async etag() { return String(m.etag) },
      async read() { return { db: structuredClone(m.db ?? vuoto()), etag: String(m.etag) } },
      async write(db, etag) { if (etag !== String(m.etag)) return false; m.db = structuredClone(db); m.etag++; return true },
    }
  }
  return null
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
