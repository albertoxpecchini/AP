// "Chrome" del sito: header, sottomenu, menu mobile, avanzamento,
// transizioni di pagina, torna su.

import { $, $$, onScroll, lockPage, trapFocus, reducedMotion } from './utils.js'

const root = document.documentElement

// ── Header: fondo pieno dopo lo scroll, si nasconde scendendo ────────────────

export function initHeader() {
  const header = $('[data-header]')
  if (!header) return
  let last = window.scrollY
  root.classList.add('header-visible')

  onScroll((y) => {
    header.classList.toggle('is-solid', y > 24)
    if (Math.abs(y - last) < 6) return
    const hide = y > last && y > 200 && !header.contains(document.activeElement)
    header.classList.toggle('is-hidden', hide)
    root.classList.toggle('header-visible', !hide)
    last = y
  })

  header.addEventListener('focusin', () => {
    header.classList.remove('is-hidden')
    root.classList.add('header-visible')
  })

  // sottomenu: hover/focus via CSS, bottone per tastiera e touch
  $$('[data-subnav]', header).forEach((item) => {
    const toggle = $('.site-nav__toggle', item)
    const panel = $('.subnav', item)
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open))
      panel.classList.toggle('is-open', open)
    }
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'))
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        set(false)
        toggle.focus()
      }
    })
    // quando il fuoco esce dalla voce, il sottomenu si richiude
    item.addEventListener('focusout', (e) => !item.contains(e.relatedTarget) && set(false))
    document.addEventListener('click', (e) => !item.contains(e.target) && set(false))
  })
}

// ── Menu mobile a tutto schermo ──────────────────────────────────────────────

export function initMenu() {
  const menu = $('#menu')
  const openBtn = $('[data-menu-open]')
  if (!menu || !openBtn) return
  let unlock
  let release
  let closeTimer

  const open = () => {
    clearTimeout(closeTimer)
    menu.hidden = false
    // forza un reflow: la transizione parte dallo stato chiuso
    void menu.offsetHeight
    menu.classList.add('is-open')
    openBtn.setAttribute('aria-expanded', 'true')
    unlock = lockPage(menu)
    release = trapFocus(menu)
    $('[data-menu-close]', menu).focus({ preventScroll: true })
  }

  const close = ({ focus = true } = {}) => {
    if (menu.hidden) return
    menu.classList.remove('is-open')
    openBtn.setAttribute('aria-expanded', 'false')
    unlock?.()
    release?.()
    closeTimer = setTimeout(() => (menu.hidden = true), reducedMotion() ? 0 : 500)
    if (focus) openBtn.focus({ preventScroll: true })
  }

  openBtn.addEventListener('click', open)
  $('[data-menu-close]', menu).addEventListener('click', () => close())
  menu.addEventListener('keydown', (e) => e.key === 'Escape' && close())
  // se la finestra passa al layout desktop il menu si chiude
  matchMedia('(min-width: 1100px)').addEventListener('change', (e) => e.matches && close({ focus: false }))
}

// ── Barra di avanzamento della lettura ───────────────────────────────────────

export function initProgress() {
  const bar = $('[data-progress]')
  if (!bar) return
  onScroll((y, vh) => {
    const max = document.documentElement.scrollHeight - vh
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
  })
}

// ── Transizioni di pagina (tendina) ──────────────────────────────────────────

export function initTransitions() {
  const label = $('[data-curtain-label]')

  // ingresso: la pagina nasce coperta (classe messa dallo script in <head>)
  if (root.classList.contains('is-entering')) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-entered')))
    setTimeout(() => root.classList.remove('is-entering', 'is-entered'), 640)
  }

  // ritorno dalla cache del browser: nessuna tendina rimasta a metà
  addEventListener('pageshow', (e) => {
    if (e.persisted) root.classList.remove('is-leaving', 'is-entering', 'is-entered')
  })

  if (reducedMotion()) return

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]')
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return
    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin) return
    if (url.pathname === location.pathname && url.search === location.search) return
    if (/\.(pdf|zip|jpe?g|png|webp|svg|xml|txt)$/i.test(url.pathname)) return

    e.preventDefault()
    if (label) {
      const text = (link.dataset.transitionLabel || link.getAttribute('aria-label') || link.textContent || '').replace(/\s+/g, ' ').trim()
      label.textContent = text.length > 2 && text.length < 42 ? text : label.textContent
    }
    try {
      sessionStorage.setItem('ap:nav', '1')
    } catch {}
    root.classList.add('is-leaving')
    setTimeout(() => (location.href = url.href), 360)
  })
}

// ── Piccole azioni globali ───────────────────────────────────────────────────

export function initActions() {
  $$('[data-top]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
      $('#main')?.focus({ preventScroll: true })
    }),
  )
  $$('[data-print]').forEach((el) => el.addEventListener('click', () => window.print()))

  // le regioni a scorrimento orizzontale entrano nell'ordine di tabulazione solo se scorrono
  const regions = $$('[data-scroll-region]')
  const sync = () => regions.forEach((el) => (el.scrollWidth > el.clientWidth + 1 ? el.setAttribute('tabindex', '0') : el.removeAttribute('tabindex')))
  if (regions.length) {
    sync()
    addEventListener('resize', sync)
  }
}
