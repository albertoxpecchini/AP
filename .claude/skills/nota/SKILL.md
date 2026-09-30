---
name: nota
description: Impagina una «nota» di Alberto (es. «Nota piscina coniugi …»: periodo, interventi con data «• 29 mag: …», riepilogo «voce = 365€», «Totale … = 928€») in un PDF A4 coi caratteri del sito. Usala quando Alberto scrive «nota» seguito dal testo incollato, o incolla un testo del genere chiedendone il PDF.
---

# Nota → PDF

Alberto incolla il testo di una nota e scrive «nota»: vuole il PDF impaginato,
**niente di più e niente di meno**. Non fare domande, non proporre alternative.

1. Salva il testo incollato **così com'è** (UTF-8, righe e punti elenco
   compresi) con Write in
   `C:\Users\pzkko\Documents\Note\<AAAA-MM-GG> <Titolo> <Cognome cliente>.txt`
   — per esempio `2026-09-30 Nota piscina Affini.txt` (data di oggi).
   Fuori dal repository: ci sono nomi e importi dei clienti.
2. Da `albertopecchini.it/`:
   `node tools/nota/nota.mjs "C:/Users/pzkko/Documents/Note/<nome>.txt"`
   Il PDF esce accanto al testo con lo stesso nome.
3. Leggi l'uscita dello script: interventi, voci, somma, totale, pagine e gli
   eventuali «attenzione». Se la somma delle voci non torna col totale **non
   correggere niente**: dillo ad Alberto con i due numeri.
4. Apri il PDF con Read e guarda la pagina: niente tagliato, niente righe
   orfane strane, una pagina se ci sta. Se un testo nuovo ha una forma che lo
   script non riconosce (riga «fuori schema»), sistema il parser in
   `albertopecchini.it/tools/nota/nota.mjs`, non il testo di Alberto.
5. Apri il PDF per lui: `Start-Process "<percorso del pdf>"` (PowerShell).
6. Rispondi in due righe: dove sta il PDF e gli eventuali avvisi.

## Regole

- Solo PDF, mai un .docx («in word» voleva dire «impaginato come un documento»).
- Il testo resta suo: niente intestazioni di colonna, carta intestata AP,
  firma, IVA, date o titoli aggiunti; niente parole tolte; refusi e maiuscole
  come li ha scritti. Si cambia solo la tipografia (spazi doppi, `‘26` → `’26`,
  `100€` → `100 €`, numero e parola sulla stessa riga).
- Caratteri del sito: Archivo, Instrument Serif, IBM Plex Mono; minio `#e5481f`
  solo come accento. Lo stile sta in `STILE` dentro `nota.mjs`: se Alberto chiede
  un ritocco, si cambia lì e vale per tutte le note successive.
- Dettagli dello strumento: `albertopecchini.it/tools/nota/README.md`.
