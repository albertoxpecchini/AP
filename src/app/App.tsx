import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Mail,
  Phone,
  ChevronDown,
  Code2,
  MapPin,
  ArrowUpRight,
  Menu,
  X,
  GraduationCap,
  Download,
  Bike,
  Dumbbell,
  Gamepad2,
  Music,
  Plane,
  Cpu,
  Palette,
  Lightbulb,
  Camera,
  Car,
  Film,
  Mountain,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiX,
  SiYoutube,
  SiGithub,
  SiWhatsapp,
  SiTelegram,
  SiDiscord,
  SiSnapchat,
  SiPinterest,
  SiReddit,
  SiTwitch,
  SiSpotify,
  SiThreads,
  SiBehance,
  SiDribbble,
  SiFigma,
  SiMedium,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa6";

const NAV_LINKS = [
  { href: "#chi-sono", label: "Chi sono" },
  { href: "#competenze", label: "Competenze" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#progetti", label: "Progetti" },
  { href: "#hobby", label: "Hobby" },
  { href: "#passioni", label: "Passioni" },
  { href: "#contatti", label: "Contatti" },
];

// Contatti
const EMAIL = "pzkko@yahoo.com";
const PHONE_DISPLAY = "+39 331 407 4198";
const PHONE_HREF = "tel:+393314074198";
const WHATSAPP_HREF = "https://wa.me/447340995142";

// lucide-react non include un'icona brand di WhatsApp: la definiamo inline.
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.58-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.57-.085 1.758-.719 2.006-1.413.247-.694.247-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  );
}

// Social del footer. href "#" = profilo da fornire (verranno rimossi quelli non usati).
const SOCIALS = [
  { name: "Instagram", Icon: SiInstagram, href: "#" },
  { name: "TikTok", Icon: SiTiktok, href: "#" },
  { name: "Facebook", Icon: SiFacebook, href: "#" },
  { name: "X (Twitter)", Icon: SiX, href: "#" },
  { name: "YouTube", Icon: SiYoutube, href: "#" },
  { name: "LinkedIn", Icon: FaLinkedin, href: "#" },
  { name: "GitHub", Icon: SiGithub, href: "#" },
  { name: "WhatsApp", Icon: SiWhatsapp, href: WHATSAPP_HREF },
  { name: "Telegram", Icon: SiTelegram, href: "#" },
  { name: "Discord", Icon: SiDiscord, href: "#" },
  { name: "Snapchat", Icon: SiSnapchat, href: "#" },
  { name: "Pinterest", Icon: SiPinterest, href: "#" },
  { name: "Reddit", Icon: SiReddit, href: "#" },
  { name: "Twitch", Icon: SiTwitch, href: "#" },
  { name: "Spotify", Icon: SiSpotify, href: "#" },
  { name: "Threads", Icon: SiThreads, href: "#" },
  { name: "Behance", Icon: SiBehance, href: "#" },
  { name: "Dribbble", Icon: SiDribbble, href: "#" },
  { name: "Figma", Icon: SiFigma, href: "#" },
  { name: "Medium", Icon: SiMedium, href: "#" },
];

const SKILLS = [
  { title: "Sviluppo front-end", items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP"] },
  { title: "Design & UX", items: ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia", "Responsive Design"] },
  { title: "Strumenti & Workflow", items: ["Git & GitHub", "Vite", "Vercel", "VS Code"] },
  { title: "Area tecnica CAT", items: ["Disegno tecnico / CAD", "Topografia", "Progettazione edilizia", "Estimo"] },
  { title: "Lingue", items: ["Italiano — madrelingua", "Inglese — intermedio"] },
];

const CV = [
  {
    period: "2021 — oggi",
    title: "ITT «Carlo d'Arco» — Mantova",
    role: "Diploma CAT · Costruzioni, Ambiente e Territorio (5º anno)",
    desc: "Formazione tecnica su progettazione, disegno tecnico, topografia ed estimo.",
  },
  {
    period: "2026",
    title: "Rivalta sul Mincio — Sito web",
    role: "Web design & sviluppo front-end",
    desc: "Progettazione e sviluppo del sito responsive con Next.js, TypeScript, GSAP e Tailwind CSS.",
  },
];

const HOBBY = [
  { Icon: Bike, label: "Moto" },
  { Icon: Dumbbell, label: "Sport" },
  { Icon: Gamepad2, label: "Videogiochi" },
  { Icon: Music, label: "Musica" },
  { Icon: Plane, label: "Viaggi" },
  { Icon: Cpu, label: "Tecnologia" },
];

const PASSIONI = [
  { Icon: Palette, label: "Web design" },
  { Icon: Lightbulb, label: "Innovazione digitale" },
  { Icon: Camera, label: "Fotografia" },
  { Icon: Car, label: "Motori" },
  { Icon: Film, label: "Cinema" },
  { Icon: Mountain, label: "Outdoor" },
];

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const now = new Date();
  const currentDate = now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const currentYear = now.getFullYear();

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const birthDate = new Date(2006, 5, 28);
  let age = currentYear - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

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
                      href={`mailto:${EMAIL}`}
                      className="text-white text-decoration-none d-flex align-items-center me-3"
                    >
                      <Mail size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">{EMAIL}</span>
                      <span className="d-md-none visually-hidden">Email</span>
                    </a>
                    <a
                      href={WHATSAPP_HREF}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-white text-decoration-none d-flex align-items-center me-3"
                    >
                      <WhatsAppIcon size={15} />
                      <span className="d-none d-md-inline ms-1">WhatsApp</span>
                      <span className="d-md-none visually-hidden">WhatsApp</span>
                    </a>
                    <a
                      href={PHONE_HREF}
                      className="text-white text-decoration-none d-flex align-items-center"
                    >
                      <Phone size={16} className="me-1" aria-hidden="true" />
                      <span className="d-none d-md-inline">{PHONE_DISPLAY}</span>
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
                  src="/alberto-pecchini.jpg"
                  alt="Ritratto di Alberto Pecchini"
                  width={1050}
                  height={1400}
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
                    Mi chiamo Alberto Pecchini, ho {age} anni e frequento il quinto anno della
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

        <section id="competenze" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                02 — Competenze e conoscenze
              </p>
              <h2 className="display-5 fw-bold mb-0">Cosa so fare</h2>
            </motion.div>
            <div className="row g-4">
              {SKILLS.map((group) => (
                <div className="col-md-6 col-lg-4" key={group.title}>
                  <motion.div {...fadeUp} className="ap-skill-card h-100">
                    <h3 className="h5 fw-bold mb-3">{group.title}</h3>
                    <div className="d-flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span key={item} className="chip chip-simple chip-primary">
                          <span className="chip-label">{item}</span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="curriculum" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                03 — Curriculum Vitae
              </p>
              <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
                <h2 className="display-5 fw-bold mb-0">Formazione &amp; esperienze</h2>
                <a
                  href="/cv-alberto-pecchini.pdf"
                  className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center"
                  download
                >
                  <Download size={18} className="me-2" aria-hidden="true" /> Scarica il CV (PDF)
                </a>
              </div>
            </motion.div>
            <div className="row">
              <div className="col-lg-9">
                <motion.div {...fadeUp} className="ap-timeline">
                  {CV.map((item) => (
                    <div className="ap-timeline-item" key={item.title}>
                      <span className="ap-timeline-period">{item.period}</span>
                      <h3 className="h5 fw-bold mb-1">{item.title}</h3>
                      <p className="fw-semibold text-primary mb-2">{item.role}</p>
                      <p className="text-muted mb-0">{item.desc}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section id="progetti" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                04 — Progetti Web
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

        <section id="hobby" className="py-5 my-lg-4 bg-white">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                05 — Hobby
              </p>
              <h2 className="display-5 fw-bold mb-0">Nel tempo libero</h2>
            </motion.div>
            <div className="row g-4">
              {HOBBY.map(({ Icon, label }) => (
                <div className="col-6 col-md-4 col-lg-2" key={label}>
                  <motion.div {...fadeUp} className="ap-interest-card h-100">
                    <span className="ap-interest-icon" aria-hidden="true">
                      <Icon size={26} />
                    </span>
                    <span className="ap-interest-label">{label}</span>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="passioni" className="py-5 my-lg-4 bg-light">
          <div className="container">
            <motion.div {...fadeUp} className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">
                06 — Passioni
              </p>
              <h2 className="display-5 fw-bold mb-0">Cosa mi appassiona</h2>
            </motion.div>
            <div className="row g-4">
              {PASSIONI.map(({ Icon, label }) => (
                <div className="col-6 col-md-4 col-lg-2" key={label}>
                  <motion.div {...fadeUp} className="ap-interest-card h-100">
                    <span className="ap-interest-icon" aria-hidden="true">
                      <Icon size={26} />
                    </span>
                    <span className="ap-interest-label">{label}</span>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contatti" className="py-5 bg-primary text-white">
          <div className="container text-center">
            <motion.div {...fadeUp}>
              <p className="ap-kicker text-uppercase fw-semibold mb-3" style={{ opacity: 0.85 }}>
                07 — Contatti
              </p>
              <h2 className="display-5 fw-bold mb-4">Parliamone.</h2>
              <p className="lead mb-4 mx-auto" style={{ maxWidth: "40rem" }}>
                Per collaborazioni, progetti web o semplicemente per uno scambio di idee — sono
                disponibile.
              </p>
              <div className="d-flex justify-content-center flex-wrap gap-3 mb-5">
                <a
                  href={`mailto:${EMAIL}`}
                  className="btn btn-light btn-lg fw-semibold text-primary d-inline-flex align-items-center"
                >
                  <Mail size={20} className="me-2" aria-hidden="true" /> Scrivimi
                </a>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-outline-light btn-lg fw-semibold d-inline-flex align-items-center"
                >
                  <WhatsAppIcon size={20} />
                  <span className="ms-2">WhatsApp</span>
                </a>
                <a
                  href={PHONE_HREF}
                  className="btn btn-outline-light btn-lg fw-semibold d-inline-flex align-items-center"
                >
                  <Phone size={20} className="me-2" aria-hidden="true" /> Chiamami
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="it-footer">
        <div className="it-footer-main">
          <div className="container">
            <div className="row py-4 gy-4">
              <div className="col-12 col-lg-4">
                <h2 className="h4 fw-bold mb-1">Alberto Pecchini</h2>
                <p className="mb-0" style={{ opacity: 0.8 }}>
                  Designer &amp; Developer · ITT «Carlo d'Arco» — Mantova
                </p>
              </div>
              <div className="col-12 col-lg-8">
                <p className="text-uppercase fw-semibold mb-3" style={{ letterSpacing: "0.12em", opacity: 0.85 }}>
                  Seguimi sui social
                </p>
                <div className="d-flex flex-wrap gap-2">
                  {SOCIALS.map(({ name, Icon, href }) => (
                    <a
                      key={name}
                      href={href}
                      className="ap-social ap-social--sm"
                      aria-label={name}
                      title={name}
                      {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="row border-top pt-3 pb-4" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
              <div className="col-12 col-md-6 small" style={{ opacity: 0.7 }}>
                © {currentYear} Alberto Pecchini — Tutti i diritti riservati
              </div>
              <div className="col-12 col-md-6 text-md-end small" style={{ opacity: 0.7 }}>
                Aggiornato il {currentDate}
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
        .ap-social--sm {
          width: 40px;
          height: 40px;
        }

        /* Card competenze */
        .ap-skill-card {
          background: #ffffff;
          border: 1px solid rgba(0, 102, 204, 0.12);
          border-radius: 8px;
          padding: 1.5rem;
        }

        /* Timeline curriculum */
        .ap-timeline {
          position: relative;
          padding-left: 2rem;
        }
        .ap-timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 6px;
          bottom: 6px;
          width: 2px;
          background: rgba(0, 102, 204, 0.25);
        }
        .ap-timeline-item {
          position: relative;
          padding-bottom: 2rem;
        }
        .ap-timeline-item:last-child {
          padding-bottom: 0;
        }
        .ap-timeline-item::before {
          content: "";
          position: absolute;
          left: -2rem;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #06c;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.25);
        }
        .ap-timeline-period {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #06c;
          margin-bottom: 0.25rem;
        }

        /* Card hobby / passioni */
        .ap-interest-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1.75rem 1rem;
          background: #ffffff;
          border: 1px solid rgba(0, 102, 204, 0.12);
          border-radius: 8px;
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ap-interest-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .ap-interest-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0, 102, 204, 0.1);
          color: #06c;
        }
        .ap-interest-label {
          font-weight: 600;
        }

        @media (prefers-reduced-motion: reduce) {
          .ap-project-card,
          .ap-social,
          .ap-interest-card,
          .ap-navbar {
            transition: none;
          }
          .ap-project-card:hover,
          .ap-project-card:focus-within,
          .ap-interest-card:hover,
          .ap-social:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
