// Le impostazioni di pzk os (29.10, Alberto: «fai impostazioni per regolare la luminosità, i suoni, il led rosso…»): la
// luminosità della retroilluminazione, i suoni (lo stesso interruttore del sito: localStorage pzkko-suono, come la regia),
// il led rosso delle notifiche, l'inclinazione del cercapersone col mouse, e la guida da rivedere. Stanno in localStorage
// (pzkko-zero-impostazioni) e chi le usa (zero.js, muro.js, os.js) le legge da qui e si mette in ascolto.
//
//   leggi() → { luminosita (0.3–1), suoni, led, inclina }   imposta(chiave, valore)   ascolta(fn)
//   vista() → la vista dell'app Impostazioni (una lista di righe: sinistra/destra cambiano, OK conferma o apre)
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import { corto, centro, puntini, testata } from './pezzi.js'

const CHIAVE = 'pzkko-zero-impostazioni'
const BASE = { luminosita: 1, led: true, inclina: true }
let I = null
const ascolti = new Set()
export const ascolta = (fn) => { ascolti.add(fn); return () => ascolti.delete(fn) }

export function leggi() {
  if (!I) { try { I = { ...BASE, ...(JSON.parse(localStorage.getItem(CHIAVE) || '{}')) } } catch { I = { ...BASE } } }
  let suoni = false
  try { suoni = localStorage.getItem('pzkko-suono') === 'si' } catch {}
  return { ...I, suoni }
}
export function imposta(k, v) {
  leggi()
  if (k === 'suoni') { try { localStorage.setItem('pzkko-suono', v ? 'si' : 'no') } catch {} }
  else { I[k] = v; try { localStorage.setItem(CHIAVE, JSON.stringify(I)) } catch {} }
  for (const f of ascolti) f(leggi())
}

const LIVELLI = [0.3, 0.45, 0.6, 0.8, 1]
// IL 29.10 NOTTE (Alberto: «… e impostazioni: falle tutte maniacalmente perfette»): la testata e il suggerimento in fondo
// come le altre app, la luminosità che con OK gira in tondo (prima al massimo si fermava), le informazioni del cercapersone
// e «di fabbrica», che rimette luminosità, led e inclinazione com'erano (i suoni no: sono l'interruttore di tutto il sito)
function informazioni(os) {
  return {
    nome: 'impostazioni-info', app: 'impostazioni',
    disegna(l) {
      testata(l, os, { icona: 'impostazioni', nome: 'il cercapersone', n: 1 })
      const c = pzk.conto(), i = leggi()
      const R = [
        ['modello', 'cercapersone zero'], ['sistema', 'pzk os, 29.10.2026'], ['schermo', '256 × 128, un bit'],
        ['tasti', 'la croce, OK, INDIETRO'], ['conto', c ? corto(`${c.nome} · ${c.ind}`, 22) : 'nessuno'],
        ['luminosità', `${Math.round(i.luminosita * 100)} %`], ['suoni', i.suoni ? 'accesi' : 'spenti'], ['il sito', 'pzkko.it'],
      ]
      R.forEach(([n, v], k) => puntini(l, 35 + k * 10, n, v))
      centro(l, H - 9, 'INDIETRO torna')
    },
    tasto(n) { if (n === 'indietro' || n === 'ok') { os.togli(); return true } return n === 'su' || n === 'giu' || n === 'sx' || n === 'dx' },
  }
}
export function vista(os) {
  const passoLuce = (i, d, giro = false) => {
    // il livello più vicino (una luminosità salvata da una versione vecchia, 0,5, contava come l'ultima: ← la schiariva)
    const j = LIVELLI.reduce((a, l, k) => (Math.abs(l - i.luminosita) < Math.abs(LIVELLI[a] - i.luminosita) ? k : a), LIVELLI.length - 1), k = j + d
    imposta('luminosita', LIVELLI[giro ? (k + LIVELLI.length) % LIVELLI.length : Math.max(0, Math.min(LIVELLI.length - 1, k))])
  }
  const righe = [
    { k: 'luminosita', nome: 'luminosità', valore: (i) => LIVELLI.map((l) => (l <= i.luminosita + 0.01 ? '■' : '□')).join(''), cambia: (i, d) => passoLuce(i, d), ok: () => passoLuce(leggi(), 1, true), aiuto: '←→ meno o più · OK gira' },
    { k: 'suoni', nome: 'suoni', valore: (i) => (i.suoni ? 'sì' : 'no'), cambia: (i) => { imposta('suoni', !i.suoni); if (!i.suoni) os.suoni?.bip('scheda') } }, // (accesi: un bip di conferma, perché quello del tasto è suonato quando erano ancora spenti)
    { k: 'led', nome: 'led rosso', valore: (i) => (i.led ? 'sì' : 'no'), cambia: (i) => imposta('led', !i.led) },
    { k: 'inclina', nome: 'inclina col mouse', valore: (i) => (i.inclina ? 'sì' : 'no'), cambia: (i) => imposta('inclina', !i.inclina) },
    { k: 'guida', nome: 'rivedi la guida', valore: () => '', ok: () => os.guida(), aiuto: 'OK la guida · ↑↓ righe' },
    { k: 'info', nome: 'il cercapersone', valore: () => '', ok: () => os.spingi(informazioni(os)), aiuto: 'OK le informazioni · ↑↓ righe' },
    { k: 'fabbrica', nome: 'come di fabbrica', valore: () => '', ok: async () => {
      const r = await os.dialogo({ titolo: 'di fabbrica', testo: 'luminosità piena, led acceso, inclinazione col mouse accesa. I suoni restano come sono.', icona: 'impostazioni', tasti: ['no', 'sì'] })
      if (r !== 'sì') return
      for (const [k, v] of Object.entries(BASE)) imposta(k, v)
      lampo = 6
    }, aiuto: 'OK rimette tutto · ↑↓ righe' },
  ]
  let sel = 0, lampo = 0
  return {
    nome: 'impostazioni', app: 'impostazioni',
    entra() { this.via = ascolta(() => os.ridisegna()) },
    esci() { this.via?.() },
    tic() { if (lampo > 0) { lampo--; os.ridisegna() } },
    disegna(l) {
      const i = leggi()
      testata(l, os, { icona: 'impostazioni', nome: 'impostazioni', n: 1 })
      righe.forEach((r, j) => {
        const y = 35 + j * 11, on = j === sel
        if (on || (r.k === 'fabbrica' && lampo % 2)) l.riempi(6, y - 2, W - 12, 11)
        const inv = on || (r.k === 'fabbrica' && lampo % 2 === 1)
        l.testo(10, y, r.nome, { inv })
        // il valore a destra; scelto e cambiabile, fra ◀ e ▶ (tutto DENTRO la fascia scura: il ▶ stava fuori, scritto in
        // chiaro sull'arancione, e non si vedeva); una riga che apre qualcosa ha il › in fondo
        const v = r.valore(i) || (r.cambia ? '' : '›'), frecce = on && r.cambia, x = W - 10 - (frecce ? 10 : 0) - Lcd.larghezza(v)
        if (frecce) { l.testo(x - 10, y, '◀', { inv: true }); l.testo(W - 15, y, '▶', { inv: true }) }
        l.testo(x, y, v, { inv })
        // il clic: la riga la sceglie e la fa (come OK); sulla riga scelta ◀ e ▶ abbassano e alzano
        os.zona?.(6, y - 2, W - 12, 11, () => { sel = j; if (r.ok) r.ok(); else r.cambia?.(leggi(), 1) })
        if (frecce) { os.zona?.(x - 13, y - 2, 11, 11, () => r.cambia(leggi(), -1)); os.zona?.(W - 18, y - 2, 12, 11, () => r.cambia(leggi(), 1)) }
      })
      const r = righe[sel]
      centro(l, H - 9, r.aiuto ?? '←→ o OK cambia · ↑↓ righe')
    },
    tasto(n) {
      const i = leggi(), r = righe[sel]
      if (n === 'su') sel = (sel - 1 + righe.length) % righe.length
      else if (n === 'giu') sel = (sel + 1) % righe.length
      else if (n === 'sx' && r.cambia) r.cambia(i, -1)
      else if (n === 'dx' && r.cambia) r.cambia(i, 1)
      else if (n === 'ok') { if (r.ok) r.ok(); else r.cambia?.(i, 1) }
      else if (n === 'indietro') os.togli()
      else return n === 'sx' || n === 'dx'
      return true
    },
  }
}
