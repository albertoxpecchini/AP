// ─── Voto "americano" A–F dalla percentuale di risposte corrette ─────────────
//
// Scala lettera classica USA + colore (rosso → verde) per la schermata
// risultati. Il punteggio numerico per la classifica è un'altra cosa (corrette
// + bonus velocità), gestito in Trivia.tsx; qui solo la conversione % → voto.

export interface Grade {
  letter: string;   // A+ … F
  label: string;    // descrizione breve
  color: string;    // colore principale (chiaro)
  colorDark: string;// variante per dark mode
}

// Soglie sulla percentuale di corrette (0–100).
const SCALE: { min: number; letter: string; label: string; color: string; colorDark: string }[] = [
  { min: 97, letter: "A+", label: "Perfetto!",      color: "#1F8A4C", colorDark: "#6fe0a6" },
  { min: 93, letter: "A",  label: "Eccellente",     color: "#2F9E5A", colorDark: "#5fd08a" },
  { min: 90, letter: "A−", label: "Ottimo",         color: "#3FA862", colorDark: "#57c884" },
  { min: 87, letter: "B+", label: "Molto bene",     color: "#6BAE3C", colorDark: "#a8d96b" },
  { min: 83, letter: "B",  label: "Bene",           color: "#8AB52E", colorDark: "#c2e06f" },
  { min: 80, letter: "B−", label: "Discreto",       color: "#A6B524", colorDark: "#d7e06f" },
  { min: 77, letter: "C+", label: "Sufficiente",    color: "#D9A400", colorDark: "#e8c34a" },
  { min: 73, letter: "C",  label: "Quasi",          color: "#D98E00", colorDark: "#e8b04a" },
  { min: 70, letter: "C−", label: "Rivedi un po'",  color: "#C77800", colorDark: "#e0a04a" },
  { min: 67, letter: "D+", label: "Insufficiente",  color: "#C06010", colorDark: "#e0904a" },
  { min: 60, letter: "D",  label: "Da migliorare",  color: "#B5481A", colorDark: "#d9784a" },
  { min: 0,  letter: "F",  label: "Riprova!",       color: "#C0392B", colorDark: "#e06b5a" },
];

export function gradeFromPct(pct: number): Grade {
  const p = Math.max(0, Math.min(100, pct));
  const found = SCALE.find(s => p >= s.min) || SCALE[SCALE.length - 1];
  return { letter: found.letter, label: found.label, color: found.color, colorDark: found.colorDark };
}

/** True se il voto merita i confetti (B− o superiore). */
export function isGoodGrade(pct: number): boolean {
  return pct >= 80;
}
