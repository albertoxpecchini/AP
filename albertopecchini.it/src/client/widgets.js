// Widget: lightbox con schermo intero, confronto prima/dopo, copia negli appunti.

import { $, $$, lockPage, trapFocus, announce } from './utils.js'

// ── Lightbox ─────────────────────────────────────────────────────────────────

export function initLightbox() {
  const box = $('[data-lightbox-el]')
  const triggers = $$('[data-lightbox]')
  if (!box || !triggers.length) return

  const stage = $('[data-lb-stage]', box)
  const caption = $('[data-lb-caption]', box)
  const currentEl = $('[data-lb-current]', box)
  const totalEl = $('[data-lb-total]', box)
  const fullBtn = $('[data-lb-full]', box)
  let group = []
  let index = 0
  let opener = null
  let unlock
  let release

  /** Copia del contenuto del riquadro: <img> nuovo per i file, clone per le tavole SVG. */
  const contentOf = (trigger) => {
    const source = $('.pic, .art', trigger.closest('.media__frame') || trigger)
    if (!source) return null
    if (source.tagName === 'IMG') {
      const img = new Image()
      img.src = source.currentSrc || source.src
      img.alt = source.alt
      img.className = 'pic'
      return img
    }
    const clone = source.cloneNode(true)
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    return clone
  }

  const show = (next, direction = 0) => {
    index = (next + group.length) % group.length
    const trigger = group[index]
    const item = document.createElement('div')
    item.className = 'lightbox__item'
    item.style.transform = direction ? `translateX(${direction * 4}%)` : ''
    const content = contentOf(trigger)
    if (content) item.append(content)
    stage.replaceChildren(item)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        item.style.transform = ''
        item.classList.add('is-in')
      }),
    )
    caption.textContent = trigger.dataset.caption || ''
    currentEl.textContent = String(index + 1).padStart(2, '0')
    totalEl.textContent = String(group.length).padStart(2, '0')
    box.classList.toggle('is-single', group.length < 2)
  }

  const open = (trigger) => {
    opener = trigger
    group = triggers.filter((t) => t.dataset.lightbox === trigger.dataset.lightbox)
    box.hidden = false
    void box.offsetHeight
    box.classList.add('is-open')
    unlock = lockPage(box)
    release = trapFocus(box)
    show(group.indexOf(trigger))
    $('[data-lb-close]', box).focus({ preventScroll: true })
  }

  const close = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    box.classList.remove('is-open')
    unlock?.()
    release?.()
    setTimeout(() => {
      box.hidden = true
      stage.replaceChildren()
    }, 300)
    opener?.focus({ preventScroll: true })
  }

  triggers.forEach((t) => t.addEventListener('click', () => open(t)))
  $('[data-lb-close]', box).addEventListener('click', close)
  $('[data-lb-prev]', box).addEventListener('click', () => show(index - 1, -1))
  $('[data-lb-next]', box).addEventListener('click', () => show(index + 1, 1))
  // clic sullo sfondo (non sull'immagine) chiude
  stage.addEventListener('click', (e) => (e.target === stage || e.target.classList.contains('lightbox__item')) && close())

  if (!document.fullscreenEnabled) fullBtn.hidden = true
  fullBtn.addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen?.()))
  document.addEventListener('fullscreenchange', () => {
    const on = document.fullscreenElement === box
    fullBtn.setAttribute('aria-pressed', String(on))
    fullBtn.setAttribute('aria-label', on ? 'Esci dallo schermo intero' : 'Schermo intero')
  })

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.fullscreenElement) close()
    else if (e.key === 'ArrowLeft') show(index - 1, -1)
    else if (e.key === 'ArrowRight') show(index + 1, 1)
    else if (e.key === 'Home') show(0)
    else if (e.key === 'End') show(group.length - 1)
    else if (e.key.toLowerCase() === 'f' && document.fullscreenEnabled) fullBtn.click()
  })

  // swipe orizzontale su touch
  let startX = null
  stage.addEventListener('pointerdown', (e) => (startX = e.clientX))
  stage.addEventListener('pointerup', (e) => {
    if (startX === null) return
    const dx = e.clientX - startX
    startX = null
    if (Math.abs(dx) > 48 && group.length > 1) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
  })
}

// ── Confronto prima / dopo ───────────────────────────────────────────────────

export function initCompare() {
  $$('[data-compare]').forEach((el) => {
    const range = $('input[type="range"]', el)
    if (!range) return
    const update = () => el.style.setProperty('--pos', `${range.value}%`)
    range.addEventListener('input', update)
    update()
  })
}

// ── Copia negli appunti (campioni colore) ────────────────────────────────────

export function initCopy() {
  $$('[data-copy]').forEach((btn) => {
    const original = btn.dataset.tooltip
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy
      try {
        await navigator.clipboard.writeText(value)
        btn.dataset.tooltip = 'Copiato'
        announce(`Colore ${value} copiato negli appunti`)
      } catch {
        btn.dataset.tooltip = value
      }
      setTimeout(() => (btn.dataset.tooltip = original), 1600)
    })
  })
}
