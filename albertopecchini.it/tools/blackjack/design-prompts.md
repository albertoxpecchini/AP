# La grafica del tavolo: come è nata e come si rifà

Il 7 ottobre 2026 sera la grafica del blackjack è stata disegnata da
**openai/gpt-image-2 su Replicate** (qualità high), non più in vettoriale: i
prompt stanno in `fogli.js`, lo strumento è `immagini.mjs` (vedi il README).
Ogni foglio porta più pezzi su fondo magenta pieno; la chiave cromatica li
scontorna, `usa` li separa, trova i fermacampioni dorati (i perni delle
articolazioni) e scrive `pzkko/games/blackjack/art/<foglio>/<pezzo>.webp` più
`art/pezzi.json` (misure e perni). La pagina monta le figure da sola:
cinematica inversa a due segmenti (spalla → gomito → polso), molle
criticamente smorzate, il busto che si sporge verso dove lavora la mano.

| foglio | pezzi | dove |
|---|---|---|
| `croupier` | busto (due perni = le spalle), braccio, avambraccio, mano a pinza, mano aperta | dietro al bordo lontano; le braccia davanti |
| `giocatori` | cinque persone di spalle (g1…g5, due perni = le spalle) | sulle sedie; la figura dipende dall'id del giocatore |
| `braccia` | braccio, avambraccio, mani: piatta, indice, due dita, pinza, pugno | i gesti veri del blackjack |
| `oggetti` | sabot, rastrelliera, vaschetta degli scarti, sedia | sul bordo lontano e dietro ai posti |
| `tavolo` | il feltro in pianta, senza scritte | il piano in prospettiva CSS; i segni li disegna la pagina |
| `carte-rosse`, `carte-nere` | le 52 carte e il retro (`art/carte/<rango><seme>.webp`) | sul feltro, l'angolo si piega al tocco |
| `fiche` | 5, 10, 25, 50, 100 da sopra (f*) e in pila (s*) | la consolle sul bordo e le puntate sui cerchi |
| `braccia2` | le maniche dei cinque corpi (sup1…sup5) e avambraccio + mani per la pelle scura del corpo 4 | ogni giocatore ha le braccia del suo vestito |
| `sabot2` | il sabot con la carta verde in bocca (sostituisce quello di `oggetti`) | sul bordo lontano |

Per rifare un foglio: `node tools/blackjack/immagini.mjs genera <foglio>` (un
foglio 2048² high costa circa 0,25 $ e ci mette 2–3 minuti), poi `usa` con i
nomi nell'ordine di lettura stampato dallo strumento. Un pezzo senza perno
trovato si corregge a mano in `art/pezzi.json` (`perni: [[x, y], …]`, in pixel
del webp).

## Il canvas di Claude Design

Prima delle immagini c'è stata una prova in vettoriale nel canvas Design
«Blackjack di pzkko — tavolo, croupier, carte»
(<https://claude.ai/artifact/FL4oURHw8BTDRz9KoLy1HW>): tavolo in pianta,
croupier e giocatore a pezzi con i perni, sabot, rastrelliera, sedia, carte e
fiche. Resta come riferimento di proporzioni, perni e colori; la pagina non lo
usa.

## Fonti delle immagini

Tutte le immagini del gioco sono generate con openai/gpt-image-2 su Replicate
il 7 ottobre 2026, su richiesta e sotto la direzione di Alberto Pecchini; i
fogli originali sono in `tools/blackjack/lavoro/` (fuori dal repository). Lo
dice anche il piè di pagina del tavolo.
