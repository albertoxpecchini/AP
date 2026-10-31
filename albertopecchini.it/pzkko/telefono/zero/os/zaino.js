// L'app «zaino» di pzk os (29.10, Alberto: «crea uno alla volta … zaino …»): quello che hai, sul cercapersone zero. Gli
// oggetti, i bonus, gli effetti e cosa si può fare con ogni pezzo sono quelli di chat/zaino.js e dello zaino del cercapersone
// vecchio (telefono/app/zaino.js: FILTRI, tipoDi, azioniDi, usa, nomeCorto, resto).
// - LE PAGINE (← →) sono i filtri: tutto, da usare, da tenere, attrezzi, casse, da vendere. In cima gli effetti in corso
//   col tempo che resta e i bonus di adesso; sotto i pezzi (icona, nome, quanti). OK apre la scheda.
// - LA SCHEDA: l'icona grande, il nome, quanti ne hai e quanto vale, cosa fa (scorre con ↑ ↓) e i bonus; sotto i tasti:
//   usa (si consuma qui, e parte l'effetto), gratta, apri, vendi, vendi tutto (li fa la chat, che ha le animazioni e i conti
//   del bonus di vendita), allo shop o compra ancora.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import { PER_ID, nomeDi } from '../../../chat/testi.js'
import { testoBonus } from '../../../chat/oggetti.js'
import { FILTRI, tipoDi, azioniDi, usa, nomeCorto, resto } from '../../app/zaino.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-zaino', lato)
const ICONE = { tutto: 'app-zaino', usa: 'clessidra', tieni: 'stella', attrezzo: 'canna', cassa: 'regalo', vendi: 'pzk' }
const pezzi = () => zaino.oggetti().reduce((a, [, q]) => a + q, 0)
/** La riga in cima: gli effetti in corso (col tempo che resta) e i bonus di adesso. */
const inCima = () => { const e = zaino.effetti().map(([id, t]) => `${nomeCorto(id)} ${resto(t - Date.now())}`), b = testoBonus(zaino.bonusTutti()); return [...e, ...(b ? [b] : [])].join(' · ') }

// ── la scheda di un pezzo ──
function scheda(os, id) {
  let giu = 0, sel = 0, esito = null, ritorno = null
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 5000 }; if (!ok) os.suoni.bip('pagerGiu'); os.ridisegna() }
  const x = PER_ID[id] ?? { id }
  const azioni = () => (zaino.quanti(id) ? azioniDi(id, x) : [])
  // cosa fa e il bonus, che scorrono: li leggono disegna e tasto (↓ si ferma all'ultima riga senza che disegna corregga giu)
  const leggibile = () => {
    const cosa = x.cosa ?? (x.leggendario ? 'leggendario: ne esce uno ogni cento.' : x.schifo ? 'vale quasi niente, ma l’hai preso tu.' : 'si vende.')
    const b = testoBonus(x.bonus)
    return { righe: impagina([{ testo: cosa }, ...(b ? [{ titolo: 'il bonus' }, { testo: `${b}${x.effetto ? ` · per ${resto(x.effetto)}` : x.unico ? ' · finché ce l’hai' : ''}` }] : [])]), vis: azioni().length ? 5 : 7 }
  }
  async function premi(a) {
    if (!a) return
    if (a.usa) {
      const u = await usa(a.usa) // (31.10: usa la banca, 'chat.usa')
      if (!u) return dì(false, 'non si può usare')
      os.suoni.sigla('zaino')
      dì(true, `${nomeCorto(id)}: ${testoBonus(u.bonus)} per ${resto(u.effetto)}`)
      if (!zaino.quanti(id)) { clearTimeout(ritorno); ritorno = setTimeout(() => { ritorno = null; if (os.corrente() === v) os.togli() }, 1400) } // (finito: si torna allo zaino; esci lo spegne, 6.2)
      return
    }
    if (a.shop) return os.apri('negozio')
    os.apri('chat', { comando: a.chat })
  }
  const v = {
    nome: 'zaino-scheda', app: 'zaino',
    entra() { v.via = [zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { v.via?.forEach((f) => f()); clearTimeout(ritorno); ritorno = null },
    tic() { if (esito && Date.now() >= esito.fino) { esito = null; os.ridisegna() } },
    disegna(l, t) {
      const n = zaino.quanti(id), A = n ? azioniDi(id, x) : [], s = sel < A.length ? sel : 0 // (sel e giu li tiene in riga tasto: 4.8)
      l.bitmap(bm(id, 32), 8, 14)
      l.testo(46, 15, corto(nomeCorto(id), 33))
      l.testo(46, 24, corto(`ne hai ${n}${x.vale ? ` · vale ${x.vale} $pzk l’uno` : ''}`, 33))
      const tipo = { usa: 'da usare', tieni: 'da tenere', attrezzo: 'attrezzo', cassa: 'cassa', vendi: 'da vendere' }[tipoDi(id)] ?? ''
      l.testo(46, 33, corto(`${tipo}${x.leggendario ? ' · leggendario' : ''}`, 33))
      const { righe, vis } = leggibile()
      scorrevole(l, righe, { y0: 46, vis, giu })
      const legge = righe.length > vis ? ' · ↑↓ legge' : '' // (↑↓ solo se c'è da scorrere)
      if (A.length) bottoni(l, os.zona, { etichette: A.map((a) => a.eti), sel: s, y: 99, premi: (i) => { sel = i; premi(A[i]) } })
      if (!striscia(l, { esito }, t)) centro(l, H - 9, !n ? 'non ce l’hai più · INDIETRO torna' : A.length > 1 ? `←→ sceglie · OK preme${legge}` : A.length ? `OK preme${legge}` : `INDIETRO torna${legge}`)
    },
    tasto(k) {
      const A = azioni(), { righe, vis } = leggibile(), fondo = Math.max(0, righe.length - vis)
      if (sel >= A.length) sel = 0
      if (k === 'sx' && A.length) sel = (sel - 1 + A.length) % A.length
      else if (k === 'dx' && A.length) sel = (sel + 1) % A.length
      else if (k === 'su') giu = Math.max(0, Math.min(giu, fondo) - 1)
      else if (k === 'giu') giu = Math.min(fondo, giu + 1)
      else if (k === 'ok') premi(A[sel])
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}

// ── le pagine: i filtri ──
let ultima = 0
export function vista(os) {
  const pagina = ([filtro, nome]) => {
    const st = { sel: 0, da: 0 }
    const voci = () => zaino.oggetti().filter(([id]) => filtro === 'tutto' || tipoDi(id) === filtro)
    return {
      get nome() { return filtro === 'tutto' ? `zaino · ${pezzi()} pezzi` : nome }, icona: ICONE[filtro] ?? 'app-zaino',
      aiuto: () => (voci().length ? 'OK apre · ↑↓ sceglie · ←→ filtri' : filtro === 'tutto' ? 'OK va allo shop · ←→ filtri' : '←→ filtri'),
      ok: () => { if (!voci().length && filtro === 'tutto') os.apri('negozio') },
      tic: (t) => t % 300 === 0 && zaino.effetti().length > 0, // (il tempo degli effetti, a minuti)
      disegna(l, x) {
        const cima = inCima(), y0 = cima ? 44 : 34
        if (cima) l.testo(10, 34, corto(cima, 39))
        const L = voci()
        if (!L.length) { (filtro === 'tutto' ? ['lo zaino è vuoto:', 'lo shop vende, pesca caccia e scava', 'riempiono.'] : ['niente qui.']).forEach((r, i) => centro(l, 58 + i * 10, r)); return }
        elenco(l, x.zona, {
          voci: L, stato: st, y0, alta: 117 - y0, passo: 17,
          clic: ([id]) => os.spingi(scheda(os, id)),
          riga(l, [id, q], x0, y, w, on) {
            const o = { inv: on }
            l.bitmap(bm(id, 16), x0 - 2, y, o)
            const s = q > 1 ? `×${q}` : ''
            if (s) destra(l, x0 + w, y + 5, s, o)
            l.testo(x0 + 18, y + 5, corto(nomeCorto(id), Math.floor((w - 18 - Lcd.larghezza(s) - 6) / 6)), o)
          },
        })
      },
      tasto(k) {
        const L = voci()
        st.sel = Math.max(0, Math.min(st.sel, L.length - 1)) // (la lista può essersi accorciata dopo l'ultimo disegno: L[st.sel] sarebbe undefined)
        if (muovi(st, L.length, k)) return true
        if (k === 'ok' && L.length) { os.spingi(scheda(os, L[st.sel][0])); return true }
        return false
      },
    }
  }
  return pagine(os, {
    nome: 'zaino', app: 'zaino', iniziale: ultima,
    pagine: FILTRI.map(pagina),
    ascolta: [(f) => zaino.ascolta(f), (f) => icone.ascolta(f)],
    esci: (x) => { ultima = x.pag },
  })
}
