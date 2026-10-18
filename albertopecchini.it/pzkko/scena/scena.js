// La scena 3D della home di pzkko.it: la saracinesca coi volantini diventa un
// posto vero, disegnato dalla scheda grafica con three.js (lib/three.js): doghe,
// insegna, porta a vetri, marciapiede bagnato, i palazzi di fronte, il sole di
// Mantova a quest'ora e di notte l'insegna, la lampada e le auto che passano.
//
// La telecamera è fissa davanti alla vetrina e sale e scende con lo scorrimento
// della pagina; l'inquadratura è calcolata perché la saracinesca 3D stia
// esattamente dove sta il muro nel DOM: così la pagina di sempre resta sotto,
// invisibile, e continua a fare tutto (link, tagliandi, giochi, mosche), e qui
// si disegna soltanto. Mentre si scarica e si costruisce, la pagina mostra lo
// schermo di caricamento (html.scena-carico, messo dal caricatore in index.html):
// la scena compare solo quando è pronta e già compilata, senza scatti.
// Prove: ?muro=1 (niente 3D), ?allinea=1 (il DOM in trasparenza sopra la scena),
// ?qualita=alta|media|bassa, ?glb=1 (scarica la scena in glTF per Blender), più
// quelle della pagina (?ora=18:30, ?veloce=60, ?notte=1, ?auto=1).
import * as T from './lib/three.js'
import { costruisci, prossimoFotogramma } from './mondo.js'
import { fogli } from './fogli.js'
import { luci } from './luci.js'

const DISTANZA = 2.6 // la telecamera, dalla saracinesca (metri)

// La qualità di partenza: dalla scheda grafica, se si lascia riconoscere. Le
// integrate (Intel, Apple, Mali, Adreno) e gli emulatori partono da «media»;
// poi, se i primi fotogrammi sono lenti, si scende comunque.
const qualitaIniziale = (renderer, chiesta) => {
  if (chiesta) return chiesta
  const gl = renderer.getContext()
  const d = gl.getExtension('WEBGL_debug_renderer_info')
  const nome = d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : ''
  if (/SwiftShader|llvmpipe|Mesa|Mali|Adreno|PowerVR|Apple GPU|Intel|Iris|UHD|HD Graphics/i.test(nome)) return 'media'
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'media'
  return 'alta'
}

export async function avvia({ avanzamento = () => {} } = {}) {
  const root = document.documentElement, q = new URLSearchParams(location.search)
  const parete = document.querySelector('.parete'), muro = document.querySelector('.muro'), strada = document.querySelector('.strada'), portale = document.querySelector('.portale')
  if (!parete || !muro) throw new Error('manca la parete')
  const t0 = performance.now()
  // il foglio di stile della scena (lo carica la pagina insieme a questo modulo) deve esserci prima della tela
  await new Promise((r) => { const l = document.querySelector('link[href="/scena/scena.css"]'); if (!l || l.sheet) return r(); l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }) })
  const tela = document.createElement('canvas')
  tela.className = 'scena-tela'
  tela.setAttribute('aria-hidden', 'true')
  const renderer = new T.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance', alpha: false })
  let qualita = qualitaIniziale(renderer, q.get('qualita'))
  const DPR = { alta: 1.5, media: 1, bassa: 1 }
  renderer.setPixelRatio(Math.min(devicePixelRatio, DPR[qualita] ?? 1))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.toneMapping = T.AgXToneMapping
  renderer.outputColorSpace = T.SRGBColorSpace
  avanzamento(0.05, 'la scheda grafica')

  // ── le misure: la parete in unità (1280 di larghezza), la saracinesca in metri ──
  // (si misurano sulla pagina com'è prima del 3D: il muro largo 1280 o quel che ci sta)
  const u = muro.offsetWidth / 1280
  const Hp = (parete.offsetHeight / u) * (2.048 / 1280)
  const M = { K: 2.048 / 1280, W: 2.048, H: Math.max(Hp, 3.2), Hp }
  if (!Number.isFinite(M.H)) throw new Error(`misure: muro ${muro.offsetWidth} px, parete ${parete.offsetHeight} px`)

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 220)
  camera.position.set(M.W / 2, 1.6, DISTANZA)
  scene.add(camera)

  // il posto e i fogli si costruiscono insieme (le immagini dei fogli arrivano in parallelo)
  const [h, f] = await Promise.all([
    costruisci(scene, M, { palazzi: qualita !== 'bassa' }).then((x) => { avanzamento(0.35, 'il posto'); return x }),
    fogli(scene, M, (arrivate, chieste) => avanzamento(0.1 + 0.5 * (arrivate / Math.max(1, chieste)), 'i volantini')),
  ])
  const l = luci(scene, renderer, h, M)
  avanzamento(0.7, 'le luci')

  // ── il post-processing: anti-alias MSAA, il bagliore dei neon, i colori ──
  const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: qualita === 'alta' ? 4 : qualita === 'media' ? 2 : 0 })
  const composer = new T.EffectComposer(renderer, target)
  composer.addPass(new T.RenderPass(scene, camera))
  const bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), 0.55, 0.5, 1.0)
  bloom.enabled = qualita !== 'bassa'
  composer.addPass(bloom)
  composer.addPass(new T.OutputPass())
  const SPECCHI = { alta: [768, 512], media: [512, 256], bassa: [384, 192] }
  const specchi = (liv) => { const [v, p] = SPECCHI[liv]; h.vetro.getRenderTarget().setSize(v, v); h.pozze.getRenderTarget().setSize(p, p / 2) }
  specchi(qualita)
  if (qualita !== 'alta') { l.sole.shadow.mapSize.set(1024, 1024); l.sole.shadow.map?.dispose(); l.sole.shadow.map = null }

  // ── il muro del DOM si sposta (scena.css) e la pagina si allunga sopra e sotto ──
  root.classList.add('scena3d')
  if (q.get('allinea') !== null) root.classList.add('scena-allinea')
  const misura = () => {
    const w = innerWidth, hh = innerHeight
    renderer.setSize(w, hh, false)
    composer.setSize(w, hh)
    bloom.setSize(w, hh)
    // lo spazio in più da scorrere, sopra (l'insegna) e sotto (il marciapiede)
    const px = muro.offsetWidth / M.W // pixel per metro sul piano della saracinesca
    portale.style.height = `${Math.round(1.3 * px)}px`
    portale.style.padding = '0'
    strada.style.paddingBottom = `${Math.round(1.35 * px)}px`
  }
  addEventListener('resize', misura)
  misura()

  // ── l'inquadratura: la saracinesca 3D dove sta il muro del DOM ─────────────
  // Il piano z = 0 va sullo schermo con una proiezione decentrata (la telecamera
  // sta un po' a destra e più in basso del centro dell'inquadratura, come una
  // persona ferma sul marciapiede con l'obiettivo decentrabile), così i pixel
  // della parete coincidono con quelli del DOM e i rilievi hanno la prospettiva.
  camera.updateProjectionMatrix = () => {}
  const inquadra = () => {
    const rm = muro.getBoundingClientRect()
    const vw = innerWidth, vh = innerHeight
    const f = rm.width / M.W
    const cx = M.W / 2 - (rm.left + rm.width / 2 - vw / 2) / f
    const cy = M.H - (vh / 2 - rm.top) / f
    const camX = cx + 0.3, camY = 0.75 + 0.55 * cy
    camera.position.set(camX, camY, DISTANZA)
    const n = camera.near, far = camera.far, hw = vw / (2 * f), hv = vh / (2 * f)
    camera.projectionMatrix.makePerspective((cx - hw - camX) * n / DISTANZA, (cx + hw - camX) * n / DISTANZA, (cy + hv - camY) * n / DISTANZA, (cy - hv - camY) * n / DISTANZA, n, far)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }

  // ── un fotogramma ──────────────────────────────────────────────────────────
  const fotogramma = (now, dt) => {
    const stato = l.aggiorna(now, dt)
    f.aggiorna(dt, now)
    inquadra()
    renderer.shadowMap.needsUpdate = true
    // il bagliore: di giorno solo le cose davvero accecanti, di notte i neon e le lampade
    bloom.threshold = 1.5 + 2 * (1 - stato.buio); bloom.strength = 0.12 + 0.25 * stato.buio
    // di notte la lampada decide le ombre, di giorno il sole: la mappa di chi è spento non si rifà
    l.sole.castShadow = stato.giorno > 0.02 && stato.notte < 0.98
    h.lampada.castShadow = h.lampada.intensity > 0
    composer.render()
    prossimoFotogramma()
  }

  // ── gli shader si compilano prima di mostrare la scena, poi tre fotogrammi a vuoto ──
  // (la prima volta che un materiale si disegna il browser compila il suo programma:
  // decine di programmi insieme sono i secondi di scatti all'inizio)
  document.body.appendChild(tela)
  misura(); inquadra()
  avanzamento(0.75, 'gli shader')
  await renderer.compileAsync(scene, camera)
  avanzamento(0.9, 'le ombre e i riflessi')
  for (let i = 0; i < 3; i++) { fotogramma(performance.now(), 1 / 60); await new Promise((r) => requestAnimationFrame(r)) }
  avanzamento(1, 'pronta')

  // ── il giro ────────────────────────────────────────────────────────────────
  let prima = performance.now(), fermo = false, tempi = [], regolato = qualita === 'bassa'
  const giro = (now) => {
    if (fermo) return
    requestAnimationFrame(giro)
    const dt = Math.min((now - prima) / 1000, 0.1)
    prima = now
    fotogramma(now, dt)
    // se la macchina non ce la fa, dopo un secondo si scende di un gradino (e poi di un altro)
    if (!regolato) {
      tempi.push(dt)
      if (tempi.length >= 45) {
        const media = tempi.slice(15).reduce((a, b) => a + b, 0) / (tempi.length - 15)
        tempi = []
        if (media > 0.028) {
          qualita = qualita === 'alta' ? 'media' : 'bassa'
          renderer.setPixelRatio(Math.min(devicePixelRatio, DPR[qualita])); specchi(qualita); bloom.enabled = qualita !== 'bassa'; misura()
          console.info(`scena 3D: ${(media * 1000).toFixed(0)} ms a fotogramma, qualità ${qualita}`)
          if (qualita === 'bassa') regolato = true
        } else regolato = true
      }
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) fermo = true; else if (fermo) { fermo = false; prima = performance.now(); requestAnimationFrame(giro) } })
  requestAnimationFrame(giro)
  window.pzkkoScena = { scene, camera, renderer, composer, bloom, h, f, l, M, qualita: () => qualita }
  root.dataset.scena = 'pronta'
  console.info(`scena 3D pronta in ${((performance.now() - t0) / 1000).toFixed(1)} s (qualità ${qualita})`)

  // ?glb=1: la scena così com'è, in glTF binario, da aprire in Blender (File › Import › glTF); l'esportatore si scarica solo qui
  if (q.get('glb') !== null) {
    const { GLTFExporter } = await import('./lib/gltf.js')
    new GLTFExporter().parse(scene, (glb) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' })); a.download = 'pzkko.glb'; a.click()
    }, (e) => console.warn('glTF non esportato', e), { binary: true, onlyVisible: false })
  }
}
