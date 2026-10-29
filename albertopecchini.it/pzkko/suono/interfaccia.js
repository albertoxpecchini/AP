// I suoni dell'interfaccia di pzkko.it (26.10, Alberto: «crea i suoni dove non ci sono: ogni app ha la sua musichetta, ogni
// tasto ha un suonino»). Come la strada (suono.js), tutto sintetizzato dal vivo, niente file: chiptune a onde quadre,
// triangoli e rumore.
// - musichetta(nome): una sigla di un secondo o due per ogni app del cercapersone (telefono/telefono.js, vai), per
//   l'accensione dello schermo, lo spegnimento a tubo catodico e il ritorno alla home; il wallet e i
//   cinque giochi grandi la suonano da soli quando la loro finestra si apre (qui sotto, chi guarda i dialog). Una sigla
//   nuova sfuma quella di prima.
// - Ogni tasto ha il suo suonino, col materiale di dove sta (qui sotto, chi ascolta i clic): il bip a 8 bit nel
//   cercapersone (più basso per indietro e chiudi, più alto per le schede), lo scatto meccanico dei tasti gialli del
//   wallet, il clic di plastica del wallet e del cercapersone sul muro, il colpetto sul panno dei giochi, un tic morbido
//   altrove; i cursori ticchettano mentre scorrono. I pezzi di carta della barra frusciano (barra/barra.js, fruscio). I
//   volantini no: li suona già la strada.
// - La musica (26.10, musica.js: «voglio le musichette»): sei brani che si alternano, coi suoni accesi, in ogni pagina, al
//   30% (window.pzkkoSuono.musica, che la regia cambia); le sigle la abbassano un momento, e cambiando pagina riprende
//   da dov'era (qui sotto, chi la guarda). Mentre suona, i link del sito aprono le pagine nella cornice (cornice.js): la
//   pagina in cui si è entrati resta, e la musica non si ferma; dentro la cornice le pagine non ne fanno partire un'altra.
// Nella home (e nella storia e nella 404) c'è il motore della strada: si usa il suo contesto (window.pzkkoSuono.ctx) e si
// tace se il nastro «suono» è spento. Nelle pagine senza la strada (gadget, oggetti, traguardi, info, le prove) un contesto
// suo, che nasce al primo gesto, e suona solo se nel browser i suoni sono stati accesi (pzkko-suono = si: dal 29.10 di
// partenza sono spenti, Alberto: «impostazioni predefinite audio off»; prima suonava se non erano stati spenti).

import { avviaCornice, fuori, vai } from './cornice.js'
export { vai }

const AC = window.AudioContext ?? window.webkitAudioContext
let proprio = null, out = null, outCtx = null, bus = null
const spentoQui = () => { try { return localStorage.getItem('pzkko-suono') !== 'si' } catch { return true } }

/** Il contesto audio, o null se non si deve suonare. `gesto`: siamo dentro un clic (si può far nascere il contesto). */
function contesto(gesto = false) {
  if (document.hidden || !AC) return null
  const P = window.pzkkoSuono
  let c
  if (P) { if (!P.acceso || !P.ctx) return null; c = P.ctx }
  else {
    if (spentoQui()) return null
    if (!proprio) { if (!gesto) return null; proprio = new AC({ latencyHint: 'interactive' }); try { if (navigator.audioSession) navigator.audioSession.type = 'ambient' } catch {} }
    c = proprio
  }
  if (c.state !== 'running') c.resume().catch(() => {})
  if (outCtx !== c) { out = c.createGain(); out.connect(c.destination); outCtx = c; bus = out }
  out.gain.value = 0.25 // (fisso: il volume di window.pzkkoSuono è quello della strada, dal 26.10 al 20%)
  return c
}

// ── gli strumenti ──
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const freq = (n) => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); return 440 * 2 ** ((NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12 - 69) / 12) }
/** Una nota: onda, inviluppo veloce in su e coda esponenziale; `fino` fa scivolare l'altezza. */
function tono(c, t, f, d, { onda = 'square', vol = 0.16, a = 0.004, fino = null } = {}) {
  const o = c.createOscillator(), g = c.createGain()
  o.type = onda
  o.frequency.setValueAtTime(f, t)
  if (fino) o.frequency.exponentialRampToValueAtTime(fino, t + d)
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  o.connect(g).connect(bus); o.start(t); o.stop(t + d + 0.03)
}
let bianco = null
/** Un soffio di rumore filtrato (la carta, gli scatti, lo sfrigolio). */
function rumore(c, t, d, { f = 3000, q = 1, vol = 0.2, tipo = 'bandpass' } = {}) {
  if (!bianco || bianco.sampleRate !== c.sampleRate) { bianco = c.createBuffer(1, c.sampleRate, c.sampleRate); const x = bianco.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1 }
  const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain()
  s.buffer = bianco; fl.type = tipo; fl.frequency.value = f; fl.Q.value = q
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d)
  s.connect(fl).connect(g).connect(bus); s.start(t, Math.random() * 0.8); s.stop(t + d + 0.03)
}
/** Una melodia scritta come «C5 E5 G5:2 - C6+E6:3»: le note, i tempi (× passo), le pause, gli accordi. → quanto dura. */
function melodia(c, t0, testo, { passo = 0.09, onda = 'square', vol = 0.12 } = {}) {
  let t = t0
  for (const pezzo of testo.trim().split(/\s+/)) {
    const [n, k = '1'] = pezzo.split(':'), d = passo * Number(k)
    if (n !== '-') { const acc = n.split('+'); for (const x of acc) tono(c, t, freq(x), d * 0.92, { onda, vol: vol / Math.sqrt(acc.length) }) }
    t += d
  }
  return t - t0
}
// un caso col seme: le sigle «a caso» (i bit, i dadi) sono sempre le stesse
const seme = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }

// ── le sigle ──
const MUSICHE = {
  // il cercapersone
  accendi: (c, t) => { melodia(c, t, 'C5 E5 G5 C6 E6:3', { passo: 0.07 }); melodia(c, t, 'C3:3 G3:3', { passo: 0.07, onda: 'triangle', vol: 0.16 }) },
  spegni: (c, t) => { tono(c, t, 1100, 0.42, { fino: 55, vol: 0.12 }); rumore(c, t + 0.05, 0.3, { f: 600, q: 0.7, vol: 0.05 }) },
  home: (c, t) => melodia(c, t, 'E6 C6', { passo: 0.05, vol: 0.07 }),
  chat: (c, t) => melodia(c, t, 'E6 - E6 G6:2', { passo: 0.06, vol: 0.1 }),
  profilo: (c, t) => melodia(c, t, 'C5 E5 G5 B5 D6:3', { passo: 0.07, onda: 'triangle', vol: 0.18 }),
  account: (c, t) => { rumore(c, t, 0.04, { f: 2500, q: 4, vol: 0.2 }); melodia(c, t + 0.06, 'G4 G4 - D5 G5:3', { passo: 0.07 }) },
  negozio: (c, t) => { tono(c, t, freq('B5'), 0.07, { vol: 0.12 }); tono(c, t + 0.07, freq('E6'), 0.4, { vol: 0.12 }); tono(c, t + 0.07, freq('E6') * 2, 0.25, { onda: 'sine', vol: 0.05 }) },
  sfide: (c, t) => melodia(c, t, 'G4 C5 E5 G5:2 E5 G5:4', { passo: 0.075 }),
  quiz: (c, t) => melodia(c, t, 'C5 D5 E5 - G5:2 F#5:3', { passo: 0.08, onda: 'triangle', vol: 0.18 }),
  missioni: (c, t) => { melodia(c, t, 'D5 A4 D5 F5 A5:2 G5 A5:4', { passo: 0.08, onda: 'triangle', vol: 0.18 }); melodia(c, t, 'D3:4 F3:4', { passo: 0.08, onda: 'triangle', vol: 0.12 }) },
  giocatori: (c, t) => melodia(c, t, 'C5 G4 C5 E5 G5:2 E5 G5:3', { passo: 0.07 }),
  zaino: (c, t) => { rumore(c, t, 0.12, { f: 1400, q: 0.6, vol: 0.07 }); melodia(c, t + 0.05, 'C4 G4 E4 C5:3', { passo: 0.08, onda: 'triangle', vol: 0.2 }) },
  miniera: (c, t) => { for (const k of [0, 0.12, 0.24]) { tono(c, t + k, 2300, 0.05, { onda: 'square', vol: 0.06 }); rumore(c, t + k, 0.03, { f: 5000, q: 2, vol: 0.12 }) } melodia(c, t + 0.4, 'E5 G5 C6:3', { passo: 0.07 }) },
  foto: (c, t) => { rumore(c, t, 0.05, { f: 4000, q: 1.5, vol: 0.3 }); rumore(c, t + 0.06, 0.04, { f: 2500, q: 1.5, vol: 0.2 }); tono(c, t + 0.12, 3200, 0.12, { onda: 'sine', vol: 0.06 }) },
  virtual: (c, t) => melodia(c, t, 'E5 E5 E5 - C5 E5 G5:3', { passo: 0.075 }),
  banca: (c, t) => MUSICHE.wallet(c, t),
  conversioni: (c, t) => { const bit = '101100111010'; [...bit].forEach((b, i) => tono(c, t + i * 0.045, b === '1' ? 1600 : 1100, 0.035, { vol: 0.07 })); tono(c, t + bit.length * 0.045 + 0.03, freq('C6'), 0.18, { onda: 'triangle', vol: 0.15 }) },
  calcolatrice: (c, t) => { melodia(c, t, 'C6 E6 G6', { passo: 0.06, onda: 'sine', vol: 0.12 }); tono(c, t + 0.2, freq('C7'), 0.25, { onda: 'sine', vol: 0.09 }) },
  compilatore: (c, t) => { const r = seme(7); let k = 0; for (let i = 0; i < 9; i++) { rumore(c, t + k, 0.02, { f: 3800, q: 3, vol: 0.18 }); k += 0.04 + r() * 0.05 } melodia(c, t + k + 0.05, 'A5 E6:3', { passo: 0.07, onda: 'square', vol: 0.09 }) },
  cucina: (c, t) => { rumore(c, t, 0.5, { f: 6000, q: 0.5, vol: 0.05, tipo: 'highpass' }); tono(c, t + 0.2, freq('A6'), 0.9, { onda: 'sine', vol: 0.1 }); tono(c, t + 0.2, freq('E7'), 0.6, { onda: 'sine', vol: 0.05 }) },
  // il wallet e i giochi grandi (si aprono: chi guarda i dialog, qui sotto)
  wallet: (c, t) => { for (let i = 0; i < 5; i++) { tono(c, t + i * 0.06, freq('B5') * (1 + i * 0.06), 0.05, { vol: 0.08 }); tono(c, t + i * 0.06 + 0.05, freq('E6') * (1 + i * 0.06), 0.2, { vol: 0.07 }) } },
  roulette: (c, t) => { let k = 0, g = 0.03; for (let i = 0; i < 12; i++) { rumore(c, t + k, 0.02, { f: 4200, q: 4, vol: 0.14 }); k += g; g *= 1.18 } melodia(c, t + k + 0.05, 'G5 C6:3', { passo: 0.08, onda: 'triangle', vol: 0.16 }) },
  blackjack: (c, t) => { for (const k of [0, 0.09, 0.18]) rumore(c, t + k, 0.07, { f: 2200, q: 0.8, vol: 0.12 }); melodia(c, t + 0.32, 'A4 C#5 E5:3', { passo: 0.08, onda: 'triangle', vol: 0.18 }) },
  mine: (c, t) => melodia(c, t, 'C3 Eb3 - C3 Gb3:3', { passo: 0.11, onda: 'triangle', vol: 0.22 }),
  dado: (c, t) => { const r = seme(3); let k = 0; for (let i = 0; i < 7; i++) { rumore(c, t + k, 0.03, { f: 1800 + r() * 1500, q: 3, vol: 0.16 }); k += 0.035 + r() * 0.04 } melodia(c, t + k + 0.06, 'D5 F#5 A5:3', { passo: 0.07 }) },
  moneta: (c, t) => { tono(c, t, 1500, 0.6, { onda: 'sine', fino: 2400, vol: 0.08 }); melodia(c, t + 0.55, 'E5 A5:3', { passo: 0.08, onda: 'triangle', vol: 0.16 }) },
  'virtual-gioco': (c, t) => MUSICHE.virtual(c, t),
}

let sigla = null // il bus della sigla che sta suonando (le sue note ci passano tutte: sfumarla le spegne)
/** Suona la sigla `nome` (sfuma quella che stava suonando). */
export function musichetta(nome, gesto = false) {
  const c = contesto(gesto), m = MUSICHE[nome]
  if (!c || !m) return
  if (sigla?.context === c) { const s = sigla; s.gain.setTargetAtTime(0, c.currentTime, 0.03); setTimeout(() => s.disconnect(), 400) }
  sigla = bus = c.createGain()
  sigla.connect(out)
  musica?.abbassa(1.4); fuori?.abbassa(1.4)
  try { m(c, c.currentTime + 0.02) } finally { bus = out }
}

// ── la musica: suona se si sente (la home col nastro acceso, le altre pagine col loro contesto e i suoni non spenti) e la
// pagina si vede; il resto lo fa musica.js, che si scarica la prima volta che serve ──
let musica = null, scarica = null, alto = -1
const ricordata = () => { try { return JSON.parse(sessionStorage.getItem('pzkko-musica')) ?? {} } catch { return {} } }
function guardaMusica() {
  if (fuori) return // (nella cornice di un'altra pagina: la musica è la sua)
  const P = window.pzkkoSuono
  const c = document.hidden || spentoQui() ? null : P ? (P.acceso ? P.ctx : null) : proprio
  const v = c?.state === 'running' ? P?.musica ?? 0.3 : 0
  if (c && musica?.c !== c && v) {
    scarica ??= import('./musica.js').then((m) => { musica?.ferma(); musica = m.avvia(c, ricordata()); alto = -1 }).catch(() => {}).finally(() => { scarica = null })
    return
  }
  if (musica && v !== alto) { musica.volume(v, v ? 1.2 : 0.15); alto = v }
}

// ── i suonini dei tasti ──
const TASTI = {
  pager: (c, t) => tono(c, t, 1320, 0.035, { vol: 0.06 }),
  pagerGiu: (c, t) => tono(c, t, 760, 0.045, { vol: 0.06 }),
  scheda: (c, t) => tono(c, t, 1980, 0.03, { vol: 0.05 }),
  carta: (c, t) => { rumore(c, t, 0.08, { f: 2600, q: 0.8, vol: 0.22 }); rumore(c, t + 0.035, 0.05, { f: 5200, q: 1, vol: 0.12 }) },
  meccanico: (c, t) => { rumore(c, t, 0.03, { f: 1800, q: 2, vol: 0.3 }); tono(c, t, 140, 0.07, { onda: 'sine', vol: 0.2 }) },
  plastica: (c, t) => { rumore(c, t, 0.025, { f: 3500, q: 3, vol: 0.24 }); tono(c, t, 620, 0.03, { onda: 'sine', vol: 0.06 }) },
  tavolo: (c, t) => { tono(c, t, 520, 0.045, { onda: 'triangle', vol: 0.1 }); rumore(c, t, 0.02, { f: 1200, q: 1, vol: 0.12 }) },
  morbido: (c, t) => tono(c, t, 1000, 0.03, { onda: 'sine', vol: 0.07 }),
  cursore: (c, t) => tono(c, t, 2200, 0.012, { vol: 0.025 }),
}
/** Il suonino di un tasto (`tipo` fra quelli di TASTI). */
export function tasto(tipo, gesto = true) {
  const c = contesto(gesto)
  if (c) TASTI[tipo]?.(c, c.currentTime + 0.005)
}
/** Il fruscio dei pezzi di carta della barra (barra/barra.js: il link aspetta un attimo, così il fruscio si sente). */
export const fruscio = () => tasto('carta')

function tipoDi(el) {
  if (el.closest('.tel')) {
    if (el.matches('[data-t="indietro"], [data-t="chiudi"], .t-indietro')) return 'pagerGiu'
    if (el.matches('[role="tab"], .t-gi-tab button, .t-za-filtri button')) return 'scheda'
    return 'pager'
  }
  if (el.closest('dialog.wallet')) return 'meccanico'
  if (el.matches('.wallet-tasto, .chat-tasto')) return 'plastica'
  if (el.closest('.rl, .bj, .mn, .dd, .mo, .vi')) return 'tavolo'
  return 'morbido'
}
if (!window.pzkkoTasti) {
  window.pzkkoTasti = true
  document.addEventListener('click', (e) => {
    const el = e.target.closest?.('button, a[href], [role="tab"], [role="button"], summary, select, input[type="checkbox"], input[type="radio"]')
    if (!el || el.matches('[aria-disabled="true"]') || el.closest('[data-suono-no], .suono, .barra')) return
    if (el.closest('.parete') && !el.closest('.vivo')) return // i volantini li suona la strada (il tocco del foglio)
    tasto(tipoDi(el))
  }, true)
  // i cursori (il cambio, i fader): un tic ogni tanto mentre scorrono
  let ultimoTic = 0
  document.addEventListener('input', (e) => {
    if (e.target?.type !== 'range' || performance.now() - ultimoTic < 55) return
    ultimoTic = performance.now()
    tasto('cursore')
  }, true)
  // le sigle del wallet e dei giochi, quando la loro finestra si apre
  const FINESTRE = { wallet: 'wallet', rl: 'roulette', bj: 'blackjack', mn: 'mine', dd: 'dado', mo: 'moneta', vi: 'virtual-gioco' }
  new MutationObserver((cambi) => {
    for (const x of cambi) {
      const d = x.target
      if (d.tagName !== 'DIALOG' || !d.open || x.oldValue !== null) continue
      const k = [...d.classList].find((c) => FINESTRE[c])
      if (k) musichetta(FINESTRE[k])
    }
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'], attributeOldValue: true })
  // la musica: guardata un paio di volte al secondo. Nelle pagine senza la strada il contesto nasce al primo gesto (non
  // solo al primo tasto) e dorme a pagina nascosta; andando via, il brano e il punto restano per la pagina dopo
  setInterval(guardaMusica, 400)
  avviaCornice({ suona: () => !!musica && alto > 0, abbassa: (s) => musica?.abbassa(s) })
  for (const g of ['pointerdown', 'keydown']) addEventListener(g, () => { if (!window.pzkkoSuono) contesto(true) }, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => { if (proprio) (document.hidden ? proprio.suspend() : proprio.resume()).catch(() => {}) })
  addEventListener('pagehide', () => { if (musica) try { sessionStorage.setItem('pzkko-musica', JSON.stringify(musica.dove())) } catch {} })
}
