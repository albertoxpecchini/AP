// La scena 3D della home di pzkko.it: la saracinesca coi volantini diventa un
// posto vero, disegnato dalla scheda grafica con three.js (lib/three.js): doghe,
// insegna, porta a vetri, marciapiede bagnato, i palazzi di fronte, il sole di
// Mantova a quest'ora e di notte l'insegna, la lampada e le auto che passano.
//
// L'arrivo: mentre i volantini si scaricano la strada si vede da lontano, con la
// telecamera ad altezza d'occhio che si avvicina piano; quando tutto è pronto la
// telecamera vola dritta fino all'inquadratura di sempre. Da lì è fissa davanti
// alla vetrina e sale e scende con lo scorrimento della pagina; l'inquadratura è
// calcolata perché la saracinesca 3D stia esattamente dove sta la parete nel DOM:
// così la pagina di sempre resta sotto, invisibile, e continua a fare tutto
// (link, tagliandi, giochi, mosche), e qui si disegna soltanto. Sul telefono la
// parete è quella del telefono (due colonne, stretta e alta) e la saracinesca è
// larga 0,95 m invece di 2,05: i volantini restano grandi come quelli veri.
// Prove: ?muro=1 (niente 3D), ?intro=0 (niente arrivo), ?allinea=1 (il DOM in
// trasparenza sopra la scena), ?qualita=alta|media|bassa|telefono, ?dpr=1 (la
// risoluzione interna; con ?qualita= o ?dpr= la scena non si adatta da sola),
// ?glb=1 (scarica la scena in glTF per Blender), più quelle della pagina
// (?ora=18:30, ?veloce=60, ?notte=1, ?auto=1).
import * as T from './lib/three.js'
import { costruisci, prossimoFotogramma, specchiModo } from './mondo.js'
import { fogli } from './fogli.js'
import { luci } from './luci.js'

// I livelli di qualità (niente anti-alias in nessuno). dpr = la risoluzione interna rispetto ai pixel CSS, che non
// scende mai: è lei che decide se le immagini sono nitide, il resto si può togliere; specchi = la tela del vetro e
// delle pozzanghere; ombra = la mappa del sole; bloom = la risoluzione del bagliore rispetto ai pixel CSS (0 = niente);
// luci = «tutte» o «poche» (mondo.js).
const LIVELLI = {
  alta: { dpr: 1.25, specchi: [768, 512], ombra: 2048, bloom: 1, luci: 'tutte' },
  media: { dpr: 1, specchi: [512, 256], ombra: 1024, bloom: 0.5, luci: 'poche' },
  bassa: { dpr: 1, specchi: [256, 128], ombra: 1024, bloom: 0, luci: 'poche', palazzi: false },
  telefono: { dpr: 1.5, specchi: [384, 192], ombra: 1024, bloom: 1, luci: 'poche' },
}
// Dalla scheda grafica, se si lascia riconoscere: le integrate (Intel, Apple,
// Mali, Adreno) e gli emulatori partono da «media»; poi, se i primi fotogrammi
// sono lenti, si scende comunque.
const qualitaIniziale = (renderer, chiesta, telefono) => {
  if (chiesta && LIVELLI[chiesta]) return chiesta
  if (telefono) return 'telefono'
  const gl = renderer.getContext()
  const d = gl.getExtension('WEBGL_debug_renderer_info')
  const nome = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''
  if (/SwiftShader|llvmpipe|Mesa|Mali|Adreno|PowerVR|Apple GPU|Intel|Iris|UHD|HD Graphics/i.test(nome)) return 'media'
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'media'
  return 'alta'
}

// l'arrivo: quanto si resta da lontano dopo la schermata di caricamento (almeno, al massimo) e quanto dura il volo;
// quanto si aspettano le foto al massimo, dietro la schermata, prima di mostrare la scena lo stesso
const ATTESA_MIN = 900, ATTESA_MAX = 20000, VOLO = 2600, CARICO_MAX = 25000
// la barra di caricamento (il caricatore in index.html): fin qui i moduli, la costruzione, gli shader; il resto le foto
const CARICO = { moduli: 0.12, costruita: 0.3, shader: 0.4 }
const carico = (p) => window.pzkkoCarico?.(p)
// la telecamera non scende sotto mezzo metro da terra: più giù, in fondo alla pagina, guarderebbe il marciapiede da
// sotto (il piano si vede da una faccia sola: sotto c'è il cielo). La proiezione è decentrata, la parete resta dov'è
const ALTEZZA_MIN = 0.5
// il sole gira di 0,25° al minuto: la sua ombra si rifà quando si è spostato di 0,15°
const COS_SOLE = Math.cos(0.15 * Math.PI / 180)
const liscia = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10) }

export async function avvia() {
  const root = document.documentElement, q = new URLSearchParams(location.search)
  const parete = document.querySelector('.parete'), strada = document.querySelector('.strada'), portale = document.querySelector('.portale')
  if (!parete) throw new Error('manca la parete')
  const t0 = performance.now()
  carico(CARICO.moduli)
  const sottile = matchMedia('(max-width:899px)')
  const telefono = sottile.matches
  // girare il telefono o allargare la finestra oltre i 900 px cambia la disposizione dei fogli: si ricomincia
  sottile.addEventListener('change', () => location.reload())
  // il foglio di stile della scena (lo carica la pagina insieme a questo modulo) deve esserci prima della tela
  await new Promise((r) => { const l = document.querySelector('link[href="/scena/scena.css"]'); if (!l || l.sheet) return r(); l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }) })
  const tela = document.createElement('canvas')
  tela.className = 'scena-tela'
  tela.setAttribute('aria-hidden', 'true')
  const renderer = new T.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance', alpha: false })
  try {
    return await scena({ root, q, parete, strada, portale, t0, telefono, tela, renderer })
  } catch (e) {
    // qualcosa è andato storto: si torna al muro di sempre
    root.classList.remove('scena3d', 'scena-vista')
    tela.remove(); renderer.dispose()
    portale.style.height = ''; portale.style.padding = ''; strada.style.paddingBottom = ''
    throw e
  }
}

async function scena({ root, q, parete, strada, portale, t0, telefono, tela, renderer }) {
  const qualita = qualitaIniziale(renderer, q.get('qualita'), telefono)
  const liv = { ...LIVELLI[qualita] }
  // (?qualita= e ?dpr= sono per le prove: con quelli la scena non si adatta da sola)
  const fissa = q.has('qualita') || q.has('dpr')
  let dpr = Number(q.get('dpr')) || Math.min(devicePixelRatio, liv.dpr)
  renderer.setPixelRatio(dpr)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFShadowMap
  renderer.toneMapping = T.AgXToneMapping
  renderer.outputColorSpace = T.SRGBColorSpace

  // ── le misure: la parete in unità (1280 di larghezza sul computer, 390 sul telefono), la saracinesca in metri ──
  const UNITA = telefono ? 390 : 1280, W = telefono ? 0.95 : 2.048, K = W / UNITA
  const u = parete.offsetWidth / UNITA
  const Hp = (parete.offsetHeight / u) * K
  const M = { K, W, H: Math.max(Hp, telefono ? 2 : 3.2), Hp, telefono }
  if (!Number.isFinite(M.H)) throw new Error(`misure: parete ${parete.offsetWidth} × ${parete.offsetHeight} px`)
  const DIST = telefono ? 1.6 : 2.6 // la telecamera, dalla saracinesca, quando è arrivata

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 220)
  scene.add(camera)
  // (prima i fogli: chiedono le foto, che si scaricano e decodificano per conto loro mentre il posto si costruisce,
  // due secondi di trame disegnate al volo)
  const [f, h] = await Promise.all([fogli(scene, M, renderer), costruisci(scene, M, { palazzi: liv.palazzi !== false, poche: liv.luci === 'poche' })])
  const l = luci(scene, renderer, h, M)
  const tCostruita = performance.now()
  carico(CARICO.costruita)

  // ── il post-processing: il bagliore dei neon, poi i colori (l'OutputPass, l'ultimo, disegna sullo schermo) ──
  const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType })
  const composer = new T.EffectComposer(renderer, target)
  composer.setPixelRatio(dpr)
  composer.addPass(new T.RenderPass(scene, camera))
  const bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), 0.55, 0.5, 1.0)
  composer.addPass(bloom)
  const uscita = new T.OutputPass()
  composer.addPass(uscita)
  const specchi = ([v, p]) => { h.vetro.getRenderTarget().setSize(v, v); h.pozze.getRenderTarget().setSize(p, p / 2) }
  specchi(liv.specchi)
  if (liv.ombra !== 2048) l.sole.shadow.mapSize.set(liv.ombra, liv.ombra)
  // le mappe d'ombra si rifanno solo quando si dice (sotto, in fotogramma)
  l.sole.shadow.autoUpdate = false
  h.lampada.shadow.autoUpdate = false

  // ── la tela e la pagina: il muro del DOM si sposta (scena.css), la pagina si allunga sopra e sotto ──
  root.classList.add('scena3d')
  if (q.get('allinea') !== null) root.classList.add('scena-allinea')
  document.body.appendChild(tela)
  // la tela è alta quanto la finestra più grande (100lvh): sul telefono la barra del browser che va e viene non
  // la ridimensiona, e un ridimensionamento a metà scorrimento costerebbe tutte le tele del post-processing
  const dim = { w: 0, h: 0 }
  // la parete, in coordinate del documento: si rilegge solo quando la pagina cambia misura, e a ogni fotogramma
  // basta lo scorrimento (getBoundingClientRect a ogni fotogramma costringerebbe il browser a rifare l'impaginazione)
  const base = { x: 0, y: 0, w: 1 }
  let sx = scrollX, sy = scrollY
  const rileggi = () => { const r = parete.getBoundingClientRect(); sx = scrollX; sy = scrollY; base.x = r.left + sx; base.y = r.top + sy; base.w = r.width }
  const misura = () => {
    const w = tela.clientWidth || innerWidth, hh = tela.clientHeight || innerHeight
    if (w !== dim.w || hh !== dim.h) {
      dim.w = w; dim.h = hh
      renderer.setSize(w, hh, false)
      composer.setSize(w, hh)
      // (il bagliore a una risoluzione sua, più bassa: è sfocato comunque)
      bloom.setSize(Math.max(2, w * (liv.bloom || 1)), Math.max(2, hh * (liv.bloom || 1)))
    }
    // lo spazio in più da scorrere, sopra (l'insegna) e sotto (il marciapiede)
    const px = parete.offsetWidth / M.W // pixel per metro sul piano della saracinesca
    portale.style.height = `${Math.round((telefono ? h.insegna.top - M.H + 0.35 : 1.3) * px)}px`
    portale.style.padding = '0'
    strada.style.paddingBottom = `${Math.round((telefono ? 0.9 : 1.35) * px)}px`
    rileggi()
  }
  addEventListener('resize', misura)
  addEventListener('scroll', () => { sx = scrollX; sy = scrollY }, { passive: true })
  new ResizeObserver(() => rileggi()).observe(parete)
  new ResizeObserver(() => rileggi()).observe(portale)
  misura()

  // ── le inquadrature ────────────────────────────────────────────────────────
  // Un'inquadratura è: la telecamera a distanza d dal piano della saracinesca (z = 0), il rettangolo di quel piano
  // che si vede (centro wx, wy e mezza altezza hv) e dove sta la telecamera rispetto al centro (ox, oy). La
  // proiezione è decentrata, come un obiettivo decentrabile: le verticali restano verticali anche guardando in su.
  camera.updateProjectionMatrix = () => {}
  const ultima = {}
  // mette la telecamera; dice se si è mossa rispetto al fotogramma prima (gli specchi, che se no non si rifanno)
  const metti = (p) => {
    let mossa = false
    for (const k in p) if (ultima[k] !== p[k]) { mossa = true; ultima[k] = p[k] }
    const camX = p.wx + p.ox, camY = p.wy + p.oy, n = camera.near
    const hw = p.hv * dim.w / dim.h
    camera.position.set(camX, camY, p.d)
    camera.projectionMatrix.makePerspective((p.wx - hw - camX) * n / p.d, (p.wx + hw - camX) * n / p.d, (p.wy + p.hv - camY) * n / p.d, (p.wy - p.hv - camY) * n / p.d, n, camera.far)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    return mossa
  }
  // vicino: la saracinesca 3D dove sta la parete del DOM, pixel per pixel
  const vicino = () => {
    const left = base.x - sx, top = base.y - sy, fpm = base.w / M.W
    const cx = M.W / 2 - (left + base.w / 2 - dim.w / 2) / fpm
    const cy = M.H - (dim.h / 2 - top) / fpm
    const camX = cx + (telefono ? 0.1 : 0.3), camY = Math.max(ALTEZZA_MIN, telefono ? cy - 0.2 : 0.75 + 0.55 * cy)
    return { d: DIST, wx: cx, wy: cy, hv: dim.h / (2 * fpm), ox: camX - cx, oy: camY - cy }
  }
  // lontano: dall'altra parte del marciapiede, ad altezza d'occhio, tutto il negozio nell'inquadratura, con lo stesso
  // angolo di campo di quando si arriva; si avvicina piano e respira. Sul telefono la saracinesca è alta 9 m e da
  // lontano sembrerebbe una fessura: si inquadra la parte alta (l'insegna e i primi fogli), con la telecamera già lassù
  let tVista = 0
  const lontano = (now, tan) => {
    const bx0 = telefono ? -0.55 : -0.7, bx1 = telefono ? M.W + 0.55 : h.fronte.x1 + 0.7
    const by0 = telefono ? M.H - 2.4 : -0.45, by1 = h.insegna.top + (telefono ? 0.7 : 0.6)
    const hvBox = Math.max((by1 - by0) / 2, (bx1 - bx0) / 2 / (dim.w / dim.h))
    const tt = Math.max(0, now - tVista) / 1000
    const d = (hvBox / tan) * (1 + 0.22 * Math.exp(-tt / 4))
    const wy = (by0 + by1) / 2
    const camY = (telefono ? wy - 0.4 : 1.65) + 0.03 * Math.sin(tt * 0.9)
    return { d, wx: (bx0 + bx1) / 2, wy, hv: d * tan, ox: 0.05 * Math.sin(tt * 0.55), oy: camY - wy }
  }
  // il volo: la telecamera va dritta (il centro si sposta in proporzione alla distanza, come in un volo in linea
  // retta) e la distanza cala in scala logaritmica, così l'avvicinamento ha sempre la stessa velocità a vista
  const vola = (a, b, s) => {
    const d = Math.exp(Math.log(a.d) + (Math.log(b.d) - Math.log(a.d)) * s)
    const k = Math.abs(a.d - b.d) < 1e-6 ? 1 - s : (d - b.d) / (a.d - b.d)
    const mix = (x, y) => y + (x - y) * k
    return { d, wx: mix(a.wx, b.wx), wy: mix(a.wy, b.wy), hv: d * (b.hv / b.d), ox: mix(a.ox, b.ox), oy: mix(a.oy, b.oy) }
  }
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches || q.get('intro') === '0'
  let fase = ridotto ? 'fatto' : 'lontano', tVia = 0, prontiFogli = false, salta = false, visibile = false, arrivata = () => {}
  f.pronti.then(() => { prontiFogli = true })
  // toccare, scorrere o premere un tasto mentre si guarda da lontano accorcia l'attesa (ma si parte lo stesso solo a
  // fogli pronti: all'arrivo dev'essere tutto a bordo, senza foto che compaiono dopo)
  const fretta = () => { salta = true }
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, fretta, { passive: true, once: true })
  const posa = (now) => {
    const b = vicino()
    if (fase === 'fatto') return b
    if (fase === 'lontano') {
      // (finché la tela non si vede si resta da lontano: il tempo si conta da quando la strada compare)
      const attesa = visibile ? now - tVista : 0
      if ((prontiFogli && (attesa > ATTESA_MIN || (salta && attesa > 700))) || attesa > ATTESA_MAX) { fase = 'avvicina'; tVia = now }
      else return lontano(now, b.hv / b.d)
    }
    const s = liscia((now - tVia) / VOLO)
    if (s >= 1) { fase = 'fatto'; arrivata(); return b }
    return vola(lontano(now, b.hv / b.d), b, s)
  }

  // ── gli shader: ogni insieme di luci (luci.js) vuole i suoi programmi, compilati prima di usarli ──
  // Un programma che manca al momento di disegnare si compila lì, bloccando (su Windows ~200 ms l'uno: erano secondi di
  // nero). La chiave di un programma comprende la destinazione (la tela del post-processing, dove three toglie il tone
  // mapping, o lo schermo), la nebbia e le luci della scena in cui si disegna, e se il materiale è opaco; quindi:
  // - la scena si compila dentro la sua tela, col cielo già pronto come ambiente (l.aggiorna: entra nei materiali), con
  //   la carrozzeria dell'auto (nascosta finché non passa) e con la carta sia trasparente sia opaca (fogli.js la fa
  //   opaca finita la dissolvenza);
  // - i quadri del bagliore dentro la tela (di giorno è spento e si accenderebbe la sera con uno scatto) e l'OutputPass
  //   sullo schermo: ognuno con la mesh del suo FullScreenQuad (un triangolo con solo posizione
  //   e uv: anche gli attributi della geometria entrano nella chiave, con un piano qualunque non combaciava); i campi
  //   _fsQuad e _mesh sono privati per convenzione, ma three è quella in lib/, ferma. L'OutputPass decide le sue
  //   define al primo render: gli si danno prima.
  // Restano ai primi fotogrammi (a tela nascosta) i materiali di profondità delle ombre, che three crea da sé.
  // L'insieme di partenza si compila a tela nascosta, tutto insieme; quando la sera ne serve un altro si compila in
  // sottofondo un pezzo per fotogramma (mettere in coda un programma costa ~40 ms sul filo principale, tutti insieme
  // era un secondo fermo; la scheda poi compila per conto suo, intanto si continua con le luci di prima) e si mette
  // quando è tutto pronto.
  uscita._outputColorSpace = renderer.outputColorSpace; uscita._toneMapping = renderer.toneMapping
  uscita.material.defines = { SRGB_TRANSFER: '', AGX_TONE_MAPPING: '' }; uscita.material.needsUpdate = true
  const quadri = [
    ...[bloom.materialHighPassFilter, ...bloom.separableBlurMaterials, bloom.compositeMaterial, bloom.blendMaterial].filter(Boolean).map((m) => [bloom._fsQuad, m, true]),
    [uscita._fsQuad, uscita.material, false],
  ]
  const compilati = new Set()
  let compilando = null
  const fotogrammaDopo = () => new Promise((r) => requestAnimationFrame(r))
  // i pezzi da compilare: ogni oggetto della scena (con l'auto), col suo materiale com'è e, per la carta, anche opaco;
  // i quadri del post-processing. Ogni pezzo è una chiamata a renderer.compile (mette in coda i programmi: la scheda li
  // compila per conto suo, e sotto si aspetta che siano pronti) con le luci dell'insieme messe
  const pezziDaCompilare = function* () {
    const visti = new Set(), oggetti = []
    scene.traverse((o) => { if (o.isMesh && o.material && !visti.has(o.material)) { visti.add(o.material); oggetti.push(o) } })
    const carta = new Set(f.pezzi.filter((p) => p.opaco).map((p) => p.mesh))
    const dentro = (o, opaco) => () => {
      const era = o.visible, t = o.material.transparent
      o.visible = true
      if (opaco) o.material.transparent = false
      renderer.setRenderTarget(composer.renderTarget1)
      renderer.compile(o, camera, scene)
      o.visible = era; o.material.transparent = t
    }
    for (const o of oggetti) {
      yield dentro(o, false)
      if (carta.has(o) && o.material.transparent) yield dentro(o, true)
    }
    for (const [fq, m, dentroTela] of quadri) yield () => {
      const prima = fq.material
      fq.material = m
      renderer.setRenderTarget(dentroTela ? composer.renderTarget1 : null)
      renderer.compile(fq._mesh, camera)
      fq.material = prima
    }
  }
  const compila = async (nome, { subito = false } = {}) => {
    const prima = l.attuale()
    for (const pezzo of pezziDaCompilare()) {
      l.metti(nome)
      pezzo()
      renderer.setRenderTarget(null)
      if (prima) l.metti(prima)
      if (!subito) await fotogrammaDopo()
    }
    // i programmi si aspettano uno per uno (la scheda compila in parallelo, per conto suo)
    while (!renderer.info.programs.every((p) => p.isReady())) await fotogrammaDopo()
    compilati.add(nome)
  }
  // l'insieme che serve è cambiato: si mette se è compilato, se no si compila (e si mette al fotogramma in cui è pronto)
  const cambia = (nome) => {
    if (compilati.has(nome)) return l.metti(nome)
    if (!compilando) compilando = compila(nome).catch((e) => console.warn('scena 3D: luci non compilate', e)).finally(() => { compilando = null })
    return false
  }

  // ── un fotogramma ──────────────────────────────────────────────────────────
  let n = 0
  const ultimoSole = new T.Vector3()
  const fotogramma = (now, dt) => {
    const stato = l.aggiorna(now, dt)
    f.aggiorna(dt, now)
    const acceso = stato.insieme !== l.attuale() && cambia(stato.insieme)
    const mossa = metti(posa(now))
    n++
    // le ombre si rifanno solo quando qualcosa si muove (un foglio che si alza o compare, un tagliando, l'auto), quando il
    // sole si è spostato di 0,15° (ogni ~40 s) e quando una luce si è appena accesa (non dipendono dalla telecamera:
    // il volo non le tocca). Di chi è spento non si rifanno (nei primi fotogrammi sì, così le mappe esistono: un
    // sampler d'ombra senza mappa è un errore GL)
    const mosso = n < 4 || stato.auto || f.inMoto(now)
    if (l.sole.visible && (mosso || acceso || stato.dir.dot(ultimoSole) < COS_SOLE)) { l.sole.shadow.needsUpdate = true; ultimoSole.copy(stato.dir) }
    if (h.lampada.visible && (mosso || acceso)) h.lampada.shadow.needsUpdate = true
    // gli specchi: fermi finché niente si muove (il riflesso di prima è ancora giusto; ogni mezzo secondo comunque, per
    // la sera che avanza e lo sfarfallio), uno sì e uno no quando la telecamera si muove, tutti e due a ogni fotogramma
    // nel volo e quando passa un'auto se la scheda ce la fa
    const vivo = mossa || mosso || acceso || fase !== 'fatto' || n % 32 === 0
    specchiModo(!vivo ? 'fermi' : qualita === 'alta' && (stato.auto || fase !== 'fatto') ? 'tutti' : 'alterni')
    // il bagliore: solo quando fa buio (di giorno non c'è niente di così acceso, e costa)
    bloom.enabled = liv.bloom > 0 && stato.buio > 0.15
    bloom.threshold = 1.5 + 2 * (1 - stato.buio); bloom.strength = 0.12 + 0.25 * stato.buio
    composer.render()
    prossimoFotogramma()
  }

  // ── gli shader dell'insieme di partenza, poi tre fotogrammi a vuoto (la tela è ancora trasparente) ──
  tVista = performance.now()
  const s0 = l.aggiorna(tVista, 1 / 60)
  l.metti(s0.insieme)
  metti(posa(tVista))
  await compila(s0.insieme, { subito: true })
  const tCompilata = performance.now()
  carico(CARICO.shader)
  const prog = () => renderer.info.programs?.length ?? 0
  const dettagli = []
  for (let i = 0; i < 3; i++) {
    const a = performance.now(), p0 = prog(); fotogramma(performance.now(), 1 / 60); dettagli.push(`${(performance.now() - a).toFixed(0)} ms +${prog() - p0}`)
    if (q.get('programmi') !== null) console.info('scena 3D, programmi nuovi: ' + renderer.info.programs.slice(p0).map((p) => p.name || p.cacheKey.slice(0, 90).replace(/,/g, ' ')).join(' | '))
    await new Promise((r) => requestAnimationFrame(r))
  }
  const tPronta = performance.now()
  console.info(`scena 3D: costruita ${(tCostruita - t0).toFixed(0)} ms, shader ${(tCompilata - tCostruita).toFixed(0)} ms, primi fotogrammi ${dettagli.join(' / ')} (programmi ${prog()}, luci «${s0.insieme}»)`)

  // ── dietro la schermata di caricamento: la scena gira già (la tela è trasparente sotto la schermata) e carica le foto
  // sulla scheda; la barra va con loro. Quando sono tutte a bordo (o dopo CARICO_MAX) la schermata se ne va, la tela
  // compare in dissolvenza dal nero (scena.css) con la telecamera da lontano, e dopo un attimo parte il volo ──
  let vista = () => {}
  const mostra = (now) => {
    tVista = now
    vista()
    visibile = true
    root.classList.add('scena-vista')
    carico(1)
    console.info(`scena 3D: foto a bordo in ${((now - t0) / 1000).toFixed(1)} s${prontiFogli ? '' : ' (non tutte: troppo tempo)'}`)
  }
  const tempi = window.pzkkoTempi = []
  let prima = performance.now(), fermo = false, misurati = [], gradini = 0
  // se la macchina non ce la fa (più di 24 ms a fotogramma, sotto i ~40 al secondo) si toglie qualcosa, fino a tre
  // volte, ma mai la risoluzione (le immagini devono restare nitide): prima gli specchi e il bagliore a metà, poi le
  // ombre a 512, poi gli specchi ancora a metà e il bagliore spento
  const degrada = (g, media) => {
    if (g === 1 || g === 3) { liv.specchi = liv.specchi.map((x) => Math.max(128, x / 2)); specchi(liv.specchi); liv.bloom = g === 3 ? 0 : Math.min(liv.bloom, 0.5); dim.w = 0; misura() }
    else { liv.ombra = 512; for (const s of [l.sole.shadow, h.lampada.shadow]) { s.mapSize.set(512, 512); s.needsUpdate = true } }
    console.info(`scena 3D: ${(media * 1000).toFixed(0)} ms a fotogramma, ${['specchi e bagliore a metà', 'ombre a 512', 'specchi a un quarto, niente bagliore'][g - 1]}`)
  }
  const giro = (now) => {
    if (fermo) return
    requestAnimationFrame(giro)
    const dt = Math.min((now - prima) / 1000, 0.1)
    prima = now
    const p0 = renderer.info.programs?.length ?? 0, a = performance.now()
    fotogramma(now, dt)
    if (!visibile) {
      carico(CARICO.shader + (0.97 - CARICO.shader) * f.avanzamento())
      if (prontiFogli || now - tPronta > CARICO_MAX) mostra(now)
    }
    // (i tempi dei fotogrammi, per foto.mjs, da quando la scena si vede)
    if (visibile && tempi.length < 900) tempi.push(Math.round(dt * 10000) / 10)
    if (q.get('programmi') !== null) {
      const p1 = renderer.info.programs?.length ?? 0, ms = performance.now() - a
      if (p1 > p0 || ms > 30) console.info(`scena 3D, fotogramma ${n} (${fase}): ${ms.toFixed(0)} ms, ${p1 - p0} programmi nuovi ${renderer.info.programs.slice(p0).map((p) => p.name || p.cacheKey.slice(0, 40)).join(' | ')}`)
    }
    // si misura a foto tutte a bordo (prima i fotogrammi in cui salgono sulla scheda sono lenti per conto loro), mentre
    // si guarda da lontano: il momento più pesante, tutti i fogli in vista
    if (!fissa && gradini < 3 && prontiFogli && n > 12) {
      misurati.push(dt)
      if (misurati.length >= 40) {
        // la mediana, non la media: un fotogramma lungo ogni tanto non deve contare
        const media = [...misurati].sort((a, b) => a - b)[misurati.length >> 1]
        misurati = []
        if (media > 0.024) degrada(++gradini, media)
        else gradini = 3
      }
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) fermo = true; else if (fermo) { fermo = false; prima = performance.now(); requestAnimationFrame(giro) } })
  requestAnimationFrame(giro)
  window.pzkkoScena = { scene, camera, renderer, composer, bloom, h, f, l, M, qualita, liv, fase: () => fase, dpr: () => dpr, insieme: () => l.attuale() }

  // ── arrivata: la pagina sotto torna a rispondere (lo fa il caricatore in index.html quando questa promessa si chiude) ──
  if (!visibile) await new Promise((ok) => { vista = ok })
  if (fase !== 'fatto') await new Promise((ok) => { arrivata = ok })
  root.dataset.scena = 'pronta'
  const sec = (x) => ((x - t0) / 1000).toFixed(1)
  console.info(`scena 3D: costruita in ${sec(tCostruita)} s, pronta in ${sec(tPronta)} s, vista in ${sec(tVista)} s, arrivata in ${sec(performance.now())} s (${qualita}, ${dpr.toFixed(2)}×${telefono ? ', telefono' : ''}, luci «${l.attuale()}»)`)

  // ?glb=1: la scena così com'è, in glTF binario, da aprire in Blender (File › Import › glTF); l'esportatore si scarica solo qui
  if (q.get('glb') !== null) {
    const { GLTFExporter } = await import('./lib/gltf.js')
    new GLTFExporter().parse(scene, (glb) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' })); a.download = 'pzkko.glb'; a.click()
    }, (e) => console.warn('glTF non esportato', e), { binary: true, onlyVisible: false })
  }
}
