// La schedina di «virtual», in comune fra la finestra grande (virtual.js), l'app del cercapersone (telefono/app/virtual.js) e
// quella di pzk os (telefono/zero/os/virtual.js). Niente disegno: chi chiama decide cosa dire e come animare.
//
// DAL 31.10 LA SCHEDINA È DELLA BANCA (Alberto: «il browser non decide più niente»). Fino a qui stava in questo browser
// (localStorage pzkko-virtual, unita fra le schede con un timbro per fiche e pagata sotto un lucchetto del browser) e la
// pagava il browser, sul risultato che calcolava da sé. Ora:
// - il palinsesto (le partite, le quote della banca, e il risultato con la cronaca solo a partita iniziata) si chiede alla
//   banca: palinsesto(), che passa quello che arriva a partita.js (dallaBanca) e rimette l'orologio (orologio);
// - una giocata è pzk.fai('virtual.gioca'): la banca controlla che le giocate siano aperte (secondo la sua ora), prende i
//   $pzk e blocca la quota; «togli» è pzk.fai('virtual.togli');
// - la schedina che si vede è quella del conto (pzk.tavoloBanca('virtual'): { banco, schedina, ultime }): uguale da ogni
//   scheda e da ogni telefono, senza unioni né lucchetti;
// - le partite finite le paga la banca, una volta sola, alla prima azione di virtual dopo il fischio finale: qui si chiede
//   e si dice com'è andata (fine, riscuoti).
// Le fiche sul tavolo di pzk.js (pzk.punta / pzk.ritira) servono solo allo schermo, finché la risposta della banca arriva.
//
// Una giocata come la manda la banca: { indice, id, quota, puntata, fiches: [[valore, n]…], esito: null | 'vinta' | 'persa',
// pagata, casa, ospite (le sigle), risultato?, torna? }.

import * as pzk from '../pzk.js'
import { PER_PUNTATA, fase, aperte as giocateAperte, indiceAdesso, partita, dallaBanca, orologio } from './partita.js'

export const GIOCO = 'virtual'
const mezzi = (n) => Math.round(n * 2) / 2
export const fmtQuota = (q) => q.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** La vincita di una giocata: quella pagata, o quella che pagherebbe (a mezzi $pzk). */
export const vincitaDi = (b) => (b.pagata && Number.isFinite(b.torna) ? b.torna : mezzi(b.puntata * b.quota))

// ── lo stato: la schedina è quella della banca; qui solo la fiche scelta e i limiti che la banca ha detto ──
const tavolo = () => pzk.tavoloBanca(GIOCO)
export const S = {
  fiche: 5, // la fiche scelta (la stessa nelle tre interfacce)
  limiti: { min: 1, giocata: 2000, partita: 10000 }, // (giochi/virtual.mjs, LIMITI: li ridice ogni palinsesto)
  /** le giocate (le aperte e le ultime pagate), come le ha dette la banca */
  get schedina() { const s = tavolo()?.schedina; return Array.isArray(s) ? s.filter((b) => PER_PUNTATA.has(b?.id)) : [] },
  /** le giocate dell'ultima partita pagata (per «rifai») */
  get ultime() { const u = tavolo()?.ultime; return Array.isArray(u) && u.length ? u : null },
}
const ascolti = new Set()
/** fn() a ogni cambio della schedina o del palinsesto (anche da un'altra scheda o un altro telefono). → la funzione per smettere */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }
const avvisa = () => { for (const f of ascolti) { try { f() } catch (e) { console.error(e) } } }

/** Le giocate della partita `indice`. */
export const diPartita = (indice) => S.schedina.filter((b) => b.indice === indice)
/** I $pzk giocati (e non ancora pagati) sulla partita `indice`. */
export const sulTavolo = (indice) => diPartita(indice).filter((b) => !b.pagata).reduce((a, b) => a + b.puntata, 0)
/** Le giocate ancora da pagare, in tutto. */
export const aperte = () => S.schedina.filter((b) => !b.pagata).reduce((a, b) => a + b.puntata, 0)

// ── il palinsesto ────────────────────────────────────────────────────────────
let inVolo = null, chiesto = 0
/** Chiede alla banca le partite (e intanto la banca paga le finite). Una richiesta per volta: chi chiede insieme aspetta la stessa. */
export function palinsesto() {
  if (inVolo) return inVolo
  const mandata = Date.now()
  chiesto = mandata
  inVolo = pzk.fai('virtual.palinsesto').then((d) => {
    if (d?.ok && d.esito) {
      orologio(d.esito.ora, mandata, Date.now())
      for (const v of d.esito.partite ?? []) dallaBanca(v)
      if (d.esito.limiti) S.limiti = d.esito.limiti
    }
    avvisa()
    return d
  }).finally(() => { inVolo = null })
  return inVolo
}
/**
 * La partita `indice` con la cronaca: se la banca non l'ha ancora data (il fischio è appena suonato, o la rete è lenta) la
 * si richiede, al più ogni secondo e mezzo. Da chiamare a ogni fotogramma della partita: costa niente. → partita(indice)
 */
export function cronaca(indice) {
  const p = partita(indice)
  if (!p.cronaca && !inVolo && Date.now() - chiesto > 1500) palinsesto()
  return p
}

// ── le mosse ─────────────────────────────────────────────────────────────────
/**
 * Gioca `n` $pzk sulla quota `id` della partita `p` (la banca dice di no se le giocate sono chiuse).
 * → { ok: true, quota, puntata } oppure { ok: false, motivo: 'chiuse' | 'secco' (a secco e niente ricarica: pzk.perche() dice
 * perché) | 'ricarica' (stanno arrivando altri $pzk: si riprova) | 'nonbastano' | 'finiti' | 'banca' (errore: la sua voce) }.
 */
export async function punta(p, id, n) {
  if (!giocateAperte() || p.indice !== indiceAdesso()) return { ok: false, motivo: 'chiuse' }
  if (pzk.aSecco()) return pzk.ricarica() ? { ok: false, motivo: 'ricarica', ricaricato: true } : { ok: false, motivo: 'secco' }
  // la fiche va sul tavolo subito (lo schermo), i $pzk li prende la banca
  if (!pzk.punta(GIOCO, n)) return { ok: false, motivo: pzk.saldo() >= 1 ? 'nonbastano' : 'finiti' }
  const d = await pzk.fai('virtual.gioca', { indice: p.indice, id, n })
  pzk.ritira(GIOCO, n) // (la risposta ha il conto nuovo: la fiche ora è nel banco della banca, o è tornata)
  avvisa()
  if (!d?.ok) return { ok: false, motivo: 'banca', errore: d?.errore ?? 'la banca non risponde' }
  return { ok: true, quota: d.esito.quota, puntata: d.esito.puntata }
}
/** «togli»: l'ultima giocata posata sulla partita `indice` torna nel saldo. → { ok, v, id } o { ok: false, errore } */
export async function togli(indice) {
  const d = await pzk.fai('virtual.togli', { indice })
  avvisa()
  return d?.ok ? { ok: true, v: d.esito.v, id: d.esito.id } : { ok: false, errore: d?.errore ?? 'la banca non risponde' }
}

// ── i pagamenti (li fa la banca: qui si chiede e si racconta) ─────────────────
// com'è andata la partita `indice` secondo la schedina (null se non ci sono giocate pagate)
function conto(indice) {
  const mie = diPartita(indice).filter((b) => b.pagata)
  if (!mie.length) return null
  return { indice, casa: mie[0].casa, ospite: mie[0].ospite, risultato: mie[0].risultato, giocato: mie.reduce((a, b) => a + b.puntata, 0), torna: mie.reduce((a, b) => a + (b.esito === 'vinta' ? vincitaDi(b) : 0), 0) }
}
const dette = new Set() // le partite già raccontate in questa pagina (le interfacce aperte insieme non lo dicono due volte)
/**
 * La partita `indice` è finita: si chiede alla banca (che la paga, se non l'ha già fatto da un'altra parte) e si dice
 * com'è andata. → { indice, casa, ospite, risultato, giocato, torna } la prima volta in questa pagina, se no null. Se
 * per la banca la partita non è ancora finita (gli orologi), si riprova qualche volta.
 */
export async function fine(indice) {
  if (dette.has(indice) || !diPartita(indice).length) return null
  dette.add(indice)
  for (let i = 0; i < 6; i++) {
    await palinsesto()
    if (!diPartita(indice).some((b) => !b.pagata)) return conto(indice)
    await new Promise((ok) => setTimeout(ok, 1500))
  }
  dette.delete(indice) // (la banca non risponde: ci si riproverà)
  return null
}
/** Le partite finite e non ancora pagate (la finestra era chiusa): la banca le paga ora. → [{ indice, casa, ospite, risultato, giocato, torna }] */
export async function riscuoti() {
  const prima = new Set(S.schedina.filter((b) => !b.pagata && b.indice < indiceAdesso()).map((b) => b.indice))
  if (!prima.size) return []
  await palinsesto()
  const out = []
  for (const i of prima) { const c = !dette.has(i) && !diPartita(i).some((b) => !b.pagata) ? conto(i) : null; if (c) { dette.add(i); out.push(c) } }
  return out
}

// ── il pallino del cercapersone: le vinte non ancora viste (per conto, in questo browser: è solo schermo) ──
const chiaveViste = () => `pzkko-virtual-viste:${pzk.proprietario()}`
const visteFino = () => { try { return Number(localStorage.getItem(chiaveViste())) || 0 } catch { return 0 } }
/** Le giocate vinte che non si sono ancora viste. */
export const daVedere = () => { const v = visteFino(); return S.schedina.filter((b) => b.pagata && b.esito === 'vinta' && b.indice > v) }
/** 1 se ci sono giocate sulla partita di adesso e le giocate chiudono entro un minuto, se no 0. */
export function aperteInChiusura() {
  const f = fase()
  return f.fase === 'scommesse' && f.manca < 60_000 && diPartita(f.indice).some((b) => !b.pagata) ? 1 : 0
}
/** Segna viste le giocate pagate (il pallino si spegne). */
export function viste() {
  const max = Math.max(0, ...S.schedina.filter((b) => b.pagata).map((b) => b.indice))
  if (max > visteFino()) { try { localStorage.setItem(chiaveViste(), String(max)) } catch {} avvisa() }
}

// ── l'avvio: una volta per pagina ────────────────────────────────────────────
let avviato = false
/** Ascolta il conto (la schedina cambia con ogni risposta della banca, anche da un altro telefono) e fa pagare le partite
 *  finite mentre non c'era nessuno. Da chiamare da ogni interfaccia prima di usarla. */
export function avvia() {
  if (avviato) return
  avviato = true
  // (le schedine di prima del 31.10 stavano nel browser: non valgono più niente, si tolgono)
  try { for (const d of [localStorage, sessionStorage]) for (const k of Object.keys(d)) if (k === 'pzkko-virtual' || k.startsWith('pzkko-virtual:')) d.removeItem(k) } catch {}
  let prima = ''
  const guarda = () => {
    const t = JSON.stringify(tavolo() ?? null)
    if (t === prima) return
    prima = t
    avvisa()
    // giocate su partite finite e non pagate: si chiede alla banca, che le paga (al più ogni tre secondi)
    if (S.schedina.some((b) => !b.pagata && b.indice < indiceAdesso()) && !inVolo && Date.now() - chiesto > 3000) palinsesto()
  }
  pzk.osserva(guarda)
  pzk.alCambioConto(() => { prima = ''; guarda(); palinsesto() })
  guarda()
}
