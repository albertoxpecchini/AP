import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { ArrowLeft, RotateCcw, Trophy, Flame, Moon, Sun, HelpCircle, Layers } from "lucide-react";
import GameTutorial, { hasSeenTutorial, resetTutorial, type IntroStep } from "../components/GameIntro";
import AngoliMenu, { type StepMode as MenuStepMode } from "./AngoliMenu";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_OPTIONS = [20, 10, 5, 2, 1] as const;
type StepMode = (typeof STEP_OPTIONS)[number];
const STEP_LABELS: Record<StepMode, string> = { 20: "Facile", 10: "Medio", 5: "Difficile", 2: "Esperto", 1: "Maestro" };

const TROPHIES = [
  { strike: 10, emoji: "🏆", label: "Trofeo della Geometria Piana", desc: "10 angoli di fila. Sei un geometra puro.", accent: "#c8a415" },
  { strike: 7,  emoji: "🥇", label: "Geometra Professionista",      desc: "7 angoli di fila. Precisione da manuale.",  accent: "#B8960C" },
  { strike: 5,  emoji: "🥈", label: "Geometra Esperto",              desc: "5 angoli di fila. L'occhio non sbaglia.",   accent: "#7A8C99" },
  { strike: 3,  emoji: "🥉", label: "Geometra Dilettante",           desc: "3 angoli di fila. Il percorso è iniziato.", accent: "#A0674A" },
] as const;

// ─── Intro steps ──────────────────────────────────────────────────────────────

const ANGOLI_SVG_DEMO = (
  <svg viewBox="0 0 220 150" width="220" height="150" aria-hidden="true">
    {/* Vertex bottom-left, horizontal ray right, diagonal ray upper-right ~65° */}
    <g transform="translate(30,110)">
      {/* Arc */}
      <path d="M 38 0 A 38 38 0 0 0 16.1 -34.4" fill="none" stroke="#D9A400" strokeWidth="3" strokeLinecap="round" />
      {/* Horizontal ray */}
      <line x1="0" y1="0" x2="155" y2="0" stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" />
      <polygon points="162,0 150,-5 150,5" fill="#2F7D4A" />
      {/* Diagonal ray ~65° upward */}
      <line x1="0" y1="0" x2="54" y2="-115" stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" />
      <polygon points="58,-122 46,-114 57,-105" fill="#2F7D4A" />
      {/* Vertex dot */}
      <circle cx="0" cy="0" r="6" fill="#2F7D4A" />
      {/* Label */}
      <text x="48" y="-18" fontSize="15" fill="#D9A400" fontWeight="800" fontFamily="monospace">?g</text>
    </g>
  </svg>
);

const HINT_SVG = (
  <svg viewBox="0 0 220 120" width="220" height="120" aria-hidden="true">
    {[
      { y: 30, val: "30g", hint: "↑", label: "Maggiore", color: "#2F7D4A" },
      { y: 70, val: "60g", hint: "↓", label: "Minore",   color: "#c0392b" },
    ].map((r, i) => (
      <g key={i}>
        <rect x="10" y={r.y - 14} width="200" height="28" rx="6"
          fill={r.color + "15"} stroke={r.color + "60"} strokeWidth="1.5" />
        <text x="22" y={r.y + 5} fontSize="13" fill={r.color} fontWeight="700" fontFamily="monospace">
          #{i + 1}
        </text>
        <text x="55" y={r.y + 5} fontSize="14" fill="#17271d" fontWeight="700" fontFamily="monospace">
          {r.val}
        </text>
        <text x="105" y={r.y + 5} fontSize="17" fill={r.color} fontWeight="900">{r.hint}</text>
        <text x="128" y={r.y + 5} fontSize="13" fill={r.color} fontWeight="700">{r.label}</text>
      </g>
    ))}
  </svg>
);

const TROPHY_SVG = (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "3rem", lineHeight: 1, marginBottom: "0.5rem" }}>🏆</div>
    <div style={{ fontSize: "0.85rem", color: "#c8a415", fontWeight: 700 }}>
      Trofeo della Geometria Piana
    </div>
    <div style={{ fontSize: "0.75rem", color: "#6b8070", marginTop: "0.2rem" }}>
      10 angoli di fila
    </div>
  </div>
);

const ANGOLI_INTRO_STEPS: IntroStep[] = [
  {
    title: "Indovina l'angolo!",
    body: "Osserva le due semirette nell'area sinistra. Il tuo obiettivo è indovinare la misura dell'angolo che formano, espressa in gradianti (g).",
    visual: ANGOLI_SVG_DEMO,
  },
  {
    title: "Il sistema di indizi",
    body: "Dopo ogni tentativo ricevi un indizio: ↑ Maggiore (il vero angolo è più grande) oppure ↓ Minore (è più piccolo). Usa gli indizi per restringere il campo!",
    visual: HINT_SVG,
  },
  {
    title: "Difficoltà e gradianti",
    body: "La difficoltà determina il 'passo': in modalità Facile (20g) i valori possibili sono 20, 40, 60… In modalità Maestro (1g) ogni valore da 1 a 399 è possibile.",
    visual: undefined,
  },
  {
    title: "Streak e trofei",
    body: "Ogni risposta corretta consecutiva aumenta la tua Streak. Raggiungi 3, 5, 7 o 10 streak per sbloccare trofei geometrici esclusivi!",
    visual: TROPHY_SVG,
  },
];

// ─── Logo reale (PNG) ─────────────────────────────────────────────────────────

function AngoliLogo({ size = 52 }: { size?: number }) {
  return (
    <img
      src="/angoli-logo.png"
      alt="Angoli"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

function AngoliLogoFull({ size = 80 }: { size?: number }) {
  return (
    <img
      src="/angoli-logo.png"
      alt="Angoli"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomAngle(step: StepMode): number {
  const maxN = Math.floor(399 / step);
  return (Math.floor(Math.random() * maxN) + 1) * step;
}
function randomRotation(): number { return Math.floor(Math.random() * 360); }
const gradToRad = (g: number) => (g * Math.PI) / 200;
function getScore(a: number): number { return Math.max(0, 100 - (a - 1) * 15); }
function getScoreEmoji(s: number): string {
  if (s >= 100) return "🏆"; if (s >= 85) return "⭐"; if (s >= 70) return "🎯";
  if (s >= 55)  return "👏"; if (s >= 40) return "😅"; return "😮‍💨";
}
function getTrophyForStrike(n: number): (typeof TROPHIES)[number] | null {
  return TROPHIES.find(t => t.strike === n) ?? null;
}

// ─── SVG ──────────────────────────────────────────────────────────────────────

function arrowHead(ex: number, ey: number, dx: number, dy: number): string {
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len, ny = dy / len;
  const size = 13, wing = 6;
  return `M ${ex-size*nx+wing*-ny} ${ey-size*ny+wing*nx} L ${ex} ${ey} L ${ex-size*nx-wing*-ny} ${ey-size*ny-wing*nx}`;
}

function AngleDisplay({ angle, rotation }: { angle: number; rotation: number }) {
  const cx = 200, cy = 200, r = 155, arcR = 66;
  const rad = gradToRad(angle);
  const r2ex = cx + r*Math.cos(rad), r2ey = cy + r*Math.sin(rad);
  const a2x  = cx + arcR*Math.cos(rad), a2y  = cy + arcR*Math.sin(rad);
  const lA   = angle > 200 ? 1 : 0;
  return (
    <svg viewBox="0 0 400 400" className="ang-svg" aria-label="Angolo da indovinare">
      <g transform={`rotate(${rotation},200,200)`}>
        <path d={`M${cx} ${cy} L${cx+arcR} ${cy} A${arcR} ${arcR} 0 ${lA} 1 ${a2x} ${a2y}Z`} fill="rgba(217,164,0,0.10)" />
        <path d={`M${cx+arcR} ${cy} A${arcR} ${arcR} 0 ${lA} 1 ${a2x} ${a2y}`} fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={r2ex} y2={r2ey} stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
        <path d={arrowHead(cx+r, cy, 1, 0)} fill="none" stroke="var(--green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={arrowHead(r2ex, r2ey, Math.cos(rad), Math.sin(rad))} fill="none" stroke="var(--green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r="7" fill="var(--green)" />
      </g>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Angoli() {
  const [showMenu, setShowMenu]       = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [step, setStep]     = useState<StepMode>(10);
  const [angle, setAngle]   = useState(() => randomAngle(10));
  const [rotation, setRot]  = useState(randomRotation);
  const [input, setInput]   = useState("");
  const [attempts, setAtt]  = useState(0);
  const [history, setHist]  = useState<{ guess: number; hint: "maggiore"|"minore" }[]>([]);
  const [gameState, setGS]  = useState<"playing"|"won">("playing");
  const [strike, setStrike] = useState(0);
  const [best, setBest]     = useState(0);
  const [achieved, setAch]  = useState<number[]>([]);
  const [trophy, setTrophy] = useState<(typeof TROPHIES)[number]|null>(null);
  const [score, setScore]   = useState(0);
  const [msg, setMsg]       = useState("");
  const [shake, setShake]   = useState(false);
  const [dark, setDark]     = useState(() => {
    try {
      const s = localStorage.getItem("games-dark");
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });

  const msgT   = useRef<number>();
  const autoT  = useRef<number>();
  const stRef  = useRef(gameState);
  const subRef = useRef<()=>void>(()=>{});
  const stepR  = useRef(step);

  // Specchio dei ref aggiornato in commit (non in render-phase) per evitare
  // valori intermedi se React interrompe/riavvia il rendering.
  useEffect(() => { stRef.current = gameState; }, [gameState]);
  useEffect(() => { stepR.current = step; }, [step]);

  useEffect(() => {
    setBest(Number(localStorage.getItem("angoli-best-strike")) || 0);
    try { const t = JSON.parse(localStorage.getItem("angoli-trophies")||"[]"); if(Array.isArray(t)) setAch(t); } catch {}
  }, []);

  const flash = useCallback((m: string) => {
    clearTimeout(msgT.current); setMsg(m);
    msgT.current = window.setTimeout(()=>setMsg(""), 1700);
  }, []);

  const doShake = useCallback(() => { setShake(true); setTimeout(()=>setShake(false),500); }, []);

  const goNext = useCallback((s?: StepMode) => {
    clearTimeout(autoT.current);
    const st = s ?? stepR.current;
    setAngle(randomAngle(st)); setRot(randomRotation());
    setInput(""); setAtt(0); setHist([]); setGS("playing");
  }, []);

  const changeStep = useCallback((s: StepMode) => {
    setStep(s); stepR.current = s; setStrike(0); setScore(0); goNext(s);
  }, [goNext]);

  const handleSubmit = useCallback(() => {
    if (stRef.current !== "playing") return;
    const g = parseInt(input, 10);
    if (!input.trim() || isNaN(g))        { flash("Inserisci un numero"); doShake(); return; }
    if (g < 1 || g > 399)                 { flash("Angolo tra 1g e 399g"); doShake(); return; }
    if (g % step !== 0)                   { flash(`Multiplo di ${step}g`);  doShake(); return; }
    if (history.some(h => h.guess === g)) { flash("Già provato!");           doShake(); return; }

    const na = attempts + 1;
    setAtt(na);

    if (g === angle) {
      const s = getScore(na);
      setScore(s); setGS("won");
      const ns = strike + 1; setStrike(ns);
      if (ns > best) { setBest(ns); localStorage.setItem("angoli-best-strike", String(ns)); }
      confetti({ particleCount: s>=85?110:55, spread:72, origin:{y:0.6}, colors:["#2F7D4A","#D9A400","#fff","#1F6B3D"] });
      const tr = getTrophyForStrike(ns);
      if (tr && !achieved.includes(ns)) {
        const upd = [...achieved, ns]; setAch(upd);
        localStorage.setItem("angoli-trophies", JSON.stringify(upd));
        setTimeout(()=>{ setTrophy(tr); confetti({ particleCount:220, spread:110, origin:{y:0.45}, colors:["#c8a415","#2F7D4A","#D9A400","#fff"] }); }, 700);
      } else {
        autoT.current = window.setTimeout(()=>goNext(), 1900);
      }
    } else {
      setHist(p=>[...p, { guess:g, hint: angle>g?"maggiore":"minore" }]);
      setInput("");
    }
  }, [input, step, history, attempts, angle, strike, best, achieved, flash, doShake, goNext]);

  useEffect(() => { subRef.current = handleSubmit; }, [handleSubmit]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (stRef.current !== "playing") return;
      if (e.key>="0" && e.key<="9") setInput(p=>p.length<3?p+e.key:p);
      else if (e.key==="Backspace") setInput(p=>p.slice(0,-1));
      else if (e.key==="Enter") subRef.current();
    };
    window.addEventListener("keydown", h);
    return ()=>window.removeEventListener("keydown", h);
  }, []);

  const numpad = useCallback((k: string) => {
    if (stRef.current !== "playing") return;
    if (k==="CANC") setInput(p=>p.slice(0,-1));
    else if (k==="INVIO") subRef.current();
    else setInput(p=>p.length<3?p+k:p);
  }, []);

  const dismissTrophy = useCallback(()=>{ setTrophy(null); autoT.current=window.setTimeout(()=>goNext(),300); }, [goNext]);
  const newGame = useCallback(()=>{ setStrike(0); setScore(0); goNext(); }, [goNext]);
  const toggleDark = useCallback(()=>{
    setDark(d=>{ const n=!d; try{localStorage.setItem("games-dark",n?"1":"0");}catch{} return n; });
  }, []);

  return (
    <div className={`ang-page${dark ? " dark" : ""}`}>

      {/* ── Menu principale (sempre all'apertura) ── */}
      {showMenu && (
        <AngoliMenu
          dark={dark}
          bestStrike={best}
          trophiesCount={achieved.length}
          onPlay={(chosenStep: MenuStepMode) => {
            setStep(chosenStep);
            stepR.current = chosenStep;
            goNext(chosenStep);
            if (!hasSeenTutorial("angoli")) {
              setShowTutorial(true);
            } else {
              setShowMenu(false);
            }
          }}
          onTutorial={() => setShowTutorial(true)}
        />
      )}

      {/* ── Tutorial (prima volta obbligatorio, poi facoltativo) ── */}
      {showTutorial && (
        <GameTutorial
          gameKey="angoli"
          steps={ANGOLI_INTRO_STEPS}
          accentColor="#2F7D4A"
          darkBg="#103820"
          dark={dark}
          onDone={() => { setShowTutorial(false); setShowMenu(false); }}
        />
      )}

      {/* ── Header ── */}
      <header className="ang-header">
        <div className="ang-hdr-left">
          <a href="/" className="ang-iconbtn" aria-label="Torna al sito"><ArrowLeft size={20}/></a>
          <h1 className="ang-title">ANG<span className="ang-accent">OL</span>I</h1>
        </div>
        <div className="ang-hdr-center">
          <button className="ang-mode-pill" onClick={()=>setShowMenu(true)} aria-label="Cambia modalità">
            <Layers size={13}/>
            <span>{STEP_LABELS[step]}</span>
            <span className="ang-mode-pill-step">{step}g</span>
          </button>
        </div>
        <div className="ang-hdr-right">
          <button className="ang-iconbtn" onClick={newGame} aria-label="Nuova partita"><RotateCcw size={16}/></button>
          <button className="ang-iconbtn" onClick={toggleDark} aria-label="Cambia tema">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button className="ang-iconbtn" onClick={()=>setShowTutorial(true)} aria-label="Come si gioca">
            <HelpCircle size={16}/>
          </button>
        </div>
      </header>

      {/* ── Game area ── */}
      <div className="ang-stage">

        {/* ── SVG angolo ── */}
        <div className="ang-game">
          <div className="ang-fig-wrap">
            <AngleDisplay angle={angle} rotation={rotation}/>
          </div>
        </div>

        {/* ── Right: white card ── */}
        <aside className="ang-ctrl-block" aria-label="Pannello di gioco">

          {/* Stats row (visibile solo su desktop nella card) */}
          <div className="ang-card-stats">
            <div className="ang-card-stat">
              <Flame size={16} aria-hidden="true" />
              <span className="ang-card-stat-val">{strike}</span>
              <span className="ang-card-stat-lbl">Streak</span>
            </div>
            <div className="ang-card-stat ang-card-stat--mid">
              <span className="ang-card-stat-val" style={{fontSize:"0.85rem"}}>{STEP_LABELS[step]}</span>
              <span className="ang-card-stat-lbl">{step}g</span>
            </div>
            <div className="ang-card-stat">
              <Trophy size={16} aria-hidden="true" />
              <span className="ang-card-stat-val">{best}</span>
              <span className="ang-card-stat-lbl">Best</span>
            </div>
          </div>

          {/* Messaggio feedback */}
          {msg && <div className="ang-message ang-message--card">{msg}</div>}

          {/* Legend box (stile /parole) */}
          <div className="ang-legend">
            <h2 className="ang-legend-title">Comandi</h2>
            <ul className="ang-legend-list">
              <li>
                <span className="ang-legend-keys"><kbd>0</kbd>–<kbd>9</kbd></span>
                <span>Digita il numero in gradianti</span>
              </li>
              <li>
                <span className="ang-legend-keys"><kbd>Invio</kbd></span>
                <span>Conferma il tentativo</span>
              </li>
              <li>
                <span className="ang-legend-keys">
                  <kbd className="ang-kbd-up">↑</kbd>
                  <kbd className="ang-kbd-dn">↓</kbd>
                </span>
                <span>Maggiore / Minore del corretto</span>
              </li>
            </ul>
            <p className="ang-legend-hint">Usa la tastiera fisica oppure il pad qui sotto.</p>
          </div>

          {/* Input display */}
          <div className={`ang-input-box${shake?" ang-shake":""}`}>
            <span className="ang-iv">{input||"···"}</span>
            <span className="ang-iu">g</span>
          </div>

          {/* Win reveal */}
          {gameState==="won" && (
            <div className="ang-win-reveal">
              <span className="ang-wr-e">{getScoreEmoji(score)}</span>
              <span className="ang-wr-a">{angle}g</span>
              <span className="ang-wr-s">{score}%</span>
              <span className="ang-wr-t">{attempts===1?"1 tentativo":`${attempts} tentativi`}</span>
            </div>
          )}

          {/* History */}
          {history.length>0 && (
            <div className="ang-hist">
              {history.map((h,i)=>(
                <div key={i} className={`ang-hrow ang-hrow--${h.hint}`}>
                  <span className="ang-hn">#{i+1}</span>
                  <span className="ang-hv">{h.guess}g</span>
                  <span className="ang-ha">{h.hint==="maggiore"?"↑":"↓"}</span>
                  <span className="ang-hl">{h.hint==="maggiore"?"Maggiore":"Minore"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Numpad / Next */}
          {gameState==="playing" ? (
            <div className="ang-keyboard">
              {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row,ri)=>(
                <div key={ri} className="ang-krow">
                  {row.map(k=><button key={k} type="button" className="ang-key" onClick={()=>numpad(k)}>{k}</button>)}
                </div>
              ))}
              <div className="ang-krow">
                <button type="button" className="ang-key ang-key--wide" onClick={()=>numpad("CANC")}>⌫</button>
                <button type="button" className="ang-key" onClick={()=>numpad("0")}>0</button>
                <button type="button" className="ang-key ang-key--wide ang-key--ok" onClick={()=>numpad("INVIO")}>↵</button>
              </div>
            </div>
          ) : (
            <button type="button" className="ang-next" onClick={()=>goNext()}>
              Prossimo <RotateCcw size={15}/>
            </button>
          )}
        </aside>
      </div>

      {/* ── Trophy modal ── */}
      {trophy && (
        <div className="ang-overlay" onClick={dismissTrophy}>
          <div className="ang-tcard" onClick={e=>e.stopPropagation()}>
            <div className="ang-thead" style={{background:trophy.accent}}>
              <span className="ang-tgrade">{trophy.strike}</span>
              <span className="ang-tico">{trophy.emoji}</span>
              <span className="ang-tlbl">{trophy.label}</span>
            </div>
            <div className="ang-tbody">
              <p className="ang-tdesc">{trophy.desc}</p>
              <p className="ang-tsub">Strike consecutivi: {trophy.strike}</p>
              <button type="button" className="ang-tcta" onClick={dismissTrophy}>Continua <RotateCcw size={14}/></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dev autofill ── */}
      {import.meta.env.DEV && gameState==="playing" && (
        <button className="ang-autofill" style={{position:"fixed",bottom:16,right:16,zIndex:999}}
          onClick={()=>setInput(String(angle))}>✎ Autofill</button>
      )}

      <style>{`
        .ang-page {
          --green:      #2F7D4A;
          --green-dark: #1F6B3D;
          --amber:      #D9A400;
          --absent:     #c0392b;
          height: 100dvh;
          overflow: hidden;
          background: #f4f6f5;
          color: #17271d;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          user-select: none;
        }

        /* ── Header ── */
        .ang-header {
          position: sticky; top:0; z-index:20; flex-shrink:0;
          width:100%; display:flex; align-items:center; justify-content:space-between;
          padding:0 0.75rem; height:52px; background:#103820; color:#fff;
          box-shadow:0 2px 16px rgba(0,0,0,0.22);
        }
        .ang-hdr-left { display:flex; align-items:center; }
        .ang-hdr-center { flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem; }
        .ang-hdr-right { display:flex; align-items:center; gap:4px; }
        .ang-modes-header { display:none; gap:3px; }
        .ang-mode-sm {
          border:none; background:rgba(255,255,255,0.12); color:rgba(255,255,255,0.75);
          font-weight:700; font-size:0.7rem; padding:0.16rem 0.5rem; border-radius:999px;
          cursor:pointer; transition:background 0.15s, color 0.15s; letter-spacing:0.02em;
        }
        .ang-mode-sm--active { background:rgba(255,255,255,0.28); color:#fff; box-shadow:0 0 0 1px rgba(255,255,255,0.3); }
        .ang-mode-pill {
          display:inline-flex; align-items:center; gap:0.35rem;
          background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.22);
          color:#fff; border-radius:999px; padding:0.28rem 0.75rem 0.28rem 0.6rem;
          font-size:0.78rem; font-weight:700; cursor:pointer; font-family:inherit;
          transition:background 0.15s; letter-spacing:0.02em;
        }
        .ang-mode-pill:hover { background:rgba(255,255,255,0.22); }
        .ang-mode-pill-step {
          background:rgba(255,255,255,0.18); border-radius:999px;
          padding:0.05rem 0.4rem; font-size:0.68rem; font-weight:800;
          color:rgba(255,255,255,0.85);
        }
        .ang-title { font-size:1.5rem; font-weight:700; letter-spacing:0.2em; margin:0; animation:none; }
        .ang-accent { color:#6fd08a; }
        @keyframes ang-drop { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .ang-iconbtn {
          display:inline-flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.3);
          background:transparent; color:#fff; cursor:pointer; text-decoration:none; flex-shrink:0;
          transition:background .15s,transform .15s;
        }
        .ang-iconbtn:hover { background:rgba(255,255,255,0.15); transform:translateY(-1px); }

        /* ── Stage ── */
        .ang-stage {
          width:100%; flex:1 1 0; min-height:0;
          display:flex; flex-direction:column; align-items:center; gap:0.75rem;
          padding:8px 16px 16px; overflow-y:auto;
        }

        /* Stats nella card — nascosti su mobile (le stats non ci sono) */
        .ang-card-stats { display:none; }
        .ang-message--card { display:none; }

        /* ── Figura ── */
        .ang-game {
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; width:100%;
        }
        .ang-fig-wrap {
          width:min(85vw,280px); height:min(85vw,280px);
          display:flex; align-items:center; justify-content:center;
        }
        .ang-svg { display:block; width:100%; height:100%; }

        /* ── Card comandi ── */
        .ang-ctrl-block {
          flex-shrink:0; width:min(90vw,320px);
          background:#fff;
          border:1px solid rgba(47,125,74,0.18);
          border-radius:14px;
          padding:1rem 1rem 0.9rem;
          display:flex; flex-direction:column; gap:0;
          box-shadow:0 4px 18px rgba(0,0,0,0.06);
        }

        /* ── Legend (riquadro stile /parole) ── */
        .ang-legend { padding-bottom:0.7rem; border-bottom:1px solid rgba(47,125,74,0.12); margin-bottom:0.7rem; }
        .ang-legend-title {
          font-size:0.75rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.08em; color:var(--green-dark); margin:0 0 0.5rem;
        }
        .ang-legend-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.45rem; }
        .ang-legend-list li { display:flex; align-items:center; gap:0.55rem; font-size:0.82rem; color:#3c4a41; }
        .ang-legend-keys { display:inline-flex; gap:0.2rem; min-width:64px; flex-shrink:0; }
        .ang-legend-list kbd {
          background:#e7ece9; border:1px solid #c5d1ca; border-bottom-width:2px;
          border-radius:5px; padding:0.1rem 0.4rem;
          font-family:"Roboto Mono",monospace; font-size:0.78rem; color:#17271d;
        }
        .ang-kbd-up { color:var(--green); }
        .ang-kbd-dn { color:var(--absent); }
        .ang-legend-hint { font-size:0.75rem; color:#5b6b61; margin:0.5rem 0 0; line-height:1.35; }

        /* ── Input display ── */
        .ang-input-box {
          background:#f4f6f5; border:2px solid #cdd8d1; border-radius:9px;
          padding:0.5rem 0.9rem; display:flex; align-items:baseline;
          gap:4px; justify-content:center; transition:border-color .15s;
          margin-bottom:6px;
        }
        .ang-iv { font-size:1.9rem; font-weight:800; color:#17271d; letter-spacing:.04em; min-width:60px; text-align:right; }
        .ang-iu { font-size:1rem; font-weight:700; color:#6b8070; }
        .ang-shake { animation:ang-shake .45s; }
        @keyframes ang-shake {
          10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)}
          30%,50%,70%{transform:translateX(-7px)} 40%,60%{transform:translateX(7px)}
        }

        /* ── Win reveal ── */
        .ang-win-reveal {
          display:flex; align-items:center; justify-content:center; gap:7px;
          background:#f4f6f5; border:2px solid rgba(47,125,74,0.2); border-radius:9px;
          padding:0.5rem 0.9rem; font-weight:700; margin-bottom:6px;
          animation:ang-slide-up .3s cubic-bezier(.34,1.56,.64,1);
        }
        .ang-wr-e { font-size:1.1rem; }
        .ang-wr-a { font-size:1.3rem; color:var(--green); font-weight:800; }
        .ang-wr-s { font-size:1rem; color:var(--green-dark); }
        .ang-wr-t { font-size:.75rem; color:#6b8070; }
        @keyframes ang-slide-up { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* ── History ── */
        .ang-hist { display:flex; flex-direction:column; gap:3px; max-height:88px; overflow-y:auto; margin-bottom:6px; }
        .ang-hrow {
          display:flex; align-items:center; gap:7px;
          padding:5px 9px; border-radius:6px; font-size:.82rem;
          animation:ang-slide-in .18s ease;
        }
        .ang-hrow--maggiore { background:rgba(47,125,74,0.09); border-left:3px solid var(--green); }
        .ang-hrow--minore   { background:rgba(192,57,43,0.09);  border-left:3px solid var(--absent); }
        .ang-hn { color:#6b8070; font-size:.73rem; width:22px; }
        .ang-hv { font-weight:700; flex:1; }
        .ang-hrow--maggiore .ang-ha,.ang-hrow--maggiore .ang-hl { color:var(--green); font-weight:700; }
        .ang-hrow--minore .ang-ha,.ang-hrow--minore .ang-hl     { color:var(--absent); font-weight:700; }
        @keyframes ang-slide-in { from{opacity:0;transform:translateX(-5px)} to{opacity:1;transform:translateX(0)} }

        /* ── Tastiera numerica ── */
        .ang-keyboard { display:flex; flex-direction:column; gap:5px; }
        .ang-krow { display:flex; gap:5px; }
        .ang-key {
          flex:1; min-width:0; height:44px;
          border:none; border-radius:6px;
          background:#d3dad6; color:#17271d;
          font-size:1.05rem; font-weight:700; cursor:pointer; font-family:inherit;
          transition:transform .08s,background .12s;
        }
        .ang-key:hover  { filter:brightness(.95); }
        .ang-key:active { transform:scale(.92); }
        .ang-key--wide  { flex:1.5; font-size:.82rem; }
        .ang-key--ok    { background:var(--green); color:#fff; font-size:1.25rem; }
        .ang-key--ok:hover { background:var(--green-dark); }

        /* ── Prossimo ── */
        .ang-next {
          width:100%; height:44px;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:var(--green); color:#fff; border:none;
          border-radius:10px; font-family:inherit; font-size:.95rem; font-weight:700; cursor:pointer;
          animation:ang-slide-up .3s cubic-bezier(.34,1.56,.64,1);
          transition:background .15s,transform .1s;
        }
        .ang-next:hover { background:var(--green-dark); transform:translateY(-1px); }

        /* ── Mobile ── */
        @media (max-width: 759px) {
          .ang-legend { display:none; }
          .ang-key    { height:40px; }
        }

        /* ── Desktop ── */
        @media (min-width: 760px) {
          .ang-header {
            height:60px; flex-shrink:0;
            display:grid; grid-template-columns:1fr auto 1fr;
            padding:0 1.25rem;
          }
          .ang-hdr-left  { justify-self:start; gap:0.75rem; }
          .ang-hdr-center{ display:flex; align-items:center; justify-content:center; }
          .ang-hdr-right { justify-self:end; gap:0.5rem; }
          .ang-mode-pill { padding:0.32rem 0.9rem 0.32rem 0.7rem; font-size:0.82rem; }

          /* Stage: flexbox riga, centrato, dimensioni fisse coordinate */
          .ang-stage {
            flex:1 1 0; min-height:0; overflow:hidden;
            display:flex; flex-direction:row;
            align-items:center; justify-content:center;
            gap:1.5rem; padding:1.5rem;
          }

          /* SVG: stesso height della card */
          .ang-game { flex-shrink:0; display:flex; align-items:center; }
          .ang-fig-wrap { width:360px; height:420px; }

          /* Card: larghezza fissa, altezza uguale all'SVG */
          .ang-ctrl-block {
            flex-shrink:0; width:300px; height:420px;
            overflow-y:auto; overflow-x:hidden;
            display:flex; flex-direction:column;
            padding:1rem 1.1rem;
            justify-content:flex-start;
          }

          /* Stats riga in cima alla card — visibili su desktop */
          .ang-card-stats {
            display:flex; align-items:center;
            gap:0; margin-bottom:0.8rem;
            background:rgba(47,125,74,0.06);
            border:1px solid rgba(47,125,74,0.13);
            border-radius:10px; padding:0.5rem 0.4rem;
            flex-shrink:0;
          }
          .ang-card-stat {
            flex:1; display:flex; flex-direction:column;
            align-items:center; gap:0.1rem; color:var(--green-dark);
          }
          .ang-card-stat--mid {
            border-left:1px solid rgba(47,125,74,0.15);
            border-right:1px solid rgba(47,125,74,0.15);
          }
          .ang-card-stat-val { font-size:1rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
          .ang-card-stat-lbl { font-size:0.55rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; opacity:0.65; }

          /* Messaggio nella card */
          .ang-message--card {
            display:flex; margin-bottom:0.5rem; flex-shrink:0;
          }
          .ang-message-slot { display:none; }
        }

        /* ── Dark mode ── */
        .ang-page.dark { background:#111916; color:#d4e8dc; }
        .ang-page.dark .ang-stat-card {
          background:rgba(47,125,74,0.12); border-color:rgba(47,125,74,0.22); color:#7ab893;
        }
        .ang-page.dark .ang-message { background:#1e3d2b; color:#d4e8dc; }
        /* Blocco carta destra */
        .ang-page.dark .ang-ctrl-block {
          background:#1a2720;
          border-color:rgba(47,125,74,0.22);
          box-shadow:0 4px 18px rgba(0,0,0,0.35);
        }
        /* Legenda */
        .ang-page.dark .ang-legend { border-color:rgba(47,125,74,0.15); }
        .ang-page.dark .ang-legend-title { color:#7ab893; }
        .ang-page.dark .ang-legend-list li { color:#a4c4aa; }
        .ang-page.dark .ang-legend-list kbd {
          background:#253025; border-color:#3a5040; color:#c8e0cc;
        }
        .ang-page.dark .ang-legend-hint { color:#7ab893; }
        /* Input */
        .ang-page.dark .ang-input-box {
          background:#0f1612; border-color:rgba(47,125,74,0.28); color:#d4e8dc;
        }
        .ang-page.dark .ang-iv { color:#d4e8dc; }
        .ang-page.dark .ang-iu { color:#7ab893; }
        /* Win reveal */
        .ang-page.dark .ang-win-reveal {
          background:#1a2720; border-color:rgba(47,125,74,0.22);
        }
        .ang-page.dark .ang-wr-t { color:#7ab893; }
        /* History */
        .ang-page.dark .ang-hrow--maggiore { background:rgba(47,125,74,0.12); }
        .ang-page.dark .ang-hrow--minore   { background:rgba(192,57,43,0.12); }
        .ang-page.dark .ang-hn { color:#7ab893; }
        /* Tastiera */
        .ang-page.dark .ang-key { background:#253025; color:#c8e0cc; }
        .ang-page.dark .ang-key--ok { background:var(--green); color:#fff; }
        /* Trophy */
        .ang-page.dark .ang-tcard { background:#1a2720; }
        .ang-page.dark .ang-tdesc { color:#7ab893; }
        .ang-page.dark .ang-tsub  { color:#d4e8dc; }

        /* ── Autofill ── */
        .ang-autofill {
          display:inline-flex; align-items:center; gap:.4rem;
          background:var(--green); color:#fff; border:none;
          border-radius:999px; padding:.4rem .9rem;
          font-weight:700; font-size:.9rem; cursor:pointer; font-family:inherit;
        }
        .ang-autofill:hover { background:var(--green-dark); }

        /* ── Trophy overlay ── */
        .ang-overlay {
          position:fixed; inset:0; z-index:100;
          background:rgba(10,30,18,0.72);
          display:flex; align-items:center; justify-content:center;
          padding:1rem; animation:ang-fadein .25s ease;
        }
        @keyframes ang-fadein { from{opacity:0} to{opacity:1} }
        .ang-tcard {
          background:#fff; border-radius:20px; overflow:hidden;
          width:100%; max-width:380px;
          box-shadow:0 24px 64px rgba(0,0,0,0.35);
          animation:ang-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .ang-thead { color:#fff; padding:1.3rem 1.5rem 1.1rem; display:flex; flex-direction:column; align-items:center; gap:.25rem; position:relative; }
        .ang-tgrade { position:absolute; top:.9rem; right:1.1rem; font-size:1.5rem; font-weight:900; opacity:.25; }
        .ang-tico { font-size:2.6rem; line-height:1; }
        .ang-tlbl { font-size:1.1rem; font-weight:700; margin-top:.15rem; }
        .ang-tbody { padding:1.1rem 1.4rem; }
        .ang-tdesc { color:#6b8070; font-size:.9rem; margin-bottom:.35rem; }
        .ang-tsub  { font-weight:700; color:#17271d; margin-bottom:.9rem; font-size:.88rem; }
        .ang-tcta  {
          width:100%; padding:.8rem 1.4rem;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:var(--green); color:#fff; border:none;
          border-radius:10px; font-family:inherit; font-size:.95rem; font-weight:700; cursor:pointer;
        }
        .ang-tcta:hover { background:var(--green-dark); }
      `}</style>
    </div>
  );
}
