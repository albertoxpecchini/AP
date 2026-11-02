#!/usr/bin/env node
// Le voci di pzkkopedia che nascono dai dati del sito (2.11), e la cronologia dai commit del repository:
//
//   node tools/pzkko/wiki/genera.mjs            (dalla cartella albertopecchini.it)
//
// Scrive:
//   pzkko/wiki/voci/dati.js     una voce per ogni oggetto dello shop, pesce, bestia, reperto, cosa dell'ufficio, mestiere,
//                               side quest (con tutta la storia a bivi), squadra di virtual, pezzo e PC pronto della miniera,
//                               traguardo; e le liste (Elenco degli oggetti, …, Le giornate della lumachina, Elenco delle foto
//                               dei quiz, Elenco dei commit, Le app di pzk os (tabella)). I dati sono quelli del sito, importati
//                               dai moduli puri (chat/oggetti.js, chat/testi.js, …); quelli dentro moduli che vogliono il
//                               browser (chat/sfide.js, chat/traguardi.js, telefono/telefono.js) si leggono dal sorgente.
//   pzkko/wiki/cronologia.js    COMMIT (tutti, dal più recente: [hash, data, messaggio]), PER_VOCE (titolo → i commit che hanno
//                               toccato le sue `fonti`), ALLINEATA (il commit a cui la wiki è allineata adesso)
//   pzkko/wiki/stato.json       il commit, la data, i numeri (lo legge controlla.mjs)
//
// Le voci scritte a mano stanno negli altri moduli di pzkko/wiki/voci/ (il formato: tools/pzkko/wiki/README.md).
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = resolve(QUI, '../../..')          // albertopecchini.it/
const REPO = resolve(SITO, '..')               // AP/
const PZKKO = join(SITO, 'pzkko')
const WIKI = join(PZKKO, 'wiki')
const imp = (p) => import(pathToFileURL(join(PZKKO, p)).href)
const oggi = new Date().toISOString().slice(0, 10)
const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 }).trim()

// ---------------------------------------------------------------------------------------------------- aiuti
const esc = (s) => String(s ?? '').replace(/`/g, '\u2019').replace(/\$\{/g, '$ {') // mai un apice inverso né ${ nel testo delle voci
const maiuscola = (s) => s.charAt(0).toUpperCase() + s.slice(1)
/** Il titolo di una cosa dal suo nome in chat: senza l'articolo, senza la nota fra parentesi, la prima lettera maiuscola. */
function titoloDa(nome) {
  let t = String(nome).trim().replace(/^(un’|un'|una |un |uno |il |la |l’|l'|lo |i |le |gli |delle |dei |del )/i, '')
  t = t.replace(/\s*\(.*$/, '').replace(/\.\s.*$/, '').trim()
  if (t === t.toUpperCase() && t.length > 3) t = t.toLowerCase().replace(/\b(gonzaga|mincio|virgilio|mantova)\b/g, (x) => maiuscola(x))
  return maiuscola(t)
}
const n_ = (n) => Number(n).toLocaleString('it-IT')
const pzk = (n) => `${n_(n)} $pzk`
const link = (t, testo) => (testo ? `[[${t}|${testo}]]` : `[[${t}]]`)
const riga = (celle) => `|-\n${celle.map((c) => `| ${c}`).join('\n')}`
const tabella = (teste, righe, classe = 'wikitable') => `{| class="${classe}"\n|-\n${teste.map((t) => `! ${t}`).join('\n')}\n${righe.join('\n')}\n|}`
const BONUS = { paga: (n) => `paghe ${n > 0 ? '+' : '−'}${Math.round(Math.abs(n) * 100)} %`, xp: (n) => `xp +${Math.round(Math.abs(n) * 100)} %`, attese: (n) => `attese −${Math.round(Math.abs(n) * 100)} %`, vendita: (n) => `vendite +${Math.round(Math.abs(n) * 100)} %`, morte: (n) => `morte −${Math.round(Math.abs(n) * 100)} %`, sfide: (n) => `sfide +${Math.round(Math.abs(n) * 100)} %` }
const testoBonus = (b) => Object.entries(b ?? {}).filter(([k, n]) => n && BONUS[k]).map(([k, n]) => BONUS[k](n)).join(' · ') || '—'
const minuti = (ms) => (ms ? `${Math.round(ms / 60000)} min` : '—')

// i titoli già presi (quelli scritti a mano negli altri moduli, e poi quelli generati qui): una cosa con lo stesso nome di
// un'altra prende un qualificatore («La petizione» è il foglio sul muro, la side quest diventa «La petizione (quest)»)
const presi = new Set()
const MODULI_A_MANO = ['principale', 'sito', 'scena', 'giochi', 'cercapersone', 'chat', 'dietro', 'memoria']
const aMano = {}
for (const nome of MODULI_A_MANO) {
  const f = join(WIKI, 'voci', `${nome}.js`)
  if (!existsSync(f)) { console.log(`  (manca voci/${nome}.js)`); continue }
  try { aMano[nome] = (await import(pathToFileURL(f).href + `?t=${Date.now()}`)).VOCI } catch (e) { console.log(`  voci/${nome}.js non si carica: ${e.message.split('\n')[0]}`); continue }
  for (const t of Object.keys(aMano[nome])) presi.add(t.replace(/'/g, '’').replace(/\s+/g, ' ').trim())
}
const VOCI = {}
function aggiungi(titolo, voce, qualificatore) {
  let t = titolo
  if (presi.has(t) && qualificatore) t = `${titolo} (${qualificatore})`
  if (presi.has(t)) { let n = 2; while (presi.has(`${t} ${n}`)) n++; t = `${t} ${n}` }
  presi.add(t)
  VOCI[t] = voce
  return t
}
const RINVII = [] // [da, a]: si scrivono alla fine, quando tutte le voci vere hanno il loro titolo
const rinvio = (da, a) => { da = da.trim(); if (da && da !== a) RINVII.push([da, a]) }
/** Una cosa di un catalogo: il titolo (col qualificatore se è già preso) e i rinvii dal nome intero e dal titolo qualificato. */
function cosa(titolo, nomeIntero, qualificatore) {
  const t = aggiungi(titolo, null, qualificatore)
  rinvio(maiuscola(nomeIntero), t)
  rinvio(`${titolo} (${qualificatore})`, t)
  return t
}

// ---------------------------------------------------------------------------------------------------- i dati del sito
const icone = await imp('chat/icone.js')
const icona = (id, px = 96) => (icone.esiste(id) ? `[[File:${icone.src(id)}|${px}px|${id}]]` : '')
const testi = await imp('chat/testi.js')
const oggetti = await imp('chat/oggetti.js')
const missioni = await imp('chat/missioni-dati.js')
const quizDati = await imp('chat/quiz-dati.js')
const squadre = await imp('games/virtual/squadre.js')
const miniera = await imp('chat/miniera-dati.mjs')
const lumaca = await imp('chat/lumaca-dati.mjs')
const immagini = await imp('chat/immagini.js')
const src = async (p) => readFile(join(PZKKO, p), 'utf8')

// le sfide (chat/sfide.js importa pzk.js, che vuole il browser): dal sorgente
const sfide = [...(await src('chat/sfide.js')).matchAll(/\{ id: '([^']+)', stat: '([^']+)', icona: '([^']+)', obiettivi: \[([^\]]+)\], testo: \(n\) => `([^`]*)`/g)].map((m) => ({ id: m[1], stat: m[2], icona: m[3], obiettivi: m[4].split(',').map((x) => +x.trim()), testo: m[5] }))
// i traguardi (chat/traguardi.js importa zaino.js e pzk.js): dal sorgente
const traguardi = [...(await src('chat/traguardi.js')).matchAll(/^\s*\['([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', \(\) => \[(.*?), (\d+)\]\]/gm)].map((m) => ({ id: m[1], gruppo: m[2], icona: m[3], nome: m[4], cosa: m[5], misura: m[6], di: +m[7] }))
const GRUPPI = { banca: 'la banca', esperienza: 'l’esperienza', chat: 'la chat col bot', giochi: 'i giochi', cervello: 'testa e costanza', cucina: 'la cucina', profilo: 'il profilo' }
// le app del cercapersone (telefono/telefono.js importa mezzo sito): dal sorgente
const app = [...(await src('telefono/telefono.js')).matchAll(/\{ id: '([^']+)', nome: '([^']+)', icona: '([^']+)'(.*)\}/g)].map((m) => ({ id: m[1], nome: m[2], icona: m[3], store: /store: true/.test(m[4]), badge: /badge:/.test(m[4]), azione: /azione:/.test(m[4]) }))
const APP_VOCE = { chat: 'Chat (app)', profilo: 'Profilo (app)', account: 'Account (app)', negozio: 'Shop (app)', pzkstore: 'Pzkstore (app)', sfide: 'Sfide (app)', quiz: 'Quiz (app)', missioni: 'Quest (app)', giocatori: 'Giocatori (app)', zaino: 'Zaino (app)', miniera: 'Miniera (app)', foto: 'Foto (app)', virtual: 'Virtual (app)', banca: 'Banca (app)', rapina: 'Rapina (app)', lavatrice: 'Lavatrice (app)', decifratore: 'Decifratore (app)', conversioni: 'Bin·hex (app)', calcolatrice: 'Calcoli (app)', compilatore: 'Codice C (app)', cucina: 'Cucina (app)', impostazioni: 'Impostazioni (app)' }
const FONTI_APP = (id) => [`albertopecchini.it/pzkko/telefono/zero/os/${id}.js`, ...(existsSync(join(PZKKO, 'telefono/app', `${id}.js`)) ? [`albertopecchini.it/pzkko/telefono/app/${id}.js`] : [])]

// ---------------------------------------------------------------------------------------------------- gli oggetti dello shop
const F_OGG = ['albertopecchini.it/pzkko/chat/oggetti.js', 'albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/pzkko/chat/mercato.js']
const REPARTO = Object.fromEntries(oggetti.REPARTI.map(([id, nome, icona]) => [id, { nome, icona }]))
const TIPO = { usa: 'si usa (consumabile)', tieni: 'si tiene (il bonus dura finché è nello zaino)', attrezzo: 'attrezzo (si ha una volta sola, ogni tanto si rompe)', cassa: 'cassa (si apre con «apri»)' }
const tutti = [...testi.NEGOZIO, ...oggetti.NUOVI.filter((x) => x.fuoriVendita && !testi.NEGOZIO.some((y) => y.id === x.id))]
const T_OGG = {}
for (const o of tutti) T_OGG[o.id] = cosa(maiuscola(o.nome), o.nome, 'oggetto')
rinvio('Il peluche della chiocciola', T_OGG.peluche)
rinvio('Cercapersone zero (oggetto)', T_OGG.zero)
for (const o of tutti) {
  const t = T_OGG[o.id], rep = REPARTO[o.reparto]
  VOCI[t] = { data: oggi, fonti: F_OGG, testo: `{{Infobox
| titolo = ${esc(o.nome)}
| immagine = ${icone.esiste(o.id) ? icone.src(o.id) : ''}
| didascalia = l’icona a pixel di retro-diffusion
| id = <code>${o.id}</code>
| reparto = ${rep ? link('I reparti dello shop', rep.nome) : '—'}
| prezzo = ${o.fuoriVendita ? 'fuori vendita (era ' + pzk(o.prezzo) + ')' : pzk(o.prezzo)}
| tipo = ${TIPO[o.tipo] ?? o.tipo}
| bonus = ${testoBonus(o.bonus)}
| dura = ${minuti(o.effetto)}
${o.unico ? '| quanti = uno solo nello zaino\n' : ''}}}
'''${esc(maiuscola(o.nome))}''' è ${o.tipo === 'cassa' ? 'una cassa' : o.tipo === 'attrezzo' ? 'un attrezzo' : 'una cosa'} dello [[Lo shop|shop]] di [[pzkko.it]], nel reparto «${rep?.nome ?? '—'}»${o.fuoriVendita ? ', oggi fuori vendita' : `, a ${pzk(o.prezzo)}`}.

== Cosa fa ==
${esc(o.cosa)}

${o.bonus && Object.keys(o.bonus).length ? `== Il bonus ==\n${testoBonus(o.bonus)}${o.effetto ? `, per ${minuti(o.effetto)} dopo che lo si usa` : o.tipo === 'tieni' ? ', finché sta nello [[Lo zaino|zaino]] (se ne conta uno solo)' : ''}. I bonus si sommano fra loro: vedi [[I bonus]].\n\n` : ''}== Dove si compra ==
Nello [[Lo shop|shop]] (la [[Shop (app)|app]] del [[Il cercapersone zero|cercapersone]] o il comando <code>compra ${o.id}</code> nella [[La chat col bot|chat]]), coi [[I $pzk|$pzk]] puliti: i [[I soldi sporchi|soldi sporchi]] non valgono. Il prezzo lo decide la [[La banca sul server|banca]], sul server di Alberto; nel browser c’è solo la copia per disegnare la scheda.${o.tipo === 'cassa' ? ' Le casse si aprono con <code>apri</code>: vedi [[Le casse]].' : ''}${o.id === 'gratta' ? ' Vedi [[Il gratta e vinci]].' : ''}

{{Vedi anche|Elenco degli oggetti|Lo shop|Lo zaino|I bonus}}
[[Categoria:Gli oggetti]]` }
}
VOCI['Elenco degli oggetti'] = { data: oggi, fonti: F_OGG, testo: `'''Tutto quello che si compra''' nello [[Lo shop|shop]] di pzkko: ${tutti.length} cose in ${oggetti.REPARTI.length} reparti (${oggetti.REPARTI.map(([, n]) => n).join(', ')}). I prezzi sono in [[I $pzk|$pzk]] puliti. Generato dai dati del sito (<code>chat/testi.js</code> e <code>chat/oggetti.js</code>).

${oggetti.REPARTI.map(([id, nome]) => `== ${maiuscola(nome)} ==\n${tabella(['', 'cosa', 'prezzo', 'tipo', 'bonus', 'cosa fa'], tutti.filter((o) => o.reparto === id).map((o) => riga([icona(o.id, 40), link(T_OGG[o.id], o.nome), o.fuoriVendita ? 'fuori vendita' : pzk(o.prezzo), o.tipo, testoBonus(o.bonus), esc(o.cosa)])))}`).join('\n\n')}

{{Vedi anche|Lo shop|I reparti dello shop|Le casse|I bonus}}
[[Categoria:Gli oggetti]]` }

// ---------------------------------------------------------------------------------------------------- pesci, bestie, reperti, ufficio
function catalogo({ lista, categoria, attivita, comando, attrezzo, qualificatore, nomeLista, intro, fonti }) {
  const T = {}
  for (const x of lista) T[x.id] = cosa(titoloDa(x.nome), x.nome, qualificatore)
  const tot = lista.reduce((s, x) => s + x.peso, 0)
  for (const x of lista) {
    const p = (100 * x.peso / tot).toFixed(1)
    VOCI[T[x.id]] = { data: oggi, fonti, testo: `{{Infobox
| titolo = ${esc(x.nome)}
| immagine = ${icone.esiste(x.id) ? icone.src(x.id) : ''}
| didascalia = l’icona a pixel
| id = <code>${x.id}</code>
| si trova con = ${link(attivita)} (<code>${comando}</code>)
| probabilità = ${p} % a tentativo (peso ${x.peso} su ${tot})
| vale = ${pzk(x.vale)}
| rarità = ${x.leggendario ? 'leggendario' : x.raro ? 'raro' : x.schifo ? 'schifezza' : 'comune'}
${x.pericoloso ? `| pericolo = ${esc(x.pericoloso)}\n` : ''}${x.sospetto ? '| sospetto = sì: si apre col decifratore\n' : ''}}}
'''${esc(maiuscola(x.nome))}''' è una delle ${lista.length} cose che si trovano con ${link(attivita)} (il comando <code>${comando}</code> della [[La chat col bot|chat]]${attrezzo ? `, con ${link(attrezzo)}` : ''}): esce il ${p} % delle volte (il peso è ${x.peso} su ${tot}) e si vende a ${pzk(x.vale)}${x.vale ? '' : ' (non si vende)'}.${x.schifo ? ' È una schifezza: vale quasi niente e il bot la commenta.' : ''}${x.raro ? ' È raro: finisce fra i leggendari presi e nelle [[Le notizie della banca|notizie della banca]].' : ''}${x.leggendario ? " È '''leggendario''': conta per i [[I traguardi|traguardi]]." : ''}${x.pericoloso ? ` '''Pericoloso''': «${esc(x.pericoloso)}» — si può morire ([[La morte]]).` : ''}${x.sospetto ? ` ${esc(x.cosa ?? '')}` : ''}

== Cosa farne ==
Finisce nello [[Lo zaino|zaino]]; si vende con <code>vendi ${x.id}</code> (o dalla [[Zaino (app)|app zaino]]) e i $pzk escono dalla [[La cassa di pzk|cassa di pzk]]${x.sospetto ? '; si apre col [[Il decifratore|decifratore]]' : ''}. La probabilità e il valore li decide la [[La banca sul server|banca]], sul server di Alberto.

{{Vedi anche|${nomeLista}|${attivita}|Lo zaino}}
[[Categoria:${categoria}]]` }
  }
  VOCI[nomeLista] = { data: oggi, fonti, testo: `${intro}

${tabella(['', 'cosa', 'probabilità', 'vale', 'rarità', 'note'], lista.map((x) => riga([icona(x.id, 40), link(T[x.id], x.nome), `${(100 * x.peso / tot).toFixed(1)} %`, pzk(x.vale), x.leggendario ? 'leggendario' : x.raro ? 'raro' : x.schifo ? 'schifezza' : 'comune', esc(x.pericoloso ?? (x.sospetto ? 'si apre col decifratore' : ''))])))}

{{Vedi anche|${attivita}|La chat col bot|Lo zaino}}
[[Categoria:${categoria}]]` }
  return T
}
const F_TESTI = ['albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/pzkko/chat/comandi/attivita.js']
catalogo({ lista: testi.PESCI, categoria: 'I pesci', attivita: 'La pesca', comando: 'pesca', attrezzo: 'Canna da pesca', qualificatore: 'pesce', nomeLista: 'Elenco dei pesci', fonti: F_TESTI, intro: `'''Quello che si pesca nel [[Il Mincio|Mincio]]''' col comando <code>pesca</code> della [[La chat col bot|chat]] (serve la [[Canna da pesca|canna]]): ${testi.PESCI.length} pesci e schifezze, con la probabilità di ognuno (il peso sul totale) e quanto si vende. Generato da <code>chat/testi.js</code>.` })
catalogo({ lista: testi.ANIMALI, categoria: 'Le bestie', attivita: 'La caccia', comando: 'caccia', attrezzo: 'Fionda', qualificatore: 'bestia', nomeLista: 'Elenco delle bestie', fonti: F_TESTI, intro: `'''Quello che si caccia''' col comando <code>caccia</code> (con la [[Fionda|fionda]] le bestie piccole, col [[Fucile da caccia|fucile]] quelle grosse): ${testi.ANIMALI.length} bestie, due pericolose. Generato da <code>chat/testi.js</code>.` })
catalogo({ lista: testi.REPERTI, categoria: 'I reperti', attivita: 'Lo scavo', comando: 'scava', attrezzo: 'Pala', qualificatore: 'reperto', nomeLista: 'Elenco dei reperti', fonti: F_TESTI, intro: `'''Quello che si scava''' col comando <code>scava</code> (serve la [[Pala|pala]]): ${testi.REPERTI.length} reperti, dal verme al tesoro dei Gonzaga. Generato da <code>chat/testi.js</code>.` })
catalogo({ lista: testi.UFFICIO, categoria: 'Gli oggetti', attivita: 'Lo spazzino di uffici', comando: 'lavora come spazzino', attrezzo: null, qualificatore: 'ufficio', nomeLista: 'Elenco delle cose dell’ufficio', fonti: ['albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/pzkko/chat/minigiochi.js'], intro: `'''Quello che passa sul nastro''' dello [[Lo spazzino di uffici|spazzino di uffici]] (il lavoro rischioso di livello 2): ${testi.UFFICIO.length} cose, due sospette (la chiavetta e il wallet cifrato, che si aprono col [[Il decifratore|decifratore]]). Generato da <code>chat/testi.js</code>.` })
rinvio('I pesci', 'Elenco dei pesci')
rinvio('I reperti', 'Elenco dei reperti')
rinvio('Le cose dell’ufficio', 'Elenco delle cose dell’ufficio')

// ---------------------------------------------------------------------------------------------------- i mestieri
const F_MEST = ['albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/pzkko/chat/comandi/lavoro.js', 'albertopecchini.it/pzkko/chat/minigiochi.js']
const GIOCHI = { strada: 'la strada (le svolte della consegna, con le frecce)', memoria: 'memoria (ricordare la sequenza)', ordine: 'ordine (mettere in fila)', colori: 'colori (il colore giusto)', riscrivi: 'riscrivi (ricopiare in fretta)', icona: 'icona (trovare quella giusta)', veloce: 'veloce (premere al momento giusto)', contrario: 'contrario (la parola al contrario)', conti: 'conti (un calcolo a mente)', anagramma: 'anagramma', quiz: 'quiz (una domanda)', calcio: 'calcio (il rigore, con le frecce)', nastro: 'il nastro (12 cose che passano, al più tre in tasca)' }
const T_MEST = {}
for (const m of testi.MESTIERI) T_MEST[m.id] = cosa(titoloDa(m.nome), m.nome, 'mestiere')
for (const m of testi.MESTIERI) {
  VOCI[T_MEST[m.id]] = { data: m.rischio ? '2026-10-26' : '2026-10-22', fonti: F_MEST, testo: `{{Infobox
| titolo = ${esc(m.nome)}
| immagine = ${icone.esiste(m.id) ? icone.src(m.id) : ''}
| id = <code>${m.id}</code>
| dal livello = ${m.liv}
| paga a turno = ${pzk(m.paga)} (prima del moltiplicatore)
| minigioco = ${GIOCHI[m.gioco] ?? m.gioco}
${m.rischio ? `| rischio = ${Math.round(m.rischio * 100)} % a turno di essere preso\n| galera = ${m.galera} ore\n| multa = ${pzk(m.multa)} puliti\n` : '| rischio = nessuno: un mestiere onesto\n'}}}
'''${esc(maiuscola(m.nome))}''' è uno dei ${testi.MESTIERI.length} [[I mestieri|mestieri]] della [[La chat col bot|chat]]: si prende dal livello ${m.liv} con <code>lavora come ${m.id}</code> e ogni turno (<code>lavora</code>) paga ${pzk(m.paga)}, moltiplicati per il livello e i [[I bonus|bonus]]. Il bot lo descrive così: «${esc(m.frase)}».

== Il turno ==
Ogni turno è un minigioco: ${GIOCHI[m.gioco] ?? m.gioco}. Vinto, arriva la paga e l’esperienza; perso, niente. Poi c’è un’attesa prima del turno dopo (le attese le tiene la [[La banca sul server|banca]]). ${m.rischio ? `\n\n== Il rischio ==\nÈ un [[I lavori rischiosi|lavoro rischioso]]: a ogni turno c’è il ${Math.round(m.rischio * 100)} % di essere presi (il bot lo dice prima, e si può lasciar stare). Presi: niente paga, la roba sequestrata, ${m.galera} ore di [[La galera|galera]] e ${pzk(m.multa)} puliti di multa alla [[La cassa di pzk|cassa]]. Serve il [[Il conto|conto]].${m.id === 'spazzino' ? ' Il rischio cresce del 15 % per ogni chiavetta o wallet tenuto in tasca: vedi [[Lo spazzino di uffici]].' : ''}` : ''}

{{Vedi anche|Elenco dei mestieri|Il lavoro|I minigiochi della chat}}
[[Categoria:I mestieri]]` }
}
VOCI['Elenco dei mestieri'] = { data: '2026-10-26', fonti: F_MEST, testo: `'''I ${testi.MESTIERI.length} mestieri''' della chat col bot, per livello: dodici onesti di partenza, quattro aggiunti il 26.10 e quattro [[I lavori rischiosi|rischiosi]] che pagano tanto ma possono finire in [[La galera|galera]]. La paga è a turno, prima del moltiplicatore del livello e dei bonus. Generato da <code>chat/testi.js</code>.

${tabella(['', 'mestiere', 'dal livello', 'paga', 'minigioco', 'rischio', 'galera', 'multa', 'il bot dice'], testi.MESTIERI.slice().sort((a, b) => a.liv - b.liv || a.paga - b.paga).map((m) => riga([icona(m.id, 40), link(T_MEST[m.id], m.nome), m.liv, pzk(m.paga), m.gioco, m.rischio ? `${Math.round(m.rischio * 100)} %` : '—', m.galera ? `${m.galera} h` : '—', m.multa ? pzk(m.multa) : '—', esc(m.frase)])))}

{{Vedi anche|Il lavoro|I lavori rischiosi|I minigiochi della chat}}
[[Categoria:I mestieri]]` }

// ---------------------------------------------------------------------------------------------------- le side quest, con la storia a bivi
const F_QUEST = ['albertopecchini.it/pzkko/chat/missioni-dati.js', 'albertopecchini.it/pzkko/chat/missioni-altre.js', 'albertopecchini.it/pzkko/chat/missioni.js']
const T_QUEST = {}
for (const q of missioni.MISSIONI) T_QUEST[q.id] = cosa(q.nome, q.nome, 'quest')
const nomeOgg = (id) => (T_OGG[id] ? link(T_OGG[id], testi.nomeDi(id)) : testi.nomeDi(id))
for (const q of missioni.MISSIONI) {
  const nodi = Object.entries(q.nodi ?? {})
  const scelta = (s) => `${esc(s.eti)}${s.vai ? ` → ''${esc(s.vai)}''` : ''}${s.costo ? ` (costa ${pzk(s.costo)})` : ''}${s.perde ? ` (perde ${pzk(s.perde)})` : ''}${s.caso ? ` (va bene il ${Math.round(s.caso.p * 100)} %, se no → ''${esc(s.caso.ko)}'')` : ''}${s.richiede ? ` (serve ${[].concat(s.richiede).map(nomeOgg).join(', ')})` : ''}${s.consuma ? ` (consuma ${[].concat(s.consuma).map(nomeOgg).join(', ')})` : ''}`
  VOCI[T_QUEST[q.id]] = { data: missioni.MISSIONI.indexOf(q) < 5 ? '2026-10-23' : '2026-10-26', fonti: F_QUEST, testo: `{{Infobox
| titolo = ${esc(q.nome)}
| immagine = ${icone.esiste(q.icona) ? icone.src(q.icona) : ''}
| id = <code>${q.id}</code>
| in breve = ${esc(q.breve)}
| dal livello = ${q.liv}
| serve = ${q.richiede?.length ? q.richiede.map(nomeOgg).join(', ') : 'niente'}
| consuma = ${q.consuma?.length ? q.consuma.map(nomeOgg).join(', ') : 'niente'}
| premio = ${pzk(q.premio.pzk)}, ${q.premio.xp} xp${q.premio.oggetto ? `, ${nomeOgg(q.premio.oggetto)}` : ''}
| bivi = ${nodi.length} passi, ${nodi.filter(([, n]) => n.fine).length} finali
}}
'''${esc(q.nome)}''' è una delle ${missioni.MISSIONI.length} [[Le side quest|side quest]] della [[La chat col bot|chat]] (<code>quest ${q.id}</code>, o la [[Quest (app)|app quest]] del cercapersone): «${esc(q.breve)}». Si prende dal livello ${q.liv}${q.richiede?.length ? ` e serve ${q.richiede.map(nomeOgg).join(', ')}` : ', senza oggetti per cominciare'}. Alla fine: ${pzk(q.premio.pzk)}, ${q.premio.xp} punti esperienza${q.premio.oggetto ? ` e ${nomeOgg(q.premio.oggetto)}` : ''}.

== La storia, passo per passo ==
I passi sono quelli di <code>chat/missioni-${missioni.MISSIONI.indexOf(q) < 5 ? 'dati' : 'altre'}.js</code>; ogni scelta dice dove porta (→), cosa costa e cosa rischia. Le scelte le giudica la [[La banca sul server|banca]], sul server.
${nodi.map(([k, n]) => `; ''${esc(k)}''${n.fine ? ' (fine)' : ''} : ${esc(n.t)}${n.scelte?.length ? `\n${n.scelte.map((s) => `* ${scelta(s)}`).join('\n')}` : ''}`).join('\n')}

{{Vedi anche|Elenco delle side quest|Le side quest|Quest (app)}}
[[Categoria:Le side quest]]` }
}
VOCI['Elenco delle side quest'] = { data: '2026-10-26', fonti: F_QUEST, testo: `'''Le ${missioni.MISSIONI.length} side quest''' della chat: cinque dal 23.10 (le storie del muro: il civico 28, il pomodoro, la petizione, il Landini, il drago) e otto dal 26.10 («altre side quest», Alberto), tutte senza oggetti per cominciare. Ogni voce ha la storia intera a bivi. Generato da <code>chat/missioni-dati.js</code> e <code>chat/missioni-altre.js</code>.

${tabella(['', 'quest', 'in breve', 'livello', 'serve', 'premio', 'passi'], missioni.MISSIONI.map((q) => riga([icona(q.icona, 40), link(T_QUEST[q.id], q.nome), esc(q.breve), q.liv, q.richiede?.length ? q.richiede.map(nomeOgg).join(', ') : '—', `${pzk(q.premio.pzk)}, ${q.premio.xp} xp${q.premio.oggetto ? `, ${nomeOgg(q.premio.oggetto)}` : ''}`, Object.keys(q.nodi ?? {}).length])))}

{{Vedi anche|Le side quest|Quest (app)|I traguardi}}
[[Categoria:Le side quest]]` }

// ---------------------------------------------------------------------------------------------------- le squadre di virtual
const F_SQ = ['albertopecchini.it/pzkko/games/virtual/squadre.js', 'albertopecchini.it/pzkko/games/virtual/partita.js']
const T_SQ = {}
for (const s of squadre.SQUADRE) T_SQ[s.id] = cosa(s.nome, s.nome, 'squadra')
const CLIMA = { nord: 'nord (nebbia e pioggia d’autunno, neve d’inverno)', sud: 'sud (sereno quasi sempre)', centro: 'centro', liguria: 'liguria (mare e pioggia)', isole: 'isole' }
for (const s of squadre.SQUADRE) {
  const stemma = squadre.stemmaSVG ? '' : ''
  VOCI[T_SQ[s.id]] = { data: '2026-10-31', fonti: F_SQ, testo: `{{Infobox
| titolo = ${esc(s.nome)}
| sigla = ${s.sigla}
| città = ${esc(s.citta)}
| serie = ${s.serie === 'A' ? 'Serie A' : 'Serie B'} 2026/27
| forza = ${s.forza} su 100
| clima = ${CLIMA[s.clima] ?? s.clima}
| maglia di casa = ${s.casa.join(' e ')} (${s.disegno})
| maglia di trasferta = ${s.fuori.join(' e ')}
| stemma = ${s.stemma.forma}, ${s.stemma.simbolo}
| id = <code>${s.id}</code>
}}
'''${esc(s.nome)}''' (${s.sigla}) è una delle ${squadre.SQUADRE.length} squadre di [[Virtual]], il campionato inventato di pzkko: la versione storpiata ma riconoscibile della squadra di ${esc(s.citta)} in ${s.serie === 'A' ? 'Serie A' : 'Serie B'} 2026/27, con una '''forza di ${s.forza}''' su 100 presa dalla realtà. Lo stemma è disegnato in SVG dal codice (<code>stemmaSVG</code> in <code>games/virtual/squadre.js</code>): ${s.stemma.forma} con ${s.stemma.simbolo}, fondo ${s.stemma.fondo} e tinta ${s.stemma.tinta}; mai il logo vero.

== In campo ==
La maglia di casa è ${s.casa[0]} e ${s.casa[1]} (${s.disegno}); in trasferta ${s.fuori[0]} e ${s.fuori[1]}, se la prima somiglia a quella di casa. Il meteo delle partite in casa segue il clima «${s.clima}» e la stagione ([[Lo schermino di virtual]]). I cognomi dei giocatori sono sillabe italiane a caso. Dal 31.10 le [[Le quote di virtual|quote]] e i gol seguono la forza: con 4 punti di fattore campo, due Poisson e il margine del 6,5 %.

{{Vedi anche|Elenco delle squadre di virtual|Virtual|Il calendario di virtual}}
[[Categoria:Le squadre di virtual]]` }
}
VOCI['Elenco delle squadre di virtual'] = { data: '2026-10-31', fonti: F_SQ, testo: `'''Le ${squadre.SQUADRE.length} squadre''' di [[Virtual]]: le venti di Serie A e le venti di Serie B 2026/27 coi nomi storpiati ma riconoscibili, la città, la forza da 1 a 100 presa dalla realtà e il clima della città (che decide il meteo dello schermino). Gli accoppiamenti: A contro A il 52 %, B contro B il 34 %, un incrocio il 14 %. Generato da <code>games/virtual/squadre.js</code>.

== Serie A ==
${tabella(['squadra', 'sigla', 'città', 'forza', 'clima', 'maglia di casa'], squadre.SQUADRE.filter((s) => s.serie === 'A').sort((a, b) => b.forza - a.forza).map((s) => riga([link(T_SQ[s.id], s.nome), s.sigla, esc(s.citta), s.forza, s.clima, `${s.casa.join(' / ')} (${s.disegno})`])))}

== Serie B ==
${tabella(['squadra', 'sigla', 'città', 'forza', 'clima', 'maglia di casa'], squadre.SQUADRE.filter((s) => s.serie === 'B').sort((a, b) => b.forza - a.forza).map((s) => riga([link(T_SQ[s.id], s.nome), s.sigla, esc(s.citta), s.forza, s.clima, `${s.casa.join(' / ')} (${s.disegno})`])))}

{{Vedi anche|Virtual|Le quote di virtual|Lo schermino di virtual}}
[[Categoria:Le squadre di virtual]]` }

// ---------------------------------------------------------------------------------------------------- la miniera
const F_MIN = ['albertopecchini.it/pzkko/chat/miniera-dati.mjs', 'albertopecchini.it/pzkko/chat/miniera.js', 'albertopecchini.it/pzkko/chat/miniera-pixel.js']
const CAT = Object.fromEntries(miniera.CATEGORIE.map((c) => [c.id, c]))
const T_MIN = {}
for (const p of miniera.PEZZI) T_MIN[p.id] = cosa(titoloDa(p.nome), p.nome, 'miniera')
for (const p of miniera.PRONTI) T_MIN[p.id] = cosa(maiuscola(p.nome), p.nome, 'PC pronto')
const statsTesto = (s) => Object.entries(s ?? {}).map(([k, v]) => `${k} ${typeof v === 'number' ? n_(v) : v}`).join(' · ') || '—'
for (const p of miniera.PEZZI) {
  VOCI[T_MIN[p.id]] = { data: '2026-10-23', fonti: F_MIN, testo: `{{Infobox
| titolo = ${esc(p.nome)}
| categoria = ${link('Elenco dei pezzi della miniera', CAT[p.cat]?.nome ?? p.cat)}
| id = <code>${p.id}</code>
| prezzo = ${pzk(p.prezzo)}
| livello = ${p.livello}
| numeri = ${statsTesto(p.stats)}
| disegno = ${Object.entries(p.vista ?? {}).map(([k, v]) => `${k} ${v}`).join(', ') || '—'}
}}
'''${esc(maiuscola(p.nome))}''' è un pezzo della [[La miniera|miniera]] di pzkko (categoria «${CAT[p.cat]?.nome ?? p.cat}», livello ${p.livello}): si compra a ${pzk(p.prezzo)} nella [[Miniera (app)|app miniera]] del cercapersone e si monta nella postazione. Il bot lo descrive così: «${esc(p.descr)}».

== I numeri ==
${Object.entries(p.stats ?? {}).map(([k, v]) => `* '''${k}''': ${typeof v === 'number' ? n_(v) : esc(v)}`).join('\n') || '—'}

Tutto si incastra: il case sta sul tavolo se è abbastanza largo, le schede lunghe solo nei case che le tengono, gli schermi quanti ne porta il tavolo; il calore delle schede contro le ventole fa la temperatura, e sopra gli 80 °C il PC rallenta. I disegni sono pixel art disegnata in codice (<code>chat/miniera-pixel.js</code>) su una griglia fissa.

{{Vedi anche|Elenco dei pezzi della miniera|La miniera|I PC pronti della miniera}}
[[Categoria:La miniera]]` }
}
const perOra = (p) => ''
for (const p of miniera.PRONTI) {
  const pezzi = Object.entries(p.pezzi).map(([cat, v]) => ({ cat, id: typeof v === 'string' ? v : v.id, n: typeof v === 'string' ? 1 : v.n }))
  const listino = pezzi.reduce((s, x) => s + (miniera.PER_ID[x.id]?.prezzo ?? 0) * x.n, 0)
  VOCI[T_MIN[p.id]] = { data: '2026-10-23', fonti: F_MIN, testo: `{{Infobox
| titolo = ${esc(p.nome)}
| id = <code>${p.id}</code>
| pezzi = ${pezzi.length}
| listino = ${pzk(listino)}
| sconto = ${Math.round(p.sconto * 100)} %
| prezzo = ${pzk(Math.round(listino * (1 - p.sconto)))}
}}
'''${esc(maiuscola(p.nome))}''' è uno degli ${miniera.PRONTI.length} [[I PC pronti della miniera|PC pronti]] della [[La miniera|miniera]]: si compra e si monta in un colpo, con lo sconto del ${Math.round(p.sconto * 100)} % sul listino dei pezzi (${pzk(listino)} → ${pzk(Math.round(listino * (1 - p.sconto)))}). «${esc(p.descr)}»

== I pezzi ==
${tabella(['categoria', 'pezzo', 'quanti', 'prezzo'], pezzi.map((x) => riga([CAT[x.cat]?.nome ?? x.cat, T_MIN[x.id] ? link(T_MIN[x.id], miniera.PER_ID[x.id]?.nome ?? x.id) : x.id, x.n, pzk((miniera.PER_ID[x.id]?.prezzo ?? 0) * x.n)])))}

{{Vedi anche|I PC pronti della miniera|Elenco dei pezzi della miniera|La miniera}}
[[Categoria:La miniera]]` }
}
VOCI['Elenco dei pezzi della miniera'] = { data: '2026-10-23', fonti: F_MIN, testo: `'''I ${miniera.PEZZI.length} pezzi''' della [[La miniera|miniera]] in ${miniera.CATEGORIE.length} categorie (${miniera.CATEGORIE.map((c) => c.nome + (c.obbligatoria ? '' : ', facoltativa') + (c.multipla ? ', anche più d’uno' : '')).join('; ')}), su cinque livelli, e gli ${miniera.PRONTI.length} PC pronti. Generato da <code>chat/miniera-dati.mjs</code>.

${miniera.CATEGORIE.map((c) => `== ${maiuscola(c.nome)}${c.obbligatoria ? '' : ' (facoltativa)'} ==\n${tabella(['pezzo', 'livello', 'prezzo', 'numeri', 'cos’è'], miniera.PEZZI.filter((p) => p.cat === c.id).map((p) => riga([link(T_MIN[p.id], p.nome), p.livello, pzk(p.prezzo), statsTesto(p.stats), esc(p.descr)])))}`).join('\n\n')}

== I PC pronti ==
${tabella(['PC', 'sconto', 'cos’è'], miniera.PRONTI.map((p) => riga([link(T_MIN[p.id], p.nome), `${Math.round(p.sconto * 100)} %`, esc(p.descr)])))}

{{Vedi anche|La miniera|Miniera (app)|I PC pronti della miniera}}
[[Categoria:La miniera]]` }

// ---------------------------------------------------------------------------------------------------- i traguardi
const F_TR = ['albertopecchini.it/pzkko/chat/traguardi.js', 'albertopecchini.it/pzkko/traguardi/traguardi.js']
const T_TR = {}
for (const t of traguardi) T_TR[t.id] = cosa(maiuscola(t.nome), t.nome, 'traguardo')
for (const t of traguardi) {
  VOCI[T_TR[t.id]] = { data: traguardi.indexOf(t) < 26 ? '2026-10-26' : '2026-10-26', fonti: F_TR, testo: `{{Infobox
| titolo = ${esc(t.nome)}
| immagine = ${icone.esiste(t.icona) ? icone.src(t.icona) : ''}
| id = <code>${t.id}</code>
| gruppo = ${GRUPPI[t.gruppo] ?? t.gruppo}
| si ottiene = ${esc(t.cosa)}
| conta = <code>${esc(t.misura)}</code> su ${n_(t.di)}
}}
'''${esc(maiuscola(t.nome))}''' è uno dei ${traguardi.length} [[I traguardi|traguardi]] (gli achievement) di pzkko, nel gruppo «${GRUPPI[t.gruppo] ?? t.gruppo}»: ${esc(t.cosa)}. Come tutti i traguardi non si salva da nessuna parte: è una funzione di <code>chat/traguardi.js</code> che legge lo [[Lo zaino|zaino]] (<code>${esc(t.misura)}</code>) e dice a che punto sei su ${n_(t.di)}, quindi vale anche se l’hai fatto prima che il traguardo esistesse. Si vede nella pagina [[Traguardi (pagina)|traguardi]] della barra in alto.

{{Vedi anche|Elenco dei traguardi|I traguardi|Lo zaino}}
[[Categoria:I traguardi]]` }
}
VOCI['Elenco dei traguardi'] = { data: '2026-10-26', fonti: F_TR, testo: `'''I ${traguardi.length} traguardi''' di pzkko (26 il 26.10 mattina, 47 la sera: «altri obbiettivi/traguardi», Alberto), per gruppo. Ognuno è una funzione che legge lo zaino e i soldi e dice a che punto sei. Generato da <code>chat/traguardi.js</code>.

${Object.entries(GRUPPI).map(([g, nome]) => `== ${maiuscola(nome)} ==\n${tabella(['', 'traguardo', 'come', 'soglia'], traguardi.filter((t) => t.gruppo === g).map((t) => riga([icona(t.icona, 40), link(T_TR[t.id], t.nome), esc(t.cosa), n_(t.di)])))}`).join('\n\n')}

{{Vedi anche|I traguardi|Traguardi (pagina)}}
[[Categoria:I traguardi]]` }

// ---------------------------------------------------------------------------------------------------- le sfide, i quiz, le foto, la lumachina
VOCI['Elenco delle sfide'] = { data: '2026-10-23', fonti: ['albertopecchini.it/pzkko/chat/sfide.js'], testo: `'''I ${sfide.length} modelli''' delle [[Le sfide giornaliere|sfide giornaliere]]: ogni giorno tre sfide (facile, media, difficile) pescate fra questi, con gli obiettivi dei tre livelli, fatte solo con quello che sai fare (niente pesca senza canna). I premi: 150 $pzk e 15 xp, 320 e 35, 650 e 70 (prima del moltiplicatore); tutte e tre insieme il bonus del giorno, 500 $pzk e una [[Cassa comune|cassa comune]]. Generato da <code>chat/sfide.js</code>.

${tabella(['', 'sfida', 'statistica', 'facile', 'media', 'difficile', 'il testo'], sfide.map((s) => riga([icona(s.icona, 40), s.id, `<code>${s.stat}</code>`, s.obiettivi[0], s.obiettivi[1], s.obiettivi[2], esc(s.testo.replace(/\$\{g\(n\)\}|\$\{n\}/g, 'N').replace(/\$\{[^}]*\}/g, '…'))])))}

{{Vedi anche|Le sfide giornaliere|Sfide (app)}}
[[Categoria:La chat]]` }

VOCI['Elenco degli argomenti dei quiz'] = { data: '2026-10-31', fonti: ['albertopecchini.it/pzkko/chat/quiz-dati.js', 'albertopecchini.it/pzkko/chat/quiz-altre.js', 'albertopecchini.it/pzkko/chat/quiz.js'], testo: `'''Gli argomenti dei [[I quiz|quiz retributivi]]''': i ${quizDati.ARGOMENTI.length} di serie (dal 23.10) più gli otto nuovi del 26.10 (geometra, informatica, storia, geografia, natura, musica, sport, matematica), «foto» (che cos’è nella foto) e «giocatori» (domande fatte col database). Dal 31.10 '''le domande non stanno più nel sito''': con le risposte giuste dentro, chi apriva la console le sapeva tutte; stanno sulla [[La banca sul server|banca]], sul pc di Alberto, che le manda una alla volta senza la giusta. Nel repository restano solo nomi e icone, per i menu.

${tabella(['', 'id', 'argomento'], quizDati.ARGOMENTI.map(([id, nome, ic]) => riga([icona(ic, 40), `<code>${id}</code>`, esc(nome)])))}

Ogni partita: 8 domande, 15 secondi l’una; ogni risposta giusta paga 20/40/80 $pzk (di più se veloce o in serie); pagano le prime 40 giuste del giorno. Un nuovo modo di rispondere dal 26.10: le VERO/FALSO. Le domande con la foto pescano i finti sbagliati nella stessa categoria ([[Elenco delle foto dei quiz]]).

{{Vedi anche|I quiz|Quiz (app)|Le foto vere dei quiz}}
[[Categoria:La chat]]` }

const foto = Object.entries(immagini.IMMAGINI)
const CATF = { mantova: 'Mantova', natura: 'natura', tech: 'tech', cibo: 'cibo', varie: 'varie', geometra: 'geometra', arte: 'arte' }
VOCI['Elenco delle foto dei quiz'] = { data: '2026-10-26', fonti: ['albertopecchini.it/pzkko/chat/immagini.js'], testo: `'''Le ${foto.length} foto vere''' dei quiz e dell’[[Foto (app)|app foto]]: da [[Wikimedia Commons]] (solo CC BY, CC BY-SA, CC0 e pubblico dominio, con autore e licenza scritti sotto) e ${foto.filter(([, x]) => x.imgur).length} da Imgur. Nel browser si caricano da lì, mai copiate nel repository; sullo [[L'lcd|schermo dello zero]] arrivano a un bit con la diffusione dell’errore. Ogni foto ha una categoria, che serve a pescare i finti sbagliati del quiz «foto». Generato da <code>chat/immagini.js</code>.

${Object.entries(CATF).map(([c, nome]) => { const l = foto.filter(([, x]) => x.cat === c); return l.length ? `== ${maiuscola(nome)} (${l.length}) ==\n${tabella(['id', 'cos’è', 'autore', 'licenza', 'pagina'], l.map(([id, x]) => riga([`<code>${id}</code>`, esc(x.cosa), esc(x.autore ?? (x.imgur ? 'Imgur' : '')), esc(x.licenza ?? ''), x.pagina ? `[${x.pagina} Commons]` : x.imgur ? `[https://i.imgur.com/${x.imgur}.jpg Imgur]` : ''])), 'wikitable stretta')}` : '' }).filter(Boolean).join('\n\n')}

{{Vedi anche|Le foto vere dei quiz|I quiz|Foto (app)}}
[[Categoria:La chat]]` }

const ev = lumaca.EVENTI
VOCI['Le giornate della lumachina'] = { data: '2026-10-23', fonti: ['albertopecchini.it/pzkko/chat/lumaca-dati.mjs', 'albertopecchini.it/pzkko/chat/lumaca.mjs'], testo: `'''Le ${ev.length} giornate''' che la [[La lumachina|lumachina]] può vivere: ${ev.filter((e) => e.pct < 0).length} negative (spende i tuoi $pzk), ${ev.filter((e) => e.pct > 0).length} positive, ${ev.filter((e) => !e.pct).length} neutre, in ${lumaca.TIPI.length} tipi (${lumaca.TIPI.join(', ')}). Ogni giornata ha la sua percentuale dei $pzk liberi del conto e la fascia di salute in cui è credibile; le catastrofi e i miracoli (±50 % e +100 %) sono rari (lo 0,5 % dei giorni per lato) e a coppie rovesciate. Generato da <code>chat/lumaca-dati.mjs</code>.

${['negative', 'positive', 'neutre'].map((k, i) => { const l = ev.filter((e) => (i === 0 ? e.pct < 0 : i === 1 ? e.pct > 0 : !e.pct)); return `== Le giornate ${k} (${l.length}) ==\n${tabella(['tipo', 'titolo', '%', 'salute', 'cos’è successo'], l.sort((a, b) => a.pct - b.pct).map((e) => riga([e.tipo, esc(e.titolo), e.pct ? `${e.pct > 0 ? '+' : ''}${e.pct} %` : '0', e.salute ? `${e.salute[0]}–${e.salute[1]}` : '—', esc(e.testo)])), 'wikitable stretta')}` }).join('\n\n')}

{{Vedi anche|La lumachina|La salute della lumachina|Giocatori (app)}}
[[Categoria:I soldi]]` }

// ---------------------------------------------------------------------------------------------------- le app (tabella)
VOCI['Le app di pzk os (tabella)'] = { data: oggi, fonti: ['albertopecchini.it/pzkko/telefono/telefono.js', 'albertopecchini.it/pzkko/telefono/zero/os/os.js'], testo: `'''Le ${app.length} app''' registrate in <code>APP</code> di <code>telefono/telefono.js</code> (da lì vengono nome e icona del menu di [[pzk os]]) più le impostazioni, che stanno in <code>os/os.js</code>. Il pallino sull’icona lo decide <code>badge</code>; le app con <code>store</code> si comprano nel [[Il pzkstore|pzkstore]] e compaiono solo se installate. Generato dal sorgente.

${tabella(['', 'id', 'nome nel menu', 'voce', 'pallino', 'dal pzkstore', 'file'], [...app.map((a) => riga([icona(a.icona, 40), `<code>${a.id}</code>`, esc(a.nome), link(APP_VOCE[a.id] ?? a.nome), a.badge ? 'sì' : '—', a.store ? 'sì' : '—', FONTI_APP(a.id).map((f) => `<code>${f.replace('albertopecchini.it/pzkko/', '')}</code>`).join(' + ')])), riga(['', '<code>impostazioni</code>', 'impostazioni', link('Impostazioni (app)'), '—', '—', '<code>telefono/zero/os/impostazioni.js</code>'])])}

{{Vedi anche|Le app di pzk os|pzk os|Il cercapersone zero}}
[[Categoria:Le app di pzk os]]` }

// ---------------------------------------------------------------------------------------------------- i commit
const log = git('log', '--date=short', '--format=%h%x09%ad%x09%s').split('\n').map((r) => r.split('\t')).filter((r) => r.length >= 3).map(([h, d, ...m]) => [h, d, m.join('\t')])
const HEAD = log[0]?.[0] ?? '?'
const perMese = new Map()
for (const [, d] of log) perMese.set(d.slice(0, 7), (perMese.get(d.slice(0, 7)) ?? 0) + 1)
VOCI['Elenco dei commit'] = { data: oggi, fonti: ['README.md'], testo: `'''I ${log.length} commit''' del [[Il repository AP|repository AP]] dal ${log.at(-1)?.[1] ?? '?'} a oggi (l’ultimo: <code>${HEAD}</code>, ${log[0]?.[1]}). La lista completa, con filtri, sta in [[Speciale:UltimeModifiche|Ultime modifiche]]; la cronologia di ogni voce (la linguetta «Cronologia») elenca i commit che hanno toccato i suoi file. Generato da <code>git log</code> ogni volta che la wiki si aggiorna.

== Per mese ==
${tabella(['mese', 'commit'], [...perMese].sort().map(([m, n]) => riga([m, n])))}

== Gli ultimi trenta ==
${log.slice(0, 30).map(([h, d, m]) => `* ${d} [https://github.com/albertoxpecchini/AP/commit/${h} ${h}] ${esc(m)}`).join('\n')}

{{Vedi anche|La storia del repository|Il repository AP|I messaggi di commit|Speciale:UltimeModifiche}}
[[Categoria:Il repository]]` }

// ---------------------------------------------------------------------------------------------------- (8) dove si vede
// (2.11) ogni voce generata ha una foto: la schermata dell'app (o la pagina) dove quella cosa compare, dalle foto di collaudo
// in pzkko/wiki/img/ (le copia foto.mjs). La sezione va prima di «Vedi anche».
const DOVE = {
  'Gli oggetti': (t, v) => (v.fonti.some((f) => f.endsWith('minigiochi.js'))
    ? ['app-chat.webp', `la chat col bot nel cercapersone zero: «${t}» passa sul nastro dello spazzino di uffici («lavora come spazzino»)`]
    : ['app-negozio.webp', `lo shop di pzk os nel cercapersone zero, dove si compra «${t}» coi $pzk puliti`]),
  'I pesci': (t) => ['app-chat.webp', `la chat col bot nel cercapersone zero: col comando «pesca» (e la canna) può uscire «${t}»`],
  'Le bestie': (t) => ['app-chat.webp', `la chat col bot nel cercapersone zero: col comando «caccia» può uscire «${t}»`],
  'I reperti': (t) => ['app-chat.webp', `la chat col bot nel cercapersone zero: col comando «scava» (e la pala) può uscire «${t}»`],
  'I mestieri': (t) => ['app-chat.webp', `la chat col bot nel cercapersone zero: «lavora come …» per prendere il mestiere, poi «lavora» per ogni turno`],
  'Le side quest': (t) => ['app-missioni.webp', `l’app quest di pzk os, dove si gioca «${t}» un bivio alla volta`],
  'Le squadre di virtual': (t) => ['virtual.webp', `la finestra di virtual sul muro: lo schermino a pixel, il tabellone, le quote e la schedina`],
  'La miniera': (t) => ['app-miniera.webp', `l’app miniera di pzk os: la postazione, i pezzi montati e quanto mina all’ora`],
  'I traguardi': (t) => ['traguardi.webp', `la pagina dei traguardi (la voce «traguardi» della barra in alto): quelli fatti e quelli da fare`],
}
const DOVE_TITOLO = {
  'Elenco delle sfide': ['app-sfide.webp', 'l’app sfide di pzk os: le tre sfide di oggi, a che punto sei, il premio'],
  'Elenco degli argomenti dei quiz': ['app-quiz.webp', 'l’app quiz di pzk os: l’ingresso con gli argomenti'],
  'Elenco delle foto dei quiz': ['app-foto.webp', 'l’app foto di pzk os: le foto dei quiz a un bit, cinque per riga'],
  'Le giornate della lumachina': ['app-giocatori.webp', 'l’app giocatori di pzk os: in «io» la salute della lumachina e le sue giornate'],
  'Le app di pzk os (tabella)': ['zero-menu.webp', 'il menu di pzk os nel cercapersone zero, con le app in fila'],
  'Elenco dei commit': ['github.webp', 'il repository AP su GitHub, con il numero dei commit'],
}
let nDove = 0
for (const [t, v] of Object.entries(VOCI)) {
  if (!v || /^#RINVIA/.test(v.testo)) continue
  const cat = /\[\[Categoria:([^\]]+)\]\]/.exec(v.testo)?.[1]
  const d = DOVE_TITOLO[t] ?? (DOVE[cat] ? DOVE[cat](t, v) : null)
  if (!d || !existsSync(join(WIKI, 'img', d[0]))) continue
  const sezione = `== Dove si vede ==\n[[File:${d[0]}|thumb|none|380px|${esc(d[1])}]]\n\n`
  const i = v.testo.indexOf('{{Vedi anche'), j = v.testo.indexOf('[[Categoria:')
  const k = i >= 0 ? i : j >= 0 ? j : v.testo.length
  v.testo = v.testo.slice(0, k) + sezione + v.testo.slice(k)
  nDove++
}
console.log(`dove si vede: ${nDove} voci con la foto dell’app`)

// ---------------------------------------------------------------------------------------------------- i rinvii
let nRinvii = 0
for (const [da, a] of RINVII) {
  if (presi.has(da) || !VOCI[a]) continue
  presi.add(da); nRinvii++
  VOCI[da] = { data: oggi, fonti: VOCI[a].fonti ?? ['albertopecchini.it/pzkko/README.md'], testo: `#RINVIA [[${a}]]` }
}
console.log(`rinvii: ${nRinvii}`)

// ---------------------------------------------------------------------------------------------------- scrivi dati.js
const righeDati = Object.entries(VOCI).map(([t, v]) => `  ${JSON.stringify(t)}: { data: ${JSON.stringify(v.data)}, fonti: ${JSON.stringify(v.fonti)}, testo: \`${v.testo.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\` },`)
await writeFile(join(WIKI, 'voci/dati.js'), `// GENERATO da tools/pzkko/wiki/genera.mjs il ${oggi}: le voci di pzkkopedia che nascono dai dati del sito (oggetti, pesci,
// bestie, reperti, cose dell'ufficio, mestieri, side quest, squadre di virtual, pezzi e PC pronti della miniera, traguardi,
// sfide, argomenti dei quiz, foto dei quiz, giornate della lumachina, le app, i commit). NON SI MODIFICA A MANO: si rilancia
// \`node tools/pzkko/wiki/genera.mjs\` (lo fa aggiorna.mjs). Il formato è in tools/pzkko/wiki/README.md.
export const VOCI = {
${righeDati.join('\n')}
}
`)
console.log(`voci/dati.js: ${Object.keys(VOCI).length} voci`)

// ---------------------------------------------------------------------------------------------------- la cronologia per voce
const moduli = { ...aMano, dati: VOCI }
const perFile = new Map()
const commitDi = (f) => {
  if (!perFile.has(f)) {
    let hs = []
    try { hs = git('log', '--format=%h', '--', f).split('\n').filter(Boolean) } catch {}
    perFile.set(f, hs)
  }
  return perFile.get(f)
}
const ordine = new Map(log.map(([h], i) => [h, i]))
const PER_VOCE = {}
let nVoci = 0, nFonti = 0
for (const voci of Object.values(moduli)) for (const [t, v] of Object.entries(voci)) {
  nVoci++
  const fonti = Array.isArray(v?.fonti) ? v.fonti : []
  // i README sono fonti deboli: un commit che tocca solo il README (quasi tutti) conta solo per le voci che hanno solo README
  const forti = fonti.filter((f) => !/README.md$/i.test(f))
  const set = new Set((forti.length ? forti : fonti).flatMap((f) => commitDi(f)))
  nFonti += fonti.length
  PER_VOCE[t] = [...set].sort((a, b) => (ordine.get(a) ?? 1e9) - (ordine.get(b) ?? 1e9))
}
await writeFile(join(WIKI, 'cronologia.js'), `// GENERATO da tools/pzkko/wiki/genera.mjs il ${oggi}: i commit del repository (dal più recente) e, per ogni voce di
// pzkkopedia, quelli che hanno toccato i file dichiarati in \`fonti\`. wiki.js lo scarica solo quando serve (la cronologia
// di una voce, le ultime modifiche, le statistiche). NON SI MODIFICA A MANO.
export const ALLINEATA = ${JSON.stringify({ commit: HEAD, data: log[0]?.[1] ?? oggi, generata: new Date().toISOString() })}
export const COMMIT = ${JSON.stringify(log)}
export const PER_VOCE = ${JSON.stringify(PER_VOCE)}
`)
console.log(`cronologia.js: ${log.length} commit, ${nVoci} voci, ${nFonti} fonti, ${perFile.size} file guardati`)

// ---------------------------------------------------------------------------------------------------- lo stato
const stato = { commit: HEAD, data: log[0]?.[1] ?? oggi, generata: new Date().toISOString(), voci: nVoci, commit_totali: log.length, moduli: Object.fromEntries(Object.entries(moduli).map(([k, v]) => [k, Object.keys(v).length])) }
await writeFile(join(WIKI, 'stato.json'), JSON.stringify(stato, null, 2) + '\n')
console.log(`stato.json: allineata a ${HEAD} (${stato.data})`)
