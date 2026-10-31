// L'app «account» di pzk os (29.10, Alberto: «fai app account con stesse serietà» del profilo): il conto dei $pzk sul
// cercapersone zero. La logica è quella dell'account del cercapersone vecchio (telefono/app/account.js: i nomi riservati,
// le mosse in parole) e del wallet (games/pzk.js: entra, crea, esci, sincronizza, converti, invia, cambiaIndirizzo,
// cambiaPin, chiE, il regalo di instagram): qui c'è solo la faccia a 8 bit.
// - SENZA CONTO (e senza conto il cercapersone è chiuso: os.js, LIBERE): due righe, CREA e ENTRA. Crea: il nome dalla
//   tastiera (per i nomi di Alberto, la chiave del progetto, nascosta), il PIN a cifre nascoste e di nuovo, per sicurezza (il
//   PIN non si recupera). Entra: il nome e il PIN. Dopo, os.dopoAccesso: si apre l'app che si voleva.
// - COL CONTO, cinque pagine (← →, i pallini): IL CONTO (OK: sincronizza o esci, uscire si conferma), LE MOSSE (↑ ↓
//   scorrono), IL CAMBIO (OK: il verso, la quota col cursore, la conferma), INVIA (l'indirizzo a cifre col nome di chi è, quanti
//   $pzk, la conferma), ALTRO (l'indirizzo che si cambia una volta sola, il PIN, instagram).
// Mentre si aspetta il server, in fondo la rotellina e i tasti non fanno partire altro; l'esito resta lì qualche secondo.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import { RISERVATI, descriviMossa } from '../../app/account.js'
import { txt, corto, destra, centro, sposta, testata, striscia } from './pezzi.js'

const ROMA = { timeZone: 'Europe/Rome' }
const valida = (t) => t && !Number.isNaN(new Date(t).getTime())
const ora = (t) => (valida(t) ? new Date(t).toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' }) : '--:--')
const data = (t, conOra = false) => (valida(t) ? new Date(t).toLocaleString('it-IT', { ...ROMA, day: 'numeric', month: 'short', ...(conOra ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }) }) : '')
const fmt = (x) => pzk.fmt(x ?? 0), eur = (x) => pzk.fmtEur(x ?? 0)
/** Una riga «nome ........ valore» (i puntini fra i due, come il profilo). */
function riga(l, y, nome, v) {
  const xa = 10 + Lcd.larghezza(nome) + 4, xb = 245 - Lcd.larghezza(v) - 4
  l.testo(10, y, nome)
  for (let x = xa; x < xb; x += 3) l.px(x, y + 6)
  destra(l, 245, y, v)
}
/** Le righe che si scelgono (↑ ↓, OK; e il clic): la scelta rovesciata, il valore a destra. (30.10: senza più il ▶ sulla
 *  riga scelta: → sfoglia le pagine, e un ▶ che → non fa non ci va, REGOLE.md 3.3) */
function righe(l, os, lista, sel, y0, passo, scegli) {
  lista.forEach((r, i) => {
    const y = y0 + i * passo, on = i === sel
    if (on) l.riempi(6, y - 2, W - 12, 11)
    l.testo(10, y, r.nome, { inv: on })
    const v = corto(r.valore ?? '', 22)
    destra(l, W - 10, y, v, { inv: on })
    os.zona(6, y - 2, W - 12, 11, () => scegli(i))
  })
}

// ── la quota del cambio: un cursore da 0 a 100 % (← → di 10, ↑ ↓ di 1, o il clic sulla barra) ──
function quota(os, verso) {
  return new Promise((risolvi) => {
    let p = 0, avviso = 0
    const tot = () => (verso === 'pzk' ? pzk.puliti() : pzk.euro()) // (30.10: solo i puliti, come il server: col saldo intero la quota contava anche gli sporchi)
    const quanto = () => { const v = (p / 100) * tot(); return verso === 'pzk' ? Math.round(v * 2) / 2 : Math.round(v * 100) / 100 }
    const fatto = () => { if (quanto() > 0) { os.togli(); risolvi(quanto()) } else avviso = 15 }
    const q = {
      nome: 'account-quota', app: 'account',
      tic() { if (avviso > 0) { avviso--; os.ridisegna() } },
      disegna(l) {
        const t = pzk.tasso(), n = quanto()
        centro(l, os.BARRA + 4, verso === 'pzk' ? 'il cambio: $pzk → EUR€' : 'il cambio: EUR€ → $pzk')
        // la barra, con una tacca ogni 10 %
        const X = 18, L = 220, Y = os.BARRA + 18
        l.riquadro(X - 2, Y, L + 4, 12); l.riempi(X, Y + 2, Math.round((L * p) / 100), 8)
        for (let k = 0; k <= 10; k++) l.vert(X + Math.round((L * k) / 10), Y + 13, k % 5 ? 2 : 4)
        for (let k = 0; k <= 20; k++) os.zona( // (il clic sulla barra: a passi del 5 %)
          X + Math.round((L * k) / 20) - 6, Y - 2, 12, 18, () => { p = k * 5 })
        centro(l, Y + 22, `${p}%`, { scala: 2 })
        const dai = verso === 'pzk' ? `dai ${fmt(n)} $pzk (di ${fmt(tot())}${pzk.sporchi() ? ' puliti' : ''})` : `dai ${eur(n)} EUR€ (di ${eur(tot())})`
        const ricevi = verso === 'pzk' ? `ricevi ${eur(n * t)} EUR€` : `ricevi ${fmt(Math.round((n / t) * 2) / 2)} $pzk`
        centro(l, Y + 42, corto(dai, 39)); centro(l, Y + 52, corto(`${ricevi} · a ${t.toFixed(4)}`, 39))
        const a = avviso ? 'scegli quanto: almeno qualcosa' : '←→ 10% · ↑↓ 1% · OK converte'
        centro(l, H - 9, a, { inv: !!avviso })
      },
      tasto(k) {
        if (k === 'sx') p = Math.max(0, p - 10)
        else if (k === 'dx') p = Math.min(100, p + 10)
        else if (k === 'su') p = Math.min(100, p + 1)
        else if (k === 'giu') p = Math.max(0, p - 1)
        else if (k === 'ok') fatto()
        else if (k === 'indietro') { os.togli(); risolvi(null) }
        else return false
        return true
      },
      invio: () => fatto(),
    }
    os.spingi(q)
  })
}

// ── la vista ──
let pag = 0 // (si ricorda finché la pagina è aperta)
let igLink = null, igFatto = null // il link di instagram, uno per tutta la pagina
export function vista(os) {
  let scorre = 0, esito = null, attesa = null, via = [], sel = 0, primaMossa = 0, scelta = 0
  const muto = { zona: () => {} }
  let oz = os // (le zone delle righe: a pagina ferma quelle vere, mentre scorre di lato nessuna)
  const invio = { ind: '', chi: null, quanti: '' } // la pagina invia: l'indirizzo (sei cifre), chi è (o 'cerco'), quanti
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  /** Il server: la rotellina in fondo, e intanto i tasti non fanno partire altro. → la risposta, o null se c'era già un'attesa. */
  async function aspetta(testo, fai) {
    if (attesa) return null
    attesa = testo; esito = null; os.ridisegna()
    try { return await fai() } finally { attesa = null; os.ridisegna() }
  }
  const qui = () => os.corrente() === v

  // ── senza conto: crea o entra ──
  async function crea() {
    const nome = await os.tastiera({ titolo: 'il tuo nome (20 lettere al massimo)' })
    if (nome === null || !qui()) return
    const n = nome.trim().slice(0, 20)
    if (!n) return dì(false, 'serve un nome')
    let chiave
    if (RISERVATI.test(n)) {
      chiave = await os.tastiera({ titolo: 'nome di Alberto: la chiave del progetto', nascosto: true })
      if (chiave === null || !qui()) return
    }
    const pin = await os.cifre({ titolo: 'scegli il PIN: 4 cifre, non si recupera', n: 4, nascoste: true })
    if (pin === null || !qui()) return
    const pin2 = await os.cifre({ titolo: 'di nuovo il PIN, per sicurezza', n: 4, nascoste: true })
    if (pin2 === null || !qui()) return
    if (pin !== pin2) return dì(false, 'i due PIN non sono uguali: riprova')
    const r = await aspetta('creo il conto', () => pzk.crea(n, pin, chiave || undefined))
    if (r) dentro(r, true)
  }
  async function entra() {
    const nome = await os.tastiera({ titolo: 'il nome del conto' })
    if (nome === null || !qui()) return
    if (!nome.trim()) return dì(false, 'serve il nome')
    const pin = await os.cifre({ titolo: 'il PIN: 4 cifre', n: 4, nascoste: true })
    if (pin === null || !qui()) return
    const r = await aspetta('entro', () => pzk.entra(nome.trim(), pin))
    if (r) dentro(r, false)
  }
  async function dentro(r, nuovo) {
    if (!r.ok) return dì(false, r.offline ? 'il conto è in pausa: per ora valgono i 1.000 della sessione' : r.errore ?? 'non è andata')
    pag = 0; sel = 0
    os.suoni.sigla('account')
    if (!qui()) return
    await os.dialogo({ titolo: nuovo ? 'benvenuto' : 'ciao', icona: 'app-account', tasti: ['ok'], testo: nuovo ? `${txt(r.conto.nome)}, il tuo indirizzo è ${r.conto.ind}. Si parte con 1.000 $pzk.` : `${txt(r.conto.nome)}, bentornato.` })
    if (pzk.conto()) os.dopoAccesso()
  }

  // ── col conto: le azioni ──
  async function azioniConto() {
    const d = await os.dialogo({ titolo: 'il conto', testo: 'sincronizza: il conto com’è sul server e il cambio di adesso. esci: torni ai 1.000 della sessione.', tasti: ['esci', 'sincronizza'] })
    if (!qui()) return
    if (d === 'sincronizza') {
      const r = await aspetta('sincronizzo', () => pzk.sincronizza())
      if (r) dì(r.ok, r.ok ? `sincronizzato: 1 $pzk = ${pzk.tasso().toFixed(4)} €` : r.errore)
    } else if (d === 'esci') {
      const s = await os.dialogo({ titolo: 'esci?', testo: 'per rientrare servono il nome e il PIN, e senza conto il cercapersone è chiuso.', icona: 'lucchetto', tasti: ['no', 'esci'] })
      if (s !== 'esci' || !qui()) return
      const r = await aspetta('esco', () => pzk.esci().then(() => ({ ok: true })))
      if (r) { sel = 0; dì(true, 'sei uscito dal conto') }
    }
  }
  async function cambia() {
    const d = await os.dialogo({ titolo: 'il cambio', testo: 'da quale moneta parti?', tasti: ['EUR€ → $pzk', '$pzk → EUR€'] })
    if (!d || !qui()) return
    const verso = d.startsWith('$') ? 'pzk' : 'eur'
    if ((verso === 'pzk' ? pzk.puliti() : pzk.euro()) <= 0) return dì(false, verso === 'eur' ? 'non hai EUR€ da cambiare' : pzk.sporchi() ? 'gli sporchi non si cambiano: prima lavali' : 'non hai $pzk da cambiare') // (i puliti: gli sporchi il server non li cambia)
    const n = await quota(os, verso)
    if (!n || !qui()) return
    const t = pzk.tasso()
    const testo = verso === 'pzk' ? `dai ${fmt(n)} $pzk e ricevi ${eur(n * t)} EUR€, a ${t.toFixed(4)}.` : `dai ${eur(n)} EUR€ e ricevi ${fmt(Math.round((n / t) * 2) / 2)} $pzk, a ${t.toFixed(4)}.`
    const s = await os.dialogo({ titolo: 'converti?', testo, tasti: ['no', 'sì'] })
    if (s !== 'sì' || !qui()) return
    const r = await aspetta('converto', () => pzk.converti(verso, n))
    if (!r) return
    if (!r.ok) return dì(false, r.errore)
    const x = r.fatto
    dì(true, x.da === 'pzk' ? `${fmt(x.n)} $pzk → ${eur(x.eur)} EUR€` : `${eur(x.eur)} EUR€ → ${fmt(x.n)} $pzk`)
    os.suoni.sigla('wallet')
  }
  async function scegliIndirizzo() {
    const s = await os.cifre({ titolo: 'a chi: l’indirizzo, pzk e sei cifre', n: 6, prima: 'pzk', testo: invio.ind })
    if (s === null || !qui()) return
    invio.ind = s; invio.chi = 'cerco'; os.ridisegna()
    const r = await pzk.chiE('pzk' + s)
    if (invio.ind !== s) return
    invio.chi = r.ok ? { nome: r.conto.nome } : { errore: r.errore ?? 'non c’è' }
    os.ridisegna()
  }
  async function scegliQuanti() {
    const s = await os.cifre({ titolo: `quanti $pzk (ne hai ${pzk.fmtCorto(pzk.puliti())})`, n: 9, min: 1, testo: invio.quanti })
    if (s === null || !qui()) return
    const n = Number(s)
    if (!(n >= 1)) return dì(false, 'almeno 1 $pzk')
    invio.quanti = String(n)
  }
  async function manda() {
    if (!invio.ind) return dì(false, 'manca l’indirizzo')
    if (!invio.quanti) return dì(false, 'manca quanti $pzk')
    const n = Number(invio.quanti), a = 'pzk' + invio.ind, chi = invio.chi?.nome ? txt(invio.chi.nome) : null
    if (n > pzk.puliti()) return dì(false, pzk.sporchi() ? `si mandano solo i puliti: ${fmt(pzk.puliti())}` : `ne hai ${fmt(pzk.puliti())}`) // (anche qui i puliti, come il server)
    const s = await os.dialogo({ titolo: 'invia?', testo: `mandi ${fmt(n)} $pzk a ${chi ? `${chi} (${a})` : a}? Arrivano subito e non tornano indietro.`, icona: 'app-banca', tasti: ['no', 'sì'] })
    if (s !== 'sì' || !qui()) return
    const r = await aspetta('invio', () => pzk.invia(a, n))
    if (!r) return
    if (!r.ok) return dì(false, r.errore)
    dì(true, `${fmt(r.fatto.n)} $pzk a ${r.fatto.nome} (${r.fatto.a})`)
    os.suoni.sigla('moneta')
    invio.ind = ''; invio.chi = null; invio.quanti = ''; sel = 0
  }
  async function cambiaIndirizzo() {
    const c = pzk.conto()
    if (c.indCambiato) return dì(false, 'l’hai già scelto: non si cambia più')
    const s = await os.cifre({ titolo: 'il tuo indirizzo: sei cifre, una volta', n: 6, prima: 'pzk' })
    if (s === null || !qui()) return
    const ok = await os.dialogo({ titolo: 'sicuro?', testo: `pzk${s}: dopo non si cambia più.`, icona: 'lucchetto', tasti: ['no', 'sì'] })
    if (ok !== 'sì' || !qui()) return
    const r = await aspetta('cambio l’indirizzo', () => pzk.cambiaIndirizzo(s))
    if (r) dì(r.ok, r.ok ? `fatto: ora sei ${pzk.conto()?.ind}` : r.errore)
  }
  async function cambiaPin() {
    const vecchio = await os.cifre({ titolo: 'il PIN di adesso', n: 4, nascoste: true })
    if (vecchio === null || !qui()) return
    const nuovo = await os.cifre({ titolo: 'il PIN nuovo: 4 cifre, non si recupera', n: 4, nascoste: true })
    if (nuovo === null || !qui()) return
    const di2 = await os.cifre({ titolo: 'di nuovo il PIN nuovo', n: 4, nascoste: true })
    if (di2 === null || !qui()) return
    if (nuovo !== di2) return dì(false, 'i due PIN nuovi non sono uguali')
    const r = await aspetta('cambio il PIN', () => pzk.cambiaPin(vecchio, nuovo))
    if (r) dì(r.ok, r.ok ? 'PIN cambiato' : r.errore)
  }
  function instagram() {
    if (pzk.premioPreso()) return dì(true, 'il regalo l’hai già avuto: grazie')
    // il link del wallet (games/pzk.js): aperto da qui, dentro il tasto (il browser lo lascia aprire); tornando, i $pzk. Il
    // link si fa una volta sola (30.10: ognuno lasciava un pzk.osserva e un ascolto di storage a ogni pressione)
    igFatto = () => { dì(true, `grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); os.suoni.sigla('moneta') }
    const a = (igLink ??= pzk.linkInstagram({ fatto: () => igFatto?.() }))
    a.style.display = 'none'
    document.body.appendChild(a); a.click(); a.remove()
    dì(true, 'si apre instagram: tornando qui arrivano i $pzk')
  }

  // ── le pagine col conto (y da 34 a 116) ──
  const PAGINE = [
    {
      nome: 'il conto', icona: 'app-account', aiuto: 'OK sincronizza o esci · ←→ pagine', ok: azioniConto,
      disegna(l, c) {
        l.testo(10, 34, corto(c.nome, 19), { scala: 2 })
        l.testo(10, 51, corto(`${c.ind}${valida(c.creato) ? ` · nato il ${data(c.creato)}` : ''}`, 39))
        const r = [['$pzk puliti', fmt(c.puliti ?? c.pzk)]]
        if (c.sporchi) r.push(['sporchi (rapine)', fmt(c.sporchi)])
        r.push(['EUR€', eur(c.eur)], [`cambio delle ${ora(pzk.sincronizzato())}`, `1 $pzk = ${pzk.tasso().toFixed(4)} €`], ['invii', c.invii ? 'aperti' : valida(c.inviiDa) ? `dal ${data(c.inviiDa, true)}` : 'non ancora']) // (senza la data: «non ancora», non «dal»)
        r.forEach(([n, v], i) => riga(l, 63 + i * 10, n, v))
      },
    },
    {
      nome: 'le mosse', icona: 'clessidra', aiuto: '↑↓ scorre · ←→ pagine',
      disegna(l, c) {
        const m = [...(c.mosse ?? [])].reverse()
        if (!m.length) { centro(l, 64, 'niente ancora'); return }
        const VIS = 4
        m.slice(primaMossa, primaMossa + VIS).forEach((x, i) => {
          const d = descriviMossa(x), y = 34 + i * 20
          l.testo(10, y, d.quando)
          destra(l, 240, y, corto(d.n, 22))
          l.testo(16, y + 9, corto(d.cosa, 37))
        })
        if (m.length > VIS) { // la barra di scorrimento
          const alta = VIS * 20 - 2, h = Math.max(6, Math.round((alta * VIS) / m.length))
          l.vert(W - 9, 34, alta); l.riempi(W - 10, 34 + Math.round(((alta - h) * primaMossa) / Math.max(1, m.length - VIS)), 3, h)
        }
      },
      scorri(d) { const n = (pzk.conto()?.mosse ?? []).length; primaMossa = Math.max(0, Math.min(Math.max(0, n - 4), primaMossa + d)) },
    },
    {
      nome: 'il cambio', icona: 'pzk', aiuto: 'OK cambia $pzk e EUR€ · ←→ pagine', ok: cambia,
      disegna(l) {
        centro(l, 35, `1 $pzk = ${pzk.tasso().toFixed(4)} €`, { scala: 2 })
        centro(l, 53, `cambio delle ${ora(pzk.sincronizzato())}${pzk.scaduto() ? ' (vecchio)' : ''}`)
        centro(l, 65, corto(`hai ${fmt(pzk.saldo())} $pzk e ${eur(pzk.euro())} EUR€`, 39))
        Lcd.acapo('parcheggia i $pzk in EUR€ quando pensi che scendano: per giocarli vanno riconvertiti.', 39).forEach((r, i) => centro(l, 80 + i * 9, r))
      },
    },
    {
      nome: 'invia', icona: 'app-banca',
      aiuto: () => (!pzk.conto()?.invii ? '←→ pagine' : ['OK sceglie l’indirizzo', 'OK sceglie quanti', 'OK invia'][sel] + ' · ↑↓'),
      disegna(l, c) {
        if (!c.invii) { (valida(c.inviiDa) ? ['gli invii si aprono il', data(c.inviiDa, true), '(48 ore dopo che è nato il conto)'] : ['gli invii non sono ancora aperti:', 'si aprono 48 ore dopo che', 'è nato il conto.']).forEach((r, i) => centro(l, 50 + i * 11, r)); return }
        const chi = invio.chi === 'cerco' ? 'cerco…' : invio.chi?.nome ? `è il conto di ${invio.chi.nome}` : invio.chi?.errore ?? ''
        righe(l, oz, [
          { nome: 'a chi', valore: invio.ind ? `pzk${invio.ind}` : 'scegli' },
          { nome: 'quanti', valore: invio.quanti ? `${fmt(Number(invio.quanti))} $pzk` : 'scegli' },
          { nome: 'invia', valore: invio.ind && invio.quanti ? 'pronto' : '' },
        ], sel, 36, 24, (i) => { sel = i; PAGINE[3].fai() })
        if (chi) l.testo(16, 47, corto(chi, 38), { inv: false })
        if (invio.quanti && Number(invio.quanti) > pzk.puliti()) l.testo(16, 71, corto(`ne hai solo ${fmt(pzk.puliti())}${pzk.sporchi() ? ' puliti' : ''}`, 38))
        l.testo(10, 100, 'arrivano subito. almeno 1 $pzk.')
      },
      righe: () => (pzk.conto()?.invii ? 3 : 0),
      fai: () => [scegliIndirizzo, scegliQuanti, manda][sel]?.(),
    },
    {
      nome: 'altro', icona: 'lucchetto',
      aiuto: () => ['OK cambia l’indirizzo', 'OK cambia il PIN', 'OK apre instagram'][sel] + ' · ↑↓',
      disegna(l, c) {
        righe(l, oz, [
          { nome: 'indirizzo', valore: c.indCambiato ? `${c.ind} (tuo)` : `${c.ind} · cambialo` },
          { nome: 'PIN', valore: 'cambia' },
          { nome: 'instagram', valore: pzk.premioPreso() ? 'fatto, grazie' : `+${fmt(pzk.PREMIO_IG)} $pzk` },
        ], sel, 36, 12, (i) => { sel = i; PAGINE[4].fai() })
        const nota = [
          c.indCambiato ? 'l’indirizzo l’hai scelto tu: non si cambia più.' : 'è a caso: puoi cambiarlo una volta sola con sei cifre tue (studenti unimore: il numero dell’e-mail).',
          'il PIN non si recupera: scegline uno che ricordi.',
          'segui pzkko su instagram: tornando qui arrivano i $pzk, una volta sola.',
        ][sel]
        Lcd.acapo(nota, 39).slice(0, 4).forEach((r, i) => l.testo(10, 78 + i * 9, r))
      },
      righe: () => 3,
      fai: () => [cambiaIndirizzo, cambiaPin, instagram][sel]?.(),
    },
  ]
  const vai = (d) => {
    pag = (pag + d + PAGINE.length) % PAGINE.length; scorre = d * 70; sel = 0; primaMossa = 0
    if (pag === 2 && pzk.scaduto()) aspetta('aggiorno il cambio', () => pzk.sincronizza()) // (il cambio vecchio si rifà da solo)
  }

  const v = {
    nome: 'account', app: 'account',
    entra() { via = [pzk.osserva(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { via.forEach((x) => x()); via = [] },
    tic(t) {
      let ancora = !!attesa
      if (scorre) { scorre = Math.abs(scorre) < 4 ? 0 : Math.trunc(scorre * 0.45); ancora = true }
      if (esito && Date.now() >= esito.fino) { esito = null; ancora = true }
      if (ancora) os.ridisegna()
    },
    disegna(l, t) {
      const c = pzk.conto()
      if (!c) return disegnaFuori(l, t)
      const P = PAGINE[pag]
      testata(l, attesa ? muto : os, { icona: P.icona, nome: P.nome, n: PAGINE.length, pag, vai, va: (i) => { if (i !== pag) vai(i - pag) } }) // (aspettando il server niente clic, come i tasti)
      l.ritaglia([os.MARGINE, 32, W - 2 * os.MARGINE, 86])
      oz = scorre || attesa ? muto : os
      P.disegna(sposta(l, scorre), c, t)
      oz = os
      l.ritaglia(null)
      if (!striscia(l, { esito, attesa }, t)) {
        const a = typeof P.aiuto === 'function' ? P.aiuto() : P.aiuto, xa = Math.round(W / 2 - Lcd.larghezza(a) / 2)
        l.testo(xa, H - 9, a)
        if (P.ok) os.zona(xa - 3, H - 11, Lcd.larghezza(a.split(' · ')[0]) + 6, 11, () => P.ok())
      }
    },
    tasto(n) {
      if (attesa) { if (n === 'indietro') os.togli(); return true } // (aspettando il server non parte altro)
      if (!pzk.conto()) return tastoFuori(n)
      const P = PAGINE[pag], R = P.righe?.() ?? 0
      if (n === 'sx') vai(-1)
      else if (n === 'dx') vai(1)
      else if (n === 'su') { if (P.scorri) P.scorri(-1); else if (R) sel = (sel - 1 + R) % R; else return false }
      else if (n === 'giu') { if (P.scorri) P.scorri(1); else if (R) sel = (sel + 1) % R; else return false }
      else if (n === 'ok') { if (P.ok) P.ok(); else if (R) P.fai(); else return false }
      else if (n === 'indietro') os.togli()
      else return false
      return true
    },
  }

  // ── senza conto: la testa, le due righe e cosa vuol dire quella scelta ──
  function disegnaFuori(l, t) {
    l.bitmap(icone.bitmap('app-account', 16), 8, 13)
    l.testo(28, 17, 'account')
    destra(l, W - 8, 17, 'serve il conto')
    l.orizz(6, 31, W - 12)
    righe(l, attesa ? muto : os, [{ nome: 'crea il conto', valore: '' }, { nome: 'entra', valore: '' }], scelta, 36, 13, (i) => { scelta = i; tastoFuori('ok') }) // (aspettando il server il clic non rifà partire «crea» o «entra»)
    const nota = scelta === 0
      ? 'col conto i $pzk restano tuoi, hanno un indirizzo e vivono nella borsa; si parte con 1.000 $pzk. Il PIN non si recupera: scegline uno che ricordi.'
      : 'il nome e le quattro cifre del tuo conto. Senza conto il cercapersone resta chiuso.'
    Lcd.acapo(nota, 39).slice(0, 5).forEach((r, i) => l.testo(10, 66 + i * 9, r))
    if (!striscia(l, { esito, attesa }, t)) centro(l, H - 9, '↑↓ sceglie · OK va')
  }
  function tastoFuori(n) {
    if (n === 'su' || n === 'giu') scelta = 1 - scelta
    else if (n === 'ok') { if (scelta === 0) crea(); else entra() }
    else if (n === 'indietro') os.togli()
    else return false
    return true
  }
  return v
}
