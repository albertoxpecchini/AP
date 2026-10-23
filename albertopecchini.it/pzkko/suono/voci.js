// Gli strumenti dei suoni della strada: suono.js decide quando e da dove, qui si dice come suonano. Tutto sintetizzato
// col Web Audio, niente file da scaricare: oscillatori e rumori filtrati, accesi e spenti col loro inviluppo. Le cose
// fatte di mille pezzi (la pioggia sulla lamiera e nelle pozze, i grilli, le cicale, i tuoni, la carta, la lamiera
// battuta) si calcolano qui una volta in un tampone e poi si suonano; le campane in un OfflineAudioContext, la stessa
// sintesi fuori dal tempo vero. Ogni strumento suona all'istante t dentro out, il punto da cui viene (suono.js gli dà
// la distanza, il lato e l'eco); quelli che passano da un lato all'altro (il motorino, i rondoni) hanno il lato dentro.
// Funziona anche in un OfflineAudioContext: tools/pzkko/suono/ascolta.mjs ci registra le prove.
const TAU = Math.PI * 2
export const caso = (a, b) => a + Math.random() * (b - a)
export const scegli = (a) => a[Math.floor(Math.random() * a.length)]
const liscia = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x) }
// una curva di frequenze da pochi punti [u, f], u da 0 a 1, morbida fra un punto e l'altro
export const curva = (punti, n = 32) => {
  const v = new Float32Array(n)
  for (let i = 0, j = 0; i < n; i++) {
    const u = i / (n - 1)
    while (j < punti.length - 2 && punti[j + 1][0] < u) j++
    const [u0, f0] = punti[j], [u1, f1] = punti[j + 1]
    v[i] = f0 + (f1 - f0) * liscia((u - u0) / (u1 - u0 || 1))
  }
  return v
}
const fisso = (f) => new Float32Array([f, f])

// le campane: i parziali di una campana da chiesa rispetto alla «prima» (rapporto, ampiezza, quanto dura rispetto al
// ronzio): il ronzio un'ottava sotto, la terza minore, la quinta, la nominale (l'ottava sopra, la nota del colpo), e
// sopra quelli che si spengono presto. Ognuno sono due toni vicinissimi, che battono: il «uaon uaon» delle campane vere
const PARZIALI = [[0.5, 0.35, 1], [1, 0.42, 0.72], [1.19, 0.45, 0.52], [1.5, 0.2, 0.42], [2, 0.62, 0.36], [2.51, 0.14, 0.22], [2.66, 0.18, 0.2], [3.01, 0.1, 0.16], [4.17, 0.07, 0.11], [5.43, 0.04, 0.08], [6.8, 0.025, 0.06]]
// la lamiera della saracinesca battuta: i modi di un pannello di doghe (frequenza, ampiezza, costante di tempo)
const LAMIERA = [[118, 1, 0.22], [252, 0.7, 0.16], [389, 0.55, 0.12], [611, 0.45, 0.09], [893, 0.3, 0.06], [1302, 0.22, 0.045], [1847, 0.14, 0.03], [2690, 0.08, 0.02]]

export function strumenti(c) {
  const sr = c.sampleRate
  const tampone = (sec, canali, riempi) => {
    const b = c.createBuffer(canali, Math.max(2, Math.round(sec * sr)), sr)
    for (let k = 0; k < canali; k++) riempi(b.getChannelData(k), k)
    return b
  }
  const picco = (b, p = 0.9) => {
    let m = 0
    for (let k = 0; k < b.numberOfChannels; k++) { const d = b.getChannelData(k); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])) }
    if (m > 0) for (let k = 0; k < b.numberOfChannels; k++) { const d = b.getChannelData(k); for (let i = 0; i < d.length; i++) d[i] *= p / m }
    return b
  }
  const filtro = (tipo, f, q = 0.7, g = 0) => { const b = c.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.gain.value = g; return b }
  const guadagno = (v = 1) => { const g = c.createGain(); g.gain.value = v; return g }
  // collega in fila e dà l'ultimo
  const fila = (...n) => { for (let i = 1; i < n.length; i++) n[i - 1].connect(n[i]); return n.at(-1) }

  // ── i rumori: 4 secondi che si ripetono senza giunta (il filtro gira due volte sul giro: al secondo ha dimenticato da
  // dove era partito, e la fine si attacca all'inizio). Bianco, rosa (il filtro di Paul Kellet) e marrone ──
  const rumore = (tipo, canali) => tampone(4, canali, (d) => {
    const n = d.length, w = new Float32Array(n)
    for (let i = 0; i < n; i++) w[i] = Math.random() * 2 - 1
    if (tipo === 'bianco') return d.set(w)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, m = 0
    for (let giro = 0; giro < 2; giro++) for (let i = 0; i < n; i++) {
      const x = w[i]
      if (tipo === 'rosa') {
        b0 = 0.99886 * b0 + x * 0.0555179; b1 = 0.99332 * b1 + x * 0.0750759; b2 = 0.969 * b2 + x * 0.153852
        b3 = 0.8665 * b3 + x * 0.3104856; b4 = 0.55 * b4 + x * 0.5329522; b5 = -0.7616 * b5 - x * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11; b6 = x * 0.115926
      } else { m = (m + 0.02 * x) / 1.02; d[i] = m * 3.5 }
    }
  })
  const R = { bianco: rumore('bianco', 1), rosa: rumore('rosa', 2), marrone: rumore('marrone', 2) }
  const fonte = (buf, t, { loop = true, rate = 1, fine = 0 } = {}) => {
    const s = c.createBufferSource()
    s.buffer = buf; s.loop = loop; s.playbackRate.value = rate
    s.start(t, loop ? Math.random() * buf.duration : 0)
    if (fine) s.stop(fine)
    return s
  }

  // ── i mattoni ──
  // un soffio di rumore filtrato, che sale in att e cala con la costante tau: le ali dei piccioni, gli schizzi, le
  // scintille del neon, le stecche della tapparella, le onde del traffico di là
  const soffio = (out, t, { a = 0.3, att = 0.002, tau = 0.01, filtri = [], tipo = 'bianco', rate = 1 } = {}) => {
    const s = fonte(R[tipo], t, { rate, fine: t + att + tau * 6 }), g = guadagno(0)
    fila(s, ...filtri, g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + att); g.gain.setTargetAtTime(0, t + att, tau)
  }
  // un tono: la curva delle frequenze in d secondi, con le sue armoniche [k, ampiezza]; sale in att, tiene e cala in rel
  // (o, con cala, scende da subito con quella costante: le cose percosse); vibrato (quanto, vf: quante volte al secondo)
  // e tremolo [frequenza, profondità, per quanti secondi]
  const tono = (out, t, d, cv, { tipo = 'sine', a = 0.3, att = 0.02, rel = 0.05, cala = 0, armoniche = [[1, 1]], vibrato = 0, vf = 5, tremolo = null } = {}) => {
    const g = guadagno(0), fine = t + d + 0.02
    g.connect(out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + att)
    if (cala) g.gain.setTargetAtTime(0, t + att, cala)
    else { g.gain.setValueAtTime(a, Math.max(t + att, t + d - rel)); g.gain.linearRampToValueAtTime(0, t + d) }
    let dentro = g
    if (tremolo) {
      const [tf, tp, per] = tremolo, tr = guadagno(1 - tp / 2), l = c.createOscillator(), lg = guadagno(tp / 2)
      l.frequency.value = tf; fila(l, lg, tr.gain); tr.connect(g); dentro = tr
      lg.gain.setValueAtTime(tp / 2, t); lg.gain.linearRampToValueAtTime(0, t + per)
      tr.gain.setValueAtTime(1 - tp / 2, t); tr.gain.linearRampToValueAtTime(1, t + per)
      l.start(t); l.stop(fine)
    }
    let lfo = null
    if (vibrato) { lfo = c.createOscillator(); lfo.frequency.value = vf; lfo.start(t); lfo.stop(fine) }
    for (const [k, am] of armoniche) {
      const o = c.createOscillator()
      o.type = tipo
      o.frequency.setValueCurveAtTime(cv.map((f) => f * k), t, d)
      if (lfo) fila(lfo, guadagno(cv[0] * k * vibrato), o.frequency)
      fila(o, guadagno(am), dentro)
      o.start(t); o.stop(fine)
    }
    return g
  }

  // ── l'eco della strada: la coda (gli acuti si spengono prima) e le prime riflessioni del palazzo di fronte, a 12 m:
  // 70 ms andata e ritorno, e poi l'eco che rimbalza fra le due facciate, sempre più debole ──
  const eco = () => {
    const n = c.createConvolver()
    n.buffer = tampone(1.8, 2, (d, k) => {
      let lp = 0
      for (let i = 0; i < d.length; i++) {
        const t = i / sr, a = 1 - Math.exp(-TAU * (6500 * Math.exp(-t / 0.3) + 450) / sr)
        lp += a * (Math.random() * 2 - 1 - lp)
        d[i] = lp * Math.exp(-t / 0.22) * Math.min(1, t / 0.015) * 0.7
      }
      for (let j = 1; j <= 7; j++) {
        const i0 = Math.round((0.069 * j + (k ? 0.0017 : 0)) * sr), a = 0.9 * 0.55 ** j
        for (let i = 0; i < 200; i++) d[i0 + i] += a * (Math.random() * 2 - 1) * Math.exp(-i / 50)
      }
    })
    return n
  }

  // ── la goccia della condensa sulla soglia bagnata: il «plic» della bolla, un fischio che sale veloce, e il colpetto
  // dell'urto. Più grave e grossa: quella che cade dalla gronda dopo la pioggia ──
  const goccia = (out, t, { f = caso(850, 1500), a = 0.35 } = {}) => {
    const o = c.createOscillator(), g = guadagno(0), d = caso(0.03, 0.055)
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * caso(1.7, 2.4), t + d)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.0015); g.gain.setTargetAtTime(0, t + 0.002, d * 0.45)
    fila(o, g, out); o.start(t); o.stop(t + d * 4)
    soffio(out, t, { a: a * 0.3, att: 0.0005, tau: 0.0012, filtri: [filtro('highpass', 2500)] })
  }
  const gronda = (out, t, { a = 0.3 } = {}) => {
    goccia(out, t, { f: caso(420, 750), a })
    soffio(out, t, { a: a * 0.25, att: 0.001, tau: 0.008, tipo: 'rosa', filtri: [filtro('bandpass', 1400, 0.8)] })
  }

  // ── gli uccelli ──
  // il passero: «cip», «ciup», qualche volta doppio; uno o due che chiacchierano
  const cip = (out, t, f, d, forma, a) => {
    const cv = curva(forma === 'su' ? [[0, f * 0.82], [1, f * 1.2]] : forma === 'giu' ? [[0, f * 1.25], [1, f * 0.85]] : [[0, f * 0.86], [0.45, f * 1.3], [1, f * 0.95]], 12)
    const hp = filtro('highpass', 1900)
    hp.connect(out)
    // (la ruvidezza: una modulazione veloce sulla frequenza)
    tono(hp, t, d, cv, { tipo: 'triangle', a, att: 0.006, rel: d * 0.4, vibrato: caso(0.03, 0.08), vf: caso(60, 160) })
  }
  const passeri = (out, t, { n = Math.round(caso(4, 12)), a = 0.22 } = {}) => {
    const voci = [caso(2900, 3600), caso(3300, 4200)]
    let u = t
    for (let i = 0; i < n; i++) {
      const f = scegli(voci) * caso(0.95, 1.05), d = caso(0.05, 0.1)
      cip(out, u, f, d, scegli(['su', 'giu', 'cip', 'cip']), a * caso(0.5, 1))
      if (Math.random() < 0.3) cip(out, u + d + 0.03, f * 1.08, d * 0.8, 'giu', a * 0.7)
      u += d + caso(0.08, 0.35) + (Math.random() < 0.15 ? caso(0.4, 1.2) : 0)
    }
    return u - t
  }
  // la tortora dal collare: «u-UUU-u», tre note, la seconda lunga e forte; quattro o cinque volte
  const tortora = (out, t, { volte = Math.round(caso(3, 6)), a = 0.2 } = {}) => {
    const f = caso(380, 460), arm = [[1, 1], [2, 0.12], [3, 0.03]]
    let u = t
    for (let i = 0; i < volte; i++) {
      tono(out, u, 0.22, curva([[0, f * 0.97], [0.4, f], [1, f * 0.95]]), { a: a * 0.7, att: 0.03, rel: 0.07, armoniche: arm })
      tono(out, u + 0.3, 0.55, curva([[0, f * 1.02], [0.3, f * 1.06], [1, f * 0.98]]), { a, att: 0.05, rel: 0.14, armoniche: arm })
      tono(out, u + 0.95, 0.3, curva([[0, f * 0.92], [1, f * 0.88]]), { a: a * 0.75, att: 0.04, rel: 0.1, armoniche: arm })
      u += caso(1.6, 2.1)
    }
    return u - t
  }
  // il piccione: «hrrooo-oo», col tremolo ruvido all'inizio; ogni tanto vola via battendo le ali
  const piccioni = (out, t, { a = 0.2, vola = Math.random() < 0.3 } = {}) => {
    const f = caso(270, 340), n = Math.round(caso(2, 5))
    let u = t
    for (let i = 0; i < n; i++) {
      const d = caso(0.45, 0.9)
      tono(out, u, d, curva([[0, f * 0.9], [0.25, f * 1.08], [0.7, f], [1, f * 0.85]]), { a, att: 0.06, rel: 0.2, armoniche: [[1, 1], [2, 0.25], [3, 0.06]], tremolo: [caso(24, 34), 0.8, d * 0.4] })
      u += d + caso(0.15, 0.5)
    }
    if (vola) { ali(out, u + caso(0.2, 1)); u += 1.6 }
    return u - t
  }
  const ali = (out, t, { a = 0.3 } = {}) => {
    const n = Math.round(caso(6, 11))
    let u = t, passo = 0.1
    for (let i = 0; i < n; i++) {
      soffio(out, u, { a: a * (1 - i / n) ** 0.5, att: 0.003, tau: 0.009, tipo: 'rosa', filtri: [filtro('bandpass', caso(700, 1400), 0.8)] })
      u += passo; passo *= caso(0.93, 1.03)
    }
  }
  // la cornacchia grigia: «craa», rauca, due o tre volte
  const cornacchia = (out, t, { a = 0.16, volte = Math.round(caso(2, 4)) } = {}) => {
    let u = t
    for (let i = 0; i < volte; i++) {
      const d = caso(0.25, 0.4), f = caso(380, 470), bus = guadagno(1)
      fila(bus, filtro('bandpass', caso(1000, 1300), 3), guadagno(1), out)
      fila(bus, filtro('bandpass', caso(1800, 2300), 4), guadagno(0.6), out)
      tono(bus, u, d, curva([[0, f * 0.9], [0.3, f * 1.1], [1, f * 0.85]]), { tipo: 'sawtooth', a: a * 3, att: 0.02, rel: 0.08, vibrato: 0.05, vf: 33 })
      soffio(bus, u, { a: a * 0.5, att: 0.03, tau: d / 3 })
      u += d + caso(0.35, 0.6)
    }
    return u - t
  }
  // i rondoni (da fine aprile ad agosto): un gruppo che passa gridando, strilli acuti e ruvidi, da un lato all'altro
  const rondoni = (out, t, { a = 0.1, verso = scegli([-1, 1]) } = {}) => {
    const p = c.createStereoPanner(), dur = caso(1.6, 2.6)
    p.connect(out)
    p.pan.setValueAtTime(-0.8 * verso, t); p.pan.linearRampToValueAtTime(0.8 * verso, t + dur)
    const n = Math.round(caso(4, 9))
    for (let i = 0; i < n; i++) {
      const u = t + caso(0, dur * 0.7), d = caso(0.35, 0.8), f = caso(3400, 4300), hp = filtro('highpass', 2500)
      hp.connect(p)
      tono(hp, u, d, curva([[0, f * 0.92], [0.2, f * 1.05], [1, f * 0.97]]), { tipo: 'square', a: a * caso(0.4, 1), att: 0.03, rel: 0.15, vibrato: 0.08, vf: caso(35, 55) })
    }
    return dur + 0.8
  }
  // il merlo (all'alba e al tramonto, in primavera): una frase di note di flauto che scivolano, e in fondo il cinguettio
  const merlo = (out, t, { a = 0.18 } = {}) => {
    const base = caso(1700, 2300), n = Math.round(caso(3, 7)), salti = [1, 1.12, 1.25, 1.33, 1.5, 0.89, 0.75, 1.68]
    let u = t
    for (let i = 0; i < n; i++) {
      const f = base * scegli(salti), d = caso(0.08, 0.22), f2 = f * scegli([0.9, 1, 1.1, 1.2, 0.8])
      tono(out, u, d, curva([[0, f], [0.6, f2], [1, f2 * 0.97]]), { a: a * caso(0.6, 1), att: 0.015, rel: 0.05, armoniche: [[1, 1], [2, 0.08]] })
      u += d + caso(0.03, 0.09)
    }
    for (let i = 0, m = Math.round(caso(3, 6)); i < m; i++) {
      const f = caso(4500, 6500), d = caso(0.025, 0.05)
      tono(out, u, d, curva([[0, f], [1, f * caso(0.7, 1.3)]], 8), { a: a * 0.35, att: 0.004, rel: 0.01 })
      u += d + 0.02
    }
    return u - t
  }
  // la civetta, di notte: «chiù», un lamento che sale e ricade
  const civetta = (out, t, { a = 0.18 } = {}) => {
    tono(out, t, 0.5, curva([[0, 1150], [0.55, caso(1580, 1700)], [1, 1380]]), { a, att: 0.06, rel: 0.18, armoniche: [[1, 1], [2, 0.05]], vibrato: 0.006, vf: 18 })
    return 0.5
  }
  // l'allocco (d'autunno e d'inverno è il suo momento): «huuu…», una pausa, «hu, hu-hu-hu-huuuuu» col vibrato; a volte
  // risponde la femmina, «chiuìk»
  const allocco = (out, t, { a = 0.22 } = {}) => {
    const f = caso(380, 440), arm = [[1, 1], [2, 0.04]]
    tono(out, t, 0.85, curva([[0, f * 0.97], [0.2, f * 1.02], [1, f * 0.97]]), { a, att: 0.08, rel: 0.25, armoniche: arm })
    let u = t + 0.85 + caso(2.5, 4)
    tono(out, u, 0.14, curva([[0, f], [1, f * 0.98]]), { a: a * 0.6, att: 0.03, rel: 0.05, armoniche: arm }); u += 0.4
    tono(out, u, 0.45, curva([[0, f * 0.97], [1, f]]), { a: a * 0.7, att: 0.04, rel: 0.05, armoniche: arm, tremolo: [9, 0.9, 0.45] }); u += 0.5
    tono(out, u, 1.1, curva([[0, f], [0.2, f * 1.04], [1, f * 0.96]]), { a, att: 0.06, rel: 0.35, armoniche: arm, vibrato: 0.018, vf: 6.5 }); u += 1.1
    if (Math.random() < 0.35) {
      const bp = filtro('bandpass', 1600, 2); bp.connect(out)
      tono(bp, u + caso(1, 3), 0.28, curva([[0, 1300], [0.5, 1950], [1, 1700]]), { tipo: 'sawtooth', a: a * 1.4, att: 0.02, rel: 0.1 })
    }
    return u - t + 3
  }
  // i grilli (le sere d'estate): ognuno canta a gruppi di tre o quattro impulsi, ogni periodo secondi (lo dice la
  // temperatura, la legge di Dolbear: suono.js); un tampone di 6 s che si ripete, già col suo lato per ognuno
  const grilli = (periodo, sec = 6) => {
    const n = Math.round(sec * sr), L = Math.round(0.016 * sr), passo = Math.round(0.03 * sr)
    const voci = Array.from({ length: 6 }, () => {
      const p = periodo * caso(0.9, 1.12), tempi = []
      for (let t = Math.random() * p; t < sec; t += p * caso(0.96, 1.04)) tempi.push(Math.round(t * sr))
      return { w: TAU * caso(4300, 4900) / sr, impulsi: Math.random() < 0.5 ? 3 : 4, tempi, lato: [caso(0.1, 1), caso(0.1, 1)], a: caso(0.3, 1) }
    })
    return picco(tampone(sec, 2, (d, k) => {
      for (const v of voci) for (const i0 of v.tempi) for (let q = 0; q < v.impulsi; q++) for (let i = 0; i < L; i++) {
        const j = i0 + q * passo + i, e = Math.sin(Math.PI * i / L)
        d[j % n] += v.a * v.lato[k] * e * e * Math.sin(v.w * j)
      }
    }), 0.8)
  }
  // le cicale (i pomeriggi caldi d'estate): il frinire, una raspa veloce su un fischio acuto, che cresce e cala piano
  const cicale = (sec = 6) => {
    const giro = (f) => Math.max(1, Math.round(f * sec)) / sec
    const voci = Array.from({ length: 3 }, () => ({ f: giro(caso(4300, 6000)), am: giro(caso(90, 180)), onda: giro(caso(0.2, 0.4)), fi: Math.random() * TAU, lato: [caso(0.2, 1), caso(0.2, 1)] }))
    return picco(tampone(sec, 2, (d, k) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / sr
        let v = 0
        for (const s of voci) {
          const p = 0.5 + 0.5 * Math.sin(TAU * s.am * t), onda = 0.3 + 0.7 * liscia(0.5 + 0.5 * Math.sin(TAU * s.onda * t + s.fi))
          v += s.lato[k] * Math.sin(TAU * s.f * t) * p * p * p * onda * (0.75 + 0.25 * Math.random())
        }
        d[i] = v
      }
    }), 0.8)
  }

  // ── le campane: si calcolano una volta (OfflineAudioContext), poi si suonano ──
  const campane = new Map()
  // la campana di prima f (il colpo si sente un'ottava sopra, la nominale), lunga sec
  const campana = (f, sec = 9) => {
    if (campane.has(f)) return campane.get(f)
    const R0 = 44100, oc = new OfflineAudioContext(1, Math.round(sec * R0), R0)
    for (const [r, a, k] of PARZIALI) for (const s of [-1, 1]) {
      const o = oc.createOscillator(), g = oc.createGain()
      o.frequency.value = f * r * (1 + caso(-0.004, 0.004)) + s * caso(0.25, 0.9) * Math.sqrt(r)
      g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(a / 2, 0.002 + 0.001 * r); g.gain.setTargetAtTime(0, 0.004, (sec * k) / 4.5)
      o.connect(g).connect(oc.destination); o.start(0)
    }
    // il battaglio: un colpo di rumore, acuto
    const b = oc.createBuffer(1, 2205, R0), d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 260) * 0.5
    const s = oc.createBufferSource(), bp = oc.createBiquadFilter()
    bp.type = 'bandpass'; bp.frequency.value = f * 6; s.buffer = b; s.connect(bp).connect(oc.destination); s.start(0)
    const p = oc.startRendering().then((b) => picco(b, 0.9))
    campane.set(f, p)
    return p
  }
  const rintocco = (out, t, f, { a = 0.5, sec = 9 } = {}) => campana(f, sec).then((b) => {
    const s = c.createBufferSource()
    s.buffer = b; s.playbackRate.value = caso(0.998, 1.002)
    fila(s, guadagno(a), out); s.start(Math.max(t, c.currentTime))
  })

  // ── i tuoni: lo schianto (solo se è vicino), poi il rombo che rotola, a ondate, sempre più grave. Calcolati in un
  // tampone, quattro per tipo e poi riusati ──
  const tuoni = new Map()
  const tuono = (vicino = 0.5) => {
    const chiave = Math.round(vicino * 3) + ':' + Math.floor(Math.random() * 3)
    if (tuoni.has(chiave)) return tuoni.get(chiave)
    vicino = Math.round(vicino * 3) / 3
    const sec = 8 + 4 * (1 - vicino), n = Math.round(sec * sr), env = new Float32Array(n)
    const ondata = (t0, a, att, dec) => {
      for (let i = Math.max(0, Math.round(t0 * sr)), fine = Math.min(n, Math.round((t0 + att + dec * 6) * sr)); i < fine; i++) {
        const t = i / sr - t0
        env[i] += a * (t < att ? liscia(t / att) : Math.exp(-(t - att) / dec))
      }
    }
    let t = vicino > 0.6 ? 0 : caso(0.05, 0.3)
    ondata(t, 1, vicino > 0.6 ? 0.004 : 0.09, 0.25 + 0.5 * (1 - vicino))
    for (let i = 0, k = Math.round(caso(3, 8)); i < k; i++) { t += caso(0.15, 0.9) * (1 + i * 0.15); ondata(t, caso(0.25, 0.85) * Math.exp(-t / 3), caso(0.04, 0.3), caso(0.3, 1.4)) }
    ondata(0.1, 0.25, 0.4, 2.2)
    // (in fondo sfuma: tagliato, il rombo finiva con uno scatto)
    for (let i = 0; i < n; i++) env[i] *= liscia((sec - i / sr) / 2)
    const b = picco(tampone(sec, 2, (d) => {
      let y1 = 0, y2 = 0, s1 = 0, m = 0, xp = 0, a = 0
      const kS = 1 - Math.exp(-TAU * 55 / sr)
      for (let i = 0; i < n; i++) {
        const tt = i / sr, w = Math.random() * 2 - 1
        m = (m + 0.02 * w) / 1.02
        if (i % 64 === 0) a = 1 - Math.exp(-TAU * (90 + (300 + 1400 * vicino) * Math.exp(-tt / (0.25 + 0.6 * vicino))) / sr)
        y1 += a * (m * 3.5 - y1); y2 += a * (y1 - y2); s1 += kS * (m * 3.5 - s1)
        const schianto = vicino > 0.6 ? (w - xp) * Math.exp(-tt / 0.06) * (vicino - 0.6) * 2.5 : 0
        xp = w
        d[i] = (y2 * 2.2 + s1 * 1.5) * env[i] + schianto
      }
    }), 0.95)
    tuoni.set(chiave, b)
    return b
  }

  // ── la pioggia: le gocce sulla lamiera (ognuna fa suonare due o tre modi del metallo, acuti e cortissimi) e nelle
  // pozzanghere (la bolla che fischia salendo, o uno schizzo). Tamponi stereo che si ripetono: scritti girando intorno
  // al fondo, così non hanno giunta ──
  const lamiera = (densita, sec) => picco(tampone(sec, 2, (d) => {
    const n = d.length
    for (let j = 0, q = Math.round(densita * sec); j < q; j++) {
      const t0 = Math.floor(Math.random() * n), a = 0.03 + 0.45 * Math.random() ** 4
      for (let m = 0, modi = Math.random() < 0.6 ? 2 : 3; m < modi; m++) {
        const w = TAU * caso(1000, 4600) / sr, tau = caso(0.0015, 0.007) * sr, fi = Math.random() * TAU, am = a * caso(0.4, 1)
        for (let i = 0, L = Math.round(tau * 5); i < L; i++) d[(t0 + i) % n] += am * Math.exp(-i / tau) * Math.sin(w * i + fi)
      }
    }
  }), 0.9)
  const pozze = (densita, sec) => picco(tampone(sec, 2, (d) => {
    const n = d.length
    for (let j = 0, q = Math.round(densita * sec); j < q; j++) {
      const t0 = Math.floor(Math.random() * n), a = 0.05 + 0.4 * Math.random() ** 3
      if (Math.random() < 0.55) {
        const f0 = caso(1100, 3200), sale = caso(25, 70), tau = caso(0.004, 0.012) * sr
        let fase = 0
        for (let i = 0, L = Math.round(tau * 5); i < L; i++) { fase += TAU * f0 * (1 + (sale * i) / sr) / sr; d[(t0 + i) % n] += a * Math.exp(-i / tau) * Math.sin(fase) }
      } else {
        const tau = caso(0.001, 0.003) * sr
        let p = 0
        for (let i = 0, L = Math.round(tau * 5); i < L; i++) { const w = Math.random() * 2 - 1; d[(t0 + i) % n] += a * 0.6 * (w - p) * Math.exp(-i / tau); p = w }
      }
    }
  }), 0.9)

  // ── la saracinesca battuta: il colpo (i modi del pannello) e le doghe che ballano nelle guide; il vento le fa sbattere ──
  const metalli = []
  const metallo = () => {
    if (metalli.length < 3) metalli.push(picco(tampone(1.4, 1, (d) => {
      for (const [f, am, tau] of LAMIERA) {
        const w = TAU * f * caso(0.97, 1.03) / sr, T = tau * sr * caso(0.8, 1.2), fi = Math.random() * TAU
        for (let i = 0; i < Math.min(d.length, T * 6); i++) d[i] += am * Math.exp(-i / T) * Math.sin(w * i + fi)
      }
      for (let i = 0; i < 300; i++) d[i] += (Math.random() * 2 - 1) * Math.exp(-i / 60) * 0.8
    }), 0.9))
    return scegli(metalli)
  }
  const colpo = (out, t, { a = 0.4, rate = 1, fine = 0 } = {}) => {
    const s = c.createBufferSource()
    s.buffer = metallo(); s.playbackRate.value = rate
    fila(s, guadagno(a), out); s.start(t)
    if (fine) s.stop(t + fine)
  }
  const doga = (out, t, a) => {
    colpo(out, t, { a: a * 0.5, rate: caso(1.6, 2.6), fine: 0.12 })
    soffio(out, t, { a, att: 0.0005, tau: 0.004, filtri: [filtro('bandpass', caso(1500, 3200), 3)] })
  }
  // (la saracinesca bussata col dito sta più sotto, fra le cose che si toccano: bussa)
  const sbatte = (out, t, { a = 0.2, n = Math.round(caso(4, 14)) } = {}) => {
    let u = t
    for (let i = 0; i < n; i++) {
      doga(out, u, a * caso(0.3, 1))
      if (Math.random() < 0.25) colpo(out, u, { a: a * 0.35, rate: caso(0.9, 1.4), fine: 0.5 })
      u += caso(0.04, 0.09)
    }
  }

  // ── la carta: un tampone di crepitio (rumore a scatti) per il foglio che si alza e il tagliando strappato ──
  let crepitio = null
  const crepita = () => (crepitio ??= tampone(1.5, 1, (d) => {
    let e = 0
    for (let i = 0; i < d.length; i++) { if (Math.random() < 500 / sr) e = caso(0.3, 1); e *= 0.995; d[i] = (Math.random() * 2 - 1) * e }
  }))
  const fruscio = (out, t, { a = 0.05 } = {}) => {
    const d = caso(0.08, 0.16), s = fonte(crepita(), t, { fine: t + d + 0.02, rate: caso(0.8, 1.2) }), g = guadagno(0)
    fila(s, filtro('bandpass', caso(2500, 4000), 0.7), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.012); g.gain.linearRampToValueAtTime(0, t + d)
  }
  const strappo = (out, t, { a = 0.32 } = {}) => {
    const d = caso(0.18, 0.3), s = fonte(crepita(), t, { fine: t + d + 0.02, rate: caso(0.9, 1.15) }), g = guadagno(0)
    fila(s, filtro('bandpass', 2600, 0.6), filtro('highshelf', 5000, 0.7, 4), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 0.5, t + 0.02); g.gain.linearRampToValueAtTime(a, t + d * 0.85); g.gain.linearRampToValueAtTime(0, t + d)
    for (let i = 0; i < 5; i++) soffio(out, t + caso(0, d), { a: a * 0.5, att: 0.0005, tau: 0.0012, filtri: [filtro('highpass', 2200)] })
  }
  // il pomodoro del caricamento che scoppia: lo schiaffo, lo spiaccicato che scende, gli schizzi che ricadono
  const splat = (out, t, { a = 0.45 } = {}) => {
    soffio(out, t, { a, att: 0.003, tau: 0.06, tipo: 'rosa', filtri: [filtro('lowpass', 700)] })
    const s = fonte(R.bianco, t, { fine: t + 0.5 }), bp = filtro('bandpass', 1800, 5), g = guadagno(0)
    bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(260, t + 0.3)
    fila(s, bp, g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 1.4, t + 0.01); g.gain.setTargetAtTime(0, t + 0.01, 0.09)
    for (let i = 0; i < 5; i++) goccia(out, t + caso(0.12, 0.5), { f: caso(500, 1200), a: caso(0.08, 0.18) })
  }

  // ── la gente e le cose della città ──
  // il motorino: un 50 a due tempi in un'altra strada, a D metri, che passa da un lato all'altro (il variatore lo tiene
  // su di giri: «neeee», col Doppler); dura qualche secondo
  const motorino = (out, t, { durata = caso(7, 11), verso = scegli([-1, 1]), D = caso(18, 35), a = 0.22 } = {}) => {
    const n = Math.ceil(durata * 30), giri = new Float32Array(n), vol = new Float32Array(n), lato = new Float32Array(n)
    const v = caso(9, 14), f0 = caso(95, 130), L = v * durata
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), tt = u * durata, x = verso * (-L / 2 + v * tt), r = Math.hypot(x, D)
      giri[i] = f0 * (0.8 + 0.2 * liscia(u * 4)) * (1 + 0.03 * Math.sin(tt * 2.3)) * 343 / (343 + (verso * v * x) / r)
      vol[i] = a * (D / r) ** 1.3 * liscia(u * 8) * liscia((1 - u) * 8)
      lato[i] = (0.7 * x) / r
    }
    const o1 = c.createOscillator(), o2 = c.createOscillator(), bp = filtro('bandpass', 700, 0.7), g = guadagno(0), p = c.createStereoPanner()
    o1.type = 'sawtooth'; o2.type = 'square'
    o1.frequency.setValueCurveAtTime(giri, t, durata); o2.frequency.setValueCurveAtTime(giri.map((f) => f * 2.005), t, durata)
    fila(o1, guadagno(0.6), bp); fila(o2, guadagno(0.25), bp); fila(bp, filtro('lowpass', 1800), g, p, out)
    g.gain.setValueCurveAtTime(vol, t, durata); p.pan.setValueCurveAtTime(lato, t, durata)
    for (const o of [o1, o2]) { o.start(t); o.stop(t + durata + 0.05) }
    return durata
  }
  // il clacson di qualcuno, lontano: due toni a una terza, uno o due colpi
  const clacson = (out, t, { a = 0.12 } = {}) => {
    const f = caso(380, 460), bp = filtro('bandpass', 1400, 0.8)
    bp.connect(out)
    let u = t
    for (const d of scegli([[0.25], [0.12, 0.3], [0.6], [0.1, 0.1]])) { tono(bp, u, d, fisso(f), { tipo: 'square', a, att: 0.01, rel: 0.03, armoniche: [[1, 1], [1.26, 0.8]] }); u += d + 0.1 }
    return u - t
  }
  // la tapparella di qualcuno al palazzo di fronte: la cinghia che scorre sul rullo (lo scatto delle stecche, il rombo
  // del cassonetto). Giù va da sola e finisce con un colpo; su la si tira a strattoni
  const tapparella = (out, t, { giu = Math.random() < 0.5, a = 0.22 } = {}) => {
    const tratti = giu ? [[caso(1.6, 2.8), caso(14, 20), 1.25]] : Array.from({ length: Math.round(caso(3, 6)) }, () => [caso(0.35, 0.6), caso(9, 13), 1])
    let u = t
    for (const [d, passi, accelera] of tratti) {
      const s = fonte(R.marrone, u, { fine: u + d + 0.1 }), g = guadagno(0)
      fila(s, filtro('bandpass', 320, 1.2), g, out)
      g.gain.setValueAtTime(0, u); g.gain.linearRampToValueAtTime(a * 0.8, u + 0.06); g.gain.setValueAtTime(a * 0.8, u + d - 0.05); g.gain.linearRampToValueAtTime(0, u + d)
      for (let k = u, r = passi; k < u + d; k += 1 / r, r *= accelera ** (1 / (passi * d))) soffio(out, k, { a: a * caso(0.4, 1), att: 0.001, tau: 0.004, filtri: [filtro('bandpass', caso(1400, 2200), 2)] })
      u += d + (giu ? 0 : caso(0.25, 0.6))
    }
    if (giu) {
      tono(out, u, 0.3, curva([[0, 140], [1, 70]]), { a: a * 1.5, att: 0.003, cala: 0.06 })
      soffio(out, u, { a, att: 0.001, tau: 0.02, tipo: 'rosa', filtri: [filtro('lowpass', 900)] })
    }
    return u - t + 0.3
  }

  // ── l'auto che passa: il fruscio delle gomme sull'asfalto (bagnato: più acuto e sibilante), il motore sotto. dop è la
  // curva del Doppler (1 = ferma) lunga T secondi da t; suono.js le dà il volume e il lato. Col neon sotto, i tamarri:
  // la cassa e il basso dai finestrini chiusi, e la targa che vibra ──
  const auto = (out, t, T, dop, { bagnato = 0.5, neon = false, giri = caso(30, 46) } = {}) => {
    const s = fonte(R.rosa, t, { fine: t + T + 0.05 }), bp = filtro('bandpass', 1000, 0.55)
    bp.frequency.setValueCurveAtTime(dop.map((d) => (700 + 700 * bagnato) * d), t, T)
    fila(s, bp, filtro('highshelf', 3000, 0.7, 2 + 8 * bagnato), guadagno(0.9), out)
    const m = c.createOscillator()
    m.type = 'sawtooth'; m.frequency.setValueCurveAtTime(dop.map((d) => giri * d), t, T)
    fila(m, filtro('lowpass', 240), guadagno(0.3), out)
    fila(m, filtro('bandpass', 480, 2), guadagno(0.1), out)
    m.start(t); m.stop(t + T + 0.05)
    if (neon) tamarri(out, t, T)
  }
  const tamarri = (out, t, T) => {
    const lp = filtro('lowpass', 150, 1.2), giro = [55, 55, 65.41, 49], b = 60 / caso(122, 132)
    fila(lp, guadagno(0.55), out)
    for (let k = 0, u = t + caso(0, b); u < t + T - 0.2; k++, u += b / 2) {
      if (k % 2 === 0) {
        tono(lp, u, 0.28, curva([[0, 120], [0.2, 52], [1, 45]], 12), { a: 1, att: 0.002, rel: 0.2 })
        soffio(out, u, { a: 0.05, att: 0.002, tau: 0.03, filtri: [filtro('bandpass', 750, 6)] })
      } else tono(lp, u, b * 0.45, fisso(giro[(k >> 3) % 4]), { tipo: 'sawtooth', a: 0.5, att: 0.005, rel: 0.04 })
    }
  }
  const stridio = (out, t, { a = 0.04 } = {}) => tono(out, t, caso(0.35, 0.7), curva([[0, 3000], [1, caso(2700, 3300)]], 8), { a, att: 0.05, rel: 0.12, vibrato: 0.01, vf: 7, armoniche: [[1, 1], [2.02, 0.2]] })
  // un'auto ferma col motore al minimo (la regia la mette dove vuole): ferma(t) la fa ripartire e andare via
  const minimo = (out) => {
    const t = c.currentTime, o = c.createOscillator(), g = guadagno(0), lp = filtro('lowpass', 200)
    o.type = 'sawtooth'; o.frequency.value = caso(23, 28)
    const l = c.createOscillator(); l.frequency.value = 0.7; fila(l, guadagno(0.6), o.frequency)
    fila(o, lp, g, out); fila(o, filtro('bandpass', 420, 2), guadagno(0.04), g)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.8)
    o.start(t); l.start(t)
    return {
      ferma: (u) => {
        o.frequency.cancelScheduledValues(u); o.frequency.setValueAtTime(o.frequency.value, u); o.frequency.linearRampToValueAtTime(48, u + 1.2)
        lp.frequency.linearRampToValueAtTime(500, u + 1.2); g.gain.setTargetAtTime(0, u + 0.6, 0.7)
        o.stop(u + 5); l.stop(u + 5)
      },
    }
  }

  // ── quello che ronza sempre ──
  // il trasformatore dell'insegna: 50 Hz e le sue armoniche pari (il nucleo vibra a 100), più lo sfrigolio del gas nei
  // tubi; suono.js li muove con lo sfarfallio della pagina
  const ronzio = (out) => {
    const re = new Float32Array(33), im = new Float32Array(33)
    for (let h = 1; h <= 32; h++) im[h] = (h % 2 ? 0.05 : 1) / h ** 0.8
    const o = c.createOscillator(), z = c.createOscillator(), gH = guadagno(0), gZ = guadagno(0)
    o.setPeriodicWave(c.createPeriodicWave(re, im)); o.frequency.value = 50
    z.type = 'sawtooth'; z.frequency.value = 100
    fila(o, filtro('peaking', 400, 1, 6), gH, out); fila(z, filtro('highpass', 1800, 0.8), gZ, out)
    o.start(); z.start()
    return { ronza: gH.gain, sfrigola: gZ.gain }
  }
  const scintilla = (out, t, a = caso(0.04, 0.14)) => soffio(out, t, { a, att: 0.0005, tau: caso(0.001, 0.005), filtri: [filtro('highpass', 2500)] })
  // il condizionatore dello split, fuori vista: il compressore e la ventola
  const split = (out) => {
    const s = fonte(R.marrone, c.currentTime), o = c.createOscillator(), g = guadagno(0), gV = guadagno(0.7)
    const re = new Float32Array(9), im = new Float32Array(9)
    for (let h = 1; h <= 8; h++) im[h] = 1 / h ** 1.4
    o.setPeriodicWave(c.createPeriodicWave(re, im)); o.frequency.value = 47
    const l = c.createOscillator(); l.frequency.value = 13; fila(l, guadagno(0.15), gV.gain)
    fila(s, filtro('lowpass', 420), gV, g); fila(o, guadagno(0.25), g); g.connect(out)
    o.start(); l.start()
    return { g: g.gain }
  }
  // il PC del negozio: la ventola, l'alimentatore, il disco a 7200 giri (120 Hz)
  const ventola = (out) => {
    const s = fonte(R.rosa, c.currentTime), g = guadagno(0), lp = filtro('lowpass', 900)
    const o = c.createOscillator(), gd = guadagno(0), h = c.createOscillator()
    o.frequency.value = 120; h.frequency.value = 100
    fila(s, lp, g, out); fila(h, guadagno(0.12), g); fila(o, gd, out)
    o.start(); h.start()
    return { g: g.gain, disco: gd.gain, lp: lp.frequency }
  }
  const bip = (out, t, { f = 990, d = 0.16, a = 0.16 } = {}) => tono(out, t, d, fisso(f), { tipo: 'square', a, att: 0.002, rel: 0.006 })
  const floppy = (out, t, { a = 0.25 } = {}) => {
    const bp = filtro('bandpass', 1300, 2.5)
    bp.connect(out)
    tono(bp, t, 0.18, curva([[0, 240], [1, 260]], 4), { tipo: 'square', a, att: 0.004, rel: 0.02 })
    tono(bp, t + 0.3, 0.16, curva([[0, 260], [1, 230]], 4), { tipo: 'square', a, att: 0.004, rel: 0.02 })
    soffio(out, t + 0.5, { a: a * 0.6, att: 0.0005, tau: 0.004, filtri: [filtro('bandpass', 2500, 2)] })
  }
  const clic = (out, t, a = 0.18) => {
    soffio(out, t, { a, att: 0.0004, tau: 0.0015, filtri: [filtro('bandpass', caso(2800, 4200), 3)] })
    tono(out, t, 0.03, fisso(caso(160, 220)), { a: a * 0.4, att: 0.001, cala: 0.006 })
  }
  const giri = (out, t, { su = true, a = 0.05 } = {}) => {
    const d = su ? 3.2 : 2.4
    tono(out, t, d, su ? curva([[0, 20], [1, 120]]) : curva([[0, 120], [1, 25]]), { a, att: su ? 0.6 : 0.01, rel: su ? 0.4 : 1.4, armoniche: [[1, 1], [2, 0.3], [3, 0.12]] })
  }
  const tasto = (out, t, { a = 0.16, spazio = false } = {}) => {
    const f = spazio ? 1300 : caso(2200, 3400)
    soffio(out, t, { a, att: 0.0005, tau: 0.002, filtri: [filtro('bandpass', f, 2)] })
    tono(out, t, 0.04, fisso(spazio ? 140 : caso(220, 300)), { a: a * 0.5, att: 0.001, cala: 0.007 })
    soffio(out, t + caso(0.07, 0.11), { a: a * 0.5, att: 0.0005, tau: 0.0015, filtri: [filtro('bandpass', f * 1.2, 2)] })
  }
  // quattro note di legno morbide quando arriva la scrivania (non è il suono di Ubuntu: è suo)
  const accesso = (out, t, { a = 0.14 } = {}) => {
    for (const [u, f, k] of [[0, 659.3, 1], [0.16, 987.8, 0.9], [0.32, 830.6, 0.9], [0.5, 1318.5, 0.6]]) tono(out, t + u, 1.2, fisso(f), { a: a * k, att: 0.004, cala: 0.22, armoniche: [[1, 1], [3.9, 0.12], [9.2, 0.04]] })
  }

  // ── le cose che si toccano (22.10) ────────────────────────────────────────
  // I corpi percossi: i modi di un corpo (frequenza, ampiezza, costante di tempo), ognuno due toni vicinissimi che
  // battono, più il colpo (un rumore che si spegne subito: più lungo, più sordo), calcolati una volta in un tampone; tre
  // varianti un filo diverse, suonate a caso: due colpi di fila non sono mai uguali
  const CORPI = {
    // la saracinesca: il rombo grave del telo di doghe (corto: le doghe sono lente nelle guide), poi la lamiera
    saracinesca: { modi: [[52, 1, 0.22], [74, 0.8, 0.2], [109, 0.7, 0.16], [158, 0.55, 0.13], [231, 0.5, 0.11], [325, 0.42, 0.09], [452, 0.38, 0.075], [618, 0.3, 0.06], [847, 0.26, 0.05], [1163, 0.2, 0.038], [1590, 0.15, 0.028], [2210, 0.1, 0.02], [3080, 0.07, 0.013], [4300, 0.05, 0.009]], colpo: 0.5, tc: 0.002, sec: 1.1 },
    // la lastra della porta, che si flette (i modi bassi) e canta un attimo (gli acuti)
    vetro: { modi: [[96, 0.7, 0.075], [148, 0.65, 0.065], [229, 0.55, 0.055], [347, 0.45, 0.045], [523, 0.35, 0.035], [786, 0.26, 0.028], [1170, 0.2, 0.022], [1730, 0.15, 0.018], [2640, 0.14, 0.014], [3960, 0.11, 0.01], [5870, 0.07, 0.007]], colpo: 0.35, tc: 0.0008, sec: 0.5 },
    alluminio: { modi: [[410, 0.6, 0.05], [690, 0.55, 0.04], [1050, 0.5, 0.035], [1540, 0.4, 0.03], [2280, 0.3, 0.02], [3310, 0.2, 0.014], [4720, 0.12, 0.009]], colpo: 0.4, tc: 0.0008, sec: 0.4 },
    // il tubo d'acciaio del maniglione: canta a lungo
    acciaio: { modi: [[310, 0.3, 0.06], [1180, 0.5, 0.35], [2650, 0.45, 0.28], [4370, 0.3, 0.2], [6290, 0.18, 0.12], [8410, 0.1, 0.08]], colpo: 0.3, tc: 0.0006, sec: 1.5 },
    // la lattina schiacciata: alluminio sottile, smorzato dalle pieghe
    lattina: { modi: [[480, 0.5, 0.03], [1220, 0.6, 0.05], [2130, 0.55, 0.04], [3320, 0.45, 0.03], [4870, 0.3, 0.02], [6740, 0.2, 0.012]], colpo: 0.5, tc: 0.0007, sec: 0.4 },
    ghisa: { modi: [[176, 0.8, 0.35], [404, 0.65, 0.3], [741, 0.5, 0.25], [1215, 0.38, 0.18], [1850, 0.25, 0.12], [2700, 0.15, 0.08]], colpo: 0.6, tc: 0.003, sec: 1.6 },
    ottone: { modi: [[920, 0.35, 0.05], [2080, 0.6, 0.18], [3540, 0.5, 0.14], [5260, 0.35, 0.1], [7400, 0.2, 0.06]], colpo: 0.4, tc: 0.0006, sec: 0.9 },
    legno: { modi: [[190, 0.6, 0.04], [310, 0.55, 0.035], [520, 0.45, 0.03], [780, 0.35, 0.022], [1180, 0.25, 0.015], [1750, 0.15, 0.01]], colpo: 0.6, tc: 0.002, sec: 0.35 },
    // la lamiera smaltata del cartello stradale: sottile e larga, i modi bassi lunghi
    smalto: { modi: [[88, 0.7, 0.4], [131, 0.6, 0.35], [197, 0.5, 0.3], [296, 0.45, 0.25], [520, 0.35, 0.2], [910, 0.3, 0.15], [1480, 0.25, 0.12], [2390, 0.18, 0.09], [3610, 0.12, 0.06]], colpo: 0.35, tc: 0.001, sec: 1.8 },
    pietra: { modi: [[920, 0.5, 0.012], [1580, 0.45, 0.01], [2650, 0.35, 0.007], [4100, 0.2, 0.005]], colpo: 0.8, tc: 0.0025, sec: 0.15 },
    plastica: { modi: [[1850, 0.5, 0.012], [3100, 0.45, 0.01], [4800, 0.3, 0.007]], colpo: 0.6, tc: 0.0006, sec: 0.12 },
    cartone: { modi: [[240, 0.6, 0.03], [380, 0.5, 0.025], [610, 0.35, 0.018], [950, 0.2, 0.012]], colpo: 0.7, tc: 0.003, sec: 0.25 },
    intonaco: { modi: [[130, 0.6, 0.03], [260, 0.45, 0.02], [520, 0.3, 0.012]], colpo: 0.9, tc: 0.004, sec: 0.2 },
  }
  const varianti = new Map()
  const corpo = (nome) => {
    let v = varianti.get(nome)
    if (!v) varianti.set(nome, (v = []))
    if (v.length < 3) {
      const C = CORPI[nome]
      v.push(picco(tampone(C.sec, 1, (d) => {
        for (const [f, am, tau] of C.modi) {
          const f1 = f * caso(0.97, 1.03), f2 = f1 * caso(1.003, 1.012), T = tau * sr * caso(0.85, 1.15), p1 = Math.random() * TAU, p2 = Math.random() * TAU, w1 = (TAU * f1) / sr, w2 = (TAU * f2) / sr
          for (let i = 0, L = Math.min(d.length, T * 7); i < L; i++) d[i] += am * Math.exp(-i / T) * (0.6 * Math.sin(w1 * i + p1) + 0.4 * Math.sin(w2 * i + p2))
        }
        const tc = C.tc * sr
        let lp = 0
        for (let i = 0, L = Math.min(d.length, tc * 8); i < L; i++) { lp += 0.5 * (Math.random() * 2 - 1 - lp); d[i] += lp * C.colpo * Math.exp(-i / tc) }
      }), 0.9))
    }
    return scegli(v)
  }
  // un corpo in out all'istante t: quanto forte, più acuto o più grave (rate), tagliato dopo fine secondi, coi suoi filtri
  const batti = (out, t, nome, { a = 0.4, rate = 1, fine = 0, filtri = [] } = {}) => {
    const s = c.createBufferSource(), g = guadagno(a)
    s.buffer = corpo(nome); s.playbackRate.value = rate
    fila(s, ...filtri, g, out); s.start(t)
    if (fine) { g.gain.setValueAtTime(a, t + fine * 0.7); g.gain.linearRampToValueAtTime(0, t + fine); s.stop(t + fine + 0.01) }
    return s
  }

  // la saracinesca bussata, rifatta: il colpo delle nocche (il tonfo morbido della mano, lo schiocco), il rombo del telo
  // di doghe e la lamiera, poi le doghe che ballano nelle guide e si urtano, sempre più fitte e più piano (come una cosa
  // che rimbalza). alto, da 0 (in fondo) a 1 (in cima): in basso, dove la barra è chiusa col lucchettone, è più secca e
  // balla meno; a metà rimbomba di più; in alto balla di più
  const bussa = (out, t, { a = 0.5, alto = 0.5 } = {}) => {
    const basso = 1 - Math.min(1, alto * 2.5)
    soffio(out, t, { a: a * 0.5, att: 0.002, tau: 0.012, tipo: 'rosa', filtri: [filtro('lowpass', 700)] })
    soffio(out, t, { a: a * 0.3, att: 0.0004, tau: 0.0012, filtri: [filtro('bandpass', 2600, 0.9)] })
    batti(out, t + 0.001, 'saracinesca', { a: a * (0.9 - 0.25 * basso), rate: caso(0.94, 1.06) * (1 + 0.25 * basso), fine: 0.9 - 0.45 * basso, filtri: [filtro('lowshelf', 160, 0.7, 5 * (1 - basso) * Math.sin(Math.PI * Math.min(1, alto)))] })
    const n = Math.round(caso(7, 13) * (1 - 0.55 * basso) * (0.8 + 0.4 * alto))
    let u = t + caso(0.018, 0.03), passo = caso(0.03, 0.05), forza = a * 0.32
    for (let i = 0; i < n; i++) {
      doga(out, u, forza * caso(0.5, 1))
      u += passo * caso(0.7, 1.25); passo *= 0.86; forza *= 0.8
    }
  }

  // il campanello del negozio: dentro, dietro la porta, il campanello elettrico che trilla finché il dito tiene (il
  // martelletto batte la campana venticinque volte al secondo, l'elettrocalamita ronza sotto). Il tampone si ripete
  // senza giunta (ogni colpo che sfora la fine ricomincia dall'inizio); il pulsante scatta giù e su (in out, il citofono)
  let trillo = null
  const campanella = () => (trillo ??= picco(tampone(1.2, 1, (d) => {
    const n = d.length, f0 = caso(1150, 1350), P = [[1, 1, 0.32], [2.76, 0.5, 0.18], [5.4, 0.25, 0.09], [8.93, 0.12, 0.05]]
    for (let s0 = 0; s0 < n; s0 += Math.round(sr / caso(23.5, 26.5))) {
      const forza = caso(0.7, 1)
      for (const [r, am, tau] of P) { const w = (TAU * f0 * r) / sr, T = tau * sr; for (let i = 0; i < T * 3; i++) d[(s0 + i) % n] += forza * am * Math.exp(-i / T) * Math.sin(w * i) }
    }
  }), 0.8))
  const campanello = (out, dentro, t) => {
    clic(out, t, 0.22)
    const s = fonte(campanella(), t + 0.03), g = guadagno(0), z = c.createOscillator(), gz = guadagno(0)
    fila(s, g, dentro)
    g.gain.setValueAtTime(0, t + 0.03); g.gain.linearRampToValueAtTime(0.55, t + 0.07)
    z.type = 'sawtooth'; z.frequency.value = 100
    fila(z, filtro('bandpass', 700, 1.5), gz, dentro)
    gz.gain.setValueAtTime(0, t + 0.03); gz.gain.linearRampToValueAtTime(0.035, t + 0.07)
    z.start(t + 0.03)
    return {
      lascia: (u) => {
        g.gain.cancelScheduledValues(u); g.gain.setValueAtTime(g.gain.value, u); g.gain.setTargetAtTime(0, u, 0.12)
        gz.gain.cancelScheduledValues(u); gz.gain.setValueAtTime(gz.gain.value, u); gz.gain.setTargetAtTime(0, u, 0.02)
        s.stop(u + 1.4); z.stop(u + 0.3)
        clic(out, u, 0.14)
      },
    }
  }
  // il citofono che si apre e nessuno parla: lo scatto, il fruscio della linea (la banda del telefono), il ronzio della
  // rete, lo scatto che chiude
  const risponde = (out, t, { d = caso(1.2, 2.4) } = {}) => {
    clic(out, t, 0.16)
    const s = fonte(R.rosa, t, { fine: t + d + 0.1 }), g = guadagno(0), o = c.createOscillator(), go = guadagno(0)
    fila(s, filtro('highpass', 320), filtro('lowpass', 3200), filtro('peaking', 1200, 1, 5), g, out)
    for (const [gg, v] of [[g, 0.05], [go, 0.007]]) { gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(v, t + 0.02); gg.gain.setValueAtTime(v, t + d - 0.05); gg.gain.linearRampToValueAtTime(0, t + d) }
    o.frequency.value = 50; fila(o, go, out); o.start(t); o.stop(t + d + 0.05)
    clic(out, t + d, 0.18)
    return d
  }
  // la piastra del citofono: alluminio, un colpetto
  const citofono = (out, t, { a = 0.35 } = {}) => {
    batti(out, t, 'alluminio', { a, rate: caso(1.3, 1.6), fine: 0.2 })
    soffio(out, t, { a: a * 0.3, att: 0.0004, tau: 0.0012, filtri: [filtro('bandpass', 3000, 1)] })
  }
  // bussare sul vetro della porta: il tonfo del vetro che si flette, lo schiocco delle nocche, il vetro che canta un
  // attimo, e a volte la porta che balla nel telaio (è chiusa a chiave)
  const vetro = (out, t, { a = 0.45 } = {}) => {
    soffio(out, t, { a: a * 0.35, att: 0.001, tau: 0.008, tipo: 'rosa', filtri: [filtro('lowpass', 900)] })
    soffio(out, t, { a: a * 0.4, att: 0.0003, tau: 0.0009, filtri: [filtro('bandpass', 3800, 0.8)] })
    batti(out, t, 'vetro', { a, rate: caso(0.9, 1.12) })
    if (Math.random() < 0.35) batti(out, t + caso(0.02, 0.04), 'alluminio', { a: a * 0.15, rate: caso(1.3, 1.6), fine: 0.08 })
  }
  // i profili d'alluminio della porta: vuoti, un «tonc» metallico
  const telaio = (out, t, { a = 0.42 } = {}) => {
    soffio(out, t, { a: a * 0.3, att: 0.0005, tau: 0.002, filtri: [filtro('bandpass', 2400, 1)] })
    batti(out, t, 'alluminio', { a, rate: caso(0.92, 1.1) })
  }
  // il maniglione: la porta è chiusa a chiave, la si tira e sbatte sulla serratura (avanti, e indietro più piano), il
  // vetro trema nel telaio, il tubo d'acciaio canta
  const maniglione = (out, t, { a = 0.5 } = {}) => {
    batti(out, t, 'acciaio', { a: a * 0.35, rate: caso(0.95, 1.05) })
    const sbatti = (u, k) => {
      soffio(out, u, { a: a * 0.5 * k, att: 0.0005, tau: 0.003, filtri: [filtro('bandpass', 1300, 1.2)] })
      batti(out, u, 'alluminio', { a: a * 0.4 * k, rate: caso(0.7, 0.85), fine: 0.25 })
      batti(out, u, 'vetro', { a: a * 0.2 * k, rate: caso(1.1, 1.3), fine: 0.2 })
    }
    sbatti(t + 0.04, 1); sbatti(t + caso(0.13, 0.18), 0.55)
  }
  // il lucchettone d'ottone coricato per terra: il colpo dell'ottone, il ferro che lo tiene, due sobbalzi
  const lucchetto = (out, t, { a = 0.45 } = {}) => {
    batti(out, t, 'ottone', { a, rate: caso(0.92, 1.08) })
    batti(out, t + caso(0.02, 0.05), 'acciaio', { a: a * 0.35, rate: caso(0.6, 0.75), fine: 0.4 })
    for (let i = 0, u = t + 0.07; i < 3; i++, u += caso(0.03, 0.06)) batti(out, u, 'ottone', { a: a * 0.15 * (1 - i * 0.3), rate: caso(1.2, 1.5), fine: 0.05 })
  }
  // il tasto di gomma del portachiavi, e le chiavi che tintinnano sull'anello
  const portachiavi = (out, t, { a = 0.35 } = {}) => {
    tono(out, t, 0.04, fisso(caso(300, 380)), { a: a * 0.4, att: 0.001, cala: 0.008 })
    soffio(out, t, { a: a * 0.3, att: 0.0005, tau: 0.002, filtri: [filtro('bandpass', 2000, 1.5)] })
    for (let i = 0, u = t + 0.02; i < 4; i++, u += caso(0.025, 0.07)) batti(out, u, 'ottone', { a: a * caso(0.08, 0.18), rate: caso(1.4, 2), fine: 0.12 })
  }
  // la lattina schiacciata: il colpo dell'alluminio sottile, poi rotola un filo sulla pietra (lo sfrigolio) e ballonzola
  const lattina = (out, t, { a = 0.4 } = {}) => {
    soffio(out, t, { a: a * 0.4, att: 0.0003, tau: 0.001, filtri: [filtro('highpass', 2500)] })
    batti(out, t, 'lattina', { a, rate: caso(0.9, 1.1) })
    const d = caso(0.35, 0.6), s = fonte(R.bianco, t + 0.04, { fine: t + 0.04 + d }), g = guadagno(0)
    fila(s, filtro('bandpass', caso(2600, 3600), 1.2), g, out)
    g.gain.setValueAtTime(0, t + 0.04); g.gain.linearRampToValueAtTime(a * 0.08, t + 0.08); g.gain.setTargetAtTime(0, t + 0.1, d * 0.35)
    for (let i = 0, u = t + caso(0.08, 0.14); i < 3; i++, u += caso(0.06, 0.12)) batti(out, u, 'lattina', { a: a * 0.3 * (1 - i * 0.28), rate: caso(1.05, 1.3), fine: 0.06 })
  }
  // la carta bagnata incollata alle lastre: un risucchio molle, l'acqua che schiocca sotto, una goccia
  const cartaBagnata = (out, t, { a = 0.35 } = {}) => {
    soffio(out, t, { a: a * 0.5, att: 0.008, tau: 0.04, tipo: 'rosa', filtri: [filtro('bandpass', 700, 0.8)] })
    soffio(out, t + 0.02, { a: a * 0.25, att: 0.003, tau: 0.02, filtri: [filtro('bandpass', 1800, 1.5)] })
    goccia(out, t + caso(0.05, 0.12), { f: caso(600, 900), a: a * 0.3 })
  }
  // il pacchetto di sigarette: il cartoncino, il cellophane che crocchia
  const pacchetto = (out, t, { a = 0.35 } = {}) => {
    batti(out, t, 'cartone', { a: a * 0.5, rate: caso(1.3, 1.6) })
    const d = caso(0.18, 0.28), s = fonte(crepita(), t, { fine: t + d + 0.02, rate: caso(1.3, 1.7) }), g = guadagno(0)
    fila(s, filtro('highpass', 3200), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 0.9, t + 0.01); g.gain.setTargetAtTime(0, t + 0.02, d * 0.4)
  }
  // la scatola del ramen: il cartone vuoto, un fruscio, il manico di ferro che tintinna
  const cartone = (out, t, { a = 0.4 } = {}) => {
    batti(out, t, 'cartone', { a, rate: caso(0.9, 1.1) })
    fruscio(out, t + 0.01, { a: a * 0.25 })
    batti(out, t + caso(0.01, 0.03), 'acciaio', { a: a * 0.08, rate: caso(1.8, 2.3), fine: 0.25 })
  }
  // i grissini: il film del pacchetto che crocchia (più secco del cellophane) e dentro i grissini che si urtano; ogni
  // tanto uno si rompe
  const grissini = (out, t, { a = 0.3 } = {}) => {
    const d = caso(0.2, 0.32), s = fonte(crepita(), t, { fine: t + d + 0.02, rate: caso(1.6, 2.1) }), g = guadagno(0)
    fila(s, filtro('highpass', 2200), filtro('peaking', 5000, 1, 4), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.008); g.gain.setTargetAtTime(0, t + 0.02, d * 0.35)
    for (let i = 0, u = t + 0.01; i < 4; i++, u += caso(0.02, 0.07)) {
      soffio(out, u, { a: a * caso(0.25, 0.5), att: 0.0003, tau: 0.0015, filtri: [filtro('bandpass', caso(1500, 3500), 3)] })
      tono(out, u, 0.03, fisso(caso(900, 1400)), { a: a * 0.1, att: 0.0005, cala: 0.006 })
    }
    if (Math.random() < 0.2) { const u = t + caso(0.06, 0.15); soffio(out, u, { a: a * 0.9, att: 0.0005, tau: 0.004, filtri: [filtro('bandpass', 2200, 1.2)] }); soffio(out, u + 0.006, { a: a * 0.5, att: 0.0005, tau: 0.01, filtri: [filtro('highpass', 3000)] }) }
  }
  // la pozzanghera: lo schiaffo dell'acqua, la bolla che fischia salendo (il «plop»), gli schizzi che ricadono
  const pozza = (out, t, { a = 0.45 } = {}) => {
    soffio(out, t, { a: a * 0.5, att: 0.001, tau: 0.012, tipo: 'rosa', filtri: [filtro('lowpass', 1100)] })
    soffio(out, t, { a: a * 0.35, att: 0.002, tau: 0.03, filtri: [filtro('bandpass', 3500, 0.7)] })
    const o = c.createOscillator(), g = guadagno(0), f = caso(380, 520), u = t + 0.012
    o.frequency.setValueAtTime(f, u); o.frequency.exponentialRampToValueAtTime(f * caso(2, 2.6), u + 0.05)
    g.gain.setValueAtTime(0, u); g.gain.linearRampToValueAtTime(a * 0.45, u + 0.004); g.gain.setTargetAtTime(0, u + 0.01, 0.025)
    fila(o, g, out); o.start(u); o.stop(u + 0.15)
    for (let i = 0, n = Math.round(caso(3, 6)); i < n; i++) goccia(out, t + caso(0.06, 0.35), { f: caso(900, 2200), a: a * caso(0.08, 0.2) })
  }
  // la pietra del marciapiede: un colpo sordo e un filo di sabbia; la neve che si schiaccia
  const pietra = (out, t, { a = 0.35 } = {}) => {
    batti(out, t, 'pietra', { a, rate: caso(0.9, 1.1) })
    soffio(out, t + 0.004, { a: a * 0.15, att: 0.004, tau: 0.03, filtri: [filtro('bandpass', 5000, 1)] })
  }
  const neve = (out, t, { a = 0.3 } = {}) => {
    const d = caso(0.15, 0.25), s = fonte(crepita(), t, { fine: t + d + 0.02, rate: caso(0.5, 0.7) }), g = guadagno(0)
    fila(s, filtro('lowpass', 2500), filtro('highpass', 300), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.03); g.gain.setTargetAtTime(0, t + 0.04, d * 0.4)
  }
  // il chiusino di ghisa, un po' lento nel telaio: il colpo pesante, e il coperchio che dondola e ricade (ton… tonc)
  const chiusino = (out, t, { a = 0.5 } = {}) => {
    soffio(out, t, { a: a * 0.4, att: 0.002, tau: 0.02, tipo: 'rosa', filtri: [filtro('lowpass', 500)] })
    batti(out, t, 'ghisa', { a, rate: caso(0.95, 1.05) })
    batti(out, t + caso(0.13, 0.2), 'ghisa', { a: a * 0.45, rate: caso(1.02, 1.1), fine: 0.6 })
  }
  // il muro del palazzo: l'intonaco, sordo
  const muro = (out, t, { a = 0.4 } = {}) => {
    batti(out, t, 'intonaco', { a, rate: caso(0.9, 1.1) })
    soffio(out, t + 0.003, { a: a * 0.1, att: 0.004, tau: 0.02, filtri: [filtro('bandpass', 4500, 1)] })
  }
  // toccare un foglio attaccato alla saracinesca: la carta che schiocca contro la lamiera (il tonfo della lamiera dietro,
  // appena, lo schiocco della carta) e un fruscio. Le cose che non sono carta (data-suono in index.html): la carta lucida
  // dei poster, il cartoncino, lo scontrino termico che crocchia, l'asse di legno delle zucche, il cartello di lamiera
  // smaltata appeso al fil di ferro; la petizione, con le penne che ballano
  const carta = (out, t, { tipo = '', a = 0.4 } = {}) => {
    if (tipo === 'legno') return legno(out, t, { a })
    if (tipo === 'cartello') return cartello(out, t, { a })
    const lucida = tipo === 'lucida', spessa = tipo === 'cartoncino', termica = tipo === 'scontrino'
    soffio(out, t, { a: a * (spessa ? 0.5 : 0.35), att: 0.0015, tau: spessa ? 0.012 : 0.008, tipo: 'rosa', filtri: [filtro('lowpass', spessa ? 600 : 900)] })
    soffio(out, t, { a: a * (lucida ? 0.5 : 0.4), att: 0.0006, tau: lucida ? 0.004 : 0.003, filtri: [filtro('bandpass', lucida ? 4200 : termica ? 5200 : 2800, 0.9)] })
    batti(out, t + 0.001, 'saracinesca', { a: a * 0.08, rate: caso(1.4, 1.8), fine: 0.12 })
    const d = termica ? caso(0.12, 0.2) : caso(0.07, 0.12), s = fonte(crepita(), t + 0.004, { fine: t + d + 0.03, rate: termica ? caso(1.6, 2) : caso(0.9, 1.2) }), g = guadagno(0)
    fila(s, filtro('bandpass', termica ? 5000 : lucida ? 3600 : 2600, 0.8), g, out)
    g.gain.setValueAtTime(0, t + 0.004); g.gain.linearRampToValueAtTime(a * (termica ? 0.5 : 0.25), t + 0.012); g.gain.linearRampToValueAtTime(0, t + d)
    if (tipo === 'petizione') penne(out, t + 0.03, { n: 3, a: a * 0.6 })
  }
  // l'asse delle zucche: un «toc» di legno, e l'asse attaccata col nastro che ballonzola contro la lamiera
  const legno = (out, t, { a = 0.45 } = {}) => {
    soffio(out, t, { a: a * 0.4, att: 0.0008, tau: 0.004, tipo: 'rosa', filtri: [filtro('bandpass', 900, 0.8)] })
    batti(out, t, 'legno', { a, rate: caso(0.92, 1.08) })
    batti(out, t + caso(0.03, 0.05), 'legno', { a: a * 0.25, rate: caso(1.1, 1.25), fine: 0.08 })
  }
  // il cartello di rivalta, lamiera smaltata appesa al fil di ferro: il «tang» che ondeggia (la lamiera sottile si
  // piega avanti e indietro: il suono va su e giù), il fil di ferro che sfrega, il cartello che ricade sulla saracinesca
  const cartello = (out, t, { a = 0.45 } = {}) => {
    const s = c.createBufferSource(), l = c.createOscillator(), lg = guadagno(0.03), g = guadagno(a)
    s.buffer = corpo('smalto'); s.playbackRate.value = caso(0.95, 1.05)
    l.frequency.value = caso(4, 7); fila(l, lg, s.playbackRate)
    lg.gain.setValueAtTime(0.03, t); lg.gain.linearRampToValueAtTime(0, t + 1.6)
    fila(s, g, out); s.start(t); l.start(t); l.stop(t + 1.9)
    soffio(out, t, { a: a * 0.35, att: 0.0005, tau: 0.002, filtri: [filtro('bandpass', 3000, 1)] })
    const d = caso(0.25, 0.4), f = fonte(R.bianco, t + 0.02, { fine: t + 0.02 + d }), gf = guadagno(0)
    fila(f, filtro('bandpass', 4200, 4), gf, out)
    gf.gain.setValueAtTime(0, t + 0.02); gf.gain.linearRampToValueAtTime(a * 0.06, t + 0.05); gf.gain.linearRampToValueAtTime(0, t + 0.02 + d)
    const u = t + caso(0.25, 0.4)
    batti(out, u, 'saracinesca', { a: a * 0.3, rate: caso(1.3, 1.6), fine: 0.3 })
    batti(out, u, 'smalto', { a: a * 0.3, rate: caso(1.1, 1.2), fine: 0.4 })
  }
  // le bic che dondolano e si urtano, o battono sulla lamiera: tic di plastica
  const penne = (out, t, { n = Math.round(caso(1, 3)), a = 0.3 } = {}) => {
    for (let i = 0, u = t; i < n; i++, u += caso(0.05, 0.14)) {
      batti(out, u, 'plastica', { a: a * caso(0.5, 1), rate: caso(0.85, 1.25) })
      if (Math.random() < 0.4) batti(out, u + 0.002, 'saracinesca', { a: a * 0.05, rate: caso(2, 2.6), fine: 0.06 })
    }
  }
  // la biro che scrive sul foglio attaccato alla saracinesca: lo sfrigolio della sfera sulla carta (rumore acuto, mosso
  // dai tratti: le lettere, la penna che si alza fra una parola e l'altra), sotto il tamburo cupo della carta che batte
  // sulla lamiera. La firma: più veloce, a occhielli, senza pause
  const penna = (out, t, { durata = 1, n = 6, tipo = 'scrive' } = {}) => {
    const N = Math.max(16, Math.ceil(durata * 120)), firma = tipo === 'firma', forma = new Float32Array(N)
    let fase = 0, pausa = 0
    const f = firma ? caso(9, 12) : caso(5, 7.5)
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1)
      fase += ((f * durata) / N) * TAU
      if (!firma && pausa <= 0 && Math.random() < (n / N) * 0.6) pausa = Math.round(N * caso(0.03, 0.06))
      const su = pausa-- > 0 ? 0.05 : 1
      forma[i] = su * (0.35 + 0.65 * Math.abs(Math.sin(fase))) * Math.min(1, u * 12, (1 - u) * 14)
    }
    const s = fonte(R.rosa, t, { fine: t + durata + 0.05 }), g = guadagno(0), s2 = fonte(R.marrone, t, { fine: t + durata + 0.05 }), g2 = guadagno(0)
    fila(s, filtro('highpass', 1500), filtro('peaking', 3600, 1.2, 6), g, out)
    fila(s2, filtro('bandpass', 420, 2), g2, out)
    g.gain.setValueCurveAtTime(forma.map((v) => v * 0.16), t, durata)
    g2.gain.setValueCurveAtTime(forma.map((v) => v * 0.09), t, durata)
  }
  // il cappuccio della bic: «pop» quando salta via (e da qualche parte ricade), «clic» quando torna
  const tappo = (out, t, { chiude = false, a = 0.3 } = {}) => {
    if (chiude) { batti(out, t, 'plastica', { a, rate: 1.3 }); batti(out, t + 0.018, 'plastica', { a: a * 0.6, rate: 1.6 }); return }
    tono(out, t, 0.05, curva([[0, 900], [1, 480]], 6), { a: a * 0.6, att: 0.002, cala: 0.012 })
    soffio(out, t, { a: a * 0.4, att: 0.0005, tau: 0.003, filtri: [filtro('bandpass', 2400, 1)] })
    batti(out, t + caso(0.25, 0.4), 'plastica', { a: a * 0.4, rate: caso(0.9, 1.1) })
  }
  // il foglio della petizione che si stacca dal muro (lo scotch che cede, l'aria) e torna (giù: il fruscio al contrario);
  // attacca: il palmo che lo ripreme sullo scotch, due volte
  const foglio = (out, t, { a = 0.6, giu = false } = {}) => {
    const d = 0.32, s = fonte(R.rosa, t, { fine: t + d + 0.05 }), bp = filtro('bandpass', giu ? 2400 : 600, 0.9), g = guadagno(0)
    bp.frequency.setValueAtTime(giu ? 2400 : 600, t); bp.frequency.exponentialRampToValueAtTime(giu ? 500 : 2600, t + d)
    fila(s, bp, g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 0.16, t + d * 0.4); g.gain.linearRampToValueAtTime(0, t + d)
    if (!giu) { const sc = fonte(crepita(), t, { fine: t + 0.12, rate: 1.4 }), gs = guadagno(0); fila(sc, filtro('highpass', 2500), gs, out); gs.gain.setValueAtTime(a * 0.3, t); gs.gain.setTargetAtTime(0, t, 0.03) }
  }
  const attacca = (out, t, { a = 0.45 } = {}) => {
    for (const [u, k] of [[0, 1], [0.11, 0.7]]) {
      soffio(out, t + u, { a: a * 0.4 * k, att: 0.002, tau: 0.012, tipo: 'rosa', filtri: [filtro('lowpass', 500)] })
      batti(out, t + u, 'saracinesca', { a: a * 0.1 * k, rate: caso(1.2, 1.5), fine: 0.15 })
    }
  }

  // ── virtual (games/virtual/): i suoni della partita sullo schermino, piccoli e un po' «a 8 bit» come lo schermo ──
  // il fischietto dell'arbitro: un tono acuto con la pallina che rotola dentro (tremolo), uno o due colpi
  const fischietto = (out, t, { a = 0.22, colpi = 1 } = {}) => {
    for (let i = 0; i < colpi; i++) {
      const u = t + i * 0.28, d = i === colpi - 1 ? caso(0.3, 0.45) : 0.16
      tono(out, u, d, curva([[0, 2900], [0.1, 3050], [1, 2980]]), { tipo: 'square', a: a * 0.5, att: 0.006, rel: 0.05, tremolo: [38, 0.9, d], armoniche: [[1, 1], [2, 0.15]] })
      soffio(out, u, { a: a * 0.4, att: 0.002, tau: d * 0.6, filtri: [filtro('bandpass', 3000, 6)] })
    }
  }
  // il boato dei tifosi al gol: rumore rosa che sale di colpo e scende piano, con un «ooo» di voci sotto
  const boato = (out, t, { a = 0.5, d = 2.4 } = {}) => {
    const s = fonte(R.rosa, t, { fine: t + d + 0.1 }), g = guadagno(0), bp = filtro('bandpass', 900, 0.6)
    fila(s, bp, filtro('highshelf', 3000, 0.7, -6), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.12); g.gain.setTargetAtTime(0, t + 0.5, d * 0.35)
    for (const f of [180, 230, 290]) tono(out, t + 0.03, d * 0.7, curva([[0, f * 0.96], [0.3, f], [1, f * 0.9]]), { tipo: 'sawtooth', a: a * 0.05, att: 0.1, rel: d * 0.3, vibrato: 0.02, vf: 5 })
  }
  // l'«uuuh» del palo: le voci che salgono e cadono deluse, più corto del boato
  const uuuh = (out, t, { a = 0.35 } = {}) => {
    const s = fonte(R.rosa, t, { fine: t + 1 }), g = guadagno(0)
    fila(s, filtro('bandpass', 700, 0.8), g, out)
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a * 0.8, t + 0.25); g.gain.linearRampToValueAtTime(0, t + 0.9)
    for (const f of [200, 250]) tono(out, t, 0.8, curva([[0, f * 0.9], [0.35, f * 1.08], [1, f * 0.8]]), { tipo: 'sawtooth', a: a * 0.05, att: 0.15, rel: 0.4 })
    batti(out, t, 'alluminio', { a: a * 0.5, rate: caso(1.1, 1.3), fine: 0.3 }) // il palo che vibra
  }
  // la fiche posata sul foglio delle quote: un colpetto di plastica
  const fiche = (out, t, { a = 0.3 } = {}) => { batti(out, t, 'plastica', { a, rate: caso(0.95, 1.1) }); batti(out, t + 0.03, 'plastica', { a: a * 0.4, rate: caso(1.3, 1.5) }) }
  // la vincita: tre note che salgono, a 8 bit
  const vinta = (out, t, { a = 0.22 } = {}) => { for (const [i, f] of [523, 659, 784].entries()) tono(out, t + i * 0.09, 0.1, fisso(f), { tipo: 'square', a, att: 0.004, rel: 0.03 }); tono(out, t + 0.3, 0.3, fisso(1046), { tipo: 'square', a, att: 0.004, rel: 0.15 }) }

  return {
    R, fonte, filtro, guadagno, fila, soffio, tono, eco, tampone, corpo, batti,
    fischietto, boato, uuuh, fiche, vinta,
    campanello, risponde, citofono, vetro, telaio, maniglione, lucchetto, portachiavi, lattina, cartaBagnata, pacchetto, cartone, grissini,
    pozza, pietra, neve, chiusino, muro, carta, legno, cartello, penne, penna, tappo, foglio, attacca,
    goccia, gronda, passeri, tortora, piccioni, ali, cornacchia, rondoni, merlo, civetta, allocco, grilli, cicale,
    campana, rintocco, tuono, lamiera, pozze, colpo, bussa, sbatte, fruscio, strappo, splat,
    motorino, clacson, tapparella, auto, stridio, minimo, ronzio, scintilla, split, ventola, bip, floppy, clic, giri, tasto, accesso,
  }
}
