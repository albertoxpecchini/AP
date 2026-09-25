// Visualizzatore delle tavole (src/templates/components/viewer.js): si sfoglia
// un disegno vettoriale come in un programma CAD. Trascina per spostarti,
// Ctrl + rotella o due dita per ingrandire, doppio clic per avvicinarti,
// frecce per cambiare tavola (o per spostarti, quando la tavola è ingrandita),
// + e − per lo zoom, F o 0 per adattarla allo schermo.
//
// Il foglio è un <img> dentro .viewer__sheet; per le tavole DWG sono due canvas
// disegnati da src/client/dwg-sheet.js leggendo il file DWG. Durante i gesti si muove solo con
// transform, che la GPU applica senza ridisegnare; quando la vista si ferma il
// foglio prende la misura vera (width/height) e il browser ridisegna l'SVG
// nitido a quella scala. Prima che l'SVG arrivi si vede la miniatura WebP.
//
// Nei case study la rotella scorre la pagina finché la tavola non è ingrandita
// e sul telefono un dito scorre la pagina: servono due dita. A tutto schermo, e
// nella pagina /portfolio/tavole/, il visualizzatore prende tutti i gesti.

import { $, $$, clamp, reducedMotion, lockPage, trapFocus, announce } from './utils.js'
import { createDwgLayer } from './dwg-sheet.js'

const SETTLE_MS = 180 // quanto dopo l'ultimo movimento la vista si considera ferma
const BASE = 1000 // larghezza del foglio a zoom 1, in px CSS
const DOUBLE_TAP_MS = 320

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
    count: $('[data-viewer-count]', root),
    zoom: $('[data-viewer-zoom]', root),
    full: $('[data-viewer-full]', root),
  }

  // Le tavole, con la posizione dentro il proprio progetto (per il contatore)
  const sheets = items.map((a) => ({ a, ...a.dataset, w: Number(a.dataset.w), h: Number(a.dataset.h), max: Number(a.dataset.max) }))
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

  // ── Stato ─────────────────────────────────────────────────────────────────
  // `view` è ciò che si vede, `target` dove si sta andando (coincidono durante
  // trascinamento, rotella e pizzico). `zc` è lo zoom a cui il foglio è stato
  // ridisegnato: il transform applica solo il rapporto view.z / zc.

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
  let dwg = null // la tavola DWG corrente, se il foglio viene da un DWG
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

  // a vista ferma la tavola DWG ridisegna la parte visibile alla scala vera
  const renderDwg = () => dwg?.render({ x: view.x, y: view.y, w: base.w * zc, h: base.h * zc, sw, sh })

  const settle = () => {
    moving = false
    root.classList.remove('is-moving')
    commit()
    renderDwg()
  }

  let applied = ''
  let lastPct = -1
  let wasZoomed = null
  function apply() {
    const transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${(view.z / zc).toFixed(5)})`
    if (transform !== applied) {
      sheetEl.style.transform = applied = transform
      if (!moving) root.classList.add('is-moving')
      moving = true
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, SETTLE_MS)
    }
    const pct = Math.round((view.z / fitZ) * 100)
    if (pct !== lastPct && el.zoom) el.zoom.textContent = `${pct}%`
    lastPct = pct
    const z = zoomed()
    if (z !== wasZoomed) root.classList.toggle('is-zoomed', (wasZoomed = z))
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
      return
    }
    statusTimer = setTimeout(() => {
      status.textContent = text
      status.hidden = false
    }, delay)
  }

  const loadFull = (s) => {
    const mine = ++token
    $$('.viewer__img--full', sheetEl).forEach((img) => img.remove())
    dwg?.destroy()
    dwg = null
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
      if (s.pdf) el.pdf.href = s.pdf
    }
    if (el.caseLink) el.caseLink.href = s.href
    if (el.allLink) el.allLink.href = `/portfolio/tavole/#${s.a.id}`
    if (el.count) el.count.textContent = `${String(s.pos).padStart(2, '0')} / ${String(s.total).padStart(2, '0')}`

    measure()
    reset()
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
        zoomAt(Math.exp(-dy * 0.0045), e.clientX - sx, e.clientY - sy)
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

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return
    measure()
    lastType = e.pointerType
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    stage.setPointerCapture?.(e.pointerId)
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, type: e.pointerType }
      pinch = null
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      drag = null
    }
    if (e.button === 1) e.preventDefault()
  })

  stage.addEventListener('pointermove', (e) => {
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
      drag = { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: performance.now(), moved: true, type: p.type }
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
  }
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage)
  else addEventListener('resize', onResize)
}
