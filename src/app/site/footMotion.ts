// ─────────────────────────────────────────────────────────────────────────────
// Regia del movimento del FOOTER — GSAP.
//
// Il footer vive su ogni pagina del sito (non solo sulla home), quindi ha una
// regia sua: homeMotion arriva solo dove c'è la home, qui invece serve che le
// card si accendano anche in fondo a Trivia, PCTO, Archivio…
//
// Stesse regole di homeMotion:
//  · tutto dentro gsap.matchMedia(), revert() al dismount (niente doppioni);
//  · prefers-reduced-motion spegne ogni movimento autonomo;
//  · gli effetti da puntatore si montano solo con (hover: hover).
//
// Nota: sulla home il footer sta DENTRO lo scope di homeMotion; là i magneti e
// i contatori del footer sono esclusi a mano (vedi homeMotion.ts), così a
// comandare è sempre e solo questo file.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Spostamento massimo (px) di un elemento magnetico verso il puntatore. */
const MAGNET = 7;

/** Elementi che si sporgono verso il cursore: card, icone social, pulsanti. */
const MAGNETS = ".sb-foot-social a, .sb-foot-links .apl-open, .sb-foot-links .apw-open, .sb-gh__chip";

export function useFootMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const mm = gsap.matchMedia(scope);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // I trigger creati FUORI dalla matchMedia non li ripulisce mm.revert():
    // li tengo qui e li uccido a mano al dismount.
    const triggers: ScrollTrigger[] = [];

    // L'avanzamento della lettura NON si misura più quaggiù: cresceva sul filo
    // del footer, cioè si vedeva solo una volta arrivati in fondo — quando non
    // serviva più a niente. Adesso sta in cima alla finestra, su ogni pagina:
    // vedi site/ScrollProgress.tsx, montato una volta in main.tsx.

    // ── ① Contatori: il numero dei commit parte quando arriva a vista ──────
    //     Il widget GitHub arriva dalla rete DOPO il montaggio: un osservatore
    //     aspetta che il numero compaia nel DOM e solo allora lo arma.
    const armed = new WeakSet<HTMLElement>();
    let observer: MutationObserver | null = null;

    if (!reduced) {
      const arm = (el: HTMLElement) => {
        if (armed.has(el)) return;
        armed.add(el);
        const to = Number(el.dataset.countTo || 0);
        if (!to) return;
        const suffix = el.dataset.countSuffix || "";
        const num = { v: 0 };
        el.textContent = "0" + suffix;

        const run = () =>
          gsap.to(num, {
            v: to,
            duration: 1.5,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(num.v).toLocaleString("it-IT") + suffix;
            },
          });

        // I dati del widget arrivano dalla rete: quando compaiono, il footer
        // può essere GIÀ sotto gli occhi (pagine corte, oppure sei lì fermo).
        // In quel caso si parte subito, senza aspettare uno scroll che non
        // arriverà mai; altrimenti si aspetta l'ingresso in scena.
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.98 && r.bottom > 0) {
          run();
          return;
        }
        triggers.push(ScrollTrigger.create({ trigger: el, start: "top 98%", once: true, onEnter: run }));
      };

      const scan = () => gsap.utils.toArray<HTMLElement>("[data-count-to]", scope).forEach(arm);
      scan();
      observer = new MutationObserver(scan);
      observer.observe(scope, { childList: true, subtree: true });
    }

    // Nemmeno qui c'è più l'entrata in cascata delle card: arrivando in fondo
    // il footer si ricomponeva pezzo per pezzo da opacità 0, la stessa
    // dissolvenza chiara che sulla home faceva sembrare lo scroll a scatti.

    mm.add("(hover: hover) and (pointer: fine)", () => {
      const cleanups: (() => void)[] = [];

      // Qui NON ci sono più il riflesso che seguiva il puntatore sulle card né
      // il lampo in diagonale all'ingresso: scorrendo, il cursore attraversa
      // una card dopo l'altra e ognuna si accendeva sotto di lui. Restano i
      // magneti, che rispondono al gesto e non allo scroll.

      // ── ③ Magneti: un solo ascoltatore sul footer ────────────────────────
      //     Delega invece di un listener per elemento: le chip del widget
      //     GitHub arrivano dalla rete DOPO il montaggio e diventano
      //     magnetiche anche loro, senza doversi ricordare di riagganciarle.
      //
      //     Magnete: massimo 7 px e ritorno elastico — attrazione, non un
      //     bersaglio che scappa quando provi a cliccarlo.
      const clamp = gsap.utils.clamp(-MAGNET, MAGNET);
      const pulls = new WeakMap<HTMLElement, { x: (v: number) => void; y: (v: number) => void }>();
      let held: HTMLElement | null = null;

      const release = (el: HTMLElement) => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.45)" });
      };
      const pull = (el: HTMLElement, e: PointerEvent) => {
        let q = pulls.get(el);
        if (!q) {
          q = {
            x: gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" }),
            y: gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" }),
          };
          pulls.set(el, q);
        }
        const r = el.getBoundingClientRect();
        q.x(clamp((e.clientX - (r.left + r.width / 2)) * 0.35));
        q.y(clamp((e.clientY - (r.top + r.height / 2)) * 0.5));
      };

      const onMove = (e: PointerEvent) => {
        const el = (e.target as Element | null)?.closest<HTMLElement>(MAGNETS) ?? null;
        if (held && held !== el) release(held);
        held = el;
        if (el) pull(el, e);
      };
      const onLeave = () => {
        if (held) release(held);
        held = null;
      };

      scope.addEventListener("pointermove", onMove);
      scope.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        scope.removeEventListener("pointermove", onMove);
        scope.removeEventListener("pointerleave", onLeave);
        if (held) release(held);
      });

      return () => cleanups.forEach((fn) => fn());
    });

    // Il widget GitHub cambia l'altezza del footer quando arrivano i dati.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 800);

    return () => {
      clearTimeout(refresh);
      observer?.disconnect();
      triggers.forEach((t) => t.kill());
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
