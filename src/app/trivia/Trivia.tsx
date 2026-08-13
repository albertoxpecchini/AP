import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { currentTheme, requestToggle, subscribeTheme } from "../theme/themeCore";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import confetti from "canvas-confetti";
import {
  IcArrowLeft, IcArrowRight, IcMoon, IcSun, IcFlame, IcCheck, IcClose,
  IcRanking, IcRotate, IcSend, IcGrad, IcExpand, IcCollapse, IcBookOpen,
} from "../site/homeIcons";

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
import { PageBackdrop } from "../site/homeFx";
import "../home.css";
import "./trivia.css";

// ─────────────────────────────────────────────────────────────────────────────
// «Trivia» — il quiz sulla Storia dell'Architettura.
//
// Veste "piattaforma Supabase" della home (.sb-): il MENÙ è una pagina vera che
// scorre — nav sottile 64px con le funzioni, hero, card-record, dashboard dei
// capitoli, tipi di domanda, barra di lancio, funzioni e CTA — chiusa dal
// footer condiviso del sito (vedi TriviaMenu.tsx). La PARTITA e i RISULTATI
// restano a schermo intero, ma parlano la stessa lingua: pannelli a
// bordo-gradiente, azzurro brand, bottoni h38/radius 6 (vedi trivia.css).
// Tema chiaro/scuro nativo via token --sb-*; il valore `dark` serve ancora alle
// schede di gioco (classifica, pagella, gate, tutorial) che hanno palette propria.
// ─────────────────────────────────────────────────────────────────────────────

const GAME_KEY = "trivia";
const TOUR_KEY = "trivia-home-tour-seen";

// Passi del tour guidato sul menù. I passi "modal" obbligano ad APRIRE la
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
    modalSelector: ".sb-tv-modal",
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
  // Il tema lo decide il sito (scelta manuale o sensore orario), mai il sistema
  // operativo: qui si legge e basta. Prima si partiva da localStorage
  // "games-dark" con fallback a prefers-color-scheme — due sorgenti che col
  // tema del sito non c'entravano, e che in chiaro potevano dare "scuro".
  const [dark, setDark] = useState(() => currentTheme() === "dark");
  // Il tasto tema del gioco passa dal sistema globale (animazione + sensore).
  const toggleDark = () => requestToggle();
  useEffect(() => subscribeTheme((t) => setDark(t === "dark")), []);

  // Titolo della scheda del browser (ripristinato all'uscita).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const prev = document.title;
    document.title = "Trivia · Storia dell'Architettura";
    return () => { document.title = prev; };
  }, []);

  // Nav "solida" dopo 60px di scroll (come la home).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Schermo intero "vero" (Fullscreen API): non si può forzare senza un gesto
  // utente, ma offriamo il pulsante. Il layout è comunque sempre full-viewport.
  const gameRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFs = () => {
    if (!document.fullscreenElement) gameRef.current?.requestFullscreen?.().catch(() => {});
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

  // Il tour "a riflettore" ha senso solo su DESKTOP (≥760px), dove le funzioni
  // stanno tutte nella nav sempre visibile.
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
      confetti({ particleCount: 28, spread: 55, startVelocity: 32, origin: { y: 0.7 }, colors: [CONFETTI_BRAND, "#ffffff", "#8f8f8f", CONFETTI_DEEP] });
      // Trofeo + confetti grossi sui traguardi di streak.
      if ([3, 5, 7, 10].includes(newStreak)) {
        setTimeout(() => confetti({ particleCount: 160, spread: 100, origin: { y: 0.45 }, colors: [CONFETTI_BRAND, CONFETTI_DEEP, "#ffffff", "#d4d4d4"] }), 250);
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
      setTimeout(() => confetti({ particleCount: 220, spread: 120, origin: { y: 0.4 }, colors: [CONFETTI_BRAND, CONFETTI_DEEP, "#ffffff", "#d4d4d4"] }), 200);
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

  // Le schede del gioco (gate, tutorial, tour, classifica, pagella) vivono sopra
  // qualunque fase: si montano una volta sola qui sotto.
  const overlays = (
    <>
      {phase === "gate" && (
        <NicknameGate dark={dark} initial={nick} onConfirm={onGateConfirm} />
      )}
      {showTutorial && (
        <GameTutorial
          gameKey={GAME_KEY}
          steps={TRIVIA_INTRO}
          accentColor="var(--sb-brand)"
          darkBg="var(--sb-bg)"
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
        <div className="sb-home sb-tv-modal" onClick={() => setShowPagella(false)} role="dialog" aria-modal="true" aria-label="La mia pagella">
          <div className="sb-tv-modal-card" onClick={e => e.stopPropagation()}>
            <header className="sb-tv-modal-head">
              <div className="sb-tv-modal-title">
                <IcGrad size={18} />
                <span>La mia pagella{nick ? <small translate="no">{nick}</small> : null}</span>
              </div>
              <button className="sb-tv-modal-x" onClick={() => setShowPagella(false)} aria-label="Chiudi"><IcClose size={18} /></button>
            </header>
            <div className="sb-tv-modal-body">
              {nick
                ? <Pagella dark={dark} nick={nick} />
                : <p className="sb-tv-modal-empty">Scegli un nome per avere la tua pagella.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ══ MENÙ: una pagina vera, con nav e footer del sito ══
  if (phase === "menu" || phase === "gate") {
    return (
      <div className="sb-home sb-home--fx sb-tv-page">
        {/* Il fondale sta sul MENU, non sulla partita (.sb-tv-game, più sotto):
            lì c'è un cronometro che corre e una foto a tutto schermo per ogni
            domanda — un'aurora dietro sarebbe rumore, e costo, nel momento
            sbagliato. */}
        <PageBackdrop />
        {/* Skiplink — requisito di accessibilità (come la home) */}
        <div className="skiplinks">
          <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
        </div>

        {/* ── Nav sottile: brand del sito + funzioni del gioco ── */}
        <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
          <div className="sb-container sb-nav-inner">
            <Link to="/" className="sb-nav-brand">
              <img src="/favicon.svg" alt="" width={28} height={28} />
              <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
              <span className="sb-tv-tagline">Storia dell'Architettura</span>
            </Link>
            <div className="sb-nav-right">
              <button
                type="button"
                className="sb-btn sb-btn--sm sb-btn--ghost"
                onClick={() => setShowLeaderboard(true)}
                data-tour="leaderboard"
                aria-haspopup="dialog"
              >
                <IcRanking size={15} /> <span>Classifica live</span>
              </button>
              <button
                type="button"
                className="sb-btn sb-btn--sm sb-btn--ghost"
                onClick={() => setShowPagella(true)}
                data-tour="pagella"
                aria-haspopup="dialog"
              >
                <IcGrad size={15} /> <span>La mia pagella</span>
              </button>
              <button
                type="button"
                className="sb-btn sb-btn--sm sb-btn--ghost"
                onClick={onTutorial}
                data-tour="tutorial"
              >
                <IcBookOpen size={15} /> <span>Come si gioca</span>
              </button>
              <Link to="/#progetti" className="sb-btn sb-btn--sm sb-btn--secondary sb-btn--keep">
                <IcArrowLeft size={15} /> <span>Torna ai progetti</span>
              </Link>
            </div>
          </div>
        </header>

        <TriviaMenu
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

        {/* Footer condiviso: lo stesso, tradotto, su ogni pagina */}
        <SiteFooter />

        {overlays}
      </div>
    );
  }

  // ══ PARTITA e RISULTATI: schermo intero ══
  return (
    <div ref={gameRef} className="sb-home sb-tv-game" data-phase={phase}>
      {/* ── HUD ── */}
      {phase === "playing" && current && (
        <header className="sb-tv-hud">
          <button className="sb-tv-hud-back" onClick={backToMenu} aria-label="Esci dalla partita"><IcArrowLeft size={17} /></button>
          {nick && current.chapterId && (
            <SubjectBadge dark={dark} nick={nick} chapterId={current.chapterId} label={current.chapter} />
          )}
          <div className="sb-tv-hud-prog">
            <span className="sb-tv-hud-n" data-no-i18n>{idx + 1} / {queue.length}</span>
            <div className="sb-tv-bar">
              <div className="sb-tv-bar-fill" style={{ width: `${(idx / queue.length) * 100}%` }} />
            </div>
          </div>
          <div className="sb-tv-hud-right">
            <span className={`sb-tv-hud-streak${streak > 0 ? " on" : ""}`}><IcFlame size={15} /> <span data-no-i18n>{streak}</span></span>
            <span className="sb-tv-hud-score" data-no-i18n>{score.toLocaleString("it-IT")}</span>
          </div>
        </header>
      )}

      {/* ── PARTITA ── */}
      {phase === "playing" && current && (
        <main className="sb-tv-stage" key={current.id}>
          <section className="sb-tv-media">
            {/* Foto + soggetto in evidenza: il TITOLO grande sopra la foto dice
                subito di cosa/chi parla la domanda (edificio o argomento), così
                nessuna domanda resta ambigua ("quale chiesa?"). */}
            <div className="sb-panel">
              <div className="sb-panel-inner sb-tv-photo-inner">
                <div className="sb-tv-photo">
                  {photoUrl === undefined ? (
                    <div className="sb-tv-photo-skel" />
                  ) : photoUrl ? (
                    <img src={photoUrl} alt="" loading="eager" />
                  ) : (
                    <div className="sb-tv-photo-fallback">{iconForChapter(current.chapterId, 40)}</div>
                  )}
                  <div className="sb-tv-photo-grad" />
                  <span className="sb-tv-photo-type">{typeLabel(current.type)}</span>
                  <div className="sb-tv-subject">
                    <span className="sb-tv-subject-ic">{iconForChapter(current.chapterId, 20)}</span>
                    <div className="sb-tv-subject-txt">
                      {/* Titolo = capitolo (sempre pulito e descrittivo). Sottotitolo =
                          corrente · autore. Evita liste-con-parentesi del campo edificio. */}
                      <span className="sb-tv-subject-main" translate="no">{current.chapter}</span>
                      {(() => {
                        // Niente doppioni: se argomento/autore ripetono il titolo, via.
                        const title = current.chapter.trim().toLowerCase();
                        const parts = [cleanCtx(current.argomento), current.autore]
                          .filter((p): p is string => !!p && p.trim().toLowerCase() !== title);
                        return parts.length > 0 ? <span className="sb-tv-subject-sub" translate="no">{parts.join(" · ")}</span> : null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sb-tv-qa">
            {/* Timer della domanda */}
            <div className="sb-tv-timer">
              <div
                className={`sb-tv-timer-fill${remaining < 5000 ? " low" : ""}`}
                style={{ width: `${(remaining / TIME_PER_Q) * 100}%` }}
              />
            </div>

            {/* Domanda */}
            <h2 className="sb-tv-q">{current.text}</h2>

            {/* Risposte per tipo */}
            {current.type === "multipla" && current.options && (
              <div className="sb-tv-opts">
                {current.options.map((o, i) => {
                  const state = !revealed ? "" : o.correct ? "ok" : (pickedOption === i ? "no" : "dim");
                  return (
                    <button key={i} className={`sb-tv-opt ${state}`} disabled={revealed} onClick={() => answer({ type: "option", index: i })}>
                      <span className="sb-tv-opt-letter" data-no-i18n>{String.fromCharCode(65 + i)}</span>
                      <span className="sb-tv-opt-text">{o.text}</span>
                      {revealed && o.correct && <IcCheck size={17} />}
                      {revealed && !o.correct && pickedOption === i && <IcClose size={17} />}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "vero-falso" && (
              <div className="sb-tv-bool">
                {(["vero", "falso"] as const).map(v => {
                  const isCorrectOne = current.answer === v;
                  const state = !revealed ? "" : isCorrectOne ? "ok" : "no";
                  return (
                    <button key={v} className={`sb-tv-boolbtn ${state}`} disabled={revealed} onClick={() => answer({ type: "bool", value: v })}>
                      {v === "vero" ? "VERO" : "FALSO"}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "aperta" && (
              <form className="sb-tv-open" onSubmit={e => { e.preventDefault(); if (!revealed && openInput.trim()) answer({ type: "open", text: openInput }); }}>
                <input
                  ref={openRef}
                  className={`sb-tv-open-input${revealed ? (wasCorrect ? " ok" : " no") : ""}`}
                  value={openInput}
                  disabled={revealed}
                  placeholder="Scrivi la tua risposta…"
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                  onChange={e => setOpenInput(e.target.value)}
                />
                {!revealed && (
                  <button type="submit" className="sb-tv-open-send" disabled={!openInput.trim()} aria-label="Invia la risposta">
                    <IcSend size={17} />
                  </button>
                )}
              </form>
            )}

            {/* Esito + spiegazione + avanti */}
            {revealed && (
              <div className={`sb-tv-fb ${wasCorrect ? "ok" : "no"}`}>
                <div className="sb-tv-fb-head">
                  {wasCorrect
                    ? <><IcCheck size={17} /> <span>Corretto!</span> <b data-no-i18n>+{played[played.length - 1]?.awarded}</b></>
                    : <><IcClose size={17} /> {current.type === "aperta"
                        ? <><span>La risposta era:</span> <b translate="no">{current.answer}</b></>
                        : <span>Sbagliato</span>}</>}
                </div>
                {current.explanation && <p className="sb-tv-fb-exp">{current.explanation}</p>}
                <button className="sb-btn sb-btn--primary" onClick={goNext}>
                  {idx + 1 < queue.length ? "Avanti" : "Vedi il voto"} <IcArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {/* ── RISULTATI ── */}
      {phase === "results" && (
        <main className="sb-tv-results">
          <div className="sb-tv-res-grade">
            <div className="sb-tv-res-letter" style={{ color: dark ? results.grade.colorDark : results.grade.color }} data-no-i18n>
              {results.grade.letter}
            </div>
            <div className="sb-tv-res-label">{results.grade.label}</div>
          </div>

          <div className="sb-tv-res-stats">
            <ResStat value={`${results.accuracy}%`} label="Corrette" />
            <ResStat value={`${results.correctCount}/${results.total}`} label="Risposte" />
            <ResStat value={score.toLocaleString("it-IT")} label="Punti" />
            <ResStat value={String(bestStreakRun)} label="Streak" />
          </div>

          {/* Voti per pacchetto (argomento × tipo) completato al 100% */}
          {results.packages.length > 0 ? (
            <div className="sb-tv-res-pkgs">
              <p className="sb-tv-res-pkgs-title">Voti per argomento e tipo</p>
              {results.packages.map((p, i) => (
                <div className="sb-panel" key={i}>
                  <div className="sb-panel-inner sb-tv-res-pkg-inner">
                    <span className="sb-tv-res-pkg-info">
                      <span className="sb-tv-res-pkg-arg" translate="no">{p.argomento}</span>
                      <span className="sb-tv-res-pkg-type">
                        {typeLabelLong(p.type)} <span data-no-i18n>· {p.correct}/{p.total}</span>
                      </span>
                    </span>
                    <span className="sb-tv-res-pkg-grade" style={{ color: dark ? p.grade.colorDark : p.grade.color }} data-no-i18n>
                      {p.grade.letter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sb-panel">
              <div className="sb-panel-inner sb-tv-res-empty-inner">
                <p>Per sbloccare un voto completa tutte le domande di un tipo per un argomento, per esempio tutti i Vero/Falso.</p>
              </div>
            </div>
          )}

          <p className="sb-tv-res-cov">
            <b data-no-i18n>{coverage}%</b> <span>del database di domande esplorato</span>
          </p>

          <div className="sb-tv-res-actions">
            <button className="sb-btn sb-btn--primary" onClick={() => startGame(chapters, qTypes)}>
              <IcRotate size={15} /> Rigioca
            </button>
            <button className="sb-btn sb-btn--secondary" onClick={() => setShowLeaderboard(true)} aria-haspopup="dialog">
              <IcRanking size={15} /> Classifica live
            </button>
            <button className="sb-btn sb-btn--secondary" onClick={() => setShowPagella(true)} aria-haspopup="dialog">
              <IcGrad size={15} /> La mia pagella
            </button>
          </div>

          <div className="sb-tv-res-foot">
            <button type="button" className="sb-link" onClick={backToMenu}>
              Torna al menu <IcArrowRight size={14} />
            </button>
            <Link to="/#progetti" className="sb-link">
              <IcArrowLeft size={14} /> Torna ai progetti
            </Link>
          </div>
        </main>
      )}

      {/* Controlli flottanti: schermo intero + tema */}
      <div className="sb-tv-fabs">
        <button className="sb-tv-fab" onClick={toggleFs} aria-label={isFs ? "Esci da schermo intero" : "Schermo intero"}>
          {isFs ? <IcCollapse size={16} /> : <IcExpand size={16} />}
        </button>
        <button className="sb-tv-fab" onClick={toggleDark} aria-label="Tema chiaro/scuro">
          {dark ? <IcSun size={16} /> : <IcMoon size={16} />}
        </button>
      </div>

      {overlays}
    </div>
  );
}

/* Card di una statistica dei risultati */
function ResStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="sb-panel">
      <div className="sb-panel-inner sb-tv-res-stat-inner">
        <span className="sb-tv-res-num" data-no-i18n>{value}</span>
        <span className="sb-tv-res-lbl">{label}</span>
      </div>
    </div>
  );
}

// Colori dei coriandoli: l'azzurro del brand e la sua variante scura.
const CONFETTI_BRAND = "#00b3fa";
const CONFETTI_DEEP = "#004261";

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
