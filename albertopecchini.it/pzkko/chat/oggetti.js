// Il catalogo dello shop (23.10): le cose nuove, citate da Alberto nelle sue chat (il cibo dei volantini e della spazzatura,
// la roba degli annunci e degli scontrini, le cose del brand pzk), coi REPARTI dello shop e i BONUS di tutti gli oggetti.
// I vecchi (canna, caffè, casse…) restano in testi.js e prendono qui solo reparto e bonus (BONUS_VECCHI, REPARTO_VECCHI).
//
// Un bonus è una frazione che si somma: { paga: 0.15 } = +15 % su tutte le paghe, { xp: 1 } = punti esperienza doppi,
// { attese: -0.5 } = attese dimezzate, { vendita: 0.1 } = +10 % quando si vende, { morte: -0.25 } = si perde il 25 % in meno
// di $pzk quando si muore, { sfide: 0.1 } = +10 % sui premi delle sfide. Un consumabile (tipo «usa») dà il bonus per
// `effetto` ms dopo che lo si usa; una cosa da tenere (tipo «tieni») lo dà finché c'è nello zaino (se ne conta una sola).

export const REPARTI = [
  ['cibo', 'cibo e bevande', 'tortelli'],
  ['attrezzi', 'attrezzi', 'canna'],
  ['fortuna', 'fortuna', 'cassa-rara'],
  ['roba', 'la roba', 'landini'],
  ['pzk', 'cose di pzk', 'peluche'],
]

/** Reparto e bonus degli oggetti di testi.js. */
export const REPARTO_VECCHI = { canna: 'attrezzi', esca: 'attrezzi', fionda: 'attrezzi', fucile: 'attrezzi', pala: 'attrezzi', telefono: 'attrezzi', cornetto: 'fortuna', caffe: 'cibo', lattina: 'cibo', mortadella: 'cibo', gratta: 'fortuna', 'cassa-comune': 'fortuna', 'cassa-rara': 'fortuna', 'cassa-gonzaga': 'fortuna' }
export const BONUS_VECCHI = { caffe: { attese: -0.5 }, lattina: { paga: 0.1 }, mortadella: { xp: 1 } }

const pc = (n) => `${Math.round(Math.abs(n) * 100)} %`
const TESTI_BONUS = { paga: (n) => `paghe +${pc(n)}`, xp: (n) => `xp +${pc(n)}`, attese: (n) => `attese −${pc(n)}`, vendita: (n) => `vendite +${pc(n)}`, morte: (n) => `morte −${pc(n)}`, sfide: (n) => `sfide +${pc(n)}` }
/** Un bonus a parole, per le schede: «paghe +15 %», «attese −25 %»… (senza bonus: stringa vuota). */
export const testoBonus = (b) => Object.entries(b ?? {}).filter(([k, n]) => n && TESTI_BONUS[k]).map(([k, n]) => TESTI_BONUS[k](n)).join(' · ')

const MIN = 60_000
const cibo = (id, nome, prezzo, cosa, bonus, minuti) => ({ id, nome, prezzo, cosa, tipo: 'usa', reparto: 'cibo', bonus, effetto: minuti * MIN })
const cosa = (id, nome, prezzo, cosa, reparto, bonus = {}, extra = {}) => ({ id, nome, prezzo, cosa, tipo: 'tieni', unico: true, reparto, bonus, ...extra })

export const NUOVI = [
  // ── il cibo e le bevande: i volantini, la spazzatura per terra, la cucina di Mantova ──
  cibo('pzk-kola', 'pzk-kola', 180, 'la cola della banca: +15 % su tutte le paghe per 20 minuti. Per terra ne trovi sempre una lattina vuota.', { paga: 0.15 }, 20),
  cibo('estathe', 'tè freddo alla pesca', 150, 'le attese dei comandi scendono di un quarto per 15 minuti.', { attese: -0.25 }, 15),
  cibo('frutti-bosco', 'mirtilli, fragole e lamponi', 220, 'una vaschetta di frutti di bosco: punti esperienza +25 % per 20 minuti.', { xp: 0.25 }, 20),
  cibo('zucca', 'zucca mantovana', 120, 'lenta ma lunga: +5 % su tutte le paghe per un’ora.', { paga: 0.05 }, 60),
  cibo('tortelli', 'tortelli di zucca', 450, 'il piatto vero: punti esperienza +50 % e paghe +5 % per 30 minuti.', { xp: 0.5, paga: 0.05 }, 30),
  cibo('grissini', 'grissini alla pizza', 60, 'lo spuntino da 60 $pzk: punti esperienza +10 % per 10 minuti.', { xp: 0.1 }, 10),
  cibo('ramen', 'ramen box Pechino', 300, 'caldo e salato: paghe +8 % e punti esperienza +10 % per 25 minuti.', { paga: 0.08, xp: 0.1 }, 25),
  cibo('sbrisolona', 'sbrisolona', 280, 'si rompe col pugno, si mangia coi punti: punti esperienza +30 % per 15 minuti.', { xp: 0.3 }, 15),
  cibo('mostarda', 'mostarda mantovana', 260, 'dolce e piccante: paghe +10 % per 15 minuti.', { paga: 0.1 }, 15),
  cibo('pomodoro', 'pomodoro maturo', 40, 'un pomodoro da supermercato: paghe +3 % per due ore. (Non scoppia. Quasi mai.)', { paga: 0.03 }, 120),

  // ── la roba: gli annunci, i volantini, gli scontrini ──
  cosa('eastpak', 'zaino Eastpak', 700, 'indistruttibile: quello che vendi vale il 10 % in più.', 'roba', { vendita: 0.1 }),
  cosa('ciao-px', 'Piaggio Ciao PX', 1800, 'annuncio vendita, usato ma tenuto bene: le paghe valgono il 4 % in più.', 'roba', { paga: 0.04 }),
  cosa('landini', 'Landini L25 testa calda (1957)', 6000, 'il trattore col bulbo caldo: si accende col fuoco. Le paghe valgono l’8 % in più, e fai invidia.', 'roba', { paga: 0.08 }),
  cosa('stampante', 'stampante Epson ET-2825', 900, 'serbatoi a ricarica: stampi gli appunti e studi meglio, punti esperienza +5 %.', 'roba', { xp: 0.05 }),
  cosa('iphone-duo', 'iPhone Duo', 3625, 'due fotocamere e nessun dubbio: paghe +3 %, punti esperienza +3 %. Costa quanto dice il volantino.', 'roba', { paga: 0.03, xp: 0.03 }),
  cosa('stufa', 'stufa a legna', 902, 'dallo scontrino di Tecnomat (1.803,10 € per due, e ne compri una): al caldo si studia meglio, punti esperienza +4 %.', 'roba', { xp: 0.04 }),
  cosa('bonsai', 'bonsai', 450, 'dal corso di potatura: la calma di chi pota. Quando muori perdi un quarto in meno.', 'roba', { morte: -0.25 }),
  cosa('penne-bic', 'penne BIC con corda e scotch', 30, 'tre penne attaccate a un foglio: non servono a niente, ma ce le hai. Per firmare la petizione.', 'roba'),
  cosa('tucson', 'Hyundai Tucson', 12000, 'dal volantino: la macchina di chi ce l’ha fatta. Le paghe valgono il 12 % in più.', 'roba', { paga: 0.12 }),
  cosa('manuale-landini', 'manuale del Landini L25', 120, 'del 1957, con la macchia di caffè: punti esperienza +2 %.', 'roba', { xp: 0.02 }),

  // ── le cose di pzk: la spazzatura del brand, la porta, il neon, il wallet ──
  cosa('luckypzkko', 'pacchetto luckypzkko (vuoto)', 80, 'da collezione: del brand, accartocciato, per terra davanti alla saracinesca. Fumare fa male, collezionarlo no.', 'pzk'),
  cosa('gomma', 'gomma masticata', 5, 'attaccata al marciapiede da anni: non serve a niente, ma è del brand e ce l’hai.', 'pzk'),
  cosa('tombino', 'tombino con i rilievi', 500, 'in ghisa, centrato e ortogonale al marciapiede: vale il 5 % in più su quello che vendi.', 'pzk', { vendita: 0.05 }),
  cosa('lucchettone', 'lucchettone', 800, 'quello alla base della serranda: tiene chiusi anche i tuoi $pzk. Quando muori perdi il 30 % in meno.', 'pzk', { morte: -0.3 }),
  cosa('citofono', 'citofono, civico 28', 250, 'c’è scritto «chiuso». Si può suonare: serve per una side quest.', 'pzk'),
  cosa('pzkkonet', 'coperchio pzkkonet', 350, 'la connessione fittizia sul marciapiede: i premi delle sfide giornaliere valgono il 10 % in più.', 'pzk', { sfide: 0.1 }),
  cosa('portachiavi', 'portachiavi col tasto luce', 400, 'tascabile e stondato, con il tasto da premere e il display verde: attese dei comandi −5 %.', 'pzk', { attese: -0.05 }),
  cosa('petizione', 'petizione «pzkko.it è un bel sito?»', 60, 'le penne attaccate con la corda: si firma, e le firme le vedono tutti. Serve per una side quest.', 'pzk'),
  cosa('neon', 'neon pzkko', 2500, 'l’insegna al neon vero, quella blu: le paghe valgono il 6 % in più e la notte è più bella.', 'pzk', { paga: 0.06 }),
  cosa('portafoglio', 'portafoglio di pelle', 1500, 'usato e customizzato come in Fallout, coi due schermi verdi: quello che vendi vale l’8 % in più.', 'pzk', { vendita: 0.08 }),
  cosa('pager', 'cercapersone', 700, 'quello sotto il wallet, con la chiocciolina dentro: punti esperienza +3 %.', 'pzk', { xp: 0.03 }),
  cosa('peluche', 'peluche della chiocciola', 300, 'la mascotte della banca $pzk, con gli occhiali da sole: punti esperienza +3 %.', 'pzk', { xp: 0.03 }),
]
