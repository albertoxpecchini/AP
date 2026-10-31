// L'app «miniera» di pzk os (29.10, Alberto: «crea uno alla volta … miniera …»): la postazione che mina $pzk, sul
// cercapersone zero. Le regole, il catalogo, i conti e lo stato sono quelli di chat/miniera.js; i disegni sono la pixel art
// di chat/miniera-pixel.js (componi, componiPezzo), portata a un bit qui (i colori diventano luce, col retino di Bayer); i
// numeri di un pezzo in una riga vengono dalla miniera del cercapersone vecchio (telefono/app/miniera.js: statsTesto).
// - LA POSTAZIONE: la scena in piccolo, i $pzk maturati (crescono da soli, una volta al secondo) con la barra della memoria,
//   la produzione, la temperatura, l'hash, l'efficienza, gli avvisi. OK incassa; ↓ la guardi a schermo intero (200 × 125, i
//   pixel veri del disegno).
// - I PEZZI: le dodici categorie, ognuna col pezzo montato (o «manca»). OK apre il negozio della categoria: i pezzi col loro
//   disegno, il prezzo, se li hai o sono montati; OK la scheda: il disegno 38 × 38, i numeri, cosa è, se va bene col resto,
//   e i tasti compra, monta (o monta +1), smonta o vendi.
// - I PC PRONTI: le postazioni già pensate; la scheda mostra il disegno, la produzione e «compra e monta» (si conferma).
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as M from '../../../chat/miniera.js'
import * as P from '../../../chat/miniera-pixel.js'
import { fmt, fmtCorto } from '../../../games/pzk.js'
import { statsTesto, perOra, montatoDi } from '../../app/miniera.js'
import { txt, corto, destra, centro, puntini, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni } from './pezzi.js'

// ── la pixel art a un bit: la luce di ogni pixel (o la media di 2 × 2, a metà), i livelli stirati, il retino di Bayer ──
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
// (negativo: la scena è una stanza buia con le cose accese; sull'lcd il buio diventa carta e la luce inchiostro, come un
// disegno a tratto: dritta veniva quasi tutta nera. I pezzi da soli, su fondo trasparente, restano dritti)
function unBit(t, mezzo = false, negativo = false) {
  const k = mezzo ? 2 : 1, w = Math.floor(t.w / k), h = Math.floor(t.h / k), lum = new Float32Array(w * h).fill(-1)
  let lo = 1, hi = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const c = t.pixel[(y * k + j) * t.w + x * k + i]; if (c >= 0) { s += (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255; n++ } }
    if (n) { const v = s / n; lum[y * w + x] = v; lo = Math.min(lo, v); hi = Math.max(hi, v) }
  }
  // in negativo il muro (il colore più usato) e quelli appena più chiari sono carta piena: la luce si conta da lì in su
  let fondo = lo
  if (negativo) { const conta = new Map(); for (const c of t.pixel) if (c >= 0) conta.set(c, (conta.get(c) ?? 0) + 1); const [c] = [...conta].sort((a, b) => b[1] - a[1])[0] ?? [0]; fondo = (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255 + 0.03 }
  const bit = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v0 = lum[y * w + x]
    if (v0 < 0 || (negativo && v0 <= fondo)) continue
    const v = negativo ? 1 - (v0 - fondo) / Math.max(0.05, hi - fondo) : (v0 - lo) / Math.max(0.05, hi - lo)
    if (v < (BAYER[y & 3][x & 3] + 0.5) / 16) bit[y * w + x] = 1
  }
  return { w, h, bit }
}
const cache = new Map()
const scena = (montati, mezzo) => { const k = `s:${mezzo}:${JSON.stringify(montati)}`; if (!cache.has(k)) cache.set(k, unBit(P.componi(montati), mezzo, true)); return cache.get(k) }
const disegno = (id, mezzo) => { const k = `p:${mezzo}:${id}`; if (!cache.has(k)) cache.set(k, unBit(P.componiPezzo(id), mezzo)); return cache.get(k) }
const nomeCat = (id) => M.CATEGORIE.find((k) => k.id === id)?.nome ?? id
const gradi = (c) => `${Math.round(c.temperatura ?? 0)} °C`

// ── la postazione a schermo intero ──
function grande(os, montati = null, titolo = 'la tua postazione') {
  return {
    nome: 'miniera-grande', app: 'miniera', senzaBarra: true,
    disegna(l) {
      const b = scena(montati ?? M.stato().montati, false)
      l.bitmap(b, Math.round(W / 2 - b.w / 2), Math.round(H / 2 - b.h / 2))
      // il titolo in cima e il suggerimento in fondo, su un fondo pulito con un pixel d'aria (4.5): lì c'è solo il muro e il
      // pavimento (la scena parte dalla riga 2: il case grande sul tavolo arriva su fino alla 12, la sedia giù fino alla 114)
      const fascia = (y, s) => { const w = Lcd.larghezza(s), x = Math.round(W / 2 - w / 2); l.riempi(x - 2, y - 1, w + 4, 9, 0); l.testo(x, y, s) }
      fascia(2, corto(titolo, 36))
      fascia(H - 9, 'OK o INDIETRO torna')
      os.zona(0, 0, W, H, () => os.togli())
    },
    tasto(k) { if (k === 'indietro' || k === 'ok' || k === 'su') { os.togli(); return true } return true },
  }
}

// ── la scheda di un pezzo ──
function schedaPezzo(os, id) {
  const p = M.pezzo(id)
  let sel = 0, giu = 0, esito = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const tasti = () => {
    const st = M.stato(), m = montatoDi(st.montati, p.cat), ho = st.posseduti?.[p.id] ?? 0, montato = m?.id === p.id
    const ci = montato ? { ok: true } : M.compatibile(p.cat, p.id, 1), multipla = M.CATEGORIE.find((k) => k.id === p.cat)?.multipla
    // «monta +1» solo se ce n'è un altro da montare e c'è posto (prima c'era anche con tutti montati o gli slot pieni)
    const piu = montato && multipla && ho > m.n && M.compatibile(p.cat, p.id, m.n + 1).ok
    const t = [{ eti: `compra ${fmt(p.prezzo)}`, fai: 'compra' }]
    if (montato ? piu : ho && ci.ok) t.push({ eti: montato ? 'monta +1' : 'monta', fai: 'monta' })
    if (montato) t.push({ eti: 'smonta', fai: 'smonta' }); else if (ho) t.push({ eti: 'vendi', fai: 'vendi' })
    return t
  }
  // il testo che scorre: lo leggono disegna e tasto (↓ si ferma all'ultima riga, senza che disegna corregga giu)
  const VIS = 4
  const leggibile = () => {
    const montato = montatoDi(M.stato().montati, p.cat)?.id === p.id, ci = montato ? { ok: true } : M.compatibile(p.cat, p.id, 1)
    return impagina([...(ci.ok ? [] : [{ testo: `non va: ${ci.errore}` }]), ...(p.descr ? [{ testo: p.descr }] : []), { testo: statsTesto(p) }])
  }
  // (31.10) le azioni sono della banca (chat/miniera.js): una alla volta, i tasti non ne mandano un'altra mentre risponde
  let occupato = false
  async function premi(t) {
    if (!t || occupato) return
    occupato = true
    try { await fai(t) } finally { occupato = false }
  }
  async function fai(t) {
    const avvisi = (r) => (r.avvisi?.length ? ` · ${r.avvisi.join(' ')}` : '')
    if (t.fai === 'compra') {
      const s = await os.dialogo({ titolo: 'compri?', testo: `${p.nome} per ${fmt(p.prezzo)} $pzk.`, tasti: ['no', 'sì'] })
      if (s !== 'sì' || os.corrente() !== v) return
      const r = await M.compra(p.id); if (os.corrente() !== v) return; if (!r.ok) return dì(false, r.errore ?? 'non si può'); os.suoni.sigla('miniera'); return dì(true, `comprato${avvisi(r)}`)
    }
    if (t.fai === 'monta') { const m = montatoDi(M.stato().montati, p.cat), r = await (m?.id === p.id ? M.monta(p.cat, p.id, m.n + 1) : M.monta(p.cat, p.id)); if (os.corrente() !== v) return; if (!r.ok) return dì(false, r.errore ?? 'non si può'); const n = montatoDi(M.stato().montati, p.cat)?.n ?? 1; return dì(true, `montato${n > 1 ? ` ×${n}` : ''}${avvisi(r)}`) }
    if (t.fai === 'smonta') { const r = await M.smonta(p.cat); if (os.corrente() !== v) return; return r.ok ? dì(true, 'smontato') : dì(false, r.errore ?? 'non si può') }
    if (t.fai === 'vendi') {
      const s = await os.dialogo({ titolo: 'vendi?', testo: `${p.nome}: te lo ripagano meno di quanto costa.`, tasti: ['no', 'vendi'] })
      if (s !== 'vendi' || os.corrente() !== v) return
      const r = await M.vendi(p.id); if (os.corrente() !== v) return; return r.ok ? dì(true, `venduto: +${fmt(r.reso ?? 0)} $pzk`) : dì(false, r.errore ?? 'non si può')
    }
  }
  const v = {
    nome: 'miniera-pezzo', app: 'miniera',
    entra() { v.via = [M.ascolta?.(() => os.ridisegna())] },
    esci() { v.via?.forEach((f) => f?.()) },
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      const st = M.stato(), m = montatoDi(st.montati, p.cat), ho = st.posseduti?.[p.id] ?? 0, montato = m?.id === p.id
      const b = disegno(p.id, false)
      l.bitmap(b, 8 + Math.round((38 - b.w) / 2), 13); l.riquadro(6, 12, 41, 41)
      l.testo(52, 14, corto(p.nome, 32))
      l.testo(52, 23, corto(`${nomeCat(p.cat)} · livello ${p.livello ?? 1}`, 32))
      l.testo(52, 32, corto(`${fmt(p.prezzo)} $pzk${ho ? ` · ne hai ${ho}` : ''}${montato ? ` · montat${m.n > 1 ? `i ${m.n}` : 'o'}` : ''}`, 32))
      l.testo(52, 41, corto(statsTesto(p), 32))
      const righe = leggibile()
      scorrevole(l, righe, { y0: 57, vis: VIS, giu }) // (giu e sel li tiene in riga tasto: disegna non cambia lo stato, 4.8)
      const T = tasti(), s = sel < T.length ? sel : 0 // (i tasti possono essere diminuiti: si disegna il primo)
      bottoni(l, os.zona, { etichette: T.map((x) => x.eti), sel: s, y: 99, premi: (i) => { sel = i; premi(T[i]) } })
      if (!striscia(l, { esito }, t)) centro(l, H - 9, `${T.length > 1 ? '←→ sceglie · ' : ''}OK preme${righe.length > VIS ? ' · ↑↓ legge' : ''}`)
    },
    tasto(k) {
      const T = tasti(), fondo = Math.max(0, leggibile().length - VIS)
      if (sel >= T.length) sel = 0
      if (k === 'sx') sel = (sel - 1 + T.length) % T.length
      else if (k === 'dx') sel = (sel + 1) % T.length
      else if (k === 'su') giu = Math.max(0, Math.min(giu, fondo) - 1)
      else if (k === 'giu') giu = Math.min(fondo, giu + 1)
      else if (k === 'ok') premi(T[sel])
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── il negozio di una categoria ──
function categoria(os, cat) {
  const st = { sel: 0, da: 0 }
  const voci = () => M.catalogo(cat)
  return {
    nome: 'miniera-categoria', app: 'miniera',
    entra() { this.via = [M.ascolta?.(() => os.ridisegna())] },
    esci() { this.via?.forEach((f) => f?.()) },
    disegna(l) {
      const k = M.CATEGORIE.find((x) => x.id === cat), m = montatoDi(M.stato().montati, cat)
      l.bitmap(icone.bitmap('app-miniera', 16), 8, 14); l.testo(28, 18, corto(`${nomeCat(cat)}${k?.obbligatoria ? '' : ' · facoltativo'}${k?.multipla ? ' · più d’uno' : ''}`, 36)); l.orizz(6, 31, W - 12)
      elenco(l, os.zona, {
        voci: voci(), stato: st, y0: 33, alta: 84, passo: 21,
        clic: (p) => os.spingi(schedaPezzo(os, p.id)),
        riga(l, p, x0, y, w, on) {
          const o = { inv: on }, ho = M.stato().posseduti?.[p.id] ?? 0, montato = m?.id === p.id
          const b = disegno(p.id, true)
          l.bitmap(b, x0 - 2, y + 1, o)
          const s = montato ? `montat${m.n > 1 ? `i ${m.n}` : 'o'}` : ho ? `ne hai ${ho}` : fmt(p.prezzo)
          destra(l, x0 + w, y + 2, s, o)
          l.testo(x0 + 22, y + 2, corto(p.nome, Math.floor((w - 22 - Lcd.larghezza(s) - 6) / 6)), o)
          l.testo(x0 + 22, y + 11, corto(statsTesto(p), Math.floor((w - 22) / 6)), o)
        },
      })
      centro(l, H - 9, 'OK la scheda · ↑↓ sceglie')
    },
    tasto(k) { if (muovi(st, voci().length, k)) return true; if (k === 'ok') { const p = voci()[st.sel]; if (p) os.spingi(schedaPezzo(os, p.id)); return true } if (k === 'indietro') { os.togli(); return true } return false },
  }
}

// ── la scheda di un PC pronto ──
function schedaPronto(os, id) {
  let esito = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const pc = () => M.PRONTI.find((x) => x.id === id)
  let occupato = false
  async function compra() {
    if (occupato) return
    const p = pc()
    const s = await os.dialogo({ titolo: p.prezzo ? 'compri?' : 'monti?', testo: p.prezzo ? `${p.nome}: compri i pezzi che non hai (${fmt(p.prezzo)} $pzk) e si monta tutto.` : `${p.nome}: hai già tutto, si monta.`, tasti: ['no', 'sì'] })
    if (s !== 'sì' || os.corrente() !== v) return
    occupato = true
    const r = await M.compraPronto(p.id).finally(() => { occupato = false }) // (31.10: la banca, coi suoi prezzi)
    if (os.corrente() !== v) return
    if (!r.ok) return dì(false, r.errore ?? 'non si può')
    os.suoni.sigla('miniera')
    dì(true, `${p.nome}: montato`)
  }
  const v = {
    nome: 'miniera-pronto', app: 'miniera',
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      const p = pc(), c = M.calcola(p.pezzi ?? {}), b = scena(p.pezzi ?? {}, true)
      l.bitmap(b, 8, 14); l.riquadro(7, 13, b.w + 2, b.h + 2)
      const x0 = 8 + b.w + 8, n = Math.floor((245 - x0) / 6)
      Lcd.acapo(txt(p.nome), n).slice(0, 2).forEach((r, i) => l.testo(x0, 15 + i * 9, r))
      l.testo(x0, 35, corto(c.completa ? perOra(c.perOra) : 'non completa', n))
      l.testo(x0, 44, corto(p.prezzo ? `${fmt(p.prezzo)} $pzk` : 'ce l’hai già tutto', n))
      if (p.prezzo < p.listino) { const s = fmt(p.listino); l.testo(x0, 53, s); l.orizz(x0 - 1, 56, Lcd.larghezza(s) + 2) } // (il listino, barrato: paghi solo quello che manca)
      const dr = Lcd.acapo(txt(p.descr ?? ''), 39) // (sotto la miniatura; se è più lunga di due righe, la seconda finisce coi puntini)
      ;[dr[0] ?? '', dr.length > 2 ? corto(dr.slice(1).join(' '), 39) : dr[1] ?? ''].forEach((r, i) => l.testo(10, 80 + i * 9, r))
      bottoni(l, os.zona, { etichette: [p.prezzo ? 'compra e monta' : 'monta'], sel: 0, y: 99, premi: () => compra() })
      if (!striscia(l, { esito }, t)) centro(l, H - 9, 'OK preme · ↓ la guardi grande')
    },
    tasto(k) { if (k === 'ok') compra(); else if (k === 'indietro') os.togli(); else if (k === 'giu') os.spingi(grande(os, pc().pezzi ?? {}, pc().nome)); else return false; return true },
  }
  return v
}

// ── le pagine ──
let ultima = 0
export function vista(os) {
  const stP = { sel: 0, da: 0 }, stR = { sel: 0, da: 0 }
  const incassa = async (x) => {
    const c = M.calcola(), mat = M.maturati()
    if (!c.completa) return x.dì(false, c.manca.length ? `mancano: ${c.manca.map(nomeCat).join(', ')}` : c.avvisi?.[0] ?? 'i pezzi non si incastrano')
    if (mat < 0.5) return x.dì(false, 'non c’è ancora niente da incassare')
    const r = await x.aspetta('incasso', () => M.incassa()) // (31.10: conta la banca, con la sua ora)
    if (!r || !x.qui()) return
    if (!r.ok) return x.dì(false, r.errore ?? 'non si può')
    os.suoni.sigla('moneta')
    x.dì(true, `incassati +${fmt(r.n)} $pzk`)
  }
  const pPostazione = {
    nome: 'la postazione', icona: 'app-miniera',
    aiuto: () => (M.calcola().completa ? 'OK incassa · ↓ la guardi · ←→ pagine' : '↓ la guardi · ←→ pagine'),
    ok: incassa,
    tic: (t) => t % 10 === 0 && M.calcola().completa, // (i maturati crescono, una volta al secondo)
    disegna(l, x) {
      const c = M.calcola(), mat = M.maturati(), cap = c.perOra * c.capienzaOre, k = c.completa && cap > 0 ? Math.min(1, mat / cap) : 0
      const b = scena(M.stato().montati, true)
      l.bitmap(b, 8, 34); l.riquadro(7, 33, b.w + 2, b.h + 2)
      x.zona(7, 33, b.w + 2, b.h + 2, () => os.spingi(grande(os)))
      const x0 = 8 + b.w + 8, n = Math.floor((245 - x0) / 6)
      if (c.completa) {
        l.testo(x0, 34, 'maturati')
        l.testo(x0, 43, corto(`${fmt(Math.floor(mat * 10) / 10)} $pzk`, n))
        l.riquadro(x0, 53, 245 - x0, 5); l.riempi(x0 + 1, 54, Math.round((243 - x0) * k), 3)
        l.testo(x0, 61, corto(k >= 1 ? 'memoria piena!' : `memoria ${fmt(c.capienzaOre)} ore`, n))
        l.testo(x0, 72, corto(perOra(c.perOra), n))
        l.testo(x0, 81, corto(`${gradi(c)} · hash ${fmtCorto(c.hash ?? 0)}`, n))
        l.testo(x0, 90, corto(`resa ${Math.round((c.efficienza ?? 0) * 100)} % · × ${(Math.round((c.moltiplicatore ?? 1) * 100) / 100).toLocaleString('it-IT')}`, n))
      } else {
        // spenta: o mancano dei pezzi, o ci sono tutti ma non si incastrano (calcola mette quei problemi in cima agli avvisi:
        // prima qui restava «mancano» con niente dopo)
        const manca = c.manca.length > 0, R = Lcd.acapo(txt(manca ? c.manca.map(nomeCat).join(', ') : c.avvisi?.[0] ?? 'i pezzi non si incastrano'), n)
        l.testo(x0, 34, manca ? 'spenta: mancano' : 'spenta, perché:')
        ;[...R.slice(0, 4), ...(R.length > 5 ? [corto(R.slice(4).join(' '), n)] : R.slice(4, 5))].forEach((r, i) => l.testo(x0, 44 + i * 9, r)) // (la quinta riga coi puntini, se ce n'è ancora)
      }
      const avviso = c.completa || c.manca.length ? c.avvisi?.[0] : c.avvisi?.[1] // (il problema già scritto a destra non si ripete sotto)
      if (avviso) l.testo(10, 104, corto(`! ${avviso}`, 39))
    },
    tasto(k) { if (k === 'giu') { os.spingi(grande(os)); return true } return false },
  }
  const pPezzi = {
    nome: 'i pezzi', icona: 'impostazioni',
    aiuto: 'OK il negozio del pezzo · ↑↓ · ←→',
    ok: () => os.spingi(categoria(os, M.CATEGORIE[stP.sel].id)),
    disegna(l, x) {
      const mont = M.stato().montati
      elenco(l, x.zona, {
        voci: M.CATEGORIE, stato: stP, y0: 33, alta: 84, passo: 21,
        clic: (k) => os.spingi(categoria(os, k.id)),
        riga(l, k, x0, y, w, on) {
          const o = { inv: on }, m = montatoDi(mont, k.id), p = m && M.pezzo(m.id)
          if (p) l.bitmap(disegno(p.id, true), x0 - 2, y + 1, o); else l.riquadro(x0, y + 3, 15, 15, on ? 0 : 1)
          const s = m && m.n > 1 ? `×${m.n}` : ''
          if (s) destra(l, x0 + w, y + 2, s, o)
          l.testo(x0 + 22, y + 2, corto(`${k.nome}${k.obbligatoria ? '' : ' · facoltativo'}`, Math.floor((w - 22 - Lcd.larghezza(s) - 6) / 6)), o)
          l.testo(x0 + 22, y + 11, corto(p ? p.nome : k.obbligatoria ? 'manca!' : 'niente', Math.floor((w - 22) / 6)), o)
        },
      })
    },
    tasto(k) { return muovi(stP, M.CATEGORIE.length, k) },
  }
  const pPronti = {
    nome: 'i pc pronti', icona: 'app-compilatore',
    aiuto: 'OK la scheda · ↑↓ · ←→ pagine',
    ok: () => os.spingi(schedaPronto(os, M.PRONTI[stR.sel].id)),
    disegna(l, x) {
      elenco(l, x.zona, {
        voci: M.PRONTI, stato: stR, y0: 33, alta: 84, passo: 21,
        clic: (p) => os.spingi(schedaPronto(os, p.id)),
        riga(l, p, x0, y, w, on) {
          const o = { inv: on }, c = M.calcola(p.pezzi ?? {})
          const s = p.prezzo ? fmt(p.prezzo) : 'ce l’hai'
          destra(l, x0 + w, y + 2, s, o)
          l.testo(x0, y + 2, corto(p.nome, Math.floor((w - Lcd.larghezza(s) - 6) / 6)), o)
          l.testo(x0, y + 11, corto(c.completa ? perOra(c.perOra) : '', Math.floor(w / 6)), o)
        },
      })
    },
    tasto(k) { return muovi(stR, M.PRONTI.length, k) },
  }
  return pagine(os, {
    nome: 'miniera', app: 'miniera', iniziale: ultima,
    pagine: [pPostazione, pPezzi, pPronti],
    ascolta: [(f) => M.ascolta?.(f)],
    esci: (x) => { ultima = x.pag },
  })
}
