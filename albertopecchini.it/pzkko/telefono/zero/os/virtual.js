// L'app «virtual» di pzk os (29.10, Alberto: «crea uno alla volta … virtual …»): il campionato virtuale sul cercapersone
// zero. La partita è quella del gioco grande (games/virtual/partita.js: il ciclo di cinque minuti, deciso dall'orario), lo
// schermino è il SUO (games/virtual/schermo.js: il campo, gli omini, gli spalti, la telecamera, il meteo, i replay), con le
// due primitive (il pixel e il rettangolo) che qui scrivono su un lcd a un bit: ogni colore diventa una trama secondo la sua
// luce. Le scommesse e i pagamenti passano dalla STESSA schedina della finestra grande (games/virtual/schedina.js), che dal
// 31.10 è quella della banca (Alberto: «il browser non decide più niente»): ogni giocata si chiede alla banca (con la
// rotellina in fondo, regola 8.6), il risultato e la cronaca arrivano dalla banca a partita iniziata, e le partite finite
// le paga lei; qui si chiede e si mostra.
// - LA PARTITA: lo schermino a metà, il tabellone (le sigle, il punteggio, il minuto o quanto manca al fischio), la voce
//   della telecronaca. ↓ la partita a schermo intero, senza barra, a misura vera (192 × 120), dieci fotogrammi al secondo.
// - LE QUOTE: la fiche (OK la cambia), 1 X 2 e gli over/under con le fiches che ci hai messo (OK punta), «togli l'ultima»;
//   in cima quanto hai e quanto è sulla partita. Si punta solo nei quattro minuti prima del fischio.
// - LA SCHEDINA: le giocate (la partita, la puntata alla quota, l'esito o quanto paga).
// Finita una partita, al giro dopo la banca la paga e la striscia lo dice; quelle finite ad app chiusa le paga entrando. I suoni
// (il fischio, il gol, il palo, la fiche, la vincita) sono le sigle virtual-* di suono/interfaccia.js, via os.suoni.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import { PUNTATE, PER_PUNTATA, fase, aperte as giocateAperte, adesso, partita, minuto, punteggioA, scriviRisultato, CHIUDE } from '../../../games/virtual/partita.js'
import { Schermo, LARG, ALT } from '../../../games/virtual/schermo.js'
import * as SC from '../../../games/virtual/schedina.js'
import { txt, corto, destra, centro, puntini, elenco, muovi, pagine, striscia } from './pezzi.js'

const fmt = pzk.fmt, q = SC.fmtQuota
const METEO = { sereno: 'sereno', nuvole: 'nuvoloso', pioggia: 'pioggia', nebbia: 'nebbia', neve: 'neve', vento: 'vento forte' }

// ── lo schermino del gioco, a un bit: le sue primitive scrivono la luce di ogni pixel grosso, poi la luce diventa trama ──
const lume = (col) => {
  const s = String(col).trim()
  let r = 0, g = 0, b = 0, a = 1, m
  if ((m = /^#([0-9a-f]{3})$/i.exec(s))) [r, g, b] = [...m[1]].map((c) => parseInt(c + c, 16))
  else if ((m = /^#([0-9a-f]{6})$/i.exec(s))) [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16))
  else if ((m = /^rgba?\(([^)]+)\)$/i.exec(s))) { const v = m[1].split(',').map((x) => parseFloat(x)); [r, g, b] = v; a = v[3] ?? 1 }
  return [(0.299 * r + 0.587 * g + 0.114 * b) / 255, a]
}
const nulla = () => {}
class SchermoUnBit extends Schermo {
  constructor() {
    super({ getContext: () => ({ save: nulla, restore: nulla, fillRect: nulla, createRadialGradient: () => ({ addColorStop: nulla }), set fillStyle(_) {}, set imageSmoothingEnabled(_) {} }) })
    this.k = 1
    this.lumi = new Float32Array(LARG * ALT) // (non «luce»: lo Schermo ha già il suo metodo luce(), quello della luce del giorno)
  }
  px(x, y, col) { this.rett(x, y, 1, 1, col) }
  rett(x, y, w, h, col) {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(LARG, Math.round(x + w)), y1 = Math.min(ALT, Math.round(y + h))
    if (x1 <= x0 || y1 <= y0) return
    const [v, a] = lume(col)
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { const k = j * LARG + i; this.lumi[k] = a >= 1 ? v : this.lumi[k] * (1 - a) + v * a }
  }
}
// le trame: dal buio (pieno) alla luce (vuoto), cinque gradini; il campo verde viene a puntini radi, le righe bianche vuote
const TRAMA = [() => true, (x, y) => (x + y) % 2 === 0 || y % 2 === 0, (x, y) => (x + y) % 2 === 0, (x, y) => x % 2 === 0 && y % 2 === 0, () => false]
const gradino = (v) => (v < 0.18 ? 0 : v < 0.32 ? 1 : v < 0.46 ? 2 : v < 0.62 ? 3 : 4)
// IN CAMPO la resa si adatta al fotogramma (di notte e con la pioggia le due righe d'erba venivano due trame scure e gli
// omini ci sparivano dentro): le due luci più frequenti sono l'erba, a puntini radi; più scuro dell'erba (gli omini, le
// ombre) pieno o fitto; più chiaro (le righe, la palla, le maglie chiare) carta. Fuori dal campo (l'attesa, il tabellone)
// i cinque gradini fissi, che lì si leggono già bene.
function erbaDi(s) {
  const conta = new Uint32Array(64)
  for (let i = 0; i < s.lumi.length; i++) conta[Math.min(63, Math.floor(s.lumi[i] * 64))]++
  let a = 0, b = 0
  for (let i = 1; i < 64; i++) { if (conta[i] > conta[a]) { b = a; a = i } else if (i !== a && conta[i] > conta[b]) b = i }
  return [Math.min(a, b) / 64 - 0.02, (Math.max(a, b) + 1) / 64 + 0.02]
}
function disegnaSchermo(l, s, x0, y0, mezzo, inCampo = false) {
  const k = mezzo ? 2 : 1, w = LARG / k, h = ALT / k, erba = inCampo ? erbaDi(s) : null
  const passo = (v) => (!erba ? gradino(v) : v >= erba[0] && v <= erba[1] ? 3 : v < erba[0] ? (v < erba[0] - 0.12 ? 0 : 1) : 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) v += s.lumi[(y * k + j) * LARG + x * k + i]
    if (TRAMA[passo(v / (k * k))](x, y)) l.px(x0 + x, y0 + y)
  }
}

// ── il campionato: la partita di adesso, la fase, il pagamento della finita ──
function campionato(os, avvisa) {
  const suona = (nome) => os.suoni.sigla(nome) // (l'interruttore dei suoni lo guarda os.suoni, non l'app: regola 7.4)
  const c = { corrente: fase(), P: null, voce: '', schermo: new SchermoUnBit(), ultimoT: performance.now(), evento: null, suona }
  c.P = partita(c.corrente.indice)
  // (31.10) la fase è cambiata, o si sono chiuse le giocate (CHIUDE prima del fischio: lo dice la banca)
  c.cambiata = (f) => f.indice !== c.corrente.indice || f.fase !== c.corrente.fase || giocateAperte(f) !== giocateAperte(c.corrente)
  c.aggiorna = () => {
    const prima = c.corrente
    c.corrente = fase()
    if (prima.indice !== c.corrente.indice) {
      // la finita la paga la banca: si aspetta la sua risposta e la striscia dice com'è andata
      SC.fine(prima.indice).then((r) => { if (!r) return; avvisa(r.torna > 0, r.torna > 0 ? `${r.casa}–${r.ospite} ${r.risultato}: +${fmt(r.torna)} $pzk` : `${r.casa}–${r.ospite} ${r.risultato}: niente, stavolta`); if (r.torna > 0) suona('virtual-vinta'); SC.viste() })
      c.P = partita(c.corrente.indice); c.voce = ''
    } else if (prima.fase !== c.corrente.fase && c.corrente.fase === 'partita') { suona('virtual-fischio'); c.voce = '' }
    // (il palinsesto a ogni cambio: le quote della banca, e dal fischio la cronaca)
    if (prima.indice !== c.corrente.indice || prima.fase !== c.corrente.fase) SC.palinsesto()
  }
  // in partita la cronaca è della banca (SC.cronaca la chiede finché non c'è): intanto il secondo zero, il «si comincia»
  c.t = () => (c.corrente.fase === 'partita' ? (c.P.cronaca ? (adesso() - c.P.inizio) / 1000 : 0) : -(c.corrente.manca / 1000))
  /** Un fotogramma dello schermino (e la voce degli eventi). */
  c.fotogramma = () => {
    const f = fase()
    if (c.cambiata(f)) c.aggiorna(); else c.corrente = f
    c.P = c.corrente.fase === 'partita' ? SC.cronaca(c.corrente.indice) : partita(c.corrente.indice) // (con quello che la banca ha detto)
    const now = performance.now(), P = c.P, t = c.t()
    c.schermo.disegna(P, { fase: c.corrente.fase === 'partita' && P.cronaca ? 'partita' : 'scommesse', t, ridotto: false, dt: Math.min(0.5, (now - c.ultimoT) / 1000) })
    c.ultimoT = now
    const e = c.schermo.evento
    if (e !== c.evento) {
      c.evento = e
      if (e && c.corrente.fase === 'partita') {
        if (e.tipo === 'gol') { suona('virtual-gol'); c.voce = `GOL! ${e.chi.nome} (${P[e.squadra].sigla}) al ${e.minuto}` }
        else if (e.tipo === 'tiro' && e.esito === 'palo') { suona('virtual-palo'); c.voce = `palo di ${P[e.squadra].sigla} al ${e.minuto}!` }
        else if (e.tipo === 'rigore') c.voce = `rigore per ${P[e.squadra].sigla}: ${e.esito}`
        else if (e.tipo === 'rosso') c.voce = `espulso ${e.chi.nome} (${P[e.squadra].sigla})`
        else if (e.tipo === 'giallo') c.voce = `ammonito ${e.chi.nome} (${P[e.squadra].sigla})`
        else if (e.tipo === 'infortunio') c.voce = `${e.chi.nome} esce, entra ${e.entra.nome}`
        else if (e.tipo === 'sospesa') c.voce = `sospesa: ${e.causa}. ${scriviRisultato(P.risultato)}`
        else if (e.tipo === 'intervallo') { suona('virtual-fischio'); c.voce = 'intervallo' }
        else if (e.tipo === 'fine') { suona('virtual-fischio'); c.voce = `finale: ${scriviRisultato(P.risultato)}` }
      }
    }
  }
  c.tabellone = () => {
    const P = c.P, t = c.t()
    if (c.corrente.fase === 'partita' && !P.cronaca) return { punti: '0-0', sotto: 'si comincia' } // (la cronaca della banca sta arrivando)
    if (c.corrente.fase === 'partita') {
      const pt = punteggioA(P, Math.max(0, t)), sosp = P.eventi.find((e) => e.tipo === 'sospesa' && e.t <= t)
      const mn = sosp ? 'sospesa' : minuto(t).scritta
      return { punti: sosp ? `${P.risultato.casa}-${P.risultato.ospite}` : `${pt.casa}-${pt.ospite}`, sotto: mn === 'INT' ? 'intervallo' : mn === 'FINE' ? 'finale' : `${mn} · ${Math.ceil(c.corrente.manca / 1000)}s` }
    }
    const s = Math.ceil(Math.max(0, c.corrente.manca - CHIUDE) / 1000) // (le giocate chiudono CHIUDE prima del fischio)
    return { punti: 'vs', sotto: giocateAperte(c.corrente) ? `si chiude tra ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `chiuse · fischio tra ${Math.ceil(c.corrente.manca / 1000)}s` }
  }
  return c
}

// ── la partita a schermo intero ──
function grande(os, c) {
  return {
    nome: 'virtual-grande', app: 'virtual', senzaBarra: true,
    tic() { c.fotogramma(); os.ridisegna() },
    disegna(l) { disegnaSchermo(l, c.schermo, Math.round(W / 2 - LARG / 2), Math.round(H / 2 - ALT / 2), false, c.corrente.fase === 'partita'); os.zona(0, 0, W, H, () => os.togli()) },
    tasto(k) { if (k === 'indietro' || k === 'ok' || k === 'su') os.togli(); return true },
  }
}

// ── le pagine ──
let ultima = 0
export function vista(os) {
  let x0 = null
  const avvisa = (ok, testo) => x0?.dì(ok, testo)
  const c = campionato(os, avvisa)
  SC.avvia()
  const stQ = { sel: 0, da: 0 }, stS = { sel: 0, da: 0 }
  const aperte = () => giocateAperte(c.corrente)
  // (sulle quote e sulla schedina il cambio di turno si guarda due volte al secondo: chiude le scommesse, paga la finita)
  const turno = (t) => { if (t % 5) return false; if (c.cambiata(fase())) { c.aggiorna(); return true } return false }
  // le partite finite ad app chiusa: entrando si chiede alla banca, che le paga, e la striscia dice com'è andata: le vinte
  // non ancora viste, o quante sono andate male. (31.10: la risposta arriva dopo: si dice solo se l'app è ancora in cima)
  const scadute = () => SC.riscuoti().then((pagate) => {
    if (os.corrente() !== v) return
    const vinte = SC.daVedere()
    if (vinte.length) { avvisa(true, `${vinte.length > 1 ? `${vinte.length} giocate vinte` : 'una giocata vinta'}: +${fmt(vinte.reduce((a, b) => a + SC.vincitaDi(b), 0))} $pzk`); c.suona('virtual-vinta') }
    else if (pagate.length) avvisa(false, `${pagate.length > 1 ? `${pagate.length} partite finite` : 'la partita è finita'}: niente, stavolta`)
    SC.viste()
  })
  const mie = (id) => SC.diPartita(c.corrente.indice).filter((b) => b.id === id && !b.pagata).reduce((a, b) => a + b.puntata, 0)
  // (31.10) la giocata la fa la banca: la rotellina in fondo finché risponde, e intanto nessun'altra richiesta (x.aspetta)
  async function punta(id, x) {
    c.fotogramma()
    if (!aperte()) return x.dì(false, c.corrente.fase === 'scommesse' ? 'giocate chiuse: sulla prossima' : 'in corso: si punta sulla prossima')
    const v = SC.S.fiche, r = await x.aspetta('la banca…', () => SC.punta(c.P, id, v))
    if (!r || !x.qui()) return // (un'altra richiesta in volo, o l'app non è più in cima: regola 8.4)
    if (r.ricaricato) return x.dì(true, `altri ${fmt(pzk.INIZIALE)} $pzk finti: punta`)
    if (!r.ok) return x.dì(false, r.motivo === 'secco' ? pzk.perche() : r.motivo === 'chiuse' ? 'giocate chiuse: sulla prossima' : r.motivo === 'banca' ? r.errore : r.motivo === 'nonbastano' ? `non ti bastano: hai ${fmt(pzk.saldo())} $pzk` : 'hai finito i $pzk')
    c.suona('virtual-fiche')
    c.voce = `${PER_PUNTATA.get(id).nome} a ${q(r.quota)}: se va, ${fmt(Math.round(r.puntata * r.quota * 2) / 2)} $pzk`
    x.dì(true, `${fmt(v)} su ${PER_PUNTATA.get(id).nome} a ${q(r.quota)}`)
  }
  async function togli(x) {
    if (!aperte()) return x.dì(false, c.corrente.fase === 'scommesse' ? 'le giocate sono chiuse' : 'la partita è in corso')
    const t = await x.aspetta('la banca…', () => SC.togli(c.corrente.indice))
    if (!t || !x.qui()) return
    x.dì(t.ok, t.ok ? `tolta la fiche da ${fmt(t.v)}` : t.errore)
  }
  const pPartita = {
    nome: 'la partita', icona: 'app-virtual',
    aiuto: '↓ la guardi grande · ←→ pagine',
    tic: (t) => { c.fotogramma(); return true }, // (lo schermino si muove sempre)
    disegna(l, x) {
      const P = c.P, tb = c.tabellone()
      disegnaSchermo(l, c.schermo, 8, 34, true, c.corrente.fase === 'partita'); l.riquadro(7, 33, LARG / 2 + 2, ALT / 2 + 2)
      x.zona(7, 33, LARG / 2 + 2, ALT / 2 + 2, () => os.spingi(grande(os, c)))
      const xd = 8 + LARG / 2 + 8, n = Math.floor((245 - xd) / 6)
      l.testo(xd, 34, corto(`${P.casa.sigla} - ${P.ospite.sigla}`, n))
      l.testo(xd, 45, tb.punti, { scala: 2 })
      l.testo(xd, 62, corto(tb.sotto, n))
      l.testo(xd, 72, corto(`${P.casa.citta}: ${METEO[P.meteo.tipo] ?? ''}, ${P.meteo.temp}°`, n))
      Lcd.acapo(txt(c.voce || `${P.casa.nome} contro ${P.ospite.nome}`), n).slice(0, 2).forEach((r, i) => l.testo(xd, 84 + i * 9, r))
      l.testo(10, 104, corto(`forze ${P.forze.casa}-${P.forze.ospite} · 1 ${q(P.quote['1'])}  X ${q(P.quote.X)}  2 ${q(P.quote['2'])}`, 39)) // (sotto la telecronaca, non addosso)
    },
    tasto(k) { if (k === 'giu') { os.spingi(grande(os, c)); return true } return false },
  }
  const vociQuote = () => [{ fiche: true }, ...PUNTATE.map((p) => ({ p })), { togli: true }]
  // la fiche: sulla sua riga ← → la cambiano (il ▶ accanto al valore dice il vero: regola 3.3), OK la gira in avanti
  const giraFiche = (d) => { const F = pzk.FICHES, i = Math.max(0, F.indexOf(SC.S.fiche)); SC.S.fiche = F[(i + d + F.length) % F.length]; os.ridisegna() }
  const pQuote = {
    nome: 'le quote', icona: 'pzk',
    // (il suggerimento della riga scelta: sull'ultima OK toglie, non punta)
    aiuto: () => (stQ.sel === 0 ? '←→ o OK cambia la fiche · ↑↓' : !aperte() ? (c.corrente.fase === 'scommesse' ? 'giocate chiuse: sulla prossima' : 'in corso: si punta sulla prossima') : vociQuote()[stQ.sel]?.togli ? 'OK toglie l’ultima · ↑↓ · ←→ pagine' : 'OK punta · ↑↓ · ←→ pagine'),
    ok: (x) => {
      const v = vociQuote()[stQ.sel]
      if (v.fiche) return giraFiche(1)
      if (v.togli) return togli(x)
      punta(v.p.id, x)
    },
    disegna(l, x) {
      const sul = SC.sulTavolo(c.corrente.indice)
      l.testo(10, 34, corto(`hai ${pzk.fmtCorto(pzk.saldo())} $pzk${sul ? ` · sulla partita ${fmt(sul)}` : ''}`, 39))
      elenco(l, x.zona, {
        voci: vociQuote(), stato: stQ, y0: 44, alta: 72, passo: 12,
        clic: () => pQuote.ok(x),
        riga(l, v, xx, y, w, on) {
          const o = { inv: on }
          if (v.fiche) { // (scelta: il valore fra ◀ ▶, che si cliccano; le zone dopo quella della riga, così vincono)
            const s = on ? `◀ ${fmt(SC.S.fiche)} ▶` : fmt(SC.S.fiche), ws = Lcd.larghezza(s)
            l.testo(xx, y + 2, 'la fiche', o); destra(l, xx + w, y + 2, s, o)
            if (on) { x.zona(xx + w - ws - 2, y, 10, 11, () => giraFiche(-1)); x.zona(xx + w - 8, y, 10, 11, () => giraFiche(1)) }
            return
          }
          if (v.togli) { l.testo(xx, y + 2, 'togli l’ultima fiche', o); return }
          const m = mie(v.p.id), qq = q(c.P.quote[v.p.id])
          destra(l, xx + w, y + 2, qq, o)
          l.testo(xx, y + 2, corto(`${v.p.nome}${m ? ` · ${fmt(m)} sopra` : ''}`, 18), o)
          l.testo(xx + 108, y + 2, corto(v.p.dice, Math.floor((w - 108 - Lcd.larghezza(qq) - 6) / 6)), o)
        },
      })
    },
    tic: turno,
    tasto(k) {
      if ((k === 'sx' || k === 'dx') && stQ.sel === 0) { giraFiche(k === 'sx' ? -1 : 1); return true } // (sulle altre righe ← → sfogliano)
      return muovi(stQ, vociQuote().length, k)
    },
  }
  const pSchedina = {
    nome: 'la schedina', icona: 'app-quiz',
    aiuto: '↑↓ scorre · ←→ pagine',
    disegna(l, x) {
      const L = [...SC.S.schedina].reverse().slice(0, 30)
      if (!L.length) { centro(l, 60, 'la schedina è vuota:'); centro(l, 70, 'punta dalle quote'); return }
      elenco(l, x.zona, {
        voci: L, stato: stS, y0: 33, alta: 84, passo: 20,
        riga(l, b, xx, y, w, on) {
          const o = { inv: on }, pu = PER_PUNTATA.get(b.id), qui = b.indice === c.corrente.indice, v = SC.vincitaDi(b)
          const esito = b.pagata ? (b.esito === 'vinta' ? `+${fmt(v)}` : 'persa') : qui && c.corrente.fase === 'partita' ? 'in corso' : `→ ${fmt(v)}`
          destra(l, xx + w, y + 2, esito, o)
          l.testo(xx, y + 2, corto(`${b.casa}-${b.ospite}${b.risultato ? ` ${b.risultato}` : ''}`, Math.floor((w - Lcd.larghezza(esito) - 6) / 6)), o)
          l.testo(xx + 6, y + 11, corto(`${pu?.nome ?? b.id} @ ${q(b.quota)} · ${fmt(b.puntata)} $pzk`, Math.floor((w - 6) / 6)), o)
        },
      })
    },
    tic: turno,
    tasto(k) { return muovi(stS, Math.min(30, SC.S.schedina.length), k) },
  }
  const v = pagine(os, {
    nome: 'virtual', app: 'virtual', iniziale: ultima,
    pagine: [pPartita, pQuote, pSchedina],
    ascolta: [(f) => SC.ascolta(f), (f) => pzk.ascolta(f)],
    entra: (x) => { x0 = x; c.aggiorna(); SC.palinsesto(); scadute() },
    esci: (x) => { ultima = x.pag },
  })
  return v
}
