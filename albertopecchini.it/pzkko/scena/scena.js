// La scena 3D della home di pzkko.it: la saracinesca coi volantini diventa un
// posto vero, disegnato dalla scheda grafica con three.js (lib/three.js): doghe,
// insegna, porta a vetri, marciapiede bagnato, i palazzi di fronte, il sole di
// Mantova a quest'ora e di notte l'insegna, la lampada e le auto che passano.
//
// La telecamera è fissa davanti alla vetrina e sale e scende con lo scorrimento
// della pagina; l'inquadratura è calcolata perché la saracinesca 3D stia
// esattamente dove sta il muro nel DOM: così la pagina di sempre resta sotto,
// invisibile, e continua a fare tutto (link, tagliandi, giochi, mosche), e qui
// si disegna soltanto. Prove: ?muro=1 (niente 3D), ?allinea=1 (il DOM in
// trasparenza sopra la scena), ?qualita=bassa, ?glb=1 (scarica la scena in glTF
// per Blender), più quelle della pagina (?ora=18:30, ?veloce=60, ?notte=1, ?auto=1).
import * as T from './lib/three.js'
import { costruisci, prossimoFotogramma } from './mondo.js'
import { fogli } from './fogli.js'
import { luci } from './luci.js'

const DISTANZA = 2.6 // la telecamera, dalla saracinesca (metri)

export async function avvia() {
  const root = document.documentElement, q = new URLSearchParams(location.search)
  const parete = document.querySelector('.parete'), muro = document.querySelector('.muro'), strada = document.querySelector('.strada'), portale = document.querySelector('.portale')
  if (!parete || !muro) return
  // il foglio di stile della scena (lo carica la pagina insieme a questo modulo) deve esserci prima della tela
  await new Promise((r) => { const l = document.querySelector('link[href="/scena/scena.css"]'); if (!l || l.sheet) return r(); l.addEventListener('load', r, { once: true }); l.addEventListener('error', r, { once: true }) })
  const tela = document.createElement('canvas')
  tela.className = 'scena-tela'
  tela.setAttribute('aria-hidden', 'true')
  const renderer = new T.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance', alpha: false })
  const qualita = q.get('qualita') || 'alta'
  renderer.setPixelRatio(Math.min(devicePixelRatio, qualita === 'alta' ? 2 : 1))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = T.PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.toneMapping = T.AgXToneMapping
  renderer.outputColorSpace = T.SRGBColorSpace

  // ── le misure: la parete in unità (1280 di larghezza), la saracinesca in metri ──
  const u = muro.offsetWidth / 1280
  const Hp = (parete.offsetHeight / u) * (2.048 / 1280)
  const M = { K: 2.048 / 1280, W: 2.048, H: Math.max(Hp, 3.2), Hp }

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 220)
  camera.position.set(M.W / 2, 1.6, DISTANZA)
  scene.add(camera)

  const h = await costruisci(scene, M, { palazzi: qualita !== 'bassa' })
  const f = await fogli(scene, M)
  const l = luci(scene, renderer, h, M)

  // ── il post-processing: anti-alias MSAA, il bagliore dei neon, i colori ──
  const target = new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: qualita === 'bassa' ? 0 : 4 })
  const composer = new T.EffectComposer(renderer, target)
  composer.addPass(new T.RenderPass(scene, camera))
  const bloom = new T.UnrealBloomPass(new T.Vector2(1, 1), 0.55, 0.5, 1.0)
  if (qualita !== 'bassa') composer.addPass(bloom)
  composer.addPass(new T.OutputPass())
  if (qualita === 'bassa') { h.vetro.getRenderTarget().setSize(384, 384); h.pozze.getRenderTarget().setSize(256, 128) }

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

  // ── il giro ────────────────────────────────────────────────────────────────
  let prima = performance.now(), fermo = false, tempi = [], regolato = qualita !== 'alta'
  const giro = (now) => {
    if (fermo) return
    requestAnimationFrame(giro)
    const dt = Math.min((now - prima) / 1000, 0.1)
    prima = now
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
    // se la macchina non ce la fa, dopo due secondi si abbassa la risoluzione
    if (!regolato) {
      tempi.push(dt)
      if (tempi.length > 90) {
        regolato = true
        const media = tempi.slice(30).reduce((a, b) => a + b, 0) / (tempi.length - 30)
        if (media > 0.03) { renderer.setPixelRatio(1); misura(); h.vetro.getRenderTarget().setSize(384, 384); h.pozze.getRenderTarget().setSize(256, 128); console.info('scena 3D: qualità ridotta', (media * 1000).toFixed(0), 'ms a fotogramma') }
      }
    }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) fermo = true; else if (fermo) { fermo = false; prima = performance.now(); requestAnimationFrame(giro) } })

  // ── si parte: la pagina sotto diventa invisibile, la scena davanti ─────────
  document.body.appendChild(tela)
  root.classList.add('scena3d')
  if (q.get('allinea') !== null) root.classList.add('scena-allinea')
  misura()
  inquadra()
  requestAnimationFrame(giro)
  window.pzkkoScena = { scene, camera, renderer, composer, bloom, h, f, l, M }
  root.dataset.scena = 'pronta'

  // ?glb=1: la scena così com'è, in glTF binario, da aprire in Blender (File › Import › glTF)
  if (q.get('glb') !== null) {
    new T.GLTFExporter().parse(scene, (glb) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' })); a.download = 'pzkko.glb'; a.click()
    }, (e) => console.warn('glTF non esportato', e), { binary: true, onlyVisible: false })
  }
}
