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

// Accenti = palette "accent color" di Ubuntu/Yaru: ogni gioco un accento.
export const ACCENTS: Record<string, GameAccent> = {
  trivia:    { accent: "#e95420", glow: "rgba(233, 84, 32,0.45)" }, // arancio Ubuntu
  mappa:     { accent: "#7764d8", glow: "rgba(119,100,216,0.45)" }, // viola Yaru
  angoli:    { accent: "#34d399", glow: "rgba(52,211,153,0.42)" },  // verde
  parole:    { accent: "#fbbf24", glow: "rgba(251,191,36,0.42)" },  // ambra
  movimento: { accent: "#38bdf8", glow: "rgba(56,189,248,0.42)" },  // ciano
};

// Superfici/testi del tema (riferimento per i componenti del motore).
// Grigi CALDI tinti melanzana, come Yaru: mai grigi freddi/bluastri.
export const DARK = {
  bg0: "#1d171b",
  bg1: "#241c22",
  text: "#f5f3f1",
  sub: "#a39c96",
  glass: "rgba(255,255,255,0.045)",
  glassBorder: "rgba(255,255,255,0.09)",
};

export const LIGHT = {
  bg0: "#f1efed",
  bg1: "#f8f6f4",
  text: "#3d3846",
  sub: "#6e665f",
  glass: "#ffffff",
  glassBorder: "rgba(0,0,0,0.07)",
};
