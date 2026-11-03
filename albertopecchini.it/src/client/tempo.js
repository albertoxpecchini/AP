// La macchina del tempo (/tempo/): le pagine sono statiche e ogni cattura ha il suo
// indirizzo (/tempo/<dominio>/<AAAA-MM-GG>/), quindi qui resta poco: il selettore dei siti,
// i tasti ← → per la cattura prima e dopo, l'anteprima sopra le barre dell'istogramma (la
// foto piccola si scarica solo passandoci sopra), il riquadro dei «momenti», e i vecchi
// indirizzi (#v=<sha>, #s=<sito>&v=<sha>, fino al 3.11.2026 sera) che portano alla pagina giusta.

import { $, clamp } from './utils.js'

export function initTempo() {
  const root = $('[data-tempo]')
  if (!root) return

  const vecchi = $('[data-tm-vecchi]', root)
  if (vecchi && /[#&](v|s)=/.test(location.hash)) {
    const h = new URLSearchParams(location.hash.slice(1))
    const dove = JSON.parse(vecchi.textContent)[h.get('s') || 'ap']?.[(h.get('v') || '').slice(0, 7)]
    if (dove) return location.replace(dove)
  }

  // l'altezza della barra (più la riga sopra l'istantanea), perché l'iframe riempia il resto della finestra
  const barra = $('.wb__bar', root)
  const riga = $('.wb__page--html .wb__live', root)
  if (barra && riga && 'ResizeObserver' in window) {
    const misura = () => root.style.setProperty('--wb-h', `${barra.offsetHeight + riga.offsetHeight}px`)
    new ResizeObserver(misura).observe(barra)
    misura()
  }

  const sito = $('[data-tm-sito]', root)
  sito?.addEventListener('change', () => sito.value && (location.href = sito.value))

  const prev = $('[data-tm-prev]', root)
  const next = $('[data-tm-next]', root)
  const more = $('[data-tm-more]', root)
  const drawer = $('[data-tm-drawer]', root)
  more?.addEventListener('click', () => {
    const apre = drawer.hidden
    drawer.hidden = !apre
    more.setAttribute('aria-expanded', String(apre))
  })
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
    const a = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : null
    if (a && a.getAttribute('aria-disabled') !== 'true') location.href = a.href
    else if (e.key === 'Escape' && drawer && !drawer.hidden) more.click()
    else return
    e.preventDefault()
  })

  // l'anteprima sopra la barra, come il calendario della Wayback Machine
  const spark = $('[data-tm-spark]', root)
  const tip = $('[data-tm-tip]', root)
  if (!spark || !tip) return
  const img = $('[data-tm-tip-img]', tip)
  const mostra = (c) => {
    img.hidden = !c.dataset.t
    if (c.dataset.t) img.src = c.dataset.t
    $('[data-tm-tip-date]', tip).textContent = c.dataset.d || ''
    $('[data-tm-tip-n]', tip).textContent = (c.dataset.n || '') + (c.dataset.t ? '' : ' · senza foto')
    tip.hidden = false
    const box = spark.getBoundingClientRect()
    const r = c.getBoundingClientRect()
    tip.style.left = `${clamp(r.left + r.width / 2 - box.left - tip.offsetWidth / 2, -4, box.width - tip.offsetWidth + 4)}px`
  }
  const nascondi = () => (tip.hidden = true)
  spark.addEventListener('pointerover', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c && e.pointerType === 'mouse') mostra(c)
  })
  spark.addEventListener('pointerleave', nascondi)
  spark.addEventListener('focusin', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c) mostra(c)
  })
  spark.addEventListener('focusout', nascondi)
}
