// Le tre bic della petizione nella scena 3D (22.10): legate allo spago, attaccate con lo scotch sotto il foglio
// «pzkko.it è un bel sito?» (index.html, #petizione) e appese davanti alla saracinesca come nella pagina, con le sue
// misure (il CSS di .penna: i perni al 53, 62,5 e 72% della larghezza del foglio e al 91,5% dell'altezza, lo spago 46cqw,
// la penna 36cqw con il pezzo di spago annodato in cima). Modelli, non immagini: il fusto esagonale trasparente col
// tubetto d'inchiostro dentro, il tappino in cima, la punta trasparente con la sfera d'ottone, il cappuccio con la clip
// (la blu non ce l'ha: è quella che si usa). Mesh a istanze, una per materiale: tre penne in cinque chiamate di disegno.
// Ognuna è un pendolo smorzato: il vento vero di Mantova la fa dondolare piano, il puntatore che le passa sopra la spinge;
// quando il foglio si avvicina per firmare (petizione.js, evento pzkko-petizione) qui spariscono, e tornano con lui.
import * as T from './lib/three.js'

const PERNI = [0.53, 0.625, 0.72], PERNO_Y = 0.915, SPAGO = 0.46 + 0.054, PENNA = 0.36 * 0.85
const NOMI = ['blu', 'nera', 'rossa'], COLORI = [0x1d3a9c, 0x1c1b20, 0xbf1b20]

export function penne(scene, M, f) {
  const pezzo = f.pezzi.find((p) => p.el.id === 'petizione')
  if (!pezzo) return { aggiorna: () => false, inMoto: () => false }
  const larg = pezzo.hw * 2, alto = pezzo.hh * 2, L = SPAGO * larg, LP = PENNA * larg
  // le misure di una bic cristal (149 mm col cappuccio) portate alla lunghezza della penna disegnata
  const k = LP / 0.149, mm = (x) => x * 0.001 * k
  // le geometrie, con l'origine in cima alla penna (dove è legato lo spago) e la penna in giù lungo −y
  const cil = (r0, r1, h, y, lati = 12) => { const g = new T.CylinderGeometry(r0, r1, h, lati); g.translate(0, y - h / 2, 0); return g }
  const fusto = T.mergeGeometries([cil(mm(4.1), mm(4.1), mm(118), -mm(4), 6), cil(mm(4.1), mm(1.7), mm(16), -mm(122), 6)])
  const ottone = cil(mm(1.1), mm(0.45), mm(5), -mm(138), 10)
  const colorato = T.mergeGeometries([cil(mm(3.6), mm(3.6), mm(7), 0, 10), cil(mm(1.7), mm(1.7), mm(110), -mm(9), 8)])
  const clip = new T.BoxGeometry(mm(2.4), mm(44), mm(1.3)); clip.translate(mm(5.2), -mm(92), 0)
  const cappuccio = T.mergeGeometries([cil(mm(4.8), mm(4.4), mm(38), -mm(111), 14), clip])
  // lo spago: un cilindro lungo 1 che si allunga e si gira dal perno alla penna; il nodo in cima alla penna
  const spago = new T.CylinderGeometry(mm(0.55), mm(0.55), 1, 5); spago.translate(0, -0.5, 0)
  const mTrasparente = new T.MeshPhysicalMaterial({ color: 0xe8eff2, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, depthWrite: false })
  const mOttone = new T.MeshStandardMaterial({ color: 0xb48f55, metalness: 1, roughness: 0.28 })
  const mColore = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 })
  const mSpago = new T.MeshStandardMaterial({ color: 0xece5d4, roughness: 0.95 })
  const fusti = new T.InstancedMesh(fusto, mTrasparente, 3), punte = new T.InstancedMesh(ottone, mOttone, 3)
  const colori = new T.InstancedMesh(colorato, mColore, 3), cappucci = new T.InstancedMesh(cappuccio, mColore, 2), spaghi = new T.InstancedMesh(spago, mSpago, 3)
  const c = new T.Color()
  COLORI.forEach((x, i) => { colori.setColorAt(i, c.set(x)); if (i) cappucci.setColorAt(i - 1, c.set(x)) })
  const tutte = [fusti, punte, colori, cappucci, spaghi]
  for (const m of tutte) { m.castShadow = true; m.receiveShadow = m !== fusti; m.frustumCulled = false; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m) }
  fusti.renderOrder = 3

  // i perni sotto lo scotch, nel mondo (il foglio è ruotato), e le penne: angolo nel piano del muro e quanto si stacca
  const cs = Math.cos(pezzo.theta), sn = Math.sin(pezzo.theta)
  const pp = PERNI.map((fx) => {
    const lx = (fx - 0.5) * larg, ly = (0.5 - PERNO_Y) * alto
    return { x: pezzo.cx + lx * cs - ly * sn, y: pezzo.cy + lx * sn + ly * cs }
  })
  const stato = NOMI.map((nome, i) => ({ nome, a: (i - 1) * 0.02, v: 0, b: 0, vb: 0, fase: Math.random() * 9 }))
  const W2 = 9.81 / (L + LP * 0.5)
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s1 = new T.Vector3(1, 1, 1), pos = new T.Vector3(), su = new T.Vector3(0, 1, 0), dir = new T.Vector3(), sc = new T.Vector3()
  let nascoste = false, mosse = 0
  document.addEventListener('pzkko-petizione', (ev) => {
    const fase = ev.detail?.fase
    if (fase === 'apre') nascoste = true
    else if (fase === 'chiusa') { nascoste = false; for (const s of stato) s.v += (Math.random() - 0.5) * 2.4 }
  })
  // il foglio che si alza al passaggio del puntatore le scuote un poco
  let alzato = 0

  const metti = () => {
    const vis = !nascoste && pezzo.arrivo > 0
    for (const m of tutte) m.visible = vis
    if (!vis) return
    stato.forEach((s, i) => {
      const p0 = pp[i], z0 = (f.superficie(p0.x, p0.y).z ?? 0) + 0.0012
      // la cima della penna: il perno più lo spago, girato di a nel piano del muro e staccato di b verso la strada
      const ax = Math.sin(s.a) * Math.cos(s.b), ay = -Math.cos(s.a) * Math.cos(s.b), az = Math.sin(s.b)
      const tx = p0.x + ax * L, ty = p0.y + ay * L
      // (la penna sta appoggiata alla lamiera: non entra nelle doghe)
      const zc = Math.max(z0 + az * L, (f.superficie(tx + ax * LP * 0.5, ty + ay * LP * 0.5).z ?? 0) + mm(4.6))
      e.set(s.b * 0.6, 0, s.a); q.setFromEuler(e)
      m4.compose(pos.set(tx, ty, zc), q, s1)
      fusti.setMatrixAt(i, m4); punte.setMatrixAt(i, m4); colori.setMatrixAt(i, m4)
      if (i) cappucci.setMatrixAt(i - 1, m4)
      // lo spago, dal perno alla cima della penna
      dir.set(tx - p0.x, ty - p0.y, zc - z0)
      const lung = dir.length()
      q.setFromUnitVectors(su, dir.normalize().negate())
      m4.compose(pos.set(p0.x, p0.y, z0), q, sc.set(1, lung, 1))
      spaghi.setMatrixAt(i, m4)
    })
    for (const m of tutte) m.instanceMatrix.needsUpdate = true
  }
  metti()

  return {
    // il vento (m/s, dalla scena), il puntatore nel mondo (bestie: dove il raggio tocca la saracinesca), il tempo
    aggiorna(dt, now, { vento = 0, puntatore = null } = {}) {
      if (nascoste) { metti(); return false }
      let energia = 0
      const al = pezzo.alza
      if (al - alzato > 0.04) for (const s of stato) s.v += (Math.random() - 0.5) * 1.2 * (al - alzato) * 10
      alzato = al
      stato.forEach((s, i) => {
        // il vento: raffiche lente, diverse per ogni penna; più forte, più dondolano (e si staccano dal muro)
        s.fase += dt * (0.7 + i * 0.13)
        const raffica = vento * (0.6 * Math.sin(s.fase) + 0.4 * Math.sin(s.fase * 2.3 + i)) * 0.035
        // il puntatore che passa sulla penna la spinge (di lato, con la sua velocità)
        if (puntatore && !puntatore.suolo) {
          const p0 = pp[i], cx = p0.x + Math.sin(s.a) * (L + LP * 0.5), cy = p0.y - Math.cos(s.a) * (L + LP * 0.5)
          const dx = puntatore.x - cx, dy = puntatore.y - cy
          if (Math.abs(dx) < mm(9) && Math.abs(dy) < LP * 0.55) {
            if (!s.sopra) { s.v += (dx > 0 ? -1 : 1) * (puntatore.veloce ? 2.2 : 0.8); window.pzkkoSuono?.evento('penne', { a: puntatore.veloce ? 0.8 : 0.4 }) }
            s.sopra = true
          } else s.sopra = false
        }
        s.v += (-W2 * Math.sin(s.a) - 0.9 * s.v + raffica) * dt
        s.a += s.v * dt
        s.vb += (-W2 * s.b - 2.5 * s.vb + Math.abs(raffica) * 0.3) * dt
        s.b = Math.max(0, s.b + s.vb * dt)
        energia += Math.abs(s.v) + Math.abs(s.vb)
      })
      // (ferme non si ridisegnano: le loro matrici restano; le ombre e gli specchi si rifanno solo se si muovono)
      const moto = energia > 0.004
      if (moto || mosse < 3) metti()
      mosse = moto ? 0 : mosse + 1
      return moto
    },
  }
}
