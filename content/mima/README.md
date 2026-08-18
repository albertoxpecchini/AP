# MiMa — i dati, dopo il viaggio

Milano Marittima, 13–17 agosto 2026. Pekko, Jonny, Mok.

Il 18 agosto 2026 il piano vacanza è stato cancellato: via le tre pagine
(`/mima`, `/mima/veicoli`, `/mima/luoghi`), il loro CSS, l'endpoint
`/api/mima-alcolici`, la tabella Supabase in `supabase/` e le rotte in
`src/main.tsx`. Un conto alla rovescia verso una data passata non ha più niente
da dire.

Qui restano i **dati**, che invece servono ancora: al posto del piano va un
**album fotografico con mappa**, e le foto verranno posizionate e ordinate
leggendo i loro metadati EXIF — `GPSLatitude`/`GPSLongitude` per il punto sulla
mappa, `DateTimeOriginal` per l'ordine cronologico.

| File | Cosa c'è dentro |
| --- | --- |
| `dati-viaggio.ts` | Date del viaggio, persone, prenotazione dell'ostello, coordinate dei posti (`PLACES`), tracciato del viaggio (`ROUTE`), centro e zoom della mappa, programma giorno per giorno (`DAYS`), valigia, numeri utili, distributori e veicoli |
| `luoghi.ts` | I 25 locali fra Milano Marittima, Cervia, Pinarella e Riccione: ristoranti, aperitivo, piadinerie, gelaterie, vita notturna |

## Cosa serve all'album

Da `dati-viaggio.ts`:

- **`PLACES`** — ostello, spiaggia, Indie Club, King, Cocoricò, Beijaflor,
  Cervia centro, Milano Marittima, Rivalta sul Mincio. Coordinate in
  `[lon, lat]`, l'ordine che vuole MapLibre. Ostello, spiaggia e Indie Club sono
  punti rilevati sul posto, non stime: una foto che cade lì vicino può prendersi
  il nome del posto invece di una coordinata nuda.
- **`haversineKm`** — per capire a quale posto noto appartiene uno scatto.
- **`MIMA_CENTER` / `MIMA_ZOOM`** — l'inquadratura che tiene dentro tutto tranne
  il Cocoricò (che sta a Riccione, ~35 km).
- **`ROUTE`** — il tracciato schematico Rivalta → Cervia (A22 → A1 → A14).
- **`TRIP_FIRST_DAY` / `TRIP_LAST_DAY`** e **`DAYS`** — per raggruppare le foto
  per giornata e dare un titolo a ogni giornata.
- **`PHOTOS`** — l'array era già lì, vuoto: è il punto da cui ripartire.

## Cose che questi file non sanno

- **La lista alcolici** stava su Supabase (tabella `mima_alcolici`), non qui. La
  tabella e le sue righe **esistono ancora**: cancellare `supabase/mima_alcolici.sql`
  e `api/mima-alcolici.ts` toglie lo schema dal repo e l'endpoint che ci
  scriveva, non i dati dal database. Se vanno recuperati o buttati, va fatto
  dalla console Supabase.
- **Le spese** (`EXPENSES`) sono rimaste un array vuoto: non sono mai state
  compilate durante il viaggio.
- **Il codice** delle vecchie pagine — mappa MapLibre, meteo Open-Meteo,
  lightbox, tabelle veicoli — non è perso: sta nella storia di git, nel commit
  precedente alla cancellazione.
