# Catture dei siti

Le immagini dei siti che il portfolio mostra nei progetti web (mockup di MacBook, iPad e
iPhone, gallerie delle pagine interne, strisce dell’iPhone 18 Pro) stanno in
`public/media/web/`. Questo strumento le rifà quando un sito cambia, da solo.

| Progetto | Sito | File |
| --- | --- | --- |
| `rivaltasulmincio-it` | www.rivaltasulmincio.it | `rivalta-*` (home + mappa desktop e mobile con la scheda della chiesa, scheda del luogo su tablet) |
| `cascina-fontana` | www.cascinafontana.xyz | `cascina-*` (home + Prodotti, galleria con la lightbox, Contatti) |
| `albertopecchini-it` | www.albertopecchini.it | `ap-*` (home + `ap-iphone-NN`, pagina intera a strisce) |
| `dario-donelli` | dariodonelli.vercel.app | `dd-*` (home) |
| `pzkko-it` | www.pzkko.it | `pzk-*` (home di giorno con `?ora=12:00&notte=0`, la stessa di notte con `?ora=22:00&notte=1`, la roulette aperta su tablet, la 404 sul telefono; la finestra è la scena 3D, aspettata finché è pronta, le pagine intere il muro senza 3D, `?muro=1`) |

L’indirizzo viene da `web.url` in `src/data/projects.js`: quando Donelli passerà al suo
dominio basta cambiarlo lì.

## Come funziona

1. **Controllo.** Per ogni sito scarica l’HTML delle pagine da fotografare e ne calcola
   un’impronta. I siti sono fatti con Vite: CSS e JS hanno nel nome l’impronta del contenuto,
   quindi ogni deploy che cambia qualcosa cambia anche l’HTML. Se l’impronta è diversa
   dall’ultima volta (o se è cambiato lo strumento: `siti.js`, `catture.mjs`), il sito è da rifare.
2. **Catture.** Chromium headless (puppeteer-core): `prefers-reduced-motion` emulato,
   animazioni ferme sullo stato finale, pagina fatta scorrere fino in fondo perché reveal e
   immagini pigre partano, attesa di immagini, font e tessere delle mappe. Nelle pagine
   intere gli elementi fissi spariscono, tranne la testata in cima.
3. **Confronto.** Ogni cattura, convertita in WebP con sharp, si confronta pixel per pixel
   con il file che c’è già: se non si vede differenza il file resta com’è, così un sito
   rifotografato senza cambiamenti visibili non produce commit.
4. **Manifesto.** `src/data/catture.js` (generato) tiene misure e versione di ogni file;
   `shot()` in `projects.js` ci aggiunge `?v=<impronta>`, così i browser non mostrano la
   copia vecchia (su `/media/` la cache è di trenta giorni).

I formati sono quelli di catalogo (tabella nel README del sito, «Screenshot dei progetti
web»); l’iPhone è 402×812 a 2x, a strisce di al più 2400 px CSS (4800 px) perché oltre
16.384 px Chromium ripete i pezzi di pagina.

## Su GitHub Actions

`.github/workflows/catture.yml`, alla radice del repository:

- **ogni ora** (al minuto 17): controllo; se un sito è cambiato, catture e commit su
  `main` con le immagini nuove. Vercel pubblica il commit come ogni altro.
- **a ogni push** che tocca lo strumento o il workflow: stesso giro (con lo strumento
  cambiato si rifà tutto, ma i file identici non producono commit).
- **a mano**, da GitHub → Actions → *Catture dei siti* → *Run workflow*: si possono indicare
  i siti (`rivalta`, `cascina`, `ap`, `dd`, `pzk`) e forzarli anche se non sono cambiati.

L’ultima impronta di ogni sito non sta nel repository ma nella cache delle Actions
(`stato.json`): se la cache sparisce, il giro successivo rifotografa tutto e pubblica solo
ciò che si vede diverso. Il commit ha come autore l’account che ha avviato il workflow: con
il piano Hobby Vercel pubblica solo i commit del titolare del progetto.

Un giro senza cambiamenti dura pochi secondi ma GitHub lo conta come un minuto: circa 720
minuti al mese dei 2.000 gratuiti per i repository privati. Per spenderne meno basta
diradare il `cron` (per esempio `17 */2 * * *`, ogni due ore).

**pzkko.it e la scena 3D** (22.10): le catture della finestra si fanno senza
`captureBeyondViewport` (che puppeteer accende da sé e che ridimensiona la vista per lo
scatto: la tela WebGL usciva nera) e a un’ora fissa (`?ora=12:00`): la scena mette il sole
dove sta davvero, e col solo `?notte=0` il giro della sera fotografava una notte con le
luci spente, nera. Prima le catture di pzkko fallivano o venivano nere da giorni.

Se un sito è irraggiungibile, il giro lo salta con un avviso e riprova all’ora dopo. Se una
cattura fallisce, le altre si pubblicano lo stesso e il workflow finisce in errore (GitHub
manda un’email).

## In locale

```bash
cd albertopecchini.it
npm install --prefix tools/catture           # una volta: puppeteer-core e sharp
node tools/catture/catture.mjs --controlla   # quali siti sono cambiati
node tools/catture/catture.mjs               # rifà quelli cambiati
node tools/catture/catture.mjs --forza rivalta
node tools/catture/catture.mjs --prova ../prova ap   # scrive in ../prova, non tocca il sito
node tools/catture/catture.mjs --manifesto   # riscrive solo src/data/catture.js
```

Il browser è `CHROME_PATH` se c’è; altrimenti su Windows il Chromium di Playwright in
`%LOCALAPPDATA%\ms-playwright`, poi Chrome o Edge; su Linux `/usr/bin/google-chrome`. Le
dipendenze stanno nel `package.json` di questa cartella e non in quello del sito, così
Vercel non le installa a ogni build. In locale lo stato è `tools/catture/stato.json`
(ignorato da git), separato da quello della CI.

Le catture fatte su Windows e quelle della CI (Linux) differiscono di poco nel disegno dei
caratteri: la versione pubblicata è quella della CI.

## Aggiungere un sito o una cattura

In `siti.js`: una voce per slug di progetto, con le catture. `casa(prefisso)` dà le cinque
della home; le altre indicano `file`, `percorso`, `formato` (`desktop`, `desktopTall`,
`tablet`, `mobile`, `mobileTall`, `iphone`), eventualmente un `viewport` diverso e una
funzione `prima(page)` per aprire un pannello, scorrere a una sezione, cliccare. Poi il file
va usato in `projects.js` con `shot()`.
