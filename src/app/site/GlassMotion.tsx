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
//    lo scroll, così sotto ogni card passa colore diverso man mano che scendi.
// ② Tilt — la card si inclina verso il cursore e il rim si sposta di
//    conseguenza.
// ③ Pillola della nav — vedi useNavPill in fondo, che però NON è globale.
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

    // ── ③ Alone che segue il puntatore — solo sulle pagine interne ──────────
    // Sulla home l'alone ce l'hanno solo le sette card prodotti, avvolte una
    // per una dal componente React Bits (components/reactbits/SpotlightCard).
    // Sulle pagine interne i pannelli SONO il contenuto: avvolgerli tutti in
    // JSX, pagina per pagina, sarebbe stata un'impalcatura enorme per una cosa
    // che il puntatore risolve da solo. Stessa tecnica del componente — due
    // variabili CSS e il gradiente fermo nel foglio di stile (vedi
    // `.sb-home--fx .sb-panel::after` in home.css) — ma per delega, come il
    // tilt qui sopra e per le stesse ragioni.
    //
    // Acceso è sempre e solo UN pannello: quello sotto il cursore. Non è
    // l'alone che era stato tolto dalla home, che si accendeva su una card
    // dopo l'altra mentre scorrevi e ridisegnava gradienti grandi a ogni frame.
    mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      let frame = 0;
      let lit: HTMLElement | null = null;
      let clientX = 0;
      let clientY = 0;

      const clear = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.removeProperty("--spot-x");
        el.style.removeProperty("--spot-y");
      };

      const write = () => {
        frame = 0;
        if (!lit) return;
        const r = lit.getBoundingClientRect();
        lit.style.setProperty("--spot-x", `${clientX - r.left}px`);
        lit.style.setProperty("--spot-y", `${clientY - r.top}px`);
      };

      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        // closest() con un selettore composto: il pannello vale solo se sta
        // dentro una pagina che ha chiesto gli effetti (.sb-home--fx).
        const panel = target?.closest?.(".sb-home--fx .sb-panel") as HTMLElement | null;
        if (panel !== lit) {
          clear(lit);
          lit = panel;
        }
        if (!lit) return;
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
        lit = null;
      };
    });

    return () => mm.revert();
  }, []);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ Pillola della nav
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
