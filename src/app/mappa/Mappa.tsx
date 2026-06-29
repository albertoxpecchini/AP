import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SiteFooter from "../site/SiteFooter";
import { requestToggle, subscribeTheme } from "../theme/themeCore";
import { Link } from "react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, RotateCcw, Trophy, Flame, Moon, Sun, HelpCircle, Layers, MapPin, Send, Lightbulb, Globe2, LogOut } from "lucide-react";
import GameTutorial, { hasSeenTutorial, type IntroStep } from "../components/GameIntro";
import MappaMenu, { MODES, MappaMark, type LevelMode } from "./MappaMenu";
import NicknameGate from "./NicknameGate";
import Leaderboard from "./Leaderboard";
import HomeTour, { type TourStep } from "../trivia/HomeTour";

const TOUR_KEY = "mappa-home-tour-seen";

// Passi del tour guidato sulla home (gemello di quello di Trivia).
const HOME_TOUR: TourStep[] = [
  {
    selector: '[data-tour="leaderboard"]',
    kind: "modal",
    modalSelector: ".mpl",
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
    body: "Scegli la difficoltà e premi Gioca. Riconosci la città dal satellite e scala la classifica!",
  },
];
import { CITIES, CITY_NAMES, isCorrectGuess, type City } from "./cities";
import { submitScore, fetchPlayerBests, type ScoreRow } from "./leaderboardApi";
import { getStoredNick } from "./nickname";
import { getAccountNick, clearAccountNick } from "../../lib/players";

// ─── Costanti ───────────────────────────────────────────────────────────────

// Soglia (su 100) di precisione perché una partita alimenti la streak "perfetta":
// serve trovare TUTTE le città della sessione per far salire la streak.
const TROPHIES = [
  { streak: 10, emoji: "🏆", label: "Cartografo Leggendario", desc: "10 sessioni perfette di fila. Conosci il mondo a memoria.", accent: "#c8a415" },
  { streak: 7,  emoji: "🥇", label: "Esploratore Provetto",   desc: "7 sessioni perfette di fila. Nessuna città ti sfugge.",   accent: "#B8960C" },
  { streak: 5,  emoji: "🥈", label: "Navigatore Esperto",     desc: "5 sessioni perfette di fila. Occhio da satellite.",     accent: "#7A8C99" },
  { streak: 3,  emoji: "🥉", label: "Viaggiatore Novizio",    desc: "3 sessioni perfette di fila. Hai trovato la rotta.",    accent: "#A0674A" },
] as const;

type Phase = "playing" | "reveal" | "over";

function getTrophyForStreak(n: number): (typeof TROPHIES)[number] | null {
  return TROPHIES.find(t => t.streak === n) ?? null;
}

// Punti per città trovata: base 1000, meno 120 per ogni tentativo speso, con
// un piccolo bonus combo per città indovinate di fila senza errori.
function cityPoints(attemptUsed: number, combo: number): number {
  const base = Math.max(200, 1000 - (attemptUsed - 1) * 150);
  const comboMul = combo >= 4 ? 1.5 : combo >= 2 ? 1.2 : 1;
  return Math.round(base * comboMul);
}

function getScoreEmoji(found: number, total: number): string {
  const r = total > 0 ? found / total : 0;
  if (r >= 1) return "🏆"; if (r >= 0.8) return "⭐"; if (r >= 0.6) return "🎯";
  if (r >= 0.4) return "👏"; if (r > 0) return "😅"; return "😮‍💨";
}

// ─── Tutorial: visual animati (classi mptv-) ─────────────────────────────────

function AccountVisual() {
  return (
    <div className="mptv-acc">
      <div className="mptv-acc-card">
        <div className="mptv-acc-ava">A</div>
        <div className="mptv-acc-bars"><span /><span /></div>
      </div>
      <div className="mptv-acc-chip">Alberto</div>
    </div>
  );
}
function ServerVisual() {
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className="mptv-srv" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <circle cx="110" cy="75" r="44" fill="none" stroke="#2F7D4A" strokeWidth="4" />
      <ellipse cx="110" cy="75" rx="18" ry="44" fill="none" stroke="#7c3aed" strokeWidth="3.5" />
      <line x1="66" y1="75" x2="154" y2="75" stroke="#7c3aed" strokeWidth="3.5" />
      {[0, 1, 2].map(i => (
        <circle key={i} className="mptv-srv-dot" style={{ animationDelay: `${i * 0.25}s` }} cx={40 + i * 70} cy={i === 1 ? 28 : 122} r="6" fill="#9b5cf6" />
      ))}
    </svg>
  );
}
function MapVisual() {
  return (
    <svg viewBox="0 0 220 150" aria-hidden="true" className="mptv-map" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <rect x="14" y="14" width="192" height="122" rx="10" fill="#1c2b22" />
      <path d="M14 96 Q60 70 110 88 T206 78" stroke="#3a5f48" strokeWidth="10" fill="none" />
      <path d="M40 14 L52 136" stroke="#2a4636" strokeWidth="6" />
      <path d="M150 14 L138 136" stroke="#2a4636" strokeWidth="6" />
      <g className="mptv-map-pin">
        <path d="M110 52c-9 0-15 6-15 15 0 11 15 26 15 26s15-15 15-26c0-9-6-15-15-15z" fill="#7c3aed" stroke="#fff" strokeWidth="2.5" />
        <circle cx="110" cy="67" r="5" fill="#fff" />
      </g>
    </svg>
  );
}
function GuessVisual() {
  return (
    <div className="mptv-guess">
      <div className="mptv-guess-field"><MapPin size={15} /><span className="mptv-guess-text">Roma</span><span className="mptv-guess-caret" /></div>
      <div className="mptv-guess-ok">✓ +1000</div>
    </div>
  );
}

const MAPPA_INTRO_STEPS: IntroStep[] = [
  { title: "Entra col tuo nome", body: "Scegli un nickname (max 10 lettere): diventa il tuo account, salvato online. Da qualsiasi dispositivo basta riselezionarlo per ritrovare i tuoi record e la tua posizione in classifica.", visual: <AccountVisual /> },
  { title: "Classifica live mondiale", body: "Ogni partita finisce su una classifica condivisa in tempo reale con tutti i giocatori, divisa per livello di difficoltà. Punti = città trovate, con bonus per chi indovina al primo colpo.", visual: <ServerVisual /> },
  { title: "Una città dal satellite", body: "Ti mostriamo una vista satellitare reale di una città del mondo. Puoi trascinare e zoomare la mappa per cercare indizi: monumenti, fiumi, stadi, la forma delle strade.", visual: <MapVisual /> },
  { title: "Indovina e guadagna punti", body: "Scrivi il nome della città (o del suo Paese). Ogni errore costa un tentativo ma ti regala un indizio: continente, iniziale, Paese. Meno tentativi usi, più punti ottieni.", visual: <GuessVisual /> },
];

const MAPPA_TUTORIAL_CSS = `
  .mptv-acc { display:flex; flex-direction:column; align-items:center; gap:.8rem; }
  .mptv-acc-card { display:flex; align-items:center; gap:.7rem; background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.25); border-radius:14px; padding:.8rem 1rem; animation:mptv-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
  .mptv-acc-ava { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1.4rem; }
  .mptv-acc-bars { display:flex; flex-direction:column; gap:.35rem; }
  .mptv-acc-bars span { display:block; height:8px; border-radius:99px; background:rgba(124,58,237,0.4); }
  .mptv-acc-bars span:nth-child(1){ width:72px; } .mptv-acc-bars span:nth-child(2){ width:48px; opacity:.6; }
  .mptv-acc-chip { font-size:.85rem; font-weight:800; color:#6d28d9; background:#fff; border:1.5px solid rgba(124,58,237,0.3); border-radius:999px; padding:.25rem .8rem; opacity:0; animation:mptv-fade .4s ease .4s forwards; }

  .mptv-srv .mptv-srv-dot { opacity:0; transform-box:fill-box; transform-origin:center; animation:mptv-pop .5s cubic-bezier(.34,1.7,.5,1) infinite alternate; }

  .mptv-map .mptv-map-pin { transform-box:fill-box; transform-origin:center bottom; animation:mptv-drop .9s cubic-bezier(.34,1.56,.64,1) both; }
  @keyframes mptv-drop { 0%{ transform:translateY(-30px) scale(.6); opacity:0; } 60%{ opacity:1; } 100%{ transform:translateY(0) scale(1); opacity:1; } }

  .mptv-guess { display:flex; flex-direction:column; align-items:center; gap:.7rem; }
  .mptv-guess-field { display:flex; align-items:center; gap:.5rem; background:#fff; border:2px solid #7c3aed; border-radius:12px; padding:.6rem 1rem; color:#17271d; box-shadow:0 4px 14px rgba(124,58,237,0.2); }
  .mptv-guess-text { font-size:1.1rem; font-weight:800; }
  .mptv-guess-caret { width:2px; height:20px; background:#7c3aed; animation:mptv-blink 1s steps(2) infinite; }
  @keyframes mptv-blink { 50%{ opacity:0; } }
  .mptv-guess-ok { font-size:1rem; font-weight:900; color:#2F7D4A; opacity:0; animation:mptv-fade .4s ease .6s forwards; }

  @keyframes mptv-pop { from{ opacity:0; transform:scale(0); } to{ opacity:1; transform:scale(1); } }
  @keyframes mptv-fade { to{ opacity:1; } }
`;

// ─── Caricamento Leaflet (CDN, una volta sola) ───────────────────────────────
// Restituisce una promise che si risolve quando window.L è pronto. Idempotente.
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => { leafletPromise = null; reject(new Error("Leaflet load failed")); };
    document.body.appendChild(script);
  });
  return leafletPromise;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Mappa() {
  const [showMenu, setShowMenu] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const chainTour = useRef(false);
  const pendingPlay = useRef(false);
  const [nick, setNick] = useState<string>(() => getStoredNick() || getAccountNick());

  const [level, setLevel] = useState<LevelMode>(1);
  const [phase, setPhase] = useState<Phase>("playing");
  const [deck, setDeck] = useState<City[]>([]);     // città della sessione (mischiate)
  const [round, setRound] = useState(0);            // indice città corrente (0-based)
  const [attemptsLeft, setAttemptsLeft] = useState(6);
  const [guesses, setGuesses] = useState<{ text: string; ok: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);            // città di fila senza errori
  const [found, setFound] = useState(0);            // città indovinate nella sessione
  const [hintLevel, setHintLevel] = useState(0);    // 0..3 indizi rivelati
  const [lastOk, setLastOk] = useState<boolean | null>(null); // esito città corrente al reveal
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  const [streak, setStreak] = useState(0);          // sessioni perfette di fila
  const [best, setBest] = useState(0);              // record streak (account)
  const [bestScore, setBestScore] = useState(0);    // record punteggio (account)
  const [achieved, setAch] = useState<number[]>([]);
  const [trophy, setTrophy] = useState<(typeof TROPHIES)[number] | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<ScoreRow | null>(null);

  const [dark, setDark] = useState(() => {
    try {
      const s = localStorage.getItem("games-dark");
      if (s !== null) return s === "1";
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    } catch { return false; }
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoT = useRef<number>();

  const mode = MODES.find(m => m.level === level)!;
  const currentCity: City | undefined = deck[round];

  // ── Record dell'account: prima localStorage, poi best online (Supabase). ──
  useEffect(() => {
    setBest(Number(localStorage.getItem("mappa-best-streak")) || 0);
    setBestScore(Number(localStorage.getItem("mappa-best-score")) || 0);
    try { const t = JSON.parse(localStorage.getItem("mappa-trophies") || "[]"); if (Array.isArray(t)) setAch(t); } catch {}
  }, []);

  useEffect(() => {
    if (!nick) return;
    fetchPlayerBests(nick).then(b => {
      setBest(prev => Math.max(prev, b.bestStreak));
      setBestScore(prev => Math.max(prev, b.bestScore));
    }).catch(() => {});
  }, [nick]);

  // ── Costruisce un mazzo di N città distinte e mischiate ──
  const buildDeck = useCallback((n: number): City[] => {
    const pool = [...CITIES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
  }, []);

  // ── Mappa: (ri)crea la vista satellitare per la città corrente ──
  useEffect(() => {
    if (showMenu || phase === "over" || !currentCity) return;
    let cancelled = false;
    setMapReady(false);
    setMapError(false);

    loadLeaflet().then((L) => {
      if (cancelled) return;
      const el = mapContainerRef.current;
      if (!el) return;

      // distruggi la mappa precedente per ripartire pulito ad ogni città
      if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; }

      const map = L.map(el, {
        center: [currentCity.lat, currentCity.lng],
        zoom: currentCity.zoom,
        zoomControl: true,
        attributionControl: true,
        // niente "salto" alla posizione: l'utente esplora liberamente
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles © Esri", maxZoom: 18, minZoom: 3 }
      ).addTo(map);

      mapRef.current = map;
      // Leaflet a volte calcola male le dimensioni se il contenitore è appena montato
      setTimeout(() => { try { map.invalidateSize(); } catch {} }, 80);
      setMapReady(true);
    }).catch(() => { if (!cancelled) setMapError(true); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deck, showMenu, phase]);

  // distruggi la mappa quando esci dal gioco (menu/fine)
  useEffect(() => {
    if (showMenu || phase === "over") {
      if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; }
    }
  }, [showMenu, phase]);

  // focus all'input quando si è in gioco
  useEffect(() => {
    if (!showMenu && phase === "playing") inputRef.current?.focus();
  }, [showMenu, phase, round]);

  // ── Avvio sessione ──
  const beginSession = useCallback((chosen: LevelMode) => {
    const m = MODES.find(x => x.level === chosen)!;
    setLevel(chosen);
    setDeck(buildDeck(m.rounds));
    setRound(0);
    setAttemptsLeft(m.attempts);
    setGuesses([]);
    setInput("");
    setScore(0);
    setCombo(0);
    setFound(0);
    setHintLevel(0);
    setLastOk(null);
    setPhase("playing");
  }, [buildDeck]);

  // Dal menu: scegli difficoltà → (gate se serve) → (tutorial se mai visto) → gioco
  const onPlay = useCallback((chosen: LevelMode) => {
    setLevel(chosen);
    if (!nick) { pendingPlay.current = true; setShowGate(true); return; }
    if (!hasSeenTutorial("mappa")) { setShowTutorial(true); return; }
    beginSession(chosen);
    setShowMenu(false);
  }, [nick, beginSession]);

  const onGateConfirm = useCallback((confirmed: string) => {
    setNick(confirmed);
    setShowGate(false);
    // Gate aperto da "cambia nome" nel menu (nessuna partita in coda): resta nel menu.
    if (!pendingPlay.current) return;
    pendingPlay.current = false;
    if (!hasSeenTutorial("mappa")) { setShowTutorial(true); return; }
    beginSession(level);
    setShowMenu(false);
  }, [level, beginSession]);

  // ── Tour guidato "a riflettore" (solo desktop) ──
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 760px)").matches;
  const hasSeenTour = () => { try { return localStorage.getItem(TOUR_KEY) === "1"; } catch { return false; } };
  const markTourSeen = () => { try { localStorage.setItem(TOUR_KEY, "1"); } catch {} };

  const onTutorial = useCallback(() => {
    if (!showTour) chainTour.current = true;
    setShowTutorial(true);
  }, [showTour]);

  const onTourDone = useCallback(() => { setShowTour(false); markTourSeen(); }, []);

  const onTutorialDone = useCallback(() => {
    setShowTutorial(false);
    // Se aperto da "Come si gioca" (chainTour) su desktop, prosegui col tour
    // restando nel menu. Altrimenti, se il menu è aperto, avvia la sessione.
    if (chainTour.current && showMenu && isDesktop()) {
      chainTour.current = false;
      setShowTour(true);
      return;
    }
    chainTour.current = false;
    setShowMenu(prev => {
      if (prev) { beginSession(level); return false; }
      return prev;
    });
  }, [level, beginSession, showMenu]);

  // Primo accesso col nickname già scelto: avvia da solo slideshow + tour una volta.
  useEffect(() => {
    if (!showMenu || !nick) return;
    if (!isDesktop()) return;
    if (!hasSeenTour() && !showTour && !showTutorial) {
      chainTour.current = true;
      if (!hasSeenTutorial("mappa")) setShowTutorial(true);
      else setShowTour(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMenu, nick]);

  // ── Indizi progressivi (rivelati al posto dei tentativi) ──
  const hints = useMemo(() => {
    if (!currentCity) return [];
    return [
      { icon: <Globe2 size={14} />, label: "Continente", value: currentCity.continent },
      { icon: <MapPin size={14} />, label: "Iniziale", value: currentCity.name[0].toUpperCase() + "…" },
      { icon: <Lightbulb size={14} />, label: "Paese", value: currentCity.country },
    ];
  }, [currentCity]);

  // ── Invio di un tentativo ──
  const submitGuess = useCallback(() => {
    if (phase !== "playing" || !currentCity) return;
    const text = input.trim();
    if (!text) return;

    const ok = isCorrectGuess(text, currentCity);
    setGuesses(prev => [...prev, { text, ok }]);
    setInput("");

    if (ok) {
      const attemptUsed = (mode.attempts - attemptsLeft) + 1;
      const newCombo = combo + 1;
      const pts = cityPoints(attemptUsed, newCombo);
      setScore(s => s + pts);
      setCombo(newCombo);
      setFound(f => f + 1);
      setLastOk(true);
      setPhase("reveal");
      confetti({ particleCount: attemptUsed === 1 ? 110 : 60, spread: 72, origin: { y: 0.5 }, colors: ["#7c3aed", "#b794ff", "#fff", "#2F7D4A"] });
    } else {
      const left = attemptsLeft - 1;
      setAttemptsLeft(left);
      setCombo(0);
      setHintLevel(h => Math.min(3, h + 1));
      if (left <= 0) {
        setLastOk(false);
        setPhase("reveal");
      }
    }
  }, [phase, currentCity, input, mode.attempts, attemptsLeft, combo]);

  // ── Avanza alla città dopo / chiudi sessione ──
  const advance = useCallback(() => {
    const isLast = round >= deck.length - 1;
    if (isLast) {
      finishSession();
    } else {
      setRound(r => r + 1);
      setAttemptsLeft(mode.attempts);
      setGuesses([]);
      setInput("");
      setHintLevel(0);
      setLastOk(null);
      setPhase("playing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, deck.length, mode.attempts]);

  // ── Fine sessione: calcola precisione, aggiorna record, invia punteggio ──
  const finishSession = useCallback(() => {
    setPhase("over");
    const total = deck.length;
    // `found` non include ancora l'ultima città se appena trovata? Sì: submitGuess
    // aggiorna found prima di reveal, quindi qui found è completo.
    const finalFound = found;
    const accuracy = total > 0 ? Math.round((finalFound / total) * 100) : 0;
    const perfect = finalFound === total && total > 0;

    // Streak di sessioni PERFETTE
    let newStreak = streak;
    if (perfect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) { setBest(newStreak); localStorage.setItem("mappa-best-streak", String(newStreak)); }
    } else {
      setStreak(0);
    }

    if (score > (Number(localStorage.getItem("mappa-best-score")) || 0)) {
      setBestScore(score);
      localStorage.setItem("mappa-best-score", String(score));
    }

    // Trofeo per soglia di streak perfetta
    const tr = perfect ? getTrophyForStreak(newStreak) : null;
    if (tr && !achieved.includes(newStreak)) {
      const upd = [...achieved, newStreak]; setAch(upd);
      localStorage.setItem("mappa-trophies", JSON.stringify(upd));
      autoT.current = window.setTimeout(() => {
        setTrophy(tr);
        confetti({ particleCount: 220, spread: 110, origin: { y: 0.45 }, colors: ["#c8a415", "#7c3aed", "#b794ff", "#fff"] });
      }, 650);
    }

    // Invio in classifica (best_streak = record corrente dell'account)
    if (nick) {
      submitScore({ nick, score, mode: mode.key, accuracy, best_streak: Math.max(best, newStreak) })
        .then(row => setJustSubmitted(row))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length, found, streak, best, score, achieved, nick, mode.key]);

  // ── Comandi ──
  const restart = useCallback(() => { beginSession(level); }, [beginSession, level]);

  const backToMenu = useCallback(() => {
    if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; }
    setShowMenu(true);
  }, []);

  const logout = useCallback(() => {
    clearAccountNick();
    try { localStorage.removeItem("mappa-nick"); } catch {}
    setNick("");
    setShowBoard(false);
  }, []);

  const dismissTrophy = useCallback(() => setTrophy(null), []);

  // Il tasto tema del gioco passa dal sistema globale (animazione + sensore).
  const toggleDark = useCallback(() => { requestToggle(); }, []);
  useEffect(() => subscribeTheme((t) => setDark(t === "dark")), []);

  useEffect(() => () => { clearTimeout(autoT.current); }, []);

  // Suggerimenti di completamento (datalist) — solo nomi città.
  const suggestions = useMemo(() => CITY_NAMES, []);

  const total = deck.length;
  const accuracyNow = total > 0 ? Math.round((found / total) * 100) : 0;

  return (
    <div className={`map-page${dark ? " dark" : ""}`}>

      {/* ── Menu ── */}
      {showMenu && (
        <MappaMenu
          dark={dark}
          bestStreak={best}
          trophiesCount={achieved.length}
          nick={nick}
          onPlay={onPlay}
          onTutorial={onTutorial}
          onLeaderboard={() => setShowBoard(true)}
          onChangeNick={() => setShowGate(true)}
        />
      )}

      {/* ── Tour guidato a riflettore (solo desktop) ── */}
      {showTour && showMenu && (
        <HomeTour
          steps={HOME_TOUR}
          onDone={onTourDone}
          onCloseModals={() => { setShowBoard(false); }}
        />
      )}

      {/* ── Gate nickname / account ── */}
      {showGate && (
        <NicknameGate dark={dark} initial={nick} onConfirm={onGateConfirm} />
      )}

      {/* ── Tutorial ── */}
      {showTutorial && (
        <>
          <style>{MAPPA_TUTORIAL_CSS}</style>
          <GameTutorial
            gameKey="mappa"
            steps={MAPPA_INTRO_STEPS}
            accentColor="#7c3aed"
            darkBg="#2a1150"
            dark={dark}
            onDone={onTutorialDone}
          />
        </>
      )}

      {/* ── Classifica ── */}
      {showBoard && (
        <Leaderboard dark={dark} myNick={nick} justSubmitted={justSubmitted} onClose={() => setShowBoard(false)} />
      )}

      {/* ── Header ── */}
      <header className="map-header">
        <div className="map-hdr-left">
          <Link to="/#progetti" className="map-iconbtn" aria-label="Torna ai progetti"><ArrowLeft size={20} /></Link>
          <h1 className="map-title">MAP<span className="map-accent">PA</span></h1>
        </div>
        <div className="map-hdr-center">
          <button className="map-mode-pill" onClick={backToMenu} aria-label="Apri il menu">
            <Layers size={14} /><span>Menu</span>
          </button>
          <button className="map-mode-pill" onClick={() => setShowBoard(true)} aria-label="Classifica">
            <Trophy size={14} /><span>Classifica</span>
          </button>
        </div>
        <div className="map-hdr-right">
          {nick && <button className="map-iconbtn map-iconbtn--ghost" onClick={logout} title={`${nick} — esci`} aria-label="Esci dall'account"><LogOut size={16} /></button>}
          <button className="map-iconbtn" onClick={restart} aria-label="Nuova partita"><RotateCcw size={16} /></button>
          <button className="map-iconbtn" onClick={toggleDark} aria-label="Cambia tema">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button className="map-iconbtn" onClick={() => setShowTutorial(true)} aria-label="Come si gioca"><HelpCircle size={16} /></button>
        </div>
      </header>

      {/* ── Stage ── */}
      <div className="map-stage">

        {/* Sinistra: mappa */}
        <div className="map-game">
          <div className="map-fig-wrap">
            {phase === "over" ? (
              <div className="map-mapover"><MappaMark size={72} /></div>
            ) : (
              <>
                <div ref={mapContainerRef} className="map-canvas" />
                {!mapReady && !mapError && <div className="map-maploading"><span className="map-spinner" /> Carico la vista satellitare…</div>}
                {mapError && <div className="map-maploading map-maperr">Impossibile caricare la mappa.<br />Controlla la connessione e premi <b>Nuova partita</b>.</div>}
              </>
            )}
            {phase !== "over" && (
              <>
                <span className="map-round-badge"><MapPin size={11} /> {round + 1}/{total}</span>
                <span className="map-attempt-badge" title="Tentativi rimasti">{attemptsLeft} ⛳</span>
              </>
            )}
          </div>
        </div>

        {/* Destra: pannello */}
        <aside className="map-ctrl-block" aria-label="Pannello di gioco">
          <div className="map-card-stats">
            <div className="map-card-stat">
              <Trophy size={20} aria-hidden="true" className="map-card-stat-ico" />
              <span className="map-card-stat-val">{score.toLocaleString("it-IT")}</span>
              <span className="map-card-stat-lbl">Punti</span>
            </div>
            <div className="map-card-stat map-card-stat--mid">
              <Flame size={20} aria-hidden="true" className="map-card-stat-ico" />
              <span className="map-card-stat-val">{combo}</span>
              <span className="map-card-stat-lbl">Combo</span>
            </div>
            <div className="map-card-stat map-card-stat--mid">
              <MapPin size={20} aria-hidden="true" className="map-card-stat-ico" />
              <span className="map-card-stat-val">{found}/{total}</span>
              <span className="map-card-stat-lbl">Trovate</span>
            </div>
          </div>

          {phase === "over" ? (
            <div className="map-panel map-panel--over" key="over">
              <div className="map-over">
                <span className="map-over-emoji">{getScoreEmoji(found, total)}</span>
                <span className="map-over-label">Sessione conclusa!</span>
                <span className="map-over-total">{score.toLocaleString("it-IT")}</span>
                <span className="map-over-pts">punti · {accuracyNow}% di precisione</span>
                <div className="map-wr-grid">
                  <div className="map-wr-cell"><span className="map-wr-num">{found}/{total}</span><span className="map-wr-sub">città</span></div>
                  <div className="map-wr-cell"><span className="map-wr-num">{best}</span><span className="map-wr-sub">streak max</span></div>
                  <div className="map-wr-cell"><span className="map-wr-num">{bestScore.toLocaleString("it-IT")}</span><span className="map-wr-sub">record</span></div>
                </div>
              </div>
              <button type="button" className="map-next" onClick={restart}>Rigioca <RotateCcw size={16} /></button>
              <button type="button" className="map-next map-next--ghost" onClick={() => setShowBoard(true)}>Classifica <Trophy size={16} /></button>
              <button type="button" className="map-next map-next--ghost" onClick={backToMenu}>Cambia difficoltà <Layers size={16} /></button>
            </div>
          ) : phase === "reveal" ? (
            <div className="map-panel map-panel--won" key="reveal">
              <div className={`map-reveal${lastOk ? "" : " miss"}`}>
                <span className="map-reveal-flag">{lastOk ? "✓" : "✗"}</span>
                <span className="map-reveal-lbl">{lastOk ? "Indovinata!" : "Peccato!"}</span>
                <span className="map-reveal-city">{currentCity?.name}</span>
                <span className="map-reveal-country">{currentCity?.country} · {currentCity?.continent}</span>
                {lastOk
                  ? <p className="map-reveal-tip">Ottimo occhio. {combo >= 2 ? `Combo ×${combo}!` : "Continua così."}</p>
                  : <p className="map-reveal-tip">Tentativi esauriti. La prossima la riconosci di sicuro.</p>}
              </div>
              <button type="button" className="map-next" onClick={advance}>
                {round >= deck.length - 1 ? "Vedi il risultato" : "Prossima città"} <Send size={16} />
              </button>
            </div>
          ) : (
            <div className="map-panel map-panel--play" key={`p-${round}`}>
              <p className="map-prompt">Che città è questa?</p>
              <div className="map-inputrow">
                <span className="map-input-ico"><MapPin size={18} /></span>
                <input
                  ref={inputRef}
                  className="map-input"
                  list="map-city-suggestions"
                  value={input}
                  placeholder="Nome città o Paese…"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submitGuess(); }}
                />
                <datalist id="map-city-suggestions">
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <button type="button" className="map-next" onClick={submitGuess} disabled={!input.trim()}>
                Indovina <Send size={16} />
              </button>

              {/* Indizi rivelati con gli errori */}
              {hintLevel > 0 && (
                <div className="map-hints">
                  {hints.slice(0, hintLevel).map((h, i) => (
                    <div className="map-hint" key={i}>
                      <span className="map-hint-ico">{h.icon}</span>
                      <span className="map-hint-lbl">{h.label}</span>
                      <span className="map-hint-val">{h.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tentativi sbagliati */}
              {guesses.length > 0 && (
                <div className="map-guesslist">
                  {guesses.map((g, i) => (
                    <span key={i} className={`map-guesschip${g.ok ? " ok" : ""}`}>{g.ok ? "✓" : "✗"} {g.text}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ── Trophy modal ── */}
      {trophy && (
        <div className="map-overlay" onClick={dismissTrophy}>
          <div className="map-tcard" onClick={e => e.stopPropagation()}>
            <div className="map-thead" style={{ background: trophy.accent }}>
              <span className="map-tgrade">{trophy.streak}</span>
              <span className="map-tico">{trophy.emoji}</span>
              <span className="map-tlbl">{trophy.label}</span>
            </div>
            <div className="map-tbody">
              <p className="map-tdesc">{trophy.desc}</p>
              <p className="map-tsub">Sessioni perfette di fila: {trophy.streak}</p>
              <button type="button" className="map-tcta" onClick={dismissTrophy}>Continua <RotateCcw size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .map-page {
          /* ── Palette stile TRIVIA: VIOLA (accento) + VERDE (secondario) ── */
          --pv:#7c3aed; --pv2:#6024c4; --pv3:#9b5cf6; --pv-ink:#6d28d9;
          --green:#2F7D4A; --green-dark:#1F6B3D; --gold:#D9A400;
          --absent:hsl(350,60%,50%);
          --radius:8px; --radius-sm:4px;
          --focus-ring:0 0 0 .25rem rgba(124,58,237,.25);
          --shadow-key:0 .125rem .25rem rgba(0,0,0,.075);
          --shadow-card:0 .5rem 1rem rgba(0,0,0,.12);
          --hdr-h:52px;
          --surface:#f4f6f5; --panel:#ffffff; --panel-bd:rgba(124,58,237,0.16);
          --stage-bg:#f1edf9; --text:#17271d; --text-soft:#4a4458;
          --stat-bg:rgba(124,58,237,0.06); --stat-bd:rgba(124,58,237,0.16);

          height:100dvh; overflow:hidden;
          background:var(--surface); color:var(--text);
          display:flex; flex-direction:column; align-items:center;
          font-family:"Titillium Web", Geneva, Tahoma, sans-serif;
          user-select:none;
        }

        /* ── Header (gradiente viola→verde come Trivia) ── */
        .map-header {
          position:sticky; top:0; z-index:20; flex-shrink:0;
          width:100%; display:flex; align-items:center; justify-content:space-between;
          padding:0 0.75rem; height:var(--hdr-h);
          background:linear-gradient(100deg,#7c3aed 0%,#5b21b6 45%,#103820 120%); color:#fff;
          box-shadow:0 2px 16px rgba(0,0,0,0.22);
        }
        .map-hdr-left { display:flex; align-items:center; gap:0.5rem; }
        .map-hdr-center { flex:1; display:flex; align-items:center; justify-content:center; gap:0.4rem; }
        .map-hdr-right { display:flex; align-items:center; gap:4px; }
        .map-mode-pill {
          display:inline-flex; align-items:center; gap:0.35rem;
          background:rgba(255,255,255,0.13); border:1px solid rgba(255,255,255,0.22);
          color:#fff; border-radius:999px; padding:0.28rem 0.75rem 0.28rem 0.6rem;
          font-size:0.78rem; font-weight:700; cursor:pointer; font-family:inherit;
          transition:background 0.15s; letter-spacing:0.02em; white-space:nowrap;
        }
        .map-mode-pill:hover { background:rgba(255,255,255,0.22); }
        .map-title { font-size:1.4rem; font-weight:800; letter-spacing:0.14em; margin:0; }
        .map-accent { color:#b794ff; }
        .map-iconbtn {
          display:inline-flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.3);
          background:transparent; color:#fff; cursor:pointer; text-decoration:none; flex-shrink:0;
          transition:background .15s,transform .15s;
        }
        .map-iconbtn:hover { background:rgba(255,255,255,0.15); transform:translateY(-1px); }
        .map-iconbtn--ghost { border-color:rgba(255,255,255,0.18); opacity:0.85; }

        /* ── Stage ── */
        .map-stage {
          flex:1 1 0; min-height:0; width:100%;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:14px; padding:14px 16px; overflow:hidden;
        }

        /* ── Mappa ── */
        .map-game { display:flex; align-items:center; justify-content:center; flex:0 1 auto; min-height:0; }
        .map-fig-wrap {
          position:relative;
          width:  min(92vw, 48vh, 420px);
          height: min(92vw, 48vh, 420px);
          background:var(--stage-bg);
          border:1px solid var(--panel-bd);
          border-radius:var(--radius);
          box-shadow:var(--shadow-card);
          overflow:hidden;
        }
        .map-canvas { position:absolute; inset:0; width:100%; height:100%; background:#0b1410; z-index:0; }
        .map-canvas .leaflet-control-attribution { font-size:9px; }
        .map-maploading {
          position:absolute; inset:0; z-index:1; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:0.6rem; text-align:center;
          color:var(--text-soft); font-size:0.85rem; font-weight:600; padding:1rem;
          background:var(--stage-bg);
        }
        .map-maperr { color:var(--absent); }
        .map-spinner {
          width:28px; height:28px; border-radius:50%;
          border:3px solid rgba(124,58,237,0.25); border-top-color:#7c3aed;
          animation:map-spin .8s linear infinite;
        }
        @keyframes map-spin { to { transform:rotate(360deg); } }
        .map-mapover {
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          background:radial-gradient(ellipse at center, rgba(124,58,237,0.08), var(--stage-bg) 70%);
        }

        .map-round-badge {
          position:absolute; top:8px; left:10px; z-index:2;
          display:inline-flex; align-items:center; gap:0.25rem;
          font-size:0.78rem; font-weight:800; letter-spacing:0.04em;
          color:#fff; font-variant-numeric:tabular-nums;
          background:rgba(20,10,40,0.6); border-radius:999px; padding:0.16rem 0.6rem;
        }
        .map-attempt-badge {
          position:absolute; top:8px; right:10px; z-index:2;
          font-size:0.78rem; font-weight:800; color:#fff;
          background:rgba(124,58,237,0.85); border-radius:999px; padding:0.16rem 0.55rem;
          box-shadow:var(--shadow-key);
        }

        /* ── Card di gioco ── */
        .map-ctrl-block {
          flex:0 0 auto; width:min(94vw,360px);
          background:var(--panel); border:1px solid var(--panel-bd);
          border-radius:var(--radius); padding:0.85rem 0.9rem;
          display:flex; flex-direction:column; box-shadow:var(--shadow-card);
        }
        .map-card-stats {
          display:flex; align-items:stretch; margin-bottom:0.75rem; flex-shrink:0;
          background:var(--stat-bg); border:1px solid var(--stat-bd);
          border-radius:var(--radius); padding:0.55rem 0.4rem; gap:0.4rem;
        }
        .map-card-stat {
          flex:1; min-width:0; display:grid;
          grid-template-columns:auto minmax(0,1fr); grid-template-rows:auto auto;
          align-items:center; column-gap:0.5rem; padding:0.1rem 0.5rem; color:var(--pv-ink);
        }
        .map-card-stat-ico { grid-row:1 / span 2; color:var(--pv); }
        .map-card-stat-val { font-size:1.4rem; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; align-self:end; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .map-card-stat-lbl { font-size:0.56rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; opacity:0.7; align-self:start; }
        .map-card-stat--mid { border-left:1px solid var(--stat-bd); padding-left:0.7rem; }

        .map-panel { display:flex; flex-direction:column; gap:0.6rem; animation:map-panel-in .3s ease; }
        @keyframes map-panel-in { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }

        /* ── Playing ── */
        .map-prompt { text-align:center; font-size:0.95rem; font-weight:800; color:var(--pv-ink); margin:0; }
        .map-inputrow {
          display:flex; align-items:center; gap:0.5rem;
          border:2px solid var(--panel-bd); border-radius:12px;
          padding:0.1rem 0.7rem; background:rgba(0,0,0,0.012);
          transition:border-color .15s, box-shadow .15s;
        }
        .map-inputrow:focus-within { border-color:var(--pv); box-shadow:var(--focus-ring); }
        .map-input-ico { color:var(--pv); display:inline-flex; flex-shrink:0; }
        .map-input {
          flex:1; min-width:0; border:none; outline:none; background:transparent;
          font-family:inherit; font-size:1.15rem; font-weight:700; color:var(--text);
          padding:0.6rem 0;
        }

        /* ── Indizi ── */
        .map-hints { display:flex; flex-direction:column; gap:0.4rem; }
        .map-hint {
          display:flex; align-items:center; gap:0.5rem;
          background:var(--stat-bg); border:1px solid var(--stat-bd); border-radius:10px;
          padding:0.4rem 0.6rem; animation:map-slide-in .25s ease;
        }
        @keyframes map-slide-in { from{opacity:0; transform:translateX(-6px)} to{opacity:1; transform:none} }
        .map-hint-ico { display:inline-flex; color:var(--pv); }
        .map-hint-lbl { font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-soft); flex:1; }
        .map-hint-val { font-size:0.92rem; font-weight:800; color:var(--pv-ink); }

        /* ── Tentativi ── */
        .map-guesslist { display:flex; flex-wrap:wrap; gap:0.35rem; }
        .map-guesschip {
          font-size:0.74rem; font-weight:800; border-radius:999px; padding:0.2rem 0.6rem;
          background:rgba(192,57,43,0.1); color:#c0392b; border:1px solid rgba(192,57,43,0.25);
        }
        .map-guesschip.ok { background:rgba(47,125,74,0.12); color:var(--green); border-color:rgba(47,125,74,0.3); }

        /* ── Reveal ── */
        .map-reveal {
          display:flex; flex-direction:column; align-items:center; gap:0.15rem;
          background:linear-gradient(160deg,rgba(124,58,237,0.1),rgba(47,125,74,0.06));
          border:2px solid rgba(124,58,237,0.22); border-radius:12px; padding:0.9rem;
          animation:map-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .map-reveal.miss { background:linear-gradient(160deg,rgba(192,57,43,0.1),rgba(124,58,237,0.05)); border-color:rgba(192,57,43,0.25); }
        .map-reveal-flag { font-size:1.8rem; line-height:1; font-weight:900; color:var(--green); animation:map-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        .map-reveal.miss .map-reveal-flag { color:#c0392b; }
        .map-reveal-lbl { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-soft); }
        .map-reveal-city { font-size:2rem; font-weight:900; line-height:1; color:var(--pv); margin-top:0.1rem; text-align:center; }
        .map-reveal-country { font-size:0.85rem; font-weight:700; color:var(--text-soft); margin-top:0.1rem; }
        .map-reveal-tip { font-size:0.74rem; color:var(--text-soft); margin:0.5rem 0 0; text-align:center; line-height:1.3; }
        @keyframes map-slide-up { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes map-pop { from{transform:scale(0)} to{transform:scale(1)} }

        /* ── Bottone primario ── */
        .map-next {
          width:100%; height:48px;
          display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
          background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%); color:#fff; border:none;
          border-radius:var(--radius-sm); font-family:inherit; font-size:1rem; font-weight:800; cursor:pointer;
          box-shadow:0 6px 20px rgba(91,33,182,0.4);
          transition:filter .15s,transform .1s,box-shadow .15s;
        }
        .map-next:hover { filter:brightness(1.07); transform:translateY(-1px); box-shadow:0 10px 28px rgba(91,33,182,0.5); }
        .map-next:focus-visible { outline:none; box-shadow:var(--focus-ring); }
        .map-next:active { transform:scale(.98); }
        .map-next:disabled { opacity:0.5; cursor:not-allowed; filter:none; transform:none; box-shadow:none; }
        .map-next--ghost { background:transparent; color:var(--pv-ink); border:1.5px solid var(--panel-bd); box-shadow:none; height:42px; margin-top:.1rem; font-weight:700; }
        .map-next--ghost:hover { background:var(--stat-bg); border-color:var(--pv); transform:none; filter:none; }

        /* ── Game over ── */
        .map-panel--over { gap:0.6rem; }
        .map-over {
          display:flex; flex-direction:column; align-items:center; gap:0.1rem;
          background:linear-gradient(160deg,rgba(124,58,237,0.08),rgba(47,125,74,0.06));
          border:2px solid rgba(124,58,237,0.18); border-radius:12px; padding:1rem 0.9rem 0.85rem;
          animation:map-slide-up .35s cubic-bezier(.34,1.56,.64,1);
        }
        .map-over-emoji { font-size:2.4rem; line-height:1; animation:map-pop .5s cubic-bezier(.34,1.7,.5,1) both; }
        .map-over-label { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--pv-ink); margin-top:.2rem; }
        .map-over-total { font-size:2.6rem; font-weight:900; line-height:1; color:var(--pv); font-variant-numeric:tabular-nums; margin-top:.1rem; }
        .map-over-pts { font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#6b8070; }
        .map-wr-grid { display:flex; gap:0.4rem; width:100%; margin-top:0.6rem; }
        .map-wr-cell { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.1rem; background:rgba(255,255,255,0.6); border:1px solid rgba(47,125,74,0.13); border-radius:8px; padding:0.4rem 0.2rem; }
        .map-wr-num { font-size:0.92rem; font-weight:800; color:var(--green-dark); font-variant-numeric:tabular-nums; }
        .map-wr-sub { font-size:0.55rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#6b8070; }

        /* ── Mobile ── */
        @media (max-width: 759px) {
          .map-hdr-center .map-mode-pill span { display:none; }
          .map-mode-pill { padding:0.28rem 0.55rem; }
        }

        /* ── Desktop ── */
        @media (min-width: 760px) {
          .map-page { --hdr-h: 56px; }
          .map-header { display:grid; grid-template-columns:1fr auto 1fr; padding:0 1.25rem; }
          .map-hdr-left { justify-self:start; gap:0.75rem; }
          .map-hdr-right { justify-self:end; gap:0.5rem; }
          .map-stage { flex-direction:row; align-items:center; justify-content:center; gap:2.5rem; padding:1.5rem 2rem; }
          .map-fig-wrap {
            width:  clamp(280px, calc(100dvh - var(--hdr-h) - 3rem), 560px);
            height: clamp(280px, calc(100dvh - var(--hdr-h) - 3rem), 560px);
          }
          .map-ctrl-block { flex:0 0 340px; width:340px; padding:1rem 1.1rem; }
        }

        /* ════════════════ DARK MODE (viola+verde, base Trivia) ════════════════ */
        .map-page.dark {
          --pv:#9b5cf6; --pv2:#7c3aed; --pv3:#b794ff; --pv-ink:#c4a5ff;
          --green:#2f9e63; --green-dark:#6fe0a6; --gold:#e8c34a;
          --surface:#0e0a16; --panel:#15231c; --panel-bd:rgba(155,92,246,0.22);
          --stage-bg:#140e22; --text:#e7def7; --text-soft:#b6a9cf;
          --stat-bg:rgba(155,92,246,0.10); --stat-bd:rgba(155,92,246,0.22);
          --shadow-card:0 .5rem 1.25rem rgba(0,0,0,0.45);
          --shadow-key:0 .125rem .25rem rgba(0,0,0,0.25);
        }
        .map-page.dark .map-header { background:linear-gradient(100deg,#4c1d95 0%,#2a1150 55%,#0a1410 130%); }
        .map-page.dark .map-stage  { background:radial-gradient(ellipse at 38% 42%, #1c1233 0%, var(--surface) 72%); }
        .map-page.dark .map-card-stat { color:#c4a5ff; }
        .map-page.dark .map-card-stat-ico { color:#c4a5ff; }
        .map-page.dark .map-reveal { background:linear-gradient(160deg,rgba(155,92,246,0.16),rgba(47,158,99,0.08)); border-color:rgba(155,92,246,0.28); }
        .map-page.dark .map-reveal.miss { background:linear-gradient(160deg,rgba(192,57,43,0.16),rgba(155,92,246,0.06)); border-color:rgba(192,57,43,0.32); }
        .map-page.dark .map-wr-num { color:#c4a5ff; }
        .map-page.dark .map-wr-cell { background:rgba(255,255,255,0.04); border-color:rgba(155,92,246,0.22); }
        .map-page.dark .map-wr-sub { color:#b6a9cf; }
        .map-page.dark .map-over { background:linear-gradient(160deg,rgba(155,92,246,0.16),rgba(47,158,99,0.08)); border-color:rgba(155,92,246,0.28); }
        .map-page.dark .map-over-pts { color:#b6a9cf; }
        .map-page.dark .map-guesschip { background:rgba(192,57,43,0.18); border-color:rgba(192,57,43,0.35); color:#ef9a93; }
        .map-page.dark .map-guesschip.ok { background:rgba(47,158,99,0.18); border-color:rgba(47,158,99,0.35); color:#7fd3a5; }
        .map-page.dark .map-tcard { background:#1a1230; }
        .map-page.dark .map-tdesc { color:#b6a9cf; }
        .map-page.dark .map-tsub  { color:var(--text); }

        /* ── Trophy overlay ── */
        .map-overlay { position:fixed; inset:0; z-index:100; background:rgba(20,10,40,0.74); display:flex; align-items:center; justify-content:center; padding:1rem; animation:map-fadein .25s ease; }
        @keyframes map-fadein { from{opacity:0} to{opacity:1} }
        .map-tcard { background:#fff; border-radius:20px; overflow:hidden; width:100%; max-width:380px; box-shadow:0 24px 64px rgba(0,0,0,0.35); animation:map-slide-up .35s cubic-bezier(.34,1.56,.64,1); }
        .map-thead { color:#fff; padding:1.3rem 1.5rem 1.1rem; display:flex; flex-direction:column; align-items:center; gap:.25rem; position:relative; }
        .map-tgrade { position:absolute; top:.9rem; right:1.1rem; font-size:1.5rem; font-weight:900; opacity:.25; }
        .map-tico { font-size:2.6rem; line-height:1; }
        .map-tlbl { font-size:1.1rem; font-weight:700; margin-top:.15rem; text-align:center; }
        .map-tbody { padding:1.1rem 1.4rem; }
        .map-tdesc { color:#6b8070; font-size:.9rem; margin-bottom:.35rem; }
        .map-tsub  { font-weight:700; color:#17271d; margin-bottom:.9rem; font-size:.88rem; }
        .map-tcta  { width:100%; padding:.8rem 1.4rem; display:inline-flex; align-items:center; justify-content:center; gap:.5rem; background:linear-gradient(100deg,#7c3aed 0%,#6024c4 55%,#9b5cf6 130%); color:#fff; border:none; border-radius:10px; font-family:inherit; font-size:.95rem; font-weight:800; cursor:pointer; transition:filter .15s; }
        .map-tcta:hover { filter:brightness(1.08); }
      `}</style>
      <SiteFooter />
    </div>
  );
}
