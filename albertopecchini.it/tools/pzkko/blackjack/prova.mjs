#!/usr/bin/env node
// Le prove del blackjack di pzkko.it (pzkko/games/blackjack/regole.js): gioca
// tante mani per ogni regolamento e controlla, mano per mano, con conti fatti
// in un altro modo:
// - il sabot: 52 × mazzi carte, ogni carta una volta sola, le bruciate, la
//   carta di taglio che chiude il sabot alla fine della mano;
// - il banco: tira fino a 16, sta su tutti i 17 (o tira il 17 morbido se la
//   regola lo dice), non tira se non serve (a venezia sì);
// - i conti: tutto quello che si punta lascia il tavolo una volta sola, e quello
//   che torna è quello che torna con un calcolo indipendente dei punti;
// - le mosse: con la strategia di base e poi a caso (anche mosse vietate, che il
//   tavolo deve rifiutare), i limiti delle divisioni, degli assi, del raddoppio;
// - le puntate laterali: le frequenze contro le probabilità esatte del sabot;
// - il vantaggio del banco con la strategia di base, che deve stare dove
//   stanno i numeri pubblicati per quelle regole.
//
//   node tools/pzkko/blackjack/prova.mjs [mani per regolamento, 1000000] [--seme=N] [--regole=vegas,atlantic,venezia]

import { REGOLE, LIMITI, PAGA_PP, PAGA_T3, Tavolo, ErroreGioco, SEMI, RANGHI } from '../../../pzkko/games/blackjack/regole.js'

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const GIRI = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 1_000_000)
const SEME = Number(arg('seme', 4122))
const QUALI = arg('regole', 'vegas,atlantic,venezia').split(',')

// un generatore riproducibile (mulberry32)
function generatore(seme) {
  let a = seme >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

let errori = 0
const errore = (m, ctx) => { errori++; if (errori <= 25) console.error('✗', m, ctx ? JSON.stringify(ctx).slice(0, 600) : '') }
const atteso = (cond, m, ctx) => { if (!cond) errore(m, ctx) }

// ── i punti, contati in un altro modo: tutti i modi di contare gli assi ──────
const val = (r) => ({ A: 1, J: 10, Q: 10, K: 10 })[r] ?? Number(r)
function migliore(carte) {
  let somme = [0]
  for (const c of carte) somme = c.r === 'A' ? somme.flatMap((s) => [s + 1, s + 11]) : somme.map((s) => s + val(c.r))
  const buone = somme.filter((s) => s <= 21)
  return buone.length ? Math.max(...buone) : Math.min(...somme)
}
const morbido = (carte) => carte.some((c) => c.r === 'A') && migliore(carte) !== carte.reduce((s, c) => s + val(c.r), 0)

// ── la strategia di base (più mazzi), con le varianti per H17, DAS, resa e senza carta coperta ──
function strategia(R, carte, up, az) {
  const u = up.r === 'A' ? 11 : val(up.r) // 2…11
  const tot = migliore(carte), soft = morbido(carte), due = carte.length === 2
  const enhc = !R.buca
  const fai = (a, poi) => (az[a] ? a : poi)
  // la resa
  if (az.resa && !soft) {
    if (tot === 16 && !(carte[0].r === '8' && carte[1].r === '8') && u >= 9) return 'resa'
    if (tot === 15 && u === 10) return 'resa'
    if (R.h17 && ((tot === 15 || tot === 17) && u === 11)) return 'resa'
    if (R.h17 && carte[0].r === '8' && carte[1].r === '8' && u === 11) return 'resa'
  }
  // le coppie
  if (az.dividi && due) {
    const r = val(carte[0].r) === 10 ? 'T' : carte[0].r
    const das = R.das
    const dividi = {
      A: () => !(enhc && u === 11),
      8: () => !(enhc && u >= 10),
      9: () => [2, 3, 4, 5, 6, 8, 9].includes(u),
      7: () => u <= 7,
      6: () => (das ? u <= 6 : u >= 3 && u <= 6),
      4: () => das && (u === 5 || u === 6),
      3: () => (das ? u <= 7 : u >= 4 && u <= 7),
      2: () => (das ? u <= 7 : u >= 4 && u <= 7),
      T: () => false, 5: () => false,
    }[r]
    if (dividi?.()) return 'dividi'
  }
  if (soft) {
    if (tot >= 20) return fai('stai', 'carta')
    if (tot === 19) return R.h17 && u === 6 ? fai('raddoppia', 'stai') : 'stai'
    if (tot === 18) {
      if (u >= 3 && u <= 6) return fai('raddoppia', 'stai')
      if (u === 2) return R.h17 ? fai('raddoppia', 'stai') : 'stai'
      if (u === 7 || u === 8) return 'stai'
      return 'carta'
    }
    if (tot === 17) return u >= 3 && u <= 6 ? fai('raddoppia', 'carta') : 'carta'
    if (tot === 15 || tot === 16) return u >= 4 && u <= 6 ? fai('raddoppia', 'carta') : 'carta'
    if (tot === 13 || tot === 14) return u >= 5 && u <= 6 ? fai('raddoppia', 'carta') : 'carta'
    return 'carta'
  }
  if (tot >= 17) return fai('stai', 'carta')
  if (tot >= 13) return u <= 6 ? fai('stai', 'carta') : 'carta'
  if (tot === 12) return u >= 4 && u <= 6 ? fai('stai', 'carta') : 'carta'
  if (tot === 11) return u === 11 && (!R.h17 || enhc) ? 'carta' : enhc && u === 10 ? 'carta' : fai('raddoppia', 'carta')
  if (tot === 10) return u <= 9 ? fai('raddoppia', 'carta') : 'carta'
  if (tot === 9) return u >= 3 && u <= 6 ? fai('raddoppia', 'carta') : 'carta'
  return 'carta'
}

// ── le probabilità esatte delle laterali per un sabot di D mazzi ─────────────
function esatte(D) {
  const tipi = []
  for (const s of SEMI) for (const r of RANGHI) tipi.push({ r, s })
  const ord = (r) => RANGHI.indexOf(r) + 1
  const rosso = (s) => s === 'c' || s === 'q'
  const n = 52 * D
  let pp = { perfetta: 0, colore: 0, mista: 0 }, t3 = {}
  for (const a of tipi) for (const b of tipi) {
    const pab = (D / n) * ((a.r === b.r && a.s === b.s ? D - 1 : D) / (n - 1))
    if (a.r === b.r) pp[a.s === b.s ? 'perfetta' : rosso(a.s) === rosso(b.s) ? 'colore' : 'mista'] += pab
    for (const c of tipi) {
      let k = D
      if (c.r === a.r && c.s === a.s) k--
      if (c.r === b.r && c.s === b.s) k--
      const p = pab * (k / (n - 2))
      const rr = [ord(a.r), ord(b.r), ord(c.r)].sort((x, y) => x - y)
      const fl = a.s === b.s && b.s === c.s
      let tipo = null
      if (rr[0] === rr[2]) tipo = fl ? 'tris uguale' : 'tris'
      else if (new Set(rr).size === 3 && (rr[2] - rr[0] === 2 || (rr[0] === 1 && rr[1] === 12 && rr[2] === 13))) tipo = fl ? 'scala colore' : 'scala'
      else if (fl) tipo = 'colore'
      if (tipo) t3[tipo] = (t3[tipo] ?? 0) + p
    }
  }
  const ev = (prob, paga) => Object.entries(prob).reduce((s, [k, p]) => s + p * (paga[k] + 1), 0) - 1
  return { pp, t3, evPP: ev(pp, PAGA_PP), evT3: ev(t3, PAGA_T3) }
}

// ── una mano, controllata ────────────────────────────────────────────────────
function prova(nome, giri, caos) {
  const R = REGOLE[nome]
  const casuale = generatore(SEME + (caos ? 7 : 0) + nome.length * 1000)
  const t = new Tavolo(R, casuale)
  const st = { mani: 0, puntato: 0, netto: 0, pp: { n: 0, puntato: 0, torna: 0, tipi: {} }, t3: { n: 0, puntato: 0, torna: 0, tipi: {} }, sabot: 0, divisioni: 0, raddoppi: 0, rese: 0, assicurazioni: 0, bjBanco: 0, vietateRifiutate: 0, maxMani: 0 }
  let visti = new Set(), bruciate = 0
  const qua = generatore(SEME * 3 + nome.length)

  for (let g = 0; g < giri; g++) {
    const caselle = R.caselleMin + Math.floor(qua() * (3 - R.caselleMin + 1))
    const puntate = []
    for (let c = 0; c < caselle; c++) {
      const p = { casella: c, puntata: caos ? LIMITI.min + Math.floor(qua() * 40) * 5 : 10 }
      if (R.laterali) { p.pp = caos ? Math.floor(qua() * 3) : 1; p.t3 = caos ? Math.floor(qua() * 3) : 1 }
      puntate.push(p)
    }
    let messo = puntate.reduce((s, p) => s + p.puntata + (p.pp || 0) + (p.t3 || 0), 0)
    const pos0 = t.pos, mescolato = t.daMescolare
    const ev = [...t.giro(puntate)]
    const eventi = ev
    // il sabot
    if (mescolato) {
      st.sabot++
      visti = new Set()
      atteso(t.carte.length === 52 * R.mazzi, 'sabot della misura sbagliata', { n: t.carte.length })
      const conta = {}
      for (const c of t.carte) conta[c.r + c.s] = (conta[c.r + c.s] ?? 0) + 1
      atteso(Object.keys(conta).length === 52 && Object.values(conta).every((k) => k === R.mazzi), 'composizione del sabot', conta)
      bruciate = ev.filter((e) => e.t === 'brucia').length
      atteso(bruciate === R.bruciate, 'carte bruciate', { bruciate })
      atteso(ev[0].t === 'mescola', 'il sabot nuovo comincia con «mescola»')
    } else atteso(!ev.some((e) => e.t === 'mescola'), 'mescolato senza la carta di taglio')
    // il giro, fino alla fine
    let passi = 0
    while (t.fase !== 'fine') {
      if (++passi > 200) { errore('giro che non finisce', { nome, g }); break }
      if (t.fase === 'assicurazione') {
        const si = caos ? qua() < 0.5 : false
        if (si) { const m = t.daAssicurare[0]; if (!(m.carte.length === 2 && migliore(m.carte) === 21)) messo += m.base / 2 }
        ev.push(...t.assicura(si))
        continue
      }
      const az = t.azioni()
      const m = t.attiva
      atteso(m && !m.fatta, 'mano attiva sbagliata', { fase: t.fase })
      const tot = migliore(m.carte)
      atteso(tot < 21, 'si gioca una mano già a 21 o più', { carte: m.carte })
      // le mosse vietate dalle regole
      if (R.obbligo11 && tot <= 11) atteso(!az.stai, 'a venezia fino a 11 si chiama carta')
      if (m.carte.length !== 2) atteso(!az.raddoppia && !az.dividi && !az.resa, 'raddoppio/divisione/resa con più di due carte')
      if (R.raddoppio === '9-11' && az.raddoppia) { const d = m.carte.reduce((s, c) => s + val(c.r), 0); atteso(d >= 9 && d <= 11, 'raddoppio fuori da 9-11', { carte: m.carte }) }
      if (m.divisa) atteso(!az.resa, 'resa dopo la divisione')
      if (m.divisa && !R.das) atteso(!az.raddoppia, 'raddoppio dopo la divisione')
      if (az.dividi) atteso(R.stessoRango ? m.carte[0].r === m.carte[1].r : val(m.carte[0].r) === val(m.carte[1].r), 'divisione di carte diverse', { carte: m.carte })
      let mossa
      if (caos) {
        const tutte = ['carta', 'stai', 'raddoppia', 'dividi', 'resa']
        // ogni tanto una mossa a caso, anche vietata: il tavolo deve rifiutarla
        const prova = tutte[Math.floor(qua() * tutte.length)]
        if (!az[prova]) {
          try { t[prova](); errore('mossa vietata accettata', { prova, carte: m.carte }) } catch (e) { if (e instanceof ErroreGioco) st.vietateRifiutate++; else throw e }
        }
        const ok = tutte.filter((a) => az[a])
        mossa = ok[Math.floor(qua() * ok.length)]
      } else mossa = strategia(R, m.carte, t.banco[0], az)
      if (!az[mossa]) mossa = az.carta ? 'carta' : 'stai'
      if (mossa === 'raddoppia' || mossa === 'dividi') { messo += az.extra; st[mossa === 'dividi' ? 'divisioni' : 'raddoppi']++ }
      if (mossa === 'resa') st.rese++
      ev.push(...t[mossa]())
    }
    // ── i controlli del giro ──
    const carteGiro = ev.filter((e) => e.t === 'carta' || e.t === 'brucia').map((e) => e.carta).filter(Boolean)
    const coperte = ev.filter((e) => e.t === 'scopre').map((e) => e.carta)
    for (const c of [...carteGiro, ...coperte]) { if (visti.has(c.id)) errore('carta data due volte', { c }); visti.add(c.id) }
    atteso(visti.size === t.pos || ev.some((e) => e.t === 'rimescola'), 'carte pescate e carte viste non tornano', { visti: visti.size, pos: t.pos })
    // i conti: ogni $pzk messo lascia il tavolo una volta sola
    const giocato = ev.reduce((s, e) => s + (e.giocato ?? 0) + (e.t === 'esito' ? e.mani.reduce((a, x) => a + x.giocato, 0) : 0), 0)
    const torna = ev.reduce((s, e) => s + (e.torna ?? 0) + (e.t === 'esito' ? e.mani.reduce((a, x) => a + x.torna, 0) : 0), 0)
    atteso(Math.abs(giocato - messo) < 1e-9, 'quello che lascia il tavolo non è quello che si è puntato', { giocato, messo, ev: ev.map((e) => e.t) })
    // il banco
    const b = t.banco
    const bt = migliore(b)
    const bbj = b.length === 2 && bt === 21
    const vive = t.mani.some((m) => !m.sballata && !m.resa && !m.pari && !(m.carte.length === 2 && !m.divisa && migliore(m.carte) === 21))
    const fermoPeek = R.buca && bbj
    if (bbj) st.bjBanco++
    if (!fermoPeek && !bbj && (vive || R.esaurisce)) {
      atteso(bt >= 17, 'il banco si è fermato sotto 17', { b })
      atteso(!(R.h17 && bt === 17 && morbido(b)), 'il banco sta sul 17 morbido con H17', { b })
      // ogni carta oltre la seconda è stata presa con meno di 17 (o 17 morbido con H17)
      for (let k = 2; k < b.length; k++) {
        const prima = b.slice(0, k), pt = migliore(prima)
        atteso(pt < 17 || (R.h17 && pt === 17 && morbido(prima)), 'il banco ha tirato con 17 o più', { b })
      }
    } else atteso(b.length === 2, 'il banco ha tirato senza motivo', { b, vive })
    // le mani, contro un conto indipendente
    const esito = ev.find((e) => e.t === 'esito')
    atteso(!!esito, 'giro senza esito')
    let maniCasella = {}
    for (const m of t.mani) {
      maniCasella[m.casella] = (maniCasella[m.casella] ?? 0) + 1
      const pt = migliore(m.carte)
      const nat = m.carte.length === 2 && !m.divisa && pt === 21
      if (m.raddoppio) atteso(m.carte.length === 3 && m.puntata === 2 * m.base, 'raddoppio con più o meno di una carta', { m })
      if (m.divisa && m.carte[0].r === 'A' && !R.rsa) atteso(m.carte.length === 2, 'assi divisi con più di una carta', { m })
      let attesoTorna
      if (m.pari) attesoTorna = null
      else if (m.resa) attesoTorna = null
      else if (pt > 21) { attesoTorna = null; atteso(m.sballata, 'mano oltre 21 non sballata', { m }) }
      else if (nat) attesoTorna = bbj ? m.puntata : m.puntata * (1 + R.paga)
      else if (bbj) attesoTorna = R.perdeTutto ? 0 : m.puntata - m.base
      else if (bt > 21 || pt > bt) attesoTorna = 2 * m.puntata
      else if (pt === bt) attesoTorna = m.puntata
      else attesoTorna = 0
      const r = esito.mani.find((x) => x.mano === m.id)
      if (attesoTorna === null) atteso(!r, 'mano chiusa prima e pagata di nuovo', { m })
      else atteso(r && r.torna === attesoTorna && r.giocato === m.puntata, 'pagamento sbagliato', { m, r, attesoTorna, b })
      if (m.resa) atteso(ev.some((e) => e.t === 'resa' && e.mano === m.id && e.torna === m.puntata / 2), 'resa pagata male')
      if (m.pari) atteso(ev.some((e) => e.t === 'pari' && e.mano === m.id && e.torna === m.puntata * 2), 'alla pari pagata male')
      // il netto delle puntate principali (per il vantaggio del banco)
      const tornata = (r?.torna ?? 0) + (ev.find((e) => (e.t === 'resa' || e.t === 'pari') && e.mano === m.id)?.torna ?? 0)
      st.netto += tornata - m.puntata
    }
    for (const k in maniCasella) { atteso(maniCasella[k] <= R.mani, 'troppe mani divise', { k, n: maniCasella[k] }); st.maxMani = Math.max(st.maxMani, maniCasella[k]) }
    st.mani += puntate.length
    st.puntato += puntate.reduce((s, p) => s + p.puntata, 0)
    // assicurazione: paga 2 a 1 solo se il banco ha blackjack
    for (const e of ev.filter((x) => x.t === 'assicurazione chiusa')) { st.assicurazioni++; atteso(e.vinta === bbj && e.torna === (bbj ? e.giocato * 3 : 0), 'assicurazione pagata male', { e, b }) }
    // le laterali, contro le frequenze e le carte vere
    for (const e of ev.filter((x) => x.t === 'laterali')) {
      for (const k of ['pp', 't3']) {
        if (!e[k]) continue
        st[k].n++
        st[k].puntato += e[k].puntata
        st[k].torna += e[k].torna
        if (e[k].tipo) st[k].tipi[e[k].tipo] = (st[k].tipi[e[k].tipo] ?? 0) + 1
      }
    }
    // la carta di taglio: si mescola alla mano dopo e solo allora
    if (t.ultima) atteso(t.daMescolare, 'carta di taglio uscita ma niente rimescolata')
  }
  return st
}

const pct = (x) => `${(x * 100).toFixed(3)}%`
console.log(`blackjack di pzkko.it: ${GIRI.toLocaleString('it-IT')} giri per regolamento, seme ${SEME}\n`)
// le prove delle regole di partenza: puntate fuori dai limiti, laterali a venezia, una casella sola a venezia
{
  const vietato = (f, m) => { try { f(); errore(`accettato: ${m}`) } catch (e) { if (!(e instanceof ErroreGioco)) throw e } }
  vietato(() => new Tavolo(REGOLE.vegas).giro([{ casella: 0, puntata: 2 }]), 'puntata sotto il minimo')
  vietato(() => new Tavolo(REGOLE.vegas).giro([{ casella: 0, puntata: 5000 }]), 'puntata sopra il massimo')
  vietato(() => new Tavolo(REGOLE.venezia).giro([{ casella: 0, puntata: 10 }]), 'una casella sola a venezia')
  vietato(() => new Tavolo(REGOLE.venezia).giro([{ casella: 0, puntata: 10, pp: 1 }, { casella: 1, puntata: 10 }]), 'laterali a venezia')
  vietato(() => new Tavolo(REGOLE.vegas).giro([{ casella: 0, puntata: 10 }, { casella: 0, puntata: 10 }]), 'due puntate sulla stessa casella')
  vietato(() => { const t = new Tavolo(REGOLE.vegas); t.carta() }, 'carta senza giro')
}
// i casi scritti a mano: il tavolo con un sabot preparato
{
  const prepara = (R, carte) => {
    const t = new Tavolo({ ...R, bruciate: 0 })
    t.mescola()
    t.ev = []
    const ordine = carte.map((x) => { const r = x.slice(0, -1), s = x.slice(-1); const i = t.carte.findIndex((c, j) => j >= 0 && c.r === r && c.s === s && !c.preso); t.carte[i].preso = true; return t.carte[i] })
    const resto = t.carte.filter((c) => !ordine.includes(c))
    t.carte = [...ordine, ...resto]
    t.pos = 0
    t.taglio = t.carte.length - 60
    return t
  }
  // vegas: 8-8 contro 6, divisione, sul primo 8 un 3 → raddoppio, sul secondo un 8 → ridivisione
  let t = prepara(REGOLE.vegas, ['8c', '6f', '8q', 'Kp', '3c', '10f', '8p', '9c', '2q', '5c', '10c', '7c'])
  t.giro([{ casella: 0, puntata: 10 }])
  atteso(t.azioni().dividi && t.azioni().resa, 'vegas: 8-8 si divide e si può arrendere')
  t.dividi() // prima mano 8+3
  atteso(t.attiva.carte.length === 2 && t.azioni().raddoppia, 'vegas: raddoppio dopo la divisione')
  t.raddoppia() // 8+3+10 = 21; la seconda mano riceve 8 → 8-8
  atteso(t.attiva.carte.map((c) => c.r).join() === '8,8' && t.azioni().dividi, 'vegas: ridivisione')
  t.dividi() // 8+9 = 17
  t.stai() // terza mano 8+2 → 10
  atteso(t.attiva.carte.length === 2, 'vegas: terza mano')
  t.stai()
  atteso(t.fase === 'fine', 'vegas: fine')
  // banco: 6 + K = 16, tira 5 → 21
  atteso(t.esitoBanco.tot === 21, 'vegas: banco a 21', t.esitoBanco)
  // venezia: niente carta coperta, il banco fa blackjack alla fine e si prende anche il raddoppio
  t = prepara(REGOLE.venezia, ['5c', '6c', 'Af', '6q', '10p', 'Kc', 'Qc'])
  const ev = t.giro([{ casella: 0, puntata: 10 }, { casella: 1, puntata: 10 }])
  atteso(ev.filter((e) => e.t === 'carta' && e.mano === 'banco').length === 1, 'venezia: una carta sola al banco')
  atteso(t.fase === 'assicurazione', 'venezia: asso del banco, assicurazione')
  t.assicura(false)
  t.assicura(true) // il 16 si assicura
  atteso(t.fase === 'gioco', 'venezia: dopo l’assicurazione si gioca')
  atteso(t.azioni().raddoppia && !t.azioni().resa && !t.azioni().stai, 'venezia: 11 raddoppia, niente resa, obbligo di carta')
  t.raddoppia() // 5+6+10 = 21
  atteso(t.attiva.carte.length === 2 && !t.azioni().raddoppia && t.azioni().stai, 'venezia: 16 non raddoppia e può stare')
  const fine = t.stai()
  atteso(t.esitoBanco.bj, 'venezia: blackjack del banco alla fine', t.esitoBanco)
  const es = fine.find((e) => e.t === 'esito')
  atteso(es.mani[0].torna === 0 && es.mani[0].giocato === 20, 'venezia: il blackjack del banco si prende anche il raddoppio', es)
  atteso(fine.some((e) => e.t === 'assicurazione chiusa' && e.vinta && e.torna === 15), 'venezia: assicurazione pagata 2 a 1 alla fine', fine)
}

const ref = {}
let tutto = true
for (const nome of QUALI) {
  const R = REGOLE[nome]
  const t0 = Date.now()
  const base = prova(nome, GIRI, false)
  const caos = prova(nome, Math.round(GIRI / 4), true)
  const vantaggio = -base.netto / base.puntato
  // l'errore standard: la varianza di una mano di blackjack è ~1,3 unità²
  const es = Math.sqrt(1.3 / base.mani) * 1.96
  console.log(`${R.nome}: ${base.mani.toLocaleString('it-IT')} mani con la strategia di base, ${caos.mani.toLocaleString('it-IT')} a caso, ${base.sabot + caos.sabot} sabot (${((Date.now() - t0) / 1000).toFixed(1)} s)`)
  console.log(`  vantaggio del banco ${pct(vantaggio)} ± ${pct(es)}  ·  divisioni ${base.divisioni + caos.divisioni}, raddoppi ${base.raddoppi + caos.raddoppi}, rese ${base.rese + caos.rese}, assicurazioni ${caos.assicurazioni}, mani per casella fino a ${Math.max(base.maxMani, caos.maxMani)}, mosse vietate rifiutate ${caos.vietateRifiutate}`)
  // i numeri pubblicati (wizardofodds.com, calcolatore del vantaggio): vegas ~0,29%, atlantic city ~0,38%,
  // venezia (europea senza carta coperta, raddoppio 9-11, perde tutto) ~0,6-0,7%
  const atteso_ = { vegas: [0.0015, 0.0045], atlantic: [0.0025, 0.0055], venezia: [0.004, 0.0095] }[nome]
  if (vantaggio < atteso_[0] - es || vantaggio > atteso_[1] + es) { errore(`${R.nome}: vantaggio del banco ${pct(vantaggio)} fuori da ${pct(atteso_[0])}–${pct(atteso_[1])}`); tutto = false }
  if (R.laterali) {
    const ex = (ref[R.mazzi] ??= esatte(R.mazzi))
    for (const [k, nomeL, prob, ev] of [['pp', 'perfect pairs', ex.pp, ex.evPP], ['t3', '21+3', ex.t3, ex.evT3]]) {
      const s = { n: base[k].n + caos[k].n, tipi: {} }
      for (const x of [base[k], caos[k]]) for (const [a, b] of Object.entries(x.tipi)) s.tipi[a] = (s.tipi[a] ?? 0) + b
      const righe = Object.entries(prob).map(([tipo, p]) => {
        const f = (s.tipi[tipo] ?? 0) / s.n, sd = Math.sqrt((p * (1 - p)) / s.n)
        const z = (f - p) / sd
        if (Math.abs(z) > 4.5) errore(`${nomeL} ${tipo}: frequenza ${f} contro ${p} (z ${z.toFixed(1)})`)
        return `${tipo} ${(f * 100).toFixed(3)}% (esatta ${(p * 100).toFixed(3)}%)`
      })
      const evS = (base[k].torna - base[k].puntato) / base[k].puntato
      console.log(`  ${nomeL}: ${righe.join(', ')} · vantaggio del banco esatto ${pct(-ev)}, nelle prove ${pct(-evS)}`)
    }
  }
}
console.log(errori ? `\n✗ ${errori} errori` : '\n✓ nessun errore')
process.exit(errori || !tutto ? 1 : 0)
