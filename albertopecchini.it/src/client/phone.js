// Il tastierino dell'iPhone nella pagina Contatti: quando il telefono entra per
// metà nello schermo il numero si ricompone cifra per cifra, e ogni tasto si
// scurisce come sotto il dito. Uscito del tutto dallo schermo si azzera, così
// al ritorno ricomincia. Senza JavaScript o con il movimento ridotto il numero
// resta intero, come nell'HTML.

import { $, $$, reducedMotion } from './utils.js'

// 351 035 5506, come lo raggruppa il tastierino mentre si digita
const group = (d) => {
  if (!/^\d+$/.test(d) || d.length <= 3 || d.length > 10) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export function initDialer() {
  const dial = $('[data-dialer]')
  if (!dial || reducedMotion() || !('IntersectionObserver' in window)) return

  const { number, name } = dial.dataset
  const display = $('[data-dial-display]', dial)
  const label = $('[data-dial-name]', dial)
  const keys = new Map($$('[data-key]', dial).map((key) => [key.dataset.key, key]))
  let timers = []
  let armed = true

  const later = (fn, ms) => timers.push(setTimeout(fn, ms))
  const stop = () => {
    timers.forEach(clearTimeout)
    timers = []
    keys.forEach((key) => key.classList.remove('is-down'))
  }

  // come l'app: finché il numero non è intero sotto compare «Add Number»
  const show = (digits) => {
    display.textContent = group(digits)
    label.textContent = !digits ? '' : digits === number ? name : 'Add Number'
    dial.classList.toggle('is-empty', !digits)
    dial.classList.toggle('is-dialed', digits === number)
  }

  const press = (digit) => {
    const key = keys.get(digit)
    if (!key) return
    key.classList.add('is-down')
    later(() => key.classList.remove('is-down'), 140)
  }

  const dialNumber = () => {
    stop()
    show('')
    ;[...number].forEach((digit, i) => {
      later(() => {
        press(digit)
        show(number.slice(0, i + 1))
      }, 450 + i * 190)
    })
  }

  show('')
  new IntersectionObserver(
    ([entry]) => {
      if (entry.intersectionRatio >= 0.5 && armed) {
        armed = false
        dialNumber()
      } else if (!entry.isIntersecting) {
        armed = true
        stop()
        show('')
      }
    },
    { threshold: [0, 0.5] },
  ).observe(dial)
}
