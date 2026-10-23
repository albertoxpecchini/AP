// Lo zaino di chi parla col bot (chat.js): i punti esperienza e il livello, il mestiere, gli oggetti, le attese dei
// comandi, gli effetti in corso (il caffè, la lattina…), la serie dei premi giornalieri e le statistiche. I $pzk NON
// stanno qui: sono quelli di games/pzk.js, gli stessi dei giochi e del wallet.
//
// Come il saldo: nella SESSIONE (chi non è entrato nel wallet) lo zaino sta in sessionStorage e sparisce con la scheda;
// col CONTO sta sul server (api/wallet.mjs, azione «zaino», un file a parte su Blob: pzkko/chat.json) e in localStorage
// come copia, si salva un po' dopo ogni cambio e subito quando la pagina si nasconde. Vince chi ha il `t` più recente.

import * as pzk from '../games/pzk.js'
import { PER_ID } from './testi.js'

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

let Z = carica()
let chi = pzk.conto()?.ind ?? null // per chi è lo zaino in memoria
const ascolti = new Set()
let attesa = 0, sporco = false, inCorso = null

function carica() {
  const c = pzk.conto()
  if (c) { const z = leggiJSON(localStorage, CHIAVE_CONTO); return z && z.ind === c.ind && valido(z.zaino) ? z.zaino : vuoto() }
  const z = leggiJSON(sessionStorage, CHIAVE_SESSIONE)
  return valido(z) ? z : vuoto()
}
function scrivi() {
  Z.t = Date.now()
  const c = pzk.conto()
  if (c) { scriviJSON(localStorage, CHIAVE_CONTO, { ind: c.ind, zaino: Z }); salvaPoi() } else scriviJSON(sessionStorage, CHIAVE_SESSIONE, Z)
  for (const f of ascolti) f(Z)
}
function salvaPoi() { sporco = true; clearTimeout(attesa); attesa = setTimeout(() => salva(), 1500) }
async function salva(keepalive = false) {
  const t = pzk.token()
  if (!t || !sporco) return
  sporco = false
  try {
    inCorso = fetch(API, { method: 'POST', keepalive, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'zaino', token: t, zaino: Z }) })
    const d = await (await inCorso).json().catch(() => null)
    if (d?.zaino && valido(d.zaino) && d.zaino.t > Z.t) { Z = d.zaino; scriviJSON(localStorage, CHIAVE_CONTO, { ind: pzk.conto()?.ind, zaino: Z }); for (const f of ascolti) f(Z) }
  } catch {} finally { inCorso = null }
}
/** Col conto: chiede al server lo zaino salvato; se è più recente di quello di qui, vince. */
export async function sincronizza() {
  const t = pzk.token()
  if (!t) return
  try {
    const d = await (await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ a: 'zaino', token: t }) })).json()
    if (d?.zaino && valido(d.zaino) && d.zaino.t > Z.t) { Z = d.zaino; scriviJSON(localStorage, CHIAVE_CONTO, { ind: pzk.conto()?.ind, zaino: Z }); for (const f of ascolti) f(Z) }
    else if (d?.ok && !d.zaino && Z.t) salvaPoi()
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(attesa); salva(true) } })
addEventListener('pagehide', () => { clearTimeout(attesa); salva(true) })
// si entra o si esce dal wallet: lo zaino cambia padrone
pzk.osserva(() => {
  const c = pzk.conto()?.ind ?? null
  if (c === chi) return
  chi = c
  Z = carica()
  for (const f of ascolti) f(Z)
  if (c) sincronizza()
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
/** Segna un oggetto leggendario preso (il database ne fa una notizia). */
export function nota(id) { Z.rari = [...new Set([...(Z.rari ?? []), id])]; scrivi() }

// ── le serie dei premi (giornaliero, settimanale, mensile): { ultimo: ts, n: giorni di fila } ──
export const serie = (id) => Z.serie[id] ?? { ultimo: 0, n: 0 }
export function segnaSerie(id, n) { Z.serie[id] = { ultimo: Date.now(), n }; scrivi() }

// ── le statistiche ──
export const stat = (k) => Z.stat[k] ?? 0
export function conta(k, n = 1) { Z.stat[k] = (Z.stat[k] ?? 0) + n; scrivi() }

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

if (pzk.token()) setTimeout(sincronizza, 600)
