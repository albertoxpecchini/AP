# pzkko.it

Il sito di **pzkko.it**: file statici, niente build. Sta nel repository del sito
serio ma è un progetto Vercel a parte.

- `index.html` — la pagina (per ora vuota, col credito in fondo)
- `404.html` — pagina non trovata
- `robots.txt`, `sitemap.xml`
- `vercel.json` — intestazioni di sicurezza, URL puliti

## Vercel

Progetto `pzkko` dal repository `albertoxpecchini/AP`:

- Root Directory: `albertopecchini.it/pzkko`
- Framework Preset: Other (nessun comando di build, output = la cartella)
- Domini: `www.pzkko.it` (principale), `pzkko.it` → 308 verso www

## In locale

```bash
npx serve albertopecchini.it/pzkko
```

## Crediti

Ogni pagina porta in fondo il link a [Alberto Pecchini](https://www.albertopecchini.it).
