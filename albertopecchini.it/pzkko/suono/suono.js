// I suoni della strada di pzkko.it. Tutto sintetizzato dal vivo (voci.js), niente file: si sente quello che c'è nella
// scena, da dove sta la telecamera, all'ora di Mantova.
// - Sempre: la città lontana (più forte nelle ore di punta, più piano la domenica e di notte; quando l'asfalto è bagnato
//   sibila), il condizionatore lassù, le onde del traffico delle altre strade, il motorino che passa in un'altra via, un
//   clacson, la tapparella di qualcuno al palazzo di fronte (su al mattino, giù la sera).
// - Le campane, oltre i tetti: le ore dalle 7 alle 22, un colpo alla mezza, a mezzogiorno il concerto e al tramonto
//   l'Ave Maria (quando si accende l'insegna).
// - Gli uccelli, secondo l'ora e la stagione: i passeri (di più all'alba e al tramonto), la tortora, i piccioni, la
//   cornacchia; i rondoni da fine aprile ad agosto, il merlo all'alba e al tramonto in primavera; di notte la civetta e
//   l'allocco (d'autunno di più); le sere d'estate i grilli, al ritmo della temperatura vera (Dolbear), e nei pomeriggi
//   caldi le cicale. Con la pioggia, la neve o la nebbia stanno zitti.
// - L'insegna: il trasformatore che ronza e il gas che sfrigola, con lo sfarfallio della pagina (a ogni salto, una
//   scintilla: l'accensione al tramonto crepita).
// - Le auto della pagina, che si sentono arrivare tre secondi prima dei fari, passano dietro la telecamera col Doppler e
//   se ne vanno (sul bagnato sibilano; col neon sotto, la cassa dei tamarri; ogni tanto i freni); quella ferma della
//   regia, col motore al minimo.
// - Il meteo vero di Mantova: la pioggia (il velo, le gocce sulla lamiera, nelle pozze, il pluviale che si riempie e
//   gorgoglia), il tuono dopo ogni lampo (tanto più tardi quanto è lontano), il vento a raffiche che fa sbattere le doghe,
//   la nebbia e la neve che ovattano tutto; dopo la pioggia gocciola la gronda.
// - La goccia della condensa, quando tocca la soglia; le mosche e la zanzara tigre che ronzano (quella che viene davanti
//   alla telecamera, all'orecchio), le blatte che zampettano sulla pietra (da vicino); dentro il negozio, dietro il vetro,
//   il PC che si accende (bip, floppy, disco), qualcuno che va nel Setup e poi scrive il comando che lo pianta, e da capo.
// - Le mani: il foglio che si alza fruscia, il tagliando si strappa, il pomodoro del caricamento fa splat; dal 22.10 un
//   foglio toccato schiocca col suo materiale (la carta, la carta lucida, il cartoncino, lo scontrino, l'asse di legno,
//   il cartello di lamiera), la saracinesca nuda si bussa (più secca in basso, più ballerina in alto), le cose della
//   scena (scena/tocchi.js) suonano col loro strumento e dal loro posto: il campanello che trilla dentro il negozio
//   finché lo si tiene, il vetro, il maniglione, il lucchettone, la lattina, la carta bagnata, i grissini, le
//   pozzanghere, il chiusino; e la petizione: il foglio che si stacca e torna, le penne, il cappuccio, la biro che scrive.
// Il browser lascia partire l'audio solo dopo un gesto: lo accende index.html (il nastro «suono» in basso a sinistra,
// window.pzkkoSuono) e passa qui il contesto già sbloccato. Gli eventi della pagina e della scena (la goccia, l'auto, il
// lampo, lo strappo, lo scoppio) arrivano con window.pzkkoSuono.evento; quelli arrivati prima del motore aspettano in coda.
import { strumenti, caso, scegli } from './voci.js'

const root = document.documentElement
// le luci della sera: index.html le tiene in window.pzkkoPagina.luci (col 3D non scrive più le variabili CSS)
const luce = (k, d = 0) => {
  const l = window.pzkkoPagina?.luci
  const v = l && k in l ? Number(l[k]) : parseFloat(root.style.getPropertyValue('--' + k))
  return Number.isFinite(v) ? v : d
}
const limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const liscia = (x) => { x = limita(x); return x * x * (3 - 2 * x) }
// l'ora di Mantova (come la regia), il mese, se è domenica
const ROMA = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', month: 'numeric', day: 'numeric', hourCycle: 'h23' })
const mantova = (ms) => {
  const p = {}
  for (const x of ROMA.formatToParts(new Date(ms))) p[x.type] = x.value
  return { ora: (+p.hour % 24) + +p.minute / 60 + +p.second / 3600, mese: +p.month, giorno: +p.day, domenica: p.weekday === 'Sun' }
}
// il traffico ora per ora (1 = le ore di punta) e la temperatura media di Mantova mese per mese, se il meteo non c'è
const TRAFFICO = [0.12, 0.08, 0.06, 0.06, 0.1, 0.25, 0.5, 0.9, 1, 0.85, 0.75, 0.8, 0.85, 0.65, 0.7, 0.8, 0.85, 0.95, 1, 0.9, 0.65, 0.5, 0.35, 0.2]
const CLIMA = [2.5, 4.5, 9, 13.5, 18.5, 22.5, 25, 24.5, 20, 14, 8, 3.5]
// il PC del negozio (scena/negozio.js): cosa fa in ogni fase, in secondi dall'inizio della fase
const PC = {
  nero: [[0, 'spegni'], [0.7, 'accendi']],
  post: [[0.35, 'bip'], [1, 'floppy'], [2.35, 'disco', 0.8]],
  errore: [[1.4, 'tasto']],
  setup: [[0.28, 'frecce', 9, 0.28], [2.62, 'tasto'], [2.75, 'invio']],
  plymouth: [[0.1, 'disco', 3.3]],
  desktop: [[0.25, 'accesso'], [0.1, 'disco', 2.8], [1.55, 'scrive', 8, 0.6], [2.15, 'invio'], [3.3, 'scrive', 35, 2.2], [5.6, 'invio']],
}

export function accendi(c) {
  const P = window.pzkkoSuono, S = () => window.pzkkoScena, pagina = () => window.pzkkoPagina
  const V = strumenti(c), { filtro, guadagno, fila } = V
  const telefono = matchMedia('(max-width:899px)').matches, W = telefono ? 0.95 : 2.048

  // ── il banco: tutto passa dall'ovatta (la nebbia e la neve si mangiano gli acuti), dal compressore (i tuoni) e dal
  // volume; l'eco della strada si prende una parte di ogni suono, di più quelli lontani ──
  const uscita = guadagno(0), comp = c.createDynamicsCompressor(), ovatta = filtro('lowpass', 18000, 0.5)
  for (const [k, v] of Object.entries({ threshold: -14, knee: 10, ratio: 4, attack: 0.008, release: 0.3 })) comp[k].value = v
  fila(ovatta, comp, uscita, c.destination)
  const mix = guadagno(1), mandata = guadagno(1)
  mix.connect(ovatta)
  fila(mandata, V.eco(), guadagno(0.55), ovatta)

  // ── chi ascolta: la telecamera della scena, in metri come lei (scena/mondo.js: la saracinesca va da x = 0 a W, il
  // marciapiede è y = 0, la strada sta dietro la telecamera). Senza 3D gli stessi posti, con la parete del DOM ──
  const L = { x: W / 2, y: 1.5, z: 2.6 }
  const parete = document.querySelector('.parete'), base = { y: 0, w: 1, h: 1 }
  const rileggi = () => {
    if (!parete || root.classList.contains('scena3d')) return
    const r = parete.getBoundingClientRect()
    base.y = r.top + scrollY; base.w = r.width || 1; base.h = r.height || 1
  }
  rileggi()
  addEventListener('resize', rileggi)
  const altezza = () => S()?.M?.H ?? base.h / (base.w / W)
  const ascolta = () => {
    const cam = S()?.camera
    if (cam) { L.x = cam.position.x; L.y = cam.position.y; L.z = cam.position.z; return }
    const h = altezza()
    L.x = W / 2; L.y = limita(h - (scrollY + innerHeight / 2 - base.y) / (base.w / W), 0.4, h + 0.6); L.z = 2.6
  }
  const posti = () => {
    const s = S(), ins = s?.h?.insegna, h = altezza()
    return {
      daScena: !!s, h,
      insegna: ins ? [ins.x0 + ins.LARG / 2, (ins.y0 + ins.top) / 2, 0.3] : [W / 2, h + 0.45, 0.25],
      split: [W * 0.8, h + 3.2, 0.4], pluviale: [-0.5, 0.2, 0.15],
      strada: s?.h?.strada ? s.h.strada.z0 + 1.9 : 4.4, pc: s?.h?.negozio?.dove ?? null,
    }
  }
  let dove = posti()
  const meteo = () => {
    const m = S()?.meteo
    return m ? { pioggia: m.pioggia, neve: m.neve, nebbia: m.nebbia, bagnato: m.bagnato, vento: Math.hypot(m.vento.x, m.vento.y), dati: m.dati } : { pioggia: 0, neve: 0, nebbia: 0, bagnato: 0.4, vento: 0.3, dati: null }
  }

  // ── i punti da cui vengono i suoni: la distanza (il volume, e l'aria che si mangia gli acuti), il lato, l'eco ──
  const punto = ({ eco = 0.15, vetro = false } = {}) => {
    const v = { ing: guadagno(1), g: guadagno(0), f: filtro('lowpass', vetro ? 3000 : 18000), p: c.createStereoPanner(), vetro, ultimo: null }
    v.e = guadagno(eco)
    fila(v.ing, v.g, v.f, v.p, mix); fila(v.ing, v.e, mandata)
    return v
  }
  // mette il punto in (x, y, z): ref = la distanza a cui vale 1; subito per quelli appena nati, se no morbido. Dà la distanza
  const metti = (v, x, y, z, { ref = 1, ruolo = 1, max = 1.5, subito = false } = {}) => {
    const dx = x - L.x, d = Math.max(0.05, Math.hypot(dx, y - L.y, z - L.z))
    const g = Math.min(max, (ref / d) ** ruolo), pan = limita(dx / (d + 0.4), -0.92, 0.92), lp = (v.vetro ? 3000 : 18000) / (1 + d / 30)
    if (subito) { v.g.gain.value = g; v.p.pan.value = pan; v.f.frequency.value = lp; return d }
    const u = v.ultimo
    if (u && Math.abs(u[0] - g) <= 0.003 * g + 1e-5 && Math.abs(u[1] - pan) < 0.01) return d
    v.ultimo = [g, pan]
    const t = c.currentTime
    v.g.gain.setTargetAtTime(g, t, 0.05); v.p.pan.setTargetAtTime(pan, t, 0.05); v.f.frequency.setTargetAtTime(lp, t, 0.1)
    return d
  }
  // un punto usa e getta, per una cosa che suona una volta sola lì: dopo vita secondi si stacca (se no ogni uccello, ogni
  // goccia lascerebbe i suoi nodi attaccati al banco, per tutta la visita)
  const stacca = (nodi, vita) => setTimeout(() => { for (const n of nodi) n.disconnect() }, vita * 1000)
  const da = (x, y, z, opz = {}) => { const v = punto(opz); metti(v, x, y, z, { ...opz, subito: true }); stacca([v.p, v.e], opz.vita ?? 30); return v.ing }
  // uno lontano, oltre i palazzi (il motorino, i clacson, le campane): niente acuti, tanta eco
  const lontano = (lato = 0, { eco = 0.7, lp = 2200, a = 1, vita = 30 } = {}) => {
    const g = guadagno(a), p = c.createStereoPanner(), e = guadagno(eco)
    p.pan.value = lato; fila(g, filtro('lowpass', lp), p, mix); fila(g, e, mandata)
    if (vita) stacca([p, e], vita)
    return g
  }
  // le mani: dal lato del puntatore
  let px = 0.5
  addEventListener('pointermove', (e) => { px = e.clientX / innerWidth }, { passive: true })
  const qui = (a = 1) => { const g = guadagno(a), p = c.createStereoPanner(), e = guadagno(0.06); p.pan.value = limita(px * 1.4 - 0.7, -0.7, 0.7); fila(g, p, mix); fila(g, e, mandata); stacca([p, e], 5); return g }

  // ── quello che c'è sempre: la città lontana (grave) e il suo sibilo quando l'asfalto è bagnato, il condizionatore
  // lassù, il trasformatore dell'insegna ──
  const strato = (buf, dest, { rate = 1 } = {}, ...filtri) => { const g = guadagno(0), s = V.fonte(buf, c.currentTime, { rate }); fila(s, ...filtri, g, dest); return { g: g.gain, s } }
  const citta = strato(V.R.marrone, mix, {}, filtro('lowpass', 320), filtro('highpass', 30)).g
  const sibilo = strato(V.R.rosa, mix, {}, filtro('bandpass', 1300, 0.5)).g
  const vSplit = punto({ eco: 0.1 }), split = V.split(vSplit.ing)
  const vNeon = punto({ eco: 0.05 }), neon = V.ronzio(vNeon.ing)
  split.g.setTargetAtTime(0.12, c.currentTime, 2)

  // ── l'insegna: ronza quando è accesa, sfrigola di più quando un tubo sputa; a ogni salto di luce una scintilla ──
  let fPrima = 1
  const insegna = (t) => {
    const ins = luce('insegna'), f = ins > 0 ? luce('f-insegna', 1) : 0
    neon.ronza.setTargetAtTime(ins > 0 ? 0.06 * (0.55 + 0.45 * f) : 0, t, 0.03)
    neon.sfrigola.setTargetAtTime(ins > 0 ? 0.01 * f + (f > 0.05 && f < 0.85 ? 0.025 : 0) : 0, t, 0.015)
    if (ins > 0 && Math.abs(f - fPrima) > 0.3) V.scintilla(vNeon.ing, t + Math.random() * 0.02)
    fPrima = f
    metti(vNeon, ...dove.insegna, { ref: 1.2 })
  }

  // ── la pioggia: il velo, le gocce sulla lamiera (rade e fitte) e nelle pozze, il pluviale che si riempie e gorgoglia.
  // I tamponi si calcolano la prima volta che piove, uno per volta quando il browser è libero; finita la pioggia e
  // svuotato il pluviale, si spegne tutto ──
  const libero = window.requestIdleCallback ?? ((f) => setTimeout(f, 60))
  const tamponi = {}
  let pioggia = null
  const creaPioggia = () => {
    const p = { fonti: [], pieno: 0, zero: 0 }
    const metti_ = (nome, buf, dest, opz, ...filtri) => { const s = strato(buf, dest, opz, ...filtri); p[nome] = s.g; p.fonti.push(s.s) }
    metti_('velo', V.R.rosa, mix, {}, filtro('highpass', 500), filtro('lowpass', 8000))
    libero(() => { if (pioggia === p) metti_('rada', (tamponi.rada ??= V.lamiera(70, 3.7)), mix) })
    libero(() => { if (pioggia === p) metti_('fitta', (tamponi.fitta ??= V.lamiera(260, 4.3)), mix) })
    libero(() => {
      if (pioggia !== p) return
      const b = (tamponi.pozze ??= V.pozze(90, 4.1))
      metti_('pozze', b, mix)
      p.tubo = punto({ eco: 0.1 })
      metti_('gorgoglia', b, p.tubo.ing, { rate: 0.38 }, filtro('lowpass', 1300))
    })
    return p
  }
  const piove = (m, t, dt) => {
    const k = m.pioggia
    if (k > 0.01 && !pioggia) pioggia = creaPioggia()
    if (!pioggia) return
    const p = pioggia
    p.velo.setTargetAtTime(0.09 * k ** 0.8, t, 0.5)
    p.rada?.setTargetAtTime(0.3 * liscia(k * 3), t, 0.5)
    p.fitta?.setTargetAtTime(0.3 * liscia((k - 0.3) / 0.7), t, 0.5)
    p.pozze?.setTargetAtTime(0.2 * k * m.bagnato, t, 0.5)
    p.pieno += (k - p.pieno) * (1 - Math.exp(-dt / (k > p.pieno ? 20 : 60)))
    if (p.tubo) { p.gorgoglia.setTargetAtTime(0.5 * liscia(p.pieno * 2.5), t, 0.5); metti(p.tubo, ...dove.pluviale, { ref: 0.8 }) }
    if (k < 0.005 && p.pieno < 0.01) { if ((p.zero += dt) > 20) { for (const s of p.fonti) s.stop(); pioggia = null } } else p.zero = 0
  }

  // ── il vento: il rombo a raffiche, il fischio nelle fessure quando è forte, e le doghe che sbattono sulle raffiche ──
  let vento = null
  const tira = (m, t, dt) => {
    const k = limita((m.vento - 0.8) / 4)
    if (k > 0.02 && !vento) {
      const r = strato(V.R.rosa, mix, {}, filtro('lowpass', 420)), bp = filtro('bandpass', 1000, 6), f = strato(V.R.rosa, mix, {}, bp)
      vento = { rombo: r.g, fischio: f.g, bp: bp.frequency, fonti: [r.s, f.s], fasi: [caso(0, 9), caso(0, 9), caso(0, 9)], zero: 0 }
    }
    if (!vento) return
    const fa = vento.fasi, raffica = limita(0.6 + 0.25 * Math.sin(t * 0.13 + fa[0]) + 0.15 * Math.sin(t * 0.37 + fa[1]) + 0.1 * Math.sin(t * 0.91 + fa[2]), 0, 1.2)
    vento.rombo.setTargetAtTime(0.2 * k * raffica, t, 0.3)
    vento.fischio.setTargetAtTime(0.05 * Math.max(0, k - 0.35) * raffica ** 2, t, 0.3)
    vento.bp.setTargetAtTime(800 + 500 * raffica, t, 0.4)
    if (k > 0.3 && raffica > 0.95 && Math.random() < dt * 0.5 * k) V.sbatte(da(W / 2 + caso(-0.6, 0.6), caso(0.3, dove.h - 0.3), 0.02, { ref: 1.2, eco: 0.2 }), t + 0.02, { a: 0.18 * k })
    if (k <= 0.02) { if ((vento.zero += dt) > 10) { for (const s of vento.fonti) s.stop(); vento = null } } else vento.zero = 0
  }

  // ── il tuono: dopo il lampo, tanto più tardi quanto è lontano (343 m al secondo), lo schianto solo se è vicino ──
  const tuoni = lontano(0.15, { eco: 0.6, lp: 12000, vita: 0 })
  const lampo = ({ vicino = caso(0.1, 1) } = {}) => {
    const km = 0.2 + 2.3 * (1 - vicino), s = c.createBufferSource()
    s.buffer = V.tuono(vicino); s.playbackRate.value = caso(0.85, 1.12)
    fila(s, guadagno(0.35 + 0.65 * vicino), tuoni); s.start(c.currentTime + ((km * 1000) / 343) * caso(0.9, 1.1))
  }

  // ── le campane della città, oltre i tetti: la grossa delle ore, una più piccola per la mezza, tre per il concerto ──
  const torre = lontano(-0.35, { eco: 0.9, lp: 2600, a: 0.4, vita: 0 })
  const ORE = 165, MEZZA = 247, CONCERTO = [220, 262, 330]
  if (window.OfflineAudioContext) for (const f of [ORE, MEZZA, ...CONCERTO]) V.campana(f, f === ORE ? 10 : 7)
  let campaneFino = 0
  const ore = (h) => {
    if (!window.OfflineAudioContext) return
    const t = Math.max(c.currentTime + 0.4, campaneFino), n = h % 12 || 12
    for (let i = 0; i < n; i++) V.rintocco(torre, t + i * 2.6, ORE, { a: 0.9, sec: 10 })
    campaneFino = t + n * 2.6 + 3
    if (h === 12) concerto(campaneFino, 40)
  }
  const mezza = () => { if (!window.OfflineAudioContext || c.currentTime < campaneFino) return; V.rintocco(torre, c.currentTime + 0.4, MEZZA, { a: 0.6, sec: 7 }); campaneFino = c.currentTime + 4 }
  // il concerto: le tre campane a slancio, ognuna col suo periodo, che crescono e poi si fermano
  const concerto = (t, dur) => {
    if (!window.OfflineAudioContext) return
    CONCERTO.forEach((f, i) => {
      const per = [1.9, 2.25, 2.6][i] * caso(0.97, 1.03)
      for (let u = t + i * 0.4; u < t + dur; u += per * caso(0.98, 1.02)) V.rintocco(torre, u, f, { a: 0.55 * (0.4 + 0.6 * liscia((u - t) / 5) * liscia((t + dur - u) / 6)), sec: 7 })
    })
    campaneFino = t + dur + 4
  }

  // ── le cose che capitano: gli uccelli sui tetti e sui davanzali di fronte, o sopra la vetrina; la gente nelle altre
  // strade. Ognuna dice quanto dura: finché suona non ne parte un'altra uguale ──
  const difronte = (opz = {}) => da(caso(-5, W + 5), caso(3, 9), caso(10, 15), { ref: 5, eco: 0.35, ...opz })
  const sopra = (opz = {}) => da(caso(-1, W + 1), dove.h + caso(1, 2.5), 0.4, { ref: 2, eco: 0.2, ...opz })
  const stato = { traffico: 0.5 }
  const ripeti = (n, a, b, fa) => { let u = c.currentTime + 0.05; for (let i = 0; i < n; i++) u += fa(u) + caso(a, b); return u - c.currentTime }
  const suona = {
    passeri: () => V.passeri(Math.random() < 0.5 ? sopra() : difronte(), c.currentTime + 0.05),
    tortora: () => V.tortora(difronte({ ref: 7 }), c.currentTime + 0.05),
    piccioni: () => V.piccioni(sopra(), c.currentTime + 0.05),
    cornacchia: () => V.cornacchia(difronte({ ref: 9 }), c.currentTime + 0.05),
    rondoni: () => V.rondoni(lontano(0, { eco: 0.3, lp: 14000, a: 0.8 }), c.currentTime + 0.05),
    merlo: () => { const out = difronte({ ref: 7, vita: 90 }); return ripeti(Math.round(caso(3, 8)), 2, 5, (u) => V.merlo(out, u)) },
    civetta: () => { const out = difronte({ ref: 6, vita: 90 }); return ripeti(Math.round(caso(4, 9)), 3, 7, (u) => V.civetta(out, u)) },
    allocco: () => V.allocco(difronte({ ref: 8 }), c.currentTime + 0.05),
    motorino: () => V.motorino(lontano(0, { eco: 0.5, lp: 2600, a: 0.9 }), c.currentTime + 0.05),
    clacson: () => V.clacson(lontano(caso(-0.7, 0.7), { eco: 0.6, lp: 3000, a: 0.7 }), c.currentTime + 0.05),
    tapparella: () => V.tapparella(difronte({ ref: 5, eco: 0.4 }), c.currentTime + 0.05),
    onda: () => { const d = caso(2, 5); V.soffio(lontano(caso(-0.8, 0.8), { eco: 0.4, lp: 1600 }), c.currentTime, { a: 0.05 * stato.traffico, att: d * 0.45, tau: d * 0.2, tipo: 'rosa', filtri: [filtro('bandpass', caso(450, 900), 0.6)] }); return d },
  }
  const fino = {}
  const capita = (k) => { if ((fino[k] ?? 0) > c.currentTime) return; fino[k] = c.currentTime + (suona[k]() ?? 2) + 0.5 }

  // ── i grilli e le cicale: un tampone che si ripete, rifatto quando la temperatura cambia il ritmo dei grilli ──
  let grilli = null, cicale = null, rifacendo = false
  const insetti = (t, kG, kC, T) => {
    // la legge di Dolbear: un grillo canta 7·T − 30 volte al minuto (T in gradi)
    const periodo = limita(60 / Math.max(20, 7 * T - 30), 0.28, 1.5)
    if (kG > 0.01 && !rifacendo && (!grilli || Math.abs(grilli.periodo / periodo - 1) > 0.12)) {
      const vecchi = grilli
      rifacendo = true
      libero(() => {
        rifacendo = false
        const s = strato(V.grilli(periodo), mix, {}, filtro('highpass', 3000))
        grilli = { ...s, periodo }
        if (vecchi) { vecchi.g.setTargetAtTime(0, c.currentTime, 1.5); vecchi.s.stop(c.currentTime + 8) }
      })
    }
    if (grilli) { grilli.g.setTargetAtTime(0.09 * kG, t, 3); if (kG <= 0.01 && grilli.g.value < 0.001) { grilli.s.stop(); grilli = null } }
    if (kC > 0.01 && !cicale) { cicale = 'arriva'; libero(() => { cicale = strato(V.cicale(), mix, {}) }) }
    if (cicale?.g) { cicale.g.setTargetAtTime(0.05 * kC, t, 4); if (kC <= 0.01 && cicale.g.value < 0.001) { cicale.s.stop(); cicale = null } }
  }

  // ── una volta al secondo: l'ora di Mantova, il fondo della città, le campane, quello che capita ──
  let oraPrima = null, msPrima = 0
  const orario = () => {
    const ms = pagina()?.orologio?.adesso?.() ?? Date.now(), o = mantova(ms), sole = pagina()?.sole?.(ms), m = meteo(), t = c.currentTime
    const alba = sole ? mantova(sole.alba).ora : 7, tramonto = sole ? mantova(sole.tramonto).ora : 18.5
    const T = m.dati?.temperatura ?? CLIMA[o.mese - 1] + 5 * Math.cos(((o.ora - 15) / 24) * Math.PI * 2)
    const h0 = Math.floor(o.ora), u = o.ora - h0
    const tr = stato.traffico = (TRAFFICO[h0] * (1 - u) + TRAFFICO[(h0 + 1) % 24] * u) * (o.domenica ? 0.6 : 1)
    citta.setTargetAtTime(0.11 * (0.25 + 0.75 * tr) * (1 - 0.5 * m.neve) * (1 - 0.25 * m.nebbia), t, 2)
    sibilo.setTargetAtTime(0.03 * tr * m.bagnato * (1 - m.neve), t, 2)
    // le campane: solo se il tempo è passato da sé (la regia che salta di ora non le fa suonare)
    if (oraPrima !== null) {
      const passo = (o.ora - oraPrima + 24) % 24
      if (passo > 0 && passo < 0.25) {
        if (h0 !== Math.floor(oraPrima)) { if (h0 >= 7 && h0 <= 22) ore(h0) }
        else if (oraPrima % 1 < 0.5 && u >= 0.5 && h0 >= 7 && h0 < 22) mezza()
        if (sole && msPrima < sole.tramonto && ms >= sole.tramonto) concerto(Math.max(t + 1, campaneFino), 25)
      }
    }
    oraPrima = o.ora; msPrima = ms
    // gli uccelli: di giorno, di più all'alba e al tramonto; zitti col brutto tempo
    const giorno = o.ora > alba - 0.3 && o.ora < tramonto + 0.4, all = Math.abs(o.ora - (alba + 0.4)) < 1, sera = Math.abs(o.ora - tramonto) < 0.6
    const quiete = 1 - limita(Math.max(m.pioggia * 1.5, m.neve, m.nebbia * 0.6))
    const rondoni = (o.mese === 4 && o.giorno > 20) || (o.mese >= 5 && o.mese <= 7) || (o.mese === 8 && o.giorno < 10)
    const notte = !giorno ? 1 - m.pioggia : 0
    const volte = {
      passeri: giorno ? (all ? 9 : sera ? 7 : 3) * quiete : 0,
      tortora: giorno ? (o.mese >= 3 && o.mese <= 10 ? 1.2 : 0.4) * quiete : 0,
      piccioni: giorno ? 0.8 * quiete : 0,
      cornacchia: giorno ? 0.5 * quiete : 0,
      rondoni: rondoni && (all || (o.ora > tramonto - 2.5 && o.ora < tramonto + 0.3)) ? 2.5 * quiete : 0,
      merlo: o.mese >= 2 && o.mese <= 7 && (all || sera) ? 1.5 * quiete : 0,
      civetta: 0.15 * notte, allocco: (o.mese >= 9 || o.mese <= 2 ? 0.2 : 0.07) * notte,
      motorino: 0.9 * tr * (1 - 0.6 * m.pioggia) * (1 - 0.8 * m.neve),
      clacson: 0.6 * Math.max(0, tr - 0.6),
      tapparella: (o.ora > 6.8 && o.ora < 9) || (o.ora > 19.3 && o.ora < 23.5) ? 0.5 : 0,
      onda: 6 * tr,
    }
    for (const [k, v] of Object.entries(volte)) if (v > 0 && Math.random() < v / 60) capita(k)
    // dopo la pioggia gocciola la gronda, sul marciapiede davanti
    if (m.bagnato > 0.6 && m.pioggia < 0.05 && Math.random() < 0.3) V.gronda(da(caso(0.1, W - 0.1), 0.01, caso(0.3, 0.6), { ref: 0.6, eco: 0.15 }), t + Math.random())
    // i grilli le sere d'estate (fino a metà ottobre), le cicale nei pomeriggi caldi d'estate
    const estate = (o.mese >= 5 && o.mese <= 9) || (o.mese === 10 && o.giorno < 20)
    const kG = estate && (o.ora > tramonto + 0.4 || o.ora < alba - 0.2) && T > 12 ? liscia((T - 12) / 6) * (1 - m.pioggia) * (1 - m.neve) : 0
    const kC = ((o.mese === 6 && o.giorno > 15) || o.mese === 7 || o.mese === 8) && o.ora > 10 && o.ora < 19.5 && T > 23 ? liscia((T - 23) / 4) * (1 - limita(m.pioggia * 3)) : 0
    insetti(t, kG, kC, T)
    if (!root.classList.contains('scena3d')) rileggi()
  }

  // ── le auto: la pagina dice quando ne passa una (index.html, tre secondi prima, così si sente arrivare). Corre lungo la
  // strada dietro la telecamera (da x = −15,5 a 17,5 m, come in scena/luci.js) a velocità costante; se frena, dopo
  // rallenta. Il volume, il lato, l'aria e il Doppler sono curve calcolate qui per tutto il passaggio ──
  const auto = (d) => {
    const ora = c.currentTime, t0 = ora + 0.03 + (d.tra ?? 0) / 1000, dur = d.durata / 1000, verso = d.verso
    const v = 33 / dur, x0 = verso > 0 ? -15.5 : 17.5, zS = dove.strada, PRIMA = 3.2, DOPO = 4.5, frena = d.frena ? dur + 0.25 : Infinity
    const inizio = Math.max(ora + 0.02, t0 - PRIMA), T = t0 + dur + DOPO - inizio
    if (T < 0.5) return
    const n = Math.ceil(T * 40), dop = new Float32Array(n), vol = new Float32Array(n), lato = new Float32Array(n), aria = new Float32Array(n)
    const x = (tau) => x0 + verso * v * (tau < frena ? tau : frena + (tau - frena) * 0.55)
    const r = (tau) => Math.max(0.8, Math.hypot(x(tau) - L.x, 0.5 - L.y, zS - L.z))
    for (let i = 0; i < n; i++) {
      const tau = inizio - t0 + (i / (n - 1)) * T, ri = r(tau)
      dop[i] = 343 / (343 + (r(tau + 0.02) - ri) / 0.02)
      vol[i] = Math.min(1, (2.2 / ri) ** 1.15) * liscia((i / (n - 1)) * T / 1.2) * liscia((dur + DOPO - tau) / 2)
      lato[i] = limita((x(tau) - L.x) / (ri + 0.5), -0.95, 0.95)
      aria[i] = 16000 / (1 + ri / 12)
    }
    const g = guadagno(0), lp = filtro('lowpass', 16000), p = c.createStereoPanner(), ing = guadagno(0.45)
    fila(ing, g, lp, p, mix); fila(g, guadagno(0.18), mandata)
    g.gain.setValueCurveAtTime(vol, inizio, T); lp.frequency.setValueCurveAtTime(aria, inizio, T); p.pan.setValueCurveAtTime(lato, inizio, T)
    V.auto(ing, inizio, T, dop, { bagnato: meteo().bagnato, neon: d.neon })
    stacca([p, g], T + (inizio - ora) + 3)
    if (d.frena && Math.random() < 0.45) V.stridio(ing, t0 + dur + 0.3)
  }
  // quella ferma della regia, col motore al minimo; lasciata andare, riparte
  let ferma = null
  const fermaAuto = () => {
    const x = pagina()?.regola?.ferma ?? null
    if (x !== null && !ferma) { const v = punto({ eco: 0.15 }); ferma = { v, m: V.minimo(v.ing) } }
    if (!ferma) return
    if (x === null) { ferma.m.ferma(c.currentTime); ferma = null; return }
    metti(ferma.v, -10 + 22 * x, 0.4, dove.strada, { ref: 1.6, max: 1 })
  }

  // ── il PC del negozio: suona solo davanti alla porta (a meno di 7 m), dietro il vetro. La fase la dice negozio.js ──
  let pc = null, pcFase = null
  const fa = (cosa, t, n1, n2) => {
    const out = pc.v.ing, ora = c.currentTime, vt = pc.ventola
    if (cosa === 'accendi') { vt.g.setTargetAtTime(0.35, t, 0.5); vt.disco.setTargetAtTime(0.02, t + 2.5, 0.4); V.giri(out, t); V.soffio(out, t, { a: 0.25, tau: 0.012, tipo: 'rosa', filtri: [filtro('lowpass', 600)] }) }
    else if (cosa === 'spegni') { vt.g.setTargetAtTime(0, t, 0.6); vt.disco.setTargetAtTime(0, t, 0.3); V.giri(out, t, { su: false }) }
    else if (cosa === 'bip') V.bip(out, t)
    else if (cosa === 'floppy') V.floppy(out, t)
    else if (cosa === 'disco') { for (let u = Math.max(t, ora); u < t + n1; u += caso(0.04, 0.22)) V.clic(out, u, caso(0.06, 0.16)) }
    else if (cosa === 'tasto') V.tasto(out, t)
    else if (cosa === 'invio') V.tasto(out, t, { a: 0.2, spazio: true })
    else if (cosa === 'frecce') { for (let i = 0; i < n1; i++) if (t + i * n2 > ora) V.tasto(out, t + i * n2, { a: 0.13 }) }
    else if (cosa === 'scrive') { for (let i = 0; i < n1; i++) { const u = t + (i / n1) * n2 + caso(-0.015, 0.015); if (u > ora) V.tasto(out, u, { a: caso(0.1, 0.16), spazio: Math.random() < 0.14 }) } }
    else if (cosa === 'accesso') V.accesso(out, t)
  }
  const negozio = (now) => {
    const n = S()?.h?.negozio, q = dove.pc
    if (!n?.fase || !q) return
    if (Math.hypot(q.x - L.x, q.y - L.y, q.z - L.z) > 7) { if (pc) pc.v.ing.gain.setTargetAtTime(0, c.currentTime, 0.3); pcFase = null; return }
    if (!pc) { const v = punto({ eco: 0.04, vetro: true }); pc = { v, ventola: V.ventola(v.ing) } }
    pc.v.ing.gain.setTargetAtTime(1, c.currentTime, 0.3)
    metti(pc.v, q.x, q.y, q.z, { ref: 1.5 })
    const f = n.fase(now)
    if (f.nome === pcFase) return
    const prima = pcFase, t0 = c.currentTime - f.t / 1000
    pcFase = f.nome
    // (arrivando a metà giro: la ventola com'è in quella fase)
    if (prima === null) { const su = f.nome !== 'nero' || f.t > 700; pc.ventola.g.setTargetAtTime(su ? 0.35 : 0, c.currentTime, 0.2); pc.ventola.disco.setTargetAtTime(su ? 0.02 : 0, c.currentTime, 0.2) }
    for (const [u, cosa, n1, n2] of PC[f.nome] ?? []) {
      if (t0 + u < c.currentTime - 0.02 && !['disco', 'scrive', 'frecce'].includes(cosa)) continue
      fa(cosa, Math.max(t0 + u, c.currentTime + 0.01), n1, n2)
    }
  }

  // ── le bestie della scena: le mosche e le zanzare ronzano mentre volano (più veloci, più acute), le blatte zampettano.
  // Senza 3D le mosche della pagina ──
  const ronza = (zanzara) => {
    const v = punto({ eco: 0.02 }), o = c.createOscillator(), l = c.createOscillator(), a = guadagno(0), f0 = zanzara ? caso(560, 650) : caso(185, 225)
    o.type = 'sawtooth'; o.frequency.value = f0; l.frequency.value = caso(5, 9)
    fila(l, guadagno(f0 * 0.015), o.frequency)
    fila(o, zanzara ? filtro('highpass', 450) : filtro('bandpass', 420, 0.9), a, v.ing)
    o.start(); l.start()
    return { v, o, a: a.gain, f0, px: null, acceso: false, forte: zanzara ? 0.22 : 0.3 }
  }
  const ronzii = { mosche: [], zanzare: [] }, passi = new Map()
  const vola = (r, si, t) => { if (si !== r.acceso) { r.a.setTargetAtTime(si ? r.forte : 0, t, si ? 0.05 : 0.08); r.acceso = si } }
  const bestie = (dt, t) => {
    const B = S()?.b?.dentro
    if (!B) return bestie2d(t)
    for (const tipo of ['mosche', 'zanzare']) B[tipo].forEach((m, i) => {
      const si = m.stato === 'vola' || m.stato === 'atterra' || m.stato === 'posa'
      let r = ronzii[tipo][i]
      if (!r) { if (!si) return; r = ronzii[tipo][i] = ronza(tipo === 'zanzare') }
      vola(r, si, t)
      if (!si) { r.px = null; return }
      const vel = r.px ? Math.hypot(m.x - r.px[0], m.y - r.px[1], m.z - r.px[2]) / dt : 0
      r.px = [m.x, m.y, m.z]
      metti(r.v, m.x, m.y, m.z, tipo === 'zanzare' ? { ref: 0.12, ruolo: 1.3, max: 1.2 } : { ref: 0.3, ruolo: 1.3, max: 1 })
      r.o.frequency.setTargetAtTime(r.f0 * (1 + 0.05 * Math.min(1.5, vel)), t, 0.06)
    })
    for (const b of B.blatte) {
      const p = passi.get(b)
      if (b.stato !== 'gira' && b.stato !== 'scappa') { if (p) p.dove = null; continue }
      const q = p ?? { v: punto({ eco: 0 }), dove: null }
      passi.set(b, q)
      const fatta = q.dove ? Math.hypot(b.x - q.dove[0], b.y - q.dove[1], b.z - q.dove[2]) : 0
      q.dove = [b.x, b.y, b.z]
      if (fatta < 0.002 || metti(q.v, b.x, b.y, b.z, { ref: 0.12, ruolo: 1.4, max: 1 }) > 1.6) continue
      for (let k = 0, n = Math.min(4, Math.round(fatta / 0.008)); k < n; k++) V.soffio(q.v.ing, t + (k / n) * dt, { a: caso(0.05, 0.12), att: 0.0003, tau: 0.0008, filtri: [filtro('highpass', 3500)] })
    }
  }
  const mosche2d = []
  const bestie2d = (t) => {
    const ms = pagina()?.mosche
    if (!ms) return
    ms.forEach((m, i) => {
      const si = m.stato === 'vola'
      let r = mosche2d[i]
      if (!r) { if (!si) return; r = mosche2d[i] = ronza(false) }
      vola(r, si, t)
      if (si) { r.v.g.gain.setTargetAtTime(0.12, t, 0.05); r.v.p.pan.setTargetAtTime(limita((m.x / innerWidth) * 2 - 1, -0.9, 0.9), t, 0.05) }
    })
  }

  // ── le mani ──
  let tFruscio = 0
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse' || !P.acceso) return
    const el = e.target.closest?.('.vol, .man')
    if (!el || el.contains(e.relatedTarget) || performance.now() - tFruscio < 140) return
    tFruscio = performance.now()
    V.fruscio(qui(), c.currentTime + 0.005)
  }, { passive: true })
  // toccare (22.10): col mouse alla pressione, col dito al tocco (il clic: chi scorre la pagina col dito non suona
  // niente). Un foglio schiocca contro la lamiera, col suo materiale (data-suono in index.html: la carta lucida, il
  // cartoncino, lo scontrino, l'asse di legno delle zucche, il cartello di lamiera); la saracinesca nuda si bussa, più
  // secca in basso (la barra chiusa col lucchettone) e più ballerina in alto. Le cose della scena 3D le tocca tocchi.js,
  // che lo scrive sull'evento (pzkkoTocco): la saracinesca che c'è dietro sullo schermo non si bussa anche lei
  let dito = 'mouse'
  const mano = (e) => {
    const el = e.target
    if (!P.acceso || e.pzkkoTocco || !el?.closest?.('.parete') || el.closest('.tagliandi, .penna, #petizione')) return
    px = e.clientX / innerWidth
    const foglio = el.closest('.vol, .man')
    if (foglio) return V.carta(qui(0.9), c.currentTime + 0.003, { tipo: foglio.dataset.suono || (foglio.classList.contains('c-lucido') ? 'lucida' : '') })
    if (el.closest('a, button')) return
    const r = el.closest('.parete').getBoundingClientRect(), m = (limita((r.bottom - e.clientY) / Math.max(1, r.height)) * altezza())
    V.bussa(qui(0.85), c.currentTime + 0.003, { alto: limita(m / 3) })
  }
  document.addEventListener('pointerdown', (e) => { dito = e.pointerType; if (e.pointerType === 'mouse' && e.button === 0) mano(e) }, { passive: true })
  document.addEventListener('click', (e) => { if (dito !== 'mouse') mano(e) })

  // ── le cose della scena che si toccano (tocchi.js): ognuna col suo strumento, dal suo posto nel mondo ──
  const STRUMENTI = { citofono: 'citofono', vetro: 'vetro', telaio: 'telaio', maniglione: 'maniglione', lucchetto: 'lucchetto', portachiavi: 'portachiavi', lattina: 'lattina',
    'carta-bagnata': 'cartaBagnata', banconota: 'cartaBagnata', pacchetto: 'pacchetto', cartone: 'cartone', grissini: 'grissini', pozza: 'pozza', pietra: 'pietra', neve: 'neve', chiusino: 'chiusino', muro: 'muro' }
  const tocco = (d) => { const fa = V[STRUMENTI[d.cosa]]; if (fa) fa(da(d.x, d.y, d.z, { ref: 2.4, eco: 0.14, vita: 4 }), c.currentTime + 0.004) }
  // il campanello: il pulsante scatta sul citofono, e dentro il negozio, dietro il vetro (che si mangia gli acuti), il
  // campanello trilla finché il dito tiene, nella stanza vuota che rimbomba. A volte, poco dopo, il citofono si apre:
  // fruscia, nessuno parla, si chiude
  let squilla = null
  const campanello = (d) => {
    const t = c.currentTime + 0.004
    if (d.premuto) {
      if (squilla) return
      const v = S()?.h?.portaTocchi?.vetro
      const fuori = da(d.x, d.y, d.z, { ref: 2.4, eco: 0.1, vita: 8 }), dentro = da(v ? (v.x0 + v.x1) / 2 : d.x - 0.5, 1.7, -1.4, { ref: 2.4, eco: 0.5, vetro: true, vita: 8 })
      squilla = { s: V.campanello(fuori, dentro, t), t, d }
    } else if (squilla) {
      const q = squilla
      squilla = null
      q.s.lascia(Math.max(t, q.t + 0.25))
      if (Math.random() < 0.35) setTimeout(() => V.risponde(da(q.d.x, q.d.y, q.d.z, { ref: 2.4, eco: 0.1, vita: 6 }), c.currentTime + 0.01), caso(1400, 2600))
    }
  }

  // ── gli eventi della pagina e della scena; le prove della regia ──
  const centro = guadagno(1)
  centro.connect(mix)
  const prove = {
    ...Object.fromEntries(Object.keys(suona).map((k) => [k, () => suona[k]()])),
    campane: () => ore(Math.floor(mantova(pagina()?.orologio?.adesso?.() ?? Date.now()).ora)),
    mezzogiorno: () => concerto(Math.max(c.currentTime + 0.3, campaneFino), 30),
    tuono: () => lampo({ vicino: caso(0.6, 1) }),
    bussa: () => V.bussa(qui(0.85), c.currentTime + 0.01, { alto: Math.random() }),
    // (le cose che si toccano: dalla regia si sentono come in mano)
    campanello: () => { const d = { x: W + 1, y: 1.4, z: 0.05 }; campanello({ ...d, premuto: true }); setTimeout(() => campanello({ ...d, premuto: false }), 1300) },
    ...Object.fromEntries(Object.entries(STRUMENTI).map(([k, v]) => [k, () => V[v](qui(0.9), c.currentTime + 0.01)])),
    cartello: () => V.cartello(qui(0.9), c.currentTime + 0.01),
    legno: () => V.legno(qui(0.9), c.currentTime + 0.01),
    carta: () => V.carta(qui(0.9), c.currentTime + 0.01, { tipo: scegli(['', 'lucida', 'cartoncino', 'scontrino']) }),
    penna: () => V.penna(qui(0.9), c.currentTime + 0.01, { durata: 1.6, n: 12 }),
  }
  const senti = (nome, d = {}) => {
    if (nome === 'auto') auto(d)
    else if (nome === 'goccia') V.goccia(da(d.x ?? (d.u ?? 0.6) * W, d.cima ? dove.h : 0.01, d.z ?? 0.03, { ref: 0.5, eco: 0.12 }), c.currentTime + 0.01, { a: 0.3 })
    else if (nome === 'lampo') lampo(d)
    else if (nome === 'strappo') V.strappo(qui(), c.currentTime + 0.005)
    else if (nome === 'scoppio') V.splat(centro, c.currentTime + Math.max(0, (d.tra ?? 0) / 1000))
    else if (nome === 'tocco') tocco(d)
    else if (nome === 'campanello') campanello(d)
    // la petizione (petizione.js, scena/penne.js): la biro che scrive, le penne che si urtano, il cappuccio, il foglio
    // che si stacca dal muro e torna, il palmo che lo riattacca
    else if (nome === 'penna') V.penna(qui(0.9), c.currentTime + 0.005, d)
    else if (nome === 'penne') V.penne(qui(0.7), c.currentTime + 0.005, d)
    else if (nome === 'tappo') V.tappo(qui(), c.currentTime + 0.005, d)
    else if (nome === 'foglio') V.foglio(qui(), c.currentTime + 0.005, d)
    else if (nome === 'attacca') V.attacca(qui(), c.currentTime + 0.005, d)
    else if (nome === 'prova') prove[d.nome]?.()
  }
  // (quelli arrivati prima del motore: i vecchi si buttano, le auto si suonano da dove sono arrivate)
  const adesso = performance.now()
  for (const [nome, d, quando] of P.coda.splice(0)) {
    const eta = adesso - quando
    if (nome === 'auto') { if (eta < (d.tra ?? 0) + d.durata) senti(nome, { ...d, tra: (d.tra ?? 0) - eta }) }
    else if (eta < 500 || nome === 'prova') senti(nome, d)
  }
  P.evento = senti

  // ── il giro: una trentina di volte al secondo le cose che si muovono, una volta al secondo l'ora ──
  // (i giochi, dalla roulette alla moneta, sono finestre modali: mentre si gioca la strada si sente più piano)
  let modale = () => false
  try { document.querySelector(':modal'); modale = () => !!document.querySelector('dialog:modal') } catch { modale = () => !!document.querySelector('dialog[open]:not(.rg)') }
  let ultimo = performance.now(), lento = 0, avvio = true
  setTimeout(() => { avvio = false }, 5000)
  const giro = (now) => {
    requestAnimationFrame(giro)
    if (now - ultimo < 33) return
    const dt = Math.min(0.2, (now - ultimo) / 1000), t = c.currentTime
    ultimo = now
    uscita.gain.setTargetAtTime(P.acceso ? P.volume * (modale() ? 0.4 : 1) : 0, t, P.acceso ? (avvio ? 1.3 : 0.25) : 0.1)
    if (!P.acceso || c.state !== 'running') return
    ascolta()
    if (!dove.daScena && S()) dove = posti()
    const m = meteo()
    ovatta.frequency.setTargetAtTime(16500 * (1 - 0.85 * m.nebbia) * (1 - 0.88 * m.neve) + 1500, t, 1)
    insegna(t)
    metti(vSplit, ...dove.split, { ref: 2.5 })
    piove(m, t, dt)
    tira(m, t, dt)
    bestie(dt, t)
    negozio(now)
    fermaAuto()
    if (now - lento > 1000) { lento = now; orario() }
  }
  requestAnimationFrame(giro)
  // (l'uscita, per le prove: tools/pzkko/suono/ascolta.mjs ci registra la strada)
  P.uscita = uscita
  return { senti }
}
