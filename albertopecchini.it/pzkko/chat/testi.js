// Le parole del bot: i personaggi di Mantova e del muro, i posti dove cercare, i crimini, le cose che si pescano, si
// cacciano e si scavano, i mestieri, le domande dei quiz, le parole da riscrivere. Tutto in italiano, tutto di qui.
// I valori sono in $pzk prima del moltiplicatore del livello; «raro» è la probabilità relativa (peso).

// ── elemosina: chi passa sul marciapiede davanti alla saracinesca ──
export const PERSONAGGI = [
  { nome: 'la nonna di via Chiassi', si: 'ti infila {n} $pzk in mano: «comprati qualcosa di caldo»', no: 'ti guarda e dice «io alla tua età lavoravo»', oggetto: 'mortadella' },
  { nome: 'un bidello di unimore', si: 'ha trovato {n} $pzk per terra in aula magna: «tieni, tanto non sono miei»', no: '«ho solo le chiavi delle aule, vuoi quelle?»' },
  { nome: 'Virgilio (la statua di piazza Virgiliana)', si: 'scende dal piedistallo e ti dà {n} $pzk: «cantami, o diva»', no: 'resta di bronzo. Letteralmente.' },
  { nome: 'il tipo del kebab', si: '«prendi {n} $pzk, ma domani vieni a mangiare da me»', no: '«niente soldi, ma ti faccio lo sconto sulla salsa»', oggetto: 'caffe' },
  { nome: 'un turista tedesco in bici', si: '«Mantova wunderbar!» e ti lascia {n} $pzk', no: 'ti chiede dov’è il Palazzo Te e se ne va senza aspettare la risposta' },
  { nome: 'il sindaco di Mantova', si: 'ti dà {n} $pzk «per la comunicazione istituzionale»', no: '«non ho il portafoglio, ho solo la fascia»' },
  { nome: 'un rider in ritardo', si: 'ti butta {n} $pzk dalla bici senza fermarsi', no: 'ti investe quasi. Niente soldi, ma sei vivo.' },
  { nome: 'la vigilessa di piazza Sordello', si: '«questa è una multa al contrario»: {n} $pzk', no: 'ti fa la multa per accattonaggio: scherzo, ma non ti dà niente' },
  { nome: 'Rigoletto (quello della casa in piazza)', si: 'canta e ti dà {n} $pzk: «la donna è mobile, il $pzk pure»', no: 'ti rifila solo una risata gobba' },
  { nome: 'una nutria del Mincio', si: 'ti porta {n} $pzk fradici dal fiume', no: 'ti morde la scarpa e se ne va' },
  { nome: 'il prof di analisi', si: '«ecco {n} $pzk, ma prima: la derivata di x²?» — hai detto 2x in tempo', no: '«lo studente che vuole soldi senza studiare: insufficiente»' },
  { nome: 'Matti', si: '«per il mio compleanno offro io»: {n} $pzk', no: '«la torta la offri tu, ricordi?»' },
  { nome: 'la chiocciola della banca $pzk', si: 'ti stampa {n} $pzk sul momento: «freschi di zecca»', no: '«la banca non fa beneficenza. Lavora.»' },
  { nome: 'un barista di piazza Erbe', si: '«ti do {n} $pzk se mi lasci in pace»', no: '«solo se mi aiuti a portare dentro i tavolini»', oggetto: 'caffe' },
  { nome: 'un nonno al bar Sport', si: 'ha vinto a briscola e ti dà {n} $pzk: «giovane, porta fortuna»', no: '«ai miei tempi i soldi non si chiedevano»' },
  { nome: 'uno studente fuori sede', si: '«ho {n} $pzk, sono tuoi, tanto a fine mese sono a secco uguale»', no: '«fratello, sono più povero di te»' },
  { nome: 'un cane col cappotto', si: 'ha {n} $pzk nella tasca del cappotto. Non chiedere.', no: 'ti annusa e passa oltre' },
  { nome: 'il tatuatore di via Verdi', si: '«{n} $pzk, ma il prossimo tatuaggio lo fai da me»', no: '«ti tatuo un $pzk gratis, soldi no»' },
  { nome: 'una signora col carrello della spesa', si: '«tieni {n} $pzk e spostati che devo passare»', no: 'ti travolge col carrello' },
  { nome: 'un ragazzo che fa il freestyle', si: 'rima su di te e ti dà {n} $pzk per il materiale', no: 'rima su di te e basta: «stai lì come un’anfora, senza una lira, fora»' },
  { nome: 'il drago del Mincio', si: 'sputa {n} $pzk fumanti', no: 'sputa fuoco. Scappi.' },
  { nome: 'un gondoliere perso (voleva Venezia)', si: '«{n} $pzk se mi dici dov’è il Canal Grande»', no: 'si rende conto che è a Mantova e piange' },
]

// ── cerca: dove si fruga ──
export const POSTI = [
  { nome: 'la fontana di piazza Sordello', trova: 'monetine dei turisti', da: 20, a: 120 },
  { nome: 'il cassonetto dietro il kebab', trova: 'un portafoglio dimenticato (vuoto, ma con una banconota nascosta)', da: 30, a: 180, oggetto: 'tappo' },
  { nome: 'il divano della nonna', trova: 'spiccioli fra i cuscini', da: 10, a: 90 },
  { nome: 'il parcheggio di unimore', trova: 'un ticket vincente del bar', da: 20, a: 100 },
  { nome: 'la lavatrice', trova: 'quello che è rimasto nelle tasche', da: 5, a: 60 },
  { nome: 'la chiesa di Sant’Andrea', trova: 'la cassetta delle offerte… no, scherzo, trovi dei $pzk per terra', da: 15, a: 100, morte: 'il sagrestano ti becca con la mano nella cassetta. Non finisce bene.' },
  { nome: 'il Palazzo Te', trova: 'una mancia lasciata da un turista nella Sala dei Giganti', da: 40, a: 200, morte: 'un gigante affrescato ti cade addosso. Giulio Romano non scherzava.' },
  { nome: 'il Mincio', trova: 'una busta impermeabile piena di $pzk', da: 30, a: 150, morte: 'scivoli nel Mincio. L’acqua è bassa ma il fango no.' },
  { nome: 'la tua macchina', trova: '$pzk sotto il sedile', da: 10, a: 80 },
  { nome: 'il bar Sport', trova: 'il resto di qualcuno sul bancone', da: 10, a: 70, oggetto: 'caffe' },
  { nome: 'il mercato del giovedì', trova: 'una bancarella che chiude e ti regala la roba', da: 20, a: 120, oggetto: 'mortadella' },
  { nome: 'lo zaino di uno studente', trova: 'i soldi della mensa', da: 15, a: 80, morte: 'lo studente era un judoka. Ora sei una presa.' },
  { nome: 'il cimitero dei Gonzaga', trova: 'una moneta antica nel terreno', da: 50, a: 250, oggetto: 'moneta-virgilio', morte: 'un Gonzaga non gradisce. Ti maledice. Funziona.' },
  { nome: 'la Torre dell’Orologio', trova: '$pzk nascosti nel meccanismo', da: 40, a: 180, morte: 'ti sporgi troppo dalla torre. 54 metri sono tanti.' },
  { nome: 'il laghetto delle nutrie', trova: 'un orologio di valore nel fango', da: 60, a: 220, morte: 'le nutrie non erano d’accordo. Erano in trenta.' },
  { nome: 'la casa di Rigoletto', trova: 'biglietti dell’opera rivenduti', da: 20, a: 110 },
  { nome: 'un furgone dei rider', trova: 'una mancia dimenticata', da: 10, a: 90, morte: 'il furgone parte con te dentro. Si ferma a Verona. A tua insaputa.' },
  { nome: 'il tombino davanti alla saracinesca', trova: 'una banconota incastrata nella grata', da: 25, a: 150, oggetto: 'chiave-vecchia' },
  { nome: 'il distributore automatico di unimore', trova: 'il resto che non è mai uscito', da: 5, a: 60 },
  { nome: 'il Rio (il canale sotto le case)', trova: 'un sacchetto che galleggia con dentro $pzk', da: 30, a: 160, morte: 'il Rio è più profondo di quello che sembra.' },
  { nome: 'la biblioteca Teresiana', trova: 'un segnalibro che è una banconota', da: 20, a: 130 },
  { nome: 'il distributore di benzina di notte', trova: 'monete sotto la pompa', da: 10, a: 80, morte: 'fumi vicino alla pompa. Boom.' },
  { nome: 'la stazione', trova: 'un biglietto del treno rimborsabile', da: 20, a: 100, morte: 'attraversi i binari per prendere una moneta. Il regionale per Modena non si ferma.' },
  { nome: 'il campo da calcetto', trova: 'i soldi della cassa comune dimenticati in panchina', da: 30, a: 140 },
  { nome: 'il tuo letto', trova: 'nulla, ma dormi un po’', da: 0, a: 0 },
  { nome: 'il negozio chiuso dietro la saracinesca', trova: 'il fondo cassa di quando era aperto', da: 50, a: 250, oggetto: 'bottone', morte: 'la saracinesca ti si chiude sulle dita. Poi sulla testa.' },
]

// ── crimine: più rischio, più paga ──
export const CRIMINI = [
  { nome: 'rubare un gratta e vinci alla tabaccheria', da: 50, a: 300, rischio: 0.3, oggetto: 'gratta', morte: 'il tabaccaio ha la doppietta sotto il banco. Mantova profonda.' },
  { nome: 'vendere appunti di analisi falsi a unimore', da: 80, a: 350, rischio: 0.25, morte: 'gli studenti scoprono che erano gli appunti di fisica. Ti aspettano fuori.' },
  { nome: 'fare il bagarino al Festivaletteratura', da: 100, a: 450, rischio: 0.35, morte: 'una lettrice furiosa ti colpisce con l’opera omnia di Dostoevskij.' },
  { nome: 'pescare di frodo nel lago di Mezzo', da: 60, a: 280, rischio: 0.3, oggetto: 'carpa', morte: 'la guardia ittica ti ha visto. E anche il siluro, che era da 80 chili.' },
  { nome: 'taroccare il contatore della pizzeria', da: 120, a: 500, rischio: 0.4, morte: 'il contatore esplode. Con te accanto.' },
  { nome: 'rubare le bici dei turisti in piazza', da: 70, a: 320, rischio: 0.35, morte: 'la bici era di un ciclista olandese. Sono 1,98 m.' },
  { nome: 'spacciare mortadella non tracciata', da: 90, a: 400, rischio: 0.3, oggetto: 'mortadella', morte: 'i NAS. Era mortadella di Bologna, aggravante.' },
  { nome: 'fare il parcheggiatore abusivo a Palazzo Te', da: 50, a: 250, rischio: 0.25, morte: 'un SUV in retromarcia. Non ti ha visto.' },
  { nome: 'rapinare la banca $pzk', da: 300, a: 1200, rischio: 0.6, morte: 'la chiocciola della banca è lenta, ma la guardia no.' },
  { nome: 'vendere nutrie come castori', da: 80, a: 350, rischio: 0.3, oggetto: 'nutria', morte: 'la nutria non era d’accordo. I denti delle nutrie sono arancioni e lunghi.' },
  { nome: 'copiare all’esame con l’auricolare', da: 60, a: 300, rischio: 0.3, morte: 'il prof vede l’auricolare. Morte accademica, che è peggio.' },
  { nome: 'imbrogliare al blackjack della saracinesca', da: 150, a: 600, rischio: 0.45, morte: 'il croupier è una chiocciola, ma i buttafuori sono siluri.' },
]

// ── quello che si pesca nel Mincio (valore in $pzk alla vendita; peso = quanto è facile) ──
export const PESCI = [
  { id: 'alborella', nome: 'un’alborella', peso: 30, vale: 15 },
  { id: 'cavedano', nome: 'un cavedano', peso: 22, vale: 25 },
  { id: 'persico', nome: 'un persico', peso: 18, vale: 35 },
  { id: 'tinca', nome: 'una tinca', peso: 14, vale: 45 },
  { id: 'carpa', nome: 'una carpa', peso: 12, vale: 60 },
  { id: 'trota', nome: 'una trota', peso: 10, vale: 70 },
  { id: 'pescegatto', nome: 'un pesce gatto', peso: 10, vale: 55 },
  { id: 'anguilla', nome: 'un’anguilla', peso: 7, vale: 90 },
  { id: 'gambero', nome: 'un gambero killer', peso: 9, vale: 40 },
  { id: 'lucioperca', nome: 'un lucioperca', peso: 6, vale: 110 },
  { id: 'luccio', nome: 'un luccio', peso: 5, vale: 150, raro: true },
  { id: 'siluro', nome: 'un siluro', peso: 3, vale: 300, raro: true },
  { id: 'carpa-oro', nome: 'LA CARPA D’ORO DEI GONZAGA', peso: 1, vale: 1500, raro: true, leggendario: true },
  { id: 'scarpa', nome: 'una scarpa', peso: 12, vale: 2, schifo: true },
  { id: 'bottiglia', nome: 'una bottiglia di plastica', peso: 10, vale: 1, schifo: true },
  { id: 'rana', nome: 'una rana (che ti guarda male)', peso: 8, vale: 8, schifo: true },
]

// ── quello che si caccia ──
export const ANIMALI = [
  { id: 'piccione', nome: 'un piccione', peso: 30, vale: 10 },
  { id: 'cornacchia', nome: 'una cornacchia', peso: 20, vale: 15 },
  { id: 'nutria', nome: 'una nutria', peso: 22, vale: 30 },
  { id: 'anatra', nome: 'un’anatra', peso: 16, vale: 45 },
  { id: 'lepre', nome: 'una lepre', peso: 14, vale: 60 },
  { id: 'fagiano', nome: 'un fagiano', peso: 12, vale: 80 },
  { id: 'riccio', nome: 'un riccio (ahi)', peso: 10, vale: 20 },
  { id: 'volpe', nome: 'una volpe', peso: 7, vale: 120 },
  { id: 'cervo', nome: 'un cervo', peso: 4, vale: 250, raro: true },
  { id: 'cinghiale', nome: 'un cinghiale', peso: 5, vale: 200, raro: true, pericoloso: 'il cinghiale ti carica. 120 chili di rabbia.' },
  { id: 'zanzara', nome: 'una zanzara tigre (enorme)', peso: 15, vale: 3, schifo: true },
  { id: 'drago', nome: 'IL DRAGO DEL MINCIO', peso: 1, vale: 2000, raro: true, leggendario: true, pericoloso: 'il drago non si fa cacciare. Il drago caccia.' },
]

// ── quello che si scava ──
export const REPERTI = [
  { id: 'verme', nome: 'un verme', peso: 30, vale: 2, schifo: true },
  { id: 'formica', nome: 'un formicaio intero (addosso)', peso: 18, vale: 1, schifo: true },
  { id: 'sasso', nome: 'un sasso. Un sasso.', peso: 20, vale: 1, schifo: true },
  { id: 'radice', nome: 'una radice del platano', peso: 15, vale: 5 },
  { id: 'tappo', nome: 'un tappo di bottiglia del 1987', peso: 16, vale: 12 },
  { id: 'bottone', nome: 'un bottone di una divisa austriaca', peso: 12, vale: 40 },
  { id: 'osso', nome: 'un osso (di cosa, meglio non saperlo)', peso: 12, vale: 25 },
  { id: 'chiave-vecchia', nome: 'una chiave di ferro vecchia', peso: 9, vale: 60 },
  { id: 'moneta-virgilio', nome: 'una moneta con la faccia di Virgilio', peso: 7, vale: 120 },
  { id: 'fossile', nome: 'un fossile di ammonite', peso: 5, vale: 180, raro: true },
  { id: 'anfora', nome: 'un’anfora dei Gonzaga', peso: 3, vale: 400, raro: true },
  { id: 'tesoro', nome: 'IL TESORO DEI GONZAGA', peso: 1, vale: 1800, raro: true, leggendario: true },
]

// ── i mestieri: livello minimo, paga a turno (prima del moltiplicatore), il minigioco preferito ──
export const MESTIERI = [
  { id: 'rider', nome: 'rider', liv: 1, paga: 120, frase: 'consegni pizze in bici col freddo', gioco: 'strada' },
  { id: 'cameriere', nome: 'cameriere alla sagra', liv: 2, paga: 160, frase: 'porti venti piatti di tortelli di zucca alla volta', gioco: 'memoria' },
  { id: 'barista', nome: 'barista in piazza Erbe', liv: 3, paga: 200, frase: 'fai ottanta caffè prima delle nove', gioco: 'ordine' },
  { id: 'bidello', nome: 'bidello a unimore', liv: 4, paga: 240, frase: 'apri e chiudi aule tutto il giorno', gioco: 'colori' },
  { id: 'salumiere', nome: 'salumiere', liv: 5, paga: 290, frase: 'affetti la mortadella a 1 mm, non 2', gioco: 'riscrivi' },
  { id: 'tatuatore', nome: 'tatuatore', liv: 6, paga: 340, frase: 'tatui chiocciole su gente che se ne pentirà', gioco: 'icona' },
  { id: 'streamer', nome: 'streamer', liv: 7, paga: 400, frase: 'urli a uno schermo per sei ore', gioco: 'veloce' },
  { id: 'sviluppatore', nome: 'sviluppatore web', liv: 8, paga: 480, frase: 'il sito di un cliente va giù di venerdì sera', gioco: 'contrario' },
  { id: 'prof', nome: 'prof di analisi', liv: 10, paga: 560, frase: 'spieghi i limiti a chi non ne ha', gioco: 'conti' },
  { id: 'influencer', nome: 'influencer', liv: 12, paga: 650, frase: 'fotografi i tortelli invece di mangiarli', gioco: 'anagramma' },
  { id: 'avvocato', nome: 'avvocato', liv: 15, paga: 800, frase: 'difendi una nutria accusata di vandalismo', gioco: 'quiz' },
  { id: 'sindaco', nome: 'sindaco di Mantova', liv: 20, paga: 1000, frase: 'inauguri una rotonda', gioco: 'calcio' },
]

// ── il negozio: prezzo in $pzk, cosa fa ──
export const NEGOZIO = [
  { id: 'canna', nome: 'canna da pesca', prezzo: 350, cosa: 'per pescare nel Mincio (pesca). Ogni tanto si rompe.', tipo: 'attrezzo' },
  { id: 'esca', nome: 'esca viva', prezzo: 60, cosa: 'la prossima pescata pesca due volte. Si consuma.', tipo: 'usa' },
  { id: 'fionda', nome: 'fionda', prezzo: 300, cosa: 'per cacciare (caccia). Prende le bestie piccole.', tipo: 'attrezzo' },
  { id: 'fucile', nome: 'fucile da caccia', prezzo: 1500, cosa: 'per cacciare le bestie grosse (caccia): più paga, più rischio.', tipo: 'attrezzo' },
  { id: 'pala', nome: 'pala', prezzo: 300, cosa: 'per scavare (scava): vermi, monete, anfore.', tipo: 'attrezzo' },
  { id: 'telefono', nome: 'telefono', prezzo: 600, cosa: 'per postare meme (posta) e guadagnare like.', tipo: 'attrezzo' },
  { id: 'cornetto', nome: 'cornetto rosso', prezzo: 900, cosa: 'il salvavita: se muori, si crepa lui al posto dei tuoi $pzk. Uno per morte.', tipo: 'tieni' },
  { id: 'caffe', nome: 'caffè', prezzo: 250, cosa: 'le attese dei comandi dimezzate per 10 minuti.', tipo: 'usa', effetto: 10 * 60_000 },
  { id: 'lattina', nome: 'lattina che mette le ali', prezzo: 500, cosa: '+10 % su tutte le paghe per 30 minuti.', tipo: 'usa', effetto: 30 * 60_000 },
  { id: 'mortadella', nome: 'mortadella', prezzo: 200, cosa: 'punti esperienza doppi per 20 minuti.', tipo: 'usa', effetto: 20 * 60_000 },
  { id: 'gratta', nome: 'gratta e vinci', prezzo: 100, cosa: 'nove caselle: tre uguali e vinci (gratta).', tipo: 'usa' },
  { id: 'cassa-comune', nome: 'cassa comune', prezzo: 400, cosa: 'dentro: $pzk, un oggetto, o niente (apri).', tipo: 'cassa' },
  { id: 'cassa-rara', nome: 'cassa rara', prezzo: 1200, cosa: 'dentro: più $pzk, attrezzi, qualcosa di raro (apri).', tipo: 'cassa' },
  { id: 'cassa-gonzaga', nome: 'cassa dei Gonzaga', prezzo: 4000, cosa: 'dentro: il tesoro di una dinastia. O una delusione da 4.000 $pzk (apri).', tipo: 'cassa' },
]
export const PER_ID = Object.fromEntries([...NEGOZIO, ...PESCI, ...ANIMALI, ...REPERTI].map((x) => [x.id, x]))
/** Il nome di un oggetto, come si scrive nello zaino. */
export const nomeDi = (id) => PER_ID[id]?.nome?.replace(/^(un’|un |una |uno |il |la |l’)/i, '') ?? id

// ── quiz: domanda, risposte (la prima è quella giusta, poi si mescolano), difficoltà 1–3 ──
export const QUIZ = [
  ['Il fiume che fa i laghi di Mantova?', ['il Mincio', 'il Po', 'l’Adige', 'l’Oglio'], 1],
  ['Il poeta nato a Mantova (ad Andes)?', ['Virgilio', 'Dante', 'Ovidio', 'Petrarca'], 1],
  ['La famiglia che ha governato Mantova per quattro secoli?', ['i Gonzaga', 'i Medici', 'gli Sforza', 'gli Este'], 1],
  ['Il piatto tipico di Mantova?', ['i tortelli di zucca', 'i pizzoccheri', 'le orecchiette', 'la carbonara'], 1],
  ['Quanti laghi circondano Mantova?', ['tre', 'uno', 'due', 'cinque'], 1],
  ['Il palazzo con la Sala dei Giganti?', ['Palazzo Te', 'Palazzo Ducale', 'Palazzo Pitti', 'Palazzo Madama'], 2],
  ['Chi ha dipinto la Camera degli Sposi?', ['Mantegna', 'Giotto', 'Raffaello', 'Caravaggio'], 2],
  ['L’opera di Verdi ambientata a Mantova?', ['Rigoletto', 'Aida', 'Nabucco', 'La traviata'], 2],
  ['Il dolce mantovano che si rompe col pugno?', ['la sbrisolona', 'il pandoro', 'la pastiera', 'il tiramisù'], 1],
  ['La bestia col dente arancione che vive nel Mincio?', ['la nutria', 'il castoro', 'la lontra', 'il tasso'], 1],
  ['Il festival dei libri di Mantova, a settembre?', ['Festivaletteratura', 'Salone del Libro', 'Lucca Comics', 'Umbria Jazz'], 2],
  ['Chi ha progettato Palazzo Te?', ['Giulio Romano', 'Bramante', 'Palladio', 'Brunelleschi'], 3],
  ['Il quartiere di Mantova oltre il lago, dove c’è il Mantegna?', ['Cittadella', 'Lunetta', 'Borgo Virgiliana', 'Te Brunetti'], 3],
  ['La derivata di x²?', ['2x', 'x', 'x²/2', '2'], 1],
  ['Il limite di sin(x)/x per x → 0?', ['1', '0', 'infinito', 'non esiste'], 2],
  ['L’integrale di 1/x?', ['ln|x| + c', 'x² + c', '1/x² + c', 'e^x + c'], 2],
  ['Quanto fa 7 × 8?', ['56', '54', '48', '64'], 1],
  ['La radice quadrata di 169?', ['13', '12', '14', '17'], 1],
  ['Quanti bit in un byte?', ['8', '4', '16', '32'], 1],
  ['Il linguaggio che gira nel browser?', ['JavaScript', 'Python', 'Java', 'C'], 1],
  ['Il tag HTML per un link?', ['<a>', '<link>', '<href>', '<url>'], 2],
  ['Il codice HTTP di «non trovato»?', ['404', '500', '200', '301'], 1],
  ['Un hash a 256 bit molto usato?', ['SHA-256', 'MD5', 'CRC32', 'ROT13'], 2],
  ['In CSS, come si centra un flex orizzontalmente?', ['justify-content: center', 'align-items: center', 'text-align: center', 'margin: center'], 3],
  ['Il modello di gpt che disegna le immagini di pzkko?', ['gpt-image-2', 'DALL·E 1', 'Stable Diffusion', 'Midjourney'], 3],
  ['Quante carte in un mazzo da poker senza jolly?', ['52', '40', '54', '48'], 1],
  ['Quanto paga un numero pieno alla roulette?', ['35 a 1', '17 a 1', '36 a 1', '30 a 1'], 2],
  ['Nel blackjack, quanto vale l’asso?', ['1 o 11', '1', '11', '10'], 1],
  ['La probabilità di fare 7 con due dadi?', ['1/6', '1/12', '1/36', '1/7'], 2],
  ['In quale anno è morto Virgilio?', ['19 a.C.', '44 a.C.', '14 d.C.', '70 a.C.'], 3],
  ['La capitale dell’Australia?', ['Canberra', 'Sydney', 'Melbourne', 'Perth'], 2],
  ['Il pianeta più grande del sistema solare?', ['Giove', 'Saturno', 'Terra', 'Nettuno'], 1],
  ['L’elemento con simbolo Fe?', ['il ferro', 'il fluoro', 'il fosforo', 'il francio'], 1],
  ['Chi ha scritto «I promessi sposi»?', ['Manzoni', 'Leopardi', 'Verga', 'Foscolo'], 1],
  ['Quanti anni ha la Torre dell’Orologio di Mantova, più o meno?', ['550', '200', '900', '100'], 3],
  ['Il lago di Mantova che non c’è più (prosciugato)?', ['il lago Paiolo', 'il lago Superiore', 'il lago di Mezzo', 'il lago Inferiore'], 3],
  ['Cosa raffigura lo stemma di Mantova?', ['una croce rossa su fondo bianco', 'un leone', 'una chiocciola', 'un’aquila'], 3],
  ['Il campionato in cui gioca il Mantova nel 2025-26?', ['Serie B', 'Serie A', 'Serie C', 'Serie D'], 2],
  ['Il ponte che attraversa il lago di Mezzo?', ['ponte di San Giorgio', 'ponte Vecchio', 'ponte Milvio', 'ponte dei Sospiri'], 2],
  ['Quanto vale pi greco, arrotondato a due cifre?', ['3,14', '3,41', '3,12', '3,16'], 1],
  ['Il verso del cavedano?', ['nessuno, è un pesce', 'miao', 'muuu', 'coccodè'], 1],
  ['Cosa si mette nei tortelli di zucca oltre alla zucca?', ['amaretti e mostarda', 'nutella', 'tonno', 'cioccolato'], 2],
  ['Il nome dell’euro finto del wallet di pzkko?', ['EUR€ (l’euroshit)', 'il pzkEuro', 'il lirone', 'il dollaro gonzaga'], 2],
  ['Chi dà i 1.000 $pzk a chi è a secco?', ['il sussidio', 'il sindaco', 'la nonna', 'Virgilio'], 2],
]

// ── le parole da riscrivere (veloce, riscrivi) ──
export const PAROLE = ['chiocciola', 'saracinesca', 'tortelli', 'sbrisolona', 'nutria', 'Mantova', 'Gonzaga', 'Virgilio', 'Mincio', 'cavedano', 'mortadella', 'cercapersone', 'portafoglio', 'roulette', 'blackjack', 'anguilla', 'luccio', 'siluro', 'piazza', 'cornetto', 'lattina', 'Rigoletto', 'mantegna', 'mostarda', 'fionda', 'cinghiale', 'fagiano', 'anfora', 'fossile', 'tesoro', 'streamer', 'bidello', 'tatuatore', 'salumiere', 'avvocato', 'sindaco', 'zanzara', 'piccione', 'scarpa', 'bottiglia', 'banconota', 'clessidra', 'diamante', 'ciliegia', 'campana', 'trifoglio', 'anguria', 'pzkko', 'euroshit', 'sussidio', 'elemosina', 'giornaliero']
export const FRASI = ['la nutria non paga il biglietto', 'i tortelli si mangiano col cucchiaio', 'la chiocciola porta gli occhiali', 'il Mincio non ha fretta', 'la sbrisolona si rompe col pugno', 'il rider è in ritardo di nuovo', 'Virgilio non rispondeva al telefono', 'la saracinesca cigola di notte', 'il prof di analisi non perdona', 'a Mantova piove sempre di giovedì', 'il cornetto rosso scaccia la sfiga', 'il siluro ha mangiato il luccio', 'un $pzk non vale niente ma è mio', 'la banca non fa beneficenza', 'il drago dorme sotto il ponte']
export const COLORI = [['rosso', '#ff5b4a'], ['verde', '#46ff7d'], ['giallo', '#ffd400'], ['blu', '#5fb5ff'], ['bianco', '#ffffff'], ['arancione', '#ff9a2e']]
