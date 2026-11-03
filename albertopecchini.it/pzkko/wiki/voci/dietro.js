// pzkkopedia, le voci di «dietro» (2.11.2026): il repository AP, i workflow, Vercel, il server dei dati in casa, la
// banca, le API, gli altri siti di Alberto e i loro strumenti, i servizi usati. Il formato è in tools/pzkko/wiki/README.md.
// Niente segreti: nessun PIN, chiave, ID di progetto o contenuto di config.json finisce qui.

export const VOCI = {
  'Il repository AP': {
    data: '2026-11-02',
    fonti: ['README.md', 'package.json', '.gitignore', '.vscode/launch.json', '.vscode/tasks.json'],
    testo: `{{Infobox
| titolo = Il repository AP
| immagine = https://www.albertopecchini.it/media/web/ap-desktop.webp
| didascalia = la home di albertopecchini.it, il sito che il repository fa nascere
| dove = github.com/albertoxpecchini/AP
| dal = 24 maggio 2026
| commit = 702 (al 2 novembre 2026)
| rami = main, albertopecchini.it, bettercallpekko.it, pzkko.it
| cartella = C:\\Users\\Alberto\\Documents\\AP
| siti = albertopecchini.it, bettercallpekko.it, pzkko.it
}}
'''Il repository AP''' è il repository Git di [[Alberto Pecchini]] su GitHub (<code>albertoxpecchini/AP</code>, pubblico) da cui escono i suoi tre siti: [[albertopecchini.it]], [[Better Call Pekko]] e [[Pzkko.it]]. È il posto in cui vive anche questa wiki ([[Pzkkopedia]], in <code>albertopecchini.it/pzkko/wiki/</code>).

== Com'è fatto ==
Alla radice ci sono poche cose, tutte spiegate nel suo <code>README.md</code>:
* <code>albertopecchini.it/</code>: il sito vero e proprio, con i sorgenti, i contenuti, gli strumenti e, dentro, la cartella <code>pzkko/</code> con tutto pzkko.it (file statici, senza build);
* <code>package.json</code>: solo scorciatoie (<code>npm run dev</code>, <code>dev:pzkko</code>, <code>dev:bcp</code>, <code>build</code>, <code>preview</code>, <code>email</code>…) che inoltrano i comandi alla cartella del sito, «senza dover ricordare il <code>cd</code>»;
* <code>.github/workflows/</code>: i due workflow di GitHub Actions, [[Le catture dei siti (workflow)|le catture dei siti]] e [[Il controllo della build (workflow)|il controllo della build]];
* <code>.vscode/</code>: con '''F5''' in VS Code parte il server di sviluppo e si apre Edge sul sito (<code>launch.json</code> e il task <code>dev</code> in <code>tasks.json</code>); <code>Ctrl+Alt+O</code> lancia il task <code>online</code>, i tre dev server con gli indirizzi pubblici fissi dei dev tunnel;
* <code>CLAUDE.md</code>: le regole del progetto per [[Claude Code]] (vedi [[CLAUDE.md]]), e <code>.claude/skills/</code> con le tre skill ([[Le skill di Claude Code]]);
* <code>PRODUCT.md</code>, <code>DESIGN.md</code> e <code>.impeccable/</code>: il brief di prodotto e il sistema visivo di pzkko.it ([[PRODUCT.md]], [[DESIGN.md]]).

Il <code>.gitignore</code> della radice tiene fuori le catture di verifica di Impeccable (<code>.impeccable/review/</code>) e la cache di Playwright. Quello del sito tiene fuori <code>.env.local</code> (il token di [[Replicate]] e le variabili delle funzioni), <code>dist/</code>, <code>node_modules/</code> e tutte le cartelle <code>lavoro/</code> degli strumenti (i fogli pagati a gpt-image-2, le foto di prova).

== Che cosa produce ==
Dallo stesso repository nascono tre progetti [[Vercel]]: il portfolio (Root Directory <code>albertopecchini.it</code>, framework Vite, Node 24), la parodia Better Call Pekko (stessa radice, variabile <code>SITE=bcp</code>) e pzkko.it (che dovrebbe avere la radice in <code>albertopecchini.it/pzkko</code>; finché resta la stessa del sito ci pensa <code>tools/pzkko/build.mjs</code>, vedi [[Il progetto Vercel pzkko]]). Ogni push su <code>main</code> va in produzione per tutti e tre.

== I numeri ==
{| class="wikitable"
! cosa !! quanto
|-
| commit || 702, dal 24 maggio 2026 al 2 novembre 2026 ([[Elenco dei commit]])
|-
| rami || 4 ([[I rami del repository]])
|-
| pull request || 13, tutte del periodo dei rami <code>claude/…</code> (settembre–ottobre 2026)
|-
| README || 743 righe quello del sito, 3.102 quello di pzkko
|-
| giorno più pieno || 23 ottobre 2026, 43 commit (il wallet, la chat, la versione 3.0)
|}

== Prima di un push ==
Su <code>main</code> scrive anche il bot delle catture, quindi prima di spingere conviene <code>git pull --rebase</code>. E dal 2 novembre 2026 si aggiorna la wiki: vedi [[Pzkkopedia:Come si aggiorna]].

== La storia ==
Fino al 17 settembre 2026 il repository ospitava un altro sito, in React ([[Il sito precedente (React)]]); è stato azzerato e ricostruito da capo come sito statico, ma la storia dei commit è rimasta ([[La storia del repository]]).

{{Vedi anche|I rami del repository|I messaggi di commit|La storia del repository|Il GitHub di Alberto|Vercel|CLAUDE.md}}
[[Categoria:Il repository]]`,
  },

  'I rami del repository': {
    data: '2026-10-26',
    fonti: ['README.md', 'albertopecchini.it/README.md'],
    testo: `'''I rami del repository''' sono quattro: <code>main</code>, <code>albertopecchini.it</code>, <code>bettercallpekko.it</code> e <code>pzkko.it</code>. Uno per sito, più quello da cui parte la produzione.

== Come si usano ==
Su [[Vercel]] la produzione di tutti e tre i progetti parte '''solo da <code>main</code>''': un push su uno dei rami dei siti fa un'anteprima (gli indirizzi <code>*.vercel.app</code> sono protetti dal login Vercel), sul sito vero non arriva niente. Il lavoro su pzkko va nel ramo <code>pzkko.it</code>; per vederlo online serve anche <code>main</code>, e la scelta di spingere su <code>main</code> è di [[Alberto Pecchini]].

La regola è nata il 26 ottobre 2026, dopo due incidenti nello stesso giorno:
{{Citazione|dovresti fare pulizia e non fare confusione, ci sono i rami per ogni sito, tutti in repo AP|Alberto, 26.10.2026}}
{{Citazione|non sento la musica nel sito, hai pushato tutto?|Alberto, 26.10.2026, la sera, dopo un push solo su pzkko.it}}
Alla fine ha scelto «tutto su main». La memoria che lo ricorda a Claude è [[Rami per sito (memoria)]].

== Chi scrive su main ==
Oltre ad Alberto, il workflow [[Le catture dei siti (workflow)|delle catture]]: ogni ora, se un sito è cambiato, fa un commit «Catture aggiornate: …» con le immagini nuove. Per questo nella cartella AP, dove lavorano più sessioni di [[Claude Code]] insieme, ci sono spesso modifiche non committate di altri: si committano solo i propri file.

== I rami vecchi ==
Fra settembre e ottobre 2026 c'erano anche i rami <code>claude/…</code> delle sessioni in cloud (per esempio <code>claude/intelligent-turing-y9xjgs</code>, <code>claude/great-goodall-wzlzbp</code>): le pull request da #8 a #13 ([[Elenco dei commit]]) vengono da lì, e oggi non ci sono più.

{{Vedi anche|Il repository AP|Rami per sito (memoria)|Vercel|I messaggi di commit}}
[[Categoria:Il repository]]`,
  },

  'I messaggi di commit': {
    data: '2026-09-22',
    fonti: ['albertopecchini.it/README.md'],
    testo: `'''I messaggi di commit''' del [[Il repository AP|repository AP]] seguono una convenzione scritta nel README del sito (sezione «Convenzioni»): '''in italiano''', con un prefisso e l'ambito tra parentesi.

== La forma ==
* prefisso: <code>feat</code>, <code>fix</code>, <code>docs</code>, <code>chore</code>, <code>perf</code>, <code>refactor</code>, <code>style</code>;
* ambito: il sito o il pezzo (<code>pzkko</code>, <code>sito</code>, <code>bcp</code>, <code>email</code>, <code>lezioni</code>, <code>catture</code>, <code>home</code>, <code>portfolio</code>…);
* il messaggio dice la cosa come la direbbe Alberto, con le virgolette basse quando cita: <code>feat(pzkko): versione 4.0.0 «chiocciola zero»: il cercapersone zero per tutti, il nero eliminato per sempre</code>.

Esempi veri, dal più recente: <code>feat(pzkko): la lavatrice e il decifratore nel cercapersone zero, l'apertura col 3D senza bloccare il sito</code> (2 novembre 2026), <code>fix(pzkko): il segreto del server si legge anche incollato male</code> (29 ottobre), <code>perf(pzkko): il telefono che scorre a 2× e torna a 3× da fermo</code> (21 ottobre).

== Le eccezioni ==
Il bot delle catture scrive «Catture aggiornate: Rivalta sul Mincio, Alberto Pecchini, pzkko» con un secondo paragrafo («Rifatte da .github/workflows/catture.yml: il sito online era cambiato»). E nella storia restano messaggi di una riga sola di Alberto, scritti di fretta: «ok» (27.09.2026), «ops» (26.09), «fine.» e «hello» (17.09, l'azzeramento del sito React), «ehi» (1.06), «a», «i», «o» (9.08).

== Il fine riga ==
Il codice usa LF; Git su Windows avvisa della conversione CRLF e l'avviso è innocuo, come dice il README.

{{Vedi anche|Il repository AP|La storia del repository|Elenco dei commit}}
[[Categoria:Il repository]]`,
  },

  'La storia del repository': {
    data: '2026-11-02',
    fonti: ['README.md', 'albertopecchini.it/README.md', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''La storia del repository''' AP va dal 24 maggio 2026 («Initial commit», poi «Add files from Figma Make») al 2 novembre 2026, 702 commit in cinque mesi e mezzo. Si divide in due vite: il sito React fino al 17 settembre, e da lì il sito statico, i siti dei clienti, [[Better Call Pekko]] e [[Pzkko.it]].

[[File:https://www.albertopecchini.it/media/web/ap-desktop.webp|thumb|il portfolio statico di oggi, nato il 18 settembre 2026]]

== Maggio–settembre 2026: il sito React ==
{{Principale|Il sito precedente (React)}}
Il primo sito nasce da Figma Make e dal kit Bootstrap Italia (25 maggio: «Redesign UI con kit Bootstrap Italia + config deploy Vercel»), con il CV in PDF, il logo «.ap», la palette neroverde del Sassuolo (26 maggio). A fine maggio arrivano i giochi: '''Parole''' (il Wordle italiano, 29 maggio), '''Angoli''' (30 maggio), il '''Trivia''' con le curiosità da Treccani e Wikipedia; a giugno l'aula 5BT isometrica «in stile Tuber Simulator», il PCTO in Caem Group, lo striscione della maturità con il countdown dei voti (74/100 il 26 giugno), la festa con il sondaggio presenze, il tema chiaro/scuro, le traduzioni in quattro lingue (2.007 stringhe il 29 giugno). A luglio il sito «veste in stile Ubuntu/Yaru» (7 luglio), i PDF del curriculum in IT/EN/FR/DE, lo strumento Instagram «Compare Two Lists», le scritture blindate su Supabase, il widget GitHub nel footer. Ad agosto il restyle Supabase e la ControlBar (27 luglio), il piano vacanza MiMa (1–18 agosto), i tre modelli di auto in 3D (8 agosto), il «janitor» che pulisce il repo, le pagine <code>/shooting</code> e <code>/mima</code>, il muro dei commit, la home a sei card, il video di Rivalta da 82,6 MB a 5,3. A settembre la palette «Euroshit» (11 settembre, da cui il nome degli [[Gli EUR€|EUR€]] di pzkko) e il cielo Frutiger Aero, le cinque scene di vetro del mosaico.

== 17–18 settembre 2026: da capo ==
Il 17 settembre due commit, «fine.» e «hello», azzerano tutto. Il 18 settembre <code>feat(sito): il portfolio statico — dati, template, tavole, plugin Vite e ritratto</code>: il sito di oggi, senza framework, con i contenuti in <code>src/data/</code> e i template in <code>src/templates/</code>. Il README dice: «Fino a settembre 2026 il repository ospitava il sito precedente (React); è stato azzerato e ricostruito da capo come sito statico. La storia dei commit è conservata».

== Settembre–ottobre: il sito serio ==
Il generatore di email (22 settembre), la funzione serverless dei contatti, le schede di [[rivaltasulmincio.it]], [[Ing. Dario Donelli]] e [[cascinafontana.xyz]] dai loro repo (23 settembre), la pagina <code>/stile/</code> coi mockup, le [[Le tavole|tavole vere]] e il visualizzatore (24 settembre), le 61 fotografie del museo, il [[Il compositore email|compositore email]] (25 settembre), l'iPhone 18 Pro nel case study, «illustrazioni al posto dei documenti, nuova home, figurine e [[Il lettore DWG|lettore DWG]]» (26 settembre), le [[Le catture|catture]] che si rifanno da sole (26 settembre), [[Better Call Pekko]] (27 settembre) col suo progetto Vercel (28), l'[[L'aragosta e l'inchiostro|aragosta]] e i [[I burattini|burattini]] (1 ottobre), l'atlante SDF per la GPU (3 ottobre), il [[Wrapped 5BT]] (5–6 ottobre).

== Ottobre: pzkko ==
Il 7 ottobre nasce pzkko.it (il [[Il portafoglio MagSafe|portafoglio MagSafe]], bocciato lo stesso giorno, poi la [[La scrivania di pzkko|scrivania]]); l'8 la roulette, il 9 [[Il muro|il muro]]; il 17 i siti in cima e la roulette 3D in finestra, il 18 la [[La scena 3D|scena 3D]] e il [[Il blackjack|blackjack]]; il 20 le lettere della «coin» vera, il 21 il [[Il pomodoro|pomodoro]], la [[La regia|regia]], il [[Il suono della strada|suono]] e [[Lezioni (strumento)|Lezioni]]; il 22 la [[La petizione|petizione]], il [[Il wallet|wallet]], la [[La chat col bot|chat col bot]]; il 23 (43 commit) la versione 3.0 «lumaca catodica», la [[La lumachina|lumachina]], [[Virtual]]; il 26 quiz, side quest, traguardi, la [[La barra in alto|barra]] e la wiki vuota, la musica; il 27 il [[Il canale sempre aperto|canale sempre aperto]]; il 29 il [[Il server dei dati in casa|server in casa]] (Blob tolto per sempre), i [[I lotti numerati|lotti numerati]], il pzkstore, il testo predittivo; il 31 la [[La banca sul server|banca sul server]]; il 1° novembre la versione 4.0.0 «chiocciola zero»; il 2 novembre la lavatrice e il decifratore nel cercapersone zero.

{{Vedi anche|Elenco dei commit|Le versioni di pzkko|Il repository AP|Il sito precedente (React)}}
[[Categoria:Il repository]]`,
  },

  'Il sito precedente (React)': {
    data: '2026-09-17',
    fonti: ['README.md'],
    testo: `'''Il sito precedente''' è l'albertopecchini.it che ha vissuto nel [[Il repository AP|repository AP]] dal 24 maggio al 17 settembre 2026: un'app React con Vite, Bootstrap Italia e poi Supabase, azzerata e sostituita dal sito statico di oggi.

== Com'era ==
Era nato da Figma Make («Add files from Figma Make», 24 maggio) e riprogettato il giorno dopo con il kit Bootstrap Italia, il logo «.ap» e il verde-nero del Sassuolo. Nel tempo ha avuto: il CV in PDF con visore in pagina e versioni in quattro lingue (WeasyPrint, poi «stile Ubuntu/Yaru»), un multilingua IT/EN/FR/DE con oltre 2.000 stringhe, il tema chiaro/scuro con il sensore dell'ora, i giochi '''Parole''' (il Wordle italiano con il dizionario completo e la modalità a 6 lettere), '''Angoli''', '''Movimento''', '''Mappa''' e '''Trivia''' (con le curiosità generate dall'IA e una tabella di giocatori su Supabase), l'aula 5BT in isometria, la pagina del PCTO in Caem Group con le foto del legno, la festa del 27–28 giugno con il sondaggio presenze e il meteo della serata, la pagina <code>/sostieni</code> con le onde di Vanta, l'archivio «Esplora File» stile Windows, lo strumento Instagram «chi non ti segue», il piano vacanza MiMa (13–17 agosto 2026) con i prezzi veri del carburante, tre auto in 3D «girabili in ogni verso», il muro dei commit, lo «janitor» che puliva il repository e dimostrava di non averlo rotto, la palette «Euroshit» e il cielo Frutiger Aero di settembre.

== Perché è finito ==
Il 17 settembre, con «fine.» e «hello», tutto è stato tolto; il 18 è arrivato il portfolio statico «senza framework», con i dati in <code>src/data/</code>, i template che restituiscono HTML e nessuna dipendenza a runtime. Il README della radice lo dice in due righe («Storia»). Di quel sito nel repository non resta codice, solo la storia dei commit: [[Elenco dei commit]].

== Cosa è sopravvissuto ==
Il nome «Euroshit» della palette è diventato quello degli [[Gli EUR€|EUR€]] del wallet di pzkko (l'euro finto, dall'album di Yung Pips); i giochi sono tornati, in un'altra forma, come [[I giochi|i giochi]] del muro; il [[Wrapped 5BT]] è la chat della stessa classe 5BT dell'aula isometrica.

{{Vedi anche|La storia del repository|Il repository AP|albertopecchini.it}}
[[Categoria:Il repository]]`,
  },

  'Il GitHub di Alberto': {
    data: '2026-11-02',
    fonti: ['README.md'],
    testo: `'''Il GitHub di Alberto''' è l'account <code>albertoxpecchini</code> (lo stesso nome di Instagram). Ha quattro repository pubblici:

{| class="wikitable"
! repository !! cos'è !! ultimo push
|-
| <code>AP</code> || [[Il repository AP|il repository AP]]: [[albertopecchini.it]], [[Better Call Pekko]], [[Pzkko.it]] e questa wiki || 2 novembre 2026
|-
| <code>rivaltasulmincio</code> || [[rivaltasulmincio.it]], «Sito ufficiale della Pro Loco di Rivalta sul Mincio · Promozione turistica, notizie e community del borgo nel Parco del Mincio» || 21 ottobre 2026
|-
| <code>dariodonelli-</code> || il sito dell'[[Ing. Dario Donelli]] (sul dominio Vercel finché dariodonelli.it non è attivo) || 8 ottobre 2026
|-
| <code>cascinafontana</code> || [[cascinafontana.xyz]], il sito dell'azienda agricola di famiglia || 27 settembre 2026
|}

Le schede dei tre siti dei clienti nel portfolio sono state ricavate dai loro repository (23–24 settembre 2026: «la scheda di Rivalta sul Mincio dai dati del repo», «la guida per ricavare le schede dai repo dei siti»). Il profilo GitHub è anche uno dei cinque social sul [[Il muro|muro]] di pzkko (il volantino «github», coi tagliandi) e nel wallet è un [[I fattori del mondo|fattore del mondo]]: un commit di Alberto nelle ultime 24 ore fa salire il cambio del $pzk del 3 % al giorno, nessun commit lo fa scendere del 2 %.

{{Vedi anche|Il repository AP|I fattori del mondo|Alberto Pecchini}}
[[Categoria:Il repository]]`,
  },

  'Le catture dei siti (workflow)': {
    data: '2026-10-22',
    fonti: ['.github/workflows/catture.yml', 'albertopecchini.it/tools/catture/catture.mjs', 'albertopecchini.it/tools/catture/siti.js'],
    testo: `{{Infobox
| titolo = Catture dei siti
| immagine = https://www.albertopecchini.it/media/web/pzk-desktop.webp
| didascalia = la cattura di pzkko.it di giorno, rifatta dal workflow
| dove = .github/workflows/catture.yml
| dal = 26 settembre 2026
| quando = ogni ora al minuto 17 (cron 17 * * * *), a ogni push che tocca lo strumento, a mano
| timeout = 40 minuti
| scrive = public/media/web/, src/data/catture.js
}}
'''Le catture dei siti''' sono il workflow di GitHub Actions che rifotografa i siti del portfolio quando cambiano e pubblica le immagini nuove con un commit su <code>main</code>. Lo strumento che usa è [[Le catture|tools/catture]].

== Il giro ==
# '''Ultimo stato''': l'impronta dell'HTML di ogni sito sta nella cache delle Actions (<code>stato.json</code>, chiave <code>catture-stato-…</code>), non nel repository.
# '''Quali siti sono cambiati''': <code>node tools/catture/catture.mjs --controlla</code> scarica le pagine da fotografare e confronta le impronte (i siti sono fatti con Vite: CSS e JS hanno l'impronta nel nome, quindi ogni deploy che cambia qualcosa cambia l'HTML).
# '''Catture''': solo se c'è qualcosa, <code>npm ci</code> dentro <code>tools/catture</code> (puppeteer-core e sharp) e <code>catture.mjs --forza</code> coi siti cambiati, con Chrome in <code>/usr/bin/google-chrome</code>.
# '''Pubblica''': <code>git add -A public/media/web src/data/catture.js</code>; se qualcosa è diverso al pixel, il commit (autore = chi ha avviato il workflow: col piano Hobby Vercel pubblica solo i commit del titolare), poi <code>git pull --rebase</code> e push, con tre tentativi a 10 secondi.
# '''Salva lo stato''' solo se le immagini sono state pubblicate; se no al giro dopo si rifà.

Il timeout è di 40 minuti perché «le catture di pzkko.it, con la scena 3D disegnata in software, sono lente». Il fuso è <code>Europe/Rome</code>. Il gruppo di concorrenza <code>catture-&lt;ref&gt;</code> non cancella un giro in corso.

== A mano ==
Da GitHub → Actions → «Catture dei siti» → Run workflow, con due campi: <code>siti</code> (<code>rivalta</code>, <code>cascina</code>, <code>ap</code>, <code>dd</code>, <code>pzk</code>, separati da spazi; vuoto = quelli cambiati) e <code>forza</code> (rifai anche se non sono cambiati).

== Il costo ==
Un giro senza cambiamenti dura pochi secondi ma GitHub lo conta come un minuto: circa 720 minuti al mese dei 2.000 gratuiti per i repository privati (AP è pubblico, quindi non pesa); per spenderne meno basta diradare il cron, per esempio <code>17 */2 * * *</code>.

== Perché conta per la wiki ==
Le immagini del sito usate qui (per esempio <code>pzk-desktop.webp</code>) sono quelle di <code>public/media/web/</code> di albertopecchini.it: si rifanno da sole quando il sito cambia, quindi restano aggiornate senza toccare la wiki. I commit «Catture aggiornate: …» del bot non fanno partire [[Il controllo della build (workflow)|il controllo della build]] (le spinte col <code>GITHUB_TOKEN</code> non avviano altri workflow).

{{Vedi anche|Le catture|Il controllo della build (workflow)|Il repository AP|Pzkko.it}}
[[Categoria:Il repository]]`,
  },

  'Il controllo della build (workflow)': {
    data: '2026-10-01',
    fonti: ['.github/workflows/build.yml', 'albertopecchini.it/tools/controllo/controllo.mjs'],
    testo: `{{Infobox
| titolo = Build
| dove = .github/workflows/build.yml
| dal = 1 ottobre 2026
| quando = a ogni push e pull request che tocca albertopecchini.it/
| timeout = 15 minuti
| fa = due build (albertopecchini.it e SITE=bcp) e il controllo delle pagine
}}
'''Il controllo della build''' è il secondo workflow di GitHub Actions del [[Il repository AP|repository AP]]: a ogni push costruisce i due siti che escono dal progetto Vite, [[albertopecchini.it]] e [[Better Call Pekko]] (<code>SITE=bcp</code>, in <code>dist-bcp</code>), e passa le pagine generate a [[Il controllo delle pagine|tools/controllo]]. Se qualcosa non va «il commit prende la ❌ e GitHub manda un'email». Non blocca niente: [[Vercel]] intanto pubblica per conto suo.

== I passi ==
# <code>actions/checkout@v5</code> e <code>setup-node@v5</code> con Node 24 e la cache di npm (<code>albertopecchini.it/package-lock.json</code>);
# <code>npm ci --no-audit --no-fund</code>;
# la cache delle immagini ridotte (<code>node_modules/.cache/ap-varianti</code>, chiave dall'impronta di <code>public/media/**</code>): le versioni a 120, 240, 360, 560, 800 e 1200 px di <code>plugins/responsive-images.js</code> si rifanno solo per gli originali cambiati;
# <code>npm run build</code> e <code>node tools/controllo/controllo.mjs dist</code>;
# <code>npx vite build --outDir dist-bcp</code> con <code>SITE=bcp</code> e il controllo su <code>dist-bcp</code>.

Il gruppo di concorrenza <code>build-&lt;ref&gt;</code> cancella il giro in corso quando ne arriva un altro. I permessi sono di sola lettura.

== Chi non lo avvia ==
I commit del bot delle [[Le catture dei siti (workflow)|catture]]: le spinte fatte col <code>GITHUB_TOKEN</code> non fanno partire altri workflow. E pzkko.it non ha build, quindi non è controllato qui: dal 2 novembre 2026 il controllo della wiki (<code>tools/pzkko/wiki/controlla.mjs</code>) si aggiunge a questo workflow, vedi [[Pzkkopedia:Come si aggiorna]].

{{Vedi anche|Il controllo delle pagine|Le catture dei siti (workflow)|Il repository AP}}
[[Categoria:Il repository]]`,
  },

  'Vercel': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/vercel.json', 'albertopecchini.it/pzkko/vercel.json', 'albertopecchini.it/README.md'],
    testo: `{{Infobox
| titolo = Vercel
| progetti = albertopecchini.it, bcp, pzkko
| repository = albertoxpecchini/AP
| produzione = ogni push su main
| piano = Hobby
| Node = 24
}}
'''Vercel''' è l'hosting dei tre siti di [[Alberto Pecchini]]. Tre progetti, tutti collegati allo stesso [[Il repository AP|repository]]: ogni push su <code>main</code> produce un deploy di produzione, gli altri rami un'anteprima protetta dal login Vercel.

== I tre progetti ==
{| class="wikitable"
! progetto !! Root Directory !! come !! domini
|-
| <code>albertopecchini.it</code> || <code>albertopecchini.it</code> || framework Vite, Node 24; <code>buildCommand</code> = <code>node tools/pzkko/build.mjs</code> || www.albertopecchini.it (l'apice rimanda a www con un 308)
|-
| <code>bcp</code> || <code>albertopecchini.it</code> || la stessa build con la variabile <code>SITE=bcp</code>: produce solo le pagine di [[Better Call Pekko]] alla radice || bettercallpekko.it (www rimanda all'apice)
|-
| <code>pzkko</code> || dovrebbe essere <code>albertopecchini.it/pzkko</code> con preset Other || finché resta <code>albertopecchini.it</code>, <code>build.mjs</code> copia la cartella così com'è in <code>dist/</code> ([[Il progetto Vercel pzkko]]) || www.pzkko.it (l'apice → 308 verso www)
|}

== vercel.json ==
Quello del sito imposta URL puliti con barra finale (<code>cleanUrls</code>, <code>trailingSlash</code>), i rinvii (<code>/assistenza/</code> → bettercallpekko.it, <code>/contatti/assistenza/</code> → <code>/contact/</code>, i vecchi slug del portfolio, gli esercizi di unimore), le intestazioni di sicurezza (<code>X-Content-Type-Options</code>, <code>X-Frame-Options: SAMEORIGIN</code> dal 27 ottobre per la [[La cornice|cornice della musica]] di pzkko, prima era <code>DENY</code>; <code>Referrer-Policy</code>, <code>Permissions-Policy</code>), la cache di un anno sugli asset con hash e di trenta giorni su <code>media/</code> e <code>art/</code>, <code>noindex</code> su <code>/email/</code>, e il <code>Content-Type</code> del file di verifica di Discord in <code>/.well-known/discord</code> (29 ottobre 2026). Quello di pzkko ha solo URL puliti e le tre intestazioni.

== Le funzioni ==
Le cartelle <code>api/</code> sono funzioni serverless: il modulo contatti (<code>api/contatti.js</code>: Resend e CallMeBot), l'IA del compositore email (<code>api/email-ai.js</code>, su Vercel con Granite via OpenRouter), il database di Better Call Pekko (<code>api/bcp.js</code>) e [[Le API di pzkko|quelle di pzkko]], che <code>albertopecchini.it/api/meteo.js</code>, <code>wallet.js</code>, <code>borsa.js</code>, <code>firme.js</code> riesportano finché la radice resta quella del sito. Le variabili d'ambiente (le chiavi di Resend, CallMeBot, Turnstile, OpenRouter, l'indirizzo e il segreto del [[Il server dei dati in casa|server in casa]], la chiave di amministrazione di pzkko) stanno nei progetti e '''mai nel repository'''. Una funzione dura al più 60 secondi (<code>maxDuration</code>).

== I limiti del piano Hobby ==
Il 28 ottobre 2026 [[Vercel Blob]] si è bloccato su tutto l'account per le soglie superate (10.000 letture e 2.000 scritture al mese): da allora i dati stanno sul pc di Alberto e Vercel «fa solo da sito e funzioni».
{{Citazione|togli vercel come server per sempre; restiamo da me e dal tunnel|Alberto, 29.10.2026}}

== Il DNS ==
Il record A del vecchio hosting Aruba di albertopecchini.it (62.149.128.40) è stato tolto il 28 settembre 2026; <code>pzkko.it</code> senza www ne ha ancora uno, che chiude la connessione TLS e andrebbe tolto.

{{Vedi anche|Il progetto Vercel pzkko|Vercel Blob|Il server dei dati in casa|Le API di pzkko|Vercel (pzkko)}}
[[Categoria:Vercel]]`,
  },

  'Il progetto Vercel pzkko': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/tools/pzkko/build.mjs', 'albertopecchini.it/pzkko/vercel.json', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''Il progetto Vercel pzkko''' è il terzo progetto di [[Vercel]] dal [[Il repository AP|repository AP]]: pubblica [[Pzkko.it]], che è una cartella di file statici senza build (<code>albertopecchini.it/pzkko/</code>).

== La radice che non è quella giusta ==
La Root Directory dovrebbe essere <code>albertopecchini.it/pzkko</code> con preset Other (nessuna build, output = la cartella). Finché resta <code>albertopecchini.it</code> con preset Vite, ci pensa <code>tools/pzkko/build.mjs</code>, il <code>buildCommand</code> del <code>vercel.json</code> del sito: se la build gira per pzkko.it copia la cartella in <code>dist/</code> così com'è, altrimenti lancia la build normale. Per lo stesso motivo le funzioni di pzkko stanno in <code>pzkko/api/*.mjs</code> ma sono riesportate da <code>albertopecchini.it/api/meteo.js</code>, <code>firme.js</code>, <code>wallet.js</code>, <code>borsa.js</code> (vedi [[Le API di pzkko]]).

== Variabili del progetto ==
<code>PZKKO_SERVER_URL</code> e <code>PZKKO_SERVER_SECRET</code> (il [[Il tunnel Tailscale|tunnel]] e il segreto del [[Il server dei dati in casa|server in casa]]), <code>PZKKO_ADMIN_KEY</code> (o <code>FIRME_ADMIN_KEY</code>) per creare il conto «pzkko» di Alberto e moderare, a piacere <code>WALLET_SECRET</code> (la firma dei token) e <code>GITHUB_TOKEN</code> (senza, le chiamate a GitHub per il fattore commit sono 60 l'ora per IP e dagli IP di Vercel possono finire). <code>EMAIL_AI_PROVIDER</code> non va impostata su Vercel: lì Claude Code non c'è.

== Domini ==
<code>www.pzkko.it</code> è il principale, <code>pzkko.it</code> rimanda a www con un 308. Le chiamate alle API vanno con la barra finale (<code>/api/wallet/</code>): senza, ogni POST passava da un redirect 308 che alcuni browser fanno confermare.

== In locale ==
<code>npm run dev:pzkko</code> apre <code>http://localhost:5182</code> con <code>tools/dev.mjs</code>, un server di file che fa come Vercel ([[In locale (pzkko)]]).

{{Vedi anche|Vercel|Vercel (pzkko)|Le API di pzkko|In locale (pzkko)}}
[[Categoria:Vercel]]`,
  },

  'Il server dei dati in casa': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Il server dei dati in casa
| dove = C:\\pzkko-server, sul pc di Alberto (fuori dal repository)
| dal = 28 ottobre 2026
| ascolta = 127.0.0.1:8787 (i dati), 127.0.0.1:8788 (la regia)
| tunnel = Tailscale Funnel
| file = server.mjs, avvia.mjs, installa.ps1, prova.mjs, banca\\, regia\\, dati\\, storico\\, log\\
| dipendenze = nessuna, solo Node
}}
'''Il server dei dati in casa''' è il programma Node che gira sul pc di [[Alberto Pecchini]], in <code>C:\\pzkko-server</code>, e che dal 28 ottobre 2026 tiene tutti i dati di [[Pzkko.it]] e di [[Better Call Pekko]]: i conti, gli zaini, la borsa, i giocatori, le firme della petizione, il database di BCP. Le funzioni di [[Vercel]] ci arrivano attraverso un tunnel HTTPS con <code>pzkko/api/_server.mjs</code>. Dal 31 ottobre ospita anche [[La banca sul server|la banca]], cioè tutta la logica dei soldi.

== Perché esiste ==
La notte del 28 ottobre 2026 [[Vercel Blob]] si è bloccato su tutto l'account: le soglie gratuite del piano Hobby erano superate (10.000 letture e 2.000 scritture al mese; [[Il canale sempre aperto|il canale sempre aperto]] ne faceva due ogni 3 secondi), e per 30 giorni ogni lettura dava 403. Nessuno poteva entrare nei conti.
{{Citazione|fallo in locale il server, fatto bene e super solido, mettilo in C:, 100% anti hacker|Alberto, 28.10.2026}}
Il 29 ottobre Blob è uscito dal codice e da <code>package.json</code> per sempre. La memoria che lo ricorda a Claude è [[Server in casa (memoria)]]: per salvare dati di un sito non si propone più nessuno storage di Vercel.

== I file ==
{| class="wikitable"
! file !! cosa c'è
|-
| <code>pzkko/wallet.json</code> || i conti: nomi, PIN cifrati (scrypt con sale), $pzk, EUR€, mosse ([[I conti]])
|-
| <code>pzkko/chat.json</code> || gli zaini della chat ([[Lo zaino]])
|-
| <code>pzkko/borsa.json</code> || la serie del cambio ([[La borsa]])
|-
| <code>pzkko/giocatori.json</code> || il database pubblico dei giocatori e le notizie ([[Il database dei giocatori]])
|-
| <code>pzkko/firme.json</code> || la petizione ([[Le firme della petizione]])
|-
| <code>bcp/db.json</code> || Better Call Pekko: visite, forum, guestbook, shoutbox ([[Il contatore di Better Call Pekko]])
|}
Stanno in <code>dati\\</code>, uno per nome (<code>pzkko__wallet.json</code> è <code>pzkko/wallet.json</code>): al più 40 file da 16 MB, solo JSON, coi nomi ammessi (<code>pzkko/…</code> e <code>bcp/…</code>). Non si cancella niente e non si scrive mai alla cieca: ogni scrittura dice quale versione (ETag) sostituisce, come faceva Blob.

== La sicurezza ==
* ascolta '''solo su 127.0.0.1:8787''': dalla rete di casa non si vede, sul router non si apre niente; da fuori arriva solo [[Il tunnel Tailscale|il tunnel]];
* ogni richiesta è firmata col segreto (HMAC-SHA256 su metodo, indirizzo, ora, nonce, lunghezza e impronta del corpo, condizioni); la firma si controlla prima di leggere il corpo; un'ora sbagliata di più di 2 minuti o un nonce già visto non passano, quindi una richiesta registrata e rimandata non funziona; chi non firma bene riceve un 404 vuoto;
* anche le risposte sono firmate: le funzioni rifiutano un server finto ([[Il ponte firmato]]);
* la cartella è aperta solo all'utente di Alberto, a SYSTEM e agli amministratori (<code>installa.ps1</code>);
* il segreto (256 bit a caso) sta in <code>config\\config.json</code> e «non va da nessuna parte tranne che nella variabile <code>PZKKO_SERVER_SECRET</code> su Vercel»; Claude non lo legge: lo copia Alberto. Se si pensa che sia uscito si cambia: si cancella il file, si rilancia <code>installa.ps1</code>, si aggiorna la variabile nei progetti <code>pzkko</code> e <code>bcp</code> e si rifà il deploy.

== Quando il pc è spento ==
Il pc deve essere acceso e non in sospensione. Se è spento, per 15 secondi alla volta le funzioni rispondono «in pausa» invece di aspettare: pzkko va avanti coi 1.000 $pzk della [[La sessione|sessione]], i conti aspettano, niente si perde. Si accende da solo all'accesso a Windows con l'attività pianificata <code>pzkko-server</code> ([[Il custode del server]]).

== I pezzi intorno ==
* [[Il canale diretto]] (<code>GET /v1/live</code>, Server-Sent Events, dal 29 ottobre notte): il server avvisa i browser nell'istante in cui scrive un conto o uno zaino; il telefono ha visto la vincita del pc dopo 19 ms;
* [[La regia del server]] (porta 8788, dal 31 ottobre): il pannello che vede tutto in diretta;
* [[Lo storico del server]]: le copie compresse ogni 10 minuti;
* il registro: <code>log\\AAAA-MM.log</code> (avvii, file nuovi, richieste rifiutate, una riga all'ora con letture e scritture) e <code>log\\avvia.log</code>;
* <code>prova.mjs</code>: 68 prove in una cartella temporanea, i dati veri non si toccano.

== I comandi ==
<code>Start-ScheduledTask pzkko-server</code> / <code>Stop-ScheduledTask pzkko-server</code>; è acceso? <code>Get-NetTCPConnection -LocalPort 8787 -State Listen</code>; la prova vera da fuori è <code>curl https://www.pzkko.it/api/wallet/</code> (200 coi numeri). Per rimettere una copia: spegni, decomprimi la copia dello storico sopra il file in <code>dati\\</code>, riaccendi. Per caricare codice nuovo non basta Stop/Start: vedi [[Riavvio server di casa (memoria)]].

{{Vedi anche|La banca sul server|Il tunnel Tailscale|Il ponte firmato|Il canale diretto|La regia del server|Il custode del server|Lo storico del server|Vercel Blob|Server in casa (memoria)|I file fuori dal repository}}
[[Categoria:Il server]]`,
  },

  'La banca sul server': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/chat/zaino.js', 'albertopecchini.it/tools/dev.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = La banca di pzkko
| dove = C:\\pzkko-server\\banca\\ (fuori dal repository)
| dal = 31 ottobre 2026
| file = index.mjs, motore.mjs, conti.mjs, economia.mjs, libro.mjs, lumaca.mjs, borsa.mjs, giocatori.mjs, archivio.mjs, giochi\\, dati\\, prove\\, CONTRATTO.md
| nel browser = pzk.fai('<gioco>.<azione>', args)
| prove = node prove\\<pezzo>.mjs dalla cartella banca
}}
'''La banca sul server''' è la logica dei soldi, dello zaino e dei giochi di [[Pzkko.it]], che dal 31 ottobre 2026 gira dentro [[Il server dei dati in casa|il server dei dati in casa]] (<code>C:\\pzkko-server\\server.mjs</code>, codice in <code>banca\\</code>) e non più nel browser. Il codice della banca '''non è nel repository AP''' (che è pubblico) e non ha copie su GitHub: va salvato altrove.

{{Citazione|saldo sempre nel server immediatamente · decifra un wallet devi farlo se hai un wallet · browser modificato non può accedere · tutti i dati degli account nel mio server · nessun codice accessibile da fuori · solo da me stanno i dati|Alberto, 31.10.2026}}

== Perché ==
Prima il browser decideva esiti, premi e zaino e mandava al server [[I lotti numerati|i lotti numerati]]: chiunque poteva barare, e le risposte giuste dei quiz stavano nel codice del sito («chi apriva la console le sapeva tutte»). Adesso '''il browser non decide più niente che conti''': chiede, la banca fa e risponde. Il commit è <code>feat(pzkko): la banca sul server di Alberto, il browser non decide più niente</code>.

== Com'è fatta ==
* ogni cosa che muove soldi o oggetti è un''''azione''' registrata in un modulo di <code>giochi\\</code> e importata da <code>giochi\\index.mjs</code>: <code>casino-roulette</code>, <code>casino-blackjack</code>, <code>casino-mine</code>, <code>casino-dado</code>, <code>casino-moneta</code>, <code>virtual</code>, <code>chat-attivita</code>, <code>chat-lavoro</code>, <code>chat-giochi</code>, <code>chat-negozio</code>, <code>chat-soldi</code>, <code>chat-eventi</code>, <code>app-quiz</code>, <code>app-sfide</code>, <code>app-missioni</code>, <code>app-miniera</code>, <code>app-cucina</code>, <code>app-profilo</code>, <code>app-pzkstore</code>, <code>app-decifratore</code>;
* i cataloghi che contano (prezzi, paghe, probabilità, le domande dei quiz con le risposte giuste, le regole di blackjack, mine, roulette, dado, le squadre e le partite di virtual) stanno in <code>banca\\dati\\</code>: sono copie di <code>chat/testi.js</code>, <code>chat/oggetti.js</code>, <code>chat/quiz-dati.js</code>… del repository, che restano lì solo per disegnare. Le regole esistono quindi in '''due copie''' (repo per disegnare, <code>banca\\dati\\</code> per decidere) e vanno cambiate insieme;
* <code>motore.mjs</code> dà a ogni azione il contesto <code>x</code>: il conto, l'ora del server (mai quella del browser), il caso sempre crypto, i soldi (<code>gioca</code>, <code>punta</code>/<code>regola</code>, <code>spendi</code>, <code>paga</code>, <code>perdi</code>), lo zaino con le regole di <code>chat/zaino.js</code>, i tavoli dei giochi aperti (il sabot, le mine, i semi non escono mai dal server);
* il browser chiama <code>pzk.fai(cosa, args)</code> e riceve <code>{ ok, esito, conto }</code>: il conto della risposta diventa lo stato, <code>chat/zaino.js</code> è ora solo una copia da leggere;
* gli ospiti senza conto vivono nella memoria del server; in locale <code>tools/dev.mjs</code> carica la stessa banca in memoria (<code>PZKKO_BANCA</code> per un'altra cartella, un segreto di prova).

Le regole per chi la tocca stanno in [[Il contratto della banca|CONTRATTO.md]]; la memoria per Claude è [[Banca sul server (memoria)]]. Vercel fa solo da ponte firmato (<code>_server.mjs</code>, <code>ponte</code> → <code>PUT /v1/api/&lt;nome&gt;</code>): [[Il ponte firmato]].

== Dopo una modifica ==
Cambiando la banca serve riavviare il server, e non basta Stop/Start dell'attività pianificata: [[Riavvio server di casa (memoria)]]. Le prove si lanciano con <code>node prove\\&lt;pezzo&gt;.mjs</code> dalla cartella <code>banca</code> (in memoria): <code>app-quiz</code>, <code>app-missioni</code>, <code>app-cucina</code>, <code>app-profilo</code>, <code>app-miniera</code>, <code>app-decifratore</code>…

{{Vedi anche|Il contratto della banca|Il server dei dati in casa|I lotti numerati|L'economia|La cassa di pzk|Banca sul server (memoria)|La regia del server}}
[[Categoria:Il server]]`,
  },

  'Il contratto della banca': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/chat/zaino.js', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''Il contratto della banca''' è <code>C:\\pzkko-server\\banca\\CONTRATTO.md</code>, il documento per «chi sposta un pezzo del sito sul server», scritto il 31 ottobre 2026 con [[La banca sul server|la banca]]. Dice cosa fa il server, cosa fa il browser, e cosa non si tocca.

== Il server ==
* un'azione si registra con <code>registra({ 'chat.pesca': { conto: false, fai(x, args) { … } } })</code>; <code>conto: true</code> vuol dire solo per chi ha un conto (gli ospiti ricevono un errore);
* <code>x.c</code> è il conto, <code>x.now</code> l'ora del server («usare SEMPRE questa, mai un'ora mandata dal browser»), <code>x.rnd</code> il caso crypto (<code>int</code>, <code>float</code>, <code>si(p)</code>, <code>scegli</code>, <code>mescola</code>, <code>seme</code>), <code>x.no('perché')</code> rifiuta senza salvare niente;
* i soldi: <code>x.gioca(gioco, puntata, torna)</code> per un colpo solo; <code>x.punta</code> + <code>x.regola</code> per i giochi a più mosse (la puntata resta sul tavolo); <code>x.spendi(n, voce)</code> per un acquisto (alla cassa); <code>x.paga(n, { puro, casa })</code> per i soldi nuovi, moltiplicati per livello e bonus; <code>x.perdi(n)</code> per le morti (i soldi finiscono per terra); «non toccare <code>x.c.pzk</code> a mano»;
* <code>x.z</code> è lo zaino con le regole di <code>chat/zaino.js</code> e l'ora del server; <code>x.tavolo(gioco)</code> lo stato del gioco aperto: in <code>vede</code> solo quello che il giocatore può vedere, tutto il resto (sabot, mine, semi, risposte giuste) non esce mai;
* un'azione che manda in galera restituisce <code>{ arresto: { ore, multa, perche } }</code> e <code>wallet.mjs</code> lo applica nella stessa scrittura: il browser non può più chiedere l'arresto;
* ogni numero che arriva dal browser va controllato (intero o mezzo, nei limiti, <code>Object.hasOwn</code> sui cataloghi); attese, limiti al giorno e serie si contano sul server; nei giochi d'abilità il server prepara la prova, il browser risponde, il server verifica risposta e tempo «con un minimo umano».

== Il browser ==
<code>games/pzk.js</code> espone le azioni (<code>pzk.fai</code>), le letture (<code>zainoBanca</code>, <code>tavoloBanca</code>, <code>saldo</code>, <code>puliti</code>, <code>inGalera</code>, <code>ospite</code>) e le fiche solo per lo schermo (<code>punta</code>/<code>ritira</code>, <code>sgombra</code>); spariscono <code>regola</code>, <code>via</code>, <code>perdi</code>, <code>arresto</code>. Da <code>chat/zaino.js</code> spariscono <code>aggiungi</code>, <code>togli</code>, <code>daiXp</code>, <code>rompiPager</code>, <code>assumi</code>, <code>installa</code>, <code>salvaSfide</code>… «ogni chiamata a una di queste diventa un'azione della banca».

== Lo stile ==
Commenti in italiano, datati, col perché; densità e nomi come il codice intorno. Il contratto chiude con «non toccare»: <code>games/*</code>, <code>api/*</code>, <code>games/pzk.js</code>, su cui lavorava un'altra sessione.

{{Vedi anche|La banca sul server|Banca sul server (memoria)|I $pzk|Lo zaino}}
[[Categoria:Il server]]`,
  },

  'La regia del server': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/server/index.html', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''La regia del server''' è il secondo ingresso del [[Il server dei dati in casa|server dei dati in casa]], dal 31 ottobre 2026: il pannello che vede tutto in diretta, su <code>http://localhost:8788/server/</code>. Non va confusa con [[La regia|la regia]] della home di pzkko (quella che regola il 3D, l'ora e il meteo).

== Cosa mostra ==
I conti interi, con zaini e tavoli coi loro segreti; gli ospiti; ogni richiesta alla banca (chi, cosa, com'è andata, i millisecondi); i soldi che si muovono; i canali aperti; i rifiuti; il registro; lo storico; il tunnel e la macchina. «Guarda e basta: non cambia niente». Dalla regia non escono mai PIN, token, chiavi e biglietti: nei corpi delle richieste sono coperti con •••.

== Come si entra ==
* si apre da <code>pzkko.it/server</code> (la pagina <code>pzkko/server/index.html</code> rimanda a <code>http://localhost:8788/server/</code>) o direttamente da lì;
* ascolta '''solo su 127.0.0.1:8788''': il tunnel porta fuori la 8787 e basta, da Internet e dalla rete di casa la regia non c'è; la porta si cambia con <code>portaRegia</code> in <code>config\\config.json</code>;
* la password si sceglie la prima volta; la sua impronta (scrypt) sta in <code>config\\regia.json</code>; per cambiarla si cancella quel file e si riapre; l'ingresso vale 12 ore, al più 5 tentativi al minuto;
* il codice sta in <code>regia\\</code> (<code>regia.mjs</code> il server, <code>pagina\\</code> la pagina); se la regia non si accende, il server va avanti senza e lo scrive nel registro.

{{Vedi anche|Il server dei dati in casa|La banca sul server|Riavvio server di casa (memoria)|La regia}}
[[Categoria:Il server]]`,
  },

  'Il tunnel Tailscale': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''Il tunnel Tailscale''' (Tailscale Funnel) porta le richieste da Internet a <code>127.0.0.1:8787</code>, cioè al [[Il server dei dati in casa|server dei dati in casa]], in HTTPS e senza aprire porte sul router. L'indirizzo è <code>https://desktop-inpvhr2.tail6c90b3.ts.net</code> e sta nella variabile <code>PZKKO_SERVER_URL</code> dei progetti [[Vercel]] <code>pzkko</code> e <code>bcp</code>.

== Come si mette ==
<code>winget install --id Tailscale.Tailscale -e</code>, <code>tailscale up</code> (si entra col proprio account), <code>tailscale funnel --bg 8787</code> (la prima volta dà un link per attivare Funnel), <code>tailscale funnel status</code> dice l'indirizzo <code>https://&lt;nome-del-pc&gt;.&lt;tailnet&gt;.ts.net</code>.

== Quando pzkko dice «in pausa» col server acceso ==
È successo il 31 ottobre 2026 dopo un riavvio con cambio di rete: porta 8787 in ascolto, <code>tailscale funnel status</code> «on», ma Vercel dava «fetch failed». Un curl dal pc al tunnel '''non prova niente''' (passa dalla tailnet, con un IP 100.x nel registro); la prova vera è <code>curl https://www.pzkko.it/api/wallet/</code> o i runtime log di Vercel. Il rimedio che ha funzionato: <code>tailscale down</code>, <code>tailscale up</code> (<code>tailscale funnel --bg 8787</code> da solo non bastava). Dal 31 ottobre lo fa da solo la guardia del tunnel in <code>avvia.mjs</code> ([[Il custode del server]]): ogni 2 minuti chiede al sito, dopo 3 fallimenti fa down/up, al più ogni 15 minuti, e lo scrive in <code>log\\avvia.log</code>.

In locale, [[Claude Code]] entra come pzkko sul server di prova solo da questo computer o dalla rete Tailscale (100.64.0.0/10): <code>tools/dev.mjs</code>, <code>/__dev/accesso</code>.

{{Vedi anche|Il server dei dati in casa|Il custode del server|Server in casa (memoria)}}
[[Categoria:Il server]]`,
  },

  'Vercel Blob': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/README.md', 'albertopecchini.it/tools/assistenza/README.md'],
    testo: `'''Vercel Blob''' è lo storage di [[Vercel]] che dal 29 settembre al 28 ottobre 2026 ha tenuto i dati vivi dei siti di Alberto, e che dal 29 ottobre non c'è più nel codice.

== Cosa ci stava ==
Il database di [[Better Call Pekko]] (<code>bcp/db.json</code>: contavisite, forum, guestbook, shoutbox, dal 29 settembre 2026), poi tutto pzkko: <code>pzkko/firme.json</code> (la petizione, 22 ottobre), <code>pzkko/wallet.json</code> e <code>pzkko/borsa.json</code> (il wallet e la borsa, 22 ottobre notte), <code>pzkko/chat.json</code> (gli zaini), <code>pzkko/giocatori.json</code>. Le scritture erano condizionali sull'ETag («due firme insieme non si cancellano: chi perde riprova»), le letture sempre dall'origine (<code>useCache: false</code>).

== Il blocco ==
Il piano Hobby dà 10.000 letture e 2.000 scritture al mese. [[Il canale sempre aperto|Il canale sempre aperto]] del 27 ottobre faceva due <code>head</code> ogni 3 secondi per istanza accesa: la notte del 28 ottobre Blob si è bloccato su tutto l'account, con un 403 a ogni lettura per 30 giorni, e nessuno poteva più entrare nei conti.
{{Citazione|togli vercel come server per sempre; restiamo da me e dal tunnel|Alberto, 29.10.2026}}
I file sono passati sul [[Il server dei dati in casa|server dei dati in casa]] (<code>fix(pzkko): i dati sul server di Alberto, e Vercel Blob tolto per sempre</code>, 29 ottobre) e il pacchetto <code>@vercel/blob</code> è uscito da <code>package.json</code>. Da allora la regola, in [[Server in casa (memoria)]], è di non proporre più Blob, KV o altri storage di Vercel.

{{Vedi anche|Il server dei dati in casa|Vercel|Il canale sempre aperto}}
[[Categoria:Vercel]]`,
  },

  'Il custode del server': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/README.md'],
    testo: `'''Il custode del server''' è <code>C:\\pzkko-server\\avvia.mjs</code>: tiene acceso [[Il server dei dati in casa|il server dei dati in casa]] e lo riaccende se cade. Lo avvia l'attività pianificata <code>pzkko-server</code> all'accesso a Windows, in una console nascosta (<code>conhost --headless</code>), e lascia un lucchetto, <code>avvia.lock</code>, perché non ne partano due.

== La guardia del tunnel ==
Dal 31 ottobre 2026 controlla anche [[Il tunnel Tailscale|il tunnel]]: ogni 2 minuti chiede al sito; dopo 3 fallimenti fa <code>tailscale down</code> e <code>tailscale up</code>, al più ogni 15 minuti, e scrive in <code>log\\avvia.log</code>.

== La trappola del riavvio ==
Il 31 ottobre <code>Stop-ScheduledTask</code> ha chiuso solo la console: <code>avvia.mjs</code> e <code>server.mjs</code> sono rimasti vivi, il nuovo Start è uscito per il lucchetto, e uccidendo poi solo <code>server.mjs</code> il custode non riusciva più a rilanciarlo (codice 3221225794 = 0xC0000142: la console non c'era più). pzkko è rimasto «in pausa» per circa 16 secondi. La regola, in [[Riavvio server di casa (memoria)]]: fermare '''tutti''' i node con <code>pzkko-server</code> nella riga di comando, cancellare <code>avvia.lock</code>, poi <code>Start-ScheduledTask pzkko-server</code>, e controllare che 8787 e 8788 ascoltino.

{{Vedi anche|Il server dei dati in casa|Il tunnel Tailscale|Riavvio server di casa (memoria)}}
[[Categoria:Il server]]`,
  },

  'Lo storico del server': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/README.md'],
    testo: `'''Lo storico del server''' è la cartella <code>C:\\pzkko-server\\storico\\</code>: le copie compresse dei file del [[Il server dei dati in casa|server dei dati in casa]]. Ogni 10 minuti il server fa una copia dei file cambiati (<code>pzkko__wallet</code>, <code>pzkko__chat</code>, <code>pzkko__borsa</code>, <code>pzkko__giocatori</code>, <code>bcp__db</code>, una sottocartella per file, nomi come <code>2026-10-28T21-40-00Z.json.gz</code>); si tengono tutte quelle delle ultime 48 ore, poi una al giorno per 90 giorni.

== Rimettere una copia ==
Per esempio i conti di ieri sera: <code>Stop-ScheduledTask pzkko-server</code>, poi si decomprime la copia sopra <code>dati\\pzkko__wallet.json</code> (il LEGGIMI dà la riga di Node con <code>zlib.gunzipSync</code>), poi <code>Start-ScheduledTask pzkko-server</code>. I dati del server non sono in nessun repository: lo storico è l'unica copia, insieme a quello che Alberto salva altrove.

{{Vedi anche|Il server dei dati in casa|Il custode del server}}
[[Categoria:Il server]]`,
  },

  'Le API di pzkko': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/api/giocatori.mjs', 'albertopecchini.it/pzkko/api/meteo.mjs', 'albertopecchini.it/pzkko/api/firme.mjs', 'albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/games/live.js'],
    testo: `'''Le API di pzkko''' sono le funzioni serverless di [[Pzkko.it]] in <code>pzkko/api/*.mjs</code>, eseguite da [[Vercel]] e riesportate da <code>albertopecchini.it/api/*.js</code> finché la radice del progetto resta quella del sito ([[Il progetto Vercel pzkko]]). I file col trattino basso (<code>_server.mjs</code>, <code>_archivio.mjs</code>, <code>_borsa.mjs</code>, <code>_conti.mjs</code>, <code>_economia.mjs</code>, <code>_giocatori.mjs</code>) sono i pezzi comuni, non funzioni.

{| class="wikitable"
! indirizzo !! file !! cosa fa !! dal
|-
| <code>/api/wallet/</code> || <code>wallet.mjs</code> || i conti: crea, entra, stato, salva, le azioni (<code>fai</code>), lo zaino, il biglietto del canale diretto, le operazioni della banca ([[Il wallet (API)]]) || 22 ottobre 2026
|-
| <code>/api/borsa/?da=24h|7g|30g|tutto</code> || <code>borsa.mjs</code> || il cambio PZK/EUR€, le variazioni, i fattori, la serie, la capitalizzazione; un minuto di cache ([[La borsa (API)]]) || 22 ottobre 2026
|-
| <code>/api/giocatori/</code> || <code>giocatori.mjs</code> || il database pubblico: classifiche, ricerca, profilo, notizie ([[I giocatori (API)]]) || 23 ottobre 2026
|-
| <code>/api/meteo/</code> || <code>meteo.mjs</code> || il meteo di Mantova da Open-Meteo, dieci minuti in cache ([[Il meteo di Mantova (API)]]) || 18 ottobre 2026
|-
| <code>/api/firme/</code> || <code>firme.mjs</code> || le firme della petizione ([[Le firme (API)]]) || 22 ottobre 2026
|-
| <code>/api/live/</code> || <code>live.mjs</code> || il canale sempre aperto di riserva ([[Il canale (API)]]) || 27 ottobre 2026
|}

== Le regole comuni ==
* si chiamano '''con la barra finale''' (<code>trailingSlash</code>): senza, ogni POST passava da un redirect 308 che alcuni browser fanno confermare («inviare nuovamente i dati del modulo?»);
* i dati non stanno su Vercel: ogni funzione legge e scrive sul [[Il server dei dati in casa|server dei dati in casa]] attraverso <code>_server.mjs</code> ([[Il ponte firmato]]); senza il server rispondono «offline» o «in pausa» e il sito va avanti coi 1.000 $pzk della sessione;
* dal 31 ottobre le decisioni (esiti, premi, zaino) le prende [[La banca sul server|la banca]] e la funzione del wallet le inoltra (<code>PUT /v1/api/&lt;nome&gt;</code>);
* le funzioni durano al più 60 secondi (<code>maxDuration</code>); il limite del wallet è 900 richieste ogni 10 minuti;
* in locale (<code>npm run dev:pzkko</code>) le serve <code>tools/dev.mjs</code> con l'archivio in memoria.

{{Vedi anche|Il ponte firmato|Il server dei dati in casa|Vercel|I conti|La borsa}}
[[Categoria:Il server]]`,
  },

  'Le firme (API)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/firme.mjs', 'albertopecchini.it/api/firme.js', 'albertopecchini.it/tools/pzkko/firme.mjs'],
    testo: `'''Le firme (API)''' è la funzione <code>pzkko/api/firme.mjs</code> (pubblicata come <code>albertopecchini.it/api/firme.js</code>), dal 22 ottobre 2026: salva e restituisce le firme vere della [[La petizione|petizione]] «pzkko.it è un bel sito?». Le firme stanno in <code>pzkko/firme.json</code> sul [[Il server dei dati in casa|server dei dati in casa]] (fino al 28 ottobre su [[Vercel Blob]]), riscritto solo se l'ETag è ancora quello: due firme insieme non si cancellano, chi perde riprova. Senza il server risponde «offline»: il foglio si vede ma non si firma.

== Le protezioni ==
Campo trappola; 2,5 secondi minimi da quando il foglio si è avvicinato; al massimo 2 firme in 10 minuti e 6 al giorno per IP (in memoria, l'IP non si salva); lo stesso nome una volta al giorno; 120 firme l'ora in tutto; nomi di 2–32 lettere senza link, numeri di telefono, emoji né parolacce (anche camuffate: «c4zz0», «p u t t a n a»; non i cognomi veri come Negri o Negro); 5.000 firme al massimo. A chi guarda vanno le ultime 300, con venti secondi di cache sulla rete di Vercel e cinque minuti di riuso mentre si rinfresca: chi firma vede subito la sua, gli altri entro una ventina di secondi.

== La moderazione ==
Con <code>FIRME_ADMIN_KEY</code> nel progetto (e in <code>.env.local</code>): <code>node tools/pzkko/firme.mjs</code> elenca le firme, <code>via &lt;id&gt;</code> ne cancella una; oppure si modifica <code>C:\\pzkko-server\\dati\\pzkko__firme.json</code> a server spento. In locale le firme stanno in memoria finché il server resta acceso (<code>--locale</code>).

{{Vedi anche|La petizione|Le firme della petizione|Le API di pzkko}}
[[Categoria:Il server]]`,
  },

  'Il meteo di Mantova (API)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/meteo.mjs', 'albertopecchini.it/api/meteo.js'],
    testo: `'''Il meteo di Mantova (API)''' è <code>pzkko/api/meteo.mjs</code> (riesportata da <code>albertopecchini.it/api/meteo.js</code>, «e c'è anche su albertopecchini.it: male non fa»): dà alla [[La scena 3D|scena 3D]], al [[Il suono della strada|suono]] e al [[Il tomodachi|tomodachi]] il tempo vero di [[Mantova]], preso da [[Open-Meteo]] (gratuito, senza chiave) e tenuto dieci minuti nella cache di Vercel: Open-Meteo riceve una richiesta ogni dieci minuti, non una per visita.

== Cosa dà ==
Dal codice WMO il tipo (sole, nuvoloso, nebbia, pioggia, temporale, neve), le nuvole in percentuale, la pioggia dell'ultima ora e delle ultime 12 (il marciapiede resta bagnato quando ha smesso e asciuga dopo giorni di sole), la visibilità, la neve per terra, il vento, la temperatura (che decide anche il ritmo dei grilli, con la legge di Dolbear). La pagina lo chiede da quando parte e ogni dieci minuti, ma solo col meteo vero scelto in [[La regia|regia]] (dal 29 ottobre 2026 è la partenza di serie; dal 23 al 29 era «sempre sole» e non si chiedeva niente). Il 21 ottobre la richiesta è passata «con la barra in fondo, senza il 308 di Vercel». È anche un [[I fattori del mondo|fattore del mondo]] della borsa: sole +2 %, pioggia o temporale −2 %, neve −1 %.

{{Vedi anche|Il meteo|Open-Meteo|Le API di pzkko|I fattori del mondo}}
[[Categoria:Il server]]`,
  },

  'Il wallet (API)': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/api/wallet.js', 'albertopecchini.it/tools/pzkko/wallet.mjs', 'albertopecchini.it/tools/pzkko/prova-lotti.mjs'],
    testo: `'''Il wallet (API)''' è <code>pzkko/api/wallet.mjs</code>, la funzione dei [[I conti|conti]] del [[Il wallet|wallet]], dal 22 ottobre 2026 (notte): il posto da cui passano i $pzk di chi ha un conto. Va chiamata come <code>POST /api/wallet/</code>, con la barra finale.

== Le azioni ==
Crea (nome di 2–20 lettere senza accenti né maiuscole, PIN di quattro cifre cifrato con scrypt e sale, indirizzo «pzk» più sei cifre a caso ma uniche; il conto nuovo parte con 1.000 $pzk); entra (un token firmato con HMAC che vale 180 giorni; 8 tentativi in dieci minuti per nome, 3 conti al giorno per IP); stato e salva; il cambio in EUR€; gli [[Gli invii|invii]] (dopo 48 ore dalla nascita del conto); le banconote per terra (<code>trova</code>, una al giorno ciascuna); il [[Il sussidio|sussidio]]; lo zaino (azione «zaino», unito con <code>chat/zaino-unisci.mjs</code>); il biglietto del [[Il canale diretto|canale diretto]] (<code>&lt;conto&gt;.&lt;scadenza&gt;.&lt;firma&gt;</code>, dieci minuti per aprire); dal 29 ottobre i [[I lotti numerati|lotti numerati]] (<code>lotti</code>, «I LOTTI NUMERATI»); dal 31 ottobre <code>fai</code>, che inoltra ogni azione alla [[La banca sul server|banca]]. <code>GET /api/wallet/?operazioni=1</code> dice com'è andata l'ultima [[Le operazioni della banca|operazione della banca]].

== I controlli ==
Un saldo mandato dal browser si accetta se ha senso: non più di 20.000 + 1.200 $pzk al secondo dall'ultimo salvataggio («nessun gioco paga più di 35 a 1 su una fiche da 500»); un gioco non rende più di 50 volte il puntato; i nomi riservati (pzkko, alberto, admin, banca…) si creano solo con la chiave di amministrazione (<code>PZKKO_ADMIN_KEY</code> o <code>FIRME_ADMIN_KEY</code>: «il repository è pubblico, un PIN nel codice non sarebbe un segreto»). [[Il conto di Alberto]] (pzk398893) non ha limiti (<code>illimitato</code>). [[La lumachina]] la vive il server alla prima richiesta del giorno, prima di accogliere il saldo. Il limite è 900 richieste ogni 10 minuti (era 300).

== Da riga di comando ==
<code>node tools/pzkko/wallet.mjs</code> elenca i conti, <code>via &lt;nome&gt;</code> ne cancella uno, <code>crea pzkko &lt;pin&gt;</code> crea il conto di Alberto, <code>borsa</code> legge la borsa; <code>--locale</code> parla col server di prova. Le prove dei lotti: <code>node tools/pzkko/prova-lotti.mjs</code> (il wallet vero con l'archivio in memoria: la vincita mandata due volte, due dispositivi insieme, i lotti truccati, il libro dei conti, il browser di prima). In locale la funzione firma anche l'accesso automatico come pzkko (<code>accessoLocale</code>, esportata ma non è l'handler).

{{Vedi anche|I conti|I lotti numerati|Le API di pzkko|La banca sul server|Il canale diretto}}
[[Categoria:Il server]]`,
  },

  'La borsa (API)': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/api/borsa.js'],
    testo: `'''La borsa (API)''' è <code>pzkko/api/borsa.mjs</code> (e il pezzo comune <code>_borsa.mjs</code>): la serie del [[Il cambio PZK/EUR€|cambio PZK/EUR€]], nata a 1 $pzk = 1 € la notte del 22 ottobre 2026 e scritta in <code>pzkko/borsa.json</code> sul [[Il server dei dati in casa|server dei dati in casa]].

== Come si legge ==
<code>GET /api/borsa/?da=24h|7g|30g|tutto</code> dà il cambio, il suo inverso, le variazioni del periodo, i [[I fattori del mondo|fattori del momento]], la serie e la capitalizzazione (l'offerta di $pzk per il cambio), con un minuto di cache sulla rete di Vercel. Un punto ogni dieci minuti per l'ultima settimana, un'ora fino a tre mesi, poi un giorno. Ogni passo è un caso deterministico dall'ora del punto («il passato non si riscrive») più una deriva: l'umore del giorno (−5 %…+5 %, con il 4 % di giorni-eccezione come le crypto: ±10–30 % e il doppio del nervosismo) e i fattori del mondo, misurati quando si aggiunge un punto. Dal 26 ottobre tiene conto dell'inflazione: metà della crescita dell'offerta nelle ultime 24 ore (al più ±5 % al giorno) si toglie dalla deriva ([[L'economia]]).

Il browser converte al cambio dell'ultima sincronizzazione (manda <code>t</code>, il server ricalcola <code>tassoA(t)</code>) purché non sia passata più di mezz'ora. Da riga di comando: <code>node tools/pzkko/wallet.mjs borsa</code>. La legge il [[Il banner del wallet|banner del wallet]], il wallet, l'app [[Banca (app)]] del cercapersone.

{{Vedi anche|La borsa|Il cambio PZK/EUR€|I fattori del mondo|Le API di pzkko}}
[[Categoria:Il server]]`,
  },

  'I giocatori (API)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/giocatori.mjs', 'albertopecchini.it/pzkko/chat/db.js', 'albertopecchini.it/pzkko/games/libro.mjs'],
    testo: `'''I giocatori (API)''' è <code>pzkko/api/giocatori.mjs</code> (col pezzo comune <code>_giocatori.mjs</code>), dal 23 ottobre 2026: [[Il database dei giocatori|il database pubblico dei giocatori]], un file <code>pzkko/giocatori.json</code> sul [[Il server dei dati in casa|server in casa]] con la riga pubblica di ognuno (livello, statistiche, mestiere, serie, leggendari presi, ultima volta visto, la faccia e il motto del profilo), aggiornata a ogni salvataggio dello zaino e unita ai conti del wallet a ogni richiesta («i $pzk sono sempre quelli veri»).

== Le chiamate ==
<code>GET ?top=&lt;metrica&gt;</code> (le classifiche), <code>?cerca=</code>, <code>?ind=pzk123456</code> (il profilo con la posizione in ogni classifica), <code>?stats=1</code>, <code>?notizie=1</code> (salite di livello, leggendari, vincite grosse, mestieri, serie: i dati, le parole le mette il browser); <code>POST { token, vicini }</code> per il proprio profilo e i rivali. Mai il PIN né gli oggetti uno per uno. Dal 29 ottobre notte i numeri delle classifiche li tiene il server nel [[Il libro dei conti|libro dei conti]] e li legge un modulo solo, <code>games/libro.mjs</code>, lo stesso nel browser.

{{Vedi anche|Il database dei giocatori|Le classifiche|Le notizie della banca|Le API di pzkko}}
[[Categoria:Il server]]`,
  },

  'Il canale (API)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/games/live.js', 'albertopecchini.it/pzkko/README.md'],
    testo: `'''Il canale (API)''' è <code>/api/live/</code> (<code>api/live.mjs</code>), la funzione del [[Il canale sempre aperto|canale sempre aperto]] del 27 ottobre 2026: chi ha un conto tiene aperta una richiesta POST col token e riceve un avviso JSON per riga quando lo zaino (<code>{ k: 'zaino', t }</code>) o il conto (<code>{ k: 'conto', pzk, es, fn }</code>) sono cambiati da un altro dispositivo. Vercel chiude una funzione dopo una cinquantina di secondi (<code>maxDuration</code> 60): il server manda <code>{ k: 'riconnetti' }</code> e il browser riapre. Dentro, un solo controllo comune a tutte le connessioni dell'istanza: ogni 3 secondi l'ETag dei due file (<code>head</code>), e un file si scarica solo se è cambiato.

Fu proprio questo consumo (due <code>head</code> ogni 3 secondi per istanza accesa) a far bloccare [[Vercel Blob]] la notte del 28 ottobre. Dal 29 ottobre notte il canale principale è [[Il canale diretto|quello diretto]] del server in casa (<code>GET /v1/live</code>, Server-Sent Events), e <code>/api/live/</code> resta la riserva: se il canale diretto non c'è o cade tre volte di fila senza aprirsi, per due minuti si usa questo. Il browser è <code>games/live.js</code>.

{{Vedi anche|Il canale sempre aperto|Il canale diretto|Le API di pzkko|Vercel Blob}}
[[Categoria:Il server]]`,
  },

  'Il ponte firmato': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/api/bcp.js'],
    testo: `'''Il ponte firmato''' è <code>pzkko/api/_server.mjs</code>: il modulo con cui le funzioni di [[Vercel]] parlano col [[Il server dei dati in casa|server dei dati in casa]]. Lo usano <code>_archivio.mjs</code> (i file JSON di pzkko), <code>firme.mjs</code> e <code>albertopecchini.it/api/bcp.js</code> (Better Call Pekko) quando nel progetto ci sono <code>PZKKO_SERVER_URL</code> (l'indirizzo del [[Il tunnel Tailscale|tunnel]], https) e <code>PZKKO_SERVER_SECRET</code>. Il 29 ottobre un fix ha fatto sì che «il segreto del server si legge anche incollato male» (spazi e virgolette intorno).

== Come firma ==
Ogni richiesta porta una firma HMAC-SHA256 con ora e nonce («niente richieste rimandate, niente server finti»); ogni risposta è firmata a sua volta e la funzione la rifiuta se la firma non torna. Scrive solo se l'ETag è ancora quello. Dal 31 ottobre fa anche da '''ponte''' per [[La banca sul server|la banca]]: <code>ponte</code> → <code>PUT /v1/api/&lt;nome&gt;</code>, così un'azione del browser (<code>pzk.fai</code>) arriva alla banca senza che il codice della banca stia su GitHub. Se il pc è spento, per 15 secondi alla volta risponde «in pausa».

{{Vedi anche|Il server dei dati in casa|La banca sul server|Le API di pzkko}}
[[Categoria:Il server]]`,
  },

  'albertopecchini.it': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/README.md', 'albertopecchini.it/src/templates/routes.js', 'albertopecchini.it/src/templates/layout.js', 'albertopecchini.it/src/templates/pages/home.js', 'albertopecchini.it/src/templates/pages/stile.js', 'albertopecchini.it/src/data/site.js', 'albertopecchini.it/src/data/projects.js', 'albertopecchini.it/src/data/stile.js', 'albertopecchini.it/src/styles/tokens.css', 'albertopecchini.it/src/styles/base.css', 'albertopecchini.it/src/styles/components.css', 'albertopecchini.it/src/styles/layout.css', 'albertopecchini.it/src/styles/home.css', 'albertopecchini.it/src/styles/pages.css', 'albertopecchini.it/src/client/lume.js', 'albertopecchini.it/src/main.js', 'albertopecchini.it/plugins/site-pages.js', 'albertopecchini.it/vite.config.js'],
    testo: `{{Infobox
| titolo = albertopecchini.it
| immagine = https://www.albertopecchini.it/media/web/ap-desktop.webp
| didascalia = la home: l'hero centrato col terminale (dal 2 novembre 2026 impaginata come reflection.ai)
| dove = www.albertopecchini.it
| dal = 18 settembre 2026 (il sito statico)
| cartella = albertopecchini.it/
| com'è = statico, senza framework: dati → template → HTML, plugin Vite
| caratteri = Hanken Grotesk, Fraunces, Geist Mono (dal 2 novembre 2026)
| accento = il blu #007acc (dal 3 novembre 2026; prima il minio #e5481f)
| hosting = Vercel, Node 24
}}
'''albertopecchini.it''' è il portfolio di [[Alberto Pecchini]]: «diplomato geometra, web designer, graphic designer. Rivalta sul Mincio (MN)». È il sito serio, quello che firma gli altri; [[Pzkko.it]] è il suo indirizzo personale e [[Better Call Pekko]] la parodia.

[[File:https://www.albertopecchini.it/media/web/ap-iphone-01.webp|thumb|la home sull'iPhone 18 Pro, la prima delle strisce catturate per il case study]]

== Com'è fatto ==
Sito '''statico, senza framework''': i contenuti stanno in <code>src/data/*.js</code>, i template in <code>src/templates/</code> sono funzioni che restituiscono stringhe HTML, e <code>plugins/site-pages.js</code> (un plugin Vite) in sviluppo rende le pagine al volo e in build scrive ogni rotta in <code>dist/&lt;rotta&gt;/index.html</code> con <code>404.html</code>, <code>sitemap.xml</code>, <code>robots.txt</code> e le miniature SVG. Nel browser gira solo il JavaScript scritto a mano in <code>src/client/</code> (un modulo per ambito; niente librerie); ogni pagina è completa senza JavaScript. Nessun cookie di tracciamento, font ospitati localmente via <code>@fontsource-variable</code> (dal 2 novembre 2026 Hanken Grotesk, Fraunces e Geist Mono; prima Archivo Variable, [[Cascadia Code]] dal 2 ottobre al posto di IBM Plex Mono, Instrument Serif). Dal 2 ottobre 2026 '''tutto in minuscolo''' (<code>body { text-transform: lowercase }</code>) e dal 18 ottobre sfondi piani, senza righello né carta a puntini.

== Le pagine ==
<code>/</code> (home, dal 2 novembre 2026 nell'ordine di reflection.ai: l'hero centrato col nome gigante com'era ma più piccolo (dal 3 novembre: «ci deve essere»), «Casa, sito, marchio. Un solo referente.» in Fraunces e il terminale <code>alberto.sh</code> a cinque comandi, l'idea in una frase, le quattro aree in schede, i siti web col carosello, la fila dei siti online che scorre, il manifesto scuro con la foto «curioso», le tre convinzioni, il metodo, i numeri, lo studio, l'indice dei lavori), <code>/portfolio/</code> con i filtri e le aree tecnico e web (grafica nascosta), un case study in nove sezioni per ognuno dei 9 progetti reali (su 24 nel file: i 15 dimostrativi restano spenti con <code>showSamples = false</code>), <code>/portfolio/tavole/</code> (il visualizzatore delle [[Le tavole|tavole vere]]), <code>/servizi/</code> e <code>/servizi/informatica/</code>, <code>/metodo/</code> (le sette fasi), <code>/studio/</code> (biografia, timeline, i diciannove strumenti «gelatina», il tempo libero con Better Call Saul) e <code>/studio/profilo/</code> (il curriculum stampabile), <code>/contatti/</code> (il modulo, l'iPhone col tastierino, la carta dell'area operativa), <code>/stile/</code> (il sistema visivo in sei tavole, dal 2 novembre quello nuovo) e <code>/aragosta/</code> (l'hero com'era, su una tavola CAD), <code>/tempo/</code> ([[La macchina del tempo|la macchina del tempo]]: tutte le versioni del sito, una per giorno, dal 24 maggio 2026), <code>/cv/</code> (il curriculum stampabile, dal 3 novembre 2026 all'indirizzo corto; <code>/cv/?print</code> toglie testata e piè di pagina e apre da solo la finestra di stampa; <code>/studio/profilo/</code> resta col canonico su <code>/cv/</code>), <code>/stile/</code> (il sistema visivo su un piano con zoom), <code>/wrapped5BT/</code> ([[Wrapped 5BT]]), <code>/unimore/</code> (le materie e gli esercizi di informatica, dal 26 ottobre), <code>/crediti/</code>, <code>/privacy/</code>, <code>/cookie/</code>, <code>/email/</code> (il [[Il compositore email|compositore]], privato), e <code>/assistenza/</code> che rimanda a bettercallpekko.it.

== Le cose vive ==
Le [[Le mascotte|mascotte]] (la [[La chiocciola gigante africana|chiocciola]] e la [[La tartaruga di terra|tartaruga]] ai lati della firma nel piè di pagina; dal 2 novembre 2026 la chiocciola non sta più in testata), i [[I burattini|burattini]] di carta (airone, gazza, vespa), le [[Le figurine|figurine]], la luce di minio che insegue il puntatore e accende il bordo delle schede (<code>lume.js</code>, dal 2 novembre), l'[[L'aragosta e l'inchiostro|aragosta]] che riempie d'inchiostro «Pecchini» (tornata in home il 3 novembre, più piccola, e a grandezza naturale nella tavola <code>/aragosta/</code>) e i tasti «sasso» (fermi nel codice dal 2 novembre: testata e piè di pagina usano le pillole), il [[Il lettore DWG|lettore DWG]] scritto da zero con la scheda grafica che disegna le tavole in 3 ms, le [[Le catture|catture]] dei siti che si rifanno da sole, il modulo contatti che consegna con Resend e CallMeBot.

== Il vestito del 2 novembre 2026 ==
Alberto ha chiesto di impaginare il sito «tipo reflection.ai all'80% + anthropic al 20%», con caratteri nuovi («né i miei né i loro»), più animazioni «sensuali e pure» e sempre il suo minio. Dai CSS veri dei due siti: reflection.ai è carta calda <code>#f8f6f0</code> con sezioni scure <code>#0a0a0a</code>, bordi <code>#e5e5e5</code>, raggi fino a 1,5 rem e i caratteri NaN Serf; anthropic.com è avorio <code>#faf9f5</code>, argilla <code>#d97757</code>, Styrene e Tiempos. Ne è venuto: carta <code>#f8f6f0</code> e avorio delle schede, inchiostro <code>#0a0a0a</code> per footer, numeri e manifesto, angoli 0,75–1,75 rem, tasti a pillola (il primario in minio con l'inchiostro sopra), testata sottile di vetro, piè di pagina a colonne. I caratteri: '''Hanken Grotesk''' per i testi, '''Fraunces''' (leggero, misura ottica 144) per i titoli grandi, i numeri grandi e i corsivi, '''Geist Mono''' per etichette e terminale. Le animazioni: le rivelazioni arrivano sfocate e si mettono a fuoco (<code>filter: blur</code>, 1,1–1,6 s, easing «silk»), l'aurora di tre macchie dietro l'hero, il fascio di minio che percorre la linea sotto il terminale, la luce che segue il mouse (<code>.lume</code>, <code>mix-blend-mode: soft-light</code>) e il bordo delle schede che si accende dove passa, la fila dei siti online che scorre e si ferma col mouse, il manifesto che si avvicina scorrendo, il velo di luce sui tasti. Tutto spento con <code>prefers-reduced-motion</code>. Il 3 novembre il nome gigante è tornato (più piccolo) e l'hero vecchio è diventato la tavola <code>/aragosta/</code>. Lo stesso giorno Alberto ha mandato un campione di blu («riesci velocemente qualsiasi arancione/marrone farli di questo blu e altre tonalità?»): il minio <code>#e5481f</code> ha lasciato il posto al blu <code>#007acc</code> (profondo <code>#005c9e</code> come testo, acceso <code>#3b9ee8</code> sul fondo scuro, tenue <code>#cfe6f8</code>), le aurore e gli aloni sono azzurri, sul blu si scrive in bianco (4,5:1); i token tengono il nome <code>--c-minio</code>. Anche favicon, <code>og.png</code>, la guida <code>/stile/</code> e la tavola <code>/aragosta/</code>; restano rossi solo l'aragosta e i dettagli disegnati nelle figurine. E il GitHub di Alberto è <code>ygpzk</code> (il repository è <code>ygpzk/AP</code>). Il lavoro sta sul ramo <code>albertopecchini.it</code> ([[I rami del repository]], [[Rami per sito (memoria)|la memoria sui rami]]).

== I dati personali ==
Il titolo è «Diplomato geometra» (Geometra e Perito geometra sono titoli riservati agli iscritti all'albo); partita IVA e albo sono <code>null</code> e i template nascondono i blocchi; l'indirizzo completo compare solo nella privacy policy; le foto non hanno metadati EXIF e nelle foto di gruppo non si pubblicano persone riconoscibili.

== Pubblicazione ==
Progetto [[Vercel]] <code>albertopecchini.it</code>, Root Directory <code>albertopecchini.it</code>, ogni push su <code>main</code> in produzione; <code>albertopecchini.it</code> senza www rimanda a www con un 308. Esiste anche sull'[[L'indirizzo .onion|indirizzo .onion]], servito dal pc di Alberto. Il caso di studio del sito stesso è nel portfolio, con la pagina intera sull'iPhone 18 Pro a strisce; i case study di pzkko hanno il fun fact della [[La saracinesca di Bologna|saracinesca di Bologna]] e la sezione Tools con [[pzk$meeting]].

{{Vedi anche|Il repository AP|Gli strumenti di albertopecchini.it|Better Call Pekko|Pzkko.it|Vercel|Il credito nei siti dei clienti}}
[[Categoria:I siti di Alberto]]`,
  },

  'Better Call Pekko': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/src/templates/pages/assistenza.js', 'albertopecchini.it/src/data/assistenza.js', 'albertopecchini.it/api/bcp.js', 'albertopecchini.it/tools/assistenza/README.md', 'albertopecchini.it/public/bcp/robots.txt'],
    testo: `{{Infobox
| titolo = Better Call Pekko
| immagine = https://www.albertopecchini.it/media/assistenza/shot-bcp.webp
| didascalia = la home di bettercallpekko.it, il sito del 2008 di «the computer guy at law»
| dove = www.bettercallpekko.it (e /assistenza/ su albertopecchini.it)
| dal = 27 settembre 2026 (la pagina), 28 settembre (il progetto Vercel)
| lingua = inglese
| larghezza = 960 px fissi
| file = src/templates/pages/assistenza.js, src/data/assistenza.js, api/bcp.js
}}
'''Better Call Pekko''' è l'assistenza informatica di Alberto raccontata «come il sito americano del 2008 di un computer guy at law»: colonna blu coi tasti gialli, video di consulenza, annunci di aziende che non esistono, il profilo «About Pekko» in stile MySpace, il listino 2009, il forum phpBB, i telefonini e i provider del 2009, le donazioni PayPal, le e-card, i coupon, i commenti in stile SMS, la webcam coi filtri brutti, le colonne pubblicitarie ai lati, il pop-up d'ingresso. Tutto in inglese: «l'unica riga italiana è SI PARLA ITALIANO, che è la battuta». Qui Alberto si chiama [[Pekko]], e il nome vero resta solo nel credito del footer. Il nome rifà «Better Call Saul», la serie che Alberto racconta in /studio/ (tempo libero).

== Le pagine ==
La home (<code>/</code> su bettercallpekko.it, <code>/assistenza/</code> sul sito serio con canonical sul dominio e fuori dalla sitemap) e i contatti (<code>/contact/</code>, <code>/contatti/assistenza/</code>) con telefono, WhatsApp, email e un modulo che parla con <code>api/contatti.js</code> (<code>modulo: 'assistenza'</code>, voci in inglese per tipo di guaio e urgenza). Pagine '''autonome''' (<code>standalone</code> in <code>routes.js</code>): niente guscio del sito, stile e script in linea. Dal 29 settembre la sezione «Pekko makes websites» con Pekko Explorer 6 (un browser del 2008 con una scheda per sito vero e la cattura da scorrere), i banner dei siti, l'infografica del metodo, il webring e i bottoni 88×31; «DID U KNOW???» con fatti veri; il codice Konami (o cinque clic sulla tartaruga) per il segreto. Dal 18 ottobre pzkko.it è fra i siti di Pekko.

== Il progetto Vercel ==
Un secondo progetto dallo stesso repository, Root Directory <code>albertopecchini.it</code>, variabile <code>SITE=bcp</code>: la build produce solo la parodia alla radice, <code>404.html</code>, <code>robots.txt</code> e <code>sitemap.xml</code> da <code>public/bcp/</code> e, di <code>public/</code>, solo <code>media/assistenza/</code>, <code>media/web/</code>, le due mascotte e le icone. Nel piè di pagina c'è il distintivo di FrogDR col Domain Rating, solo nella build <code>SITE=bcp</code>. In locale <code>npm run dev:bcp</code> su :5181 col database in memoria.

== Le parti vive ==
Contavisite, persone online, like, condivisioni, sondaggio, classifica del gioco, forum, guestbook, shoutbox ed e-card sono veri: [[Il contatore di Better Call Pekko]], una funzione sola (<code>api/bcp.js</code>) con un documento JSON (<code>bcp/db.json</code>) sul [[Il server dei dati in casa|server in casa]] (su [[Vercel Blob]] fino al 28 ottobre). Le immagini: [[Le immagini di Better Call Pekko]].

{{Vedi anche|Pekko|Le immagini di Better Call Pekko|Il contatore di Better Call Pekko|albertopecchini.it|Vercel}}
[[Categoria:I siti di Alberto]]`,
  },

  'rivaltasulmincio.it': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/src/data/projects.js', 'albertopecchini.it/tools/catture/siti.js'],
    testo: `{{Infobox
| titolo = rivaltasulmincio.it
| immagine = https://www.albertopecchini.it/media/web/rivalta-desktop.webp
| didascalia = la home di rivaltasulmincio.it, catturata dal workflow
| dove = www.rivaltasulmincio.it
| repository = github.com/albertoxpecchini/rivaltasulmincio
| cliente = la Pro Loco di Rivalta sul Mincio
| nel portfolio = /portfolio/rivaltasulmincio-it/
}}
'''rivaltasulmincio.it''' è il sito della Pro Loco di [[Rivalta sul Mincio]], il paese di Alberto: «Promozione turistica, notizie e community del borgo nel Parco del Mincio», come dice la descrizione del repository su [[Il GitHub di Alberto|GitHub]]. È uno dei siti reali del portfolio di [[albertopecchini.it]] (la scheda nasce «dai dati del repo», 23 settembre 2026) e sta sul [[Il muro|muro]] di pzkko fra [[I siti in cima|i siti in cima]]. Su [[Better Call Pekko]] è il banner «184 PLACES. 1 VILLAGE. 0 TRACKERS.», con la mappa vera e gli spilli lucidi.

== Le catture ==
Il workflow [[Le catture dei siti (workflow)|delle catture]] lo fotografa come <code>rivalta-*</code>: la home nelle cinque viewport (desktop 1440×900, desktop intera, tablet 820×1180, mobile 390×844 a 2x, mobile intera), più la mappa su desktop e mobile con la scheda della chiesa e la scheda di un luogo su tablet. Il 17 e il 21 ottobre 2026 è cambiato (due giri di «Catture aggiornate: Rivalta sul Mincio»). Il piè di pagina ha il credito esatto a <code>https://www.albertopecchini.it</code>: [[Il credito nei siti dei clienti]].

{{Vedi anche|Rivalta sul Mincio|Le catture|Il credito nei siti dei clienti|cascinafontana.xyz|Ing. Dario Donelli}}
[[Categoria:I siti di Alberto]]`,
  },

  'cascinafontana.xyz': {
    data: '2026-09-27',
    fonti: ['albertopecchini.it/src/data/projects.js', 'albertopecchini.it/tools/catture/siti.js', 'albertopecchini.it/config/sender-profiles.json'],
    testo: `{{Infobox
| titolo = cascinafontana.xyz
| immagine = https://www.albertopecchini.it/media/web/cascina-desktop.webp
| didascalia = la home di cascinafontana.xyz
| dove = www.cascinafontana.xyz
| repository = github.com/albertoxpecchini/cascinafontana
| cliente = Società Agricola Cascina Fontana S.S., la famiglia di Alberto
| nel portfolio = /portfolio/cascina-fontana/
}}
'''cascinafontana.xyz''' è il sito dell'azienda agricola di famiglia (Società Agricola Cascina Fontana S.S., di Primo Pecchini): uno dei tre siti dei clienti nel portfolio di [[albertopecchini.it]], la cui scheda è stata ricavata dai dati del suo repository il 24 settembre 2026. Il repository su GitHub ha avuto l'ultimo push il 27 settembre 2026. Su [[Better Call Pekko]] è il banner «Hay! This website has 0 cookies», kraft e polaroid del 2012; sul muro di pzkko il volantino con il titolo in Shrikhand «bruciato» (<code>t-tondo</code>).

== Intorno al sito ==
Il [[Il generatore di email|generatore di email]] ha due caselle della società, <code>proton</code> (pecchini@protonmail.com) e <code>pec</code> (cascinafontana@pec.it), con le firme a versioni e i loghi (la vespa sulla fontana, con lo zampillo disegnato in vettoriale; il calabrone gigante giapponese della versione archiviata). Le catture (<code>cascina-*</code>) comprendono la home, Prodotti, la galleria con la lightbox e Contatti sul telefono.

{{Vedi anche|rivaltasulmincio.it|Ing. Dario Donelli|Il generatore di email|Il credito nei siti dei clienti}}
[[Categoria:I siti di Alberto]]`,
  },

  'Ing. Dario Donelli': {
    data: '2026-10-08',
    fonti: ['albertopecchini.it/src/data/projects.js', 'albertopecchini.it/tools/catture/siti.js'],
    testo: `{{Infobox
| titolo = Ing. Dario Donelli
| immagine = https://www.albertopecchini.it/media/web/dd-desktop.webp
| didascalia = la home del sito dell'ingegnere
| dove = dariodonelli.vercel.app (finché dariodonelli.it non è attivo)
| repository = github.com/albertoxpecchini/dariodonelli-
| nel portfolio = /portfolio/dario-donelli/
}}
'''Ing. Dario Donelli''' è il sito dell'ingegnere, il terzo dei siti dei clienti nel portfolio di [[albertopecchini.it]]: sta ancora sul dominio Vercel «finché dariodonelli.it non è attivo» (l'indirizzo viene da <code>web.url</code> in <code>src/data/projects.js</code>: «quando Donelli passerà al suo dominio basta cambiarlo lì»). La scheda è nata dai dati del repository il 23 settembre 2026; l'ultimo push sul repository è dell'8 ottobre 2026.

Sul [[Il muro|muro]] di pzkko il suo volantino non è un link («presto online»: aspetta il suo dominio). Su [[Better Call Pekko]] è «Serious engineer. Serious website.», targa in bianco e nero e post-it di Pekko. Le catture <code>dd-*</code> sono le cinque della home.

{{Vedi anche|rivaltasulmincio.it|cascinafontana.xyz|Il credito nei siti dei clienti|I siti in cima}}
[[Categoria:I siti di Alberto]]`,
  },

  'Il credito nei siti dei clienti': {
    data: '2026-10-31',
    fonti: ['CLAUDE.md', 'albertopecchini.it/tools/controllo/controllo.mjs'],
    testo: `'''Il credito nei siti dei clienti''' è la prima regola di [[CLAUDE.md]]: ogni sito realizzato da Alberto ([[rivaltasulmincio.it]], [[cascinafontana.xyz]], [[Ing. Dario Donelli]] «e i prossimi») firma il piè di pagina di tutte le pagine con un link '''esattamente''' a <code>https://www.albertopecchini.it</code>: https, www, senza slash finale. Mai il dominio senza www né indirizzi <code>*.vercel.app</code>. Il testo visibile è il nome «Alberto Pecchini», non il dominio.

Lo controlla [[Il controllo delle pagine|tools/controllo]] su ogni pagina della build (anche di Better Call Pekko), e sull'[[L'indirizzo .onion|onion]] il credito resta assoluto mentre gli altri link interni diventano relativi. Fa eccezione solo il [[Il compositore email|compositore email]], che è uno strumento privato. Su [[Pzkko.it]] il credito è stato tolto dalla home e dalla 404 il 9 ottobre 2026 su richiesta di Alberto («è il suo sito»): i giochi e le pagine della barra lo portano ancora («un pezzo di pzkko · fatto da Alberto Pecchini»).

{{Vedi anche|CLAUDE.md|Il controllo delle pagine|albertopecchini.it}}
[[Categoria:I siti di Alberto]]`,
  },

  'Gli strumenti di albertopecchini.it': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/README.md', 'albertopecchini.it/tools/replicate.mjs', 'albertopecchini.it/tools/scontorna.mjs'],
    testo: `'''Gli strumenti di albertopecchini.it''' stanno in <code>albertopecchini.it/tools/</code>: script Node (e un po' di Python) che fanno le immagini, le catture, le email, i PDF e i controlli del sito. Quasi tutti hanno un README e una cartella <code>lavoro/</code> esclusa da Git (i fogli pagati, le candidate, le foto di prova). Quelli di pzkko stanno in <code>tools/pzkko/</code>: [[Gli strumenti di pzkko]].

{| class="wikitable"
! cartella !! cosa fa !! voce
|-
| <code>replicate.mjs</code> || il client di [[Replicate]] in comune: token in <code>.env.local</code>, riprova i 429 || [[Replicate]]
|-
| <code>scontorna.mjs</code> || toglie il fondo a una foto con bria/remove-background usando solo la maschera, rifinisce i capelli || [[bria/remove-background]]
|-
| <code>copertine/</code> || copertine e viste illustrate dei progetti non web, gpt-image-2 || [[Le copertine]]
|-
| <code>figurine/</code> || nove figurine per foglio, le sagome dei tasti, le mini immagini del piè di pagina, gli adesivi dell'hero || [[Le figurine]]
|-
| <code>mascotte/</code> || la chiocciola e la tartaruga, i burattini a pezzi || [[Le mascotte]], [[I burattini]]
|-
| <code>aragosta/</code> || l'aragosta di fiume della home, intera e in pezzi || [[L'aragosta e l'inchiostro]]
|-
| <code>cartina/</code> || il fondo illustrato della carta dell'area operativa di /contatti/ || [[La cartina]]
|-
| <code>catture/</code> || le catture dei siti, rifatte da sole || [[Le catture]]
|-
| <code>controllo/</code> || il controllo delle pagine della build || [[Il controllo delle pagine]]
|-
| <code>email-generator/</code> || appunti → email HTML || [[Il generatore di email]]
|-
| <code>lezioni/</code> || le lezioni su Teams registrate, trascritte, in appunti PDF || [[Lezioni (strumento)]]
|-
| <code>nota/</code> || le «note» di fine stagione in PDF A4 || [[La nota in PDF]]
|-
| <code>og/</code> || rigenera <code>public/og.png</code> || [[L'anteprima og]]
|-
| <code>onion/</code> || l'indirizzo .onion servito dal pc || [[L'indirizzo .onion]]
|-
| <code>tavole/</code> || tavole da PDF → SVG, riservatezza, pulizia dei PDF || [[Le tavole]]
|-
| <code>wrapped/</code> || l'analizzatore della chat dietro /wrapped5BT/ || [[Wrapped 5BT]]
|-
| <code>assistenza/</code> || ingredienti e annunci di Better Call Pekko || [[Le immagini di Better Call Pekko]]
|-
| <code>bcp/</code> || legge il contatore di Better Call Pekko senza sporcarlo || [[Il contatore di Better Call Pekko]]
|-
| <code>online.mjs</code> || i tre dev server insieme col tunnel «pzkko» di Microsoft dev tunnels (<code>npm run online</code>) || —
|-
| <code>dev.mjs</code> || i dev server di bcp (:5181) e pzkko (:5182) || [[In locale (pzkko)]]
|}

Le immagini nascono quasi tutte da [[gpt-image-2]] su Replicate e dal 30 settembre 2026 su un fondo magenta tolto con la chiave cromatica (<code>tools/mascotte/immagine.mjs</code>), perché il modello non accetta più il fondo trasparente. Le cartelle <code>lavoro/</code> di copertine, figurine, mascotte e cartina sono state archiviate il 29 settembre 2026 fuori dal repository, in <code>Documents\\AP-archivio\\lavoro-2026-09-29\\</code> ([[I file fuori dal repository]]).

{{Vedi anche|Gli strumenti di pzkko|albertopecchini.it|Replicate|gpt-image-2}}
[[Categoria:Gli strumenti]]`,
  },

  'Le catture': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/catture/catture.mjs', 'albertopecchini.it/tools/catture/siti.js', 'albertopecchini.it/tools/catture/README.md', 'albertopecchini.it/src/data/catture.js'],
    testo: `{{Infobox
| titolo = Le catture
| immagine = https://www.albertopecchini.it/media/web/pzk-notte-desktop.webp
| didascalia = pzkko.it di notte (?ora=22:00&notte=1), una delle catture
| dove = albertopecchini.it/tools/catture/
| dal = 26 settembre 2026
| comando = node tools/catture/catture.mjs [--controlla] [--forza sito…]
| scrive = public/media/web/*.webp, src/data/catture.js
| serve = puppeteer-core e sharp (npm install --prefix tools/catture), un Chromium
}}
'''Le catture''' sono le immagini dei siti che il portfolio mostra nei mockup di MacBook, iPad e iPhone, nelle gallerie delle pagine interne e nelle strisce dell'iPhone 18 Pro, in <code>public/media/web/</code>. Lo strumento <code>tools/catture</code> le rifà quando un sito cambia, da solo, dentro il workflow [[Le catture dei siti (workflow)|Catture dei siti]].

== I siti ==
{| class="wikitable"
! progetto !! sito !! file
|-
| <code>rivaltasulmincio-it</code> || www.rivaltasulmincio.it || <code>rivalta-*</code>: home, mappa desktop e mobile con la scheda della chiesa, scheda del luogo su tablet
|-
| <code>cascina-fontana</code> || www.cascinafontana.xyz || <code>cascina-*</code>: home, Prodotti, galleria con la lightbox, Contatti
|-
| <code>albertopecchini-it</code> || www.albertopecchini.it || <code>ap-*</code>: home e <code>ap-iphone-NN</code>, la pagina intera a strisce (sei, 804×4652)
|-
| <code>dario-donelli</code> || dariodonelli.vercel.app || <code>dd-*</code>: home
|-
| <code>pzkko-it</code> || www.pzkko.it || <code>pzk-*</code>: la home di giorno (<code>?ora=12:00&notte=0</code>), la stessa di notte (<code>?ora=22:00&notte=1</code>), la roulette aperta su tablet, la 404 sul telefono; la finestra è la scena 3D aspettata finché è pronta, le pagine intere il muro senza 3D (<code>?muro=1</code>)
|}

== I formati ==
Cinque per la home: <code>desktop</code> 1440×900 → 1200×750, <code>desktopTall</code> pagina intera tagliata a 3400 px → 1200×2833, <code>tablet</code> 820×1180 → 720×1036, <code>mobile</code> 390×844 a 2x → 600×1298, <code>mobileTall</code> → 600×4000; l'iPhone 402×812 a 2x a strisce di al più 2400 px CSS, perché oltre 16.384 px Chromium ripete i pezzi di pagina.

== Come funziona ==
# '''Controllo''': l'impronta dell'HTML delle pagine da fotografare; i siti sono fatti con Vite, quindi ogni deploy che cambia qualcosa cambia l'HTML.
# '''Catture''': Chromium headless con <code>prefers-reduced-motion</code> emulato, animazioni ferme, la pagina fatta scorrere fino in fondo perché reveal e immagini pigre partano, attesa di immagini, font e tessere delle mappe; prima della home di albertopecchini.it clicca <code>[data-hero-go="0"]</code> (il primo comando del terminale deve restare quello).
# '''Confronto''': ogni cattura, convertita in WebP con sharp, si confronta pixel per pixel col file che c'è: se non si vede differenza il file resta, così niente commit inutili.
# '''Manifesto''': <code>src/data/catture.js</code> (generato) con misure e versione; <code>shot()</code> in <code>projects.js</code> aggiunge <code>?v=&lt;impronta&gt;</code> così i browser non mostrano la copia vecchia (su <code>/media/</code> la cache è di trenta giorni).

pzkko.it e la scena 3D (22 ottobre): le catture della finestra si fanno senza <code>captureBeyondViewport</code> (la tela WebGL usciva nera) e a un'ora fissa (<code>?ora=12:00</code>: col solo <code>?notte=0</code> il giro della sera fotografava una notte con le luci spente). «Prima le catture di pzkko fallivano o venivano nere da giorni». Su GitHub la scena 3D gira in software.

== In locale ==
<code>npm install --prefix tools/catture</code>, poi <code>--controlla</code>, <code>--forza rivalta</code>, <code>--prova ../prova ap</code> (scrive altrove), <code>--manifesto</code>. Il browser è <code>CHROME_PATH</code>, se no il Chromium di Playwright, Chrome o Edge; lo stato locale è <code>tools/catture/stato.json</code>, ignorato da git. Le catture fatte su Windows e quelle della CI differiscono di poco nel disegno dei caratteri: «la versione pubblicata è quella della CI». Per aggiungere un sito o una cattura si tocca <code>siti.js</code>: <code>casa(prefisso)</code> dà le cinque della home, le altre indicano <code>file</code>, <code>percorso</code>, <code>formato</code>, un <code>viewport</code> e una funzione <code>prima(page)</code>. Lo stesso puppeteer-core lo usano gli strumenti di pzkko ([[Gli strumenti di pzkko]], <code>tools/pzkko/browser.mjs</code>) e questa wiki per le sue foto.

{{Vedi anche|Le catture dei siti (workflow)|Gli strumenti di albertopecchini.it|Pzkko.it|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Le copertine': {
    data: '2026-09-29',
    fonti: ['albertopecchini.it/tools/copertine/genera.mjs', 'albertopecchini.it/tools/copertine/copertine.js', 'albertopecchini.it/tools/copertine/README.md'],
    testo: `{{Infobox
| titolo = Le copertine
| dove = albertopecchini.it/tools/copertine/
| modello = openai/gpt-image-2 su Replicate, qualità high
| comando = node tools/copertine/genera.mjs <slug> --n 2 · usa · vista · recupera
| scrive = public/media/progetti/<slug>/copertina.webp (1920×1280), vista-NN.webp (1600 px), vista-NN-full.webp
}}
'''Le copertine''' sono le illustrazioni in assonometria dei progetti non web del portfolio di [[albertopecchini.it]]: il sito non mostra i documenti dei progetti come miniatura, ogni lavoro ha una copertina e tre '''viste''' nella galleria del case study, disegnate da [[gpt-image-2]] con le tavole (o, per il museo, le fotografie) come riferimento. Le tavole vere restano nei dati, accese da <code>showSheets</code> ([[Le tavole]]).

== Come si fa ==
<code>copertine.js</code> ha lo stile comune (<code>STILE</code>) e, per ogni progetto, soggetto, tavole di riferimento e testo alternativo, poi <code>STILI</code> e <code>viste</code>. <code>genera.mjs &lt;slug&gt; --n 2</code> fa due candidate high («~0,26 $ in tutto»), <code>usa</code> prepara quella scelta: allarga la tela di un ottavo per lato col colore della carta, sfuma il bordo e bilancia i colori perché la carta sia esattamente <code>--c-paper</code> (<code>#f3f1ec</code>), così la copertina si fonde con la pagina; le copertine si ritagliano a 4:3 (card) e 16:9 (testata). Le viste hanno tre linguaggi: <code>scena</code> (inquadratura piena), <code>blocco</code> (un oggetto che galleggia sulla carta), <code>oggetti</code> (una tavola da catalogo). In <code>projects.js</code>: <code>drawnCover(slug, alt)</code> e <code>drawnView(SLUG, 'NN', alt, didascalia)</code>. Una voce può non essere un progetto: <code>informatica</code> è l'illustrazione dell'area D dei servizi.

Sotto i 10 $ di credito [[Replicate]] accetta al massimo 5 predizioni in un colpo; <code>recupera &lt;slug&gt; &lt;id&gt;</code> scarica una predizione già pagata se l'attesa si interrompe. I costi sono quelli del 25 settembre 2026 per 1536×1024.

{{Vedi anche|Le figurine|gpt-image-2|Replicate|Gli strumenti di albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Le figurine': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/tools/figurine/figurine.mjs', 'albertopecchini.it/tools/figurine/fogli.js', 'albertopecchini.it/src/data/figurine.js'],
    testo: `'''Le figurine''' sono le piccole illustrazioni scontornate di [[albertopecchini.it]]: accompagnano i servizi, le fasi del metodo, i lavori trasversali, gli strumenti dello studio, le parti sul web, i contatti e la 404, con «un bordo chiaro sagomato: sulla carta non si vede, sul fondo scuro le fa sembrare adesivi».

== Un'immagine, nove illustrazioni ==
Ogni '''foglio''' è una sola immagine di [[gpt-image-2]] (2048×2048, qualità high, «sempre: è una scelta di Alberto»): nove figurine in una griglia 3×3 che <code>figurine.mjs ritaglia</code> separa raggruppando i pixel pieni in blocchi connessi, ognuno assegnato alla cella in cui cade il suo baricentro (così un raggio o una graffetta staccata resta con la sua figurina, le briciole si scartano). Dal 30 settembre 2026 il foglio si chiede su un fondo magenta pieno, tolto con la chiave cromatica. I fogli in <code>fogli.js</code>: tecnico, digitale, grafica, informatica, informatica2, metodo, computer, chrome, chrome2, tasti, hero. Le figurine finiscono in <code>public/media/figurine/</code> (WebP, lato lungo al massimo 440 px) e le misure in <code>src/data/figurine.js</code>, generato; <code>figurina(nome)</code> in <code>ui.js</code> le disegna, e un nome senza file non disegna nulla.

Dallo stesso strumento vengono le '''sagome dei tasti «sasso»''' (<code>tasto-*.webp</code>, foglio <code>tasti</code>, senza bordo adesivo, ritagli fino a 960 px), le '''mini immagini del piè di pagina''' (<code>chrome-*.webp</code>: busta, telefono, mappa, calendario, macchina fotografica, scatola del codice, cartello «torna su», lucchetto, quadro; dal foglio <code>chrome2</code> il biscotto dei cookie e il ventaglio dei campioni dello stile) e gli '''adesivi dell'hero''' (<code>hero-*.webp</code>: uno per comando del terminale, tutto, casa, sito, marchio, pc; <code>hero-email</code> e <code>hero-online</code>). Le figurine sono decorative (<code>alt=""</code>).

{{Vedi anche|Le copertine|Le mascotte|gpt-image-2|Gli strumenti di albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Le mascotte': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/tools/mascotte/mascotte.mjs', 'albertopecchini.it/tools/mascotte/mascotte.js', 'albertopecchini.it/src/data/mascotte.js', 'albertopecchini.it/src/client/mascot.js'],
    testo: `'''Le mascotte''' di [[albertopecchini.it]] sono la [[La chiocciola gigante africana|chiocciola gigante africana]], l'animale di Alberto, e la [[La tartaruga di terra|tartaruga di terra]] col casco da cantiere, ai lati della firma nel piè di pagina: la chiocciola come burattino, la tartaruga intera. La tartaruga è tornata il 3 novembre 2026, la stessa del 27 settembre, al posto della [[La nutria|nutria golosa]] che c'era stata dal 18 ottobre; intera compare anche in [[Better Call Pekko]].

== Gli occhi del sito ==
Sono due immagini di [[gpt-image-2]] (1536×1024, high) in <code>public/media/mascotte/</code> (<code>lumaca.webp</code>, <code>tartaruga.webp</code>). Il modello disegna gli occhi bianchi e tondi; <code>mascotte.mjs usa</code> pulisce la trasparenza, rifila, cerca gli occhi come macchie bianche quasi circolari, campiona il colore della pelle intorno per la palpebra e scrive <code>src/data/mascotte.js</code>; il naso si segna a mano (per la chiocciola il muso sotto i peduncoli). Sopra l'immagine <code>mascot(nome, { crop })</code> in <code>ui.js</code> mette gli occhi del sito (disco bianco, pupilla, palpebra) e <code>src/client/mascot.js</code> li muove: ogni pupilla segue il puntatore per conto suo, sul naso gli occhi si incrociano e la mascotte vibra, ogni tanto sbattono, senza puntatore si guardano intorno. Con <code>prefers-reduced-motion</code> restano il solo inseguimento e niente battiti. Il ritaglio della testata è <code>HEAD_CROP</code> in <code>layout.js</code>.

Da qui vengono anche [[I burattini]] (<code>burattini.mjs</code>) e la chiave cromatica del magenta (<code>immagine.mjs</code>), usata da tutti gli strumenti che disegnano. Costo del 30 settembre 2026: sei predizioni high; il 18 ottobre altre due per la nutria.

{{Vedi anche|I burattini|La chiocciola gigante africana|La tartaruga di terra|Le figurine}}
[[Categoria:Gli strumenti]]`,
  },

  'I burattini': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/tools/mascotte/burattini.mjs', 'albertopecchini.it/tools/mascotte/burattini.js', 'albertopecchini.it/src/data/burattini.js', 'albertopecchini.it/src/client/puppet.js'],
    testo: `'''I burattini''' sono gli animali di carta del piè di pagina di [[albertopecchini.it]]: pezzi separati uniti da fermacampioni, che il sito rimonta e muove su molle. L''''airone elegante''' (a sinistra: corpo con lo zaino da geometra, collo col papillon, testa, ala, due zampe), la '''gazza furbissima''' (a destra: testa con la chiave rubata, ala, coda, due zampe), la '''vespa cattiva ma precisa''' (si libra sopra la firma: torace, testa, addome col pungiglione, due ali, due antenne), la '''chiocciola''' smontata dalla mascotte (corpo, guscio, due peduncoli, stazione totale) e la '''nutria''' (dal 18 ottobre 2026, in otto pezzi: testa coi due incisivi al minio, mascella che si apre, braccio con l'erba in mano, zampa, coda, cespo).

== Due passaggi ==
Per ogni animale [[gpt-image-2]] disegna prima l''''intero''' (1536×1024, con la chiocciola come riferimento di stile) e poi i '''pezzi''' (2048×2048, con l'intero come riferimento): ogni pezzo che si muove ha una linguetta con un fermacampioni dorato, il perno. <code>burattini-usa.mjs</code> separa i pezzi, trova in ognuno il fermacampioni (macchia dorata quasi tonda) e nella testa gli occhi, e scrive <code>src/data/burattini-pezzi.js</code>; il montaggio (genitore, punto d'attacco, davanti/dietro, angolo a riposo, escursione, rigidità della molla) si scrive a mano in <code>src/data/burattini.js</code>, con una griglia disegnata da ffmpeg per trovare <code>at</code>. <code>puppet(nome)</code> in <code>ui.js</code> annida i pezzi e <code>src/client/puppet.js</code> li muove: collo, testa e pungiglione si voltano verso il puntatore; zampe, ali, code e antenne si tirano col mouse o col dito e ricadono oscillando.

== Il carattere ==
L'airone, toccato, fa l'inchino; la gazza muove la testa a scatti, gira il becco con la chiave se ti avvicini e, toccata, fa l'occhiolino; la vespa punta il pungiglione dove sei, si arrabbia se ti avvicini e, toccata, punge; Dal 18 ottobre al 2 novembre 2026 c'è stata anche [[La nutria|la nutria]], che mangiava l'erba dal cespo; il 3 novembre al suo posto è tornata [[La tartaruga di terra|la tartaruga]], come mascotte intera e non come burattino. L'[[L'aragosta e l'inchiostro|aragosta]] della home è un burattino con un montaggio suo.

{{Vedi anche|Le mascotte|L'aragosta e l'inchiostro|La tartaruga di terra|La chiocciola gigante africana}}
[[Categoria:Gli strumenti]]`,
  },

  'L\'aragosta e l\'inchiostro': {
    data: '2026-11-03',
    fonti: ['albertopecchini.it/tools/aragosta/aragosta.mjs', 'albertopecchini.it/tools/aragosta/aragosta.js', 'albertopecchini.it/src/data/aragosta.js', 'albertopecchini.it/src/client/ink.js', 'albertopecchini.it/src/templates/pages/aragosta.js', 'albertopecchini.it/src/styles/aragosta.css'],
    testo: `'''L'aragosta e l'inchiostro''' è la scena della prima schermata della home di [[albertopecchini.it]] — e, dal 3 novembre 2026, anche la pagina <code>/aragosta/</code>: col vestito nuovo del sito Alberto ha chiesto «nome gigante anche più piccolo ma ci deve essere» e «aragosta e inchiostro in stile vecchio (crea pagina che sia visualizzabile come su autocad)». Così in home il nome è tornato sotto le pillole, in Archivo com'era ma a poco più della metà della larghezza, con l'aragosta che dorme sulla pillola «disponibile»; e <code>/aragosta/</code> è una tavola 1440 × 900 sul piano navigabile di <code>/stile/</code> (zoom, spostamento, tasti) con l'hero com'era fino al 2 novembre — saluto, nome a tutta larghezza, luogo comune sbarrato, timbro «falso», invito — coi caratteri e i colori di allora, i crocini di registro agli angoli e un cartiglio da foglio CAD al posto del terminale (<code>src/templates/pages/aragosta.js</code>, <code>src/styles/aragosta.css</code>, che è il vecchio <code>home.css</code> con le classi <code>.hv</code>). La scena: un''''aragosta di fiume''' rossa (il gambero rosso del Mincio) dorme sopra «Disponibile per nuovi incarichi» con il suo annaffiatoio azzurro accanto. Quando il visitatore sta fermo per poco più di due secondi si sveglia di colpo (salto, colpo di coda, «!») e versa inchiostro nella prima i di «Pecchini»: in meno di tre secondi il cognome è pieno. Dopo cinque secondi comincia a perdere, goccia a goccia, e l'aragosta torna a versare, all'infinito; una volta riempito non scende mai sotto la metà. Con «riduci movimento» dorme e basta.

== Il liquido ==
È simulato davvero (<code>Liquid</code> in <code>src/client/ink.js</code>): acqua bassa su una griglia di colonne, 1 px = 1 mm e g = 9,8 m/s², flussi conservativi; fa onde, sciaborda quando si scorre la pagina (l'accelerazione dello scroll lo spinge di lato) e quando il puntatore ci passa sopra. Tutto sta in un SVG sopra l'hero: il contorno del cognome è un <code>&lt;text&gt;</code> con lo stesso carattere dell'HTML (che nasconde il proprio), il liquido è ritagliato dalla stessa parola. Il 20 ottobre 2026 l'inchiostro è passato su canvas (<code>perf(home)</code>). Le aste delle lettere vengono dalla tabella <code>STEM</code>, misurate sul carattere a larghezza 86 %, e ogni goccia nasce dal fondo della sua lettera. In locale <code>window.__ink</code> dice stato e livello; <code>__ink.go('versa')</code> salta a uno stato.

== L'aragosta ==
Un burattino di carta come quelli del piè di pagina, due passaggi di [[gpt-image-2]] in qualità high (l'intero il 30 settembre 2026, scelto <code>20260930-223947-2.png</code>; i pezzi: corpo con occhi e zampette, coda, chela che tiene il manico, chela grande, annaffiatoio, due antenne montate specchiate). <code>src/data/aragosta.js</code> ha, a mano, il montaggio, l'ordine di disegno, il beccuccio e le pose (dorme, sveglia, versa, guarda); <code>scale</code> riporta i pezzi in scala col corpo, perché «le chele e l'annaffiatoio vengono più grandi che nell'intero». Occhi, palpebre, il getto (una parabola dal beccuccio all'apertura della I) e le gocce li disegna il codice. Anche in <code>/stile/</code>, nella tavola «Mascotte e burattini», c'è una scena sua a 160 px. Costo del 1° ottobre 2026: due predizioni high.

{{Vedi anche|I burattini|Le mascotte|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'La macchina del tempo': {
    data: '2026-11-03',
    fonti: ['albertopecchini.it/tools/tempo/tempo.mjs', 'albertopecchini.it/tools/tempo/siti.mjs', 'albertopecchini.it/tools/tempo/giro.mjs', 'albertopecchini.it/tools/tempo/scarica.mjs', 'albertopecchini.it/tools/tempo/cruscotto.mjs', 'albertopecchini.it/tools/tempo/cruscotto.ps1', 'albertopecchini.it/tools/tempo/diretta.mjs', 'albertopecchini.it/tools/tempo/prova.mjs', 'albertopecchini.it/tools/tempo/istantanea.mjs', 'albertopecchini.it/tools/tempo/confronta.mjs', 'albertopecchini.it/tools/tempo/README.md', 'albertopecchini.it/src/templates/pages/tempo.js', 'albertopecchini.it/src/templates/pages/tempo-pezzi.js', 'albertopecchini.it/src/client/tempo.js', 'albertopecchini.it/src/styles/tempo.css', 'albertopecchini.it/src/data/tempo.js', 'albertopecchini.it/src/templates/routes.js'],
    testo: `'''La macchina del tempo''' è la pagina <code>/tempo/</code> di [[albertopecchini.it]]: una copia della Wayback Machine di Internet Archive con dentro tutte le versioni dei siti di Alberto, una per giorno di lavoro. Nata il 3 novembre 2026 per il solo albertopecchini.it («fai proprio una copia di Wayback Machine (Internet Archive), niente altri strumenti, metti la barra sopra e l'istogramma in base ai commit di github»), lo stesso giorno è diventata l'archivio di cinque siti: «fai anche tutti i commit di cascina fontana e rivalta sul mincio con stesse funzioni attuali e senza bug + anche pzk e bcp che sono dentro al repo AP», con «la barra in alto con un selettore del repo» e «più statistiche nel commit», ripercorrendo «i momenti di quando committavo senza violare la mia privacy».

== I siti ==
* [[albertopecchini.it]]: il repository AP fuori pzkko e Better Call Pekko, dal 24 maggio 2026 («Add files from Figma Make»), 108 giorni.
* [[rivaltasulmincio.it]]: il repository rivaltasulmincio, la storia di main, dal 9 maggio 2026, 50 giorni: il server Node con le parti incluse di maggio, Bootstrap Italia, la manutenzione di giugno, il «dossier» verde di agosto, l'atlante marrone d'autunno.
* [[cascinafontana.xyz]]: il repository cascinafontana, tutti i rami (main ricomincia da zero il 16 luglio 2026, aprile e maggio stanno sui rami di allora), dal 16 aprile 2026, 22 giorni.
* pzkko.it: la cartella <code>albertopecchini.it/pzkko</code> così com'è, dal 7 ottobre 2026, 17 giorni, con la scena 3D fotografata sulla GPU vera.
* [[Better Call Pekko]]: lo stesso Vite del sito con <code>SITE=bcp</code>, dal 28 settembre 2026. Il 18 ottobre la build non passava nemmeno su Vercel (mancava <code>media/mascotte/tartaruga.webp</code>) e la pagina lo dice.

== Com'è fatta ==
Senza testata né piè di pagina del sito: la barra grigia in cima, in Arial come l'originale, è il guscio. Dentro: il marchio («ARCHIVIO DI ALBERTO · Macchina del tempo»), il '''selettore del sito''' al posto del campo dell'indirizzo (l'indirizzo e quante catture) col tasto «Oggi» che apre il sito com'è adesso, «Salvata N volte tra … e …» col totale dei commit e il repository su GitHub, l'istogramma con una barra per giorno alta quanti commit (passandoci sopra, l'anteprima del primo schermo con la data e le righe, come il calendario della Wayback Machine), le frecce ◀ ▶ con le date intorno alla cattura corrente. Sotto, «Questa cattura»: lo sha e il messaggio del commit e le statistiche del giorno in fila (righe aggiunte e tolte, file, commit e ore del primo e dell'ultimo, giorno di lavoro e giorni di fila, quanti con un assistente, pagine e peso del sito). Il tasto «Momenti» apre il giorno su un righello di 24 ore, un puntino per commit, coi commit uno per uno, e tutto il sito: la griglia settimana × ora e i fatti (la serie più lunga, il giorno più intenso, la giornata più lunga, l'ora e il giorno preferiti, di notte, il più tardi, il più mattiniero, il fine settimana, gli assistenti). Sotto la barra la foto della pagina com'era, a tutta larghezza (960 px sul computer, 390 sul telefono).

== Pagine leggere, un indirizzo per cattura ==
La sera stessa, in chiamata con Gabry, che la vedeva caricare piano: l'iframe scaricava dal server di casa, attraverso [[Il tunnel Tailscale]], il sito intero di quel giorno (decine di MB per Rivalta o Cascina). Alberto: «fai che gli altri vedano l'html leggero con solo le foto e non che debba scaricare il repo intero ogni volta, un html semplice leggibile con percorso completo e univoco». Ora ogni cattura è una pagina statica di Vercel con il suo indirizzo, <code>/tempo/&lt;sito&gt;/AAAA-MM-GG/</code> (per esempio <code>/tempo/rivaltasulmincio.it/2026-05-13/</code>), con la barra, le statistiche e i momenti già scritti nell'HTML e la foto: una decina di richieste e circa 350 KB, quasi tutti della foto, invece di decine di MB. <code>/tempo/</code> è l'archivio dei cinque siti, <code>/tempo/&lt;sito&gt;/</code> l'elenco di tutte le catture mese per mese con le anteprime; le barre dell'istogramma e le frecce sono link veri, i tasti ← → vanno alla cattura prima e dopo, i vecchi indirizzi con <code>#v=&lt;sha&gt;</code> portano alla pagina giusta. Le pagine delle catture sono fuori dalla sitemap e dai motori, perché le versioni vecchie dei siti dei clienti non finiscano nelle ricerche, e non precaricano i font del sito (la barra è in Arial).

== Le istantanee ==
Poco dopo: «ma non foto, voglio sempre l'html ma non un repo intero, solo un index indipendente, super ottimizzato». Sotto la barra adesso c'è '''l'istantanea''' di quel giorno: la home in un solo <code>index.html</code>, a <code>/tempo/&lt;sito&gt;/AAAA-MM-GG/pagina/</code>, fatta da <code>tools/tempo/istantanea.mjs</code>. Apre la versione depositata come la vede il pubblico, la fa scorrere fino in fondo e congela il DOM già disegnato: niente JavaScript, il CSS dentro il file potato alle regole che toccano qualcosa che c'è, le immagini ridotte alla misura a cui si vedevano e in WebP (subito solo quelle della prima finestra), i font tagliati ai soli caratteri della pagina e scritti in WOFF2, mappe, video e tele 3D al posto loro come immagini, i link alle altre pagine verso il sito intero sul server di casa. Immagini e font stanno una volta sola in <code>public/media/tempo/risorse/</code>, condivisi fra le catture. Rivalta del 13 maggio era 10,9 MB al primo caricamento con la prima prova, 806 KB dopo; Cascina di aprile 41 KB. Le foto restano solo come riserva e per le anteprime.

'''Il sito intero''' di quel giorno resta un link («il sito intero di allora ↗»): servito da <code>C:\\pzkko-server\\tempo\\server.mjs</code> (127.0.0.1:8789, fuori col tunnel sul percorso <code>/tempo</code>), navigabile, per chi lo vuole.

== Come si ricostruiscono le versioni ==
<code>tools/tempo/giro.mjs</code>, nell'ordine chiesto da Alberto («prima tutti i commit scaricati in locale e per ultimo le foto anteprime fatte bene»): <code>scarica.mjs</code> scarica la storia intera dei repository (copie mirror di Rivalta e Cascina in <code>tools/tempo/lavoro/repo</code>), poi <code>tempo.mjs</code> ricostruisce e deposita le versioni di tutti i siti insieme, un processo per sito, e solo alla fine fa le foto, dal deposito, come le vede il pubblico; chiude <code>prova.mjs</code>. Un giorno si ricostruisce in tre modi secondo com'era il sito: '''build''' (<code>npm ci</code> e <code>npm run build</code>), '''statico''' (la cartella così com'era) o '''server''' (il server Node di allora acceso e raccolto pagina per pagina come fa la Wayback Machine). Nel deposito gli indirizzi assoluti diventano <code>/tempo/&lt;sha&gt;/</code> o <code>/tempo/&lt;sito&gt;/&lt;sha&gt;/</code>; uno scudo in cima a ogni pagina tiene l'archivio in sola lettura (nessun modulo, POST o database di allora o di oggi), e le app React col router (albertopecchini.it fino al 17 settembre 2026) credono di stare alla radice, così non mostrano più «pagina non trovata».

I progressi si seguono nel '''cruscotto''': <code>tools/tempo/cruscotto.ps1</code> apre un cmd al centro dello schermo da 24 pollici con la nota di Claude, le barre dei download, una barra per sito col passo in corso, il totale con la fine stimata e il log in diretta (<code>tools/tempo/diretta.mjs</code>).

== Riservatezza ==
Le statistiche vengono dai commit già pubblici su GitHub, in ora italiana; niente nomi né indirizzi email di nessuno (degli autori si conta solo se c'era un assistente), e dai messaggi si tolgono email, telefoni, percorsi del computer e indirizzi di rete. Nelle pagine di allora le regole di <code>C:\\pzkko-server\\tempo\\privato.mjs</code> (fuori da GitHub, perché contengono quello che nascondono) tolgono l'indirizzo di casa e della cascina, le coordinate, il fisso e i numeri che non si usano più: le foto, che si fanno dal deposito, sono pulite anche loro.

{{Vedi anche|albertopecchini.it|rivaltasulmincio.it|cascinafontana.xyz|Better Call Pekko|Catture dei siti|Il repository AP|La regia di Claude}}
[[Categoria:Gli strumenti]]`,
  },

  'La regia di Claude': {
    data: '2026-11-03',
    fonti: ['albertopecchini.it/tools/cruscotto/cruscotto.mjs', 'albertopecchini.it/tools/cruscotto/vista.mjs', 'albertopecchini.it/tools/cruscotto/diretta.mjs', 'albertopecchini.it/tools/cruscotto/gancio.mjs', 'albertopecchini.it/tools/cruscotto/cruscotto.ps1', 'albertopecchini.it/tools/cruscotto/README.md'],
    testo: `'''La regia di Claude''' è la finestra dove [[Alberto Pecchini|Alberto]] vede in diretta quello che [[Claude Code]] sta facendo, in qualsiasi lavoro: un cmd al centro dello schermo da 24 pollici (l'HP 24f). È nata il 3 novembre 2026 come cruscotto di [[La macchina del tempo]] («creami un cmd dove veda i progressi di quello che stai facendo, log in diretta e barre di download, aprilo al centro del desktop nello schermo da 24"»), e la sera stessa è diventata di tutti i lavori: «mostra quel cmd e impara per qualsiasi task di aprirlo, poi mentre che è aperto tu lavora per migliorarlo al massimo per i miei bisogni».

== Cosa mostra ==
In cima lo stato di Claude: '''LAVORA''' (verde), '''TOCCA A TE''' (giallo, ha finito il turno) o '''TI ASPETTA''' (rosso, un permesso o una domanda), col progetto e il ramo. Sotto, la richiesta di Alberto, la nota di Claude e lo strumento in corso con da quanto (e il numero dello strumento nel turno); a fine turno quanto ci ha messo, con quanti strumenti, e l'inizio della risposta. Alberto tiene aperte più sessioni di Claude insieme: ognuna ha il suo stato, la sua nota, il suo piano e il suo colore; in cima sta quella a cui ha chiesto qualcosa per ultima, sotto «Altre» le altre (progetto, stato, richiesta, cosa fanno), e una che aspetta un permesso si vede in rosso anche da lì. Il tasto «s» fissa una sessione, e il log mostra solo le sue righe. Poi il piano dei passi (i passi fatti si riassumono quando non ci stanno); le barre (i download, i siti della macchina del tempo, qualsiasi lavoro lungo); il sistema (CPU, RAM, dischi), i server di casa (pzkko, la regia del server, la macchina del tempo, Vite), il sito pubblico e il tunnel da cui gli altri vedono la macchina del tempo, git (ramo, avanti e indietro, file cambiati, ultimo commit), la sessione (quanti strumenti e quali, gli ultimi file toccati, gli errori); in fondo il log in diretta. Suona quando Claude ha finito o aspetta. Coi tasti si filtra il log (tutto, solo Claude, solo i lavori, solo gli errori), si mette in pausa, si scorre.

== Come funziona ==
I lavori scrivono in <code>C:\\Users\\Alberto\\.cruscotto</code> con <code>tools/cruscotto/diretta.mjs</code>: stati, barre, il piano, le note, il log. I ganci di Claude Code a livello utente (in qualsiasi progetto) lanciano <code>gancio.mjs</code> in background: a ogni richiesta la regia si apre se è chiusa (la fa nascere WMI, perché un figlio del gancio moriva con lui), e ogni strumento finisce nel log da solo. Ogni sessione scrive il suo file in <code>sessioni/</code> e firma le sue righe del log col suo «#sigla» (le prime quattro cifre del suo id): i ganci sono di tutto l'utente, e le prime sere le sessioni aperte insieme si rubavano lo stato. La fine del turno legge l'ultima risposta dalla trascrizione della sessione; una sessione vista per la prima volta a metà ripesca da lì anche la richiesta. I comandi di Claude ereditano <code>CLAUDE_CODE_SESSION_ID</code>, così anche le note e il piano scritti con <code>diretta.mjs</code> sono della sessione giusta. Il disegno e i tasti stanno in <code>vista.mjs</code>, che la finestra ricarica appena il file cambia: la si migliora mentre è aperta; quando cambia il guscio, <code>cruscotto.ps1 -Riavvia</code> la riapre. <code>cruscotto.ps1</code> riconosce lo schermo da 24 pollici dalle misure fisiche del monitor e spegne la «modifica rapida» della console, che a un clic bloccava il disegno.

{{Vedi anche|La macchina del tempo|Claude Code|Come lavora Alberto con Claude}}
[[Categoria:Gli strumenti]]`,
  },

  'La cartina': {
    data: '2026-10-01',
    fonti: ['albertopecchini.it/tools/cartina/cartina.mjs', 'albertopecchini.it/src/art/misc.js'],
    testo: `'''La cartina''' è il fondo illustrato della carta dell'area operativa nella pagina <code>/contatti/</code> di [[albertopecchini.it]]: <code>public/media/mappa/area-operativa.webp</code>, generato da [[gpt-image-2]] su Replicate con <code>tools/cartina/cartina.mjs</code>, usando come riferimento il disegno di lago e fiumi di <code>areamap({ solo: 'acque' })</code>. Reticolo, raggi, città, nomi e scala restano vettoriali, da <code>areamap({ base })</code> in <code>src/art/misc.js</code>: la carta è una tavola generata dal codice con sotto un'illustrazione. Come gli altri strumenti ha la sua <code>lavoro/</code> (archiviata il 29 settembre 2026 fuori dal repository) e la fonte è dichiarata in <code>/crediti/</code>.

{{Vedi anche|Le copertine|Gli strumenti di albertopecchini.it|gpt-image-2}}
[[Categoria:Gli strumenti]]`,
  },

  'Il generatore di email': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/email-generator/README.md', 'albertopecchini.it/tools/email-generator/src/generate.js', 'albertopecchini.it/config/sender-profiles.json', 'albertopecchini.it/profiles/footers.json'],
    testo: `{{Infobox
| titolo = Il generatore di email
| dove = albertopecchini.it/tools/email-generator/
| dal = 22 settembre 2026
| comando = npm run email:new <nome> · npm run email <file.md>
| scrive = emails/out/<data>_<nome>/report.md, email.html, email-lite.html, preview.html, email.txt
| dipendenze = nessuna, solo Node 20.19+
}}
'''Il generatore di email''' trasforma appunti e file in un'email HTML autosufficiente, pronta da incollare nel composer di Yahoo, Proton o Gmail. Vive nel repository del sito perché '''riusa il linguaggio visivo del sito''': legge <code>src/styles/tokens.css</code> e ne ricava colori, scala tipografica e spazi, senza mai modificarlo. Il risultato di ogni generazione è un solo file da leggere, <code>report.md</code>: «l'email non viene mai stampata a schermo».

== L'input ==
Si parte da <code>EMAIL_INPUT_TEMPLATE.md</code> (<code>npm run email:new</code> ne fa una copia in <code>emails/in/</code> con id e data). Sezioni: METADATI (mittente, destinatario, oggetto, tono), MATERIALE GREZZO (Markdown: titoli, elenchi, tabelle, <code>:::nota</code>, <code>:::bottone whatsapp</code>), FILE DA LEGGERE (fonti, non allegate), FILE DA ALLEGARE. Il saluto è personale se il destinatario ha il nome («Gentile Mario Rossi,»); da un indirizzo nudo il nome non si deduce.

== Account e firme ==
Quattro caselle in <code>config/sender-profiles.json</code>: <code>yahoo</code> (pzkko@yahoo.com, personale), <code>proton</code> (pecchini@protonmail.com, la società Cascina Fontana), <code>gmail</code> (398893@studenti.unimore.it, l'università), <code>pec</code> (cascinafontana@pec.it). Le firme stanno in <code>profiles/footers.json</code> '''a versioni''' (ADD_VERSION, REPLACE, KEEP_EXISTING; nessuna si cancella mai), coi loghi in PNG incorporati come data URI (l'icona AP con «ALBERTO PECCHINI» in Archivo 640, il logo unimore, la vespa sulla fontana di [[cascinafontana.xyz]] con lo zampillo). Dal 26 ottobre 2026 ogni email si chiude con l'«Informativa Privacy» e l'«Avviso di Riservatezza» della casella (<code>src/informativa.js</code>).

== Gli stili ==
Versioni con un nome in <code>src/stili.js</code>: <code>fine-settembre</code> (dal 30 settembre, corrente su tutte e quattro le caselle: bianco e nero, Helvetica, allineato a sinistra, 640 px, nessun riquadro) e <code>meta-settembre</code> (dal 18 settembre: carta e inchiostro del sito, 600 px, Archivo incorporato in base64, ~34 KB). Gmail tronca oltre 102 KB: per questo esiste <code>email-lite.html</code>.

== La validazione ==
Mittente, destinatario, oggetto, corpo, firma, allegati, link, assenza di JavaScript e CSS esterno, viewport: <code>READY</code>, <code>WARNING</code> o <code>MISSING_REQUIRED_DATA</code> (codice d'uscita 2). «Il generatore dà forma al testo ma non inventa fatti». I moduli di resa (<code>compose.js</code>, <code>markdown.js</code>, <code>template.js</code>, <code>footer-html.js</code>, <code>informativa.js</code>, <code>validate.js</code>, <code>report.js</code>) non toccano il disco e girano anche nel browser, nel [[Il compositore email|compositore]], che produce email identiche byte per byte.

{{Vedi anche|Il compositore email|cascinafontana.xyz|Unimore|Gli strumenti di albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Il compositore email': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/src/templates/pages/email.js', 'albertopecchini.it/src/client/email.js', 'albertopecchini.it/src/styles/email.css', 'albertopecchini.it/src/data/rubrica.js', 'albertopecchini.it/api/email-ai.js', 'albertopecchini.it/plugins/api-dev.js'],
    testo: `'''Il compositore email''' è la pagina <code>/email/</code> di [[albertopecchini.it]]: [[Il generatore di email|il generatore]] in pagina, strumento privato dal 25 settembre 2026. Si sceglie da dove parte l'email (scuola, personale, aziendale: gli stessi account di <code>config/sender-profiles.json</code>), si compila coi tasti della guida, si copia l'output, la si fa migliorare dall'IA e si leggono statistiche, peso, lunghezza e segnalazioni; in fondo la rubrica (preferiti, indirizzi salvati nel browser, i contatti di <code>src/data/rubrica.js</code>). L'output è '''la stessa email''' del generatore da riga di comando: nel browser girano i suoi moduli puri, verificato byte per byte; si scaricano <code>email.html</code>, <code>email-lite.html</code>, <code>email.txt</code>, <code>report.md</code>, il file di input per <code>emails/in/</code> e una bozza <code>.eml</code>.

== Privato ==
Non compare nei menu, nel footer, nella sitemap né nei motori (<code>noindex</code> e <code>X-Robots-Tag</code> in <code>vercel.json</code>): si raggiunge dal link con la chiave, <code>/email/?k=&lt;EMAIL_TOOL_KEY&gt;</code>, salvata nel browser al primo accesso. Senza chiave la pagina funziona ma i tasti dell'IA restano spenti. È l'unica pagina senza il credito ([[Il credito nei siti dei clienti]]).

== L'IA ==
Passa da <code>api/email-ai.js</code>. '''Online''' è una funzione Vercel che parla con IBM Granite 4.2 8B (Apache 2.0) attraverso OpenRouter (<code>ibm-granite/granite-4.2-8b</code>, «qualche decina di centesimi di dollaro ogni mille richieste»), con <code>fetch</code> e nessun SDK; 60 richieste l'ora per IP, risposta in JSON con schema, lo «Sforzo» (Rapido, Normale, Accurato) regola il ragionamento. '''In locale''' Alberto usa '''Claude Opus con l'abbonamento Claude (Max)''': con <code>EMAIL_AI_PROVIDER=claude-code</code> in <code>.env.local</code>, <code>npm run dev</code> serve le funzioni di <code>api/</code> (<code>plugins/api-dev.js</code>) e la funzione lancia <code>claude -p</code> con <code>--model opus</code>, senza strumenti (<code>--tools ""</code>), in modalità <code>--restricted</code>, in una cartella temporanea vuota e senza le variabili <code>ANTHROPIC_*</code>: «il testo dell'email quindi non può far eseguire nulla sul computer». Tempi misurati 10–18 s. Il pannello «Consumi dell'IA» legge i limiti dell'abbonamento con <code>claude -p /usage</code>, segue la richiesta in streaming (<code>--output-format stream-json</code>) e tiene un registro di 500 richieste nel localStorage. Su Vercel <code>EMAIL_AI_PROVIDER</code> non va impostata; Ollama con <code>granite4.2:8b</code> (5,3 GB) fa da ripiego gratuito in locale.

{{Vedi anche|Il generatore di email|Claude Code|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Lezioni (strumento)': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/lezioni/README.md', 'albertopecchini.it/tools/lezioni/registra.py', 'albertopecchini.it/tools/lezioni/trascrivi.py', 'albertopecchini.it/tools/lezioni/impagina.py', 'albertopecchini.it/tools/lezioni/pacchetto.py', 'albertopecchini.it/pzkko/tools/lezioni/index.html', '.claude/skills/lezione/SKILL.md'],
    testo: `{{Infobox
| titolo = Lezioni
| immagine = lezioni.webp
| didascalia = la pagina dello strumento su pzkko.it/tools/lezioni/
| dove = albertopecchini.it/tools/lezioni/ (il codice), pzkko.it/tools/lezioni/ (la pagina e lo zip)
| dal = 21 ottobre 2026
| nome pubblico = pzk$meeting (dal 22 ottobre)
| serve = Windows 10 o 11, una GPU NVIDIA consigliata (~5 GB), Python 3.12 in un venv tutto suo
| licenze = faster-whisper e Whisper (MIT), KaTeX (MIT), PyAudioWPatch, mss, markdown-it-py (MIT)
}}
'''Lezioni''' è lo strumento di Alberto per le lezioni su Teams: registra l'audio del PC e lo schermo, trascrive la voce con Whisper '''sincronizzata parola per parola con le schermate della lavagna''', legge le formule in LaTeX e, a lezione finita, ne fa degli appunti per argomento in un PDF A4. Gira tutto sul PC, niente cloud tranne la lettura della lavagna con Claude se la si accende. È nato il 21 ottobre 2026 seguendo una lezione di Analisi (limiti di funzione) ed è il primo strumento sul [[Il muro|muro]] di pzkko: [[pzk$meeting]].

== Come funziona ==
* <code>installa.ps1</code>: prende uv, crea <code>%LOCALAPPDATA%\\Lezioni\\venv</code> con Python 3.12 e le librerie (con una GPU anche cuBLAS e cuDNN), scarica il modello (large-v3 ~3 GB con la GPU, small ~0,5 GB senza), crea <code>Documenti\\Lezioni</code> e i collegamenti «Lezione» e «Fine lezione» sul desktop;
* <code>registra.py</code>: l'audio dal loopback WASAPI, a pezzi da 10 s; lo schermo guardato una volta al secondo, una schermata quando la lavagna cambia e si ferma o ogni 20 s;
* <code>trascrivi.py</code>: faster-whisper su finestre di ~25 s che si sovrappongono (su una RTX 3060 Ti large-v3 trascrive sei-dieci volte più in fretta di quanto si parla); scarta le frasi che Whisper inventa sul silenzio;
* <code>componi.py</code> rifà <code>grezzo.md</code>, <code>prepara.py</code> ritaglia il riquadro di Teams e fa i provini 3×3, <code>aspetta.py</code> aspetta che ci sia da leggere, <code>unisci.py</code> unisce gli appunti a pezzi, <code>impagina.py</code> fa l'HTML con KaTeX e il PDF A4 stampato da Edge coi caratteri di albertopecchini.it;
* <code>barra.py</code>: un foglio col nastro su un pezzo di saracinesca, sempre in primo piano: rec, livello audio, l'ultima schermata, «voce −15 s», «ocr −2 min».
Registratore, trascrittore e lettura hanno ciascuno un guardiano che li rilancia; provato il 21 ottobre su 2 h 27 min con una disconnessione di Teams, lo schermo intero, la telecamera spostata e un crash del trascrittore.

== La lettura della lavagna ==
Whisper sente ma non legge: o la fa [[Claude Code]] con la skill [[Skill lezione|lezione]] (a giri di ~2 minuti, scrivendo <code>ocr\\ocr_NNN.json</code>) o, con una chiave API di Anthropic, <code>ocr_claude.py</code> e <code>appunti_claude.py</code> (circa 6–7 $ di lettura e 1–1,5 $ di appunti per 2 h 30 con Claude Opus 5.5).

== Lo zip ==
<code>python tools/lezioni/pacchetto.py</code> fa <code>pzkko/tools/lezioni/lezioni.zip</code> e scrive versione e peso nella pagina (fra <code>&lt;!--versione--&gt;</code> e <code>&lt;!--peso--&gt;</code>): va rilanciato dopo ogni modifica, prima del commit. Le immagini della pagina vengono da una lezione '''inventata''': «niente della lezione vera va sulla pagina». «Registra solo le lezioni che hai il diritto di registrare, e tienile per te».

{{Vedi anche|pzk$meeting|Skill lezione|Gli strumenti di pzkko|Claude Code}}
[[Categoria:Gli strumenti]]`,
  },

  'La nota in PDF': {
    data: '2026-09-30',
    fonti: ['albertopecchini.it/tools/nota/nota.mjs', 'albertopecchini.it/tools/nota/README.md', '.claude/skills/nota/SKILL.md'],
    testo: `'''La nota in PDF''' è <code>tools/nota/nota.mjs</code>: Alberto scrive una «nota» (per esempio la chiusura di stagione di una piscina: periodo, titolo col cliente, un intervento per riga con la data, il riepilogo con gli importi e il totale) e lo script la impagina in un PDF A4 coi caratteri del sito: Archivo per il testo, Instrument Serif corsivo nel titolo e nei giorni, IBM Plex Mono per mesi ed etichette, un tocco di minio.

== La regola ==
'''Il testo non cambia''': niente parole aggiunte (intestazioni, carta intestata, firme, IVA), niente tolte, niente corrette; solo la tipografia (spazi doppi, apostrofi, <code>100€</code> → <code>100 €</code>). Lo script riconosce <code>periodo:</code>, la prima riga che comincia con «Nota» (titolo e cliente), gli interventi «• 29 mag: …», le voci «… = 365€», il «Totale … = 928€»; alla fine dice quanti interventi e voci ha letto, la somma, e avvisa se la somma non torna col totale («il totale resta comunque quello di Alberto»). Il PDF lo stampa Edge headless con <code>--print-to-pdf</code>. Note e PDF stanno in <code>Documents\\Note\\</code>, fuori dal repository: «ci sono nomi e importi dei clienti» ([[I file fuori dal repository]]). La skill [[Skill nota|nota]] di Claude Code la lancia quando Alberto scrive «nota» e incolla il testo: «solo PDF, mai un .docx».

{{Vedi anche|Skill nota|Gli strumenti di albertopecchini.it|I file fuori dal repository}}
[[Categoria:Gli strumenti]]`,
  },

  'L\'anteprima og': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/tools/og/og.mjs', 'albertopecchini.it/public/og.png', 'albertopecchini.it/src/data/site.js'],
    testo: `'''L'anteprima og''' è <code>public/og.png</code>, l'immagine che compare quando si condivide un indirizzo di [[albertopecchini.it]] (Open Graph, Twitter card): 1200×630, la stessa carta della home, il nome in minuscolo col cognome a filo, il monogramma, il claim, le quattro aree. La fa <code>node tools/og/og.mjs</code> componendo un HTML coi caratteri del sito letti da <code>node_modules</code> (Archivo, Cascadia Code, Instrument Serif) e fotografandolo con Chromium (il puppeteer-core di <code>tools/catture</code>); i testi vengono da <code>src/data/site.js</code> (<code>firstName</code>, <code>lastName</code>, <code>claim</code>, <code>tagline</code>, <code>edition</code>, <code>title</code>, <code>location</code>): se cambia uno di quei valori si rigenera. Dal 18 ottobre 2026 sostituisce l'immagine precedente, «che era ancora in maiuscolo, diceva “perito geometra” e portava le coordinate di Mantova invece di quelle di Rivalta sul Mincio». Pzkko ha la sua, <code>pzkko/og.jpg</code> ([[La favicon e l'og]]).

{{Vedi anche|La favicon e l'og|Gli strumenti di albertopecchini.it|Le catture}}
[[Categoria:Gli strumenti]]`,
  },

  'L\'indirizzo .onion': {
    data: '2026-10-07',
    fonti: ['albertopecchini.it/tools/onion/onion.mjs', 'albertopecchini.it/tools/onion/pubblica.mjs', 'albertopecchini.it/tools/onion/README.md'],
    testo: `{{Infobox
| titolo = L'indirizzo .onion
| dove = http://m6dnsjjtyp3jqy7ectjofe3545uacq5rbabe5yoj35rnpv4l32hrndad.onion
| dal = 7 ottobre 2026
| comando = npm run onion (pubblica), node albertopecchini.it/tools/onion/onion.mjs (a mano)
| serve = Tor Expert Bundle in %LOCALAPPDATA%\\Tor\\bundle, il pc acceso
| attività = «AP onion» (all'accesso, allo sblocco, ogni cinque minuti)
}}
'''L'indirizzo .onion''' è [[albertopecchini.it]] servito dal pc di Alberto e raggiungibile con Tor Browser: «Vercel non c'entra: né la build né le visite passano da lì». Tor (Expert Bundle 15.0.24, Tor 0.4.9.13) pubblica l'onion service e passa le visite a <code>onion.mjs</code> su <code>127.0.0.1:8099</code>, un server statico che risponde con l'ultima build pubblicata; Tor fa solo connessioni in uscita, quindi non si apre nessuna porta sul router.

== Pubblicare ==
<code>npm run onion</code>: <code>pubblica.mjs</code> fa la build del sito così com'è sul PC (anche i file non committati, e lo dice) in <code>%LOCALAPPDATA%\\Tor\\www\\a</code> o <code>\\b</code>, la ritocca e scrive <code>www\\attiva.txt</code>: il server passa alla nuova cartella senza riavvii, e per tornare indietro basta rimettere l'altra lettera. I ritocchi: il modulo di contatto senza <code>data-endpoint</code> (compone l'email nel programma di posta), <code>/email/</code> non servita, i link interni assoluti resi relativi (il credito nel piè di pagina resta com'è), le immagini negli stili e le <code>&lt;image&gt;</code> SVG passate come <code>data:</code> e <code>blob:</code> contro un difetto di Tor Browser 15 (Firefox 140, tor-browser#43012, corretto in Firefox 158). Valgono i rinvii e le intestazioni di <code>vercel.json</code>, le risposte compresse, ETag, le richieste a pezzi per PDF e DWG; nessun registro delle visite.

== Il secondo indirizzo ==
Lo stesso processo serve anche <code>%USERPROFILE%\\ygdrgs\\sito</code> (un negozio in HTML 3.2 scritto da «Genera sito.bat») su <code>127.0.0.1:8100</code>, con le chiavi di <code>onion\\nuovo\\</code>; l'indirizzo è cambiato il 4 ottobre 2026.

== Avvio e chiavi ==
L'attività pianificata «AP onion» ha tre inneschi dal 4 ottobre 2026, quando uno spegnimento non andato a buon fine ha chiuso i processi dell'utente e il sito è rimasto spento per due ore e mezza. <code>hs_ed25519_secret_key</code> '''è''' l'indirizzo: se si perde, l'indirizzo è perso per sempre, e chi la copia può spacciarsi per il sito; «tenerne una copia in un posto sicuro, mai nel repo». Il sito su Vercel non manda <code>Onion-Location</code> perché l'indirizzo esiste solo mentre il PC è acceso.

{{Vedi anche|albertopecchini.it|I file fuori dal repository|Gli strumenti di albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Le tavole': {
    data: '2026-10-02',
    fonti: ['albertopecchini.it/tools/tavole/README.md', 'albertopecchini.it/src/data/projects.js', 'albertopecchini.it/src/templates/components/viewer.js', 'albertopecchini.it/src/client/viewer.js', 'albertopecchini.it/src/client/gl-sheet.js'],
    testo: `'''Le tavole''' sono i disegni veri dei lavori tecnici di [[albertopecchini.it]] (AutoCAD LT, I.T.T. «Carlo d'Arco»): il progetto stradale, il bar-caffetteria del tema d'esame, il layout di cantiere, la relazione sul Museo dei Mestieri del Fiume. Dal 2 ottobre 2026 si mostrano («mostra nei progetti il visualizzatore DWG e PDF», Alberto): nel case study la sezione Tavole col visualizzatore, e la pagina <code>/portfolio/tavole/</code>; l'interruttore è <code>showSheets</code> in <code>projects.js</code> (spento dal 26 settembre al 2 ottobre, «mai mostrare i documenti»).

== I file ==
Ogni tavola sta in <code>public/media/tavole/&lt;slug&gt;/</code>: <code>NN.svg</code> (il disegno delle tavole da PDF, con <code>pdftocairo -svg</code> e poi <code>svgopt.py</code>, che arrotonda a tre decimali e toglie gli attributi predefiniti: i file scendono di un terzo), <code>NN.webp</code> (1200 px), <code>NN-mini.webp</code> (320 px), <code>NN.pdf</code> da scaricare. Si dichiara con <code>sheet(slug, 'NN', { title, alt, note, h, scale, from })</code>. '''Le tavole DWG restano DWG''': il file sta così com'è e una tavola è un riquadro dello spazio modello, <code>sheet(slug, 'NN', { dwg: 'file.dwg', box: [x0, y0, x1, y1], darken })</code>, letto nel browser dal [[Il lettore DWG|lettore scritto da zero]]. Le tavole sono online solo se una pagina le mostra: con <code>showSheets</code> spento <code>dist/media/tavole/</code> viene tolta.

== Il visualizzatore ==
Una finestra di programma, parente del terminale della home: barra del titolo col nome del file e la spia «gpu», strumenti in una pillola, la barra di scala (metri veri se la tavola ha <code>scale</code>), le coordinate del disegno sotto il puntatore per i DWG, la mappa da ingrandito. Trascinare sposta, Ctrl + rotella ingrandisce, il doppio clic avvicina, le frecce cambiano tavola, F adatta, c'è lo schermo intero. Tutte le tavole vettoriali passano da un motore WebGL 2 scritto apposta (<code>src/gpu/</code> nel worker, <code>src/client/gl-sheet.js</code>): tratti, triangoli e lettere (un atlante di campi di distanze) in quattro chiamate per fotogramma, circa 3 ms sulla RTX 3060 Ti anche a 5120 px, «la tavola resta nitida mentre si ingrandisce» (prima ogni zoom lasciava l'immagine sfocata per 650–800 ms). Senza WebGL 2 la strada di riserva: l'SVG ridisegnato dal browser o il DWG su canvas 2D (<code>dwg-sheet.js</code>).

== La riservatezza ==
Prima di pubblicare una tavola si guarda cosa c'è scritto: dall'inquadramento del cantiere è stato tolto il nome della strada da tutti e quattro i file, e nel PDF anche dai commenti nascosti «AutoCAD SHX Text» con <code>pulisci-pdf.mjs</code> (che svuota anche il layer indicato); nella relazione sul museo i nomi dei compagni sono coperti e le foto in cui si riconoscono sfocate. Gli script Python <code>dxf2svg.py</code>, <code>fixdxf.py</code>, <code>heal.py</code> sono la vecchia strada DWG → DXF → SVG, non più usata.

{{Vedi anche|Il lettore DWG|Le copertine|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Il lettore DWG': {
    data: '2026-10-03',
    fonti: ['albertopecchini.it/src/dwg/dwg.js', 'albertopecchini.it/src/dwg/file.js', 'albertopecchini.it/src/dwg/entities.js', 'albertopecchini.it/src/dwg/worker.js', 'albertopecchini.it/src/gpu/pack-dwg.js', 'albertopecchini.it/src/gpu/tess.js', 'albertopecchini.it/src/gpu/sdf.js'],
    testo: `'''Il lettore DWG''' è <code>src/dwg/</code> di [[albertopecchini.it]]: un lettore del formato di AutoCAD scritto da zero, senza librerie e senza conversione, che gira nel browser (in un worker) e apre i file di AutoCAD 2010–2018 (AC1024, AC1027, AC1032) per le [[Le tavole|tavole]] del portfolio. È arrivato il 26 settembre 2026 («illustrazioni al posto dei documenti, nuova home, figurine e lettore DWG»), il 3 ottobre l'atlante SDF e la tessellazione per la GPU.

== I moduli ==
<code>bits.js</code> (il lettore di bit coi tipi della specifica: B, BS, BD, DD, MC, MS, H, TU…), <code>file.js</code> (la struttura R2004+: intestazione cifrata, mappa delle pagine, sezioni, LZ77), <code>objects.js</code> (mappa degli oggetti, classi, flussi stringhe e handle), <code>entities.js</code> (la decodifica campo per campo di entità e tabelle), <code>header.js</code> (LTSCALE, PDMODE…), <code>dwg.js</code> (la lettura completa: indice, tabelle, spazio modello, blocchi, ordine di disegno), <code>geom.js</code> (archi e bulge, NURBS, ellissi, motivi di tratteggio, palette ACI), <code>mtext.js</code> (i codici di formato dei testi multilinea), <code>scene.js</code>, <code>render.js</code> (la strada di riserva su canvas 2D), <code>worker.js</code>.

== Cosa legge ==
Linee, polilinee, archi, cerchi, ellissi, spline, testi e testi multilinea, quote, tratteggi pieni e a motivo, blocchi anche annidati, layer, tipi di linea, spessori, colori veri e trasparenze, ordine di disegno; come in AutoCAD con lo sfondo bianco (il colore 7 diventa nero), i layer spenti, congelati o non stampabili non si vedono; <code>darken</code> scurisce i colori chiari pensati per il nero di AutoCAD. Lo stesso DWG serve più tavole: scaricato e letto una volta sola.

== Verso la scheda grafica ==
<code>src/gpu/</code> prepara tre elenchi già pronti per i buffer: i '''tratti''' (un rettangolo per segmento o pezzo d'arco, lo shader calcola per ogni pixel la distanza dalla linea: bordi esatti, estremità tonde, tratteggi, archi veri), i '''triangoli''' dei riempimenti (<code>tess.js</code>, a fasce, con buchi e contorni intrecciati, sfumati dal multicampionamento 8× o 4×) e le '''lettere''' (<code>sdf.js</code>, un atlante di campi di distanze coi caratteri del sistema). <code>pack-dwg.js</code> parte dalla scena del DWG, <code>pack-svg.js</code> dagli SVG di pdftocairo. Le linee più sottili di un pixel restano larghe un pixel e si schiariscono senza scendere sotto il 72 %.

{{Vedi anche|Le tavole|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Wrapped 5BT': {
    data: '2026-10-06',
    fonti: ['albertopecchini.it/tools/wrapped/analizza.mjs', 'albertopecchini.it/tools/wrapped/README.md', 'albertopecchini.it/src/data/wrapped.js', 'albertopecchini.it/src/client/wrapped.js', 'albertopecchini.it/src/styles/wrapped5bt.css'],
    testo: `'''Wrapped 5BT''' è la pagina <code>/wrapped5BT/</code> di [[albertopecchini.it]]: il «Wrapped» della chat WhatsApp della classe 5BT, un frame 9:16 con 74 slide verticali a scatto in nove capitoli, ognuna col pannello «Come si calcola». Fuori da menu, sitemap e indicizzazione (<code>noindex</code>). Costruito il 5–6 ottobre 2026 in una sessione cloud di Claude (le pull request #12 e #13: il motore delle slide, l'analizzatore, «corregge i quindici difetti trovati dalla revisione»).

== L'analizzatore ==
<code>tools/wrapped/analizza.mjs</code> legge gli export di WhatsApp («Esporta chat», senza media), anche due esportati da telefoni diversi e in formati inglese e italiano mescolati, li unisce riconoscendo i doppioni per orario, mittente e inizio del testo, fonde i numeri e i nomi della stessa persona con <code>--alias</code>, e scrive <code>lavoro/dati.json</code> (volume, tempo, persone, linguaggio, sessioni, coppie, record, eventi, evoluzione per anno, anomalie, e la sezione <code>copertura</code> coi limiti) e <code>lavoro/chat_unificata.txt</code> per verificare le citazioni. Niente rete, niente dipendenze. «Il patto con le slide»: <code>src/data/wrapped.js</code> si scrive solo leggendo <code>dati.json</code>, nessun numero inventato, nessuna frase attribuita senza riscontro. <code>lavoro/</code> è nel <code>.gitignore</code>: gli export coi nomi veri non entrano mai nel repository.

== La pagina ==
Ogni slide è una pila di blocchi (numero grande, barre, colonne, tabella, fumetto della chat, schede…) più la chiusa «In breve»; dentro al frame le misure sono in <code>cqi</code>; lo scorrimento a scatto è nativo e <code>src/client/wrapped.js</code> aggiunge avanzamento, contatore, tastiera e tocco. Il foglio <code>wrapped5bt.css</code> si collega solo a questa pagina. Con <code>stato</code> diverso da <code>'pronto'</code> si vede la tela in attesa con le guide.

{{Vedi anche|albertopecchini.it|Gli strumenti di albertopecchini.it|Claude Code}}
[[Categoria:Gli strumenti]]`,
  },

  'Le immagini di Better Call Pekko': {
    data: '2026-10-18',
    fonti: ['albertopecchini.it/tools/assistenza/spot.js', 'albertopecchini.it/tools/assistenza/annunci.js', 'albertopecchini.it/tools/assistenza/rendi.mjs', 'albertopecchini.it/tools/assistenza/design.mjs', 'albertopecchini.it/src/data/assistenza-media.js'],
    testo: `'''Le immagini di Better Call Pekko''' nascono in due passi, «così sembrano del 2008 e non del 2026», con <code>tools/assistenza</code>:

# '''Ingredienti''' (<code>spot.js</code> + <code>spot.mjs</code>): [[gpt-image-2]] disegna solo materiale fotografico in stile foto stock economica: ritagli di [[Pekko]] in nove completi e pose (il volto dalla fototessera di Alberto), due fogli di foto stock finte, oggetti scontornati, selfie da webcam per gli avatar, tre sfondi (l'ufficio vuoto, la stampante che esplode, la strada di campagna). Dieci predizioni high il 27 settembre 2026, più dodici della prima versione accantonata.
# '''Annunci''' (<code>annunci.js</code> + <code>rendi.mjs</code>): i banner si compongono '''a strati in HTML''' (sfondo, ritagli appoggiati al bordo basso, testo Impact bianco col bordo colorato ed estruso in 3D, starburst, nastri, bottoni) e si fotografano con Chromium alla misura esatta: JPEG per i fissi, GIF a pochi fotogrammi per gli animati (palette a 128 colori con dithering ordinato). «Il modello disegna bene gli ingredienti, male i banner finiti».

== Gli annunci ==
<code>header</code> (960×234, GIF con 3 pose), <code>welcome</code> («WELCOME, PC ABUSERS!»), <code>fixed-my-pc</code>, i quattro <code>thumb</code> dei video di consulenza, <code>portrait</code>, <code>poster</code>, <code>getspace</code> («GET $PACE NOW!!!»), <code>vista</code> («the tragedy of Windows Vista»), <code>hermanos</code> (Los Backups Hermanos), <code>fashion</code> (la sfilata), le sei e-card, <code>million</code> e <code>toolbar</code> (468×60), <code>mattress</code>, <code>pizza</code>, <code>dairy</code>, <code>mac</code>, <code>phones</code> (300×250: Mincio Discount Mattress Barn, Gino's Pizza & Data Recovery…), <code>salami</code> e <code>nonna</code>, <code>turtle</code>, <code>snail</code>, <code>fish</code>, <code>phon</code>, <code>tv</code>, <code>ambulance</code>, i grattacieli delle colonne. «Le aziende non esistono e la pagina lo dichiara»; su Apple si scherza senza nominarla («not affiliated with any fruit»).

== Il canvas di Claude Design ==
Dal 29 settembre 2026 i banner di «Pekko makes websites» e i bottoni 88×31 sono artboard vettoriali nel canvas di Claude Design «Better Call Pekko — banner», con font veri di Google Fonts; <code>design.mjs</code> apre ogni artboard con puppeteer-core, aspetta i font e scrive <code>public/media/assistenza/&lt;nome&gt;</code> (JPEG a densità 2×, PNG per i bottoni, GIF per gli animati). Fra questi <code>ad-web-pzkko</code> (300×250): la saracinesca di pzkko.it di notte con l'insegna al neon, il volantino giallo coi tagliandi e «3D ROULETTE INSIDE!», immagini prese da <code>pzkko/art/</code>. <code>shot-bcp.webp</code> è la cattura della pagina stessa, per la scheda di Pekko Explorer.

{{Vedi anche|Better Call Pekko|Pekko|gpt-image-2|Gli strumenti di albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },

  'Il contatore di Better Call Pekko': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/api/bcp.js', 'albertopecchini.it/tools/bcp/visite.mjs', 'albertopecchini.it/src/data/bcp-seed.js'],
    testo: `'''Il contatore di Better Call Pekko''' è <code>api/bcp.js</code>, la funzione sola che tiene le parti vive di [[Better Call Pekko]] (dal 29 settembre 2026): contavisite, persone online, like, condivisioni, sondaggio, classifica del gioco, forum, guestbook, shoutbox ed e-card, in un documento JSON, <code>bcp/db.json</code>, prima su [[Vercel Blob]] e dal 28 ottobre sul [[Il server dei dati in casa|server in casa]] (<code>PZKKO_SERVER_URL</code> e <code>PZKKO_SERVER_SECRET</code> nel progetto <code>bcp</code>). Riscrive con l'ETag: due scritture insieme non si cancellano. Il contenuto iniziale (discussioni e recensioni del 2009) sta in <code>src/data/bcp-seed.js</code> e il template lo stampa nell'HTML, così la pagina regge anche senza JavaScript o col database spento (<code>offline</code>).

== Le visite ==
Dal 7 ottobre 2026 ogni visita nuova si conta anche per giorno (ora di Roma) e per sito di provenienza: la pagina manda il nome host di <code>document.referrer</code>, l'API lo pulisce e somma; serve a vedere «se chi ci sponsorizza porta gente davvero». Una visita è la prima apertura in una scheda (<code>bcp-seen</code>); online chi ha aperto negli ultimi 5 minuti (massimo 80); giorni tenuti 90, siti distinti 40; nessun IP, nessun cookie. Si legge senza sporcarla con <code>node tools/bcp/visite.mjs</code> (<code>--once</code>, <code>--ogni 10</code>) o da <code>/api/bcp/</code> (campi <code>visits</code>, <code>online</code>, <code>today</code>, <code>days</code>, <code>refs</code>; CORS aperto in lettura); la pagina <code>/visite/</code> li mostra.

== Protezioni e moderazione ==
Campo trappola, 3 s minimi, 4 messaggi al minuto per IP, niente link né HTML, nomi 2–24 caratteri («pekko» è riservato), liste troncate (60 discussioni, 40 risposte, 150 firme, 60 messaggi nella shoutbox). Con <code>BCP_ADMIN_KEY</code> una POST con <code>{ "a": "del", … }</code> cancella. In locale <code>BCP_STORE=memory</code>.

{{Vedi anche|Better Call Pekko|Il server dei dati in casa|Vercel Blob}}
[[Categoria:Gli strumenti]]`,
  },

  'Il controllo delle pagine': {
    data: '2026-10-01',
    fonti: ['albertopecchini.it/tools/controllo/controllo.mjs', 'albertopecchini.it/tools/controllo/README.md'],
    testo: `'''Il controllo delle pagine''' è <code>tools/controllo/controllo.mjs</code>: legge le pagine che la build ha scritto in <code>dist/</code> «e segnala quello che un occhio non vede finché qualcuno non ci inciampa». Lo fa girare GitHub a ogni push col workflow [[Il controllo della build (workflow)|Build]], sui due siti del progetto Vite.

== Cosa controlla ==
* il '''credito all'autore''': un link esattamente a <code>https://www.albertopecchini.it</code>, e nessun indirizzo senza www né verso un <code>*.vercel.app</code> del sito ([[Il credito nei siti dei clienti]]);
* i '''riferimenti interni''' (<code>href</code>, <code>src</code>, <code>srcset</code>, <code>poster</code>, <code>data-full</code>, <code>url()</code> negli stili): ognuno deve avere il suo file nella build, con le regole di Vercel (<code>cleanUrls</code>, <code>trailingSlash</code>); le funzioni di <code>api/</code> e i redirect di <code>vercel.json</code> valgono come esistenti;
* titolo, descrizione e lingua;
* niente <code>undefined</code>, <code>NaN</code> o <code>[object Object]</code> nella pagina: il segno di un dato mancante in un template;
* che ogni indirizzo di <code>sitemap.xml</code> sia una pagina.
Fa eccezione solo <code>/email/</code> (<code>SENZA_CREDITO</code>). In locale: <code>npm run build && node tools/controllo/controllo.mjs</code>; esce con 0 o con 1 e l'elenco dei problemi, che in GitHub Actions diventano annotazioni <code>::error</code>. Il controllo di questa wiki (<code>tools/pzkko/wiki/controlla.mjs</code>) fa lo stesso lavoro per le voci: [[Pzkkopedia:Come si aggiorna]].

{{Vedi anche|Il controllo della build (workflow)|Il credito nei siti dei clienti}}
[[Categoria:Gli strumenti]]`,
  },

  'Replicate': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/replicate.mjs', 'albertopecchini.it/tools/copertine/README.md'],
    testo: `'''Replicate''' è il servizio su cui girano i modelli che disegnano le immagini dei siti di Alberto: [[gpt-image-2]] (le copertine, le figurine, le mascotte, l'aragosta, gli ingredienti di Better Call Pekko, tutte le immagini del [[Il muro|muro]] di pzkko, i pomodori, i disegni della scena 3D, le figure delle carte, le facce della moneta), [[retro-diffusion rd-plus]] (le icone a pixel del cercapersone, dal 26 ottobre 2026) e [[bria/remove-background]] (lo scontorno). Il client comune è <code>tools/replicate.mjs</code>; il token (<code>REPLICATE_API_TOKEN</code>, creato su replicate.com/account/api-tokens) sta in <code>albertopecchini.it/.env.local</code>, escluso da Git.

== Le regole imparate ==
* la qualità è sempre high: «gli strumenti non offrono versioni più economiche» (e «è una scelta di Alberto»);
* sotto i 10 $ di credito Replicate accetta al massimo 5 predizioni in un colpo e risponde 429 alle altre; il client le riprova da solo;
* se l'attesa si interrompe con «fetch failed» (è capitato il 21 ottobre 2026 a tutti i fogli insieme) la predizione è partita lo stesso e si paga: ogni strumento ha <code>recupera &lt;nome&gt; &lt;id&gt;</code>, con l'id dalla dashboard o da <code>GET /v1/predictions</code>, «senza pagarla due volte»;
* dal 30 settembre 2026 gpt-image-2 rifiuta il fondo trasparente: i fogli si fanno su magenta e la chiave cromatica lo toglie.
I costi veri si leggono nella dashboard di Replicate; le fonti delle immagini sono dichiarate in <code>/crediti/</code> e nei README.

{{Vedi anche|gpt-image-2|retro-diffusion rd-plus|bria/remove-background|Le immagini del muro}}
[[Categoria:Gli strumenti]]`,
  },

  'gpt-image-2': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/replicate.mjs', 'albertopecchini.it/tools/pzkko/fogli.js', 'albertopecchini.it/tools/pzkko/immagini.mjs'],
    testo: `'''gpt-image-2''' (<code>openai/gpt-image-2</code>, OpenAI) è il modello su [[Replicate]] che ha disegnato quasi tutte le immagini dei siti di Alberto: su [[albertopecchini.it]] le [[Le copertine|copertine]] e le viste dei progetti, le [[Le figurine|figurine]], le [[Le mascotte|mascotte]] e i [[I burattini|burattini]], l'[[L'aragosta e l'inchiostro|aragosta]], la [[La cartina|cartina]], gli ingredienti e i meme di [[Better Call Pekko]]; su [[Pzkko.it]] tutto il muro (la lamiera no: è una foto vera) — le carte, le illustrazioni dei volantini, i graffiti, i manifesti inventati, le fiches, il foglio della roulette, le mezze figure delle carte del blackjack, le facce della moneta come mappe delle altezze, i pomodori del caricamento, la roba per terra e il fronte del negozio della scena 3D, il portafoglio del wallet e le banconote, il tasto della regia. «Ogni WebP porta dentro il prompt con cui è nato».

== Come lo si usa ==
Un foglio alla volta (spesso 3×3 su 2048×2048, o 1536×1024 per un intero), qualità high, con riferimenti (<code>input_images</code>: una tavola, la chiocciola, l'intero di un burattino, la mappa dei rilievi del chiusino da cui disegnare il colore «così rilievi e colore coincidono al pixel»); poi uno strumento ritaglia: per componenti connesse e baricentro nella cella, o con <code>tagli</code> quando le celle non sono uguali, e <code>briciole</code> per scartare i pezzi minuscoli. Dal 30 settembre 2026 non accetta più il fondo trasparente: fondo magenta e chiave cromatica. Per le icone piccole dal 26 ottobre 2026 è sostituito da [[retro-diffusion rd-plus]] («mai più con gpt-image-2» per le icone). I marchi veri che compaiono sui manifesti del muro (Moncler, Frisk, Lyca Mobile, TIM, Starlink, Red Bull, Estathé, Eastpak, Landini, Epson, Apple, Tecnomat) «sono quelli che si trovano su un muro di città, disegnati dal modello: non sono pubblicità né collaborazioni».

{{Vedi anche|Replicate|retro-diffusion rd-plus|Le immagini del muro|I fogli di gpt-image-2}}
[[Categoria:Gli strumenti]]`,
  },

  'retro-diffusion rd-plus': {
    data: '2026-10-27',
    fonti: ['albertopecchini.it/tools/pzkko/pixel.mjs', 'albertopecchini.it/pzkko/chat/icone.js'],
    testo: `'''retro-diffusion rd-plus''' (<code>retro-diffusion/rd-plus</code> su [[Replicate]]) è il modello a pixel con cui dal 26 ottobre 2026 si fanno '''tutte''' le icone di pzkko: gli avatar del profilo (<code>art/chat-avatar/</code>), le piastrelle delle app (<code>art/chat-app3/</code>, e l'icona del telefono rifatta il 27 ottobre «con la sagoma raddrizzata e il bordo omogeneo»), gli oggetti, i pesci, il bot, i mestieri (<code>FOGLI_CHAT</code> in <code>chat/icone.js</code>). Una predizione per icona, col fondo tolto e ingrandite senza sfumare: <code>node tools/pzkko/pixel.mjs [nome…]</code> (<code>--rifai</code> rielabora i PNG già scaricati senza pagare, <code>--controlla</code> elenca le immagini tagliate).

{{Citazione|tieni il modello per sempre · falle tutte con retro-diffusion/rd-plus + bordo bianco e pochi dettagli che sono piccole|Alberto, 26.10.2026}}

== Le regole ==
Il bordo bianco di carta è '''nel disegno''', aggiunto da <code>pixel.mjs</code>, non nel CSS (gli avatar sono l'unica eccezione); pochi dettagli, perché si vedono piccole; '''mai tagliate''' («devi assolutamente capire che le immagini non possono essere tagliate»): nessuna immagine tocca il bordo del riquadro, e ogni icona generata va guardata grande e col nome prima di dire che è a posto, perché il modello disegna anche oggetti monchi dentro il riquadro; una versione sola per icona («fai solo 1 versione non 4»). La memoria di Claude che lo ricorda è [[Icone sempre rd-plus (memoria)]]. Nel cercapersone zero le icone sono poi diventate tracciati SVG a un bit ([[Le icone di pzk os]]), e le webp restano come riserva.

{{Vedi anche|Icone sempre rd-plus (memoria)|gpt-image-2|Replicate|Le icone di pzk os}}
[[Categoria:Gli strumenti]]`,
  },

  'bria/remove-background': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/tools/scontorna.mjs', 'albertopecchini.it/tools/pzkko/amici.mjs', 'albertopecchini.it/tools/pzkko/scena/pomodoro.mjs'],
    testo: `'''bria/remove-background''' è il modello su [[Replicate]] che toglie il fondo alle foto vere e ai disegni, usato in tre posti: <code>tools/scontorna.mjs</code> per la fototessera e la figura di Alberto in <code>/studio/</code> (manda la foto e ne usa '''solo la maschera''': i pixel restano quelli originali, poi rifinisce i bordi dei capelli dal colore e toglie l'alone chiaro che sulle pagine scure si vedrebbe; «volto non ritoccato»); <code>tools/pzkko/amici.mjs</code> per [[Le foto vere|gli adesivi degli amici]] sul muro di pzkko (la foto ruotata e ritagliata attorno alle persone, portata a 2048 px, la maschera che resta in <code>lavoro/</code> e non si ripaga, poi il vinile bianco dell'adesivo fustellato); <code>tools/pzkko/scena/pomodoro.mjs</code> per [[Il pomodoro|il pomodoro]] del caricamento (il modello disegna su un grigio neutro, bria dà l'alfa e <code>usa</code> toglie dai pixel a metà il grigio del fondo: la prima volta, sul blu, il blu si vedeva nel succo).

{{Vedi anche|Replicate|Le foto vere|Il pomodoro|gpt-image-2}}
[[Categoria:Gli strumenti]]`,
  },

  'Open-Meteo': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/meteo.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs'],
    testo: `'''Open-Meteo''' è il servizio meteo gratuito e senza chiave da cui [[Il meteo di Mantova (API)|la funzione del meteo]] di pzkko prende il tempo vero di [[Mantova]]: codice WMO, nuvole, pioggia dell'ultima ora e delle ultime 12, visibilità, neve, vento, temperatura. Lo chiede una volta ogni dieci minuti grazie alla cache di Vercel, «non una per visita». Lo usano la [[La scena 3D|scena 3D]] (nuvole, nebbia, pioggia, temporale, neve, il bagnato per terra), il [[Il suono della strada|suono]] (la pioggia, i tuoni, il vento, i grilli al ritmo della temperatura), il [[Il tomodachi|tomodachi]] e la [[La borsa|borsa]], dove il meteo è un [[I fattori del mondo|fattore del mondo]] (sole +2 %, pioggia o temporale −2 %, neve −1 %; sopra i 26° −1,5 %, sotto gli 8° +1,5 %). Senza risposta la scena resta col dopo pioggia di sempre.

{{Vedi anche|Il meteo di Mantova (API)|Il meteo|I fattori del mondo}}
[[Categoria:Gli strumenti]]`,
  },

  'Compiler Explorer': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/telefono/app/compilatore.js', 'albertopecchini.it/pzkko/telefono/zero/os/compilatore.js'],
    testo: `'''Compiler Explorer''' (godbolt.org) è il servizio su cui gira il C dell'app [[Codice C (app)|codice C]] del cercapersone: GCC 14.2 attraverso <code>godbolt.org/api</code>, «gratis, senza chiave, CORS aperto», e Wandbox (<code>gcc-head-c</code>) se il primo non risponde. È una scelta di Alberto del 26 ottobre 2026: il C è vero e compilato fuori, e la pagina avvisa che il codice esce dal sito («non scriverci password», dice anche [[Info (pagina)|la pagina info]]). La logica è in <code>telefono/app/compilatore.js</code> (esporta <code>compila</code>) e la usa anche la versione a 8 bit di pzk os, provata davvero con «ciao alberto, benvenuto su pzkko!».

{{Vedi anche|Codice C (app)|Il compilatore C|Cascadia Code}}
[[Categoria:Gli strumenti]]`,
  },

  'Wikimedia Commons': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/chat/immagini.js', 'albertopecchini.it/public/media/mockup/iphone-18-pro.svg'],
    testo: `'''Wikimedia Commons''' è la fonte delle [[Le foto vere dei quiz|126 foto vere]] dei quiz e dell'app [[Foto (app)|foto]] del cercapersone (<code>chat/immagini.js</code>): monumenti di Mantova, cibo, natura, tech, i mestieri del geometra, l'arte, caricate da lì (anche qualcuna da Imgur) con autore e licenza scritti sotto, '''solo CC BY, CC BY-SA, CC0 e pubblico dominio''' (il 26 ottobre 2026 sono passate da 14 a 126, con la categoria <code>cat</code> per scegliere i finti sbagliati dello stesso tipo). Nel cercapersone zero arrivano a un bit con la diffusione dell'errore di Floyd–Steinberg. Da Commons viene anche l'iPhone 18 Pro vettoriale di [[albertopecchini.it]] (<code>IPhone 18 Pro Vector.svg</code> di Rafael Fernandez, CC BY-SA 4.0: il credito sotto ogni telefono, <code>iphoneCredit()</code>, «non va tolto»).

{{Vedi anche|Le foto vere dei quiz|Foto (app)|Le licenze}}
[[Categoria:Gli strumenti]]`,
  },

  'Google Fonts': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/pzkko/fonts/anton.woff2', 'albertopecchini.it/pzkko/index.html', 'albertopecchini.it/src/styles/fonts.css'],
    testo: `'''Google Fonts''' è da dove vengono i caratteri del [[Il muro|muro]] di pzkko, serviti però da <code>pzkko/fonts/</code> e mai chiesti a Google: Anton e Archivo Black (SIL OFL), Special Elite e Permanent Marker (Apache 2.0); dal 21 ottobre 2026 Abril Fatface, Shrikhand, Bungee, Black Ops One, Rubik Mono One, Alfa Slab One (OFL) e Rock Salt (Apache 2.0), solo il sottoinsieme latino (13–59 KB l'uno), per [[I caratteri del muro|le altre tipografie]] dei volantini; dal 22 ottobre le calligrafie delle [[Le firme della petizione|firme della petizione]], Caveat, Reenie Beanie, Nothing You Could Do (OFL) e Homemade Apple (Apache 2.0), 16–51 KB, scaricate solo quando servono. [[albertopecchini.it]] fa lo stesso con <code>@fontsource-variable</code> (dal 2 novembre 2026 Hanken Grotesk, Fraunces e Geist Mono; prima Archivo, [[Cascadia Code]] e Instrument Serif): «nessuna richiesta a Google Fonts». Su [[Better Call Pekko]] i font veri del 2008–2012 (Comfortaa, Varela Round, Lobster, Bebas Neue, Silkscreen…) stanno nel canvas di Claude Design dei banner. Il [[Il font Fake Receipt|Fake Receipt]] del wallet non è di Google Fonts.

{{Vedi anche|I caratteri del muro|Cascadia Code|Il font Fake Receipt|Le licenze}}
[[Categoria:Gli strumenti]]`,
  },

  'Il font Fake Receipt': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/fonts/fake-receipt.woff2', 'albertopecchini.it/pzkko/wallet/banner.js', 'albertopecchini.it/pzkko/chat/chat.css'],
    testo: `'''Il font Fake Receipt''' è il carattere degli scontrini: dal 22 ottobre 2026 ci scrive la [[La chat col bot|chat col bot]] («la chat scrive in Fake Receipt, il carattere degli scontrini») e il [[Il wallet|wallet]] è «tutto in Fake Receipt», con la borsa come i grafici delle crypto. Il file è <code>pzkko/fonts/fake-receipt.woff2</code>. Nel [[Il banner del wallet|banner del wallet]] (dal 23 ottobre) le lettere sono il Fake Receipt messo led per led: una matrice di 5×8 puntini (passo 93 unità), coi centri trovati con la trasformata di distanza e agganciati alla griglia, e M, W, €, S, $, ° e la punteggiatura rifatti a mano sulla stessa griglia (la tabella <code>LETTERE</code> in <code>banner.js</code>). Lo [[Lo scontrino delle novità|scontrino delle novità]] e la carta «scontrino» della [[La barra in alto|barra]] usano la stessa idea di stampante termica.

{{Vedi anche|Il banner del wallet|Il wallet|La chat col bot|Google Fonts}}
[[Categoria:Gli strumenti]]`,
  },

  'Cascadia Code': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/pzkko/fonts/cascadia-code.woff2', 'albertopecchini.it/src/styles/fonts.css', 'albertopecchini.it/src/styles/tokens.css'],
    testo: `'''Cascadia Code''' è il carattere monospaziato di Microsoft (SIL OFL) che dal 2 ottobre al 2 novembre 2026 su [[albertopecchini.it]] ha preso il posto di IBM Plex Mono per etichette, tasti, dati e il terminale della home (<code>--font-mono</code>, variabile sul peso 200–700, da <code>@fontsource-variable/cascadia-code</code>; etichette e tasti a 14 px, in minuscolo come tutto il sito). Dal 2 novembre 2026, col vestito nuovo del sito (Hanken Grotesk, Fraunces), al suo posto c'è Geist Mono, e Cascadia resta in <code>fonts.css</code> solo come memoria nel commento. Su [[Pzkko.it]] è il carattere del codice nell'app [[Codice C (app)|codice C]] del cercapersone (<code>pzkko/fonts/cascadia-code.woff2</code>, dal 26 ottobre 2026): «quello del cercapersone ha solo maiuscole». Gli strumenti [[La nota in PDF|nota]] e [[Lezioni (strumento)|lezioni]] usano ancora IBM Plex Mono accanto ad Archivo e Instrument Serif, com'era il sito prima.

{{Vedi anche|Google Fonts|Codice C (app)|albertopecchini.it}}
[[Categoria:Gli strumenti]]`,
  },
}
