// Micro-interazioni: rivelazione allo scorrimento, numeri animati, parallasse,
// cursore personalizzato, elementi magnetici, anteprime flottanti e scorrevoli.

import { $, $$, onScroll, clamp, lerp, reducedMotion, finePointer } from './utils.js'

// ── Rivelazione allo scorrimento ─────────────────────────────────────────────

export function initReveal() {
  const items = $$('[data-reveal]')
  if (!items.length) return
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -7% 0px', threshold: 0.06 },
  )
  // se la pagina entra con la tendina, aspetta che si sia alzata
  const delay = document.documentElement.classList.contains('is-entering') ? 520 : 60
  setTimeout(() => items.forEach((el) => io.observe(el)), delay)

  // Un riquadro ancora chiuso dal clip-path — o solo traslato e trasparente —
  // risulta "non visibile" al lazy loading nativo: le sue immagini partirebbero
  // solo a rivelazione avvenuta, e un mockup che deve già conoscere l'altezza
  // della pagina per scorrere resterebbe vuoto. Le avviamo poco prima che
  // entrino nello schermo, così all'apertura sono già pronte.
  const near = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        $$('img[loading="lazy"]', entry.target).forEach((img) => (img.loading = 'eager'))
        near.unobserve(entry.target)
      }
    },
    { rootMargin: '900px 0px' },
  )
  items.filter((el) => $('img[loading="lazy"]', el)).forEach((el) => near.observe(el))
}

// ── Numeri con conteggio ─────────────────────────────────────────────────────

export function initCounters() {
  const items = $$('[data-count]')
  if (!items.length) return
  const run = (el) => {
    const target = Number(el.dataset.count)
    if (!Number.isFinite(target) || reducedMotion()) return
    const duration = 1600
    const start = performance.now()
    const frame = (now) => {
      const t = clamp((now - start) / duration, 0, 1)
      const eased = 1 - Math.pow(2, -10 * t)
      el.textContent = String(Math.round(target * (t === 1 ? 1 : eased)))
      if (t < 1) requestAnimationFrame(frame)
    }
    el.textContent = '0'
    requestAnimationFrame(frame)
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        run(entry.target)
        io.unobserve(entry.target)
      }),
    { threshold: 0.6 },
  )
  items.forEach((el) => io.observe(el))
}

// ── Parallasse leggera delle immagini + inclinazione della figura hero ───────

export function initParallax() {
  if (reducedMotion()) return
  const items = $$('[data-parallax]')
  if (items.length) {
    const visible = new Set()
    const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '10% 0px' })
    items.forEach((el) => io.observe(el))
    onScroll((_, vh) => {
      const moves = []
      visible.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect()
        const factor = Number(el.dataset.parallax) || 0.08
        const p = clamp((rect.top + rect.height / 2 - vh / 2) / vh, -1, 1)
        moves.push([el, clamp(p * factor * rect.height * -1, -rect.height * 0.065, rect.height * 0.065)])
      })
      moves.forEach(([el, y]) => (el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`))
    })
  }

  const tilt = $('[data-tilt]')
  if (tilt && finePointer()) {
    const area = tilt.closest('section') || tilt
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf
    const loop = () => {
      cx = lerp(cx, tx, 0.08)
      cy = lerp(cy, ty, 0.08)
      tilt.style.transform = `perspective(1200px) rotateY(${(cx * 2.2).toFixed(2)}deg) rotateX(${(-cy * 2.2).toFixed(2)}deg) translate3d(${(cx * 6).toFixed(1)}px, ${(cy * 6).toFixed(1)}px, 0)`
      raf = Math.abs(cx - tx) + Math.abs(cy - ty) > 0.001 ? requestAnimationFrame(loop) : null
    }
    area.addEventListener('pointermove', (e) => {
      const r = area.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
      raf ??= requestAnimationFrame(loop)
    })
    area.addEventListener('pointerleave', () => {
      tx = ty = 0
      raf ??= requestAnimationFrame(loop)
    })
  }
}

// ── Cursore personalizzato ───────────────────────────────────────────────────

export function initCursor() {
  const el = $('[data-cursor-el]')
  if (!el || !finePointer() || reducedMotion()) return
  document.documentElement.classList.add('has-cursor')
  const label = $('.cursor__label', el)
  let x = innerWidth / 2
  let y = innerHeight / 2
  let cx = x
  let cy = y
  let raf

  const loop = () => {
    cx = lerp(cx, x, 0.2)
    cy = lerp(cy, y, 0.2)
    el.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
    raf = Math.abs(cx - x) + Math.abs(cy - y) > 0.1 ? requestAnimationFrame(loop) : null
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

  document.addEventListener('pointerover', (e) => {
    const target = e.target instanceof Element ? e.target : null
    if (!target) return
    const labelled = target.closest('[data-cursor]')
    const field = target.closest('input:not([type=range]):not([type=checkbox]), textarea, select')
    const link = target.closest('a, button, summary, label, [role="button"], input[type=checkbox]')
    el.classList.toggle('is-label', Boolean(labelled))
    el.classList.toggle('is-link', !labelled && Boolean(link) && !field)
    el.classList.toggle('is-visible', !field)
    if (labelled) label.textContent = labelled.dataset.cursor
  })

  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-visible'))
  addEventListener('pointerdown', () => el.classList.add('is-down'))
  addEventListener('pointerup', () => el.classList.remove('is-down'))
}

// ── Elementi magnetici ───────────────────────────────────────────────────────

export function initMagnetic() {
  if (!finePointer() || reducedMotion()) return
  $$('[data-magnetic]').forEach((el) => {
    const strength = el.classList.contains('orb') ? 0.32 : 0.22
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      el.style.transition = 'transform 0.15s linear'
      el.style.transform = `translate3d(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px, 0)`
    })
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
      el.style.transform = ''
    })
  })
}

// ── Anteprima flottante al passaggio (indici di progetti) ────────────────────

export function initHoverPreview() {
  const box = $('[data-preview-el]')
  if (!box || !finePointer()) return
  const img = new Image()
  img.alt = ''
  img.decoding = 'async'
  box.append(img)
  let x = 0
  let y = 0
  let cx = 0
  let cy = 0
  let raf
  let active = null

  const loop = () => {
    cx = lerp(cx, x, 0.14)
    cy = lerp(cy, y, 0.14)
    box.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`
    raf = active || Math.abs(cx - x) + Math.abs(cy - y) > 0.2 ? requestAnimationFrame(loop) : null
  }

  const eligible = (el) => !el.matches('.card') || el.closest('[data-view="list"]')

  document.addEventListener('pointerover', (e) => {
    const target = e.target instanceof Element ? e.target.closest('[data-preview]') : null
    if (target === active) return
    active = target && eligible(target) ? target : null
    if (!active) return box.classList.remove('is-visible')
    box.style.setProperty('--ratio', active.dataset.previewRatio || '4/3')
    if (img.getAttribute('src') !== active.dataset.preview) img.src = active.dataset.preview
    box.classList.add('is-visible')
    raf ??= requestAnimationFrame(loop)
  })

  addEventListener(
    'pointermove',
    (e) => {
      if (!active) return
      const w = box.offsetWidth
      const h = box.offsetHeight
      x = clamp(e.clientX + 28, 8, innerWidth - w - 8)
      y = clamp(e.clientY - h / 2, 8, innerHeight - h - 8)
    },
    { passive: true },
  )

  addEventListener('scroll', () => active && (box.classList.remove('is-visible'), (active = null)), { passive: true })
}

// ── Mockup con pagina che scorre al passaggio ────────────────────────────────

export function initScrollPreview() {
  $$('[data-scroll-preview]').forEach((el) => {
    const page = $('.browser__page, .phone__page', el)
    const screen = page?.parentElement
    if (!page || !screen) return

    const start = () => {
      const distance = page.offsetHeight - screen.offsetHeight
      if (distance <= 8) return
      el.style.setProperty('--scroll-to', `${-distance}px`)
      el.style.setProperty('--scroll-time', `${clamp(distance / 260, 2.5, 9).toFixed(1)}s`)
      el.classList.add('is-scrolling')
    }
    const stop = () => el.classList.remove('is-scrolling')

    if (reducedMotion()) return
    el.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && start())
    el.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && stop())
    el.addEventListener('focus', start)
    el.addEventListener('blur', stop)
    // touch: un tocco avvia, il successivo riporta in cima
    el.addEventListener('click', (e) => {
      if (finePointer() || e.target.closest('a')) return
      el.classList.contains('is-scrolling') ? stop() : start()
    })
  })
}
