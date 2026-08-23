// ─────────────────────────────────────────────────────────────────────────────
// L'elenco dei comandi del progetto, in un posto solo.
//
// Non è generato: `package.json` sa COME si chiamano gli script, non a cosa
// servono, e la riga di comando che li lancia non dice mai cosa produce. Questo
// file tiene insieme le due cose — il comando esatto da incollare e il motivo
// per cui esiste — e la pagina /comandi non fa altro che metterli in ordine.
//
// La regola per tenerlo onesto: ogni voce nomina il file che esegue davvero.
// Se quel file non c'è più, la voce è morta con lui e va tolta di qui.
// ─────────────────────────────────────────────────────────────────────────────

export type Voce = {
  /** Il comando esatto, come si scrive nel terminale. */
  cmd: string;
  /** Una riga: cosa fa. */
  breve: string;
  /** Il perché, per esteso. */
  dettaglio: string;
  /** Il file che viene eseguito davvero. */
  file?: string;
  /** Cosa lascia sul disco quando ha finito. */
  esce?: string[];
  /** Opzioni riconosciute: [come si scrive, cosa cambia]. */
  opzioni?: [string, string][];
  /** Un avvertimento, o quando parte da solo. */
  nota?: string;
  /** Non è un comando da terminale (console del browser, tasto di VS Code). */
  fuoriDalTerminale?: boolean;
};

export type Gruppo = {
  id: string;
  titolo: string;
  intro: string;
  voci: Voce[];
};

export const GRUPPI: Gruppo[] = [
  // ── I tre di tutti i giorni ────────────────────────────────────────────────
  {
    id: "quotidiani",
    titolo: "Tutti i giorni",
    intro:
      "I tre comandi che bastano per lavorare al sito. Gli altri servono a rifare qualcosa che questi tre danno già per pronto.",
    voci: [
      {
        cmd: "npm run dev",
        breve: "Accende il server di sviluppo su localhost:5173 — e sulla rete di casa.",
        dettaglio:
          "Vite con l'aggiornamento a caldo, più tutto quello che esiste SOLO qui: gli endpoint /api/*, l'officina /cleaning e le foto degli shooting su /scatti-privati/*. Vivono dentro configureServer, l'aggancio che gira solo in sviluppo — sul sito pubblicato quelle rotte non sono protette, non ci sono proprio.",
        file: "vite.config.ts",
        nota: "Vite ascolta su tutte le interfacce (host: true): all'avvio stampa anche un indirizzo 10.x.x.x da aprire dal telefono, purché sotto lo stesso Wi-Fi e con la porta 5173 aperta nel firewall. Prima parte il predev, che rifà i pacchetti i18n. La porta è fissa (strictPort), quindi un secondo vite sulla stessa porta fallisce invece di scivolare sulla 5174.",
      },
      {
        cmd: "npm run build",
        breve: "Costruisce il sito statico in dist/.",
        dettaglio:
          "È lo stesso comando che gira su Vercel a ogni push su main. Prima di vite build parte il prebuild, che rifà quattro cose in fila: il numero di versione di Trivia, gli ZIP dell'archivio, la fotografia del repository e i pacchetti di traduzione.",
        file: "vite.config.ts",
        esce: ["dist/"],
      },
      {
        cmd: "npm run preview",
        breve: "Serve la dist/ già costruita, senza niente di sviluppo intorno.",
        dettaglio:
          "La cosa più vicina al sito pubblicato che si possa aprire in casa: nessun middleware, nessun /api, nessuna officina. Se una pagina funziona in dev e si rompe qui, il colpevole è quasi sempre qualcosa che esisteva solo grazie al server di sviluppo.",
      },
    ],
  },

  // ── I pezzi del prebuild ───────────────────────────────────────────────────
  {
    id: "inventari",
    titolo: "Gli inventari, uno per volta",
    intro:
      "Il prebuild li rifà tutti e quattro a ogni build. Qui si rigenera solo quello che serve, senza aspettare una build intera.",
    voci: [
      {
        cmd: "npm run zips",
        breve: "Rigenera gli ZIP del codice sorgente che /archivio fa scaricare.",
        dettaglio:
          "Un archivio per ogni progetto interno, col codice della sua cartella. I cinque giochi si portano dietro anche il motore condiviso e un LEGGIMI che chiarisce che è sorgente di riferimento, non un pacchetto eseguibile a sé. Esce anche il manifesto con le dimensioni vere, così la colonna «Dimensione» dell'archivio non è scritta a mano.",
        file: "scripts/build-zips.mjs",
        esce: ["public/zips/<id>.zip", "public/zips/manifest.json"],
      },
      {
        cmd: "npm run repo-tree",
        breve: "Rifà la fotografia del repository che /archivio mostra.",
        dettaglio:
          "L'elenco esatto dei file versionati (git ls-files), la dimensione reale di ognuno e la data dell'ultimo commit che l'ha toccato. Non passa dalle API di GitHub perché il repository è privato: un token nel front-end non si mette, e git in fase di build è comunque la fonte più fedele.",
        file: "scripts/build-repo-tree.mjs",
        esce: ["public/repo-tree.json"],
      },
      {
        cmd: "npm run i18n",
        breve: "Spacchetta il dizionario in quattro pacchetti, uno per lingua.",
        dettaglio:
          "Il file sorgente con dentro tutte e quattro le lingue pesa 230 kB, e importato in cima finiva nel bundle iniziale per intero: un visitatore italiano si scaricava anche francese, tedesco e inglese. Da qui escono mappe piatte per lingua, e il motore carica con un import dinamico solo quella attiva.",
        file: "scripts/build-i18n.mjs",
        esce: ["src/app/i18n/generated/<lingua>.json"],
        nota: "La cartella generata è rigenerabile e sta in .gitignore. Il dizionario sorgente non si tocca: resta lui la fonte unica.",
      },
      {
        cmd: "node scripts/build-trivia-version.mjs",
        breve: "Ricalcola il numero di versione di Trivia, ma solo dove la storia git è intera.",
        dettaglio:
          "La versione è «1.<commit che hanno toccato Trivia>». Vercel però clona in shallow, e lì lo stesso codice diceva v1.2 mentre in locale diceva v1.56: quel numero misurava la profondità del clone, non il gioco. Così il conteggio si fa solo quando la storia c'è tutta, si scrive in un file versionato, e il builder usa il valore arrivato col checkout.",
        file: "scripts/build-trivia-version.mjs",
        esce: ["src/app/trivia/version.json"],
        nota: "Non ha un alias npm perché non serve: gira da solo sia nel prebuild che nel predev.",
      },
    ],
  },

  // ── Le foto ────────────────────────────────────────────────────────────────
  {
    id: "foto",
    titolo: "Le foto",
    intro:
      "Gli originali non stanno nel repository: la cartella foto/ è in .gitignore. Questi comandi si lanciano a mano sul computer dove le foto ci sono davvero, e nel repository ci va solo il risultato.",
    voci: [
      {
        cmd: "npm run foto",
        breve: "Album MiMa: dalle foto originali alle immagini per il web, più il manifesto.",
        dettaglio:
          "Legge gli EXIF di ogni scatto in foto/mima/, ne fa una versione grande e una miniatura in WebP senza metadati, e scrive il manifesto che la pagina /mima legge davvero. Niente è messo in ordine a mano: il punto sulla mappa viene da GPSLatitude/GPSLongitude, l'ordine da DateTimeOriginal, il nome del posto dall'elenco in content/mima/.",
        file: "scripts/build-foto-mima.mjs",
        esce: ["public/images/mima/", "src/app/mima/foto.json"],
        nota: "È incrementale: ogni file in uscita porta in fondo al nome un'impronta dell'originale, quindi una foto già convertita non si riconverte. Non gira nel prebuild — su Vercel gli originali non ci sono, e ricodificare 300 immagini a ogni deploy sarebbe assurdo.",
      },
      {
        cmd: "npm run scatti",
        breve: "Shooting: scrive due manifesti separati, e le foto restano in casa.",
        dettaglio:
          "Fratello del comando qui sopra, con la differenza che cambia tutto: sono ritratti di persone, e le immagini non diventano pubbliche. Esce un manifesto PUBBLICO con solo date, luoghi e conteggi, e uno PRIVATO — dentro foto/, che nessuna build attraversa — con titoli, scatti e misure. Le miniature finiscono accanto agli originali, mai in public/: public/ viene copiata in dist/ da ogni build, quindi una foto messa lì sarebbe a un deploy di distanza dall'essere pubblica.",
        file: "scripts/build-foto-shooting.mjs",
        esce: [
          "src/app/shooting/sessioni.json",
          "foto/shooting/.web/manifesto.json",
          "foto/shooting/.web/",
        ],
      },
      {
        cmd: "npm run scatti:carica -- s1",
        breve: "Porta UNA sessione nel secchio privato, perché qualcuno possa vederla da lontano.",
        dettaglio:
          "/shooting può dare a una persona il permesso di vedere i propri ritratti, e per vederli da fuori le foto devono stare da qualche parte che non sia questo computer. Quel posto è un bucket Supabase PRIVATO: nessun indirizzo pubblico, si apre solo con una firma che il server rilascia a chi ha un permesso vivo, e la firma scade in un'ora. Sale tutto — miniatura, versione media e originale — così chi è ritratto scarica i suoi scatti a piena risoluzione. È un comando a parte, e vuole il nome della sessione scritto per esteso: caricare le foto di qualcuno è una decisione, non l'effetto collaterale di un altro comando. Quello che non si nomina resta qui.",
        file: "scripts/scatti-carica.mjs",
        opzioni: [
          ["npm run scatti:carica", "senza argomenti: dice quali sessioni sono già di sopra"],
          ["npm run scatti:togli -- s1", "la toglie dal bucket, permessi già dati compresi"],
        ],
        nota: "Se il bucket risulta pubblico il comando si ferma e lo dice: un secchio pubblico manderebbe all'aria tutto il resto del meccanismo. Le sessioni mai caricate restano irraggiungibili comunque, anche a permesso dato — su /shooting il modulo compare solo dove chiedere ha senso.",
      },
      {
        cmd: "node scripts/foto-zone.mjs",
        breve: "Dice dove si sono fermati, per poter dare un nome ai posti.",
        dettaglio:
          "Raggruppa il GPS delle foto per vicinanza: se venti scatti cadono nello stesso fazzoletto di cinquanta metri, lì dentro c'è qualcosa che la mappa può nominare invece di piantarci sopra una coordinata nuda. Stampa i gruppi in ordine di grandezza, segna quali cadono vicino a un posto già noto e quali sono da battezzare, con un link alla mappa per riconoscerli al volo.",
        file: "scripts/foto-zone.mjs",
        opzioni: [
          [
            "node scripts/foto-zone.mjs 5 80",
            "gruppi da 5 foto in su, raggio 80 metri (predefinito: 3 e 60)",
          ],
        ],
        nota: "Non scrive niente e non tocca nessun file: è un rapporto, si può rilanciare mentre le foto stanno ancora arrivando.",
      },
      {
        cmd: "node scripts/build-cars.mjs <cartella>",
        breve: "Rimette i tre modelli 3D del garage in un formato che il browser apre.",
        dettaglio:
          "Un FBX binario e due OBJ diventano geometria binaria e texture WebP: stessi vertici, stesse normali, stesse UV, stessi materiali. Non si semplifica e non si ricolora niente — cambiano solo i contenitori. L'unica cosa che il modello si prende dallo script è la posa in scena: centrato, appoggiato a terra, muso in avanti, alla sua lunghezza vera in metri.",
        file: "scripts/build-cars.mjs",
        esce: ["public/models/"],
        nota: "I modelli sorgente non stanno nel repository: la cartella si passa come argomento.",
      },
    ],
  },

  // ── Pulizia e benchmark ────────────────────────────────────────────────────
  {
    id: "pulizia",
    titolo: "Pulizia e benchmark",
    intro:
      "Un programma locale che toglie il peso morto dal repository e deve dimostrare di non aver rotto niente. Non cancella: mette in quarantena, ricostruisce, misura con un browser vero, e se qualcosa peggiora rimette tutto a posto da solo.",
    voci: [
      {
        cmd: "npm run pulizia",
        breve: "Cerca lo sporco e misura, senza toccare niente.",
        dettaglio:
          "Sei categorie, in ordine di quanto è sicuro toccarle: file rigenerabili, moduli in src/ che nessuno importa, asset in public/ che nessun testo nomina, dipendenze mai importate, duplicati esatti e roba di git. La regola che tiene insieme tutto è che nel dubbio non è sporco: ogni candidato deve superare due prove indipendenti, e chi viene nominato in modo dinamico è protetto in blocco.",
        file: "scripts/janitor/pulisci.mjs",
        opzioni: [
          ["-- --niente-bench", "salta il benchmark e riferisce e basta"],
          ["-- --rami", "guarda anche i rami git già confluiti in main"],
          ["-- --tutto", "conta come sporco anche gli inventari che rifà il prebuild"],
        ],
      },
      {
        cmd: "npm run pulizia:applica",
        breve: "Pulisce, verifica, e se qualcosa peggiora annulla da solo.",
        dettaglio:
          "L'ordine è tutto: si misura prima, si mette in quarantena, si ricostruisce, si misura dopo. Se la build fallisce, o compare un 404 che prima non c'era, o un errore in console che prima non c'era, tutto quello che era stato messo da parte torna al suo posto. Il caso peggiore di un'esecuzione senza sorveglianza è un log che dice «annullato».",
        file: "scripts/janitor/pulisci.mjs",
        opzioni: [
          ["-- --headless", "finestra del browser invisibile"],
          ["-- --pagine /,/trivia", "misura solo queste pagine"],
          ["-- --ripetizioni 2", "quante passate per pagina (predefinito 3, si tiene la mediana)"],
        ],
        nota: "Niente viene cancellato: quello che sembra inutile finisce in .janitor/quarantena/<data>/ coi percorsi originali intatti, e si svuota per davvero solo dopo due settimane di sito funzionante.",
      },
      {
        cmd: "npm run pulizia:elenco",
        breve: "Le quarantene che esistono in questo momento.",
        dettaglio:
          "Cosa è stato messo da parte, quando, e quanto pesa. Serve a decidere se c'è qualcosa da riprendere prima che venga svuotata per davvero.",
        file: "scripts/janitor/pulisci.mjs",
      },
      {
        cmd: "npm run pulizia:ripristina",
        breve: "Rimette a posto l'ultima quarantena.",
        dettaglio:
          "Il ripristino automatico scatta da solo quando la verifica va male; questo è quello a mano, per quando ci si accorge dopo che serviva qualcosa. I percorsi originali sono conservati, quindi ogni file torna esattamente da dove era stato preso.",
        file: "scripts/janitor/pulisci.mjs",
      },
      {
        cmd: "npm run pulizia:prove",
        breve: "Le prove di sicurezza del programma di pulizia.",
        dettaglio:
          "Un programma che porta via roba da solo ogni due giorni deve poter dimostrare che sa quello che fa: qui si piantano file veri nel repository, si guarda cosa decide l'analisi, e poi si rimette tutto com'era. Le prove non sono simmetriche di proposito — due controllano che lo sporco venga trovato, le altre due, più importanti, che il pulito non venga toccato.",
        file: "scripts/janitor/autotest.mjs",
      },
      {
        cmd: "npm run bench",
        breve: "Solo benchmark: costruisce, misura i fotogrammi, confronta con l'ultima volta.",
        dettaglio:
          "Un browser vero (Edge, parlato direttamente via Chrome DevTools Protocol: zero dipendenze aggiunte) apre le pagine costruite, le scorre tutte giù e tutte su e cronometra ogni fotogramma. Si misura due volte, a piena potenza e con la CPU quattro volte più lenta: senza freno la misura satura — una pagina vuota segna gli stessi fps di una pagina piena — ed è la passata frenata l'unica che sappia distinguere un peggioramento.",
        file: "scripts/janitor/bench-cli.mjs",
        esce: [".janitor/bench/"],
        opzioni: [
          ["-- --veloce", "salta la build e misura la dist che c'è"],
          ["-- --headless", "finestra invisibile, come nel compito pianificato"],
          ["-- --pagine /,/trivia", "misura solo queste pagine"],
          ["-- --ripetizioni 5", "quante passate per pagina"],
        ],
      },
      {
        cmd: "pulizia",
        breve: "La stessa cosa dal Prompt dei comandi, senza il -- di npm.",
        dettaglio:
          "Alla radice del repository c'è un file .cmd che fa da porta d'ingresso unica: pulizia, pulizia applica, pulizia bench, pulizia prove, pulizia elenco, pulizia ripristina, e pulizia pianifica · togli · stato per il compito automatico. Quello che si scrive in più passa dritto al programma, e un'opzione da sola vale come analisi — quindi «pulizia --niente-bench» fa la cosa che ci si aspetta. Il codice di uscita si propaga, così si può incatenare.",
        file: "pulizia.cmd",
      },
      {
        cmd: "powershell -ExecutionPolicy Bypass -File scripts\\janitor\\pianifica.ps1",
        breve: "Registra il compito che fa la pulizia da solo ogni due giorni.",
        dettaglio:
          "Compito dell'utente, non di sistema: niente diritti di amministratore, niente password da conservare. Finestra del browser invisibile e log in .janitor/log/, di cui si tengono gli ultimi venti. Se il computer era spento a quell'ora, recupera al primo avvio utile.",
        file: "scripts/janitor/pianifica.ps1",
        opzioni: [
          ["-Ora 09:30", "a un'altra ora (predefinito 13:00)"],
          ["-Stato", "quando ha girato e quando girerà"],
          ["-Rimuovi", "toglie il compito"],
        ],
        nota: "I numeri di un'esecuzione automatica non sono confrontabili con quelli di npm run bench lanciato a mano: l'Utilità di pianificazione fa girare i compiti a priorità ridotta. Il confronto prima/dopo dentro la stessa esecuzione resta valido, ed è quello che decide se la pulizia si tiene.",
      },
    ],
  },

  // ── Una tantum ─────────────────────────────────────────────────────────────
  {
    id: "occasionali",
    titolo: "Quando serve",
    intro:
      "Comandi che si lanciano poche volte l'anno, o una volta sola. Stanno qui perché quando servono non ci si ricorda mai come si scrivevano.",
    voci: [
      {
        cmd: "python3 scripts/build-cv.py",
        breve: "Rigenera i PDF statici del curriculum, uno per lingua.",
        dettaglio:
          "Legge gli stessi JSON che alimentano la pagina /cv e ne stampa un PDF per lingua, con la stessa pelle del sito. Il curriculum «vivo» resta la pagina, che stampa sé stessa: questi PDF esistono per i link storici e per l'archivio, e per mandarli a mano in una candidatura.",
        file: "scripts/build-cv.py",
        esce: ["public/cv-alberto-pecchini-<lingua>.pdf"],
        opzioni: [
          ["python3 scripts/build-cv.py it en", "solo alcune lingue (predefinito: tutte e quattro)"],
        ],
        nota: "Serve Python con WeasyPrint e il font Ubuntu installato a sistema. È l'unico comando del progetto che non è né Node né npm.",
      },
      {
        cmd: "node scripts/anteprima-email.mjs",
        breve: "Fa vedere tutte le email del sito senza spedirne nessuna.",
        dettaglio:
          "Un'email si guarda solo quando è arrivata, e per farla arrivare bisogna spedirla: qui invece vengono costruite tutte con dati finti — il voto della festa, il link aperto, le tre dello shooting — e scritte su disco insieme a un indice da aprire nel browser. Serve dopo ogni ritocco a lib/emailStile.ts, che è la faccia unica di tutte quante: i colori sono quelli della home, tradotti in esadecimale perché nelle email le variabili CSS non arrivano. Non tocca né Resend né Supabase.",
        file: "scripts/anteprima-email.mjs",
        esce: ["una cartella nel temporaneo di sistema (il percorso lo stampa alla fine)"],
        nota: "Anche lo scuro: le pagine seguono il tema del sistema, quindi per vederlo si cambia tema a Windows e si ricarica.",
      },
      {
        cmd: 'node --env-file=.env scripts/make-link.mjs "<url-o-file>" "<etichetta>"',
        breve: "Crea un link corto tracciabile che scade da solo.",
        dettaglio:
          "Stampa un indirizzo da incollare in un'email. Se gli si passa un URL già online, il link ci reindirizza; se gli si passa un file dal computer, lo carica in un bucket privato, ne fa un link firmato valido quanto il link corto, e a scadenza cancella anche il file. Non c'è un endpoint pubblico che faccia questa cosa, ed è apposta: serve la chiave di servizio, e quella sta solo qui.",
        file: "scripts/make-link.mjs",
        opzioni: [["--days 14", "quanto dura prima di scadere (predefinito 7 giorni)"]],
        nota: "Le chiavi vivono in un .env locale, non versionato.",
      },
      {
        cmd: "node scripts/seed-online-profile.mjs",
        breve: "Pianta un profilo giocatore finto su Supabase, per provare Trivia.",
        dettaglio:
          "Usa le stesse identiche chiamate del client — lo stesso upsert, gli stessi insert, la stessa funzione per la pagella — così quello che si vede provando è quello che vedrebbe un giocatore vero. L'identificativo lo assegna il database e viene stampato a fine corsa.",
        file: "scripts/seed-online-profile.mjs",
        opzioni: [
          ["--url … --key …", "indirizzo e chiave pubblica, se non sono già nel .env"],
          ["--dry", "stampa cosa scriverebbe, senza toccare il database"],
        ],
        nota: "La chiave pubblica non può cancellare: per rimuovere il profilo di prova, lo script stampa in fondo l'SQL da incollare nel pannello.",
      },
      {
        cmd: "scripts/seed-local-profile.js",
        breve: "Lo stesso profilo finto, ma tutto dentro il browser.",
        dettaglio:
          "Non è un comando da terminale: si apre il sito, F12, si incolla tutto il file nella console e si ricarica. Riempie le chiavi di localStorage che il gioco usa quando Supabase non è configurato — la modalità «solo locale». Per annullare, le cinque chiavi da togliere sono stampate in fondo.",
        file: "scripts/seed-local-profile.js",
        fuoriDalTerminale: true,
      },
      {
        cmd: "node scripts/ensure-dev-server.mjs",
        breve: "Accende il server di sviluppo solo se non è già acceso.",
        dettaglio:
          "Non si lancia a mano quasi mai: è l'attività che parte con F5 in VS Code, prima che il debugger apra Edge. Se il server è già su da una sessione precedente lo riusa invece di riavviarlo — con la porta fissa, un secondo vite morirebbe subito con EADDRINUSE.",
        file: "scripts/ensure-dev-server.mjs",
        fuoriDalTerminale: true,
      },
    ],
  },
];

/** Quanti comandi in tutto. */
export const TOTALE = GRUPPI.reduce((n, g) => n + g.voci.length, 0);

/** Quanti si scrivono `npm run …`. */
export const QUANTI_NPM = GRUPPI.reduce(
  (n, g) => n + g.voci.filter((v) => v.cmd.startsWith("npm run")).length,
  0,
);

/** Il testo su cui lavora il filtro della pagina. */
export function testoDi(v: Voce): string {
  return [
    v.cmd,
    v.breve,
    v.dettaglio,
    v.file,
    ...(v.esce ?? []),
    ...(v.opzioni ?? []).flat(),
    v.nota,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
