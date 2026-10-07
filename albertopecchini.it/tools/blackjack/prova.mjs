// Prova del motore del blackjack: orologio finto, caso ripetibile, nessuna rete.
//
//   node tools/blackjack/prova.mjs
//
// Gioca mani vere con tre giocatori e controlla regole, tempi e conti: la somma
// dei $pzk cambia esattamente di quanto dicono gli esiti, blackjack paga 3 a 2,
// chi non risponde sta, raddoppio e divisione fanno quello che devono, il banco
// si ferma a 17 anche morbido, il sabot si rimescola.
import assert from 'node:assert/strict'
import * as M from '../../src/blackjack/motore.js'

// caso ripetibile (mulberry32)
function semina(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let prove = 0
const ok = (cond, msg) => {
  assert.ok(cond, msg)
  prove++
}
const uguale = (a, b, msg) => {
  assert.equal(a, b, msg)
  prove++
}

const rnd = semina(42)
let now = 1_700_000_000_000
const avanza = (st, ms = 0) => {
  now += ms
  M.avanza(st, now, rnd)
}
const totale = (st) => Object.values(st.giocatori).reduce((s, g) => s + g.pzk, 0)
const puntate = (st) => (st.fase === 'distribuzione' || st.fase === 'turno' || st.fase === 'banco' ? st.posti.filter(Boolean).reduce((s, p) => s + p.mani.reduce((x, m) => x + m.puntata, 0), 0) : 0)
/** Mette in cima al sabot (le prossime pescate) le carte date, nell'ordine in cui usciranno. */
const prepara = (st, ...carte) => st.sabot.push(...carte.reverse())

// ── registrazione, posti, $pzk ───────────────────────────────────────────────
const st = M.nuovoStato(now, rnd)
uguale(st.sabot.length, 312, 'sabot da 6 mazzi')
uguale(new Set(st.sabot).size, 52, '52 carte diverse')

assert.ok(M.entra(st, { nome: 'x' }, now, rnd).error, 'nome troppo corto')
assert.ok(M.entra(st, { nome: 'banco' }, now, rnd).error, 'nome riservato')
assert.ok(M.entra(st, { nome: '<b>ciao</b>' }, now, rnd).error, 'niente html')
const anna = M.entra(st, { nome: 'Anna' }, now, rnd).io
const bruno = M.entra(st, { nome: 'bruno' }, now, rnd).io
const carla = M.entra(st, { nome: 'carla' }, now, rnd).io
assert.ok(M.entra(st, { nome: 'ANNA' }, now, rnd).error, 'nome già preso, senza badare alle maiuscole')
uguale(M.entra(st, { tok: anna.tok }, now, rnd).io.id, anna.id, 'si rientra col codice')
assert.ok(M.entra(st, { tok: 'xxx' }, now, rnd).error, 'codice sbagliato')
uguale(anna.pzk, 0, 'senza benvenuto si parte da zero')

assert.ok(M.punta(st, anna.id, 50, now).error, 'non si punta in piedi')
ok(M.siedi(st, anna.id, now).ok, 'anna si siede')
ok(M.siedi(st, bruno.id, now, 3).ok, 'bruno sceglie il posto 4')
ok(M.siedi(st, carla.id, now).ok, 'carla si siede')
uguale(st.posti[0].id, anna.id, 'primo posto libero')
uguale(st.posti[3].id, bruno.id, 'posto scelto')
uguale(st.posti[1].id, carla.id, 'il prossimo libero')
assert.ok(M.siedi(st, anna.id, now).error, 'non ci si siede due volte')
assert.ok(M.punta(st, anna.id, 50, now).error, 'senza $pzk non si punta')

ok(M.ammin(st, 'dai', { chi: 'anna', quanti: 1000 }, now, rnd).ok, 'pzkko regala')
ok(M.ammin(st, 'dai', { chi: bruno.id, quanti: 1000 }, now, rnd).ok, 'anche per id')
ok(M.ammin(st, 'imposta', { chi: 'CARLA', quanti: 300 }, now, rnd).ok, 'imposta')
assert.ok(M.ammin(st, 'dai', { chi: 'nessuno', quanti: 5 }, now, rnd).error, 'giocatore inesistente')
assert.ok(M.ammin(st, 'limiti', { min: 100, max: 50 }, now, rnd).error, 'limiti al contrario')
uguale(totale(st), 2300, 'conti dopo i regali')

// ── puntate e tempi ──────────────────────────────────────────────────────────
uguale(st.fase, 'attesa', 'si parte in attesa')
assert.ok(M.punta(st, anna.id, 2, now).error, 'sotto il minimo')
assert.ok(M.punta(st, anna.id, 5000, now).error, 'oltre il massimo')
assert.ok(M.punta(st, carla.id, 301, now).error, 'oltre i propri $pzk')
ok(M.punta(st, anna.id, 100, now).ok, 'anna punta')
uguale(st.fase, 'puntate', 'la prima puntata apre il tavolo')
uguale(st.fine, now + st.config.tPuntate, 'finestra delle puntate')
avanza(st, 5000)
uguale(st.fase, 'puntate', 'la finestra è ancora aperta')
ok(M.punta(st, bruno.id, 50, now).ok, 'bruno punta')
ok(M.salta(st, carla.id, now).ok, 'carla salta la mano')
ok(st.fine <= now + st.config.tFretta, 'tutti hanno decito: si chiude in fretta')
ok(M.punta(st, bruno.id, 60, now).ok, 'si può cambiare puntata')
uguale(st.posti[3].puntata, 60, 'puntata aggiornata')

// carte preparate: anna A♠ + K♥ (blackjack), bruno 10♣ + 6♦, banco 9♠ poi 8♣
prepara(st, 'Ap', '10f', '9p', 'Kc', '6q', '8f')
avanza(st, st.config.tFretta)
uguale(st.fase, 'distribuzione', 'si distribuisce')
uguale(st.mano, 1, 'prima mano')
uguale(totale(st) + puntate(st), 2300, 'le puntate sono uscite dalle tasche')
uguale(st.posti[0].mani[0].stato, 'bj', 'blackjack naturale riconosciuto')
uguale(st.posti[1].mani.length, 0, 'chi salta non ha carte')
uguale(st.banco.carte.length, 1, 'il banco ha una carta sola')
const t1 = st.posti[0].mani[0].carte[0].t
const t2 = st.posti[3].mani[0].carte[0].t
uguale(t2 - t1, st.config.tCarta, 'le carte escono una alla volta')
ok(st.fine > st.posti[3].mani[0].carte[1].t, 'la fase finisce dopo l’ultima carta')

avanza(st, st.fine - now)
uguale(st.fase, 'turno', 'tocca ai giocatori')
uguale(st.turno.posto, 3, 'anna ha blackjack: tocca a bruno')
assert.ok(M.gioca(st, anna.id, 'carta', now, rnd).error, 'non è il turno di anna')
assert.ok(M.gioca(st, bruno.id, 'dividi', now, rnd).error, '10 e 6 non si dividono')
ok(M.gioca(st, bruno.id, 'raddoppia', now, rnd).ok, 'bruno raddoppia su 16 (coraggioso)')
uguale(st.posti[3].mani[0].puntata, 120, 'puntata raddoppiata')
uguale(st.posti[3].mani[0].carte.length, 3, 'una carta sola dopo il raddoppio')
uguale(st.fase, 'banco', 'finiti i turni, gioca il banco')
uguale(M.valore(st.banco.carte).tot, 17, 'il banco si ferma a 17 (9 + 8)')
const bancoEsitoDelta = M.valore(st.posti[3].mani[0].carte).tot
avanza(st, st.fine - now)
uguale(st.fase, 'esito', 'risultati')
uguale(st.posti[0].mani[0].esito, 'bj', 'blackjack vince')
uguale(st.posti[0].mani[0].delta, 150, 'paga 3 a 2')
const attesoBruno = bancoEsitoDelta > 21 ? 'perde' : bancoEsitoDelta > 17 ? 'vince' : bancoEsitoDelta === 17 ? 'pari' : 'perde'
uguale(st.posti[3].mani[0].esito, attesoBruno, 'esito di bruno coerente col punteggio')
const sommaDelta = st.posti.filter(Boolean).flatMap((p) => p.mani).reduce((s, m) => s + m.delta, 0)
uguale(totale(st), 2300 + sommaDelta, 'i conti tornano')
uguale(st.storico.length, 1, 'la mano è in archivio')
uguale(st.storico[0].banco, 17, 'col punteggio del banco')

avanza(st, st.fine - now)
uguale(st.fase, 'puntate', 'con gente seduta si riapre la finestra')
uguale(st.posti[0].mani.length, 0, 'tavolo sgombro')
uguale(st.posti[0].ultima, 100, 'si ricorda l’ultima puntata')

// ── chi non risponde sta, due volte e si alza ───────────────────────────────
const prima = totale(st)
M.punta(st, anna.id, 10, now)
M.punta(st, bruno.id, 10, now)
M.punta(st, carla.id, 10, now)
prepara(st, '5c', '5q', '5f', '7p', '9c', '9q', '9f', '2c', '2q', '2f')
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
uguale(st.fase, 'turno', 'tocca ad anna')
uguale(st.turno.posto, 0, 'anna per prima')
avanza(st, st.config.tDecisione)
uguale(st.turno.posto, 1, 'anna non risponde: passa a carla')
uguale(st.posti[0].mani[0].stato, 'stai', 'anna sta per forza')
uguale(st.posti[0].assente, 1, 'una assenza')
ok(M.gioca(st, carla.id, 'stai', now, rnd).ok, 'carla sta')
ok(M.gioca(st, bruno.id, 'carta', now, rnd).ok, 'bruno chiede carta')
uguale(st.posti[3].mani[0].carte.length, 3, 'carta arrivata')
ok(st.posti[3].mani[0].carte[2].t > now, 'la carta compare dopo un attimo')
avanza(st, 1000)
ok(M.gioca(st, bruno.id, 'stai', now, rnd).ok, 'bruno sta')
avanza(st, 20000)
uguale(st.fase, 'esito', 'un tick in ritardo non salta la pausa dei risultati')
avanza(st, st.fine - now)
uguale(st.fase, 'puntate', 'mano chiusa')
ok(totale(st) >= prima - 30, 'nessuno può perdere più della puntata')

M.punta(st, anna.id, 10, now)
M.punta(st, bruno.id, 10, now)
M.punta(st, carla.id, 10, now)
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
if (st.fase === 'turno' && st.turno.posto === 0) {
  avanza(st, st.config.tDecisione)
  uguale(st.posti[0].assente, 2, 'seconda assenza di fila')
}
while (st.fase !== 'puntate' && st.fase !== 'attesa') {
  if (st.fase === 'turno') {
    const p = st.posti[st.turno.posto]
    M.gioca(st, p.id, 'stai', now, rnd)
  } else avanza(st, Math.max(1, st.fine - now))
}
if (st.posti[0] === null) ok(true, 'anna addormentata: posto libero')
else ok(st.posti[0].assente < 2, 'anna aveva blackjack e non ha dovuto rispondere')
ok(anna.posto === null || st.posti[anna.posto].id === anna.id, 'posto coerente')

// ── divisione ────────────────────────────────────────────────────────────────
for (const g of [anna, bruno, carla]) if (g.posto === null) M.siedi(st, g.id, now)
M.ammin(st, 'imposta', { chi: 'anna', quanti: 1000 }, now, rnd)
M.ammin(st, 'imposta', { chi: 'bruno', quanti: 1000 }, now, rnd)
M.ammin(st, 'imposta', { chi: 'carla', quanti: 1000 }, now, rnd)
for (const p of st.posti) if (p) p.assente = 0
if (st.fase === 'attesa') M.punta(st, anna.id, 100, now)
else M.punta(st, anna.id, 100, now)
M.salta(st, bruno.id, now)
M.salta(st, carla.id, now)
const posti = st.posti.map((p) => p && p.id)
const ia = posti.indexOf(anna.id)
// anna 8♠ 8♥, banco 6♣; poi per le mani divise: 3♦ e 10♠; poi il banco pesca 10♦ (16) e 5♣ (21)
prepara(st, '8p', '6f', '8c', '3q', '10p', '10q', '5f')
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
uguale(st.turno.posto, ia, 'tocca ad anna')
ok(M.puoDividere(st, st.giocatori[anna.id], st.posti[ia], st.posti[ia].mani[0]), 'coppia di otto')
ok(M.gioca(st, anna.id, 'dividi', now, rnd).ok, 'anna divide')
uguale(st.posti[ia].mani.length, 2, 'due mani')
uguale(st.posti[ia].mani[0].carte.map((c) => c.c).join(' '), '8p 3q', 'prima mano 8+3')
uguale(st.posti[ia].mani[1].carte.map((c) => c.c).join(' '), '8c 10p', 'seconda mano 8+10')
uguale(st.giocatori[anna.id].pzk, 800, 'seconda puntata uscita')
uguale(st.turno.mano, 0, 'si gioca la prima mano')
assert.ok(M.gioca(st, anna.id, 'dividi', now, rnd).error, 'si divide una volta sola')
ok(M.gioca(st, anna.id, 'stai', now, rnd).ok, 'sta sulla prima')
uguale(st.turno.mano, 1, 'poi la seconda')
ok(M.gioca(st, anna.id, 'stai', now, rnd).ok, 'sta sulla seconda')
uguale(st.fase, 'banco', 'banco')
uguale(st.banco.carte.map((c) => c.c).join(' '), '6f 10q 5f', 'il banco pesca fino a 21')
avanza(st, st.fine - now)
uguale(st.posti[ia].mani[0].esito, 'perde', '11 perde contro 21')
uguale(st.posti[ia].mani[1].esito, 'perde', '18 perde contro 21')
uguale(st.giocatori[anna.id].pzk, 800, 'persi 200')

// ── 21 dopo divisione non è blackjack, assi divisi una carta sola ──────────
avanza(st, st.fine - now)
M.punta(st, anna.id, 100, now)
M.salta(st, bruno.id, now)
M.salta(st, carla.id, now)
prepara(st, 'Ap', '9f', 'Ac', 'Kq', '5p', '10c')
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
ok(M.gioca(st, anna.id, 'dividi', now, rnd).ok, 'anna divide gli assi')
uguale(st.fase, 'banco', 'assi divisi: una carta e basta, gioca subito il banco')
uguale(st.posti[ia].mani[0].stato, 'stai', 'prima mano chiusa')
uguale(M.valore(st.posti[ia].mani[0].carte).tot, 21, 'asso + re = 21')
avanza(st, st.fine - now)
uguale(st.posti[ia].mani[0].esito, 'vince', '21 dopo divisione vince alla pari, non è blackjack')
uguale(st.posti[ia].mani[0].delta, 100, 'alla pari')
uguale(st.posti[ia].mani[1].esito, 'perde', '16 perde contro 19')

// ── banco sballa, banco morbido ─────────────────────────────────────────────
avanza(st, st.fine - now)
M.punta(st, anna.id, 100, now)
M.salta(st, bruno.id, now)
M.salta(st, carla.id, now)
prepara(st, '10p', '6c', '9f', 'Kc', '8q')
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
ok(M.gioca(st, anna.id, 'stai', now, rnd).ok, 'anna sta su 19')
avanza(st, st.fine - now)
uguale(st.storico[0].banco, 'sballa', 'il banco sballa con 6 + K + 8')
uguale(st.posti[ia].mani[0].esito, 'vince', 'anna vince')
avanza(st, st.fine - now)
M.punta(st, anna.id, 100, now)
M.salta(st, bruno.id, now)
M.salta(st, carla.id, now)
prepara(st, '10p', 'Ac', '8f', '6c')
avanza(st, st.config.tFretta)
avanza(st, st.fine - now)
M.gioca(st, anna.id, 'stai', now, rnd)
uguale(st.banco.carte.map((c) => c.c).join(' '), 'Ac 6c', 'il banco si ferma su 17 morbido')
avanza(st, st.fine - now)
uguale(st.posti[ia].mani[0].esito, 'vince', '18 batte 17')

// ── alzarsi, assenza, rimescolata ───────────────────────────────────────────
avanza(st, st.fine - now)
ok(M.alzati(st, bruno.id, now).ok, 'bruno si alza')
uguale(st.giocatori[bruno.id].posto, null, 'bruno in piedi')
st.giocatori[carla.id].visto = now - st.config.assenza - 1
avanza(st, 1)
uguale(st.giocatori[carla.id].posto, null, 'carla sparita: posto liberato')
uguale(st.posti.filter(Boolean).length, 1, 'resta anna')
st.sabot.length = 40
M.punta(st, anna.id, 10, now)
avanza(st, st.config.tFretta)
ok(st.sabot.length > 290, 'sabot rimescolato quando resta meno di un quarto')
ok(st.eventi.some((e) => e.testo.includes('rimescola')), 'con l’evento')
while (st.fase !== 'puntate' && st.fase !== 'attesa') {
  if (st.fase === 'turno') M.gioca(st, anna.id, 'stai', now, rnd)
  else avanza(st, Math.max(1, st.fine - now))
}
ok(M.alzati(st, anna.id, now).ok, 'anna si alza')
avanza(st, 1)
uguale(st.fase, 'attesa', 'tavolo vuoto: attesa')
uguale(st.fine, null, 'senza scadenze')

// ── vista pubblica e privata ────────────────────────────────────────────────
const pub = M.pubblico(st, now)
ok(!JSON.stringify(pub).includes('"tok"') && !JSON.stringify(pub).includes(anna.tok), 'nessun codice in pubblico')
ok(!Array.isArray(pub.sabot), 'il sabot non si vede, solo quante carte restano')
uguale(pub.giocatori.length, 3, 'tre giocatori')
const priv = M.privato(st)
ok(priv.giocatori.every((g) => g.tok), 'in privato i codici ci sono')
ok(priv.registro.length > 3, 'il registro di pzkko')
ok(M.ammin(st, 'nuovo', { nome: 'dario', quanti: 250 }, now, rnd).io.pzk === 250, 'pzkko registra un amico con i $pzk')
ok(M.ammin(st, 'elimina', { chi: 'dario' }, now, rnd).ok, 'e lo cancella')
ok(!M.trova(st, 'dario'), 'cancellato davvero')

// ── una partita lunga a caso: i conti tornano sempre ───────────────────────
const st2 = M.nuovoStato(now, rnd)
const gente = ['uno', 'due', 'tre', 'quattro', 'cinque'].map((n) => M.entra(st2, { nome: n }, now, rnd).io)
for (const g of gente) {
  M.ammin(st2, 'imposta', { chi: g.nome, quanti: 500 }, now, rnd)
  M.siedi(st2, g.id, now)
}
assert.ok(M.entra(st2, { nome: 'sei' }, now, rnd).ok, 'il sesto entra…')
assert.ok(M.siedi(st2, M.trova(st2, 'sei').id, now).error, '…ma non si siede: tavolo pieno')
let mani = 0
let regalati = 0
for (let passo = 0; passo < 4000 && mani < 60; passo++) {
  // chi è al verde riceve altri 500 da pzkko, così il tavolo non si ferma
  for (const g of gente) {
    if (g.pzk >= 5 || (st2.fase !== 'attesa' && st2.fase !== 'puntate')) continue
    M.ammin(st2, 'dai', { chi: g.id, quanti: 500 }, now, rnd)
    regalati += 500
  }
  const prima = totale(st2) + puntate(st2)
  if (st2.fase === 'attesa' || st2.fase === 'puntate') {
    for (const g of gente) {
      if (g.posto === null) continue
      const p = st2.posti[g.posto]
      if (p.puntata || p.salta) continue
      const n = Math.min(g.pzk, [5, 10, 25, 50][Math.floor(rnd() * 4)])
      if (n >= 5) M.punta(st2, g.id, n, now)
      else M.salta(st2, g.id, now)
    }
  } else if (st2.fase === 'turno') {
    const p = st2.posti[st2.turno.posto]
    const g = st2.giocatori[p.id]
    const m = p.mani[st2.turno.mano]
    const v = M.valore(m.carte).tot
    let mossa = v < 12 ? 'carta' : v < 17 && rnd() < 0.6 ? 'carta' : 'stai'
    if (M.puoDividere(st2, g, p, m) && rnd() < 0.5) mossa = 'dividi'
    else if (M.puoRaddoppiare(st2, g, p, m) && (v === 10 || v === 11)) mossa = 'raddoppia'
    const r = M.gioca(st2, g.id, mossa, now, rnd)
    assert.ok(r.ok, `mossa ${mossa} rifiutata: ${r.error}`)
  }
  for (const g of gente) g.visto = now
  if (st2.fase === 'esito') mani++
  const faseP = st2.fase
  now += st2.fine !== null ? Math.max(1, st2.fine - now) : 1000
  M.avanza(st2, now, rnd)
  for (const g of gente) g.visto = now
  const dopo = totale(st2) + puntate(st2)
  const esiti = st2.fase === 'esito' && faseP !== 'esito' ? st2.posti.filter(Boolean).flatMap((p) => p.mani).reduce((s, m) => s + (m.delta || 0), 0) : 0
  assert.equal(dopo, prima + esiti, `i $pzk non spariscono (passo ${passo}, fase ${faseP} → ${st2.fase})`)
  for (const g of gente) assert.ok(g.pzk >= 0, 'mai sotto zero')
}
ok(mani >= 60, `giocate ${mani} mani di fila`)
ok(st2.storico.length === 10, 'lo storico tiene le ultime 10')
ok(st2.eventi.length <= 30, 'gli eventi non crescono all’infinito')
const stat = gente.reduce((s, g) => s + g.stat.mani, 0)
ok(stat > 60, 'le statistiche contano le mani')
uguale(
  gente.reduce((s, g) => s + g.stat.netto, 0),
  totale(st2) - 2500 - regalati,
  'il netto delle statistiche è la differenza di cassa'
)

console.log(`ok: ${prove} controlli passati, ${mani} mani a caso senza un $pzk fuori posto`)
