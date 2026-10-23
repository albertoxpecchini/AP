// I $pzk di pzkko.it: soldi finti, gli stessi per tutti i giochi (roulette, blackjack, mine, dado, moneta, virtual e quelli che
// verranno) e per il wallet in alto a sinistra (wallet/wallet.js). Non valgono niente e non si comprano.
//
// Due modi di stare al mondo (dal 22.10 notte):
// - LA SESSIONE: chi non entra ha 1.000 $pzk che durano la sessione del browser (sessionStorage) e non cambiano mai; a
//   zero, il gioco ne dà altri 1.000. Niente EUR€, niente borsa: 1.000 standard sono 1.000 standard.
// - IL CONTO: chi entra nel wallet (un nome e un PIN di quattro cifre, api/wallet.mjs) ha i suoi soldi salvati sul
//   server e soggetti alla borsa (api/borsa.mjs): può parcheggiarli in EUR€ (l'euroshit, l'euro finto del wallet) e
//   riportarli in $pzk al cambio del momento. I giochi girano qui, nel browser, quindi il saldo si salva da qui (salva,
//   un po' dopo ogni cambio e quando la pagina si nasconde); il cambio e il conto si sincronizzano all'ingresso, quando
//   il wallet si apre e comunque dopo mezz'ora (il server non converte col cambio di più di mezz'ora fa). Il token
//   e l'ultimo stato stanno in localStorage (pzkko-wallet): la pagina riparte con quelli, e intanto chiede al server.
//
// Ogni gioco sposta i $pzk dal saldo al suo tavolo quando punta (punta), li riprende se toglie la fiche (ritira) e, a giro
// finito, chiude il conto (regola): quello che era sul tavolo è giocato, torna quello che si è vinto. Si salva il saldo
// più quello che c'è sui tavoli: se la pagina si chiude a metà giro, alla volta dopo le puntate tornano nel saldo.
// I conti vanno a mezzi $pzk (il blackjack paga 3 a 2: 5 → 7,5); gli EUR€ a centesimi.

const API = '/api/wallet/' // con la barra finale: il sito ha trailingSlash, e senza ogni POST passava da un redirect 308 che alcuni browser fanno confermare (« reinviare i dati del modulo? »)
const CHIAVE_SESSIONE = 'pzkko-pzk-sessione'
const CHIAVE_CONTO = 'pzkko-wallet'
const CHIAVE_TROVATE = 'pzkko-pzk-trovate'
export const INIZIALE = 1000
export const VALE_CAMBIO = 30 * 60 * 1000
export const BANCONOTE = { b500: 500, b100: 100, b25: 25, b10: 10 }

const mezzi = (n) => Math.round(n * 2) / 2
const cent = (n) => Math.round(n * 100) / 100
const tavoli = new Map() // gioco → $pzk sul suo tavolo, in questa pagina
const ascolti = new Set(), osservatori = new Set()
const sulTavoli = () => [...tavoli.values()].reduce((a, b) => a + b, 0)
/** Il giorno di Mantova (AAAA-MM-GG): le banconote per terra tornano ogni giorno. */
export const oggi = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const leggiJSON = (dep, k) => { try { return JSON.parse(dep.getItem(k) || 'null') } catch { return null } }
const scriviJSON = (dep, k, v) => { try { v === null ? dep.removeItem(k) : dep.setItem(k, JSON.stringify(v)) } catch {} }

// ── lo stato ──
let W = leggiConto() // il conto: { token, conto, tasso, t, nuovo? } o null
let liberi = W ? Math.max(0, mezzi(W.conto.pzk)) : leggiSessione()
let online = null // null = non si sa ancora, false = il server dice offline
let inCorso = null // la richiesta di salvataggio in volo

function leggiSessione() {
  const s = leggiJSON(sessionStorage, CHIAVE_SESSIONE)
  return s && Number.isFinite(s.saldo) && s.saldo >= 0 ? mezzi(s.saldo) : INIZIALE
}
function leggiConto() {
  const w = leggiJSON(localStorage, CHIAVE_CONTO)
  return w && typeof w.token === 'string' && w.conto && Number.isFinite(w.conto.pzk) ? w : null
}
function avvisa() { for (const f of ascolti) f(liberi); for (const f of osservatori) f() }
function scrivi() {
  const tutto = mezzi(liberi + sulTavoli())
  if (W) { W.conto.pzk = tutto; scriviJSON(localStorage, CHIAVE_CONTO, W); salvaPoi() } else scriviJSON(sessionStorage, CHIAVE_SESSIONE, { saldo: tutto })
  avvisa()
}

/** I $pzk liberi (quelli non puntati). */
export const saldo = () => liberi
/** I $pzk che un gioco ha sul tavolo. */
export const sulTavolo = (gioco) => tavoli.get(gioco) ?? 0

/** Dal saldo al tavolo del gioco; false (e niente spostato) se non bastano. */
export function punta(gioco, n) {
  n = mezzi(n)
  if (!(n > 0) || n > liberi) return false
  liberi -= n
  tavoli.set(gioco, sulTavolo(gioco) + n)
  scrivi()
  return true
}
/** Dal tavolo al saldo (la fiche tolta prima del giro). */
export function ritira(gioco, n) {
  n = Math.min(mezzi(n), sulTavolo(gioco))
  if (!(n > 0)) return
  tavoli.set(gioco, sulTavolo(gioco) - n)
  liberi += n
  scrivi()
}
/** Fine di un giro (o di una parte): `giocato` lascia il tavolo, `torna` va nel saldo. */
export function regola(gioco, giocato, torna) {
  tavoli.set(gioco, Math.max(0, sulTavolo(gioco) - mezzi(giocato)))
  liberi += mezzi(torna)
  scrivi()
}
export const aSecco = () => liberi < 1 && sulTavoli() === 0

/**
 * A secco (meno di 1 $pzk libero e niente sui tavoli): nella sessione altri INIZIALE, subito. Col conto: se ci sono
 * EUR€ si apre il wallet per convertirli (false: niente $pzk nuovi); se no il sussidio, 1.000 $pzk una volta al giorno
 * (il server conferma; se oggi l'hai già avuto, false). `perche()` dice cosa dire al giocatore.
 */
export function ricarica() {
  if (!aSecco()) return false
  if (!W) { liberi = INIZIALE; scrivi(); return true }
  if (W.conto.eur >= 0.01) { apriWallet('converti'); return false }
  if (W.conto.sussidio) return false
  W.conto.sussidio = true
  liberi += INIZIALE
  scrivi()
  chiama({ a: 'sussidio' }).then((r) => { if (!r.ok && r.conto) { W.conto = r.conto; liberi = Math.max(0, mezzi(r.conto.pzk - sulTavoli())); scriviJSON(localStorage, CHIAVE_CONTO, W); avvisa() } })
  return true
}
/** Perché ricarica() ha detto di no (per la voce del gioco). */
export const perche = () => (!W ? '' : W.conto.eur >= 0.01 ? `hai ${fmtEur(W.conto.eur)} EUR€ nel wallet: convertili in $pzk per giocare` : 'il sussidio è uno al giorno: torna domani, o fatti mandare $pzk da un amico')

/** fn(saldo) a ogni cambio, anche quando il saldo cambia in un'altra scheda. Restituisce la funzione per smettere. */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }
/** fn() a ogni cambio di qualunque cosa (saldo, conto, EUR€, cambio): per il wallet. */
export function osserva(fn) { osservatori.add(fn); return () => osservatori.delete(fn) }

addEventListener('storage', (e) => {
  if (e.key !== CHIAVE_CONTO) return
  const w = leggiConto()
  if (!!w !== !!W || (w && W && w.token !== W.token)) { W = w; liberi = w ? Math.max(0, mezzi(w.conto.pzk - sulTavoli())) : leggiSessione(); avvisa(); return }
  if (w && W) { W = w; liberi = Math.max(0, mezzi(w.conto.pzk - sulTavoli())); avvisa() }
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
/** I numeri corti per i riquadri stretti (Alberto, 23.10: «13.332,5» non ci stava): 999, 1,0K, 13,3K, 1,0M, 1,0B, 1,0T.
 *  Un decimale sempre; se arrotondando si arriva a mille si passa all'unità dopo (999.960 → 1,0M, non 1.000,0K). */
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
/** Il conto, come lo vede il wallet ({ nome, ind, pzk, eur, ig, trovati, invii, mosse… }), o null (la sessione). */
export const conto = () => W?.conto ?? null
export const token = () => W?.token ?? null
export const euro = () => W?.conto.eur ?? 0
/** Il cambio (1 $pzk in EUR€) di quando ci si è sincronizzati, e quando; scaduto() dopo mezz'ora. */
export const tasso = () => W?.tasso ?? 1
export const sincronizzato = () => W?.t ?? 0
export const scaduto = () => !!W && Date.now() - W.t > VALE_CAMBIO
export const serverOnline = () => online

async function chiama(body, { keepalive = false } = {}) {
  try {
    // lg: il giorno della lumachina che il saldo di qui contiene già (api/wallet.mjs: se una risposta s'è persa, il server
    // aggiunge le giornate che il browser non ha visto)
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(W && { token: W.token, lg: W.conto.lumaca?.g ?? null, ...(Number.isInteger(W.conto.es) && { es: W.conto.es }) }), ...body }), keepalive })
    const d = await r.json().catch(() => ({ ok: false, errore: 'il server non risponde' }))
    online = !d.offline
    if (d.esci && W) { esci(false) }
    return d
  } catch { return { ok: false, errore: 'niente rete: riprova' } }
}
// la risposta del server con dentro il conto: diventa lo stato (il saldo libero segue, i tavoli restano). Se intanto qui
// si è giocato (tienipzk), resta il saldo di qui più quello che la lumachina ha appena spostato sul server (d.lumaca.delta)
function accogli(d, { tienipzk = false } = {}) {
  if (!d?.conto || !W) return
  // es: i soldi arrivati da fuori (un invio ricevuto, un'operazione della banca) che il saldo di qui non contiene ancora
  const pzkLocale = W.conto.pzk, esPrima = W.conto.es
  const fuori = Number.isInteger(esPrima) ? (d.conto.esterni ?? []).filter((v) => v.s > esPrima).reduce((a, v) => a + v.n, 0) : 0
  const lumaca = (Number(d.lumaca?.delta) || 0) + fuori
  W.conto = d.conto
  if (Number.isFinite(d.tasso)) W.tasso = d.tasso
  if (Number.isFinite(d.t)) W.t = d.t
  if (tienipzk && !d.avviso) { W.conto.pzk = Math.max(0, mezzi(pzkLocale + lumaca)); if (lumaca) liberi = Math.max(0, mezzi(liberi + lumaca)) }
  else liberi = Math.max(0, mezzi(W.conto.pzk - sulTavoli()))
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  avvisa()
}
// il saldo al server: un po' dopo l'ultimo cambio, e subito (keepalive) quando la pagina si nasconde
let attesa = 0, sporco = false
function salvaPoi() { sporco = true; clearTimeout(attesa); attesa = setTimeout(() => salva(), 1200) }
async function salva(keepalive = false) {
  if (!W || !sporco) return
  sporco = false
  const mandato = W.conto.pzk
  inCorso = chiama({ a: 'salva', pzk: mandato }, { keepalive })
  const d = await inCorso
  inCorso = null
  if (d.ok) accogli(d, { tienipzk: W?.conto.pzk !== mandato })
  else if (d.conto) accogli(d)
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(attesa); salva(true) } })
addEventListener('pagehide', () => { clearTimeout(attesa); salva(true) })

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
  W = { token: d.token, conto: d.conto, tasso: d.tasso, t: d.t }
  liberi = Math.max(0, mezzi(d.conto.pzk - sulTavoli()))
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  avvisa()
}
/** Esci: si torna ai 1.000 della sessione (prima si salva quello che c'è). */
export async function esci(salvaPrima = true) {
  if (!W) return
  if (salvaPrima) { clearTimeout(attesa); await salva() }
  W = null
  scriviJSON(localStorage, CHIAVE_CONTO, null)
  liberi = leggiSessione()
  avvisa()
}
/** Sincronizza col server: il conto com'è lì e il cambio di adesso (prima manda il saldo di qui). → { ok, errore? } */
export async function sincronizza() {
  if (!W) return { ok: false, errore: 'non sei entrato' }
  clearTimeout(attesa); sporco = false
  const mandato = W.conto.pzk
  const d = await chiama({ a: 'stato', pzk: mandato })
  if (d.ok || d.conto) accogli(d, { tienipzk: d.ok && W?.conto.pzk !== mandato })
  return d
}
// le azioni che toccano il conto: il saldo di qui parte insieme, e il conto torna com'è sul server
async function azione(body) {
  if (!W) return { ok: false, errore: 'entra nel wallet, prima' }
  clearTimeout(attesa); sporco = false
  if (inCorso) await inCorso
  const d = await chiama({ ...body, pzk: W.conto.pzk })
  if (d.conto) accogli(d)
  return d
}
/** Converte `quanto` da 'pzk' a EUR€ o da 'eur' a $pzk, al cambio dell'ultima sincronizzazione (se è scaduto, prima si sincronizza). */
export async function converti(da, quanto) {
  if (!W) return { ok: false, errore: 'entra nel wallet, prima' }
  if (scaduto()) { const s = await sincronizza(); if (!s.ok) return s }
  let d = await azione({ a: 'converti', da, quanto, t: W.t })
  if (!d.ok && d.sincronizza) { await sincronizza(); d = await azione({ a: 'converti', da, quanto, t: W.t }) }
  return d
}
export const invia = (ind, quanto) => azione({ a: 'invia', ind, quanto })
export const cambiaIndirizzo = (nuovo, key) => azione({ a: 'indirizzo', nuovo, ...(key && { key }) })
export const cambiaPin = (vecchio, nuovo) => azione({ a: 'pin', vecchio, nuovo })
/** Chi è a questo indirizzo (per controllare prima di inviare). → { ok, conto: { nome, ind } } */
export async function chiE(ind) { try { return await (await fetch(`${API}?ind=${encodeURIComponent(ind)}`)).json() } catch { return { ok: false, errore: 'niente rete' } } }

// ── le banconote perse per terra (scena/banconote.js): una volta al giorno ciascuna ──
function trovateSessione() { const t = leggiJSON(sessionStorage, CHIAVE_TROVATE); return t && t.g === oggi() ? t.q : [] }
/** Le banconote già raccolte oggi (['b500', …]). */
export const trovate = () => (W ? W.conto.trovati ?? [] : trovateSessione())
/** Raccoglie una banconota: i suoi $pzk arrivano subito (col conto, il server conferma). → true se era da raccogliere */
export function trova(quale) {
  const v = BANCONOTE[quale]
  if (!v || trovate().includes(quale)) return false
  if (W) {
    W.conto.trovati = [...trovate(), quale]
    liberi += v; scrivi()
    chiama({ a: 'trova', quale, pzk: W.conto.pzk }).then((d) => { if (d.conto) accogli(d, { tienipzk: d.ok }) })
  } else {
    scriviJSON(sessionStorage, CHIAVE_TROVATE, { g: oggi(), q: [...trovateSessione(), quale] })
    liberi += v; scrivi()
  }
  return true
}

// ── il wallet (wallet/wallet.js, caricato dalla pagina quando serve) ──
/** Apre il wallet su una sezione ('converti', 'entra', 'invia', 'borsa'…): la pagina ascolta l'evento e carica il modulo. */
export function apriWallet(sezione = null) { document.dispatchEvent(new CustomEvent('pzkko-wallet', { detail: { sezione } })) }

/** La riga dei giochi sotto il saldo: «hai anche EUR€ 12,50 nel wallet · convertili in $pzk». C'è solo se ci sono EUR€. */
export function rigaEuro({ classe = 'pzk-eur' } = {}) {
  const a = document.createElement('a')
  a.href = '#wallet'
  a.className = classe
  a.title = 'si apre il wallet: gli EUR€ si giocano solo convertiti in $pzk, al cambio di adesso'
  const aggiorna = () => { const e = euro(); a.hidden = !W || e < 0.01; if (!a.hidden) a.innerHTML = `hai anche <b>EUR€ ${fmtEur(e)}</b> nel wallet: convertili in $pzk` }
  a.addEventListener('click', (e) => { e.preventDefault(); apriWallet('converti') })
  osserva(aggiorna)
  aggiorna()
  return a
}

// ── il regalo per chi mi segue su Instagram ──────────────────────────────────
// 1.000 $pzk, una volta sola: per browser nella sessione (localStorage pzkko-pzk-ig), per conto col conto (il server se
// lo segna). Un sito non può sapere chi segue chi (Instagram non lo dice), quindi ci si fida: il link apre il profilo e,
// tornati qui, i $pzk arrivano.
export const INSTAGRAM = 'https://www.instagram.com/albertoxpecchini/'
export const PREMIO_IG = 1000
const CHIAVE_IG = 'pzkko-pzk-ig'
export const premioPreso = () => (W ? !!W.conto.ig : (() => { try { return !!localStorage.getItem(CHIAVE_IG) } catch { return false } })())
export function premioInstagram() {
  if (premioPreso()) return false
  if (W) {
    W.conto.ig = true
    liberi += PREMIO_IG; scrivi()
    chiama({ a: 'ig', pzk: W.conto.pzk }).then((d) => { if (d.conto) accogli(d, { tienipzk: d.ok }) })
  } else {
    try { localStorage.setItem(CHIAVE_IG, new Date().toISOString()) } catch {}
    liberi += PREMIO_IG; scrivi()
  }
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
  addEventListener('storage', (e) => { if (e.key === CHIAVE_IG) aggiorna() })
  osserva(aggiorna)
  aggiorna()
  return a
}

// all'arrivo, col conto: si chiede al server com'è (e il cambio di adesso), senza fermare nessuno
if (W) setTimeout(() => sincronizza(), 400)
