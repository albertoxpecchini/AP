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

// Accento = il verde brand del sito (Trivia è l'unico gioco rimasto).
export const ACCENTS: Record<string, GameAccent> = {
  trivia: {
    accent: "var(--sb-brand-text)",
    glow: "color-mix(in srgb, var(--sb-brand) 45%, transparent)",
  },
};

// Superfici e testi. Un solo set: sono variabili, quindi seguono già il tema —
// non serve più una coppia DARK/LIGHT scelta a mano dal codice.
export const SURFACE = {
  bg0: "var(--sb-bg)",
  bg1: "var(--sb-bg-alt)",
  text: "var(--sb-fg)",
  sub: "var(--sb-fg-muted)",
  glass: "var(--sb-glass-bg)",
  glassBorder: "var(--sb-border)",
};

/**
 * Alias di compatibilità: il motore aveva due set distinti e li sceglieva in
 * base al tema. Ora puntano entrambi allo stesso oggetto di variabili, che si
 * risolve da solo. Restano perché più file li importano ancora per nome.
 */
export const DARK = SURFACE;
export const LIGHT = SURFACE;
