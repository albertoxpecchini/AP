// Utilità condivise dai moduli client.

export const $ = (selector, root = document) => root.querySelector(selector)
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
export const lerp = (a, b, t) => a + (b - a) * t

/** Come lerp, ma `t` vale per un fotogramma a 60 Hz: a 120 Hz ogni passo è più corto, la velocità resta quella. */
export const damp = (a, b, t, dt) => lerp(a, b, 1 - Math.pow(1 - t, Math.min(dt, 64) / 16.667))

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches

// Un solo listener di scroll/resize per tutta la pagina, sincronizzato con rAF.
const subscribers = new Set()
let queued = false
let bound = false

function flush() {
  queued = false
  const y = window.scrollY
  const vh = window.innerHeight
  subscribers.forEach((fn) => fn(y, vh))
}

function request() {
  if (queued) return
  queued = true
  requestAnimationFrame(flush)
}

/** Registra una funzione chiamata (al massimo una volta per frame) a ogni scroll o resize. */
export function onScroll(fn) {
  if (!bound) {
    addEventListener('scroll', request, { passive: true })
    addEventListener('resize', request)
    bound = true
  }
  subscribers.add(fn)
  fn(window.scrollY, window.innerHeight)
  return () => subscribers.delete(fn)
}

/** Blocca lo scroll della pagina e rende inerte tutto tranne `keep`. */
export function lockPage(keep) {
  document.body.classList.add('is-locked')
  const others = $$('body > *').filter((el) => el !== keep && !el.contains(keep) && !el.matches('script, .curtain, .cursor, .preview'))
  others.forEach((el) => el.setAttribute('inert', ''))
  return () => {
    document.body.classList.remove('is-locked')
    others.forEach((el) => el.removeAttribute('inert'))
  }
}

/** Mantiene il fuoco da tastiera dentro `container`. Restituisce la funzione per rilasciarlo. */
export function trapFocus(container) {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
  const onKey = (e) => {
    if (e.key !== 'Tab') return
    const items = $$(selector, container).filter((el) => el.offsetParent !== null)
    if (!items.length) return
    const first = items[0]
    const last = items.at(-1)
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  container.addEventListener('keydown', onKey)
  return () => container.removeEventListener('keydown', onKey)
}

/** Annuncio per le tecnologie assistive. */
let live
export function announce(message) {
  if (!live) {
    live = document.createElement('div')
    live.className = 'sr-only'
    live.setAttribute('aria-live', 'polite')
    document.body.append(live)
  }
  live.textContent = ''
  requestAnimationFrame(() => (live.textContent = message))
}
