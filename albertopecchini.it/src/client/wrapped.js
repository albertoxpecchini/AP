// Slide del Wrapped 5BT: lo scorrimento è nativo (scroll-snap nel frame 9:16),
// qui si aggiungono barra di avanzamento, contatore, tastiera, tocco e annunci.
// Senza questo modulo la pagina resta comunque sfogliabile a scorrimento.

import { $, $$, clamp, reducedMotion, finePointer, announce } from './utils.js'

export function initWrapped() {
  const stage = $('[data-wrapped-stage]')
  const scorrimento = $('[data-wrapped-scorrimento]')
  if (!stage || !scorrimento) return

  const slides = $$('[data-wslide]', scorrimento)
  const barra = $('[data-wrapped-barra]', stage)
  const contatore = $('[data-wrapped-contatore]', stage)
  const prima = $('[data-wrapped-prima]', stage)
  const dopo = $('[data-wrapped-dopo]', stage)
  const totale = slides.length
  if (!totale) return

  let corrente = -1

  const indice = () => clamp(Math.round(scorrimento.scrollTop / scorrimento.clientHeight), 0, totale - 1)

  const aggiorna = () => {
    const i = indice()
    if (i === corrente) return
    corrente = i
    slides.forEach((slide, j) => slide.classList.toggle('is-attiva', j === i))
    if (barra) barra.style.setProperty('--avanzamento', String((i + 1) / totale))
    if (contatore) contatore.textContent = `${String(i + 1).padStart(2, '0')}/${String(totale).padStart(2, '0')}`
    announce(`Slide ${i + 1} di ${totale}`)
  }

  const vai = (i) => {
    const dove = clamp(i, 0, totale - 1)
    scorrimento.scrollTo({ top: dove * scorrimento.clientHeight, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  // scroll del frame, non della pagina: listener proprio, coalescato in rAF
  let inCoda = false
  scorrimento.addEventListener(
    'scroll',
    () => {
      if (inCoda) return
      inCoda = true
      requestAnimationFrame(() => {
        inCoda = false
        aggiorna()
      })
    },
    { passive: true },
  )

  scorrimento.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const mosse = {
      ArrowDown: corrente + 1,
      PageDown: corrente + 1,
      ' ': e.shiftKey ? corrente - 1 : corrente + 1,
      ArrowUp: corrente - 1,
      PageUp: corrente - 1,
      Home: 0,
      End: totale - 1,
    }
    if (!(e.key in mosse)) return
    e.preventDefault()
    vai(mosse[e.key])
  })

  prima?.addEventListener('click', () => vai(corrente - 1))
  dopo?.addEventListener('click', () => vai(corrente + 1))

  // sul telefono un tocco secco avanza (metà alta: indietro), come nelle storie;
  // col puntatore fine restano rotella, tasti e frecce
  let tocco = null
  scorrimento.addEventListener('pointerdown', (e) => {
    tocco = { x: e.clientX, y: e.clientY }
  })
  scorrimento.addEventListener('pointerup', (e) => {
    const inizio = tocco
    tocco = null
    if (!inizio || finePointer()) return
    if (Math.hypot(e.clientX - inizio.x, e.clientY - inizio.y) > 8) return
    if (e.target.closest('a, button')) return
    const quota = (e.clientY - stage.getBoundingClientRect().top) / stage.clientHeight
    vai(quota < 0.35 ? corrente - 1 : corrente + 1)
  })

  stage.classList.add('is-pronto')
  aggiorna()
}
