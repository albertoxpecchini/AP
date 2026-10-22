// Le regole delle mine di pzkko.it: il campo, i moltiplicatori, dove stanno le
// mine e la partita che va avanti una casella alla volta. Niente disegno qui: la
// finestra (mine.js) chiama i metodi della Partita e anima gli «eventi» che
// tornano; le prove (tools/pzkko/mine/prova.mjs) giocano milioni di giri contro
// conti fatti in un altro modo. Soldi finti: $pzk (vedi ../pzk.js).
//
// È il gioco delle mine dei casinò online: venticinque caselle, il giocatore
// sceglie quante mine (da 1 a 24) e punta; ogni casella senza mina è una gemma e
// fa salire il moltiplicatore, si incassa quando si vuole, una mina si prende
// tutto. Il moltiplicatore dopo k gemme con m mine è quello giusto (l'inverso
// della probabilità di arrivarci, C(25,k)/C(25−m,k)) meno l'1% che tiene il
// banco, troncato ai centesimi: quello scritto sul tavolo è quello pagato. Si
// paga a mezzi $pzk per difetto, al più MASSIMO a giro.
//
// Le mine sono decise prima del primo tocco, come nei casinò «provably fair»: un
// seme del banco (32 byte a caso), il seme del giocatore e il numero del giro
// passano da HMAC-SHA256 (chiave il seme del banco, messaggio
// «giocatore:giro:cursore»); ogni 4 byte fanno un numero fra 0 e 1, e 24 numeri
// pescano una dopo l'altra le caselle (la prima fra 25, la seconda fra le 24
// rimaste…): le prime m sono le mine. Prima del giro si vede l'impronta del seme
// del banco (SHA-256), dopo il seme: chiunque può rifare il conto.

export const LATO = 5
export const CASELLE = LATO * LATO
export const MINE = { min: 1, max: 24, prima: 3 }
export const LIMITI = { min: 1, max: 1000 }
export const MASSIMO = 1_000_000 // la vincita più alta di un giro, in $pzk
export const BANCO = 1 // per cento

/** Le combinazioni di n oggetti a k a k (intere ed esatte fino a C(25, 12)). */
export function binomiale(n, k) {
  if (k < 0 || k > n) return 0
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return r
}

/** Il moltiplicatore dopo k gemme con m mine, in centesimi (troncato): 103 = ×1,03. 0 se k = 0. */
export function centesimi(m, k) {
  if (!(k >= 1 && k <= CASELLE - m)) return 0
  const a = (100 - BANCO) * binomiale(CASELLE, k), b = binomiale(CASELLE - m, k)
  return (a - (a % b)) / b
}

/** Quanto torna incassando dopo k gemme: la puntata per il moltiplicatore, a mezzi $pzk per difetto, al più MASSIMO. */
export function vincita(puntata, m, k) {
  const c = Math.round(puntata * 2) * centesimi(m, k) // in centesimi di mezzo $pzk: intero ed esatto
  return Math.min(MASSIMO, (c - (c % 100)) / 200)
}

/** Il moltiplicatore come si scrive: ×1,03 o ×5.200,30. */
export const scriviMolt = (c) => `×${(c / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Il nome di una casella, come sul tavolo: colonne a–e, righe 1–5 («c3»). */
export const nomeCasella = (i) => `${'abcde'[i % LATO]}${Math.floor(i / LATO) + 1}`

// ── il seme e le mine ───────────────────────────────────────────────────────
// SHA-256 e HMAC scritti qui (sono quaranta righe) invece di crypto.subtle, che
// il browser dà solo alle pagine in https o su localhost: così le mine si
// giocano anche dal telefono sulla rete di casa, e il conto è sincrono. Le prove
// li confrontano con quelli di node:crypto.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])
const ror = (x, n) => (x >>> n) | (x << (32 - n))
/** SHA-256 di un Uint8Array (fino a 512 MB). */
export function sha256(m) {
  const n = ((m.length + 9 + 63) >> 6) << 6
  const b = new Uint8Array(n)
  b.set(m)
  b[m.length] = 0x80
  const dv = new DataView(b.buffer)
  dv.setUint32(n - 4, m.length * 8)
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19])
  const w = new Uint32Array(64)
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4)
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15], y = w[i - 2]
      w[i] = w[i - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + w[i - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10))
    }
    let [a, bb, c, d, e, f, g, h] = H
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0
    }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h
  }
  const out = new Uint8Array(32), dvo = new DataView(out.buffer)
  for (let i = 0; i < 8; i++) dvo.setUint32(i * 4, H[i])
  return out
}
const unisci = (a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c }
/** HMAC-SHA256. */
export function hmac(chiave, msg) {
  const k = new Uint8Array(64)
  k.set(chiave.length > 64 ? sha256(chiave) : chiave)
  return sha256(unisci(k.map((x) => x ^ 0x5c), sha256(unisci(k.map((x) => x ^ 0x36), msg))))
}

const utf8 = new TextEncoder()
const esa = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('')

/** Un seme nuovo: `byte` byte a caso, in esadecimale. */
export function nuovoSeme(byte = 32) {
  const a = new Uint8Array(byte)
  crypto.getRandomValues(a)
  return esa(a)
}

/** L'impronta di un seme: SHA-256 del testo, in esadecimale. */
export const impronta = (seme) => esa(sha256(utf8.encode(seme)))

/** I numeri fra 0 e 1 del giro: HMAC-SHA256(banco, «giocatore:giro:cursore»), 4 byte per numero. */
export function numeri(semeBanco, semeGiocatore, giro, quanti) {
  const chiave = utf8.encode(semeBanco), out = []
  for (let cursore = 0; out.length < quanti; cursore++) {
    const b = hmac(chiave, utf8.encode(`${semeGiocatore}:${giro}:${cursore}`))
    for (let i = 0; i + 4 <= b.length && out.length < quanti; i += 4) out.push(b[i] / 256 + b[i + 1] / 256 ** 2 + b[i + 2] / 256 ** 3 + b[i + 3] / 256 ** 4)
  }
  return out
}

/** Dove stanno le m mine del giro (le caselle 0…24, a–e da sinistra, 1–5 dall'alto), nell'ordine in cui escono. */
export function posaMine(semeBanco, semeGiocatore, giro, m) {
  const f = numeri(semeBanco, semeGiocatore, giro, CASELLE - 1)
  const libere = Array.from({ length: CASELLE }, (_, i) => i)
  return f.map((x, i) => libere.splice(Math.floor(x * (CASELLE - i)), 1)[0]).slice(0, m)
}

// ── la partita ──────────────────────────────────────────────────────────────
export class ErroreGioco extends Error {}

/**
 * Un giro: la puntata, le mine, le caselle scoperte. `scopri(i)` e `incassa()`
 * tornano gli eventi da animare:
 *   { t: 'gemma', i, k, centesimi, vincita }   una gemma (k = quante finora; vincita = quanto torna incassando adesso)
 *   { t: 'mina', i }                           la mina: il giro è perso
 *   { t: 'fine', esito, k, centesimi, giocato, torna, mine }   il conto ($pzk: giocato lascia il tavolo, torna va nel saldo)
 * Dopo l'ultima gemma, o arrivati a MASSIMO, si incassa da sé.
 */
export class Partita {
  #mine
  constructor({ puntata, m, mine, semeBanco, semeGiocatore, giro, impronta }) {
    this.puntata = puntata
    this.m = m
    this.#mine = new Set(mine)
    this.semeBanco = semeBanco
    this.semeGiocatore = semeGiocatore
    this.giro = giro
    this.impronta = impronta
    this.scoperte = [] // le gemme trovate, in ordine
    this.esito = null // null mentre si gioca, poi 'mina' | 'incassa'
  }

  static nuova({ puntata, m, semeGiocatore, giro, semeBanco = nuovoSeme() }) {
    if (!Number.isInteger(m) || m < MINE.min || m > MINE.max) throw new ErroreGioco(`le mine vanno da ${MINE.min} a ${MINE.max}`)
    if (!(puntata >= LIMITI.min) || puntata > LIMITI.max || Math.round(puntata * 2) !== puntata * 2) throw new ErroreGioco(`si punta da ${LIMITI.min} a ${LIMITI.max} $pzk`)
    return new Partita({ puntata, m, mine: posaMine(semeBanco, semeGiocatore, giro, m), semeBanco, semeGiocatore, giro, impronta: impronta(semeBanco) })
  }

  get k() { return this.scoperte.length }
  get finita() { return this.esito !== null }
  /** Quanto torna incassando adesso (0 prima della prima gemma). */
  get vincita() { return this.k ? vincita(this.puntata, this.m, this.k) : 0 }
  get centesimi() { return centesimi(this.m, this.k) }
  /** Le caselle ancora coperte. */
  get coperte() { const s = new Set(this.scoperte); if (this.esito === 'mina') s.add(this.ultima); return Array.from({ length: CASELLE }, (_, i) => i).filter((i) => !s.has(i)) }
  /** Le mine: solo a giro finito. */
  mine() { if (!this.finita) throw new ErroreGioco('le mine si vedono a giro finito'); return [...this.#mine] }

  scopri(i) {
    if (this.finita) throw new ErroreGioco('il giro è finito')
    if (!Number.isInteger(i) || i < 0 || i >= CASELLE) throw new ErroreGioco('questa casella non c’è')
    if (this.scoperte.includes(i)) throw new ErroreGioco('questa casella è già scoperta')
    this.ultima = i
    if (this.#mine.has(i)) {
      this.esito = 'mina'
      return [{ t: 'mina', i }, this.#conto()]
    }
    this.scoperte.push(i)
    const ev = [{ t: 'gemma', i, k: this.k, centesimi: this.centesimi, vincita: this.vincita }]
    if (this.k === CASELLE - this.m || this.vincita >= MASSIMO) { this.esito = 'incassa'; ev.push(this.#conto()) }
    return ev
  }

  incassa() {
    if (this.finita) throw new ErroreGioco('il giro è finito')
    if (!this.k) throw new ErroreGioco('trova almeno una gemma, prima')
    this.esito = 'incassa'
    return [this.#conto()]
  }

  /** Una casella coperta a caso (la scelta non cambia niente: le mine sono già lì). */
  aCaso(rnd = Math.random) {
    const c = this.coperte
    return c[Math.floor(rnd() * c.length)]
  }

  #conto() {
    const torna = this.esito === 'incassa' ? this.vincita : 0
    return { t: 'fine', esito: this.esito, k: this.k, centesimi: this.esito === 'incassa' ? this.centesimi : 0, giocato: this.puntata, torna, mine: [...this.#mine] }
  }
}
