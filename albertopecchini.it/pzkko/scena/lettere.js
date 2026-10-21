// L'insegna: «pzkko» con le lettere della «coin» vera, quella sopra la saracinesca di via Rizzoli a Bologna (le foto
// in art/storia/), e dentro ogni lettera il neon, come l'insegna disegnata del 9.10. Le misure vengono da IMG_0334 a
// piena risoluzione, raddrizzata (la foto guarda in su: in verticale tutto è schiacciato a 0,95); ridisegnata con
// questi pezzi, «coin» cade sul bordino delle lettere vere a un paio di pixel. In unità dove la x è alta 100: il tratto
// è 30; la o è un cerchio di 102 (sborda di 1 sopra e sotto) col buco di 43; la c un semicerchio di 100 col buco di 41
// e le braccia tagliate dritte; la n un arco di 103 sulle gambe; la i un rettangolo di 30. La p, la z e la k
// sull'insegna vera non ci sono: sono fatte con gli stessi pezzi (la p è la o con l'asta, la z e la k col tratto di 30
// e gli spigoli vivi, come i tagli della c e le gambe della n).
//
// Come sono fatte: lettere a scatola, i fianchi d'alluminio grigio profondi quasi mezza x, il bordino che tiene la
// faccia (lo smusso, più scuro), la barra su cui sono avvitate. Dentro sono cave e bianche, e a metà del tratto corre il
// tubo al neon, piegato come lo piega un vetraio (gli spigoli sono curve), coi capi che girano all'indietro nel fondo
// (gli elettrodi, il gomito verniciato di nero) e i supporti. La faccia è di metacrilato bianco traslucido: di giorno
// la lettera è bianca e il tubo dentro si intravede; di sera si accende il tubo, bianco caldo, e la faccia si illumina
// intorno a lui, più forte vicino.
import * as T from './lib/three.js'
import { tela, tuboSpezzato as tubo } from './materiali.js'

// le lettere, in unità della x (y in giù: la riga della x a 0, la base a 100, l'asta della k a -58, la gamba della p a
// 152): prima il contorno, poi il buco (col verso contrario, per l'SVG)
const LETTERE = {
  p: 'M0 50A51 51 0 1 1 29.5 96.25V152H0ZM29.5 50A21.5 21.5 0 1 0 72.5 50A21.5 21.5 0 1 0 29.5 50Z',
  z: 'M0 0H86V29L42 71H86V100H0V71L44 29H0Z',
  k: 'M0-58H30V16L46 0H88L38 50L88 100H45L30 85V100H0Z',
  o: 'M0 50A51 51 0 1 0 102 50A51 51 0 1 0 0 50ZM29.5 50A21.5 21.5 0 1 1 72.5 50A21.5 21.5 0 1 1 29.5 50Z',
}
// i tubi, a metà del tratto: la p dal piede dell'asta su e poi tutto il giro della pancia, la z in un pezzo solo, la k
// l'asta e poi il braccio con la gamba, la o il giro; dove il giro si chiude resta un varco per gli elettrodi (in basso
// a sinistra, come nel disegno). I capi stanno lontani dai bordi: lì il tubo gira all'indietro
const TUBI = {
  p: 'M14.75 134V50A36.25 36.25 0 1 1 27.7 77.8',
  z: 'M18 14.5H80.2L5.8 85.5H68',
  k: 'M15 84V-40M54 16L25 50L54 84',
  o: 'M30.2 79.7A36.25 36.25 0 1 1 47.8 86.1',
}
// dove comincia ogni lettera: gli spazi di «coin» (fra due tondi 2, fra un tondo e un'asta 7, fra due aste 9)
const PAROLA = [['p', 0], ['z', 108], ['k', 203], ['k', 298], ['o', 391]]
// la parola è larga 493; in altezza il suo centro (fra -58 e 152) è a 47
const LARGO = 493, MEZZO = 47

// la luce: il gas nel tubo (bianco caldo, lineare, oltre l'1 nel nucleo), quella che il tubo accende sulla faccia e sul
// fondo (più calda), e quella che arriva sul muro
const GAS = new T.Color(1, 0.88, 0.72), ALONE = new T.Color(1, 0.66, 0.36)
export const LUCE = new T.Color(1, 0.84, 0.64)

// lungo un tubo nel mondo: gli spigoli diventano curve di raggio rb (al più metà dei due lati)
const arrotonda = (pts, rb) => {
  const out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], p = pts[i], b = pts[i + 1]
    const ta = p.clone().sub(a), tb = b.clone().sub(p), la = ta.length(), lb = tb.length()
    ta.normalize(); tb.normalize()
    if (ta.dot(tb) > Math.cos(12 * Math.PI / 180)) { out.push(p); continue }
    const r = Math.min(rb, la * 0.45, lb * 0.45), p0 = p.clone().addScaledVector(ta, -r), p1 = p.clone().addScaledVector(tb, r)
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, s = 1 - t
      out.push(new T.Vector3().addScaledVector(p0, s * s).addScaledVector(p, 2 * s * t).addScaledVector(p1, t * t))
    }
  }
  out.push(pts.at(-1))
  return out
}
const cilindro = (x, y, z0, z1, r, seg = 10) => {
  const g = new T.CylinderGeometry(r, r, z1 - z0, seg, 1, false)
  g.deleteAttribute('uv'); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2)
  return g
}
// i tratti di una traccia SVG, ognuno come lista di punti (in unità della traccia)
const tratti = (d) => new T.SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths[0].subPaths

// cx, cy: il centro del pannello; zp: la sua faccia; k: la scala dell'insegna (1 sul computer, ~0,5 sul telefono); il
// pannello è largo pw e alto ph. Restituisce le mesh (già nella scena), l'ombra delle lettere sul pannello, accendi(v)
// e sopra(x, y), la faccia della lettera in quel punto (per le mosche)
export function lettere(scene, { cx, cy, zp, k, pw, ph }) {
  const s = (0.125 * k) / 100 // metri per unità: la x alta 12,5 cm
  // la barra sul pannello (1,2 cm), poi la lettera: fianchi da 5,6 cm e il bordino di 2 mm che tiene la faccia; il tubo
  // (13 mm) a 2,4 cm dal fondo
  const zb = zp + 0.012 * k, prof = 0.056 * k, bordo = 0.002 * k, zf = zb + prof
  const r = 0.0065 * k, zt = zb + 0.024 * k, rb = 0.012 * k, rg = 0.009 * k
  const X = (u) => cx + (u - LARGO / 2) * s, Y = (v) => cy - (v - MEZZO) * s

  // i contorni: dalla traccia SVG ai punti nel mondo (la y si capovolge; ExtrudeGeometry rimette i versi a posto)
  const punti = (sub, x0) => {
    const p = sub.getPoints(32).map((q) => new T.Vector2(X(q.x + x0), Y(q.y))).filter((q, i, a) => !i || q.distanceTo(a[i - 1]) > 1e-6)
    if (p.length > 2 && p[0].distanceTo(p.at(-1)) < 1e-6) p.pop()
    return p
  }
  const forme = PAROLA.map(([g, x0]) => {
    const [contorno, ...buchi] = tratti(LETTERE[g]), forma = new T.Shape(punti(contorno, x0))
    forma.holes = buchi.map((b) => new T.Path(punti(b, x0)))
    return forma
  })
  // la scatola: i coperchi (il gruppo 0: davanti la faccia, dietro il fondo) e i fianchi con lo smusso del bordino (il
  // gruppo 1). Lo smusso rientra (bevelOffset): i fianchi stanno sul contorno vero
  const geo = new T.ExtrudeGeometry(forme, { depth: prof - 2 * bordo, steps: 1, bevelEnabled: true, bevelThickness: bordo, bevelSize: bordo, bevelOffset: -bordo, bevelSegments: 2 })
  geo.translate(0, 0, zb + bordo)
  // il bordino è più scuro dei fianchi: è la riga che sulla «coin» vera disegna ogni lettera. Nei gruppi dei fianchi
  // (uno per lettera) sono suoi i triangoli davanti alla cima dei fianchi; il colore va ai vertici, triangolo per triangolo
  const FIANCO = new T.Color(0x8a867f), BORDINO = new T.Color(0x47433e)
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3)
  for (const { start, count, materialIndex } of geo.groups) {
    if (materialIndex !== 1) continue
    for (let i = start; i < start + count; i += 3) {
      const c = Math.max(pos.getZ(i), pos.getZ(i + 1), pos.getZ(i + 2)) > zf - bordo + 1e-6 ? BORDINO : FIANCO
      for (let j = 0; j < 3; j++) c.toArray(col, (i + j) * 3)
    }
  }
  geo.setAttribute('color', new T.BufferAttribute(col, 3))

  // ── la luce del tubo sulla faccia e sul fondo: i tubi sfocati su una tela, nelle coordinate del mondo (i coperchi e il
  // fondo hanno per uv la loro x e y). Un filo di luce in tutta la lettera, l'alone largo, il chiaro vicino al tubo ──
  const G = 3, U0 = -10, V0 = -68, UW = 513, VH = 230, alone = tela(UW * G, VH * G), ac = alone.getContext('2d'), FUORI = 4 * UW * G
  ac.fillStyle = '#000'; ac.fillRect(0, 0, UW * G, VH * G)
  const lettera = Object.fromEntries(Object.entries(LETTERE).map(([g, d]) => [g, new Path2D(d)]))
  const tubi = Object.fromEntries(Object.entries(TUBI).map(([g, d]) => [g, new Path2D(d)]))
  const ogni = (fai, dx = 0) => { for (const [g, x0] of PAROLA) { ac.setTransform(G, 0, 0, G, (x0 - U0) * G - dx, -V0 * G); fai(g) } }
  ac.fillStyle = 'rgb(60,60,60)'; ogni((g) => ac.fill(lettera[g], 'evenodd'))
  ac.lineCap = ac.lineJoin = 'round'; ac.strokeStyle = '#fff'
  // (shadowBlur e shadowOffset sono in pixel della tela: il tratto disegnato fuori, resta la sua ombra sfocata)
  for (const [sfoca, alfa, larg] of [[30, 0.9, 16], [9, 1, 11], [3, 1, 8]]) {
    ac.save(); ac.shadowColor = `rgba(255,255,255,${alfa})`; ac.shadowBlur = sfoca * G; ac.shadowOffsetX = FUORI; ac.lineWidth = larg
    ogni((g) => ac.stroke(tubi[g]), FUORI); ac.restore()
  }
  ac.setTransform(1, 0, 0, 1, 0, 0)
  const aloneT = new T.CanvasTexture(alone)
  aloneT.colorSpace = T.SRGBColorSpace
  const x0 = X(U0), y0 = Y(V0 + VH), Wm = UW * s, Hm = VH * s
  aloneT.repeat.set(1 / Wm, 1 / Hm); aloneT.offset.set(-x0 / Wm, -y0 / Hm)

  // ── i materiali e le mesh: la stessa scatola tre volte (un gruppo nascosto per volta), così la faccia non fa ombra
  // dentro la lettera (il sole ci entra, di giorno l'interno è chiaro) e l'interno si vede da davanti (BackSide) ──
  const nascosto = new T.MeshBasicMaterial({ visible: false })
  const faccia = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0, transparent: true, opacity: 0.7, depthWrite: false, emissive: ALONE, emissiveMap: aloneT, emissiveIntensity: 0 })
  const fianchi = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, metalness: 0.15 })
  const pareti = new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.85, side: T.BackSide, emissive: ALONE, emissiveIntensity: 0 })
  // il fondo dentro la lettera: le stesse forme, piatte, appena davanti al fondo della scatola (fa ombra anche lui,
  // da tutte e due le parti: senza, la lettera sul pannello avrebbe un'ombra cava)
  const fondo = new T.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.85, emissive: ALONE, emissiveMap: aloneT, emissiveIntensity: 0, shadowSide: T.DoubleSide })
  const fondoG = new T.ShapeGeometry(forme, 12); fondoG.translate(0, 0, zb + 0.0008)
  const mFaccia = new T.Mesh(geo, [faccia, nascosto]), mFianchi = new T.Mesh(geo, [nascosto, fianchi])
  const mPareti = new T.Mesh(geo, [nascosto, pareti]), mFondo = new T.Mesh(fondoG, fondo)
  mFaccia.renderOrder = 3
  // la barra: dietro le lettere, all'altezza dei loro fori (un terzo della x), da un capo all'altro della parola
  const barra = new T.Mesh(new T.BoxGeometry((LARGO - 40) * s, 8 * s, zb - zp), new T.MeshStandardMaterial({ color: FIANCO, roughness: 0.6, metalness: 0.15 }))
  barra.position.set(cx, Y(38), (zp + zb) / 2)

  // ── i tubi: il vetro (bianco latte, come i tubi a fosfori spenti), i gomiti neri degli elettrodi fino al fondo, il
  // passacavo di gomma da cui entrano, i supporti di plastica ogni ~12 cm ──
  const vetro = [], nero = [], gomma = [], sostegni = [], z = new T.Vector3(0, 0, 1)
  for (const [g, x0] of PAROLA) {
    for (const sub of tratti(TUBI[g])) {
      const p = arrotonda(sub.getPoints(32).map((q) => new T.Vector3(X(q.x + x0), Y(q.y), zt)).filter((q, i, a) => !i || q.distanceTo(a[i - 1]) > 1e-6), rb)
      vetro.push(tubo(p, r, 12))
      for (const [a, t] of [[p[0], p[0].clone().sub(p[1]).normalize()], [p.at(-1), p.at(-1).clone().sub(p.at(-2)).normalize()]]) {
        const c = a.clone().addScaledVector(z, -rg), gomito = []
        for (let i = 0; i <= 6; i++) { const f = (i / 6) * Math.PI / 2; gomito.push(c.clone().addScaledVector(z, rg * Math.cos(f)).addScaledVector(t, rg * Math.sin(f))) }
        const giu = gomito.at(-1).clone(); giu.z = zb
        nero.push(tubo([...gomito, giu], r, 10))
        gomma.push(cilindro(giu.x, giu.y, zb, zb + 0.005 * k, r * 1.2, 12))
      }
      let l = 0, prossimo = 0.05 * k
      const tot = p.reduce((a, q, i) => a + (i ? q.distanceTo(p[i - 1]) : 0), 0)
      for (let i = 1; i < p.length; i++) {
        const seg = p[i].distanceTo(p[i - 1])
        while (l + seg >= prossimo && prossimo < tot - 0.04 * k) {
          const q = p[i - 1].clone().lerp(p[i], (prossimo - l) / seg)
          sostegni.push(cilindro(q.x, q.y, zb, q.z - r * 0.7, 0.002 * k, 8))
          prossimo += 0.12 * k
        }
        l += seg
      }
    }
  }
  const unisci = (lista) => T.mergeGeometries(lista)
  const gas = new T.MeshStandardMaterial({ color: 0xf1eee6, roughness: 0.2, metalness: 0, emissive: GAS, emissiveIntensity: 0 })
  const mTubi = new T.Mesh(unisci(vetro), gas)
  const mNero = new T.Mesh(unisci(nero), new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }))
  const mGomma = new T.Mesh(unisci(gomma), new T.MeshStandardMaterial({ color: 0x161616, roughness: 0.9 }))
  const mSostegni = new T.Mesh(unisci(sostegni), new T.MeshStandardMaterial({ color: 0xd9dcdc, roughness: 0.3 }))

  const mesh = [mFaccia, mFianchi, mPareti, mFondo, barra, mTubi, mNero, mGomma, mSostegni]
  for (const o of mesh) { o.castShadow = o !== mFaccia && o !== mPareti; o.receiveShadow = true; scene.add(o) }

  // l'ombra delle lettere nella luce del cielo, sul pannello (aoMap: tocca solo la luce indiretta, il cielo e
  // l'ambiente; col sole la fanno le ombre vere): attorno a ogni lettera, più sotto che sopra (il cielo viene dall'alto).
  // Le lettere sfocate, disegnate fuori dalla tela: resta l'ombra
  const LW = 1024, LH = Math.round((LW * ph) / pw), ao = tela(LW, LH), og = ao.getContext('2d'), px = LW / pw, VIA = 4 * LW
  og.fillStyle = '#fff'; og.fillRect(0, 0, LW, LH)
  for (const [sfoca, alfa, giu] of [[0.03, 0.8, 0.008], [0.008, 0.55, 0.002]]) {
    og.save()
    og.shadowColor = `rgba(0,0,0,${alfa})`; og.shadowBlur = sfoca * px; og.shadowOffsetX = VIA; og.shadowOffsetY = giu * px
    og.setTransform(s * px, 0, 0, s * px, (pw / 2 - (LARGO / 2) * s) * px - VIA, (ph / 2 - MEZZO * s) * px)
    og.fillStyle = '#000'
    for (const [g, xg] of PAROLA) { og.save(); og.translate(xg, 0); og.fill(lettera[g], 'evenodd'); og.restore() }
    og.restore()
  }
  const aoT = new T.CanvasTexture(ao)

  // la faccia di una lettera in (x, y), se c'è: z, altrimenti null
  const prova = tela(1).getContext('2d')
  const sopra = (x, y) => {
    const u = (x - cx) / s + LARGO / 2, v = MEZZO - (y - cy) / s
    return PAROLA.some(([g, xg]) => prova.isPointInPath(lettera[g], u - xg, v, 'evenodd')) ? zf : null
  }

  // il centro della parola, per le lampade dell'insegna (mondo.js) e le zanzare (bestie.js)
  const centri = { testo: new T.Vector3(cx, cy, zf), largTesto: LARGO * s }
  // accendi(v): 0 spento, 1 acceso (con lo sfarfallio della pagina dentro). Il tubo oltre l'1 (il bagliore della scena
  // lo allarga appena: è sottile), la faccia e l'interno sotto, solo vicino al tubo
  const accendi = (v) => {
    gas.emissiveIntensity = 4 * v
    faccia.emissiveIntensity = 2.2 * v
    fondo.emissiveIntensity = 1.4 * v
    pareti.emissiveIntensity = 0.22 * v
  }
  return { mesh, aoT, centri, accendi, sopra }
}
