# La macchina del tempo

La pagina `/tempo/` è una copia della Wayback Machine: la barra in cima con l'istogramma
dei commit per giorno e le frecce fra una cattura e l'altra, sotto la home com'era quel
giorno, dal primo commit (24 maggio 2026, «Add files from Figma Make») a oggi. Le versioni le ricostruisce questo
strumento dal codice di allora, e le fotografa.

```sh
node tools/tempo/tempo.mjs                 # un giorno alla volta: l'ultimo commit di ogni giorno che manca
node tools/tempo/tempo.mjs --forza         # rifà anche le versioni già fotografate
node tools/tempo/tempo.mjs --solo=<sha>    # una versione sola (più sha separati da virgola)
node tools/tempo/tempo.mjs --da=2026-09-01 # solo da quel giorno in poi
node tools/tempo/tempo.mjs --limite=5      # al massimo cinque versioni, poi si ferma
node tools/tempo/tempo.mjs --manifesto     # riscrive solo src/data/tempo.js da quello che c'è
```

## Come funziona

1. **I giorni.** `git log` del repository, fuori pzkko, Better Call Pekko, i workflow, i
   documenti di radice e quello che produce la macchina stessa (foto, manifesto, `tools/tempo`:
   altrimenti ogni aggiornamento delle foto diventerebbe il «giorno di oggi» da rifotografare);
   di ogni giorno (ora italiana) si tiene l'ultimo commit e si conta
   quanti ne ha avuti.
2. **La ricostruzione.** `git archive` del commit in `tools/tempo/lavoro/sito` (fuori da git).
   Le dipendenze restano da una versione all'altra se `package-lock.json` non è cambiato,
   altrimenti `npm ci` (o `npm install`, dove il lock non c'era). Poi `npm run build`
   (`npx vite build` se non c'è lo script); la cartella è `dist`, `build` o `out`. Fino
   al 17 settembre 2026 il sito stava alla radice del repository, dopo in `albertopecchini.it/`:
   lo strumento guarda dov'è il `package.json`.
3. **La foto.** Un server statico sulla cartella compilata (le app a pagina singola
   rispondono con la home a ogni indirizzo), Chromium headless con `puppeteer-core` di
   `tools/catture` (il browser lo trova `tools/pzkko/browser.mjs`), `prefers-reduced-motion`,
   pagina fatta scorrere fino in fondo, poi la home a 1280 px a tutta altezza e a 390 px.
   Con sharp diventano WebP larghi 960 e 390 (al massimo 6000 di altezza) in
   `public/media/tempo/<sha>-d.webp` e `-m.webp`. Si salva anche il `<title>` della pagina.
4. **Il manifesto.** `src/data/tempo.js` (GENERATO): una riga per versione — numero, sha,
   data, ora, messaggio, commit del giorno, misure delle foto, titolo. Una versione che non
   si compila o non si fotografa resta con il suo `errore`: la pagina la racconta lo stesso.
   Il manifesto si riscrive dopo ogni versione, quindi si può interrompere e riprendere.

## Il deposito per il server di casa

Con `--deposito=C:\pzkko-server\tempo` ogni versione viene anche depositata intera in
`versioni\<sha>\`: i file di testo (HTML, CSS, JS, manifest, JSON) con gli indirizzi assoluti
riscritti su `/tempo/<sha>/`. Si riscrivono sempre gli attributi dell'HTML (`href`, `src`,
`action`, `poster`, i `srcset`) e i `url(/x)` del CSS; le stringhe del JS solo se il primo pezzo
del percorso è un file o una cartella che c'è in cima alla versione: `"/assets/…"` sì, il
suffisso `"/10"` di un voto no (il 3.11.2026 «8.5/10» era diventato «8.5/tempo/540d403/10»).
Un indirizzo che ha già il prefisso della versione non si riscrive più: dal 3.11.2026 il sito ha
una cartella `tempo/` (la macchina del tempo stessa) e il passaggio sulle stringhe raddoppiava il
prefisso, «/tempo/bc7ba74/tempo/bc7ba74/assets/…», così CSS e JS non si caricavano.
Gli indirizzi che il JS di allora costruisce da sé il server li rimanda dentro la versione,
guardando da quale pagina arriva la richiesta. I binari stanno una volta sola in
`store\<hash>` con collegamenti fisici. `stato.json` elenca le versioni pronte.

Li serve `C:\pzkko-server\tempo\server.mjs` (127.0.0.1:8789, fuori col Funnel di Tailscale sul
percorso `/tempo`, vedi il LEGGIMI lì): la pagina `/tempo/` lo interroga e, se risponde, mostra
le pagine vere in un iframe invece delle foto. Le richieste ai servizi esterni di allora (l'API
di GitHub sul vecchio nome del repository, i servizi di anteprima) possono non rispondere più:
quello non si riporta in vita.

## Quanto ci mette

Circa un minuto a versione quando le dipendenze non cambiano, qualche minuto quando
serve `npm ci`: tutte le versioni dall'inizio sono un paio d'ore. Le foto pesano
50–150 KB l'una.
