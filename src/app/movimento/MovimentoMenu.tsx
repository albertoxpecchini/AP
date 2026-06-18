import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft } from "lucide-react";

// I cinque livelli regolano quanto tempo hai per MEMORIZZARE la curva prima
// che sparisca: più sali, meno tempo. Griglia sempre 10×10, curva morbida.
export type LevelMode = 1 | 2 | 3 | 4 | 5;

interface Mode {
  level: LevelMode;
  name: string;
  desc: string;
  tag: string;
  color: string;
  bg: string;
  bgDark: string;
  watch: string; // tempo di memorizzazione mostrato sul badge
}

export const MODES: Mode[] = [
  { level: 1, name: "Esploratore",  desc: "3 secondi per memorizzare la curva. Per iniziare.",   tag: "Consigliato", color: "#9b5cf6", bg: "rgba(155,92,246,0.08)", bgDark: "rgba(155,92,246,0.16)", watch: "3,0 s" },
  { level: 2, name: "Viaggiatore",  desc: "2,5 secondi di osservazione. Il ritmo classico.",      tag: "Classico",    color: "#7c3aed", bg: "rgba(124,58,237,0.08)", bgDark: "rgba(124,58,237,0.16)", watch: "2,5 s" },
  { level: 3, name: "Navigatore",   desc: "2 secondi soltanto. La sfida cresce.",                 tag: "Sfida",       color: "#6024c4", bg: "rgba(96,36,196,0.08)",  bgDark: "rgba(96,36,196,0.18)",  watch: "2,0 s" },
  { level: 4, name: "Pilota",       desc: "1,5 secondi. Memoria sotto sforzo.",                   tag: "Difficile",   color: "#5b21b6", bg: "rgba(91,33,182,0.08)",  bgDark: "rgba(91,33,182,0.18)",  watch: "1,5 s" },
  { level: 5, name: "Maestro del Movimento", desc: "Appena 1,1 secondi. Il limite.",              tag: "Estremo",     color: "#4c1d95", bg: "rgba(76,29,149,0.08)",  bgDark: "rgba(76,29,149,0.20)",  watch: "1,1 s" },
];

interface MovimentoMenuProps {
  dark: boolean;
  bestStreak: number;
  trophiesCount: number;
  onPlay: (level: LevelMode) => void;
  onTutorial: () => void;
}

export default function MovimentoMenu({ dark, bestStreak, trophiesCount, onPlay, onTutorial }: MovimentoMenuProps) {
  const [selected, setSelected] = useState<LevelMode>(1);

  // Palette stile TRIVIA: viola accento + verde, su sfondo neutro.
  const bg       = dark ? "#0e0a16" : "#f4f6f5";
  const card     = dark ? "#1a1230" : "#ffffff";
  const bord     = dark ? "rgba(155,92,246,0.24)" : "rgba(124,58,237,0.16)";
  const val      = dark ? "#e7def7" : "#17271d";
  const lbl      = dark ? "#b6a9cf" : "#6b6080";
  const icon     = dark ? "#c4a5ff" : "#7c3aed";
  const note     = dark ? "#6a5d86" : "#9a90ab";
  const textMain = dark ? "#e7def7" : "#17271d";
  const textSub  = dark ? "#b6a9cf" : "#4a4458";

  const selectedMode = MODES.find(m => m.level === selected)!;

  const ModeList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {MODES.map(mode => {
        const isSelected = selected === mode.level;
        return (
          <button
            key={mode.level}
            type="button"
            onClick={() => setSelected(mode.level)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.7rem 0.9rem",
              background: isSelected ? (dark ? mode.bgDark : mode.bg) : card,
              border: `2px solid ${isSelected ? mode.color : bord}`,
              borderRadius: "12px",
              cursor: "pointer", fontFamily: "inherit",
              textAlign: "left", width: "100%",
              transition: "border-color 0.15s, background 0.15s",
              boxShadow: isSelected ? `0 2px 12px ${mode.color}22` : "none",
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: "10px", flexShrink: 0,
              background: isSelected ? mode.color : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}>
              <span style={{ fontSize: "1.15rem", fontWeight: 900, lineHeight: 1, color: isSelected ? "#fff" : lbl }}>{mode.level}</span>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, color: isSelected ? "rgba(255,255,255,0.7)" : note }}>liv.</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.1rem" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: isSelected ? mode.color : textMain }}>
                  {mode.name}
                </span>
                <span style={{
                  fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "0.08rem 0.38rem", borderRadius: 999, flexShrink: 0,
                  background: isSelected ? `${mode.color}22` : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"),
                  color: isSelected ? mode.color : lbl,
                }}>{mode.tag}</span>
              </div>
              <p style={{ fontSize: "0.73rem", color: textSub, margin: 0, lineHeight: 1.3 }}>{mode.desc}</p>
            </div>
            {isSelected && (
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: mode.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const PlayBtn = (
    <button
      type="button"
      onClick={() => onPlay(selected)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.95rem 1.3rem",
        background: selectedMode.color, color: "#fff",
        border: "none", borderRadius: "14px",
        fontSize: "0.98rem", fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: `0 6px 24px ${selectedMode.color}55`,
        transition: "filter 0.12s, transform 0.12s",
        width: "100%",
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
    >
      <div>
        <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>Gioca · {selectedMode.name}</div>
        <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: "0.1rem" }}>Memorizza in {selectedMode.watch} · {selectedMode.tag}</div>
      </div>
      <ChevronRight size={20} />
    </button>
  );

  const BackBtn = (
    <Link to="/#progetti" className="mvm-back-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ArrowLeft size={15} /> Torna ai progetti
    </Link>
  );

  return (
    <div className="mvm-root">

      {/* ════════ MOBILE: colonna unica ════════ */}
      <div className="mvm-mobile">
        <div className="mvm-hero">
          <div className="mvm-logo-wrap">
            <MovimentoMark size={64} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 className="mvm-title">MOVI<span className="mvm-accent">MENTO</span></h1>
            <p className="mvm-tagline">Guarda · memorizza · ridisegna</p>
          </div>
          <p className="mvm-kicker">Web Game · Memoria spaziale</p>
        </div>
        <div className="mvm-body">
          <div className="mvm-stats-card" style={{ background: card, border: `1px solid ${bord}` }}>
            <div className="mvm-stat"><Flame size={20} style={{ color: icon }} /><span className="mvm-stat-val" style={{ color: val }}>{bestStreak}</span><span className="mvm-stat-lbl" style={{ color: lbl }}>Miglior Streak</span></div>
            <div className="mvm-stat-sep" style={{ background: bord }} />
            <div className="mvm-stat"><Trophy size={20} style={{ color: icon }} /><span className="mvm-stat-val" style={{ color: val }}>{trophiesCount}</span><span className="mvm-stat-lbl" style={{ color: lbl }}>Trofei sbloccati</span></div>
          </div>
          <p className="mvm-section-label" style={{ color: lbl }}>Scegli la difficoltà</p>
          {ModeList}
          {PlayBtn}
          <button type="button" onClick={onTutorial} className="mvm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {BackBtn}
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Memorizza il percorso e ridisegnalo a memoria · più preciso, più punti</p>
        </div>
      </div>

      {/* ════════ DESKTOP: 2 colonne centrate ════════ */}
      <div className="mvm-desktop">
        <div className="mvm-desktop-left">
          <div className="mvm-logo-wrap">
            <MovimentoMark size={84} />
          </div>
          <h1 className="mvm-title">MOVI<span className="mvm-accent">MENTO</span></h1>
          <p className="mvm-tagline">Ridisegna il percorso a memoria</p>
          <div className="mvm-stats-card mvm-stats-dark">
            <div className="mvm-stat"><Flame size={18} style={{ color: "#6fd08a" }} /><span className="mvm-stat-val" style={{ color: "#fff" }}>{bestStreak}</span><span className="mvm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Miglior Streak</span></div>
            <div className="mvm-stat-sep" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="mvm-stat"><Trophy size={18} style={{ color: "#6fd08a" }} /><span className="mvm-stat-val" style={{ color: "#fff" }}>{trophiesCount}</span><span className="mvm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Trofei sbloccati</span></div>
          </div>
          <p className="mvm-kicker" style={{ position: "static", marginTop: "auto", opacity: 1 }}>Web Game · Memoria spaziale</p>
        </div>

        <div className="mvm-desktop-right" style={{ background: bg }}>
          <p className="mvm-section-label" style={{ color: lbl }}>Scegli la difficoltà</p>
          {ModeList}
          {PlayBtn}
          <button type="button" onClick={onTutorial} className="mvm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {BackBtn}
        </div>
      </div>

      <style>{`
        .mvm-root {
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: mvm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes mvm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .mvm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .mvm-desktop { display:none; }

        .mvm-hero {
          background: linear-gradient(160deg,#1a0b2e 0%,#2a1150 38%,#103820 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        /* aloni viola + verde negli angoli (come l'hero di Trivia) */
        .mvm-hero::before, .mvm-hero::after {
          content:""; position:absolute; width:60%; height:70%; border-radius:50%;
          filter:blur(50px); opacity:0.55; pointer-events:none; z-index:0;
        }
        .mvm-hero::before { background:#7c3aed; top:-25%; left:-15%; }
        .mvm-hero::after  { background:#2F9E5A; bottom:-30%; right:-15%; opacity:0.45; }
        .mvm-hero > * { position:relative; z-index:1; }
        .mvm-logo-wrap {
          background:#fff; color:#6024c4; border-radius:18px; padding:12px;
          box-shadow:0 8px 32px rgba(91,33,182,0.4); display:inline-flex;
        }
        .mvm-title {
          font-size:clamp(2rem,8.5vw,3.4rem); font-weight:900;
          letter-spacing:0.14em; margin:0; line-height:1; color:#fff;
        }
        .mvm-accent { color:#b794ff; }
        .mvm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0; font-weight:500; }
        .mvm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        .mvm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        .mvm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .mvm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12) !important; }
        .mvm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .mvm-stat-val { font-size:1.45rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .mvm-stat-lbl { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; }
        .mvm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .mvm-section-label {
          font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.12em; margin:0 0 0.1rem 0.2rem;
        }
        .mvm-tut-btn, .mvm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
          padding:0.7rem 1rem; background:transparent;
          border-radius:10px; font-size:0.87rem; font-weight:700;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          text-decoration:none;
        }
        .mvm-tut-btn:hover, .mvm-back-btn:hover { filter:brightness(0.85); }

        @media (min-width: 760px) {
          .mvm-mobile  { display:none; }
          .mvm-desktop {
            display:flex; flex-direction:row;
            height:100%; overflow:hidden;
            max-width:900px; margin:0 auto; width:100%;
          }
          .mvm-root { display:flex; align-items:stretch; justify-content:center; }
          .mvm-desktop-left {
            width:340px; flex-shrink:0;
            background:linear-gradient(160deg,#1a0b2e 0%,#2a1150 38%,#103820 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:1.1rem; padding:2.5rem 2rem; overflow:hidden;
          }
          .mvm-desktop-left .mvm-logo-wrap { padding:14px; border-radius:22px; }
          .mvm-desktop-left .mvm-title { font-size:2.6rem; }
          .mvm-desktop-left .mvm-stats-card { width:100%; }

          .mvm-desktop-right {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem 2rem; overflow-y:auto; justify-content:center;
          }
          .mvm-desktop-right .mvm-section-label { margin-bottom:0.2rem; }
        }
      `}</style>
    </div>
  );
}

// Marchio del gioco: un percorso a "S" con un pallino di partenza, in palette
// viola (stile Trivia) con un tocco di verde sul nodo finale.
export function MovimentoMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M16 70 C 34 70, 38 30, 54 42 S 78 70, 86 28"
        fill="none" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" />
      <circle cx="16" cy="70" r="8" fill="#6024c4" />
      <circle cx="86" cy="28" r="5" fill="#2F7D4A" />
    </svg>
  );
}
