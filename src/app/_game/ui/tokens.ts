// ─── MOTORE GIOCHI · token ──────────────────────────────────────────────────
//
// Identità visiva dei giochi. NON è più una palette a sé: i valori sono
// riferimenti ai token --sb-* del design system (src/app/home.css), così il
// gioco cambia col tema del sito — chiaro di giorno, scuro di sera — invece di
// restare scuro comunque.
//
// Prima qui c'era una quarta palette scritta a mano ("dark premium", grigi
// caldi tinti melanzana) con bg0 #1d171b contro il #141414 del sito, e un
// commento che chiamava "arancio Ubuntu" un verde. I componenti del motore
// leggono questi valori e li applicano come CSS var --accent/--glow.
//
// Vanno usati SOLO dentro un sottoalbero .sb-home (le pagine dei giochi lo
// sono): fuori da lì le var(--sb-*) non risolvono.

export interface GameAccent {
  /** Colore d'accento pieno del gioco. */
  accent: string;
  /** Alone morbido dello stesso accento, per ombre e ring di focus. */
  glow: string;
}

// Accento = l'azzurro brand del sito (Trivia è l'unico gioco rimasto).
export const ACCENTS: Record<string, GameAccent> = {
  trivia: {
    accent: "var(--sb-brand-text)",
    glow: "color-mix(in srgb, var(--sb-brand) 45%, transparent)",
  },
};
