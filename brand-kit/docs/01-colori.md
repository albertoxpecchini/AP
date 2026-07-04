# 01 · Colori

Tutti i colori vivono come **CSS custom properties** in
[`styles/design-tokens.css`](../styles/design-tokens.css). Cambi il valore lì e
cambia in tutto il sito. Qui trovi cosa sono e quando usarli.

Ci sono **due palette** che convivono nel sito originale.

---

## A) Palette istituzionale "neroverde"

Sobria, per pagine informative/aziendali. Il verde sostituisce il blu di Bootstrap Italia.

| Token                  | Hex        | Uso |
|------------------------|------------|-----|
| `--brand-green`        | `#2F7D4A`  | Primario: bottoni, `bg-primary`, badge |
| `--brand-green-deep`   | `#1F6B3D`  | Link, testo su primario, hover leggero |
| `--brand-green-darker` | `#155030`  | Hover profondo (active) |
| `--brand-green-night`  | `#103820`  | Fasce scure, footer istituzionale |
| `--brand-green-soft`   | `#7FC09A`  | Accento chiaro, sfondi tenui |
| `--paper`              | `#F7F5F0`  | Sfondo pagina (bianco caldo) |
| `--card`               | `#FFFFFF`  | Superfici / schede |
| `--ink`                | `#1C1A17`  | Testo principale |
| `--ink-muted`          | `#8A8478`  | Testo attenuato |
| `--line`               | `#EAE7E0`  | Bordi, elementi secondari |

**Feedback:** ok `#34d399` · attenzione `#fbbf24` · errore `#C94040`.

> Nel sito originale questa palette sovrascrive i colori di Bootstrap Italia via
> `--bs-primary` ecc. (vedi `src/styles/site.css`). Se non usi Bootstrap Italia,
> ti bastano i token qui sopra.

---

## B) Palette dark premium "viola / indaco"

Elegante, superfici "vetro", per home / landing / sezioni vive. Ha **due stati**:
scuro (default) e chiaro (attivato da `html[data-ap-theme="light"]`).

### Tema scuro (default)

| Token             | Hex / rgba                    | Uso |
|-------------------|-------------------------------|-----|
| `--dp-bg0`        | `#090c10`                     | Fondo assoluto (boot, overlay) |
| `--dp-bg1`        | `#0b0f14`                     | Sfondo pagina |
| `--dp-text`       | `#e8eef4`                     | Testo su scuro |
| `--dp-sub`        | `#a7b2bd`                     | Testo attenuato |
| `--dp-glass`      | `rgba(255,255,255,.045)`      | Superficie vetro (card) |
| `--dp-glass-border`| `rgba(255,255,255,.09)`      | Bordo vetro |
| `--dp-accent`     | `#8b7bff`                     | **Accento** viola/indaco |
| `--dp-accent-2`   | `#7c6cff`                     | Accento secondario |
| `--dp-accent-deep`| `#5b4bd6`                     | Accento profondo |
| `--dp-glow`       | `rgba(139,123,255,.45)`       | Alone/ombra dell'accento, focus ring |

### Tema chiaro (stessa pagina, di giorno)

| Token                    | Hex / rgba              |
|--------------------------|-------------------------|
| `--dp-paper-light`       | `#f7f5fd` (fondo)       |
| `--dp-accent-light`      | `#6d4bd6` (accento)     |
| `--dp-accent-light-deep` | `#4a2fb0`               |
| `--dp-glow-light`        | `rgba(109,75,214,.28)`  |

Il ribaltamento chiaro↔scuro delle pagine dark-premium è già scritto in
[`styles/theme-auto.css`](../styles/theme-auto.css) (blocchi
`html[data-ap-theme="light"] …`). Vedi [03-tema-chiaro-scuro.md](03-tema-chiaro-scuro.md).

---

## Accenti "neon" per-gioco

Se riusi il motore giochi, ogni gioco ha un colore d'identità (in
[`core/game/tokens.ts`](../core/game/tokens.ts)):

| Gioco      | Accento    | Colore   |
|------------|------------|----------|
| trivia     | `#8b7bff`  | viola/indaco |
| mappa      | `#a855f7`  | viola |
| angoli     | `#34d399`  | verde |
| parole     | `#fbbf24`  | ambra |
| movimento  | `#38bdf8`  | ciano |

Il componente legge l'accento e lo applica come `--accent` / `--glow`, così lo
stile è uno solo e cambia solo il colore.

---

## Come cambiarli per l'azienda

1. Apri `styles/design-tokens.css`.
2. Cambia i valori di brand (es. `--brand-green` → colore aziendale, `--dp-accent`
   → accento aziendale) e i corrispondenti `-deep` / `-glow`.
3. Non toccare i nomi delle variabili: tutto il resto continua a funzionare.
