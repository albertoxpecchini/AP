// La schedina di «virtual», in comune fra la finestra grande (virtual.js) e l'app del cercapersone (telefono/app/virtual.js):
// le scommesse di questo browser (localStorage, pzkko-virtual), i $pzk sul tavolo di ../pzk.js, il pagamento al fischio
// finale. Una sola copia per pagina: le due interfacce leggono e scrivono qui e si avvisano a vicenda (ascolta). Niente
// disegno: chi chiama decide cosa dire e come animare.
//
// Una puntata: { indice, id, quota, puntata, fiches: [[valore, timbro]…], esito: null | 'vinta' | 'persa', pagata, casa,
// ospite, risultato? }. Due schede possono scrivere nello stesso istante: invece di sovrascriversi si uniscono (unisci):
// ogni fiche ha un timbro suo, una puntata è l'unione delle fiches viste dalle due parti meno quelle tolte («tolte» tiene i
// timbri delle fiches ritirate con «togli», così non ricompaiono dalla copia vecchia dell'altra scheda); «pagata» vince su
// «da pagare».

import * as pzk from '../pzk.js'
import { PER_PUNTATA, fase, partita, vince, scriviRisultato } from './partita.js'

export const GIOCO = 'virtual'
export const CHIAVE = 'pzkko-virtual'
export const fmtQuota = (q) => q.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
/** La vincita di una puntata (a mezzi $pzk). */
export const vincitaDi = (b) => Math.round(b.puntata * b.quota * 2) / 2

// ── lo stato ─────────────────────────────────────────────────────────────────
export const S = {
  schedina: [], // le ultime (quelle della partita di adesso e le passate, al più 40)
  fiche: 5, // la fiche scelta (la stessa nelle due interfacce)
  ultime: null, // le puntate dell'ultima partita (per «rifai»)
  tolte: [], // i timbri delle fiches ritirate con «togli» (vedi unisci)
}
const ascolti = new Set()
/** fn() a ogni cambio della schedina (anche da un'altra scheda). Restituisce la funzione per smettere. */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }
const avvisa = () => { for (const f of ascolti) f() }

// le fiches di una puntata nell'ordine in cui sono state posate (le puntate salvate prima non lo sapevano: si ricostruiscono,
// con timbri uguali in tutte le schede così l'unione non le raddoppia)
export function fichesDi(b) {
  if (Array.isArray(b.fiches) && b.fiches.length && b.fiches.every((x) => Array.isArray(x))) return b.fiches
  return pzk.inFiches(b.puntata).map((v, i) => [v, b.indice * 1e-3 + i * 1e-6])
}
function leggi() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    return {
      schedina: Array.isArray(s?.schedina) ? s.schedina.filter((b) => Number.isInteger(b.indice) && PER_PUNTATA.has(b.id) && b.puntata > 0 && b.quota >= 1) : [],
      ultime: Array.isArray(s?.ultime) ? s.ultime : null,
      tolte: Array.isArray(s?.tolte) ? s.tolte : [],
    }
  } catch { return { schedina: [], ultime: null, tolte: [] } }
}
export function unisci(a, b) {
  const tolte = [...new Set([...a.tolte, ...b.tolte])].slice(-200)
  const via = new Set(tolte)
  const per = new Map()
  for (const x of [...a.schedina, ...b.schedina]) {
    const k = `${x.indice}|${x.id}|${x.pagata ? 'p' : 'a'}`
    const g = per.get(k)
    if (!g) { per.set(k, { ...x, fiches: fichesDi(x) }); continue }
    if (x.vista) g.vista = true // (vista da una parte: vista)
    const timbri = new Set(g.fiches.map((f) => f[1]))
    g.fiches = [...g.fiches, ...fichesDi(x).filter((f) => !timbri.has(f[1]))].sort((m, n) => m[1] - n[1])
  }
  // una puntata pagata in una scheda e ancora aperta nell'altra: conta quella pagata
  for (const [k, x] of per) if (!x.pagata && per.has(k.slice(0, -1) + 'p')) per.delete(k)
  const schedina = [...per.values()]
    .map((x) => { const f = x.fiches.filter((c) => !via.has(c[1])); return { ...x, fiches: f, puntata: f.reduce((t, c) => t + c[0], 0) } })
    .filter((x) => x.puntata > 0)
    .sort((m, n) => m.indice - n.indice || (m.fiches[0][1] - n.fiches[0][1]))
    .slice(-40)
  return { schedina, ultime: b.ultime ?? a.ultime, tolte }
}
/** Rilegge la schedina del browser e la unisce a quella di qui (un'altra scheda può aver scritto). */
export function carica() {
  const u = unisci(leggi(), { schedina: S.schedina, ultime: S.ultime, tolte: S.tolte ?? [] })
  S.schedina = u.schedina; S.ultime = u.ultime; S.tolte = u.tolte
  return u
}
function salva() {
  const u = carica()
  try { localStorage.setItem(CHIAVE, JSON.stringify(u)) } catch {}
  avvisa()
}
/** Le puntate della partita `indice`. */
export const diPartita = (indice) => S.schedina.filter((b) => b.indice === indice)
/** I $pzk puntati sulla partita `indice`. */
export const sulTavolo = (indice) => diPartita(indice).reduce((a, b) => a + b.puntata, 0)
/** Le puntate ancora da pagare, in tutto. */
export const aperte = () => S.schedina.filter((b) => !b.pagata).reduce((a, b) => a + b.puntata, 0)

/** Fa in modo che sul tavolo di pzk.js ci siano almeno `quanto` $pzk (quelli delle puntate aperte), prendendoli dal saldo. */
export function rimettiSulTavolo(quanto) {
  const manca = Math.round((quanto - pzk.sulTavolo(GIOCO)) * 2) / 2
  if (manca <= 0) return
  if (!pzk.punta(GIOCO, manca)) pzk.punta(GIOCO, Math.min(manca, pzk.saldo()))
}
/** Il tavolo deve valere quanto le puntate ancora aperte: se un'altra scheda le ha pagate (o tolte), il di più torna nel saldo. */
export function riconcilia() {
  const ap = aperte()
  const troppo = Math.round((pzk.sulTavolo(GIOCO) - ap) * 2) / 2
  if (troppo > 0) pzk.ritira(GIOCO, troppo)
  else if (troppo < 0) rimettiSulTavolo(ap)
}

// ── le mosse ─────────────────────────────────────────────────────────────────
/**
 * Punta la fiche `v` sulla quota `id` della partita `p` (che dev'essere in fase di scommesse: lo controlla chi chiama).
 * → { ok: true, ricaricato } oppure { ok: false, motivo: 'secco' (a secco e niente ricarica: pzk.perche() dice perché) |
 * 'nonbastano' | 'finiti' }.
 */
export function punta(p, id, v) {
  let ricaricato = false
  if (pzk.aSecco()) {
    if (!pzk.ricarica()) return { ok: false, motivo: 'secco' }
    ricaricato = true
  }
  if (!pzk.punta(GIOCO, v)) return { ok: false, motivo: pzk.saldo() >= 1 ? 'nonbastano' : 'finiti', ricaricato }
  const q = p.quote[id]
  // (un'altra scheda può aver appena puntato: si rilegge la schedina del browser prima di scriverla, così non si perde)
  carica()
  // la stessa puntata sulla stessa quota si somma
  const gia = S.schedina.find((b) => b.indice === p.indice && b.id === id && !b.pagata)
  // ogni fiche come [valore, quando è stata posata]: «togli» toglie l'ultima posata, su qualunque quota sia
  const timbro = Date.now() + Math.random() / 2 // (unico anche fra due schede nello stesso millisecondo)
  if (gia) { gia.fiches = [...fichesDi(gia), [v, timbro]]; gia.puntata += v }
  else S.schedina.push({ indice: p.indice, id, quota: q, puntata: v, fiches: [[v, timbro]], esito: null, pagata: false, casa: p.casa.sigla, ospite: p.ospite.sigla })
  S.schedina = S.schedina.slice(-40)
  salva()
  return { ok: true, ricaricato, quota: q }
}
/** «togli»: l'ultima fiche posata sulla partita `indice` torna nel saldo. → { v, id } o null se non c'è niente. */
export function togli(indice) {
  carica()
  const mie = diPartita(indice).filter((b) => !b.pagata)
  // la quota su cui è stata posata l'ultima fiche, e proprio quella fiche
  const quando = (x) => fichesDi(x).at(-1)?.[1] ?? 0
  const b = mie.reduce((a, x) => (a && quando(a) > quando(x) ? a : x), null)
  if (!b) return null
  const f = fichesDi(b)
  const [v, timbro] = f.at(-1)
  b.fiches = f.slice(0, -1)
  b.puntata -= v
  S.tolte = [...(S.tolte ?? []), timbro].slice(-200)
  if (b.puntata <= 0) S.schedina.splice(S.schedina.indexOf(b), 1)
  pzk.ritira(GIOCO, v)
  salva()
  return { v, id: b.id }
}

// ── il pagamento ─────────────────────────────────────────────────────────────
/**
 * Paga le puntate della partita `indice` sul suo risultato ufficiale (tavolino compreso).
 * → { giocato, torna, risultato, p } oppure null se non c'era niente da pagare.
 */
export function paga(indice) {
  // (un'altra scheda può aver già pagato: si rilegge quello che c'è scritto nel browser)
  carica()
  const mie = S.schedina.filter((b) => b.indice === indice && !b.pagata)
  if (!mie.length) { riconcilia(); return null }
  const p = partita(indice), r = p.risultato
  let giocato = 0, torna = 0
  for (const b of mie) {
    b.esito = vince(b.id, r) ? 'vinta' : 'persa'
    b.pagata = true
    b.risultato = scriviRisultato(r)
    giocato += b.puntata
    if (b.esito === 'vinta') torna += vincitaDi(b)
  }
  // il tavolo di pzk.js potrebbe non avere queste puntate: ricaricando la pagina pzk.js rimette nel saldo quello che era
  // sui tavoli (vedi ../pzk.js), e all'avvio rimettiamo sul tavolo le puntate ancora aperte (avvia); se non bastavano i $pzk
  // (spesi altrove) la puntata si regola per quanto c'è davvero
  rimettiSulTavolo(giocato)
  const g = Math.min(giocato, pzk.sulTavolo(GIOCO))
  pzk.regola(GIOCO, g, giocato ? (torna * g) / giocato : 0)
  // le puntate di questa partita restano come «ultime», per «rifai»
  S.ultime = mie.map((b) => ({ id: b.id, puntata: b.puntata }))
  salva()
  return { giocato, torna, risultato: r, p }
}
/** Le scommesse delle partite già finite che non sono state pagate (la finestra era chiusa): si pagano ora. → quante partite */
export function pagaScadute() {
  const adesso = fase().indice
  const indici = new Set(S.schedina.filter((b) => !b.pagata && b.indice < adesso).map((b) => b.indice))
  for (const i of indici) paga(i)
  return indici.size
}
/** Il badge per il cercapersone: le puntate pagate che non si sono ancora viste (vinte), più quelle aperte. */
export const daVedere = () => S.schedina.filter((b) => b.pagata && b.esito === 'vinta' && !b.vista)
/** Per il badge: 1 se ci sono scommesse aperte sulla partita di adesso e le scommesse chiudono entro un minuto, se no 0. */
export function aperteInChiusura() {
  const f = fase()
  return f.fase === 'scommesse' && f.manca < 60_000 && diPartita(f.indice).some((b) => !b.pagata) ? 1 : 0
}
/** Segna viste le puntate pagate (il badge si spegne). */
export function viste() {
  let cambiato = false
  for (const b of S.schedina) if (b.pagata && !b.vista) { b.vista = true; cambiato = true }
  if (cambiato) salva()
}

// ── l'avvio: una volta per pagina ────────────────────────────────────────────
let avviato = false
/** Legge la schedina, rimette sul tavolo le puntate aperte (una ricarica le aveva rimesse nel saldo), paga le partite finite
 *  mentre non c'era nessuno, e ascolta le altre schede. Da chiamare da ogni interfaccia prima di usarla. */
export function avvia() {
  if (avviato) return
  avviato = true
  carica()
  rimettiSulTavolo(aperte())
  pagaScadute()
  // un'altra scheda ha puntato o pagato: la schedina si rilegge
  addEventListener('storage', (e) => {
    if (e.key !== CHIAVE) return
    const prima = e.newValue
    const u = carica()
    if (JSON.stringify(u) !== prima) try { localStorage.setItem(CHIAVE, JSON.stringify(u)) } catch {}
    riconcilia()
    avvisa()
  })
}
