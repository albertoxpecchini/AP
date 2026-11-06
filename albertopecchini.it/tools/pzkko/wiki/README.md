# pzkkopedia — come si scrive e si aggiorna la wiki di pzkko.it

**pzkkopedia** (`pzkko/wiki/`, pzkko.it/wiki/) è l'enciclopedia del muro: una voce per ogni cosa del
sito, dei suoi strumenti, del repository e della memoria di Claude, tutte collegate fra loro con i link
`[[…]]`, con un'immagine del sito per spiegare, e con la cronologia vera dei commit che hanno toccato
ogni voce.

**La regola (2.11.2026, Alberto: «ricorda che ad ogni push nuovo bisogna aggiornarla»):** prima di ogni
push su `main` la wiki si aggiorna. Lo controllano `controlla.mjs` (in locale, nel workflow Build e nel
gancio di Claude Code prima di `git push`), che dice quali voci sono rimaste indietro rispetto ai file
cambiati, e `aggiorna.mjs`, che rigenera le voci dai dati, la cronologia e lo stato.

```bash
cd albertopecchini.it
node tools/pzkko/wiki/aggiorna.mjs            # rigenera voci dai dati + cronologia + stato (e dice cosa va riletto)
node tools/pzkko/wiki/aggiorna.mjs --foto     # anche le foto del sito in wiki/img/ (serve un browser)
node tools/pzkko/wiki/controlla.mjs           # la wiki è in pari? link rossi, immagini mancanti, fonti che non esistono
node tools/pzkko/wiki/genera.mjs              # solo le voci dai dati (wiki/voci/dati.js) e la cronologia
node tools/pzkko/wiki/foto.mjs [nome…]        # solo le foto
node tools/pzkko/wiki/illustra.mjs [nome…]      # le illustrazioni a pixel (rd-plus) delle mattonelle senza foto del sito
node tools/pzkko/wiki/prova.mjs [titolo…]     # la wiki nel browser: errori, link rossi, immagini rotte, foto in tools/pzkko/lavoro/wiki/
```

## Dove stanno le voci

| File | Cosa c'è |
| --- | --- |
| `pzkko/wiki/voci.js` | unisce i moduli qui sotto in `VOCI` (titolo → voce); wiki.js legge da qui |
| `pzkko/wiki/voci/principale.js` | la Pagina principale e i suoi riquadri, le pagine Aiuto:, Pzkkopedia:, i Portali, le Categorie |
| `pzkko/wiki/voci/sito.js` | il muro: la home 2D, i volantini, la sera, le pagine, le versioni, Vercel, in locale |
| `pzkko/wiki/voci/scena.js` | la scena 3D, le luci, il meteo, le bestie, il suono, la musica, la regia |
| `pzkko/wiki/voci/giochi.js` | i sei giochi, i $pzk, il wallet, la borsa, i conti, la lumachina |
| `pzkko/wiki/voci/cercapersone.js` | il cercapersone zero, pzk os e le sue 22 app |
| `pzkko/wiki/voci/chat.js` | la chat col bot, le attività, lo zaino, l'economia (cassa, rapina, galera, soldi sporchi), shop, quiz, sfide, quest, miniera, cucina, traguardi |
| `pzkko/wiki/voci/dietro.js` | il repository AP, i workflow, Vercel, il server in casa, la banca, le API, gli altri siti, gli strumenti di albertopecchini.it, i servizi usati |
| `pzkko/wiki/voci/memoria.js` | la memoria di Claude (una voce per memoria), CLAUDE.md, le skill, come lavora Alberto con Claude, le persone, i luoghi |
| `pzkko/wiki/voci/dati.js` | **GENERATO** da `genera.mjs`: oggetti, pesci, bestie, reperti, mestieri, quest, squadre, pezzi della miniera, traguardi, sfide, foto dei quiz, giornate della lumachina. Non si tocca a mano |
| `pzkko/wiki/cronologia.js` | **GENERATO**: i commit del repository e, per ogni voce, quelli che hanno toccato le sue `fonti` |
| `pzkko/wiki/stato.json` | **GENERATO**: il commit a cui la wiki è allineata, la data, i numeri |
| `pzkko/wiki/img/` | le immagini della wiki (WebP): le foto del sito di `foto.mjs` e le foto di collaudo copiate da `tools/pzkko/lavoro/` |

## Il formato di una voce

```js
export const VOCI = {
  'Il muro': {
    data: '2026-10-22',                                   // l'ultimo cambiamento vero della cosa descritta
    fonti: ['albertopecchini.it/pzkko/index.html', 'albertopecchini.it/pzkko/README.md'],   // i file del repo di cui parla (dalla radice AP/)
    testo: `{{Infobox
| titolo = Il muro
| immagine = home-giorno.webp
| didascalia = la home di pzkko.it, il muro senza 3D
| dove = pzkko.it/
| dal = 9 ottobre 2026
| file = index.html
}}
'''Il muro''' è la home di [[pzkko.it]]: …

== Com'è fatto ==
…
{{Vedi anche|La scena 3D|I volantini}}
[[Categoria:Il muro]]`,
  },
}
```

- La **chiave** è il titolo: spazi (non trattini bassi), prima lettera maiuscola, il resto come si scrive
  («Il cercapersone zero», «Chat (app)», «Pzkkopedia:Informazioni»). Un link `[[il muro]]` trova
  «Il muro» lo stesso: solo la prima lettera è libera.
- `data` è obbligatoria (AAAA-MM-GG): va nel piè di pagina. `fonti` è obbligatoria e sono percorsi dalla
  radice del repository (`albertopecchini.it/pzkko/…`, `.github/workflows/…`, `CLAUDE.md`): da lì nascono
  la cronologia della voce e l'avviso «questa voce è rimasta indietro». Un file fuori dal repository
  (`C:\pzkko-server`, la memoria di Claude) si cita nel testo, non in `fonti`.
- Il testo è una stringa con gli apici inversi: **mai** un apice inverso né `${` dentro (per il codice si
  usa `<code>…</code>`).
- Prima riga: il titolo in grassetto e cos'è, in una frase. Poi le sezioni `== … ==`. In fondo
  `{{Vedi anche|…}}` e le categorie.
- Si scrive in italiano, in minuscolo come il sito (le maiuscole solo ai nomi propri e a inizio frase),
  **specifico**: numeri, date, nomi dei file e delle funzioni, le parole di Alberto fra virgolette
  («…») quando ci sono nel README. Niente riassunti vaghi: una voce dice come funziona la cosa.
- Un `#RINVIA [[Voce]]` da solo fa un reindirizzamento (per gli alias: «Flipper» → «Il cercapersone zero»).

## Il wikitesto che wiki.js capisce

| Si scrive | Esce |
| --- | --- |
| `'''grassetto'''`, `''corsivo''` | b, i |
| `== Titolo ==`, `=== Sotto ===`, `==== Sotto sotto ====` | le sezioni (vanno nell'indice) |
| `[[Voce]]`, `[[Voce|testo]]`, `[[Voce#Sezione]]`, `[[#Sezione]]` | link interni (rossi se la voce non c'è) |
| `[https://… testo]` | link esterno |
| `* elenco`, `# numerato`, `** annidato` | elenchi |
| `; termine : definizione` e `: rientro` | dl/dd |
| `----` | riga |
| `[[File:nome.webp|thumb|didascalia]]` | un'immagine di `wiki/img/` in un riquadro a destra con la didascalia; `left`, `center`, `300px`, `upright` cambiano posto e misura; senza `thumb` l'immagine è in linea |
| `[[File:/art/chat-app/app-chat.webp|48px]]` | un'immagine del sito (percorso assoluto) |
| `[[File:https://www.albertopecchini.it/media/web/pzk-desktop.webp|thumb|…]]` | un'immagine da un altro sito di Alberto (le catture si rifanno da sole ogni ora) |
| `{{Infobox| titolo = … | immagine = … | didascalia = … | campo = valore …}}` | la scheda a destra; i campi sono liberi, in ordine |
| `{{Vedi anche|A|B|C}}` | la riga «Vedi anche» in fondo |
| `{{Principale|Voce}}` | «Voce principale: …» in testa a una sezione |
| `{{Citazione|testo|chi, quando}}` | le parole di Alberto, in un riquadro |
| `{{Avviso|testo}}` | un avviso in cima alla voce |
| `{{Versione|4.0.0|chiocciola zero|1.11.2026}}` | il bollino di una versione |
| `{| class="wikitable"` … `|-` … `! testa` … `| cella` … `|}` | una tabella (anche `|| cella || cella` sulla stessa riga) |
| `<ref>nota</ref>` e `<references/>` | le note a piè di voce |
| `<code>`, `<kbd>`, `<br>`, `<small>`, `<sup>`, `<sub>`, `<s>`, `<nowiki>` | gli unici tag HTML ammessi |
| `[[Categoria:Nome]]` | la categoria (in fondo) |

## Le categorie

`Il muro`, `La scena 3D`, `Il suono`, `I giochi`, `I soldi`, `Il cercapersone`, `Le app di pzk os`,
`La chat`, `Gli oggetti`, `I pesci`, `Le bestie`, `I reperti`, `I mestieri`, `Le side quest`,
`Le squadre di virtual`, `La miniera`, `I traguardi`, `Gli strumenti`, `Il repository`,
`Il server`, `Vercel`, `I siti di Alberto`, `La memoria di Claude`, `Le persone`, `I luoghi`,
`Le versioni`, `Pzkkopedia`, `Le immagini`.

## Le immagini (wiki/img/)

Le fa `foto.mjs` (il sito fotografato in Chromium, senza 3D; anche `github`, la pagina del repository, e le copie `sito-ap`, `sito-bcp`, `sito-rivalta`, `sito-cascina`, `sito-donelli` delle catture del sito serio), `illustra.mjs` (`memoria`, la chiocciola che legge il quaderno, rd-plus) e `aggiorna.mjs --foto` copia e converte
quelle di collaudo. I nomi, tutti `.webp`:

- il muro: `home-giorno`, `home-notte`, `home-intera`, `home-telefono`, `storia`, `storia-intera`, `404`,
  `gadget`, `oggetti`, `traguardi`, `info`, `wiki`, `benvenuto`, `manutenzione` (il cartello, da `tools/pzkko/lavoro/cartello-computer.png`), `wallet`, `regia`, `petizione`,
  `lezioni`, `barra`
- i giochi (le finestre aperte): `roulette`, `blackjack`, `mine`, `dado`, `moneta`, `virtual`
- la scena 3D (da `tools/pzkko/lavoro/`): `scena-cima`, `scena-meta`, `scena-fondo`, `scena-telefono`,
  `scena-storia`, `muro-desk`, `muro-telefono`, `storia-desk`
- il cercapersone zero (da `lavoro/zero/`): `zero-muro`, `zero-aperto`, `zero-menu`, `zero-cavo`,
  `zero-volo`, `zero-saluto`, `zero-tasto`, `zero-guida`, `zero-telefono`
- le app di pzk os: `app-<id>` (l'lcd 768 × 384 alla prima schermata del collaudo, senza perdita) e `app-<id>-collaudo`
  (il cercapersone zero in 3D fotografato durante il collaudo dell'app) per chat, profilo, account, negozio, pzkstore, sfide, quiz, missioni,
  giocatori, zaino, miniera, foto, virtual, banca, rapina, lavatrice, decifratore, conversioni,
  calcolatrice, compilatore, cucina, impostazioni
- dal sito serio (indirizzo assoluto, non copiate): `https://www.albertopecchini.it/media/web/pzk-desktop.webp`,
  `pzk-notte-desktop.webp`, `pzk-mobile.webp`, `pzk-tablet.webp`, `pzk-roulette-tablet.webp`,
  `pzk-404-mobile.webp`, `pzk-desktop-tall.webp`, `pzk-mobile-tall.webp`, `pzk-bologna.webp`;
  e per gli altri siti `ap-desktop.webp`, `rivalta-desktop.webp`, `cascina-desktop.webp`, `dd-desktop.webp`
- le icone del sito: `/art/chat-app/app-<id>.webp` (chat, shop, sfide, quiz, quest, giocatori, zaino, foto,
  banca), `/art/chat-app2/app-virtual.webp`, `/art/chat-app3/app-<id>.webp` (profilo, account, pzkstore,
  conversioni, calcolatrice, compilatore, cucina, lavatrice, decifratore, rapina), `/art/chat-miniera/app-miniera.webp`,
  `/art/chat-giochi/<roulette|blackjack|mine|dado|moneta|virtual>.webp`, `/art/chat-pzk/portafoglio.webp`,
  `/art/chat-pzk/zero.webp`, `/art/zero/zero-piccolo.webp`, `/art/wallet/portafoglio.webp`,
  `/art/wallet-banner/banner.webp`, `/art/storia/foto-1.webp`, `/art/lezioni/appunti.webp`, `/og.jpg`

`controlla.mjs` segnala ogni `[[File:…]]` che non esiste.

## I titoli canonici

I link si scrivono con questi titoli (la prima lettera può essere minuscola). Chi aggiunge una voce la
aggiunge anche qui.

**principale.js** — Pagina principale/Benvenuti, Pagina principale/Voce in vetrina, Pagina principale/Lo sapevi che,
Pagina principale/Ricorrenze, Pagina principale/Eventi correnti, Pagina principale/Nelle altre lingue,
Pagina principale/Portali, Pagina principale/Progetti fratelli, Aiuto:Aiuto, Aiuto:Modificare una pagina,
Aiuto:Wikitesto, Pzkkopedia:Informazioni, Pzkkopedia:Avvertenze, Pzkkopedia:Informativa sulla privacy,
Pzkkopedia:Codice di condotta, Pzkkopedia:Dichiarazione sui cookie, Pzkkopedia:Portale comunità,
Pzkkopedia:Come si aggiorna, Portale:Il muro, Portale:La scena 3D, Portale:I giochi, Portale:I soldi,
Portale:Il cercapersone, Portale:Gli strumenti, Portale:Il repository, Portale:La memoria di Claude, Pzkkopedia

**sito.js** — Pzkko.it, Il muro, La saracinesca di Bologna, La storia del muro, L'insegna, La lamiera,
I volantini, I tagliandi, Le carte dei volantini, I caratteri del muro, I manifesti e la roba degli altri,
Le zone del muro, I siti in cima, Il volantino «ti serve un sito?», Vendo il ciao, TikTok sul muro,
Gli adesivi degli amici, Il meme degli auguri, La petizione, Le penne della petizione, Le firme della petizione,
La sera a Mantova, La strada di notte, Le auto che passano, Le mosche e le formiche del muro, La goccia della condensa,
Ferma quando è ferma, Come parte la home, La 404, La disposizione, La serranda, Le pile, pzk$meeting,
Gli strumenti di pzkko, La barra in alto, Gadget (pagina), Oggetti (pagina), Traguardi (pagina), Info (pagina),
Lo scontrino delle novità, La manutenzione di Monaco, Le versioni di pzkko, Il portafoglio MagSafe, La scrivania di pzkko, Il muro (versione 2.0),
Lumaca catodica, Chiocciola zero, Le immagini del muro, I fogli di gpt-image-2, Le foto vere, Vercel (pzkko),
In locale (pzkko), I crediti di pzkko, La favicon e l'og, Il manuale del Landini, Il meme unimore contro unibo,
La roba per terra (2D)

**scena.js** — La scena 3D, Il caricamento è il pomodoro, Il pomodoro, L'arrivo, Le luci a insiemi,
Le trappole della compilazione, La scena sul telefono, La vetrina, Il posto, Il fronte del negozio, La porta a vetri,
La targa del civico 28, Il citofono, Il lucchettone, I graffiti e gli adesivi della facciata, L'intonaco vero,
Dentro il negozio, Il PC con Ubuntu, I fogli (scena), Le lettere dell'insegna, L'acqua, Il muro bagnato, Le bestie,
Le formiche, Le mosche, Le zanzare tigre, Le blatte, Il marciapiede, Le pozzanghere, La spazzatura per terra,
I grissini alla pizza, Le cose che si toccano, Il chiusino di pzkkonet, Il portachiavi della banca $pzk,
Le banconote per terra, Il meteo, Il costo e la qualità, Il tetto della scheda, La scena in Blender,
Le prove della scena, Le foto dei volantini, Le foto del caricamento, Le trame, I disegni della scena, Gli atlanti,
La regia, Il contesto perso, L'altra pagina già scaricata, Il suono, Il suono della strada, Le campane, Gli uccelli,
I corpi percossi, I suoni dell'interfaccia, La musica, Le sigle delle app, La cornice, Il nastro suono,
three.js, Rapier, Le prove del suono

**giochi.js** — I giochi, La finestra dei giochi, La roulette, Il blackjack, Le mine, Il dado, La moneta, Virtual,
Il calendario di virtual, Le squadre di virtual, Le quote di virtual, Lo schermino di virtual, La schedina,
Le fiches, Le prove dei giochi, I $pzk, La sessione, Il conto, I lotti numerati, Il libro dei conti,
Le classifiche, Il regalo di Instagram, Il sussidio, Il wallet, Il banner del wallet, La batteria, Gli EUR€,
La borsa, Il cambio PZK/EUR€, I fattori del mondo, I conti, Gli invii, Le operazioni della banca,
Il conto di Alberto, La lumachina, La salute della lumachina, I portafogli separati, Le banconote della banca $pzk,
Le trappole della fisica, I numeri corti

**cercapersone.js** — Il cercapersone zero, Il cercapersone nero, Il modello dello zero, pzk os, L'lcd,
Il carattere 5×7, Le icone di pzk os, I sei tasti, Il clic del mouse, La home di pzk os, La guida di pzk os,
Il menu di pzk os, La barra di stato, Le regole per le app, Il collaudo delle app, Il tasto sul muro,
La luce dello zero, La scritta PZKKO, Il cavo di ricarica, Il led rosso, L'inclinazione col mouse, Il saluto,
Le app di pzk os, Chat (app), Profilo (app), Account (app), Shop (app), Pzkstore (app), Sfide (app), Quiz (app),
Quest (app), Giocatori (app), Zaino (app), Miniera (app), Foto (app), Virtual (app), Banca (app), Rapina (app),
Lavatrice (app), Decifratore (app), Bin·hex (app), Calcoli (app), Codice C (app), Cucina (app), Impostazioni (app),
La chat col bot, Il bot pzk, I comandi della chat, Il testo predittivo, I consigliati, I tasti rapidi,
Le attività, La pesca, La caccia, Lo scavo, Il lavoro, I mestieri, Lo spazzino di uffici, I lavori rischiosi,
I minigiochi della chat, La morte, Il cercapersone scassato, Lo zaino, I bonus, La sincronizzazione fra dispositivi,
Il canale sempre aperto, Il canale diretto, L'economia, L'offerta di $pzk, La cassa di pzk, I portafogli smarriti,
I soldi sporchi, La rapina, La galera, La cauzione, La lavatrice, Il decifratore, Il pzkstore, Le app installate,
Il tomodachi, Le facce del profilo, I traguardi, Le sfide giornaliere, I quiz, Le side quest, Le foto vere dei quiz,
Il database dei giocatori, Le notizie della banca, Lo shop, I reparti dello shop, Le casse, Il gratta e vinci,
La miniera, I PC pronti della miniera, La cucina, Il compilatore C, La calcolatrice del geometra, Le conversioni fra basi,
Il premio giornaliero, L'esperienza e i livelli, Il rider

**dietro.js** — Il repository AP, I rami del repository, I messaggi di commit, Le catture dei siti (workflow),
Il controllo della build (workflow), Vercel, Il progetto Vercel pzkko, Il server dei dati in casa, La banca sul server,
Il contratto della banca, La regia del server, Il tunnel Tailscale, Vercel Blob, Il custode del server,
Lo storico del server, Le API di pzkko, Le firme (API), Il meteo di Mantova (API), Il wallet (API), La borsa (API),
I giocatori (API), Il canale (API), Il ponte firmato, albertopecchini.it, Better Call Pekko, rivaltasulmincio.it,
cascinafontana.xyz, Ing. Dario Donelli, Il credito nei siti dei clienti, Gli strumenti di albertopecchini.it,
Le catture, Le copertine, Le figurine, Le mascotte, I burattini, L'aragosta e l'inchiostro, La cartina,
Il generatore di email, Il compositore email, Lezioni (strumento), La nota in PDF, L'anteprima og, L'indirizzo .onion,
Le tavole, Il lettore DWG, Wrapped 5BT, Le immagini di Better Call Pekko, Il contatore di Better Call Pekko,
Il controllo delle pagine, Replicate, gpt-image-2, retro-diffusion rd-plus, bria/remove-background,
La memoria di Claude, Icone sempre rd-plus (memoria), Firma per i PDF (memoria), Server in casa (memoria),
Rami per sito (memoria), Cercapersone zero (memoria), Regole app pzk os (memoria), Banca sul server (memoria),
Riavvio server di casa (memoria), CLAUDE.md, Le skill di Claude Code, Skill lezione, Skill nota, Skill serranda,
Claude Code, Come lavora Alberto con Claude, PRODUCT.md, DESIGN.md, I file fuori dal repository, Alberto Pecchini,
pzkko (il nome), Pekko, La chiocciola gigante africana, La nutria, Mantova, Rivalta sul Mincio, Il Mincio, Bologna,
Unimore, Le licenze, Cosa si salva, La beta, Il GitHub di Alberto, La storia del repository, Il sito precedente (React),
Il font Fake Receipt, Cascadia Code, Open-Meteo, Compiler Explorer, Wikimedia Commons, Google Fonts

**dati.js (generato)** — un titolo per ogni oggetto dello shop (col suo nome: «Pzk-kola», «Tortelli di zucca»,
«Canna da pesca», «Cassa dei Gonzaga»…), pesce («Alborella», «Carpa d'oro dei Gonzaga»…), bestia («Nutria (bestia)»
se il nome è già preso, altrimenti «Piccione»…), reperto («Moneta con la faccia di Virgilio»…), cosa dell'ufficio
(«Chiavetta usb», «Wallet pzk cifrato»…), mestiere («Rider», «Cameriere alla sagra»…), side quest («Il civico 28»…),
squadra di virtual («Juvenclub», «Inder»…), pezzo della miniera («Il muletto da ufficio»…), più le liste:
«Elenco degli oggetti», «Elenco dei pesci», «Elenco delle bestie», «Elenco dei reperti», «Elenco dei mestieri»,
«Elenco delle side quest», «Elenco delle squadre di virtual», «Elenco dei pezzi della miniera», «Elenco dei traguardi»,
«Elenco delle sfide», «Elenco delle foto dei quiz», «Le giornate della lumachina», «Elenco degli argomenti dei quiz»,
«Elenco dei commit», «Le app di pzk os (tabella)», «Elenco delle cose dell’ufficio»; e un rinvio dal nome intero («Una carpa» → «Carpa») e dal titolo col qualificatore («Telefono (oggetto)» → «Telefono»). Una cosa generata con lo stesso titolo di una voce a mano prende il qualificatore da sola («La petizione (quest)»).

## La pagina principale e l'aspetto (2.11)

- **La vetrina ruota**: una voce al giorno fra quelle di `VETRINA` in `wiki.js`; foto e attacco vengono dalla voce stessa (`ritrattoDi`), quindi restano veri.
- **Le mattonelle** dei portali e dei progetti fratelli: `PORTALI` e `FRATELLI` in `wiki.js`, con le immagini di `wiki/img/`.
- **I riquadri** hanno i colori dei pennarelli del muro (DESIGN.md) e il nastro adesivo; **la testata** è la lamiera con l'insegna (di notte i neon).
- **Il tema scuro** segue il sistema; «Aspetto» nel piè di pagina lo forza (`pzkkopedia-tema` in localStorage). Tutti i colori sono variabili in `wiki.css`: un colore nuovo va scritto come variabile, chiara e scura.
- **Nelle voci** l'infobox prende il colore della prima categoria (`TINTE` in `wiki.js`), «Vedi anche» è a mattonelle con la foto e la prima frase della voce collegata.
- **Le voci generate** hanno la sezione «Dove si vede» con la schermata dell'app (`DOVE` e `DOVE_TITOLO` in `genera.mjs`).
