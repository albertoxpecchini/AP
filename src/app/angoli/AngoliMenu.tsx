import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, ListOrdered } from "lucide-react";

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
  { step: 20, name: "Geometra Novizio",       desc: "Multipli di 20g. Perfetto per iniziare.",          tag: "Consigliato", color: "#3a9e5f", bg: "rgba(47,125,74,0.08)",   bgDark: "rgba(47,125,74,0.15)" },
  { step: 10, name: "Geometra Praticante",    desc: "Passi da 10g. Il punto di partenza classico.",     tag: "Classico",    color: "#2F7D4A", bg: "rgba(47,125,74,0.08)",   bgDark: "rgba(47,125,74,0.15)" },
  { step: 5,  name: "Geometra Esperto",       desc: "Passi da 5g. La sfida vera comincia qui.",         tag: "Sfida",       color: "#D9A400", bg: "rgba(217,164,0,0.08)",   bgDark: "rgba(217,164,0,0.13)" },
  { step: 2,  name: "Geometra Professionista",desc: "Passi da 2g. Per chi conosce ogni angolo.",        tag: "Difficile",   color: "#c07800", bg: "rgba(192,120,0,0.08)",   bgDark: "rgba(192,120,0,0.13)" },
  { step: 1,  name: "Maestro della Geometria",desc: "Passi da 1g. Qualsiasi valore da 1 a 399.",        tag: "Estremo",     color: "#c0392b", bg: "rgba(192,57,43,0.07)",   bgDark: "rgba(192,57,43,0.13)" },
];

interface AngoliMenuProps {
  dark: boolean;
  bestStrike: number;
  trophiesCount: number;
  nick?: string;
  onPlay: (step: StepMode) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onChangeNick: () => void;
}

export default function AngoliMenu({ dark, bestStrike, trophiesCount, nick, onPlay, onTutorial, onLeaderboard, onChangeNick }: AngoliMenuProps) {
  const [selected, setSelected] = useState<StepMode>(10);

  const bg       = dark ? "#111916" : "#f4f6f5";
  const card     = dark ? "#1a2720" : "#ffffff";
  const bord     = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val      = dark ? "#d4e8dc" : "#17271d";
  const lbl      = dark ? "#7ab893" : "#6b8070";
  const icon     = dark ? "#6fd08a" : "#2F7D4A";
  const note     = dark ? "#5a7a62" : "#8a9e91";
  const textMain = dark ? "#d4e8dc" : "#17271d";
  const textSub  = dark ? "#a4c4aa" : "#4a5c50";

  const selectedMode = MODES.find(m => m.step === selected)!;

  const ModeList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {MODES.map(mode => {
        const isSelected = selected === mode.step;
        return (
          <button
            key={mode.step}
            type="button"
            onClick={() => setSelected(mode.step)}
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
              <span style={{ fontSize: "1rem", fontWeight: 900, lineHeight: 1, color: isSelected ? "#fff" : lbl }}>{mode.step}</span>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: isSelected ? "rgba(255,255,255,0.7)" : note }}>g</span>
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
        <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>Gioca come {selectedMode.name}</div>
        <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: "0.1rem" }}>Passi da {selected}g · {selectedMode.tag}</div>
      </div>
      <ChevronRight size={20} />
    </button>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} className="anm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ListOrdered size={15} /> Classifica live
    </button>
  );

  const NickChip = nick ? (
    <button type="button" onClick={onChangeNick} className="anm-nick-chip" style={{ color: lbl, border: `1px solid ${bord}` }}>
      Giochi come <b style={{ color: textMain }}>{nick}</b> · cambia
    </button>
  ) : null;

  const BackBtn = (
    <Link to="/#progetti" className="anm-back-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ArrowLeft size={15} /> Torna ai progetti
    </Link>
  );

  return (
    <div className="anm-root">

      {/* ════════ MOBILE: colonna unica ════════ */}
      <div className="anm-mobile">
        {/* Hero verde */}
        <div className="anm-hero">
          <div className="anm-logo-wrap">
            <img src="/angoli-logo.png" alt="Angoli" className="anm-logo-img" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 className="anm-title">ANG<span className="anm-accent">OL</span>I</h1>
            <p className="anm-tagline">1 minuto · più veloce, più punti</p>
          </div>
          <p className="anm-kicker">Web Game · Geometria</p>
        </div>
        {/* Body */}
        <div className="anm-body">
          <div className="anm-stats-card" style={{ background: card, border: `1px solid ${bord}` }}>
            <div className="anm-stat"><Flame size={20} style={{ color: icon }} /><span className="anm-stat-val" style={{ color: val }}>{bestStrike}</span><span className="anm-stat-lbl" style={{ color: lbl }}>Miglior Streak</span></div>
            <div className="anm-stat-sep" style={{ background: bord }} />
            <div className="anm-stat"><Trophy size={20} style={{ color: icon }} /><span className="anm-stat-val" style={{ color: val }}>{trophiesCount}</span><span className="anm-stat-lbl" style={{ color: lbl }}>Trofei sbloccati</span></div>
          </div>
          <p className="anm-section-label" style={{ color: lbl }}>Scegli la modalità</p>
          {ModeList}
          {PlayBtn}
          {LbBtn}
          <button type="button" onClick={onTutorial} className="anm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {NickChip}
          {BackBtn}
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>1 minuto a partita · più sei veloce, più punti · classifica live</p>
        </div>
      </div>

      {/* ════════ DESKTOP: 2 colonne centrate ════════ */}
      <div className="anm-desktop">
        {/* Colonna sinistra: hero verde pieno */}
        <div className="anm-desktop-left">
          <div className="anm-logo-wrap">
            <img src="/angoli-logo.png" alt="Angoli" className="anm-logo-img" />
          </div>
          <h1 className="anm-title">ANG<span className="anm-accent">OL</span>I</h1>
          <p className="anm-tagline">Indovina l'angolo in gradianti</p>
          {/* Stats dentro l'hero su desktop */}
          <div className="anm-stats-card anm-stats-dark">
            <div className="anm-stat"><Flame size={18} style={{ color: "#6fd08a" }} /><span className="anm-stat-val" style={{ color: "#fff" }}>{bestStrike}</span><span className="anm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Miglior Streak</span></div>
            <div className="anm-stat-sep" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="anm-stat"><Trophy size={18} style={{ color: "#6fd08a" }} /><span className="anm-stat-val" style={{ color: "#fff" }}>{trophiesCount}</span><span className="anm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Trofei sbloccati</span></div>
          </div>
          <p className="anm-kicker" style={{ position: "static", marginTop: "auto", opacity: 1 }}>Web Game · Geometria</p>
        </div>

        {/* Colonna destra: selezione modalità */}
        <div className="anm-desktop-right" style={{ background: bg }}>
          <p className="anm-section-label" style={{ color: lbl }}>Scegli la modalità</p>
          {ModeList}
          {PlayBtn}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ flex: 1 }}>{LbBtn}</div>
            <button type="button" onClick={onTutorial} className="anm-tut-btn" style={{ flex: 1, color: icon, border: `1.5px solid ${bord}` }}>
              <BookOpen size={15} /> Come si gioca
            </button>
          </div>
          {NickChip}
          {BackBtn}
        </div>
      </div>

      <style>{`
        .anm-root {
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: anm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes anm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        /* ── mobile: mostra, desktop: nasconde ── */
        .anm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .anm-desktop { display:none; }

        /* ── Hero (mobile) ── */
        .anm-hero {
          background: linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .anm-logo-wrap {
          background:#fff; border-radius:18px; padding:12px;
          box-shadow:0 8px 32px rgba(0,0,0,0.28); display:inline-flex;
        }
        .anm-logo-img { width:min(90px,22vw); height:min(90px,22vw); object-fit:contain; display:block; }
        .anm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .anm-accent { color:#6fd08a; }
        .anm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.55); margin:0; font-weight:500; }
        .anm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        /* ── Body (mobile) ── */
        .anm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        /* ── Stats card ── */
        .anm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .anm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12) !important; }
        .anm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .anm-stat-val { font-size:1.45rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .anm-stat-lbl { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; }
        .anm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        /* ── Labels e bottoni ── */
        .anm-section-label {
          font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.12em; margin:0 0 0.1rem 0.2rem;
        }
        .anm-tut-btn, .anm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
          padding:0.7rem 1rem; background:transparent;
          border-radius:10px; font-size:0.87rem; font-weight:700;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          text-decoration:none;
        }
        .anm-tut-btn:hover, .anm-back-btn:hover { filter:brightness(0.85); }
        .anm-nick-chip {
          background:transparent; border-radius:999px;
          padding:0.45rem 0.9rem; font-size:0.76rem; font-weight:600;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          align-self:center;
        }
        .anm-nick-chip:hover { filter:brightness(0.85); }

        /* ════════ DESKTOP (≥760px) ════════ */
        @media (min-width: 760px) {
          .anm-mobile  { display:none; }
          .anm-desktop {
            display:flex; flex-direction:row;
            height:100%; overflow:hidden;
            /* contenitore centrato con larghezza massima */
            max-width:900px;
            margin:0 auto;
            width:100%;
          }
          /* wrapper esterno per centrare orizzontalmente */
          .anm-root {
            display:flex; align-items:stretch; justify-content:center;
          }
          .anm-desktop-left {
            width:340px; flex-shrink:0;
            background:linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:1.1rem; padding:2.5rem 2rem;
            overflow:hidden;
          }
          .anm-desktop-left .anm-logo-wrap { padding:14px; border-radius:22px; }
          .anm-desktop-left .anm-logo-img  { width:110px; height:110px; }
          .anm-desktop-left .anm-title     { font-size:3rem; }
          .anm-desktop-left .anm-stats-card { width:100%; }

          .anm-desktop-right {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem 2rem;
            overflow-y:auto;
            justify-content:center;
          }
          .anm-desktop-right .anm-section-label { margin-bottom:0.2rem; }
        }
      `}</style>
    </div>
  );
}
