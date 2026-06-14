import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, Clock, ChevronRight, ArrowLeft, ListOrdered } from "lucide-react";
import { LENGTHS, type WordLength } from "./words";

// Una "modalità" di Parole = lunghezza parola + livello di aiuti.
// Riusiamo solo le lunghezze con dizionario verificato (5 e 6), declinate in
// due livelli ciascuna (Normale / Sfida) per ottenere 4 voci come Angoli.
export type ModeId = "5-normale" | "5-sfida" | "6-normale" | "6-sfida";

export interface ParoleMode {
  id: ModeId;
  length: WordLength;
  hints: number;     // aiuti disponibili in questa modalità
  name: string;
  desc: string;
  tag: string;
  color: string;
  bg: string;
  bgDark: string;
}

export const MODES: ParoleMode[] = [
  { id: "5-normale", length: 5, hints: 3, name: "Lessico Praticante",  desc: "5 lettere, 3 aiuti. Il classico per iniziare.",        tag: "Classico",    color: "#2F7D4A", bg: "rgba(47,125,74,0.08)", bgDark: "rgba(47,125,74,0.15)" },
  { id: "5-sfida",   length: 5, hints: 1, name: "Lessico Esperto",     desc: "5 lettere, 1 solo aiuto. La sfida vera.",            tag: "Sfida",       color: "#D9A400", bg: "rgba(217,164,0,0.08)", bgDark: "rgba(217,164,0,0.13)" },
  { id: "6-normale", length: 6, hints: 3, name: "Lessico Avanzato",    desc: "6 lettere, 3 aiuti. Parole più lunghe.",             tag: "Difficile",   color: "#c07800", bg: "rgba(192,120,0,0.08)", bgDark: "rgba(192,120,0,0.13)" },
  { id: "6-sfida",   length: 6, hints: 0, name: "Maestro del Lessico", desc: "6 lettere, nessun aiuto. Solo per veri campioni.",   tag: "Estremo",     color: "#c0392b", bg: "rgba(192,57,43,0.07)", bgDark: "rgba(192,57,43,0.13)" },
];

export function getMode(id: ModeId): ParoleMode {
  return MODES.find(m => m.id === id) ?? MODES[0];
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

interface ParoleMenuProps {
  dark: boolean;
  bestStrike: number;
  trophiesCount: number;
  bestTime: number | null;
  nick?: string;
  onPlay: (mode: ModeId) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onChangeNick: () => void;
}

export default function ParoleMenu({ dark, bestStrike, trophiesCount, bestTime, nick, onPlay, onTutorial, onLeaderboard, onChangeNick }: ParoleMenuProps) {
  const [selected, setSelected] = useState<ModeId>("5-normale");

  const bg       = dark ? "#111916" : "#f4f6f5";
  const card     = dark ? "#1a2720" : "#ffffff";
  const bord     = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val      = dark ? "#d4e8dc" : "#17271d";
  const lbl      = dark ? "#7ab893" : "#6b8070";
  const icon     = dark ? "#6fd08a" : "#2F7D4A";
  const note     = dark ? "#5a7a62" : "#8a9e91";
  const textMain = dark ? "#d4e8dc" : "#17271d";
  const textSub  = dark ? "#a4c4aa" : "#4a5c50";

  const selectedMode = getMode(selected);

  const ModeList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {MODES.map(mode => {
        const isSelected = selected === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => setSelected(mode.id)}
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
              <span style={{ fontSize: "1rem", fontWeight: 900, lineHeight: 1, color: isSelected ? "#fff" : lbl }}>{mode.length}</span>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, color: isSelected ? "rgba(255,255,255,0.7)" : note }}>lett.</span>
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
        <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: "0.1rem" }}>{selectedMode.length} lettere · {selectedMode.tag}</div>
      </div>
      <ChevronRight size={20} />
    </button>
  );

  const BackBtn = (
    <Link to="/#progetti" className="pnm-back-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ArrowLeft size={15} /> Torna ai progetti
    </Link>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} className="pnm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ListOrdered size={15} /> Classifica live
    </button>
  );

  const NickChip = nick ? (
    <button type="button" onClick={onChangeNick} className="pnm-nick-chip" style={{ color: lbl, border: `1px solid ${bord}` }}>
      Giochi come <b style={{ color: textMain }}>{nick}</b> · cambia
    </button>
  ) : null;

  return (
    <div className="pnm-root">

      {/* ════════ MOBILE: colonna unica ════════ */}
      <div className="pnm-mobile">
        {/* Hero verde */}
        <div className="pnm-hero">
          <div className="pnm-logo-wrap">
            <span className="pnm-logo-mark">PE</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 className="pnm-title">PAR<span className="pnm-accent">OL</span>E</h1>
            <p className="pnm-tagline">Indovina la parola nascosta</p>
          </div>
          <p className="pnm-kicker">Web Game · Lessico</p>
        </div>
        {/* Body */}
        <div className="pnm-body">
          <div className="pnm-stats-card" style={{ background: card, border: `1px solid ${bord}` }}>
            <div className="pnm-stat"><Flame size={20} style={{ color: icon }} /><span className="pnm-stat-val" style={{ color: val }}>{bestStrike}</span><span className="pnm-stat-lbl" style={{ color: lbl }}>Miglior Streak</span></div>
            <div className="pnm-stat-sep" style={{ background: bord }} />
            <div className="pnm-stat"><Trophy size={20} style={{ color: icon }} /><span className="pnm-stat-val" style={{ color: val }}>{trophiesCount}</span><span className="pnm-stat-lbl" style={{ color: lbl }}>Trofei</span></div>
            <div className="pnm-stat-sep" style={{ background: bord }} />
            <div className="pnm-stat"><Clock size={20} style={{ color: icon }} /><span className="pnm-stat-val" style={{ color: val }}>{bestTime != null ? fmtTime(bestTime) : "—"}</span><span className="pnm-stat-lbl" style={{ color: lbl }}>Record</span></div>
          </div>
          <p className="pnm-section-label" style={{ color: lbl }}>Scegli la modalità</p>
          {ModeList}
          {PlayBtn}
          {LbBtn}
          <button type="button" onClick={onTutorial} className="pnm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {NickChip}
          {BackBtn}
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>4 modalità · classifica live · trofei · streak</p>
        </div>
      </div>

      {/* ════════ DESKTOP: 2 colonne centrate ════════ */}
      <div className="pnm-desktop">
        {/* Colonna sinistra: hero verde pieno */}
        <div className="pnm-desktop-left">
          <div className="pnm-logo-wrap">
            <span className="pnm-logo-mark">PE</span>
          </div>
          <h1 className="pnm-title">PAR<span className="pnm-accent">OL</span>E</h1>
          <p className="pnm-tagline">Indovina la parola nascosta</p>
          {/* Stats dentro l'hero su desktop */}
          <div className="pnm-stats-card pnm-stats-dark">
            <div className="pnm-stat"><Flame size={18} style={{ color: "#6fd08a" }} /><span className="pnm-stat-val" style={{ color: "#fff" }}>{bestStrike}</span><span className="pnm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Streak</span></div>
            <div className="pnm-stat-sep" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="pnm-stat"><Trophy size={18} style={{ color: "#6fd08a" }} /><span className="pnm-stat-val" style={{ color: "#fff" }}>{trophiesCount}</span><span className="pnm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Trofei</span></div>
            <div className="pnm-stat-sep" style={{ background: "rgba(255,255,255,0.15)" }} />
            <div className="pnm-stat"><Clock size={18} style={{ color: "#6fd08a" }} /><span className="pnm-stat-val" style={{ color: "#fff" }}>{bestTime != null ? fmtTime(bestTime) : "—"}</span><span className="pnm-stat-lbl" style={{ color: "rgba(255,255,255,0.55)" }}>Record</span></div>
          </div>
          <p className="pnm-kicker" style={{ position: "static", marginTop: "auto", opacity: 1 }}>Web Game · Lessico</p>
        </div>

        {/* Colonna destra: selezione modalità */}
        <div className="pnm-desktop-right" style={{ background: bg }}>
          <p className="pnm-section-label" style={{ color: lbl }}>Scegli la modalità</p>
          {ModeList}
          {PlayBtn}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>{LbBtn}</div>
            <button type="button" onClick={onTutorial} className="pnm-tut-btn" style={{ flex: 1, color: icon, border: `1.5px solid ${bord}` }}>
              <BookOpen size={15} /> Come si gioca
            </button>
          </div>
          {NickChip}
          {BackBtn}
        </div>
      </div>

      <style>{`
        .pnm-root {
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: pnm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes pnm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        /* ── mobile: mostra, desktop: nasconde ── */
        .pnm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .pnm-desktop { display:none; }

        /* ── Hero (mobile) ── */
        .pnm-hero {
          background: linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .pnm-logo-wrap {
          background:#fff; border-radius:18px; padding:12px;
          box-shadow:0 8px 32px rgba(0,0,0,0.28); display:inline-flex;
          align-items:center; justify-content:center;
          width:min(90px,22vw); height:min(90px,22vw);
        }
        .pnm-logo-mark {
          font-size:min(2.6rem,7vw); font-weight:900; letter-spacing:0.04em;
          color:#2F7D4A; line-height:1;
        }
        .pnm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .pnm-accent { color:#6fd08a; }
        .pnm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.55); margin:0; font-weight:500; }
        .pnm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        /* ── Body (mobile) ── */
        .pnm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        /* ── Stats card ── */
        .pnm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .pnm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12) !important; }
        .pnm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; min-width:0; }
        .pnm-stat-val { font-size:1.3rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .pnm-stat-lbl { font-size:0.56rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .pnm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        /* ── Labels e bottoni ── */
        .pnm-section-label {
          font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.12em; margin:0 0 0.1rem 0.2rem;
        }
        .pnm-tut-btn, .pnm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
          padding:0.7rem 1rem; background:transparent;
          border-radius:10px; font-size:0.87rem; font-weight:700;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          text-decoration:none;
        }
        .pnm-tut-btn:hover, .pnm-back-btn:hover { filter:brightness(0.85); }
        .pnm-nick-chip {
          background:transparent; border-radius:999px;
          padding:0.45rem 0.9rem; font-size:0.76rem; font-weight:600;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          align-self:center;
        }
        .pnm-nick-chip:hover { filter:brightness(0.85); }

        /* ════════ DESKTOP (≥760px) ════════ */
        @media (min-width: 760px) {
          .pnm-mobile  { display:none; }
          .pnm-desktop {
            display:flex; flex-direction:row;
            height:100%; overflow:hidden;
            max-width:900px; margin:0 auto; width:100%;
          }
          .pnm-root { display:flex; align-items:stretch; justify-content:center; }
          .pnm-desktop-left {
            width:340px; flex-shrink:0;
            background:linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:1.1rem; padding:2.5rem 2rem; overflow:hidden;
          }
          .pnm-desktop-left .pnm-logo-wrap { padding:14px; border-radius:22px; width:110px; height:110px; }
          .pnm-desktop-left .pnm-logo-mark { font-size:3rem; }
          .pnm-desktop-left .pnm-title     { font-size:3rem; }
          .pnm-desktop-left .pnm-stats-card { width:100%; }

          .pnm-desktop-right {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem 2rem;
            overflow-y:auto; justify-content:center;
          }
          .pnm-desktop-right .pnm-section-label { margin-bottom:0.2rem; }
        }
      `}</style>
    </div>
  );
}
