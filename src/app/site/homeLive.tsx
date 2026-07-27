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
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { SiteLink } from "./nav";
import { IcCompass, IcArrowUpRight } from "./homeIcons";

/** Il movimento decorativo si accende solo se l'utente non l'ha disattivato. */
function motionOK() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero — riga di stato "in diretta" + ticker dei progetti in corso
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

/* Le voci del ticker sono i siti veri, ognuna col suo link: Trivia e l'archivio
   restano dentro il sito (SiteLink gestisce i sottodomini), i due siti dei
   clienti aprono in una scheda nuova. */
const BUILDING: { name: string; href: string; route?: boolean }[] = [
  { name: "Trivia", href: "/trivia", route: true },
  { name: "Cascina Fontana", href: "https://cascinafontana.xyz" },
  { name: "Rivalta sul Mincio", href: "https://rivaltasulmincio.it" },
  { name: "albertopecchini.it", href: "/archivio", route: true },
];

/** La voce più lunga detta la larghezza: così la riga non si allarga a scatti. */
const LONGEST = BUILDING.reduce((a, b) => (b.name.length > a.name.length ? b : a)).name;

export function NowBuilding() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".sb-rot-item", el);
      gsap.set(items, { yPercent: 110, autoAlpha: 0 });
      gsap.set(items[0], { yPercent: 0, autoAlpha: 1 });
      items[0].classList.add("is-on");

      // Solo la voce a schermo è premibile: le altre sono fuori dalla finestra
      // e non devono intercettare il clic durante l'incrocio.
      const tl = gsap.timeline({ repeat: -1 });
      items.forEach((item, i) => {
        const next = items[(i + 1) % items.length];
        tl.to({}, { duration: 2.6 })
          .call(() => item.classList.remove("is-on"))
          .to(item, { yPercent: -110, autoAlpha: 0, duration: 0.5, ease: "power2.in" })
          .fromTo(
            next,
            { yPercent: 110, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.5,
              ease: "power2.out",
              onComplete: () => next.classList.add("is-on"),
            },
            "-=0.25",
          );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <p className="sb-nowbuild">
      <span className="sb-nowbuild-label">Currently building</span>
      <span className="sb-rot" ref={ref} data-no-i18n translate="no">
        {/* Fantasma che tiene la larghezza della voce più lunga */}
        <span className="sb-rot-sizer" aria-hidden="true">
          {LONGEST}
          <IcArrowUpRight size={13} />
        </span>
        {BUILDING.map((b) =>
          b.route ? (
            <SiteLink key={b.name} to={b.href} className="sb-rot-item">
              {b.name}
              <IcArrowUpRight size={13} />
            </SiteLink>
          ) : (
            <a
              key={b.name}
              href={b.href}
              target="_blank"
              rel="noreferrer noopener"
              className="sb-rot-item"
            >
              {b.name}
              <IcArrowUpRight size={13} />
            </a>
          ),
        )}
      </span>
    </p>
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
      <span className="sb-sheen" />
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
   Card "CAT" — carta millimetrata con radar che spazza e bussola che ruota
   ═══════════════════════════════════════════════════════════════════════════ */

export function BlueprintRadar() {
  return (
    <div className="sb-blueprint" aria-hidden="true">
      <span className="sb-blueprint-sweep" />
      <span className="sb-blueprint-needle">
        <IcCompass size={44} />
      </span>
      <svg className="sb-blueprint-dim" viewBox="0 0 300 116" fill="none" preserveAspectRatio="none">
        <path d="M24,96 H276" strokeWidth="1" />
        <path d="M24,90 V102M276,90 V102" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sezione open source — muro dei commit: le celle si accendono a ondate
   ═══════════════════════════════════════════════════════════════════════════ */

const WEEKS = 17;
const DAYS = 7;

export function ContribGraph() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOK()) return;

    const ctx = gsap.context(() => {
      // Le celle sono in ordine di colonna (grid-auto-flow: column): uno
      // stagger semplice basta perché l'onda attraversi il muro da sinistra.
      const cells = gsap.utils.toArray<HTMLElement>(".sb-cell", el);
      gsap.to(cells, {
        "--sb-heat": 1,
        duration: 0.5,
        stagger: 0.012,
        repeat: -1,
        yoyo: true,
        repeatDelay: 1.6,
        ease: "power1.inOut",
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Intensità pseudo-casuale ma stabile: stesso disegno a ogni render.
  const level = (i: number) => [0, 1, 1, 2, 0, 3, 2, 1, 4, 0, 2, 3, 1, 0][i % 14];

  return (
    <div className="sb-contrib" ref={ref} aria-hidden="true">
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
