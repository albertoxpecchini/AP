// Comportamenti legati a sezioni specifiche: hero, carosello dei siti,
// timeline del metodo, indice laterale dei case study.

import { $, $$, onScroll, clamp, reducedMotion, announce } from './utils.js'

// ── Hero: il terminale, un comando per mestiere, e l'email da copiare ────────

export function initHero() {
  const stage = $('[data-hero]')
  if (!stage) return
  const hero = stage.closest('.hero')
  const tabs = $$('[data-hero-go]', stage)
  const panels = $$('[data-hero-panel]', stage)
  const stickers = $$('[data-hero-sticker]', stage)
  const count = $('[data-hero-n]', stage)
  const TIME = 6500
  const STEP = 34 // ms per carattere del comando
  let index = 0
  let timer
  let typing
  let left = TIME
  let since = 0
  // i comandi girano da soli finché il visitatore non ne sceglie uno
  let auto = !reducedMotion()
  const holds = new Set()

  hero.style.setProperty('--hero-time', `${TIME}ms`)
  hero.classList.toggle('is-auto', auto)

  // il comando si scrive un carattere alla volta; le righe escono dopo (--t0, in home.css)
  const type = (panel) => {
    const cmd = $('[data-hero-cmd]', panel)
    const text = cmd.dataset.heroCmd
    clearInterval(typing)
    if (reducedMotion()) {
      cmd.textContent = text
      panel.style.setProperty('--t0', '0ms')
      return
    }
    panel.style.setProperty('--t0', `${text.length * STEP + 120}ms`)
    let n = 0
    cmd.textContent = ''
    typing = setInterval(() => {
      cmd.textContent = text.slice(0, ++n)
      if (n >= text.length) clearInterval(typing)
    }, STEP)
  }

  const go = (next) => {
    index = (next + panels.length) % panels.length
    panels.forEach((p, i) => p.classList.toggle('is-active', i === index))
    tabs.forEach((t, i) => {
      t.classList.remove('is-active')
      if (i === index) {
        void t.offsetWidth // riavvia la barra del tempo
        t.classList.add('is-active')
      }
      t.setAttribute('aria-pressed', String(i === index))
    })
    stickers.forEach((s, i) => s.classList.toggle('is-active', i === index))
    if (count) count.textContent = String(index + 1).padStart(2, '0')
    type(panels[index])
  }

  // il tempo che resta al comando in corso si ferma e riparte insieme alla sua barra
  const run = () => {
    clearTimeout(timer)
    if (!auto || holds.size) return
    since = performance.now()
    timer = setTimeout(() => {
      left = TIME
      go(index + 1)
      run()
    }, left)
  }
  const hold = (why, on) => {
    if (on === holds.has(why)) return
    if (on && !holds.size && since) left = Math.max(600, left - (performance.now() - since))
    on ? holds.add(why) : holds.delete(why)
    hero.classList.toggle('is-paused', holds.size > 0)
    run()
  }

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      auto = false
      hero.classList.remove('is-auto')
      clearTimeout(timer)
      go(Number(t.dataset.heroGo))
    }),
  )
  stage.addEventListener('pointerenter', () => hold('pointer', true))
  stage.addEventListener('pointerleave', () => hold('pointer', false))
  stage.addEventListener('focusin', () => hold('focus', true))
  stage.addEventListener('focusout', () => hold('focus', false))
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden))
  // fuori dallo schermo non gira
  new IntersectionObserver(([entry]) => hold('away', !entry.isIntersecting), { threshold: 0.2 }).observe(stage)
  run()

  // «Premi C per copiare la mia email»: il tasto, e la lettera finché l'hero è in vista
  const copy = $('[data-hero-copy]', hero)
  if (!copy) return
  const email = copy.dataset.heroCopy
  let inView = true
  let back
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // appunti negati: si apre il programma di posta, che l'indirizzo lo porta con sé
      location.href = `mailto:${email}`
      return
    }
    copy.classList.remove('is-done')
    void copy.offsetWidth // la cassetta delle lettere risalta a ogni copia
    copy.classList.add('is-done')
    announce(`Indirizzo ${email} copiato negli appunti`)
    clearTimeout(back)
    back = setTimeout(() => copy.classList.remove('is-done'), 2600)
  }
  copy.addEventListener('click', copyEmail)
  new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(hero)
  addEventListener('keydown', (e) => {
    if (e.key?.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
    if (!inView || document.body.classList.contains('is-locked')) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
    copyEmail()
  })
}

// ── Carosello dei siti ───────────────────────────────────────────────────────
// Lo scorrimento è quello nativo (scroll-snap): su desktop la griglia sta ferma
// e il viewport non scorre, quindi contatore, barra e frecce restano nascosti.

export function initCarousel() {
  const section = $('[data-carousel]')
  if (!section) return
  const viewport = $('[data-carousel-viewport]', section)
  const items = $$('[data-carousel-item]', viewport)
  const sites = items.filter((el) => !el.classList.contains('wcard--end')).length
  const bar = $('[data-carousel-bar]', section)
  const current = $('[data-carousel-current]', section)
  const prev = $('[data-carousel-prev]', section)
  const next = $('[data-carousel-next]', section)

  const start = () => viewport.getBoundingClientRect().left + (parseFloat(getComputedStyle(viewport).scrollPaddingLeft) || 0)

  // la card più vicina al bordo d'aggancio
  const active = () => {
    const left = start()
    let best = 0
    let dist = Infinity
    items.forEach((el, i) => {
      const d = Math.abs(el.getBoundingClientRect().left - left)
      if (d < dist) {
        dist = d
        best = i
      }
    })
    return best
  }

  let frame = 0
  const paint = () => {
    frame = 0
    const max = viewport.scrollWidth - viewport.clientWidth
    const scrollable = max > 4
    section.classList.toggle('is-scrollable', scrollable)
    viewport.tabIndex = scrollable ? 0 : -1
    const x = viewport.scrollLeft
    const progress = scrollable ? clamp(x / max, 0, 1) : 1
    if (bar) bar.style.transform = `scaleX(${(1 / Math.max(1, items.length) + progress * (1 - 1 / Math.max(1, items.length))).toFixed(4)})`
    const index = scrollable ? (x >= max - 4 ? items.length - 1 : active()) : 0
    if (current) current.textContent = String(Math.min(sites, index + 1)).padStart(2, '0')
    if (prev) prev.disabled = !scrollable || x <= 4
    if (next) next.disabled = !scrollable || x >= max - 4
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(paint)
  }

  const go = (step) => {
    const target = items[clamp(active() + step, 0, items.length - 1)]
    const left = viewport.scrollLeft + target.getBoundingClientRect().left - start()
    viewport.scrollTo({ left, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  prev?.addEventListener('click', () => go(-1))
  next?.addEventListener('click', () => go(1))
  viewport.addEventListener('keydown', (e) => {
    if (!section.classList.contains('is-scrollable')) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  })
  viewport.addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  addEventListener('load', schedule)
  paint()
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