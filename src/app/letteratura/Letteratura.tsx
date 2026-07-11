import { useEffect, useState, useMemo } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  ArrowLeft,
  ArrowUp,
  Download,
  Printer,
  GraduationCap,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  HelpCircle,
  Quote,
  BookMarked,
  Lightbulb,
  Link2,
  // glyph dei moduli
  FlaskConical,
  Anchor,
  Split,
  Zap,
  Crown,
  Venus,
  Feather,
  Moon,
  Drama,
  Cigarette,
  HeartHandshake,
  Waves,
  Library,
  Globe2,
  PenLine,
} from "lucide-react";
import { MODULI, type Modulo, type QA } from "./schemi";

// ─────────────────────────────────────────────────────────────────────────────
// /letteratura — Hub di studio per la Maturità 2026 (Letteratura italiana).
//
// Uno schema per ogni autore/argomento del programma, ciascuno con: sintesi,
// fatti chiave, concetti da definire, testi in programma, collegamenti e — il
// cuore della pagina — le DOMANDE che la prof può fare all'orale, con risposta
// a scomparsa per autointerrogarsi. Stesso look "dark premium" (accento VIOLA su
// fondo scuro e superfici "vetro") di /me-stesso, /dubliners e /gattopardo.
// Pagina autosufficiente: header, footer e stile inline qui dentro.
// ─────────────────────────────────────────────────────────────────────────────

// Glyph per ogni modulo (mappa chiave → icona lucide).
function ModuloIcon({ name, size = 26 }: { name: string; size?: number }) {
  const sw = 1.9;
  const p = { size, strokeWidth: sw } as const;
  switch (name) {
    case "flask":      return <FlaskConical {...p} />;
    case "anchor":     return <Anchor {...p} />;
    case "split":      return <Split {...p} />;
    case "zap":        return <Zap {...p} />;
    case "crown":      return <Crown {...p} />;
    case "venus":      return <Venus {...p} />;
    case "feather":    return <Feather {...p} />;
    case "moon":       return <Moon {...p} />;
    case "masks":      return <Drama {...p} />;
    case "cigarette":  return <Cigarette {...p} />;
    case "book-heart": return <HeartHandshake {...p} />;
    case "waves":      return <Waves {...p} />;
    case "library":    return <Library {...p} />;
    case "globe":      return <Globe2 {...p} />;
    case "pen":        return <PenLine {...p} />;
    default:           return <BookMarked {...p} />;
  }
}

// Mini-renderer: trasforma **testo** in <strong> (le stringhe dei dati usano
// questa convenzione). Niente HTML arbitrario: solo grassetto.
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((seg, i) =>
        seg.startsWith("**") && seg.endsWith("**") ? (
          <strong key={i}>{seg.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{seg}</span>
        ),
      )}
    </>
  );
}

// Singola domanda d'orale: clic per rivelare la risposta-modello.
function Domanda({ qa, open, onToggle }: { qa: QA; open: boolean; onToggle: () => void }) {
  return (
    <div className={`lt-qa${open ? " is-open" : ""}`}>
      <button type="button" className="lt-qa-q" aria-expanded={open} onClick={onToggle}>
        <span className="lt-qa-mark" aria-hidden="true"><HelpCircle size={18} /></span>
        <span className="lt-qa-text">{qa.q}</span>
        <ChevronDown size={18} className="lt-qa-chev" aria-hidden="true" />
      </button>
      <div className="lt-qa-a" role="region" hidden={!open}>
        <p><RichText text={qa.a} /></p>
      </div>
    </div>
  );
}

// Una scheda-modulo completa. Con `forceOpen` (controllo globale "Apri tutto")
// tutte le domande risultano aperte, ignorando lo stato locale.
function Scheda({ m, forceOpen = false }: { m: Modulo; forceOpen?: boolean }) {
  // Apertura indipendente per ogni domanda; "espandi/comprimi tutte" per modulo.
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  const allLocalOpen = openSet.size === m.domande.length && m.domande.length > 0;

  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const toggleAll = () =>
    setOpenSet(allLocalOpen ? new Set() : new Set(m.domande.map((_, i) => i)));

  return (
    <section className="lt-card" id={m.id} aria-labelledby={`${m.id}-title`}>
      {/* Intestazione della scheda */}
      <header className="lt-card-head">
        <span className="lt-card-ic" aria-hidden="true"><ModuloIcon name={m.icon} /></span>
        <div className="lt-card-headtext">
          <span className="lt-card-kicker">{m.n} — {m.kicker}</span>
          <h2 className="lt-card-title" id={`${m.id}-title`}>{m.title}</h2>
          {m.meta && <span className="lt-card-meta">{m.meta}</span>}
        </div>
      </header>

      {/* Sintesi */}
      <p className="lt-lead"><RichText text={m.lead} /></p>

      {/* Fatti chiave */}
      {m.facts && m.facts.length > 0 && (
        <div className="lt-facts">
          {m.facts.map((f) => (
            <div className="lt-fact" key={f.label}>
              <span className="lt-fact-value">{f.value}</span>
              <span className="lt-fact-label">{f.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Concetti chiave */}
      {m.concetti && m.concetti.length > 0 && (
        <div className="lt-block">
          <p className="lt-block-h"><Lightbulb size={16} aria-hidden="true" /> Concetti chiave</p>
          <dl className="lt-concetti">
            {m.concetti.map((c) => (
              <div className="lt-concetto" key={c.term}>
                <dt>{c.term}</dt>
                <dd><RichText text={c.def} /></dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Testi in programma */}
      {m.testi && m.testi.length > 0 && (
        <div className="lt-block">
          <p className="lt-block-h"><BookMarked size={16} aria-hidden="true" /> Testi in programma</p>
          <ul className="lt-testi">
            {m.testi.map((t) => (
              <li key={t.title}>
                <span className="lt-testo-title">«{t.title}»</span>
                {t.opera && <span className="lt-testo-opera"> — {t.opera}</span>}
                {t.note && <span className="lt-testo-note">{t.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collegamenti per il colloquio */}
      {m.collegamenti && m.collegamenti.length > 0 && (
        <div className="lt-block">
          <p className="lt-block-h"><Link2 size={16} aria-hidden="true" /> Collegamenti</p>
          <div className="lt-links">
            {m.collegamenti.map((c) => (
              <span className="lt-link-chip" key={c}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Domande d'orale */}
      <div className="lt-block lt-block--qa">
        <div className="lt-qa-head">
          <p className="lt-block-h lt-block-h--accent">
            <Quote size={16} aria-hidden="true" /> Possibili domande all'orale
            <span className="lt-qa-count">{m.domande.length}</span>
          </p>
          {!forceOpen && (
            <button type="button" className="lt-toggle-all" onClick={toggleAll}>
              {allLocalOpen ? (
                <><ChevronsDownUp size={15} aria-hidden="true" /> Comprimi tutte</>
              ) : (
                <><ChevronsUpDown size={15} aria-hidden="true" /> Espandi tutte</>
              )}
            </button>
          )}
        </div>
        <div className="lt-qa-list">
          {m.domande.map((qa, i) => (
            <Domanda key={i} qa={qa} open={forceOpen || openSet.has(i)} onToggle={() => toggle(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Letteratura() {
  const [showTop, setShowTop] = useState(false);
  const [activeId, setActiveId] = useState<string>(MODULI[0]?.id ?? "");
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Letteratura · Maturità 2026 — schemi & domande d'orale";
    return () => { document.title = prev; };
  }, []);

  // Pulsante "torna su".
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Evidenzia nell'indice il modulo attualmente in vista.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    MODULI.forEach((m) => {
      const el = document.getElementById(m.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const totDomande = useMemo(
    () => MODULI.reduce((acc, m) => acc + m.domande.length, 0),
    [],
  );

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="it-page-wrapper lt-page">
      {/* Header compatto */}
      <header className="lt-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="lt-brand text-decoration-none d-inline-flex align-items-center">
              <span className="lt-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="lt-brand-text">
                <span className="lt-brand-title">Alberto Pecchini</span>
                <span className="lt-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </Link>
            <div className="d-inline-flex align-items-center gap-2">
              <a
                href="/schemi-orale-letteratura.pdf"
                download
                className="lt-print-btn"
              >
                <Download size={16} aria-hidden="true" />
                <span>Scarica PDF</span>
              </a>
              <Link to="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
                <ArrowLeft size={16} className="me-1" aria-hidden="true" />
                <span className="d-none d-sm-inline">Torna alla home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero */}
        <section className="lt-hero">
          <div className="container">
            <span className="lt-hero-badge" aria-hidden="true">
              <GraduationCap size={44} strokeWidth={1.75} />
            </span>
            <p className="lt-kicker">Maturità 2026 · Classe 5T</p>
            <h1 className="lt-hero-title">Letteratura italiana</h1>
            <span className="lt-hero-rule" aria-hidden="true" />
            <p className="lt-hero-lead">
              Schemi di studio per <strong>ogni autore e argomento</strong> del programma — e, per ciascuno,
              le <strong>domande che la prof può fare all'orale</strong>, con risposta a scomparsa per
              ripassare e autointerrogarsi.
            </p>
            <div className="lt-hero-stats">
              <span className="lt-stat"><strong>{MODULI.length}</strong> moduli</span>
              <span className="lt-stat"><strong>{totDomande}</strong> domande d'orale</span>
              <span className="lt-stat"><strong>1870 → 1971</strong> dal Naturalismo a Satura</span>
            </div>
            <div className="lt-hero-actions">
              <div className="lt-hero-btns">
                <a href="/schemi-orale-letteratura.pdf" download className="lt-print-cta">
                  <Download size={18} aria-hidden="true" /> Scarica il PDF (tutti gli schemi)
                </a>
                <button
                  type="button"
                  className={`lt-expand-cta${expandAll ? " is-on" : ""}`}
                  aria-pressed={expandAll}
                  onClick={() => setExpandAll((v) => !v)}
                >
                  {expandAll ? (
                    <><ChevronsDownUp size={18} aria-hidden="true" /> Chiudi tutti gli schemi</>
                  ) : (
                    <><ChevronsUpDown size={18} aria-hidden="true" /> Apri tutti gli schemi</>
                  )}
                </button>
                <button type="button" className="lt-expand-cta lt-print-ghost" onClick={() => window.print()}>
                  <Printer size={18} aria-hidden="true" /> Stampa la pagina
                </button>
              </div>
              <span className="lt-hero-hint">
                Il <strong>PDF</strong> raccoglie tutti gli schemi in versione descrittiva, già impaginati e pronti
                da stampare — il modo più sicuro per studiare offline. In alternativa, «Apri tutti gli schemi»
                mostra a video ogni domanda con la risposta.
              </span>
            </div>
          </div>
        </section>

        {/* ② Indice navigabile */}
        <nav className="lt-toc" aria-label="Indice degli argomenti">
          <div className="container">
            <div className="lt-toc-scroll">
              {MODULI.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`lt-toc-chip${activeId === m.id ? " is-active" : ""}`}
                  onClick={() => scrollTo(m.id)}
                >
                  <span className="lt-toc-n">{m.n}</span>
                  <span className="lt-toc-ic" aria-hidden="true"><ModuloIcon name={m.icon} size={16} /></span>
                  {m.title}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* ③ Le schede */}
        <section className="lt-body">
          <div className="container">
            <div className="lt-grid">
              {MODULI.map((m) => (
                <Scheda key={m.id} m={m} forceOpen={expandAll} />
              ))}
            </div>
          </div>
        </section>

        {/* ④ Banda metodo di studio */}
        <section className="lt-band">
          <div className="container">
            <p className="lt-kicker lt-band-kicker">Metodo</p>
            <h2 className="lt-band-title">Come usare questi schemi</h2>
            <div className="lt-method">
              <div className="lt-method-step">
                <span className="lt-method-n">1</span>
                <p><strong>Leggi la sintesi</strong> di ogni modulo: è «la cosa principale», quella da non dimenticare mai.</p>
              </div>
              <div className="lt-method-step">
                <span className="lt-method-n">2</span>
                <p><strong>Memorizza i concetti</strong> e i testi: sono le definizioni che la prof vuole sentire precise.</p>
              </div>
              <div className="lt-method-step">
                <span className="lt-method-n">3</span>
                <p><strong>Autointerrogati</strong>: leggi la domanda a risposta chiusa, prova a rispondere ad alta voce, poi apri e confronta.</p>
              </div>
              <div className="lt-method-step">
                <span className="lt-method-n">4</span>
                <p><strong>Allena i collegamenti</strong>: all'orale vale di più saper passare da un autore all'altro che ripetere a memoria.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* Torna su */}
      <button
        type="button"
        className={`lt-top${showTop ? " is-visible" : ""}`}
        aria-label="Torna su"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ArrowUp size={20} aria-hidden="true" />
      </button>

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Look "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso,
           /dubliners e /gattopardo). Sfondo scuro profondo, superfici "vetro",
           neon viola. Pagina autosufficiente.
           ───────────────────────────────────────────────────────────────────── */
        .lt-page {
          --accent: #e95420;
          --accent-2: #dd4814;
          --accent-deep: #bc3d10;
          --ink: #f6a583;
          --glow: rgba(233, 84, 32, 0.45);
          --text: #f5f3f1;
          --sub: #b3aca6;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(233, 84, 32, 0.10);
          --vio-bd: rgba(233, 84, 32, 0.28);
          --panel: linear-gradient(160deg, #221a20 0%, #2a1e26 45%, #241c22 100%);
          min-height: 100vh;
          font-family: "Ubuntu", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(233, 84, 32, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #241c22 0%, #1b151a 100%);
        }
        .lt-page .btn-outline-light { border-color: rgba(255, 255, 255, 0.4); color: #ffffff; }
        .lt-page .btn-outline-light:hover,
        .lt-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #ffffff !important;
        }
        .lt-kicker {
          text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.8rem;
          font-weight: 800; color: var(--ink); margin: 0 0 0.6rem;
        }

        /* Header — vetro scuro con filo viola */
        .lt-header {
          background: rgba(28, 22, 27, 0.82); position: sticky; top: 0; z-index: 30;
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .lt-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .lt-brand-mark img { width: 100%; height: 100%; display: block; }
        .lt-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .lt-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .lt-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .lt-brand-tagline { display: none; } }

        /* Pulsante stampa (header) */
        .lt-print-btn {
          display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer;
          padding: 0.32rem 0.85rem; border-radius: 999px; font-family: inherit;
          font-size: 0.85rem; font-weight: 700; line-height: 1.4;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 6px 18px var(--glow); transition: transform .15s, box-shadow .15s;
        }
        .lt-print-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px var(--glow); }

        /* Hero */
        .lt-hero {
          position: relative; overflow: hidden; text-align: center;
          padding: clamp(3rem, 7vw, 5.5rem) 0 clamp(2.5rem, 5vw, 3.5rem);
          background:
            radial-gradient(90% 120% at 50% 0%, rgba(233, 84, 32, 0.22) 0%, transparent 55%),
            var(--panel);
          border-bottom: 1px solid var(--surface-bd);
        }
        .lt-hero::before, .lt-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(70px); opacity: 0.4; pointer-events: none; z-index: 0;
        }
        .lt-hero::before { background: #e95420; top: -34%; right: -8%; }
        .lt-hero::after  { background: #bc3d10; bottom: -38%; left: -10%; opacity: 0.3; }
        .lt-hero .container { position: relative; z-index: 1; }
        .lt-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px; margin-bottom: 1.4rem;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28); color: #ffffff;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .lt-hero-title {
          font-size: clamp(2.5rem, 7vw, 4.4rem); font-weight: 800;
          line-height: 1.02; letter-spacing: -0.02em; color: #ffffff; margin: 0 0 1rem;
        }
        .lt-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px; margin: 0 auto 1.2rem;
          background: var(--accent); box-shadow: 0 0 18px var(--glow);
        }
        .lt-hero-lead {
          font-size: clamp(1.05rem, 1.8vw, 1.28rem); line-height: 1.65; color: rgba(255,255,255,0.82);
          max-width: 46rem; margin: 0 auto 1.8rem;
        }
        .lt-hero-lead strong { color: #ffffff; }
        .lt-hero-stats { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.7rem; }
        .lt-stat {
          display: inline-flex; align-items: baseline; gap: 0.4rem;
          padding: 0.5rem 1.1rem; border-radius: 999px;
          background: var(--surface); border: 1px solid var(--surface-bd);
          font-size: 0.9rem; color: var(--sub);
        }
        .lt-stat strong { color: var(--ink); font-size: 1.05rem; font-weight: 800; }
        .lt-hero-actions {
          display: flex; flex-direction: column; align-items: center; gap: 0.7rem; margin-top: 1.8rem;
        }
        .lt-hero-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.7rem; }
        .lt-expand-cta {
          display: inline-flex; align-items: center; gap: 0.55rem; cursor: pointer;
          padding: 0.75rem 1.4rem; border-radius: 999px; font-family: inherit;
          font-size: 1rem; font-weight: 700;
          background: var(--vio-soft); color: var(--text); border: 1.5px solid var(--vio-bd);
          transition: background .15s, color .15s, border-color .15s, transform .15s;
        }
        .lt-expand-cta:hover { transform: translateY(-2px); color: #fff; border-color: var(--accent); background: rgba(233, 84, 32,0.16); }
        .lt-expand-cta.is-on { background: rgba(233, 84, 32,0.18); color: #fff; border-color: var(--accent); }
        .lt-print-cta {
          display: inline-flex; align-items: center; gap: 0.55rem; cursor: pointer;
          padding: 0.75rem 1.6rem; border-radius: 999px; font-family: inherit;
          font-size: 1rem; font-weight: 700;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 10px 28px var(--glow); transition: transform .15s, box-shadow .15s;
        }
        .lt-print-cta:hover { transform: translateY(-2px); box-shadow: 0 14px 34px var(--glow); }
        .lt-hero-hint { font-size: 0.85rem; color: var(--sub); max-width: 34rem; line-height: 1.5; }

        /* Indice navigabile (sticky sotto l'header) */
        .lt-toc {
          position: sticky; top: 66px; z-index: 20;
          background: rgba(9, 12, 16, 0.92);
          backdrop-filter: blur(12px) saturate(130%);
          -webkit-backdrop-filter: blur(12px) saturate(130%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .lt-toc-scroll {
          display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.7rem 0;
          scrollbar-width: thin; scrollbar-color: var(--vio-bd) transparent;
        }
        .lt-toc-scroll::-webkit-scrollbar { height: 6px; }
        .lt-toc-scroll::-webkit-scrollbar-thumb { background: var(--vio-bd); border-radius: 999px; }
        .lt-toc-chip {
          display: inline-flex; align-items: center; gap: 0.45rem; white-space: nowrap;
          padding: 0.45rem 0.9rem; border-radius: 999px; cursor: pointer;
          background: var(--surface); border: 1px solid var(--surface-bd);
          color: var(--sub); font-family: inherit; font-size: 0.85rem; font-weight: 700;
          transition: background .15s, border-color .15s, color .15s, transform .15s;
        }
        .lt-toc-chip:hover { color: #fff; border-color: var(--vio-bd); transform: translateY(-1px); }
        .lt-toc-chip.is-active {
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border-color: rgba(255,255,255,0.2); box-shadow: 0 6px 18px var(--glow);
        }
        .lt-toc-n { font-size: 0.72rem; opacity: 0.7; font-weight: 800; }
        .lt-toc-chip.is-active .lt-toc-n { opacity: 0.9; }
        .lt-toc-ic { display: inline-flex; }
        @media (max-width: 575.98px) { .lt-toc-ic { display: none; } }

        /* Corpo */
        .lt-body { padding: clamp(2rem, 5vw, 3.5rem) 0 clamp(2.5rem, 6vw, 4rem); }
        .lt-grid { display: flex; flex-direction: column; gap: clamp(1.5rem, 3vw, 2.2rem); }

        /* Scheda-modulo */
        .lt-card {
          scroll-margin-top: 130px;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-radius: 20px;
          padding: clamp(1.4rem, 3vw, 2.2rem);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
        }
        .lt-card-head { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.2rem; }
        .lt-card-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 60px; height: 60px; border-radius: 16px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: 1px solid rgba(255,255,255,0.22);
          box-shadow: 0 10px 28px var(--glow), inset 0 1px 0 rgba(255,255,255,0.22);
        }
        .lt-card-headtext { min-width: 0; }
        .lt-card-kicker {
          display: block; text-transform: uppercase; letter-spacing: 0.14em;
          font-size: 0.72rem; font-weight: 800; color: var(--ink); margin-bottom: 0.25rem;
        }
        .lt-card-title { font-size: clamp(1.5rem, 3.4vw, 2rem); font-weight: 800; color: #fff; margin: 0; line-height: 1.12; }
        .lt-card-meta { display: block; font-size: 0.92rem; color: var(--sub); margin-top: 0.25rem; }

        .lt-lead {
          font-size: 1.08rem; line-height: 1.7; color: var(--sub);
          margin: 0 0 1.5rem; padding-left: 1rem; border-left: 3px solid var(--vio-bd);
        }
        .lt-lead strong { color: #fff; }

        /* Fatti chiave */
        .lt-facts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1.6rem;
        }
        .lt-fact {
          display: flex; flex-direction: column; gap: 0.25rem;
          padding: 0.9rem 1rem; border-radius: 13px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .lt-fact-value { font-size: 1.02rem; font-weight: 800; color: #fff; line-height: 1.15; }
        .lt-fact-label { font-size: 0.8rem; color: var(--sub); line-height: 1.35; }
        @media (max-width: 767.98px) { .lt-facts { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 420px) { .lt-facts { grid-template-columns: 1fr; } }

        /* Blocchi (concetti / testi / collegamenti / domande) */
        .lt-block { margin-top: 1.5rem; }
        .lt-block-h {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--text); margin: 0 0 0.85rem;
        }
        .lt-block-h svg { color: var(--ink); }
        .lt-block-h--accent { color: var(--ink); }

        /* Concetti */
        .lt-concetti { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin: 0; }
        .lt-concetto {
          padding: 0.95rem 1.1rem; border-radius: 13px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--surface-bd);
        }
        .lt-concetto dt { font-weight: 800; color: #fff; font-size: 0.98rem; margin-bottom: 0.25rem; }
        .lt-concetto dd { margin: 0; font-size: 0.9rem; line-height: 1.55; color: var(--sub); }
        .lt-concetto dd strong { color: var(--ink); font-weight: 700; }
        @media (max-width: 767.98px) { .lt-concetti { grid-template-columns: 1fr; } }

        /* Testi */
        .lt-testi { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
        .lt-testi li {
          padding: 0.7rem 1rem; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--surface-bd);
          border-left: 3px solid var(--accent);
        }
        .lt-testo-title { font-weight: 800; color: #fff; }
        .lt-testo-opera { color: var(--ink); font-weight: 600; }
        .lt-testo-note { display: block; font-size: 0.86rem; color: var(--sub); margin-top: 0.2rem; line-height: 1.5; }

        /* Collegamenti */
        .lt-links { display: flex; flex-direction: column; gap: 0.5rem; }
        .lt-link-chip {
          padding: 0.55rem 0.95rem; border-radius: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
          color: var(--text); font-size: 0.9rem; font-weight: 600; line-height: 1.45;
        }

        /* Domande d'orale */
        .lt-block--qa {
          margin-top: 1.8rem; padding-top: 1.5rem; border-top: 1px dashed var(--vio-bd);
        }
        .lt-qa-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .lt-qa-head .lt-block-h { margin: 0; }
        .lt-qa-count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 22px; height: 22px; padding: 0 0.4rem; border-radius: 999px;
          background: var(--accent); color: #ffffff; font-size: 0.74rem; font-weight: 800; margin-left: 0.2rem;
        }
        .lt-toggle-all {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.85rem; border-radius: 999px; cursor: pointer;
          background: transparent; border: 1px solid var(--vio-bd); color: var(--ink);
          font-family: inherit; font-size: 0.82rem; font-weight: 700;
          transition: background .15s, color .15s;
        }
        .lt-toggle-all:hover { background: var(--vio-soft); color: #fff; }

        .lt-qa-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .lt-qa {
          border-radius: 13px; overflow: hidden;
          background: rgba(255,255,255,0.03); border: 1px solid var(--surface-bd);
          transition: border-color .15s, box-shadow .15s;
        }
        .lt-qa.is-open { border-color: var(--vio-bd); box-shadow: 0 10px 26px rgba(0,0,0,0.35); }
        .lt-qa-q {
          width: 100%; display: flex; align-items: center; gap: 0.7rem; text-align: left;
          padding: 0.9rem 1.1rem; background: none; border: none; cursor: pointer;
          color: #fff; font-family: inherit; font-size: 1rem; font-weight: 700; line-height: 1.4;
        }
        .lt-qa-mark {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .lt-qa-text { flex: 1 1 auto; min-width: 0; }
        .lt-qa-chev { flex-shrink: 0; color: var(--ink); transition: transform .2s; }
        .lt-qa.is-open .lt-qa-chev { transform: rotate(180deg); }
        .lt-qa-a {
          padding: 0 1.1rem 1.05rem calc(1.1rem + 34px + 0.7rem);
        }
        .lt-qa-a p { margin: 0; font-size: 0.96rem; line-height: 1.68; color: var(--sub); }
        .lt-qa-a strong { color: #fff; font-weight: 700; }
        @media (max-width: 575.98px) {
          .lt-qa-a { padding-left: 1.1rem; }
        }

        /* Banda metodo */
        .lt-band {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 6vw, 4.5rem) 0;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(233, 84, 32, 0.25) 0%, transparent 55%),
            linear-gradient(135deg, #2a1e26 0%, #322330 55%, #221a20 100%);
          border-top: 1px solid var(--surface-bd);
        }
        .lt-band-kicker { color: var(--ink); }
        .lt-band-title { font-size: clamp(1.7rem, 4vw, 2.4rem); font-weight: 800; color: #fff; margin: 0 0 1.8rem; }
        .lt-method { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .lt-method-step {
          padding: 1.2rem; border-radius: 16px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14);
        }
        .lt-method-n {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%; margin-bottom: 0.7rem;
          background: var(--accent); color: #ffffff; font-weight: 800; font-size: 1.1rem;
        }
        .lt-method-step p { margin: 0; color: rgba(255,255,255,0.82); line-height: 1.55; font-size: 0.95rem; }
        .lt-method-step strong { color: #fff; }
        @media (max-width: 991.98px) { .lt-method { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .lt-method { grid-template-columns: 1fr; } }

        /* Footer */
        .lt-footer { background-color: #1b151a; color: #ffffff; border-top: 1px solid var(--surface-bd); }

        /* Torna su */
        .lt-top {
          position: fixed; right: 1.2rem; bottom: 1.2rem; z-index: 40;
          width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 10px 28px var(--glow);
          opacity: 0; visibility: hidden; transform: translateY(10px);
          transition: opacity .2s, transform .2s, visibility .2s;
        }
        .lt-top.is-visible { opacity: 1; visibility: visible; transform: translateY(0); }
        .lt-top:hover { transform: translateY(-2px); }

        @media (prefers-reduced-motion: reduce) {
          .lt-toc-chip, .lt-qa, .lt-qa-chev, .lt-top { transition: none; }
        }

        /* ─────────────────────────────────────────────────────────────────────
           STAMPA / PDF — tema chiaro leggibile su carta. Tutte le risposte si
           aprono, si nasconde la "chrome" interattiva (header, indice, pulsanti),
           si evita di spezzare le singole domande tra due pagine.
           ───────────────────────────────────────────────────────────────────── */
        @media print {
          @page { margin: 1.4cm; }

          /* Fondo bianco e testo scuro su tutta la pagina */
          .lt-page {
            background: #ffffff !important;
            color: #15171c !important;
            font-size: 11pt;
          }
          .lt-page * {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            box-shadow: none !important; text-shadow: none !important;
          }

          /* Via la chrome che non serve su carta */
          .lt-header, .lt-toc, .lt-top, .lt-toggle-all, .lt-qa-chev,
          .lt-band, .lt-footer, .lt-hero-actions, .lt-hero::before, .lt-hero::after {
            display: none !important;
          }

          /* Hero compatto */
          .lt-hero {
            background: none !important; border-bottom: 2px solid #bc3d10 !important;
            padding: 0 0 0.6cm !important; text-align: left;
          }
          .lt-hero-badge { display: none !important; }
          .lt-hero-title { color: #15171c !important; font-size: 24pt !important; margin-bottom: 0.2cm; }
          .lt-hero-rule { display: none !important; }
          .lt-hero-lead { color: #333 !important; font-size: 11pt !important; margin-bottom: 0.3cm; }
          .lt-hero-lead strong, .lt-kicker { color: #bc3d10 !important; }
          .lt-hero-stats { gap: 0.4rem; }
          .lt-stat { border: 1px solid #ccc !important; background: none !important; color: #333 !important; }
          .lt-stat strong { color: #bc3d10 !important; }

          /* Schede: niente sfondo vetro, solo bordo leggero; non spezzare l'header */
          .lt-body { padding: 0.4cm 0 !important; }
          .lt-grid { gap: 0.5cm !important; }
          .lt-card {
            background: none !important; border: 1px solid #d4d4d8 !important;
            border-radius: 10px !important; padding: 0.5cm !important;
            break-inside: auto;
          }
          .lt-card-head { break-after: avoid; }
          .lt-card-ic {
            background: #ece8ff !important; color: #bc3d10 !important;
            border: 1px solid #cdbcff !important; width: 44px; height: 44px;
          }
          .lt-card-kicker, .lt-card-meta { color: #bc3d10 !important; }
          .lt-card-title { color: #15171c !important; }

          .lt-lead { color: #222 !important; border-left-color: #bc3d10 !important; }
          .lt-lead strong { color: #000 !important; }

          /* Fatti / concetti / testi: bianco con bordo, testo scuro */
          .lt-fact, .lt-concetto, .lt-testi li, .lt-link-chip, .lt-qa {
            background: #fafafa !important; border: 1px solid #d4d4d8 !important;
            break-inside: avoid;
          }
          .lt-testi li { border-left: 3px solid #bc3d10 !important; }
          .lt-fact-value, .lt-concetto dt, .lt-testo-title { color: #15171c !important; }
          .lt-fact-label, .lt-concetto dd, .lt-testo-note, .lt-link-chip { color: #333 !important; }
          .lt-concetto dd strong, .lt-testo-opera { color: #bc3d10 !important; }
          .lt-block-h, .lt-block-h svg, .lt-block-h--accent { color: #15171c !important; }
          .lt-block-h svg { color: #bc3d10 !important; }

          /* Domande: tutte aperte, ben distinte */
          .lt-block--qa { border-top: 1px solid #d4d4d8 !important; }
          .lt-qa-count { background: #bc3d10 !important; color: #fff !important; }
          .lt-qa-q { color: #15171c !important; font-size: 11pt !important; padding-bottom: 0.15cm; }
          .lt-qa-mark {
            background: #ece8ff !important; color: #bc3d10 !important; border: 1px solid #cdbcff !important;
          }
          /* Mostra SEMPRE la risposta in stampa, anche se l'accordion è chiuso */
          .lt-page .lt-qa-a { display: block !important; }
          .lt-qa-a p { color: #222 !important; }
          .lt-qa-a strong { color: #000 !important; }

          a { color: #bc3d10 !important; text-decoration: none; }
        }
      `}</style>
    </div>
  );
}
