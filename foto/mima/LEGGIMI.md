# Butta qui le foto di MiMa

Le foto **originali**, come escono dal telefono. Tutte insieme, senza
rinominarle, senza ordinarle, senza metterle in sottocartelle (o anche con le
sottocartelle: le legge lo stesso, e ricorsivamente).

Formati letti: `.jpg` `.jpeg` `.png` `.heic` `.heif` `.webp`.

Poi, una volta sole:

```
npm run foto
```

## Cosa succede quando lanci il comando

1. **Legge i metadati EXIF** di ogni scatto — `DateTimeOriginal` (quando),
   `GPSLatitude`/`GPSLongitude` (dove), l'orientamento, il modello di telefono.
2. **Ordina tutto in cronologico**, dallo scatto più vecchio al più recente, e
   raggruppa per giornata del viaggio (13–17 agosto 2026).
3. **Dà un nome al posto**: se lo scatto cade vicino a un punto noto — ostello,
   spiaggia, Indie Club, Milano Marittima… — si prende quel nome invece di una
   coordinata nuda. I punti stanno in `content/mima/dati-viaggio.ts`.
4. **Rimpicciolisce le immagini** per il web (nessuno si scarica 300 foto da 4 MB)
   e le scrive in `public/images/mima/`: una versione grande e una miniatura.
5. **Scrive il manifesto** `src/app/mima/foto.json`, che è quello che la pagina
   dell'album legge davvero.

## Le foto originali non finiscono su GitHub

Questa cartella è in `.gitignore`. Restano sul tuo computer: nel repo ci va solo
la versione rimpicciolita, dentro `public/images/mima/`. Vuol dire due cose:

- **tieni un backup tuo** degli originali, il repo non è quello;
- se cambi computer, ricopia gli originali qui prima di rilanciare `npm run foto`.

## Se una foto non ha il GPS

Succede spesso: le foto salvate da WhatsApp perdono i metadati, e su alcuni
telefoni la posizione è disattivata. Quelle foto **non vengono buttate via** —
restano nell'album, in ordine cronologico, semplicemente senza puntino sulla
mappa. Il comando ti dice quante sono, alla fine.
