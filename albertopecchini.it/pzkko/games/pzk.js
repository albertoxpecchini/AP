// I $pzk di pzkko.it: soldi finti, gli stessi per tutti i giochi (roulette, blackjack, mine, dado, moneta, virtual e quelli che
// verranno) e per il wallet in alto a sinistra (wallet/wallet.js). Non valgono niente e non si comprano.
//
// Due modi di stare al mondo (dal 22.10 notte):
// - LA SESSIONE: chi non entra ha 1.000 $pzk che durano la sessione del browser (sessionStorage) e non cambiano mai; a
//   zero, il gioco ne dà altri 1.000. Niente EUR€, niente borsa: 1.000 standard sono 1.000 standard.
// - IL CONTO: chi entra nel wallet (un nome e un PIN di quattro cifre, api/wallet.mjs) ha i suoi soldi salvati sul
//   server e soggetti alla borsa (api/borsa.mjs): può parcheggiarli in EUR€ (l'euroshit, l'euro finto del wallet) e
//   riportarli in $pzk al cambio del momento. Il token e il conto com'è sul server stanno in localStorage (pzkko-wallet).
//
// I LOTTI (29.10 notte, Alberto: «ho giocato i dadi, ho vinto un botto, ho visto saldo 8000 e rotti e poi ctrl f5 sono
// spariti … quando vinco anche dopo 1 millesimo le cose si salvino subito … se entro con 2 telefoni e stesso account assieme
// devo vedere le cose sincronizzati al millisecondo»). Fino al 29.10 il browser mandava il saldo intero, un po' dopo ogni
// cambio: quello che non era ancora partito spariva ricaricando, e due dispositivi si cancellavano a vicenda. Adesso:
// - il saldo vero è quello del server (W.conto.pzk); quello che si vede è il saldo del server PIÙ le variazioni di qui che
//   il server non ha ancora contato, più i premi che il server sta per dare (attesa);
// - ogni variazione (un giro finito, una morte) è un LOTTO numerato, { n, d, persi, v }: quanto cambia il saldo e da dove
//   (le voci: il gioco col puntato e il tornato, i soldi nuovi del lavoro, la cassa); finisce SUBITO in localStorage (la
//   coda di questa pagina, pzkko-coda:<conto>:<pagina>) e parte SUBITO per il server (se una richiesta è in volo, appena
//   torna). Ogni pagina aperta è un dispositivo: una pagina ricaricata trova la coda di quella di prima, la conta nel saldo
//   e la rimanda; il server non applica mai due volte lo stesso lotto (api/wallet.mjs, «I LOTTI NUMERATI»), lo controlla
//   prima (le voci devono fare esattamente la variazione, un gioco non rende più di 50 volte, niente salti impossibili) e
//   risponde col saldo vero. Le code di tutte le schede dello stesso browser si sommano subito (l'evento storage);
//   gli altri dispositivi lo sanno dal canale (games/live.js), che porta il saldo nuovo del server (dalCanale).
// - il conto ha una versione (conto.agg, l'ora del server, sempre crescente): una risposta o un avviso più vecchi di quello
//   che si sa già non cambiano niente.
//
// Ogni gioco sposta i $pzk dal saldo al suo tavolo quando punta (punta), li riprende se toglie la fiche (ritira) e, a giro
// finito, chiude il conto (regola): quello che era sul tavolo è giocato, torna quello che si è vinto. Le puntate non sono
// lotti: per il server il saldo le contiene ancora, e se la pagina si chiude a metà giro, alla volta dopo tornano nel saldo.
// I conti vanno a mezzi $pzk (il blackjack paga 3 a 2: 5 → 7,5); gli EUR€ a centesimi.
//
// L'ECONOMIA (26.10, api/_economia.mjs): ogni regola dice dove vanno i soldi. Di base è un conto con la CASSA DI PZK (le
// puntate perse, gli acquisti; le vincite e la roba venduta escono da lì): regola(gioco, giocato, torna). I soldi nuovi
// (il lavoro, le quest, i premi, la miniera) sono CONIO: regola(…, 'conio'); quelli persi morendo cadono per terra:
// perdi(n). Le voci dei lotti lo dicono al server, che fa i conti dell'offerta e il libro di ognuno (le classifiche). Col
// conto ci sono anche i SOLDI SPORCHI (il bottino delle rapine: si vedono nel saldo ma con pzk non si spendono, quindi punta
// accetta solo i puliti) e la GALERA (non si punta).

const API = '/api/wallet/' // con la barra finale: il sito ha trailingSlash, e senza ogni POST passava da un redirect 308 che alcuni browser fanno confermare (« reinviare i dati del modulo? »)
const CHIAVE_SESSIONE = 'pzkko-pzk-sessione'
const CHIAVE_CONTO = 'pzkko-wallet'
const CHIAVE_TROVATE = 'pzkko-pzk-trovate'
const CODA = 'pzkko-coda:' // + <conto>:<pagina>
export const INIZIALE = 1000
export const VALE_CAMBIO = 30 * 60 * 1000
export const BANCONOTE = { b500: 500, b100: 100, b25: 25, b10: 10 }
const GIOCHI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual'] // i giochi grandi (come GIOCHI_SOLDI di api/wallet.mjs)

const mezzi = (n) => Math.round(n * 2) / 2
const cent = (n) => Math.round(n * 100) / 100
const tavoli = new Map() // gioco → $pzk sul suo tavolo, in questa pagina
const ascolti = new Set(), osservatori = new Set()
// CHI POSSIEDE I SOLDI (26.10, Alberto: «senza account ho messo dei soldi su virtual e quando ho loggato ho visto ancora i vecchi
// soldi = bug, rischio duplicazione»): la sessione e ogni conto sono portafogli separati. Quando si entra o si esce, quello che
// era sui tavoli appartiene al portafoglio di prima: i tavoli si svuotano e i giochi che avevano una puntata aperta finiscono
// fra gli STANTII; se poi pagano, il pagamento non passa (la puntata non è stata tolta a questo portafoglio). Chi tiene le sue
// puntate (la schedina di virtual) si sposta insieme: alCambioConto.
const stantii = new Set()
const cambiaConto = new Set()
function altroProprietario() {
  for (const [g, n] of tavoli) if (n > 0) stantii.add(g)
  tavoli.clear()
}
const avvisaCambioConto = () => { for (const f of cambiaConto) { try { f() } catch (e) { console.error(e) } } }
const sulTavoli = () => [...tavoli.values()].reduce((a, b) => a + b, 0)
/** Il giorno di Mantova (AAAA-MM-GG): le banconote per terra tornano ogni giorno. */
export const oggi = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const leggiJSON = (dep, k) => { try { return JSON.parse(dep.getItem(k) || 'null') } catch { return null } }
const scriviJSON = (dep, k, v) => { try { v === null ? dep.removeItem(k) : dep.setItem(k, JSON.stringify(v)) } catch {} }

// ── lo stato ──
let W = leggiConto() // il conto: { token, conto (com'è sul server), tasso, t } o null
let liberi = 0
let online = null // null = non si sa ancora, false = il server dice offline
let attesa = 0 // i $pzk che il server sta per dare (il sussidio, una banconota, il regalo di instagram): si vedono subito

function leggiSessione() {
  const s = leggiJSON(sessionStorage, CHIAVE_SESSIONE)
  return s && Number.isFinite(s.saldo) && s.saldo >= 0 ? mezzi(s.saldo) : INIZIALE
}
function leggiConto() {
  const w = leggiJSON(localStorage, CHIAVE_CONTO)
  return w && typeof w.token === 'string' && w.conto && Number.isFinite(w.conto.pzk) ? w : null
}
function avvisa() { for (const f of ascolti) f(liberi); for (const f of osservatori) f() }

// ── le code dei lotti (vedi in cima). code: chiave di localStorage → { chi, n, lotti, vivo } ──
const nuovoId = () => { const a = crypto.getRandomValues(new Uint8Array(12)); return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const DISP = nuovoId() // questa pagina
const chi = () => (W ? W.token.split('.')[0] : null) // il conto (la prima parte del token)
const chiaveMia = () => `${CODA}${chi()}:${DISP}`
const dispDi = (k) => k.slice(k.lastIndexOf(':') + 1)
function leggiCode() {
  const out = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(CODA)) continue
      const q = leggiJSON(localStorage, k)
      if (q && Array.isArray(q.lotti)) out[k] = q
    }
  } catch {}
  return out
}
let code = leggiCode()
/** Le code di questo conto (di questa pagina, delle altre schede, delle pagine di prima). */
const mie = () => Object.entries(code).filter(([k, q]) => q.chi === chi() && k.startsWith(`${CODA}${chi()}:`))
const inCoda = () => mie().reduce((s, [, q]) => s + q.lotti.reduce((a, l) => a + (Number(l.d) || 0), 0), 0)
/** Di nessuno: la pagina che la teneva è stata chiusa (vivo 0) o non si fa viva da mezzo minuto. */
const orfana = (k, q) => dispDi(k) !== DISP && (q.vivo === 0 || Date.now() - q.vivo > 30_000)
const daMandare = () => mie().filter(([, q]) => q.lotti.length).map(([k, q]) => ({ disp: dispDi(k), lotti: q.lotti }))

/** Il saldo che si vede: quello del server, più i lotti in viaggio, più i premi in arrivo, meno quello che c'è sui tavoli. */
function ricalcola() {
  if (W) liberi = Math.max(0, mezzi(W.conto.pzk + inCoda() + attesa - sulTavoli()))
  avvisa()
}
function scrivi() {
  if (W) return ricalcola()
  scriviJSON(sessionStorage, CHIAVE_SESSIONE, { saldo: mezzi(liberi + sulTavoli()) })
  avvisa()
}
/** Un lotto nuovo di questa pagina: in coda (in localStorage, subito) e via al server. */
function aggiungi(parte) {
  const k = chiaveMia(), q = (code[k] ??= { chi: chi(), n: 0, lotti: [], vivo: Date.now() })
  q.n += 1
  q.lotti.push({ n: q.n, ...parte })
  q.vivo = Date.now()
  scriviJSON(localStorage, k, q)
  manda()
}
/** Il server ha visto fino al lotto visti[pagina]: si tolgono dalle code. Le code di questa pagina e quelle di nessuno si
 *  riscrivono (o si cancellano, vuote); quelle delle altre schede vive le riscrive chi le tiene. */
function pota(visti = {}) {
  for (const [k, q] of mie()) {
    const v = visti[dispDi(k)] ?? 0, prima = q.lotti.length
    q.lotti = q.lotti.filter((l) => l.n > v)
    if (q.lotti.length === prima) continue
    const mia = dispDi(k) === DISP
    if (!mia && !orfana(k, q)) continue
    if (!q.lotti.length && !mia) { delete code[k]; scriviJSON(localStorage, k, null) }
    else if (!q.lotti.length) scriviJSON(localStorage, k, null) // (la mia, vuota: in memoria resta il numero)
    else scriviJSON(localStorage, k, q)
  }
}

/** I $pzk liberi (quelli non puntati). */
export const saldo = () => liberi
/** I $pzk che un gioco ha sul tavolo. */
export const sulTavolo = (gioco) => tavoli.get(gioco) ?? 0
/** Di chi sono i soldi di adesso: 's' (la sessione) o 'c:nome' (un conto). Chi salva roba legata ai soldi lo usa per tenerla separata. */
export const proprietario = () => (W ? 'c:' + String(W.conto.nome ?? '').toLowerCase() : 's')
/** fn() quando si entra in un conto o se ne esce (anche da un'altra scheda): il portafoglio è un altro. Restituisce la funzione per smettere. */
export function alCambioConto(fn) { cambiaConto.add(fn); return () => cambiaConto.delete(fn) }

/** Dal saldo al tavolo del gioco; false (e niente spostato) se non bastano. */
export function punta(gioco, n) {
  n = mezzi(n)
  if (!(n > 0) || n > puliti() || inGalera()) return false
  liberi -= n
  stantii.delete(gioco)
  tavoli.set(gioco, sulTavolo(gioco) + n)
  scrivi()
  return true
}
/** Dal tavolo al saldo (la fiche tolta prima del giro). */
export function ritira(gioco, n) {
  if (stantii.has(gioco)) return
  n = Math.min(mezzi(n), sulTavolo(gioco))
  if (!(n > 0)) return
  tavoli.set(gioco, sulTavolo(gioco) - n)
  liberi += n
  scrivi()
}
const nomeVoce = (g) => String(g).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 24) || 'altro'
/** Fine di un giro (o di una parte): `giocato` lascia il tavolo, `torna` va nel saldo. `tipo`: 'casa' (di base: un conto
 *  con la cassa di pzk, che incassa il giocato e paga il tornato), 'conio' (soldi nuovi: il tornato nasce dal nulla).
 *  Col conto è un lotto, che parte subito. */
export function regola(gioco, giocato, torna, tipo = 'casa') {
  if (stantii.has(gioco)) { stantii.delete(gioco); return } // la puntata era di un altro portafoglio (vedi altroProprietario): niente da pagare qui
  // (lascia il tavolo quello che c'era davvero: chi regola senza aver puntato non paga, come prima dei lotti)
  const g = Math.min(mezzi(giocato), sulTavolo(gioco)), t = mezzi(torna)
  tavoli.set(gioco, Math.max(0, sulTavolo(gioco) - mezzi(giocato)))
  if (W) {
    const nome = nomeVoce(gioco), voce = tipo === 'conio' ? [`c:${nome}`, [g, t]] : GIOCHI.includes(gioco) || gioco.startsWith('chat-') ? [`g:${nome}`, [g, t, 1, t > g ? 1 : 0, Math.max(0, t - g)]] : [`k:${nome}`, [g, t]]
    if (g || t) aggiungi({ d: mezzi(t - g), persi: 0, v: { [voce[0]]: voce[1] } })
  } else liberi += t
  scrivi()
  // le statistiche del profilo (26.10): i giochi grandi le segnano nello zaino (chat/zaino.js, giro: gli altri li ignora)
  if (!gioco.startsWith('chat')) import('../chat/zaino.js').then((z) => z.giro?.(gioco, mezzi(giocato), mezzi(torna))).catch(() => {})
}
export const aSecco = () => liberi < 1 && sulTavoli() === 0
/** I $pzk persi per terra (una morte): non vanno alla cassa, finiscono fra i portafogli smarriti. Anche dai soldi sporchi. */
export function perdi(n) {
  n = mezzi(Math.min(n, liberi))
  if (!(n > 0)) return 0
  if (W) aggiungi({ d: -n, persi: n, v: {} })
  else liberi -= n
  scrivi()
  return n
}
/** I soldi sporchi (il bottino delle rapine): si vedono nel saldo, con pzk non si spendono. */
export const sporchi = () => (W ? Math.min(liberi, W.conto.sporchi ?? 0) : 0)
/** I $pzk che si possono spendere con pzk (puntare, comprare, pagare). */
export const puliti = () => Math.max(0, mezzi(liberi - sporchi()))
/** Fino a quando si è in galera (0: liberi). */
export const galera = () => (W?.conto.galera > Date.now() ? W.conto.galera : 0)
export const inGalera = () => galera() > 0
export const lavaggio = () => W?.conto.lavaggio ?? null
/** Perché una puntata non passa (i giochi lo dicono con la loro voce): la galera, i soldi sporchi, o non bastano. */
export const nonBasta = () => (inGalera() ? `sei in galera fino alle ${oraDi(galera())}` : sporchi() > 0 ? `puoi puntare solo i soldi puliti: ne hai ${fmt(puliti())} (gli altri ${fmt(sporchi())} sono sporchi: si lavano nella lavatrice, che si compra nel pzkstore del cercapersone)` : liberi >= 1 ? `non ti bastano: hai ${fmt(liberi)} $pzk` : 'hai finito i $pzk')
const oraDi = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })

/** Un premio che dà il server (il sussidio, una banconota, il regalo di instagram): si vede subito (attesa), e quando il
 *  server risponde vale il suo conto (che lo contiene, o no se ha detto di no). */
function promessa(n, body) {
  attesa = mezzi(attesa + n)
  ricalcola()
  return chiama(body).then((d) => { attesa = mezzi(attesa - n); if (d.conto) accogli(d); else ricalcola(); return d })
}
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
  promessa(INIZIALE, { a: 'sussidio' })
  return true
}
/** Perché ricarica() ha detto di no (per la voce del gioco). */
export const perche = () => (inGalera() ? `sei in galera fino alle ${oraDi(galera())}: si esce prima con la cauzione (app rapina)` : W && sporchi() > 0 && puliti() < 1 ? 'hai solo soldi sporchi: con pzk non si spendono. si lavano nella lavatrice, che si compra nel pzkstore del cercapersone (5.000 puliti, una volta; poi 2.000 a lavaggio): i puliti vengono dal lavoro, dalle quest, dalle sfide. o aspetti 96 giorni, e si puliscono da soli' : !W ? '' : W.conto.eur >= 0.01 ? `hai ${fmtEur(W.conto.eur)} EUR€ nel wallet: convertili in $pzk per giocare` : 'il sussidio è uno al giorno: torna domani, o fatti mandare $pzk da un amico')

/** fn(saldo) a ogni cambio, anche quando il saldo cambia in un'altra scheda. Restituisce la funzione per smettere. */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }
/** fn() a ogni cambio di qualunque cosa (saldo, conto, EUR€, cambio): per il wallet. */
export function osserva(fn) { osservatori.add(fn); return () => osservatori.delete(fn) }

// le altre schede: il conto (entrare, uscire, la versione nuova del server) e le loro code (si sommano subito)
addEventListener('storage', (e) => {
  if (e.key === null) { code = leggiCode(); return ricalcola() } // (localStorage svuotato)
  if (e.key?.startsWith(CODA)) {
    const q = leggiJSON(localStorage, e.key)
    // (senza i lotti che il server ha già contato: chi la riscrive può non averlo ancora saputo, e si conterebbero due volte)
    if (q && Array.isArray(q.lotti)) { const v = W?.conto.disp?.[dispDi(e.key)] ?? 0; q.lotti = q.lotti.filter((l) => l.n > v); code[e.key] = q }
    else if (dispDi(e.key) !== DISP) delete code[e.key]
    return ricalcola()
  }
  if (e.key !== CHIAVE_CONTO) return
  const w = leggiConto()
  if (!!w !== !!W || (w && W && w.token !== W.token)) {
    altroProprietario(); W = w; attesa = 0
    if (!W) liberi = leggiSessione()
    ricalcola(); avvisaCambioConto(); return
  }
  if (w && W && (w.conto.agg ?? 0) >= (W.conto.agg ?? 0)) { W = { ...W, ...w }; pota(W.conto.disp); ricalcola() }
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
/** Il conto, come lo vede il wallet ({ nome, ind, pzk, eur, ig, trovati, invii, mosse… }), o null (la sessione). Il saldo
 *  (pzk) è quello che si vede: il server più i lotti in viaggio. */
export const conto = () => (W ? { ...W.conto, pzk: mezzi(liberi + sulTavoli()) } : null)
export const token = () => W?.token ?? null
export const euro = () => W?.conto.eur ?? 0
/** Il cambio (1 $pzk in EUR€) di quando ci si è sincronizzati, e quando; scaduto() dopo mezz'ora. */
export const tasso = () => W?.tasso ?? 1
export const sincronizzato = () => W?.t ?? 0
export const scaduto = () => !!W && Date.now() - W.t > VALE_CAMBIO
export const serverOnline = () => online
/** Le code ancora in viaggio (per la regia e le prove): quanti lotti e quanti $pzk. */
export const inViaggio = () => ({ lotti: mie().reduce((s, [, q]) => s + q.lotti.length, 0), pzk: mezzi(inCoda()) })

async function chiama(body, { keepalive = false } = {}) {
  // col conto partono sempre le code (anche vuote): il server non riceve mai più il saldo intero, se non dal browser di prima
  const dati = W ? { token: W.token, disp: DISP, code: daMandare(), ...body } : body
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dati), keepalive })
    const d = await r.json().catch(() => ({ ok: false, errore: 'il server non risponde' }))
    online = !d.offline
    if (d.scartati?.length) console.warn('wallet: lotti scartati dal server', d.scartati, d.avviso)
    if (d.esci && W) esci(false)
    return d
  } catch { return { ok: false, errore: 'niente rete: riprova' } }
}
/** La risposta del server con dentro il conto: diventa lo stato, se non è più vecchia di quella che si ha. */
function accogli(d) {
  if (!d?.conto || !W) return
  if (Number.isFinite(d.tasso)) W.tasso = d.tasso
  if (Number.isFinite(d.t)) W.t = d.t
  if ((d.conto.agg ?? 0) >= (W.conto.agg ?? 0)) { W.conto = d.conto; pota(d.conto.disp) }
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  ricalcola()
}
/** Il canale (games/live.js) dice che il conto sul server è cambiato: il saldo, gli EUR€, i lotti visti, la versione. Si
 *  prende subito se è più nuovo; → true se lo era (live.js poi chiede il resto, le mosse e tutto, con sincronizza). */
export function dalCanale(s) {
  if (!W || !s || !Number.isFinite(s.pzk) || !((s.agg ?? 0) > (W.conto.agg ?? 0))) return false
  W.conto = { ...W.conto, pzk: s.pzk, eur: Number.isFinite(s.eur) ? s.eur : W.conto.eur, disp: s.disp ?? W.conto.disp, agg: s.agg }
  pota(W.conto.disp)
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  ricalcola()
  return true
}

// le code al server: subito; se una richiesta è già in volo, appena torna (una sola alla volta, con dentro tutto quello che
// c'è). Rete persa, server in pausa: si riprova fra 2 secondi, poi 4, 8… fino a 30, e intanto il saldo resta quello di qui
let volo = null, ancora = false, riprova = 0, pausa = 2000
function manda() {
  if (!W) return
  if (volo) { ancora = true; return }
  if (!daMandare().length) return
  clearTimeout(riprova)
  const k = chiaveMia()
  if (code[k]?.lotti.length) { code[k].vivo = Date.now(); scriviJSON(localStorage, k, code[k]) } // (viva: le altre schede non la prendono per di nessuno)
  volo = chiama({ a: 'salva' }).then((d) => {
    if (d.conto) { accogli(d); pausa = 2000 }
    else if (W) { riprova = setTimeout(manda, pausa); pausa = Math.min(30_000, pausa * 2) }
  }).finally(() => { volo = null; if (ancora) { ancora = false; manda() } })
}
// la pagina se ne va: la sua coda diventa di nessuno (la pagina dopo la prende subito) e parte quello che c'è (keepalive)
addEventListener('pagehide', () => {
  if (!W) return
  const k = chiaveMia()
  if (code[k]?.lotti.length) { code[k].vivo = 0; scriviJSON(localStorage, k, code[k]) }
  if (daMandare().length) chiama({ a: 'salva' }, { keepalive: true })
})
addEventListener('pageshow', (e) => { const k = W && chiaveMia(); if (e.persisted && code[k]?.lotti.length) { code[k].vivo = Date.now(); scriviJSON(localStorage, k, code[k]) } })
document.addEventListener('visibilitychange', () => { if (document.hidden) manda() })

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
  altroProprietario() // (quello che era sui tavoli era della sessione: non passa nel conto)
  W = { token: d.token, conto: d.conto, tasso: d.tasso, t: d.t }
  attesa = 0
  scriviJSON(localStorage, CHIAVE_CONTO, W)
  code = leggiCode() // (le code di questo conto rimaste da prima: si contano e si rimandano)
  ricalcola()
  avvisaCambioConto()
  manda()
}
/** Esci: si torna ai 1.000 della sessione (prima parte quello che c'è). */
export async function esci(salvaPrima = true) {
  if (!W) return
  if (salvaPrima && daMandare().length) { const d = await chiama({ a: 'salva' }); if (d.conto) accogli(d) }
  if (!W) return
  altroProprietario() // (le puntate del conto sono nel suo saldo sul server: i tavoli non seguono nella sessione)
  const k = chiaveMia()
  if (code[k]?.lotti.length) { code[k].vivo = 0; scriviJSON(localStorage, k, code[k]) } // (non partita: resta per quando si rientra)
  W = null
  attesa = 0
  scriviJSON(localStorage, CHIAVE_CONTO, null)
  liberi = leggiSessione()
  avvisa()
  avvisaCambioConto()
}
/** Sincronizza col server: il conto com'è lì e il cambio di adesso (partono anche le code). → { ok, errore? } */
export async function sincronizza() {
  if (!W) return { ok: false, errore: 'non sei entrato' }
  const d = await chiama({ a: 'stato' })
  if (d.conto) accogli(d)
  return d
}
/** Il biglietto del canale diretto col server dei dati (games/live.js): { url, biglietto } o null. */
export async function biglietto() {
  if (!W) return null
  const d = await chiama({ a: 'biglietto' })
  return d.ok && d.url && d.biglietto ? { url: d.url, biglietto: d.biglietto } : null
}
// le azioni che toccano il conto: partono insieme alle code, e il conto torna com'è sul server
async function azione(body) {
  if (!W) return { ok: false, errore: 'entra nel conto, prima (l’app account del cercapersone)' }
  const d = await chiama(body)
  if (d.conto) accogli(d)
  return d
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
// ── l'economia (26.10, api/wallet.mjs) ──
/** Arrestato (un lavoro rischioso andato male): galera per `ore` e la multa alla cassa. */
export const arresto = (ore, multa, perche = '') => azione({ a: 'arresto', ore, multa, perche })
/** La cauzione: si esce di galera pagando la cassa. */
export const cauzione = () => azione({ a: 'cauzione' })
/** La lavatrice: `quanto` sporchi (al più 50.000) puliti fra dieci minuti, 2.000 puliti di commissione. */
export const lava = (quanto) => azione({ a: 'lava', quanto })
/** Un wallet o una chiavetta trovati dallo spazzino, decifrati: i $pzk dei portafogli smarriti. */
export const decifra = (tipo) => azione({ a: 'decifra', tipo })
/** Il colpo alla cassa: op 'apri', 'entra' (col codice), 'esci', 'vai'; 'stato' si chiede spesso e non salva. */
export async function colpo(op, codice = '') {
  if (!W) return { ok: false, errore: 'serve il conto (app account)' }
  if (op !== 'stato') return azione({ a: 'colpo', op, codice })
  const d = await chiama({ a: 'colpo', op, codice })
  if (d.conto) accogli(d) // (il bottino o la multa arrivano col saldo del server)
  return d
}
export const cambiaIndirizzo = (nuovo, key) => azione({ a: 'indirizzo', nuovo, ...(key && { key }) })
export const cambiaPin = (vecchio, nuovo) => azione({ a: 'pin', vecchio, nuovo })
/** Chi è a questo indirizzo (per controllare prima di inviare). → { ok, conto: { nome, ind } } */
export async function chiE(ind) { try { return await (await fetch(`${API}?ind=${encodeURIComponent(ind)}`)).json() } catch { return { ok: false, errore: 'niente rete' } } }

// ── le banconote perse per terra (scena/banconote.js): una volta al giorno ciascuna ──
function trovateSessione() { const t = leggiJSON(sessionStorage, CHIAVE_TROVATE); return t && t.g === oggi() ? t.q : [] }
/** Le banconote già raccolte oggi (['b500', …]). */
export const trovate = () => (W ? W.conto.trovati ?? [] : trovateSessione())
/** Raccoglie una banconota: i suoi $pzk arrivano subito (col conto, li dà il server, che segna la banconota). → true se era da raccogliere */
export function trova(quale) {
  const v = BANCONOTE[quale]
  if (!v || trovate().includes(quale)) return false
  if (W) {
    W.conto.trovati = [...trovate(), quale]
    promessa(v, { a: 'trova', quale })
  } else {
    scriviJSON(sessionStorage, CHIAVE_TROVATE, { g: oggi(), q: [...trovateSessione(), quale] })
    liberi += v; scrivi()
  }
  return true
}

// ── il wallet (wallet/wallet.js, caricato dalla pagina quando serve) ──
/** Apre il wallet (la pagina ascolta l'evento e carica il modulo). Dal 26.10 nel wallet ci sono solo il saldo e la borsa: le sue
 *  vecchie pagine (il conto, il cambio, gli invii, l'altro: 'entra', 'converti', 'invia'…) sono l'app Account del cercapersone. */
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
    promessa(PREMIO_IG, { a: 'ig' })
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

// ── all'arrivo ──
// col conto: il saldo è quello del server più le code rimaste (anche quelle della pagina di prima, appena ricaricata), e
// si chiede subito al server com'è adesso (partono anche le code). Il conto scritto dal codice di prima del 29.10 (senza
// conto.agg) ha il saldo intero di qui, magari non ancora salvato: la prima volta parte così, alla vecchia, e il server lo
// accetta se ha senso (come prima); da lì in poi solo lotti.
if (W) {
  ricalcola()
  if (W.conto.agg === undefined) {
    const vecchio = { a: 'stato', token: W.token, pzk: W.conto.pzk, lg: W.conto.lumaca?.g ?? null, ...(Number.isInteger(W.conto.es) && { es: W.conto.es }) }
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vecchio) })
      .then((r) => r.json()).then((d) => { if (d.conto) { W.conto.agg = -1; accogli(d) } if (d.esci) esci(false) }).catch(() => {}).finally(() => sincronizza())
  } else sincronizza()
} else liberi = leggiSessione()
