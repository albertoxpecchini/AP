# Prompt per Claude Design: il tavolo e il mazzo di pzkko

Tre prompt da incollare in Claude Design (canvas), uno alla volta, nell'ordine.
I file esportati vanno in `albertopecchini.it/pzkko/games/blackjack/art/` coi
nomi indicati; poi in `index.html` si accendono gli interruttori
`ART = { tavolo: true, carte: true, fiche: true }`. Le misure e i nomi sono
vincolanti: la pagina li aspetta così. Tutto il testo in minuscolo, tranne gli
indici delle carte (A J Q K).

---

## 1. Il tavolo (feltro)

> Disegna in vettoriale il feltro di un tavolo di blackjack per pzkko.it, il sito personale di Alberto Pecchini (marchio «pzkko», tutto minuscolo). Il linguaggio è quello di Apple tradotto per il web: sobrio, pulito, nessun oggetto skeuomorfico letterale, nessun oro, nessuna texture da casinò. Serve come **sfondo** di una pagina web: sopra ci vengono disegnati dal codice il banco, i cinque posti e i comandi, quindi niente carte, fiche, mani o testi di istruzioni nel disegno.
>
> **Due artboard**, stesso disegno adattato:
> - `tavolo` **1600 × 1000 px** (desktop)
> - `tavolo-verticale` **900 × 1400 px** (telefono)
>
> **Materiale**: un campo unico di verde «pzkko» (centro `#1b6847`, bordo `#0c3a29`, orlo `#092b1f`) con una luce radiale morbida dall'alto (centro luce al 50 % in orizzontale, 38 % in verticale), angoli arrotondati di 28 px, un filo chiaro interno di 1 px al 8 % di bianco. Una grana di feltro leggerissima (rumore fine, 3–4 % di opacità), nessun pattern visibile.
>
> **Le zone** (in percentuale dell'altezza, da rispettare perché il codice ci appoggia sopra gli elementi):
> - 0–30 %: zona del banco, vuota, solo feltro;
> - 30–52 %: **fascia della scritta**, centrata: in un arco ampio e piatto (raggio grande, come sui tavoli veri) il testo **«blackjack paga 3 a 2 · il banco sta a 17»** in un carattere sans grottesco pulito (SF Pro, Inter o Helvetica Neue), minuscolo, peso 600, bianco al 55 % di opacità, con sotto, al centro, il marchio **«pzkko»** più grande (peso 700, bianco al 85 %) e due linee sottili ai lati del marchio, bianche al 20 %. Su desktop la scritta sta larga circa il 60 % del tavolo; sul verticale il 85 %;
> - 52–100 %: zona dei posti e dei comandi, vuota, solo feltro.
>
> **Firma**: in basso a destra, a 24 px dal bordo, «pzkko» piccolo (14 px, bianco al 35 %); in basso a sinistra, stesso stile, «sabot da 6 mazzi».
>
> Niente ombre esterne (la pagina mette la sua), niente sfondo fuori dal tavolo (esporta con il fondo trasparente oltre gli angoli). **Esporta ogni artboard in SVG** con i nomi `tavolo.svg` e `tavolo-verticale.svg`, testi convertiti in tracciati.

---

## 2. Il mazzo di carte (52 carte + retro)

> Disegna in vettoriale un mazzo di carte da poker firmato **pzkko** per il tavolo di blackjack di pzkko.it, nello stile Apple tradotto per il web: geometrico, pulito, leggibile da lontano sullo schermo di un telefono, senza decorazioni d'epoca. **53 artboard**, tutti **250 × 350 px** (proporzione 5:7), angoli arrotondati **22 px** (il 9 % della larghezza), fondo bianco `#ffffff`, un filo grigio di 1 px al 10 % di nero lungo il bordo.
>
> **Nomi degli artboard, vincolanti**: `<rango><seme>` con ranghi `A 2 3 4 5 6 7 8 9 10 J Q K` e semi `c q f p` (cuori, quadri, fiori, picche). Esempi: `Ac`, `10p`, `Kf`, `Qq`. Più `retro`.
>
> **Indici**: in alto a sinistra e, ruotati di 180°, in basso a destra: il rango in un sans grottesco pesante (peso 700, 64 px, interlettera −4 %), sotto il seme a 36 px; cuori e quadri in rosso `#ff3b30`, fiori e picche in nero `#1d1d1f`. Il «10» resta «10» (non «T»).
>
> **Semi**: quattro forme disegnate da zero, geometriche e morbide (angoli arrotondati, curve continue), le stesse ovunque: cuore, quadro, fiore (tre lobi e gambo), picca. Niente semi di sistema o emoji.
>
> **Numerali (2–10)**: i semi disposti come nelle carte francesi classiche (disposizione tradizionale a colonne: il 10 ha 4+2+4, il 9 ha 4+1+4 …), semi da 64 px, quelli della metà inferiore ruotati di 180°.
>
> **Asso**: un seme solo, grande (150 px) al centro; l'asso di picche porta dentro il seme, in negativo, un piccolo «pzkko».
>
> **Figure (J Q K)**: niente figure medievali: un ritratto geometrico e astratto a mezzo busto, in due tinte (il colore del seme e il nero/grigio `#1d1d1f` / `#6e6e73`), simmetrico sopra e sotto come nelle carte vere (specchiato sulla diagonale), con il seme piccolo in un angolo del riquadro. Il J ha un profilo giovane con un berretto, la Q un profilo con un fiore in mano, il K un profilo con una corona semplice a tre punte. Lo stesso disegno per i quattro semi, cambiando solo il colore.
>
> **Retro** (`retro`): fondo verde `#0c3a29` con margine bianco di 12 px, al centro un motivo a griglia di piccoli «p» di pzkko (lettera minuscola geometrica) in bianco al 14 %, e al centro il marchio «pzkko» in bianco, peso 700, 44 px.
>
> **Esporta i 53 artboard in SVG**, un file ciascuno, coi nomi esatti degli artboard (`Ac.svg`, `10p.svg`, …, `retro.svg`), testi convertiti in tracciati, dimensioni dell'artboard incluse nel `viewBox`.

---

## 3. Le fiche ($pzk)

> Disegna in vettoriale cinque fiche da gioco per i «$pzk» di pzkko.it (gettoni senza valore, per il blackjack tra amici), stile Apple tradotto per il web, vista dall'alto. **Cinque artboard 200 × 200 px**, nomi vincolanti: `fiche-5`, `fiche-10`, `fiche-25`, `fiche-50`, `fiche-100`.
>
> Ogni fiche: disco grafite `#2c2c2e` con un bordo esterno di 6 px nel colore del taglio, un anello interno tratteggiato bianco all'85 % (otto tratti), e al centro il valore in un sans grottesco pesante (peso 700, 64 px, bianco, cifre tabulari) con sotto, piccolo, «$pzk» (18 px, bianco al 60 %). Colori dei tagli: 5 bianco `#f5f5f7`, 10 blu `#0a84ff`, 25 verde `#30d158`, 50 arancione `#ff9f0a`, 100 rosso `#ff453a`. Sul bordo esterno, ripetuto quattro volte in piccolo lungo la circonferenza, «pzkko».
>
> Una luce morbida dall'alto a sinistra (niente riflessi lucidi), nessuna ombra esterna. **Esporta in SVG** coi nomi degli artboard, testi convertiti in tracciati.

---

## Dopo l'esportazione

1. Copiare i file in `albertopecchini.it/pzkko/games/blackjack/art/` (`carte/` per le 52 carte e il retro).
2. In `pzkko/games/blackjack/index.html` mettere `const ART = { tavolo: true, carte: true, fiche: true }`.
3. Provare in locale: `node tools/blackjack/dev.mjs --bot 4`.
4. Il tavolo entra nella `og.png` del gioco quando ci sarà (oggi usa quella della home).
