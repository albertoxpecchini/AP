// La petizione di pzkko.it, «pzkko.it è un bel sito?» (il foglio con le bic legate allo spago, sul muro della home): le
// firme vere, salvate e uguali per tutti. Chi firma lascia il nome (2–32 caratteri) e la penna con cui firma (blu,
// nera, rossa); l'ora la mette il server. Chi guarda vede le ultime firme sul foglio, con la data e l'ora di Mantova.
//
// Dove sta: un file privato su Vercel Blob (`pzkko/firme.json`), come il database di Better Call Pekko (api/bcp.js):
// letto sempre dall'origine e riscritto con `ifMatch` sull'ETag, così due firme nello stesso istante non si cancellano
// (chi perde riprova). Il token (BLOB_READ_WRITE_TOKEN) lo mette Vercel collegando uno store Blob al progetto pzkko.
// Senza token, online, la funzione risponde «offline» (il foglio si vede, ma non si firma); in locale (il server di
// npm run dev:pzkko, o FIRME_STORE=memory) le firme stanno in memoria finché il server non si ferma.
//
// Protezioni: campo trappola e tempo minimo da quando il foglio si è avvicinato, limite di frequenza per IP (in memoria,
// l'IP non si salva), lo stesso nome una volta al giorno, niente link, numeri di telefono o parolacce nei nomi.
// Moderazione: con FIRME_ADMIN_KEY impostata nel progetto, `{ a: 'via', key, id }` cancella una firma
// (node tools/pzkko/firme.mjs via <id>).
//
// Sta qui (.mjs) perché vada online anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko;
// finché la radice è albertopecchini.it, la pubblica albertopecchini.it/api/firme.js, che la riesporta.

import { blobOpzioni } from './_archivio.mjs'

const PATH = process.env.FIRME_BLOB_PATH || 'pzkko/firme.json'
const MAX_BODY = 2 * 1024
const CAP = 5000 // firme in tutto: oltre, il foglio è pieno
const MOSTRA = 300 // quante se ne mandano a chi guarda (le ultime)
const PENNE = ['blu', 'nera', 'rossa']
const MINUTO = 60 * 1000, GIORNO = 24 * 60 * MINUTO

const json = (res, status, body, cache = 'no-store') => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', cache)
  res.end(JSON.stringify(body))
}

// ── l'archivio: Vercel Blob, oppure la memoria (in locale), oppure niente ─────
// (in memoria: su globalThis, perché il server di prova reimporta questo file a ogni richiesta)
const memoria = (globalThis.__pzkkoFirme ??= { db: null, etag: 0 })
const vuoto = () => ({ firme: [] })

async function backend() {
  const opz = blobOpzioni() // il token di una volta, o l'id dello store con OIDC (vedi _archivio.mjs)
  if (opz && process.env.FIRME_STORE !== 'memory') {
    const blob = await import('@vercel/blob')
    return {
      async read() {
        // prima l'ETag vero (head), poi il contenuto: se qualcuno scrive nel mezzo, il nostro ifMatch fallisce e si
        // riprova (vedi api/bcp.js)
        const meta = await blob.head(PATH, opz).catch((e) => { if (e instanceof blob.BlobNotFoundError) return null; throw e })
        if (!meta) return { db: vuoto(), etag: null }
        const r = await blob.get(PATH, { ...opz, access: 'private', useCache: false })
        if (!r || !r.stream) return { db: vuoto(), etag: null }
        return { db: await new Response(r.stream).json(), etag: meta.etag }
      },
      async write(db, etag) {
        try {
          await blob.put(PATH, JSON.stringify(db), { ...opz, access: 'private', addRandomSuffix: false, allowOverwrite: Boolean(etag), contentType: 'application/json', ...(etag && { ifMatch: etag }) })
          return true
        } catch (e) {
          if (e instanceof blob.BlobPreconditionFailedError || /already exists|precondition/i.test(e.message)) return false
          throw e
        }
      },
    }
  }
  if (process.env.FIRME_STORE === 'memory' || !process.env.VERCEL) {
    return {
      async read() { return { db: structuredClone(memoria.db ?? vuoto()), etag: String(memoria.etag) } },
      async write(db, etag) { if (etag !== String(memoria.etag)) return false; memoria.db = db; memoria.etag++; return true },
    }
  }
  return null
}

/** Legge, applica `cambia` e riscrive; se qualcuno ha scritto nel frattempo, riprova coi dati nuovi. */
async function aggiorna(store, cambia) {
  for (let i = 0; i < 9; i++) {
    const { db, etag } = await store.read()
    const esito = cambia(db)
    if (esito?.errore) return { db, ...esito }
    if (await store.write(db, etag)) return { db, ...esito }
    await new Promise((r) => setTimeout(r, (80 + Math.random() * 220) * (1 + i / 2)))
  }
  throw Object.assign(new Error('troppe firme insieme'), { occupato: true })
}

const pubblico = (db) => ({ totale: db.firme.length, firme: db.firme.slice(-MOSTRA).map(({ id, n, t, c }) => ({ id, n, t, c })) })

// ── i nomi ───────────────────────────────────────────────────────────────────
// lettere di qualunque alfabeto, spazi, punto, apostrofo e trattino; qualche cifra sì (un soprannome), un numero di
// telefono no; niente emoji, link, indirizzi
const pulisci = (s) => String(s ?? '').normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').replace(/\s+/g, ' ').trim()
const FORMA = /^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'’-]*$/u
const LINK = /(https?|www|\.(com|it|net|org|io|xyz|ly|me|tk|ru|info)\b|@|\/)/i
// le parole che sul foglio non vanno: per pezzi (dentro una parola, anche con spazi o punti in mezzo) e intere (le corte,
// che dentro altre parole sono innocue). Il confronto è sul nome senza accenti, in minuscolo, coi numeri letti come
// lettere (c4zz0, s3x)
const PEZZI = ['cazz', 'stronz', 'puttan', 'vaffanc', 'fanculo', 'coglion', 'pompin', 'bocchin', 'mignott', 'zoccol', 'ricchion', 'froci', 'porcodio', 'diocane', 'dioporco', 'diomaiale', 'porcamadonna', 'madonnaputtana', 'troiad', 'nigger', 'nigga', 'faggot', 'fuck', 'cunt', 'bitch', 'whore', 'pedofil', 'hitler', 'heilhit']
// (niente cognomi veri: Negri, Negro, Finocchio, Mussolini sono persone, e il filtro non respinge nessuno per il suo nome)
const INTERE = ['culo', 'figa', 'fica', 'troia', 'troie', 'merda', 'cesso', 'shit', 'dick', 'cock', 'sex', 'porn', 'porno', 'nazi', 'kkk', 'pene', 'tette']
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', $: 's', '€': 'e' }
const brutto = (nome) => {
  const base = nome.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[013457 8$€]/g, (c) => LEET[c] ?? c)
  const tutto = base.replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1')
  const parole = base.split(/[^a-z]+/).filter(Boolean)
  return PEZZI.some((p) => tutto.includes(p.replace(/(.)\1+/g, '$1'))) || parole.some((p) => INTERE.includes(p) || INTERE.includes(p.replace(/(.)\1+/g, '$1')))
}
const chiave = (nome) => nome.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

function valida(nome) {
  if (nome.length < 2) return 'scrivi il tuo nome'
  if ([...nome].length > 32) return 'il nome è troppo lungo (al massimo 32 lettere)'
  if (LINK.test(nome)) return 'solo il nome, niente link'
  if (!FORMA.test(nome)) return 'solo lettere: niente simboli né emoji'
  if ((nome.match(/\p{N}/gu) ?? []).length > 4) return 'niente numeri di telefono'
  if (brutto(nome)) return 'questo sul foglio non lo scrivo'
  return null
}

// ── il limite di frequenza (in memoria, per istanza; l'IP non si salva da nessuna parte) ──
const visti = (globalThis.__pzkkoFirmeIp ??= new Map())
function troppe(ip, now) {
  const v = (visti.get(ip) ?? []).filter((t) => now - t < GIORNO)
  visti.set(ip, v)
  if (visti.size > 5000) for (const k of [...visti.keys()].slice(0, 1000)) visti.delete(k)
  return v.filter((t) => now - t < 10 * MINUTO).length >= 2 || v.length >= 6
}

async function leggi(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const parti = []
  let n = 0
  for await (const p of req) { n += p.length; if (n > MAX_BODY) throw new Error('corpo troppo grande'); parti.push(p) }
  return JSON.parse(Buffer.concat(parti).toString('utf8') || '{}')
}

export default async function handler(req, res) {
  const store = await backend()
  if (!store) return json(res, 503, { ok: false, offline: true, errore: 'la petizione è in pausa: riprova più tardi' }, 'public, s-maxage=30')
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const { db } = await store.read()
      // venti secondi di cache sulla rete di Vercel (e cinque minuti di riuso mentre si rinfresca): tante visite, poche
      // letture del Blob, che sul piano gratuito sono contate. Chi firma vede subito la sua firma (gliela dà la POST)
      return json(res, 200, { ok: true, ...pubblico(db) }, 'public, max-age=0, s-maxage=20, stale-while-revalidate=300')
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return json(res, 405, { ok: false, errore: 'solo GET e POST' }) }

    let body
    try { body = await leggi(req) } catch { return json(res, 400, { ok: false, errore: 'richiesta sbagliata' }) }
    if (!body || typeof body !== 'object') return json(res, 400, { ok: false, errore: 'richiesta sbagliata' })
    const now = Date.now()

    if (body.a === 'via') {
      const k = process.env.FIRME_ADMIN_KEY
      if (!k || body.key !== k) return json(res, 403, { ok: false, errore: 'no' })
      const r = await aggiorna(store, (db) => {
        const i = db.firme.findIndex((f) => f.id === body.id)
        if (i < 0) return { errore: 'non c’è' }
        db.firme.splice(i, 1)
      })
      return json(res, r.errore ? 404 : 200, { ok: !r.errore, errore: r.errore, ...pubblico(r.db) })
    }
    if (body.a !== 'firma') return json(res, 400, { ok: false, errore: 'richiesta sbagliata' })

    // le trappole per i bot: il campo che una persona non vede (si finge di aver firmato) e la fretta
    if (body.sito) return json(res, 200, { ok: true, ...pubblico((await store.read()).db) })
    if (typeof body.aperto !== 'number' || now - body.aperto < 2500) return json(res, 429, { ok: false, errore: 'con calma: leggi il foglio, prima' })

    const nome = pulisci(body.nome), errore = valida(nome)
    if (errore) return json(res, 400, { ok: false, errore })
    const c = Math.max(0, PENNE.indexOf(body.penna))
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
    if (troppe(ip, now)) return json(res, 429, { ok: false, errore: 'hai già firmato: una firma basta' })

    const r = await aggiorna(store, (db) => {
      if (db.firme.length >= CAP) return { errore: 'il foglio è pieno' }
      const k = chiave(nome)
      if (db.firme.some((f) => now - f.t < GIORNO && chiave(f.n) === k)) return { errore: 'questo nome ha già firmato oggi' }
      // in tutta l'ultima ora, al massimo 120 firme: se arrivano a valanga è una macchina
      if (db.firme.filter((f) => now - f.t < 60 * MINUTO).length >= 120) return { errore: 'troppe firme tutte insieme: riprova fra un po’' }
      const firma = { id: now.toString(36) + Math.random().toString(36).slice(2, 6), n: nome, t: now, c }
      db.firme.push(firma)
      return { firma }
    })
    if (r.errore) return json(res, 409, { ok: false, errore: r.errore, ...pubblico(r.db) })
    visti.get(ip)?.push(now) ?? visti.set(ip, [now])
    return json(res, 200, { ok: true, firma: r.firma, ...pubblico(r.db) })
  } catch (e) {
    if (e.occupato) return json(res, 503, { ok: false, errore: 'troppe firme insieme: riprova' })
    console.error('firme:', e)
    return json(res, 500, { ok: false, errore: 'qualcosa non va: riprova' })
  }
}
