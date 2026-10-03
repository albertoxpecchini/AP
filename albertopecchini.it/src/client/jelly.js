// Icone «gelatina» di /studio/ (con cosa gira questo sito). Ogni piastrella sta
// su sei molle poco smorzate — spostamento x e y, rotazione, piega (skewX),
// schiacciamento e gonfiore — così oscilla un po' prima di fermarsi, come una
// caramella gommosa. Al passaggio del mouse si gonfia e si piega verso il
// puntatore; premuta si schiaccia, trascinata si allunga dietro al dito e al
// rilascio rimbalza; il colpo passa alle vicine. Il marchio dentro ritarda un
// poco sulla piastrella. Al tocco compare anche il nome (il fumetto che col
// mouse esce al passaggio). Con «riduci movimento» le piastrelle restano ferme.

import { $$, clamp, reducedMotion } from './utils.js'

const K = 300 // rigidità della molla (1/s²)
const C = 10 // smorzamento (1/s): più basso, più gelatina
const KEYS = ['x', 'y', 'r', 'k', 'q', 'u'] // px, px, gradi, gradi, schiacciamento, scala
const REST = { x: 0, y: 0, r: 0, k: 0, q: 0, u: 1 }
const EPS = { x: 0.05, y: 0.05, r: 0.02, k: 0.02, q: 0.0005, u: 0.0005 }
const TIP_MS = 2600 // quanto resta il nome dopo un tocco

export function initJelly() {
  for (const row of $$('[data-jelly]')) setup(row)
}

function setup(row) {
  const tiles = $$('.stack__item', row).map((li, i) => {
    const el = li.querySelector('.jelly')
    const cs = getComputedStyle(el)
    return {
      i,
      li,
      el,
      glyph: el.querySelector('.jelly__glyph'),
      tip: li.querySelector('.jelly__tip'),
      rot: parseFloat(cs.getPropertyValue('--rot')) || 0,
      dy: parseFloat(cs.getPropertyValue('--dy')) || 0,
      s: { ...REST },
      v: { x: 0, y: 0, r: 0, k: 0, q: 0, u: 0 },
      t: { ...REST },
      hover: false,
      press: null,
      moving: false,
    }
  })
  if (!tiles.length) return

  // ── righe pari: quando la fila va a capo, tante piastrelle per riga quante
  // ne servono per non lasciarne una da sola in fondo (8 + 8 + 3 → 7 + 7 + 5)
  const balance = () => {
    row.style.maxWidth = ''
    const li = tiles[0].li
    const step = li.getBoundingClientRect().width + 2 * parseFloat(getComputedStyle(li).marginLeft)
    const fit = Math.max(1, Math.floor((row.clientWidth + 1) / step))
    if (fit >= tiles.length) return
    const even = Math.ceil(tiles.length / Math.ceil(tiles.length / fit))
    row.style.maxWidth = `${Math.ceil(even * step) + 2}px`
  }
  balance()
  new ResizeObserver(balance).observe(row.parentElement)

  // ── il nome: tenuto dentro lo schermo, e mostrato anche al tocco ──────────
  // misure senza transform: il fumetto è centrato sulla piastrella e, mentre
  // compare, è ancora rimpicciolito
  const placeTip = (T) => {
    const r = T.li.getBoundingClientRect()
    const half = T.tip.offsetWidth / 2
    const cx = r.left + r.width / 2
    const m = 12
    const W = document.documentElement.clientWidth
    const shift = cx - half < m ? m - (cx - half) : cx + half > W - m ? W - m - (cx + half) : 0
    T.tip.style.setProperty('--tip-x', `${Math.round(shift)}px`)
  }
  let tipTimer = 0
  const hideTips = () => {
    clearTimeout(tipTimer)
    for (const T of tiles) T.li.classList.remove('is-tip')
  }
  const showTip = (T) => {
    hideTips()
    placeTip(T)
    T.li.classList.add('is-tip')
    tipTimer = setTimeout(hideTips, TIP_MS)
  }
  document.addEventListener('pointerdown', (e) => {
    if (!row.contains(e.target)) hideTips()
  })
  for (const T of tiles) {
    T.el.addEventListener('pointerenter', () => placeTip(T))
    T.el.addEventListener('focus', () => placeTip(T))
    T.el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') showTip(T)
    })
  }

  if (reducedMotion()) return

  // ── le molle ──────────────────────────────────────────────────────────────
  let raf = 0
  let last = 0
  const kick = () => {
    if (raf) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000)
    last = now
    let busy = false
    for (const T of tiles) {
      if (!T.moving) continue
      let still = !T.press
      for (const key of KEYS) {
        T.v[key] += (K * (T.t[key] - T.s[key]) - C * T.v[key]) * dt
        T.s[key] += T.v[key] * dt
        if (Math.abs(T.v[key]) > EPS[key] * 20 || Math.abs(T.t[key] - T.s[key]) > EPS[key]) still = false
      }
      if (still) settle(T)
      else busy = true
      paint(T)
    }
    raf = busy ? requestAnimationFrame(frame) : 0
  }

  function settle(T) {
    for (const key of KEYS) (T.s[key] = T.t[key]), (T.v[key] = 0)
    T.moving = false
    if (!T.hover) T.li.classList.remove('is-active')
  }

  function paint(T) {
    const { x, y, r, k, q, u } = T.s
    if (!T.moving && !T.hover && x === 0 && y === 0 && r === 0 && k === 0 && q === 0 && u === 1) {
      // a riposo decide il CSS (stesso transform, senza stile in linea)
      T.el.style.transform = ''
      T.glyph.style.transform = ''
      return
    }
    // schiacciata si allarga, allungata si stringe: il volume resta quasi quello
    const sx = u * (1 + q * 0.85)
    const sy = u * (1 - q)
    T.el.style.transform = `translate(${x.toFixed(2)}px, ${(T.dy + y).toFixed(2)}px) rotate(${(T.rot + r).toFixed(2)}deg) skewX(${k.toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
    // il marchio ritarda sulla piastrella
    const gx = clamp(-T.v.x * 0.012 + T.v.k * 0.02, -3, 3)
    const gy = clamp(-T.v.y * 0.012 + T.v.q * 1.2, -3, 3)
    T.glyph.style.transform = `translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px)`
  }

  const wake = (T) => {
    T.moving = true
    kick()
  }

  const restTargets = (T) => {
    Object.assign(T.t, REST)
    if (T.hover) Object.assign(T.t, { y: -5, u: 1.07 })
  }

  // il colpo passa alle vicine, sempre più piano, spingendole via
  const ripple = (T, power) => {
    for (let d = 1; d <= 3; d++) {
      for (const j of [T.i - d, T.i + d]) {
        const N = tiles[j]
        if (!N) continue
        const side = j > T.i ? 1 : -1
        setTimeout(() => {
          N.v.q += (power * 2.2) / d
          N.v.x += (side * power * 70) / d
          N.v.k -= (side * power * 55) / d
          wake(N)
        }, 55 * d)
      }
    }
  }

  // velocità del puntatore sulla fila, per l'urto quando entra in una piastrella
  let px = 0
  let pt = 0
  let pvx = 0
  row.addEventListener('pointermove', (e) => {
    const now = performance.now()
    if (pt && now > pt) pvx = pvx * 0.5 + (((e.clientX - px) / (now - pt)) * 1000) * 0.5
    px = e.clientX
    pt = now
  })

  for (const T of tiles) {
    const { el, li } = T

    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return
      T.hover = true
      li.classList.add('is-active')
      restTargets(T)
      T.v.k += clamp(-pvx * 0.08, -150, 150)
      T.v.x += clamp(pvx * 0.03, -60, 60)
      T.v.q += 1.2
      wake(T)
    })

    el.addEventListener('pointermove', (e) => {
      if (T.press) {
        // trascinata: si allunga dietro al dito e si piega da quella parte
        const dx = e.clientX - T.press.x
        const dy = e.clientY - T.press.y
        T.t.x = clamp(dx * 0.3, -18, 18)
        T.t.y = clamp(dy * 0.3, -16, 10)
        T.t.k = clamp(-dx * 0.35, -18, 18)
        T.t.r = clamp(dx * 0.08, -5, 5)
        T.t.q = clamp(0.14 + dy * 0.006, -0.22, 0.2)
        wake(T)
        return
      }
      if (e.pointerType !== 'mouse' || !T.hover) return
      // al passaggio si piega verso il puntatore (la base resta ferma)
      const r = li.getBoundingClientRect()
      const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1)
      const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1)
      T.t.k = -nx * 9
      T.t.r = nx * 3
      T.t.y = -5 - ny * 2
      wake(T)
    })

    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || T.press) return
      T.hover = false
      restTargets(T)
      T.v.k += clamp(-pvx * 0.06, -120, 120)
      wake(T)
    })

    el.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return
      T.press = { x: e.clientX, y: e.clientY }
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
      li.classList.add('is-active')
      Object.assign(T.t, { q: 0.14, u: 1, y: 0 })
      T.v.q += 2.5
      wake(T)
      ripple(T, 0.8)
    })

    const release = (e) => {
      if (!T.press) return
      T.press = null
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {}
      // il mouse che esce durante la presa: l'uscita arriva solo adesso
      const r = el.getBoundingClientRect()
      if (e.pointerType === 'mouse' && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) T.hover = false
      restTargets(T)
      T.v.q -= 3.2
      T.v.x -= T.s.x * 4
      T.v.k -= T.s.k * 4
      wake(T)
      ripple(T, 0.6)
    }
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)

    // da tastiera: Invio o Spazio la schiacciano come un dito
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      T.v.q += 4
      wake(T)
      ripple(T, 0.8)
    })
  }

  // all'arrivo sullo schermo cadono una dopo l'altra, con un piccolo tonfo
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((en) => en.isIntersecting)) return
      io.disconnect()
      tiles.forEach((T, i) =>
        setTimeout(() => {
          T.v.y -= 90
          T.v.q += 2.4
          wake(T)
        }, 80 + i * 45),
      )
    },
    { threshold: 0.6 },
  )
  io.observe(row)
}
