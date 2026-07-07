import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestToggle, subscribeTheme } from "../theme/themeCore";
import { Link } from "react-router";
import SiteFooter from "../site/SiteFooter";
import confetti from "canvas-confetti";
import { ArrowLeft, Moon, Sun, Flame, Check, X as XIcon, ListOrdered, RotateCcw, Send, GraduationCap, Maximize2, Minimize2 } from "lucide-react";

import TriviaMenu, { type ChapterSelection, type TypeSelection } from "./TriviaMenu";
import NicknameGate, { getStoredNick } from "./NicknameGate";
import Leaderboard from "./Leaderboard";
import Pagella from "./Pagella";
import SubjectBadge from "./SubjectBadge";
import GameTutorial, { hasSeenTutorial } from "../components/GameIntro";
import { TRIVIA_INTRO, TUTORIAL_KEYFRAMES } from "./tutorialSteps";
import HomeTour, { type TourStep } from "./HomeTour";

import { questionsForMany, prepareGame } from "./questions";
import { isAnswerCorrect, type Question } from "./parseTrivia";
import { fetchPhoto, prefetchPhoto } from "./photos";
import { fetchProgress, recordProgress, type ProgressMap } from "./progressApi";
import { cumulativePackageGrades, applyResults, totalCoverageFrom, backfillProgressFromGrades } from "./questionStats";
import { iconForChapter } from "./chapterIcons";
import { gradeFromPct, isGoodGrade } from "./grade";
import { computePackageGrades, typeLabelLong } from "./packageGrades";
import { submitScore, fetchPlayerBests, type ScoreRow } from "./leaderboardApi";
import { saveGrades, fetchGradeRows } from "./gradesApi";

const GAME_KEY = "trivia";
const DARK_KEY = "games-dark";
const TOUR_KEY = "trivia-home-tour-seen";

// Passi del tour guidato sulla home. I passi "modal" obbligano ad APRIRE la
// funzione (classifica/pagella): il tour rileva l'apertura, mostra la scheda
// pulita e avanza appena la chiudi (la ✕ fa da "Avanti"). I passi "info" sono
// solo spiegati (spotlight + "Avanti"); il click sul pulsante reale è bloccato.
const HOME_TOUR: TourStep[] = [
  {
    selector: '[data-tour="leaderboard"]',
    kind: "modal",
    modalSelector: ".trv-lb",
    title: "La classifica live",
    body: "Il podio di tutti i giocatori, in tempo reale. Aprila, dài un'occhiata e chiudila per continuare.",
    hint: "Apri la classifica",
  },
  {
    selector: '[data-tour="pagella"]',
    kind: "modal",
    modalSelector: ".trv-pagmodal",
    title: "La tua pagella",
    body: "Tutti i voti che conquisti, capitolo per capitolo e tipo per tipo. Aprila per vederla, poi chiudila.",
    hint: "Apri la pagella",
  },
  {
    selector: '[data-tour="tutorial"]',
    kind: "info",
    title: "Come si gioca",
    body: "È il tasto che hai appena premuto: da qui rivedi quando vuoi la spiegazione del gioco, con tutte le meccaniche animate.",
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
    body: "Scegli uno o più capitoli, i tipi di domanda e premi Gioca. Buon divertimento, e scala la classifica!",
  },
];

// Tempo per rispondere (ms) e punteggio: base per corretta + bonus velocità.
const TIME_PER_Q = 20000;
const BASE_POINTS = 100;
const SPEED_BONUS_MAX = 100; // si esaurisce linearmente entro TIME_PER_Q
// Nessun tetto di domande: la partita copre TUTTE le domande del filtro scelto,
// così è possibile "completare" un pacchetto (argomento × tipo) e ricevere il voto.

type Phase = "menu" | "gate" | "playing" | "results";

interface Played {
  question: Question;
  correct: boolean;
  awarded: number;
  ms: number;        // tempo impiegato su questa domanda (cronometro dal via)
}

export default function Trivia() {
  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem(DARK_KEY);
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });
  // Il tasto tema del gioco passa dal sistema globale (animazione + sensore).
  const toggleDark = () => requestToggle();
  useEffect(() => subscribeTheme((t) => setDark(t === "dark")), []);

  // Schermo intero "vero" (Fullscreen API): non si può forzare senza un gesto
  // utente, ma offriamo il pulsante. Il layout è comunque sempre full-viewport.
  const pageRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFs = () => {
    if (!document.fullscreenElement) pageRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const [phase, setPhase] = useState<Phase>("menu");
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPagella, setShowPagella] = useState(false);
  // Quando la slideshow del tutorial finisce, vogliamo lanciare il tour guidato?
  // (true solo per il flusso "scopri il gioco", non quando il tutorial precede
  //  l'avvio di una partita).
  const chainTour = useRef(false);

  const hasSeenTour = () => { try { return localStorage.getItem(TOUR_KEY) === "1"; } catch { return false; } };
  const markTourSeen = () => { try { localStorage.setItem(TOUR_KEY, "1"); } catch {} };

  const [nick, setNick] = useState<string>(() => getStoredNick());
  const pendingPlay = useRef<{ chapters: ChapterSelection; types: TypeSelection } | null>(null);

  // ── stato partita ──
  const [chapters, setChapters] = useState<ChapterSelection>([]);
  const [qTypes, setQTypes] = useState<TypeSelection>([]);
  // `queue` = tutte le domande del filtro (ordine+opzioni mescolati). È anche il
  // "pool" di riferimento per i voti per pacchetto: un pacchetto è completato se
  // le domande giocate di quel argomento×tipo eguagliano quelle in coda.
  const [queue, setQueue] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [played, setPlayed] = useState<Played[]>([]);
  // Specchio SINCRONO di `played`: finishGame può essere chiamato (via goNext) con
  // una closure di `played` STALE → l'ultima risposta non c'era e la sua domanda
  // non finiva su Supabase (es. 24/25 invece di 25/25). Il ref è sempre aggiornato.
  const playedRef = useRef<Played[]>([]);
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

  // Record del menu (Miglior voto, Streak record): PER ACCOUNT, letti da Supabase.
  // Niente più localStorage globale (era uguale per tutti gli account del device).
  const [bestStreak, setBestStreak] = useState(0);
  const [bestGrade, setBestGrade] = useState<string>("—");

  // Progresso PER ACCOUNT (copertura + best per domanda): caricato dal nome
  // loggato, così ogni account ha i SUOI progressi e si vedono ovunque.
  const [progress, setProgress] = useState<ProgressMap>(new Map());
  useEffect(() => {
    if (!nick) { setProgress(new Map()); setBestStreak(0); setBestGrade("—"); return; }
    let alive = true;
    // Reset SUBITO i record del vecchio account: se la fetch del nuovo è lenta o
    // fallisce, non restano "appiccicati" i valori di chi era loggato prima.
    setProgress(new Map());
    setBestStreak(0);
    setBestGrade("—");
    // 1) progresso dal DB, POI 2) RECUPERO dai voti già in pagella i progressi non
    //    segnati (vedi backfillProgressFromGrades): se mancano su trivia_progress
    //    ma esiste il voto, ricostruiamo le domande viste/giuste — e li ri-salviamo
    //    su Supabase così non si perdono più. I dati restano coerenti con la pagella.
    void (async () => {
      const m = await fetchProgress(nick).catch(() => new Map() as ProgressMap);
      if (!alive) return;
      setProgress(m);
      const rows = await fetchGradeRows(nick).catch(() => []);
      if (!alive) return;
      const recovered = backfillProgressFromGrades(m, rows);
      if (recovered !== m) {
        setProgress(recovered);
        // persisti SOLO le domande nuove o passate a "giusta" rispetto al DB
        // (il record lato server è idempotente: tiene comunque il best).
        const newRows = [...recovered]
          .filter(([id, v]) => !m.has(id) || m.get(id)!.ok !== v.ok)
          .map(([id, v]) => ({ id, ok: v.ok, ms: v.ms }));
        if (newRows.length) void recordProgress(nick, newRows);
      }
    })();
    fetchPlayerBests(nick).then(b => {
      if (!alive) return;
      setBestStreak(b.bestStreak);
      setBestGrade(b.bestAccuracy > 0 ? gradeFromPct(b.bestAccuracy).letter : "—");
    }).catch(() => {});
    return () => { alive = false; };
  }, [nick]);
  const coverage = useMemo(() => totalCoverageFrom(progress), [progress]);

  const [justSubmitted, setJustSubmitted] = useState<ScoreRow | null>(null);

  const current = queue[idx];

  // ─── Avvio partita ───
  // Usa TUTTE le domande dei capitoli+tipi scelti (niente tetto), con ordine e
  // opzioni mescolati: così puoi completare un pacchetto e niente "memoria di zona".
  const startGame = useCallback((chaps: ChapterSelection, t: TypeSelection) => {
    const pool = questionsForMany(chaps, t);
    const picked = prepareGame(pool); // tutte le domande del filtro, ordine + opzioni mescolati
    if (picked.length === 0) return;
    setChapters(chaps);
    setQTypes(t);
    setQueue(picked);
    setIdx(0);
    setPlayed([]);
    playedRef.current = [];
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

  // Il tour "a riflettore" ha senso solo su DESKTOP (≥760px), dove il rail
  // funzioni è sempre visibile; su mobile quelle azioni stanno nel drawer "Altro".
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches;

  const onTutorialDone = useCallback(() => {
    setShowTutorial(false);
    const p = pendingPlay.current;
    pendingPlay.current = null;
    if (p && nick) { startGame(p.chapters, p.types); return; }
    // Niente partita in coda → se richiesto (e su desktop), prosegue col tour.
    if (chainTour.current && isDesktop()) { chainTour.current = false; setShowTour(true); }
    else chainTour.current = false;
  }, [nick, startGame]);

  // "Come si gioca": prima la slideshow (meccaniche), poi il tour guidato.
  // Se il tour è GIÀ in corso (l'utente sta cliccando il passo "tutorial"), NON
  // ri-incatenare un altro tour: mostra solo la slideshow e lascia il tour dov'è.
  const onTutorial = useCallback(() => {
    if (!showTour) chainTour.current = true;
    setShowTutorial(true);
  }, [showTour]);

  const onTourDone = useCallback(() => { setShowTour(false); markTourSeen(); }, []);

  // Primo accesso col nickname già scelto: avvia da solo slideshow + tour una volta.
  useEffect(() => {
    if (phase !== "menu" || !nick) return;
    if (!isDesktop()) return;
    if (!hasSeenTour() && !showTour && !showTutorial) {
      chainTour.current = true;
      if (!hasSeenTutorial(GAME_KEY)) setShowTutorial(true);
      else setShowTour(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, nick]);

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
    const hintsFor = (q: Question) => ({ edificio: q.edificio, autore: q.autore, argomento: q.argomento });
    fetchPhoto(current.photoQuery, hintsFor(current)).then(url => { if (alive) setPhotoUrl(url); });
    const nextQ = queue[idx + 1];
    if (nextQ) prefetchPhoto(nextQ.photoQuery, hintsFor(nextQ));

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
    // Feedback aptico: vibrazione corta se giusto, doppia "buzz" se sbagliato.
    navigator.vibrate?.(correct ? 18 : [0, 30, 40, 30]);
    const entry: Played = { question: current, correct, awarded, ms: elapsed };
    playedRef.current = [...playedRef.current, entry]; // sync, prima di goNext/finishGame
    setPlayed(prev => [...prev, entry]);

    if (correct) {
      confetti({ particleCount: 28, spread: 55, startVelocity: 32, origin: { y: 0.7 }, colors: ["#e95420", "#34d399", "#fff", "#b7a8ff"] });
      // Trofeo + confetti grossi sui traguardi di streak.
      if ([3, 5, 7, 10].includes(newStreak)) {
        setTimeout(() => confetti({ particleCount: 160, spread: 100, origin: { y: 0.45 }, colors: ["#e95420", "#34d399", "#fbbf24", "#fff"] }), 250);
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

    // USA IL REF, non lo stato: finishGame arriva via goNext con `played` potenzialmente
    // STALE (mancava l'ultima risposta → 24/25). Il ref ha SEMPRE tutte le risposte.
    const allPlayed = playedRef.current;

    const correctCount = allPlayed.filter(p => p.correct).length;
    const total = queue.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);
    const grade = gradeFromPct(accuracy);
    // Streak record della partita ricavato dai risultati (fonte di verità),
    // non dallo stato async: evita l'off-by-one sull'ultima risposta.
    let run = 0, maxRun = 0;
    for (const pl of allPlayed) { run = pl.correct ? run + 1 : 0; if (run > maxRun) maxRun = run; }
    const finalStreak = Math.max(maxRun, bestStreakRun);

    // record del menu: aggiorno solo lo stato a schermo (la verità è su Supabase
    // via submitScore qui sotto, riletta per-account al prossimo apri-menu).
    if (finalStreak > bestStreak) setBestStreak(finalStreak);
    const prevBestPct = gradeToPct(bestGrade);
    if (accuracy > prevBestPct) setBestGrade(grade.letter);

    // invio classifica (non blocca la UI)
    submitScore({ nick: nick || "Anon", score, chapter: chapterKey, accuracy, best_streak: bestStreakRun })
      .then(row => setJustSubmitted(row))
      .catch(() => {});

    // ── progresso PER ACCOUNT ──
    // aggiorna subito la mappa locale per la UI immediata (copertura, pagella)
    const optimistic = applyResults(progress, allPlayed);
    setProgress(optimistic);

    if (nick) {
      const rows = allPlayed.map(p => ({ id: p.question.id, ok: p.correct, ms: p.ms ?? 0 }));
      // VOTO SUBITO: i pacchetti completati IN QUESTA partita vanno in pagella
      // immediatamente, senza aspettare il giro su Supabase (così "appena finito
      // un quiz, il voto è già lì"). Poi sotto si riconcilia col cumulativo.
      const justNow = cumulativePackageGrades(optimistic);
      if (justNow.length) void saveGrades(nick, justNow);
      // 1) salva gli esiti per-domanda su Supabase, POI
      // 2) rileggi il progresso AUTORITATIVO (così conta anche ciò visto in altre
      //    partite/dispositivi), 3) ricalcola e salva i voti della pagella.
      void (async () => {
        try {
          await recordProgress(nick, rows);
          const fresh = await fetchProgress(nick);
          const merged = fresh.size ? fresh : optimistic; // fallback se la lettura fallisce
          setProgress(merged);
          const packages = cumulativePackageGrades(merged);
          if (packages.length) await saveGrades(nick, packages);
        } catch { /* offline: riproverà alla prossima partita */ }
      })();
    }

    if (isGoodGrade(accuracy)) {
      setTimeout(() => confetti({ particleCount: 220, spread: 120, origin: { y: 0.4 }, colors: ["#e95420", "#34d399", "#fbbf24", "#fff", "#b7a8ff"] }), 200);
    }
    setPhase("results");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, played, bestStreakRun, bestStreak, bestGrade, nick, score, chapterKey, progress]);

  const backToMenu = useCallback(() => {
    clearInterval(tickRef.current);
    setPhase("menu");
  }, []);

  // ─── Render ───
  const results = useMemo(() => {
    const correctCount = played.filter(p => p.correct).length;
    const total = played.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);
    // Voti per pacchetto (argomento × tipo) completato al 100%.
    const packages = computePackageGrades(played, queue);
    return { correctCount, total: played.length, accuracy, grade: gradeFromPct(accuracy), packages };
  }, [played, queue]);

  return (
    <div ref={pageRef} className={`trv-page${dark ? " dark" : ""}`} data-phase={phase}>
      {/* ── Header ── */}
      {phase === "playing" && current && (
        <header className="trv-hud">
          <button className="trv-hud-back" onClick={backToMenu} aria-label="Esci"><ArrowLeft size={18} /></button>
          {nick && current.chapterId && (
            <SubjectBadge dark={dark} nick={nick} chapterId={current.chapterId} label={current.chapter} />
          )}
          <div className="trv-hud-prog">
            <span className="trv-hud-prog-txt">{idx + 1} / {queue.length}</span>
            <div className="trv-hud-bar">
              <div className="trv-hud-bar-fill" style={{ width: `${(idx / queue.length) * 100}%` }} />
            </div>
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
          <section className="trv-stage-media">
          {/* Foto + soggetto in evidenza: il TITOLO grande sopra la foto dice
              subito di cosa/chi parla la domanda (edificio o argomento), così
              nessuna domanda resta ambigua ("quale chiesa?"). */}
          <div className="trv-photo">
            {photoUrl === undefined ? (
              <div className="trv-photo-skel" />
            ) : photoUrl ? (
              <img src={photoUrl} alt="" loading="eager" className="trv-photo-img" />
            ) : (
              <div className="trv-photo-fallback"><span className="trv-photo-fallico">{iconForChapter(current.chapterId, 40)}</span></div>
            )}
            <div className="trv-photo-grad" />
            <span className="trv-photo-type">{typeLabel(current.type)}</span>
            <div className="trv-photo-subject">
              <span className="trv-subj-ico">{iconForChapter(current.chapterId, 18)}</span>
              <div className="trv-subj-txt">
                {/* Titolo = capitolo (sempre pulito e descrittivo). Sottotitolo =
                    corrente · autore. Evita liste-con-parentesi del campo edificio. */}
                <span className="trv-subj-main">{current.chapter}</span>
                {(current.argomento || current.autore) && (
                  <span className="trv-subj-sub">
                    {[cleanCtx(current.argomento), current.autore].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            </div>
          </div>
          </section>

          <section className="trv-stage-qa">
          {/* Timer della domanda */}
          <div className="trv-timer">
            <div className="trv-timer-fill" style={{ width: `${(remaining / TIME_PER_Q) * 100}%`, background: remaining < 5000 ? "var(--no)" : undefined }} />
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
          </section>
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

          {/* Voti per pacchetto (argomento × tipo) completato al 100% */}
          {results.packages.length > 0 ? (
            <div className="trv-res-pkgs">
              <p className="trv-res-pkgs-title">Voti per argomento e tipo</p>
              {results.packages.map((p, i) => (
                <div className="trv-res-pkg" key={i}>
                  <div className="trv-res-pkg-info">
                    <span className="trv-res-pkg-arg">{p.argomento}</span>
                    <span className="trv-res-pkg-type">{typeLabelLong(p.type)} · {p.correct}/{p.total}</span>
                  </div>
                  <span className="trv-res-pkg-grade" style={{ color: dark ? p.grade.colorDark : p.grade.color }}>{p.grade.letter}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="trv-res-pkgs-empty">
              Completa <b>tutte</b> le domande di un tipo per un argomento (es. tutti i Vero/Falso) per sbloccarne il voto.
            </p>
          )}

          <p className="trv-res-cov">Hai esplorato il <b>{coverage}%</b> di tutte le domande</p>
          <div className="trv-res-actions">
            <button className="trv-res-primary" onClick={() => startGame(chapters, qTypes)}><RotateCcw size={17} /> Rigioca</button>
            <button className="trv-res-second" onClick={() => setShowLeaderboard(true)}><ListOrdered size={17} /> Classifica</button>
            <button className="trv-res-second" onClick={() => setShowPagella(true)}><GraduationCap size={17} /> Pagella</button>
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
          progress={progress}
          nick={nick}
          onPlay={onPlay}
          onTutorial={onTutorial}
          onLeaderboard={() => setShowLeaderboard(true)}
          onPagella={() => setShowPagella(true)}
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
          accentColor="#e95420"
          darkBg="#2c001e"
          dark={dark}
          extra={TUTORIAL_KEYFRAMES}
          onDone={onTutorialDone}
        />
      )}
      {showTour && phase === "menu" && (
        <HomeTour
          steps={HOME_TOUR}
          onDone={onTourDone}
          onCloseModals={() => { setShowLeaderboard(false); setShowPagella(false); }}
        />
      )}
      {showLeaderboard && (
        <Leaderboard dark={dark} myNick={nick} justSubmitted={justSubmitted} onClose={() => setShowLeaderboard(false)} />
      )}
      {showPagella && (
        <div className={`trv-pagmodal${dark ? " dark" : ""}`} onClick={() => setShowPagella(false)} role="dialog" aria-modal="true" aria-label="La mia pagella">
          <div className="trv-pagmodal-card" onClick={e => e.stopPropagation()}>
            <header className="trv-pagmodal-head">
              <div className="trv-pagmodal-title">
                <GraduationCap size={20} />
                <span>La mia pagella{nick ? <small>{nick}</small> : null}</span>
              </div>
              <button className="trv-pagmodal-x" onClick={() => setShowPagella(false)} aria-label="Chiudi"><XIcon size={20} /></button>
            </header>
            <div className="trv-pagmodal-body">
              {nick
                ? <Pagella dark={dark} nick={nick} />
                : <p style={{ textAlign: "center", padding: "2rem", color: dark ? "#8fc7a6" : "#6b8070" }}>Scegli un nome per avere la tua pagella.</p>}
            </div>
          </div>
          <style>{`
            .trv-pagmodal {
              position:fixed; inset:0; z-index:260;
              background:rgba(10,28,17,0.62); backdrop-filter:blur(3px);
              display:flex; align-items:center; justify-content:center; padding:1rem;
              font-family:"Ubuntu", Geneva, Tahoma, sans-serif;
              animation:trv-pagmodal-fade .22s ease;
            }
            @keyframes trv-pagmodal-fade { from{opacity:0} to{opacity:1} }
            .trv-pagmodal-card {
              width:min(96vw,520px);
              max-height:90vh; max-height:90dvh;  /* dvh = viewport reale iOS (toolbar inclusa) */
              display:flex; flex-direction:column; background:#fff; border-radius:20px; overflow:hidden;
              box-shadow:0 30px 80px rgba(6,22,14,0.45);
              animation:trv-pagmodal-up .34s cubic-bezier(.2,.9,.3,1.1);
            }
            .trv-pagmodal.dark .trv-pagmodal-card { background:#14211a; }
            @keyframes trv-pagmodal-up { from{opacity:0; transform:translateY(16px) scale(.97)} to{opacity:1; transform:none} }
            .trv-pagmodal-head {
              background:linear-gradient(120deg,#e95420 0%,#a2330e 55%,#e95420 130%); color:#fff; flex-shrink:0;
              padding:1.1rem 1.1rem; display:flex; align-items:center; justify-content:space-between;
            }
            .trv-pagmodal.dark .trv-pagmodal-head { background:linear-gradient(120deg,#7e2708 0%,#3c202f 60%,#2c001e 130%); }
            .trv-pagmodal-title { display:flex; align-items:center; gap:.55rem; font-size:1.3rem; font-weight:900; letter-spacing:-.01em; }
            .trv-pagmodal-title small { display:block; font-size:.66rem; font-weight:600; opacity:.8; margin-top:.1rem; }
            .trv-pagmodal-x {
              display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px;
              border-radius:50%; border:none; background:rgba(255,255,255,0.14); color:#fff; cursor:pointer;
              transition:background .15s, transform .15s;
            }
            .trv-pagmodal-x:hover { background:rgba(255,255,255,0.26); transform:rotate(90deg); }
            .trv-pagmodal-body { flex:1 1 auto; min-height:0; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:1rem .9rem 1.2rem; scrollbar-width:thin; }
            .trv-pagmodal-body::-webkit-scrollbar { width:7px; }
            .trv-pagmodal-body::-webkit-scrollbar-thumb { background:rgba(233, 84, 32,0.3); border-radius:99px; }
          `}</style>
        </div>
      )}

      {/* Controlli flottanti: schermo intero + tema (in playing/results) */}
      {(phase === "playing" || phase === "results") && (
        <div className="trv-fabs">
          <button className="trv-fab" onClick={toggleFs} aria-label={isFs ? "Esci da schermo intero" : "Schermo intero"}>
            {isFs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button className="trv-fab" onClick={toggleDark} aria-label="Tema chiaro/scuro">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      )}

      <style>{styles}</style>
      <SiteFooter />
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

// Sottotitolo argomento: toglie solo eventuali parentesi, tiene il resto leggibile.
function cleanCtx(s?: string): string {
  return (s || "").replace(/\s*\([^)]*\)?/g, "").replace(/\s+/g, " ").trim();
}

const styles = `
.trv-page {
  position: fixed; inset: 0; z-index: 200; overflow-y: auto;
  font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
  background: #f4f6f5; color: #17271d;
  /* token tema chiaro (dark premium → variante chiara pulita) */
  --accent: #c2410c; --glow: rgba(194, 65, 12,0.26);
  --ok: #16a34a; --no: #e11d48;
  --text: #17271d; --sub: #5a6b62;
  --surface: #ffffff; --surface-2: #eef1f5; --bord: rgba(20,30,25,0.10);
}
.trv-page.dark {
  background: #241c22; color: #f5f3f1;
  --accent: #e95420; --glow: rgba(233, 84, 32,0.45);
  --ok: #34d399; --no: #fb7185;
  --text: #f5f3f1; --sub: #93a0ad;
  --surface: rgba(255,255,255,0.05); --surface-2: rgba(255,255,255,0.085); --bord: rgba(255,255,255,0.11);
}

/* Sfondo "dark premium" + layout full-viewport per gioco e risultati */
.trv-page[data-phase="playing"], .trv-page[data-phase="results"] {
  background:
    radial-gradient(120% 78% at 50% -12%, var(--glow) 0%, transparent 56%),
    linear-gradient(180deg, #f7f9fb 0%, #eef1f4 100%);
}
.trv-page.dark[data-phase="playing"], .trv-page.dark[data-phase="results"] {
  background:
    radial-gradient(120% 78% at 50% -12%, var(--glow) 0%, transparent 56%),
    linear-gradient(180deg, #0c1118 0%, #080b0f 100%);
}
@media (min-width: 900px) {
  .trv-page[data-phase="playing"], .trv-page[data-phase="results"] {
    overflow: hidden; display: flex; flex-direction: column;
  }
}

/* HUD — barra vetro, sticky, scala col viewport */
.trv-hud {
  position: sticky; top: 0; z-index: 5; flex-shrink: 0;
  display: flex; align-items: center; gap: clamp(.6rem,1.4vmin,1.4rem);
  padding: clamp(.6rem,1.3vmin,1.1rem) clamp(.9rem,2.4vw,2.4rem);
  background: rgba(247,249,251,0.6); color: var(--text);
  border-bottom: 1px solid var(--bord);
  backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
}
.trv-page.dark .trv-hud { background: rgba(10,14,19,0.55); }
.trv-hud-back {
  width: clamp(36px,3.4vmin,48px); height: clamp(36px,3.4vmin,48px); border-radius: 50%; border: none; flex-shrink: 0;
  background: var(--surface-2); color: var(--text); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; transition: background .15s, color .15s, transform .12s;
}
.trv-hud-back:hover { background: var(--accent); color: #ffffff; transform: translateY(-1px); }
.trv-hud-prog { flex: 1; min-width: 0; }
.trv-hud-prog-txt { font-size: clamp(.7rem,.5vw+.5rem,1rem); font-weight: 800; color: var(--sub); letter-spacing: .04em; }
.trv-hud-bar {
  position: relative; height: clamp(8px,1vmin,14px); border-radius: 999px; margin-top: 5px; overflow: hidden;
  background: var(--surface-2);
}
.trv-hud-bar-fill {
  height: 100%; min-width: 8px; border-radius: 999px; background: var(--accent);
  box-shadow: 0 0 14px var(--glow);
  transition: width .5s cubic-bezier(.65,0,.35,1);
}
.trv-hud-right { display: flex; align-items: center; gap: clamp(.5rem,1.2vmin,1rem); flex-shrink: 0; }
.trv-hud-streak {
  display: inline-flex; align-items: center; gap: .25rem; font-weight: 800;
  font-size: clamp(.85rem,.5vw+.6rem,1.15rem); color: var(--sub); transition: color .2s, transform .2s;
}
.trv-hud-streak.on { color: var(--accent); transform: scale(1.05); }
.trv-hud-score {
  font-weight: 900; font-size: clamp(1.05rem,.7vw+.7rem,1.6rem);
  font-variant-numeric: tabular-nums; min-width: 3ch; text-align: right; color: var(--text);
}

/* Stage — 2 colonne su desktop (foto | domanda), riempie la viewport */
.trv-stage {
  flex: 1; min-height: 0; width: 100%;
  max-width: 100%; margin: 0 auto; align-content: center;
  display: grid; grid-template-columns: 1fr; gap: clamp(.9rem,2vmin,2.6rem);
  padding: clamp(.8rem,1.8vmin,1.8rem) clamp(1rem,2.4vw,2.6rem) clamp(1rem,2vmin,2rem);
  animation: trv-q-in .3s ease;
}
@keyframes trv-q-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (min-width: 900px) {
  .trv-stage { grid-template-columns: minmax(0,1.04fr) minmax(0,1fr); align-items: center; gap: clamp(1.5rem,3vw,3.5rem); }
}
.trv-stage-media { min-width: 0; min-height: 0; display: flex; }
.trv-stage-qa { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: clamp(.7rem,1.6vmin,1.3rem); }
@media (min-width: 900px) { .trv-stage-qa { max-height: 86vh; overflow: auto; padding-right: .3rem; } }

.trv-timer { height: clamp(5px,.7vmin,9px); border-radius: 999px; background: var(--surface-2); overflow: hidden; flex-shrink: 0; }
.trv-timer-fill { height: 100%; background: var(--accent); border-radius: 999px; box-shadow: 0 0 12px var(--glow); transition: width .1s linear; }

.trv-photo {
  position: relative; width: 100%; aspect-ratio: 16 / 10; max-height: 80vh; border-radius: clamp(16px,1.6vmin,26px); overflow: hidden;
  background: var(--surface); border: 1px solid var(--bord); box-shadow: 0 24px 60px rgba(0,0,0,0.28); contain: paint;
}
.trv-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; animation: trv-fade .45s ease; }
@keyframes trv-fade { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: none; } }
.trv-photo-skel { position: absolute; inset: 0; background: var(--surface-2); animation: trv-pulse 1.1s ease-in-out infinite; }
@keyframes trv-pulse { 0%,100% { opacity: .55; } 50% { opacity: .9; } }
.trv-photo-fallback {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: var(--accent); background: radial-gradient(120% 120% at 50% 0%, var(--glow), transparent 60%);
}
.trv-photo-fallico { opacity: .6; }
.trv-photo-grad {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, rgba(4,7,11,0.9) 0%, rgba(4,7,11,0.45) 32%, transparent 62%);
}
.trv-photo-type {
  position: absolute; top: .8rem; right: .8rem;
  font-size: clamp(.6rem,.4vw+.45rem,.85rem); font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
  background: rgba(10,14,19,0.5); color: #fff; padding: .3rem .7rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}

.trv-photo-subject {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 1;
  display: flex; align-items: center; gap: .8rem; padding: clamp(.85rem,1.5vmin,1.4rem) clamp(1rem,1.8vmin,1.6rem); color: #fff;
}
.trv-subj-ico {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: clamp(40px,4vmin,58px); height: clamp(40px,4vmin,58px); border-radius: 13px;
  background: rgba(255,255,255,0.14); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.22);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
}
.trv-subj-txt { display: flex; flex-direction: column; min-width: 0; line-height: 1.15; }
.trv-subj-main {
  font-size: clamp(1.15rem, 1.4vw + .7rem, 2.1rem); font-weight: 900; letter-spacing: -.01em;
  text-shadow: 0 1px 10px rgba(0,0,0,0.55);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.trv-subj-sub {
  font-size: clamp(.76rem, .6vw + .5rem, 1.05rem); font-weight: 700; opacity: .92; margin-top: .14rem;
  text-shadow: 0 1px 8px rgba(0,0,0,0.55);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.trv-q {
  font-size: clamp(1.2rem, 1.1vw + .8rem, 2.2rem); font-weight: 800; margin: 0; line-height: 1.32;
  padding-left: clamp(.8rem,1.4vmin,1.3rem); border-left: 4px solid var(--accent);
}

/* Multipla */
.trv-opts { display: flex; flex-direction: column; gap: clamp(.5rem,1.1vmin,.9rem); }
.trv-opt {
  display: flex; align-items: center; gap: .8rem; width: 100%; text-align: left;
  padding: clamp(.8rem,1.4vmin,1.2rem) clamp(1rem,1.6vmin,1.5rem); border-radius: clamp(12px,1.2vmin,18px); cursor: pointer;
  background: var(--surface); border: 1px solid var(--bord); color: var(--text);
  font-family: inherit; font-size: clamp(.98rem,.5vw+.7rem,1.3rem); font-weight: 600;
  transition: border-color .15s, background .15s, transform .1s, box-shadow .15s;
  animation: trv-opt-in .3s ease both;
}
.trv-opt:nth-child(1){animation-delay:.02s}.trv-opt:nth-child(2){animation-delay:.07s}.trv-opt:nth-child(3){animation-delay:.12s}.trv-opt:nth-child(4){animation-delay:.17s}
@keyframes trv-opt-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (hover: hover) { .trv-opt:not(:disabled):hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 10px 26px var(--glow); } }
.trv-opt-letter {
  width: clamp(28px,2.8vmin,40px); height: clamp(28px,2.8vmin,40px); flex-shrink: 0; border-radius: 9px;
  background: var(--surface-2); color: var(--accent); font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center; font-size: clamp(.85rem,.4vw+.55rem,1.1rem);
}
.trv-opt-text { flex: 1; min-width: 0; }
.trv-opt-ic { flex-shrink: 0; }
.trv-opt.ok { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 15%, transparent); box-shadow: 0 0 26px color-mix(in srgb, var(--ok) 30%, transparent); }
.trv-opt.ok .trv-opt-letter, .trv-opt.ok .trv-opt-ic { color: var(--ok); }
.trv-opt.no { border-color: var(--no); background: color-mix(in srgb, var(--no) 13%, transparent); }
.trv-opt.no .trv-opt-letter, .trv-opt.no .trv-opt-ic { color: var(--no); }
.trv-opt.dim { opacity: .45; }

/* Vero/Falso */
.trv-bool { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(.6rem,1.4vmin,1.2rem); }
.trv-boolbtn {
  padding: clamp(1.3rem,3.5vmin,3rem) 0; border-radius: clamp(14px,1.6vmin,22px); border: 1px solid var(--bord);
  font-family: inherit; font-weight: 900; font-size: clamp(1.3rem,.8vw+.9rem,2.2rem); letter-spacing: .06em; cursor: pointer;
  background: var(--surface); color: var(--text); transition: border-color .15s, background .15s, color .15s, transform .1s, box-shadow .15s;
}
@media (hover: hover) {
  .trv-boolbtn.vero:not(:disabled):hover { border-color: var(--ok); color: var(--ok); transform: translateY(-2px); box-shadow: 0 10px 28px color-mix(in srgb, var(--ok) 28%, transparent); }
  .trv-boolbtn.falso:not(:disabled):hover { border-color: var(--no); color: var(--no); transform: translateY(-2px); box-shadow: 0 10px 28px color-mix(in srgb, var(--no) 26%, transparent); }
}
.trv-boolbtn.ok { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok); }
.trv-boolbtn.no { border-color: var(--no); background: color-mix(in srgb, var(--no) 13%, transparent); color: var(--no); opacity: .9; }

/* Aperta */
.trv-open { display: flex; gap: .6rem; }
.trv-open-input {
  flex: 1; min-width: 0; padding: clamp(.85rem,1.5vmin,1.3rem) clamp(1.1rem,1.6vmin,1.6rem); border-radius: clamp(12px,1.2vmin,18px);
  border: 1px solid var(--bord); background: var(--surface); color: var(--text);
  font-family: inherit; font-size: clamp(1.05rem,.5vw+.75rem,1.4rem); font-weight: 600; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.trv-open-input::placeholder { color: var(--sub); opacity: .6; }
.trv-open-input:focus { border-color: var(--accent); box-shadow: 0 0 0 .22rem var(--glow); }
.trv-open-input.ok { border-color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, transparent); }
.trv-open-input.no { border-color: var(--no); background: color-mix(in srgb, var(--no) 10%, transparent); }
.trv-open-send {
  flex-shrink: 0; width: clamp(52px,5vmin,68px); border-radius: clamp(12px,1.2vmin,18px); border: none; cursor: pointer;
  background: var(--accent); color: #ffffff; display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px var(--glow); transition: filter .12s, transform .12s;
}
.trv-open-send:disabled { opacity: .4; cursor: default; box-shadow: none; }
.trv-open-send:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }

/* Feedback */
.trv-feedback {
  border-radius: clamp(12px,1.3vmin,18px); padding: clamp(.9rem,1.6vmin,1.4rem) clamp(1rem,1.8vmin,1.5rem); border: 1px solid var(--bord);
  background: var(--surface); animation: trv-fb-in .25s ease; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
@keyframes trv-fb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.trv-feedback.ok { border-color: color-mix(in srgb, var(--ok) 45%, transparent); }
.trv-feedback.no { border-color: color-mix(in srgb, var(--no) 40%, transparent); }
.trv-feedback-head { display: flex; align-items: center; gap: .4rem; font-weight: 800; font-size: clamp(1rem,.5vw+.7rem,1.3rem); }
.trv-feedback.ok .trv-feedback-head { color: var(--ok); }
.trv-feedback.no .trv-feedback-head { color: var(--no); }
.trv-feedback-exp { margin: .6rem 0 0; font-size: clamp(.9rem,.4vw+.65rem,1.15rem); line-height: 1.55; color: var(--sub); }
.trv-next {
  margin-top: 1rem; width: 100%; padding: clamp(.85rem,1.5vmin,1.3rem) 1rem; border-radius: clamp(12px,1.2vmin,16px); border: none;
  background: var(--accent); color: #ffffff; font-family: inherit; font-weight: 900; font-size: clamp(1rem,.5vw+.7rem,1.3rem); cursor: pointer;
  box-shadow: 0 10px 30px var(--glow); transition: filter .12s, transform .12s;
}
.trv-next:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* Results */
.trv-results {
  flex: 1; min-height: 0; overflow: auto;
  width: 100%; max-width: min(900px, 94vw); margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: clamp(1rem,2vmin,1.8rem); padding: clamp(2rem,5vmin,4rem) clamp(1.2rem,3vw,3rem); text-align: center;
  animation: trv-res-in .35s ease;
}
@keyframes trv-res-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
.trv-res-grade { display: flex; flex-direction: column; align-items: center; }
.trv-res-letter { font-size: clamp(5rem, 18vmin, 13rem); font-weight: 900; line-height: 1; animation: trv-pop .5s cubic-bezier(.34,1.56,.64,1); filter: drop-shadow(0 8px 30px var(--glow)); }
@keyframes trv-pop { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.trv-res-label { font-size: clamp(1.2rem,.8vw+.8rem,1.8rem); font-weight: 800; margin-top: .3rem; }
.trv-res-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(.6rem,1.4vmin,1.2rem); width: 100%; }
@media (min-width: 620px) { .trv-res-stats { grid-template-columns: repeat(4, 1fr); } }
.trv-res-stat {
  background: var(--surface); border: 1px solid var(--bord); border-radius: clamp(12px,1.2vmin,18px); padding: clamp(.8rem,1.6vmin,1.4rem);
  display: flex; flex-direction: column; gap: .2rem; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.trv-res-num { font-size: clamp(1.5rem,1vw+.9rem,2.4rem); font-weight: 900; font-variant-numeric: tabular-nums; }
.trv-res-lbl { font-size: clamp(.65rem,.4vw+.45rem,.85rem); font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--sub); }
.trv-res-cov { font-size: clamp(.9rem,.4vw+.65rem,1.1rem); color: var(--sub); margin: 0; }

/* Voti per pacchetto (argomento × tipo) */
.trv-res-pkgs { width: 100%; display: flex; flex-direction: column; gap: .5rem; }
.trv-res-pkgs-title {
  font-size: clamp(.65rem,.4vw+.45rem,.85rem); font-weight: 800; text-transform: uppercase; letter-spacing: .1em;
  color: var(--sub); margin: .2rem 0 .1rem; text-align: left;
}
.trv-res-pkg {
  display: flex; align-items: center; gap: .8rem;
  background: var(--surface); border: 1px solid var(--bord); border-radius: clamp(12px,1.2vmin,16px);
  padding: clamp(.7rem,1.3vmin,1.1rem) clamp(.9rem,1.4vmin,1.3rem); text-align: left;
}
.trv-res-pkg-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .14rem; }
.trv-res-pkg-arg { font-size: clamp(.92rem,.4vw+.65rem,1.15rem); font-weight: 800; line-height: 1.25; }
.trv-res-pkg-type { font-size: clamp(.72rem,.3vw+.55rem,.95rem); font-weight: 600; color: var(--sub); }
.trv-res-pkg-grade {
  font-size: clamp(1.9rem,1vw+1.1rem,2.6rem); font-weight: 900; line-height: 1; flex-shrink: 0;
  font-variant-numeric: tabular-nums; min-width: 2ch; text-align: center;
}
.trv-res-pkgs-empty {
  width: 100%; font-size: clamp(.82rem,.4vw+.55rem,1.05rem); line-height: 1.5; color: var(--sub); margin: 0;
  background: var(--surface); border: 1px dashed var(--bord); border-radius: clamp(12px,1.2vmin,16px); padding: clamp(.8rem,1.4vmin,1.2rem);
}
.trv-res-actions { display: flex; gap: .6rem; width: 100%; }
.trv-res-primary, .trv-res-second {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: .4rem;
  padding: clamp(.85rem,1.5vmin,1.2rem) 1rem; border-radius: clamp(12px,1.2vmin,16px); font-family: inherit; font-weight: 800; font-size: clamp(.95rem,.4vw+.65rem,1.15rem); cursor: pointer;
  transition: filter .12s, transform .12s, border-color .15s;
}
.trv-res-primary { border: none; background: var(--accent); color: #ffffff; box-shadow: 0 10px 30px var(--glow); }
.trv-res-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
.trv-res-second { border: 1px solid var(--bord); background: var(--surface); color: var(--text); }
.trv-res-second:hover { border-color: var(--accent); transform: translateY(-1px); }
.trv-res-menu { background: none; border: none; color: var(--sub); font-family: inherit; font-weight: 700; font-size: clamp(.9rem,.4vw+.65rem,1.05rem); cursor: pointer; padding: .3rem; }
.trv-res-menu:hover { color: var(--text); }
.trv-res-back { display: inline-flex; align-items: center; gap: .35rem; color: var(--sub); text-decoration: none; font-size: clamp(.85rem,.4vw+.55rem,1rem); font-weight: 700; }
.trv-res-back:hover { color: var(--accent); }

/* Controlli flottanti (schermo intero + tema) */
.trv-fabs { position: fixed; bottom: clamp(1rem,2vmin,2rem); right: clamp(1rem,2vmin,2rem); z-index: 50; display: flex; flex-direction: column; gap: .6rem; }
.trv-fab {
  width: clamp(42px,4vmin,56px); height: clamp(42px,4vmin,56px); border-radius: 50%; border: 1px solid var(--bord);
  background: var(--surface); color: var(--accent); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 22px rgba(0,0,0,0.25); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  transition: transform .12s, border-color .15s;
}
.trv-fab:hover { transform: scale(1.08); border-color: var(--accent); }
`;
