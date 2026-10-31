// Il canale sempre aperto (26.10, Alberto: «fai un server sempre connesso e che registra tutto subito»): chi è entrato nel
// conto tiene aperta una connessione, e gli si dice appena succede che il conto è cambiato sulla banca (da un altro
// dispositivo, da un'altra scheda, da un invio ricevuto). L'avviso { k: 'conto', pzk, eur, agg }: games/pzk.js (dalCanale)
// prende subito il saldo se è più nuovo di quello che ha (agg), poi si chiede il resto del conto (lo zaino, le mosse, i tavoli)
// con pzk.sincronizza(), fra 300 ms (più avvisi di fila, una richiesta sola). Chi ascolta lo zaino lo sa da `su('conto')`.
//
// IL CANALE DIRETTO (29.10 notte, Alberto: «se entro con 2 telefoni e stesso account assieme devo vedere le cose
// sincronizzati al millisecondo»): la connessione va dritta al server sul pc di Alberto (C:\pzkko-server, /v1/live,
// Server-Sent Events), che avvisa nell'istante in cui scrive i conti. Per aprirla serve un biglietto del conto
// (pzk.biglietto(), dieci minuti per aprire); il server la chiude dopo mezz'ora e qui si riapre con un biglietto nuovo.
// Dal 31.10 è l'unico: la banca sta sullo stesso pc, quindi quando il canale diretto non c'è non c'è nemmeno la banca, e
// il canale di prima su Vercel (che guardava i file ogni 3 secondi) non avrebbe niente da dire. Si riprova, sempre più piano.
// Aperto solo a pagina in vista, col conto, e non nella pagina che dorme sotto la cornice della musica (suono/cornice.js:
// quella davanti ha il suo canale). Lo carica la barra (ogni pagina).

import * as pzk from './pzk.js'

const ascoltatori = new Map()
/** Chiama `fn(avviso)` per ogni avviso di tipo `k` ('conto'). → come smettere */
export function su(k, fn) {
  if (!ascoltatori.has(k)) ascoltatori.set(k, new Set())
  ascoltatori.get(k).add(fn)
  return () => ascoltatori.get(k).delete(fn)
}
const dire = (a) => { for (const f of ascoltatori.get(a.k) ?? []) { try { f(a) } catch {} } }
const dorme = () => document.hidden || document.documentElement.classList.contains('in-cornice')

// il conto: subito il saldo (dalCanale), poi il resto
let resto = 0
function conto(a) {
  if (pzk.dalCanale(a)) { clearTimeout(resto); resto = setTimeout(() => pzk.sincronizza(), 300) }
  dire({ ...a, k: 'conto' })
}

let diretto = null, attesa = 0, errori = 0
/** Apre il canale diretto (se non va, si riprova: 1 s, 2, 4… fino a un minuto). */
async function collega() {
  clearTimeout(attesa)
  if (diretto || !pzk.token() || dorme()) return
  const b = await pzk.biglietto()
  if (!b) { errori++; attesa = setTimeout(collega, Math.min(60_000, 1000 * 2 ** errori)); return }
  if (diretto || dorme() || !pzk.token()) return
  const es = (diretto = new EventSource(`${b.url}/v1/live?b=${encodeURIComponent(b.biglietto)}`))
  let aperto = false
  es.onopen = () => { aperto = true; errori = 0; pzk.sincronizza() } // (riaperto: quello che è cambiato intanto)
  es.onmessage = (m) => { let a; try { a = JSON.parse(m.data) } catch { return } if (a.k === 'conto') conto(a); else dire(a) }
  // (un errore: il server l'ha chiusa dopo mezz'ora, il biglietto è scaduto, la rete: si chiude e si riapre con un biglietto nuovo)
  es.onerror = () => {
    if (diretto !== es) return
    es.close(); diretto = null
    errori++
    attesa = setTimeout(collega, aperto ? 300 : Math.min(60_000, 1000 * 2 ** errori))
  }
}

function ferma() {
  clearTimeout(attesa)
  const d = diretto
  diretto = null
  try { d?.close() } catch {}
}

document.addEventListener('visibilitychange', () => { if (document.hidden) ferma(); else { errori = 0; collega() } })
document.addEventListener('pzkko-altrove', (e) => { if (e.detail) ferma(); else { errori = 0; collega() } })
addEventListener('pagehide', ferma)
// (si entra o si esce dal conto: osserva scatta a ogni cambio di saldo, quindi si guarda solo se il token è un altro)
let tokenDi = pzk.token()
pzk.osserva(() => { const t = pzk.token(); if (t === tokenDi) return; tokenDi = t; ferma(); errori = 0; if (t) collega() })
collega()
