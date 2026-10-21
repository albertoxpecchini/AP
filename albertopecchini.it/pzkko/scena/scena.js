// La scena 3D della home di pzkko.it: la saracinesca coi volantini diventa un
// posto vero, disegnato dalla scheda grafica con three.js (lib/three.js): doghe,
// insegna, porta a vetri, marciapiede bagnato, i palazzi di fronte, il sole di
// Mantova a quest'ora e di notte l'insegna, la lampada e le auto che passano.
//
// L'arrivo è il caricamento: appena le anteprime sono a bordo (le foto dei
// volantini e le trame per terra in piccolo, pochi KB) la strada si vede da
// lontano, già tutta, leggerissima; poi la telecamera si avvicina quanto è
// arrivata la risoluzione piena, e quando è arrivata all'inquadratura di sempre è
// tutto nitido. Da lì è fissa davanti
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
import { acqua } from './acqua.js'
import { bestie } from './bestie.js'
import { spazzatura } from './spazzatura.js'
import { meteo, METEO } from './meteo.js'
import { REGIA } from './materiali.js'

// I livelli di qualità (niente anti-alias in nessuno). dpr = la risoluzione interna rispetto ai pixel CSS, che non
// scende mai: è lei che decide se le immagini sono nitide, il resto si può togliere; specchi = la tela del vetro e
// delle pozzanghere; ombra = la mappa del sole; bloom = la risoluzione del bagliore rispetto ai pixel CSS (0 = niente);
// luci = «tutte» o «poche» (mondo.js).
const LIVELLI = {
  alta: { dpr: 1.25, specchi: [768, 1024], ombra: 2048, bloom: 1, luci: 'tutte' },
  media: { dpr: 1, specchi: [512, 384], ombra: 1024, bloom: 0.5, luci: 'poche' },
  bassa: { dpr: 1, specchi: [256, 256], ombra: 1024, bloom: 0, luci: 'poche', palazzi: false },
  telefono: { dpr: 1.5, specchi: [384, 384], ombra: 1024, bloom: 1, luci: 'poche' },
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

// l'arrivo: quanto si resta fermi da lontano appena la strada compare, quanto dura il volo almeno (anche con tutto già
// in cache), dopo quanto si arriva comunque se la risoluzione piena non è ancora tutta a bordo; quanto si aspettano le
// anteprime al massimo, dietro l'anteprima della pagina, prima di mostrare la scena lo stesso
const ATTESA_MIN = 500, ATTESA_MAX = 20000, VOLO = 2600, CARICO_MAX = 25000, FOTO_PIENA = 1500
// a che punto è (il caricatore in index.html): fin qui i moduli, la costruzione, gli shader, le anteprime; il resto è
// la risoluzione piena, mentre la telecamera si avvicina
const CARICO = { moduli: 0.1, costruita: 0.25, shader: 0.35, anteprime: 0.45 }
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
  // la telecamera, dalla saracinesca, quando è arrivata (sul computer dal 21.10 è più indietro, 3,1 m invece di 2,6, e la
  // parete del DOM è più stretta, scena.css: si vede più strada; col mouse sul fronte del negozio si avvicina, sotto)
  const DIST = telefono ? 1.6 : 3.1

  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(40, 1, 0.05, 220)
  scene.add(camera)
  // (prima i fogli: chiedono le foto, che si scaricano e decodificano per conto loro mentre il posto si costruisce,
  // due secondi di trame disegnate al volo)
  // (e insieme la spazzatura per terra col chiusino di pzkkonet, che non dipende dal resto)
  const [f, h, sp] = await Promise.all([fogli(scene, M, renderer), costruisci(scene, M, { palazzi: liv.palazzi !== false, poche: liv.luci === 'poche' }), spazzatura(scene, M)])
  const l = luci(scene, renderer, h, M)
  // la condensa che scende sulla lamiera (il bagnato sui materiali l'hanno già mondo.js e fogli.js)
  const a = acqua(scene, M, h, f)
  // le formiche, le mosche, le zanzare e le blatte (al posto dei disegni piatti della pagina)
  const b = bestie(scene, M, h, f, { ridotto: matchMedia('(prefers-reduced-motion: reduce)').matches })
  // il meteo di Mantova: il cielo, la nebbia, le gocce e i fiocchi, il bagnato (meno gocce dove la scheda è più piccola)
  const me = meteo(scene, camera, M, h, { quante: qualita === 'alta' ? 1 : 0.55 })
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
  // AgX porta verso il pastello tutto quello che è molto saturo e molto acceso: il rosso del neon diventava salmone.
  // Per quei pixel (i tubi, la loro luce, i fanali; la carta e i muri non arrivano così in alto, di giorno nemmeno i
  // manifesti rossi al sole) si mescola una curva che tiene la tinta: il colore diviso per il suo massimo, alla
  // Reinhard; il cuore più acceso schiarisce verso un bianco caldo, come nelle foto dei neon veri
  uscita.material.fragmentShader = uscita.material.fragmentShader
    .replace('gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );', 'gl_FragColor.rgb = agxNeon( gl_FragColor.rgb );')
    .replace('void main() {', `vec3 agxNeon( vec3 c ) {
      vec3 a = AgXToneMapping( c ), e = max( c * toneMappingExposure, 0.0 );
      float mx = max( max( e.r, e.g ), e.b ), mn = min( min( e.r, e.g ), e.b );
      float k = smoothstep( 0.55, 0.85, ( mx - mn ) / max( mx, 1e-5 ) ) * smoothstep( 0.3, 1.2, mx );
      vec3 t = min( e * ( 1.3 / ( 1.0 + 0.7 * mx ) ), 1.0 );
      t = mix( t, vec3( 1.0, 0.88, 0.72 ), 0.4 * smoothstep( 5.0, 16.0, mx ) );
      return mix( a, t, k );
    }
    void main() {`)
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
  // (la parete si legge senza la scala della vetrina, sotto: il rettangolo è quello di base)
  const rileggi = () => {
    if (vetrina.messa) parete.style.transform = 'none'
    const r = parete.getBoundingClientRect(); sx = scrollX; sy = scrollY; base.x = r.left + sx; base.y = r.top + sy; base.w = r.width
    if (vetrina.messa) parete.style.transform = `scale(${vetrina.z.toFixed(4)})`
  }
  // ── la vetrina: col mouse sul fronte del negozio (saracinesca, insegna, porta) la telecamera si avvicina di ZOOM volte
  // (un carrello, non uno zoom: l'angolo di campo resta quello e la porta e il marciapiede girano come camminando),
  // tenendo fermo quello che sta sotto il puntatore, come una lente: quello che c'è intorno si allarga attorno a lui. La
  // parete del DOM si scala dello stesso fattore attorno allo stesso punto (transform su .parete), così i link e i
  // tagliandi restano pixel per pixel sotto i volantini. Solo col mouse, a scena arrivata (col tocco non c'è «sopra»,
  // e sul telefono la parete è già vicina). La regia può spegnerla (REGIA.vetrina) ──
  const ZOOM = 1.25
  const vetrina = { z: 1, v: 0, ox: 0, oy: 0, dentro: false, messa: false }
  const aggiornaVetrina = (dt) => {
    const p = pClient
    let dentro = false
    if (p && !p.tocco && fase === 'fatto' && !telefono && REGIA.vetrina !== false) {
      // il punto sotto il puntatore sul piano della saracinesca, con la parete com'è adesso (il piano è lineare sullo
      // schermo: niente raggi); un po' d'isteresi sul bordo
      const z = vetrina.z, fpm = (base.w * z) / M.W
      const x = (p.x - (base.x - sx + (1 - z) * vetrina.ox)) / fpm, y = M.H - (p.y - (base.y - sy + (1 - z) * vetrina.oy)) / fpm
      const m = vetrina.dentro ? 0.15 : 0
      dentro = x > h.fronte.x0 - 0.15 - m && x < h.fronte.x1 + 0.15 + m && y > -0.1 - m && y < h.insegna.top + 0.3 + m
      if (dentro) {
        // il centro della lente: il puntatore, in pixel della parete non scalata (lì sta l'origine della transform);
        // insegue in fretta, e da ferma (z = 1) si mette lì subito
        const tx = p.x - (base.x - sx), ty = p.y - (base.y - sy)
        const k = z < 1.001 ? 1 : 1 - Math.exp(-dt / 0.06)
        vetrina.ox += (tx - vetrina.ox) * k; vetrina.oy += (ty - vetrina.oy) * k
      }
    }
    vetrina.dentro = dentro
    // una molla smorzata (critica) verso 1 o ZOOM: parte e arriva piano, in ~0,7 s
    const meta = dentro ? ZOOM : 1
    vetrina.v += (30 * (meta - vetrina.z) - 11 * vetrina.v) * dt
    vetrina.z += vetrina.v * dt
    if (Math.abs(vetrina.z - meta) < 0.0005 && Math.abs(vetrina.v) < 0.002) { vetrina.z = meta; vetrina.v = 0 }
    if (vetrina.z > 1.0005) { parete.style.transformOrigin = `${vetrina.ox.toFixed(1)}px ${vetrina.oy.toFixed(1)}px`; parete.style.transform = `scale(${vetrina.z.toFixed(4)})`; vetrina.messa = true }
    else if (vetrina.messa) { parete.style.transform = ''; parete.style.transformOrigin = ''; vetrina.messa = false }
  }
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
  // vicino: la saracinesca 3D dove sta la parete del DOM, pixel per pixel (la parete com'è sullo schermo: scalata di z
  // attorno a (ox, oy) dalla vetrina, e la telecamera a DIST / z: un carrello, l'angolo di campo non cambia)
  const vicino = () => {
    const z = vetrina.z, w = base.w * z, fpm = w / M.W
    const left = base.x - sx + (1 - z) * vetrina.ox, top = base.y - sy + (1 - z) * vetrina.oy
    const cx = M.W / 2 - (left + w / 2 - dim.w / 2) / fpm
    const cy = M.H - (dim.h / 2 - top) / fpm
    const camX = cx + (telefono ? 0.1 : 0.3), camY = Math.max(ALTEZZA_MIN, telefono ? cy - 0.2 : 0.75 + 0.55 * cy)
    return { d: DIST / z, wx: cx, wy: cy, hv: dim.h / (2 * fpm), ox: camX - cx, oy: camY - cy }
  }
  // lontano: dall'altra parte del marciapiede, ad altezza d'occhio, tutto il negozio nell'inquadratura; si avvicina piano
  // e respira. Sul telefono la saracinesca è alta 12 m e da lontano sembrerebbe una fessura: si inquadra la parte alta
  // (l'insegna e i primi fogli), con la telecamera già lassù.
  // Dal 21.10 la telecamera da lontano sta in un punto fisso, che non dipende dalla forma della finestra: la finestra
  // decide solo quanto del piano della saracinesca si vede intorno al negozio (il rettangolo che lo contiene, allargato
  // di RESPIRO). Così la foto del caricamento (index.html, fatta da tools/pzkko/scena/carico.mjs una volta per tutte,
  // larga quanto la finestra più larga) è un ritaglio esatto del primo fotogramma su qualunque schermo: dove finisce la
  // foto comincia la scena, pixel per pixel. Prima la distanza seguiva l'angolo di campo dell'arrivo, che cambia con la
  // forma della finestra. Finché la tela non si vede, e per FOTO ms dopo (la foto che sfuma sopra), la telecamera sta
  // ferma lì; poi respira. ?finestra=<metri> (per carico.mjs) dà l'altezza del rettangolo invece della finestra
  let tVista = 0
  const RESPIRO = 1.22, TAN_LONTANO = telefono ? 0.64 : 0.38, FOTO = 300
  const finestra = Number(q.get('finestra')) || 0, fotoCarico = q.get('carico') === 'foto'
  const scatola = () => {
    const bx0 = telefono ? -0.55 : -0.7, bx1 = telefono ? M.W + 0.55 : h.fronte.x1 + 0.7
    const by0 = telefono ? M.H - 2.4 : -0.45, by1 = h.insegna.top + (telefono ? 0.7 : 0.6)
    return { wx: (bx0 + bx1) / 2, wy: (by0 + by1) / 2, bw: (bx1 - bx0) / 2, bh: (by1 - by0) / 2 }
  }
  const lontano = (now) => {
    const { wx, wy, bw, bh } = scatola()
    const hv0 = finestra ? finestra / 2 : RESPIRO * Math.max(bh, bw / (dim.w / dim.h)), D = (RESPIRO * bh) / TAN_LONTANO
    const tt = visibile && !fotoCarico ? Math.max(0, now - tVista - FOTO) / 1000 : 0
    const k = (1 + 0.22 * Math.exp(-tt / 4)) / RESPIRO
    const camY = (telefono ? wy - 0.4 : 1.65) + 0.03 * Math.sin(tt * 0.9)
    return { d: D * k, wx, wy, hv: hv0 * k, ox: 0.05 * Math.sin(tt * 0.55), oy: camY - wy }
  }
  // il volo: la telecamera va dritta (il centro si sposta in proporzione alla distanza, come in un volo in linea
  // retta) e la distanza cala in scala logaritmica, così l'avvicinamento ha sempre la stessa velocità a vista; l'angolo di
  // campo va da quello di lontano a quello dell'arrivo con la stessa legge (da lontano dipende dalla finestra, sopra)
  const vola = (a, b, s) => {
    const d = Math.exp(Math.log(a.d) + (Math.log(b.d) - Math.log(a.d)) * s)
    const k = Math.abs(a.d - b.d) < 1e-6 ? 1 - s : (d - b.d) / (a.d - b.d)
    const mix = (x, y) => y + (x - y) * k, tanB = b.hv / b.d
    return { d, wx: mix(a.wx, b.wx), wy: mix(a.wy, b.wy), hv: d * tanB * (a.hv / a.d / tanB) ** k, ox: mix(a.ox, b.ox), oy: mix(a.oy, b.oy) }
  }
  // (pzkko-subito: la ricarica dopo un contesto perso che non è tornato, sotto; una volta sola)
  let subito = false
  try { subito = sessionStorage.getItem('pzkko-subito') === '1'; sessionStorage.removeItem('pzkko-subito') } catch {}
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches || q.get('intro') === '0' || subito
  // c'è la foto del caricamento sopra la tela (index.html): il meteo resta quello della foto finché non sfuma
  const conFoto = !ridotto && !!window.pzkkoFotoCarico
  let fase = ridotto ? 'fatto' : 'lontano', tVia = 0, prontiFogli = false, anteprimePronte = false, salta = false, visibile = false, arrivata = () => {}
  f.pronti.then(() => { prontiFogli = true })
  let tAnteprime = 0
  f.anteprime.then(() => { anteprimePronte = true; tAnteprime = performance.now(); sp.vere() })
  // toccare, scorrere o premere un tasto mentre si guarda da lontano fa partire subito (ma la telecamera arriva solo
  // quando è arrivato tutto: all'arrivo dev'essere tutto nitido, senza foto che cambiano dopo)
  const fretta = () => { salta = true }
  for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, fretta, { passive: true, once: true })
  // quanta risoluzione piena è a bordo (0..1): le foto vere dei volantini e le trame vere per terra
  const pieno = () => 0.8 * f.avanzamento() + 0.2 * sp.avanzamento()
  // l'avvicinamento: s insegue la meta, che è quanto è a bordo ma non più di quanto il volo abbia già fatto (VOLO), e
  // non torna mai indietro; la telecamera va con liscia(s): parte e arriva piano, si ferma piano se aspetta una foto
  let sVolo = 0, ultimaPosa = 0
  const posa = (now) => {
    const b = vicino()
    if (fase === 'fatto') return b
    const dt = Math.min(0.1, Math.max(0, (now - (ultimaPosa || now)) / 1000)); ultimaPosa = now
    if (fase === 'lontano') {
      // (finché la tela non si vede si resta da lontano: il tempo si conta da quando la strada compare; mai mentre la foto
      // del caricamento sfuma sopra, nemmeno con la fretta; per carico.mjs, ?carico=foto, mai)
      const attesa = visibile ? now - tVista : 0
      if (visibile && !fotoCarico && (attesa > ATTESA_MIN || (salta && attesa > FOTO))) { fase = 'avvicina'; tVia = now }
      else return lontano(now)
    }
    const meta = Math.min(now - tVia > ATTESA_MAX ? 1 : pieno(), (now - tVia) / VOLO)
    sVolo = Math.min(1, Math.max(sVolo, sVolo + (meta - sVolo) * (1 - Math.exp(-dt / 0.25))))
    if (meta >= 1 && sVolo > 0.99) { fase = 'fatto'; arrivata(); return b }
    return vola(lontano(now), b, liscia(sVolo))
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
  // (epoca: quante volte la scheda grafica ha ridato il contesto, sotto; una compilazione partita prima non vale più)
  let compilando = null, epoca = 0
  const fotogrammaDopo = () => new Promise((r) => requestAnimationFrame(r))
  // (cedere senza aspettare un fotogramma: il browser, se è ora, disegna il pomodoro del caricamento e poi si riprende
  // subito; scheduler.yield dove c'è, se no un messaggio a sé stessi, che non ha i 4 ms minimi di setTimeout)
  const canale = new MessageChannel()
  const cedi = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise((r) => { canale.port1.onmessage = () => r(); canale.port2.postMessage(0) }))
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
    const prima = l.attuale(), e = epoca
    for (const pezzo of pezziDaCompilare()) {
      if (e !== epoca || renderer.getContext().isContextLost()) return
      l.metti(nome)
      pezzo()
      renderer.setRenderTarget(null)
      if (prima) l.metti(prima)
      // (subito: tutto di fila, ma cedendo fra un pezzo e l'altro: tutto insieme era un secondo e più di pagina ferma, col
      // pomodoro del caricamento immobile)
      await (subito ? cedi() : fotogrammaDopo())
    }
    // i programmi si aspettano uno per uno (la scheda compila in parallelo, per conto suo)
    while (e === epoca && !renderer.info.programs.every((p) => p.isReady())) await fotogrammaDopo()
    if (e === epoca) compilati.add(nome)
  }
  // l'insieme che serve è cambiato: si mette se è compilato, se no si compila (e si mette al fotogramma in cui è pronto)
  const cambia = (nome) => {
    if (compilati.has(nome)) return l.metti(nome)
    if (!compilando) compilando = compila(nome).catch((e) => console.warn('scena 3D: luci non compilate', e)).finally(() => { compilando = null })
    return false
  }

  // ── il puntatore nel mondo, per le bestie: dove il raggio dalla telecamera tocca la saracinesca (1 cm davanti) o,
  // più in basso, il marciapiede. Anche il tocco sul telefono (pointerdown); veloce = più di 0,8 px/ms ──
  let pClient = null, pT = 0, pVeloce = 0
  const segui = (e) => { if (pClient) pVeloce = Math.hypot(e.clientX - pClient.x, e.clientY - pClient.y) / Math.max(1, e.timeStamp - pT); pClient = { x: e.clientX, y: e.clientY, tocco: e.pointerType !== 'mouse' }; pT = e.timeStamp }
  addEventListener('pointermove', segui, { passive: true })
  addEventListener('pointerdown', segui, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { pClient = null })
  const origine = new T.Vector3(), raggio = new T.Vector3()
  const puntatore = () => {
    // (un tocco vale qualche secondo, poi il dito non è più lì)
    if (!pClient || (pClient.tocco && performance.now() - pT > 2500)) return null
    camera.updateMatrixWorld()
    origine.setFromMatrixPosition(camera.matrixWorld)
    raggio.set((pClient.x / dim.w) * 2 - 1, 1 - (pClient.y / dim.h) * 2, 0.5).unproject(camera).sub(origine).normalize()
    const veloce = pVeloce > 0.8 && performance.now() - pT < 150
    let t = (0.01 - origine.z) / raggio.z
    const x = origine.x + raggio.x * t, y = origine.y + raggio.y * t
    if (y >= 0 || raggio.y >= 0) return { x, y, z: 0.01, suolo: false, veloce }
    t = -origine.y / raggio.y
    return { x: origine.x + raggio.x * t, y: 0, z: origine.z + raggio.z * t, suolo: true, veloce }
  }
  const bestieCtx = { vista: { x0: 0, x1: 1, y0: 0, y1: 1 }, puntatore: null, buio: 0, fari: 0, telecamera: camera.position, lampada: h.lampadina.position, insegna: h.lettere.centri.testo, blatte: q.has('blatte') }

  // ── un fotogramma ──────────────────────────────────────────────────────────
  let n = 0
  const ultimoSole = new T.Vector3()
  const fotogramma = (now, dt) => {
    const stato = l.aggiorna(now, dt)
    f.aggiorna(dt, now)
    a.aggiorna(dt, now); a.luce(stato.buio)
    const acceso = stato.insieme !== l.attuale() && cambia(stato.insieme)
    aggiornaVetrina(dt)
    const mossa = metti(posa(now))
    // le bestie: il muro che si vede è quello dell'inquadratura di arrivo (da lontano si vedrebbe tutto il negozio)
    const v = vicino(), asp = dim.w / dim.h
    Object.assign(bestieCtx.vista, { x0: v.wx - v.hv * asp, x1: v.wx + v.hv * asp, y0: v.wy - v.hv, y1: v.wy + v.hv })
    bestieCtx.puntatore = puntatore(); bestieCtx.buio = stato.buio; bestieCtx.fari = stato.fari
    b.aggiorna(dt, now, bestieCtx)
    h.negozio?.aggiorna(now, bestieCtx.vista)
    sp.aggiorna()
    // (il meteo resta quello della foto del caricamento finché la foto non è sfumata: poi va verso quello vero, piano)
    me.aggiorna(dt, now, { buio: stato.buio, lampioni: stato.lampioni, vista: bestieCtx.vista, tieni: fotoCarico || (conFoto && (!visibile || now - tVista < FOTO)) })
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
    // il bagliore: solo quando fa buio (di giorno non c'è niente di così acceso, e costa); con la nebbia le luci si
    // allargano (l'alone dei lampioni nella nebbia)
    bloom.enabled = liv.bloom > 0 && stato.buio > 0.15 && REGIA.bagliore > 0
    bloom.threshold = (1.5 + 2 * (1 - stato.buio)) * (1 - 0.35 * METEO.nebbia)
    bloom.strength = (0.12 + 0.25 * stato.buio) * (1 + 1.2 * METEO.nebbia) * REGIA.bagliore
    // (la regia può spegnere gli specchi: il vetro e le pozzanghere)
    h.vetro.visible = h.pozze.visible = REGIA.specchi
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

  // ── dietro l'anteprima della pagina: la scena gira già (la tela è trasparente) e carica le anteprime sulla scheda.
  // Quando sono tutte a bordo (o dopo CARICO_MAX) la tela compare in dissolvenza (scena.css) con la telecamera da
  // lontano, e dopo un attimo l'avvicinamento, che va con la risoluzione piena ──
  let vista = () => {}, chiesta = false
  const mostra = (now) => {
    tVista = now
    vista()
    visibile = true
    root.classList.add('scena-vista')
    carico(CARICO.anteprime)
    console.info(`scena 3D: anteprime a bordo in ${((now - t0) / 1000).toFixed(1)} s${anteprimePronte ? '' : ' (non tutte: troppo tempo)'}`)
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
    if (fermo || perso) return
    requestAnimationFrame(giro)
    const dt = Math.min((now - prima) / 1000, 0.1)
    prima = now
    const p0 = renderer.info.programs?.length ?? 0, a = performance.now()
    fotogramma(now, dt)
    if (!visibile) {
      carico(CARICO.shader + (CARICO.anteprime - CARICO.shader) * f.anteprima())
      // (per la foto del caricamento, ?carico=foto, la tela si fa vedere solo con tutto a piena risoluzione. Sotto la foto
      // del caricamento solo coi fogli già comparsi del tutto (la dissolvenza dei fogli che arrivano, che dal nero non si
      // vedeva, sotto la foto li farebbe sparire e ricomparire) e, se arriva entro FOTO_PIENA ms dalle anteprime, con la
      // risoluzione piena: la foto è nitida, le anteprime da 128 px sul telefono no. Intanto la foto è lì, ferma e identica)
      // Pronta, non si mostra da sola: lo dice al caricamento (window.pzkkoScoppia, index.html), che finisce di far maturare
      // il pomodoro, lo fa scoppiare sulla telecamera e risponde quando la macchia copre lo schermo: lì sotto la tela
      // compare di colpo. Intanto si continua a disegnare da lontano, a tela nascosta
      const piene = f.avanzamento() >= 1 && sp.avanzamento() >= 1
      if (!chiesta && ((fotoCarico ? prontiFogli && piene && !f.inMoto(now) : (anteprimePronte && !(conFoto && (f.inMoto(now) || (!piene && now - tAnteprime < FOTO_PIENA))))) || now - tPronta > CARICO_MAX)) {
        chiesta = true
        carico(CARICO.anteprime)
        const vai = () => mostra(performance.now())
        Promise.resolve(window.pzkkoScoppia?.()).then(vai, vai)
      }
    } else if (fase !== 'fatto') carico(CARICO.anteprime + (0.99 - CARICO.anteprime) * pieno())
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
  document.addEventListener('visibilitychange', () => { if (document.hidden) fermo = true; else if (fermo && !perso) { fermo = false; prima = performance.now(); requestAnimationFrame(giro) } })
  requestAnimationFrame(giro)

  // ── la scheda grafica perde il contesto (un driver che si pianta, la memoria che finisce, un'altra pagina 3D che se la
  // prende): three lo tiene (preventDefault) e, quando il browser lo ridà, rifà da sé trame, geometrie e tele. Qui il resto:
  // ci si ferma (disegnare o compilare su un contesto perso non serve e può lanciare errori), e al ritorno si ricompila
  // tutto in parallelo come all'inizio (lasciati a three, i ~130 programmi si compilerebbero uno per uno al primo
  // fotogramma, secondi fermi), si rifanno il cielo come ambiente, le ombre e gli specchi, e si riparte da dove si era.
  // Prima la tela restava nera e bisognava ricaricare da zero. Se il contesto non torna entro 8 s si ricarica, ma senza
  // l'arrivo (sessionStorage pzkko-subito), e la pagina torna dov'era. ?perdi=1 lo prova: perso dopo 3 s, ridato dopo 1
  let perso = false, attesaRitorno = 0
  tela.addEventListener('webglcontextlost', () => {
    perso = true
    console.warn('scena 3D: la scheda grafica ha perso il contesto, aspetto che torni')
    clearTimeout(attesaRitorno)
    attesaRitorno = setTimeout(() => { try { sessionStorage.setItem('pzkko-subito', '1') } catch {} location.reload() }, 8000)
  })
  tela.addEventListener('webglcontextrestored', async () => {
    clearTimeout(attesaRitorno)
    const t = performance.now()
    epoca++; compilati.clear(); compilando = null
    l.rifai(); n = 0; dim.w = 0; misura()
    const ins = l.aggiorna(performance.now(), 1 / 60).insieme
    l.metti(ins)
    await compila(ins, { subito: true })
    l.sole.shadow.needsUpdate = true; h.lampada.shadow.needsUpdate = true
    perso = false
    if (!fermo) { prima = performance.now(); requestAnimationFrame(giro) }
    console.info(`scena 3D: contesto ridato, ricompilata in ${((performance.now() - t) / 1000).toFixed(1)} s`)
  })
  if (q.get('perdi') !== null) {
    const ext = renderer.getContext().getExtension('WEBGL_lose_context')
    setTimeout(() => { ext?.loseContext(); setTimeout(() => ext?.restoreContext(), 1000) }, 3000)
  }
  // (lontano: la scatola dell'inquadratura da lontano, per carico.mjs: la foto del caricamento la ritaglia con questi numeri)
  window.pzkkoScena = { scene, camera, renderer, composer, bloom, h, f, l, a, b, sp, me, meteo: METEO, M, qualita, liv, vetrina, fase: () => fase, dpr: () => dpr, insieme: () => l.attuale(),
    lontano: { ...scatola(), respiro: RESPIRO, d: (RESPIRO * scatola().bh) / TAN_LONTANO } }

  // ── arrivata: la pagina sotto torna a rispondere (lo fa il caricatore in index.html quando questa promessa si chiude) ──
  if (!visibile) await new Promise((ok) => { vista = ok })
  if (fase !== 'fatto') await new Promise((ok) => { arrivata = ok })
  carico(1)
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
