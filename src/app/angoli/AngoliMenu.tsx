import { useState } from "react";
import { BookOpen, Trophy, Flame, ChevronRight } from "lucide-react";

export type StepMode = 20 | 10 | 5 | 2 | 1;

interface Mode {
  step: StepMode;
  name: string;
  desc: string;
  tag: string;
  color: string;
  bg: string;
  bgDark: string;
}

const MODES: Mode[] = [
  {
    step: 20,
    name: "Geometra Novizio",
    desc: "Passi da 20g — angoli multipli di 20. Perfetto per iniziare.",
    tag: "Consigliato",
    color: "#3a9e5f",
    bg: "rgba(47,125,74,0.08)",
    bgDark: "rgba(47,125,74,0.15)",
  },
  {
    step: 10,
    name: "Geometra Praticante",
    desc: "Passi da 10g — il punto di partenza classico.",
    tag: "Classico",
    color: "#2F7D4A",
    bg: "rgba(47,125,74,0.08)",
    bgDark: "rgba(47,125,74,0.15)",
  },
  {
    step: 5,
    name: "Geometra Esperto",
    desc: "Passi da 5g — la sfida vera comincia qui.",
    tag: "Sfida",
    color: "#D9A400",
    bg: "rgba(217,164,0,0.08)",
    bgDark: "rgba(217,164,0,0.13)",
  },
  {
    step: 2,
    name: "Geometra Professionista",
    desc: "Passi da 2g — per chi conosce ogni angolo a memoria.",
    tag: "Difficile",
    color: "#c07800",
    bg: "rgba(192,120,0,0.08)",
    bgDark: "rgba(192,120,0,0.13)",
  },
  {
    step: 1,
    name: "Maestro della Geometria",
    desc: "Passi da 1g — qualsiasi valore da 1 a 399. Pura precisione.",
    tag: "Estremo",
    color: "#c0392b",
    bg: "rgba(192,57,43,0.07)",
    bgDark: "rgba(192,57,43,0.13)",
  },
];

interface AngoliMenuProps {
  dark: boolean;
  bestStrike: number;
  trophiesCount: number;
  onPlay: (step: StepMode) => void;
  onTutorial: () => void;
}

export default function AngoliMenu({ dark, bestStrike, trophiesCount, onPlay, onTutorial }: AngoliMenuProps) {
  const [selected, setSelected] = useState<StepMode>(10);

  const card  = dark ? "#1a2720" : "#ffffff";
  const bord  = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val   = dark ? "#d4e8dc" : "#17271d";
  const lbl   = dark ? "#7ab893" : "#6b8070";
  const icon  = dark ? "#6fd08a" : "#2F7D4A";
  const note  = dark ? "#5a7a62" : "#8a9e91";
  const bg    = dark ? "#111916" : "#f4f6f5";
  const textMain = dark ? "#d4e8dc" : "#17271d";
  const textSub  = dark ? "#a4c4aa" : "#4a5c50";

  const selectedMode = MODES.find(m => m.step === selected)!;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", flexDirection: "column",
      fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
      background: bg,
      animation: "anm-in 0.25s ease",
      overflowY: "auto",
    }}>

      {/* ── HERO ── */}
      <div style={{
        background: "linear-gradient(160deg, #0b2a18 0%, #103820 45%, #1a5030 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "1rem",
        padding: "2.2rem 1.5rem 2rem",
        position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          background: "#fff", borderRadius: "20px", padding: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)", display: "inline-flex", flexShrink: 0,
        }}>
          <img src="/angoli-logo.png" alt="Angoli"
            style={{ width: "min(100px, 24vw)", height: "min(100px, 24vw)", objectFit: "contain", display: "block" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(2.4rem, 10vw, 4rem)", fontWeight: 900,
            letterSpacing: "0.28em", margin: 0, lineHeight: 1, color: "#ffffff",
          }}>
            ANG<span style={{ color: "#6fd08a" }}>OL</span>I
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", margin: "0.4rem 0 0", fontWeight: 500 }}>
            Indovina l'angolo in gradianti
          </p>
        </div>
        <p style={{
          position: "absolute", bottom: "0.75rem", left: "1.5rem",
          fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.16em", color: "rgba(255,255,255,0.28)", margin: 0,
        }}>Web Game · Geometria</p>
      </div>

      {/* ── BODY ── */}
      <div style={{ flexShrink: 0, padding: "1.2rem 1.2rem 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Stats */}
        <div style={{
          display: "flex", alignItems: "stretch",
          background: card, border: `1px solid ${bord}`,
          borderRadius: "14px", padding: "0.9rem 1.2rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
            <Flame size={20} style={{ color: icon }} />
            <span style={{ fontSize: "1.5rem", fontWeight: 900, color: val, lineHeight: 1 }}>{bestStrike}</span>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: lbl }}>Miglior Streak</span>
          </div>
          <div style={{ width: 1, background: bord, margin: "0 0.5rem" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
            <Trophy size={20} style={{ color: icon }} />
            <span style={{ fontSize: "1.5rem", fontWeight: 900, color: val, lineHeight: 1 }}>{trophiesCount}</span>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: lbl }}>Trofei sbloccati</span>
          </div>
        </div>

        {/* Sezione selezione modalità */}
        <div>
          <p style={{
            fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: lbl, margin: "0 0 0.6rem 0.2rem",
          }}>
            Scegli la modalità
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {MODES.map(mode => {
              const isSelected = selected === mode.step;
              const modeBg = dark ? mode.bgDark : mode.bg;
              return (
                <button
                  key={mode.step}
                  type="button"
                  onClick={() => setSelected(mode.step)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.8rem",
                    padding: "0.75rem 1rem",
                    background: isSelected ? modeBg : card,
                    border: `2px solid ${isSelected ? mode.color : bord}`,
                    borderRadius: "12px",
                    cursor: "pointer", fontFamily: "inherit",
                    textAlign: "left", width: "100%",
                    transition: "border-color 0.15s, background 0.15s",
                    boxShadow: isSelected ? `0 2px 12px ${mode.color}22` : "none",
                  }}
                >
                  {/* Step badge */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "10px", flexShrink: 0,
                    background: isSelected ? mode.color : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}>
                    <span style={{
                      fontSize: "1rem", fontWeight: 900, lineHeight: 1,
                      color: isSelected ? "#fff" : (dark ? "#7ab893" : "#6b8070"),
                      fontVariantNumeric: "tabular-nums",
                    }}>{mode.step}</span>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 700,
                      color: isSelected ? "rgba(255,255,255,0.75)" : (dark ? "#5a7a62" : "#a0b0a8"),
                    }}>g</span>
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.15rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 800, color: isSelected ? mode.color : textMain }}>
                        {mode.name}
                      </span>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", padding: "0.1rem 0.4rem",
                        borderRadius: 999,
                        background: isSelected ? `${mode.color}22` : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"),
                        color: isSelected ? mode.color : lbl,
                        flexShrink: 0,
                      }}>
                        {mode.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: textSub, margin: 0, lineHeight: 1.3 }}>
                      {mode.desc}
                    </p>
                  </div>
                  {/* Check */}
                  {isSelected && (
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: mode.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA Gioca */}
        <button
          type="button"
          onClick={() => onPlay(selected)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.4rem",
            background: selectedMode.color,
            color: "#fff", border: "none", borderRadius: "14px",
            fontSize: "1rem", fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 6px 24px ${selectedMode.color}55`,
            transition: "filter 0.12s, transform 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.92)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = ""; }}
        >
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800 }}>Gioca come {selectedMode.name}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.1rem" }}>
              Passi da {selected}g · {selectedMode.tag}
            </div>
          </div>
          <ChevronRight size={22} />
        </button>

        {/* Tutorial link */}
        <button type="button" onClick={onTutorial} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.7rem 1rem",
          background: "transparent",
          border: `1.5px solid ${bord}`,
          borderRadius: "10px",
          color: dark ? "#6fd08a" : "#2F7D4A", fontSize: "0.88rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          <BookOpen size={16} /> Come si gioca
        </button>

        <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>
          5 modalità · trofei geometrici · streak illimitata
        </p>
      </div>

      <style>{`
        @keyframes anm-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
