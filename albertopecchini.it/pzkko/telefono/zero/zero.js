// Il cercapersone «zero» in 3D (29.10, Alberto: «voglio lui come mockup, deve aprirsi con le stesse logiche, quando lo apro
// zoom sullo schermo e mettici pzk os, retroill arancione e sfondi arancioni, le icone tieni le mie, anche il cavo della
// ricarica nel posto giusto, è in 3d mi raccomando»; poi: «non fare una finestra sopra il modello 3d… il modello ha
// trasparenza quindi lo schermo lo metti esattamente dove è nel modello»): il gadget bianco coi tasti arancioni, dal mockup
// di Rhino (tools/pzkko/zero/modello.mjs → art/zero/zero.glb), disegnato con three.js (lib/three.js) dentro il dialog del
// cercapersone (telefono.js). Dal 31.10 è il cercapersone di tutti (Alberto: «fai che cercapersone zero è predefinito e
// quello attuale si elimina per sempre»): fino ad allora si comprava nello shop e agli altri restava quello nero.
//
// LO SCHERMO È NEL 3D: pzk os (os/os.js) disegna su un lcd 256 × 128 a un bit la cui tela (768 × 384) è la trama di un
// piano appoggiato dove nel modello sta il modulo lcd, SOTTO il vetro, che è trasparente e riflette la stanza: niente
// HTML sopra la tela. I tasti 3D (la croce, OK, INDIETRO) si premono col mouse (il raggio) e si vedono abbassare; la
// tastiera vera arriva da telefono.js. INDIETRO tenuto tre secondi spegne (Alberto).
//
// Come sta nello spazio: il modello è in millimetri con Y l'asse lungo, X quello corto (X− il bordo di sopra) e Z lo
// spessore (Z+ il fronte); qui il gruppo è girato di −90° attorno a z, così nel mondo x va a destra (la Y del modello),
// y in su (−X del modello) e z verso chi guarda. Lo schermo di vetro va da x −0,1 a 39,1 e da y 5,5 a 29,5 (il fronte a
// z 2,1, il fondo a 0,7); l'lcd (LCD) riempie la finestra meno un bordo scuro di 0,8 mm. La croce sta a x 40–63, OK in
// mezzo a lei, INDIETRO a x 61,5–69,5 in basso; il led (il tubicino, «led») a x 40–43 y 5,5–8,7; la porta usb-c è il
// foro in mezzo alla testata destra (x 76, y 5–14,5, z −10,5–−6); la scritta sul fronte sta sotto lo schermo.
//
// Le due pose della telecamera, e il volo fra l'una e l'altra (telefono.js, ingrandisci/rimpicciolisci):
// - MURO: la vista di tre quarti del tasto sul muro (art/zero/zero-piccolo.webp, la stessa scena fotografata da
//   tools/pzkko/zero/foto.mjs): aprendo, la tela a tutta finestra disegna il cercapersone ESATTAMENTE dove sta il tasto
//   (anche storto come lui: la telecamera ruota di quei gradi), il tasto si nasconde e nessuno vede il cambio.
// - APERTO: la vista «zoom sullo schermo»: la telecamera guarda dritta sul fronte (il piano dell'immagine parallelo al
//   fronte: lo schermo si proietta in un rettangolo esatto) ma sta spostata a destra oltre la testata, così si vede la
//   testata destra con la porta usb-c e il cavo che entra. La cornice dell'inquadratura è centrata sul cercapersone.
// Il tronco di piramide della telecamera si scrive a mano (makePerspective coi quattro lati): così la vista fuori asse
// è una proiezione qualunque, e fra le due pose si interpola posizione, rotazione e i quattro lati.
//
//   crea({ dlg, ledEl })   → rig, con: pronto (il modello è arrivato), muro(tasto), apri(), chiudi(tasto), cavo(si),
//                            luce(v), premi(nome, verso), lascia(nome), misura(), onTasto, onFuori, ferma(), riprendi(), distruggi()
import * as T from './lib/three.js'
import { lcd as LCD_OS } from './os/os.js'
import * as luce from './luce.js'
import * as impostazioni from './os/impostazioni.js'

export const GLB = '/art/zero/zero.glb'
// l'lcd acceso, dentro il vetro (mm, nel mondo): come nei render ufficiali del Flipper (Alberto, 29.10: «vedi che ho ragione
// io?») riempie tutta la finestra del vetro (24 × 39,2, angoli stondati di 3 mm) meno un bordo scuro di 0,8 mm:
// 37,6 × 22,4 mm. I 256 × 128 pixel di pzk os ci si stendono sopra. Gli angoli del modulo: 2,2 mm (raggio). Sta a z 0,9,
// sotto il vetro (che va da 0,7 a 2,1) e sopra il labbro della cornice (0,7)
export const LCD = { x0: 0.7, x1: 38.3, y0: 6.3, y1: 28.7, z: 0.9, raggio: 2.2 }
export const RAPPORTO_MURO = 336 / 194 // la foto sul muro ha le proporzioni del tasto di prima
const PUNTA = 7.4 // quanto entra la punta d'argento
// la porta usb-c: il foro in mezzo alla testata destra (x 76), 9,5 × 4,5 mm a y 5–14,5 e z −10,5–−6 (il forellino in basso,
// a y −2, è quello del laccetto, con la sua staffa «Mount» dietro). USB: dove sta la cima della punta a cavo inserito (il
// corpo tocca la testata a x 76,3)
const USB = { x: 76.3 - PUNTA, y: 9.25, z: -8.4 } // (il buco sondato nel modello, prova.mjs --sonda: y 4,6–13,9, z −10,1–−6,6)
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const PIENO = matchMedia('(max-width:700px),(max-height:520px)')
const V3 = (x, y, z) => new T.Vector3(x, y, z)
const lerp = (a, b, t) => a + (b - a) * t

// ── le curve di tempo (le stesse cubic-bezier del cercapersone vecchio) ──
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx
  return (x) => { let t = x; for (let i = 0; i < 6; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d } return Y(Math.max(0, Math.min(1, t))) }
}
const APRE = bezier(0.6, 0, 0.25, 1), CHIUDE = bezier(0.6, 0, 0.3, 1), DOLCE = bezier(0.42, 0, 0.58, 1)

/** La scritta «PZKKO» sulla fascia di sotto, come il logo «FLIPPER» stampato sul Flipper vero (Alberto, 29.10: «la scritta
 *  deve essere fatta così… pzkko sta solo sul lato sotto non a cavallo della smussatura»): lettere a pixel, maiuscole,
 *  inclinate, PIENE (i pixel si toccano, il bordo resta a gradini), coi tratti spessi tre celle e gli angoli esterni
 *  smussati. Disegnata qui a blocchi, niente carattere da caricare: uguale sul muro fotografato e dal vivo. Una tela
 *  1024 × 192 per un piano 32 × 6 mm (la fascia inclinata a 30° sotto il fronte, dal profilo del guscio): una cella è 0,45 mm. */
function scritta() {
  const cv = document.createElement('canvas')
  cv.width = 1024; cv.height = 192
  const g = cv.getContext('2d')
  const GLIFI = {
    P: ['.######.', '########', '###..###', '###..###', '########', '#######.', '###.....', '###.....', '###.....', '###.....'],
    Z: ['.#######', '########', '.....###', '....###.', '...###..', '..###...', '.###....', '###.....', '########', '#######.'],
    K: ['###..###', '###.###.', '###.##..', '######..', '#####...', '######..', '###.##..', '###.###.', '###..###', '###...##'],
    O: ['.######.', '########', '###..###', '###..###', '###..###', '###..###', '###..###', '###..###', '########', '.######.'],
  }
  const C = 32 * 0.45 // una cella in pixel della tela (32 px per mm)
  const testo = 'PZKKO', larg = (testo.length * 10 - 2) * C, x0 = (cv.width - larg - 2.5 * C) / 2, y0 = (cv.height - 10 * C) / 2
  g.fillStyle = '#f08a2a'
  ;[...testo].forEach((l, i) => GLIFI[l].forEach((riga, r) => [...riga].forEach((c, k) => {
    if (c !== '#') return
    const inclina = (9 - r) * 0.28 * C // l'italico: le righe in alto scivolano a destra
    const x = x0 + (i * 10 + k) * C + inclina
    g.fillRect(Math.round(x), Math.round(y0 + r * C), Math.ceil(C) + 1, Math.ceil(C) + 1) // (celle piene, che si toccano)
  })))
  const t = new T.CanvasTexture(cv)
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8
  return t
}

export function crea({ dlg, ledEl }) {
  const W = () => innerWidth, H = () => innerHeight
  const tela = document.createElement('canvas')
  tela.className = 'z-tela'
  dlg.prepend(tela)

  const renderer = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = T.NeutralToneMapping
  renderer.toneMappingExposure = 0.7 // (Alberto: «è troppo luminoso il modello 3d»)
  renderer.shadowMap.enabled = true
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(30, 1, 5, 2000)

  // ── LA LUCE È QUELLA DEL SITO (luce.js; Alberto: «la luce che spara addosso al modello deve essere = a quella del sito…
  // luci lì e luci qui»): il sole di Mantova a quest'ora (direzione, colore, forza), il cielo come luce diffusa, e di notte
  // la lampada a muro sopra la saracinesca e i fari dell'auto che passa (le stesse variabili che accendono il muro). Per i
  // riflessi, l'ambiente: le sei facce fotografate nella scena 3D della home se c'è, se no il cielo disegnato con l'ora ──
  const sole = new T.DirectionalLight(0xffffff, 0)
  sole.castShadow = true
  sole.shadow.mapSize.set(1024, 1024)
  sole.shadow.camera.left = -80; sole.shadow.camera.right = 80; sole.shadow.camera.top = 80; sole.shadow.camera.bottom = -80
  sole.shadow.camera.near = 20; sole.shadow.camera.far = 700
  sole.shadow.bias = -0.0004; sole.shadow.normalBias = 0.25
  sole.target.position.set(26, 14, -10)
  scene.add(sole, sole.target)
  const cielo = new T.HemisphereLight(0xcfe0ff, 0x4a3a2a, 0.4)
  scene.add(cielo)
  const lampada = new T.PointLight(0xffe4c0, 0, 0, 2) // la lampada a muro (il colore di scena/mondo.js): in alto a sinistra, sopra la saracinesca
  lampada.position.set(-40, 120, 140)
  scene.add(lampada)
  const auto = new T.PointLight(0xffe2aa, 0, 0, 2) // i fari dell'auto che passa, davanti e in basso, da sinistra a destra
  auto.position.set(26, -110, 360)
  scene.add(auto)
  const pmrem = new T.PMREMGenerator(renderer)
  let ambiente = null
  const mettiAmbiente = (t) => { if (ambiente) ambiente.dispose(); ambiente = t; scene.environment = t; scene.environmentIntensity = 0.9; sporco = true }
  let luceChiave = '', ambienteT = 0, catturaT = 0
  // la foto del tasto sul muro è scattata con una luce fissa di giorno (FISSA): all'apertura il 3D parte con quella (così
  // non si vede il cambio) e passa alla luce vera del sito durante il volo (luceMescola 0 → 1); al ritorno il contrario
  const FISSA = { sole: { el: 0.8, dir: V3(-0.35, 0.75, 0.56).normalize() }, giorno: 0.85, buio: 0, notte: 0, lampioni: 0, insegna: 0, auto: { x: 0.5, l: 0, c: [1, 0.89, 0.67] } }
  let luceMescola = 1
  function aggiornaLuce(forza = false) {
    const vera = luce.stato(), m = luceMescola
    const s = m >= 1 ? vera : m <= 0 ? FISSA : { sole: { el: lerp(FISSA.sole.el, vera.sole.el, m), dir: FISSA.sole.dir.clone().lerp(vera.sole.dir, m).normalize() }, giorno: lerp(FISSA.giorno, vera.giorno, m), buio: vera.buio * m, notte: vera.notte * m, lampioni: vera.lampioni, insegna: vera.insegna, auto: { ...vera.auto, l: vera.auto.l * m } }
    const d = s.sole.dir
    sole.position.set(26 + d.x * 400, 14 + d.y * 400, -10 + d.z * 400)
    sole.intensity = 2.3 * s.giorno
    const basso = Math.max(0, Math.min(1, 1 - Math.sin(Math.max(0, s.sole.el)) * 4)) // il sole basso è rosso
    sole.color.setRGB(1, 0.93 - 0.3 * basso, 0.84 - 0.5 * basso)
    cielo.color.setRGB(0.72 - 0.6 * s.buio, 0.82 - 0.68 * s.buio, 1 - 0.78 * s.buio)
    cielo.groundColor.setRGB(0.35 - 0.28 * s.buio, 0.3 - 0.24 * s.buio, 0.26 - 0.2 * s.buio)
    cielo.intensity = 0.55 * (1 - s.buio) + 0.1
    lampada.intensity = 15000 * s.notte * Math.max(s.lampioni, 0.35)
    auto.intensity = 150000 * s.auto.l
    auto.position.x = 26 + (s.auto.x - 0.5) * 520
    auto.color.setRGB(s.auto.c[0], s.auto.c[1], s.auto.c[2])
    const chiave = [s.giorno, s.buio, s.notte, s.lampioni, s.auto.l, s.auto.x, m].map((v) => v.toFixed(2)).join()
    if (chiave === luceChiave && !forza) return
    luceChiave = chiave; sporco = true
    const ora = performance.now()
    if (m >= 1 && window.pzkkoScena && ora - catturaT > 1500) { catturaT = ora; if (ambienteReale()) return }
    if (ora - ambienteT < 350 && !forza) return
    ambienteT = ora
    const t = new T.CanvasTexture(luce.cielo(s))
    t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace
    mettiAmbiente(pmrem.fromEquirectangular(t).texture)
    t.dispose()
  }
  /** Le sei facce della scena 3D della home dal punto del cercapersone (luce.cattura) → l'ambiente. → false se non si può */
  function ambienteReale() {
    const facce = luce.cattura(64)
    if (!facce) return false
    try {
      const cubo = new T.CubeTexture(facce.map((b) => new T.DataTexture(b, 64, 64, T.RGBAFormat, T.UnsignedByteType)))
      cubo.format = T.RGBAFormat; cubo.type = T.UnsignedByteType; cubo.colorSpace = T.SRGBColorSpace; cubo.needsUpdate = true
      mettiAmbiente(pmrem.fromCubemap(cubo).texture)
      cubo.dispose()
      return true
    } catch (e) { console.warn('ambiente dalla scena', e); return false }
  }
  // (la prima aggiornaLuce la fanno muro(), riprendi() e fotografa(): qui sotto `sporco` non esiste ancora)

  // ── il cercapersone: il modello girato nel mondo (vedi in cima), dentro un perno sul suo centro che s'inclina leggermente
  // verso il mouse (Alberto: «in base a dove metto il mouse si inclini leggermente in tutte le angolazioni»; si spegne
  // nelle impostazioni). Nel corpo stanno anche l'lcd, la scritta e la spina: s'inclinano insieme ──
  const PIVOT = V3(26.15, 13.7, -10.25)
  const inclinazione = new T.Group()
  inclinazione.position.copy(PIVOT)
  const corpo = new T.Group()
  corpo.position.copy(PIVOT).negate()
  inclinazione.add(corpo)
  scene.add(inclinazione)
  const dispositivo = new T.Group()
  dispositivo.rotation.z = -Math.PI / 2
  corpo.add(dispositivo)
  let inclinaVerso = { x: 0, y: 0 }, aperto = false
  function inclinaPasso() {
    const i = impostazioni.leggi().inclina && aperto ? inclinaVerso : { x: 0, y: 0 }
    const nx = inclinazione.rotation.x + (i.x - inclinazione.rotation.x) * 0.1, ny = inclinazione.rotation.y + (i.y - inclinazione.rotation.y) * 0.1
    if (Math.abs(nx - inclinazione.rotation.x) > 1e-4 || Math.abs(ny - inclinazione.rotation.y) > 1e-4) { inclinazione.rotation.x = nx; inclinazione.rotation.y = ny; sporco = true }
  }
  const pezzi = {} // nome → mesh
  const tasti = {} // croce, ok, indietro: { mesh, centro }

  // i materiali: i colori di riferimento di Alberto (il mockup bianco coi tasti arancioni); il vetro è vetro: trasparente,
  // con la stanza riflessa sopra, e sotto c'è l'lcd
  const M = {
    bianco: new T.MeshPhysicalMaterial({ color: 0xf6f5f2, roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45 }),
    nero: new T.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.55 }),
    arancio: new T.MeshStandardMaterial({ color: 0xf28a2b, roughness: 0.5 }),
    metallo: new T.MeshStandardMaterial({ color: 0x8c8c90, roughness: 0.35, metalness: 0.9 }),
    ir: new T.MeshPhysicalMaterial({ color: 0x2a0806, roughness: 0.2, clearcoat: 1 }),
    vetro: new T.MeshPhysicalMaterial({ color: 0x1a1a1a, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.22, depthWrite: false, envMapIntensity: 1.6 }),
    led: new T.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, emissive: 0xff2d1e, emissiveIntensity: 0 }),
    oro: new T.MeshStandardMaterial({ color: 0xd9ad4c, roughness: 0.3, metalness: 1 }),
    stampa: new T.MeshStandardMaterial({ color: 0xc9c3b6, roughness: 0.6 }),
  }
  const MATERIALE = { 'guscio-sopra': 'bianco', 'guscio-sotto': 'bianco', cornice: 'nero', croce: 'arancio', ok: 'arancio', indietro: 'arancio', usb: 'metallo', ir: 'ir', vetro: 'vetro', led: 'led', oro: 'oro', stampa: 'stampa' }

  // l'lcd dentro il vetro: la tela di pzk os (os/lcd.js, 768 × 384), ricopiata qui dentro un rettangolo con gli angoli
  // stondati del modulo; sotto il vetro trasparente, sopra il labbro della cornice. Si aggiorna quando pzk os ridisegna
  const lcdTela = document.createElement('canvas')
  lcdTela.width = 768; lcdTela.height = 384
  const lcdG = lcdTela.getContext('2d')
  const lcdTex = new T.CanvasTexture(lcdTela)
  lcdTex.colorSpace = T.SRGBColorSpace; lcdTex.anisotropy = 8
  const lcd = new T.Mesh(new T.PlaneGeometry(LCD.x1 - LCD.x0, LCD.y1 - LCD.y0), new T.MeshBasicMaterial({ map: lcdTex, toneMapped: false, transparent: true }))
  lcd.position.set((LCD.x0 + LCD.x1) / 2, (LCD.y0 + LCD.y1) / 2, LCD.z)
  lcd.renderOrder = 1
  corpo.add(lcd)
  function disegnaLcd() {
    const w = lcdTela.width, h = lcdTela.height
    lcdG.clearRect(0, 0, w, h)
    lcdG.beginPath(); lcdG.roundRect(0, 0, w, h, (LCD.raggio / (LCD.x1 - LCD.x0)) * w)
    lcdG.save(); lcdG.clip()
    lcdG.drawImage(LCD_OS.canvas, 0, 0, w, h)
    lcdG.restore()
    lcdTex.needsUpdate = true
    sporco = true
    avvia()
  }
  const smetti = [LCD_OS.ascolta(disegnaLcd)] // (chi smettere di ascoltare in distruggi)

  // la spina usb-c e il cavo (Alberto, 23.10: «il cavo si inserisca e faccia lo scatto che entra tutto, tipo si inclina
  // per entrare meglio»; 29.10: «la presa deve entrare centratissima al buco… dal cavo esce un cilindro stondato… sembra
  // stondato anche sul basamento di plastica nero il connettore»): la linguetta d'argento con la sezione dell'usb-c vero
  // (un rettangolo coi lati corti a semicerchio, in piedi), il corpo nero squadrato appena smussato, la guaina che si
  // stringe dal corpo al filo (a sezione quadrata, non un cilindro), il filo che scende fuori dall'inquadratura.
  // Il perno sta sulla cima della punta (si gira attorno a lei, come prima); il gruppo `spina` si sposta lungo x
  const spina = new T.Group()
  const perno = new T.Group()
  spina.add(perno)
  {
    const r = 1.25, a = 8.3 / 2 - r // la sezione: 8,3 × 2,5 mm
    const sez = new T.Shape()
    sez.moveTo(r, -a); sez.lineTo(r, a); sez.absarc(0, a, r, 0, Math.PI, false); sez.lineTo(-r, -a); sez.absarc(0, -a, r, Math.PI, 2 * Math.PI, false)
    const punta = new T.Mesh(new T.ExtrudeGeometry(sez, { depth: PUNTA, bevelEnabled: false, curveSegments: 10 }), new T.MeshStandardMaterial({ color: 0xc4c6cc, roughness: 0.3, metalness: 0.95 }))
    punta.rotation.y = Math.PI / 2 // l'estrusione va lungo x (da 0 a PUNTA); il lato lungo della sezione resta in y
    const nero = new T.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.55, metalness: 0.15 })
    const corpo = new T.Mesh(new T.RoundedBoxGeometry(18, 11.6, 6.2, 3, 0.9), nero)
    corpo.position.set(PUNTA + 9, 0, 0)
    const guaina = new T.RoundedBoxGeometry(9, 8.6, 5.6, 3, 1.6)
    { const p = guaina.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getX(i) + 4.5) / 9; p.setY(i, p.getY(i) * (1 - 0.42 * t)); p.setZ(i, p.getZ(i) * (1 - 0.25 * t)) } guaina.computeVertexNormals() }
    const gommino = new T.Mesh(guaina, new T.MeshStandardMaterial({ color: 0x232427, roughness: 0.8 }))
    gommino.position.set(PUNTA + 18 + 4.5, 0, 0)
    // il filo (Alberto, 29.10: «fai un cavo più lungo almeno il triplo che esca dalla pagina»): 60 cm invece di 16, la
    // stessa curva morbida e poi giù dritto, così la fine non si vede mai, in nessuna finestra e in nessun momento del volo
    const via = new T.CatmullRomCurve3([V3(PUNTA + 26, 0, 0), V3(PUNTA + 38, -0.5, 0), V3(PUNTA + 52, -6, 0.5), V3(PUNTA + 64, -24, 1), V3(PUNTA + 72, -60, 1), V3(PUNTA + 76, -140, 1), V3(PUNTA + 78, -260, 1.5), V3(PUNTA + 79, -400, 2), V3(PUNTA + 80, -580, 2)])
    const filo = new T.Mesh(new T.TubeGeometry(via, 160, 1.95, 12, false), new T.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.85 }))
    for (const m of [punta, corpo, gommino, filo]) { m.castShadow = true; m.receiveShadow = true }
    perno.add(punta, corpo, gommino, filo)
  }
  spina.position.set(USB.x, USB.y, USB.z)
  spina.visible = false
  corpo.add(spina)

  // ── il modello ──
  let modello = null
  const pronto = new Promise((ok, no) => {
    new T.GLTFLoader().load(GLB, (g) => {
      modello = g.scene
      modello.traverse((o) => {
        if (!o.isMesh) return
        const nome = o.name
        o.material = M[MATERIALE[nome] ?? 'bianco']
        o.geometry.computeVertexNormals()
        o.castShadow = nome !== 'vetro' && nome !== 'led'
        o.receiveShadow = nome !== 'vetro'
        if (nome === 'vetro') o.renderOrder = 2
        pezzi[nome] = o
        if (nome === 'croce' || nome === 'ok' || nome === 'indietro') {
          // il tasto si gira e si abbassa attorno al suo centro: la geometria si porta nell'origine
          o.geometry.computeBoundingBox()
          const c = o.geometry.boundingBox.getCenter(new T.Vector3())
          o.geometry.translate(-c.x, -c.y, -c.z)
          o.position.copy(c)
          o.material = o.material.clone() // (premuto si scurisce: il colore è suo)
          tasti[nome] = { mesh: o, centro: c, riposo: c.clone(), colore: o.material.color.clone() }
        }
      })
      dispositivo.add(modello)
      // la scritta «PZKKO» sulla fascia di sotto: la fascia inclinata sotto lo smusso del fronte (dal profilo del guscio: da
      // y 1,0 z 1,97 a y −5,5 z −1,78, cioè 30° rispetto al fronte, sondata nel modello con prova.mjs --sonda: la prima volta avevo
      // preso dall'OBJ la parete interna del guscio e la scritta stava 1,4 mm dentro la plastica), un piano appoggiato lì
      const dec = new T.Mesh(new T.PlaneGeometry(32, 6.0), new T.MeshBasicMaterial({ map: scritta(), transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
      dec.position.set(26.5, -2.0 - 0.5 * 0.08, 0.24 + 0.866 * 0.08)
      dec.rotation.x = 0.524
      dec.name = 'scritta'
      corpo.add(dec)
      disegnaLcd()
      ok()
    }, undefined, (e) => no(e))
  })

  // ── la telecamera: una posa è { pos, quat, tronco: [l, r, t, b] } (i lati del tronco a distanza 1) ──
  const NEAR = 5, FAR = 1500
  function applica({ pos, quat, tronco: [l, r, t, b] }) {
    camera.position.copy(pos)
    camera.quaternion.copy(quat)
    camera.updateMatrixWorld(true)
    camera.projectionMatrix.makePerspective(l * NEAR, r * NEAR, t * NEAR, b * NEAR, NEAR, FAR)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    sporco = true
  }
  const fra = (A, B, k) => ({ pos: A.pos.clone().lerp(B.pos, k), quat: A.quat.clone().slerp(B.quat, k), tronco: A.tronco.map((v, i) => lerp(v, B.tronco[i], k)) })
  const CENTRO = V3(26.15, 13.7, -10.25) // il centro del cercapersone
  /** La posa di tre quarti del muro, in un'immagine di proporzioni `rapporto`: la telecamera guarda il centro da
   *  destra-sopra-davanti, e il tronco è simmetrico (il centro del cercapersone in mezzo all'immagine). */
  function posaMuro(rapporto = RAPPORTO_MURO) {
    const az = T.MathUtils.degToRad(-24), el = T.MathUtils.degToRad(17), D = 420
    const pos = V3(CENTRO.x + D * Math.sin(-az) * Math.cos(el), CENTRO.y + D * Math.sin(el), CENTRO.z + D * Math.cos(az) * Math.cos(el))
    const m = new T.Matrix4().lookAt(pos, CENTRO, V3(0, 1, 0))
    const quat = new T.Quaternion().setFromRotationMatrix(m)
    // i limiti del cercapersone proiettati, simmetrici attorno all'asse, con un po' d'aria, e nelle proporzioni chieste
    const inv = new T.Matrix4().compose(pos, quat, V3(1, 1, 1)).invert()
    let u = 0, w = 0
    for (const x of [-23.7, 76]) for (const y of [-6.2, 33.6]) for (const z of [-22.8, 2.3]) { const p = V3(x, y, z).applyMatrix4(inv); u = Math.max(u, Math.abs(p.x / -p.z)); w = Math.max(w, Math.abs(p.y / -p.z)) }
    u *= 1.08; w *= 1.08
    if (u / w < rapporto) u = w * rapporto; else w = u / rapporto
    return { pos, quat, tronco: [-u, u, w, -w] }
  }
  /** La posa del muro «dentro la finestra»: la foto (posaMuro) messa dove sta il tasto, cioè il rettangolo di centro
   *  (cx, cy), misure (w, h) in px della finestra, girato di `giro` radianti (il tasto storto sul muro). */
  function posaMuroFinestra({ cx, cy, w, h, giro = 0 }) {
    const P = posaMuro(w / h)
    const [l, r, t, b] = P.tronco
    const u = (r - l) / w, v = (t - b) / h // un pixel, nel tronco
    const L = l - (cx - w / 2) * u, Tt = t + (cy - h / 2) * v
    const quat = P.quat.clone().multiply(new T.Quaternion().setFromAxisAngle(V3(0, 0, 1), giro))
    return { pos: P.pos, quat, tronco: [L, L + W() * u, Tt, Tt - H() * v] }
  }
  /** La posa aperta: la telecamera dritta davanti al fronte, spostata a destra oltre la testata; l'inquadratura centrata
   *  sul cercapersone, tutto intero quando ci sta. pieno: solo lo schermo, a tutta larghezza (il cellulare). */
  function posaAperta({ pieno = false } = {}) {
    const w = W(), h = H()
    let x0, x1, yc
    if (pieno) { x0 = LCD.x0 - 0.5; x1 = LCD.x1 + 0.5; yc = (LCD.y0 + LCD.y1) / 2 }
    else {
      // la cornice, centrata sul cercapersone (un filo a destra: oltre la testata c'è la spina): tutto il cercapersone con
      // un po' d'aria (104,5 mm) se ci stanno almeno 19 px per mm (lo schermo ≥ 700 px), se no più stretta, e le testate
      // escono dai bordi; alta almeno quanto il cercapersone (36 mm visibili) quando la finestra lo permette
      const fw = Math.min(104.5, Math.max((36 * w) / h, w / 19))
      x0 = 32 - fw / 2; x1 = 32 + fw / 2; yc = 13.7
    }
    const fh = (x1 - x0) * (h / w)
    const Zp = 2.3, D = 150
    const pos = V3(Math.max(x1, 76) + 22, yc + 7, Zp + D) // a destra oltre la testata, un filo sopra
    const tronco = [(x0 - pos.x) / D, (x1 - pos.x) / D, (yc + fh / 2 - pos.y) / D, (yc - fh / 2 - pos.y) / D]
    return { pos, quat: new T.Quaternion(), tronco }
  }

  // ── il disegno: solo quando serve (sporco), e sempre durante i voli, il cavo e il led ──
  let sporco = true, animazioni = 0, fermo = false, raf = 0
  const dpr = () => Math.min(2, devicePixelRatio || 1)
  function misuraTela() {
    renderer.setPixelRatio(dpr())
    renderer.setSize(W(), H(), false)
    sporco = true
  }
  let luceT = 0
  function disegna() {
    raf = 0
    if (fermo) return
    const t = performance.now()
    ledPasso(t)
    inclinaPasso()
    if (t - luceT > 120) { luceT = t; aggiornaLuce() } // la luce del sito cambia da sola (la sera, l'auto che passa)
    if (sporco || animazioni > 0) { renderer.render(scene, camera); sporco = false }
    raf = requestAnimationFrame(disegna)
  }
  const avvia = () => { if (!raf && !fermo) raf = requestAnimationFrame(disegna) }

  // ── il led: come quello del cercapersone vecchio, dalle classi dell'elemento (.on lampeggia piano, .lavora sfarfalla);
  // spento nelle impostazioni, resta spento ──
  let ledOn = false, ledLavora = false, ledUltimo = -1, ledVoluto = impostazioni.leggi().led
  smetti.push(impostazioni.ascolta((i) => { ledVoluto = i.led; avvia() }))
  function ledPasso(t) {
    let v = 0
    if (!ledVoluto) v = 0
    else if (ledLavora) v = Math.random() < 0.5 ? 1 : 0.15
    else if (ledOn) v = t % 1200 < 600 ? 1 : 0
    if (v !== ledUltimo) { ledUltimo = v; M.led.emissiveIntensity = v * 2.2; sporco = true }
  }
  if (ledEl) { const mo = new MutationObserver(() => { ledOn = ledEl.classList.contains('on'); ledLavora = ledEl.classList.contains('lavora'); avvia() }); mo.observe(ledEl, { attributes: true, attributeFilter: ['class'] }); smetti.push(() => mo.disconnect()) }

  // ── i tasti: col mouse (il raggio sulla tela) e da fuori (premi) ──
  const raggio = new T.Raycaster()
  const ndc = new T.Vector2()
  function colpisci(ev) {
    ndc.set((ev.clientX / W()) * 2 - 1, -(ev.clientY / H()) * 2 + 1)
    raggio.setFromCamera(ndc, camera)
    const hit = raggio.intersectObjects(Object.values(tasti).map((t) => t.mesh), false)[0]
    if (hit) {
      const nome = hit.object.name
      if (nome !== 'croce') return { nome }
      // la croce: la direzione dal centro, nel piano del fronte (nel modello: Y lungo → destra, X → giù)
      const p = hit.object.worldToLocal(hit.point.clone())
      const dx = p.y, dy = -p.x
      return { nome: 'croce', verso: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'dx' : 'sx') : dy > 0 ? 'su' : 'giu' }
    }
    // lo schermo (Alberto, 29.10: «metti per sicurezza anche il click del mouse»): il punto sul piano dell'lcd diventa un
    // pixel di pzk os (la trama è dritta: u da sinistra, v dal basso), e pzk os preme la zona che c'è lì (os.tocca)
    const sch = raggio.intersectObject(lcd, false)[0]
    if (sch?.uv) return { nome: 'lcd', verso: { x: Math.floor(sch.uv.x * 256), y: Math.floor((1 - sch.uv.y) * 128) } }
    if (modello && raggio.intersectObject(modello, true).length) return { nome: 'corpo' }
    return null
  }
  const rig = {
    pronto, tela, camera, scene,
    onTasto: () => {}, onFuori: () => {}, cliccabile: () => false, // (cliccabile(x, y): c'è una zona di pzk os in quel pixel? la mette telefono.js)
    /** Il tasto si abbassa e si scurisce (la croce si inclina dal lato premuto): finché non si lascia (tieni), o per 110 ms. */
    premi(nome, verso, { tieni = false } = {}) {
      const t = tasti[nome]
      if (!t) return
      const m = t.mesh
      m.position.copy(t.riposo); m.rotation.set(0, 0, 0)
      if (nome === 'croce' && verso) { const a = 0.07; if (verso === 'dx') m.rotation.x = -a; else if (verso === 'sx') m.rotation.x = a; else if (verso === 'su') m.rotation.y = -a; else m.rotation.y = a; m.position.z = t.riposo.z - 0.25 } // (nel modello: X è l'asse giù)
      else m.position.z = t.riposo.z - 0.9
      m.material.color.copy(t.colore).multiplyScalar(0.72)
      sporco = true; avvia()
      clearTimeout(t.timer)
      if (!tieni) t.timer = setTimeout(() => rig.lascia(nome), 110)
    },
    lascia(nome) {
      const t = tasti[nome]
      if (!t) return
      clearTimeout(t.timer)
      t.mesh.position.copy(t.riposo); t.mesh.rotation.set(0, 0, 0); t.mesh.material.color.copy(t.colore); sporco = true; avvia()
    },
  }
  // INDIETRO (Alberto: «indietro premo una volta, spegni 3 secondi premuto indietro»): premuto e lasciato è una mossa
  // indietro; tenuto premuto TRE SECONDI spegne (onTasto('spegni')), e lasciandolo dopo non fa niente
  const TENUTA = 3000
  let giu = null, tenuta = 0
  tela.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    giu = colpisci(e)
    if (giu && giu.nome !== 'corpo') rig.premi(giu.nome, giu.verso, { tieni: true }) // (giù finché non si lascia)
    clearTimeout(tenuta)
    if (giu?.nome === 'indietro') tenuta = setTimeout(() => { tenuta = 0; giu = { nome: 'spento' }; rig.lascia('indietro'); rig.onTasto('spegni') }, TENUTA) // (spento: lasciandolo, anche fuori dal cercapersone, non fa più niente; prima era un clic fuori e chiudeva una seconda volta saltando il saluto)
  })
  const lascia = (e) => {
    clearTimeout(tenuta); tenuta = 0
    const su = e.type === 'pointerup' ? colpisci(e) : null, g = giu
    giu = null
    if (g && g.nome !== 'corpo' && g.nome !== 'spento') rig.lascia(g.nome)
    if (e.type !== 'pointerup') return
    if (!g) { if (!su) rig.onFuori(); return }
    if (g.nome === 'corpo' || g.nome === 'spento') return
    if (g.nome === 'lcd') { if (su?.nome === 'lcd' && Math.abs(su.verso.x - g.verso.x) < 6 && Math.abs(su.verso.y - g.verso.y) < 6) rig.onTasto('lcd', g.verso); return } // (il clic sullo schermo: giù e su nello stesso punto)
    if (su && su.nome === g.nome && (g.nome !== 'croce' || su.verso === g.verso)) rig.onTasto(g.nome, g.verso)
  }
  tela.addEventListener('pointerup', lascia)
  tela.addEventListener('pointercancel', lascia)
  let sopraTimer = 0
  tela.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || sopraTimer) return
    // l'inclinazione verso il mouse: poco (±5° in su e in giù, ±7° di lato)
    inclinaVerso = { x: (e.clientY / H() - 0.5) * 0.17, y: (e.clientX / W() - 0.5) * 0.24 }
    avvia()
    sopraTimer = requestAnimationFrame(() => { sopraTimer = 0; const h = colpisci(e); tela.style.cursor = h && h.nome !== 'corpo' && (h.nome !== 'lcd' || rig.cliccabile(h.verso.x, h.verso.y)) ? 'pointer' : '' })
  })
  tela.addEventListener('pointerleave', () => { inclinaVerso = { x: 0, y: 0 }; avvia() })

  // ── le pose e i voli ──
  let posa = null
  /** Vola da `posa` a `B` in `ms`, con la curva `curva`; ogni fotogramma chiama `passo(k)` se c'è. */
  function vola(B, ms, curva, passo) {
    const A = posa
    posa = B
    if (!A || RIDOTTO.matches || ms <= 0) { applica(B); passo?.(1); return Promise.resolve() }
    animazioni++
    avvia()
    return new Promise((fine) => {
      const t0 = performance.now()
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / ms), e = curva(k)
        applica(fra(A, B, e))
        passo?.(e)
        if (k < 1) requestAnimationFrame(tick)
        else { animazioni--; fine() }
      }
      tick()
    })
  }
  /** Il rettangolo del tasto sul muro: centro, misure e giro, dalla sua trasformazione (è storto, e col mouse sopra un
   *  po' più grande). */
  function rettTasto(tasto) {
    const r = tasto.getBoundingClientRect()
    const m = getComputedStyle(tasto).transform
    let giro = 0, scala = 1
    const mm = m && m !== 'none' && m.match(/matrix\(([^)]+)\)/)
    if (mm) { const [a, b] = mm[1].split(',').map(Number); giro = Math.atan2(b, a); scala = Math.hypot(a, b) }
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: tasto.offsetWidth * scala, h: tasto.offsetHeight * scala, giro }
  }
  Object.assign(rig, {
    posaMuro,
    /** Il cercapersone esattamente sopra il tasto del muro (la stessa foto, dal vivo), e un fotogramma disegnato. */
    async muro(tasto) {
      await pronto
      misuraTela()
      aperto = false; inclinazione.rotation.set(0, 0, 0)
      luceMescola = 0; aggiornaLuce(true)
      posa = posaMuroFinestra(rettTasto(tasto))
      applica(posa)
      tela.classList.add('ombra')
      disegnaLcd()
      renderer.render(scene, camera); sporco = false
      avvia()
    },
    /** Il volo fino alla posa aperta (420 ms). */
    apri({ pieno = PIENO.matches, ms = 420 } = {}) {
      misuraTela()
      const B = posaAperta({ pieno })
      aggiornaLuce(true)
      return pronto.then(() => vola(B, posa ? ms : 0, APRE, (k) => { luceMescola = k; aggiornaLuce(); if (k > 0.5) tela.classList.remove('ombra') })).then(() => { aperto = !pieno; luceMescola = 1; aggiornaLuce(true) })
    },
    /** Il volo di ritorno sul tasto (480 ms). */
    async chiudi(tasto, { ms = 480 } = {}) {
      await pronto
      misuraTela()
      aperto = false; inclinazione.rotation.set(0, 0, 0); inclinaVerso = { x: 0, y: 0 }
      const B = posaMuroFinestra(rettTasto(tasto))
      await vola(B, ms, CHIUDE, (k) => { luceMescola = 1 - k; aggiornaLuce(); if (k > 0.4) tela.classList.add('ombra') })
    },
    /** A finestra ridimensionata, da aperto: la posa aperta rifatta di colpo. */
    misura({ pieno = PIENO.matches } = {}) {
      if (!posa) return
      misuraTela()
      posa = posaAperta({ pieno }); applica(posa)
    },
    /** La retroilluminazione dell'lcd (0–1), con una salita di `ms` (l'accensione in 400 ms). → Promise alla fine */
    luce(v, ms = 0) {
      if (RIDOTTO.matches || ms <= 0) { LCD_OS.accendi(v); LCD_OS.disegna(); return Promise.resolve() }
      const da = LCD_OS.luce, t0 = performance.now()
      animazioni++
      avvia()
      return new Promise((fine) => {
        const tick = () => {
          const k = Math.min(1, (performance.now() - t0) / ms)
          LCD_OS.accendi(lerp(da, v, DOLCE(k))); LCD_OS.disegna()
          if (k < 1) requestAnimationFrame(tick); else { animazioni--; fine() }
        }
        tick()
      })
    },
    /** Il cavo usb-c: con true s'inserisce (1,3 s: arriva da destra inclinato, tocca, si raddrizza cercando il buco,
     *  spinge e SCATTA dentro); con false sparisce. */
    cavo(si) {
      if (!si) { spina.visible = false; sporco = true; avvia(); return }
      spina.visible = true
      const fuori = Math.max(60, (posa ? posa.tronco[1] * 150 + 22 : 0) - USB.x + 40) // ben oltre il bordo destro della finestra
      // [quando, quanto fuori (mm lungo x), inclinazione (°)], con la curva per arrivarci
      const tappe = [[0, fuori, 9, APRE], [0.46, PUNTA * 1.2, 4, DOLCE], [0.6, PUNTA * 0.92, -2.5, DOLCE], [0.7, PUNTA * 0.8, 1.2, DOLCE], [0.8, PUNTA * 0.64, 0, bezier(0.8, 0, 1, 0.5)], [0.88, -0.35, 0, bezier(0.2, 0.8, 0.3, 1)], [1, 0, 0, DOLCE]]
      const metti = (dx, gradi) => {
        spina.position.set(USB.x + dx, USB.y, USB.z)
        perno.rotation.z = T.MathUtils.degToRad(gradi) // si gira attorno alla cima della punta (x = 0 del gruppo)
        sporco = true
      }
      if (RIDOTTO.matches) { metti(0, 0); avvia(); return }
      animazioni++
      avvia()
      const t0 = performance.now(), durata = 1300
      const tick = () => {
        const k = Math.min(1, (performance.now() - t0) / durata)
        let i = 1
        while (i < tappe.length - 1 && tappe[i][0] < k) i++
        const [ka, da, ga] = tappe[i - 1], [kb, db, gb, curva] = tappe[i]
        const e = curva((k - ka) / (kb - ka))
        metti(lerp(da, db, e), lerp(ga, gb, e))
        if (k < 1) requestAnimationFrame(tick); else animazioni--
      }
      tick()
    },
    ferma() { fermo = true; aperto = false; cancelAnimationFrame(raf); raf = 0 },
    riprendi() { fermo = false; sporco = true; aggiornaLuce(true); avvia() },
    distruggi() { rig.ferma(); for (const f of smetti) f(); removeEventListener('resize', aRidimensiona); renderer.dispose(); tela.remove(); if (window.pzkkoZero === rig) window.pzkkoZero = null },
    /** Per foto.mjs: la scena nella posa del muro su una tela a parte, e dove finiscono l'lcd e il led (in frazioni). */
    async fotografa({ w = 1344, h = 776 } = {}) {
      await pronto
      renderer.setPixelRatio(1)
      renderer.setSize(w, h, false)
      posa = posaMuro(w / h)
      applica(posa)
      lcd.visible = false // sulla foto l'lcd non c'è: ci va pzk os vivo (telefono/zero/muro.js)
      inclinazione.rotation.set(0, 0, 0)
      luceMescola = 0; aggiornaLuce(true)
      renderer.render(scene, camera)
      const proietta = (x, y, z) => { const p = V3(x, y, z).project(camera); return [(p.x + 1) / 2, (1 - p.y) / 2] }
      // (i quattro angoli dell'lcd si prendono ALLA SUPERFICIE DEL VETRO, z 2,1: pzk os sul tasto si appoggia lì, dove
      // l'occhio vede lo schermo; a z 0,9 la parallasse della vista di tre quarti lo faceva sembrare storto)
      const ZV = 2.1
      const lcdQuad = [proietta(LCD.x0, LCD.y1, ZV), proietta(LCD.x1, LCD.y1, ZV), proietta(LCD.x1, LCD.y0, ZV), proietta(LCD.x0, LCD.y0, ZV)]
      const led = proietta(41.5, 7.1, 1.9)
      const ledR = proietta(43, 7.1, 1.9)
      return { png: tela.toDataURL('image/png'), w, h, lcd: lcdQuad, led: { x: led[0], y: led[1], r: Math.hypot(ledR[0] - led[0], (ledR[1] - led[1]) * (h / w)) } }
    },
  })
  rig.scritta = (dz = 0) => { const d = scene.getObjectByName('scritta'); if (!d) return null; d.position.z += dz; d.updateWorldMatrix(true, false); const p = d.getWorldPosition(V3()), n = V3(0, 0, 1).transformDirection(d.matrixWorld), v = camera.position.clone().sub(p).normalize(); const q = p.clone().project(camera); sporco = true; avvia(); return { pos: p.toArray().map((x) => +x.toFixed(2)), normale: n.toArray().map((x) => +x.toFixed(2)), versoCamera: +n.dot(v).toFixed(2), px: [((q.x + 1) / 2 * W()).toFixed(0), ((1 - q.y) / 2 * H()).toFixed(0)], visibile: d.visible, mappa: !!d.material.map?.image } }
  // una sonda per misurare il modello dal browser (coordinate del corpo, l'inclinazione non conta): da dove, verso dove
  rig.sonda = (da, verso) => { const o = corpo.localToWorld(V3(...da)), d = V3(...verso).transformDirection(corpo.matrixWorld); raggio.set(o, d); const h = raggio.intersectObject(modello, true)[0]; return h ? { nome: h.object.name, p: corpo.worldToLocal(h.point.clone()).toArray().map((x) => +x.toFixed(2)) } : null }
  rig.dove = (nome) => { const t = tasti[nome]; if (!t) return null; const q = t.mesh.getWorldPosition(V3()).project(camera); return { x: (q.x + 1) / 2 * W(), y: (1 - q.y) / 2 * H() } }
  /** Dove sta sullo schermo il pixel (x, y) dell'lcd (per il collaudo: un clic lì). */
  rig.puntoLcd = (x, y) => { const p = lcd.localToWorld(V3(((x + 0.5) / 256 - 0.5) * (LCD.x1 - LCD.x0), (0.5 - (y + 0.5) / 128) * (LCD.y1 - LCD.y0), 0)).project(camera); return { x: (p.x + 1) / 2 * W(), y: (1 - p.y) / 2 * H() } }
  rig.debug = () => ({ luceMescola, sole: sole.intensity, lampada: lampada.intensity, auto: auto.intensity, cielo: cielo.intensity, aperto })
  window.pzkkoZero = rig // (per la regia e le prove)
  function aRidimensiona() { if (dlg.open) sporco = true }
  addEventListener('resize', aRidimensiona)
  return rig
}
