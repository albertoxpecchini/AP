// La regia di pzkko.it: il pannello per provare e regolare il sito, nello stile dei giochi (un foglio col nastro, le
// caselle stampate del tavolo, le fiches come pomelli). Dal 21.10 è a schede e leggera:
// - in cima a grafica (dal 23.10) «come parte»: le scelte di chi guarda, che restano nel browser (index.html,
//   window.pzkkoScelte e pzkkoPagina.scegli): il 3D spento o acceso (pzkko-3d: ricarica la pagina), l'ora sempre a
//   mezzogiorno o quella vera con la sera e la notte (pzkko-ora), il meteo sempre sole o quello vero (pzkko-meteo). Di
//   partenza: 2D, giorno, sole;
// - grafica: la qualità della scena 3D (auto, bassa, media, alta, ultra), cambiata dal vivo senza ricaricare, e i suoi
//   pezzi uno per uno (risoluzione, ombre, riflessi, bagliore, palazzi: «su misura»), i ritocchi, la vetrina, la luce
//   del portachiavi per terra. La qualità e la luce restano nel browser (scena.js, portachiavi.js);
// - ora e sera: l'ora di Mantova e la sua velocità, il buio, l'insegna, i lampioni, lo sfarfallio;
// - meteo: quello vero o uno scelto, quanto, il bagnato e la neve per terra, un lampo;
// - strada: le auto (quando, che fari, il neon sotto, una ferma), le bestie, le gocce;
// - suono: i suoni della strada (suono/, window.pzkkoSuono), acceso, il volume, ognuno da provare;
// - prove: il muro in trasparenza, rifare l'arrivo, il glTF, i numeri della scheda (il muro senza 3D, fino al 23.10 qui,
//   è l'interruttore del 3D in cima a grafica).
// In fondo come va la scena (fotogrammi al secondo, qualità, ora, buio, luci, meteo) e «rimetti tutto». Non è modale: la
// scena dietro cambia mentre si regola. Il resto non si salva: ricaricando torna com'era (tranne l'ora e la velocità,
// che le ricariche della regia si portano dietro nell'indirizzo se la regia le ha cambiate).
// Prima era un foglio lungo di piste in SVG col filtro dell'inchiostro, ridisegnate due volte al secondo, e la qualità
// ricaricava la pagina: con la pagina che ricalcolava lo stile a ogni fotogramma (index.html, fino al 21.10) la regia
// aperta portava la scena di sera a 67 fps su una 3060 Ti. Ora caselle e cursori sono HTML, e si tocca solo quello che
// cambia.
//
// index.html la apre col tasto giallo in alto a destra (.rotella), scrivendo «regia», con #regia nell'indirizzo o con
// cinque tocchi in fretta in cima allo schermo: import('/regia/regia.js').then((m) => m.apri()).
// Quello che comanda: window.pzkkoPagina (l'orologio, la sera, le auto, in index.html), window.pzkkoRegia (i ritocchi
// che la scena legge a ogni fotogramma, scena/materiali.js) e window.pzkkoScena (la grafica, le bestie, la goccia, il
// meteo, il portachiavi, i numeri in fondo).

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const fmt = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString('it-IT')
const limita = (x, a, b) => Math.min(b, Math.max(a, x))
const el = (tag, cls, testo) => { const e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e }

// i ritocchi della scena: gli stessi valori di partenza di scena/materiali.js (REGIA)
const PREDEFINITI = {
  esposizione: 1, bagliore: 1, neon: 1, specchi: true, vetrina: true,
  bestie: { formiche: true, mosche: true, zanzare: true, blatte: true }, blatteDiGiorno: false, velocitaBestie: 1, goccia: 1,
  meteo: null, intensita: 0.6, bagnato: null, manto: null,
}
// il meteo di partenza: il sole, o quello vero se lo si è scelto (window.pzkkoScelte.tempo, nella testa di index.html)
const tempo = () => (window.pzkkoScelte ? window.pzkkoScelte.tempo : null)
const R = (window.pzkkoRegia ??= { ...structuredClone(PREDEFINITI), meteo: tempo() })
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

// ricarica la pagina con dei parametri (l'arrivo, il 3D acceso o spento, il glTF), portandosi dietro la regia aperta e,
// se la regia li ha cambiati, l'ora e la velocità (se no la pagina riparte da sé: a mezzogiorno, o all'ora vera)
const ricarica = (cambia) => {
  const u = new URL(location.href), P = pagina(), o = P.orologio
  const corre = o.veloce > 1 && !o.fermo
  if (corre || Math.abs(o.adesso() - (P.partenza?.() ?? Date.now())) > 2 * 60000) u.searchParams.set('ora', hhmm(minuto(o.adesso())))
  else u.searchParams.delete('ora')
  if (corre) u.searchParams.set('veloce', o.veloce); else u.searchParams.delete('veloce')
  for (const [k, v] of Object.entries(cambia)) { if (v === null) u.searchParams.delete(k); else u.searchParams.set(k, v) }
  u.hash = 'regia'
  // (l'indirizzo nuovo al posto di quello di adesso, e si ricarica: assegnato a location.href, se cambiava solo il
  // #regia, o niente, il browser non ricaricava)
  history.replaceState(history.state, '', u.toString())
  location.reload()
}

// ── la finestra ──────────────────────────────────────────────────────────────
let dlg, voceEl, corpo, schede, conta, controlli = [], giro = 0, scheda = 'grafica', conSuono = false
const SCHEDE = [['grafica', 'grafica'], ['ora', 'ora e sera'], ['meteo', 'meteo'], ['strada', 'strada'], ['suono', 'suono'], ['prove', 'prove']]
const rotella = () => document.querySelector('.rotella')

export async function apri() {
  if (!dlg) await costruisci()
  // (il tasto giallo, o scrivere «regia» di nuovo: la chiude)
  if (dlg.open) return chiudi()
  dlg.classList.remove('chiude', 'giu')
  dlg.show()
  rotella()?.setAttribute('aria-expanded', 'true')
  // (senza rubare il fuoco alla pagina: si apre, non si entra; dal tasto giallo il fuoco resta sul tasto)
  if (!document.activeElement?.closest?.('.rotella')) document.activeElement?.blur?.()
  if (!conSuono && window.pzkkoSuono) riempiSuono()
  rileggi(true)
  avviaConta()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  rotella()?.setAttribute('aria-expanded', 'false')
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
  try { scheda = localStorage.getItem('pzkko-regia-scheda') || scheda } catch {}
  if (!SCHEDE.some(([k]) => k === scheda)) scheda = 'grafica'
  dlg = document.createElement('dialog')
  dlg.className = 'rg'
  dlg.setAttribute('aria-labelledby', 'rg-titolo')
  dlg.innerHTML = `
    <img class="rg-nastro rg-n1" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <img class="rg-nastro rg-n2" src="${ART}nastro/carta-gommata.webp" alt="" width="483" height="183">
    <div class="rg-dentro">
      <header class="rg-testa">
        <h2 id="rg-titolo">regia</h2>
        <p class="rg-voce" aria-live="polite">scegli e guarda</p>
        <button class="rg-tondo rg-abbassa" type="button" aria-label="abbassa la regia"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 15c4 4 7 7 11 11 4-4 8-8 11-11"/></svg></button>
        <button class="rg-tondo rg-chiudi" type="button" aria-label="chiudi la regia"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="rg-schede" role="tablist" aria-label="le parti della regia"></div>
      <div class="rg-corpo"></div>
      <footer class="rg-piede"><ul class="rg-conta" aria-label="come va la scena"></ul><button class="rg-piccolo rg-rimetti" type="button">rimetti tutto</button></footer>
    </div>`
  document.body.appendChild(dlg)
  voceEl = dlg.querySelector('.rg-voce')
  conta = dlg.querySelector('.rg-conta')
  corpo = dlg.querySelector('.rg-corpo')
  schede = dlg.querySelector('.rg-schede')
  dlg.querySelector('.rg-chiudi').addEventListener('click', chiudi)
  dlg.querySelector('.rg-abbassa').addEventListener('click', () => dlg.classList.toggle('giu'))
  dlg.querySelector('.rg-rimetti').addEventListener('click', rimetti)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.open) chiudi() })

  // le schede: una pagina alla volta; frecce, inizio e fine per passare dall'una all'altra
  for (const [k, t] of SCHEDE) {
    const b = el('button', 'rg-scheda', t)
    b.type = 'button'; b.id = `rg-s-${k}`; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', `rg-p-${k}`); b.dataset.k = k
    b.addEventListener('click', () => mostra(k))
    b.addEventListener('keydown', (e) => {
      const i = SCHEDE.findIndex(([x]) => x === k), j = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: SCHEDE.length - 1 }[e.key]
      if (j === undefined) return
      e.preventDefault()
      const n = SCHEDE[(j + SCHEDE.length) % SCHEDE.length][0]
      mostra(n); schede.querySelector(`[data-k="${n}"]`).focus()
    })
    schede.appendChild(b)
    const p = el('div', 'rg-pagina')
    p.id = `rg-p-${k}`; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.tabIndex = -1
    corpo.appendChild(p)
  }
  riempi()
  mostra(scheda)
  // la scena: se sta ancora arrivando (la regia aperta durante il caricamento, o dopo una delle sue ricariche, che la
  // riaprono con #regia prima che il 3D ci sia) le sue parti dicono «il 3D arriva» e si rifanno appena la scena c'è
  if (!scena() && document.documentElement.classList.contains('scena-carico')) {
    const t = setInterval(() => {
      if (scena() || !document.documentElement.classList.contains('scena-carico')) { clearInterval(t); riempi(); if (dlg.open) rileggi(true) }
    }, 250)
  }
  // quello che cambia da solo (l'ora che passa, la sera che cala, l'auto che scende): si rilegge due volte al secondo,
  // solo la scheda aperta, e si tocca solo quello che è cambiato
  setInterval(() => { if (dlg.open) rileggi() }, 500)
}

function mostra(k) {
  scheda = k
  try { localStorage.setItem('pzkko-regia-scheda', k) } catch {}
  for (const b of schede.children) { const s = b.dataset.k === k; b.setAttribute('aria-selected', String(s)); b.tabIndex = s ? 0 : -1 }
  for (const p of corpo.children) p.hidden = p.id !== `rg-p-${k}`
  corpo.scrollTop = 0
  rileggi(true)
}

// le pagine si (ri)fanno tutte insieme: all'inizio e quando arriva la scena. Ogni controllo sa in che pagina sta, così
// quelli delle schede chiuse non si rileggono
let inCostruzione = null
const pag = (k) => corpo.querySelector(`#rg-p-${k}`)
const metti = (k, figli) => { inCostruzione = pag(k); controlli = controlli.filter((c) => c.pagina !== inCostruzione); inCostruzione.replaceChildren(...figli()); inCostruzione = null }
function riempi() {
  const S = scena(), arriva = !S && document.documentElement.classList.contains('scena-carico')
  metti('grafica', () => [...comeParte(), ...(S ? paginaGrafica(S) : arriva ? attesa() : senza3d())])
  metti('ora', paginaOra)
  metti('meteo', () => (S ? paginaMeteo(S) : arriva ? attesa() : [titolo('il meteo', 100), nota('il meteo si vede solo nella scena 3D, che qui è spenta (si accende in cima alla scheda «grafica»): sul muro di sempre non piove mai.')]))
  metti('strada', () => paginaStrada(S))
  riempiSuono()
  metti('prove', () => paginaProve(S))
}
// (i suoni arrivano per conto loro: se la regia si è fatta prima, la loro pagina si rifà quando si apre)
const riempiSuono = () => { conSuono = !!window.pzkkoSuono; metti('suono', paginaSuono) }
const attesa = () => [nota('il 3D sta arrivando: le sue regole compaiono qui appena la strada si vede.')]
const senza3d = () => [nota(pagina().scelte?.scena
  ? 'il 3D è acceso ma qui non è partito (niente WebGL2, o un errore: lo dice la console). resta il muro di sempre, con l\'ora, la sera, le auto e i suoni.'
  : 'il 3D è spento: questo è il muro di sempre, con l\'ora, la sera, le auto e i suoni. la qualità e i ritocchi della scena compaiono qui quando lo si accende.')]

// ── come parte la pagina: le scelte di chi guarda, che restano nel browser (dal 23.10) ──
// di partenza la pagina è il muro di sempre, in 2D, a mezzogiorno col sole; il 3D (pzkko-3d), l'ora vera con la sera e
// la notte (pzkko-ora) e il meteo vero (pzkko-meteo) si accendono qui, apposta. pzkkoPagina.scegli (index.html) le
// ricorda e mette subito l'ora e il meteo; il 3D si accende e si spegne ricaricando la pagina (senza ?scena e ?muro)
const comeParte = () => {
  const P = pagina(), C = () => P.scelte ?? {}
  return [
    titolo('come parte', 25),
    caselle('3D', [['spento', false], ['acceso', true]], () => !!C().scena, (v) => {
      const prima = !!C().scena
      P.scegli?.('scena', v)
      if (v !== prima) ricarica({ muro: null, scena: null })
    }),
    caselle('ora', [['sempre giorno', 'giorno'], ['vera (con la notte)', 'vera']], () => C().ora ?? 'vera', (v) => P.scegli?.('ora', v)),
    caselle('meteo', [['sempre sole', 'sole'], ['vero', 'vero']], () => C().meteo ?? 'vero', (v) => P.scegli?.('meteo', v)),
    nota('restano in questo browser. il 3D si accende e si spegne ricaricando la pagina; l\'ora e il meteo cambiano subito (il meteo si vede solo nel 3D).'),
  ]
}

// ── i controlli ──────────────────────────────────────────────────────────────
// ognuno ha leggi() (il valore vero) e mette(v) (lo mostra); rileggi() li confronta con quello che mostrano: due volte al
// secondo solo i vivi (quelli che cambiano da soli), tutti quando si tocca qualcosa o si apre
const registra = (c) => { c.pagina = inCostruzione; controlli.push(c); return c }
function rileggi(tutti = false) {
  for (const c of controlli) {
    if (c.pagina?.hidden || (!tutti && !c.vivo)) continue
    let v
    try { v = c.leggi() } catch { continue }
    const k = JSON.stringify(v) ?? 'undefined'
    if (k !== c.mostrato) { c.mostrato = k; c.mette(v) }
  }
}
const riga = (nome, ...dentro) => {
  const r = el('div', 'rg-riga')
  const n = el('span', 'rg-nome', nome), b = el('b', 'rg-val')
  n.appendChild(b)
  r.append(n, ...dentro)
  return { r, val: b }
}
const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// le caselle: una scelta fra pochi valori [testo, valore]; quella scelta evidenziata col giallo. Frecce per spostarsi
function caselle(nome, valori, leggi, scrivi, { vivo = false } = {}) {
  const g = el('div', 'rg-caselle')
  g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', nome)
  const { r, val } = riga(nome, g)
  const bottoni = valori.map(([t, v]) => {
    const b = el('button', 'rg-casella', t)
    b.type = 'button'; b.setAttribute('role', 'radio')
    b.addEventListener('click', () => { scrivi(v); voce(`${nome}: ${t}`); rileggi(true) })
    g.appendChild(b)
    return b
  })
  g.addEventListener('keydown', (e) => {
    const i = bottoni.indexOf(document.activeElement), d = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key]
    if (i < 0 || !d) return
    e.preventDefault()
    const j = (i + d + bottoni.length) % bottoni.length
    bottoni[j].focus(); bottoni[j].click()
  })
  registra({ vivo, leggi, mette: (v) => {
    const i = valori.findIndex(([, x]) => uguali(x, v))
    bottoni.forEach((b, j) => { b.setAttribute('aria-checked', String(j === i)); b.tabIndex = j === Math.max(0, i) ? 0 : -1 })
    val.textContent = i >= 0 ? '' : 'su misura'
  } })
  return r
}
// i bottoni sì/no, ognuno per conto suo (le bestie)
function interruttori(nome, voci) {
  const g = el('div', 'rg-caselle')
  g.setAttribute('role', 'group'); g.setAttribute('aria-label', nome)
  const { r } = riga(nome, g)
  for (const [t, leggi, scrivi] of voci) {
    const b = el('button', 'rg-casella', t)
    b.type = 'button'
    b.addEventListener('click', () => { const v = !leggi(); scrivi(v); voce(`${t}: ${v ? 'sì' : 'no'}`); rileggi(true) })
    g.appendChild(b)
    registra({ leggi, mette: (v) => b.setAttribute('aria-pressed', String(!!v)) })
  }
  return r
}
// il cursore: un valore continuo fra min e max (log: in scala logaritmica), la fiche come pomello, l'evidenziatore fino al
// valore, le tacche sotto, i segni in rosso (l'alba, il tramonto); con auto, una casella a sinistra che vale null («segue
// da solo»: il pomello mostra il valore che sta seguendo). La tastiera è quella del cursore del browser
function cursore(nome, def, fiche = 25) {
  const { min, max, log, passo } = def
  const norm = (v) => (log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min))
  const denorm = (k) => { let v = log ? min * (max / min) ** k : min + k * (max - min); if (passo) v = Math.round(v / passo) * passo; return v }
  const box = el('div', 'rg-cursore')
  const auto = def.auto ? el('button', 'rg-casella rg-auto', def.autoNome ?? 'auto') : null
  const pista = el('div', 'rg-pista')
  const input = el('input')
  input.type = 'range'; input.min = 0; input.max = 1000; input.step = 1
  input.setAttribute('aria-label', nome)
  pista.style.setProperty('--fiche', `url(${ART}fiches/f${fiche}.webp)`)
  const sotto = el('div', 'rg-tacche'), segni = el('div', 'rg-segni')
  sotto.setAttribute('aria-hidden', 'true'); segni.setAttribute('aria-hidden', 'true')
  for (const [v, t] of def.tacche ?? []) { const s = el('span', null, t); s.style.left = `${limita(norm(v), 0, 1) * 100}%`; sotto.appendChild(s) }
  pista.append(input, sotto, segni)
  if (auto) {
    auto.type = 'button'
    auto.addEventListener('click', () => {
      const v = def.leggi() === null ? def.autoValore?.() ?? denorm(Number(input.value) / 1000) : null
      def.scrivi(v); voce(`${nome}: ${v === null ? def.autoTesto?.() ?? 'auto' : def.testo(v)}`); rileggi(true)
    })
    box.appendChild(auto)
  }
  box.appendChild(pista)
  const { r, val } = riga(nome, box)
  let presa = false
  input.addEventListener('input', () => { presa = true; const v = denorm(Number(input.value) / 1000); def.scrivi(v); voce(`${nome}: ${def.testo(v)}`); mostraV(v) })
  input.addEventListener('change', () => { presa = false; rileggi(true) })
  const mostraV = (v) => {
    const k = limita(norm(v === null ? def.autoValore?.() ?? min : v), 0, 1)
    if (!presa) input.value = String(Math.round(k * 1000))
    pista.style.setProperty('--k', k.toFixed(4))
    pista.classList.toggle('in-auto', v === null)
    auto?.setAttribute('aria-pressed', String(v === null))
    const t = v === null ? def.autoTesto?.() ?? 'auto' : def.testo(v)
    val.textContent = t
    input.setAttribute('aria-valuetext', t)
  }
  registra({ vivo: def.vivo, leggi: () => (def.leggi() === null && def.autoValore ? { auto: def.autoValore() } : def.leggi()), mette: (x) => {
    mostraV(x?.auto !== undefined ? null : x)
    // (i segni rossi cambiano solo col giorno: l'alba e il tramonto)
    if (def.segni) {
      const s = def.segni(), k = JSON.stringify(s.map(([x]) => Math.round(x)))
      if (k !== segni.dataset.k) { segni.dataset.k = k; segni.replaceChildren(...s.map(([x, t]) => { const e = el('span', null, t); e.style.left = `${limita(norm(x), 0, 1) * 100}%`; return e })) }
    }
  } })
  return r
}
const tasti = (lista) => {
  const d = el('div', 'rg-tasti')
  for (const [t, fa, grosso] of lista) {
    const b = el('button', grosso ? 'rg-gira' : 'rg-piccolo', t)
    b.type = 'button'
    b.addEventListener('click', () => { fa(); voce(t); rileggi(true) })
    d.appendChild(b)
  }
  return d
}
const nota = (t) => el('p', 'rg-nota', t)
// una nota che si riscrive da sola (la qualità di adesso, i dati del meteo, i numeri della scheda)
const notaViva = (testo) => { const p = nota(''); registra({ vivo: true, leggi: testo, mette: (t) => { p.textContent = t } }); return p }
const titolo = (t, fiche) => { const h = el('h3', 'rg-titolo'); h.innerHTML = `<img src="${ART}fiches/f${fiche}.webp" alt="" width="170" height="174">`; h.append(t); return h }

// ── che cosa si comanda ──────────────────────────────────────────────────────
const si = [['sì', true], ['no', false]]
const RIS = [['1×', 1], ['1,5×', 1.5], ['2×', 2]]
const OMBRE = [['512', 512], ['1024', 1024], ['2048', 2048], ['4096', 4096]]
const RIFLESSI = [['spenti', null], ['bassi', [256, 256]], ['medi', [512, 384]], ['alti', [1024, 1024]], ['tanti', [1536, 2048]]]
const BAGLIORE = [['spento', 0], ['metà', 0.5], ['pieno', 1]]

// la grafica: la qualità (dal vivo), i suoi pezzi su misura, i ritocchi, la vetrina, il portachiavi
function paginaGrafica(S) {
  const G = () => S.grafica()
  // i pezzi su misura: partono dai valori di adesso (la risoluzione su misura arriva fino a 4 pixel interni per pixel CSS)
  const su = (x) => S.imposta('su misura', x)
  // il telefono: la scena minima, niente da scegliere (scena.js); i ritocchi che contano anche lì e il portachiavi
  if (G().modo === 'telefono') return [
    titolo('la qualità', 25),
    nota('sul telefono la scena è una sola, la più leggera: alla risoluzione dello schermo, senza anti-alias, ombre, riflessi, bagliore né post-processing. niente da scegliere.'),
    notaViva(() => { const g = G(), c = S.renderer.domElement; return `adesso: ${fmt(g.dpr)} pixel per pixel, la tela ${c.width} × ${c.height}.` }),
    titolo('i ritocchi', 5),
    cursore('esposizione', { min: 0.25, max: 4, log: true, leggi: () => R.esposizione, scrivi: (v) => { R.esposizione = v }, testo: (v) => `x${fmt(v)}`, tacche: [[0.25, '¼'], [1, '1'], [4, '4']] }, 5),
    cursore('luce dell\'insegna', { min: 0, max: 3, leggi: () => R.neon, scrivi: (v) => { R.neon = v }, testo: (v) => (v < 0.01 ? 'spenta' : `x${fmt(v)}`), tacche: [[0, 'spenta'], [1, '1'], [3, '3']] }, 5),
    ...portachiavi(S),
  ]
  return [
    titolo('la qualità', 25),
    caselle('qualità', [['auto', 'auto'], ['bassa', 'bassa'], ['media', 'media'], ['alta', 'alta'], ['ultra', 'ultra'], ['su misura', 'su misura']],
      () => G().modo, (v) => { if (v === 'su misura') su({}); else S.imposta(v) }),
    notaViva(() => {
      const g = G(), c = S.renderer.domElement
      let t = `adesso: «${g.livello}»${g.modo === 'su misura' ? ' su misura' : ''}, ${fmt(g.dpr)} pixel per pixel, la tela ${c.width} × ${c.height}.`
      if (g.modo === 'auto') t += g.adattata ? ` auto è scesa da «${g.adattata.da}» a «${g.adattata.a}»: ${g.adattata.ms} ms a fotogramma.` : ' auto sceglie dalla scheda grafica e scende se non ce la fa.'
      // (il browser che dice limiti piccoli: la tela non può passarli, se no resta nera)
      if (g.dpr < g.voluta - 0.01) t += ` il browser dice che la scheda arriva a ${g.lato} pixel per lato: la risoluzione si ferma a ${fmt(g.dpr)}× (il livello vorrebbe ${fmt(g.voluta)}×).${g.lato <= 4096 ? ' succede con firefox e librewolf quando la protezione dalle impronte è accesa (privacy.resistFingerprinting): finge una scheda da 2048 pixel e tiene ogni pagina a 60 fotogrammi al secondo. per questo sito la si può togliere (privacy.resistFingerprinting.exemptedDomains in about:config): torna la risoluzione vera, ma i 60 restano finché la protezione è accesa.' : ''}`
      if (g.prova) t += ' l\'indirizzo ha ?qualita= o ?dpr=: alla prossima apertura comanda lui.'
      return t
    }),
    caselle('risoluzione', RIS, () => G().liv.scala, (v) => su({ scala: v, max: 4, mp: 4 + 6.3 * v })),
    caselle('ombre', OMBRE, () => G().liv.ombra, (v) => su({ ombra: v })),
    caselle('riflessi', RIFLESSI, () => G().liv.specchi ?? null, (v) => su({ specchi: v })),
    caselle('bagliore', BAGLIORE, () => G().liv.bloom, (v) => su({ bloom: v })),
    caselle('palazzi di fronte', si, () => G().liv.palazzi !== false, (v) => su({ palazzi: v })),
    nota(`${S.M.telefono ? 'sul telefono «auto» è la qualità del telefono. ' : ''}la scelta resta in questo browser. le luci della notte (adesso ${G().poche ? 'poche' : 'tutte'}) si decidono aprendo la pagina: con «bassa» e «media» poche, dalla volta dopo.`),
    titolo('i ritocchi', 5),
    cursore('esposizione', { min: 0.25, max: 4, log: true, leggi: () => R.esposizione, scrivi: (v) => { R.esposizione = v }, testo: (v) => `x${fmt(v)}`, tacche: [[0.25, '¼'], [1, '1'], [4, '4']] }, 5),
    cursore('forza del bagliore', { min: 0, max: 3, leggi: () => R.bagliore, scrivi: (v) => { R.bagliore = v }, testo: (v) => (v < 0.01 ? 'niente' : `x${fmt(v)}`), tacche: [[0, 'niente'], [1, '1'], [3, '3']] }, 5),
    cursore('luce dell\'insegna', { min: 0, max: 3, leggi: () => R.neon, scrivi: (v) => { R.neon = v }, testo: (v) => (v < 0.01 ? 'spenta' : `x${fmt(v)}`), tacche: [[0, 'spenta'], [1, '1'], [3, '3']] }, 5),
    caselle('vetrina col mouse', si, () => R.vetrina !== false, (v) => { R.vetrina = v }),
    ...portachiavi(S),
  ]
}
const portachiavi = (S) => [
  titolo('il portachiavi', 500),
  caselle('luce del display', [['accesa', true], ['spenta', false]], () => S.pc.luce, (v) => { S.pc.luce = v }, { vivo: true }),
  nota('il token della banca $pzk perso per terra accanto al chiusino, in fondo alla pagina: dice i fotogrammi al secondo. si accende e si spegne anche col suo tasto giallo, toccandolo.'),
]

// l'ora e la sera (della pagina: ci sono anche senza 3D)
function paginaOra() {
  const P = pagina()
  const tre = (spenta, accesa) => [['auto', null], [spenta, 0], [accesa, 1]]
  return [
    titolo('il tempo', 500),
    notaViva(() => (P.scelte?.ora === 'vera' ? 'si parte all\'ora vera di mantova, con la sera e la notte' : 'si parte sempre a mezzogiorno, fermi') + ': si sceglie in cima alla scheda «grafica». qui si prova, e ricaricando torna com\'era.'),
    cursore('ora', { min: 0, max: 1439, passo: 1, vivo: true, leggi: () => Math.floor(minuto(adesso())), scrivi: vai, testo: hhmm,
      tacche: [0, 6, 12, 18, 24].map((h) => [Math.min(1439, h * 60), String(h)]), segni: () => { const s = sole(); return [[s.alba, 'alba'], [s.tramonto, 'tramonto']] } }, 500),
    caselle('velocità', [['ferma', 0], ['x1', 1], ['x10', 10], ['x60', 60], ['x600', 600]], () => (P.orologio.fermo ? 0 : P.orologio.veloce),
      (v) => { P.orologio.fermo = v === 0; if (v) P.orologio.veloce = v; P.aggiorna() }),
    tasti([
      ['alba', () => vai(sole().alba - 15)], ['mezzogiorno', () => vai(12 * 60)], ['tramonto', () => vai(sole().tramonto - 5)],
      ['sera', () => vai(sole().tramonto + 55)], ['mezzanotte', () => vai(0)], ['adesso', () => { P.orologio.imposta(Date.now()); P.aggiorna() }],
    ]),
    titolo('la sera', 100),
    cursore('buio', { min: 0, max: 1, auto: true, vivo: true, leggi: () => P.forza.notte, scrivi: (v) => { P.forza.notte = v; P.aggiorna() },
      testo: (v) => fmt(v), autoValore: () => P.luci.notte, autoTesto: () => `auto · ${fmt(P.luci.notte)}`, tacche: [[0, 'giorno'], [1, 'notte']] }, 100),
    caselle('insegna', tre('spenta', 'accesa'), () => P.forza.insegna, (v) => { P.forza.insegna = v; P.aggiorna() }),
    caselle('lampioni', tre('spenti', 'accesi'), () => P.forza.lampioni, (v) => { P.forza.lampioni = v; P.aggiorna() }),
    caselle('sfarfallio', si, () => P.regola.sfarfallio, (v) => { P.regola.sfarfallio = v }),
    nota('auto = col tramonto di mantova: il buio da 40 minuti prima, l\'insegna al tramonto, i lampioni 12 minuti dopo.'),
  ]
}

// il meteo: quello vero di Mantova (/api/meteo, ogni dieci minuti) o uno scelto, quanto è forte; il bagnato e la neve per
// terra vanno da soli col meteo (auto) o si fissano
function paginaMeteo(S) {
  const M = S.meteo
  return [
    titolo('il meteo', 100),
    notaViva(() => (pagina().scelte?.meteo === 'vero' ? 'si parte col meteo vero di mantova' : 'si parte sempre col sole') + ': si sceglie in cima alla scheda «grafica». qui si prova, e ricaricando torna com\'era.'),
    caselle('tempo', [['vero', null], ['sole', 'sole'], ['nuvole', 'nuvoloso'], ['nebbia', 'nebbia'], ['pioggia', 'pioggia'], ['tuoni', 'temporale'], ['neve', 'neve']],
      () => R.meteo, (v) => { R.meteo = v }),
    cursore('quanto', { min: 0, max: 1, leggi: () => R.intensita, scrivi: (v) => { R.intensita = v }, testo: (v) => fmt(v), tacche: [[0, 'poco'], [1, 'tanto']] }, 1),
    cursore('bagnato', { min: 0, max: 1, auto: true, vivo: true, leggi: () => R.bagnato, scrivi: (v) => { R.bagnato = v }, testo: (v) => fmt(v),
      autoValore: () => M.bagnato, autoTesto: () => `auto · ${fmt(M.bagnato)}`, tacche: [[0, 'asciutto'], [1, 'fradicio']] }, 1),
    cursore('neve per terra', { min: 0, max: 1, auto: true, vivo: true, leggi: () => R.manto, scrivi: (v) => { R.manto = v }, testo: (v) => fmt(v),
      autoValore: () => M.manto, autoTesto: () => `auto · ${fmt(M.manto)}`, tacche: [[0, 'niente'], [1, 'tutta']] }, 1),
    tasti([['un lampo', () => S.me?.lampo(), true]]),
    notaViva(() => {
      const d = M.dati
      return d ? `a mantova adesso: codice ${d.codice}, nuvole ${d.nuvole}%, ${fmt(d.pioggia, 1)} mm di pioggia (${fmt(d.pioggia12, 1)} nelle ultime 12 ore), visibilità ${d.visibilita >= 1000 ? fmt(d.visibilita / 1000, 1) + ' km' : Math.round(d.visibilita) + ' m'}, vento ${Math.round(d.vento)} km/h, ${fmt(d.temperatura, 1)}°. in scena: ${M.testo}.`
        : R.meteo || new URLSearchParams(location.search).has('meteo') ? `i dati veri di mantova si chiedono solo col tempo «vero». in scena: ${M.testo}.`
        : `i dati veri non ci sono (in locale /api/meteo non risponde): «vero» è il dopo pioggia di sempre. in scena: ${M.testo}.`
    }),
  ]
}

// la strada: le auto (della pagina), le bestie e le gocce (della scena)
function paginaStrada(S) {
  const P = pagina()
  const fuori = [
    titolo('le auto', 5),
    tasti([['passa un\'auto', () => P.passaAuto(), true]]),
    cursore('ogni', { min: 5, max: 180, log: true, passo: 1, leggi: () => P.regola.ogni, scrivi: (v) => { P.regola.ogni = v }, testo: (v) => `${v} s`,
      tacche: [[5, '5 s'], [15, '15'], [60, '1 min'], [180, '3 min']] }, 5),
    caselle('fari', [['a caso', null], ['alogeni', 0], ['led', 1], ['xeno', 2]], () => P.regola.fari, (v) => { P.regola.fari = v }),
    caselle('neon sotto', [['a caso', null], ['sì', true], ['no', false]], () => P.regola.neon, (v) => { P.regola.neon = v }),
    cursore('ferma', { min: -0.2, max: 1.2, auto: true, autoNome: 'passa', leggi: () => P.regola.ferma, scrivi: (v) => P.fermaAuto(v),
      testo: (v) => `ferma a ${fmt(v)}`, autoValore: () => 0.5, autoTesto: () => 'passa e va', tacche: [[0, 'sinistra'], [0.5, 'davanti'], [1, 'destra']] }, 5),
    nota('di notte, coi lampioni accesi, ne passa una ogni 20–90 secondi; «passa un\'auto» la fa passare anche di giorno.'),
  ]
  if (!S) return [...fuori, nota('le bestie e le gocce sono della scena 3D.')]
  fuori.push(
    titolo('le bestie', 1),
    interruttori('quali', ['formiche', 'mosche', 'zanzare', 'blatte'].map((n) => [n, () => R.bestie[n], (v) => { R.bestie[n] = v }])),
    caselle('blatte di giorno', [['no', false], ['sì', true]], () => R.blatteDiGiorno, (v) => { R.blatteDiGiorno = v }),
    cursore('velocità', { min: 0, max: 4, leggi: () => R.velocitaBestie, scrivi: (v) => { R.velocitaBestie = v }, testo: (v) => (v < 0.02 ? 'ferme' : `x${fmt(v)}`), tacche: [[0, 'ferme'], [1, '1'], [4, '4']] }, 1),
    tasti([['spaventale', () => S.b?.spaventa(), true], ['una zanzara davanti', () => S.b?.visita(), true]]),
    titolo('l\'acqua', 1),
    cursore('gocce', { min: 0.1, max: 5, log: true, leggi: () => R.goccia, scrivi: (v) => { R.goccia = v }, testo: (v) => (v < 1 ? `${fmt(1 / v, 1)} volte più spesso` : `x${fmt(v)} più rade`),
      tacche: [[0.1, 'fitte'], [1, '1'], [5, 'rade']] }, 1),
    tasti([['una goccia', () => S.a?.goccia(), true]]),
  )
  return fuori
}

// i suoni della strada (suono/): acceso o no (si ricorda, come il nastro in basso a sinistra), il volume, e ogni suono
// che capita da solo, adesso
function paginaSuono() {
  const U = window.pzkkoSuono
  if (!U) return [titolo('il suono', 25), nota('i suoni della strada non ci sono ancora: partono al primo tocco o tasto sulla pagina.')]
  const prova = (lista) => tasti(lista.map(([t, n]) => [t, () => U.prova(n)]))
  return [
    titolo('il suono', 25),
    caselle('suono', si, () => U.acceso, (v) => U.accendi(v, true), { vivo: true }),
    cursore('volume', { min: 0, max: 1, leggi: () => U.volume, scrivi: (v) => { U.volume = v }, testo: (v) => `${Math.round(v * 100)}%`, tacche: [[0, 'zitto'], [1, 'forte']] }, 25),
    nota('tutto sintetizzato. da provare:'),
    prova([['le campane', 'campane'], ['mezzogiorno', 'mezzogiorno'], ['un tuono', 'tuono'], ['bussa', 'bussa']]),
    prova([['campanello', 'campanello'], ['vetro', 'vetro'], ['maniglione', 'maniglione'], ['lattina', 'lattina'], ['pozza', 'pozza'], ['chiusino', 'chiusino'], ['cartello', 'cartello'], ['asse delle zucche', 'legno'], ['carta', 'carta'], ['la biro', 'penna']]),
    prova([['passeri', 'passeri'], ['tortora', 'tortora'], ['piccioni', 'piccioni'], ['cornacchia', 'cornacchia'], ['rondoni', 'rondoni'], ['merlo', 'merlo'], ['civetta', 'civetta'], ['allocco', 'allocco']]),
    prova([['motorino', 'motorino'], ['clacson', 'clacson'], ['tapparella', 'tapparella']]),
    nota('l\'auto, la pioggia, la zanzara davanti e la goccia si provano dalle loro schede: si sentono da dove sono.'),
  ]
}

// le prove: quello che ricarica la pagina, e i numeri della scheda
function paginaProve(S) {
  const fuori = [titolo('le prove', 25)]
  if (!S) return [...fuori, nota('le prove sono della scena 3D: si accende in cima alla scheda «grafica» (o con ?scena=1 nell\'indirizzo).')]
  return [
    ...fuori,
    caselle('il muro sotto', [['no', false], ['in trasparenza', true]], () => document.documentElement.classList.contains('scena-allinea'),
      (v) => { if (v) window.pzkkoTrattenute?.(); document.documentElement.classList.toggle('scena-allinea', v) }),
    tasti([['rifai l\'arrivo', () => ricarica({ intro: null })], ['scarica il .glb', () => ricarica({ glb: 1 })]]),
    nota('questi due ricaricano la pagina (l\'ora e la velocità restano, se le hai cambiate). il muro senza 3D: l\'interruttore in cima alla scheda «grafica».'),
    notaViva(() => {
      const i = S.renderer.info, gl = S.renderer.getContext(), d = gl.getExtension('WEBGL_debug_renderer_info')
      const nome = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)).replace(/^ANGLE \(|\)$/g, '') : 'non si fa riconoscere'
      return `la scheda: ${nome}. ${i.programs?.length ?? 0} programmi; nell'ultimo passaggio ${i.render.calls} disegni, ${Math.round(i.render.triangles / 1000)} mila triangoli. luci «${S.insieme()}».`
    }),
  ]
}

// rimette tutto com'era: l'ora di partenza (mezzogiorno, o quella vera se la si è scelta), la sera col tramonto, le auto
// a caso, il volume, i ritocchi della scena e il meteo di partenza (la grafica, la luce del portachiavi e le scelte di
// «come parte» no: sono scelte che restano)
function rimetti() {
  const P = pagina()
  for (const k in P.forza) P.forza[k] = null
  if (P.rimettiOra) P.rimettiOra()
  else { P.orologio.fermo = false; P.orologio.veloce = 1; P.orologio.imposta(Date.now()) }
  Object.assign(P.regola, { ogni: 55, fari: null, neon: null, sfarfallio: true })
  P.fermaAuto(null)
  if (window.pzkkoSuono) window.pzkkoSuono.volume = 0.7
  Object.assign(R, structuredClone(PREDEFINITI), { meteo: tempo() })
  document.documentElement.classList.remove('scena-allinea')
  P.aggiorna()
  rileggi(true)
  voce('tutto com\'era (la grafica e «come parte» restano)')
}

// ── in fondo: come va la scena (fotogrammi al secondo, qualità, ora, buio, luci, meteo) ──
// (le voci sono sempre le stesse: si cambia solo il testo, e solo se è cambiato)
function avviaConta() {
  if (giro) return
  const voci = Array.from({ length: 6 }, () => conta.appendChild(el('li')))
  let n = 0, t0 = performance.now()
  const scrivi = (li, t, c = '') => { if (li.textContent !== t) li.textContent = t; if (li.className !== c) li.className = c; li.hidden = !t }
  const passo = (now) => {
    if (!dlg.open) { giro = 0; conta.replaceChildren(); return }
    giro = requestAnimationFrame(passo)
    n++
    if (now - t0 < 500) return
    const S = scena(), P = pagina()
    // (con la scena: i suoi fotogrammi; senza, quelli del browser)
    const fps = Math.round(S ? S.fps() : (n * 1000) / (now - t0))
    n = 0; t0 = now
    scrivi(voci[0], `${fps} fps`, fps < 40 ? 'rosso' : 'verde')
    scrivi(voci[1], hhmm(minuto(adesso())) + (P.orologio.fermo ? ' ferma' : P.orologio.veloce > 1 ? ` x${P.orologio.veloce}` : ''))
    scrivi(voci[2], `buio ${fmt(P.luci.notte)}`)
    const g = S?.grafica()
    scrivi(voci[3], g ? `${g.livello} ${fmt(g.dpr)}×` : 'senza 3D')
    scrivi(voci[4], S ? `luci ${S.insieme()}` : '')
    scrivi(voci[5], S ? S.meteo.testo : '')
  }
  giro = requestAnimationFrame(passo)
}
