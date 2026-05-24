import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Github,
  Linkedin,
  Mail,
  Phone,
  ChevronDown,
  Code2,
  MapPin,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#chi-sono", label: "Chi sono" },
  { href: "#progetti", label: "Progetti Web" },
  { href: "#contatti", label: "Contatti" },
];

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const now = new Date();
  const currentDate = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const currentYear = now.getFullYear();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll while the mobile menu overlay is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Respect prefers-reduced-motion: no entrance transforms when the user opts out.
  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.7, ease: "easeOut" },
      };

  return (
    <div className="it-page-wrapper">
      {/* Skiplinks — requisito di accessibilità del Design System */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          Vai al contenuto principale
        </a>
        <a className="visually-hidden-focusable" href="#contatti">
          Vai ai contatti
        </a>
      </div>

      <header className="it-header-wrapper">
        {/* Header slim: ruolo + recapiti */}
        <div className="it-header-slim-wrapper theme-dark">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="it-header-slim-wrapper-content">
                  <span className="d-none d-lg-block navbar-brand">
                    Disponibile per web design, sviluppo front-end e branding
                  </span>
                  <div className="it-header-slim-right-zone">
                    <a
                      href="mailto:alberto.pecchini@studente.it"
                      className="text-white text-decoration-none d-flex align-items-center me-3"
                    >
                      <Mail size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">alberto.pecchini@studente.it</span>
                      <span className="d-md-none visually-hidden">Email</span>
                    </a>
                    <a
                      href="tel:+390123456789"
                      className="text-white text-decoration-none d-flex align-items-center"
                    >
                      <Phone size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">+39 0123 456 789</span>
                      <span className="d-md-none visually-hidden">Telefono</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="it-nav-wrapper">
          {/* Header center: marchio */}
          <div className="it-header-center-wrapper theme-dark">
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <div className="it-header-center-content-wrapper">
                    <div className="it-brand-wrapper">
                      <a href="#home" aria-label="Alberto Pecchini, torna alla home">
                        <span className="ap-brand-mark" aria-hidden="true">
                          <Code2 size={26} />
                        </span>
                        <div className="it-brand-text">
                          <div className="it-brand-title">Alberto Pecchini</div>
                          <div className="it-brand-tagline d-none d-md-block">
                            Designer &amp; Front-end Developer
                          </div>
                        </div>
                      </a>
                    </div>
                    <div className="it-right-zone">
                      <span className="d-none d-lg-flex align-items-center text-white">
                        <MapPin size={18} className="me-1" aria-hidden="true" /> Mantova · Italia
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navbar principale (sticky) */}
          <div
            className={`it-header-navbar-wrapper theme-dark theme-dark-mobile ap-navbar ${scrolled ? "ap-navbar--scrolled" : ""}`}
          >
            <div className="container">
              <div className="row">
                <div className="col-12">
                  <nav className="navbar navbar-expand-lg" aria-label="Navigazione principale">
                    <button
                      className="custom-navbar-toggler"
                      type="button"
                      aria-controls="nav-main"
                      aria-expanded={menuOpen}
                      aria-label="Apri il menu di navigazione"
                      onClick={() => setMenuOpen(true)}
                    >
                      <Menu aria-hidden="true" />
                    </button>

                    <div className={`navbar-collapsable ${menuOpen ? "expanded" : ""}`} id="nav-main">
                      <div className="overlay" onClick={closeMenu} />
                      <div className="close-div">
                        <button
                          className="btn close-menu"
                          type="button"
                          aria-label="Chiudi il menu di navigazione"
                          onClick={closeMenu}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                      <div className="menu-wrapper">
                        <ul className="navbar-nav">
                          {NAV_LINKS.map((link) => (
                            <li className="nav-item" key={link.href}>
                              <a className="nav-link" href={link.href} onClick={closeMenu}>
                                <span>{link.label}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section
          id="home"
          className="ap-hero bg-primary text-white d-flex align-items-center"
        >
          <div className="container position-relative" style={{ zIndex: 1 }}>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <p className="ap-kicker text-uppercase fw-semibold mb-3">
                Studente CAT · Front-end Developer
              </p>
              <h1 className="display-1 fw-bold mb-4" style={{ maxWidth: "12ch" }}>
                Alberto Pecchini
              </h1>
              <p className="lead mb-4" style={{ maxWidth: "44rem" }}>
                Creo esperienze digitali eleganti con un approccio moderno e funzionale.
                Web design, sviluppo e animazioni curate per ogni schermo.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <a href="#progetti" className="btn btn-light btn-lg fw-semibold text-primary">
                  Vedi i progetti
                </a>
                <a href="#contatti" className="btn btn-outline-light btn-lg fw-semibold">
                  Contattami
                </a>
              </div>
            </motion.div>
          </div>

          {!reduceMotion && (
            <div className="ap-scroll-hint" aria-hidden="true">
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <ChevronDown size={32} />
              </motion.div>
            </div>
          )}
        </section>

        <section id="chi-sono" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="row align-items-center gy-5">
              <div className="col-lg-5">
                <motion.img
                  {...fadeUp}
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&h=1100&fit=crop&auto=format"
                  alt="Ritratto di Alberto Pecchini"
                  className="img-fluid rounded shadow"
                  loading="lazy"
                />
              </div>
              <div className="col-lg-7">
                <motion.div {...fadeUp}>
                  <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                    01 — Chi sono
                  </p>
                  <h2 className="display-5 fw-bold mb-4">
                    Creo esperienze digitali pulite ed eleganti.
                  </h2>
                  <p className="fs-5 text-muted">
                    Mi chiamo Alberto Pecchini, ho 19 anni e frequento il quinto anno della
                    sezione CAT all'Istituto Tecnico Tecnologico <strong>«Carlo d'Arco»</strong> di
                    Mantova.
                  </p>
                  <p className="fs-5 text-muted">
                    Sono uno sviluppatore web e designer appassionato di user experience e design
                    minimalista. Utilizzo Next.js, TypeScript, GSAP e Tailwind CSS per creare siti
                    web responsivi, veloci e raffinati.
                  </p>
                  <p className="fs-5 text-muted mb-0">
                    La mia missione è trasformare le idee in{" "}
                    <strong>esperienze digitali memorabili</strong>, mantenendo un design pulito,
                    una tipografia curata e animazioni che valorizzano i contenuti.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section id="progetti" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                02 — Progetti Web
              </p>
              <h2 className="display-5 fw-bold mb-0">Il mio lavoro</h2>
            </motion.div>

            <div className="row">
              <div className="col-12 col-lg-8">
                <motion.div {...fadeUp} className="card-wrapper">
                  <div className="it-card it-card-bg rounded shadow ap-project-card">
                    <div className="it-card-body">
                      <div className="category-top d-flex justify-content-between align-items-center">
                        <span className="category">Sito web istituzionale</span>
                        <span className="data">{currentYear}</span>
                      </div>
                      <h3 className="it-card-title h2 fw-bold">
                        <a
                          className="text-decoration-none stretched-link"
                          href="https://rivaltasulmincio.it"
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          Rivalta sul Mincio
                          <ArrowUpRight size={22} className="ms-2" aria-hidden="true" />
                        </a>
                      </h3>
                      <p className="it-card-text fs-5">
                        Sito web responsive per la località turistica di Rivalta sul Mincio.
                        Design minimalista con tipografia editoriale, palette calda monocromatica,
                        griglie bento gapless, animazioni GSAP ScrollTrigger e composizione
                        image-led.
                      </p>
                      <div className="d-flex flex-wrap gap-2 mt-4">
                        {["Next.js", "TypeScript", "GSAP", "Tailwind CSS", "Design minimalista"].map(
                          (tag) => (
                            <span key={tag} className="chip chip-simple chip-primary">
                              <span className="chip-label">{tag}</span>
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section id="contatti" className="py-5 bg-primary text-white">
          <div className="container text-center">
            <motion.div {...fadeUp}>
              <p className="ap-kicker text-uppercase fw-semibold mb-3" style={{ opacity: 0.85 }}>
                03 — Contatti
              </p>
              <h2 className="display-5 fw-bold mb-4">Parliamone.</h2>
              <p className="lead mb-4 mx-auto" style={{ maxWidth: "40rem" }}>
                Per collaborazioni, progetti web o semplicemente per uno scambio di idee — sono
                disponibile.
              </p>
              <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
                <a
                  href="mailto:alberto.pecchini@studente.it"
                  className="btn btn-light btn-lg fw-semibold text-primary d-inline-flex align-items-center"
                >
                  <Mail size={20} className="me-2" aria-hidden="true" /> Scrivimi
                </a>
                <a href="#home" className="btn btn-outline-light btn-lg fw-semibold">
                  Torna all'inizio
                </a>
              </div>
              <div className="d-flex justify-content-center gap-3">
                <a
                  href="https://github.com/"
                  className="ap-social"
                  aria-label="Profilo GitHub"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Github size={24} aria-hidden="true" />
                </a>
                <a
                  href="https://www.linkedin.com/"
                  className="ap-social"
                  aria-label="Profilo LinkedIn"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Linkedin size={24} aria-hidden="true" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="it-footer">
        <div className="it-footer-main">
          <div className="container">
            <div className="row align-items-center py-4">
              <div className="col-12 col-md-6">
                <h2 className="h4 fw-bold mb-1">Alberto Pecchini</h2>
                <p className="mb-0" style={{ opacity: 0.8 }}>
                  Designer &amp; Developer · ITT «Carlo d'Arco» — Mantova
                </p>
              </div>
              <div className="col-12 col-md-6 text-md-end mt-3 mt-md-0">
                <p className="mb-1" style={{ opacity: 0.8 }}>
                  Aggiornato il {currentDate}
                </p>
                <p className="mb-0 small" style={{ opacity: 0.6 }}>
                  © {currentYear} Alberto Pecchini — Tutti i diritti riservati
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .it-page-wrapper {
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background-color: #ffffff;
        }

        /* Marchio nel center header */
        .ap-brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          margin-right: 12px;
        }

        /* Navbar sticky con feedback allo scroll */
        .ap-navbar {
          position: sticky;
          top: 0;
          z-index: 3;
          transition: box-shadow 0.3s ease, background-color 0.3s ease;
        }
        .ap-navbar--scrolled {
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
        }

        /*
         * Menu mobile: nel Design System l'apertura del drawer è gestita dal JS
         * di Bootstrap Italia. Qui la navigazione è controllata da React, quindi
         * rendiamo lo stato .expanded autosufficiente in CSS (sotto i 992px).
         */
        @media (max-width: 991.98px) {
          .ap-navbar .navbar-collapsable.expanded {
            display: block;
          }
          .ap-navbar .navbar-collapsable .menu-wrapper {
            height: 100%;
            padding: 1.5rem;
            overflow-y: auto;
          }
          .ap-navbar .navbar-collapsable .overlay {
            display: none;
          }
          .ap-navbar .navbar-collapsable.expanded .overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
          }
        }

        /* Hero */
        .ap-hero {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background-color: #06c;
        }
        .ap-hero .lead {
          color: rgba(255, 255, 255, 0.9);
        }
        .ap-kicker {
          letter-spacing: 0.18em;
          font-size: 0.875rem;
        }
        .ap-scroll-hint {
          position: absolute;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.85);
        }

        /* Card progetto */
        .ap-project-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ap-project-card:hover,
        .ap-project-card:focus-within {
          transform: translateY(-4px);
        }
        .ap-project-card .it-card-title a {
          display: inline-flex;
          align-items: center;
          color: inherit;
        }

        /* Icone social nei contatti */
        .ap-social {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.45);
          color: #ffffff;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        .ap-social:hover,
        .ap-social:focus-visible {
          background-color: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .ap-project-card,
          .ap-social,
          .ap-navbar {
            transition: none;
          }
          .ap-project-card:hover,
          .ap-project-card:focus-within,
          .ap-social:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
