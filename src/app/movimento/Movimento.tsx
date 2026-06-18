import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, RotateCcw, Trophy, Flame, Moon, Sun, HelpCircle, Layers, Eye, Pencil, Target, Award } from "lucide-react";
import GameTutorial, { hasSeenTutorial, type IntroStep } from "../components/GameIntro";
import MovimentoMenu, { MODES, type LevelMode } from "./MovimentoMenu";

// Mappa livello → durata della fase "guarda" (ms): più alto il livello, meno
// tempo hai per memorizzare la curva prima che sparisca.
const WATCH_MS_BY_LEVEL: Record<LevelMode, number> = { 1: 3000, 2: 2500, 3: 2000, 4: 1500, 5: 1100 };

// ─── Costanti ───────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 5;
// Soglia (su 100) per considerare il round "superato" (alimenta la streak).
// Severo: serve un disegno davvero somigliante per tenere viva la streak.
const PASS_100 = 70;

const TROPHIES = [
  { streak: 10, emoji: "🏆", label: "Maestro del Movimento", desc: "10 percorsi di fila. La tua memoria non sbaglia un colpo.", accent: "#c8a415" },
  { streak: 7,  emoji: "🥇", label: "Tracciatore Provetto",  desc: "7 percorsi di fila. Mano e mente sono una cosa sola.",   accent: "#B8960C" },
  { streak: 5,  emoji: "🥈", label: "Tracciatore Esperto",   desc: "5 percorsi di fila. Il gesto è ormai sicuro.",          accent: "#7A8C99" },
  { streak: 3,  emoji: "🥉", label: "Tracciatore Novizio",   desc: "3 percorsi di fila. Hai trovato il ritmo.",             accent: "#A0674A" },
] as const;

// ─── Tipi ───────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };               // coordinate normalizzate 0..1
type Phase = "watch" | "draw" | "result" | "over"; // fasi del round / fine partita

// ─── Generazione del percorso: curva morbida libera ──────────────────────────
// Una catena di control point casuali ma armonici (dentro un margine sicuro),
// interpolata con una spline Catmull-Rom → curva fluida tipo lo screenshot.
// La griglia 10×10 è solo sfondo: il percorso NON passa per i nodi.

const GRID = 10;        // griglia di sfondo (10×10)
const MARGIN = 0.1;     // i punti restano dentro [MARGIN, 1-MARGIN]

function rand(a: number, b: number) { return a + Math.random() * (b - a); }

// Interpola una catena di anchor con Catmull-Rom, restituendo punti fitti.
function catmullRom(anchors: Pt[], perSeg = 22): Pt[] {
  if (anchors.length < 2) return anchors.slice();
  const pts = [anchors[0], ...anchors, anchors[anchors.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(anchors[anchors.length - 1]);
  return out;
}

// Crea il percorso del round: 4–6 anchor, partenza da un lato, deriva graduale
// così la curva attraversa la tela senza tornare brutalmente su sé stessa.
function makePath(): Pt[] {
  const n = 4 + Math.floor(Math.random() * 3); // 4..6 anchor
  const lo = MARGIN, hi = 1 - MARGIN;
  const anchors: Pt[] = [];
  // partenza vicino a un bordo, in basso o di lato (come lo screenshot a S)
  let x = rand(lo, lo + 0.18);
  let y = rand(hi - 0.18, hi);
  anchors.push({ x, y });
  for (let i = 1; i < n; i++) {
    // passo casuale ma sempre verso destra/alto in media → curva ampia
    x = Math.min(hi, Math.max(lo, x + rand(0.12, 0.30)));
    y = Math.min(hi, Math.max(lo, y + rand(-0.34, 0.18)));
    anchors.push({ x, y });
  }
  return catmullRom(anchors);
}

// Ricampiona una polilinea a N punti equispaziati per arclength.
function resample(pts: Pt[], count = 96): Pt[] {
  if (pts.length < 2) return pts.length ? new Array(count).fill(pts[0]) : [];
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (target - cum[j]) / seg;
    out.push({ x: pts[j].x + (pts[j + 1].x - pts[j].x) * t, y: pts[j].y + (pts[j + 1].y - pts[j].y) * t });
  }
  return out;
}

function pathLength(pts: Pt[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}

type SubScores = { shape: number; position: number; length: number; total: number };

// Confronto severo. Tre componenti, ognuna 0..100:
//  · POSITION — quanto i punti del disegno cadono SOPRA il percorso vero
//    (errore medio punto-a-punto dopo il ricampionamento per arclength).
//  · SHAPE    — stessa misura ma su entrambe le curve centrate e normalizzate
//    in scala (toglie posizione e dimensione → conta solo la forma).
//  · LENGTH   — quanto la lunghezza del tratto somiglia a quella del percorso.
// La curva di errore è ripida (esponenziale) → un disegno mediocre crolla.
function scorePath(drawing: Pt[], target: Pt[]): SubScores {
  if (drawing.length < 2) return { shape: 0, position: 0, length: 0, total: 0 };
  const A = resample(target);
  const B = resample(drawing);

  // POSITION: errore medio assoluto (in unità di tela 0..1), curva severa.
  let posErr = 0;
  for (let i = 0; i < A.length; i++) posErr += Math.hypot(A[i].x - B[i].x, A[i].y - B[i].y);
  posErr /= A.length;
  // 0 err → 100 ; ~0.18 err → ~0 . exp(-err/0.06) è molto severo.
  const position = 100 * Math.exp(-posErr / 0.06);

  // SHAPE: normalizza entrambe (centro + scala RMS) e confronta.
  const norm = (p: Pt[]) => {
    const cx = p.reduce((s, q) => s + q.x, 0) / p.length;
    const cy = p.reduce((s, q) => s + q.y, 0) / p.length;
    let rms = 0;
    for (const q of p) rms += (q.x - cx) ** 2 + (q.y - cy) ** 2;
    rms = Math.sqrt(rms / p.length) || 1;
    return p.map(q => ({ x: (q.x - cx) / rms, y: (q.y - cy) / rms }));
  };
  const nA = norm(A), nB = norm(B);
  let shapeErr = 0;
  for (let i = 0; i < nA.length; i++) shapeErr += Math.hypot(nA[i].x - nB[i].x, nA[i].y - nB[i].y);
  shapeErr /= nA.length;
  const shape = 100 * Math.exp(-shapeErr / 0.5);

  // LENGTH: rapporto tra lunghezze (penalizza tratti troppo corti/lunghi).
  const lA = pathLength(A), lB = pathLength(B);
  const ratio = lA > 0 ? Math.min(lA, lB) / Math.max(lA, lB) : 0;
  const length = 100 * Math.pow(ratio, 2.2);

  // Totale pesato: la forma e la posizione contano più della lunghezza.
  const total = shape * 0.45 + position * 0.4 + length * 0.15;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return { shape: clamp(shape), position: clamp(position), length: clamp(length), total: clamp(total) };
}

// Punti del round (0..1000) dal totale 0..100.
function roundPoints(total100: number): number {
  return Math.round(total100 * 10);
}
// Formatta un punteggio 0..100 con due decimali e virgola (it-IT).
function fmt2(v: number): string {
  return v.toFixed(2).replace(".", ",");
}

function getScoreEmoji(total100: number): string {
  if (total100 >= 97) return "🏆"; if (total100 >= 90) return "⭐"; if (total100 >= 80) return "🎯";
  if (total100 >= PASS_100) return "👏"; if (total100 >= 40) return "😅"; return "😮‍💨";
}
function getTrophyForStreak(n: number): (typeof TROPHIES)[number] | null {
  return TROPHIES.find(t => t.streak === n) ?? null;
}

// ─── Tutorial: visual animati (classi mtv-) ──────────────────────────────────

function WatchVisual() {
  // Un pallino percorre una curva: la traccia si "scopre" e il pallino avanza.
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className="mtv-watch" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <path className="mtv-track" d="M24 110 C 60 110, 70 36, 110 60 S 170 110, 196 34" fill="none" stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" />
      <circle className="mtv-mover" r="8" fill="#1F6B3D" />
      <circle cx="24" cy="110" r="5" fill="#D9A400" />
    </svg>
  );
}
function DrawVisual() {
  // Una mano-gesto ridisegna il tracciato tratteggiato.
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className="mtv-draw" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <path d="M24 110 C 60 110, 70 36, 110 60 S 170 110, 196 34" fill="none" stroke="rgba(47,125,74,0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 9" />
      <path className="mtv-trace" d="M24 110 C 60 110, 70 36, 110 60 S 170 110, 196 34" fill="none" stroke="#D9A400" strokeWidth="4" strokeLinecap="round" />
      <circle className="mtv-pen" r="7" fill="#c07800" />
    </svg>
  );
}
function GridVisual() {
  // La griglia si riempie e compaiono i nodi del percorso.
  const cells = [];
  for (let i = 1; i < 4; i++) { cells.push(<line key={`v${i}`} x1={i*55} y1="0" x2={i*55} y2="150" stroke="rgba(47,125,74,0.25)" strokeWidth="1.5" />); cells.push(<line key={`h${i}`} x1="0" y1={i*37.5} x2="220" y2={i*37.5} stroke="rgba(47,125,74,0.25)" strokeWidth="1.5" />); }
  const nodes = [[27,131],[137,94],[82,56],[192,19]];
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className="mtv-grid" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
      {cells}
      <polyline className="mtv-grid-path" points={nodes.map(n => n.join(",")).join(" ")} fill="none" stroke="#2F7D4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {nodes.map((n, i) => <circle key={i} className="mtv-grid-dot" style={{ animationDelay: `${0.3 + i*0.15}s` }} cx={n[0]} cy={n[1]} r="6" fill="#1F6B3D" />)}
    </svg>
  );
}
function TrophyVisual() {
  return (
    <div className="mtv-trophy">
      <div className="mtv-trophy-emoji">🏆</div>
      <div className="mtv-trophy-lbl">Maestro del Movimento</div>
      <div className="mtv-trophy-sub">10 percorsi di fila</div>
    </div>
  );
}

const MOVIMENTO_INTRO_STEPS: IntroStep[] = [
  { title: "Guarda il percorso", body: "Un pallino attraversa la griglia disegnando un tracciato. Osservalo con attenzione: tra un attimo sparirà e dovrai ricordarlo.", visual: <WatchVisual /> },
  { title: "Ridisegnalo a memoria", body: "Con un solo gesto continuo (mouse o dito), come su Paint, ripercorri la curva che hai memorizzato. Conta la forma, la posizione e la lunghezza del tratto.", visual: <DrawVisual /> },
  { title: "Tre voti, molto severi", body: "Il tuo tratto viene valutato da 0,00 a 100,00 su tre criteri: FORMA (la silhouette), POSIZIONE (dov'è sulla griglia) e LUNGHEZZA. Anche piccole imprecisioni abbassano il voto.", visual: <GridVisual /> },
  { title: "Difficoltà e streak", body: "Più sali di livello, meno tempo hai per memorizzare la curva. Con un voto ≥ 70 la streak sale: ogni soglia (3, 5, 7, 10) sblocca un trofeo.", visual: <TrophyVisual /> },
];

const MOVIMENTO_TUTORIAL_CSS = `
  .mtv-watch .mtv-track { stroke-dasharray: 300; stroke-dashoffset: 300; animation: mtv-draw 1.6s ease forwards; }
  .mtv-watch .mtv-mover { offset-path: path("M24 110 C 60 110, 70 36, 110 60 S 170 110, 196 34"); animation: mtv-move 1.6s ease forwards; }
  @keyframes mtv-move { from { offset-distance: 0%; } to { offset-distance: 100%; } }

  .mtv-draw .mtv-trace { stroke-dasharray: 300; stroke-dashoffset: 300; animation: mtv-draw 1.8s ease .3s forwards; }
  .mtv-draw .mtv-pen { offset-path: path("M24 110 C 60 110, 70 36, 110 60 S 170 110, 196 34"); offset-distance: 0%; animation: mtv-move 1.8s ease .3s forwards; }

  .mtv-grid .mtv-grid-path { stroke-dasharray: 360; stroke-dashoffset: 360; animation: mtv-draw 1.1s ease .2s forwards; }
  .mtv-grid .mtv-grid-dot { opacity: 0; transform-box: fill-box; transform-origin: center; animation: mtv-pop .4s cubic-bezier(.34,1.7,.5,1) both; }

  @keyframes mtv-draw { to { stroke-dashoffset: 0; } }
  @keyframes mtv-pop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }

  .mtv-trophy { display:flex; flex-direction:column; align-items:center; text-align:center; }
  .mtv-trophy-emoji { font-size:4.6rem; line-height:1; animation: mtv-trophy-pop .6s cubic-bezier(.34,1.7,.5,1) both; }
  .mtv-trophy-lbl { font-size:1.05rem; color:#c8a415; font-weight:800; margin-top:.7rem; opacity:0; animation: mtv-fade .4s ease .4s forwards; }
  .mtv-trophy-sub { font-size:.88rem; color:#6b8070; font-weight:600; margin-top:.25rem; opacity:0; animation: mtv-fade .4s ease .55s forwards; }
  @keyframes mtv-fade { to { opacity:1; } }
  @keyframes mtv-trophy-pop { 0%{transform:scale(0) rotate(-25deg)} 60%{transform:scale(1.15) rotate(8deg)} 100%{transform:scale(1) rotate(0)} }
`;

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Movimento() {
  const [showMenu, setShowMenu] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [level, setLevel] = useState<LevelMode>(1);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>("watch");
  const [path, setPath] = useState<Pt[]>([]);
  const [scores, setScores] = useState<SubScores>({ shape: 0, position: 0, length: 0, total: 0 });
  const [roundScore, setRoundScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);            // miglior streak (localStorage)
  const [bestTotal, setBestTotal] = useState(0);  // record punteggio (localStorage)
  const [achieved, setAch] = useState<number[]>([]);
  const [trophy, setTrophy] = useState<(typeof TROPHIES)[number] | null>(null);
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("games-dark");
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<Pt[]>([]);     // gesto utente del round corrente
  const drawingActive = useRef(false);
  const animRef = useRef<number>();
  const autoT = useRef<number>();
  const phaseRef = useRef<Phase>(phase);
  const totalRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { totalRef.current = total; }, [total]);

  useEffect(() => {
    setBest(Number(localStorage.getItem("movimento-best-streak")) || 0);
    setBestTotal(Number(localStorage.getItem("movimento-best-total")) || 0);
    try { const t = JSON.parse(localStorage.getItem("movimento-trophies") || "[]"); if (Array.isArray(t)) setAch(t); } catch {}
  }, []);

  // ── Disegno di base (griglia + polilinee) ──
  const dims = () => { const cv = canvasRef.current!; return { w: cv.width, h: cv.height }; };

  // Griglia 10×10 di sfondo: linee leggerissime + punti agli incroci (come
  // l'app di riferimento). È puramente decorativa, il percorso non la usa.
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = dark ? "rgba(111,224,166,0.055)" : "rgba(120,140,130,0.10)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      const x = (w * i) / GRID, y = (h * i) / GRID;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.fillStyle = dark ? "rgba(111,224,166,0.10)" : "rgba(120,140,130,0.16)";
    for (let r = 1; r < GRID; r++) for (let c = 1; c < GRID; c++) {
      ctx.beginPath(); ctx.arc((w * c) / GRID, (h * r) / GRID, 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }, [dark]);

  // Tratto morbido (quadratic smoothing tra i midpoint) → linea fluida da
  // "Paint", senza spigoli, sia per il percorso vero che per il gesto utente.
  const drawSmooth = useCallback((ctx: CanvasRenderingContext2D, pts: Pt[], w: number, h: number, color: string, width: number) => {
    if (pts.length < 1) return;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pts[0].x * w, pts[0].y * h);
    if (pts.length < 3) {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * w, pts[i].y * h);
    } else {
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2 * w;
        const my = (pts[i].y + pts[i + 1].y) / 2 * h;
        ctx.quadraticCurveTo(pts[i].x * w, pts[i].y * h, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x * w, pts[pts.length - 1].y * h);
    }
    ctx.stroke();
  }, []);

  // ── Nuovo round: genera il percorso e parte la fase WATCH ──
  useEffect(() => {
    if (showMenu) return;
    const p = makePath();
    setPath(p);
    drawingRef.current = [];
    setPhase("watch");
    // Solo in sviluppo locale: espone il percorso per i test E2E (innocuo in prod).
    try { if (location.hostname === "localhost") (window as any).__movPath = p; } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, showMenu]);

  // ── FASE WATCH: il pallino percorre la curva LASCIANDO LA SCIA ──
  // La traccia viene disegnata fino al punto corrente (linea continua tipo
  // Paint), poi tutto sparisce e si passa al disegno. Dopo la traccia completa
  // resta visibile un istante (memorizzazione), poi si pulisce.
  useEffect(() => {
    if (phase !== "watch" || path.length === 0 || showMenu) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!; const { w, h } = dims();
    const accent = dark ? "#7c83ff" : "#5b5bf0"; // blu/viola come il riferimento
    const dotCol = dark ? "#ffffff" : "#1b1b1f";
    const drawMs = WATCH_MS_BY_LEVEL[level];   // tempo di tracciamento per livello
    const holdMs = Math.max(350, drawMs * 0.28); // pausa con la curva intera visibile
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const t = Math.min(1, elapsed / drawMs);
      drawGrid(ctx, w, h);
      const upto = Math.max(2, Math.floor(t * (path.length - 1)) + 1);
      const trail = path.slice(0, upto);
      drawSmooth(ctx, trail, w, h, accent, 5);
      // pallino in testa alla scia
      const head = trail[trail.length - 1];
      ctx.fillStyle = dotCol;
      ctx.beginPath(); ctx.arc(head.x * w, head.y * h, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(head.x * w, head.y * h, 9, 0, Math.PI * 2); ctx.stroke();

      if (t < 1) { animRef.current = requestAnimationFrame(tick); return; }
      // curva intera tracciata → tienila visibile, poi pulisci e passa a draw
      autoT.current = window.setTimeout(() => { drawGrid(ctx, w, h); setPhase("draw"); }, holdMs);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); clearTimeout(autoT.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, path, showMenu, dark, level, drawGrid, drawSmooth]);

  // ── Ridisegno in DRAW/RESULT ──
  // RESULT: percorso vero in bianco + tratto utente in blu/viola (come il
  // riferimento: "Your trace"). DRAW: solo la griglia (tela pulita su cui disegnare).
  useEffect(() => {
    if (phase === "watch" || showMenu) return;
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d")!; const { w, h } = dims();
    drawGrid(ctx, w, h);
    if (phase === "result") {
      drawSmooth(ctx, path, w, h, dark ? "rgba(255,255,255,0.92)" : "#1b1b1f", 5);
      drawSmooth(ctx, drawingRef.current, w, h, dark ? "#7c83ff" : "#5b5bf0", 5);
      // pallino di partenza (cerchio cavo) come nel riferimento
      if (path.length) {
        ctx.fillStyle = dark ? "#0e1512" : "#ffffff";
        ctx.strokeStyle = dark ? "rgba(255,255,255,0.9)" : "#1b1b1f"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(path[0].x * w, path[0].y * h, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, path, showMenu, dark, drawGrid, drawSmooth]);

  // ── Input (mouse + touch) per il gesto continuo ──
  const ptFromEvent = (e: React.MouseEvent | React.TouchEvent): Pt => {
    const cv = canvasRef.current!; const rect = cv.getBoundingClientRect();
    const isTouch = "touches" in e;
    const cx = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const cy = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (cx - rect.left) / rect.width, y: (cy - rect.top) / rect.height };
  };

  const renderUserStroke = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    drawGrid(ctx, w, h);
    drawSmooth(ctx, drawingRef.current, w, h, dark ? "#7c83ff" : "#5b5bf0", 5);
    // pallino di partenza dove ha cominciato a disegnare
    if (drawingRef.current.length) {
      const p0 = drawingRef.current[0];
      ctx.fillStyle = dark ? "#0e1512" : "#ffffff";
      ctx.strokeStyle = dark ? "#7c83ff" : "#5b5bf0"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p0.x * w, p0.y * h, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (phaseRef.current !== "draw") return;
    e.preventDefault(); drawingActive.current = true; drawingRef.current = [ptFromEvent(e)];
  };
  const moveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingActive.current || phaseRef.current !== "draw") return;
    e.preventDefault();
    const p = ptFromEvent(e);
    // ignora micro-movimenti per una linea più pulita
    const last = drawingRef.current[drawingRef.current.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.004) drawingRef.current.push(p);
    const cv = canvasRef.current!; const ctx = cv.getContext("2d")!; const { w, h } = dims();
    renderUserStroke(ctx, w, h);
  };
  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingActive.current || phaseRef.current !== "draw") return;
    e.preventDefault(); drawingActive.current = false;
    const sc = scorePath(drawingRef.current, path);
    const pts = roundPoints(sc.total);
    setScores(sc); setRoundScore(pts);
    const newTotal = totalRef.current + pts; totalRef.current = newTotal; setTotal(newTotal);

    // Streak: sale se il round è superato (totale ≥ PASS_100), altrimenti azzera.
    const passed = sc.total >= PASS_100;
    const ns = passed ? streak + 1 : 0;
    setStreak(ns);
    if (passed && ns > best) { setBest(ns); localStorage.setItem("movimento-best-streak", String(ns)); }

    confetti({ particleCount: sc.total >= 90 ? 110 : sc.total >= PASS_100 ? 55 : 10, spread: 72, origin: { y: 0.6 }, colors: ["#5b5bf0", "#7c83ff", "#fff", "#2F7D4A"] });

    const tr = passed ? getTrophyForStreak(ns) : null;
    if (tr && !achieved.includes(ns)) {
      const upd = [...achieved, ns]; setAch(upd);
      localStorage.setItem("movimento-trophies", JSON.stringify(upd));
      setTimeout(() => { setTrophy(tr); confetti({ particleCount: 220, spread: 110, origin: { y: 0.45 }, colors: ["#c8a415", "#5b5bf0", "#7c83ff", "#fff"] }); }, 650);
    }
    setPhase("result");
  };

  // ── Avanzamento ──
  const nextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      // Fine partita: salva il record di punteggio e mostra il riepilogo.
      if (totalRef.current > (Number(localStorage.getItem("movimento-best-total")) || 0)) {
        setBestTotal(totalRef.current);
        localStorage.setItem("movimento-best-total", String(totalRef.current));
      }
      setPhase("over");
    } else {
      setRound(r => r + 1);
    }
  }, [round]);

  const zeroScores = { shape: 0, position: 0, length: 0, total: 0 };

  const startGame = useCallback((chosen: LevelMode) => {
    setLevel(chosen);
    setRound(1); setTotal(0); totalRef.current = 0; setStreak(0); setRoundScore(0); setScores(zeroScores);
    if (!hasSeenTutorial("movimento")) setShowTutorial(true);
    else setShowMenu(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback(() => {
    setRound(1); setTotal(0); totalRef.current = 0; setStreak(0); setRoundScore(0); setScores(zeroScores);
    setPath(makePath()); drawingRef.current = []; setPhase("watch");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replayWatch = useCallback(() => {
    if (phaseRef.current !== "draw") return;
    drawingRef.current = []; setPhase("watch");
  }, []);

  const dismissTrophy = useCallback(() => { setTrophy(null); }, []);

  const toggleDark = useCallback(() => {
    setDark(d => { const n = !d; try { localStorage.setItem("games-dark", n ? "1" : "0"); } catch {} return n; });
  }, []);

  const phaseLabel = phase === "watch" ? "Guarda" : phase === "draw" ? "Disegna" : phase === "result" ? "Risultato" : "Fine partita";
  const phaseHint =
    phase === "watch" ? "Memorizza il movimento del pallino"
    : phase === "draw" ? "Ridisegna il percorso con un solo gesto"
    : phase === "result" ? (round >= TOTAL_ROUNDS ? "Ultimo percorso completato" : "Pronto per il prossimo")
    : "Hai completato i 5 percorsi";

  return (
    <div className={`mov-page${dark ? " dark" : ""}`}>

      {/* ── Menu ── */}
      {showMenu && (
        <MovimentoMenu
          dark={dark}
          bestStreak={best}
          trophiesCount={achieved.length}
          onPlay={startGame}
          onTutorial={() => setShowTutorial(true)}
        />
      )}

      {/* ── Tutorial ── */}
      {showTutorial && (
        <>
          <style>{MOVIMENTO_TUTORIAL_CSS}</style>
          <GameTutorial
            gameKey="movimento"
            steps={MOVIMENTO_INTRO_STEPS}
            accentColor="#2F7D4A"
            darkBg="#103820"
            dark={dark}
            onDone={() => { setShowTutorial(false); setShowMenu(false); }}
          />
        </>
      )}

      {/* ── Header ── */}
      <header className="mov-header">
        <div className="mov-hdr-left">
          <Link to="/#progetti" className="mov-iconbtn" aria-label="Torna ai progetti"><ArrowLeft size={20} /></Link>
          <h1 className="mov-title">MOVI<span className="mov-accent">MENTO</span></h1>
        </div>
        <div className="mov-hdr-center">
          <button className="mov-mode-pill" onClick={() => setShowMenu(true)} aria-label="Apri il menu">
            <Layers size={14} /><span>Menu</span>
          </button>
        </div>
        <div className="mov-hdr-right">
          <button className="mov-iconbtn" onClick={restart} aria-label="Nuova partita"><RotateCcw size={16} /></button>
          <button className="mov-iconbtn" onClick={toggleDark} aria-label="Cambia tema">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="mov-iconbtn" onClick={() => setShowTutorial(true)} aria-label="Come si gioca"><HelpCircle size={16} /></button>
        </div>
      </header>

      {/* ── Stage ── */}
      <div className="mov-stage">

        {/* Sinistra: tela di gioco */}
        <div className="mov-game">
          <div className="mov-fig-wrap">
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              className="mov-canvas"
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
            <span className="mov-round-badge">{round}/{TOTAL_ROUNDS}</span>
            <span className={`mov-phase-badge mov-phase-badge--${phase}`}>
              {phase === "watch" ? <Eye size={14} /> : phase === "draw" ? <Pencil size={14} /> : <Target size={14} />}
              <span>{phaseLabel}</span>
            </span>
          </div>
        </div>

        {/* Destra: pannello */}
        <aside className="mov-ctrl-block" aria-label="Pannello di gioco">
          <div className="mov-card-stats">
            <div className="mov-card-stat">
              <Award size={20} aria-hidden="true" className="mov-card-stat-ico" />
              <span className="mov-card-stat-val">{total.toLocaleString("it-IT")}</span>
              <span className="mov-card-stat-lbl">Punti</span>
            </div>
            <div className="mov-card-stat mov-card-stat--mid">
              <Flame size={20} aria-hidden="true" className="mov-card-stat-ico" />
              <span className="mov-card-stat-val">{streak}</span>
              <span className="mov-card-stat-lbl">Streak</span>
            </div>
            <div className="mov-card-stat mov-card-stat--mid">
              <Trophy size={20} aria-hidden="true" className="mov-card-stat-ico" />
              <span className="mov-card-stat-val">{bestTotal.toLocaleString("it-IT")}</span>
              <span className="mov-card-stat-lbl">Record</span>
            </div>
          </div>

          {phase === "over" ? (
            <div className="mov-panel mov-panel--over" key="over">
              <div className="mov-over">
                <span className="mov-over-emoji">🏁</span>
                <span className="mov-over-label">Partita conclusa!</span>
                <span className="mov-over-total">{total.toLocaleString("it-IT")}</span>
                <span className="mov-over-pts">punti totali</span>
                <div className="mov-wr-grid">
                  <div className="mov-wr-cell"><span className="mov-wr-num">{TOTAL_ROUNDS}</span><span className="mov-wr-sub">percorsi</span></div>
                  <div className="mov-wr-cell"><span className="mov-wr-num">{best}</span><span className="mov-wr-sub">streak max</span></div>
                  <div className="mov-wr-cell"><span className="mov-wr-num">{bestTotal.toLocaleString("it-IT")}</span><span className="mov-wr-sub">record</span></div>
                </div>
              </div>
              <button type="button" className="mov-next" onClick={restart}>Rigioca <RotateCcw size={16} /></button>
              <button type="button" className="mov-next mov-next--ghost" onClick={() => setShowMenu(true)}>Cambia difficoltà <Layers size={16} /></button>
            </div>
          ) : phase === "result" ? (
            <div className="mov-panel mov-panel--won" key="won">
              <div className="mov-win-reveal">
                <span className="mov-wr-e">{getScoreEmoji(scores.total)}</span>
                {/* Punteggio grande 0,00–100,00 (due decimali, virgola) come il riferimento */}
                <div className="mov-bigscore">
                  <span className="mov-bigscore-int">{Math.floor(scores.total)}</span>
                  <span className="mov-bigscore-dec">,{scores.total.toFixed(2).split(".")[1]}</span>
                  <span className="mov-bigscore-max">/ 100</span>
                </div>
                <div className="mov-subs">
                  <div className="mov-sub"><span className="mov-sub-lbl">Forma</span><span className="mov-sub-val">{fmt2(scores.shape)}</span></div>
                  <div className="mov-sub"><span className="mov-sub-lbl">Posizione</span><span className="mov-sub-val">{fmt2(scores.position)}</span></div>
                  <div className="mov-sub"><span className="mov-sub-lbl">Lunghezza</span><span className="mov-sub-val">{fmt2(scores.length)}</span></div>
                </div>
                <p className="mov-wr-tip">
                  {scores.total >= 90 ? "Tracciato eccellente!" : scores.total >= PASS_100 ? "Bel gesto, continua così." : "Bianco = vero percorso, blu = il tuo. Riprova!"}
                </p>
              </div>
              <button type="button" className="mov-next" onClick={nextRound}>
                {round >= TOTAL_ROUNDS ? "Vedi il risultato" : "Continua"} <RotateCcw size={16} />
              </button>
            </div>
          ) : (
            <div className="mov-panel mov-panel--play" key={`p-${round}-${phase}`}>
              <ul className="mov-legend-list">
                <li>
                  <span className="mov-legend-ico"><Eye size={16} /></span>
                  <span className="mov-legend-txt"><b>Guarda:</b> un pallino traccia il percorso, poi sparisce</span>
                </li>
                <li>
                  <span className="mov-legend-ico"><Pencil size={16} /></span>
                  <span className="mov-legend-txt"><b>Disegna:</b> ripercorri il tracciato con un solo gesto</span>
                </li>
              </ul>
              <div className="mov-phase-hint">{phaseHint}</div>
              {phase === "draw" && (
                <button type="button" className="mov-next mov-next--ghost" onClick={replayWatch}>
                  Rivedi il percorso <Eye size={16} />
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Trophy modal ── */}
      {trophy && (
        <div className="mov-overlay" onClick={dismissTrophy}>
          <div className="mov-tcard" onClick={e => e.stopPropagation()}>
            <div className="mov-thead" style={{ background: trophy.accent }}>
              <span className="mov-tgrade">{trophy.streak}</span>
              <span className="mov-tico">{trophy.emoji}</span>
              <span className="mov-tlbl">{trophy.label}</span>
            </div>
            <div className="mov-tbody">
              <p className="mov-tdesc">{trophy.desc}</p>
              <p className="mov-tsub">Percorsi consecutivi: {trophy.streak}</p>
              <button type="button" className="mov-tcta" onClick={dismissTrophy}>Continua <RotateCcw size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mov-page {
          /* ── Token Kit Italia (Bootstrap Italia 2.18.1) ── */
          --green:      hsl(160, 100%, 25%);
          --green-dark: hsl(160, 100%, 19%);
          --amber:      hsl(36, 100%, 30%);
          --absent:     hsl(350, 60%, 50%);
          --accent2:    #5b5bf0;   /* blu/viola del tratto utente */
          --bs-100:     hsl(0, 0%, 96%);
          --bs-200:     hsl(0, 0%, 90%);
          --bs-300:     hsl(0, 0%, 83%);
          --radius:     8px;
          --radius-sm:  4px;
          --focus-ring: 0 0 0 .25rem rgba(0,127.5,85,.25);
          --shadow-key: 0 .125rem .25rem rgba(0,0,0,.075);
          --shadow-card: 0 .5rem 1rem rgba(0,0,0,.12);
          --hdr-h: 52px;

          --surface:    #f4f6f5;
          --panel:      #ffffff;
          --panel-bd:   var(--bs-300);
          --stage-bg:   #eef2f0;
          --text:       #17271d;
          --text-soft:  #3c4a41;
          --stat-bg:    rgba(0,127,85,0.06);
          --stat-bd:    rgba(0,127,85,0.16);
          --legend-sep: var(--bs-200);

          height: 100dvh; overflow: hidden;
          background: var(--surface); color: var(--text);
          display: flex; flex-direction: column; align-items: center;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          user-select: none;
        }

        /* ── Header ── */
        .mov-header {
          position: sticky; top:0; z-index:20; flex-shrink:0;
          width:100%; display:flex; align-items:center; justify-content:space-between;
          padding:0 0.75rem; height:var(--hdr-h); background:#103820; color:#fff;
          box-shadow:0 2px 16px rgba(0,0,0,0.22);
        }
        .mov-hdr-left { display:flex; align-items:center; gap:0.5rem; }
        .mov-hdr-center { flex:1; display:flex; align-items:center; justify-content:center; }
        .mov-hdr-right { display:flex; align-items:center; gap:4px; }
        .mov-mode-pill {
          display:inline-flex; align-items:center; gap:0.35rem;
          background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.22);
          color:#fff; border-radius:999px; padding:0.28rem 0.75rem 0.28rem 0.6rem;
          font-size:0.78rem; font-weight:700; cursor:pointer; font-family:inherit;
          transition:background 0.15s; letter-spacing:0.02em;
        }
        .mov-mode-pill:hover { background:rgba(255,255,255,0.22); }
        .mov-title { font-size:1.4rem; font-weight:800; letter-spacing:0.14em; margin:0; }
        .mov-accent { color:#6fd08a; }
        .mov-iconbtn {
          display:inline-flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.3);
          background:transparent; color:#fff; cursor:pointer; text-decoration:none; flex-shrink:0;
          transition:background .15s,transform .15s;
        }
        .mov-iconbtn:hover { background:rgba(255,255,255,0.15); transform:translateY(-1px); }

        /* ── Stage ── */
        .mov-stage {
          flex:1 1 0; min-height:0; width:100%;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:14px; padding:14px 16px; overflow:hidden;
        }

        /* ── Tela ── */
        .mov-game { display:flex; align-items:center; justify-content:center; flex:0 1 auto; min-height:0; }
        .mov-fig-wrap {
          position:relative;
          width:  min(86vw, 46vh, 360px);
          height: min(86vw, 46vh, 360px);
          background:var(--stage-bg);
          border:1px solid var(--panel-bd);
          border-radius:var(--radius);
          box-shadow:var(--shadow-card);
          overflow:hidden;
        }
        .mov-canvas { display:block; width:100%; height:100%; touch-action:none; cursor:crosshair; }

        .mov-round-badge {
          position:absolute; top:8px; left:10px;
          font-size:0.78rem; font-weight:800; letter-spacing:0.04em;
          color:var(--text-soft); font-variant-numeric:tabular-nums;
          background:rgba(255,255,255,0.55); border-radius:999px; padding:0.1rem 0.55rem;
        }
        .mov-phase-badge {
          position:absolute; top:8px; right:10px;
          display:inline-flex; align-items:center; gap:0.3rem;
          font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;
          padding:0.22rem 0.6rem; border-radius:999px; color:#fff;
          box-shadow:var(--shadow-key);
        }
        .mov-phase-badge--watch  { background:var(--green); }
        .mov-phase-badge--draw   { background:var(--accent2); }
        .mov-phase-badge--result { background:var(--green-dark); }

        /* ── Card di gioco ── */
        .mov-ctrl-block {
          flex:0 0 auto; width:min(94vw,340px);
          background:var(--panel); border:1px solid var(--panel-bd);
          border-radius:var(--radius); padding:0.85rem 0.9rem;
          display:flex; flex-direction:column; box-shadow:var(--shadow-card);
        }

        .mov-card-stats {
          display:flex; align-items:stretch; margin-bottom:0.75rem; flex-shrink:0;
          background:var(--stat-bg); border:1px solid var(--stat-bd);
          border-radius:var(--radius); padding:0.55rem 0.4rem; gap:0.4rem;
        }
        .mov-card-stat {
          flex:1; min-width:0; display:grid;
          grid-template-columns:auto minmax(0,1fr); grid-template-rows:auto auto;
          align-items:center; column-gap:0.5rem; padding:0.1rem 0.5rem; color:var(--green-dark);
        }
        .mov-card-stat-ico { grid-row:1 / span 2; color:var(--green); }
        .mov-card-stat-val { font-size:1.4rem; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; align-self:end; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .mov-card-stat-lbl { font-size:0.56rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; opacity:0.7; align-self:start; }
        .mov-card-stat--mid { border-left:1px solid var(--stat-bd); padding-left:0.7rem; }

        .mov-panel { display:flex; flex-direction:column; gap:0.6rem; animation:mov-panel-in .3s ease; }
        @keyframes mov-panel-in { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }

        /* ── Legenda fasi (playing) ── */
        .mov-legend-list { list-style:none; margin:0; padding:0 0 0.55rem; display:flex; flex-direction:column; gap:0.55rem; border-bottom:1px solid var(--legend-sep); }
        .mov-legend-list li { display:flex; align-items:center; gap:0.6rem; font-size:0.8rem; color:var(--text-soft); line-height:1.25; }
        .mov-legend-ico { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; flex-shrink:0; border-radius:8px; background:var(--stat-bg); color:var(--green); border:1px solid var(--stat-bd); }
        .mov-legend-txt b { color:var(--text); }
        .mov-phase-hint { text-align:center; font-size:0.84rem; font-weight:700; color:var(--green-dark); padding:0.3rem 0; }

        /* ── Result reveal ── */
        .mov-win-reveal {
          display:flex; flex-direction:column; align-items:center; gap:0.2rem;
          background:linear-gradient(160deg,rgba(47,125,74,0.08),rgba(217,164,0,0.06));
          border:2px solid rgba(47,125,74,0.2); border-radius:12px; padding:0.9rem;
          animation:mov-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .mov-wr-e { font-size:2rem; line-height:1; animation:mov-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        /* Punteggio grande in stile riferimento: intero enorme + decimali piccoli */
        .mov-bigscore { display:flex; align-items:baseline; gap:0.15rem; margin-top:0.15rem; color:var(--text); font-variant-numeric:tabular-nums; }
        .mov-bigscore-int { font-size:3.4rem; font-weight:800; line-height:0.9; letter-spacing:-0.02em; }
        .mov-bigscore-dec { font-size:1.4rem; font-weight:700; }
        .mov-bigscore-max { font-size:0.78rem; font-weight:600; color:var(--text-soft); margin-left:0.25rem; align-self:flex-end; }
        .mov-subs { display:flex; gap:0.45rem; width:100%; margin-top:0.6rem; }
        .mov-sub { flex:1; display:flex; flex-direction:column; align-items:flex-start; gap:0.12rem; background:rgba(91,91,240,0.06); border:1px solid rgba(91,91,240,0.16); border-radius:8px; padding:0.45rem 0.55rem; }
        .mov-sub-lbl { font-size:0.54rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-soft); }
        .mov-sub-val { font-size:1rem; font-weight:800; color:var(--accent2); font-variant-numeric:tabular-nums; }
        .mov-wr-tip { font-size:0.74rem; color:var(--text-soft); margin:0.6rem 0 0; text-align:center; line-height:1.3; }
        /* manteniamo le classi grid/cell per il game-over */
        .mov-wr-grid { display:flex; gap:0.4rem; width:100%; margin-top:0.5rem; }
        .mov-wr-cell { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.1rem; background:rgba(255,255,255,0.6); border:1px solid rgba(47,125,74,0.13); border-radius:8px; padding:0.4rem 0.2rem; }
        .mov-wr-num { font-size:0.92rem; font-weight:800; color:var(--green-dark); font-variant-numeric:tabular-nums; }
        .mov-wr-sub { font-size:0.55rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#6b8070; }
        @keyframes mov-slide-up { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes mov-pop { from{transform:scale(0)} to{transform:scale(1)} }

        /* ── Bottone primario ── */
        .mov-next {
          width:100%; height:48px;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:var(--green); color:#fff; border:1px solid var(--green);
          border-radius:var(--radius-sm); font-family:inherit; font-size:1rem; font-weight:700; cursor:pointer;
          box-shadow:var(--shadow-key); animation:mov-slide-up .35s cubic-bezier(.34,1.56,.64,1);
          transition:background .15s,transform .1s,box-shadow .15s;
        }
        .mov-next:hover { background:var(--green-dark); border-color:var(--green-dark); transform:translateY(-1px); }
        .mov-next:focus-visible { outline:none; box-shadow:var(--focus-ring); }
        .mov-next:active { transform:scale(.98); }
        .mov-next--ghost { background:transparent; color:var(--green); border:1.5px solid var(--panel-bd); box-shadow:none; height:42px; margin-top:.1rem; font-weight:700; animation:none; }
        .mov-next--ghost:hover { background:var(--stat-bg); border-color:var(--green); transform:none; }

        /* ── Game over ── */
        .mov-panel--over { gap:0.7rem; }
        .mov-over {
          display:flex; flex-direction:column; align-items:center; gap:0.1rem;
          background:linear-gradient(160deg,rgba(47,125,74,0.08),rgba(217,164,0,0.06));
          border:2px solid rgba(47,125,74,0.18); border-radius:12px; padding:1rem 0.9rem 0.85rem;
          animation:mov-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .mov-over-emoji { font-size:2.4rem; line-height:1; animation:mov-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        .mov-over-label { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--green-dark); margin-top:.2rem; }
        .mov-over-total { font-size:2.6rem; font-weight:900; line-height:1; color:var(--green); font-variant-numeric:tabular-nums; margin-top:.1rem; }
        .mov-over-pts { font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#6b8070; }

        /* ── Mobile ── */
        @media (max-width: 759px) {
          .mov-legend-list { display:none; }
        }

        /* ── Desktop ── */
        @media (min-width: 760px) {
          .mov-page { --hdr-h: 56px; }
          .mov-header { display:grid; grid-template-columns:1fr auto 1fr; padding:0 1.25rem; }
          .mov-hdr-left { justify-self:start; gap:0.75rem; }
          .mov-hdr-right { justify-self:end; gap:0.5rem; }
          .mov-stage { flex-direction:row; align-items:center; justify-content:center; gap:2.5rem; padding:1.5rem 2rem; }
          .mov-fig-wrap {
            width:  clamp(240px, calc(100dvh - var(--hdr-h) - 3rem), 520px);
            height: clamp(240px, calc(100dvh - var(--hdr-h) - 3rem), 520px);
          }
          .mov-ctrl-block { flex:0 0 320px; width:320px; padding:1rem 1.1rem; }
        }

        /* ════════════════ DARK MODE ════════════════ */
        .mov-page.dark {
          --green:      hsl(160, 70%, 42%);
          --green-dark: hsl(160, 70%, 34%);
          --accent2:    #7c83ff;
          --surface:    #0e1512;
          --panel:      #15231c;
          --panel-bd:   rgba(95,208,154,0.18);
          --stage-bg:   #0c1611;
          --text:       #d4e8dc;
          --text-soft:  #a4c4aa;
          --stat-bg:    rgba(95,208,154,0.07);
          --stat-bd:    rgba(95,208,154,0.18);
          --legend-sep: rgba(95,208,154,0.16);
          --shadow-card: 0 .5rem 1.25rem rgba(0,0,0,0.45);
          --shadow-key:  0 .125rem .25rem rgba(0,0,0,0.25);
        }
        .mov-page.dark .mov-header { background:#0a1410; }
        .mov-page.dark .mov-stage  { background:radial-gradient(ellipse at 38% 42%, #13201a 0%, var(--surface) 70%); }
        .mov-page.dark .mov-card-stat { color:#6fe0a6; }
        .mov-page.dark .mov-card-stat-ico { color:#6fe0a6; }
        .mov-page.dark .mov-round-badge { background:rgba(0,0,0,0.4); color:var(--text-soft); }
        .mov-page.dark .mov-win-reveal { background:linear-gradient(160deg,rgba(95,208,154,0.12),rgba(217,164,0,0.08)); border-color:rgba(95,208,154,0.25); }
        .mov-page.dark .mov-wr-label,.mov-page.dark .mov-wr-sub { color:#8fc7a6; }
        .mov-page.dark .mov-wr-num { color:#6fe0a6; }
        .mov-page.dark .mov-wr-cell { background:rgba(255,255,255,0.04); border-color:rgba(95,208,154,0.2); }
        .mov-page.dark .mov-over { background:linear-gradient(160deg,rgba(95,208,154,0.12),rgba(217,164,0,0.08)); border-color:rgba(95,208,154,0.25); }
        .mov-page.dark .mov-over-pts { color:#8fc7a6; }
        .mov-page.dark .mov-tcard { background:#15231c; }
        .mov-page.dark .mov-tdesc { color:#8fc7a6; }
        .mov-page.dark .mov-tsub  { color:var(--text); }

        /* ── Trophy overlay ── */
        .mov-overlay { position:fixed; inset:0; z-index:100; background:rgba(10,30,18,0.72); display:flex; align-items:center; justify-content:center; padding:1rem; animation:mov-fadein .25s ease; }
        @keyframes mov-fadein { from{opacity:0} to{opacity:1} }
        .mov-tcard { background:#fff; border-radius:20px; overflow:hidden; width:100%; max-width:380px; box-shadow:0 24px 64px rgba(0,0,0,0.35); animation:mov-slide-up .35s cubic-bezier(.34,1.56,.64,1); }
        .mov-thead { color:#fff; padding:1.3rem 1.5rem 1.1rem; display:flex; flex-direction:column; align-items:center; gap:.25rem; position:relative; }
        .mov-tgrade { position:absolute; top:.9rem; right:1.1rem; font-size:1.5rem; font-weight:900; opacity:.25; }
        .mov-tico { font-size:2.6rem; line-height:1; }
        .mov-tlbl { font-size:1.1rem; font-weight:700; margin-top:.15rem; }
        .mov-tbody { padding:1.1rem 1.4rem; }
        .mov-tdesc { color:#6b8070; font-size:.9rem; margin-bottom:.35rem; }
        .mov-tsub  { font-weight:700; color:#17271d; margin-bottom:.9rem; font-size:.88rem; }
        .mov-tcta  { width:100%; padding:.8rem 1.4rem; display:inline-flex; align-items:center; justify-content:center; gap:.5rem; background:var(--green); color:#fff; border:none; border-radius:10px; font-family:inherit; font-size:.95rem; font-weight:700; cursor:pointer; }
        .mov-tcta:hover { background:var(--green-dark); }
      `}</style>
    </div>
  );
}
