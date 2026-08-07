// ─────────────────────────────────────────────────────────────────────────────
// Pezzi "vivi" della home.
//
// Vivi vuol dire che si muovono da soli: il browser si costruisce, il terminale
// digita, l'HUD gioca, la scansione scende, i pacchetti partono. Quello che è
// cambiato è QUANTA roba si muove e COME.
//
// Quanta: uno solo per card. L'HUD aveva quattro cose in moto insieme (punti,
// il "+120" che schizzava, la serie che s'infiammava, il voto che si ribaltava)
// e il browser un cursore finto che girava fra quattro blocchi. Adesso ogni
// visual dice una cosa sola.
//
// Come: solo transform e opacity, e in keyframe CSS. C'è stato un giro in cui
// il puntatore comandava tutti e sette i visual scrivendo `left`, `top`,
// `clip-path`, `color-mix` e `box-shadow` — proprietà che rifanno layout o
// ridisegnano a ogni movimento del mouse. Con sette riquadri più il tilt della
// card, il risultato erano scatti. Le keyframe su transform e opacity le muove
// il compositore, che non ha niente da ricalcolare.
//
// Quindi qui sotto resta quasi solo markup: il moto sta in home.css. L'unica
// eccezione è GameHud, che conta punti, e il CSS non sa contare. Il puntatore
// è rimasto su un visual solo, il cubo della card CAT, dove agisce dentro una
// transform — cioè dove costa quanto le altre.
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
        <div className="sb-skel sb-skel--hero" />
        <div className="sb-skel sb-skel--side" />
        <div className="sb-skel sb-skel--main" />
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
   Card "Web games" — la partita si gioca da sola

   Qui c'erano tre pillole, un "+120" che schizzava fuori a ogni round, una
   serie che s'infiammava e un voto che si ribaltava, su quattro round
   incatenati: quattro cose in movimento per dire che i giochi hanno un
   punteggio. Resta un numero che sale e un voto che scatta di livello mentre
   sale, poi si azzera e si ricomincia.

   È l'unico visual con del JS: il risultato è testo, e il CSS non sa contare.
   Costa una scrittura di textContent per frame su un nodo solo — che è
   l'ordine di grandezza dei contatori che il sito ha già altrove.
   ═══════════════════════════════════════════════════════════════════════════ */

const HUD_MAX = 1480;

/** Soglie dei voti sul punteggio pieno, dall'alto: il primo che passa vince. */
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
    const score = el.querySelector<HTMLElement>(".sb-hud-score");
    const grade = el.querySelector<HTMLElement>(".sb-hud-grade");
    if (!score || !grade) return;

    const ctx = gsap.context(() => {
      const n = { v: 0 };
      let shownGrade = "";

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      tl.to(n, {
        v: HUD_MAX,
        duration: 3.2,
        ease: "power2.out",
        onUpdate: () => {
          score.textContent = Math.round(n.v).toLocaleString("it-IT");
          const g = GRADES.find(([at]) => n.v / HUD_MAX >= at)?.[1] ?? "C";
          if (g === shownGrade) return;
          shownGrade = g;
          grade.textContent = g;
          // Il voto si ribalta solo quando cambia davvero: quattro volte in
          // tutto il giro, non a ogni frame.
          gsap.fromTo(grade, { rotationX: -90 }, { rotationX: 0, duration: 0.45, ease: "back.out(2)" });
        },
      })
        .to({}, { duration: 2.2 })
        // Si riazzera, non salta indietro: il conteggio deve ripartire da zero
        // e vedersi che riparte.
        .call(() => {
          n.v = 0;
          shownGrade = "";
          score.textContent = "0";
        });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="sb-hud" ref={ref} aria-hidden="true" data-no-i18n translate="no">
      {/* Il valore pieno è già nel markup: con movimento ridotto il conteggio
          non parte, e quello che resta è comunque il numero giusto. */}
      <span className="sb-hud-pill">
        <span className="sb-hud-score">1.480</span>
        <span>pt</span>
      </span>
      <span className="sb-hud-grade">A+</span>
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
   Card "CAT" — il cubo galleggia da solo, e si gira verso di te

   Piano cartesiano in tre dimensioni con un cubo che ci galleggia sopra. È 3D
   vero (perspective + preserve-3d, sei facce). Da fermo respira e gira lento
   su sé stesso; passandoci sopra il giro si ferma e il cubo si orienta verso
   il puntatore — orizzontale per girarlo, verticale per guardarlo da sopra o
   da sotto.

   Tre movimenti, tre elementi annidati (lift → spin → cube), una `transform`
   per ciascuno: si compongono da soli. Prima ci voleva GSAP proprio per
   tenerli separati; adesso lo fa l'annidamento, e qui non resta JS.
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
            <span className="sb-cat-spin">
              <span className="sb-cat-cube">
                {CUBE_FACES.map((f) => (
                  <span key={f} className={`sb-cat-face sb-cat-face--${f}`} />
                ))}
              </span>
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
