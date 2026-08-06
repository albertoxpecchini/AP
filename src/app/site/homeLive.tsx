// ─────────────────────────────────────────────────────────────────────────────
// Pezzi "vivi" della home.
//
// Vivi, non in moto perpetuo. Prima ognuno di questi visual si portava dietro
// la sua timeline GSAP con repeat:-1: il browser si costruiva da solo, il
// terminale digitava da solo, l'HUD giocava da solo, la scansione scendeva da
// sola. Sette filmini che giravano uguali che ci fosse qualcuno a guardarli o
// no, sfasati fra loro, con la griglia prodotti che pulsava da sette punti
// diversi contemporaneamente.
//
// Adesso la regola è una: A RIPOSO STANNO FERMI, e si muovono dove li tocchi.
// Il moto arriva tutto da tre numeri che site/GlassMotion.tsx (blocco ④) scrive
// sul .sb-card-visual sotto il puntatore — --vis-x, --vis-y, --vis-in — e sono
// i visual stessi, in CSS, a farne quello che devono (vedi home.css). Qui sotto
// resta quasi solo markup: niente useEffect, niente timeline, niente cleanup da
// sbagliare. L'unica eccezione è GameHud, che conta punti, e il CSS non sa
// contare.
//
// Convenzione i18n: i contenuti che non sono prosa (numeri, nomi di progetto,
// comandi da terminale) portano data-no-i18n + translate="no".
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SiteLink } from "./nav";
import { IcArrowUpRight } from "./homeIcons";

/** Il movimento decorativo si accende solo se l'utente non l'ha disattivato. */
function motionOK() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero — bottoni dei progetti in corso

   Qui c'era anche una riga di stato "in diretta" ("Available for new projects"
   + l'orologio di Mantova, al secondo). È stata tolta: un cartello di
   disponibilità sopra al nome dice quanto lavoro manca, non quanto se ne fa, e
   l'orologio costava un render al secondo per un'informazione che nessuno era
   venuto a cercare. La hero adesso apre sul titolo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* I lavori in corso. Se ne vede uno alla volta: per aggiungerne un altro basta
   una riga qui sotto — la giostra si adatta da sola, e con una voce sola sta
   ferma. `route: true` per le pagine di casa (SiteLink gestisce i
   sottodomini), altrimenti il sito del cliente si apre in una scheda nuova. */
const BUILDING: { name: string; href: string; route?: boolean }[] = [
  { name: "Cascina Fontana", href: "https://cascinafontana.xyz" },
  { name: "Rivalta sul Mincio", href: "https://rivaltasulmincio.it" },
];

/* Un bottone vero alla volta: entra da sotto la finestrella, esce da sopra.
   Nel DOM ce n'è sempre uno solo — niente pile in position:absolute, niente
   turni da sincronizzare: il bersaglio è pieno e premibile per intero.

   Il turno non lo dà più un timer da 3,4 secondi. Lo dai tu: ogni volta che il
   puntatore entra nella finestrella, si passa al nome dopo. Prima il gesto era
   "fermalo prima che scappi" — un bersaglio che si sposta mentre lo miri —
   adesso è "guarda cos'altro c'è". Stessa animazione, ma è una risposta invece
   che una sveglia. */
export function NowBuilding() {
  const [i, setI] = useState(0);
  const itemRef = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const cur = BUILDING[i];

  // useLayoutEffect e non useEffect: il nome nuovo deve trovarsi già fuori
  // dalla finestrella al primo frame, altrimenti lampeggia al suo posto prima
  // di saltare giù.
  useLayoutEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    // Il primo nome è già al suo posto: si anima solo chi arriva dopo.
    if (first.current) {
      first.current = false;
      return;
    }
    if (!motionOK()) return;

    gsap.fromTo(
      item,
      { yPercent: 115, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
    );
    return () => {
      gsap.killTweensOf(item);
    };
  }, [i]);

  const next = () => {
    if (BUILDING.length < 2) return;
    const item = itemRef.current;
    const advance = () => setI((v) => (v + 1) % BUILDING.length);
    if (!item || !motionOK()) {
      advance();
      return;
    }
    gsap.to(item, { yPercent: -115, autoAlpha: 0, duration: 0.32, ease: "power2.in", onComplete: advance });
  };

  return (
    <div className="sb-nowbuild">
      <span className="sb-nowbuild-label">Currently building</span>
      <span
        className="sb-nowbuild-slot"
        data-no-i18n
        translate="no"
        onPointerEnter={next}
        onFocus={next}
      >
        {/* key sul nome: il turno smonta il vecchio e monta il nuovo, così la
            fromTo di entrata parte sempre da un nodo pulito. */}
        <span className="sb-nowbuild-item" key={cur.name} ref={itemRef}>
          {cur.route ? (
            <SiteLink to={cur.href} className="sb-nowbuild-btn">
              {cur.name}
              <IcArrowUpRight size={13} aria-hidden="true" />
            </SiteLink>
          ) : (
            <a
              href={cur.href}
              target="_blank"
              rel="noreferrer noopener"
              className="sb-nowbuild-btn"
            >
              {cur.name}
              <IcArrowUpRight size={13} aria-hidden="true" />
            </a>
          )}
        </span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web development" — il sito lo costruisci tu

   C'era un cursore finto che faceva il giro di quattro blocchi accendendoli, e
   un badge che passava da "building…" a "live" per conto suo. Adesso i tre
   blocchi si riempiono da sinistra a destra seguendo --vis-x: spingi a destra e
   la pagina si costruisce, il badge diventa `live` in fondo alla corsa. A
   riposo resta a metà — che è il fotogramma onesto di un lavoro in corso.
   Tutto in CSS: qui c'è solo la scena.
   ═══════════════════════════════════════════════════════════════════════════ */

export function BrowserMock() {
  return (
    <div className="sb-browser" aria-hidden="true">
      <div className="sb-browser-bar">
        <i />
        <i />
        <i />
        <span className="sb-browser-url" translate="no" data-no-i18n>
          albertopecchini.it
        </span>
        {/* Due parole sovrapposte che si scambiano l'opacità sul finale della
            corsa: cambiare testo davvero avrebbe voluto dire del JS. */}
        <span className="sb-browser-badge" translate="no" data-no-i18n>
          <span className="build">building</span>
          <span className="live">live</span>
        </span>
      </div>
      <div className="sb-browser-body">
        <div className="sb-skel sb-skel--hero" style={{ "--i": 0 } as React.CSSProperties} />
        <div className="sb-skel sb-skel--side" style={{ "--i": 1 } as React.CSSProperties} />
        <div className="sb-skel sb-skel--main" style={{ "--i": 2 } as React.CSSProperties} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web design" — la tendina la tieni tu

   La stessa interfaccia disegnata due volte, chiara e scura. La tendina non
   scorre più avanti e indietro da sola ogni 7 secondi: sta dove sei tu.
   ═══════════════════════════════════════════════════════════════════════════ */

export function AaSwap() {
  return (
    <div className="sb-aa" aria-hidden="true" data-no-i18n>
      <span className="lite">
        Aa <small>500</small>
      </span>
      <span className="dark">
        Aa <small>400</small>
      </span>
      <i className="sb-aa-handle" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "AI-assisted development" — la digitazione si scorre

   Il comando sta tutto nel markup; --vis-x lo scopre carattere per carattere
   con un clip-path, e il caret sta sul bordo del taglio. È la testa di
   scrittura: si muove, e per questo NON lampeggia più — un caret che lampeggia
   da fermo è l'animazione più ripetitiva che ci sia, e qui non serviva a
   niente. Arrivati in fondo compare l'output. A riposo: comando a metà.
   ═══════════════════════════════════════════════════════════════════════════ */

const CMD = 'claude "rifai la home"';
const OUT = "# 3 files changed · build ok";

export function LiveTerminal() {
  return (
    <div className="sb-term" aria-hidden="true" data-no-i18n translate="no">
      <div className="sb-term-line">
        <span className="p">$</span>
        {/* --n: quanto è lungo il comando in caratteri. Serve al CSS per
            tenersi largo quanto il testo intero anche mentre ne mostra un
            pezzo: senza, la riga si allargherebbe mentre digiti. */}
        <span className="sb-term-typed" style={{ "--n": CMD.length } as React.CSSProperties}>
          <span className="sb-term-cmd">{CMD}</span>
          <span className="sb-term-caret" />
        </span>
      </div>
      <div className="sb-term-line">
        <span className="c sb-term-out">{OUT}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web games" — il punteggio lo fai tu

   Qui c'erano tre pillole, un "+120" che saltava fuori a ogni round, una serie
   che s'infiammava e un voto che si ribaltava, tutto su un ciclo che
   ricominciava da zero all'infinito. Resta un numero e un voto: il punteggio
   sale con la strada che il puntatore fa dentro la card, e il voto scatta di
   livello mentre sale. Uscendo resta dove sei arrivato — è il tuo.

   È l'unico visual con del JS suo: il risultato è testo, e il CSS non sa
   contare.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Punteggio massimo raggiungibile, e quanti pixel di strada ci vogliono. */
const HUD_MAX = 1480;
const HUD_REACH = 1100;

/** Soglie dei voti, dal più alto al più basso: il primo che passa vince. */
const GRADES: [number, string][] = [
  [0.92, "A+"],
  [0.62, "A"],
  [0.3, "B"],
  [0, "C"],
];

export function GameHud() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;
    // Il puntatore comanda dall'intera card, non dal solo riquadro: si comincia
    // a segnare già mentre si legge il testo qui accanto.
    const zone = el.closest<HTMLElement>(".sb-card") ?? el;
    const score = el.querySelector<HTMLElement>(".sb-hud-score");
    const grade = el.querySelector<HTMLElement>(".sb-hud-grade");
    if (!score || !grade) return;

    let travel = 0;
    let last: { x: number; y: number } | null = null;
    let frame = 0;
    let shown = -1;

    const paint = () => {
      frame = 0;
      const p = Math.min(1, travel / HUD_REACH);
      const v = Math.round(p * HUD_MAX);
      if (v === shown) return;
      shown = v;
      score.textContent = v.toLocaleString("it-IT");
      const g = GRADES.find(([at]) => p >= at)?.[1] ?? "C";
      if (grade.textContent !== g) {
        grade.textContent = g;
        // Il voto scatta solo quando cambia davvero: è l'unico momento in cui
        // ha qualcosa da dire.
        gsap.fromTo(grade, { rotationX: -90 }, { rotationX: 0, duration: 0.4, ease: "back.out(2)" });
      }
    };

    const move = (e: PointerEvent) => {
      const now = { x: e.clientX, y: e.clientY };
      if (last) travel += Math.hypot(now.x - last.x, now.y - last.y);
      last = now;
      // Una scrittura per frame, non una per movimento del puntatore.
      if (!frame) frame = requestAnimationFrame(paint);
    };
    // Rientrando si riparte dal punto di ingresso: senza questo il salto fra
    // l'ultima posizione di prima e la nuova conterebbe come strada percorsa.
    const reset = () => {
      last = null;
    };

    zone.addEventListener("pointermove", move, { passive: true });
    zone.addEventListener("pointerenter", reset);
    zone.addEventListener("pointerleave", reset);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      zone.removeEventListener("pointermove", move);
      zone.removeEventListener("pointerenter", reset);
      zone.removeEventListener("pointerleave", reset);
      gsap.killTweensOf(grade);
    };
  }, []);

  return (
    <div className="sb-hud" ref={ref} aria-hidden="true" data-no-i18n translate="no">
      {/* Lo zero è il fotogramma di riposo: la partita non è ancora cominciata
          perché comincia quando arrivi tu. */}
      <span className="sb-hud-pill">
        <span className="sb-hud-score">0</span>
        <span>pt</span>
      </span>
      <span className="sb-hud-grade">C</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web tools" — la lente la muovi tu

   Il confronto fra le due liste c'è già tutto, fermo e leggibile: le righe
   portano il loro colore. Quello che si muove è la lampada — una banda di luce
   che sta a --vis-y e ravviva quello che attraversa. Prima scendeva da sola
   ogni 3,6 secondi e le righe lampeggiavano a turno su cinque delay diversi.
   ═══════════════════════════════════════════════════════════════════════════ */

export function DiffScan() {
  return (
    <div className="sb-diff" aria-hidden="true">
      <div className="sb-diff-col">
        <div className="sb-diff-row" />
        <div className="sb-diff-row sb-diff-row--hit" />
        <div className="sb-diff-row" />
        <div className="sb-diff-row sb-diff-row--hit" />
      </div>
      <div className="sb-diff-col">
        <div className="sb-diff-row sb-diff-row--hit" />
        <div className="sb-diff-row sb-diff-row--miss" />
        <div className="sb-diff-row sb-diff-row--hit" />
        <div className="sb-diff-row" />
      </div>
      <span className="sb-diff-scan" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Client websites" — il segnale segue il dito

   Dal nodo centrale partono due fili verso i due siti. Non partono più da soli
   ogni 3 secondi: si riempie quello dalla parte in cui vai, e il pallino del
   sito che raggiungi si accende. Sei tu a instradare.

   pathLength="1" sul tracciato: così il tratteggio si misura da 0 a 1 a
   prescindere da quanto è lungo davvero il filo, e il CSS può scrivere
   stroke-dashoffset senza sapere niente della geometria.
   ═══════════════════════════════════════════════════════════════════════════ */

const FLOW_PATHS = ["M130,17 C130,50 46,42 46,72", "M130,17 C130,50 214,42 214,72"];

export function ClientFlow() {
  return (
    <div className="sb-flow" aria-hidden="true">
      <svg className="sb-flow-wires" viewBox="0 0 260 92" fill="none" preserveAspectRatio="none">
        {FLOW_PATHS.map((d, i) => (
          <g key={d} className={i ? "to-right" : "to-left"}>
            <path className="ghost" d={d} strokeWidth="1.5" strokeLinecap="round" />
            <path
              className="pulse"
              d={d}
              pathLength="1"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="1"
            />
          </g>
        ))}
      </svg>

      <span className="sb-flow-hub">
        <img src="/favicon.svg" alt="" width={20} height={20} />
      </span>

      <div className="sb-flow-ends" data-no-i18n translate="no">
        <span className="sb-chip to-left">
          <i className="sb-chip-dot" /> Cascina Fontana
        </span>
        <span className="sb-chip to-right">
          <i className="sb-chip-dot" /> Rivalta sul Mincio
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "CAT" — il cubo lo giri tu

   Piano cartesiano in tre dimensioni con un cubo che ci galleggia sopra. È 3D
   vero (perspective + preserve-3d, sei facce), e adesso è anche CSS puro: il
   cubo si orienta su --vis-x/--vis-y e --vis-y lo solleva dal piano stringendo
   l'ombra. Muovendo in orizzontale lo si fa ruotare su sé stesso, alzando la
   mano lo si alza e lo si guarda da sopra.

   Prima qui c'erano TRE sistemi di moto sovrapposti — un galleggiamento yoyo
   infinito, un giro su sé stesso da 26 secondi e l'inseguimento del puntatore —
   con tutto il mestiere che serve a non farli litigare sulle stesse proprietà.
   Adesso c'è solo la tua mano.
   ═══════════════════════════════════════════════════════════════════════════ */

const CUBE_FACES = ["front", "back", "right", "left", "top", "bottom"] as const;

export function CatCube() {
  return (
    <div className="sb-cat" aria-hidden="true">
      <div className="sb-cat-stage">
        <span className="sb-cat-plane" />
        <span className="sb-cat-origin">
          <span className="sb-cat-shadow" />
          <span className="sb-cat-z" />
          <span className="sb-cat-lift">
            <span className="sb-cat-cube">
              {CUBE_FACES.map((f) => (
                <span key={f} className={`sb-cat-face sb-cat-face--${f}`} />
              ))}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sezione open source — muro dei commit.

   Da fermo resta fermo: l'onda di calore che lo attraversava in continuazione
   (119 celle in animazione perenne, un ridisegno a ogni frame anche mentre si
   scorreva dall'altra parte della pagina) non è tornata e non torna.

   Quello che c'è adesso vive solo sotto il puntatore: data-puddle accende la
   pozza d'acqua di site/puddle.ts, che esiste finché il cursore è dentro la
   griglia e si spegne uscendo. Ferma, non costa niente. È il posto dove questa
   idea era già stata messa alla prova prima di portarla su tutte le card.
   ═══════════════════════════════════════════════════════════════════════════ */

const WEEKS = 17;
const DAYS = 7;

export function ContribGraph() {
  // Intensità pseudo-casuale ma stabile: stesso disegno a ogni render.
  const level = (i: number) => [0, 1, 1, 2, 0, 3, 2, 1, 4, 0, 2, 3, 1, 0][i % 14];

  return (
    <div className="sb-contrib" aria-hidden="true">
      <div className="sb-contrib-grid" data-puddle>
        {Array.from({ length: WEEKS * DAYS }, (_, i) => (
          <span key={i} className="sb-cell" data-lv={level(i)} />
        ))}
      </div>
      <div className="sb-contrib-foot">
        <span>
          {/* Il valore finale è già nel markup: se il conteggio non parte
              (movimento ridotto), il numero resta comunque giusto. */}
          <b data-count-to="1200" data-count-suffix="+" data-no-i18n translate="no">
            1.200+
          </b>{" "}
          commits
        </span>
        <span className="sb-contrib-legend" data-puddle>
          <i data-lv="0" />
          <i data-lv="1" />
          <i data-lv="2" />
          <i data-lv="3" />
          <i data-lv="4" />
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Riga "trusted by" — stato di servizio accanto a ogni cliente.

   Il pallino non pinga più ogni 2,6 secondi (per riga, con delay scaglionati:
   quattro anelli che si allargavano a turno in eterno). Sta acceso e fermo —
   che è poi quello che vuol dire "live" — e l'anello parte sulla riga che
   punti, una volta. Il CSS sta in home.css.
   ═══════════════════════════════════════════════════════════════════════════ */

export function TrustedDot() {
  return <i className="sb-chip-dot sb-chip-dot--sm" aria-hidden="true" />;
}
