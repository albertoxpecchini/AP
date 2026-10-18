# Immagine di anteprima (og.png)

`public/og.png` è l'immagine che compare quando si condivide un indirizzo del sito
(Open Graph, Twitter card): 1200 × 630, la stessa carta della home — nome in
minuscolo con il cognome a filo, monogramma, claim, le quattro aree.

I testi non sono scritti qui: vengono da `src/data/site.js` (`firstName`,
`lastName`, `claim`, `tagline`, `edition`, `title`, `location`), così l'anteprima
dice quello che dice il sito. Se cambia uno di quei valori, si rigenera:

```sh
node tools/og/og.mjs          # scrive public/og.png
node tools/og/og.mjs --html   # stampa l'HTML, per guardarlo nel browser
```

Serve Chromium: lo strumento usa `puppeteer-core` installato in
`tools/catture/` (`npm install` lì, se manca) e cerca il Chromium di Playwright
o Chrome/Edge di sistema; `CHROME_PATH` per indicarne un altro. I caratteri sono
quelli del sito, letti da `node_modules` (Archivo, Cascadia Code, Instrument
Serif).

Dal 18.10.2026 sostituisce l'immagine precedente, che era ancora in maiuscolo,
diceva «perito geometra» e portava le coordinate di Mantova invece di quelle di
Rivalta sul Mincio.
