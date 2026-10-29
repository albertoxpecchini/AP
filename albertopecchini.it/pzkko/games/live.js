// Il canale sempre aperto (26.10, Alberto: «fai un server sempre connesso e che registra tutto subito»): chi è entrato nel
// conto tiene aperta una connessione, e gli si dice appena succede che lo zaino o il conto sono cambiati sul server (da un
// altro dispositivo, da un'altra scheda, dal server stesso). Gli avvisi:
// - { k: 'conto', pzk, eur, disp, agg }: il conto com'è sul server. games/pzk.js (dalCanale) lo prende SUBITO se è più nuovo
//   di quello che ha (agg): il saldo che si vede è quello del server più i lotti di qui ancora in viaggio, quindi niente si
//   perde e niente si conta due volte; poi si chiede il resto del conto (le mosse, i soldi sporchi, la galera) con
//   pzk.sincronizza(), fra 300 ms (più avvisi di fila, una richiesta sola);
// - { k: 'zaino', t }: ascoltano gli zaini (chat/zaino.js, `su`), che si sincronizzano se `t` è nuovo.
//
// IL CANALE DIRETTO (29.10 notte, Alberto: «se entro con 2 telefoni e stesso account assieme devo vedere le cose
// sincronizzati al millisecondo»): la connessione va dritta al server dei dati sul pc di Alberto (C:\pzkko-server, /v1/live,
// Server-Sent Events), che avvisa nell'istante in cui scrive i conti: niente giri dalla funzione di Vercel. Per aprirla serve
// un biglietto del conto (pzk.biglietto(), dieci minuti per aprire); il server la chiude dopo mezz'ora e qui si riapre con un
// biglietto nuovo. Se il canale diretto non c'è (il server dei dati spento, il tunnel giù) o cade tre volte di fila, si usa
// quello di prima, /api/live/ (api/live.mjs: una funzione di Vercel che guarda i file ogni 3 secondi), e ogni due minuti si
// riprova quello diretto.
// Aperto solo a pagina in vista, col conto, e non nella pagina che dorme sotto la cornice della musica (suono/cornice.js:
// quella davanti ha il suo canale). Lo carica la barra (ogni pagina).

import * as pzk from './pzk.js'

const API = '/api/live/' // con la barra finale (trailingSlash)
const ascoltatori = new Map()
/** Chiama `fn(avviso)` per ogni avviso di tipo `k` ('zaino', 'conto'). → come smettere */
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

let diretto = null, vecchio = null, attesa = 0, errori = 0, cadute = 0, usaVecchio = 0
/** Apre il canale: quello diretto, o quello di prima se il diretto non va. */
async function collega() {
  clearTimeout(attesa)
  if (diretto || vecchio || !pzk.token() || dorme()) return
  if (Date.now() < usaVecchio) return collegaVecchio()
  const b = await pzk.biglietto()
  if (!b) { cadute++; usaVecchio = Date.now() + 120_000; return collegaVecchio() }
  if (diretto || vecchio || dorme() || !pzk.token()) return
  const es = (diretto = new EventSource(`${b.url}/v1/live?b=${encodeURIComponent(b.biglietto)}`))
  let aperto = false
  es.onopen = () => { aperto = true; errori = 0; cadute = 0 }
  es.onmessage = (m) => { let a; try { a = JSON.parse(m.data) } catch { return } if (a.k === 'conto') conto(a); else dire(a) }
  // (un errore: il server l'ha chiusa dopo mezz'ora, il biglietto è scaduto, la rete: si chiude e si riapre con un biglietto
  // nuovo; tre cadute di fila senza essersi mai aperta: per due minuti il canale di prima)
  es.onerror = () => {
    if (diretto !== es) return
    es.close(); diretto = null
    if (!aperto && ++cadute >= 3) { usaVecchio = Date.now() + 120_000; cadute = 0 }
    errori++
    attesa = setTimeout(collega, aperto ? 300 : Math.min(30_000, 1000 * 2 ** errori))
  }
}

// ── il canale di prima: /api/live/ (una risposta lunga, una riga per avviso; Vercel la chiude dopo una cinquantina di secondi) ──
async function collegaVecchio() {
  const token = pzk.token()
  if (vecchio || !token || dorme()) return
  const mio = vecchio = new AbortController()
  let ok = false
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), signal: mio.signal, cache: 'no-store' })
    if (r.status === 401) return ferma()
    if (!r.ok || !r.body) throw new Error('canale ' + r.status)
    const lettore = r.body.getReader(), testo = new TextDecoder()
    let coda = ''
    for (;;) {
      const { done, value } = await lettore.read()
      if (done) break
      coda += testo.decode(value, { stream: true })
      const righe = coda.split(String.fromCharCode(10))
      coda = righe.pop()
      for (const riga of righe) {
        if (!riga.trim()) continue
        let a; try { a = JSON.parse(riga) } catch { continue }
        ok = true; errori = 0
        if (a.k === 'ciao') { dire({ k: 'zaino', t: a.t, ciao: true }); pzk.sincronizza() } // (il canale di prima non porta la versione: si chiede)
        else if (a.k === 'conto') pzk.sincronizza()
        else dire(a)
      }
    }
  } catch (e) { if (e?.name === 'AbortError') return }
  finally { if (vecchio === mio) vecchio = null }
  errori = ok ? 0 : errori + 1
  attesa = setTimeout(collega, ok ? 300 : Math.min(60_000, 5_000 * 2 ** (errori - 1)))
}

function ferma() {
  clearTimeout(attesa)
  const d = diretto, v = vecchio
  diretto = null; vecchio = null
  try { d?.close() } catch {}
  try { v?.abort() } catch {}
}

document.addEventListener('visibilitychange', () => { if (document.hidden) ferma(); else { errori = 0; collega() } })
document.addEventListener('pzkko-altrove', (e) => { if (e.detail) ferma(); else { errori = 0; collega() } })
addEventListener('pagehide', ferma)
// (si entra o si esce dal conto: osserva scatta a ogni cambio di saldo, quindi si guarda solo se il token è un altro)
let tokenDi = pzk.token()
pzk.osserva(() => { const t = pzk.token(); if (t === tokenDi) return; tokenDi = t; ferma(); errori = 0; if (t) collega() })
collega()
