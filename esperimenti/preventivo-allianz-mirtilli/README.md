# Preventivo per i mirtilli da collezione, in stile Allianz

Un finto preventivo assicurativo di tre pagine A4 per una collezione privata di
mirtilli da collezione: **Mirtillo Sassuolo**, **Mirtillo Mantova** e
**Mirtillo Modena**. È un esperimento di stile, rifatto sul modello grafico
della «Denuncia sinistro abitazione e beni» del Gruppo Allianz: nero su bianco,
**Allianz Neo**, banda grigia con i dati dell'agenzia, sezioni col filo grigio,
tabelle, caselle da spuntare, firma in fondo.

```
Preventivo Allianz - mirtilli da collezione 04-11-2026.html     il documento
README.md                                                        questo file
```

## Come si guarda e come si stampa

Si apre nel browser e si stampa in PDF da lì (Ctrl+P → A4, margini
predefiniti), come la denuncia: il foglio è già impostato con `@page { size: A4;
margin: 12mm 14mm 10mm }` e le tre pagine sono tre `<div class="pagina">`.

I caratteri sono quelli del Gruppo, presi dalla stessa cartella del documento
vero:

```
C:/Users/Alberto/Documents/firma/caratteri/allianz/AllianzNeo-Light.woff2
                                                     AllianzNeo-Regular.woff2
                                                     AllianzNeo-Italic.woff2
                                                     AllianzNeo-SemiBold.woff2
                                                     AllianzNeo-Bold.woff2
```

Se i file non ci sono, il browser ripiega su Arial e il documento resta
leggibile ma perde il carattere. In alternativa ai percorsi assoluti, lo stesso
`@font-face` cerca anche una cartella `caratteri/` accanto all'HTML: basta
copiarci i cinque `.woff2` perché il preventivo si apra uguale su qualunque
computer.

## Cosa c'è dentro

| Pagina | Sezioni |
| --- | --- |
| 1 | testata, banda dell'agenzia, oggetto, dati del contraente, la collezione assicurata con la stima, la stima del valore, il premio |
| 2 | garanzie comprese con massimali e franchigie, esclusioni e limiti, schede dei tre esemplari |
| 3 | cosa fare in caso di sinistro, documenti allegati, recapiti del consulente, dichiarazioni e firma |

I conti tornano apposta: 1,80% di 15.650 € = 281,70 €, meno lo sconto del 12%
= 247,90 € di netto, più il 21,50% di imposte = **301,20 €**, cioè 4 rate da
75,30 €.

I disegni dei tre mirtilli nelle schede sono SVG in linea, non fotografie:
stesso tratto per tutti, altezza della pianta e larghezza del vaso in scala con
le misure della perizia.

## Prima di leggerlo

Non è un documento di Allianz e non è un'offerta assicurativa. Dati, importi,
agenzia, persone e recapiti sono inventati; il marchio e il simbolo sono di
Allianz SE e qui servono solo a scopo di parodia e studio grafico. La dicitura
sta in fondo al documento, in piccolo, come sta nei documenti veri.
