// Le poche variabili d'intestazione che servono al disegno (LTSCALE,
// PDMODE, PDSIZE, CELTSCALE). La sezione AcDb:Header è una lunga sequenza di
// valori a bit senza etichette: ci si aggancia al primo double, che in ogni
// file vale 412148564080.0, e si legge l'elenco in ordine (R2000+).

import { BitReader } from './bits.js'

const MAGIC = 412148564080.0

const DEFAULTS = { ltscale: 1, pdmode: 0, pdsize: 0, celtscale: 1 }

/** @param {Uint8Array} data sezione AcDb:Header @param {number} version */
export function readHeaderVars(data, version) {
  const out = { ...DEFAULTS }
  try {
    const r = new BitReader(data, 16 * 8)
    let found = -1
    for (let p = 20 * 8; p < 64 * 8; p++) {
      r.seek(p)
      if (r.RD() === MAGIC) {
        found = p
        break
      }
    }
    if (found < 0) return out
    r.seek(found - 2)
    for (let i = 0; i < 4; i++) r.BD() // 412148564080, 1, 1, 1
    r.BL() // 24
    r.BL() // 0
    if (version < 2000) r.BS()
    const nB = version < 2000 ? 11 : 9 // DIMASO … LIMCHECK (+ DIMSAV, BLIPMODE nelle R13-R14)
    for (let i = 0; i < nB; i++) r.B()
    if (version >= 2004) r.B()
    for (let i = 0; i < 4; i++) r.B() // USRTIMER SKPOLY ANGDIR SPLFRAME
    if (version < 2000) {
      r.B()
      r.B()
    }
    r.B() // MIRRTEXT
    r.B() // WORLDVIEW
    if (version < 2000) r.B()
    r.B() // TILEMODE
    r.B() // PLIMCHECK
    r.B() // VISRETAIN
    if (version < 2000) r.B()
    r.B() // DISPSILH
    r.B() // PELLIPSE
    r.BS() // PROXYGRAPHICS
    if (version < 2000) r.BS()
    r.BS() // TREEDEPTH
    r.BS() // LUNITS
    r.BS() // LUPREC
    r.BS() // AUNITS
    r.BS() // AUPREC
    if (version < 2000) r.BS()
    r.BS() // ATTMODE
    if (version < 2000) r.BS()
    out.pdmode = r.BS()
    if (version < 2000) r.BS()
    if (version >= 2004) {
      r.BL()
      r.BL()
      r.BL()
    }
    for (let i = 0; i < 5; i++) r.BS() // USERI1-5
    for (let i = 0; i < 14; i++) r.BS() // SPLINESEGS … TEXTQLTY
    out.ltscale = r.BD()
    r.BD() // TEXTSIZE
    r.BD() // TRACEWID
    r.BD() // SKETCHINC
    r.BD() // FILLETRAD
    r.BD() // THICKNESS
    r.BD() // ANGBASE
    out.pdsize = r.BD()
    r.BD() // PLINEWID
    for (let i = 0; i < 5; i++) r.BD() // USERR1-5
    for (let i = 0; i < 4; i++) r.BD() // CHAMFERA-D
    r.BD() // FACETRES
    r.BD() // CMLSCALE
    out.celtscale = r.BD()
    if (!(out.ltscale > 0 && out.ltscale < 1e6)) out.ltscale = 1
    if (!(out.celtscale > 0 && out.celtscale < 1e6)) out.celtscale = 1
    if (!Number.isFinite(out.pdsize)) out.pdsize = 0
    if (!(out.pdmode >= 0 && out.pdmode < 128)) out.pdmode = 0
  } catch {
    return { ...DEFAULTS }
  }
  return out
}
