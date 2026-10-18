// Le luci della scena: il sole dove sta davvero sopra Mantova a quest'ora (lo
// stesso calcolo NOAA della pagina, qui anche l'altezza e l'azimut), il cielo
// che fa da ambiente e da riflesso, e di notte tutto quello che la pagina già
// comanda con le sue variabili CSS (--notte, --insegna, --lampioni, le auto che
// passano coi fari): la scena le legge ogni fotogramma e accende i poligoni.
import * as T from './lib/three.js'

const LAT = 45.1564, LON = 10.7914, RAD = Math.PI / 180
const FACCIATA = 200 * RAD // dove guarda la facciata (azimut da nord): sud-sud-ovest, prende il sole da metà mattina al pomeriggio

// Posizione del sole (altezza e azimut, in radianti) all'istante ms, a Mantova.
export const sole = (ms) => {
  const t = (ms / 86400000 + 2440587.5 - 2451545) / 36525
  const L0 = (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const C = Math.sin(M * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * t) + Math.sin(3 * M * RAD) * 0.000289
  const om = 125.04 - 1934.136 * t, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * RAD)
  const eps = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * RAD)
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD))
  const y = Math.tan((eps / 2) * RAD) ** 2
  const eq = (4 / RAD) * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD))
  const minuti = (((ms % 86400000) + 86400000) % 86400000) / 60000
  const tst = (((minuti + eq + 4 * LON) % 1440) + 1440) % 1440
  const ha = (tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180) * RAD
  const phi = LAT * RAD
  const cosZ = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha)
  const zen = Math.acos(Math.max(-1, Math.min(1, cosZ)))
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(phi) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(phi) * Math.sin(zen) || 1e-9))))
  az = ha > 0 ? (az + Math.PI) % (2 * Math.PI) : (3 * Math.PI - az) % (2 * Math.PI)
  return { el: Math.PI / 2 - zen, az }
}
// dal cielo (altezza, azimut) al mondo: +z è la direzione in cui guarda la facciata, +x la destra di chi la guarda
const direzione = (el, az) => {
  const E = Math.cos(el) * Math.sin(az), N = Math.cos(el) * Math.cos(az)
  return new T.Vector3(-E * Math.cos(FACCIATA) + N * Math.sin(FACCIATA), Math.sin(el), E * Math.sin(FACCIATA) + N * Math.cos(FACCIATA))
}

// L'ora della scena: la stessa della pagina (?ora=HH:MM di Mantova, ?veloce=N).
export const orologio = () => {
  const q = new URLSearchParams(location.search)
  const veloce = Math.max(1, Number(q.get('veloce')) || 1)
  const partenza = Date.now()
  let inizio = partenza
  if (q.get('ora')) {
    const [h, m] = q.get('ora').split(':').map(Number)
    const romaOra = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }))
    const scarto = Date.now() - romaOra.getTime()
    inizio = new Date(romaOra.getFullYear(), romaOra.getMonth(), romaOra.getDate(), h || 0, m || 0).getTime() + scarto
  }
  return () => inizio + (Date.now() - partenza) * veloce
}

export function luci(scene, renderer, h, M) {
  const { W, H } = M
  const adesso = orologio()
  const root = document.documentElement
  const q = new URLSearchParams(location.search)
  const nottePar = q.get('notte') !== null ? Math.max(0, Math.min(1, Number(q.get('notte')))) : null

  // ── il sole e il cielo ──────────────────────────────────────────────────────
  const sunLight = new T.DirectionalLight(0xfff2e0, 0)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.set(2048, 2048)
  Object.assign(sunLight.shadow.camera, { left: -4.5, right: W + 4.5, top: 7, bottom: -1.5, near: 1, far: 80 })
  sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.03; sunLight.shadow.radius = 3
  sunLight.target.position.set(W / 2, H / 2, 0)
  scene.add(sunLight, sunLight.target)
  const cieloLuce = new T.HemisphereLight(0x9ec5ff, 0x8a7a68, 0.6)
  scene.add(cieloLuce)
  const sky = new T.Sky()
  sky.scale.setScalar(10000)
  const u = sky.material.uniforms
  u.turbidity.value = 4; u.rayleigh.value = 1.6; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8
  // il disco del sole e il suo alone sono accecanti (valori HDR enormi): tagliati, altrimenti i metalli che li
  // riflettono fanno chiazze di bagliore (bloom) anche al tramonto, col sole sotto l'orizzonte
  const riga = 'gl_FragColor = vec4( texColor, 1.0 );'
  if (sky.material.fragmentShader.includes(riga)) sky.material.fragmentShader = sky.material.fragmentShader.replace(riga, 'gl_FragColor = vec4( min( texColor, vec3( 3.0 ) ), 1.0 );')
  scene.add(sky)
  scene.fog = new T.Fog(0x9aa4b0, 40, 160)
  const pmrem = new T.PMREMGenerator(renderer)
  const cieloScena = new T.Scene(); cieloScena.add(sky)
  let ambiente = null, ultimoEl = 99, ultimaNotte = -1, ultimoAmbiente = 0
  const aggiornaAmbiente = (el, notte, t) => {
    if (ambiente && Math.abs(el - ultimoEl) < 0.6 * RAD && Math.abs(notte - ultimaNotte) < 0.04 && t - ultimoAmbiente < 2000) return
    ultimoEl = el; ultimaNotte = notte; ultimoAmbiente = t
    cieloScena.add(sky)
    const nuovo = pmrem.fromScene(cieloScena, 0.02)
    scene.add(sky)
    if (ambiente) ambiente.dispose()
    ambiente = nuovo
    scene.environment = ambiente.texture
  }

  // ── le variabili della pagina ───────────────────────────────────────────────
  const leggi = () => {
    const cs = getComputedStyle(root)
    const v = (n, d = 0) => { const x = parseFloat(cs.getPropertyValue(n)); return Number.isFinite(x) ? x : d }
    return {
      notte: nottePar ?? v('--notte'), insegna: v('--insegna') * v('--f-insegna', 1), lampioni: v('--lampioni') * v('--f-lampioni', 1),
      autoX: v('--auto-x', 0.5), autoL: v('--auto-l'), freno: v('--freno'), frenoX: v('--freno-x', 1.1), neonAuto: v('--neon-auto'),
      autoC: cs.getPropertyValue('--auto-c').trim(),
    }
  }

  const colSole = new T.Color(), caldo = new T.Color(0xffb070), bianco = new T.Color(0xfff4e6)
  const colNebbia = new T.Color(), nebbiaGiorno = new T.Color(0x9aa4b0), nebbiaNotte = new T.Color(0x05070c)
  const colCielo = new T.Color(), cieloGiorno = new T.Color(0x9ec5ff), cieloNotte = new T.Color(0x24304f)
  const colTerra = new T.Color(), terraGiorno = new T.Color(0x8a7a68), terraNotte = new T.Color(0x2a2016)
  let autoX0 = null, verso = 1, finestreT = -1e9, finestreQuanto = 0

  const aggiorna = (t, dt) => {
    const s = leggi()
    const ms = adesso()
    const { el, az } = sole(ms)
    // di notte (anche quella chiesta con ?notte=1) il sole va sotto l'orizzonte
    const elEff = el - 60 * RAD * s.notte
    const dir = direzione(elEff, az)
    const giorno = Math.max(0, Math.min(1, Math.sin(elEff) * 6)) // 0 sotto l'orizzonte, 1 da ~10° in su
    sunLight.position.copy(dir).multiplyScalar(40).add(sunLight.target.position)
    sunLight.intensity = 3.4 * giorno * (1 - s.notte) ** 1.5
    colSole.copy(caldo).lerp(bianco, Math.max(0, Math.min(1, elEff / (25 * RAD))))
    sunLight.color.copy(colSole)
    u.sunPosition.value.copy(dir)
    // il buio: la sera della pagina (--notte, 90 minuti attorno al tramonto) e il crepuscolo vero (da 6° sopra a 6° sotto l'orizzonte)
    const crepuscolo = Math.max(0, Math.min(1, 1 - (el + 6 * RAD) / (12 * RAD)))
    const buio = Math.max(s.notte, crepuscolo)
    cieloLuce.intensity = 0.2 * (1 - buio) + 0.1 * buio
    cieloLuce.color.copy(colCielo.copy(cieloGiorno).lerp(cieloNotte, buio))
    cieloLuce.groundColor.copy(colTerra.copy(terraGiorno).lerp(terraNotte, buio))
    scene.environmentIntensity = 0.12 * (1 - buio) + 0.06 * buio
    scene.fog.color.copy(colNebbia.copy(nebbiaGiorno).lerp(nebbiaNotte, buio))
    renderer.toneMappingExposure = 0.55 * (1 - buio) + 1.25 * buio
    aggiornaAmbiente(elEff, s.notte, t)

    // ── l'insegna ──
    h.lettere.emissiveIntensity = 1.6 * s.insegna
    h.pannello.emissiveIntensity = 0.12 * s.insegna
    h.neon.color.setRGB(3.2 * s.insegna, 2.9 * s.insegna, 2.3 * s.insegna); h.neon.opacity = s.insegna > 0 ? 1 : 0
    for (const l of h.luciInsegna) l.intensity = 0.35 * s.insegna
    // ── la lampada a muro, i lampioni, le finestre di fronte, le spie ──
    h.lampada.intensity = 16 * s.lampioni
    h.lampadina.material.emissiveIntensity = 8 * s.lampioni
    for (const l of h.lampioni) { l.luce.intensity = 30 * s.lampioni; l.bulbo.material.emissiveIntensity = 6 * s.lampioni }
    if (t - finestreT > 60000 || (buio > 0.3 && finestreQuanto === 0)) { finestreT = t; finestreQuanto = buio > 0.3 ? 0.3 + Math.random() * 0.35 : 0; for (const f of h.facciate) f.accendi(finestreQuanto) }
    for (const f of h.facciate) f.mat.emissiveIntensity = 1.3 * buio
    // il vetro della porta: di giorno riflette poco, di notte (dentro è buio) molto di più
    h.vetro.material.uniforms.opacita.value = 0.4 + 0.3 * buio
    h.spia.material.emissiveIntensity = (t % 1600 < 110 ? 5 : 0) * (0.5 + 0.5 * buio)
    h.citofono.material.emissiveIntensity = 0.8 * buio

    // ── l'auto che passa: la pagina dice dov'è (--auto-x, 0..1 della larghezza) e quanto fanno luce i fari ──
    const c = s.autoL > 0 || s.freno > 0
    let inMoto = false
    if (c) {
      const x = s.autoL > 0 ? s.autoX : s.frenoX
      if (autoX0 !== null && x !== autoX0) verso = x > autoX0 ? 1 : -1
      autoX0 = x
      // l'auto passa da x = -10 a 12 (la pozza dei fari sta ~3,7 m avanti): così esce dallo specchio della porta
      // prima di sparire, invece di svanire lì davanti; i fanali della frenata (--freno-x oltre 1) la portano più in là
      const xw = -10 + x * 22
      h.auto.position.set(xw, -0.13, h.strada.z0 + 1.9)
      inMoto = Math.abs(xw - W / 2) < 13
      h.auto.visible = inMoto
      h.auto.rotation.y = verso > 0 ? 0 : Math.PI
      if (s.autoC) { const [r, g, b] = s.autoC.split(',').map(Number); if (Number.isFinite(r)) { h.autoFari.emissive.setRGB(r / 255, g / 255, b / 255); for (const l of h.autoLuci) l.color.setRGB(r / 255, g / 255, b / 255) } }
      for (const l of h.autoLuci) l.intensity = 110 * s.autoL
      h.autoFari.emissiveIntensity = 5 * s.autoL
      h.autoFanali.emissiveIntensity = (s.autoL > 0 ? 1.2 : 0) + 4 * s.freno
      h.autoFreno.intensity = 1.5 * s.freno
      h.autoNeon.intensity = 2 * s.neonAuto
    } else { autoX0 = null; h.auto.visible = false }
    return { buio, giorno, notte: s.notte, el: elEff, auto: inMoto }
  }
  return { aggiorna, sole: sunLight, adesso }
}
