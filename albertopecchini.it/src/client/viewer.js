// Visualizzatore delle tavole (src/templates/components/viewer.js): si sfoglia
// un disegno vettoriale come in un programma CAD. Trascina per spostarti (e
// lascia andare: il foglio scivola ancora un po'), Ctrl + rotella o due dita
// per ingrandire, doppio clic per avvicinarti, frecce per cambiare tavola (o
// per spostarti, quando la tavola è ingrandita), + e − per lo zoom, F o 0 per
// adattarla allo schermo.
//
// CHI DISEGNA. Le tavole vettoriali (i DWG e quelle da PDF) le disegna la
// scheda grafica: un canvas WebGL grande quanto il piano (src/client/gl-sheet.js)
// ridisegna la tavola a ogni fotogramma alla risoluzione dello schermo, quindi
// resta nitida anche mentre si ingrandisce. Sotto c'è sempre il foglio vero,
// .viewer__sheet, con la miniatura WebP: si vede finché il file non è pronto.
// Senza WebGL 2 (o se un file non si lascia preparare) si torna alla strada di
// prima: il foglio si muove con transform e, a vista ferma, prende la misura
// vera e il browser ridisegna l'SVG (o src/client/dwg-sheet.js il DWG su
// canvas 2D). Le pagine a immagine restano sempre <img>.
//
// SUL PIANO: la barra di scala (metri veri se la tavola ha una scala), le
// coordinate del disegno sotto il puntatore per i DWG, e da ingrandito una
// mappa della tavola con il riquadro di ciò che si vede (trascinabile).
//
// Nei case study la rotella scorre la pagina finché la tavola non è ingrandita
// e sul telefono un dito scorre la pagina: servono due dita. A tutto schermo, e
// nella pagina /portfolio/tavole/, il visualizzatore prende tutti i gesti.

import { $, $$, clamp, reducedMotion, lockPage, trapFocus, announce } from './utils.js'
import { createDwgLayer } from './dwg-sheet.js'
import { createGlStage } from './gl-sheet.js'

const SETTLE_MS = 180 // quanto dopo l'ultimo movimento la vista si considera ferma
const BASE = 1000 // larghezza del foglio a zoom 1, in px CSS
const DOUBLE_TAP_MS = 320
const GLIDE_MS = 80 // quanto prosegue il foglio lasciato in corsa (per la velocità che aveva)
const PAPER_MM = { A4: 297, A3: 420, A2: 594, A1: 841, A0: 1189 } // lato lungo
const PROGRESS = { scarico: 'Scarico il file…', leggo: 'Leggo il DWG…', preparo: 'Preparo il disegno…' }

const number = (v, digits = 2) => v.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const plain = (v) => Number(v.toPrecision(3)).toLocaleString('it-IT')

/** Una lunghezza tonda per la barra di scala: «5 m», «50 cm», «2 mm». */
function lengthLabel(v, unit) {
  if (unit === 'mm') return v >= 1000 ? `${plain(v / 1000)} m` : v >= 10 ? `${plain(v / 10)} cm` : `${plain(v)} mm`
  return v >= 1 ? `${plain(v)} m` : v >= 0.01 ? `${plain(v * 100)} cm` : `${plain(v * 1000)} mm`
}

export function initViewer() {
  $$('[data-viewer]').forEach(setup)
}

function setup(root) {
  const stage = $('[data-viewer-stage]', root)
  const sheetEl = $('[data-viewer-sheet]', root)
  const thumb = $('[data-viewer-thumb]', root)
  const items = $$('[data-viewer-go]', root)
  if (!stage || !sheetEl || !thumb || !items.length) return

  const page = root.hasAttribute('data-viewer-page')
  const still = reducedMotion()
  const list = $('[data-viewer-list]', root)
  const status = $('[data-viewer-status]', root)
  const hint = $('[data-viewer-hint]', root)
  const el = {
    meta: $('[data-viewer-meta]', root),
    name: $('[data-viewer-name]', root),
    project: $('[data-viewer-project]', root),
    note: $('[data-viewer-note]', root),
    pdf: $('[data-viewer-pdf]', root),
    caseLink: $('[data-viewer-case]', root),
    allLink: $('[data-viewer-all]', root),
    counts: $$('[data-viewer-count]', root),
    file: $('[data-viewer-file]', root),
    zoom: $('[data-viewer-zoom]', root),
    full: $('[data-viewer-full]', root),
    scaleBar: $('[data-viewer-scale] i', root),
    scaleLabel: $('[data-viewer-scale] b', root),
    scaleNote: $('[data-viewer-scale] small', root),
    xy: $('[data-viewer-xy]', root),
    engine: $('[data-viewer-engine]', root),
    map: $('[data-viewer-map]', root),
    mapImg: $('[data-viewer-map] img', root),
    mapFrame: $('[data-viewer-map] span', root),
  }

  // Le tavole, con la posizione dentro il proprio progetto (per il contatore)
  const sheets = items.map((a) => {
    const d = a.dataset
    const w = Number(d.w)
    const h = Number(d.h)
    const long = PAPER_MM[(d.paper || 'A3').toUpperCase()] || PAPER_MM.A3
    return {
      a,
      ...d,
      w,
      h,
      max: Number(d.max),
      boxN: d.box ? d.box.split(',').map(Number) : null,
      vector: !!d.dwg || /\.svg$/i.test(d.src),
      paperW: w >= h ? long : long / Math.SQRT2, // larghezza del foglio, in mm
      den: d.scale ? Number(d.scale.split(':')[1]) || 0 : 0,
    }
  })
  const groups = new Map()
  sheets.forEach((s) => {
    const g = groups.get(s.project) || []
    g.push(s)
    groups.set(s.project, g)
  })
  sheets.forEach((s) => {
    const g = groups.get(s.project)
    s.pos = g.indexOf(s) + 1
    s.total = g.length
  })
  // Lo stesso DWG serve più tavole: la zona che le contiene tutte e la più stretta
  const dwgs = new Map()
  sheets.forEach((s) => {
    if (!s.boxN) return
    const g = dwgs.get(s.dwg) || { box: [Infinity, Infinity, -Infinity, -Infinity], minW: Infinity }
    g.box = [Math.min(g.box[0], s.boxN[0]), Math.min(g.box[1], s.boxN[1]), Math.max(g.box[2], s.boxN[2]), Math.max(g.box[3], s.boxN[3])]
    g.minW = Math.min(g.minW, s.boxN[2] - s.boxN[0])
    dwgs.set(s.dwg, g)
  })

  // La scheda grafica, se c'è: il suo canvas sta sopra il foglio
  const gl = createGlStage(stage)
  if (gl) {
    sheetEl.after(gl.canvas)
    root.classList.add('is-gl')
  }
  /** Ciò che serve alla scheda grafica per disegnare una tavola. */
  const glSheet = (s) => {
    if (!s.dwg) return { kind: 'svg', url: s.src, paperMm: s.paperW, maxPx: s.max * 2 }
    const g = dwgs.get(s.dwg)
    return { kind: 'dwg', url: s.dwg, darken: s.darken === '1', box: s.boxN, paperMm: s.paperW, focus: g.box, maxScale: (s.max * 2) / g.minW }
  }

  // ── Stato ─────────────────────────────────────────────────────────────────
  // `view` è ciò che si vede, `target` dove si sta andando (coincidono durante
  // trascinamento e pizzico). `zc` è lo zoom a cui il foglio è stato misurato:
  // il transform applica solo il rapporto view.z / zc.

  let cur = -1
  let base = { w: BASE, h: BASE }
  let sw = stage.clientWidth
  let sh = stage.clientHeight
  let fitZ = 1
  let minZ = 0.5
  let maxZ = 16
  let zc = 1
  const view = { x: 0, y: 0, z: 1 }
  const target = { x: 0, y: 0, z: 1 }
  let raf = null
  let dwg = null // la tavola DWG disegnata su canvas 2D (strada di riserva)
  let pending = null
  let lastT = 0
  let settleTimer = 0
  let moving = false
  let full = false

  const zoomed = () => view.z > fitZ * 1.02

  const fit = () => {
    const pad = Math.min(24, sw * 0.03)
    const z = Math.min((sw - pad * 2) / base.w, (sh - pad * 2) / base.h)
    return { z, x: (sw - base.w * z) / 2, y: (sh - base.h * z) / 2 }
  }

  // Il foglio non esce mai del tutto: ne resta visibile almeno una striscia.
  const bound = (v) => {
    const w = base.w * v.z
    const h = base.h * v.z
    const mx = Math.min(sw * 0.3, w)
    const my = Math.min(sh * 0.3, h)
    return { z: v.z, x: clamp(v.x, mx - w, sw - mx), y: clamp(v.y, my - h, sh - my) }
  }

  const scaleTo = (z, px, py) => {
    const f = z / target.z
    return { z, x: px - (px - target.x) * f, y: py - (py - target.y) * f }
  }

  // ── Disegno ───────────────────────────────────────────────────────────────

  const commit = () => {
    if (Math.abs(view.z / zc - 1) < 0.002) return
    zc = view.z
    sheetEl.style.width = `${(base.w * zc).toFixed(2)}px`
    sheetEl.style.height = `${(base.h * zc).toFixed(2)}px`
    applied = ''
    apply()
  }

  // la scheda grafica ridisegna la tavola dov'è adesso
  const paint = () => gl?.draw({ x: view.x, y: view.y, w: base.w * view.z, h: base.h * view.z, zr: view.z / fitZ })

  // a vista ferma la tavola DWG su canvas 2D ridisegna la parte visibile alla scala vera
  const renderDwg = () => dwg?.render({ x: view.x, y: view.y, w: base.w * zc, h: base.h * zc, sw, sh })

  const settle = () => {
    moving = false
    root.classList.remove('is-moving')
    commit()
    renderDwg()
  }

  // Barra di scala: una lunghezza tonda larga un centinaio di pixel. Metri veri
  // se la tavola dichiara la scala (o se il DWG è in metri), altrimenti
  // millimetri del foglio stampato.
  let hudZ = 0
  const hud = () => {
    const s = sheets[cur]
    if (!s) return
    const w = base.w * view.z
    const h = base.h * view.z
    if (el.scaleBar && view.z !== hudZ) {
      hudZ = view.z
      let per = s.paperW / w
      let unit = 'mm'
      if (s.den) {
        per = (s.paperW * s.den) / 1000 / w
        unit = 'm'
      } else if (s.boxN && s.unit === 'm') {
        per = (s.boxN[2] - s.boxN[0]) / w
        unit = 'm'
      }
      const raw = per * 120
      const pow = 10 ** Math.floor(Math.log10(raw))
      const nice = (raw / pow >= 5 ? 5 : raw / pow >= 2 ? 2 : 1) * pow
      el.scaleBar.style.width = `${(nice / per).toFixed(1)}px`
      el.scaleLabel.textContent = lengthLabel(nice, unit)
      if (el.scaleNote) el.scaleNote.hidden = unit !== 'mm'
    }
    if (el.mapFrame && wasZoomed) {
      const x0 = clamp(-view.x / w, 0, 1)
      const y0 = clamp(-view.y / h, 0, 1)
      const x1 = clamp((sw - view.x) / w, 0, 1)
      const y1 = clamp((sh - view.y) / h, 0, 1)
      el.mapFrame.style.cssText = `left:${(x0 * 100).toFixed(2)}%;top:${(y0 * 100).toFixed(2)}%;width:${((x1 - x0) * 100).toFixed(2)}%;height:${((y1 - y0) * 100).toFixed(2)}%`
    }
  }

  let applied = ''
  let lastPct = -1
  let wasZoomed = null
  function apply() {
    const z = zoomed()
    if (z !== wasZoomed) root.classList.toggle('is-zoomed', (wasZoomed = z))
    const transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${(view.z / zc).toFixed(5)})`
    if (transform !== applied) {
      sheetEl.style.transform = applied = transform
      if (!moving) root.classList.add('is-moving')
      moving = true
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, SETTLE_MS)
      paint()
      hud()
    }
    const pct = Math.round((view.z / fitZ) * 100)
    if (pct !== lastPct && el.zoom) el.zoom.textContent = `${pct}%`
    lastPct = pct
  }

  const schedule = () => {
    pending ??= requestAnimationFrame(() => {
      pending = null
      apply()
    })
  }

  // Avvicinamento esponenziale al bersaglio, come il piano della pagina Stile
  const tick = (now) => {
    const dt = lastT ? Math.min(now - lastT, 64) : 1000 / 60
    lastT = now
    const k = 1 - Math.pow(0.78, dt / (1000 / 60))
    view.x += (target.x - view.x) * k
    view.y += (target.y - view.y) * k
    view.z += (target.z - view.z) * k
    const done = Math.abs(target.x - view.x) < 0.3 && Math.abs(target.y - view.y) < 0.3 && Math.abs(target.z / view.z - 1) < 0.001
    if (done) {
      Object.assign(view, target)
      raf = null
      lastT = 0
    } else {
      raf = requestAnimationFrame(tick)
    }
    apply()
  }

  const go = (to, { animate = true } = {}) => {
    const z = clamp(to.z ?? target.z, minZ, maxZ)
    Object.assign(target, bound({ x: to.x ?? target.x, y: to.y ?? target.y, z }))
    if (!animate || still) {
      Object.assign(view, target)
      if (raf) cancelAnimationFrame(raf)
      raf = null
      lastT = 0
      schedule()
      return
    }
    raf ??= requestAnimationFrame(tick)
  }

  const zoomAt = (factor, px, py, animate = false) => go(scaleTo(clamp(target.z * factor, minZ, maxZ), px, py), { animate })
  const center = () => ({ x: sw / 2, y: sh / 2 })

  // ── Misure ────────────────────────────────────────────────────────────────

  // posizione dello stage nella finestra: letta a inizio gesto, non a ogni evento
  let sx = 0
  let sy = 0
  const origin = () => {
    const r = stage.getBoundingClientRect()
    sx = r.left
    sy = r.top
  }
  const measure = () => {
    origin()
    sw = stage.clientWidth || 1
    sh = stage.clientHeight || 1
    const wasFit = Math.abs(target.z / fitZ - 1) < 0.01
    fitZ = fit().z
    minZ = fitZ * 0.6
    maxZ = Math.max(fitZ * 2, (cur >= 0 ? sheets[cur].max : 16000) / base.w)
    if (gl?.resize(sw, sh)) paint()
    return wasFit
  }

  // Il foglio torna adattato, senza animazione, ed è ridisegnato subito a quella scala
  const reset = () => {
    go(fit(), { animate: false })
    settle()
  }

  // ── Tavola corrente ───────────────────────────────────────────────────────

  let token = 0
  let statusTimer = 0
  const setStatus = (text, delay = 0) => {
    clearTimeout(statusTimer)
    if (!status) return
    if (!text) {
      status.hidden = true
      root.classList.remove('is-loading')
      return
    }
    statusTimer = setTimeout(() => {
      status.textContent = text
      status.hidden = false
      root.classList.add('is-loading')
    }, delay)
  }

  /** Chi sta disegnando la tavola: «gpu» con i numeri del file, o niente. */
  const setEngine = (live) => {
    root.classList.toggle('is-gl-live', live)
    if (!el.engine) return
    el.engine.hidden = !live
    const info = live && gl.info
    if (!info) return
    const n = (v) => v.toLocaleString('it-IT')
    el.engine.title = `Disegnata dalla scheda grafica (WebGL 2): ${n(info.segCount)} tratti, ${n(info.triCount / 3)} triangoli${info.glyphCount ? `, ${n(info.glyphCount)} lettere` : ''}${info.samples ? ` · antialias ${info.samples}×` : ''}${info.ms ? ` · pronta in ${n(info.ms)} ms` : ''}`
  }

  // La strada di riserva: il DWG su canvas 2D, l'SVG e le pagine raster in un <img>
  const loadPlain = (s, mine) => {
    if (s.dwg) {
      // la tavola si legge dal DWG: il worker lo decodifica, i canvas la disegnano
      const layer = createDwgLayer(sheetEl, s, { onStatus: (t) => mine === token && setStatus(t) })
      dwg = layer
      layer.ready.then(() => mine === token && renderDwg())
      return
    }
    if (s.src === s.thumb) return setStatus('')
    setStatus('Carico il disegno…', 250)
    const img = new Image()
    img.className = 'viewer__img viewer__img--full'
    img.alt = ''
    img.setAttribute('aria-hidden', 'true')
    img.decoding = 'async'
    img.src = s.src
    const done = () => {
      if (mine !== token) return
      sheetEl.append(img)
      requestAnimationFrame(() => img.classList.add('is-in'))
      setStatus('')
    }
    const failed = () => mine === token && setStatus('Disegno non disponibile: resta l’anteprima')
    if (img.decode) img.decode().then(done, () => (img.complete && img.naturalWidth ? done() : failed()))
    else {
      img.onload = done
      img.onerror = failed
    }
  }

  const loadFull = (s) => {
    const mine = ++token
    $$('.viewer__img--full', sheetEl).forEach((img) => img.remove())
    dwg?.destroy()
    dwg = null
    setEngine(false)
    if (!gl || !s.vector) {
      gl?.hide()
      loadPlain(s, mine)
      return
    }
    setStatus(s.dwg ? 'Apro il DWG…' : 'Apro il disegno…', 250)
    gl.show(glSheet(s), (p) => mine === token && setStatus(PROGRESS[p] || ''))
      .then((shown) => {
        if (!shown || mine !== token) return
        setStatus('')
        setEngine(true)
      })
      .catch((error) => {
        console.warn('[tavole] questa tavola non passa dalla scheda grafica:', error)
        if (mine !== token) return
        gl.hide()
        loadPlain(s, mine)
      })
  }

  // l'elenco scorre fino alla tavola corrente senza muovere la pagina; nella
  // pagina Tavole il titolo del progetto resta incollato in alto e non la deve coprire
  const reveal = (a) =>
    list &&
    requestAnimationFrame(() => {
      const lr = list.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      const title = $('.viewer__group-title', a.closest('.viewer__group') || list)
      const top = lr.top + (title && getComputedStyle(title).position === 'sticky' ? title.offsetHeight : 0)
      const behavior = still ? 'auto' : 'smooth'
      if (list.scrollHeight > list.clientHeight + 1 && (ar.top < top || ar.bottom > lr.bottom)) {
        list.scrollTo({ top: list.scrollTop + ar.top - top - (lr.bottom - top) / 2 + ar.height / 2, behavior })
      }
      if (list.scrollWidth > list.clientWidth + 1 && (ar.left < lr.left || ar.right > lr.right)) {
        list.scrollTo({ left: list.scrollLeft + ar.left - lr.left - lr.width / 2 + ar.width / 2, behavior })
      }
    })

  const show = (i, { say = true } = {}) => {
    i = (i + sheets.length) % sheets.length
    if (i === cur) return
    cur = i
    const s = sheets[i]
    base = { w: BASE, h: (BASE * s.h) / s.w }

    thumb.src = s.thumb
    thumb.width = s.w
    thumb.height = s.h
    thumb.alt = s.alt
    loadFull(s)

    items.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')))
    if (el.meta) el.meta.replaceChildren(...s.meta.split('|').map((m) => Object.assign(document.createElement('span'), { textContent: m })))
    if (el.name) el.name.textContent = s.title
    if (el.project) el.project.textContent = s.project
    if (el.note) el.note.textContent = s.note
    if (el.pdf) {
      el.pdf.hidden = !s.pdf
      if (s.pdf) {
        el.pdf.href = s.pdf
        el.pdf.setAttribute('download', s.pdfName || '')
      }
    }
    if (el.file) el.file.textContent = s.file
    if (el.caseLink) el.caseLink.href = s.href
    if (el.allLink) el.allLink.href = `/portfolio/tavole/#${s.a.id}`
    for (const c of el.counts) c.textContent = `${String(s.pos).padStart(2, '0')} / ${String(s.total).padStart(2, '0')}`
    if (el.map) {
      el.map.style.setProperty('--ratio', `${s.w} / ${s.h}`)
      el.map.classList.toggle('viewer__map--tall', s.h > s.w)
      if (el.mapImg) el.mapImg.src = s.mini || s.thumb
    }
    if (el.xy) el.xy.hidden = true
    hudZ = 0

    measure()
    reset()
    hud()
    reveal(s.a)
    if (page) history.replaceState(null, '', `#${s.a.id}`)
    if (say) announce(`Tavola ${s.n}: ${s.title}`)
  }

  const step = (d) => show(cur + d)

  // ── Rotella ───────────────────────────────────────────────────────────────

  let hintTimer = 0
  const flashHint = () => {
    if (!hint) return
    root.classList.add('is-hinting')
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => root.classList.remove('is-hinting'), 1400)
  }

  stage.addEventListener(
    'wheel',
    (e) => {
      const pinch = e.ctrlKey || e.metaKey
      if (!pinch && !page && !full && !zoomed()) return flashHint()
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sh : 1
      if (pinch) {
        origin()
        const dy = clamp(e.deltaY * unit, -60, 60)
        // la rotella va a scatti: lo zoom li raccorda; il pizzico sul trackpad è già continuo
        const notch = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 40
        zoomAt(Math.exp(-dy * 0.0045), e.clientX - sx, e.clientY - sy, notch)
        return
      }
      let dx = e.deltaX * unit
      let dy = e.deltaY * unit
      if (e.shiftKey && !dx) {
        dx = dy
        dy = 0
      }
      go({ x: target.x - dx, y: target.y - dy }, { animate: false })
    },
    { passive: false },
  )

  // ── Puntatori: un dito o il mouse spostano, due dita ingrandiscono ────────

  const pointers = new Map()
  let drag = null
  let pinch = null
  let lastTap = null
  let lastType = 'mouse'
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  // Coordinate del disegno sotto il puntatore (solo DWG, solo col mouse)
  let hover = null
  let hoverRaf = 0
  const coords = () => {
    hoverRaf = 0
    const s = sheets[cur]
    if (!el.xy || !hover || !s || !s.boxN) {
      if (el.xy) el.xy.hidden = true
      return
    }
    origin()
    const fx = (hover.x - sx - view.x) / (base.w * view.z)
    const fy = (hover.y - sy - view.y) / (base.h * view.z)
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) {
      el.xy.hidden = true
      return
    }
    const [x0, y0, x1, y1] = s.boxN
    el.xy.textContent = `x ${number(x0 + fx * (x1 - x0))}  y ${number(y1 - fy * (y1 - y0))}`
    el.xy.hidden = false
  }
  const setHover = (e) => {
    hover = e && e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null
    hoverRaf ||= requestAnimationFrame(coords)
  }
  stage.addEventListener('pointerleave', () => setHover(null))

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return
    measure()
    lastType = e.pointerType
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    stage.setPointerCapture?.(e.pointerId)
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, type: e.pointerType, trail: [] }
      pinch = null
      // un tocco ferma il foglio che sta ancora scivolando
      if (raf) go({ x: view.x, y: view.y, z: view.z }, { animate: false })
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      drag = null
    }
    if (e.button === 1) e.preventDefault()
  })

  stage.addEventListener('pointermove', (e) => {
    setHover(e)
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const d = dist(a, b)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const s = scaleTo(clamp((target.z * d) / pinch.d, minZ, maxZ), pinch.mx - sx, pinch.my - sy)
      go({ z: s.z, x: s.x + (mx - pinch.mx), y: s.y + (my - pinch.my) }, { animate: false })
      pinch = { d, mx, my }
      return
    }
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) {
      drag.moved = true
      root.classList.add('is-dragging')
    }
    if (!drag.moved) return
    // al dito, con la tavola adattata, il gesto orizzontale sfoglia le tavole
    if (drag.type === 'touch' && !zoomed() && !page && !full) return
    go({ x: target.x + dx, y: target.y + dy }, { animate: false })
    drag.x = e.clientX
    drag.y = e.clientY
    drag.panned = true
    drag.trail.push({ t: performance.now(), x: e.clientX, y: e.clientY })
    if (drag.trail.length > 6) drag.trail.shift()
  })

  const release = (e) => {
    if (!pointers.has(e.pointerId)) return
    pointers.delete(e.pointerId)
    const d = drag
    if (pointers.size === 0) {
      drag = null
      pinch = null
      root.classList.remove('is-dragging')
    } else if (pointers.size === 1) {
      const [p] = pointers.values()
      drag = { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: performance.now(), moved: true, type: p.type, trail: [] }
      pinch = null
    }
    if (!d || e.type === 'pointercancel') return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    // sfoglio col dito: uno scatto orizzontale netto sulla tavola adattata
    if (d.type === 'touch' && d.moved && !zoomed() && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1)
      return
    }
    // lasciato in corsa, il foglio prosegue un poco e rallenta
    if (d.panned && !still && d.trail.length > 1) {
      const now = performance.now()
      const a = d.trail.find((p) => now - p.t < 90) || d.trail.at(-1)
      const b = d.trail.at(-1)
      const dt = b.t - a.t
      if (dt > 8 && now - b.t < 60) {
        const vx = (b.x - a.x) / dt
        const vy = (b.y - a.y) / dt
        if (Math.hypot(vx, vy) > 0.25) go({ x: target.x + vx * GLIDE_MS, y: target.y + vy * GLIDE_MS })
      }
    }
    // doppio tocco (il doppio clic del mouse ha il suo evento)
    if (d.type === 'touch' && !d.moved) {
      const now = performance.now()
      if (lastTap && now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        lastTap = null
        closer(e.clientX - sx, e.clientY - sy)
      } else lastTap = { t: now, x: e.clientX, y: e.clientY }
    }
  }
  stage.addEventListener('pointerup', release)
  stage.addEventListener('pointercancel', release)
  stage.addEventListener('dragstart', (e) => e.preventDefault())

  // doppio clic: più vicino; da molto vicino si torna alla tavola intera
  const closer = (px, py) => (view.z > fitZ * 3.5 ? go(fit()) : zoomAt(2.5, px, py, true))
  stage.addEventListener('dblclick', (e) => {
    if (lastType === 'touch') return // il doppio tocco è già gestito sopra
    measure()
    closer(e.clientX - sx, e.clientY - sy)
  })

  // ── Mappa: premere o trascinare porta lì il centro della vista ────────────

  if (el.map) {
    let held = false
    const jump = (e) => {
      const r = el.map.getBoundingClientRect()
      const fx = clamp((e.clientX - r.left) / r.width, 0, 1)
      const fy = clamp((e.clientY - r.top) / r.height, 0, 1)
      go({ x: sw / 2 - fx * base.w * target.z, y: sh / 2 - fy * base.h * target.z }, { animate: false })
    }
    el.map.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      if (e.button !== 0) return
      held = true
      el.map.setPointerCapture?.(e.pointerId)
      measure()
      jump(e)
    })
    el.map.addEventListener('pointermove', (e) => {
      e.stopPropagation()
      if (held) jump(e)
    })
    const drop = (e) => {
      e.stopPropagation()
      held = false
    }
    el.map.addEventListener('pointerup', drop)
    el.map.addEventListener('pointercancel', drop)
    el.map.addEventListener('dblclick', (e) => e.stopPropagation())
    el.map.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true })
  }

  // ── Tastiera ──────────────────────────────────────────────────────────────

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable]')) return
    // nel case study il visualizzatore ascolta solo quando ha il fuoco
    if (!page && !full && !root.contains(document.activeElement)) return
    const c = center()
    const pan = 90
    switch (e.key) {
      case '+':
      case '=':
        zoomAt(1.4, c.x, c.y, true)
        break
      case '-':
      case '_':
        zoomAt(1 / 1.4, c.x, c.y, true)
        break
      case '0':
      case 'f':
      case 'F':
        go(fit())
        break
      case 'ArrowLeft':
        if (zoomed()) go({ x: target.x + pan })
        else step(-1)
        break
      case 'ArrowRight':
        if (zoomed()) go({ x: target.x - pan })
        else step(1)
        break
      case 'ArrowUp':
        if (!zoomed()) return
        go({ y: target.y + pan })
        break
      case 'ArrowDown':
        if (!zoomed()) return
        go({ y: target.y - pan })
        break
      case 'PageUp':
        step(-1)
        break
      case 'PageDown':
        step(1)
        break
      case 'Escape':
        if (!full) return
        setFull(false)
        break
      default:
        return
    }
    e.preventDefault()
  }
  ;(page ? document : root).addEventListener('keydown', onKey)

  // ── Schermo intero ────────────────────────────────────────────────────────
  // Il visualizzatore passa in fondo al <body> (nessun antenato con transform
  // può trattenere il position: fixed) e il resto della pagina diventa inerte.

  let placeholder = null
  let unlock = null
  let untrap = null
  let scrollY = 0
  const fullIcon = el.full?.innerHTML
  const shrinkIcon = '<svg class="icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'

  function setFull(on) {
    if (on === full) return
    full = on
    if (on) {
      scrollY = window.scrollY
      placeholder = document.createComment('viewer')
      root.before(placeholder)
      document.body.append(root)
      root.classList.add('is-full')
      unlock = lockPage(root)
      untrap = trapFocus(root)
    } else {
      root.classList.remove('is-full')
      unlock?.()
      untrap?.()
      placeholder?.replaceWith(root)
      placeholder = null
      window.scrollTo(0, scrollY)
    }
    if (el.full) {
      el.full.setAttribute('aria-pressed', String(on))
      el.full.setAttribute('aria-label', on ? 'Esci dallo schermo intero' : 'Schermo intero')
      el.full.innerHTML = on ? shrinkIcon : fullIcon
    }
    measure()
    reset()
    stage.focus({ preventScroll: true })
  }

  // ── Strumenti ─────────────────────────────────────────────────────────────

  $('[data-viewer-prev]', root)?.addEventListener('click', () => step(-1))
  $('[data-viewer-next]', root)?.addEventListener('click', () => step(1))
  $('[data-viewer-in]', root)?.addEventListener('click', () => zoomAt(1.4, center().x, center().y, true))
  $('[data-viewer-out]', root)?.addEventListener('click', () => zoomAt(1 / 1.4, center().x, center().y, true))
  el.zoom?.addEventListener('click', () => go(fit()))
  el.full?.addEventListener('click', () => setFull(!full))
  items.forEach((a, i) =>
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return // nuova scheda: si apre il disegno
      e.preventDefault()
      show(i)
      if (innerWidth < 768 && !page && !full) stage.scrollIntoView?.({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
    }),
  )

  // ── Avvio ─────────────────────────────────────────────────────────────────

  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1))
    const i = id ? items.findIndex((a) => a.id === id) : -1
    return i
  }

  root.classList.add('is-ready')
  const start = fromHash()
  show(start >= 0 ? start : 0, { say: false })
  addEventListener('hashchange', () => {
    const i = fromHash()
    if (i >= 0) show(i)
  })

  // Ridimensionamento: se la tavola era adattata si riadatta, altrimenti la
  // vista resta dov'è e cambiano solo i limiti dello zoom.
  const onResize = () => {
    const wasFit = measure()
    if (wasFit) reset()
    else go(target, { animate: false })
    hudZ = 0
    hud()
  }
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage)
  else addEventListener('resize', onResize)
}
