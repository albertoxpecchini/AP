// Le regole del blackjack di pzkko.it: il sabot, i punti, le puntate laterali e
// il tavolo che porta avanti una mano dopo l'altra. Niente disegno qui: la
// finestra (blackjack.js) chiama i metodi del Tavolo e anima gli «eventi» che
// tornano (le carte date, scoperte, i conti); le prove
// (tools/pzkko/blackjack/prova.mjs) giocano milioni di mani contro un conto
// fatto in un altro modo. Soldi finti: $pzk (vedi ../pzk.js).
//
// Tre regolamenti veri, scelti dal giocatore:
// - las vegas: il gioco a sei mazzi degli hotel della Strip (carta coperta e
//   sbirciata, raddoppio su tutto anche dopo la divisione, resa tardiva, 21+3 e
//   perfect pairs);
// - atlantic city: le regole del New Jersey (otto mazzi, al più tre mani
//   divise ai tavoli da sette posti, resa tardiva);
// - venezia: il regolamento del Casinò di Venezia (comune.venezia.it): sei
//   mazzi, il banco si dà la seconda carta solo alla fine, raddoppio con 9, 10
//   e 11, divisione solo di carte uguali fino a tre volte, obbligo di carta fino
//   a 11, cinque carte bruciate, il banco finisce il colpo anche se tutti hanno
//   sballato, il giocatore da solo punta su almeno due caselle, niente resa né
//   puntate laterali. Se il banco fa blackjack prende anche i raddoppi e le
//   divisioni (la regola europea senza carta coperta).

export const SEMI = ['c', 'q', 'f', 'p'] // cuori, quadri, fiori, picche
export const ROSSO = new Set(['c', 'q'])
export const RANGHI = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const valore = (r) => (r === 'A' ? 1 : r === '10' || r === 'J' || r === 'Q' || r === 'K' ? 10 : Number(r))
const ordine = (r) => RANGHI.indexOf(r) + 1 // A = 1 … K = 13

export const LIMITI = { min: 5, max: 1000, lateraleMax: 100 }

export const REGOLE = {
  vegas: {
    id: 'vegas', nome: 'las vegas', mazzi: 6, h17: false, paga: 1.5,
    raddoppio: 'tutte', das: true, mani: 4, rsa: false, stessoRango: false,
    resa: true, buca: true, perdeTutto: false, esaurisce: false, laterali: true,
    bruciate: 1, taglio: 1.5, caselleMin: 1, obbligo11: false,
    feltro: ['il banco tira fino a 16 e sta su tutti i 17', 'raddoppio su due carte, anche dopo la divisione · resa'],
  },
  atlantic: {
    id: 'atlantic', nome: 'atlantic city', mazzi: 8, h17: false, paga: 1.5,
    raddoppio: 'tutte', das: true, mani: 3, rsa: false, stessoRango: false,
    resa: true, buca: true, perdeTutto: false, esaurisce: false, laterali: true,
    bruciate: 1, taglio: 2, caselleMin: 1, obbligo11: false,
    feltro: ['il banco tira fino a 16 e sta su tutti i 17', 'otto mazzi · al più tre mani divise · resa'],
  },
  venezia: {
    id: 'venezia', nome: 'venezia', mazzi: 6, h17: false, paga: 1.5,
    raddoppio: '9-11', das: true, mani: 4, rsa: false, stessoRango: true,
    resa: false, buca: false, perdeTutto: true, esaurisce: true, laterali: false,
    bruciate: 5, taglio: 1.5, caselleMin: 2, obbligo11: true,
    feltro: ['il banco tira fino a 16 e sta su tutti i 17', 'raddoppio con 9, 10 e 11 · si chiama carta fino a 11'],
  },
}

// le puntate laterali (le tabelle più diffuse nei casinò)
export const PAGA_PP = { mista: 6, colore: 12, perfetta: 25 }
export const PAGA_T3 = { colore: 5, scala: 10, tris: 30, 'scala colore': 40, 'tris uguale': 100 }

/** I punti di una mano: il totale migliore, se è «morbido» (un asso conta 11) e il totale con gli assi a 1. */
export function punti(carte) {
  let duro = 0, assi = false
  for (const c of carte) { duro += valore(c.r); if (c.r === 'A') assi = true }
  const morbido = assi && duro + 10 <= 21
  return { tot: morbido ? duro + 10 : duro, morbido, duro }
}

/** Perfect pairs sulle prime due carte del giocatore. */
export function coppia(a, b) {
  if (a.r !== b.r) return null
  if (a.s === b.s) return 'perfetta'
  return ROSSO.has(a.s) === ROSSO.has(b.s) ? 'colore' : 'mista'
}

/** 21+3: le due carte del giocatore e la carta scoperta del banco, come una mano di poker a tre carte. */
export function tris(a, b, c) {
  const r = [a, b, c].map((x) => ordine(x.r)).sort((x, y) => x - y)
  const colore = a.s === b.s && b.s === c.s
  const uguali = r[0] === r[2]
  // la scala: tre ranghi di fila, l'asso vale 1 (A-2-3) o 14 (Q-K-A)
  const scala = !uguali && r[0] !== r[1] && r[1] !== r[2] && ((r[2] - r[0] === 2) || (r[0] === 1 && r[1] === 12 && r[2] === 13))
  if (uguali) return colore ? 'tris uguale' : 'tris'
  if (scala) return colore ? 'scala colore' : 'scala'
  return colore ? 'colore' : null
}

/** Il generatore di numeri casuali del gioco: crypto se c'è. */
export function casualeSicuro() {
  const c = globalThis.crypto
  if (!c?.getRandomValues) return Math.random()
  const u = new Uint32Array(2)
  c.getRandomValues(u)
  return (u[0] * 2 ** 21 + (u[1] >>> 11)) / 2 ** 53
}

/** Un sabot mescolato di `mazzi` mazzi da 52 (Fisher–Yates). Ogni carta ha un id unico nel sabot. */
export function sabot(mazzi, casuale = casualeSicuro) {
  const c = []
  let id = 0
  for (let m = 0; m < mazzi; m++) for (const s of SEMI) for (const r of RANGHI) c.push({ r, s, id: id++ })
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(casuale() * (i + 1)); [c[i], c[j]] = [c[j], c[i]] }
  return c
}

export class ErroreGioco extends Error {}
const no = (m) => { throw new ErroreGioco(m) }

/**
 * Il tavolo. Il giro:
 *   const ev = t.giro([{ casella: 0, puntata: 25, pp: 0, t3: 5 }, …])
 *   poi, finché t.fase non è 'fine':
 *     'assicurazione' → t.assicura(sì/no) per t.daAssicurare (una casella alla volta)
 *     'gioco'         → t.azioni() e una di t.carta() t.stai() t.raddoppia() t.dividi() t.resa()
 * Ogni metodo restituisce gli eventi da animare, in ordine. I conti negli
 * eventi: `giocato` è quello che lascia il tavolo, `torna` quello che va al
 * giocatore (la puntata compresa); la somma dei `giocato` di un giro è tutto
 * quello che si è puntato.
 * Le caselle sono numerate nell'ordine in cui il banco dà le carte: la 0 è la
 * prima alla sua sinistra.
 */
export class Tavolo {
  constructor(regole = REGOLE.vegas, casuale = casualeSicuro) {
    this.R = regole
    this.casuale = casuale
    this.carte = []
    this.pos = 0
    this.taglio = 0
    this.daMescolare = true
    this.ultima = false
    this.fase = 'puntate'
    this.mani = []
    this.banco = []
    this.prossimoId = 1
    this.ev = []
  }

  get rimaste() { return this.carte.length - this.pos }

  mescola() {
    const R = this.R
    this.carte = sabot(R.mazzi, this.casuale)
    this.pos = 0
    // la carta di taglio: circa R.taglio mazzi dalla fine, qualche carta più su o più giù
    this.taglio = this.carte.length - Math.round(R.taglio * 52) + Math.floor(this.casuale() * 17) - 8
    this.daMescolare = false
    this.ultima = false
    this.ev.push({ t: 'mescola', mazzi: R.mazzi, taglio: this.taglio, carte: this.carte.length })
    for (let i = 0; i < R.bruciate; i++) this.ev.push({ t: 'brucia', carta: this.pesca() })
  }

  pesca() {
    if (this.pos >= this.carte.length) {
      // non succede (dopo la carta di taglio resta più di un mazzo), ma se succede: si rimescolano gli scarti
      const inGioco = new Set([...this.mani.flatMap((m) => m.carte), ...this.banco].map((c) => c.id))
      const scarti = this.carte.filter((c) => !inGioco.has(c.id))
      for (let i = scarti.length - 1; i > 0; i--) { const j = Math.floor(this.casuale() * (i + 1)); [scarti[i], scarti[j]] = [scarti[j], scarti[i]] }
      this.carte = [...this.carte.filter((c) => inGioco.has(c.id)), ...scarti]
      this.pos = inGioco.size
      this.taglio = this.pos
      this.ultima = true
      this.ev.push({ t: 'rimescola' })
    }
    const c = this.carte[this.pos++]
    if (this.pos === this.taglio) { this.ultima = true; this.ev.push({ t: 'taglio' }) }
    return c
  }

  dai(m, traverso = false) {
    const carta = this.pesca()
    m.carte.push(carta)
    this.ev.push({ t: 'carta', mano: m.id, carta, traverso })
    return carta
  }
  daiBanco(coperta = false) {
    const carta = this.pesca()
    this.banco.push(carta)
    this.coperta = coperta
    this.ev.push({ t: 'carta', mano: 'banco', carta: coperta ? null : carta, coperta })
    return carta
  }

  /** Comincia un giro con le puntate date (una per casella). */
  giro(puntate) {
    if (this.fase !== 'puntate' && this.fase !== 'fine') no('il giro è già in corso')
    const R = this.R
    puntate = puntate.filter((p) => p.puntata > 0).sort((a, b) => a.casella - b.casella)
    if (!puntate.length) no('nessuna puntata')
    if (new Set(puntate.map((p) => p.casella)).size !== puntate.length) no('due puntate sulla stessa casella')
    if (puntate.length < R.caselleMin) no(`con queste regole si punta su almeno ${R.caselleMin} caselle`)
    for (const p of puntate) {
      if (p.puntata < LIMITI.min || p.puntata > LIMITI.max) no(`la puntata va da ${LIMITI.min} a ${LIMITI.max}`)
      for (const k of ['pp', 't3']) {
        if (!p[k]) continue
        if (!R.laterali) no('niente puntate laterali con queste regole')
        if (p[k] < 1 || p[k] > LIMITI.lateraleMax) no(`le laterali vanno da 1 a ${LIMITI.lateraleMax}`)
      }
    }
    this.ev = []
    if (this.daMescolare) this.mescola()
    this.mani = puntate.map((p) => ({ id: this.prossimoId++, casella: p.casella, carte: [], puntata: p.puntata, base: p.puntata, raddoppio: false, divisa: false, assi: false, fatta: false, sballata: false, resa: false, pari: false, ins: 0, chiusa: false }))
    this.laterali = puntate.map((p) => ({ casella: p.casella, pp: p.pp || 0, t3: p.t3 || 0 }))
    this.banco = []
    this.coperta = false
    this.attiva = null
    this.esitoBanco = null
    // la distribuzione: una carta a ogni casella, una al banco (scoperta), la seconda a ogni casella, e con la
    // carta coperta la seconda del banco
    for (const m of this.mani) this.dai(m)
    this.daiBanco()
    for (const m of this.mani) this.dai(m)
    if (R.buca) this.daiBanco(true)
    // le laterali si pagano subito
    const up = this.banco[0]
    for (const l of this.laterali) {
      if (!l.pp && !l.t3) continue
      const m = this.mani.find((x) => x.casella === l.casella)
      const pp = l.pp ? coppia(m.carte[0], m.carte[1]) : null
      const t3 = l.t3 ? tris(m.carte[0], m.carte[1], up) : null
      const tornaPP = pp ? l.pp * (PAGA_PP[pp] + 1) : 0
      const tornaT3 = t3 ? l.t3 * (PAGA_T3[t3] + 1) : 0
      this.ev.push({ t: 'laterali', casella: l.casella, pp: l.pp ? { tipo: pp, puntata: l.pp, torna: tornaPP } : null, t3: l.t3 ? { tipo: t3, puntata: l.t3, torna: tornaT3 } : null, giocato: l.pp + l.t3, torna: tornaPP + tornaT3 })
    }
    for (const m of this.mani) if (this.blackjack(m)) { m.fatta = true; this.ev.push({ t: 'blackjack', mano: m.id }) }
    if (up.r === 'A') {
      this.fase = 'assicurazione'
      this.daAssicurare = [...this.mani]
      this.ev.push({ t: 'assicurazione', mano: this.daAssicurare[0].id, pari: this.blackjack(this.daAssicurare[0]) })
    } else this.dopoAssicurazione()
    return this.prendi()
  }

  prendi() { const e = this.ev; this.ev = []; return e }

  blackjack(m) { return m.carte.length === 2 && !m.divisa && punti(m.carte).tot === 21 }
  bancoBJ() { return this.banco.length === 2 && punti(this.banco).tot === 21 }

  /** Assicurazione per la casella di turno (o «alla pari» se ha blackjack). */
  assicura(si) {
    if (this.fase !== 'assicurazione') no('niente assicurazione adesso')
    const m = this.daAssicurare.shift()
    if (si) {
      if (this.blackjack(m)) {
        // alla pari: il blackjack si paga subito 1 a 1, la mano è chiusa
        m.pari = true
        m.chiusa = true
        this.ev.push({ t: 'pari', mano: m.id, giocato: m.puntata, torna: m.puntata * 2 })
      } else {
        m.ins = m.base / 2
        this.ev.push({ t: 'assicura', mano: m.id, importo: m.ins })
      }
    }
    if (this.daAssicurare.length) this.ev.push({ t: 'assicurazione', mano: this.daAssicurare[0].id, pari: this.blackjack(this.daAssicurare[0]) })
    else this.dopoAssicurazione()
    return this.prendi()
  }

  dopoAssicurazione() {
    const R = this.R, up = this.banco[0]
    if (R.buca && (up.r === 'A' || valore(up.r) === 10)) {
      // il banco sbircia la carta coperta
      const bj = this.bancoBJ()
      this.ev.push({ t: 'sbircia', bj })
      if (up.r === 'A') this.chiudiAssicurazioni(bj)
      if (bj) {
        this.coperta = false
        this.ev.push({ t: 'scopre', carta: this.banco[1] })
        return this.chiudi()
      }
    }
    this.fase = 'gioco'
    this.avanza()
  }

  chiudiAssicurazioni(bj) {
    for (const m of this.mani) {
      if (!m.ins) continue
      const torna = bj ? m.ins * 3 : 0
      this.ev.push({ t: 'assicurazione chiusa', mano: m.id, vinta: bj, giocato: m.ins, torna })
      m.insChiusa = true
    }
  }

  /** La mano che deve giocare: dà la seconda carta alle mani divise e salta quelle finite. */
  avanza() {
    for (const m of this.mani) {
      if (m.fatta || m.chiusa) continue
      if (m.carte.length === 1) {
        this.dai(m)
        if (m.assi && !(this.R.rsa && m.carte[1].r === 'A' && this.maniDi(m.casella) < this.R.mani)) { m.fatta = true; continue }
      }
      if (punti(m.carte).tot >= 21) { m.fatta = true; continue }
      this.attiva = m
      this.ev.push({ t: 'tocca', mano: m.id })
      return
    }
    this.attiva = null
    this.giocaBanco()
  }

  maniDi(casella) { return this.mani.filter((m) => m.casella === casella).length }

  /** Cosa può fare la mano di turno (senza contare i soldi: quello lo guarda la finestra). */
  azioni() {
    const m = this.attiva
    if (this.fase !== 'gioco' || !m) return {}
    const R = this.R, p = punti(m.carte), due = m.carte.length === 2
    const coppiaOk = due && (R.stessoRango ? m.carte[0].r === m.carte[1].r : valore(m.carte[0].r) === valore(m.carte[1].r))
    return {
      carta: p.tot < 21 && !(m.assi && R.rsa && due), // gli assi divisi ricevono una carta sola (se si può, si possono ancora dividere)
      stai: !(R.obbligo11 && p.tot <= 11),
      raddoppia: due && !m.assi && (!m.divisa || R.das) && (R.raddoppio === 'tutte' || (p.duro >= 9 && p.duro <= 11)),
      dividi: coppiaOk && this.maniDi(m.casella) < R.mani && (!m.assi || R.rsa),
      resa: R.resa && due && !m.divisa && this.maniDi(m.casella) === 1,
      extra: m.base, // quanto costa raddoppiare o dividere
    }
  }

  vuole(azione) {
    if (!this.azioni()[azione]) no(`adesso non si può: ${azione}`)
    return this.attiva
  }

  carta() {
    const m = this.vuole('carta')
    this.dai(m)
    this.dopoCarta(m)
    return this.prendi()
  }
  dopoCarta(m) {
    const p = punti(m.carte)
    if (p.tot > 21) {
      m.sballata = true
      m.fatta = true
      m.chiusa = true
      this.ev.push({ t: 'sballa', mano: m.id, giocato: m.puntata, torna: 0 })
    } else if (p.tot === 21) m.fatta = true
    if (m.fatta) this.avanza()
  }
  stai() {
    const m = this.vuole('stai')
    m.fatta = true
    this.ev.push({ t: 'stai', mano: m.id })
    this.avanza()
    return this.prendi()
  }
  raddoppia() {
    const m = this.vuole('raddoppia')
    m.raddoppio = true
    m.puntata += m.base
    this.ev.push({ t: 'raddoppia', mano: m.id, extra: m.base })
    this.dai(m, true) // la carta del raddoppio, di traverso
    m.fatta = true
    this.dopoCarta(m)
    return this.prendi()
  }
  dividi() {
    const m = this.vuole('dividi')
    const c = m.carte.pop()
    const n = { id: this.prossimoId++, casella: m.casella, carte: [c], puntata: m.base, base: m.base, raddoppio: false, divisa: true, assi: c.r === 'A', fatta: false, sballata: false, resa: false, pari: false, ins: 0, chiusa: false }
    m.divisa = true
    m.assi = c.r === 'A'
    this.mani.splice(this.mani.indexOf(m) + 1, 0, n)
    this.ev.push({ t: 'dividi', mano: m.id, nuova: n.id, extra: m.base, ordine: this.mani.filter((x) => x.casella === m.casella).map((x) => x.id) })
    this.dai(m)
    if (m.assi && !(this.R.rsa && m.carte[1].r === 'A' && this.maniDi(m.casella) < this.R.mani)) m.fatta = true
    else if (punti(m.carte).tot === 21) m.fatta = true
    if (m.fatta) this.avanza()
    else this.ev.push({ t: 'tocca', mano: m.id })
    return this.prendi()
  }
  resa() {
    const m = this.vuole('resa')
    m.resa = true
    m.fatta = true
    m.chiusa = true
    this.ev.push({ t: 'resa', mano: m.id, giocato: m.puntata, torna: m.puntata / 2 })
    this.avanza()
    return this.prendi()
  }

  giocaBanco() {
    const R = this.R
    this.fase = 'banco'
    if (R.buca) { this.coperta = false; this.ev.push({ t: 'scopre', carta: this.banco[1] }) } else this.daiBanco()
    const bj = this.bancoBJ()
    if (!R.buca && this.banco[0].r === 'A') this.chiudiAssicurazioni(bj)
    // il banco tira se c'è ancora qualcuno da battere (a venezia sempre)
    const vive = this.mani.some((m) => !m.chiusa && !this.blackjack(m))
    if (!bj && (R.esaurisce || vive)) {
      for (;;) {
        const p = punti(this.banco)
        if (p.tot < 17 || (R.h17 && p.tot === 17 && p.morbido)) {
          const carta = this.pesca()
          this.banco.push(carta)
          this.ev.push({ t: 'carta', mano: 'banco', carta })
        } else break
      }
    }
    this.chiudi()
  }

  /** I conti delle mani ancora sul tavolo. */
  chiudi() {
    const R = this.R
    const b = punti(this.banco), bj = this.bancoBJ()
    const mani = []
    for (const m of this.mani) {
      if (m.chiusa) continue
      let esito, torna
      const p = punti(m.carte)
      if (this.blackjack(m)) { esito = bj ? 'pari' : 'blackjack'; torna = bj ? m.puntata : m.puntata * (1 + R.paga) }
      else if (bj) { esito = 'perde'; torna = R.perdeTutto ? 0 : m.puntata - m.base }
      else if (b.tot > 21 || p.tot > b.tot) { esito = 'vince'; torna = m.puntata * 2 }
      else if (p.tot === b.tot) { esito = 'pari'; torna = m.puntata }
      else { esito = 'perde'; torna = 0 }
      m.chiusa = true
      m.esito = esito
      mani.push({ mano: m.id, esito, giocato: m.puntata, torna })
    }
    this.esitoBanco = { tot: b.tot, bj, sballa: b.tot > 21 }
    this.ev.push({ t: 'esito', banco: this.esitoBanco, mani })
    this.fase = 'fine'
    if (this.ultima) this.daMescolare = true
  }

  /** Quello che si vede del tavolo (la carta coperta del banco resta coperta). */
  vista() {
    return {
      fase: this.fase,
      attiva: this.attiva?.id ?? null,
      banco: this.banco.map((c, i) => (i === 1 && this.coperta ? null : c)),
      mani: this.mani.map((m) => ({ id: m.id, casella: m.casella, carte: [...m.carte], puntata: m.puntata, raddoppio: m.raddoppio, divisa: m.divisa, chiusa: m.chiusa, esito: m.esito })),
      rimaste: this.rimaste,
    }
  }
}
