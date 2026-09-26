// Tasti «sasso»: si inclinano verso il puntatore (--tx/--ty, usati dal
// transform in pebble.css) e restano premuti finché il dito o il mouse è giù.

import { $$, finePointer, reducedMotion } from './utils.js'

export function initPebbles() {
  const items = $$('[data-pebble]')
  if (!items.length) return

  // pressione: sul touch :active non è affidabile, la classe sì
  for (const el of items) {
    const up = () => el.classList.remove('is-pressed')
    el.addEventListener('pointerdown', () => el.classList.add('is-pressed'))
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)
  }

  if (!finePointer() || reducedMotion()) return

  for (const el of items) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      if (!r.width) return
      el.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
      el.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
    })
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--tx')
      el.style.removeProperty('--ty')
    })
  }
}
