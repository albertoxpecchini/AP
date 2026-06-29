import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Languages, Check } from "lucide-react";
import { getLang, setLang, subscribeLang, langMeta, LANGS, type Lang } from "./langCore";

// ─────────────────────────────────────────────────────────────────────────────
// Switcher di lingua globale — montato UNA volta (in main.tsx), vive su ogni
// pagina, accanto al widget del tema (in basso a sinistra, appena più in alto).
//
//  · Pillola compatta: icona + sigla della lingua attiva (IT/EN/FR/DE).
//  · Al clic si apre, verso l'alto, l'elenco delle 4 lingue (molla + cascata),
//    con l'indicatore "attivo" che scorre (layout animato di Motion).
//  · Scegliendo una lingua parte un'onda a tutto schermo (cerchio che si espande
//    dal widget, colore accento + nome della lingua): a metà corsa il sito viene
//    ritradotto SOTTO l'onda, poi l'onda svanisce. Niente ricaricamento.
//
// Niente bandierine emoji: su Windows si vedono come due lettere — usiamo sigle
// in badge + il nome della lingua, identici su ogni sistema operativo.
// ─────────────────────────────────────────────────────────────────────────────

const WIPE_MS = 720;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function LanguageSwitcher() {
  const [lang, setLangState] = useState<Lang>(() => getLang());
  const [open, setOpen] = useState(false);
  const [wipeTarget, setWipeTarget] = useState<Lang>(() => getLang());

  const dockRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const animating = useRef(false);

  // Allinea lo stato se la lingua cambia da altrove.
  useEffect(() => subscribeLang((l) => setLangState(l)), []);

  // Chiusura del menu: clic fuori + tasto Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Onda a tutto schermo + cambio lingua a metà corsa.
  const doWipe = useCallback((next: Lang) => {
    setWipeTarget(next);
    const overlay = overlayRef.current;

    if (!overlay || prefersReducedMotion() || animating.current) {
      setLang(next); // cambio immediato (niente animazione)
      return;
    }
    animating.current = true;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const r = triggerRef.current?.getBoundingClientRect();
    const x = r ? r.left + r.width / 2 : w / 2;
    const y = r ? r.top + r.height / 2 : h / 2;
    const radius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 8;

    overlay.style.transition = "none";
    overlay.style.opacity = "1";
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    void overlay.offsetWidth; // reflow: la transizione parte da zero
    overlay.classList.add("is-active");
    overlay.style.transition = `clip-path ${WIPE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    overlay.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;

    // A metà corsa, ritraduce il sito sotto l'onda.
    window.setTimeout(() => setLang(next), Math.round(WIPE_MS * 0.45));
    // Svela la pagina già nella nuova lingua.
    window.setTimeout(() => {
      overlay.style.transition = "opacity 280ms ease";
      overlay.style.opacity = "0";
      overlay.classList.remove("is-active");
    }, WIPE_MS);
    window.setTimeout(() => {
      overlay.style.transition = "none";
      overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
      animating.current = false;
    }, WIPE_MS + 320);
  }, []);

  const choose = useCallback(
    (next: Lang) => {
      setOpen(false);
      if (next === getLang()) return;
      doWipe(next);
    },
    [doWipe],
  );

  const active = langMeta(lang);
  const target = langMeta(wipeTarget);

  return (
    <>
      {/* Onda a tutto schermo (sopra tutto, sotto l'onda del tema) */}
      <div ref={overlayRef} className="ap-lang-wipe" aria-hidden="true">
        <div className="ap-lang-wipe-badge">
          <span className="ap-lang-wipe-code">{target.label}</span>
          <span className="ap-lang-wipe-name">{target.name}</span>
        </div>
      </div>

      <div className="ap-lang-dock" ref={dockRef} data-no-i18n="">
        <AnimatePresence>
          {open && (
            <motion.ul
              className="ap-lang-menu"
              role="listbox"
              aria-label="Scegli la lingua"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 460, damping: 34 }}
            >
              {LANGS.map((l, i) => {
                const isActive = l.code === lang;
                return (
                  <motion.li
                    key={l.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.045, type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`ap-lang-opt${isActive ? " is-active" : ""}`}
                      onClick={() => choose(l.code)}
                    >
                      {isActive && (
                        <motion.span layoutId="ap-lang-ink" className="ap-lang-ink" aria-hidden="true" />
                      )}
                      <span className="ap-lang-opt-code">{l.label}</span>
                      <span className="ap-lang-opt-name">{l.name}</span>
                      {isActive && <Check size={15} className="ap-lang-opt-check" aria-hidden="true" />}
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        <button
          ref={triggerRef}
          type="button"
          className={`ap-lang-trigger${open ? " is-open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Lingua: ${active.name}. Cambia lingua`}
          title="Lingua / Language"
        >
          <Languages size={17} aria-hidden="true" />
          <span className="ap-lang-trigger-code">{active.label}</span>
        </button>
      </div>

      <style>{`
        /* ── Dock (in basso a sinistra, sopra il widget del tema) ── */
        .ap-lang-dock {
          position: fixed;
          left: max(16px, env(safe-area-inset-left));
          bottom: calc(max(16px, env(safe-area-inset-bottom)) + 84px);
          z-index: 2147483400;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          --apl-bg: rgba(18, 22, 30, 0.72);
          --apl-bd: rgba(139, 123, 255, 0.32);
          --apl-fg: #e8eef4;
          --apl-muted: #a7b2bd;
          --apl-accent: #8b7bff;
          --apl-accent-deep: #5b4bd6;
          --apl-shadow: rgba(0, 0, 0, 0.5);
        }
        :root[data-ap-theme="light"] .ap-lang-dock {
          --apl-bg: rgba(255, 255, 255, 0.82);
          --apl-bd: rgba(109, 75, 214, 0.28);
          --apl-fg: #4a2fb0;
          --apl-muted: #6f6391;
          --apl-accent: #6d4bd6;
          --apl-accent-deep: #4a2fb0;
          --apl-shadow: rgba(80, 60, 160, 0.18);
        }

        /* ── Pillola compatta ── */
        .ap-lang-trigger {
          display: inline-flex; align-items: center; gap: 7px;
          height: 46px; padding: 0 14px 0 12px; border-radius: 14px;
          cursor: pointer; border: 1px solid var(--apl-bd);
          background: var(--apl-bg); color: var(--apl-fg);
          box-shadow: 0 8px 24px var(--apl-shadow);
          -webkit-backdrop-filter: blur(12px) saturate(140%);
          backdrop-filter: blur(12px) saturate(140%);
          font-family: inherit;
          transition: transform 0.15s ease, color 0.15s ease, border-color 0.15s ease, background 0.2s ease;
        }
        .ap-lang-trigger:hover { transform: translateY(-2px) scale(1.04); color: var(--apl-accent); border-color: var(--apl-accent); }
        .ap-lang-trigger:active { transform: translateY(0) scale(0.97); }
        .ap-lang-trigger.is-open { color: var(--apl-accent); border-color: var(--apl-accent); }
        .ap-lang-trigger-code { font-weight: 800; font-size: 0.82rem; letter-spacing: 0.06em; }

        /* ── Menu (sopra la pillola) ── */
        .ap-lang-menu {
          position: absolute; left: 0; bottom: calc(100% + 12px);
          list-style: none; margin: 0; padding: 7px;
          min-width: 184px; border-radius: 16px;
          background: var(--apl-bg); border: 1px solid var(--apl-bd);
          box-shadow: 0 18px 44px var(--apl-shadow), 0 0 0 1px rgba(139, 123, 255, 0.06);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          backdrop-filter: blur(16px) saturate(150%);
          transform-origin: bottom left;
        }
        .ap-lang-menu li { margin: 0; padding: 0; }
        .ap-lang-opt {
          position: relative; isolation: isolate;
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 9px 11px; border: none; border-radius: 11px; cursor: pointer;
          background: transparent; color: var(--apl-fg);
          font-family: inherit; font-size: 0.92rem; text-align: left;
          transition: color 0.15s ease;
        }
        .ap-lang-opt:hover { color: var(--apl-accent); }
        .ap-lang-opt:hover::before {
          content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 11px;
          background: rgba(139, 123, 255, 0.10);
        }
        .ap-lang-opt-code {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 24px; flex-shrink: 0; border-radius: 7px;
          font-weight: 800; font-size: 0.72rem; letter-spacing: 0.04em;
          background: rgba(139, 123, 255, 0.14); border: 1px solid var(--apl-bd);
          color: var(--apl-fg);
        }
        .ap-lang-opt-name { font-weight: 600; flex: 1 1 auto; }
        .ap-lang-opt-check { color: var(--apl-accent); flex-shrink: 0; }
        .ap-lang-opt.is-active { color: var(--apl-accent); font-weight: 700; }
        .ap-lang-opt.is-active .ap-lang-opt-code {
          background: var(--apl-accent); border-color: var(--apl-accent); color: #fff;
        }
        /* indicatore "attivo" che scorre tra le voci */
        .ap-lang-ink {
          position: absolute; inset: 0; z-index: -1; border-radius: 11px;
          background: rgba(139, 123, 255, 0.16);
          border: 1px solid var(--apl-bd);
        }

        /* ── Onda a tutto schermo ── */
        .ap-lang-wipe {
          position: fixed; inset: 0; z-index: 2147483550;
          pointer-events: none; opacity: 0;
          clip-path: circle(0px at 0% 100%);
          will-change: clip-path, opacity;
          display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(120% 120% at 18% 88%, #8b7bff 0%, #6d4bd6 45%, #3f2da8 100%);
        }
        .ap-lang-wipe-badge {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: #fff; font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          transform: scale(0.7); opacity: 0;
          transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease;
        }
        .ap-lang-wipe.is-active .ap-lang-wipe-badge { transform: scale(1); opacity: 1; }
        .ap-lang-wipe-code {
          font-size: clamp(3.2rem, 12vw, 6rem); font-weight: 900; line-height: 1;
          letter-spacing: 0.02em; text-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
        }
        .ap-lang-wipe-name {
          font-size: clamp(1rem, 3.4vw, 1.6rem); font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.92;
        }

        @media (prefers-reduced-motion: reduce) {
          .ap-lang-trigger, .ap-lang-opt, .ap-lang-wipe-badge { transition: none; }
        }
      `}</style>
    </>
  );
}
