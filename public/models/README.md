# cars.bin — i tre modelli del garage

`cars.bin` contiene le mesh delle tre auto della sezione "And three cars I dream
about" in fondo alla home: Lamborghini Aventador LP 700-4, Alfa Romeo 4C,
Audi R8 V10.

## Cos'è

Un solo file binario con tre mesh, generato da `scripts/build-cars.mjs` a
partire dai modelli originali. Il convertitore:

- tiene solo quello che si vede da fuori (carrozzeria, vetri, gomme, cerchi) e
  butta interni, motore, targhe e pinze dei freni;
- raddrizza e porta la lunghezza a quella vera di listino, così le tre auto
  stanno in scala fra loro;
- semplifica da ~30 000 triangoli a ~6 500 per auto;
- quantizza le coordinate a un decimo di millimetro (interi a 16 bit) e le
  normali a interi a 8 bit, così i buffer si caricano in WebGL senza conversioni.

Il formato è documentato in testa a `src/app/site/dreamCars.tsx`.

## Rigenerarlo

```
node scripts/build-cars.mjs <cartella-sorgenti>
```

dove `<cartella-sorgenti>` contiene i pacchetti originali scompattati, nei
percorsi indicati dalla tabella `CARS` dentro lo script.

## I sorgenti

**Non stanno in questo repository**: sono modelli di terzi e pesano una
trentina di MB. Qui c'è solo il `.bin` generato.

## ⚠️ Attribuzione — da completare

I tre modelli arrivano da pacchetti scaricati da Sketchfab. I pacchetti non
contenevano il file di licenza, quindi **autore e licenza di ognuno vanno
verificati sulla pagina di origine e trascritti qui sotto** prima di
considerare la sezione pubblicabile. La gran parte dei modelli Sketchfab è
CC-BY, che richiede il credito all'autore.

| Auto | Pacchetto di origine | Autore | Licenza | Link |
|---|---|---|---|---|
| Aventador LP 700-4 | `2012-lamborghini-aventador-lp700-4.zip` | da compilare | da compilare | da compilare |
| Alfa Romeo 4C | `asphalt-8-alfa-romeo-4c.zip` | da compilare | da compilare | da compilare |
| Audi R8 V10 | `audi-r8.zip` | da compilare | da compilare | da compilare |

Il modello della 4C è marcato come estratto da Asphalt 8 (Gameloft): è
materiale di un gioco, e va valutato a parte se ci sta in una pagina pubblica.
