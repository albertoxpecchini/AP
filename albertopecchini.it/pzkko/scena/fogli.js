// Quello che sta attaccato alla saracinesca, preso dalla pagina: ogni elemento
// .it della parete (volantini, manifesti, graffiti, nastri) diventa un foglio di
// poligoni nel punto esatto in cui sta nel DOM (le stesse --x --y --w --r in
// 1280esimi), piegato sulle doghe, con la sua immagine sopra. I volantini usano
// le foto fatte da tools/pzkko/scena/cattura.mjs (art/scena/vol/), i tagliandi
// sono pezzi a sé che cadono quando la pagina li strappa. Il DOM resta sotto,
// invisibile, a ricevere i clic: qui si ascoltano solo passaggi, fuoco e strappi.
import * as T from './lib/three.js'
import { profilo, immagine, DOGA } from './materiali.js'

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function fogli(scene, M, avanzamento = () => {}) {
  const { K, W, H } = M
  const manifesto = await fetch('/art/scena/vol.json').then((r) => r.json()).catch(() => ({}))
  const parete = document.querySelector('.parete')
  const elementi = [...parete.querySelectorAll('.it')].filter((el) => el.isConnected && getComputedStyle(el).display !== 'none')
  // l'ordine di sovrapposizione della pagina: z-index (auto = 0) e poi l'ordine nel DOM
  const ordine = elementi.map((el, i) => ({ el, i, z: Number(getComputedStyle(el).zIndex) || 0 })).sort((a, b) => a.z - b.z || a.i - b.i)
  const pezzi = []
  const cache = new Map()
  let chieste = 0, arrivate = 0
  const trama = (src) => {
    if (!cache.has(src)) { chieste++; cache.set(src, immagine(src).catch(() => null).then((t) => { arrivate++; avanzamento(arrivate, chieste); return t })) }
    return cache.get(src)
  }
  // tutte le immagini si chiedono subito, insieme (una alla volta ci vorrebbero secondi); sotto si aspettano dalla cache
  const nomeVol = (el) => slug(el.id || el.querySelector('h3, .titolo')?.textContent || 'foglio')
  for (const el of elementi) {
    if (el.classList.contains('vol')) {
      const d = manifesto[nomeVol(el)]
      if (!d) continue
      trama(`/art/scena/vol/${nomeVol(el)}${d.tagliandi ? '-senza' : ''}.webp`)
      if (d.tagliandi) trama(`/art/scena/vol/${nomeVol(el)}.webp`)
    } else { const img = el.tagName === 'IMG' ? el : el.querySelector('img'); if (img) trama(img.currentSrc || img.src) }
  }

  // un foglio piegato sulle doghe: la geometria è un piano suddiviso, ogni vertice
  // sale di quanto sporge la lamiera nel punto del mondo in cui finisce
  const piega = (g, cx, cy, theta, strato, carta = true) => {
    const p = g.attributes.position, c = Math.cos(theta), s = Math.sin(theta)
    for (let i = 0; i < p.count; i++) {
      const lx = p.getX(i), ly = p.getY(i)
      const wx = cx + lx * c - ly * s, wy = cy + lx * s + ly * c
      p.setZ(i, profilo(H - wy, wx, carta) + strato)
    }
    g.computeVertexNormals()
    return g
  }
  const piano = (w, h, cx, cy, theta, strato, lx = 0, ly = 0, carta = true) => {
    // le righe seguono le doghe con lo stesso passo della lamiera (14 per doga), così la carta non ci affonda dentro
    const g = new T.PlaneGeometry(w, h, Math.max(2, Math.round(w / 0.05)), Math.max(4, Math.ceil(h / (DOGA / 14))))
    g.translate(lx, ly, 0)
    return piega(g, cx, cy, theta, strato, carta)
  }

  for (let n = 0; n < ordine.length; n++) {
    const { el } = ordine[n]
    const sv = (p, d = 0) => { const v = parseFloat(el.style.getPropertyValue(p)); return Number.isFinite(v) ? v : d }
    const x = sv('--x'), y = sv('--y'), w = sv('--w', 100), r = sv('--r')
    // la carta sta sopra la lamiera (0,8 mm e poi uno strato ogni foglio); la vernice dei graffiti sta attaccata al metallo
    const strato = 0.0008 + n * 0.00025
    const cl = el.classList
    const tipo = cl.contains('vol') ? 'vol' : cl.contains('man') ? 'man' : cl.contains('pezzo') ? 'pezzo' : 'graffito'
    let src, pw = w, ph, m = 0, dati = null
    if (tipo === 'vol') {
      const nome = slug(el.id || el.querySelector('h3, .titolo')?.textContent || 'foglio')
      dati = manifesto[nome]
      if (!dati) { console.warn('scena: manca la foto del volantino', nome); continue }
      const f = w / dati.cw / dati.scala // unità per pixel della foto
      pw = dati.w * f; ph = dati.h * f; m = dati.m * f
      src = `/art/scena/vol/${nome}${dati.tagliandi ? '-senza' : ''}.webp`
    } else {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img')
      if (!img) continue
      src = img.currentSrc || img.src
      const iw = Number(img.getAttribute('width')) || img.naturalWidth || 100, ih = Number(img.getAttribute('height')) || img.naturalHeight || 100
      ph = (w * ih) / iw
    }
    const tex = await trama(src)
    if (!tex) continue
    // i tagliandi usano la foto intera (nel foglio la loro fascia è tolta)
    const texPiena = tipo === 'vol' && dati?.tagliandi ? await trama(src.replace('-senza', '')) : tex
    // il centro del foglio nel mondo (la rotazione CSS è attorno al centro dell'elemento, la foto ha il margine attorno)
    const cxU = x - m + pw / 2, cyU = y - m + ph / 2
    const cx = cxU * K, cy = H - cyU * K, theta = -r * Math.PI / 180
    const gruppo = new T.Group()
    gruppo.position.set(cx, cy, 0); gruppo.rotation.z = theta
    const lucido = cl.contains('c-lucido')
    // i graffiti scuri sono vernice che tinge il metallo: si moltiplicano con quello che c'è sotto (come il multiply
    // della pagina), prendendo la luce dalla lamiera, così l'inchiostro resta nero e leggibile; quelli chiari
    // (.chiaro, .bianco: argento, bianco) coprono, e sono materia illuminata come la carta
    const chiaro = cl.contains('chiaro') || cl.contains('bianco')
    let mat
    if (tipo === 'graffito' && !chiaro) {
      mat = new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.03, blending: T.MultiplyBlending, premultipliedAlpha: true, depthWrite: false })
      mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor = vec4( mix( vec3( 1.0 ), diffuseColor.rgb, diffuseColor.a ), 1.0 );') }
    } else mat = lucido
      ? new T.MeshPhysicalMaterial({ map: tex, transparent: true, alphaTest: 0.03, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 })
      : new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.03, roughness: tipo === 'pezzo' ? 0.35 : tipo === 'graffito' ? 0.85 : 0.88, metalness: 0 })
    const mesh = new T.Mesh(piano(pw * K, ph * K, cx, cy, theta, tipo === 'graffito' ? 0.0008 + n * 0.00005 : strato, 0, 0, tipo !== 'graffito'), mat)
    if (tipo === 'graffito') { mat.polygonOffset = true; mat.polygonOffsetFactor = -2; mat.polygonOffsetUnits = -2 }
    mesh.castShadow = tipo === 'vol' || tipo === 'man'; mesh.receiveShadow = true
    mesh.renderOrder = n
    gruppo.add(mesh)
    const pezzo = { el, gruppo, mesh, tipo, alza: 0, meta: 0, tagliandi: [] }

    // i tagliandi: fette della foto, ognuna un foglietto suo
    if (dati?.tagliandi) {
      const f = w / dati.cw / dati.scala
      const bottoni = [...el.querySelectorAll('.tagliandi button')]
      dati.tagliandi.forEach((tg, i) => {
        const b = bottoni[i]
        if (!b) return
        const tw = tg.w * f, th = tg.h * f
        const lx = (tg.x + tg.w / 2) * f - pw / 2, ly = -((tg.y + tg.h / 2) * f - ph / 2)
        const g = piano(tw * K, th * K, cx, cy, theta, strato + 0.0002, lx * K, ly * K)
        const uv = g.attributes.uv
        for (let k = 0; k < uv.count; k++) uv.setXY(k, (tg.x + uv.getX(k) * tg.w) / dati.w, 1 - (tg.y + (1 - uv.getY(k)) * tg.h) / dati.h)
        const mt = new T.MeshStandardMaterial({ map: texPiena, transparent: true, alphaTest: 0.03, roughness: 0.88 })
        const tm = new T.Mesh(g, mt)
        tm.castShadow = true; tm.receiveShadow = true; tm.renderOrder = n + 0.5
        // il perno: il bordo alto del tagliando, da cui si piega quando cade
        const perno = new T.Group()
        perno.position.set(lx * K, (ly + th / 2) * K, 0)
        g.translate(-lx * K, -(ly + th / 2) * K, 0)
        perno.add(tm); gruppo.add(perno)
        const t = { el: b, perno, mesh: tm, mat: mt, stato: 'su', t0: 0 }
        pezzo.tagliandi.push(t)
        const osserva = () => {
          if (b.classList.contains('cade')) { if (t.stato !== 'cade') { t.stato = 'cade'; t.t0 = performance.now() } }
          else if (b.classList.contains('via')) t.stato = 'via'
          else t.stato = 'su'
        }
        new MutationObserver(osserva).observe(b, { attributes: true, attributeFilter: ['class'] })
        osserva()
      })
    }
    // il passaggio del puntatore e il fuoco alzano il foglio (come in pagina)
    const su = () => { pezzo.meta = 1 }, giu = () => { pezzo.meta = 0 }
    const bersaglio = el.closest('.man-link') || el
    bersaglio.addEventListener('pointerenter', su); bersaglio.addEventListener('pointerleave', giu)
    bersaglio.addEventListener('focusin', su); bersaglio.addEventListener('focusout', giu)
    scene.add(gruppo)
    pezzi.push(pezzo)
  }

  // c'è qualcosa che si muove (un foglio che si alza, un tagliando che cade)? serve alle ombre, che se no non si rifanno
  const inMoto = () => pezzi.some((p) => p.meta > 0 || p.alza > 0.0005 || p.tagliandi.some((t) => t.stato === 'cade'))
  const aggiorna = (dt, now) => {
    for (const p of pezzi) {
      // una molla verso l'alzata chiesta
      const k = 1 - Math.exp(-dt * 14)
      p.alza += (p.meta - p.alza) * k
      if (p.alza > 0.0005 || p.gruppo.position.z !== 0) {
        p.gruppo.position.z = 0.022 * p.alza
        p.gruppo.rotation.x = 0.07 * p.alza
        p.gruppo.rotation.y = -0.03 * p.alza
      }
      for (const t of p.tagliandi) {
        if (t.stato === 'su') { t.perno.visible = true; t.perno.rotation.x = 0; t.perno.position.z = 0; t.mat.opacity = 1; continue }
        if (t.stato === 'via') { t.perno.visible = false; continue }
        const u = Math.min(1, (now - t.t0) / 700)
        t.perno.visible = true
        t.perno.rotation.x = -u * u * 1.4
        t.perno.position.z = 0.01 * Math.sin(u * Math.PI)
        t.mat.opacity = 1 - u * u
      }
    }
  }
  return { pezzi, aggiorna, inMoto }
}
