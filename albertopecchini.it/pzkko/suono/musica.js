// La musica di pzkko.it (26.10, Alberto: «voglio le musichette… diverse, stile ocarina / animal crossing / minecraft in
// 16 bit», i suoni della strada al 20% e la musica al 70%, poi al 30%: «musica 0.3»). Come il resto (voci.js, interfaccia.js) niente file: ogni nota
// è sintetizzata dal vivo col Web Audio, con gli strumenti di una cartuccia del Super Nintendo (l'ocarina, l'arpa, la
// marimba, il piano elettrico, il contrabbasso, il piano, gli archi, i campanelli, il flauto, la batteria a spazzole), la
// sua eco (il ritardo che torna indietro perdendo gli acuti), un riverbero e quel filo di acuti in meno.
// - Sei brani, scritti qui, due per stile, che si alternano: l'ocarina (il Mincio, la nebbia), la piazzetta col
//   contrabbasso e lo swing (piazza Sordello di mattina, il bar di sera), il piano lento e sparso (i campi, la nevicata).
//   Ognuno fa i suoi giri (al secondo entra un'altra voce), poi qualche secondo di strada sola e il prossimo.
// - Chi decide quando: interfaccia.js (con i suoni accesi, in ogni pagina). Le sigle delle app la abbassano un momento;
//   cambiando pagina riprende da dov'era (sessionStorage pzkko-musica).
// Funziona anche in un OfflineAudioContext: tools/pzkko/suono/ascolta.mjs musica ne registra i brani.

// ── le note: «F#5:3 E5 - D5+A5:2 | …», un passo l'una se non dice quanti, «-» la pausa, «+» l'accordo; «|» la battuta,
// solo per leggere. Nella batteria «x» un colpo e «X» uno forte ──
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const hz = (n) => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n)
  if (!m) throw new Error(`musica: nota «${n}»?`)
  return 440 * 2 ** ((NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12 - 69) / 12)
}
/** → { note: [[passo, quanti, [hz…] o la forza del colpo]], passi } */
function leggi(testo) {
  const note = []
  let p = 0
  for (const pezzo of testo.trim().split(/\s+/)) {
    if (pezzo === '|') continue
    const [n, k = '1'] = pezzo.split(':'), d = Number(k)
    if (n === 'x' || n === 'X') note.push([p, d, n === 'X' ? 1 : 0.65])
    else if (n !== '-') note.push([p, d, n.split('+').map(hz)])
    p += d
  }
  return { note, passi: p }
}
// gli accompagnamenti, da un accordo per battuta («D3 A3 D4 F#4 A4 | G2 …»): l'arpeggio con lo schema degli indici
// («0 1 2 3 4 3», o «0:2 …» per un passo più lungo), gli accordi tenuti, e i colpi («- A - A …»: A dove suona; «X / Y»
// sono due accordi nella battuta, Y dalla metà)
const battute = (accordi) => accordi.split('|').map((a) => a.trim())
const arpeggio = (accordi, schema) => battute(accordi).map((a) => {
  const n = a.split(/\s+/)
  return schema.split(' ').map((s) => { const [i, k] = s.split(':'); return n[i] + (k ? ':' + k : '') }).join(' ')
}).join(' | ')
const tenuti = (accordi, k) => battute(accordi).map((a) => a.split(/\s+/).join('+') + ':' + k).join(' ')
const colpi = (accordi, schema) => battute(accordi).map((b) => {
  const [x, y = x] = b.split('/').map((a) => a.trim().split(/\s+/).join('+')), pezzi = schema.split(' ')
  const tot = pezzi.reduce((s, t) => s + Number(t.split(':')[1] ?? 1), 0)
  let p = 0
  return pezzi.map((t) => { const [n, k] = t.split(':'), s = n === 'A' ? (p < tot / 2 ? x : y) + (k ? ':' + k : '') : t; p += Number(k ?? 1); return s }).join(' ')
}).join(' | ')

// ── i brani: quanto forte (per pareggiarli: fra −16 e −18 dBFS, misurati con ascolta.mjs musica), il tempo (bpm), il
// passo (in battiti: 0,5 le crome), lo swing (quanto ritarda la croma in levare: 0,33 è la terzina), i giri, l'eco
// [ritardo in battiti, ritorno, quanta] e il riverbero; le tracce [strumento, volume, lato, note, { dal: il giro da cui
// entra, ottava }] (le più corte, la batteria, si ripetono fino in fondo) ──
const MINCIO = 'D3 A3 D4 F#4 A4 | G2 D3 G3 B3 D4 | D3 A3 D4 F#4 A4 | A2 E3 A3 C#4 E4 | B2 F#3 B3 D4 F#4 | G2 D3 G3 B3 D4 | E3 B3 E4 G4 B4 | A2 E3 A3 C#4 E4 | G2 D3 G3 B3 D4 | A2 E3 A3 C#4 E4 | F#2 C#3 F#3 A3 C#4 | B2 F#3 B3 D4 F#4 | G2 D3 G3 B3 D4 | A2 E3 A3 C#4 E4 | D3 A3 D4 F#4 A4 | D3 A3 D4 F#4 A4'
const NEBBIA = 'A4 C5 E5 A5 | F4 A4 C5 F5 | E4 G4 C5 E5 | D4 G4 B4 D5 | A4 C5 E5 A5 | F4 A4 C5 F5 | D4 F4 A4 D5 | E4 G#4 B4 E5'
export const BRANI = [
  {
    nome: 'il Mincio', stile: 'ocarina', forte: 0.9, bpm: 96, passo: 0.5, giri: 2, eco: [0.75, 0.3, 0.2], riv: 0.22,
    tracce: [
      // un valzer in re: l'ocarina, l'arpa che arpeggia, gli archi sotto; al secondo giro i campanelli rispondono
      ['ocarina', 0.34, 0.05, 'F#5:3 E5 D5:2 | B4:2 D5:2 G5:2 | F#5:3 E5 D5 E5 | E5:4 -:2 | D5:3 C#5 B4:2 | G4:2 B4:2 D5:2 | E5:3 F#5 G5:2 | A5:2 G5 F#5 E5:2 | D5:2 G5:3 F#5 | E5:2 A5:3 G5 | F#5:3 E5 C#5:2 | D5:4 B4:2 | B4:2 D5:2 G5:2 | A5:3 G5 E5:2 | F#5:3 E5 D5 C#5 | D5:4 -:2'],
      ['arpa', 0.15, -0.3, arpeggio(MINCIO, '0 1 2 3 4 3')],
      ['archi', 0.08, 0.25, tenuti('D4 F#4 A4 | D4 G4 B4 | D4 F#4 A4 | C#4 E4 A4 | D4 F#4 B4 | D4 G4 B4 | E4 G4 B4 | C#4 E4 A4 | D4 G4 B4 | C#4 E4 A4 | C#4 F#4 A4 | D4 F#4 B4 | D4 G4 B4 | C#4 E4 A4 | D4 F#4 A4 | D4 F#4 A4', 6)],
      ['campanelli', 0.1, 0.4, '-:6 | -:6 | -:6 | -:3 A5 C#6 E6 | -:6 | -:6 | -:6 | -:3 C#6 E6 A6 | -:6 | -:6 | -:6 | -:3 D6 F#6 B6 | -:6 | -:6 | -:6 | -:3 F#6 A6 D7', { dal: 1 }],
    ],
  },
  {
    nome: 'piazza Sordello', stile: 'piazzetta', forte: 1.4, bpm: 116, passo: 0.5, swing: 0.28, giri: 2, eco: [0.5, 0.15, 0.08], riv: 0.12,
    tracce: [
      // fa maggiore, di mattina: la marimba, il piano elettrico in levare, il contrabbasso che cammina, la batteria
      // leggera; al secondo giro i campanelli raddoppiano la marimba un'ottava sopra
      ['marimba', 0.36, 0.1, 'C5 - A4 C5 - F5:2 E5 | D5:2 C5 A4 - F4:3 | Bb4 - D5 F5 - A5:2 G5 | E5:2 D5 C5 - Bb4:3 | A4 - C5 F5 - A5:2 G5 | F5:2 E5 D5 - C5:3 | D5 Bb4 G4 Bb4 C5 E5 G5 Bb5 | A5:3 F5 -:4 | D5 - F5 A5 - C6:2 A5 | Db6:2 Bb5 F5 - Db5:3 | C5 - E5 G5 - A5:2 G5 | F#5:2 E5 D5 - C5:3 | Bb4 D5 F5 A5 - G5:3 | E5 - G5 Bb5 - G5:2 E5 | F5 E5 C5 A4 F#4 A4 C5 D5 | G4:2 Bb4 D5 E5:2 G5:2'],
      ['ep', 0.1, -0.25, colpi('A3 C4 E4 | A3 C4 F4 | Bb3 D4 F4 | Bb3 E4 G4 | A3 C4 E4 | A3 C4 F4 | Bb3 D4 F4 / Bb3 E4 G4 | A3 C4 E4 | A3 D4 F4 | G3 Db4 F4 | G3 C4 E4 | F#3 C4 E4 | Bb3 D4 F4 | Bb3 E4 G4 | A3 C4 E4 / F#3 C4 E4 | Bb3 D4 F4 / Bb3 E4 G4', '- A - A - A - A')],
      ['basso', 0.18, 0, 'F2:2 A2:2 C3:2 D3:2 | D3:2 A2:2 F2:2 F#2:2 | G2:2 Bb2:2 D3:2 B2:2 | C3:2 E3:2 G2:2 E2:2 | F2:2 A2:2 C3:2 D3:2 | D3:2 A2:2 F2:2 F#2:2 | G2:2 D3:2 C3:2 E2:2 | F2:2 C3:2 F2:2 A2:2 | Bb2:2 D3:2 F3:2 D3:2 | Bb2:2 Db3:2 F3:2 Bb2:2 | A2:2 C3:2 E3:2 Eb3:2 | D3:2 C3:2 A2:2 F#2:2 | G2:2 Bb2:2 D3:2 B2:2 | C3:2 Bb2:2 G2:2 E2:2 | F2:2 A2:2 D3:2 F#2:2 | G2:2 Bb2:2 C3:2 E2:2'],
      ['cassa', 0.24, 0, 'x - - - x - - -'],
      ['bordo', 0.2, 0.15, '- - x - - - x -'],
      ['piatto', 0.07, -0.2, 'X x x x X x x x'],
      ['campanelli', 0.05, 0.35, 'C5 - A4 C5 - F5:2 E5 | D5:2 C5 A4 - F4:3 | Bb4 - D5 F5 - A5:2 G5 | E5:2 D5 C5 - Bb4:3 | A4 - C5 F5 - A5:2 G5 | F5:2 E5 D5 - C5:3 | D5 Bb4 G4 Bb4 C5 E5 G5 Bb5 | A5:3 F5 -:4 | D5 - F5 A5 - C6:2 A5 | Db6:2 Bb5 F5 - Db5:3 | C5 - E5 G5 - A5:2 G5 | F#5:2 E5 D5 - C5:3 | Bb4 D5 F5 A5 - G5:3 | E5 - G5 Bb5 - G5:2 E5 | F5 E5 C5 A4 F#4 A4 C5 D5 | G4:2 Bb4 D5 E5:2 G5:2', { dal: 1, ottava: 1 }],
    ],
  },
  {
    nome: 'i campi', stile: 'piano', forte: 1.35, bpm: 72, passo: 0.5, giri: 2, eco: [1, 0.3, 0.16], riv: 0.45,
    tracce: [
      // do maggiore, lento: il piano con la sinistra che sale piano e la destra che dice poco; al secondo giro gli archi
      ['piano', 0.42, 0.15, '-:4 E5:2 G5:2 | B5:4 A5:2 G5:2 | E5:6 D5:2 | C5:8 | -:4 E5:2 G5:2 | B5:4 D6:2 B5:2 | A5:4 G5:2 E5:2 | D5:8 | -:2 C6:2 B5:2 A5:2 | G5:4 E5:2 D5:2 | E5:6 C5:2 | G4:8'],
      ['piano', 0.15, -0.2, arpeggio('C3 G3 B3 E4 | E2 B2 D3 G3 | A2 E3 G3 C4 | F2 C3 E3 A3 | C3 G3 B3 E4 | E2 B2 D3 G3 | F2 C3 E3 A3 | G2 D3 A3 C4 | A2 E3 G3 C4 | E2 B2 D3 G3 | F2 C3 E3 A3 | F2 C3 E3 A3', '0:2 1:2 2:2 3:2')],
      ['archi', 0.04, 0, tenuti('E4 G4 B4 | D4 G4 B4 | C4 E4 G4 | C4 E4 A4 | E4 G4 B4 | D4 G4 B4 | C4 E4 A4 | D4 G4 A4 | C4 E4 G4 | D4 G4 B4 | C4 E4 A4 | C4 E4 A4', 8), { dal: 1 }],
    ],
  },
  {
    nome: 'la nebbia', stile: 'ocarina', bpm: 80, passo: 0.5, giri: 3, eco: [0.75, 0.4, 0.22], riv: 0.35,
    tracce: [
      // la minore, nella nebbia: l'ocarina, i campanelli che arpeggiano lassù, gli archi bassi; dal secondo giro l'arpa
      ['ocarina', 0.32, 0, 'A4:2 C5:2 E5:4 | F5:3 E5 C5:4 | G4:2 C5:2 E5:3 D5 | D5:6 -:2 | A4:2 C5:2 E5:2 A5:2 | G5:3 F5 E5:2 C5:2 | D5:3 E5 F5:2 A5:2 | B5:2 G#5:2 E5:4'],
      ['campanelli', 0.08, 0.35, arpeggio(NEBBIA, '0 1 2 3 2 1 2 1'), { ottava: 1 }],
      ['archi', 0.06, -0.2, tenuti('A2 E3 C4 | F2 C3 A3 | C3 G3 E4 | G2 D3 B3 | A2 E3 C4 | F2 C3 A3 | D3 A3 F4 | E2 B2 G#3', 8)],
      ['arpa', 0.13, -0.35, arpeggio(NEBBIA, '0:2 2:2 1:2 3:2'), { dal: 1, ottava: -1 }],
    ],
  },
  {
    nome: 'il bar di sera', stile: 'piazzetta', forte: 1.1, bpm: 84, passo: 0.5, swing: 0.3, giri: 3, eco: [0.75, 0.2, 0.1], riv: 0.2,
    tracce: [
      // mi bemolle, di sera: il flauto, il piano elettrico, il contrabbasso a due, le spazzole; dal secondo giro la
      // marimba sotto il flauto
      ['flauto', 0.26, 0.1, '-:2 G4 Bb4 D5:3 Eb5 | C5:4 Bb4:2 G4:2 | -:2 Ab4 C5 Eb5:3 F5 | D5:4 C5:2 Bb4:2 | -:2 Bb4 D5 F5:3 G5 | E5:4 D5:2 Bb4:2 | C5:2 Eb5:2 Ab5:3 G5 | F5:6 -:2'],
      ['ep', 0.13, -0.25, colpi('G3 Bb3 D4 | G3 Bb3 Eb4 | Ab3 C4 Eb4 | Ab3 D4 F4 | F3 Bb3 D4 | E3 Bb3 D4 | Ab3 C4 Eb4 | Ab3 C4 F4', 'A:3 A:5')],
      ['basso', 0.22, 0, 'Eb2:4 Bb2:4 | C3:4 G2:4 | F2:4 C3:4 | Bb2:4 F2:4 | G2:4 D3:4 | C3:4 G2:4 | F2:4 Ab2:4 | Bb2:4 D3:4'],
      ['spazzola', 0.35, 0.15, '- - x - - - x -'],
      ['piatto', 0.05, -0.25, 'X - x x X - x x'],
      ['cassa', 0.16, 0, 'x - - - - - - -'],
      ['marimba', 0.13, -0.1, '-:2 G4 Bb4 D5:3 Eb5 | C5:4 Bb4:2 G4:2 | -:2 Ab4 C5 Eb5:3 F5 | D5:4 C5:2 Bb4:2 | -:2 Bb4 D5 F5:3 G5 | E5:4 D5:2 Bb4:2 | C5:2 Eb5:2 Ab5:3 G5 | F5:6 -:2', { dal: 1 }],
    ],
  },
  {
    nome: 'la nevicata', stile: 'piano', forte: 1.4, bpm: 64, passo: 0.5, giri: 2, eco: [1, 0.32, 0.14], riv: 0.5,
    tracce: [
      // mi minore: la sinistra che sale e scende a crome, la destra poche note in alto; al secondo giro gli archi
      ['piano', 0.4, 0.15, '-:4 G5:2 F#5:2 | E5:4 B4:4 | -:4 D5:2 F#5:2 | E5:6 -:2 | -:4 G5:2 B5:2 | C6:4 B5:2 G5:2 | A5:4 G5:2 E5:2 | F#5:8'],
      ['piano', 0.12, -0.2, arpeggio('E2 B2 G3 B3 F#4 | C3 G3 B3 E4 G4 | G2 D3 B3 D4 F#4 | F#2 D3 A3 D4 E4 | E2 B2 G3 B3 F#4 | C3 G3 B3 E4 G4 | A2 E3 G3 C4 E4 | B2 F#3 A3 E4 F#4', '0 1 2 3 4 3 2 1')],
      ['archi', 0.04, 0, tenuti('G3 B3 D4 | G3 B3 E4 | G3 B3 D4 | F#3 A3 D4 | G3 B3 D4 | G3 B3 E4 | G3 C4 E4 | F#3 A3 E4', 8), { dal: 1 }],
    ],
  },
]

// ── gli strumenti: ognuno suona la nota f (Hz) all'istante t per d secondi, forte v, dentro out ──
const RUMORI = new WeakMap()
const bianco = (c) => {
  let b = RUMORI.get(c)
  if (!b) { b = c.createBuffer(1, c.sampleRate, c.sampleRate); const x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; RUMORI.set(c, b) }
  return b
}
/** Il volume della nota: su in `a`, poi verso `sus` con la costante `dec` (0: resta), via in `r` dopo d. → [il nodo, quando tace] */
function inviluppo(c, out, t, d, v, { a = 0.005, dec = 0, sus = 1, r = 0.08 } = {}) {
  const g = c.createGain(), p = g.gain
  d = Math.max(d, a)
  p.setValueAtTime(0, t); p.linearRampToValueAtTime(v, t + a)
  if (dec) p.setTargetAtTime(v * sus, t + a, dec)
  p.setTargetAtTime(0, t + d, r)
  g.connect(out)
  return [g, t + d + r * 7]
}
/** Un parziale: l'oscillatore (tipo, f) con la sua ampiezza `a`, che si spegne con la costante `dec` (0: resta). */
function parziale(c, g, t, fine, tipo, f, a = 1, dec = 0, det = 0) {
  const o = c.createOscillator(), k = c.createGain()
  o.type = tipo; o.frequency.value = f; o.detune.value = det
  k.gain.setValueAtTime(a, t)
  if (dec) k.gain.setTargetAtTime(0, t, dec)
  o.connect(k).connect(g); o.start(t); o.stop(fine)
  o.onended = () => k.disconnect()
  return o
}
/** Finita la nota (l'oscillatore o finito), via i suoi nodi dal banco: se no, attaccati all'uscita, restano per sempre. */
const chiudi = (o, ...nodi) => o.addEventListener('ended', () => { for (const x of nodi) x.disconnect() })
/** Un soffio di rumore filtrato (il fiato, il martelletto, i colpi della batteria). */
function soffio(c, out, t, v, { f = 3000, q = 1, tipo = 'bandpass', a = 0.001, dec = 0.02 } = {}) {
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain()
  s.buffer = bianco(c); fl.type = tipo; fl.frequency.value = f; fl.Q.value = q
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setTargetAtTime(0, t + a, dec)
  s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + a + dec * 8)
  s.onended = () => g.disconnect()
}
/** I fiati (l'ocarina, il flauto): l'attacco che scivola in su, il vibrato che arriva dopo, lo sbuffo e un filo d'aria. */
function fiato(c, out, t, f, d, v, { parziali, sbuffo, aria, vib, a }) {
  const [g, fine] = inviluppo(c, out, t, d, v, { a, r: 0.09 })
  const lfo = c.createOscillator(), prof = c.createGain()
  lfo.frequency.value = vib[0]
  prof.gain.setValueAtTime(0, t); prof.gain.setValueAtTime(0, t + 0.2); prof.gain.linearRampToValueAtTime(vib[1], t + 0.55)
  lfo.connect(prof); lfo.start(t); lfo.stop(fine)
  for (const [tipo, m, k] of parziali) {
    const o = parziale(c, g, t, fine, tipo, f * m, k)
    o.detune.setValueAtTime(-30, t); o.detune.linearRampToValueAtTime(0, t + 0.06)
    prof.connect(o.detune)
  }
  lfo.onended = () => { prof.disconnect(); g.disconnect() }
  soffio(c, out, t, v * sbuffo, { f: Math.min(5000, f * 2.5), q: 1.4, a: 0.004, dec: 0.025 })
  if (aria) soffio(c, g, t, aria, { f: f * 3, q: 0.8, a: 0.05, dec: d })
}
const STRUMENTI = {
  ocarina: (c, out, t, f, d, v) => fiato(c, out, t, f, d, v, { parziali: [['sine', 1, 1], ['sine', 2, 0.06], ['sine', 3, 0.025]], sbuffo: 0.22, aria: 0.04, vib: [5.2, 14], a: 0.035 }),
  flauto: (c, out, t, f, d, v) => fiato(c, out, t, f, d, v, { parziali: [['sine', 1, 0.75], ['triangle', 1, 0.35], ['sine', 2, 0.08]], sbuffo: 0.3, aria: 0.07, vib: [4.8, 18], a: 0.05 }),
  // l'arpa: pizzicata, suona finché si spegne da sé
  arpa(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d + 1.6, v, { a: 0.003, r: 0.35 })
    const dec = 0.75 * (220 / f) ** 0.25
    chiudi(parziale(c, g, t, fine, 'sine', f, 1, dec), g); parziale(c, g, t, fine, 'sine', f * 2, 0.3, dec * 0.4); parziale(c, g, t, fine, 'sine', f * 3, 0.1, dec * 0.2); parziale(c, g, t, fine, 'sine', f * 4, 0.05, dec * 0.1)
    parziale(c, g, t, fine, 'triangle', f, 0.3, 0.04)
  },
  // la marimba: il legno (il quarto parziale, che dura poco) e il colpo della mazzuola
  marimba(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d + 0.5, v, { a: 0.002, r: 0.2 })
    chiudi(parziale(c, g, t, fine, 'sine', f, 1, 0.28 * (330 / f) ** 0.3), g); parziale(c, g, t, fine, 'sine', f * 4, 0.28, 0.035); parziale(c, g, t, fine, 'sine', f * 10, 0.05, 0.008)
    soffio(c, out, t, v * 0.12, { f: 2500, q: 0.8, dec: 0.006 })
  },
  // il piano elettrico: una modulante sulla portante (FM) che si chiude subito, il campanello della lamella
  ep(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d, v, { a: 0.002, r: 0.22 })
    const o = parziale(c, g, t, fine, 'sine', f, 1, 1.4), m = c.createOscillator(), idx = c.createGain()
    m.frequency.value = f; idx.gain.setValueAtTime(f * 1.8, t); idx.gain.setTargetAtTime(f * 0.25, t, 0.12)
    m.connect(idx).connect(o.frequency); m.start(t); m.stop(fine)
    chiudi(m, idx, g)
    parziale(c, g, t, fine, 'sine', f * 7, 0.05, 0.03)
  },
  // il contrabbasso pizzicato: il triangolo che si chiude in un filtro, e il fondamentale tondo
  basso(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d, v, { a: 0.006, dec: 0.3, sus: 0.3, r: 0.07 })
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'; lp.Q.value = 0.8; lp.frequency.setValueAtTime(1300, t); lp.frequency.setTargetAtTime(380, t, 0.12)
    lp.connect(g)
    chiudi(parziale(c, lp, t, fine, 'triangle', f, 1), lp, g); parziale(c, g, t, fine, 'sine', f, 0.55)
  },
  // il piano: i parziali che si spengono prima quanto più sono in alto, un secondo coro appena stonato, il martelletto;
  // col pedale, suona oltre la nota
  piano(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d + 1, v, { a: 0.003, r: 0.6 })
    const dec = 1.5 * (220 / f) ** 0.4
    chiudi(parziale(c, g, t, fine, 'sine', f, 0.7, dec), g); parziale(c, g, t, fine, 'sine', f, 0.3, dec, 4)
    parziale(c, g, t, fine, 'sine', f * 2, 0.4, dec * 0.45); parziale(c, g, t, fine, 'sine', f * 3, 0.16, dec * 0.3); parziale(c, g, t, fine, 'sine', f * 4, 0.08, dec * 0.2)
    parziale(c, g, t, fine, 'sine', f * 5, 0.04, dec * 0.12); parziale(c, g, t, fine, 'sine', f * 6, 0.025, dec * 0.08)
    soffio(c, out, t, v * 0.06, { f: 3200, q: 0.7, tipo: 'lowpass', dec: 0.012 })
  },
  // gli archi: due seghe un poco stonate fra loro, nel filtro, che entrano e escono piano
  archi(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d, v, { a: 0.5, r: 0.7 })
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.3; lp.connect(g)
    parziale(c, lp, t, fine, 'sawtooth', f, 1, 0, -8); chiudi(parziale(c, lp, t, fine, 'sawtooth', f, 1, 0, 8), lp, g)
  },
  // i campanelli: il tono e i due parziali stonati delle lamine, che si spengono presto
  campanelli(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, d + 1.2, v, { a: 0.001, r: 0.5 })
    chiudi(parziale(c, g, t, fine, 'sine', f, 1, 0.7), g); parziale(c, g, t, fine, 'sine', f * 2.76, 0.25, 0.07); parziale(c, g, t, fine, 'sine', f * 5.4, 0.1, 0.025)
  },
  // la batteria (f non conta)
  cassa(c, out, t, f, d, v) {
    const [g, fine] = inviluppo(c, out, t, 0.01, v, { a: 0.002, r: 0.09 }), o = parziale(c, g, t, fine, 'sine', 120)
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.12)
    chiudi(o, g)
  },
  bordo(c, out, t, f, d, v) { soffio(c, out, t, v * 4, { f: 1800, q: 3, dec: 0.022 }); const [g, fine] = inviluppo(c, out, t, 0.002, v * 0.5, { a: 0.001, r: 0.012 }); chiudi(parziale(c, g, t, fine, 'triangle', 880), g) },
  piatto: (c, out, t, f, d, v) => soffio(c, out, t, v * 3, { f: 7500, q: 0.7, tipo: 'highpass', dec: 0.02 }),
  spazzola: (c, out, t, f, d, v) => soffio(c, out, t, v, { f: 4000, q: 0.6, a: 0.018, dec: 0.06 }),
}
const SECCHI = new Set(['cassa', 'bordo', 'piatto', 'spazzola'])

// ── un brano messo in fila: [secondi dall'inizio del giro, strumento, Hz (o null), durata, volume, traccia, dal giro] ──
const FILE = new Map()
function inFila(b) {
  if (FILE.has(b)) return FILE.get(b)
  const s = (60 / b.bpm) * b.passo, sw = b.swing ?? 0, ora = (p) => p * s + (p % 2 === 1 ? sw * s : 0)
  const tracce = b.tracce.map(([str, vol, lato, testo, o = {}]) => ({ str, vol: vol * (b.forte ?? 1), lato, ...leggi(testo), dal: o.dal ?? 0, per: 2 ** (o.ottava ?? 0) }))
  const passi = Math.max(...tracce.map((x) => x.passi)), ev = []
  tracce.forEach((x, i) => {
    for (let da = 0; da < passi; da += x.passi) for (const [p, k, n] of x.note) {
      if (da + p >= passi) continue
      const t = ora(da + p), d = ora(da + p + k) - t
      if (Array.isArray(n)) for (const f of n) ev.push([t, x.str, f * x.per, d, x.vol / Math.sqrt(n.length), i, x.dal])
      else ev.push([t, x.str, null, d, x.vol * n, i, x.dal])
    }
  })
  ev.sort((a, b) => a[0] - b[0])
  const f = { ev, T: passi * s, tracce }
  FILE.set(b, f)
  return f
}

/** Quanto dura il brano i, tutti i suoi giri (per ascolta.mjs). */
export const durata = (i) => inFila(BRANI[i]).T * BRANI[i].giri

// il riverbero: un rumore stereo che si spegne in `sec` secondi e perde gli acuti mentre si spegne
const RIVERBERI = new WeakMap()
function riverbero(c, sec = 2.6) {
  let b = RIVERBERI.get(c)
  if (b) return b
  const n = Math.round(sec * c.sampleRate)
  b = c.createBuffer(2, n, c.sampleRate)
  for (let k = 0; k < 2; k++) {
    const x = b.getChannelData(k)
    let y = 0
    for (let i = 0; i < n; i++) { const u = i / n, a = 0.15 + 0.8 * u; y = y * a + (Math.random() * 2 - 1) * (1 - a); x[i] = y * Math.exp(-5.5 * u) * (i < 0.004 * c.sampleRate ? i / (0.004 * c.sampleRate) : 1) }
  }
  RIVERBERI.set(c, b)
  return b
}

// quanto forte, sopra il volume (0,3, il 30% di Alberto): misurato con ascolta.mjs musica
const FORTE = 0.9
const PAUSA = 7 // i secondi di strada sola fra un brano e l'altro

/**
 * La musica nel contesto c: parte dal brano `brano` (a `pos` secondi), muta finché non le si dà un volume.
 * `vivo`: si programma da sola (un timer, 1,5 s avanti); se no (OfflineAudioContext) si chiama programma(fino).
 * `solo`: suona solo quella traccia (le prove di ascolta.mjs, per pesare le voci).
 * → { c, volume(v, tau), abbassa(sec), dove(), programma(fino), ferma() }
 */
export function avvia(c, { brano = Math.floor(Math.random() * BRANI.length), pos = 0, vivo = true, uscita = c.destination, solo = null } = {}) {
  // il banco: le tracce nel bus; il bus secco, nell'eco (il ritardo con dentro il filtro che gli toglie gli acuti a ogni
  // ritorno) e nel riverbero; poi il filo d'acuti in meno, il limitatore, quello che la abbassa per le sigle e il volume
  const g = (v) => { const x = c.createGain(); x.gain.value = v; return x }
  const bus = g(1), mEco = g(0), mRiv = g(0), ritardo = c.createDelay(2), ritorno = g(0), lpEco = c.createBiquadFilter()
  const conv = c.createConvolver(), lp = c.createBiquadFilter(), lim = c.createDynamicsCompressor(), sotto = g(1), vol = g(0)
  lpEco.type = 'lowpass'; lpEco.frequency.value = 2600
  conv.buffer = riverbero(c)
  lp.type = 'lowpass'; lp.frequency.value = 11000; lp.Q.value = 0.5
  for (const [k, v] of Object.entries({ threshold: -10, knee: 6, ratio: 8, attack: 0.004, release: 0.25 })) lim[k].value = v
  bus.connect(lp)
  bus.connect(mEco).connect(ritardo).connect(lpEco).connect(lp); lpEco.connect(ritorno).connect(ritardo)
  bus.connect(mRiv).connect(conv).connect(lp)
  lp.connect(lim).connect(sotto).connect(vol).connect(uscita)

  let n = brano, b = null, k = 0, inizio = 0, giro = 0, lati = [], attesa = 0
  const parti = (i, p = 0) => {
    n = i % BRANI.length
    const B = BRANI[n], spb = 60 / B.bpm
    b = { ...inFila(B), B }
    const vecchi = lati
    setTimeout(() => { for (const x of vecchi) x.disconnect() }, 12000)
    lati = b.tracce.map((x) => { const q = c.createStereoPanner(); q.pan.value = x.lato; q.connect(bus); return q })
    ritardo.delayTime.setValueAtTime(Math.min(2, B.eco[0] * spb), c.currentTime)
    ritorno.gain.setValueAtTime(B.eco[1], c.currentTime); mEco.gain.setValueAtTime(B.eco[2], c.currentTime); mRiv.gain.setValueAtTime(B.riv, c.currentTime)
    // (p: i secondi dall'inizio del brano; a p, adesso: dentro il giro g, a r secondi)
    let g0 = Math.floor(p / b.T), r = p - g0 * b.T
    if (g0 >= B.giri) { g0 = 0; r = 0 }
    inizio = Math.max(c.currentTime + 0.1, attesa) - g0 * b.T - r
    giro = g0; k = b.ev.findIndex((e) => e[0] >= r)
    if (k < 0) { k = 0; giro++ }
  }
  const programma = (fino) => {
    for (let quante = 0; quante < 1000; quante++) {
      if (!b) { if (attesa > fino) return; parti(n + 1) }
      if (giro >= b.B.giri) { attesa = inizio + giro * b.T + PAUSA; b = null; continue }
      const e = b.ev[k], t = inizio + giro * b.T + e[0]
      if (t > fino) return
      if (giro >= e[6] && t > c.currentTime - 0.03 && (solo === null || solo === e[5])) {
        const colpo = SECCHI.has(e[1]), u = Math.max(t, c.currentTime) + (colpo ? 0 : (Math.random() - 0.5) * 0.008)
        STRUMENTI[e[1]](c, lati[e[5]], u, e[2], e[3] * (colpo ? 1 : 0.94), e[4] * (0.9 + Math.random() * 0.2))
      }
      if (++k >= b.ev.length) { k = 0; giro++ }
    }
  }
  parti(brano, pos)

  const timer = vivo ? setInterval(() => { if (c.state === 'running') programma(c.currentTime + 1.5) }, 250) : 0
  return {
    c,
    /** il volume (0–1; 0,3 il solito), sfumando con la costante tau */
    volume(v, tau = 0.4) { vol.gain.setTargetAtTime(v * FORTE, c.currentTime, tau) },
    /** più piano per `sec` secondi (una sigla che suona sopra) */
    abbassa(sec = 1.5) { const t = c.currentTime; sotto.gain.cancelScheduledValues(t); sotto.gain.setTargetAtTime(0.3, t, 0.05); sotto.gain.setTargetAtTime(1, t + sec, 0.6) },
    /** dove è arrivata (per riprendere da lì nella pagina dopo): { brano, pos } */
    dove: () => (b ? { brano: n, pos: Math.max(0, c.currentTime - inizio) } : { brano: (n + 1) % BRANI.length, pos: 0 }),
    programma,
    ferma() { clearInterval(timer); vol.gain.setTargetAtTime(0, c.currentTime, 0.1); setTimeout(() => vol.disconnect(), 800) },
  }
}
