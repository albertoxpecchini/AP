// pzkkopedia (2.11.2026): le voci sulla memoria di Claude, sulle regole del progetto, su come Alberto lavora con Claude,
// sulle persone e sui luoghi. Il formato è in tools/pzkko/wiki/README.md. Le memorie di Claude stanno FUORI dal
// repository (nella cartella di Claude del progetto AP, sul pc di Alberto): qui se ne descrive il contenuto, mai i segreti.

export const VOCI = {
  'La memoria di Claude': {
    data: '2026-10-31',
    fonti: ['CLAUDE.md', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = La memoria di Claude
| immagine = /art/chat-pzk/zero.webp
| didascalia = il cercapersone zero: la memoria più lunga parla di lui
| dove = la cartella di Claude del progetto AP, sul pc di Alberto (fuori dal repository)
| indice = MEMORY.md
| memorie = 8 (al 31.10.2026)
| tipi = user · feedback · project · reference
| nata = 26 ottobre 2026
}}
'''La memoria di Claude''' è la cartella di file in cui [[Claude Code]] si scrive, sessione dopo sessione, quello che [[Alberto Pecchini|Alberto]] gli ha detto di ricordare «per sempre»: una regola, una correzione, un fatto sul progetto che non si ricava dal codice. Vive fuori dal [[Il repository AP|repository AP]] (che è pubblico su GitHub), nella cartella di Claude dedicata al progetto <code>c--Users-Alberto-Documents-AP</code> sul pc di Alberto, e si carica da sola all'inizio di ogni sessione aperta nella cartella <code>Documents\\AP</code>.

== Com'è fatta ==
Ogni memoria è un file Markdown con un solo fatto e un'intestazione (frontmatter) con tre campi:
* <code>name</code>: il nome breve, coi trattini (<code>server-in-casa</code>, <code>regole-app-pzk-os</code>), che è anche quello con cui le altre memorie la citano fra doppie quadre;
* <code>description</code>: una riga che dice cosa c'è dentro, usata per decidere se la memoria serve alla sessione;
* <code>type</code>: il tipo. <code>user</code> (chi è Alberto, come preferisce lavorare), <code>feedback</code> (una correzione o una conferma sul modo di lavorare, col perché), <code>project</code> (lo stato di un lavoro, un vincolo, una scelta non scritta nel codice, con le date assolute), <code>reference</code> (un rimando a una cosa esterna).
Nel corpo, per le memorie <code>feedback</code> e <code>project</code>, ci sono le righe '''Why''' (perché è nata, spesso con le parole di Alberto) e '''How to apply''' (cosa fare la prossima volta). Le memorie si linkano fra loro con <code><nowiki>[[nome]]</nowiki></code>, esattamente come le voci di questa wiki.

<code>MEMORY.md</code> è l'indice: una riga per memoria, col titolo, il file e un gancio di poche parole. È l'unico file che entra per intero nel contesto di ogni sessione; i file veri si rileggono quando servono.

== Come si aggiorna ==
Si scrive una memoria quando Alberto dà una regola («tieni il modello per sempre», «salvatele e memorizzale per sempre», «togli vercel come server per sempre»), quando corregge un errore di Claude (il push su main senza chiederlo del 26.10) o quando una cosa del progetto non sta scritta da nessuna parte (dove sta l'OBJ del cercapersone, come si riaccende il server). Prima di scriverla si controlla che non esista già un file sullo stesso tema: in quel caso si aggiorna quello. Una memoria che si rivela sbagliata si cancella. Non ci va quello che il repository sa già: la struttura del codice, le correzioni passate, la storia dei commit, il contenuto di [[CLAUDE.md]].

== Le otto memorie ==
{| class="wikitable"
! memoria !! tipo !! aggiornata il !! cosa dice
|-
| [[Icone sempre rd-plus (memoria)]] || feedback || 26.10.2026 || le icone di pzkko si fanno con [[retro-diffusion rd-plus]], bordo bianco, pochi dettagli, mai tagliate
|-
| [[Firma per i PDF (memoria)]] || project || 26.10.2026 || la firma corsiva di Alberto per i PDF: stile n. 4, dentro la cella, luogo solo Rivalta
|-
| [[Server in casa (memoria)]] || project || 31.10.2026 || i dati dei siti stanno in [[Il server dei dati in casa|C:\\pzkko-server]] dietro [[Il tunnel Tailscale|Tailscale Funnel]], mai più storage di Vercel
|-
| [[Rami per sito (memoria)]] || feedback || 26.10.2026 || un ramo per sito nel repo AP, ma la produzione parte solo da main, e main solo se Alberto lo chiede
|-
| [[Cercapersone zero (memoria)]] || project || 31.10.2026 || il mockup 3D del [[Il cercapersone zero|cercapersone zero]]: da dove viene, come si rigenera, cosa Alberto ha bocciato
|-
| [[Regole app pzk os (memoria)]] || feedback || 29.10.2026 || prima di toccare un'app di [[pzk os]]: [[Le regole per le app|REGOLE.md]] e [[Il collaudo delle app|il collaudo]]
|-
| [[Banca sul server (memoria)]] || project || 31.10.2026 || dal 31.10 soldi, zaino e giochi si decidono nella [[La banca sul server|banca]] sul server, il browser chiama solo <code>pzk.fai</code>
|-
| [[Riavvio server di casa (memoria)]] || project || 31.10.2026 || come riaccendere il server senza rompere [[Il custode del server|il custode]]; [[La regia del server|la regia]] sulla 8788
|}

Le memorie si rimandano a vicenda: «cercapersone-zero» cita «regole-app-pzk-os», «rami-per-sito» e «icone-rd-plus»; «banca-sul-server» cita «riavvio-server-casa» e «server-in-casa»; «server-in-casa» cita «rami-per-sito». È una piccola wiki prima di questa.

== Cosa non c'è ==
Nessun segreto: il segreto del server lo copia Alberto su [[Vercel]] e Claude non lo legge; i PIN non stanno nel codice; la chiave di amministrazione del wallet sta in <code>.env.local</code>, escluso da Git. La memoria dice ''dove'' stanno le cose, non ''cosa'' c'è dentro.

== E questa wiki ==
Dal 2.11.2026 la regola nuova è [[Pzkkopedia:Come si aggiorna|aggiornare pzkkopedia a ogni push]]: anche lei finisce in una memoria e in [[CLAUDE.md]], così ogni sessione la sa.

{{Vedi anche|Claude Code|Come lavora Alberto con Claude|CLAUDE.md|Le skill di Claude Code|I file fuori dal repository}}
[[Categoria:La memoria di Claude]]
[[Categoria:Pzkkopedia]]`,
  },

  'Icone sempre rd-plus (memoria)': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/pzkko/pixel.mjs', 'albertopecchini.it/pzkko/chat/icone.js', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Icone sempre rd-plus
| immagine = /art/chat-app3/app-pzkstore.webp
| didascalia = la piastrella del pzkstore, a pixel, col bordo bianco di carta nel disegno
| file = icone-rd-plus.md
| tipo = feedback
| scritta il = 26 ottobre 2026
| aggiornata il = 26 ottobre 2026
| collegata a = nessuna (la citano cercapersone-zero e rami-per-sito)
| strumento = tools/pzkko/pixel.mjs
}}
'''Icone sempre rd-plus''' è la memoria di [[La memoria di Claude|Claude]] che fissa come si fanno le icone di [[pzkko.it]]: tutte con [[retro-diffusion rd-plus]] su [[Replicate]], a pixel, col bordo bianco di carta e pochi dettagli, mai più con [[gpt-image-2]].

== Il fatto ==
Tutte le icone di pzkko (i fogli <code>FOGLI_CHAT</code> di <code>chat/icone.js</code>: gli oggetti dello [[Lo shop|shop]], i pesci, il bot, i mestieri, le piastrelle delle [[Le app di pzk os|app]]) si generano con '''retro-diffusion/rd-plus''', una predizione per icona, poi il '''bordo bianco di carta''' aggiunto nel disegno (non nel CSS) e '''pochi dettagli''', perché si vedono piccole. Lo strumento è <code>tools/pzkko/pixel.mjs</code> (il token di Replicate in <code>albertopecchini.it/.env.local</code>; <code>--rifai</code> rielabora i PNG già scaricati senza pagare).

== Perché ==
{{Citazione|tieni il modello per sempre|Alberto, 26.10.2026}}
{{Citazione|falle tutte con retro-diffusion/rd-plus + bordo bianco e pochi dettagli che sono piccole|Alberto, 26.10.2026}}
Le prime piastrelle a pixel gli erano piaciute più di quelle disegnate da gpt-image-2.

Lo stesso giorno, un'altra regola: {{Citazione|devi assolutamente capire che le immagini non possono essere tagliate|Alberto, 26.10.2026}} Nessuna immagine deve toccare il bordo del suo riquadro: <code>pixel.mjs</code> le scarta da solo e <code>--controlla</code> le elenca, e va lanciato dopo ogni giro. Ma <code>--controlla</code> vede solo i tagli contro il bordo: il modello disegna anche oggetti già monchi dentro il riquadro (bordi dritti, sdoppiati, ombre spezzate, il mestiere che manca). Quindi ogni icona va '''guardata''', grande e col nome, su un foglio di controllo, prima di dire che è a posto: Alberto le ha trovate lui, e non deve succedere. E {{Citazione|fai solo 1 versione non 4|Alberto, 26.10.2026}}: le candidate multiple solo se le chiede.

== Come si applica ==
Ogni icona nuova (le app future, gli oggetti nuovi dello shop) passa da <code>pixel.mjs</code> con lo stesso stile. Gli [[Le facce del profilo|avatar del profilo]] (<code>av-*</code>) sono l'unica eccezione al bordo bianco. Le immagini grandi (i [[I volantini|volantini]], la [[La scena 3D|scena]], il [[Il cercapersone zero|cercapersone]]) non sono icone: la regola non le tocca. Dal 29.10 le icone di [[pzk os]] sono tracciati SVG a un bit in <code>os/icone.js</code> ([[Le icone di pzk os]]): le webp di rd-plus restano le piastrelle della pagina [[Gadget (pagina)|gadget]] e la riserva per i nomi senza SVG.

{{Vedi anche|retro-diffusion rd-plus|Le icone di pzk os|Le immagini del muro|La memoria di Claude}}
[[Categoria:La memoria di Claude]]`,
  },

  'Firma per i PDF (memoria)': {
    data: '2026-10-26',
    fonti: ['CLAUDE.md', 'albertopecchini.it/tools/nota/README.md'],
    testo: `{{Infobox
| titolo = Firma per i PDF
| file = firma-pdf.md
| tipo = project
| scritta il = 26 ottobre 2026
| aggiornata il = 26 ottobre 2026
| dove = C:\\Users\\Alberto\\Documents\\firma (fuori dal repository)
| stile = n. 4, La Belle Aurore, inchiostro blu, inclinata −1,5°
| strumenti = firma.mjs, crea.mjs
}}
'''Firma per i PDF''' è la memoria di [[La memoria di Claude|Claude]] su come si appone la firma corsiva «Alberto Pecchini» sui PDF che [[Alberto Pecchini|Alberto]] manda da firmare (moduli, informative, dichiarazioni).

== Il fatto ==
Tutto sta in <code>Documents\\firma</code>, '''fuori dal repository AP''' che è pubblico su GitHub: la firma non deve finire lì. Lo stile scelto dal 26.10.2026 è il '''n. 4''': il carattere La Belle Aurore, inchiostro blu, inclinata di −1,5°. <code>firma.png</code> si rigenera con <code>node crea.mjs 4 blu -1.5</code>, è ritagliata sull'inchiostro e <code>firma.json</code> ne dà il rapporto altezza/larghezza (0,1516); <code>node crea.mjs</code> da solo rifà <code>prove.png</code> con gli otto stili.

I comandi di <code>firma.mjs</code>:
* <code>trova &lt;pdf&gt;</code> elenca le righe «Firma», «In fede», i trattini, con pagina e millimetri dall'alto a sinistra;
* <code>vedi &lt;pdf&gt; &lt;pagina&gt;</code> fa un PNG della pagina con la griglia in millimetri, per controllare;
* <code>metti &lt;pdf&gt; &lt;pagina,x,y&gt;…</code> mette solo firme, col centro in (x, y) mm;
* <code>compila &lt;pdf&gt; &lt;piano.json&gt;</code> per i moduli: firme, croci, testi (Times nero), spunte, coperture bianche, linee.
L'uscita è <code>&lt;nome&gt;-firmato.pdf</code> accanto all'originale, che non si tocca; gestisce le pagine ruotate e il CropBox. opentype.js 2.0.0 ha un difetto in <code>toPathData</code> (scrive NaN): <code>crea.mjs</code> costruisce il tracciato da sé.

== Le regole, con le parole di Alberto ==
* '''La firma sta dentro la cella, la più grande che ci sta''': larghezza = (altezza della riga − 0,8 mm) / rapporto, centrata (righe di 7 mm → ~41 mm, di 6 mm → ~35 mm). Debordare dalla tabella non va bene (è successo e non gli è piaciuto), e nemmeno le firme piccole.
* '''Luogo: solo «Rivalta sul Mincio, data».''' Se il modulo ha un luogo prestampato diverso (un modulo dell'Università di San Marino diceva «Repubblica di San Marino»), lo si copre di bianco e si scrive Rivalta al suo posto, nello stesso corpo. Non si barra: {{Citazione|ci sei o ci fai?|Alberto, 26.10.2026}}
* '''Caselle: spunte ✓ grandi''' (misura 1,6), non X piccole.
* Quando dice «firmalo» su un modulo, si compilano anche nominativo, «Io sottoscritto/a» e la data di oggi, e glielo si dice.

== Come si applica ==
<code>trova</code> (le caselle sono glifi senza testo: si misurano dai pixel di <code>vedi</code>) → <code>compila</code> → <code>vedi</code> e si ingrandisce il risultato prima di dire che è fatto. È lo stesso principio del [[Il collaudo delle app|collaudo]] e delle [[Le catture|catture]]: si guarda l'immagine, non si crede al comando.

{{Vedi anche|La nota in PDF|Skill nota|I file fuori dal repository|Rivalta sul Mincio}}
[[Categoria:La memoria di Claude]]`,
  },

  'Server in casa (memoria)': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Server in casa
| file = server-in-casa.md
| tipo = project
| scritta il = 29 ottobre 2026
| aggiornata il = 31 ottobre 2026
| collegata a = rami-per-sito
| dal = 29 ottobre 2026
| dove = C:\\pzkko-server, dietro Tailscale Funnel
}}
'''Server in casa''' è la memoria di [[La memoria di Claude|Claude]] che dice dove stanno i dati di [[pzkko.it]] e di [[Better Call Pekko]]: sul pc di [[Alberto Pecchini|Alberto]], in [[Il server dei dati in casa|C:\\pzkko-server]], e mai più su uno storage di [[Vercel]].

== Il fatto ==
Dal 29.10.2026 i dati (i conti del [[Il wallet|wallet]], gli [[Lo zaino|zaini]], la [[La borsa|borsa]], i [[Il database dei giocatori|giocatori]], le [[Le firme della petizione|firme]], il database di Better Call Pekko) stanno in <code>C:\\pzkko-server</code>: un server Node firmato HMAC, che ascolta solo su 127.0.0.1, dietro il tunnel HTTPS di [[Il tunnel Tailscale|Tailscale Funnel]] (<code>https://desktop-inpvhr2.tail6c90b3.ts.net</code>). Vercel fa solo da sito e da funzioni: le funzioni ci arrivano con <code>pzkko/api/_server.mjs</code>, e i nomi ammessi dei file sono <code>pzkko/…</code> e <code>bcp/…</code>.

== Perché ==
Il 28.10.2026 [[Vercel Blob]] si è bloccato su tutto l'account (le soglie del piano Hobby superate: 10.000 letture e 2.000 scritture al mese, che [[Il canale sempre aperto|il canale sempre aperto]] consumava a due ogni tre secondi) e nessuno poteva più entrare nei conti. {{Citazione|togli vercel come server per sempre; restiamo da me e dal tunnel|Alberto, 29.10.2026}}

== Come si applica ==
Per salvare dati di un sito non si propone Blob, KV né altri storage di Vercel: si usa il server di casa. Il segreto (<code>config\\config.json</code>) Claude non lo legge: lo copia Alberto su Vercel.

=== Quando pzkko dice «in pausa» col server acceso ===
Il 31.10.2026, dopo un riavvio con cambio di rete, la porta 8787 era in ascolto e <code>tailscale funnel status</code> diceva «on», ma Vercel rispondeva «fetch failed». Un <code>curl</code> dal pc al tunnel non prova niente: passa dalla tailnet (IP 100.x nel registro), e il test diretto agli ingressi di Tailscale da quella rete fallisce sempre. La prova vera è <code>curl https://www.pzkko.it/api/wallet/</code> (200 coi numeri), o i runtime log di Vercel del progetto pzkko. Il rimedio che ha funzionato: <code>tailscale down</code> e <code>tailscale up</code> (<code>tailscale funnel --bg 8787</code> da solo non bastava). Dal 31.10 lo fa da solo [[Il custode del server|la guardia del tunnel]] in <code>avvia.mjs</code>: ogni due minuti chiede al sito, dopo tre fallimenti fa down/up, al più ogni quindici minuti, e lo scrive in <code>log\\avvia.log</code>.

Nota: <code>pzkko.it</code> senza www ha anche un record A di Aruba (62.149.128.40) che chiude la connessione TLS: va tolto dal DNS.

{{Vedi anche|Il server dei dati in casa|Il tunnel Tailscale|Vercel Blob|Banca sul server (memoria)|Riavvio server di casa (memoria)}}
[[Categoria:La memoria di Claude]]`,
  },

  'Rami per sito (memoria)': {
    data: '2026-10-26',
    fonti: ['README.md', 'albertopecchini.it/README.md'],
    testo: `{{Infobox
| titolo = Rami per sito
| file = rami-per-sito.md
| tipo = feedback
| scritta il = 26 ottobre 2026
| aggiornata il = 26 ottobre 2026
| collegata a = icone-rd-plus
| rami = main · albertopecchini.it · bettercallpekko.it · pzkko.it
}}
'''Rami per sito''' è la memoria di [[La memoria di Claude|Claude]] su come si usano i rami del [[Il repository AP|repository AP]]: ce n'è uno per sito, ma la produzione di tutti e tre i siti parte solo da <code>main</code>, e su <code>main</code> si va solo se [[Alberto Pecchini|Alberto]] lo chiede.

== Il fatto ==
Nel repo <code>albertoxpecchini/AP</code> ci sono [[I rami del repository|i rami dei siti]]: <code>albertopecchini.it</code>, <code>bettercallpekko.it</code>, <code>pzkko.it</code>, oltre a <code>main</code>. Il lavoro su pzkko va nel ramo <code>pzkko.it</code>, non in rami nuovi inventati da Claude. Ma su [[Vercel]] la produzione dei tre progetti (pzkko, albertopecchini.it, bcp) parte solo da <code>main</code>: un push sui rami dei siti fa solo un'anteprima, protetta da login, e sul sito vero non arriva niente. Ogni push su <code>main</code> rimanda in produzione tutti e tre.

== Perché ==
Il 26.10.2026 Claude aveva creato un ramo <code>pzkko/quiz-wiki-economia</code> e poi aveva fatto push su <code>main</code> senza chiedere. {{Citazione|dovresti fare pulizia e non fare confusione, ci sono i rami per ogni sito, tutti in repo AP|Alberto, 26.10.2026}} La sera stessa Claude ha pushato [[La musica|la musica]] solo su <code>pzkko.it</code>: {{Citazione|non sento la musica nel sito, hai pushato tutto?|Alberto, 26.10.2026}} Poi Alberto ha scelto «tutto su main».

== Come si applica ==
Prima di committare si guarda <code>git branch -a</code>; il lavoro va sul ramo del suo sito. Se Alberto vuole vederlo online serve anche <code>main</code>: glielo si dice subito e lo si chiede esplicitamente, senza pushare su <code>main</code> da soli. Nella cartella AP lavorano più sessioni insieme e ci sono modifiche non proprie: si committano solo i propri file (un indice temporaneo e <code>commit-tree</code>, senza cambiare ramo). La [[Skill serranda|skill serranda]] lo ripete: «non fare commit né push se Alberto non lo chiede: ogni push su main va online». E da oggi, prima di ogni push, [[Pzkkopedia:Come si aggiorna|si aggiorna questa wiki]].

{{Vedi anche|I rami del repository|I messaggi di commit|Vercel|Come lavora Alberto con Claude}}
[[Categoria:La memoria di Claude]]`,
  },

  'Cercapersone zero (memoria)': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/telefono/zero/zero.js', 'albertopecchini.it/tools/pzkko/zero/modello.mjs', 'albertopecchini.it/tools/pzkko/zero/prova.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Cercapersone zero
| immagine = zero-aperto.webp
| didascalia = il cercapersone zero aperto, con pzk os sullo schermo
| file = cercapersone-zero.md
| tipo = project
| scritta il = 29 ottobre 2026
| aggiornata il = 31 ottobre 2026
| collegata a = regole-app-pzk-os, rami-per-sito, icone-rd-plus
}}
'''Cercapersone zero''' è la memoria di [[La memoria di Claude|Claude]] sul [[Il cercapersone zero|cercapersone zero]], il mockup 3D di [[pzkko.it]] con [[pzk os]] a 8 bit dentro lo schermo: da dove viene il modello, come si rigenera, come si collauda, e cosa [[Alberto Pecchini|Alberto]] ha bocciato.

== Il fatto ==
Il 29.10.2026 Alberto ha voluto il cercapersone nuovo in 3D, dal mockup OBJ di Rhino del Flipper Zero (34 MB, uno zip scaricato sul suo pc: '''non sta nel repository''', troppo grosso). Dal 31.10.2026 è l'unico cercapersone, per tutti: {{Citazione|fai che cercapersone zero è predefinito e quello attuale si elimina per sempre|Alberto, 31.10.2026}} [[Il cercapersone nero]] è stato cancellato (le foto, <code>telefono.css</code>, le app in HTML; di <code>telefono/app/</code> resta solo la logica che pzk os importa), niente più <code>?vecchio</code>, l'oggetto <code>zero</code> dello [[Lo shop|shop]] è fuori vendita, chi l'aveva comprato lo tiene coi bonus. Non si rimette il nero. I colori di riferimento sono i suoi: corpo bianco, croce, tasti e scritta arancioni, schermo arancione a pixel scuri; [[La scritta PZKKO|la scritta «PZKKO»]] a pixel, piena, inclinata come il logo stampato sul Flipper vero; lo schermo riempie tutta la finestra del vetro.

== Bocciato da Alberto (non rifarlo) ==
* una finestra HTML sopra il modello 3D: {{Citazione|si vede e fa schifo|Alberto, 29.10.2026}}
* un adesivo «pzk os» sul fronte;
* il firmware vero del Flipper in WebAssembly dentro il cercapersone;
* il carattere Fredoka per la scritta.
Vuole pzk os riscritto da zero a 8 bit '''dentro''' lo schermo 3D (una tela sotto il vetro trasparente), fatto come il Flipper OS ma con le sue app, più pixel (256 × 128) ma stile 8 bit: prima solo la [[Chat (app)|chat]] completa, le altre app solo dopo il suo ok.

== Come si applica ==
* Tutto è documentato in <code>pzkko/README.md</code>, sezione «Il cercapersone zero». Se serve rifare <code>art/zero/zero.glb</code> bisogna riprendere l'OBJ dallo zip: <code>node tools/pzkko/zero/modello.mjs &lt;obj&gt;</code>, poi <code>foto.mjs</code> per [[Il tasto sul muro|il tasto sul muro]].
* [[Il collaudo delle app|Il collaudo]] <code>tools/pzkko/zero/prova.mjs</code> vuole la scheda video vera (ANGLE d3d11). Edge senza finestra su questo pc esce subito senza errori (31.10.2026): il collaudo va con un Chrome scaricato in <code>%LOCALAPPDATA%\\pzkko-chrome</code> (<code>@puppeteer/browsers install chrome@stable</code> da <code>tools/catture</code>), passato con la variabile <code>CHROME</code> o <code>--chrome=</code>. In <code>--tasti</code>, <code>scrivi@mine+50</code> scrive «mine 50» (il più è lo spazio).
* Per misurare il modello (dove sta una fascia, un buco) si usa il raggio nel browser (<code>prova.mjs --sonda</code>, <code>rig.sonda</code>), non i vertici dell'OBJ: le facce piatte hanno pochi vertici, si prende la parete interna, e la scritta è finita 1,4 mm dentro la plastica.
* Dopo ogni cambio al modello si rifà <code>foto.mjs</code> e si '''guarda''' che abbia scritto davvero: una volta ha fallito in silenzio per un tipo MIME mancante e Alberto ha visto il muro vecchio («neanche modificato»). Alberto guarda il risultato subito su <code>localhost:5182</code> e manda foto: ogni punto si controlla con una cattura ingrandita (<code>--muro</code> a 4×, i ritagli) prima di dirgli «fatto».
* Il [[three.js]] dello zero è un bundle a parte (<code>telefono/zero/lib/three.js</code>, <code>motore.mjs</code>): non si tocca quello della [[La scena 3D|scena]].
* In locale si è sempre dentro col conto pzkko (<code>dev.mjs</code>, <code>/__dev/accesso</code>, solo da questo pc e dalla rete Tailscale; l'archivio locale è in memoria); <code>?ospite</code> lascia senza conto. Dopo aver cambiato <code>tools/dev.mjs</code> il server sulla 5182 va riavviato con Ctrl+C e <code>npm run dev:pzkko</code>: fermare il task non basta, il processo node resta.
* Le prove pilotate con puppeteer vogliono <code>?chat</code> nell'indirizzo, se no la home non carica la chat.
* Le app di pzk os seguono [[Regole app pzk os (memoria)|le regole]]; il lavoro su pzkko va nel ramo <code>pzkko.it</code> ([[Rami per sito (memoria)]]); le icone seguono [[Icone sempre rd-plus (memoria)]].

{{Vedi anche|Il cercapersone zero|Il modello dello zero|pzk os|Il collaudo delle app|Le regole per le app}}
[[Categoria:La memoria di Claude]]`,
  },

  'Regole app pzk os (memoria)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/telefono/zero/os/REGOLE.md', 'albertopecchini.it/tools/pzkko/zero/prova.mjs', 'CLAUDE.md'],
    testo: `{{Infobox
| titolo = Regole app pzk os
| immagine = app-chat.webp
| didascalia = la chat, la prima app di pzk os, com'è nel collaudo
| file = regole-app-pzk-os.md
| tipo = feedback
| scritta il = 29 ottobre 2026
| aggiornata il = 29 ottobre 2026
| collegata a = cercapersone-zero
| le regole = telefono/zero/os/REGOLE.md
| il collaudo = tools/pzkko/zero/prova.mjs --app=<id>
}}
'''Regole app pzk os''' è la memoria di [[La memoria di Claude|Claude]] che dice una cosa sola: prima di scrivere o cambiare qualsiasi [[Le app di pzk os|app di pzk os]] si leggono per intero [[Le regole per le app|le regole]] in <code>REGOLE.md</code>, e un'app è finita solo quando [[Il collaudo delle app|il collaudo]] dice «tutto a posto», le foto sono state guardate una per una e [[Alberto Pecchini|Alberto]] ha detto ok. La stessa regola sta in [[CLAUDE.md]].

== Perché ==
{{Citazione|fai delle regole e poi salvatele e memorizzale per sempre su come creare app in pzk os dentro al flipper senza bugs e usando i tasti presenti e senza bugs grafici con l'aggiunta di icone, animazioni e suoni tutti funzionanti|Alberto, 29.10.2026}}
In quella sessione Alberto aveva trovato a occhio, uno dopo l'altro, bug che le regole ora vietano: la croce che si sollevava invece di abbassarsi, «avanti ▶» che andava solo con OK, scritte invisibili (il ▶ delle impostazioni arancione su arancione), lo schermo storto sul muro. Il collaudo automatico scritto insieme alle regole ne ha trovati altri sei nella chat e nelle impostazioni prima che li vedesse lui.

== Il cuore, da ricordare anche senza aprirle ==
* Un'app alla volta e solo quando Alberto la chiede. La logica è quella del sito (i moduli di <code>chat/</code> e <code>games/</code>), pzk os è solo la faccia. Si registra solo in <code>PRONTE</code> di <code>os/os.js</code>.
* [[I sei tasti|Sei tasti]]: su, giù, sinistra, destra, OK, INDIETRO. INDIETRO sempre preso (dalla radice <code>os.togli()</code>); tenuto tre secondi spegne ed è del sistema. Ogni scritta che nomina un tasto dice il vero; ◀ ▶ sono sinistra e destra, mai «indietro».
* [[L'lcd|Schermo]] 256 × 128 a un bit: margine di 6 px, niente negli angoli stondati (un quarto d'ellisse 15 × 13), testo rovesciato solo dentro la sua fascia scura, mai testo sopra testo, solo i glifi di [[Il carattere 5×7|font.js]], <code>disegna</code> non cambia lo stato.
* [[Le icone di pzk os|Icone]]: SVG 16 × 16 pieni in <code>os/icone.js</code>, nome <code>app-&lt;id&gt;</code>, provate a 16 e a 32.
* Animazioni: solo col <code>tic</code> (dieci al secondo) e <code>os.ridisegna()</code>, e si ridisegna solo mentre si anima.
* Suoni: il bip dei tasti e [[Le sigle delle app|la sigla dell'app]] li fa il sistema (<code>os/suoni.js</code>); ogni app nuova ha la sua sigla in <code>suono/interfaccia.js</code> col nome dell'id; mai file audio né AudioContext nelle app.
* Dopo ogni <code>await</code> si controlla <code>os.corrente() === vista</code>; chi ascolta smette in <code>esci()</code>.
* Senza conto non si entra (<code>LIBERE</code> in os.js); i pezzi comuni in <code>os/pezzi.js</code>; PIN e numeri con <code>os.cifre</code>; le app col conto si provano con <code>--server-finto</code> e <code>--senzaconto</code>.
* Le frecce premono direttamente i tasti-direzione (la consegna del [[Il rider|rider]]); ogni cosa premibile ha anche la sua zona per [[Il clic del mouse|il clic del mouse]] (<code>os.zona</code>). I comandi della chat che toccano la pagina vanno provati nello zero: lì la scheda è finta e un selettore sconosciuto torna null.

== Come si applica ==
Prima di dire «fatto» su un'app: <code>node tools/pzkko/zero/prova.mjs --giorno --suoni --app=&lt;id&gt;</code> deve dire «tutto a posto», poi la notte (<code>--app=&lt;id&gt;</code>), poi si guardano '''tutte''' le foto <code>prova-app-&lt;id&gt;-*.png</code>, perché il collaudo non vede tutto (il testo rovesciato fuori dalla fascia, le scritte sovrapposte, i suggerimenti che non dicono il vero). Se una regola si rivela sbagliata o manca, si corregge <code>REGOLE.md</code>, non si aggira.

{{Vedi anche|Le regole per le app|Il collaudo delle app|pzk os|Cercapersone zero (memoria)|CLAUDE.md}}
[[Categoria:La memoria di Claude]]`,
  },

  'Banca sul server (memoria)': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/chat/zaino.js', 'albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/tools/dev.mjs'],
    testo: `{{Infobox
| titolo = Banca sul server
| file = banca-sul-server.md
| tipo = project
| scritta il = 31 ottobre 2026
| aggiornata il = 31 ottobre 2026
| collegata a = riavvio-server-casa, server-in-casa
| dal = 31 ottobre 2026
| dove = C:\\pzkko-server\\banca (fuori da GitHub)
| nel browser = pzk.fai('<gioco>.<azione>', args)
}}
'''Banca sul server''' è la memoria di [[La memoria di Claude|Claude]] che fissa il cambio del 31.10.2026: tutta la logica dei soldi, dello [[Lo zaino|zaino]] e dei [[I giochi|giochi]] di [[pzkko.it]] sta nella [[La banca sul server|banca]] dentro <code>C:\\pzkko-server</code>, fuori dal [[Il repository AP|repository]], e il browser non decide più niente.

== Il fatto ==
{{Citazione|saldo sempre nel server immediatamente · browser modificato non può accedere · nessun codice accessibile da fuori · solo da me stanno i dati|Alberto, 31.10.2026}}
La banca gira dentro <code>C:\\pzkko-server\\server.mjs</code>, col codice in <code>C:\\pzkko-server\\banca\\</code> (non nel repo AP, che è pubblico). Le regole per chi la tocca stanno in [[Il contratto della banca|<code>banca\\CONTRATTO.md</code>]]; le prove in <code>node prove\\&lt;pezzo&gt;.mjs</code> dalla cartella banca, in memoria. [[Vercel]] fa solo da [[Il ponte firmato|ponte firmato]] (<code>pzkko/api/_server.mjs</code>, <code>ponte</code> → <code>PUT /v1/api/&lt;nome&gt;</code>). Nel browser c'è una chiamata sola, <code>pzk.fai('&lt;gioco&gt;.&lt;azione&gt;', args)</code>, e <code>chat/zaino.js</code> è solo una copia da leggere. Gli ospiti (senza conto) vivono nella memoria del server. In locale <code>tools/dev.mjs</code> carica la stessa banca in memoria.

== Perché ==
Prima il browser decideva esiti, premi e zaino e mandava [[I lotti numerati|i lotti]] al server: chiunque, aprendo la console, poteva barare. Le risposte giuste dei [[I quiz|quiz]], per esempio, stavano nel file delle domande.

== Come si applica ==
* Ogni cosa nuova che muove soldi o oggetti è un'azione in <code>banca\\giochi\\</code>, mai logica nel browser.
* Cambiando la banca serve riavviare il server: vedi [[Riavvio server di casa (memoria)]] (non basta Stop/Start-ScheduledTask).
* Le regole di [[Il blackjack|blackjack]], [[Le mine|mine]], [[La roulette|roulette]], [[Il dado|dado]], [[La miniera|miniera]] e la scena di [[Virtual|virtual]] esistono in '''due copie''': nel repo per disegnare, in <code>banca\\dati\\</code> per decidere. Si cambiano insieme.
* Il codice della banca non ha copie su GitHub: va salvato altrove (lo storico del server copia solo i dati).

{{Vedi anche|La banca sul server|Il contratto della banca|Il server dei dati in casa|Server in casa (memoria)|I lotti numerati}}
[[Categoria:La memoria di Claude]]`,
  },

  'Riavvio server di casa (memoria)': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Riavvio server di casa
| file = riavvio-server-casa.md
| tipo = project
| scritta il = 31 ottobre 2026
| aggiornata il = 31 ottobre 2026
| collegata a = server-in-casa, banca-sul-server
| attività pianificata = pzkko-server
| porte = 8787 (il server), 8788 (la regia)
}}
'''Riavvio server di casa''' è la memoria di [[La memoria di Claude|Claude]] su come si riaccende [[Il server dei dati in casa|il server dei dati]] in <code>C:\\pzkko-server</code> senza rompere [[Il custode del server|il custode]].

== Il fatto ==
Per caricare codice nuovo del server (<code>server.mjs</code>, <code>banca\\</code>, <code>regia\\</code>): si fermano '''tutti''' i processi node che hanno <code>pzkko-server</code> nella riga di comando, si cancella <code>avvia.lock</code>, poi <code>Start-ScheduledTask pzkko-server</code>. Si controlla con <code>curl https://www.pzkko.it/api/wallet/</code> (200 coi numeri) e che la 8787 e la 8788 ([[La regia del server|la regia]]) siano in ascolto.

== Perché ==
Il 31.10.2026 <code>Stop-ScheduledTask</code> ha chiuso solo la console (<code>conhost --headless</code>): <code>avvia.mjs</code> e <code>server.mjs</code> sono rimasti vivi, il nuovo Start è uscito per il lucchetto, e uccidendo poi solo <code>server.mjs</code> il custode non riusciva più a rilanciarlo (codice 3221225794, cioè 0xC0000142: la console non c'era più). pzkko è rimasto «in pausa» per circa sedici secondi.

== Come si applica ==
Mai uccidere solo il figlio, mai fidarsi di <code>Stop-ScheduledTask</code>. Dal 31.10 il server accende anche la regia (<code>http://localhost:8788/server/</code>, solo 127.0.0.1, con la password in <code>config\\regia.json</code>; le istruzioni in <code>C:\\pzkko-server\\LEGGIMI.md</code>). È il caso tipico di memoria <code>project</code>: un fatto operativo che il codice del repository non può sapere, perché il server sta fuori.

{{Vedi anche|Il server dei dati in casa|Il custode del server|La regia del server|Server in casa (memoria)|Banca sul server (memoria)}}
[[Categoria:La memoria di Claude]]`,
  },

  'CLAUDE.md': {
    data: '2026-11-02',
    fonti: ['CLAUDE.md'],
    testo: `{{Infobox
| titolo = CLAUDE.md
| dove = la radice del repository AP
| righe = tre regole (dal 2.11.2026)
| letto da = Claude Code, a ogni sessione nella cartella AP
| nel repo = sì (versionato)
}}
'''CLAUDE.md''' è il file di istruzioni di progetto che [[Claude Code]] legge all'inizio di ogni sessione aperta nella cartella del [[Il repository AP|repository AP]]. A differenza della [[La memoria di Claude|memoria]], che sta fuori e la scrive Claude, CLAUDE.md sta nel repository, lo vede chiunque e vale come una regola di [[Alberto Pecchini|Alberto]] per chiunque lavori lì: Claude, un altro assistente, una persona.

== Le regole ==
=== Crediti nei siti dei clienti ===
Ogni sito realizzato da Alberto ([[rivaltasulmincio.it|Rivalta sul Mincio]], [[cascinafontana.xyz|Cascina Fontana]], [[Ing. Dario Donelli]] e i prossimi) firma il piè di pagina di tutte le pagine con un link esattamente a <code>https://www.albertopecchini.it</code>: https, www, senza barra finale. Mai il dominio senza www né indirizzi <code>*.vercel.app</code>. Il testo visibile è il nome «Alberto Pecchini», non il dominio. È la regola che [[Il controllo della build (workflow)|il controllo della build]] verifica a ogni push su ogni pagina di albertopecchini.it e di Better Call Pekko; vedi [[Il credito nei siti dei clienti]].

=== Le app di pzk os ===
Prima di creare o cambiare un'app di [[pzk os]] (il [[Il cercapersone zero|cercapersone zero]] di pzkko) si leggono per intero [[Le regole per le app|le regole]] in <code>albertopecchini.it/pzkko/telefono/zero/os/REGOLE.md</code> (tasti, schermo, icone, animazioni, suoni, dati, il modello da copiare). Un'app è finita solo quando <code>node tools/pzkko/zero/prova.mjs --giorno --suoni --app=&lt;id&gt;</code> dice «tutto a posto», le foto <code>prova-app-&lt;id&gt;-*.png</code> sono state guardate tutte, e Alberto ha detto ok. Vedi [[Il collaudo delle app]] e [[Regole app pzk os (memoria)]].

=== La wiki ===
Dal 2.11.2026: a ogni push nuovo si aggiorna [[Pzkkopedia|pzkkopedia]] (vedi [[Pzkkopedia:Come si aggiorna]]). {{Citazione|ricorda che ad ogni push nuovo bisogna aggiornarla|Alberto, 2.11.2026}}

== Cosa non ci va ==
Quello che il repository racconta già da solo: come è fatto il codice (lo dicono i README), le correzioni passate (la [[La storia del repository|storia dei commit]]), le preferenze personali e le cose fuori dal repo (la [[La memoria di Claude|memoria]]). CLAUDE.md resta corto apposta: tre regole, e ognuna viene da una richiesta precisa di Alberto.

{{Vedi anche|La memoria di Claude|Claude Code|Le skill di Claude Code|Il credito nei siti dei clienti|Come lavora Alberto con Claude}}
[[Categoria:Il repository]]
[[Categoria:La memoria di Claude]]`,
  },

  'Le skill di Claude Code': {
    data: '2026-10-26',
    fonti: ['.claude/skills/lezione/SKILL.md', '.claude/skills/nota/SKILL.md', '.claude/skills/serranda/SKILL.md'],
    testo: `{{Infobox
| titolo = Le skill di Claude Code
| dove = .claude/skills/ alla radice del repository AP
| quante = tre: lezione, nota, serranda
| formato = SKILL.md con name e description, poi le istruzioni
}}
'''Le skill di Claude Code''' sono i tre procedimenti scritti che [[Claude Code]] carica a richiesta nel [[Il repository AP|repository AP]]: ognuna è una cartella in <code>.claude/skills/&lt;nome&gt;/</code> con un <code>SKILL.md</code>, un'intestazione con <code>name</code> e <code>description</code> (la descrizione dice quando usarla: le parole che [[Alberto Pecchini|Alberto]] scrive) e sotto le istruzioni passo per passo. Si attivano scrivendo <code>/nome</code> o da sole, quando la richiesta combacia con la descrizione.

== Le tre skill ==
{| class="wikitable"
! skill !! quando parte !! cosa fa
|-
| [[Skill lezione]] || «lezione», «c'è lezione», «guarda la lezione», «ha finito», «appunti» || segue una lezione universitaria in diretta col tool [[Lezioni (strumento)|Lezioni]]: registra, trascrive, legge la lavagna ogni due minuti, scrive gli appunti in PDF
|-
| [[Skill nota]] || «nota» seguito dal testo incollato || impagina una «nota» di fine stagione in un PDF A4 coi caratteri del sito ([[La nota in PDF]])
|-
| [[Skill serranda]] || «metti qualcosa sul muro», «allunga/accorcia la serranda», «i volantini non ci stanno» || allunga, comprime o riempie [[La serranda|la serranda]] di pzkko.it, 2D e 3D, con <code>serranda.mjs</code>
|}

== Cosa hanno in comune ==
Tutte e tre finiscono con una verifica a occhio: la skill nota apre il PDF e guarda la pagina, la skill serranda guarda le foto <code>scena-serranda-*.png</code> e <code>muro-desk.png</code>, la skill lezione guarda i provini della lavagna. E tutte e tre dicono dove stanno le cose fuori dal repository (le note in <code>Documents\\Note</code>, le lezioni in <code>Documenti\\Lezioni</code>, il venv in <code>%LOCALAPPDATA%\\Lezioni</code>): vedi [[I file fuori dal repository]]. Sono versionate nel repo, quindi un'altra sessione le trova uguali; la [[La memoria di Claude|memoria]] invece no.

{{Vedi anche|Skill lezione|Skill nota|Skill serranda|CLAUDE.md|Claude Code}}
[[Categoria:Il repository]]
[[Categoria:La memoria di Claude]]`,
  },

  'Skill lezione': {
    data: '2026-10-21',
    fonti: ['.claude/skills/lezione/SKILL.md', 'albertopecchini.it/tools/lezioni/README.md'],
    testo: `{{Infobox
| titolo = Skill lezione
| immagine = /art/lezioni/appunti.webp
| didascalia = una pagina di appunti di esempio, da una lezione inventata
| file = .claude/skills/lezione/SKILL.md
| strumento = albertopecchini.it/tools/lezioni/ (pzk$meeting)
| nata = 21 ottobre 2026, con una lezione di Analisi
| lezione di riferimento = Documenti\\Lezioni\\2026-10-21
}}
'''Skill lezione''' è la [[Le skill di Claude Code|skill]] con cui [[Claude Code]] segue una lezione universitaria di [[Alberto Pecchini|Alberto]] in diretta, col tool [[Lezioni (strumento)|Lezioni]] (sul muro di pzkko si chiama [[pzk$meeting]]): registra audio e schermo di Teams, trascrive con Whisper in sincrono con la lavagna, legge le formule a giri di circa due minuti e a fine lezione scrive gli appunti e li impagina in PDF. Parte quando Alberto scrive «lezione», «c'è lezione», «guarda la lezione», «ha finito», «appunti».

== La regola d'oro ==
Registrazione e ascolto non si fermano mai finché Alberto non dice che la lezione è finita. I guardiani rilanciano registratore e trascrittore; per riavviare il trascrittore si crea il file <code>FERMA_TRASCRIZIONE</code> nella cartella della lezione, e il registratore non si uccide mai.

== I tre tempi ==
# '''Avvio''', subito: se <code>corrente.txt</code> punta a una cartella con <code>meta.json</code> aggiornato da meno di 15 secondi e senza <code>FINE</code>, sta già registrando e non si rilancia; se no <code>lezione.ps1</code> (il collegamento «Lezione» sul desktop; <code>-Materia "analisi matematica"</code> aiuta Whisper). Dopo trenta secondi si controlla che il livello audio salga sopra −60 dB quando la prof parla e che i fotogrammi crescano. Se Alberto ha premuto «Lezione» da solo, si guarda subito <code>log\\trascrivi.log</code>: il 21.10 alle 14:08 il trascrittore non partiva (una materia vuota) e nessuno se n'era accorto.
# '''I giri di lettura della lavagna''', per tutta la lezione: <code>aspetta.py</code> aspetta due minuti o cinque fotogrammi, <code>prepara.py</code> ritaglia il riquadro video di Teams (lo trova dalla cornice viola) e fa i provini 3×3, Claude guarda i provini e i ritagli a piena risoluzione, scrive <code>ocr\\ocr_NNN.json</code> (una lista di <code>{"frame", "nuovo", "lavagna"}</code> in LaTeX per KaTeX, oppure <code>uguale</code> o <code>salta</code>), poi <code>componi.py</code> rifà il grezzo e Claude scrive ad Alberto una riga con la formula chiave. Se c'è una chiave API di Anthropic la lettura la fa già <code>ocr_claude.py</code>, e non si legge due volte.
# '''Fine lezione''': <code>fine.ps1</code>, l'ultimo giro, poi gli appunti in <code>appunti\\appunti.md</code> per argomento come quelli del 21.10 (regola, esempio svolto, il perché detto a voce, i rimandi ⏱ h:mm:ss, tabelle, «Detto a voce», «Errori da non fare», «Prossima lezione», i grafici ridisegnati con matplotlib), divisi fra tre aiutanti se la lezione è lunga e uniti con <code>unisci.py</code>; <code>impagina.py</code> fa HTML e PDF A4, che si apre per Alberto.

== Le cose già successe ==
Teams che si disconnette o dice «non trovo un altoparlante» (l'audio passa lo stesso: conta il livello), il browser a schermo intero o la chat aperta (il ritaglio si adatta), la telecamera spostata, Whisper che inventa «Grazie…» sul rumore e storpia i termini («è alla x» per e alla x, «mepero» per Nepero, «xen» per arcsen): la lavagna fa fede sulla voce. Il nome della docente non si prende dall'account Teams della telecamera.

{{Vedi anche|Lezioni (strumento)|pzk$meeting|Le skill di Claude Code|Unimore}}
[[Categoria:La memoria di Claude]]
[[Categoria:Gli strumenti]]`,
  },

  'Skill nota': {
    data: '2026-10-26',
    fonti: ['.claude/skills/nota/SKILL.md', 'albertopecchini.it/tools/nota/README.md'],
    testo: `{{Infobox
| titolo = Skill nota
| file = .claude/skills/nota/SKILL.md
| strumento = albertopecchini.it/tools/nota/nota.mjs
| dove vanno le note = Documents\\Note (fuori dal repository)
| uscita = un PDF A4 accanto al testo
}}
'''Skill nota''' è la [[Le skill di Claude Code|skill]] che impagina una «nota» di [[Alberto Pecchini|Alberto]] (per esempio «Nota piscina coniugi…»: il periodo, gli interventi con la data «• 29 mag: …», il riepilogo «voce = 365€», il «Totale … = 928€») in un PDF A4 coi caratteri del sito serio, con lo strumento [[La nota in PDF]]. Parte quando Alberto scrive «nota» seguito dal testo incollato, o incolla un testo del genere chiedendone il PDF.

== Il procedimento ==
Alberto vuole il PDF, {{Citazione|niente di più e niente di meno|skill nota}}: non si fanno domande, non si propongono alternative.
# Si salva il testo '''così com'è''' (UTF-8, righe e punti elenco compresi) in <code>Documents\\Note\\&lt;AAAA-MM-GG&gt; &lt;Titolo&gt; &lt;Cognome&gt;.txt</code>, fuori dal repository: ci sono nomi e importi dei clienti.
# Da <code>albertopecchini.it/</code>: <code>node tools/nota/nota.mjs "&lt;percorso&gt;.txt"</code>; il PDF esce accanto col lo stesso nome.
# Si legge l'uscita dello script: interventi, voci, somma, totale, pagine, gli «attenzione». Se la somma delle voci non torna col totale '''non si corregge niente''': lo si dice ad Alberto coi due numeri.
# Si apre il PDF e si guarda la pagina: niente tagliato, niente righe orfane, una pagina se ci sta. Una riga «fuori schema» si sistema nel parser di <code>nota.mjs</code>, non nel testo di Alberto.
# Si apre il PDF per lui con <code>Start-Process</code> e si risponde in due righe.

== Le regole ==
* Solo PDF, mai un .docx: «in word» voleva dire «impaginato come un documento».
* Il testo resta suo: niente intestazioni di colonna, carta intestata, firma, IVA, date o titoli aggiunti; niente parole tolte; refusi e maiuscole come li ha scritti. Si cambia solo la tipografia (spazi doppi, l'apostrofo giusto, «100€» → «100 €», numero e parola sulla stessa riga).
* I caratteri sono quelli di [[albertopecchini.it]]: Archivo, Instrument Serif, IBM Plex Mono, col minio <code>#e5481f</code> solo come accento; lo stile sta in <code>STILE</code> dentro <code>nota.mjs</code> e un ritocco vale per tutte le note dopo.

{{Vedi anche|La nota in PDF|Firma per i PDF (memoria)|Le skill di Claude Code|I file fuori dal repository}}
[[Categoria:La memoria di Claude]]
[[Categoria:Gli strumenti]]`,
  },

  'Skill serranda': {
    data: '2026-10-22',
    fonti: ['.claude/skills/serranda/SKILL.md', 'albertopecchini.it/tools/pzkko/serranda.mjs', 'albertopecchini.it/tools/pzkko/disposizione.js'],
    testo: `{{Infobox
| titolo = Skill serranda
| immagine = scena-cima.webp
| didascalia = la cima della saracinesca in 3D, la foto di prova che la skill guarda dopo «rifai»
| file = .claude/skills/serranda/SKILL.md
| strumento = albertopecchini.it/tools/pzkko/serranda.mjs
| dal = 20 ottobre 2026
}}
'''Skill serranda''' è la [[Le skill di Claude Code|skill]] con cui [[Claude Code]] allunga, comprime o riempie [[La serranda|la serranda]] di [[pzkko.it]], cioè [[Il muro|il muro]] 2D e [[La scena 3D|la scena 3D]] insieme: aggiungere un [[I volantini|volantino]], un manifesto o un graffito, fare spazio in cima o in fondo, stringere [[Le pile|le pile]] perché ci stia altra roba. Parte quando [[Alberto Pecchini|Alberto]] chiede di mettere qualcosa di nuovo sul muro, di allungare o accorciare la serranda, o dice che i volantini non ci stanno.

== Il principio ==
Le posizioni dei pezzi non si scrivono a mano in <code>index.html</code>: stanno in <code>tools/pzkko/disposizione.js</code> come pile per colonna (cinque sul computer, due sul telefono) e <code>disponi.mjs</code> le riscrive nella pagina ([[La disposizione]]). La scena 3D legge la parete dal DOM: se la parete si allunga, si allunga anche la saracinesca 3D. Quindi non si spostano pezzi a mano (le <code>--x --y</code> si riscrivono) e non si toccano le righe delle pile se basta un comando.

== I comandi ==
Tutto da <code>albertopecchini.it/</code>:
* <code>serranda.mjs</code> da solo: lo stato (parete, manopole, colonne, spazio libero);
* <code>volantino --titolo= --testo= [--link= --carta= --arte= --zona= --colonna= --dopo=]</code> e <code>pezzo --img=manifesti2/x</code>: il pezzo nuovo va in fondo alla colonna più corta, computer e telefono ognuno la sua; le immagini devono già stare in <code>pzkko/art/</code>;
* <code>allunga --sopra=400</code> (lo spazio nuovo in cima, tutto scende), <code>comprimi 10</code> (le pile più fitte del 10 %), <code>--prova</code> per vedere senza scrivere;
* <code>rifai</code>: disponi, la [[La 404|404]], [[La storia del muro|la storia]], [[Le foto dei volantini|le foto dei volantini]] per il 3D, [[Le foto del caricamento|le foto del caricamento]] e una foto di prova della scena. Serve un browser (il Chromium di Playwright o Edge) e <code>npm ci</code> in <code>albertopecchini.it/</code> e in <code>tools/catture/</code>.

== Poi si guarda ==
Le foto in <code>tools/pzkko/lavoro/</code>: <code>scena-serranda-cima</code>, <code>-meta</code>, <code>-fondo</code>, <code>-telefono</code> (3D) e <code>muro-desk.png</code>, <code>muro-mob.png</code> (senza 3D); per la storia anche <code>scena-serranda-storia.png</code>, <code>storia-desk.png</code>, <code>storia-mob.png</code>. Si controlla che niente copra i link dei volantini veri, che il pezzo nuovo si veda e si legga nella scena e sul telefono. Per guardare da vicino: <code>scena/foto.mjs --scroll=0.4 --dpr=2 --ritaglio=x,y,l,a</code>. Poi si aggiorna il README se cambiano zone o altezze.

== Attenzione ==
* Con Edge le altezze dei volantini vengono qualche unità diverse dal Chromium di Playwright: è normale.
* La 404 non ha i pezzi nuovi (ha il suo muro corto) ma va rigenerata.
* La [[La petizione|petizione]] ha le tre bic appese allo spago che sporgono ~180 unità sul computer e ~130 sul telefono: nella pila subito sotto va un graffito o un manifesto degli altri, mai un volantino vero (le penne coprirebbero il link). La sua foto per la scena è vuota: le firme le scrive la scena dal vivo.
* {{Citazione|Non fare commit né push se Alberto non lo chiede: ogni push su main va online.|skill serranda}}

{{Vedi anche|La serranda|La disposizione|Le pile|Il muro|Rami per sito (memoria)}}
[[Categoria:La memoria di Claude]]
[[Categoria:Il muro]]`,
  },

  'Claude Code': {
    data: '2026-11-02',
    fonti: ['CLAUDE.md', '.claude/skills/lezione/SKILL.md', 'albertopecchini.it/README.md', 'albertopecchini.it/api/email-ai.js'],
    testo: `{{Infobox
| titolo = Claude Code
| cos'è = l'assistente di Anthropic da riga di comando e dentro VS Code
| nel repo AP = CLAUDE.md, .claude/skills/, la memoria del progetto
| modelli usati = Claude Opus (l'IA del compositore email), Claude Fable (le sessioni)
| dal = l'estate 2026 (le pull request «claude/…» di settembre e ottobre)
}}
'''Claude Code''' è lo strumento con cui [[Alberto Pecchini|Alberto]] scrive, insieme a Claude, quasi tutto quello che c'è nel [[Il repository AP|repository AP]]: il sito serio, [[Better Call Pekko]], [[pzkko.it]], gli strumenti, e questa wiki. Gira da riga di comando e dentro VS Code, nella cartella <code>Documents\\AP</code>, e si porta dietro tre cose del progetto: [[CLAUDE.md]] (le regole), [[Le skill di Claude Code|le skill]] (i procedimenti) e [[La memoria di Claude|la memoria]] (quello che Alberto gli ha detto di ricordare).

== Dove si vede nel repository ==
* Le pull request <code>claude/…</code> della [[La storia del repository|storia dei commit]]: #8, #9, #10, #11 (il 24–26 settembre 2026: le tavole vere, il museo, l'iPhone 18 Pro), #12 e #13 (il [[Wrapped 5BT]], 5–6 ottobre).
* Le richieste di Alberto copiate nei README con la data, fra virgolette basse, prima di ogni cosa fatta: «fai tutto velocissimo e super ottimizzato» (23.10), «voglio lui come mockup» (29.10), «il mio account non ha limiti» (23.10). È il modo in cui il repository tiene memoria del ''perché''.
* I commit in italiano, con prefisso e ambito: <code>feat(pzkko): …</code>, <code>fix(catture): …</code> ([[I messaggi di commit]]).
* <code>api/email-ai.js</code>: in locale [[Il compositore email|il compositore email]] lancia <code>claude -p</code> con l'abbonamento Max di Alberto, senza strumenti, in modalità ristretta e in una cartella vuota, con il modello Opus e lo «Sforzo» della pagina come <code>--effort</code>; e <code>claude -p /usage</code> legge i limiti dell'abbonamento, che la pagina mostra in diretta.
* [[Lezioni (strumento)|Lezioni]]: con la chiave API, <code>ocr_claude.py</code> legge la lavagna e <code>appunti_claude.py</code> scrive gli appunti (circa 6–7 $ di lettura e 1–1,5 $ di appunti per una lezione di due ore e mezza con Opus 5.5); senza chiave lo fa la [[Skill lezione|skill lezione]] nella sessione.
* [[Le immagini di Better Call Pekko|I banner di Better Call Pekko]] della sezione «Pekko makes websites» sono artboard vettoriali disegnate nel canvas di Claude Design e rese da <code>tools/assistenza/design.mjs</code>.

== Più sessioni insieme ==
Nella cartella AP girano spesso più sessioni di Claude Code nello stesso momento (il [[Il contratto della banca|contratto della banca]] del 31.10 lo dice: «non toccare games/*: un'altra sessione ci lavora fino a nuovo avviso»). Per questo la [[Rami per sito (memoria)|regola sui commit]] è committare solo i propri file e non pushare su <code>main</code> da soli.

{{Vedi anche|Come lavora Alberto con Claude|La memoria di Claude|CLAUDE.md|Le skill di Claude Code|Pzkkopedia}}
[[Categoria:La memoria di Claude]]
[[Categoria:Il repository]]`,
  },

  'Come lavora Alberto con Claude': {
    data: '2026-11-02',
    fonti: ['CLAUDE.md', 'albertopecchini.it/pzkko/README.md', 'albertopecchini.it/pzkko/telefono/zero/os/REGOLE.md', '.claude/skills/serranda/SKILL.md'],
    testo: `{{Infobox
| titolo = Come lavora Alberto con Claude
| immagine = zero-tasto.webp
| didascalia = il tasto sul muro fotografato a 4×: si guarda prima di dire «fatto»
| dove = la cartella Documents\\AP, in VS Code e da terminale
| la regola di tutte = si guarda il risultato, non si crede al comando
}}
'''Come lavora Alberto con Claude''' raccoglie il metodo che [[Alberto Pecchini|Alberto]] e [[Claude Code]] si sono dati in un mese e mezzo di [[pzkko.it]], e che sta scritto, pezzo per pezzo, nei README, in [[CLAUDE.md]] e nella [[La memoria di Claude|memoria]].

== Alberto chiede a voce, il README lo ricorda ==
Le richieste arrivano brevi, spesso una riga: «togli tasto regia», «musica 0.3», «impostazioni predefinite audio off», «fai che la chat mostri subito dei tasti da dove cominciare». Il README le copia fra virgolette basse con la data, davanti a quello che ne è nato: così chiunque rilegga la sezione sa ''perché'' una cosa è così. Le frasi più lunghe diventano le specifiche: {{Citazione|voglio lui come mockup, deve aprirsi con le stesse logiche, ovviamente quando lo apro zoom sullo schermo e mettici pzkos, poi voglio retroill arancione e sfondi arancioni, le icone tieni le mie, fai una cosa su misura, anche il cavo della ricarica nel posto giusto, è in 3d mi raccomando.|Alberto, 29.10.2026}}

== Alberto guarda, e boccia ==
Alberto guarda il risultato subito, su <code>localhost:5182</code> o sul telefono, e manda foto: «è storto lo schermo», «quando premo a destra non si preme ma si solleva», «scritta pzkko inesistente», «per qualche ms vedo il vecchio cercapersone». Le bocciature restano scritte nella memoria perché non si rifacciano ([[Cercapersone zero (memoria)]]: la finestra HTML sopra il 3D, il firmware in WebAssembly, il carattere Fredoka). Da lì nasce la regola di tutte: prima di dire «fatto» si guarda una cattura ingrandita, si guardano tutte le foto del [[Il collaudo delle app|collaudo]], si ingrandisce il PDF firmato, si guardano le icone grandi e col nome.

== «Per sempre» ==
Quando Alberto dice «per sempre» o «memorizzale», la cosa diventa una regola scritta: [[Le regole per le app|REGOLE.md]] per le app di pzk os, [[Icone sempre rd-plus (memoria)|rd-plus]] per le icone, [[Server in casa (memoria)|il server in casa]] al posto di Vercel Blob, e da oggi questa wiki a ogni push.

== Il codice è suo, i commit sono in italiano ==
[[I messaggi di commit]] hanno prefisso e ambito e raccontano la cosa fatta come una frase («il cercapersone si accende in 400 ms, la home a pagine 3×3 coi puntini, la barra di stato vera, indietro rosso»). Il codice ha commenti in italiano, datati, col perché. Niente framework a runtime, niente dipendenze che non servono: tutto scritto a mano, dal [[Il lettore DWG|lettore DWG]] ai [[Il suono della strada|suoni della strada]].

== Niente push senza chiedere ==
Il 26.10 Claude ha pushato su <code>main</code> da solo e Alberto l'ha corretto ([[Rami per sito (memoria)]]). Da allora: il lavoro va sul ramo del sito, <code>main</code> solo se lo chiede, e si committano solo i propri file perché nella cartella lavorano più sessioni insieme.

== Il collaudo prima dell'ok ==
Per ogni app di [[pzk os]]: <code>prova.mjs --giorno --suoni --app=&lt;id&gt;</code> deve dire «tutto a posto», poi la notte, poi le foto una per una, poi l'ok di Alberto. Per i giochi: <code>prova.mjs</code> di ciascuno, con milioni di giri e i test statistici ([[Le prove dei giochi]]). Per la serranda: le foto della scena. Per i siti: [[Il controllo della build (workflow)|il controllo della build]] a ogni push e [[Le catture dei siti (workflow)|le catture]] ogni ora.

== Più sessioni, più aiutanti ==
Per le cose grosse Claude divide il lavoro fra aiutanti (gli appunti di una lezione lunga in tre parti, le voci di questa wiki per area) e poi unisce. Il [[Il contratto della banca|contratto della banca]] è nato proprio per far lavorare due sessioni sullo stesso sito senza pestarsi i piedi.

{{Vedi anche|Claude Code|La memoria di Claude|CLAUDE.md|Il collaudo delle app|Pzkkopedia:Come si aggiorna}}
[[Categoria:La memoria di Claude]]
[[Categoria:Le persone]]`,
  },

  'PRODUCT.md': {
    data: '2026-10-26',
    fonti: ['PRODUCT.md', '.impeccable/config.json'],
    testo: `{{Infobox
| titolo = PRODUCT.md
| dove = la radice del repository AP
| di cosa parla = pzkko.it (gli altri due siti hanno l'identità nel codice)
| strumento = impeccable (la cartella .impeccable/)
| date dentro = 7, 9 e 17 ottobre 2026
}}
'''PRODUCT.md''' è il documento di prodotto di [[pzkko.it]] alla radice del [[Il repository AP|repository AP]], scritto per lo strumento di revisione del design «impeccable» (che tiene in <code>.impeccable/</code> la configurazione, <code>design.json</code> e le superfici da guardare: la home di pzkko e il vecchio template <code>pzkko.js</code>). Dice chi usa il sito, a cosa serve, cosa non deve diventare e cosa Alberto ha già deciso.

== Cosa dice ==
* '''Chi arriva''': chi parte da un handle, un follower di Instagram, chi ha trovato il profilo GitHub, un amico o un cliente a cui Alberto ha detto «cerca pzkko». Quasi sempre dal telefono, per pochi secondi, per sapere chi è pzkko e come raggiungerlo.
* '''A cosa serve''': l'indirizzo personale di [[Alberto Pecchini]] ([[pzkko (il nome)|pzkko è il suo nome in rete]]): i social in un posto solo, e la casa di piccoli strumenti e giochi da browser, aggiunti uno alla volta.
* '''Cosa non è''': un link-in-bio generico. Le zone «tools» e «games» sono la differenza: un piccolo ecosistema di cose fatte da Alberto, non una vetrina di link altrui.
* '''Com'è messo''': file statici in <code>albertopecchini.it/pzkko/</code> senza build, un progetto Vercel a parte con dominio <code>www.pzkko.it</code>; lingua italiano (confermato il 7.10.2026).
* '''Le scelte già fatte''': i social confermati il 7.10.2026 nell'ordine Instagram @albertoxpecchini, GitHub albertoxpecchini, WhatsApp, e-mail pzkko@yahoo.com, PayPal; niente contenuti del portfolio serio («un dominio = un sito intero»); il credito ad Alberto tolto dalla home e dalla 404 il 9.10.2026 («è il suo sito»), e se una pagina lo riporta il link è esatto a <code>https://www.albertopecchini.it</code>; [[Il portafoglio MagSafe|la prima versione]] bocciata il 7.10.2026: «non riproporre oggetti skeuomorfici letterali»; blackjack e roulette fatti e poi tolti il 17.10 (e rifatti nella finestra sul muro lo stesso giorno).
* '''I principi''': una persona, non un brand (prima persona, minuscolo); pochi oggetti fatti bene; il movimento risponde al dito e al puntatore, mai decorazione che gira da sola; cresce per aggiunta.

== Quanto è vecchio ==
È fermo alla versione della scrivania (7–9 ottobre): parla di tipografia di sistema e materiali traslucidi alla Apple, di zone «tools» e «games» vuote. Il muro, la scena 3D, i $pzk e il cercapersone sono venuti dopo, e li racconta il README di pzkko. [[DESIGN.md]] invece è già il muro.

{{Vedi anche|DESIGN.md|Pzkko.it|Le versioni di pzkko|Il portafoglio MagSafe|Alberto Pecchini}}
[[Categoria:Il repository]]`,
  },

  'DESIGN.md': {
    data: '2026-10-26',
    fonti: ['DESIGN.md', '.impeccable/design.json'],
    testo: `{{Infobox
| titolo = DESIGN.md
| immagine = home-giorno.webp
| didascalia = il muro, di cui DESIGN.md è la scheda dei colori e dei caratteri
| dove = la radice del repository AP
| di cosa parla = il muro di pzkko.it
| righe = 314
}}
'''DESIGN.md''' è la scheda di design di [[pzkko.it]] alla radice del [[Il repository AP|repository AP]]: un'intestazione YAML con i colori, la tipografia, gli spazi e i componenti del [[Il muro|muro]], «i social di Alberto Pecchini come volantini attaccati a una saracinesca coperta di graffiti», per lo strumento impeccable (come [[PRODUCT.md]]).

== I colori ==
La pietra <code>#665d56</code> (la stessa ruggine di questa wiki) e la pietra scura <code>#58504a</code>, l'asfalto <code>#3a3937</code>, la lamiera <code>#8e8e8a</code>, l'inchiostro <code>#161616</code> e <code>#3a3632</code>, i pennarelli (nero <code>#111</code>, rosso <code>#a50d25</code>, blu <code>#1446a0</code>, teal <code>#173f48</code>, verde <code>#0b5d2b</code>), il giallo fuoco <code>#ffd400</code> (le fiches da 500, il filo della wiki), il bianco carta, i grigi del marciapiede, la luce al sodio della notte <code>rgba(255,176,70,.22)</code>, l'ombra.

== I caratteri ==
Gli stessi di [[I caratteri del muro]]: Anton per i titoli (<code>max(26px, 18cqw)</code> del volantino, interlinea 0,95), Archivo Black per la seconda voce, Special Elite per il corpo e per il marciapiede, Permanent Marker per le note a mano, gli handle, i tagliandi e il «copiato». Tutto in <code>cqw</code>, cioè in percentuale della larghezza del volantino, così il testo scala col foglio.

== Le misure ==
La parete è larga 1280 unità sul computer (<code>calc(100cqw / 1280)</code>) e 390 sul telefono (al più 600 px), alta 1700 e 2900 unità in questa versione (sono cresciute: 3191 e 5486 dal 22.10, vedi [[La disposizione]]); i tagliandi alti <code>max(44px, 17cqw)</code>; lo stipite, il portale, il gap del testo. I componenti: il volantino, il titolo, la nota a mano, l'handle, il tagliando, la nota «copiato» (bianco all'85 % col rosso del pennarello), l'insegna (al più 840 px), il marciapiede.

Dopo l'intestazione il file descrive il muro a parole; è fermo al 17–20 ottobre (non sa della [[La scena 3D|scena 3D]], che nel frattempo gli ha copiato ogni colore). Il 8.10 una versione precedente descriveva «la sala del blackjack (scena, consolle, burattini, telecamera)»: è nella [[La storia del repository|storia]].

{{Vedi anche|PRODUCT.md|I caratteri del muro|Le carte dei volantini|Il muro}}
[[Categoria:Il repository]]`,
  },

  'I file fuori dal repository': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/README.md', 'albertopecchini.it/pzkko/README.md', 'albertopecchini.it/tools/onion/README.md', 'albertopecchini.it/tools/lezioni/README.md', '.gitignore', 'albertopecchini.it/.gitignore'],
    testo: `'''I file fuori dal repository''' sono le cose di [[pzkko.it]] e di [[albertopecchini.it]] che non stanno nel [[Il repository AP|repository AP]], che è pubblico su GitHub: perché sono segreti, perché sono dati di persone, perché sono troppo grossi, o perché sono il lavoro di un modello già pagato. Chi lavora sul repo deve sapere dove stanno, e questa voce lo dice senza dire cosa c'è dentro.

== Sul pc di Alberto ==
{| class="wikitable"
! dove !! cosa !! perché fuori
|-
| <code>C:\\pzkko-server</code> || [[Il server dei dati in casa|il server dei dati]]: <code>server.mjs</code>, [[Il custode del server|<code>avvia.mjs</code>]], <code>installa.ps1</code>, <code>prova.mjs</code> (68 prove), <code>config\\</code> (la porta e il segreto), <code>dati\\</code> (conti, zaini, borsa, giocatori, firme, il db di Better Call Pekko), [[Lo storico del server|<code>storico\\</code>]], <code>log\\</code>, [[La regia del server|<code>regia\\</code>]], [[La banca sul server|<code>banca\\</code>]] col suo [[Il contratto della banca|CONTRATTO.md]] e il <code>LEGGIMI.md</code> || i dati dei giocatori e il codice che decide i soldi: «solo da me stanno i dati»
|-
| <code>C:\\Users\\Alberto\\Documents\\firma</code> || <code>firma.mjs</code>, <code>crea.mjs</code>, <code>firma.png</code>, <code>firma.json</code>, i caratteri, i piani in <code>lavoro\\</code> || la firma di Alberto ([[Firma per i PDF (memoria)]])
|-
| <code>Documents\\Note</code> || i testi e i PDF delle note di fine stagione || nomi e importi dei clienti ([[La nota in PDF]])
|-
| <code>Documenti\\Lezioni\\AAAA-MM-GG</code> e <code>%LOCALAPPDATA%\\Lezioni</code> || le lezioni registrate (audio, schermate, trascrizione, appunti) e il venv di Python con Whisper || voci e nomi di una lezione ([[Lezioni (strumento)]])
|-
| <code>Documents\\AP-archivio\\lavoro-2026-09-29</code> || le cartelle <code>lavoro/</code> di copertine, figurine, mascotte e cartina archiviate il 29.09.2026, e le vecchie versioni dei banner di Pekko || i fogli di [[gpt-image-2]] già pagati, da cui si può rifare un ritaglio
|-
| <code>tools/*/lavoro/</code> || i PNG e i JSON di ogni strumento che chiama [[Replicate]], le foto di prova della scena, i collaudi dello zero || esclusi da Git nel <code>.gitignore</code> del sito; si ricreano da soli
|-
| <code>D:\\disco immagini\\Rullino</code> || le foto dell'iPhone, fra cui IMG_0334–0336 di Bologna e i CR2 della EOS 4000D || foto a piena risoluzione coi metadati e il GPS; sul sito vanno solo i ritagli puliti
|-
| <code>%LOCALAPPDATA%\\Tor</code> || il bundle di Tor, le due build <code>www\\a</code> e <code>www\\b</code>, i registri, le chiavi dell'onion || <code>hs_ed25519_secret_key</code> '''è''' l'indirizzo: chi la copia può spacciarsi per il sito ([[L'indirizzo .onion]])
|-
| <code>%LOCALAPPDATA%\\pzkko-chrome</code> e <code>%LOCALAPPDATA%\\ms-playwright</code> || i browser per i collaudi e le catture || programmi
|-
| <code>albertopecchini.it/.env.local</code> || il token di Replicate, la chiave di amministrazione del wallet e delle firme, la chiave del compositore email, le variabili dell'IA || i segreti; su Vercel stanno nelle variabili d'ambiente dei progetti
|-
| la cartella di Claude del progetto || [[La memoria di Claude]] || è di Claude, non del codice
|-
| uno zip nella cartella dei download || l'OBJ di Rhino del mockup del Flipper Zero, 34 MB || troppo grosso; da lì si rifà <code>art/zero/zero.glb</code> ([[Il modello dello zero]])
|}

== Fuori da tutto ==
Alla radice del repo il <code>.gitignore</code> tiene fuori anche <code>.impeccable/review/</code> e <code>.playwright-mcp/</code>. Nelle Actions, lo stato delle [[Le catture dei siti (workflow)|catture]] (<code>stato.json</code>) sta nella cache di GitHub, non nel repository.

== Cosa se ne ricava ==
Il repository, da solo, non basta a far girare pzkko: senza il server di casa i conti sono «in pausa» e si gioca coi 1.000 $pzk della sessione; senza i token non si generano immagini; senza l'OBJ non si rifà il cercapersone. La [[La memoria di Claude|memoria]] serve proprio a tenere insieme queste due metà.

{{Vedi anche|Il server dei dati in casa|La memoria di Claude|Cosa si salva|Il repository AP}}
[[Categoria:Il repository]]
[[Categoria:La memoria di Claude]]`,
  },

  'Alberto Pecchini': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/src/data/site.js', 'albertopecchini.it/src/data/studio.js', 'albertopecchini.it/README.md', 'PRODUCT.md', 'albertopecchini.it/tools/email-generator/README.md'],
    testo: `{{Infobox
| titolo = Alberto Pecchini
| immagine = https://www.albertopecchini.it/media/web/ap-desktop.webp
| didascalia = la home di albertopecchini.it, il suo portfolio
| nato = 28 giugno 2006
| di = Rivalta sul Mincio (MN)
| titolo = diplomato geometra
| mestiere = web designer, graphic designer, assistenza informatica
| studia = informatica a Unimore (matricola 398893)
| in rete = pzkko
| instagram = @albertoxpecchini
| github = albertoxpecchini
| e-mail = pzkko@yahoo.com
| il conto $pzk = pzk398893
| l'animale = la chiocciola gigante africana
}}
'''Alberto Pecchini''' è la persona dietro a tutto quello che questa wiki descrive: [[pzkko.it]], [[albertopecchini.it]], [[Better Call Pekko]], i siti dei clienti, gli strumenti, il repository, e le richieste a voce che [[Claude Code]] mette in pratica. Nato il 28 giugno 2006 (il vecchio sito calcolava l'età da quella data), vive a [[Rivalta sul Mincio]], in provincia di [[Mantova]]. È '''diplomato geometra''': il titolo è scritto proprio così, perché «Geometra» e «Perito geometra» sono riservati agli iscritti all'albo, e <code>site.legal.albo</code> nel sito è <code>null</code> apposta. Fa il web designer e il graphic designer, e dal 29.09.2026 anche l'assistenza informatica sul serio (l'area D dei servizi, con l'installazione di Windows o Office in regalo al primo intervento sopra i 50 euro). Studia informatica all'[[Unimore|Università di Modena e Reggio Emilia]] (la matricola 398893 è nella firma delle e-mail universitarie e, al contrario, nel numero del suo conto $pzk).

== In rete ==
Il suo nome in rete è [[pzkko (il nome)|pzkko]], minuscolo. I social confermati il 7.10.2026, nell'ordine in cui stanno sul [[Il muro|muro]]: Instagram @albertoxpecchini (che dal 23.10 regala 1.000 $pzk a chi lo segue, sulla fiducia), GitHub albertoxpecchini, WhatsApp, l'e-mail pzkko@yahoo.com, PayPal albertoxpecchini; dal 21.10 anche TikTok. Su [[Better Call Pekko]] si chiama [[Pekko]].

== I suoi siti ==
* [[albertopecchini.it]], il portfolio serio: statico, senza framework, coi burattini di carta, l'aragosta che riempie d'inchiostro il cognome, il lettore DWG scritto da zero;
* [[Better Call Pekko]], l'assistenza informatica come un sito americano del 2008;
* [[pzkko.it]], il muro, i giochi, il cercapersone;
* per i clienti: [[rivaltasulmincio.it]] (la Pro Loco del suo paese), [[cascinafontana.xyz]] (l'azienda agricola di famiglia, con la PEC e la casella Proton della società), [[Ing. Dario Donelli]].
Tutti e tre i suoi escono dallo stesso [[Il repository AP|repository]], e i siti dei clienti lo citano nel piè di pagina con [[Il credito nei siti dei clienti|un link esatto]].

== Cose sue che sono finite nel sito ==
La [[La chiocciola gigante africana|chiocciola gigante africana]] è il suo animale. Better Call Saul è la sua serie, e ne è nata una parodia intera. Il 22 settembre 2024 era a [[Bologna]] per la prima volta, con Veronica e l'iPhone 16 Pro da due giorni, e ha fotografato la saracinesca della Coin che è diventata il muro. I cibi dei volantini e dello [[Lo shop|shop]] (tortelli di zucca, sbrisolona, grissini alla pizza, il ramen Pechino, l'Estathé) sono quelli citati nelle sue chat; il Landini L 25 del 1957, la Piaggio Ciao in vendita, la stufa a legna di Tecnomat, l'appuntamento del dentista e il biglietto del parcheggio di Milano sono sul muro. Le note di fine stagione delle piscine dei clienti sono un suo lavoro vero ([[La nota in PDF]]). I suoi amici stanno sugli [[Gli adesivi degli amici|adesivi]], e @~matti ha avuto un meme di auguri il 17.10.2026. Il suo conto nella [[La banca sul server|banca]] è pzk398893 e [[Il conto di Alberto|non ha limiti]] («il mio account non ha limiti», 23.10); il conto «banca pzk» (pzk000001) invece non è suo.

== Come lavora ==
Vedi [[Come lavora Alberto con Claude]]: chiede a voce, guarda, boccia, e quando dice «per sempre» la cosa diventa una regola scritta. I suoi commit sono in italiano. Il suo pc (una RTX 3060 Ti, Windows 10) è anche [[Il server dei dati in casa|il server dei dati]] di pzkko e [[L'indirizzo .onion|l'onion]] del sito serio.

{{Vedi anche|pzkko (il nome)|Pekko|albertopecchini.it|Pzkko.it|Rivalta sul Mincio|Come lavora Alberto con Claude}}
[[Categoria:Le persone]]`,
  },

  'pzkko (il nome)': {
    data: '2026-10-07',
    fonti: ['PRODUCT.md', 'albertopecchini.it/pzkko/index.html', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = pzkko
| immagine = /favicon.png
| didascalia = l'adesivo con la chiocciola sulla lamiera: la favicon di pzkko.it
| cos'è = il nome in rete di Alberto Pecchini
| si scrive = minuscolo, sempre
| è = il marchio; Alberto Pecchini è l'autore
| dal = il 7 ottobre 2026 come sito
}}
'''pzkko''' è il nome in rete di [[Alberto Pecchini]], e per [[PRODUCT.md]] è il marchio: si scrive minuscolo, sempre, anche a inizio frase, come tutto il resto del sito («testi in minuscolo, come sul sito principale»). L'e-mail è pzkko@yahoo.com, il sito è [[pzkko.it]], e da quel nome è nato tutto un vocabolario.

== Dove sta scritto ==
* Nell'[[L'insegna|insegna]] sopra la saracinesca, con [[Le lettere dell'insegna|le lettere della «coin» vera]] di via Rizzoli: la p, la z e la k non c'erano sull'insegna originale e sono fatte con gli stessi pezzi.
* Sul [[Il cercapersone zero|cercapersone zero]], [[La scritta PZKKO|a pixel, pieno, inclinato]] sulla fascia sotto lo schermo, come il logo del Flipper vero.
* Sul [[Il citofono|citofono]], «pzkko» a penna nella finestrella del nome, che di notte si accende; sulla [[Il lucchettone|faccia del lucchettone]], «PZKKO 90 mm».
* Nel [[Il chiusino di pzkkonet|chiusino]]: «pzkkonet · telecomunicazioni», la fibra che arriva anche dove non c'è.
* Sui [[La spazzatura per terra|rifiuti]]: la lattina di pzk-kola, il pacchetto di luckypzkko, il volantino della Hyundai Tucson di pzkko motors, i grissin pzk.
* Nel wallet e nelle [[Le banconote della banca $pzk|banconote]]: «banca $pzk», la chiocciola in smoking, «non ha corso legale · soldi finti».
* Nel bot della chat, che si chiama [[Il bot pzk|pzk]], e nei comandi (<code>pzk pesca</code> funziona come <code>pesca</code>).
* Nella moneta: i [[I $pzk|$pzk]], gli indirizzi «pzk» più sei cifre dei conti, il [[Il pzkstore|pzkstore]].
* Nel server di casa: <code>C:\\pzkko-server</code>, il nome dei file <code>pzkko/…</code>.
* In questa wiki: pzkkopedia, «l'enciclopedia libera del muro».

== Il marchio e il credito ==
Il credito ad Alberto Pecchini è stato tolto dalla home e dalla 404 di pzkko il 9.10.2026 su sua richiesta: è il suo sito. I giochi e le pagine della barra lo portano ancora («Un pezzo di pzkko · fatto da Alberto Pecchini»), col link esatto a <code>https://www.albertopecchini.it</code>, la regola di [[CLAUDE.md]].

{{Vedi anche|Alberto Pecchini|Pzkko.it|Pekko|L'insegna|La scritta PZKKO}}
[[Categoria:Le persone]]`,
  },

  'Pekko': {
    data: '2026-09-29',
    fonti: ['albertopecchini.it/src/data/assistenza.js', 'albertopecchini.it/src/templates/pages/assistenza.js', 'albertopecchini.it/tools/assistenza/README.md'],
    testo: `{{Infobox
| titolo = Pekko
| immagine = https://www.albertopecchini.it/media/web/pzk-desktop.webp
| didascalia = pzkko.it, uno dei siti che Pekko «fa»: sta anche nel banner «Pekko makes websites»
| chi è = Alberto Pecchini col suo soprannome
| dove = bettercallpekko.it, dal 27 settembre 2026
| mestiere = «the computer guy at law», assistenza informatica nel 2008
| lingua = inglese
}}
'''Pekko''' è [[Alberto Pecchini]] quando fa [[Better Call Pekko]]: l'assistenza informatica raccontata come il sito americano del 2008 di un «computer guy at law», 960 px fissi, colonna blu coi tasti gialli, annunci di aziende che non esistono, forum phpBB, telefonini del 2009, webcam coi filtri brutti, e il nome vero che resta solo nel credito del piè di pagina. È una parodia di Better Call Saul, la serie di Alberto, e il soprannome viene dal cognome.

== Com'è fatto ==
Il volto è il suo: gli ingredienti dei banner (ritagli di Pekko in nove completi sgargianti e da web designer, balli per le silhouette, selfie da webcam) sono disegnati da [[gpt-image-2]] con la fototessera come riferimento, e [[Le immagini di Better Call Pekko|i banner]] si compongono a strati in HTML con la Impact bianca coi bordi colorati («colorato pieno non si legge», regola di Alberto) e si fotografano col browser headless. Le aziende (Mincio Discount Mattress Barn, Gino's Pizza & Data Recovery, Zio Beppe's Salami & Web Hosting, Turtle Insurance, Snail Express) non esistono e la pagina lo dichiara. L'unica riga in italiano è «SI PARLA ITALIANO», che è la battuta.

== Pekko e pzkko ==
Dal 29.09.2026 la sezione «Pekko makes websites» porta ai siti veri di Alberto dentro «Pekko Explorer 6», un browser del 2008 con una scheda per sito; dal 18.10 c'è anche [[pzkko.it]], col banner della saracinesca di notte e «3D ROULETTE INSIDE!». Pekko compare pure sul muro di pzkko: il pennarello rosso «pekko» sopra la porta, l'adesivo «hello my name is pekko» sul pluviale ([[I graffiti e gli adesivi della facciata]]), i sei meme bolognesi della [[La storia del muro|storia]] (gli spaghetti rifiutati, la nonna col mattarello, il ragù, la Garisenda, la mortadella, il fotografo di saracinesche). Il codice Konami, o cinque clic sulla [[La tartaruga di terra|tartaruga]], apre il segreto; la tartaruga intera è «THE TORTOISE», capo della sicurezza («secured by a tortoise» è uno dei bottoni 88×31). Dal 18 ottobre al 2 novembre 2026 al suo posto c'era la nutria.

{{Vedi anche|Better Call Pekko|Alberto Pecchini|Le immagini di Better Call Pekko|Il contatore di Better Call Pekko|pzkko (il nome)}}
[[Categoria:Le persone]]
[[Categoria:I siti di Alberto]]`,
  },

  'La chiocciola gigante africana': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/mascotte/README.md', 'albertopecchini.it/pzkko/chat/tomodachi.js', 'albertopecchini.it/pzkko/wiki/wiki.js', 'albertopecchini.it/pzkko/scena/banconote.js'],
    testo: `{{Infobox
| titolo = La chiocciola gigante africana
| immagine = /favicon.png
| didascalia = l'adesivo della chiocciola sulla lamiera
| di chi è = l'animale di Alberto Pecchini
| mascotte di = albertopecchini.it (in testata e nel piè di pagina)
| su pzkko = la favicon, il tomodachi, le banconote, il logo di pzkkopedia, un manifesto
| disegnata con = gpt-image-2 (le mascotte), a pixel dal codice (il tomodachi)
}}
'''La chiocciola gigante africana''' è l'animale di [[Alberto Pecchini]] e, da lì, la bestia che compare più di tutte nei suoi siti.

== Su albertopecchini.it ==
È una delle due [[Le mascotte|mascotte]]: un'immagine di [[gpt-image-2]] (1536 × 1024, qualità high) con lo stesso bordo adesivo delle figurine. La sua testa, coi peduncoli, sta accanto al marchio nella testata (un ritaglio sfumato in basso con una maschera); intera, come [[I burattini|burattino di carta]] smontato in corpo, guscio, due peduncoli e la stazione totale da geometra, custodisce la firma nel piè di pagina insieme alla [[La nutria|nutria]]. Gli occhi li muove il codice: ogni pupilla segue il puntatore per conto suo, sul naso gli occhi si incrociano e la mascotte vibra, ogni tanto sbatte le palpebre, e senza puntatore si guarda intorno. Serve anche da riferimento di stile per gli altri animali (l'airone ha preso il suo zaino) e per [[L'aragosta e l'inchiostro|l'aragosta]] della home.

== Su pzkko.it ==
* La '''favicon''' e l'icona del telefono: l'adesivo con la chiocciola sulla lamiera. L'insegna invece non la ha («niente chiocciola, niente rosso né blu: la chiocciola resta sull'adesivo della favicon»).
* [[Il tomodachi|La chiocciolina]] del cercapersone: pixel art piatta disegnata in codice (<code>chat/tomodachi.js</code>, 32 × 16 celle), che vive sullo schermo lcd, saluta quando si chiude, e nella [[La home di pzk os|home di pzk os]] sta a sinistra a 128 × 64.
* [[Il bot pzk]]: la chiocciola della banca con gli occhiali da sole, otto umori.
* [[Le banconote della banca $pzk|Le banconote]] da 500, 100, 25 e 10: la chiocciola in smoking incisa come su una banconota vera.
* Il manifesto del «concerto della chiocciola» fra la roba degli altri sul muro, e l'adesivo sul muro vicino al citofono; nel manifesto 5 Red Bull le mette le ali.
* Il graffito col gesso sullo zoccolo di pietra della facciata.
* Il logo di questa wiki: una chiocciola col guscio a pezzo di puzzle (la linguetta in cima), ruggine e giallo, disegnato in SVG in <code>wiki.js</code>.
* Nella miniera, le schede video «lumaca» (la lumaca rtx 4090) e «la centrale della lumaca»: «la lumachina approva».
* [[La lumachina]] del conto, quella che ogni giorno decide lei cosa fare coi $pzk, è un'altra chiocciola ancora.

== Nel nome ==
La versione 3.0 di pzkko si chiama «lumaca catodica», la 4.0 «chiocciola zero» ([[Le versioni di pzkko]]).

{{Vedi anche|Le mascotte|I burattini|Il tomodachi|Il bot pzk|La lumachina|La tartaruga di terra}}
[[Categoria:Le persone]]`,
  },

  'La nutria': {
    data: '2026-11-03',
    fonti: ['albertopecchini.it/tools/mascotte/README.md', 'albertopecchini.it/src/data/mascotte.js'],
    testo: `{{Infobox
| titolo = La nutria
| chi è = la nutria golosa del Mincio
| su albertopecchini.it = burattino nel piè di pagina dal 18 ottobre al 2 novembre 2026
| su pzkko = adesivo sul muro, una bestia della caccia, i tavolini di virtual, una side quest
}}
'''La nutria''' golosa del [[Il Mincio|Mincio]] è stata la seconda [[Le mascotte|mascotte]] di [[albertopecchini.it]] dal 18 ottobre al 2 novembre 2026, al posto della [[La tartaruga di terra|tartaruga di terra]]: di profilo, seduta sulle zampe di dietro a mangiare l'erba, nel piè di pagina accanto alla [[La chiocciola gigante africana|chiocciola]]. Il 3 novembre 2026 Alberto ha rivoluto la tartaruga, «esattamente» quella del 27 settembre, e la nutria è uscita dal sito.

== Il burattino ==
Era un [[I burattini|burattino di carta]] in otto pezzi disegnati da [[gpt-image-2]] in due passaggi (corpo, testa coi denti al minio, mascella, braccio, ciuffo d'erba, piede, coda, cespo): mangiava a riprese consumando il ciuffo, scendeva al cespo a strapparne un altro, si bloccava con gli occhi sbarrati se ti avvicinavi, ingoiava tutto se le toccavi la testa, si scrollava, scalciava sollevata. Il montaggio, il carattere (<code>NUTRIA</code> in <code>puppet.js</code>) e le immagini sono stati tolti il 3 novembre; restano nella cronologia di git, dal commit <code>9aa755a</code>. In quei giorni anche su [[Better Call Pekko]] c'era lei, «THE NUTRIA» e il bottone «secured by a nutria»: ora di nuovo la tartaruga.

== Altrove ==
* Sul [[Il muro|muro]] di pzkko è un adesivo vicino al [[Il citofono|citofono]].
* Nella [[La caccia|caccia]] della chat «una nutria» vale 30 $pzk; cacciarne 50 fa «cacciatore di nutrie» e 200 «incubo delle nutrie» ([[I traguardi]]); i [[Bagnino del Mincio|bagnini]] del Mincio fischiano a chi fa il bagno con le nutrie, e l'avvocato difende «una nutria accusata di vandalismo».
* In [[Virtual|virtual]] una partita su 120 finisce a tavolino, anche per «invasione di nutrie».
* «[[La nutria sindacalista]]» è una [[Le side quest|side quest]] del 26.10: sciopero sull'argine.

{{Vedi anche|La tartaruga di terra|Le mascotte|I burattini|Il Mincio|La caccia}}
[[Categoria:Le persone]]`,
  },

  'La tartaruga di terra': {
    data: '2026-11-03',
    fonti: ['albertopecchini.it/src/data/mascotte.js', 'albertopecchini.it/public/media/mascotte/tartaruga.webp', 'albertopecchini.it/src/templates/layout.js', 'albertopecchini.it/tools/mascotte/mascotte.js', 'albertopecchini.it/tools/mascotte/README.md'],
    testo: `{{Infobox
| titolo = La tartaruga di terra
| immagine = https://www.albertopecchini.it/media/mascotte/tartaruga.webp
| didascalia = la tartaruga col casco da cantiere, la mascotte del 27 settembre 2026
| chi è = una testuggine di Hermann col casco da cantiere al minio
| su albertopecchini.it = mascotte intera nel piè di pagina, a destra della firma
| su Better Call Pekko = THE TORTOISE, capo della sicurezza; il bottone «secured by a tortoise»
}}
'''La tartaruga di terra''' è la seconda [[Le mascotte|mascotte]] di [[albertopecchini.it]], accanto alla [[La chiocciola gigante africana|chiocciola]]: una testuggine di Hermann col guscio a scudi gialli e bruni, gli occhi grandi e un casco da cantiere al minio un po' di traverso. Un'immagine di [[gpt-image-2]] (<code>public/media/mascotte/tartaruga.webp</code>, 1193 × 966) col bordo adesivo delle figurine; sopra il sito disegna gli occhi suoi, che seguono il puntatore, sbattono le palpebre, si incrociano sul naso e si guardano intorno quando non c'è nessuno.

== La storia ==
* '''27 settembre 2026''' (<code>c82e7e8</code>): è la tartaruga di questa foto, intera, nel piè di pagina.
* '''1º ottobre''': ridisegnata di profilo come [[I burattini|burattino]] a pezzi (masticava, sbadigliava, si addormentava con l'elmetto sugli occhi, rientrava nel guscio).
* '''18 ottobre''': al suo posto arriva [[La nutria|la nutria golosa]].
* '''3 novembre''': Alberto la rivuole, «al posto della nutria mi rimetti questa tartaruga ESATTAMENTE e cambi tutte le cose legate alla nutria; è la versione c82e7e8». Torna la stessa immagine, con gli stessi occhi e lo stesso naso, come mascotte intera (<code>mascot('tartaruga')</code> in <code>layout.js</code>); su [[Better Call Pekko]] tornano «THE TORTOISE» e il bottone «secured by a tortoise», e i cinque clic che aprono il segreto sono di nuovo sulla tartaruga.

{{Vedi anche|Le mascotte|La chiocciola gigante africana|La nutria|I burattini|Better Call Pekko}}
[[Categoria:Le persone]]`,
  },

  'Mantova': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/index.html', 'albertopecchini.it/pzkko/scena/luci.js', 'albertopecchini.it/pzkko/api/meteo.mjs', 'albertopecchini.it/pzkko/suono/suono.js', 'albertopecchini.it/pzkko/chat/immagini.js'],
    testo: `{{Infobox
| titolo = Mantova
| cos'è = la città il cui tempo vive sul muro di pzkko
| l'ora = alba e tramonto calcolati con le formule NOAA, al minuto, senza rete
| il meteo = Open-Meteo, ogni dieci minuti
| la facciata guarda = sud-sud-ovest, 200°
| la cucina = tortelli di zucca, risotto alla pilota, sbrisolona, luccio in salsa, mostarda
}}
'''Mantova''' è la città a cui [[pzkko.it]] regola l'orologio: la saracinesca è a [[Bologna]], ma la sera, il meteo, le campane, il sole e i quiz sono di Mantova, la provincia di [[Alberto Pecchini|Alberto]].

== L'ora ==
La pagina calcola alba e tramonto di Mantova col calcolo NOAA, al minuto, senza rete, e dal 29.10.2026 parte con l'ora vera ([[Come parte la home]]): quaranta minuti prima del tramonto cala il velo blu notte, al tramonto preciso si accendono i neon dell'[[L'insegna|insegna]], dodici minuti dopo i lampioni, la notte è piena cinquanta minuti dopo il tramonto e all'alba tutto si spegne a ritroso ([[La sera a Mantova]]). Nella [[La scena 3D|scena 3D]] il sole sta dove sta davvero sopra Mantova a quell'ora, con altezza e azimut, e la facciata guarda a sud-sud-ovest (200°); lo stesso calcolo, copiato in <code>zero/luce.js</code>, illumina [[Il cercapersone zero|il cercapersone]]. Le batterie del wallet e del cercapersone seguono l'ora di Mantova (100 % alle 7, 2 % alle 19, in carica fino alle 7).

== Il meteo ==
[[Il meteo di Mantova (API)|<code>/api/meteo</code>]] chiede a [[Open-Meteo]] il tempo di Mantova e lo tiene dieci minuti in cache: dal codice WMO escono sole, nuvole, nebbia, pioggia, temporale, neve, la pioggia delle ultime 12 ore (il marciapiede resta bagnato), la visibilità, la neve per terra, il vento ([[Il meteo]]). Il meteo entra anche nella [[La borsa|borsa]] (sole +2 %, pioggia −2 %, neve −1 %, sopra i 26° −1,5 %, sotto gli 8° +1,5 %) e nei grilli delle sere d'estate, che cantano al ritmo della temperatura vera (la legge di Dolbear: 7·T − 30 cri al minuto).

== I suoni ==
[[Le campane]] oltre i tetti suonano le ore dalle 7 alle 22, un colpo alla mezza, a mezzogiorno il concerto di tre campane a slancio e al tramonto l'Ave Maria, nel momento in cui si accende l'insegna. [[Gli uccelli]] seguono l'ora e la stagione; la [[La musica|musica]] ha «il Mincio», «la nebbia», «piazza Sordello» e «il bar di sera».

== Nei giochi ==
I fatti di Mantova dei [[I quiz|quiz]] sono verificati sul web (23.10): il Palazzo Ducale, la Sala dei Giganti di Palazzo Te, la Torre dell'Orologio, il Lago Superiore, la basilica di Sant'Andrea sono fra le [[Le foto vere dei quiz|126 foto]] da [[Wikimedia Commons]] (27 nella categoria mantova). I [[I mestieri|mestieri]] della chat sono mantovani: barista in piazza Erbe, bidello a unimore, sindaco di Mantova che inaugura una rotonda; i [[I reperti|reperti]] sono un bottone di una divisa austriaca, una moneta con la faccia di Virgilio, un'anfora dei Gonzaga, il tesoro dei Gonzaga; la [[La cucina|cucina]] fa i tortelli di zucca, il risotto alla pilota, la sbrisolona e il luccio in salsa, con la nonna che commenta; in [[Virtual|virtual]] gioca «Mantua». Le [[Le side quest|side quest]] passano per il ponte che non finisce, la sagra dei tortelli, la statua di Virgilio, la campana stonata. Il contrabbandiere porta i tortelli oltre il confine con Cremona.

{{Vedi anche|La sera a Mantova|Il meteo|Le campane|Il Mincio|Rivalta sul Mincio|Open-Meteo}}
[[Categoria:I luoghi]]`,
  },

  'Rivalta sul Mincio': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/src/data/site.js', 'albertopecchini.it/pzkko/index.html', 'albertopecchini.it/tools/cartina/cartina.mjs'],
    testo: `{{Infobox
| titolo = Rivalta sul Mincio
| immagine = https://www.albertopecchini.it/media/web/rivalta-desktop.webp
| didascalia = rivaltasulmincio.it, il sito della Pro Loco fatto da Alberto
| cos'è = il paese di Alberto Pecchini
| comune = Rodigo (MN), nel Parco del Mincio
| sul muro = il cartello stradale rubato, appeso col fil di ferro
| sulla firma = «Rivalta sul Mincio, data», sempre
}}
'''Rivalta sul Mincio''' è il paese di [[Alberto Pecchini]], una frazione sul [[Il Mincio|Mincio]] in provincia di [[Mantova]], dentro il Parco del Mincio. Nel sito serio è il solo luogo pubblicato in footer e contatti: l'indirizzo completo compare unicamente nella privacy policy, dove la legge lo chiede, e non va nei dati strutturati. L'anteprima social (<code>og.png</code>, rifatta il 18.10.2026) porta le coordinate di Rivalta e non più quelle di Mantova.

== Sui siti ==
* [[rivaltasulmincio.it]] è il sito ufficiale della Pro Loco, fatto da Alberto: «184 places. 1 village. 0 trackers», dice il banner di Pekko; è uno dei siti veri del portfolio, con la mappa e la scheda della chiesa fra le [[Le catture|catture]].
* Sul [[Il muro|muro]] di pzkko, dal 22.10.2026, c'è il cartello stradale di Rivalta sul Mincio rubato e appeso col fil di ferro (manifesti 6): toccato, suona come un cartello di lamiera smaltata che ondeggia sul filo e ricade sulla saracinesca ([[Le cose che si toccano]]).
* La carta dell'area operativa in /contatti/ di albertopecchini.it ha il lago e i fiumi disegnati da gpt-image-2 e i raggi, le città e la scala in vettoriale ([[La cartina]]).
* «Rivalta Tan & Toner» è una delle aziende inventate di [[Better Call Pekko]]; il Pizzangolo di Rivalta era nella festa di maturità del vecchio sito.

== Sulle firme ==
Quando [[Claude Code]] firma un PDF per Alberto, il luogo è '''solo''' «Rivalta sul Mincio, data»; un luogo prestampato diverso si copre e si riscrive, non si barra ([[Firma per i PDF (memoria)]]).

{{Vedi anche|rivaltasulmincio.it|Mantova|Il Mincio|Alberto Pecchini}}
[[Categoria:I luoghi]]`,
  },

  'Il Mincio': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/tools/aragosta/README.md', 'albertopecchini.it/pzkko/suono/musica.js'],
    testo: `{{Infobox
| titolo = Il Mincio
| cos'è = il fiume di Mantova e di Rivalta
| nella chat = i 16 pesci della pesca, il bagnino, il drago
| sul sito serio = il gambero rosso (l'aragosta di fiume)
| nella musica = «il Mincio», valzer in re per ocarina, arpa e archi
}}
'''Il Mincio''' è il fiume che esce dal Garda, fa i laghi di [[Mantova]] e passa da [[Rivalta sul Mincio]]: in [[pzkko.it]] è il posto dove si pesca, si fa il bagno con le nutrie e dorme il drago.

== Nella chat ==
Il comando <code>pesca</code> ([[La pesca]]) pesca nel Mincio con la canna da 350 $pzk: sedici pesci con un peso (la probabilità) e un valore, dall'alborella (15 $pzk) al cavedano, al persico, alla tinca, alla carpa, alla trota, al pesce gatto, all'anguilla (90), al gambero killer, al lucioperca (110), fino al luccio (150) e al siluro (300), rari, e alla '''carpa d'oro dei Gonzaga''' (1.500, leggendaria: «re del Mincio» fra i [[I traguardi|traguardi]], «il Mincio è casa mia» a 200 pescate); con la scarpa, la bottiglia di plastica e la rana che ti guarda male come schifezze. Il [[Bagnino del Mincio|bagnino del Mincio]] è un mestiere di livello 6 (330 $pzk a turno: «fischi a chi fa il bagno con le nutrie»); [[Il drago del Mincio]] dorme sotto il ponte, ha fame, ed è una [[Le side quest|side quest]] di livello 3 oltre che la bestia leggendaria della [[La caccia|caccia]] («il drago non si fa cacciare. Il drago caccia.»). La [[La cucina|cucina]] è «le ricette del Mincio alla Cooking Mama».

== Nella musica e nei suoni ==
«Il Mincio» è il primo dei sei brani della [[La musica|musica]]: un valzer in re, ocarina, arpa e archi, coi campanelli che rispondono al secondo giro. I [[Gli uccelli|rondoni, i passeri e la civetta]] della strada sono quelli della valle.

== Sul sito serio ==
[[L'aragosta e l'inchiostro|L'aragosta di fiume]] della home di albertopecchini.it è il gambero rosso del Mincio: dorme sopra «Disponibile per nuovi incarichi» e, quando il visitatore sta fermo, versa inchiostro nel cognome con l'annaffiatoio. La [[La nutria|nutria]] golosa è «del Mincio», e nel piè di pagina c'è pure l'airone. I quattro lavori di quinta del portfolio stanno sulle rive: il Museo dei Mestieri del Fiume è a Rivalta.

{{Vedi anche|Mantova|Rivalta sul Mincio|La pesca|La nutria|La musica}}
[[Categoria:I luoghi]]`,
  },

  'Bologna': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/pzkko/storia/index.html', 'albertopecchini.it/tools/pzkko/storia/storia.mjs', 'albertopecchini.it/pzkko/README.md'],
    testo: `{{Infobox
| titolo = Bologna
| immagine = /art/storia/foto-1.webp
| didascalia = via Rizzoli, 22 settembre 2024, 12:28: la saracinesca della Coin
| cos'è = la città della saracinesca vera
| dove = via Rizzoli, un ingresso della Coin a un centinaio di metri dalle Due Torri
| quando = domenica 22 settembre 2024, tre scatti in cinque secondi, tutti Live Photo
| con = Veronica, e l'iPhone 16 Pro da due giorni
}}
'''Bologna''' è la città da cui viene [[Il muro|il muro]] di [[pzkko.it]]: la saracinesca di riferimento è vera, ed è quella di un ingresso della Coin in via Rizzoli, con l'insegna «coin» sopra e i manifesti attaccati sotto.

== Il 22 settembre 2024 ==
Domenica 22 settembre 2024 alle 12:28 [[Alberto Pecchini|Alberto]] era a Bologna per la prima volta, con Veronica, e aveva l'iPhone 16 Pro da due giorni (nei negozi dal 20 settembre). Tre scatti in cinque secondi, tutti Live Photo: IMG_0334, 0335 e 0336. I numeri sulla pagina della [[La storia del muro|storia]] (ora, obiettivo, tempo, ISO, posizione, quota, direzione e velocità del GPS) vengono dai metadati delle foto, letti da <code>storia.mjs</code>, che poi li toglie dai file pubblicati (niente GPS online). I fatti di contorno da fonti pubbliche: la mostra DiscoBo del 21–22.09.2024 (dal volantino nella foto), la chiusura della Coin di via Rizzoli il 31.07.2025 (il Resto del Carlino), la ricetta del ragù depositata dall'Accademia Italiana della Cucina alla Camera di Commercio di Bologna il 17.10.1982 e rivista nel 2023.

== Cosa è passato dalla foto al muro ==
[[La lamiera]] è la foto vera, ritagliata a un numero intero di doghe e specchiata. [[Le lettere dell'insegna]] sono quelle della «coin» vera, misurate su IMG_0334 a piena risoluzione (la foto guarda in su e tutto è schiacciato a 0,95): la o, la c, la n e la i sono sue, la p, la z e la k sono fatte con gli stessi pezzi. L'adesivo e la roba degli altri sono i tre confronti della storia. La prima foto, con la sua Live Photo, è anche il fun fact del case study di pzkko su albertopecchini.it (<code>pzk-bologna.webp</code>): parte al passaggio del mouse e una volta da sola quando entra nello schermo.

== Il resto ==
I sei meme bolognesi di [[Pekko]] (gli spaghetti rifiutati, la nonna col mattarello, il ragù, la Garisenda, la mortadella, il fotografo di saracinesche) stanno nella storia; la mortadella è nello [[Lo shop|shop]] (xp doppi per 20 minuti) e nel salumiere che la affetta «a 1 mm, non 2»; «Bolognese» gioca in [[Virtual|virtual]]; il «banner di bologna 2.0» è un foglio della storia. Il meme «unimore ≥ unibo» sul muro è l'altra faccia della stessa gita ([[Il meme unimore contro unibo]]).

{{Vedi anche|La storia del muro|La saracinesca di Bologna|La lamiera|Le lettere dell'insegna|Alberto Pecchini}}
[[Categoria:I luoghi]]`,
  },

  'Unimore': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/email-generator/README.md', 'albertopecchini.it/src/data/unimore.js', 'albertopecchini.it/pzkko/chat/testi.js'],
    testo: `{{Infobox
| titolo = Unimore
| cos'è = l'Università degli Studi di Modena e Reggio Emilia
| Alberto = studente di informatica, matricola 398893
| casella = 398893@studenti.unimore.it (il profilo «gmail» del generatore di email)
| sul sito serio = la sezione /unimore/ con le materie e gli esercizi di informatica
| sul muro = il meme «unimore ≥ unibo», due volte
}}
'''Unimore''' è l'Università di Modena e Reggio Emilia, dove [[Alberto Pecchini]] studia informatica con la matricola 398893.

== Nel repository ==
* La casella <code>398893@studenti.unimore.it</code> è il profilo «gmail» (si scrive anche «università», «unimore») del [[Il generatore di email|generatore di email]], con la firma «Alberto Pecchini · Studente — Matricola: 398893 · Università degli Studi di Modena e Reggio Emilia» e il logo di unimore su fondo trasparente; dal 26.10 ogni e-mail da lì chiude con l'informativa privacy intestata ad Alberto.
* La sezione <code>/unimore/</code> di [[albertopecchini.it]] (dal 26.10.2026) ha le materie e gli esercizi di informatica, a blocchi, uno per lezione, con gli esercizi numerati da 1 in ogni blocco; un redirect in <code>vercel.json</code> manda i vecchi indirizzi <code>es-N</code> al blocco 1.
* Le lezioni di Analisi seguite su Teams hanno fatto nascere [[Lezioni (strumento)|Lezioni]] e la [[Skill lezione|skill lezione]] il 21.10.2026 (limiti di funzione; due ore e ventisette minuti, con una disconnessione di Teams e un crash del trascrittore). L'orario del primo semestre 2026/27 è in un commit del 23.09.
* Agli studenti unimore che aprono un conto si consiglia come indirizzo «pzk» il numero della loro e-mail: quello di Alberto è [[Il conto di Alberto|pzk398893]].

== Sul muro ==
Il meme «unimore contro unibo» (manifesti 3, 17.10.2026) e la scritta sprayata «unimore ≥ unibo» (scritte2) stanno fra la roba degli altri in cima al muro; lo stesso adesivo, curvo attorno al pluviale, è sulla facciata della scena 3D e sulla [[La storia del muro|storia]]. In chat, «bidello a unimore» è il mestiere di livello 4: «apri e chiudi aule tutto il giorno», 240 $pzk a turno, minigioco dei colori; «prof di analisi» è di livello 10 e «spieghi i limiti a chi non ne ha».

{{Vedi anche|Alberto Pecchini|Il generatore di email|Lezioni (strumento)|Il meme unimore contro unibo|Bologna}}
[[Categoria:I luoghi]]`,
  },

  'Le licenze': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/README.md', 'albertopecchini.it/README.md', 'albertopecchini.it/pzkko/info/index.html', 'albertopecchini.it/tools/lezioni/README.md', 'albertopecchini.it/src/data/crediti.js'],
    testo: `'''Le licenze''' di quello che c'è nei siti di [[Alberto Pecchini]]: il codice, le immagini, i disegni e i testi sono suoi, © 2026, e «non sono riutilizzabili senza permesso» (il README del sito serio); dentro ci sono cose di altri, ognuna con la sua licenza dichiarata nel README, nella pagina <code>/crediti/</code> di [[albertopecchini.it]] e nella pagina [[Info (pagina)|info]] di pzkko.

== Il codice di altri ==
{| class="wikitable"
! cosa !! licenza !! dove
|-
| [[three.js]] r186 (con gli addon) || MIT || la scena 3D, i giochi, lo zero (tre bundle a parte, con <code>LICENSE-three.txt</code>)
|-
| [[Rapier]] 0.21 || Apache 2.0 || la pallina della roulette, i dadi, la moneta
|-
| faster-whisper e i pesi di Whisper, KaTeX, PyAudioWPatch, mss, markdown-it-py || MIT || [[Lezioni (strumento)|Lezioni]]
|-
| puppeteer-core, sharp, esbuild, Vite, @fontsource || le loro (MIT, Apache 2.0) || gli strumenti e la build; nessuna dipendenza a runtime nei siti
|}

== I caratteri ==
Anton, Archivo Black, Abril Fatface, Shrikhand, Bungee, Black Ops One, Rubik Mono One, Alfa Slab One, Caveat, Reenie Beanie, Nothing You Could Do, Archivo, Instrument Serif, Cascadia Code: SIL Open Font License; Special Elite, Permanent Marker, Rock Salt, Homemade Apple: Apache 2.0. Da [[Google Fonts]], serviti dal sito nel solo sottoinsieme latino ([[I caratteri del muro]]); [[Il font Fake Receipt]] è quello degli scontrini. Nessuna richiesta a Google Fonts dal browser.

== Le immagini ==
* Le immagini del muro, le copertine, le figurine, le mascotte, i burattini, gli ingredienti di Pekko: generate con [[gpt-image-2]] su [[Replicate]]; le icone a pixel con [[retro-diffusion rd-plus]]; i ritagli delle persone con [[bria/remove-background]]. I marchi e i nomi veri sui manifesti (Moncler, Frisk, Lyca Mobile, TIM, Starlink, brat, Unimore, Unibo, Red Bull, Estathé, Eastpak, Landini, Epson, Apple, Tecnomat) sono quelli che si trovano su un muro di città: non pubblicità né collaborazioni.
* [[Le foto vere dei quiz|Le 126 foto dei quiz]]: solo CC BY, CC BY-SA, CC0 e pubblico dominio da [[Wikimedia Commons]], con autore e licenza stampati sotto la foto; da Imgur solo con un id dato da Alberto.
* Le foto degli adesivi sono di Alberto e dei suoi amici; quella sul Landini all'aratura è di simo4gantos8, col credito stampato sull'adesivo.
* L'iPhone 18 Pro vettoriale di Rafael Fernandez (Wikimedia Commons, CC BY-SA 4.0): il credito sotto ogni telefono non si toglie. I mockup di MacBook, iPad e iPhone 14 Pro dalla Figma Community, CC BY 4.0.
* Le icone degli strumenti in /studio/: tracciati di Simple Icons (CC0); i marchi restano dei titolari.
* Le tavole del portfolio: elaborati originali di Alberto all'I.T.T. «Carlo d'Arco»; le fotografie del museo scattate il 15.11.2025.

== I soldi finti ==
I $pzk e gli EUR€ «non si comprano, non si vendono e non valgono niente fuori da qui»; le banconote dicono «non ha corso legale · soldi finti». I nomi dei marchi dello shop (Eastpak, Epson ET-2825, iPhone Duo…) sono finzione.

{{Vedi anche|three.js|Rapier|I caratteri del muro|gpt-image-2|Wikimedia Commons|I crediti di pzkko}}
[[Categoria:Il repository]]`,
  },

  'Cosa si salva': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/info/index.html', 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/chat/zaino.js', 'albertopecchini.it/pzkko/api/wallet.mjs'],
    testo: `'''Cosa si salva''' su [[pzkko.it]], e dove: la risposta sta nella pagina [[Info (pagina)|info]] e nel codice, e cambia secondo che si abbia o no [[Il conto|un conto]].

== Senza conto ==
I [[I $pzk|$pzk]] della [[La sessione|sessione]] (1.000, che non cambiano mai e tornano a 1.000 a secco) e lo [[Lo zaino|zaino]] stanno nel <code>sessionStorage</code> di questa scheda del browser e spariscono quando la si chiude. Dal 31.10 gli ospiti vivono anche nella memoria del [[La banca sul server|server]], che decide gli esiti, ma senza nessun dato che resti. [[Il cercapersone zero|Il cercapersone]] senza conto si apre solo sull'[[Account (app)|account]]; i giochi del muro si giocano lo stesso.

== Col conto ==
Sul [[Il server dei dati in casa|server di pzkko]], in casa di Alberto: il nome (2–20 lettere), il PIN (cifrato con scrypt e sale: non si legge e non si recupera), i $pzk e gli EUR€, le ultime 40 mosse, lo zaino (al più 12 KB), il profilo, il libro dei conti, i tavoli aperti. '''Nessuna e-mail, nessun dato vero.''' Il nome, il livello, le statistiche, la faccia, il colore e il motto sono pubblici nelle [[Le classifiche|classifiche]] e nel [[Il database dei giocatori|database dei giocatori]]; mai il PIN né gli oggetti uno per uno. Il token di accesso (firmato HMAC, 180 giorni) e la copia del conto stanno nel <code>localStorage</code> (<code>pzkko-wallet</code>).

== Nel browser, come comodità ==
Le chiavi <code>pzkko-*</code> del <code>localStorage</code>: le scelte di [[Come parte la home|come parte]] (<code>pzkko-3d</code>, <code>pzkko-ora</code>, <code>pzkko-meteo</code>), i suoni (<code>pzkko-suono</code>), la qualità della scena (<code>pzkko-grafica</code>), la luce del portachiavi, gli ultimi numeri della roulette, le regole scelte del dado, le uscite della moneta, il seme del giocatore delle mine (<code>pzkko-mine</code>), la schedina di virtual (<code>pzkko-virtual:nome</code>), chi ha firmato la petizione (<code>pzkko-firma</code>), la guida e le impostazioni dello zero (<code>pzkko-zero-*</code>), il menu di questa wiki (<code>pzkkopedia-menu</code>), il regalo di Instagram, la versione dello scontrino delle novità. In <code>sessionStorage</code> il brano e il punto della musica.

== Cosa esce dal sito ==
Il codice dell'app [[Codice C (app)|codice C]] si compila fuori da pzkko, su [[Compiler Explorer]] (godbolt.org) o su Wandbox: «non scriverci password», dice la pagina. Le foto dei quiz arrivano da Wikimedia Commons e Imgur. Il meteo si chiede a Open-Meteo dal server, una volta ogni dieci minuti, non una per visita. Per la [[La petizione|petizione]] e il [[Il contatore di Better Call Pekko|contatore di Pekko]] gli IP contano in memoria e non si salvano.

{{Vedi anche|Il conto|La sessione|Il server dei dati in casa|Le classifiche|Info (pagina)}}
[[Categoria:I soldi]]
[[Categoria:Il server]]`,
  },

  'La beta': {
    data: '2026-11-02',
    fonti: ['albertopecchini.it/pzkko/info/index.html', 'albertopecchini.it/pzkko/benvenuto/benvenuto.js'],
    testo: `'''La beta''' è lo stato in cui [[pzkko.it]] si dichiara nella pagina [[Info (pagina)|info]]: «È in beta: le cose cambiano spesso, e qualcosa si rompe.» Dal 7 ottobre 2026, quando il sito è nato, al 2 novembre ci sono stati più di duecento commit di pzkko nel [[Il repository AP|repository]], quattro [[Le versioni di pzkko|versioni]] (il portafoglio, la scrivania, il muro, il muro in 3D con la lumaca catodica e poi la chiocciola zero), un cercapersone cancellato «per sempre» e rifatto, lo storage spostato da [[Vercel Blob]] al [[Il server dei dati in casa|pc di casa]] in una notte.

== Cosa vuol dire per chi gioca ==
I [[I $pzk|$pzk]] sono finti, ma i conti sono veri e si tengono: i cambi di regola sono fatti per non togliere niente a nessuno (chi aveva comprato lo zero a 9.999 lo tiene coi bonus, [[I lotti numerati|i lotti]] accettano anche i browser col codice di prima, le operazioni della banca rimettono quello che un bug aveva tolto). Quando il server è spento pzkko dice «in pausa» e si gioca coi 1.000 della sessione: niente si perde. [[Lo scontrino delle novità]] dice cosa è cambiato a ogni versione.

== E la wiki ==
La pagina info diceva: «la wiki: arriva quando pzkko esce dalla beta». Il 2.11.2026 è arrivata prima, perché [[Alberto Pecchini|Alberto]] l'ha chiesta («costruisci la wiki completissima con qualsiasi cosa del sito collegata tra cose»), e con la regola di [[Pzkkopedia:Come si aggiorna|aggiornarla a ogni push]]: così la beta e la wiki vanno avanti insieme.

{{Vedi anche|Le versioni di pzkko|Lo scontrino delle novità|Pzkkopedia|Info (pagina)}}
[[Categoria:Le versioni]]`,
  },
}
