// ─────────────────────────────────────────────────────────────────────────────
// Regia del movimento della home — GSAP.
//
// Tutto quello che ha bisogno di ORCHESTRAZIONE (sequenze, scroll, puntatore)
// sta qui; i loop puramente decorativi restano in CSS (vedi home.css), così
// girano anche se il JS arriva tardi e non hanno cleanup da gestire.
//
// Regole:
//  · niente split del testo traducibile — il motore i18n cammina sui nodi di
//    testo e trovarsi degli <span> per lettera lo manderebbe fuori strada;
//  · tutto dentro gsap.context(), revert() al dismount (niente doppioni);
//  · gsap.matchMedia() per il rispetto di prefers-reduced-motion e per gli
//    effetti che hanno senso solo col puntatore (hover: hover).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Elementi che entrano in scena scorrendo: selettore → parametri del reveal. */
const REVEALS: { sel: string; y?: number; stagger?: number; scale?: number }[] = [
  { sel: ".sb-hero-copy p", y: 18, stagger: 0.08 },
  { sel: ".sb-hero-actions", y: 14 },
  { sel: ".sb-card", y: 26, stagger: 0.06, scale: 0.985 },
  { sel: ".sb-prodfoot-tag", y: 16 },
  { sel: ".sb-trusted-label", y: 10 },
  { sel: ".sb-trusted a", y: 12, stagger: 0.1 },
  { sel: ".sb-sechead", y: 22 },
  { sel: ".sb-tabs", y: 14 },
  { sel: ".sb-arch-frame", y: 30, scale: 0.99 },
  { sel: ".sb-stack-grid > *", y: 26, stagger: 0.1 },
  { sel: ".sb-splithead", y: 20 },
  { sel: ".sb-page-card", y: 22, stagger: 0.05 },
  { sel: ".sb-story", y: 22, stagger: 0.06 },
  { sel: ".sb-cv-actions", y: 14 },
  { sel: ".sb-wall-card", y: 24, stagger: 0.04 },
  { sel: ".sb-open > *", y: 26, stagger: 0.12 },
  { sel: ".sb-cta h2", y: 20 },
  { sel: ".sb-cta p", y: 16 },
  { sel: ".sb-cta-actions", y: 14 },
];

export function useHomeMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    // Un solo proprietario di tutto: gsap.matchMedia(). Ogni blocco si monta
    // e si smonta con la sua media query, e mm.revert() al dismount ripulisce
    // tween, ScrollTrigger e stili inline in un colpo solo.
    const mm = gsap.matchMedia(scope);

    {
      // Il filo di avanzamento della lettura non sta qui: è globale, su ogni
      // pagina del sito — vedi site/ScrollProgress.tsx, montato in main.tsx.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ── ① Entrata della hero, in cascata ──────────────────────────────
        const intro = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
        intro
          .from(".sb-live", { autoAlpha: 0, y: -10, duration: 0.6 })
          .from(".sb-hero-title span", { autoAlpha: 0, y: 26, stagger: 0.09 }, "-=0.35")
          .from(".sb-hero-copy p", { autoAlpha: 0, y: 16, stagger: 0.08 }, "-=0.55")
          .from(".sb-hero-actions > *", { autoAlpha: 0, y: 12, stagger: 0.08 }, "-=0.5");

        // ── ② Reveal allo scroll ──────────────────────────────────────────
        // La hero è già animata dall'intro: la si esclude dai trigger.
        REVEALS.forEach(({ sel, y = 20, stagger = 0, scale }) => {
          const items = gsap.utils.toArray<HTMLElement>(sel, scope).filter((el) => !el.closest(".sb-hero"));
          if (!items.length) return;
          ScrollTrigger.batch(items, {
            start: "top 88%",
            once: true,
            onEnter: (batch) =>
              gsap.from(batch, {
                autoAlpha: 0,
                y,
                scale,
                duration: 0.75,
                ease: "power3.out",
                stagger,
                overwrite: true,
              }),
          });
        });

        // ── ③ Contatori: i numeri si "accendono" arrivando a vista ────────
        // Il footer ha una regia sua (site/footMotion.ts): i suoi contatori
        // restano fuori da qui, o partirebbero due volte sulla home.
        const counters = gsap.utils
          .toArray<HTMLElement>("[data-count-to]", scope)
          .filter((el) => !el.closest(".sb-foot"));
        counters.forEach((el) => {
          const to = Number(el.dataset.countTo || 0);
          const suffix = el.dataset.countSuffix || "";
          const num = { v: 0 };
          ScrollTrigger.create({
            trigger: el,
            start: "top 92%",
            once: true,
            onEnter: () =>
              gsap.to(num, {
                v: to,
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = Math.round(num.v).toLocaleString("it-IT") + suffix;
                },
              }),
          });
        });

        return () => {
          intro.kill();
        };
      });

      // ── ④ Riflesso che segue il mouse sui pannelli ──────────────────────
      //     Due variabili CSS (--sb-mx/--sb-my) guidano un alone radiale e il
      //     "vetro" del bordo: il pannello sembra illuminato da una lampada.
      mm.add("(hover: hover) and (pointer: fine)", () => {
        // L'archivio incorporato resta fuori: è un'interfaccia densa, con menù
        // e anteprime — un alone che ci passa sopra darebbe solo fastidio.
        // Fuori anche il footer: lì comanda footMotion, su ogni pagina.
        const panels = gsap.utils
          .toArray<HTMLElement>(".sb-panel", scope)
          .filter((p) => !p.closest(".sb-arch-frame") && !p.closest(".sb-foot"));
        const cleanups: (() => void)[] = [];

        panels.forEach((panel) => {
          const setX = gsap.quickSetter(panel, "--sb-mx", "px");
          const setY = gsap.quickSetter(panel, "--sb-my", "px");

          const move = (e: PointerEvent) => {
            const r = panel.getBoundingClientRect();
            setX(e.clientX - r.left);
            setY(e.clientY - r.top);
          };
          const enter = () => gsap.to(panel, { "--sb-spot": 1, duration: 0.35, ease: "power2.out" });
          const leave = () => gsap.to(panel, { "--sb-spot": 0, duration: 0.5, ease: "power2.out" });

          panel.addEventListener("pointermove", move);
          panel.addEventListener("pointerenter", enter);
          panel.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            panel.removeEventListener("pointermove", move);
            panel.removeEventListener("pointerenter", enter);
            panel.removeEventListener("pointerleave", leave);
          });
        });

        // ── ⑤ Bottoni "magnetici": si sporgono verso il cursore ───────────
        //     Spostamento limitato a pochi pixel: deve sembrare attrazione,
        //     non un bersaglio che scappa quando provi a cliccarlo.
        const magnets = gsap.utils
          .toArray<HTMLElement>(".sb-btn--primary, .sb-tech", scope)
          .filter((btn) => !btn.closest(".sb-foot"));
        magnets.forEach((btn) => {
          const xTo = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3" });
          const clamp = gsap.utils.clamp(-7, 7);

          const move = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            xTo(clamp((e.clientX - (r.left + r.width / 2)) * 0.3));
            yTo(clamp((e.clientY - (r.top + r.height / 2)) * 0.45));
          };
          const leave = () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
          };

          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerleave", leave);
          });
        });

        // ── ⑥ Alone della hero che insegue il puntatore, con inerzia ──────
        const hero = scope.querySelector<HTMLElement>(".sb-hero");
        if (hero) {
          const pos = { x: 50, y: 40 };
          const setHx = gsap.quickSetter(hero, "--sb-hx", "%");
          const setHy = gsap.quickSetter(hero, "--sb-hy", "%");
          const xTo = gsap.quickTo(pos, "x", { duration: 0.9, ease: "power3", onUpdate: () => setHx(pos.x) });
          const yTo = gsap.quickTo(pos, "y", { duration: 0.9, ease: "power3", onUpdate: () => setHy(pos.y) });
          const move = (e: PointerEvent) => {
            const r = hero.getBoundingClientRect();
            xTo(((e.clientX - r.left) / r.width) * 100);
            yTo(((e.clientY - r.top) / r.height) * 100);
          };
          hero.addEventListener("pointermove", move);
          cleanups.push(() => hero.removeEventListener("pointermove", move));
        }

        return () => cleanups.forEach((fn) => fn());
      });
    }

    // Le sezioni lazy (archivio incorporato) cambiano l'altezza dopo il
    // montaggio: ricalcolo i trigger una volta assestato il layout.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 600);

    return () => {
      clearTimeout(refresh);
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
