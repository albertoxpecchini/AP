// I pezzi che le app di pzk os si dividono (29.10: il profilo e l'account): il testo degli altri senza quadratini, i tagli
// con «…», l'allineamento, la testata delle app a pagine (◀ icona nome · pallini ▶, tutto cliccabile), il disegno spostato
// per la pagina che scorre di lato, la striscia dei messaggi in fondo. Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { esiste as haGlifo } from './font.js'

/** Il testo di altri (un nome, un motto, un errore del server): un carattere senza glifo diventa «?», mai il quadratino. */
export const txt = (s) => [...String(s ?? '')].map((c) => (c === '\n' || haGlifo(c) ? c : '?')).join('') // (l'a capo resta: lo usa Lcd.acapo)
/** Al più n caratteri: se è più lungo, l'ultimo diventa «…». */
export const corto = (s, n) => { const a = [...txt(s)]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : a.join('') }
export const destra = (l, xd, y, s, o) => l.testo(xd - Lcd.larghezza(s, o?.scala ?? 1), y, s, o)
export const centro = (l, y, s, o) => l.testo(Math.round(W / 2 - Lcd.larghezza(s, o?.scala ?? 1) / 2), y, s, o) // (la larghezza alla scala vera: a scala 2 il testo usciva dallo schermo)

/** Il disegno spostato di dx pixel (la pagina che scorre di lato). */
export const sposta = (l, dx) => (!dx ? l : {
  px: (x, y, v) => l.px(x + dx, y, v), riempi: (x, y, w, h, v) => l.riempi(x + dx, y, w, h, v), riquadro: (x, y, w, h, v) => l.riquadro(x + dx, y, w, h, v),
  cornice: (x, y, w, h, v) => l.cornice(x + dx, y, w, h, v), orizz: (x, y, w, v) => l.orizz(x + dx, y, w, v), vert: (x, y, h, v) => l.vert(x + dx, y, h, v),
  testo: (x, y, s, o) => l.testo(x + dx, y, s, o), bitmap: (b, x, y, o) => l.bitmap(b, x + dx, y, o),
})

/** La testata di un'app a pagine (righe 13–31): ◀, l'icona e il nome della pagina, i pallini (quello pieno è la pagina), ▶ e la
 *  riga sotto. vai(±1) sfoglia, va(i) salta a una pagina: le frecce e i pallini si cliccano. */
export function testata(l, os, { icona, nome, n, pag, vai, va }) {
  if (n <= 1) { l.bitmap(icone.bitmap(icona, 16), 8, 14); l.testo(28, 18, nome); l.orizz(6, 31, W - 12); return } // (una pagina sola: niente frecce né pallini)
  l.testo(7, 18, '◀'); os.zona(5, 14, 10, 16, () => vai(-1))
  l.bitmap(icone.bitmap(icona, 16), 16, 14)
  l.testo(36, 18, nome)
  const xp = W - 17 - n * 6
  for (let i = 0; i < n; i++) { const x = xp + i * 6; if (i === pag) l.riempi(x, 19, 4, 4); else l.riquadro(x, 19, 4, 4); os.zona(x - 1, 15, 6, 12, () => va(i)) }
  l.testo(W - 12, 18, '▶'); os.zona(W - 15, 14, 10, 16, () => vai(1))
  l.orizz(6, 31, W - 12)
}

/** La striscia in fondo (righe H − 11 … H − 2, da x 10 a 245: più larga toccava gli angoli stondati): un messaggio rovesciato al posto del suggerimento, per qualche secondo; mentre si
 *  aspetta il server, la rotellina. → true se ha disegnato qualcosa (se no il chiamante scrive il suggerimento). */
export function striscia(l, { esito, attesa }, t) {
  if (attesa) {
    const s = `${['|', '/', '-', '\\'][t % 4]} ${corto(attesa, 34)}`
    l.riempi(10, H - 11, W - 20, 10); centro(l, H - 9, s, { inv: true })
    return true
  }
  if (esito && Date.now() < esito.fino) {
    const s = `${esito.ok ? '✓' : '!'} ${corto(esito.testo, 35)}`
    l.riempi(10, H - 11, W - 20, 10); centro(l, H - 9, s, { inv: true })
    return true
  }
  return false
}

/** Una riga «nome ........ valore» (i puntini fra i due), da x0 a x1. */
export function puntini(l, y, nome, v, { x0 = 10, x1 = 245, inv = false } = {}) {
  const xa = x0 + Lcd.larghezza(nome) + 4, xb = x1 - Lcd.larghezza(v) - 4
  l.testo(x0, y, nome, { inv })
  for (let x = xa; x < xb; x += 3) l.px(x, y + 6, inv ? 0 : 1)
  destra(l, x1, y, v, { inv })
}

/** Una lista che scorre: la voce scelta rovesciata, la barra di scorrimento a destra se non ci stanno tutte, il clic sulle
 *  righe. stato = { sel, da } lo tiene chi chiama; riga(l, voce, x, y, w, on, k) disegna una voce (on: è la scelta, testo
 *  rovesciato). clic(voce, k): il clic su una riga (dopo averla scelta). → quante voci si vedono. */
export function elenco(l, zona, { voci, stato, y0, alta, passo, riga, clic }) {
  const vis = Math.max(1, Math.floor(alta / passo)), n = voci.length
  if (stato.sel >= n) stato.sel = Math.max(0, n - 1)
  if (stato.sel < stato.da) stato.da = stato.sel
  if (stato.sel >= stato.da + vis) stato.da = stato.sel - vis + 1
  stato.da = Math.max(0, Math.min(stato.da, Math.max(0, n - vis)))
  const barra = n > vis, w = W - 12 - (barra ? 8 : 0)
  for (let i = 0; i < vis && stato.da + i < n; i++) {
    const k = stato.da + i, y = y0 + i * passo, on = k === stato.sel
    if (on) l.riempi(6, y, w, passo - 1)
    zona(6, y, w, passo - 1, () => { stato.sel = k; clic?.(voci[k], k) }) // (prima della riga: le frecce ◀ ▶ che segna lei vincono)
    riga(l, voci[k], 10, y, w - 8, on, k)
  }
  if (barra) { // la barra di scorrimento, come il menu
    const h = Math.max(6, Math.round((alta * vis) / n))
    l.vert(W - 9, y0, alta - 1)
    l.riempi(W - 10, y0 + Math.round(((alta - 1 - h) * stato.sel) / Math.max(1, n - 1)), 3, h)
  }
  return vis
}
/** ↑ ↓ in una lista: in tondo. → true se il tasto era suo. */
export function muovi(stato, n, k) {
  if (!n || (k !== 'su' && k !== 'giu')) return false
  stato.sel = (stato.sel + (k === 'su' ? -1 : 1) + n) % n
  return true
}

/** UN'APP A PAGINE (il profilo, l'account, il negozio e le altre): la testata coi pallini, ← → sfogliano (se la pagina non le
 *  vuole per sé), la pagina scorre di lato, in fondo il suggerimento della pagina o la striscia (l'esito, la rotellina del
 *  server). Le pagine: { nome, icona, disegna(l, x, t), tasto?(n, x) → bool, ok?(x), aiuto?: testo | (x) → testo, entra?(x),
 *  tic?(t, x) → bool (ridisegna), carattere?, cancella?, scrivendo?, invio? }. x, passato a tutte: { os, pag, vai(d), va(i),
 *  dì(ok, testo), aspetta(testo, fai), qui(), zona(…) (le zone: solo a pagina ferma), fermo, vista }. */
export function pagine(os, { nome, app, pagine: P, ascolta = [], entra: suEntra, esci: suEsci, iniziale = 0 }) {
  let pag = Math.min(iniziale, P.length - 1), scorre = 0, esito = null, attesa = null, via = []
  const x = {
    os,
    get pag() { return pag },
    get fermo() { return !scorre },
    vai(d) { pag = (pag + d + P.length) % P.length; scorre = Math.sign(d) * 70; P[pag].entra?.(x); os.ridisegna() },
    va(i) { if (i === pag) return; const d = i - pag; pag = i; scorre = Math.sign(d) * 70; P[pag].entra?.(x); os.ridisegna() },
    dì(ok, testo) { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() },
    async aspetta(testo, fai) {
      if (attesa) return null
      attesa = testo; esito = null; os.ridisegna()
      try { return await fai() } finally { attesa = null; os.ridisegna() }
    },
    get attesa() { return attesa },
    qui: () => os.corrente() === v,
    zona: (...a) => { if (!scorre && !attesa) os.zona(...a) }, // (aspettando il server i clic non partono, come i tasti)
  }
  const zonaFerma = { zona: (...a) => { if (!attesa) os.zona(...a) } } // (la testata: ◀ ▶ e i pallini, anche loro fermi mentre si aspetta)
  const v = {
    nome, app,
    entra() { via = ascolta.map((f) => f(() => os.ridisegna())); suEntra?.(x); P[pag].entra?.(x) },
    esci() { via.forEach((f) => f?.()); via = []; suEsci?.(x) },
    tic(t) {
      let ancora = !!attesa
      if (scorre) { scorre = Math.abs(scorre) < 4 ? 0 : Math.trunc(scorre * 0.45); ancora = true }
      if (esito && Date.now() >= esito.fino) { esito = null; ancora = true }
      if (P[pag].tic?.(t, x)) ancora = true
      if (ancora) os.ridisegna()
    },
    disegna(l, t) {
      const p = P[pag]
      testata(l, zonaFerma, { icona: p.icona, nome: p.nome, n: P.length, pag, vai: x.vai, va: x.va })
      l.ritaglia([os.MARGINE, 32, W - 2 * os.MARGINE, 86])
      p.disegna(sposta(l, scorre), x, t)
      l.ritaglia(null)
      if (striscia(l, { esito, attesa }, t)) return
      const a = (typeof p.aiuto === 'function' ? p.aiuto(x) : p.aiuto) ?? (P.length > 1 ? '←→ pagine' : '')
      if (!a) return
      const xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
      l.testo(xa, H - 9, a)
      if (p.ok && /^OK/.test(a)) os.zona(xa - 3, H - 11, Lcd.larghezza(a.split(' · ')[0]) + 6, 11, () => p.ok(x))
    },
    tasto(n) {
      if (attesa) { if (n === 'indietro') os.togli(); return true } // (aspettando il server non parte altro)
      const p = P[pag]
      if (p.tasto?.(n, x)) return true
      if (n === 'sx' && P.length > 1) x.vai(-1)
      else if (n === 'dx' && P.length > 1) x.vai(1)
      else if (n === 'ok' && p.ok) p.ok(x)
      else if (n === 'indietro') os.togli()
      else return false
      return true
    },
    carattere: (ch) => P[pag].carattere?.(ch, x),
    cancella: () => P[pag].cancella?.(x),
    scrivendo: () => !!P[pag].scrivendo?.(x),
    invio() { const p = P[pag]; if (p.invio) p.invio(x); else v.tasto('ok') },
  }
  x.vista = v
  return v
}

/** Il testo delle app vecchie senza l'html (i <b>, i <code>, gli &nbsp;). */
export const senzaHtml = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
/** Un testo lungo in righe da n caratteri: blocchi { titolo } (una fascia rovesciata, con una riga vuota prima), { testo } (a
 *  capo sulle parole), { punto } (col pallino e il rientro), { passo, testo } (col numero). → [{ s, tipo }] */
export function impagina(blocchi, n = 37) { // (37 e non 39: a destra restano le frecce di scorrevole)
  const out = []
  for (const b of blocchi) {
    if (b.titolo) { if (out.length) out.push({ s: '' }); out.push({ s: corto(senzaHtml(b.titolo), n - 1), tipo: 'titolo' }); continue }
    if (b.barra !== undefined) { out.push({ s: '', tipo: 'barra', k: Math.max(0, Math.min(1, b.barra)) }); continue } // (una barra: la salute, gli xp)
    const testa = b.punto !== undefined ? '• ' : b.passo !== undefined ? `${b.passo}. ` : ''
    const corpo = senzaHtml(b.punto ?? b.testo ?? '')
    Lcd.acapo(txt(corpo), n - testa.length).forEach((r, i) => out.push({ s: (i ? ' '.repeat(testa.length) : testa) + r }))
  }
  return out
}
/** Le righe di impagina che scorrono: vis righe da y0, a partire da giu; le frecce ↑ ↓ a destra se ce n'è sopra o sotto.
 *  → il giu corretto (fra 0 e l'ultimo che ha senso). */
export function scorrevole(l, righe, { y0, vis, giu, x0 = 10 }) {
  giu = Math.max(0, Math.min(giu, Math.max(0, righe.length - vis)))
  righe.slice(giu, giu + vis).forEach((r, i) => {
    const y = y0 + i * 9
    if (r.tipo === 'titolo') { l.riempi(x0 - 2, y - 1, W - 12 - (x0 - 8) - 10, 9); l.testo(x0, y, r.s, { inv: true }) }
    else if (r.tipo === 'barra') { const w = W - 12 - (x0 - 8) - 16; l.riquadro(x0, y + 1, w, 5); l.riempi(x0 + 1, y + 2, Math.round((w - 2) * r.k), 3) }
    else l.testo(x0, y, r.s)
  })
  if (giu > 0) l.testo(W - 14, y0, '↑')
  if (giu + vis < righe.length) l.testo(W - 14, y0 + (vis - 1) * 9, '↓')
  return giu
}

/** La fila di tasti in fondo a una scheda (← → li scelgono, OK preme, il clic pure), centrata, alla riga y. */
export function bottoni(l, zona, { etichette, sel, y = 99, premi }) {
  const ws = etichette.map((b) => Lcd.larghezza(b) + 8), tutta = ws.reduce((a, w) => a + w, 0) + (etichette.length - 1) * 4
  let x = Math.round(W / 2 - tutta / 2)
  etichette.forEach((b, i) => {
    const on = i === sel
    if (on) l.riempi(x, y, ws[i], 11); else l.cornice(x, y, ws[i], 11)
    l.testo(x + 4, y + 2, b, { inv: on })
    zona(x, y - 2, ws[i], 15, () => premi(i))
    x += ws[i] + 4
  })
}
