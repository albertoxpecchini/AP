// ─────────────────────────────────────────────────────────────────────────────
// Regia del movimento del FOOTER — GSAP.
//
// Il footer vive su ogni pagina del sito (non solo sulla home), quindi ha una
// regia sua: homeMotion arriva solo dove c'è la home, qui invece serve che le
// card si accendano anche in fondo a Trivia, PCTO, Archivio…
//
// Stesse regole di homeMotion:
//  · tutto dentro gsap.matchMedia(), revert() al dismount (niente doppioni);
//  · prefers-reduced-motion spegne ogni movimento autonomo — resta solo la
//    barra di avanzamento, che è informazione e la muove lo scroll dell'utente;
//  · gli effetti da puntatore si montano solo con (hover: hover).
//
// Nota: sulla home il footer sta DENTRO lo scope di homeMotion; là i pannelli,
// i magneti e i contatori del footer sono esclusi a mano (vedi homeMotion.ts),
// così a comandare è sempre e solo questo file.
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

    // ── ① Barra di avanzamento verde/ciano sul filo del footer ─────────────
    //     Cresce da sinistra man mano che il footer entra in scena: dice
    //     "sei arrivato in fondo" senza scrivere niente. Sta fuori dalla
    //     matchMedia del movimento perché è informazione, non decorazione:
    //     la muove lo scroll, quindi vale anche con prefers-reduced-motion
    //     (senza scrub morbido, così non c'è inerzia).
    const prog = scope.querySelector<HTMLElement>(".sb-foot-prog");
    if (prog) {
      gsap.set(prog, { scaleX: 0, transformOrigin: "left center" });
      triggers.push(
        ScrollTrigger.create({
          trigger: scope,
          start: "top bottom",
          end: "bottom bottom",
          scrub: reduced ? true : 0.35,
          animation: gsap.to(prog, { scaleX: 1, ease: "none" }),
        }),
      );
    }

    // ── ② Contatori: il numero dei commit parte quando arriva a vista ──────
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

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // ── ③ Entrata in cascata: le card del footer sfalsate di 60 ms ───────
      const blocks: { sel: string; y: number; stagger: number }[] = [
        { sel: ".sb-foot-card", y: 26, stagger: 0.06 },
        { sel: ".sb-foot-bottom > *", y: 12, stagger: 0.06 },
      ];
      blocks.forEach(({ sel, y, stagger }) => {
        const items = gsap.utils.toArray<HTMLElement>(sel, scope);
        if (!items.length) return;
        ScrollTrigger.batch(items, {
          start: "top 96%",
          once: true,
          onEnter: (batch) =>
            gsap.from(batch, {
              autoAlpha: 0,
              y,
              duration: 0.7,
              ease: "power3.out",
              stagger,
              overwrite: true,
            }),
        });
      });

      // ── ④ LOOP · filo di luce sul bordo alto + respiro dell'alone ────────
      //     Due cicli lenti e sfasati: il footer non è mai del tutto immobile,
      //     ma nemmeno mai appariscente. Il filo passa ogni ~9 s.
      const beam = scope.querySelector<HTMLElement>(".sb-foot-beam");
      const loops: gsap.core.Tween[] = [];
      if (beam) {
        loops.push(
          gsap.fromTo(
            beam,
            { xPercent: -120 },
            {
              xPercent: 500,
              duration: 3.4,
              ease: "power1.inOut",
              repeat: -1,
              repeatDelay: 5.6,
            },
          ),
        );
      }
      loops.push(
        gsap.to(scope, {
          "--sb-aura": 0.8,
          duration: 4.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        }),
      );

      return () => loops.forEach((t) => t.kill());
    });

    mm.add("(hover: hover) and (pointer: fine)", () => {
      const cleanups: (() => void)[] = [];

      // ── ⑤ Riflesso sul bordo + alone dentro la card, sotto il puntatore ──
      //     Le stesse due variabili dei pannelli della home (--sb-mx/--sb-my)
      //     più --sb-spot per l'intensità: le legge il CSS di .sb-panel.
      gsap.utils.toArray<HTMLElement>(".sb-foot-card .sb-panel", scope).forEach((panel) => {
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

      // ── ⑥ Lampo in diagonale all'ingresso nella card ─────────────────────
      //     Il lampo è un elemento vero (non una ::before) perché qui lo
      //     comanda GSAP: così non riparte a metà se rientri di corsa.
      gsap.utils.toArray<HTMLElement>(".sb-foot-card", scope).forEach((card) => {
        const flash = card.querySelector<HTMLElement>(".sb-foot-flash");
        if (!flash) return;
        const enter = () => {
          gsap.killTweensOf(flash);
          gsap.fromTo(
            flash,
            { xPercent: -140, opacity: 0 },
            {
              xPercent: 140,
              opacity: 1,
              duration: 0.85,
              ease: "power2.out",
              onComplete: () => gsap.set(flash, { opacity: 0 }),
            },
          );
        };
        card.addEventListener("pointerenter", enter);
        cleanups.push(() => card.removeEventListener("pointerenter", enter));
      });

      // ── ⑦ Magneti + ⑧ alone ambientale: un solo ascoltatore sul footer ───
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

      //     Alone: come quello della hero, ma sul footer intero — la lampada
      //     resta indietro rispetto al mouse e lo raggiunge con calma.
      const pos = { x: 50, y: 0 };
      const setFx = gsap.quickSetter(scope, "--sb-fx", "%");
      const setFy = gsap.quickSetter(scope, "--sb-fy", "%");
      const auraX = gsap.quickTo(pos, "x", { duration: 1, ease: "power3", onUpdate: () => setFx(pos.x) });
      const auraY = gsap.quickTo(pos, "y", { duration: 1, ease: "power3", onUpdate: () => setFy(pos.y) });

      const onMove = (e: PointerEvent) => {
        const r = scope.getBoundingClientRect();
        auraX(((e.clientX - r.left) / r.width) * 100);
        auraY(((e.clientY - r.top) / r.height) * 100);

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
      if (prog) gsap.killTweensOf(prog);
      mm.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
