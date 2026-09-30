// Piano navigabile della pagina /stile/: zoom e spostamento come in un
// programma di disegno. Trascina per muoverti (o rotella), Ctrl + rotella e
// pizzico per ingrandire, doppio clic su una tavola per inquadrarla, tasti
// 1–6 per saltare alle tavole, F per vederle tutte, 0 per la scala reale.
// Le animazioni di una tavola ripartono ogni volta che viene inquadrata.
//
// Prestazioni: a ogni fotogramma si scrivono solo trasformazioni di elementi
// che hanno un layer proprio (piano, nomi e anello della tavola corrente),
// così il browser le applica sulla GPU senza ricalcolare stili, layout o
// pittura delle tavole. La griglia di punti è disegnata da uno shader WebGL.
// Le misure delle tavole si leggono una volta e si tengono in memoria.

import { $, $$, clamp, reducedMotion } from './utils.js'

const MAX_Z = 4
const GRID = 24 // passo della griglia di punti, in px del piano
const FAR = 1.5 // fino a 1,5 volte lo zoom della vista d'insieme il piano è «lontano» (.is-far)
const SETTLE_MS = 160 // quanto dopo l'ultimo movimento il piano si considera fermo

// ── Griglia di punti ─────────────────────────────────────────────────────────
// Punti di 1 px (sfumati fino a 1,4 px) al centro di ogni cella da 24 px del
// piano, che si diradano con lo zoom e spariscono sotto il 30%. Con WebGL li
// disegna la GPU in un solo passaggio; se il contesto non c'è, o il driver
// grafico non è accelerato (failIfMajorPerformanceCaveat), resta il gradiente
// CSS di .canvas__bg, spostato con background-position.

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_origin;uniform float u_step;uniform float u_dpr;uniform float u_h;uniform vec4 u_color;
void main(){
  vec2 p=vec2(gl_FragCoord.x,u_h-gl_FragCoord.y)/u_dpr;
  vec2 c=mod(p-u_origin,u_step)-0.5*u_step;
  float a=clamp((1.4-length(c))/0.4,0.,1.)*u_color.a;
  gl_FragColor=vec4(u_color.rgb*a,a);
}`

// la griglia sfuma tra il 30% e l'80% di zoom
const gridAlpha = (z) => clamp((z - 0.3) * 2, 0, 1)

function dotGrid(host) {
  if (!host) return { draw() {}, resize() {} }
  const css = {
    draw(x, y, z) {
      const s = GRID * z
      host.style.backgroundSize = `${s}px ${s}px`
      host.style.backgroundPosition = `${x}px ${y}px`
      host.style.opacity = gridAlpha(z)
    },
    resize() {},
  }

  const el = document.createElement('canvas')
  const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true }
  const gl = el.getContext('webgl', opts)
  if (!gl) return css

  const shader = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return s
  }
  const prog = gl.createProgram()
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return css
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW) // un triangolo che copre lo schermo
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const u = (name) => gl.getUniformLocation(prog, name)
  const uOrigin = u('u_origin')
  const uStep = u('u_step')
  const uDpr = u('u_dpr')
  const uH = u('u_h')
  // inchiostro #10110F al 22%, come il gradiente CSS
  gl.uniform4f(u('u_color'), 16 / 255, 17 / 255, 15 / 255, 0.22)
  gl.clearColor(0, 0, 0, 0)

  let dpr = 1
  let blank = false
  let lost = false
  let opacity = 1
  const last = { x: 0, y: 0, z: 1 }

  const gpu = {
    draw(x, y, z) {
      Object.assign(last, { x, y, z })
      if (lost) return css.draw(x, y, z)
      const alpha = gridAlpha(z)
      if (!alpha) {
        // sotto il 30% la griglia non si vede: si pulisce una volta e basta
        if (!blank) gl.clear(gl.COLOR_BUFFER_BIT)
        blank = true
        return
      }
      blank = false
      const s = GRID * z
      if (alpha !== opacity) el.style.opacity = opacity = alpha
      gl.uniform2f(uOrigin, ((x % s) + s) % s, ((y % s) + s) % s)
      gl.uniform1f(uStep, s)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    resize() {
      // fino a 2× basta: i punti sono sfumati, oltre si paga solo in pixel
      dpr = Math.min(devicePixelRatio || 1, 2)
      el.width = Math.max(1, Math.round(host.clientWidth * dpr))
      el.height = Math.max(1, Math.round(host.clientHeight * dpr))
      gl.viewport(0, 0, el.width, el.height)
      gl.uniform1f(uDpr, dpr)
      gl.uniform1f(uH, el.height)
      blank = false
      gpu.draw(last.x, last.y, last.z)
    },
  }

  // contesto perso (driver riavviato, GPU sotto sforzo): si torna al CSS
  el.addEventListener('webglcontextlost', () => {
    lost = true
    host.classList.remove('is-gl')
    el.remove()
    css.draw(last.x, last.y, last.z)
  })

  host.classList.add('is-gl')
  host.append(el)
  gpu.resize()
  return gpu
}

export function initCanvas() {
  const root = $('[data-canvas]')
  if (!root) return
  const viewport = $('[data-canvas-viewport]', root)
  const world = $('[data-canvas-world]', root)
  const boards = $$('[data-board]', world)
  const readout = $('[data-canvas-zoom]', root)
  const goButtons = $$('[data-canvas-go]', root)
  const notes = $$('[data-canvas-note]', world)
  const still = reducedMotion()
  const grid = dotGrid($('.canvas__bg', root))

  // Stato: traslazione in px di schermo e scala. `view` è ciò che si vede,
  // `target` dove si sta andando (coincidono durante trascinamento e rotella).
  const view = { x: 0, y: 0, z: 1 }
  const target = { x: 0, y: 0, z: 1 }
  let minZ = 0.04
  let farZ = 0
  let raf = null
  let pending = null
  let lastT = 0
  let lastZ = -1
  let lastPct = -1
  let current = null
  let far = null
  let moving = false
  let movingTimer = 0
  let suppressClick = false
  let space = false

  // ── Geometria ─────────────────────────────────────────────────────────────
  // Misure lette dal DOM una volta sola (e di nuovo quando cambiano finestra,
  // caratteri o altezza delle tavole): leggerle a ogni fotogramma, dopo aver
  // scritto gli stili, costringerebbe il browser a rifare il layout.

  const rects = new Map()
  const offscreen = new Map()
  const labels = boards.map((board) => ({ board, el: $('.board__name', board), ring: $('.board__ring', board), natural: 0, max: 0 }))
  let vw = viewport.clientWidth
  let vh = viewport.clientHeight
  let vx = 0
  let vy = 0

  const rectOf = (el) => rects.get(el) ?? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }

  const measure = () => {
    labels.forEach((l) => l.el && (l.el.style.maxWidth = ''))
    const r = viewport.getBoundingClientRect()
    vx = r.left
    vy = r.top
    vw = viewport.clientWidth
    vh = viewport.clientHeight
    for (const el of [...boards, ...notes]) rects.set(el, { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight })
    labels.forEach((l) => {
      if (!l.el) return
      l.natural = l.el.offsetWidth
      l.max = 0
    })
    lastZ = -1 // nomi e anello vanno riallineati alle nuove misure
  }

  const bounds = () => {
    let x1 = Infinity
    let y1 = Infinity
    let x2 = -Infinity
    let y2 = -Infinity
    for (const el of [...boards, ...notes]) {
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
    return { x: i.left, y: i.top, w: Math.max(120, vw - i.left - i.right), h: Math.max(120, vh - i.top - i.bottom) }
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

  const center = () => ({ x: vw / 2, y: vh / 2 })

  // ── Applicazione e animazione ─────────────────────────────────────────────

  // Nomi delle tavole: restano a scala 1 sullo schermo (controscala dentro il
  // piano) e, quando la tavola è più stretta del nome, si accorciano con i
  // puntini. Il limite di larghezza cambia il layout, quindi si scrive solo
  // quando serve davvero (vista d'insieme molto ridotta).
  const placeLabels = () => {
    const z = view.z
    for (const l of labels) {
      if (!l.el) continue
      l.el.style.transform = `scale(${(1 / z).toFixed(5)})`
      const room = Math.floor(rectOf(l.board).w * z - 6)
      const max = l.natural > room ? Math.max(0, room) : 0 // 0 = nessun limite
      if (max === l.max) continue
      l.el.style.maxWidth = max ? `${max}px` : ''
      l.max = max
    }
  }

  // Anello della tavola corrente: un rettangolo minio dietro la cornice,
  // allargato con una scala di 1,5 px di schermo per lato a ogni zoom.
  const placeRing = () => {
    const l = current && labels.find((x) => x.board === current)
    if (!l?.ring) return
    const r = rectOf(current)
    const d = 3 / view.z
    l.ring.style.transform = `scale(${(1 + d / r.w).toFixed(5)}, ${(1 + d / r.h).toFixed(5)})`
  }

  // .is-moving sul piano mentre la vista cambia (e per SETTLE_MS dopo),
  // .is-far vicino alla vista d'insieme, dove le tavole sono troppo piccole
  // per le animazioni di dettaglio: il CSS ci ferma quelle costose.
  const markMoving = () => {
    if (!moving) root.classList.add('is-moving')
    moving = true
    clearTimeout(movingTimer)
    movingTimer = setTimeout(() => {
      moving = false
      root.classList.remove('is-moving')
    }, SETTLE_MS)
  }

  let applied = ''
  const apply = () => {
    const transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${view.z.toFixed(4)})`
    if (transform !== applied) {
      world.style.transform = applied = transform
      grid.draw(view.x, view.y, view.z)
      markMoving()
    }
    const zoomed = view.z !== lastZ
    if (zoomed) {
      lastZ = view.z
      placeLabels()
      const pct = Math.round(view.z * 100)
      if (readout && pct !== lastPct) readout.textContent = `${pct}%`
      lastPct = pct
      if (far !== view.z < farZ) root.classList.toggle('is-far', (far = view.z < farZ))
    }
    if (updateCurrent() || zoomed) placeRing()
  }

  // una sola scrittura per fotogramma, anche se rotella e puntatore mandano
  // più eventi nello stesso intervallo
  const schedule = () => {
    pending ??= requestAnimationFrame(() => {
      pending = null
      apply()
    })
  }

  // Avvicinamento esponenziale al bersaglio: il 18% della distanza ogni
  // sessantesimo di secondo, qualunque sia la frequenza dello schermo.
  const tick = (now) => {
    const dt = lastT ? Math.min(now - lastT, 64) : 1000 / 60
    lastT = now
    const k = 1 - Math.pow(0.82, dt / (1000 / 60))
    view.x += (target.x - view.x) * k
    view.y += (target.y - view.y) * k
    view.z += (target.z - view.z) * k
    const done = Math.abs(target.x - view.x) < 0.25 && Math.abs(target.y - view.y) < 0.25 && Math.abs(target.z - view.z) < 0.0004
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
    Object.assign(target, to)
    target.z = clamp(target.z, minZ, MAX_Z)
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

  const zoomAt = (factor, px, py, animate = false) => go(scaleTo(clamp(target.z * factor, minZ, MAX_Z), px, py), { animate })

  // ── Tavola corrente: la più presente sullo schermo, a parità la più al centro ─
  // Le tavole fuori dallo schermo ricevono .is-off, che mette in pausa le loro
  // animazioni a ciclo. Restituisce true se la tavola corrente è cambiata.

  function updateCurrent() {
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
      const off = visible === 0
      if (offscreen.get(board) !== off) {
        offscreen.set(board, off)
        board.classList.toggle('is-off', off)
      }
      const dist = Math.hypot((bx1 + bx2) / 2 - vw / 2, (by1 + by2) / 2 - vh / 2)
      const score = (visible / Math.min((bx2 - bx1) * (by2 - by1), vw * vh)) * (1 - (0.3 * dist) / diag)
      if (score > bestScore) {
        bestScore = score
        best = board
      }
    }
    if (best === current) return false
    current = best
    boards.forEach((b) => b.classList.toggle('is-current', b === best))
    goButtons.forEach((btn) => {
      const on = Boolean(best) && btn.dataset.canvasGo === best.dataset.board
      btn.classList.toggle('is-current', on)
      if (on) btn.setAttribute('aria-current', 'true')
      else btn.removeAttribute('aria-current')
    })
    return true
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
  // nascosta, quando la tavola è fuori dallo schermo o quando un puntatore
  // vero sta sopra l'elemento.
  const demos = $$('[data-demo]', world)
  const rowLists = $$('[data-demo-rows]', world)
  if (!still && (demos.length || rowLists.length)) {
    let n = 0
    setInterval(() => {
      if (document.hidden || moving || far) return
      n++
      demos.forEach((el) => {
        if (el.matches(':hover') || el.closest('.is-off')) return
        el.classList.remove('is-hover')
        setTimeout(() => el.classList.add('is-hover'), 800)
      })
      rowLists.forEach((list) => {
        if (list.matches(':hover') || list.closest('.is-off')) return
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
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1
      if (e.ctrlKey || e.metaKey) {
        const dy = clamp(e.deltaY * unit, -60, 60)
        zoomAt(Math.exp(-dy * 0.0045), e.clientX - vx, e.clientY - vy)
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
    // un burattino della tavola 05 ha già preso il puntatore (si tira un pezzo, non il piano)
    if (e.defaultPrevented) return
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
      const z = clamp((target.z * d) / pinch.d, minZ, MAX_Z)
      const s = scaleTo(z, pinch.mx - vx, pinch.my - vy)
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

  // Misure, griglia e zoom minimo: all'avvio e ogni volta che cambiano la
  // finestra, l'altezza di una tavola o i caratteri.
  const settle = () => {
    measure()
    grid.resize()
    const fit = fitAll().z
    minZ = Math.max(0.02, fit * 0.5)
    farZ = fit * FAR
    if (target.z < minZ) go(scaleTo(minZ, center().x, center().y), { animate: false })
    else schedule()
  }

  settle()
  // sul telefono la vista d'insieme è illeggibile: si parte dalla prima tavola
  go(innerWidth < 768 ? fitBoard(boards[0]) : fitAll(), { animate: false })
  boards.forEach((b, i) => setTimeout(() => play(b), 220 + i * 160))
  root.classList.add('is-ready')

  // i caratteri caricati dopo cambiano la larghezza dei nomi e l'altezza delle tavole
  document.fonts?.ready.then(settle)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(settle)
    ;[viewport, ...boards].forEach((el) => ro.observe(el))
  } else {
    addEventListener('resize', settle)
  }
}
