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

// Accento = arancio Ubuntu (Trivia è l'unico gioco rimasto).
export const ACCENTS: Record<string, GameAccent> = {
  trivia: { accent: "#0f9d63", glow: "rgba(62, 207, 142,0.45)" }, // arancio Ubuntu
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
