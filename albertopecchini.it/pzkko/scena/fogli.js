// Quello che sta attaccato alla saracinesca, preso dalla pagina: ogni elemento
// .it della parete (volantini, manifesti, graffiti, nastri) diventa un foglio di
// poligoni nel punto esatto in cui sta nel DOM, piegato sulle doghe, con la sua
// immagine sopra. La posizione è quella che la pagina usa in quel momento
// (--px --py --pw --pr: le --x --y --w --r in 1280esimi sul computer, le --mx
// --my --mw --mr in 390esimi sul telefono). I volantini (e le altre cose fatte in
// HTML, .foto) usano le foto fatte da tools/pzkko/scena/cattura.mjs (art/scena/vol/
// per il computer, vol-m/ per il telefono), i tagliandi sono pezzi a sé che cadono
// quando la pagina li strappa, le Live Photo della storia un video sopra la foto.
// Il DOM resta sotto, invisibile, a ricevere i clic: qui si ascoltano solo
// passaggi, fuoco e strappi.
//
// I fogli si costruiscono subito, con una trama vuota (un pixel trasparente):
// le immagini arrivano dopo, in due giri. Prima le anteprime (vol-lo/, 128 px,
// pochi KB: tools/pzkko/scena/anteprime.mjs), ognuna quando arriva, e il foglio
// compare in dissolvenza: la strada si vede subito da lontano, già tutta. Poi le
// foto vere, che prendono il posto delle anteprime mentre la telecamera si
// avvicina (scena.js va con loro). Il programma dei materiali è lo stesso prima e
// dopo (niente ricompilazioni).
// Finita la dissolvenza il foglio diventa opaco: la lamiera sotto non si disegna
// più (i fogli coprono metà saracinesca, e ogni pixel di lamiera costa quanto
// uno di carta).
import * as T from './lib/three.js'
import { immagine, lamiera, DOGA } from './materiali.js'
import { bagnato } from './acqua.js'
import { ascolta, disegna, caratteri, firme } from '../petizione/firme.js'

// La petizione (22.10, index.html #petizione): sopra la foto del foglio, che cattura.mjs fa vuota, le firme vere
// (api/firme.mjs), disegnate da petizione/firme.js come nella pagina, nella tabella dove cattura.mjs l'ha misurata
// (dati.firme, in px della foto); una tela una volta e mezza la foto, ridisegnata quando arrivano firme nuove
const petizione = (t, dati) => {
  const img = t.image, Q = 1.5, w = Math.round(img.width * Q), h = Math.round(img.height * Q), r = dati.firme
  // la foto, copiata una volta e dritta (arriva capovolta per la scheda): la trama si toglie, le firme nuove arrivano dopo
  const foto = document.createElement('canvas')
  foto.width = img.width; foto.height = img.height
  const fc = foto.getContext('2d')
  if (t.flipY === false) { fc.translate(0, img.height); fc.scale(1, -1) }
  fc.drawImage(img, 0, 0)
  const tela = document.createElement('canvas')
  tela.width = w; tela.height = h
  const ctx = tela.getContext('2d')
  const ct = new T.CanvasTexture(tela)
  ct.colorSpace = T.SRGBColorSpace; ct.anisotropy = 8
  const ridisegna = (s) => {
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(foto, 0, 0, w, h)
    const ultime = s.firme.slice(-r.righe)
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    disegna(ctx, ultime, { x: r.x * Q, y: r.y * Q, w: r.w * Q, h: r.h * Q, righe: r.righe, primo: s.totale - ultime.length + 1 })
    ctx.restore()
    ct.needsUpdate = true
  }
  ridisegna(firme())
  caratteri().then(() => ascolta(ridisegna))
  return ct
}

// Il wallet e il cercapersone sul muro (26.10, index.html #wallet-muro e #cercapersone-muro, .vivo): non hanno una foto,
// sono vivi. La trama è una tela che ricopia il pezzo della pagina dieci volte al secondo: le sue immagini (la foto, le viti,
// il chiodo), i canvas accesi (i led del saldo, la chiocciolina) e i riquadri colorati (lo schermo lcd, il led rosso), ognuno
// dove sta dentro il pezzo (gli strati del tubo catodico no). Nella pagina il pezzo resta sopra, trasparente, per i clic
const viva = (el) => {
  const base = el.querySelector('img'), W = 768, H = Math.round((W * Number(base.getAttribute('height'))) / Number(base.getAttribute('width')))
  const tela = document.createElement('canvas')
  tela.width = W; tela.height = H
  const ctx = tela.getContext('2d'), ct = new T.CanvasTexture(tela)
  ct.colorSpace = T.SRGBColorSpace; ct.anisotropy = 8
  const dove = (e) => { let x = 0, y = 0; for (let n = e; n && n !== el; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop } return [x, y] }
  const ridisegna = () => {
    if (!el.offsetWidth) return
    const kx = W / el.offsetWidth, ky = H / el.offsetHeight
    ctx.clearRect(0, 0, W, H)
    for (const e of el.querySelectorAll('*')) {
      if (/(^|\s)crt-/.test(e.className?.baseVal ?? e.className ?? '') || !e.offsetWidth) continue // (lo schermo, .crt, sì: il suo verde è il fondo)
      const cs = getComputedStyle(e)
      if (cs.display === 'none') continue
      const [x, y] = dove(e), w = e.offsetWidth * kx, h = e.offsetHeight * ky, X = x * kx, Y = y * ky
      ctx.globalAlpha = Number(cs.opacity) || 0
      const fondo = cs.backgroundColor
      if (fondo && fondo !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(fondo)) {
        ctx.fillStyle = fondo
        if (cs.borderRadius.startsWith('50%')) { ctx.beginPath(); ctx.ellipse(X + w / 2, Y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill() } else ctx.fillRect(X, Y, w, h)
      }
      if ((e.tagName === 'IMG' && e.complete && e.naturalWidth) || e.tagName === 'CANVAS') try { ctx.drawImage(e, X, Y, w, h) } catch {}
    }
    ctx.globalAlpha = 1
    ct.needsUpdate = true
  }
  ridisegna()
  setInterval(ridisegna, 100)
  return ct
}

// (il nome della foto di un volantino: anche prossima.js, per scaricare quelle dell'altra pagina)
export const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
  const cartella = telefono ? 'vol-m' : 'vol', cartellaLo = cartella + '-lo'
  const manifesto = await fetch(`/art/scena/${cartella}.json`).then((r) => r.json()).catch(() => ({}))
  const parete = document.querySelector('.parete')
  const elementi = [...parete.querySelectorAll('.it')].filter((el) => el.isConnected && getComputedStyle(el).display !== 'none')
  // l'ordine di sovrapposizione della pagina: z-index (auto = 0) e poi l'ordine nel DOM
  const ordine = elementi.map((el, i) => ({ el, i, z: Number(getComputedStyle(el).zIndex) || 0 })).sort((a, b) => a.z - b.z || a.i - b.i)
  const pezzi = []
  const cache = new Map()
  const trama = (src) => { if (!cache.has(src)) cache.set(src, immagine(src).catch(() => null)); return cache.get(src) }
  // quando l'immagine arriva, fatto(trama); tutte le richieste partono subito, insieme (le anteprime prima, nell'ordine).
  // Le immagini arrivate si caricano nella scheda (initTexture) e si mettono sui fogli a tempo, fino a 4 ms per
  // fotogramma (aggiorna): caricarne venti nello stesso fotogramma lo allunga. Per giro: quante sono a bordo (o non
  // sono arrivate e non arriveranno), e la promessa che si chiude quando ci sono tutte (anteprime, pronti, in fondo)
  const coda = []
  const giri = { lo: { n: 0, a: 0, ok: null }, piene: { n: 0, a: 0, ok: null } }
  // (le vere si chiedono solo quando le anteprime sono a bordo: chieste insieme gli rubavano la banda, e la strada
  // ci metteva di più a farsi vedere)
  const dopo = []
  const quando = (src, fatto, giro = 'piene') => {
    const g = giri[giro]
    g.n++
    const chiedi = () => trama(src).then((t) => { if (t) coda.push(() => { renderer.initTexture(t); fatto(t); g.a++ }); else g.a++ })
    if (giro === 'piene') dopo.push(chiedi); else chiedi()
  }

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
    // fotografati da cattura.mjs: i volantini e le altre cose fatte in HTML (.foto: le scritte sprayate della storia);
    // il resto sono le immagini della pagina
    const foto = tipo === 'vol' || cl.contains('foto')
    let src, srcPiena = null, pw = w, ph, m = 0, dati = null
    if (foto) {
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
    // (la carta lucida, le foto stampate della storia e i poster lucidi degli altri; il cartello di rivalta è di lamiera
    // smaltata: lucido anche lui, un filo di metallo)
    const suono = el.dataset.suono
    const lucido = cl.contains('c-lucido') || cl.contains('stampa') || suono === 'lucida' || suono === 'cartello'
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
        ? new T.MeshPhysicalMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, roughness: suono === 'cartello' ? 0.26 : 0.32, metalness: suono === 'cartello' ? 0.12 : 0, clearcoat: suono === 'cartello' ? 0.85 : 0.6, clearcoatRoughness: suono === 'cartello' ? 0.12 : 0.25 })
        : new T.MeshStandardMaterial({ map: vuota, transparent: true, opacity: 0, alphaTest: 0.03, roughness: tipo === 'pezzo' ? 0.35 : tipo === 'graffito' ? 0.85 : suono === 'legno' ? 0.93 : 0.88, metalness: 0 })
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
    const pezzo = { el, gruppo, mesh, tipo, opaco: tipo !== 'graffito', alza: 0, meta: 0, tagliandi: [], live: null, arrivo: 0, arrivoT: 0,
      cx, cy, theta, hw: ((pw - 2 * m) * K) / 2, hh: ((ph - 2 * m) * K) / 2, strato }
    // l'anteprima (se c'è: solo i volantini, le altre immagini sono quelle della pagina, già scaricate) e poi la vera;
    // se la vera arriva prima, l'anteprima non la sostituisce
    let vera = false
    if (foto) quando(src.replace(`/${cartella}/`, `/${cartellaLo}/`), (t) => { if (vera) return; mat.map = t; if (!pezzo.arrivo) pezzo.arrivo = performance.now() }, 'lo')
    // (l'anteprima, sostituita, si toglie dalla scheda)
    const sostituisci = (vecchia, t) => { if (vecchia && vecchia !== vuota && vecchia !== t) vecchia.dispose() }
    // (la petizione: la foto vera diventa la tela con le firme sopra, e la foto si toglie dalla scheda)
    const firmato = foto && el.id === 'petizione' && dati?.firme
    // (i pezzi vivi: la tela che ricopia la pagina, subito; un filo di luce sua, perché i led e lo schermo si vedano anche di sera)
    if (cl.contains('vivo')) { mat.map = viva(el); mat.emissiveMap = mat.map; mat.emissive = new T.Color(0xffffff); mat.emissiveIntensity = 0.3; pezzo.arrivo = performance.now() }
    else quando(src, (t) => { vera = true; const tt = firmato ? petizione(t, dati) : t; sostituisci(mat.map, tt); mat.map = tt; if (tt !== t) t.dispose(); if (!pezzo.arrivo) pezzo.arrivo = performance.now() }, foto ? 'piene' : 'lo')
    // mentre il foglio si è avvicinato per firmare (petizione.js) qui non c'è: torna quando torna lui
    if (el.id === 'petizione') document.addEventListener('pzkko-petizione', (ev) => {
      const fase = ev.detail?.fase
      if (fase === 'apre') gruppo.visible = false
      else if (fase === 'chiusa') gruppo.visible = true
    })

    // la Live Photo (le stampe della storia): il video della pagina, steso sopra la foto dove cattura.mjs l'ha misurata.
    // Si vede quando la pagina lo fa partire (.va sulla stampa: il passaggio, il dito, il tasto LIVE) e sfuma come lì;
    // finito, torna la foto. Una trama normale col video dentro, ricaricata a ogni fotogramma mentre va: lo stesso
    // materiale dei tagliandi, quindi lo stesso programma
    const video = dati?.live && el.querySelector('video')
    if (video) {
      const f = w / dati.cw / dati.scala, lv = dati.live
      const lx = (lv.x + lv.w / 2) * f - pw / 2, ly = -((lv.y + lv.h / 2) * f - ph / 2)
      const t = new T.Texture(video)
      t.colorSpace = T.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = T.LinearFilter
      const mv = new T.MeshStandardMaterial({ map: t, transparent: true, opacity: 0, alphaTest: 0.03, roughness: 0.88 })
      mv.onBeforeCompile = nitida
      bagnato(mv, 2)
      const vm = new T.Mesh(piano(lv.w * f * K, lv.h * f * K, cx, cy, theta, strato + 0.0002, lx * K, ly * K), mv)
      vm.receiveShadow = true; vm.renderOrder = n + 0.5; vm.visible = false
      gruppo.add(vm)
      pezzo.live = { el, video, t, mesh: vm, mat: mv, v: 0 }
    }

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
      let veraT = false
      quando(srcPiena.replace(`/${cartella}/`, `/${cartellaLo}/`), (t) => { if (veraT) return; for (const tg of pezzo.tagliandi) tg.mat.map = t; if (!pezzo.arrivoT) pezzo.arrivoT = performance.now() }, 'lo')
      quando(srcPiena, (t) => { veraT = true; sostituisci(pezzo.tagliandi[0]?.mat.map, t); for (const tg of pezzo.tagliandi) tg.mat.map = t; if (!pezzo.arrivoT) pezzo.arrivoT = performance.now() })
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
    for (const g of Object.values(giri)) if (g.ok && g.a >= g.n) { g.ok(); g.ok = null; if (g === giri.lo) for (const c of dopo.splice(0)) c() }
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
      // la Live Photo: entra e esce in ~0,35 s come nella pagina, e la trama si ricarica solo mentre il video va
      const lv = p.live
      if (lv) {
        const va = lv.el.classList.contains('va') && lv.video.readyState >= 2
        lv.v += ((va ? 1 : 0) - lv.v) * (1 - Math.exp(-dt / 0.12))
        if (!va && lv.v < 0.01) lv.v = 0
        lv.mat.opacity = Math.min(fa, lv.v)
        lv.mesh.visible = lv.mat.opacity > 0
        if (lv.mesh.visible && !lv.video.paused) lv.t.needsUpdate = true
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
  // (le promesse dopo i fogli: prima `giri` non sa ancora quante immagini aspettare)
  const anteprime = new Promise((r) => { giri.lo.ok = r }), pronti = new Promise((r) => { giri.piene.ok = r })
  // avanzamento: quanta della risoluzione piena è a bordo (0..1); anteprima: quanto delle anteprime
  return { pezzi, aggiorna, inMoto, pronti, anteprime, avanzamento: () => (giri.piene.n ? giri.piene.a / giri.piene.n : 1), anteprima: () => (giri.lo.n ? giri.lo.a / giri.lo.n : 1), lam, superficie }
}
