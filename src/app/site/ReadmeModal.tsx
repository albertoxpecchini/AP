import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Layers,
  BarChart3,
  LayoutGrid,
  ShieldCheck,
  Palette,
  ArrowUpRight,
} from "lucide-react";
import { IcBook, IcClose } from "./homeIcons";
import {
  SiReact,
  SiTypescript,
  SiVite,
  SiTailwindcss,
  SiReactrouter,
  SiFramer,
  SiThreedotjs,
  SiSupabase,
  SiAnthropic,
  SiVercel,
  SiPwa,
  SiGithub,
} from "react-icons/si";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// ─────────────────────────────────────────────────────────────────────────────
// "README" — la stessa scheda di GitHub, dentro il sito. Finestra interna (sul
// modello di WorkflowModal / del viewer PDF) con look GitHub-dark: badge, stack,
// numeri, pagine, sicurezza e palette. NON ripete il "giro dei dati" — quello è
// il pulsante gemello «Come funziona», qui a fianco nel footer.
// Contenuto in italiano (come il README) e marcato data-no-i18n, così il motore
// di traduzione del DOM non lo tocca.
// ─────────────────────────────────────────────────────────────────────────────

const REPO = "https://github.com/albertoxpecchini/AP";
const LIVE = "https://albertopecchini.it";

const STACK: { Icon: ComponentType<{ size?: number; style?: CSSProperties }>; label: string; color: string }[] = [
  { Icon: SiReact, label: "React 18.3", color: "#61DAFB" },
  { Icon: SiTypescript, label: "TypeScript", color: "#3178C6" },
  { Icon: SiVite, label: "Vite 6.3", color: "#646CFF" },
  { Icon: SiTailwindcss, label: "Tailwind 4.1", color: "#38BDF8" },
  { Icon: SiReactrouter, label: "Router 7", color: "#F44250" },
  { Icon: SiFramer, label: "Motion 12", color: "#FF4D8D" },
  { Icon: SiThreedotjs, label: "Three · Vanta", color: "#e6edf3" },
  { Icon: SiSupabase, label: "Supabase", color: "#3FCF8E" },
  { Icon: SiAnthropic, label: "Claude Fable 5", color: "#D97757" },
  { Icon: SiVercel, label: "Vercel", color: "#e6edf3" },
  { Icon: SiPwa, label: "PWA · Workbox", color: "#8A6DEE" },
];

const STATS: { n: string; l: string }[] = [
  { n: "~24,9k", l: "LOC in src" },
  { n: "12", l: "dipendenze" },
  { n: "11", l: "pagine" },
  { n: "4", l: "lingue UI" },
  { n: "1000", l: "domande Trivia" },
  { n: "331", l: "commit" },
];

const PAGES: { name: string; desc: string }[] = [
  { name: "Home", desc: "vetrina, résumé, contatti" },
  { name: "Bio", desc: "About «dark premium» + gallery" },
  { name: "Trivia", desc: "quiz architettura · 1000 domande" },
  { name: "PCTO", desc: "alternanza scuola-lavoro" },
  { name: "Me stesso", desc: "presentazione (Esame 2026)" },
  { name: "Dubliners", desc: "«Gente di Dublino» · Joyce" },
  { name: "Gattopardo", desc: "Tomasi di Lampedusa" },
  { name: "Festa", desc: "inviti con token · RSVP · email" },
  { name: "Archivio", desc: "progetti + README a lato" },
  { name: "Sostieni", desc: "bonifico + libro firme" },
  { name: "Instagram", desc: "chi ti ha tolto il follow" },
];

const SECURITY: string[] = [
  "Solo l'email è pubblica — niente telefono né WhatsApp.",
  "Scritture blindate: origin check + rate-limit + service role.",
  "Link tracciabili usa-e-getta: autodelete 7 giorni, diagnostica solo via email.",
  "Header di sicurezza + CSP definiti in vercel.json.",
];

const PALETTE: { hex: string; name: string }[] = [
  { hex: "#08090d", name: "Footer" },
  { hex: "#e95420", name: "Primario" },
  { hex: "#dd4814", name: "Profondo" },
  { hex: "#f0a183", name: "Accent" },
  { hex: "#faf8f6", name: "Chiaro" },
];

export default function ReadmeModal() {
  const [open, setOpen] = useState(false);

  // Esc chiude + blocca lo scroll del body mentre è aperto.
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [open]);

  return (
    <>
      <button type="button" className="apr-open" onClick={() => setOpen(true)} data-no-i18n>
        <IcBook size={15} />
        README
      </button>

      {open &&
        createPortal(
          <div className="apr-modal" role="dialog" aria-modal="true" aria-label="README del progetto" data-no-i18n>
            <div className="apr-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="apr-dialog">
              <div className="apr-bar">
                <div className="apr-bar-txt">
                  <span className="apr-bar-title">
                    <SiGithub size={16} aria-hidden="true" />
                    albertoxpecchini / <b>AP</b>
                    <span className="apr-tag">README.md</span>
                  </span>
                  <span className="apr-bar-sub">Portfolio &amp; Personal Hub — React/TypeScript</span>
                </div>
                <button type="button" className="apr-close" onClick={() => setOpen(false)} aria-label="Chiudi">
                  <IcClose size={18} />
                </button>
              </div>

              <div className="apr-body">
                {/* Occhiello + badge metriche */}
                <p className="apr-lead">
                  Un portfolio che fa da <b>hub</b> a un sito multi-pagina —{" "}
                  <b>una pagina = un sottodominio</b>, tradotto al volo in <b>4 lingue</b>, in palette Ubuntu orange.
                </p>
                <div className="apr-badges">
                  <span className="apr-badge"><i>build</i><b>Vercel</b></span>
                  <span className="apr-badge"><i>lingue</i><b>IT · EN · FR · DE</b></span>
                  <span className="apr-badge"><i>commit</i><b>331</b></span>
                  <span className="apr-badge"><i>licenza</i><b>MIT</b></span>
                </div>

                {/* Stack */}
                <h3 className="apr-h"><Layers size={16} aria-hidden="true" /> Stack</h3>
                <div className="apr-chips">
                  {STACK.map(({ Icon, label, color }) => (
                    <span key={label} className="apr-chip">
                      <Icon size={14} aria-hidden="true" style={{ color }} />
                      {label}
                    </span>
                  ))}
                </div>

                {/* Numeri */}
                <h3 className="apr-h"><BarChart3 size={16} aria-hidden="true" /> In numeri</h3>
                <div className="apr-stats">
                  {STATS.map(({ n, l }) => (
                    <div key={l} className="apr-stat">
                      <span className="apr-stat-n">{n}</span>
                      <span className="apr-stat-l">{l}</span>
                    </div>
                  ))}
                </div>

                {/* Pagine */}
                <h3 className="apr-h"><LayoutGrid size={16} aria-hidden="true" /> Le pagine</h3>
                <ul className="apr-pages">
                  {PAGES.map(({ name, desc }) => (
                    <li key={name}>
                      <span className="apr-dot" aria-hidden="true" />
                      <b>{name}</b>
                      <span className="apr-page-desc">{desc}</span>
                    </li>
                  ))}
                </ul>

                {/* Sicurezza */}
                <h3 className="apr-h"><ShieldCheck size={16} aria-hidden="true" /> Sicurezza &amp; privacy</h3>
                <ul className="apr-sec">
                  {SECURITY.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                {/* Palette */}
                <h3 className="apr-h"><Palette size={16} aria-hidden="true" /> Palette — Ubuntu orange</h3>
                <div className="apr-swatches">
                  {PALETTE.map(({ hex, name }) => (
                    <div key={hex} className="apr-sw">
                      <span className="apr-sw-box" style={{ background: hex }} aria-hidden="true" />
                      <span className="apr-sw-name">{name}</span>
                      <span className="apr-sw-hex">{hex}</span>
                    </div>
                  ))}
                </div>

                {/* Azioni */}
                <div className="apr-actions">
                  <a className="apr-btn apr-btn-primary" href={REPO} target="_blank" rel="noreferrer noopener">
                    <SiGithub size={16} aria-hidden="true" /> Apri su GitHub <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                  <a className="apr-btn" href={LIVE} target="_blank" rel="noreferrer noopener">
                    Sito live <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        /* Trigger nel footer .sb-: colori dai token della home (tema nativo) */
        .apr-open {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0; border: none; background: none; cursor: pointer;
          color: var(--sb-fg-muted, #8893a0); font-family: inherit; font-size: 0.8rem;
          transition: color 0.15s;
        }
        .apr-open:hover { color: var(--sb-fg, #f6a583); }

        .apr-modal { position: fixed; inset: 0; z-index: 2147483200; display: flex; align-items: center; justify-content: center; padding: clamp(0.6rem, 3vw, 2rem); font-family: "Ubuntu", Geneva, Tahoma, sans-serif; }
        .apr-backdrop { position: absolute; inset: 0; background: rgba(4, 6, 10, 0.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: apr-fade 0.2s ease; }

        /* Dialogo GitHub-dark: la scheda README come su github.com (tema scuro). */
        .apr-dialog {
          position: relative; z-index: 1;
          width: min(860px, 100%); max-height: min(90vh, 940px);
          display: flex; flex-direction: column;
          background: #0d1117; color: #e6edf3;
          border: 1px solid #30363d; border-radius: 14px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
          overflow: hidden; animation: apr-pop 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .apr-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 0.8rem 1.1rem; border-bottom: 1px solid #30363d; background: #161b22;
        }
        .apr-bar-txt { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .apr-bar-title { display: inline-flex; align-items: center; gap: 0.45rem; color: #e6edf3; font-weight: 500; font-size: 1rem; line-height: 1.2; }
        .apr-bar-title b { font-weight: 800; }
        .apr-tag { margin-left: 0.35rem; padding: 0.06rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; color: #f6a583; background: rgba(233, 84, 32, 0.14); border: 1px solid rgba(233, 84, 32, 0.4); }
        .apr-bar-sub { color: #8b949e; font-size: 0.78rem; font-weight: 500; }
        .apr-close {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
          border: 1px solid #30363d; background: #21262d; color: #c9d1d9;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .apr-close:hover { color: #fff; border-color: rgba(233, 84, 32, 0.55); background: rgba(233, 84, 32, 0.16); }

        .apr-body { padding: clamp(1rem, 3vw, 1.6rem); overflow: auto; }
        .apr-body::-webkit-scrollbar { width: 10px; }
        .apr-body::-webkit-scrollbar-thumb { background: #30363d; border-radius: 999px; }

        .apr-lead { margin: 0 0 0.9rem; color: #c9d1d9; font-size: 0.95rem; line-height: 1.5; }
        .apr-lead b { color: #f6a583; font-weight: 700; }

        .apr-badges { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.4rem; }
        .apr-badge { display: inline-flex; align-items: stretch; border-radius: 5px; overflow: hidden; font-size: 0.72rem; font-weight: 600; border: 1px solid #30363d; }
        .apr-badge i { font-style: normal; padding: 0.16rem 0.45rem; background: #21262d; color: #8b949e; }
        .apr-badge b { padding: 0.16rem 0.5rem; background: #e95420; color: #fff; font-weight: 700; }

        .apr-h {
          display: flex; align-items: center; gap: 0.5rem;
          margin: 1.5rem 0 0.7rem; padding-bottom: 0.45rem;
          border-bottom: 1px solid #21262d;
          font-size: 1.02rem; font-weight: 700; color: #e6edf3;
        }
        .apr-h svg { color: #e95420; }

        .apr-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .apr-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.34rem 0.65rem; border-radius: 999px;
          background: #161b22; border: 1px solid #30363d;
          color: #c9d1d9; font-size: 0.8rem; font-weight: 600;
          transition: border-color 0.15s, transform 0.15s, background 0.15s;
        }
        .apr-chip:hover { border-color: rgba(233, 84, 32, 0.5); background: #1c222b; transform: translateY(-1px); }

        .apr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.55rem; }
        .apr-stat {
          display: flex; flex-direction: column; gap: 0.1rem;
          padding: 0.7rem 0.8rem; border-radius: 10px;
          background: #161b22; border: 1px solid #30363d;
        }
        .apr-stat-n { font-size: 1.35rem; font-weight: 800; color: #f0764a; line-height: 1; }
        .apr-stat-l { font-size: 0.74rem; color: #8b949e; font-weight: 500; }

        .apr-pages { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem 1.2rem; }
        .apr-pages li { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.28rem 0; font-size: 0.86rem; color: #c9d1d9; }
        .apr-pages b { color: #e6edf3; font-weight: 700; }
        .apr-dot { flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: #e95420; transform: translateY(-1px); }
        .apr-page-desc { color: #8b949e; font-size: 0.8rem; }

        .apr-sec { margin: 0; padding-left: 1.1rem; color: #c9d1d9; font-size: 0.86rem; line-height: 1.6; }
        .apr-sec li { margin: 0.1rem 0; }
        .apr-sec li::marker { color: #e95420; }

        .apr-swatches { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .apr-sw { display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start; }
        .apr-sw-box { width: 74px; height: 40px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.14); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2); }
        .apr-sw-name { font-size: 0.74rem; color: #c9d1d9; font-weight: 600; }
        .apr-sw-hex { font-size: 0.68rem; color: #8b949e; font-family: "Ubuntu Mono", monospace; }

        .apr-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1.6rem; }
        .apr-btn {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.5rem 0.9rem; border-radius: 8px; text-decoration: none;
          font-size: 0.85rem; font-weight: 700;
          border: 1px solid #30363d; background: #21262d; color: #e6edf3;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .apr-btn:hover { border-color: rgba(233, 84, 32, 0.55); background: #2a1f26; transform: translateY(-1px); }
        .apr-btn-primary { background: #e95420; border-color: #e95420; color: #fff; }
        .apr-btn-primary:hover { background: #dd4814; border-color: #dd4814; }

        @media (max-width: 560px) {
          .apr-stats { grid-template-columns: repeat(2, 1fr); }
          .apr-pages { grid-template-columns: 1fr; }
        }

        @keyframes apr-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes apr-pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .apr-backdrop, .apr-dialog { animation: none; } }
      `}</style>
    </>
  );
}
