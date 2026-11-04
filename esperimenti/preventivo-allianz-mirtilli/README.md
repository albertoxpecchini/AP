# Preventivo per i mirtilli da collezione, in stile Allianz

Un finto preventivo assicurativo di tre pagine A4 per una collezione privata di
mirtilli da collezione: **Mirtillo Sassuolo**, **Mirtillo Mantova** e
**Mirtillo Modena**. È un esperimento di stile, rifatto sul modello grafico
della «Denuncia sinistro abitazione e beni» del Gruppo Allianz: nero su bianco,
**Allianz Neo**, banda grigia con i dati dell'agenzia, sezioni col filo grigio,
tabelle, caselle da spuntare, firma in fondo.

```
Preventivo Allianz - mirtilli da collezione 04-11-2026.pdf    il documento
Preventivo Allianz - mirtilli da collezione 04-11-2026.html   lo stesso, da browser
genera-pdf.py                                                 lo script che fa il PDF
README.md                                                     questo file
```

## Il PDF

`genera-pdf.py` scrive il PDF con ReportLab, un elemento per volta, con le
stesse misure del foglio HTML (A4, margini 12/14/10 mm). Non passa dal browser:
qui non ce n'è uno, e così il risultato non dipende da come è configurata la
stampa.

```bash
python3 genera-pdf.py     # serve ReportLab: pip install reportlab
```

I caratteri non stanno nel repository (sono del Gruppo Allianz): lo script li
cerca, in quest'ordine, in

1. `caratteri/` accanto a `genera-pdf.py` — la cartella è in `.gitignore`;
2. `C:/Users/Alberto/Documents/firma/caratteri/allianz/`;
3. la cartella indicata da `ALLIANZ_FONTS`.

Servono `AllianzNeo-Light.ttf`, `AllianzNeo-Regular.ttf` e `AllianzNeo-Bold.ttf`
(gli stessi pesi che l'HTML chiede come `.woff2`). Il PDF incorpora i caratteri
in sottoinsieme: il file resta leggibile anche su un computer senza Allianz Neo.

## L'HTML

Si apre nel browser e si stampa in PDF da lì (Ctrl+P → A4, margini
predefiniti), come la denuncia: `@page { size: A4; margin: 12mm 14mm 10mm }` e
tre `<div class="pagina">`. I `@font-face` puntano ai percorsi assoluti della
cartella `firma` e, in seconda battuta, a una cartella `caratteri/` accanto
all'HTML: se i `.woff2` sono lì, il preventivo si apre uguale su qualunque
computer (altrimenti il browser ripiega su Arial).

## Cosa c'è dentro

| Pagina | Sezioni |
| --- | --- |
| 1 | testata, banda dell'agenzia, oggetto, dati del contraente, la collezione assicurata con la stima, la stima del valore, il premio |
| 2 | garanzie comprese con massimali e franchigie, esclusioni e limiti, schede dei tre esemplari |
| 3 | cosa fare in caso di sinistro, documenti allegati, recapiti del consulente, dichiarazioni e firma |

I conti tornano apposta: 1,80% di 15.650 € = 281,70 €, meno lo sconto del 12%
= 247,90 € di netto, più il 21,50% di imposte = **301,20 €**, cioè 4 rate da
75,30 €.

I disegni dei tre mirtilli nelle schede sono vettoriali, non fotografie: stesso
tratto per tutti, altezza della pianta e larghezza del vaso in scala con le
misure della perizia. Nel PDF li ridisegna `pianta()` con le stesse coordinate
del disegno SVG che sta nell'HTML.

## Prima di leggerlo

Non è un documento di Allianz e non è un'offerta assicurativa. Dati, importi,
agenzia, persone e recapiti sono inventati; il marchio e il simbolo sono di
Allianz SE e qui servono solo a scopo di parodia e studio grafico. La dicitura
sta in fondo al documento, in piccolo, come sta nei documenti veri.
