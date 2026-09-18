// Comportamenti legati a sezioni specifiche: hero, scorrimento orizzontale,
// timeline del metodo, indice laterale dei case study.

import { $, $$, onScroll, clamp, reducedMotion } from './utils.js'

// ── Hero: tre figure sincronizzate con l'elenco dei ruoli ────────────────────

export function initHero() {
  const visual = $('[data-hero]')
  if (!visual) return
  const hero = visual.closest('.hero')
  const slides = $$('[data-hero-slide]', visual)
  const ticks = $$('.hero__ticks i', visual)
  const roles = $$('[data-hero-go]')
  const caption = $('[data-hero-caption]', visual)
  const captions = JSON.parse($('[data-hero-captions]', visual)?.content.textContent || '[]')
  const TIME = 5200
  let index = 0
  let timer
  let paused = false

  hero.style.setProperty('--hero-time', `${TIME}ms`)

  const go = (next) => {
    index = (next + slides.length) % slides.length
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === index)
      s.toggleAttribute('aria-hidden', i !== index)
    })
    ticks.forEach((t, i) => {
      t.classList.remove('is-active')
      if (i === index) {
        void t.offsetWidth // riavvia l'animazione della tacca
        t.classList.add('is-active')
      }
    })
    roles.forEach((r, i) => {
      r.classList.toggle('is-active', i === index)
      r.setAttribute('aria-pressed', String(i === index))
    })
    if (caption && captions[index]) caption.textContent = captions[index]
  }

  const schedule = () => {
    clearTimeout(timer)
    if (paused || reducedMotion() || document.hidden) return
    timer = setTimeout(() => {
      go(index + 1)
      schedule()
    }, TIME)
  }

  const setPaused = (value) => {
    paused = value
    hero.classList.toggle('is-paused', value)
    schedule()
  }

  roles.forEach((r) =>
    r.addEventListener('click', () => {
      go(Number(r.dataset.heroGo))
      schedule()
    }),
  )
  visual.addEventListener('pointerenter', () => setPaused(true))
  visual.addEventListener('pointerleave', () => setPaused(false))
  document.addEventListener('visibilitychange', schedule)
  // fuori dallo schermo non gira
  new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { threshold: 0.2 }).observe(visual)

  if (reducedMotion()) ticks.forEach((t) => t.classList.remove('is-active'))
  schedule()
}

// ── Scorrimento orizzontale dei progetti selezionati ─────────────────────────

export function initHScroll() {
  const section = $('[data-hscroll]')
  if (!section) return
  const viewport = $('[data-hscroll-viewport]', section)
  const track = $('[data-hscroll-track]', section)
  const bar = $('[data-hscroll-bar]', section)
  const current = $('[data-hscroll-current]', section)
  const cards = $$('.fcard:not(.fcard--end)', track)
  const media = matchMedia('(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)')
  let distance = 0
  let top = 0

  const paint = (progress) => {
    if (bar) bar.style.transform = `scaleX(${clamp(0.06 + progress * 0.94, 0, 1)})`
    if (current) current.textContent = String(Math.min(cards.length, Math.floor(progress * cards.length * 0.999) + 1)).padStart(2, '0')
  }

  const measure = () => {
    const pinned = media.matches
    section.classList.toggle('is-pinned', pinned)
    if (!pinned) {
      section.style.removeProperty('--hscroll-h')
      track.style.transform = ''
      return
    }
    distance = Math.max(0, track.scrollWidth - window.innerWidth)
    section.style.setProperty('--hscroll-h', `${distance + window.innerHeight}px`)
    top = section.getBoundingClientRect().top + window.scrollY
  }

  measure()
  addEventListener('resize', measure)
  addEventListener('load', measure)
  document.fonts?.ready.then(measure)

  onScroll((y) => {
    if (!section.classList.contains('is-pinned')) return
    const progress = distance ? clamp((y - top) / distance, 0, 1) : 0
    track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`
    paint(progress)
  })

  // senza pin: avanzamento dallo scroll nativo
  viewport.addEventListener(
    'scroll',
    () => {
      if (section.classList.contains('is-pinned')) return
      const max = viewport.scrollWidth - viewport.clientWidth
      paint(max ? viewport.scrollLeft / max : 0)
    },
    { passive: true },
  )

  // tastiera: quando una card riceve il fuoco la porta in vista
  track.addEventListener('focusin', (e) => {
    const card = e.target.closest('.fcard')
    if (!card || !section.classList.contains('is-pinned') || !distance) return
    const target = clamp(card.offsetLeft - (window.innerWidth - card.offsetWidth) / 2, 0, distance)
    window.scrollTo({ top: top + target, behavior: 'auto' })
  })

  // frecce della tastiera sullo scorrimento nativo
  viewport.addEventListener('keydown', (e) => {
    if (section.classList.contains('is-pinned') || e.target !== viewport) return
    if (e.key === 'ArrowRight') viewport.scrollBy({ left: viewport.clientWidth * 0.8, behavior: 'smooth' })
    if (e.key === 'ArrowLeft') viewport.scrollBy({ left: -viewport.clientWidth * 0.8, behavior: 'smooth' })
  })

  paint(0)
}

// ── Metodo: cerchio graduato e timeline ──────────────────────────────────────

export function initMethod() {
  const wrap = $('[data-method]')
  if (!wrap) return
  const steps = $$('[data-method-step]', wrap)
  const axis = $('[data-method-axis]', wrap)
  const list = $('.mtd__steps', wrap)
  const dial = $('[data-dial]', wrap)
  const nodes = $$('[data-dial-node]', wrap)
  const out = { n: $('[data-dial-n]', wrap), title: $('[data-dial-title]', wrap), gon: $('[data-dial-gon]', wrap) }
  let active = -1

  onScroll((_, vh) => {
    const line = vh * 0.55
    let index = 0
    steps.forEach((s, i) => {
      if (s.getBoundingClientRect().top < line) index = i
    })
    const rect = list.getBoundingClientRect()
    if (axis) axis.style.transform = `scaleY(${clamp((line - rect.top) / rect.height, 0, 1).toFixed(4)})`
    if (index === active) return
    active = index
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === index)
      s.classList.toggle('is-done', i < index)
    })
    nodes.forEach((nd, i) => {
      nd.classList.toggle('is-active', i === index)
      nd.classList.toggle('is-done', i < index)
    })
    const step = steps[index]
    const gon = Number(step.dataset.gon)
    dial?.style.setProperty('--angle', `${gon * 0.9}deg`)
    if (out.n) out.n.textContent = String(index + 1).padStart(2, '0')
    if (out.title) out.title.textContent = step.dataset.title
    if (out.gon) out.gon.textContent = gon.toFixed(3).replace('.', ',')
  })
}

// ── Home: indicatore della sezione corrente ──────────────────────────────────

export function initSectionIndicator() {
  const box = $('[data-secind]')
  const sections = $$('[data-section]')
  if (!box || !sections.length) return
  const n = $('[data-secind-n]', box)
  const name = $('[data-secind-name]', box)
  const bar = $('[data-secind-bar]', box)
  $('[data-secind-total]', box).textContent = String(sections.length).padStart(2, '0')
  let active = -1

  onScroll((y, vh) => {
    let index = 0
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top < vh * 0.5) index = i
    })
    const current = sections[index].getBoundingClientRect()
    const last = sections.at(-1).getBoundingClientRect()
    bar.style.transform = `scaleX(${clamp((vh * 0.5 - current.top) / current.height, 0, 1).toFixed(3)})`
    box.classList.toggle('is-visible', y > vh * 0.6 && last.bottom > vh * 0.5)
    if (index === active) return
    active = index
    n.textContent = String(index + 1).padStart(2, '0')
    name.textContent = sections[index].dataset.section
  })
}

// ── Case study: indice laterale con sezione corrente ─────────────────────────

export function initSpy() {
  const nav = $('[data-spy-nav]')
  const sections = $$('[data-spy]')
  if (!nav || !sections.length) return
  const links = $$('a', nav)
  let active = -1

  onScroll((_, vh) => {
    let index = -1
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top < vh * 0.42) index = i
    })
    const end = sections.at(-1).getBoundingClientRect().bottom
    nav.classList.toggle('is-visible', index >= 0 && end > vh * 0.5)
    if (index === active) return
    active = index
    links.forEach((l, i) => {
      l.classList.toggle('is-active', i === index)
      i === index ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')
    })
  })
}