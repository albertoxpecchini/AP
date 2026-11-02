// pzk os a 8 bit (29.10, Alberto: «rifai da 0 pzk os adattato allo strumento… prendi flipper zero os e riscrivilo con le mie
// app, impara come funziona e usalo per rifare le app, aumenta i pixel dello schermo ma mantieni stile 8bit»): il sistema
// del cercapersone zero, disegnato pixel per pixel su un lcd 256 × 128 a un bit (lcd.js) che vive SOTTO IL VETRO del
// modello 3D (zero.js lo stende come trama sull'lcd; muro.js lo ricopia sul tasto del muro): niente finestra HTML sopra.
// È fatto come il firmware del Flipper Zero: una BARRA DI STATO in cima (l'ora, la rete, il conto, la batteria), la HOME
// (29.10 sera, Alberto: «fai la home con dati importanti come i miei soldi e le cose da fare oggi»: la chiocciolina di
// chat/tomodachi.js a sinistra, i $pzk, il livello e le sfide a destra, sotto le cose da fare oggi), OK che apre il MENU
// PRINCIPALE (la lista delle app, con l'icona a sinistra, la voce scelta rovesciata e la barra di scorrimento a destra,
// come il suo), le app come VISTE impilate (INDIETRO torna a quella sotto), i DIALOGHI con la cornice smussata, la
// TASTIERA sullo schermo che si usa con la croce (come la sua TextInput), le IMPOSTAZIONI (impostazioni.js) e la GUIDA al
// primo accesso («al primo accesso spiega come funziona»). I sei tasti sono gli stessi del Flipper: su, giù, sinistra,
// destra, OK, INDIETRO (telefono.js li manda da qui: dai tasti 3D e dalla tastiera). Niente nelle quattro punte dello
// schermo (Alberto: «evita di mettere negli angoli cose che altrimenti con l'inclinazione non si vedono»): tutto sta dentro
// un margine di 6 pixel (MARGINE), e i suggerimenti in basso stanno in mezzo.
//
//   lcd                      l'lcd (la tela 768 × 384 è lcd.canvas)
//   configura({ app, tomodachi })   le app del menu [{ id, nome, icona }] e la tela della chiocciolina
//   stato({ ora, nome, pct, carica, tacche })   la barra di stato
//   tasto(nome) → bool       su | giu | sx | dx | ok | indietro (→ false: nessuna vista l'ha voluto: INDIETRO sulla home)
//   carattere(ch), cancella(), invio(), scrivendo()   la tastiera vera
//   apri(id), pronta(id), home(), corrente(), guida()   (le app pronte stanno in PRONTE, qui sotto)
//   spingi(vista), togli()   le viste: { disegna(lcd, tic), tasto(n) → bool, carattere?, cancella?, invio?, entra?, esci?, tic? }
//   dialogo({ titolo, testo, icona, tasti }) → Promise del tasto scelto
//   tastiera({ testo, titolo }) → Promise del testo (null se si esce)
//   avvia(), ferma()         il giro di disegno (quando il cercapersone è aperto o il muro lo guarda)
//
// COME SI FA UN'APP (e senza bug): telefono/zero/os/REGOLE.md. Ogni tasto fa già il suo bip e ogni app la sua sigla
// (suoni.js); le app ricevono `os` (OS, qui sotto): BARRA, MARGINE, togli, spingi, ridisegna, corrente, apri, dialogo,
// tastiera, suoni.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as impostazioni from './impostazioni.js'
import * as suoni from './suoni.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'

export const lcd = new Lcd()
export const BARRA = 12 // la barra di stato: 11 righe più la linea
export const MARGINE = 6
export { W, H }

let viste = []
let APP = []
let tomodachi = null
let st = { ora: '', nome: '', pct: 100, carica: false, tacche: 3 }
let giro = 0, sporco = true, tic = 0
const ascoltiVista = new Set()
export const ascoltaVista = (fn) => { ascoltiVista.add(fn); return () => ascoltiVista.delete(fn) }

lcd.regola(impostazioni.leggi().luminosita)
impostazioni.ascolta((i) => { lcd.regola(i.luminosita); ridisegna() })

export function configura({ app, tomodachi: t } = {}) {
  if (app) APP = [...app.filter((a) => a.id !== 'impostazioni'), { id: 'impostazioni', nome: 'impostazioni', icona: 'impostazioni' }]
  if (t) tomodachi = t
  if (!viste.length) spingi(home_)
  ridisegna()
}
export function stato(s) { st = { ...st, ...s }; ridisegna() }
export const ridisegna = () => { sporco = true }
export const corrente = () => viste[viste.length - 1] ?? null

// ── le viste ──
export function spingi(v) {
  corrente()?.esci?.()
  viste.push(v)
  v.entra?.()
  ridisegna()
  for (const f of ascoltiVista) f(v)
}
export function togli() {
  if (viste.length <= 1) return false
  const v = viste.pop()
  v.esci?.()
  v.tolta?.() // (i dialoghi e le tastiere tolti da fuori, home() all'uscita dal conto: la loro Promise torna null e non resta appesa)
  corrente()?.entra?.()
  ridisegna()
  for (const f of ascoltiVista) f(corrente())
  return true
}
export function home() { while (viste.length > 1) togli(); ridisegna() }
// ── le app pronte (le regole: telefono/zero/os/REGOLE.md): id → la sua vista. Un'app nuova si aggiunge SOLO qui (il
// menu smette da sé di dire «presto»); quelle che non ci sono aprono la vista «in arrivo» ──
const PRONTE = {
  chat: async () => (await import('./chat.js')).vista(),
  impostazioni: async () => impostazioni.vista(OS),
  profilo: async () => (await import('./profilo.js')).vista(OS),
  account: async () => (await import('./account.js')).vista(OS),
  negozio: async () => (await import('./negozio.js')).vista(OS),
  pzkstore: async () => (await import('./pzkstore.js')).vista(OS),
  sfide: async () => (await import('./sfide.js')).vista(OS),
  quiz: async () => (await import('./quiz.js')).vista(OS),
  missioni: async () => (await import('./missioni.js')).vista(OS),
  giocatori: async () => (await import('./giocatori.js')).vista(OS),
  zaino: async () => (await import('./zaino.js')).vista(OS),
  miniera: async () => (await import('./miniera.js')).vista(OS),
  foto: async () => (await import('./foto.js')).vista(OS),
  virtual: async () => (await import('./virtual.js')).vista(OS),
  banca: async () => (await import('./banca.js')).vista(OS),
  rapina: async () => (await import('./rapina.js')).vista(OS),
  lavatrice: async () => (await import('./lavatrice.js')).vista(OS),
  decifratore: async () => (await import('./decifratore.js')).vista(OS),
  conversioni: async () => (await import('./conversioni.js')).vista(OS),
  calcolatrice: async () => (await import('./calcolatrice.js')).vista(OS),
  compilatore: async () => (await import('./compilatore.js')).vista(OS),
  cucina: async () => (await import('./cucina.js')).vista(OS),
}
export const pronta = (id) => !!PRONTE[id]
let aprendo = null
/** Apre un'app del menu per id, con la sua sigla (suoni.js). Due OK di fila non la aprono due volte. */
// SENZA CONTO NON SI ENTRA (26.10, Alberto: «non puoi accedere al cercapersone se non ti registri/accedi»; sullo zero dal
// 29.10, con l'app account): senza conto ogni app tranne LIBERE apre l'account, e l'app voluta aspetta in «dopo»; quando il
// conto c'è, l'account chiama dopoAccesso() e si va lì
const LIBERE = new Set(['account', 'impostazioni'])
let dopo = null
export const serveConto = () => !pzk.conto()
/** Dopo l'accesso (l'app account): via l'account, e si apre l'app che si voleva (o la home). */
export function dopoAccesso() { const d = dopo; dopo = null; home(); if (d) apri(d) }
/** Apre un'app (opz.comando: per la chat, un comando da mandare appena aperta: «vai» delle sfide, per esempio). */
export async function apri(id, opz = {}) {
  if (serveConto() && !LIBERE.has(id)) { dopo = id; id = 'account'; opz = {} }
  const a = APP.find((x) => x.id === id)
  if (corrente()?.app === id && opz.comando) { corrente().comando?.(opz.comando); return } // (già aperta: solo il comando)
  if (!a || corrente()?.app === id || aprendo === id) return
  aprendo = id
  try {
    const v = PRONTE[id] ? await PRONTE[id]() : presto(a)
    if (corrente()?.app === id) return
    v.app ??= id
    spingi(v)
    suoni.sigla(id)
    if (opz.comando) v.comando?.(opz.comando)
  } finally { aprendo = null }
}
const OS = { get BARRA() { return BARRA }, get MARGINE() { return MARGINE }, togli, spingi, ridisegna, corrente, apri, zona, dialogo: (o) => dialogo(o), tastiera: (o) => tastiera(o), cifre: (o) => cifre(o), numero: (o) => numero(o), dopoAccesso, guida: () => guida(true), suoni }

// ── i tasti e la tastiera vera ──
export function tasto(nome) {
  suoni.bip(nome === 'indietro' ? 'pagerGiu' : 'pager') // (il bip di ogni tasto: le app non lo rifanno)
  const v = corrente()
  const preso = v?.tasto?.(nome) ?? false
  ridisegna()
  return preso
}
export function carattere(ch) { corrente()?.carattere?.(ch); ridisegna() }
export function cancella() { corrente()?.cancella?.(); ridisegna() }
/** Invio: la vista che scrive lo manda (la chat, la tastiera), le altre lo prendono come OK. */
export function invio() { suoni.bip('pager'); const v = corrente(); if (v?.invio) v.invio(); else v?.tasto?.('ok'); ridisegna() }
/** Si sta scrivendo (c'è del testo da cancellare con Backspace)? */
export const scrivendo = () => !!corrente()?.scrivendo?.()

// ── il clic del mouse sullo schermo (29.10, Alberto: «metti per sicurezza anche il click del mouse»): mentre disegna, la
// vista segna le sue zone cliccabili (zona); zero.js trasforma il clic sul vetro in un pixel dell'lcd e tocca() preme la
// zona che c'è sotto (l'ultima segnata vince: un dialogo sopra la sua vista). È un in più: tutto si fa anche coi tasti ──
let zone = []
export function zona(x, y, w, h, fn) { zone.push({ x, y, w, h, fn }) }
const trova = (x, y) => { for (let i = zone.length - 1; i >= 0; i--) { const z = zone[i]; if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z } return null }
export const cliccabile = (x, y) => !!trova(x, y)
/** Il clic in (x, y), pixel dell'lcd: preme la zona sotto. → true se c'era. */
export function tocca(x, y) { const z = trova(x, y); if (!z) return false; suoni.bip('pager'); z.fn(); ridisegna(); return true }
/** Le zone di adesso (per il collaudo). */
export const elencoZone = () => zone.map(({ x, y, w, h }) => ({ x, y, w, h }))

// ── il giro di disegno: ogni 100 ms un tic (le animazioni), si ridisegna solo se qualcuno l'ha chiesto ──
export function avvia() {
  if (giro) return
  giro = setInterval(() => {
    tic++
    corrente()?.tic?.(tic)
    if (tic % 5 === 0) sporco = true // (l'orologio, il cursore, la chiocciolina)
    if (!sporco) return
    sporco = false
    lcd.ritaglia(null)
    lcd.pulisci()
    zone = []
    corrente()?.disegna(lcd, tic)
    lcd.ritaglia(null)
    barra(lcd)
    lcd.disegna()
  }, 100)
}
export function ferma() { clearInterval(giro); giro = 0 }

// ── la barra di stato, come quella del Flipper: in alto, con la linea sotto; dentro il margine ──
function barra(l) {
  if (corrente()?.senzaBarra) return
  l.riempi(0, 0, W, BARRA, 0)
  l.orizz(1, BARRA - 1, W - 2) // (non fino al bordo: i due pixel estremi cadevano negli angoli stondati)
  l.testo(MARGINE + 2, 2, st.ora || '--:--')
  // la rete: tre tacche
  const t = st.tacche ?? 0
  for (let i = 0; i < 3; i++) { const h = 2 + i * 2; if (i < t) l.riempi(MARGINE + 38 + i * 3, 9 - h, 2, h); else l.px(MARGINE + 38 + i * 3, 8) }
  const nome = st.nome || 'sessione'
  l.testo(Math.round(W / 2 - Lcd.larghezza(nome) / 2), 2, nome)
  // la batteria: il numero e il simbolo
  const pct = Math.max(0, Math.min(100, st.pct ?? 0))
  const testo = `${pct}%`
  const bx = W - MARGINE - 17
  l.testo(bx - 4 - Lcd.larghezza(testo), 2, testo)
  l.riquadro(bx, 2, 15, 7); l.vert(bx + 15, 4, 3)
  l.riempi(bx + 2, 4, Math.round((11 * pct) / 100), 3)
  if (st.carica) { l.px(bx + 6, 1, 0); l.px(bx + 7, 1, 0) }
}

// ── la home: la chiocciolina a sinistra (le 32 × 16 celle della sua tela, a 4 × 4 pixel), i dati a destra, le cose da
// fare oggi sotto ──
let dati = { saldo: 0, liv: 1, xp: 0, da: 0, a: 60, sfide: [], fatte: 0, giornaliero: false, quest: 0, lumaca: 0, aggiornato: 0 }
let leggendo = false, ancora = false
async function leggiDati() {
  if (leggendo) { ancora = true; return } // (il tic della home lo chiedeva ogni 100 ms finché la prima lettura non finiva; un cambio nel frattempo si rilegge dopo)
  leggendo = true
  try {
    const [sf, mi, lu] = await Promise.all([import('../../../chat/sfide.js'), import('../../../chat/missioni.js'), import('../../../chat/lumaca-avvisi.js')])
    const o = sf.oggi(), liv = zaino.livello()
    dati = { saldo: pzk.saldo(), liv, xp: zaino.xp(), da: zaino.xpPer(liv), a: zaino.xpPer(liv + 1), sfide: o.sfide, fatte: o.sfide.filter((x) => x.riscossa).length, giornaliero: zaino.manca('giornaliero') === 0, quest: mi.pronte(), lumaca: lu.daVedere().length, aggiornato: Date.now() }
  } catch (e) { try { dati = { ...dati, saldo: pzk.saldo(), liv: zaino.livello(), xp: zaino.xp() } } catch {} dati.aggiornato = Date.now() }
  finally { leggendo = false }
  ridisegna()
  if (ancora) { ancora = false; leggiDati() }
}
zaino.ascolta(() => leggiDati())
pzk.osserva(() => { leggiDati(); if (serveConto() && corrente()?.app && !LIBERE.has(corrente().app)) home() }) // (uscito dal conto: la home col lucchetto)
function chiusa(l) {
  l.bitmap(icone.bitmap('lucchetto', 32), Math.round(W / 2 - 16), BARRA + 8)
  ;['serve il conto: un nome e quattro', 'cifre, un minuto. senza conto', 'il cercapersone resta chiuso.'].forEach((r, i) => l.testo(Math.round(W / 2 - Lcd.larghezza(r) / 2), BARRA + 46 + i * 10, r))
  const a = 'OK entra o crea il conto', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
  l.riempi(xa - 4, H - 24, Lcd.larghezza(a) + 8, 12); l.testo(xa, H - 22, a, { inv: true })
  zona(xa - 4, H - 24, Lcd.larghezza(a) + 8, 12, () => apri('account'))
}
const home_ = {
  nome: 'home',
  entra() { leggiDati() },
  tic(t) { if (Date.now() - dati.aggiornato > 15_000) leggiDati() },
  disegna(l) {
    if (serveConto()) return chiusa(l)
    const x0 = MARGINE, y0 = BARRA + 2
    // la chiocciolina
    const c = tomodachi
    if (c?.width) {
      try {
        const g = c.getContext('2d', { willReadFrequently: true })
        const d = g.getImageData(0, 0, c.width, c.height).data
        const cw = c.width / 32, ch = c.height / 16
        for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
          const o = ((Math.floor((y + 0.5) * ch)) * c.width + Math.floor((x + 0.5) * cw)) * 4
          if (d[o + 3] > 128) l.riempi(x0 + x * 4, y0 + y * 4, 4, 4)
        }
      } catch {}
    } else l.testo(x0 + 30, y0 + 28, 'pzk os', { scala: 2 })
    // i dati a destra
    const xd = 142
    l.testo(xd, y0 + 1, 'saldo')
    const s = pzk.fmtCorto(dati.saldo)
    l.testo(xd, y0 + 10, s, { scala: 2 })
    l.testo(xd + Lcd.larghezza(s, 2) + 4, y0 + 17, '$pzk')
    // il livello e gli xp; se non ci stanno (livelli alti), la percentuale del livello
    const lx = `liv ${dati.liv} · ${dati.xp - dati.da}/${dati.a - dati.da} xp`
    l.testo(xd, y0 + 30, Lcd.larghezza(lx) <= W - MARGINE - xd ? lx : `liv ${dati.liv} · ${Math.round((100 * (dati.xp - dati.da)) / Math.max(1, dati.a - dati.da))}%`)
    l.riquadro(xd, y0 + 39, 100, 5); l.riempi(xd + 1, y0 + 40, Math.round(98 * Math.max(0, Math.min(1, (dati.xp - dati.da) / Math.max(1, dati.a - dati.da)))), 3)
    l.testo(xd, y0 + 48, `sfide ${dati.fatte}/3`)
    l.testo(xd, y0 + 57, dati.giornaliero ? 'premio pronto!' : 'premio preso ✓')
    // le cose da fare oggi
    const yb = y0 + 68
    l.cornice(x0, yb, W - 2 * MARGINE, 34)
    l.riempi(x0 + 6, yb - 3, Lcd.larghezza('da fare oggi') + 4, 7, 0); l.testo(x0 + 8, yb - 3, 'da fare oggi')
    const righe = []
    if (dati.giornaliero) righe.push('■ riscuoti il premio giornaliero')
    if (dati.lumaca) righe.push('■ la lumachina ha combinato qualcosa')
    if (dati.quest) righe.push(`■ ${dati.quest} quest pront${dati.quest === 1 ? 'a' : 'e'}`)
    for (const x of dati.sfide) if (!x.riscossa) righe.push(`${x.pronta ? '■' : '□'} ${x.testo} (${x.fatto}/${x.target})`)
    if (!righe.length) righe.push('tutto fatto: goditi la giornata')
    righe.slice(0, 3).forEach((r, i) => l.testo(x0 + 6, yb + 6 + i * 9, r.length > 38 ? r.slice(0, 37) + '…' : r))
    // il suggerimento, in mezzo in basso
    const s2 = 'OK menu · ↓ chat', xs = Math.round(W / 2 - Lcd.larghezza(s2) / 2)
    l.testo(xs, H - 9, s2)
    zona(xs - 3, H - 11, Lcd.larghezza('OK menu') + 6, 11, () => spingi(menu()))
    zona(xs + Lcd.larghezza('OK menu · ') - 3, H - 11, Lcd.larghezza('↓ chat') + 6, 11, () => apri('chat'))
  },
  tasto(n) {
    if (serveConto() && (n === 'ok' || n === 'giu')) { apri('account'); return true } // (senza conto: la home col lucchetto)
    if (n === 'ok') { spingi(menu()); return true }
    if (n === 'giu') { apri('chat'); return true }
    return false // (INDIETRO sulla home: niente; tenuto, telefono.js spegne)
  },
}

// ── il menu principale: le app, con l'icona a sinistra e la voce scelta rovesciata ──
const RIGA = 20, VISIBILI = 5
function menu() {
  let sel = 0, da = 0
  return {
    nome: 'menu',
    disegna(l) {
      const n = APP.length
      const y0 = BARRA + 3
      for (let i = 0; i < VISIBILI && da + i < n; i++) {
        const a = APP[da + i], y = y0 + i * RIGA, scelto = da + i === sel
        if (scelto) l.riempi(MARGINE, y, W - 2 * MARGINE - 8, RIGA, 1)
        l.bitmap(icone.bitmap(a.icona, 16), MARGINE + 4, y + 2, { inv: scelto })
        l.testo(MARGINE + 26, y + 3, a.nome, { scala: 2, inv: scelto })
        const k = da + i
        zona(MARGINE, y, W - 2 * MARGINE - 8, RIGA, () => { sel = k; apri(APP[k].id) })
        if (scelto && !pronta(a.id)) l.testo(W - MARGINE - 14 - Lcd.larghezza('presto'), y + 7, 'presto', { inv: true })
      }
      // la barra di scorrimento a destra
      l.vert(W - MARGINE - 3, y0, VISIBILI * RIGA)
      const h = Math.max(6, Math.round((VISIBILI * RIGA * VISIBILI) / Math.max(n, VISIBILI)))
      l.riempi(W - MARGINE - 5, y0 + Math.round(((VISIBILI * RIGA - h) * sel) / Math.max(1, n - 1)), 5, h)
    },
    tasto(n) {
      if (n === 'su') { sel = (sel - 1 + APP.length) % APP.length }
      else if (n === 'giu') { sel = (sel + 1) % APP.length }
      else if (n === 'ok') { apri(APP[sel].id); return true }
      else if (n === 'indietro') { togli(); return true }
      else return false
      if (sel < da) da = sel
      if (sel >= da + VISIBILI) da = sel - VISIBILI + 1
      return true
    },
  }
}

// ── «in arrivo»: le app che non ci sono ancora (Alberto, 29.10: «fai solo app chat completissima e se va bene… fai tutte le altre») ──
function presto(a) {
  return {
    nome: 'presto', app: a.id,
    disegna(l) {
      l.cornice(MARGINE + 2, BARRA + 6, W - 2 * MARGINE - 4, H - BARRA - 14)
      l.bitmap(icone.bitmap(a.icona, 32), MARGINE + 14, BARRA + 16)
      l.testo(MARGINE + 56, BARRA + 18, a.nome, { scala: 2 })
      l.testo(MARGINE + 56, BARRA + 38, 'in arrivo su pzk os')
      l.testo(MARGINE + 56, BARRA + 48, 'per ora c’è la chat')
      const aiuto = 'OK o INDIETRO: torna' // (i tasti per nome: ◀ in pzk os è la freccia sinistra, REGOLE.md)
      l.testo(Math.round(W / 2 - Lcd.larghezza(aiuto) / 2), H - 20, aiuto)
      zona(MARGINE + 2, BARRA + 6, W - 2 * MARGINE - 4, H - BARRA - 14, () => togli())
    },
    tasto(n) { if (n === 'indietro' || n === 'ok') { togli(); return true } return false },
  }
}

// ── il dialogo, come la DialogEx del Flipper: cornice, icona, titolo, testo, fino a tre tasti (sinistra, centro, destra) ──
export function dialogo({ titolo = '', testo = '', icona = null, tasti = ['ok'] } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE - 16 - (icona ? 30 : 0), 2) // (un nome lungo nel titolo usciva dalla cornice)
  return new Promise((risolvi) => {
    let sel = Math.min(1, tasti.length - 1)
    const v = {
      nome: 'dialogo',
      tolta: () => risolvi(null),
      disegna(l) {
        l.riempi(MARGINE, BARRA + 3, W - 2 * MARGINE, H - BARRA - 3 - MARGINE, 0)
        l.cornice(MARGINE, BARRA + 3, W - 2 * MARGINE, H - BARRA - 3 - MARGINE)
        let x = MARGINE + 8, y = BARRA + 9
        if (icona) { l.bitmap(icone.bitmap(icona, 24), x, y); x += 30 }
        if (titolo) { l.testo(x, y, titolo, { scala: 2 }); y += 18 } else y += 2
        for (const r of Lcd.acapo(testo, Math.floor((W - MARGINE - 8 - x) / 6)).slice(0, 6)) { l.testo(x, y, r); y += 9 }
        const yb = H - MARGINE - 16
        tasti.forEach((t, i) => {
          const w = Lcd.larghezza(t) + 8, xb = i === 0 ? MARGINE + 8 : i === tasti.length - 1 ? W - MARGINE - 8 - w : Math.round(W / 2 - w / 2)
          if (i === sel) l.riempi(xb, yb, w, 11)
          else l.cornice(xb, yb, w, 11)
          l.testo(xb + 4, yb + 2, t, { inv: i === sel })
          zona(xb - 2, yb - 2, w + 4, 15, () => { sel = i; risolvi(tasti[i]); togli() })
        })
      },
      tasto(n) {
        if (n === 'sx') sel = Math.max(0, sel - 1)
        else if (n === 'dx') { if (tasti.length === 1) { risolvi(tasti[0]); togli() } else sel = Math.min(tasti.length - 1, sel + 1) } // (con un tasto solo, «avanti ▶»: destra va avanti)
        else if (n === 'ok') { risolvi(tasti[sel]); togli() }
        else if (n === 'indietro') { risolvi(null); togli() }
        return true
      },
    }
    spingi(v)
  })
}

// ── la guida (Alberto, 29.10: «al primo accesso spiega come funziona»): quattro pagine, una volta sola (pzkko-zero-guida),
// e di nuovo dalle impostazioni ──
const CHIAVE_GUIDA = 'pzkko-zero-guida'
export const guidaVista = () => { try { return localStorage.getItem(CHIAVE_GUIDA) === 'si' } catch { return false } }
export async function guida(forza = false) {
  if (!forza && guidaVista()) return
  const pagine = [
    { titolo: 'pzk os', icona: 'app-home', testo: 'Questo è il tuo cercapersone. Si usa coi tasti: la croce per muoverti, OK per scegliere, INDIETRO per tornare.' },
    { titolo: 'la home', icona: 'pzk', testo: 'Qui vedi i tuoi $pzk, il livello, le sfide e le cose da fare oggi. OK apre il menu delle app, giù apre la chat.' },
    { titolo: 'la chat', icona: 'app-chat', testo: 'Scrivi un comando dalla tastiera (Invio manda) o con OK a riga vuota, dalla tastiera sullo schermo. Sopra la riga i suggerimenti: destra sceglie, OK completa.' },
    { titolo: 'spegnere', icona: 'impostazioni', testo: 'INDIETRO una volta torna indietro; tenuto tre secondi spegne e torna sul muro. Luminosità, suoni e led sono nelle impostazioni.' },
  ]
  for (let i = 0; i < pagine.length; i++) {
    const r = await dialogo({ ...pagine[i], tasti: [i < pagine.length - 1 ? 'avanti ▶' : 'ok'] })
    if (r === null) break
  }
  try { localStorage.setItem(CHIAVE_GUIDA, 'si') } catch {}
}

// ── la tastiera sullo schermo, come la TextInput del Flipper: le file di lettere, la croce sceglie, OK scrive, INDIETRO
// cancella (a testo vuoto esce), ✓ conferma. Sopra, quello che si scrive; la tastiera vera scrive lo stesso ──
const FILE = ['1234567890', 'qwertyuiop', 'asdfghjkl⌫', 'zxcvbnm␣.✓']
// con simboli (29.10, «codice C»: il C vuole graffe, parentesi, punti e virgola) tre file in più, e le file più basse
const SIMBOLI = ['(){}[]<>;=', '+-*/%&|!"\'', '#\\:?^~,@$_']
/** Un titolo che sta nella larghezza: se no, tagliato con «…» (le viste di sistema non escono mai dallo schermo). */
const adatta = (s, w, scala = 1) => { s = String(s); if (Lcd.larghezza(s, scala) <= w) return s; while (s.length > 1 && Lcd.larghezza(s + '…', scala) > w) s = s.slice(0, -1); return s + '…' }
export function tastiera({ testo = '', titolo = 'scrivi', nascosto = false, simboli = false } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE - 4)
  return new Promise((risolvi) => {
    let r = 1, c = 0, s = testo
    const F = simboli ? [...FILE.slice(0, 3), ...SIMBOLI, FILE[3]] : FILE, N = F.length
    const TX = 23, TY = simboli ? 11 : 13, X0 = MARGINE + 10, Y0 = H - MARGINE - N * TY + 2
    const v = {
      nome: 'tastiera',
      tolta: () => risolvi(null),
      disegna(l, t) {
        l.testo(MARGINE + 2, BARRA + 3, titolo)
        l.cornice(MARGINE, BARRA + 12, W - 2 * MARGINE, 13)
        const max = Math.floor((W - 2 * MARGINE - 8) / 6)
        const vero = nascosto ? '*'.repeat(s.length) : s // (nascosto: una chiave, sullo schermo solo asterischi)
        const vis = vero.length > max ? vero.slice(-max) : vero
        l.testo(MARGINE + 4, BARRA + 15, vis)
        if (t % 10 < 5) l.riempi(MARGINE + 4 + Lcd.larghezza(vis) + 2, BARRA + 14, 5, 9)
        F.forEach((fila, i) => [...fila].forEach((k, j) => {
          const x = X0 + j * TX, y = Y0 + i * TY, on = i === r && j === c
          if (on) l.riempi(x, y, TX - 2, TY - 2)
          const ch = k === '␣' ? '_' : k
          l.testo(x + Math.round((TX - 2 - Lcd.larghezza(ch)) / 2), y + (simboli ? 2 : 3), ch, { inv: on })
          zona(x - 1, y - 1, TX, TY, () => { r = i; c = j; v.tasto('ok') })
        }))
      },
      tasto(n) {
        if (n === 'su') r = (r + N - 1) % N
        else if (n === 'giu') r = (r + 1) % N
        else if (n === 'sx') c = (c + 9) % 10
        else if (n === 'dx') c = (c + 1) % 10
        else if (n === 'ok') {
          const k = [...F[r]][c]
          if (k === '⌫') s = s.slice(0, -1)
          else if (k === '✓') { risolvi(s); togli() }
          else s += k === '␣' ? ' ' : k
        } else if (n === 'indietro') { if (s) s = s.slice(0, -1); else { risolvi(null); togli() } }
        return true
      },
      carattere(ch) { s += ch },
      cancella() { s = s.slice(0, -1) },
      scrivendo: () => s.length > 0,
      invio() { risolvi(s); togli() },
    }
    spingi(v)
  })
}

// ── il tastierino dei numeri (29.10, la calcolatrice: le misure, le coordinate anche negative, gli angoli in gradi primi e
// secondi): come la tastiera, ma coi tasti grandi. Il meno cambia il segno, la virgola è il decimale; con gradi ci sono
// anche ° ' ". La tastiera vera scrive lo stesso; INDIETRO cancella, a vuoto esce (null) ──
const NUMERI = [['7', '8', '9', '−', '⌫'], ['4', '5', '6', ',', '°'], ['1', '2', '3', "'", '"'], ['0', '✓']]
export function numero({ testo = '', titolo = 'il numero', gradi = false } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE - 4)
  const file = NUMERI.map((f) => (gradi ? f : f.filter((k) => !['°', "'", '"'].includes(k))))
  return new Promise((risolvi) => {
    let r = 3, c = 0, s = String(testo), avviso = 0
    const TY = 19, Y0 = BARRA + 30
    const segno = () => { s = s.startsWith('-') ? s.slice(1) : '-' + s }
    const metti = (k) => { if (k === '−') segno(); else if (k === '⌫') s = s.slice(0, -1); else if (k === '✓') { risolvi(s); togli() } else if (s.length < 24) s += k }
    const v = {
      nome: 'numero',
      tolta: () => risolvi(null),
      tic() { if (avviso > 0) { avviso--; ridisegna() } },
      disegna(l, t) {
        l.testo(MARGINE + 2, BARRA + 3, titolo)
        l.cornice(MARGINE, BARRA + 12, W - 2 * MARGINE, 13)
        const vis = s.length > 38 ? s.slice(-38) : s
        l.testo(MARGINE + 4, BARRA + 15, vis)
        if (t % 10 < 5) l.riempi(MARGINE + 4 + Lcd.larghezza(vis) + 2, BARRA + 14, 5, 9)
        file.forEach((fila, i) => {
          const TX = Math.floor((W - 2 * MARGINE - 16) / (i === 3 ? 2 : fila.length)), X0 = MARGINE + 8
          fila.forEach((k, j) => {
            const x = X0 + j * TX, y = Y0 + i * TY, on = i === r && j === c
            if (on) l.riempi(x, y, TX - 3, TY - 3); else l.cornice(x, y, TX - 3, TY - 3)
            const eti = k === '✓' ? '✓ fatto' : k
            l.testo(x + Math.round((TX - 3 - Lcd.larghezza(eti)) / 2), y + 5, eti, { inv: on })
            zona(x - 1, y - 1, TX - 1, TY - 1, () => { r = i; c = j; v.tasto('ok') })
          })
        })
      },
      tasto(n) {
        if (n === 'su') { r = (r + file.length - 1) % file.length; c = Math.min(c, file[r].length - 1) }
        else if (n === 'giu') { r = (r + 1) % file.length; c = Math.min(c, file[r].length - 1) }
        else if (n === 'sx') c = (c + file[r].length - 1) % file[r].length
        else if (n === 'dx') c = (c + 1) % file[r].length
        else if (n === 'ok') metti(file[r][c])
        else if (n === 'indietro') { if (s) s = s.slice(0, -1); else { risolvi(null); togli() } }
        return true
      },
      carattere(ch) { if (ch === '-') segno(); else if (/^[0-9.,]$/.test(ch) || (gradi && /^[°'"]$/.test(ch))) metti(ch === '.' ? ',' : ch) },
      cancella() { s = s.slice(0, -1) },
      scrivendo: () => s.length > 0,
      invio() { risolvi(s); togli() },
    }
    spingi(v)
  })
}

// ── le cifre (29.10, l'app account: il PIN, l'indirizzo, quanti $pzk): n caselle grandi; ↑ ↓ cambiano la cifra della
// casella scelta, ← → si spostano, le cifre si scrivono anche dalla tastiera vera; nascoste (il PIN) mostrano un asterisco,
// tranne la casella che stai cambiando. OK conferma quando ce ne sono almeno «min»; INDIETRO toglie l'ultima, a vuoto esce ──
export function cifre({ titolo = 'le cifre', n = 4, min = n, nascoste = false, testo = '', prima = '' } = {}) {
  titolo = adatta(titolo, W - 2 * MARGINE)
  return new Promise((risolvi) => {
    let s = String(testo).replace(/\D/g, '').slice(0, n), c = Math.min(s.length, n - 1), avviso = 0
    const LATO = n > 6 ? 18 : 24, x0 = Math.round(W / 2 - (n * LATO + Lcd.larghezza(prima, 2) + (prima ? 4 : 0)) / 2) + (prima ? Lcd.larghezza(prima, 2) + 4 : 0), y0 = BARRA + 34
    const metti = (d) => { if (c < s.length) s = s.slice(0, c) + d + s.slice(c + 1); else if (s.length < n) s += d; c = Math.min(c + 1, n - 1, s.length) }
    const gira = (k) => { const d = c < s.length ? Number(s[c]) : k > 0 ? -1 : 10; const nuova = String((d + k + 10) % 10); if (c < s.length) s = s.slice(0, c) + nuova + s.slice(c + 1); else if (s.length < n) s += nuova }
    const fatto = () => { if (s.length >= min) { risolvi(s); togli() } else avviso = 15 }
    const v = {
      nome: 'cifre',
      tolta: () => risolvi(null),
      tic() { if (avviso > 0) { avviso--; ridisegna() } },
      disegna(l, t) {
        l.testo(Math.round(W / 2 - Lcd.larghezza(titolo) / 2), BARRA + 6, titolo)
        if (prima) l.testo(x0 - Lcd.larghezza(prima, 2) - 4, y0 + (LATO - 14) / 2, prima, { scala: 2 })
        for (let k = 0; k < n; k++) {
          const x = x0 + k * LATO, on = k === c
          if (on) l.riempi(x, y0, LATO - 2, LATO); else l.cornice(x, y0, LATO - 2, LATO)
          const ch = k < s.length ? (nascoste && !on ? '*' : s[k]) : on && t % 10 < 5 ? '_' : ''
          if (ch) l.testo(x + Math.round((LATO - 2 - Lcd.larghezza(ch, 2)) / 2), y0 + Math.round((LATO - 14) / 2), ch, { scala: 2, inv: on })
          zona(x, y0, LATO - 2, LATO, () => { c = Math.min(k, s.length, n - 1) })
        }
        // le frecce sopra e sotto la casella scelta: si cliccano anche
        const xc = x0 + c * LATO + Math.round((LATO - 2 - 5) / 2)
        l.testo(xc, y0 - 10, '↑'); zona(xc - 4, y0 - 12, 13, 11, () => gira(1))
        l.testo(xc, y0 + LATO + 3, '↓'); zona(xc - 4, y0 + LATO + 1, 13, 11, () => gira(-1))
        const a = avviso ? `servono almeno ${min} cifre` : s.length >= min ? '↑↓ cifra · ←→ sposta · OK fatto' : '↑↓ cifra · ←→ sposta · o scrivile'
        l.testo(Math.round(W / 2 - Lcd.larghezza(a) / 2), H - 9, a, { inv: !!avviso })
        if (s.length >= min) zona(Math.round(W / 2 - Lcd.larghezza(a) / 2), H - 11, Lcd.larghezza(a), 11, fatto)
      },
      tasto(k) {
        if (k === 'su') gira(1)
        else if (k === 'giu') gira(-1)
        else if (k === 'sx') c = Math.max(0, c - 1)
        else if (k === 'dx') c = Math.min(c + 1, s.length, n - 1)
        else if (k === 'ok') fatto()
        else if (k === 'indietro') { if (s) { s = s.slice(0, -1); c = Math.min(c, s.length) } else { risolvi(null); togli() } }
        else return false
        return true
      },
      carattere(ch) { if (/^[0-9]$/.test(ch)) metti(ch) },
      cancella() { s = s.slice(0, -1); c = Math.min(c, s.length) },
      scrivendo: () => s.length > 0,
      invio: () => fatto(),
    }
    spingi(v)
  })
}
