// La petizione di pzkko.it, «pzkko.it è un bel sito?» (index.html, #petizione): il foglio attaccato alla saracinesca
// con le firme vere (api/firme.mjs) e le tre bic legate allo spago. Toccandolo il foglio si stacca dal muro e si
// avvicina; si sceglie la penna (la blu è senza cappuccio, alle altre salta via quando si comincia), si scrive il nome e
// la penna lo scrive davvero sul foglio, con la data, l'ora e lo scarabocchio della firma; poi il foglio torna al suo
// posto, con la firma nuova in fondo, e la vede chiunque apra la pagina.
//
// L'animazione: il foglio grande è già della sua misura finale e parte rimpicciolito e storto sopra quello del muro
// (FLIP: solo transform e opacity, che il browser compone sulla scheda grafica senza ridisegnare la pagina), così resta
// nitido dall'inizio alla fine e non scatta; mentre è aperto la scena 3D sotto si riposa (evento pzkko-petizione, che
// ascoltano anche scena/fogli.js e scena/penne.js per togliere e rimettere il foglio e le penne 3D). Le penne sono
// pendoli smorzati; quella che scrive tiene la punta sulla scrittura disegnata da firme.js, inclinata come in una mano,
// con lo spago che si allenta e si tende.
import { caratteri, chiedi, firme as stato, ascolta, aggiorna, disegna, data, ora, PENNE, INCHIOSTRO, COLONNE } from './firme.js'

const root = document.documentElement
const ridotto = matchMedia('(prefers-reduced-motion: reduce)')
const in3d = () => root.classList.contains('scena3d')
const suona = (nome, d = {}) => window.pzkkoSuono?.evento(nome, d)
const avvisa = (fase) => document.dispatchEvent(new CustomEvent('pzkko-petizione', { detail: { fase } }))
const limita = (x, a, b) => Math.min(b, Math.max(a, x))
const morbida = (x) => { x = limita(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2 }
const RIGHE = 10 // sul muro (le ultime dieci firme)
const VICINE = 60 // sul foglio da vicino, scorrendo
const CHIAVE = 'pzkko-firma'
const mia = () => { try { return JSON.parse(localStorage.getItem(CHIAVE) || 'null') } catch { return null } }
const ricorda = (f) => { try { localStorage.setItem(CHIAVE, JSON.stringify({ id: f.id, n: f.n, t: f.t, c: f.c })) } catch {} }

// le penne, in frazioni della larghezza del foglio (le stesse del CSS di .penna in index.html): i perni sotto lo scotch,
// lo spago, la penna. Il pendolo: lungo ~27 cm fino a metà penna su un foglio di ~42 cm, ω² = g/L ≈ 36
const PERNI = [0.53, 0.625, 0.72], PERNO_Y = 0.915, SPAGO = 0.46, PENNA = 0.36, W2 = 36, SMORZA = 0.85
const LARGA = { blu: 50 / 642, nera: 60 / 642, rossa: 60 / 642 }
// il cappuccio della nera e della rossa, dentro la loro immagine (art/penne/penne.json, tools/pzkko/penne.mjs)
const TAPPO = { x: 4 / 60, y: 418 / 642, w: 52 / 60, h: 220 / 642 }
const INCLINA = 0.44 // la penna in mano: il fusto inclinato in avanti di ~25°

// ── il foglio sul muro ───────────────────────────────────────────────────────
let muro = null
export function prepara(el = document.getElementById('petizione')) {
  if (!el || muro) return
  muro = el
  const tela = el.querySelector('.pet-firme'), elenco = el.querySelector('.pet-elenco')
  const disegnaMuro = () => {
    if (in3d()) return
    const w = tela.offsetWidth, h = tela.offsetHeight
    if (!w || !h) return
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr)
    const ctx = tela.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const s = stato(), ultime = s.firme.slice(-RIGHE)
    disegna(ctx, ultime, { x: 0, y: 0, w, h, righe: RIGHE, primo: s.totale - ultime.length + 1 })
  }
  ascolta((s) => {
    elenco.replaceChildren(...s.firme.slice(-RIGHE).map((f) => { const li = document.createElement('li'); li.textContent = `${f.n}, ${data(f.t)} alle ${ora(f.t)}`; return li }))
    caratteri().then(disegnaMuro)
  })
  if ('ResizeObserver' in window) new ResizeObserver(() => caratteri().then(disegnaMuro)).observe(tela)
  chiedi()
  pendoli(el)
  // pzkko.it/#petizione: il foglio si apre da solo, quando la strada è arrivata
  if (location.hash === '#petizione') {
    const quando = () => (root.classList.contains('scena-carico') ? setTimeout(quando, 400) : setTimeout(apri, 600))
    quando()
  }
}

// le penne del muro di sempre (nella scena 3D sono modelli): il puntatore che ci passa sopra le fa dondolare
function pendoli(el) {
  const penne = [...el.querySelectorAll('.penna')].map((p) => ({ el: p, img: p.querySelector('img'), a: 0, v: 0, dentro: false }))
  let va = false, t0 = 0
  const giro = (now) => {
    const dt = Math.min(0.033, (now - t0) / 1000)
    t0 = now
    let fermi = true
    for (const p of penne) {
      p.v += (-W2 * Math.sin(p.a) - SMORZA * p.v) * dt
      p.a += p.v * dt
      if (Math.abs(p.a) > 0.002 || Math.abs(p.v) > 0.01) fermi = false
      p.el.style.setProperty('--a', `${(p.a * 57.296).toFixed(2)}deg`)
    }
    if (!fermi) return requestAnimationFrame(giro)
    va = false
    for (const p of penne) { p.a = p.v = 0; p.el.style.removeProperty('--a') }
  }
  const spingi = (p, v) => {
    if (ridotto.matches || in3d()) return
    p.v = limita(p.v + v, -5, 5)
    if (!va) { va = true; t0 = performance.now(); requestAnimationFrame(giro) }
  }
  let prima = null
  addEventListener('pointermove', (e) => {
    if (in3d() || ridotto.matches || e.pointerType !== 'mouse' || aperta) return
    const r = el.getBoundingClientRect()
    if (e.clientY < r.bottom - r.height * 0.15 || e.clientY > r.bottom + r.width || e.clientX < r.left || e.clientX > r.right) { prima = null; return }
    const vx = prima ? (e.clientX - prima.x) / Math.max(8, e.timeStamp - prima.t) : 0
    prima = { x: e.clientX, t: e.timeStamp }
    for (const p of penne) {
      const b = p.img.getBoundingClientRect(), su = e.clientX > b.left - 5 && e.clientX < b.right + 5 && e.clientY > b.top - 4 && e.clientY < b.bottom
      if (su && !p.dentro) { spingi(p, -vx * 2.4); suona('penne', { a: Math.min(1, Math.abs(vx) * 0.8) }) }
      p.dentro = su
    }
  }, { passive: true })
}

// ── il foglio da vicino ──────────────────────────────────────────────────────
const SCHELETRO = `
<div class="pv-velo"></div>
<div class="pv-foglio vol c-bianco petizione">
  <div class="foglio" aria-hidden="true"></div>
  <div class="testo">
    <p class="pet-testa">petizione popolare</p>
    <h3 id="pv-titolo">pzkko.it è un bel sito?</h3>
    <p class="pet-sotto">noi sottoscritti dichiariamo che pzkko.it è un bel sito.</p>
    <div class="pet-tabella">
      <div class="pet-intesta" aria-hidden="true"><span>n.</span><span>nome e cognome</span><span>data</span><span>ora</span><span>firma</span></div>
      <div class="pet-righe pv-righe">
        <div class="pv-dentro">
          <canvas class="pv-tela" aria-hidden="true"></canvas>
          <form class="pv-riga" novalidate>
            <span class="pv-n" aria-hidden="true"></span>
            <label class="pv-c-nome"><span class="pv-sr">il tuo nome e cognome</span><input class="pv-nome" name="nome" maxlength="32" autocomplete="name" spellcheck="false" autocapitalize="words" enterkeyhint="send" placeholder="il tuo nome"></label>
            <span class="pv-c-data" aria-hidden="true"></span><span class="pv-c-ora" aria-hidden="true"></span><span class="pv-c-firma" aria-hidden="true"></span>
            <input class="pv-trappola" name="sito" tabindex="-1" autocomplete="off" aria-hidden="true">
          </form>
        </div>
      </div>
    </div>
    <p class="mano vai pv-azioni"><button type="button" class="pv-firma">firma <svg class="freccia" viewBox="0 0 48 24" aria-hidden="true"><path d="M3 13c10-2 22-2 34-1M28 5c4 3 7 5 10 7-3 2-7 5-10 8"/></svg></button><button type="button" class="pv-altro" hidden>firma per un'altra persona</button></p>
  </div>
  <svg class="pv-spaghi" aria-hidden="true"><path class="pv-spago"/><path class="pv-spago"/><path class="pv-spago"/></svg>
  <i class="pet-scotch" aria-hidden="true"></i>
  <div class="pv-penne" role="radiogroup" aria-label="con che penna firmi?"></div>
  <p class="pv-nota" role="status" aria-live="polite"></p>
  <p class="pv-conta" aria-live="polite"></p>
</div>
<button type="button" class="pv-chiudi" aria-label="chiudi la petizione">×</button>`

let aperta = null

/** Avvicina il foglio. penna: quella toccata sul muro ('blu', 'nera', 'rossa'), o la blu. */
export async function apri(penna) {
  if (aperta || !muro) return
  const t0 = Date.now()
  caratteri()
  if (!stato().arrivate) chiedi()
  const pv = document.createElement('div')
  pv.className = 'pv'
  pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-labelledby', 'pv-titolo'); pv.tabIndex = -1
  pv.innerHTML = SCHELETRO
  const $ = (s) => pv.querySelector(s)
  const foglio = $('.pv-foglio'), velo = $('.pv-velo'), righe = $('.pv-righe'), dentro = $('.pv-dentro'), tela = $('.pv-tela')
  const modulo = $('.pv-riga'), campo = $('.pv-nome'), trappola = $('.pv-trappola'), bottone = $('.pv-firma'), altro = $('.pv-altro')
  const nota = $('.pv-nota'), conta = $('.pv-conta'), spaghi = [...pv.querySelectorAll('.pv-spago')], chiudiB = $('.pv-chiudi')
  const ritorno = document.activeElement
  aperta = { pv, altro: false }
  let scelta = PENNE.includes(penna) ? penna : 'blu', scrivendo = false, chiusa = false, smetti = () => {}

  // ── le misure: il foglio grande ha la proporzione di quello del muro, ci stanno sotto le penne appese ──
  const ow = muro.offsetWidth, oh = muro.offsetHeight, pr = oh / ow
  const vw = innerWidth, vh = innerHeight
  const W = Math.round(limita(Math.min(600, vw - 24, (vh - 24) / (PERNO_Y * pr + SPAGO + PENNA + 0.03)), 240, 600))
  foglio.style.width = `${W}px`
  // le misure del titolo e il colore del pennarello: le stesse del foglio del muro (stanno nel suo stile in linea)
  for (const v of ['--ts', '--marker-c', '--titolo']) { const x = muro.style.getPropertyValue(v); if (x) foglio.style.setProperty(v, x) }
  // la sera: il foglio da vicino è un po' più scuro, come la strada
  const notte = Number(window.pzkkoPagina?.luci?.notte) || 0
  foglio.style.setProperty('--sera', String(1 - 0.28 * notte))
  document.body.appendChild(pv)
  const H = foglio.offsetHeight, alto = H * PERNO_Y + (SPAGO + PENNA + 0.03) * W
  const sx = Math.round((vw - W) / 2), sy = Math.round(Math.max(10, (vh - alto) / 2))
  foglio.style.left = `${sx}px`; foglio.style.top = `${sy}px`

  // dov'è il foglio del muro sullo schermo (ruotato, e con la vetrina della scena 3D anche ingrandito)
  const dalMuro = () => {
    const r = muro.getBoundingClientRect(), rot = parseFloat(getComputedStyle(muro).getPropertyValue('--pr')) || 0, rad = (rot * Math.PI) / 180
    const k = r.width / (ow * Math.abs(Math.cos(rad)) + oh * Math.abs(Math.sin(rad)))
    return `translate(${(r.left + r.width / 2 - (sx + W / 2)).toFixed(1)}px, ${(r.top + r.height / 2 - (sy + H / 2)).toFixed(1)}px) rotate(${rot}deg) scale(${((ow * k) / W).toFixed(4)})`
  }

  // ── le righe: una tela con le firme (le ultime VICINE) e, in fondo, la riga in cui si scrive ──
  const rh = righe.clientHeight / RIGHE
  foglio.style.setProperty('--rh', `${rh}px`)
  const dpr = Math.min(3, window.devicePixelRatio || 1)
  let lista = [], primo = 1, puo = false, nuova = 0
  const ctx = tela.getContext('2d')
  const disegnaTutto = () => {
    const s = stato(), io = mia()
    const giaFirmato = !!io && s.firme.some((f) => f.id === io.id)
    puo = !s.offline && s.arrivate && (!giaFirmato || !!aperta?.altro)
    lista = s.firme.slice(-(VICINE - 1))
    primo = s.totale - lista.length + 1
    nuova = lista.length
    const n = Math.max(RIGHE, lista.length + (puo ? 1 : 0))
    dentro.style.height = `${n * rh}px`
    tela.style.height = `${n * rh}px`
    tela.width = Math.round(righe.clientWidth * dpr); tela.height = Math.round(n * rh * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // la propria firma, ripassata con l'evidenziatore
    const mio = io ? lista.findIndex((f) => f.id === io.id) : -1
    if (mio >= 0) { ctx.fillStyle = 'rgba(255, 226, 60, .38)'; ctx.fillRect(righe.clientWidth * 0.085, mio * rh + rh * 0.18, righe.clientWidth * 0.9, rh * 0.68) }
    disegna(ctx, lista, { x: 0, y: 0, w: righe.clientWidth, h: lista.length * rh || rh, righe: Math.max(1, lista.length), primo })
    conta.textContent = s.totale ? `${s.totale} ${s.totale === 1 ? 'firma' : 'firme'}!` : ''
    modulo.hidden = !puo
    modulo.style.top = `${nuova * rh}px`
    $('.pv-n').textContent = String(s.totale + 1)
    $('.pv-c-data').textContent = data(Date.now()); $('.pv-c-ora').textContent = ora(Date.now())
    bottone.hidden = !puo
    altro.hidden = puo || !giaFirmato || s.offline
    if (s.offline) avviso('la petizione è in pausa: riprova più tardi', 'no')
    else if (giaFirmato && !puo) avviso(`hai già firmato: riga ${s.totale - s.firme.length + s.firme.findIndex((f) => f.id === io.id) + 1}`, 'ok')
    return mio
  }
  const avviso = (testo, tipo = '') => {
    nota.textContent = testo
    nota.className = `pv-nota si ${tipo}`
    clearTimeout(nota.t)
    if (tipo === 'no' && !stato().offline) nota.t = setTimeout(() => nota.classList.remove('si'), 4200)
  }
  const colore = () => { campo.style.color = INCHIOSTRO[PENNE.indexOf(scelta)]; campo.style.caretColor = INCHIOSTRO[PENNE.indexOf(scelta)] }
  colore()

  // ── le penne: pendoli, finché una non va a scrivere ──
  const perno = (i) => ({ x: PERNI[i] * W, y: PERNO_Y * H }), L = SPAGO * W, LP = PENNA * W
  const casoV = () => (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.9)
  const penne = PENNE.map((nome, i) => {
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'pv-penna'; b.dataset.penna = nome
    b.setAttribute('role', 'radio'); b.setAttribute('aria-label', `la penna ${nome}`)
    const w = LARGA[nome] * LP
    b.style.width = `${w}px`; b.style.height = `${LP}px`
    const img = (src, cls) => { const im = new Image(); im.src = src; im.alt = ''; im.className = cls; im.decoding = 'async'; im.draggable = false; b.appendChild(im); return im }
    const chiusa = img(`/art/penne/${nome}.webp`, 'pv-chiusa'), apertaImg = nome === 'blu' ? null : img(`/art/penne/${nome}-aperta.webp`, 'pv-aperta')
    $('.pv-penne').appendChild(b)
    // il cappuccio che salta via: un pezzo a sé sopra il foglio
    let tappo = null
    if (apertaImg) {
      tappo = new Image(); tappo.src = `/art/penne/tappo-${nome}.webp`; tappo.alt = ''; tappo.className = 'pv-tappo'
      tappo.style.width = `${TAPPO.w * w}px`; tappo.style.height = `${TAPPO.h * LP}px`
      foglio.appendChild(tappo)
    }
    return { nome, i, b, w, chiusa, apertaImg, tappo, a: (Math.random() - 0.5) * 0.3, v: ridotto.matches ? 0 : casoV(), modo: 'appesa', x: 0, y: 0, ang: 0, punta: null, da: null, verso: null, t: 0 }
  })
  const segna = () => { for (const p of penne) p.b.setAttribute('aria-checked', String(p.nome === scelta)) }
  segna()
  const posa = (p) => {
    p.b.style.transform = `translate(${(p.x - p.w / 2).toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.ang.toFixed(4)}rad)`
    // lo spago: dritto se è teso, se no si incurva verso il basso quanto è lento
    const q = perno(p.i), d = Math.hypot(p.x - q.x, p.y - q.y)
    if (d >= L * 0.995) spaghi[p.i].setAttribute('d', `M${q.x.toFixed(1)} ${q.y.toFixed(1)}L${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    else {
      const sag = Math.sqrt(L * L - d * d) * 0.55
      spaghi[p.i].setAttribute('d', `M${q.x.toFixed(1)} ${q.y.toFixed(1)}Q${((q.x + p.x) / 2).toFixed(1)} ${((q.y + p.y) / 2 + sag).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    }
  }
  const appesa = (p) => { const q = perno(p.i); p.x = q.x - L * Math.sin(p.a); p.y = q.y + L * Math.cos(p.a); p.ang = p.a }
  // la penna in mano: la punta in (tx, ty), il fusto inclinato; il punto dello spago è in cima
  const inMano = (p, tx, ty, ang) => { p.x = tx + LP * Math.sin(ang); p.y = ty - LP * Math.cos(ang); p.ang = ang }
  // dove sta, sul foglio grande, un punto della tela delle righe
  const sulFoglio = (pt) => {
    let x = pt.x, y = pt.y - righe.scrollTop
    for (let e = righe; e && e !== foglio; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop }
    return { x, y }
  }
  let tPrima = performance.now(), giro = 0
  const passo = (now) => {
    giro = requestAnimationFrame(passo)
    const dt = Math.min(0.033, (now - tPrima) / 1000)
    tPrima = now
    for (const p of penne) {
      if (p.modo === 'appesa') {
        p.v += (-W2 * Math.sin(p.a) - SMORZA * p.v) * dt
        p.a += p.v * dt
        appesa(p)
      } else if (p.modo === 'va' || p.modo === 'torna') {
        // da dove era a dove va, morbida; finita, scrive (o torna a pendere, con lo slancio)
        p.t += dt / p.durata
        const u = morbida(p.t), a = p.da, b = p.verso()
        p.x = a.x + (b.x - a.x) * u; p.y = a.y + (b.y - a.y) * u; p.ang = a.ang + (b.ang - a.ang) * u
        if (p.t >= 1) {
          if (p.modo === 'va') { p.modo = 'scrive'; p.fatto?.() }
          else { const q = perno(p.i); p.a = Math.atan2(-(p.x - q.x), p.y - q.y); p.v = ridotto.matches ? 0 : (p.a >= 0 ? 1 : -1) * 1.6; p.modo = 'appesa'; p.fatto?.() }
        }
      } else if (p.modo === 'scrive' && p.punta) {
        // la punta insegue la scrittura con una molla rigida (fra un pezzo e l'altro si alza e ci va in fretta)
        const k = 1 - Math.exp(-dt * (p.salta ? 16 : 34))
        p.tx += (p.punta.x - p.tx) * k; p.ty += (p.punta.y - p.ty) * k
        inMano(p, p.tx, p.ty - (p.salta ? W * 0.012 : 0), INCLINA + 0.05 * Math.sin(now / 95) + (p.salta ? -0.05 : 0))
      }
      posa(p)
    }
    // il cappuccio che salta via: lanciato, gira, cade e sparisce
    for (const p of penne) {
      const tp = p.tappo
      if (!tp || !tp.vola) continue
      const f = tp.vola
      f.vy += 2.6 * W * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vr * dt; f.o -= dt * 1.3
      tp.style.transform = `translate(${f.x.toFixed(1)}px, ${f.y.toFixed(1)}px) rotate(${f.r.toFixed(3)}rad)`
      tp.style.opacity = String(Math.max(0, f.o))
      if (f.o <= 0) { tp.vola = null; tp.style.visibility = 'hidden' }
    }
  }
  for (const p of penne) appesa(p), posa(p)
  giro = requestAnimationFrame(passo)
  // scegliere la penna: la si tocca, dondola, e il nome si scrive del suo colore
  for (const p of penne) p.b.addEventListener('click', () => {
    if (scrivendo) return
    if (p.modo === 'appesa') p.v += (Math.random() < 0.5 ? -1 : 1) * 1.8
    suona('penne', { a: 0.7 })
    scelta = p.nome; segna(); colore()
    if (!modulo.hidden && matchMedia('(pointer: fine)').matches) campo.focus({ preventScroll: true })
  })

  // ── firmare: la penna va alla riga mentre il server risponde; se va bene scrive, se no torna e lo dice ──
  const controlla = (n) => {
    if (n.length < 2) return 'scrivi il tuo nome'
    if ([...n].length > 32) return 'al massimo 32 lettere'
    if (/https?|www\.|@|\/|\.(com|it|net|org)\b/i.test(n)) return 'solo il nome, niente link'
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\p{N} .'’-]*$/u.test(n)) return 'solo lettere: niente simboli né emoji'
    return null
  }
  // dove comincia la riga nuova: la punta della penna all'inizio del nome (poi la scrittura vera la porta dove serve)
  const inizio = () => sulFoglio({ x: righe.clientWidth * (COLONNE[0] + COLONNE[1] * 0.05), y: nuova * rh + rh * 0.52 })
  const vaiAScrivere = (p) => new Promise((ok) => {
    const s = inizio()
    p.da = { x: p.x, y: p.y, ang: p.ang }
    p.verso = () => ({ x: s.x + LP * Math.sin(INCLINA), y: s.y - LP * Math.cos(INCLINA), ang: INCLINA })
    p.tx = s.x; p.ty = s.y; p.punta = s
    p.t = 0; p.durata = ridotto.matches ? 0.01 : 0.5; p.modo = 'va'; p.fatto = ok
    // il cappuccio salta via
    if (p.tappo) {
      const c = Math.cos(p.ang), sn = Math.sin(p.ang), cx = (TAPPO.x + TAPPO.w / 2 - 0.5) * p.w, cy = (TAPPO.y + TAPPO.h / 2) * LP
      const x = p.x + cx * c - cy * sn - (TAPPO.w * p.w) / 2, y = p.y + cx * sn + cy * c - (TAPPO.h * LP) / 2
      p.tappo.vola = { x, y, vx: W * (0.25 + Math.random() * 0.2), vy: -W * 0.55, r: p.ang, vr: 7 + Math.random() * 5, o: 1.2 }
      p.tappo.style.visibility = 'visible'
      p.chiusa.style.visibility = 'hidden'; p.apertaImg.style.visibility = 'visible'
      suona('tappo')
    }
  })
  const tornaGiu = (p) => new Promise((ok) => {
    p.da = { x: p.x, y: p.y, ang: p.ang }
    p.verso = () => { const q = perno(p.i); return { x: q.x - L * Math.sin(0.25), y: q.y + L * Math.cos(0.25), ang: 0.25 } }
    p.t = 0; p.durata = ridotto.matches ? 0.01 : 0.6; p.modo = 'torna'; p.salta = false
    p.fatto = () => {
      // il cappuccio torna al suo posto, con un clic
      if (p.tappo) { p.chiusa.style.visibility = ''; p.apertaImg.style.visibility = 'hidden'; suona('tappo', { chiude: true }) }
      ok()
    }
  })
  // scrive la firma sulla riga nuova: il nome, la data, l'ora, lo scarabocchio, ognuno col suo tempo
  const scrivi = (f, p) => new Promise((ok) => {
    const dn = limita(0.3 + 0.085 * [...f.n].length, 0.9, 3.2), pezzi = [dn, 0.62, 0.46, 0.85], T = pezzi.reduce((a, b) => a + b, 0)
    const tempi = []
    let acc = 0
    for (const d of pezzi) { tempi.push([acc / T, (acc + d) / T]); acc += d }
    let k = -1, tPezzo = 0, pausa = 0, fatto = 0, ult = performance.now()
    const riga = nuova * rh, w = righe.clientWidth
    // la tela com'era prima di scrivere: a ogni fotogramma si rimette la fascia della riga (con quel che ci sporge delle
    // righe vicine) e sopra si scrive la riga nuova fin dove è arrivata
    const prima = document.createElement('canvas')
    prima.width = tela.width; prima.height = tela.height
    prima.getContext('2d').drawImage(tela, 0, 0)
    const y0 = Math.round(Math.max(0, riga - rh * 0.6) * dpr), alt = Math.min(tela.height - y0, Math.round(rh * 2.2 * dpr))
    const tocca = (fino) => {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, y0, tela.width, alt)
      ctx.drawImage(prima, 0, y0, tela.width, alt, 0, y0, tela.width, alt)
      ctx.restore()
      return disegna(ctx, [f], { x: 0, y: riga, w, h: rh, righe: 1, primo: stato().totale + 1, fino, tempi })
    }
    const avanti = (now) => {
      const dt = Math.min(0.05, (now - ult) / 1000)
      ult = now
      if (pausa > 0) {
        pausa -= dt
        p.salta = true
        const pt = tocca(Math.min(1, (fatto + 0.0005) / T))
        if (pt) p.punta = sulFoglio(pt)
        if (pausa > 0) return requestAnimationFrame(avanti)
      }
      if (k < 0 || tPezzo >= pezzi[k]) {
        if (k >= 0) fatto += pezzi[k]
        k++; tPezzo = 0
        if (k >= pezzi.length) { tocca(null); p.punta = null; return ok() }
        if (k > 0 && pausa <= 0 && !ridotto.matches) { pausa = 0.13; return requestAnimationFrame(avanti) }
        suona('penna', { durata: pezzi[k], tipo: k === 3 ? 'firma' : 'scrive', n: k === 0 ? [...f.n].length : k === 3 ? 6 : 5, penna: f.c })
      }
      p.salta = false
      tPezzo += ridotto.matches ? 99 : dt
      const pt = tocca(Math.min(1, (fatto + Math.min(tPezzo, pezzi[k])) / T))
      if (pt) p.punta = sulFoglio(pt)
      requestAnimationFrame(avanti)
    }
    requestAnimationFrame(avanti)
  })

  const invia = async () => {
    if (scrivendo || modulo.hidden) return
    const nome = campo.value.replace(/\s+/g, ' ').trim(), errore = controlla(nome)
    if (errore) { avviso(errore, 'no'); campo.focus({ preventScroll: true }); modulo.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-1.2%)' }, { transform: 'translateX(1%)' }, { transform: 'translateX(0)' }], { duration: 260 }); return }
    scrivendo = true
    campo.blur(); campo.disabled = true; bottone.disabled = true
    nota.classList.remove('si')
    righe.scrollTop = righe.scrollHeight
    const p = penne.find((x) => x.nome === scelta)
    // (il server vuole almeno 2,5 s da quando il foglio si è avvicinato: chi scrive in fretta aspetta un attimo)
    const attesa = Math.max(0, 2600 - (Date.now() - t0))
    const risposta = new Promise((r) => setTimeout(r, attesa)).then(() => fetch('/api/firme/', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ a: 'firma', nome, penna: scelta, sito: trappola.value, aperto: t0 }),
    })).then((r) => r.json().then((d) => ({ ok: r.ok && d.ok, d }), () => ({ ok: false, d: {} }))).catch(() => ({ ok: false, d: { errore: 'niente rete: riprova' } }))
    const [esito] = await Promise.all([risposta, vaiAScrivere(p)])
    if (chiusa) return
    if (!esito.ok) {
      await tornaGiu(p)
      scrivendo = false; campo.disabled = false; bottone.disabled = false
      if (esito.d?.firme) { aggiorna(esito.d); disegnaTutto() }
      avviso(esito.d?.errore || 'non è andata: riprova', 'no')
      if (matchMedia('(pointer: fine)').matches) campo.focus({ preventScroll: true })
      return
    }
    const f = esito.d.firma
    campo.value = ''
    modulo.classList.add('via')
    await scrivi(f, p)
    ricorda(f)
    aperta.altro = false
    aggiorna(esito.d)
    disegnaTutto()
    righe.scrollTop = righe.scrollHeight
    await tornaGiu(p)
    scrivendo = false
    avviso(`grazie! hai firmato alle ${ora(f.t)}`, 'ok')
    suona('foglio', { a: 0.4 })
    setTimeout(() => { if (!chiusa && !scrivendo) chiudi() }, 1900)
  }
  modulo.addEventListener('submit', (e) => { e.preventDefault(); invia() })
  bottone.addEventListener('click', invia)
  altro.addEventListener('click', () => { aperta.altro = true; altro.hidden = true; nota.classList.remove('si'); disegnaTutto(); righe.scrollTop = righe.scrollHeight; campo.focus({ preventScroll: true }) })
  campo.addEventListener('input', () => { if (nota.classList.contains('no')) nota.classList.remove('si') })

  // ── aprire e chiudere ──
  const chiudi = async () => {
    if (chiusa) return
    chiusa = true
    avvisa('chiude')
    suona('foglio', { a: 0.6, giu: true })
    const durata = ridotto.matches ? 0 : 560
    const via = foglio.animate([{ transform: 'none' }, { transform: dalMuro() }], { duration: durata, easing: 'cubic-bezier(.55,0,.22,1)', fill: 'forwards' })
    velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: durata * 0.9, easing: 'ease-in', fill: 'forwards' })
    chiudiB.style.visibility = 'hidden'
    // (il foglio del muro non si sposta mentre si torna: la scena 3D, ferma da quando il foglio si è avvicinato, si
    // risveglia solo a «chiusa», con la vetrina dov'era)
    await via.finished.catch(() => {})
    muro.style.visibility = ''
    avvisa('chiusa')
    suona('attacca')
    // (due fotogrammi: la scena ridisegna il foglio 3D al suo posto, poi quello grande sparisce sopra di lui)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await pv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ridotto.matches ? 0 : 150, fill: 'forwards' }).finished.catch(() => {})
    cancelAnimationFrame(giro)
    smetti()
    pv.remove()
    removeEventListener('keydown', tasti, true)
    aperta = null
    if (ritorno?.isConnected) ritorno.focus({ preventScroll: true })
  }
  const tasti = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); if (!scrivendo) chiudi() }
    else if (e.key === 'Tab') {
      // il fuoco resta nel foglio
      const giri = [...pv.querySelectorAll('button:not([hidden]):not([disabled]), input:not([disabled]):not(.pv-trappola)')].filter((x) => x.offsetParent || x === chiudiB)
      if (!giri.length) return
      const i = giri.indexOf(document.activeElement), j = e.shiftKey ? (i <= 0 ? giri.length - 1 : i - 1) : (i + 1) % giri.length
      e.preventDefault(); giri[j].focus({ preventScroll: true })
    }
  }
  addEventListener('keydown', tasti, true)
  velo.addEventListener('click', () => { if (!scrivendo) chiudi() })
  chiudiB.addEventListener('click', () => { if (!scrivendo) chiudi() })
  // la pagina sotto non scorre (scorre solo l'elenco delle firme)
  const ferma = (e) => { if (!e.target.closest?.('.pv-righe')) e.preventDefault() }
  pv.addEventListener('wheel', ferma, { passive: false })
  pv.addEventListener('touchmove', ferma, { passive: false })
  // la tastiera del telefono che sale: il foglio sale con lei, quanto basta a vedere la riga
  const vv = window.visualViewport
  if (vv) {
    const alza = () => {
      if (!pv.isConnected) return vv.removeEventListener('resize', alza)
      const r = modulo.getBoundingClientRect(), su = Math.max(0, r.bottom + 16 - (vv.height + vv.offsetTop))
      foglio.style.translate = document.activeElement === campo && su > 0 ? `0 ${-su}px` : ''
    }
    vv.addEventListener('resize', alza)
    campo.addEventListener('focus', () => setTimeout(alza, 350))
    campo.addEventListener('blur', () => { foglio.style.translate = '' })
  }

  disegnaTutto()
  righe.scrollTop = righe.scrollHeight
  // le firme arrivate dopo (se il foglio si è aperto prima della risposta), e i caratteri
  smetti = ascolta(() => { if (!scrivendo && !chiusa) { disegnaTutto(); righe.scrollTop = righe.scrollHeight } })
  caratteri().then(() => { if (!scrivendo && !chiusa) disegnaTutto() })

  // il volo: dal muro al centro, nitido (il foglio è già della sua misura), con un filo di rimbalzo
  muro.style.visibility = 'hidden'
  avvisa('apre')
  suona('foglio', { a: 0.75 })
  suona('penne', { a: 0.5, n: 3 })
  const durata = ridotto.matches ? 0 : 700
  velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: durata * 0.8, easing: 'ease-out', fill: 'backwards' })
  await foglio.animate([{ transform: dalMuro() }, { transform: 'none' }], { duration: durata, easing: 'cubic-bezier(.2,.9,.24,1.04)' }).finished.catch(() => {})
  if (chiusa) return
  avvisa('aperta')
  if (!modulo.hidden && matchMedia('(pointer: fine)').matches) campo.focus({ preventScroll: true })
  else pv.focus({ preventScroll: true })
}
