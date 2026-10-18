// Burattini: la chiocciola, la nutria, l'airone, la gazza e la vespa del piè
// di pagina (puppet() in ui.js, montaggio in src/data/burattini.js).
//
// Ogni pezzo gira intorno al proprio perno su una molla: torna al suo angolo di
// riposo, `look` lo volta verso il puntatore, e i pezzi con `drag` si tirano col
// mouse (o col dito) e, lasciati, ricadono oscillando. Gli occhi seguono il
// puntatore ciascuno per conto suo, tenendo conto di quanto è girata la testa;
// senza puntatore vagano, ognuno dove vuole. I pezzi con `hide` sanno anche
// ritirarsi (spostamento, scala e rotazione su una molla a parte: dentro di
// scatto, fuori piano). Poi il carattere: la chiocciola ritira i peduncoli se li
// tocchi, la nutria mangia l'erba e ne strappa dell'altra dal cespo, l'airone
// fa l'inchino, la gazza nasconde la chiave e fa l'occhiolino, la vespa prende
// la mira col pungiglione e, se la tocchi, punge.
//
// Nella 404 la gazza ha in più un foglio nel becco ([data-carry], da puppet()
// con `inside`), che pende come un pendolo, e scappa: sta in un contenitore
// [data-flee] e salta via lungo la sua fascia quando il puntatore si avvicina.

import { $, $$, clamp, reducedMotion } from './utils.js'

const DEG = Math.PI / 180
const PUPIL = 0.46 // come in mascot.js
const ROOM = 1 - PUPIL - 0.06
const NEAR = 7
const IDLE = 3500 // ms senza movimento dopo cui il puntatore «non c'è più»
const BOW = 1500 // durata dell'inchino dell'airone, ms

const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180
const rand = (a, b) => a + Math.random() * (b - a)
const center = (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
}

export function initPuppets() {
  const roots = $$('[data-puppet]')
  if (!roots.length) return

  const still = reducedMotion()
  const pointer = { x: 0, y: 0, t: -Infinity }
  const active = (now) => now - pointer.t < IDLE
  const puppets = roots.map(build)

  // ── ciclo ──────────────────────────────────────────────────────────────────

  let raf = null
  let then = 0
  const frame = (now) => {
    const dt = then ? Math.min(0.05, (now - then) / 1000) : 1 / 60
    then = now
    let any = false
    for (const P of puppets) {
      if (!P.visible) continue
      any = true
      step(P, dt, now)
    }
    raf = any ? requestAnimationFrame(frame) : ((then = 0), null)
  }
  const wake = () => {
    raf ??= requestAnimationFrame(frame)
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const P = puppets.find((p) => p.root === e.target)
          if (P) P.visible = e.isIntersecting
        }
        wake()
      },
      { rootMargin: '15%' },
    )
    puppets.forEach((P) => io.observe(P.root))
  } else {
    puppets.forEach((P) => (P.visible = true))
    wake()
  }

  const track = (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.t = performance.now()
  }
  addEventListener('pointermove', track, { passive: true })
  addEventListener('pointerdown', track, { passive: true })
  // dopo un tocco il «puntatore» non c'è più: si torna a guardarsi intorno
  addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType === 'mouse') return
      const at = pointer.t
      setTimeout(() => {
        if (pointer.t === at) pointer.t = -Infinity
      }, 1500)
    },
    { passive: true },
  )

  // ── un burattino ───────────────────────────────────────────────────────────

  function build(root) {
    const rig = JSON.parse(root.dataset.rig)
    const P = { name: root.dataset.puppet, root, stage: $('.pup__stage', root), visible: false, parts: [], byId: {}, eyes: [], dragging: null }
    P.parts = $$('[data-part]', root).map((el) => {
      const id = el.dataset.part
      const cfg = rig[id] || null
      // h: quanto è ritirato (0 fuori, 1 dentro), hv la sua velocità, hg dove deve andare; S la scala complessiva
      return { id, el, cfg, img: $(':scope > .pup__img', el), pin: $(':scope > .pup__pin', el), parent: null, rest: cfg?.rest || 0, a: 0, v: 0, pose: 0, abs: 0, h: 0, hv: 0, hg: 0, S: 1, shown: null }
    })
    const byEl = new Map(P.parts.map((p) => [p.el, p]))
    const byImg = new Map(P.parts.map((p) => [p.img, p]))
    for (const p of P.parts) {
      p.parent = byEl.get(p.el.parentElement.closest('[data-part]')) || null
      P.byId[p.id] = p
      for (const eye of $$(':scope > .masc__eye', p.el)) P.eyes.push({ eye, pupil: $('.masc__pupil', eye), part: p, tx: 0, ty: 0, next: 0 })
    }
    // la scena: scostamento (librarsi, saltello, affondo) e inclinazione
    P.off = { x: 0, y: 0, r: 0, lx: 0, ly: 0, vx: 0, vy: 0 }
    // dove guarda senza puntatore: un punto a caso, o ciò che dice data-gaze
    P.gaze = { x: 0, y: 0, next: 0, el: root.dataset.gaze ? $(root.dataset.gaze) : null }
    P.until = {} // stati a tempo: inchino, occhiolino, rabbia…
    // le regole della scena (data-scene, `scena` in burattini.js): il corpo che
    // si solleva col mouse, la durata dei battiti di palpebre
    P.scene = root.dataset.scene ? JSON.parse(root.dataset.scene) : {}
    // il corpo sollevato: scostamento dal suolo, velocità, preso o in volo
    P.lift = { x: 0, y: 0, vx: 0, vy: 0, held: false, air: false, landed: 0 }
    P.behave = BEHAVE[P.name] || (() => {})
    P.poke = POKE[P.name] || (() => {})

    // ciò che tiene in bocca: il pezzo che lo porta, angolo e velocità del pendolo
    const carry = $('[data-carry]', root)
    if (carry) {
      P.carry = { el: carry, part: byEl.get(carry.closest('[data-part]')), a: 0, v: 0, shown: '' }
      // il foglio della 404 porta scritto l'indirizzo che non c'è
      const path = $('[data-path]', carry)
      if (path) path.textContent = shortPath(location.pathname)
    }
    // la fuga: il contenitore da spostare e la fascia in cui si muove
    const wrapper = root.closest('[data-flee]')
    if (wrapper) P.flee = { wrap: wrapper, arena: wrapper.parentElement, x: null, y: 0, vx: 0, hop: null, calm: 0, next: performance.now() + rand(3000, 6000), shown: '' }

    // il puntatore sui pezzi: mano aperta su quelli da tirare, dito sugli altri
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || P.dragging) return
      const hit = pick(P, byImg, e.clientX, e.clientY)
      const grabbable = Boolean(hit?.cfg?.drag || (hit && !hit.parent && P.scene.lift))
      root.classList.toggle('is-grab', grabbable)
      root.classList.toggle('is-poke', Boolean(hit && !grabbable))
    })
    root.addEventListener('pointerleave', () => root.classList.remove('is-grab', 'is-poke'))
    // un pezzo che arriva cadendo (animazione CSS pup-drop, il guscio della
    // chiocciola in testata): quando atterra, il burattino reagisce come a un tocco
    root.addEventListener('animationend', (e) => {
      const hit = e.animationName === 'pup-drop' && byEl.get(e.target)
      if (hit) {
        wake()
        P.poke(P, hit, performance.now(), pointer)
      }
    })
    root.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || P.dragging) return
      // il foglio in bocca conta come il pezzo che lo tiene
      const hit = pick(P, byImg, e.clientX, e.clientY) || (P.carry && e.target.closest?.('[data-carry]') ? P.carry.part : null)
      if (!hit) return
      e.preventDefault()
      track(e)
      if (hit.cfg?.drag) grab(P, hit, e)
      // il corpo si solleva col mouse (col dito no: la pagina deve scorrere)
      else if (!hit.parent && P.scene.lift && e.pointerType !== 'touch') lift(P, hit, e)
      else P.poke(P, hit, performance.now(), pointer)
    })

    // battito di palpebre, ogni tanto doppio (`blink` nella scena li allunga)
    const ms = P.scene.blink || 130
    const blink = () => {
      if (P.visible && !document.hidden && !still && !P.sleepy) {
        shut(P.eyes, ms)
        if (Math.random() < 0.25) setTimeout(() => shut(P.eyes, ms), ms * 2)
      }
      setTimeout(blink, rand(2600, 6800))
    }
    setTimeout(blink, rand(1200, 3700))
    return P
  }

  // ── tirare un pezzo ────────────────────────────────────────────────────────

  function grab(P, part, e) {
    const pv = center(part.pin)
    const angle = (ev) => Math.atan2(ev.clientY - pv.y, ev.clientX - pv.x) / DEG
    const d = { part, off: part.a - angle(e), x: e.clientX, y: e.clientY, moved: false, t: performance.now() }
    P.dragging = d
    P.root.classList.add('is-grabbing')
    wake()

    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      track(ev)
      if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 4) d.moved = true
      // il perno può spostarsi (la vespa si libra): lo si rilegge
      Object.assign(pv, center(part.pin))
      const { min, max } = part.cfg
      let a = part.a + wrap(angle(ev) + d.off - part.a)
      // oltre l'escursione il pezzo resiste, come carta tesa sul fermacampioni
      if (a > max) a = max + Math.min(22, (a - max) * 0.3)
      if (a < min) a = min - Math.min(22, (min - a) * 0.3)
      const now = performance.now()
      const dt = Math.max(8, now - d.t) / 1000
      part.v = part.v * 0.4 + ((a - part.a) / dt) * 0.6
      part.a = a
      d.t = now
    }
    const end = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', end)
      removeEventListener('pointercancel', end)
      P.dragging = null
      P.root.classList.remove('is-grabbing')
      // un tocco senza trascinare: il pezzo scatta, e il burattino reagisce
      if (!d.moved) {
        part.v += part.cfg.max > -part.cfg.min ? 260 : -260
        P.poke(P, part, performance.now(), pointer)
      }
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerup', end)
    addEventListener('pointercancel', end)
  }

  // ── sollevare il corpo (la nutria) ─────────────────────────────────────────
  // Col mouse il corpo si prende e si solleva: segue il puntatore (poco di
  // lato, mai sotto il suolo) e, lasciato, ricade e rimbalza appena (in step).
  // Un clic senza trascinare è un tocco.

  function lift(P, part, e) {
    const L = P.lift
    const d = { part, lift: true, x: e.clientX, y: e.clientY, ox: L.x, oy: L.y, moved: false, t: performance.now() }
    P.dragging = d
    P.root.classList.add('is-grabbing')
    wake()

    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      track(ev)
      if (!d.moved && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 4) {
        d.moved = L.held = true
        L.air = false
      }
      if (!d.moved) return
      const { width: w, height: h } = P.root.getBoundingClientRect()
      const x = clamp(d.ox + ev.clientX - d.x, -0.3 * w, 0.3 * w)
      const y = clamp(d.oy + ev.clientY - d.y, -0.7 * h, 0)
      const now = performance.now()
      const dt = Math.max(8, now - d.t) / 1000
      L.vx = L.vx * 0.5 + ((x - L.x) / dt) * 0.5
      L.vy = L.vy * 0.5 + ((y - L.y) / dt) * 0.5
      L.x = x
      L.y = y
      d.t = now
    }
    const end = (ev) => {
      if (ev.pointerId !== e.pointerId) return
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', end)
      removeEventListener('pointercancel', end)
      P.dragging = null
      P.root.classList.remove('is-grabbing')
      L.held = false
      if (d.moved) {
        // lasciato: cade da dov'è, con al più un piccolo lancio
        const h = P.root.getBoundingClientRect().height || 1
        L.vy = clamp(L.vy, -0.6 * h, 0.6 * h)
        L.air = true
      } else if (ev.type === 'pointerup') P.poke(P, part, performance.now(), pointer)
    }
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerup', end)
    addEventListener('pointercancel', end)
  }

  // ── la fuga (la 404) ───────────────────────────────────────────────────────
  // Quando il puntatore le arriva vicino, la gazza salta via lungo la fascia,
  // lontano da lui; se è all'angolo lo scavalca con un salto alto. Ogni tanto
  // saltella anche da sola. Lo sguardo intanto resta sul puntatore: scappa
  // guardandoti. In volo l'ala si alza, la coda sale, le zampe si raccolgono.

  function flee(P, { now, dt, on, still }) {
    const F = P.flee
    const { box: A, me } = F
    if (!A.width) return
    if (F.x === null) {
      // la prima volta: da dove l'ha messa il CSS, poi la si muove da sinistra
      F.x = me.left - A.left
      F.wrap.classList.add('is-free')
    }
    // a sinistra resta posto per il foglio, che pende oltre il becco
    const min = me.width * 0.08
    const max = Math.max(min, A.width - me.width)
    const { ala, coda, zampa, zampa2 } = P.byId
    const x0 = F.x
    if (F.hop) {
      const u = Math.min(1, (now - F.hop.t0) / F.hop.dur)
      const e = u < 0.5 ? 2 * u * u : 1 - (2 - 2 * u) ** 2 / 2
      F.x = F.hop.from + (F.hop.to - F.hop.from) * e
      F.y = -F.hop.h * 4 * u * (1 - u)
      const lift = Math.sin(Math.PI * u)
      ala.pose = -50 * lift
      coda.pose = -16 * lift
      zampa.pose = zampa2.pose = 20 * lift
      if (u >= 1) {
        F.hop = null
        F.y = 0
        F.calm = now + 260
        ala.pose = coda.pose = zampa.pose = zampa2.pose = 0
        P.off.vy += 160 // l'atterraggio
        coda.v -= 240
      }
    } else if (!still) {
      F.x = clamp(F.x, min, max)
      const cx = me.left + me.width / 2
      const cy = me.top + me.height / 2
      const near = on && Math.abs(pointer.x - cx) < me.width * 0.9 && Math.abs(pointer.y - cy) < me.height * 0.9
      const chased = near || P.until.scappa > now
      if (now > F.calm && (chased || now > F.next)) {
        let dir = chased ? (pointer.x < cx ? 1 : -1) : Math.random() < 0.5 ? 1 : -1
        let to = clamp(F.x + dir * (chased ? rand(0.3, 0.45) * A.width : rand(0.5, 1.1) * me.width), min, max)
        let over = false
        // all'angolo: dall'altra parte, sopra il puntatore
        if (Math.abs(to - F.x) < me.width * 0.7) {
          dir = -dir
          to = clamp(F.x + dir * rand(0.45, 0.6) * A.width, min, max)
          over = chased
        }
        const d = Math.abs(to - F.x)
        if (d > 8) F.hop = { from: F.x, to, t0: now, dur: clamp(360 + d * 0.45, 380, 760), h: me.height * (over ? 0.62 : clamp(d / A.width, 0.12, 0.3) + 0.08) }
        P.until.scappa = 0
        F.next = now + rand(4500, 9000)
      }
    }
    F.vx = dt ? (F.x - x0) / dt : 0
    const t = `translate(${F.x.toFixed(1)}px, ${F.y.toFixed(1)}px)`
    if (t !== F.shown) F.wrap.style.transform = F.shown = t
  }

  // ── un fotogramma ──────────────────────────────────────────────────────────

  function step(P, dt, now) {
    const on = active(now) || Boolean(P.dragging)
    const t = now / 1000

    // letture, tutte prima delle scritture
    for (const p of P.parts) {
      const hide = p.cfg?.hide
      p.abs = p.parent ? p.parent.abs + p.rest + p.a + (hide?.r || 0) * p.h : P.off.r
      p.S = (p.parent ? p.parent.S : 1) * (hide ? 1 - (1 - (hide.s ?? 1)) * p.h : 1)
      if (p.cfg) p.pv = center(p.pin)
    }
    for (const e of P.eyes) e.c = center(e.eye)
    const box = center(P.root)
    if (P.flee) {
      P.flee.box = P.flee.arena.getBoundingClientRect()
      P.flee.me = P.flee.wrap.getBoundingClientRect()
    }

    // dove si guarda: il puntatore, o un punto che cambia ogni tanto
    // (con il movimento ridotto si guarda avanti, un po' in basso, e basta)
    if (!on && P.gaze.el) {
      // un punto fisso (la sede sulla carta), con appena un tremito dello sguardo
      const c = center(P.gaze.el)
      if (now > P.gaze.next) P.gaze = { ...P.gaze, next: now + rand(1200, 2600), jx: still ? 0 : rand(-6, 6), jy: still ? 0 : rand(-4, 4) }
      P.gaze.x = c.x + (P.gaze.jx || 0)
      P.gaze.y = c.y + (P.gaze.jy || 0)
    } else if (!on && now > P.gaze.next) {
      P.gaze.next = still ? Infinity : now + rand(1400, 4000)
      P.gaze.x = box.x + (still ? 0 : rand(-0.5, 0.5) * innerWidth)
      P.gaze.y = box.y + (still ? 0.2 : rand(-0.4, 0.3)) * innerHeight
    }
    // il carattere può fissare un punto (la nutria guarda il cespo che strappa)
    const target = on ? pointer : P.stare || P.gaze
    P.root.classList.toggle('is-idle', !on)

    // obiettivi: posa del carattere + sguardo
    for (const p of P.parts) {
      if (!p.cfg) continue
      p.goal = 0
      p.hk = 0 // rigidità del ritiro: il carattere può imporla per un fotogramma
      if (p.cfg.look) {
        const phi = Math.atan2(target.y - p.pv.y, target.x - p.pv.x) / DEG
        const want = wrap(phi - (p.parent.abs + p.rest) - p.cfg.dir)
        p.goal = clamp(want * p.cfg.look, p.cfg.min, p.cfg.max)
      }
    }
    P.behave(P, { now, t, dt, on, target, box, still })
    if (P.flee) flee(P, { now, dt, on, still })
    for (const p of P.parts) if (p.cfg) p.goal = clamp(p.goal + p.pose, p.cfg.min - 15, p.cfg.max + 15)

    // molle
    for (const p of P.parts) {
      if (!p.cfg || P.dragging?.part === p) continue
      const k = p.cfg.k
      const c = 2 * Math.sqrt(k) * (still ? 1 : p.cfg.damp)
      p.v += (k * (p.goal - p.a) - c * p.v) * dt
      p.a += p.v * dt
    }

    // il ritiro: dentro di scatto, fuori piano (con il movimento ridotto, subito);
    // oltre il riposo (h negativo) solo fino a `out`; `manual` lo muove il carattere
    for (const p of P.parts) {
      const hide = p.cfg?.hide
      if (!hide || hide.manual) continue
      if (still) {
        p.h = p.hg
        continue
      }
      const going = p.hg > p.h
      const k = p.hk || (going ? 340 : 34)
      p.hv += (k * (p.hg - p.h) - 2 * Math.sqrt(k) * (going ? 0.95 : 0.85) * p.hv) * dt
      p.h = clamp(p.h + p.hv * dt, -(hide.out ?? 0.04), 1.02)
    }

    // il corpo sollevato (lift): lasciato, cade con la gravità e rimbalza; ogni
    // contatto col suolo lascia in `thud` l'ora e in `hit` la velocità
    const L = P.lift
    if (!L.held && (L.air || L.y < 0)) {
      if (still) (L.y = 0), (L.air = false)
      else {
        L.vy += 9 * box.h * dt
        L.y += L.vy * dt
        if (L.y >= 0) {
          L.y = 0
          L.thud = now
          L.hit = L.vy / box.h
          if (L.vy > 1.1 * box.h) L.vy *= -0.3
          else (L.vy = 0), (L.air = false)
        }
      }
    }
    // a terra fuori posto: torna al suo posto camminando (il carattere muove le zampe)
    L.walking = !L.held && !L.air && Math.abs(L.x) > 1
    if (L.walking) L.x = still ? 0 : L.x * Math.exp(-1.3 * dt)

    // la scena: scostamento del carattere (x, y, r) + affondo che torna a molla
    const o = P.off
    o.vx += (-160 * o.lx - 14 * o.vx) * dt
    o.vy += (-160 * o.ly - 14 * o.vy) * dt
    o.lx += o.vx * dt
    o.ly += o.vy * dt
    const sx = (o.x + o.lx + L.x).toFixed(2)
    const sy = (o.y + o.ly + L.y).toFixed(2)
    const stage = `translate(${sx}px, ${sy}px) rotate(${o.r.toFixed(2)}deg)`
    if (stage !== P.shown) P.stage.style.transform = P.shown = stage

    // il foglio in bocca: la gravità lo tiene dritto (compensa l'angolo del
    // pezzo che lo porta) e nei salti resta indietro
    if (P.carry) {
      const C = P.carry
      const want = clamp(-C.part.abs - (P.flee?.vx || 0) * 0.035, -40, 40)
      if (still) C.a = want
      else {
        C.v += (38 * (want - C.a) - 2.2 * C.v) * dt
        C.a += C.v * dt
      }
      const r = `rotate(${C.a.toFixed(2)}deg)`
      if (r !== C.shown) C.el.style.transform = C.shown = r
    }

    // scritture
    for (const p of P.parts) {
      if (!p.cfg) continue
      const hide = p.cfg.hide
      const h = hide && Math.abs(p.h) > 0.002 ? p.h : 0
      let t = `rotate(${(p.rest + p.a + (h && (hide.r || 0) * h)).toFixed(2)}deg)`
      if (h) {
        // lo spostamento: nelle direzioni del genitore, o con `own` lungo il pezzo girato
        const move = `translate(${((hide.x || 0) * h).toFixed(2)}%, ${((hide.y || 0) * h).toFixed(2)}%)`
        const scale = `scale(${(1 - (1 - (hide.s ?? 1)) * h).toFixed(3)})`
        t = hide.own ? `${t} ${move} ${scale}` : `${move} ${t} ${scale}`
      }
      if (t !== p.shown) p.el.style.transform = p.shown = t
    }

    // occhi: ciascuno per sé; senza puntatore ognuno sceglie il suo punto
    for (const e of P.eyes) {
      if (!on && !P.stare && now > e.next) {
        e.next = still ? Infinity : now + rand(900, 3200)
        const spread = still ? 0 : P.gaze.el ? 0.015 : Math.random() < 0.3 ? 0.35 : 0.08
        e.tx = target.x + rand(-1, 1) * innerWidth * spread
        e.ty = target.y + rand(-1, 1) * innerHeight * spread
      }
      const [gx, gy] = on || P.stare ? [target.x, target.y] : [e.tx, e.ty]
      const dx = gx - e.c.x
      const dy = gy - e.c.y
      const d = Math.hypot(dx, dy) || 1
      // nel riferimento della testa, che può essere girata
      const a = -e.part.abs * DEG
      const [lx, ly] = [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]
      const rx = e.eye.offsetWidth / 2
      const ry = e.eye.offsetHeight / 2
      const k = Math.min(1, d / (rx * NEAR))
      e.pupil.style.setProperty('--px', `${((lx / d) * rx * ROOM * k).toFixed(1)}px`)
      e.pupil.style.setProperty('--py', `${((ly / d) * ry * ROOM * k).toFixed(1)}px`)
    }
  }
}

// ── Il foglio della 404 ───────────────────────────────────────────────────────

/** L'indirizzo che non c'è, abbastanza corto da stare sul foglio. */
function shortPath(path) {
  let p = path
  try {
    p = decodeURIComponent(path)
  } catch {}
  return p.length > 19 ? `…${p.slice(-18)}` : p
}

// ── Hit test ──────────────────────────────────────────────────────────────────
// I riquadri dei pezzi si sovrappongono e sono in buona parte trasparenti: il
// pezzo sotto il puntatore è il primo, dall'alto, che lì è pieno. La
// trasparenza si legge da una copia piccola dell'immagine su un canvas.

function mask(part) {
  if (part.mask !== undefined) return part.mask
  const img = part.img
  if (!img.complete || !img.naturalWidth) return null
  try {
    const w = 64
    const h = Math.max(1, Math.round((w * img.naturalHeight) / img.naturalWidth))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    part.mask = { w, h, data: ctx.getImageData(0, 0, w, h).data }
  } catch {
    part.mask = null
  }
  return part.mask
}

function solid(part, x, y) {
  const m = mask(part)
  if (!m) return true
  const pv = center(part.pin)
  const a = -part.abs * DEG
  const s = part.S || 1
  const [dx, dy] = [(x - pv.x) / s, (y - pv.y) / s]
  const u = part.pin.offsetLeft + dx * Math.cos(a) - dy * Math.sin(a)
  const v = part.pin.offsetTop + dx * Math.sin(a) + dy * Math.cos(a)
  const mx = Math.floor((u / part.el.offsetWidth) * m.w)
  const my = Math.floor((v / part.el.offsetHeight) * m.h)
  if (mx < 0 || my < 0 || mx >= m.w || my >= m.h) return false
  return m.data[(my * m.w + mx) * 4 + 3] > 60
}

function pick(P, byImg, x, y) {
  for (const el of document.elementsFromPoint(x, y)) {
    const part = byImg.get(el)
    if (part && solid(part, x, y)) return part
  }
  return null
}

function shut(eyes, ms) {
  eyes.forEach((e) => e.eye.classList.add('is-blink'))
  setTimeout(() => eyes.forEach((e) => e.eye.classList.remove('is-blink')), ms)
}

// ── Carattere ─────────────────────────────────────────────────────────────────
// `behave` corre a ogni fotogramma e aggiunge la posa (p.pose) agli obiettivi;
// `poke` è la reazione a un tocco (sul corpo, o su un pezzo senza trascinarlo).

const BEHAVE = {
  // la chiocciola: i peduncoli ondeggiano, ciascuno col suo passo; toccati si
  // ritirano (vedi POKE) e restano dentro un po', poi riescono piano
  lumaca(P, { now, t, still }) {
    const { peduncolo: a, peduncolo2: b, guscio } = P.byId
    if (!still) {
      a.pose = Math.sin(t * 1.1) * 4
      b.pose = Math.sin(t * 0.87 + 1.7) * 4
      if (guscio) guscio.pose = Math.sin(t * 0.6) * 0.8
    }
    for (const p of [a, b]) p.hg = p.until > now ? p.depth : 0
  },

  // la nutria: vedi NUTRIA più sotto
  nutria: (P, s) => NUTRIA.behave(P, s),

  // l'airone: lento e composto; la zampa alzata ondeggia appena, il collo respira
  airone(P, { now, t, still }) {
    const { collo, testa, zampaAlzata } = P.byId
    // l'inchino: il collo scende piano e risale, la testa resta composta
    const bow = P.until.bow > now ? Math.sin(((P.until.bow - now) / BOW) * Math.PI) : 0
    collo.pose = (still ? 0 : Math.sin(t * 0.8) * 2) + bow * 42
    testa.pose = bow * -22
    zampaAlzata.pose = still ? 0 : Math.sin(t * 1.3) * 5
  },

  // la gazza: la testa va a scatti, come gli uccelli; se ti avvicini alla chiave
  // la gira dall'altra parte e ti guarda di sbieco; la coda ogni tanto frusta
  gazza(P, { now, on, target, still }) {
    const { testa, coda } = P.byId
    const key = center(testa.img)
    const near = on && Math.hypot(target.x - key.x, target.y - key.y) < key.w * 1.1
    P.root.classList.toggle('is-sly', near || P.until.sly > now)
    if (near) {
      testa.goal = testa.goal > 0 ? testa.cfg.min : testa.cfg.max
      if (!P.until.hid || P.until.hid < now) (coda.v -= 320), (P.until.hid = now + 1600)
    }
    // scatti: l'obiettivo della testa si aggiorna solo ogni tanto
    if (!P.head || now > P.head.next || near !== P.head.near) P.head = { goal: testa.goal, next: now + rand(160, 420), near }
    testa.goal = P.head.goal
    if (!still && now > (P.until.flick || 0)) {
      P.until.flick = now + rand(2500, 6500)
      coda.v -= rand(180, 320)
    }
  },

  // la vespa: si libra, il pungiglione punta preciso dove sei; se ti avvicini si arrabbia
  vespa(P, { now, t, on, target, box, still }) {
    const angry = (on && Math.hypot(target.x - box.x, target.y - box.y) < box.w * 0.9) || P.until.angry > now
    P.root.classList.toggle('is-angry', angry)
    if (still) return
    const o = P.off
    o.x = Math.sin(t * 1.7) * 5 + Math.sin(t * 0.63) * 9 + (angry ? rand(-1.5, 1.5) : 0)
    o.y = Math.sin(t * 2.3) * 6 + (angry ? rand(-1.5, 1.5) : 0)
    o.r = Math.sin(t * 1.1) * 3
    if (now > (P.until.twitch || 0)) {
      P.until.twitch = now + rand(700, 2600)
      P.byId[Math.random() < 0.5 ? 'antenna' : 'antenna2'].v += rand(-240, 240)
    }
  },
}

const POKE = {
  // toccato un peduncolo, rientra lui e l'altro a metà; toccato il resto, tutti e due
  lumaca(P, part, now) {
    const { peduncolo: a, peduncolo2: b, guscio } = P.byId
    const hit = part === a || part === b ? part : null
    for (const p of [a, b]) {
      const full = !hit || p === hit
      p.depth = full ? 1 : 0.5
      p.until = now + (full ? rand(1400, 2100) : rand(700, 1100))
    }
    if (!hit && guscio) guscio.v += 90
  },

  nutria: (P, part, now) => NUTRIA.poke(P, part, now),

  // un inchino
  airone(P, part, now) {
    if (P.until.bow > now) return
    P.until.bow = now + BOW
  },

  // l'occhiolino (un occhio solo), un saltello e una frustata di coda; nella
  // 404, poi, scappa col foglio
  gazza(P, part, now) {
    const eye = P.eyes[1] || P.eyes[0]
    shut([eye], 420)
    P.until.sly = now + 900
    P.off.vy -= 260
    P.byId.coda.v -= 360
    if (P.flee) P.until.scappa = now + 250
  },

  // la puntura: un affondo verso il puntatore e il pungiglione che scatta
  vespa(P, part, now, pointer) {
    P.until.angry = now + 2200
    const box = center(P.root)
    const { x, y } = pointer
    const d = Math.hypot(x - box.x, y - box.y) || 1
    P.off.vx += ((x - box.x) / d) * 420
    P.off.vy += ((y - box.y) / d) * 420
    P.byId.addome.v += 500
  },
}

// ── La nutria ─────────────────────────────────────────────────────────────────
// Golosa e placida: seduta sulle zampe di dietro mangia un ciuffo d'erba che
// tiene con le mani. Mastica a riprese e il ciuffo si consuma (si riduce
// intorno alla mano); finito, il braccio scende al cespo che ha davanti, ne
// strappa un altro e lo riporta alla bocca. Se ti avvicini si blocca un attimo
// con gli occhi sbarrati, poi riprende a mangiare guardandoti. Ogni tanto
// annusa l'aria o batte il piede; se resti via a lungo e l'erba è quasi finita
// si strofina il muso con le mani. Un tocco sulla testa e ingoia il ciuffo in
// un boccone solo; sul corpo si scrolla come uscita dal fiume; sulla coda la
// frusta; sul piede lo batte; sul cespo va a strapparne un altro; sull'erba la
// stringe a sé socchiudendo gli occhi. Presa per il corpo (col mouse) agita
// braccia, piede e coda; a terra, se il volo era alto, si scrolla.

const EAT = [9000, 15000] // ms per finire un ciuffo
const GULP = 700
const SHAKE = 650
const GROOM_AFTER = [20000, 34000] // ms senza puntatore prima di strofinarsi il muso

const NUTRIA = {
  behave(P, { now, t, dt, on, target, box, still }) {
    const { testa, mascella, braccio, braccio2, erba, zampa, coda, cespo } = P.byId
    const N = (P.nn ??= { mouth: $('.pup__mouth', P.root), phase: 'eat', t0: now, eaten: 0, rate: 1 / rand(...EAT), chew: null, next: 0, open: '', near: false, groomAt: 0 })
    const U = P.until
    const L = P.lift
    const lifted = L.held || L.air
    const bell = (until, dur) => (until > now ? Math.sin((1 - (until - now) / dur) * Math.PI) : 0)

    // ── la caduta: all'atterraggio tutto sobbalza; da alto, si scrolla
    if (L.thud && now - L.thud < 80) {
      const hit = L.hit || 0
      L.thud = 0
      testa.v += 120 + hit * 40
      coda.v -= 200 + hit * 40
      zampa.v += 160
      braccio.v -= 120
      if (hit > 2.4) (U.shake = now + SHAKE), (U.freeze = now + 1200)
    }

    // ── il puntatore vicino: si blocca un attimo, occhi sbarrati, poi mangia guardandoti
    const near = on && !lifted && Math.hypot(target.x - box.x, target.y - box.y) < box.w * 0.75
    if (near && !N.near && !still) U.freeze = Math.max(U.freeze || 0, now + 900)
    N.near = near
    const frozen = U.freeze > now
    P.root.classList.toggle('is-alert', frozen && !lifted)
    P.root.classList.toggle('is-sly', U.hold > now)

    // ── strofinarsi il muso: solo senza nessuno intorno, con l'erba quasi finita
    if (still || on || lifted) N.groomAt = 0
    else {
      if (!N.groomAt) N.groomAt = now + rand(...GROOM_AFTER)
      if (now > N.groomAt && N.phase === 'eat' && N.eaten > 0.7 && !(U.groom > now)) {
        U.groom = now + 1600
        shut(P.eyes, 1400)
        N.groomAt = now + rand(...GROOM_AFTER)
      }
    }
    const groom = bell(U.groom, 1600)

    // ── il pasto: mangia → scende al cespo → strappa → risale
    const gulp = bell(U.gulp, GULP)
    let jaw = 0
    let arm = 0
    if (still) {
      N.phase = 'eat'
      N.eaten = 0
    } else if (lifted) {
      N.chew = null
      arm = Math.sin(t * 5) * 18 + 10
    } else
      switch (N.phase) {
        case 'eat':
          if (gulp) {
            jaw = -30 * gulp
            if (gulp > 0.95) N.eaten = 1
          } else if (!(U.swallow > now) && !frozen && !groom && braccio.a > -15) {
            if (N.chew && N.chew.until > now) {
              jaw = (-12 * (1 - Math.cos(((now - N.chew.t0) / 1000) * N.chew.f * 2 * Math.PI))) / 2
              N.eaten += N.rate * dt * 1000 * 1.6 // si consuma solo masticando (~5/8 del tempo)
            } else if (now > N.next) {
              N.next = now + rand(500, 1400)
              N.chew = { t0: now, until: now + rand(1200, 2400), f: rand(3.6, 5) }
            }
          }
          if (N.eaten >= 1 && !(U.gulp > now) && !(U.swallow > now)) {
            N.phase = 'reach'
            N.t0 = now
            N.chew = null
          }
          break
        case 'reach':
          arm = -68
          if (braccio.a < -50 && now - N.t0 > 350) {
            N.phase = 'grab'
            N.t0 = now
            if (cespo) cespo.v += 220
          }
          break
        case 'grab':
          arm = -68
          N.eaten = clamp(1 - (now - N.t0) / 220, 0, 1)
          if (now - N.t0 > 380) (N.phase = 'lift'), (N.t0 = now)
          break
        case 'lift':
          if (braccio.a > -8 || now - N.t0 > 2500) {
            N.phase = 'eat'
            N.rate = 1 / rand(...EAT)
            N.next = now + 150
          }
          break
      }
    const reaching = N.phase === 'reach' || N.phase === 'grab'
    erba.h = clamp(N.eaten, 0, 1)
    // stringere il ciuffo a sé (tocco sull'erba), strofinarsi il muso
    if (U.hold > now) arm += 10 * bell(U.hold, 900)
    if (groom) arm += (6 + Math.sin(t * 17) * 7) * groom
    braccio.pose = arm
    if (braccio2) braccio2.pose = arm
    mascella.pose = jaw
    const open = clamp(-mascella.a / 30, 0, 1).toFixed(3)
    if (open !== N.open && N.mouth) N.mouth.style.setProperty('--open', (N.open = open))

    // ── la testa: segue il boccone, scende col braccio, annusa, si scrolla
    const sniff = bell(U.sniff, 900)
    const shake = bell(U.shake, SHAKE)
    testa.pose = (still ? 0 : Math.sin(t * 0.7) * 1.2) - jaw * 0.15 + (reaching ? -14 : 0) + bell(U.swallow, 600) * 10 + sniff * (9 + Math.sin(t * 50) * 2) + shake * Math.sin(t * 70) * 6 - groom * 6
    // lo sguardo al cespo quando lo raggiunge (o quando glielo tocchi)
    if (cespo && (reaching || U.glance > now)) {
      const c = center(cespo.img)
      P.stare = { x: c.x, y: c.y }
    } else P.stare = null
    P.off.r = shake * Math.sin(t * 70) * 3.5

    // ── ogni tanto, da sola: annusa l'aria o batte il piede
    if (!still && !lifted && !on && N.phase === 'eat' && now > (U.idle || 0)) {
      U.idle = now + rand(7000, 15000)
      if (Math.random() < 0.6) U.sniff = now + 900
      else U.scratch = now + 800
    }

    // ── piede e coda; in aria scalcia, a terra fuori posto torna a saltelli
    if (still) zampa.pose = coda.pose = 0
    else if (lifted) {
      const sway = clamp(L.vx * 0.05, -25, 25)
      zampa.pose = Math.sin(t * 6) * 18 + sway
      coda.pose = Math.sin(t * 7) * 16 - sway
    } else {
      zampa.pose = U.scratch > now ? Math.sin(t * 20) * 9 : L.walking ? Math.sin(t * 9) * 12 : Math.sin(t * 0.8) * 1.5
      coda.pose = U.wag > now ? Math.sin(t * 12) * 14 : Math.sin(t * 0.6) * 3 + shake * Math.sin(t * 70) * 8
    }
    P.off.y = L.walking && !still ? -Math.abs(Math.sin(t * 9)) * box.h * 0.03 : 0
  },

  poke(P, part, now) {
    const N = P.nn
    const U = P.until
    switch (part.id) {
      case 'coda':
        U.wag = now + 1200
        return
      case 'zampa':
        U.scratch = now + 800
        return
      case 'cespo':
        // se il ciuffo in mano è a metà va a strapparne un altro; se no lo guarda
        part.v += 240
        if (N.phase === 'eat' && N.eaten > 0.45 && !(U.gulp > now)) N.eaten = 1
        else U.glance = now + 900
        return
      case 'erba':
      case 'braccio':
      case 'braccio2':
        U.hold = now + 900
        return
      case 'testa':
      case 'mascella':
        // un boccone solo: ingoia tutto il ciuffo
        if (N.phase === 'eat' && N.eaten < 1 && !(U.gulp > now)) {
          U.gulp = now + GULP
          U.swallow = now + GULP + 600
          shut(P.eyes, 320)
        } else U.sniff = now + 900
        return
      default:
        // il corpo: si scrolla come uscita dal fiume
        U.shake = now + SHAKE
        P.byId.testa.v += 180
        P.byId.coda.v -= 260
    }
  },
}
