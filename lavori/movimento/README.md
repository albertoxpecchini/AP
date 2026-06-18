# Movimento

Minigioco cognitivo **Percorso Lampo** (Motion Path) — primo modulo del
progetto *Allenamente*. Guarda un percorso scomparire su una griglia, poi
ridisegnalo a memoria con un unico gesto continuo.

## Stack

- **React 18** + **Vite**
- **Bootstrap Italia** 2.16.1 (CSS/JS via CDN) per layout, tipografia e componenti
- Canvas 2D per l'area di gioco (nessuna dipendenza grafica extra)

## Avvio

```bash
npm install
npm run dev      # sviluppo (http://localhost:5173)
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
```

## Come funziona

Flusso per round (5 round a partita), secondo la Master Specification:

1. **Guarda** — un pallino percorre il tracciato su una griglia, poi sparisce.
2. **Disegna** — l'utente ridisegna il percorso con un solo gesto (mouse o touch).
3. **Risultato** — accuracy = mix di *precisione* (quanto il gesto resta sul
   tracciato) e *copertura* (quanta parte del tracciato è stata raggiunta).

### Punteggio

- Base `100 × accuracy`
- Bonus precisione `+50` se accuracy > 95%
- Moltiplicatore combo: ×1.2 (3), ×1.5 (5), ×2.0 (10) — la combo cresce
  quando accuracy ≥ 60%, altrimenti si azzera.

### Scaling (livelli 1–5)

| Livello | Griglia | Nodi |
|--------:|:-------:|:----:|
| 1 | 3×3 | 3 |
| 2 | 3×3 | 4 |
| 3 | 4×4 | 5 |
| 4 | 5×5 | 6 |
| 5 | 6×6 | 8 |

### Modalità

- **Gioco a Percorso Lampo** — percorsi casuali.
- **Sfida del giorno** — stessi percorsi per tutti, seed derivato dalla data.

## Da fare

- Memoria dei Punti e Battito Perfetto (altri due minigiochi della spec)
- Persistenza statistiche / classifiche
- Feedback sonoro
