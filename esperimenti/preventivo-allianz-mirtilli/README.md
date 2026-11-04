# Preventivo per i mirtilli da collezione, in stile Allianz

Un finto preventivo assicurativo di tre pagine A4 per una collezione privata di
mirtilli da collezione: **Mirtillo Sassuolo**, **Mirtillo Mantova** e
**Mirtillo Modena**. Esperimento di stile, fatto per vedere se lo stile Allianz
si riesce a ricostruire da zero — blu `#003781`, Helvetica, tanto bianco, il
simbolo delle tre arche ridisegnato in vettoriale — partendo dal modo in cui il
repository produce già i suoi PDF (`albertopecchini.it/tools/nota/`).

```
preventivo-mirtilli-allianz.pdf     il documento (3 pagine, A4)
preventivo-allianz-mirtilli.py      lo script che lo scrive
anteprima/pagina-1.png … 3.png      le pagine in PNG
```

## Prima di leggerlo

Non è un documento di Allianz e non è un'offerta assicurativa. Dati, importi,
agenzia, persone e recapiti sono inventati; il marchio e il simbolo sono di
Allianz SE e qui servono solo a scopo di parodia e studio grafico. La dicitura
sta in fondo al documento, in piccolo, come sta nei documenti veri.

## Rigenerarlo

Serve Python 3 e ReportLab; PyMuPDF è opzionale e serve solo per le anteprime PNG.

```bash
pip install reportlab pymupdf
python3 preventivo-allianz-mirtilli.py
```

Lo script non ha altre dipendenze: nessuna immagine, nessun font da scaricare.
Il simbolo delle tre arche è disegnato con tre archi a spessore calante
(`tre_arche()`), il resto è testo e fili da mezzo punto sul bianco.

## Cosa c'è dentro

| Pagina | Sezioni |
| --- | --- |
| 1 | testata, riquadro contraente/validità/consulente, **1** la collezione assicurata con la stima, **2** il premio, tre numeri, allegati |
| 2 | **3** cosa è compreso (garanzie, massimali, franchigie), **4** gli esemplari uno per uno, **5** parole che tornano (glossario), il parere del perito |
| 3 | riepilogo dell'offerta, **6** condizioni e avvertenze, **7** in caso di sinistro, **8** domande frequenti, accettazione e nota legale |

I conti tornano apposta: 1,8% di 15.650 € = 281,70 €, meno lo sconto del 12%
= 247,90 € di netto, più il 21,50% di imposte = **301,20 €**, cioè 4 rate da
75,30 €.

## Se vuoi cambiare qualcosa

I contenuti stanno in cima allo script, in chiaro: `ESEMPLARI` (nome, cultivar,
misure, valore, nota), `GARANZIE` (garanzia, cosa comprende, massimale,
franchigia), `CONDIZIONI`. Il resto sono coordinate: `pagina_uno()`,
`pagina_due()`, `pagina_tre()`.

## Nota sul metodo

Nel repository non c'era una skill per lo stile Allianz: le skill di
`.claude/skills/` sono `lezione`, `nota` e `serranda`. Lo stile è stato
ricostruito a mano, tenendo il metodo di `tools/nota/`: PDF A4 generato da uno
script, tipografia e colori dichiarati in cima, testo dentro i dati e non
sparso nel codice di disegno. Se l'esperimento convince, la stessa ricetta si
può impacchettare come skill (`allianz`) per rifare documenti di questo tipo
con una riga.
