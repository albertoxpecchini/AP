// La miniera di $pzk (23.10): il CATALOGO dei pezzi della postazione e i PC PRONTI. Solo dati: le regole (comprare, montare,
// produrre, incassare) sono in miniera.js, il disegno in miniera-pixel.js. Il contratto comune dice quali campi ci sono:
//
// pezzo: { id, cat, nome, prezzo ($pzk), livello: 1..5, descr, stats, vista }
//   stats (i numeri delle regole; i bonus e i comfort sono frazioni che moltiplicano: 0.3 = +30 %)
//     tavolo  { posti: schermi 1..3, caseMax: il case più grande che ci sta ('medio'|'grande'|'aperto'), comfort }
//     sedia   { comfort }
//     case    { slotGpu: 1..6, slotVentole: 1..8, gpuMax: 'corta'|'media'|'lunga', raffreddamento: watt senza ventole }
//     cpu     { hash, calore: watt }          gpu { hash, calore: watt } (per scheda)
//     ram     { bonus }                       ventole { raffreddamento: watt per ventola }
//     led     { bonus } (il morale)           memoria { ore: quante ore di produzione tiene, bonus }
//     schermo { bonus per schermo }           tastiera { bonus }   mouse { bonus }
//   vista (per il disegno: SOLO questi campi e SOLO questi valori; i colori '#rrggbb' pieni)
//     tavolo { larghezza: 'piccolo'|'medio'|'grande', stile: 'legno'|'metallo'|'gaming', colore }
//     sedia { tipo: 'sgabello'|'ufficio'|'gaming'|'trono', colore }
//     case { forma: 'mini'|'medio'|'grande'|'aperto', colore, vetro }   ('aperto' = il telaio da mining, senza pannelli)
//     cpu { dissipatore: 'stock'|'torre'|'liquido' }   gpu { lunghezza: 'corta'|'media'|'lunga', ventole: 1|2|3, colore }
//     ram { colore, led, banchi: 2|4 }   ventole { colore, led }   led { colore, anche 'arcobaleno' }   memoria { tipo: 'hdd'|'ssd'|'nvme' }
//     schermo { pollici: 'piccolo'|'medio'|'grande', curvo, cornice }   tastiera { tipo: 'membrana'|'meccanica'|'rgb', colore }
//     mouse { tipo: 'base'|'gaming', colore }
//
// I PRONTI sono postazioni complete già pensate, una per tipo di PC (mini, medio, grande, aperto): i pezzi come li monta
// la postazione ({ cat: id } e, per schede video, ventole e schermi, { cat: { id, n } }) e uno sconto sui pezzi da comprare.
// Si incastrano tutti (miniera.js li controlla): sono anche i casi di prova del disegno.

/** Le categorie, cioè i posti della postazione, nell'ordine in cui si montano. multipla: se ne montano più dello stesso modello. */
export const CATEGORIE = [
  { id: 'tavolo', nome: 'tavolo', obbligatoria: true, multipla: false },
  { id: 'sedia', nome: 'sedia', obbligatoria: true, multipla: false },
  { id: 'case', nome: 'case', obbligatoria: true, multipla: false },
  { id: 'cpu', nome: 'processore', obbligatoria: true, multipla: false },
  { id: 'gpu', nome: 'scheda video', obbligatoria: false, multipla: true },
  { id: 'ram', nome: 'ram', obbligatoria: true, multipla: false },
  { id: 'ventole', nome: 'ventole', obbligatoria: false, multipla: true },
  { id: 'led', nome: 'led', obbligatoria: false, multipla: false },
  { id: 'memoria', nome: 'memoria', obbligatoria: true, multipla: false },
  { id: 'schermo', nome: 'schermo', obbligatoria: true, multipla: true },
  { id: 'tastiera', nome: 'tastiera', obbligatoria: true, multipla: false },
  { id: 'mouse', nome: 'mouse', obbligatoria: true, multipla: false },
]

const di = (cat) => (id, nome, prezzo, livello, descr, stats, vista) => ({ id, cat, nome, prezzo, livello, descr, stats, vista })
const tavolo = di('tavolo'), sedia = di('sedia'), kase = di('case'), cpu = di('cpu'), gpu = di('gpu'), ram = di('ram')
const ventole = di('ventole'), led = di('led'), memoria = di('memoria'), schermo = di('schermo'), tastiera = di('tastiera'), mouse = di('mouse')

export const PEZZI = [
  // ── i tavoli: tutte le larghezze e tutti gli stili. Più è grande, più schermi e più case ci stanno ──
  tavolo('tavolo-sagra', 'tavolino pieghevole della sagra', 90, 1, 'quello della sagra del tortello: traballa, ma un monitor e un case piccolo li regge.',
    { posti: 1, caseMax: 'medio', comfort: 0 }, { larghezza: 'piccolo', stile: 'legno', colore: '#b98a55' }),
  tavolo('tavolo-bar', 'tavolino del bar dei pensionati', 120, 1, 'in ferro, rotondo dentro e quadrato fuori: ci si gioca a briscola, adesso si mina.',
    { posti: 1, caseMax: 'medio', comfort: 0.01 }, { larghezza: 'piccolo', stile: 'metallo', colore: '#8c939c' }),
  tavolo('tavolo-cameretta', 'scrivania della cameretta', 600, 2, 'con gli adesivi delle figurine e il segno della colla: due monitor ci stanno, se non respiri.',
    { posti: 2, caseMax: 'medio', comfort: 0.02 }, { larghezza: 'medio', stile: 'legno', colore: '#d9b27c' }),
  tavolo('tavolo-scrivanina', 'scrivanina gaming', 700, 2, 'piccola ma col bordo nero e rosso: il gaming per chi abita in un monolocale a Lunetta.',
    { posti: 1, caseMax: 'medio', comfort: 0.03 }, { larghezza: 'piccolo', stile: 'gaming', colore: '#c4242b' }),
  tavolo('tavolo-officina', 'banco da lavoro dell’officina', 2500, 3, 'in ferro, con la morsa ancora attaccata e l’olio del Landini: regge anche il case grande.',
    { posti: 2, caseMax: 'grande', comfort: 0.03 }, { larghezza: 'medio', stile: 'metallo', colore: '#5d6670' }),
  tavolo('tavolo-gaming-medio', 'scrivania gaming della cameretta', 4000, 3, 'col tappetino lungo come la scrivania e il porta cuffie che nessuno usa.',
    { posti: 2, caseMax: 'grande', comfort: 0.05 }, { larghezza: 'medio', stile: 'gaming', colore: '#222230' }),
  tavolo('tavolo-cantina', 'bancone della cantina', 6000, 4, 'lungo, freddo e brutto: sopra ci sta un rig aperto, ma ci si lavora male.',
    { posti: 2, caseMax: 'aperto', comfort: 0.01 }, { larghezza: 'grande', stile: 'metallo', colore: '#474d55' }),
  tavolo('tavolo-geometra', 'scrivania del geometra', 8000, 4, 'in noce, coi cassetti pieni di planimetrie di Porto Mantovano: tre monitor e il case grande.',
    { posti: 3, caseMax: 'grande', comfort: 0.06 }, { larghezza: 'grande', stile: 'legno', colore: '#7a4a2b' }),
  tavolo('tavolo-gaming', 'scrivania gaming con le luci', 14000, 4, 'col bordo che si illumina e il buco per i cavi: si lavora meglio, giurano.',
    { posti: 3, caseMax: 'grande', comfort: 0.08 }, { larghezza: 'grande', stile: 'gaming', colore: '#18181f' }),
  tavolo('tavolo-boss', 'la scrivania del boss di Mantova', 40000, 5, 'in carbonio, larga come piazza Sordello: ci sta tutto, anche il rig aperto.',
    { posti: 3, caseMax: 'aperto', comfort: 0.1 }, { larghezza: 'grande', stile: 'gaming', colore: '#2a1238' }),

  // ── le sedie: dallo sgabello al trono, il comfort moltiplica la produzione ──
  sedia('sedia-sgabello', 'sgabello del bar', 30, 1, 'quello col cuscino rotto del bar sotto i portici: niente schienale, niente comfort.',
    { comfort: 0 }, { tipo: 'sgabello', colore: '#8a5a32' }),
  sedia('sedia-imbottita', 'sgabello imbottito', 50, 1, 'lo stesso sgabello, ma col cuscino nuovo della nonna: le prime ore volano.',
    { comfort: 0.02 }, { tipo: 'sgabello', colore: '#c23b3b' }),
  sedia('sedia-ufficio', 'sedia da ufficio che cigola', 450, 2, 'presa fuori dal Comune quando hanno cambiato gli arredi: gira, cigola, regge.',
    { comfort: 0.06 }, { tipo: 'ufficio', colore: '#3a3d48' }),
  sedia('sedia-geometra', 'sedia del geometra', 2200, 3, 'in similpelle, con la leva che la abbassa da sola: ci si siede col cappotto.',
    { comfort: 0.1 }, { tipo: 'ufficio', colore: '#1f2b47' }),
  sedia('sedia-gaming', 'sedia gaming della cameretta', 3600, 3, 'rossa e nera, coi cuscini che scivolano: sembra una macchina da corsa, ma è una sedia.',
    { comfort: 0.15 }, { tipo: 'gaming', colore: '#d12b2b' }),
  sedia('sedia-racing', 'sedia «lumaca racing»', 12000, 4, 'verde lumaca, col poggiatesta a forma di guscio: lenta fuori, velocissima dentro.',
    { comfort: 0.21 }, { tipo: 'gaming', colore: '#2fbf4a' }),
  sedia('sedia-trono', 'il trono del boss', 50000, 5, 'oro e velluto, preso all’asta di Palazzo Te: ci si siede e i $pzk arrivano da soli.',
    { comfort: 0.3 }, { tipo: 'trono', colore: '#d4a017' }),

  // ── i case: le quattro forme. Decidono quante schede video e ventole ci stanno, e quanto sono lunghe ──
  kase('case-scarpe', 'scatola da scarpe forata', 90, 1, 'un case mini fatto con la scatola delle scarpe, coi buchi fatti col cacciavite.',
    { slotGpu: 1, slotVentole: 1, gpuMax: 'corta', raffreddamento: 90 }, { forma: 'mini', colore: '#cdb48e', vetro: false }),
  kase('case-cugino', 'case medio del cugino', 600, 2, 'nero, con un graffio sul fianco e l’adesivo della LAN party del 2011.',
    { slotGpu: 2, slotVentole: 3, gpuMax: 'media', raffreddamento: 170 }, { forma: 'medio', colore: '#2b2b31', vetro: false }),
  kase('case-bar', 'mini itx da bar', 1800, 3, 'piccolo come una scatola di cioccolatini, col vetro: ci sta dietro il bancone, accanto alla macchina del caffè.',
    { slotGpu: 1, slotVentole: 2, gpuMax: 'corta', raffreddamento: 150 }, { forma: 'mini', colore: '#e6e6e6', vetro: true }),
  kase('case-vetro', 'torre col vetro', 3500, 3, 'il fianco di vetro temperato: tutti vedono dentro, quindi i cavi vanno pettinati.',
    { slotGpu: 3, slotVentole: 4, gpuMax: 'media', raffreddamento: 240 }, { forma: 'medio', colore: '#15151b', vetro: true }),
  kase('case-torre', 'big tower del geometra', 9000, 4, 'bianca, enorme, col vetro: ci stanno quattro schede video lunghe e la planimetria del garage.',
    { slotGpu: 4, slotVentole: 6, gpuMax: 'lunga', raffreddamento: 280 }, { forma: 'grande', colore: '#efefef', vetro: true }),
  kase('case-telaio', 'telaio da mining della cantina', 9000, 4, 'niente pannelli, niente vergogna: sei schede video all’aria aperta, come i salami in cantina.',
    { slotGpu: 6, slotVentole: 6, gpuMax: 'lunga', raffreddamento: 850 }, { forma: 'aperto', colore: '#7a7f88', vetro: false }),
  kase('case-boss', 'big tower del boss', 24000, 5, 'nera e viola, col vetro su tre lati e il nome del boss inciso: quattro schede e otto ventole.',
    { slotGpu: 4, slotVentole: 8, gpuMax: 'lunga', raffreddamento: 380 }, { forma: 'grande', colore: '#1b1026', vetro: true }),
  kase('case-rig', 'il rig aperto della lumaca', 30000, 5, 'il telaio verde lumaca, in alluminio: sei schede, otto ventole, e la chiocciolina che controlla.',
    { slotGpu: 6, slotVentole: 8, gpuMax: 'lunga', raffreddamento: 1000 }, { forma: 'aperto', colore: '#2fbf4a', vetro: false }),

  // ── i processori: il hash di base. Il dissipatore aiuta un po' a raffreddare ──
  cpu('cpu-nonno', 'processore del nonno', 320, 1, 'un dual core del 2009, preso dal computer della farmacia: lento ma onesto.',
    { hash: 65, calore: 65 }, { dissipatore: 'stock' }),
  cpu('cpu-quattro', 'quattro core di Mantova', 1300, 2, 'quattro core, uno per quartiere: Centro, Lunetta, Valletta e Cittadella.',
    { hash: 110, calore: 85 }, { dissipatore: 'stock' }),
  cpu('cpu-otto', 'otto core col torrione', 4000, 3, 'col dissipatore a torre alto come il Torrazzo (quasi): scalda, ma ha dove sfogarsi.',
    { hash: 165, calore: 110 }, { dissipatore: 'torre' }),
  cpu('cpu-geometra', 'core i9 del geometra', 9500, 4, 'quello che il geometra usa per aprire una mail: qui finalmente lavora.',
    { hash: 230, calore: 150 }, { dissipatore: 'torre' }),
  cpu('cpu-acquario', 'sedici core a liquido', 14000, 4, 'col liquido verde nei tubi, che sembra l’acquario del dentista: un po’ più veloce e molto più fresco.',
    { hash: 250, calore: 165 }, { dissipatore: 'liquido' }),
  cpu('cpu-boss', 'threadripper del boss', 28000, 5, 'sessantaquattro core e un radiatore a liquido: il boss non aspetta, nemmeno il bot.',
    { hash: 330, calore: 210 }, { dissipatore: 'liquido' }),

  // ── le schede video: il grosso del hash e del calore. Le lunghe stanno solo nei case grandi e nei rig ──
  gpu('gpu-bar', 'scheda video del bar', 900, 1, 'corta, con una ventola sola: faceva girare il televisore delle partite.',
    { hash: 80, calore: 70 }, { lunghezza: 'corta', ventole: 1, colore: '#3c3c3c' }),
  gpu('gpu-cameretta', 'gtx della cameretta', 2000, 2, 'corta e con due ventole: ci giocavi a Fortnite, adesso paga la bolletta.',
    { hash: 130, calore: 100 }, { lunghezza: 'corta', ventole: 2, colore: '#1f1f1f' }),
  gpu('gpu-cugino', 'rx del cugino', 2500, 2, 'rossa, media, presa usata dal cugino che «non ci giocava più».',
    { hash: 150, calore: 115 }, { lunghezza: 'media', ventole: 2, colore: '#b3242b' }),
  gpu('gpu-itx', 'rtx tascabile', 4800, 3, 'corta come una merendina e veloce come una media: fatta apposta per i case mini.',
    { hash: 190, calore: 130 }, { lunghezza: 'corta', ventole: 2, colore: '#e6e6e6' }),
  gpu('gpu-geometra', 'rtx del geometra', 5500, 3, 'media, due ventole, ancora con la pellicola sopra: il geometra non l’ha mai accesa.',
    { hash: 220, calore: 150 }, { lunghezza: 'media', ventole: 2, colore: '#2b2b2b' }),
  gpu('gpu-lumaca-80', 'lumaca rtx 4080', 12000, 4, 'lunga, tre ventole, il guscio sul dorso: la sorella minore, ma solo di poco.',
    { hash: 300, calore: 230 }, { lunghezza: 'lunga', ventole: 3, colore: '#2fbf4a' }),
  gpu('gpu-rtx-lumaca', 'lumaca rtx 4090', 24000, 5, 'la regina: lunghissima, tre ventole, scalda come una stufa a legna. Nei case mini non ci sta.',
    { hash: 380, calore: 290 }, { lunghezza: 'lunga', ventole: 3, colore: '#151515' }),

  // ── la ram: un kit, un bonus piccolo ──
  ram('ram-cassetto', '4 GB trovati nel cassetto', 70, 1, 'due banchi verdi senza nome: erano nel cassetto con le pile scariche.',
    { bonus: 0 }, { colore: '#2c6b35', led: false, banchi: 2 }),
  ram('ram-16', '16 GB del cugino', 300, 2, 'due banchi neri, con l’etichetta scritta a penna: «funzionano».',
    { bonus: 0.02 }, { colore: '#1c1c1c', led: false, banchi: 2 }),
  ram('ram-led', '32 GB coi led', 1700, 3, 'due banchi soli, ma illuminati: si vede dal vetro che stai lavorando.',
    { bonus: 0.05 }, { colore: '#202028', led: true, banchi: 2 }),
  ram('ram-alette', '32 GB con le alette', 1200, 3, 'quattro banchi rossi con le alette: non servono, ma fanno sembrare tutto più veloce.',
    { bonus: 0.04 }, { colore: '#b52f2f', led: false, banchi: 4 }),
  ram('ram-rgb', '64 GB rgb', 4500, 4, 'quattro banchi bianchi che cambiano colore: la ram da discoteca.',
    { bonus: 0.07 }, { colore: '#e3e3e3', led: true, banchi: 4 }),
  ram('ram-boss', '128 GB del boss', 18000, 5, 'quattro banchi dorati: tiene a mente tutti i $pzk di Mantova.',
    { bonus: 0.1 }, { colore: '#d4a017', led: true, banchi: 4 }),

  // ── le ventole: watt di calore portati via, per ventola (quante ne stanno lo dice il case) ──
  ventole('vent-otto', 'ventolina da 8 cm', 40, 1, 'gira, fa rumore come un motorino, raffredda poco: meglio di niente.',
    { raffreddamento: 30 }, { colore: '#232323', led: false }),
  ventole('vent-silenziosa', '12 cm silenziosa', 200, 2, 'marrone e beige, bruttissima e silenziosissima: quella che consigliano tutti sui forum.',
    { raffreddamento: 50 }, { colore: '#7a5a43', led: false }),
  ventole('vent-rgb', '12 cm rgb', 700, 3, 'bianca, con l’anello di luce: raffredda e fa scena.',
    { raffreddamento: 75 }, { colore: '#f2f2f2', led: true }),
  ventole('vent-lumaca', '14 cm della lumaca', 2000, 4, 'verde, con le pale a spirale come un guscio: gira piano e porta via tanto.',
    { raffreddamento: 105 }, { colore: '#2fbf4a', led: true }),
  ventole('vent-turbina', 'turbina del boss', 5000, 5, 'dorata, con le pale da elicottero: se apri la finestra decolla la stanza.',
    { raffreddamento: 140 }, { colore: '#d4a017', led: true }),

  // ── i led: il morale (un bonus piccolo) ──
  led('led-rosso', 'striscia led rossa del mercato', 30, 1, 'presa al mercato del giovedì: metà si accende, metà no.',
    { bonus: 0.01 }, { colore: '#ff2b2b' }),
  led('led-blu', 'led blu pzkko', 150, 2, 'il blu dell’insegna al neon della serranda: si lavora come al civico 28.',
    { bonus: 0.02 }, { colore: '#2b6bff' }),
  led('led-verde', 'led verde del wallet', 600, 3, 'il verde dei due schermi del portafoglio: ogni $pzk minato si vede.',
    { bonus: 0.03 }, { colore: '#3cff6a' }),
  led('led-viola', 'led viola da discoteca', 2200, 4, 'quelli del Vertigo di una volta: la postazione sembra un sabato sera.',
    { bonus: 0.04 }, { colore: '#b04aff' }),
  led('led-arcobaleno', 'led arcobaleno', 6500, 5, 'tutti i colori, uno dopo l’altro: il morale del boss non scende mai.',
    { bonus: 0.05 }, { colore: 'arcobaleno' }),

  // ── la memoria: quante ore di produzione tiene prima di riempirsi (poi la miniera si ferma finché non incassi) ──
  memoria('mem-ticchetta', 'hard disk che ticchetta', 90, 1, 'fa tic-tic-tic tutta la notte: tiene poco, ma tiene.',
    { ore: 6, bonus: 0 }, { tipo: 'hdd' }),
  memoria('mem-hdd', '2 TB del cugino', 400, 2, 'un disco vero, con dentro le foto delle vacanze del cugino: non cancellarle.',
    { ore: 8, bonus: 0.01 }, { tipo: 'hdd' }),
  memoria('mem-ssd', 'ssd sata', 1500, 3, 'niente pezzi che girano, niente tic-tic: la miniera tiene più a lungo e va un po’ più svelta.',
    { ore: 9, bonus: 0.03 }, { tipo: 'ssd' }),
  memoria('mem-nvme', 'nvme della lumaca', 5000, 4, 'piccolo come una gomma da masticare, veloce come la lumaca quando ha fame.',
    { ore: 10, bonus: 0.05 }, { tipo: 'nvme' }),
  memoria('mem-boss', 'nvme del boss', 15000, 5, 'col dissipatore dorato: tiene mezza giornata di $pzk senza fiatare.',
    { ore: 12, bonus: 0.07 }, { tipo: 'nvme' }),

  // ── gli schermi: tutte le misure, curvi e no. Il bonus è per schermo (quanti ne stanno lo dice il tavolo) ──
  schermo('schermo-ragioniere', 'monitor del ragioniere', 120, 1, 'piccolo, beige, col bordo spesso un dito: ci si vedono i numeri, e basta.',
    { bonus: 0.01 }, { pollici: 'piccolo', curvo: false, cornice: '#d6cdb5' }),
  schermo('schermo-curvetto', 'monitorino curvo', 300, 2, 'piccolo e curvo: non serve a niente, ma fa scena.',
    { bonus: 0.015 }, { pollici: 'piccolo', curvo: true, cornice: '#222222' }),
  schermo('schermo-24', '24 pollici del cugino', 350, 2, 'piatto, nero, con un pixel morto in alto a destra: lo chiami «il segno».',
    { bonus: 0.02 }, { pollici: 'medio', curvo: false, cornice: '#1b1b1b' }),
  schermo('schermo-27-curvo', '27 pollici curvo', 900, 3, 'curvo quanto basta per sentirsi dentro la miniera.',
    { bonus: 0.03 }, { pollici: 'medio', curvo: true, cornice: '#101014' }),
  schermo('schermo-32', '32 pollici del geometra', 4000, 4, 'grande e piatto: ci si vede tutta la planimetria del comune, e i $pzk che salgono.',
    { bonus: 0.04 }, { pollici: 'grande', curvo: false, cornice: '#2c2c2c' }),
  schermo('schermo-ultrawide', 'ultrawide curvo del boss', 7500, 5, 'grande, curvo, largo come la Fiera Millenaria: tre di fila e non vedi più il muro.',
    { bonus: 0.05 }, { pollici: 'grande', curvo: true, cornice: '#0b0b0b' }),

  // ── le tastiere ──
  tastiera('tast-supermercato', 'tastiera del supermercato', 25, 1, 'a membrana, con la «e» che si incastra: si scrive, più o meno.',
    { bonus: 0 }, { tipo: 'membrana', colore: '#e6e1d3' }),
  tastiera('tast-ufficio', 'tastiera dell’ufficio postale', 120, 2, 'nera, a membrana, consumata sulla barra spaziatrice: ha visto mille raccomandate.',
    { bonus: 0.01 }, { tipo: 'membrana', colore: '#2a2a2a' }),
  tastiera('tast-blu', 'meccanica coi tasti blu', 1100, 3, 'clic clic clic: i vicini la odiano, la produzione no.',
    { bonus: 0.03 }, { tipo: 'meccanica', colore: '#1b1b1b' }),
  tastiera('tast-geometra', 'meccanica del geometra', 2500, 4, 'bianca, coi tasti di legno di noce: si intona con la scrivania.',
    { bonus: 0.04 }, { tipo: 'meccanica', colore: '#efefef' }),
  tastiera('tast-lumaca', 'tastiera rgb della lumaca', 12000, 5, 'ogni tasto un colore, e la chiocciolina sul tasto invio.',
    { bonus: 0.06 }, { tipo: 'rgb', colore: '#121212' }),

  // ── i mouse ──
  mouse('mouse-filo', 'mouse col filo attorcigliato', 15, 1, 'il filo fa tre nodi e la rotella non gira: però clicca.',
    { bonus: 0 }, { tipo: 'base', colore: '#d9d2c2' }),
  mouse('mouse-senzafili', 'mouse senza fili', 120, 2, 'senza fili e con le pile sempre scariche: clicca quando vuole lui.',
    { bonus: 0.01 }, { tipo: 'base', colore: '#303030' }),
  mouse('mouse-gaming', 'mouse gaming della cameretta', 600, 3, 'rosso, con la luce sotto: non serve per minare, ma ti fa sentire bravo.',
    { bonus: 0.02 }, { tipo: 'gaming', colore: '#c42222' }),
  mouse('mouse-dodici', 'mouse da dodici tasti', 3200, 4, 'dodici tasti sul fianco: uno per ogni ora di miniera.',
    { bonus: 0.035 }, { tipo: 'gaming', colore: '#202020' }),
  mouse('mouse-boss', 'mouse del boss', 10000, 5, 'dorato e pesante come un fermacarte: il boss clicca una volta sola.',
    { bonus: 0.05 }, { tipo: 'gaming', colore: '#d4a017' }),
]
/** Lo stesso elenco, col nome del contratto («il catalogo»). */
export const CATALOGO = PEZZI
export const PER_ID = Object.fromEntries(PEZZI.map((x) => [x.id, x]))

/** Le postazioni già pensate: una per tipo di PC. pezzi: { cat: id } e { cat: { id, n } } per gpu, ventole e schermo; sconto sui pezzi da comprare. */
export const PRONTI = [
  { id: 'muletto', nome: 'il muletto da ufficio', sconto: 0.05, descr: 'il minimo per minare: un processore, un monitor e la scatola delle scarpe. Si ripaga in un paio di giorni.',
    pezzi: { tavolo: 'tavolo-sagra', sedia: 'sedia-sgabello', case: 'case-scarpe', cpu: 'cpu-nonno', ram: 'ram-cassetto', memoria: 'mem-ticchetta',
      schermo: { id: 'schermo-ragioniere', n: 1 }, tastiera: 'tast-supermercato', mouse: 'mouse-filo' } },
  { id: 'cameretta', nome: 'il gaming della cameretta', sconto: 0.08, descr: 'il primo PC vero: case medio, due schede video del cugino e due monitor sulla scrivania con gli adesivi.',
    pezzi: { tavolo: 'tavolo-cameretta', sedia: 'sedia-ufficio', case: 'case-cugino', cpu: 'cpu-quattro', gpu: { id: 'gpu-cugino', n: 2 }, ram: 'ram-16',
      ventole: { id: 'vent-silenziosa', n: 3 }, led: 'led-blu', memoria: 'mem-hdd', schermo: { id: 'schermo-24', n: 2 }, tastiera: 'tast-ufficio', mouse: 'mouse-senzafili' } },
  { id: 'bar', nome: 'il mini itx da bar', sconto: 0.08, descr: 'piccolo, col vetro, dietro il bancone: una scheda sola ma tascabile, e il monitorino curvo per fare scena.',
    pezzi: { tavolo: 'tavolo-bar', sedia: 'sedia-imbottita', case: 'case-bar', cpu: 'cpu-quattro', gpu: { id: 'gpu-itx', n: 1 }, ram: 'ram-led',
      ventole: { id: 'vent-rgb', n: 2 }, led: 'led-rosso', memoria: 'mem-hdd', schermo: { id: 'schermo-curvetto', n: 1 }, tastiera: 'tast-ufficio', mouse: 'mouse-gaming' } },
  { id: 'vetro', nome: 'la torre col vetro', sconto: 0.1, descr: 'il gaming serio: torre col vetro, tre rtx del geometra, la sedia da corsa e due monitor curvi.',
    pezzi: { tavolo: 'tavolo-gaming-medio', sedia: 'sedia-gaming', case: 'case-vetro', cpu: 'cpu-otto', gpu: { id: 'gpu-geometra', n: 3 }, ram: 'ram-alette',
      ventole: { id: 'vent-rgb', n: 4 }, led: 'led-verde', memoria: 'mem-ssd', schermo: { id: 'schermo-27-curvo', n: 2 }, tastiera: 'tast-blu', mouse: 'mouse-gaming' } },
  { id: 'geometra', nome: 'la workstation del geometra', sconto: 0.1, descr: 'la big tower bianca con quattro schede, tre monitor sulla scrivania di noce e la sedia che si abbassa da sola.',
    pezzi: { tavolo: 'tavolo-geometra', sedia: 'sedia-geometra', case: 'case-torre', cpu: 'cpu-geometra', gpu: { id: 'gpu-geometra', n: 4 }, ram: 'ram-alette',
      ventole: { id: 'vent-rgb', n: 6 }, led: 'led-verde', memoria: 'mem-ssd', schermo: { id: 'schermo-24', n: 3 }, tastiera: 'tast-geometra', mouse: 'mouse-senzafili' } },
  { id: 'rig', nome: 'il mining rig della cantina', sconto: 0.1, descr: 'niente fronzoli: sei lumache sul telaio aperto, lo sgabello e il monitor del ragioniere. Tutto nella produzione.',
    pezzi: { tavolo: 'tavolo-cantina', sedia: 'sedia-sgabello', case: 'case-telaio', cpu: 'cpu-quattro', gpu: { id: 'gpu-lumaca-80', n: 6 }, ram: 'ram-16',
      ventole: { id: 'vent-lumaca', n: 6 }, memoria: 'mem-hdd', schermo: { id: 'schermo-ragioniere', n: 1 }, tastiera: 'tast-supermercato', mouse: 'mouse-filo' } },
  { id: 'trono', nome: 'il trono del boss', sconto: 0.12, descr: 'la big tower del boss con quattro lumaca rtx 4090, tre ultrawide curvi, i led arcobaleno e il trono d’oro.',
    pezzi: { tavolo: 'tavolo-boss', sedia: 'sedia-trono', case: 'case-boss', cpu: 'cpu-boss', gpu: { id: 'gpu-rtx-lumaca', n: 4 }, ram: 'ram-boss',
      ventole: { id: 'vent-turbina', n: 8 }, led: 'led-arcobaleno', memoria: 'mem-boss', schermo: { id: 'schermo-ultrawide', n: 3 }, tastiera: 'tast-lumaca', mouse: 'mouse-boss' } },
  { id: 'centrale', nome: 'la centrale della lumaca', sconto: 0.12, descr: 'il massimo che si può minare: il rig aperto della lumaca con sei 4090, il trono e tutto il meglio. La lumachina approva.',
    pezzi: { tavolo: 'tavolo-boss', sedia: 'sedia-trono', case: 'case-rig', cpu: 'cpu-boss', gpu: { id: 'gpu-rtx-lumaca', n: 6 }, ram: 'ram-boss',
      ventole: { id: 'vent-turbina', n: 8 }, led: 'led-arcobaleno', memoria: 'mem-boss', schermo: { id: 'schermo-ultrawide', n: 3 }, tastiera: 'tast-lumaca', mouse: 'mouse-boss' } },
]
export const PRONTO_PER_ID = Object.fromEntries(PRONTI.map((p) => [p.id, p]))
