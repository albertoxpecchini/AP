import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, MapPin, Target, ListOrdered, MoreHorizontal, X } from "lucide-react";
import { fetchPlayerScore } from "./leaderboardApi";

// I cinque livelli regolano quante città devi indovinare e quanti tentativi hai
// per ciascuna. Più sali, più città e meno tentativi: la sfida cresce.
export type LevelMode = 1 | 2 | 3 | 4 | 5;

interface Mode {
  level: LevelMode;
  key: string;       // id stabile per la classifica (mode)
  name: string;
  desc: string;
  tag: string;
  color: string;
  rounds: number;    // città da indovinare
  attempts: number;  // tentativi per città
}

export const MODES: Mode[] = [
  { level: 1, key: "esploratore", name: "Esploratore", desc: "3 città, 6 tentativi ciascuna. Per iniziare.",          tag: "Consigliato", color: "#9b5cf6", rounds: 3, attempts: 6 },
  { level: 2, key: "viaggiatore", name: "Viaggiatore", desc: "4 città, 5 tentativi. Il ritmo classico.",              tag: "Classico",    color: "#7c3aed", rounds: 4, attempts: 5 },
  { level: 3, key: "navigatore",  name: "Navigatore",  desc: "5 città, 4 tentativi. La sfida cresce.",                tag: "Sfida",       color: "#6024c4", rounds: 5, attempts: 4 },
  { level: 4, key: "pilota",      name: "Pilota",      desc: "6 città, 3 tentativi. Occhio allenato.",                tag: "Difficile",   color: "#5b21b6", rounds: 6, attempts: 3 },
  { level: 5, key: "esploratore-globale", name: "Cartografo", desc: "7 città, appena 2 tentativi. Il limite.",       tag: "Estremo",     color: "#4c1d95", rounds: 7, attempts: 2 },
];

const MAPPA_VERSION = "1.0";

// Spezza un titolo in "righe" per le tile: le parole brevi/connettori (di, e,
// del...) NON vanno mai da sole su una riga, restano agganciate alla vicina.
const CONNETTORI = new Set(["di","e","in","a","il","la","lo","le","i","gli","del","della","dei","delle","dello","al","alla","con","su","da","per","o","ed"]);
function titoloInRighe(titolo: string): string[] {
  const parole = titolo.split(/\s+/).filter(Boolean);
  const righe: string[] = [];
  for (let i = 0; i < parole.length; i++) {
    const p = parole[i];
    const breve = p.length <= 3 || CONNETTORI.has(p.toLowerCase());
    if (breve && righe.length) righe[righe.length - 1] += " " + p;
    else if (breve && i + 1 < parole.length) { righe.push(p + " " + parole[i + 1]); i++; }
    else righe.push(p);
  }
  return righe;
}

interface MappaMenuProps {
  dark: boolean;
  bestStreak: number;
  trophiesCount: number;
  nick?: string;
  onPlay: (level: LevelMode) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
  onChangeNick: () => void;
}

export default function MappaMenu({ dark, bestStreak, trophiesCount, nick, onPlay, onTutorial, onLeaderboard, onChangeNick }: MappaMenuProps) {
  // Livello selezionato (single-select, parte dal primo).
  const [selected, setSelected] = useState<LevelMode>(1);
  const selectedMode = MODES.find(m => m.level === selected)!;
  // Drawer "Altro" su mobile (azioni secondarie dopo Gioca).
  const [moreOpen, setMoreOpen] = useState(false);

  // Punteggio totale del giocatore → badge nel tasto profilo.
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  useEffect(() => {
    if (!nick) { setPlayerScore(null); return; }
    let alive = true;
    fetchPlayerScore(nick, MODES.map(m => m.key))
      .then(s => { if (alive) setPlayerScore(s); })
      .catch(() => { if (alive) setPlayerScore(0); });
    return () => { alive = false; };
  }, [nick]);
  const fmtScore = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : `${n}`;

  // ── Fit-to-box "a parole" (stile Bolt, copiato da Trivia): ogni PAROLA del
  //    nome del livello su una riga propria, MAI tagliata, dimensione indipendente
  //    fino a riempire la larghezza della tile; poi scala in blocco sull'altezza. ──
  const gridWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fitAll = () => {
      const root = gridWrapRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".mpm-tile-titlebox").forEach(box => {
        const words = Array.from(box.querySelectorAll<HTMLElement>(".mpm-word"));
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

  // Desktop: "torcia" del mouse — scrive la posizione del cursore (in %) nelle
  // CSS var --mx/--my della tile sotto al puntatore.
  const handleTileMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const bg       = dark ? "#0e0a16" : "#f4f6f5";
  const card     = dark ? "#1a1230" : "#ffffff";
  const bord     = dark ? "rgba(155,92,246,0.24)" : "rgba(124,58,237,0.16)";
  const val      = dark ? "#e7def7" : "#17271d";
  const lbl      = dark ? "#b6a9cf" : "#6b6080";
  const note     = dark ? "#6a5d86" : "#9a90ab";
  const textMain = dark ? "#e7def7" : "#17271d";

  // Viola del menù — accento di tutto ciò che non è una tile-livello.
  const vio   = dark ? "#c4a5ff" : "#6d28d9";
  const vBord = dark ? "rgba(155,92,246,0.34)" : "rgba(124,58,237,0.28)";

  // ── Griglia di tile quadrate "booking card": una tile per livello ──
  const ModeList = (
    <div>
      <p className="mpm-section-label" style={{ color: vio }}>
        <span className="mpm-step" style={{ background: vio }}>1</span>Scegli la difficoltà
      </p>
      <div className="mpm-grid" data-tour="chapters">
        {MODES.map((m) => {
          const on = selected === m.level;
          return (
            <button
              key={m.level}
              type="button"
              onClick={() => setSelected(m.level)}
              onMouseMove={handleTileMove}
              className={`mpm-tile${on ? " is-on" : ""}`}
              title={m.desc}
            >
              <span className="mpm-tile-bg" aria-hidden><GlobeGlyph size={130} /></span>
              <span className="mpm-tile-spot" aria-hidden />
              <span className="mpm-tile-glow" aria-hidden />
              <span className="mpm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="mpm-tile-ring">
                <span className="mpm-roundbadge" title={`${m.rounds} città · ${m.attempts} tentativi`}>
                  <MapPin size={11} strokeWidth={2.6} />
                  <span className="mpm-roundbadge-v">{m.rounds}×{m.attempts}</span>
                </span>
              </span>
              <span className="mpm-tile-mark" aria-hidden><GlobeGlyph size={28} /></span>
              <span className="mpm-tile-titlebox">
                {titoloInRighe(m.name).map((riga, i) => (
                  <span className="mpm-word" key={i}>{riga}</span>
                ))}
              </span>
              <span className="mpm-tile-tag">{m.tag}</span>
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
        <span className="mpm-step" style={{ background: "rgba(255,255,255,0.22)", color: "#fff", width: 26, height: 26, fontSize: "0.9rem" }}>2</span>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>Gioca</div>
          <div style={{ fontSize: "0.74rem", opacity: 0.9, marginTop: "0.1rem" }}>{selectedMode.name} · {selectedMode.rounds} città</div>
        </div>
      </div>
      <ChevronRight size={22} />
    </button>
  );

  // Icona-tasto giocatore: pastiglia con badge punteggio + nome. Tap = cambia nome.
  const PlayerIcon = (onDark: boolean) => nick ? (
    <button type="button" onClick={onChangeNick} data-tour="player" className={`mpm-player${onDark ? " on-dark" : ""}`} title={`${nick} · tocca per cambiare`}>
      <span className="mpm-player-badge">{playerScore === null ? "…" : fmtScore(playerScore)}</span>
      <span className="mpm-player-name">{nick}</span>
    </button>
  ) : null;

  // Azioni secondarie (dopo Gioca): classifica + "Come si gioca" + torna ai progetti.
  const SecondaryActions = () => (
    <>
      <button type="button" onClick={onLeaderboard} data-tour="leaderboard" className="mpm-tut-btn mpm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
        <ListOrdered size={18} /> Classifica live
      </button>
      <button type="button" onClick={onTutorial} data-tour="tutorial" className="mpm-tut-btn mpm-tut-cta">
        <BookOpen size={19} strokeWidth={2.4} /> Come si gioca
      </button>
      <Link to="/#progetti" className="mpm-back-btn mpm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
        <ArrowLeft size={18} /> Torna ai progetti
      </Link>
    </>
  );

  const StatsCard = (forceDark: boolean) => {
    const c = forceDark ? "#fff" : val;
    const l = forceDark ? "rgba(255,255,255,0.6)" : lbl;
    const ic = forceDark ? "#c4a5ff" : vio;
    return (
      <div className={`mpm-stats-card${forceDark ? " mpm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${vBord}` }}>
        <div className="mpm-stat"><Flame size={20} style={{ color: ic }} /><span className="mpm-stat-val" style={{ color: c }}>{bestStreak}</span><span className="mpm-stat-lbl" style={{ color: l }}>Miglior streak</span></div>
        <div className="mpm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="mpm-stat"><Trophy size={20} style={{ color: ic }} /><span className="mpm-stat-val" style={{ color: c }}>{trophiesCount}</span><span className="mpm-stat-lbl" style={{ color: l }}>Trofei</span></div>
        <div className="mpm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="mpm-stat"><Target size={20} style={{ color: ic }} /><span className="mpm-stat-val" style={{ color: c }}>5</span><span className="mpm-stat-lbl" style={{ color: l }}>Livelli</span></div>
      </div>
    );
  };

  return (
    <div className="mpm-root" ref={gridWrapRef}>
      {/* ════════ MOBILE ════════ */}
      <div className="mpm-mobile">
        <div className="mpm-hero">
          <div className="mpm-logo-wrap"><MappaMark size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="mpm-title">MAP<span className="mpm-accent">PA</span></h1>
            <p className="mpm-tagline">Riconosci la città dal satellite</p>
          </div>
          <p className="mpm-kicker">Versione {MAPPA_VERSION}</p>
        </div>
        <div className="mpm-body">
          {StatsCard(false)}
          {ModeList}
          {PlayBtn}
          <button type="button" className="mpm-more-toggle mpm-vio-btn" onClick={() => setMoreOpen(true)} style={{ color: vio, border: `1.5px solid ${vBord}` }}>
            <MoreHorizontal size={18} /> Altro
          </button>
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Vista satellitare reale · meno tentativi, più punti</p>
        </div>

        {moreOpen && (
          <div className="mpm-drawer-back" onClick={() => setMoreOpen(false)}>
            <div className="mpm-drawer" onClick={e => e.stopPropagation()}>
              <div className="mpm-drawer-head">
                {PlayerIcon(true) ?? <span>Altro</span>}
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Chiudi" className="mpm-drawer-x"><X size={20} /></button>
              </div>
              <div className="mpm-actions mpm-actions-dark">{SecondaryActions()}</div>
            </div>
          </div>
        )}
      </div>

      {/* ════════ DESKTOP — tre colonne (vetrina | gioco | funzioni) ════════ */}
      <div className="mpm-desktop">
        {/* ── Vetrina sinistra ── */}
        <div className="mpm-desktop-left">
          <div className="mpm-logo-wrap"><MappaMark size={54} /></div>
          <h1 className="mpm-title">MAP<span className="mpm-accent">PA</span></h1>
          <p className="mpm-tagline">Riconosci la città dal satellite</p>
          {StatsCard(true)}
          <p className="mpm-kicker" style={{ position: "static", opacity: 1 }}>Versione {MAPPA_VERSION} · gioco gratuito</p>
        </div>

        {/* ── Centro: il gioco ── */}
        <div className="mpm-desktop-center" style={{ background: bg }}>
          {ModeList}
          {PlayBtn}
        </div>

        {/* ── Rail destro: funzioni (speculare alla vetrina) ── */}
        <div className="mpm-desktop-right">
          <p className="mpm-rail-label">Funzioni</p>
          <div className="mpm-actions mpm-actions-dark">{SecondaryActions()}</div>
          <div className="mpm-rail-spacer" />
          <p className="mpm-rail-label">Il tuo profilo</p>
          <div className="mpm-player-slot">{PlayerIcon(true)}</div>
        </div>
      </div>

      <style>{`
        .mpm-root {
          /* VIOLA = accento del menù · VERDE = secondario (come Trivia) */
          --pv:#7c3aed; --pv2:#6024c4; --pv3:#9b5cf6;
          --pv-ink:${dark ? "#c4a5ff" : "#6d28d9"};
          --gv:#2F7D4A; --gv3:#3a9e5f;
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: mpm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes mpm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .mpm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .mpm-desktop { display:none; }

        .mpm-hero {
          background: linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .mpm-hero::before, .mpm-hero::after {
          content:""; position:absolute; width:60%; height:70%; border-radius:50%;
          filter:blur(50px); opacity:0.55; pointer-events:none; z-index:0;
        }
        .mpm-hero::before { background:#8b7bff; top:-25%; left:-15%; }
        .mpm-hero::after  { background:#6d4dff; bottom:-30%; right:-15%; opacity:0.4; }
        .mpm-hero > * { position:relative; z-index:1; }
        .mpm-logo-wrap {
          background:#fff; color:#6024c4; border-radius:18px; padding:14px;
          box-shadow:0 8px 32px rgba(91,33,182,0.4); display:inline-flex;
        }
        .mpm-title {
          font-size:clamp(2rem,9vw,3.4rem); font-weight:900;
          letter-spacing:0.14em; margin:0; line-height:1; color:#fff;
        }
        .mpm-accent { color:#b794ff; }
        .mpm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0; font-weight:500; text-align:center; }
        .mpm-kicker {
          position:absolute; bottom:0.7rem; left:1.4rem;
          font-size:0.63rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.16em; color:rgba(255,255,255,0.28); margin:0;
        }

        .mpm-body { padding:1.1rem 1.1rem 2rem; display:flex; flex-direction:column; gap:0.9rem; }

        .mpm-stats-card {
          display:flex; align-items:stretch;
          border-radius:13px; padding:0.85rem 1.1rem;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
        }
        .mpm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); }
        .mpm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .mpm-stat-val { font-size:1.4rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .mpm-stat-lbl { font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .mpm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .mpm-section-label {
          font-size:0.72rem; font-weight:800; text-transform:uppercase;
          letter-spacing:0.1em; margin:0 0 0.4rem 0.1rem;
          display:flex; align-items:center; gap:0.5rem;
        }
        .mpm-step {
          display:inline-flex; align-items:center; justify-content:center;
          width:20px; height:20px; border-radius:999px; flex-shrink:0;
          color:#fff; font-size:0.72rem; font-weight:900; line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        }

        .mpm-actions { display:flex; flex-direction:column; gap:0.55rem; width:100%; }
        .mpm-actions-dark .mpm-tut-btn, .mpm-actions-dark .mpm-back-btn {
          background:rgba(255,255,255,0.10); color:#fff !important; border:1px solid rgba(255,255,255,0.16) !important;
        }
        .mpm-actions-dark .mpm-tut-btn:hover, .mpm-actions-dark .mpm-back-btn:hover { background:rgba(255,255,255,0.18); }
        .mpm-actions-dark .mpm-tut-btn svg, .mpm-actions-dark .mpm-back-btn svg { color:#c4a5ff; }

        .mpm-tut-btn, .mpm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;
          width:100%;
          padding:0.95rem 1rem; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          border-radius:13px; font-size:1rem; font-weight:800;
          cursor:pointer; font-family:inherit; transition:filter .15s, transform .12s, background .15s;
          text-decoration:none;
        }
        .mpm-vio-btn svg { width:18px; height:18px; }
        .mpm-tut-btn:hover, .mpm-back-btn:hover {
          background:${dark ? "rgba(155,92,246,0.18)" : "rgba(124,58,237,0.11)"};
          transform:translateY(-1px);
        }
        .mpm-tut-cta {
          background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important;
          color:#fff !important; border:none !important;
          font-size:1.05rem !important; font-weight:900 !important; letter-spacing:0.01em;
          box-shadow:0 6px 22px rgba(91,33,182,0.45);
          position:relative; overflow:hidden;
          animation:mpm-cta-breathe 2.8s ease-in-out infinite;
        }
        .mpm-tut-cta svg { color:#fff; width:19px; height:19px; }
        .mpm-tut-cta::after {
          content:""; position:absolute; top:0; left:-60%; width:45%; height:100%;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent);
          transform:skewX(-18deg); animation:mpm-cta-shine 3.4s ease-in-out infinite;
        }
        .mpm-tut-cta:hover { transform:translateY(-2px); filter:brightness(1.07); box-shadow:0 10px 30px rgba(91,33,182,0.55); background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important; }
        @keyframes mpm-cta-breathe { 0%,100%{box-shadow:0 6px 22px rgba(91,33,182,0.4);} 50%{box-shadow:0 8px 30px rgba(124,58,237,0.65);} }
        @keyframes mpm-cta-shine { 0%,55%{left:-60%;} 100%{left:130%;} }
        @media (prefers-reduced-motion: reduce) {
          .mpm-tut-cta, .mpm-tut-cta::after { animation:none; }
        }

        /* toggle "Altro" (mobile) */
        .mpm-more-toggle {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; width:100%;
          padding:0.85rem 1rem; border-radius:13px; font-size:0.95rem; font-weight:800;
          background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          cursor:pointer; font-family:inherit; transition:background .15s;
        }
        /* drawer mobile */
        .mpm-drawer-back { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,0.5); display:flex; align-items:flex-end; animation:mpm-fade .2s ease; }
        @keyframes mpm-fade { from{opacity:0;} to{opacity:1;} }
        .mpm-drawer {
          width:100%; background:linear-gradient(160deg,#1a0b2e 0%,#2a1150 60%,#103820 130%);
          border-radius:20px 20px 0 0; padding:1.1rem 1.1rem calc(1.6rem + env(safe-area-inset-bottom));
          box-shadow:0 -10px 40px rgba(0,0,0,0.4); animation:mpm-up .25s cubic-bezier(.2,.8,.3,1);
          max-height:88dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain;
        }
        @keyframes mpm-up { from{transform:translateY(100%);} to{transform:none;} }
        .mpm-drawer-head { display:flex; align-items:center; justify-content:space-between; color:#fff; font-weight:800; font-size:1.05rem; margin-bottom:0.9rem; padding:0 0.2rem; }
        .mpm-drawer-x { background:rgba(255,255,255,0.12); border:none; color:#fff; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; }

        /* icona-tasto giocatore: badge punteggio + nome */
        .mpm-player-slot { display:flex; justify-content:center; }
        .mpm-player {
          display:inline-flex; align-items:center; gap:0.6rem;
          padding:0.4rem 0.95rem 0.4rem 0.4rem; border-radius:999px; cursor:pointer;
          border:1.5px solid ${vBord}; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          font-family:inherit; transition:transform .12s, background .15s, box-shadow .15s;
        }
        .mpm-player:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(124,58,237,0.25); }
        .mpm-player:active { transform:scale(0.97); }
        .mpm-player-badge {
          display:inline-flex; align-items:center; justify-content:center;
          min-width:38px; height:38px; padding:0 0.4rem; border-radius:999px;
          background:linear-gradient(140deg,#7c3aed,#5b21b6); color:#fff;
          font-size:0.92rem; font-weight:900; line-height:1; letter-spacing:-0.02em;
          font-variant-numeric:tabular-nums; box-shadow:0 3px 10px rgba(91,33,182,0.4);
        }
        .mpm-player-name { font-size:0.92rem; font-weight:800; color:${vio}; letter-spacing:0.01em; padding-right:0.2rem; }
        .mpm-player.on-dark { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.08); }
        .mpm-player.on-dark .mpm-player-name { color:#fff; }

        /* ═══════ Tile livelli stile "booking card" (copiata da Trivia) ═══════ */
        .mpm-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0.55rem;
          margin-top:0.5rem;
        }

        .mpm-tile {
          --gv:#7c3aed; --gv2:#6024c4; --gv3:#9b5cf6;
          --spot:${dark ? "rgba(196,165,255,0.32)" : "rgba(124,58,237,0.26)"};
          position:relative; isolation:isolate;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          aspect-ratio:1/1; min-height:0;
          padding:2.3rem 0.7rem 0.7rem;
          border:1px solid ${bord};
          border-radius:18px; cursor:pointer; font-family:inherit; text-align:left;
          overflow:hidden;
          background:
            radial-gradient(120% 90% at 100% 0%, ${dark ? "rgba(155,92,246,0.18)" : "rgba(124,58,237,0.10)"} 0%, transparent 55%),
            linear-gradient(160deg, ${card} 0%, ${dark ? "#1c1430" : "#f6f2fe"} 100%);
          box-shadow:0 2px 6px rgba(0,0,0,0.05);
          transition:transform .12s cubic-bezier(.2,.7,.3,1.25), border-color .1s, box-shadow .12s, background .12s;
        }

        .mpm-tile::before {
          content:""; position:absolute; inset:0; z-index:-2;
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 45%, var(--gv2) 100%);
          opacity:0; transition:opacity .14s ease;
        }
        .mpm-tile-spot {
          position:absolute; inset:0; z-index:-1; pointer-events:none;
          border-radius:inherit; opacity:0; transition:opacity .25s ease;
          background:radial-gradient(circle 70px at var(--mx,50%) var(--my,50%),
            var(--spot) 0%, transparent 70%);
        }
        @media (hover: hover) {
          .mpm-tile:hover .mpm-tile-spot { opacity:1; }
        }
        .mpm-tile-glow {
          position:absolute; inset:-40%; z-index:-1; pointer-events:none;
          background:radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%);
          opacity:0; transform:translate(-30%,30%) scale(0.6);
          transition:opacity .14s, transform .25s ease;
        }
        @media (hover: hover) {
          .mpm-tile:hover {
            transform:translateY(-4px);
            border-color:var(--gv);
            box-shadow:0 14px 30px ${dark ? "rgba(0,0,0,0.5)" : "rgba(91,33,182,0.30)"};
          }
          .mpm-tile:hover::before { opacity:1; }
          .mpm-tile:hover .mpm-tile-glow { opacity:1; transform:translate(0,0) scale(1); }
          .mpm-tile:hover .mpm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
          .mpm-tile:hover .mpm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
          .mpm-tile:hover .mpm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
          .mpm-tile:hover .mpm-tile-tag { color:#fff; background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.45); }
        }
        .mpm-tile:active { transform:translateY(-1px) scale(0.97); border-color:var(--gv); }

        .mpm-tile.is-on::before { opacity:1; }
        .mpm-tile.is-on {
          border-color:var(--gv3);
          box-shadow:0 0 0 2px var(--gv3), 0 14px 30px ${dark ? "rgba(0,0,0,0.55)" : "rgba(91,33,182,0.35)"};
        }
        .mpm-tile.is-on .mpm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        .mpm-tile.is-on .mpm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
        .mpm-tile.is-on .mpm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        .mpm-tile.is-on .mpm-tile-tag { color:#fff; background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.45); }

        .mpm-tile-mark {
          position:absolute; top:8px; left:9px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          color:var(--gv); opacity:0.6;
          transition:transform .15s cubic-bezier(.2,.7,.3,1.5), color .12s, opacity .12s;
        }
        .mpm-tile-mark svg { width:28px; height:28px; }

        .mpm-tile-bg {
          position:absolute; right:-14px; bottom:-18px; z-index:-1; pointer-events:none;
          color:var(--gv); opacity:0.16;
          transition:opacity .14s, color .12s, transform .15s;
        }
        .mpm-tile-bg svg { width:130px; height:130px; }

        .mpm-tile-titlebox {
          position:relative; z-index:1; flex:1 1 auto; width:100%;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          min-height:0; overflow:hidden; gap:0.02em;
        }
        .mpm-word {
          display:block; white-space:nowrap;
          font-size:1.4rem; /* fallback; il JS sovrascrive inline */
          font-weight:900; line-height:0.92;
          letter-spacing:-0.03em;
          color:${textMain};
          transition:color .12s;
          text-shadow:0 1px 0 rgba(255,255,255,0.04);
        }
        .mpm-tile-tag {
          position:relative; z-index:1; margin-top:0.3rem;
          font-size:0.56rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em;
          padding:0.12rem 0.45rem; border-radius:999px;
          color:${vio}; background:${dark ? "rgba(155,92,246,0.14)" : "rgba(124,58,237,0.10)"};
          border:1px solid ${vBord};
          transition:color .12s, background .12s, border-color .12s;
        }

        .mpm-tile-ring { position:absolute; top:6px; right:6px; z-index:2; }
        .mpm-roundbadge {
          display:inline-flex; align-items:center; gap:0.15rem;
          padding:0.12rem 0.42rem 0.12rem 0.34rem; border-radius:999px;
          border:1.5px solid var(--gv); color:var(--gv);
          background:rgba(255,255,255,0.92);
          line-height:1; font-variant-numeric:tabular-nums;
          box-shadow:0 2px 7px rgba(0,0,0,0.16);
          backdrop-filter:blur(2px);
        }
        .mpm-roundbadge-v { font-size:0.72rem; font-weight:900; letter-spacing:-0.02em; }
        .mpm-tile.is-on .mpm-roundbadge {
          color:#fff; border-color:rgba(255,255,255,0.55);
          background:rgba(255,255,255,0.18); box-shadow:none;
        }
        @media (hover: hover) {
          .mpm-tile:hover .mpm-roundbadge {
            color:#fff; border-color:rgba(255,255,255,0.55);
            background:rgba(255,255,255,0.18); box-shadow:none;
          }
        }

        .mpm-tile-check {
          position:absolute; bottom:8px; right:8px; z-index:2;
          width:22px; height:22px; border-radius:8px;
          background:#fff; color:var(--gv);
          display:flex; align-items:center; justify-content:center;
          transform:scale(0) rotate(-30deg); opacity:0;
          transition:transform .26s cubic-bezier(.2,.9,.3,1.6), opacity .2s;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
        }
        .mpm-tile-check svg path { stroke:var(--gv); }
        .mpm-tile.is-on .mpm-tile-check { transform:scale(1) rotate(0); opacity:1; }

        /* ════════ DESKTOP: tre colonne (vetrina | gioco | funzioni) ════════ */
        @media (min-width: 760px) {
          .mpm-mobile  { display:none; }
          .mpm-root { display:flex; align-items:stretch; justify-content:center; }
          .mpm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:1120px; margin:0 auto; width:100%;
          }

          .mpm-desktop-left, .mpm-desktop-right {
            flex-shrink:0;
            background:linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
            display:flex; flex-direction:column; overflow:hidden; position:relative;
          }
          .mpm-desktop-left::before, .mpm-desktop-right::before {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.4; pointer-events:none;
            background:#8b7bff; top:-10%; left:-20%;
          }
          .mpm-desktop-left::after, .mpm-desktop-right::after {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.3; pointer-events:none;
            background:#6d4dff; bottom:-12%; right:-20%;
          }
          .mpm-desktop-left > *, .mpm-desktop-right > * { position:relative; z-index:1; }

          .mpm-desktop-left {
            width:330px;
            align-items:center; justify-content:center; gap:1.5rem; padding:2rem;
          }
          .mpm-desktop-left .mpm-logo-wrap { padding:16px; border-radius:22px; }
          .mpm-desktop-left .mpm-logo-wrap svg { width:64px; height:64px; }
          .mpm-desktop-left .mpm-title { font-size:2.8rem; }
          .mpm-desktop-left .mpm-tagline { font-size:0.95rem; }
          .mpm-desktop-left .mpm-stats-card { width:100%; padding:1.1rem 1.2rem; background:rgba(255,255,255,0.06); }
          .mpm-desktop-left .mpm-stat-val { font-size:1.9rem; }
          .mpm-desktop-left .mpm-stat-lbl { font-size:0.62rem; }
          .mpm-desktop-left .mpm-stat svg { width:24px; height:24px; }

          .mpm-desktop-center {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem; justify-content:center;
            padding:2rem 1.8rem; overflow-y:auto;
          }
          .mpm-desktop-center .mpm-grid { grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); }

          .mpm-desktop-right {
            width:280px;
            justify-content:flex-start; gap:0.7rem; padding:2rem 1.5rem;
          }
          .mpm-desktop-right .mpm-actions { gap:0.6rem; }
          .mpm-rail-label {
            font-size:0.66rem; font-weight:800; text-transform:uppercase;
            letter-spacing:0.14em; color:rgba(255,255,255,0.45); margin:0 0 0.1rem 0.2rem;
          }
          .mpm-rail-spacer { flex:1; min-height:1rem; }
          .mpm-rail-note { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.62); line-height:1.4; padding:0 0.2rem; }
          .mpm-desktop-right .mpm-player-slot { justify-content:stretch; }
          .mpm-desktop-right .mpm-player { width:100%; justify-content:flex-start; }
        }

        @media (min-width:760px) and (max-height:820px) {
          .mpm-desktop-left { gap:1rem; padding:1.5rem; }
          .mpm-desktop-left .mpm-logo-wrap { padding:12px; border-radius:18px; }
          .mpm-desktop-left .mpm-logo-wrap svg { width:48px; height:48px; }
          .mpm-desktop-left .mpm-title { font-size:2.3rem; }
          .mpm-desktop-left .mpm-stat-val { font-size:1.5rem; }
          .mpm-desktop-left .mpm-kicker { display:none; }
          .mpm-desktop-right { padding:1.5rem 1.4rem; gap:0.5rem; }
        }
      `}</style>
    </div>
  );
}

// Marchio del gioco: un globo con meridiani e un pin di localizzazione, in
// palette viola (stile Trivia) con un tocco di verde.
export function MappaMark({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="34" fill="none" stroke="#7c3aed" strokeWidth="6" />
      <ellipse cx="50" cy="50" rx="14" ry="34" fill="none" stroke="#9b5cf6" strokeWidth="4" />
      <line x1="16" y1="50" x2="84" y2="50" stroke="#9b5cf6" strokeWidth="4" />
      <path d="M50 30c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#2F7D4A" stroke="#1F6B3D" strokeWidth="2" />
      <circle cx="50" cy="42" r="4" fill="#fff" />
    </svg>
  );
}

// Glyph "globo" da filigrana per le tile dei livelli.
function GlobeGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="6" />
      <ellipse cx="50" cy="50" rx="16" ry="38" fill="none" stroke="currentColor" strokeWidth="5" />
      <line x1="12" y1="50" x2="88" y2="50" stroke="currentColor" strokeWidth="5" />
      <path d="M22 32 Q50 44 78 32" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <path d="M22 68 Q50 56 78 68" fill="none" stroke="currentColor" strokeWidth="4.5" />
    </svg>
  );
}
