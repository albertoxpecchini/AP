// Lo zaino di chi parla col bot (chat.js): i punti esperienza e il livello, il mestiere, gli oggetti, le attese dei
// comandi, gli effetti in corso (il caffè, la lattina…), la serie dei premi giornalieri e le statistiche. I $pzk NON
// stanno qui: sono quelli di games/pzk.js, gli stessi dei giochi e del wallet.
//
// Come il saldo: nella SESSIONE (chi non è entrato nel wallet) lo zaino sta in sessionStorage e sparisce con la scheda;
// col CONTO sta sul server (api/wallet.mjs, azione «zaino», un file a parte su Blob: pzkko/chat.json) e in localStorage
// come copia, si salva un po' dopo ogni cambio e subito quando la pagina si nasconde.
// Sincronizzato fra i dispositivi (26.10, Alberto: «dal telefono mi dà livello 1, dal pc 4»): prima vinceva lo zaino col
// `t` più recente e lo si chiedeva al server solo entrando nel conto, così un telefono rimasto indietro, alla prima mossa,
// cancellava i progressi del pc. Ora lo si chiede aprendo la pagina (e non si salva finché non è arrivato), tornando
// sulla pagina e ogni due minuti, e i due zaini si UNISCONO (zaino-unisci.mjs: l'esperienza e le statistiche il meglio dei
// due, gli oggetti da chi ha l'ultima parola); `visto` è il `t` dell'ultimo zaino visto sul server, e il server lo usa per
// capire se chi scrive è rimasto indietro.

import * as pzk from '../games/pzk.js'
import { PER_ID } from './testi.js'
import { unisci, uguali } from './zaino-unisci.mjs'

const API = '/api/wallet/' // con la barra finale (trailingSlash): senza, il redirect 308 del POST fa chiedere conferma al browser
const CHIAVE_SESSIONE = 'pzkko-chat-sessione'
const CHIAVE_CONTO = 'pzkko-chat'
export const MAX_BYTE = 8 * 1024

export const vuoto = () => ({ v: 1, t: 0, xp: 0, mestiere: null, turni: 0, oggetti: {}, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] })
const leggiJSON = (dep, k) => { try { return JSON.parse(dep.getItem(k) || 'null') } catch { return null } }
const scriviJSON = (dep, k, v) => { try { v === null ? dep.removeItem(k) : dep.setItem(k, JSON.stringify(v)) } catch {} }
const valido = (z) => z && typeof z === 'object' && z.v === 1 && Number.isFinite(z.xp)

/** Il livello dai punti: 1 all'inizio, 2 a 60 xp, 3 a 240, 5 a 960, 10 a 4.860. */
export const livelloDi = (xp) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60))
/** Gli xp che servono per il livello l. */
export const xpPer = (l) => 60 * (l - 1) ** 2

let visto = 0 // il `t` dell'ultimo zaino visto sul server (0: mai, o una copia di prima del 26.10)
let Z = carica()
let chi = pzk.conto()?.ind ?? null // per chi è lo zaino in memoria
const ascolti = new Set()
let attesa = 0, sporco = false, inCorso = null

function carica() {
  const c = pzk.conto()
  if (c) { const z = leggiJSON(localStorage, CHIAVE_CONTO), mio = z && z.ind === c.ind && valido(z.zaino); visto = mio ? z.visto ?? 0 : 0; return mio ? z.zaino : vuoto() }
  const z = leggiJSON(sessionStorage, CHIAVE_SESSIONE)
  return valido(z) ? z : vuoto()
}
const copia = () => scriviJSON(localStorage, CHIAVE_CONTO, { ind: pzk.conto()?.ind, zaino: Z, visto })
function scrivi() {
  Z.t = Date.now()
  if (pzk.conto()) { copia(); salvaPoi() } else scriviJSON(sessionStorage, CHIAVE_SESSIONE, Z)
  for (const f of ascolti) f(Z)
}
// (quasi subito: 250 ms, perché dieci cambi di fila siano una richiesta sola; col canale aperto, games/live.js, gli altri
// dispositivi lo vedono nel giro di qualche secondo)
function salvaPoi() { sporco = true; clearTimeout(attesa); attesa = setTimeout(() => salva(), 250) }
// (il primo salvataggio aspetta lo zaino del server: se no un dispositivo rimasto indietro scrive sopra quello giusto)
let primo = Promise.resolve()
async function salva(keepalive = false) {
  const t = pzk.token()
  if (!t || !sporco) return
  // (alla chiusura non si aspetta: la richiesta deve partire adesso, o la pagina se ne va prima)
  if (!keepalive) await primo
  if (!sporco) return
  sporco = false
  const per = chi
  try {
    inCorso = fetch(API, { method: 'POST', keepalive, signal: keepalive ? undefined : AbortSignal.timeout(15_000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'zaino', token: t, zaino: Z, visto }) })
    const r = await inCorso, d = await r.json().catch(() => null)
    if (per !== chi) return // (nel frattempo si è cambiato conto: la risposta è dell'altro)
    if (d?.ok) dalServer(d.zaino)
    else if (r.status >= 500 || r.status === 429 || !r.status) riprova() // (il server non ce l'ha fatta: non si butta via)
  } catch { riprova() } finally { inCorso = null }
}
// non salvato (rete, 429, 5xx): sporco di nuovo, e un altro tentativo fra 15 secondi
function riprova() { sporco = true; clearTimeout(attesa); attesa = setTimeout(() => salva(), 15_000) }
/** Lo zaino che c'è sul server, unito a quello di qui. Vince quello di qui (gli oggetti, le attese…) se ha cambi ancora da
 *  mandare, o se è una copia mai sincronizzata andata più avanti (il pc del 26.10); se no quello del server. Se l'unione ha
 *  qualcosa che il server non ha, gliela si manda. */
function dalServer(s) {
  if (!s || !valido(s)) { if (Z.t && !s) salvaPoi(); return }
  const qui = sporco || (!visto && Z.xp > s.xp)
  visto = s.t
  const z = qui ? unisci(Z, s) : unisci(s, Z)
  if (!uguali(z, Z)) { Z = z; for (const f of ascolti) f(Z) }
  if (!uguali(Z, s)) { Z.t = Date.now(); salvaPoi() }
  copia()
}
/** Col conto: chiede al server lo zaino salvato e lo unisce a quello di qui. */
export async function sincronizza() {
  const t = pzk.token(), per = chi
  if (!t) return
  try {
    const d = await (await fetch(API, { method: 'POST', signal: AbortSignal.timeout(10_000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'zaino', token: t }) })).json()
    if (per === chi && d?.ok) dalServer(d.zaino) // (se nel frattempo il conto è cambiato, quello arrivato è dell'altro: non si mescola)
  } catch {}
}
if (pzk.token()) primo = sincronizza()
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(attesa); salva(true) } else sincronizza() })
addEventListener('pagehide', () => { clearTimeout(attesa); salva(true) })
// ogni 40 secondi, a pagina in vista (più spesso = meno oggetti persi fra due dispositivi aperti insieme); non mentre la
// pagina dorme sotto la cornice della musica (suono/cornice.js): ci pensa quella davanti, che ha il suo zaino
setInterval(() => { if (!document.hidden && !document.documentElement.classList.contains('in-cornice')) sincronizza() }, 40_000)
// la pagina di fuori si risveglia: quello fatto dentro il riquadro è già sul server
document.addEventListener('pzkko-altrove', (e) => { if (!e.detail) sincronizza() })
// il server avvisa (games/live.js) che lo zaino di questo conto è cambiato: se è più nuovo di quello visto, lo si prende
// (il canale si carica solo col conto, e non durante l'importazione: games/live.js apre subito la connessione)
let canale = false
function ascoltaCanale() {
  if (canale || !pzk.token()) return
  canale = true
  import('../games/live.js').then((l) => l.su('zaino', (a) => { if (a.t > visto && !(sporco && inCorso)) sincronizza() })).catch(() => { canale = false })
}
if (typeof requestIdleCallback === 'function') requestIdleCallback(ascoltaCanale, { timeout: 3000 }); else setTimeout(ascoltaCanale, 1500)
// si entra o si esce dal wallet: lo zaino cambia padrone
pzk.osserva(() => {
  const c = pzk.conto()?.ind ?? null
  if (c === chi) return
  chi = c
  Z = carica()
  for (const f of ascolti) f(Z)
  if (c) { primo = sincronizza(); ascoltaCanale() }
})

/** Lo zaino com'è (da non modificare a mano: usa le funzioni qui sotto). */
export const stato = () => Z
export const ascolta = (fn) => { ascolti.add(fn); return () => ascolti.delete(fn) }
export const xp = () => Z.xp
export const livello = () => livelloDi(Z.xp)
export const mestiere = () => Z.mestiere

/** Aggiunge punti esperienza (la mortadella li raddoppia). → il livello nuovo se è salito, se no 0 */
export function daiXp(n) {
  n *= 1 + bonus('xp')
  const prima = livello()
  Z.xp = Math.round(Z.xp + n)
  Z.stat.xp = (Z.stat.xp ?? 0) + n
  scrivi()
  const dopo = livello()
  return dopo > prima ? dopo : 0
}
/** Il moltiplicatore delle paghe: 2 % per livello sopra il primo, più i bonus «paga» (la lattina, la pzk-kola, il neon…). */
export const moltiplicatore = () => Math.round((1 + 0.02 * (livello() - 1) + bonus('paga')) * 100) / 100

/** La somma di un bonus (paga, xp, attese, vendita, morte, sfide): quelli dei consumabili ancora in effetto e delle cose da tenere
 *  che ci sono nello zaino (oggetti.js). Una frazione: 0.1 = +10 %, -0.5 = metà. */
export function bonus(k) {
  let s = 0
  for (const id of Object.keys(Z.effetti)) if (effetto(id)) s += PER_ID[id]?.bonus?.[k] ?? 0
  for (const id of Object.keys(Z.oggetti)) if (Z.oggetti[id] > 0 && PER_ID[id]?.tipo === 'tieni') s += PER_ID[id].bonus?.[k] ?? 0
  return s
}
/** I bonus di adesso, tutti insieme: { paga: 0.2, xp: 0.5, … } (solo quelli diversi da zero). */
export const bonusTutti = () => Object.fromEntries(['paga', 'xp', 'attese', 'vendita', 'morte', 'sfide'].map((k) => [k, bonus(k)]).filter(([, v]) => v))

// ── gli oggetti ──
export const ha = (id) => (Z.oggetti[id] ?? 0) > 0
export const quanti = (id) => Z.oggetti[id] ?? 0
export const oggetti = () => Object.entries(Z.oggetti).filter(([, n]) => n > 0)
export function aggiungi(id, n = 1) {
  Z.oggetti[id] = (Z.oggetti[id] ?? 0) + n
  if (['carpa-oro', 'drago', 'tesoro'].includes(id)) Z.rari = [...new Set([...(Z.rari ?? []), id])] // i leggendari fanno notizia (api/_giocatori.mjs)
  scrivi()
}
/** → false se non ce n'erano abbastanza */
export function togli(id, n = 1) {
  if ((Z.oggetti[id] ?? 0) < n) return false
  Z.oggetti[id] -= n
  if (Z.oggetti[id] <= 0) delete Z.oggetti[id]
  scrivi()
  return true
}
export function svuota() { Z.oggetti = {}; scrivi() }

// ── le attese (i cooldown) ──
/** Quanti ms mancano prima di poter rifare il comando (0 se si può). */
export const manca = (cmd) => Math.max(0, (Z.attese[cmd] ?? 0) - Date.now())
/** Segna l'attesa (il caffè la dimezza). */
export function aspetta(cmd, ms) {
  ms = Math.round(ms * Math.max(0.25, 1 + bonus('attese')))
  Z.attese[cmd] = Date.now() + ms
  for (const k of Object.keys(Z.attese)) if (Z.attese[k] < Date.now()) delete Z.attese[k]
  scrivi()
}
export const attese = () => Object.entries(Z.attese).filter(([, t]) => t > Date.now()).sort((a, b) => a[1] - b[1])
export function azzeraAttese() { Z.attese = {}; scrivi() }

// ── gli effetti (una cosa usata che dura un po') ──
export const effetto = (id) => (Z.effetti[id] ?? 0) > Date.now()
export const effetti = () => Object.entries(Z.effetti).filter(([, t]) => t > Date.now())
export function attiva(id, ms) { Z.effetti[id] = Math.max(Z.effetti[id] ?? 0, Date.now()) + ms; scrivi() }

// ── il cercapersone scassato (23.10): quando muori (senza cornetto) il cercapersone si rompe; quello rotto fa solo
// lavorare e ricomprare il nuovo («compra cercapersone»). Il segno sta nello zaino, quindi col conto vale ovunque ──
export const pagerRotto = () => !!Z.pagerRotto
export function rompiPager() { Z.pagerRotto = true; scrivi() }
export function aggiustaPager() { delete Z.pagerRotto; scrivi() }

// ── il mestiere ──
export function assumi(id) { Z.mestiere = id; Z.turni = 0; scrivi() }
export function licenzia() { Z.mestiere = null; Z.turni = 0; scrivi() }
export function turno() { Z.turni = (Z.turni ?? 0) + 1; Z.stat.turniLavoro = (Z.stat.turniLavoro ?? 0) + 1; scrivi() }

// ── le sfide giornaliere, le missioni e il quiz: lo stato sta qui, la logica in sfide.js, missioni.js, quiz.js ──
export const sfideStato = () => Z.sfide ?? null
export function salvaSfide(s) { Z.sfide = s; scrivi() }
export const missioniStato = () => Z.quest ?? { attive: {}, fatte: {} }
export function salvaMissioni(q) { Z.quest = q; scrivi() }
export const quizStato = () => Z.quiz ?? { g: '', pagati: 0, serie: 0, migliore: 0 }
export function salvaQuiz(q) { Z.quiz = q; scrivi() }
// la miniera di $pzk (miniera.js): i pezzi comprati, quelli montati e da quando matura. Solo id e numeri (pochi byte)
export const minieraStato = () => Z.miniera ?? { posseduti: {}, montati: {}, dal: 0, acc: 0 }
export function salvaMiniera(m) { Z.miniera = m; scrivi() }
// la cucina del Mincio (telefono/app/cucina.js): il giorno, le ricette pagate oggi, i piatti già dati oggi, i record
export const cucinaStato = () => Z.cucina ?? { g: '', pagate: 0, piatti: [], record: {} }
export function salvaCucina(c) { Z.cucina = c; scrivi() }
// le app installate dalla chat (26.10: il decifratore, «installa decifratore»): compaiono nel cercapersone
export const installata = (id) => !!Z.app?.[id]
export function installa(id) { (Z.app ??= {})[id] = Date.now(); scrivi() }
/** Segna un oggetto leggendario preso (il database ne fa una notizia). */
export function nota(id) { Z.rari = [...new Set([...(Z.rari ?? []), id])]; scrivi() }

// ── le serie dei premi (giornaliero, settimanale, mensile): { ultimo: ts, n: giorni di fila } ──
export const serie = (id) => Z.serie[id] ?? { ultimo: 0, n: 0 }
export function segnaSerie(id, n) { Z.serie[id] = { ultimo: Date.now(), n }; scrivi() }

// ── le statistiche ──
export const stat = (k) => Z.stat[k] ?? 0
export function conta(k, n = 1) { Z.stat[k] = (Z.stat[k] ?? 0) + n; scrivi() }

// ── i giochi grandi (26.10, per il profilo): games/pzk.js, a ogni regola, passa di qui. Per ogni gioco
// [mani, vinte, puntato, tornato, il colpo migliore]; e i vinti e i persi come quelli della chat (le sfide li contano) ──
export const GIOCHI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual']
export const giochi = () => Z.giochi ?? {}
export function giro(gioco, giocato, torna) {
  if (!GIOCHI.includes(gioco) || !(giocato > 0)) return
  const g = (Z.giochi ??= {})[gioco] ?? [0, 0, 0, 0, 0], netto = torna - giocato
  Z.giochi[gioco] = [g[0] + 1, g[1] + (netto > 0 ? 1 : 0), g[2] + giocato, g[3] + torna, Math.max(g[4], netto)]
  Z.stat.giri = (Z.stat.giri ?? 0) + 1
  if (netto > 0) Z.stat.vinti = (Z.stat.vinti ?? 0) + netto
  else if (netto < 0) Z.stat.persi = (Z.stat.persi ?? 0) - netto
  scrivi()
}

// ── il profilo (26.10, telefono/app/profilo.js): la faccia, il colore, la cornice e il motto, che gli altri vedono
// (api/_giocatori.mjs li mette nella riga pubblica). Solo nomi presi dalle liste dell'app e un motto corto ──
export const profilo = () => ({ av: null, col: 'verde', cor: 'nastro', mot: '', ...(Z.profilo ?? {}) })
export function salvaProfilo(p) { Z.profilo = { ...profilo(), ...p }; scrivi() }

// ── i tasti rapidi: le ultime scelte, la più recente per prima (le righe scritte, come «roulette 50 rosso») ──
export const MAX_RAPIDI = 8
export const rapidi = () => Z.rapidi ?? []
export function ricorda(riga) {
  riga = riga.trim().replace(/^\/+/, '').replace(/^pzk\s+/i, '').replace(/\s+/g, ' ')
  if (!riga) return
  Z.rapidi = [riga, ...(Z.rapidi ?? []).filter((r) => r !== riga)].slice(0, MAX_RAPIDI)
  scrivi()
}
export function scorda(riga) { Z.rapidi = (Z.rapidi ?? []).filter((r) => r !== riga); scrivi() }

/** Tutto da capo (per le prove: «reset»). */
export function azzera() { Z = vuoto(); scrivi() }

/** Lo zaino pesa troppo per il server? (non dovrebbe mai) */
export const pesante = () => JSON.stringify(Z).length > MAX_BYTE

