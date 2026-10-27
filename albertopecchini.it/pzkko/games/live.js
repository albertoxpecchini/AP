// Il canale sempre aperto (26.10, Alberto: «fai un server sempre connesso e che registra tutto subito»): chi è entrato nel
// conto tiene aperta una richiesta a /api/live/ (api/live.mjs), e il server gli dice, appena succede, che lo zaino o il conto
// sono cambiati sul server (da un altro dispositivo). Qui si ascoltano gli avvisi e si chiedono i dati veri:
// - { k: 'conto', pzk, es, fn }: se sono arrivati soldi da fuori (un invio, un'operazione della banca: `es` cambia), pzk.sincronizza();
//   il saldo di per sé NO: il saldo lo decide il browser che gioca (api/wallet.mjs lo accetta com'è se plausibile), e
//   sincronizzare per una differenza di saldo farebbe sovrascrivere a chi sta fermo quello che ha appena giocato l'altro;
// - { k: 'zaino', t }: ascoltano gli zaini (chat/zaino.js, `su`), che si sincronizzano se `t` è nuovo.
// Vercel chiude una funzione dopo una cinquantina di secondi: il server lo dice ({ k: 'riconnetti' }) e qui si riapre subito;
// a rete persa o errori si riprova (5, 10, 20… 60 secondi). Aperto solo a pagina in vista, col conto, e non nella pagina che
// dorme sotto la cornice della musica (suono/cornice.js: quella davanti ha il suo canale). Lo carica la barra (ogni pagina).

import * as pzk from './pzk.js'

const API = '/api/live/' // con la barra finale (trailingSlash)
const ascoltatori = new Map()
/** Chiama `fn(avviso)` per ogni avviso di tipo `k` ('zaino', 'conto'). → come smettere */
export function su(k, fn) {
  if (!ascoltatori.has(k)) ascoltatori.set(k, new Set())
  ascoltatori.get(k).add(fn)
  return () => ascoltatori.get(k).delete(fn)
}

let ctrl = null, attesa = 0, errori = 0
const dorme = () => document.hidden || document.documentElement.classList.contains('in-cornice')
const dire = (a) => { for (const f of ascoltatori.get(a.k) ?? []) { try { f(a) } catch {} } }

async function collega() {
  clearTimeout(attesa)
  const token = pzk.token()
  if (ctrl || !token || dorme()) return
  const mio = ctrl = new AbortController() // (chi sta aperto è identificato da questo: una `ferma` seguita da `collega` non si pesta i piedi)
  let ok = false
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: mio.signal, cache: 'no-store' })
    if (r.status === 401) return ferma() // (il conto non è più valido: lo dirà il wallet alla prossima richiesta)
    if (!r.ok || !r.body) throw new Error('canale ' + r.status)
    const lettore = r.body.getReader(), testo = new TextDecoder()
    let resto = ''
    for (;;) {
      const { done, value } = await lettore.read()
      if (done) break
      resto += testo.decode(value, { stream: true })
      const righe = resto.split(String.fromCharCode(10))
      resto = righe.pop()
      for (const riga of righe) { if (!riga.trim()) continue; let a; try { a = JSON.parse(riga) } catch { continue } ok = true; errori = 0; if (a.k === 'ciao') ciao(a); else dire(a) }
    }
  } catch (e) { if (e?.name === 'AbortError') return }
  finally { if (ctrl === mio) ctrl = null }
  // (chiuso dal server o caduto: si riapre; se non è arrivato niente, con calma)
  errori = ok ? 0 : errori + 1
  attesa = setTimeout(collega, ok ? 300 : Math.min(60_000, 5_000 * 2 ** (errori - 1)))
}
function ferma() { clearTimeout(attesa); const c = ctrl; ctrl = null; try { c?.abort() } catch {} }
// all'apertura il server dice com'è adesso: se mentre si era scollegati (fra un giro e l'altro, o a pagina nascosta) è cambiato
// qualcosa, lo si scopre da qui, e gli ascoltatori fanno come per un avviso
function ciao(a) { dire({ k: 'zaino', t: a.t, ciao: true }); dire({ k: 'conto', pzk: a.pzk, es: a.es, fn: a.fn, ciao: true }) }

// il conto: solo se sono arrivati soldi da fuori che qui non si sanno ancora
su('conto', (a) => {
  const c = pzk.conto()
  if (!c || (a.es ?? 0) === (c.es ?? 0)) return
  pzk.sincronizza()
})

document.addEventListener('visibilitychange', () => { if (document.hidden) ferma(); else { errori = 0; collega() } })
document.addEventListener('pzkko-altrove', (e) => { if (e.detail) ferma(); else { errori = 0; collega() } })
addEventListener('pagehide', ferma)
// (si entra o si esce dal conto: osserva scatta a ogni cambio di saldo, quindi si guarda solo se il token è un altro)
let tokenDi = pzk.token()
pzk.osserva(() => { const t = pzk.token(); if (t === tokenDi) return; tokenDi = t; ferma(); errori = 0; if (t) collega() })
collega()
