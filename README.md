# AP

Repository di **albertopecchini.it**, il portfolio di Alberto Pecchini: diplomato geometra, web designer e graphic designer a Rivalta sul Mincio (MN).

```
AP/
├─ albertopecchini.it/   il sito: sorgenti, contenuti, build (vedi il suo README)
└─ .vscode/              F5 in VS Code avvia il server di sviluppo e apre Edge sul sito
```

## Avvio

```bash
cd albertopecchini.it
npm install
npm run dev       # http://localhost:5173
npm run build     # genera albertopecchini.it/dist/
```

Richiede Node 20.19 o superiore.

## Com’è fatto, in due righe

Sito statico senza framework: i contenuti stanno in `albertopecchini.it/src/data/`, i template in `src/templates/` restituiscono HTML, un plugin Vite scrive le pagine in `dist/` insieme a sitemap, robots e alle tavole SVG generate che fanno da segnaposto alle immagini. Tutto il resto, dall’aggiunta di un progetto alla pubblicazione, è spiegato in [albertopecchini.it/README.md](albertopecchini.it/README.md).

## Pubblicazione

Il progetto Vercel `albertopecchini.it` è collegato a questo repository con *Root Directory* `albertopecchini.it`: ogni push su `main` va in produzione.

## Storia

Fino a settembre 2026 il repository ospitava il sito precedente (React); è stato azzerato e ricostruito da capo come sito statico. La storia dei commit è conservata.
