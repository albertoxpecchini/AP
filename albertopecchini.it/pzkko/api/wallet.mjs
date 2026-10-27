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
// { a: 'zaino', token, zaino, visto } lo salva unito a quello che c'è (al più 8 KB, forma controllata; 26.10: chi scrive
// senza aver visto l'ultimo salvato non lo cancella, chat/zaino-unisci.mjs), in un file a parte, pzkko/chat.json
// ({ zaini: { [id]: zaino } }), così wallet.json non si gonfia. GET ?classifica=1 dà i dieci conti più ricchi (nome e $pzk).
// Moderazione: con la chiave, { a: 'lista', key } elenca i conti e { a: 'via', key, nome } ne cancella uno.
// L'ECONOMIA (26.10, _economia.mjs): ogni salvataggio dice dove sono andati i soldi (`flussi`: alla cassa di pzk o persi
// per terra; il resto è conio), la lumachina, il sussidio, le banconote e instagram coniano, il cambio passa dalla cassa;
// i soldi sporchi (il bottino delle rapine) non si mandano né si cambiano; le azioni nuove: colpo (la rapina alla cassa,
// almeno in due), lava (la lavatrice), decifra (i wallet trovati dallo spazzino), arresto e cauzione (la galera).
// Sta qui (.mjs) perché vada online anche quando il progetto pzkko avrà la Root Directory in albertopecchini.it/pzkko;
// finché la radice è albertopecchini.it, la pubblica albertopecchini.it/api/wallet.js, che la riesporta.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { archivio, aggiorna, corpo, giornoDi, ipDi, json, limite } from './_archivio.mjs'
import { borsa, tassoA, attuale } from './_borsa.mjs'
import { PATH, vuoto, offerta } from './_conti.mjs'
import { PATH_GIOCATORI, vuotoG, aggiornaGiocatore, notizia } from './_giocatori.mjs'
import { vivi, daVivere, evento } from '../chat/lumaca.mjs'
import { unisci, uguali } from '../chat/zaino-unisci.mjs'
import { cassa, eBanca, conia, allaCassa, perdi, distruggi, ritrova, smarriti, sporchi, puliti, sporca, matura, LAVA, CAUZIONE, PULIZIA } from './_economia.mjs'

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
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const vista = (c, now) => ({
  nome: c.nome, ind: 'pzk' + c.ind, indCambiato: !!c.indCambiato, creato: c.creato, pzk: c.pzk, eur: c.eur, ig: !!c.ig,
  trovati: c.trovati?.g === oggi() ? c.trovati.q : [], sussidio: c.sussidio === oggi(), invii: illimitato(c) || c.creato + ATTESA_INVII <= now, inviiDa: illimitato(c) ? c.creato : c.creato + ATTESA_INVII,
  mosse: (c.mosse ?? []).slice(-12), lumaca: c.lumaca ? { g: c.lumaca.g, ultime: c.lumaca.ultime } : null,
  es: c.es ?? 0, esterni: (c.esterni ?? []).slice(-30),
  // l'economia: i soldi sporchi e quando si puliscono, il lavaggio, la galera, l'ultimo lotto di flussi contato, l'ultimo colpo
  sporchi: sporchi(c), puliti: puliti(c), pulizia: c.sporchi?.length ? c.sporchi[0].t + PULIZIA : null, lavaggio: c.lavaggio ?? null,
  galera: c.galera > now ? c.galera : null, fn: c.fn ?? 0, colpo: c.ultimoColpo ?? 0, decifrati: c.decifrati?.g === oggi() ? c.decifrati.n : 0,
})
const mossa = (c, m) => { (c.mosse ??= []).push(m); if (c.mosse.length > 40) c.mosse.splice(0, c.mosse.length - 40) }

// la lumachina vive i giorni che le mancano fino a oggi (chat/lumaca.mjs): una mossa per ogni giornata che sposta $pzk.
// → { delta, nuove } o null
const vive = (c, now, db) => vivi(c, oggi(), (v) => {
  if (!v.n) return
  mossa(c, { t: now, tipo: 'lumaca', n: Math.abs(v.n), verso: v.n < 0 ? 'meno' : 'piu', pct: v.pct, g: v.g, ev: v.ev })
  if (db) { if (v.n > 0) conia(db, v.n, now); else allaCassa(db, -v.n, now) } // i miracoli coniano, le spese vanno alla cassa
})
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
// i flussi del browser (games/pzk.js): quanto è andato alla cassa (perso al gioco, speso; negativo: vinto, venduto) e quanto
// è caduto per terra (le morti), in un lotto numerato (n: un lotto già contato, per una risposta persa, non si conta due
// volte). Il resto della differenza di saldo è conio: soldi nuovi (il lavoro, le quest, i premi)
const flussiDi = (x) => {
  if (!x || typeof x !== 'object' || !Number.isInteger(x.n) || x.n < 1) return null
  const casa = Number(x.casa), persi = Number(x.persi), lim = (v, a, b) => (Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : 0)
  return { n: x.n, casa: lim(casa, -1e7, 1e7), persi: lim(persi, 0, 1e7) }
}
function contabilizza(db, c, delta, fl, now) {
  let casa = 0, persi = 0
  if (fl && fl.n > (c.fn ?? 0)) { casa = fl.casa; persi = fl.persi; c.fn = fl.n }
  let conio = delta + casa + persi
  if (conio < 0) { casa -= conio; conio = 0 } // perso più di quanto spiegato: alla cassa
  allaCassa(db, casa, now); perdi(db, persi, now); conia(db, conio, now)
}
function accogli(c, pzk, now, lg, es, db = null, fl = null) {
  if (pzk === undefined || pzk === null) return null
  if (typeof pzk !== 'number' || !Number.isFinite(pzk) || pzk < 0 || pzk > 1e8) return 'saldo strano'
  if (lg !== undefined) for (const v of c.lumaca?.ultime ?? []) if (lg === null || v.g > lg) pzk = Math.max(0, pzk + v.n)
  if (es !== undefined) {
    for (const v of c.esterni ?? []) if (v.s > es) pzk = Math.max(0, pzk + v.n)
  } else if (c.esterni?.length) {
    // un browser che non dice cosa sa (`es` assente: un codice di prima, o un saldo salvato nel browser prima dei soldi da
    // fuori) non può riscrivere il saldo di un conto che ne ha: non si sa se li contiene. Si tiene quello del server e il
    // browser lo riprende (23.10: il browser di Alberto ha rimesso i suoi 7.285 dopo il passaggio di 5.000)
    return 'aggiorno il saldo dalla banca'
  }
  pzk = mezzi(pzk)
  const secondi = Math.max(0, (now - (c.salvato ?? c.creato)) / 1000)
  if (!illimitato(c) && pzk - c.pzk > 20000 + 1200 * secondi) return 'il saldo non torna: ricarico quello salvato'
  const delta = pzk - c.pzk
  c.pzk = pzk; c.salvato = now
  if (db && !eBanca(c)) contabilizza(db, c, delta, fl, now)
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
  // la correzione: dopo il passaggio il browser di Alberto (col saldo di prima, senza `es`) aveva rimesso 7.285, e i
  // 5.000 erano diventati 10.000. Si tolgono di nuovo, senza mossa (quella del passaggio c'è già)
  { id: '2026-10-23-correzione-398893-5000', da: '398893', togli: 5000 },
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
      const c = db.conti.find((x) => x.ind === o.da), d = db.conti.find((x) => x.ind === o.a), n = mezzi(o.n ?? o.togli)
      const esito = !c ? 'manca il conto pzk' + o.da : !o.togli && !d ? 'manca il conto pzk' + o.a : c.pzk < n ? `pzk${o.da} ha ${c.pzk} $pzk, non ${n}` : null
      if (!esito && o.togli) { c.pzk = mezzi(c.pzk - n); esterno(c, -n) } // una correzione: solo da togliere, senza mossa
      else if (!esito) {
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
      if (url.searchParams.has('operazioni')) return json(res, 200, { ok: true, operazioni: OPERAZIONI.map((o) => ({ id: o.id, da: 'pzk' + o.da, ...(o.a ? { a: 'pzk' + o.a, n: o.n } : { togli: o.togli }), ...(db.operazioni?.[o.id] ?? { fatta: false }) })) })
      if (url.searchParams.has('classifica')) return json(res, 200, { ok: true, classifica: [...db.conti].filter((c) => !eBanca(c)).sort((a, b) => b.pzk - a.pzk).slice(0, 10).map((c) => ({ nome: c.nome, pzk: c.pzk })) }, 'public, max-age=0, s-maxage=60, stale-while-revalidate=300')
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
        return { c, lu: vive(c, now, db) } // la lumachina nasce col conto e vive già oggi
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
        const r = await aggiorna(store, (d) => { const x = d.conti.find((y) => y.id === id); if (!x) return { invariato: true }; const l = vive(x, now, d); return l ? { c: x, lu: l } : { invariato: true, c: x } })
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
      // (26.10) si uniscono, non si sostituiscono: quello che cresce soltanto (l'esperienza, le statistiche…) prende il meglio
      // dei due, il resto lo decide chi ha l'ultima parola. Chi scrive senza aver visto l'ultimo salvato (`visto` più vecchio:
      // un telefono rimasto indietro) non ce l'ha; i browser di prima, senza `visto`, ce l'hanno se il loro `t` è più recente
      const r = await aggiorna(chat, (db) => {
        const mio = db.zaini[id], suo = body.zaino
        const indietro = !!mio && (body.visto === undefined ? mio.t > (suo.t ?? 0) : mio.t > Number(body.visto))
        let z = indietro ? unisci(mio, suo) : unisci(suo, mio)
        if (!zainoValido(z)) z = indietro ? mio : suo
        if (mio && uguali(z, mio)) return { invariato: true, zaino: mio }
        db.zaini[id] = z
        return { zaino: z }
      })
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
        const prima = c.pzk, avviso = accogli(c, body.pzk, now, lgDi(body.lg), esDi(body.es), db, flussiDi(body.flussi)), lu = vive(c, now, db)
        const tempo = matura(c, now, (m) => mossa(c, m)) // i sporchi che si puliscono, il lavaggio finito, la galera scontata
        distruggi(db, now)
        if (c.pzk === prima && !lu && !tempo && !avviso) return { invariato: true, c, avviso }
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
      const avviso = accogli(c, body.pzk, now, lgDi(body.lg), esDi(body.es), db, flussiDi(body.flussi))
      if (avviso) return { errore: avviso, c }
      const lu = vive(c, now, db)
      matura(c, now, (m) => mossa(c, m))
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
      return manda(await azione((c, db) => {
        if (da === 'pzk') {
          const n = mezzi(Math.min(quanto, puliti(c)))
          if (n < 0.5) return { errore: sporchi(c) ? 'i soldi sporchi non si cambiano: prima lavali' : 'non hai $pzk da convertire' }
          const e = cent(n * cambio)
          c.pzk = mezzi(c.pzk - n); c.eur = cent(c.eur + e)
          allaCassa(db, n, now) // la cassa compra i $pzk e dà gli EUR€
          mossa(c, { t: now, tipo: 'in-eur', n, eur: e, cambio })
          return { fatto: { da: 'pzk', n, eur: e, cambio } }
        }
        const e = cent(Math.min(quanto, c.eur))
        if (e < 0.01) return { errore: 'non hai EUR€ da convertire' }
        const n = mezzi(e / cambio)
        if (n < 0.5) return { errore: 'troppo pochi: non fanno nemmeno mezzo $pzk' }
        c.eur = cent(c.eur - e); c.pzk = mezzi(c.pzk + n)
        allaCassa(db, -n, now)
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
        if (eBanca(d)) return { errore: 'alla cassa di pzk non si manda niente' }
        if (quanto > puliti(c)) return { errore: sporchi(c) ? `si mandano solo i soldi puliti: ne hai ${puliti(c)}` : `non ti bastano: hai ${c.pzk} $pzk` }
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
    if (a === 'ig') return manda(await azione((c, db) => { if (c.ig) return { errore: 'il regalo l’hai già avuto' }; c.ig = true; if (body.pzk === undefined) { c.pzk = mezzi(c.pzk + PREMIO_IG); conia(db, PREMIO_IG, now) } /* (col saldo del browser il premio c'è già: contato come conio da accogli) */ mossa(c, { t: now, tipo: 'instagram', n: PREMIO_IG }) }))
    if (a === 'trova') {
      const v = BANCONOTE[body.quale]
      if (!v) return json(res, 400, { ok: false, errore: 'quale banconota?' })
      return manda(await azione((c, db) => {
        const g = oggi()
        if (c.trovati?.g !== g) c.trovati = { g, q: [] }
        if (c.trovati.q.includes(body.quale)) return { errore: 'questa l’hai già raccolta oggi' }
        c.trovati.q.push(body.quale)
        if (body.pzk === undefined) { c.pzk = mezzi(c.pzk + v); conia(db, v, now) } // (col saldo del browser la banconota c'è già: contata come conio da accogli)
        mossa(c, { t: now, tipo: 'trovato', n: v })
      }))
    }
    if (a === 'sussidio') return manda(await azione((c, db) => {
      if (c.pzk >= 1 || c.eur >= 0.01) return { errore: 'non sei a secco' }
      if (c.sussidio === oggi()) return { errore: 'il sussidio è uno al giorno: domani' }
      c.sussidio = oggi(); c.pzk = mezzi(c.pzk + SUSSIDIO); conia(db, SUSSIDIO, now); mossa(c, { t: now, tipo: 'sussidio', n: SUSSIDIO })
    }))

    // ── LA GALERA (26.10): un lavoro rischioso andato male (il dado lo tira il browser: chat/comandi/lavoro.js). La multa, coi
    // soldi puliti, va alla cassa; si esce prima con la cauzione ──
    if (a === 'arresto') {
      const ore = Math.max(0.25, Math.min(12, Number(body.ore) || 1)), multa = mezzi(Math.max(0, Math.min(20000, Number(body.multa) || 0)))
      return manda(await azione((c, db) => {
        if (c.galera > now) return { fatto: { galera: c.galera, multa: 0 } }
        const m = mezzi(Math.min(multa, puliti(c)))
        c.galera = now + ore * 3600_000
        if (m > 0) { c.pzk = mezzi(c.pzk - m); allaCassa(db, m, now) }
        mossa(c, { t: now, tipo: 'arresto', n: m, verso: 'meno', perche: String(body.perche ?? '').slice(0, 60) })
        return { fatto: { galera: c.galera, multa: m } }
      }))
    }
    if (a === 'cauzione') return manda(await azione((c, db) => {
      if (!(c.galera > now)) return { errore: 'non sei in galera' }
      if (puliti(c) < CAUZIONE) return { errore: `la cauzione è ${CAUZIONE} $pzk puliti: ne hai ${puliti(c)}` }
      c.pzk = mezzi(c.pzk - CAUZIONE); allaCassa(db, CAUZIONE, now); delete c.galera
      mossa(c, { t: now, tipo: 'cauzione', n: CAUZIONE })
      return { fatto: { cauzione: CAUZIONE } }
    }))

    // ── LA LAVATRICE (26.10): fino a 50.000 sporchi in 10 minuti, 2.000 puliti di commissione alla cassa ──
    if (a === 'lava') {
      const quanto = mezzi(Number(body.quanto))
      return manda(await azione((c, db) => {
        if (c.galera > now) return { errore: 'in galera non si lava niente' }
        if (c.lavaggio) return { errore: `la lavatrice gira già: finisce alle ${ora(c.lavaggio.fino)}` }
        const sp = sporchi(c)
        if (!(sp > 0)) return { errore: 'non hai soldi sporchi da lavare' }
        if (puliti(c) < LAVA.costo) return { errore: `il lavaggio costa ${LAVA.costo} $pzk puliti: ne hai ${puliti(c)}` }
        const n = mezzi(Math.min(sp, LAVA.max, quanto > 0 ? quanto : sp))
        c.pzk = mezzi(c.pzk - LAVA.costo); allaCassa(db, LAVA.costo, now)
        c.lavaggio = { n, fino: now + LAVA.ms }
        mossa(c, { t: now, tipo: 'lavatrice', n: LAVA.costo })
        return { fatto: { lavaggio: c.lavaggio } }
      }))
    }

    // ── DECIFRA (26.10): un wallet o una chiavetta trovati dallo spazzino, aperti col decifratore. I $pzk vengono dal fondo
    // dei portafogli smarriti (erano destinati a sparire: puliti); tre al giorno ──
    if (a === 'decifra') {
      const tipo = body.tipo === 'chiavetta' ? 'chiavetta' : 'wallet'
      return manda(await azione((c, db) => {
        if (c.galera > now) return { errore: 'in galera i computer non si toccano' }
        const g = oggi()
        if (c.decifrati?.g !== g) c.decifrati = { g, n: 0 }
        if (c.decifrati.n >= 3) return { errore: 'tre al giorno: il decifratore si scalda. domani' }
        c.decifrati.n++
        const [da, fino] = tipo === 'chiavetta' ? [400, 4000] : [150, 1500]
        const n = ritrova(db, mezzi(da + (fino - da) * (randomBytes(2).readUInt16BE() / 65535)))
        if (n > 0) c.pzk = mezzi(c.pzk + n)
        mossa(c, { t: now, tipo: 'decifrato', n })
        return { fatto: { n, tipo, fondo: smarriti(db) } }
      }))
    }

    // ── IL COLPO (26.10): la rapina alla cassa di pzk, almeno in due. Chi organizza apre il colpo e ha un codice di quattro
    // lettere; i complici entrano col codice (al più quattro in tutto, quindici minuti); chi ha organizzato dà il via. Va a
    // segno nel 32 % dei casi in due, 40 % in tre, 48 % in quattro: il bottino (il 3 % della cassa più l'1 % a testa, al più
    // 15.000 a testa) si divide ed è SPORCO; se va male, sei ore di galera e una multa (il 20 % dei puliti, al più 5.000).
    // Un colpo al giorno a testa, col conto di almeno 48 ore (così non si rapina coi conti nuovi) ──
    if (a === 'colpo') {
      const op = body.op, codice = String(body.codice ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
      const vede = (k, c) => k && ({ codice: k.codice, membri: k.membri.map((m) => ({ nome: m.nome, ind: 'pzk' + m.ind })), stato: k.stato, scade: k.scade, esito: k.esito ?? null, capo: k.membri[0]?.id === c.id, io: k.membri.some((m) => m.id === c.id) })
      const tienili = (db) => { db.colpi = (db.colpi ?? []).filter((k) => now - k.creato < 2 * 3600_000) }
      if (op === 'stato') { // (si chiede ogni pochi secondi: solo lettura)
        const { db } = await store.read()
        const c = db.conti.find((x) => x.id === id)
        if (!c) return json(res, 401, { ok: false, errore: 'conto sparito', esci: true })
        const tutti = (db.colpi ?? []).filter((k) => now - k.creato < 2 * 3600_000)
        const k = codice ? tutti.find((x) => x.codice === codice) : tutti.filter((x) => x.membri.some((m) => m.id === c.id)).at(-1)
        return json(res, 200, { ok: true, colpo: vede(k, c) ?? null, cassa: db.conti.find(eBanca)?.pzk ?? 0, conto: vista(c, now), tasso, t: now })
      }
      const r = await azione((c, db) => {
        tienili(db)
        const mio = db.colpi.find((k) => k.stato === 'aperto' && k.membri.some((m) => m.id === c.id))
        const no = c.galera > now ? `sei in galera fino alle ${ora(c.galera)}` : !illimitato(c) && c.creato + ATTESA_INVII > now ? 'per i colpi il conto deve avere almeno 48 ore' : (c.ultimoColpo ?? 0) + GIORNO > now ? `un colpo al giorno: il prossimo dalle ${ora(c.ultimoColpo + GIORNO)}` : null
        if (op === 'apri') {
          if (mio) return { colpo: vede(mio, c) }
          if (no) return { errore: no }
          let cod
          do cod = Array.from(randomBytes(4), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[x % 24]).join(''); while (db.colpi.some((k) => k.codice === cod))
          const k = { codice: cod, creato: now, scade: now + 15 * MINUTO, stato: 'aperto', membri: [{ id: c.id, nome: c.nome, ind: c.ind }] }
          db.colpi.push(k)
          return { colpo: vede(k, c) }
        }
        if (op === 'entra') {
          const k = db.colpi.find((x) => x.codice === codice)
          if (!k || k.stato !== 'aperto' || k.scade < now) return { errore: 'nessun colpo aperto con questo codice' }
          if (k.membri.some((m) => m.id === c.id)) return { colpo: vede(k, c) }
          if (no) return { errore: no }
          if (mio) return { errore: 'sei già in un altro colpo' }
          if (k.membri.length >= 4) return { errore: 'la banda è piena: al massimo in quattro' }
          k.membri.push({ id: c.id, nome: c.nome, ind: c.ind })
          return { colpo: vede(k, c) }
        }
        if (op === 'esci') {
          if (!mio) return { colpo: null }
          mio.membri = mio.membri.filter((m) => m.id !== c.id)
          if (!mio.membri.length) mio.stato = 'sciolto'
          return { colpo: null }
        }
        if (op === 'vai') {
          const k = mio
          if (!k || k.membri[0].id !== c.id) return { errore: 'il via lo dà chi ha organizzato il colpo' }
          if (k.membri.length < 2) return { errore: 'da solo no: serve almeno un complice' }
          if (k.scade < now) { k.stato = 'scaduto'; return { errore: 'troppo tardi: il colpo è saltato' } }
          const banda = k.membri.map((m) => db.conti.find((x) => x.id === m.id)).filter(Boolean)
          for (const x of banda) { matura(x, now); if (x.galera > now) return { errore: `${x.nome} è in galera: il colpo non parte` } }
          const banca = cassa(db, now), n = banda.length
          const riuscito = randomBytes(2).readUInt16BE() / 65536 < { 2: 0.32, 3: 0.4, 4: 0.48 }[n]
          if (riuscito) {
            const quota = mezzi(Math.min((banca.pzk * (0.03 + 0.01 * n)) / n, 15000))
            banca.pzk = mezzi(banca.pzk - quota * n)
            for (const x of banda) {
              x.pzk = mezzi(x.pzk + quota); sporca(x, quota, now); x.ultimoColpo = now
              if (x.id !== c.id) esterno(x, quota) // (chi dà il via lo sa dalla risposta)
              mossa(x, { t: now, tipo: 'rapina', n: quota })
            }
            k.esito = { ok: true, quota, bottino: mezzi(quota * n) }
          } else {
            const multe = []
            for (const x of banda) {
              const m = mezzi(Math.min(puliti(x) * 0.2, 5000))
              x.pzk = mezzi(x.pzk - m); allaCassa(db, m, now); x.galera = now + 6 * 3600_000; x.ultimoColpo = now
              if (x.id !== c.id) esterno(x, -m)
              mossa(x, { t: now, tipo: 'arresto', n: m, verso: 'meno', perche: 'rapina' })
              multe.push(m)
            }
            k.esito = { ok: false, ore: 6, multa: Math.max(...multe) }
          }
          k.stato = 'fatto'
          return { colpo: vede(k, c), notizia: { ok: riuscito, n, bottino: k.esito.bottino ?? 0 } }
        }
        return { errore: 'quale mossa? apri, entra, esci, vai' }
      })
      if (r.notizia) {
        try { const dbG = await archivio(PATH_GIOCATORI, vuotoG); if (dbG) await aggiorna(dbG, (g) => { notizia(g, r.c, r.notizia.ok ? 'rapina' : 'retata', r.notizia, now) }) } catch (e) { console.warn('notizie colpo:', e.message) }
      }
      return manda(r, { colpo: r.colpo ?? null })
    }
    return json(res, 400, { ok: false, errore: 'richiesta sbagliata' })
  } catch (e) {
    if (e.occupato) return json(res, 503, { ok: false, errore: 'troppa gente insieme: riprova' })
    console.error('wallet:', e)
    return json(res, 500, { ok: false, errore: 'qualcosa non va: riprova' })
  }
}
