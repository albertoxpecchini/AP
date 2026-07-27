import { useCallback, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import ThemeWidget from "./ThemeWidget";
import { IcChevronLeft, IcChevronRight } from "../site/homeIcons";
import "../home.css";
import "./controlbar.css";

// ─────────────────────────────────────────────────────────────────────────────
// Barra di controllo globale — lingua · tema · sensore orario.
// Montata UNA volta (in main.tsx), vive su ogni pagina, in basso a sinistra.
//
// Sta rincantucciata fuori dal bordo sinistro e lascia sporgere solo la
// linguetta; scivola fuori dal lato quando:
//  · il puntatore si AVVICINA (entro PROX px dall'ingombro della barra);
//  · il fuoco da tastiera entra nella barra (Tab);
//  · si preme la linguetta (unico modo sul touch, dove non c'è "avvicinarsi"):
//    in quel caso resta fissata finché non la si preme di nuovo o si tocca fuori.
// Rientra dopo una breve pausa, ma solo se non è sotto il puntatore, non ha il
// fuoco e non ha un menu aperto.
// ─────────────────────────────────────────────────────────────────────────────

const PROX = 130; // px: quanto "avvicinarsi" perché la barra esca
const HIDE_MS = 620; // pausa prima di rientrare
const HINT_MS = 2400; // all'avvio la barra si mostra un attimo, poi rientra

export default function ControlBar() {
  const [out, setOut] = useState(true);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(false);
  const hideTimer = useRef(0);

  // Motivi per restare fuori: puntatore sopra, fuoco dentro, menu aperto.
  const busy = useCallback(() => {
    const el = slideRef.current;
    if (!el) return false;
    if (pinned.current) return true;
    if (el.contains(document.activeElement)) return true;
    if (el.querySelector('[aria-expanded="true"]')) return true;
    try {
      return el.matches(":hover");
    } catch {
      return false;
    }
  }, []);

  const show = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    setOut(true);
  }, []);

  const scheduleHide = useCallback(
    (delay = HIDE_MS) => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        if (busy()) {
          scheduleHide();
          return;
        }
        setOut(false);
      }, delay);
    },
    [busy],
  );

  // ── Sensore di prossimità del puntatore ──
  useEffect(() => {
    let frame = 0;
    let px = 0;
    let py = 0;

    const check = () => {
      frame = 0;
      const zone = zoneRef.current;
      if (!zone) return;
      // Il contenitore non si sposta mai: la sua area è l'ingombro della barra
      // "fuori", anche mentre è rincantucciata.
      const r = zone.getBoundingClientRect();
      const near =
        px >= r.left - PROX && px <= r.right + PROX && py >= r.top - PROX && py <= r.bottom + PROX;
      if (near) show();
      else if (!busy()) scheduleHide();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // sul touch comanda la linguetta
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(check);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [busy, scheduleHide, show]);

  // ── Tocco fuori dalla barra: la sfissa e la fa rientrare ──
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = slideRef.current;
      if (!el || el.contains(e.target as Node)) return;
      pinned.current = false;
      scheduleHide(120);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [scheduleHide]);

  // ── All'avvio si fa vedere un attimo (così si sa che c'è), poi rientra ──
  useEffect(() => {
    scheduleHide(HINT_MS);
    return () => window.clearTimeout(hideTimer.current);
  }, [scheduleHide]);

  const onGrip = useCallback(() => {
    if (out && pinned.current) {
      pinned.current = false;
      setOut(false);
      return;
    }
    pinned.current = true;
    show();
  }, [out, show]);

  return (
    <div ref={zoneRef} className={`sb-home sb-ctl${out ? " is-out" : ""}`}>
      <div
        ref={slideRef}
        className="sb-ctl-slide"
        id="ap-controlbar"
        onFocus={show}
        onBlur={() => scheduleHide()}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") show();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== "touch") scheduleHide();
        }}
      >
        {/* Una sola pillola: lingua · | · tema · sensore orario */}
        <div className="sb-panel sb-ctl-panel">
          <div className="sb-panel-inner">
            <LanguageSwitcher />
            <span className="sb-ctl-div" aria-hidden="true" />
            <ThemeWidget />
          </div>
        </div>

        <button
          type="button"
          className="sb-ctl-grip"
          onClick={onGrip}
          aria-controls="ap-controlbar"
          aria-label={out ? "Nascondi lingua e tema" : "Mostra lingua e tema"}
          title={out ? "Nascondi lingua e tema" : "Mostra lingua e tema"}
        >
          {out ? <IcChevronLeft size={12} /> : <IcChevronRight size={12} />}
        </button>
      </div>
    </div>
  );
}
