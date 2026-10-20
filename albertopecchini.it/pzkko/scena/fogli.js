// Quello che sta attaccato alla saracinesca, preso dalla pagina: ogni elemento
// .it della parete (volantini, manifesti, graffiti, nastri) diventa un foglio di
// poligoni nel punto esatto in cui sta nel DOM, piegato sulle doghe, con la sua
// immagine sopra. La posizione è quella che la pagina usa in quel momento
// (--px --py --pw --pr: le --x --y --w --r in 1280esimi sul computer, le --mx
// --my --mw --mr in 390esimi sul telefono). I volantini usano le foto fatte da
// tools/pzkko/scena/cattura.mjs (art/scena/vol/ per il computer, vol-m/ per il
// telefono), i tagliandi sono pezzi a sé che cadono quando la pagina li strappa.
// Il DOM resta sotto, invisibile, a ricevere i clic: qui si ascoltano solo
// passaggi, fuoco e strappi.
//
// I fogli si costruiscono subito, con una trama vuota (un pixel trasparente):
// le immagini arrivano dopo, ognuna quando arriva, e il foglio compare in
// dissolvenza. Così la scena si può già guardare da lontano mentre si scarica,
// e il programma dei materiali è lo stesso prima e dopo (niente ricompilazioni).
// Finita la dissolvenza il foglio diventa opaco: la lamiera sotto non si disegna
// più (i fogli coprono metà saracinesca, e ogni pixel di lamiera costa quanto
// uno di carta).
import * as T from './lib/three.js'
import { immagine, lamiera, DOGA } from './materiali.js'
import { bagnato } from './acqua.js'

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const DISSOLVENZA = 450 // ms

// La nitidezza: i fogli si vedono rimpiccioliti (sul computer ~2,8 pixel di foto per pixel di schermo) e la scheda li
// legge da un livello di mipmap che li sfoca; si legge mezzo livello più in qua (il terzo argomento di texture2D, il
// «bias»), così il testo resta netto senza tremolare. Fuori dalla foto niente (i graffiti stanno su un pezzo di lamiera
// più grande di loro, sotto). Una funzione sola per tutti i fogli: entra nella chiave del programma
const nitida = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\n if ( vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0 ) discard;\n diffuseColor *= texture2D( map, vMapUv, -0.6 );\n#endif')
}
// i graffiti scuri: nitidi, e moltiplicati col metallo (sotto, in fogli)
const nitidaMoltiplica = (sh) => {
  nitida(sh)
  sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n gl_FragColor = vec4( mix( vec3( 1.0 ), diffuseColor.rgb, diffuseColor.a ), 1.0 );')
}

const vuota = (() => {
  const t = new T.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
  t.colorSpace = T.SRGBColorSpace
  t.needsUpdate = true
  return t
})()

export async function fogli(scene, M, renderer) {
  const { K, H, telefono } = M
  const cartella = telefono ? 'vol-m' : 'vol'
  const manifesto = await fetch(`/art/scena/${cartella}.json`).then((r) => r.json()).catch(() => ({}))
  const parete = document.querySelector('.parete')
  const elementi = [...parete.querySelectorAll('.it')].filter((el) => el.isConnected && getComputedStyle(el).display !== 'none')
  // l'ordine di sovrapposizione della pagina: z-index (auto = 0) e poi l'ordine nel DOM
  const ordine = elementi.map((el, i) => ({ el, i, z: Number(getComputedStyle(el).zIndex) || 0 })).sort((a, b) => a.z - b.z || a.i - b.i)
  const pezzi = []
  const cache = new Map()
  const attese = []
  const trama = (src) => { if (!cache.has(src)) cache.set(src, immagine(src).catch(() => null)); return cache.get(src) }
  // quando l'immagine arriva, fatto(trama); tutte le richieste partono subito, insieme. Le immagini arrivate si caricano
  // nella scheda (initTexture) e si mettono sui fogli a tempo, fino a 4 ms per fotogramma (aggiorna): caricarne
  // venti nello stesso fotogramma lo allunga. `pronti` si chiude quando sono tutte a bordo della scheda, non solo scaricate
  const coda = []
  // (caricate: quante sono a bordo, o non sono arrivate e non arriveranno; serve alla barra di caricamento)
  let caricate = 0
  const quando = (src, fatto) => attese.push(trama(src).then((t) => { if (t) coda.push(() => { renderer.initTexture(t); fatto(t); caricate++ }); else caricate++ }))
  let scaricate = false, finito = null
  const pronti = Promise.all(attese).then(() => { scaricate = true; return new Promise((r) => { finito = r }) })

  // la lamiera sotto: la stessa griglia di mondo.js, con le doghe contate dallo stesso giunto
  const lam = lamiera(M.W, H)
  // un foglio piegato sulle doghe: la geometria è un piano suddiviso, ogni vertice
  // sale di quanto sporge la lamiera nel punto del mondo in cui finisce
  const piega = (g, cx, cy, theta, strato) => {
    const p = g.attributes.position, c = Math.cos(theta), s = Math.sin(theta)
    for (let i = 0; i < p.count; i++) {
      const lx = p.getX(i), ly = p.getY(i)
      const wx = cx + lx * c - ly * s, wy = cy + lx * s + ly * c
      p.setZ(i, lam.prof(wx, wy, true) + strato)
    }
    g.computeVertexNormals()
    return g
  }
  const piano = (w, h, cx, cy, theta, strato, lx = 0, ly = 0) => {
    // sei righe per doga (2 cm): la bombatura è concava, quindi la lamiera fra le sue righe sta sotto la curva e la carta,
    // 0,8 mm sopra, fra le sue resta sopra la lamiera (al peggio 0,3 mm di margine; la carta non entra nel canale del
    // giunto); in larghezza la piega è solo l'ammaccatura, larga un metro: una colonna ogni 12 cm basta
    const g = new T.PlaneGeometry(w, h, Math.max(1, Math.round(w / 0.12)), Math.max(3, Math.ceil(h / (DOGA / 6))))
    g.translate(lx, ly, 0)
    return piega(g, cx, cy, theta, strato)
  }
  // un graffito: vernice sulla lamiera, quindi sugli stessi triangoli (le righe e le colonne della lamiera dentro il
  // rettangolo che lo contiene, più i bordi), dz sopra; la foto si stende in coordinate del mondo, ruotata, e fuori da
  // lei non si disegna niente (nitida). Niente polygonOffset: negli specchi, con la loro proiezione obliqua, tirava i
  // graffiti davanti ai manifesti
  const vernice = (w, h, cx, cy, theta, dz) => {
    const c = Math.cos(theta), s = Math.sin(theta)
    const ang = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [cx + (a * w * c - b * h * s) / 2, cy + (a * w * s + b * h * c) / 2])
    const xa = Math.min(...ang.map((p) => p[0])), xb = Math.max(...ang.map((p) => p[0]))
    const ya = Math.min(...ang.map((p) => p[1])), yb = Math.max(...ang.map((p) => p[1]))
    const xs = [xa, ...lam.xs.filter((x) => x > xa && x < xb), xb], ys = [yb, ...lam.ys.filter((y) => y < yb && y > ya), ya]
    const pos = [], uv = [], idx = [], n = xs.length
    for (const y of ys) for (const x of xs) {
      const dx = x - cx, dy = y - cy
      pos.push(dx, dy, lam.z(x, y) + dz)
      uv.push((dx * c + dy * s) / w + 0.5, (dy * c - dx * s) / h + 0.5)
    }
    for (let j = 0; j < ys.length - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = j * n + i
      idx.push(a, a + n, a + 1, a + 1, a + n, a + n + 1)
    }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
    g.setIndex(idx); g.computeVertexNormals()
    return g
  }

  for (let n = 0; n < ordine.length; n++) {
    const { el } = ordine[n]
    // (data-scena="no": solo per il muro di sempre; il rivolo disegnato, qui c'è l'acqua vera di acqua.js)
    if (el.dataset.scena === 'no') continue
    // la posizione che la pagina sta usando adesso (computer o telefono), già risolta dal CSS
    const cs = getComputedStyle(el)
    const v = (p, d = 0) => { const x = parseFloat(cs.getPropertyValue(p)); return Number.isFinite(x) ? x : d }
    const x = v('--px'), y = v('--py'), w = v('--pw', 100), r = v('--pr')
    // la carta sta sopra la lamiera (0,8 mm e poi uno strato ogni foglio); la vernice dei graffiti sta attaccata al metallo
    const strato = 0.0008 + n * 0.00025
    const cl = el.classList
    const tipo = cl.contains('vol') ? 'vol' : cl.contains('man') ? 'man' : cl.contains('pezzo') ? 'pezzo' : 'graffito'
    let src, srcPiena = null, pw = w, ph, m = 0, dati = null
    if (tipo === 'vol') {
      const nome = slug(el.id || el.querySelector('h3, .titolo')?.textContent || 'foglio')
      dati = manifesto[nome]
      if (!dati) { console.warn('scena: manca la foto del volantino', nome); continue }
      const f = w / dati.cw / dati.scala // unità per pixel della foto
      pw = dati.w * f; ph = dati.h * f; m = dati.m * f
      src = `/art/scena/${cartella}/${nome}${dati.tagliandi ? '-senza' : ''}.webp`
      // i tagliandi usano la foto intera (nel foglio la loro fascia è tolta)
      if (dati.tagliandi) srcPiena = `/art/scena/${cartella}/${nome}.webp`
    } else {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img')
      if (!img) continue
      src = img.currentSrc || img.src
      const iw = Number(img.getAttribute('width')) || img.naturalWidth || 100, ih = Number(img.getAttribute('height')) || img.naturalHeight || 100
      ph = (w * ih) / iw
    }
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
      mat = new T.MeshBasicMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, blending: T.MultiplyBlending, premultipliedAlpha: true, depthWrite: false })
      mat.onBeforeCompile = nitidaMoltiplica
    } else {
      mat = lucido
        ? new T.MeshPhysicalMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 })
        : new T.MeshStandardMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, roughness: tipo === 'pezzo' ? 0.35 : tipo === 'graffito' ? 0.85 : 0.88, metalness: 0 })
      mat.onBeforeCompile = nitida
      // (dove passa il rivolo la carta si bagna: più scura, lucida; acqua.js)
      bagnato(mat, 2)
    }
    // (la vernice non ruota col gruppo: sta sulla griglia della lamiera, che è dritta)
    if (tipo === 'graffito') gruppo.rotation.z = 0
    const mesh = new T.Mesh(tipo === 'graffito' ? vernice(pw * K, ph * K, cx, cy, theta, 0.0001 + n * 0.00002) : piano(pw * K, ph * K, cx, cy, theta, strato), mat)
    mesh.castShadow = tipo === 'vol' || tipo === 'man'; mesh.receiveShadow = true
    mesh.renderOrder = n
    gruppo.add(mesh)
    // la carta (non i graffiti, che si moltiplicano col metallo) diventa opaca finita la dissolvenza; cx, cy, theta, mezza
    // larghezza e mezza altezza della carta vera (senza il margine della foto) e lo strato servono a superficie, sotto
    const pezzo = { el, gruppo, mesh, tipo, opaco: tipo !== 'graffito', alza: 0, meta: 0, tagliandi: [], arrivo: 0, arrivoT: 0,
      cx, cy, theta, hw: ((pw - 2 * m) * K) / 2, hh: ((ph - 2 * m) * K) / 2, strato }
    quando(src, (t) => { mat.map = t; pezzo.arrivo = performance.now() })

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
        const mt = new T.MeshStandardMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, roughness: 0.88 })
        mt.onBeforeCompile = nitida
        bagnato(mt, 2)
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
      quando(srcPiena, (t) => { for (const tg of pezzo.tagliandi) tg.mat.map = t; pezzo.arrivoT = performance.now() })
    }
    // il passaggio del puntatore e il fuoco alzano il foglio (come in pagina); la vernice resta sul muro
    if (tipo !== 'graffito') {
      const su = () => { pezzo.meta = 1 }, giu = () => { pezzo.meta = 0 }
      const bersaglio = el.closest('.man-link') || el
      bersaglio.addEventListener('pointerenter', su); bersaglio.addEventListener('pointerleave', giu)
      bersaglio.addEventListener('focusin', su); bersaglio.addEventListener('focusout', giu)
    }
    scene.add(gruppo)
    pezzi.push(pezzo)
  }

  // La superficie, per le bestie e le gocce che ci camminano sopra: in ogni punto della saracinesca, quanto sta in fuori
  // (z) e cosa c'è (il foglio più in alto, o la lamiera). Una griglia di 1 cm dice il foglio più in alto (i pezzi sono
  // già nell'ordine di sovrapposizione: l'ultimo che copre una cella vince); la z è quella della carta, più lo strato e
  // quanto il foglio è alzato in quel momento (la molla del passaggio del puntatore: alzato e un po' inclinato)
  const CELLA = 0.01, gx = Math.ceil((M.W + 0.04) / CELLA), gy = Math.ceil((H + 0.04) / CELLA)
  const sopra = new Int16Array(gx * gy).fill(-1)
  pezzi.forEach((p, k) => {
    if (p.tipo === 'graffito') return
    const c = Math.cos(p.theta), s = Math.sin(p.theta), ex = Math.abs(p.hw * c) + Math.abs(p.hh * s), ey = Math.abs(p.hw * s) + Math.abs(p.hh * c)
    for (let j = Math.max(0, Math.floor((p.cy - ey + 0.02) / CELLA)); j <= Math.min(gy - 1, Math.floor((p.cy + ey + 0.02) / CELLA)); j++) {
      for (let i = Math.max(0, Math.floor((p.cx - ex + 0.02) / CELLA)); i <= Math.min(gx - 1, Math.floor((p.cx + ex + 0.02) / CELLA)); i++) {
        const dx = (i + 0.5) * CELLA - 0.02 - p.cx, dy = (j + 0.5) * CELLA - 0.02 - p.cy
        if (Math.abs(dx * c + dy * s) < p.hw && Math.abs(dy * c - dx * s) < p.hh) sopra[j * gx + i] = k
      }
    }
  })
  const superficie = (x, y) => {
    const i = Math.floor((x + 0.02) / CELLA), j = Math.floor((y + 0.02) / CELLA)
    const k = i >= 0 && i < gx && j >= 0 && j < gy ? sopra[j * gx + i] : -1
    if (k < 0) return { z: lam.z(x, y), pezzo: null }
    const p = pezzi[k], g = p.gruppo
    return { z: lam.prof(x, y, true) + p.strato + g.position.z + (y - p.cy) * g.rotation.x - (x - p.cx) * g.rotation.y, pezzo: p }
  }

  const comparsa = (t0, now) => (t0 ? Math.min(1, (now - t0) / DISSOLVENZA) : 0)
  // c'è qualcosa che si muove (un foglio che si alza o compare, un tagliando che cade)? serve alle ombre e agli specchi, che se no non si rifanno
  const inMoto = (now) => coda.length > 0 || pezzi.some((p) => p.meta > 0 || p.alza > 0.0005 || (p.arrivo && now - p.arrivo < DISSOLVENZA + 50) || p.tagliandi.some((t) => t.stato === 'cade'))
  const aggiorna = (dt, now) => {
    if (coda.length) { const a = performance.now(); do coda.shift()(); while (coda.length && performance.now() - a < 4) }
    else if (scaricate && finito) { finito(); finito = null }
    for (const p of pezzi) {
      const fa = comparsa(p.arrivo, now)
      if (p.mesh.material.opacity !== fa) p.mesh.material.opacity = fa
      // comparso del tutto: opaco (con l'alphaTest il contorno resta), e disegnato prima della lamiera, che sotto di lui
      // non si calcola più (il test di profondità la scarta prima dell'ombreggiatura)
      if (fa === 1 && p.opaco && p.mesh.material.transparent) { p.mesh.material.transparent = false; p.mesh.renderOrder = -1 }
      // una molla verso l'alzata chiesta
      const k = 1 - Math.exp(-dt * 14)
      p.alza += (p.meta - p.alza) * k
      if (p.alza > 0.0005 || p.gruppo.position.z !== 0) {
        p.gruppo.position.z = 0.022 * p.alza
        p.gruppo.rotation.x = 0.07 * p.alza
        p.gruppo.rotation.y = -0.03 * p.alza
      }
      const ft = comparsa(p.arrivoT, now)
      for (const t of p.tagliandi) {
        if (t.stato === 'su') { t.perno.visible = true; t.perno.rotation.x = 0; t.perno.position.z = 0; t.mat.opacity = ft; continue }
        if (t.stato === 'via') { t.perno.visible = false; continue }
        const u = Math.min(1, (now - t.t0) / 700)
        t.perno.visible = true
        t.perno.rotation.x = -u * u * 1.4
        t.perno.position.z = 0.01 * Math.sin(u * Math.PI)
        t.mat.opacity = ft * (1 - u * u)
      }
    }
  }
  return { pezzi, aggiorna, inMoto, pronti, avanzamento: () => (attese.length ? caricate / attese.length : 1), lam, superficie }
}
