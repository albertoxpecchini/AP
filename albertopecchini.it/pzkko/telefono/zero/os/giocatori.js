// L'app «giocatori» di pzk os (29.10, Alberto: «crea uno alla volta … giocatori …»): il database dei giocatori sul
// cercapersone zero. I dati sono quelli di chat/db.js (top, notizie, cerca, profilo, io, statistiche) e della lumachina
// (chat/lumaca.mjs, chat/lumaca-avvisi.js), i testi e i tempi quelli dei giocatori del cercapersone vecchio
// (telefono/app/giocatori.js), la faccia quella del profilo (telefono/app/profilo.js).
// - CLASSIFICHE: in cima quale (OK: le diciassette), sotto le posizioni (il podio rovesciato, la faccia, il nome, il valore).
// - NOTIZIE: le cose successe in banca, con l'icona e quanto fa.
// - CERCA: scrivi un nome o un indirizzo (dalla tastiera, o OK sulla riga in cima); i trovati sotto.
// - IO: la lumachina (l'avviso urgente se ha combinato qualcosa: OK «ho capito»), la sua salute, oggi, gli ultimi giorni; il
//   tuo profilo, i rivali, la banca in numeri. Scorre con ↑ ↓.
// - LA SCHEDA di un giocatore (OK su un nome): la faccia, il titolo, il livello, i numeri, le classifiche, i leggendari; sotto
//   «manda $pzk» (lo fa la chat, col comando «manda»).
// Il server può non rispondere: ogni pagina lo dice e i tasti continuano a funzionare.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as db from '../../../chat/db.js'
import { nomeDi } from '../../../chat/testi.js'
import { fmt, fmtCorto, conto } from '../../../games/pzk.js'
import * as L from '../../../chat/lumaca.mjs'
import { daVedere, visto } from '../../../chat/lumaca-avvisi.js'
import { fa, giornoBreve, pctTesto, pzkTesto, semeSessione } from '../../app/giocatori.js'
import { faccia } from '../../app/profilo.js'
import { txt, corto, destra, centro, elenco, muovi, pagine, striscia, impagina, scorrevole, bottoni, senzaHtml } from './pezzi.js'

const bm = (id, lato) => icone.bitmap(id, lato) ?? icone.bitmap('bot', lato)
const facciaDi = (g) => faccia(g.av ?? g.pr?.av, g.mest)
const valore = (m, v) => senzaHtml(db.valoreHtml(m, v))
/** Una richiesta al database con lo stato: null (mai chiesto), 'carico', 'ok', 'no'. L'ultima vince. r.poi(d): una volta sola,
 *  quando la prossima arriva bene (la riga da scegliere: durante il carico la lista è vuota e la scelta si perdeva). */
function richiesta(fai) {
  const r = { st: null, d: null, n: 0, t: 0, poi: null }
  r.carica = (os, ...a) => { const n = ++r.n; r.st = 'carico'; r.t = Date.now(); os.ridisegna(); fai(...a).then((d) => { if (n !== r.n) return; r.st = d?.ok ? 'ok' : 'no'; r.d = d; if (r.st === 'ok') r.poi?.(d); r.poi = null; os.ridisegna() }).catch(() => { if (n === r.n) { r.st = 'no'; r.d = null; r.poi = null; os.ridisegna() } }) }
  r.vecchia = () => !r.st || r.st === 'no' || Date.now() - r.t > 30_000
  return r
}
const carico = (l, t, y = 66) => l.testo(Math.round(W / 2 - Lcd.larghezza('carico...') / 2), y, 'carico' + '.'.repeat(1 + (Math.floor(t / 3) % 3)))
const fuori = (l, d, y = 60) => Lcd.acapo(txt(d?.errore ?? 'il database adesso non risponde: il server è in pausa, o sei offline.'), 38).slice(0, 3).forEach((r, i) => centro(l, y + i * 9, r))

let metrica = 'pzk', q = '', ultima = 0
const DONO = 10 // (i $pzk che «manda $pzk» della scheda manda col comando della chat)

// ── la scelta della classifica ──
function sceltaMetrica(os, poi) {
  const voci = Object.entries(db.METRICHE).map(([id, [nome, , icona]]) => ({ id, nome, icona }))
  const st = { sel: Math.max(0, voci.findIndex((v) => v.id === metrica)), da: 0 }
  const scegli = (v) => { metrica = v.id; poi(); os.togli() } // (poi prima: togliendo, l'entra della pagina carica una volta sola)
  return {
    nome: 'giocatori-metrica', app: 'giocatori',
    disegna(l) {
      l.bitmap(icone.bitmap('trofeo', 16), 8, 14); l.testo(28, 18, 'quale classifica'); l.orizz(6, 31, W - 12)
      elenco(l, os.zona, { voci, stato: st, y0: 34, alta: 84, passo: 12, clic: scegli, riga(l, v, x0, y, w, on) { l.testo(x0, y + 2, corto(v.nome, Math.floor((w - 12) / 6)), { inv: on }); if (v.id === metrica) destra(l, x0 + w, y + 2, '✓', { inv: on }) } })
      centro(l, H - 9, 'OK sceglie · ↑↓')
    },
    tasto(k) { if (muovi(st, voci.length, k)) return true; if (k === 'ok') { scegli(voci[st.sel]); return true } if (k === 'indietro') { os.togli(); return true } return false },
  }
}

// ── la scheda di un giocatore ──
function scheda(os, ind) {
  const r = richiesta(() => db.profilo(ind))
  let giu = 0
  // mandare $pzk non si disfa: si conferma, con quanto e a chi (8.6)
  async function manda(p) {
    const s = await os.dialogo({ titolo: 'mandi $pzk?', icona: 'pzk', testo: `mandi ${DONO} $pzk a ${corto(p.nome, 20)} (${p.ind})? Non tornano indietro.`, tasti: ['no', 'sì'] })
    if (s !== 'sì' || os.corrente() !== v) return // (INDIETRO dà null; e si può essere già usciti)
    os.apri('chat', { comando: `manda ${p.ind} ${DONO}` })
  }
  const v = {
    nome: 'giocatori-scheda', app: 'giocatori',
    entra() { if (!r.st) r.carica(os) },
    tic(t) { if (r.st === 'carico' && t % 3 === 0) os.ridisegna() },
    disegna(l, t) {
      if (r.st !== 'ok') { l.bitmap(icone.bitmap('app-giocatori', 16), 8, 14); l.testo(28, 18, corto(ind, 30)); l.orizz(6, 31, W - 12); if (r.st === 'no') fuori(l, r.d); else carico(l, t); centro(l, H - 9, 'INDIETRO torna'); return }
      const p = r.d.profilo, s = p.s ?? {}, mio = conto()?.ind === p.ind
      l.bitmap(bm(facciaDi(p), 32), 8, 14)
      l.testo(46, 14, corto(p.nome, 33))
      l.testo(46, 23, corto(`${p.titolo ?? ''}${p.mest ? ` · ${nomeDi(p.mest)}` : ''}`, 33))
      const da = 60 * (p.liv - 1) ** 2, k = (p.xp - da) / Math.max(1, (p.xpProssimo ?? 0) - da)
      l.testo(46, 32, corto(`livello ${p.liv} · ${fmt(p.xp)} xp`, 22)); l.riquadro(184, 33, 61, 5); l.riempi(185, 34, Math.round(59 * Math.max(0, Math.min(1, k))), 3)
      l.testo(46, 41, corto(`${p.ind} · in banca da ${fa(p.creato).replace(' fa', '')}${p.ult ? ` · visto ${fa(p.ult)}` : ''}`, 33))
      const pos = Object.entries(p.posizioni ?? {}).filter(([m]) => db.METRICHE[m]).sort((a, b) => a[1].pos - b[1].pos).slice(0, 8)
      const numeri = [['$pzk', fmtCorto(p.pzk)], ['pescati', s.pescati], ['cacciati', s.cacciati], ['scavati', s.scavati], ['quiz', `${s.quizGiusti ?? 0}/${s.quizTotali ?? 0}`], ['sfide', s.sfideFatte], ['quest', s.missioniFatte], ['morti', s.morti], ...(p.sp ? [['sporchi', fmtCorto(p.sp)]] : []), ['giochi', `${s.giri ?? 0} mani`], ['serie', `${p.serie ?? 0} giorni`]]
      const righe = impagina([
        ...(p.pr?.mot ? [{ testo: `«${p.pr.mot}»` }] : []),
        ...(p.gal ? [{ testo: `in galera fino alle ${new Date(p.gal).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` }] : []),
        { titolo: 'i numeri' }, ...Array.from({ length: Math.ceil(numeri.length / 2) }, (_, i) => ({ testo: numeri.slice(i * 2, i * 2 + 2).map(([n, x]) => `${n} ${typeof x === 'number' ? fmtCorto(x) : x ?? 0}`).join(' · ') })),
        ...(pos.length ? [{ titolo: 'in classifica' }, ...pos.map(([m, x]) => ({ punto: `${x.pos}° in ${db.METRICHE[m][0]}` }))] : []),
        ...(p.rari?.length ? [{ titolo: 'leggendari presi' }, { testo: p.rari.map(nomeDi).join(', ') }] : []),
      ])
      giu = scorrevole(l, righe, { y0: 52, vis: mio ? 7 : 5, giu })
      if (!mio) bottoni(l, os.zona, { etichette: [`manda ${DONO} $pzk a ${corto(p.nome, 16)}`], sel: 0, y: 99, premi: () => manda(p) }) // (32 lettere al più: sta nella riga)
      centro(l, H - 9, mio ? '↑↓ legge · INDIETRO torna' : 'OK manda · ↑↓ legge')
    },
    tasto(k) {
      if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu++
      else if (k === 'ok') { const p = r.d?.profilo; if (r.st === 'ok' && p && conto()?.ind !== p.ind) manda(p) }
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}

// ── le pagine ──
export function vista(os) {
  const top = richiesta((m) => db.top(m, 25)), news = richiesta(() => db.notizie()), trova = richiesta((s) => db.cerca(s)), io = richiesta(() => Promise.all([db.io('xp'), db.statistiche()]).then(([a, b]) => ({ ok: true, io: a, stats: b })))
  const stC = { sel: 0, da: 0 }, stN = { sel: 0, da: 0 }, stR = { sel: 0, da: 0 }
  let giuIo = 0, attesaCerca = 0
  const apriScheda = (ind) => os.spingi(scheda(os, ind))
  const cercaOra = () => { clearTimeout(attesaCerca); if (!q.trim()) { trova.st = null; trova.d = null; trova.q = ''; os.ridisegna(); return } attesaCerca = setTimeout(() => { trova.q = q.trim(); trova.carica(os, trova.q) }, 300) }
  const animaCarico = (r) => (t) => r.st === 'carico' && t % 3 === 0
  // scelta la classifica, il primo in lista: subito se c'è già, se no quando arriva (il carico lo fa l'entra della pagina, una volta)
  const primo = (d) => { stC.sel = d?.top?.length ? 1 : 0; stC.da = 0 }
  const scegliMetrica = () => os.spingi(sceltaMetrica(os, () => { if (top.m === metrica && top.st === 'ok' && !top.vecchia()) primo(top.d); else top.poi = primo }))

  const pClassifiche = {
    nome: 'le classifiche', icona: 'trofeo',
    entra: () => { if (top.vecchia() || top.m !== metrica) { top.m = metrica; top.carica(os, metrica) } },
    tic: animaCarico(top),
    aiuto: () => (stC.sel === 0 ? 'OK cambia classifica · ←→ pagine' : 'OK apre la scheda · ↑↓ · ←→ pagine'),
    disegna(l, x, t) {
      const lista = top.st === 'ok' ? top.d.top : []
      const voci = [{ scegli: true }, ...lista]
      elenco(l, x.zona, {
        voci, stato: stC, y0: 33, alta: 85, passo: 17,
        clic: (g) => (g.scegli ? scegliMetrica() : apriScheda(g.ind)),
        riga(l, g, x0, y, w, on) {
          const o = { inv: on }
          if (g.scegli) { l.testo(x0, y + 5, corto(db.METRICHE[metrica][0], 24), o); if (top.st === 'ok') destra(l, x0 + w, y + 5, `${top.d.giocatori} in banca`, o); return } // (niente ▶: qui → sfoglia le pagine, la classifica si cambia con OK)
          // il podio: i primi tre col numero rovesciato
          const ps = String(g.pos)
          if (g.pos <= 3) { l.riempi(x0 - 2, y + 3, 14, 11, on ? 0 : 1); l.testo(x0 + 5 - Math.round(Lcd.larghezza(ps) / 2), y + 5, ps, { inv: !on }) } else destra(l, x0 + 11, y + 5, ps, o)
          l.bitmap(bm(facciaDi(g), 16), x0 + 16, y, o)
          const v = valore(metrica, g.valore)
          destra(l, x0 + w, y + 5, v, o)
          l.testo(x0 + 36, y + 5, corto(g.nome, Math.floor((w - 36 - Lcd.larghezza(v) - 6) / 6)), o)
        },
      })
      if (top.st === 'carico' && !lista.length) carico(l, t, 74)
      else if (top.st === 'no') fuori(l, top.d, 60)
      else if (top.st === 'ok' && !lista.length) centro(l, 70, corto(`nessuno ha ancora niente in «${db.METRICHE[metrica][0]}»`, 38))
    },
    tasto(k) {
      const n = 1 + (top.st === 'ok' ? top.d.top.length : 0)
      if (muovi(stC, n, k)) return true
      if (k === 'ok') { if (stC.sel === 0) scegliMetrica(); else { const g = top.st === 'ok' && top.d.top[stC.sel - 1]; if (g) apriScheda(g.ind) } return true }
      return false
    },
  }

  const pNotizie = {
    nome: 'le notizie', icona: 'app-giocatori',
    entra: () => { if (news.vecchia()) news.carica(os) },
    tic: animaCarico(news),
    aiuto: 'OK apre chi è · ↑↓ · ←→ pagine',
    disegna(l, x, t) {
      if (news.st === 'carico' && !news.d) return carico(l, t)
      if (news.st === 'no') return fuori(l, news.d)
      const lista = news.d?.notizie ?? []
      if (!lista.length) return centro(l, 66, 'in banca non è ancora successo niente.')
      elenco(l, x.zona, {
        voci: lista, stato: stN, y0: 33, alta: 84, passo: 21,
        clic: (n) => apriScheda(n.ind),
        riga(l, n, x0, y, w, on) {
          const o = { inv: on }, tn = db.testoNotizia(n), quando = fa(n.t)
          l.bitmap(bm(tn.icona, 16), x0 - 2, y + 2, o)
          const r = Lcd.acapo(txt(senzaHtml(tn.html)), Math.floor((w - 18) / 6))
          l.testo(x0 + 18, y + 2, r[0] ?? '', o)
          const sec = r.length > 2 ? corto(r.slice(1).join(' '), Math.floor((w - 18 - Lcd.larghezza(quando) - 6) / 6)) : r[1] ?? ''
          l.testo(x0 + 18, y + 11, corto(sec, Math.floor((w - 18 - Lcd.larghezza(quando) - 6) / 6)), o)
          destra(l, x0 + w, y + 11, quando, o)
        },
      })
    },
    tasto(k) { return muovi(stN, news.d?.notizie?.length ?? 0, k) || (k === 'ok' && news.d?.notizie?.[stN.sel] ? (apriScheda(news.d.notizie[stN.sel].ind), true) : false) },
  }

  const pCerca = {
    nome: 'cerca', icona: 'lente',
    entra: () => { if (q.trim() && trova.q !== q.trim()) cercaOra() }, // (la ricerca fermata dall'esci riparte tornando)
    tic: animaCarico(trova),
    aiuto: () => (q ? 'OK apre · ↑↓ · INDIETRO toglie' : 'scrivi un nome, o OK sulla riga in cima'),
    disegna(l, x, t) {
      const lista = trova.st === 'ok' ? trova.d.trovati : []
      elenco(l, x.zona, {
        voci: [{ campo: true }, ...lista], stato: stR, y0: 33, alta: 85, passo: 17,
        clic: (g) => (g.campo ? scrivi() : apriScheda(g.ind)),
        riga(l, g, x0, y, w, on) {
          const o = { inv: on }
          if (g.campo) { // (il cursore dopo quello scritto; vuoto, il suggerimento comincia dopo il cursore: copriva la «u», 4.6)
            const s = q ? `cerca «${q}»` : 'cerca:', xc = x0 + Lcd.larghezza(s) + 2
            l.testo(x0, y + 5, s, o)
            if (!q) l.testo(xc + 7, y + 5, 'un nome, o pzk123456', o)
            if (on && t % 10 < 5) l.riempi(xc, y + 4, 4, 9, 0)
            return
          }
          l.bitmap(bm(facciaDi(g), 16), x0 - 2, y, o)
          destra(l, x0 + w, y + 5, g.ind, o)
          l.testo(x0 + 18, y + 5, corto(`${g.nome} · liv ${g.liv}`, Math.floor((w - 18 - Lcd.larghezza(g.ind) - 6) / 6)), o)
        },
      })
      if (trova.st === 'carico') carico(l, t, 74)
      else if (trova.st === 'no') fuori(l, trova.d, 60)
      else if (trova.st === 'ok' && !lista.length) centro(l, 70, 'nessun giocatore così.')
    },
    tasto(k) {
      const n = 1 + (trova.st === 'ok' ? trova.d.trovati.length : 0)
      if (muovi(stR, n, k)) return true
      if (k === 'ok') { if (stR.sel === 0) scrivi(); else apriScheda(trova.d.trovati[stR.sel - 1].ind); return true }
      if (k === 'indietro' && q) { q = ''; stR.sel = 0; cercaOra(); return true }
      return false
    },
    carattere(ch) { if (q.length < 20) { q += ch; stR.sel = 0; cercaOra() } },
    cancella() { q = q.slice(0, -1); cercaOra() },
    scrivendo: () => q.length > 0,
  }
  async function scrivi() { const s = await os.tastiera({ testo: q, titolo: 'cerca un giocatore' }); if (s !== null) { q = s.trim().slice(0, 20); stR.sel = 0; cercaOra() } }

  const pIo = {
    nome: 'io', icona: 'bot',
    entra: () => { if (io.vecchia()) io.carica(os) },
    tic: animaCarico(io),
    aiuto: () => (daVedere().length ? 'OK ho capito · ↑↓ legge · ←→ pagine' : 'OK la tua scheda · ↑↓ legge · ←→ pagine'),
    ok: () => { if (daVedere().length) { visto(); giuIo = 0; os.ridisegna() } else if (conto()) apriScheda(conto().ind) },
    disegna(l, x, t) {
      const c = conto(), oggi = L.giornoDi(), seme = c ? String(c.creato) : semeSessione()
      const gi = L.giornata(seme, oggi), ultime = c?.lumaca?.ultime ?? [], reg = ultime.find((v) => v.g === oggi), ev = (reg && L.evento(reg.ev)) || gi.evento
      const nuove = daVedere(), tot = nuove.reduce((a, v) => a + v.n, 0)
      const prima = c ? ultime.filter((v) => v.g < oggi).slice(-6).reverse().map((v) => ({ g: v.g, s: v.s, ev: L.evento(v.ev), testo: pzkTesto(v.n) }))
        : [1, 2, 3, 4, 5, 6].map((i) => { const g = L.giornoPiu(oggi, -i), y = L.giornata(seme, g); return { g, s: y.salute, ev: y.evento, testo: pctTesto(y.evento.pct) } })
      const p = io.st === 'ok' && io.d.io?.ok ? io.d.io : null, st = io.st === 'ok' && io.d.stats?.ok ? io.d.stats.stats : null
      const blocchi = [
        ...(nuove.length ? [{ titolo: 'urgente · la tua lumachina' }, { testo: nuove.length === 1 ? 'si è svegliata e ha deciso lei:' : `mentre non c’eri ha vissuto ${nuove.length} giornate:` },
          ...nuove.map((v) => ({ punto: `${giornoBreve(v.g)} · ${L.evento(v.ev)?.titolo ?? v.ev}: ${pzkTesto(v.n)} (${pctTesto(v.pct)})` })), { testo: `in tutto ${pzkTesto(tot)}. OK: ho capito.` }] : []),
        { titolo: 'la lumachina' }, { testo: `oggi è ${gi.umore} · salute ${gi.salute.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %` }, { barra: gi.salute / 100 },
        { testo: `oggi · ${ev.titolo}: ${ev.testo}` },
        { testo: c ? (reg ? `ha fatto ${pctTesto(reg.pct)}, ${pzkTesto(reg.n)}` : `${pctTesto(ev.pct)}: la banca la registra quando il conto si sincronizza`) : ev.pct ? `senza conto non tocca i tuoi $pzk (col conto: ${pctTesto(ev.pct)})` : 'oggi non sposta un $pzk' },
        ...(prima.length ? [{ titolo: 'gli ultimi giorni' }, ...prima.map((v) => ({ punto: `${giornoBreve(v.g)} · ${Math.round(v.s)} % · ${v.ev?.titolo ?? ''} · ${v.testo}` }))] : []),
        { testo: 'ogni giorno si sveglia e decide lei com’è la giornata. Tu non puoi farci niente.' },
        ...(p ? [{ titolo: 'il tuo profilo' }, { testo: `${p.profilo.nome} · livello ${p.profilo.liv} · ${fmt(p.profilo.xp)} xp` },
          ...(p.vicini ? [{ titolo: 'i tuoi rivali (esperienza)' }, p.vicini.su ? { punto: `da superare: ${p.vicini.su.nome}, ${p.vicini.su.pos}°, ancora ${fmt(p.vicini.su.valore - p.vicini.io)} xp` } : { punto: 'sei il primo' }, ...(p.vicini.giu ? [{ punto: `ti insegue: ${p.vicini.giu.nome}, ${p.vicini.giu.pos}°, ${fmt(p.vicini.io - p.vicini.giu.valore)} xp dietro` }] : [])] : [])]
          : io.st === 'carico' ? [{ titolo: 'il tuo profilo' }, { testo: 'carico…' }] : [{ titolo: 'il tuo profilo' }, { testo: io.d?.io?.errore ?? 'il database adesso non risponde.' }]),
        ...(st ? [{ titolo: 'la banca in numeri' }, { testo: `${st.giocatori} giocatori · ${st.attivi24h} attivi oggi · ${st.attivi7g} in settimana` }, { testo: `${fmtCorto(st.pzk)} $pzk in giro · livello medio ${st.livelloMedio}` }, { testo: `pescati ${fmtCorto(st.pescati)} · quiz ${fmtCorto(st.quizGiusti)} · sfide ${fmtCorto(st.sfideFatte)} · quest ${fmtCorto(st.missioniFatte)}` }] : []),
      ]
      giuIo = scorrevole(l, impagina(blocchi), { y0: 34, vis: 9, giu: giuIo })
    },
    tasto(k) { if (k === 'su') { giuIo = Math.max(0, giuIo - 1); return true } if (k === 'giu') { giuIo++; return true } return false },
  }

  return pagine(os, {
    nome: 'giocatori', app: 'giocatori', iniziale: ultima,
    pagine: [pClassifiche, pNotizie, pCerca, pIo],
    esci: (x) => { ultima = x.pag; clearTimeout(attesaCerca) }, // (la ricerca in attesa non parte a app chiusa: 6.2)
  })
}
