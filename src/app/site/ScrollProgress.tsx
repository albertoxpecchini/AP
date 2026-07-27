// ─────────────────────────────────────────────────────────────────────────────
// Filo di avanzamento della lettura — globale, su OGNI pagina del sito.
// Montato una volta sola in main.tsx (come ControlBar): sta fisso sul bordo
// alto della finestra e cresce da sinistra a destra man mano che ci si avvicina
// alla fine della pagina.
//
// Non usa ScrollTrigger: le pagine sono lazy e cambiano altezza dopo il
// montaggio, quindi conviene rimisurare a ogni frame utile (scroll, resize,
// ResizeObserver sul body) invece di fidarsi di una misura fatta una volta.
// L'avanzamento è ammorbidito con un quickTo, così il filo insegue lo scroll
// invece di scattare; con prefers-reduced-motion la posizione è secca ma il
// filo resta — è informazione sulla pagina, non decorazione.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./scrollprogress.css";

/** Sotto questa soglia (px) la pagina non scorre davvero: filo nascosto. */
const MIN_SCROLL = 24;

export default function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    const box = boxRef.current;
    if (!bar || !box) return;

    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
    const scaleTo = gsap.quickTo(bar, "scaleX", { duration: 0.4, ease: "power3" });

    let frame = 0;
    const update = () => {
      frame = 0;
      // Con lo scroll bloccato (menu, modali) il body va in position:fixed e la
      // pagina "si accorcia": congelo il filo dov'è invece di farlo azzerare
      // dietro l'overlay — al rilascio riprende dal punto giusto.
      if (document.body.dataset.scrollLockY !== undefined) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      box.classList.toggle("is-on", max > MIN_SCROLL);
      const p = max > MIN_SCROLL ? gsap.utils.clamp(0, 1, window.scrollY / max) : 0;
      if (smooth) scaleTo(p);
      else gsap.set(bar, { scaleX: p });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Contenuti lazy, immagini, accordion: l'altezza della pagina cambia in corsa.
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      gsap.killTweensOf(bar);
    };
  }, []);

  return (
    <div className="ap-progress" ref={boxRef} aria-hidden="true">
      <span className="ap-progress-fill" ref={barRef} />
    </div>
  );
}
