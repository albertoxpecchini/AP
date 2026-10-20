// La regia di pzkko.it: il pannello nascosto per provare il sito, nello stile dei
// giochi (un foglio col nastro, piste stampate, fiches da trascinare). Comanda
// l'ora di Mantova e la sua velocità, la sera (il buio, l'insegna, i lampioni, lo
// sfarfallio), le auto che passano (quando, che fari, il neon sotto, una ferma
// dove si vuole), la scena 3D (esposizione, bagliore, neon, specchi, qualità), le
// bestie e la goccia della condensa. Non è modale: la scena dietro cambia mentre
// si trascina. Niente si salva: ricaricando torna tutto com'era (tranne l'ora e la
// velocità, che le ricariche della regia si portano dietro nell'indirizzo).
//
// index.html la apre scrivendo «regia», con #regia nell'indirizzo o con cinque
// tocchi in fretta in cima allo schermo: import('/regia/regia.js').then((m) => m.apri()).
// Quello che comanda: window.pzkkoPagina (l'orologio, la sera, le auto, in index.html),
// window.pzkkoRegia (i ritocchi che la scena legge a ogni fotogramma, scena/materiali.js)
// e window.pzkkoScena (le bestie, la goccia, i numeri in fondo).

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }
const fmt = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('it-IT')
const limita = (x, a, b) => Math.min(b, Math.max(a, x))

// i ritocchi della scena: gli stessi valori di partenza di scena/materiali.js (REGIA)
const PREDEFINITI = {
  esposizione: 1, bagliore: 1, neon: 1, specchi: true,
  bestie: { formiche: true, mosche: true, zanzare: true, blatte: true }, blatteDiGiorno: false, velocitaBestie: 1, goccia: 1,
}
const R = (window.pzkkoRegia ??= structuredClone(PREDEFINITI))
const pagina = () => window.pzkkoPagina
const scena = () => window.pzkkoScena

// ── l'ora di Mantova ─────────────────────────────────────────────────────────
const ROMA = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
const minuto = (ms) => { const [h, m, s] = ROMA.format(new Date(ms)).split(':').map(Number); return h * 60 + m + s / 60 }
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`
const adesso = () => pagina().orologio.adesso()
// all'ora m (minuti dalla mezzanotte, a Mantova) dello stesso giorno
const vai = (m) => { const o = pagina().orologio, t = o.adesso(); o.imposta(t + (m - minuto(t)) * 60000); pagina().aggiorna() }
const sole = () => { const s = pagina().sole(adesso()); return { alba: minuto(s.alba), tramonto: minuto(s.tramonto) } }

// ricarica la pagina con dei parametri (la qualità, il muro senza 3D, l'arrivo), portandosi dietro l'ora e la
// velocità e la regia aperta
const ricarica = (cambia) => {
  const u = new URL(location.href), o = pagina().orologio
  u.searchParams.set('ora', hhmm(minuto(o.adesso())))
  if (o.veloce > 1 && !o.fermo) u.searchParams.set('veloce', o.veloce); else u.searchParams.delete('veloce')
  for (const [k, v] of Object.entries(cambia)) { if (v === null) u.searchParams.delete(k); else u.searchParams.set(k, v) }
  u.hash = 'regia'
  location.href = u.toString()
}

// ── la finestra ──────────────────────────────────────────────────────────────
let dlg, voceEl, piste = [], conta, giro = null

export async function apri() {
  if (!dlg) await costruisci()
  // (scrivere «regia» di nuovo la chiude)
  if (dlg.open) return chiudi()
  dlg.classList.remove('chiude', 'giu')
  dlg.show()
  // (senza rubare il fuoco alla pagina: si apre, non si entra)
  document.activeElement?.blur?.()
  for (const p of piste) p.disegna()
  avviaConta()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { dlg.close(); return }
  dlg.classList.add('chiude')
  dlg.addEventListener('animationend', () => { dlg.classList.remove('chiude'); dlg.close() }, { once: true })
}

const voce = (t) => { if (voceEl) voceEl.textContent = t }

async function costruisci() {
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'regia.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'rg'
  dlg.setAttribute('aria-labelledby', 'rg-titolo')
  dlg.innerHTML = `
    <img class="rg-nastro rg-n1" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <img class="rg-nastro rg-n2" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <img class="rg-nastro rg-n3" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <img class="rg-nastro rg-n4" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <svg class="rg-defs" aria-hidden="true"><filter id="rg-ink" x="-2%" y="-10%" width="104%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter></svg>
    <div class="rg-dentro">
      <header class="rg-testa">
        <h2 id="rg-titolo">regia</h2>
        <p class="rg-voce" aria-live="polite">trascina le fiches</p>
        <button class="rg-tondo rg-abbassa" type="button" aria-label="abbassa la regia"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 15c4 4 7 7 11 11 4-4 8-8 11-11"/></svg></button>
        <button class="rg-tondo rg-chiudi" type="button" aria-label="chiudi la regia"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="rg-corpo"></div>
      <footer class="rg-piede"><ul class="rg-conta" aria-label="come va la scena"></ul><button class="rg-piccolo rg-rimetti" type="button">rimetti tutto</button></footer>
    </div>`
  document.body.appendChild(dlg)
  voceEl = dlg.querySelector('.rg-voce')
  conta = dlg.querySelector('.rg-conta')
  const corpo = dlg.querySelector('.rg-corpo')
  dlg.querySelector('.rg-chiudi').addEventListener('click', chiudi)
  dlg.querySelector('.rg-abbassa').addEventListener('click', () => dlg.classList.toggle('giu'))
  dlg.querySelector('.rg-rimetti').addEventListener('click', rimetti)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.open) chiudi() })
  for (const s of sezioni()) corpo.appendChild(s)
  new ResizeObserver(() => { if (dlg.open) for (const p of piste) p.disegna() }).observe(corpo)
  // quello che cambia da solo (l'ora che passa, la sera che cala): le piste si rileggono due volte al secondo
  setInterval(() => { if (dlg.open) for (const p of piste) p.rileggi() }, 500)
}

// ── le piste ─────────────────────────────────────────────────────────────────
// Una pista è una riga: il nome e il valore (a pennarello) a sinistra, a destra il binario stampato e la fiche.
// tipo «scorre»: un valore continuo fra min e max (log: in scala logaritmica), con le tacche sotto, i segni in rosso
// (l'alba, il tramonto) e a sinistra, se c'è auto, la casella che vale null («segue da solo»). Tipo «scatti»: le
// caselle di valori [testo, valore]; la fiche si trascina e si posa nella più vicina. leggi() e scrivi(v) sono il
// valore vero; dopo: scrive solo quando la fiche si posa (le scelte che ricaricano la pagina)
function pista(def, fiche) {
  const riga = document.createElement('div')
  riga.className = 'rg-riga'
  riga.innerHTML = `<span class="rg-nome">${def.nome}<b></b></span><div class="rg-pista" tabindex="0" role="slider" aria-label="${def.nome}"><svg aria-hidden="true"></svg><img class="rg-fiche" src="${ART}fiches/f${fiche}.webp" alt="" width="170" height="174" draggable="false"></div>`
  const p = riga.querySelector('.rg-pista'), svg = p.querySelector('svg'), chip = p.querySelector('.rg-fiche'), val = riga.querySelector('b')
  const scatti = def.tipo === 'scatti', AUTO = def.auto ? 46 : 0, Y0 = 5, Y1 = 22
  const W = () => p.clientWidth || 300
  const x0 = () => (AUTO ? AUTO + 10 : 6), x1 = () => W() - 6
  const norm = (v) => (def.log ? Math.log(v / def.min) / Math.log(def.max / def.min) : (v - def.min) / (def.max - def.min))
  const denorm = (k) => (def.log ? def.min * (def.max / def.min) ** k : def.min + k * (def.max - def.min))
  const indice = (v) => Math.max(0, def.valori.findIndex(([, x]) => x === v))
  const xDi = (v) => {
    if (scatti) { const n = def.valori.length; return (indice(v) + 0.5) * (W() / n) }
    if (v === null) return AUTO / 2
    return x0() + limita(norm(v), 0, 1) * (x1() - x0())
  }
  const vDi = (x) => {
    if (scatti) return def.valori[limita(Math.floor(x / (W() / def.valori.length)), 0, def.valori.length - 1)][1]
    if (AUTO && x < AUTO + 5) return null
    let v = denorm(limita((x - x0()) / (x1() - x0()), 0, 1))
    if (def.passo) v = Math.round(v / def.passo) * def.passo
    return v
  }
  const testo = (v) => (scatti ? def.valori[indice(v)][0] : v === null ? def.autoTesto?.() ?? 'auto' : def.testo(v))
  let valore = def.leggi(), presa = false

  const disegna = () => {
    svg.innerHTML = ''
    const w = W(), stampa = svgEl('g', { filter: 'url(#rg-ink)' }), sopra = svgEl('g')
    const scritta = (t, x, y, a = {}) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'font-size': 10.5, fill: '#161616', ...a }); e.textContent = t; stampa.appendChild(e) }
    if (scatti) {
      // le caselle, come quelle del tavolo; quella scelta evidenziata
      const n = def.valori.length, cw = w / n
      def.valori.forEach(([t, v], i) => {
        if (v === valore) sopra.appendChild(svgEl('rect', { x: i * cw + 2.5, y: Y0 + 1.5, width: cw - 5, height: Y1 - Y0 - 3, fill: 'rgba(255,212,0,.6)' }))
        stampa.appendChild(svgEl('rect', { x: i * cw + 1, y: Y0, width: cw - 2, height: Y1 - Y0, fill: 'none', stroke: '#161616', 'stroke-width': 1.6 }))
        scritta(t, (i + 0.5) * cw, 37, v === valore ? { fill: '#b3121f' } : {})
      })
    } else {
      // la casella «auto», il binario con l'evidenziatore fino al valore, le tacche, i segni rossi
      if (AUTO) {
        if (valore === null) sopra.appendChild(svgEl('rect', { x: 2.5, y: Y0 + 1.5, width: AUTO - 5, height: Y1 - Y0 - 3, fill: 'rgba(255,212,0,.6)' }))
        stampa.appendChild(svgEl('rect', { x: 1, y: Y0, width: AUTO - 2, height: Y1 - Y0, fill: 'none', stroke: '#161616', 'stroke-width': 1.6 }))
        scritta(def.autoNome ?? 'auto', AUTO / 2, 37, valore === null ? { fill: '#b3121f' } : {})
      }
      const a = x0() - 4, b = x1() + 4
      stampa.appendChild(svgEl('rect', { x: a, y: Y0, width: b - a, height: Y1 - Y0, rx: 3, fill: 'none', stroke: '#161616', 'stroke-width': 1.6 }))
      if (valore !== null) sopra.appendChild(svgEl('rect', { x: a + 1.5, y: Y0 + 1.5, width: Math.max(0, xDi(valore) - a - 1.5), height: Y1 - Y0 - 3, fill: 'rgba(255,212,0,.6)' }))
      for (const [v, t] of def.tacche?.() ?? []) {
        const x = xDi(v)
        stampa.appendChild(svgEl('path', { d: `M${x} ${Y1 - 5}V${Y1}`, stroke: '#161616', 'stroke-width': 1.4 }))
        if (t) scritta(t, x, 37)
      }
      for (const [v, t] of def.segni?.() ?? []) {
        const x = xDi(v)
        stampa.appendChild(svgEl('path', { d: `M${x} ${Y0 - 3}V${Y1 + 3}`, stroke: '#b3121f', 'stroke-width': 2, 'stroke-linecap': 'round' }))
        scritta(t, x, Y0 - 5, { fill: '#b3121f', 'font-size': 9.5 })
      }
    }
    svg.appendChild(sopra); svg.appendChild(stampa)
    if (!presa) chip.style.left = `${xDi(valore)}px`
    chip.style.top = `${(Y0 + Y1) / 2}px`
    const t = testo(valore)
    val.textContent = t
    p.setAttribute('aria-valuetext', t)
  }
  const metti = (v, annuncia = true) => {
    if (v === valore) return
    valore = v
    if (!def.dopo) def.scrivi(v)
    disegna()
    if (annuncia) voce(`${def.nome}: ${testo(v)}`)
  }

  // trascinare: la fiche si alza e segue il dito (nelle caselle il valore cambia già passando), posata fa un colpetto
  const muovi = (e) => { const r = p.getBoundingClientRect(), x = limita(e.clientX - r.left, 0, r.width); chip.style.left = `${x}px`; metti(vDi(x)) }
  p.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return
    try { p.setPointerCapture(e.pointerId) } catch {}
    presa = true
    p.classList.add('presa'); p.classList.remove('scatta')
    muovi(e)
  })
  p.addEventListener('pointermove', (e) => { if (presa) muovi(e) })
  const lascia = () => {
    if (!presa) return
    presa = false
    p.classList.remove('presa'); p.classList.add('scatta')
    disegna()
    chip.classList.remove('posa'); void chip.offsetWidth; chip.classList.add('posa')
    if (def.dopo) def.scrivi(valore)
  }
  p.addEventListener('pointerup', lascia)
  p.addEventListener('pointercancel', lascia)
  // la tastiera: frecce, pagina su e giù, inizio e fine (le scelte che ricaricano: Invio)
  p.addEventListener('keydown', (e) => {
    let v
    if (scatti) {
      const i = indice(valore), n = def.valori.length
      const j = { ArrowLeft: i - 1, ArrowDown: i - 1, ArrowRight: i + 1, ArrowUp: i + 1, Home: 0, End: n - 1 }[e.key]
      if (j === undefined) { if (e.key === 'Enter' && def.dopo) def.scrivi(valore); return }
      v = def.valori[limita(j, 0, n - 1)][1]
    } else {
      const k = valore === null ? -0.01 : norm(valore), d = { ArrowLeft: -0.02, ArrowDown: -0.02, ArrowRight: 0.02, ArrowUp: 0.02, PageDown: -0.1, PageUp: 0.1 }[e.key]
      if (e.key === 'Home') v = AUTO ? null : def.min
      else if (e.key === 'End') v = def.max
      else if (d === undefined) return
      else if (AUTO && k + d < 0) v = null
      else { v = denorm(limita(k + d, 0, 1)); if (def.passo) v = Math.round(v / def.passo) * def.passo }
    }
    e.preventDefault()
    p.classList.add('scatta')
    metti(v)
  })
  piste.push({ disegna, rileggi: () => { if (presa) return; const v = def.leggi(); if (v !== valore || def.vivo) { valore = v; disegna() } } })
  return riga
}

const tasti = (lista) => {
  const d = document.createElement('div')
  d.className = 'rg-tasti'
  for (const [t, fa, grosso] of lista) {
    const b = document.createElement('button')
    b.type = 'button'; b.className = grosso ? 'rg-gira' : 'rg-piccolo'; b.textContent = t
    b.addEventListener('click', () => { fa(); voce(t) })
    d.appendChild(b)
  }
  return d
}
const nota = (t) => { const p = document.createElement('p'); p.className = 'rg-nota'; p.textContent = t; return p }
const sezione = (titolo, fiche, piccola, righe) => {
  const s = document.createElement('section')
  s.className = 'rg-sez'
  s.innerHTML = `<h3><img src="${ART}fiches/f${fiche}.webp" alt="" width="170" height="174">${titolo}<small>${piccola}</small></h3>`
  for (const r of righe) s.appendChild(r.disegna ? r : r.nome ? pista(r, fiche) : r)
  return s
}

// ── che cosa si comanda ──────────────────────────────────────────────────────
function sezioni() {
  const P = pagina(), si = [['sì', true], ['no', false]]
  const fuori = []
  fuori.push(sezione('il tempo', 500, 'a mantova', [
    { nome: 'ora', tipo: 'scorre', min: 0, max: 1439, passo: 1, vivo: true, leggi: () => minuto(adesso()), scrivi: vai, testo: hhmm,
      tacche: () => [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => [Math.min(1439, h * 60), String(h)]),
      segni: () => { const s = sole(); return [[s.alba, 'alba'], [s.tramonto, 'tramonto']] } },
    { nome: 'velocità', tipo: 'scatti', valori: [['ferma', 0], ['x1', 1], ['x10', 10], ['x60', 60], ['x600', 600]],
      leggi: () => (P.orologio.fermo ? 0 : P.orologio.veloce),
      scrivi: (v) => { P.orologio.fermo = v === 0; if (v) P.orologio.veloce = v; P.aggiorna() } },
    tasti([
      ['alba', () => vai(sole().alba - 15)], ['mezzogiorno', () => vai(12 * 60)], ['tramonto', () => vai(sole().tramonto - 5)],
      ['sera', () => vai(sole().tramonto + 55)], ['mezzanotte', () => vai(0)], ['adesso', () => { P.orologio.imposta(Date.now()); P.aggiorna() }],
    ]),
  ]))
  const valoreCss = (n) => parseFloat(document.documentElement.style.getPropertyValue(n)) || 0
  const tre = (spenta, accesa) => [['auto', null], [spenta, 0], [accesa, 1]]
  fuori.push(sezione('la sera', 100, 'auto = col tramonto', [
    { nome: 'buio', tipo: 'scorre', auto: true, min: 0, max: 1, vivo: true, leggi: () => P.forza.notte, scrivi: (v) => { P.forza.notte = v; P.aggiorna() },
      testo: (v) => fmt(v), autoTesto: () => `auto · ${fmt(valoreCss('--notte'))}`, tacche: () => [[0, 'giorno'], [0.5, ''], [1, 'notte']] },
    { nome: 'insegna', tipo: 'scatti', valori: tre('spenta', 'accesa'), leggi: () => P.forza.insegna, scrivi: (v) => { P.forza.insegna = v; P.aggiorna() } },
    { nome: 'lampioni', tipo: 'scatti', valori: tre('spenti', 'accesi'), leggi: () => P.forza.lampioni, scrivi: (v) => { P.forza.lampioni = v; P.aggiorna() } },
    { nome: 'sfarfallio', tipo: 'scatti', valori: si, leggi: () => P.regola.sfarfallio, scrivi: (v) => { P.regola.sfarfallio = v } },
  ]))
  fuori.push(sezione('le auto', 5, 'anche di giorno', [
    tasti([['passa un\'auto', () => P.passaAuto(), true]]),
    { nome: 'ogni', tipo: 'scorre', min: 5, max: 180, log: true, passo: 1, leggi: () => P.regola.ogni, scrivi: (v) => { P.regola.ogni = v }, testo: (v) => `${v} s`,
      tacche: () => [[5, '5 s'], [15, '15'], [60, '1 min'], [180, '3 min']] },
    { nome: 'fari', tipo: 'scatti', valori: [['a caso', null], ['alogeni', 0], ['led', 1], ['xeno', 2]], leggi: () => P.regola.fari, scrivi: (v) => { P.regola.fari = v } },
    { nome: 'neon sotto', tipo: 'scatti', valori: [['a caso', null], ['sì', true], ['no', false]], leggi: () => P.regola.neon, scrivi: (v) => { P.regola.neon = v } },
    { nome: 'ferma', tipo: 'scorre', auto: true, autoNome: 'passa', min: -0.2, max: 1.2, leggi: () => P.regola.ferma, scrivi: (v) => P.fermaAuto(v),
      testo: (v) => `ferma a ${fmt(v)}`, autoTesto: () => 'passa e va', tacche: () => [[0, 'sinistra'], [0.5, 'davanti'], [1, 'destra']] },
  ]))
  if (!scena()) {
    fuori.push(sezione('la scena', 25, 'senza 3D', [nota('qui il 3D non c\'è (o non è ancora partito): restano l\'ora, la sera e le auto, sul muro di sempre.'), tasti([['con il 3D', () => ricarica({ muro: null })]])]))
    return fuori
  }
  const S = scena()
  fuori.push(sezione('la scena', 25, 'il 3D', [
    { nome: 'esposizione', tipo: 'scorre', min: 0.25, max: 4, log: true, leggi: () => R.esposizione, scrivi: (v) => { R.esposizione = v }, testo: (v) => `x${fmt(v)}`, tacche: () => [[0.25, '¼'], [1, '1'], [4, '4']] },
    { nome: 'bagliore', tipo: 'scorre', min: 0, max: 3, leggi: () => R.bagliore, scrivi: (v) => { R.bagliore = v }, testo: (v) => `x${fmt(v)}`, tacche: () => [[0, 'niente'], [1, '1'], [3, '3']] },
    { nome: 'neon', tipo: 'scorre', min: 0, max: 3, leggi: () => R.neon, scrivi: (v) => { R.neon = v }, testo: (v) => `x${fmt(v)}`, tacche: () => [[0, 'spento'], [1, '1'], [3, '3']] },
    { nome: 'specchi', tipo: 'scatti', valori: si, leggi: () => R.specchi, scrivi: (v) => { R.specchi = v } },
    { nome: 'il muro sotto', tipo: 'scatti', valori: [['no', false], ['in trasparenza', true]], leggi: () => document.documentElement.classList.contains('scena-allinea'),
      scrivi: (v) => document.documentElement.classList.toggle('scena-allinea', v) },
    { nome: 'qualità', tipo: 'scatti', dopo: true, valori: ['alta', 'media', 'bassa', 'telefono'].map((q) => [q, q]), leggi: () => S.qualita,
      scrivi: (v) => { if (v !== S.qualita) ricarica({ qualita: v }) } },
    nota('la qualità ricarica la pagina (l\'ora e la velocità restano).'),
    tasti([['rifai l\'arrivo', () => ricarica({ intro: null })], ['muro senza 3D', () => ricarica({ muro: 1 })], ['scarica il .glb', () => ricarica({ glb: 1 })]]),
  ]))
  fuori.push(sezione('le bestie', 1, 'dal vero', [
    ...['formiche', 'mosche', 'zanzare', 'blatte'].map((n) => ({ nome: n, tipo: 'scatti', valori: si, leggi: () => R.bestie[n], scrivi: (v) => { R.bestie[n] = v } })),
    { nome: 'blatte di giorno', tipo: 'scatti', valori: [['no', false], ['sì', true]], leggi: () => R.blatteDiGiorno, scrivi: (v) => { R.blatteDiGiorno = v } },
    { nome: 'velocità', tipo: 'scorre', min: 0, max: 4, leggi: () => R.velocitaBestie, scrivi: (v) => { R.velocitaBestie = v }, testo: (v) => (v < 0.02 ? 'ferme' : `x${fmt(v)}`), tacche: () => [[0, 'ferme'], [1, '1'], [4, '4']] },
    tasti([['spaventale', () => S.b?.spaventa(), true], ['una zanzara davanti', () => S.b?.visita(), true]]),
  ]))
  fuori.push(sezione('l\'acqua', 1, 'la condensa', [
    { nome: 'gocce', tipo: 'scorre', min: 0.1, max: 5, log: true, leggi: () => R.goccia, scrivi: (v) => { R.goccia = v }, testo: (v) => (v < 1 ? `${fmt(1 / v, 1)} volte più spesso` : `x${fmt(v)} più rade`),
      tacche: () => [[0.1, 'fitte'], [1, '1'], [5, 'rade']] },
    tasti([['una goccia', () => S.a?.goccia(), true]]),
  ]))
  return fuori
}

// rimette tutto com'era: l'ora vera, la sera col tramonto, le auto a caso, la scena come si era caricata
function rimetti() {
  const P = pagina()
  P.orologio.fermo = false; P.orologio.veloce = 1; P.orologio.imposta(Date.now())
  for (const k in P.forza) P.forza[k] = null
  Object.assign(P.regola, { ogni: 55, fari: null, neon: null, sfarfallio: true })
  P.fermaAuto(null)
  const p = structuredClone(PREDEFINITI)
  Object.assign(R, p)
  document.documentElement.classList.remove('scena-allinea')
  P.aggiorna()
  for (const x of piste) x.rileggi()
  voce('tutto com\'era')
}

// ── in fondo: come va la scena (fotogrammi al secondo, qualità, luci, programmi), l'ora, il buio ──
function avviaConta() {
  if (giro) return
  let n = 0, t0 = performance.now(), fps = 0
  const passo = (now) => {
    if (!dlg.open) { giro = null; return }
    giro = requestAnimationFrame(passo)
    n++
    if (now - t0 < 500) return
    fps = Math.round((n * 1000) / (now - t0)); n = 0; t0 = now
    const S = scena(), voci = [[`${fps} fps`, fps < 40 ? 'rosso' : 'verde'], [hhmm(minuto(adesso())) + (pagina().orologio.fermo ? ' ferma' : pagina().orologio.veloce > 1 ? ` x${pagina().orologio.veloce}` : '')]]
    voci.push([`buio ${fmt(parseFloat(document.documentElement.style.getPropertyValue('--notte')) || 0)}`])
    if (S) {
      const info = S.renderer.info
      voci.push([`${S.qualita} ${fmt(S.dpr(), 2)}x`], [`luci ${S.insieme()}`], [`${info.programs?.length ?? 0} programmi`])
    } else voci.push(['senza 3D'])
    conta.innerHTML = voci.map(([t, c]) => `<li${c ? ` class="${c}"` : ''}>${t}</li>`).join('')
  }
  giro = requestAnimationFrame(passo)
}
