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
          "Vite con l'aggiornamento a caldo, più tutto quello che esiste SOLO qui: gli endpoint /api/* e le foto degli shooting su /scatti-privati/*. Vivono dentro configureServer, l'aggancio che gira solo in sviluppo — sul sito pubblicato quelle rotte non sono protette, non ci sono proprio.",
        file: "vite.config.ts",
        nota: "Vite ascolta su tutte le interfacce (host: true): all'avvio stampa anche un indirizzo 10.x.x.x da aprire dal telefono, purché sotto lo stesso Wi-Fi e con la porta 5173 aperta nel firewall. Prima parte il predev, che rifà i pacchetti i18n. La porta è fissa (strictPort), quindi un secondo vite sulla stessa porta fallisce invece di scivolare sulla 5174.",
      },
      {
        cmd: "npm run build",
        breve: "Costruisce il sito statico in dist/.",
        dettaglio:
          "È lo stesso comando che gira su Vercel a ogni push su main. Prima di vite build parte il prebuild, che rifà quattro cose in fila: l'elenco dei commit, gli ZIP dell'archivio, la fotografia del repository e i pacchetti di traduzione.",
        file: "vite.config.ts",
        esce: ["dist/"],
      },
      {
        cmd: "npm run preview",
        breve: "Serve la dist/ già costruita, senza niente di sviluppo intorno.",
        dettaglio:
          "La cosa più vicina al sito pubblicato che si possa aprire in casa: nessun middleware, nessun /api. Se una pagina funziona in dev e si rompe qui, il colpevole è quasi sempre qualcosa che esisteva solo grazie al server di sviluppo.",
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
