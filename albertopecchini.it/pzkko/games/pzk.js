// I $pzk di pzkko.it: soldi finti, gli stessi per tutti i giochi (roulette,
// blackjack e quelli che verranno). Si tengono nel browser (localStorage), non
// valgono niente e non si comprano: a zero, il gioco ne dà altri INIZIALE.
//
// Ogni gioco sposta i $pzk dal saldo al suo tavolo quando punta (punta), li
// riprende se toglie la fiche (ritira) e, a giro finito, chiude il conto
// (regola): quello che era sul tavolo è giocato, torna quello che si è vinto.
// Nel browser si salva il saldo più quello che c'è sui tavoli: se la pagina si
// chiude a metà giro, alla volta dopo le puntate tornano nel saldo.
// I conti vanno a mezzi $pzk (il blackjack paga 3 a 2: 5 → 7,5).

const CHIAVE = 'pzkko-pzk'
const VECCHIA = 'pzkko-roulette' // prima del 17.10 il saldo stava con la roulette
export const INIZIALE = 1000

const mezzi = (n) => Math.round(n * 2) / 2
const tavoli = new Map() // gioco → $pzk sul suo tavolo, in questa pagina
const ascolti = new Set()
let liberi = leggi()

function leggi() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && Number.isFinite(s.saldo) && s.saldo >= 0) return mezzi(s.saldo)
    const v = JSON.parse(localStorage.getItem(VECCHIA) || 'null')
    if (v && Number.isFinite(v.saldo) && v.saldo >= 0) {
      localStorage.setItem(CHIAVE, JSON.stringify({ saldo: mezzi(v.saldo) })) // da qui in poi vale la chiave nuova
      return mezzi(v.saldo)
    }
  } catch {}
  return INIZIALE
}
const sulTavoli = () => [...tavoli.values()].reduce((a, b) => a + b, 0)
function scrivi() {
  try { localStorage.setItem(CHIAVE, JSON.stringify({ saldo: liberi + sulTavoli() })) } catch {}
  for (const f of ascolti) f(liberi)
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

/** A secco (meno di 1 $pzk libero e niente sui tavoli): altri INIZIALE. */
export function ricarica() {
  if (liberi >= 1 || sulTavoli() > 0) return false
  liberi = INIZIALE
  scrivi()
  return true
}
export const aSecco = () => liberi < 1 && sulTavoli() === 0

/** fn(saldo) a ogni cambio, anche quando il saldo cambia in un'altra scheda. Restituisce la funzione per smettere. */
export function ascolta(fn) { ascolti.add(fn); return () => ascolti.delete(fn) }

addEventListener('storage', (e) => {
  if (e.key !== CHIAVE) return
  try {
    const s = JSON.parse(e.newValue || 'null')
    if (!s || !Number.isFinite(s.saldo)) return
    liberi = Math.max(0, mezzi(s.saldo - sulTavoli()))
    for (const f of ascolti) f(liberi)
  } catch {}
})

/** Le fiches (le stesse foto in tutti i giochi: art/fiches/f<valore>.webp) e un importo in fiches, dalle più grandi. */
export const FICHES = [1, 5, 25, 100, 500]
export function inFiches(importo) {
  const out = []
  for (const f of [...FICHES].reverse()) while (importo >= f) { out.push(f); importo -= f }
  return out
}

/** I $pzk come si scrivono: 1.250 o 7,5. */
export const fmt = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 })

// ── il regalo per chi mi segue su Instagram ──────────────────────────────────
// 1.000 $pzk, una volta sola per browser. Un sito non può sapere chi segue chi
// (Instagram non lo dice), quindi ci si fida: il link apre il profilo e,
// tornati qui, i $pzk arrivano.
export const INSTAGRAM = 'https://www.instagram.com/albertoxpecchini/'
export const PREMIO_IG = 1000
const CHIAVE_IG = 'pzkko-pzk-ig'
export const premioPreso = () => { try { return !!localStorage.getItem(CHIAVE_IG) } catch { return false } }
export function premioInstagram() {
  if (premioPreso()) return false
  try { localStorage.setItem(CHIAVE_IG, new Date().toISOString()) } catch {}
  liberi += PREMIO_IG
  scrivi()
  return true
}

/** Il link «seguimi su instagram: +1.000 $pzk» per i giochi; `fatto()` quando arrivano i $pzk. Sparisce dopo il regalo. */
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
  aggiorna()
  return a
}
