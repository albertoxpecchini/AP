// L'app «cucina» di pzk os (29.10, Alberto: «crea uno alla volta … cucina …»): le ricette del Mincio alla Cooking Mama sul
// cercapersone zero, con la nonna che guarda e commenta. Le ricette, i voti, le medaglie e i premi sono quelli della
// cucina vecchia (telefono/app/cucina.js: RICETTE, COME, commento, medaglia, PAGATE, stato, nomeIng; dal 31.10 apri e passo, sulla banca): i $pzk, gli xp,
// il piatto nello zaino e il record passano da lì. Qui i sei minigiochi sono rifatti per i tasti del cercapersone:
//   taglia   il coltello va avanti e indietro: OK quando è sulla riga tratteggiata
//   ordina   gli ingredienti in fila: ← → scelgono, OK mette nella pentola quello giusto (ogni sbaglio costa)
//   mescola  si gira in tondo con le frecce: → ↓ ← ↑, una dopo l'altra (o il clic sui quarti della pentola)
//   impasta  OK più in fretta che puoi
//   versa    OK apre il sacco, OK lo chiude: il livello deve fermarsi nella fascia
//   cuoci    la lancetta va su e giù: OK la ferma nella fascia
// (niente tasti tenuti premuti, REGOLE.md 3: il versa della vecchia si teneva premuto, qui si apre e si chiude). Ogni gioco
// ha la barra del tempo; il clic sullo schermo fa quello che fa OK. Le regole: os/REGOLE.md.
// (31.10, Alberto: «il browser non decide più niente») I voti li dà la banca (app/cucina.js: apri, passo, votoDi): la ricetta
// si apre sulla banca coi numeri a caso dei passi (le righe, le carte, le fasce), e finito ogni passo le mosse coi loro tempi
// vanno alla banca, che fa il voto e alla fine la medaglia e i premi. Il coltello, la lancetta e il sacco si muovono col
// tempo, come sulla banca: il voto che si vede è il suo. Aspettando la banca, in fondo «la nonna assaggia…».
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import { RICETTE, COME, commento, medaglia, PAGATE, stato, nomeIng, apri, passo as mandaPasso, votoDi, coltello as coltelloDi, lancetta as lancettaDi, livello } from '../../app/cucina.js'
import { txt, corto, destra, centro, testata, elenco, muovi } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('app-cucina', lato)
const nonna = (lato) => icone.bitmap('nonna', lato)
const TEMPO = { taglia: 12000, ordina: 14000, mescola: 7000, impasta: 5000, versa: 9000, cuoci: 8000 }
const PREMI = { taglia: 'OK quando il coltello è sulla riga', ordina: '←→ sceglie · OK nella pentola', mescola: 'gira: → ↓ ← ↑ e ancora', impasta: 'OK più in fretta che puoi', versa: 'OK apre · OK chiude nella fascia', cuoci: 'OK quando la lancetta è nella fascia' }
const GIRO = ['dx', 'giu', 'sx', 'su'] // (in senso orario: a destra, giù, a sinistra, su)
const NOME_M = { oro: 'medaglia d’oro', argento: 'medaglia d’argento', bronzo: 'medaglia di bronzo' }

/** Un testo centrato nel riquadro x … x + w. */
const centro0 = (l, x, w, y, s, scala = 1) => l.testo(x + Math.round((w - Lcd.larghezza(s, scala)) / 2), y, s, { scala })
/** Al più max righe da n caratteri: se ne avanzano, l'ultima finisce con «…». */
const righeCorte = (s, n, max) => { const R = Lcd.acapo(txt(s), n), o = R.slice(0, max); if (R.length > max) o[max - 1] = corto(o[max - 1] + '…', n); return o }
/** Il fumetto della nonna: l'avatar a sinistra e il testo a capo accanto. */
function fumetto(l, y, testo, righe = 3) {
  l.bitmap(nonna(24), 10, y)
  const R = righeCorte(testo, 33, righe)
  l.riquadro(38, y, W - 48, R.length * 9 + 4)
  l.px(37, y + 6); l.px(36, y + 7) // (la punta del fumetto)
  R.forEach((s, i) => l.testo(41, y + 3 + i * 9, s))
}

// ── una ricetta: la presentazione, il gioco, il voto, la fine ──
function vistaRicetta(os, r, par) {
  let G = { i: 0, punti: [], fase: 'intro', par }, g = null, fine = null, sel = 0, lampo = 0
  const passo = () => r.passi[G.i]
  const ora = () => Date.now()

  function via() {
    if (G.fase !== 'intro') return // (due clic nello stesso fotogramma: il gioco parte una volta)
    const [tipo, , o] = passo(), q = G.par[G.i] // (i numeri del passo li ha dati la banca)
    g = { tipo, o, t0: ora(), fino: ora() + TEMPO[tipo] }
    if (tipo === 'taglia') { g.righe = q.righe.map((x) => ({ x, fatto: false, dove: null })); g.tagli = [] }
    if (tipo === 'ordina') { g.carte = [...q.carte]; g.prossimo = 0; g.sbagli = 0; g.sel = 0; g.messe = new Set(); g.scossa = 0; g.tocchi = [] }
    if (tipo === 'mescola') { g.quarti = 0; g.atteso = 0 }
    if (tipo === 'impasta') g.n = 0
    if (tipo === 'versa') { g.a = q.a; g.b = q.b; g.ms = 0; g.aperto = false; g.ultimo = ora() } // (g.ms: quanto è stato aperto il sacco)
    if (tipo === 'cuoci') { g.a = q.a; g.b = q.b }
    G.fase = 'gioca'
  }
  /** La posizione di adesso (0…1) del coltello e della lancetta: dipendono dal tempo, non dai fotogrammi. */
  const coltello = () => coltelloDi(ora() - g.t0)
  const lancetta = () => lancettaDi(ora() - g.t0)
  const ms = () => Math.round(ora() - g.t0)

  /** Il passo è finito: le mosse alla banca (in fila), il voto (lo stesso della banca) subito sullo schermo. */
  function voto(mosse) {
    if (G.fase !== 'gioca') return
    const v = votoDi(passo(), G.par[G.i], mosse)
    G.punti.push(v)
    G.fase = 'esito'; g = null; lampo = 8
    os.suoni.bip(v >= 0.45 ? 'pager' : 'pagerGiu')
    const g0 = G, risposta = mandaPasso(G.i, mosse).then((e) => {
      if (!e.ok && g0 === G && os.corrente() === v0) { os.togli(); os.dialogo({ titolo: 'cucina', testo: e.errore, tasti: ['ok'] }) } // (la banca dice di no: la ricetta finisce qui)
      return e
    })
    if (G.i === r.passi.length - 1) G.chiusura = risposta
  }
  async function avanti() {
    if (G.fase !== 'esito') return // (Invio e clic nello stesso fotogramma: non salta un gioco, la banca non paga due volte)
    if (G.i + 1 < r.passi.length) { G.i++; G.fase = 'intro'; return }
    const g0 = G
    G.fase = 'assaggia'; os.ridisegna()
    const e = await G.chiusura
    if (g0 !== G || os.corrente() !== v0 || !e?.ok) return
    fine = e.fine
    G.fase = 'fine'; sel = 0
    if (fine.pzk) os.suoni.sigla('moneta'); else if (!fine.m) os.suoni.bip('pagerGiu')
  }
  /** Rifalla: la banca apre la ricetta di nuovo, coi numeri nuovi. */
  async function rifalla() {
    if (G.fase !== 'fine') return
    G.fase = 'apre'; os.ridisegna()
    const a = await apri(r)
    if (os.corrente() !== v0) return
    if (!a.ok) { G.fase = 'fine'; return os.dialogo({ titolo: 'cucina', testo: a.errore, tasti: ['ok'] }) }
    G = { i: 0, punti: [], fase: 'intro', par: a.par }; fine = null
  }
  /** OK (o il clic sulla scena) durante il gioco. */
  function colpo() {
    if (!g) return
    const { tipo } = g
    if (tipo === 'taglia') {
      const x = coltello(), libere = g.righe.filter((q) => !q.fatto)
      if (!libere.length) return
      const q = libere.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
      q.fatto = true; q.dove = x
      g.tagli.push(ms())
      if (g.tagli.length === g.o.tagli) g.chiudi = ora() + 350
    } else if (tipo === 'ordina') {
      const s = g.carte[g.sel]
      if (g.messe.has(s)) return
      g.tocchi.push(s)
      if (s === g.o.seq[g.prossimo]) {
        g.messe.add(s)
        if (++g.prossimo === g.o.seq.length) g.chiudi = ora() + 300
        else { const n = g.carte.length; for (let i = 1; i < n; i++) { const k = (g.sel + i) % n; if (!g.messe.has(g.carte[k])) { g.sel = k; break } } } // (la scelta va al prossimo ancora fuori)
      } else { g.sbagli++; g.scossa = 4; os.suoni.bip('pagerGiu') }
    } else if (tipo === 'impasta') { g.n++; if (g.n >= g.o.colpi) g.chiudi = ora() + 200 }
    else if (tipo === 'versa') { if (!g.aperto) { g.aperto = true; g.ultimo = ora() } else finisciVersa() }
    else if (tipo === 'cuoci') voto(ms())
  }
  function finisciVersa() { if (!g) return; if (g.aperto) { g.ms += ora() - g.ultimo; g.aperto = false } voto(Math.round(g.ms)) }
  function gira(k) {
    if (!g || g.tipo !== 'mescola') return false
    if (k === GIRO[g.atteso]) { g.quarti++; g.atteso = (g.atteso + 1) % 4; if (g.quarti >= g.o.giri * 4) g.chiudi = ora() + 250 }
    return true
  }
  /** Il tempo è finito: il voto di quello che si è fatto. */
  function scaduto() {
    const t = g.tipo
    if (t === 'taglia') voto(g.tagli)
    else if (t === 'ordina') voto(g.tocchi)
    else if (t === 'mescola') voto(g.quarti)
    else if (t === 'impasta') voto(g.n)
    else if (t === 'versa') finisciVersa()
    else voto(null)
  }

  const v0 = {
    nome: 'cucina-ricetta', app: 'cucina',
    entra() { v0.via = [icone.ascolta(() => os.ridisegna())] },
    esci() { v0.via?.forEach((f) => f()) },
    tic() {
      if (lampo > 0) lampo--
      if (G.fase === 'assaggia' || G.fase === 'apre') return os.ridisegna() // (la rotellina, aspettando la banca)
      if (G.fase !== 'gioca' || !g) return lampo > 0 && os.ridisegna()
      if (g.tipo === 'versa' && g.aperto) { const n = ora(); g.ms += n - g.ultimo; g.ultimo = n; if (livello(g.ms) >= 1) return finisciVersa() }
      if (g.scossa > 0) g.scossa--
      if (g.chiudi && ora() >= g.chiudi) { const t = g.tipo; return t === 'taglia' ? voto(g.tagli) : t === 'ordina' ? voto(g.tocchi) : t === 'mescola' ? voto(g.quarti) : voto(g.n) }
      if (ora() >= g.fino) return scaduto()
      os.ridisegna()
    },
    disegna(l, t) {
      testata(l, os, { icona: 'app-cucina', nome: corto(r.nome, 24), n: 1 })
      if (G.fase !== 'fine') destra(l, 245, 18, `passo ${G.i + 1}/${r.passi.length}`)
      if (G.fase === 'assaggia' || G.fase === 'apre') { // (aspettando la banca: la medaglia, o i numeri della ricetta nuova)
        l.bitmap(bm(r.piatto, 32), Math.round(W / 2 - 16), 44)
        centro(l, 84, G.fase === 'assaggia' ? 'la nonna assaggia' + '...'.slice(0, 1 + (Math.floor(t / 3) % 3)) : 'la nonna prepara' + '...'.slice(0, 1 + (Math.floor(t / 3) % 3)))
        centro(l, H - 9, 'INDIETRO le ricette')
        return
      }
      const [tipo, testo] = passo()
      if (G.fase === 'intro') {
        l.testo(10, 35, corto(txt(testo), 39))
        fumetto(l, 48, G.i === 0 ? `i ${r.nome}! ${r.dove}. pronta?` : `ora: ${testo}.`)
        centro(l, 92, corto(PREMI[tipo], 39))
        os.zona(10, 34, W - 20, 82, () => via())
        centro(l, H - 9, 'OK via! · INDIETRO le ricette')
        return
      }
      if (G.fase === 'esito') {
        const v = G.punti.at(-1), s = String(Math.round(v * 100))
        if (lampo % 2) l.riempi(W / 2 - Lcd.larghezza(s, 3) / 2 - 4, 34, Lcd.larghezza(s, 3) + 8, 25)
        centro(l, 36, s, { scala: 3, inv: lampo % 2 === 1 })
        centro(l, 61, 'su 100')
        fumetto(l, 72, commento(v), 2)
        const ultimo = G.i === r.passi.length - 1
        centro(l, H - 9, ultimo ? 'OK assaggia' : 'OK avanti')
        os.zona(10, 34, W - 20, 82, () => avanti())
        return
      }
      if (G.fase === 'fine') {
        const f = fine, m = f.m
        l.bitmap(bm(r.piatto, 32), 10, 34)
        l.testo(48, 35, m ? NOME_M[m[1]] : 'niente medaglia')
        l.testo(48, 45, `${Math.round(f.v * 100)} / 100`, { scala: 2 })
        if (f.record) l.testo(48 + Lcd.larghezza(`${Math.round(f.v * 100)} / 100`, 2) + 6, 50, 'record!')
        const premi = [f.pzk || f.xp ? `+${f.pzk} $pzk · +${f.xp} xp` : m ? `oggi i premi li hai già presi (${PAGATE} al giorno)` : 'niente premi: riprova', f.piatto ? `${r.piatto} nello zaino` : ''].filter(Boolean).join(' · ')
        righeCorte(premi, 39, 2).forEach((s, i) => l.testo(10, 64 + i * 9, s))
        fumetto(l, 83, m?.[1] === 'oro' ? 'come li faccio io. anzi meglio!' : m ? 'buoni! la prossima volta di più.' : 'questi al gatto. riproviamo?', 1) // (una riga sola, 33 lettere: sotto ci sono i tasti)
        const E = ['rifalla', 'le ricette']
        const ws = E.map((e) => Lcd.larghezza(e) + 8), tot = ws[0] + ws[1] + 4
        let xx = Math.round(W / 2 - tot / 2)
        E.forEach((e, i) => { const on = i === sel; if (on) l.riempi(xx, 103, ws[i], 11); else l.cornice(xx, 103, ws[i], 11); l.testo(xx + 4, 105, e, { inv: on }); os.zona(xx, 101, ws[i], 15, () => { sel = i; v0.tasto('ok') }); xx += ws[i] + 4 })
        centro(l, H - 9, '←→ sceglie · OK preme')
        return
      }
      // ── il gioco ──
      if (!g) return
      const resta = Math.max(0, (g.fino - ora()) / TEMPO[g.tipo])
      l.riquadro(10, 34, W - 20, 5); l.riempi(11, 35, Math.round((W - 22) * resta), 3) // (il tempo)
      if (g.tipo === 'taglia') {
        const x0 = 20, w = W - 40, xc = x0 + Math.round(coltello() * w)
        l.bitmap(bm(g.o.icona, 32), Math.round(W / 2 - 16), 52)
        l.riquadro(x0 - 2, 48, w + 4, 42)
        for (const q of g.righe) { const xq = x0 + Math.round(q.x * w); if (!q.fatto) for (let y = 49; y < 89; y += 3) l.px(xq, y); else { l.vert(x0 + Math.round(q.dove * w), 49, 40); l.vert(x0 + Math.round(q.dove * w) + 1, 49, 40) } }
        // il coltello: la lama e il manico, sopra il tagliere
        l.riempi(xc - 1, 92, 3, 12); l.riempi(xc - 2, 104, 5, 6); l.px(xc, 91)
        os.zona(10, 40, W - 20, 76, colpo)
      } else if (g.tipo === 'ordina') {
        // la fila da fare, col segno su quelli già messi
        const fila = g.o.seq.map((s, k) => (k < g.prossimo ? '✓' : '') + txt(nomeIng(s).split(' ')[0])).join(' › ')
        centro(l, 43, corto(fila, 39))
        const n = g.carte.length, cw = Math.min(58, Math.floor((W - 20) / n)), x0 = Math.round(W / 2 - (n * cw) / 2)
        g.carte.forEach((s, k) => {
          const x = x0 + k * cw + (k === g.sel && g.scossa ? (g.scossa % 2 ? 2 : -2) : 0), on = k === g.sel, messa = g.messe.has(s), nome = corto(txt(nomeIng(s).split(' ')[0]), Math.floor((cw - 6) / 6))
          if (messa) { // (già nella pentola: il ✓ al posto dell'icona, senza cornice; scelta, la cornice sottile)
            if (on) l.riquadro(x, 55, cw - 3, 30)
            centro0(l, x, cw - 3, 58, '✓', 2)
            l.testo(x + Math.round((cw - 3 - Lcd.larghezza(nome)) / 2), 76, nome)
          } else {
            if (on) l.riempi(x, 55, cw - 3, 30); else l.cornice(x, 55, cw - 3, 30)
            l.bitmap(bm(s, 16), x + Math.round((cw - 3) / 2 - 8), 58, { inv: on })
            l.testo(x + Math.round((cw - 3 - Lcd.larghezza(nome)) / 2), 76, nome, { inv: on })
          }
          os.zona(x, 55, cw - 3, 30, () => { g.sel = k; colpo() })
        })
        l.bitmap(bm('pentola', 16), Math.round(W / 2 - 8), 92)
        centro(l, 110, `sbagli: ${g.sbagli}`)
      } else if (g.tipo === 'mescola') {
        // la pentola vista dall'alto, il mestolo nel quarto dove sei, la freccia che serve adesso
        const cx = 128, cy = 76, rr = 28
        for (let i = 0; i < 64; i++) { const q = (i / 64) * Math.PI * 2; l.px(Math.round(cx + Math.cos(q) * rr), Math.round(cy + Math.sin(q) * rr)); l.px(Math.round(cx + Math.cos(q) * (rr + 2)), Math.round(cy + Math.sin(q) * (rr + 2))) }
        const a = (g.quarti % 4) * (Math.PI / 2) - Math.PI / 2 + Math.PI / 4 // (il mestolo gira in senso orario)
        const mx = Math.round(cx + Math.cos(a) * 16), my = Math.round(cy + Math.sin(a) * 16)
        l.riempi(mx - 3, my - 3, 7, 7)
        for (let s = 0; s < 16; s++) l.px(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s))
        const freccia = { dx: '→', giu: '↓', sx: '←', su: '↑' }[GIRO[g.atteso]]
        l.testo(20, 60, 'ora', {}); l.testo(20, 70, freccia, { scala: 2 })
        destra(l, 236, 60, 'giri'); destra(l, 236, 70, `${Math.floor(g.quarti / 4)}/${g.o.giri}`, { scala: 2 })
        // i lati si cliccano anche: quattro bracci a girandola che non si coprono (ognuno col suo angolo, in senso orario),
        // il mezzo libero; prima si coprivano e vinceva l'ultimo
        const zs = rr + 4, zd = 8
        os.zona(cx - zs, cy - zs, zs + zd, zs - zd, () => gira('su')); os.zona(cx + zd, cy - zs, zs - zd, zs + zd, () => gira('dx'))
        os.zona(cx - zd, cy + zd, zs + zd, zs - zd, () => gira('giu')); os.zona(cx - zs, cy - zd, zs - zd, zs + zd, () => gira('sx'))
      } else if (g.tipo === 'impasta') {
        // la sfoglia che si allarga e si abbassa a ogni colpo
        const k = Math.min(1, g.n / g.o.colpi), w = Math.round(40 + 150 * k), h = Math.round(30 - 18 * k)
        l.riempi(Math.round(W / 2 - w / 2), 92 - h, w, h)
        l.bitmap(bm(g.o.icona, 16), Math.round(W / 2 - 8), 48, {})
        centro(l, 98, `${g.n}/${g.o.colpi}`, { scala: 2 })
        os.zona(10, 40, W - 20, 76, colpo)
      } else if (g.tipo === 'versa') {
        // il sacco a sinistra, il bicchiere a destra con la fascia e il livello
        l.bitmap(bm(g.o.icona, 32), 40, 56)
        const bx = 120, by = 46, bw = 60, bh = 64
        l.vert(bx, by, bh); l.vert(bx + bw, by, bh); l.orizz(bx, by + bh, bw + 1)
        const ya = Math.round(by + bh - g.b * bh), yb = Math.round(by + bh - g.a * bh)
        for (let y = ya; y <= yb; y++) for (let x = bx + 1; x < bx + bw; x += 2) if (y === ya || y === yb || (x + y) % 6 === 0) l.px(x, y)
        const yl = Math.round(by + bh - livello(g.ms + (g.aperto ? ora() - g.ultimo : 0)) * bh) // (il livello dai ms di sacco aperto, come la banca)
        l.riempi(bx + 2, yl, bw - 3, by + bh - yl)
        // la fascia anche fuori dal bicchiere (dentro, il livello la copre): due parentesi, a sinistra e a destra
        for (const xs of [bx - 6, bx + bw + 2]) { l.orizz(xs, ya, 5); l.orizz(xs, yb, 5); l.vert(xs + (xs < bx ? 0 : 4), ya, yb - ya + 1) }
        // il getto: cade dal sacco aperto dentro il bicchiere, a puntini che scendono
        if (g.aperto) { // (dal sacco al bordo del bicchiere in diagonale, poi giù fino al livello)
          const f = Math.floor(ora() / 80) % 3, xa = 74, ya0 = 58, xb = bx + bw / 2, yb0 = by - 4
          for (let k = f; k < 30; k += 3) l.px(Math.round(xa + ((xb - xa) * k) / 30), Math.round(ya0 + ((yb0 - ya0) * k) / 30))
          for (let y = by - 4 + f; y < yl - 1; y += 3) l.px(xb, y)
        }
        { const e = g.aperto ? 'scende…' : 'chiuso'; l.testo(56 - Math.round(Lcd.larghezza(e) / 2), 94, e) }
        os.zona(10, 40, W - 20, 76, colpo)
      } else if (g.tipo === 'cuoci') {
        // la scala orizzontale con la fascia e la lancetta che va e viene
        l.bitmap(bm(g.o.icona, 32), Math.round(W / 2 - 16), 44)
        const x0 = 20, w = W - 40, y = 86
        l.riquadro(x0, y, w, 12)
        const xa = x0 + Math.round(g.a * w), xb = x0 + Math.round(g.b * w)
        for (let x = xa; x <= xb; x++) for (let yy = y + 1; yy < y + 11; yy++) if ((x + yy) % 2 === 0) l.px(x, yy)
        const xl = x0 + Math.round(lancetta() * w)
        l.riempi(xl - 1, y - 4, 3, 20)
        os.zona(10, 40, W - 20, 76, colpo)
      }
      centro(l, H - 9, corto(PREMI[g.tipo], 39))
    },
    tasto(k) {
      if (k === 'indietro') { os.togli(); return true } // (a metà ricetta si torna alle ricette: non paga niente)
      if (G.fase === 'assaggia' || G.fase === 'apre') return true // (la banca sta rispondendo)
      if (G.fase === 'intro') { if (k === 'ok') via(); return true }
      if (G.fase === 'esito') { if (k === 'ok') avanti(); return true }
      if (G.fase === 'fine') {
        if (k === 'sx' || k === 'dx') sel = 1 - sel
        else if (k === 'ok') { if (sel === 0) rifalla(); else os.togli() }
        return true
      }
      if (!g) return true
      if (g.tipo === 'mescola') { if (GIRO.includes(k)) gira(k); return true }
      if (g.tipo === 'ordina' && (k === 'sx' || k === 'dx')) { g.sel = (g.sel + (k === 'sx' ? -1 : 1) + g.carte.length) % g.carte.length; return true }
      if (k === 'ok') colpo()
      return true
    },
  }
  return v0
}

/** Apre la ricetta sulla banca (i numeri dei passi) e poi la mostra; intanto il menu dice «apro». */
let aprendo = null
async function comincia(os, r, menu) {
  if (aprendo) return
  aprendo = r.id; os.ridisegna()
  const a = await apri(r).finally(() => { aprendo = null; os.ridisegna() })
  if (os.corrente() !== menu) return
  if (!a.ok) return os.dialogo({ titolo: 'cucina', testo: a.errore, tasti: ['ok'] })
  os.spingi(vistaRicetta(os, r, a.par))
}

export function vista(os) {
  const st = { sel: 0, da: 0 }
  const v = {
    nome: 'cucina', app: 'cucina',
    entra() { this.via = [zaino.ascolta(() => os.ridisegna()), icone.ascolta(() => os.ridisegna())] },
    esci() { this.via?.forEach((f) => f()) },
    disegna(l) {
      const c = stato()
      testata(l, os, { icona: 'app-cucina', nome: 'cucina', n: 1 })
      destra(l, 245, 18, `pagate oggi ${Math.min(c.pagate, PAGATE)}/${PAGATE}`)
      l.bitmap(nonna(16), 10, 33)
      l.testo(30, 37, 'cosa cuciniamo? ricette del Mincio') // (dentro il margine: con «le» finiva a x 251)
      elenco(l, os.zona, {
        voci: RICETTE, stato: st, y0: 50, alta: 68, passo: 17, // (la fascia alta 16: l'icona da 16 rovesciata ci sta dentro)
        clic: (r) => comincia(os, r, v),
        riga(l, r, x0, y, w, on) {
          const o = { inv: on }, rec = c.record[r.id], m = rec != null ? medaglia(rec) : null
          const dx = rec != null ? `${m ? `${m[1]} ` : ''}${Math.round(rec * 100)}` : `${r.passi.length} passi`
          l.bitmap(bm(r.piatto, 16), x0 - 2, y, o)
          l.testo(x0 + 18, y + 5, corto(r.nome, 22), o)
          destra(l, x0 + w, y + 5, dx, o)
        },
      })
      centro(l, H - 9, aprendo ? 'la nonna prepara…' : 'OK cucina · ↑↓ sceglie')
    },
    tasto(k) {
      if (muovi(st, RICETTE.length, k)) return true
      if (k === 'ok') { comincia(os, RICETTE[st.sel], v); return true }
      if (k === 'indietro') { os.togli(); return true }
      return k === 'sx' || k === 'dx'
    },
  }
  return v
}
