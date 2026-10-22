// Le domande dei quiz retributivi (23.10). Ogni voce: [argomento, domanda, [la risposta giusta, poi le sbagliate], difficoltà 1–3, nota?]
// (le risposte si mescolano al momento; la nota è il «lo sapevi?» che esce dopo). I fatti di Mantova sono verificati sul web
// il 23.10 (Rivalta sul Mincio è in comune di Rodigo; la Torre dell'Orologio è del 1473, di Luca Fancelli, con l'orologio di
// Bartolomeo Manfredi, il secondo orologio astronomico d'Italia dopo quello di Padova; Festivaletteratura dal 1997; Mantova
// capitale italiana della cultura nel 2016; Mantova e Sabbioneta patrimonio UNESCO dal 2008). Le domande su foto e su
// giocatori non stanno qui: le fa quiz.js, dalle immagini (immagini.js) e dal database (api/giocatori).

export const ARGOMENTI = [
  ['mantova', 'Mantova', 'moneta-virgilio'],
  ['cibo', 'cucina', 'tortelli'],
  ['cultura', 'cultura', 'trofeo'],
  ['scienza', 'scienza', 'fulmine'],
  ['tech', 'tech', 'telefono'],
  ['giochi', 'giochi', 'carte'],
  ['pzk', 'pzk', 'pzk'],
]

export const DOMANDE = [
  // ── Mantova e dintorni ──
  ['mantova', 'Chi ha progettato la basilica di Sant’Andrea?', ['Leon Battista Alberti', 'Giulio Romano', 'Andrea Palladio', 'Filippo Brunelleschi'], 2, 'è una delle chiese più importanti del Rinascimento, e Mantegna è sepolto in una sua cappella.'],
  ['mantova', 'In che anno Mantova e Sabbioneta sono entrate fra i patrimoni UNESCO?', ['2008', '1998', '2016', '2012'], 2, 'Mantova è la città rinascimentale trasformata, Sabbioneta quella fondata da zero come «città ideale».'],
  ['mantova', 'In quale anno Mantova è stata capitale italiana della cultura?', ['2016', '2008', '2020', '2012'], 1],
  ['mantova', 'Da che anno si tiene il Festivaletteratura di Mantova?', ['1997', '1987', '2008', '2016'], 2, 'la prima edizione ospitò Salman Rushdie e Abraham Yehoshua.'],
  ['mantova', 'Di che anno è la Torre dell’Orologio di Mantova?', ['1473', '1273', '1673', '1873'], 3, 'la costruì Luca Fancelli per Ludovico III Gonzaga; l’orologio astronomico è di Bartolomeo Manfredi.'],
  ['mantova', 'La Torre dell’Orologio di Mantova ha il secondo orologio astronomico più antico d’Italia: il primo è quello di…', ['Padova', 'Venezia', 'Firenze', 'Bologna'], 3],
  ['mantova', 'Chi dipinse la Camera degli Sposi nel Palazzo Ducale?', ['Andrea Mantegna', 'Giotto', 'Raffaello', 'Caravaggio'], 1],
  ['mantova', 'In quale palazzo di Mantova c’è la Sala dei Giganti?', ['Palazzo Te', 'Palazzo Ducale', 'Palazzo della Ragione', 'Palazzo d’Arco'], 1],
  ['mantova', 'Chi progettò Palazzo Te per Federico II Gonzaga?', ['Giulio Romano', 'Bramante', 'Michelangelo', 'Vasari'], 2],
  ['mantova', 'Quale famiglia governò Mantova dal 1328 al 1708?', ['i Gonzaga', 'i Medici', 'gli Sforza', 'gli Este'], 1],
  ['mantova', 'Quale dei tre laghi di Mantova è stato prosciugato (e oggi non c’è più)?', ['il Paiolo', 'il Superiore', 'il lago di Mezzo', 'l’Inferiore'], 3, 'i laghi veri sono il Superiore, il lago di Mezzo e l’Inferiore, formati dal Mincio.'],
  ['mantova', 'Il fiume che forma i laghi di Mantova?', ['il Mincio', 'il Po', 'l’Adige', 'l’Oglio'], 1],
  ['mantova', 'Dove sfocia il Mincio?', ['nel Po', 'nel lago di Garda', 'nell’Adige', 'nell’Adriatico'], 2, 'esce dal Garda a Peschiera e si getta nel Po a Governolo.'],
  ['mantova', 'Il fiore che d’estate copre un pezzo del Lago Superiore?', ['il fiore di loto', 'la ninfea gialla', 'il papavero', 'il girasole'], 2],
  ['mantova', 'L’opera di Verdi ambientata a Mantova?', ['Rigoletto', 'Aida', 'Nabucco', 'La traviata'], 1, 'debuttò a Venezia nel 1851.'],
  ['mantova', 'Il poeta nato nel Mantovano, autore dell’Eneide?', ['Virgilio', 'Dante', 'Ovidio', 'Orazio'], 1],
  ['mantova', 'Come era soprannominato il pilota mantovano Tazio Nuvolari?', ['il Mantovano volante', 'il Barone rosso', 'il Pirata', 'il Cannibale'], 2, 'nato a Castel d’Ario, vinse la Mille Miglia del 1930.'],
  ['mantova', 'Rivalta sul Mincio è una frazione di quale comune?', ['Rodigo', 'Curtatone', 'Marmirolo', 'Goito'], 3],
  ['mantova', 'In quale comune c’è il santuario della Madonna delle Grazie?', ['Curtatone', 'Rodigo', 'Roverbella', 'Porto Mantovano'], 3, 'ogni 15 agosto c’è la fiera delle Grazie, con i madonnari.'],
  ['mantova', 'La piazza davanti al Palazzo Ducale di Mantova?', ['piazza Sordello', 'piazza San Marco', 'piazza Navona', 'piazza dei Miracoli'], 1],
  ['mantova', 'Chi era Isabella d’Este?', ['la moglie di Francesco II Gonzaga', 'una badessa', 'la sorella di Virgilio', 'un’architetta'], 3, 'la «prima donna del Rinascimento», con lo studiolo pieno di arte.'],
  ['mantova', 'Perché Sabbioneta è detta «la piccola Atene»?', ['per la città ideale di Vespasiano Gonzaga', 'per i suoi templi greci', 'perché ci piove poco', 'per l’olio d’oliva'], 3],
  ['mantova', 'La chiesa rotonda romanica della piazza delle Erbe?', ['Rotonda di San Lorenzo', 'Pantheon', 'Battistero', 'San Vitale'], 2, 'del tempo del 1100 circa, più bassa del resto della piazza.'],

  // ── la cucina ──
  ['cibo', 'Cosa c’è nei tortelli di zucca mantovani, oltre alla zucca?', ['amaretti e mostarda', 'nutella', 'tonno', 'cioccolato'], 2],
  ['cibo', 'Cos’è la mostarda mantovana?', ['frutta candita in sciroppo con senape', 'senape e basta', 'una marmellata di fichi', 'un formaggio'], 2],
  ['cibo', 'Il risotto alla pilota è tipico di…', ['Mantova', 'Napoli', 'Palermo', 'Cagliari'], 3],
  ['cibo', 'Il dolce mantovano che si rompe col pugno?', ['la sbrisolona', 'il pandoro', 'la pastiera', 'il tiramisù'], 1],
  ['cibo', 'Cosa c’è in cima alla sbrisolona?', ['le mandorle', 'le noci', 'il cioccolato', 'la panna'], 2],
  ['cibo', 'Da dove vengono i grissini?', ['da Torino', 'da Napoli', 'da Bari', 'da Palermo'], 2],
  ['cibo', 'La mortadella è tipica di…', ['Bologna', 'Mantova', 'Milano', 'Roma'], 1],
  ['cibo', 'Da dove arriva il pomodoro in Europa?', ['dalle Americhe', 'dall’Asia', 'dall’Africa', 'dall’Australia'], 2, 'lo portarono gli spagnoli nel Cinquecento: prima nessuno in Italia faceva il sugo.'],
  ['cibo', 'Il ramen è un piatto di…', ['Giappone', 'Cina', 'Corea', 'Thailandia'], 1],
  ['cibo', 'Quale NON è un frutto di bosco?', ['la banana', 'il mirtillo', 'il lampone', 'la fragola'], 1],
  ['cibo', 'Dove è nata la pizza?', ['a Napoli', 'a Roma', 'a Milano', 'a Mantova'], 1],
  ['cibo', 'Il lambrusco è…', ['un vino rosso frizzante', 'un formaggio', 'un salume', 'un liquore'], 1],
  ['cibo', 'Con cosa si mangia tradizionalmente la mostarda?', ['con il bollito', 'con il gelato', 'con il tonno', 'col riso in bianco'], 3],
  ['cibo', 'Il tè freddo alla pesca, di solito, di che colore è?', ['arancione', 'viola', 'verde', 'nero'], 1],

  // ── cultura ──
  ['cultura', 'Chi scrisse la Divina Commedia?', ['Dante Alighieri', 'Petrarca', 'Boccaccio', 'Virgilio'], 1],
  ['cultura', 'Chi dipinse la Gioconda?', ['Leonardo da Vinci', 'Raffaello', 'Michelangelo', 'Botticelli'], 1],
  ['cultura', 'In che anno Colombo arrivò in America?', ['1492', '1453', '1517', '1600'], 1],
  ['cultura', 'In che anno è stata proclamata l’Unità d’Italia?', ['1861', '1848', '1870', '1946'], 2],
  ['cultura', 'Chi scrisse «I promessi sposi»?', ['Alessandro Manzoni', 'Giacomo Leopardi', 'Giovanni Verga', 'Ugo Foscolo'], 1],
  ['cultura', 'La capitale dell’Australia?', ['Canberra', 'Sydney', 'Melbourne', 'Perth'], 2],
  ['cultura', 'Quanti sono i continenti, di solito?', ['sette', 'cinque', 'sei', 'otto'], 1],
  ['cultura', 'Dove è nato il Rinascimento?', ['a Firenze', 'a Parigi', 'a Londra', 'ad Atene'], 2],
  ['cultura', 'Chi ha scritto «Il nome della rosa»?', ['Umberto Eco', 'Italo Calvino', 'Primo Levi', 'Alberto Moravia'], 2],

  // ── scienza e matematica ──
  ['scienza', 'Quanto fa 7 × 8?', ['56', '54', '48', '64'], 1],
  ['scienza', 'La radice quadrata di 169?', ['13', '12', '14', '17'], 1],
  ['scienza', 'La derivata di x²?', ['2x', 'x', 'x²/2', '2'], 1],
  ['scienza', 'La derivata di e^x?', ['e^x', 'x·e^(x−1)', '1', 'ln x'], 2],
  ['scienza', 'L’integrale di cos x?', ['sin x + c', '−sin x + c', 'cos x + c', 'tan x + c'], 2],
  ['scienza', 'L’integrale di 1/x?', ['ln|x| + c', 'x² + c', '1/x² + c', 'e^x + c'], 2],
  ['scienza', 'Il limite di sin(x)/x per x → 0?', ['1', '0', 'infinito', 'non esiste'], 2],
  ['scienza', 'Quanto fa 0! (zero fattoriale)?', ['1', '0', 'non esiste', 'infinito'], 3],
  ['scienza', 'A cosa tende (1 + 1/n)^n per n → ∞?', ['al numero e', 'a pi greco', 'a 1', 'a infinito'], 3],
  ['scienza', 'L’identità di Eulero lega e, i, π, 1 e 0: quanto fa e^(iπ) + 1?', ['0', '1', '−1', 'i'], 3],
  ['scienza', 'Il simbolo chimico dell’oro?', ['Au', 'Ag', 'Or', 'Go'], 2],
  ['scienza', 'La formula dell’acqua?', ['H₂O', 'CO₂', 'O₂', 'NaCl'], 1],
  ['scienza', 'Il pianeta più grande del sistema solare?', ['Giove', 'Saturno', 'la Terra', 'Nettuno'], 1],
  ['scienza', 'Quanti sono, circa, i km/s della velocità della luce?', ['300.000', '3.000', '30.000', '3 milioni'], 3],

  // ── tech ──
  ['tech', 'Quanti bit in un byte?', ['8', '4', '16', '32'], 1],
  ['tech', 'Il linguaggio che gira nel browser?', ['JavaScript', 'Python', 'Java', 'C'], 1],
  ['tech', 'Il codice HTTP di «non trovato»?', ['404', '500', '200', '301'], 1],
  ['tech', 'Il tag HTML per un link?', ['<a>', '<link>', '<href>', '<url>'], 2],
  ['tech', 'Cosa significa CSS?', ['Cascading Style Sheets', 'Computer Style System', 'Creative Site Scripts', 'Code Source Sheet'], 2],
  ['tech', 'Chi ha creato il kernel Linux nel 1991?', ['Linus Torvalds', 'Bill Gates', 'Steve Jobs', 'Dennis Ritchie'], 2],
  ['tech', 'Ubuntu è…', ['una distribuzione Linux', 'un antivirus', 'un browser', 'un telefono'], 1],
  ['tech', 'Cosa fa il BIOS di un PC all’accensione?', ['controlla l’hardware e avvia il sistema', 'pulisce il disco', 'aggiorna Windows', 'spegne la ventola'], 2],
  ['tech', 'Cosa fa «git commit»?', ['salva una versione del lavoro', 'cancella il repository', 'spegne il PC', 'scarica internet'], 1],
  ['tech', 'La S di HTTPS sta per…', ['secure (sicuro)', 'speed', 'server', 'site'], 1],
  ['tech', 'Quanti bit ha un hash SHA-256?', ['256', '128', '512', '64'], 2],
  ['tech', 'La libreria per la grafica 3D nel browser, usata anche dalla scena di pzkko?', ['three.js', 'jQuery', 'React', 'Bootstrap'], 2],

  // ── giochi ──
  ['giochi', 'Quante caselle ha la roulette europea?', ['37', '36', '38', '40'], 2],
  ['giochi', 'Quanto paga un numero pieno alla roulette?', ['35 a 1', '17 a 1', '36 a 1', '30 a 1'], 2],
  ['giochi', 'Nel blackjack, quanto vale l’asso?', ['1 o 11', '1', '11', '10'], 1],
  ['giochi', 'Qual è il totale più probabile lanciando due dadi?', ['7', '6', '12', '2'], 2],
  ['giochi', 'Quante carte ha un mazzo da poker (senza jolly)?', ['52', '40', '54', '48'], 1],
  ['giochi', 'Chi ha inventato Tetris?', ['Alexey Pajitnov', 'Shigeru Miyamoto', 'Gabe Newell', 'Hideo Kojima'], 3],
  ['giochi', 'Quanti fantasmini ci sono in Pac-Man?', ['quattro', 'tre', 'cinque', 'sei'], 2],
  ['giochi', 'Il «Pip-Boy», il computer da polso, è di quale serie di videogiochi?', ['Fallout', 'Zelda', 'Halo', 'Tomb Raider'], 1],
  ['giochi', 'Il gioco in cui si evitano le mine su una griglia?', ['il campo minato', 'il solitario', 'la dama', 'il tris'], 1],

  // ── pzk (il muro, il wallet, il bot) ──
  ['pzk', 'Come si chiama la mascotte della banca $pzk?', ['la chiocciola', 'la nutria', 'il drago', 'il siluro'], 1],
  ['pzk', 'Come comincia l’indirizzo di un conto del wallet?', ['pzk e sei cifre', '0x e quaranta cifre', 'un’e-mail', 'IBAN'], 1],
  ['pzk', 'Dopo quante ore dalla creazione di un conto si possono mandare i $pzk?', ['48', '24', '12', '72'], 2],
  ['pzk', 'Quanti $pzk si hanno nella sessione, senza conto?', ['1.000', '100', '10.000', '500'], 1],
  ['pzk', 'Come si chiama l’euro finto del wallet?', ['EUR€ (euroshit)', 'il pzkEuro', 'il lirone', 'il dollaro gonzaga'], 2],
  ['pzk', 'Che indirizzo ha il conto di Alberto?', ['pzk398893', 'pzk123456', 'pzk000001', 'pzk999999'], 2],
  ['pzk', 'Quali banconote da $pzk si trovano per terra, perse, nella scena?', ['500, 100, 25 e 10', '50, 20, 10 e 5', '1.000 e 500', '200 e 100'], 2],
  ['pzk', 'Cosa ti salva dal perdere i $pzk quando muori nella chat?', ['il cornetto rosso', 'il caffè', 'la mortadella', 'il gratta e vinci'], 1],
  ['pzk', 'Cosa dimezza le attese dei comandi?', ['il caffè', 'la lattina', 'la pala', 'la canna'], 1],
  ['pzk', 'Che numero civico c’è sulla porta chiusa della saracinesca?', ['28', '12', '7', '100'], 2],
  ['pzk', 'Come si chiama la connessione fittizia sul coperchio in ghisa del marciapiede?', ['pzkkonet', 'pzkwifi', 'tombinonet', 'chiocciolanet'], 2],
  ['pzk', 'Cosa si firma con le penne BIC attaccate alla corda?', ['la petizione «pzkko.it è un bel sito?»', 'un assegno', 'un autografo', 'il registro'], 2],
  ['pzk', 'Di quanto può oscillare la borsa del $pzk in un giorno, al massimo (di solito)?', ['±5 %', '±50 %', '±0,1 %', '±20 %'], 3],
  ['pzk', 'Cosa succede al cambio del $pzk quando Alberto fa un commit?', ['sale', 'scende', 'resta fermo', 'esplode'], 3],
]
