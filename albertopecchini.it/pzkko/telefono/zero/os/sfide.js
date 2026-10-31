// L'app «sfide» di pzk os (29.10, Alberto: «crea uno alla volta shop, pzkstore, sfide, …»): le tre sfide di oggi sul
// cercapersone zero. Le sfide, i premi, la serie e il bonus sono quelli di chat/sfide.js (oggi, riscuoti, riscuotiBonus: dal
// 31.10 azioni della banca, con la rotellina in fondo mentre risponde);
// dove si fa ogni sfida e il conto alla rovescia vengono dalle sfide del cercapersone vecchio (telefono/app/sfide.js).
// - IN CIMA: i giorni di fila, quante oggi, i tre pallini (pieno: fatta, a metà: pronta), quando arrivano le nuove.
// - LE RIGHE (↑ ↓): le tre sfide (l'icona, la difficoltà e cosa fare, la barra, a che punto sei, il premio) e il bonus del
//   giorno. OK: «riscuoti» se è pronta, «vai» se no (si apre l'app dove si fa: la chat col comando giusto, lo shop, il quiz…),
//   «prendi» per il bonus. Riscuotere suona la moneta.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import * as sfide from '../../../chat/sfide.js'
import { fmt } from '../../../games/pzk.js'
import { DOVE, aMezzanotte } from '../../app/sfide.js'
import { corto, destra, centro, elenco, muovi, pagine } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-sfide', lato)
/** Le righe: le tre sfide e il bonus. */
const righe = () => { const o = sfide.oggi(); return [...o.sfide.map((x) => ({ sfida: x })), { bonus: o }] }
/** Il bonus come arriva davvero: la formula della banca (livello, bonus «paga» e «sfide»); oggi() lo dà senza. */
const bonusVero = (n) => Math.round(n * zaino.moltiplicatore() * (1 + zaino.bonus('sfide')) * 2) / 2
/** Dove si fa una sfida: [app, comando]; posta: i $pzk che il comando punta (slot 20), se ne punta. */
const dove = (s) => { const [app, comando] = DOVE[s.id] ?? ['chat'], m = /^\S+ (\d+)$/.exec(comando ?? ''); return { app, comando, posta: m ? Number(m[1]) : 0 } }
const NOMI = { negozio: 'lo shop', quiz: 'il quiz', missioni: 'le quest', chat: 'la chat' }

export function vista(os) {
  const st = { sel: 0, da: 0 }
  async function fai(r, x) {
    if (r.bonus) {
      const o = r.bonus
      if (o.bonusRiscosso) return x.dì(true, `il bonus l’hai già preso: serie di ${o.serie}`)
      if (!o.bonusPronto) return x.dì(false, 'prima le tre sfide')
      const e = await x.aspetta('riscuoto', () => sfide.riscuotiBonus())
      if (!e || !x.qui()) return
      if (!e.ok) return x.dì(false, e.errore)
      os.suoni.sigla('moneta')
      return x.dì(true, `+${fmt(e.pzk)} $pzk e una cassa · serie ${e.serie}`)
    }
    const s = r.sfida
    if (s.riscossa) return x.dì(true, 'questa è fatta e riscossa')
    if (s.pronta) {
      const e = await x.aspetta('riscuoto', () => sfide.riscuoti(s.id))
      if (!e || !x.qui()) return
      if (!e.ok) return x.dì(false, e.errore)
      os.suoni.sigla('moneta')
      return x.dì(true, `+${fmt(e.pzk)} $pzk e +${e.xp} xp${e.livello ? ` · livello ${e.livello}!` : ''}`)
    }
    const { app, comando, posta } = dove(s)
    if (posta) { // (vinci: «slot 20» punta 20 $pzk appena si apre la chat: prima si chiede)
      const s2 = await os.dialogo({ titolo: 'giochi?', icona: 'pzk', testo: `in chat parte «${comando}»: punti ${fmt(posta)} $pzk puliti, e si possono perdere.`, tasti: ['no', 'gioca'] })
      if (s2 !== 'gioca' || !x.qui()) return
    }
    os.apri(app, comando ? { comando } : {})
  }
  const aiuto = () => {
    const r = righe()[st.sel]
    if (!r) return ''
    if (r.bonus) return r.bonus.bonusPronto ? 'OK prendi il bonus · ↑↓' : '↑↓ sceglie'
    if (r.sfida.riscossa) return '✓ fatta · ↑↓ sceglie'
    if (r.sfida.pronta) return 'OK riscuoti · ↑↓ sceglie'
    const { app, comando, posta } = dove(r.sfida) // (dice cosa parte: in chat il comando va subito)
    return posta ? `OK gioca ${fmt(posta)} $pzk in chat · ↑↓` : comando ? `OK fa «${comando}» in chat · ↑↓` : `OK apre ${NOMI[app] ?? app} · ↑↓`
  }
  return pagine(os, {
    nome: 'sfide', app: 'sfide',
    ascolta: [(f) => zaino.ascolta(f)],
    pagine: [{
      nome: 'le sfide di oggi', icona: 'app-sfide', aiuto,
      ok: (x) => { const r = righe()[st.sel]; if (r) fai(r, x) },
      tic: (t) => t % 300 === 0, // (il conto alla rovescia, a minuti)
      disegna(l, x) {
        const o = sfide.oggi(), fatte = o.sfide.filter((s) => s.riscossa).length
        // in cima: la serie, oggi, i pallini, le nuove
        l.testo(10, 34, corto(`${o.serie} di fila · oggi ${fatte}/3`, 26))
        o.sfide.forEach((s, i) => { const xp = 170 + i * 9; if (s.riscossa) l.riempi(xp, 34, 7, 7); else if (s.pronta) { l.riquadro(xp, 34, 7, 7); l.riempi(xp, 37, 7, 4) } else l.riquadro(xp, 34, 7, 7) })
        l.testo(10, 43, o.sfide.length ? `nuove fra ${aMezzanotte()}` : 'la banca prepara le sfide…') // (31.10: il giorno lo prepara la banca)
        elenco(l, x.zona, {
          voci: righe(), stato: st, y0: 53, alta: 63, passo: 21,
          clic: (r) => fai(r, x),
          riga(l, r, x0, y, w, on) {
            const o2 = { inv: on }
            if (r.bonus) {
              const b = r.bonus
              l.bitmap(bm(b.bonusRiscosso ? 'stella' : 'regalo', 16), x0 - 2, y + 2, o2)
              const stato = b.bonusRiscosso ? '✓' : b.bonusPronto ? 'prendi ▶' : ''
              if (stato) destra(l, x0 + w, y + 2, stato, o2)
              l.testo(x0 + 18, y + 2, corto(b.bonusRiscosso ? 'bonus del giorno: preso, a domani' : `bonus: ${fmt(bonusVero(b.bonusGiorno))} $pzk e una cassa`, Math.floor((w - 18 - Lcd.larghezza(stato) - 6) / 6)), o2)
              l.testo(x0 + 18, y + 11, corto(b.bonusRiscosso ? `serie di ${b.serie}` : `fai tutte e tre${b.serie ? ` · domani la serie a ${b.serie + 1}` : ''}`, Math.floor((w - 18) / 6)), o2)
              return
            }
            const s = r.sfida
            l.bitmap(bm(s.icona, 16), x0 - 2, y + 2, o2)
            const stato = s.riscossa ? '✓' : s.pronta ? 'riscuoti ▶' : 'vai ▶'
            destra(l, x0 + w, y + 2, stato, o2)
            l.testo(x0 + 18, y + 2, corto(`${s.nome}: ${s.testo}`, Math.floor((w - 18 - Lcd.larghezza(stato) - 6) / 6)), o2)
            // la barra, a che punto sei, il premio
            const bw = 60, k = Math.max(0, Math.min(1, s.fatto / Math.max(1, s.target)))
            l.riquadro(x0 + 18, y + 12, bw, 5, on ? 0 : 1); l.riempi(x0 + 19, y + 13, Math.round((bw - 2) * k), 3, on ? 0 : 1)
            l.testo(x0 + 18 + bw + 4, y + 11, `${s.fatto}/${s.target}`, o2)
            destra(l, x0 + w, y + 11, `+${fmt(s.premio.pzk)} · +${s.premio.xp} xp`, o2)
          },
        })
      },
      tasto(k, x) { // (→ fa quello che dice il ▶ della riga: prendi, riscuoti, vai; 3.3)
        if (k === 'dx') { const r = righe()[st.sel]; if (r) fai(r, x); return true }
        return muovi(st, righe().length, k)
      },
    }],
  })
}
