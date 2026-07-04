# 05 · Motore giochi (opzionale)

Nel sito originale i mini-giochi condividono un **motore comune**: stessa identità
"dark premium", ma con un **accento neon diverso per ogni gioco**, più una
leaderboard e un sistema di nickname. Riusalo solo se al nuovo sito servono giochi
o classifiche; altrimenti salta questo capitolo.

Nel kit è incluso il pezzo portabile e senza dipendenze:
[`core/game/tokens.ts`](../core/game/tokens.ts).

## Token — accenti e superfici

```ts
export const ACCENTS = {
  trivia:    { accent: "#8b7bff", glow: "rgba(139,123,255,0.45)" }, // viola/indaco
  mappa:     { accent: "#a855f7", glow: "rgba(168,85,247,0.45)" },  // viola
  angoli:    { accent: "#34d399", glow: "rgba(52,211,153,0.42)" },  // verde
  parole:    { accent: "#fbbf24", glow: "rgba(251,191,36,0.42)" },  // ambra
  movimento: { accent: "#38bdf8", glow: "rgba(56,189,248,0.42)" },  // ciano
};

export const DARK  = { bg0:"#0a0d11", bg1:"#0b0f14", text:"#e8eef4", sub:"#8b98a6",
                       glass:"rgba(255,255,255,0.045)", glassBorder:"rgba(255,255,255,0.09)" };
export const LIGHT = { bg0:"#eef1f4", bg1:"#f6f8fa", text:"#16201a", sub:"#5a6b62",
                       glass:"#ffffff", glassBorder:"rgba(0,0,0,0.07)" };
```

**Come si usa:** ogni gioco legge il proprio accento e lo applica come CSS var
`--accent` / `--glow` sulla propria radice. Così lo stile (superfici vetro, ombre,
ring di focus) è scritto una volta sola e cambia solo il colore d'identità.

```tsx
import { ACCENTS } from "./game/tokens";

const { accent, glow } = ACCENTS.trivia;
<div style={{ "--accent": accent, "--glow": glow } as React.CSSProperties}> … </div>
```

## Cosa NON è nel kit (perché è specifico del progetto)

- `GameGate.tsx`, `leaderboardApi.ts`, `nickname.ts` — dipendono da un backend
  (Supabase nel progetto originale). Se ti servono classifiche online, ricreali
  puntando al tuo backend: il contratto è semplice (nome, punteggio, gioco).

## Nuovo gioco

Aggiungi una voce a `ACCENTS` con un colore nuovo e riusa `DARK`/`LIGHT` per le
superfici. L'identità visiva resta coerente con il resto del sito.
