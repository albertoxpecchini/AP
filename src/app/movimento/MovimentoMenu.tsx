import { useState, useRef, useLayoutEffect } from "react";
import { Link } from "react-router";
import { BookOpen, Trophy, Flame, ChevronRight, ArrowLeft, Gauge } from "lucide-react";

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

const MOVIMENTO_VERSION = "1.0";

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

interface MovimentoMenuProps {
  dark: boolean;
  bestStreak: number;
  trophiesCount: number;
  onPlay: (level: LevelMode) => void;
  onTutorial: () => void;
}

export default function MovimentoMenu({ dark, bestStreak, trophiesCount, onPlay, onTutorial }: MovimentoMenuProps) {
  // Livello selezionato (single-select, parte dal primo).
  const [selected, setSelected] = useState<LevelMode>(1);
  const selectedMode = MODES.find(m => m.level === selected)!;

  // ── Fit-to-box "a parole" (stile Bolt, copiato da Trivia): ogni PAROLA del
  //    nome del livello su una riga propria, MAI tagliata, dimensione indipendente
  //    fino a riempire la larghezza della tile; poi scala in blocco sull'altezza. ──
  const gridWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fitAll = () => {
      const root = gridWrapRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".mvm-tile-titlebox").forEach(box => {
        const words = Array.from(box.querySelectorAll<HTMLElement>(".mvm-word"));
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
  // CSS var --mx/--my della tile sotto al puntatore (vedi .mvm-tile-spot).
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
  const icon     = dark ? "#c4a5ff" : "#7c3aed";
  const note     = dark ? "#6a5d86" : "#9a90ab";
  const textMain = dark ? "#e7def7" : "#17271d";

  // Viola del menù — accento di tutto ciò che non è una tile-livello.
  const vio   = dark ? "#c4a5ff" : "#6d28d9";
  const vBord = dark ? "rgba(155,92,246,0.34)" : "rgba(124,58,237,0.28)";

  // ── Griglia di tile quadrate "booking card": una tile per livello ──
  const ModeList = (
    <div>
      <p className="mvm-section-label" style={{ color: vio }}>
        <span className="mvm-step" style={{ background: vio }}>1</span>Scegli la difficoltà
      </p>
      <div className="mvm-grid">
        {MODES.map((m) => {
          const on = selected === m.level;
          return (
            <button
              key={m.level}
              type="button"
              onClick={() => setSelected(m.level)}
              onMouseMove={handleTileMove}
              className={`mvm-tile${on ? " is-on" : ""}`}
              title={m.desc}
            >
              <span className="mvm-tile-bg" aria-hidden><LevelGlyph level={m.level} size={130} /></span>
              <span className="mvm-tile-spot" aria-hidden />
              <span className="mvm-tile-glow" aria-hidden />
              <span className="mvm-tile-check"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6.3l2.6 2.7L10 3.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg></span>
              <span className="mvm-tile-ring">
                <span className="mvm-watchbadge" title={`${m.watch} per memorizzare`}>
                  <Gauge size={11} strokeWidth={2.6} />
                  <span className="mvm-watchbadge-v">{m.watch}</span>
                </span>
              </span>
              <span className="mvm-tile-mark" aria-hidden><LevelGlyph level={m.level} /></span>
              <span className="mvm-tile-titlebox">
                {titoloInRighe(m.name).map((riga, i) => (
                  <span className="mvm-word" key={i}>{riga}</span>
                ))}
              </span>
              <span className="mvm-tile-tag">{m.tag}</span>
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
        <span className="mvm-step" style={{ background: "rgba(255,255,255,0.22)", color: "#fff", width: 26, height: 26, fontSize: "0.9rem" }}>2</span>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>Gioca</div>
          <div style={{ fontSize: "0.74rem", opacity: 0.9, marginTop: "0.1rem" }}>{selectedMode.name} · memorizza in {selectedMode.watch}</div>
        </div>
      </div>
      <ChevronRight size={22} />
    </button>
  );

  // Azioni secondarie (dopo Gioca): "Come si gioca" CTA + torna ai progetti.
  const SecondaryActions = () => (
    <>
      <button type="button" onClick={onTutorial} className="mvm-tut-btn mvm-tut-cta">
        <BookOpen size={19} strokeWidth={2.4} /> Come si gioca
      </button>
      <Link to="/#progetti" className="mvm-back-btn mvm-vio-btn" style={{ color: vio, border: `1.5px solid ${vBord}` }}>
        <ArrowLeft size={18} /> Torna ai progetti
      </Link>
    </>
  );

  const StatsCard = (forceDark: boolean) => {
    const c = forceDark ? "#fff" : val;
    const l = forceDark ? "rgba(255,255,255,0.6)" : lbl;
    const ic = forceDark ? "#c4a5ff" : vio;
    return (
      <div className={`mvm-stats-card${forceDark ? " mvm-stats-dark" : ""}`} style={forceDark ? undefined : { background: card, border: `1px solid ${vBord}` }}>
        <div className="mvm-stat"><Flame size={20} style={{ color: ic }} /><span className="mvm-stat-val" style={{ color: c }}>{bestStreak}</span><span className="mvm-stat-lbl" style={{ color: l }}>Miglior streak</span></div>
        <div className="mvm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="mvm-stat"><Trophy size={20} style={{ color: ic }} /><span className="mvm-stat-val" style={{ color: c }}>{trophiesCount}</span><span className="mvm-stat-lbl" style={{ color: l }}>Trofei</span></div>
        <div className="mvm-stat-sep" style={{ background: forceDark ? "rgba(255,255,255,0.15)" : bord }} />
        <div className="mvm-stat"><Gauge size={20} style={{ color: ic }} /><span className="mvm-stat-val" style={{ color: c }}>5</span><span className="mvm-stat-lbl" style={{ color: l }}>Livelli</span></div>
      </div>
    );
  };

  return (
    <div className="mvm-root" ref={gridWrapRef}>
      {/* ════════ MOBILE ════════ */}
      <div className="mvm-mobile">
        <div className="mvm-hero">
          <div className="mvm-logo-wrap"><MovimentoMark size={44} /></div>
          <div style={{ textAlign: "center" }}>
            <h1 className="mvm-title">MOVI<span className="mvm-accent">MENTO</span></h1>
            <p className="mvm-tagline">Guarda · memorizza · ridisegna a memoria</p>
          </div>
          <p className="mvm-kicker">Versione {MOVIMENTO_VERSION}</p>
        </div>
        <div className="mvm-body">
          {StatsCard(false)}
          {ModeList}
          {PlayBtn}
          <div className="mvm-actions">{SecondaryActions()}</div>
          <p style={{ fontSize: "0.7rem", color: note, textAlign: "center", margin: 0 }}>Memorizza il percorso e ridisegnalo · più preciso, più punti</p>
        </div>
      </div>

      {/* ════════ DESKTOP — tre colonne (vetrina | gioco | funzioni) ════════ */}
      <div className="mvm-desktop">
        {/* ── Vetrina sinistra ── */}
        <div className="mvm-desktop-left">
          <div className="mvm-logo-wrap"><MovimentoMark size={54} /></div>
          <h1 className="mvm-title">MOVI<span className="mvm-accent">MENTO</span></h1>
          <p className="mvm-tagline">Ridisegna il percorso a memoria</p>
          {StatsCard(true)}
          <p className="mvm-kicker" style={{ position: "static", opacity: 1 }}>Versione {MOVIMENTO_VERSION} · gioco gratuito</p>
        </div>

        {/* ── Centro: il gioco ── */}
        <div className="mvm-desktop-center" style={{ background: bg }}>
          {ModeList}
          {PlayBtn}
        </div>

        {/* ── Rail destro: funzioni (speculare alla vetrina) ── */}
        <div className="mvm-desktop-right">
          <p className="mvm-rail-label">Funzioni</p>
          <div className="mvm-actions mvm-actions-dark">{SecondaryActions()}</div>
          <div className="mvm-rail-spacer" />
          <p className="mvm-rail-label">Memoria spaziale</p>
          <div className="mvm-rail-note">5 percorsi · streak ≥ 3 sblocca trofei</div>
        </div>
      </div>

      <style>{`
        .mvm-root {
          /* VIOLA = accento del menù · VERDE = secondario (come Trivia) */
          --pv:#7c3aed; --pv2:#6024c4; --pv3:#9b5cf6;
          --pv-ink:${dark ? "#c4a5ff" : "#6d28d9"};
          --gv:#2F7D4A; --gv3:#3a9e5f;
          position: fixed; inset: 0; z-index: 200;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: mvm-in 0.22s ease;
          background: ${bg};
        }
        @keyframes mvm-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .mvm-mobile { display:flex; flex-direction:column; height:100%; overflow-y:auto; }
        .mvm-desktop { display:none; }

        .mvm-hero {
          background: linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:1rem; padding:2rem 1.5rem 1.8rem;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .mvm-hero::before, .mvm-hero::after {
          content:""; position:absolute; width:60%; height:70%; border-radius:50%;
          filter:blur(50px); opacity:0.55; pointer-events:none; z-index:0;
        }
        .mvm-hero::before { background:#8b7bff; top:-25%; left:-15%; }
        .mvm-hero::after  { background:#6d4dff; bottom:-30%; right:-15%; opacity:0.4; }
        .mvm-hero > * { position:relative; z-index:1; }
        .mvm-logo-wrap {
          background:#fff; color:#6024c4; border-radius:18px; padding:14px;
          box-shadow:0 8px 32px rgba(91,33,182,0.4); display:inline-flex;
        }
        .mvm-title {
          font-size:clamp(2rem,9vw,3.4rem); font-weight:900;
          letter-spacing:0.14em; margin:0; line-height:1; color:#fff;
        }
        .mvm-accent { color:#b794ff; }
        .mvm-tagline { font-size:0.85rem; color:rgba(255,255,255,0.6); margin:0; font-weight:500; text-align:center; }
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
        .mvm-stats-dark { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); }
        .mvm-stat { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.12rem; }
        .mvm-stat-val { font-size:1.4rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
        .mvm-stat-lbl { font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; text-align:center; }
        .mvm-stat-sep { width:1px; margin:0 0.4rem; flex-shrink:0; }

        .mvm-section-label {
          font-size:0.72rem; font-weight:800; text-transform:uppercase;
          letter-spacing:0.1em; margin:0 0 0.4rem 0.1rem;
          display:flex; align-items:center; gap:0.5rem;
        }
        /* pallino numerato della sequenza (1 difficoltà, 2 gioca) */
        .mvm-step {
          display:inline-flex; align-items:center; justify-content:center;
          width:20px; height:20px; border-radius:999px; flex-shrink:0;
          color:#fff; font-size:0.72rem; font-weight:900; line-height:1;
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
        }

        /* azioni secondarie (drawer mobile / pannello desktop) */
        .mvm-actions { display:flex; flex-direction:column; gap:0.55rem; width:100%; }
        .mvm-actions-dark .mvm-tut-btn, .mvm-actions-dark .mvm-back-btn {
          background:rgba(255,255,255,0.10); color:#fff !important; border:1px solid rgba(255,255,255,0.16) !important;
        }
        .mvm-actions-dark .mvm-tut-btn:hover, .mvm-actions-dark .mvm-back-btn:hover { background:rgba(255,255,255,0.18); }
        .mvm-actions-dark .mvm-back-btn svg { color:#c4a5ff; }

        .mvm-tut-btn, .mvm-back-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;
          width:100%;
          padding:0.95rem 1rem; background:${dark ? "rgba(155,92,246,0.10)" : "rgba(124,58,237,0.06)"};
          border-radius:13px; font-size:1rem; font-weight:800;
          cursor:pointer; font-family:inherit; transition:filter .15s, transform .12s, background .15s;
          text-decoration:none;
        }
        .mvm-vio-btn svg { width:18px; height:18px; }
        .mvm-tut-btn:hover, .mvm-back-btn:hover {
          background:${dark ? "rgba(155,92,246,0.18)" : "rgba(124,58,237,0.11)"};
          transform:translateY(-1px);
        }
        /* "Come si gioca": CTA PIENO viola — grosso, spesso, con un respiro luminoso */
        .mvm-tut-cta {
          background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important;
          color:#fff !important; border:none !important;
          font-size:1.05rem !important; font-weight:900 !important; letter-spacing:0.01em;
          box-shadow:0 6px 22px rgba(91,33,182,0.45);
          position:relative; overflow:hidden;
          animation:mvm-cta-breathe 2.8s ease-in-out infinite;
        }
        .mvm-tut-cta svg { color:#fff; width:19px; height:19px; }
        .mvm-tut-cta::after {
          content:""; position:absolute; top:0; left:-60%; width:45%; height:100%;
          background:linear-gradient(100deg,transparent,rgba(255,255,255,0.35),transparent);
          transform:skewX(-18deg); animation:mvm-cta-shine 3.4s ease-in-out infinite;
        }
        .mvm-tut-cta:hover { transform:translateY(-2px); filter:brightness(1.07); box-shadow:0 10px 30px rgba(91,33,182,0.55); background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%) !important; }
        @keyframes mvm-cta-breathe { 0%,100%{box-shadow:0 6px 22px rgba(91,33,182,0.4);} 50%{box-shadow:0 8px 30px rgba(124,58,237,0.65);} }
        @keyframes mvm-cta-shine { 0%,55%{left:-60%;} 100%{left:130%;} }
        @media (prefers-reduced-motion: reduce) {
          .mvm-tut-cta, .mvm-tut-cta::after { animation:none; }
        }

        /* ═══════ Tile livelli stile "booking card" (copiata da Trivia) ═══════ */
        .mvm-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0.55rem;
          margin-top:0.5rem;
        }

        .mvm-tile {
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

        /* gradiente viola pieno che "sale" allo hover / quando acceso */
        .mvm-tile::before {
          content:""; position:absolute; inset:0; z-index:-2;
          background:linear-gradient(155deg, var(--gv3) 0%, var(--gv) 45%, var(--gv2) 100%);
          opacity:0; transition:opacity .14s ease;
        }
        /* "torcia" del cursore centrata su --mx/--my (vedi handleTileMove) */
        .mvm-tile-spot {
          position:absolute; inset:0; z-index:-1; pointer-events:none;
          border-radius:inherit; opacity:0; transition:opacity .25s ease;
          background:radial-gradient(circle 70px at var(--mx,50%) var(--my,50%),
            var(--spot) 0%, transparent 70%);
        }
        @media (hover: hover) {
          .mvm-tile:hover .mvm-tile-spot { opacity:1; }
        }
        /* alone luminoso animato (shimmer) che scorre allo hover */
        .mvm-tile-glow {
          position:absolute; inset:-40%; z-index:-1; pointer-events:none;
          background:radial-gradient(closest-side, rgba(255,255,255,0.35), transparent 70%);
          opacity:0; transform:translate(-30%,30%) scale(0.6);
          transition:opacity .14s, transform .25s ease;
        }
        @media (hover: hover) {
          .mvm-tile:hover {
            transform:translateY(-4px);
            border-color:var(--gv);
            box-shadow:0 14px 30px ${dark ? "rgba(0,0,0,0.5)" : "rgba(91,33,182,0.30)"};
          }
          .mvm-tile:hover::before { opacity:1; }
          .mvm-tile:hover .mvm-tile-glow { opacity:1; transform:translate(0,0) scale(1); }
          .mvm-tile:hover .mvm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
          .mvm-tile:hover .mvm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
          .mvm-tile:hover .mvm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
          .mvm-tile:hover .mvm-tile-tag { color:#fff; background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.45); }
        }
        .mvm-tile:active { transform:translateY(-1px) scale(0.97); border-color:var(--gv); }

        /* SELEZIONATO: viola pieno, testo bianco */
        .mvm-tile.is-on::before { opacity:1; }
        .mvm-tile.is-on {
          border-color:var(--gv3);
          box-shadow:0 0 0 2px var(--gv3), 0 14px 30px ${dark ? "rgba(0,0,0,0.55)" : "rgba(91,33,182,0.35)"};
        }
        .mvm-tile.is-on .mvm-word { color:#fff; text-shadow:0 1px 8px rgba(0,0,0,0.25); }
        .mvm-tile.is-on .mvm-tile-mark { color:rgba(255,255,255,0.9); opacity:0.95; transform:scale(1.15) rotate(-4deg); }
        .mvm-tile.is-on .mvm-tile-bg { color:#fff; opacity:0.30; transform:scale(1.06) rotate(-4deg); }
        .mvm-tile.is-on .mvm-tile-tag { color:#fff; background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.45); }

        /* logo a filigrana nell'angolo alto-sinistra */
        .mvm-tile-mark {
          position:absolute; top:8px; left:9px;
          width:30px; height:30px; display:flex; align-items:center; justify-content:center;
          color:var(--gv); opacity:0.6;
          transition:transform .15s cubic-bezier(.2,.7,.3,1.5), color .12s, opacity .12s;
        }
        .mvm-tile-mark svg { width:28px; height:28px; }

        /* "immagine" di sfondo: glyph gigante del livello al ~30%, dietro al titolo */
        .mvm-tile-bg {
          position:absolute; right:-14px; bottom:-18px; z-index:-1; pointer-events:none;
          color:var(--gv); opacity:0.16;
          transition:opacity .14s, color .12s, transform .15s;
        }
        .mvm-tile-bg svg { width:130px; height:130px; }

        /* TITOLO protagonista "Bolt": riempie l'area; JS lo ingrandisce a riempire */
        .mvm-tile-titlebox {
          position:relative; z-index:1; flex:1 1 auto; width:100%;
          display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end;
          min-height:0; overflow:hidden; gap:0.02em;
        }
        .mvm-word {
          display:block; white-space:nowrap;
          font-size:1.4rem; /* fallback; il JS sovrascrive inline */
          font-weight:900; line-height:0.92;
          letter-spacing:-0.03em;
          color:${textMain};
          transition:color .12s;
          text-shadow:0 1px 0 rgba(255,255,255,0.04);
        }
        /* riga "tag" sotto il titolo (Consigliato/Classico/Sfida…) */
        .mvm-tile-tag {
          position:relative; z-index:1; margin-top:0.3rem;
          font-size:0.56rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em;
          padding:0.12rem 0.45rem; border-radius:999px;
          color:${vio}; background:${dark ? "rgba(155,92,246,0.14)" : "rgba(124,58,237,0.10)"};
          border:1px solid ${vBord};
          transition:color .12s, background .12s, border-color .12s;
        }

        /* badge tempo di memorizzazione: angolo alto-destra (al posto del "N/T") */
        .mvm-tile-ring { position:absolute; top:6px; right:6px; z-index:2; }
        .mvm-watchbadge {
          display:inline-flex; align-items:center; gap:0.15rem;
          padding:0.12rem 0.42rem 0.12rem 0.34rem; border-radius:999px;
          border:1.5px solid var(--gv); color:var(--gv);
          background:rgba(255,255,255,0.92);
          line-height:1; font-variant-numeric:tabular-nums;
          box-shadow:0 2px 7px rgba(0,0,0,0.16);
          backdrop-filter:blur(2px);
        }
        .mvm-watchbadge-v { font-size:0.72rem; font-weight:900; letter-spacing:-0.02em; }
        .mvm-tile.is-on .mvm-watchbadge {
          color:#fff; border-color:rgba(255,255,255,0.55);
          background:rgba(255,255,255,0.18); box-shadow:none;
        }
        @media (hover: hover) {
          .mvm-tile:hover .mvm-watchbadge {
            color:#fff; border-color:rgba(255,255,255,0.55);
            background:rgba(255,255,255,0.18); box-shadow:none;
          }
        }

        /* spunta "accesa": angolo basso-destra, pop elastico */
        .mvm-tile-check {
          position:absolute; bottom:8px; right:8px; z-index:2;
          width:22px; height:22px; border-radius:8px;
          background:#fff; color:var(--gv);
          display:flex; align-items:center; justify-content:center;
          transform:scale(0) rotate(-30deg); opacity:0;
          transition:transform .26s cubic-bezier(.2,.9,.3,1.6), opacity .2s;
          box-shadow:0 3px 10px rgba(0,0,0,0.3);
        }
        .mvm-tile-check svg path { stroke:var(--gv); }
        .mvm-tile.is-on .mvm-tile-check { transform:scale(1) rotate(0); opacity:1; }

        /* ════════ DESKTOP: tre colonne (vetrina | gioco | funzioni) ════════ */
        @media (min-width: 760px) {
          .mvm-mobile  { display:none; }
          .mvm-root { display:flex; align-items:stretch; justify-content:center; }
          .mvm-desktop {
            display:flex; flex-direction:row; height:100%; overflow:hidden;
            max-width:1120px; margin:0 auto; width:100%;
          }

          /* Fasce scure SINISTRA e DESTRA: stessa "pelle" speculare. */
          .mvm-desktop-left, .mvm-desktop-right {
            flex-shrink:0;
            background:linear-gradient(160deg,#15101f 0%,#1a1430 45%,#0b0f14 100%);
            display:flex; flex-direction:column; overflow:hidden; position:relative;
          }
          .mvm-desktop-left::before, .mvm-desktop-right::before {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.4; pointer-events:none;
            background:#8b7bff; top:-10%; left:-20%;
          }
          .mvm-desktop-left::after, .mvm-desktop-right::after {
            content:""; position:absolute; width:75%; height:45%; border-radius:50%;
            filter:blur(60px); opacity:0.3; pointer-events:none;
            background:#6d4dff; bottom:-12%; right:-20%;
          }
          .mvm-desktop-left > *, .mvm-desktop-right > * { position:relative; z-index:1; }

          /* SINISTRA = vetrina. */
          .mvm-desktop-left {
            width:330px;
            align-items:center; justify-content:center; gap:1.5rem; padding:2rem;
          }
          .mvm-desktop-left .mvm-logo-wrap { padding:16px; border-radius:22px; }
          .mvm-desktop-left .mvm-logo-wrap svg { width:64px; height:64px; }
          .mvm-desktop-left .mvm-title { font-size:2.8rem; }
          .mvm-desktop-left .mvm-tagline { font-size:0.95rem; }
          .mvm-desktop-left .mvm-stats-card { width:100%; padding:1.1rem 1.2rem; background:rgba(255,255,255,0.06); }
          .mvm-desktop-left .mvm-stat-val { font-size:1.9rem; }
          .mvm-desktop-left .mvm-stat-lbl { font-size:0.62rem; }
          .mvm-desktop-left .mvm-stat svg { width:24px; height:24px; }

          /* CENTRO = il gioco (la sequenza 1-2). */
          .mvm-desktop-center {
            flex:1; min-width:0;
            display:flex; flex-direction:column; gap:0.85rem; justify-content:center;
            padding:2rem 1.8rem; overflow-y:auto;
          }
          .mvm-desktop-center .mvm-grid { grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); }

          /* DESTRA = funzioni. */
          .mvm-desktop-right {
            width:280px;
            justify-content:flex-start; gap:0.7rem; padding:2rem 1.5rem;
          }
          .mvm-desktop-right .mvm-actions { gap:0.6rem; }
          .mvm-rail-label {
            font-size:0.66rem; font-weight:800; text-transform:uppercase;
            letter-spacing:0.14em; color:rgba(255,255,255,0.45); margin:0 0 0.1rem 0.2rem;
          }
          .mvm-rail-spacer { flex:1; min-height:1rem; }
          .mvm-rail-note { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.62); line-height:1.4; padding:0 0.2rem; }
        }

        /* ─── Schermi bassi: compatta la vetrina ─── */
        @media (min-width:760px) and (max-height:820px) {
          .mvm-desktop-left { gap:1rem; padding:1.5rem; }
          .mvm-desktop-left .mvm-logo-wrap { padding:12px; border-radius:18px; }
          .mvm-desktop-left .mvm-logo-wrap svg { width:48px; height:48px; }
          .mvm-desktop-left .mvm-title { font-size:2.3rem; }
          .mvm-desktop-left .mvm-stat-val { font-size:1.5rem; }
          .mvm-desktop-left .mvm-kicker { display:none; }
          .mvm-desktop-right { padding:1.5rem 1.4rem; gap:0.5rem; }
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

// Glyph per la tile del livello: una curva la cui "ampiezza/nervosità" cresce
// col livello (più difficile = curva più mossa). Riempie da filigrana lo sfondo.
function LevelGlyph({ level, size = 28 }: { level: LevelMode; size?: number }) {
  // più alto il livello → più "ondulato" il tracciato
  const paths: Record<LevelMode, string> = {
    1: "M14 72 C 36 70, 44 40, 62 46 S 82 62, 88 30",
    2: "M12 70 C 30 74, 36 34, 52 44 S 70 70, 90 32",
    3: "M12 66 C 28 80, 34 28, 48 48 S 60 78, 72 36 S 84 60, 90 40",
    4: "M10 60 C 24 84, 30 26, 42 50 S 52 80, 62 34 S 72 76, 82 38 S 88 56, 92 44",
    5: "M10 56 C 20 86, 26 24, 36 52 S 44 82, 52 32 S 60 78, 68 36 S 76 76, 84 40 S 90 58, 94 46",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={paths[level]} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
