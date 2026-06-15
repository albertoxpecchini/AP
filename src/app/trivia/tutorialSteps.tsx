import type { IntroStep } from "../components/GameIntro";

// Visual semplice e leggero (SVG/HTML inline) per ogni passo del tutorial.
// Niente immagini esterne: tutto vettoriale → leggerissimo.

function TypesVisual() {
  const chip = (bg: string, label: string) => (
    <div style={{
      background: bg, color: "#fff", borderRadius: 12, padding: "0.7rem 0.5rem",
      fontWeight: 800, fontSize: "0.8rem", textAlign: "center",
    }}>{label}</div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", width: "100%", maxWidth: 320 }}>
      {chip("#2F7D4A", "Scelta multipla")}
      {chip("#3a7bbf", "Vero / Falso")}
      {chip("#b5651d", "Risposta aperta")}
    </div>
  );
}

function ScoreVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem" }}>
      <div style={{
        width: 92, height: 92, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "conic-gradient(#2F9E5A 0 78%, rgba(0,0,0,0.08) 78% 100%)",
        fontWeight: 900, fontSize: "2rem", color: "#2F9E5A",
      }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "#f4f6f5", display: "flex", alignItems: "center", justifyContent: "center" }}>A−</div>
      </div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#3c4a41" }}>Voto + bonus velocità</p>
    </div>
  );
}

function StreakVisual() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "1.8rem" }}>
      <span>🔥</span><span>🔥</span><span>🔥</span>
      <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#D9A400" }}>×3</span>
      <span style={{ fontSize: "1.6rem" }}>🏆</span>
    </div>
  );
}

export const TRIVIA_INTRO: IntroStep[] = [
  {
    title: "Tre tipi di domanda",
    body: "Scelta multipla, vero o falso e risposta aperta. Le aperte accettano piccoli errori di battitura, quindi scrivi con tranquillità.",
    visual: <TypesVisual />,
  },
  {
    title: "Più giusto e veloce, più punti",
    body: "Ogni risposta corretta vale punti, con un bonus se rispondi in fretta. A fine partita ricevi un voto in stile americano, da F ad A+.",
    visual: <ScoreVisual />,
  },
  {
    title: "Streak e classifica live",
    body: "Le risposte corrette di fila accendono la streak e sbloccano trofei. Il tuo punteggio finisce nella classifica live di tutti i giocatori.",
    visual: <StreakVisual />,
  },
];
