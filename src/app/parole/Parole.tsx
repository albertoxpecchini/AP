import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Clock,
  Trophy,
  CornerDownLeft,
  Delete,
} from "lucide-react";
import { LENGTHS, type WordLength, isValidWord, randomWord } from "./words";
import { getTrivia } from "./words-trivia";

const ROWS = 6;
const HINTS = 3; // aiuti disponibili per partita
const HINT_BATCH = 3; // lettere eliminate per ogni aiuto

type Status = "correct" | "present" | "absent";

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

export default function Parole() {
  const [length, setLength] = useState<WordLength>(5);
  const [answer, setAnswer] = useState(() => randomWord(5));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Status[][]>([]);
  const [slots, setSlots] = useState<string[]>(() => Array(5).fill(""));
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [hintsLeft, setHintsLeft] = useState(HINTS);
  const [seconds, setSeconds] = useState(0);
  const [record, setRecord] = useState<number | null>(null);

  const cols = length;
  const msgTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const r = Number(localStorage.getItem(recordKey(length)));
    setRecord(r > 0 ? r : null);
  }, [length]);

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

  const startGame = useCallback((len: WordLength) => {
    setLength(len);
    setAnswer(randomWord(len));
    setGuesses([]);
    setEvaluations([]);
    setSlots(Array(len).fill(""));
    setCursor(0);
    setState("playing");
    setMessage("");
    setEliminated(new Set());
    setHintsLeft(HINTS);
    setSeconds(0);
  }, []);

  const newGame = useCallback(() => startGame(length), [startGame, length]);

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

  const submit = useCallback(() => {
    if (!slots.every(Boolean)) {
      flash("Completa la parola");
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    const guess = slots.join("");
    if (!isValidWord(guess)) {
      flash("Parola non valida");
      setShake(true);
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
      flash("Bravo! Indovinata 🎉");
      window.setTimeout(() => {
        confetti({ particleCount: 160, spread: 75, origin: { y: 0.6 } });
      }, 350);
      setRecord((prev) => {
        const best = prev == null || seconds < prev ? seconds : prev;
        localStorage.setItem(recordKey(length), String(best));
        return best;
      });
    } else if (nextGuesses.length >= ROWS) {
      setState("lost");
      flash(`Era ${answer.toUpperCase()}`);
    }
  }, [slots, cols, answer, guesses, evaluations, flash, seconds, length]);

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
      if (/^[A-Z]$/.test(up) && !eliminated.has(up)) {
        setSlots((prev) => {
          const n = [...prev];
          n[cursor] = up.toLowerCase();
          return n;
        });
        setCursor((c) => Math.min(cols - 1, c + 1));
      }
    },
    [state, submit, cursor, cols, eliminated, slots],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") onKey("INVIO");
      else if (e.key === "Backspace") onKey("CANC");
      else if (e.key === "ArrowLeft") onKey("LEFT");
      else if (e.key === "ArrowRight") onKey("RIGHT");
      else if (e.key === "Home") setCursor(0);
      else if (e.key === "End") setCursor(cols - 1);
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey, cols]);

  const lastRow = guesses.length - 1;

  return (
    <div className="parole-page">
      <header className="parole-header theme-dark">
        <a href="/" className="parole-iconbtn" aria-label="Torna al sito">
          <ArrowLeft size={22} />
        </a>
        <h1 className="parole-title">
          PAR<span className="parole-title-accent">OL</span>E
        </h1>
        <button className="parole-iconbtn" onClick={newGame} aria-label="Nuova partita">
          <RotateCcw size={20} />
        </button>
      </header>

      <div className="parole-modes" role="group" aria-label="Lunghezza parola">
        {LENGTHS.map((len) => (
          <button
            key={len}
            type="button"
            className={`parole-mode${len === length ? " parole-mode--active" : ""}`}
            onClick={() => startGame(len)}
            aria-pressed={len === length}
          >
            {len} lettere
          </button>
        ))}
      </div>

      <div className="parole-toolbar">
        <span className="parole-stat" aria-label="Tempo">
          <Clock size={16} aria-hidden="true" />
          <span className="parole-stat-val">{fmt(seconds)}</span>
        </span>
        <button
          type="button"
          className="parole-hint-btn"
          onClick={useHint}
          disabled={state !== "playing" || hintsLeft <= 0}
        >
          <Lightbulb size={17} aria-hidden="true" />
          Aiuto
          <span className="parole-hint-badge">{hintsLeft}</span>
        </button>
        <span className="parole-stat" aria-label="Record">
          <Trophy size={16} aria-hidden="true" />
          <span className="parole-stat-val">{record != null ? fmt(record) : "—"}</span>
        </span>
      </div>

      <div className="parole-message-slot">
        {message && <div className="parole-message">{message}</div>}
      </div>

      <div className="parole-stage">
        <div className="parole-game">
          <main className="parole-board">
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

          {state !== "playing" && (
            <div className="parole-result">
              <p className="parole-result-text">
                {state === "won"
                  ? `Risolta in ${fmt(seconds)} e ${guesses.length} ${guesses.length === 1 ? "tentativo" : "tentativi"}`
                  : `La parola era ${answer.toUpperCase()}`}
              </p>
              {getTrivia(answer) && (
                <div className="parole-trivia">
                  <p className="parole-trivia-label">📚 Curiosità</p>
                  <p className="parole-trivia-text">{getTrivia(answer)}</p>
                </div>
              )}
              <button className="btn btn-primary fw-semibold" onClick={newGame}>
                Gioca ancora
              </button>
            </div>
          )}
        </div>

        <aside className="parole-controls" aria-label="Comandi">
          <h2 className="parole-controls-title">Comandi</h2>
          <div className="parole-cmd-row">
            <button type="button" className="parole-cmd" onClick={() => onKey("LEFT")} aria-label="Lettera precedente">
              <ArrowLeft size={20} />
            </button>
            <button type="button" className="parole-cmd" onClick={() => onKey("RIGHT")} aria-label="Lettera successiva">
              <ArrowRight size={20} />
            </button>
          </div>
          <button type="button" className="parole-cmd parole-cmd--wide" onClick={() => onKey("INVIO")}>
            <CornerDownLeft size={18} /> Invio
          </button>
          <button type="button" className="parole-cmd parole-cmd--wide" onClick={() => onKey("CANC")}>
            <Delete size={18} /> Cancella
          </button>
          <ul className="parole-legend">
            <li>
              <span>
                <kbd>←</kbd> <kbd>→</kbd>
              </span>
              Naviga tra le lettere
            </li>
            <li>
              <span>
                <kbd>A</kbd>–<kbd>Z</kbd>
              </span>
              Scrivi una lettera
            </li>
            <li>
              <span>
                <kbd>Invio</kbd>
              </span>
              Conferma la parola
            </li>
            <li>
              <span>
                <kbd>⌫</kbd>
              </span>
              Cancella una lettera
            </li>
          </ul>
          <p className="parole-controls-hint">Da PC usa la tastiera fisica: i tasti qui mostrano solo i colori.</p>
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
                  className={`parole-key${wide ? " parole-key--wide" : ""}${st ? ` parole-key--${st}` : ""}${isElim ? " parole-key--elim" : ""}`}
                  onClick={() => onKey(key)}
                  disabled={isElim}
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

      <style>{`
        .parole-page {
          --green: #2F7D4A;
          --green-dark: #1F6B3D;
          --amber: #D9A400;
          --absent: #c0392b;
          height: 100vh;
          height: 100svh;
          overflow-y: auto;
          background: #f4f6f5;
          color: #17271d;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          user-select: none;
          padding-bottom: 1rem;
        }

        .parole-header {
          position: sticky;
          top: 0;
          z-index: 20;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.8rem 1rem;
          background: #103820;
          color: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }
        .parole-title {
          font-size: 1.9rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          margin: 0;
          padding-left: 0.2em;
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
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.35);
          background: transparent;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }
        .parole-iconbtn:hover { background: rgba(255,255,255,0.15); transform: translateY(-1px); }

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

        .parole-stage {
          width: 100%;
          flex: 1 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .parole-game { display: flex; flex-direction: column; align-items: center; }

        .parole-board { display: grid; gap: 7px; padding: 0.25rem; }
        .parole-row { display: grid; gap: 7px; }
        .parole-row--shake { animation: parole-shake 0.45s; }
        @keyframes parole-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-7px); }
          40%, 60% { transform: translateX(7px); }
        }

        .parole-tile {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.9rem;
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
        }
        @keyframes parole-pop { 0% { transform: scale(0.9); } 100% { transform: scale(1); } }
        .parole-tile--revealed { animation: parole-flip 0.55s ease forwards; color: #fff; }
        @keyframes parole-flip {
          0% { transform: rotateX(0); }
          45% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        .parole-tile--correct { background: var(--green); border-color: var(--green); color: #fff; }
        .parole-tile--present { background: var(--amber); border-color: var(--amber); color: #fff; }
        .parole-tile--absent { background: var(--absent); border-color: var(--absent); color: #fff; }
        .parole-tile--win { animation: parole-bounce 0.6s ease; }
        @keyframes parole-bounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-16px); }
          50% { transform: translateY(0); }
          70% { transform: translateY(-7px); }
        }

        .parole-result { margin: 0.75rem 0; text-align: center; animation: parole-toast 0.3s ease; }
        .parole-result-text { margin: 0 0 0.6rem; font-weight: 600; color: var(--green-dark); }

        .parole-trivia {
          background: rgba(47, 125, 74, 0.08);
          border-left: 3px solid var(--green);
          padding: 0.85rem 1rem;
          margin: 0.8rem 0;
          border-radius: 6px;
          text-align: left;
          font-size: 0.95rem;
          animation: parole-slide-in 0.4s ease 0.15s both;
        }
        .parole-trivia-label {
          margin: 0 0 0.35rem;
          font-weight: 600;
          color: var(--green-dark);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .parole-trivia-text {
          margin: 0;
          color: #1f3d2a;
          line-height: 1.5;
        }
        @keyframes parole-slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
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
        .parole-cmd--wide { width: 100%; margin-bottom: 0.5rem; }
        .parole-legend { list-style: none; margin: 1rem 0 0; padding: 0; }
        .parole-legend li {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.82rem;
          color: #3c4a41;
          margin-bottom: 0.55rem;
        }
        .parole-legend span { display: inline-flex; gap: 0.2rem; min-width: 74px; }
        .parole-legend kbd {
          background: #e7ece9;
          border: 1px solid #c5d1ca;
          border-bottom-width: 2px;
          border-radius: 5px;
          padding: 0.1rem 0.4rem;
          font-family: "Roboto Mono", monospace;
          font-size: 0.78rem;
          color: #17271d;
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
        .parole-key--correct { background: var(--green); color: #fff; }
        .parole-key--present { background: var(--amber); color: #fff; }
        .parole-key--absent { background: var(--absent); color: #fff; }
        .parole-key--elim {
          opacity: 0.4;
          cursor: not-allowed;
          text-decoration: line-through;
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

        /* Desktop: griglia con comandi a tutta altezza e tastiera allineata sotto la board. */
        @media (min-width: 760px) {
          .parole-stage {
            flex: initial;
            display: grid;
            grid-template-columns: auto auto;
            grid-template-areas:
              "game controls"
              "keyboard controls";
            align-items: start;
            justify-content: center;
            gap: 1.1rem 2.25rem;
          }
          .parole-game { grid-area: game; }
          .parole-controls {
            grid-area: controls;
            align-self: stretch;
            display: flex;
            flex-direction: column;
            width: 250px;
            background: #fff;
            border: 1px solid rgba(47,125,74,0.18);
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: 0 4px 18px rgba(0,0,0,0.06);
          }
          .parole-controls .parole-controls-hint { margin-top: auto; padding-top: 0.75rem; }
          .parole-keyboard {
            grid-area: keyboard;
            width: 100%;
            max-width: none;
            margin-top: 0;
            padding: 0;
            pointer-events: none;
            opacity: 0.85;
          }
          .parole-key { height: 36px; font-size: 0.78rem; border-radius: 5px; }
          .parole-key--wide { font-size: 0.55rem; }
        }
      `}</style>
    </div>
  );
}
