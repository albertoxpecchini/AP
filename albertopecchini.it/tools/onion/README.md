# Indirizzo .onion

    http://m6dnsjjtyp3jqy7ectjofe3545uacq5rbabe5yoj35rnpv4l32hrndad.onion

Il sito servito da questo PC, raggiungibile con Tor Browser. Vercel non c'entra:
né la build né le visite passano da lì.

## Come funziona

Tor (Expert Bundle 15.0.24, Tor 0.4.9.13, in `%LOCALAPPDATA%\Tor\bundle`) pubblica
l'onion service e passa le visite a `onion.mjs` su `127.0.0.1:8099`, un server
statico che risponde con l'ultima build pubblicata. Tor fa solo connessioni in
uscita, quindi non si apre nessuna porta sul router.

## Pubblicare

L'onion **non** segue le modifiche da solo: mostra la build pubblicata a mano,
dalla cartella del sito:

    npm run onion

`pubblica.mjs` fa la build del sito così com'è sul PC (anche i file non
committati: lo dice alla fine) in `%LOCALAPPDATA%\Tor\www\a` o `\b`, la ritocca
per l'onion e poi scrive `www\attiva.txt`: il server passa alla nuova cartella
senza riavvii, e durante la build chi visita vede ancora quella di prima. Per
tornare alla versione precedente basta rimettere in `attiva.txt` l'altra lettera.

Ritocchi rispetto al sito su Vercel:

- **modulo di contatto**: senza `data-endpoint`, quindi compone l'email nel
  programma di posta di chi scrive (il ramo già previsto in `src/client/form.js`);
  `/api/…` qui non esiste;
- **`/email/`** non è servita (strumento privato, senza `api/` non funziona);
- **collegamenti interni assoluti** (`https://www.albertopecchini.it/…` dentro
  `<a>`) diventano relativi, per restare sull'onion. Il credito nel piè di pagina
  (`https://www.albertopecchini.it`, senza percorso) resta com'è;
- **immagini**: le `url(/media/…)` negli stili (tasti «sasso») diventano variabili
  `data:` in `onion-<hash>.css`, le icone diventano `data:` e uno script in testa
  ripassa le `<image>` SVG (aragosta, mappa dei contatti) come `blob:`. Serve
  contro un difetto di Tor Browser 15 (Firefox 140), che sull'onion portava a
  https proprio queste immagini
  ([tor-browser#43012](https://gitlab.torproject.org/tpo/applications/tor-browser/-/issues/43012),
  [Mozilla 1918915](https://bugzilla.mozilla.org/show_bug.cgi?id=1918915), corretto
  in Firefox 158). Il 3.10.2026, in una prova con Tor Browser 15.0.24 headless e
  un profilo nuovo, il difetto non si è ripresentato: il ritocco costa poco e resta.

Da `vercel.json` valgono anche qui i rinvii (`/assistenza/` → bettercallpekko.it)
e le intestazioni; indirizzi con la barra finale come su Vercel; risposte
compresse (br/gzip), ETag e richieste a pezzi per PDF e DWG. Nessuna intestazione
`Date` e nessun registro delle visite.

## Secondo indirizzo: «nuovo»

L'indirizzo non si scrive qui: è nel file `%LOCALAPPDATA%\Tor\onion\nuovo\hostname`.
Il 4.10.2026 è stato cambiato; le chiavi di quello precedente, ormai spento, sono
in `onion\nuovo-vecchio-20261004-1005\`.

Lo stesso processo serve anche la cartella `%USERPROFILE%\ygdrgs\sito` (il
negozio in HTML 3.2 che scrive «Genera sito.bat») su `127.0.0.1:8100`, che Tor
pubblica con le chiavi di `onion/nuovo/`. Niente `npm run onion`: appena il
generatore ha riscritto le pagine, la visita successiva le vede. Il resto di
`ygdrgs` (`dati\`, `strumenti\`, `contenuti\`) non è pubblico. Valgono le regole
del sito (`404.html`, barra finale, br/gzip, ETag), non i rinvii e le
intestazioni di `vercel.json`; i nomi che cominciano con il punto non si servono.
Immagini e foto (`/img/`, `/foto/`) escono con `Cache-Control: public,
max-age=86400`: il generatore mette nel loro indirizzo una marca che cambia con
il contenuto, quindi il browser non le richiede a ogni pagina.

Se all'avvio la porta 8100 è già occupata da un altro programma, «nuovo» non
entra nel `torrc` (Tor passerebbe a quel programma le visite all'indirizzo): il
registro lo dice e il sito principale parte lo stesso.

## Avvio

Parte da solo con l'attività pianificata **«AP onion»** (finestra nascosta con
`conhost --headless`), che ha tre inneschi: l'accesso a Windows, lo sblocco della
sessione e un controllo ogni cinque minuti. Se il processo gira già, gli avvii in
più vengono ignorati; se è caduto, al controllo successivo riparte da solo.

I due inneschi in più ci sono dal 4.10.2026: quel giorno uno spegnimento non
andato a buon fine ha chiuso i processi dell'utente (compresi questi) senza
spegnere il PC, quindi senza un nuovo accesso, e il sito è rimasto spento per
due ore e mezza. Il «riavvia se fallisce» dell'attività non aiuta: quando node
cade, conhost esce con codice 0 e per l'Utilità di pianificazione non è un errore.

Tenerla ferma: `Disable-ScheduledTask 'AP onion'` (altrimenti entro cinque minuti
riparte). Toglierla: `Unregister-ScheduledTask 'AP onion'`. A mano, dalla radice
del repo:

    node albertopecchini.it/tools/onion/onion.mjs

Se il servizio è già acceso esce subito. Se il processo si chiude, si chiude anche
Tor (`__OwningControllerProcess`). Per caricare una nuova versione di `onion.mjs`:
`Stop-ScheduledTask 'AP onion'`, chiudere il processo `node … onion.mjs` rimasto
(Stop-ScheduledTask chiude solo conhost), `Start-ScheduledTask 'AP onion'`
(se ci si dimentica, riparte comunque al controllo successivo).
L'indirizzo esiste solo mentre il PC è acceso e il processo gira: per questo il
sito su Vercel non manda l'intestazione `Onion-Location`.

## File (fuori dal repo, in `%LOCALAPPDATA%\Tor`)

- `www/a`, `www/b`: le due build; `www/attiva.txt`: quella servita;
  `www/<lettera>.json`: data, commit, rinvii e intestazioni di quella build
- `torrc`: riscritto a ogni avvio da `onion.mjs`
- `data/`: stato di Tor; `tor.log` e `onion.log`: registri
- `onion/albertopecchini/`: le chiavi del servizio. `hs_ed25519_secret_key` **è**
  l'indirizzo: se si perde, l'indirizzo è perso per sempre; chi la copia può
  spacciarsi per il sito. Tenerne una copia in un posto sicuro, mai nel repo.
- `onion/nuovo/`: le chiavi dell'indirizzo «nuovo», con le stesse cautele.

## Verifica

    curl --socks5-hostname 127.0.0.1:9250 http://<indirizzo>/

Per vedere le pagine in un vero Tor Browser senza toccare quello aperto:
puppeteer-core con `browser: 'firefox'`, `executablePath` sul `firefox.exe` di Tor
Browser, un profilo a parte e, nell'ambiente, `TOR_PROVIDER=none`,
`TOR_SKIP_LAUNCH=1`, `TOR_SOCKS_HOST=127.0.0.1`, `TOR_SOCKS_PORT=9250`. Usare la
prima scheda (`browser.pages()[0]`): nella prova del 3.10 le schede aperte con
`newPage()` non navigavano.

## Aggiornare Tor

Scaricare il nuovo Expert Bundle per Windows x86_64 da
https://download.torproject.org/tor/, verificare la firma `.asc` con la chiave
Tor Browser Developers (EF6E 286D DA85 EA2A 4BA7 DE68 4E2C 6E87 9329 8290),
estrarlo al posto di `bundle/` e riavviare.
