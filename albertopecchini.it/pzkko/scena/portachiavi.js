// Il portachiavi della banca $pzk, perso per terra davanti al chiusino di pzkkonet: il token delle password usa e getta,
// quello che le banche danno ai clienti, stondato e da tasca, con l'anello e due chiavi. Il display a led verdi dice
// quanti fotogrammi al secondo fa la scena (scena.js glieli passa due volte al secondo); il tasto giallo accanto accende
// e spegne la luce: si preme col mouse o col dito (scena.js guarda dove tocca il raggio del puntatore), si abbassa e torna
// su, e la luce si accende o si spegne. A luce spenta le cifre restano, scure, senza bagliore. Com'era resta nel browser
// (localStorage pzkko-portachiavi); la regia lo comanda anche lei.
// È un po' più grande di quelli veri (9 cm invece di 6,5) e sta appoggiato sulle chiavi, il bordo di dietro alzato: dalla
// telecamera, che in fondo alla pagina sta a mezzo metro da terra, il numero si legge anche se è per terra. Sul livello 1,
// come la roba per terra (spazzatura.js): gli specchi non lo vedono.
import * as T from './lib/three.js'
import { tela } from './materiali.js'
import { TOMBINO } from './spazzatura.js'

const mm = (x) => x / 1000
// il corpo: il profilo (senza la smussatura, che lo allarga di BS tutto intorno) e lo spessore
const L0 = mm(83), W0 = mm(39), R0 = mm(13), BS = mm(3.5), SP = mm(13)
// dove stanno le cose sulla faccia, in mm dal centro (x lungo il corpo, y verso il bordo di dietro)
const BUCO = { x: -34, y: 0, r: 6.5 }, DISPLAY = { x: -5, y: 5, l: 38, a: 20 }, TASTO = { x: 28, y: 2, r: 7.5 }
const CHIAVE = 'pzkko-portachiavi'

// sette segmenti: quali si accendono per ogni cifra
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' }
// un segmento: un esagono allungato da (x1, y1) a (x2, y2), spesso t
const segmento = (g, x1, y1, x2, y2, t) => {
  const l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l, nx = (-uy * t) / 2, ny = (ux * t) / 2, a = t / 2
  g.beginPath()
  g.moveTo(x1, y1); g.lineTo(x1 + ux * a + nx, y1 + uy * a + ny); g.lineTo(x2 - ux * a + nx, y2 - uy * a + ny)
  g.lineTo(x2, y2); g.lineTo(x2 - ux * a - nx, y2 - uy * a - ny); g.lineTo(x1 + ux * a - nx, y1 + uy * a - ny)
  g.closePath(); g.fill()
}
// una cifra in (x, y), larga w e alta h, un po' in corsivo come quelle dei display veri; accesi = i segmenti che fanno luce
const cifra = (g, x, y, w, h, t, accesi, acceso, spento) => {
  const k = 0.1, gap = t * 0.18
  const p = (px, py) => [x + px + k * (h - py), y + py]
  const pt = { tl: p(0, 0), tr: p(w, 0), ml: p(0, h / 2), mr: p(w, h / 2), bl: p(0, h), br: p(w, h) }
  const s = { a: ['tl', 'tr'], b: ['tr', 'mr'], c: ['mr', 'br'], d: ['bl', 'br'], e: ['ml', 'bl'], f: ['tl', 'ml'], g: ['ml', 'mr'] }
  for (const [n, [da, a]] of Object.entries(s)) {
    const [x1, y1] = pt[da], [x2, y2] = pt[a], l = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / l, uy = (y2 - y1) / l
    g.fillStyle = accesi.includes(n) ? acceso : spento
    segmento(g, x1 + ux * gap, y1 + uy * gap, x2 - ux * gap, y2 - uy * gap, t)
  }
}

const caricaImmagine = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src })
const trama = (c) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t }

export async function portachiavi(scene, M) {
  // i caratteri del sito per le scritte stampate (Anton c'è già, la pagina lo precarica); il logo della banca è la fiche
  // gialla da 500 dei giochi
  const [, fiche] = await Promise.all([
    Promise.race([document.fonts?.load('80px Anton').catch(() => {}), new Promise((r) => setTimeout(r, 1500))]),
    caricaImmagine('/art/fiches/f500.webp'),
  ])

  // ── la faccia stampata: la plastica grafite, la cornice del display, «banca $pzk», l'anello giallo del tasto ──
  const FW = 1024, FH = Math.round((FW * W0) / L0), fc = tela(FW, FH), g = fc.getContext('2d')
  const px = (x) => FW / 2 + (x / 1000 / L0) * FW, py = (y) => FH / 2 - (y / 1000 / W0) * FH, pm = FW / (L0 * 1000)
  g.fillStyle = '#1f2225'; g.fillRect(0, 0, FW, FH)
  // la grana della plastica e qualche graffio (è stato in tasca e poi per terra)
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${0.03 + Math.random() * 0.04})`; g.fillRect(Math.random() * FW, Math.random() * FH, 2, 2) }
  g.lineCap = 'round'
  for (let i = 0; i < 14; i++) {
    const x = Math.random() * FW, y = Math.random() * FH, a = Math.random() * Math.PI, l = 20 + Math.random() * 90
    g.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.08})`; g.lineWidth = 1 + Math.random()
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke()
  }
  // la cornice nera lucida del display
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
  rr(px(DISPLAY.x - DISPLAY.l / 2 - 2.2), py(DISPLAY.y + DISPLAY.a / 2 + 2.2), (DISPLAY.l + 4.4) * pm, (DISPLAY.a + 4.4) * pm, 3.2 * pm)
  g.fillStyle = '#0b0c0d'; g.fill()
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 3; g.stroke()
  // l'anello giallo intorno al tasto e «luce» sotto
  g.beginPath(); g.arc(px(TASTO.x), py(TASTO.y), (TASTO.r + 2.2) * pm, 0, Math.PI * 2); g.fillStyle = '#ffd400'; g.fill()
  g.beginPath(); g.arc(px(TASTO.x), py(TASTO.y), (TASTO.r + 0.6) * pm, 0, Math.PI * 2); g.fillStyle = '#121314'; g.fill()
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'
  g.fillStyle = '#9aa0a6'; g.font = `${3.4 * pm}px Anton, Impact, sans-serif`
  g.fillText('luce', px(TASTO.x), py(TASTO.y - TASTO.r - 6.2))
  // la banca: la fiche da 500 e il nome, sotto il display
  const ly = DISPLAY.y - DISPLAY.a / 2 - 8.6
  if (fiche) g.drawImage(fiche, px(DISPLAY.x - DISPLAY.l / 2 + 0.2), py(ly + 4.4), 8.4 * pm, 8.4 * pm)
  g.textAlign = 'left'; g.fillStyle = '#ffd400'; g.font = `${6.4 * pm}px Anton, Impact, sans-serif`
  g.fillText('banca $pzk', px(DISPLAY.x - DISPLAY.l / 2 + 10.4), py(ly - 2.3))
  g.font = `${6.4 * pm}px Anton, Impact, sans-serif`; g.textAlign = 'right'
  g.fillText('fps', px(DISPLAY.x + DISPLAY.l / 2 + 1.5), py(ly - 2.3))
  const faccia = trama(fc)
  // (le facce del corpo hanno uv = coordinate del profilo, in metri: la tela copre il profilo dal centro)
  faccia.repeat.set(1 / L0, 1 / W0); faccia.offset.set(0.5, 0.5); faccia.wrapS = faccia.wrapT = T.ClampToEdgeWrapping

  // ── il corpo: il profilo stondato col buco dell'anello, estruso con una smussatura grande (da sasso di fiume) ──
  const s = new T.Shape(), a = L0 / 2, b = W0 / 2
  s.moveTo(-a + R0, -b); s.lineTo(a - R0, -b); s.quadraticCurveTo(a, -b, a, -b + R0); s.lineTo(a, b - R0); s.quadraticCurveTo(a, b, a - R0, b)
  s.lineTo(-a + R0, b); s.quadraticCurveTo(-a, b, -a, b - R0); s.lineTo(-a, -b + R0); s.quadraticCurveTo(-a, -b, -a + R0, -b)
  const buco = new T.Path(); buco.absarc(mm(BUCO.x), mm(BUCO.y), mm(BUCO.r), 0, Math.PI * 2, true); s.holes.push(buco)
  const geo = new T.ExtrudeGeometry(s, { depth: SP - 2 * BS, bevelEnabled: true, bevelThickness: BS, bevelSize: BS, bevelSegments: 5, curveSegments: 20 })
  // (estruso lungo z: si corica, la faccia in su; il bordo di dietro, y del profilo, va verso il muro, -z)
  geo.rotateX(-Math.PI / 2); geo.translate(0, BS, 0)
  const plastica = new T.MeshStandardMaterial({ color: 0x24272a, roughness: 0.42, metalness: 0.05 })
  const corpo = new T.Mesh(geo, [new T.MeshStandardMaterial({ map: faccia, roughness: 0.48, metalness: 0.05 }), plastica])
  const su = SP // la faccia di sopra

  // ── il display: i led verdi su una tela, disegnata quando il numero o la luce cambiano ──
  const DW = 608, DH = Math.round((DW * DISPLAY.a) / DISPLAY.l), dc = tela(DW, DH), dg = dc.getContext('2d')
  const schermo = trama(dc)
  const vetro = new T.MeshBasicMaterial({ map: schermo })
  const display = new T.Mesh(new T.PlaneGeometry(mm(DISPLAY.l), mm(DISPLAY.a)), vetro)
  display.geometry.rotateX(-Math.PI / 2); display.position.set(mm(DISPLAY.x), su + 0.0002, -mm(DISPLAY.y))
  let luce = true, mostrato = -1, mostrataLuce = null
  try { luce = localStorage.getItem(CHIAVE) !== '0' } catch {}
  const disegna = (fps) => {
    const n = Math.max(0, Math.min(999, Math.round(fps || 0)))
    if (n === mostrato && luce === mostrataLuce) return
    mostrato = n; mostrataLuce = luce
    dg.globalCompositeOperation = 'source-over'; dg.shadowBlur = 0
    dg.fillStyle = luce ? '#020604' : '#0d100e'; dg.fillRect(0, 0, DW, DH)
    const acceso = luce ? '#46ff7d' : '#2d4a36', spento = luce ? '#0a2614' : '#141b16'
    // (solo le tre cifre, grandi: «fps» è stampato sotto, sul corpo; sul display, a quella distanza, era un puntino)
    const h = DH * 0.74, w = h * 0.5, t = h * 0.12, y = (DH - h) / 2, passo = w + t * 2.1
    const cifre = String(n).padStart(3, ' ')
    const x0 = (DW - 3 * passo + t * 2.1 - h * 0.1) / 2
    // i segmenti spenti (si vedono sempre, un'ombra), poi quelli accesi, col bagliore se c'è la luce
    for (let i = 0; i < 3; i++) cifra(dg, x0 + i * passo, y, w, h, t, '', spento, spento)
    if (luce) { dg.shadowColor = 'rgba(60,255,120,.95)'; dg.shadowBlur = 22 }
    for (let r = 0; r < (luce ? 2 : 1); r++) for (let i = 0; i < 3; i++) if (cifre[i] !== ' ') cifra(dg, x0 + i * passo, y, w, h, t, SEG[cifre[i]], acceso, 'rgba(0,0,0,0)')
    dg.shadowBlur = 0
    // il vetro: un riflesso in diagonale
    const rif = dg.createLinearGradient(0, 0, DW, DH)
    rif.addColorStop(0, 'rgba(255,255,255,.10)'); rif.addColorStop(0.38, 'rgba(255,255,255,.03)'); rif.addColorStop(0.4, 'rgba(255,255,255,0)'); rif.addColorStop(1, 'rgba(255,255,255,.02)')
    dg.fillStyle = rif; dg.fillRect(0, 0, DW, DH)
    schermo.needsUpdate = true
    // (acceso fa luce: oltre 1, il bagliore della scena lo prende di sera; spento è uno schermo scuro e basta)
    vetro.color.setScalar(luce ? 2.4 : 0.6)
  }
  disegna(0)

  // ── il tasto: gomma gialla tonda (un cilindro basso con la cupola schiacciata sopra) con la lampadina stampata;
  // premuto si abbassa e torna su ──
  const gomma = new T.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.62 })
  const tasto = new T.Group()
  const fusto = new T.Mesh(new T.CylinderGeometry(mm(7.2), mm(7.2), mm(1.6), 28), gomma)
  fusto.position.y = mm(0.8)
  const cupola = new T.Mesh(new T.SphereGeometry(1, 28, 8, 0, Math.PI * 2, 0, Math.PI / 2), gomma)
  cupola.scale.set(mm(7.2), mm(1.1), mm(7.2)); cupola.position.y = mm(1.6)
  tasto.add(fusto, cupola)
  const ic = tela(128), ig = ic.getContext('2d')
  ig.strokeStyle = ig.fillStyle = '#1a1a1a'; ig.lineWidth = 9; ig.lineCap = 'round'
  ig.beginPath(); ig.arc(64, 54, 22, Math.PI * 0.8, Math.PI * 2.2); ig.stroke()
  ig.fillRect(50, 80, 28, 9); ig.fillRect(53, 94, 22, 7)
  for (let i = 0; i < 5; i++) { const an = Math.PI * (1.05 + i * 0.225); ig.beginPath(); ig.moveTo(64 + Math.cos(an) * 34, 54 + Math.sin(an) * 34); ig.lineTo(64 + Math.cos(an) * 46, 54 + Math.sin(an) * 46); ig.stroke() }
  const icona = new T.Mesh(new T.CircleGeometry(mm(4.2), 24), new T.MeshStandardMaterial({ map: trama(ic), transparent: true, roughness: 0.7, depthWrite: false }))
  icona.geometry.rotateX(-Math.PI / 2); icona.position.y = mm(2.72)
  tasto.add(icona)
  tasto.position.set(mm(TASTO.x), su - mm(0.4), -mm(TASTO.y))

  // il portachiavi: corpo, display e tasto, inclinato di 11° verso la strada (il bordo di dietro sulle chiavi)
  const token = new T.Group()
  token.add(corpo, display, tasto)
  const INCLINA = 0.19
  token.rotation.x = INCLINA; token.position.y = (W0 / 2 + BS) * Math.sin(INCLINA) + 0.0004

  // ── l'anello e le chiavi: una Yale d'ottone e una di ferro, per terra a sinistra, una che passa sotto il bordo di dietro ──
  const ferro = new T.MeshStandardMaterial({ color: 0xb9bcbf, metalness: 1, roughness: 0.32 })
  const ottone = new T.MeshStandardMaterial({ color: 0xc7a24f, metalness: 1, roughness: 0.36 })
  const anello = new T.Mesh(new T.TorusGeometry(mm(12), mm(0.95), 8, 40), ferro)
  anello.rotation.set(Math.PI / 2 - 0.32, 0.18, 0); anello.position.set(mm(BUCO.x - 9), mm(5.5), mm(1))
  // (la testa tonda col foro, la lama coi denti sotto e la punta)
  const chiave = (lunga, denti) => {
    const k = new T.Shape(), a0 = Math.asin(3.5 / 10), x0 = 10 * Math.cos(a0)
    k.moveTo(mm(x0), mm(3.5))
    k.absarc(0, 0, mm(10), a0, Math.PI * 2 - a0, false)
    for (let i = 0; i < denti; i++) { const x = 14 + i * 5; k.lineTo(mm(x), -mm(3.5)); k.lineTo(mm(x + 1.6), -mm(6 + (i % 2) * 1.3)); k.lineTo(mm(x + 3.4), -mm(3.5)) }
    k.lineTo(mm(10 + lunga), -mm(3.5)); k.lineTo(mm(13 + lunga), 0); k.lineTo(mm(10 + lunga), mm(3.5)); k.lineTo(mm(x0), mm(3.5))
    const foro = new T.Path(); foro.absarc(-mm(4), 0, mm(3), 0, Math.PI * 2, true); k.holes.push(foro)
    const geo = new T.ExtrudeGeometry(k, { depth: mm(1.4), bevelEnabled: true, bevelThickness: mm(0.4), bevelSize: mm(0.4), bevelSegments: 1, curveSegments: 16 })
    geo.rotateX(-Math.PI / 2)
    return geo
  }
  const yale = new T.Mesh(chiave(34, 5), ottone)
  yale.position.set(mm(BUCO.x - 24), mm(1.8), mm(-6)); yale.rotation.set(0.02, 2.75, 0.04)
  const ferrea = new T.Mesh(chiave(40, 6), ferro)
  ferrea.position.set(mm(BUCO.x - 14), mm(5.2), mm(-14)); ferrea.rotation.set(-0.12, -0.42, 0.05)

  // il bagliore verde per terra intorno al display, a luce accesa: un velo che si somma (niente luce vera, che vorrebbe
  // dire ricompilare tutti i materiali con una luce in più), più forte quando è buio
  const gc = tela(128), gg = gc.getContext('2d'), rg = gg.createRadialGradient(64, 64, 4, 64, 64, 64)
  rg.addColorStop(0, 'rgba(70,255,125,.9)'); rg.addColorStop(0.35, 'rgba(50,255,110,.35)'); rg.addColorStop(1, 'rgba(40,255,100,0)')
  gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128)
  const alone = new T.Mesh(new T.PlaneGeometry(0.2, 0.13), new T.MeshBasicMaterial({ map: trama(gc), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 }))
  alone.geometry.rotateX(-Math.PI / 2); alone.position.set(mm(DISPLAY.x), 0.0028, -mm(DISPLAY.y) - 0.012); alone.renderOrder = 2

  // tutto insieme, per terra davanti all'angolo del chiusino verso la telecamera, appena girato; sul telefono, dove in
  // fondo alla pagina si vede solo il coperchio, sopra il coperchio (alto 6,5 mm coi rilievi), verso il fondo a destra
  const o = new T.Group()
  o.add(token, anello, yale, ferrea, alone)
  const [tx, tz] = M.telefono ? TOMBINO.telefono : TOMBINO.computer
  if (M.telefono) { o.position.set(tx + 0.19, 0.0066, tz - 0.17); o.rotation.y = 0.28 } else { o.position.set(tx - 0.5, 0, tz + 0.62); o.rotation.y = -0.05 }
  o.traverse((m) => { if (!m.isMesh) return; m.layers.set(1); m.castShadow = m !== alone && m !== display; m.receiveShadow = m !== alone })
  scene.add(o)

  // ── il tasto premuto: giù in 70 ms, la luce cambia, su con un piccolo rimbalzo ──
  const SU = tasto.position.y, GIU = mm(1.5)
  let t0 = -1e9
  const premi = () => {
    t0 = performance.now()
    luce = !luce
    try { localStorage.setItem(CHIAVE, luce ? '1' : '0') } catch {}
    disegna(mostrato)
    return luce
  }
  // il raggio del puntatore (origine e direzione, nel mondo) tocca il portachiavi? Tutto il portachiavi fa da tasto: la
  // scatola che lo contiene, nel suo riferimento (inclinato e girato), col metodo delle lastre; niente Raycaster
  const inv = new T.Matrix4(), lo = new T.Vector3(), ld = new T.Vector3(), pw = new T.Vector3()
  const SCATOLA = [[-(L0 / 2 + BS), L0 / 2 + BS], [-0.001, SP + mm(3)], [-(W0 / 2 + BS), W0 / 2 + BS]]
  const tocca = (origine, direzione) => {
    token.updateWorldMatrix(true, false)
    inv.copy(token.matrixWorld).invert()
    lo.copy(origine).applyMatrix4(inv); ld.copy(direzione).transformDirection(inv)
    let t0 = 0, t1 = Infinity
    for (const [i, [a, b]] of SCATOLA.entries()) {
      const p = lo.getComponent(i), v = ld.getComponent(i)
      if (Math.abs(v) < 1e-9) { if (p < a || p > b) return false; continue }
      let ta = (a - p) / v, tb = (b - p) / v
      if (ta > tb) [ta, tb] = [tb, ta]
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
      if (t0 > t1) return false
    }
    // (la distanza dalla telecamera, nel mondo: tocchi.js sceglie la cosa più vicina fra quelle toccate)
    return pw.copy(lo).addScaledVector(ld, t0).applyMatrix4(token.matrixWorld).distanceTo(origine)
  }
  let ultimo = 0
  return {
    tocca,
    premi,
    get luce() { return luce },
    set luce(v) { if (!!v !== luce) premi() },
    aggiorna(now, fps, buio) {
      // il numero due volte al secondo (ridisegnare la tela e mandarla alla scheda costa: non a ogni fotogramma)
      if (now - ultimo > 500) { ultimo = now; disegna(fps) }
      const u = (now - t0) / 1000
      let y = SU
      if (u < 0.07) y = SU - GIU * (u / 0.07)
      else if (u < 0.32) { const v = (u - 0.07) / 0.25; y = SU - GIU * Math.exp(-6 * v) * Math.cos(v * 9) }
      tasto.position.y = y
      alone.material.opacity = luce ? 0.08 + 0.55 * buio : 0
      alone.visible = alone.material.opacity > 0.005
    },
  }
}
