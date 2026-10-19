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
// trasparenza sopra la scena), ?qualita=alta|media|bassa|telefono, ?filtro=0,
// ?glb=1 (scarica la scena in glTF per Blender), più quelle della pagina
// (?ora=18:30, ?veloce=60, ?notte=1, ?auto=1).
import * as T from './lib/three.js'
import { costruisci, prossimoFotogramma, specchiSubito } from './mondo.js'
import { fogli } from './fogli.js'
import { luci } from './luci.js'

// Il filtro «da videogioco»: grana che si muove, un filo di aberrazione cromatica
// ai bordi, vignetta, righe sottili e un colore un po' sporco, sopra l'immagine
// già a colori finiti (dopo l'OutputPass). ?filtro=0 lo toglie.
const FILTRO = {
  uniforms: { tDiffuse: { value: null }, tempo: { value: 0 }, risoluzione: { value: new T.Vector2(1, 1) }, grana: { value: 0.055 }, aberrazione: { value: 0.008 }, vignetta: { value: 0.36 }, righe: { value: 0.045 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float tempo, grana, aberrazione, vignetta, righe; uniform vec2 risoluzione; varying vec2 vUv;
    float caso( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }
    void main() {
      vec2 d = vUv - 0.5; float r2 = dot( d, d );
      vec2 sposta = d * r2 * aberrazione;
      vec3 c = vec3( texture2D( tDiffuse, vUv + sposta ).r, texture2D( tDiffuse, vUv ).g, texture2D( tDiffuse, vUv - sposta ).b );
      float g = caso( floor( vUv * risoluzione / 1.5 ) + fract( tempo * 0.37 ) * 97.0 ) - 0.5;
      c += g * grana * ( 0.6 + 0.4 * ( 1.0 - c.g ) );
      c *= 1.0 - righe * ( 0.5 + 0.5 * sin( vUv.y * risoluzione.y * 1.4 ) );
      c *= 1.0 - vignetta * smoothstep( 0.12, 0.65, r2 );
      c = mix( c, c * vec3( 0.97, 1.0, 0.92 ), 0.55 );
      gl_FragColor = vec4( c, 1.0 );
    }`,
}

// I livelli di qualità. dpr = la risoluzione interna rispetto ai pixel CSS (la
// grana del filtro nasconde la morbidezza); msaa = l'anti-alias; specchi = la
// tela del vetro e delle pozzanghere; ombra = la mappa del sole. Il telefono ha
// il suo: tanti pixel (il testo dei volantini si deve leggere) ma niente MSAA.
const LIVELLI = {
  alta: { dpr: 1.25, msaa: 4, specchi: [768, 512], ombra: 2048, bloom: true },
  media: { dpr: 0.9, msaa: 2, specchi: [512, 256], ombra: 1024, bloom: true },
  bassa: { dpr: 0.75, msaa: 0, specchi: [384, 192], ombra: 1024, bloom: false },
  telefono: { dpr: 1.5, msaa: 0, specchi: [384, 192], ombra: 1024, bloom: true },
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

// l'arrivo: quanto si resta da lontano (almeno, al massimo) e quanto dura il volo
const ATTESA_MIN = 1800, ATTESA_MAX = 9000, VOLO = 2600
const liscia = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10) }

export async function avvia() {
  const root = document.documentElement, q = new URLSearchParams(location.search)
  const parete = document.querySelector('.parete'), strada = document.querySelector('.strada'), portale = document.querySelector('.portale')
  if (!parete) throw new Error('manca la parete')
  const t0 = performance.now()
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
  let dpr = Math.min(devicePixelRatio, liv.dpr)
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
  const [h, f] = await Promise.all([costruisci(scene, M, { palazzi: qualita !== 'bassa' }), fogli(scene, M)])
  const l = luci(scene, renderer, h, M)
  const tCostruita = performance.now()

  // ── il post-processing: anti-alias MSAA, il bagliore dei neon, i colori, il filtro ──
  const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: liv.msaa })
  const composer = new T.EffectComposer(renderer, target)
  composer.setPixelRatio(dpr)
  composer.addPass(new T.RenderPass(scene, camera))
  const bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), 0.55, 0.5, 1.0)
  composer.addPass(bloom)
  composer.addPass(new T.OutputPass())
  const filtro = new T.ShaderPass(FILTRO)
  filtro.enabled = q.get('filtro') !== '0'
  composer.addPass(filtro)
  const specchi = ([v, p]) => { h.vetro.getRenderTarget().setSize(v, v); h.pozze.getRenderTarget().setSize(p, p / 2) }
  specchi(liv.specchi)
  if (liv.ombra !== 2048) l.sole.shadow.mapSize.set(liv.ombra, liv.ombra)
  // le mappe d'ombra si rifanno solo quando si dice (sotto, in fotogramma): le luci restano sempre «con ombra», così i
  // materiali si compilano una volta sola e non si accendono/spengono programmi a ogni tramonto
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
      bloom.setSize(w, hh)
      filtro.uniforms.risoluzione.value.set(w * dpr, hh * dpr)
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
  const metti = (p) => {
    const camX = p.wx + p.ox, camY = p.wy + p.oy, n = camera.near
    const hw = p.hv * dim.w / dim.h
    camera.position.set(camX, camY, p.d)
    camera.projectionMatrix.makePerspective((p.wx - hw - camX) * n / p.d, (p.wx + hw - camX) * n / p.d, (p.wy + p.hv - camY) * n / p.d, (p.wy - p.hv - camY) * n / p.d, n, camera.far)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }
  // vicino: la saracinesca 3D dove sta la parete del DOM, pixel per pixel
  const vicino = () => {
    const left = base.x - sx, top = base.y - sy, fpm = base.w / M.W
    const cx = M.W / 2 - (left + base.w / 2 - dim.w / 2) / fpm
    const cy = M.H - (dim.h / 2 - top) / fpm
    const camX = cx + (telefono ? 0.1 : 0.3), camY = telefono ? cy - 0.2 : 0.75 + 0.55 * cy
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
  // toccare, scorrere o premere un tasto mentre si guarda da lontano fa partire il volo subito
  const fretta = () => { salta = true }
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, fretta, { passive: true, once: true })
  const posa = (now) => {
    const b = vicino()
    if (fase === 'fatto') return b
    if (fase === 'lontano') {
      // (finché la tela non si vede si resta da lontano: il tempo si conta da quando la strada compare)
      const attesa = visibile ? now - tVista : 0
      if ((attesa > ATTESA_MIN && prontiFogli) || attesa > ATTESA_MAX || (salta && attesa > 700)) { fase = 'avvicina'; tVia = now }
      else return lontano(now, b.hv / b.d)
    }
    const s = liscia((now - tVia) / VOLO)
    if (s >= 1) { fase = 'fatto'; arrivata(); return b }
    return vola(lontano(now, b.hv / b.d), b, s)
  }

  // ── un fotogramma ──────────────────────────────────────────────────────────
  let n = 0
  const fotogramma = (now, dt) => {
    const stato = l.aggiorna(now, dt)
    f.aggiorna(dt, now)
    metti(posa(now))
    // le ombre si rifanno solo quando qualcosa si muove (un foglio che si alza o compare, un tagliando, l'auto) e
    // comunque ogni 24 fotogrammi per il sole che gira (non dipendono dalla telecamera: il volo non le tocca)
    n++
    const mosso = n < 4 || n % 24 === 0 || stato.auto || f.inMoto(now)
    // di notte la lampada decide le ombre, di giorno il sole: la mappa di chi è spento non si rifà
    // (nei primi fotogrammi tutte e due, così le mappe esistono: un sampler d'ombra senza mappa è un errore GL)
    l.sole.shadow.needsUpdate = n < 4 || (mosso && stato.giorno > 0.02 && stato.notte < 0.98)
    h.lampada.shadow.needsUpdate = n < 4 || (mosso && h.lampada.intensity > 0)
    // gli specchi a ogni fotogramma quando la telecamera si muove o passa un'auto, se no uno sì e uno no
    specchiSubito(stato.auto || fase !== 'fatto')
    filtro.uniforms.tempo.value = now / 1000
    // il bagliore: solo quando fa buio (di giorno non c'è niente di così acceso, e costa)
    bloom.enabled = liv.bloom && stato.buio > 0.15
    bloom.threshold = 1.5 + 2 * (1 - stato.buio); bloom.strength = 0.12 + 0.25 * stato.buio
    composer.render()
    prossimoFotogramma()
  }

  // ── gli shader si compilano prima di mostrare la scena, poi tre fotogrammi a vuoto (la tela è ancora trasparente) ──
  // La scena si disegna dentro la tela del post-processing, e lì three toglie il tone mapping: i programmi vanno
  // compilati con quella tela come destinazione, se no si compilano le varianti per lo schermo e quelle vere al primo
  // fotogramma, una alla volta e bloccando (su Windows ~200 ms l'una: erano cinque secondi di nero). Prima si prepara
  // il cielo come ambiente (l.aggiorna), che entra nei programmi dei materiali; insieme si compilano i materiali del
  // bagliore, che di giorno è spento e si accenderebbe la sera con uno scatto, e il filtro, che va sullo schermo.
  tVista = performance.now()
  l.aggiorna(tVista, 1 / 60)
  metti(posa(tVista))
  const quadri = new T.Scene(), quad = new T.PlaneGeometry(2, 2)
  for (const mat of [bloom.materialHighPassFilter, ...bloom.separableBlurMaterials, bloom.compositeMaterial, bloom.blendMaterial]) if (mat) quadri.add(new T.Mesh(quad, mat))
  const schermo = new T.Scene(); schermo.add(new T.Mesh(quad, filtro.material))
  renderer.setRenderTarget(composer.renderTarget1)
  // (le luci entrano nella chiave di ogni programma, anche dei quadri del post-processing: si compilano con quelle della scena)
  await Promise.all([renderer.compileAsync(scene, camera), renderer.compileAsync(quadri, camera, scene)])
  renderer.setRenderTarget(null)
  await renderer.compileAsync(schermo, camera, scene)
  const tCompilata = performance.now()
  const prog = () => renderer.info.programs?.length ?? 0
  const dettagli = []
  for (let i = 0; i < 3; i++) {
    const a = performance.now(), p0 = prog(); fotogramma(performance.now(), 1 / 60); dettagli.push(`${(performance.now() - a).toFixed(0)} ms +${prog() - p0}`)
    if (q.get('programmi') !== null) console.info('scena 3D, programmi nuovi: ' + renderer.info.programs.slice(p0).map((p) => p.name || p.cacheKey.slice(0, 90).replace(/,/g, ' ')).join(' | '))
    await new Promise((r) => requestAnimationFrame(r))
  }
  const tPronta = performance.now()
  console.info(`scena 3D: costruita ${(tCostruita - t0).toFixed(0)} ms, shader ${(tCompilata - tCostruita).toFixed(0)} ms, primi fotogrammi ${dettagli.join(' / ')} (programmi ${prog()})`)

  // ── si vede: la tela compare in dissolvenza dal nero (scena.css), la telecamera è da lontano ──
  tVista = performance.now()
  visibile = true
  root.classList.add('scena-vista')
  const tempi = window.pzkkoTempi = []
  let prima = performance.now(), fermo = false, misurati = [], gradini = 0
  const giro = (now) => {
    if (fermo) return
    requestAnimationFrame(giro)
    const dt = Math.min((now - prima) / 1000, 0.1)
    prima = now
    const p0 = renderer.info.programs?.length ?? 0, a = performance.now()
    fotogramma(now, dt)
    if (tempi.length < 900) tempi.push(Math.round(dt * 10000) / 10)
    if (q.get('programmi') !== null) {
      const p1 = renderer.info.programs?.length ?? 0, ms = performance.now() - a
      if (p1 > p0 || ms > 30) console.info(`scena 3D, fotogramma ${n} (${fase}): ${ms.toFixed(0)} ms, ${p1 - p0} programmi nuovi ${renderer.info.programs.slice(p0).map((p) => p.name || p.cacheKey.slice(0, 40)).join(' | ')}`)
    }
    // se la macchina non ce la fa (più di 24 ms a fotogramma, sotto i ~40 al secondo) si abbassa la risoluzione, fino a
    // tre volte; si misura mentre si guarda da lontano, che è il momento più pesante (tutti i fogli in vista)
    if (gradini < 3 && n > 12) {
      misurati.push(dt)
      if (misurati.length >= 40) {
        // la mediana, non la media: i fotogrammi in cui arriva un'immagine (la carica sulla scheda) non devono contare
        const media = [...misurati].sort((a, b) => a - b)[misurati.length >> 1]
        misurati = []
        if (media > 0.024) {
          gradini++
          dpr = Math.max(0.55, dpr * 0.8)
          renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); dim.w = 0; misura()
          liv.specchi = liv.specchi.map((x) => Math.max(128, x / 2)); specchi(liv.specchi)
          console.info(`scena 3D: ${(media * 1000).toFixed(0)} ms a fotogramma, risoluzione ${dpr.toFixed(2)}×`)
        } else gradini = 3
      }
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) fermo = true; else if (fermo) { fermo = false; prima = performance.now(); requestAnimationFrame(giro) } })
  requestAnimationFrame(giro)
  window.pzkkoScena = { scene, camera, renderer, composer, bloom, filtro, h, f, l, M, qualita, fase: () => fase, dpr: () => dpr }

  // ── arrivata: la pagina sotto torna a rispondere (lo fa il caricatore in index.html quando questa promessa si chiude) ──
  if (fase !== 'fatto') await new Promise((ok) => { arrivata = ok })
  root.dataset.scena = 'pronta'
  const sec = (x) => ((x - t0) / 1000).toFixed(1)
  console.info(`scena 3D: costruita in ${sec(tCostruita)} s, vista in ${sec(tPronta)} s, arrivata in ${sec(performance.now())} s (${qualita}, ${dpr.toFixed(2)}×${telefono ? ', telefono' : ''})`)

  // ?glb=1: la scena così com'è, in glTF binario, da aprire in Blender (File › Import › glTF); l'esportatore si scarica solo qui
  if (q.get('glb') !== null) {
    const { GLTFExporter } = await import('./lib/gltf.js')
    new GLTFExporter().parse(scene, (glb) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' })); a.download = 'pzkko.glb'; a.click()
    }, (e) => console.warn('glTF non esportato', e), { binary: true, onlyVisible: false })
  }
}
