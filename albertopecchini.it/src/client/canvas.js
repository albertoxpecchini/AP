// Piano navigabile della pagina /stile/: zoom e spostamento come in un
// programma di disegno. Trascina per muoverti (o rotella), Ctrl + rotella e
// pizzico per ingrandire, doppio clic su una tavola per inquadrarla, tasti
// 1–5 per saltare alle tavole, F per vederle tutte, 0 per la scala reale.
// Le animazioni di una tavola ripartono ogni volta che viene inquadrata.

import { $, $$, clamp, reducedMotion } from './utils.js'

const MAX_Z = 4

export function initCanvas() {
  const root = $('[data-canvas]')
  if (!root) return
  const viewport = $('[data-canvas-viewport]', root)
  const world = $('[data-canvas-world]', root)
  const boards = $$('[data-board]', world)
  const readout = $('[data-canvas-zoom]', root)
  const goButtons = $$('[data-canvas-go]', root)
  const still = reducedMotion()

  // Stato: traslazione in px di schermo e scala. `view` è ciò che si vede,
  // `target` dove si sta andando (coincidono durante trascinamento e rotella).
  const view = { x: 0, y: 0, z: 1 }
  const target = { x: 0, y: 0, z: 1 }
  let minZ = 0.04
  let raf = null
  let suppressClick = false
  let space = false

  // ── Geometria ─────────────────────────────────────────────────────────────

  const rectOf = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })

  const bounds = () => {
    const items = [...boards, ...$$('[data-canvas-note]', world)]
    let x1 = Infinity
    let y1 = Infinity
    let x2 = -Infinity
    let y2 = -Infinity
    for (const el of items) {
      const r = rectOf(el)
      x1 = Math.min(x1, r.x)
      y1 = Math.min(y1, r.y)
      x2 = Math.max(x2, r.x + r.w)
      y2 = Math.max(y2, r.y + r.h)
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
  }

  const headerHeight = () => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))
    return Number.isFinite(v) ? v * 16 : 76
  }

  // Zona utile dello schermo: sotto l'header, accanto al pannello delle
  // tavole, sopra gli strumenti.
  const frame = () => {
    const mobile = innerWidth < 768
    const i = mobile ? { top: headerHeight() + 8, right: 8, bottom: 104, left: 8 } : { top: headerHeight() + 16, right: 24, bottom: 88, left: 296 }
    return { x: i.left, y: i.top, w: Math.max(120, viewport.clientWidth - i.left - i.right), h: Math.max(120, viewport.clientHeight - i.top - i.bottom) }
  }

  const fitAll = () => {
    const b = bounds()
    const f = frame()
    const pad = 60
    const z = clamp(Math.min(f.w / (b.w + pad * 2), f.h / (b.h + pad * 2)), 0.02, 1)
    return { z, x: f.x + (f.w - b.w * z) / 2 - b.x * z, y: f.y + (f.h - b.h * z) / 2 - b.y * z }
  }

  // Una tavola: entra tutta in larghezza (mai oltre la scala reale), bordo
  // alto allineato alla zona utile con lo spazio per il suo nome.
  const fitBoard = (el) => {
    const r = rectOf(el)
    const f = frame()
    const z = clamp(Math.min(1, f.w / (r.w + 48)), minZ, MAX_Z)
    return { z, x: f.x + (f.w - r.w * z) / 2 - r.x * z, y: f.y + 28 - r.y * z }
  }

  const scaleTo = (z, px, py) => {
    const f = z / target.z
    return { z, x: px - (px - target.x) * f, y: py - (py - target.y) * f }
  }

  const center = () => ({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 })

  // ── Applicazione e animazione ─────────────────────────────────────────────

  const apply = () => {
    world.style.transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${view.z.toFixed(4)})`
    root.style.setProperty('--z', view.z.toFixed(4))
    root.style.setProperty('--bx', `${view.x.toFixed(1)}px`)
    root.style.setProperty('--by', `${view.y.toFixed(1)}px`)
    if (readout) readout.textContent = `${Math.round(view.z * 100)}%`
    updateCurrent()
  }

  const tick = () => {
    const k = 0.18
    view.x += (target.x - view.x) * k
    view.y += (target.y - view.y) * k
    view.z += (target.z - view.z) * k
    const done = Math.abs(target.x - view.x) < 0.25 && Math.abs(target.y - view.y) < 0.25 && Math.abs(target.z - view.z) < 0.0004
    if (done) {
      Object.assign(view, target)
      raf = null
    } else {
      raf = requestAnimationFrame(tick)
    }
    apply()
  }

  const go = (to, { animate = true } = {}) => {
    Object.assign(target, to)
    target.z = clamp(target.z, minZ, MAX_Z)
    if (!animate || still) {
      Object.assign(view, target)
      if (raf) cancelAnimationFrame(raf)
      raf = null
      apply()
      return
    }
    raf ??= requestAnimationFrame(tick)
  }

  const zoomAt = (factor, px, py, animate = false) => go(scaleTo(clamp(target.z * factor, minZ, MAX_Z), px, py), { animate })

  // ── Tavola corrente: la più presente sullo schermo, a parità la più al centro ─

  let current = null
  function updateCurrent() {
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const diag = Math.hypot(vw, vh)
    let best = null
    let bestScore = 0
    for (const board of boards) {
      const r = rectOf(board)
      const bx1 = view.x + r.x * view.z
      const by1 = view.y + r.y * view.z
      const bx2 = bx1 + r.w * view.z
      const by2 = by1 + r.h * view.z
      const visible = Math.max(0, Math.min(vw, bx2) - Math.max(0, bx1)) * Math.max(0, Math.min(vh, by2) - Math.max(0, by1))
      const dist = Math.hypot((bx1 + bx2) / 2 - vw / 2, (by1 + by2) / 2 - vh / 2)
      const score = (visible / Math.min((bx2 - bx1) * (by2 - by1), vw * vh)) * (1 - (0.3 * dist) / diag)
      if (score > bestScore) {
        bestScore = score
        best = board
      }
    }
    if (best === current) return
    current = best
    boards.forEach((b) => b.classList.toggle('is-current', b === best))
    goButtons.forEach((btn) => {
      const on = Boolean(best) && btn.dataset.canvasGo === best.dataset.board
      btn.classList.toggle('is-current', on)
      if (on) btn.setAttribute('aria-current', 'true')
      else btn.removeAttribute('aria-current')
    })
  }

  // ── Animazioni delle tavole ───────────────────────────────────────────────

  const count = (el) => {
    const end = Number(el.dataset.bdCount)
    if (!Number.isFinite(end)) return
    const t0 = performance.now()
    const dur = 1400
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1)
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      el.textContent = String(Math.round(end * eased))
      if (t < 1) requestAnimationFrame(step)
    }
    el.textContent = '0'
    requestAnimationFrame(step)
  }

  const play = (board) => {
    if (still) {
      board.classList.add('is-live')
      return
    }
    board.classList.remove('is-live')
    void board.offsetWidth // le transizioni ripartono dallo stato iniziale
    board.classList.add('is-live')
    $$('[data-bd-count]', board).forEach(count)
  }

  const focusBoard = (board) => {
    go(fitBoard(board))
    play(board)
  }

  // Dimostrazioni cicliche: gli stati «passaggio» si rifanno da soli e le
  // righe dell'indice si passano il puntatore. Ferme quando la scheda è
  // nascosta o quando un puntatore vero sta sopra l'elemento.
  const demos = $$('[data-demo]', world)
  const rowLists = $$('[data-demo-rows]', world)
  if (!still && (demos.length || rowLists.length)) {
    let n = 0
    setInterval(() => {
      if (document.hidden) return
      n++
      demos.forEach((el) => {
        if (el.matches(':hover')) return
        el.classList.remove('is-hover')
        setTimeout(() => el.classList.add('is-hover'), 800)
      })
      rowLists.forEach((list) => {
        if (list.matches(':hover')) return
        const rows = $$('[data-demo-row]', list)
        rows.forEach((row, i) => row.classList.toggle('is-hover', i === n % rows.length))
      })
    }, 3400)
  }

  // ── Rotella: sposta; con Ctrl (o pizzico sul trackpad) ingrandisce ────────

  viewport.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1
      if (e.ctrlKey || e.metaKey) {
        const r = viewport.getBoundingClientRect()
        const dy = clamp(e.deltaY * unit, -60, 60)
        zoomAt(Math.exp(-dy * 0.0045), e.clientX - r.left, e.clientY - r.top)
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
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return
    if (e.target.closest('input, textarea, select')) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    viewport.setPointerCapture(e.pointerId)
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, moved: false }
      pinch = null
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      drag = null
    }
    if (e.button === 1 || space) e.preventDefault()
  })

  viewport.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const d = dist(a, b)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const r = viewport.getBoundingClientRect()
      const z = clamp((target.z * d) / pinch.d, minZ, MAX_Z)
      const s = scaleTo(z, pinch.mx - r.left, pinch.my - r.top)
      go({ z: s.z, x: s.x + (mx - pinch.mx), y: s.y + (my - pinch.my) }, { animate: false })
      pinch = { d, mx, my }
      return
    }
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true
      viewport.classList.add('is-dragging')
    }
    if (drag.moved) {
      go({ x: target.x + dx, y: target.y + dy }, { animate: false })
      drag.x = e.clientX
      drag.y = e.clientY
    }
  })

  const release = (e) => {
    if (!pointers.has(e.pointerId)) return
    pointers.delete(e.pointerId)
    if (drag?.moved) {
      // il clic che chiude un trascinamento non deve aprire il link sotto il puntatore
      suppressClick = true
      setTimeout(() => (suppressClick = false), 0)
    }
    if (pointers.size === 0) {
      drag = null
      pinch = null
      viewport.classList.remove('is-dragging')
    } else if (pointers.size === 1) {
      const [p] = pointers.values()
      drag = { x: p.x, y: p.y, moved: true }
      pinch = null
    }
  }
  viewport.addEventListener('pointerup', release)
  viewport.addEventListener('pointercancel', release)
  viewport.addEventListener('dragstart', (e) => e.preventDefault())
  viewport.addEventListener(
    'click',
    (e) => {
      if (!suppressClick && !space) return
      e.preventDefault()
      e.stopPropagation()
    },
    true,
  )

  viewport.addEventListener('dblclick', (e) => {
    if (e.target.closest('a, button, input, textarea, select')) return
    const board = e.target.closest('[data-board]')
    if (board) focusBoard(board)
    else go(fitAll())
  })

  // ── Tastiera ──────────────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, select, [contenteditable]')) return
    const c = center()
    const step = 80
    switch (e.key) {
      case '+':
      case '=':
        zoomAt(1.25, c.x, c.y, true)
        break
      case '-':
      case '_':
        zoomAt(0.8, c.x, c.y, true)
        break
      case '0':
        go(scaleTo(1, c.x, c.y))
        break
      case 'f':
      case 'F':
        go(fitAll())
        break
      case 'ArrowLeft':
        go({ x: target.x + step })
        break
      case 'ArrowRight':
        go({ x: target.x - step })
        break
      case 'ArrowUp':
        go({ y: target.y + step })
        break
      case 'ArrowDown':
        go({ y: target.y - step })
        break
      case ' ':
        if (e.target !== document.body && e.target !== viewport) return
        space = true
        root.classList.add('is-space')
        break
      default:
        if (!/^[1-9]$/.test(e.key) || !boards[e.key - 1]) return
        focusBoard(boards[e.key - 1])
    }
    e.preventDefault()
  })
  document.addEventListener('keyup', (e) => {
    if (e.key !== ' ') return
    space = false
    root.classList.remove('is-space')
  })

  // ── Strumenti ─────────────────────────────────────────────────────────────

  $('[data-canvas-zoom-in]', root)?.addEventListener('click', () => zoomAt(1.25, center().x, center().y, true))
  $('[data-canvas-zoom-out]', root)?.addEventListener('click', () => zoomAt(0.8, center().x, center().y, true))
  $('[data-canvas-fit]', root)?.addEventListener('click', () => go(fitAll()))
  $('[data-canvas-one]', root)?.addEventListener('click', () => go(scaleTo(1, center().x, center().y)))
  goButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const board = boards.find((b) => b.dataset.board === btn.dataset.canvasGo)
      if (board) focusBoard(board)
    }),
  )

  // ── Avvio ─────────────────────────────────────────────────────────────────

  const settle = () => {
    minZ = Math.max(0.02, fitAll().z * 0.5)
    if (target.z < minZ) go(scaleTo(minZ, center().x, center().y), { animate: false })
  }

  settle()
  // sul telefono la vista d'insieme è illeggibile: si parte dalla prima tavola
  go(innerWidth < 768 ? fitBoard(boards[0]) : fitAll(), { animate: false })
  boards.forEach((b, i) => setTimeout(() => play(b), 220 + i * 160))
  root.classList.add('is-ready')

  // i caratteri caricati dopo possono cambiare l'altezza delle tavole
  document.fonts?.ready.then(settle)
  addEventListener('resize', settle)
}
