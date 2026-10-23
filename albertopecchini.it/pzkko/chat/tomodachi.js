// Il tomodachi del cercapersone (22.10 notte): sullo schermo lcd del tasto della chat (index.html, .chat-tasto) vive una
// chiocciolina a pixel, 32 × 16 come un Tamagotchi. Non è un'animazione in loop: ogni due secondi guarda il mondo e decide
// cosa fare. Le variabili che conosce:
//   l'ora di Mantova (dorme di notte, ginnastica alle 7, caffè alle 8, pranzo a mezzogiorno, tv la sera, la domenica si rilassa)
//   il meteo vero (api/meteo: pioggia → ombrello, neve → sciarpa e fiocchi, caldo → suda, freddo → trema, vento, sole e luna)
//   i $pzk (games/pzk.js: a secco piange con un cartello, ricco mette gli occhiali d'oro; ogni vincita festeggia, ogni
//   perdita grossa si rattrista), la borsa (api/borsa: se il $pzk scende guarda il grafico preoccupata)
//   lo zaino (zaino.js: il giornaliero da riscuotere → chiama con la busta; il caffè → corre; la lattina → le ali;
//   la mortadella → mangia; una morte → stecchita per un minuto; il livello → la stella)
//   la chat aperta (parla con te), il mouse sul tasto (ti guarda), il clic (cuore), la pagina nascosta (si ferma),
//   da quanto non ci vedevamo (dopo un giorno ti aspettava), i compleanni e le feste (18.10 Matti, 31.10, 25.12, 1.1)
// Tutto disegnato a pixel (niente immagini, niente emoji), in verde lcd. avvia(tasto) lo accende.
// Il cercapersone grande (telefono/) ne mostra una copia viva e la comanda con due modalità forzate:
//   attendi(true/false): finché è vera la chiocciolina aspetta a sinistra (colonne 3–14), girata verso destra, con la
//   freccina che indica il tasto ACCEDI in basso a destra; sbatte gli occhi ogni tanto. Vince su tutto tranne il saluto.
//   saluta(ms = 2600): per ms ti saluta, ferma al centro (colonne 8–21): l'antenna davanti fa ciao su e giù, «CIAO» in
//   alto e il cuoricino che batte. Vince su tutto, anche sull'attesa e su «parla»; poi torna il cervello normale.

import * as pzk from '../games/pzk.js'
import * as zaino from './zaino.js'

const COL = 32, RIG = 16 // i pixel dello schermo
const SCURO = '#1c2616', CHIARO = 'rgba(28,38,22,.08)'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const CHIAVE = 'pzkko-tomodachi'

let tasto = null, c = null, g = null, timer = 0, tick = 0
let stato = 'fermo', da = 0, fino = 0, verso = 1, x = 9 // x: la colonna del piede sinistro
let meteo = null, meteoT = 0, borsa = null, borsaT = 0
let saldoPrima = null, evento = null, eventoFino = 0, mortiPrima = -1
let sopra = false, cuori = [], gocce = []
let attesa = false, salutoFino = 0, salutoT = 0 // le modalità forzate dal cercapersone grande (attendi, saluta)
let mem = leggiMem()

function leggiMem() { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') } catch { return {} } }
function scriviMem() { try { localStorage.setItem(CHIAVE, JSON.stringify(mem)) } catch {} }

// ── il mondo ──
const oraMantova = () => {
  const ms = window.pzkkoOrologio?.adesso?.() ?? Date.now()
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', weekday: 'short', day: 'numeric', month: 'numeric', hour12: false }).formatToParts(new Date(ms))
  const v = (t) => p.find((q) => q.type === t)?.value
  return { h: Number(v('hour')) % 24 + Number(v('minute')) / 60, dom: v('weekday') === 'Sun', g: Number(v('day')), m: Number(v('month')) }
}
async function aggiornaMondo() {
  const now = Date.now()
  // il meteo vero solo se chi guarda l'ha scelto in regia (window.pzkkoScelte.meteo, dal 23.10: di partenza sempre sole)
  const vero = !window.pzkkoScelte || window.pzkkoScelte.meteo === 'vero'
  if (!vero) meteo = null
  else if (now - meteoT > 10 * 60_000) { meteoT = now; try { meteo = await (await fetch('/api/meteo')).json() } catch {} }
  if (now - borsaT > 5 * 60_000) { borsaT = now; try { const d = await (await fetch('/api/borsa?da=24h')).json(); if (d.ok) borsa = d } catch {} }
}
const piove = () => meteo && (meteo.pioggia > 0 || (meteo.codice >= 51 && meteo.codice <= 67) || (meteo.codice >= 80 && meteo.codice <= 82) || meteo.codice >= 95)
const nevica = () => meteo && (meteo.neve > 0 || (meteo.codice >= 71 && meteo.codice <= 77) || meteo.codice === 85 || meteo.codice === 86)
const sereno = () => meteo && meteo.codice <= 1
const festa = ({ g, m }) => (g === 18 && m === 10 ? 'festa' : g === 31 && m === 10 ? 'zucca' : g === 25 && m === 12 ? 'natale' : g === 1 && m === 1 ? 'fuochi' : null)

/** Il cervello: guarda tutto e sceglie lo stato (con la sua durata). */
function decidi() {
  const t = Date.now(), ora = oraMantova(), chatAperta = !!document.querySelector('.tel[open]') // il telefono aperto: parla con te
  const saldo = pzk.saldo()
  // gli eventi: cambi di saldo e morti
  if (saldoPrima !== null && saldo !== saldoPrima) {
    const d = saldo - saldoPrima
    if (d >= 50) { evento = 'festa'; eventoFino = t + 8000 } else if (d <= -200) { evento = 'triste'; eventoFino = t + 8000 }
  }
  saldoPrima = saldo
  const morti = zaino.stat('morti')
  if (mortiPrima >= 0 && morti > mortiPrima) { evento = 'morto'; eventoFino = t + 60_000 }
  mortiPrima = morti
  if (mem.visto && t - mem.visto > 24 * 3600_000 && !mem.salutato) { evento = 'aspettavo'; eventoFino = t + 12_000; mem.salutato = true }
  mem.visto = t; scriviMem()
  // le modalità forzate dal cercapersone grande: il saluto prima di tutto, poi l'attesa del tasto ACCEDI (gli eventi
  // qui sopra si contano lo stesso, e se sono ancora freschi si vedono dopo)
  if (t < salutoFino) return ['saluta', salutoFino - t]
  if (attesa) return ['attende', 2000]
  if (evento && t < eventoFino) return [evento, 2000]
  evento = null
  // chi comanda, in ordine
  if (sopra) return ['guarda', 2000]
  if (chatAperta) return ['parla', 2000]
  const f = festa(ora); if (f && tick % 6 < 3) return [f, 2000]
  if (ora.h >= 23 || ora.h < 7) return ['dorme', 4000]
  if (zaino.effetto('mortadella') && tick % 10 < 4) return ['mangia', 3000]
  if (zaino.effetto('lattina')) return ['vola', 2000]
  if (zaino.manca('giornaliero') === 0 && tick % 8 < 3) return ['chiama', 3000]
  if (piove()) return ['pioggia', 3000]
  if (nevica()) return ['neve', 3000]
  if (saldo < 50 && !zaino.effetto('caffe')) return ['povero', 4000]
  if (ora.h >= 7 && ora.h < 8) return ['ginnastica', 2000]
  if (ora.h >= 8 && ora.h < 9) return ['caffe', 3000]
  if (ora.h >= 12 && ora.h < 14 && tick % 6 < 3) return ['mangia', 3000]
  if (ora.h >= 20 && ora.h < 23 && tick % 6 < 4) return ['tv', 4000]
  if (ora.dom && tick % 6 < 3) return ['sole', 4000]
  if (borsa?.var24 < -0.02 && tick % 7 < 2) return ['borsa', 3000]
  if (saldo >= 10000 && tick % 5 < 2) return ['ricco', 3000]
  if (meteo?.temperatura > 28 && tick % 5 < 2) return ['caldo', 3000]
  if (meteo?.temperatura < 4 && tick % 5 < 2) return ['freddo', 3000]
  if (zaino.effetto('caffe')) return ['corre', 2000]
  return [Math.random() < 0.55 ? 'passeggia' : 'fermo', 2000 + Math.random() * 3000]
}

// ── i pixel ──
// un pixel: acceso (scuro) o spento; spento vuol dire cancellato e ridisegnato chiaro, così la spirale del guscio, la luna a
// falce e gli occhi grandi si vedono davvero (prima il chiaro, trasparente all'8 %, finiva sopra lo scuro e non spegneva
// niente). Le celle vanno da un arrotondamento al successivo: si toccano senza sovrapporsi.
const P = (gx, gy, on = true) => {
  if (gx < 0 || gy < 0 || gx >= COL || gy >= RIG) return
  const x0 = Math.round(gx * cw), y0 = Math.round(gy * ch), w = Math.round((gx + 1) * cw) - x0, h = Math.round((gy + 1) * ch) - y0
  if (!on) g.clearRect(x0, y0, w, h)
  g.fillStyle = on ? SCURO : CHIARO
  g.fillRect(x0, y0, w, h)
}
let cw = 1, ch = 1
const riga = (x0, y0, n) => { for (let i = 0; i < n; i++) P(x0 + i, y0) }
const colonna = (x0, y0, n) => { for (let i = 0; i < n; i++) P(x0, y0 + i) }
const cerchio = (cx, cy, r, on = true) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r * 0.5) P(cx + xx, cy + yy, on) }
// lettere 3 × 5 per le poche scritte (Z, !, $, ?, e CIAO del saluto)
const GLIFI = {
  z: ['111', '001', '010', '100', '111'], '!': ['010', '010', '010', '000', '010'], $: ['010', '111', '110', '011', '111'], '?': ['111', '001', '011', '000', '010'], '♥': ['101', '111', '111', '010', '000'],
  C: ['011', '100', '100', '100', '011'], I: ['111', '010', '010', '010', '111'], A: ['010', '101', '111', '101', '101'], O: ['010', '101', '101', '101', '010'],
  cuore: ['01010', '11111', '11111', '01110', '00100'], // il cuore grande (5 × 5) del saluto, che batte col ♥
}
const glifo = (ch_, x0, y0) => { const G = GLIFI[ch_]; if (!G) return; G.forEach((r, yy) => [...r].forEach((b, xx) => { if (b === '1') P(x0 + xx, y0 + yy) })) }
const scrivi = (s, x0, y0) => [...s].forEach((l, i) => glifo(l, x0 + i * 4, y0)) // lettere 3 × 5 con una colonna di spazio
/** La freccina che indica a destra: la punta in (x0 + 4, y0). */
const freccina = (x0, y0) => { riga(x0, y0, 5); P(x0 + 3, y0 - 1); P(x0 + 2, y0 - 2); P(x0 + 3, y0 + 1); P(x0 + 2, y0 + 2) }

/** La chiocciola: `px` è la colonna del piede davanti, `py` la riga del suolo; `v` 1 la disegna con la testa a sinistra,
 *  -1 specchiata (testa a destra). Con `ciao` (0 o 1, il fotogramma) l'antenna davanti fa ciao. */
function lumaca(px, py, v, { passo = 0, occhi = 'aperti', occhiali = false, lacrima = false, salto = 0, giro = false, ali = false, stella = false, ciao = null } = {}) {
  const X = (dx) => (v > 0 ? px + dx : px - dx)
  const R = (dx, yy, n) => riga(v > 0 ? px + dx : px - dx - n + 1, yy, n) // la riga da dx a dx + n - 1, specchiata anche lei
  const y = py - salto
  if (giro) { // stecchita: sulla schiena, guscio sotto, occhi a x
    R(0, y - 1, 9); cerchio(X(4), y - 3, 2); P(X(4), y - 3, false)
    P(X(9), y - 2); P(X(10), y - 3); P(X(9), y - 4); P(X(11), y - 4); P(X(10), y - 5); P(X(11), y - 2)
    return
  }
  // il corpo: due righe, con l'onda del passo
  R(0, y - 1, 10); R(1 + passo, y - 2, 8)
  P(X(0), y - 2); P(X(-1), y - 1) // la testa sporge
  // il guscio: un cerchio con la spirale
  cerchio(X(6), y - 4, 3); P(X(6), y - 4, false); P(X(7), y - 5, false)
  if (stella) { P(X(6), y - 9); R(5, y - 8, 3); P(X(6), y - 7) }
  if (ali) { for (let i = 0; i < 3; i++) { P(X(8 + i), y - 7 - i); P(X(9 + i), y - 7 - i) } }
  // le antenne con gli occhi (col saluto quella davanti la disegna il ciao, qui sotto)
  const davanti = ciao === null
  colonna(X(1), y - 5, 3); if (davanti) colonna(X(-1), y - 5, 3)
  if (occhi === 'chiusi') { if (davanti) R(-2, y - 6, 2); R(1, y - 6, 2) }
  else if (occhi === 'x') { P(X(-2), y - 7); P(X(0), y - 5); P(X(-2), y - 5); P(X(0), y - 7); P(X(1), y - 7); P(X(2), y - 6) }
  else if (occhi === 'grandi') { cerchio(X(-1), y - 6, 1); cerchio(X(1), y - 6, 1); P(X(-1), y - 6, false); P(X(1), y - 6, false) }
  else { if (davanti) { P(X(-2), y - 6); P(X(-1), y - 6) } P(X(1), y - 6); P(X(2), y - 6); if (occhi === 'su') { if (davanti) P(X(-1), y - 7); P(X(1), y - 7) } }
  if (occhiali) { R(-3, y - 6, 7); R(-2, y - 5, 2); R(1, y - 5, 2) }
  if (lacrima) { P(X(-2), y - 4); P(X(-2), y - 3) }
  // il ciao: l'antenna davanti si allunga dritta in su (1), poi si piega in avanti (0), e così via a ogni passo
  if (ciao === 1) { colonna(X(-1), y - 7, 5); P(X(-1), y - 8); P(X(-2), y - 8) }
  else if (ciao === 0) { colonna(X(-1), y - 4, 2); P(X(-2), y - 5); P(X(-3), y - 6); P(X(-3), y - 7); P(X(-4), y - 7) }
}

function disegna() {
  if (!g || document.hidden) return
  tick++
  const W = c.width, H = c.height
  cw = W / COL; ch = H / RIG
  g.clearRect(0, 0, W, H)
  // la griglia dei pixel spenti, come un lcd vero
  for (let yy = 0; yy < RIG; yy++) for (let xx = 0; xx < COL; xx++) P(xx, yy, false)
  const t = Date.now(), fase = tick % 2, ora = oraMantova()
  const S = stato
  const suolo = S === 'saluta' ? 15 : 14 // nel saluto sta giù, appoggiata al terreno, per lasciare il posto a «CIAO»
  // il cielo: sole o luna in alto a destra, nuvole, pioggia, neve (nell'attesa sempre a destra: la chiocciolina è a sinistra)
  const cieloX = verso > 0 || S === 'attende' ? 27 : 3
  if (S !== 'tv' && S !== 'borsa' && S !== 'saluta') {
    if (ora.h >= 20 || ora.h < 6) { cerchio(cieloX, 3, 2); cerchio(cieloX + 1, 2, 2, false); P(cieloX - 5, 2); P(cieloX - 7, 5); P(cieloX - 3, 7) } // la luna a falce e tre stelle
    else if (sereno() || !meteo) { cerchio(cieloX, 3, 1); P(cieloX, 0); P(cieloX, 6); P(cieloX - 3, 3); P(cieloX + 3, 3) }
    else { riga(cieloX - 3, 3, 6); riga(cieloX - 2, 2, 4); riga(cieloX - 4, 4, 8) }
  }
  if (S === 'pioggia' || S === 'neve') {
    if (gocce.length < 10) gocce.push({ x: Math.random() * COL, y: Math.random() * 8 })
    for (const q of gocce) { q.y += S === 'neve' ? 0.5 : 1.5; if (q.y > suolo) { q.y = 0; q.x = Math.random() * COL } P(Math.floor(q.x), Math.floor(q.y)); if (S === 'pioggia') P(Math.floor(q.x), Math.floor(q.y) - 1) }
  } else gocce = []
  // dove sta: passeggia avanti e indietro
  if (S === 'passeggia' || S === 'corre' || S === 'ginnastica') { x += verso * (S === 'corre' ? 2 : 1); if (x > 20) verso = -1; if (x < 6) verso = 1 }
  const opz = { passo: fase }
  let salto = 0, extra = null, qx = null, qv = null // qx, qv: dove sta e da che parte guarda, se lo stato lo impone
  const f1 = RIDOTTO.matches ? 1 : fase // con meno animazioni l'attesa e il saluto restano sul fotogramma che si capisce
  switch (S) {
    case 'attende': qx = 12; qv = -1; opz.passo = 0; opz.occhi = !RIDOTTO.matches && tick % 7 === 0 ? 'chiusi' : 'aperti'; extra = () => freccina(15 + f1, 12); break
    case 'saluta': qx = 17; qv = -1; opz.passo = 0; opz.ciao = f1; extra = () => { scrivi('CIAO', 5, 1); if (f1) glifo('cuore', 22, 1); else glifo('♥', 23, 2) }; break
    case 'dorme': opz.occhi = 'chiusi'; opz.passo = 0; extra = () => { glifo('z', x + 10 + (tick % 3), 4 - (tick % 3)); if (tick % 2) glifo('z', x + 13, 1) }; break
    case 'fermo': opz.occhi = tick % 9 === 0 ? 'chiusi' : 'aperti'; opz.passo = 0; break
    case 'guarda': opz.occhi = 'grandi'; opz.passo = 0; break
    case 'parla': opz.occhi = fase ? 'su' : 'aperti'; opz.passo = 0; extra = () => { riga(x + 12, 6, 5); colonna(x + 11, 7, 3); colonna(x + 17, 7, 3); riga(x + 12, 10, 5); P(x + 11, 11); if (fase) { P(x + 13, 8); P(x + 15, 8) } else riga(x + 13, 8, 3) }; break
    case 'festa': salto = fase ? 2 : 0; opz.occhi = 'su'; extra = () => { if (cuori.length < 3 && tick % 2) cuori.push({ x: x - 2 + Math.random() * 10, y: 6 }); for (const h of cuori) { h.y -= 0.6; glifo('♥', Math.round(h.x), Math.round(h.y)) } cuori = cuori.filter((h) => h.y > -4) }; break
    case 'triste': opz.lacrima = true; opz.passo = 0; break
    case 'morto': opz.giro = true; break
    case 'aspettavo': opz.occhi = 'grandi'; salto = fase; extra = () => { glifo('!', x + 11, 2); glifo('♥', x + 15, 3) }; break
    case 'chiama': salto = fase; extra = () => { riga(22, 2, 7); riga(22, 6, 7); colonna(22, 2, 5); colonna(28, 2, 5); P(24, 3); P(25, 4); P(26, 3); glifo('!', x + 11, 1) }; break
    case 'mangia': opz.passo = 0; extra = () => { cerchio(x - 4, 12, 1 + (fase ? 0 : 0.6)); P(x - 4, 12, false); if (fase) P(x - 2, 10) }; break
    case 'vola': salto = 3 + fase; opz.ali = true; break
    case 'pioggia': opz.passo = 0; extra = () => { riga(x - 4, 3, 11); riga(x - 3, 2, 9); riga(x - 2, 1, 7); colonna(x + 2, 4, 5); P(x + 3, 8) }; break
    case 'neve': opz.passo = 0; extra = () => { riga(x - 2, 9, 5); P(x + 2, 10); P(x + 2, 11) }; break
    case 'povero': opz.lacrima = true; opz.passo = 0; extra = () => { colonna(x + 13, 6, 8); riga(x + 11, 3, 7); riga(x + 11, 7, 7); colonna(x + 11, 3, 5); colonna(x + 17, 3, 5); glifo('$', x + 13, 4); if (fase) glifo('?', x + 20, 2) }; break
    case 'ginnastica': salto = fase ? 2 : 0; opz.occhi = 'su'; break
    case 'caffe': opz.passo = 0; extra = () => { riga(x + 12, 9, 4); riga(x + 12, 10, 4); riga(x + 12, 11, 4); riga(x + 11, 12, 6); P(x + 16, 10); if (fase) { P(x + 13, 7); P(x + 14, 6) } else { P(x + 14, 7); P(x + 13, 6) } }; break
    case 'tv': opz.passo = 0; opz.occhi = 'grandi'; extra = () => { for (let yy = 2; yy < 10; yy++) riga(22, yy, 8); for (let yy = 3; yy < 9; yy++) for (let xx = 23; xx < 29; xx++) if ((xx + yy + tick) % 3 === 0) P(xx, yy, false); colonna(25, 10, 2); riga(24, 12, 4) }; break
    case 'sole': opz.occhiali = true; opz.passo = 0; extra = () => { riga(x - 3, 15, 16) }; break
    case 'borsa': opz.occhi = 'grandi'; opz.passo = 0; extra = () => { for (let i = 0; i < 8; i++) P(20 + i, 3 + i); riga(19, 11, 10); colonna(19, 2, 10) }; break
    case 'ricco': opz.occhiali = true; opz.passo = fase; extra = () => { glifo('$', x + 12, 2 + (fase ? 1 : 0)); glifo('$', x + 16, 4 - (fase ? 1 : 0)) }; break
    case 'caldo': opz.passo = 0; extra = () => { P(x - 3, 8 + fase); P(x + 2, 7 + fase); riga(x + 12, 4, 1); riga(x + 13, 3 + fase, 2) }; break
    case 'freddo': opz.passo = 0; x += fase ? 0.4 : -0.4; extra = () => { riga(x - 2, 9, 5); riga(x + 1, 10, 2); P(x + 1, 11) }; break
    case 'corre': salto = fase; opz.occhi = 'su'; extra = () => { riga(x - (verso > 0 ? 4 : -12), 12, 3); riga(x - (verso > 0 ? 3 : -11), 13, 2) }; break
    case 'festa_': break
    case 'zucca': opz.passo = 0; extra = () => { cerchio(x + 14, 10, 3); P(x + 14, 6); P(x + 13, 9, false); P(x + 15, 9, false); riga(x + 13, 11, 3); P(x + 13, 11, false) }; break
    case 'natale': opz.passo = 0; extra = () => { riga(x - 3, 8, 7); riga(x - 2, 7, 5); riga(x - 1, 6, 3); P(x, 5); P(x + 1, 4); P(x + 2, 3) }; break
    case 'fuochi': salto = fase ? 2 : 0; opz.occhi = 'su'; extra = () => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + tick; P(Math.round(24 + Math.cos(a) * (2 + (tick % 3))), Math.round(5 + Math.sin(a) * (2 + (tick % 3)))) } }; break
  }
  if (zaino.livello() >= 10) opz.stella = true
  lumaca(qx ?? Math.round(x), suolo, qv ?? verso, { ...opz, salto })
  extra?.()
  // il terreno
  for (let xx = 0; xx < COL; xx += 2) P(xx + (tick % 2), 15)
  // la busta in alto a destra quando c'è il premio da riscuotere (il led rosso del tasto lampeggia lo stesso)
  if (tasto.classList.contains('msg') && tick % 2 && S !== 'chiama' && S !== 'tv' && S !== 'borsa' && S !== 'saluta') { riga(25, 0, 6); riga(25, 3, 6); colonna(25, 0, 4); colonna(30, 0, 4); P(27, 1); P(28, 1) }
}

/** Un passo del cervello e un disegno; `forza` disegna anche con meno animazioni (per attendi e saluta). */
function passo(forza = false) {
  if (RIDOTTO.matches && tick > 1 && !forza) return
  const t = Date.now()
  if (t >= fino) { const [s, d] = decidi(); if (s !== stato) { stato = s; da = t } fino = t + d; cuori = [] }
  disegna()
}

/** L'attesa del tasto ACCEDI del cercapersone grande: con true la chiocciolina aspetta a sinistra e indica il tasto in basso a
 *  destra, finché non arriva false (allora torna il cervello normale). Il saluto, se c'è, passa davanti. */
export function attendi(si) {
  attesa = !!si; fino = 0
  if (g) passo(true)
}

/** Il saluto: per `ms` la chiocciolina ti saluta con l'antenna, «CIAO» e il cuoricino, davanti a tutto il resto; poi torna
 *  normale. Ridisegna subito. */
export function saluta(ms = 2600) {
  salutoFino = Date.now() + ms; fino = 0
  if (g) passo(true)
  clearTimeout(salutoT)
  if (RIDOTTO.matches) salutoT = setTimeout(() => { fino = 0; if (g) passo(true) }, ms + 50) // con meno animazioni nessuno ridisegnerebbe la fine
}

/** Accende il tomodachi sullo schermo lcd del tasto. */
export function avvia(b) {
  if (tasto) return
  tasto = b
  const lcd = tasto.querySelector('.ct-lcd')
  if (!lcd) return
  lcd.innerHTML = ''
  c = document.createElement('canvas')
  const r = lcd.getBoundingClientRect(), dpr = Math.min(3, devicePixelRatio || 1)
  c.width = Math.max(64, Math.round((r.width || 62) * dpr)); c.height = Math.max(32, Math.round((r.height || 29) * dpr))
  lcd.appendChild(c)
  g = c.getContext('2d')
  saldoPrima = pzk.saldo(); mortiPrima = zaino.stat('morti')
  tasto.addEventListener('pointerenter', () => { sopra = true; fino = 0 })
  tasto.addEventListener('pointerleave', () => { sopra = false; fino = 0 })
  tasto.addEventListener('click', () => { mem.carezze = (mem.carezze ?? 0) + 1; scriviMem(); evento = 'festa'; eventoFino = Date.now() + 3000; fino = 0 })
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { fino = 0; passo() } })
  aggiornaMondo()
  setInterval(aggiornaMondo, 60_000)
  passo()
  timer = setInterval(passo, 500)
}
