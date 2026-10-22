#!/usr/bin/env node
// Le prove delle mine di pzkko.it (pzkko/games/mine/regole.js): gioca tanti giri
// e controlla, giro per giro, con conti fatti in un altro modo:
// - i moltiplicatori e le vincite, contro i binomiali esatti in BigInt (il
//   troncamento ai centesimi, i mezzi $pzk per difetto, il massimo);
// - SHA-256 e HMAC scritti in regole.js, contro quelli di node:crypto su
//   messaggi e chiavi a caso di ogni lunghezza;
// - le mine: lo stesso seme dà le stesse mine con l'HMAC di node:crypto e una
//   pesca fatta in un altro modo; m caselle diverse fra 0 e 24; l'impronta è lo
//   SHA-256 del seme; ogni casella è mina tanto quanto le altre (chi quadro), e
//   così ogni coppia di caselle;
// - la partita: gemme e mina giuste per le mine svelate a fine giro, le mosse
//   vietate rifiutate (la stessa casella due volte, incassare senza gemme,
//   giocare a giro finito), l'incasso da sé all'ultima gemma, il conto: la
//   puntata lascia il tavolo una volta sola e torna la vincita giusta;
// - il ritorno al giocatore: con qualunque strategia «mi fermo dopo k gemme» è
//   99% meno il troncamento; quello misurato deve stare dove dice il conto esatto.
//
//   node tools/pzkko/mine/prova.mjs [giri, 200000] [--seme=N]

import { createHash, createHmac } from 'node:crypto'
import { CASELLE, MINE, LIMITI, MASSIMO, BANCO, binomiale, centesimi, vincita, posaMine, sha256, hmac, Partita, ErroreGioco } from '../../../pzkko/games/mine/regole.js'

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d }
const GIRI = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 200_000)
const SEME = Number(arg('seme', 4122))

// un generatore riproducibile (mulberry32)
function generatore(seme) {
  let a = seme >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rnd = generatore(SEME)
const intero = (n) => Math.floor(rnd() * n)
const esa = (n) => Array.from({ length: n }, () => intero(256).toString(16).padStart(2, '0')).join('')

let errori = 0
const errore = (m, ctx) => { errori++; if (errori <= 25) console.error('✗', m, ctx ? JSON.stringify(ctx).slice(0, 600) : '') }
const atteso = (cond, m, ctx) => { if (!cond) errore(m, ctx) }

// ── i conti esatti, in BigInt ────────────────────────────────────────────────
const fatt = [1n]
for (let i = 1n; i <= 25n; i++) fatt.push(fatt.at(-1) * i)
const C = (n, k) => (k < 0 || k > n ? 0n : fatt[n] / (fatt[k] * fatt[n - k]))
const centEsatti = (m, k) => (k < 1 || k > CASELLE - m ? 0n : (BigInt(100 - BANCO) * C(25, k)) / C(25 - m, k))
const vincitaEsatta = (p, m, k) => { const v = Number((BigInt(p * 2) * centEsatti(m, k)) / 100n) / 2; return Math.min(MASSIMO, v) }

console.log('moltiplicatori e vincite…')
for (let n = 0; n <= 25; n++) for (let k = 0; k <= n; k++) atteso(BigInt(binomiale(n, k)) === C(n, k), 'binomiale', { n, k })
for (let m = MINE.min; m <= MINE.max; m++) {
  for (let k = 0; k <= CASELLE - m + 1; k++) atteso(BigInt(centesimi(m, k)) === centEsatti(m, k), 'centesimi', { m, k, ha: centesimi(m, k), vuole: String(centEsatti(m, k)) })
  for (let k = 1; k <= CASELLE - m; k++) {
    atteso(centesimi(m, k) >= centesimi(m, k - 1), 'il moltiplicatore non scende', { m, k })
    for (const p of [1, 1.5, 5, 7, 25, 99, 100, 333, 500, 999, 1000]) atteso(vincita(p, m, k) === vincitaEsatta(p, m, k), 'vincita', { p, m, k, ha: vincita(p, m, k), vuole: vincitaEsatta(p, m, k) })
  }
}
// qualche riga che si conosce a memoria (×24,75 con una mina sola alla fine, con 24 mine alla prima)
atteso(centesimi(1, 1) === 103 && centesimi(1, 24) === 2475 && centesimi(24, 1) === 2475 && centesimi(3, 1) === 112, 'righe note', { a: centesimi(1, 1), b: centesimi(1, 24), c: centesimi(24, 1), d: centesimi(3, 1) })

// ── SHA-256 e HMAC contro node:crypto ───────────────────────────────────────
console.log('sha-256 e hmac…')
const byte = (n) => Uint8Array.from({ length: n }, () => intero(256))
const hex = (b) => Buffer.from(b).toString('hex')
for (let n = 0; n < 300; n++) {
  const m = byte(n < 200 ? n : intero(5000))
  atteso(hex(sha256(m)) === createHash('sha256').update(m).digest('hex'), 'sha-256', { n })
  const k = byte(rnd() < 0.2 ? 64 + intero(200) : intero(65))
  atteso(hex(hmac(k, m)) === createHmac('sha256', k).update(m).digest('hex'), 'hmac', { n, k: k.length })
}

// ── le mine: lo stesso conto con node:crypto e una pesca diversa ─────────────
function mineAMano(banco, giocatore, giro, m) {
  const f = []
  for (let cursore = 0; f.length < CASELLE - 1; cursore++) {
    const b = createHmac('sha256', banco).update(`${giocatore}:${giro}:${cursore}`).digest()
    for (let i = 0; i + 4 <= 32 && f.length < CASELLE - 1; i += 4) f.push(b.readUInt32BE(i) / 2 ** 32)
  }
  // la i-esima pesca prende la j-esima casella ancora libera, contando da capo
  const presa = new Array(CASELLE).fill(false), fuori = []
  for (let i = 0; i < f.length; i++) {
    let j = Math.floor(f[i] * (CASELLE - i))
    for (let c = 0; c < CASELLE; c++) if (!presa[c] && j-- === 0) { presa[c] = true; fuori.push(c); break }
  }
  return fuori.slice(0, m)
}

console.log(`${GIRI} giri…`)
const t0 = performance.now()
const volte = new Array(CASELLE).fill(0), coppie = new Map()
let mineTot = 0, giocato = 0, tornato = 0, attesoTot = 0, varianza = 0, vietate = 0, finoInFondo = 0, perse = 0
const sotto = { giocato: 0, tornato: 0, atteso: 0, varianza: 0 } // le strategie che non arrivano al massimo
const perM = new Map()
const semeGiocatore = esa(16)
for (let g = 0; g < GIRI; g++) {
  const m = rnd() < 0.5 ? [1, 3, 5, 10, 24][intero(5)] : MINE.min + intero(MINE.max)
  const puntata = rnd() < 0.2 ? LIMITI.min + intero(LIMITI.max) : [1, 5, 25, 100, 500, 1000][intero(6)]
  const semeBanco = esa(32)
  const p = Partita.nuova({ puntata, m, semeGiocatore, giro: g, semeBanco })

  // l'impronta e le mine, rifatte in un altro modo (ogni tanto: costa)
  if (g % 50 === 0) {
    atteso(p.impronta === createHash('sha256').update(semeBanco).digest('hex'), 'impronta', { semeBanco })
    const mm = posaMine(semeBanco, semeGiocatore, g, m)
    atteso(JSON.stringify(mm) === JSON.stringify(mineAMano(semeBanco, semeGiocatore, g, m)), 'le mine con node:crypto', { semeBanco, g, m })
  }

  // una strategia: fermarsi dopo `meta` gemme (meta = 25 − m: fino in fondo)
  const meta = 1 + intero(CASELLE - m)
  // il ritorno atteso di questa strategia: P(arrivare a meta) × vincita
  const P = Number(C(25 - m, meta)) / Number(C(25, meta)), v = vincita(puntata, m, meta)
  attesoTot += P * v
  varianza += P * (1 - P) * v * v
  giocato += puntata
  const libera = v < MASSIMO
  if (libera) { sotto.giocato += puntata; sotto.atteso += P * v; sotto.varianza += P * (1 - P) * v * v }

  // ogni tanto una mossa vietata, che deve essere rifiutata
  const vieta = (f, nome) => { try { f(); errore(`mossa vietata accettata: ${nome}`, { g }) } catch (e) { if (!(e instanceof ErroreGioco)) throw e; vietate++ } }
  if (rnd() < 0.1) vieta(() => p.incassa(), 'incassa senza gemme')
  let fine = null
  const viste = new Set()
  while (!fine) {
    const i = rnd() < 0.5 ? p.aCaso(rnd) : intero(CASELLE)
    if (viste.has(i)) { vieta(() => p.scopri(i), 'la stessa casella'); continue }
    viste.add(i)
    const ev = p.scopri(i)
    if (ev[0].t === 'mina') { fine = ev.at(-1); atteso(ev.length === 2 && fine.t === 'fine' && fine.esito === 'mina', 'mina e conto', ev); break }
    atteso(ev[0].t === 'gemma' && ev[0].i === i && ev[0].k === p.k, 'gemma', ev)
    atteso(ev[0].vincita === vincita(puntata, m, p.k), 'la vincita della gemma', ev)
    if (ev.length > 1) { fine = ev.at(-1); atteso(fine.esito === 'incassa' && (p.k === 25 - m || fine.torna >= MASSIMO), 'incasso da sé', { ev, k: p.k, m }); break }
    if (p.k === meta) { const e2 = p.incassa(); fine = e2[0]; atteso(e2.length === 1 && fine.esito === 'incassa', 'incassa', e2) }
  }
  if (rnd() < 0.05) vieta(() => p.scopri(p.aCaso(rnd) ?? 0), 'gioca a giro finito')
  if (rnd() < 0.05) vieta(() => p.incassa(), 'incassa a giro finito')

  // le mine svelate: m caselle diverse, nessuna fra le gemme, la mina presa fra loro
  const mine = p.mine()
  atteso(mine.length === m && new Set(mine).size === m && mine.every((x) => Number.isInteger(x) && x >= 0 && x < CASELLE), 'le mine', { mine, m })
  atteso(JSON.stringify(mine) === JSON.stringify(fine.mine), 'le mine del conto', { mine, fine })
  atteso(p.scoperte.every((x) => !mine.includes(x)) && new Set(p.scoperte).size === p.scoperte.length, 'le gemme non sono mine', { s: p.scoperte, mine })
  if (fine.esito === 'mina') { atteso(mine.includes(p.ultima), 'la mina presa è una mina', { u: p.ultima, mine }); atteso(fine.torna === 0, 'la mina si prende tutto', fine); perse++ }
  else { atteso(fine.torna === vincitaEsatta(puntata, m, p.k) && fine.k === p.k, 'il conto dell’incasso', { fine, puntata, m, k: p.k, vuole: vincitaEsatta(puntata, m, p.k) }); if (p.k === 25 - m) finoInFondo++ }
  atteso(fine.giocato === puntata, 'la puntata lascia il tavolo una volta', fine)
  tornato += fine.torna
  if (libera) sotto.tornato += fine.torna
  // si è fermato dove voleva, o è saltato prima
  atteso(fine.esito === 'mina' ? p.k < meta : p.k === meta || fine.torna >= MASSIMO, 'si ferma alla meta', { k: p.k, meta, fine })

  for (const x of mine) volte[x]++
  mineTot += m
  if (m === 2) { const k = mine.slice().sort((a, b) => a - b).join('-'); coppie.set(k, (coppie.get(k) ?? 0) + 1) }
  const q = perM.get(m) ?? { n: 0, giocato: 0, tornato: 0, atteso: 0 }
  q.n++; q.giocato += puntata; q.tornato += fine.torna; q.atteso += P * v
  perM.set(m, q)
}
const secondi = (performance.now() - t0) / 1000

// ogni casella è mina con probabilità m/25: chi quadro a 24 gradi di libertà (il 99,9% sta sotto 51,2)
const att = mineTot / CASELLE
const chi = volte.reduce((s, v) => s + (v - att) ** 2 / att, 0)
atteso(chi < 51.2, 'le caselle non sono tutte uguali', { chi, volte })
// con due mine, ognuna delle 300 coppie (299 gradi: il 99,9% sta sotto 384)
const nCoppie = [...coppie.values()].reduce((a, b) => a + b, 0)
let chiC = 0
if (nCoppie > 3000) { const a = nCoppie / 300; for (let i = 0; i < 25; i++) for (let j = i + 1; j < 25; j++) chiC += ((coppie.get(`${i}-${j}`) ?? 0) - a) ** 2 / a; atteso(chiC < 384, 'le coppie non sono tutte uguali', { chiC, nCoppie }) }
// il ritorno: misurato contro atteso, a 4,5 deviazioni
const z = (tornato - attesoTot) / Math.sqrt(varianza)
atteso(Math.abs(z) < 4.5, 'il ritorno non torna', { tornato, attesoTot, z })
const zs = (sotto.tornato - sotto.atteso) / Math.sqrt(sotto.varianza)
atteso(Math.abs(zs) < 4.5, 'il ritorno sotto il massimo non torna', { ...sotto, zs })
// sotto il massimo si perde solo l'1% e il troncamento: fra 97 e 99 (atteso, non misurato)
atteso(sotto.atteso / sotto.giocato > 0.97 && sotto.atteso / sotto.giocato <= 0.99, 'il ritorno atteso sotto il massimo', sotto)

console.log(`\n${GIRI} giri in ${secondi.toFixed(1)} s, ${vietate} mosse vietate rifiutate, ${perse} persi, ${finoInFondo} fino all'ultima gemma`)
console.log(`caselle: chi quadro ${chi.toFixed(1)} (24 gradi)${nCoppie > 3000 ? `, coppie con due mine ${chiC.toFixed(0)} (299 gradi, ${nCoppie} giri)` : ''}`)
console.log(`ritorno al giocatore, con le strategie che non toccano il massimo: ${(100 * sotto.tornato / sotto.giocato).toFixed(2)}% misurato, ${(100 * sotto.atteso / sotto.giocato).toFixed(2)}% atteso (z = ${zs.toFixed(2)})`)
console.log(`  con tutte (anche quelle che lo toccano e ci perdono): ${(100 * tornato / giocato).toFixed(2)}% misurato, ${(100 * attesoTot / giocato).toFixed(2)}% atteso (z = ${z.toFixed(2)})`)
console.log('per numero di mine (ritorno misurato / atteso):')
console.log([...perM].sort((a, b) => a[0] - b[0]).map(([m, q]) => `  ${String(m).padStart(2)}: ${(100 * q.tornato / q.giocato).toFixed(1).padStart(5)}% / ${(100 * q.atteso / q.giocato).toFixed(2)}%  (${q.n})`).join('\n'))
console.log(errori ? `\n${errori} errori` : '\nnessun errore')
process.exit(errori ? 1 : 0)
