#!/usr/bin/env node
// Le prove dei lotti numerati del wallet (29.10 notte, api/wallet.mjs, «I LOTTI NUMERATI»; games/pzk.js): il wallet vero, con
// l'archivio in memoria (niente server dei dati, niente rete), e richieste fatte come le fa il browser.
//   node tools/pzkko/prova-lotti.mjs   (dalla cartella albertopecchini.it)
// Cosa si prova: una vincita mandata due volte (una risposta persa, una pagina ricaricata) conta una volta; due dispositivi
// dello stesso conto non si cancellano; un lotto coi conti che non tornano, un gioco che rende troppo, un salto impossibile
// si scartano senza toccare il saldo; il libro dei conti e le classifiche tornano (vinti ai giochi ≤ guadagnati in tutto, se
// non si spende); la versione del conto cresce sempre; i browser col codice di prima (il saldo intero) vanno ancora.
process.env.PZKKO_STORE = 'memory'
delete process.env.PZKKO_SERVER_URL
const { default: handler } = await import('../../pzkko/api/wallet.mjs')
const { unisci } = await import('../../pzkko/api/_giocatori.mjs')

let fallite = 0, passate = 0
const ok = (cond, cosa) => { if (cond) passate++; else { fallite++; console.log(`  ✗ ${cosa}`) } }
let ip = 0
/** Una richiesta al wallet, come dal browser. → la risposta (JSON) */
const chiama = (body) => new Promise((fatto) => {
  const res = { statusCode: 0, setHeader() {}, end(b) { fatto({ status: this.statusCode, ...JSON.parse(b) }) } }
  handler({ method: 'POST', url: '/api/wallet/', headers: { 'x-forwarded-for': `10.0.0.${++ip % 250}` }, body }, res)
})
const voceDado = (puntato, tornato) => ({ 'g:dado': [puntato, tornato, 1, tornato > puntato ? 1 : 0, Math.max(0, tornato - puntato)] })

console.log('· un conto e il primo lotto')
const nome = 'prova' + Math.floor(Math.random() * 1e6)
const c = await chiama({ a: 'crea', nome, pin: '1234' })
ok(c.ok && c.token && Number.isFinite(c.conto.agg), 'il conto nasce, con la versione')
const tok = c.token, base = c.conto.pzk // (la lumachina vive già il primo giorno: il saldo può non essere 1.000)
let r = await chiama({ a: 'salva', token: tok, disp: 'pagina-A-0001', code: [{ disp: 'pagina-A-0001', lotti: [{ n: 1, d: 500, persi: 0, v: voceDado(100, 600) }] }] })
ok(r.ok && r.conto.pzk === base + 500 && r.conto.disp['pagina-A-0001'] === 1, 'la vincita ai dadi entra: +500, lotto 1 visto')
const agg1 = r.conto.agg

console.log('· la stessa vincita mandata di nuovo (risposta persa, pagina ricaricata)')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'pagina-A-0001', lotti: [{ n: 1, d: 500, persi: 0, v: voceDado(100, 600) }] }] })
ok(r.conto.pzk === base + 500, 'non conta due volte')
r = await chiama({ a: 'stato', token: tok, code: [{ disp: 'pagina-A-0001', lotti: [{ n: 1, d: 500, persi: 0, v: voceDado(100, 600) }, { n: 2, d: -100, persi: 0, v: voceDado(100, 0) }] }] })
ok(r.conto.pzk === base + 400 && r.conto.disp['pagina-A-0001'] === 2, 'il vecchio no, il nuovo sì (−100)')
ok(r.conto.agg > agg1, 'la versione è cresciuta')

console.log('· due dispositivi insieme')
const [ra, rb] = await Promise.all([
  chiama({ a: 'salva', token: tok, code: [{ disp: 'pagina-A-0001', lotti: [{ n: 3, d: 50, persi: 0, v: voceDado(50, 100) }] }] }),
  chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 1, d: 30, persi: 0, v: { 'c:chat': [0, 30] } }] }] }),
])
r = await chiama({ a: 'stato', token: tok, code: [] })
ok(r.conto.pzk === base + 480, `il telefono non cancella il pc né il pc il telefono (${r.conto.pzk - base} su +480)`)
ok(ra.ok && rb.ok && r.conto.disp['telefono-B-01'] === 1, 'tutti e due visti')

console.log('· i lotti truccati')
const prima = r.conto.pzk
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 2, d: 5000, persi: 0, v: voceDado(100, 600) }] }] })
ok(r.conto.pzk === prima && r.scartati?.includes('telefono-B-01:2') && r.avviso, 'le voci non fanno la variazione: scartato, saldo fermo')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 3, d: 19900, persi: 0, v: voceDado(100, 20000) }] }] })
ok(r.conto.pzk === prima && r.scartati?.includes('telefono-B-01:3'), 'un giro di dado che rende 200 volte (il massimo è 181): scartato')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 4, d: 90000, persi: 0, v: { 'c:chat': [0, 90000] } }] }] })
ok(r.conto.pzk === prima && r.scartati?.includes('telefono-B-01:4'), '90.000 di colpo: scartato')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 5, d: 10, persi: 0, v: { 'g:../../x': [0, 10] } }] }] })
ok(r.conto.pzk === prima && r.scartati?.includes('telefono-B-01:5'), 'una voce col nome strano: scartato')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'telefono-B-01', lotti: [{ n: 6, d: -40, persi: 40, v: {} }] }] })
ok(r.conto.pzk === prima - 40 && !r.scartati, 'dopo gli scartati il dispositivo va avanti (una morte: −40)')

console.log('· il libro dei conti e le classifiche')
const L = r.conto.libro
ok(L.g?.dado?.[0] === 3 && L.g.dado[1] === 2 && L.g.dado[2] === 250 && L.g.dado[3] === 700, `i dadi: 3 mani, 2 vinte, 250 puntati, 700 tornati (${JSON.stringify(L.g?.dado)})`)
ok(L.lav === 30 && L.mor === 40, 'il lavoro (30) e le morti (40)')
const righe = unisci({ v: 1, g: {}, notizie: [] }, [{ id: 'x', ind: '123456', nome, creato: 1, pzk: r.conto.pzk, eur: 0, libro: L }])
const s = righe[0].s
ok(s.vinti === 450 && s.persi === 0, `vinti ai giochi = tornato − puntato = 450 (${s.vinti})`)
// (la lumachina sposta mezzi $pzk, la classifica arrotonda all'unità)
ok(s.guadagnati === Math.round(450 + 30 - 40 + (L.lum ?? 0)), `guadagnati in tutto = giochi + lavoro − morti ± lumachina (${s.guadagnati}; il libro ${JSON.stringify(L)})`)
ok(righe[0].cn.guadagnati >= righe[0].cn.giochi + (L.lum ?? 0) - 40, 'senza spese, guadagnati in tutto non è mai sotto i giochi (meno morti e lumachina)')

console.log('· il browser col codice di prima')
r = await chiama({ a: 'salva', token: tok, pzk: prima - 40 + 100, lg: r.conto.lumaca?.g ?? null, es: r.conto.es })
ok(r.ok && r.conto.pzk === prima + 60, 'il saldo intero vale ancora (+100)')

// (31.10) i bug trovati nel controllo della banca
console.log('· la cassa non riceve soldi che non esistono')
const leggi = () => new Promise((fatto) => {
  const res = { statusCode: 0, setHeader() {}, end(b) { fatto(JSON.parse(b)) } }
  handler({ method: 'GET', url: '/api/wallet/', headers: {} }, res)
})
const x = await chiama({ a: 'crea', nome: 'secco' + Math.floor(Math.random() * 1e6), pin: '1234' })
const cassa0 = (await leggi()).banca, saldoX = x.conto.pzk
r = await chiama({ a: 'salva', token: x.token, code: [{ disp: 'pagina-X-0001', lotti: [{ n: 1, d: -1e8, persi: 0, v: { 'k:shop': [1e8, 0] } }] }] })
const cassa1 = (await leggi()).banca
ok(r.ok && r.conto.pzk === 0, 'il saldo si ferma a 0')
ok(cassa1 - cassa0 === saldoX, `alla cassa va solo quello che c'era (${saldoX}), non 100 milioni (${cassa1 - cassa0})`)

console.log('· i nomi che sono anche proprietà di Object')
const ctor = await chiama({ a: 'crea', nome: 'constructor', pin: '1234' })
ok(!ctor.ok || /^pzk\d{6}$/.test(ctor.conto.ind), `«constructor» ha un indirizzo vero (${ctor.conto?.ind ?? ctor.errore})`)
r = await chiama({ a: 'trova', token: tok, quale: 'constructor', code: [] })
ok(!r.ok && r.errore === 'quale banconota?', 'la banconota «constructor» non esiste')
r = await chiama({ a: 'stato', token: tok, code: [] })
ok(Number.isFinite(r.conto.pzk), 'il saldo resta un numero')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: '__proto__', lotti: [{ n: 1, d: 10, persi: 0, v: { 'c:chat': [0, 10] } }] }] })
const s1 = r.conto.pzk
r = await chiama({ a: 'salva', token: tok, code: [{ disp: '__proto__', lotti: [{ n: 1, d: 10, persi: 0, v: { 'c:chat': [0, 10] } }] }] })
ok(r.conto.pzk === s1, 'il dispositivo «__proto__» non si applica (né una volta né due)')
r = await chiama({ a: 'salva', token: tok, code: [{ disp: 'pagina-C-0001', lotti: [{ n: 1, d: 50, persi: 0, v: { 'g:constructor': [50, 100, 1, 1, 50] } }] }] })
ok(r.ok && r.conto.libro.g.constructor?.every(Number.isFinite), `il gioco «constructor» ha un libro di numeri (${JSON.stringify(r.conto.libro.g.constructor)})`)

// (31.10) le vincite vere che il server scartava: il tetto unico di 50 volte e il limite di tempo anche sulle vincite
console.log('· le vincite grosse vere passano, i puntati inventati no')
const y = await chiama({ a: 'crea', nome: 'grosso' + Math.floor(Math.random() * 1e6), pin: '1234' })
const y0 = y.conto.pzk
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 1, d: 1500, persi: 0, v: voceDado(10, 1510) }] }] })
ok(r.ok && r.conto.pzk === y0 + 1500 && !r.scartati, `la tripla secca del dado (151 volte) entra (${r.avviso ?? 'ok'})`)
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 2, d: 35000, persi: 0, v: { 'g:roulette': [1000, 36000, 1, 1, 35000] } }] }] })
ok(r.ok && r.conto.pzk === y0 + 36500 && !r.scartati, `1.000 sul numero giusto subito dopo un altro giro: +35.000 (${r.avviso ?? 'ok'})`)
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 3, d: 30000, persi: 0, v: { 'g:mine': [1000, 31000, 1, 1, 30000] } }] }] })
ok(r.ok && r.conto.pzk === y0 + 66500 && !r.scartati, `le mine a 31 volte entrano (${r.avviso ?? 'ok'})`)
const y1 = r.conto.pzk
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 4, d: 1e6, persi: 0, v: { 'g:roulette': [1e6, 2e6, 1, 1, 1e6] } }] }] })
ok(r.conto.pzk === y1 && r.scartati?.includes('pagina-Y-0001:4') && /più di quanto avevi/.test(r.avviso), `puntato più del saldo: scartato (${r.avviso})`)
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 5, d: 1_499_000, persi: 0, v: { 'g:mine': [1000, 1_500_000, 1, 1, 1_499_000] } }] }] })
ok(r.conto.pzk === y1 && r.scartati?.includes('pagina-Y-0001:5'), 'le mine oltre il tetto di 1.000.000: scartato')
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 6, d: 3500, persi: 0, v: { 'g:roulette': [100, 3600, 1, 1, 3500] } }] }] })
ok(r.conto.pzk === y1 + 3500 && !r.scartati, 'la roulette a 36 volte entra')
r = await chiama({ a: 'salva', token: y.token, code: [{ disp: 'pagina-Y-0001', lotti: [{ n: 7, d: 5900, persi: 0, v: { 'g:roulette': [100, 6000, 1, 1, 5900] } }] }] })
ok(r.conto.pzk === y1 + 3500 && r.scartati?.includes('pagina-Y-0001:7'), 'la roulette a 60 volte: scartato')

console.log('· il cambio')
r = await chiama({ a: 'stato', token: tok, code: [] })
const p0 = r.conto.pzk, e0 = r.conto.eur, t0 = r.t
r = await chiama({ a: 'converti', token: tok, da: 'pzk', quanto: 100, t: t0, code: [] })
ok(r.ok, `100 $pzk in EUR€ (${r.errore ?? r.fatto?.eur})`)
r = await chiama({ a: 'converti', token: tok, da: 'eur', quanto: r.conto.eur, t: t0, code: [] })
ok(r.ok && r.conto.pzk <= p0 && r.conto.pzk + r.conto.eur * 1e6 >= p0 - 1, `andata e ritorno non fanno guadagnare (${p0} → ${r.conto.pzk} $pzk, ${r.conto.eur} EUR€)`)
r = await chiama({ a: 'converti', token: tok, da: 'pzk', quanto: 0.5, t: t0, code: [] })
const eMezzo = r.conto.eur
for (let i = 0; i < 6; i++) {
  r = await chiama({ a: 'converti', token: tok, da: 'eur', quanto: r.conto.eur, t: t0, code: [] })
  if (r.ok) r = await chiama({ a: 'converti', token: tok, da: 'pzk', quanto: 0.5, t: t0, code: [] })
}
ok(r.conto.eur <= eMezzo + 1e-9 && r.conto.pzk <= p0, `i giri di mezzo $pzk non creano EUR€ (${eMezzo} → ${r.conto.eur})`)

console.log(fallite ? `\n${fallite} prove fallite, ${passate} passate` : `\ntutte le ${passate} prove passate`)
process.exit(fallite ? 1 : 0)
