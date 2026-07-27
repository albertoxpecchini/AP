import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IcClock, IcMoon, IcSun } from "../site/homeIcons";
import {
  applyTheme,
  currentTheme,
  getMode,
  nextBoundary,
  resolveTheme,
  setAutoMode,
  setManualTheme,
  subscribeTheme,
  syncTheme,
  THEME_BG,
  THEME_REQUEST_EVENT,
  timeTheme,
  type Theme,
} from "./themeCore";

// ─────────────────────────────────────────────────────────────────────────────
// Widget tema globale: due segmenti della barra di controllo (ControlBar.tsx).
//  · tasto luna/sole → cambia tema a mano (mode "manuale");
//  · chip "Auto"     → ridà il comando al sensore orario;
//  · sensore orario  → alle 08:00 e 20:00 cambia da solo, con l'animazione che
//                      parte 1s prima (alle :59:59) "senza premere nulla";
//  · ogni cambio tema (manuale o automatico) ha la stessa transizione a cerchio.
// Veste e misure: grammatica Supabase (.sb-ctl-*, vedi controlbar.css).
// ─────────────────────────────────────────────────────────────────────────────

const WIPE_MS = 620;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function ThemeWidget() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  const [auto, setAuto] = useState<boolean>(() => resolveTheme() === timeTheme() && isAuto());
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const animating = useRef(false);
  const transitionToRef = useRef<
    ((next: Theme, origin?: { x: number; y: number }) => void) | null
  >(null);

  // Allinea lo stato React quando il tema cambia (anche da altri punti).
  useEffect(() => subscribeTheme((t) => setTheme(t)), []);

  // Richieste di cambio tema ANIMATO da fuori (tasti interni a giochi/me-stesso).
  useEffect(() => {
    const onRequest = (e: Event) => {
      const next = (e as CustomEvent).detail?.theme as Theme;
      if (next !== "light" && next !== "dark") return;
      setAuto(isAuto());
      transitionToRef.current?.(next);
    };
    window.addEventListener(THEME_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(THEME_REQUEST_EVENT, onRequest);
  }, []);

  // Primo allineamento al montaggio.
  useEffect(() => {
    syncTheme();
    setAuto(isAuto());
  }, []);

  // Animazione a cerchio + commutazione del tema a metà corsa.
  const transitionTo = useCallback((next: Theme, origin?: { x: number; y: number }) => {
    if (next === currentTheme()) {
      applyTheme(next);
      return;
    }
    const el = overlayRef.current;
    if (!el || prefersReducedMotion()) {
      applyTheme(next);
      return;
    }
    if (animating.current) {
      applyTheme(next);
      return;
    }
    animating.current = true;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = origin?.x ?? w / 2;
    const y = origin?.y ?? h / 2;
    const radius =
      Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 4;

    el.style.background = THEME_BG[next];
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    // forza un reflow così la transizione parte dallo stato iniziale
    void el.offsetWidth;
    el.style.transition = `clip-path ${WIPE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    el.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;

    // Commuta il tema quando il cerchio ha quasi coperto lo schermo.
    window.setTimeout(() => applyTheme(next), Math.round(WIPE_MS * 0.6));
    // Svela la pagina già col nuovo tema.
    window.setTimeout(() => {
      el.style.transition = "opacity 240ms ease";
      el.style.opacity = "0";
    }, WIPE_MS);
    window.setTimeout(() => {
      el.style.transition = "none";
      el.style.clipPath = `circle(0px at ${x}px ${y}px)`;
      animating.current = false;
    }, WIPE_MS + 280);
  }, []);
  transitionToRef.current = transitionTo;

  // Tasto: cambia tema a mano.
  const onToggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    setManualTheme(next);
    setAuto(false);
    const r = btnRef.current?.getBoundingClientRect();
    transitionTo(next, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
  }, [transitionTo]);

  // Chip "Auto": ridà il comando al sensore orario.
  const onAuto = useCallback(() => {
    setAutoMode();
    setAuto(true);
    const next = timeTheme();
    const r = btnRef.current?.getBoundingClientRect();
    if (next !== currentTheme()) {
      transitionTo(next, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
    }
  }, [transitionTo]);

  // ── Sensore orario: cambia tema da solo ai confini 08:00 / 20:00 ──
  useEffect(() => {
    let preTimer = 0;
    let fireTimer = 0;

    const schedule = () => {
      window.clearTimeout(preTimer);
      window.clearTimeout(fireTimer);

      const { at, theme: targetTheme } = nextBoundary(new Date());
      const now = Date.now();
      const untilFire = Math.max(0, at - now);
      const untilPre = Math.max(0, at - 1000 - now); // 1s prima → :59:59

      // L'animazione parte 1s prima del confine "senza premere nulla".
      preTimer = window.setTimeout(() => {
        // Riprende il comando il sensore e anima verso il tema dell'orario.
        setAutoMode();
        setAuto(true);
        if (targetTheme !== currentTheme()) transitionTo(targetTheme);
      }, untilPre);

      // Rete di sicurezza: al confine esatto assicura il tema corretto.
      fireTimer = window.setTimeout(() => {
        if (currentTheme() !== targetTheme) {
          setAutoMode();
          setAuto(true);
          applyTheme(targetTheme);
        }
        schedule(); // pianifica il confine successivo
      }, untilFire + 50);
    };

    schedule();

    // Al risveglio della scheda (timer in pausa) ricalcola e riallinea.
    const onWake = () => {
      if (isAuto() && currentTheme() !== timeTheme()) {
        applyTheme(timeTheme());
      }
      schedule();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      window.clearTimeout(preTimer);
      window.clearTimeout(fireTimer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [transitionTo]);

  const isDark = theme === "dark";

  return (
    <>
      {/* Onda a tutto schermo portata su <body>: il backdrop-filter della barra
          di controllo che la contiene la ritaglierebbe altrimenti. */}
      {createPortal(
        <div ref={overlayRef} className="sb-theme-wipe" aria-hidden="true" />,
        document.body,
      )}

      <button
        ref={btnRef}
        type="button"
        className="sb-ctl-btn"
        onClick={onToggle}
        aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
        title={isDark ? "Tema chiaro" : "Tema scuro"}
      >
        <span key={theme} className="sb-ctl-ico" aria-hidden="true">
          {isDark ? <IcSun size={16} /> : <IcMoon size={16} />}
        </span>
      </button>
      <button
        type="button"
        className={`sb-ctl-btn sb-ctl-auto${auto ? " is-on" : ""}`}
        onClick={onAuto}
        aria-pressed={auto}
        title={
          auto
            ? "Sensore orario attivo (08–20 chiaro, resto scuro)"
            : "Riattiva il sensore orario"
        }
      >
        <IcClock size={14} />
        <span>Auto</span>
      </button>
    </>
  );
}

function isAuto(): boolean {
  return getMode() !== "manual";
}
