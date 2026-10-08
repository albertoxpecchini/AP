# pzkko.it

Il sito di **pzkko.it**: file statici, niente build. Sta nel repository del sito
serio ma è un progetto Vercel a parte.

- `index.html` — la home: i social come icone in un dock, poi le sezioni social,
  tools (vuota) e games (il primo c'è). CSS e JS in linea, nessun file esterno.
- `games/blackjack/` — il tavolo di blackjack (una stanza, il banco è un bot,
  cinque posti,  al posto dei soldi, +18) e la sua pagina del banco in
  `admin/`; la funzione sta in `../api/blackjack.js`, le regole in
  `../src/blackjack/motore.js`, tutto spiegato in `../tools/blackjack/README.md`.
  La grafica (gpt-image-2 su Replicate) sta in `art/`.
- `games/roulette/` — la roulette europea da soli contro il banco: la ruota
  fotografata che gira con la corona disegnata in SVG, la pallina con la sua
  fisica (`fisica.js`, provata da `../tools/roulette/prova.mjs`), il croupier
  del blackjack che lancia, ritira e paga. Niente server: i $pzk stanno nel
  browser. Spiegato in `../tools/roulette/README.md`.
- `404.html` — pagina non trovata
- `favicon.svg`, `apple-touch-icon.png` — la «p» di pzkko su superellisse grafite
- `og.png` — anteprima per i link condivisi (1200 × 630)
- `robots.txt`, `sitemap.xml`
- `vercel.json` — intestazioni di sicurezza, URL puliti

## Com'è fatta la home

Linguaggio di Apple tradotto per il web (carattere di sistema, materiali
traslucidi, molle interrompibili), in chiaro e in scuro col tema del sistema.

- **Hero a tutto schermo** (`100svh`) che si adatta a qualsiasi finestra: nome,
  riga e icone del dock sono misurati in `vw`/`svh` con `clamp()`, così il primo
  schermo entra sempre, alto o basso che sia; il dock si rimisura al resize.
- **Dock in fondo al primo schermo** (si vede subito all'apertura, poi scorre via
  col resto): cinque icone dei social (Instagram, GitHub, WhatsApp, e-mail,
  PayPal), un separatore, poi tools e games (grafite: le cose «mie»). Col
  puntatore le icone si ingrandiscono con molle criticamente smorzate (response
  0,32 s) e mostrano l'etichetta; sul telefono è una griglia a righe da tre app
  al massimo (3+3+1) con l'etichetta sotto. Le icone sono superellissi vere
  (`clip-path` con il tracciato in fondo alla pagina), i glifi vengono da Simple
  Icons (CC0) e Material Icons (Apache 2.0).
- **Sezioni**: social in griglia bento (3+3 / 2+2+2 colonne: la scheda GitHub
  elenca i tre siti che ospita); tools e games con uno stato vuoto che ha già la
  forma di quello che arriverà (una cartella, una riga di posti vuoti coi nomi
  dei giochi in programma).
- **404**: stessa pagina, stesso dock. Non si modifica a mano: la genera
  `tools/pzkko/genera-404.mjs` da `index.html` (`node tools/pzkko/genera-404.mjs`
  dalla cartella `albertopecchini.it`), da rilanciare dopo ogni modifica alla home.
- Movimento solo in risposta: ingresso una volta, poi niente che giri da solo;
  `prefers-reduced-motion` e `prefers-reduced-transparency` rispettati.

Ogni strumento o gioco nuovo è una pagina in questa cartella (es.
`tools/nome/index.html`) e il suo riquadro vuoto nella home diventa un'icona
vera, come è successo con `games/blackjack/`.

## Vercel

Progetto `pzkko` dal repository `albertoxpecchini/AP`:

- Root Directory: dovrebbe essere `albertopecchini.it/pzkko` con preset Other
  (nessuna build, output = la cartella). Finché resta `albertopecchini.it` con
  preset Vite, ci pensa `tools/pzkko/build.mjs` (il `buildCommand` di
  `albertopecchini.it/vercel.json`): se la build gira per pzkko.it copia questa
  cartella in `dist/` così com'è, altrimenti lancia la build normale del sito.
- Domini: `www.pzkko.it` (principale), `pzkko.it` → 308 verso www
- Ogni push su `main` pubblica da solo.

## In locale

```bash
npx serve albertopecchini.it/pzkko
```

## Crediti

Ogni pagina porta in fondo il link a [Alberto Pecchini](https://www.albertopecchini.it).
