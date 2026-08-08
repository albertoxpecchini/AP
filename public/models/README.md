# I tre modelli del garage

`cars.bin` + `tex/` sono le tre auto della sezione "And three cars I dream
about" in fondo alla home: Lamborghini Aventador LP 700-4, Alfa Romeo 4C,
Audi R8 V10.

## Cosa sono

I modelli **come sono**: stessa geometria, stesse normali, stesse coordinate
texture, stessi materiali, stessi colori dei file di partenza. Niente è stato
semplificato, tolto o ricolorato — interni, motore e sottoscocca compresi.

`scripts/build-cars.mjs` cambia solo i **contenitori**, perché un browser non
sa aprire un FBX né un OBJ:

- la geometria passa da testo a interi binari — posizioni a un decimo di
  millimetro, normali a un byte per asse, UV a interi con un fattore di scala.
  Sono i tipi che WebGL vuole nei suoi buffer, quindi il file entra nella
  scheda video senza conversioni;
- le texture passano da PNG a WebP, lato massimo 512 px e potenze di due (le
  mipmap e la ripetizione di WebGL 1 le vogliono così, e le UV di questi
  modelli arrivano a 60: senza ripetizione il battistrada si stira).

L'unica cosa che i modelli si prendono dallo script è la **posa in scena**:
centrati, appoggiati a terra, orientati col muso in avanti e portati alla loro
lunghezza vera in metri — così le tre auto stanno in scala fra loro. È quello
che fa qualunque visualizzatore quando inquadra un oggetto.

Il formato del file è documentato in testa a `src/app/site/dreamCars.tsx`.

## Quanto pesano

| | |
|---|---|
| `cars.bin` | 4,1 MB (≈ 2,0 MB gzip) |
| `tex/` (30 WebP) | 1,1 MB |
| triangoli | Aventador 131 330 · 4C 31 167 · R8 32 492 |

Non stanno nel precache del service worker (`globPatterns` prende solo
js/css/html/woff2) e si scaricano **solo quando la sezione arriva in vista**:
chi non scorre fin laggiù non li paga. Chi ci arriva li paga una volta, poi
restano in cache (`ap-models`, vedi `vite.config.ts`).

Se un giorno servisse dimezzare: metà dei triangoli dell'Aventador sono
interni, motore e pinze dei freni, che a portiere chiuse non si vedono mai.

## Rigenerarli

Serve `sharp` solo per convertire le texture, e **non è** una dipendenza del
progetto: si installa al momento e si toglie, così non pesa su ogni deploy.

```
npm i -D sharp
node scripts/build-cars.mjs <cartella-sorgenti>
npm uninstall sharp
```

`<cartella-sorgenti>` contiene i pacchetti originali scompattati, nei percorsi
indicati dalla tabella `CARS` dentro lo script.

## I sorgenti

**Non stanno in questo repository**: sono modelli di terzi e pesano una
trentina di MB fra mesh e texture. Qui ci sono solo i file generati.

| Auto | Pacchetto di origine | Formato |
|---|---|---|
| Aventador LP 700-4 | `2012-lamborghini-aventador-lp700-4.zip` | FBX binario 7700 |
| Alfa Romeo 4C | `asphalt-8-alfa-romeo-4c.zip` | OBJ + MTL |
| Audi R8 V10 | `audi-r8.zip` | OBJ + MTL |
