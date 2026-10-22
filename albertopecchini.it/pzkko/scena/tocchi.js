// Le cose della strada che si toccano (22.10): il pulsante del citofono (il campanello suona dentro il negozio finché lo
// si tiene premuto), la piastra del citofono, il vetro della porta (lo si bussa), i profili d'alluminio, il maniglione
// (la porta è chiusa a chiave: sbatte sulla serratura), il lucchettone, il portachiavi della banca $pzk, il muro, e per
// terra la lattina (dondola), il pacchetto di sigarette, la scatola del ramen, i volantini bagnati, i grissini, le
// banconote della banca $pzk (si raccolgono: banconote.js), il
// chiusino, le pozzanghere (gli anelli si allargano dal dito, marciapiede.js) e la pietra.
// Il raggio dalla telecamera passa per il puntatore e vince la cosa più vicina. Col mouse si suona alla pressione, col
// dito al tocco (il clic: un dito che scorre la pagina non suona niente). Sopra i fogli e i link della pagina comanda il
// DOM (i volantini, i tagliandi, la saracinesca nuda, che suono.js fa bussare): qui non si fa niente. L'evento che
// tocca una cosa porta pzkkoTocco, così suono.js non bussa anche la saracinesca che c'è dietro sullo schermo.
// I suoni li fa suono.js (evento 'tocco', con la cosa e il punto nel mondo; 'campanello', premuto o no).
import * as T from './lib/three.js'
import { acquaQui, tocca as onda } from './marciapiede.js'
import { BAGNO } from './acqua.js'
import { Z_FACCIATA } from './materiali.js'

// dove comanda la pagina: i link, i bottoni, i fogli, i giochi, la regia, la petizione aperta
const PAGINA = 'a, button, input, textarea, select, label, dialog, .vol, .man, .man-link, .tagliandi, .pv, .regia, .suono, .rotella'
// le cose che non mettono la manina (si possono toccare, ma non sembrano fatte per esserlo)
const SENZA_MANINA = new Set(['pietra', 'muro', 'neve'])
const evento = (nome, d) => window.pzkkoSuono?.evento(nome, d)

// la scatola di un oggetto nel mondo (gli otto spigoli della geometria di ogni mesh, portati nel mondo)
const angoli = Array.from({ length: 8 }, () => new T.Vector3())
function scatola(o) {
  // (coi genitori: un oggetto dentro un gruppo appena messo, prima del primo disegno, avrebbe la matrice del gruppo vuota)
  o.updateWorldMatrix(true, true)
  const min = new T.Vector3(Infinity, Infinity, Infinity), max = new T.Vector3(-Infinity, -Infinity, -Infinity)
  o.traverse((m) => {
    if (!m.isMesh) return
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
    const b = m.geometry.boundingBox
    angoli.forEach((v, i) => { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m.matrixWorld); min.min(v); max.max(v) })
  })
  return { min, max }
}

export function tocchi({ camera, dim, h, sp, pc, M, visibile }) {
  const root = document.documentElement
  const o = new T.Vector3(), d = new T.Vector3(), p = new T.Vector3()
  // il raggio dalla telecamera per il punto (x, y) della finestra
  const raggio = (x, y) => {
    camera.updateMatrixWorld()
    o.setFromMatrixPosition(camera.matrixWorld)
    d.set((x / dim.w) * 2 - 1, 1 - (y / dim.h) * 2, 0.5).unproject(camera).sub(o).normalize()
  }
  const piano = (z) => { const t = (z - o.z) / d.z; return t > 0.01 && Number.isFinite(t) ? t : null }
  const suolo = (y) => { const t = (y - o.y) / d.y; return t > 0.01 && Number.isFinite(t) ? t : null }
  const lì = (t) => p.copy(o).addScaledVector(d, t)
  const lastre = (b, margine = 0) => {
    let t0 = 0, t1 = Infinity
    for (const k of ['x', 'y', 'z']) {
      const a = b.min[k] - margine, c = b.max[k] + margine, q = o[k], v = d[k]
      if (Math.abs(v) < 1e-9) { if (q < a || q > c) return null; continue }
      let ta = (a - q) / v, tb = (c - q) / v
      if (ta > tb) [ta, tb] = [tb, ta]
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
      if (t0 > t1) return null
    }
    return t0 > 0 ? t0 : null
  }

  // ── le cose, e come reagiscono ──
  const cit = h.citofonoTocchi, porta = h.portaTocchi, luc = h.lucchettone
  const cose = (sp.tocchi ?? []).map((c) => ({ ...c, b: scatola(c.o) }))
  const lucchetto = luc ? { o: luc.o, b: scatola(luc.o), x0: luc.o.rotation.x } : null
  // le reazioni: la lattina che dondola e scivola, le cose che sobbalzano, il lucchetto, il pulsante del citofono
  const moti = new Set()
  const scuoti = (c, forza) => {
    if (!c?.o) return
    const m = c.moto ??= { o: c.o, a: 0, v: 0, x: 0, vx: 0, ry0: c.o.rotation.y, px: c.o.position.x, pz: c.o.position.z, rot: c.rotola }
    m.v += forza * (c.rotola ? 9 : 3) * (Math.random() < 0.5 ? -1 : 1)
    if (c.rotola) m.vx += forza * 0.06 * (Math.random() < 0.5 ? -1 : 1)
    moti.add(m)
  }
  let premuto = null, tBottone = 0, bottone = 0
  const premi = () => {
    if (premuto) return
    premuto = { t: performance.now() }
    evento('campanello', { premuto: true, x: cit.x, y: cit.y, z: cit.zb })
  }
  const rilascia = () => {
    if (!premuto) return
    premuto = null
    evento('campanello', { premuto: false, x: cit.x, y: cit.y, z: cit.zb })
  }

  // ── cosa c'è sotto il punto (x, y) della finestra: la più vicina ──
  const trova = (x, y) => {
    raggio(x, y)
    let meglio = null
    const prova = (cosa, t, extra) => { if (t !== null && t !== false && (!meglio || t < meglio.t)) meglio = { cosa, t, ...extra } }
    if (cit) {
      let t = piano(cit.zb)
      if (t !== null) { lì(t); if (Math.hypot(p.x - cit.x, p.y - cit.y) < cit.r * 1.3) prova('campanello', t) }
      t = piano(cit.piastra.z)
      if (t !== null) { lì(t); const q = cit.piastra; if (Math.abs(p.x - q.x) < q.larg / 2 && Math.abs(p.y - q.y) < q.alt / 2) prova('citofono', t + 0.001) }
    }
    if (porta) {
      const m = porta.maniglia
      let t = piano(m.z)
      if (t !== null) { lì(t); if (Math.abs(p.x - m.x) < 0.032 && p.y > m.y0 - 0.03 && p.y < m.y1 + 0.03) prova('maniglione', t) }
      const a = porta.anta, v = porta.vetro
      t = piano(a.z)
      if (t !== null) {
        lì(t)
        if (p.x > a.x0 && p.x < a.x1 && p.y > a.y0 && p.y < a.y1) {
          const sulVetro = p.x > v.x0 && p.x < v.x1 && p.y > v.y0 && p.y < v.y1 && !(p.y > porta.traverso[0] && p.y < porta.traverso[1])
          if (sulVetro) { const tv = piano(v.z); if (tv !== null) prova('vetro', tv, { punto: lì(tv).clone() }) } else prova('telaio', t)
        }
      }
    }
    if (lucchetto) prova('lucchetto', lastre(lucchetto.b, 0.01))
    if (pc) prova('portachiavi', pc.tocca(o, d))
    for (const c of cose) prova(c.cosa, lastre(c.b, c.margine ?? 0.006), { c })
    // il marciapiede: una pozzanghera, la neve o la pietra (prima del cordolo; il chiusino ha la sua scatola, sopra)
    const ts = suolo(0.0015)
    if (ts !== null) {
      lì(ts)
      if (p.z > Z_FACCIATA - 0.02 && p.z < (h.strada?.z0 ?? 2.4) && p.x > -6 && p.x < M.W + 6) {
        const neve = BAGNO.meteo.value.y > 0.3
        prova(neve ? 'neve' : acquaQui(p.x, p.z) > 0 ? 'pozza' : 'pietra', ts + 0.002, { punto: p.clone() })
      }
    }
    // il muro del palazzo intorno alla saracinesca (sopra la pietra dello zoccolo, fuori dalla porta)
    const tm = piano(Z_FACCIATA)
    if (tm !== null) {
      lì(tm)
      if (p.y > 0.05 && p.y < M.H + 1.5 && (p.x < -0.06 || p.x > M.W + 0.06) && !(porta && p.x > porta.anta.x0 - 0.02 && p.x < porta.anta.x1 + 0.02 && p.y < porta.anta.y1)) prova('muro', tm + 0.003)
    }
    if (meglio && !meglio.punto) meglio.punto = lì(meglio.t).clone()
    return meglio
  }

  // ── toccare ──
  const fai = (e, tieni) => {
    if (!visibile() || document.querySelector('.pv') || e.target?.closest?.(PAGINA)) return
    const qua = trova(e.clientX, e.clientY)
    if (!qua) return
    e.pzkkoTocco = qua.cosa
    const { x, y, z } = qua.punto
    if (qua.cosa === 'campanello') { premi(); if (!tieni) setTimeout(rilascia, 900); return }
    if (qua.cosa === 'portachiavi') pc.premi()
    if (qua.cosa === 'banconota') qua.c?.prendi?.()
    if (qua.cosa === 'pozza') onda(x, z, 1)
    if (qua.cosa === 'lucchetto' && lucchetto) scuoti(lucchetto, 0.6)
    if (qua.c) scuoti(qua.c, qua.c.rotola ? 1 : 0.35)
    evento('tocco', { cosa: qua.cosa, x, y, z })
  }
  let tipo = 'mouse'
  addEventListener('pointerdown', (e) => { tipo = e.pointerType; if (e.pointerType === 'mouse' && e.button === 0) fai(e, true) }, { capture: true })
  addEventListener('pointerup', () => rilascia(), { capture: true })
  addEventListener('pointercancel', () => rilascia(), { capture: true })
  addEventListener('blur', () => rilascia())
  addEventListener('click', (e) => { if (tipo !== 'mouse') fai(e, false) }, { capture: true })
  // la manina sopra le cose da toccare (cambia solo entrando e uscendo: html.scena-tasto, scena.css)
  let manina = false
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    const si = visibile() && !document.querySelector('.pv') && !e.target?.closest?.(PAGINA) && (() => { const q = trova(e.clientX, e.clientY); return !!q && !SENZA_MANINA.has(q.cosa) })()
    if (si !== manina) { manina = si; root.classList.toggle('scena-tasto', si) }
  }, { passive: true })

  return {
    // a ogni fotogramma: il pulsante che si abbassa e torna su, le cose che dondolano. Dice se qualcosa si è mosso
    aggiorna(dt) {
      let mosso = false
      if (cit) {
        const meta = premuto ? 1 : 0
        if (meta || bottone > 0.0005) {
          bottone += ((meta - bottone) * (1 - Math.exp(-dt * (premuto ? 40 : 16))))
          cit.bottone.position.z = cit.zb - 0.0018 * bottone
          mosso = true
        }
        // (tenuto troppo a lungo: il campanello si stanca)
        if (premuto && performance.now() - premuto.t > 4000) rilascia()
      }
      for (const m of moti) {
        // una molla smorzata: la lattina rotola avanti e indietro sulla sua pancia e scivola un filo, il resto sobbalza
        m.v += (-(m.rot ? 26 : 90) * m.a - (m.rot ? 3.2 : 9) * m.v) * dt
        m.a += m.v * dt
        m.vx += (-m.x * 30 - m.vx * 7) * dt
        m.x += m.vx * dt
        if (m.rot) { m.o.children[0].rotation.y = m.a; m.o.position.x = m.px + m.x * 0.6; m.o.position.z = m.pz + m.x * 0.25 }
        else if (m.o === lucchetto?.o) m.o.rotation.x = lucchetto.x0 + m.a * 0.15
        else m.o.rotation.y = m.ry0 + m.a * 0.06
        mosso = true
        if (Math.abs(m.a) < 0.0008 && Math.abs(m.v) < 0.002 && Math.abs(m.x) < 0.0002 && Math.abs(m.vx) < 0.0005) {
          if (m.rot) { m.o.children[0].rotation.y = 0; m.o.position.x = m.px; m.o.position.z = m.pz } else if (m.o !== lucchetto?.o) m.o.rotation.y = m.ry0
          moti.delete(m)
        }
      }
      return mosso
    },
    trova,
  }
}
