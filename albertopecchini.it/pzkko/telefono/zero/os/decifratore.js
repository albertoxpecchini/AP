// L'app «decifratore» di pzk os (1.11, Alberto: «sì» a farla, dopo che il cercapersone nero se n'era andato con la sua):
// apre i wallet pzk cifrati e le chiavette usb che lo spazzino trova sul nastro. I giochini li prepara la banca
// (giochi/app-decifratore.mjs: tre codici, due errori perdonati, al terzo il pezzo si blocca) e la banca paga
// (wallet.mjs, decifra: tre al giorno); la logica è quella di telefono/app/decifratore.js (DOMANDE, DENTRO, TIPI, pezzi,
// decifratiOggi, apri, risolvi): qui c'è solo la faccia a un bit. Si compra nel pzkstore.
// - I PEZZI: quanti se ne sono aperti oggi (tre caselle), i pezzi nello zaino (icona, nome, quanti, quanto c'è dentro);
//   OK apre quello scelto. Senza pezzi, in galera o a tre al giorno: perché no.
// - IL CODICE (una vista sopra): il pezzo, a che codice sei e le vite; la domanda, il codice grande nel riquadro e le quattro
//   risposte in due file (la croce le sceglie, OK risponde, il clic pure). Giusta: il prossimo; sbagliata: un altro codice e
//   una vita in meno. Alla fine il lucchetto che salta e i $pzk, o il pezzo bloccato.
// - COME FUNZIONA: le regole, che scorrono.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as pzk from '../../../games/pzk.js'
import * as zaino from '../../../chat/zaino.js'
import { DOMANDE, DENTRO, TIPI, pezzi, decifratiOggi, apri, risolvi } from '../../app/decifratore.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole } from './pezzi.js'

const fmt = (n) => pzk.fmt(n ?? 0)
const AL_GIORNO = 3
const ROMA = { timeZone: 'Europe/Rome' }
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { ...ROMA, hour: '2-digit', minute: '2-digit' })
const nome = (id) => TIPI[id][1]
const dentro = (id) => DENTRO[TIPI[id][0]]

const REGOLE = [
  { titolo: 'il decifratore' },
  { testo: 'Apre i wallet pzk cifrati e le chiavette usb che lo spazzino di uffici trova sul nastro, in chat.' },
  { titolo: 'come si apre' },
  { testo: 'Ogni pezzo ha tre codici, uno dopo l’altro: la parola spostata di una lettera, il numero in binario, la sequenza da completare, la parola allo specchio.' },
  { punto: 'due errori si perdonano' },
  { punto: 'al terzo il pezzo si blocca: resta nello zaino e si riprova' },
  { titolo: 'cosa c’è dentro' },
  { punto: `un wallet: da ${fmt(DENTRO.wallet[0])} a ${fmt(DENTRO.wallet[1])} $pzk` },
  { punto: `una chiavetta: da ${fmt(DENTRO.chiavetta[0])} a ${fmt(DENTRO.chiavetta[1])} $pzk` },
  { testo: 'Soldi puliti, dal fondo dei portafogli smarriti. Tre pezzi al giorno: poi il decifratore si scalda.' },
]

// ── il codice da risolvere (la vista sopra la lista) ──
function codice(os, id, v0) {
  let v = v0, sel = 0, attesa = null, esito = null, fine = null, salto = 0
  const dì = (ok, testo) => { esito = { ok, testo: txt(testo), fino: Date.now() + 3000 }; os.ridisegna() }
  const qui = () => os.corrente() === g
  async function rispondi(k) {
    if (attesa || fine || !v?.prova) return
    sel = k
    attesa = 'controllo il codice…'; esito = null; os.ridisegna()
    const d = await risolvi(v.prova.scelte[k]).finally(() => { attesa = null; os.ridisegna() })
    if (!qui()) return
    if (!d.ok) { os.suoni.bip('pagerGiu'); return dì(false, d.errore) }
    const e = d.e
    if (e.bloccato) { fine = { bloccato: true, sparito: !!e.sparito }; os.suoni.sigla('decifratore-bloccato'); return }
    if (e.risolto) return paga()
    v = e; sel = 0
    if (e.giusta) { os.suoni.sigla('decifratore-giusto'); dì(true, `giusto: codice ${e.i + 1} di 3`) }
    else { os.suoni.bip('pagerGiu'); dì(false, 'sbagliato: ecco un altro codice') }
  }
  async function paga() {
    attesa = 'apro il pezzo…'; os.ridisegna()
    const d = await pzk.decifra(TIPI[id][0]).finally(() => { attesa = null; os.ridisegna() })
    if (!qui()) return
    if (!d?.ok) { fine = { errore: d?.errore ?? 'la banca non risponde: riprova' }; os.suoni.bip('pagerGiu'); return }
    fine = { n: d.fatto?.n ?? 0 }
    salto = 10
    os.suoni.sigla('decifratore-aperto')
  }
  const g = {
    nome: 'decifratore-codice', app: 'decifratore',
    tic(t) {
      let ancora = !!attesa
      if (esito && Date.now() >= esito.fino) { esito = null; ancora = true }
      if (salto > 0) { salto--; ancora = true }
      if (ancora) os.ridisegna()
    },
    disegna(l, t) {
      const y0 = os.BARRA + 3
      if (fine) {
        // la fine: il lucchetto che salta aperto, o quello chiuso
        const su = fine.n !== undefined ? [0, 3, 6, 8, 9, 9, 8, 6, 3, 1, 0][10 - salto] ?? 0 : 0
        l.bitmap(icone.bitmap(fine.n !== undefined ? 'pzk' : 'lucchetto', 32), 112, y0 + 4 - su)
        if (fine.n !== undefined) {
          centro(l, y0 + 44, 'aperto!', { scala: 2 })
          centro(l, y0 + 64, `+${fmt(fine.n)} $pzk puliti`)
          centro(l, y0 + 75, 'dal fondo dei portafogli smarriti')
        } else {
          centro(l, y0 + 44, fine.errore ? 'non si apre' : 'bloccato', { scala: 2 })
          const s = fine.errore ?? (fine.sparito ? `il ${nome(id)} non è più nello zaino` : `tre errori: il pezzo resta nello zaino. Riprova quando vuoi.`)
          Lcd.acapo(txt(s), 39).slice(0, 3).forEach((r, i) => centro(l, y0 + 64 + i * 9, r))
        }
        const a = 'OK torna ai pezzi'
        centro(l, H - 9, a); os.zona(Math.round(W / 2 - Lcd.larghezza(a) / 2) - 3, H - 11, Lcd.larghezza(a) + 6, 11, () => os.togli())
        return
      }
      const p = v.prova, dom = DOMANDE[p.k]?.(p.codice) ?? { testo: 'qual è la risposta?', codice: p.codice }
      // la testa: il pezzo, a che codice sei, le vite
      l.bitmap(icone.bitmap(id, 16), 8, y0 - 2)
      l.testo(28, y0 + 2, corto(nome(id), 20))
      destra(l, W - 8, y0 + 2, `${v.i + 1} di 3  ${'♥'.repeat(Math.max(0, 3 - v.errori))}`)
      l.orizz(6, y0 + 14, W - 12)
      // la domanda (al più tre righe) e il codice nel riquadro (a scala 2 se ci sta)
      Lcd.acapo(txt(dom.testo), 39).slice(0, 3).forEach((r, i) => l.testo(8, y0 + 17 + i * 9, r))
      const c = txt(dom.codice), sc = Lcd.larghezza(c, 2) <= W - 24 ? 2 : 1
      l.riquadro(8, 58, W - 16, 18)
      centro(l, sc === 2 ? 60 : 63, c, { scala: sc })
      // le quattro risposte, in due file
      p.scelte.slice(0, 4).forEach((s, k) => {
        const x = k % 2 ? 130 : 8, y = k < 2 ? 80 : 94, w = 118, on = k === sel
        if (on) l.riempi(x, y, w, 12); else l.cornice(x, y, w, 12)
        const r = corto(s, 18)
        l.testo(Math.round(x + w / 2 - Lcd.larghezza(r) / 2), y + 3, r, { inv: on })
        if (!attesa) os.zona(x, y, w, 12, () => rispondi(k))
      })
      if (!striscia(l, { esito, attesa }, t)) centro(l, H - 9, '↑↓←→ sceglie · OK risponde')
    },
    tasto(k) {
      if (k === 'indietro') { os.togli(); return true } // (il pezzo resta nello zaino: riaprendolo, i codici ripartono)
      if (attesa) return true
      if (fine) { if (k === 'ok') os.togli(); return true }
      if (k === 'su' || k === 'giu') sel ^= 2
      else if (k === 'sx' || k === 'dx') sel ^= 1
      else if (k === 'ok') rispondi(sel)
      else return false
      return true
    },
  }
  return g
}

// ── i pezzi ──
export function vista(os) {
  const st = { sel: 0, da: 0 }
  // perché oggi non si apre niente: [la riga sotto la lista, il messaggio corto in fondo quando si preme OK]
  const fermo = () => (pzk.inGalera() ? [`in galera fino alle ${ora(pzk.galera())}: i computer non si toccano`, `in galera fino alle ${ora(pzk.galera())}`] : decifratiOggi() >= AL_GIORNO ? ['tre al giorno: il decifratore si scalda. Domani', 'tre al giorno: torna domani'] : null)
  async function apriPezzo(x, id) {
    const no = fermo()
    if (no) return x.dì(false, no[1])
    const d = await x.aspetta(`collego il ${nome(id)}…`, () => apri(id))
    if (!d || !x.qui()) return
    if (!d.ok) return x.dì(false, d.errore)
    if (!d.v?.prova) return x.dì(false, 'la banca non ha mandato il codice: riprova')
    os.spingi(codice(os, id, d.v))
  }
  const lista = {
    nome: 'decifra', icona: 'app-decifratore',
    aiuto: () => (!pezzi().length || fermo() ? '←→ pagine' : pezzi().length > 1 ? 'OK decifra · ↑↓ sceglie · ←→ pagine' : 'OK decifra · ←→ pagine'),
    ok(x) { const p = pezzi()[st.sel]; if (p) apriPezzo(x, p[0]) },
    disegna(l, x) {
      // oggi: tre caselle, piene quelle già aperte
      const n = Math.min(AL_GIORNO, decifratiOggi())
      l.testo(10, 34, 'aperti oggi')
      for (let i = 0; i < AL_GIORNO; i++) { const xx = 82 + i * 9; if (i < n) l.riempi(xx, 34, 7, 7); else l.riquadro(xx, 34, 7, 7) }
      destra(l, 245, 34, `${n} di ${AL_GIORNO}`)
      const P = pezzi(), no = fermo()
      if (!P.length) {
        l.bitmap(icone.bitmap('wallet-pzk', 32), 10, 50)
        l.testo(50, 50, 'niente da decifrare')
        Lcd.acapo('I wallet e le chiavette li trova lo spazzino di uffici sul nastro: in chat, il lavoro da spazzino.', 32).slice(0, 4).forEach((r, i) => l.testo(50, 62 + i * 9, r))
        return
      }
      elenco(l, x.zona, {
        voci: P, stato: st, y0: 46, alta: 40, passo: 20,
        clic: ([id]) => apriPezzo(x, id),
        riga(l, [id, q], x0, y, w, on) {
          const o = { inv: on }, [da, a] = dentro(id)
          l.bitmap(icone.bitmap(id, 16), x0 - 2, y + 2, o)
          destra(l, x0 + w, y + 2, `× ${q}`, o)
          l.testo(x0 + 18, y + 2, corto(nome(id), 24), o)
          l.testo(x0 + 18, y + 11, corto(`dentro da ${fmt(da)} a ${fmt(a)} $pzk`, 30), o)
        },
      })
      Lcd.acapo(no?.[0] ?? 'tre codici per pezzo: al terzo errore si blocca', 39).slice(0, 2).forEach((r, i) => l.testo(10, 92 + i * 9, r))
    },
    tasto(k) { return muovi(st, pezzi().length, k) },
  }
  let giu = 0
  const VIS = 9
  const regole = {
    nome: 'come funziona', icona: 'lucchetto',
    aiuto: '↑↓ legge · ←→ pagine',
    disegna(l) { giu = scorrevole(l, impagina(REGOLE), { y0: 34, vis: VIS, giu }) },
    tasto(k) {
      if (k === 'su') { giu = Math.max(0, giu - 1); return true }
      if (k === 'giu') { giu = Math.min(giu + 1, Math.max(0, impagina(REGOLE).length - VIS)); return true }
      return false
    },
  }
  return pagine(os, {
    nome: 'decifratore', app: 'decifratore',
    pagine: [lista, regole],
    ascolta: [(f) => pzk.osserva(f), (f) => zaino.ascolta(f)],
  })
}
