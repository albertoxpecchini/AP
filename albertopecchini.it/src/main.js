// Punto d'ingresso client. Ogni modulo si attiva solo se trova i propri elementi.
// Gli stili sono un'entry separata (src/style.css), collegata con <link> dal layout.

import { initHeader, initClock, initMenu, initProgress, initTransitions, initActions } from './client/chrome.js'
import { initReveal, initCounters, initParallax, initCursor, initMagnetic, initHoverPreview, initScrollPreview } from './client/motion.js'
import { initHero, initCarousel, initMethod, initSpy, initSectionIndicator } from './client/sections.js'
import { initFilters } from './client/filters.js'
import { initLightbox, initCompare, initCopy } from './client/widgets.js'
import { initForm } from './client/form.js'
import { initCanvas } from './client/canvas.js'
import { initViewer } from './client/viewer.js'
import { initDialer } from './client/phone.js'
import { initPebbles } from './client/pebble.js'
import { initMascots } from './client/mascot.js'

// Il compositore email (/email/) porta con sé i moduli del generatore (tools/email-generator):
// si carica in un pezzo a parte, solo sulla sua pagina, così le altre non ne pagano il peso.
function initEmail() {
  if (!document.querySelector('[data-email]')) return
  import('./client/email.js')
    .then((m) => m.initEmail())
    .catch((error) => console.error('[site] initEmail:', error))
}

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
  initCarousel,
  initMethod,
  initSpy,
  initSectionIndicator,
  initLightbox,
  initCompare,
  initCopy,
  initForm,
  initDialer,
  initPebbles,
  initMascots,
  initCanvas,
  initViewer,
  initEmail,
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
