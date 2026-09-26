// Mascotte: gli occhi seguono il puntatore, ciascuno per conto suo; si
// incrociano quando il puntatore sta sul naso; sbattono le palpebre ogni tanto
// e, quando il puntatore è fermo o non c'è (touch), si guardano intorno.
// Il markup lo scrive mascot() in ui.js, le misure stanno in src/data/mascotte.js.

import { $, $$, onScroll, reducedMotion } from './utils.js'

const PUPIL = 0.46 // larghezza della pupilla rispetto all'occhio (mascot.css)
const ROOM = 1 - PUPIL - 0.06 // corsa massima della pupilla, in frazione del semiasse
const NEAR = 7 // entro tanti raggi il puntatore muove la pupilla in proporzione, oltre a fondo corsa

export function initMascots() {
  const els = $$('[data-mascot]')
  if (!els.length) return

  const mascots = els.map((el) => ({
    el,
    eyes: $$('.masc__eye', el).map((eye) => ({ eye, pupil: $('.masc__pupil', eye) })),
    nose: $('.masc__nose', el),
    visible: true,
    cross: false,
    wander: 0,
  }))

  // si anima solo chi è sullo schermo
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const m = mascots.find((x) => x.el === e.target)
          if (m) m.visible = e.isIntersecting
        }
      },
      { rootMargin: '15%' },
    )
    mascots.forEach((m) => io.observe(m.el))
  }

  let px = null
  let py = null
  let last = 0
  let raf = null

  const box = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rx: r.width / 2, ry: r.height / 2 }
  }

  /** Ogni occhio guarda il punto (tx, ty) dello schermo; `full` = a fondo corsa. */
  const look = (m, tx, ty, full = false) => {
    for (const { eye, pupil } of m.eyes) {
      const b = box(eye)
      if (!b.rx) continue
      const dx = tx - b.x
      const dy = ty - b.y
      const d = Math.hypot(dx, dy) || 1
      const k = full ? 1 : Math.min(1, d / (b.rx * NEAR))
      pupil.style.setProperty('--px', `${((dx / d) * b.rx * ROOM * k).toFixed(1)}px`)
      pupil.style.setProperty('--py', `${((dy / d) * b.ry * ROOM * k).toFixed(1)}px`)
    }
  }

  const onNose = (m) => {
    if (!m.nose || px === null) return false
    const b = box(m.nose)
    if (!b.rx) return false
    return ((px - b.x) / b.rx) ** 2 + ((py - b.y) / b.ry) ** 2 <= 1
  }

  const setCross = (m, cross) => {
    if (cross === m.cross) return
    m.cross = cross
    m.el.classList.toggle('is-cross', cross)
  }

  const update = () => {
    raf = null
    for (const m of mascots) {
      if (!m.visible) continue
      const cross = onNose(m)
      setCross(m, cross)
      if (cross) {
        const b = box(m.nose)
        look(m, b.x, b.y, true)
      } else if (px !== null) {
        look(m, px, py)
      }
    }
  }
  const schedule = () => {
    raf ??= requestAnimationFrame(update)
  }

  const track = (e) => {
    px = e.clientX
    py = e.clientY
    last = performance.now()
    mascots.forEach((m) => m.el.classList.remove('is-idle'))
    schedule()
  }
  addEventListener('pointermove', track, { passive: true })
  addEventListener('pointerdown', track, { passive: true })

  // dopo un tocco il «puntatore» non c'è più: si torna a guardarsi intorno
  addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType === 'mouse') return
      const at = last
      setTimeout(() => {
        if (last !== at) return
        px = py = null
        mascots.forEach((m) => setCross(m, false))
      }, 1500)
    },
    { passive: true },
  )

  // scorrendo, gli occhi restano puntati sul puntatore fermo
  onScroll(() => px !== null && schedule())

  if (reducedMotion()) return

  // sguardo in giro quando il puntatore è fermo da un po' o non c'è
  setInterval(() => {
    const now = performance.now()
    if (px !== null && now - last < 3500) return
    for (const m of mascots) {
      if (!m.visible || m.cross) continue
      m.el.classList.add('is-idle')
      if (now < m.wander) continue
      m.wander = now + 1400 + Math.random() * 2600
      const b = box(m.el)
      look(m, b.x + (Math.random() * 2 - 1) * innerWidth * 0.5, b.y + (Math.random() * 2 - 1) * innerHeight * 0.4)
    }
  }, 600)

  // battito di palpebre, ogni tanto doppio
  for (const m of mascots) {
    const eyes = m.eyes.map((e) => e.eye)
    const shut = (ms) => {
      eyes.forEach((e) => e.classList.add('is-blink'))
      setTimeout(() => eyes.forEach((e) => e.classList.remove('is-blink')), ms)
    }
    const blink = () => {
      if (m.visible && !document.hidden) {
        shut(130)
        if (Math.random() < 0.25) setTimeout(() => shut(130), 260)
      }
      setTimeout(blink, 2600 + Math.random() * 4200)
    }
    setTimeout(blink, 1200 + Math.random() * 2500)
  }
}
