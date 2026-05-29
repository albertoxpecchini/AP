import { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { WORD_SET, randomWord } from "./words";

const ROWS = 6;
const COLS = 5;

type Status = "correct" | "present" | "absent";

const KEYBOARD: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["INVIO", "Z", "X", "C", "V", "B", "N", "M", "CANC"],
];

// Confronto stile Wordle con gestione corretta delle lettere doppie:
// prima passata per i verdi, seconda per i gialli sui caratteri rimasti.
function evaluate(guess: string, answer: string): Status[] {
  const result: Status[] = Array(COLS).fill("absent");
  const taken = Array(COLS).fill(false);

  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      taken[i] = true;
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < COLS; j++) {
      if (!taken[j] && guess[i] === answer[j]) {
        result[i] = "present";
        taken[j] = true;
        break;
      }
    }
  }
  return result;
}

// Priorità per il colore dei tasti: verde > giallo > grigio.
const RANK: Record<Status, number> = { absent: 0, present: 1, correct: 2 };

export default function Parole() {
  const [answer, setAnswer] = useState(() => randomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Status[][]>([]);
  const [current, setCurrent] = useState("");
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);

  const keyStatuses = useMemo(() => {
    const map: Record<string, Status> = {};
    guesses.forEach((g, gi) => {
      g.split("").forEach((ch, i) => {
        const s = evaluations[gi][i];
        const up = ch.toUpperCase();
        if (!(up in map) || RANK[s] > RANK[map[up]]) map[up] = s;
      });
    });
    return map;
  }, [guesses, evaluations]);

  const flash = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 1600);
  }, []);

  const newGame = useCallback(() => {
    setAnswer(randomWord());
    setGuesses([]);
    setEvaluations([]);
    setCurrent("");
    setState("playing");
    setMessage("");
  }, []);

  const submit = useCallback(() => {
    if (current.length < COLS) {
      flash("Parola troppo corta");
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    if (!WORD_SET.has(current)) {
      flash("Parola non nel dizionario");
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }

    const ev = evaluate(current, answer);
    const nextGuesses = [...guesses, current];
    setGuesses(nextGuesses);
    setEvaluations([...evaluations, ev]);
    setCurrent("");

    if (current === answer) {
      setState("won");
      flash("Indovinato!");
      confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
    } else if (nextGuesses.length >= ROWS) {
      setState("lost");
      setMessage(`Era ${answer.toUpperCase()}`);
    }
  }, [current, answer, guesses, evaluations, flash]);

  const onKey = useCallback(
    (key: string) => {
      if (state !== "playing") return;
      if (key === "INVIO") return submit();
      if (key === "CANC") return setCurrent((c) => c.slice(0, -1));
      if (/^[a-zA-Z]$/.test(key) && current.length < COLS) {
        setCurrent((c) => (c.length < COLS ? c + key.toLowerCase() : c));
      }
    },
    [state, submit, current.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") onKey("INVIO");
      else if (e.key === "Backspace") onKey("CANC");
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onKey]);

  return (
    <div className="parole-page">
      <header className="parole-header">
        <a href="/" className="parole-back" aria-label="Torna al sito">←</a>
        <h1 className="parole-title">
          PAR<span className="parole-title-accent">OL</span>E
        </h1>
        <button className="parole-restart" onClick={newGame} aria-label="Nuova partita">
          ⟳
        </button>
      </header>

      <div className="parole-message-slot">
        {message && <div className="parole-message">{message}</div>}
      </div>

      <main className="parole-board">
        {Array.from({ length: ROWS }).map((_, r) => {
          const submitted = r < guesses.length;
          const isCurrentRow = r === guesses.length && state === "playing";
          const rowWord = submitted ? guesses[r] : isCurrentRow ? current : "";
          return (
            <div
              key={r}
              className={`parole-row${isCurrentRow && shake ? " parole-row--shake" : ""}`}
            >
              {Array.from({ length: COLS }).map((_, c) => {
                const ch = rowWord[c] ?? "";
                const status = submitted ? evaluations[r][c] : undefined;
                const cls = [
                  "parole-tile",
                  status ? `parole-tile--${status}` : "",
                  ch && !submitted ? "parole-tile--filled" : "",
                  submitted ? "parole-tile--revealed" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={c} className={cls} style={{ transitionDelay: submitted ? `${c * 90}ms` : "0ms" }}>
                    {ch.toUpperCase()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>

      {state !== "playing" && (
        <div className="parole-result">
          <button className="parole-play-again" onClick={newGame}>
            Gioca ancora
          </button>
        </div>
      )}

      <div className="parole-keyboard">
        {KEYBOARD.map((row, ri) => (
          <div key={ri} className="parole-krow">
            {row.map((key) => {
              const wide = key === "INVIO" || key === "CANC";
              const st = key.length === 1 ? keyStatuses[key] : undefined;
              return (
                <button
                  key={key}
                  className={`parole-key${wide ? " parole-key--wide" : ""}${st ? ` parole-key--${st}` : ""}`}
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

      <style>{`
        .parole-page {
          min-height: 100vh;
          min-height: 100svh;
          background: #121213;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: "Titillium Web", "Helvetica Neue", Arial, sans-serif;
          user-select: none;
          padding-bottom: 1rem;
        }
        .parole-header {
          width: 100%;
          max-width: 520px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #3a3a3c;
        }
        .parole-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          margin: 0;
          padding-left: 0.18em;
        }
        .parole-title-accent { color: #6aaa64; }
        .parole-back, .parole-restart {
          background: none;
          border: none;
          color: #fff;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          text-decoration: none;
          width: 2.5rem;
          text-align: center;
        }
        .parole-back:hover, .parole-restart:hover { color: #6aaa64; }

        .parole-message-slot { height: 2.5rem; display: flex; align-items: center; }
        .parole-message {
          background: #fff;
          color: #121213;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .parole-board {
          display: grid;
          grid-template-rows: repeat(${ROWS}, 1fr);
          gap: 6px;
          padding: 0.5rem;
        }
        .parole-row {
          display: grid;
          grid-template-columns: repeat(${COLS}, 1fr);
          gap: 6px;
        }
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
          border: 2px solid #3a3a3c;
          background: transparent;
          color: #fff;
          transition: transform 0.25s ease, background-color 0.2s, border-color 0.2s;
        }
        .parole-tile--filled {
          border-color: #565758;
          animation: parole-pop 0.1s ease;
        }
        @keyframes parole-pop {
          0% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        .parole-tile--revealed { animation: parole-flip 0.5s ease forwards; }
        @keyframes parole-flip {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        .parole-tile--correct { background: #6aaa64; border-color: #6aaa64; }
        .parole-tile--present { background: #c9b458; border-color: #c9b458; }
        .parole-tile--absent { background: #3a3a3c; border-color: #3a3a3c; }

        .parole-result { margin: 0.5rem 0; }
        .parole-play-again {
          background: #6aaa64;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.7rem 1.4rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .parole-play-again:hover { background: #5d975a; }

        .parole-keyboard {
          width: 100%;
          max-width: 500px;
          margin-top: auto;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .parole-krow { display: flex; gap: 6px; justify-content: center; }
        .parole-key {
          flex: 1;
          min-width: 0;
          height: 56px;
          border: none;
          border-radius: 4px;
          background: #818384;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
        }
        .parole-key:hover { filter: brightness(1.1); }
        .parole-key--wide { flex: 1.5; font-size: 0.75rem; }
        .parole-key--correct { background: #6aaa64; }
        .parole-key--present { background: #c9b458; }
        .parole-key--absent { background: #3a3a3c; }

        @media (max-width: 480px) {
          .parole-tile { width: 100%; aspect-ratio: 1; height: auto; font-size: 1.6rem; }
          .parole-board { width: 100%; max-width: 360px; }
          .parole-key { height: 50px; }
        }
      `}</style>
    </div>
  );
}
