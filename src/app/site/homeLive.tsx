// ─────────────────────────────────────────────────────────────────────────────
// Pezzi "vivi" della home — i visual delle card non sono più fermi immagine:
// scrivono, contano, pulsano, si accendono. Ogni componente è autonomo (monta,
// avvia il suo loop GSAP, lo smonta) e si spegne da solo con prefers-reduced-
// motion, dove resta il fotogramma statico più leggibile.
//
// Convenzione i18n: i contenuti dinamici (numeri, nomi di progetto, comandi da
// terminale) portano data-no-i18n + translate="no" — il traduttore DOM non deve
// inseguire testo che cambia da solo.
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
   Hero — riga di stato "in diretta" + bottoni dei progetti in corso
   ═══════════════════════════════════════════════════════════════════════════ */

const clock = () =>
  new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());

export function LiveStatus() {
  const [now, setNow] = useState(clock);

  useEffect(() => {
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="sb-live">
      <span className="sb-live-dot" aria-hidden="true" />
      <span className="sb-live-txt">Available for new projects</span>
      <span className="sb-live-sep" aria-hidden="true" />
      <span className="sb-live-clock" data-no-i18n translate="no">
        Mantova {now}
      </span>
    </p>
  );
}

/* I lavori in corso. Se ne vede uno alla volta: per aggiungerne un altro basta
   una riga qui sotto — la giostra si adatta da sola, e con una voce sola sta
   ferma. `route: true` per le pagine di casa (SiteLink gestisce i
   sottodomini), altrimenti il sito del cliente si apre in una scheda nuova. */
const BUILDING: { name: string; href: string; route?: boolean }[] = [
  { name: "Cascina Fontana", href: "https://cascinafontana.xyz" },
  { name: "Rivalta sul Mincio", href: "https://rivaltasulmincio.it" },
];

/** Quanto resta fermo un nome prima di dare il cambio. */
const BUILD_HOLD = 3400;

/* Un bottone vero alla volta: entra da sotto la finestrella, resta fermo il
   tempo di leggerlo e di premerlo, esce da sopra. Nel DOM ce n'è sempre uno
   solo — niente pile in position:absolute, niente turni da sincronizzare: il
   bersaglio è pieno e premibile per intero. E finché il puntatore (o il focus)
   sta dentro, il turno salta: un bersaglio che scappa mentre lo miri non è un
   bersaglio. */
export function NowBuilding() {
  const [i, setI] = useState(0);
  const itemRef = useRef<HTMLSpanElement>(null);
  const held = useRef(false);
  const first = useRef(true);
  const cur = BUILDING[i];

  // useLayoutEffect e non useEffect: il nome nuovo deve trovarsi già fuori
  // dalla finestrella al primo frame, altrimenti lampeggia al suo posto prima
  // di saltare giù.
  useLayoutEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const anim = motionOK();
    let alive = true;
    let timer = 0;

    // Il primo nome è già al suo posto: si anima solo chi arriva dopo.
    if (first.current) first.current = false;
    else if (anim) {
      gsap.fromTo(
        item,
        { yPercent: 115, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out" },
      );
    }

    if (BUILDING.length > 1) {
      const advance = () => {
        if (alive) setI((v) => (v + 1) % BUILDING.length);
      };
      const turn = () => {
        if (!alive) return;
        if (held.current) {
          timer = window.setTimeout(turn, BUILD_HOLD);
          return;
        }
        if (anim) {
          gsap.to(item, {
            yPercent: -115,
            autoAlpha: 0,
            duration: 0.32,
            ease: "power2.in",
            onComplete: advance,
          });
        } else advance();
      };
      timer = window.setTimeout(turn, BUILD_HOLD);
    }

    return () => {
      alive = false;
      window.clearTimeout(timer);
      gsap.killTweensOf(item);
    };
  }, [i]);

  const hold = (on: boolean) => () => {
    held.current = on;
  };

  return (
    <div className="sb-nowbuild">
      <span className="sb-nowbuild-label">Currently building</span>
      <span
        className="sb-nowbuild-slot"
        data-no-i18n
        translate="no"
        onPointerEnter={hold(true)}
        onPointerLeave={hold(false)}
        onFocus={hold(true)}
        onBlur={hold(false)}
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
   Card "Web development" — il mock del browser che si costruisce da solo
   ═══════════════════════════════════════════════════════════════════════════ */

export function BrowserMock() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const ctx = gsap.context(() => {
      const badge = el.querySelector<HTMLElement>(".sb-browser-badge");
      const dot = el.querySelector<HTMLElement>(".sb-browser-cursor");
      const skels = gsap.utils.toArray<HTMLElement>(".sb-skel", el);
      if (!badge || !dot) return;

      // Il "cursore" fa il giro dei quattro blocchi (hero, colonna, corpo,
      // piede): ognuno si illumina al passaggio. Le coordinate sono relative
      // al padding-box di .sb-browser-body, dove il cursore è ancorato.
      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "power2.inOut" } });
      const stops = [
        { x: 150, y: 30 },
        { x: 55, y: 105 },
        { x: 235, y: 105 },
        { x: 120, y: 180 },
      ];

      tl.call(() => {
        badge.textContent = "building…";
        el.classList.remove("is-live");
      });

      stops.forEach((s, i) => {
        tl.to(dot, { x: s.x, y: s.y, duration: 0.75 }, i ? "+=0.25" : 0)
          .to(dot, { scale: 0.72, duration: 0.13, yoyo: true, repeat: 1, ease: "power2.out" })
          .fromTo(
            skels[i],
            { "--sb-lit": 0 },
            { "--sb-lit": 1, duration: 0.35, yoyo: true, repeat: 1 },
            "<",
          );
      });

      tl.call(() => {
        badge.textContent = "live";
        el.classList.add("is-live");
      })
        .to({}, { duration: 2 })
        .to(dot, { x: stops[0].x, y: stops[0].y, duration: 0.4 });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    // Parte già "live": è il fotogramma giusto per chi non vedrà mai il ciclo
    // (movimento ridotto). Il timeline lo riporta subito su "building…".
    <div className="sb-browser is-live" ref={ref} aria-hidden="true">
      <div className="sb-browser-bar">
        <i />
        <i />
        <i />
        <span className="sb-browser-url" translate="no" data-no-i18n>
          albertopecchini.it
        </span>
        <span className="sb-browser-badge" translate="no" data-no-i18n>
          live
        </span>
      </div>
      <div className="sb-browser-body">
        <div className="sb-skel sb-skel--hero" />
        <div className="sb-skel sb-skel--side" />
        <div className="sb-skel sb-skel--main" />
        <div className="sb-skel sb-skel--foot" />
        <span className="sb-browser-cursor" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web design" — la stessa interfaccia disegnata due volte: una tendina
   scorre avanti e indietro e scopre il tema scuro sotto quello chiaro.
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
   Card "AI-assisted development" — il terminale digita davvero
   ═══════════════════════════════════════════════════════════════════════════ */

const SESSIONS = [
  { cmd: 'claude "rifai la home"', out: "3 files changed · build ok" },
  { cmd: "npm run build", out: "built in 4.21s · 312 kB gzip" },
  { cmd: "git push origin main", out: "deployed · albertopecchini.it" },
  { cmd: 'codex "controlla gli a11y"', out: "0 issues · 12 checks passed" },
];

export function LiveTerminal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const cmdEl = el.querySelector<HTMLElement>(".sb-term-cmd");
    const outEl = el.querySelector<HTMLElement>(".sb-term-out");
    if (!cmdEl || !outEl) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });

      SESSIONS.forEach(({ cmd, out }) => {
        const n = { i: 0 };
        tl.set(outEl, { autoAlpha: 0 })
          .call(() => {
            cmdEl.textContent = "";
          })
          .to(n, {
            i: cmd.length,
            duration: cmd.length * 0.042,
            ease: "none",
            onUpdate: () => {
              cmdEl.textContent = cmd.slice(0, Math.round(n.i));
            },
          })
          .call(
            () => {
              outEl.textContent = out;
            },
            undefined,
            "+=0.45",
          )
          .fromTo(outEl, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" })
          .to({}, { duration: 1.9 });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="sb-term" ref={ref} aria-hidden="true" data-no-i18n translate="no">
      <div className="sb-term-line">
        <span className="p">$</span>
        <span className="sb-term-typed">
          <span className="sb-term-cmd">claude &quot;rifai la home&quot;</span>
          <span className="sb-cursor" />
        </span>
      </div>
      <div className="sb-term-line">
        <span className="c sb-term-out"># 3 files changed · build ok</span>
      </div>
      <span className="sb-term-ants" aria-hidden="true">
        <svg width="100%" height="2" viewBox="0 0 200 2" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="200" y2="1" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web games" — l'HUD gioca da solo: punti che salgono, serie, voto
   ═══════════════════════════════════════════════════════════════════════════ */

const ROUNDS = [
  { pts: 320, streak: 2, grade: "C" },
  { pts: 480, streak: 4, grade: "B" },
  { pts: 980, streak: 6, grade: "A" },
  { pts: 1480, streak: 7, grade: "A+" },
];

export function GameHud() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const score = el.querySelector<HTMLElement>(".sb-hud-score");
    const streak = el.querySelector<HTMLElement>(".sb-hud-streak");
    const grade = el.querySelector<HTMLElement>(".sb-hud-grade");
    const pop = el.querySelector<HTMLElement>(".sb-hud-pop");
    if (!score || !streak || !grade || !pop) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      const n = { v: 0 };

      ROUNDS.forEach((r, i) => {
        const gained = r.pts - (i ? ROUNDS[i - 1].pts : 0);

        tl.call(() => {
          pop.textContent = "+" + gained;
        })
          .fromTo(pop, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: -12, duration: 0.4, ease: "power2.out" })
          .to(
            n,
            {
              v: r.pts,
              duration: 0.7,
              ease: "power2.out",
              onUpdate: () => {
                score.textContent = Math.round(n.v).toLocaleString("it-IT");
              },
            },
            "<",
          )
          .to(pop, { autoAlpha: 0, y: -22, duration: 0.35 }, "-=0.15")
          .call(() => {
            streak.textContent = "🔥 ×" + r.streak;
          }, undefined, "<")
          .fromTo(streak, { scale: 1 }, { scale: 1.14, duration: 0.18, yoyo: true, repeat: 1 }, "<")
          .call(() => {
            grade.textContent = r.grade;
          })
          .fromTo(grade, { rotationX: -90, autoAlpha: 0.4 }, { rotationX: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(2)" }, "<")
          .to({}, { duration: 0.65 });
      });

      // Ricomincia da zero: il conteggio deve ripartire, non saltare indietro.
      tl.to({}, { duration: 1.1 }).call(() => {
        n.v = 0;
        score.textContent = "0";
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="sb-hud" ref={ref} aria-hidden="true" data-no-i18n translate="no">
      <span className="sb-hud-pill">
        <span className="sb-hud-score">1.480</span>
        <span>pt</span>
        <span className="up">▲</span>
        <span className="sb-hud-pop" />
      </span>
      <span className="sb-hud-pill sb-hud-streak">🔥 ×7</span>
      <span className="sb-hud-grade">A+</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "Web tools" — il confronto fra due liste si esegue sotto gli occhi:
   una riga di scansione scende e le righe si accendono al suo passaggio.
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
   Card "Client websites" — grafo di diffusione: dal nodo centrale partono
   pacchetti verso i due siti, come i broadcast di Supabase Realtime.
   ═══════════════════════════════════════════════════════════════════════════ */

const FLOW_PATHS = ["M130,17 C130,50 46,42 46,72", "M130,17 C130,50 214,42 214,72"];

export function ClientFlow() {
  return (
    <div className="sb-flow" aria-hidden="true">
      <svg className="sb-flow-wires" viewBox="0 0 260 92" fill="none" preserveAspectRatio="none">
        {FLOW_PATHS.map((d, i) => (
          <g key={d}>
            <path className="ghost" d={d} strokeWidth="1.5" strokeLinecap="round" />
            <path
              className="pulse"
              d={d}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="22 300"
              style={{ animationDelay: `${i * 1.2}s` }}
            />
          </g>
        ))}
      </svg>

      <span className="sb-flow-hub">
        <img src="/favicon.svg" alt="" width={20} height={20} />
      </span>

      <div className="sb-flow-ends" data-no-i18n translate="no">
        <span className="sb-chip">
          <i className="sb-chip-dot" /> Cascina Fontana
        </span>
        <span className="sb-chip">
          <i className="sb-chip-dot" style={{ animationDelay: "1.2s" }} /> Rivalta sul Mincio
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card "CAT" — piano cartesiano in tre dimensioni con un cubo che ci galleggia
   sopra. È 3D vero (perspective + preserve-3d, sei facce): il cubo respira
   piano da fermo e, quando ci si passa sopra, si gira verso il puntatore —
   trascinandolo in orizzontale lo si fa ruotare su sé stesso, alzando e
   abbassando lo si guarda da sopra o da sotto.
   ═══════════════════════════════════════════════════════════════════════════ */

const CUBE_FACES = ["front", "back", "right", "left", "top", "bottom"] as const;

/** Posa di riposo del cubo: assonometria leggibile, un vertice verso di noi. */
const CUBE_REST = { rotationX: -22, rotationY: 32 };

export function CatCube() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cube = el.querySelector<HTMLElement>(".sb-cat-cube");
    const lift = el.querySelector<HTMLElement>(".sb-cat-lift");
    const shadow = el.querySelector<HTMLElement>(".sb-cat-shadow");
    if (!cube || !lift || !shadow) return;

    // Movimento ridotto: il cubo resta nella posa di riposo, appoggiato in aria.
    if (!motionOK()) {
      gsap.set(cube, CUBE_REST);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(cube, CUBE_REST);

      // ── Galleggiamento: sale e scende piano, e l'ombra sul piano si stringe
      //    mentre sale. Sta sul portacubo, non sul cubo.
      const float = gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { duration: 2.6, ease: "sine.inOut" } })
        .to(lift, { y: -13 }, 0)
        .to(shadow, { scale: 0.78, opacity: 0.55 }, 0);

      // ── Giro lento da fermo. Anche questo sul PORTACUBO: il cubo è centrato
      //    sul suo asse verticale, quindi gira su sé stesso — e le rotazioni
      //    del puntatore, che stanno sul cubo, non si sovrascrivono con questa.
      const idle = gsap.to(lift, { rotationY: "+=360", duration: 26, ease: "none", repeat: -1 });

      // ── Sotto il puntatore comanda la mano: trascinando in orizzontale il
      //    cubo ruota, alzando e abbassando lo si guarda da sopra o da sotto.
      const rotX = gsap.quickTo(cube, "rotationX", { duration: 0.7, ease: "power3" });
      const rotY = gsap.quickTo(cube, "rotationY", { duration: 0.7, ease: "power3" });

      // Il puntatore comanda dall'intera card, non dal solo riquadro: il cubo
      // reagisce già mentre si legge il testo qui accanto.
      const zone = el.closest<HTMLElement>(".sb-card") ?? el;

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        rotX(gsap.utils.clamp(-62, 62, CUBE_REST.rotationX - ny * 38));
        rotY(gsap.utils.clamp(-90, 90, CUBE_REST.rotationY + nx * 72));
      };
      const enter = () => {
        idle.pause();
        gsap.to(float, { timeScale: 1.8, duration: 0.4 });
      };
      const leave = () => {
        gsap.to(float, { timeScale: 1, duration: 0.6 });
        // Rientro alla posa di riposo con gli STESSI quickTo dell'inseguimento:
        // un tween in più sulle stesse proprietà si metterebbe a litigare con
        // quello ancora in volo se si esce dalla card di corsa.
        rotX(CUBE_REST.rotationX);
        rotY(CUBE_REST.rotationY);
        idle.play();
      };

      zone.addEventListener("pointermove", move);
      zone.addEventListener("pointerenter", enter);
      zone.addEventListener("pointerleave", leave);
      return () => {
        zone.removeEventListener("pointermove", move);
        zone.removeEventListener("pointerenter", enter);
        zone.removeEventListener("pointerleave", leave);
      };
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div className="sb-cat" ref={ref} aria-hidden="true">
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
   Sezione open source — muro dei commit, fermo.
   Prima un'onda di calore lo attraversava in continuazione: 119 celle in
   animazione perenne, un ridisegno a ogni frame anche mentre si scorreva
   dall'altra parte della pagina. Il muro dice già tutto da fermo.
   ═══════════════════════════════════════════════════════════════════════════ */

const WEEKS = 17;
const DAYS = 7;

export function ContribGraph() {
  // Intensità pseudo-casuale ma stabile: stesso disegno a ogni render.
  const level = (i: number) => [0, 1, 1, 2, 0, 3, 2, 1, 4, 0, 2, 3, 1, 0][i % 14];

  return (
    <div className="sb-contrib" aria-hidden="true">
      <div className="sb-contrib-grid">
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
        <span className="sb-contrib-legend">
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
   Riga "trusted by" — stato di servizio accanto a ogni cliente
   ═══════════════════════════════════════════════════════════════════════════ */

export function TrustedDot({ delay = 0 }: { delay?: number }) {
  return <i className="sb-chip-dot sb-chip-dot--sm" style={{ animationDelay: `${delay}s` }} aria-hidden="true" />;
}
