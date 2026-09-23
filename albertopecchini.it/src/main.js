// Punto d'ingresso client. Ogni modulo si attiva solo se trova i propri elementi.
// Gli stili sono un'entry separata (src/style.css), collegata con <link> dal layout.

import { initHeader, initClock, initMenu, initProgress, initTransitions, initActions } from './client/chrome.js'
import { initReveal, initCounters, initParallax, initCursor, initMagnetic, initHoverPreview, initScrollPreview } from './client/motion.js'
import { initHero, initHScroll, initMethod, initSpy, initSectionIndicator } from './client/sections.js'
import { initFilters } from './client/filters.js'
import { initLightbox, initCompare, initCopy } from './client/widgets.js'
import { initForm } from './client/form.js'
import { initCanvas } from './client/canvas.js'

const modules = [
  initTransitions,
  initHeader,
  initMenu,
  initClock,
  initProgress,
  initActions,
  initFilters,
  initReveal,
  initCounters,
  initHero,
  initHScroll,
  initMethod,
  initSpy,
  initSectionIndicator,
  initLightbox,
  initCompare,
  initCopy,
  initForm,
  initCanvas,
  initParallax,
  initMagnetic,
  initCursor,
  initHoverPreview,
  initScrollPreview,
]

for (const init of modules) {
  try {
    init()
  } catch (error) {
    // un modulo che fallisce non deve fermare gli altri
    console.error(`[site] ${init.name}:`, error)
  }
}

document.documentElement.classList.add('is-ready')
