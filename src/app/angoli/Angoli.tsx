import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, RotateCcw, Trophy, Flame, Moon, Sun, HelpCircle, Layers, Timer, Delete, CornerDownLeft, ListOrdered, Award } from "lucide-react";
import GameTutorial, { hasSeenTutorial, resetTutorial, type IntroStep } from "../components/GameIntro";
import AngoliMenu, { type StepMode as MenuStepMode } from "./AngoliMenu";
import NicknameGate, { getStoredNick } from "./NicknameGate";
import Leaderboard from "./Leaderboard";
import HomeTour, { type TourStep } from "../trivia/HomeTour";
import { submitScore, type ScoreRow } from "./leaderboardApi";

const TOUR_KEY = "angoli-home-tour-seen";

// Passi del tour guidato sulla home (gemello di quello di Trivia).
const HOME_TOUR: TourStep[] = [
  {
    selector: '[data-tour="leaderboard"]',
    kind: "modal",
    modalSelector: ".ang-lb",
    title: "La classifica live",
    body: "Il podio di tutti i giocatori, in tempo reale. Aprila, dài un'occhiata e chiudila per continuare.",
    hint: "Apri la classifica",
  },
  {
    selector: '[data-tour="tutorial"]',
    kind: "info",
    title: "Come si gioca",
    body: "Da qui rivedi quando vuoi la spiegazione del gioco, con tutte le meccaniche animate.",
  },
  {
    selector: '[data-tour="player"]',
    kind: "info",
    title: "Il tuo profilo",
    body: "Questa pastiglia mostra il tuo punteggio totale e il tuo nome. Toccala quando vuoi cambiare nickname.",
  },
  {
    selector: '[data-tour="chapters"]',
    kind: "info",
    title: "E ora… si gioca!",
    body: "Scegli la difficoltà e premi Gioca. Hai un minuto: più sei veloce, più punti. Buon divertimento!",
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_OPTIONS = [20, 10, 5, 2, 1] as const;
type StepMode = (typeof STEP_OPTIONS)[number];

// Ogni modalità dura UN MINUTO. Allo scadere → game over con punteggio totale.
const SESSION_MS = 60_000;
// Riferimento per il punteggio del singolo round: indovinare in 0s dà ROUND_REF
// punti, indovinare lentamente ne dà sempre meno (mai sotto zero). Granularità
// al centesimo di secondo (1 punto ≈ 1 centesimo risparmiato → ×10 per scala).
const ROUND_REF_MS = 20_000;
// Punteggio del round = tempo risparmiato in centesimi (più veloce = più punti).
function roundPoints(roundMs: number): number {
  return Math.max(0, Math.round((ROUND_REF_MS - roundMs) / 10));
}

const TROPHIES = [
  { strike: 10, emoji: "🏆", label: "Trofeo della Geometria Piana", desc: "10 angoli di fila. Sei un geometra puro.", accent: "#c8a415" },
  { strike: 7,  emoji: "🥇", label: "Geometra Professionista",      desc: "7 angoli di fila. Precisione da manuale.",  accent: "#B8960C" },
  { strike: 5,  emoji: "🥈", label: "Geometra Esperto",              desc: "5 angoli di fila. L'occhio non sbaglia.",   accent: "#7A8C99" },
  { strike: 3,  emoji: "🥉", label: "Geometra Dilettante",           desc: "3 angoli di fila. Il percorso è iniziato.", accent: "#A0674A" },
] as const;

// ─── Intro steps ──────────────────────────────────────────────────────────────

// ── Visual 1: l'angolo si DISEGNA da solo (raggi + arco animati) ──
function DemoAngleVisual() {
  // vertice in basso-sx, raggio orizzontale, raggio diagonale ~65°
  const vx = 30, vy = 110;
  const rH = { x: vx + 155, y: vy };          // estremo raggio orizzontale
  const rD = { x: vx + 54, y: vy - 115 };     // estremo raggio diagonale
  // viewBox calcolato sul bounding box reale del disegno (x∈[24,192],
  // y∈[-12,116]) + margine uniforme → la figura è centrata e nessuna
  // freccia viene tagliata.
  return (
    <svg viewBox="4 -26 208 168" aria-hidden="true" className="gtv-angle"
      style={{ width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%" }}
      preserveAspectRatio="xMidYMid meet">
      {/* Arco */}
      <path className="gtv-arc" d={`M ${vx + 38} ${vy} A 38 38 0 0 0 ${vx + 16.1} ${vy - 34.4}`}
        fill="none" stroke="#D9A400" strokeWidth="3" strokeLinecap="round" />
      {/* Raggio orizzontale */}
      <line className="gtv-ray gtv-ray1" x1={vx} y1={vy} x2={rH.x} y2={rH.y}
        stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" />
      <polygon className="gtv-head gtv-head1" points={`${rH.x + 7},${rH.y} ${rH.x - 5},${rH.y - 5} ${rH.x - 5},${rH.y + 5}`} fill="#2F7D4A" />
      {/* Raggio diagonale */}
      <line className="gtv-ray gtv-ray2" x1={vx} y1={vy} x2={rD.x} y2={rD.y}
        stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" />
      <polygon className="gtv-head gtv-head2" points={`${rD.x + 4},${rD.y - 7} ${rD.x - 8},${rD.y + 1} ${rD.x + 3},${rD.y + 9}`} fill="#2F7D4A" />
      {/* Vertice */}
      <circle className="gtv-vertex" cx={vx} cy={vy} r="6" fill="#2F7D4A" />
      {/* Etichetta ?g */}
      <text className="gtv-label" x={vx + 48} y={vy - 60} fontSize="18" fill="#D9A400" fontWeight="800" fontFamily="monospace">?g</text>
    </svg>
  );
}

// ── Visual 2: le righe-indizio compaiono una alla volta ──
function HintVisual() {
  const rows = [
    { val: "30g", hint: "↑", label: "Maggiore", color: "#2F7D4A" },
    { val: "60g", hint: "↓", label: "Minore",   color: "#c0392b" },
  ];
  return (
    <div className="gtv-hints">
      {rows.map((r, i) => (
        <div key={i} className="gtv-hint-row" style={{
          animationDelay: `${0.25 + i * 0.5}s`,
          background: r.color + "15", border: `1.5px solid ${r.color}60`,
        }}>
          <span className="gtv-hint-n" style={{ color: r.color }}>#{i + 1}</span>
          <span className="gtv-hint-val">{r.val}</span>
          <span className="gtv-hint-arrow" style={{ color: r.color }}>{r.hint}</span>
          <span className="gtv-hint-lbl" style={{ color: r.color }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Visual 3: la "scala" di difficoltà si riempie (passi 20→1) ──
function StepScaleVisual() {
  const steps = [
    { lbl: "Facile",   g: "20g" },
    { lbl: "Medio",    g: "10g" },
    { lbl: "Difficile", g: "5g" },
    { lbl: "Esperto",  g: "2g" },
    { lbl: "Maestro",  g: "1g" },
  ];
  return (
    <div className="gtv-scale">
      {steps.map((s, i) => (
        <div key={i} className="gtv-scale-bar" style={{ animationDelay: `${0.15 + i * 0.13}s` }}>
          <span className="gtv-scale-fill" style={{ width: `${30 + i * 17.5}%` }} />
          <span className="gtv-scale-lbl">{s.lbl}</span>
          <span className="gtv-scale-g">{s.g}</span>
        </div>
      ))}
    </div>
  );
}

// ── Visual 4: il trofeo entra con un "pop" ──
function TrophyVisual() {
  return (
    <div className="gtv-trophy">
      <div className="gtv-trophy-emoji">🏆</div>
      <div className="gtv-trophy-lbl">Trofeo della Geometria Piana</div>
      <div className="gtv-trophy-sub">10 angoli di fila</div>
    </div>
  );
}

const ANGOLI_INTRO_STEPS: IntroStep[] = [
  {
    title: "Indovina l'angolo!",
    body: "Osserva le due semirette nell'area sinistra. Il tuo obiettivo è indovinare la misura dell'angolo che formano, espressa in gradianti (g).",
    visual: <DemoAngleVisual />,
  },
  {
    title: "Il sistema di indizi",
    body: "Dopo ogni tentativo ricevi un indizio: ↑ Maggiore (il vero angolo è più grande) oppure ↓ Minore (è più piccolo). Usa gli indizi per restringere il campo!",
    visual: <HintVisual />,
  },
  {
    title: "Un minuto, più veloce = più punti",
    body: "Ogni partita dura 60 secondi. Indovina più angoli che puoi: più in fretta rispondi, più punti guadagni (contano anche i centesimi di secondo!). Allo scadere del minuto vedi il punteggio totale.",
    visual: <StepScaleVisual />,
  },
  {
    title: "Streak e classifica live",
    body: "La Streak sale SOLO se indovini al primo tentativo (mai al secondo!). A fine minuto il tuo punteggio finisce nella classifica live, visibile a tutti i giocatori in tempo reale.",
    visual: <TrophyVisual />,
  },
];

// CSS delle animazioni del tutorial (iniettato una volta).
const ANGOLI_TUTORIAL_CSS = `
  /* ── Visual 1: angolo che si disegna ── */
  .gtv-angle .gtv-ray { stroke-dasharray: 170; stroke-dashoffset: 170; animation: gtv-draw .55s ease forwards; }
  .gtv-angle .gtv-ray2 { animation-delay: .25s; }
  .gtv-angle .gtv-arc { stroke-dasharray: 60; stroke-dashoffset: 60; animation: gtv-draw .5s ease .55s forwards; }
  .gtv-angle .gtv-head { opacity: 0; animation: gtv-fade .25s ease forwards; }
  .gtv-angle .gtv-head1 { animation-delay: .55s; }
  .gtv-angle .gtv-head2 { animation-delay: .8s; }
  .gtv-angle .gtv-vertex { transform-origin: 30px 110px; animation: gtv-pop .4s cubic-bezier(.34,1.7,.5,1) both; }
  .gtv-angle .gtv-label { opacity: 0; animation: gtv-fade .4s ease 1s forwards; }
  @keyframes gtv-draw { to { stroke-dashoffset: 0; } }
  @keyframes gtv-fade { to { opacity: 1; } }
  @keyframes gtv-pop  { from { transform: scale(0); } to { transform: scale(1); } }

  /* ── Visual 2: indizi a comparsa ── */
  .gtv-hints { display: flex; flex-direction: column; gap: 13px; width: 290px; max-width: 100%; }
  .gtv-hint-row {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 16px; border-radius: 10px;
    font-family: monospace; font-weight: 700; font-size: 1.02rem;
    opacity: 0; animation: gtv-slide-in .4s ease forwards;
  }
  .gtv-hint-n { font-size: 0.9rem; }
  .gtv-hint-val { color: #17271d; min-width: 42px; }
  .gtv-hint-arrow { font-size: 1.35rem; font-weight: 900; }
  .gtv-hint-lbl { font-weight: 800; }
  @keyframes gtv-slide-in { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }

  /* ── Visual 3: scala difficoltà ── */
  .gtv-scale { display: flex; flex-direction: column; gap: 9px; width: 320px; max-width: 100%; }
  .gtv-scale-bar {
    position: relative; display: flex; align-items: center; gap: 8px;
    height: 34px; padding: 0 14px; border-radius: 7px; overflow: hidden;
    background: rgba(47,125,74,0.10); border: 1px solid rgba(47,125,74,0.18);
    opacity: 0; animation: gtv-bar-in .4s ease forwards;
  }
  .gtv-scale-fill {
    position: absolute; left: 0; top: 0; bottom: 0;
    background: linear-gradient(90deg, rgba(47,125,74,0.30), rgba(217,164,0,0.30));
    transform-origin: left; animation: gtv-grow .5s ease forwards;
  }
  .gtv-scale-lbl { position: relative; z-index: 1; font-size: 0.92rem; font-weight: 800; color: #17271d; }
  .gtv-scale-g {
    position: relative; z-index: 1; margin-left: auto;
    font-size: 0.82rem; font-weight: 800; font-family: monospace; color: #2F7D4A;
  }
  @keyframes gtv-bar-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  @keyframes gtv-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* ── Visual 4: trofeo ── */
  .gtv-trophy { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .gtv-trophy-emoji { font-size: 4.6rem; line-height: 1; animation: gtv-trophy-pop .6s cubic-bezier(.34,1.7,.5,1) both; }
  .gtv-trophy-lbl { font-size: 1.05rem; color: #c8a415; font-weight: 800; margin-top: 0.7rem; opacity: 0; animation: gtv-fade .4s ease .4s forwards; }
  .gtv-trophy-sub { font-size: 0.88rem; color: #6b8070; font-weight: 600; margin-top: 0.25rem; opacity: 0; animation: gtv-fade .4s ease .55s forwards; }
  @keyframes gtv-trophy-pop { 0% { transform: scale(0) rotate(-25deg); } 60% { transform: scale(1.15) rotate(8deg); } 100% { transform: scale(1) rotate(0); } }
`;

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
// Emoji in base ai punti del singolo round (più veloce = migliore).
function getScoreEmoji(p: number): string {
  if (p >= 1700) return "🏆"; if (p >= 1300) return "⭐"; if (p >= 900) return "🎯";
  if (p >= 500)  return "👏"; if (p >= 200) return "😅"; return "😮‍💨";
}
function getTrophyForStrike(n: number): (typeof TROPHIES)[number] | null {
  return TROPHIES.find(t => t.strike === n) ?? null;
}

// ─── Palette random vivace ──────────────────────────────────────────────────────
// Ogni round genera una nuova coppia di colori vivi (raggi + arco) armonica.
type Palette = { ray: string; arc: string; arcFill: string; dot: string };
function hsl(h: number, s: number, l: number) { return `hsl(${h} ${s}% ${l}%)`; }
function randomPalette(): Palette {
  const h = Math.floor(Math.random() * 360);
  const arcH = (h + 150 + Math.floor(Math.random() * 80)) % 360; // complementare/triadico
  return {
    ray:    hsl(h, 75, 45),
    dot:    hsl(h, 80, 36),
    arc:    hsl(arcH, 85, 45),
    arcFill: `hsl(${arcH} 85% 45% / 0.18)`,
  };
}

function fmtTime(ms: number): string {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const s = Math.floor(totalCs / 100) % 60;
  const m = Math.floor(totalCs / 6000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

// Countdown della sessione "ss.cc" (secondi.centesimi), mai negativo.
function fmtCountdown(ms: number): string {
  const m = Math.max(0, ms);
  const totalCs = Math.ceil(m / 10);
  const cs = totalCs % 100;
  const s = Math.floor(totalCs / 100);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(s)}.${pad(cs)}`;
}

// Numeri grandi compattati (es. 175995 → "176k", 1850000 → "1,8M") così non
// sforano mai i margini della card stats. Sotto 10.000 resta il formato pieno.
function fmtCompact(n: number): string {
  if (n < 10_000) return n.toLocaleString("it-IT");
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  const m = n / 1_000_000;
  return `${m.toFixed(m < 10 ? 1 : 0).replace(".", ",")}M`;
}

// ─── SVG ──────────────────────────────────────────────────────────────────────

function arrowHead(ex: number, ey: number, dx: number, dy: number): string {
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len, ny = dy / len;
  const size = 13, wing = 6;
  return `M ${ex-size*nx+wing*-ny} ${ey-size*ny+wing*nx} L ${ex} ${ey} L ${ex-size*nx-wing*-ny} ${ey-size*ny-wing*nx}`;
}

function AngleDisplay({ angle, rotation, palette, spin }: { angle: number; rotation: number; palette: Palette; spin: number }) {
  const cx = 200, cy = 200, r = 150, arcR = 64;
  const rad = gradToRad(angle);
  const r2ex = cx + r*Math.cos(rad), r2ey = cy + r*Math.sin(rad);
  const a2x  = cx + arcR*Math.cos(rad), a2y  = cy + arcR*Math.sin(rad);
  const lA   = angle > 200 ? 1 : 0;            // 200g = 180° → arco grande
  const gid  = `ag-${spin}`;
  // Lunghezza reale dell'arco e dei raggi: serve a far partire l'animazione di
  // "disegno" con il dasharray giusto, così l'arco si scopre SEMPRE per intero
  // (prima era fisso a 260 → su angoli grandi restava tagliato).
  const arcLen = arcR * rad;
  return (
    // `key` forza il remount → riparte l'animazione di disegno ad ogni round
    <svg key={spin} viewBox="0 0 400 400" className="ang-svg" aria-label="Angolo da indovinare">
      <defs>
        {/* Alone "neon": replica sfocata dello stesso tracciato, stesso colore →
            su sfondo chiaro o scuro resta pulito (niente disco grigiastro). */}
        <filter id={`${gid}-glow`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g transform={`rotate(${rotation},200,200)`}>
        {/* livello glow (dietro) */}
        <g className="ang-glow" filter={`url(#${gid}-glow)`} opacity="0.55">
          <path d={`M${cx+arcR} ${cy} A${arcR} ${arcR} 0 ${lA} 1 ${a2x} ${a2y}`} fill="none" stroke={palette.arc} strokeWidth="5" strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke={palette.ray} strokeWidth="7" strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={r2ex} y2={r2ey} stroke={palette.ray} strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* tracciato nitido (davanti) */}
        <path className="ang-arcfill" d={`M${cx} ${cy} L${cx+arcR} ${cy} A${arcR} ${arcR} 0 ${lA} 1 ${a2x} ${a2y}Z`} fill={palette.arcFill} />
        <path className="ang-arc" style={{ strokeDasharray: arcLen, strokeDashoffset: arcLen } as React.CSSProperties}
          d={`M${cx+arcR} ${cy} A${arcR} ${arcR} 0 ${lA} 1 ${a2x} ${a2y}`} fill="none" stroke={palette.arc} strokeWidth="3.5" strokeLinecap="round" />
        <line className="ang-ray ang-ray1" style={{ strokeDasharray: r, strokeDashoffset: r } as React.CSSProperties}
          x1={cx} y1={cy} x2={cx+r} y2={cy} stroke={palette.ray} strokeWidth="5" strokeLinecap="round" />
        <line className="ang-ray ang-ray2" style={{ strokeDasharray: r, strokeDashoffset: r } as React.CSSProperties}
          x1={cx} y1={cy} x2={r2ex} y2={r2ey} stroke={palette.ray} strokeWidth="5" strokeLinecap="round" />
        <path className="ang-head ang-head1" d={arrowHead(cx+r, cy, 1, 0)} fill="none" stroke={palette.ray} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path className="ang-head ang-head2" d={arrowHead(r2ex, r2ey, Math.cos(rad), Math.sin(rad))} fill="none" stroke={palette.ray} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="ang-vertex" cx={cx} cy={cy} r="8" fill={palette.dot} />
      </g>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Angoli() {
  const [nick, setNick]     = useState<string>(() => getStoredNick());
  // Il gate NON appare all'apertura: viene chiesto solo premendo "Gioca"
  // (se non c'è ancora un nick), come in Parole.
  const [showGate, setShowGate] = useState<boolean>(false);
  const pendingStep = useRef<StepMode | null>(null);
  const [showMenu, setShowMenu]       = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const chainTour = useRef(false);
  const [step, setStep]     = useState<StepMode>(10);
  const [angle, setAngle]   = useState(() => randomAngle(10));
  const [rotation, setRot]  = useState(randomRotation);
  const [palette, setPal]   = useState<Palette>(() => randomPalette());
  const [spin, setSpin]     = useState(0);
  const [input, setInput]   = useState("");
  const [attempts, setAtt]  = useState(0);
  const [history, setHist]  = useState<{ guess: number; hint: "maggiore"|"minore" }[]>([]);
  // playing → round in corso · won → reveal del round · over → minuto scaduto
  const [gameState, setGS]  = useState<"playing"|"won"|"over">("playing");
  const [strike, setStrike] = useState(0);
  const [best, setBest]     = useState(0);
  const [achieved, setAch]  = useState<number[]>([]);
  const [trophy, setTrophy] = useState<(typeof TROPHIES)[number]|null>(null);
  const [roundScore, setRoundScore] = useState(0);  // punti del round appena vinto
  const [total, setTotal]   = useState(0);          // punteggio totale della sessione
  const [solved, setSolved] = useState(0);          // angoli indovinati nella sessione
  const [bestTotal, setBestTotal] = useState(0);    // record personale di punteggio
  const [msg, setMsg]       = useState("");
  const [shake, setShake]   = useState(false);
  const [elapsed, setElapsed] = useState(0);   // ms trascorsi nel round corrente
  const [remaining, setRemaining] = useState(SESSION_MS); // ms rimanenti nel minuto
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ScoreRow | null>(null);
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
  const startT = useRef<number>(Date.now());      // istante d'inizio del round
  const sessionEnd = useRef<number>(0);           // timestamp di fine sessione (now+60s)
  const totalRef = useRef(0);                     // totale corrente (per il game over)
  const solvedRef = useRef(0);                    // angoli risolti (per il game over)
  const stepRef  = useRef<StepMode>(step);        // step usato al game over
  const endRef = useRef<()=>void>(()=>{});        // endSession corrente (evita TDZ nel timer)
  const rafRef = useRef<number>();

  // Specchio dei ref aggiornato in commit (non in render-phase) per evitare
  // valori intermedi se React interrompe/riavvia il rendering.
  useEffect(() => { stRef.current = gameState; }, [gameState]);
  useEffect(() => { stepR.current = step; stepRef.current = step; }, [step]);
  useEffect(() => { totalRef.current = total; }, [total]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  // Il countdown scorre SOLO quando si sta davvero giocando (niente menu,
  // tutorial, gate o classifica aperti, e round in corso). Quando uno di questi
  // overlay è aperto, la sessione resta "in pausa": ri-ancoriamo sessionEnd
  // ai ms rimanenti così non si perde tempo prezioso dietro a un overlay.
  const playActive = gameState === "playing" && !showMenu && !showTutorial && !showGate && !showLeaderboard;

  useEffect(() => {
    if (!playActive) return;
    // Ri-ancora i timer dai valori congelati: né la sessione né il round
    // consumano tempo mentre un overlay (menu/tutorial/gate/classifica) è aperto.
    // Su un round nuovo `elapsed` è già 0 (nextRound) → startT = ora.
    sessionEnd.current = Date.now() + Math.max(0, remaining);
    startT.current = Date.now() - elapsed;
    let live = true;
    const tick = () => {
      if (!live) return;
      const now = Date.now();
      setElapsed(now - startT.current);
      const rem = sessionEnd.current - now;
      setRemaining(rem);
      if (rem <= 0) { endRef.current(); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { live = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playActive, spin]);

  useEffect(() => {
    setBest(Number(localStorage.getItem("angoli-best-strike")) || 0);
    setBestTotal(Number(localStorage.getItem("angoli-best-total")) || 0);
    try { const t = JSON.parse(localStorage.getItem("angoli-trophies")||"[]"); if(Array.isArray(t)) setAch(t); } catch {}
  }, []);

  const flash = useCallback((m: string) => {
    clearTimeout(msgT.current); setMsg(m);
    msgT.current = window.setTimeout(()=>setMsg(""), 1700);
  }, []);

  const doShake = useCallback(() => { setShake(true); setTimeout(()=>setShake(false),500); }, []);

  // Prepara solo l'angolo/figura del prossimo round (senza toccare la sessione).
  const nextRound = useCallback((s?: StepMode) => {
    clearTimeout(autoT.current);
    const st = s ?? stepR.current;
    setAngle(randomAngle(st)); setRot(randomRotation());
    setPal(randomPalette());           // colori vivi nuovi ad ogni round
    setSpin(n => n + 1);               // forza remount SVG → ridisegno animato
    setInput(""); setAtt(0); setHist([]); setGS("playing");
    startT.current = Date.now(); setElapsed(0);  // riavvia il cronometro del round
  }, []);

  // Avvia una NUOVA sessione da 1 minuto: azzera totale/streak e fa partire il
  // countdown. Usata dal Menu (onPlay) e dal "rigioca".
  const startSession = useCallback((s?: StepMode) => {
    setTotal(0); totalRef.current = 0;
    setSolved(0); solvedRef.current = 0;
    setStrike(0); setRoundScore(0);
    setSubmitted(null); setSubmitting(false);
    setRemaining(SESSION_MS);   // l'effetto playActive ancora sessionEnd al resume
    nextRound(s);
  }, [nextRound]);

  // Fine del minuto: salva il record locale, invia il punteggio alla classifica,
  // mostra il riepilogo.
  const endSession = useCallback(() => {
    clearTimeout(autoT.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setRemaining(0);
    setGS("over");
    const finalTotal = totalRef.current;
    if (finalTotal > (Number(localStorage.getItem("angoli-best-total")) || 0)) {
      setBestTotal(finalTotal);
      localStorage.setItem("angoli-best-total", String(finalTotal));
    }
    // Invia alla leaderboard (best-effort: se fallisce non blocca il gioco).
    if (finalTotal > 0 && nick) {
      setSubmitting(true);
      submitScore({ nick, score: finalTotal, mode: stepRef.current, best_streak: 0 })
        .then(row => setSubmitted(row))
        .catch(() => {})
        .finally(() => setSubmitting(false));
    }
  }, [nick]);

  useEffect(() => { endRef.current = endSession; }, [endSession]);

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
      const roundMs = Date.now() - startT.current;
      setElapsed(roundMs);                       // congela il tempo del round
      const pts = roundPoints(roundMs);          // più veloce = più punti
      setRoundScore(pts);
      const newTotal = totalRef.current + pts; totalRef.current = newTotal; setTotal(newTotal);
      solvedRef.current += 1; setSolved(solvedRef.current);
      setGS("won");

      // Streak SOLO se indovinato al PRIMISSIMO tentativo (mai al secondo+).
      const firstTry = na === 1;
      const ns = firstTry ? strike + 1 : 0;
      setStrike(ns);
      if (firstTry && ns > best) { setBest(ns); localStorage.setItem("angoli-best-strike", String(ns)); }

      confetti({ particleCount: pts>=1300?110:55, spread:72, origin:{y:0.6}, colors:["#2F7D4A","#D9A400","#fff","#1F6B3D"] });

      const tr = firstTry ? getTrophyForStrike(ns) : null;
      if (tr && !achieved.includes(ns)) {
        const upd = [...achieved, ns]; setAch(upd);
        localStorage.setItem("angoli-trophies", JSON.stringify(upd));
        setTimeout(()=>{ setTrophy(tr); confetti({ particleCount:220, spread:110, origin:{y:0.45}, colors:["#c8a415","#2F7D4A","#D9A400","#fff"] }); }, 700);
      } else {
        // Avanza in fretta: il minuto scorre, non si sta fermi sulla vittoria.
        autoT.current = window.setTimeout(()=>nextRound(), 1100);
      }
    } else {
      setHist(p=>[...p, { guess:g, hint: angle>g?"maggiore":"minore" }]);
      setInput("");
    }
  }, [input, step, history, attempts, angle, strike, best, achieved, flash, doShake, nextRound]);

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

  // Dopo un trofeo si prosegue il round successivo (la sessione continua).
  const dismissTrophy = useCallback(()=>{ setTrophy(null); autoT.current=window.setTimeout(()=>nextRound(),300); }, [nextRound]);
  // "Nuova partita" dall'header = nuova sessione da 1 minuto.
  const newGame = useCallback(()=>{ startSession(); }, [startSession]);

  // Avvio effettivo dal menu (dopo l'eventuale gate nickname): imposta la
  // modalità, avvia la sessione e — alla prima volta — mostra il tutorial.
  const startPlay = useCallback((chosenStep: StepMode) => {
    setStep(chosenStep);
    stepR.current = chosenStep; stepRef.current = chosenStep;
    startSession(chosenStep);
    if (!hasSeenTutorial("angoli")) {
      setShowTutorial(true);
    } else {
      setShowMenu(false);
    }
  }, [startSession]);
  const toggleDark = useCallback(()=>{
    setDark(d=>{ const n=!d; try{localStorage.setItem("games-dark",n?"1":"0");}catch{} return n; });
  }, []);

  // ── Tour guidato "a riflettore" (solo desktop, dove il rail funzioni è visibile) ──
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches;
  const hasSeenTour = () => { try { return localStorage.getItem(TOUR_KEY) === "1"; } catch { return false; } };
  const markTourSeen = () => { try { localStorage.setItem(TOUR_KEY, "1"); } catch {} };

  // "Come si gioca": slideshow meccaniche, poi (su desktop) il tour guidato.
  const onTutorial = useCallback(() => {
    if (!showTour) chainTour.current = true;
    setShowTutorial(true);
  }, [showTour]);

  const onTourDone = useCallback(() => { setShowTour(false); markTourSeen(); }, []);

  // Primo accesso col nickname già scelto: avvia da solo slideshow + tour una volta.
  useEffect(() => {
    if (!showMenu || !nick) return;
    if (!isDesktop()) return;
    if (!hasSeenTour() && !showTour && !showTutorial) {
      chainTour.current = true;
      if (!hasSeenTutorial("angoli")) setShowTutorial(true);
      else setShowTour(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu, nick]);

  return (
    <div className={`ang-page${dark ? " dark" : ""}`}>

      {/* ── Menu principale (sempre all'apertura) ── */}
      {showMenu && (
        <AngoliMenu
          dark={dark}
          bestStrike={best}
          trophiesCount={achieved.length}
          nick={nick}
          onLeaderboard={()=>setShowLeaderboard(true)}
          onChangeNick={()=>{ pendingStep.current = null; setShowGate(true); }}
          onPlay={(chosenStep: MenuStepMode) => {
            // Gate nickname: se non c'è ancora un nick, chiedilo PRIMA di giocare
            // (memorizza la modalità scelta e apri il gate).
            if (!nick) {
              pendingStep.current = chosenStep;
              setShowGate(true);
              return;
            }
            startPlay(chosenStep);
          }}
          onTutorial={onTutorial}
        />
      )}

      {/* ── Tutorial (prima volta obbligatorio, poi facoltativo) ── */}
      {showTutorial && (
        <>
          <style>{ANGOLI_TUTORIAL_CSS}</style>
          <GameTutorial
            gameKey="angoli"
            steps={ANGOLI_INTRO_STEPS}
            accentColor="#7c3aed"
            darkBg="#2a1150"
            dark={dark}
            onDone={() => {
              setShowTutorial(false);
              // Se aperto da "Come si gioca" (chainTour) e siamo su desktop, prosegui
              // col tour guidato restando nel menu. Altrimenti chiudi il menu e gioca.
              if (chainTour.current && showMenu && isDesktop()) {
                chainTour.current = false;
                setShowTour(true);
              } else {
                chainTour.current = false;
                setShowMenu(false);
              }
            }}
          />
        </>
      )}

      {/* ── Tour guidato a riflettore (solo desktop) ── */}
      {showTour && showMenu && (
        <HomeTour
          steps={HOME_TOUR}
          onDone={onTourDone}
          onCloseModals={() => { setShowLeaderboard(false); }}
        />
      )}

      {/* ── Header ── */}
      <header className="ang-header">
        <div className="ang-hdr-left">
          <Link to="/#progetti" className="ang-iconbtn" aria-label="Torna ai progetti"><ArrowLeft size={20}/></Link>
          <h1 className="ang-title">ANG<span className="ang-accent">OL</span>I</h1>
        </div>
        <div className="ang-hdr-center">
          <button className="ang-mode-pill" onClick={()=>setShowMenu(true)} aria-label="Apri il menu modalità">
            <Layers size={14}/>
            <span>Menu</span>
          </button>
        </div>
        <div className="ang-hdr-right">
          <button className="ang-iconbtn" onClick={()=>setShowLeaderboard(true)} aria-label="Classifica"><ListOrdered size={16}/></button>
          <button className="ang-iconbtn" onClick={newGame} aria-label="Nuova partita"><RotateCcw size={16}/></button>
          <button className="ang-iconbtn" onClick={toggleDark} aria-label="Cambia tema">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button className="ang-iconbtn" onClick={()=>setShowTutorial(true)} aria-label="Come si gioca">
            <HelpCircle size={16}/>
          </button>
        </div>
      </header>

      {/* La difficoltà si cambia dal Menu (pill "Menu" nell'header → AngoliMenu). */}

      {/* ── Game area ── */}
      <div className="ang-stage">

        {/* ── SVG angolo (colori random ogni round) ── */}
        <div className="ang-game">
          <div className="ang-fig-wrap">
            <AngleDisplay angle={angle} rotation={rotation} palette={palette} spin={spin}/>
            {/* Countdown della sessione (1 minuto): badge prominente che lampeggia
                in rosso negli ultimi 10 secondi. */}
            <span className={`badge ang-chrono${remaining<=10000?" ang-chrono--low":""}${gameState!=="playing"?" ang-chrono--stop":""}`}>
              <Timer size={14} aria-hidden="true" />
              <span className="ang-chrono-val">{fmtCountdown(remaining)}</span>
            </span>
          </div>
        </div>

        {/* ── Right: pannello di gioco ── */}
        <aside className="ang-ctrl-block" aria-label="Pannello di gioco">

          {/* Stats row: Punti sessione · Streak · Record punti */}
          <div className="ang-card-stats">
            <div className="ang-card-stat">
              <Award size={20} aria-hidden="true" className="ang-card-stat-ico" />
              <span className="ang-card-stat-val" title={total.toLocaleString("it-IT")}>{fmtCompact(total)}</span>
              <span className="ang-card-stat-lbl">Punti</span>
            </div>
            <div className="ang-card-stat ang-card-stat--mid">
              <Flame size={20} aria-hidden="true" className="ang-card-stat-ico" />
              <span className="ang-card-stat-val">{strike}</span>
              <span className="ang-card-stat-lbl">Streak</span>
            </div>
            <div className="ang-card-stat ang-card-stat--mid">
              <Trophy size={20} aria-hidden="true" className="ang-card-stat-ico" />
              <span className="ang-card-stat-val" title={bestTotal.toLocaleString("it-IT")}>{fmtCompact(bestTotal)}</span>
              <span className="ang-card-stat-lbl">Record</span>
            </div>
          </div>

          {/* Contenuto scambiabile: playing ↔ won ↔ over con transizione */}
          {gameState==="over" ? (
            <div className="ang-panel ang-panel--over" key="over">
              <div className="ang-over">
                <span className="ang-over-emoji">⏱️</span>
                <span className="ang-over-label">Tempo scaduto!</span>
                <span className="ang-over-total">{total.toLocaleString("it-IT")}</span>
                <span className="ang-over-pts">punti</span>
                <div className="ang-wr-grid">
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">{solved}</span>
                    <span className="ang-wr-sub">{solved===1?"angolo":"angoli"}</span>
                  </div>
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">{best}</span>
                    <span className="ang-wr-sub">streak max</span>
                  </div>
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">{bestTotal.toLocaleString("it-IT")}</span>
                    <span className="ang-wr-sub">record</span>
                  </div>
                </div>
                <div className="ang-over-status">
                  {!nick
                    ? "Imposta un nickname per salvare in classifica."
                    : submitting ? "Salvataggio in classifica…"
                    : submitted ? "✓ Salvato in classifica!"
                    : total>0 ? "" : "Nessun punto: riprova!"}
                </div>
              </div>
              <button type="button" className="ang-next" onClick={()=>startSession()}>
                Rigioca <RotateCcw size={16}/>
              </button>
              <button type="button" className="ang-next ang-next--ghost" onClick={()=>setShowLeaderboard(true)}>
                Classifica <ListOrdered size={16}/>
              </button>
            </div>
          ) : gameState==="playing" ? (
            <div className="ang-panel ang-panel--play" key={`p-${spin}`}>

              {/* Comandi */}
              <ul className="ang-legend-list">
                <li>
                  <span className="ang-legend-keys"><kbd>0</kbd><span className="ang-legend-dash">–</span><kbd>9</kbd></span>
                  <span className="ang-legend-txt">Digita la misura in gradianti</span>
                </li>
                <li>
                  <span className="ang-legend-keys"><kbd className="ang-kbd-up">↑</kbd><kbd className="ang-kbd-dn">↓</kbd></span>
                  <span className="ang-legend-txt">Indizio: <b className="ang-kbd-up">maggiore</b> / <b className="ang-kbd-dn">minore</b></span>
                </li>
              </ul>

              {/* Input display */}
              <div className={`ang-input-box${shake?" ang-shake":""}`}>
                {msg
                  ? <span className="ang-input-msg">{msg}</span>
                  : <><span className="ang-iv">{input||"···"}</span><span className="ang-iu">g</span></>}
              </div>

              {/* History */}
              {history.length>0 && (
                <div className="ang-hist">
                  {history.map((h,i)=>(
                    <div key={i} className={`ang-hrow ang-hrow--${h.hint}`}>
                      <span className="ang-hn">#{i+1}</span>
                      <span className="ang-hv">{h.guess}g</span>
                      <span className="ang-ha">{h.hint==="maggiore"?"↑":"↓"}</span>
                      <span className="ang-hl">{h.hint==="maggiore"?"più grande":"più piccolo"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tastiera numerica */}
              <div className="ang-keyboard">
                {[["1","2","3"],["4","5","6"],["7","8","9"]].map((row,ri)=>(
                  <div key={ri} className="ang-krow">
                    {row.map(k=><button key={k} type="button" className="ang-key" onClick={()=>numpad(k)}>{k}</button>)}
                  </div>
                ))}
                <div className="ang-krow">
                  <button type="button" className="ang-key ang-key--del" onClick={()=>numpad("CANC")} aria-label="Cancella"><Delete size={18}/></button>
                  <button type="button" className="ang-key" onClick={()=>numpad("0")}>0</button>
                  <button type="button" className="ang-key ang-key--ok" onClick={()=>numpad("INVIO")} aria-label="Conferma"><CornerDownLeft size={18}/></button>
                </div>
              </div>
            </div>
          ) : (
            <div className="ang-panel ang-panel--won" key="won">
              <div className="ang-win-reveal">
                <span className="ang-wr-e">{getScoreEmoji(roundScore)}</span>
                <span className="ang-wr-label">L'angolo era</span>
                <span className="ang-wr-a">{angle}g</span>
                <div className="ang-wr-grid">
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">+{roundScore.toLocaleString("it-IT")}</span>
                    <span className="ang-wr-sub">punti</span>
                  </div>
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">{fmtTime(elapsed)}</span>
                    <span className="ang-wr-sub">tempo</span>
                  </div>
                  <div className="ang-wr-cell">
                    <span className="ang-wr-num">{total.toLocaleString("it-IT")}</span>
                    <span className="ang-wr-sub">totale</span>
                  </div>
                </div>
              </div>
              <button type="button" className="ang-next" onClick={()=>nextRound()}>
                Prossimo angolo <RotateCcw size={16}/>
              </button>
            </div>
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

      {/* ── Classifica live ── */}
      {showLeaderboard && (
        <Leaderboard
          dark={dark}
          myNick={nick}
          justSubmitted={submitted}
          onClose={()=>setShowLeaderboard(false)}
        />
      )}

      {/* ── Gate nickname: chiesto premendo "Gioca" (o "cambia nickname") ── */}
      {showGate && (
        <NicknameGate
          dark={dark}
          initial={nick}
          onConfirm={(n)=>{
            setNick(n);
            setShowGate(false);
            const ps = pendingStep.current;
            pendingStep.current = null;
            if (ps != null) startPlay(ps);
          }}
        />
      )}

      <style>{`
        .ang-page {
          /* ── Token Kit Italia (Bootstrap Italia 2.18.1) ── */
          --green:      hsl(160, 100%, 25%);  /* --bs-success */
          --green-dark: hsl(160, 100%, 19%);
          --amber:      hsl(36, 100%, 30%);   /* --bs-warning */
          --absent:     hsl(350, 60%, 50%);   /* --bs-danger */
          --bs-100:     hsl(0, 0%, 96%);
          --bs-200:     hsl(0, 0%, 90%);
          --bs-300:     hsl(0, 0%, 83%);
          --radius:     8px;                  /* --bs-border-radius-lg */
          --radius-sm:  4px;                  /* --bs-border-radius */
          --focus-ring: 0 0 0 .25rem rgba(0,127.5,85,.25);  /* success focus */
          --shadow-key: 0 .125rem .25rem rgba(0,0,0,.075);
          --shadow-card: 0 .5rem 1rem rgba(0,0,0,.12);
          --hdr-h: 52px;

          /* ── Token tematici (default = chiaro; sovrascritti in .dark) ── */
          --surface:    #f4f6f5;   /* sfondo pagina/stage */
          --bar-bg:     #ffffff;   /* striscia barra modalità */
          --bar-border: var(--bs-200);
          --panel:      #ffffff;   /* card di gioco */
          --panel-bd:   var(--bs-300);
          --key-bg:     var(--bs-100);
          --key-bg-h:   var(--bs-200);
          --key-bg-a:   var(--bs-300);
          --key-fg:     var(--green);
          --chip-bg:    var(--bs-100);
          --chip-bd:    var(--bs-200);
          --chip-fg:    hsl(210,33%,28%);
          --chip-step-bg: rgba(0,0,0,0.06);
          --chip-step-fg: hsl(210,17%,44%);
          --text:       #17271d;
          --text-soft:  #3c4a41;
          --stat-bg:    rgba(0,127,85,0.06);
          --stat-bd:    rgba(0,127,85,0.16);
          --legend-sep: var(--bs-200);
          --kbd-bg:     #eef1ef;
          --kbd-bd:     #c5d1ca;
          --kbd-fg:     #17271d;

          height: 100dvh;
          overflow: hidden;
          background: var(--surface);
          color: var(--text);
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
          padding:0 0.75rem; height:var(--hdr-h); background:#103820; color:#fff;
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

        /* ── Stage: occupa esattamente viewport − header, niente scroll ── */
        .ang-stage {
          flex:1 1 0; min-height:0; width:100%;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          gap:14px; padding:14px 16px;
          overflow:hidden;
        }

        /* ── Figura ── */
        .ang-game { display:flex; align-items:center; justify-content:center; flex:0 1 auto; min-height:0; }
        .ang-fig-wrap {
          position:relative;
          width:  min(72vw, 38vh, 300px);
          height: min(72vw, 38vh, 300px);
          display:flex; align-items:center; justify-content:center;
        }
        .ang-svg { display:block; width:100%; height:100%; overflow:visible; }

        /* Alone neon pulsante (solo opacità → pulito su chiaro e scuro) */
        .ang-glow { animation:ang-pulse 3s ease-in-out infinite; }
        @keyframes ang-pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }

        /* Disegno animato dell'angolo ad ogni round.
           dasharray/offset reali sono impostati inline nello SVG; qui solo i tempi. */
        .ang-vertex  { transform-origin:200px 200px; animation:ang-pop .4s cubic-bezier(.34,1.7,.5,1) both; }
        .ang-ray     { animation:ang-draw .55s ease forwards; }
        .ang-ray2    { animation-delay:.12s; }
        .ang-head    { opacity:0; animation:ang-fade .3s ease .55s forwards; }
        .ang-head2   { animation-delay:.67s; }
        .ang-arc     { animation:ang-draw .6s ease .35s forwards; }
        .ang-arcfill { opacity:0; transform-origin:200px 200px; animation:ang-fade .5s ease .5s forwards; }
        @keyframes ang-draw { to{stroke-dashoffset:0} }
        @keyframes ang-fade { to{opacity:1} }
        @keyframes ang-pop  { from{transform:scale(0)} to{transform:scale(1)} }

        /* Cronometro: badge Kit Italia (.badge come base) */
        .ang-chrono {
          position:absolute; top:6px; left:50%; transform:translateX(-50%);
          display:inline-flex; align-items:center; gap:.4rem;
          background:var(--green-dark); color:#fff;
          padding:.4em .7em; border-radius:var(--radius-sm);
          font-family:var(--bs-font-monospace,"Roboto Mono",monospace);
          font-weight:500; font-size:1rem; line-height:1; letter-spacing:.02em;
          box-shadow:var(--shadow-key);
        }
        .ang-chrono-val { font-variant-numeric:tabular-nums; min-width:62px; text-align:center; }
        .ang-chrono--stop { background:var(--green); animation:ang-chrono-stop .4s ease; }
        @keyframes ang-chrono-stop { 0%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.12)} 100%{transform:translateX(-50%) scale(1)} }
        /* Ultimi 10 secondi: rosso pulsante per dare urgenza. */
        .ang-chrono--low { background:#c0392b; animation:ang-chrono-low .8s ease-in-out infinite; }
        @keyframes ang-chrono-low {
          0%,100%{ transform:translateX(-50%) scale(1); box-shadow:0 0 0 0 rgba(192,57,43,.5); }
          50%{ transform:translateX(-50%) scale(1.06); box-shadow:0 0 0 6px rgba(192,57,43,0); }
        }

        /* ── Card di gioco (pattern card Kit Italia) ── */
        .ang-ctrl-block {
          flex:0 0 auto; width:min(94vw,340px);
          background:var(--panel); border:1px solid var(--panel-bd);
          border-radius:var(--radius); padding:0.85rem 0.9rem;
          display:flex; flex-direction:column;
          box-shadow:var(--shadow-card);
        }

        /* ── Stats row: Streak + Record (2 celle grandi) ── */
        .ang-card-stats {
          display:flex; align-items:stretch;
          margin-bottom:0.75rem; flex-shrink:0;
          background:var(--stat-bg); border:1px solid var(--stat-bd);
          border-radius:var(--radius); padding:0.55rem 0.4rem; gap:0.4rem;
        }
        .ang-card-stat {
          flex:1; min-width:0; display:grid;
          grid-template-columns:auto minmax(0,1fr); grid-template-rows:auto auto;
          align-items:center; column-gap:0.5rem; row-gap:0;
          padding:0.1rem 0.5rem; color:var(--green-dark);
        }
        .ang-card-stat-ico { grid-row:1 / span 2; color:var(--green); }
        .ang-card-stat-val {
          font-size:1.5rem; font-weight:800; line-height:1;
          font-variant-numeric:tabular-nums; align-self:end;
          min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .ang-card-stat-lbl {
          font-size:0.58rem; font-weight:700; text-transform:uppercase;
          letter-spacing:0.08em; opacity:0.7; align-self:start;
        }
        .ang-card-stat--mid { border-left:1px solid var(--stat-bd); padding-left:0.7rem; }

        /* Pannello scambiabile play/won */
        .ang-panel { display:flex; flex-direction:column; gap:0.55rem; animation:ang-panel-in .3s ease; }
        .ang-panel--won { gap:0.7rem; }
        @keyframes ang-panel-in { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }

        /* ── Comandi: 2 righe pulite con tasti Kit Italia ── */
        .ang-legend-list {
          list-style:none; margin:0; padding:0;
          display:flex; flex-direction:column; gap:0.4rem;
          padding-bottom:0.55rem; border-bottom:1px solid var(--legend-sep);
        }
        .ang-legend-list li {
          display:flex; align-items:center; gap:0.6rem;
          font-size:0.78rem; color:var(--text-soft); line-height:1.2;
        }
        .ang-legend-keys { display:inline-flex; align-items:center; gap:0.2rem; flex-shrink:0; min-width:62px; }
        .ang-legend-dash { color:var(--text-soft); opacity:0.6; font-weight:700; }
        .ang-legend-txt { flex:1; }
        .ang-legend-list kbd {
          display:inline-flex; align-items:center; justify-content:center;
          background:var(--kbd-bg); border:1px solid var(--kbd-bd); border-bottom-width:2px;
          border-radius:var(--radius-sm); min-width:1.5rem; height:1.5rem; padding:0 0.35rem;
          font-family:var(--bs-font-monospace,"Roboto Mono",monospace);
          font-size:0.82rem; font-weight:700; color:var(--kbd-fg);
        }
        .ang-kbd-up { color:var(--green); }
        .ang-kbd-dn { color:var(--absent); }
        b.ang-kbd-up,b.ang-kbd-dn { font-weight:800; }

        /* ── Input display (stile form-control Kit Italia) ── */
        .ang-input-box {
          background:#fff; border:1px solid var(--bs-300); border-radius:var(--radius-sm);
          padding:0.45rem 0.9rem; display:flex; align-items:baseline;
          gap:4px; justify-content:center; transition:border-color .15s, box-shadow .15s;
          min-height:46px; box-shadow:inset 0 1px 2px rgba(0,0,0,.075);
        }
        .ang-iv { font-size:1.8rem; font-weight:800; color:#17271d; letter-spacing:.04em; text-align:right; line-height:1; }
        .ang-iu { font-size:1rem; font-weight:700; color:#6b8070; }
        .ang-input-msg { font-size:0.95rem; font-weight:700; color:var(--absent); align-self:center; animation:ang-fade .15s ease; }
        .ang-shake { animation:ang-shake .45s; border-color:var(--absent); }
        @keyframes ang-shake {
          10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)}
          30%,50%,70%{transform:translateX(-7px)} 40%,60%{transform:translateX(7px)}
        }

        /* ── Win reveal ── */
        .ang-win-reveal {
          display:flex; flex-direction:column; align-items:center; gap:0.25rem;
          background:linear-gradient(160deg,rgba(47,125,74,0.08),rgba(217,164,0,0.06));
          border:2px solid rgba(47,125,74,0.2); border-radius:12px;
          padding:0.9rem 0.9rem;
          animation:ang-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .ang-wr-e { font-size:2.2rem; line-height:1; animation:ang-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        .ang-wr-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#6b8070; }
        .ang-wr-a { font-size:2rem; color:var(--green); font-weight:900; line-height:1; }
        .ang-wr-grid { display:flex; gap:0.4rem; width:100%; margin-top:0.5rem; }
        .ang-wr-cell {
          flex:1; display:flex; flex-direction:column; align-items:center; gap:0.1rem;
          background:rgba(255,255,255,0.6); border:1px solid rgba(47,125,74,0.13);
          border-radius:8px; padding:0.4rem 0.2rem;
        }
        .ang-wr-num { font-size:0.95rem; font-weight:800; color:var(--green-dark); font-variant-numeric:tabular-nums; }
        .ang-wr-sub { font-size:0.55rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#6b8070; }
        @keyframes ang-slide-up { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* ── History ── */
        .ang-hist { display:flex; flex-direction:column; gap:3px; max-height:90px; overflow-y:auto; }
        .ang-hrow {
          display:flex; align-items:center; gap:7px;
          padding:5px 9px; border-radius:6px; font-size:.8rem;
          animation:ang-slide-in .22s ease;
        }
        .ang-hrow--maggiore { background:rgba(47,125,74,0.09); border-left:3px solid var(--green); }
        .ang-hrow--minore   { background:rgba(192,57,43,0.09);  border-left:3px solid var(--absent); }
        .ang-hn { color:#6b8070; font-size:.7rem; width:22px; flex-shrink:0; }
        .ang-hv { font-weight:800; width:48px; flex-shrink:0; }
        .ang-ha { font-size:1rem; font-weight:800; }
        .ang-hrow--maggiore .ang-ha,.ang-hrow--maggiore .ang-hl { color:var(--green); font-weight:700; }
        .ang-hrow--minore .ang-ha,.ang-hrow--minore .ang-hl     { color:var(--absent); font-weight:700; }
        .ang-hl { font-size:.74rem; }
        @keyframes ang-slide-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }

        /* ── Tastiera numerica: tasti pieni grigio-chiaro, numero verde ──
           Bordo trasparente fisso (cambia solo colore, mai larghezza) →
           niente "salto"/lampeggio del contorno tra hover/focus/active. */
        .ang-keyboard { display:flex; flex-direction:column; gap:8px; }
        .ang-krow { display:flex; gap:8px; }
        .ang-key {
          flex:1; min-width:0; height:56px;
          display:inline-flex; align-items:center; justify-content:center;
          border:2px solid transparent; border-radius:var(--radius-sm);
          background:var(--key-bg); color:var(--key-fg); box-shadow:var(--shadow-key);
          font-size:1.5rem; font-weight:800; cursor:pointer; font-family:inherit;
          -webkit-tap-highlight-color:transparent;
          transition:transform .07s, background .12s, color .12s, border-color .12s;
        }
        .ang-key:hover  { background:var(--key-bg-h); }
        /* focus solo da tastiera (Tab), MAI dopo un click/tap → nessun bordo "fantasma" */
        .ang-key:focus { outline:none; }
        .ang-key:focus-visible { outline:none; border-color:var(--green); box-shadow:var(--focus-ring); }
        .ang-key:active { transform:scale(.94); background:var(--key-bg-a); }
        .ang-key--del   { background:#fbeceb; color:var(--absent); }
        .ang-key--del:hover { background:#f7dcd9; }
        .ang-key--del:focus-visible { border-color:var(--absent); }
        .ang-key--ok    { background:var(--green); color:#fff; box-shadow:0 .125rem .25rem rgba(0,127,85,.3); }
        .ang-key--ok:hover { background:var(--green-dark); }
        .ang-key--ok:active { background:var(--green-dark); }

        /* ── Prossimo (pattern .btn-primary pieno Kit Italia) ── */
        .ang-next {
          width:100%; height:48px;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:var(--green); color:#fff; border:1px solid var(--green);
          border-radius:var(--radius-sm); font-family:inherit; font-size:1rem; font-weight:700; cursor:pointer;
          box-shadow:var(--shadow-key);
          animation:ang-slide-up .35s cubic-bezier(.34,1.56,.64,1);
          transition:background .15s,transform .1s,box-shadow .15s;
        }
        .ang-next:hover { background:var(--green-dark); border-color:var(--green-dark); transform:translateY(-1px); }
        .ang-next:focus-visible { outline:none; box-shadow:var(--focus-ring); }
        .ang-next:active { transform:scale(.98); }
        /* Variante "ghost" (Classifica nel game over) */
        .ang-next--ghost {
          background:transparent; color:var(--green); border:1.5px solid var(--panel-bd);
          box-shadow:none; height:42px; margin-top:.45rem; font-weight:700;
        }
        .ang-next--ghost:hover { background:var(--stat-bg); border-color:var(--green); transform:none; }

        /* ── Game over (minuto scaduto) ── */
        .ang-panel--over { gap:0.7rem; }
        .ang-over {
          display:flex; flex-direction:column; align-items:center; gap:0.1rem;
          background:linear-gradient(160deg,rgba(192,57,43,0.08),rgba(217,164,0,0.06));
          border:2px solid rgba(192,57,43,0.18); border-radius:12px;
          padding:1rem 0.9rem 0.85rem;
          animation:ang-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .ang-over-emoji { font-size:2.4rem; line-height:1; animation:ang-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        .ang-over-label { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#c0392b; margin-top:.2rem; }
        .ang-over-total { font-size:2.6rem; font-weight:900; line-height:1; color:var(--green); font-variant-numeric:tabular-nums; margin-top:.1rem; }
        .ang-over-pts { font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#6b8070; }
        .ang-over-status { font-size:0.74rem; font-weight:700; color:var(--green-dark); margin-top:.55rem; min-height:1rem; text-align:center; }
        .ang-page.dark .ang-over { background:linear-gradient(160deg,rgba(204,51,76,0.14),rgba(217,164,0,0.08)); border-color:rgba(204,51,76,0.28); }
        .ang-page.dark .ang-over-pts { color:#8fc7a6; }
        .ang-page.dark .ang-over-status { color:#9ff0c2; }

        /* ── Mobile: nascondi i comandi testuali per risparmiare spazio ── */
        @media (max-width: 759px) {
          .ang-legend { display:none; }
        }

        /* ── Desktop: figura + card affiancate, centrate, senza scroll ── */
        @media (min-width: 760px) {
          .ang-page { --hdr-h: 56px; }
          .ang-header {
            display:grid; grid-template-columns:1fr auto 1fr;
            padding:0 1.25rem;
          }
          .ang-hdr-left  { justify-self:start; gap:0.75rem; }
          .ang-hdr-center{ display:flex; align-items:center; justify-content:center; }
          .ang-hdr-right { justify-self:end; gap:0.5rem; }
          .ang-mode-pill { padding:0.3rem 0.85rem 0.3rem 0.65rem; font-size:0.8rem; }

          .ang-stage {
            flex-direction:row; align-items:center; justify-content:center;
            gap:2.5rem; padding:1.5rem 2rem;
          }
          .ang-fig-wrap {
            width:  clamp(220px, calc(100dvh - var(--hdr-h) - 3rem), 460px);
            height: clamp(220px, calc(100dvh - var(--hdr-h) - 3rem), 460px);
          }
          .ang-chrono { font-size:0.95rem; padding:.32rem .85rem; }
          .ang-chrono-val { min-width:74px; }

          .ang-ctrl-block {
            flex:0 0 320px; width:320px;
            padding:1rem 1.1rem;
          }
          .ang-legend-list li { font-size:0.78rem; }
        }

        /* ════════════════ DARK MODE (rifatta, coerente Kit Italia) ════════════════
           Palette su base --bs-dark hsl(210,54%,20%): superfici blu-verdi scure,
           bordi e testi verdi tenui. I componenti usano i token tematici → la
           barra modalità e tutte le superfici diventano scure insieme. */
        .ang-page.dark {
          --green:      hsl(160, 70%, 42%);   /* verde più luminoso, leggibile su scuro */
          --green-dark: hsl(160, 70%, 34%);
          --surface:    #0e1512;              /* sfondo pagina/stage */
          --bar-bg:     #13201a;              /* striscia barra modalità (NON più bianca) */
          --bar-border: rgba(95,208,154,0.16);
          --panel:      #15231c;              /* card di gioco */
          --panel-bd:   rgba(95,208,154,0.18);
          --key-bg:     #1d2e25;
          --key-bg-h:   #26392e;
          --key-bg-a:   #16241d;
          --key-fg:     #6fe0a6;
          --chip-bg:    #1b2a22;
          --chip-bd:    rgba(95,208,154,0.18);
          --chip-fg:    #b9d8c5;
          --chip-step-bg: rgba(255,255,255,0.10);
          --chip-step-fg: #8fc7a6;
          --text:       #d4e8dc;
          --text-soft:  #a4c4aa;
          --stat-bg:    rgba(95,208,154,0.07);
          --stat-bd:    rgba(95,208,154,0.18);
          --legend-sep: rgba(95,208,154,0.16);
          --kbd-bg:     #22332a;
          --kbd-bd:     #3a5040;
          --kbd-fg:     #c8e0cc;
          --shadow-card: 0 .5rem 1.25rem rgba(0,0,0,0.45);
          --shadow-key:  0 .125rem .25rem rgba(0,0,0,0.25);
        }

        /* Header e barra: tinta scura coerente */
        .ang-page.dark .ang-header { background:#0a1410; }
        .ang-page.dark .ang-stage  { background:radial-gradient(ellipse at 38% 42%, #13201a 0%, var(--surface) 70%); }

        /* Stats row: numero più luminoso su scuro (icone/bordi via token) */
        .ang-page.dark .ang-card-stat { color:#6fe0a6; }
        .ang-page.dark .ang-card-stat-ico { color:#6fe0a6; }

        /* Input */
        .ang-page.dark .ang-input-box { background:#0c1410; border-color:rgba(95,208,154,0.22); color:var(--text); box-shadow:inset 0 1px 2px rgba(0,0,0,.35); }
        .ang-page.dark .ang-iv { color:var(--text); }
        .ang-page.dark .ang-iu { color:#8fc7a6; }

        /* Tastiera */
        .ang-page.dark .ang-key--del { background:#33211f; color:#f0a79e; }
        .ang-page.dark .ang-key--del:hover { background:#412825; }
        .ang-page.dark .ang-key--ok { background:var(--green); color:#06160e; }
        .ang-page.dark .ang-key--ok:hover { background:var(--green-dark); }

        /* Win reveal */
        .ang-page.dark .ang-win-reveal {
          background:linear-gradient(160deg,rgba(95,208,154,0.12),rgba(217,164,0,0.08));
          border-color:rgba(95,208,154,0.25);
        }
        .ang-page.dark .ang-wr-label,.ang-page.dark .ang-wr-sub { color:#8fc7a6; }
        .ang-page.dark .ang-wr-num { color:#6fe0a6; }
        .ang-page.dark .ang-wr-cell { background:rgba(255,255,255,0.04); border-color:rgba(95,208,154,0.2); }

        /* History */
        .ang-page.dark .ang-hrow--maggiore { background:rgba(95,208,154,0.12); }
        .ang-page.dark .ang-hrow--minore   { background:rgba(204,51,76,0.16); }
        .ang-page.dark .ang-hn { color:#8fc7a6; }

        /* Cronometro */
        .ang-page.dark .ang-chrono { background:#0a1410; color:#6fe0a6; box-shadow:0 .125rem .5rem rgba(0,0,0,.4); }
        .ang-page.dark .ang-chrono--stop { background:var(--green); color:#06160e; }

        /* Trophy */
        .ang-page.dark .ang-tcard { background:#15231c; }
        .ang-page.dark .ang-tdesc { color:#8fc7a6; }
        .ang-page.dark .ang-tsub  { color:var(--text); }

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
