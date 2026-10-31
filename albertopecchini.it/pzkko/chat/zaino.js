// Lo zaino di chi parla col bot (chat.js) e usa le app del cercapersone: i punti esperienza e il livello, il mestiere, gli
// oggetti, le attese dei comandi, gli effetti in corso, le serie dei premi, le statistiche, le parti delle app (sfide,
// missioni, quiz, miniera, cucina, profilo). I $pzk non stanno qui: sono quelli di games/pzk.js.
//
// DAL 31.10 LO ZAINO STA SULLA BANCA (Alberto: «decifra un wallet devi farlo se hai un wallet … browser modificato non può
// accedere»): sta dentro il conto, sul pc di Alberto, e lo cambiano solo le azioni della banca (pzk.fai: «chat.pesca»,
// «mercato.compra», «quiz.rispondi»…). Questo file ne tiene la COPIA che la banca manda con ogni risposta, per mostrarla:
// qui non si aggiunge, non si toglie e non si salva niente. Le attese e gli effetti si misurano con l'ora di qui solo per
// lo schermo (il conto alla rovescia): quella che conta è l'ora della banca.
// Restano qui, nel browser, solo i tasti rapidi della chat (le ultime righe scritte: localStorage).

import * as pzk from '../games/pzk.js'
import { PER_ID } from './testi.js'

const CHIAVE_RAPIDI = 'pzkko-chat-rapidi'

export const vuoto = () => ({ v: 1, t: 0, xp: 0, mestiere: null, turni: 0, oggetti: {}, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] })
/** Il livello dai punti: 1 all'inizio, 2 a 60 xp, 3 a 240, 5 a 960, 10 a 4.860. */
export const livelloDi = (xp) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60))
/** Gli xp che servono per il livello l. */
export const xpPer = (l) => 60 * (l - 1) ** 2

const VUOTO = vuoto()
const Z = () => pzk.zainoBanca() ?? VUOTO
const ascolti = new Set()
let ultimo = null
pzk.osserva(() => { const z = Z(); if (z === ultimo) return; ultimo = z; for (const f of ascolti) { try { f(z) } catch (e) { console.error(e) } } })

/** Lo zaino com'è (la copia della banca: da non modificare). */
export const stato = () => Z()
export const ascolta = (fn) => { ascolti.add(fn); return () => ascolti.delete(fn) }
/** Chiede alla banca lo zaino di adesso (arriva col conto). */
export const sincronizza = () => pzk.sincronizza()
/** La banca ha già risposto almeno una volta? → Promise<boolean> */
export const allineato = () => (pzk.zainoBanca() ? Promise.resolve(true) : pzk.sincronizza().then(() => !!pzk.zainoBanca()))
export const xp = () => Z().xp
export const livello = () => livelloDi(Z().xp)
export const mestiere = () => Z().mestiere
export const turni = () => Z().turni ?? 0
/** Il moltiplicatore delle paghe: 2 % per livello sopra il primo, più i bonus «paga» (la lattina, la pzk-kola, il neon…). */
export const moltiplicatore = () => Math.round((1 + 0.02 * (livello() - 1) + bonus('paga')) * 100) / 100

/** La somma di un bonus (paga, xp, attese, vendita, morte, sfide): consumabili in effetto e cose da tenere nello zaino. */
export function bonus(k) {
  const z = Z()
  let s = 0
  for (const id of Object.keys(z.effetti ?? {})) if (effetto(id)) s += PER_ID[id]?.bonus?.[k] ?? 0
  for (const id of Object.keys(z.oggetti ?? {})) if (z.oggetti[id] > 0 && PER_ID[id]?.tipo === 'tieni') s += PER_ID[id].bonus?.[k] ?? 0
  return s
}
/** I bonus di adesso, tutti insieme: { paga: 0.2, xp: 0.5, … } (solo quelli diversi da zero). */
export const bonusTutti = () => Object.fromEntries(['paga', 'xp', 'attese', 'vendita', 'morte', 'sfide'].map((k) => [k, bonus(k)]).filter(([, v]) => v))

// ── gli oggetti ──
// in locale (localhost), il cercapersone zero (telefono/zero/) si prova senza comprarlo; ?vecchio rimette quello nero
const PROVA_ZERO = /^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)$/.test(location.hostname) && !new URLSearchParams(location.search).has('vecchio')
export const ha = (id) => (Z().oggetti?.[id] ?? 0) > 0 || (id === 'zero' && PROVA_ZERO)
export const quanti = (id) => Z().oggetti?.[id] ?? 0
export const oggetti = () => Object.entries(Z().oggetti ?? {}).filter(([, n]) => n > 0)

// ── le attese (i cooldown) e gli effetti: si leggono ──
/** Quanti ms mancano prima di poter rifare il comando (0 se si può). */
export const manca = (cmd) => Math.max(0, (Z().attese?.[cmd] ?? 0) - Date.now())
export const attese = () => Object.entries(Z().attese ?? {}).filter(([, t]) => t > Date.now()).sort((a, b) => a[1] - b[1])
export const effetto = (id) => (Z().effetti?.[id] ?? 0) > Date.now()
export const effetti = () => Object.entries(Z().effetti ?? {}).filter(([, t]) => t > Date.now())

// ── il cercapersone scassato: quando muori (senza cornetto) si rompe; si ricompra («compra cercapersone») ──
export const pagerRotto = () => !!Z().pagerRotto

// ── le parti delle app (la logica sta sulla banca) ──
export const sfideStato = () => Z().sfide ?? null
export const missioniStato = () => Z().quest ?? { attive: {}, fatte: {} }
export const quizStato = () => Z().quiz ?? { g: '', pagati: 0, serie: 0, migliore: 0 }
export const minieraStato = () => Z().miniera ?? { posseduti: {}, montati: {}, dal: 0, acc: 0 }
export const cucinaStato = () => Z().cucina ?? { g: '', pagate: 0, piatti: [], record: {} }
// le app installate: Z.app[id] è il momento dell'ultima decisione (positivo installata, negativo tolta)
export const installata = (id) => (Number(Z().app?.[id]) || 0) > 0
/** Da quando è installata (0: non lo è). */
export const installataIl = (id) => Math.max(0, Number(Z().app?.[id]) || 0)
/** Per quest'app si è già deciso qualcosa (installata o tolta)? */
export const decisa = (id) => !!Number(Z().app?.[id])
/** Il momento delle app regalate (il 29.10.2026, mezzanotte di Mantova). */
export const REGALO = Date.UTC(2026, 9, 28, 23)

// ── le serie dei premi (giornaliero, settimanale, mensile): { ultimo: ts, n: giorni di fila } ──
export const serie = (id) => Z().serie?.[id] ?? { ultimo: 0, n: 0 }

// ── le statistiche ──
export const stat = (k) => Z().stat?.[k] ?? 0
export const GIOCHI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual']
export const giochi = () => Z().giochi ?? {}

// ── il profilo: la faccia, il colore, la cornice e il motto (si cambiano con l'azione «profilo.salva») ──
export const profilo = () => ({ av: null, col: 'verde', cor: 'nastro', mot: '', ...(Z().profilo ?? {}) })

// ── i tasti rapidi: le ultime righe scritte nella chat, la più recente per prima (solo in questo browser) ──
export const MAX_RAPIDI = 8
const leggiRapidi = () => { try { const r = JSON.parse(localStorage.getItem(CHIAVE_RAPIDI) || '[]'); return Array.isArray(r) ? r.filter((x) => typeof x === 'string') : [] } catch { return [] } }
const scriviRapidi = (r) => { try { localStorage.setItem(CHIAVE_RAPIDI, JSON.stringify(r)) } catch {} for (const f of ascolti) f(Z()) }
export const rapidi = () => leggiRapidi()
export function ricorda(riga) {
  riga = riga.trim().replace(/^\/+/, '').replace(/^pzk\s+/i, '').replace(/\s+/g, ' ')
  if (riga) scriviRapidi([riga, ...leggiRapidi().filter((r) => r !== riga)].slice(0, MAX_RAPIDI))
}
export function scorda(riga) { scriviRapidi(leggiRapidi().filter((r) => r !== riga)) }
