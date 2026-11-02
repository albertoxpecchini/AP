// L'app «lavatrice» di pzk os (1.11, Alberto: «sì» a farla, dopo che il cercapersone nero se n'era andato con la sua):
// i soldi sporchi delle rapine che tornano puliti. Le regole sono quelle della banca (wallet.mjs, lava: al più 50.000 a
// lavaggio, 2.000 puliti di commissione, dieci minuti, una alla volta, in galera non parte) e la logica è quella di
// telefono/app/lavatrice.js (stato, dopo, storia, lava, ritira): qui c'è solo la faccia a un bit. Si compra nel pzkstore.
// - LA LAVATRICE, secondo com'è messa:
//   · FERMA, CON GLI SPORCHI: quanto lavare (di serie il massimo, perché la commissione è fissa; ↑ ↓ cambiano di 5.000),
//     la commissione e quanto pesa, come sarai dopo (i puliti, gli sporchi che restano e i lavaggi che servono ancora),
//     l'avviso se lavi meno della commissione; «lava», con la conferma.
//   · GIRA: il cestello che gira dietro l'oblò, quanto manca, la barra, a che ora è pronta. Si può chiudere: lava da sola.
//   · PRONTA: la moneta che salta nell'oblò e «ritira» (la banca li pulisce alla prima richiesta dopo la fine).
//   · VUOTA (niente sporchi) e IN GALERA: cosa vuol dire, e da dove vengono gli sporchi.
// - LA STORIA: le mosse del conto coi soldi sporchi (le rapine, le commissioni, i lavaggi finiti, i puliti dal tempo).
// - COME FUNZIONA: le regole, che scorrono.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { MAX, COSTO, DURATA, mmss, ora, quando, pct, stato, dopo, STORIA, storia, lava, ritira } from '../../app/lavatrice.js'
import { corto, destra, centro, pagine, puntini, impagina, scorrevole } from './pezzi.js'

const fmt = (n) => pzk.fmt(n ?? 0), corti = (n) => pzk.fmtCorto(n ?? 0)
const PASSO = 5000 // (↑ ↓: di 5.000 in 5.000, dal massimo in giù)
const X0 = 64, X1 = 245 // la colonna a destra della macchina

/** Le quantità che si possono scegliere: il massimo, poi i multipli di 5.000 sotto. */
const quantita = (max) => (max <= PASSO ? [max] : [max, ...Array.from({ length: Math.ceil(max / PASSO) - 1 }, (_, i) => (Math.ceil(max / PASSO) - 1 - i) * PASSO)])

/** Un cerchio di raggio r (il contorno, punto per punto). */
function cerchio(l, cx, cy, r) {
  const n = Math.ceil(2 * Math.PI * r * 1.5)
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; l.px(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)) }
}

/** La lavatrice disegnata (48 × 76, da x, y): il pannello col display e la manopola, l'oblò; dentro, secondo com'è: il
 *  sacco degli sporchi, il cestello che gira con l'acqua, la moneta pronta, il lucchetto della galera, niente. */
function macchina(l, x, y, { dentro, giro = 0, salto = 0, vibra = 0 }) {
  x += vibra
  l.riquadro(x, y, 48, 72)
  l.orizz(x + 1, y + 12, 46)
  l.riquadro(x + 4, y + 3, 20, 7) // il display
  if (dentro === 'gira') for (let i = 0; i < 3; i++) if ((giro + i) % 3) l.riempi(x + 6 + i * 6, y + 5, 4, 3) // (le tacche che corrono)
  cerchio(l, x + 38, y + 6, 3); l.px(x + 38, y + 4) // la manopola
  l.riempi(x + 6, y + 72, 6, 3); l.riempi(x + 36, y + 72, 6, 3) // i piedini
  const cx = x + 24, cy = y + 42
  cerchio(l, cx, cy, 17); cerchio(l, cx, cy, 14)
  if (dentro === 'gira') {
    // l'acqua (un pixel sì e uno no, sotto la riga dell'acqua) e i tre panni che girano
    for (let j = 3; j <= 13; j++) for (let i = -13; i <= 13; i++) if (i * i + j * j <= 144 && (i + j) % 2 === 0) l.px(cx + i, cy + j)
    const a0 = giro * 0.7
    for (let k = 0; k < 3; k++) { const a = a0 + (k * Math.PI * 2) / 3; l.riempi(Math.round(cx + Math.cos(a) * 8) - 2, Math.round(cy + Math.sin(a) * 8) - 2, 4, 4) }
    return
  }
  const ic = { sporchi: 'sacco', pronta: 'pzk', galera: 'lucchetto' }[dentro]
  if (ic) { l.bitmap(icone.bitmap(ic, 16), cx - 8, cy - 8 - salto); return }
  // vuota: due riflessi sul vetro
  for (let i = 0; i < 4; i++) { l.px(cx - 7 + i, cy - 4 - i); l.px(cx - 4 + i, cy - 2 - i) }
}

/** Il tasto disegnato a mano nella colonna a destra (centrato lì, non su tutto lo schermo: a sinistra c'è la macchina). */
function tasto(l, zona, eti, y, premi) {
  const w = Lcd.larghezza(eti) + 8, x = Math.round((X0 + X1) / 2 - w / 2)
  l.riempi(x, y, w, 11); l.testo(x + 4, y + 2, eti, { inv: true })
  zona(x, y - 2, w, 15, premi)
}

const REGOLE = (pulizia) => [
  { titolo: 'la lavatrice' },
  { testo: `Lava fino a ${fmt(MAX)} $pzk sporchi alla volta: dopo dieci minuti sono puliti, e si spendono e si mandano come gli altri.` },
  { titolo: 'quanto costa' },
  { testo: `${fmt(COSTO)} $pzk puliti a lavaggio, alla cassa di pzk: sempre gli stessi, sia per 3.000 sia per 50.000. Conviene lavare il massimo.` },
  { titolo: 'le regole' },
  { punto: 'una lavatrice alla volta' },
  { punto: 'in galera non parte; quella che gira finisce lo stesso' },
  { punto: `gli sporchi lasciati lì si puliscono da soli dopo 96 giorni${pulizia ? ` (i primi il ${quando(pulizia)})` : ''}` },
  { titolo: 'da dove vengono' },
  { testo: 'Dalle rapine alla cassa di pzk (app rapina): il bottino è sporco. Si vede nel saldo, ma con pzk non si spende e non si manda.' },
]

export function vista(os) {
  let scelta = 0 // (0 = il massimo; l'indice in quantita())
  let giuS = 0, giuR = 0
  let giro = 0, salto = 0, eraGira = false

  const qs = (s) => quantita(s.max)
  const q = (s) => qs(s)[Math.min(scelta, qs(s).length - 1)] ?? 0
  /** Com'è messa (decide cosa disegna la prima pagina e cosa fanno i tasti). */
  const come = (s) => (s.gira ? 'gira' : s.pronto ? 'pronta' : s.dentro ? 'galera' : s.sp > 0 ? 'ferma' : 'vuota')

  async function lavaQ(x) {
    const s = stato(), n = q(s)
    if (s.dentro) return x.dì(false, 'in galera non si lava niente')
    if (s.pu < COSTO) return x.dì(false, `servono ${fmt(COSTO)} puliti: ne hai ${corti(s.pu)}`)
    if (!(n > 0)) return x.dì(false, 'non hai soldi sporchi da lavare')
    const r = await os.dialogo({ titolo: 'si lava?', icona: 'app-lavatrice', tasti: ['no', 'lava'],
      testo: `${fmt(n)} sporchi in lavatrice per dieci minuti. Commissione: ${fmt(COSTO)} puliti${n < COSTO ? ', più di quanto lavi: ci perdi' : ''}.` })
    if (r !== 'lava' || !x.qui()) return
    const d = await x.aspetta('carico la lavatrice…', () => lava(n))
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    scelta = 0
    os.suoni.sigla('lavatrice')
    x.dì(true, `lava: pronti alle ${ora(d.fatto?.lavaggio?.fino ?? Date.now() + DURATA)}`)
  }
  async function ritiraOra(x) {
    const d = await x.aspetta('ritiro i puliti…', () => ritira())
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore ?? 'non va: riprova')
    if (pzk.lavaggio()) return x.dì(false, 'quasi: ancora qualche secondo') // (l'ora della banca non è ancora arrivata)
    os.suoni.sigla('moneta')
    x.dì(true, `+${fmt(d.n)} $pzk puliti`)
  }

  const macchinaPag = {
    nome: 'lavatrice', icona: 'app-lavatrice',
    aiuto() {
      const s = stato(), c = come(s)
      if (c === 'ferma') return s.pu >= COSTO ? (qs(s).length > 1 ? 'OK lava · ↑↓ quanto · ←→ pagine' : 'OK lava · ←→ pagine') : '←→ pagine'
      if (c === 'pronta') return 'OK ritira · ←→ pagine'
      return '←→ pagine'
    },
    ok(x) {
      const s = stato(), c = come(s)
      if (c === 'ferma') lavaQ(x)
      else if (c === 'pronta') ritiraOra(x)
    },
    tic(t) {
      let ancora = false
      const s = stato()
      if (eraGira && !s.gira && s.pronto) { os.suoni.sigla('lavatrice-pronta'); salto = 8 } // (finita mentre si guarda)
      eraGira = s.gira
      if (s.gira && t % 5 === 0) { giro++; ancora = true } // (due volte al secondo: il cestello e i secondi che corrono)
      if (salto > 0) { salto--; ancora = true }
      return ancora
    },
    disegna(l, x) {
      const s = stato(), c = come(s)
      const su = salto > 0 ? [0, 2, 4, 5, 4, 2, 1, 0][8 - salto] ?? 0 : 0
      macchina(l, 8, 34, { dentro: { ferma: 'sporchi', gira: 'gira', pronta: 'pronta', galera: 'galera', vuota: 'vuota' }[c], giro, salto: su, vibra: s.gira ? giro % 2 : 0 })
      if (c === 'gira') {
        const lav = s.lav, resta = lav.fino - Date.now(), k = Math.max(0, Math.min(1, 1 - resta / DURATA))
        l.testo(X0, 34, 'in lavaggio')
        const n = fmt(lav.n); l.testo(X0, 44, n, { scala: 2 }); l.testo(X0 + 4 + Lcd.larghezza(n, 2), 51, '$pzk')
        l.testo(X0, 65, 'fra'); l.testo(X0 + 22, 62, mmss(resta), { scala: 2 })
        l.riquadro(X0, 81, X1 - X0, 7); l.riempi(X0 + 2, 83, Math.round((X1 - X0 - 4) * k), 3)
        l.testo(X0, 92, `pronti alle ${ora(lav.fino)}`)
        l.testo(X0, 103, corto(s.dentro ? 'in galera, ma questa finisce' : 'puoi chiudere: lava da sola', 30))
        return
      }
      if (c === 'pronta') {
        l.testo(X0, 34, 'lavaggio finito')
        l.testo(X0, 44, `+${fmt(s.lav.n)}`, { scala: 2 })
        l.testo(X0, 62, 'sporchi diventati puliti')
        l.testo(X0, 71, corto(`ritirati, avrai ${corti(s.pu + s.lav.n)} puliti`, 30)) // (finché non si ritira, quelli lavati contano ancora fra gli sporchi)
        tasto(l, x.zona, 'ritira', 99, () => ritiraOra(x))
        return
      }
      if (c === 'galera') {
        l.testo(X0, 34, 'in galera', { scala: 2 })
        l.testo(X0, 53, `fino alle ${ora(pzk.galera())}`)
        Lcd.acapo('la lavatrice non parte. Si esce prima con la cauzione: app rapina.', 30).slice(0, 3).forEach((r, i) => l.testo(X0, 66 + i * 9, r))
        if (s.sp > 0) l.testo(X0, 101, corto(`da lavare: ${corti(s.sp)} sporchi`, 30))
        return
      }
      if (c === 'vuota') {
        l.testo(X0, 34, 'niente da lavare')
        Lcd.acapo('I soldi sporchi vengono dalle rapine alla cassa di pzk: si vedono nel saldo, ma non si spendono. Qui tornano puliti.', 30).slice(0, 5).forEach((r, i) => l.testo(X0, 47 + i * 9, r))
        l.testo(X0, 101, corto(`hai ${corti(s.pu)} $pzk puliti`, 30))
        return
      }
      // ferma, con gli sporchi: quanto, la commissione, come sarai dopo
      const n = q(s), d = dopo(n, s.sp, s.pu), Q = qs(s)
      l.testo(X0, 34, 'da lavare'); destra(l, X1, 34, corto(`hai ${corti(s.sp)} sporchi`, 18))
      const sn = fmt(n); l.testo(X0, 44, sn, { scala: 2 }); l.testo(X0 + 4 + Lcd.larghezza(sn, 2), 51, '$pzk')
      if (Q.length > 1 && s.pu >= COSTO) { // (senza la commissione ↑ ↓ non fanno niente: niente frecce, REGOLE.md 3.3)
        const piu = scelta > 0, meno = scelta < Q.length - 1
        if (piu) { l.testo(X1 - 6, 43, '▲'); x.zona(X1 - 9, 41, 12, 9, () => { scelta--; os.ridisegna() }) }
        if (meno) { l.testo(X1 - 6, 52, '▼'); x.zona(X1 - 9, 51, 12, 9, () => { scelta++; os.ridisegna() }) }
      }
      puntini(l, 63, 'commissione', `${fmt(COSTO)} · ${pct(COSTO, n)}`, { x0: X0, x1: X1 })
      puntini(l, 72, 'puliti dopo', corti(d.puliti), { x0: X0, x1: X1 })
      puntini(l, 81, 'restano', d.restano > 0 ? `${corti(d.restano)} · ${d.ancora} ${d.ancora === 1 ? 'lavaggio' : 'lavaggi'}` : 'nessuno', { x0: X0, x1: X1 })
      if (s.pu < COSTO) {
        l.testo(X0, 90, `la commissione è ${fmt(COSTO)} puliti`)
        l.testo(X0, 99, corto(`e ne hai ${corti(s.pu)}.`, 30))
        l.testo(X0, 108, 'si fanno col lavoro e le quest')
        return
      }
      l.testo(X0, 90, corto(n < COSTO ? '⚠ lavi meno della commissione' : `pronti in 10 minuti`, 30))
      tasto(l, x.zona, `lava ${fmt(n)}`, 101, () => lavaQ(x))
    },
    tasto(k) {
      const s = stato()
      if (come(s) !== 'ferma' || s.pu < COSTO) return false
      const n = qs(s).length
      scelta = Math.min(scelta, n - 1) // (gli sporchi possono essere cambiati: qui e non nel disegno, REGOLE.md 4.8)
      if (k === 'su') { scelta = Math.max(0, scelta - 1); return true }
      if (k === 'giu') { scelta = Math.min(n - 1, scelta + 1); return true }
      return false
    },
  }

  const VIS = 9
  const righeStoria = () => storia(pzk.conto()).flatMap((m) => {
    const [nome, cosa, segno] = STORIA[m.tipo]
    return [{ s: corto(`${quando(m.t)} · ${nome}`, 37) }, { s: corto(`   ${segno === 'meno' ? '-' : '+'}${fmt(m.n)} ${cosa}`, 37) }]
  })
  const storiaPag = {
    nome: 'la storia', icona: 'clessidra',
    aiuto: () => (righeStoria().length > VIS ? '↑↓ scorre · ←→ pagine' : '←→ pagine'),
    disegna(l) {
      const R = righeStoria()
      if (!R.length) { centro(l, 60, 'ancora niente coi soldi sporchi'); centro(l, 72, 'le rapine, i lavaggi: qui'); return }
      giuS = scorrevole(l, R, { y0: 34, vis: VIS, giu: giuS })
    },
    tasto(k) {
      const n = Math.max(0, righeStoria().length - VIS)
      if (k === 'su') { giuS = Math.max(0, giuS - 2); return true }
      if (k === 'giu') { giuS = Math.min(n, giuS + 2); return true }
      return false
    },
  }
  const regole = {
    nome: 'come funziona', icona: 'lucchetto',
    aiuto: '↑↓ legge · ←→ pagine',
    disegna(l) { giuR = scorrevole(l, impagina(REGOLE(stato().pulizia)), { y0: 34, vis: VIS, giu: giuR }) },
    tasto(k) {
      const n = Math.max(0, impagina(REGOLE(stato().pulizia)).length - VIS)
      if (k === 'su') { giuR = Math.max(0, giuR - 1); return true }
      if (k === 'giu') { giuR = Math.min(n, giuR + 1); return true }
      return false
    },
  }

  return pagine(os, {
    nome: 'lavatrice', app: 'lavatrice',
    pagine: [macchinaPag, storiaPag, regole],
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
    entra: () => { eraGira = stato().gira },
  })
}
