import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Workflow, X } from "lucide-react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// ─────────────────────────────────────────────────────────────────────────────
// "Come funziona" — il GIRO DEI DATI del sito, dal codice all'online: sorgenti →
// build/codifiche → deploy → online (Vercel: CDN + serverless) → client (PWA).
//
// Diagramma disegnato a mano in HTML/CSS (nessuna dipendenza), dark premium,
// aperto in una finestra interna sul modello del visualizzatore PDF (.ap-cv-*).
// La STESSA pipeline è nel README come diagramma Mermaid.
//
// Multilingua senza il motore i18n (marcato data-no-i18n): la NARRAZIONE (titoli,
// sottotitoli, connettori) si traduce da sé leggendo la lingua attiva; i nodi
// restano etichette tecniche universali (nomi di tool, formati, protocolli).
// ─────────────────────────────────────────────────────────────────────────────

type Node = { i: string; l: string; d: string };
type Stage = { icon: string; nodes: Node[] };

// Nodi = termini tecnici (universali in dev), uguali in ogni lingua.
const STAGES: Stage[] = [
  {
    icon: "🗂️",
    nodes: [
      { i: "📝", l: "i18n", d: "dictionary.ts" },
      { i: "📄", l: "cv-data ×4", d: "JSON" },
      { i: "❓", l: "trivia", d: "raw .txt" },
      { i: "🖼️", l: "images", d: "assets" },
      { i: "🧩", l: "code", d: "React · TS" },
    ],
  },
  {
    icon: "⚙️",
    nodes: [
      { i: "❓", l: "import-trivia", d: "→ chapters JSON" },
      { i: "📄", l: "build-cv.ps1", d: "→ 4× PDF" },
      { i: "🖼️", l: "compress-images", d: "sharp → WebP" },
      { i: "🗜️", l: "build-zips", d: "archiver → ZIP" },
      { i: "🌐", l: "i18n-extract", d: "→ translations.json" },
      { i: "📦", l: "vite build", d: "Rollup → bundle" },
      { i: "⚡", l: "vite-plugin-pwa", d: "Workbox → SW" },
    ],
  },
  {
    icon: "🚀",
    nodes: [
      { i: "🤖", l: "Claude Code", d: "local dev" },
      { i: "🌿", l: "git push", d: "→ main" },
      { i: "🐙", l: "GitHub", d: "repo AP" },
      { i: "▲", l: "Vercel", d: "CI build" },
    ],
  },
  {
    icon: "☁️",
    nodes: [
      { i: "🗄️", l: "static CDN", d: "HTML · JS · CSS · PDF · ZIP · WebP" },
      { i: "🤖", l: "/api/trivia", d: "→ Anthropic Claude" },
      { i: "✉️", l: "/api/notify", d: "→ Resend · email" },
    ],
  },
  {
    icon: "🧑‍💻",
    nodes: [
      { i: "⚛️", l: "SPA React", d: "Router + PWA" },
      { i: "📊", l: "footer", d: "GitHub API → sparkline" },
      { i: "🏆", l: "leaderboards", d: "Supabase · REST + WS" },
      { i: "⚡", l: "service worker", d: "offline cache" },
    ],
  },
];

// Narrazione localizzata: chrome + titoli/sottotitoli dei 5 stadi + connettori.
type Copy = {
  open: string;
  title: string;
  subtitle: string;
  close: string;
  stages: { t: string; s: string }[];
  conn: string[]; // 4 connettori tra i 5 stadi
};

const T: Record<Lang, Copy> = {
  it: {
    open: "Come funziona",
    title: "Il giro dei dati — dal codice all'online",
    subtitle: "sorgenti → build → deploy → online → browser",
    close: "Chiudi",
    stages: [
      { t: "Sorgenti & contenuti", s: "testi, dati, immagini, codice" },
      { t: "Build & codifiche", s: "script locali → artefatti (PDF · ZIP · WebP · JSON · bundle)" },
      { t: "Versioning & deploy", s: "dal locale a Vercel" },
      { t: "Online · Vercel", s: "CDN statica + funzioni serverless" },
      { t: "Nel browser · client PWA", s: "runtime: dati live da GitHub, Supabase, /api" },
    ],
    conn: ["file sorgente", "artefatti · bundle · PDF · ZIP · WebP · SW", "git push → build → deploy", "HTTPS · JSON · lazy chunks"],
  },
  en: {
    open: "How it works",
    title: "The data journey — from code to online",
    subtitle: "sources → build → deploy → online → browser",
    close: "Close",
    stages: [
      { t: "Sources & content", s: "text, data, images, code" },
      { t: "Build & encodings", s: "local scripts → artifacts (PDF · ZIP · WebP · JSON · bundle)" },
      { t: "Versioning & deploy", s: "from local to Vercel" },
      { t: "Online · Vercel", s: "static CDN + serverless functions" },
      { t: "In the browser · PWA client", s: "runtime: live data from GitHub, Supabase, /api" },
    ],
    conn: ["source files", "artifacts · bundle · PDF · ZIP · WebP · SW", "git push → build → deploy", "HTTPS · JSON · lazy chunks"],
  },
  fr: {
    open: "Fonctionnement",
    title: "Le parcours des données — du code au live",
    subtitle: "sources → build → déploiement → en ligne → navigateur",
    close: "Fermer",
    stages: [
      { t: "Sources & contenus", s: "textes, données, images, code" },
      { t: "Build & encodages", s: "scripts locaux → artefacts (PDF · ZIP · WebP · JSON · bundle)" },
      { t: "Versioning & déploiement", s: "du local à Vercel" },
      { t: "En ligne · Vercel", s: "CDN statique + fonctions serverless" },
      { t: "Dans le navigateur · client PWA", s: "runtime : données live de GitHub, Supabase, /api" },
    ],
    conn: ["fichiers source", "artefacts · bundle · PDF · ZIP · WebP · SW", "git push → build → déploiement", "HTTPS · JSON · lazy chunks"],
  },
  de: {
    open: "Wie es funktioniert",
    title: "Der Datenfluss — vom Code bis online",
    subtitle: "Quellen → Build → Deploy → online → Browser",
    close: "Schließen",
    stages: [
      { t: "Quellen & Inhalte", s: "Texte, Daten, Bilder, Code" },
      { t: "Build & Kodierungen", s: "lokale Skripte → Artefakte (PDF · ZIP · WebP · JSON · Bundle)" },
      { t: "Versionierung & Deploy", s: "vom Lokalen zu Vercel" },
      { t: "Online · Vercel", s: "statisches CDN + Serverless-Funktionen" },
      { t: "Im Browser · PWA-Client", s: "Runtime: Live-Daten von GitHub, Supabase, /api" },
    ],
    conn: ["Quelldateien", "Artefakte · Bundle · PDF · ZIP · WebP · SW", "git push → build → deploy", "HTTPS · JSON · lazy chunks"],
  },
};

export default function WorkflowModal() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeLang(setLang), []);

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

  const t = T[lang];

  return (
    <>
      <button type="button" className="apw-open" onClick={() => setOpen(true)} data-no-i18n>
        <Workflow size={15} aria-hidden="true" />
        {t.open}
      </button>

      {open &&
        createPortal(
          <div
            className="apw-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t.title}
            data-no-i18n
          >
            <div className="apw-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="apw-dialog">
              <div className="apw-bar">
                <div className="apw-bar-txt">
                  <span className="apw-bar-title">{t.title}</span>
                  <span className="apw-bar-sub">{t.subtitle}</span>
                </div>
                <button type="button" className="apw-close" onClick={() => setOpen(false)} aria-label={t.close}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="apw-body">
                {STAGES.map((stage, si) => (
                  <div key={si}>
                    <section className="apw-stage">
                      <div className="apw-stage-head">
                        <span className="apw-stage-ico" aria-hidden="true">{stage.icon}</span>
                        <span className="apw-stage-n">{si + 1}</span>
                        <div>
                          <h3 className="apw-stage-title">{t.stages[si].t}</h3>
                          <p className="apw-stage-sub">{t.stages[si].s}</p>
                        </div>
                      </div>
                      <div className="apw-nodes">
                        {stage.nodes.map((n, ni) => (
                          <span className="apw-node" key={ni}>
                            <span className="apw-node-ico" aria-hidden="true">{n.i}</span>
                            <span className="apw-node-txt">
                              <b>{n.l}</b>
                              <small>{n.d}</small>
                            </span>
                          </span>
                        ))}
                      </div>
                    </section>

                    {si < STAGES.length - 1 && (
                      <div className="apw-conn" aria-hidden="true">
                        <span className="apw-conn-label">{t.conn[si]}</span>
                        <span className="apw-conn-arrow">▼</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        /* Trigger nel footer */
        .apw-open {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0; border: none; background: none; cursor: pointer;
          color: #8893a0; font-family: inherit; font-size: 0.86rem;
          transition: color 0.15s;
        }
        .apw-open:hover { color: #c4a5ff; }

        /* Modale (sul modello del viewer PDF) */
        .apw-modal { position: fixed; inset: 0; z-index: 2147483200; display: flex; align-items: center; justify-content: center; padding: clamp(0.75rem, 3vw, 2rem); font-family: "Titillium Web", Geneva, Tahoma, sans-serif; }
        .apw-backdrop { position: absolute; inset: 0; background: rgba(4, 6, 10, 0.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: apw-fade 0.2s ease; }
        .apw-dialog {
          position: relative; z-index: 1;
          width: min(920px, 100%); max-height: min(88vh, 900px);
          display: flex; flex-direction: column;
          background: linear-gradient(180deg, #0e1218 0%, #0a0d12 100%);
          border: 1px solid rgba(139, 123, 255, 0.28); border-radius: 18px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.6);
          overflow: hidden; animation: apw-pop 0.24s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .apw-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 0.85rem 1.1rem; border-bottom: 1px solid rgba(139, 123, 255, 0.18);
          background: rgba(139, 123, 255, 0.06);
        }
        .apw-bar-txt { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .apw-bar-title { color: #fff; font-weight: 800; font-size: 1.02rem; line-height: 1.2; }
        .apw-bar-sub { color: #8893a0; font-size: 0.78rem; font-weight: 600; }
        .apw-close {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); color: #cdd6e0;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .apw-close:hover { color: #fff; border-color: rgba(139, 123, 255, 0.5); background: rgba(139, 123, 255, 0.16); }

        .apw-body { padding: clamp(1rem, 3vw, 1.6rem); overflow-y: auto; }

        .apw-stage {
          border: 1px solid rgba(139, 123, 255, 0.16); border-radius: 14px;
          background: rgba(255, 255, 255, 0.02); padding: 0.9rem 1rem 1rem;
        }
        .apw-stage-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; }
        .apw-stage-ico { font-size: 1.3rem; line-height: 1; }
        .apw-stage-n {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%;
          background: #8b7bff; color: #fff; font-weight: 800; font-size: 0.74rem;
        }
        .apw-stage-title { margin: 0; color: #eef2f7; font-size: 0.98rem; font-weight: 800; }
        .apw-stage-sub { margin: 0.05rem 0 0; color: #8893a0; font-size: 0.8rem; }

        .apw-nodes { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .apw-node {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.45rem 0.7rem; border-radius: 10px;
          background: rgba(139, 123, 255, 0.08); border: 1px solid rgba(139, 123, 255, 0.2);
        }
        .apw-node-ico { font-size: 1rem; line-height: 1; }
        .apw-node-txt { display: flex; flex-direction: column; line-height: 1.25; }
        .apw-node-txt b { color: #e8eef4; font-size: 0.84rem; font-weight: 700; }
        .apw-node-txt small { color: #97a1ad; font-size: 0.72rem; }

        .apw-conn { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; padding: 0.35rem 0; }
        .apw-conn-label {
          font-size: 0.72rem; font-weight: 700; color: #b9a6ff;
          background: rgba(139, 123, 255, 0.12); border: 1px solid rgba(139, 123, 255, 0.22);
          padding: 0.15rem 0.6rem; border-radius: 999px; text-align: center;
        }
        .apw-conn-arrow { color: #6d5bd0; font-size: 0.8rem; line-height: 1; }

        @keyframes apw-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes apw-pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .apw-backdrop, .apw-dialog { animation: none; } }
      `}</style>
    </>
  );
}
