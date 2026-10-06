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
  // destinazione dello scorrimento in corso: due tap o due frecce ravvicinati
  // devono avanzare di due slide, anche se lo scroll morbido non è ancora arrivato
  let puntata = null

  const indice = () => clamp(Math.round(scorrimento.scrollTop / scorrimento.clientHeight), 0, totale - 1)

  const aggiorna = () => {
    const i = indice()
    if (i === puntata) puntata = null
    if (i === corrente) return
    const primaVolta = corrente === -1
    corrente = i
    slides.forEach((slide, j) => slide.classList.toggle('is-attiva', j === i))
    // il pannello «Come si calcola» lasciato aperto non deve aspettarti al ritorno
    $$('.wslide__metodo[open]', scorrimento).forEach((d) => {
      if (!slides[i].contains(d)) d.open = false
    })
    if (barra) barra.style.setProperty('--avanzamento', String((i + 1) / totale))
    if (contatore) contatore.textContent = `${String(i + 1).padStart(2, '0')}/${String(totale).padStart(2, '0')}`
    // la prima sincronizzazione non è un cambio: niente annuncio a chi apre la pagina
    if (!primaVolta) announce(`Slide ${i + 1} di ${totale}`)
  }

  const base = () => puntata ?? corrente

  const vai = (i) => {
    const dove = clamp(i, 0, totale - 1)
    puntata = dove
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
    // il focus può essere sul pannello o sullo scorrimento: si chiude quello aperto
    const aperto = $('.wslide__metodo[open]', scorrimento)
    if (e.key === 'Escape' && aperto) {
      aperto.open = false
      aperto.querySelector('summary')?.focus()
      return
    }
    // spazio e invio su un pulsante o sul «Come si calcola» restano loro
    if (e.key === ' ' && e.target.closest('a, button, summary')) return
    const mosse = {
      ArrowDown: base() + 1,
      PageDown: base() + 1,
      ' ': e.shiftKey ? base() - 1 : base() + 1,
      ArrowUp: base() - 1,
      PageUp: base() - 1,
      Home: 0,
      End: totale - 1,
    }
    if (!(e.key in mosse)) return
    e.preventDefault()
    vai(mosse[e.key])
  })

  // il click lascerebbe il focus sul pulsante e la tastiera perderebbe il deck:
  // si riporta subito sullo scorrimento
  prima?.addEventListener('click', () => {
    scorrimento.focus({ preventScroll: true })
    vai(base() - 1)
  })
  dopo?.addEventListener('click', () => {
    scorrimento.focus({ preventScroll: true })
    vai(base() + 1)
  })

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
    if (e.target.closest('a, button, summary, .wslide__metodo[open]')) return
    const quota = (e.clientY - stage.getBoundingClientRect().top) / stage.clientHeight
    vai(quota < 0.35 ? base() - 1 : base() + 1)
  })

  stage.classList.add('is-pronto')
  aggiorna()
}
