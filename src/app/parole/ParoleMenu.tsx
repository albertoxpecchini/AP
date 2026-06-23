import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, Clock, ChevronRight, ArrowLeft, ListOrdered, MoreHorizontal, X, Type } from "lucide-react";
import { type WordLength } from "./words";
import { fetchPlayerScore } from "./leaderboardApi";

// Una "modalità" di Parole = lunghezza parola + livello di aiuti.
export type ModeId = "5-normale" | "5-sfida" | "6-normale" | "6-sfida";

export interface ParoleMode {
  id: ModeId;
  length: WordLength;
  hints: number;
  name: string;
  desc: string;
  tag: string;
}

export const MODES: ParoleMode[] = [
  { id: "5-normale", length: 5, hints: 3, name: "Lessico Praticante",  desc: "5 lettere, 3 aiuti. Il classico per iniziare.",      tag: "Classico" },
  { id: "5-sfida",   length: 5, hints: 1, name: "Lessico Esperto",     desc: "5 lettere, 1 solo aiuto. La sfida vera.",          tag: "Sfida" },
  { id: "6-normale", length: 6, hints: 3, name: "Lessico Avanzato",    desc: "6 lettere, 3 aiuti. Parole più lunghe.",           tag: "Difficile" },
  { id: "6-sfida",   length: 6, hints: 0, name: "Maestro del Lessico", desc: "6 lettere, nessun aiuto. Solo per veri campioni.", tag: "Estremo" },
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

export default function ParoleMenu({
  dark, bestStrike, trophiesCount, bestTime, nick,
  onPlay, onTutorial, onLeaderboard, onChangeNick,
}: ParoleMenuProps) {
  const [selected, setSelected] = useState<ModeId>("5-normale");
  const [moreOpen, setMoreOpen] = useState(false);

  const [playerScore, setPlayerScore] = useState<number | null>(null);
  useEffect(() => {
    if (!nick) { setPlayerScore(null); return; }
    let alive = true;
    fetchPlayerScore(nick)
      .then(s => { if (alive) setPlayerScore(s); })
      .catch(() => { if (alive) setPlayerScore(0); });
    return () => { alive = false; };
  }, [nick]);
  const fmtScore = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : `${n}`;

  const gridWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fitAll = () => {
      const root = gridWrapRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".trm-tile-titlebox").forEach(box => {
        const words = Array.from(box.querySelectorAll<HTMLElement>(".trm-word"));
        if (!words.length) return;
        const maxW = box.clientWidth - 2;
        const maxH = box.clientHeight;
        if (maxW <= 0 || !maxH) return;
        words.forEach(w => {
          let lo = 9, hi = 56, best = 9;
          for (let i = 0; i < 10; i++) {
            const mid = (lo + hi) / 2;
            w.style.fontSize = mid + "px";
            if (w.scrollWidth <= maxW) { best = mid; lo = mid; } else hi = mid;
          }
          w.style.fontSize = Math.floor(best) + "px";
        });
        const totalH = box.scrollHeight;
        if (totalH > maxH) {
          const k = (maxH / totalH) * 0.99;
          words.forEach(w => { w.style.fontSize = Math.floor(parseFloat(w.style.fontSize) * k) + "px"; });
        }
      });
    };
    fitAll();
    window.addEventListener("resize", fitAll);
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(fitAll);
    return () => window.removeEventListener("resize", fitAll);
  });

  const handleTileMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const bg       = dark ? "#111916" : "#f4f6f5";
  const card     = dark ? "#1a2720" : "#ffffff";
  const bord     = dark ? "rgba(47,125,74,0.22)" : "rgba(47,125,74,0.15)";
  const lbl      = dark ? "#7ab893" : "#6b8070";
  const icon     = dark ? "#6fd08a" : "#2F7D4A";
  const note     = dark ? "#5a7a62" : "#8a9e91";
  const textMain = dark ? "#d4e8dc" : "#17271d";

  const vio  = dark ? "#c4a5ff" : "#6d28d9";
  const vBord = dark ? "rgba(155,92,246,0.34)" : "rgba(124,58,237,0.28)";

  const selectedMode = getMode(selected);

  const ModeList = (
    <div>
      <div className="trm-grid" data-tour="chapters">
        {MODES.map((m) => {
          const on = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              onMouseMove={handleTileMove}
              className={`trm-tile${on ? " is-on" : ""}`}
              title={m.desc}
            >
              <span className="trm-tile-bg" aria-hidden><Type size={130} /></span>
              <span className="trm-tile-spot" aria-hidden />
              <span className="trm-tile-glow" aria-hidden />
              <span className="trm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="trm-tile-ring">
                <span className="trm-progbadge" title={`${m.length} lettere · ${m.hints} aiuti`}>
                  <span className="trm-progbadge-seen">{m.length}</span>
                  <span className="trm-progbadge-tot">lett</span>
                </span>
              </span>
              <span className="trm-tile-mark" aria-hidden><Type size={28} /></span>
              <span className="trm-tile-titlebox">
                <span className="trm-word">{m.name.split(" ")[0]}</span>
                <span className="trm-word">{m.name.split(" ").slice(1).join(" ")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const PlayBtn = (
    <button
      type="button"
      onClick={() => onPlay(selected)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.95rem 1.3rem",
        background: "linear-gradient(100deg, #7c3aed 0%, #5b21b6 42%, #2F7D4A 100%)", color: "#fff",
        border: "none", borderRadius: "14px",
        fontSize: "0.98rem", fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
        boxShadow: "0 6px 24px rgba(91,33,182,0.4)",
        transition: "filter 0.12s, transform 0.12s",
        width: "100%",
      }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(0.9)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <span className="trm-step" style={{ background: "rgba(255,255,255,0.22)", color: "#fff", width: 26, height: 26, fontSize: "0.9rem" }}>2</span>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>Gioca</div>
          <div style={{ fontSize: "0.74rem", opacity: 0.9, marginTop: "0.1rem" }}>{selectedMode.name} · {selectedMode.length} lettere</div>
        </div>
      </div>
      <ChevronRight size={22} />
    </button>
  );

  const LbBtn = (
    <button type="button" onClick={onLeaderboard} data-tour="leaderboard" className="trm-tut-btn trm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
      <ListOrdered size={18} /> Classifica live
    </button>
  );

  const PlayerIcon = (onDark: boolean) => nick ? (
    <button type="button" onClick={onChangeNick} data-tour="player" className={`trm-player${onDark ? " on-dark" : ""}`} title={`${nick} · tocca per cambiare`}>
      <span className="trm-player-badge">{playerScore === null ? "…" : fmtScore(playerScore)}</span>
      <span className="trm-player-name">{nick}</span>
    </button>
  ) : null;

  const BackBtn = (
    <Link to="/#progetti" className="trm-back-btn trm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
      <ArrowLeft size={18} /> Torna ai progetti
    </Link>
  );

  const SecondaryActions = () => (
    <>
      {LbBtn}
      <button type="button" onClick={onTutorial} data-tour="tutorial" className="trm-tut-btn trm-tut-cta">
        <BookOpen size={19} strokeWidth={2.4} /> Come si gioca
      </button>
      {BackBtn}
    </>
  );

  const StatsCard = (forceDark: boolean) => {
    const c = forceDark ? "#fff" : textMain;
    const l = forceDark ? "rgba(255,255,255,0.6)" : lbl;
    const ic = forceDark ? "#c4a5ff" : vio;
    return (
      <div className={`trm-stats-card${forceDark ? " trm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${vBord}` }}>
        <div className="trm-stat"><Flame size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestStrike}</span><span className="trm-stat-lbl" style={{ color: l }}>Streak</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Trophy size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{trophiesCount}</span><span className="trm-stat-lbl" style={{ color: l }}>Trofei</span></div>
        <div className="trm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="trm-stat"><Clock size={20} style={{ color: ic }} /><span className="trm-stat-val" style={{ color: c }}>{bestTime != null ? fmtTime(bestTime) : "—"}</span><span className="trm-stat-lbl" style={{ color: l }}>Record</span></div>
      </div>
    );
  };

  return (
    <div className="trm-root" ref={gridWrapRef}>
      {/* ════════ MOBILE ════════ */}
      <div className="trm-mobile">
        <div className="trm-hero">
          <div className="trm-logo-wrap"><span className="trm-logo-mark">PE</span></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="trm-title">PAR<span className="trm-accent">OL</span>E</h1>
            <p className="trm-tagline">Lessico · indovina la parola e scala la classifica</p>
          </div>
          <p className="trm-kicker">Web Game · Lessico</p>
        </div>
        <div className="trm-body">
          {StatsCard(false)}
          <p className="trm-section-label" style={{ color: icon }}>
            <span className="trm-step" style={{ background: icon }}>1</span>Scegli la modalità
          </p>
          {ModeList}
          {PlayBtn}
          <button type="button" className="trm-more-toggle trm-vio-btn" onClick={() => setMoreOpen(true)} style={{ color: vio, border: `1.5px solid ${vBord}` }}>
            <MoreHorizontal size={18} /> Altro
          </button>
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>4 modalità · classifica live · trofei · streak</p>
        </div>

        {moreOpen && (
          <div className="trm-drawer-back" onClick={() => setMoreOpen(false)}>
            <div className="trm-drawer" onClick={e => e.stopPropagation()}>
              <div className="trm-drawer-head">
                {PlayerIcon(true) ?? <span>Altro</span>}
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Chiudi" className="trm-drawer-x"><X size={20} /></button>
              </div>
              <div className="trm-actions trm-actions-dark">{SecondaryActions()}</div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ DESKTOP — tre colonne ════════ */}
      <div className="trm-desktop">
        <div className="trm-desktop-left">
          <div className="trm-logo-wrap"><span className="trm-logo-mark">PE</span></div>
          <h1 className="trm-title">PAR<span className="trm-accent">OL</span>E</h1>
          <p className="trm-tagline">Indovina la parola nascosta</p>
          {StatsCard(true)}
          <p className="trm-kicker" style={{ position: "static", opacity: 1 }}>Web Game · gioco gratuito</p>
        </div>

        <div className="trm-desktop-center" style={{ background: bg }}>
          <p className="trm-section-label" style={{ color: icon }}>
            <span className="trm-step" style={{ background: icon }}>1</span>Scegli la modalità
          </p>
          {ModeList}
          {PlayBtn}
        </div>

        <div className="trm-desktop-right">
          <p className="trm-rail-label">Funzioni</p>
          <div className="trm-actions trm-actions-dark">{SecondaryActions()}</div>
          <div className="trm-rail-spacer" />
          <p className="trm-rail-label">Il tuo profilo</p>
          <div className="trm-player-slot">{PlayerIcon(true)}</div>
        </div>
      </div>

      <style>{`
        .trm-root {
          --pv:#7c3aed; --pv2:#6024c4; --pv3:#9b5cf6;
          --gv:#2F7D4A; --gv3:#3a9e5f;
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: trm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes trm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .trm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .trm-desktop { display:none; }

        .trm-hero {
          background: linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .trm-hero::before, .trm-hero::after {
          content:""; position:absolute; width:60%; height:70%; border-radius:50%;
          filter:blur(50px); opacity:0.55; pointer-events:none; z-index:0;
        }
        .trm-hero::before { background:#8b7bff; top:-25%; left:-15%; }
        .trm-hero::after  { background:#6d4dff; bottom:-30%; right:-15%; opacity:0.4; }
        .trm-hero > * { position:relative; z-index:1; }
        .trm-logo-wrap {
          background:#fff; color:#6024c4; border-radius:18px; padding:12px;
          box-shadow:0 8px 32px rgba(91,33,182,0.4); display:inline-flex;
          align-items:center; justify-content:center; width:min(86px,21vw); height:min(86px,21vw);
        }
        .trm-logo-mark { font-size:min(2.6rem,7vw); font-weight:900; letter-spacing:0.04em; color:#6024c4; line-height:1; }
        .trm-title {
          font-size:clamp(2.4rem,10vw,3.8rem); font-weight:900;
          letter-spacing:0.28em; margin:0; line-height:1; color:#fff;
        }
        .trm-accent { color:#b794ff; }
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
        .trm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; min-width:0; }
        .trm-stat-val { font-size:1.3rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .trm-stat-lbl { font-size:0.56rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .trm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .trm-section-label {
          font-size:0.72rem; font-weight:800; text-transform:uppercase;
          letter-spacing:0.1em; margin:0 0 0.4rem 0.1rem;
          display:flex; align-items:center; gap:0.5rem;
        }

        .trm-step {
          display:inline-flex; align-items:center; justify-content:center;
          width:20px; height:20px; border-radius:999px; flex-shrink:0;
          color:#fff; font-size:0.72rem; font-weight:900; line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        }

        .trm-actions { display:flex; flex-direction:column; gap:0.55rem; width:100%; }
        .trm-actions-dark .trm-tut-btn, .trm-actions-dark .trm-back-btn {
          background:rgba(255,255,255,0.10); color:#fff !important; border:1px solid rgba(255,255,255,0.16) !important;
        }
        .trm-actions-dark .trm-tut-btn:hover, .trm-actions-dark .trm-back-btn:hover { background:rgba(255,255,255,0.18); }
        .trm-actions-dark .trm-tut-btn svg, .trm-actions-dark .trm-back-btn svg { color:#c4a5ff; }

        .trm-more-toggle {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; width:100%;
          padding:0.85rem 1rem; border-radius:13px; font-size:0.95rem; font-weight:800;
          background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          cursor:pointer; font-family:inherit; transition:background .15s;
        }
        .trm-drawer-back { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.5); display:flex; align-items:flex-end; animation:trm-fade .2s ease; }
        @keyframes trm-fade { from{opacity:0;} to{opacity:1;} }
        .trm-drawer {
          width:100%; background:linear-gradient(160deg,#15101f 0%,#1a1430 60%,#0b0f14 130%);
          border-radius:20px 20px 0 0; padding:1.1rem 1.1rem calc(1.6rem + env(safe-area-inset-bottom));
          box-shadow:0 -10px 40px rgba(0,0,0,0.4); animation:trm-up .25s cubic-bezier(.2,.8,.3,1);
          max-height:88dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
        }
        @keyframes trm-up { from{transform:translateY(100%);} to{transform:none;} }
        .trm-drawer-head { display:flex; align-items:center; justify-content:space-between; color:#fff; font-weight:800; font-size:1.05rem; margin-bottom:0.9rem; padding:0 0.2rem; }
        .trm-drawer-x { background:rgba(255,255,255,0.12); border:none; color:#fff; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
        .trm-tut-btn, .trm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;
          width:100%;
          padding:0.95rem 1rem; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          border-radius:13px; font-size:1rem; font-weight:800;
          cursor:pointer; font-family:inherit; transition:filter .15s, transform .12s, background .15s;
          text-decoration:none;
        }
        .trm-vio-btn svg { width:18px; height:18px; }
        .trm-tut-btn:hover, .trm-back-btn:hover {
          background:${dark ? "rgba(155,92,246,0.18)" : "rgba(124,58,237,0.11)"};
          transform:translateY(-1px);
        }
        .trm-tut-cta {
          background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important;
          color:#fff !important; border:none !important;
          font-size:1.05rem !important; font-weight:900 !important; letter-spacing:0.01em;
          box-shadow:0 6px 22px rgba(91,33,182,0.45);
          position:relative; overflow:hidden;
          animation:trm-cta-breathe 2.8s ease-in-out infinite;
        }
        .trm-tut-cta svg { color:#fff; width:19px; height:19px; }
        .trm-tut-cta::after {
          content:""; position:absolute; top:0; left:-60%; width:45%; height:100%;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent);
          transform:skewX(-18deg); animation:trm-cta-shine 3.4s ease-in-out infinite;
        }
        .trm-tut-cta:hover { transform:translateY(-2px); filter:brightness(1.07); box-shadow:0 10px 30px rgba(91,33,182,0.55); background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important; }
        @keyframes trm-cta-breathe { 0%,100%{box-shadow:0 6px 22px rgba(91,33,182,0.4);} 50%{box-shadow:0 8px 30px rgba(124,58,237,0.65);} }
        @keyframes trm-cta-shine { 0%,55%{left:-60%;} 100%{left:130%;} }
        @media (prefers-reduced-motion: reduce) {
          .trm-tut-cta, .trm-tut-cta::after { animation:none; }
        }
        .trm-player-slot { display:flex; justify-content:center; }
        .trm-player {
          display:inline-flex; align-items:center; gap:0.6rem;
          padding:0.4rem 0.95rem 0.4rem 0.4rem; border-radius:999px; cursor:pointer;
          border:1.5px solid ${vBord}; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          font-family:inherit; transition:transform .12s, background .15s, box-shadow .15s;
        }
        .trm-player:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(124,58,237,0.25); }
        .trm-player:active { transform:scale(0.97); }
        .trm-player-badge {
          display:inline-flex; align-items:center; justify-content:center;
          min-width:38px; height:38px; padding:0 0.4rem; border-radius:999px;
          background:linear-gradient(140deg,#7c3aed,#5b21b6); color:#fff;
          font-size:0.92rem; font-weight:900; line-height:1; letter-spacing:-0.02em;
          font-variant-numeric:tabular-nums; box-shadow:0 3px 10px rgba(91,33,182,0.4);
        }
        .trm-player-name {
          font-size:0.92rem; font-weight:800; color:${vio};
          letter-spacing:0.01em; padding-right:0.2rem;
        }
        .trm-player.on-dark { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.08); }
        .trm-player.on-dark .trm-player-name { color:#fff; }

        /* ═══════ Tile (gemelle dei capitoli Trivia) ═══════ */
        .trm-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0.55rem;
          margin-top:0.5rem;
        }

        .trm-tile {
          --gv:#2F7D4A; --gv2:#1f6b3c; --gv3:#3a9e5f;
          position:relative; isolation:isolate;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          aspect-ratio:1/1; min-height:0;
          padding:2.3rem 0.7rem 0.7rem;
          border:1px solid ${bord};
          border-radius:18px; cursor:pointer; font-family:inherit; text-align:left;
          overflow:hidden;
          background:
            radial-gradient(120% 90% at 100% 0%, ${dark ? "rgba(58,158,95,0.18)" : "rgba(58,158,95,0.10)"} 0%, transparent 55%),
            linear-gradient(160deg, ${card} 0%, ${dark ? "#16241c" : "#f3faf5"} 100%);
          box-shadow:0 2px 6px rgba(0,0,0,0.05);
          transition:transform .12s cubic-bezier(.2,.7,.3,1.25), border-color .1s, box-shadow .12s, background .12s;
        }

        .trm-tile::before {
          content:""; position:absolute; inset:0; z-index:-2;
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 45%, var(--gv2) 100%);
          opacity:0; transition:opacity .14s ease;
        }
        .trm-tile-spot {
          position:absolute; inset:0; z-index:-1; pointer-events:none;
          border-radius:inherit; opacity:0; transition:opacity .25s ease;
          background:radial-gradient(circle 70px at var(--mx,50%) var(--my,50%),
            var(--spot, ${dark ? "rgba(111,224,166,0.30)" : "rgba(47,158,95,0.28)"}) 0%, transparent 70%);
        }
        @media (hover: hover) {
          .trm-tile:hover .trm-tile-spot { opacity:1; }
        }

        .trm-tile-glow {
          position:absolute; inset:-40%; z-index:-1; pointer-events:none;
          background:radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%);
          opacity:0; transform:translate(-30%,30%) scale(0.6);
          transition:opacity .14s, transform .25s ease;
        }

        @media (hover: hover) {
          .trm-tile:hover {
            transform:translateY(-4px);
            border-color:var(--gv);
            box-shadow:0 14px 30px ${dark ? "rgba(0,0,0,0.5)" : "rgba(31,107,60,0.30)"};
          }
          .trm-tile:hover::before { opacity:1; }
          .trm-tile:hover .trm-tile-glow { opacity:1; transform:translate(0,0) scale(1); }
          .trm-tile:hover .trm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
        }
        .trm-tile:active { transform:translateY(-1px) scale(0.97); border-color:var(--gv); }

        .trm-tile.is-on::before { opacity:1; }
        .trm-tile.is-on {
          border-color:var(--gv3);
          box-shadow:0 0 0 2px var(--gv3), 0 14px 30px ${dark ? "rgba(0,0,0,0.55)" : "rgba(31,107,60,0.35)"};
        }
        .trm-tile.is-on .trm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }

        .trm-tile-mark {
          position:absolute; top:8px; left:9px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          color:var(--gv); opacity:0.55;
          transition:transform .15s cubic-bezier(.2,.7,.3,1.5), color .12s, opacity .12s;
        }
        .trm-tile-mark svg { width:28px; height:28px; }

        .trm-tile-bg {
          position:absolute; right:-14px; bottom:-18px; z-index:-1; pointer-events:none;
          color:var(--gv); opacity:0.16;
          transition:opacity .14s, color .12s, transform .15s;
        }
        .trm-tile-bg svg { width:130px; height:130px; }
        .trm-tile.is-on .trm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        @media (hover: hover) {
          .trm-tile:hover .trm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        }

        .trm-tile-titlebox {
          position:relative; z-index:1; flex:1 1 auto; width:100%;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          min-height:0; overflow:hidden; gap:0.02em;
        }
        .trm-word {
          display:block; white-space:nowrap;
          font-size:1.4rem;
          font-weight:900; line-height:0.92;
          letter-spacing:-0.03em;
          color:${textMain};
          transition:color .12s;
          text-shadow:0 1px 0 rgba(255,255,255,0.04);
        }
        .trm-tile.is-on .trm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        @media (hover: hover) {
          .trm-tile:hover .trm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        }

        .trm-tile-ring { position:absolute; top:6px; right:6px; z-index:2; }
        .trm-progbadge {
          display:inline-flex; align-items:baseline; gap:0.06em;
          padding:0.12rem 0.42rem; border-radius:999px;
          border:1.5px solid currentColor; color:var(--gv);
          background:rgba(255,255,255,0.92);
          line-height:1; font-variant-numeric:tabular-nums;
          box-shadow:0 2px 7px rgba(0,0,0,0.16);
          backdrop-filter:blur(2px);
        }
        .trm-progbadge-seen { font-size:0.92rem; font-weight:900; letter-spacing:-0.03em; }
        .trm-progbadge-tot  { font-size:0.55rem; font-weight:800; opacity:0.72; }
        .trm-tile.is-on .trm-progbadge {
          color:#fff !important; border-color:rgba(255,255,255,0.55) !important;
          background:rgba(255,255,255,0.18) !important; box-shadow:none;
        }
        @media (hover: hover) {
          .trm-tile:hover .trm-progbadge {
            color:#fff !important; border-color:rgba(255,255,255,0.55) !important;
            background:rgba(255,255,255,0.18) !important; box-shadow:none;
          }
        }

        .trm-tile-check {
          position:absolute; bottom:8px; right:8px; z-index:2;
          width:22px; height:22px; border-radius:8px;
          background:#fff; color:var(--gv);
          display:flex; align-items:center; justify-content:center;
          transform:scale(0) rotate(-30deg); opacity:0;
          transition:transform .26s cubic-bezier(.2,.9,.3,1.6), opacity .2s;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
        }
        .trm-tile-check svg path { stroke:var(--gv); }
        .trm-tile.is-on .trm-tile-check { transform:scale(1) rotate(0); opacity:1; }

        /* ════════ DESKTOP: tre colonne (vetrina | gioco | funzioni) ════════ */
        @media (min-width: 760px) {
          .trm-mobile  { display:none; }
          .trm-root { display:flex; align-items:stretch; justify-content:center; }
          .trm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:1120px; margin:0 auto; width:100%;
          }

          .trm-desktop-left, .trm-desktop-right {
            flex-shrink:0;
            background:linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
            display:flex; flex-direction:column; overflow:hidden; position:relative;
          }
          .trm-desktop-left::before, .trm-desktop-right::before {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.4; pointer-events:none;
            background:#8b7bff; top:-10%; left:-20%;
          }
          .trm-desktop-left::after, .trm-desktop-right::after {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.3; pointer-events:none;
            background:#6d4dff; bottom:-12%; right:-20%;
          }
          .trm-desktop-left > *, .trm-desktop-right > * { position:relative; z-index:1; }

          .trm-desktop-left {
            width:330px;
            align-items:center; justify-content:center; gap:1.5rem; padding:2rem;
          }
          .trm-desktop-left .trm-logo-wrap { padding:14px; border-radius:22px; width:110px; height:110px; }
          .trm-desktop-left .trm-logo-mark { font-size:3rem; }
          .trm-desktop-left .trm-title { font-size:3.1rem; }
          .trm-desktop-left .trm-tagline { font-size:0.95rem; }
          .trm-desktop-left .trm-stats-card { width:100%; padding:1.1rem 1.2rem; background:rgba(255,255,255,0.06); }
          .trm-desktop-left .trm-stat-val { font-size:1.7rem; }
          .trm-desktop-left .trm-stat-lbl { font-size:0.6rem; }
          .trm-desktop-left .trm-stat svg { width:22px; height:22px; }

          .trm-desktop-center {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem;
            padding:2rem 1.8rem; overflow-y:auto;
          }
          .trm-desktop-center .trm-grid { grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); }

          .trm-desktop-right {
            width:280px;
            justify-content:flex-start; gap:0.7rem; padding:2rem 1.5rem;
          }
          .trm-desktop-right .trm-actions { gap:0.6rem; }
          .trm-rail-label {
            font-size:0.66rem; font-weight:800; text-transform:uppercase;
            letter-spacing:0.14em; color:rgba(255,255,255,0.45); margin:0 0 0.1rem 0.2rem;
          }
          .trm-rail-spacer { flex:1; min-height:1rem; }
          .trm-desktop-right .trm-player-slot { justify-content:stretch; }
          .trm-desktop-right .trm-player { width:100%; justify-content:flex-start; }
        }

        @media (min-width:760px) and (max-height:860px) {
          .trm-desktop-left { gap:0.95rem; padding:1.5rem; }
          .trm-desktop-left .trm-logo-wrap { padding:12px; border-radius:18px; width:88px; height:88px; }
          .trm-desktop-left .trm-logo-mark { font-size:2.4rem; }
          .trm-desktop-left .trm-title { font-size:2.5rem; letter-spacing:0.22em; }
          .trm-desktop-left .trm-tagline { font-size:0.82rem; }
          .trm-desktop-left .trm-stats-card { padding:0.8rem 1rem; }
          .trm-desktop-left .trm-stat-val { font-size:1.4rem; }
          .trm-desktop-left .trm-kicker { display:none; }
          .trm-desktop-right { padding:1.5rem 1.4rem; gap:0.5rem; }
          .trm-desktop-right .trm-actions { gap:0.45rem; }
          .trm-desktop-right .trm-tut-btn, .trm-desktop-right .trm-back-btn { padding:0.7rem 1rem; font-size:0.92rem; }
        }
      `}</style>
    </div>
  );
}
