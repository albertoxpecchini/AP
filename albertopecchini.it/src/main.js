// Punto d'ingresso client. Ogni modulo si attiva solo se trova i propri elementi.
// Gli stili sono un'entry separata (src/style.css), collegata con <link> dal layout.

import { initHeader, initMenu, initProgress, initTransitions, initActions } from './client/chrome.js'
import { initReveal, initCounters, initParallax, initCursor, initMagnetic, initHoverPreview, initScrollPreview } from './client/motion.js'
import { initHero, initCarousel, initMethod, initSpy, initSectionIndicator } from './client/sections.js'
import { initFilters } from './client/filters.js'
import { initLightbox, initCompare, initCopy } from './client/widgets.js'
import { initForm } from './client/form.js'
import { initDialer } from './client/phone.js'
import { initPebbles } from './client/pebble.js'
import { initMascots } from './client/mascot.js'

// I moduli delle pagine speciali si caricano in pezzi a parte, solo dove servono,
// così le altre pagine non ne pagano il peso: il piano di /stile/, il visualizzatore
// delle tavole (con il lettore DWG) e il compositore email (/email/, che porta con sé
// i moduli del generatore in tools/email-generator).
const onDemand = (selector, name, load) =>
  Object.defineProperty(
    () => {
      if (!document.querySelector(selector)) return
      load()
        .then((m) => m[name]())
        .catch((error) => console.error(`[site] ${name}:`, error))
    },
    'name',
    { value: name },
  )

const initCanvas = onDemand('[data-canvas]', 'initCanvas', () => import('./client/canvas.js'))
const initViewer = onDemand('[data-viewer]', 'initViewer', () => import('./client/viewer.js'))
const initEmail = onDemand('[data-email]', 'initEmail', () => import('./client/email.js'))

const modules = [
  initTransitions,
  initHeader,
  initMenu,
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
