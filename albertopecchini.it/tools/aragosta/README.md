# L’aragosta di fiume della home

Il gambero rosso del Mincio che dorme sopra «Disponibile per nuovi incarichi» e,
quando il visitatore sta fermo, riempie d’inchiostro PECCHINI con l’annaffiatoio
azzurro. È un **burattino di carta** come gli animali del piè di pagina
([`tools/mascotte`](../mascotte/README.md), «Burattini»): stesso stile, stessi due
passaggi di **openai/gpt-image-2** su Replicate in qualità high, stesso fondo
magenta tolto con la chiave cromatica. Sta in una cartella sua perché il montaggio
e il movimento sono diversi: li fa `src/client/ink.js`, insieme all’inchiostro.

1. **intero** (1536 × 1024): l’aragosta completa, di profilo verso sinistra, sdraiata,
   con l’annaffiatoio tenuto per il manico dalla chela alta; la chiocciola
   (`public/media/mascotte/lumaca.webp`) come riferimento di stile. Scelto
   `lavoro/intero/20260930-223947-2.png`.
2. **pezzi** (2048 × 2048): la stessa aragosta smontata, con l’intero come
   riferimento: corpo (con occhi e zampette), coda, chela che tiene il manico,
   chela grande, annaffiatoio, due antenne. Scelto `lavoro/pezzi/20260930-224240-1.png`.

| File | Cosa è |
| --- | --- |
| `aragosta.js` | stile, prompt e l’elenco dei pezzi |
| `aragosta.mjs` | lo script: `intero`, `pezzi`, `usa`, `recupera` (usa `../replicate.mjs` e `../mascotte/immagine.mjs`) |
| `lavoro/` | i PNG generati con il JSON dell’input (esclusi da Git) |
| `../../public/media/aragosta/` | i pezzi, `<pezzo>.webp` a metà misura del foglio |
| `../../src/data/aragosta-pezzi.js` | generato: misure, perno (il fermacampioni) e occhi di ogni pezzo |
| `../../src/data/aragosta.js` | **a mano**: montaggio, ordine di disegno, beccuccio, pose (dorme, sveglia, versa, guarda) |
| `../../src/client/ink.js` | burattino, sonno e risveglio, getto, liquido simulato, gocce |

```bash
node tools/aragosta/aragosta.mjs intero --candidati=2
node tools/aragosta/aragosta.mjs pezzi tools/aragosta/lavoro/intero/<file>.png --candidati=2
node tools/aragosta/aragosta.mjs usa tools/aragosta/lavoro/pezzi/<file>.png          # elenca i pezzi trovati
node tools/aragosta/aragosta.mjs usa tools/aragosta/lavoro/pezzi/<file>.png corpo,coda,chela,annaffiatoio,chela2,antenna,antenna2
node tools/aragosta/aragosta.mjs recupera <intero|pezzi> <id>                        # se l'attesa si interrompe
```

I nomi dei pezzi devono restare quelli usati in `src/data/aragosta.js`; gli occhi
si cercano solo nel `corpo`.

**Montare e mettere in posa.** I pezzi del foglio non escono in scala tra loro
(le chele e l’annaffiatoio vengono più grandi che nell’intero): `scale` in
`aragosta.js` li riporta alla misura giusta rispetto al corpo. Le antenne sono
disegnate col perno a destra e si montano specchiate (`flip`). Per trovare i punti
d’attacco conviene una griglia:
`ffmpeg -f lavfi -i color=c=0x9ab0c0 -i corpo.webp -filter_complex "[0][1]scale2ref[bg][fg];[bg][fg]overlay,drawgrid=w=25:h=25:c=white@0.35,drawgrid=w=100:h=100:c=black@0.8" -frames:v 1 griglia.png`.
Le pose sono angoli in gradi (positivi in senso orario); nella posa `dorme`
l’annaffiatoio deve poggiare sull’etichetta (fondo a `ground`), in `versa` il
beccuccio deve restare sopra l’etichetta: dopo aver cambiato montaggio o pose si
guarda il risultato in home, in tutte e quattro le pose (`window.__ink.go('versa')`
in locale).

Costo del 1°.10.2026: due predizioni high (due interi 3:2, due fogli 2048²).
