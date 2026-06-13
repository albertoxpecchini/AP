import { BookOpen, Play, Trophy, Flame } from "lucide-react";

interface AngoliMenuProps {
  dark: boolean;
  bestStrike: number;
  trophiesCount: number;
  onPlay: () => void;
  onTutorial: () => void;
}

export default function AngoliMenu({ dark, bestStrike, trophiesCount, onPlay, onTutorial }: AngoliMenuProps) {
  const bg    = dark ? "#111916" : "#f4f6f5";
  const card  = dark ? "#1a2720" : "#ffffff";
  const bord  = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val   = dark ? "#d4e8dc" : "#17271d";
  const lbl   = dark ? "#7ab893" : "#6b8070";
  const icon  = dark ? "#6fd08a" : "#2F7D4A";
  const tutC  = dark ? "#6fd08a" : "#2F7D4A";
  const tutB  = dark ? "rgba(111,208,138,0.20)" : "rgba(47,125,74,0.09)";
  const tutBo = dark ? "rgba(111,208,138,0.30)" : "rgba(47,125,74,0.30)";
  const note  = dark ? "#5a7a62" : "#8a9e91";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", flexDirection: "column",
      fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
      background: bg,
      animation: "anm-in 0.25s ease",
    }}>

      {/* ── HERO: sfondo verde scuro, occupa la metà superiore ── */}
      <div style={{
        flex: "1 1 0",
        background: "linear-gradient(160deg, #0b2a18 0%, #103820 45%, #1a5030 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        gap: "1.5rem",
        padding: "2rem 1.5rem",
      }}>

        {/* Logo PNG su card bianca */}
        <div style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          display: "inline-flex",
          flexShrink: 0,
        }}>
          <img
            src="/angoli-logo.png"
            alt="Angoli"
            style={{
              width: "min(140px, 32vw)",
              height: "min(140px, 32vw)",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        {/* Titolo + tagline */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(2.8rem, 12vw, 5rem)",
            fontWeight: 900,
            letterSpacing: "0.28em",
            margin: 0,
            lineHeight: 1,
            color: "#ffffff",
          }}>
            ANG<span style={{ color: "#6fd08a" }}>OL</span>I
          </h1>
          <p style={{
            fontSize: "0.88rem",
            color: "rgba(255,255,255,0.60)",
            margin: "0.5rem 0 0",
            fontWeight: 500,
            letterSpacing: "0.04em",
          }}>
            Indovina l'angolo in gradianti
          </p>
        </div>

        {/* Pulsante GIOCA */}
        <button
          type="button"
          onClick={onPlay}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.6rem",
            padding: "0.9rem 2.8rem",
            background: "#ffffff",
            color: "#0b2a18",
            border: "none", borderRadius: "12px",
            fontSize: "1.15rem", fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            letterSpacing: "0.06em",
            boxShadow: "0 6px 28px rgba(0,0,0,0.30)",
            transition: "transform 0.12s, box-shadow 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,0,0,0.38)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.30)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = ""; }}
        >
          <Play size={20} strokeWidth={2.5} />
          Gioca
        </button>

        {/* Kicker in basso a sinistra */}
        <p style={{
          position: "absolute", bottom: "1rem", left: "1.5rem",
          fontSize: "0.68rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.35)",
          margin: 0,
        }}>
          Web Game · Geometria
        </p>
      </div>

      {/* ── BODY: stats + tutorial ── */}
      <div style={{
        flexShrink: 0,
        padding: "1.4rem 1.5rem 1.8rem",
        display: "flex", flexDirection: "column", gap: "1rem",
        background: bg,
      }}>

        {/* Stats card */}
        <div style={{
          display: "flex", alignItems: "stretch",
          background: card,
          border: `1px solid ${bord}`,
          borderRadius: "14px",
          padding: "1.1rem 1.2rem",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
            <Flame size={22} style={{ color: icon }} aria-hidden="true" />
            <span style={{ fontSize: "1.7rem", fontWeight: 900, color: val, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {bestStrike}
            </span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: lbl }}>
              Miglior Streak
            </span>
          </div>
          <div style={{ width: 1, background: bord, margin: "0 0.5rem", flexShrink: 0 }} aria-hidden="true" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem" }}>
            <Trophy size={22} style={{ color: icon }} aria-hidden="true" />
            <span style={{ fontSize: "1.7rem", fontWeight: 900, color: val, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {trophiesCount}
            </span>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: lbl }}>
              Trofei sbloccati
            </span>
          </div>
        </div>

        {/* Bottone tutorial */}
        <button
          type="button"
          onClick={onTutorial}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            padding: "0.8rem 1.2rem",
            background: tutB,
            border: `1.5px solid ${tutBo}`,
            borderRadius: "10px",
            color: tutC, fontSize: "0.93rem", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            transition: "filter 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.93)"; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
        >
          <BookOpen size={17} />
          Come si gioca
        </button>

        {/* Tagline */}
        <p style={{ fontSize: "0.72rem", color: note, textAlign: "center", margin: 0 }}>
          5 livelli di difficoltà · da 20g a 1g · trofei geometrici
        </p>
      </div>

      <style>{`
        @keyframes anm-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @media (min-width: 600px) {
          .anm-hero-inner { max-width: 480px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
