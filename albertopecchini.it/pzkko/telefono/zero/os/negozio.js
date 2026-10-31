// L'app «shop» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, … falle tutte maniacalmente perfette»): lo
// shop dei $pzk sul cercapersone zero. La logica è quella dello shop del cercapersone vecchio (telefono/app/negozio.js: la
// scelta dei prodotti, il pagamento, il conto alla rovescia, lo stesso carrello e gli stessi preferiti) e della chat
// (chat/testi.js, chat/oggetti.js, chat/mercato.js): quello che compri qui lo trovi nello zaino e viceversa.
// - LE PAGINE (← →): le offerte del giorno (finiscono a mezzanotte), tutto lo shop, i cinque reparti, il carrello. In cima a
//   ogni lista la riga dell'ordine (OK: le opzioni); scrivendo dalla tastiera si cerca (⌫ cancella, INDIETRO toglie la ricerca).
// - LA SCHEDA: l'icona grande, il prezzo (barrato e scontato in offerta), la descrizione che scorre con ↑ ↓, i bonus; sotto i
//   tasti ♥ − + carrello compra (← → li scelgono). Comprare si conferma; poi lo scontrino, che si stampa riga per riga.
// - IL CARRELLO: le righe (OK: togli, una in meno, una in più), paga (si conferma), svuota.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { PER_ID } from '../../../chat/testi.js'
import { REPARTI, testoBonus } from '../../../chat/oggetti.js'
import * as mercato from '../../../chat/mercato.js'
import { prodotti, ORDINI, CHIAVE_CARRELLO, CHIAVE_PREF, contoAllaRovescia, compraRighe } from '../../app/negozio.js'
import { txt, corto, destra, centro, puntini, elenco, muovi, pagine, striscia } from './pezzi.js'

// ── il carrello e i preferiti: gli stessi dello shop vecchio (localStorage), letti ogni volta ──
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const carrello = () => leggi(CHIAVE_CARRELLO, {})
const righeCarrello = () => Object.entries(carrello()).filter(([id, n]) => PER_ID[id] && n > 0)
const pezzi = () => righeCarrello().reduce((a, [, n]) => a + n, 0)
const totale = () => righeCarrello().reduce((a, [id, n]) => a + mercato.prezzoDi(PER_ID[id]) * n, 0)
const risparmio = () => righeCarrello().reduce((a, [id, n]) => a + (PER_ID[id].prezzo - mercato.prezzoDi(PER_ID[id])) * n, 0)
const metti = (id, n) => { const c = carrello(); if (n > 0) c[id] = Math.min(50, n); else delete c[id]; scrivi(CHIAVE_CARRELLO, c) }
const preferiti = () => new Set(leggi(CHIAVE_PREF, []))
const cuore = (id) => { const p = preferiti(); if (p.has(id)) p.delete(id); else p.add(id); scrivi(CHIAVE_PREF, [...p]) }
const fmt = (n) => pzk.fmt(n)
const pct = (s) => `-${Math.round(s * 100)}%`
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
// la cassa (la banca, 'chat.carrello') prende solo i $pzk puliti e in galera non vende: qui si conta come lei, non col saldo
const puliti = () => pzk.puliti()
const pul = () => (pzk.sporchi() > 0 ? ' puliti' : '') // (detto solo se ci sono anche gli sporchi)
/** Perché non si possono spendere t $pzk (null: si può). */
const nonPuoi = (t) => (pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}` : t > puliti() ? `ti mancano ${fmt(t - puliti())} $pzk${pul()}` : null)
/** Un'icona sempre: quella del prodotto (webp di Alberto, arriva dopo: icone.ascolta ridisegna), intanto quella dello shop. */
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-shop', lato)
const ce = (x) => x.unico && zaino.ha(x.id)

// le scelte della vetrina: restano finché la pagina è aperta
let ordine = 'top', solo = false, cerca = '', ultima = 0

/** Mette nel carrello; → il testo per la striscia. */
function aggiungi(x, n) {
  if (ce(x)) return [false, 'ce l’hai già nello zaino']
  const prima = carrello()[x.id] ?? 0
  metti(x.id, x.unico ? 1 : Math.min(50, prima + n))
  return [true, `${x.nome} nel carrello (${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'})`]
}

// ── lo scontrino: si stampa una riga alla volta ──
function scontrino(os, s, alla) {
  let stampate = 0
  const righe = [...s.righe.map((r) => ({ a: `${r.n} × ${PER_ID[r.id].nome}`, b: fmt(r.tot) })), ...(s.risparmio ? [{ a: 'sconti di oggi', b: `-${fmt(s.risparmio)}` }] : [])]
  const VIS = 4
  const v = {
    nome: 'negozio-scontrino', app: 'negozio',
    entra() { os.suoni.sigla('negozio') },
    tic(t) { if (stampate < righe.length + 3 && t % 2 === 0) { stampate++; os.suoni.bip('cursore'); return os.ridisegna() } },
    disegna(l) {
      centro(l, os.BARRA + 3, 'pzk shop')
      centro(l, os.BARRA + 12, new Date(s.t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      for (let x = 12; x < W - 12; x += 4) l.riempi(x, os.BARRA + 22, 2, 1) // il tratteggio dello scontrino
      const mostra = righe.slice(0, Math.min(stampate, VIS))
      mostra.forEach((r, i) => puntini(l, os.BARRA + 25 + i * 9, corto(r.a, 28), r.b, { x0: 14, x1: 241 }))
      if (righe.length > VIS && stampate > VIS) l.testo(14, os.BARRA + 25 + VIS * 9, corto(`e altre ${righe.length - VIS} righe`, 37))
      const yt = os.BARRA + 25 + (Math.min(righe.length, VIS) + (righe.length > VIS ? 1 : 0)) * 9 + 2
      if (stampate > righe.length) { for (let x = 12; x < W - 12; x += 4) l.riempi(x, yt, 2, 1); puntini(l, yt + 3, 'TOTALE $PZK', fmt(s.tot), { x0: 14, x1: 241 }) }
      if (stampate > righe.length + 1) centro(l, yt + 13, corto(`saldo: ${fmt(pzk.saldo())} $pzk`, 38))
      if (stampate > righe.length + 2) centro(l, yt + 22, 'grazie, e arrivederci')
      const a = 'OK continua · → apre lo zaino', xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
      l.testo(xa, H - 9, a)
      os.zona(xa - 3, H - 11, Lcd.larghezza('OK continua') + 6, 11, () => alla())
      os.zona(xa + Lcd.larghezza('OK continua · ') - 3, H - 11, Lcd.larghezza('→ apre lo zaino') + 6, 11, () => { alla(); os.apri('zaino') })
    },
    tasto(k) {
      if (k === 'ok' || k === 'indietro') alla()
      else if (k === 'dx') { alla(); os.apri('zaino') }
      else return false
      return true
    },
  }
  return v
}

// ── la scheda di un prodotto ──
function scheda(os, x, alla) {
  let n = 1, giu = 0, sel = -1, esito = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 4000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const tot = () => mercato.prezzoDi(x) * (x.unico ? 1 : n)
  const bottoni = () => (ce(x) ? ['♥'] : x.unico ? ['♥', 'carrello', `compra ${fmt(tot())}`] : ['♥', '−', '+', 'carrello', `compra ${fmt(tot())}`])
  const tieni = () => { const nb = bottoni().length; if (sel < 0 || sel >= nb) sel = nb - 1 } // (di partenza, o se i tasti sono diventati meno: compra)
  const reparto = REPARTI.find(([id]) => id === x.reparto)
  const desc = () => { const b = testoBonus(x.bonus), d = x.tipo === 'usa' && x.effetto ? `per ${Math.round(x.effetto / 60000)} minuti` : x.unico ? 'finché ce l’hai' : ''; return Lcd.acapo(txt(`${x.cosa}${b ? `\n${b}${d ? ` · ${d}` : ''}` : ''}`), 37) } // (37: a destra ci sono le frecce ↑ ↓)
  async function premi(b) {
    if (b === '♥') { cuore(x.id); return dì(true, preferiti().has(x.id) ? 'nei preferiti' : 'tolto dai preferiti') }
    if (b === '−') { n = Math.max(1, n - 1); return os.ridisegna() }
    if (b === '+') { n = Math.min(50, n + 1); return os.ridisegna() }
    if (b === 'carrello') { const [ok, t] = aggiungi(x, n); return dì(ok, t) }
    // compra ora: si conferma
    const no = nonPuoi(tot())
    if (no) return dì(false, no)
    const m = x.unico ? 1 : n
    const r = await os.dialogo({ titolo: 'compri?', icona: x.id, testo: `${m} × ${x.nome} per ${fmt(tot())} $pzk. Ne hai ${fmt(puliti())}${pul()}.`, tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v) return
    const s = await compraRighe([[x.id, m]]) // (comprando subito, il carrello resta com'è; 31.10: compra la banca)
    if (s.manca) return dì(false, `ti mancano ${fmt(s.manca)} $pzk`)
    if (s.errore) return dì(false, s.errore)
    if (!s.righe.length) return dì(false, 'ce l’hai già')
    os.togli()
    os.spingi(scontrino(os, s, alla))
  }
  const v = {
    nome: 'negozio-scheda', app: 'negozio',
    entra() { v.via = [pzk.osserva(() => os.ridisegna()), zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())]; tieni() },
    esci() { v.via?.forEach((f) => f()) },
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      const B = bottoni(), sb = sel >= 0 && sel < B.length ? sel : B.length - 1 // (disegna non cambia sel: 4.8; i tasti possono essere diventati meno, comprando un pezzo unico)
      // la testa: l'icona grande, il nome, il reparto, il prezzo, quanti ne hai
      l.bitmap(bm(x.id, 32), 8, 14)
      l.testo(46, 15, corto(x.nome, 33))
      l.testo(46, 24, corto(`${reparto ? reparto[1] : ''}${x.tipo === 'usa' ? ' · da usare' : x.tipo === 'cassa' ? ' · cassa' : x.unico ? ' · da tenere' : ''}${preferiti().has(x.id) ? ' · ♥' : ''}`, 33))
      const s = mercato.scontoDi(x.id), p = `${fmt(mercato.prezzoDi(x))} $pzk`
      let xp = 46
      if (s) { const v0 = fmt(x.prezzo); l.testo(xp, 33, v0); l.orizz(xp - 1, 36, Lcd.larghezza(v0) + 2); xp += Lcd.larghezza(v0) + 6 } // (il prezzo pieno, barrato)
      l.testo(xp, 33, p); if (s) l.testo(xp + Lcd.larghezza(p) + 6, 33, pct(s))
      l.testo(46, 42, corto(ce(x) ? 'ce l’hai già nello zaino' : `ne hai ${zaino.quanti(x.id)} · ${x.unico ? 'se ne ha uno solo' : 'fino a 50 alla volta'}`, 33))
      // la descrizione, che scorre
      const d = desc(), VIS = 4
      giu = Math.max(0, Math.min(giu, Math.max(0, d.length - VIS)))
      d.slice(giu, giu + VIS).forEach((r, i) => l.testo(10, 52 + i * 9, r))
      if (giu > 0) l.testo(W - 14, 52, '↑')
      if (giu + VIS < d.length) l.testo(W - 14, 52 + (VIS - 1) * 9, '↓')
      // quanti e il totale, e i tasti
      if (!ce(x)) l.testo(10, 89, corto(`${x.unico ? '' : `quanti ${n} · `}${fmt(tot())} $pzk${pzk.inGalera() ? ' · in galera' : tot() > puliti() ? ` · ti mancano ${fmt(tot() - puliti())}${pul()}` : ''}`, 39))
      const ws = B.map((b) => Lcd.larghezza(b) + 8), tutta = ws.reduce((a, w) => a + w, 0) + (B.length - 1) * 4
      let xb = Math.round(W / 2 - tutta / 2)
      B.forEach((b, i) => {
        const on = i === sb
        if (on) l.riempi(xb, 99, ws[i], 11); else l.cornice(xb, 99, ws[i], 11)
        l.testo(xb + 4, 101, b, { inv: on })
        os.zona(xb, 97, ws[i], 15, () => { sel = i; premi(b) })
        xb += ws[i] + 4
      })
      if (!striscia(l, { esito }, t)) centro(l, H - 9, d.length > VIS ? '←→ sceglie · OK preme · ↑↓ legge' : '←→ sceglie · OK preme')
    },
    tasto(k) {
      const B = bottoni()
      tieni()
      if (k === 'sx') sel = (sel - 1 + B.length) % B.length
      else if (k === 'dx') sel = (sel + 1) % B.length
      else if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu++
      else if (k === 'ok') premi(B[sel])
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── le opzioni della vetrina: l'ordine, «posso comprarli», la ricerca ──
function opzioni(os) {
  let sel = 0
  const righe = [
    { nome: 'ordina', valore: () => ORDINI.find(([id]) => id === ordine)?.[1] ?? '', cambia: (d) => { const i = ORDINI.findIndex(([id]) => id === ordine); ordine = ORDINI[(i + d + ORDINI.length) % ORDINI.length][0] }, aiuto: '←→ cambia l’ordine' },
    { nome: 'posso comprarli', valore: () => (solo ? 'sì' : 'no'), cambia: () => { solo = !solo }, aiuto: '←→ o OK cambia' },
    { nome: 'cerca', valore: () => (cerca ? `«${cerca}»` : 'niente'), ok: async () => { const t = await os.tastiera({ testo: cerca, titolo: 'cerca nello shop' }); if (t !== null) cerca = t.trim().slice(0, 20) }, aiuto: 'OK scrive · o scrivi dalla tastiera' },
    { nome: 'pulisci tutto', valore: () => '', ok: () => { ordine = 'top'; solo = false; cerca = '' }, aiuto: 'OK: ordine, filtro e ricerca da capo' },
  ]
  const fai = (r, d = 1) => (r.ok ? r.ok() : r.cambia(d))
  return {
    nome: 'negozio-opzioni', app: 'negozio',
    disegna(l) {
      l.bitmap(icone.bitmap('app-shop', 16), 8, 14); l.testo(28, 18, 'le opzioni della vetrina'); l.orizz(6, 31, W - 12)
      righe.forEach((r, j) => {
        const y = 37 + j * 14, on = j === sel, frecce = on && r.cambia, nome = corto(r.nome, 24)
        // il valore prende tutto lo spazio che resta dopo il nome (e le frecce)
        const v = corto(r.valore(), Math.floor((W - 10 - (on ? 10 : 0) - (frecce ? 10 : 0) - (10 + Lcd.larghezza(nome) + 10)) / 6))
        if (on) l.riempi(6, y - 2, W - 12, 11)
        l.testo(10, y, nome, { inv: on })
        const xv = W - 10 - (frecce ? 10 : on ? 10 : 0) - Lcd.larghezza(v)
        if (frecce) l.testo(xv - 10, y, '◀', { inv: true })
        if (on) l.testo(W - 15, y, '▶', { inv: true })
        l.testo(xv, y, v, { inv: on })
        os.zona(6, y - 2, W - 12, 11, () => { sel = j; fai(r) })
        if (frecce) { os.zona(xv - 13, y - 2, 11, 11, () => r.cambia(-1)); os.zona(W - 18, y - 2, 12, 11, () => r.cambia(1)) }
      })
      centro(l, H - 9, righe[sel].aiuto)
    },
    tasto(k) {
      const r = righe[sel]
      if (k === 'su' || k === 'giu') sel = (sel + (k === 'su' ? -1 : 1) + righe.length) % righe.length
      else if (k === 'sx') { if (r.cambia) r.cambia(-1) }
      else if (k === 'dx' || k === 'ok') fai(r, 1)
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
    carattere(ch) { if (cerca.length < 20) cerca += ch },
    cancella() { cerca = cerca.slice(0, -1) },
    scrivendo: () => cerca.length > 0,
  }
}

// ── la vetrina: le pagine ──
export function vista(os) {
  let v = null
  const torna = () => { while (os.corrente() && os.corrente() !== v && os.corrente().app === 'negozio') os.togli() }
  // una pagina di prodotti (offerte, tutto, un reparto): in cima la riga dell'ordine, poi la lista
  const paginaProdotti = (rep, nome, icona) => {
    const st = { sel: 0, da: 0 }
    const voci = () => [{ opz: true }, ...prodotti({ rep, q: cerca, ordine: rep === 'offerte' ? 'top' : ordine }).filter((p) => !solo || (!ce(p) && !nonPuoi(mercato.prezzoDi(p))))] // («posso comprarli» qui: quello di prodotti conta anche gli sporchi)
    return {
      nome, icona,
      aiuto: () => (cerca ? `«${corto(cerca, 12)}» · INDIETRO la toglie` : 'OK apre · ↑↓ sceglie · ←→ reparti'), // (36 lettere al più: «… toglie la ricerca» usciva dallo schermo)
      tic: (t) => rep === 'offerte' && st.da === 0 && t % 10 === 0, // (il conto alla rovescia)
      disegna(l, x) {
        const L = voci()
        elenco(l, x.zona, {
          voci: L, stato: st, y0: 33, alta: 85, passo: 17,
          clic: (vc) => apri(vc),
          riga(l, vc, x0, y, w, on) {
            const o = { inv: on }
            if (vc.opz) {
              const s = rep === 'offerte' ? `finiscono fra ${contoAllaRovescia()}` : `ordina: ${ORDINI.find(([id]) => id === ordine)?.[1]}${solo ? ' · posso' : ''}`
              l.testo(x0, y + 5, corto(cerca ? `cerca «${cerca}» · ${s}` : s, Math.floor(w / 6)), o) // (niente ▶: qui → cambia reparto, le opzioni si aprono con OK)
              return
            }
            const p = mercato.prezzoDi(vc), sc = mercato.scontoDi(vc.id), qui = ce(vc)
            l.bitmap(bm(vc.id, 16), x0 - 2, y, o)
            const val = qui ? 'ce l’hai' : fmt(p)
            destra(l, x0 + w, y + 5, val, o)
            const xs = x0 + w - Lcd.larghezza(val) - 6
            if (sc && !qui) destra(l, xs, y + 5, pct(sc), o)
            const spazio = Math.floor((xs - (sc && !qui ? Lcd.larghezza(pct(sc)) + 6 : 0) - (x0 + 18) - 4) / 6)
            l.testo(x0 + 18, y + 5, corto(`${preferiti().has(vc.id) ? '♥ ' : ''}${vc.nome}`, spazio), o)
          },
        })
        if (L.length === 1) centro(l, 70, corto(cerca ? `niente per «${cerca}»` : solo ? 'niente che puoi comprare qui' : 'niente da mostrare', 38))
      },
      tasto(k, x) {
        if (muovi(st, voci().length, k)) return true
        if (k === 'ok') { apri(voci()[st.sel]); return true }
        if (k === 'indietro' && cerca) { cerca = ''; return true } // (INDIETRO toglie prima la ricerca)
        return false
      },
      carattere(ch) { if (cerca.length < 20) { cerca += ch; st.sel = 0; st.da = 0 } },
      cancella() { cerca = cerca.slice(0, -1) },
      scrivendo: () => cerca.length > 0,
    }
  }
  function apri(vc) {
    if (!vc) return
    if (vc.opz) return os.spingi(opzioni(os))
    os.spingi(scheda(os, vc, torna))
  }
  // il carrello
  const stc = { sel: 0, da: 0 }
  const vociCarrello = () => { const r = righeCarrello().map(([id, n]) => ({ id, n })); return r.length ? [...r, { paga: true }, { svuota: true }] : [] }
  async function rigaCarrello(vc, x) {
    if (vc.paga) {
      const t = totale(), sal = puliti(), no = nonPuoi(t)
      if (no) return x.dì(false, no) // (prima di compraRighe: col saldo sporco comprava solo le prime righe)
      const r = await os.dialogo({ titolo: 'paghi?', icona: 'app-shop', testo: `${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'} per ${fmt(t)} $pzk. Dopo te ne restano ${fmt(sal - t)}${pul()}.`, tasti: ['no', 'paga'] })
      if (r !== 'paga' || !x.qui()) return
      const s = await compraRighe(righeCarrello(), (id) => metti(id, 0))
      if (s.manca) return x.dì(false, `ti mancano ${fmt(s.manca)} $pzk`)
      if (s.errore) return x.dì(false, s.errore)
      if (!s.righe.length) return x.dì(false, 'ce l’hai già tutto')
      stc.sel = 0
      return os.spingi(scontrino(os, s, torna))
    }
    if (vc.svuota) {
      const r = await os.dialogo({ titolo: 'svuoti?', testo: 'tutto il carrello torna sugli scaffali.', tasti: ['no', 'svuota'] })
      if (r === 'svuota' && x.qui()) { scrivi(CHIAVE_CARRELLO, {}); stc.sel = 0; x.dì(true, 'carrello vuoto') }
      return
    }
    const p = PER_ID[vc.id]
    const r = await os.dialogo({ titolo: corto(p.nome, 14), icona: p.id, testo: `${vc.n} nel carrello, ${fmt(mercato.prezzoDi(p) * vc.n)} $pzk.`, tasti: p.unico ? ['togli'] : ['togli', 'uno in meno', 'uno in più'] })
    if (!r || !x.qui()) return
    metti(p.id, r === 'togli' ? 0 : r === 'uno in meno' ? vc.n - 1 : vc.n + 1)
  }
  const paginaCarrello = {
    get nome() { return pezzi() ? `il carrello (${pezzi()})` : 'il carrello' }, icona: 'sacco',
    aiuto: () => (vociCarrello().length ? 'OK sceglie · ↑↓ · ←→ reparti' : '←→ reparti'),
    disegna(l, x) {
      const L = vociCarrello()
      if (!L.length) { centro(l, 58, 'il carrello è vuoto.'); centro(l, 70, 'OK su un prodotto e «carrello»'); return }
      elenco(l, x.zona, {
        voci: L, stato: stc, y0: 33, alta: 64, passo: 16,
        clic: (vc) => rigaCarrello(vc, x),
        riga(l, vc, x0, y, w, on) {
          const o = { inv: on }
          if (vc.paga) { const t = totale(); l.testo(x0, y + 4, corto(nonPuoi(t) ?? `paga ${fmt(t)} $pzk`, Math.floor(w / 6)), o); return } // (niente ▶: qui → cambia pagina, si paga con OK)
          if (vc.svuota) { l.testo(x0, y + 4, 'svuota il carrello', o); return }
          const p = PER_ID[vc.id]
          l.bitmap(bm(p.id, 16), x0 - 2, y - 1, o)
          const val = fmt(mercato.prezzoDi(p) * vc.n)
          destra(l, x0 + w, y + 4, val, o)
          l.testo(x0 + 18, y + 4, corto(`${vc.n} × ${p.nome}`, Math.floor((w - 18 - Lcd.larghezza(val) - 8) / 6)), o)
        },
      })
      const t = totale(), sal = puliti(), ris = risparmio()
      l.orizz(8, 98, W - 16)
      l.testo(10, 100, corto(`${pezzi()} pezz${pezzi() === 1 ? 'o' : 'i'}, ${fmt(t)} $pzk${ris ? ` · sconti -${fmt(ris)}` : ''}`, 39))
      l.testo(10, 109, corto(pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}: niente shop` : `${pul() ? 'puliti' : 'saldo'} ${fmt(sal)} · ${t > sal ? `ti mancano ${fmt(t - sal)}` : `dopo ${fmt(sal - t)}`}`, 39))
    },
    tasto(k, x) {
      const L = vociCarrello()
      if (muovi(stc, L.length, k)) return true
      if (k === 'ok' && L.length) { rigaCarrello(L[stc.sel], x); return true }
      return false
    },
  }
  const P = [paginaProdotti('offerte', 'le offerte del giorno', 'regalo'), paginaProdotti('tutti', 'tutto lo shop', 'app-shop'), ...REPARTI.map(([id, n, i]) => paginaProdotti(id, n, i)), paginaCarrello]
  v = pagine(os, {
    nome: 'negozio', app: 'negozio', pagine: P, iniziale: ultima,
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f), (f) => icone.ascolta(f)],
    esci: (x) => { ultima = x.pag },
  })
  return v
}
