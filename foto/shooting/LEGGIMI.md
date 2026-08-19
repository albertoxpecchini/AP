# Gli shooting

Una **cartella per sessione**, e dentro gli scatti originali come escono dalla
macchina. Niente rinomine, niente sottocartelle.

```
foto/shooting/
├── sessioni.json     ← ordine, titolo e luogo (vedi sotto)
├── ginger/           ← una cartella per sessione
├── angy/
├── insieme/
└── .web/             ← lo genera lo script: versioni per il web + manifesto privato
```

Poi:

```
npm run scatti
```

Formati letti: `.jpg` `.jpeg` `.png` `.heic` `.heif` `.webp` `.tif`.

## sessioni.json

L'ordine in cui compaiono nella pagina, il titolo (che si vede **solo** in
locale) e il luogo (che si vede da tutti). Se il file non c'è, le cartelle si
prendono in ordine alfabetico e il titolo è il nome della cartella.

```json
[
  { "cartella": "ginger", "titolo": "Ginger", "luogo": "Rivalta sul Mincio" },
  { "cartella": "angy",   "titolo": "Angy",   "luogo": "Rivalta sul Mincio" }
]
```

Anche questo file **resta fuori dal repo**: dentro ci sono nomi di persone, e
finirebbe su GitHub anche senza una sola foto allegata.

## Cosa succede quando lanci il comando

1. **Legge i metadati EXIF** di ogni scatto — `DateTimeOriginal` (quando),
   `Model` e `LensModel` (con cosa), `ISO`, `FocalLength`, `FNumber`,
   `ExposureTime`, e l'orientamento.
2. **Ordina ogni sessione in cronologico**, dal primo scatto all'ultimo.
3. **Rimpicciolisce le immagini** in `.web/`: una miniatura da 640 px per la
   griglia e una da 1800 px per il visore, entrambe WebP e **senza EXIF**.
   Più un'anteprima sfocata da 24 px che finisce dentro al manifesto.
4. **Scrive due manifesti**, ed è la parte importante:

   | file | dove | cosa contiene |
   | --- | --- | --- |
   | `.web/manifesto.json` | qui, fuori dal repo | tutto: titoli, scatti, misure, indirizzi delle immagini |
   | `src/app/shooting/sessioni.json` | nel repo, versionato | date, luoghi, conteggi, attrezzatura. **Nessun nome, nessun file, nessuna foto** |

È incrementale: il nome di ogni file generato porta in fondo un'impronta della
sorgente, quindi rilanciare dopo aver aggiunto dieci scatti costa dieci scatti.

## Perché le foto non escono da qui

Sono ritratti di persone. La pagina `/shooting` è pubblica e racconta le
sessioni — quando, dove, quante, con che macchina — ma le immagini restano su
questo computer, e non per una spunta da qualche parte:

- le versioni per il web stanno in `.web/`, cioè dentro `foto/`, che è in
  `.gitignore`. **Non** in `public/`, che ogni `vite build` copia dentro `dist/`;
- l'unico modo di vederle è `/scatti-privati/…`, tre indirizzi serviti da
  `scripts/shooting-api-dev.mjs`, che vive dentro `configureServer` — cioè esiste
  solo sotto `vite dev`, e in `vite build` non viene nemmeno chiamato;
- quel plugin risponde solo alle richieste che arrivano dal loopback, quindi
  nemmeno un `vite dev --host` le mette in rete di casa.

Sul sito pubblicato le foto quindi non sono nascoste: non ci sono. Chi apre
`/shooting` da fuori vede le schede col lucchetto, e la pagina non prova
nemmeno a chiedere le immagini.

## Dare il permesso a qualcuno

C'è un'eccezione, ed è voluta: chi è ritratto può chiedere di vedere i propri
scatti. Il giro è questo.

**Una volta sola, per preparare il terreno:**

1. In Supabase, SQL Editor → esegui `supabase/shooting_richieste.sql`.
2. Sempre in Supabase, Storage → nuovo bucket **`scatti`**, con «Public bucket»
   **spento**. (Se te lo dimentichi, `npm run scatti:carica` si ferma e te lo
   dice: un bucket pubblico manderebbe all'aria tutto il resto.)
3. Nelle variabili d'ambiente — `.env` in locale, Vercel in produzione — metti
   `SHOOTING_CODICE`: la parola che consegni a voce a chi può chiedere. Senza,
   il modulo **si chiude**, non si apre a tutti.

**Ogni volta che vuoi rendere chiedibile una sessione:**

```
npm run scatti:carica -- s1     # miniature, versione media E originali
npm run scatti:carica           # senza argomenti: cosa c'è già di sopra
npm run scatti:togli  -- s1     # rimangiarsi tutto
```

Le sessioni che non carichi restano irraggiungibili comunque, anche se dessi un
permesso: `/shooting` mostra il modulo solo dove chiedere ha senso.

**Poi funziona da sé:** qualcuno compila → ti arriva un'email con chi ha chiesto,
cosa ha scritto e da dove → apri il link, che porta a una pagina con due bottoni
(la decisione è un POST apposta: gli antivirus delle caselle di posta aprono i
link da soli, e un link che autorizza da solo verrebbe premuto da una macchina)
→ se autorizzi, gli arriva un link che vale **24 ore** e che puoi revocare
quando vuoi dalla stessa pagina. Le immagini arrivano con indirizzi firmati che
scadono in un'ora, e alla prima apertura ti avvisa un'email.

Nome, email e motivo di chi chiede si cancellano da soli dopo trenta giorni
(`/api/cron-cleanup`). È scritto anche nel modulo, sopra la spunta.

### Provarlo senza account

`npm run dev` senza le chiavi di Supabase usa un magazzino finto: le richieste
finiscono in `.web/richieste-dev.json`, le email le stampa il terminale coi link
cliccabili, e il codice del modulo è `prova-locale`. Il giro completo — chiedo,
autorizzo, apro, revoco — si prova per intero su questo computer.

Due indirizzi comodi mentre lavori:

- `/shooting?pubblico` — la pagina com'è vista da fuori, lucchetti e modulo
  compresi, senza spegnere niente;
- `/shooting?accesso=<token>` — quello che vede l'ospite (il manifesto locale
  viene ignorato apposta, altrimenti il link non si potrebbe controllare).
