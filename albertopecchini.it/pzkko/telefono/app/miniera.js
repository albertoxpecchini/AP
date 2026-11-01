// I pezzi della Miniera (23.10) in comune con la miniera del cercapersone zero (telefono/zero/os/miniera.js): quanto produce
// all'ora in parole, il pezzo montato in una categoria, i numeri di un pezzo in una riga. Le regole, il catalogo e lo stato
// sono di chat/miniera.js (lo stato sta nello zaino; dal 31.10 comprare, montare, vendere e incassare sono azioni della
// banca), i disegni a pixel di chat/miniera-pixel.js. (31.10) L'interfaccia HTML di qui (le schede postazione, negozio e pc
// pronti, con le tele a pixel) se n'è andata col cercapersone vecchio.

import { fmt, fmtCorto } from '../../games/pzk.js'

const pct = (x) => `${x > 0 ? '+' : ''}${(Math.round(x * 1000) / 10).toLocaleString('it-IT')} %`
export const perOra = (n) => `${fmtCorto(Math.round(n * 10) / 10)} $pzk/ora`
export const montatoDi = (m, cat) => { const v = m[cat]; return v ? (typeof v === 'string' ? { id: v, n: 1 } : v) : null }

/** I numeri di un pezzo in una riga. */
export function statsTesto(p) {
  const s = p.stats ?? {}
  const pz = (x) => pct(x / 100 > 1 ? x / 100 : x) // i bonus possono essere 0,12 o 12: tutti e due diventano «+12 %»
  switch (p.cat) {
    case 'tavolo': return `${s.posti} schermi · case fino a «${s.caseMax}» · comfort ${pz(s.comfort ?? 0)}`
    case 'sedia': return `comfort ${pz(s.comfort ?? 0)}`
    case 'case': return `${s.slotGpu} gpu (fino a ${s.gpuMax}) · ${s.slotVentole} ventole · ${fmt(s.raffreddamento ?? 0)} W`
    case 'cpu': case 'gpu': return `hash ${fmtCorto(s.hash ?? 0)} · ${fmt(s.calore ?? 0)} W`
    case 'ventole': return `${fmt(s.raffreddamento ?? 0)} W l’una`
    case 'memoria': return `tiene ${fmt(s.ore ?? 0)} ore · ${pz(s.bonus ?? 0)}`
    case 'schermo': return `${pz(s.bonus ?? 0)} per schermo`
    default: return `${pz(s.bonus ?? 0)}`
  }
}
