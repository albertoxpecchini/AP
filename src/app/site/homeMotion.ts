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

// Qui NON c'è nessun reveal allo scroll. Ogni blocco entrava in scena da
// opacità 0 salendo di una ventina di pixel: scendendo piano si vedeva la
// pagina "ricaricarsi" un blocco alla volta, con quella dissolvenza chiara che
// faceva sembrare lo scroll a scatti. Il contenuto adesso c'è e basta —
// scorrere una pagina non è un evento da annunciare.

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
          .from(".sb-hero-title span", { autoAlpha: 0, y: 26, stagger: 0.09 })
          .from(".sb-hero-copy p", { autoAlpha: 0, y: 16, stagger: 0.08 }, "-=0.55")
          .from(".sb-hero-stats li", { autoAlpha: 0, y: 12, stagger: 0.07 }, "-=0.45")
          .from(".sb-hero-actions > *", { autoAlpha: 0, y: 12, stagger: 0.08 }, "-=0.5");

        // ── ② Contatori: i numeri si "accendono" arrivando a vista ────────
        // Il footer resta fuori: i suoi numeri non li muove più GSAP ma una
        // keyframe CSS su timeline di scroll (site/foot.css), e due registi
        // sullo stesso elemento si contenderebbero il textContent.
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

        // ── ③ Le sei tavole della griglia: il gesto, UNA volta, a vista ────
        // Il gesto di ogni tavola parte al passaggio del puntatore (home.css,
        // «Il gesto parte al passaggio»), e va bene finché un puntatore c'è.
        // Su un telefono non c'è: la griglia è la prima cosa che si incontra
        // scendendo, e restava sei disegni fermi per sempre.
        //
        // Qui la tavola si gioca il suo gesto una volta sola, quando entra in
        // scena, e poi torna ferma. Non è il reveal allo scroll che questa
        // pagina non vuole — il disegno c'è già, intero, e non compare: è la
        // stessa regola dei contatori qui sopra, che partono da zero arrivando
        // a vista perché quello è il momento in cui qualcuno li guarda.
        //
        // Il come: un attributo sulla card, che in home.css accende gli stessi
        // animation-name dell'hover, e che si toglie da sé quando il gesto è
        // finito — se restasse, l'hover non potrebbe più farlo ripartire.
        const GESTO = 3600;
        const timers: number[] = [];
        gsap.utils.toArray<HTMLElement>(".sb-products .sb-card", scope).forEach((card) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top 88%",
            once: true,
            onEnter: () => {
              card.dataset.play = "";
              timers.push(window.setTimeout(() => delete card.dataset.play, GESTO));
            },
          });
        });

        return () => {
          intro.kill();
          timers.forEach(clearTimeout);
        };
      });

      // ── ④ Bottoni "magnetici": si sporgono verso il cursore ─────────────
      //     Spostamento limitato a pochi pixel: deve sembrare attrazione,
      //     non un bersaglio che scappa quando provi a cliccarlo.
      //
      //     Il riflesso sui pannelli non sta qui: è delegato e globale, una
      //     scrittura per frame su UN pannello solo (site/GlassMotion.tsx ③).
      //     Quello che era stato tolto — e che non torna — era l'alone che si
      //     accendeva su una card dopo l'altra mentre scorrevi, ridisegnando
      //     gradienti grandi quanto la card a ogni movimento del mouse.
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const cleanups: (() => void)[] = [];

        const magnets = gsap.utils
          .toArray<HTMLElement>(".sb-btn--primary, .sb-btn--secondary, .sb-tech", scope)
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
