import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowUpRight, MapPin, GraduationCap, UserRound } from "lucide-react";
import InterestModal from "./InterestModal";
import { HOBBY, PASSIONI, SKILLS, type Interest } from "./data";

// ─────────────────────────────────────────────────────────────────────────────
// «Bio» — pagina About di Alberto Pecchini.
//
// Look "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso,
// /dubliners, /gattopardo e della home): fondo scuro profondo, superfici
// "vetro" e neon viola. Pagina autosufficiente: header, footer e stile sono
// inline qui dentro (come le altre pagine premium), così non dipende più dal
// vecchio SiteHeader/SiteFooter in stile chiaro. La modale degli interessi
// viene ri-stilizzata in dark premium con selettori scoped sotto `.bio-page`.
// ─────────────────────────────────────────────────────────────────────────────

export default function Bio() {
  const [selectedItem, setSelectedItem] = useState<Interest | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "About · Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const now = new Date();
  const birthDate = new Date(2006, 5, 28);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;

  const renderList = (items: Interest[]) => (
    <div className="bio-list">
      {items.map((it) => (
        <button
          type="button"
          className="bio-list-item"
          key={it.label}
          onClick={() => setSelectedItem(it)}
          aria-label={`Learn more: ${it.label}`}
        >
          <span className="bio-list-emoji" aria-hidden="true">{it.emoji}</span>
          <span className="bio-list-label">{it.label}</span>
          <span className="bio-list-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="it-page-wrapper bio-page">
      {/* Header compatto: marchio del portfolio + ritorno alla home */}
      <header className="bio-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="bio-brand text-decoration-none d-inline-flex align-items-center">
              <span className="bio-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="bio-brand-text">
                <span className="bio-brand-title">Alberto Pecchini</span>
                <span className="bio-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </Link>
            <Link to="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Copertina */}
        <section className="bio-hero">
          <div className="container">
            <div className="bio-hero-grid">
              <div className="bio-hero-text">
                <span className="bio-hero-badge" aria-hidden="true">
                  <UserRound size={44} strokeWidth={1.75} />
                </span>
                <p className="ap-kicker text-uppercase fw-semibold mb-3">👋 About me</p>
                <h1 className="bio-hero-title fw-bold">Hi, I'm Alberto.</h1>
                <span className="bio-hero-rule" aria-hidden="true" />
                <p className="bio-hero-lead">Web developer &amp; designer — CAT student in Mantua.</p>
                <p className="bio-hero-school mb-0">
                  Turning ideas into elegant, fast digital experiences.
                </p>
              </div>
              <div className="bio-hero-aside">
                <div className="bio-portrait">
                  <img
                    src="/alberto-pecchini.jpg"
                    alt="Portrait of Alberto Pecchini"
                    width={1050}
                    height={1400}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi sono */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">01 — Who I am</p>
              <h2 className="display-5 fw-bold mb-3">A little about me</h2>
            </div>
            <div className="bio-prose-wrap">
              <p className="bio-prose">
                My name is Alberto Pecchini, I'm {age} and I'm in my fifth year of the CAT
                programme at the <strong>«Carlo d'Arco»</strong> Technical Institute in Mantua.
              </p>
              <p className="bio-prose">
                I'm a web developer and designer passionate about user experience and minimalist
                design. I use <strong>Next.js</strong>, <strong>TypeScript</strong>, GSAP and
                Tailwind CSS to build responsive, fast and polished websites.
              </p>
              <p className="bio-prose">
                My mission is to turn ideas into{" "}
                <strong>memorable digital experiences</strong>, keeping a clean design, careful
                typography and animations that enhance the content.
              </p>
              <p className="bio-prose mb-0">
                Away from the screen I'm a <strong>Sassuolo fan</strong> ⚫🟢 — football, motorbikes
                and a good camera are never far away.
              </p>
            </div>
          </div>
        </section>

        {/* ③ Hobby + Passioni come liste con emoji */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="bio-twocol">
              <div>
                <div className="bio-list-head">
                  <p className="ap-kicker text-primary text-uppercase fw-semibold mb-2">🎮 My hobbies</p>
                  <h2 className="h3 fw-bold mb-3">In my free time</h2>
                </div>
                {renderList(HOBBY)}
              </div>
              <div>
                <div className="bio-list-head">
                  <p className="ap-kicker text-primary text-uppercase fw-semibold mb-2">🔥 My passions</p>
                  <h2 className="h3 fw-bold mb-3">What drives me</h2>
                </div>
                {renderList(PASSIONI)}
              </div>
            </div>
          </div>
        </section>

        {/* ④ Competenze */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Skills</p>
              <h2 className="display-5 fw-bold mb-0">What I work with</h2>
            </div>
            <div className="bio-skillgrid">
              {SKILLS.map((group) => (
                <div className="bio-box" key={group.title}>
                  <span className="bio-skill-title">
                    <span aria-hidden="true">{group.emoji}</span> {group.title}
                  </span>
                  <div className="bio-chips">
                    {group.items.map((item) => (
                      <span key={item} className="bio-chip">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Dove + Formazione */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">03 — Where &amp; education</p>
              <h2 className="display-5 fw-bold mb-0">Based &amp; trained</h2>
            </div>
            <div className="bio-twocol">
              <div className="bio-box">
                <p className="bio-box-label">📍 Location</p>
                <p className="bio-based">
                  <MapPin size={18} aria-hidden="true" /> Mantua · Italy
                </p>
              </div>
              <div className="bio-box">
                <p className="bio-box-label">🎓 Education</p>
                <p className="bio-edu-lead">
                  CAT diploma in progress at ITT «Carlo d'Arco» in Mantua; English C1 (IELTS)
                  achieved in Dublin.
                </p>
                <ul className="bio-edu">
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> ITT «Carlo d'Arco» — CAT diploma
                  </li>
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> CES Dublin — IELTS, level C1
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bio-footer">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-4">
            <span style={{ opacity: 0.8 }}>
              About · Alberto Pecchini — Designer &amp; Front-end Developer
            </span>
            <Link to="/" className="text-white text-decoration-none d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" /> Back to home
            </Link>
          </div>
        </div>
      </footer>

      <InterestModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Look "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso,
           /dubliners, /gattopardo e della home). Sfondo scuro profondo,
           superfici "vetro" e neon viola. Autosufficiente.
           ───────────────────────────────────────────────────────────────────── */
        .bio-page {
          --accent: #8b7bff;
          --accent-2: #7c6cff;
          --accent-3: #9d8fff;
          --accent-deep: #5b4bd6;
          --ink: #c4a5ff;
          --glow: rgba(139, 123, 255, 0.45);
          --text: #e8eef4;
          --sub: #a7b2bd;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(139, 123, 255, 0.10);
          --vio-bd: rgba(139, 123, 255, 0.28);
          --panel: linear-gradient(160deg, #15101f 0%, #1a1430 45%, #0b0f14 100%);
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(139, 123, 255, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #0b0f14 0%, #090c10 100%);
        }
        .bio-page .ap-kicker.text-primary { color: var(--ink) !important; }
        .bio-page .bg-white { background: transparent !important; }
        .bio-page .bg-light { background: rgba(255, 255, 255, 0.022) !important; }
        .bio-page .display-5, .bio-page .h3 { color: var(--text); }
        .bio-page .btn-outline-light { border-color: rgba(255, 255, 255, 0.4); color: #ffffff; }
        .bio-page .btn-outline-light:hover,
        .bio-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #0a0d11 !important;
        }
        .bio-page .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        /* Header — vetro scuro con filo viola */
        .bio-header {
          background: rgba(10, 13, 17, 0.82); position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .bio-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .bio-brand-mark img { width: 100%; height: 100%; display: block; }
        .bio-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .bio-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .bio-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .bio-brand-tagline { display: none; } }

        /* Hero copertina — pannello scuro con aloni viola */
        .bio-hero {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5.5rem) 0;
          color: #ffffff;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(139, 123, 255, 0.22) 0%, transparent 55%),
            var(--panel);
          border-bottom: 1px solid var(--surface-bd);
        }
        .bio-hero::before, .bio-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(60px); opacity: 0.45; pointer-events: none; z-index: 0;
        }
        .bio-hero::before { background: #8b7bff; top: -30%; right: -10%; }
        .bio-hero::after  { background: #5b4bd6; bottom: -35%; left: -12%; opacity: 0.35; }
        .bio-hero .container { position: relative; z-index: 1; }
        .bio-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
        }
        .bio-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; margin-bottom: 1.5rem;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .bio-hero-title {
          font-size: clamp(2.75rem, 7vw, 5rem);
          line-height: 1.02; letter-spacing: -0.02em; margin-bottom: 1.1rem; color: #ffffff;
        }
        .bio-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px;
          background: var(--accent); box-shadow: 0 0 18px var(--glow); margin-bottom: 1.1rem;
        }
        .bio-hero-lead {
          font-size: clamp(1.25rem, 2.6vw, 1.7rem);
          font-style: italic; font-weight: 600; color: #ffffff; margin-bottom: 0.85rem;
        }
        .bio-hero-school { color: rgba(255, 255, 255, 0.78); font-size: 1.02rem; }
        @media (max-width: 767.98px) {
          .bio-hero-grid { grid-template-columns: 1fr; }
          .bio-hero-badge { width: 68px; height: 68px; border-radius: 16px; margin-bottom: 1.1rem; }
          .bio-hero-badge svg { width: 36px; height: 36px; }
        }

        /* Ritratto */
        .bio-portrait {
          position: relative; border-radius: 20px; overflow: hidden;
          border: 1px solid var(--vio-bd);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
          max-width: 380px; margin-left: auto;
        }
        .bio-portrait img { width: 100%; height: auto; display: block; aspect-ratio: 3 / 4; object-fit: cover; object-position: 50% 30%; }
        @media (max-width: 767.98px) { .bio-portrait { margin: 0 auto; } }

        /* Prosa */
        .bio-prose-wrap { max-width: 48rem; }
        .bio-prose { font-size: 1.1rem; line-height: 1.8; color: var(--sub); margin-bottom: 1.1rem; }
        .bio-prose strong { color: #ffffff; }

        /* Layout a due colonne */
        .bio-twocol {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: clamp(1.5rem, 4vw, 3rem); align-items: start;
        }
        @media (max-width: 767.98px) { .bio-twocol { grid-template-columns: 1fr; } }
        .bio-list-head .ap-kicker { color: var(--ink) !important; }

        /* Liste hobby / passioni (voci cliccabili → modale) */
        .bio-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .bio-list-item {
          display: flex; align-items: center; gap: 0.85rem; width: 100%; text-align: left;
          padding: 0.85rem 1.05rem; border-radius: 14px;
          background: var(--surface); border: 1px solid var(--surface-bd);
          color: var(--text); cursor: pointer;
          font-family: inherit; font-size: 1rem; font-weight: 600;
          transition: transform .15s, border-color .15s, box-shadow .15s, background .15s;
        }
        .bio-list-item:hover, .bio-list-item:focus-visible {
          transform: translateY(-2px); border-color: var(--vio-bd); background: var(--vio-soft);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4); outline: none;
        }
        .bio-list-emoji {
          flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
          width: 42px; height: 42px; border-radius: 11px; font-size: 1.2rem;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .bio-list-label { min-width: 0; }
        .bio-list-arrow { margin-left: auto; color: var(--ink); display: inline-flex; transition: transform .15s, color .15s; }
        .bio-list-item:hover .bio-list-arrow, .bio-list-item:focus-visible .bio-list-arrow { transform: translate(2px, -2px); color: #ffffff; }

        /* Skills */
        .bio-skillgrid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1.1rem; align-items: start;
        }
        @media (max-width: 767.98px) { .bio-skillgrid { grid-template-columns: 1fr; } }
        .bio-box {
          background: var(--surface); border: 1px solid var(--surface-bd);
          border-radius: 18px; padding: clamp(1.25rem, 3vw, 1.6rem);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
        }
        .bio-box-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em; color: var(--ink); margin: 0 0 1rem; }
        .bio-skill-title { display: block; font-weight: 700; color: #ffffff; margin-bottom: 0.75rem; font-size: 1.02rem; }
        .bio-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .bio-chip {
          display: inline-flex; align-items: center;
          padding: 0.35rem 0.8rem; border-radius: 999px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
          color: var(--ink); font-size: 0.85rem; font-weight: 600;
        }

        /* Dove + Formazione */
        .bio-based { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text); font-weight: 600; font-size: 1.05rem; margin: 0; }
        .bio-based svg { color: var(--ink); }
        .bio-edu-lead { color: var(--sub); line-height: 1.65; margin: 0 0 1rem; }
        .bio-edu { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
        .bio-edu li { display: flex; align-items: center; gap: 0.55rem; color: var(--text); font-weight: 600; }
        .bio-edu li svg { color: var(--ink); flex-shrink: 0; }

        /* Footer */
        .bio-footer { background-color: #090c10; color: #ffffff; border-top: 1px solid var(--surface-bd); }

        /* ── Modale interessi (ri-stilizzata in dark premium, scoped) ── */
        .bio-page .ap-modal-backdrop { background: rgba(5, 7, 10, 0.7); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        .bio-page .ap-modal {
          background: linear-gradient(160deg, #15101f 0%, #0b0f14 100%);
          border: 1px solid var(--vio-bd);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
          color: var(--text);
        }
        .bio-page .ap-modal-close {
          background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid var(--surface-bd);
          backdrop-filter: blur(4px);
        }
        .bio-page .ap-modal-close:hover, .bio-page .ap-modal-close:focus-visible {
          background: var(--accent); color: #0a0d11;
        }
        .bio-page .ap-modal-icon-wrap {
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .bio-page .ap-modal-title { color: #ffffff; }
        .bio-page .ap-modal-body { color: var(--sub); }
        .bio-page .ap-modal .btn-primary {
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.18); color: #ffffff;
          box-shadow: 0 8px 22px var(--glow);
        }
        .bio-page .ap-modal .btn-primary:hover, .bio-page .ap-modal .btn-primary:focus { filter: brightness(1.08); color: #ffffff; }
      `}</style>
    </div>
  );
}
