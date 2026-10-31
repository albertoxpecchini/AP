// L'app «foto» di pzk os (29.10, Alberto: «crea uno alla volta … foto …»): le foto vere dei quiz (chat/immagini.js:
// Mantova, il cibo, il Landini, il Ciao…, da Wikimedia Commons o da Imgur, con l'autore e la licenza), sul cercapersone zero.
// Arrivano a un bit col retino di Bayer (icone.foto); una che il browser non lascia leggere ha il punto di domanda.
// - LA GALLERIA: le miniature cinque per riga (le frecce si muovono, la riga scorre), sotto cosa è quella scelta. OK la apre.
// - LA FOTO: a tutto schermo, senza la barra; sotto cosa è e il credito. ← → la prima e la dopo, OK o INDIETRO tornano.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { IMMAGINI, src, credito } from '../../../chat/immagini.js'
import { txt, corto, destra, centro, pagine } from './pezzi.js'

const IDS = Object.keys(IMMAGINI)
const COL = 5, CW = 46, CH = 36, RIGHE = 2
let sel = 0 // (si ricorda finché la pagina è aperta: si torna sulla stessa foto)

/** Una foto nel riquadro x, y, w, h: centrata; mentre arriva «carico», se non si può il punto di domanda. */
function riquadro(l, os, id, x, y, w, h, piccola) {
  const b = icone.foto(src(id), w, h, () => os.ridisegna())
  if (b === 'carico') { if (!piccola) centro(l, y + Math.round(h / 2) - 3, 'carico…'); else l.px(x + Math.round(w / 2), y + Math.round(h / 2)); return }
  if (b === 'no') { const s = piccola ? '?' : 'la foto non si lascia vedere'; l.testo(x + Math.round(w / 2 - Lcd.larghezza(s) / 2), y + Math.round(h / 2) - 3, s); return }
  l.bitmap(b, x + Math.round((w - b.w) / 2), y + Math.round((h - b.h) / 2))
}

// ── una foto a tutto schermo ──
function grande(os) {
  return {
    nome: 'foto-grande', app: 'foto', senzaBarra: true,
    entra() { this.via = [icone.ascolta(() => os.ridisegna())] },
    esci() { this.via?.forEach((f) => f()) },
    disegna(l) {
      const id = IDS[sel], x = IMMAGINI[id]
      riquadro(l, os, id, 14, 2, 228, 106, false) // (dentro le punte stondate dello schermo)
      centro(l, 110, corto(`${sel + 1}/${IDS.length} · ${txt(x.cosa)}`, 38))
      centro(l, 119, corto(txt(credito(id) ?? ''), 34))
      os.zona(0, 0, W / 3, 108, () => { sel = (sel - 1 + IDS.length) % IDS.length })
      os.zona(W / 3, 0, W / 3, 108, () => os.togli())
      os.zona((2 * W) / 3, 0, W / 3, 108, () => { sel = (sel + 1) % IDS.length })
    },
    tasto(k) {
      if (k === 'sx' || k === 'su') sel = (sel - 1 + IDS.length) % IDS.length
      else if (k === 'dx' || k === 'giu') sel = (sel + 1) % IDS.length
      else if (k === 'ok' || k === 'indietro') os.togli()
      else return false
      return true
    },
  }
}

// ── la galleria ──
export function vista(os) {
  let da = 0 // la prima riga che si vede
  const n = IDS.length, ultimaRiga = Math.floor((n - 1) / COL)
  // la riga della scelta in vista: dopo ogni tasto e entrando (la foto grande sposta sel), non in disegna (4.8)
  const inVista = () => { const r = Math.floor(sel / COL); if (r < da) da = r; if (r >= da + RIGHE) da = r - RIGHE + 1 }
  // le frecce girano in tondo (3.5): ← dalla prima va all'ultima; ↑ dalla prima riga va all'ultima, nella stessa colonna
  // (o all'ultima foto, se lì la colonna è vuota); ↓ dall'ultima riga torna alla prima
  const muovi = (k) => {
    const r = Math.floor(sel / COL)
    if (k === 'sx') sel = (sel - 1 + n) % n
    else if (k === 'dx') sel = (sel + 1) % n
    else if (k === 'su') sel = r > 0 ? sel - COL : Math.min(n - 1, ultimaRiga * COL + (sel % COL))
    else sel = r < ultimaRiga ? Math.min(n - 1, sel + COL) : sel % COL
    inVista()
  }
  return pagine(os, {
    nome: 'foto', app: 'foto',
    ascolta: [(f) => icone.ascolta(f)],
    pagine: [{
      nome: `le foto · ${IDS.length}`, icona: 'app-foto', aiuto: 'OK la guardi · le frecce scelgono',
      ok: () => os.spingi(grande(os)),
      entra: inVista,
      disegna(l, x) {
        const x0 = Math.round(W / 2 - (COL * CW) / 2)
        for (let i = 0; i < RIGHE * COL; i++) {
          const k = da * COL + i
          if (k >= IDS.length) break
          const cx = x0 + (i % COL) * CW, cy = 34 + Math.floor(i / COL) * CH, on = k === sel
          riquadro(l, os, IDS[k], cx + 2, cy + 2, CW - 4, CH - 4, true)
          if (on) { l.riquadro(cx, cy, CW, CH); l.riquadro(cx + 1, cy + 1, CW - 2, CH - 2) } // (la scelta: la cornice doppia)
          x.zona(cx, cy, CW, CH, () => { if (sel === k) os.spingi(grande(os)); else sel = k })
        }
        // la barra di scorrimento e cosa è quella scelta
        const tot = Math.ceil(IDS.length / COL), alta = RIGHE * CH, h = Math.max(6, Math.round((alta * RIGHE) / tot))
        l.vert(W - 9, 34, alta); l.riempi(W - 10, 34 + Math.round(((alta - h) * da) / Math.max(1, tot - RIGHE)), 3, h)
        centro(l, 108, corto(`${sel + 1}/${IDS.length} · ${txt(IMMAGINI[IDS[sel]].cosa)}`, 38))
      },
      tasto(k) {
        if (k !== 'sx' && k !== 'dx' && k !== 'su' && k !== 'giu') return false
        muovi(k)
        return true
      },
    }],
  })
}
