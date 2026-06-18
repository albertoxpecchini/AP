import { useState, useRef, useEffect, useCallback } from 'react'

/* ============================================================
   PERCORSO LAMPO
   Flusso (da spec): genera griglia → mostra percorso → nascondi
   → input utente (gesto continuo) → valutazione → punteggio.
   ============================================================ */

// Tabella di scaling dalla Master Specification.
const LIVELLI = [
  { livello: 1, griglia: 3, nodi: 3 },
  { livello: 2, griglia: 3, nodi: 4 },
  { livello: 3, griglia: 4, nodi: 5 },
  { livello: 4, griglia: 5, nodi: 6 },
  { livello: 5, griglia: 6, nodi: 8 },
]

const TOTALE_ROUND = 5

// Combo → moltiplicatore (da spec).
function moltiplicatoreCombo(combo) {
  if (combo >= 10) return 2.0
  if (combo >= 5) return 1.5
  if (combo >= 3) return 1.2
  return 1.0
}

// --- PRNG deterministico per la "sfida del giorno" (seed dalla data) ---
function seedDaData() {
  const d = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  let h = 2166136261
  for (let i = 0; i < d.length; i++) {
    h ^= d.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function creaRng(seed) {
  let s = seed >>> 0
  return () => {
    // mulberry32
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Genera un percorso sempre completabile: passi su una griglia tra celle
 * adiacenti (king-move) senza ripetere una cella. Restituisce i nodi in
 * coordinate normalizzate 0..1.
 */
function generaPercorso(griglia, nodi, rng) {
  const cella = (r, c) => `${r},${c}`
  const visitati = new Set()
  // partenza casuale
  let r = Math.floor(rng() * griglia)
  let c = Math.floor(rng() * griglia)
  const passi = [[r, c]]
  visitati.add(cella(r, c))

  const mosse = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ]

  let tentativiTotali = 0
  while (passi.length < nodi && tentativiTotali < 500) {
    tentativiTotali++
    // mescola le mosse e prova la prima valida
    const ordine = [...mosse].sort(() => rng() - 0.5)
    let avanzato = false
    for (const [dr, dc] of ordine) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nc < 0 || nr >= griglia || nc >= griglia) continue
      if (visitati.has(cella(nr, nc))) continue
      r = nr
      c = nc
      visitati.add(cella(nr, nc))
      passi.push([r, c])
      avanzato = true
      break
    }
    if (!avanzato) break // vicolo cieco: ci accontentiamo del percorso fin qui
  }

  // converti in coordinate normalizzate (centro di ogni cella)
  return passi.map(([rr, cc]) => ({
    x: (cc + 0.5) / griglia,
    y: (rr + 0.5) / griglia,
  }))
}

// Densifica una polilinea in punti equispaziati per il confronto.
function campiona(punti, passo = 0.01) {
  const out = []
  for (let i = 0; i < punti.length - 1; i++) {
    const a = punti[i]
    const b = punti[i + 1]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    const n = Math.max(1, Math.round(d / passo))
    for (let s = 0; s < n; s++) {
      const t = s / n
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  if (punti.length) out.push(punti[punti.length - 1])
  return out
}

// Distanza minima da un punto al set campionato del percorso target.
function distMin(p, campioni) {
  let m = Infinity
  for (const q of campioni) {
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2
    if (d < m) m = d
  }
  return Math.sqrt(m)
}

/**
 * Accuracy: frazione di campioni del disegno che cadono entro la tolleranza
 * dal percorso target, combinata con la copertura del target (così non basta
 * scarabocchiare su mezzo percorso).
 */
function valutaAccuracy(disegno, target) {
  if (disegno.length < 2) return 0
  const cTarget = campiona(target)
  const cDisegno = campiona(disegno)
  const tol = 0.08 // ~8% del lato

  let dentro = 0
  for (const p of cDisegno) if (distMin(p, cTarget) <= tol) dentro++
  const precisione = dentro / cDisegno.length

  // copertura: quanti campioni target sono "raggiunti" dal disegno
  let coperti = 0
  for (const q of cTarget) if (distMin(q, cDisegno) <= tol) coperti++
  const copertura = coperti / cTarget.length

  return Math.max(0, Math.min(1, precisione * 0.5 + copertura * 0.5))
}

export default function PercorsoLampo({ mode, onExit }) {
  const [round, setRound] = useState(1)
  const [fase, setFase] = useState('watch') // watch | draw | result
  const [accuracy, setAccuracy] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [percorso, setPercorso] = useState([])

  const canvasRef = useRef(null)
  const rngRef = useRef(null)
  const disegnoRef = useRef([]) // punti normalizzati del gesto utente
  const disegnandoRef = useRef(false)
  const animRef = useRef(0)

  // Inizializza il PRNG una volta in base alla modalità.
  if (rngRef.current === null) {
    rngRef.current =
      mode === 'sfida' ? creaRng(seedDaData()) : creaRng((Math.random() * 1e9) | 0)
  }

  const config = LIVELLI[Math.min(round, TOTALE_ROUND) - 1]

  // --- genera il percorso a ogni nuovo round ---
  useEffect(() => {
    const p = generaPercorso(config.griglia, config.nodi, rngRef.current)
    setPercorso(p)
    setFase('watch')
    disegnoRef.current = []
  }, [round, config.griglia, config.nodi])

  // --- disegno su canvas (griglia + percorso/anim/gesto) ---
  const dimensioni = () => {
    const cv = canvasRef.current
    return { w: cv.width, h: cv.height }
  }

  const disegnaGriglia = useCallback(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      const g = config.griglia
      for (let i = 1; i < g; i++) {
        const x = (w * i) / g
        const y = (h * i) / g
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    },
    [config.griglia],
  )

  const disegnaPolilinea = useCallback((ctx, punti, w, h, colore, larghezza) => {
    if (punti.length < 1) return
    ctx.strokeStyle = colore
    ctx.lineWidth = larghezza
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(punti[0].x * w, punti[0].y * h)
    for (let i = 1; i < punti.length; i++) {
      ctx.lineTo(punti[i].x * w, punti[i].y * h)
    }
    ctx.stroke()
  }, [])

  // --- FASE WATCH: anima un pallino lungo il percorso ---
  useEffect(() => {
    if (fase !== 'watch' || percorso.length === 0) return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { w, h } = dimensioni()

    const durata = 900 + percorso.length * 450 // più nodi → più tempo
    let inizio = null

    const tick = (ts) => {
      if (inizio === null) inizio = ts
      const t = Math.min(1, (ts - inizio) / durata)

      disegnaGriglia(ctx, w, h)
      // traccia parziale già percorsa
      const fino = Math.max(1, Math.floor(t * (percorso.length - 1)) + 1)
      disegnaPolilinea(ctx, percorso.slice(0, fino), w, h, 'rgba(255,255,255,0.85)', 3)

      // posizione interpolata del pallino
      const seg = t * (percorso.length - 1)
      const i = Math.min(percorso.length - 2, Math.floor(seg))
      const f = seg - i
      const a = percorso[i]
      const b = percorso[i + 1] || a
      const px = (a.x + (b.x - a.x) * f) * w
      const py = (a.y + (b.y - a.y) * f) * h
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill()

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        // breve pausa, poi nascondi e passa al disegno
        setTimeout(() => {
          disegnaGriglia(ctx, w, h)
          setFase('draw')
        }, 500)
      }
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [fase, percorso, disegnaGriglia, disegnaPolilinea])

  // --- ridisegna in fase DRAW/RESULT quando serve ---
  useEffect(() => {
    if (fase === 'watch') return
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const { w, h } = dimensioni()
    disegnaGriglia(ctx, w, h)
    if (fase === 'result') {
      // mostra confronto: target chiaro + gesto utente in accento
      disegnaPolilinea(ctx, percorso, w, h, 'rgba(255,255,255,0.35)', 3)
      disegnaPolilinea(ctx, disegnoRef.current, w, h, '#5b5bf0', 3)
    }
  }, [fase, percorso, disegnaGriglia, disegnaPolilinea])

  // --- gestione input (mouse + touch) per il gesto continuo ---
  const puntoDaEvento = (e) => {
    const cv = canvasRef.current
    const rect = cv.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (cx - rect.left) / rect.width, y: (cy - rect.top) / rect.height }
  }

  const iniziaDisegno = (e) => {
    if (fase !== 'draw') return
    e.preventDefault()
    disegnandoRef.current = true
    disegnoRef.current = [puntoDaEvento(e)]
  }

  const continuaDisegno = (e) => {
    if (!disegnandoRef.current || fase !== 'draw') return
    e.preventDefault()
    const p = puntoDaEvento(e)
    disegnoRef.current.push(p)
    // disegno incrementale
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const { w, h } = dimensioni()
    disegnaGriglia(ctx, w, h)
    disegnaPolilinea(ctx, disegnoRef.current, w, h, '#5b5bf0', 3)
  }

  const fineDisegno = (e) => {
    if (!disegnandoRef.current || fase !== 'draw') return
    e.preventDefault()
    disegnandoRef.current = false
    const acc = valutaAccuracy(disegnoRef.current, percorso)
    setAccuracy(acc)

    // punteggio: base 100 * accuracy, +50 bonus precisione (>95%), * combo
    const nuovaCombo = acc >= 0.6 ? combo + 1 : 0
    let punti = Math.round(100 * acc)
    if (acc > 0.95) punti += 50
    punti = Math.round(punti * moltiplicatoreCombo(nuovaCombo))

    setCombo(nuovaCombo)
    setScore((s) => s + punti)
    setFase('result')
  }

  const prossimo = () => {
    if (round >= TOTALE_ROUND) {
      onExit() // fine partita → torna alla home
    } else {
      setRound((r) => r + 1)
    }
  }

  const etichettaFase =
    fase === 'watch' ? 'Guarda' : fase === 'draw' ? 'Disegna' : 'Risultato'
  const suggerimento =
    fase === 'watch'
      ? 'Memorizza il movimento'
      : fase === 'draw'
        ? 'Ridisegna il percorso con un solo gesto'
        : `${round >= TOTALE_ROUND ? 'Partita conclusa' : 'Pronto per il prossimo'}`

  return (
    <div className="container-xl mv-game">
      <div className="mv-topbar">
        <button type="button" className="mv-link" onClick={onExit}>
          ← Esci
        </button>
        <span className="mv-score-chip">
          Punteggio {score}
          {combo >= 3 ? `  ·  combo ×${moltiplicatoreCombo(combo)}` : ''}
        </span>
      </div>

      <div className="mt-3">
        <div className="mv-game__phase">{etichettaFase}</div>
        <div className="mv-game__hint">{suggerimento}</div>
      </div>

      <div className="mv-stage">
        <span className="mv-stage__label mv-stage__label--left">
          {round}/{TOTALE_ROUND}
        </span>
        <span className="mv-stage__label mv-stage__label--right">
          movimento · liv. {config.livello}
        </span>
        <canvas
          ref={canvasRef}
          width={760}
          height={760}
          className="mv-canvas"
          onMouseDown={iniziaDisegno}
          onMouseMove={continuaDisegno}
          onMouseUp={fineDisegno}
          onMouseLeave={fineDisegno}
          onTouchStart={iniziaDisegno}
          onTouchMove={continuaDisegno}
          onTouchEnd={fineDisegno}
        />
      </div>

      {fase === 'result' && (
        <div className="mv-result">
          <div className="mv-accuracy">
            {Math.round(accuracy * 100)}
            <small> % preciso</small>
          </div>
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4 mt-3"
            onClick={prossimo}
          >
            {round >= TOTALE_ROUND ? 'Torna alla home' : 'Prossimo percorso →'}
          </button>
        </div>
      )}
    </div>
  )
}
