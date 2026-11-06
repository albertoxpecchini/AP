// I $pzk di pzkko.it: soldi finti, gli stessi per tutti i giochi (roulette, blackjack, mine, dado, moneta, virtual, la chat,
// le app del cercapersone) e per il wallet in alto a sinistra (wallet/wallet.js). Non valgono niente e non si comprano.
//
// DAL 31.10 IL SALDO STA SOLO SULLA BANCA (Alberto: «saldo sempre nel server immediatamente … browser modificato non può
// accedere … solo da me stanno i dati»). La banca gira sul pc di Alberto (C:\pzkko-server, dietro /api/wallet/): lì si
// tirano i dadi, si danno le carte, si pagano i premi, si tengono lo zaino e le attese. Questo file non decide più niente:
// - fai(azione, dati) chiede alla banca di fare una cosa («roulette.gira» con le puntate, «chat.pesca», «quiz.rispondi»…)
//   e restituisce quello che è successo ({ ok, esito } o { ok: false, errore }); il conto che torna (saldo, EUR€, zaino,
//   tavoli aperti) diventa lo stato di qui. Una pagina ricaricata, un altro telefono, un browser cambiato vedono e possono
//   fare solo quello che dice la banca. La puntata di un giro la prende la banca quando il giro parte: ricaricare a metà
//   giro non la riporta indietro (il giro aperto resta sulla banca, c.tavoli);
// - punta/ritira mettono le fiche sul tavolo SOLO per lo schermo (le puntate di un giro in preparazione): i soldi li toglie
//   la banca quando il giro parte, e il tavolo si sgombra (sgombra) quando la risposta arriva;
// - chi non entra in un conto è un OSPITE: 1.000 $pzk che vivono nella memoria della banca (il biglietto sta in
//   sessionStorage, e dura quanto la scheda);
// - il canale (games/live.js) avvisa quando il conto cambia da un'altra parte (un altro telefono, un invio ricevuto).
// Se la banca non risponde (il pc di Alberto spento), si aspetta: niente si gioca a credito.

const API = '/api/wallet/' // con la barra finale: il sito ha trailingSlash, e senza ogni POST passava da un redirect 308
const CHIAVE_OSPITE = 'pzkko-ospite'
const CHIAVE_CONTO = 'pzkko-wallet'
export const INIZIALE = 1000
export const VALE_CAMBIO = 30 * 60 * 1000
export const BANCONOTE = { b500: 500, b100: 100, b25: 25, b10: 10 }

const mezzi = (n) => Math.round(n * 2) / 2
const tavoli = new Map() // gioco → $pzk messi sul tavolo in questa pagina (solo per lo schermo: la banca non li ha ancora)
const ascolti = new Set(), osservatori = new Set(), cambiaConto = new Set()
/** Il giorno di Mantova (AAAA-MM-GG): le banconote per terra tornano ogni giorno. */
export const oggi = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const leggiJSON = (dep, k) => { try { return JSON.parse(dep.getItem(k) || 'null') } catch { return null } }
const scriviJSON = (dep, k, v) => { try { v === null ? dep.removeItem(k) : dep.setItem(k, JSON.stringify(v)) } catch {} }

// ── lo stato: il conto come l'ha detto la banca ──
// W: col conto { token, conto, tasso, t }; O: da ospite { biglietto, conto }. Uno dei due (o nessuno, prima della prima risposta)
let W = leggiConto()
let O = W ? null : leggiJSON(sessionStorage, CHIAVE_OSPITE)
let online = null // null = non si sa ancora, false = la banca è in pausa
function leggiConto() {
  const w = leggiJSON(localStorage, CHIAVE_CONTO)
  return w && typeof w.token === 'string' && w.conto && Number.isFinite(w.conto.pzk) ? w : null
}
const attuale = () => (W ? W.conto : O?.conto) ?? null
const sulTavoli = () => [...tavoli.values()].reduce((a, b) => a + b, 0)
function avvisa() { const s = saldo(); for (const f of ascolti) { try { f(s) } catch (e) { console.error(e) } } for (const f of osservatori) { try { f() } catch (e) { console.error(e) } } }
const avvisaCambioConto = () => { for (const f of cambiaConto) { try { f() } catch (e) { console.error(e) } } }

/** I $pzk liberi: quelli della banca meno le fiche messe sul tavolo in questa pagina. */
export function saldo() { const c = attuale(); return c ? Math.max(0, mezzi(c.pzk - sulTavoli())) : 0 }
/** I $pzk che un gioco ha sul tavolo (le fiche di questa pagina, più quelli che la banca tiene su un giro aperto). */
export const sulTavolo = (gioco) => (tavoli.get(gioco) ?? 0) + (attuale()?.tavoli?.[gioco]?.banco ?? 0)
/** Di chi sono i soldi di adesso: 's' (ospite) o 'c:nome' (un conto). */
export const proprietario = () => (W ? 'c:' + String(W.conto.nome ?? '').toLowerCase() : 's')
/** fn() quando si entra in un conto o se ne esce (anche da un'altra scheda). Restituisce la funzione per smettere. */
export function alCambioConto(fn) { cambiaConto.add(fn); return () => cambiaConto.delete(fn) }

/** Una fiche sul tavolo (solo per lo schermo); false se non bastano. I soldi li toglie la banca quando il giro parte. */
export function punta(gioco, n) {
  n = mezzi(n)
  if (!(n > 0) || n > puliti() || inGalera()) return false
  tavoli.set(gioco, (tavoli.get(gioco) ?? 0) + n)
  avvisa()
  return true
}
/** Una fiche tolta dal tavolo (prima del giro). */
export function ritira(gioco, n) {
  n = Math.min(mezzi(n), tavoli.get(gioco) ?? 0)
  if (!(n > 0)) return
  tavoli.set(gioco, (tavoli.get(gioco) ?? 0) - n)
  avvisa()
}
/** Il giro è partito (la banca ha preso le puntate) o le fiche si tolgono tutte: il tavolo di questa pagina si svuota. */
export function sgombra(gioco) { if (tavoli.delete(gioco)) avvisa() }
export const aSecco = () => saldo() < 1 && sulTavoli() === 0 && !Object.values(attuale()?.tavoli ?? {}).some((t) => t.banco > 0)
/** I soldi sporchi (il bottino delle rapine): si vedono nel saldo, con pzk non si spendono. */
export const sporchi = () => (W ? Math.min(saldo(), W.conto.sporchi ?? 0) : 0)
/** I $pzk che si possono spendere con pzk (puntare, comprare, pagare). */
export const puliti = () => Math.max(0, mezzi(saldo() - sporchi()))
/** Fino a quando si è in galera (0: liberi). */
export const galera = () => (W?.conto.galera > Date.now() ? W.conto.galera : 0)
export const inGalera = () => galera() > 0
export const lavaggio = () => W?.conto.lavaggio ?? null
const oraDi = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
/** Perché una puntata non passa (i giochi lo dicono con la loro voce): la galera, i soldi sporchi, o non bastano. */
export const nonBasta = () => (inGalera() ? `sei in galera fino alle ${oraDi(galera())}` : sporchi() > 0 ? `puoi puntare solo i soldi puliti: ne hai ${fmt(puliti())} (gli altri ${fmt(sporchi())} sono sporchi: si lavano nella lavatrice, che si compra nel pzkstore del cercapersone)` : saldo() >= 1 ? `non ti bastano: hai ${fmt(saldo())} $pzk` : 'hai finito i $pzk')

/**
 * A secco: da ospite altri 1.000 (li dà la banca); col conto, se ci sono EUR€ si apre il wallet per convertirli, se no il
 * sussidio (1.000 al giorno, lo decide la banca). → true se i $pzk stanno arrivando
 */
export function ricarica() {
  if (!aSecco()) return false
  if (!W) { chiama({ a: 'ricarica' }); return true }
  if (W.conto.eur >= 0.01) { apriWallet('converti'); return false }
  if (W.conto.sussidio) return false
  azione({ a: 'sussidio' })
  return true
}
/** Perché ricarica() ha detto di no (per la voce del gioco). */
export const perche = () => (inGalera() ? `sei in galera fino alle ${oraDi(galera())}: si esce prima con la cauzione (app rapina)` : W && sporchi() > 0 && puliti() < 1 ? 'hai solo soldi sporchi: con pzk non si spendono. si lavano nella lavatrice, che si compra nel pzkstore del cercapersone (5.000 puliti, una volta; poi 2.000 a lavaggio): i puliti vengono dal lavoro, dalle quest, dalle sfide. o aspetti 96 giorni, e si puliscono da soli' : !W ? '' : W.conto.eur >= 0.01 ? `hai ${fmtEur(W.conto.eur)} EUR€ nel wallet: convertili in $pzk per giocare` : 'il sussidio è uno al giorno: torna domani, o fatti mandare $pzk da un amico')

/** fn(saldo) a ogni cambio. Restituisce la funzione per smettere. */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }
/** fn() a ogni cambio di qualunque cosa (saldo, conto, EUR€, cambio, zaino). */
export function osserva(fn) { osservatori.add(fn); return () => osservatori.delete(fn) }

// le altre schede: si entra, si esce, o la banca ha detto un conto più nuovo
addEventListener('storage', (e) => {
  if (e.key !== CHIAVE_CONTO && e.key !== null) return
  const w = leggiConto()
  if (!!w !== !!W || (w && W && w.token !== W.token)) {
    tavoli.clear(); W = w
    if (!W) { O = leggiJSON(sessionStorage, CHIAVE_OSPITE); if (!O) sincronizza() }
    avvisa(); avvisaCambioConto(); return
  }
  if (w && W && (w.conto.agg ?? 0) > (W.conto.agg ?? 0)) { W = { ...W, ...w }; avvisa() }
})

/** Le fiches (le stesse foto in tutti i giochi: art/fiches/f<valore>.webp) e un importo in fiches, dalle più grandi. */
export const FICHES = [1, 5, 25, 100, 500]
export function inFiches(importo) {
  const out = []
  for (const f of [...FICHES].reverse()) while (importo >= f) { out.push(f); importo -= f }
  return out
}
/** I $pzk come si scrivono: 1.250 o 7,5. Gli EUR€: 1.250,00. */
export const fmt = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 })
export const fmtEur = (n) => n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** I numeri corti per i riquadri stretti: 999, 1,0K, 13,3K, 1,0M, 1,0B, 1,0T. */
export function fmtCorto(n) {
  const a = Math.abs(Number(n) || 0), meno = n < 0 ? '−' : ''
  if (a < 1000) return meno + fmt(a)
  const U = [['K', 1e3], ['M', 1e6], ['B', 1e9], ['T', 1e12]]
  let i = U.findLastIndex(([, v]) => a >= v)
  let x = Math.round((a / U[i][1]) * 10) / 10
  if (x >= 1000 && i < U.length - 1) { i++; x = Math.round((a / U[i][1]) * 10) / 10 }
  return meno + x.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + U[i][0]
}

// ── il conto ─────────────────────────────────────────────────────────────────
/** Il conto come l'ha detto la banca ({ nome, ind, pzk, eur, zaino, tavoli, mosse… }), o null da ospite. */
export const conto = () => (W ? W.conto : null)
/** Lo zaino come l'ha detto la banca (anche da ospite), o null prima della prima risposta. */
export const zainoBanca = () => attuale()?.zaino ?? null
/** Il tavolo aperto di un gioco come lo vede il giocatore (le carte scoperte, le caselle già girate…, e `banco`), o null. */
export const tavoloBanca = (gioco) => attuale()?.tavoli?.[gioco] ?? null
export const token = () => W?.token ?? null
export const ospite = () => !W
export const euro = () => W?.conto.eur ?? 0
/** Il cambio (1 $pzk in EUR€) di quando ci si è sincronizzati, e quando; scaduto() dopo mezz'ora. */
export const tasso = () => W?.tasso ?? 1
export const sincronizzato = () => W?.t ?? 0
export const scaduto = () => !!W && Date.now() - W.t > VALE_CAMBIO
export const serverOnline = () => online

// L'ospite appena arrivato non ha ancora il biglietto: finché la banca non glielo dà, un'azione (fai) partirebbe con
// «ospite: null» e tornerebbe 401 «entra di nuovo» (virtual.palinsesto, sfide.oggi… a ogni visita nuova: trovato dal
// bot dei bug sul sito vero, 6.11). Il biglietto si chiede una volta sola, e le azioni lo aspettano; se la banca è in
// pausa non arriva, e l'azione parte lo stesso e si prende il suo «in pausa».
let inVolo = null
const primoBiglietto = () => (inVolo ??= manda({ a: 'ospite' }).finally(() => { inVolo = null }))
async function chiama(body, opz = {}) {
  if (!W && !O) {
    if (body.a === 'ospite') return primoBiglietto()
    if (body.a === 'fai') await primoBiglietto()
  }
  return manda(body, opz)
}
async function manda(body, { keepalive = false } = {}) {
  const dati = W ? { token: W.token, ...body } : { ospite: O?.biglietto ?? null, ...body }
  const chi = W?.token ?? 'ospite' // (chi ha chiesto: se intanto si è entrati o usciti, la risposta è dell'altro e non si prende)
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dati), keepalive })
    const d = await r.json().catch(() => ({ ok: false, offline: true, errore: 'la banca non risponde' }))
    online = !d.offline
    if ((W?.token ?? 'ospite') !== chi) return d
    if (d.esci && W) esci()
    accogli(d)
    return d
  } catch { online = false; avvisa(); return { ok: false, offline: true, errore: 'niente rete: riprova' } }
}
/** La risposta della banca con dentro il conto: diventa lo stato, se non è più vecchia di quella che si ha. */
function accogli(d) {
  if (!d?.conto) return
  if (!W && d.ospite) {
    if (O?.biglietto !== d.ospite) tavoli.clear()
    O = { biglietto: d.ospite, conto: d.conto }
    scriviJSON(sessionStorage, CHIAVE_OSPITE, O)
    return avvisa()
  }
  if (!W || d.conto.ospite) return
  if (Number.isFinite(d.tasso)) W.tasso = d.tasso
  if (Number.isFinite(d.t)) W.t = d.t
  if ((d.conto.agg ?? 0) >= (W.conto.agg ?? 0)) W.conto = d.conto
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  avvisa()
}
/** Il canale (games/live.js) dice che il conto sulla banca è cambiato: → true se è più nuovo (live.js poi chiede il resto). */
export function dalCanale(s) {
  if (!W || !s || !Number.isFinite(s.pzk) || !((s.agg ?? 0) > (W.conto.agg ?? 0))) return false
  W.conto = { ...W.conto, pzk: s.pzk, eur: Number.isFinite(s.eur) ? s.eur : W.conto.eur, agg: s.agg }
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  avvisa()
  return true
}

/**
 * FA UNA COSA SULLA BANCA (31.10): `cosa` è il nome dell'azione («roulette.gira», «chat.pesca», «mercato.compra»…), `args` i
 * dati. La banca tira, paga, toglie, aggiunge e risponde. → { ok, esito, conto } o { ok: false, errore }
 */
export const fai = (cosa, args = {}) => chiama({ a: 'fai', cosa, args })

/** Entra con nome e PIN. → { ok, errore? } */
export async function entra(nome, pin) {
  const d = await chiama({ a: 'entra', nome, pin })
  if (d.ok) prendi(d)
  return d
}
/** Crea un conto (con la chiave di amministrazione per i nomi riservati). → { ok, errore? } */
export async function crea(nome, pin, key) {
  const d = await chiama({ a: 'crea', nome, pin, ...(key && { key }) })
  if (d.ok) prendi(d)
  return d
}
function prendi(d) {
  tavoli.clear() // (le fiche messe da ospite restano dell'ospite)
  W = { token: d.token, conto: d.conto, tasso: d.tasso, t: d.t }
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  avvisa()
  avvisaCambioConto()
}
/** Esci: si torna ospite. */
export async function esci() {
  if (!W) return
  tavoli.clear()
  W = null
  scriviJSON(localStorage, CHIAVE_CONTO, null)
  O = leggiJSON(sessionStorage, CHIAVE_OSPITE)
  avvisa()
  avvisaCambioConto()
  if (!O) chiama({ a: 'ospite' })
}
/** Il conto com'è sulla banca, e il cambio di adesso. → { ok, errore? } */
export const sincronizza = () => chiama(W ? { a: 'stato' } : { a: 'ospite' })
/** Il biglietto del canale diretto col server dei dati (games/live.js): { url, biglietto } o null. */
export async function biglietto() {
  if (!W) return null
  const d = await chiama({ a: 'biglietto' })
  return d.ok && d.url && d.biglietto ? { url: d.url, biglietto: d.biglietto } : null
}
// le azioni del wallet che vogliono il conto
async function azione(body) {
  if (!W) return { ok: false, errore: 'entra nel conto, prima (l’app account del cercapersone)' }
  return chiama(body)
}
/** Converte `quanto` da 'pzk' a EUR€ o da 'eur' a $pzk, al cambio dell'ultima sincronizzazione (se è scaduto, prima si sincronizza). */
export async function converti(da, quanto) {
  if (!W) return { ok: false, errore: 'entra nel conto, prima (l’app account del cercapersone)' }
  if (scaduto()) { const s = await sincronizza(); if (!s.ok) return s }
  let d = await azione({ a: 'converti', da, quanto, t: W.t })
  if (!d.ok && d.sincronizza) { await sincronizza(); d = await azione({ a: 'converti', da, quanto, t: W.t }) }
  return d
}
export const invia = (ind, quanto) => azione({ a: 'invia', ind, quanto })
/** La cauzione: si esce di galera pagando la cassa. */
export const cauzione = () => azione({ a: 'cauzione' })
/** La lavatrice: `quanto` sporchi (al più 50.000) puliti fra dieci minuti, 2.000 puliti di commissione. */
export const lava = (quanto) => azione({ a: 'lava', quanto })
/** Un wallet o una chiavetta dello zaino, col codice già risolto sulla banca (decifratore.risolvi): i $pzk dei portafogli smarriti. */
export const decifra = (tipo) => azione({ a: 'decifra', tipo })
/** Il colpo alla cassa: op 'apri', 'entra' (col codice), 'esci', 'vai'; 'stato' si chiede spesso e non salva. */
export async function colpo(op, codice = '') {
  if (!W) return { ok: false, errore: 'serve il conto (app account)' }
  return chiama({ a: 'colpo', op, codice })
}
export const cambiaIndirizzo = (nuovo, key) => azione({ a: 'indirizzo', nuovo, ...(key && { key }) })
export const cambiaPin = (vecchio, nuovo) => azione({ a: 'pin', vecchio, nuovo })
/** Chi è a questo indirizzo (per controllare prima di inviare). → { ok, conto: { nome, ind } } */
export async function chiE(ind) { try { return await (await fetch(`${API}?ind=${encodeURIComponent(ind)}`)).json() } catch { return { ok: false, errore: 'niente rete' } } }

// ── le banconote perse per terra (scena/banconote.js): una volta al giorno ciascuna, le dà la banca ──
/** Le banconote già raccolte oggi (['b500', …]). */
export const trovate = () => attuale()?.trovati ?? []
/** Raccoglie una banconota (la banca la segna e paga). → true se era da raccogliere */
export function trova(quale) {
  if (!Object.hasOwn(BANCONOTE, quale) || trovate().includes(quale)) return false
  chiama({ a: 'trova', quale })
  return true
}

// ── il wallet (wallet/wallet.js, caricato dalla pagina quando serve) ──
/** Apre il wallet (la pagina ascolta l'evento e carica il modulo); le pagine del conto sono l'app Account del cercapersone. */
export function apriWallet(sezione = null) {
  const scheda = { entra: 'conto', conto: 'conto', converti: 'cambio', cambio: 'cambio', invia: 'invia', altro: 'altro' }[sezione]
  if (scheda) return import('../telefono/telefono.js').then((t) => t.apri('account', { scheda }))
  document.dispatchEvent(new CustomEvent('pzkko-wallet', { detail: { sezione } }))
}

/** La riga dei giochi sotto il saldo: «hai anche EUR€ 12,50 nel wallet · convertili in $pzk». C'è solo se ci sono EUR€. */
export function rigaEuro({ classe = 'pzk-eur' } = {}) {
  const a = document.createElement('a')
  a.href = '#wallet'
  a.className = classe
  a.title = 'si apre il cambio (l’app account del cercapersone): gli EUR€ si giocano solo convertiti in $pzk, al cambio di adesso'
  const aggiorna = () => { const e = euro(); a.hidden = !W || e < 0.01; if (!a.hidden) a.innerHTML = `hai anche <b>EUR€ ${fmtEur(e)}</b> nel wallet: convertili in $pzk` }
  a.addEventListener('click', (e) => { e.preventDefault(); apriWallet('converti') })
  osserva(aggiorna)
  aggiorna()
  return a
}

// ── il regalo per chi mi segue su Instagram: 1.000 $pzk, una volta per conto (o per ospite), li dà la banca. Un sito non può
// sapere chi segue chi, quindi ci si fida: il link apre il profilo e, tornati qui, i $pzk arrivano ──
export const INSTAGRAM = 'https://www.instagram.com/albertoxpecchini/'
export const PREMIO_IG = 1000
export const premioPreso = () => !!attuale()?.ig
export function premioInstagram() {
  if (premioPreso()) return false
  chiama({ a: 'ig' })
  return true
}
/** Il link «seguimi su instagram: +1.000 $pzk» per i giochi e il wallet; `fatto()` quando arrivano i $pzk. Sparisce dopo il regalo. */
export function linkInstagram({ classe = 'pzk-ig', fatto } = {}) {
  const a = document.createElement('a')
  a.href = INSTAGRAM
  a.target = '_blank'
  a.rel = 'noopener'
  a.className = classe
  a.title = 'si apre il profilo instagram: tornando qui arrivano i $pzk'
  a.innerHTML = `seguimi su instagram: <b>+${fmt(PREMIO_IG)} $pzk</b>`
  const aggiorna = () => { a.hidden = premioPreso() }
  a.addEventListener('click', () => {
    if (premioPreso()) return
    let dato = false
    const dai = () => {
      if (dato) return
      dato = true
      document.removeEventListener('visibilitychange', torna)
      if (premioInstagram()) fatto?.()
      aggiorna()
    }
    // si torna dal profilo (la scheda di instagram si chiude o si cambia app); se la pagina non si è mai nascosta, dopo un po'
    const torna = () => { if (!document.hidden) setTimeout(dai, 500) }
    document.addEventListener('visibilitychange', torna)
    setTimeout(dai, 8000)
  })
  osserva(aggiorna)
  aggiorna()
  return a
}

// ── all'arrivo: si chiede subito alla banca com'è il conto (o il saldo dell'ospite) ──
sincronizza()
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizza() })

// IN LOCALE SEMPRE DENTRO COL CONTO PZKKO (29.10, Alberto: «fai che in local abbia sempre il log fatto con pzkko»): sul server
// di prova (localhost e gli indirizzi numerici: tools/dev.mjs) chi non è già dentro come pzkko entra da solo, col token che il
// server di prova chiede alla banca (/__dev/accesso). Niente PIN nel codice; online quell'indirizzo non esiste. ?ospite
// nell'indirizzo lascia senza conto (per provare il lucchetto del cercapersone)
const LOCALE = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(location.hostname) && !new URLSearchParams(location.search).has('ospite')
if (LOCALE && W?.conto?.nome?.toLowerCase() !== 'pzkko') {
  fetch('/__dev/accesso', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d?.ok || !d.token) return
    prendi(d)
  }).catch(() => {})
}
