import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IcCheck, IcTranslate } from "../site/homeIcons";
import { getLang, setLang, subscribeLang, langMeta, LANGS, type Lang } from "./langCore";

// ─────────────────────────────────────────────────────────────────────────────
// Switcher di lingua globale — primo segmento della barra di controllo
// (ControlBar.tsx), accanto ai comandi del tema, in basso a sinistra.
//
//  · Segmento compatto: icona + sigla della lingua attiva (IT/EN/FR/DE).
//  · Al clic si apre, verso l'alto, l'elenco delle 4 lingue (molla + cascata),
//    con l'indicatore "attivo" che scorre da una voce all'altra.
//  · Scegliendo una lingua parte un'onda a tutto schermo (cerchio che si espande
//    dal widget, fondo della pagina + alone azzurro e nome della lingua): a metà
//    corsa il sito viene ritradotto SOTTO l'onda, poi l'onda svanisce. Niente
//    ricaricamento.
//
// Niente bandierine emoji: su Windows si vedono come due lettere — usiamo sigle
// in badge + il nome della lingua, identici su ogni sistema operativo.
//
// ── Perché qui non c'è più Motion ────────────────────────────────────────────
// L'apertura del menu, la cascata delle voci e l'indicatore che scorre erano
// tre animazioni di framer-motion (`AnimatePresence`, `layoutId`). Facevano il
// loro mestiere, ma questo widget sta nella barra di controllo, cioè su OGNI
// pagina del sito: erano ~124 kB di libreria (≈40 kB gzip) nel bundle iniziale
// di chiunque aprisse qualsiasi pagina, per un menu di quattro voci che quasi
// nessuno apre. Adesso le tre animazioni sono tre transizioni CSS in
// controlbar.css, con le stesse curve e le stesse durate di prima:
//
//  · apertura     → .sb-lang-menu.is-open (opacità + scala, origine in basso)
//  · cascata      → --i sulla voce, che diventa il transition-delay
//  · indicatore   → --ink sull'elenco, cioè quale riga è attiva
//
// Il menu resta SEMPRE nel DOM (sono quattro <li>): serve per avere anche
// l'animazione d'uscita, che con un montaggio condizionato non ci sarebbe.
// Chiuso è `inert`, quindi fuori dal tab order e invisibile agli screen reader.
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
  const activeIndex = Math.max(0, LANGS.findIndex((l) => l.code === lang));

  return (
    <>
      {/* Onda a tutto schermo (sopra tutto, sotto l'onda del tema).
          Portata su <body>: il backdrop-filter della barra di controllo che la
          contiene la ritaglierebbe altrimenti alla propria dimensione. */}
      {createPortal(
        <div ref={overlayRef} className="sb-home sb-lang-wipe" aria-hidden="true">
          <div className="sb-lang-wipe-badge">
            <span className="sb-lang-wipe-code">{target.label}</span>
            <span className="sb-lang-wipe-name">{target.name}</span>
          </div>
        </div>,
        document.body,
      )}

      <div className="sb-lang-dock" ref={dockRef} data-no-i18n="">
        <ul
          className={`sb-lang-menu${open ? " is-open" : ""}`}
          role="listbox"
          aria-label="Scegli la lingua"
          // --ink: su quale riga sta l'indicatore. Il CSS lo moltiplica per
          // l'altezza di una voce, quindi scorre da sé quando cambia lingua.
          style={{ "--ink": activeIndex } as React.CSSProperties}
          // Chiuso il menu è inerte: niente tab, niente screen reader, niente
          // clic a vuoto sopra la barra. `inert` non è ancora nei tipi di
          // React 18, da cui il cast.
          {...(open ? {} : ({ inert: "" } as Record<string, string>))}
        >
          {/* Un solo indicatore per tutto l'elenco, non uno per voce: è lui a
              scivolare da una riga all'altra (era il `layoutId` di Motion). */}
          <span className="sb-lang-ink" aria-hidden="true" />
          {LANGS.map((l, i) => {
            const isActive = l.code === lang;
            return (
              <li key={l.code} style={{ "--i": i } as React.CSSProperties}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={open ? 0 : -1}
                  className={`sb-lang-opt${isActive ? " is-active" : ""}`}
                  onClick={() => choose(l.code)}
                >
                  <span className="sb-lang-code">{l.label}</span>
                  <span className="sb-lang-name">{l.name}</span>
                  {isActive && <IcCheck size={14} className="sb-lang-check" />}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          ref={triggerRef}
          type="button"
          className="sb-ctl-btn sb-lang-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Lingua: ${active.name}. Cambia lingua`}
          title="Lingua / Language"
        >
          <IcTranslate size={16} />
          <span className="sb-ctl-code">{active.label}</span>
        </button>
      </div>
    </>
  );
}
