# Controllo — le pagine della build, a ogni push

`controllo.mjs` legge le pagine che la build ha scritto in `dist/` e segnala
quello che un occhio non vede finché qualcuno non ci inciampa. Lo fa girare
GitHub a ogni push, con il workflow [`.github/workflows/build.yml`](../../../.github/workflows/build.yml),
sui due siti che escono da questo repository: albertopecchini.it e
bettercallpekko.it (`SITE=bcp`). Se trova un problema il commit prende la ❌ su
GitHub e arriva un'email; Vercel intanto pubblica comunque, il controllo avvisa e
non blocca.

In ogni pagina HTML controlla:

- il **credito all'autore**: un link esattamente a `https://www.albertopecchini.it`
  (con https e www, senza slash finale), la regola di tutti i siti di Alberto;
  nessun indirizzo verso `albertopecchini.it` senza www né verso un
  `*.vercel.app` del sito;
- i **riferimenti interni** (`href`, `src`, `srcset`, `poster`, `data-full`,
  `url()` negli stili): ognuno deve avere il suo file nella build, con le stesse
  regole di Vercel (`cleanUrls`, `trailingSlash`); le funzioni di `api/` e i
  redirect di `vercel.json` valgono come esistenti;
- **titolo, descrizione e lingua**;
- niente **`undefined`, `NaN` o `[object Object]`** nella pagina (script
  esclusi): è il segno di un dato mancante in un template.

Poi guarda che ogni indirizzo di `sitemap.xml` sia una pagina.

Fa eccezione solo il compositore email (`/email/`), che non ha il credito perché
è uno strumento privato e non una pagina del sito (`SENZA_CREDITO` nello script).

## In locale

```bash
npm run build && node tools/controllo/controllo.mjs
SITE=bcp npx vite build --outDir dist-bcp && SITE=bcp node tools/controllo/controllo.mjs dist-bcp
```

Esce con 0 se è tutto a posto, con 1 (e l'elenco dei problemi, pagina per
pagina) se no. In GitHub Actions i problemi diventano annotazioni `::error`.
