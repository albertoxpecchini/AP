import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, Moon, Sun, Flame, Check, X as XIcon, ImageOff, ListOrdered, RotateCcw, Send } from "lucide-react";

import TriviaMenu, { type ChapterSelection, type TypeSelection } from "./TriviaMenu";
import NicknameGate, { getStoredNick } from "./NicknameGate";
import Leaderboard from "./Leaderboard";
import GameTutorial, { hasSeenTutorial } from "../components/GameIntro";
import { TRIVIA_INTRO } from "./tutorialSteps";

import { questionsForMany, pickQuestions } from "./questions";
import { isAnswerCorrect, type Question } from "./parseTrivia";
import { fetchPhoto, prefetchPhoto } from "./photos";
import { markSeen, coveragePct } from "./coverage";
import { gradeFromPct, isGoodGrade } from "./grade";
import { submitScore, type ScoreRow } from "./leaderboardApi";

const GAME_KEY = "trivia";
const BEST_STREAK_KEY = "trivia-best-streak";
const BEST_GRADE_KEY = "trivia-best-grade";
const DARK_KEY = "games-dark";

// Tempo per rispondere (ms) e punteggio: base per corretta + bonus velocità.
const TIME_PER_Q = 20000;
const BASE_POINTS = 100;
const SPEED_BONUS_MAX = 100; // si esaurisce linearmente entro TIME_PER_Q
// Tetto di domande per partita (le domande filtrate vengono mescolate e tagliate).
const MAX_QUESTIONS = 15;

type Phase = "menu" | "gate" | "playing" | "results";

interface Played {
  question: Question;
  correct: boolean;
  awarded: number;
}

export default function Trivia() {
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem(DARK_KEY);
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });
  const toggleDark = () => setDark(d => { const n = !d; try { localStorage.setItem(DARK_KEY, n ? "1" : "0"); } catch {} return n; });

  const [phase, setPhase] = useState<Phase>("menu");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [nick, setNick] = useState<string>(() => getStoredNick());
  const pendingPlay = useRef<{ chapters: ChapterSelection; types: TypeSelection } | null>(null);

  // ── stato partita ──
  const [chapters, setChapters] = useState<ChapterSelection>([]);
  const [qTypes, setQTypes] = useState<TypeSelection>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [played, setPlayed] = useState<Played[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreakRun, setBestStreakRun] = useState(0);
  const [score, setScore] = useState(0);

  // ── stato domanda corrente ──
  const [photoUrl, setPhotoUrl] = useState<string | null | undefined>(undefined); // undefined = caricamento
  const [openInput, setOpenInput] = useState("");
  const [revealed, setRevealed] = useState(false);     // risposta data, mostra esito
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [remaining, setRemaining] = useState(TIME_PER_Q);

  const tickRef = useRef<number>();
  const qStart = useRef<number>(0);
  const openRef = useRef<HTMLInputElement>(null);

  // record persistiti (menu)
  const [bestStreak, setBestStreak] = useState(() => { try { return Number(localStorage.getItem(BEST_STREAK_KEY)) || 0; } catch { return 0; } });
  const [bestGrade, setBestGrade] = useState<string>(() => { try { return localStorage.getItem(BEST_GRADE_KEY) || "—"; } catch { return "—"; } });
  const [coverage, setCoverage] = useState(() => coveragePct());

  const [justSubmitted, setJustSubmitted] = useState<ScoreRow | null>(null);

  const current = queue[idx];

  // ─── Avvio partita ───
  // Usa tutte le domande che corrispondono a capitoli+tipi scelti, mescolate
  // e limitate a MAX_QUESTIONS.
  const startGame = useCallback((chaps: ChapterSelection, t: TypeSelection) => {
    const pool = questionsForMany(chaps, t);
    const picked = pickQuestions(pool, MAX_QUESTIONS);
    if (picked.length === 0) return;
    setChapters(chaps);
    setQTypes(t);
    setQueue(picked);
    setIdx(0);
    setPlayed([]);
    setStreak(0);
    setBestStreakRun(0);
    setScore(0);
    setPhase("playing");
  }, []);

  // "Gioca": prima il gate nickname (se mai scelto), poi parte.
  const onPlay = useCallback((chaps: ChapterSelection, t: TypeSelection) => {
    if (!nick) {
      pendingPlay.current = { chapters: chaps, types: t };
      setPhase("gate");
      return;
    }
    if (!hasSeenTutorial(GAME_KEY)) { pendingPlay.current = { chapters: chaps, types: t }; setShowTutorial(true); return; }
    startGame(chaps, t);
  }, [nick, startGame]);

  const onGateConfirm = useCallback((n: string) => {
    setNick(n);
    const p = pendingPlay.current;
    setPhase("menu");
    if (p) {
      if (!hasSeenTutorial(GAME_KEY)) { setShowTutorial(true); return; }
      startGame(p.chapters, p.types);
    }
  }, [startGame]);

  const onTutorialDone = useCallback(() => {
    setShowTutorial(false);
    const p = pendingPlay.current;
    pendingPlay.current = null;
    if (p && nick) startGame(p.chapters, p.types);
  }, [nick, startGame]);

  // Chiave capitolo per la classifica: "all" se nessuno, l'id se uno solo,
  // altrimenti "misto" (più capitoli selezionati).
  const chapterKey = chapters.length === 0 ? "all" : chapters.length === 1 ? chapters[0] : "misto";

  // ─── Setup di ogni domanda: foto + timer + prefetch della successiva ───
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    setRevealed(false);
    setPickedOption(null);
    setOpenInput("");
    setWasCorrect(false);
    setRemaining(TIME_PER_Q);
    setPhotoUrl(undefined);

    let alive = true;
    fetchPhoto(current.photoQuery).then(url => { if (alive) setPhotoUrl(url); });
    const nextQ = queue[idx + 1];
    if (nextQ) prefetchPhoto(nextQ.photoQuery);

    if (current.type === "aperta") setTimeout(() => openRef.current?.focus(), 60);

    qStart.current = Date.now();
    clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const left = TIME_PER_Q - (Date.now() - qStart.current);
      if (left <= 0) {
        clearInterval(tickRef.current);
        setRemaining(0);
        if (alive) answer(null); // tempo scaduto = errata
      } else {
        setRemaining(left);
      }
    }, 100);

    return () => { alive = false; clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, current?.id]);

  // ─── Registra una risposta ───
  const answer = useCallback((given: { type: "option"; index: number } | { type: "open"; text: string } | { type: "bool"; value: "vero" | "falso" } | null) => {
    if (!current || revealed) return;
    clearInterval(tickRef.current);
    const elapsed = Date.now() - qStart.current;

    let correct = false;
    if (given === null) {
      correct = false; // timeout
    } else if (given.type === "option" && current.options) {
      setPickedOption(given.index);
      correct = !!current.options[given.index]?.correct;
    } else if (given.type === "bool") {
      correct = current.answer === given.value;
    } else if (given.type === "open") {
      correct = isAnswerCorrect(given.text, current);
    }

    // Punteggio: base + bonus velocità (solo se corretta).
    let awarded = 0;
    if (correct) {
      const speedFrac = Math.max(0, 1 - elapsed / TIME_PER_Q);
      awarded = BASE_POINTS + Math.round(SPEED_BONUS_MAX * speedFrac);
    }

    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    setBestStreakRun(b => Math.max(b, newStreak));
    setScore(s => s + awarded);
    setWasCorrect(correct);
    setRevealed(true);
    setPlayed(prev => [...prev, { question: current, correct, awarded }]);

    if (correct) {
      confetti({ particleCount: 28, spread: 55, startVelocity: 32, origin: { y: 0.7 }, colors: ["#2F7D4A", "#D9A400", "#fff", "#6fd08a"] });
      // Trofeo + confetti grossi sui traguardi di streak.
      if ([3, 5, 7, 10].includes(newStreak)) {
        setTimeout(() => confetti({ particleCount: 160, spread: 100, origin: { y: 0.45 }, colors: ["#c8a415", "#2F7D4A", "#D9A400", "#fff"] }), 250);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, streak]);

  // ─── Avanti: prossima domanda o fine ───
  const goNext = useCallback(() => {
    if (idx + 1 < queue.length) {
      setIdx(i => i + 1);
    } else {
      finishGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, queue.length]);

  const finishGame = useCallback(() => {
    clearInterval(tickRef.current);
    // copertura: marca tutte le domande viste in questa partita
    markSeen(queue.map(q => q.id));
    setCoverage(coveragePct());

    const correctCount = played.filter(p => p.correct).length;
    const total = queue.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);
    const grade = gradeFromPct(accuracy);

    // record locali
    if (bestStreakRun > bestStreak) { setBestStreak(bestStreakRun); try { localStorage.setItem(BEST_STREAK_KEY, String(bestStreakRun)); } catch {} }
    // miglior voto = quello con percentuale più alta vista finora
    const prevBestPct = gradeToPct(bestGrade);
    if (accuracy > prevBestPct) { setBestGrade(grade.letter); try { localStorage.setItem(BEST_GRADE_KEY, grade.letter); } catch {} }

    // invio classifica (non blocca la UI)
    submitScore({ nick: nick || "Anon", score, chapter: chapterKey, accuracy, best_streak: bestStreakRun })
      .then(row => setJustSubmitted(row))
      .catch(() => {});

    if (isGoodGrade(accuracy)) {
      setTimeout(() => confetti({ particleCount: 220, spread: 120, origin: { y: 0.4 }, colors: ["#2F9E5A", "#D9A400", "#fff", "#6fd08a", "#c8a415"] }), 200);
    }
    setPhase("results");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, played, bestStreakRun, bestStreak, bestGrade, nick, score, chapterKey]);

  const backToMenu = useCallback(() => {
    clearInterval(tickRef.current);
    setPhase("menu");
    setCoverage(coveragePct());
  }, []);

  // ─── Render ───
  const results = useMemo(() => {
    const correctCount = played.filter(p => p.correct).length;
    const total = played.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);
    return { correctCount, total: played.length, accuracy, grade: gradeFromPct(accuracy) };
  }, [played]);

  return (
    <div className={`trv-page${dark ? " dark" : ""}`}>
      {/* ── Header ── */}
      {phase === "playing" && current && (
        <header className="trv-hud">
          <button className="trv-hud-back" onClick={backToMenu} aria-label="Esci"><ArrowLeft size={18} /></button>
          <div className="trv-hud-prog">
            <span className="trv-hud-prog-txt">{idx + 1} / {queue.length}</span>
            <div className="trv-hud-bar"><div className="trv-hud-bar-fill" style={{ width: `${((idx) / queue.length) * 100}%` }} /></div>
          </div>
          <div className="trv-hud-right">
            <span className={`trv-hud-streak${streak > 0 ? " on" : ""}`}><Flame size={15} /> {streak}</span>
            <span className="trv-hud-score">{score.toLocaleString("it-IT")}</span>
          </div>
        </header>
      )}

      {/* ── PLAYING ── */}
      {phase === "playing" && current && (
        <main className="trv-stage" key={current.id}>
          {/* Timer */}
          <div className="trv-timer">
            <div className="trv-timer-fill" style={{ width: `${(remaining / TIME_PER_Q) * 100}%`, background: remaining < 5000 ? "#c0392b" : undefined }} />
          </div>

          {/* Foto / fallback */}
          <div className="trv-photo">
            {photoUrl === undefined ? (
              <div className="trv-photo-skel" />
            ) : photoUrl ? (
              <img src={photoUrl} alt="" loading="eager" className="trv-photo-img" />
            ) : (
              <div className="trv-photo-fallback"><ImageOff size={28} /><span>{current.chapter}</span></div>
            )}
            <span className="trv-photo-chip">{typeLabel(current.type)}</span>
          </div>

          {/* Contesto SEMPRE visibile: di cosa/chi/quale opera si parla.
              Così nessuna domanda resta ambigua ("quale chiesa?"). */}
          <div className="trv-ctx">
            <span className="trv-ctx-item trv-ctx-arg" title="Argomento">{current.argomento}</span>
            {current.edificio && <span className="trv-ctx-item trv-ctx-edi" title="Edificio / opera">{current.edificio}</span>}
            {current.autore && <span className="trv-ctx-item trv-ctx-aut" title="Autore">{current.autore}</span>}
          </div>

          {/* Domanda */}
          <h2 className="trv-q">{current.text}</h2>

          {/* Risposte per tipo */}
          {current.type === "multipla" && current.options && (
            <div className="trv-opts">
              {current.options.map((o, i) => {
                const state = !revealed ? "" : o.correct ? "ok" : (pickedOption === i ? "no" : "dim");
                return (
                  <button key={i} className={`trv-opt ${state}`} disabled={revealed} onClick={() => answer({ type: "option", index: i })}>
                    <span className="trv-opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="trv-opt-text">{o.text}</span>
                    {revealed && o.correct && <Check size={18} className="trv-opt-ic" />}
                    {revealed && !o.correct && pickedOption === i && <XIcon size={18} className="trv-opt-ic" />}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "vero-falso" && (
            <div className="trv-bool">
              {(["vero", "falso"] as const).map(v => {
                const isCorrectOne = current.answer === v;
                const state = !revealed ? "" : isCorrectOne ? "ok" : "no";
                return (
                  <button key={v} className={`trv-boolbtn ${v} ${state}`} disabled={revealed} onClick={() => answer({ type: "bool", value: v })}>
                    {v === "vero" ? "VERO" : "FALSO"}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "aperta" && (
            <form className="trv-open" onSubmit={e => { e.preventDefault(); if (!revealed && openInput.trim()) answer({ type: "open", text: openInput }); }}>
              <input
                ref={openRef}
                className={`trv-open-input${revealed ? (wasCorrect ? " ok" : " no") : ""}`}
                value={openInput}
                disabled={revealed}
                placeholder="Scrivi la tua risposta…"
                autoComplete="off" autoCorrect="off" spellCheck={false}
                onChange={e => setOpenInput(e.target.value)}
              />
              {!revealed && (
                <button type="submit" className="trv-open-send" disabled={!openInput.trim()}><Send size={18} /></button>
              )}
            </form>
          )}

          {/* Esito + spiegazione + avanti */}
          {revealed && (
            <div className={`trv-feedback ${wasCorrect ? "ok" : "no"}`}>
              <div className="trv-feedback-head">
                {wasCorrect ? <><Check size={18} /> Corretto! <b>+{played[played.length - 1]?.awarded}</b></> : <><XIcon size={18} /> {current.type === "aperta" ? <>La risposta era: <b>{current.answer}</b></> : "Sbagliato"}</>}
              </div>
              {current.explanation && <p className="trv-feedback-exp">{current.explanation}</p>}
              <button className="trv-next" onClick={goNext}>{idx + 1 < queue.length ? "Avanti" : "Vedi il voto"} →</button>
            </div>
          )}
        </main>
      )}

      {/* ── RESULTS ── */}
      {phase === "results" && (
        <main className="trv-results">
          <div className="trv-res-grade" style={{ color: dark ? results.grade.colorDark : results.grade.color }}>
            <div className="trv-res-letter">{results.grade.letter}</div>
            <div className="trv-res-label">{results.grade.label}</div>
          </div>
          <div className="trv-res-stats">
            <div className="trv-res-stat"><span className="trv-res-num">{results.accuracy}%</span><span className="trv-res-lbl">Corrette</span></div>
            <div className="trv-res-stat"><span className="trv-res-num">{results.correctCount}/{results.total}</span><span className="trv-res-lbl">Risposte</span></div>
            <div className="trv-res-stat"><span className="trv-res-num">{score.toLocaleString("it-IT")}</span><span className="trv-res-lbl">Punti</span></div>
            <div className="trv-res-stat"><span className="trv-res-num">{bestStreakRun}</span><span className="trv-res-lbl">Streak</span></div>
          </div>
          <p className="trv-res-cov">Hai esplorato il <b>{coverage}%</b> di tutte le domande</p>
          <div className="trv-res-actions">
            <button className="trv-res-primary" onClick={() => startGame(chapters, qTypes)}><RotateCcw size={17} /> Rigioca</button>
            <button className="trv-res-second" onClick={() => setShowLeaderboard(true)}><ListOrdered size={17} /> Classifica</button>
          </div>
          <button className="trv-res-menu" onClick={backToMenu}>Torna al menu</button>
          <Link to="/#progetti" className="trv-res-back"><ArrowLeft size={14} /> Torna ai progetti</Link>
        </main>
      )}

      {/* ── MENU ── */}
      {phase === "menu" && (
        <TriviaMenu
          dark={dark}
          bestStreak={bestStreak}
          bestGrade={bestGrade}
          coverage={coverage}
          nick={nick}
          onPlay={onPlay}
          onTutorial={() => setShowTutorial(true)}
          onLeaderboard={() => setShowLeaderboard(true)}
          onChangeNick={() => { pendingPlay.current = null; setPhase("gate"); }}
        />
      )}

      {/* ── Overlays ── */}
      {phase === "gate" && (
        <NicknameGate dark={dark} initial={nick} onConfirm={onGateConfirm} />
      )}
      {showTutorial && (
        <GameTutorial
          gameKey={GAME_KEY}
          steps={TRIVIA_INTRO}
          accentColor="#2F7D4A"
          darkBg="#103820"
          dark={dark}
          onDone={onTutorialDone}
        />
      )}
      {showLeaderboard && (
        <Leaderboard dark={dark} myNick={nick} justSubmitted={justSubmitted} onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Toggle tema (visibile in playing/results) */}
      {(phase === "playing" || phase === "results") && (
        <button className="trv-theme" onClick={toggleDark} aria-label="Tema chiaro/scuro">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}

      <style>{styles}</style>
    </div>
  );
}

// % di una lettera-voto (per confronto "miglior voto"). Coarse ma sufficiente.
function gradeToPct(letter: string): number {
  const map: Record<string, number> = {
    "A+": 97, "A": 93, "A−": 90, "B+": 87, "B": 83, "B−": 80,
    "C+": 77, "C": 73, "C−": 70, "D+": 67, "D": 60, "F": 0,
  };
  return map[letter] ?? -1;
}

function typeLabel(t: Question["type"]): string {
  return t === "multipla" ? "Scelta multipla" : t === "vero-falso" ? "Vero o Falso" : "Risposta aperta";
}

const styles = `
.trv-page {
  position: fixed; inset: 0; z-index: 200; overflow-y: auto;
  font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
  background: #f4f6f5; color: #17271d;
  --green: #2F7D4A; --green-d: #1F6B3D; --gold: #D9A400;
  --card: #fff; --bord: rgba(47,125,74,0.15); --sub: #4a5c50;
}
.trv-page.dark {
  background: #0e1512; color: #d4e8dc;
  --green: #2f9e63; --green-d: #6fe0a6; --gold: #e8c34a;
  --card: #15231c; --bord: rgba(95,208,154,0.2); --sub: #a4c4aa;
}

/* HUD */
.trv-hud {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.7rem 0.9rem;
  background: #103820; color: #fff;
}
.trv-page.dark .trv-hud { background: #0a1410; }
.trv-hud-back {
  width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
  background: rgba(255,255,255,0.12); color: #fff; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; transition: background .15s;
}
.trv-hud-back:hover { background: rgba(255,255,255,0.24); }
.trv-hud-prog { flex: 1; min-width: 0; }
.trv-hud-prog-txt { font-size: .7rem; font-weight: 800; opacity: .8; letter-spacing: .04em; }
.trv-hud-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.15); margin-top: 3px; overflow: hidden; }
.trv-hud-bar-fill { height: 100%; background: #6fd08a; border-radius: 999px; transition: width .3s ease; }
.trv-hud-right { display: flex; align-items: center; gap: .6rem; flex-shrink: 0; }
.trv-hud-streak { display: inline-flex; align-items: center; gap: .2rem; font-weight: 800; font-size: .85rem; opacity: .55; transition: opacity .2s; }
.trv-hud-streak.on { opacity: 1; color: #ffd27a; }
.trv-hud-score { font-weight: 900; font-size: 1.05rem; font-variant-numeric: tabular-nums; min-width: 48px; text-align: right; }

/* Stage */
.trv-stage {
  max-width: 640px; margin: 0 auto; padding: 0.9rem 1rem 2rem;
  display: flex; flex-direction: column; gap: 0.9rem;
  animation: trv-q-in .3s ease;
}
@keyframes trv-q-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }

.trv-timer { height: 5px; border-radius: 999px; background: var(--bord); overflow: hidden; }
.trv-timer-fill { height: 100%; background: var(--green); border-radius: 999px; transition: width .1s linear; }

.trv-photo {
  position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 16px; overflow: hidden;
  background: var(--card); border: 1px solid var(--bord); box-shadow: 0 4px 18px rgba(0,0,0,0.07);
}
.trv-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; animation: trv-fade .35s ease; }
@keyframes trv-fade { from { opacity: 0; } to { opacity: 1; } }
.trv-photo-skel { position: absolute; inset: 0; background: linear-gradient(100deg, var(--card) 30%, rgba(47,125,74,0.08) 50%, var(--card) 70%); background-size: 200% 100%; animation: trv-shimmer 1.2s infinite; }
@keyframes trv-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.trv-photo-fallback {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .4rem;
  color: var(--sub); background: linear-gradient(160deg, rgba(47,125,74,0.10), rgba(217,164,0,0.06));
  font-weight: 800; font-size: 1rem; text-align: center; padding: 1rem;
}
.trv-photo-chip {
  position: absolute; top: .6rem; left: .6rem;
  font-size: .62rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  background: rgba(16,56,32,0.82); color: #fff; padding: .25rem .6rem; border-radius: 999px;
}

/* Contesto domanda (argomento · edificio · autore) */
.trv-ctx { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
.trv-ctx-item {
  display: inline-flex; align-items: center; gap: .3rem;
  font-size: .72rem; font-weight: 700; line-height: 1;
  padding: .32rem .6rem; border-radius: 999px;
  border: 1px solid var(--bord); background: var(--card); color: var(--sub);
  max-width: 100%; white-space: normal;
}
/* Pallini-prefisso colorati per distinguere a colpo d'occhio i tre campi. */
.trv-ctx-item::before {
  content: ""; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.trv-ctx-arg { color: var(--green-d); border-color: rgba(47,125,74,0.4); }
.trv-ctx-arg::before { background: var(--green); }
.trv-ctx-edi::before { background: var(--gold); }
.trv-ctx-aut::before { background: #3a7bbf; }
.trv-page.dark .trv-ctx-aut::before { background: #6fa8dc; }

.trv-q { font-size: clamp(1.15rem, 4.5vw, 1.5rem); font-weight: 800; margin: 0; line-height: 1.3; }

/* Multipla */
.trv-opts { display: flex; flex-direction: column; gap: .55rem; }
.trv-opt {
  display: flex; align-items: center; gap: .7rem; width: 100%; text-align: left;
  padding: .85rem 1rem; border-radius: 12px; cursor: pointer;
  background: var(--card); border: 2px solid var(--bord); color: inherit;
  font-family: inherit; font-size: .98rem; font-weight: 600;
  transition: border-color .15s, background .15s, transform .1s;
  animation: trv-opt-in .3s ease both;
}
.trv-opt:nth-child(1){animation-delay:.02s}.trv-opt:nth-child(2){animation-delay:.07s}.trv-opt:nth-child(3){animation-delay:.12s}.trv-opt:nth-child(4){animation-delay:.17s}
@keyframes trv-opt-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.trv-opt:not(:disabled):hover { border-color: var(--green); transform: translateY(-1px); }
.trv-opt-letter {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px;
  background: var(--bord); color: var(--green-d); font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center; font-size: .85rem;
}
.trv-page.dark .trv-opt-letter { color: var(--green-d); }
.trv-opt-text { flex: 1; min-width: 0; }
.trv-opt-ic { flex-shrink: 0; }
.trv-opt.ok { border-color: #2F9E5A; background: rgba(47,158,90,0.14); }
.trv-opt.ok .trv-opt-letter, .trv-opt.ok .trv-opt-ic { color: #2F9E5A; }
.trv-opt.no { border-color: #c0392b; background: rgba(192,57,43,0.12); }
.trv-opt.no .trv-opt-letter, .trv-opt.no .trv-opt-ic { color: #c0392b; }
.trv-opt.dim { opacity: .5; }

/* Vero/Falso */
.trv-bool { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
.trv-boolbtn {
  padding: 1.4rem 0; border-radius: 16px; border: 2px solid var(--bord);
  font-family: inherit; font-weight: 900; font-size: 1.3rem; letter-spacing: .06em; cursor: pointer;
  background: var(--card); color: inherit; transition: all .15s;
}
.trv-boolbtn.vero:not(:disabled):hover { border-color: #2F9E5A; background: rgba(47,158,90,0.1); color: #2F9E5A; }
.trv-boolbtn.falso:not(:disabled):hover { border-color: #c0392b; background: rgba(192,57,43,0.08); color: #c0392b; }
.trv-boolbtn.ok { border-color: #2F9E5A; background: rgba(47,158,90,0.16); color: #2F9E5A; }
.trv-boolbtn.no { border-color: #c0392b; background: rgba(192,57,43,0.12); color: #c0392b; opacity: .85; }

/* Aperta */
.trv-open { display: flex; gap: .5rem; }
.trv-open-input {
  flex: 1; min-width: 0; padding: .9rem 1.1rem; border-radius: 12px;
  border: 2px solid var(--bord); background: var(--card); color: inherit;
  font-family: inherit; font-size: 1.05rem; font-weight: 600; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.trv-open-input:focus { border-color: var(--green); box-shadow: 0 0 0 .2rem rgba(47,125,74,.16); }
.trv-open-input.ok { border-color: #2F9E5A; background: rgba(47,158,90,0.12); }
.trv-open-input.no { border-color: #c0392b; background: rgba(192,57,43,0.1); }
.trv-open-send {
  flex-shrink: 0; width: 52px; border-radius: 12px; border: none; cursor: pointer;
  background: var(--green); color: #fff; display: inline-flex; align-items: center; justify-content: center;
  transition: filter .12s;
}
.trv-open-send:disabled { opacity: .4; cursor: default; }
.trv-open-send:not(:disabled):hover { filter: brightness(.92); }

/* Feedback */
.trv-feedback {
  border-radius: 14px; padding: 1rem 1.1rem; border: 1px solid var(--bord);
  background: var(--card); animation: trv-fb-in .25s ease;
}
@keyframes trv-fb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.trv-feedback.ok { border-color: rgba(47,158,90,0.4); background: rgba(47,158,90,0.08); }
.trv-feedback.no { border-color: rgba(192,57,43,0.35); background: rgba(192,57,43,0.06); }
.trv-feedback-head { display: flex; align-items: center; gap: .4rem; font-weight: 800; font-size: 1rem; }
.trv-feedback.ok .trv-feedback-head { color: #2F9E5A; }
.trv-feedback.no .trv-feedback-head { color: #c0392b; }
.trv-feedback-exp { margin: .55rem 0 0; font-size: .9rem; line-height: 1.55; color: var(--sub); }
.trv-next {
  margin-top: .9rem; width: 100%; padding: .85rem 1rem; border-radius: 12px; border: none;
  background: var(--green); color: #fff; font-family: inherit; font-weight: 800; font-size: 1rem; cursor: pointer;
  box-shadow: 0 4px 18px rgba(47,125,74,0.32); transition: filter .12s, transform .12s;
}
.trv-next:hover { filter: brightness(.92); transform: translateY(-1px); }

/* Results */
.trv-results {
  max-width: 480px; margin: 0 auto; min-height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1.1rem; padding: 2rem 1.2rem; text-align: center;
  animation: trv-res-in .35s ease;
}
@keyframes trv-res-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.trv-res-grade { display: flex; flex-direction: column; align-items: center; }
.trv-res-letter { font-size: clamp(5rem, 26vw, 8rem); font-weight: 900; line-height: 1; animation: trv-pop .5s cubic-bezier(.34,1.56,.64,1); }
@keyframes trv-pop { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.trv-res-label { font-size: 1.2rem; font-weight: 800; margin-top: .3rem; }
.trv-res-stats { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; width: 100%; }
.trv-res-stat {
  background: var(--card); border: 1px solid var(--bord); border-radius: 12px; padding: .8rem;
  display: flex; flex-direction: column; gap: .15rem;
}
.trv-res-num { font-size: 1.5rem; font-weight: 900; font-variant-numeric: tabular-nums; }
.trv-res-lbl { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--sub); }
.trv-res-cov { font-size: .9rem; color: var(--sub); margin: 0; }
.trv-res-actions { display: flex; gap: .6rem; width: 100%; }
.trv-res-primary, .trv-res-second {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: .9rem 1rem; border-radius: 12px; font-family: inherit; font-weight: 800; font-size: .95rem; cursor: pointer;
  transition: filter .12s, transform .12s;
}
.trv-res-primary { border: none; background: var(--green); color: #fff; box-shadow: 0 4px 18px rgba(47,125,74,0.32); }
.trv-res-primary:hover { filter: brightness(.92); transform: translateY(-1px); }
.trv-res-second { border: 1.5px solid var(--bord); background: transparent; color: var(--green); }
.trv-res-second:hover { filter: brightness(.9); }
.trv-page.dark .trv-res-second { color: var(--green-d); }
.trv-res-menu { background: none; border: none; color: var(--sub); font-family: inherit; font-weight: 700; font-size: .9rem; cursor: pointer; padding: .3rem; }
.trv-res-menu:hover { filter: brightness(.8); }
.trv-res-back { display: inline-flex; align-items: center; gap: .35rem; color: var(--sub); text-decoration: none; font-size: .85rem; font-weight: 700; }
.trv-res-back:hover { filter: brightness(.8); }

/* Toggle tema */
.trv-theme {
  position: fixed; bottom: 1rem; right: 1rem; z-index: 50;
  width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--bord);
  background: var(--card); color: var(--green); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15); transition: transform .12s;
}
.trv-theme:hover { transform: scale(1.08); }
.trv-page.dark .trv-theme { color: var(--green-d); }
`;
