// La luce (dal 2.11.2026): una macchia calda di minio che insegue il puntatore
// con ritardo setoso, e il bordo delle schede che si accende dove passa il mouse.
// Solo puntatori fini, niente con prefers-reduced-motion.

import { $, $$, damp, reducedMotion, finePointer } from './utils.js'

// ── La macchia che segue il mouse ────────────────────────────────────────────

export function initLume() {
  const el = $('[data-lume]')
  if (!el || !finePointer() || reducedMotion()) return
  let x = innerWidth / 2
  let y = innerHeight / 3
  let cx = x
  let cy = y
  let raf
  let then = 0

  const loop = (now) => {
    const dt = then ? now - then : 16.667
    then = now
    // più lenta del cursore: la luce arriva dopo, come un'ombra calda
    cx = damp(cx, x, 0.07, dt)
    cy = damp(cy, y, 0.07, dt)
    el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
    raf = Math.abs(cx - x) + Math.abs(cy - y) > 0.3 ? requestAnimationFrame(loop) : ((then = 0), null)
  }

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      el.classList.add('is-visible')
      raf ??= requestAnimationFrame(loop)
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-visible'))
}

// ── Il bordo che si accende (schede [data-spot]) ─────────────────────────────
// Ogni scheda riceve --mx/--my (in px, dal suo angolo): il CSS ci disegna un
// alone di minio mascherato sul bordo, e un velo più largo sul fondo.

export function initSpot() {
  if (!finePointer() || reducedMotion()) return
  const groups = $$('[data-spot-group]')
  const cards = $$('[data-spot]')
  if (!cards.length) return
  const set = (card, e) => {
    const r = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`)
    card.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`)
  }
  // in un gruppo tutte le schede sentono il mouse, così l'alone passa da una
  // all'altra senza spegnersi sul bordo
  for (const group of groups) {
    const own = $$('[data-spot]', group)
    group.addEventListener('pointermove', (e) => own.forEach((c) => set(c, e)), { passive: true })
    group.addEventListener('pointerenter', () => group.classList.add('is-lit'))
    group.addEventListener('pointerleave', () => group.classList.remove('is-lit'))
  }
  for (const card of cards) {
    if (card.closest('[data-spot-group]')) continue
    card.addEventListener('pointermove', (e) => set(card, e), { passive: true })
  }
}
