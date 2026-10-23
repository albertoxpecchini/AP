// Il banner del wallet (23.10 sera), il tasto in alto a sinistra della home (index.html, .wallet-tasto): una striscia di
// pelle cucita con la piastra d'acciaio e un pannello a led (art/wallet-banner/banner.webp, gpt-image-2, come il
// portafoglio). Il pannello dice sempre i $pzk (Alberto: «sempre c'è il mio importo»); col cursore sopra ci scorrono tutti
// i dati del wallet, come sui tabelloni di borsa: il saldo, quel che è sul tavolo, gli EUR€, quanto valgono i $pzk in
// euro, il cambio PZK/EUR€ con la variazione delle 24 ore e dell'ultima ora, il grafico delle 24 ore fatto di led, il
// minimo e il massimo, 1 € in $pzk, la capitalizzazione e i conti, il nome e l'indirizzo, la batteria, l'ultima mossa,
// l'ora del cambio; col clic si apre il wallet. Il nastro avanza a scatti di una colonna, come i led veri, e ogni voce si
// scrive coi dati del momento in cui entra. Quando cambia il saldo lampeggia la differenza e il numero corre al valore
// nuovo (se il nastro scorreva, poi riparte da dov'era).
// Le lettere sono quelle di Fake Receipt (fonts/fake-receipt.woff2), led per led: il carattere è una matrice di 5 × 8
// puntini col passo di 93 unità (righe a y 58…710, colonne a x 152…524) più qualche puntino a mezzo passo negli angoli
// tondi. I centri li ha trovati la trasformata di distanza sui glifi disegnati a 1000 px, agganciati alla griglia (i mezzi
// passi verso fuori); M, W, €, S, $, °, la punteggiatura e ▲ ▼ ◆ sono rifatti a mano sulla stessa griglia.
import * as pzk from '../games/pzk.js'

// ogni glifo: nove righe dall'alto (le otto del carattere e quella sotto la linea, per la virgola), «#» acceso
const LETTERE = {
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/#...#/.###./.....', 1: '..#../.##../..#../..#../..#../..#../..#../.###./.....',
  2: '.###./#...#/#...#/...#./.#.../#..../#..../#####/.....', 3: '.###./#...#/....#/.###./....#/#...#/#...#/.###./.....',
  4: '..##./.#.#./.#.#./#..#./#..#./#####/...#./...#./.....', 5: '#####/#..../#..../####./....#/....#/#...#/.###./.....',
  6: '.###./#..../#..../####./#...#/#...#/#...#/.###./.....', 7: '#####/....#/...#./...#./..#../..#../..#../..#../.....',
  8: '.###./#...#/#...#/.###./#...#/#...#/#...#/.###./.....', 9: '.###./#...#/#...#/#...#/.####/....#/....#/.###./.....',
  A: '.###./#...#/#...#/#...#/#####/#...#/#...#/#...#/.....', B: '####./#...#/#...#/####./#...#/#...#/#...#/####./.....',
  C: '.###./#...#/#..../#..../#..../#..../#...#/.###./.....', D: '####./#...#/#...#/#...#/#...#/#...#/#...#/####./.....',
  E: '#####/#..../#..../####./#..../#..../#..../#####/.....', F: '#####/#..../#..../####./#..../#..../#..../#..../.....',
  G: '.###./#..../#..../#..../#.###/#...#/#...#/.###./.....', H: '#...#/#...#/#...#/#####/#...#/#...#/#...#/#...#/.....',
  I: '.###./..#../..#../..#../..#../..#../..#../.###./.....', J: '..###/...#./...#./...#./...#./#..#./#..#./.##../.....',
  K: '#...#/#..#./#.#../##.../##.../#..#./#..#./#...#/.....', L: '#..../#..../#..../#..../#..../#..../#..../#####/.....',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#/#...#/.....', N: '#...#/##..#/##..#/#.#.#/#..##/#..##/#...#/#...#/.....',
  O: '.###./#...#/#...#/#...#/#...#/#...#/#...#/.###./.....', P: '####./#...#/#...#/#...#/####./#..../#..../#..../.....',
  Q: '.###./#...#/#...#/#...#/#...#/#.#.#/#..##/.####/.....', R: '####./#...#/#...#/#...#/####./#..#./#...#/#...#/.....',
  S: '.###./#...#/#..../.#.../..##./....#/#...#/.###./.....', T: '#####/..#../..#../..#../..#../..#../..#../..#../.....',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/#...#/.###./.....', V: '#...#/#...#/#...#/#...#/#...#/#...#/.#.#./..#../.....',
  W: '#...#/#...#/#.#.#/#.#.#/#.#.#/#.#.#/#.#.#/.#.#./.....', X: '#...#/#...#/.#.#./..#../.###./.#.#./#...#/#...#/.....',
  Y: '#...#/#...#/.#.#./.#.#./..#../..#../..#../..#../.....', Z: '#####/....#/...#./..#../.#.../.#.../#..../#####/.....',
  ',': '...../...../...../...../...../...../##.../##.../.#...', '.': '...../...../...../...../...../...../##.../##.../.....',
  ':': '...../...../##.../##.../...../...../##.../##.../.....', '%': '##..#/##..#/...#./..#../.#.../.#.../#..##/#..##/.....',
  '-': '...../...../...../...../#####/...../...../...../.....', '+': '...../...../..#../..#../#####/..#../..#../...../.....',
  '=': '...../...../...../#####/...../#####/...../...../.....', '/': '....#/....#/...#./..#../.#.../.#.../#..../#..../.....',
  '(': '...#./..#../.#.../.#.../.#.../.#.../..#../...#./.....', ')': '.#.../..#../...#./...#./...#./...#./..#../.#.../.....',
  '€': '..###/.#..#/####./.#.../####./.#.../.#..#/..###/.....', $: '..#../.####/#.#../.###./..#.#/..#.#/####./..#../.....',
  '!': '..#../..#../..#../..#../..#../...../...../..#../.....', '?': '.###./#...#/....#/...#./..#../...../...../..#../.....',
  '#': '.#.#./.#.#./#####/.#.#./.#.#./#####/.#.#./.#.#./.....', '*': '..#../#.#.#/.###./..#../..#../.###./#.#.#/..#../.....',
  "'": '##.../##.../.#.../...../...../...../...../...../.....', '°': '.#.../#.#../.#.../...../...../...../...../...../.....',
  '<': '...../....#/...#./.#.../#..../.#.../...#./....#/.....', '>': '...../#..../.#.../...#./....#/...#./.#.../#..../.....',
  '▲': '......./......./...#.../..###../.#####./#######/......./......./.......',
  '▼': '......./......./#######/.#####./..###../...#.../......./......./.......',
  '◆': '..../..../.##./####/####/.##./..../..../....',
}
const RIGHE = 10 // il pannello: una riga spenta sopra, le otto del carattere, quella sotto la linea
const VEL = 26 // colonne al secondo
const COLORI = { v: [70, 255, 125], a: [255, 176, 46], r: [255, 91, 74] } // i led verdi del wallet, l'ambra degli EUR€, il rosso della borsa che scende
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt, fmtEur = pzk.fmtEur

// ── le lettere in colonne: ogni colonna è una maschera di dieci bit (bit 0 la riga in alto) ──
const glifi = new Map()
function glifo(ch) {
  let col = glifi.get(ch)
  if (col) return col
  const righe = LETTERE[ch].split('/')
  col = []
  for (let c = 0; c < righe[0].length; c++) { let m = 0; righe.forEach((r, i) => { if (r[c] === '#') m |= 1 << (i + 1) }); col.push(m) }
  while (col.length > 1 && !col[0]) col.shift() // le colonne vuote ai lati si tolgono: le lettere hanno la loro larghezza
  while (col.length > 1 && !col[col.length - 1]) col.pop()
  glifi.set(ch, col)
  return col
}
const pulisci = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[−–—]/g, '-')
/** Scrive `testo` in fondo a `out` (colonne { m: accesi, f: a mezza luce, c: colore }); i caratteri che non ci sono si saltano. */
function scrivi(out, testo, c, fioco = false) {
  for (const ch of pulisci(testo)) {
    if (ch === ' ') { out.push({ m: 0, f: 0, c }, { m: 0, f: 0, c }, { m: 0, f: 0, c }); continue }
    if (!LETTERE[ch]) continue
    for (const m of glifo(ch)) out.push(fioco ? { m: 0, f: m, c } : { m, f: 0, c })
    out.push({ m: 0, f: 0, c })
  }
  return out
}
const vuoto = (out, n) => { for (let i = 0; i < n; i++) out.push({ m: 0, f: 0, c: 'v' }); return out }
const larghezza = (testo) => scrivi([], testo, 'v').length

/** Il grafico delle 24 ore in led: la linea accesa, l'area sotto a mezza luce; verde se è salito, rosso se è sceso. */
function grafico(out, punti, n = 46) {
  const t0 = punti[0][0], t1 = punti[punti.length - 1][0]
  const v = []
  for (let i = 0, k = 0; i < n; i++) { // il valore a ogni colonna: interpolato fra i due punti che la stringono
    const t = t0 + ((t1 - t0) * i) / (n - 1)
    while (k < punti.length - 2 && punti[k + 1][0] < t) k++
    const [ta, va] = punti[k], [tb, vb] = punti[Math.min(k + 1, punti.length - 1)]
    v.push(tb > ta ? va + ((vb - va) * (t - ta)) / (tb - ta) : va)
  }
  const lo = Math.min(...v), hi = Math.max(...v)
  const riga = (x) => 8 - Math.round(hi > lo ? ((x - lo) / (hi - lo)) * 7 : 3.5) // righe 1 (in alto) … 8 (sulla linea delle lettere)
  const c = punti[punti.length - 1][1] >= punti[0][1] ? 'v' : 'r'
  let prima = riga(v[0])
  for (const x of v) {
    const r = riga(x)
    let m = 0, f = 0
    for (let k = Math.min(r, prima); k <= Math.max(r, prima); k++) m |= 1 << k // la linea non si spezza nei salti
    for (let k = Math.max(r, prima) + 1; k <= 8; k++) f |= 1 << k
    out.push({ m, f, c })
    prima = r
  }
  return out
}

// ── il banner ──
/** Accende il pannello del tasto. `batteria()` è quella del wallet (wallet.js): la stessa dello schermino lcd. */
export function banner(bottone, { batteria }) {
  const tela = bottone.querySelector('canvas')
  if (!tela) return
  const g = tela.getContext('2d')
  const nuova = () => document.createElement('canvas')
  const fondo = nuova(), luce = nuova(), piccola = nuova()
  const lg = luce.getContext('2d'), pg = piccola.getContext('2d')
  let W = 0, H = 0, p = 0, vis = 0, x0 = 0, sprite = null, rimisura = true

  // le misure: il pannello è alto dieci led e largo quanti ne entrano; i led spenti e i colori si preparano una volta, e
  // di nuovo solo quando il pannello cambia grandezza (leggere le misure a ogni fotogramma costringerebbe la pagina a
  // ricalcolare l'impaginazione)
  new ResizeObserver(() => { rimisura = true }).observe(tela)
  const misura = () => {
    if (!rimisura) return W > 0
    rimisura = false
    const dpr = Math.min(2, devicePixelRatio || 1)
    const w = Math.round(tela.clientWidth * dpr), h = Math.round(tela.clientHeight * dpr)
    if (!w || !h) return false
    ultimo = -1; cambioPagina = 0; fermo = false
    if (w === W && h === H) return true
    W = tela.width = fondo.width = luce.width = w; H = tela.height = fondo.height = luce.height = h
    p = H / RIGHE; vis = Math.floor(W / p); x0 = (W - vis * p) / 2
    piccola.width = Math.max(2, Math.round(W / (p * 0.75))); piccola.height = Math.max(2, Math.round(H / (p * 0.75)))
    const r = p * 0.36
    const f = fondo.getContext('2d')
    f.fillStyle = '#040605'; f.fillRect(0, 0, W, H)
    f.fillStyle = '#18211b'
    for (let i = 0; i < vis; i++) for (let k = 0; k < RIGHE; k++) { f.beginPath(); f.arc(x0 + (i + 0.5) * p, (k + 0.5) * p, r, 0, Math.PI * 2); f.fill() }
    const punto = (rgb, a) => { // un led acceso: il cuore chiaro, il colore, il bordo morbido
      const s = nuova(), l = Math.ceil(r * 2.4) + 2, x = s.getContext('2d')
      s.width = s.height = l
      const gr = x.createRadialGradient(l / 2, l / 2, 0, l / 2, l / 2, r * 1.15)
      const chiaro = rgb.map((c) => Math.round(c + (255 - c) * 0.6))
      gr.addColorStop(0, `rgba(${chiaro},${a})`); gr.addColorStop(0.45, `rgba(${rgb},${a})`); gr.addColorStop(0.85, `rgba(${rgb},${a * 0.9})`); gr.addColorStop(1, `rgba(${rgb},0)`)
      x.fillStyle = gr; x.fillRect(0, 0, l, l)
      return s
    }
    sprite = Object.fromEntries(Object.entries(COLORI).map(([k, rgb]) => [k, { pieno: punto(rgb, 1), fioco: punto(rgb, 0.3) }]))
    return true
  }

  // un fotogramma: le colonne da `da` in poi (vis colonne)
  const disegna = (col, da = 0) => {
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
    g.drawImage(fondo, 0, 0)
    lg.clearRect(0, 0, W, H)
    for (let i = 0; i < vis; i++) {
      const k = col[da + i]
      if (!k || !(k.m | k.f)) continue
      const cx = x0 + (i + 0.5) * p, sp = sprite[k.c]
      for (let r = 0; r < RIGHE; r++) {
        const s = k.m & (1 << r) ? sp.pieno : k.f & (1 << r) ? sp.fioco : null
        if (s) lg.drawImage(s, cx - s.width / 2, (r + 0.5) * p - s.height / 2)
      }
    }
    // l'alone: lo strato acceso rimpicciolito e ringrandito, sommato (un bagliore che costa poco e va su ogni browser)
    pg.clearRect(0, 0, piccola.width, piccola.height); pg.drawImage(luce, 0, 0, piccola.width, piccola.height)
    g.globalCompositeOperation = 'lighter'
    g.imageSmoothingEnabled = true
    g.globalAlpha = 0.55; g.drawImage(piccola, 0, 0, W, H)
    g.globalAlpha = 1; g.drawImage(luce, 0, 0)
    g.globalCompositeOperation = 'source-over'
  }

  // ── i dati: la borsa delle 24 ore (la stessa di /api/borsa che usa il wallet), ogni due minuti finché la pagina si vede ──
  let borsa = null
  const prendiBorsa = async () => {
    try { const d = await (await fetch('/api/borsa?da=24h')).json(); borsa = d.ok ? d : { chiusa: true } } catch { borsa ??= { chiusa: true } }
  }
  prendiBorsa()
  setInterval(() => { if (!document.hidden) prendiBorsa() }, 120000)

  const pct = (v) => `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toFixed(2).replace('.', ',')}%`
  const NOMI = { nato: 'conto aperto', 'in-eur': 'in EUR€', 'in-pzk': 'da EUR€', inviato: 'inviati a', ricevuto: 'ricevuti da', indirizzo: 'nuovo indirizzo', instagram: 'regalo di instagram', trovato: 'trovati per terra', sussidio: 'sussidio', lumaca: 'lumachina' }
  // le voci del nastro: ognuna una funzione che la scrive coi dati del momento in cui entra nel nastro (pochi secondi prima
  // di vedersi), o niente se non c'è. Ogni pezzo è [testo, colore]: ambra le etichette, verde i valori, rosso se scende
  const riga = (...pezzi) => { const o = []; for (const [t, c] of pezzi) scrivi(o, t, c); return o }
  const B = () => (borsa?.ok ? borsa : null)
  const VOCI = [
    () => riga(['$PZK ', 'a'], [fmt(pzk.saldo()), 'v']),
    () => { const c = pzk.conto(), tav = c ? Math.round(c.pzk - pzk.saldo()) : 0; return tav > 0 && riga(['sul tavolo ', 'a'], [fmt(tav), 'v']) },
    () => pzk.conto() && riga(['EUR€ ', 'a'], [fmtEur(pzk.euro()), 'a']),
    () => riga(['valgono ', 'a'], [`${fmtEur(pzk.saldo() * pzk.tasso())} €`, 'v']),
    () => { const b = B(); if (!b) return borsa && riga(['borsa ', 'a'], ['chiusa', 'r']); const su = b.var24 == null || b.var24 >= 0; return riga(['PZK/EUR€ ', 'a'], [b.tasso.toFixed(4), su ? 'v' : 'r'], [b.var24 == null ? '' : ` ${pct(b.var24)}`, su ? 'v' : 'r']) },
    () => { const b = B(); return b?.punti?.length > 1 && grafico(scrivi([], '24H ', 'a'), b.punti) },
    () => { const b = B(); return b?.var1h != null && riga(['1H ', 'a'], [pct(b.var1h), b.var1h >= 0 ? 'v' : 'r']) },
    () => { const b = B(); if (!b?.punti?.length) return null; let lo = Infinity, hi = -Infinity; for (const [, x] of b.punti) { if (x < lo) lo = x; if (x > hi) hi = x } return riga(['min ', 'a'], [lo.toFixed(4), 'v'], ['  max ', 'a'], [hi.toFixed(4), 'v']) },
    () => { const b = B(); return b && riga(['1 € = ', 'a'], [`${b.inverso.toFixed(3)} $PZK`, 'v']) },
    () => { const k = B()?.cap; return k && riga(['cap ', 'a'], [`${fmt(Math.round(k.pzk))} $PZK`, 'v'], [`  ${k.conti} ${k.conti === 1 ? 'conto' : 'conti'}`, 'a']) },
    () => { const c = pzk.conto(); return c ? riga([`${c.nome} `, 'a'], [c.ind, 'v']) : riga(['sessione ', 'a'], ['1.000 di partenza, non si salvano', 'v']) },
    () => { const b = batteria(); return riga(['batteria ', 'a'], [`${b.pct}%`, b.pct <= 15 ? 'r' : 'v'], [b.carica ? ' in carica' : '', 'a']) },
    () => {
      const c = pzk.conto(), m = c?.mosse?.[c.mosse.length - 1]
      if (!m) return null
      const meno = ['in-eur', 'inviato'].includes(m.tipo) || m.verso === 'meno'
      return riga(['ultima ', 'a'], [m.n != null && m.tipo !== 'indirizzo' ? `${meno ? '-' : '+'}${fmt(m.n)} ` : '', meno ? 'r' : 'v'], [NOMI[m.tipo] ?? m.tipo, 'v'])
    },
    () => pzk.conto() && pzk.sincronizzato() && riga(['cambio delle ', 'a'], [new Date(pzk.sincronizzato()).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }), 'v']),
  ]
  const voci = () => VOCI.map((f) => f()).filter(Boolean)
  // la prossima voce in fondo al nastro, seguita da un pallino ambra a mezza luce; finito il giro si ricomincia dal saldo
  let prossima = 0
  const aggiungi = (out) => {
    for (let giri = 0; giri < VOCI.length; giri++) {
      const v = VOCI[prossima]()
      prossima = (prossima + 1) % VOCI.length
      if (!v) continue
      out.push(...v); vuoto(out, 5); scrivi(out, '◆', 'a', true); vuoto(out, 6)
      return
    }
  }

  // ── il saldo, sempre: il numero a destra come sui registratori di cassa, e «$PZK» in ambra ──
  // la colonna vuota dopo l'ultima lettera non conta: centrato vuol dire stesse colonne spente a destra e a sinistra
  const stretto = (o) => { while (o.length && !(o[o.length - 1].m | o[o.length - 1].f)) o.pop(); return o }
  const centrato = (o) => { stretto(o); return vuoto([], Math.max(0, Math.round((vis - o.length) / 2))).concat(o) }
  const aDestra = (o) => { stretto(o); return vuoto([], Math.max(0, vis - 2 - o.length)).concat(o) }
  const importo = (v) => {
    const o = scrivi(scrivi([], fmt(v), 'v'), ' $PZK', 'a')
    return aDestra(stretto(o).length > vis - 4 ? scrivi([], fmt(v), 'v') : o) // se il numero è lunghissimo, «$PZK» lascia il posto
  }

  // ── il saldo che cambia: la differenza lampeggia, poi il numero corre al valore nuovo, poi resta un momento ──
  const DIFF = 900, CORSA = 800, FERMO = 1300
  let flash = null, mostrato = pzk.saldo(), fermo = false
  const etichetta = (s) => bottone.setAttribute('aria-label', `wallet: ${fmt(s)} $pzk, il conto e la borsa`)
  etichetta(mostrato)
  const adesso = (ora) => { if (!flash) return mostrato; const e = Math.min(1, Math.max(0, (ora - flash.t0 - DIFF) / CORSA)); return flash.da + (flash.a - flash.da) * (1 - (1 - e) ** 3) }
  pzk.ascolta((s) => {
    etichetta(s)
    fermo = false
    if (RIDOTTO.matches || Math.abs(s - (flash?.a ?? mostrato)) < 0.25) { if (!flash) mostrato = s; return }
    const ora = performance.now()
    flash = { da: flash ? adesso(ora) : mostrato, a: s, t0: ora }
    mostrato = s
  })
  const disegnaFlash = (ora) => {
    const t = ora - flash.t0, d = flash.a - flash.da
    if (t < DIFF) {
      const acceso = t < 260 || t > 380 // un lampo: acceso, spento un attimo, acceso
      disegna(acceso ? centrato(scrivi([], `${d >= 0 ? '+' : '-'}${fmt(Math.abs(Math.round(d * 2) / 2))} $PZK`, d >= 0 ? 'v' : 'r')) : [])
      return true
    }
    if (t < DIFF + CORSA + FERMO) {
      disegna(importo(Math.round(adesso(ora) * 2) / 2))
      return true
    }
    flash = null
    fermo = false
    return false
  }

  // ── chi non vuole movimento: le voci si alternano ferme, una ogni tre secondi ──
  let pagine = null, pagina = 0, cambioPagina = 0
  const disegnaPagina = (ora) => {
    if (!pagine || ora > cambioPagina) { pagine = voci(); pagina = (pagina + (cambioPagina ? 1 : 0)) % pagine.length; cambioPagina = ora + 3000; disegna(vuoto([], 2).concat(pagine[pagina])) }
  }

  // ── col cursore sopra (o col fuoco della tastiera) scorrono tutte le informazioni: il saldo scivola via a sinistra e
  // dietro arrivano i dati; tolto il cursore torna subito il saldo. Al tocco no: il dito apre il wallet e basta ──
  let scorre = false
  const parti = () => {
    if (scorre || !vis) return
    scorre = true
    nastro = importo(mostrato).concat(vuoto([], 2)); vuoto(nastro, 5); scrivi(nastro, '◆', 'a', true); vuoto(nastro, 6)
    prossima = 1; pos = 0; acc = 0; ultimo = -1 // il saldo è già lì: si parte dalla voce dopo
    pagina = 1; cambioPagina = 0; pagine = null
  }
  const smetti = () => { if (scorre) { scorre = false; fermo = false } }
  bottone.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') parti() })
  bottone.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') smetti() })
  bottone.addEventListener('focus', () => { if (bottone.matches(':focus-visible')) parti() })
  bottone.addEventListener('blur', smetti)

  // ── il motore: requestAnimationFrame (si ferma da solo quando la pagina non si vede), un disegno a ogni scatto ──
  let nastro = [], pos = 0, acc = 0, prima = 0, ultimo = -1
  const riempi = () => {
    if (pos > 4000) { nastro = nastro.slice(pos); pos = 0 }
    while (nastro.length < pos + vis + 2) aggiungi(nastro)
  }
  const passo = (ora) => {
    requestAnimationFrame(passo)
    const dt = Math.min(200, prima ? ora - prima : 0)
    prima = ora
    if (!misura()) return
    if (flash && disegnaFlash(ora)) { ultimo = -1; return }
    if (!scorre) { if (!fermo) { disegna(importo(mostrato)); fermo = true } return } // il saldo, fermo: si ridisegna solo quando cambia
    fermo = false
    if (RIDOTTO.matches) { disegnaPagina(ora); ultimo = -1; return }
    pagine = null
    acc += (dt * VEL) / 1000
    const n = Math.floor(acc)
    acc -= n; pos += n
    if (pos === ultimo) return
    riempi()
    disegna(nastro, pos)
    ultimo = pos
  }
  requestAnimationFrame(passo)
  addEventListener('resize', () => { rimisura = true }) // anche il devicePixelRatio (lo zoom) cambia la tela

  // la banconota raccolta per terra: il suo valore vola via dal tasto (e il saldo che cambia lo dice anche il pannello)
  const piu = document.createElement('span')
  piu.className = 'wt-piu'
  bottone.appendChild(piu)
  document.addEventListener('pzkko-banconota', (e) => { piu.textContent = `+${fmt(e.detail.valore)} $pzk`; piu.classList.remove('va'); void piu.offsetWidth; piu.classList.add('va') })
}
