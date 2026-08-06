// ─────────────────────────────────────────────────────────────────────────────
// Movimento del vetro — globale, su OGNI pagina del sito.
//
// Le card sono lastre semitrasparenti (vedi i token --sb-glass-* in home.css).
// Una lastra però si legge come lastra solo se dietro c'è qualcosa che cambia:
// sfocare una tinta piatta dà esattamente lo stesso risultato di non sfocare
// niente. Qui vive quel "qualcosa che cambia", più le due interazioni che
// hanno bisogno del puntatore.
//
// ① Deriva del fondale — i due aloni (.sb-home::before/::after) slittano con
//    lo scroll e seguono da lontano il puntatore, così sotto ogni card passa
//    colore diverso man mano che scendi e la luce arriva da dove sei.
// ② Tilt — la card si inclina verso il cursore e il rim si sposta di
//    conseguenza.
// ③ Quello che il puntatore illumina — rim, alone, lucido del titolo.
// ④ I visual delle card — tre numeri (--vis-x/-y/-in) e nient'altro: sono i
//    visual stessi, in CSS, a farci quello che devono.
// ⑤ Pozza d'acqua sui quadratini dei commit (site/puddle.ts).
// ⑥ Pillola della nav — vedi useNavPill in fondo, che però NON è globale.
//
// Regole, le stesse di site/homeMotion.ts:
//  · un solo gsap.matchMedia() proprietario, revert() al dismount;
//  · niente split del testo traducibile (il motore i18n cammina sui nodi);
//  · solo transform e opacity — quello che era stato tolto dalla home, e per
//    cui era stato tolto, erano gradienti grandi ridisegnati a ogni frame.
//
// Niente ScrollTrigger per la deriva, per la stessa ragione per cui non lo usa
// site/ScrollProgress.tsx: le pagine sono lazy e cambiano altezza dopo il
// montaggio, quindi conviene rimisurare a ogni frame utile invece di fidarsi
// di una misura presa una volta e poi da rinfrescare a mano.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { attachPuddles } from "./puddle";

/** Quanto slittano gli aloni fra cima e fondo della pagina. Volutamente poco:
 *  è un cambio di luce dietro il vetro, non un fondale che scorre. */
const DRIFT_PX = 140;

/** Inclinazione massima della card, in gradi. Oltre i 5° la card smette di
 *  sembrare una lastra che si orienta e comincia a sembrare una pagina che si
 *  piega. */
const TILT_DEG = 5;

/** Cosa è "una card" per il tilt: gli stessi selettori che in home.css hanno
 *  già un hover, così non si inclina niente che non fosse già premibile. */
const TILTABLE = "a.sb-card, button.sb-card, .sb-page-card, .sb-story, .sb-panel--hover";

/** Quanto si spostano gli aloni del fondale dietro al puntatore, in percentuale
 *  del loro centro. Pochissimo e lentissimo (vedi PTR_LAG): è la luce della
 *  stanza che si accorge di te, non un riflettore che ti insegue. */
const PTR_SHIFT = 4;
const PTR_LAG = 1.2;

/** Riposo dei visual delle card: centro del riquadro, gesto spento. */
const VIS_REST = { x: 0.5, y: 0.5, on: 0 };

/** Dov'è arrivata la lettura, 0→1.
 *
 *  Non basta window.scrollY: su questo sito la pagina NON scorre nella
 *  finestra. index.html mette height:100% su html/body/#root e
 *  styles/index.css mette overflow-x:hidden su html e body — e overflow-x
 *  diverso da visible forza overflow-y a `auto`. Risultato: <body> diventa un
 *  contenitore di scorrimento suo, alto quanto la finestra, e il contenuto
 *  scorre DENTRO di lui. window.scrollY resta 0 per sempre.
 *
 *  Quindi leggo da chiunque si stia muovendo davvero, e ascolto lo scroll in
 *  fase di cattura: gli eventi di scroll di un elemento non risalgono, e
 *  quello di <body> non arriverebbe mai a window. */
function readProgress(): number {
  const d = document.documentElement;
  const b = document.body;
  const y = window.scrollY || d.scrollTop || b.scrollTop || 0;
  const max = Math.max(d.scrollHeight, b.scrollHeight) - window.innerHeight;
  return max > 0 ? gsap.utils.clamp(0, 1, y / max) : 0;
}

export default function GlassMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    // ── ① Deriva del fondale ────────────────────────────────────────────────
    // Scrive una sola variabile CSS sul <html>; i due pseudo la consumano
    // nella loro proprietà `translate`, che è separata da `transform` — dove
    // invece gira il respiro a keyframe. Due movimenti sullo stesso strato
    // senza che nessuno dei due sovrascriva l'altro.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const root = document.documentElement;
      const drift = { v: 0 };
      const driftTo = gsap.quickTo(drift, "v", {
        duration: 0.5,
        ease: "power2",
        onUpdate: () => root.style.setProperty("--sb-drift", `${drift.v}px`),
      });

      let frame = 0;
      const update = () => {
        frame = 0;
        // Con lo scroll bloccato (menu, modali) il body va in position:fixed:
        // la pagina "si accorcia" e il fondale schizzerebbe. Lo congelo.
        if (document.body.dataset.scrollLockY !== undefined) return;
        driftTo(readProgress() * DRIFT_PX);
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };

      update();
      // capture: true — vedi readProgress(). Lo scroll qui lo fa <body>, e il
      // suo evento non risale fino a window.
      document.addEventListener("scroll", schedule, { passive: true, capture: true });
      window.addEventListener("resize", schedule);

      return () => {
        if (frame) cancelAnimationFrame(frame);
        document.removeEventListener("scroll", schedule, { capture: true });
        window.removeEventListener("resize", schedule);
        gsap.killTweensOf(drift);
        root.style.removeProperty("--sb-drift");
      };
    });

    // ── ② Tilt ──────────────────────────────────────────────────────────────
    // Per delega su document, non un listener per pannello: i .sb-panel del
    // sito sono centinaia e su alcune pagine compaiono dopo (lazy). Così ce
    // n'è una manciata in tutto e le card nuove funzionano senza registrarsi.
    //
    // Il sollevamento di 3px all'hover, che in home.css stava sulla
    // transizione CSS, qui è dentro lo stesso tween: GSAP e CSS scriverebbero
    // tutti e due su `transform` e all'uscita la card sussulterebbe. La regola
    // CSS resta per il tocco (vedi il @media in home.css).
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      let panel: HTMLElement | null = null;
      let rotX: ((v: number) => void) | null = null;
      let rotY: ((v: number) => void) | null = null;
      const clamp = gsap.utils.clamp(-TILT_DEG, TILT_DEG);

      const release = () => {
        if (!panel) return;
        const leaving = panel;
        panel = null;
        rotX = null;
        rotY = null;
        gsap.to(leaving, {
          rotationX: 0,
          rotationY: 0,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          onComplete: () => {
            leaving.style.willChange = "";
          },
        });
      };

      const enter = (el: HTMLElement) => {
        panel = el;
        el.style.willChange = "transform";
        // transformPerspective sta sulla card stessa: mettere `perspective`
        // sul contenitore avrebbe voluto dire toccare il CSS di ogni griglia.
        gsap.set(el, { transformPerspective: 900, transformOrigin: "center center" });
        gsap.to(el, { y: -3, duration: 0.3, ease: "power3.out" });
        // rotationX/rotationY, non rotateX/rotateY: sono i nomi GSAP. Con i
        // nomi CSS il tween gira a vuoto — nessun errore, semplicemente la
        // card non si inclina.
        rotX = gsap.quickTo(el, "rotationX", { duration: 0.45, ease: "power3" });
        rotY = gsap.quickTo(el, "rotationY", { duration: 0.45, ease: "power3" });
      };

      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        const card = target?.closest?.(TILTABLE) as HTMLElement | null;
        // .sb-panel--hover è già lui il pannello; le card ce l'hanno dentro.
        const next = card
          ? (card.classList.contains("sb-panel")
              ? card
              : (card.querySelector(":scope > .sb-panel") as HTMLElement | null))
          : null;

        if (next !== panel) {
          release();
          if (next) enter(next);
        }
        if (!panel || !rotX || !rotY) return;

        const r = panel.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        // Il segno di rotateX è invertito: puntatore in basso = bordo basso
        // che si avvicina, cioè la lastra si orienta VERSO il cursore.
        rotX(clamp(-py * TILT_DEG));
        rotY(clamp(px * TILT_DEG));
      };

      document.addEventListener("pointermove", onMove, { passive: true });
      // Il puntatore può uscire dalla finestra senza passare da nessuna card.
      document.addEventListener("pointerleave", release);
      window.addEventListener("blur", release);
      // Scorrendo, la card sfila via da sotto un cursore fermo: senza questo
      // resterebbe inclinata a mezz'aria. In cattura, come sopra.
      document.addEventListener("scroll", release, { passive: true, capture: true });

      return () => {
        release();
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", release);
        window.removeEventListener("blur", release);
        document.removeEventListener("scroll", release, { capture: true });
      };
    });

    // ── ③ Quello che il puntatore illumina ─────────────────────────────────
    // Un solo pointermove delegato, una sola scrittura per frame, tre effetti
    // che escono dallo stesso calcolo:
    //
    //  · il RIM del vetro (tutti i .sb-panel del sito). Il bordo da 1px di
    //    .sb-panel è un gradiente, e finora il suo angolo era fisso a 160°:
    //    la luce arrivava sempre da in alto a sinistra, anche quando il
    //    puntatore era dall'altra parte. Adesso l'angolo lo scrive questo
    //    ciclo, e il lato illuminato è quello da cui arrivi. Costa una
    //    variabile CSS: il gradiente resta fermo nel foglio di stile.
    //  · l'ALONE (solo .sb-home--fx .sb-panel, cioè le pagine interne, dove i
    //    pannelli SONO il contenuto). Sulla home ce l'hanno già le sette card
    //    prodotti, avvolte una per una da components/reactbits/SpotlightCard:
    //    accenderlo anche qui vorrebbe dire dipingerlo due volte sulla stessa
    //    card. Acceso è sempre e solo UN pannello, quello sotto il cursore —
    //    non è l'alone tolto a suo tempo dalla home, che si accendeva su una
    //    card dopo l'altra mentre scorrevi.
    //  · la STRISCIA DI LUCE sul titolo della hero, via --gloss-x su <html>.
    //    Sta sulla radice e non sull'h1 apposta: così non serve cercare
    //    l'elemento a ogni frame, e l'eredità fa il resto. Stesso mestiere di
    //    --sb-drift qui sopra.
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const root = document.documentElement;
      let frame = 0;
      let lit: HTMLElement | null = null;
      let litGlows = false;
      let clientX = 0;
      let clientY = 0;

      const clear = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.removeProperty("--spot-x");
        el.style.removeProperty("--spot-y");
        el.style.removeProperty("--rim-angle");
      };

      const write = () => {
        frame = 0;
        root.style.setProperty("--gloss-x", `${(clientX / window.innerWidth) * 100}%`);
        if (!lit) return;
        const r = lit.getBoundingClientRect();
        // Angolo puntatore → centro, in gradi orari a partire dall'alto; +180
        // perché in un linear-gradient l'angolo è il verso in cui la sfumatura
        // VA, mentre il colore chiaro sta all'inizio: la luce è dietro.
        const deg = (Math.atan2(clientX - (r.left + r.width / 2), r.top + r.height / 2 - clientY) * 180) / Math.PI;
        lit.style.setProperty("--rim-angle", `${(deg + 540) % 360}deg`);
        if (!litGlows) return;
        lit.style.setProperty("--spot-x", `${clientX - r.left}px`);
        lit.style.setProperty("--spot-y", `${clientY - r.top}px`);
      };

      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        const panel = target?.closest?.(".sb-home .sb-panel") as HTMLElement | null;
        if (panel !== lit) {
          clear(lit);
          lit = panel;
          // Deciso una volta all'ingresso, non a ogni frame: l'alone è roba
          // delle sole pagine interne (vedi sopra).
          litGlows = !!panel?.closest(".sb-home--fx");
        }
        clientX = e.clientX;
        clientY = e.clientY;
        // Una scrittura per frame, non una per movimento del puntatore.
        if (!frame) frame = requestAnimationFrame(write);
      };

      document.addEventListener("pointermove", onMove, { passive: true });

      return () => {
        if (frame) cancelAnimationFrame(frame);
        document.removeEventListener("pointermove", onMove);
        clear(lit);
        root.style.removeProperty("--gloss-x");
        lit = null;
      };
    });

    // ── ④ I visual delle card ──────────────────────────────────────────────
    // Il motore di tutta la griglia prodotti. Prima ogni card si portava
    // dietro la sua timeline GSAP con repeat:-1 — sette filmini che giravano
    // uguali che ci fosse qualcuno a guardarli o no, sfasati fra loro, con la
    // griglia che pulsava da sette punti diversi insieme. Adesso c'è un solo
    // pointermove delegato che scrive TRE NUMERI sul riquadro sotto il
    // puntatore, e i visual — in CSS, da soli — ci fanno quello che devono:
    //
    //   --vis-x   dove sei nel riquadro, in orizzontale, 0→1
    //   --vis-y   idem in verticale, 0→1
    //   --vis-in  quanto il gesto è acceso, 0→1 (sale entrando, scende uscendo)
    //
    // Sei visual su sette non hanno una riga di JS: la tendina chiaro/scuro, la
    // digitazione del terminale, la lente del diff, i blocchi del browser, i
    // fili del grafo, il sollevamento del cubo sono tutti calc() su questi due
    // numeri. Il settimo (l'HUD di gioco) conta punti, e il CSS non sa contare.
    //
    // Perché i quickTo e non la scrittura diretta: una var CSS non registrata
    // con @property non transiziona: uscendo dalla card il gesto tornerebbe a
    // riposo di scatto. Tweenando l'oggetto di stato invece della var, la
    // curva ce l'ha il numero — stesso mestiere di driftTo al blocco ①.
    //
    // Qui la media query è solo prefers-reduced-motion, e il tipo di puntatore
    // si guarda dentro: fine e grossolano condividono lo stesso writer e lo
    // stesso stato, e due mm.add() separati avrebbero voluto dire due
    // proprietari della stessa variabile.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const root = document.documentElement;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      type Vis = typeof VIS_REST;
      const set = (el: HTMLElement, s: Vis) => {
        el.style.setProperty("--vis-x", `${s.x}`);
        el.style.setProperty("--vis-y", `${s.y}`);
        el.style.setProperty("--vis-in", `${s.on}`);
      };
      const clear = (el: HTMLElement) => {
        el.style.removeProperty("--vis-x");
        el.style.removeProperty("--vis-y");
        el.style.removeProperty("--vis-in");
      };

      let vis: HTMLElement | null = null;
      const st = { ...VIS_REST };
      const write = () => {
        if (vis) set(vis, st);
      };
      // Durate diverse per un motivo: la posizione deve sembrare la TUA mano
      // (0.22s è quel poco che toglie il tremolio senza far sentire il
      // ritardo), l'accensione è una dissolvenza e può prendersi il suo tempo.
      const xTo = gsap.quickTo(st, "x", { duration: 0.22, ease: "power2", onUpdate: write });
      const yTo = gsap.quickTo(st, "y", { duration: 0.22, ease: "power2", onUpdate: write });
      const onTo = gsap.quickTo(st, "on", { duration: 0.45, ease: "power2", onUpdate: write });

      // ── Il riquadro che si sta spegnendo ─────────────────────────────────
      // Sta su un oggetto SUO e non su `st`: passando veloci da una card
      // all'altra, l'ingresso nella card nuova fa killTweensOf(st) e la
      // dissolvenza della vecchia morirebbe a metà strada, lasciandole le
      // variabili addosso per sempre — cioè un gesto acceso su una card che
      // nessuno sta guardando. Così invece la dissolvenza è intoccabile, e
      // ce n'è al massimo una per volta.
      let outEl: HTMLElement | null = null;
      let outTw: gsap.core.Tween | null = null;
      const endOut = () => {
        outTw?.kill();
        outTw = null;
        if (outEl) clear(outEl);
        outEl = null;
      };

      /** Spegne il riquadro che si sta lasciando e gli toglie le var di dosso,
       *  così torna a valere il riposo scritto in home.css. */
      const release = () => {
        if (!vis) return;
        endOut();
        const leaving = vis;
        vis = null;
        gsap.killTweensOf(st);
        const out: Vis = { ...st };
        outEl = leaving;
        outTw = gsap.to(out, {
          ...VIS_REST,
          duration: 0.55,
          ease: "power3.out",
          onUpdate: () => set(leaving, out),
          onComplete: endOut,
        });
      };

      /** Posizione del puntatore dentro il riquadro, 0→1 per lato. */
      const at = (el: HTMLElement, cx: number, cy: number) => {
        const r = el.getBoundingClientRect();
        return {
          x: gsap.utils.clamp(0, 1, (cx - r.left) / (r.width || 1)),
          y: gsap.utils.clamp(0, 1, (cy - r.top) / (r.height || 1)),
        };
      };

      // ── Puntatore fine: il gesto lo tieni in mano ────────────────────────
      const ptr = { x: 0.5, y: 0.5 };
      const ptrTo = {
        x: gsap.quickTo(ptr, "x", {
          duration: PTR_LAG,
          ease: "power2",
          onUpdate: () => root.style.setProperty("--sb-px", `${(ptr.x - 0.5) * PTR_SHIFT}%`),
        }),
        y: gsap.quickTo(ptr, "y", {
          duration: PTR_LAG,
          ease: "power2",
          onUpdate: () => root.style.setProperty("--sb-py", `${(ptr.y - 0.5) * PTR_SHIFT}%`),
        }),
      };

      /** Prende in carico un riquadro, partendo da dove ci sei entrato. */
      const enter = (el: HTMLElement, s: Partial<Vis>) => {
        // Rientrando in un riquadro che si stava ancora spegnendo, la sua
        // dissolvenza e il writer scriverebbero le stesse var a due mani.
        if (outEl === el) endOut();
        vis = el;
        gsap.killTweensOf(st);
        Object.assign(st, VIS_REST, s);
        write();
      };

      const onMove = (e: PointerEvent) => {
        // Gli aloni del fondale seguono il puntatore ovunque sia, anche fuori
        // dalle card: è il pezzo che ha preso il posto delle due keyframe da
        // 74 e 91 secondi che derivavano a orologio.
        ptrTo.x(e.clientX / window.innerWidth);
        ptrTo.y(e.clientY / window.innerHeight);

        const next = (e.target as HTMLElement | null)?.closest?.(".sb-card-visual") as HTMLElement | null;
        if (next !== vis) {
          release();
          if (!next) return;
          // Il gesto parte da dove sei entrato, non dal centro: entrando da
          // destra la tendina non deve prima saltare a metà.
          enter(next, at(next, e.clientX, e.clientY));
          onTo(1);
          return;
        }
        if (!vis) return;
        const p = at(vis, e.clientX, e.clientY);
        xTo(p.x);
        yTo(p.y);
      };

      // ── Puntatore grossolano: il tocco fa una passata sola ───────────────
      // Le card sono <Link>: senza questo il tocco navigherebbe e il gesto non
      // si vedrebbe mai. Il riquadro del visual si mangia il tocco (è
      // aria-hidden e decorativo), il resto della card resta il link.
      const onTap = (e: MouseEvent) => {
        const el = (e.target as HTMLElement | null)?.closest?.(".sb-card-visual") as HTMLElement | null;
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        release();
        enter(el, { x: 0, y: 0, on: 0 });
        // Una passata da un capo all'altro e ritorno al riposo: è il gesto
        // intero, eseguito una volta, senza che nessun timer lo ripeta.
        gsap
          .timeline({ onComplete: release })
          .to(st, { on: 1, duration: 0.3, ease: "power2.out", onUpdate: write })
          .to(st, { x: 1, y: 1, duration: 1.15, ease: "power2.inOut", onUpdate: write }, 0)
          .to({}, { duration: 0.45 });
      };

      if (fine) document.addEventListener("pointermove", onMove, { passive: true });
      else document.addEventListener("click", onTap, { capture: true });
      document.addEventListener("pointerleave", release);
      window.addEventListener("blur", release);
      // La card sfila via da sotto un cursore fermo mentre si scorre: senza
      // questo il gesto resterebbe acceso a mezz'aria. In cattura, come sopra.
      document.addEventListener("scroll", release, { passive: true, capture: true });

      return () => {
        gsap.killTweensOf(st);
        gsap.killTweensOf(ptr);
        endOut();
        if (vis) {
          clear(vis);
          vis = null;
        }
        root.style.removeProperty("--sb-px");
        root.style.removeProperty("--sb-py");
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("click", onTap, { capture: true });
        document.removeEventListener("pointerleave", release);
        window.removeEventListener("blur", release);
        document.removeEventListener("scroll", release, { capture: true });
      };
    });

    // ── ⑤ Pozza d'acqua sui quadratini ─────────────────────────────────────
    // Vive tutta in site/puddle.ts; qui c'è solo il cancello. Si aggancia da
    // sé ai [data-puddle] presenti e a quelli che arrivano dopo (il grafico
    // del footer nasce da una fetch).
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () =>
      attachPuddles(),
    );

    return () => mm.revert();
  }, []);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ Pillola della nav
//
// Questa NON è globale: `.sb-nav-link` esiste solo nella nav della home, e
// legarla al ciclo di vita di App le fa trovare il DOM già montato senza
// bisogno di stare a sorvegliare i cambi di rotta.
//
// La pillola scivola sotto la voce puntata; tolto il puntatore torna sulla
// sezione che si sta guardando. Si muove su translate3d + scaleX, mai su
// `left`/`width`: sono due proprietà che rifanno il layout a ogni frame.
// ─────────────────────────────────────────────────────────────────────────────
export function useNavPill(navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const pill = nav.querySelector<HTMLElement>(".sb-nav-pill");
    if (!pill) return;

    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>(".sb-nav-link"));
    if (!links.length) return;

    // La larghezza di riposo della pillola in CSS: scaleX lavora su questa.
    const BASE_W = 100;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.classList.add("sb-nav-links--pill");

    let current: HTMLElement | null = null;
    let hovered: HTMLElement | null = null;
    let active: HTMLElement | null = null;

    const place = (el: HTMLElement | null, animate: boolean) => {
      if (!el) {
        current = null;
        pill.classList.remove("sb-nav-pill--on");
        return;
      }
      if (el === current) return;
      current = el;
      const navBox = nav.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const to = {
        x: box.left - navBox.left,
        scaleX: box.width / BASE_W,
        height: box.height,
      };
      pill.style.height = `${to.height}px`;
      pill.style.marginTop = `${-to.height / 2}px`;
      pill.classList.add("sb-nav-pill--on");
      if (animate && smooth) {
        gsap.to(pill, { x: to.x, scaleX: to.scaleX, duration: 0.42, ease: "power3.out" });
      } else {
        gsap.set(pill, { x: to.x, scaleX: to.scaleX });
      }
    };

    const sync = (animate = true) => place(hovered ?? active, animate);

    const onOver = (e: PointerEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.(".sb-nav-link") as HTMLElement | null;
      if (link && links.includes(link as HTMLAnchorElement)) {
        hovered = link;
        sync();
      }
    };
    const onOut = () => {
      hovered = null;
      sync();
    };

    nav.addEventListener("pointerover", onOver);
    nav.addEventListener("pointerleave", onOut);

    // ── Scrollspy ──────────────────────────────────────────────────────────
    // Quale sezione si sta guardando. rootMargin taglia via la fascia alta
    // (sotto la nav sticky) e i due terzi bassi: così la sezione "attiva" è
    // quella che occupa la parte alta della finestra, non l'ultima entrata di
    // un pixel dal fondo.
    const targets = links
      .map((l) => {
        const href = l.getAttribute("href") || "";
        if (!href.startsWith("#")) return null;
        const el = document.getElementById(href.slice(1));
        return el ? { link: l, el } : null;
      })
      .filter((x): x is { link: HTMLAnchorElement; el: HTMLElement } => x !== null);

    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        const hit = targets.find((t) => visible.has(t.el));
        const next = hit?.link ?? null;
        if (next !== active) {
          active = next;
          links.forEach((l) => {
            if (l === active) l.setAttribute("aria-current", "location");
            else l.removeAttribute("aria-current");
          });
          sync();
        }
      },
      { rootMargin: "-64px 0px -66% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t.el));

    // La nav si riflow-a quando cambia lingua (le voci cambiano larghezza) o
    // quando la finestra cambia misura: la pillola va rimessa in bolla.
    const remeasure = () => {
      current = null;
      sync(false);
    };
    window.addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(nav);

    return () => {
      nav.classList.remove("sb-nav-links--pill");
      nav.removeEventListener("pointerover", onOver);
      nav.removeEventListener("pointerleave", onOut);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      io.disconnect();
      links.forEach((l) => l.removeAttribute("aria-current"));
      gsap.killTweensOf(pill);
    };
  }, [navRef]);
}
