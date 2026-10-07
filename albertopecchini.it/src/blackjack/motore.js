// Il motore del blackjack di pzkko.it: regole, sabot, mani, fasi e tempi.
//
// Funzioni pure su un oggetto di stato (JSON): niente rete, niente orologio
// proprio (`now`, in millisecondi, arriva da fuori) e niente caso proprio
// (`rnd()` in [0,1) arriva da fuori, così le prove sono ripetibili).
// Lo usano api/blackjack.js (Vercel, archivio su Redis) e tools/blackjack/
// (prove, server di sviluppo con i bot, amministrazione).
//
// Regole del tavolo (stile europeo, come nei casinò italiani):
// - sabot da 6 mazzi, rimescolato quando resta meno di un quarto delle carte;
// - il banco prende una sola carta scoperta e pesca le altre dopo i giocatori
//   (niente carta coperta, niente assicurazione);
// - il banco si ferma a 17, anche «morbido» (asso che vale 11);
// - blackjack naturale paga 3 a 2 (arrotondato per difetto), le altre vincite
//   alla pari, parità restituisce la puntata; banco blackjack batte tutto
//   tranne un altro blackjack;
// - raddoppio su qualsiasi prima coppia di carte (una carta sola, poi si sta);
// - divisione una volta sola, su due carte dello stesso valore; assi divisi
//   ricevono una carta sola; dopo una divisione un 21 non è blackjack;
// - chi non risponde in tempo sta; due volte di seguito e si alza dal tavolo.
//
// Le fasi: attesa → puntate → distribuzione → turno → banco → esito → puntate…
// Ogni fase a tempo ha `fine` (orario assoluto): `avanza()` fa scattare tutte
// le transizioni scadute, in ordine, ogni volta che il server viene chiamato.
// Le carte hanno un orario `t` di comparsa: il server le pesca tutte insieme,
// i client le mostrano una alla volta quando è il loro momento.

export const VERSIONE = 1
export const MAZZI = 6
export const POSTI = 5
export const RANGHI = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SEMI = ['c', 'q', 'f', 'p'] // cuori, quadri, fiori, picche
export const NOMI_SEMI = { c: 'cuori', q: 'quadri', f: 'fiori', p: 'picche' }
export const NOMI_RANGHI = { A: 'asso', J: 'fante', Q: 'donna', K: 're' }
export const FASI = ['attesa', 'puntate', 'distribuzione', 'turno', 'banco', 'esito']
export const MOSSE = ['carta', 'stai', 'raddoppia', 'dividi']

export const CONFIG = {
  benvenuto: 0, // $pzk a chi entra la prima volta: li decide pzkko
  min: 5, // puntata minima
  max: 500, // puntata massima
  tPuntate: 20000, // finestra delle puntate
  tFretta: 3000, // quando tutti i seduti hanno deciso, le puntate chiudono entro tanto
  tDecisione: 20000, // tempo per ogni decisione
  tEsito: 7000, // pausa a fine mano, con i risultati in vista
  tCarta: 650, // intervallo fra due carte distribuite
  tPrima: 800, // attesa prima della prima carta
  tPesca: 250, // una carta chiesta arriva dopo tanto
  tBanco: 900, // intervallo fra le carte del banco
  tCoda: 1500, // pausa dopo l'ultima carta del banco
  assenza: 90000, // senza segni di vita per tanto ci si alza dal tavolo
  online: 60000, // «in linea» = visto da meno di tanto
}

const LIMITI = { giocatori: 60, eventi: 30, storico: 10, registro: 50, nome: 14 }
const RISERVATI = ['banco', 'pzkko', 'admin', 'amministratore']

// ── Carte ────────────────────────────────────────────────────────────────────

/** Un sabot nuovo, mescolato (Fisher–Yates). Codici «Ac» = asso di cuori, «10p» = dieci di picche. */
export function nuovoSabot(rnd) {
  const s = []
  for (let m = 0; m < MAZZI; m++) for (const r of RANGHI) for (const q of SEMI) s.push(r + q)
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[s[i], s[j]] = [s[j], s[i]]
  }
  return s
}

export const rango = (c) => c.slice(0, -1)
export const seme = (c) => c.slice(-1)

/** Il valore di una mano: `tot` col miglior uso degli assi, `morbida` se un asso vale ancora 11. */
export function valore(carte) {
  let tot = 0
  let assi = 0
  for (const { c } of carte) {
    const r = rango(c)
    if (r === 'A') {
      assi++
      tot += 11
    } else if (r === 'J' || r === 'Q' || r === 'K' || r === '10') tot += 10
    else tot += Number(r)
  }
  while (tot > 21 && assi) {
    tot -= 10
    assi--
  }
  return { tot, morbida: assi > 0 }
}

const valoreCarta = (c) => valore([{ c }]).tot
const blackjack = (mano) => mano.carte.length === 2 && !mano.divisa && valore(mano.carte).tot === 21

/** Nome di una carta per gli eventi: «asso di cuori», «10 di picche». */
export function nomeCarta(c) {
  const r = rango(c)
  return `${NOMI_RANGHI[r] || r} di ${NOMI_SEMI[seme(c)]}`
}

function pesca(st, rnd, t) {
  if (!st.sabot.length) {
    st.sabot = nuovoSabot(rnd)
    evento(st, t, 'il sabot è finito a metà mano: il banco ne apre uno nuovo')
  }
  st.usate++
  return { c: st.sabot.pop(), t }
}

// ── Stato ────────────────────────────────────────────────────────────────────

export function nuovoStato(now, rnd) {
  return {
    ver: VERSIONE,
    v: 0,
    creato: now,
    fase: 'attesa',
    fine: null,
    mano: 0,
    sabot: nuovoSabot(rnd),
    usate: 0,
    banco: { carte: [] },
    posti: Array.from({ length: POSTI }, () => null),
    turno: null,
    giocatori: {},
    config: { ...CONFIG },
    eventi: [],
    storico: [],
    registro: [],
  }
}

/** Uno stato letto dall'archivio: completa i campi mancanti di versioni precedenti. */
export function ripara(st, now, rnd) {
  if (!st || typeof st !== 'object') return nuovoStato(now, rnd)
  const n = nuovoStato(now, rnd)
  for (const k of Object.keys(n)) if (st[k] === undefined) st[k] = n[k]
  st.config = { ...CONFIG, ...st.config }
  if (!Array.isArray(st.posti) || st.posti.length !== POSTI) st.posti = n.posti
  return st
}

export function evento(st, t, testo) {
  st.eventi.push({ t, testo })
  if (st.eventi.length > LIMITI.eventi) st.eventi.splice(0, st.eventi.length - LIMITI.eventi)
}

const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'
export function codice(rnd, n) {
  let s = ''
  for (let i = 0; i < n; i++) s += ALFABETO[Math.floor(rnd() * ALFABETO.length)]
  return s
}

const fmt = (n) => Math.trunc(n).toLocaleString('it-IT')
const giocatore = (st, id) => st.giocatori[id] || null
const nome = (st, id) => (giocatore(st, id) || {}).nome || '?'
const seduti = (st) => st.posti.filter(Boolean)
const inMano = (st) => st.fase === 'distribuzione' || st.fase === 'turno' || st.fase === 'banco' || st.fase === 'esito'

/** Un nome accettabile: 2–14 caratteri, lettere, cifre, spazi, . _ -; mai «banco» o «pzkko». */
export function pulisciNome(v) {
  const n = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, LIMITI.nome) : ''
  if (n.length < 2) return { error: 'scrivi un nome di almeno 2 lettere' }
  if (!/^[\p{L}\p{N} ._-]+$/u.test(n)) return { error: 'nel nome solo lettere, cifre, spazi, punto, trattino' }
  if (RISERVATI.includes(n.toLowerCase())) return { error: 'quel nome è riservato' }
  return { nome: n }
}

export function trova(st, chi) {
  if (typeof chi !== 'string' || !chi.trim()) return null
  const k = chi.trim().toLowerCase()
  return Object.values(st.giocatori).find((g) => g.id === k || g.nome.toLowerCase() === k) || null
}

// ── Posti ────────────────────────────────────────────────────────────────────

function nuovoPosto(id) {
  return { id, puntata: 0, ultima: 0, salta: false, mani: [], assente: 0, via: false }
}

function alza(st, i, now, perche) {
  const p = st.posti[i]
  if (!p) return
  const g = giocatore(st, p.id)
  if (g && g.posto === i) g.posto = null
  st.posti[i] = null
  if (perche) evento(st, now, perche)
}

/** Tutti i seduti hanno deciso (puntato o saltato): le puntate chiudono in fretta. */
function fretta(st, now) {
  const s = seduti(st)
  if (st.fase !== 'puntate' || !s.length) return
  if (s.every((p) => p.puntata > 0 || p.salta)) st.fine = Math.min(st.fine, now + st.config.tFretta)
}

// ── Il giro delle fasi ───────────────────────────────────────────────────────

/** C'è qualcosa di scaduto da far scattare? (per non riscrivere l'archivio a vuoto) */
export function scade(st, now) {
  if (st.fine !== null && now >= st.fine) return true
  for (const p of st.posti) {
    if (!p) continue
    const g = giocatore(st, p.id)
    if (!g || (!inMano(st) && now - g.visto > st.config.assenza)) return true
  }
  return false
}

/** Fa scattare tutte le transizioni scadute. Torna true se lo stato è cambiato. */
export function avanza(st, now, rnd) {
  let cambiato = false
  for (let i = 0; i < POSTI; i++) {
    const p = st.posti[i]
    if (!p) continue
    const g = giocatore(st, p.id)
    const occupato = inMano(st) && p.mani.length > 0
    if (!g) {
      alza(st, i, now, null)
      cambiato = true
    } else if (!occupato && now - g.visto > st.config.assenza) {
      alza(st, i, now, `${g.nome} non si fa vivo da un po': il posto si libera`)
      cambiato = true
    }
  }
  for (let giri = 0; giri < 24 && st.fine !== null && now >= st.fine; giri++) {
    const quando = st.fine
    cambiato = true
    switch (st.fase) {
      case 'puntate':
        chiudiPuntate(st, now, rnd)
        break
      case 'distribuzione':
        prossimoTurno(st, now, rnd, 0, 0)
        break
      case 'turno':
        scadeTurno(st, now, rnd)
        break
      case 'banco':
        esito(st, now)
        break
      case 'esito':
        pulisci(st, now)
        break
      default:
        st.fine = null
    }
    if (st.fine === quando) st.fine = null // mai un giro a vuoto sulla stessa scadenza
  }
  if (st.fase === 'puntate' && !seduti(st).length) {
    st.fase = 'attesa'
    st.fine = null
    cambiato = true
  }
  return cambiato
}

function chiudiPuntate(st, now, rnd) {
  const pronti = seduti(st).filter((p) => p.puntata > 0 && giocatore(st, p.id) && giocatore(st, p.id).pzk >= p.puntata)
  if (!pronti.length) {
    for (const p of seduti(st)) {
      p.puntata = 0
      p.salta = false
    }
    st.fase = 'attesa'
    st.fine = null
    evento(st, now, 'nessuna puntata: il tavolo aspetta')
    return
  }
  distribuisci(st, now, rnd)
}

function distribuisci(st, now, rnd) {
  const cfg = st.config
  st.mano++
  if (st.sabot.length < (MAZZI * 52) / 4) {
    st.sabot = nuovoSabot(rnd)
    evento(st, now, 'il banco rimescola il sabot')
  }
  st.banco = { carte: [] }
  st.turno = null
  const attivi = []
  for (const p of seduti(st)) {
    const g = giocatore(st, p.id)
    p.salta = false
    if (p.puntata > 0 && g.pzk >= p.puntata) {
      g.pzk -= p.puntata
      g.stat.mani++
      p.ultima = p.puntata
      p.mani = [{ carte: [], puntata: p.puntata, stato: 'gioca' }]
      attivi.push(p)
    } else {
      p.puntata = 0
      p.mani = []
    }
  }
  let t = now + cfg.tPrima
  for (const p of attivi) {
    p.mani[0].carte.push(pesca(st, rnd, t))
    t += cfg.tCarta
  }
  st.banco.carte.push(pesca(st, rnd, t))
  t += cfg.tCarta
  for (const p of attivi) {
    p.mani[0].carte.push(pesca(st, rnd, t))
    t += cfg.tCarta
    if (blackjack(p.mani[0])) p.mani[0].stato = 'bj'
  }
  st.fase = 'distribuzione'
  st.fine = t
  evento(st, now, `mano ${st.mano}: ${attivi.map((p) => `${nome(st, p.id)} ${fmt(p.puntata)}`).join(', ')}`)
  for (const p of attivi) if (p.mani[0].stato === 'bj') evento(st, p.mani[0].carte[1].t, `blackjack per ${nome(st, p.id)}`)
}

/** Passa la parola alla prossima mano da giocare, dal posto `posto` e dalla mano `mano` in poi; se non ce n'è, gioca il banco. */
function prossimoTurno(st, now, rnd, posto, mano) {
  for (let i = posto; i < POSTI; i++) {
    const p = st.posti[i]
    if (!p) continue
    for (let j = i === posto ? mano : 0; j < p.mani.length; j++) {
      if (p.mani[j].stato !== 'gioca') continue
      st.fase = 'turno'
      st.turno = { posto: i, mano: j }
      st.fine = now + st.config.tDecisione
      return
    }
  }
  giocaBanco(st, now, rnd)
}

function scadeTurno(st, now, rnd) {
  const { posto, mano } = st.turno
  const p = st.posti[posto]
  if (!p || !p.mani[mano]) return prossimoTurno(st, now, rnd, posto, mano + 1)
  p.mani[mano].stato = 'stai'
  p.assente++
  evento(st, now, `${nome(st, p.id)} non risponde e sta${p.assente >= 2 ? ': a fine mano si alza' : ''}`)
  prossimoTurno(st, now, rnd, posto, mano + 1)
}

function giocaBanco(st, now, rnd) {
  const cfg = st.config
  st.turno = null
  const vive = seduti(st).some((p) => p.mani.some((m) => m.stato !== 'sballata'))
  let t = now + cfg.tBanco
  let ultima = now
  if (vive) {
    // sta a 17, anche morbido; la prima carta sola vale al massimo 11, quindi pesca sempre la seconda
    while (valore(st.banco.carte).tot < 17) {
      st.banco.carte.push(pesca(st, rnd, t))
      ultima = t
      t += cfg.tBanco
    }
  }
  st.fase = 'banco'
  st.fine = ultima + cfg.tCoda
}

function esito(st, now) {
  const vb = valore(st.banco.carte)
  const bancoBj = st.banco.carte.length === 2 && vb.tot === 21
  const righe = []
  for (const p of seduti(st)) {
    const g = giocatore(st, p.id)
    for (const m of p.mani) {
      const v = valore(m.carte).tot
      let e
      let delta
      if (m.stato === 'sballata') {
        e = 'perde'
        delta = -m.puntata
      } else if (m.stato === 'bj') {
        if (bancoBj) {
          e = 'pari'
          delta = 0
          g.pzk += m.puntata
        } else {
          e = 'bj'
          delta = Math.floor(m.puntata * 1.5)
          g.pzk += m.puntata + delta
        }
      } else if (bancoBj) {
        e = 'perde'
        delta = -m.puntata
      } else if (vb.tot > 21 || v > vb.tot) {
        e = 'vince'
        delta = m.puntata
        g.pzk += m.puntata * 2
      } else if (v === vb.tot) {
        e = 'pari'
        delta = 0
        g.pzk += m.puntata
      } else {
        e = 'perde'
        delta = -m.puntata
      }
      m.esito = e
      m.delta = delta
      g.stat.netto += delta
      if (e === 'vince' || e === 'bj') g.stat.vinte++
      else if (e === 'perde') g.stat.perse++
      else g.stat.pari++
      if (e === 'bj') g.stat.bj++
      righe.push({ nome: g.nome, esito: e, delta })
    }
  }
  const bancoTesto = vb.tot > 21 ? 'il banco sballa' : bancoBj ? 'blackjack del banco' : `il banco fa ${vb.tot}`
  const vincite = righe.filter((r) => r.delta > 0).map((r) => `${r.nome} +${fmt(r.delta)}`)
  const pari = righe.filter((r) => r.esito === 'pari').map((r) => r.nome)
  const perdite = righe.filter((r) => r.delta < 0).map((r) => `${r.nome} ${fmt(r.delta)}`)
  evento(st, now, [bancoTesto, ...vincite, ...(pari.length ? [`pari ${pari.join(', ')}`] : []), ...perdite].join(' · '))
  st.storico.unshift({ mano: st.mano, t: now, banco: vb.tot > 21 ? 'sballa' : bancoBj ? 'bj' : vb.tot, righe })
  if (st.storico.length > LIMITI.storico) st.storico.length = LIMITI.storico
  st.fase = 'esito'
  st.fine = now + st.config.tEsito
}

function pulisci(st, now) {
  for (let i = 0; i < POSTI; i++) {
    const p = st.posti[i]
    if (!p) continue
    const g = giocatore(st, p.id)
    p.mani = []
    p.puntata = 0
    p.salta = false
    if (!g) alza(st, i, now, null)
    else if (p.via) alza(st, i, now, `${g.nome} si alza dal tavolo`)
    else if (p.assente >= 2) alza(st, i, now, `${g.nome} si è addormentato: il posto si libera`)
    else if (now - g.visto > st.config.assenza) alza(st, i, now, `${g.nome} non si fa vivo da un po': il posto si libera`)
  }
  st.banco = { carte: [] }
  st.turno = null
  if (seduti(st).length) {
    st.fase = 'puntate'
    st.fine = now + st.config.tPuntate
  } else {
    st.fase = 'attesa'
    st.fine = null
  }
}

// ── Azioni dei giocatori ─────────────────────────────────────────────────────

/** Entra: con un nome nuovo si viene registrati, col proprio codice si torna. */
export function entra(st, { nome: n, tok }, now, rnd) {
  if (tok) {
    const g = Object.values(st.giocatori).find((x) => x.tok === tok)
    if (!g) return { error: 'codice non valido: entra con un nome nuovo o chiedi il tuo codice a pzkko' }
    g.visto = now
    return { ok: true, io: g }
  }
  const pul = pulisciNome(n)
  if (pul.error) return pul
  if (Object.values(st.giocatori).some((g) => g.nome.toLowerCase() === pul.nome.toLowerCase())) {
    return { error: 'quel nome è già al tavolo: se sei tu, entra col tuo codice' }
  }
  if (Object.keys(st.giocatori).length >= LIMITI.giocatori) return { error: 'troppi giocatori registrati: chiedi a pzkko' }
  let id
  do id = codice(rnd, 6)
  while (st.giocatori[id])
  const g = {
    id,
    nome: pul.nome,
    tok: codice(rnd, 24),
    pzk: st.config.benvenuto,
    creato: now,
    visto: now,
    posto: null,
    stat: { mani: 0, vinte: 0, perse: 0, pari: 0, bj: 0, netto: 0 },
  }
  st.giocatori[id] = g
  evento(st, now, `${g.nome} entra${g.pzk ? ` con ${fmt(g.pzk)} $pzk di benvenuto` : ''}`)
  return { ok: true, io: g, nuovo: true }
}

/** Si siede al primo posto libero (o a quello chiesto, se libero). */
export function siedi(st, id, now, posto) {
  const g = giocatore(st, id)
  if (!g) return { error: 'non sei al tavolo' }
  if (g.posto !== null && st.posti[g.posto] && st.posti[g.posto].id === id) return { error: 'sei già seduto' }
  let i = Number.isInteger(posto) && posto >= 0 && posto < POSTI && !st.posti[posto] ? posto : st.posti.findIndex((p) => !p)
  if (i < 0) return { error: 'tavolo pieno: aspetta che si liberi un posto' }
  st.posti[i] = nuovoPosto(id)
  g.posto = i
  g.visto = now
  evento(st, now, `${g.nome} si siede al posto ${i + 1}`)
  return { ok: true }
}

/** Si alza: subito se non ha una mano in corso, altrimenti a fine mano. */
export function alzati(st, id, now) {
  const g = giocatore(st, id)
  if (!g || g.posto === null || !st.posti[g.posto]) return { error: 'non sei seduto' }
  const p = st.posti[g.posto]
  if (inMano(st) && p.mani.length) {
    if (p.via) return { error: 'ti alzi a fine mano' }
    p.via = true
    evento(st, now, `${g.nome} si alza a fine mano`)
    return { ok: true, dopo: true }
  }
  alza(st, g.posto, now, `${g.nome} si alza dal tavolo`)
  if (st.fase === 'puntate') fretta(st, now)
  return { ok: true }
}

/** Punta (0 ritira la puntata). In attesa, la prima puntata apre la finestra. */
export function punta(st, id, importo, now) {
  const g = giocatore(st, id)
  if (!g || g.posto === null || !st.posti[g.posto]) return { error: 'siediti prima di puntare' }
  if (st.fase !== 'attesa' && st.fase !== 'puntate') return { error: 'si punta fra una mano e l’altra' }
  const n = Number(importo)
  if (!Number.isInteger(n) || n < 0) return { error: 'puntata non valida' }
  const p = st.posti[g.posto]
  if (n > 0 && n < st.config.min) return { error: `si punta almeno ${fmt(st.config.min)} $pzk` }
  if (n > st.config.max) return { error: `si punta al massimo ${fmt(st.config.max)} $pzk` }
  if (n > g.pzk) return { error: g.pzk ? `hai solo ${fmt(g.pzk)} $pzk` : 'non hai $pzk: chiedili a pzkko' }
  p.puntata = n
  p.salta = false
  g.visto = now
  if (n > 0) {
    if (st.fase === 'attesa') {
      st.fase = 'puntate'
      st.fine = now + st.config.tPuntate
      evento(st, now, `${g.nome} punta ${fmt(n)} $pzk: si apre il tavolo`)
    } else evento(st, now, `${g.nome} punta ${fmt(n)} $pzk`)
  }
  fretta(st, now)
  return { ok: true }
}

/** Salta la prossima mano (resta seduto). */
export function salta(st, id, now) {
  const g = giocatore(st, id)
  if (!g || g.posto === null || !st.posti[g.posto]) return { error: 'non sei seduto' }
  if (st.fase !== 'attesa' && st.fase !== 'puntate') return { error: 'si decide fra una mano e l’altra' }
  const p = st.posti[g.posto]
  p.puntata = 0
  p.salta = true
  g.visto = now
  fretta(st, now)
  return { ok: true }
}

function dopoCarta(m) {
  const v = valore(m.carte).tot
  if (v > 21) m.stato = 'sballata'
  else if (v === 21) m.stato = 'stai'
}

export function puoRaddoppiare(st, g, p, m) {
  return m.stato === 'gioca' && m.carte.length === 2 && g.pzk >= m.puntata
}

export function puoDividere(st, g, p, m) {
  return m.stato === 'gioca' && m.carte.length === 2 && p.mani.length === 1 && g.pzk >= m.puntata && valoreCarta(m.carte[0].c) === valoreCarta(m.carte[1].c)
}

/** Una mossa nel proprio turno: carta, stai, raddoppia, dividi. */
export function gioca(st, id, mossa, now, rnd) {
  const g = giocatore(st, id)
  if (!g || g.posto === null) return { error: 'non sei seduto' }
  if (st.fase !== 'turno' || !st.turno || st.turno.posto !== g.posto) return { error: 'non è il tuo turno' }
  const p = st.posti[g.posto]
  const m = p.mani[st.turno.mano]
  if (!m || m.stato !== 'gioca') return { error: 'questa mano è chiusa' }
  const cfg = st.config
  p.assente = 0
  g.visto = now
  const nm = g.nome
  switch (mossa) {
    case 'carta': {
      const c = pesca(st, rnd, now + cfg.tPesca)
      m.carte.push(c)
      dopoCarta(m)
      const v = valore(m.carte).tot
      evento(st, c.t, `${nm} chiede carta: ${nomeCarta(c.c)}${m.stato === 'sballata' ? ', sballa' : v === 21 ? ', fa 21' : ''}`)
      if (m.stato === 'gioca') st.fine = now + cfg.tDecisione
      else prossimoTurno(st, now, rnd, g.posto, st.turno.mano + 1)
      return { ok: true }
    }
    case 'stai':
      m.stato = 'stai'
      evento(st, now, `${nm} sta a ${valore(m.carte).tot}`)
      prossimoTurno(st, now, rnd, g.posto, st.turno.mano + 1)
      return { ok: true }
    case 'raddoppia': {
      if (!puoRaddoppiare(st, g, p, m)) return { error: g.pzk < m.puntata ? 'non hai abbastanza $pzk per raddoppiare' : 'si raddoppia solo sulle prime due carte' }
      g.pzk -= m.puntata
      m.puntata *= 2
      const c = pesca(st, rnd, now + cfg.tPesca)
      m.carte.push(c)
      m.stato = valore(m.carte).tot > 21 ? 'sballata' : 'raddoppiata'
      evento(st, c.t, `${nm} raddoppia a ${fmt(m.puntata)}: ${nomeCarta(c.c)}${m.stato === 'sballata' ? ', sballa' : `, fa ${valore(m.carte).tot}`}`)
      prossimoTurno(st, now, rnd, g.posto, st.turno.mano + 1)
      return { ok: true }
    }
    case 'dividi': {
      if (!puoDividere(st, g, p, m)) return { error: g.pzk < m.puntata ? 'non hai abbastanza $pzk per dividere' : 'si divide una coppia, una volta sola' }
      g.pzk -= m.puntata
      const [c1, c2] = m.carte
      const assi = rango(c1.c) === 'A'
      m.carte = [c1]
      m.divisa = true
      const m2 = { carte: [c2], puntata: m.puntata, stato: 'gioca', divisa: true }
      p.mani.push(m2)
      m.carte.push(pesca(st, rnd, now + cfg.tPesca))
      m2.carte.push(pesca(st, rnd, now + cfg.tPesca + cfg.tCarta))
      if (assi) {
        m.stato = 'stai'
        m2.stato = 'stai'
      } else {
        dopoCarta(m)
        dopoCarta(m2)
      }
      evento(st, now, `${nm} divide ${assi ? 'gli assi' : `i ${rango(c1.c) === '10' || valoreCarta(c1.c) === 10 ? 'dieci' : rango(c1.c)}`}`)
      prossimoTurno(st, now, rnd, g.posto, 0)
      return { ok: true }
    }
    default:
      return { error: 'mossa sconosciuta' }
  }
}

/** Segno di vita: aggiorna `visto` solo se è passato un po' (per non riscrivere l'archivio a ogni giro). */
export function ping(st, id, now) {
  const g = giocatore(st, id)
  if (!g) return { error: 'codice non valido' }
  if (now - g.visto < 20000) return { ok: true, cambiato: false }
  g.visto = now
  return { ok: true, cambiato: true }
}

// ── Amministrazione (pzkko) ──────────────────────────────────────────────────

const intero = (v, min, max) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

function registra(st, now, testo) {
  st.registro.push({ t: now, testo })
  if (st.registro.length > LIMITI.registro) st.registro.splice(0, st.registro.length - LIMITI.registro)
  evento(st, now, testo)
}

/** Un comando di pzkko: dai, togli, imposta, nuovo, benvenuto, limiti, tempi, espelli, elimina, messaggio, azzera. */
export function ammin(st, cmd, args, now, rnd) {
  const quanti = intero(args.quanti, 0, 1e9)
  const chi = () => {
    const g = trova(st, args.chi)
    return g || null
  }
  switch (cmd) {
    case 'elenco':
    case 'stato':
      return { ok: true, cambiato: false }
    case 'dai': {
      const g = chi()
      if (!g) return { error: 'giocatore non trovato' }
      if (!quanti) return { error: 'quanti $pzk?' }
      g.pzk += quanti
      registra(st, now, `pzkko regala ${fmt(quanti)} $pzk a ${g.nome}`)
      return { ok: true, esito: `${g.nome} ora ha ${fmt(g.pzk)} $pzk` }
    }
    case 'togli': {
      const g = chi()
      if (!g) return { error: 'giocatore non trovato' }
      if (!quanti) return { error: 'quanti $pzk?' }
      g.pzk = Math.max(0, g.pzk - quanti)
      registra(st, now, `pzkko toglie ${fmt(quanti)} $pzk a ${g.nome}`)
      return { ok: true, esito: `${g.nome} ora ha ${fmt(g.pzk)} $pzk` }
    }
    case 'imposta': {
      const g = chi()
      if (!g) return { error: 'giocatore non trovato' }
      if (quanti === null) return { error: 'quanti $pzk?' }
      g.pzk = quanti
      registra(st, now, `pzkko porta ${g.nome} a ${fmt(quanti)} $pzk`)
      return { ok: true, esito: `${g.nome} ora ha ${fmt(g.pzk)} $pzk` }
    }
    case 'nuovo': {
      const r = entra(st, { nome: args.nome }, now, rnd)
      if (r.error) return r
      if (quanti) r.io.pzk = quanti
      registra(st, now, `pzkko registra ${r.io.nome}${quanti ? ` con ${fmt(quanti)} $pzk` : ''}`)
      return { ok: true, esito: `${r.io.nome} registrato, codice ${r.io.tok}`, io: r.io }
    }
    case 'benvenuto': {
      if (quanti === null) return { error: 'quanti $pzk di benvenuto?' }
      st.config.benvenuto = quanti
      registra(st, now, `chi entra riceve ${fmt(quanti)} $pzk`)
      return { ok: true, esito: `benvenuto: ${fmt(quanti)} $pzk` }
    }
    case 'limiti': {
      const min = intero(args.min, 1, 1e6)
      const max = intero(args.max, 1, 1e9)
      if (!min || !max || min > max) return { error: 'limiti non validi (min e max, min ≤ max)' }
      st.config.min = min
      st.config.max = max
      registra(st, now, `puntate da ${fmt(min)} a ${fmt(max)} $pzk`)
      return { ok: true, esito: `puntate da ${fmt(min)} a ${fmt(max)}` }
    }
    case 'tempi': {
      const pu = intero(args.puntate, 5, 120)
      const de = intero(args.decisione, 5, 120)
      if (!pu && !de) return { error: 'tempi non validi (secondi, da 5 a 120)' }
      if (pu) st.config.tPuntate = pu * 1000
      if (de) st.config.tDecisione = de * 1000
      registra(st, now, `tempi: puntate ${st.config.tPuntate / 1000} s, decisione ${st.config.tDecisione / 1000} s`)
      return { ok: true, esito: 'tempi aggiornati' }
    }
    case 'espelli': {
      const g = chi()
      if (!g) return { error: 'giocatore non trovato' }
      if (g.posto === null) return { error: `${g.nome} non è seduto` }
      const p = st.posti[g.posto]
      if (p && inMano(st) && p.mani.length) {
        p.via = true
        registra(st, now, `pzkko fa alzare ${g.nome} a fine mano`)
        return { ok: true, esito: `${g.nome} si alza a fine mano` }
      }
      alza(st, g.posto, now, `pzkko fa alzare ${g.nome}`)
      return { ok: true, esito: `${g.nome} si è alzato` }
    }
    case 'elimina': {
      const g = chi()
      if (!g) return { error: 'giocatore non trovato' }
      if (g.posto !== null && st.posti[g.posto] && inMano(st) && st.posti[g.posto].mani.length) return { error: 'ha una mano in corso: aspetta la fine' }
      if (g.posto !== null) alza(st, g.posto, now, null)
      delete st.giocatori[g.id]
      registra(st, now, `pzkko cancella ${g.nome}`)
      return { ok: true, esito: `${g.nome} cancellato` }
    }
    case 'messaggio': {
      const t = typeof args.testo === 'string' ? args.testo.replace(/\s+/g, ' ').trim().slice(0, 140) : ''
      if (t.length < 1) return { error: 'messaggio vuoto' }
      evento(st, now, `pzkko dice: ${t}`)
      return { ok: true, esito: 'detto' }
    }
    case 'azzera': {
      // il tavolo riparte da zero; i giocatori e i loro $pzk restano
      const fresco = nuovoStato(now, rnd)
      for (const g of Object.values(st.giocatori)) g.posto = null
      Object.assign(st, { fase: fresco.fase, fine: null, mano: 0, sabot: fresco.sabot, usate: 0, banco: fresco.banco, posti: fresco.posti, turno: null, storico: [] })
      registra(st, now, 'pzkko azzera il tavolo')
      return { ok: true, esito: 'tavolo azzerato' }
    }
    default:
      return { error: 'comando sconosciuto' }
  }
}

// ── Vista pubblica ───────────────────────────────────────────────────────────

const online = (st, g, now) => now - g.visto < st.config.online

/** Quello che vedono tutti: niente sabot, niente codici. */
export function pubblico(st, now) {
  const cfg = st.config
  return {
    v: st.v,
    fase: st.fase,
    fine: st.fine,
    mano: st.mano,
    turno: st.turno,
    banco: st.banco,
    posti: st.posti.map((p) => {
      if (!p) return null
      const g = giocatore(st, p.id)
      return {
        id: p.id,
        nome: g ? g.nome : '?',
        pzk: g ? g.pzk : 0,
        online: g ? online(st, g, now) : false,
        puntata: p.puntata,
        ultima: p.ultima,
        salta: p.salta,
        via: p.via,
        mani: p.mani,
      }
    }),
    sabot: { carte: st.sabot.length, mazzi: MAZZI },
    giocatori: Object.values(st.giocatori)
      .map((g) => ({ id: g.id, nome: g.nome, pzk: g.pzk, posto: g.posto, online: online(st, g, now), stat: g.stat }))
      .sort((a, b) => b.pzk - a.pzk || a.nome.localeCompare(b.nome)),
    config: { min: cfg.min, max: cfg.max, benvenuto: cfg.benvenuto, tPuntate: cfg.tPuntate, tDecisione: cfg.tDecisione },
    eventi: st.eventi.slice(-12),
    storico: st.storico,
  }
}

/** La propria scheda: quello che vede solo chi ha il codice. */
export function mio(st, g) {
  return { id: g.id, nome: g.nome, pzk: g.pzk, posto: g.posto, stat: g.stat }
}

/** Per pzkko: tutti i giocatori con i codici, la configurazione e il registro. */
export function privato(st) {
  return {
    giocatori: Object.values(st.giocatori)
      .map((g) => ({ id: g.id, nome: g.nome, tok: g.tok, pzk: g.pzk, posto: g.posto, creato: g.creato, visto: g.visto, stat: g.stat }))
      .sort((a, b) => b.pzk - a.pzk || a.nome.localeCompare(b.nome)),
    config: st.config,
    registro: st.registro,
    sabot: st.sabot.length,
    usate: st.usate,
  }
}
