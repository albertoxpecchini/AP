// Le Live Photo ([data-live]): la foto ferma e, sotto, i tre secondi di video intorno allo scatto. Il video parte
// al passaggio del mouse, tenendo premuto col dito o col tasto LIVE, e una volta da solo la prima volta che la
// foto si vede bene (non con il movimento ridotto); finito, torna la foto. Lo stesso comportamento della pagina
// pzkko.it/storia/.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function initLive() {
  const lives = [...document.querySelectorAll('[data-live]')]
  if (!lives.length) return

  const stop = (fig) => {
    fig.classList.remove('is-playing')
    fig.querySelector('video').pause()
  }
  const play = (fig) => {
    const video = fig.querySelector('video')
    video.preload = 'auto'
    video.currentTime = 0
    video
      .play()
      .then(() => fig.classList.add('is-playing'))
      .catch(() => {})
  }

  for (const fig of lives) {
    const video = fig.querySelector('video')
    const frame = fig.querySelector('.live__frame')
    const badge = fig.querySelector('.live__badge')
    let hold = 0
    video.addEventListener('ended', () => fig.classList.remove('is-playing'))
    frame.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && play(fig))
    frame.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && stop(fig))
    frame.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || e.target.closest('.live__badge')) return
      hold = setTimeout(() => play(fig), 160)
    })
    for (const type of ['pointerup', 'pointercancel']) {
      frame.addEventListener(type, (e) => {
        if (e.pointerType === 'mouse') return
        clearTimeout(hold)
        if (fig.classList.contains('is-playing') && !e.target.closest('.live__badge')) stop(fig)
      })
    }
    frame.addEventListener('contextmenu', (e) => e.preventDefault())
    badge.addEventListener('click', () => (fig.classList.contains('is-playing') ? stop(fig) : play(fig)))
  }

  // il primo giro da solo, come quando sull'iPhone si arriva a una Live Photo
  if (!('IntersectionObserver' in window)) return
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        io.unobserve(entry.target)
        if (!reduced()) play(entry.target)
      }
    },
    { threshold: 0.6 },
  )
  lives.forEach((fig) => io.observe(fig))
}
