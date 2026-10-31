// L'app «pzkstore» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, …»): il negozio delle app del cercapersone
// zero. Il catalogo, i prezzi, l'acquisto e la rimozione sono quelli del pzkstore vecchio (telefono/app/pzkstore.js:
// CATALOGO, compra, togli, regalata): coi $pzk PULITI alla cassa di pzk, in galera non si compra, si toglie senza rimborso.
// L'app comprata compare subito nel menu (telefono.js rifà la lista quando lo zaino cambia).
// - LA VETRINA: due righe per dire cos'è, le app (icona, nome, una riga, il prezzo o «installata», «!» se ti servirebbe),
//   sotto quanti puliti hai. OK apre la scheda.
// - LA SCHEDA: l'icona grande, il nome, il genere e la versione, lo stato; il testo intero che scorre con ↑ ↓ (cosa fa, in
//   breve, come si usa, cosa serve, le novità, togliere); sotto i tasti: compra e scarica, o apri e togli. Comprare e togliere
//   si confermano.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { CATALOGO, PER_ID, compra, togli, regalata } from '../../app/pzkstore.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni } from './pezzi.js'

const fmt = (n) => pzk.fmt(n)
const ROMA = { timeZone: 'Europe/Rome' }
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' })
const giorno = (t) => new Date(t).toLocaleDateString('it-IT', { ...ROMA, day: 'numeric', month: 'short', year: 'numeric' })
const fatta = (x) => (x.f ? 'installata' : 'installato')
const la = (x) => (x.f ? 'la' : 'lo')
const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-pzkstore', lato)
/** Le app: prima quelle da scaricare, poi le tue (come la vetrina vecchia). */
const ordinate = () => [...CATALOGO.filter((x) => !zaino.installata(x.id)), ...CATALOGO.filter((x) => zaino.installata(x.id))]

// ── la scheda di un'app ──
function scheda(os, x) {
  let giu = 0, sel = 0, esito = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const tua = () => zaino.installata(x.id)
  const testo = () => impagina([
    ...(!tua() && x.utile() ? [{ testo: x.perche() }] : []),
    ...x.cosa.map((t) => ({ testo: t })),
    { titolo: 'in breve' }, ...x.punti.map((t) => ({ punto: t })),
    { titolo: 'come si usa' }, ...x.come.map((t, i) => ({ passo: i + 1, testo: t })),
    { titolo: 'cosa serve' }, { testo: x.serve },
    { titolo: `novità · versione ${x.versione} del ${x.del}` }, { testo: x.novita },
    ...(tua() ? [{ titolo: 'togliere l’app' }, { testo: `sparisce dal menu. Niente rimborso: i ${fmt(x.prezzo)} $pzk sono della cassa di pzk, e per riaver${la(x)} ${la(x)} ricompri a prezzo pieno.` }] : []),
  ])
  const tasti = () => (tua() ? [`apri ${x.nome.toLowerCase()}`, 'togli'] : [x.prezzo ? `compra e scarica · ${fmt(x.prezzo)}` : 'scarica · gratis'])
  // (31.10) comprare e togliere sono azioni della banca (app/pzkstore.js): una alla volta, niente doppi acquisti
  let occupato = false
  async function premi(i) {
    if (occupato) return
    occupato = true
    try { await fai(i) } finally { occupato = false }
  }
  async function fai(i) {
    const b = tasti()[i]
    if (b === 'togli') {
      const r = await os.dialogo({ titolo: 'la togli?', icona: x.icona, testo: `${x.nome} sparisce dal menu. Niente rimborso: per riaver${la(x)} ${la(x)} ricompri a ${fmt(x.prezzo)} $pzk.`, tasti: ['no', 'togli'] })
      if (r !== 'togli' || os.corrente() !== v) return
      const e = await togli(x.id)
      if (os.corrente() !== v) return
      sel = 0
      return e.ok ? dì(true, `${x.nome} ${x.f ? 'tolta' : 'tolto'} dal cercapersone`) : dì(false, e.errore)
    }
    if (b.startsWith('apri')) return os.apri(x.id)
    // compra: si conferma
    const r = await os.dialogo({ titolo: 'compri?', icona: x.icona, testo: x.prezzo ? `${x.nome} per ${fmt(x.prezzo)} $pzk puliti, una volta sola. Ne hai ${fmt(pzk.puliti())}.` : `${x.nome}, gratis.`, tasti: ['no', 'sì'] })
    if (r !== 'sì' || os.corrente() !== v) return
    const e = await compra(x.id)
    if (os.corrente() !== v) return
    if (!e.ok) return dì(false, e.errore)
    sel = 0
    os.suoni.sigla('pzkstore')
    dì(true, `${x.nome} ${fatta(x)}: è nel menu`)
  }
  const v = {
    nome: 'pzkstore-scheda', app: 'pzkstore',
    entra() { v.via = [pzk.osserva(() => os.ridisegna()), zaino.ascolta(() => os.ridisegna())] },
    esci() { v.via?.forEach((f) => f()) },
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      l.bitmap(bm(x.icona, 32), 8, 14)
      l.testo(46, 15, corto(x.nome, 33), {})
      l.testo(46, 24, corto(`pzkstore · ${x.genere} · versione ${x.versione}`, 33))
      const stato = tua()
        ? `✓ ${fatta(x)}${regalata(x.id) ? ` · ${x.f ? 'regalata' : 'regalato'}` : zaino.installataIl(x.id) ? ` il ${giorno(zaino.installataIl(x.id))}` : ''}`
        : x.prezzo ? `${fmt(x.prezzo)} $pzk puliti` : 'gratis'
      l.testo(46, 33, corto(stato, 33))
      l.testo(46, 42, corto(pzk.inGalera() ? `in galera fino alle ${ora(pzk.galera())}: chiuso` : `hai ${fmt(pzk.puliti())} $pzk puliti`, 33)) // (33 lettere: «…: non vende» si tagliava)
      giu = scorrevole(l, testo(), { y0: 52, vis: 5, giu })
      const T = tasti()
      bottoni(l, os.zona, { etichette: T, sel: sel < T.length ? sel : 0, y: 99, premi: (i) => { sel = i; premi(i) } }) // (disegna non cambia sel: lo tiene a posto tasto, 4.8)
      if (!striscia(l, { esito }, t)) centro(l, H - 9, T.length > 1 ? '←→ sceglie · OK preme · ↑↓ legge' : 'OK preme · ↑↓ legge')
    },
    tasto(k) {
      const n = tasti().length
      if (sel >= n) sel = 0 // (comprata o tolta, i tasti cambiano)
      if (k === 'sx') sel = (sel - 1 + n) % n
      else if (k === 'dx') sel = (sel + 1) % n
      else if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu++
      else if (k === 'ok') premi(sel)
      else if (k === 'indietro') os.togli()
      else return false
      return true
    },
  }
  return v
}

// ── la vetrina ──
export function vista(os) {
  const st = { sel: 0, da: 0 }
  const v = pagine(os, {
    nome: 'pzkstore', app: 'pzkstore',
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
    pagine: [{
      nome: 'pzkstore', icona: 'app-pzkstore', aiuto: 'OK apre la scheda · ↑↓ sceglie',
      disegna(l, x) {
        const intro = pzk.inGalera()
          ? `in galera fino alle ${ora(pzk.galera())}: non vende. Si esce con la cauzione: app rapina.` // (due righe: la cauzione non si perdeva più)
          : 'app in più: si pagano una volta coi $pzk puliti e restano tue.'
        const R = Lcd.acapo(intro, 39)
        R.slice(0, 2).forEach((r, i) => l.testo(10, 34 + i * 9, i === 1 && R.length > 2 ? corto(`${r}…`, 39) : r)) // (se mai non ci sta, almeno i «…»)
        elenco(l, x.zona, {
          voci: ordinate(), stato: st, y0: 54, alta: 40, passo: 20,
          clic: (a) => os.spingi(scheda(os, a)),
          riga(l, a, x0, y, w, on) {
            const o = { inv: on }, tua = zaino.installata(a.id), serve = !tua && a.utile()
            l.bitmap(bm(a.icona, 16), x0 - 2, y + 2, o)
            const val = tua ? fatta(a) : a.prezzo ? fmt(a.prezzo) : 'gratis'
            destra(l, x0 + w, y + 2, val, o)
            l.testo(x0 + 18, y + 2, corto(`${serve ? '! ' : ''}${a.nome}`, Math.floor((w - 18 - Lcd.larghezza(val) - 8) / 6)), o)
            l.testo(x0 + 18, y + 11, corto(serve ? a.perche() : a.breve, Math.floor((w - 18) / 6)), o)
          },
        })
        const s = pzk.sporchi()
        l.orizz(8, 98, W - 16)
        l.testo(10, 101, corto(`${CATALOGO.length} app · hai ${fmt(pzk.puliti())} $pzk puliti`, 39))
        if (s > 0) l.testo(10, 110, corto(`i ${fmt(s)} sporchi qui non valgono`, 39))
      },
      tasto(k) {
        if (muovi(st, CATALOGO.length, k)) return true
        if (k === 'ok') { const a = ordinate()[st.sel]; if (a) os.spingi(scheda(os, a)); return true }
        return false
      },
    }],
  })
  // aperto con un comando (os.apri('pzkstore', { comando: 'lavatrice' }): la rapina riuscita che porta alla lavatrice), si apre
  // la scheda di quell'app
  v.comando = (id) => { const a = PER_ID[id]; if (a && os.corrente() === v) os.spingi(scheda(os, a)) }
  return v
}
