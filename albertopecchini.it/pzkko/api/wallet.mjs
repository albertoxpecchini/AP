// /api/wallet: i conti del wallet dei $pzk (22.10 notte; pzkko/wallet/ è il portafoglio, games/pzk.js i soldi dei
// giochi). Chi non entra gioca coi 1.000 $pzk della sessione, che non si salvano e non cambiano mai; chi crea un conto
// (un nome e un PIN di quattro cifre, niente di più) ha i suoi soldi salvati qui, su Vercel Blob (pzkko/wallet.json,
// _archivio.mjs), e da lì in poi vive nella borsa (_borsa.mjs): può parcheggiarli in EUR€ (l'euroshit, l'euro finto:
// non si preleva, non si deposita, non si gioca) e riportarli in $pzk quando il cambio gli conviene.
//
// Ogni conto ha un indirizzo come quelli dei bitcoin, «pzk» più sei cifre, a caso ma uniche; lo si può cambiare UNA volta
// sola con sei cifre proprie (agli studenti unimore si consiglia il numero della loro e-mail). pzk398893 è di Alberto:
// il conto «pzkko», che si crea solo con la chiave di amministrazione (PZKKO_ADMIN_KEY, o FIRME_ADMIN_KEY) perché il
// repository è pubblico e un PIN di quattro cifre nel codice non sarebbe un segreto.
//
// I giochi girano nel browser, quindi il saldo lo dice il browser (salva): il server controlla solo che i numeri abbiano
// senso (niente salti più grandi di quello che si può vincere giocando). Gli invii fra conti (invia) si possono fare 48
// ore dopo la creazione del conto, così creare conti nuovi per regalarsi i loro 1.000 $pzk non è una strada. Le
// conversioni (converti) usano il cambio di quando il wallet si è sincronizzato (t: stato), purché non sia passata più
// di mezz'ora: dopo, il wallet deve sincronizzarsi (il cambio è quello nuovo). Il regalo di Instagram (+1.000, una volta
// per conto), le banconote perse per terra (trova: una volta al giorno ciascuna) e il sussidio (1.000 $pzk al giorno a
// chi è a secco) sono qui. Il PIN si salva con scrypt e un sale; l'accesso dà un token firmato (HMAC) che il browser
// tiene in localStorage per 180 giorni.
//
// La lumachina (23.10 sera, chat/lumaca.mjs): ogni giorno di Mantova la chiocciolina del cercapersone si sveglia con una
// salute e decide da sola la giornata, che sposta una percentuale dei $pzk del conto (medicine, visioni, affari, disastri,
// miracoli). La vive QUI, sul server, alla prima richiesta del giorno (entra, stato, salva, ogni azione; e alla creazione):
// così nessun limite sui salti la blocca e nessuno può schivarla non mandando il saldo. Se manchi da qualche giorno li vive
// tutti (al più 30). Il conto la ricorda in c.lumaca ({ g, ultime }), la vista la passa al browser (la scheda «io» del
// cercapersone ne fa la notifica), ogni giornata che sposta $pzk è una mossa ('lumaca') e le catastrofi e i miracoli sono
// notizie della banca. Il browser manda `lg`, il giorno della lumachina che il suo saldo contiene già: se una risposta s'è
// persa (la pagina chiusa al momento sbagliato), le giornate che non ha visto si aggiungono al saldo che manda, invece di
// sparire.
//
// La chat col bot (pzkko/chat/): { a: 'zaino', token } legge lo zaino di chi parla col bot (xp, oggetti, attese…) e
// { a: 'zaino', token, zaino } lo salva (al più 8 KB, forma controllata), in un file a parte, pzkko/chat.json
// ({ zaini: { [id]: zaino } }), così wallet.json non si gonfia. GET ?classifica=1 dà i dieci conti più ricchi (nome e $pzk).
// Moderazione: con la chiave, { a: 'lista', key } elenca i conti e { a: 'via', key, nome } ne cancella uno.
// Sta qui (.mjs) perché vada online anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko;
// finché la radice è albertopecchini.it, la pubblica albertopecchini.it/api/wallet.js, che la riesporta.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { archivio, aggiorna, corpo, giornoDi, ipDi, json, limite } from './_archivio.mjs'
import { borsa, tassoA, attuale } from './_borsa.mjs'
import { PATH, vuoto, offerta } from './_conti.mjs'
import { PATH_GIOCATORI, vuotoG, aggiornaGiocatore, notizia } from './_giocatori.mjs'
import { vivi, daVivere, evento } from '../chat/lumaca.mjs'

export const INIZIALE = 1000, PREMIO_IG = 1000, SUSSIDIO = 1000
export const BANCONOTE = { b500: 500, b100: 100, b25: 25, b10: 10 }
const CAP = 3000 // conti in tutto
const MINUTO = 60 * 1000, ORA = 60 * MINUTO, GIORNO = 24 * ORA
const ATTESA_INVII = 48 * ORA, VALE_CAMBIO = 30 * MINUTO, VALE_TOKEN = 180 * GIORNO
const RISERVATI = { pzkko: '398893' } // nome → indirizzo, solo con la chiave
const NOMI_PROTETTI = new Set(['pzkko', 'alberto', 'albertopecchini', 'pecchini', 'admin', 'banca', 'bancapzk', 'root'])
const mezzi = (n) => Math.round(n * 2) / 2
const cent = (n) => Math.round(n * 100) / 100
// la chiave ripulita da quello che s'incolla per sbaglio su Vercel: spazi, a capo, virgolette, «PZKKO_ADMIN_KEY=»
const pulisciChiave = (s) => (typeof s === 'string' ? s.trim().replace(/^[A-Z_]*ADMIN_KEY\s*=\s*/, '').replace(/^(["'])(.*)\1$/, '$2').trim() : '')
const chiaveAdmin = () => pulisciChiave(process.env.PZKKO_ADMIN_KEY || process.env.FIRME_ADMIN_KEY || process.env.WALLET_ADMIN_KEY) || null
const chiaveGiusta = (key) => { const k = chiaveAdmin(); return Boolean(k) && pulisciChiave(key) === k }
const erroreChiave = (msg) => (chiaveAdmin() ? msg : `${msg} (e nel progetto manca PZKKO_ADMIN_KEY)`)

// ── il PIN e il token ──
const sale = () => randomBytes(12).toString('base64url')
const hashPin = (pin, s) => scryptSync(String(pin), s, 32, { N: 16384 }).toString('base64url')
const pinGiusto = (c, pin) => { if (!c.pin) return false; const a = Buffer.from(hashPin(pin, c.pin.s)), b = Buffer.from(c.pin.h); return a.length === b.length && timingSafeEqual(a, b) }
// il segreto dei token: WALLET_SECRET, o derivato dal token di Blob o dalla chiave di amministrazione (con lo store
// collegato via OIDC il token non c'è più, e il ripiego fisso è pubblico: va bene solo in locale)
const segreto = () => {
  if (process.env.WALLET_SECRET || process.env.PZKKO_SECRET) return process.env.WALLET_SECRET || process.env.PZKKO_SECRET
  const base = process.env.BLOB_READ_WRITE_TOKEN || chiaveAdmin()
  return base ? createHmac('sha256', 'pzkko-wallet').update(base).digest('base64url') : 'pzkko-in-locale'
}
const firma = (s) => createHmac('sha256', segreto()).update(s).digest('base64url').slice(0, 27)
const token = (id, now) => { const exp = now + VALE_TOKEN; return `${id}.${exp.toString(36)}.${firma(`${id}.${exp.toString(36)}`)}` }
export const idDaToken = (t, now = Date.now()) => leggiToken(t, now)
const leggiToken = (t, now) => {
  if (typeof t !== 'string') return null
  const [id, exp, sig] = t.split('.')
  if (!id || !exp || !sig || firma(`${id}.${exp}`) !== sig) return null
  if (parseInt(exp, 36) < now) return null
  return id
}

// ── i nomi, i PIN, gli indirizzi ──
const pulisci = (s) => String(s ?? '').normalize('NFC').replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').replace(/\s+/g, ' ').trim()
const chiaveNome = (n) => n.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const validaNome = (n) => {
  if ([...n].length < 2) return 'il nome è corto: almeno 2 lettere'
  if ([...n].length > 20) return 'il nome è lungo: al massimo 20 lettere'
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(n)) return 'solo lettere, numeri, punto, trattino'
  if (/(https?|www\.|@|\/)/i.test(n)) return 'solo il nome, niente link'
  return null
}
const validaPin = (p) => (/^\d{4}$/.test(String(p ?? '')) ? null : 'il PIN è di quattro cifre')
const nuovoIndirizzo = (db) => { for (;;) { const i = String(100000 + Math.floor(Math.random() * 900000)); if (!Object.values(RISERVATI).includes(i) && !db.conti.some((c) => c.ind === i)) return i } }
const indirizzoDi = (s) => { const m = /^(?:pzk)?\s*(\d{6})$/i.exec(pulisci(s)); return m ? m[1] : null }

// il conto di Alberto (pzkko, pzk398893: la banca) non ha limiti (23.10, Alberto: «il mio account non ha limiti»): niente
// attesa di 48 ore per gli invii, niente controllo dei salti del saldo. I soldi restano soldi: non manda più di quello che ha
const illimitato = (c) => c?.k === 'pzkko'

// ── il conto come lo vede il suo padrone (mai il PIN), e il resto della risposta ──
const oggi = () => giornoDi()
const vista = (c, now) => ({
  nome: c.nome, ind: 'pzk' + c.ind, indCambiato: !!c.indCambiato, creato: c.creato, pzk: c.pzk, eur: c.eur, ig: !!c.ig,
  trovati: c.trovati?.g === oggi() ? c.trovati.q : [], sussidio: c.sussidio === oggi(), invii: illimitato(c) || c.creato + ATTESA_INVII <= now, inviiDa: illimitato(c) ? c.creato : c.creato + ATTESA_INVII,
  mosse: (c.mosse ?? []).slice(-12), lumaca: c.lumaca ? { g: c.lumaca.g, ultime: c.lumaca.ultime } : null,
  es: c.es ?? 0, esterni: (c.esterni ?? []).slice(-30),
})
const mossa = (c, m) => { (c.mosse ??= []).push(m); if (c.mosse.length > 40) c.mosse.splice(0, c.mosse.length - 40) }

// la lumachina vive i giorni che le mancano fino a oggi (chat/lumaca.mjs): una mossa per ogni giornata che sposta $pzk.
// → { delta, nuove } o null
const vive = (c, now) => vivi(c, oggi(), (v) => { if (v.n) mossa(c, { t: now, tipo: 'lumaca', n: Math.abs(v.n), verso: v.n < 0 ? 'meno' : 'piu', pct: v.pct, g: v.g, ev: v.ev }) })
// le catastrofi e i miracoli appena vissuti diventano notizie della banca (se il database dei giocatori non va, pazienza)
async function notizieLumaca(c, lu, now) {
  const gravi = (lu?.nuove ?? []).filter((v) => Math.abs(v.pct) >= 25)
  if (!gravi.length) return
  try {
    const dbG = await archivio(PATH_GIOCATORI, vuotoG)
    if (dbG) await aggiorna(dbG, (g) => { for (const v of gravi) notizia(g, c, 'lumaca', { ev: v.ev, pct: v.pct, titolo: evento(v.ev)?.titolo ?? '' }, now) })
  } catch (e) { console.warn('notizie lumaca:', e.message) }
}

// il saldo che dice il browser: si accetta se ha senso (quello che si può vincere giocando in quel tempo: nessun gioco
// paga più di 35 a 1 su una fiche da 500, e un giro dura secondi)
// `lg`: il giorno della lumachina che il saldo del browser contiene già (null: nessuno); le giornate vissute dopo, che il
// browser non ha visto, si aggiungono (undefined: un browser di prima della lumachina, niente da aggiungere)
const lgDi = (x) => (x === null || (typeof x === 'string' && /^\d{4}-\d\d-\d\d$/.test(x)) ? x : undefined)
// I SOLDI CHE ARRIVANO DA FUORI (23.10): un invio ricevuto da un altro conto, un'operazione della banca. Il saldo lo dice il
// browser, e un browser aperto col saldo di prima li cancellerebbe (o, per chi manda, li duplicherebbe). Ognuno ha un
// numero (c.es, il contatore, e c.esterni, gli ultimi 30 { s, n }); il browser manda `es`, l'ultimo che conosce, e quelli
// dopo si aggiungono al saldo che manda (undefined: un browser di prima, niente da aggiungere)
const esDi = (x) => (Number.isInteger(x) && x >= 0 ? x : undefined)
const esterno = (c, n) => { c.es = (c.es ?? 0) + 1; (c.esterni ??= []).push({ s: c.es, n }); if (c.esterni.length > 30) c.esterni.splice(0, c.esterni.length - 30) }
function accogli(c, pzk, now, lg, es) {
  if (pzk === undefined || pzk === null) return null
  if (typeof pzk !== 'number' || !Number.isFinite(pzk) || pzk < 0 || pzk > 1e8) return 'saldo strano'
  if (lg !== undefined) for (const v of c.lumaca?.ultime ?? []) if (lg === null || v.g > lg) pzk = Math.max(0, pzk + v.n)
  if (es !== undefined) for (const v of c.esterni ?? []) if (v.s > es) pzk = Math.max(0, pzk + v.n)
  pzk = mezzi(pzk)
  const secondi = Math.max(0, (now - (c.salvato ?? c.creato)) / 1000)
  if (!illimitato(c) && pzk - c.pzk > 20000 + 1200 * secondi) return 'il saldo non torna: ricarico quello salvato'
  c.pzk = pzk; c.salvato = now
  return null
}

// lo zaino della chat: la forma che accetta (numeri finiti, oggetti piccoli, al più MAX_ZAINO byte)
const PATH_CHAT = process.env.CHAT_BLOB_PATH || 'pzkko/chat.json', MAX_ZAINO = 12 * 1024
const vuotoChat = () => ({ zaini: {} })
const zainoValido = (z) => {
  if (!z || typeof z !== 'object' || z.v !== 1 || !Number.isFinite(z.xp) || z.xp < 0) return false
  for (const k of ['oggetti', 'attese', 'effetti', 'serie', 'stat']) if (z[k] && (typeof z[k] !== 'object' || Array.isArray(z[k]) || Object.keys(z[k]).length > 120)) return false
  return JSON.stringify(z).length <= MAX_ZAINO
}
const limiti = { crea: limite('wallet-crea', 3, GIORNO), entra: limite('wallet-entra', 8, 10 * MINUTO), tutte: limite('wallet-tutte', 300, 10 * MINUTO) }

// LE OPERAZIONI DELLA BANCA: passaggi che Alberto chiede e che fa il server, una volta sola ciascuno (segnati in
// db.operazioni[id], col risultato: quelle non andate si ritentano), alla prima richiesta di ogni istanza della funzione. Per chi manda e per chi riceve sono soldi da
// fuori (esterno), con la mossa sul conto. GET ?operazioni=1 dice com'è andata.
export const OPERAZIONI = [
  // 23.10.2026, Alberto: «fai da solo un passaggio da wallet 398893 a 113089 di 5000 pzk»
  { id: '2026-10-23-398893-113089-5000', da: '398893', a: '113089', n: 5000 },
]
let operazioniViste = false
async function operazioni(store, now) {
  if (operazioniViste) return
  const { db } = await store.read()
  if (OPERAZIONI.every((o) => db.operazioni?.[o.id]?.ok)) { operazioniViste = true; return }
  await aggiorna(store, (db) => {
    let fatto = false
    for (const o of OPERAZIONI) {
      if (db.operazioni?.[o.id]?.ok) continue // fatta; una che non è andata (un conto che manca, i soldi che non bastano) si ritenta
      const c = db.conti.find((x) => x.ind === o.da), d = db.conti.find((x) => x.ind === o.a), n = mezzi(o.n)
      const esito = !c ? 'manca il conto pzk' + o.da : !d ? 'manca il conto pzk' + o.a : c.pzk < n ? `pzk${o.da} ha ${c.pzk} $pzk, non ${n}` : null
      if (!esito) {
        c.pzk = mezzi(c.pzk - n); d.pzk = mezzi(d.pzk + n); esterno(c, -n); esterno(d, n)
        mossa(c, { t: now, tipo: 'inviato', n, a: 'pzk' + d.ind, nome: d.nome })
        mossa(d, { t: now, tipo: 'ricevuto', n, da: 'pzk' + c.ind, nome: c.nome })
      }
      ;(db.operazioni ??= {})[o.id] = { t: now, ok: !esito, ...(esito && { errore: esito }) }
      fatto = true
    }
    return fatto ? {} : { invariato: true }
  })
  operazioniViste = true
}

export default async function handler(req, res) {
  const store = await archivio(PATH, vuoto)
  if (store) await operazioni(store, Date.now()).catch((e) => console.warn('operazioni:', e.message))
  if (!store) return json(res, 503, { ok: false, offline: true, errore: 'il wallet è in pausa: per ora valgono i 1.000 $pzk della sessione' }, 'public, s-maxage=30')
  const now = Date.now()
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const url = new URL(req.url, 'http://x')
      const ind = indirizzoDi(url.searchParams.get('ind'))
      const { db } = await store.read()
      if (url.searchParams.has('operazioni')) return json(res, 200, { ok: true, operazioni: OPERAZIONI.map((o) => ({ id: o.id, da: 'pzk' + o.da, a: 'pzk' + o.a, n: o.n, ...(db.operazioni?.[o.id] ?? { fatta: false }) })) })
      if (url.searchParams.has('classifica')) return json(res, 200, { ok: true, classifica: [...db.conti].sort((a, b) => b.pzk - a.pzk).slice(0, 10).map((c) => ({ nome: c.nome, pzk: c.pzk })) }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
      if (ind) { const c = db.conti.find((x) => x.ind === ind); return c ? json(res, 200, { ok: true, conto: { nome: c.nome, ind: 'pzk' + c.ind, creato: c.creato } }, 'public, s-maxage=20') : json(res, 404, { ok: false, errore: 'nessun conto con questo indirizzo' }) }
      return json(res, 200, { ok: true, ...offerta(db) }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return json(res, 405, { ok: false, errore: 'solo GET e POST' }) }
    const ip = ipDi(req)
    if (limiti.tutte.troppe(ip, now)) return json(res, 429, { ok: false, errore: 'con calma' })
    limiti.tutte.segna(ip, now)
    let body
    try { body = await corpo(req, 12 * 1024) } catch { return json(res, 400, { ok: false, errore: 'richiesta sbagliata' }) }
    if (!body || typeof body !== 'object') return json(res, 400, { ok: false, errore: 'richiesta sbagliata' })
    const a = body.a

    // ── la moderazione ──
    if (a === 'lista' || a === 'via') {
      if (!chiaveGiusta(body.key)) return json(res, 403, { ok: false, errore: erroreChiave('no') })
      if (a === 'lista') { const { db } = await store.read(); return json(res, 200, { ok: true, ...offerta(db), conti: db.conti.map((c) => ({ ...vista(c, now), id: c.id, pin: !!c.pin })) }) }
      const r = await aggiorna(store, (db) => { const i = db.conti.findIndex((c) => c.k === chiaveNome(pulisci(body.nome))); if (i < 0) return { errore: 'non c’è' }; db.conti.splice(i, 1) })
      return json(res, r.errore ? 404 : 200, { ok: !r.errore, errore: r.errore })
    }

    // ── creare un conto, entrare ──
    if (a === 'crea') {
      const nome = pulisci(body.nome), e = validaNome(nome) || validaPin(body.pin)
      if (e) return json(res, 400, { ok: false, errore: e })
      const k = chiaveNome(nome)
      if (NOMI_PROTETTI.has(k) && !chiaveGiusta(body.key)) return json(res, 403, { ok: false, errore: erroreChiave('questo nome è di Alberto') })
      if (limiti.crea.troppe(ip, now)) return json(res, 429, { ok: false, errore: 'troppi conti da qui: uno basta' })
      const r = await aggiorna(store, (db) => {
        if (db.conti.length >= CAP) return { errore: 'la banca è piena' }
        if (db.conti.some((c) => c.k === k)) return { errore: 'questo nome c’è già: entra, o scegline un altro' }
        const s = sale()
        const c = { id: now.toString(36) + randomBytes(4).toString('base64url'), nome, k, pin: { s, h: hashPin(body.pin, s) }, ind: RISERVATI[k] ?? nuovoIndirizzo(db), indCambiato: false, creato: now, pzk: INIZIALE, eur: 0, ig: false, salvato: now }
        mossa(c, { t: now, tipo: 'nato', n: INIZIALE })
        db.conti.push(c)
        return { c, lu: vive(c, now) } // la lumachina nasce col conto e vive già oggi
      })
      if (r.errore) return json(res, 409, { ok: false, errore: r.errore })
      limiti.crea.segna(ip, now)
      await notizieLumaca(r.c, r.lu, now)
      const b = await borsa(now)
      return json(res, 200, { ok: true, nuovo: true, token: token(r.c.id, now), conto: vista(r.c, now), tasso: b ? attuale(b) : 1, t: now, ...(r.lu && { lumaca: r.lu }) })
    }
    if (a === 'entra') {
      const nome = pulisci(body.nome), k = chiaveNome(nome)
      if (!k || validaPin(body.pin)) return json(res, 400, { ok: false, errore: 'nome e PIN di quattro cifre' })
      if (limiti.entra.troppe(ip + '|' + k, now)) return json(res, 429, { ok: false, errore: 'troppi tentativi: riprova fra dieci minuti' })
      limiti.entra.segna(ip + '|' + k, now)
      const { db } = await store.read()
      let c = db.conti.find((x) => x.k === k)
      if (!c || !pinGiusto(c, body.pin)) return json(res, 401, { ok: false, errore: 'nome o PIN sbagliati' })
      let lu = null
      if (daVivere(c.lumaca?.g, oggi()).length) { // la lumachina ha giorni da vivere: una scrittura, al più una al giorno
        const id = c.id
        const r = await aggiorna(store, (d) => { const x = d.conti.find((y) => y.id === id); if (!x) return { invariato: true }; const l = vive(x, now); return l ? { c: x, lu: l } : { invariato: true, c: x } })
        if (r.c) c = r.c
        lu = r.lu ?? null
        await notizieLumaca(c, lu, now)
      }
      const b = await borsa(now)
      return json(res, 200, { ok: true, token: token(c.id, now), conto: vista(c, now), tasso: b ? attuale(b) : 1, t: now, ...(lu && { lumaca: lu }) })
    }

    // ── da qui in poi serve il token ──
    const id = leggiToken(body.token, now)
    if (!id) return json(res, 401, { ok: false, errore: 'entra di nuovo', esci: true })
    const b = await borsa(now)
    const tasso = b ? attuale(b) : 1
    const risposta = (c, extra = {}) => ({ ok: true, conto: vista(c, now), tasso, t: now, ...extra })

    if (a === 'zaino') {
      const chat = await archivio(PATH_CHAT, vuotoChat)
      if (!chat) return json(res, 503, { ok: false, offline: true, errore: 'lo zaino è in pausa' })
      if (body.zaino === undefined) { const { db } = await chat.read(); return json(res, 200, { ok: true, zaino: db.zaini[id] ?? null }) }
      if (!zainoValido(body.zaino)) return json(res, 400, { ok: false, errore: 'zaino strano' })
      const r = await aggiorna(chat, (db) => { const mio = db.zaini[id]; if (mio && mio.t > (body.zaino.t ?? 0)) return { invariato: true, zaino: mio }; db.zaini[id] = body.zaino; return { zaino: body.zaino } })
      // la riga pubblica del giocatore nel database (api/_giocatori.mjs): se non va, lo zaino è salvo lo stesso
      if (!r.invariato) {
        try {
          const dbG = await archivio(PATH_GIOCATORI, vuotoG)
          const conto = dbG && (await store.read()).db.conti.find((x) => x.id === id)
          if (conto) await aggiorna(dbG, (g) => { aggiornaGiocatore(g, conto, r.zaino, now) })
        } catch (e) { console.warn('giocatori:', e.message) }
      }
      return json(res, 200, { ok: true, zaino: r.zaino })
    }

    if (a === 'stato' || a === 'salva') {
      const r = await aggiorna(store, (db) => {
        const c = db.conti.find((x) => x.id === id)
        if (!c) return { errore: 'conto sparito', esci: true }
        const prima = c.pzk, avviso = accogli(c, body.pzk, now, lgDi(body.lg), esDi(body.es)), lu = vive(c, now)
        if (c.pzk === prima && !lu) return { invariato: true, c, avviso }
        return { c, avviso, lu }
      })
      if (r.errore) return json(res, 401, { ok: false, errore: r.errore, esci: r.esci })
      await notizieLumaca(r.c, r.lu, now)
      return json(res, 200, risposta(r.c, { ...(r.avviso && { avviso: r.avviso }), ...(r.lu && { lumaca: r.lu }) }))
    }

    // le altre azioni cambiano il conto: prima il saldo del browser, poi la lumachina, poi la mossa. Se l'azione dice di no
    // ma la lumachina ha appena vissuto, si salva lo stesso (il no diventa un «rifiuto»): la giornata non va persa, se no il
    // browser la vedrebbe e il server no, e la richiesta dopo la vivrebbe due volte
    const azione = (fai) => aggiorna(store, (db) => {
      const c = db.conti.find((x) => x.id === id)
      if (!c) return { errore: 'conto sparito', esci: true }
      const avviso = accogli(c, body.pzk, now, lgDi(body.lg), esDi(body.es))
      if (avviso) return { errore: avviso, c }
      const lu = vive(c, now)
      const esito = fai(c, db) ?? {}
      if (esito.errore && lu) return { c, lu, rifiuto: esito.errore }
      return { c, lu, ...esito }
    })
    const manda = async (r, extra = {}) => {
      await notizieLumaca(r.c, r.lu, now)
      const errore = r.errore ?? r.rifiuto, lumaca = r.lu ? { lumaca: r.lu } : {}
      return errore ? json(res, r.esci ? 401 : 409, { ok: false, errore, esci: r.esci, ...(r.c && { conto: vista(r.c, now), tasso, t: now }), ...lumaca }) : json(res, 200, risposta(r.c, { ...extra, ...lumaca }))
    }

    if (a === 'converti') {
      const da = body.da === 'eur' ? 'eur' : 'pzk', quanto = Number(body.quanto), t = Number(body.t)
      if (!Number.isFinite(quanto) || quanto <= 0) return json(res, 400, { ok: false, errore: 'quanto?' })
      if (!Number.isFinite(t) || now - t > VALE_CAMBIO || t > now + MINUTO) return json(res, 409, { ok: false, errore: 'il cambio è vecchio: sincronizzo', sincronizza: true, tasso, t: now })
      const cambio = b ? tassoA(b, t) : 1 // quello che il wallet mostrava
      return manda(await azione((c) => {
        if (da === 'pzk') {
          const n = mezzi(Math.min(quanto, c.pzk))
          if (n < 0.5) return { errore: 'non hai $pzk da convertire' }
          const e = cent(n * cambio)
          c.pzk = mezzi(c.pzk - n); c.eur = cent(c.eur + e)
          mossa(c, { t: now, tipo: 'in-eur', n, eur: e, cambio })
          return { fatto: { da: 'pzk', n, eur: e, cambio } }
        }
        const e = cent(Math.min(quanto, c.eur))
        if (e < 0.01) return { errore: 'non hai EUR€ da convertire' }
        const n = mezzi(e / cambio)
        if (n < 0.5) return { errore: 'troppo pochi: non fanno nemmeno mezzo $pzk' }
        c.eur = cent(c.eur - e); c.pzk = mezzi(c.pzk + n)
        mossa(c, { t: now, tipo: 'in-pzk', n, eur: e, cambio })
        return { fatto: { da: 'eur', n, eur: e, cambio } }
      }), { cambio })
    }
    if (a === 'invia') {
      const ind = indirizzoDi(body.a_ind ?? body.ind), quanto = mezzi(Number(body.quanto))
      if (!ind) return json(res, 400, { ok: false, errore: 'l’indirizzo è pzk più sei cifre' })
      if (!Number.isFinite(quanto) || quanto < 1) return json(res, 400, { ok: false, errore: 'almeno 1 $pzk' })
      return manda(await azione((c, db) => {
        if (!illimitato(c) && c.creato + ATTESA_INVII > now) return { errore: `gli invii si aprono 48 ore dopo la creazione del conto: ${new Date(c.creato + ATTESA_INVII).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` }
        const d = db.conti.find((x) => x.ind === ind)
        if (!d) return { errore: 'nessun conto con questo indirizzo' }
        if (d.id === c.id) return { errore: 'sei tu' }
        if (quanto > c.pzk) return { errore: `non ti bastano: hai ${c.pzk} $pzk` }
        c.pzk = mezzi(c.pzk - quanto); d.pzk = mezzi(d.pzk + quanto); esterno(d, quanto)
        mossa(c, { t: now, tipo: 'inviato', n: quanto, a: 'pzk' + d.ind, nome: d.nome })
        mossa(d, { t: now, tipo: 'ricevuto', n: quanto, da: 'pzk' + c.ind, nome: c.nome })
        return { fatto: { a: 'pzk' + d.ind, nome: d.nome, n: quanto } }
      }))
    }
    if (a === 'indirizzo') {
      const nuovo = indirizzoDi(body.nuovo)
      if (!nuovo) return json(res, 400, { ok: false, errore: 'sei cifre' })
      return manda(await azione((c, db) => {
        if (c.indCambiato) return { errore: 'l’indirizzo si cambia una volta sola, e l’hai già fatto' }
        if (Object.values(RISERVATI).includes(nuovo) && !chiaveGiusta(body.key)) return { errore: 'questo è di Alberto' }
        if (db.conti.some((x) => x.ind === nuovo)) return { errore: 'questo indirizzo è già di qualcuno' }
        mossa(c, { t: now, tipo: 'indirizzo', da: 'pzk' + c.ind, a: 'pzk' + nuovo })
        c.ind = nuovo; c.indCambiato = true
      }))
    }
    if (a === 'pin') {
      if (validaPin(body.nuovo)) return json(res, 400, { ok: false, errore: 'il PIN nuovo è di quattro cifre' })
      return manda(await azione((c) => {
        if (!pinGiusto(c, body.vecchio)) return { errore: 'il PIN vecchio è sbagliato' }
        const s = sale(); c.pin = { s, h: hashPin(body.nuovo, s) }
      }))
    }
    if (a === 'ig') return manda(await azione((c) => { if (c.ig) return { errore: 'il regalo l’hai già avuto' }; c.ig = true; c.pzk = mezzi(c.pzk + PREMIO_IG); mossa(c, { t: now, tipo: 'instagram', n: PREMIO_IG }) }))
    if (a === 'trova') {
      const v = BANCONOTE[body.quale]
      if (!v) return json(res, 400, { ok: false, errore: 'quale banconota?' })
      return manda(await azione((c) => {
        const g = oggi()
        if (c.trovati?.g !== g) c.trovati = { g, q: [] }
        if (c.trovati.q.includes(body.quale)) return { errore: 'questa l’hai già raccolta oggi' }
        c.trovati.q.push(body.quale); c.pzk = mezzi(c.pzk + v)
        mossa(c, { t: now, tipo: 'trovato', n: v })
      }))
    }
    if (a === 'sussidio') return manda(await azione((c) => {
      if (c.pzk >= 1 || c.eur >= 0.01) return { errore: 'non sei a secco' }
      if (c.sussidio === oggi()) return { errore: 'il sussidio è uno al giorno: domani' }
      c.sussidio = oggi(); c.pzk = mezzi(c.pzk + SUSSIDIO); mossa(c, { t: now, tipo: 'sussidio', n: SUSSIDIO })
    }))
    return json(res, 400, { ok: false, errore: 'richiesta sbagliata' })
  } catch (e) {
    if (e.occupato) return json(res, 503, { ok: false, errore: 'troppa gente insieme: riprova' })
    console.error('wallet:', e)
    return json(res, 500, { ok: false, errore: 'qualcosa non va: riprova' })
  }
}
