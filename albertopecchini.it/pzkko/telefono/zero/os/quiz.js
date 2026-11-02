// L'app «quiz» di pzk os (29.10, Alberto: «crea uno alla volta … quiz …»): i quiz che pagano sul cercapersone zero. Le
// domande, i premi, la serie, il tetto giornaliero e la partita sono quelli di chat/quiz.js (nuova, prossima, rispondi,
// restanti, record), come il quiz del cercapersone vecchio. (31.10) La partita la fa la banca: una domanda alla volta, senza
// la giusta, col tempo della banca; aspettando la sua risposta in fondo gira la rotellina e i tasti sono fermi.
// - L'INGRESSO: le regole in una riga, quante pagate restano oggi, il record, le giuste; sotto gli argomenti (↑ ↓, OK parte).
// - LA DOMANDA: a che punto sei e i pallini (pieno giusta, x sbagliata), la barra dei 15 secondi che si accorcia (gli ultimi
//   tre ticchettano), la difficoltà col premio, la serie; il testo; le quattro risposte A–D (↑ ↓ e OK, o i tasti a–d e 1–4;
//   la scelta lunga scorre da sola). Le foto arrivano a un bit col retino di Bayer (se il browser non le lascia leggere, si tira
//   a indovinare). Risposto: la giusta col ✓, la tua sbagliata con la x, al posto della domanda la spiegazione, in fondo il
//   premio; poi la prossima arriva da sola (2.11, Alberto: «fai che i quiz avanzino senza premere ogni volta enter»): 2,5 s
//   dopo una giusta, 4,5 s dopo una sbagliata (c'è la spiegazione da leggere), con la barretta che si accorcia sopra
//   l'esito; OK va avanti subito. INDIETRO chiede se lasciare la partita (il tempo intanto si ferma).
// - IL RIEPILOGO: quante giuste, i pallini, quanto hai preso, e i tasti argomenti e ancora.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { foto as fotoBitmap } from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import * as quiz from '../../../chat/quiz.js'
import { fmt } from '../../../games/pzk.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, bottoni } from './pezzi.js'

const NOMI = ['', 'facile', 'media', 'difficile']
const LETTERE = 'ABCD'
const DOPO = { giusta: 2500, sbagliata: 4500 } // quanto resta l'esito prima della prossima domanda (OK la chiama subito)

// ── il riepilogo ──
function fine(os, p, ancora, argomenti) {
  let sel = 1, attesa = null, esito = null
  const perfetta = p.giuste === p.n
  // (come la x di pezzi.pagine: «ancora» prepara la partita nuova da qui, con la rotellina in fondo e l'esito se non ci sono domande)
  const x = {
    get attesa() { return attesa },
    async aspetta(testo, fai) {
      if (attesa) return null
      attesa = testo; esito = null; os.ridisegna()
      try { return await fai() } finally { attesa = null; os.ridisegna() }
    },
    dì(ok, testo) { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() },
    qui: () => os.corrente() === v,
  }
  const premi = (i) => { if (attesa) return; if (i === 0) argomenti(); else ancora(x) } // (preparando, niente doppie partite)
  const v = {
    nome: 'quiz-fine', app: 'quiz',
    entra() { if (perfetta) os.suoni.sigla('sfide') },
    tic() { const scaduto = esito && Date.now() >= esito.fino; if (scaduto) esito = null; if (attesa || scaduto) os.ridisegna() }, // (la rotellina gira, l'esito se ne va)
    disegna(l, t) {
      l.bitmap(icone.bitmap(perfetta ? 'bot-ride' : p.giuste >= p.n / 2 ? 'bot-ride' : 'bot-pensa', 32), 8, 16)
      l.testo(48, 17, `${p.giuste} su ${p.n}`, { scala: 2 })
      // (il bonus lo paga la banca solo con cinque domande o più e almeno una pagata: si dice quello che è successo)
      l.testo(48, 36, corto(perfetta ? (p.bonus ? 'perfetto: il bonus è tuo.' : 'perfetto! (stavolta niente bonus)') : p.giuste >= p.n / 2 ? 'non male: sapevi più di quanto sembri.' : 'si impara anche sbagliando.', 33))
      p.esiti.forEach((x, i) => { const xp = Math.round(W / 2 - (p.esiti.length * 12) / 2) + i * 12; if (x) l.riempi(xp, 54, 9, 9); else { l.riquadro(xp, 54, 9, 9); for (let k = 2; k < 7; k++) { l.px(xp + k, 54 + k); l.px(xp + 8 - k, 54 + k) } } })
      centro(l, 70, corto(`+${fmt(p.guadagnato)} $pzk · +${p.xp} xp`, 38))
      centro(l, 80, corto(`${quiz.restanti()} risposte pagate rimaste oggi`, 38))
      bottoni(l, os.zona, { etichette: ['argomenti', 'ancora'], sel, y: 99, premi: (i) => { sel = i; premi(i) } })
      if (!striscia(l, { esito, attesa }, t)) centro(l, H - 9, '←→ sceglie · OK preme')
    },
    tasto(k) {
      if (attesa) { if (k === 'indietro') argomenti(); return true } // (aspettando le domande non parte altro)
      if (k === 'sx' || k === 'dx') sel = 1 - sel
      else if (k === 'ok') premi(sel)
      else if (k === 'indietro') argomenti()
      else return false
      return true
    },
  }
  return v
}

// ── la partita: una domanda alla volta ──
function partita(os, p, arg, torna) {
  let sel = 0, d = null, inizio = 0, risposto = null, scelta = null, pausa = 0, ultimoSec = 0, scorri = 0
  let banca = null // (31.10) la banca sta rispondendo: 'controllo' o 'prossima'. Intanto il tempo è fermo e i tasti pure
  let via = 0, viaDurata = 0 // (2.11) quando la prossima arriva da sola (performance.now), e quanto dura l'attesa
  // (2.11) fermo: l'istante della risposta. Da lì i secondi e la barra del tempo restano dove sono: prima, con l'esito che si
  // ridisegna per la barretta dell'attesa, si vedeva il tempo correre ancora (10″, 7″…) su una domanda già risposta
  let fermo = 0
  const resto = () => Math.max(0, quiz.TEMPO * 1000 - ((fermo || pausa || performance.now()) - inizio))
  const nuova = () => { d = p.d; sel = 0; risposto = null; scelta = null; inizio = performance.now(); ultimoSec = quiz.TEMPO; scorri = 0; via = 0; fermo = 0 }
  nuova()
  async function rispondi(i) {
    if (risposto || pausa || banca) return
    scelta = i; banca = 'controllo'; pausa = fermo = performance.now(); os.ridisegna()
    const r = await quiz.rispondi(p, i)
    banca = null; pausa = 0
    if (os.corrente() !== v) return
    if (r.errore) { os.togli(); return os.dialogo({ titolo: 'quiz', testo: r.errore, tasti: ['ok'] }) } // (la banca dice di no: la partita finisce qui)
    p.esiti.push(r.giusta)
    if (r.bonus) p.bonus = r.bonus // (il riepilogo dice «il bonus è tuo» solo se chat/quiz.js l'ha pagato davvero)
    risposto = r
    viaDurata = r.giusta ? DOPO.giusta : DOPO.sbagliata; via = performance.now() + viaDurata
    if (r.giusta) os.suoni.sigla('moneta'); else os.suoni.bip('pagerGiu')
    os.ridisegna()
  }
  const avanti = async () => {
    if (!risposto || banca || os.corrente() !== v) return // (due clic nello stesso fotogramma: il secondo non trova più la partita)
    via = 0 // (OK prima del tempo: l'attesa finisce qui, e il tic non la richiama)
    if (p.finita) { os.togli(); os.spingi(fine(os, p, (x) => parti(os, arg, torna, x, true), () => { os.togli() })); return } // («ancora» prepara dal riepilogo, con la rotellina)
    banca = 'prossima'; os.ridisegna()
    const a = await quiz.prossima(p) // (il tempo della banca parte adesso, non mentre si leggeva l'esito)
    banca = null
    if (os.corrente() !== v) return
    if (a !== true) { os.togli(); return os.dialogo({ titolo: 'quiz', testo: a.errore, tasti: ['ok'] }) }
    nuova(); os.ridisegna()
  }
  async function lascia() {
    pausa = performance.now()
    const r = await os.dialogo({ titolo: 'lasci?', testo: 'la partita si perde: le risposte date restano contate.', tasti: ['no', 'lascia'] })
    if (r === 'lascia' && os.corrente() === v) { os.togli(); return } // (se sopra c'è altro non si toglie quello)
    const ferma = performance.now() - pausa
    if (!fermo) inizio += ferma; if (via) via += ferma; pausa = 0 // (col dialogo aperto anche l'attesa della prossima si ferma; a domanda risposta il tempo è già fermo)
  }
  const v = {
    nome: 'quiz-domanda', app: 'quiz',
    tic(t) {
      if (banca) return os.ridisegna() // (la rotellina in fondo)
      if (pausa) return // (in pausa non si anima niente: non si ridisegna)
      if (risposto) { if (!via) return; if (performance.now() >= via) return avanti(); return os.ridisegna() } // (la barretta dell'attesa; poi la prossima da sola)
      const s = Math.ceil(resto() / 1000)
      if (s !== ultimoSec) { ultimoSec = s; if (s <= 3 && s > 0) os.suoni.bip('cursore') }
      if (resto() <= 0) return rispondi(null)
      if (t % 2 === 0) scorri++
      os.ridisegna()
    },
    disegna(l, t) {
      const n = p.n, img = d.img ? fotoBitmap(d.img, 96, 60, () => os.ridisegna()) : null
      // a che punto: il numero e i pallini
      l.testo(10, 14, `domanda ${Math.min(p.i + (risposto ? 0 : 1), n)}/${n}`)
      for (let i = 0; i < n; i++) {
        const xp = W - 12 - (n - i) * 9
        if (i < p.esiti.length) { if (p.esiti[i]) l.riempi(xp, 14, 7, 7); else { l.riquadro(xp, 14, 7, 7); for (let k = 1; k < 6; k++) { l.px(xp + k, 14 + k); l.px(xp + 6 - k, 14 + k) } } }
        else if (i === p.esiti.length && !risposto) { if (t % 10 < 6) l.riquadro(xp, 14, 7, 7) } // (quella di adesso lampeggia)
        else l.px(xp + 3, 17)
      }
      // il tempo che resta
      const k = resto() / (quiz.TEMPO * 1000)
      l.riquadro(10, 24, 208, 5); l.riempi(11, 25, Math.round(206 * k), 3)
      destra(l, 245, 23, `${Math.ceil(resto() / 1000)}"`)
      l.testo(10, 32, `${NOMI[d.diff]} · ${quiz.PAGA[d.diff]} $pzk`)
      if (p.serie > 1 || (risposto?.serie ?? 0) > 1) destra(l, 245, 32, `serie ${risposto ? risposto.serie : p.serie}`)
      // la domanda (o, risposto, la spiegazione); con la foto, la foto a sinistra e le risposte a destra
      const xr = img ? 112 : 10, wr = (img ? 245 : 245) - xr
      if (img) {
        if (img === 'carico') { l.riquadro(10, 42, 96, 60); l.testo(34, 68, 'carico…') }
        else if (img === 'no') { l.riquadro(10, 42, 96, 60); ['la foto', 'non si vede:', 'tira a', 'indovinare'].forEach((r, i) => l.testo(16, 52 + i * 9, r)) }
        else { l.bitmap(img, 10 + Math.round((96 - img.w) / 2), 42 + Math.round((60 - img.h) / 2)); l.riquadro(9, 41, 98, 62) }
      }
      const testo = risposto
        ? (risposto.giusta ? (risposto.nota ?? '') : `era: ${d.risposte[risposto.indiceGiusto]}.${risposto.nota && risposto.nota !== `era ${d.risposte[risposto.indiceGiusto]}.` ? ` ${risposto.nota}` : ''}`)
        : d.q
      if (!img) { // (tre righe prima delle risposte: quello che non ci sta finisce con «…»)
        const nr = Math.floor(wr / 6), tutte = Lcd.acapo(txt(testo), nr), righe = tutte.slice(0, 3)
        if (tutte.length > 3) righe[2] = corto(righe[2] + '…', nr)
        righe.forEach((r, i) => l.testo(10, 42 + i * 9, r))
      }
      // le risposte
      const y0 = img ? 54 : 70, passo = img ? 12 : 11
      d.risposte.forEach((r, i) => {
        const y = y0 + i * passo, on = !risposto && i === sel
        const segno = risposto ? (i === risposto.indiceGiusto ? '✓' : i === scelta ? 'x' : LETTERE[i]) : LETTERE[i]
        if (on) l.riempi(xr - 4, y - 2, 245 - xr + 8, passo - 1)
        const spazio = Math.floor((245 - xr - 11) / 6), testoR = txt(r)
        let vis = testoR
        if (testoR.length > spazio) vis = on ? (testoR + '   ' + testoR).slice(scorri % (testoR.length + 3), scorri % (testoR.length + 3) + spazio) : corto(testoR, spazio) // (la scelta lunga scorre)
        l.testo(xr, y, segno, { inv: on })
        l.testo(xr + 11, y, vis, { inv: on }) // (staccato dalla lettera: «A fibre», non «Afibre»)
        if (risposto && (i === risposto.indiceGiusto || i === scelta)) l.riquadro(xr - 3, y - 2, 245 - xr + 6, passo - 1) // (la giusta e la tua, incorniciate)
        os.zona(xr - 4, y - 2, 245 - xr + 8, passo - 1, () => { if (risposto) avanti(); else { sel = i; rispondi(i) } })
      })
      if (img && !risposto) l.testo(xr, 42, corto(d.q, Math.floor((245 - xr) / 6)))
      if (img && risposto) l.testo(xr, 42, corto(testo, Math.floor((245 - xr) / 6)))
      // in fondo: l'esito, o cosa fare
      if (banca) { striscia(l, { attesa: banca === 'prossima' ? 'la prossima…' : 'la banca controlla…' }, t); return }
      if (risposto) {
        const r = risposto, s = r.giusta ? `✓ ${r.pagato ? `+${fmt(r.premio)} $pzk` : 'giusto!'} · +${r.xp} xp${r.serie > 1 ? ` · serie ${r.serie}` : ''}${r.bonus ? ` · perfetta +${fmt(r.bonus)}` : ''}` : scelta === null ? '! tempo scaduto' : '! sbagliato'
        l.riempi(10, H - 11, W - 20, 10); centro(l, H - 9, corto(`${s} · OK ${p.finita ? 'risultato' : 'avanti'}`, 38), { inv: true })
        if (via) l.riempi(10, H - 13, Math.round((W - 20) * Math.max(0, Math.min(1, (via - performance.now()) / viaDurata))), 1) // (quanto manca alla prossima)
        os.zona(10, H - 11, W - 20, 10, avanti)
      } else centro(l, H - 9, '↑↓ sceglie · OK risponde · o a b c d')
    },
    tasto(k) {
      if (pausa || banca) return true
      if (k === 'indietro') { lascia(); return true }
      if (risposto) { if (k === 'ok') avanti(); return true }
      const n = d.risposte.length
      if (k === 'su') { sel = (sel - 1 + n) % n; scorri = 0 }
      else if (k === 'giu') { sel = (sel + 1) % n; scorri = 0 }
      else if (k === 'ok') rispondi(sel)
      else return k === 'sx' || k === 'dx'
      return true
    },
    carattere(ch) {
      if (risposto || banca) return
      const i = 'abcd1234'.indexOf(ch.toLowerCase())
      if (i >= 0 && i % 4 < d.risposte.length) { sel = i % 4; rispondi(i % 4) }
    },
    invio() { if (risposto) avanti(); else rispondi(sel) },
  }
  return v
}

/** Prepara una partita e la apre (le domande dei giocatori chiedono il database: intanto la rotellina). x: quella della vista
 *  da cui parte (aspetta, dì, qui, attesa: l'ingresso di pagine o il riepilogo); sostituisci: la partita prende il suo posto. */
async function parti(os, arg, torna, x, sostituisci = false) {
  if (x.attesa) return // (sta già preparando: un secondo OK o clic non fa due partite)
  // (31.10) la banca prepara la partita e apre la prima domanda (il suo tempo parte lì): una rotellina sola per le due
  const p = await x.aspetta('preparo le domande', async () => { const q = await quiz.nuova(arg || null).catch(() => ({ errore: 'niente rete: riprova' })); if (q.errore) return q; const a = await quiz.prossima(q).catch(() => ({ errore: 'niente rete: riprova' })); return a === true ? q : a })
  if (!p || !x.qui()) return // (intanto è uscito, o sopra c'è altro: la partita non parte e il tempo non corre)
  if (p.errore) { x.dì(false, p.errore); return }
  if (sostituisci) os.togli()
  os.spingi(partita(os, Object.assign(p, { esiti: [] }), arg, torna))
}

// ── l'ingresso ──
export function vista(os) {
  const st = { sel: 0, da: 0 }
  const argomenti = () => [{ id: '', nome: 'di tutto un po’', icona: 'quiz' }, ...quiz.TUTTI_ARGOMENTI.map(([id, nome, icona]) => ({ id, nome, icona }))]
  let v = null
  const via = (a, x) => parti(os, a.id, () => {}, x)
  v = pagine(os, {
    nome: 'quiz', app: 'quiz',
    ascolta: [(f) => zaino.ascolta(f)],
    pagine: [{
      nome: 'quiz che pagano', icona: 'app-quiz', aiuto: 'OK parte · ↑↓ sceglie l’argomento',
      ok: (x) => via(argomenti()[st.sel], x),
      disegna(l, x) {
        const rest = quiz.restanti()
        l.testo(10, 34, corto(`${quiz.PER_PARTITA} domande, ${quiz.TEMPO}" l’una: da ${quiz.PAGA[1]} a ${quiz.PAGA[3]} $pzk`, 39))
        l.testo(10, 43, corto(rest ? `pagate oggi ${rest} · record ${quiz.record()} · giuste ${fmt(zaino.stat('quizGiusti'))}` : 'pagate finite: ti alleni, solo per gli xp', 39))
        elenco(l, x.zona, {
          voci: argomenti(), stato: st, y0: 54, alta: 63, passo: 12,
          clic: (a) => via(a, x),
          riga(l, a, x0, y, w, on) { l.testo(x0, y + 2, corto(a.nome, Math.floor((w - 12) / 6)), { inv: on }); destra(l, x0 + w, y + 2, '▶', { inv: on }) },
        })
      },
      tasto(k, x) {
        if (k === 'dx') { via(argomenti()[st.sel], x); return true } // (il ▶ della riga: → parte, come OK)
        return muovi(st, argomenti().length, k)
      },
    }],
  })
  return v
}
