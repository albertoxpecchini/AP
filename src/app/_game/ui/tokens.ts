// ─── MOTORE GIOCHI · Design system "dark premium" · token ───────────────────
//
// Identità visiva condivisa: sfondo scuro, superfici "vetro", e un ACCENTO neon
// diverso per ogni gioco. I componenti del motore (GameGate, e via via gli
// altri) leggono l'accento da qui e lo applicano come CSS var --accent/--glow,
// così lo stile è uno solo e cambia solo il colore d'identità.

export interface GameAccent {
  /** Colore d'accento pieno (neon) del gioco. */
  accent: string;
  /** Alone/glow morbido dello stesso accento (rgba), per ombre e ring di focus. */
  glow: string;
}

export const ACCENTS: Record<string, GameAccent> = {
  trivia:    { accent: "#8b7bff", glow: "rgba(139,123,255,0.45)" }, // viola/indaco
  mappa:     { accent: "#a855f7", glow: "rgba(168,85,247,0.45)" },  // viola
  angoli:    { accent: "#34d399", glow: "rgba(52,211,153,0.42)" },  // verde
  parole:    { accent: "#fbbf24", glow: "rgba(251,191,36,0.42)" },  // ambra
  movimento: { accent: "#38bdf8", glow: "rgba(56,189,248,0.42)" },  // ciano
};

// Superfici/testi del tema (riferimento per i componenti del motore).
export const DARK = {
  bg0: "#0a0d11",
  bg1: "#0b0f14",
  text: "#e8eef4",
  sub: "#8b98a6",
  glass: "rgba(255,255,255,0.045)",
  glassBorder: "rgba(255,255,255,0.09)",
};

export const LIGHT = {
  bg0: "#eef1f4",
  bg1: "#f6f8fa",
  text: "#16201a",
  sub: "#5a6b62",
  glass: "#ffffff",
  glassBorder: "rgba(0,0,0,0.07)",
};
