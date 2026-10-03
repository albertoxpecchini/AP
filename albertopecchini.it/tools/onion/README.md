# Indirizzo .onion

    http://m6dnsjjtyp3jqy7ectjofe3545uacq5rbabe5yoj35rnpv4l32hrndad.onion

Lo stesso sito di www.albertopecchini.it, raggiungibile con Tor Browser.

## Come funziona

Tor (Expert Bundle 15.0.24, Tor 0.4.9.13, in `%LOCALAPPDATA%\Tor\bundle`) pubblica
l'onion service e passa le visite a `onion.mjs` su `127.0.0.1:8099`, che le gira
al sito su Vercel: Host `www.albertopecchini.it`, redirect riscritti come relativi,
niente HSTS. Tor fa solo connessioni in uscita, quindi non si apre nessuna porta
sul router. L'onion mostra esattamente il sito pubblicato, non le modifiche locali.

## Immagini

Tor Browser 15 (Firefox 140) considera l'onion un contesto sicuro e porta a https
le immagini delle maschere CSS (tasti «sasso»), delle `<image>` SVG (aragosta) e
le icone: sull'onion https non c'è, e restavano vuote
([tor-browser#43012](https://gitlab.torproject.org/tpo/applications/tor-browser/-/issues/43012),
[Mozilla 1918915](https://bugzilla.mozilla.org/show_bug.cgi?id=1918915), corretto
in Firefox 158). Per questo il proxy, in HTML, CSS, JS e manifest (risposte 200 e
404), riscrive `/media/`, `/art/` e le icone in `https://www.albertopecchini.it/…`:
le immagini arrivano dal dominio vero, sempre attraverso Tor. Quando Tor Browser
passerà a una base con la correzione, `TEXT`/`ASSET`/`rewrite` si possono togliere.
In alternativa servirebbe un certificato HTTPS per l'onion (HARICA, a pagamento).

## Avvio

Parte da solo all'accesso a Windows con l'attività pianificata **«AP onion»**
(finestra nascosta con `conhost --headless`, riavvio ogni minuto se cade).
Toglierla: `Unregister-ScheduledTask 'AP onion'`. A mano, dalla radice del repo:

    node albertopecchini.it/tools/onion/onion.mjs

Se il servizio è già acceso esce subito. Se il processo si chiude, si chiude anche
Tor (`__OwningControllerProcess`). L'indirizzo esiste solo mentre il PC è acceso
e il processo gira: per questo il sito non manda l'intestazione `Onion-Location`.

## File (fuori dal repo, in `%LOCALAPPDATA%\Tor`)

- `torrc`: riscritto a ogni avvio da `onion.mjs`
- `data/`: stato di Tor; `tor.log` e `onion.log`: registri
- `onion/albertopecchini/`: le chiavi del servizio. `hs_ed25519_secret_key` **è**
  l'indirizzo: se si perde, l'indirizzo è perso per sempre; chi la copia può
  spacciarsi per il sito. Tenerne una copia in un posto sicuro, mai nel repo.

## Limiti

- Il modulo di contatto passa da Cloudflare Turnstile, che probabilmente rifiuta
  il dominio .onion.
- Per Vercel tutte le visite via onion hanno l'IP di questo PC: il limite di invii
  del modulo (5 l'ora per IP) è condiviso.

## Aggiornare Tor

Scaricare il nuovo Expert Bundle per Windows x86_64 da
https://download.torproject.org/tor/, verificare la firma `.asc` con la chiave
Tor Browser Developers (EF6E 286D DA85 EA2A 4BA7 DE68 4E2C 6E87 9329 8290),
estrarlo al posto di `bundle/` e riavviare.
