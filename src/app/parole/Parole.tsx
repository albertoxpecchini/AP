import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Clock,
  Trophy,
  Flame,
  Layers,
  HelpCircle,
  CornerDownLeft,
  Delete,
  Moon,
  Sun,
  ListOrdered,
} from "lucide-react";
import { type WordLength, isValidWord, randomWord } from "./words";
import GameTutorial, { hasSeenTutorial, type IntroStep } from "../components/GameIntro";
import ParoleMenu, { getMode, type ModeId } from "./ParoleMenu";
import NicknameGate, { getStoredNick } from "./NicknameGate";
import Leaderboard from "./Leaderboard";
import { submitScore, scoreFromSeconds, type ScoreRow } from "./leaderboardApi";

const ROWS = 6;
const HINT_BATCH = 3; // lettere eliminate per ogni aiuto

type Status = "correct" | "present" | "absent";

// ─── Trofei (sbloccati da vittorie consecutive, come Angoli) ────────────────────
const TROPHIES = [
  { strike: 10, emoji: "🏆", label: "Trofeo del Lessico Supremo", desc: "10 parole di fila. Sei un vocabolario vivente.", accent: "#c8a415" },
  { strike: 7,  emoji: "🥇", label: "Lessicografo Professionista", desc: "7 parole di fila. Le parole non hanno segreti.", accent: "#B8960C" },
  { strike: 5,  emoji: "🥈", label: "Lessicografo Esperto",        desc: "5 parole di fila. L'intuito non sbaglia.",     accent: "#7A8C99" },
  { strike: 3,  emoji: "🥉", label: "Lessicografo Dilettante",      desc: "3 parole di fila. Il percorso è iniziato.",    accent: "#A0674A" },
] as const;

function getTrophyForStrike(n: number): (typeof TROPHIES)[number] | null {
  return TROPHIES.find(t => t.strike === n) ?? null;
}

const KEYBOARD: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["INVIO", "Z", "X", "C", "V", "B", "N", "M", "CANC"],
];

// Confronto stile Wordle con gestione corretta delle lettere doppie:
// prima passata per i verdi, seconda per i gialli sui caratteri rimasti.
function evaluate(guess: string, answer: string): Status[] {
  const n = answer.length;
  const result: Status[] = Array(n).fill("absent");
  const taken = Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      taken[i] = true;
    }
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < n; j++) {
      if (!taken[j] && guess[i] === answer[j]) {
        result[i] = "present";
        taken[j] = true;
        break;
      }
    }
  }
  return result;
}

const RANK: Record<Status, number> = { absent: 0, present: 1, correct: 2 };
const recordKey = (len: number) => `parole-record-${len}`;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function getRating(won: boolean, attempts: number) {
  if (!won) return { emoji: "💪", label: "Ci riprovi!", grade: "—", accent: "#c0392b" };
  const data = [
    { emoji: "🏆", label: "Fenomenale!", grade: "S", accent: "#c8a415" },
    { emoji: "⭐", label: "Straordinario!", grade: "A+", accent: "#2F7D4A" },
    { emoji: "🎯", label: "Ottimo!", grade: "A", accent: "#2F7D4A" },
    { emoji: "👏", label: "Bravo!", grade: "B", accent: "#D9A400" },
    { emoji: "😅", label: "Ce la fai!", grade: "C", accent: "#D9A400" },
    { emoji: "😮‍💨", label: "All'ultimo respiro!", grade: "D", accent: "#c0392b" },
  ];
  return data[Math.min(attempts - 1, 5)];
}

// ─── Tutorial: visual animati (classi gtv-, stesso schema di Angoli) ─────────────

// I visual ricevono `dark` per restare leggibili anche su sfondo scuro
// (l'area visual del tutorial in GameIntro è scura in dark mode). I colori di
// testo passano da variabili CSS impostate inline sul wrapper.
function tutVars(dark: boolean): React.CSSProperties {
  return {
    ["--gtv-text" as any]:  dark ? "#d4e8dc" : "#17271d",
    ["--gtv-accent" as any]: dark ? "#6fd08a" : "#2F7D4A",
    ["--gtv-bar-bg" as any]: dark ? "rgba(95,208,154,0.10)" : "rgba(47,125,74,0.10)",
    ["--gtv-bar-bd" as any]: dark ? "rgba(95,208,154,0.22)" : "rgba(47,125,74,0.18)",
  };
}

// Visual 1: una riga di tessere che si "rivela" colorandosi.
function DemoTilesVisual({ dark }: { dark: boolean }) {
  const tiles = [
    { ch: "M", st: "correct" },
    { ch: "E", st: "absent" },
    { ch: "L", st: "present" },
    { ch: "A", st: "absent" },
  ];
  const color: Record<string, string> = { correct: "#2F7D4A", present: "#D9A400", absent: dark ? "#566159" : "#9aa6a0" };
  return (
    <div className="gtv-tiles" style={tutVars(dark)}>
      {tiles.map((t, i) => (
        <div key={i} className="gtv-tile" style={{ animationDelay: `${0.2 + i * 0.18}s`, ["--c" as any]: color[t.st] }}>
          {t.ch}
        </div>
      ))}
    </div>
  );
}

// Visual 2: legenda dei colori che compare riga per riga.
function ColorLegendVisual({ dark }: { dark: boolean }) {
  const rows = [
    { c: "#2F7D4A", label: "Lettera giusta, posto giusto" },
    { c: "#D9A400", label: "Lettera presente, posto sbagliato" },
    { c: dark ? "#566159" : "#9aa6a0", label: "Lettera assente dalla parola" },
  ];
  return (
    <div className="gtv-legend" style={tutVars(dark)}>
      {rows.map((r, i) => (
        <div key={i} className="gtv-legend-row" style={{ animationDelay: `${0.25 + i * 0.4}s` }}>
          <span className="gtv-legend-box" style={{ background: r.c }} />
          <span className="gtv-legend-lbl">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// Visual 3: scala delle modalità che si riempie.
function ModeScaleVisual({ dark }: { dark: boolean }) {
  const steps = [
    { lbl: "Praticante", g: "5·3" },
    { lbl: "Esperto",    g: "5·1" },
    { lbl: "Avanzato",   g: "6·3" },
    { lbl: "Maestro",    g: "6·0" },
  ];
  return (
    <div className="gtv-scale" style={tutVars(dark)}>
      {steps.map((s, i) => (
        <div key={i} className="gtv-scale-bar" style={{ animationDelay: `${0.15 + i * 0.13}s` }}>
          <span className="gtv-scale-fill" style={{ width: `${35 + i * 18}%` }} />
          <span className="gtv-scale-lbl">{s.lbl}</span>
          <span className="gtv-scale-g">{s.g}</span>
        </div>
      ))}
    </div>
  );
}

// Visual 4: trofeo con pop.
function TrophyVisual() {
  return (
    <div className="gtv-trophy">
      <div className="gtv-trophy-emoji">🏆</div>
      <div className="gtv-trophy-lbl">Trofeo del Lessico Supremo</div>
      <div className="gtv-trophy-sub">10 parole di fila</div>
    </div>
  );
}

// Gli step del tutorial sono costruiti dentro il componente (useMemo su `dark`)
// perché i visual hanno bisogno di `dark` per restare leggibili: vedi buildIntroSteps.
function buildIntroSteps(dark: boolean): IntroStep[] {
  return [
    {
      title: "Indovina la parola!",
      body: "Hai sei tentativi per indovinare la parola nascosta. Scrivi una parola valida e premi Invio per scoprire quanto ti sei avvicinato.",
      visual: <DemoTilesVisual dark={dark} />,
    },
    {
      title: "Il sistema di colori",
      body: "Dopo ogni tentativo le tessere si colorano: verde se la lettera è al posto giusto, giallo se è nella parola ma in un'altra posizione, grigio se non c'è.",
      visual: <ColorLegendVisual dark={dark} />,
    },
    {
      title: "Modalità e aiuti",
      body: "Scegli la lunghezza (5 o 6 lettere) e il livello di sfida. Le modalità più difficili offrono meno aiuti: ogni aiuto elimina tre lettere assenti dalla parola.",
      visual: <ModeScaleVisual dark={dark} />,
    },
    {
      title: "Streak e trofei",
      body: "Ogni vittoria consecutiva aumenta la tua Streak. Raggiungi 3, 5, 7 o 10 vittorie di fila per sbloccare trofei lessicali esclusivi!",
      visual: <TrophyVisual />,
    },
  ];
}

const PAROLE_TUTORIAL_CSS = `
  /* ── Visual 1: tessere che si rivelano ── */
  .gtv-tiles { display:flex; gap:10px; }
  .gtv-tile {
    width:54px; height:54px; display:flex; align-items:center; justify-content:center;
    border-radius:8px; font-size:1.7rem; font-weight:800; color:#fff;
    background:var(--c); opacity:0; transform:rotateX(90deg);
    animation:gtv-flip .45s ease forwards;
  }
  @keyframes gtv-flip { to { opacity:1; transform:rotateX(0); } }

  /* ── Visual 2: legenda colori ── */
  .gtv-legend { display:flex; flex-direction:column; gap:14px; width:300px; max-width:100%; }
  .gtv-legend-row {
    display:flex; align-items:center; gap:13px;
    opacity:0; animation:gtv-slide-in .4s ease forwards;
  }
  .gtv-legend-box { width:30px; height:30px; border-radius:7px; flex-shrink:0; }
  .gtv-legend-lbl { font-size:0.92rem; font-weight:700; color:var(--gtv-text,#17271d); }
  @keyframes gtv-slide-in { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:none; } }

  /* ── Visual 3: scala modalità ── */
  .gtv-scale { display:flex; flex-direction:column; gap:9px; width:320px; max-width:100%; }
  .gtv-scale-bar {
    position:relative; display:flex; align-items:center; gap:8px;
    height:34px; padding:0 14px; border-radius:7px; overflow:hidden;
    background:var(--gtv-bar-bg,rgba(47,125,74,0.10)); border:1px solid var(--gtv-bar-bd,rgba(47,125,74,0.18));
    opacity:0; animation:gtv-bar-in .4s ease forwards;
  }
  .gtv-scale-fill {
    position:absolute; left:0; top:0; bottom:0;
    background:linear-gradient(90deg, rgba(47,125,74,0.30), rgba(217,164,0,0.30));
    transform-origin:left; animation:gtv-grow .5s ease forwards;
  }
  .gtv-scale-lbl { position:relative; z-index:1; font-size:0.92rem; font-weight:800; color:var(--gtv-text,#17271d); }
  .gtv-scale-g {
    position:relative; z-index:1; margin-left:auto;
    font-size:0.82rem; font-weight:800; font-family:monospace; color:var(--gtv-accent,#2F7D4A);
  }
  @keyframes gtv-bar-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  @keyframes gtv-grow { from { transform:scaleX(0); } to { transform:scaleX(1); } }

  /* ── Visual 4: trofeo ── */
  .gtv-trophy { display:flex; flex-direction:column; align-items:center; text-align:center; }
  .gtv-trophy-emoji { font-size:4.6rem; line-height:1; animation:gtv-trophy-pop .6s cubic-bezier(.34,1.7,.5,1) both; }
  .gtv-trophy-lbl { font-size:1.05rem; color:#c8a415; font-weight:800; margin-top:0.7rem; opacity:0; animation:gtv-fade .4s ease .4s forwards; }
  .gtv-trophy-sub { font-size:0.88rem; color:#6b8070; font-weight:600; margin-top:0.25rem; opacity:0; animation:gtv-fade .4s ease .55s forwards; }
  @keyframes gtv-trophy-pop { 0% { transform:scale(0) rotate(-25deg); } 60% { transform:scale(1.15) rotate(8deg); } 100% { transform:scale(1) rotate(0); } }
  @keyframes gtv-fade { to { opacity:1; } }
`;

export default function Parole() {
  // ── Struttura "a strati" come Angoli: menu → tutorial → gioco ──
  const [showMenu, setShowMenu] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [nick, setNick] = useState<string>(() => getStoredNick());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ScoreRow | null>(null);
  const pendingMode = useRef<ModeId | null>(null);
  const [mode, setMode] = useState<ModeId>("5-normale");
  const length = getMode(mode).length;

  // ── Streak + trofei (come Angoli), in aggiunta al record di tempo ──
  const [strike, setStrike] = useState(0);
  const [best, setBest] = useState(0);
  const [achieved, setAchieved] = useState<number[]>([]);
  const [trophy, setTrophy] = useState<(typeof TROPHIES)[number] | null>(null);

  const [answer, setAnswer] = useState(() => randomWord(5));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Status[][]>([]);
  const [slots, setSlots] = useState<string[]>(() => Array(5).fill(""));
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [hintsLeft, setHintsLeft] = useState(getMode("5-normale").hints);
  const [seconds, setSeconds] = useState(0);
  const [record, setRecord] = useState<number | null>(null);
  const [trivia, setTrivia] = useState<string | null>(null);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [wordImage, setWordImage] = useState<string | null>(null);
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("games-dark");
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });

  const cols = length;
  const msgTimer = useRef<number | undefined>(undefined);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fetchTokenRef = useRef(0);

  const [lastKey, setLastKey] = useState<string | null>(null);
  const lastKeyTimerRef = useRef<number | undefined>(undefined);

  const [errFlash, setErrFlash] = useState(false);
  const errFlashRef = useRef<number | undefined>(undefined);

  const anxietyLevel = useMemo(() => {
    if (state !== "playing") return 0;
    if (seconds > 180) return 3;
    if (seconds > 120) return 2;
    if (seconds > 60)  return 1;
    return 0;
  }, [state, seconds]);

  // Step del tutorial ricostruiti quando cambia il tema → visual leggibili in dark.
  const introSteps = useMemo(() => buildIntroSteps(dark), [dark]);

  useEffect(() => () => {
    window.clearTimeout(lastKeyTimerRef.current);
    window.clearTimeout(errFlashRef.current);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(recordKey(length));
    const n = Number(raw);
    setRecord(raw !== null && Number.isFinite(n) && n >= 0 ? n : null);
  }, [length]);

  // Carica record streak + trofei sbloccati (come Angoli).
  useEffect(() => {
    setBest(Number(localStorage.getItem("parole-best-strike")) || 0);
    try { const t = JSON.parse(localStorage.getItem("parole-trophies") || "[]"); if (Array.isArray(t)) setAchieved(t); } catch {}
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  const keyStatuses = useMemo(() => {
    const map: Record<string, Status> = {};
    guesses.forEach((g, gi) => {
      g.split("").forEach((ch, i) => {
        const s = evaluations[gi][i];
        const up = ch.toUpperCase();
        if (!(up in map) || RANK[s] > RANK[map[up]]) map[up] = s;
      });
    });
    eliminated.forEach((k) => {
      if (!(k in map)) map[k] = "absent";
    });
    return map;
  }, [guesses, evaluations, eliminated]);

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(msgTimer.current);
    msgTimer.current = window.setTimeout(() => setMessage(""), 1700);
  }, []);

  const fetchTrivia = useCallback((word: string) => {
    const token = fetchTokenRef.current;
    const cacheKey = `trivia_${word.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { if (token === fetchTokenRef.current) setTrivia(cached); return; }

    setTriviaLoading(true);
    fetch(`https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data) => {
        const text = data.extract?.split("\n")[0] ?? "";
        if (text) {
          localStorage.setItem(cacheKey, text);
          if (token === fetchTokenRef.current) setTrivia(text);
        }
      })
      .catch(() => {})
      .finally(() => { if (token === fetchTokenRef.current) setTriviaLoading(false); });
  }, []);

  const fetchWordImage = useCallback((word: string) => {
    const token = fetchTokenRef.current;
    const isCurrent = () => token === fetchTokenRef.current;
    const cacheKey = `wordimg_${word.toLowerCase()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { if (isCurrent()) setWordImage(cached); return; }

    const q = encodeURIComponent(word);
    // Prima scelta: Wikipedia pageimages API (copre anche parole astratte con redirect)
    fetch(`https://it.wikipedia.org/w/api.php?action=query&titles=${q}&prop=pageimages&format=json&pithumbsize=640&redirects=1&origin=*`)
      .then((r) => r.json())
      .then((data) => {
        const pages = Object.values(data.query?.pages ?? {}) as any[];
        const src = pages[0]?.thumbnail?.source;
        if (src) {
          localStorage.setItem(cacheKey, src);
          if (isCurrent()) setWordImage(src);
          return;
        }
        // Fallback: Wikimedia Commons cerca immagini libere per la parola
        return fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${q}&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*&gsrlimit=5`)
          .then((r) => r.json())
          .then((d) => {
            const imgs = Object.values(d.query?.pages ?? {}) as any[];
            const url = imgs.find((p) => {
              const ext = p.imageinfo?.[0]?.url?.split(".").pop()?.toLowerCase();
              return ["jpg","jpeg","png","webp"].includes(ext);
            })?.imageinfo?.[0]?.thumburl;
            if (url) {
              localStorage.setItem(cacheKey, url);
              if (isCurrent()) setWordImage(url);
            }
          });
      })
      .catch(() => {});
  }, []);

  // Prepara una nuova partita per una data modalità. `resetStreak` azzera la
  // streak quando si cambia modalità manualmente (come changeStep in Angoli).
  const startGame = useCallback((modeId: ModeId, resetStreak = true) => {
    // Invalida eventuali fetch trivia/immagine ancora in volo della partita precedente.
    fetchTokenRef.current++;
    const m = getMode(modeId);
    setMode(modeId);
    if (resetStreak) { setStrike(0); }
    setAnswer(randomWord(m.length));
    setGuesses([]);
    setEvaluations([]);
    setSlots(Array(m.length).fill(""));
    setCursor(0);
    setState("playing");
    setMessage("");
    setEliminated(new Set());
    setHintsLeft(m.hints);
    setSeconds(0);
    setTrivia(null);
    setNewRecord(false);
    setWordImage(null);
    // Focus sincrono entro il gesto utente: iOS Safari mostra la tastiera nativa
    // solo se il focus avviene durante un gesto, non da un setTimeout differito.
    hiddenInputRef.current?.focus();
  }, []);

  // "Gioca ancora": stessa modalità. Mantiene la streak (la sconfitta la azzera
  // già in submit; dopo una vittoria la streak prosegue).
  const newGame = useCallback(() => startGame(mode, false), [startGame, mode]);

  // La modalità si sceglie dal Menu (pill "Menu" → ParoleMenu): handlePlayFromMenu
  // chiama startGame con resetStreak. Niente cambio modalità in-page.

  // ── Mobile: tastiera nativa ──────────────────────────────────────────────
  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  // Auto-focus ogni volta che lo stato torna a "playing" (fallback desktop;
  // su iOS il focus affidabile avviene in-gesto dentro startGame/focusInput).
  useEffect(() => {
    if (state === "playing") {
      const t = window.setTimeout(() => hiddenInputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const toggleDark = useCallback(() => {
    setDark(d => { const n = !d; try { localStorage.setItem("games-dark", n ? "1" : "0"); } catch {} return n; });
  }, []);

  // Chiude la modale trofeo e prosegue.
  const dismissTrophy = useCallback(() => { setTrophy(null); }, []);

  // Avvio dal menu: imposta la modalità, prepara la partita e — alla prima
  // volta — mostra il tutorial obbligatorio (come Angoli).
  const proceedToGame = useCallback((modeId: ModeId) => {
    startGame(modeId, true);
    if (!hasSeenTutorial("parole")) {
      setShowTutorial(true);
    } else {
      setShowMenu(false);
    }
  }, [startGame]);

  const handlePlayFromMenu = useCallback((modeId: ModeId) => {
    // Gate nickname obbligatorio prima di giocare (come Angoli).
    if (!nick) {
      pendingMode.current = modeId;
      setShowGate(true);
      return;
    }
    proceedToGame(modeId);
  }, [nick, proceedToGame]);

  // Conferma del gate: salva il nick e prosegue con la modalità in attesa
  // (o resta sul menu se il gate è stato aperto da "cambia nickname").
  const handleNickConfirm = useCallback((value: string) => {
    setNick(value);
    setShowGate(false);
    const pm = pendingMode.current;
    pendingMode.current = null;
    if (pm) proceedToGame(pm);
  }, [proceedToGame]);

  // Blocca zoom iOS mentre il gioco è aperto
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    const prev = meta?.content ?? "";
    meta?.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover");
    return () => { if (meta && prev) meta.content = prev; };
  }, []);

  const useHint = useCallback(() => {
    if (state !== "playing" || hintsLeft <= 0) return;
    const known = new Set([...eliminated, ...Object.keys(keyStatuses)]);
    const candidates = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .filter((c) => !answer.toUpperCase().includes(c) && !known.has(c));
    if (candidates.length === 0) {
      flash("Niente da eliminare");
      return;
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const picked = candidates.slice(0, HINT_BATCH);
    setEliminated((prev) => new Set([...prev, ...picked]));
    setHintsLeft((h) => h - 1);
    flash(`Eliminate: ${picked.join(" ")}`);
  }, [state, hintsLeft, eliminated, keyStatuses, answer, flash]);

  const triggerErrFlash = useCallback(() => {
    setErrFlash(true);
    window.clearTimeout(errFlashRef.current);
    errFlashRef.current = window.setTimeout(() => setErrFlash(false), 600);
  }, []);

  const submit = useCallback(() => {
    if (!slots.every(Boolean)) {
      flash("Completa la parola");
      setShake(true);
      triggerErrFlash();
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    const guess = slots.join("");
    if (!isValidWord(guess)) {
      flash("Parola non valida");
      setShake(true);
      triggerErrFlash();
      window.setTimeout(() => setShake(false), 500);
      return;
    }

    const ev = evaluate(guess, answer);
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setEvaluations([...evaluations, ev]);
    setSlots(Array(cols).fill(""));
    setCursor(0);

    if (guess === answer) {
      setState("won");
      fetchTrivia(answer);
      fetchWordImage(answer);
      flash("Bravo! Indovinata 🎉");
      window.setTimeout(() => {
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 }, colors: ['#2F7D4A','#D9A400','#fff','#6fd08a'] });
        window.setTimeout(() => {
          confetti({ particleCount: 80, spread: 50, origin: { y: 0.9 }, angle: 90, colors: ['#2F7D4A','#D9A400','#6fd08a'] });
        }, 400);
      }, 350);
      setRecord((prev) => {
        const isNew = prev == null || seconds < prev;
        if (isNew) setNewRecord(true);
        const best = isNew ? seconds : prev;
        localStorage.setItem(recordKey(length), String(best));
        return best;
      });
      // ── Invio del punteggio in classifica (come Angoli) ──
      // score derivato dal tempo (più basso = migliore → score più alto).
      if (nick) {
        setSubmitting(true);
        setSubmitted(null);
        submitScore({ nick, score: scoreFromSeconds(seconds), mode, best_streak: best })
          .then((row) => setSubmitted(row))
          .catch(() => {})
          .finally(() => setSubmitting(false));
      }
      // ── Streak + trofei (come Angoli) ──
      const ns = strike + 1;
      setStrike(ns);
      if (ns > best) { setBest(ns); localStorage.setItem("parole-best-strike", String(ns)); }
      const tr = getTrophyForStrike(ns);
      if (tr && !achieved.includes(ns)) {
        const upd = [...achieved, ns];
        setAchieved(upd);
        localStorage.setItem("parole-trophies", JSON.stringify(upd));
        window.setTimeout(() => {
          setTrophy(tr);
          confetti({ particleCount: 220, spread: 110, origin: { y: 0.45 }, colors: ["#c8a415","#2F7D4A","#D9A400","#fff"] });
        }, 900);
      }
    } else if (nextGuesses.length >= ROWS) {
      setState("lost");
      setStrike(0);   // la sconfitta azzera la streak
      fetchTrivia(answer);
      fetchWordImage(answer);
      flash(`Era ${answer.toUpperCase()}`);
    }
  }, [slots, cols, answer, guesses, evaluations, flash, seconds, length, mode, nick, strike, best, achieved, fetchTrivia, fetchWordImage, triggerErrFlash]);

  const onKey = useCallback(
    (key: string) => {
      if (state !== "playing") return;
      if (key === "INVIO") return submit();
      if (key === "LEFT") return setCursor((c) => Math.max(0, c - 1));
      if (key === "RIGHT") return setCursor((c) => Math.min(cols - 1, c + 1));
      if (key === "CANC") {
        setSlots((prev) => {
          const n = [...prev];
          if (n[cursor]) n[cursor] = "";
          else if (cursor > 0) n[cursor - 1] = "";
          return n;
        });
        setCursor((c) => (slots[c] ? c : Math.max(0, c - 1)));
        return;
      }
      const up = key.toUpperCase();
      if (/^[A-Z]$/.test(up)) {
        setLastKey(up);
        window.clearTimeout(lastKeyTimerRef.current);
        lastKeyTimerRef.current = window.setTimeout(() => setLastKey(null), 180);
        setSlots((prev) => {
          const n = [...prev];
          n[cursor] = up.toLowerCase();
          return n;
        });
        setCursor((c) => Math.min(cols - 1, c + 1));
      }
    },
    [state, submit, cursor, cols, slots],
  );

  // ── Mobile: tastiera nativa (definiti dopo onKey per evitare la TDZ) ──────
  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const ch = val.slice(-1);
      if (/^[a-zA-Z]$/.test(ch)) onKey(ch);
      e.target.value = "";
    }
  }, [onKey]);

  const handleMobileKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") { e.preventDefault(); onKey("CANC"); }
    if (e.key === "Enter")     { e.preventDefault(); onKey("INVIO"); }
  }, [onKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Frecce / Home / End: l'input nascosto non le gestisce, le processiamo qui.
      if (e.key === "ArrowLeft") return onKey("LEFT");
      if (e.key === "ArrowRight") return onKey("RIGHT");
      if (e.key === "Home") return setCursor(0);
      if (e.key === "End") return setCursor(cols - 1);
      // Se l'input nascosto ha il focus, lettere/Backspace/Invio sono già
      // gestite dai suoi handler (onChange/onKeyDown): evita il doppio input.
      if (document.activeElement === hiddenInputRef.current) return;
      if (e.key === "Enter") onKey("INVIO");
      else if (e.key === "Backspace") onKey("CANC");
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, cols]);

  const lastRow = guesses.length - 1;

  return (
    <div className={[
      "parole-page",
      dark ? "dark" : "",
      state === "won"  ? "parole-won"  : "",
      state === "lost" ? "parole-lost" : "",
      anxietyLevel > 0 ? `parole-anx-${anxietyLevel}` : "",
      errFlash ? "parole-errflash" : "",
    ].filter(Boolean).join(" ")}>
      <div className="parole-bg" aria-hidden="true" />

      {/* ── Menu principale (sempre all'apertura) ── */}
      {showMenu && (
        <ParoleMenu
          dark={dark}
          bestStrike={best}
          trophiesCount={achieved.length}
          bestTime={record}
          nick={nick}
          onLeaderboard={() => setShowLeaderboard(true)}
          onChangeNick={() => { pendingMode.current = null; setShowGate(true); }}
          onPlay={handlePlayFromMenu}
          onTutorial={() => setShowTutorial(true)}
        />
      )}

      {/* ── Gate nickname (obbligatorio prima di giocare, come Angoli) ── */}
      {showGate && (
        <NicknameGate
          dark={dark}
          initial={nick}
          onConfirm={handleNickConfirm}
        />
      )}

      {/* ── Classifica live ── */}
      {showLeaderboard && (
        <Leaderboard
          dark={dark}
          myNick={nick}
          justSubmitted={submitted}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* ── Tutorial (prima volta obbligatorio, poi facoltativo) ── */}
      {showTutorial && (
        <>
          <style>{PAROLE_TUTORIAL_CSS}</style>
          <GameTutorial
            gameKey="parole"
            steps={introSteps}
            accentColor="#2F7D4A"
            darkBg="#103820"
            dark={dark}
            onDone={() => { setShowTutorial(false); setShowMenu(false); }}
          />
        </>
      )}

      <header className="parole-header">
        <div className="parole-hdr-left">
          <Link to="/#progetti" className="parole-iconbtn" aria-label="Torna ai progetti">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="parole-title">PAR<span className="parole-title-accent">OL</span>E</h1>
        </div>
        <div className="parole-hdr-center">
          <button className="parole-mode-pill" onClick={() => setShowMenu(true)} aria-label="Apri il menu modalità">
            <Layers size={14} />
            <span>Menu</span>
          </button>
        </div>
        <div className="parole-hdr-right">
          <button className="parole-iconbtn" onClick={() => setShowLeaderboard(true)} aria-label="Classifica">
            <ListOrdered size={16} />
          </button>
          <button className="parole-iconbtn" onClick={newGame} aria-label="Nuova partita">
            <RotateCcw size={16} />
          </button>
          <button className="parole-iconbtn" onClick={toggleDark} aria-label="Cambia tema">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="parole-iconbtn" onClick={() => setShowTutorial(true)} aria-label="Come si gioca">
            <HelpCircle size={16} />
          </button>
        </div>
      </header>
      {/* Input invisibile per tastiera nativa su mobile */}
      <input
        ref={hiddenInputRef}
        className="parole-hidden-input"
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleMobileChange}
        onKeyDown={handleMobileKeyDown}
      />

      {import.meta.env.DEV && state === "playing" && (
        <button
          className="parole-hint-btn"
          style={{ position:"fixed", bottom:16, right:16, zIndex:999 }}
          onClick={() => { setSlots(answer.split("")); setCursor(cols - 1); }}
        >
          ✎ Autofill
        </button>
      )}

      <div className="parole-stage">
        <div className="parole-game">
          <main className="parole-board" onClick={focusInput} style={{ '--cols': cols } as React.CSSProperties}>
            {Array.from({ length: ROWS }).map((_, r) => {
              const submitted = r < guesses.length;
              const isCurrentRow = r === guesses.length && state === "playing";
              const isWinRow = state === "won" && r === lastRow;
              return (
                <div
                  key={r}
                  className={`parole-row${isCurrentRow && shake ? " parole-row--shake" : ""}`}
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {Array.from({ length: cols }).map((_, c) => {
                    const ch = submitted ? guesses[r][c] : isCurrentRow ? slots[c] : "";
                    const status = submitted ? evaluations[r][c] : undefined;
                    const isCursor = isCurrentRow && c === cursor;
                    const cls = [
                      "parole-tile",
                      status ? `parole-tile--${status}` : "",
                      ch && !submitted ? "parole-tile--filled" : "",
                      submitted ? "parole-tile--revealed" : "",
                      isWinRow ? "parole-tile--win" : "",
                      isCursor ? "parole-tile--cursor" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div
                        key={c}
                        className={cls}
                        onClick={isCurrentRow ? () => setCursor(c) : undefined}
                        style={{
                          transitionDelay: submitted ? `${c * 90}ms` : "0ms",
                          animationDelay: isWinRow
                            ? `${c * 90}ms`
                            : submitted
                              ? `${c * 90}ms`
                              : "0ms",
                        }}
                      >
                        {(ch ?? "").toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </main>

          {state !== "playing" && (() => {
            const rating = getRating(state === "won", guesses.length);
            return (
              <div className="parole-endgame-overlay">
                <div className="parole-endgame-card">

                  {/* Header */}
                  <div className="parole-endgame-header" style={{ "--eg-accent": rating.accent } as React.CSSProperties}>
                    <div className="parole-endgame-grade">{rating.grade}</div>
                    <div className="parole-endgame-rating-text">
                      <span className="parole-endgame-emoji">{rating.emoji}</span>
                      <span className="parole-endgame-label">{rating.label}</span>
                    </div>
                    <div className="parole-endgame-word">{answer.toUpperCase()}</div>
                    {newRecord && state === "won" && (
                      <div className="parole-endgame-newrecord">🏅 Nuovo record!</div>
                    )}
                  </div>

                  {/* Image */}
                  {wordImage && (
                    <div className="parole-endgame-imgwrap">
                      <img
                        className="parole-endgame-img"
                        src={wordImage}
                        alt={answer}
                        onError={() => setWordImage(null)}
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="parole-endgame-stats">
                    <div className="parole-endgame-stat">
                      <span className="parole-endgame-stat-icon">⏱</span>
                      <span className="parole-endgame-stat-val">{fmt(seconds)}</span>
                      <span className="parole-endgame-stat-lbl">Tempo</span>
                    </div>
                    {state === "won" && (
                      <div className="parole-endgame-stat parole-endgame-stat--mid">
                        <span className="parole-endgame-stat-icon">🎯</span>
                        <span className="parole-endgame-stat-val">{guesses.length}<small>/{ROWS}</small></span>
                        <span className="parole-endgame-stat-lbl">Tentativi</span>
                      </div>
                    )}
                    <div className="parole-endgame-stat">
                      <span className="parole-endgame-stat-icon">🏅</span>
                      <span className="parole-endgame-stat-val">{record != null ? fmt(record) : "—"}</span>
                      <span className="parole-endgame-stat-lbl">Record</span>
                    </div>
                  </div>

                  {/* Trivia */}
                  <div className="parole-endgame-trivia">
                    <div className="parole-endgame-trivia-title">📚 Curiosità</div>
                    {triviaLoading
                      ? <div className="parole-endgame-trivia-loading"><span className="parole-dot-pulse" />Generando curiosità…</div>
                      : trivia
                        ? <p className="parole-endgame-trivia-text">{trivia}</p>
                        : <p className="parole-endgame-trivia-empty">Nessuna curiosità disponibile.</p>
                    }
                  </div>

                  {/* Stato classifica */}
                  {state === "won" && nick && (
                    <div className="parole-endgame-lbstatus">
                      {submitting ? "Salvataggio in classifica…" : submitted ? "Salvato in classifica! 🏆" : ""}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="parole-endgame-ctas">
                    <button className="parole-endgame-cta" onClick={newGame}>
                      <RotateCcw size={17} /> Gioca ancora
                    </button>
                    <button className="parole-endgame-cta parole-endgame-cta--ghost" onClick={() => setShowLeaderboard(true)}>
                      <ListOrdered size={16} /> Classifica
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>

        <aside className="parole-controls" aria-label="Pannello di gioco">

          {/* — Stats row (Streak / Tempo / Aiuto / Record) in griglia 2×2 — */}
          <div className="parole-stats-grid">
            <div className="parole-stat-card" aria-label="Streak">
              <Flame size={20} aria-hidden="true" />
              <span className="parole-stat-card-val">{strike}</span>
              <span className="parole-stat-card-lbl">Streak</span>
            </div>
            <div className={`parole-stat-card${anxietyLevel > 0 ? ` parole-anx-stat-${anxietyLevel}` : ""}`} aria-label="Tempo">
              <Clock size={20} aria-hidden="true" />
              <span className="parole-stat-card-val">{fmt(seconds)}</span>
              <span className="parole-stat-card-lbl">Tempo</span>
            </div>
            <button
              type="button"
              className="parole-stat-card parole-stat-card--btn"
              onClick={useHint}
              disabled={state !== "playing" || hintsLeft <= 0}
              aria-label="Usa aiuto"
            >
              <Lightbulb size={20} aria-hidden="true" />
              <span className="parole-stat-card-val">{hintsLeft}</span>
              <span className="parole-stat-card-lbl">Aiuto</span>
            </button>
            <div className="parole-stat-card" aria-label="Record">
              <Trophy size={20} aria-hidden="true" />
              <span className="parole-stat-card-val">{record != null ? fmt(record) : "—"}</span>
              <span className="parole-stat-card-lbl">Record</span>
            </div>
          </div>

          <div className="parole-message-slot">
            {message && <div className="parole-message">{message}</div>}
          </div>

          <div className="parole-panel-divider" />

          {/* — Stato lettere — */}
          <div className="parole-panel-section">
            <h3 className="parole-panel-label">Stato lettere</h3>
            <div className="parole-mini-kbd" aria-label="Stato lettere">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(k => {
                const st = keyStatuses[k];
                const isElim = eliminated.has(k);
                return (
                  <span
                    key={k}
                    className={`parole-mini-key${st ? ` parole-mini-key--${st}` : ""}${isElim ? " parole-mini-key--elim" : ""}${k === lastKey ? " parole-mini-key--pressed" : ""}`}
                  >
                    {k}
                  </span>
                );
              })}
            </div>
            {eliminated.size > 0 && (
              <div className="parole-elim-row" aria-label="Lettere eliminate">
                <span className="parole-elim-label">✗</span>
                {[...eliminated].sort().map(k => (
                  <span key={k} className="parole-elim-chip">{k}</span>
                ))}
              </div>
            )}
          </div>

          <div className="parole-panel-divider" />

          {/* — Comandi: una riga compatta di 4 tasti (per chi usa il mouse) — */}
          <div className="parole-panel-section">
            <h3 className="parole-panel-label">Comandi</h3>
            <div className="parole-cmd-row">
              <button type="button" className="parole-cmd" onClick={() => onKey("LEFT")} aria-label="Lettera precedente">
                <ArrowLeft size={16} />
              </button>
              <button type="button" className="parole-cmd" onClick={() => onKey("RIGHT")} aria-label="Lettera successiva">
                <ArrowRight size={16} />
              </button>
              <button type="button" className="parole-cmd parole-cmd--ok" onClick={() => onKey("INVIO")} aria-label="Conferma">
                <CornerDownLeft size={16} />
              </button>
              <button type="button" className="parole-cmd parole-cmd--del" onClick={() => onKey("CANC")} aria-label="Cancella">
                <Delete size={16} />
              </button>
            </div>
          </div>

          <div className="parole-panel-divider" />

          {/* — Scorciatoie: una riga compatta (tastiera fisica) — */}
          <p className="parole-shortcuts-line">
            <kbd>←</kbd><kbd>→</kbd> naviga · <kbd>A–Z</kbd> scrivi · <kbd>↵</kbd> invio · <kbd>⌫</kbd> cancella
          </p>

        </aside>

        <div className="parole-keyboard">
        {KEYBOARD.map((row, ri) => (
          <div key={ri} className="parole-krow">
            {row.map((key) => {
              const wide = key === "INVIO" || key === "CANC";
              const st = key.length === 1 ? keyStatuses[key] : undefined;
              const isElim = eliminated.has(key);
              return (
                <button
                  key={key}
                  className={`parole-key${wide ? " parole-key--wide" : ""}${st ? ` parole-key--${st}` : ""}${isElim ? " parole-key--elim" : ""}${key === lastKey ? " parole-key--pressed" : ""}`}
                  onClick={() => onKey(key)}
                  type="button"
                >
                  {key === "CANC" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
        </div>
      </div>

      {/* ── Modale trofeo (come Angoli) ── */}
      {trophy && (
        <div className="parole-trophy-overlay" onClick={dismissTrophy}>
          <div className="parole-tcard" onClick={e => e.stopPropagation()}>
            <div className="parole-thead" style={{ background: trophy.accent }}>
              <span className="parole-tgrade">{trophy.strike}</span>
              <span className="parole-tico">{trophy.emoji}</span>
              <span className="parole-tlbl">{trophy.label}</span>
            </div>
            <div className="parole-tbody">
              <p className="parole-tdesc">{trophy.desc}</p>
              <p className="parole-tsub">Vittorie consecutive: {trophy.strike}</p>
              <button type="button" className="parole-tcta" onClick={dismissTrophy}>Continua <RotateCcw size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .parole-page {
          --green: #2F7D4A;
          --green-dark: #1F6B3D;
          --amber: #D9A400;
          --absent: #c0392b;
          height: 100vh;
          height: 100svh;
          overflow: hidden;
          isolation: isolate;
          background: #f4f6f5;
          color: #17271d;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          user-select: none;
          padding-bottom: 0;
        }

        .parole-header {
          position: sticky;
          top: 0;
          z-index: 20;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.75rem;
          height: 52px;
          background: #103820;
          color: #fff;
          box-shadow: 0 2px 16px rgba(0,0,0,0.22);
        }
        .parole-hdr-left  { display: flex; align-items: center; }
        .parole-hdr-center {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .parole-hdr-right { display: flex; align-items: center; gap: 4px; }
        /* Mode buttons nel header (solo desktop, nascosti su mobile) */
        .parole-modes-header { display: none; gap: 3px; }
        .parole-mode-sm {
          border: none;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.75);
          font-weight: 700; font-size: 0.7rem;
          padding: 0.16rem 0.5rem; border-radius: 999px;
          cursor: pointer; transition: background 0.15s, color 0.15s;
          letter-spacing: 0.02em;
        }
        .parole-mode-sm--active {
          background: rgba(255,255,255,0.28); color: #fff;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
        }
        /* Stat nel header (solo desktop) */
        .parole-hdr-stat {
          display: none;
          align-items: center; gap: 0.28rem;
          font-size: 0.75rem; font-weight: 700;
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.1);
          padding: 0.2rem 0.5rem; border-radius: 999px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        /* Hint button compatto nel header (solo desktop) */
        .parole-hint-btn--sm {
          display: none;
          align-items: center; gap: 0.22rem;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 0.2rem 0.55rem;
          color: #fff; cursor: pointer;
          font-weight: 700; font-size: 0.75rem;
          transition: background 0.15s;
        }
        .parole-hint-btn--sm:disabled { opacity: 0.4; cursor: not-allowed; }
        .parole-hint-btn--sm:hover:not(:disabled) { background: rgba(255,255,255,0.24); }
        /* Anxiety nel header stat */
        .parole-anx-stat-1 { color: var(--amber) !important; }
        .parole-anx-stat-2 { color: #e07b22 !important; animation: parole-timer-pulse 1.1s ease-in-out infinite; }
        .parole-anx-stat-3 { color: var(--absent) !important; animation: parole-timer-pulse 0.55s ease-in-out infinite; box-shadow: 0 0 0 2px rgba(192,57,43,0.35) !important; }

        .parole-title {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          margin: 0;
          animation: parole-drop 0.5s ease;
        }
        .parole-title-accent { color: #6fd08a; }
        @keyframes parole-drop {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .parole-iconbtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .parole-iconbtn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }

        /* ── Pill "Menu" nell'header (come Angoli) ── */
        .parole-mode-pill {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          color: #fff; border-radius: 999px; padding: 0.28rem 0.75rem 0.28rem 0.6rem;
          font-size: 0.78rem; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: background 0.15s; letter-spacing: 0.02em;
        }
        .parole-mode-pill:hover { background: rgba(255,255,255,0.22); }

        /* ── Modale trofeo (come Angoli) ── */
        .parole-trophy-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(10,30,18,0.72);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; animation: parole-fade-in 0.25s ease;
        }
        .parole-tcard {
          background: #fff; border-radius: 20px; overflow: hidden;
          width: 100%; max-width: 380px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          animation: parole-slide-up 0.35s cubic-bezier(.34,1.56,.64,1);
        }
        .parole-thead { color: #fff; padding: 1.3rem 1.5rem 1.1rem; display: flex; flex-direction: column; align-items: center; gap: .25rem; position: relative; }
        .parole-tgrade { position: absolute; top: .9rem; right: 1.1rem; font-size: 1.5rem; font-weight: 900; opacity: .25; }
        .parole-tico { font-size: 2.6rem; line-height: 1; }
        .parole-tlbl { font-size: 1.1rem; font-weight: 700; margin-top: .15rem; text-align: center; }
        .parole-tbody { padding: 1.1rem 1.4rem; }
        .parole-tdesc { color: #6b8070; font-size: .9rem; margin-bottom: .35rem; }
        .parole-tsub  { font-weight: 700; color: #17271d; margin-bottom: .9rem; font-size: .88rem; }
        .parole-tcta  {
          width: 100%; padding: .8rem 1.4rem;
          display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
          background: var(--green); color: #fff; border: none;
          border-radius: 10px; font-family: inherit; font-size: .95rem; font-weight: 700; cursor: pointer;
        }
        .parole-tcta:hover { background: var(--green-dark); }
        .parole-page.dark .parole-tcard { background: #15231c; }
        .parole-page.dark .parole-tdesc { color: #8fc7a6; }
        .parole-page.dark .parole-tsub  { color: #d4e8dc; }

        .parole-modes {
          display: inline-flex;
          gap: 4px;
          margin-top: 0.85rem;
          padding: 4px;
          background: rgba(47,125,74,0.1);
          border-radius: 999px;
        }
        .parole-mode {
          border: none;
          background: transparent;
          color: var(--green-dark);
          font-weight: 700;
          font-size: 0.9rem;
          padding: 0.4rem 1.05rem;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .parole-mode--active { background: var(--green); color: #fff; box-shadow: 0 2px 8px rgba(47,125,74,0.35); }

        .parole-toolbar {
          width: 100%;
          max-width: 460px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.7rem 1rem 0.4rem;
        }
        .parole-stat {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          color: var(--green-dark);
          background: rgba(47,125,74,0.1);
          border-radius: 999px;
          padding: 0.32rem 0.7rem;
          font-variant-numeric: tabular-nums;
          min-width: 86px;
          justify-content: center;
        }
        .parole-stat-val { font-size: 0.95rem; }
        .parole-hint-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--green);
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 0.4rem 0.9rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
        }
        .parole-hint-btn:hover:not(:disabled) { background: var(--green-dark); transform: translateY(-1px); }
        .parole-hint-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .parole-hint-badge {
          background: rgba(255,255,255,0.28);
          border-radius: 999px;
          min-width: 1.4em;
          height: 1.4em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .parole-message-slot { height: 2.6rem; display: flex; align-items: center; }
        .parole-message {
          background: #17271d;
          color: #fff;
          font-weight: 700;
          padding: 0.55rem 1.1rem;
          border-radius: 8px;
          font-size: 0.92rem;
          box-shadow: 0 6px 18px rgba(0,0,0,0.2);
          animation: parole-toast 0.25s ease;
        }
        @keyframes parole-toast {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .parole-elim-row {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 460px;
          padding: 0 1rem;
          min-height: 1.6rem;
          animation: parole-fade-in 0.3s ease;
        }
        .parole-elim-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--absent);
          margin-right: 2px;
        }
        .parole-elim-chip {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(192,57,43,0.13);
          color: var(--absent);
          border: 1px solid rgba(192,57,43,0.35);
          border-radius: 4px;
          padding: 0.1rem 0.35rem;
          letter-spacing: 0.04em;
          line-height: 1.4;
          animation: parole-elim-appear 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes parole-elim-appear {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        .parole-page.dark .parole-elim-chip {
          background: rgba(192,57,43,0.2);
          border-color: rgba(192,57,43,0.45);
        }

        /* ── Stat cards (nel pannello destro, desktop) ── */
        .parole-stat-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.2rem; padding: 0.5rem 0.6rem;
          background: rgba(47,125,74,0.08);
          border: 1px solid rgba(47,125,74,0.22);
          border-radius: 10px;
          font-variant-numeric: tabular-nums;
          color: var(--green-dark);
          min-width: 0;
          box-shadow: 0 0 0 1px rgba(47,125,74,0.06), inset 0 0 12px rgba(47,125,74,0.05);
        }
        .parole-stat-card-val { text-shadow: 0 0 8px rgba(47,125,74,0.25); }
        .parole-stat-card--btn {
          border: none; cursor: pointer;
          background: var(--green); color: #fff;
          transition: background 0.15s, transform 0.1s;
        }
        .parole-stat-card--btn:hover:not(:disabled) { background: var(--green-dark); transform: translateY(-1px); }
        .parole-stat-card--btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .parole-stat-card-val { font-size: 1.15rem; font-weight: 800; line-height: 1; }
        .parole-stat-card-lbl { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.75; }
        .parole-page.dark .parole-stat-card {
          background: rgba(47,125,74,0.12); border-color: rgba(95,208,154,0.3); color: #7ab893;
          box-shadow: 0 0 0 1px rgba(95,208,154,0.12), inset 0 0 16px rgba(95,208,154,0.08);
        }
        .parole-page.dark .parole-stat-card-val { text-shadow: 0 0 10px rgba(95,208,154,0.45); }
        .parole-page.dark .parole-stat-card--btn { background: var(--green); color: #fff; border: none; }
        /* Anxiety on center stat card */
        .parole-anx-stat-1.parole-stat-card { border-color: var(--amber); color: var(--amber); }
        .parole-anx-stat-2.parole-stat-card { border-color: #e07b22; color: #e07b22; animation: parole-timer-pulse 1.1s ease-in-out infinite; }
        .parole-anx-stat-3.parole-stat-card { border-color: var(--absent); color: var(--absent); animation: parole-timer-pulse 0.55s ease-in-out infinite; }

        /* ── Mini tastiera stato lettere (griglia 6×5 alfabetica) ── */
        .parole-mini-key {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          aspect-ratio: 1 / 1;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          border-radius: 5px;
          background: #d3dad6;
          color: #17271d;
          transition: background 0.2s, color 0.2s, transform 0.1s, box-shadow 0.2s;
          letter-spacing: 0;
        }
        .parole-mini-key--correct { background: var(--green); color: #fff; box-shadow: 0 0 8px rgba(47,125,74,0.55), inset 0 0 4px rgba(255,255,255,0.25); }
        .parole-mini-key--present  { background: var(--amber); color: #fff; box-shadow: 0 0 8px rgba(217,164,0,0.6), inset 0 0 4px rgba(255,255,255,0.3); }
        .parole-mini-key--absent   { background: #b0b8b2; color: #6b7870; }
        .parole-mini-key--elim     { background: rgba(192,57,43,0.18); color: var(--absent); text-decoration: line-through; }
        .parole-mini-key--pressed  { transform: scale(0.82); background: var(--green) !important; color: #fff !important; }
        /* Dark mode */
        .parole-page.dark .parole-mini-key { background: #2e3e35; color: #9ab8a2; }
        .parole-page.dark .parole-mini-key--absent { background: #1e2820; color: #4a5e50; }
        .parole-page.dark .parole-mini-key--elim { background: rgba(192,57,43,0.22); color: #c87070; }
        .parole-page.dark .parole-mini-key--correct { background: var(--green); color: #fff; box-shadow: 0 0 12px rgba(95,208,154,0.7), inset 0 0 5px rgba(255,255,255,0.3); }
        .parole-page.dark .parole-mini-key--present { background: var(--amber); color: #fff; box-shadow: 0 0 12px rgba(224,160,32,0.75), inset 0 0 5px rgba(255,255,255,0.35); }

        /* Mobile: visibile; desktop: nascosta (la fa il pannello Comandi) */
        .parole-mobile-kbd {
          display: flex; flex-direction: column; align-items: center; gap: 0;
          padding: 0.3rem 0 0.1rem;
        }
        @media (min-width: 760px) {
          .parole-mobile-kbd { display: none; }
        }
        /* Mini kbd nel pannello (desktop) e mobile-kbd (touch) */
        .parole-mini-kbd {
          display: none;
          grid-template-columns: repeat(6, 1fr);
          gap: 5px;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 0.5rem;
        }

        /* Panel sections (sidebar desktop) */
        .parole-panel-section { padding: 0.4rem 0; }
        .parole-panel-label {
          font-size: 0.58rem; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--green-dark);
          margin: 0 0 0.4rem; display: block;
        }
        .parole-panel-divider {
          height: 1px; background: rgba(47,125,74,0.1); flex-shrink: 0;
          margin: 0.2rem 0;
        }
        /* Elim-row--flow: visibile solo su mobile */
        .parole-elim-row--flow { display: flex; }

        .parole-stage {
          width: 100%;
          flex: 1 1 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .parole-game { display: flex; flex-direction: column; align-items: center; flex: 1 1 0; min-height: 0; }

        .parole-board {
          display: grid; gap: 7px; padding: 0.25rem;
          --ts: min(
            calc((min(92vw, 22rem) - (var(--cols, 5) - 1) * 7px) / var(--cols, 5)),
            calc((100svh - 90px - 5 * 7px) / 6)
          );
          width: calc(var(--cols, 5) * var(--ts) + (var(--cols, 5) - 1) * 7px);
          margin: 0 auto;
        }
        .parole-row { display: grid; gap: 7px; }
        .parole-row--shake { animation: parole-shake 0.45s; }
        @keyframes parole-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-7px); }
          40%, 60% { transform: translateX(7px); }
        }

        .parole-tile {
          width: var(--ts, 58px);
          height: var(--ts, 58px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: min(1.9rem, calc(var(--ts, 58px) * 0.44));
          font-weight: 700;
          text-transform: uppercase;
          border: 2px solid #cdd8d1;
          background: #fff;
          color: #17271d;
          border-radius: 6px;
          transition: transform 0.25s ease, background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.15s;
        }
        .parole-tile--filled {
          border-color: var(--green);
          animation: parole-pop 0.12s ease;
        }
        .parole-tile--cursor {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(47,125,74,0.3);
          cursor: pointer;
          animation: parole-cursor-glow 1.5s ease-in-out infinite;
        }
        @keyframes parole-cursor-glow {
          0%,100% { box-shadow: 0 0 0 3px rgba(47,125,74,0.3); }
          50%     { box-shadow: 0 0 0 5px rgba(47,125,74,0.55), 0 0 12px rgba(47,125,74,0.2); }
        }
        @keyframes parole-pop { 0% { transform: scale(0.9); } 100% { transform: scale(1); } }
        .parole-tile--revealed { animation: parole-flip 0.55s ease forwards; color: #fff; }
        @keyframes parole-flip {
          0% { transform: rotateX(0); }
          45% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        .parole-tile--correct { background: var(--green); border-color: var(--green); color: #fff; box-shadow: 0 0 14px rgba(47,125,74,0.5), inset 0 0 8px rgba(255,255,255,0.18); }
        .parole-tile--present { background: var(--amber); border-color: var(--amber); color: #fff; box-shadow: 0 0 14px rgba(217,164,0,0.55), inset 0 0 8px rgba(255,255,255,0.22); }
        .parole-tile--absent { background: var(--absent); border-color: var(--absent); color: #fff; }
        .parole-tile--win { animation: parole-bounce 0.6s ease; }
        @keyframes parole-bounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-16px); }
          50% { transform: translateY(0); }
          70% { transform: translateY(-7px); }
        }

        /* ── End-game modal ── */
        .parole-endgame-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(10, 30, 18, 0.72);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: parole-fade-in 0.25s ease;
        }
        @keyframes parole-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .parole-endgame-card {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          animation: parole-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1);
          display: flex;
          flex-direction: column;
        }
        @keyframes parole-slide-up {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .parole-endgame-header {
          background: var(--eg-accent, var(--green));
          color: #fff;
          border-radius: 20px 20px 0 0;
          padding: 1.4rem 1.5rem 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          position: relative;
        }
        .parole-endgame-grade {
          position: absolute;
          top: 1rem;
          right: 1.2rem;
          font-size: 1.6rem;
          font-weight: 900;
          opacity: 0.28;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .parole-endgame-rating-text {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .parole-endgame-emoji { font-size: 1.5rem; line-height: 1; }
        .parole-endgame-label {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .parole-endgame-word {
          font-size: 2.4rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          margin-top: 0.15rem;
        }
        .parole-endgame-newrecord {
          margin-top: 0.3rem;
          font-size: 0.82rem;
          font-weight: 700;
          background: rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 0.2rem 0.75rem;
          letter-spacing: 0.04em;
        }

        /* Image */
        .parole-endgame-imgwrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #e8ede9;
        }
        .parole-endgame-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          animation: parole-fade-in 0.4s ease 0.2s both;
        }

        /* Stats */
        .parole-endgame-stats {
          display: flex;
          justify-content: center;
          gap: 0;
          padding: 1rem 1.5rem 0.6rem;
          border-bottom: 1px solid rgba(47,125,74,0.12);
        }
        .parole-endgame-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.15rem;
          padding: 0.5rem 0;
        }
        .parole-endgame-stat + .parole-endgame-stat {
          border-left: 1px solid rgba(47,125,74,0.12);
        }
        .parole-endgame-stat--mid {
          border-left: 1px solid rgba(47,125,74,0.12);
          border-right: 1px solid rgba(47,125,74,0.12);
        }
        .parole-endgame-stat-icon { font-size: 1.1rem; line-height: 1; }
        .parole-endgame-stat-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #103820;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }
        .parole-endgame-stat-val small {
          font-size: 0.7em;
          font-weight: 600;
          opacity: 0.55;
        }
        .parole-endgame-stat-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: #6b8070;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Trivia */
        .parole-endgame-trivia {
          padding: 1rem 1.5rem 0.75rem;
          border-bottom: 1px solid rgba(47,125,74,0.1);
        }
        .parole-endgame-trivia-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--green-dark);
          margin-bottom: 0.5rem;
        }
        .parole-endgame-trivia-text {
          margin: 0;
          font-size: 0.92rem;
          color: #1f3d2a;
          line-height: 1.6;
          animation: parole-slide-in 0.4s ease both;
        }
        .parole-endgame-trivia-empty {
          margin: 0;
          font-size: 0.88rem;
          color: #8ca090;
          font-style: italic;
        }
        .parole-endgame-trivia-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: #6b8070;
          font-style: italic;
        }
        .parole-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          display: inline-block;
          animation: parole-pulse 1s ease-in-out infinite;
        }
        @keyframes parole-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.7); }
        }

        /* CTA */
        .parole-endgame-lbstatus {
          min-height: 1.1rem; text-align: center;
          font-size: 0.82rem; font-weight: 700; color: var(--green);
          margin: 0.6rem 1.5rem 0;
        }
        .parole-page.dark .parole-endgame-lbstatus { color: #6fd08a; }
        .parole-endgame-ctas {
          display: flex; gap: 0.6rem;
          margin: 0.8rem 1.5rem 1.25rem;
        }
        .parole-endgame-cta {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--green);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0.85rem 1.2rem;
          font-size: 1rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, filter 0.15s;
        }
        .parole-endgame-cta:hover { background: var(--green-dark); transform: translateY(-1px); }
        .parole-endgame-cta:active { transform: scale(0.98); }
        .parole-endgame-cta--ghost {
          flex: 0 0 auto;
          background: transparent; color: var(--green);
          border: 1.5px solid rgba(47,125,74,0.3);
        }
        .parole-endgame-cta--ghost:hover { background: rgba(47,125,74,0.08); }
        .parole-page.dark .parole-endgame-cta--ghost { color: #6fd08a; border-color: rgba(95,208,154,0.3); }
        .parole-page.dark .parole-endgame-cta--ghost:hover { background: rgba(95,208,154,0.1); }

        @keyframes parole-slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 480px) {
          .parole-endgame-card { max-height: 96vh; border-radius: 16px; }
          .parole-endgame-header { border-radius: 16px 16px 0 0; }
          .parole-endgame-word { font-size: 1.9rem; letter-spacing: 0.14em; }
        }


        .parole-page .btn-primary { background-color: var(--green); border-color: var(--green); }
        .parole-page .btn-primary:hover,
        .parole-page .btn-primary:focus { background-color: var(--green-dark); border-color: var(--green-dark); }

        /* Pannello comandi laterale: nascosto su mobile (si usa il touch). */
        .parole-controls { display: none; }
        .parole-controls-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--green-dark);
          margin: 0 0 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .parole-cmd-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .parole-cmd {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: #fff;
          border: 1px solid rgba(47,125,74,0.3);
          color: var(--green-dark);
          border-radius: 8px;
          padding: 0.55rem 0.7rem;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s, transform 0.08s, box-shadow 0.15s;
        }
        .parole-cmd:hover { background: rgba(47,125,74,0.08); box-shadow: 0 2px 8px rgba(47,125,74,0.18); }
        .parole-cmd:active { transform: scale(0.96); }
        .parole-cmd--ok { background: var(--green); border-color: var(--green); color: #fff; }
        .parole-cmd--ok:hover { background: var(--green-dark); }
        .parole-cmd--del { background: #fbeceb; border-color: rgba(192,57,43,0.3); color: var(--absent); }
        .parole-cmd--del:hover { background: #f7dcd9; }
        .parole-page.dark .parole-cmd--ok { background: var(--green); color: #06160e; }
        .parole-page.dark .parole-cmd--del { background: #33211f; border-color: rgba(192,57,43,0.4); color: #f0a79e; }
        /* Scorciatoie compatte su una riga */
        .parole-shortcuts-line {
          margin: 0.7rem 0 0; padding: 0;
          font-size: 0.72rem; color: #5b6b61; line-height: 1.9;
          text-align: center;
        }
        .parole-shortcuts-line kbd {
          background: #e7ece9;
          border: 1px solid #c5d1ca;
          border-bottom-width: 2px;
          border-radius: 4px;
          padding: 0.05rem 0.3rem;
          font-family: "Roboto Mono", monospace;
          font-size: 0.7rem;
          color: #17271d;
          margin: 0 1px;
        }
        .parole-page.dark .parole-shortcuts-line { color: #7ab893; }
        .parole-page.dark .parole-shortcuts-line kbd {
          background: #253025; border-color: #3a5040; color: #c8e0cc;
        }
        .parole-controls-hint {
          font-size: 0.75rem;
          color: #5b6b61;
          margin: 0.75rem 0 0;
          line-height: 1.35;
        }

        .parole-keyboard {
          width: 100%;
          max-width: 500px;
          margin-top: auto;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .parole-krow { display: flex; gap: 6px; justify-content: center; }
        .parole-key {
          flex: 1;
          min-width: 0;
          height: 56px;
          border: none;
          border-radius: 6px;
          background: #d3dad6;
          color: #17271d;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.08s, background 0.15s, color 0.15s, opacity 0.2s;
        }
        .parole-key:hover:not(:disabled) { filter: brightness(0.96); }
        .parole-key:active:not(:disabled) { transform: scale(0.92); }
        .parole-key--wide { flex: 1.5; font-size: 0.75rem; }
        .parole-key--correct { background: var(--green); color: #fff; box-shadow: 0 0 10px rgba(47,125,74,0.5); }
        .parole-key--present { background: var(--amber); color: #fff; box-shadow: 0 0 10px rgba(217,164,0,0.55); }
        .parole-key--absent { background: var(--absent); color: #fff; }
        .parole-key--elim {
          animation: parole-elim 0.3s ease;
        }
        @keyframes parole-elim {
          0% { transform: scale(1); }
          50% { transform: scale(0.85) rotate(-3deg); }
          100% { transform: scale(1); }
        }

        /* Mobile: tessere fluide. */
        @media (max-width: 480px) {
          .parole-game { width: 100%; }
          .parole-board { width: min(92vw, 22rem); max-width: none; margin: 0 auto; }
          .parole-tile { width: auto; height: auto; aspect-ratio: 1; font-size: 1.5rem; }
          .parole-key { height: 50px; }
          .parole-toolbar { max-width: 100%; }
        }

        /* ── Touch (telefono): tutto nella finestra, zero scroll ── */
        @media (hover: none) and (pointer: coarse) {
          .parole-page {
            touch-action: manipulation;
          }
          /* Riduci spacing per guadagnare spazio verticale */
          .parole-modes  { margin-top: 0.5rem; }
          .parole-toolbar { padding: 0.4rem 1rem 0.2rem; }
          .parole-message-slot { height: 1.8rem; }
          .parole-stage  { flex: 1 1 0; min-height: 0; gap: 0.35rem; }
          .parole-game   { flex: 1 1 0; min-height: 0; }

          /*
           * Su touch la tastiera virtuale è nascosta, quindi si guadagna ~145px in più.
           * 195px ≈ header + modes + toolbar + message + padding (senza tastiera).
           */
          .parole-board {
            --ts: min(
              calc((min(92vw, 22rem) - (var(--cols, 5) - 1) * 7px) / var(--cols, 5)),
              calc((100svh - 195px - 5 * 7px) / 6)
            );
          }
          .parole-tile {
            font-size: min(1.4rem, calc(var(--ts) * 0.44));
          }
        }

        /* ── Desktop: layout a 3 colonne (Kit Italia) ── */
        @media (min-width: 760px) {
          /* Header: back+titolo sinistra | pill Menu centro | reset+tema+aiuto destra */
          .parole-header {
            height: 60px;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            padding: 0 1.25rem;
          }
          .parole-hdr-left  { justify-self: start; gap: 0.75rem; }
          .parole-hdr-center { display: flex; align-items: center; justify-content: center; }
          .parole-hdr-right { justify-self: end; gap: 0.5rem; }
          .parole-title { font-size: 1.5rem; letter-spacing: 0.2em; animation: none; }
          .parole-mode-pill { padding: 0.3rem 0.85rem 0.3rem 0.65rem; font-size: 0.8rem; }
          .parole-keyboard { display: none; }

          /* Stage: board + pannello come UN UNICO BLOCCO centrato (come Angoli).
             flex con le due colonne dimensionate sul contenuto → niente vuoto
             sparso, tutto centrato nello schermo. */
          .parole-stage {
            flex: 1 1 0; min-height: 0;
            display: flex; flex-direction: row;
            align-items: center; justify-content: center;
            gap: 2.5rem;
            padding: 1rem 2rem;
          }
          .parole-game {
            display: flex; align-items: center; justify-content: center;
            flex: 0 1 auto; min-width: 0; height: 100%;
          }
          /* Pannello: si adatta all'altezza, NIENTE scroll (contenuto alleggerito). */
          .parole-controls {
            flex: 0 0 320px; width: 320px;
            display: flex; flex-direction: column;
            background: #fff;
            border: 1px solid rgba(47,125,74,0.14);
            border-radius: 14px;
            padding: 0.9rem 1rem;
            box-shadow: 0 4px 24px rgba(0,0,0,0.07);
            justify-content: flex-start;
          }

          /* Board: dimensione legata SOPRATTUTTO all'altezza disponibile
             (header 60px + padding), così sta sempre nello schermo senza scroll.
             Il limite di larghezza evita che diventi sproporzionata. */
          .parole-board {
            --ts: min(
              calc((min(40vw, 24rem) - (var(--cols, 5) - 1) * 7px) / var(--cols, 5)),
              calc((100svh - 92px - 5 * 7px) / 6)
            );
          }

          /* Stato lettere nel pannello: tasti leggibili 30px */
          .parole-mini-kbd { display: grid; }

          /* Stats row 2×2 compatta in cima al pannello (come Angoli) */
          .parole-stats-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;
            width: 100%; margin-bottom: 0.6rem;
          }

          /* Toast nel pannello (non fixed) */
          .parole-message-slot {
            min-height: 1.8rem; width: 100%; text-align: center;
            display: flex; align-items: center; justify-content: center;
          }

          /* Cmd buttons grandi nel pannello comandi */
          .parole-cmd {
            padding: 0.55rem 0.7rem;
            font-size: 0.95rem; font-weight: 700;
          }
          .parole-cmd-row { margin-bottom: 0; gap: 0.4rem; }

          .parole-panel-label { color: var(--green-dark); }
        }

        /* ── Input nascosto per tastiera nativa mobile ── */
        .parole-hidden-input {
          position: fixed;
          top: 0; left: 0;
          width: 1px; height: 1px;
          opacity: 0;
          pointer-events: none;
          border: none; outline: none;
          padding: 0; margin: 0;
          font-size: 16px; /* impedisce zoom iOS */
          -webkit-user-select: text;
          user-select: text;
        }

        /* ── Su touch screen: nascondi tastiera on-screen, usa quella nativa ── */
        @media (hover: none) and (pointer: coarse) {
          .parole-keyboard { display: none !important; }
        }

        /* ── Background animato (orbi galleggianti) ── */
        .parole-bg {
          position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;
        }
        .parole-bg::before, .parole-bg::after {
          content: ''; position: absolute; border-radius: 50%;
        }
        .parole-bg::before {
          width: 70vmax; height: 70vmax; top: -25%; left: -15%;
          background: radial-gradient(circle, rgba(47,125,74,0.12) 0%, transparent 65%);
          animation: parole-orb1 22s ease-in-out infinite;
        }
        .parole-bg::after {
          width: 55vmax; height: 55vmax; bottom: -20%; right: -10%;
          background: radial-gradient(circle, rgba(47,125,74,0.09) 0%, transparent 65%);
          animation: parole-orb2 28s ease-in-out infinite;
        }
        @keyframes parole-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(6%,10%) scale(1.1); }
          70%     { transform: translate(-4%,4%) scale(0.93); }
        }
        @keyframes parole-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-9%,-7%) scale(1.18); }
        }
        .parole-page.dark .parole-bg::before {
          background: radial-gradient(circle, rgba(47,125,74,0.22) 0%, transparent 65%);
        }
        .parole-page.dark .parole-bg::after {
          background: radial-gradient(circle, rgba(47,125,74,0.17) 0%, transparent 65%);
        }

        /* ── Effetti di stato ── */

        /* Tasto premuto (glow verde) */
        .parole-key--pressed {
          background: rgba(47,125,74,0.55) !important;
          color: #fff !important;
          transform: scale(0.88) !important;
          box-shadow: 0 0 14px rgba(47,125,74,0.5) !important;
          transition: none !important;
        }

        /* Timer ansioso — livello 1 (>60s) */
        .parole-anx-1 .parole-stat:first-child { color: var(--amber); }

        /* Livello 2 (>120s): timer arancione pulsante */
        .parole-anx-2 .parole-stat:first-child {
          color: #e07b22;
          animation: parole-timer-pulse 1.1s ease-in-out infinite;
        }
        @keyframes parole-timer-pulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%     { transform: scale(1.07); opacity: 0.82; }
        }

        /* Livello 3 (>180s): rosso panico + vignette */
        .parole-anx-3 .parole-stat:first-child {
          color: var(--absent);
          animation: parole-timer-pulse 0.55s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(192,57,43,0.28);
        }
        .parole-anx-3::after {
          content: '';
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          box-shadow: inset 0 0 120px rgba(150,0,0,0.18);
          animation: parole-vignette-pulse 1.1s ease-in-out infinite;
        }
        @keyframes parole-vignette-pulse {
          0%,100% { opacity: 0.7; }
          50%     { opacity: 1; }
        }

        /* Flash errore (parola sbagliata) */
        .parole-errflash::before {
          content: '';
          position: fixed; inset: 0; z-index: 10; pointer-events: none;
          background: rgba(192,57,43,0.11);
          animation: parole-errflash-anim 0.55s ease forwards;
        }
        @keyframes parole-errflash-anim {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Glow vittoria */
        .parole-page.parole-won::before {
          content: '';
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: radial-gradient(ellipse at 50% 40%, rgba(200,164,21,0.15) 0%, transparent 65%);
          animation: parole-fade-in 0.7s ease forwards;
        }

        /* Effetto sconfitta: board trema */
        .parole-page.parole-lost .parole-board {
          animation: parole-lost-shake 0.65s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes parole-lost-shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%     { transform: translateX(-7px) rotate(-0.6deg); }
          30%     { transform: translateX(7px) rotate(0.6deg); }
          45%     { transform: translateX(-5px) rotate(-0.4deg); }
          60%     { transform: translateX(5px) rotate(0.4deg); }
          75%     { transform: translateX(-3px) rotate(-0.2deg); }
        }

        /* ── Dark mode ── */
        .parole-page.dark {
          background: #111916;
          color: #d4e8dc;
        }
        .parole-page.dark .parole-modes {
          background: rgba(47,125,74,0.13);
        }
        .parole-page.dark .parole-mode { color: #7ab893; }
        .parole-page.dark .parole-stat {
          background: rgba(47,125,74,0.13);
          color: #7ab893;
        }
        .parole-page.dark .parole-message-slot { color: #d4e8dc; }
        .parole-page.dark .parole-tile {
          background: #1a2720;
          border-color: rgba(47,125,74,0.28);
          color: #d4e8dc;
        }
        .parole-page.dark .parole-tile--cursor {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(47,125,74,0.45);
        }
        .parole-page.dark .parole-tile--filled { border-color: var(--green); }
        .parole-page.dark .parole-key {
          background: #253025;
          color: #c8e0cc;
        }
        /* Colori tasti con lettera già usata: mantengono i colori originali */
        .parole-page.dark .parole-key--correct { background: var(--green); color: #fff; box-shadow: 0 0 14px rgba(95,208,154,0.65); }
        .parole-page.dark .parole-key--present  { background: var(--amber); color: #fff; box-shadow: 0 0 14px rgba(224,160,32,0.7); }
        .parole-page.dark .parole-key--absent   { background: #5a1515; color: #c89090; }
        /* Colori tessere: specificità 0,2,0 serve per battere .parole-tile (0,2,0 pari → ordine vince) */
        .parole-page.dark .parole-tile--correct { background: var(--green); border-color: var(--green); color: #fff; box-shadow: 0 0 18px rgba(95,208,154,0.6), inset 0 0 9px rgba(255,255,255,0.22); }
        .parole-page.dark .parole-tile--present  { background: var(--amber); border-color: var(--amber); color: #fff; box-shadow: 0 0 18px rgba(224,160,32,0.65), inset 0 0 9px rgba(255,255,255,0.25); }
        .parole-page.dark .parole-tile--absent  { background: var(--absent); border-color: var(--absent); color: #fff; }
        /* Toast: su sfondo #111916 il precedente #17271d era quasi invisibile */
        .parole-page.dark .parole-message {
          background: #1e3d2b;
          color: #d4e8dc;
        }
        /* Endgame overlay */
        .parole-page.dark .parole-endgame-overlay {
          background: rgba(5,14,9,0.82);
        }
        .parole-page.dark .parole-endgame-card {
          background: #1a2720;
        }
        .parole-page.dark .parole-endgame-imgwrap { background: #253025; }
        .parole-page.dark .parole-endgame-stat-val { color: #d4e8dc; }
        .parole-page.dark .parole-endgame-stat-lbl { color: #7ab893; }
        .parole-page.dark .parole-endgame-stat + .parole-endgame-stat,
        .parole-page.dark .parole-endgame-stat--mid {
          border-color: rgba(47,125,74,0.18);
        }
        .parole-page.dark .parole-endgame-stats {
          border-color: rgba(47,125,74,0.15);
        }
        .parole-page.dark .parole-endgame-trivia { border-color: rgba(47,125,74,0.12); }
        .parole-page.dark .parole-endgame-trivia-title { color: #7ab893; }
        .parole-page.dark .parole-endgame-trivia-text { color: #c4dcc8; }
        .parole-page.dark .parole-endgame-trivia-empty,
        .parole-page.dark .parole-endgame-trivia-loading { color: #7ab893; }
        /* Desktop controls panel */
        .parole-page.dark .parole-controls {
          background: #1a2720 !important;
          border-color: rgba(47,125,74,0.2) !important;
        }
        .parole-page.dark .parole-controls-title { color: #7ab893; }
        .parole-page.dark .parole-controls-hint { color: #7ab893; }
        .parole-page.dark .parole-cmd {
          background: #253025;
          border-color: rgba(47,125,74,0.3);
          color: #7ab893;
        }
        .parole-page.dark .parole-cmd:hover { background: rgba(47,125,74,0.18); }
        /* Nuovi elementi dark mode */
        .parole-page.dark .parole-panel-divider { background: rgba(47,125,74,0.15); }
        .parole-page.dark .parole-panel-label { color: #7ab893; }
        .parole-page.dark .parole-mode-sm {
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.65);
        }
        .parole-page.dark .parole-mode-sm--active {
          background: rgba(255,255,255,0.2); color: #fff;
        }
        .parole-page.dark .parole-mini-key { background: #2e3e35; color: #9ab8a2; }
        .parole-page.dark .parole-mini-key--absent { background: #1e2820; color: #4a5e50; }
        .parole-page.dark .parole-mini-key--elim { background: rgba(192,57,43,0.22); color: #c87070; text-decoration: line-through; }
        .parole-page.dark .parole-mini-key--correct { background: var(--green); color: #fff; box-shadow: 0 0 12px rgba(95,208,154,0.7), inset 0 0 5px rgba(255,255,255,0.3); }
        .parole-page.dark .parole-mini-key--present { background: var(--amber); color: #fff; box-shadow: 0 0 12px rgba(224,160,32,0.75), inset 0 0 5px rgba(255,255,255,0.35); }
      `}</style>
    </div>
  );
}
