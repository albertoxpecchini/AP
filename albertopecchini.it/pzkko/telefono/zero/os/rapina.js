// L'app «rapina» di pzk os (29.10, Alberto: «crea uno alla volta … rapina …»): il colpo alla cassa di pzk sul cercapersone
// zero. Le regole sono quelle del server (api/wallet.mjs, colpo e cauzione) e dell'app vecchia (telefono/app/rapina.js: PROB,
// bottino, CAUZIONE, ora, resta); i soldi passano da games/pzk.js (colpo, cauzione). Qui c'è solo la faccia a un bit.
// - IL COLPO, secondo com'è messo:
//   · LA CASSA: quanto c'è dentro, e due righe: organizza un colpo, entra col codice di un complice (le quattro lettere
//     dalla tastiera). Un colpo al giorno: si dice da quando.
//   · IL COLPO APERTO: il codice grande da dare ai complici, quando scade (i secondi che corrono), la banda (al più quattro)
//     con la riuscita; chi organizza ha «via!» (con la conferma: se va male è galera per tutti), gli altri aspettano. Lo
//     stato si chiede ogni tre secondi, come l'app vecchia.
//   · IL VIA: la cassaforte che si scassina per un secondo (un tasto la salta), poi l'esito col suo suono.
//   · RIUSCITO: il sacco che salta, la quota a testa e il bottino, cosa sono i soldi sporchi; la lavatrice (o la sua scheda
//     nel pzkstore) e «va bene».
//   · LA GALERA: la cella con le sbarre che ogni tanto si scuotono, quando si esce e quanto manca, la cauzione (3.000 puliti,
//     con la conferma) se li hai.
// - COME FUNZIONA: la tabella della banda (riuscita e bottino a testa con la cassa di adesso) e le regole, che scorrono.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { PROB, bottino, CAUZIONE, ORE_GALERA, ora, resta } from '../../app/rapina.js'
import { corto, destra, centro, elenco, muovi, pagine, impagina, scorrevole, bottoni } from './pezzi.js'

const fmt = (n) => pzk.fmt(n ?? 0), corti = (n) => pzk.fmtCorto(n ?? 0)
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const REGOLE = [
  { titolo: 'il colpo' },
  { testo: 'Chi organizza apre il colpo e ha un codice di quattro lettere da dare ai complici, che entrano col codice (al più quattro in tutto). Il via lo dà chi ha organizzato, entro quindici minuti.' },
  { titolo: 'se va bene' },
  { testo: 'Il bottino è il 3 % della cassa più l’1 % a testa, al più 15.000 a testa. È SPORCO: si vede nel saldo ma con pzk non si spende e non si manda. Si pulisce nella lavatrice, che si compra nel pzkstore (5.000 puliti, una volta; poi 2.000 a lavaggio), o da solo dopo 96 giorni.' },
  { titolo: 'se va male' },
  { testo: `${ORE_GALERA} ore di galera per tutta la banda e una multa: il 20 % dei soldi puliti, al più 5.000. In galera niente lavoro, giochi né colpi; si esce prima con la cauzione, ${fmt(CAUZIONE)} $pzk puliti.` },
  { titolo: 'chi può' },
  { testo: 'Un colpo al giorno a testa, col conto di almeno 48 ore.' },
]

// l'esito già visto: il server ridà l'ultimo colpo per due ore, e senza questo «va bene» lo rifaceva vedere (anche l'app
// vecchia). Si ricorda il codice, per conto (REGOLE.md 8.2)
const chiave = () => `pzkko-zero-rapina:${pzk.conto()?.ind ?? ''}`
const visto = () => { try { return localStorage.getItem(chiave()) ?? '' } catch { return '' } }
const vedi = (codice) => { try { localStorage.setItem(chiave(), codice) } catch {} }

export function vista(os) {
  let S = { colpo: null, cassa: null, rete: true }, giro = 0
  let scelta = { sel: 0, da: 0 }, bott = 0, giu = 0
  let scasso = null // { fino, esito }: la cassaforte che si apre (dieci fotogrammi), poi l'esito
  let salto = 0, scossa = 0, retata = 0 // il sacco che salta, le sbarre che si scuotono, il lampeggiante dei presi

  /** Lo stato del colpo dal server (ogni tre secondi mentre è aperto o si è in galera). Un esito nuovo suona. */
  async function stato() {
    if (X?.attesa) return // (30.10: mentre «via» o un'altra richiesta aspetta il server niente stato: l'esito suonava due volte)
    const mio = ++giro, d = await pzk.colpo('stato')
    if (mio !== giro || X?.attesa) return
    if (!d?.ok) { S.rete = false; os.ridisegna(); return }
    const prima = S.colpo
    S = { colpo: d.colpo, cassa: d.cassa, rete: true }
    allinea()
    if (prima?.stato === 'aperto' && d.colpo?.stato === 'fatto' && !scasso) esito(d.colpo.esito) // (il via l'ha dato un altro)
    os.ridisegna()
  }
  function esito(e) {
    if (!e) return
    if (e.ok) { os.suoni.sigla('rapina-colpo'); salto = 8 } else { os.suoni.sigla('rapina-sirena'); retata = 12 }
  }

  async function fai(cosa, x, codice = '') {
    if (cosa === 'vai') {
      const n = S.colpo?.membri?.length ?? 0
      if (n < 2) return x.dì(false, 'da solo no: serve almeno un complice')
      const r = await os.dialogo({ titolo: 'si va?', testo: `riesce ${PROB[n]} volte su cento. Se va male sono ${ORE_GALERA} ore di galera per tutti, e la multa.`, icona: 'app-rapina', tasti: ['no', 'via!'] })
      if (r !== 'via!' || !x.qui()) return
    }
    const d = await x.aspetta({ apri: 'apro il colpo…', entra: 'entro nella banda…', esci: 'esco dal colpo…', vai: 'si va…' }[cosa], () => pzk.colpo(cosa, codice))
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    if ('colpo' in d) S.colpo = d.colpo
    allinea()
    if (cosa === 'vai' && d.colpo?.esito) scasso = { fino: 10, esito: d.colpo.esito }
    else if (cosa === 'apri') x.dì(true, 'aperto: dai il codice ai complici')
    else if (cosa === 'entra') x.dì(true, 'sei nella banda: aspetta il via')
    else if (cosa === 'esci') x.dì(true, 'sei fuori dal colpo')
    stato()
  }
  async function entra(x) {
    const s = await os.tastiera({ titolo: 'il codice del colpo: quattro lettere' })
    if (s === null || !x.qui()) return
    const c = s.toUpperCase().replace(/[^A-Z]/g, '')
    if (c.length !== 4) return x.dì(false, 'il codice è di quattro lettere')
    fai('entra', x, c)
  }
  async function cauzione(x) {
    if (pzk.puliti() < CAUZIONE) return x.dì(false, `la cauzione è ${fmt(CAUZIONE)} puliti: ne hai ${fmt(pzk.puliti())}`)
    const r = await os.dialogo({ titolo: 'la cauzione', testo: `${fmt(CAUZIONE)} $pzk puliti alla cassa di pzk, ed esci subito.`, icona: 'lucchetto', tasti: ['no', 'paga'] })
    if (r !== 'paga' || !x.qui()) return
    const d = await x.aspetta('pago la cauzione…', () => pzk.cauzione())
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    os.suoni.sigla('moneta')
    x.dì(true, 'fuori: cauzione pagata')
    S.colpo = null
    allinea()
    stato()
  }
  /** Le zone del clic, spente mentre si aspetta il server (come i tasti: niente doppi invii). */
  const zona = (x) => (...a) => { if (!x.attesa) x.zona(...a) }
  const lavatrice = () => (zaino.installata('lavatrice') ? os.apri('lavatrice') : os.apri('pzkstore', { comando: 'lavatrice' }))

  // ── com'è messo il colpo (decide cosa disegna la prima pagina e cosa fanno i tasti) ──
  const come = () => (scasso ? 'scasso' : pzk.inGalera() ? 'galera' : S.colpo?.stato === 'fatto' && S.colpo.io && S.colpo.esito?.ok && S.colpo.codice !== visto() ? 'riuscito' : S.colpo?.stato === 'aperto' && S.colpo.io ? 'aperto' : 'cassa')
  const azioni = () => {
    const c = come(), k = S.colpo
    if (c === 'aperto') return k.capo ? [{ eti: `via! ${PROB[Math.max(2, k.membri.length)]} %`, fai: (x) => fai('vai', x) }, { eti: 'esci dal colpo', fai: (x) => fai('esci', x) }] : [{ eti: 'esci dal colpo', fai: (x) => fai('esci', x) }]
    if (c === 'riuscito') return [{ eti: zaino.installata('lavatrice') ? 'alla lavatrice' : 'la lavatrice', fai: lavatrice }, { eti: 'va bene', fai: () => { vedi(S.colpo?.codice ?? ''); allinea() } }]
    return []
  }
  const VOCI = [{ nome: 'organizza un colpo', fai: (x) => fai('apri', x) }, { nome: 'entra col codice', fai: entra }]

  const colpo = {
    nome: 'il colpo', icona: 'app-rapina',
    get aiuto() {
      const c = come()
      if (c === 'scasso' || (c === 'galera' && retata > 0)) return 'un tasto salta'
      if (c === 'galera') return pzk.puliti() >= CAUZIONE ? 'OK paga la cauzione · ←→ regole' : '←→ le regole'
      if (c === 'cassa') return 'OK fa · ↑↓ sceglie · ←→ regole'
      return azioni().length > 1 ? 'OK preme · ←→ i tasti' : 'OK preme'
    },
    tic(t, x) {
      let ancora = false
      if (scasso) { if (--scasso.fino <= 0) { const e = scasso.esito; scasso = null; esito(e); allinea() } ancora = true }
      if (salto > 0) { salto--; ancora = true }
      if (scossa > 0) { scossa--; ancora = true }
      if (retata > 0) { retata--; ancora = true }
      const c = come()
      if ((c === 'aperto' || c === 'galera') && t % 30 === 0) stato() // (ogni tre secondi)
      if (c === 'galera' && t % 50 === 0) { scossa = 4; ancora = true } // (ogni cinque secondi chi è dentro scuote le sbarre)
      if (c === 'aperto' && t % 10 === 0) ancora = true // (i secondi che corrono)
      return ancora
    },
    disegna(l, x, t) {
      const c = come(), k = S.colpo
      if (c === 'scasso') {
        // la cassaforte: la manopola che gira, la barra che si riempie
        const cx = 128, cy = 66, r = 18, a = (10 - scasso.fino) * 0.9
        l.riquadro(cx - 28, cy - 26, 56, 52); l.riquadro(cx - 26, cy - 24, 52, 48)
        for (let i = 0; i < 24; i++) { const g = (i / 24) * Math.PI * 2; l.px(Math.round(cx + Math.cos(g) * r), Math.round(cy + Math.sin(g) * r)) }
        for (let s = 0; s < r - 3; s++) l.px(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s))
        l.riempi(cx - 1, cy - 1, 3, 3)
        centro(l, 98, 'si scassina la cassa…')
        l.riquadro(68, 108, 120, 6); l.riempi(70, 110, Math.round((116 * (10 - scasso.fino)) / 10), 2)
        return
      }
      if (c === 'galera' && retata > 0) {
        // presi: il lampeggiante, a fotogrammi alterni la scena rovesciata
        const on = retata % 4 < 2
        if (on) l.riempi(os.MARGINE, 32, W - 2 * os.MARGINE, 86)
        l.bitmap(icone.bitmap('sirena', 32), 112, 38, { inv: on })
        centro(l, 78, 'presi!', { scala: 3, inv: on })
        centro(l, 104, 'arrivano i carabinieri', { inv: on })
        return
      }
      if (c === 'galera') {
        // la cella: il bot dietro le sbarre, che ogni tanto si scuotono
        const dx = scossa > 0 ? (scossa % 2 ? 1 : -1) : 0
        l.riquadro(10, 34, 72, 80)
        l.bitmap(icone.bitmap('bot', 32), 30, 56)
        for (let xx = 16; xx < 80; xx += 9) { l.riempi(xx + dx, 35, 2, 78, 0); l.vert(xx + dx, 35, 78); l.vert(xx + 1 + dx, 35, 78) }
        l.orizz(11, 44, 70); l.orizz(11, 104, 70)
        l.testo(92, 35, 'in galera', { scala: 2 })
        l.testo(92, 54, `fuori alle ${ora(pzk.galera())}`)
        l.testo(92, 63, `fra ${resta(pzk.galera())}`)
        const presi = k?.stato === 'fatto' && k.io && k.esito?.ok === false
        Lcd.acapo(presi ? `presi: ${ORE_GALERA} ore e una multa di ${fmt(k.esito.multa)} $pzk.` : 'niente lavoro, giochi né colpi.', 25).slice(0, 2).forEach((r, i) => l.testo(92, 75 + i * 9, r))
        const puoi = pzk.puliti() >= CAUZIONE, eti = `cauzione ${fmt(CAUZIONE)}`, bw = Lcd.larghezza(eti) + 8
        if (puoi) { l.riempi(92, 99, bw, 11); l.testo(96, 101, eti, { inv: true }); zona(x)(92, 97, bw, 15, () => cauzione(x)) }
        else Lcd.acapo(`la cauzione è ${fmt(CAUZIONE)} puliti: ne hai ${corti(pzk.puliti())}`, 25).slice(0, 2).forEach((r, i) => l.testo(92, 98 + i * 9, r))
        return
      }
      if (c === 'riuscito') {
        const e = k.esito, su = salto > 0 ? [0, 3, 5, 6, 5, 3, 1, 0][8 - salto] ?? 0 : 0
        l.bitmap(icone.bitmap('sacco', 32), 10, 38 - su)
        l.testo(50, 36, 'colpo riuscito', { scala: 2 })
        l.testo(50, 54, corto(`+${fmt(e.quota)} sporchi a testa`, 32))
        l.testo(50, 63, corto(`${fmt(e.bottino)} in tutto, ${k.membri.length} nella banda`, 32))
        Lcd.acapo('sporchi: non si spendono né si mandano. Si lavano nella lavatrice, o da soli in 96 giorni.', 39).slice(0, 3).forEach((r, i) => l.testo(10, 74 + i * 9, r))
        bottoni(l, zona(x), { etichette: azioni().map((a) => a.eti), sel: Math.min(bott, azioni().length - 1), y: 101, premi: (i) => { bott = i; azioni()[i].fai(x) } })
        return
      }
      if (c === 'aperto') {
        const n = k.membri.length, A = azioni()
        l.testo(10, 34, 'il codice: dallo ai complici')
        l.testo(10, 45, k.codice, { scala: 3 })
        const quanto = k.scade - Date.now()
        l.testo(96, 46, quanto > 0 ? `scade fra ${mmss(quanto)}` : 'scaduto')
        l.testo(96, 55, `banda ${n}/4 · riesce ${PROB[Math.max(2, n)]} %`)
        k.membri.forEach((m, i) => { const xx = 10 + (i % 2) * 118, y = 70 + Math.floor(i / 2) * 9; l.testo(xx, y, corto(`• ${m.nome}${i ? '' : ' (capo)'}`, 19)) })
        if (n < 2 || !k.capo) centro(l, 89, n < 2 ? `serve almeno un complice${'...'.slice(0, (Math.floor(t / 5) % 3) + 1)}` : 'aspetta il via di chi organizza…')
        bottoni(l, zona(x), { etichette: A.map((a) => a.eti), sel: Math.min(bott, A.length - 1), y: 101, premi: (i) => { bott = i; A[i].fai(x) } })
        return
      }
      // la cassa
      l.bitmap(icone.bitmap('app-rapina', 32), 10, 35)
      l.testo(50, 35, 'la cassa di pzk')
      if (S.cassa != null) { const s = corti(S.cassa); l.testo(50, 45, s, { scala: 2 }); l.testo(54 + Lcd.larghezza(s, 2), 52, '$pzk') }
      else l.testo(50, 47, S.rete ? 'la apro…' : 'non risponde: riprovo')
      const ultimo = pzk.conto()?.colpo ?? 0, domani = ultimo + 864e5
      l.testo(10, 69, corto(domani > Date.now() ? `un colpo al giorno, di nuovo alle ${ora(domani)}` : 'dentro: puntate perse, acquisti e multe', 39)) // (39 giusti con l'ora: «il prossimo dalle» erano 43 e l'ora si tagliava)
      elenco(l, zona(x), {
        voci: VOCI, stato: scelta, y0: 81, alta: 26, passo: 13,
        clic: (v) => v.fai(x),
        riga(l, v, x0, y, w, on) { l.testo(x0, y + 3, v.nome, { inv: on }); if (v.nome.startsWith('organizza')) destra(l, x0 + w, y + 3, '32-48 %', { inv: on }) },
      })
    },
    tasto(k, x) {
      const c = come()
      if (c === 'scasso') { const e = scasso.esito; scasso = null; esito(e); allinea(); return k !== 'indietro' } // (un tasto salta: l'esito subito)
      if (c === 'cassa') { if (muovi(scelta, VOCI.length, k)) return true; if (k === 'ok') { VOCI[scelta.sel].fai(x); return true } return false }
      if (c === 'galera' && retata > 0) { retata = 0; return k !== 'indietro' } // (un tasto salta il lampeggiante)
      if (c === 'galera') { if (k === 'ok') { cauzione(x); return true } return false }
      const A = azioni()
      if (!A.length) return false
      bott = Math.min(bott, A.length - 1) // (qui e non nel disegno: REGOLE.md 4.8)
      if (A.length > 1 && (k === 'sx' || k === 'dx')) { bott = (bott + (k === 'sx' ? -1 : 1) + A.length) % A.length; return true }
      if (k === 'ok') { A[Math.min(bott, A.length - 1)].fai(x); return true }
      return k === 'su' || k === 'giu'
    },
  }

  const regole = {
    nome: 'come funziona', icona: 'lucchetto',
    aiuto: '↑↓ legge · ←→ pagine',
    disegna(l, x) {
      // la tabella: banda, riuscita, bottino a testa con la cassa di adesso
      l.testo(10, 34, 'banda'); l.testo(64, 34, 'riesce'); destra(l, 240, 34, 'a testa')
      l.orizz(10, 42, 231)
      ;[2, 3, 4].forEach((n, i) => {
        const y = 45 + i * 9
        l.testo(22, y, String(n)); l.testo(70, y, `${PROB[n]} %`)
        destra(l, 240, y, S.cassa != null ? `${fmt(Math.round(bottino(S.cassa, n)))} $pzk` : '…')
      })
      scorrevole(l, impagina(REGOLE), { y0: 74, vis: 5, giu })
    },
    tasto(k) {
      if (k === 'su') { giu = Math.max(0, giu - 1); return true }
      if (k === 'giu') { giu = Math.min(giu + 1, Math.max(0, impagina(REGOLE).length - 5)); return true } // (il fondo qui, non nel disegno)
      return false
    },
  }

  // LE PAGINE: col colpo aperto, riuscito o mentre si scassina, ← → scelgono i tasti in fondo: allora la pagina è una sola
  // (niente ◀ ▶ in testata: ogni freccia sullo schermo deve fare quello che dice). Si toglie solo stando sul colpo.
  const PAG = [colpo, regole]
  let X = null
  function allinea() {
    const sola = ['aperto', 'riuscito', 'scasso'].includes(come())
    if (!sola) { PAG[1] = regole; return }
    if (!X || X.pag === 0) PAG.length = 1
  }
  colpo.entra = () => allinea()
  return pagine(os, {
    nome: 'rapina', app: 'rapina',
    pagine: PAG,
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
    entra: (x) => { X = x; allinea(); stato() },
  })
}
