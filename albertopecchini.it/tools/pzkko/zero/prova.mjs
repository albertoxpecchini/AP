#!/usr/bin/env node
// La prova del cercapersone zero (29.10): apre la home in Chromium con uno zaino finto (e un conto finto, così
// pzk os mostra la home e non la porta del conto), tocca il tasto sul muro e fotografa il volo, lo schermo acceso, il cavo
// che entra, i tasti e la chiusura. Le foto finiscono in tools/pzkko/lavoro/zero/prova-*.png: si guardano.
//
//   node tools/pzkko/zero/prova.mjs                 computer, 1440 × 900
//   node tools/pzkko/zero/prova.mjs --telefono      390 × 844 (lo schermo a tutta finestra)
//   node tools/pzkko/zero/prova.mjs --larga         1920 × 1080
//   node tools/pzkko/zero/prova.mjs --app=chat      dopo l'apertura apre quell'app e la COLLAUDA (tutti i tasti, l'lcd
//                                                  salvato a ogni passo, angoli, margini, glifi, errori; vedi REGOLE.md)
//   … --suoni                                      coi suoni accesi: il collaudo vuole anche il bip a ogni tasto
//   … --server-finto --economia [--lavaggio=gira|pronto]   sporchi, lavatrice e decifratore installati, wallet nello zaino
//   … --tasti=ok,aspetta@3000,…                    aspetta@<ms>: fermo senza tasti (il quiz che va avanti da solo)
// Serve puppeteer-core in tools/catture e un browser (tools/pzkko/browser.mjs). Niente server vero: il wallet e lo zaino
// restano nel browser (le richieste alle api falliscono, e il sito sta in piedi lo stesso).
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const LAVORO = join(QUI, '../lavoro/zero')
const telefono = process.argv.includes('--telefono'), larga = process.argv.includes('--larga'), soloMuro = process.argv.includes('--muro') // --muro: solo il tasto sul muro, a 4× (per vedere se lo schermo sta dritto)
const app = (process.argv.find((a) => a.startsWith('--app=')) ?? '').slice(6)
const misura = (process.argv.find((a) => a.startsWith('--misura=')) ?? '').slice(9).split('x').map(Number) // --misura=3440x1440: una finestra qualsiasi
const peggiori = process.argv.includes('--peggiori') // i dati peggiori (REGOLE.md 4.2): nome di 20 lettere, motto di 60, quasi un miliardo
// --turni (6.11, Bighurra: «il lavoro è un po' buggato, non vedo cosa devo replicare»): i tredici minigiochi del turno di
// lavoro (chat/minigiochi.js), uno per mestiere, giocati COI SEI TASTI contro LA BANCA VERA in memoria (--banca). A ogni
// passo la foto dell'lcd (prova-turno-<gioco>-<n>-<cosa>.png) e i controlli del collaudo; alla fine la banca deve aver
// pagato il turno intero. --turni=icona,ordine: solo quelli. --rider è il turno del rider (--turni=strada): due svolte con
// le frecce e due col clic del mouse. --sbaglia: nei giochi a una scelta (icona, colori, quiz) si preme una risposta sbagliata,
// e deve finire in «turno storto» con la risposta giusta detta per nome. --scade: non si risponde, e allo scadere il turno
// si chiude lo stesso (la briciola)
const GIOCHI_TURNO = { strada: 'rider', memoria: 'cameriere', ordine: 'barista', colori: 'bidello', riscrivi: 'salumiere', icona: 'meccanico', veloce: 'streamer', contrario: 'sviluppatore', conti: 'prof', anagramma: 'influencer', quiz: 'avvocato', calcio: 'sindaco', nastro: 'spazzino' }
const turniArg = process.argv.find((a) => a === '--turni' || a.startsWith('--turni='))
const turni = process.argv.includes('--rider') ? ['strada'] : turniArg ? (turniArg.split('=')[1]?.split(',').filter((g) => GIOCHI_TURNO[g]) ?? Object.keys(GIOCHI_TURNO)) : []
// --banca: /api/wallet, /api/borsa, /api/giocatori e /__dev/accesso li serve la banca vera (C:\pzkko-server\banca, o
// PZKKO_BANCA) coi file IN MEMORIA, come tools/dev.mjs: i dati veri non si toccano. La pagina entra da sola col conto pzkko
// (games/pzk.js, in locale). `metti` cambia il conto a mano, per preparare una prova; `rnd` è il caso della banca.
// --giocate (con --banca --app=profilo): nel libro del conto le giocate di Bighurra del 4.11 (un blackjack vinto nella chat,
// tre slot perse) e qualche mano ai giochi grandi, per vedere la riga «nella chat» della pagina dei giochi
const conBanca = process.argv.includes('--banca') || turni.length > 0
let bancaVera = null
if (conBanca) {
  const dir = process.env.PZKKO_BANCA || 'C:\\pzkko-server\\banca'
  const u = (f) => new URL(`file:///${join(dir, f).replace(/\\/g, '/')}`).href
  process.env.PZKKO_BANCA_SEGRETO ||= 'pzkko-banca-nel-collaudo-' + 'x'.repeat(24)
  const b = await import(u('index.mjs'))
  await b.collega(null, {})
  const [w, arch, conti, motore] = await Promise.all([import(u('wallet.mjs')), import(u('archivio.mjs')), import(u('conti.mjs')), import(u('motore.mjs'))])
  if (!arch.inMemoria()) throw new Error('la banca non è in memoria: mi fermo, i dati veri non si toccano')
  const store = () => arch.archivio(conti.PATH, conti.vuoto)
  bancaVera = {
    gestisci: b.gestisci, accesso: () => w.accessoLocale('pzkko'), rnd: motore.rnd,
    conto: async () => (await (await store()).read()).db.conti.find((c) => c.nome === 'pzkko') ?? null,
    metti: async (fn) => arch.aggiorna(await store(), (db) => { const c = db.conti.find((x) => x.nome === 'pzkko'); c.zaino ??= { v: 1, t: 0, xp: 0, mestiere: null, turni: 0, oggetti: {}, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] }; fn(c, db); c.agg = (c.agg ?? 0) + 1 }),
  }
}
const senzaConto = process.argv.includes('--senzaconto') // nessun conto: il cercapersone chiuso, l'account
const finto = process.argv.includes('--server-finto') // un server del wallet finto (qui sotto): entra (PIN 1234), crea, converti, invia… // un turno da rider: la consegna con le frecce e coi clic del mouse
const guidaPrima = process.argv.includes('--guida') // la guida del primo accesso all'apertura (con --senzaconto: il giro di chi arriva)
const suoni = process.argv.includes('--suoni') // i suoni accesi (pzkko-suono = si): il collaudo vuole un bip a ogni tasto
const ora = process.argv.includes('--giorno') ? '12:00' : '21:00&notte=1' // di notte (lampioni, l'auto) o di giorno (il sole)
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' }
const ORA = Date.now()
let contoFinto = { nome: 'prova', ind: 'pzk000001', indCambiato: false, creato: ORA - 3 * 864e5, pzk: 52340, puliti: 52340, sporchi: 0, eur: 12.5, ig: false, invii: true, inviiDa: ORA - 864e5, agg: 1,
  mosse: [{ t: ORA - 3 * 864e5, tipo: 'nato', n: 1000 }, { t: ORA - 2 * 864e5, tipo: 'ricevuto', n: 500, nome: 'mario', da: 'pzk111111' }, { t: ORA - 864e5, tipo: 'in-eur', n: 1000, eur: 12.5, cambio: 0.0125 }, { t: ORA - 36e5 * 5, tipo: 'sussidio', n: 100 }, { t: ORA - 36e5, tipo: 'trovato', n: 25 }] }
const TASSO = 0.0123
const rapina = (process.argv.find((a) => a.startsWith('--rapina=')) ?? '').slice(9) // presi, galera
let colpoFinto = null, cassaFinta = 812345, giriColpo = 0
if (rapina === 'galera') contoFinto.galera = ORA + 4.5 * 36e5
// l'economia finta (1.11, la lavatrice e il decifratore): --economia dà 73.500 sporchi di una rapina, la lavatrice e il
// decifratore installati, due wallet e una chiavetta nello zaino; --lavaggio=gira (mancano sette minuti) o =pronto (finito:
// la banca finta lo pulisce alla seconda richiesta di stato, cioè a «ritira», così si vede la lavatrice pronta)
// (--economia=vuota: niente sporchi; =poveri: 73.500 sporchi ma solo 1.200 puliti, meno della commissione)
const ecoArg = process.argv.find((a) => a.startsWith('--economia')), economia = !!ecoArg, ecoTipo = ecoArg?.split('=')[1] ?? '', lavaggio = (process.argv.find((a) => a.startsWith('--lavaggio=')) ?? '').slice(11)
if (economia) {
  const sp = ecoTipo === 'vuota' ? 0 : 73500
  if (ecoTipo === 'poveri') contoFinto.pzk = 1200
  contoFinto.pzk += sp; contoFinto.sporchi = sp
  contoFinto.zaino = { v: 1, t: 0, xp: 300, mestiere: null, turni: 0, oggetti: { canna: 1, 'wallet-pzk': 2, chiavetta: 1 }, app: { lavatrice: 1, decifratore: 1 }, attese: {}, effetti: {}, serie: {}, stat: {} }
  contoFinto.mosse.push({ t: ORA - 2 * 36e5, tipo: 'rapina', n: 73500 })
  contoFinto.decifrati = 0
}
if (lavaggio) contoFinto.lavaggio = { n: 50000, fino: lavaggio === 'pronto' ? ORA - 6e4 : ORA + 7 * 6e4 }
let stati = 0, tavoloFinto = null, quizFinto = null
// i giochini finti del decifratore: la risposta giusta è sempre la prima delle scelte (così OK la dà, → e OK sbagliano)
const PROVE = [{ k: 'cesare', codice: 'NJODJP', giusta: 'MINCIO', scelte: ['MINCIO', 'MANTOVA', 'ZUCCA', 'SARACINESCA'] }, { k: 'binario', codice: '1011', giusta: '11', scelte: ['11', '12', '10', '13'] }, { k: 'sequenza', codice: '3 · 7 · 11 · 15', giusta: '19', scelte: ['19', '20', '17', '23'] }, { k: 'specchio', codice: 'ACCUZ', giusta: 'ZUCCA', scelte: ['ZUCCA', 'NUTRIA', 'LUCCIO', 'GONZAGA'] }]
const vedeFinto = (t) => ({ tipo: t.tipo, i: t.i, errori: t.errori, prova: t.prove[t.i] && { k: t.prove[t.i].k, codice: t.prove[t.i].codice, scelte: t.prove[t.i].scelte } })
function walletFinto(body) {
  const ok = (extra = {}) => { contoFinto.agg++; contoFinto.puliti = contoFinto.pzk; return { ok: true, conto: contoFinto, tasso: TASSO, t: Date.now(), ...extra } }
  const a = body.a
  if (a === 'stato' && ++stati > 1 && contoFinto.lavaggio?.fino <= Date.now()) { const n = Math.min(contoFinto.lavaggio.n, contoFinto.sporchi ?? 0); contoFinto.sporchi -= n; contoFinto.mosse.push({ t: Date.now(), tipo: 'lavati', n }); delete contoFinto.lavaggio }
  if (a === 'lava') {
    if (contoFinto.lavaggio) return { ok: false, errore: 'la lavatrice gira già' }
    const n = Math.min(contoFinto.sporchi ?? 0, 50000, Number(body.quanto) > 0 ? Number(body.quanto) : Infinity)
    contoFinto.pzk -= 2000; contoFinto.lavaggio = { n, fino: Date.now() + 10 * 6e4 }; contoFinto.mosse.push({ t: Date.now(), tipo: 'lavatrice', n: 2000 })
    return ok({ fatto: { lavaggio: contoFinto.lavaggio } })
  }
  // (2.11) il quiz finto: tre domande, la giusta è sempre la prima (OK la dà, ↓ OK sbaglia)
  if (a === 'fai' && body.cosa === 'quiz.nuova') { quizFinto = { arg: body.args?.arg ?? null, n: 3, i: 0, giuste: 0, serie: 0, guadagnato: 0, xp: 0, pagate: 0, d: null }; return ok({ esito: { partita: quizFinto } }) }
  if (a === 'fai' && body.cosa === 'quiz.prossima') {
    if (!quizFinto) return { ok: false, errore: 'nessuna partita' }
    quizFinto.d = { q: ['qual è il fiume di Mantova?', 'quanto fa 7 per 8?', 'di che colore è il cercapersone zero, coi tasti arancioni e il corpo chiaro?'][quizFinto.i], risposte: [['il Mincio', 'il Po', "l'Oglio", 'il Tevere'], ['56', '54', '64', '48'], ['bianco', 'nero', 'verde', 'rosso']][quizFinto.i], diff: quizFinto.i + 1 }
    return ok({ esito: { partita: quizFinto } })
  }
  if (a === 'fai' && body.cosa === 'quiz.rispondi') {
    const q = quizFinto, giusta = body.args?.i === 0, premio = [25, 50, 100][q.i]
    q.i++; if (giusta) { q.giuste++; q.serie++; q.guadagnato += premio; q.xp += 5; q.pagate++ } else q.serie = 0
    return ok({ esito: { giusta, indiceGiusto: 0, premio, xp: giusta ? 5 : 1, pagato: giusta, serie: q.serie, nota: giusta ? null : `era ${q.d.risposte[0]}.`, partita: q, finita: q.i >= q.n } })
  }
  if (a === 'fai' && body.cosa === 'decifratore.apri') {
    const ogg = body.args?.tipo === 'chiavetta' ? 'chiavetta' : 'wallet-pzk'
    if (!(contoFinto.zaino?.oggetti?.[ogg] > 0)) return { ok: false, errore: 'non hai wallet da decifrare' }
    tavoloFinto = { tipo: body.args.tipo, prove: PROVE.slice(0, 3), i: 0, errori: 0 }
    return ok({ esito: vedeFinto(tavoloFinto) })
  }
  if (a === 'fai' && body.cosa === 'decifratore.risolvi') {
    const t = tavoloFinto
    if (!t) return { ok: false, errore: 'nessun codice da risolvere: apri un pezzo' }
    if (body.args?.risposta !== t.prove[t.i].giusta) {
      if (++t.errori > 2) { tavoloFinto = null; return ok({ esito: { giusta: false, bloccato: true } }) }
      t.prove[t.i] = PROVE[3]
      return ok({ esito: { giusta: false, ...vedeFinto(t) } })
    }
    if (++t.i < t.prove.length) return ok({ esito: { giusta: true, ...vedeFinto(t) } })
    t.risolto = t.tipo
    return ok({ esito: { giusta: true, risolto: true, tipo: t.tipo } })
  }
  if (a === 'decifra') {
    if (tavoloFinto?.risolto !== body.tipo) return { ok: false, errore: 'prima si risolve il codice' }
    const ogg = body.tipo === 'chiavetta' ? 'chiavetta' : 'wallet-pzk', n = body.tipo === 'chiavetta' ? 2750 : 830
    contoFinto.zaino.oggetti[ogg]--; contoFinto.zaino = { ...contoFinto.zaino, oggetti: { ...contoFinto.zaino.oggetti } }
    contoFinto.pzk += n; contoFinto.decifrati++; tavoloFinto = null; contoFinto.mosse.push({ t: Date.now(), tipo: 'decifrato', n })
    return ok({ fatto: { n, tipo: body.tipo } })
  }
  if (a === 'entra') return body.pin === '1234' ? ok({ token: 'finto' }) : { ok: false, errore: 'nome o PIN sbagliati' }
  if (a === 'crea') { contoFinto = { ...contoFinto, nome: body.nome, ind: 'pzk123456', creato: Date.now(), pzk: 1000, eur: 0, invii: false, inviiDa: Date.now() + 48 * 36e5, mosse: [{ t: Date.now(), tipo: 'nato', n: 1000 }] }; return ok({ token: 'finto' }) }
  if (a === 'converti') {
    const q = Number(body.quanto)
    if (body.da === 'pzk') { contoFinto.pzk -= q; contoFinto.eur = Math.round((contoFinto.eur + q * TASSO) * 100) / 100; contoFinto.mosse.push({ t: Date.now(), tipo: 'in-eur', n: q, eur: q * TASSO, cambio: TASSO }); return ok({ fatto: { da: 'pzk', n: q, eur: q * TASSO, cambio: TASSO } }) }
    const n = Math.round((q / TASSO) * 2) / 2
    contoFinto.eur = Math.round((contoFinto.eur - q) * 100) / 100; contoFinto.pzk += n; contoFinto.mosse.push({ t: Date.now(), tipo: 'in-pzk', n, eur: q, cambio: TASSO }); return ok({ fatto: { da: 'eur', n, eur: q, cambio: TASSO } })
  }
  if (a === 'invia') { const q = Number(body.quanto); contoFinto.pzk -= q; contoFinto.mosse.push({ t: Date.now(), tipo: 'inviato', n: q, nome: 'mario', a: body.ind }); return ok({ fatto: { a: body.ind, nome: 'mario', n: q } }) }
  // la rapina finta (--rapina=presi: il colpo va male; --rapina=galera: si parte in galera): apri, entra (un colpo di mario),
  // esci, vai, e lo stato, che alla seconda volta fa entrare mario nella banda; la cauzione
  if (a === 'colpo') {
    const op = body.op, ora = Date.now()
    if (op === 'apri') colpoFinto = { codice: 'KRTZ', membri: [{ nome: contoFinto.nome, ind: contoFinto.ind }], stato: 'aperto', scade: ora + 15 * 6e4, esito: null, capo: true, io: true }
    else if (op === 'entra') colpoFinto = body.codice === 'MARI' ? { codice: 'MARI', membri: [{ nome: 'mario', ind: 'pzk111111' }, { nome: contoFinto.nome, ind: contoFinto.ind }], stato: 'aperto', scade: ora + 9 * 6e4, esito: null, capo: false, io: true } : null
    else if (op === 'esci') colpoFinto = null
    else if (op === 'vai') {
      const n = colpoFinto.membri.length
      if (rapina === 'presi') { const m = Math.min(contoFinto.pzk * 0.2, 5000); contoFinto.pzk -= m; contoFinto.galera = ora + 6 * 36e5; colpoFinto = { ...colpoFinto, stato: 'fatto', esito: { ok: false, ore: 6, multa: m } } }
      else { const q = Math.min((cassaFinta * (0.03 + 0.01 * n)) / n, 15000); cassaFinta -= q * n; contoFinto.pzk += q; contoFinto.sporchi = (contoFinto.sporchi ?? 0) + q; colpoFinto = { ...colpoFinto, stato: 'fatto', esito: { ok: true, quota: q, bottino: q * n } } }
    } else if (op === 'stato' && colpoFinto?.stato === 'aperto' && colpoFinto.membri.length === 1 && (giriColpo = (giriColpo ?? 0) + 1) > 1) colpoFinto.membri.push({ nome: 'mario', ind: 'pzk111111' })
    if (op === 'entra' && !colpoFinto) return { ok: false, errore: 'nessun colpo aperto con questo codice' }
    const r = ok({ colpo: colpoFinto, cassa: cassaFinta })
    contoFinto.puliti = contoFinto.pzk - (contoFinto.sporchi ?? 0)
    return r
  }
  if (a === 'cauzione') { if (!(contoFinto.galera > Date.now())) return { ok: false, errore: 'non sei in galera' }; contoFinto.pzk -= 3000; delete contoFinto.galera; contoFinto.mosse.push({ t: Date.now(), tipo: 'cauzione', n: 3000 }); return ok({ fatto: { cauzione: 3000 } }) }
  if (a === 'pin') return body.vecchio === '1234' ? ok() : { ok: false, errore: 'il PIN di adesso è sbagliato' }
  if (a === 'indirizzo') { contoFinto.mosse.push({ t: Date.now(), tipo: 'indirizzo', da: contoFinto.ind, a: 'pzk' + body.nuovo }); contoFinto.ind = 'pzk' + body.nuovo; contoFinto.indCambiato = true; return ok() }
  if (a === 'fai') return { ok: false, errore: `«${body.cosa}» il server finto non lo fa` } // (2.11: prima un ok senza esito, e i comandi della chat si rompevano)
  return ok()
}
// il database dei giocatori finto (api/giocatori.mjs): dodici giocatori, le notizie di ogni tipo, il mio profilo coi rivali
const GIOCATORI = ['mario', 'giulia', 'Bartolomeo Pecchinix', 'nutria92', 'la sciura', 'Gonzaga IV', 'pino', 'ale', 'fede', 'zio tom', 'rana', 'lu'].map((nome, i) => ({
  pos: i + 1, ind: 'pzk' + String(100001 + i), nome, liv: 14 - i, titolo: ['il re del Mincio', 'pescatrice', 'collezionista', 'sindacalista', 'la più vecchia', 'nobile', 'pino', 'ale', 'fede', 'zio', 'rana', 'lu'][i], av: ['bot', 'nutria', 'av-gonzaga', 'nutria', 'av-nonna', 'av-gonzaga', 'bot-ride', 'piccione', 'rana', 'bot', 'rana', 'zucca'][i], mest: i % 3 ? 'rider' : 'pescatore',
}))
const profiloFinto = (g) => ({ ...g, pr: { av: g.av, col: 'blu', mot: g.pos === 3 ? 'chi va piano va sano e va lontano, ma chi va forte arriva prima' : '' }, xp: 60 * (g.liv - 1) ** 2 + 40, xpProssimo: 60 * g.liv ** 2, giocatori: GIOCATORI.length, gal: g.pos === 4 ? Date.now() + 36e5 : null, creato: Date.now() - (g.pos + 2) * 864e5, ult: Date.now() - g.pos * 6e5,
  s: { pescati: 120 - g.pos * 7, cacciati: 30, scavati: 12, quizGiusti: 44, quizTotali: 60, sfideFatte: 18, missioniFatte: 3, morti: 2, giri: 310 }, posizioni: { pzk: { pos: g.pos, valore: 90000 - g.pos * 5000 }, xp: { pos: g.pos + 1, valore: 9000 }, pescati: { pos: 2, valore: 120 } }, rari: g.pos === 1 ? ['carpa-oro', 'drago'] : [], pzk: 90000 - g.pos * 5000, sp: g.pos === 2 ? 12000 : 0, serie: 5 })
function giocatoriFinto(u, metodo) {
  const p = u.searchParams
  if (metodo === 'POST') return { ok: true, profilo: { ...profiloFinto({ ...GIOCATORI[6], nome: 'prova', ind: 'pzk000001' }) }, vicini: { io: 1800, su: { ...GIOCATORI[5], valore: 2100 }, giu: { ...GIOCATORI[7], valore: 1500 } } }
  if (p.has('top')) return { ok: true, top: GIOCATORI.map((g) => ({ ...g, valore: 90000 - g.pos * 5000 })), giocatori: 12 }
  if (p.has('cerca')) { const q = p.get('cerca').toLowerCase(); return { ok: true, trovati: GIOCATORI.filter((g) => g.nome.toLowerCase().includes(q) || g.ind.includes(q)) } }
  if (p.has('ind')) { const g = GIOCATORI.find((x) => x.ind === p.get('ind')); return g ? { ok: true, profilo: profiloFinto(g) } : { ok: false, errore: 'nessuno a questo indirizzo' } }
  if (p.has('stats')) return { ok: true, stats: { giocatori: 12, attivi24h: 7, attivi7g: 11, pzk: 812345, livelloMedio: 8.5, pescati: 1400, quizGiusti: 520, sfideFatte: 210, missioniFatte: 33 } }
  if (p.has('notizie')) { const t = Date.now(); return { ok: true, notizie: [['livello', 14], ['leggenda', 'drago'], ['vincita', 12500], ['mestiere', 'rider'], ['sfide', 30], ['missione', 3], ['quiz', 8], ['serie', 21], ['nuovo', null], ['rapina', { n: 3, bottino: 45000 }], ['retata', { n: 2 }], ['lumaca', { pct: -12.5, titolo: 'la grande alluvione del Mincio' }]].map(([tipo, dato], i) => ({ t: t - i * 7e5, nome: GIOCATORI[i % 12].nome, ind: GIOCATORI[i % 12].ind, tipo, dato })) } }
  return { ok: false, errore: 'richiesta sbagliata' }
}
const server = createServer(async (req, res) => {
  // (6.11) la banca vera in memoria (--banca, --turni): come tools/dev.mjs
  if (bancaVera) {
    const pathname = new URL(req.url, 'http://x').pathname
    if (pathname === '/__dev/accesso') { const d = await bancaVera.accesso(); res.writeHead(d.ok ? 200 : 404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify(d)) }
    const daBanca = /^\/api\/(wallet|borsa|giocatori)\/?$/.exec(pathname)?.[1]
    if (daBanca) {
      let corpo = ''
      if (req.method === 'POST') { const parti = []; for await (const p of req) parti.push(p); corpo = Buffer.concat(parti).toString('utf8') }
      const r = await bancaVera.gestisci(daBanca, { m: req.method === 'HEAD' ? 'GET' : req.method, q: new URL(req.url, 'http://x').search, ip: '127.0.0.1', ua: req.headers['user-agent'] ?? '', corpo })
      res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(r.corpo)
    }
  }
  if (finto && req.url.startsWith('/api/borsa')) { // la borsa finta: un'onda lenta con un po' di rumore
    res.setHeader('Content-Type', 'application/json')
    const da = new URL(req.url, 'http://x').searchParams.get('da') ?? '24h', ore = { '24h': 24, '7g': 168, '30g': 720, tutto: 1500 }[da] ?? 24, n = 80, ora = Date.now()
    const punti = Array.from({ length: n }, (_, i) => { const t = ora - (ore * 36e5 * (n - 1 - i)) / (n - 1); return [t, 0.0123 * (1 + 0.08 * Math.sin(i / 9) + 0.03 * Math.sin(i * 1.7) + i * 0.001)] })
    const v = punti.at(-1)[1]
    return res.end(JSON.stringify({ ok: true, tasso: v, inverso: 1 / v, t: ora, nata: ora - 40 * 864e5, var24: 0.0123, var7g: -0.034, var30g: 0.21, punti, cap: { pzk: 812345, conti: 12 } }))
  }
  if (finto && req.url.startsWith('/api/giocatori')) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(giocatoriFinto(new URL(req.url, 'http://x'), req.method))) }
  if (finto && req.url.startsWith('/api/wallet')) {
    res.setHeader('Content-Type', 'application/json')
    const u = new URL(req.url, 'http://x')
    if (req.method === 'GET') { const ind = u.searchParams.get('ind'); return res.end(JSON.stringify(ind === 'pzk999999' ? { ok: false, errore: 'nessun conto a questo indirizzo' } : { ok: true, conto: { nome: 'mario', ind } })) }
    let b = ''; for await (const x of req) b += x
    let body = {}; try { body = JSON.parse(b) } catch {}
    return res.end(JSON.stringify(walletFinto(body)))
  }
  let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
await mkdir(LAVORO, { recursive: true })
const puppeteer = browser.puppeteer()
// --software: il WebGL di SwiftShader (lento: un fotogramma al secondo, le foto arrivano dopo un minuto l'una); di serie si
// chiede la scheda video vera (ANGLE su Direct3D 11), che in headless su Windows di solito c'è
const software = process.argv.includes('--software')
const gpu = software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--use-angle=d3d11', '--enable-unsafe-swiftshader']
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', ...gpu] })
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  const page = await aperto.newPage()
  await page.setViewport(misura[1] ? { width: misura[0], height: misura[1], deviceScaleFactor: 1 } : telefono ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : larga ? { width: 1920, height: 1080, deviceScaleFactor: 1 } : soloMuro ? { width: 1440, height: 900, deviceScaleFactor: 4 } : { width: 1440, height: 900, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.log('  [errore]', e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn' || process.argv.includes('--debug')) console.log(`  [${m.type()}]`, m.text().slice(0, 200)) })
  page.on('response', (r) => { if (r.status() === 404) console.log('  [404]', r.url()) })
  await page.goto('about:blank')
  console.log('webgl:', await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return 'niente'; const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) }))
  // lo zaino (senza «zero»: dal 31.10 lo zero c'è per tutti) e il conto finto, prima che la pagina parta
  // (1.11) le app del pzkstore (la lavatrice, il decifratore) si collaudano installate: se no non sono nel menu e non si aprono
  await page.evaluateOnNewDocument((suoniAccesi, peggiori, senzaConto, daStore, conBanca) => {
    const zaino = { v: 1, t: 0, xp: peggiori ? 987654 : 300, ...(peggiori && { profilo: { av: 'av-gonzaga', avs: ['av-gonzaga'], col: 'blu', cor: 'pixel', mot: 'chi va piano va sano e va lontano, ma chi va forte arriva prima' } }), mestiere: null, turni: 0, oggetti: { canna: 1 }, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] }
    sessionStorage.setItem('pzkko-chat-sessione', JSON.stringify(zaino))
    localStorage.setItem('pzkko-chat', JSON.stringify({ ind: 'pzk000001', zaino, visto: 0 }))
    if (!senzaConto && !conBanca) localStorage.setItem('pzkko-wallet', JSON.stringify({ token: 'prova.prova', conto: { ind: 'pzk000001', nome: peggiori ? 'Bartolomeo Pecchinix' : 'prova', pzk: peggiori ? 987654321 : 52340, ...(peggiori && { creato: Date.UTC(2026, 9, 1), sporchi: 123456 }), ...(daStore && { zaino: { v: 1, t: 0, xp: 300, mestiere: null, turni: 0, oggetti: {}, app: { lavatrice: 1, decifratore: 1 }, attese: {}, effetti: {}, serie: {}, stat: {} } }), eur: 0, mosse: [], t: Date.now() }, tasso: 1, t: Date.now() }))
    localStorage.setItem('pzkko-benvenuto', JSON.stringify({ versione: 99 }))
    if (!location.search.includes('guida')) localStorage.setItem('pzkko-zero-guida', 'si')
    // i suoni: si contano gli oscillatori che nascono (ogni suono di suono/interfaccia.js ne fa almeno uno)
    localStorage.setItem('pzkko-suono', suoniAccesi ? 'si' : 'no')
    const AC = window.AudioContext
    if (AC) { const crea = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { if (/interfaccia.js/.test(new Error().stack ?? '')) window.__oscillatori = (window.__oscillatori ?? 0) + 1; return crea.call(this) } } // (solo i suoni di suono/interfaccia.js: la musica e la strada ne fanno di continuo)
  }, suoni, peggiori, senzaConto, ['lavatrice', 'decifratore'].includes(app), conBanca)

  // (--guida: come chi arriva per la prima volta, la guida all'apertura; con --app l'app non si apre da sola, la guida porta lì)
  await page.goto(`${base}/?muro=1&chat&ora=${ora}${guidaPrima ? '&guida' : ''}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('.chat-tasto.zero', { timeout: 30000 })
  await page.waitForSelector('.chat-tasto.zero.os', { timeout: 30000 }).catch(() => console.log('  (pzk os sul muro non è partito)'))
  await dorm(1500)
  const tasto = await page.$('.chat-tasto')
  await tasto.scrollIntoViewIfNeeded?.()
  const r = await tasto.boundingBox()
  await page.screenshot({ path: join(LAVORO, 'prova-muro.png'), clip: { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 40), width: r.width + 80, height: r.height + 80 } })
  console.log('tasto', JSON.stringify(r))
  if (soloMuro) { await tasto.screenshot({ path: join(LAVORO, 'prova-tasto.png') }); await page.evaluate(() => { document.querySelector('.chat-tasto .ct-lcd').style.visibility = 'hidden' }); await tasto.screenshot({ path: join(LAVORO, 'prova-tasto-nudo.png') }); console.log('prova-tasto.png e prova-tasto-nudo.png (4×)'); await aperto.close(); server.close(); process.exit(0) }
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
  const t0 = Date.now()
  if (process.argv.includes('--debug')) console.log('apri:', await page.evaluate(() => import('/telefono/telefono.js').then((t) => t.apri(null, { da: document.querySelector('.chat-tasto') })).then(() => 'ok', (e) => 'ERRORE ' + (e.stack || e))))
  else { await page.mouse.down(); await page.mouse.up() }
  await page.waitForFunction(() => document.querySelector('.tel.zero')?.open, { timeout: 30000 })
  // il volo: a metà strada (il modello è già in cache: parte subito)
  await page.waitForFunction(() => !document.querySelector('.tel.zero')?.classList.contains('zoom-nascosto') || document.querySelector('.z-tela')?.classList.contains('ombra') === false, { timeout: 30000 }).catch(() => {})
  await dorm(150)
  await page.screenshot({ path: join(LAVORO, 'prova-volo.png') })
  await page.waitForFunction(() => { const d = document.querySelector('.tel.zero'); return d?.open && !d.classList.contains('zoom') }, { timeout: 30000 })
  await page.mouse.move(Math.round(r.x * 0.3), Math.round(r.y * 0.4)) // (il mouse in alto a sinistra: il cercapersone s'inclina verso di lui)
  await dorm(450)
  console.log('aperto dopo', Date.now() - t0, 'ms')
  console.log('dialog:', await page.evaluate(() => document.querySelector('.tel')?.className))
  if (process.argv.includes('--sonda')) {
    console.log('fascia a x 26,5 (y → z della superficie, pezzo):', await page.evaluate(() => { const r = []; for (let y = 3; y >= -5.5; y -= 0.25) { const h = window.pzkkoZero.sonda([26.5, y, 60], [0, 0, -1]); r.push(y + ':' + (h ? h.p[2] + ' ' + h.nome : '-')) } return r.join('  ') }))
    console.log('testata (righe y 16→3, colonne z −12→−4, passo 0,25; # = la faccia a x≈76, . = dentro il buco):')
    console.log(await page.evaluate(() => { const r = []; for (let y = 16; y >= 3; y -= 0.25) { let s = y.toFixed(2).padStart(6) + ' '; for (let z = -12; z <= -4; z += 0.25) { const h = window.pzkkoZero.sonda([95, y, z], [-1, 0, 0]); s += !h ? ' ' : h.p[0] > 75.6 ? '#' : h.p[0] > 70 ? ':' : '.' } r.push(s) } return r.join(String.fromCharCode(10)) }))
  }
  if (process.argv.includes('--debug')) { console.log('scritta:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.scritta?.()))); await dorm(300); await page.screenshot({ path: join(LAVORO, 'prova-porta.png'), clip: { x: 1500, y: 380, width: 420, height: 420 } }); await page.screenshot({ path: join(LAVORO, 'prova-fascia.png'), clip: { x: 300, y: 700, width: 900, height: 220 } }); console.log('scritta +3:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.scritta?.(3)))); await dorm(300); await page.screenshot({ path: join(LAVORO, 'prova-fascia3.png'), clip: { x: 300, y: 700, width: 900, height: 220 } }); await page.evaluate(() => window.pzkkoZero?.scritta?.(-3)) }
  if (process.argv.includes('--debug')) { // il tasto OK premuto col mouse e tenuto: deve restare giù e scuro finché non si lascia
    const ok = await page.evaluate(() => window.pzkkoZero?.dove?.('ok'))
    if (ok) { await page.mouse.move(ok.x, ok.y); await page.mouse.down(); await dorm(400); await page.screenshot({ path: join(LAVORO, 'prova-ok-giu.png'), clip: { x: ok.x - 260, y: ok.y - 230, width: 560, height: 460 } }); await page.mouse.up(); await dorm(400); await page.screenshot({ path: join(LAVORO, 'prova-ok-su.png'), clip: { x: ok.x - 260, y: ok.y - 230, width: 560, height: 460 } }); console.log('ok premuto e lasciato:', JSON.stringify(ok)) }
  }
  // --croce (4.11, Alberto: «i tasti che premo danno comandi diversi da quel che hanno di nome»): i quattro bracci della
  // croce 3D presi col mouse. Ognuno deve stare dal suo lato sullo schermo E mandare a pzk os la sua direzione
  if (process.argv.includes('--croce')) {
    await page.evaluate(() => { window.__croce = []; const z = window.pzkkoZero, f = z.onTasto; z.onTasto = (n, v) => { window.__croce.push(n === 'croce' ? v : n); return f(n, v) } })
    const c = await page.evaluate(() => window.pzkkoZero.dove('croce'))
    const male = []
    for (const [verso, lx, ly] of [['dx', 0, 0.75], ['sx', 0, -0.75], ['su', -0.75, 0], ['giu', 0.75, 0]]) {
      const p = await page.evaluate((lx, ly) => window.pzkkoZero.dove('croce', [lx, ly]), lx, ly)
      const lato = Math.abs(p.x - c.x) > Math.abs(p.y - c.y) ? (p.x > c.x ? 'dx' : 'sx') : p.y < c.y ? 'su' : 'giu'
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await dorm(90); await page.mouse.up(); await dorm(300)
      const preso = await page.evaluate(() => window.__croce.pop() ?? '-')
      console.log(`  croce ${verso.padEnd(3)} sullo schermo a ${lato.padEnd(3)} (${Math.round(p.x)}, ${Math.round(p.y)}) → pzk os riceve ${preso}`)
      if (lato !== verso || preso !== verso) male.push(`${verso}: sta a ${lato}, manda ${preso}`)
    }
    console.log(male.length ? `CROCE: ${male.join(' · ')}` : 'CROCE: tutto a posto')
  }
  if (process.argv.includes('--debug')) console.log('rig:', await page.evaluate(() => JSON.stringify(window.pzkkoZero?.debug?.())), 'url:', await page.evaluate(() => location.search))
  if (process.argv.includes('--debug')) console.log('luce:', await page.evaluate(() => import('/telefono/zero/luce.js').then((l) => { const s = l.stato(); return JSON.stringify({ ora: new Date(window.pzkkoOrologio?.adesso?.() ?? 0).toString().slice(16, 24), pagina: window.pzkkoPagina?.luci, giorno: s.giorno, buio: s.buio, notte: s.notte, el: s.sole.el, lampioni: s.lampioni }) })))
  await page.screenshot({ path: join(LAVORO, 'prova-aperto.png') })
  await dorm(1400)
  await page.screenshot({ path: join(LAVORO, 'prova-cavo.png') })
  if (!app && !turni.length) { // (collaudando un'app sola, il giro di sempre no: senza conto finirebbe a scrivere nell'account)
  // pzk os: OK apre il menu, OK apre la chat (la prima), poi i comandi veri dalla tastiera
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-menu.png') })
  await page.keyboard.press('ArrowDown'); await dorm(200); await page.keyboard.press('ArrowUp'); await dorm(200)
  await page.keyboard.press('Enter'); await dorm(1200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat.png') })
  await page.keyboard.type('saldo', { delay: 40 }); await dorm(400)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-scrive.png') })
  await page.keyboard.press('Enter'); await dorm(2200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-saldo.png') })
  await page.keyboard.type('aiuto', { delay: 30 }); await page.keyboard.press('Enter'); await dorm(2200)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-aiuto.png') })
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await dorm(300)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-su.png') })
  await page.keyboard.type('pesca', { delay: 30 }); await page.keyboard.press('Enter'); await dorm(3500)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-pesca.png') })
  await page.keyboard.type('compra ', { delay: 30 }); await dorm(400)
  await page.screenshot({ path: join(LAVORO, 'prova-chat-sugg.png') })
  await page.keyboard.press('Backspace', { delay: 20 }); await dorm(200)
  await page.keyboard.press('Escape'); await dorm(300) // INDIETRO: cancella la riga
  await page.keyboard.press('Escape'); await dorm(500) // INDIETRO: esce dalla chat
  await page.screenshot({ path: join(LAVORO, 'prova-indietro.png') })
  // le impostazioni (l'ultima voce del menu) e la guida
  await page.keyboard.press('ArrowUp'); await dorm(300)
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-impostazioni.png') })
  await page.keyboard.press('ArrowLeft'); await dorm(300) // la luminosità giù di una tacca
  await page.screenshot({ path: join(LAVORO, 'prova-luminosita.png') })
  await page.keyboard.press('ArrowRight'); await dorm(200)
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown'); await dorm(200)
  await page.keyboard.press('Enter'); await dorm(500)
  await page.screenshot({ path: join(LAVORO, 'prova-guida.png') })
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Enter'); await dorm(200) } // (le tre pagine della guida)
  await page.keyboard.press('Escape'); await dorm(200); await page.keyboard.press('Escape'); await dorm(400)
  }
  // ── gli attrezzi del collaudo (li usano --app e --turni): strumenta aggancia l'lcd (i caratteri senza glifo, le icone che non
  // ci sono, i testi larghi), controlla guarda lo schermo di adesso (angoli, margine) e lo fotografa ──
  const strumenta = () => page.evaluate(async () => {
    const [os, font] = await Promise.all([import('/telefono/zero/os/os.js'), import('/telefono/zero/os/font.js')])
    window.__collaudo = { glifi: new Set(), nulle: 0, larghi: new Set() }
    // un'icona che non c'è: icone.bitmap torna null e al suo posto resta un buco
    const bm = os.lcd.bitmap.bind(os.lcd)
    os.lcd.bitmap = (b, ...r) => { if (!b) window.__collaudo.nulle++; return bm(b, ...r) }
    const testo = os.lcd.testo.bind(os.lcd)
    // un testo più largo del suo spazio (anche se poi il ritaglio lo taglia in silenzio): fuori dal margine di 6 pixel
    const { Lcd } = await import('/telefono/zero/os/lcd.js')
    os.lcd.testo = (x, y, s, o) => { for (const ch of String(s)) if (!font.esiste(ch)) window.__collaudo.glifi.add(ch); const w = Lcd.larghezza(s, o?.scala ?? 1); if (window.__collaudo.misura && y >= os.BARRA && (x < os.MARGINE - 2 || x + w > os.W - os.MARGINE + 2)) window.__collaudo.larghi.add(String(s).slice(0, 40)); return testo(x, y, s, o) }
  })
  const controlla = () => page.evaluate(async () => {
    const os = await import('/telefono/zero/os/os.js'), { W, H, BARRA, MARGINE } = os, fb = os.lcd.fb
    await new Promise((r) => setTimeout(r, 250)) // (le webp di riserva fanno in tempo ad arrivare)
    window.__collaudo.nulle = 0
    window.__collaudo.misura = true // (i testi larghi si contano solo qui, a pagina ferma: mentre scorre di lato sono spostati apposta)
    os.ridisegna(); await new Promise((r) => setTimeout(r, 250))
    window.__collaudo.misura = false
    const fuori = { angoli: 0, margine: 0, dove: [] }
    // gli angoli dello schermo sono stondati (2,2 mm: un quarto d'ellisse di 15 × 13 pixel): lì l'inchiostro non si vede
    const RX = 15, RY = 13
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!fb[y * W + x]) continue
      const cx = x < RX ? RX : x >= W - RX ? W - 1 - RX : null, cy = y < RY ? RY : y >= H - RY ? H - 1 - RY : null
      if (cx !== null && cy !== null && ((x - cx) / RX) ** 2 + ((y - cy) / RY) ** 2 > 1) { fuori.angoli++; if (fuori.dove.length < 6) fuori.dove.push(x + ',' + y) }
      else if (y >= BARRA && (x < MARGINE - 2 || x >= W - MARGINE + 2)) { fuori.margine++; if (fuori.dove.length < 6) fuori.dove.push(x + ',' + y) } // (2 px di tolleranza: le cornici dei dialoghi)
    }
    const v = os.corrente()
    return { vista: v?.nome ?? '?', app: v?.app ?? '', fuori, nulle: window.__collaudo.nulle, glifi: [...window.__collaudo.glifi], png: os.lcd.canvas.toDataURL('image/png') }
  })
  if (turni.length) {
    // IL GIRO DEI TURNI (6.11; prima c'era solo il turno del rider, del 29.10, che dal 31.10 non poteva più andare: i turni
    // li apre la banca, e nel collaudo la banca non c'era). Per ogni minigioco: il mestiere giusto messo a mano nel conto
    // (livello alto, nessuna attesa), «lavora» scritto nella chat, e la prova giocata come la gioca uno coi sei tasti (le
    // frecce e Invio, che sono la croce e OK). La risposta giusta la si legge dal tavolo della banca, che qui è in memoria.
    // L'anagramma si scrive dalla tastiera vera (l'altra strada), la consegna del rider fa due svolte con le frecce e due
    // col clic del mouse sul tasto disegnato nello schermo 3D. La banca tira sempre il gioco del mestiere e non arresta
    // nessuno (rnd.si), se no ogni giro sarebbe una prova diversa.
    const errori = []
    page.on('pageerror', (e) => errori.push('errore nella pagina: ' + e.message))
    bancaVera.rnd.si = (p) => p === 0.6
    const sbaglia = process.argv.includes('--sbaglia'), scade = process.argv.includes('--scade')
    await strumenta()
    const adesso = () => page.evaluate(() => import('/telefono/zero/os/chat.js').then((c) => c.adesso()))
    const FRECCE = { sx: 'ArrowLeft', dx: 'ArrowRight', su: 'ArrowUp', giu: 'ArrowDown' }
    const nomeDi = (id) => id.replaceAll('-', ' ')
    await page.waitForFunction(() => import('/games/pzk.js').then((p) => p.conto()?.nome === 'pzkko'), { timeout: 20000 }).catch(() => errori.push('il conto pzkko della banca in memoria non è entrato'))
    await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.apri('chat'))); await dorm(1500)
    for (const gioco of turni) {
      const mest = GIOCHI_TURNO[gioco], male = (cosa) => errori.push(`${gioco} (${mest}): ${cosa}`)
      let n = 0
      // la foto dell'lcd coi controlli (mezzo secondo), o svelta (il nastro: un secondo a pezzo)
      const foto = async (cosa, svelta = false) => {
        const nome = `prova-turno-${gioco}-${n++}-${cosa}.png`
        if (svelta) { await dorm(160); const png = await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.lcd.canvas.toDataURL('image/png'))); await writeFile(join(LAVORO, nome), Buffer.from(png.split(',')[1], 'base64')); return }
        const r = await controlla()
        await writeFile(join(LAVORO, nome), Buffer.from(r.png.split(',')[1], 'base64'))
        if (r.nulle) male(`${cosa}: ${r.nulle} icone che non ci sono`)
        if (r.fuori.angoli) male(`${cosa}: ${r.fuori.angoli} pixel negli angoli stondati (${r.fuori.dove.join(' ')})`)
        if (r.fuori.margine) male(`${cosa}: ${r.fuori.margine} pixel fuori dal margine (${r.fuori.dove.join(' ')})`)
      }
      await bancaVera.metti((c) => { const z = c.zaino; z.xp = 30000; z.mestiere = mest; z.turni = 0; z.attese = { ...z.attese, turno: 0 }; delete c.galera; delete c.tavoli?.['chat-turno']; c.pzk = Math.max(c.pzk, 5000) })
      await page.evaluate(() => import('/games/pzk.js').then((p) => p.sincronizza()))
      await page.waitForFunction((m) => import('/chat/zaino.js').then((z) => z.mestiere() === m && z.manca('turno') === 0), { timeout: 10000 }, mest).catch(() => male('il mestiere non è arrivato nello zaino del browser'))
      const prima = (await adesso()).schede
      await page.keyboard.type('lavora', { delay: 25 }); await page.keyboard.press('Enter')
      // quello che c'è da fare, nell'ordine: i tasti da premere ({ id } o { eti }), letti dal segreto della banca
      let piano = null, scritto = false, visto = '', fatte = 0, tenuti = 0, pezzo = '', fine = null, clic = 0
      const scadenza = Date.now() + 70000 // (il più lungo: la memoria, 4 + 20 secondi, più i margini)
      while (Date.now() < scadenza) {
        await dorm(90)
        const st = await adesso()
        const esito = st.ultime.find((u) => u.n > prima && /^(paga|turno storto|presi)$/.test(u.t))?.t // (solo le schede di questo turno)
        if (esito && !st.scelta && !st.scrivi && !st.occupata) { fine = esito; break }
        const t = (await bancaVera.conto())?.tavoli?.['chat-turno']
        if (!piano && t?.gioco) {
          if (t.gioco !== gioco) { male(`la banca ha aperto «${t.gioco}»`); break }
          piano = { riscrivi: () => t.atteso.split(' ').map((eti) => ({ eti })), contrario: () => [...t.atteso].map((eti) => ({ eti })), memoria: () => t.cinque.map((eti) => ({ eti })),
            conti: () => [...[...t.atteso].map((eti) => ({ eti })), { id: 'fatto' }], colori: () => [{ id: t.atteso }], icona: () => [{ id: t.atteso }], quiz: () => [{ id: t.atteso }],
            ordine: () => t.seq.map((v) => ({ eti: nomeDi(v) })), strada: () => t.seq.map((id) => ({ id })), calcio: () => [{ id: 'sinistra' }], anagramma: () => [{ scrivi: t.atteso }], veloce: () => [{ parola: t.atteso }], nastro: () => [] }[gioco]()
          if (scade && gioco !== 'nastro') piano = []
          else if (sbaglia && ['icona', 'colori', 'quiz'].includes(gioco)) piano = [{ altro: t.atteso }]
        }
        // la scheda è cambiata: una foto (la prova da guardare, i tasti, la paga)
        const ora = st.scheda ? `${st.scheda.t}|${st.scheda.d.split('\n')[0]}|${st.scelta ? 'tasti' : st.scrivi ? 'scrivi' : ''}` : ''
        if (st.scheda?.fatta && st.schede > prima && ora !== visto && gioco !== 'nastro') { visto = ora; await foto(st.scelta ? 'tasti' : st.scrivi ? 'scrivi' : 'guarda'); continue }
        // un lavoro rischioso chiede prima se si vuole lavorare lo stesso
        if (st.scelta?.tasti.some((b) => b.id === 'si') && st.scelta.tasti.some((b) => b.id === 'no')) { await foto('rischio'); const i = st.scelta.tasti.findIndex((b) => b.id === 'si'); for (let k = 0; k < 6 && (await adesso()).scelta?.sel !== i; k++) { await page.keyboard.press('ArrowRight'); await dorm(60) } await page.keyboard.press('Enter'); await dorm(300); continue }
        if (!piano) continue
        // il nastro: i primi tre pezzi si tengono (→), gli altri si guardano passare
        if (gioco === 'nastro') {
          if (st.scheda && st.scheda.t !== pezzo && /\d+\/\d+$/.test(st.scheda.t)) { pezzo = st.scheda.t; fatte++; if (fatte <= 5 || fatte === 12) await foto(`pezzo${fatte}`, true); if (!st.scheda.icone.length) male(`${pezzo}: il pezzo non ha l'icona`); if (st.scelta && tenuti < 3) { await dorm(250); await page.keyboard.press('ArrowRight'); tenuti++ } }
          continue
        }
        const b = piano[0]
        if (!b) continue
        if (b.scrivi) { if (st.scelta && st.scrivi && !scritto) { scritto = true; await page.keyboard.type(b.scrivi, { delay: 35 }); await foto('scritta'); await page.keyboard.press('Enter'); piano.shift() } continue }
        if (b.parola) { if (st.scrivi === b.parola) { await page.keyboard.press('Enter'); piano.shift() } else if (st.scrivi && st.scrivi !== 'scrivi qui…') male(`la parola da premere è «${st.scrivi}», la banca aspetta «${b.parola}»`); continue }
        if (!st.scelta) continue
        const i = st.scelta.tasti.findIndex((x) => !x.spento && (b.altro ? x.id !== b.altro : b.id ? x.id === b.id : x.eti === b.eti))
        if (i < 0) { male(`il tasto ${JSON.stringify(b)} non c'è fra ${st.scelta.tasti.map((x) => x.eti).join(' | ')}`); break }
        const verso = st.scelta.dir?.[st.scelta.tasti[i].id]
        if (verso && gioco === 'strada' && fatte >= 2) {
          // le ultime due svolte col clic del mouse sul tasto nello schermo 3D: i tre tasti stanno nell'ultima fila, da sinistra
          const zz = await page.evaluate(() => import('/telefono/zero/os/os.js').then((os) => os.elencoZone().filter((z) => z.h >= 8 && z.w > 30 && z.y > 12)))
          const yMax = Math.max(...zz.map((z) => z.y)), z = zz.filter((q) => q.y === yMax).sort((a, b) => a.x - b.x)[i]
          if (!z) { male('il tasto da cliccare non è fra le zone'); break }
          const pt = await page.evaluate((x, y) => window.pzkkoZero.puntoLcd(x, y), z.x + z.w / 2, z.y + z.h / 2)
          await page.mouse.move(pt.x, pt.y); await dorm(150)
          const cursore = await page.evaluate(() => document.querySelector('.z-tela')?.style.cursor)
          if (cursore !== 'pointer') male(`clic ${++clic}: sopra il tasto il puntatore non è la manina (${cursore || 'niente'})`)
          await page.mouse.click(pt.x, pt.y)
        } else if (verso) await page.keyboard.press(FRECCE[verso]) // (una direzione: la freccia preme subito)
        else { for (let k = 0; k < 40 && (await adesso()).scelta?.sel !== i; k++) { await page.keyboard.press('ArrowRight'); await dorm(35) } await page.keyboard.press('Enter') }
        piano.shift(); fatte++
        await dorm(120)
        if (fatte === 1 || !piano.length) await foto(piano.length ? 'primo' : 'ultimo', true)
      }
      for (let k = 0; k < 40 && (await adesso()).occupata; k++) await dorm(250) // (il comando finisce prima del turno dopo)
      await dorm(700)
      await foto('fine')
      const c = await bancaVera.conto()
      if (!fine) male('il turno non è finito in 70 secondi')
      else if (scade || (sbaglia && ['icona', 'colori', 'quiz'].includes(gioco))) {
        const ultima = (await adesso()).scheda
        if (fine !== 'turno storto') male(`doveva finire in «turno storto», è finito con «${fine}»`)
        else if (!scade && !/era («[^»]+»|[a-zà-ù]+)/.test(ultima?.d ?? '')) male(`la scheda non dice qual era la risposta giusta: «${ultima?.d}»`)
        else if (scade && !/scaduto|non hai tirato/.test(ultima?.d ?? '')) male(`la scheda non dice che il tempo è scaduto: «${ultima?.d}»`)
      } else if (fine !== 'paga' && gioco !== 'calcio') male(`finito con «${fine}» invece della paga intera`) // (il rigore lo para il portiere, una volta su tre)
      if (c?.tavoli?.['chat-turno']) male('il turno è rimasto aperto sulla banca')
      if ((c?.zaino?.turni ?? 0) !== 1) male(`il turno non è stato contato (turni ${c?.zaino?.turni})`)
      if (gioco === 'nastro' && fatte !== 12) male(`sul nastro sono passati ${fatte} pezzi, non 12`)
      console.log(`  ${gioco.padEnd(10)} ${mest.padEnd(13)} → ${fine ?? 'non finito'}${gioco === 'nastro' ? ` (${fatte} pezzi, ${tenuti} tenuti)` : ''}  foto ${n}`)
      await dorm(600)
    }
    const glifi = await page.evaluate(() => [...window.__collaudo.glifi])
    if (glifi.length) errori.push('caratteri senza glifo in font.js: ' + glifi.map((c) => JSON.stringify(c)).join(' '))
    const larghi = await page.evaluate(() => [...window.__collaudo.larghi])
    if (larghi.length) errori.push('testi più larghi dello schermo: ' + larghi.map((t) => JSON.stringify(t)).join(' '))
    console.log(errori.length ? `TURNI: ${errori.length} problemi\n  - ` + errori.join('\n  - ') : `TURNI: tutto a posto (${turni.length} minigiochi, coi sei tasti, con la banca vera in memoria); guarda prova-turno-*.png`)
    await page.keyboard.press('Escape'); await dorm(400)
  }
  if (app && bancaVera) {
    await page.waitForFunction(() => import('/games/pzk.js').then((p) => p.conto()?.nome === 'pzkko'), { timeout: 20000 }).catch(() => console.log('  (il conto pzkko della banca in memoria non è entrato)'))
    if (process.argv.includes('--giocate')) {
      await bancaVera.metti((c) => { c.libro = { ...c.libro, lav: 10292.5, pre: 1160, spe: 10580, g: { 'chat-slot': [3, 0, 60, 0, 0], 'chat-blackjack': [1, 1, 400, 800, 400], blackjack: [5, 2, 865, 130, 50], roulette: [2, 2, 5000, 6000, 500] } } })
      await page.evaluate(() => import('/games/pzk.js').then((p) => p.sincronizza())); await dorm(600)
    }
  }
  if (app) {
    // IL COLLAUDO DI UN'APP (le regole: pzkko/telefono/zero/os/REGOLE.md): la si apre, si premono tutti e sei i tasti, e a
    // ogni passo si salva l'lcd pixel per pixel (prova-app-<id>-<n>-<tasto>.png, 768 × 384: lo schermo vero, senza 3D) e
    // si controlla da soli: niente inchiostro negli angoli stondati né fuori dal margine, nessun carattere senza glifo,
    // nessun errore nella pagina, il bip a ogni tasto (coi suoni accesi: --suoni), la vista che non resta appesa
    // --tasti=dx,dx,ok,giu…: una sequenza a scelta al posto di quella fissa (per vedere tutte le pagine di un'app)
    const TASTI = { su: 'ArrowUp', giu: 'ArrowDown', sx: 'ArrowLeft', dx: 'ArrowRight', ok: 'Enter', indietro: 'Escape', okvero: 'Control+Enter' } // (okvero: il tasto OK anche dove Invio va a capo, l'editor di «codice C»)
    // (e clic@80x121: un clic del mouse sul pixel 80, 121 dell'lcd, attraverso il 3D vero; scrivi@caf: testo dalla tastiera vera, + per lo spazio;
    // conta@pescati@5: lo zaino conta come dopo cinque pescate, per far avanzare sfide e quest; prendi@caffe@3: tre caffè nello zaino;
    // finta@direzioni|griglia|parola|azioni: nella chat una scheda finta che aspetta le frecce del rider, una griglia come le mine,
    // la parola della banconota, o dei tasti con uno spento e uno da finire: senza la banca, che nel collaudo non c'è)
    const scelti = (process.argv.find((a) => a.startsWith('--tasti=')) ?? '').slice(8).split(',').filter((k) => TASTI[k] || /^clic@\d+x\d+$/.test(k) || /^scrivi@[\w+]+$/.test(k) || /^(conta|prendi)@[\w-]+@\d+$/.test(k) || /^aspetta@\d+$/.test(k) || /^finta@\w+$/.test(k))
    const passo = (k) => (TASTI[k] ? [k, TASTI[k]] : k.startsWith('finta@') ? [k.replace('@', '-'), { finta: k.slice(6) }] : k.startsWith('aspetta@') ? [k.replace('@', '-'), { aspetta: Number(k.slice(8)) }] : k.startsWith('scrivi@') ? [k.replace('@', '-'), { scrivi: k.slice(7) }] : k.startsWith('conta@') ? [k.split('@').join('-'), { conta: [k.split('@')[1], Number(k.split('@')[2])] }] : k.startsWith('prendi@') ? [k.split('@').join('-'), { prendi: [k.split('@')[1], Number(k.split('@')[2])] }] : [k.replace('@', '-'), { clic: k.slice(5).split('x').map(Number) }])
    const passi = scelti.length ? [['apri', null], ...scelti.map(passo)] : [['apri', null], ['giu', 'ArrowDown'], ['giu', 'ArrowDown'], ['su', 'ArrowUp'], ['dx', 'ArrowRight'], ['sx', 'ArrowLeft'], ['ok', 'Enter'], ['ok', 'Enter'], ['indietro', 'Escape'], ['indietro', 'Escape'], ['indietro', 'Escape']]
    const errori = []
    page.on('pageerror', (e) => errori.push('errore nella pagina: ' + e.message))
    await strumenta()
    await page.evaluate(() => { window.__oscillatori = 0 })
    let ultimaVista = ''
    for (const [i, [nome, k]] of passi.entries()) {
      if (nome === 'indietro' && i > 0 && ultimaVista === 'home' && !scelti.length) continue
      const prima = await page.evaluate(() => window.__oscillatori ?? 0)
      const accesiPrima = await page.evaluate(() => localStorage.getItem('pzkko-suono') === 'si')
      const giaAperta = !k && (await page.evaluate((a) => import('/telefono/zero/os/os.js').then((os) => os.corrente()?.app === a), app)) // (già aperta da sola, come l'account senza conto: la sigla è già suonata) // (se il collaudo li ha appena spenti dalle impostazioni, il silenzio è giusto)
      if (k?.finta) await page.evaluate(async (tipo) => {
        const c = await import('/telefono/zero/os/chat.js')
        window.__esiti ??= []
        const segna = (p) => { p.then((r) => window.__esiti.push(`${tipo} → ${r}`)) } // (non si aspetta: la scelta aspetta i tasti)
        if (tipo === 'parola') { const s = c.scheda({ colore: 'oro', t: 'una banconota vola dalla finestra!', d: 'scrivi <b>PRENDILA</b> prima che se la porti il vento.' }); await s.__pronta; return segna(c.scrivi(20000, { segnaposto: 'PRENDILA' })) }
        if (tipo === 'azioni') return void c.scheda({ t: 'tasti finti', d: 'uno si preme, uno è spento, uno è da finire.', azioni: [['saldo', 'il saldo'], ['quest prova 1', 'non puoi — ti manca la canna', 'spento'], ['manda pzk000002 ', 'manda $pzk']] })
        const s = c.scheda({ t: tipo === 'direzioni' ? 'la consegna' : 'le mine', d: 'una scelta finta del collaudo' })
        const b = tipo === 'direzioni' ? ['sinistra', 'dritto', 'destra'] : Array.from({ length: 9 }, (_, i) => String(i + 1))
        segna(c.scegli(s, b.map((id) => ({ id, eti: id })), 0, tipo === 'griglia' ? { griglia: 'g3' } : {}))
      }, k.finta)
      else if (k?.aspetta) await dorm(k.aspetta) // (aspetta@3000: tre secondi senza toccare niente, per le cose che vanno da sole)
      else if (k?.conta) await page.evaluate(([s, n]) => import('/chat/zaino.js').then((z) => z.conta(s, n)), k.conta)
      else if (k?.prendi) await page.evaluate(([s, n]) => import('/chat/zaino.js').then((z) => z.aggiungi(s, n)), k.prendi)
      else if (k?.scrivi) await page.keyboard.type(k.scrivi.replaceAll('+', ' '), { delay: 40 }) // (scrivi@mine+50: il + è lo spazio)
      else if (k?.clic) { const p = await page.evaluate((x, y) => window.pzkkoZero.puntoLcd(x, y), ...k.clic); await page.mouse.click(p.x, p.y) }
      else if (k === 'Control+Enter') { await page.keyboard.down('Control'); await page.keyboard.press('Enter'); await page.keyboard.up('Control') }
      else if (k) await page.keyboard.press(k)
      else if (!guidaPrima) await page.evaluate((a) => import('/telefono/zero/os/os.js').then((os) => os.apri(a)), app)
      await dorm(k ? 450 : 1500)
      const r = await controlla()
      const suono = (await page.evaluate(() => window.__oscillatori ?? 0)) - prima
      ultimaVista = r.vista
      await writeFile(join(LAVORO, `prova-app-${app}-${i}-${nome}.png`), Buffer.from(r.png.split(',')[1], 'base64'))
      console.log(`  ${i} ${nome.padEnd(8)} → ${r.vista}${r.app ? ' (' + r.app + ')' : ''}  angoli ${r.fuori.angoli}  margine ${r.fuori.margine}  icone mancanti ${r.nulle}  suono ${suono}`)
      if (r.nulle) errori.push(`${i} ${nome}: ${r.nulle} icone che non ci sono (icone.bitmap → null: manca il nome in os/icone.js)`)
      if (r.fuori.angoli) errori.push(`${i} ${nome}: ${r.fuori.angoli} pixel negli angoli stondati (${r.fuori.dove.join(' ')})`)
      if (r.fuori.margine) errori.push(`${i} ${nome}: ${r.fuori.margine} pixel fuori dal margine (${r.fuori.dove.join(' ')})`)
      // (le lettere della tastiera vera, i conti dello zaino e le attese non suonano; 2.11: il push era finito dentro il
      // commento, così il controllo del suono non c'era più e il suo if prendeva la riga dopo)
      if (suoni && accesiPrima && !suono && !giaAperta && !k?.scrivi && !k?.conta && !k?.prendi && !k?.aspetta && !k?.finta) errori.push(`${i} ${nome}: nessun suono`)
      if (i === 0 && r.app !== app && r.vista !== 'presto' && !guidaPrima) errori.push(`l'app ${app} non si è aperta (c'è ${r.vista})`)
    }
    const esiti = await page.evaluate(() => window.__esiti ?? [])
    if (esiti.length) console.log('  le scelte finte: ' + esiti.join(' · '))
    const larghi = await page.evaluate(() => [...window.__collaudo.larghi])
    if (larghi.length) errori.push('testi più larghi dello schermo: ' + larghi.map((t) => JSON.stringify(t)).join(' '))
    const glifi = await page.evaluate(() => [...window.__collaudo.glifi])
    if (glifi.length) errori.push('caratteri senza glifo in font.js: ' + glifi.map((c) => JSON.stringify(c)).join(' '))
    await page.screenshot({ path: join(LAVORO, `prova-app-${app}.png`) })
    console.log(errori.length ? `COLLAUDO ${app}: ${errori.length} problemi\n  - ` + errori.join('\n  - ') : `COLLAUDO ${app}: tutto a posto`)
  }
  // la chiusura: fuori dal cercapersone (un clic sulla tela dove non c'è il cercapersone); sul cellulare, CHIUDI nella barra
  if (telefono) await page.click('.t-nav [data-t="chiudi"]'); else await page.mouse.click(30, 30)
  await dorm(1000)
  await page.screenshot({ path: join(LAVORO, 'prova-saluto.png') })
  await dorm(2600)
  await page.screenshot({ path: join(LAVORO, 'prova-chiuso.png') })
  console.log('foto in', LAVORO)
} finally {
  await aperto.close()
  server.close()
}
