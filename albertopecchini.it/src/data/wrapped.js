// ─────────────────────────────────────────────────────────────────────────────
//  WRAPPED 5BT — contenuti della pagina /wrapped5BT/: le slide verticali che
//  raccontano la chat del gruppo di classe attraverso dati reali.
//
//  IL PATTO: qui non entra nessun numero inventato. Ogni cifra viene da
//  tools/wrapped/lavoro/dati.json (prodotto da tools/wrapped/analizza.mjs
//  sugli export della chat) e ogni citazione va verificata parola per parola
//  su lavoro/chat_unificata.txt prima di finire in una slide. Se una metrica
//  non è calcolabile, la slide lo dice; non si approssima in silenzio.
//
//  Fonte di questa stesura: il deck «5ªBT Wrapped» su Claude (35 slide 16:9,
//  ottobre 2026), costruito su quei dati. Qui è rimontato in verticale: le slide
//  troppo dense per il 9:16 sono divise in due, i nove capitoli del deck hanno
//  una slide di apertura e le note del relatore — definizioni, soglie, limiti —
//  stanno nel pannello «Come si calcola» di ogni slide (campo `metodo`).
//
//  Finché `stato` non è 'pronto' la pagina mostra la tela in attesa.
// ─────────────────────────────────────────────────────────────────────────────

/*
  Ogni slide è { tema?, occhiello?, titolo?, sotto?, blocchi: [...], chiusa?, metodo? }.

  tema      'ink' | 'paper' | 'tint' (i temi del sito, da tokens.css)
  chiusa    la frase «In breve» in fondo alla slide
  metodo    stringa o elenco di paragrafi: definizioni e limiti del dato
  **testo** diventa grassetto in sotto, chiusa, metodo e nei testi dei blocchi

  I blocchi, tutti renderizzati da src/templates/pages/wrapped5bt.js:

  display   { righe: [stringhe], accento?: indice }
  numero    { valore, unita?, testo?, piccolo? }
  cifre     { celle: [{ valore, etichetta }], colonne?: 2|3 }
  barre     { titolo?, voci: [{ nome, valore: NUMERO, mostra?, testo?, evidenza? }] }
            (valore è sempre un numero: scala le barre; `mostra` è il testo stampato)
  colonne   { titolo?, valori: [numeri], descrizione, evidenza?, bassi?, asse: [{ i, testo }], etichette? }
  righe     { titolo?, voci: [{ chiave, valore?, testo? }], colonne?: 1|2 }
  schede    { voci: [{ titolo, valore?, testo, evidenza? }], colonne?: 1|2 }
  tabella   { colonne: [intestazioni], righe: [[celle]], destra?: [colonne], evidenzia?: [righe] }
  fumetto   { etichetta?, autore, testo, data, mio? }
  chip      { titolo?, voci: [{ testo, evidenza? }] }
  elenco    { voci: [{ n, testo }] }
  paragrafo { testo }
*/

/* Le note del deck, una per argomento: le slide divise in due le condividono. */
const M = {
  copertina: [
    'Fonte: export della chat di Alessandro Ruggeri, dal 15/12/2022 22:32 al 05/10/2026 19:45.',
    '**Messaggio** = qualsiasi cosa inviata da una persona: testo, foto, video, vocali, sticker, documenti, sondaggi, messaggi eliminati. Sono escluse le righe di sistema e 34 avvisi di chiamata. Totale 51.748 (25 persone più una risposta di Meta AI).',
    '**Parole** = testo e didascalie, esclusi 17 messaggi spam (13.712 parole).',
    'Il primo messaggio umano è di Francesco alle 22:32 del 15/12/2022.',
  ],
  quanto: [
    '**Parole** = parole dei messaggi di testo e delle didascalie, esclusi 17 messaggi spam (13.712 parole). I caratteri sono contati sugli stessi messaggi.',
    '**37,2** = 51.748 messaggi / 1.391 giorni di calendario. **1.085** = media dei 45 mesi interi (gennaio 2023 – settembre 2026). Mediana giornaliera: 7 messaggi.',
    'Pagine e ore di lettura sono equivalenze con ipotesi dichiarate: 300 parole a pagina, 250 parole al minuto. Un messaggio ogni 39 minuti: 1.391 × 1.440 minuti / 51.748 = 38,7.',
  ],
  grafico: [
    'Ogni colonna è un mese di calendario; le altezze sono in proporzione al mese più pieno (maggio 2023, 4.169 messaggi). Evidenziati i quattro mesi più alti; le tacche scure a terra sono i mesi sotto i 20 messaggi.',
    '**Novembre 2023 è vuoto per un motivo tecnico**: i messaggi effimeri sono stati attivati il 12/10/2023 e disattivati il 23/12/2023, quindi in quel periodo i messaggi sono spariti dall’export.',
    'Luglio 2023: 17 messaggi; agosto 2025: 18. Silenzio più lungo: dal 12/10 al 16/12/2023 (64 giorni, tecnico); poi 14/07–24/08/2024 (40 giorni) e 10/06–20/07/2025 (39 giorni).',
  ],
  anni: [
    '**Messaggi al giorno** = messaggi dell’anno / giorni dell’anno compresi nel periodo (2022: dal 15/12; 2026: fino al 05/10).',
    'Nel 2023 ci sono 72 giorni di messaggi effimeri (12/10–23/12), quindi il valore reale del 2023 è probabilmente più alto.',
    '**Persone** = chi ha scritto almeno un messaggio quell’anno. **Parole a messaggio** calcolate sui messaggi di testo, spam escluso. Somma degli anni: 51.748.',
  ],
  mese: [
    'Mesi di calendario. **Mese medio** = media dei 45 mesi interi (gennaio 2023 – settembre 2026): 1.085 messaggi. 4.169 / 51.748 = 8,06%.',
    'Febbraio 2024: 3.889 messaggi (7,52%), 134,1 al giorno su 29 giorni. Gennaio 2023: 2.838 (5,48%), 91,5 al giorno.',
    'Dicembre 2022 ha una media giornaliera più alta (153,7) ma copre solo 17 giorni. La conversazione del 21/05/2023: 715 messaggi in 7 ore e 12 minuti, 14 persone.',
  ],
  giorno: [
    'Giorno = data di calendario. 821 / 37,2 (media) = 22,1; 821 / 7 (mediana) = 117. Quel giorno: 3.703 parole.',
    '**Ora record**: 459 messaggi in 60 minuti consecutivi tra le 13:26 e le 14:26. **Dieci minuti con più persone**: 111 messaggi, fino alle 13:36.',
    'Il messaggio di Gianmarco è citato esattamente come nel dataset.',
  ],
  ore: [
    'Ore locali dell’export. Fasce: mattina 06:00–12:59, pomeriggio 13:00–18:59, sera 19:00–23:59, notte 00:00–05:59.',
    'Le colonne sono in proporzione all’ora più attiva (le 20, 5.251 messaggi); le tacche scure sono le 4 e le 5 del mattino, 31 messaggi ciascuna.',
    '**7.492** = messaggi dalle 08:00 alle 12:59, dal lunedì al sabato, cioè il 14,5% del totale (non tiene conto di vacanze e festivi). Notte record: 23/06/2026, 219 messaggi tra mezzanotte e le 6, vigilia dei primi orali.',
  ],
  settimana: [
    '**Media** = messaggi in quel giorno della settimana / numero di quei giorni nel periodo (1.391 giorni di calendario, compresi i giorni senza messaggi). Venerdì: 8.943 messaggi in totale; domenica: 4.984.',
    '**Persone attive** = persone diverse che hanno scritto almeno un messaggio quel giorno, media per giorno della settimana.',
    'La nota sul sabato è un’osservazione, non una spiegazione.',
  ],
  classifica: [
    '**Messaggio** = testo + foto + video + vocali + sticker + documenti + sondaggi + messaggi eliminati; escluse righe di sistema e avvisi di chiamata. Base: 51.747 messaggi umani (esclusa una risposta di Meta AI).',
    'Pippo non è della classe: compare con 19 messaggi.',
    'Le quote di parole sono diverse: Adam 28,55% delle parole, Alberto 12,79%, Daniel 10,37%, Federico 9,16%, Luca 6,95%. Indice di Gini sui messaggi: 0,66 (0 = tutti scrivono uguale, 1 = scrive una persona sola).',
  ],
  metriche: [
    '**Lunghezza media** = parole per messaggio di testo, spam escluso. Quote di parole sul totale di 245.651 parole pulite. 69.795 = parole dei soli messaggi di testo di Adam (senza didascalie).',
    '**Messaggi da 0–1 parola**: quota sui messaggi di testo della persona. Mediana più alta (5 parole): Adam, Luca, Manuel, Aurora; più bassa: David (2).',
    'In valore assoluto i messaggi da 0–1 parola sono di più per Adam (1.500), Daniel (1.401), Federico (1.161), Alberto (1.123).',
  ],
  notturni: [
    '**Notte** = 00:00–05:59. **Quota** = messaggi notturni della persona / suoi messaggi totali, tra le 17 persone con almeno 200 messaggi.',
    'Davide (9,13%) è separato perché 16 dei suoi 20 messaggi notturni sono nella notte del 23/06/2026, vigilia dei primi orali (219 messaggi quella notte: Alberto 106, Adam 61, Davide 16, Riccardo 14, Daniel 13).',
    'Allargando la finestra alle 23–06, Alberto arriva a 700 messaggi (9,09%).',
  ],
  diurni: [
    '**Diurno** = 06:00–18:59. Base: 17 persone con almeno 200 messaggi. Fasce: mattina 06–13, pomeriggio 13–19, sera 19–24, notte 0–6.',
    'Sesto più diurno: Manuel 69,9%. Davide è l’unico con la mattina come fascia più frequente; Benetti e David gli unici con la sera.',
  ],
  parole: [
    '**Conteggi** = numero di volte in cui la parola compare nei messaggi di testo e nelle didascalie (spam escluso), in minuscolo. Escluse le parole funzionali (articoli, preposizioni, pronomi, verbi comuni) e i nomi propri (es. «adam» 465).',
    '«secondo me»: 151 messaggi, più 49 «secondome» scritto attaccato. «cosa si porta»: 39 volte, come «c’è da portare». Altre espressioni: «a scuola» 211, «un cazzo» 194, «porco dio» 95, «di merda» 94, «stai zitto» 75, «ma ti svegli» 21.',
    'Le parole volgari sono contate come tutte le altre. Le categorie scuola/fuori sono assegnate a mano parola per parola.',
  ],
  firme: [
    '**Metodo**: per ogni persona, quota dei suoi messaggi di testo che contengono la parola contro la stessa quota negli altri; le parole sono ordinate con un punteggio log-odds e si mostrano solo quelle con almeno 9 messaggi.',
    '**msg** = messaggi che contengono la parola. **19×** = la parola compare in proporzione 19 volte più spesso nei suoi messaggi che in quelli degli altri. **85% degli usi** = quota di tutte le volte che compare nella chat.',
    '«perchè» = scritto con l’accento grave (67 messaggi di Luca, 34× gli altri). Varianti come «rega» sono condivise: per Damiano vale 13× rispetto agli altri.',
  ],
  emoji: [
    'Solo emoji scritti nei messaggi di testo; sticker esclusi. Esclusi 5 messaggi spam di emoji (tra cui uno con 3.888 😱 di Alberto).',
    'Emoji ogni 100 messaggi di testo: 5,8 (2022) → 6,1 (2023) → 13,3 (2024, 🤣 342 volte) → 8,9 (2025) → 11,4 (2026). ❤️ entra nella top 3 solo nel 2025.',
    'Combinazioni: 😂😂 212, 😂😂😂 109, 😂😂😂😂 43, 🤣🤣🤣 39; la combinazione mista più comune è 😂🤣 (15). 2.194 messaggi su 45.055 messaggi di testo (4,9%) contengono almeno un emoji. 😂 è il primo emoji in ognuno dei cinque anni.',
  ],
  mappaemoji: [
    '**Esclusivi** = emoji usati almeno 10 volte nella chat, tutti da una sola persona. Quasi esclusivi: 🍷 14 su 15, 🙄 9 su 10, 🩷 9 su 10, 😹 9 su 11, 🦁 12 su 15.',
    '**Densità** = emoji ogni 100 messaggi di testo della persona, tra le 17 con almeno 200 messaggi. ❌ è quasi tutto di dicembre 2022 (22 volte). Spam di emoji escluso.',
  ],
  fra: [
    '**Conteggi** = messaggi che contengono l’espressione (varianti ortografiche incluse).',
    '«fra»: primo uso 16/12/2022 08:01, ultimo 05/10/2026 11:00, entrambi di Adam, a 3 anni e 10 mesi di distanza. «bro» per anno: 2 (2022, 17 giorni), 20 (2023), 64 (2024), 189 (2025), 65 (2026 fino al 5 ottobre).',
    '«godo»: 218 messaggi di 14 persone, Daniel 63. «cosa si porta»: dal 16/01 al 30/09/2023; «cosa si porta (oggi) di ita» 24 volte. «miao» nasce con Federico; l’ultimo messaggio dell’intera chat è «Miao» (Luca, 05/10/2026 19:45).',
  ],
  insidejoke: [
    '**Conteggi** = messaggi di testo che contengono la forma, varianti incluse.',
    '«dada»: primo uso 16/12/2022, ultimo 05/10/2026 (1.389 giorni), picco a gennaio 2023 (32 messaggi). «pekko/pzkko/pecco»: pekko 16, pzkko 14, pecco 12, pezkoo 1; primo uso 15/12/2022 22:34. La citazione di Daniel usa l’apostrofo tipografico come nell’originale.',
    'I tormentoni nati nei vocali o nei video non sono misurabili dal testo: questi numeri sottostimano la loro diffusione reale.',
  ],
  aperture: [
    '**Conversazione** = sequenza che inizia con il primo messaggio dopo almeno 60 minuti di silenzio totale e in cui scrivono almeno 2 persone: 1.950 conversazioni (su 2.757 sequenze). 23 persone hanno aperto almeno una conversazione.',
    '**Media** = 114,7 aperture tra le 17 persone con almeno 200 messaggi. **×** = quota di aperture / quota di messaggi della persona.',
    'Il risultato è stabile cambiando soglia: con 30 minuti Alberto 421 e Adam 375; con 120 minuti Alberto 277 e Adam 253.',
  ],
  accende: [
    '**Accensione** = messaggio dopo almeno 60 minuti di silenzio, seguito entro 30 minuti da almeno 40 messaggi scritti da almeno 5 persone diverse dall’autore. Il numero accanto a ogni messaggio è quanti messaggi arrivano nei 30 minuti successivi. I messaggi sono citati esattamente come nel dataset.',
    'Lunghezza media delle conversazioni aperte: Luca 33,2 messaggi, Gianmarco 31,4, Adam 29,0 (media generale 25,8).',
    'Messaggi degli altri nei 15 minuti dopo un’apertura, in media: Aurora 21,5, Manuel 20,3, David 20,2, Gianmarco 19,7; Alberto 10,5.',
  ],
  coppie: [
    '**Scambio** = un messaggio seguito entro 3 minuti da un messaggio di un’altra persona; la coppia è non ordinata (A↔B somma A→B e B→A). Totale 25.533 scambi. **Ping-pong** = almeno 3 scambi di fila tra le stesse due persone.',
    'Sono coppie conversazionali osservate nei tempi di risposta: non dicono nulla sui rapporti personali.',
    'Adam ↔ Benetti: 1.415 scambi tutti tra il 2022 e il 2024, poi nessuno. Coppia n.1 per anno: 2022 e 2023 Adam ↔ Daniel, 2024 Adam ↔ Benetti, 2025 Adam ↔ Federico, 2026 Adam ↔ Alberto.',
  ],
  gruppi: [
    'Una persona «partecipa» a una conversazione se ci scrive almeno 2 messaggi. Base: 582 conversazioni con almeno 20 messaggi.',
    '**Atteso** = quante volte il gruppo comparirebbe insieme se ognuno partecipasse a caso, con la propria frequenza reale (lift).',
    'Questi gruppi descrivono chi scrive nello stesso momento, non amicizie o rapporti personali. Anni scolastici: 2ª = dicembre 2022–agosto 2023, 3ª = settembre 2023–agosto 2024, 4ª = settembre 2024–agosto 2025, 5ª = da settembre 2025.',
  ],
  scuola: [
    'Classificazione per parole chiave sui 45.055 messaggi di testo (verifica, interroga, voto, prof, nota, compiti, consegna, orario, assenza, gita, maturità, PCTO, nomi delle materie…). Un messaggio può stare in più categorie.',
    'L’81,2% dei messaggi di testo non ha un argomento riconoscibile (risate, reazioni, risposte brevi), quindi la scuola reale nella chat è sottostimata.',
    'Gennaio 2026: il 30/01 escono le materie della maturità. Alle 6 del mattino il messaggio tipico è «cosa si porta?».',
  ],
  fuori: [
    'Stessa classificazione per parole chiave della scuola, applicata ad argomenti extrascolastici. **Gruppo e admin** = messaggi sul gruppo stesso (aggiunte, rimozioni, admin, nome del gruppo).',
    'La musica condivisa con link, vocali o video non è contata.',
    'Percentuali 58/35/7 calcolate sui messaggi che hanno almeno un argomento riconoscibile.',
  ],
  episodi: [
    '**Episodio** = giorni con almeno 4 volte la media giornaliera (37,2), uniti se distanti al massimo 2 giorni; ordinati per numero di messaggi. 7.856 = somma dei cinque episodi; 22 giorni su 1.391 = 1,6%.',
    'Quote sul totale: 4,47%, 4,23%, 3,42%, 1,59%, 1,48%. Il 10–11/11/2025 Alberto scrive 404 dei 764 messaggi (soprattutto foto e video).',
    'Altri periodi sopra soglia, più piccoli: 10–13/01/2023 (977), 09–11/10/2023 (916), 29–31/05/2023 (811), 22–23/06/2026 (644).',
  ],
  maturita: [
    'Date ricavate dai messaggi: materie della maturità uscite il 30/01/2026, ammissioni 10/06, scritti 18–19/06, orali 23–25/06, risultati 26/06.',
    '**Persone attive al giorno** = media delle persone diverse che scrivono in un giorno. Durante gli esami il 20% dei messaggi è notturno (00–06).',
    'Confronto con l’estate 2025: differenza non statisticamente significativa (test di Mann-Whitney sui conteggi giornalieri, p = 0,69); rispetto a gennaio–maggio la differenza è netta (p < 0,0001). Settembre 2025: 1.840 messaggi; settembre 2026: 729.',
  ],
  fasi: [
    'Fasi: 2ª dal 15/12/2022 al 31/08/2023; 3ª dal 01/09/2023 al 31/08/2024 (contiene i 72 giorni di messaggi effimeri, quindi il suo ritmo è sottostimato); 4ª dal 01/09/2024 al 31/08/2025; 5ª dal 01/09/2025 al 26/06/2026; dopo dal 27/06 al 05/10/2026.',
    '**Persone attive** = chi ha scritto almeno un messaggio nella fase (nel dopo, solo 5 sopra i 50 messaggi). **Media** = foto, video, vocali, sticker, documenti sul totale dei messaggi. **Primi 4** = messaggi delle 4 persone più attive della fase sul totale della fase.',
    '**Parole tipiche** = parole con frequenza relativa più alta nella fase rispetto alle altre (nomi propri esclusi). Altre: 2ª grafica, «ahaha»; 3ª bozzolo; 5ª presentazione, vienna; dopo andiamo.',
    'Il segno di ogni fase: 2ª Adam scrive il 24% dei messaggi; 3ª «era di 🤣», 12,9 emoji ogni 100 messaggi di testo (2ª: 5,4); 4ª il ritmo più basso tra gli anni di scuola (27,7 al giorno); 5ª Alberto primo con il 30,2% dei messaggi, sera al 40%; dopo la sera sale al 45,3% e l’ora di punta diventa le 23. Sera = 19–24.',
  ],
  cambiati: [
    '2ª = 15/12/2022–31/08/2023; 5ª = 01/09/2025–26/06/2026. **Quota** = messaggi della persona / messaggi della chat nello stesso periodo. **Media** = foto, video, vocali, sticker, documenti sui messaggi della persona.',
    '**Emoji** = emoji nei messaggi di testo ogni 100 messaggi di testo. **Sera** = 19–24. Adam: quota 24,1% → 18,9%.',
    'Selezionati i casi con le variazioni più ampie tra le 17 persone principali; è una trasformazione numerica, non un giudizio sulle persone.',
  ],
  ondate: [
    '**Concentrazione** = quota dei messaggi della persona nel suo mese più pieno (o nei suoi tre mesi più pieni). **Mesi attivi** = mesi di calendario con almeno un messaggio della persona, su 47 mesi coperti dalla chat.',
    'Prosper è stato nel gruppo circa due settimane a ottobre 2023.',
    'Il collegamento con gli episodi è una coincidenza di date osservata, non una spiegazione delle cause.',
  ],
  lunghi: [
    'Parole e caratteri del singolo messaggio di testo. I copia-incolla ripetitivi (stessa parola ripetuta) sono esclusi dalla classifica e dal conteggio pulito delle parole: Adam 21/12/2023, 2.428 parole e 16.349 caratteri; Alberto 09/02/2024, otto messaggi da 1.326 parole e uno da 676.',
    'Il primo racconto di Federico inizia con «Una fresca mattina di primavera, Luca Marchi si svegliò con una strana determinazione.» L’articolo incollato da Daniel non è citato per il contenuto.',
    'Record personali per parole: Alberto 503, Federico 482, Daniel 396, Manuel 365, Adam 348, Giovanni 290, Damiano 251.',
  ],
  minimi: [
    '**0–1 parola** = messaggi di testo con al massimo una parola (un emoji o un segno di punteggiatura da soli contano come zero parole).',
    'Le percentuali tra parentesi sono la quota di quella persona su tutti gli usi; vanno confrontate con la sua quota dei messaggi (Daniel 12,4%, Federico 10,4%, Damiano 5,5%): per questo sono significative. Non sono mostrati come record i casi proporzionali al volume (per esempio «ok» di Adam).',
    '**Minimalisti** = quota dei propri messaggi di testo con al massimo 3 parole, tra le 17 persone principali. «io» da solo: 73 volte.',
  ],
  halloffame: [
    'Giorno = data di calendario. Ora e dieci minuti = finestre mobili di 60 e 10 minuti. Dieci minuti, record assoluto: 299 messaggi il 15/11/2025, quasi tutti foto inviate da Alberto; con il vincolo di più persone, 111 il 14/02/2024 fino alle 13:36.',
    'Una persona in un giorno: Alberto 354 il 10/11/2025 (188 video, 155 foto); solo testo, Benetti 243 il 14/02/2024. **Raffica** = messaggi consecutivi della stessa persona senza interruzioni: Alberto 300 (267 foto, 28 video e altri); solo testo, Federico 40 il 28/09/2023.',
    'Conversazione = sequenza senza pause di 60 minuti. Giorni di fila = giorni consecutivi con almeno un messaggio. Rimozioni: 52 fatte da Daniel, 44 da Alberto. Il messaggio più lungo esclude i copia-incolla ripetitivi.',
  ],
  top10: [
    'Ogni voce è verificabile nell’export. 1: righe di sistema di rimozione in cui Adam è la persona rimossa; la prima è del 16/12/2022, il giorno dopo il primo messaggio. 3: foto inviate (le didascalie contano come foto): Alberto 1.652 su 3.116. 4: 14,5% di tutti i messaggi; non esclude vacanze e festivi.',
    '6: messaggi effimeri attivati il 12/10/2023 e disattivati il 23/12/2023. 7: notte del 23/06/2026. 8: 16/12/2022 08:01 «Un giorno fra» e 05/10/2026 11:00 «Gasa fra». 9: ottobre 2023. 10: classificazione per parole chiave, 81,2% senza argomento riconoscibile.',
  ],
  sintesi: [
    'Giorno mediano 7, giorno medio 37,2, record 821 (14/02/2024). **Tempo di risposta**: mediana del tempo tra un messaggio e il successivo quando l’autore cambia.',
    '**Persone attive** = chi scrive almeno un messaggio nella fase (2ª: 24; dopo-maturità: 16). **Primi quattro** = quota dei messaggi delle 4 persone più attive della fase (2ª 54%, dopo 74%). Foto e video: quota media dei messaggi nella 2ª (4,4%) e nella 5ª (24,1%).',
    '**Aperture** = conversazioni iniziate dopo almeno 60 minuti di silenzio.',
  ],
  finale: [
    'Numeri finali dall’export di Alessandro Ruggeri. 51.748 messaggi di 25 persone (più una risposta di Meta AI), dal 15/12/2022 22:32 al 05/10/2026 19:45. 915 giorni su 1.391 hanno almeno un messaggio.',
    'Conversazioni = sequenze con almeno 2 persone separate da almeno 60 minuti di silenzio. Il primo messaggio umano è di Francesco («Ma pk?»), l’ultimo è di Luca («Miao»).',
    '«4 anni» è arrotondato: il periodo coperto è di 3 anni, 9 mesi e 20 giorni.',
  ],
}

/* Apertura di capitolo: i nove capitoli del deck. */
const capitolo = (n, nome, testo) => ({
  tema: 'ink',
  occhiello: `Capitolo ${n} di 9`,
  blocchi: [
    { tipo: 'display', righe: [nome] },
    { tipo: 'paragrafo', testo },
  ],
})

export const wrapped = {
  // 'in-preparazione' → tela vuota con le guide; 'pronto' → si mostrano le slide.
  stato: 'pronto',
  titolo: 'Wrapped 5BT',
  periodo: { dal: '15 dicembre 2022', al: '5 ottobre 2026' },

  slides: [
    /* ── 1 · Apertura ─────────────────────────────────────────────────── */
    {
      tema: 'ink',
      occhiello: '5ªBT · Wrapped',
      blocchi: [
        { tipo: 'display', righe: ['Non è una chat.', 'È un archivio.'], accento: 1 },
        { tipo: 'numero', valore: 51748, testo: 'messaggi in un solo gruppo, dal **15 dicembre 2022** al **5 ottobre 2026**.' },
        { tipo: 'paragrafo', testo: 'Scorri in giù, o tocca la metà bassa, per andare avanti. In alto a destra, «Come si calcola» spiega da dove viene ogni numero.' },
      ],
      metodo: M.copertina,
    },
    {
      tema: 'ink',
      occhiello: 'Apertura',
      titolo: 'Dove tutto comincia',
      blocchi: [
        { tipo: 'fumetto', etichetta: 'Il primo messaggio', autore: 'Francesco', testo: 'Ma pk?', data: '15/12/2022 · 22:32' },
        {
          tipo: 'cifre',
          colonne: 3,
          celle: [
            { valore: 1391, etichetta: 'giorni di gruppo' },
            { valore: 25, etichetta: 'persone che hanno scritto' },
            { valore: 245651, etichetta: 'parole' },
          ],
        },
      ],
      chiusa: 'Quasi quattro anni della nostra vita scolastica, dalla 2ª al dopo-maturità.',
      metodo: M.copertina,
    },
    {
      occhiello: 'Apertura',
      titolo: 'Quanto abbiamo davvero scritto?',
      sotto: 'Parole, caratteri e ritmo della chat',
      blocchi: [
        { tipo: 'numero', valore: 245651, testo: 'parole scritte nella chat' },
        {
          tipo: 'cifre',
          celle: [
            { valore: 45055, etichetta: 'messaggi di testo' },
            { valore: 1278835, etichetta: 'caratteri' },
            { valore: 37.2, etichetta: 'messaggi al giorno, in media' },
            { valore: 1085, etichetta: 'messaggi in un mese medio' },
          ],
        },
      ],
      metodo: M.quanto,
    },
    {
      occhiello: 'Apertura',
      titolo: 'Tradotto in pagine e minuti',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**≈ 819 pagine**', testo: 'a 300 parole per pagina' },
            { chiave: '**≈ 16 ore** di lettura', testo: 'a 250 parole al minuto' },
            { chiave: '**1 messaggio ogni 39 minuti**', testo: 'per 1.391 giorni' },
          ],
        },
        {
          tipo: 'barre',
          titolo: 'Oltre al testo',
          voci: [
            { nome: 'foto', valore: 3116, evidenza: true },
            { nome: 'sticker', valore: 1441 },
            { nome: 'video', valore: 786 },
            { nome: 'vocali', valore: 486 },
            { nome: 'sondaggi', valore: 103 },
            { nome: 'documenti', valore: 83 },
          ],
        },
      ],
      chiusa: 'Metà dei giorni ha al massimo **7 messaggi**, ma la media è **37**: la chat vive di esplosioni.',
      metodo: M.quanto,
    },

    /* ── 2 · Il tempo ─────────────────────────────────────────────────── */
    capitolo(2, 'Il tempo', 'Mesi, anni, giorni, ore e giorni della settimana: quando la chat era viva e quando taceva.'),
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'Quattro anni, mese per mese',
      sotto: 'Messaggi al mese, da dicembre 2022 a ottobre 2026',
      blocchi: [
        {
          tipo: 'colonne',
          descrizione: 'Messaggi al mese da dicembre 2022 a ottobre 2026: picchi a maggio 2023 (4.169) e febbraio 2024 (3.889), mesi quasi vuoti ogni estate e a novembre 2023.',
          // altezze relative lette dal grafico del deck (1 = maggio 2023, 4.169 messaggi):
          // i valori esatti sono solo quelli etichettati qui e nelle note
          valori: [
            0.627, 0.681, 0.467, 0.271, 0.204, 1, 0.146, 0.016, 0.018, 0.194, 0.451, 0.016, 0.021, 0.282, 0.933, 0.335,
            0.383, 0.255, 0.058, 0.012, 0.013, 0.07, 0.312, 0.118, 0.246, 0.123, 0.122, 0.293, 0.352, 0.663, 0.123, 0.016,
            0.016, 0.441, 0.393, 0.671, 0.106, 0.16, 0.346, 0.377, 0.123, 0.207, 0.518, 0.017, 0.02, 0.175, 0.076,
          ],
          evidenza: [0, 1, 5, 14],
          bassi: [7, 11, 31, 32],
          etichette: [
            { i: 1, testo: '2.838' },
            { i: 5, testo: '4.169' },
            { i: 14, testo: '3.889' },
            { i: 35, testo: '2.797' },
          ],
          asse: [
            { i: 1, testo: '2023' },
            { i: 13, testo: '2024' },
            { i: 25, testo: '2025' },
            { i: 37, testo: '2026' },
          ],
        },
      ],
      chiusa: 'Silenzi più lunghi: **64 giorni** (autunno 2023, tecnico) · **40** (estate 2024) · **39** (estate 2025). Ogni estate la chat si spegne.',
      metodo: M.grafico,
    },
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'I mesi da ricordare',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Dicembre 2022**', valore: '2.613', testo: 'messaggi in 17 giorni: 153,7 al giorno, mai più così' },
            { chiave: '**Maggio 2023**', valore: '4.169', testo: 'il mese più pieno di sempre' },
            { chiave: '**Febbraio 2024**', valore: '3.889', testo: 'il secondo mese di sempre' },
            { chiave: '**Novembre 2023**', valore: '0', testo: 'non silenzio: erano attivi i messaggi effimeri' },
            { chiave: '**Luglio 2025**', valore: '4', testo: 'gruppo chiuso ai soli admin dal 10/06/2025' },
          ],
        },
      ],
      metodo: M.grafico,
    },
    {
      occhiello: 'Il tempo',
      titolo: 'Anno per anno',
      sotto: 'Il ritmo si misura in messaggi al giorno, non in totali',
      blocchi: [
        {
          tipo: 'tabella',
          colonne: ['Anno', 'Giorni', 'Messaggi', 'Al giorno', 'Persone', 'Parole a msg'],
          destra: [1, 2, 3, 4, 5],
          evidenzia: [1],
          righe: [
            ['2022', '17', '2.613', '153,7', '20', '5,26'],
            ['2023', '365', '14.413', '39,5', '25', '5,48'],
            ['2024', '366', '12.572', '34,3', '22', '5,26'],
            ['2025', '365', '13.727', '37,6', '19', '5,37'],
            ['2026', '278', '8.423', '30,3', '17', '**5,86**'],
          ],
        },
        { tipo: 'paragrafo', testo: 'Il 2023 conta 72 giorni di messaggi effimeri, spariti dall’export; il 2026 si ferma al 5 ottobre.' },
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Più intenso · 2023', testo: '39,5 messaggi al giorno tra gli anni interi' },
            { titolo: 'Più partecipato · 2023', testo: '25 persone, 13 sopra i 100 messaggi' },
            { titolo: 'Più chiacchierato · 2026', testo: '5,86 parole a messaggio' },
          ],
        },
      ],
      chiusa: 'Il 2022 ha la media più alta ma dura 17 giorni: fuori concorso. Nel 2026 si scrive meno spesso, ma con messaggi più lunghi.',
      metodo: M.anni,
    },
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'Il mese record',
      blocchi: [
        { tipo: 'numero', valore: 4169, testo: 'messaggi a **maggio 2023**, il mese di calendario più pieno' },
        {
          tipo: 'barre',
          titolo: 'I tre mesi più pieni',
          voci: [
            { nome: 'maggio 2023', valore: 4169, testo: '134,5 al giorno', evidenza: true },
            { nome: 'febbraio 2024', valore: 3889, testo: '134,1 al giorno' },
            { nome: 'gennaio 2023', valore: 2838, testo: '91,5 al giorno' },
          ],
        },
      ],
      metodo: M.mese,
    },
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'Maggio 2023, da vicino',
      blocchi: [
        {
          tipo: 'cifre',
          celle: [
            { valore: '134,5', etichetta: 'messaggi al giorno' },
            { valore: '8,06%', etichetta: 'dell’intera chat in 31 giorni' },
            { valore: '3,8×', etichetta: 'il mese medio (1.085)' },
            { valore: 21, etichetta: 'persone hanno scritto' },
          ],
        },
      ],
      chiusa: 'È la fine della 2ª: il mese con più messaggi su «verifica» (102), #egregionascecappelletta (18/05) e la conversazione più lunga di sempre (21/05).',
      metodo: M.mese,
    },
    {
      occhiello: 'Il tempo',
      titolo: 'Il giorno record',
      sotto: 'Mercoledì 14 febbraio 2024 · San Valentino',
      blocchi: [
        { tipo: 'numero', valore: 821, testo: 'messaggi in un giorno' },
        {
          tipo: 'fumetto',
          autore: 'Gianmarco',
          testo: 'ce scritto i genitori dei figli a rischio sospensione saranno contattati',
          data: '14/02/2024 · 14:00',
        },
        { tipo: 'paragrafo', testo: 'Benetti quel giorno: **261 messaggi**, il suo record personale.' },
      ],
      metodo: M.giorno,
    },
    {
      occhiello: 'Il tempo',
      titolo: 'San Valentino, ora per ora',
      blocchi: [
        {
          tipo: 'cifre',
          celle: [
            { valore: 14, etichetta: 'persone' },
            { valore: '9 ore', etichetta: 'dalle 13:21 alle 22:27' },
            { valore: 459, etichetta: 'in un’ora (13:26–14:26)' },
            { valore: 111, etichetta: 'in dieci minuti' },
            { valore: '22×', etichetta: 'il giorno medio (37,2)' },
            { valore: '117×', etichetta: 'il giorno mediano (7)' },
          ],
        },
      ],
      chiusa: 'Il giorno più pieno della chat è San Valentino, ma l’argomento era un avviso della scuola: 821 messaggi in 9 ore.',
      metodo: M.giorno,
    },
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'Quando eravamo più presenti',
      sotto: 'Messaggi per ora del giorno, quasi quattro anni sommati',
      blocchi: [
        { tipo: 'numero', valore: '20:00', piccolo: true, testo: 'l’ora più attiva: **5.251 messaggi**' },
        {
          tipo: 'colonne',
          descrizione: 'Messaggi per ora del giorno: quasi nulla tra l’1 e le 6, poi salita fino al picco delle 20 (5.251 messaggi).',
          // altezze relative lette dal grafico del deck (1 = le 20, 5.251 messaggi)
          valori: [
            0.128, 0.021, 0.012, 0.011, 0.017, 0.017, 0.229, 0.429, 0.209, 0.254, 0.335, 0.335, 0.445, 0.651, 0.795, 0.627,
            0.696, 0.565, 0.614, 0.722, 1, 0.922, 0.591, 0.252,
          ],
          evidenza: [20],
          bassi: [4, 5],
          etichette: [{ i: 20, testo: '5.251' }],
          asse: [
            { i: 0, testo: '00' },
            { i: 6, testo: '06' },
            { i: 12, testo: '12' },
            { i: 18, testo: '18' },
            { i: 23, testo: '23' },
          ],
        },
      ],
      chiusa: 'Alle 4 e alle 5 del mattino: **31** messaggi ciascuna, in quasi quattro anni.',
      metodo: M.ore,
    },
    {
      tema: 'tint',
      occhiello: 'Il tempo',
      titolo: 'Le fasce del giorno',
      blocchi: [
        {
          tipo: 'barre',
          voci: [
            { nome: 'pomeriggio · 13–19', valore: 40.1, mostra: '40,1%', evidenza: true },
            { nome: 'sera · 19–24', valore: 35.4, mostra: '35,4%' },
            { nome: 'mattina · 6–13', valore: 22.7, mostra: '22,7%' },
            { nome: 'notte · 0–6', valore: 1.86, mostra: '1,86%' },
          ],
        },
        { tipo: 'paragrafo', testo: '**7.492** messaggi tra le 8 e le 13, dal lunedì al sabato: il 14,5% del totale.' },
      ],
      chiusa: 'Dalle 13 a mezzanotte passa il **75,5%** dei messaggi.',
      metodo: M.ore,
    },
    {
      occhiello: 'Il tempo',
      titolo: 'La settimana',
      sotto: 'Messaggi medi per giorno della settimana',
      blocchi: [
        {
          tipo: 'barre',
          voci: [
            { nome: 'lunedì', valore: 39.9 },
            { nome: 'martedì', valore: 39.6 },
            { nome: 'mercoledì', valore: 43.2 },
            { nome: 'giovedì', valore: 41.3 },
            { nome: 'venerdì', valore: 44.9, evidenza: true },
            { nome: 'sabato', valore: 26.3 },
            { nome: 'domenica', valore: 25 },
          ],
        },
        {
          tipo: 'cifre',
          celle: [
            { valore: '+79,6%', etichetta: 'messaggi al giorno, venerdì contro domenica' },
            { valore: '4,67 → 3,27', etichetta: 'persone attive in media, giovedì contro domenica' },
          ],
        },
      ],
      chiusa: 'Il sabato era giorno di scuola (settimana lunga), ma nella chat crolla quasi come la domenica: 26,3 contro 25,0.',
      metodo: M.settimana,
    },

    /* ── 3 · Le persone ───────────────────────────────────────────────── */
    capitolo(3, 'Le persone', 'Chi scrive, quanto, e in quali orari.'),
    {
      tema: 'tint',
      occhiello: 'Le persone',
      titolo: 'La classifica completa',
      sotto: 'Messaggi inviati (testo + media) e quota sul totale',
      blocchi: [
        {
          tipo: 'barre',
          voci: [
            { nome: '1 · Adam', valore: 11126, mostra: '11.126 · 21,50%', evidenza: true },
            { nome: '2 · Alberto', valore: 7696, mostra: '7.696 · 14,87%' },
            { nome: '3 · Daniel', valore: 6417, mostra: '6.417 · 12,40%' },
            { nome: '4 · Federico', valore: 5384, mostra: '5.384 · 10,40%' },
            { nome: '5 · Benetti', valore: 3619, mostra: '3.619 · 6,99%' },
            { nome: '6 · Gianmarco', valore: 3502, mostra: '3.502 · 6,77%' },
            { nome: '7 · Damiano', valore: 2847, mostra: '2.847 · 5,50%' },
            { nome: '8 · Luca', valore: 2630, mostra: '2.630 · 5,08%' },
            { nome: '9 · Francesco', valore: 1886, mostra: '1.886 · 3,64%' },
            { nome: '10 · Riccardo', valore: 1764, mostra: '1.764 · 3,41%' },
            { nome: '11 · David', valore: 1722, mostra: '1.722 · 3,33%' },
          ],
        },
      ],
      metodo: M.classifica,
    },
    {
      tema: 'tint',
      occhiello: 'Le persone',
      titolo: 'Dal 12° al 25° posto',
      blocchi: [
        {
          tipo: 'righe',
          colonne: 2,
          voci: [
            { chiave: '12 Giovanni', valore: 688 },
            { chiave: '19 Lorenzo', valore: 116 },
            { chiave: '13 Tommaso', valore: 638 },
            { chiave: '20 Ruggeri', valore: 77 },
            { chiave: '14 Manuel', valore: 502 },
            { chiave: '21 Gioia', valore: 71 },
            { chiave: '15 Aurora', valore: 306 },
            { chiave: '22 Oliver', valore: 52 },
            { chiave: '16 Sahara', valore: 296 },
            { chiave: '23 Luna', valore: 43 },
            { chiave: '17 Davide', valore: 219 },
            { chiave: '24 Pippo (esterno)', valore: 19 },
            { chiave: '18 Prosper', valore: 119 },
            { chiave: '25 Giulia', valore: 8 },
          ],
        },
        {
          tipo: 'cifre',
          celle: [
            { valore: '48,8%', etichetta: 'dei messaggi scritti da **3 persone**' },
            { valore: '59,2%', etichetta: 'da **4 persone**' },
            { valore: '90,6%', etichetta: 'da **10 persone**' },
            { valore: '0,98%', etichetta: 'dagli **ultimi 8** insieme' },
          ],
        },
      ],
      chiusa: 'Tra 1° e 2° ci sono **3.430 messaggi** (Adam = 1,45× Alberto). Tre persone scrivono quasi metà della chat.',
      metodo: M.classifica,
    },
    {
      occhiello: 'Le persone',
      titolo: 'Cambia la metrica, cambia il podio',
      sotto: 'Le 17 persone con almeno 200 messaggi',
      blocchi: [
        { tipo: 'numero', valore: '14° → 1°', piccolo: true, testo: '**Manuel**: 14° per numero di messaggi, 1° per lunghezza media (8,44 parole)' },
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Più parole in totale', testo: '1 **Adam** 28,6% delle parole · 2 Alberto 12,8% · 3 Daniel 10,4%' },
            { titolo: 'Più lunghi in media', testo: '1 **Manuel** 8,44 parole · 2 Giovanni 7,77 · 3 Adam 7,24' },
            { titolo: 'Più messaggi da 0–1 parola', testo: '1 **David** 32,0% dei suoi · 2 Damiano 29,3% · 3 Tommaso 27,8%' },
          ],
        },
      ],
      metodo: M.metriche,
    },
    {
      occhiello: 'Le persone',
      titolo: 'Chi sale e chi scende',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Luca**', valore: '8° → 5°', testo: 'per messaggi → per parole' },
            { chiave: '**Benetti**', valore: '5° → 7°', testo: 'per messaggi → per parole' },
            { chiave: '**Damiano**', valore: '7° → 16°', testo: 'per messaggi → per lunghezza media' },
          ],
        },
      ],
      chiusa: 'Adam è primo per messaggi (11.126), parole (69.795) e caratteri (349.578). Sulla lunghezza media il podio passa a chi scrive meno, ma per esteso.',
      metodo: M.metriche,
    },
    {
      tema: 'tint',
      occhiello: 'Le persone',
      titolo: 'I notturni',
      sotto: 'Messaggi tra mezzanotte e le 6:00',
      blocchi: [
        { tipo: 'numero', valore: 305, testo: 'messaggi notturni di **Alberto**, in 51 notti diverse: il 3,96% dei suoi. Tutto il gruppo: 962, l’1,86% del totale.' },
        {
          tipo: 'barre',
          titolo: 'Quota notturna dei propri messaggi',
          voci: [
            { nome: 'Giovanni', valore: 4.51, mostra: '4,51% · 31 msg' },
            { nome: 'Alberto', valore: 3.96, mostra: '3,96% · 305 msg', evidenza: true },
            { nome: 'Tommaso', valore: 2.98, mostra: '2,98% · 19 msg' },
            { nome: 'Manuel', valore: 2.79, mostra: '2,79% · 14 msg' },
            { nome: 'Riccardo', valore: 2.32, mostra: '2,32% · 41 msg' },
            { nome: 'Gianmarco', valore: 2, mostra: '2,00% · 70 msg' },
          ],
        },
      ],
      metodo: M.notturni,
    },
    {
      tema: 'tint',
      occhiello: 'Le persone',
      titolo: 'Le notti, senza le eccezioni',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Il caso Davide', testo: '9,13% di notte, ma 16 dei suoi 20 messaggi notturni sono nella stessa notte: il 23/06/2026, vigilia dei primi orali.' },
            { titolo: 'Senza la notte pre-orali', testo: 'Alberto 199 · Federico 88 · Adam 77 · Daniel 74 · Gianmarco 70' },
          ],
        },
      ],
      chiusa: 'In valore assoluto la notte ha un nome solo. In percentuale Giovanni supera Alberto, ma con 31 messaggi in quasi quattro anni.',
      metodo: M.notturni,
    },
    {
      occhiello: 'Le persone',
      titolo: 'I diurni',
      sotto: 'Quota dei propri messaggi scritti tra le 6:00 e le 19:00',
      blocchi: [
        { tipo: 'numero', valore: '76,8%', testo: '**Aurora**: 3 messaggi su 4 scritti di giorno. Il gruppo nel suo insieme: 62,8%.' },
        {
          tipo: 'tabella',
          colonne: ['Più diurni', '', 'Meno diurni', ''],
          destra: [1, 3],
          righe: [
            ['**Aurora**', '76,8%', '**Benetti**', '53,6%'],
            ['**Davide**', '74,9%', '**Gianmarco**', '58,6%'],
            ['**Luca**', '73,9%', '**David**', '59,1%'],
            ['**Sahara**', '72,0%', '**Alberto**', '60,2%'],
            ['**Damiano**', '70,2%', 'Gruppo', '62,8%'],
          ],
        },
        { tipo: 'paragrafo', testo: 'La fascia più frequente, per quasi tutti, è il **pomeriggio** (13–19). Fanno eccezione Davide (la mattina, 42%), Benetti (la sera, 45,2%) e David (la sera, 39,7%).' },
      ],
      chiusa: 'Tra la persona più diurna e la meno diurna ci sono **23 punti**: Aurora scrive di giorno 3 messaggi su 4, Benetti poco più di 1 su 2.',
      metodo: M.diurni,
    },

    /* ── 4 · Il linguaggio ────────────────────────────────────────────── */
    capitolo(4, 'Il linguaggio', 'Parole, firme, emoji, espressioni e inside joke.'),
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Di cosa parlavamo',
      sotto: 'Le parole di contenuto più usate (articoli, verbi comuni e nomi propri esclusi)',
      blocchi: [
        { tipo: 'numero', valore: 'domani', piccolo: true, testo: '**1.204 volte**: la parola di contenuto più usata in tutta la chat' },
        {
          tipo: 'chip',
          titolo: 'Le altre, in ordine',
          voci: [
            { testo: 'cazzo **988**' },
            { testo: 'dio **558**' },
            { testo: 'oggi **522**' },
            { testo: 'basta **460**' },
            { testo: 'raga **450**' },
            { testo: 'figa **413**' },
            { testo: 'scuola **411**' },
            { testo: 'classe **401**' },
            { testo: 'verifica **386**' },
            { testo: 'foto **356**' },
            { testo: 'bro **340**' },
            { testo: 'prof **308**' },
          ],
        },
      ],
      chiusa: '«domani» batte perfino la parolaccia più usata: **1.204 a 988**. La chat era il diario del giorno dopo.',
      metodo: M.parole,
    },
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Scuola, fuori, espressioni',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Scuola', testo: 'verifica 386 · prof 308 · inglese 217 · studiare 201 · storia 199 · italiano 176 · interroga 148 · gita 145' },
            { titolo: 'Fuori dalla scuola', testo: 'foto 356 · mamma 260 · video 146 · euro 105 · lavoro 105 · soldi 86 · macchina 69 · mantova 68' },
            { titolo: 'Espressioni', testo: '«la verifica» 225 · «dio cane» 109 · «ma che cazzo» 64 · «rotto il cazzo» 59' },
          ],
        },
      ],
      metodo: M.parole,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'Le firme',
      sotto: 'La parola che ognuno usa molto più degli altri',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Francesco**', valore: '«importa»', testo: '13 msg · 77× gli altri · 81% degli usi' },
            { chiave: '**Adam**', valore: '«ahahahah»', testo: '74 msg · 19× · 85% degli usi' },
            { chiave: '**Alberto**', valore: '«pagate»', testo: '16 msg · 32× · 84% · e «bozzolo» 27' },
            { chiave: '**Daniel**', valore: '«tolgo»', testo: '18 msg · 13× · 69% · e «sennò» 40' },
            { chiave: '**Federico**', valore: '«gle»', testo: '23 msg · 32× · 82% degli usi' },
            { chiave: '**Luca**', valore: '«ragas»', testo: '40 msg · 42× · 73% · e «perchè» 67' },
            { chiave: '**Gianmarco**', valore: '«haha»', testo: '47 msg · 29× · 71% degli usi' },
          ],
        },
      ],
      metodo: M.firme,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'Le firme, seconda parte',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Damiano**', valore: '«rega»', testo: '22 msg · 13× · e «okok» 15' },
            { chiave: '**David**', valore: '«vez»', testo: '11 msg · 28× gli altri' },
            { chiave: '**Manuel**', valore: '«pagamento»', testo: '9 msg · 64× gli altri' },
            { chiave: '**Giovanni**', valore: '«iscrizione»', testo: '9 msg · 90% degli usi' },
            { chiave: '**Riccardo**', valore: '«caro»', testo: '15 msg · 9× · e «cazzo» nel 6% dei suoi' },
            { chiave: '**Benetti**', valore: '«manco»', testo: '31 msg · 7,6× gli altri' },
          ],
        },
        { tipo: 'paragrafo', testo: '**Come leggerle.** «19×» = la parola compare in proporzione 19 volte più spesso nei suoi messaggi che in quelli degli altri. «85% degli usi» = quota di tutte le volte che compare nella chat.' },
      ],
      chiusa: 'Quasi ognuno ha una parola sua. La più esclusiva: «importa» di Francesco, **77 volte** più frequente che nel resto della chat.',
      metodo: M.firme,
    },
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Gli emoji',
      sotto: 'Emoji scritti nei messaggi di testo (gli sticker non contano)',
      blocchi: [
        { tipo: 'numero', valore: '😂', piccolo: true, testo: '**1.832 volte**: il 43,6% di tutti gli emoji della chat, usato da 19 persone' },
        {
          tipo: 'barre',
          titolo: 'Top 10',
          voci: [
            { nome: '😂', valore: 1832, evidenza: true },
            { nome: '🤣', valore: 602 },
            { nome: '😭', valore: 97 },
            { nome: '❤️', valore: 73 },
            { nome: '⚠️', valore: 48 },
            { nome: '😘', valore: 40 },
            { nome: '🎺', valore: 36 },
            { nome: '👍🏻', valore: 36 },
            { nome: '😱', valore: 29 },
            { nome: '👍', valore: 27 },
          ],
        },
      ],
      metodo: M.emoji,
    },
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Gli emoji, in cifre',
      blocchi: [
        {
          tipo: 'cifre',
          celle: [
            { valore: 4200, etichetta: 'emoji in 2.194 messaggi' },
            { valore: 410, etichetta: 'emoji diversi' },
            { valore: '58%', etichetta: 'sono 😂 oppure 🤣' },
            { valore: 212, etichetta: 'volte 😂😂 · 109 volte 😂😂😂' },
          ],
        },
      ],
      chiusa: 'Nel 2024 gli emoji raddoppiano (13,3 ogni 100 messaggi, l’anno di 🤣), ma 😂 resta il primo in ogni anno.',
      metodo: M.emoji,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'La mappa degli emoji',
      sotto: 'Chi usa quali emoji, e quanto',
      blocchi: [
        {
          tipo: 'righe',
          titolo: 'Solo loro · 100% degli usi',
          voci: [
            { chiave: '🅰️ **Alberto**', valore: '21 su 21' },
            { chiave: '🫨 **Adam** · solo nel 2024', valore: '18 su 18' },
            { chiave: '🥵 **Riccardo**', valore: '14 su 14' },
            { chiave: '😲 **Adam**', valore: '10 su 10' },
          ],
        },
        {
          tipo: 'righe',
          titolo: 'Quasi solo loro',
          voci: [
            { chiave: '🍷 **Francesco**', valore: '93%' },
            { chiave: '🙄 **Tommaso**', valore: '90%' },
            { chiave: '🩷 **Alberto**', valore: '90%' },
            { chiave: '😹 **Benetti**', valore: '82%' },
            { chiave: '🦁 **Gianmarco**', valore: '80%' },
          ],
        },
      ],
      metodo: M.mappaemoji,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'Densità, varietà, monotonia',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Densità · emoji ogni 100 messaggi', testo: '**Sahara 53,8** · Aurora 31,5 · Riccardo 20,2 — all’opposto **Davide 2,3**: 5 emoji in tutto' },
            { titolo: 'Varietà · emoji diversi', testo: '**Alberto 162** · Adam 153 — all’opposto Davide 4 · Manuel 8' },
            { titolo: 'Monotematici · quota di 😂', testo: '**Damiano 77%** (157 su 204) · **Federico 71%** (410 su 579)' },
          ],
        },
      ],
      chiusa: '😂 è di tutti. Le firme stanno negli emoji rari: tra quelli usati almeno 10 volte, **4** appartengono a una persona sola.',
      metodo: M.mappaemoji,
    },
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Le espressioni nel tempo',
      sotto: 'Quando nascono, quanto durano, quando esplodono',
      blocchi: [
        { tipo: 'numero', valore: '«fra»', piccolo: true, testo: '**1.554** messaggi · 16 persone · 41 mesi su 47 · picco a febbraio 2024 (198)' },
        { tipo: 'fumetto', etichetta: 'Il primo', autore: 'Adam', testo: 'Un giorno fra', data: '16/12/2022 · 08:01' },
        { tipo: 'fumetto', etichetta: 'L’ultimo', autore: 'Adam', testo: 'Gasa fra', data: '05/10/2026 · 11:00' },
      ],
      metodo: M.fra,
    },
    {
      tema: 'tint',
      occhiello: 'Il linguaggio',
      titolo: 'Nascono, esplodono, spariscono',
      blocchi: [
        {
          tipo: 'colonne',
          titolo: '«bro» anno per anno',
          descrizione: 'Messaggi con «bro» per anno: 2 nel 2022, 20 nel 2023, 64 nel 2024, 189 nel 2025, 65 nel 2026.',
          valori: [2, 20, 64, 189, 65],
          evidenza: [3],
          etichette: [
            { i: 0, testo: '2' },
            { i: 1, testo: '20' },
            { i: 2, testo: '64' },
            { i: 3, testo: '189' },
            { i: 4, testo: '65' },
          ],
          asse: [
            { i: 0, testo: '2022' },
            { i: 1, testo: '2023' },
            { i: 2, testo: '2024' },
            { i: 3, testo: '2025' },
            { i: 4, testo: '2026' },
          ],
        },
        {
          tipo: 'schede',
          voci: [
            { titolo: '«cosa si porta»', testo: '**39** volte, tutte nel 2023: Federico 27' },
            { titolo: '«aura» · «miao»', testo: '«aura» nasce il 15/02/2025, 17 usi su 20 nel 2026. «miao» nasce il 15/01/2024.' },
          ],
        },
      ],
      chiusa: 'Febbraio 2024 è il mese di picco di **fra, godo, giuro, sincero, svegliati, stai zitto, fenomeno, rimasto**.',
      metodo: M.fra,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'Gli inside joke',
      sotto: 'Soprannomi e tormentoni misurati per durata e diffusione',
      blocchi: [
        { tipo: 'numero', valore: '«dada»', piccolo: true, testo: '**227 messaggi** · 17 persone · per 1.389 giorni' },
        { tipo: 'fumetto', etichetta: 'Il primo «dada»', autore: 'Adam', testo: 'Raga dada è entrato in classe ?', data: '16/12/2022' },
      ],
      chiusa: '«dada» è l’unico che attraversa tutta la chat: dal secondo giorno all’ultimo, scritto da 17 persone diverse.',
      metodo: M.insidejoke,
    },
    {
      occhiello: 'Il linguaggio',
      titolo: 'Gli altri tormentoni',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**pekko · pzkko · pecco**', testo: '43 messaggi, 11 persone. Nasce 2 minuti dopo il primo messaggio: Daniel, «dammi l’amministratore a me pzkko»' },
            { chiave: '**«Gianna»**', testo: '21 messaggi, dal 16/12/2022 al 30/09/2026: «Gianna quitti università?»' },
            { chiave: '**egregio · insigne · cappelletta**', testo: '19 messaggi, vita di 5 mesi (29/12/2022 → 31/05/2023), picco a maggio 2023' },
            { chiave: '**Porsche**', testo: 'nasce il 30/01/2024 (Francesco): 8 dei 10 usi in quel mese' },
            { chiave: '**Pecchini piscine**', testo: 'dal 03/10/2023 (Riccardo, «Pecchini piscine fa i soldi») al 17/07/2026' },
            { chiave: '**«non piove»**', testo: '9 messaggi, 6 di Federico' },
          ],
        },
        { tipo: 'paragrafo', testo: 'Pecorino sardo (4 volte per iscritto), Mp3 Bluetooth (2), Masullas (0, solo nel nome del gruppo): vivono nei vocali e nei video, che qui non si leggono.' },
      ],
      metodo: M.insidejoke,
    },

    /* ── 5 · Le dinamiche ─────────────────────────────────────────────── */
    capitolo(5, 'Le dinamiche', 'Chi apre le conversazioni, chi le accende, le coppie e i gruppi che si rispondono.'),
    {
      tema: 'tint',
      occhiello: 'Le dinamiche',
      titolo: 'Chi apre le conversazioni',
      sotto: 'Il primo messaggio dopo almeno un’ora di silenzio',
      blocchi: [
        { tipo: 'numero', valore: 347, testo: 'conversazioni aperte da **Alberto**: il 17,8% di 1.950, 3,0 volte la media delle 17 persone principali' },
        {
          tipo: 'barre',
          voci: [
            { nome: 'Alberto', valore: 347, evidenza: true },
            { nome: 'Adam', valore: 315 },
            { nome: 'Daniel', valore: 248 },
            { nome: 'Federico', valore: 230 },
            { nome: 'Damiano', valore: 181 },
            { nome: 'Luca', valore: 100 },
          ],
        },
      ],
      metodo: M.aperture,
    },
    {
      tema: 'tint',
      occhiello: 'Le dinamiche',
      titolo: 'Aprire e rispondere',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Aperture rispetto a quanto si scrive', testo: 'più del previsto: **Tommaso 2,35×** · Manuel 1,88× · Damiano 1,67×. Meno: **Benetti 0,59×** · Gianmarco 0,61× · Adam 0,74×' },
            { titolo: 'Chi risponde per primo', testo: '**Federico 280** · Adam 266 · Alberto 242. Coppia più frequente: Alberto apre, Federico risponde (76 volte)' },
          ],
        },
      ],
      chiusa: 'Alberto è 2° per messaggi ma 1° per aperture. Adam scrive più di tutti, ma apre meno di quanto il suo volume farebbe prevedere.',
      metodo: M.aperture,
    },
    {
      occhiello: 'Le dinamiche',
      titolo: 'Chi accende la chat',
      sotto: 'Un messaggio dopo il silenzio, e in mezz’ora esplode tutto',
      blocchi: [
        { tipo: 'numero', valore: 46, testo: 'accensioni in quattro anni: un messaggio dopo almeno 60′ di silenzio, seguito in 30′ da almeno 40 messaggi di almeno 5 altre persone' },
        {
          tipo: 'chip',
          titolo: 'Chi le ha fatte',
          voci: [
            { testo: '**Adam 7**', evidenza: true },
            { testo: '**Gianmarco 7**', evidenza: true },
            { testo: 'Daniel 6' },
            { testo: 'Alberto 5' },
            { testo: 'Manuel 4' },
            { testo: 'Federico 4' },
          ],
        },
      ],
      metodo: M.accende,
    },
    {
      occhiello: 'Le dinamiche',
      titolo: 'Le cinque accensioni più grandi',
      sotto: 'Il messaggio che accende e quanti ne arrivano nei 30 minuti dopo',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '«che cazzo dici»', valore: 232, testo: '**Gianmarco** · 20/12/2022 21:55' },
            { chiave: '«rega»', valore: 220, testo: '**Gianmarco** · 14/02/2024 13:21' },
            { chiave: '«dio porco ragas»', valore: 209, testo: '**Riccardo** · 23/06/2026 00:15' },
            { chiave: '«O raga è finita»', valore: 201, testo: '**Adam** · 26/01/2023 20:43' },
            { chiave: '«buon viaggio a tutti (tranne a girelli, zanini)»', valore: 176, testo: '**Alberto** · 02/03/2026 08:57' },
          ],
        },
      ],
      chiusa: 'Gianmarco firma le due accensioni più grandi di sempre. Manuel ne fa 4 con soli 502 messaggi in tutto.',
      metodo: M.accende,
    },
    {
      tema: 'tint',
      occhiello: 'Le dinamiche',
      titolo: 'Le coppie',
      sotto: 'Chi si risponde entro 3 minuti · 25.533 scambi',
      blocchi: [
        { tipo: 'numero', valore: 2160, testo: 'scambi tra **Adam ↔ Daniel**: l’8,46% di tutti, la coppia più frequente' },
        {
          tipo: 'barre',
          titolo: 'Le coppie successive',
          voci: [
            { nome: 'Adam ↔ Federico', valore: 1557 },
            { nome: 'Adam ↔ Alberto', valore: 1433 },
            { nome: 'Adam ↔ Benetti', valore: 1415 },
            { nome: 'Alberto ↔ Federico', valore: 928 },
            { nome: 'Daniel ↔ Federico', valore: 846 },
          ],
        },
      ],
      metodo: M.coppie,
    },
    {
      tema: 'tint',
      occhiello: 'Le dinamiche',
      titolo: 'Ping-pong e anni',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Ping-pong · almeno 3 scambi di fila', testo: 'Adam ↔ Daniel: **159 volte**, record **11 di fila**, durata media 54 secondi' },
            { titolo: 'Nel tempo', testo: 'Adam ↔ Benetti: solo 2022–24 · Adam ↔ Alberto: 227 (2023) → 536 (2025) · Adam ↔ Federico: picco 739 (2025)' },
          ],
        },
      ],
      chiusa: 'Adam compare in **6 delle 10** coppie più frequenti. La coppia n.1 cambia quasi ogni anno, ma Adam c’è sempre.',
      metodo: M.coppie,
    },
    {
      occhiello: 'Le dinamiche',
      titolo: 'I gruppi conversazionali',
      sotto: 'Chi compare insieme nelle 582 conversazioni con almeno 20 messaggi',
      blocchi: [
        { tipo: 'numero', valore: 165, testo: '**Adam · Daniel · Federico**: il 28,4% delle conversazioni grandi' },
        {
          tipo: 'righe',
          titolo: 'Un testa a testa',
          voci: [
            { chiave: '1 Adam · Daniel · Federico', valore: 165 },
            { chiave: '2 Alberto · Daniel · Federico', valore: 163 },
            { chiave: '3 Adam · Alberto · Federico', valore: 162 },
          ],
        },
        {
          tipo: 'righe',
          titolo: 'Il trio di ogni anno',
          voci: [
            { chiave: '**2ª** Adam · Benetti · Daniel' },
            { chiave: '**3ª** Adam · Benetti · Daniel' },
            { chiave: '**4ª** Adam · Daniel · Federico' },
            { chiave: '**5ª** Adam · Alberto · Federico' },
          ],
        },
      ],
      metodo: M.gruppi,
    },
    {
      occhiello: 'Le dinamiche',
      titolo: 'Quartetti e quintetti',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Quartetto', testo: 'Adam · Alberto · Daniel · Federico: **107** (18,4%)' },
            { titolo: 'Quintetto', testo: 'Alberto · Damiano · Daniel · Federico · Gianmarco: **60**, 2,2× l’atteso' },
            { titolo: 'Sopra le attese', testo: 'Benetti · David · Francesco · Gianmarco: **27**, 4,4× l’atteso (2022–24)' },
          ],
        },
      ],
      chiusa: 'Il nucleo che si ripete è di quattro nomi: Adam, Alberto, Daniel, Federico insieme in quasi una conversazione grande su cinque.',
      metodo: M.gruppi,
    },

    /* ── 6 · Argomenti ed eventi ──────────────────────────────────────── */
    capitolo(6, 'Argomenti ed eventi', 'La scuola, la vita fuori, gli episodi che hanno fatto esplodere la chat e la maturità.'),
    {
      tema: 'tint',
      occhiello: 'Argomenti ed eventi',
      titolo: 'La scuola nella chat',
      sotto: 'Messaggi di testo con un riferimento scolastico esplicito',
      blocchi: [
        { tipo: 'numero', valore: 5504, testo: 'messaggi esplicitamente scolastici: il **12,2%** dei messaggi di testo' },
        {
          tipo: 'barre',
          voci: [
            { nome: 'verifiche e voti', valore: 1641, evidenza: true },
            { nome: 'prof e note', valore: 1366 },
            { nome: 'compiti e progetti', valore: 886 },
            { nome: 'orari e assenze', valore: 734 },
            { nome: 'gite e uscite', valore: 286 },
            { nome: 'maturità e PCTO', valore: 253 },
          ],
        },
      ],
      metodo: M.scuola,
    },
    {
      tema: 'tint',
      occhiello: 'Argomenti ed eventi',
      titolo: 'Chi, cosa e quando',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Chi ne parla', testo: '**Adam 1.569** · Daniel 731 · Alberto 624. In proporzione ai propri messaggi: Davide 22,9% · Luca 22,3%' },
            { titolo: 'Materie più citate', testo: 'italiano **263** · inglese **216** · matematica **207** · storia **195** · motoria **172** · progettazione **110** · topografia **104**' },
            { titolo: 'Quando', testo: 'Più messaggi: **maggio 2023** (691). In proporzione: **gennaio 2026** (20,6%). Ora più scolastica: **le 6 del mattino** (25,9%)' },
          ],
        },
      ],
      chiusa: 'Un messaggio su otto parla di scuola. Alle 6 del mattino, uno su quattro.',
      metodo: M.scuola,
    },
    {
      occhiello: 'Argomenti ed eventi',
      titolo: 'La vita fuori dalla scuola',
      sotto: 'Messaggi di testo con un argomento extrascolastico riconoscibile',
      blocchi: [
        { tipo: 'numero', valore: 3535, testo: 'messaggi su argomenti fuori dalla scuola: il **7,8%** dei messaggi di testo' },
        {
          tipo: 'cifre',
          celle: [
            { valore: '58 · 35 · 7', etichetta: 'per cento: scuola, fuori, entrambi, tra i messaggi con un argomento' },
            { valore: '6,5 → 10%', etichetta: 'quota extrascolastica, dal 2023 al 2026' },
          ],
        },
      ],
      metodo: M.fuori,
    },
    {
      occhiello: 'Argomenti ed eventi',
      titolo: 'Di cosa, fuori dalla scuola',
      blocchi: [
        {
          tipo: 'barre',
          voci: [
            { nome: 'social, foto e meme', valore: 887, evidenza: true },
            { nome: 'soldi e acquisti', valore: 530 },
            { nome: 'calcio e scommesse', valore: 446 },
            { nome: 'gruppo e admin', valore: 360 },
            { nome: 'auto, moto e mezzi', valore: 289 },
            { nome: 'cibo', valore: 288 },
            { nome: 'uscite e feste', valore: 225 },
            { nome: 'lavoro', valore: 223 },
            { nome: 'tecnologia e IA', valore: 221 },
            { nome: 'viaggi', valore: 194 },
            { nome: 'videogiochi', valore: 90 },
            { nome: 'musica', valore: 8 },
          ],
        },
      ],
      chiusa: 'Lo spazio per il «fuori» cresce mentre la scuola finisce. La musica, per iscritto, quasi non esiste: 8 messaggi.',
      metodo: M.fuori,
    },
    {
      tema: 'tint',
      occhiello: 'Argomenti ed eventi',
      titolo: 'Gli episodi',
      sotto: 'I periodi in cui la chat ha scritto almeno 4 volte la media',
      blocchi: [
        { tipo: 'numero', valore: '15,2%', testo: 'della chat in soli **22 giorni**: 7.856 messaggi nell’1,6% del calendario' },
        {
          tipo: 'righe',
          voci: [
            { chiave: '**La fondazione**', valore: 2311, testo: '16–24/12/2022 · 19 persone · 257 al giorno · 6,9× la media' },
            { chiave: '**La fine della 2ª**', valore: 2190, testo: '18–22/05/2023 · 20 persone · 438 al giorno · 11,8×' },
            { chiave: '**Lo stage PCTO**', valore: 1770, testo: '05–09/02/2024 · 19 persone · 354 al giorno · 9,5×' },
            { chiave: '**Il rischio sospensione**', valore: 821, testo: '14/02/2024 · 14 persone · in un solo giorno · **22,1×**' },
            { chiave: '**Il consiglio di classe**', valore: 764, testo: '10–11/11/2025 · 14 persone · 382 al giorno · 10,3×' },
          ],
        },
      ],
      chiusa: 'L’episodio più grande è la nascita del gruppo; il più intenso è un solo giorno, il 14/02/2024: **22 giorni medi** in uno.',
      metodo: M.episodi,
    },
    {
      occhiello: 'Argomenti ed eventi',
      titolo: 'La maturità',
      sotto: 'Prima, durante e dopo gli esami del 2026',
      blocchi: [
        { tipo: 'numero', valore: 141, testo: 'messaggi al giorno durante gli esami (18–26/06): **4 volte** gennaio–maggio, e 1 su 5 scritto di notte' },
        {
          tipo: 'tabella',
          colonne: ['Periodo', 'Giorni', 'Al giorno', 'Persone al giorno'],
          destra: [1, 2, 3],
          evidenzia: [2],
          righe: [
            ['Gennaio–maggio (scuola)', '151', '33,5', '4,78'],
            ['8–17 giugno (ammissioni il 10/06)', '10', '64,8', '7,2'],
            ['18–26 giugno (scritti, orali, risultati)', '9', '141,0', '8,22'],
            ['27 giugno – 5 ottobre (dopo)', '101', '12,2', '1,56'],
          ],
        },
      ],
      metodo: M.maturita,
    },
    {
      occhiello: 'Argomenti ed eventi',
      titolo: 'Le parole degli esami, e del dopo',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Il lessico degli esami', testo: '«presentazione» 23 volte (2 nei cinque mesi prima) · «pcto» 10 (1)' },
            { titolo: 'Il lessico del dopo', testo: '«lavorare» 9 (0 prima) · «stasera» · «cena» · «andiamo»' },
          ],
        },
      ],
      chiusa: 'Dopo gli esami la chat non crolla più di un’estate normale (12,2 contro 19,1 al giorno nel 2025). Il segnale vero è settembre: **1.840 → 729 messaggi, −60%**.',
      metodo: M.maturita,
    },

    /* ── 7 · L'evoluzione ─────────────────────────────────────────────── */
    capitolo(7, 'L’evoluzione', 'Le cinque fasi del gruppo, chi è cambiato di più, chi scrive a ondate.'),
    {
      tema: 'tint',
      occhiello: 'L’evoluzione',
      titolo: 'Le cinque fasi del gruppo',
      sotto: 'Un anno scolastico per fase, più il dopo-maturità',
      blocchi: [
        { tipo: 'numero', valore: '54,8 → 12,2', piccolo: true, testo: 'messaggi al giorno, dalla 2ª al dopo-maturità' },
        {
          tipo: 'tabella',
          colonne: ['Fase', 'Al giorno', 'Persone', 'Media', 'Primi 4'],
          destra: [1, 2, 3, 4],
          righe: [
            ['**2ª** · dic 22–ago 23', '**54,8**', '24', '4,4%', '54%'],
            ['**3ª** · set 23–ago 24', '33,5', '24', '12,2%', '61%'],
            ['**4ª** · set 24–ago 25', '27,7', '21', '8,4%', '64%'],
            ['**5ª** · set 25–giu 26', '46,5', '17', '24,1%', '70%'],
            ['**Dopo** · giu–ott 26', '12,2', '16', '**29,6%**', '**74%**'],
          ],
        },
        { tipo: 'paragrafo', testo: '**Media** = foto, video e altri media sul totale. **Primi 4** = quota dei messaggi scritta dalle quattro persone più attive.' },
      ],
      metodo: M.fasi,
    },
    {
      tema: 'tint',
      occhiello: 'L’evoluzione',
      titolo: 'Il segno di ogni fase',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**2ª**', valore: 'fisica, diritto', testo: 'Adam scrive il 24% dei messaggi' },
            { chiave: '**3ª**', valore: 'piangi, fenomeno', testo: 'l’era di 🤣' },
            { chiave: '**4ª**', valore: 'quaderno, prospetti', testo: 'il ritmo minimo' },
            { chiave: '**5ª**', valore: 'gita, esame', testo: 'Alberto scrive il 30,2% dei messaggi' },
            { chiave: '**Dopo**', valore: 'lavorare, stasera', testo: 'la sera sale al 45%' },
          ],
        },
        { tipo: 'paragrafo', testo: 'A destra, le **parole tipiche** di ogni fase: le più frequenti lì rispetto alle altre fasi.' },
      ],
      chiusa: 'Da una fase all’altra: meno persone (24 → 16), più foto e video (4% → 30%), più concentrazione (54% → 74% ai primi quattro).',
      metodo: M.fasi,
    },
    {
      occhiello: 'L’evoluzione',
      titolo: 'Chi è cambiato di più',
      sotto: 'Stessa persona, 2ª contro 5ª: solo numeri',
      blocchi: [
        { tipo: 'numero', valore: '16 → 1.756', piccolo: true, testo: 'foto e video inviati da **Alberto**: il cambiamento più netto' },
        {
          tipo: 'righe',
          voci: [
            { chiave: 'dei messaggi della chat', valore: '6,8% → 30,2%' },
            { chiave: 'messaggi al giorno', valore: '3,7 → 14,1' },
            { chiave: 'dei suoi messaggi sono media', valore: '13% → 48%' },
          ],
        },
      ],
      chiusa: 'Alberto passa da 1 messaggio su 15 a quasi 1 su 3.',
      metodo: M.cambiati,
    },
    {
      occhiello: 'L’evoluzione',
      titolo: 'E gli altri',
      sotto: 'Confronto tra l’anno della 2ª e l’anno della 5ª, a parità di persona',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Adam**', testo: 'emoji ogni 100 msg 5,5 → 1,1 · sera 34% → 53%' },
            { chiave: '**David**', testo: 'quota 7,8% → 1,6% · da 4,28 a 0,74 messaggi al giorno' },
            { chiave: '**Gianmarco**', testo: 'emoji ogni 100 msg 0,2 → 12,1' },
            { chiave: '**Francesco**', testo: 'emoji 0,5 → 10,0 (🍷 14) · sera 24% → 46%' },
            { chiave: '**Federico**', testo: 'quota 7,4% → 12,1% · emoji 6,0 → 14,1' },
            { chiave: '**Manuel**', testo: 'parole a messaggio 5,5 → 10,3' },
            { chiave: '**Riccardo**', testo: 'parole a messaggio 5,1 → 7,0' },
          ],
        },
      ],
      chiusa: 'Gianmarco fa il salto più grande sugli emoji: da 0,2 a 12,1 ogni 100 messaggi.',
      metodo: M.cambiati,
    },
    {
      tema: 'tint',
      occhiello: 'L’evoluzione',
      titolo: 'Attività a ondate',
      sotto: 'Quanto dei propri messaggi sta in un solo periodo',
      blocchi: [
        { tipo: 'numero', valore: '88%', testo: 'dei messaggi di **Prosper** in un solo mese: 105 su 119, a ottobre 2023' },
        {
          tipo: 'righe',
          voci: [
            { chiave: '**Benetti**', valore: '23%', testo: 'in un solo mese: febbraio 2024, 848 messaggi' },
            { chiave: '**Davide**', valore: '28%', testo: 'a giugno 2026 (61 su 219); 31 mesi su 44 sotto i 5 messaggi' },
            { chiave: '**Tommaso**', valore: '18%', testo: 'a marzo 2026 (117); i suoi 3 mesi migliori sono tutti in 5ª o dopo' },
            { chiave: '**David**', valore: '47%', testo: 'nei suoi 3 mesi migliori: dic 2022, gen e mag 2023' },
          ],
        },
      ],
      metodo: M.ondate,
    },
    {
      tema: 'tint',
      occhiello: 'L’evoluzione',
      titolo: 'I costanti',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Federico', testo: '39 mesi attivi su 47, solo il **20%** dei suoi messaggi nei 3 mesi migliori' },
            { titolo: 'Riccardo', testo: '**18%** nei 3 mesi migliori' },
            { titolo: 'Adam', testo: '**25%** nei 3 mesi migliori' },
          ],
        },
      ],
      chiusa: 'Le ondate cadono sugli episodi: febbraio 2024 per Benetti, giugno 2026 (gli esami) per Davide, la 2ª per David.',
      metodo: M.ondate,
    },

    /* ── 8 · I record ─────────────────────────────────────────────────── */
    capitolo(8, 'I record', 'I messaggi più lunghi e più brevi, la Hall of Fame e i dati più assurdi.'),
    {
      occhiello: 'I record',
      titolo: 'I messaggi più lunghi',
      sotto: 'Singoli messaggi di testo, per numero di parole',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '1 **Alberto** · 20/04/2023', valore: '503', testo: 'testo di legge incollato · 3.688 caratteri' },
            { chiave: '2 **Federico** · 30/01/2024', valore: '482', testo: 'racconto: «Una fresca mattina di primavera…» · 2.884' },
            { chiave: '3 **Alberto** · 13/03/2026', valore: '464', testo: 'canzone «Slide sul mio Apple Watch» · 2.863' },
            { chiave: '4 **Daniel** · 24/05/2026', valore: '396', testo: 'articolo di cronaca incollato (non citato) · 2.678' },
            { chiave: '5 **Federico** · 30/01/2024', valore: '396', testo: 'racconto «La Rinascita di Stefano Bertoni» · 2.479' },
            { chiave: '6 **Alberto** · 12/06/2026', valore: '382', testo: 'comunicato dei vigili del fuoco incollato · 2.424' },
            { chiave: '7 **Federico** · 30/01/2024', valore: '370', testo: 'racconto «I Colori del Cuore» · 2.319' },
            { chiave: '8 **Manuel** · 16/12/2024', valore: '365', testo: 'resoconto scritto da lui: «Ciao ragassuoli» · 2.294' },
          ],
        },
      ],
      metodo: M.lunghi,
    },
    {
      occhiello: 'I record',
      titolo: 'Fuori classifica',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Copia-incolla ripetitivi', testo: 'Adam 21/12/2023, 2.428 parole · Alberto 09/02/2024, 8 messaggi da 1.326 parole, tutti «@manu» ripetuto' },
            { titolo: 'Record per caratteri', testo: 'Alberto 15/01/2024, 4.982 caratteri in 184 parole, testo «glitch» a segni sovrapposti. Escluso questo, l’ordine dei primi tre non cambia.' },
          ],
        },
      ],
      chiusa: 'Tre degli otto messaggi più lunghi sono racconti di Federico, inviati la stessa sera in 22 minuti (22:19–22:41).',
      metodo: M.lunghi,
    },
    {
      tema: 'tint',
      occhiello: 'I record',
      titolo: 'L’arte del messaggio minimo',
      sotto: 'Messaggi di testo da zero o una parola',
      blocchi: [
        { tipo: 'numero', valore: 9614, testo: 'messaggi di una parola o meno: il **21,3%** dei messaggi di testo' },
        {
          tipo: 'chip',
          titolo: 'I più frequenti, da soli',
          voci: [
            { testo: 'si **335**' },
            { testo: 'no **316**' },
            { testo: 'ok **198**' },
            { testo: '😂 **164**' },
            { testo: '😂😂 **139**' },
            { testo: 'hahaha **137**' },
            { testo: 'esatto **128**' },
            { testo: 'godo **126**' },
            { testo: 'grazie **77**' },
            { testo: 'raga **76**' },
          ],
        },
      ],
      metodo: M.minimi,
    },
    {
      tema: 'tint',
      occhiello: 'I record',
      titolo: 'Specialisti del minimo',
      blocchi: [
        {
          tipo: 'righe',
          voci: [
            { chiave: '«.» da solo', valore: 381, testo: 'Daniel 113 (30%)' },
            { chiave: '«?» da solo', valore: 213, testo: 'Federico 51 (24%)' },
            { chiave: '«raga» da solo', valore: 76, testo: 'Damiano **37** (49%)' },
            { chiave: '«godo» da solo', valore: 126, testo: 'Daniel **41** (33%)' },
          ],
        },
        {
          tipo: 'schede',
          voci: [{ titolo: 'Minimalisti · al massimo 3 parole', testo: '**David 67,8%** · Damiano 60,7% · Tommaso 55,4% — all’opposto Luca 32,3%' }],
        },
      ],
      chiusa: 'Un messaggio di testo su cinque è fatto di una parola o meno. Il messaggio minimo più usato non è una parola: è un punto.',
      metodo: M.minimi,
    },
    {
      occhiello: 'I record',
      titolo: 'Hall of Fame',
      sotto: 'I record assoluti della chat, con la metrica esatta',
      blocchi: [
        {
          tipo: 'schede',
          colonne: 2,
          voci: [
            { titolo: 'Giorno', valore: 821, testo: 'messaggi il 14/02/2024, 14 persone' },
            { titolo: 'Ora', valore: 459, testo: 'in 60 minuti, 14/02/2024 13:26–14:26' },
            { titolo: 'Dieci minuti', valore: 299, testo: '15/11/2025, foto di Alberto · con più persone: 111' },
            { titolo: 'Mese', valore: 4169, testo: 'messaggi a maggio 2023' },
            { titolo: 'Una persona in un giorno', valore: 354, testo: 'Alberto, 10/11/2025 · solo testo: Benetti 243' },
            { titolo: 'Raffica', valore: '300 di fila', testo: 'Alberto, 15/11/2025 · solo testo: Federico 40' },
          ],
        },
      ],
      metodo: M.halloffame,
    },
    {
      occhiello: 'I record',
      titolo: 'Hall of Fame, seconda parte',
      blocchi: [
        {
          tipo: 'schede',
          colonne: 2,
          voci: [
            { titolo: 'Conversazione', valore: 715, testo: '21/05/2023, 7 ore e 12 minuti, 14 persone' },
            { titolo: 'Notte', valore: 219, testo: 'tra mezzanotte e le 6, 23/06/2026' },
            { titolo: 'Messaggio più lungo', valore: '503 parole', testo: 'Alberto, 20/04/2023 (testo incollato)' },
            { titolo: 'Giorni di fila', valore: 65, testo: 'con almeno un messaggio, 06/01 → 11/03/2023' },
            { titolo: 'Persone in un giorno', valore: 17, testo: '11/02/2023 e 06/10/2023' },
            { titolo: 'Più rimosso', valore: '123 volte', testo: 'Adam, rimosso dal gruppo' },
          ],
        },
      ],
      chiusa: 'I più usati di sempre: 😂 **1.832** volte · «domani» **1.204** volte · «fra» in **1.554** messaggi.',
      metodo: M.halloffame,
    },
    {
      tema: 'ink',
      occhiello: 'I record',
      titolo: 'Top 10 dei dati assurdi',
      sotto: 'Ordinati per sorpresa, non per grandezza',
      blocchi: [
        {
          tipo: 'elenco',
          voci: [
            { n: '01', testo: 'Adam è stato rimosso dal gruppo **123 volte** (52 da Daniel, 44 da Alberto). La prima: il giorno dopo la nascita del gruppo.' },
            { n: '02', testo: 'Il giorno più pieno di sempre è **San Valentino 2024**: 821 messaggi, per un avviso di rischio sospensione.' },
            { n: '03', testo: 'Alberto ha mandato **1.652 foto**: più di tutti gli altri 24 messi insieme (1.464).' },
            { n: '04', testo: '**7.492 messaggi** scritti tra le 8 e le 13, dal lunedì al sabato.' },
            { n: '05', testo: '**381 messaggi** contengono solo un punto. 113 sono di Daniel.' },
          ],
        },
      ],
      metodo: M.top10,
    },
    {
      tema: 'ink',
      occhiello: 'I record',
      titolo: 'Top 10, dal sesto al decimo',
      blocchi: [
        {
          tipo: 'elenco',
          voci: [
            { n: '06', testo: 'Novembre 2023: **zero messaggi**. Non silenzio: messaggi effimeri, attivati da Alberto e spenti da Federico.' },
            { n: '07', testo: 'La notte prima degli orali: **219 messaggi** tra mezzanotte e le 6, 106 di Alberto.' },
            { n: '08', testo: 'Il primo e l’ultimo **«fra»** della chat sono di Adam, a 3 anni e 10 mesi di distanza.' },
            { n: '09', testo: 'Prosper: 119 messaggi, **105 in un solo mese**.' },
            { n: '10', testo: 'L’**81%** dei messaggi di testo non ha un argomento: risate, «si», «no», reazioni.' },
          ],
        },
      ],
      chiusa: 'La persona rimossa più volte dal gruppo è anche quella che ci ha scritto di più: 11.126 messaggi.',
      metodo: M.top10,
    },

    /* ── 9 · Il finale ────────────────────────────────────────────────── */
    capitolo(9, 'Il finale', 'Che gruppo è stato, secondo i numeri.'),
    {
      tema: 'tint',
      occhiello: 'Il finale',
      titolo: 'La fotografia finale',
      sotto: 'Che gruppo è stato, secondo i numeri',
      blocchi: [
        { tipo: 'numero', valore: '7 · 37 · 821', piccolo: true, testo: 'messaggi nel giorno mediano, nel giorno medio e nel giorno record: una chat a esplosioni' },
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Cosa è rimasto costante', testo: '😂 primo emoji in ogni anno · «fra» in 41 mesi su 47 · Adam primo per messaggi in 4 anni su 5' },
            { titolo: 'Cosa è cambiato', testo: 'persone attive 24 → 16 · primi quattro 54% → 74% · foto e video 4% → 24% (2ª → 5ª)' },
            { titolo: 'Impatto', testo: 'Adam 21,5% dei messaggi e 28,6% delle parole · Alberto 17,8% delle aperture · Federico primo a rispondere (280)' },
          ],
        },
      ],
      metodo: M.sintesi,
    },
    {
      tema: 'tint',
      occhiello: 'Il finale',
      titolo: 'Abitudini, ritmo, momenti',
      blocchi: [
        {
          tipo: 'schede',
          voci: [
            { titolo: 'Abitudini', testo: 'il venerdì e le 20:00 · «domani» la parola · 1 messaggio di testo su 5 da una parola o meno' },
            { titolo: 'Ritmo', testo: 'tra due persone diverse passano in mediana **14 secondi** · Adam ↔ Daniel 2.160 scambi' },
            { titolo: 'Periodi decisivi', testo: 'dic 2022 la nascita · mag 2023 il picco · feb 2024 il giorno record · giu 2026 gli esami' },
          ],
        },
      ],
      chiusa: 'Il modo di scrivere è rimasto lo stesso (😂, «fra», venerdì sera). È cambiato chi scrive: meno persone, più concentrate, più immagini.',
      metodo: M.sintesi,
    },
    {
      tema: 'ink',
      occhiello: 'Il finale',
      blocchi: [
        { tipo: 'fumetto', etichetta: 'Il primo messaggio', autore: 'Francesco', testo: 'Ma pk?', data: '15/12/2022 · 22:32' },
        { tipo: 'fumetto', etichetta: 'L’ultimo messaggio', autore: 'Luca', testo: 'Miao', data: '05/10/2026 · 19:45', mio: true },
        { tipo: 'display', righe: ['In mezzo:', '51.748 messaggi.'], accento: 1 },
      ],
      metodo: M.finale,
    },
    {
      tema: 'ink',
      occhiello: 'Il finale',
      titolo: 'Quasi quattro anni, in otto numeri',
      blocchi: [
        {
          tipo: 'cifre',
          celle: [
            { valore: 245651, etichetta: 'parole' },
            { valore: 1391, etichetta: 'giorni, 915 con almeno un messaggio' },
            { valore: 25, etichetta: 'persone che hanno scritto' },
            { valore: 1950, etichetta: 'conversazioni' },
            { valore: 821, etichetta: 'messaggi il 14/02/2024, il giorno record' },
            { valore: '«domani»', etichetta: 'la parola più usata, 1.204 volte' },
            { valore: '😂', etichetta: 'l’emoji, 1.832 volte' },
            { valore: '1 ogni 39′', etichetta: 'un messaggio ogni 39 minuti, per quasi 4 anni' },
          ],
        },
      ],
      chiusa: '15/12/2022 → 05/10/2026 · circa 52.000 messaggi · 4 anni di storia del gruppo.',
      metodo: M.finale,
    },
  ],
}
