import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Workflow, X } from "lucide-react";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";

// ─────────────────────────────────────────────────────────────────────────────
// "Come funziona" — il GIRO DEI DATI del sito come SEQUENCE DIAGRAM (stile Vajra
// MCP): dallo sviluppo locale al deploy Vercel, fino ai dati live a runtime
// (GitHub API, Supabase, funzioni serverless → Anthropic / Resend).
//
// Lo STESSO diagramma è nel README (blocco ```mermaid); qui è renderizzato in una
// finestra interna (sul modello del viewer PDF) con Mermaid caricato in lazy —
// così pesa solo quando si apre il modale. Multilingua: la definizione è generata
// dalla lingua attiva; i token tecnici (tool, protocolli, formati) restano fissi.
// ─────────────────────────────────────────────────────────────────────────────

type Copy = {
  open: string; title: string; subtitle: string; close: string;
  loading: string; error: string;
  dev: string; ext: string;
  p1: string; p2: string; p3: string; p4: string;
  ask: string; newCommit: string; deployOk: string; spa: string;
  profileEvents: string; sparkline: string; leaderboards: string;
  word: string; curiosity: string; festaVote: string; sendEmail: string;
};

const T: Record<Lang, Copy> = {
  it: {
    open: "Come funziona", title: "Il giro dei dati — dal codice all'online",
    subtitle: "sviluppo → build → deploy → online → browser", close: "Chiudi",
    loading: "carico il diagramma…", error: "diagramma non disponibile",
    dev: "Alberto · dev", ext: "API e servizi esterni",
    p1: "Sviluppo locale (codifiche)", p2: "Build e deploy (CI)",
    p3: "Un utente apre il sito", p4: "Dati live a runtime",
    ask: "«fai la modifica X»", newCommit: "nuovo commit su main", deployOk: "deploy ok",
    spa: "SPA React + service worker (precache offline)",
    profileEvents: "profilo / eventi", sparkline: "sparkline dei commit",
    leaderboards: "classifiche + aggiornamenti live", word: "parola",
    curiosity: "curiosità (testo)", festaVote: "voto Festa", sendEmail: "invio email",
  },
  en: {
    open: "How it works", title: "The data journey — from code to online",
    subtitle: "development → build → deploy → online → browser", close: "Close",
    loading: "loading the diagram…", error: "diagram unavailable",
    dev: "Alberto · dev", ext: "External APIs and services",
    p1: "Local development (encodings)", p2: "Build and deploy (CI)",
    p3: "A user opens the site", p4: "Live data at runtime",
    ask: "«make change X»", newCommit: "new commit on main", deployOk: "deploy ok",
    spa: "React SPA + service worker (offline precache)",
    profileEvents: "profile / events", sparkline: "commit sparkline",
    leaderboards: "leaderboards + live updates", word: "word",
    curiosity: "fun fact (text)", festaVote: "party RSVP", sendEmail: "send email",
  },
  fr: {
    open: "Fonctionnement", title: "Le parcours des données — du code au live",
    subtitle: "développement → build → déploiement → en ligne → navigateur", close: "Fermer",
    loading: "chargement du diagramme…", error: "diagramme indisponible",
    dev: "Alberto · dev", ext: "API et services externes",
    p1: "Développement local (encodages)", p2: "Build et déploiement (CI)",
    p3: "Un utilisateur ouvre le site", p4: "Données live à l'exécution",
    ask: "« fais la modif X »", newCommit: "nouveau commit sur main", deployOk: "déploiement ok",
    spa: "SPA React + service worker (precache hors-ligne)",
    profileEvents: "profil / événements", sparkline: "sparkline des commits",
    leaderboards: "classements + màj live", word: "mot",
    curiosity: "anecdote (texte)", festaVote: "vote fête", sendEmail: "envoi email",
  },
  de: {
    open: "Wie es funktioniert", title: "Der Datenfluss — vom Code bis online",
    subtitle: "Entwicklung → Build → Deploy → online → Browser", close: "Schließen",
    loading: "Diagramm wird geladen…", error: "Diagramm nicht verfügbar",
    dev: "Alberto · dev", ext: "Externe APIs und Dienste",
    p1: "Lokale Entwicklung (Kodierungen)", p2: "Build und Deploy (CI)",
    p3: "Ein Nutzer öffnet die Seite", p4: "Live-Daten zur Laufzeit",
    ask: "„mach Änderung X\"", newCommit: "neuer Commit auf main", deployOk: "Deploy ok",
    spa: "React SPA + Service Worker (Offline-Precache)",
    profileEvents: "Profil / Events", sparkline: "Commit-Sparkline",
    leaderboards: "Ranglisten + Live-Updates", word: "Wort",
    curiosity: "Fun Fact (Text)", festaVote: "Fest-Zusage", sendEmail: "E-Mail senden",
  },
};

// Genera la definizione Mermaid nella lingua data. Token tecnici = fissi.
function buildSeq(c: Copy): string {
  return `sequenceDiagram
    autonumber
    actor Dev as ${c.dev}
    participant CC as Claude Code
    participant GH as GitHub · main
    participant VC as Vercel · CI/hosting
    participant BR as Browser · PWA
    participant EXT as ${c.ext}
    Note over Dev,CC: 1 · ${c.p1}
    Dev->>CC: ${c.ask}
    activate CC
    Note over CC: build-cv.ps1 → 4× PDF · sharp → WebP · import-trivia → JSON
    CC->>GH: git commit + push → main
    deactivate CC
    Note over GH,VC: 2 · ${c.p2}
    GH->>VC: webhook · ${c.newCommit}
    activate VC
    Note over VC: prebuild · build-zips → ZIP
    Note over VC: vite build · Rollup → bundle JS/CSS
    Note over VC: vite-plugin-pwa · Workbox → service worker
    VC-->>GH: ${c.deployOk}
    deactivate VC
    Note over BR,EXT: 3 · ${c.p3}
    BR->>VC: GET / (HTML · JS · CSS · WebP)
    VC-->>BR: ${c.spa}
    Note over BR,EXT: 4 · ${c.p4}
    BR->>EXT: GitHub API · ${c.profileEvents}
    EXT-->>BR: JSON → ${c.sparkline}
    BR->>EXT: Supabase · REST + Realtime WS
    EXT-->>BR: ${c.leaderboards}
    BR->>VC: GET /api/trivia · ${c.word}
    activate VC
    VC->>EXT: Anthropic Claude (Haiku)
    EXT-->>VC: ${c.curiosity}
    VC-->>BR: JSON (cache 24 h)
    deactivate VC
    BR->>VC: POST /api/notify · ${c.festaVote}
    activate VC
    VC->>EXT: Resend · ${c.sendEmail}
    EXT-->>VC: 202 accepted
    VC-->>BR: ok
    deactivate VC`;
}

const MERMAID_THEME = {
  fontFamily: '"Titillium Web", Geneva, Tahoma, sans-serif',
  fontSize: "14px",
  background: "#0b0e14",
  primaryColor: "#191d2e",
  primaryBorderColor: "#8b7bff",
  primaryTextColor: "#e8eef4",
  secondaryColor: "#20243a",
  actorBkg: "#191d2e",
  actorBorder: "#8b7bff",
  actorTextColor: "#eef2f7",
  actorLineColor: "#5a5580",
  signalColor: "#b9a6ff",
  signalTextColor: "#cdd6e0",
  labelBoxBkgColor: "#241b3b",
  labelBoxBorderColor: "#8b7bff",
  labelTextColor: "#eae6ff",
  loopTextColor: "#cdd6e0",
  noteBkgColor: "#241b3b",
  noteTextColor: "#eae6ff",
  noteBorderColor: "#8b7bff",
  activationBkgColor: "#33306a",
  activationBorderColor: "#b9a6ff",
  sequenceNumberColor: "#ffffff",
  lineColor: "#8b7bff",
};

export default function WorkflowModal() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const holderRef = useRef<HTMLDivElement | null>(null);
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

  // Render del diagramma con Mermaid (lazy) all'apertura e a ogni cambio lingua.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: MERMAID_THEME,
          sequence: { useMaxWidth: true, wrap: true, mirrorActors: true, actorMargin: 42 },
        });
        const id = "apw-seq-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, buildSeq(T[lang]));
        if (cancelled) return;
        if (holderRef.current) holderRef.current.innerHTML = svg;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, lang]);

  const t = T[lang];

  return (
    <>
      <button type="button" className="apw-open" onClick={() => setOpen(true)} data-no-i18n>
        <Workflow size={15} aria-hidden="true" />
        {t.open}
      </button>

      {open &&
        createPortal(
          <div className="apw-modal" role="dialog" aria-modal="true" aria-label={t.title} data-no-i18n>
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
                {status !== "ready" && (
                  <p className="apw-msg">{status === "error" ? t.error : t.loading}</p>
                )}
                <div ref={holderRef} className="apw-diagram" aria-label={t.title} />
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        .apw-open {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0; border: none; background: none; cursor: pointer;
          color: #8893a0; font-family: inherit; font-size: 0.86rem;
          transition: color 0.15s;
        }
        .apw-open:hover { color: #c4a5ff; }

        .apw-modal { position: fixed; inset: 0; z-index: 2147483200; display: flex; align-items: center; justify-content: center; padding: clamp(0.6rem, 3vw, 2rem); font-family: "Titillium Web", Geneva, Tahoma, sans-serif; }
        .apw-backdrop { position: absolute; inset: 0; background: rgba(4, 6, 10, 0.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: apw-fade 0.2s ease; }
        .apw-dialog {
          position: relative; z-index: 1;
          width: min(1000px, 100%); max-height: min(90vh, 940px);
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

        .apw-body { padding: clamp(0.8rem, 3vw, 1.5rem); overflow: auto; }
        .apw-msg { color: #97a1ad; font-size: 0.9rem; text-align: center; padding: 2rem 0; }
        .apw-diagram { display: flex; justify-content: center; min-width: min-content; }
        .apw-diagram svg { max-width: 100%; height: auto; }
        /* La numerazione (autonumber) resta leggibile sul cerchio accento */
        .apw-diagram :where(text.sequenceNumber) { fill: #ffffff; }

        @keyframes apw-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes apw-pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .apw-backdrop, .apw-dialog { animation: none; } }
      `}</style>
    </>
  );
}
