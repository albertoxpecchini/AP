import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X } from "lucide-react";

export interface IntroStep {
  title: string;
  body: string;
  visual?: React.ReactNode;
}

interface GameTutorialProps {
  gameKey: string;
  steps: IntroStep[];
  accentColor: string;
  darkBg: string;
  dark?: boolean;
  onDone: () => void;
}

const SEEN_KEY_PREFIX = "game-tutorial-seen-";

export function hasSeenTutorial(gameKey: string): boolean {
  try { return localStorage.getItem(SEEN_KEY_PREFIX + gameKey) === "1"; } catch { return false; }
}

export function resetTutorial(gameKey: string): void {
  try { localStorage.removeItem(SEEN_KEY_PREFIX + gameKey); } catch {}
}

// Alias per compatibilità con il vecchio nome usato in Angoli.tsx
export const hasSeenIntro = hasSeenTutorial;
export const resetIntro   = resetTutorial;

export default function GameTutorial({
  gameKey, steps, accentColor, darkBg, dark = false, onDone,
}: GameTutorialProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  const finish = useCallback(() => {
    setExiting(true);
    try { localStorage.setItem(SEEN_KEY_PREFIX + gameKey, "1"); } catch {}
    setTimeout(onDone, 280);
  }, [gameKey, onDone]);

  const next = useCallback(() => {
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1);
    else finish();
  }, [stepIdx, steps.length, finish]);

  const cardBg     = dark ? "#1a2720" : "#ffffff";
  const cardBorder = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.18)";
  const textMain   = dark ? "#d4e8dc" : "#17271d";
  const textSub    = dark ? "#a4c4aa" : "#3c4a41";
  const overlayBg  = dark ? "rgba(10,24,16,0.88)" : "rgba(15,35,22,0.80)";
  const isLast     = stepIdx === steps.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: overlayBg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
      padding: "1rem",
      opacity: exiting ? 0 : 1,
      transition: "opacity 0.28s ease",
      userSelect: "none",
    }}>
      <div style={{
        width: "100%", maxWidth: 540,
        maxHeight: "100%", minHeight: 0,
        display: "flex", flexDirection: "column", gap: "0.9rem",
        animation: "gt-up 0.32s cubic-bezier(.34,1.56,.64,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)",
          }}>
            Tutorial · Passo {stepIdx + 1} di {steps.length}
          </span>
          <button type="button" onClick={finish}
            style={{
              background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.8)", padding: "6px 8px", borderRadius: 8,
              fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 4,
            }}
            aria-label="Salta il tutorial"
          >
            <X size={14} /> Salta
          </button>
        </div>

        {/* Card QUADRATA: stessa dimensione per ogni passo, lato = larghezza
            massima ma mai oltre l'altezza della viewport. */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column",
          aspectRatio: "1 / 1",    /* riquadro QUADRATO */
          minHeight: 0,            /* permette al contenuto di restringersi dentro la viewport */
        }}>
          {/* Area visual SEMPRE presente. L'immagine ha SEMPRE margine interno
              (padding) → non tocca mai i bordi del riquadro. */}
          <div
            key={`gt-vis-${stepIdx}`}
            style={{
              flex: "1 1 0", minHeight: 0,
              background: dark ? "#0f1612" : "#f4f6f5",
              borderBottom: `1px solid ${cardBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1.75rem",   /* margine interno sempre presente attorno alla figura */
              animation: "gt-vis-in 0.4s ease both",
            }}
          >
            {steps[stepIdx].visual}
          </div>
          <div style={{
            padding: "1.1rem 1.5rem 1.2rem", flexShrink: 0,
          }}>
            <h2 style={{
              fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem",
              color: textMain, lineHeight: 1.25,
            }}>
              {steps[stepIdx].title}
            </h2>
            <p style={{ fontSize: "0.92rem", margin: 0, lineHeight: 1.6, color: textSub }}>
              {steps[stepIdx].body}
            </p>
          </div>
        </div>

        {/* Dot progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === stepIdx ? 22 : 8, height: 8, borderRadius: 999,
              background: i === stepIdx ? accentColor : "rgba(255,255,255,0.22)",
              transition: "width 0.22s, background 0.22s",
            }} />
          ))}
        </div>

        {/* CTA */}
        <button type="button" onClick={next}
          style={{
            width: "100%", padding: "0.9rem 1.2rem",
            background: accentColor, color: "#fff", border: "none", borderRadius: 12,
            fontSize: "1rem", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            fontFamily: "inherit",
            boxShadow: "0 4px 20px rgba(47,125,74,0.35)",
          }}
          onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.9)")}
          onMouseLeave={e => (e.currentTarget.style.filter = "")}
        >
          {isLast ? "Ho capito, si gioca!" : <><span>Avanti</span> <ArrowRight size={17} /></>}
        </button>
      </div>

      <style>{`
        @keyframes gt-up {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* La figura di ogni passo entra con un piccolo fade/zoom ad ogni cambio. */
        @keyframes gt-vis-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
