import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SiClaude, SiGithub, SiVercel } from "react-icons/si";
import {
  IcFlow, IcClose, IcUser, IcBrowser, IcCloud,
  IcTerminal, IcGitBranch, IcGlobe, IcZap,
} from "./homeIcons";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import "./workflow.css";

// ─────────────────────────────────────────────────────────────────────────────
// "Come funziona" — il GIRO DEI DATI del sito come diagramma di sequenza: dallo
// sviluppo locale al deploy Vercel, fino ai dati live a runtime (GitHub API,
// Supabase, funzioni serverless → Resend).
//
// Lo STESSO diagramma è nel README (blocco ```mermaid); qui però NON si usa
// Mermaid: il diagramma è disegnato con la griglia .apw- in veste .sb- (vedi
// workflow.css), così segue il tema chiaro/scuro del sito, si rimpicciolisce in
// un elenco di passi sul telefono e non porta con sé una libreria intera.
// Multilingua: i testi vengono dalla lingua attiva; i token tecnici (comandi,
// protocolli, formati) restano fissi e si riconoscono dal carattere a spaziatura
// fissa. Tutta la finestra è data-no-i18n: le lingue le fa questa tabella.
// ─────────────────────────────────────────────────────────────────────────────

type Copy = {
  open: string; title: string; subtitle: string; close: string;
  dev: string; ext: string;
  p1: string; p2: string; p3: string; p4: string;
  ask: string; newCommit: string; deployOk: string; spa: string;
  profileEvents: string; sparkline: string; leaderboards: string;
  festaVote: string; sendEmail: string;
  steps: string; actors: string; req: string; res: string; hint: string;
};

const T: Record<Lang, Copy> = {
  it: {
    open: "Come funziona", title: "Il giro dei dati — dal codice all'online",
    subtitle: "sviluppo → build → deploy → online → browser", close: "Chiudi",
    dev: "Alberto · dev", ext: "API e servizi esterni",
    p1: "Sviluppo locale (codifiche)", p2: "Build e deploy (CI)",
    p3: "Un utente apre il sito", p4: "Dati live a runtime",
    ask: "«fai la modifica X»", newCommit: "nuovo commit su main", deployOk: "deploy ok",
    spa: "SPA React + service worker (precache offline)",
    profileEvents: "profilo / eventi", sparkline: "sparkline dei commit",
    leaderboards: "classifiche + aggiornamenti live",
    festaVote: "voto Festa", sendEmail: "invio email",
    steps: "passi", actors: "partecipanti", req: "richiesta", res: "risposta",
    hint: "tocca un partecipante per seguirne il filo",
  },
  en: {
    open: "How it works", title: "The data journey — from code to online",
    subtitle: "development → build → deploy → online → browser", close: "Close",
    dev: "Alberto · dev", ext: "External APIs and services",
    p1: "Local development (encodings)", p2: "Build and deploy (CI)",
    p3: "A user opens the site", p4: "Live data at runtime",
    ask: "«make change X»", newCommit: "new commit on main", deployOk: "deploy ok",
    spa: "React SPA + service worker (offline precache)",
    profileEvents: "profile / events", sparkline: "commit sparkline",
    leaderboards: "leaderboards + live updates",
    festaVote: "party RSVP", sendEmail: "send email",
    steps: "steps", actors: "participants", req: "request", res: "response",
    hint: "tap a participant to follow its thread",
  },
  fr: {
    open: "Fonctionnement", title: "Le parcours des données — du code au live",
    subtitle: "développement → build → déploiement → en ligne → navigateur", close: "Fermer",
    dev: "Alberto · dev", ext: "API et services externes",
    p1: "Développement local (encodages)", p2: "Build et déploiement (CI)",
    p3: "Un utilisateur ouvre le site", p4: "Données live à l'exécution",
    ask: "« fais la modif X »", newCommit: "nouveau commit sur main", deployOk: "déploiement ok",
    spa: "SPA React + service worker (precache hors-ligne)",
    profileEvents: "profil / événements", sparkline: "sparkline des commits",
    leaderboards: "classements + màj live",
    festaVote: "vote fête", sendEmail: "envoi email",
    steps: "étapes", actors: "participants", req: "requête", res: "réponse",
    hint: "touchez un participant pour suivre son fil",
  },
  de: {
    open: "Wie es funktioniert", title: "Der Datenfluss — vom Code bis online",
    subtitle: "Entwicklung → Build → Deploy → online → Browser", close: "Schließen",
    dev: "Alberto · dev", ext: "Externe APIs und Dienste",
    p1: "Lokale Entwicklung (Kodierungen)", p2: "Build und Deploy (CI)",
    p3: "Ein Nutzer öffnet die Seite", p4: "Live-Daten zur Laufzeit",
    ask: "„mach Änderung X\"", newCommit: "neuer Commit auf main", deployOk: "Deploy ok",
    spa: "React SPA + Service Worker (Offline-Precache)",
    profileEvents: "Profil / Events", sparkline: "Commit-Sparkline",
    leaderboards: "Ranglisten + Live-Updates",
    festaVote: "Fest-Zusage", sendEmail: "E-Mail senden",
    steps: "Schritte", actors: "Teilnehmer", req: "Anfrage", res: "Antwort",
    hint: "auf einen Teilnehmer tippen, um seinem Faden zu folgen",
  },
};

/* ── Partecipanti (le colonne del diagramma) ─────────────────────────────── */
const DEV = 0, CC = 1, GH = 2, VC = 3, BR = 4, EXT = 5;

type Actor = { id: number; name: (c: Copy) => string; ic: (s: number) => ReactNode };

const ACTORS: Actor[] = [
  { id: DEV, name: (c) => c.dev,            ic: (s) => <IcUser size={s} /> },
  { id: CC,  name: () => "Claude Code",     ic: (s) => <SiClaude size={s} /> },
  { id: GH,  name: () => "GitHub · main",   ic: (s) => <SiGithub size={s} /> },
  { id: VC,  name: () => "Vercel · CI/hosting", ic: (s) => <SiVercel size={s} /> },
  { id: BR,  name: () => "Browser · PWA",   ic: (s) => <IcBrowser size={s} /> },
  { id: EXT, name: (c) => c.ext,            ic: (s) => <IcCloud size={s} /> },
];

/* ── Il testo di un messaggio: prosa, token tecnici e separatori ─────────── */
type Part = { t: "txt" | "code" | "dot"; v?: string };
const txt = (v: string): Part => ({ t: "txt", v });
const code = (v: string): Part => ({ t: "code", v });
const dot = (): Part => ({ t: "dot" });

/* ── Lo spartito: fasi, messaggi, note tecniche e finestre di attività ───── */
type Step =
  | { k: "phase"; n: number; t: string; ic: ReactNode }
  | { k: "note"; over: number; lines: string[] }
  | { k: "msg"; from: number; to: number; parts: Part[]; reply?: boolean }
  | { k: "act"; p: number; on: boolean };

function script(c: Copy): Step[] {
  return [
    { k: "phase", n: 1, t: c.p1, ic: <IcTerminal size={15} /> },
    { k: "act", p: CC, on: true },
    { k: "msg", from: DEV, to: CC, parts: [txt(c.ask)] },
    { k: "note", over: CC, lines: ["build-cv.py → 4× PDF", "sharp → WebP", "import-trivia → JSON"] },
    { k: "msg", from: CC, to: GH, parts: [code("git commit + push → main")] },
    { k: "act", p: CC, on: false },

    { k: "phase", n: 2, t: c.p2, ic: <IcGitBranch size={15} /> },
    { k: "act", p: VC, on: true },
    { k: "msg", from: GH, to: VC, parts: [code("webhook"), dot(), txt(c.newCommit)] },
    {
      k: "note", over: VC,
      lines: [
        "prebuild · build-zips → ZIP",
        "vite build · Rollup → bundle JS/CSS",
        "vite-plugin-pwa · Workbox → service worker",
      ],
    },
    { k: "msg", from: VC, to: GH, parts: [txt(c.deployOk)], reply: true },
    { k: "act", p: VC, on: false },

    { k: "phase", n: 3, t: c.p3, ic: <IcGlobe size={15} /> },
    { k: "msg", from: BR, to: VC, parts: [code("GET /"), txt("(HTML · JS · CSS · WebP)")] },
    { k: "msg", from: VC, to: BR, parts: [txt(c.spa)], reply: true },

    { k: "phase", n: 4, t: c.p4, ic: <IcZap size={15} /> },
    { k: "msg", from: BR, to: EXT, parts: [code("GitHub API"), dot(), txt(c.profileEvents)] },
    { k: "msg", from: EXT, to: BR, parts: [code("JSON"), txt(`→ ${c.sparkline}`)], reply: true },
    { k: "msg", from: BR, to: EXT, parts: [code("Supabase"), dot(), code("REST + Realtime WS")] },
    { k: "msg", from: EXT, to: BR, parts: [txt(c.leaderboards)], reply: true },
    { k: "act", p: VC, on: true },
    { k: "msg", from: BR, to: VC, parts: [code("POST /api/notify"), dot(), txt(c.festaVote)] },
    { k: "msg", from: VC, to: EXT, parts: [code("Resend"), dot(), txt(c.sendEmail)] },
    { k: "msg", from: EXT, to: VC, parts: [code("202 accepted")], reply: true },
    { k: "msg", from: VC, to: BR, parts: [code("ok")], reply: true },
    { k: "act", p: VC, on: false },
  ];
}

/** Riga pronta da disegnare: numerata (i messaggi) e con chi è attivo lì. */
type Row =
  | { k: "phase"; n: number; t: string; ic: ReactNode }
  | { k: "note"; over: number; lines: string[]; act: boolean[] }
  | { k: "msg"; n: number; from: number; to: number; parts: Part[]; reply: boolean; act: boolean[] };

/** Srotola lo spartito: numera i messaggi e propaga le finestre di attività. */
function rowsOf(steps: Step[]): Row[] {
  const active = ACTORS.map(() => false);
  let n = 0;
  const out: Row[] = [];
  for (const s of steps) {
    if (s.k === "act") { active[s.p] = s.on; continue; }
    if (s.k === "phase") { out.push(s); continue; }
    if (s.k === "note") { out.push({ ...s, act: [...active] }); continue; }
    out.push({ k: "msg", n: ++n, from: s.from, to: s.to, parts: s.parts, reply: !!s.reply, act: [...active] });
  }
  return out;
}

/** Il testo del messaggio, con i token tecnici in carattere a spaziatura fissa.
    Flusso di testo normale (niente flex): così va a capo come una frase e il
    separatore "·" non resta appeso in fondo alla riga. */
function Parts({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          {p.t === "dot" ? (
            <span className="apw-dot" aria-hidden="true">·</span>
          ) : p.t === "code" ? (
            <code className="apw-code">{p.v}</code>
          ) : (
            p.v
          )}
        </Fragment>
      ))}
    </>
  );
}

export default function WorkflowModal() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => subscribeLang(setLang), []);

  // Sotto i 780px il diagramma a colonne non ci sta: diventa un elenco di passi.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 780px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Esc chiude + blocca lo scroll del body mentre è aperta.
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

  // Alla chiusura si riparte puliti: nessun partecipante rimasto a fuoco.
  useEffect(() => {
    if (!open) setFocus(null);
  }, [open]);

  const t = T[lang];
  const rows = useMemo(() => rowsOf(script(t)), [t]);
  const msgs = rows.filter((r) => r.k === "msg").length;

  /** La riga riguarda il partecipante messo a fuoco? */
  const inFocus = (r: Row) =>
    focus === null ||
    (r.k === "msg" ? r.from === focus || r.to === focus : r.k === "note" ? r.over === focus : true);

  const toggle = (id: number) => setFocus((f) => (f === id ? null : id));

  /* ── Diagramma a colonne ─────────────────────────────────────────────── */
  const diagram = (
    <>
      <div className="apw-heads">
        <div className="apw-heads-grid">
          {ACTORS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`apw-actor${focus === a.id ? " is-on" : ""}`}
              onClick={() => toggle(a.id)}
              aria-pressed={focus === a.id}
            >
              <span className="apw-actor-ic">{a.ic(16)}</span>
              <span className="apw-actor-name">{a.name(t)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="apw-rows">
        {rows.map((r, i) => {
          const style = { "--apw-i": Math.min(i, 22) } as React.CSSProperties;
          if (r.k === "phase") {
            return (
              <div className="apw-row" key={i} style={style}>
                <div className="apw-phase">
                  <span className="apw-phase-n">{r.n}</span>
                  {r.ic}
                  <span className="apw-phase-t">{r.t}</span>
                  <span className="apw-phase-rule" aria-hidden="true" />
                </div>
              </div>
            );
          }

          const lanes = (
            <div className="apw-lanes" aria-hidden="true">
              {ACTORS.map((a) => (
                <i
                  key={a.id}
                  className="apw-lane"
                  data-act={r.act[a.id] ? "1" : "0"}
                  data-on={focus === null || focus === a.id ? "1" : "0"}
                />
              ))}
            </div>
          );

          if (r.k === "note") {
            // La nota sta "sopra" il suo partecipante: la si allarga di una
            // colonna per lato, così resta centrata sul filo e leggibile.
            const lo = Math.max(0, Math.min(r.over - 1, ACTORS.length - 3));
            return (
              <div className="apw-row" key={i} style={style}>
                {lanes}
                <div
                  className="apw-note"
                  data-in={inFocus(r) ? "1" : "0"}
                  style={{ gridColumn: `${lo + 1} / ${lo + 4}` }}
                >
                  {r.lines.map((l) => (
                    <span className="apw-note-line" key={l}>
                      <i aria-hidden="true">▸</i>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          const lo = Math.min(r.from, r.to);
          const hi = Math.max(r.from, r.to);
          return (
            <div className="apw-row" key={i} style={style}>
              {lanes}
              <div
                className="apw-msg"
                data-dir={r.to > r.from ? "fwd" : "back"}
                data-reply={r.reply ? "1" : "0"}
                data-in={inFocus(r) ? "1" : "0"}
                style={{ gridColumn: `${lo + 1} / ${hi + 2}`, "--apw-span": hi - lo + 1 } as React.CSSProperties}
              >
                <span className="apw-msg-txt">
                  <span className="apw-n">{r.n}</span>
                  <Parts parts={r.parts} />
                </span>
                <span className="apw-wire" aria-hidden="true">
                  <i className="apw-wire-line" />
                  <i className="apw-wire-head" />
                  <i className="apw-packet" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  /* ── Elenco dei passi (schermi stretti) ──────────────────────────────── */
  const list = (
    <>
      <div className="apw-chips" role="group" aria-label={t.actors}>
        {ACTORS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`apw-chip${focus === a.id ? " is-on" : ""}`}
            onClick={() => toggle(a.id)}
            aria-pressed={focus === a.id}
          >
            {a.ic(14)}
            {a.name(t)}
          </button>
        ))}
      </div>

      <div className="apw-list">
        {rows.map((r, i) => {
          const style = { "--apw-i": Math.min(i, 22) } as React.CSSProperties;
          if (r.k === "phase") {
            return (
              <div className="apw-phase" key={i}>
                <span className="apw-phase-n">{r.n}</span>
                {r.ic}
                <span className="apw-phase-t">{r.t}</span>
              </div>
            );
          }
          if (r.k === "note") {
            return (
              <div className="apw-note" key={i} data-in={inFocus(r) ? "1" : "0"}>
                {r.lines.map((l) => (
                  <span className="apw-note-line" key={l}>
                    <i aria-hidden="true">▸</i>
                    {l}
                  </span>
                ))}
              </div>
            );
          }
          const from = ACTORS[r.from];
          const to = ACTORS[r.to];
          return (
            <div
              className="apw-item"
              key={i}
              style={style}
              data-reply={r.reply ? "1" : "0"}
              data-in={inFocus(r) ? "1" : "0"}
              data-act={r.act.some(Boolean) ? "1" : "0"}
            >
              <span className="apw-item-head">
                <span className="apw-n">{r.n}</span>
                <span className="apw-mini">{from.ic(13)}{from.name(t)}</span>
                <span className="apw-way" aria-hidden="true">{r.reply ? "⇢" : "→"}</span>
                <span className="apw-mini">{to.ic(13)}{to.name(t)}</span>
              </span>
              <span className="apw-msg-txt">
                <Parts parts={r.parts} />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <button type="button" className="apw-open" onClick={() => setOpen(true)} data-no-i18n>
        <IcFlow size={15} />
        {t.open}
      </button>

      {open &&
        createPortal(
          <div className="apw-modal" role="dialog" aria-modal="true" aria-label={t.title} data-no-i18n>
            <div className="apw-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="apw-dialog sb-home">
              <div className="apw-bar">
                <div className="apw-bar-txt">
                  <span className="apw-bar-title">
                    <IcFlow size={17} />
                    {t.title}
                    <span className="apw-tag">{msgs} {t.steps}</span>
                  </span>
                  <span className="apw-bar-sub">{t.subtitle}</span>
                </div>
                <button type="button" className="apw-close" onClick={() => setOpen(false)} aria-label={t.close}>
                  <IcClose size={18} />
                </button>
              </div>

              <div className="apw-body">
                <div className="apw-seq" data-focus={focus === null ? undefined : focus}>
                  {compact ? list : diagram}
                </div>
              </div>

              <div className="apw-foot">
                <span className="apw-legend">
                  <span><i aria-hidden="true" /> {t.req}</span>
                  <span><i className="is-reply" aria-hidden="true" /> {t.res}</span>
                  <span>{ACTORS.length} {t.actors}</span>
                </span>
                <span className="apw-foot-hint">{t.hint}</span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
