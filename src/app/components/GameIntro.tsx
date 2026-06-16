import { useState, useEffect, useCallback, useRef } from "react";
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
  /** Nodo opzionale (es. <style> di keyframes) iniettato UNA volta nell'overlay. */
  extra?: React.ReactNode;
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
  gameKey, steps, accentColor, darkBg, dark = false, extra, onDone,
}: GameTutorialProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  // Direzione dell'ultima transizione (1 = avanti, -1 = indietro) → anima lo
  // scambio di scena con un piccolo slide coerente.
  const [dir, setDir] = useState(1);
  // Chiave incrementale: forza il remount della scena ad ogni cambio passo così
  // le animazioni di entrata ripartono sempre da zero.
  const sceneKey = useRef(0);

  const finish = useCallback(() => {
    setExiting(true);
    try { localStorage.setItem(SEEN_KEY_PREFIX + gameKey, "1"); } catch {}
    setTimeout(onDone, 360);
  }, [gameKey, onDone]);

  const go = useCallback((delta: number) => {
    const target = stepIdx + delta;
    if (target < 0) return;
    if (target > steps.length - 1) { finish(); return; }
    setDir(delta >= 0 ? 1 : -1);
    sceneKey.current += 1;
    setStepIdx(target);
  }, [stepIdx, steps.length, finish]);

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  // Navigazione da tastiera: → / Spazio avanti, ← indietro, Esc salta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, finish]);

  const cardBg     = dark ? "#1a2720" : "#ffffff";
  const cardBorder = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.18)";
  const textMain   = dark ? "#d4e8dc" : "#17271d";
  const textSub    = dark ? "#a4c4aa" : "#3c4a41";
  const visualBg   = dark ? "#0f1612" : "#f4f6f5";
  const isLast     = stepIdx === steps.length - 1;
  const isFirst    = stepIdx === 0;

  return (
    <div
      className="gt-overlay"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
        padding: "1rem",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.36s ease",
        userSelect: "none",
        // backdrop a gradiente vivo + leggero pan, con vignettatura morbida.
        ["--gt-accent" as string]: accentColor,
        ["--gt-dark" as string]: darkBg,
      }}
    >
      {/* Backdrop animato (sotto la card). */}
      <div className="gt-backdrop" aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div className="gt-aurora" />
        <div className="gt-grain" />
      </div>

      <div
        className="gt-shell"
        style={{
          position: "relative",
          width: "100%", maxWidth: 540,
          maxHeight: "100%", minHeight: 0,
          display: "flex", flexDirection: "column", gap: "0.9rem",
          animation: exiting
            ? "gt-out 0.34s cubic-bezier(.4,0,1,1) both"
            : "gt-up 0.42s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)",
          }}>
            Tutorial · Passo {stepIdx + 1} di {steps.length}
          </span>
          <button type="button" onClick={finish}
            className="gt-skip"
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

        {/* Card QUADRATA: lato = larghezza max ma mai oltre l'altezza viewport. */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column",
          aspectRatio: "1 / 1",
          minHeight: 0,
        }}>
          {/* Area visual: scena rimontata ad ogni passo → animazioni ripartono.
              Lo slide direzionale dà continuità tra un passo e l'altro. */}
          <div style={{
            flex: "1 1 0", minHeight: 0, position: "relative",
            background: visualBg,
            borderBottom: `1px solid ${cardBorder}`,
            overflow: "hidden",
          }}>
            <div
              key={`gt-scene-${sceneKey.current}`}
              className="gt-scene"
              style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "1.75rem",
                animation: `${dir >= 0 ? "gt-scene-next" : "gt-scene-prev"} 0.5s cubic-bezier(.22,1,.36,1) both`,
              }}
            >
              {steps[stepIdx].visual}
            </div>
          </div>

          <div style={{ padding: "1.1rem 1.5rem 1.2rem", flexShrink: 0 }}>
            <h2
              key={`gt-title-${stepIdx}`}
              className="gt-text-in"
              style={{
                fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem",
                color: textMain, lineHeight: 1.25,
              }}
            >
              {steps[stepIdx].title}
            </h2>
            <p
              key={`gt-body-${stepIdx}`}
              className="gt-text-in gt-text-in-d"
              style={{ fontSize: "0.92rem", margin: 0, lineHeight: 1.6, color: textSub }}
            >
              {steps[stepIdx].body}
            </p>
          </div>
        </div>

        {/* Dot progress con pill scorrevole. */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 6, height: 8 }}>
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Vai al passo ${i + 1}`}
              onClick={() => { setDir(i >= stepIdx ? 1 : -1); sceneKey.current += 1; setStepIdx(i); }}
              style={{
                width: i === stepIdx ? 24 : 8, height: 8, borderRadius: 999, padding: 0, border: "none", cursor: "pointer",
                background: i === stepIdx ? accentColor : "rgba(255,255,255,0.24)",
                boxShadow: i === stepIdx ? `0 0 10px ${accentColor}aa` : "none",
                transition: "width 0.34s cubic-bezier(.34,1.56,.64,1), background 0.3s, box-shadow 0.3s",
              }}
            />
          ))}
        </div>

        {/* CTA + Indietro */}
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {!isFirst && (
            <button type="button" onClick={prev}
              className="gt-back"
              style={{
                padding: "0.9rem 1.1rem",
                background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 12,
                fontSize: "1rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                flexShrink: 0,
              }}
              aria-label="Passo precedente"
            >
              ←
            </button>
          )}
          <button type="button" onClick={next}
            className="gt-cta"
            style={{
              flex: 1, padding: "0.9rem 1.2rem",
              background: accentColor, color: "#fff", border: "none", borderRadius: 12,
              fontSize: "1rem", fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              fontFamily: "inherit", position: "relative", overflow: "hidden",
              boxShadow: `0 6px 24px ${accentColor}59`,
            }}
          >
            <span className="gt-cta-shine" aria-hidden />
            {isLast
              ? <span style={{ position: "relative" }}>Ho capito, si gioca!</span>
              : <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  Avanti <ArrowRight size={17} className="gt-cta-arrow" />
                </span>}
          </button>
        </div>
      </div>

      {/* Keyframes opzionali specifiche del gioco (iniettate una volta). */}
      {extra}

      <style>{`
        .gt-overlay { background: rgba(8,20,13,0.5); }
        .gt-aurora {
          position: absolute; inset: -30%;
          background:
            radial-gradient(40% 50% at 25% 30%, var(--gt-accent), transparent 70%),
            radial-gradient(45% 55% at 80% 25%, var(--gt-dark), transparent 72%),
            radial-gradient(50% 60% at 60% 85%, var(--gt-accent), transparent 70%),
            var(--gt-dark);
          filter: blur(40px) saturate(1.1);
          opacity: 0.92;
          animation: gt-aurora-pan 18s ease-in-out infinite alternate;
        }
        .gt-grain {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%);
        }
        @keyframes gt-aurora-pan {
          0%   { transform: translate3d(-4%, -3%, 0) scale(1.05) rotate(0deg); }
          50%  { transform: translate3d(3%, 2%, 0) scale(1.12) rotate(3deg); }
          100% { transform: translate3d(-2%, 4%, 0) scale(1.06) rotate(-2deg); }
        }

        @keyframes gt-up {
          from { opacity: 0; transform: translateY(28px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gt-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(16px) scale(0.96); }
        }

        @keyframes gt-scene-next {
          from { opacity: 0; transform: translateX(34px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes gt-scene-prev {
          from { opacity: 0; transform: translateX(-34px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        .gt-text-in { animation: gt-text-in 0.5s cubic-bezier(.22,1,.36,1) both; }
        .gt-text-in-d { animation-delay: 0.08s; }
        @keyframes gt-text-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .gt-skip:hover { background: rgba(255,255,255,0.2) !important; }
        .gt-back:hover { background: rgba(255,255,255,0.18) !important; }

        .gt-cta { transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
        .gt-cta:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 10px 30px var(--gt-accent); }
        .gt-cta:active { transform: translateY(0) scale(0.985); }
        .gt-cta-shine {
          position: absolute; top: 0; left: -60%; width: 50%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-18deg);
          animation: gt-shine 3.4s ease-in-out infinite;
        }
        @keyframes gt-shine {
          0%, 60% { left: -60%; }
          100%    { left: 130%; }
        }
        .gt-cta-arrow { animation: gt-nudge 1.6s ease-in-out infinite; }
        @keyframes gt-nudge {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(4px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .gt-aurora, .gt-cta-shine, .gt-cta-arrow { animation: none !important; }
          .gt-scene, .gt-text-in { animation-duration: 0.001s !important; }
        }
      `}</style>
    </div>
  );
}
