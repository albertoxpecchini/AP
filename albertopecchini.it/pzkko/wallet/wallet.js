// Il wallet dei $pzk (22.10 notte), in alto a sinistra della home: un portafoglio di pelle usato, customizzato come
// un Pip-Boy di Fallout (la foto di art/wallet/portafoglio.webp, gpt-image-2), con sopra gli schermi accesi dalla
// pagina: il saldo in $pzk a led verdi (le stesse cifre a sette segmenti del portachiavi per terra, portachiavi.js), gli
// EUR€ a led ambra, la batteria su un lcd (100 % alle 7 di mattina, 2 % alle 7 di sera, poi in carica col cavo usb-c
// infilato nella porta sul fianco sinistro), la targhetta con l'indirizzo, e a destra la borsa: il grafico del cambio
// PZK/EUR€ (api/borsa.mjs; la manopola cambia il periodo) con la capitalizzazione. I quattro tasti gialli sfilano dalla
// tasca la «carta» coi moduli: il conto (entra o crea il conto: un nome e un PIN di quattro cifre, niente di più; chi non
// entra gioca coi 1.000 $pzk della sessione), il cambio (il fader orizzontale: $pzk ↔ EUR€ al cambio dell'ultima
// sincronizzazione), gli invii fra conti (48 ore dopo la creazione), e il resto (l'indirizzo, che si cambia una volta
// sola, il PIN, il regalo di instagram). I soldi li tiene ../games/pzk.js, gli stessi dei giochi.
// Il tasto in alto a sinistra (index.html, .wallet-tasto) ha il suo led col saldo: lo disegna prepara().
import * as pzk from '../games/pzk.js'

const IMM = { w: 1214, h: 559 } // la foto del portafoglio: le misure degli schermi sono in percentuale di lei
const POS = {
  saldo: [15.6, 20.9, 25.4, 23.2], eur: [16.3, 50.3, 11.2, 12.1], batt: [30.2, 50.2, 10.0, 12.2], targa: [21.4, 66.1, 12.7, 5.2], borsa: [59.6, 18.6, 29.4, 40.4],
  tasti: [[62.73, 67.9], [67.92, 67.75], [73.19, 67.75], [78.38, 67.75]], manopola: [84.3, 69.5],
}
const PERIODI = [['24h', '24 ore'], ['7g', '7 giorni'], ['30g', '30 giorni'], ['tutto', 'da sempre']]
const fmt = pzk.fmt, fmtEur = pzk.fmtEur
const q = (el, s) => el.querySelector(s)
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e }
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

// ── le cifre a sette segmenti (le stesse del portachiavi) ──
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' }
const segmento = (g, x1, y1, x2, y2, t) => {
  const l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l, nx = (-uy * t) / 2, ny = (ux * t) / 2, a = t / 2
  g.beginPath()
  g.moveTo(x1, y1); g.lineTo(x1 + ux * a + nx, y1 + uy * a + ny); g.lineTo(x2 - ux * a + nx, y2 - uy * a + ny)
  g.lineTo(x2, y2); g.lineTo(x2 - ux * a - nx, y2 - uy * a - ny); g.lineTo(x1 + ux * a - nx, y1 + uy * a - ny)
  g.closePath(); g.fill()
}
const cifra = (g, x, y, w, h, t, accesi, acceso, spento) => {
  const k = 0.1, gap = t * 0.18
  const p = (px, py) => [x + px + k * (h - py), y + py]
  const pt = { tl: p(0, 0), tr: p(w, 0), ml: p(0, h / 2), mr: p(w, h / 2), bl: p(0, h), br: p(w, h) }
  const s = { a: ['tl', 'tr'], b: ['tr', 'mr'], c: ['mr', 'br'], d: ['bl', 'br'], e: ['ml', 'bl'], f: ['tl', 'ml'], g: ['ml', 'mr'] }
  for (const [n, [da, a]] of Object.entries(s)) {
    const [x1, y1] = pt[da], [x2, y2] = pt[a], l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l
    g.fillStyle = accesi.includes(n) ? acceso : spento
    segmento(g, x1 + ux * gap, y1 + uy * gap, x2 - ux * gap, y2 - uy * gap, t)
  }
}
/**
 * Un numero sul display a led: `testo` come "1234", "1234.5", "0.00", "----"; i segmenti spenti si intravedono. Le cifre
 * riempiono l'altezza `alt` (0..1 della tela) e stanno a destra; `colore` è la luce, `spento` l'ombra.
 */
function display(c, testo, { colore = '#46ff7d', spento = '#0a2614', fondo = '#020604', alt = 0.62, su = 0.5, destra = 0, posti = null, luce = true } = {}) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.max(2, Math.round(c.clientWidth * dpr)), H = Math.max(2, Math.round(c.clientHeight * dpr))
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
  const g = c.getContext('2d')
  g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0
  g.fillStyle = fondo; g.fillRect(0, 0, W, H)
  const Wd = W * (1 - destra)
  const cifre = testo.replace(/[^0-9.\-]/g, '')
  const soloCifre = cifre.replace(/\./g, '')
  const n = posti ?? Math.max(soloCifre.length, 1)
  // le misure dalle cifre: riempiono l'altezza `alt`; se il numero è lungo (un botto di cifre) si stringono finché ci
  // stanno tutte nella larghezza, mai tagliate
  const misure = (h) => { const w = h * 0.52, t = h * 0.12, passo = w + t * 2.2; return { h, w, t, passo, larg: n * passo + (cifre.includes('.') ? t * 1.6 : 0) + h * 0.1 } }
  let M = misure(H * alt)
  if (M.larg > Wd * 0.96) M = misure((H * alt * Wd * 0.96) / M.larg)
  const { h, w, t, passo, larg } = M
  const y = H * su - h / 2 + h * 0.08
  let x = Math.max(t, (Wd - larg) / 2)
  x = Math.min(x, Wd - larg)
  const pos = []
  { let xx = x, resta = n - soloCifre.length; for (let i = 0; i < resta; i++) { pos.push({ x: xx, c: ' ' }); xx += passo } for (const ch of cifre) { if (ch === '.') { pos.push({ x: xx - t * 1.4, c: '.' }); xx += t * 1.6; continue } pos.push({ x: xx, c: ch }); xx += passo } }
  const acceso = luce ? colore : spento
  for (const p of pos) if (p.c !== '.') cifra(g, p.x, y, w, h, t, '', spento, spento)
  if (luce) { g.shadowColor = colore; g.shadowBlur = h * 0.22 }
  for (let r = 0; r < (luce ? 2 : 1); r++) for (const p of pos) {
    if (p.c === ' ') continue
    if (p.c === '.') { g.fillStyle = acceso; g.beginPath(); g.arc(p.x + t * 0.9, y + h - t * 0.5, t * 0.55, 0, Math.PI * 2); g.fill(); continue }
    cifra(g, p.x, y, w, h, t, SEG[p.c] ?? '', acceso, 'rgba(0,0,0,0)')
  }
  g.shadowBlur = 0
}

// ── la batteria: dalle 7 alle 19 si scarica da 100 % a 2 %, poi si carica fino alle 7 ──
const oraMantova = () => {
  const ms = window.pzkkoOrologio?.adesso?.() ?? Date.now()
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date(ms))
  return Number(p.find((x) => x.type === 'hour').value) % 24 + Number(p.find((x) => x.type === 'minute').value) / 60
}
export const batteria = () => {
  const h = oraMantova()
  if (h >= 7 && h < 19) return { pct: Math.round(100 - 98 * ((h - 7) / 12)), carica: false }
  const da = (h >= 19 ? h - 19 : h + 5) / 12
  return { pct: Math.round(2 + 98 * da), carica: true }
}
function disegnaBatteria(c, { pct, carica }) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.max(2, Math.round(c.clientWidth * dpr)), H = Math.max(2, Math.round(c.clientHeight * dpr))
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
  const g = c.getContext('2d')
  g.fillStyle = '#9fb48a'; g.fillRect(0, 0, W, H)
  // due righe con aria: sopra la pila (a sinistra) e il numero (a destra), sotto la saetta e «in carica» quando si carica
  const bw = W * 0.42, bh = H * 0.28, bx = W * 0.09, by = carica ? H * 0.2 : H * 0.36, r = Math.max(1, H * 0.02)
  g.lineWidth = Math.max(1, H * 0.035); g.strokeStyle = '#1c2616'; g.fillStyle = '#1c2616'
  g.beginPath(); g.roundRect(bx, by, bw, bh, r); g.stroke()
  g.fillRect(bx + bw + g.lineWidth, by + bh * 0.28, W * 0.03, bh * 0.44)
  const tacche = 5, piene = Math.round((pct / 100) * tacche), gap = bw * 0.03, tw = (bw - gap * (tacche + 1) - g.lineWidth) / tacche
  for (let i = 0; i < tacche; i++) if (i < piene) g.fillRect(bx + g.lineWidth / 2 + gap + i * (tw + gap), by + g.lineWidth / 2 + gap, tw, bh - g.lineWidth - gap * 2)
  // il numero, a destra, sulla riga della pila
  g.font = `${Math.round(H * 0.27)}px "Fake Receipt", ui-monospace, Consolas, monospace`; g.textAlign = 'right'; g.textBaseline = 'middle'
  g.fillText(`${pct}%`, W * 0.93, by + bh / 2)
  // in carica: la saetta (disegnata, niente emoji) e la scritta, sulla riga sotto
  if (carica) {
    const sy = H * 0.74, sh = H * 0.24, sx = bx + sh * 0.1
    g.beginPath(); g.moveTo(sx + sh * 0.5, sy - sh / 2); g.lineTo(sx + sh * 0.05, sy + sh * 0.08); g.lineTo(sx + sh * 0.42, sy + sh * 0.08); g.lineTo(sx + sh * 0.28, sy + sh / 2); g.lineTo(sx + sh * 0.75, sy - sh * 0.1); g.lineTo(sx + sh * 0.4, sy - sh * 0.1); g.closePath(); g.fill()
    g.font = `${Math.round(H * 0.2)}px "Fake Receipt", ui-monospace, Consolas, monospace`; g.textAlign = 'left'
    g.fillText('in carica', sx + sh * 1.05, sy)
  }
  // il vetro ha una grana (lcd)
  g.fillStyle = 'rgba(0,0,0,.05)'
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1)
}

// ── il grafico della borsa ──
function disegnaGrafico(c, punti, { da = '24h' } = {}) {
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.max(2, Math.round(c.clientWidth * dpr)), H = Math.max(2, Math.round(c.clientHeight * dpr))
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H }
  const g = c.getContext('2d')
  g.fillStyle = '#020604'; g.fillRect(0, 0, W, H)
  const MONO = '"Fake Receipt", ui-monospace, Consolas, monospace'
  if (!punti || punti.length < 2) {
    g.fillStyle = 'rgba(70,255,125,.7)'; g.font = `${Math.round(H * 0.07)}px ${MONO}`; g.textAlign = 'center'
    g.fillText(punti === undefined ? 'mi collego alla borsa…' : punti?.length === 1 ? 'la borsa è appena nata: 1 $pzk = 1 €' : 'borsa chiusa', W / 2, H * 0.62)
    return
  }
  // come i grafici delle crypto: verde se nel periodo è salito, rosso se è sceso; i prezzi a destra, le ore sotto
  const t0 = punti[0][0], t1 = punti[punti.length - 1][0]
  const su = punti[punti.length - 1][1] >= punti[0][1]
  const C = su ? [70, 255, 125] : [255, 91, 74], col = `rgb(${C})`, cola = (a) => `rgba(${C},${a})`
  let lo = Infinity, hi = -Infinity
  for (const [, v] of punti) { if (v < lo) lo = v; if (v > hi) hi = v }
  const m = (hi - lo) * 0.12 || hi * 0.02 || 0.02
  lo -= m; hi += m
  const left = W * 0.03, right = W * 0.85, top = H * 0.36, bot = H * 0.74
  const X = (t) => (t1 > t0 ? ((t - t0) / (t1 - t0)) * (right - left) + left : (left + right) / 2), Y = (v) => bot - ((v - lo) / (hi - lo)) * (bot - top)
  // la griglia e i prezzi a destra (tre livelli)
  g.font = `${Math.round(H * 0.048)}px ${MONO}`; g.textAlign = 'left'; g.textBaseline = 'middle'
  for (let k = 0; k <= 2; k++) {
    const v = lo + ((hi - lo) * (2 - k)) / 2, y = Y(v)
    g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(left, y); g.lineTo(right, y); g.stroke(); g.setLineDash([])
    g.fillStyle = 'rgba(220,235,220,.75)'; g.fillText(v.toFixed(4), right + W * 0.012, y)
  }
  // le ore (o i giorni) sotto
  const o = { timeZone: 'Europe/Rome' }
  const fmtT = (t) => { const d = new Date(t); return da === '24h' ? d.toLocaleTimeString('it-IT', { ...o, hour: '2-digit', minute: '2-digit' }) : da === '7g' ? d.toLocaleDateString('it-IT', { ...o, weekday: 'short', day: 'numeric' }) : d.toLocaleDateString('it-IT', { ...o, day: 'numeric', month: 'short' }) }
  g.fillStyle = 'rgba(220,235,220,.7)'
  for (let k = 0; k <= 3; k++) { const t = t0 + ((t1 - t0) * k) / 3; g.textAlign = k === 0 ? 'left' : k === 3 ? 'right' : 'center'; g.fillText(fmtT(t), X(t), H * 0.81) }
  // l'area sotto, la linea, il punto
  g.beginPath(); g.moveTo(X(t0), bot)
  for (const [t, v] of punti) g.lineTo(X(t), Y(v))
  g.lineTo(X(t1), bot); g.closePath()
  const grad = g.createLinearGradient(0, top, 0, bot); grad.addColorStop(0, cola(0.32)); grad.addColorStop(1, cola(0))
  g.fillStyle = grad; g.fill()
  g.beginPath()
  for (const [k, [t, v]] of punti.entries()) k ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v))
  g.strokeStyle = col; g.lineWidth = Math.max(1.4, H * 0.013); g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = H * 0.03
  g.stroke(); g.shadowBlur = 0
  const [tu, vu] = punti[punti.length - 1]
  g.fillStyle = '#fff'; g.beginPath(); g.arc(X(tu), Y(vu), Math.max(2, H * 0.014), 0, Math.PI * 2); g.fill()
  // l'ultimo prezzo su un'etichetta colorata, a destra, all'altezza della linea
  const et = vu.toFixed(4), ew = g.measureText(et).width + W * 0.02, eh = H * 0.075, ey = Math.min(bot - eh / 2, Math.max(top + eh / 2, Y(vu)))
  g.fillStyle = col; g.beginPath(); g.roundRect(right + W * 0.006, ey - eh / 2, ew, eh, 3); g.fill()
  g.fillStyle = '#041008'; g.textAlign = 'left'; g.fillText(et, right + W * 0.016, ey)
  // le righe di scansione del tubo
  g.fillStyle = 'rgba(0,0,0,.18)'
  for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1)
}

// ── il tasto in alto a sinistra ──
let tasto = null, tastoAnim = 0, mostrato = null
export function prepara(bottone) {
  tasto = bottone
  const c = q(bottone, 'canvas')
  if (!c) return
  const piu = el('span', 'wt-piu', ''); bottone.appendChild(piu)
  const disegna = (v) => { display(c, String(Math.round(v)), { alt: 0.62, destra: 0.2 }); mostrato = v }
  const verso = (a) => {
    if (mostrato === null || RIDOTTO.matches || Math.abs(a - mostrato) < 1) { disegna(a); return }
    const da = mostrato, t0 = performance.now(), durata = 700
    cancelAnimationFrame(tastoAnim)
    const passo = (now) => { const e = Math.min(1, (now - t0) / durata), k = 1 - (1 - e) ** 3; disegna(da + (a - da) * k); if (e < 1) tastoAnim = requestAnimationFrame(passo) }
    tastoAnim = requestAnimationFrame(passo)
  }
  pzk.ascolta((s) => verso(s))
  disegna(pzk.saldo())
  addEventListener('resize', () => disegna(mostrato ?? pzk.saldo()))
  // la banconota raccolta per terra: il suo valore vola via dal tasto
  document.addEventListener('pzkko-banconota', (e) => { piu.textContent = `+${fmt(e.detail.valore)} $pzk`; piu.classList.remove('va'); void piu.offsetWidth; piu.classList.add('va') })
}

// ── il portafoglio aperto ──
let dlg = null, S = null // S: gli elementi e lo stato
let borsaDati = null, periodo = 0, borsaTimer = 0
function costruisci() {
  dlg = el('dialog', 'wallet')
  dlg.setAttribute('aria-label', 'wallet $pzk')
  const pos = ([x, y, w, h]) => `left:${x}%;top:${y}%;width:${w}%;height:${h}%`
  const tasti = ['conto', 'cambio', 'invia', 'altro']
  dlg.innerHTML = `
    <div class="w-corpo">
      <button class="w-chiudi" type="button" aria-label="chiudi il wallet">×</button>
      <div class="w-schermo w-saldo" style="${pos(POS.saldo)}"><canvas></canvas><span class="w-eti">$pzk</span><span class="w-sotto"></span></div>
      <div class="w-schermo w-eur" style="${pos(POS.eur)}"><canvas></canvas><span class="w-eti">EUR€</span></div>
      <div class="w-schermo w-batt" style="${pos(POS.batt)}"><canvas></canvas></div>
      <div class="w-targa" style="${pos(POS.targa)}"></div>
      <div class="w-schermo w-borsa" style="${pos(POS.borsa)}"><canvas class="w-grafico"></canvas><div class="w-tasso"></div><div class="w-var"></div><div class="w-periodo"></div><div class="w-info"></div></div>
      ${tasti.map((t, i) => `<button class="w-tasto" type="button" data-s="${t}" data-eti="${t}" aria-pressed="false" style="left:${POS.tasti[i][0]}%;top:${POS.tasti[i][1]}%" aria-label="${t}"></button>`).join('')}
      <button class="w-manopola" type="button" data-eti="periodo" aria-label="il periodo del grafico" style="left:${POS.manopola[0]}%;top:${POS.manopola[1]}%"><i></i></button>
      <img class="w-cavo" src="/art/wallet-cavo/cavo.webp" alt="" width="771" height="60" loading="lazy" aria-hidden="true"><div class="w-cavo-filo" aria-hidden="true"></div>
      <p class="w-voce" role="status" aria-live="polite"></p>
    </div>
    <div class="w-carta"></div>`
  document.body.appendChild(dlg)
  S = {
    corpo: q(dlg, '.w-corpo'), saldo: q(dlg, '.w-saldo canvas'), sotto: q(dlg, '.w-saldo .w-sotto'), eur: q(dlg, '.w-eur canvas'), batt: q(dlg, '.w-batt canvas'), targa: q(dlg, '.w-targa'),
    grafico: q(dlg, '.w-grafico'), tasso: q(dlg, '.w-tasso'), var: q(dlg, '.w-var'), periodo: q(dlg, '.w-periodo'), info: q(dlg, '.w-info'), carta: q(dlg, '.w-carta'), voce: q(dlg, '.w-voce'), manopola: q(dlg, '.w-manopola'),
    tasti: [...dlg.querySelectorAll('.w-tasto')], sezione: null,
  }
  q(dlg, '.w-chiudi').addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  for (const t of S.tasti) t.addEventListener('click', () => mostra(S.sezione === t.dataset.s ? null : t.dataset.s))
  // la manopola è un selettore a scatti: un periodo ogni quarto di giro, sempre in senso orario (gli scatti si sommano, così
  // dall'ultimo periodo al primo la tacca va avanti invece di tornare indietro di mezzo giro); parte già sul periodo giusto
  const giro = () => S.manopola.style.setProperty('--giro', `${-45 + scatti * (360 / PERIODI.length)}deg`)
  let scatti = periodo
  giro()
  S.manopola.addEventListener('click', () => { periodo = (periodo + 1) % PERIODI.length; scatti++; giro(); borsa(true) })
  pzk.osserva(aggiorna)
  addEventListener('resize', () => { if (dlg.open) { aggiorna(); disegnaBorsa() } })
  setInterval(() => { if (dlg.open) aggiornaBatteria() }, 30000)
}
let voceTimer = 0
function voce(testo, male = false) {
  S.voce.textContent = testo; S.voce.classList.toggle('male', male); S.voce.classList.add('si')
  clearTimeout(voceTimer); voceTimer = setTimeout(() => S.voce.classList.remove('si'), 4500)
}
function aggiornaBatteria() {
  const b = batteria()
  disegnaBatteria(S.batt, b)
  dlg.classList.toggle('carica', b.carica)
  dlg.classList.toggle('spento', false)
}
function aggiorna() {
  if (!dlg) return
  const c = pzk.conto(), s = pzk.saldo(), tav = Math.round((pzk.conto()?.pzk ?? s) - s)
  const mezzo = Math.round(s * 2) % 2 === 1
  display(S.saldo, mezzo ? `${Math.floor(s)}.5` : String(Math.round(s)), { alt: 0.5, su: 0.42 })
  S.sotto.textContent = c ? (tav > 0 ? `sul tavolo ${fmt(tav)} · ≈ ${fmtEur(s * pzk.tasso())} €` : `≈ ${fmtEur(s * pzk.tasso())} €`) : 'sessione · non variano'
  display(S.eur, c ? fmtEur(c.eur).replace(/\./g, '').replace(',', '.') : '----', { colore: '#ffb02e', spento: '#2a1a05', alt: 0.5, luce: !!c })
  S.targa.textContent = c ? c.ind : 'sessione'
  aggiornaBatteria()
  if (S.sezione) carta(S.sezione, true)
}

// ── la borsa ──
async function borsa(forza = false) {
  const da = PERIODI[periodo][0]
  S.periodo.textContent = PERIODI[periodo][1]
  if (!forza && borsaDati?.da === da && Date.now() - borsaDati.quando < 60000) return disegnaBorsa()
  try {
    const r = await fetch(`/api/borsa?da=${da}`)
    const d = await r.json()
    borsaDati = { ...d, da, quando: Date.now() }
  } catch { borsaDati = { ok: false, da, quando: Date.now() } }
  disegnaBorsa()
}
function disegnaBorsa() {
  const d = borsaDati
  if (!d) { disegnaGrafico(S.grafico, undefined); S.tasso.textContent = '…'; return }
  if (!d.ok) { disegnaGrafico(S.grafico, null); S.tasso.innerHTML = d?.offline ? 'chiusa' : '…'; S.var.textContent = ''; S.info.textContent = d?.offline ? 'la borsa apre quando il server ha il suo archivio' : ''; return }
  disegnaGrafico(S.grafico, d.punti, { da: d.da })
  S.tasso.innerHTML = `${d.tasso.toFixed(4)}<small>€ per $pzk</small><span class="w-inv">1 € = ${d.inverso.toFixed(3)} $pzk</span>`
  const nomi = { '24h': 'in 24 ore', '7g': 'in 7 giorni', '30g': 'in 30 giorni', tutto: 'da sempre' }
  const v = { '24h': d.var24, '7g': d.var7g, '30g': d.var30g, tutto: d.nata ? d.tasso / 1 - 1 : null }[d.da]
  if (v === null || v === undefined) { S.var.textContent = 'appena nata'; S.var.className = 'w-var' } else { S.var.textContent = `${v >= 0 ? '▲' : '▼'} ${Math.abs(v * 100).toFixed(2).replace('.', ',')} %`; S.var.className = `w-var ${v >= 0 ? 'su' : 'giu'}` }
  S.periodo.textContent = nomi[d.da]
  // il minimo e il massimo del periodo (perché sale o scende non si dice: la borsa è un mistero, come quelle vere)
  let lo = Infinity, hi = -Infinity
  for (const [, x] of d.punti ?? []) { if (x < lo) lo = x; if (x > hi) hi = x }
  S.info.innerHTML = d.punti?.length ? `<span>min <b>${lo.toFixed(4)}</b></span><span>max <b>${hi.toFixed(4)}</b></span><span>cap <b>${fmt(d.cap?.pzk ?? 0)}</b> · ${d.cap?.conti ?? 0} conti</span>` : ''
}

// ── la carta coi moduli ──
function mostra(sezione) {
  S.sezione = sezione
  for (const t of S.tasti) t.setAttribute('aria-pressed', String(t.dataset.s === sezione))
  if (!sezione) { S.carta.classList.remove('si'); return }
  carta(sezione)
  S.carta.classList.add('si')
}
function carta(sezione, soloDati = false) {
  const c = pzk.conto(), K = S.carta
  if (soloDati && K.dataset.sezione === sezione && K.dataset.conto === String(!!c)) { K.querySelectorAll('[data-vivo]').forEach((e) => vivo(e, c)); return }
  K.dataset.sezione = sezione; K.dataset.conto = String(!!c)
  K.innerHTML = ''
  const esito = el('p', 'w-esito')
  const di = (ok, testo) => { esito.textContent = testo; esito.classList.toggle('male', !ok) }
  const campo = (lab, attrs, nota) => { const w = el('div'); w.innerHTML = `<label>${lab}</label>`; const i = el('input'); Object.assign(i, attrs); w.appendChild(i); if (nota) w.appendChild(el('p', 'w-nota', nota)); return [w, i] }
  const pin = (lab = 'PIN (quattro cifre)') => campo(lab, { type: 'password', inputMode: 'numeric', autocomplete: 'off', maxLength: 4, pattern: '\\d{4}', placeholder: '····' })
  const bott = (testo, cls, fai) => { const b = el('button', `w-b ${cls}`, testo); b.type = 'button'; b.addEventListener('click', fai); return b }
  const attesa = async (b, fai) => { b.disabled = true; try { await fai() } finally { b.disabled = false } }

  if (sezione === 'conto' && !c) {
    K.innerHTML = `<h3>il conto <small>no sbatti: un nome e quattro cifre</small></h3>
      <p class="w-nota">senza conto giochi coi <b>1.000 $pzk della sessione</b>: non si salvano e non cambiano mai. col conto i tuoi $pzk restano, hanno un indirizzo (pzk + sei cifre), si mandano agli amici e vivono nella borsa: puoi parcheggiarli in EUR€ e riprenderli quando il cambio ti conviene. si parte con 1.000 $pzk.</p>`
    const sch = el('div', 'w-sch'); const bE = el('button', '', 'entra'), bC = el('button', '', 'crea il conto'); bE.type = bC.type = 'button'; sch.append(bE, bC); K.appendChild(sch)
    const form = el('form'); form.addEventListener('submit', (e) => e.preventDefault()); K.appendChild(form)
    let modo = 'entra'
    const disegna = () => {
      bE.setAttribute('aria-selected', String(modo === 'entra')); bC.setAttribute('aria-selected', String(modo === 'crea'))
      form.innerHTML = ''
      const [wn, iN] = campo('nome (o username)', { type: 'text', autocomplete: 'username', maxLength: 20, placeholder: 'il tuo nome' })
      const [wp, iP] = pin()
      const riga = el('div', 'w-riga'); riga.append(wn, wp); form.appendChild(riga)
      let iK = null
      const chiave = el('div'); chiave.hidden = true; const [wk, ik] = campo('chiave di amministrazione', { type: 'password', autocomplete: 'off' }, 'questo nome è di Alberto: serve la chiave del progetto'); chiave.appendChild(wk); iK = ik; form.appendChild(chiave)
      iN.addEventListener('input', () => { chiave.hidden = !(modo === 'crea' && /^\s*(pzkko|alberto|albertopecchini|pecchini|admin|banca|bancapzk|root)\s*$/i.test(iN.value)) })
      const az = el('div', 'w-azioni')
      const b = bott(modo === 'entra' ? 'entra' : 'crea il conto', 'giallo', () => attesa(b, async () => {
        const r = modo === 'entra' ? await pzk.entra(iN.value, iP.value) : await pzk.crea(iN.value, iP.value, iK?.value || undefined)
        if (!r.ok) return di(false, r.offline ? 'il wallet è in pausa: il server non ha ancora il suo archivio. per ora valgono i 1.000 della sessione' : r.errore)
        voce(r.nuovo ? `benvenuto, ${r.conto.nome}: ${r.conto.ind}` : `ciao ${r.conto.nome}`)
        mostra('conto'); borsa(true)
      }))
      form.addEventListener('submit', () => b.click(), { once: false })
      az.append(b); if (modo === 'crea') az.appendChild(el('p', 'w-nota', 'il PIN non si recupera: scegline uno che ricordi (per gli studenti unimore: le ultime quattro cifre del numero dell’e-mail vanno benissimo).'))
      form.append(az, esito)
      iN.focus()
    }
    bE.addEventListener('click', () => { modo = 'entra'; disegna() }); bC.addEventListener('click', () => { modo = 'crea'; disegna() })
    disegna()
    return
  }
  if (sezione === 'conto') {
    K.innerHTML = `<h3>${c.nome} <small>${c.ind}</small></h3>
      <p>hai <b data-vivo="pzk"></b> e <b data-vivo="eur"></b>. conto nato il ${new Date(c.creato).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
      <span data-vivo="invii"></span></p>
      <p class="w-nota">il saldo si salva da solo mentre giochi; il cambio è quello di quando il wallet si è sincronizzato (<span data-vivo="sync"></span>) e dopo mezz’ora si sincronizza di nuovo da sé.</p>`
    const az = el('div', 'w-azioni')
    const bS = bott('sincronizza', '', () => attesa(bS, async () => { const r = await pzk.sincronizza(); di(r.ok, r.ok ? `sincronizzato: 1 $pzk = ${pzk.tasso().toFixed(4)} €` : r.errore); borsa(true) }))
    const bU = bott('esci', 'piatto', () => attesa(bU, async () => { await pzk.esci(); voce('sei uscito: valgono i 1.000 della sessione'); mostra('conto') }))
    az.append(bS, bU)
    K.appendChild(az)
    const ul = el('ul', 'w-mosse'); ul.dataset.vivo = 'mosse'; K.appendChild(ul)
    K.appendChild(esito)
    K.querySelectorAll('[data-vivo]').forEach((e) => vivo(e, c))
    return
  }
  if (sezione === 'cambio') {
    if (!c) { K.innerHTML = '<h3>il cambio</h3><p>gli EUR€ (l’euro finto del wallet: non si prelevano, non si depositano, non si giocano) ci sono solo col conto. i 1.000 della sessione sono 1.000 e basta.</p>'; const b = bott('entra o crea il conto', 'giallo', () => mostra('conto')); K.appendChild(b); return }
    K.innerHTML = `<h3>il cambio <small>1 $pzk = <span data-vivo="tasso"></span> €</small></h3>
      <p class="w-nota">parcheggi i $pzk in EUR€ quando pensi che scendano e li riprendi quando ti conviene. gli EUR€ non si giocano: per giocarli vanno riconvertiti in $pzk, al cambio del momento. il cambio è quello della sincronizzazione (<span data-vivo="sync"></span>); gli spiccioli vanno a mezzi $pzk e a centesimi.</p>`
    const verso = el('div', 'w-verso'); const bA = el('button', '', '$pzk → EUR€'), bB = el('button', '', 'EUR€ → $pzk'); bA.type = bB.type = 'button'; verso.append(bA, bB); K.appendChild(verso)
    const fader = el('div', 'w-fader', '<div class="w-tacche"></div><input type="range" min="0" max="1000" step="1" value="0" aria-label="quanto convertire"><span class="w-led-f"></span>'); K.appendChild(fader)
    const conv = el('div', 'w-conv'); K.appendChild(conv)
    const az = el('div', 'w-azioni'); K.appendChild(az); K.appendChild(esito)
    const range = q(fader, 'input'), led = q(fader, '.w-led-f')
    let da = c.eur >= 0.01 && pzk.saldo() < 1 ? 'eur' : 'pzk'
    const tot = () => (da === 'pzk' ? pzk.saldo() : pzk.euro())
    const quanto = () => { const t = tot(); const v = (Number(range.value) / 1000) * t; return da === 'pzk' ? Math.round(v * 2) / 2 : Math.round(v * 100) / 100 }
    const scrivi = () => {
      bA.setAttribute('aria-pressed', String(da === 'pzk')); bB.setAttribute('aria-pressed', String(da === 'eur'))
      const n = quanto(), t = pzk.tasso()
      led.textContent = `${Math.round(Number(range.value) / 10)} %`
      conv.innerHTML = da === 'pzk' ? `<span>dai <b>${fmt(n)}</b> $pzk<br><small>di ${fmt(tot())}</small></span><span>ricevi <b>${fmtEur(n * t)}</b> EUR€</span>` : `<span>dai <b>${fmtEur(n)}</b> EUR€<br><small>di ${fmtEur(tot())}</small></span><span>ricevi <b>${fmt(Math.round((n / t) * 2) / 2)}</b> $pzk</span>`
      bF.disabled = !(n > 0)
    }
    const bF = bott('converti', 'giallo', () => attesa(bF, async () => {
      const n = quanto(); if (!(n > 0)) return
      const r = await pzk.converti(da, n)
      if (!r.ok) return di(false, r.errore)
      const f = r.fatto
      di(true, f.da === 'pzk' ? `fatto: ${fmt(f.n)} $pzk → ${fmtEur(f.eur)} EUR€ (a ${f.cambio.toFixed(4)})` : `fatto: ${fmtEur(f.eur)} EUR€ → ${fmt(f.n)} $pzk (a ${f.cambio.toFixed(4)})`)
      voce(f.da === 'pzk' ? `parcheggiati ${fmtEur(f.eur)} EUR€` : `+${fmt(f.n)} $pzk: vai a giocare`)
      range.value = '0'; scrivi()
    }))
    const bT = bott('tutto', '', () => { range.value = '1000'; scrivi() })
    az.append(bF, bT)
    bA.addEventListener('click', () => { da = 'pzk'; range.value = '0'; scrivi() }); bB.addEventListener('click', () => { da = 'eur'; range.value = '0'; scrivi() })
    range.addEventListener('input', scrivi)
    K.querySelectorAll('[data-vivo]').forEach((e) => vivo(e, c))
    scrivi()
    if (pzk.scaduto()) pzk.sincronizza().then(() => { scrivi(); K.querySelectorAll('[data-vivo]').forEach((e) => vivo(e, pzk.conto())) })
    return
  }
  if (sezione === 'invia') {
    if (!c) { K.innerHTML = '<h3>invia</h3><p>i $pzk si mandano da un conto a un altro (per indirizzo, pzk + sei cifre). serve il conto, e deve avere almeno 48 ore.</p>'; K.appendChild(bott('entra o crea il conto', 'giallo', () => mostra('conto'))); return }
    K.innerHTML = `<h3>invia $pzk <small>a un altro conto</small></h3><p class="w-nota"><span data-vivo="invii"></span> gli invii sono in $pzk, almeno 1; si vedono subito nel conto di chi li riceve.</p>`
    const [wi, iI] = campo('indirizzo', { type: 'text', inputMode: 'numeric', autocomplete: 'off', placeholder: 'pzk398893', maxLength: 10 })
    const [wq, iQ] = campo('quanti $pzk', { type: 'number', inputMode: 'decimal', min: 1, step: 0.5, placeholder: '10' })
    const riga = el('div', 'w-riga'); riga.append(wi, wq); K.appendChild(riga)
    const chi = el('p', 'w-nota'); K.appendChild(chi)
    iI.addEventListener('change', async () => { const m = /(\d{6})/.exec(iI.value); if (!m) { chi.textContent = ''; return } chi.textContent = '…'; const r = await pzk.chiE('pzk' + m[1]); chi.textContent = r.ok ? `è il conto di ${r.conto.nome}` : r.errore })
    const az = el('div', 'w-azioni'); K.appendChild(az); K.appendChild(esito)
    const b = bott('invia', 'giallo', () => attesa(b, async () => {
      const r = await pzk.invia(iI.value, Number(iQ.value))
      if (!r.ok) return di(false, r.errore)
      di(true, `fatto: ${fmt(r.fatto.n)} $pzk a ${r.fatto.nome} (${r.fatto.a})`); voce(`inviati ${fmt(r.fatto.n)} $pzk a ${r.fatto.nome}`); iQ.value = ''
    }))
    az.append(b)
    K.querySelectorAll('[data-vivo]').forEach((e) => vivo(e, c))
    return
  }
  if (sezione === 'altro') {
    if (!c) { K.innerHTML = '<h3>altro</h3><p>l’indirizzo, il PIN e il regalo di instagram stanno nel conto.</p>'; K.appendChild(bott('entra o crea il conto', 'giallo', () => mostra('conto'))); const ig = pzk.linkInstagram({ fatto: () => voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`) }); K.appendChild(el('p', '', '')).appendChild(ig); return }
    K.innerHTML = `<h3>altro <small>${c.ind}</small></h3>`
    // l'indirizzo: una volta sola
    const ind = el('div')
    if (!c.indCambiato) {
      ind.innerHTML = '<p>il tuo indirizzo è a caso: puoi cambiarlo <b>una volta sola</b> con sei cifre tue. se sei studente unimore, il numero della tua e-mail (quello prima di @studenti.unimore.it) è perfetto.</p>'
      const [wn, iN] = campo('sei cifre', { type: 'text', inputMode: 'numeric', autocomplete: 'off', maxLength: 6, pattern: '\\d{6}', placeholder: '123456' })
      const az = el('div', 'w-azioni')
      const b = bott('cambia indirizzo', '', () => attesa(b, async () => { if (!confirm(`pzk${iN.value}: sicuro? non si cambia più.`)) return; const r = await pzk.cambiaIndirizzo(iN.value); di(r.ok, r.ok ? `fatto: ora sei ${pzk.conto().ind}` : r.errore); if (r.ok) carta('altro') }))
      az.append(b); ind.append(wn, az)
    } else ind.innerHTML = `<p class="w-nota">l’indirizzo ${c.ind} l’hai scelto tu: non si cambia più.</p>`
    K.appendChild(ind)
    // il PIN
    const pinBox = el('div'); pinBox.innerHTML = '<label style="margin-top:16px">cambia il PIN</label>'
    const [w1, i1] = pin('PIN di adesso'), [w2, i2] = pin('PIN nuovo')
    const riga = el('div', 'w-riga'); riga.append(w1, w2); pinBox.appendChild(riga)
    const az2 = el('div', 'w-azioni'); const bP = bott('cambia PIN', '', () => attesa(bP, async () => { const r = await pzk.cambiaPin(i1.value, i2.value); di(r.ok, r.ok ? 'PIN cambiato' : r.errore); if (r.ok) i1.value = i2.value = '' })); az2.append(bP); pinBox.appendChild(az2)
    K.appendChild(pinBox)
    // instagram
    const igp = el('p'); igp.style.marginTop = '16px'
    igp.appendChild(pzk.linkInstagram({ fatto: () => voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`) }))
    if (c.ig) igp.appendChild(el('span', 'w-nota', 'il regalo di instagram l’hai già avuto: grazie.'))
    K.appendChild(igp)
    K.appendChild(esito)
  }
}
// i pezzi della carta che seguono il conto
function vivo(e, c) {
  const k = e.dataset.vivo
  if (!c) return
  if (k === 'pzk') e.textContent = `${fmt(c.pzk)} $pzk`
  else if (k === 'eur') e.textContent = `${fmtEur(c.eur)} EUR€`
  else if (k === 'tasso') e.textContent = pzk.tasso().toFixed(4)
  else if (k === 'sync') e.textContent = new Date(pzk.sincronizzato()).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
  else if (k === 'invii') e.textContent = c.invii ? 'puoi mandare $pzk agli altri conti.' : `gli invii si aprono il ${new Date(c.inviiDa).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} (48 ore dalla nascita del conto).`
  else if (k === 'mosse') {
    const NOMI = { nato: 'conto aperto', 'in-eur': 'in EUR€', 'in-pzk': 'in $pzk', inviato: 'inviati a', ricevuto: 'ricevuti da', indirizzo: 'indirizzo cambiato', instagram: 'regalo di instagram', trovato: 'trovati per terra', sussidio: 'sussidio' }
    e.innerHTML = [...(c.mosse ?? [])].reverse().map((m) => {
      const quando = new Date(m.t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      const segno = ['in-eur', 'inviato'].includes(m.tipo) ? 'meno' : m.tipo === 'indirizzo' ? '' : 'piu'
      const cosa = m.tipo === 'inviato' || m.tipo === 'ricevuto' ? `${NOMI[m.tipo]} ${m.nome ?? ''} (${m.a ?? m.da})` : m.tipo === 'indirizzo' ? `${NOMI[m.tipo]}: ${m.da} → ${m.a}` : m.tipo === 'in-eur' || m.tipo === 'in-pzk' ? `${NOMI[m.tipo]} a ${m.cambio?.toFixed(4)}` : NOMI[m.tipo] ?? m.tipo
      const n = m.tipo === 'in-eur' ? `−${fmt(m.n)} $pzk → +${fmtEur(m.eur)} €` : m.tipo === 'in-pzk' ? `−${fmtEur(m.eur)} € → +${fmt(m.n)} $pzk` : m.n != null ? `${segno === 'meno' ? '−' : '+'}${fmt(m.n)} $pzk` : ''
      return `<li><span>${quando} · ${cosa}</span><b class="${segno}">${n}</b></li>`
    }).join('') || '<li>niente ancora</li>'
  }
}

export function apri(sezione = null) {
  if (!dlg) costruisci()
  if (!dlg.open) { dlg.classList.remove('chiude'); dlg.showModal() }
  aggiorna()
  if (!borsaDati) disegnaBorsa()
  borsa()
  clearInterval(borsaTimer); borsaTimer = setInterval(() => { if (dlg.open) borsa(true) }, 60000)
  if (sezione) mostra(sezione === 'converti' ? 'cambio' : sezione === 'entra' ? 'conto' : sezione)
  else if (!pzk.conto() && !sessionStorage.getItem('pzkko-wallet-visto')) { mostra('conto'); try { sessionStorage.setItem('pzkko-wallet-visto', '1') } catch {} }
  if (sezione === 'converti' && pzk.conto()?.eur >= 0.01) voce(`hai ${fmtEur(pzk.euro())} EUR€: convertili per giocare`)
}
export function chiudi() {
  if (!dlg?.open) return
  clearInterval(borsaTimer)
  dlg.classList.add('chiude')
  setTimeout(() => { dlg.close(); dlg.classList.remove('chiude') }, RIDOTTO.matches ? 0 : 190)
}
