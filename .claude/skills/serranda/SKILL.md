---
name: serranda
description: Allunga, comprime o riempie la serranda di pzkko.it (la home di albertopecchini.it/pzkko, muro 2D e scena 3D) — aggiungere un volantino, un manifesto o un graffito, fare spazio in cima o in fondo, stringere le pile perché ci stia altra roba. Usala quando Alberto chiede di mettere qualcosa di nuovo sul muro di pzkko, di allungare o accorciare la serranda, o dice che i volantini non ci stanno.
---

# La serranda di pzkko.it

Il muro di `albertopecchini.it/pzkko/index.html` è fatto di pile (cinque colonne sul
computer, due sul telefono) scritte in `albertopecchini.it/tools/pzkko/disposizione.js`;
le posizioni in pagina e l'altezza della parete le scrive `disponi.mjs`. La scena 3D
(`pzkko/scena/`) legge la parete dal DOM: se la parete si allunga, si allunga anche la
saracinesca 3D. Le foto dei volantini nella scena le fa `scena/cattura.mjs`.

Non spostare pezzi a mano in `index.html` (le `--x --y …` si riscrivono) e non
toccare le righe delle pile se basta un comando. Tutto da `albertopecchini.it/`:

```bash
node tools/pzkko/serranda.mjs                 # stato: parete, manopole, colonne, spazio libero
node tools/pzkko/serranda.mjs volantino --titolo="…" --testo="…" [--link=URL] [--handle=…] [--mano="in arrivo"] \
     [--carta=giallo] [--arte=arte2/dadi] [--zona=siti|social|games|tools] [--colonna=N] [--mcolonna=N] [--dopo=vol:titolo]
node tools/pzkko/serranda.mjs pezzo --img=manifesti2/x [--tipo=man|tag|pezzo] [--colonna=N] [--dopo=chiave]
node tools/pzkko/serranda.mjs allunga --sopra=400        # spazio nuovo in cima (tutto scende); --sotto, --minimo; --telefono / --entrambi
node tools/pzkko/serranda.mjs comprimi 10                # le pile si sovrappongono del 10% in più; --scala=0.9; --annulla
node tools/pzkko/serranda.mjs rifai                      # disponi + 404 + foto dei volantini + foto del caricamento + foto 3D di prova
```

`--prova` su volantino, pezzo, allunga e comprimi mostra cosa farebbe senza scrivere.

## Come si fa

1. `serranda.mjs` (stato): guarda quale colonna è più corta e quanto spazio c'è.
2. Il pezzo nuovo: `volantino` o `pezzo`. Senza `--colonna` va in fondo alla colonna più
   corta (computer e telefono, ognuno la sua). Le immagini devono già stare in
   `pzkko/art/` (le genera `tools/pzkko/immagini.mjs`, vedi `pzkko/README.md`).
   I testi dei volantini sono minuscoli, nello stile degli altri.
3. Se non ci sta: `allunga --sopra=N` (la roba nuova in cima, come il 17.10) o
   `comprimi P` (pile più fitte), poi di nuovo `stato`.
4. `rifai`: serve un browser (Chromium di Playwright o Edge, `tools/pzkko/browser.mjs`) e
   `npm ci` in `albertopecchini.it/` e in `tools/catture/`. Misura le altezze vere,
   rigenera `404.html`, rifà le foto in `pzkko/art/scena/vol*` e le foto del caricamento
   (`pzkko/art/scena/carico/`, la strada da lontano: dipendono dall'altezza della parete),
   fotografa la scena.
5. Guarda le foto con Read: `tools/pzkko/lavoro/scena-serranda-{cima,meta,fondo,telefono}.png`
   (3D) e `muro-desk.png`, `muro-mob.png` (la pagina senza 3D). Controlla che niente
   copra i link dei volantini veri, che il pezzo nuovo si veda e si legga nella scena 3D
   e sul telefono. Per guardare da vicino: `node tools/pzkko/scena/foto.mjs --scroll=0.4
   --dpr=2 --q=dpr=2 --ritaglio=x,y,l,a`.
6. Aggiorna il `pzkko/README.md` se cambia qualcosa che lì è descritto (zone, altezze).

## Attenzione

- `disponi.mjs` misura nel browser che trova: con Edge le altezze dei volantini vengono
  qualche unità diverse dal Chromium di Playwright, e tutto si sposta di poco. È normale.
- Le manopole (top, bottom, minimo, passo, scala) stanno in una riga di `DESK` e `MOB`
  in `disposizione.js`, scritta da `serranda.mjs`: si possono cambiare anche a mano.
- La 404 non ha i pezzi nuovi (ha il suo muro corto), ma va rigenerata (lo fa `rifai`).
- La storia (`pzkko/storia/`, pzkko.it/storia/) è la home con un altro muro: stesso CSS,
  stesso script, stessa scena 3D, rifatta dalla home da `tools/pzkko/genera-storia.mjs`
  (lo fa `rifai`, con le sue pile, le sue foto dei fogli e del caricamento). Le sue pile
  stanno in `tools/pzkko/storia/disposizione.js`; `stato`, `allunga` e `comprimi` ci
  lavorano con `--pagina=storia`. I suoi fogli si scrivono a mano in `storia/index.html`,
  dentro `<div class="parete storia">` e con un id `storia-…` (non con `volantino` o `pezzo`).
  Dopo `rifai` guarda anche `scena-serranda-storia.png`, `storia-desk.png` e `storia-mob.png`.
- La petizione (`#petizione`, dal 22.10) ha le tre bic appese allo spago sotto il foglio:
  sporgono ~180 unità sul computer e ~130 sul telefono. Nella pila, subito sotto, va un
  graffito o un manifesto degli altri, mai un volantino vero (le penne coprirebbero il link).
  La sua foto per la scena è vuota (le firme le scrive la scena dal vivo): `cattura.mjs`
  nasconde penne e firme e annota dov'è la tabella.
- Non fare commit né push se Alberto non lo chiede: ogni push su `main` va online.
