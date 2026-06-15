import { useState } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, ListOrdered, Layers, GraduationCap } from "lucide-react";
import { CHAPTERS } from "./questions";
import { chapterCoveragePct } from "./coverage";

export type ChapterChoice = string | "all"; // id capitolo o "tutti"

// Lunghezza partita selezionabile.
export const LENGTHS = [5, 10, 15] as const;
export type GameLength = (typeof LENGTHS)[number];

interface TriviaMenuProps {
  dark: boolean;
  bestStreak: number;
  bestGrade: string;        // es. "A−" o "—"
  coverage: number;         // % totale db visto
  nick?: string;
  onPlay: (chapter: ChapterChoice, length: GameLength) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onChangeNick: () => void;
}

// Palette per i capitoli (ciclica): dà varietà colore alle card capitolo.
const CHAP_COLORS = ["#2F7D4A", "#3a7bbf", "#b5651d", "#8e44ad", "#c0392b", "#0e8a8a", "#c79a00"];
const colorForIdx = (i: number) => CHAP_COLORS[i % CHAP_COLORS.length];

export default function TriviaMenu({
  dark, bestStreak, bestGrade, coverage, nick,
  onPlay, onTutorial, onLeaderboard, onChangeNick,
}: TriviaMenuProps) {
  const [chapter, setChapter] = useState<ChapterChoice>("all");
  const [length, setLength] = useState<GameLength>(10);

  const bg       = dark ? "#111916" : "#f4f6f5";
  const card     = dark ? "#1a2720" : "#ffffff";
  const bord     = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const val      = dark ? "#d4e8dc" : "#17271d";
  const lbl      = dark ? "#7ab893" : "#6b8070";
  const icon     = dark ? "#6fd08a" : "#2F7D4A";
  const note     = dark ? "#5a7a62" : "#8a9e91";
  const textMain = dark ? "#d4e8dc" : "#17271d";
  const textSub  = dark ? "#a4c4aa" : "#4a5c50";

  const totalQuestions = CHAPTERS.reduce((s, c) => s + c.questions.length, 0);
  const selectedColor = chapter === "all" ? "#2F7D4A" : colorForIdx(CHAPTERS.findIndex(c => c.id === chapter));
  const selectedName =
    chapter === "all" ? "Tutti i capitoli" : (CHAPTERS.find(c => c.id === chapter)?.title ?? "Capitolo");

  // ── Card "Tutti i capitoli" + una per capitolo ──
  const ChapterList = (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {/* Tutti */}
      <ChapCard
        active={chapter === "all"}
        color="#2F7D4A"
        icon={<Layers size={20} />}
        title="Tutti i capitoli"
        subtitle={`Mix da tutti i ${CHAPTERS.length} capitoli · ${totalQuestions} domande`}
        cov={coverage}
        dark={dark} card={card} bord={bord} lbl={lbl} note={note} textMain={textMain} textSub={textSub}
        onClick={() => setChapter("all")}
      />
      {CHAPTERS.map((c, i) => (
        <ChapCard
          key={c.id}
          active={chapter === c.id}
          color={colorForIdx(i)}
          icon={<span style={{ fontWeight: 900, fontSize: "1rem" }}>{c.title.charAt(0).toUpperCase()}</span>}
          title={c.title}
          subtitle={`${c.questions.length} domande`}
          cov={chapterCoveragePct(c.id)}
          dark={dark} card={card} bord={bord} lbl={lbl} note={note} textMain={textMain} textSub={textSub}
          onClick={() => setChapter(c.id)}
        />
      ))}
    </div>
  );

  const LengthPicker = (
    <div>
      <p className="trm-section-label" style={{ color: lbl }}>Quante domande</p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {LENGTHS.map(n => {
          const on = length === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setLength(n)}
              style={{
                flex: 1, padding: "0.6rem 0", borderRadius: 12,
                border: `2px solid ${on ? selectedColor : bord}`,
                background: on ? `${selectedColor}1a` : card,
                color: on ? selectedColor : textMain,
                fontFamily: "inherit", fontWeight: 800, fontSize: "1rem", cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );

  const PlayBtn = (
    <button
      type="button"
      onClick={() => onPlay(chapter, length)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.95rem 1.3rem",
        background: selectedColor, color: "#fff",
        border: "none", borderRadius: "14px",
        fontSize: "0.98rem", fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: `0 6px 24px ${selectedColor}55`,
        transition: "filter 0.12s, transform 0.12s",
        width: "100%",
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
    >
      <div>
        <div style={{ fontSize: "0.98rem", fontWeight: 800 }}>Gioca</div>
        <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.1rem" }}>{selectedName} · {length} domande</div>
      </div>
      <ChevronRight size={20} />
    </button>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ListOrdered size={15} /> Classifica live
    </button>
  );

  const NickChip = nick ? (
    <button type="button" onClick={onChangeNick} className="trm-nick-chip" style={{ color: lbl, border: `1px solid ${bord}` }}>
      Giochi come <b style={{ color: textMain }}>{nick}</b> · cambia
    </button>
  ) : null;

  const BackBtn = (
    <Link to="/#progetti" className="trm-back-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
      <ArrowLeft size={15} /> Torna ai progetti
    </Link>
  );

  const StatsCard = (forceDark: boolean) => {
    const c = forceDark ? "#fff" : val;
    const l = forceDark ? "rgba(255,255,255,0.55)" : lbl;
    const ic = forceDark ? "#6fd08a" : icon;
    return (
      <div className={`trm-stats-card${forceDark ? " trm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${bord}` }}>
        <div className="trm-stat"><GraduationCap size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestGrade}</span><span className="trm-stat-lbl" style={{ color: l }}>Miglior voto</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Flame size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestStreak}</span><span className="trm-stat-lbl" style={{ color: l }}>Streak record</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Trophy size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{coverage}%</span><span className="trm-stat-lbl" style={{ color: l }}>Db esplorato</span></div>
      </div>
    );
  };

  return (
    <div className="trm-root">
      {/* ════════ MOBILE ════════ */}
      <div className="trm-mobile">
        <div className="trm-hero">
          <div className="trm-logo-wrap"><GraduationCap size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
            <p className="trm-tagline">Storia dell'Architettura · rispondi e scala la classifica</p>
          </div>
          <p className="trm-kicker">Web Game · Quiz</p>
        </div>
        <div className="trm-body">
          {StatsCard(false)}
          <p className="trm-section-label" style={{ color: lbl }}>Scegli il capitolo</p>
          {ChapterList}
          {LengthPicker}
          {PlayBtn}
          {LbBtn}
          <button type="button" onClick={onTutorial} className="trm-tut-btn" style={{ color: icon, border: `1.5px solid ${bord}` }}>
            <BookOpen size={15} /> Come si gioca
          </button>
          {NickChip}
          {BackBtn}
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Più rispondi giusto e veloce, più punti · classifica live</p>
        </div>
      </div>

      {/* ════════ DESKTOP ════════ */}
      <div className="trm-desktop">
        <div className="trm-desktop-left">
          <div className="trm-logo-wrap"><GraduationCap size={54} /></div>
          <h1 className="trm-title">TRI<span className="trm-accent">VI</span>A</h1>
          <p className="trm-tagline">Storia dell'Architettura</p>
          {StatsCard(true)}
          <p className="trm-kicker" style={{ position: "static", marginTop: "auto", opacity: 1 }}>Web Game · Quiz</p>
        </div>
        <div className="trm-desktop-right" style={{ background: bg }}>
          <p className="trm-section-label" style={{ color: lbl }}>Scegli il capitolo</p>
          {ChapterList}
          {LengthPicker}
          {PlayBtn}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ flex: 1 }}>{LbBtn}</div>
            <button type="button" onClick={onTutorial} className="trm-tut-btn" style={{ flex: 1, color: icon, border: `1.5px solid ${bord}` }}>
              <BookOpen size={15} /> Come si gioca
            </button>
          </div>
          {NickChip}
          {BackBtn}
        </div>
      </div>

      <style>{`
        .trm-root {
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: trm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes trm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .trm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .trm-desktop { display:none; }

        .trm-hero {
          background: linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .trm-logo-wrap {
          background:#fff; color:#1a5030; border-radius:18px; padding:14px;
          box-shadow:0 8px 32px rgba(0,0,0,0.28); display:inline-flex;
        }
        .trm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .trm-accent { color:#6fd08a; }
        .trm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0; font-weight:500; text-align:center; }
        .trm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        .trm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        .trm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .trm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); }
        .trm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .trm-stat-val { font-size:1.4rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .trm-stat-lbl { font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .trm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .trm-section-label {
          font-size:0.65rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.12em; margin:0 0 0.35rem 0.2rem;
        }
        .trm-tut-btn, .trm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.45rem;
          padding:0.7rem 1rem; background:transparent;
          border-radius:10px; font-size:0.87rem; font-weight:700;
          cursor:pointer; font-family:inherit; transition:filter 0.15s;
          text-decoration:none;
        }
        .trm-tut-btn:hover, .trm-back-btn:hover { filter:brightness(0.85); }
        .trm-nick-chip {
          background:transparent; border-radius:999px;
          padding:0.45rem 0.9rem; font-size:0.76rem; font-weight:600;
          cursor:pointer; font-family:inherit; transition:filter 0.15s; align-self:center;
        }
        .trm-nick-chip:hover { filter:brightness(0.85); }

        @media (min-width: 760px) {
          .trm-mobile  { display:none; }
          .trm-root { display:flex; align-items:stretch; justify-content:center; }
          .trm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:920px; margin:0 auto; width:100%;
          }
          .trm-desktop-left {
            width:340px; flex-shrink:0;
            background:linear-gradient(160deg,#0b2a18 0%,#103820 45%,#1a5030 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center;
            gap:1.1rem; padding:2.5rem 2rem; overflow:hidden;
          }
          .trm-desktop-left .trm-logo-wrap { padding:16px; border-radius:22px; }
          .trm-desktop-left .trm-title { font-size:3rem; }
          .trm-desktop-left .trm-stats-card { width:100%; }
          .trm-desktop-right {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem; overflow-y:auto; justify-content:center;
          }
        }
      `}</style>
    </div>
  );
}

// ── Card capitolo riusabile (mobile + desktop) ──
function ChapCard(props: {
  active: boolean; color: string; icon: React.ReactNode; title: string; subtitle: string; cov: number;
  dark: boolean; card: string; bord: string; lbl: string; note: string; textMain: string; textSub: string;
  onClick: () => void;
}) {
  const { active, color, icon, title, subtitle, cov, dark, card, bord, lbl, note, textMain, textSub, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.7rem 0.9rem",
        background: active ? `${color}${dark ? "26" : "14"}` : card,
        border: `2px solid ${active ? color : bord}`,
        borderRadius: "12px", cursor: "pointer", fontFamily: "inherit",
        textAlign: "left", width: "100%",
        transition: "border-color 0.15s, background 0.15s",
        boxShadow: active ? `0 2px 12px ${color}22` : "none",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: "10px", flexShrink: 0,
        background: active ? color : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
        color: active ? "#fff" : lbl,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.1rem" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: active ? color : textMain }}>{title}</span>
          {cov > 0 && (
            <span style={{
              fontSize: "0.56rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
              padding: "0.08rem 0.38rem", borderRadius: 999, flexShrink: 0,
              background: active ? `${color}22` : (dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"),
              color: active ? color : lbl,
            }}>{cov}% visto</span>
          )}
        </div>
        <p style={{ fontSize: "0.73rem", color: textSub, margin: 0, lineHeight: 1.3 }}>{subtitle}</p>
      </div>
      {active && (
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </div>
      )}
    </button>
  );
}
