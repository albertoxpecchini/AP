import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router";
import { activateLocalMode } from "./utils/local";
import { isIOS } from "./utils/device";
import { lockBodyScroll, unlockBodyScroll } from "./utils/scrollLock";
import {
  Mail,
  Phone,
  ArrowUpRight,
  X,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Menu,
  Heart,
} from "lucide-react";
import { SiGithub, SiInstagram, SiX } from "react-icons/si";
import {
  EMAIL,
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_HREF,
  WhatsAppIcon,
  SOCIALS,
} from "./site/data";
import { PROJECTS, ProjectIcon } from "./site/projects";
import { ArchivioExplorer } from "./archivio/Archivio";
import SiteFooter from "./site/SiteFooter";

// ─────────────────────────────────────────────────────────────────────────────
// Home / portfolio — look "dark premium" (lo stesso di /me-stesso, /dubliners,
// /gattopardo e del gioco Trivia): fondo scuro, superfici "vetro", accento VIOLA
// neon. Testi in inglese. La home è autosufficiente: header, footer e stile sono
// inline qui dentro (come le pagine di approfondimento), così il restyle non
// tocca la pagina /bio, che resta in stile chiaro.
// ─────────────────────────────────────────────────────────────────────────────

const CV = [
  {
    period: "Sep 2018 — Jun 2021",
    title: "Lower secondary school — Mantua",
    role: "Istituto Redentore · «Beato Contardo Ferrini» Student House Foundation",
    desc: "A three-year programme with a solid grounding in Italian, mathematics, history, science and English. Development of study method and cross-disciplinary skills. Diploma achieved with merit.",
  },
  {
    period: "2021 — present",
    title: "«Carlo d'Arco» Technical Institute — Mantua",
    role: "CAT diploma · Construction, Environment and Territory (5th year) · Class 5T",
    desc: "A five-year technical programme. Core subjects: architectural design and technical drawing (AutoCAD), topography and instrumental surveying, valuation and real-estate appraisal, site management, applied physics, mathematics and technical English. School code MNTL009017.",
  },
  {
    period: "2019 — present",
    title: "Online sales — Vinted & Subito",
    role: "E-commerce · Commercial photography · Customer care",
    desc: "End-to-end management of the entire sales cycle on Vinted and Subito: product appraisal, market pricing, photography with a Canon EOS 4000D and iPhone 16 Pro, listing, communication with prospective buyers, negotiation, shipping and feedback handling. First sale in December 2019. A systematic personal activity since autumn 2024. Categories: clothing, film collectibles, tech devices (Apple Watch, Nintendo Switch, Flipper Zero).",
  },
  {
    period: "ongoing",
    title: "Family farm — Rivalta sul Mincio",
    role: "Farm hand · Logistics · Operational coordination",
    desc: "Ongoing collaboration in the family farming business. Tasks: plant care and maintenance (watering, pruning of various types and sizes), transport of materials and equipment on a tractor with trailer, hay harvesting from permanent meadow, coordinating operations with the team during intensive work, logistical support and assistance with transfers. Autonomous handling of farm equipment and on-field problem-solving.",
  },
  {
    period: "Dec 19, 2023",
    title: "Workers' Safety Course — Low Risk",
    role: "Certificate of attendance · LTO Mantua / FORMA · Lombardy Region (ATS Val Padana) · 4 hours e-learning",
    desc: "Course compliant with the State–Regions Agreement of 21 December 2011 (Legislative Decree 81/08, Art. 37), aimed at office workers. Contents: electrical risk, falls from height, microclimate and lighting, display screens, work organisation and work-related stress, first-aid procedures, signage and fire safety (evacuation procedures). Certificate issued as a student by the Mantua Territorial Employability Laboratory.",
    pdf: "/attestato-sicurezza-lavoratori-rischio-basso.pdf",
    pdfLabel: "Open certificate (PDF)",
  },
  {
    period: "Aug 11 — 25, 2024",
    title: "CES IELTS Test Centre — Dublin, Ireland",
    role: "General English Intensive · 26 lessons/week · Level C1",
    desc: "Intensive general English course at the CES centre on Dame Court, Dublin 2. Four weeks of full immersion focused on speaking, writing, reading and listening at advanced level (C1). Passed the IELTS exam at the end of the course. Independent exploration of the area: Howth, Balbriggan, North Bull Island, Bray, Greystones, Glendalough, Powerscourt Estate and Galway.",
  },
  {
    period: "2024 — 2025",
    title: "Parish summer camp · SS. Donato e Vigilio Martiri Parish",
    role: "Volunteer youth leader · Rivalta sul Mincio · 6 weeks/year · 2 editions",
    desc: "Volunteer youth-leader service during the parish summer camp (Grest) — two consecutive editions (summer 2024 and 2025), for a total of twelve weeks. Direct responsibility for groups of children of different ages. Planning and running games, workshops and educational activities. Managing group dynamics, mediation, communication with parents. Reference: Fr. Andrea Grandi.",
  },
  {
    period: "Summer 2024",
    title: "CRED · Rodigo Secondary School",
    role: "Volunteer educational support · Municipality of Rodigo · 2 weeks",
    desc: "Educational support and youth activities during the Municipality of Rodigo's summer day camp. Assisting educators in running activities, managing groups, individual support for pupils and organising structured and free play.",
  },
  {
    period: "Jul 23 — Aug 1, 2025",
    title: "Paris · Le Havre · Rouen · Étretat — France",
    role: "Cultural trip",
    desc: "An itinerary across Normandy and Île-de-France: the cliffs of Étretat, the Gothic cathedral of Rouen, the historic port of Le Havre and the main museums and quarters of Paris.",
  },
  {
    period: "Dec 26 — 29, 2025",
    title: "Edinburgh — Scotland, United Kingdom",
    role: "Cultural trip",
    desc: "A visit to the Scottish capital over the Christmas holidays: the Old Town, Edinburgh Castle, the Royal Mile and the unique atmosphere of the historic closes at Christmas.",
  },
  {
    period: "Mar 22 — 23, 2026",
    title: "Polling clerk — Section 5, Rivalta sul Mincio",
    role: "Electoral operations · Municipality of Rodigo · Referendum",
    desc: "Official appointment as a polling clerk at electoral section no. 5 of Rivalta sul Mincio (Municipality of Rodigo) for the Referendum of 22–23 March 2026. Tasks: verifying voters' identity, managing voting operations, counting ballots, drafting reports and transmitting results. Paid appointment with a fee of €119.60.",
  },
  {
    period: "Apr 20, 2026",
    title: "Cascina Fontana — Website",
    role: "Web design & front-end development",
    desc: "Design and development of the official Cascina Fontana website. Analysis of the client's needs, definition of the information architecture and creation of a responsive, carefully designed interface optimised to present the company's products and services. Direct collaboration with the client to define the content. Stack: React, TypeScript, Tailwind CSS.",
  },
  {
    period: "Apr 27, 2026",
    title: "Rivalta sul Mincio — Website",
    role: "Web design & front-end development",
    desc: "Design and development of the institutional and tourist website for Rivalta sul Mincio. Minimalist editorial design with careful typography, a warm colour palette and advanced animations via GSAP ScrollTrigger (pinning, stacking, parallax scrubbing). Gapless bento grids and image-led composition for immersive visual storytelling. Stack: Next.js, TypeScript, GSAP, Tailwind CSS.",
  },
  // --- wishlist ---
  {
    period: "✦ wish",
    title: "Found my own news outlet",
    role: "Independent journalism · Reportage · Publishing",
    desc: "To build a personal news medium: go out into the field and tell true stories without filters, with the same drive and courage I admire in those who stop at nothing to get the story.",
    wish: true,
  },
];

// Parsing della data d'inizio (formato inglese) per l'ordinamento del CV.
const EN_MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};
const EN_MONTH_RE = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

function parsePeriodStart(period: string): number {
  if (!period) return 0;
  const p = period.toLowerCase().trim();

  // "ongoing" — collaborazione di lunga data: la trattiamo come molto antica.
  if (p.includes("ongoing")) return new Date(1900, 0, 1).getTime();

  // "Summer YYYY" → 21 June YYYY.
  const summer = p.match(/summer\s+(\d{4})/);
  if (summer) return new Date(+summer[1], 5, 21).getTime();

  // Primo mese + giorno (il lookahead evita di scambiare le cifre dell'anno
  // per un giorno, es. "Sep 2018"); l'anno è il primo gruppo di 4 cifre.
  const md = p.match(new RegExp(`(${EN_MONTH_RE})\\s+(\\d{1,2})(?!\\d)`));
  const year = p.match(/(\d{4})/);
  if (md && year) return new Date(+year[1], EN_MONTHS[md[1]], +md[2]).getTime();

  // Solo anno (es. "2021 — present", "2024 — 2025").
  if (year) return new Date(+year[1], 0, 1).getTime();

  return 0;
}

const NAV = [
  { href: "#archivio", label: "Archive" },
  { href: "/bio", label: "About", route: true },
  { href: "#curriculum", label: "Résumé" },
  { href: "/sostieni", label: "Support", route: true },
  { href: "#contatti", label: "Contact" },
];

export default function App() {
  const [localMode, setLocalMode] = useState(false);
  const [docOpen, setDocOpen] = useState<{ url: string; title: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const sortedCV = useMemo(() => {
    const wishes = CV.filter((c) => (c as any).wish);
    const items = CV.filter((c) => !(c as any).wish);
    const sorted = items.slice().sort((a, b) => parsePeriodStart(b.period) - parsePeriodStart(a.period));
    return [...sorted, ...wishes];
  }, []);

  const CV_PDF = "/cv-alberto-pecchini.pdf";

  useEffect(() => {
    activateLocalMode(() => {
      setLocalMode(true);
      console.info("Local mode attivo");
    });
  }, []);

  useEffect(() => {
    if (isIOS()) document.documentElement.classList.add("ios");
    return () => document.documentElement.classList.remove("ios");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [menuOpen]);

  // Arrivo con un hash nell'URL: riallinea lo scroll dopo il layout (i contenuti
  // lazy montano dopo e cambiano l'altezza), evitando il salto "parte in cima".
  useLayoutEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const jump = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    };
    jump();
    let tries = 0;
    const align = () => {
      jump();
      if (++tries < 6) timer = window.setTimeout(align, 120);
    };
    let timer = window.setTimeout(align, 120);
    return () => clearTimeout(timer);
  }, []);

  // Visualizzatore documenti PDF: blocco scroll + chiusura con Esc.
  useEffect(() => {
    if (!docOpen) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDocOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [docOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="it-page-wrapper hm-page">
      {/* Skiplinks — requisito di accessibilità */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
        <a className="visually-hidden-focusable" href="#contatti">Skip to contacts</a>
      </div>

      {/* ── Header dark premium ── */}
      <header className={`hm-hdr ${scrolled ? "hm-hdr--scrolled" : ""}`}>
        <div className="hm-wrap hm-hdr-inner">
          <a href="#home" className="hm-brand" aria-label="Alberto Pecchini — back to top">
            <span className="hm-brand-mark" aria-hidden="true">
              <img src="/favicon.svg" alt="" width={40} height={40} />
            </span>
            <span className="hm-brand-text">
              <span className="hm-brand-name">Alberto Pecchini</span>
              <span className="hm-brand-tag">Designer &amp; Front-end Developer</span>
            </span>
            {localMode ? <span className="hm-local">Local</span> : null}
          </a>

          <nav className="hm-nav" aria-label="Primary navigation">
            {NAV.map((l) =>
              l.route ? (
                <Link key={l.href} to={l.href} className="hm-link">{l.label}</Link>
              ) : (
                <a key={l.href} href={l.href} className="hm-link">{l.label}</a>
              ),
            )}
          </nav>

          <div className="hm-right">
            <div className="hm-social">
              <a href="https://github.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="GitHub" title="GitHub"><SiGithub size={18} aria-hidden="true" /></a>
              <a href="https://www.instagram.com/albertoxpecchini" target="_blank" rel="noreferrer noopener" aria-label="Instagram" title="Instagram"><SiInstagram size={18} aria-hidden="true" /></a>
              <a href="https://x.com/ygpzk" target="_blank" rel="noreferrer noopener" aria-label="X" title="X"><SiX size={18} aria-hidden="true" /></a>
            </div>
            <a href="#contatti" className="hm-cta">Contact</a>
            <button
              className="hm-burger"
              type="button"
              aria-controls="hm-drawer"
              aria-expanded={menuOpen}
              aria-label="Open navigation menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>

      </header>

      {/* ── Menu mobile a schermo intero (fuori da <header>: l'header ha
           backdrop-filter e farebbe da containing-block al position:fixed,
           confinando il menu nella sola barra in alto) ── */}
      <div className={`hm-menu ${menuOpen ? "open" : ""}`} id="hm-drawer" aria-hidden={!menuOpen}>
        <button className="hm-menu-scrim" type="button" aria-label="Chiudi il menu" tabIndex={menuOpen ? 0 : -1} onClick={closeMenu} />
        <div className="hm-menu-sheet" role="dialog" aria-modal="true" aria-label="Menu di navigazione">
          <div className="hm-menu-head">
            <span className="hm-menu-brand">
              <span className="hm-brand-mark" aria-hidden="true"><img src="/favicon.svg" alt="" width={32} height={32} /></span>
              Alberto Pecchini
            </span>
            <button className="hm-menu-close" type="button" aria-label="Chiudi il menu" onClick={closeMenu}>
              <X size={22} aria-hidden="true" />
            </button>
          </div>

          <nav className="hm-menu-nav" aria-label="Navigazione">
            {NAV.map((l, i) =>
              l.route ? (
                <Link key={l.href} to={l.href} onClick={closeMenu} style={{ "--i": i } as React.CSSProperties}>
                  <span>{l.label}</span><ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={closeMenu} style={{ "--i": i } as React.CSSProperties}>
                  <span>{l.label}</span><ArrowUpRight size={20} aria-hidden="true" />
                </a>
              ),
            )}
          </nav>

          <div className="hm-menu-foot">
            <div className="hm-menu-contacts">
              <a href={`mailto:${EMAIL}`}><Mail size={18} aria-hidden="true" /> {EMAIL}</a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener"><WhatsAppIcon size={16} /> WhatsApp</a>
              <a href={PHONE_HREF}><Phone size={18} aria-hidden="true" /> {PHONE_DISPLAY}</a>
            </div>
            <div className="hm-menu-social">
              {SOCIALS.slice(0, 8).map(({ name, Icon, href }) => (
                <a key={name} href={href} aria-label={name} title={name} {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}>
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main id="main-content">
        {/* ① Hero — nome + posizionamento (stile FiveSight/Prilo) */}
        <section id="home" className="hm-hero">
          <div className="hm-wrap hm-hero-grid">
            <div className="hm-hero-main">
              <p className="hm-hero-eyebrow">💻 Front-end Developer · CAT Student</p>
              <h1 className="hm-hero-name">Alberto Pecchini</h1>
              <span className="hm-hero-rule" aria-hidden="true" />
              <p className="hm-hero-lead">
                High-school senior &amp; front-end developer behind a hub of web games —{" "}
                <span className="hm-ink">Trivia</span>, <span className="hm-ink">Mappa</span> and{" "}
                <span className="hm-ink">Parole</span> — and client websites like{" "}
                <span className="hm-ink">Rivalta sul Mincio</span> and{" "}
                <span className="hm-ink">Cascina Fontana</span>.
              </p>
              <p className="hm-hero-sub">
                Building elegant, fast web experiences with React, TypeScript and careful
                motion design — from playful games to real-world business sites.
              </p>
              <div className="hm-hero-actions">
                <a href="#archivio" className="hm-pill hm-pill--solid">🚀 Projects</a>
                <Link to="/bio" className="hm-pill hm-pill--ghost">👋 Bio</Link>
              </div>
              <div className="hm-hero-quick">
                {["Trivia", "Mappa", "Angoli"].map((t) => {
                  const p = PROJECTS.find((x) => x.title === t);
                  if (!p) return null;
                  return (
                    <Link key={t} to={p.url} className="hm-quick" aria-label={`Open ${p.title}`}>
                      <span className="hm-quick-ic" aria-hidden="true">
                        <ProjectIcon thumb={(p as any).thumb} size={20} />
                      </span>
                      <span>{p.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hm-hero-aside">
              <div className="hm-portrait">
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
        </section>

        {/* ② Archivio progetti — clone di /archivio, incorporato sotto l'hero */}
        <section id="archivio" className="hm-sec">
          <div className="hm-wrap">
            <div className="hm-sec-head">
              <div>
                <p className="hm-eyebrow">🗂️ Archive</p>
                <h2 className="hm-title">Everything, in one place</h2>
              </div>
              <Link to="/archivio" className="hm-action">
                Open full archive <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="ax-embed">
              <ArchivioExplorer embedded />
            </div>
          </div>
        </section>

        {/* ④ Résumé */}
        <section id="curriculum" className="hm-sec hm-sec--alt">
          <div className="hm-wrap">
            <div className="hm-sec-head">
              <div>
                <p className="hm-eyebrow">🎓 Résumé</p>
                <h2 className="hm-title">Education &amp; experience</h2>
              </div>
              <div className="hm-cvbtns">
                <button
                  type="button"
                  onClick={() => setDocOpen({ url: CV_PDF, title: "Curriculum Vitae — Alberto Pecchini" })}
                  className="hm-btn hm-btn--solid"
                  aria-haspopup="dialog"
                >
                  <Eye size={18} aria-hidden="true" /> View CV
                </button>
                <a href={CV_PDF} className="hm-btn hm-btn--ghost" download>
                  <Download size={18} aria-hidden="true" /> Download (PDF)
                </a>
              </div>
            </div>

            <div className="hm-timeline">
              {sortedCV.map((item) => (
                <div className={`hm-tl-item${(item as any).wish ? " hm-tl-item--wish" : ""}`} key={item.title}>
                  <span className={`hm-tl-period${(item as any).wish ? " hm-tl-period--wish" : ""}`}>{item.period}</span>
                  <h3 className={`hm-tl-title${(item as any).wish ? " hm-tl-title--wish" : ""}`}>{item.title}</h3>
                  <p className={`hm-tl-role${(item as any).wish ? " hm-tl-role--wish" : ""}`}>{item.role}</p>
                  <p className="hm-tl-desc">{item.desc}</p>
                  {(item as any).pdf && (
                    <button
                      type="button"
                      onClick={() => setDocOpen({ url: (item as any).pdf, title: item.title })}
                      className="hm-cv-doc"
                      aria-haspopup="dialog"
                    >
                      <FileText size={16} aria-hidden="true" />
                      <span>{(item as any).pdfLabel || "Open document (PDF)"}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Stack */}
        <section className="hm-sec">
          <div className="hm-wrap">
            <div className="hm-sec-head">
              <div>
                <p className="hm-eyebrow">⚙️ Stack</p>
                <h2 className="hm-title">Built with</h2>
              </div>
            </div>
            <div className="hm-stack">
              <a href="https://react.dev" target="_blank" rel="noreferrer noopener" title="React 18.3">
                <img src="https://img.shields.io/badge/React-18.3-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18.3" />
              </a>
              <a href="https://www.typescriptlang.org" target="_blank" rel="noreferrer noopener" title="TypeScript strict">
                <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript strict" />
              </a>
              <a href="https://vite.dev" target="_blank" rel="noreferrer noopener" title="Vite 6.3">
                <img src="https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6.3" />
              </a>
              <a href="https://tailwindcss.com" target="_blank" rel="noreferrer noopener" title="Tailwind 4.1">
                <img src="https://img.shields.io/badge/Tailwind-4.1-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind 4.1" />
              </a>
              <a href="https://www.radix-ui.com" target="_blank" rel="noreferrer noopener" title="Radix UI">
                <img src="https://img.shields.io/badge/Radix_UI-primitives-161618?style=flat-square&logo=radixui&logoColor=white" alt="Radix UI primitives" />
              </a>
              <a href="https://motion.dev" target="_blank" rel="noreferrer noopener" title="Motion 12">
                <img src="https://img.shields.io/badge/Motion-12-FF4D8D?style=flat-square&logo=framer&logoColor=white" alt="Motion 12" />
              </a>
              <a href="https://reactrouter.com" target="_blank" rel="noreferrer noopener" title="React Router 7">
                <img src="https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white" alt="React Router 7" />
              </a>
              <a href="https://supabase.com" target="_blank" rel="noreferrer noopener" title="Supabase">
                <img src="https://img.shields.io/badge/Supabase-backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase backend" />
              </a>
              <a href="https://www.anthropic.com" target="_blank" rel="noreferrer noopener" title="Claude Opus 4.8">
                <img src="https://img.shields.io/badge/Claude-Opus_4.8-D97757?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Opus 4.8" />
              </a>
            </div>
          </div>
        </section>

        {/* ⑥ Contact */}
        <section id="contatti" className="hm-contact">
          <div className="hm-wrap hm-contact-inner">
            <p className="hm-eyebrow hm-eyebrow--light">✉️ Contact</p>
            <h2 className="hm-contact-title">Let's talk. 💬</h2>
            <p className="hm-contact-lead">
              For collaborations, web projects or simply to exchange ideas — I'm available.
            </p>
            <div className="hm-contact-actions">
              <a href={`mailto:${EMAIL}`} className="hm-pill hm-pill--light"><Mail size={18} aria-hidden="true" /> Email me</a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener" className="hm-pill hm-pill--lightghost"><WhatsAppIcon size={18} /> WhatsApp</a>
              <a href={PHONE_HREF} className="hm-pill hm-pill--lightghost"><Phone size={18} aria-hidden="true" /> Call me</a>
              <Link to="/sostieni" className="hm-pill hm-pill--lightghost"><Heart size={18} aria-hidden="true" /> Support me</Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer condiviso: lo stesso, tradotto, su ogni pagina ── */}
      <SiteFooter />

      {/* Visualizzatore PDF generico (CV + attestati) */}
      {docOpen && (
        <div className="ap-cv-modal" role="dialog" aria-modal="true" aria-label={docOpen.title}>
          <div className="ap-cv-backdrop" onClick={() => setDocOpen(null)} aria-hidden="true" />
          <div className="ap-cv-dialog">
            <div className="ap-cv-bar">
              <span className="ap-cv-title">{docOpen.title}</span>
              <div className="d-flex align-items-center gap-2">
                <a href={docOpen.url} target="_blank" rel="noreferrer noopener" className="btn btn-sm btn-outline-light fw-semibold d-none d-sm-inline-flex align-items-center">
                  <ExternalLink size={15} className="me-1" aria-hidden="true" /> New tab
                </a>
                <a href={docOpen.url} download className="btn btn-sm btn-light fw-semibold d-inline-flex align-items-center">
                  <Download size={15} className="me-1" aria-hidden="true" /> Download
                </a>
                <button type="button" className="ap-cv-close" onClick={() => setDocOpen(null)} aria-label="Close the document preview">
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <a href={docOpen.url} target="_blank" rel="noreferrer noopener" className="ap-cv-fallback d-sm-none">
              On mobile the PDF preview may not load — tap here to open the file →
            </a>
            <iframe className="ap-cv-frame" src={`${docOpen.url}#view=FitH&toolbar=1&navpanes=0`} title={`Preview: ${docOpen.title}`} />
          </div>
        </div>
      )}

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Home "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso,
           /dubliners, /gattopardo). Sfondo scuro profondo, superfici "vetro",
           neon viola. Autosufficiente: non tocca la pagina /bio (stile chiaro).
           ───────────────────────────────────────────────────────────────────── */
        .hm-page {
          --accent: #8b7bff;
          --accent-2: #7c6cff;
          --accent-deep: #5b4bd6;
          --ink: #c4a5ff;
          --glow: rgba(139, 123, 255, 0.45);
          --text: #e8eef4;
          --sub: #a7b2bd;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(139, 123, 255, 0.10);
          --vio-bd: rgba(139, 123, 255, 0.28);
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(139, 123, 255, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #0b0f14 0%, #090c10 100%);
        }
        .hm-wrap {
          width: 100%; max-width: 1200px; margin: 0 auto;
          padding-left: 1.25rem; padding-right: 1.25rem;
        }
        .hm-ink { color: var(--ink); font-weight: 700; }

        /* ── Header ── */
        .hm-hdr {
          position: sticky; top: 0; z-index: 50;
          background: rgba(10, 13, 17, 0.72);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid var(--surface-bd);
          transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .hm-hdr--scrolled {
          background: rgba(8, 11, 15, 0.92);
          border-bottom-color: var(--vio-bd);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        }
        .hm-hdr-inner { display: flex; align-items: center; gap: 1rem; height: 66px; }
        .hm-brand { display: flex; align-items: center; gap: 0.7rem; text-decoration: none; color: var(--text); flex-shrink: 0; }
        .hm-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px; overflow: hidden;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .hm-brand-mark img { width: 100%; height: 100%; display: block; }
        .hm-brand-text { display: inline-flex; flex-direction: column; line-height: 1.18; }
        .hm-brand-name { font-weight: 800; font-size: 1.02rem; color: #ffffff; white-space: nowrap; }
        .hm-brand-tag { font-size: 0.74rem; color: var(--sub); white-space: nowrap; }
        .hm-local { font-size: 0.68rem; background: var(--accent); color: #0a0d11; font-weight: 800; padding: 0.12rem 0.5rem; border-radius: 999px; margin-left: 0.5rem; }
        @media (max-width: 480px) { .hm-brand-tag { display: none; } }

        .hm-nav { display: flex; align-items: center; gap: 1.35rem; margin-left: auto; }
        .hm-link { color: var(--sub); text-decoration: none; font-size: 0.92rem; font-weight: 600; transition: color 0.15s; }
        .hm-link:hover { color: #ffffff; }
        .hm-right { display: flex; align-items: center; gap: 0.85rem; }
        .hm-social { display: flex; gap: 0.6rem; }
        .hm-social a { color: var(--sub); display: inline-flex; transition: color 0.15s; }
        .hm-social a:hover { color: var(--ink); }
        .hm-cta {
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #ffffff !important; padding: 0.5rem 1.15rem; border-radius: 999px;
          font-weight: 700; font-size: 0.9rem; text-decoration: none; white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 6px 20px var(--glow);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .hm-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 26px var(--glow); }
        .hm-burger { display: none; background: none; border: none; color: var(--text); cursor: pointer; padding: 6px; line-height: 1; }

        /* ── Menu mobile a schermo intero ── */
        .hm-menu { position: fixed; inset: 0; z-index: 1000; visibility: hidden; pointer-events: none; }
        .hm-menu.open { visibility: visible; pointer-events: auto; }
        .hm-menu-scrim {
          position: absolute; inset: 0; border: none; cursor: pointer;
          background: rgba(5, 7, 10, 0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          opacity: 0; transition: opacity 0.28s ease;
        }
        .hm-menu.open .hm-menu-scrim { opacity: 1; }
        .hm-menu-sheet {
          position: absolute; top: 0; right: 0; height: 100%;
          width: min(90vw, 400px);
          background:
            radial-gradient(120% 60% at 100% 0%, rgba(139, 123, 255, 0.20) 0%, transparent 60%),
            linear-gradient(165deg, #181226 0%, #0d1016 60%, #0a0d11 100%);
          border-left: 1px solid var(--vio-bd);
          box-shadow: -24px 0 60px rgba(0, 0, 0, 0.55);
          color: #fff;
          padding: calc(env(safe-area-inset-top) + 1.1rem) 1.5rem calc(env(safe-area-inset-bottom) + 1.5rem);
          display: flex; flex-direction: column;
          transform: translateX(102%); transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          overflow-y: auto;
        }
        .hm-menu.open .hm-menu-sheet { transform: translateX(0); }

        .hm-menu-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; }
        .hm-menu-brand { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 1.02rem; color: #fff; }
        .hm-menu-brand .hm-brand-mark { width: 32px; height: 32px; border-radius: 9px; }
        .hm-menu-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          background: var(--vio-soft); border: 1px solid var(--vio-bd); color: #fff; cursor: pointer;
          transition: background 0.15s, transform 0.15s;
        }
        .hm-menu-close:hover { background: rgba(139, 123, 255, 0.2); transform: rotate(90deg); }

        .hm-menu-nav { display: flex; flex-direction: column; gap: 0.2rem; }
        .hm-menu-nav a {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          color: #fff; text-decoration: none; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em;
          padding: 0.85rem 0.2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .hm-menu-nav a svg { color: var(--ink); opacity: 0; transform: translateX(-6px); transition: opacity 0.18s, transform 0.18s; }
        .hm-menu-nav a:hover { color: var(--ink); }
        .hm-menu-nav a:hover svg, .hm-menu-nav a:active svg { opacity: 1; transform: translateX(0); }
        /* entrata "a cascata" delle voci quando il menu si apre */
        .hm-menu.open .hm-menu-nav a {
          animation: hm-menu-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) backwards;
          animation-delay: calc(0.12s + var(--i) * 0.05s);
        }
        @keyframes hm-menu-in { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }

        .hm-menu-foot { margin-top: auto; padding-top: 1.6rem; display: flex; flex-direction: column; gap: 1.2rem; }
        .hm-menu-contacts { display: flex; flex-direction: column; gap: 0.75rem; }
        .hm-menu-contacts a { color: rgba(255, 255, 255, 0.82); text-decoration: none; display: flex; align-items: center; gap: 0.6rem; font-size: 0.98rem; }
        .hm-menu-contacts a svg { color: var(--ink); flex-shrink: 0; }
        .hm-menu-contacts a:hover { color: #fff; }
        .hm-menu-social { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .hm-menu-social a {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 11px;
          background: var(--surface); border: 1px solid var(--surface-bd); color: var(--sub);
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .hm-menu-social a:hover { color: #fff; border-color: var(--vio-bd); background: var(--vio-soft); }

        @media (prefers-reduced-motion: reduce) {
          .hm-menu-sheet { transition: none; }
          .hm-menu.open .hm-menu-nav a { animation: none; }
        }

        /* ── Hero ── */
        .hm-hero {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 6rem) 0 clamp(3.5rem, 8vw, 6.5rem);
          border-bottom: 1px solid var(--surface-bd);
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(139, 123, 255, 0.20) 0%, transparent 55%),
            linear-gradient(160deg, #15101f 0%, #1a1430 45%, #0b0f14 110%);
        }
        .hm-hero::before, .hm-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(70px); opacity: 0.4; pointer-events: none; z-index: 0;
        }
        .hm-hero::before { background: #8b7bff; top: -32%; right: -8%; }
        .hm-hero::after  { background: #5b4bd6; bottom: -38%; left: -12%; opacity: 0.3; }
        .hm-hero-grid {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(2rem, 5vw, 4rem); align-items: center;
        }
        .hm-hero-main { min-width: 0; }
        .hm-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 0.9rem; border-radius: 999px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
          color: var(--ink); font-weight: 700; font-size: 0.8rem;
          letter-spacing: 0.04em; margin: 0 0 1.2rem;
        }
        .hm-hero-name {
          font-size: clamp(2.6rem, 7vw, 4.6rem); font-weight: 800; line-height: 1.02;
          letter-spacing: -0.02em; color: #ffffff; margin: 0 0 1.1rem;
        }
        .hm-hero-rule { display: block; width: 64px; height: 4px; border-radius: 2px; background: var(--accent); box-shadow: 0 0 18px var(--glow); margin-bottom: 1.3rem; }
        .hm-hero-lead { font-size: clamp(1.15rem, 1.9vw, 1.45rem); line-height: 1.55; font-weight: 600; color: #ffffff; margin: 0 0 1rem; max-width: 42rem; }
        .hm-hero-sub { font-size: clamp(1rem, 1.5vw, 1.12rem); line-height: 1.65; color: var(--sub); margin: 0 0 1.8rem; max-width: 40rem; }
        .hm-hero-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1.8rem; }
        .hm-hero-quick { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: center; }

        /* Pillole */
        .hm-pill {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.7rem 1.5rem; border-radius: 999px; font-weight: 700; font-size: 0.95rem;
          text-decoration: none; cursor: pointer; border: 1.5px solid transparent;
          transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .hm-pill--solid { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; box-shadow: 0 8px 24px var(--glow); }
        .hm-pill--solid:hover { transform: translateY(-2px); box-shadow: 0 12px 30px var(--glow); }
        .hm-pill--ghost { background: var(--vio-soft); color: var(--text); border-color: var(--vio-bd); }
        .hm-pill--ghost:hover { border-color: var(--accent); color: #fff; background: rgba(139, 123, 255, 0.16); }
        .hm-pill--light { background: #fff; color: #1a1430; }
        .hm-pill--light:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3); }
        .hm-pill--lightghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, 0.5); }
        .hm-pill--lightghost:hover { background: rgba(255, 255, 255, 0.14); }

        /* Quick-link progetti */
        .hm-quick {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.95rem 0.4rem 0.4rem;
          background: var(--surface); border: 1px solid var(--surface-bd); border-radius: 999px;
          text-decoration: none; color: var(--text); font-weight: 600; font-size: 0.9rem;
          transition: transform 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
        }
        .hm-quick:hover { transform: translateY(-2px); border-color: var(--vio-bd); color: #fff; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4); }
        .hm-quick-ic { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: var(--vio-soft); color: var(--ink); flex-shrink: 0; }

        /* Ritratto */
        .hm-hero-aside { display: flex; justify-content: center; }
        .hm-portrait {
          position: relative; width: 100%; max-width: 360px; border-radius: 22px; overflow: hidden;
          border: 1px solid var(--vio-bd);
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6), 0 0 50px var(--glow);
        }
        .hm-portrait img { width: 100%; height: auto; display: block; aspect-ratio: 3 / 4; object-fit: cover; }

        /* ── Sezioni ── */
        .hm-sec { padding: clamp(3.5rem, 7vw, 5.5rem) 0; position: relative; }
        .hm-sec--alt { background: rgba(255, 255, 255, 0.018); border-top: 1px solid var(--surface-bd); border-bottom: 1px solid var(--surface-bd); }
        .hm-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
        .hm-eyebrow { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; color: var(--ink); margin: 0 0 0.5rem; }
        .hm-eyebrow--light { color: rgba(255, 255, 255, 0.85); }
        .hm-title { font-size: clamp(1.9rem, 4vw, 2.6rem); font-weight: 800; line-height: 1.1; color: #ffffff; margin: 0; }
        .hm-action { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--ink); font-weight: 700; font-size: 0.9rem; text-decoration: none; white-space: nowrap; }
        .hm-action:hover { color: #fff; }

        /* ── Esame di Maturità — cartella "in evidenza" (accento oro) ── */
        .hm-mat-sec { padding-top: clamp(2.75rem, 6vw, 4.25rem); padding-bottom: clamp(2.75rem, 6vw, 4.25rem); }
        .hm-mat-folder {
          --gold: #f5b301; --gold-2: #fbbf24; --gold-deep: #b97e05;
          --gold-bd: rgba(245, 179, 1, 0.34); --gold-soft: rgba(245, 179, 1, 0.10);
          position: relative; margin-top: 1.5rem;
          padding: clamp(2.6rem, 4vw, 3.4rem) clamp(1.25rem, 3vw, 2.5rem) clamp(1.75rem, 3vw, 2.5rem);
          border: 1px solid var(--gold-bd); border-radius: 24px;
          background:
            radial-gradient(120% 90% at 0% 0%, rgba(245, 179, 1, 0.12) 0%, transparent 55%),
            linear-gradient(180deg, rgba(245, 179, 1, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%);
          box-shadow: 0 26px 64px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        /* riga "evidenziatore" oro: bordo superiore della cartella, agganciato
           ai bordi della linguetta e del badge (che la coprono alle estremità) */
        .hm-mat-folder::after {
          content: ""; position: absolute; z-index: 1;
          left: clamp(1.25rem, 3vw, 2.5rem); right: clamp(1.25rem, 3vw, 2.5rem);
          top: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold) 0%, var(--gold-2) 100%);
          border-radius: 2px; opacity: 0.92; pointer-events: none;
        }
        /* linguetta della cartella — sopra la riga oro, la copre a sinistra */
        .hm-mat-tab {
          position: absolute; z-index: 2; top: -16px; left: clamp(1.25rem, 3vw, 2.5rem);
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1.1rem; border-radius: 12px;
          background: linear-gradient(140deg, var(--gold) 0%, var(--gold-deep) 130%);
          color: #1a1206; font-weight: 800; font-size: 0.86rem;
          border: 1px solid rgba(255, 255, 255, 0.28);
          box-shadow: 0 10px 24px rgba(245, 179, 1, 0.28);
        }
        /* badge "in evidenza" — sopra la riga oro, opaco, la copre a destra */
        .hm-mat-pin {
          position: absolute; z-index: 2; top: -13px; right: clamp(1.25rem, 3vw, 2.5rem);
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.85rem; border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(245, 179, 1, 0.16) 0%, rgba(245, 179, 1, 0.05) 100%),
            #0c0f13;
          color: var(--gold-2); border: 1px solid var(--gold-bd);
          font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        .hm-mat-head { margin-bottom: 2rem; }
        .hm-eyebrow--gold { color: var(--gold-2); }
        .hm-gold-ink { color: var(--gold-2); font-weight: 700; }
        .hm-mat-lead {
          font-size: clamp(1rem, 1.6vw, 1.15rem); line-height: 1.65; color: var(--sub);
          margin: 0.9rem 0 0; max-width: 52rem;
        }
        .hm-mat-count {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--gold-2);
        }
        .hm-mat-meta {
          display: flex; align-items: center; flex-wrap: wrap; gap: 0.9rem 1.4rem; margin-top: 1.1rem;
        }

        /* ── Striscione "ce l'ho fatta" — stendardo orizzontale coast-to-coast che
           si srotola dal centro verso i bordi all'hover o entrando in viewport ── */
        .hm-mat-reveal { display: block; }
        .hm-mat-trigger {
          display: inline-flex; align-items: center; gap: 0.4rem;
          cursor: help; user-select: none; width: max-content; outline: none;
          -webkit-tap-highlight-color: transparent;
          transition: filter 0.25s ease;
        }
        .hm-mat-trigger:hover,
        .hm-mat-trigger:focus-visible,
        .hm-mat-reveal.is-revealed .hm-mat-trigger {
          filter: drop-shadow(0 0 10px rgba(245, 179, 1, 0.55));
        }
        /* full-bleed: esce dalla cartella e arriva ai bordi dello schermo.
           Comparsa/uscita in DISSOLVENZA: opaco quando arrivo scrollando, svanisce
           andando via. */
        .hm-striscione {
          width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);
          margin-top: 0; max-height: 0; opacity: 0; overflow: visible;
          transform: translateY(-14px);
          transition: max-height 0.5s ease, opacity 0.65s ease,
                      transform 0.65s ease, margin-top 0.4s ease;
          pointer-events: none;
        }
        .hm-mat-trigger:hover ~ .hm-striscione,
        .hm-mat-trigger:focus-visible ~ .hm-striscione,
        .hm-mat-reveal.is-revealed .hm-striscione {
          max-height: 260px; opacity: 1; margin-top: 1rem; transform: translateY(0);
        }
        /* cordoncino + bandierine triangolari (▽) ripetute su tutta la larghezza */
        .hm-bunting {
          position: relative; height: 16px; width: 100%;
          background:
            conic-gradient(from -45deg at 50% 100%, var(--gold) 0 90deg, transparent 90deg),
            conic-gradient(from -45deg at 50% 100%, var(--gold-2) 0 90deg, transparent 90deg);
          background-repeat: repeat-x, repeat-x;
          background-size: 48px 16px, 48px 16px;
          background-position: 0 0, 24px 0;
          filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.35));
        }
        .hm-bunting::before {
          content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: var(--gold-bd);
        }
        /* stendardo: drappo a tutta larghezza, bordo inferiore ondulato (mask SVG)
           che ondeggia come una bandiera al vento */
        .hm-striscione-body {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          width: 100%; padding: clamp(0.7rem, 1.8vw, 1.1rem) 1rem clamp(1.2rem, 3vw, 2rem);
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-deep) 140%);
          color: #1a1206; font-weight: 900;
          font-size: clamp(1rem, 3.2vw, 1.7rem); line-height: 1.3;
          text-align: center; letter-spacing: 0.005em;
          border-top: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
          filter: drop-shadow(0 14px 26px rgba(0, 0, 0, 0.42));
          -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201200%20100'%20preserveAspectRatio='none'%3E%3Cpath%20d='M0,0%20H1200%20V84%20C1100,98%201000,98%20900,84%20S700,70%20600,84%20S400,98%20300,84%20S100,70%200,84%20Z'%20fill='%23fff'/%3E%3C/svg%3E");
                  mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201200%20100'%20preserveAspectRatio='none'%3E%3Cpath%20d='M0,0%20H1200%20V84%20C1100,98%201000,98%20900,84%20S700,70%20600,84%20S400,98%20300,84%20S100,70%200,84%20Z'%20fill='%23fff'/%3E%3C/svg%3E");
          -webkit-mask-size: 100% 100%; mask-size: 100% 100%;
          -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
        }
        .hm-striscione-body b { color: #2a1c00; }
        .hm-striscione-text { position: relative; z-index: 1; }
        /* ondeggio "al vento" quando il drappo è visibile */
        .hm-mat-trigger:hover ~ .hm-striscione .hm-striscione-body,
        .hm-mat-trigger:focus-visible ~ .hm-striscione .hm-striscione-body,
        .hm-mat-reveal.is-revealed .hm-striscione-body {
          animation: hm-striscione-wave 5.5s ease-in-out infinite;
        }
        @keyframes hm-striscione-wave {
          0%, 100% { transform: translateY(0) skewY(-0.35deg); }
          50% { transform: translateY(-5px) skewY(0.35deg); }
        }
        /* lampo di luce che spazza il drappo da sinistra a destra */
        .hm-striscione-body::after {
          content: ""; position: absolute; inset: 0; z-index: 0;
          background: linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.5) 50%, transparent 65%);
          transform: translateX(-130%);
        }
        .hm-mat-trigger:hover ~ .hm-striscione .hm-striscione-body::after,
        .hm-mat-trigger:focus-visible ~ .hm-striscione .hm-striscione-body::after,
        .hm-mat-reveal.is-revealed .hm-striscione-body::after {
          animation: hm-striscione-shine 2.6s ease 0.5s infinite;
        }
        @keyframes hm-striscione-shine {
          0% { transform: translateX(-130%); }
          45%, 100% { transform: translateX(130%); }
        }

        /* ── Countdown pubblicazione voti ── */
        .hm-voti {
          display: inline-flex; flex-direction: column; gap: 0.5rem;
          padding: 0.7rem 1rem; border-radius: 14px;
          background: var(--gold-soft); border: 1px solid var(--gold-bd);
        }
        .hm-voti-label {
          font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--gold-2);
        }
        .hm-voti-clock { display: flex; align-items: flex-start; gap: 0.45rem; }
        .hm-voti-tile {
          position: relative; display: flex; flex-direction: column; align-items: center;
          min-width: 2.6rem; padding: 0.4rem 0.55rem; border-radius: 10px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.18));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .hm-voti-num {
          font-size: clamp(1.2rem, 2.4vw, 1.5rem); font-weight: 900; line-height: 1;
          color: var(--gold-2); font-variant-numeric: tabular-nums;
        }
        .hm-voti-unit {
          margin-top: 0.25rem; font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em; color: var(--sub);
        }
        .hm-voti-sep {
          position: absolute; right: -0.42rem; top: 50%; transform: translateY(-65%);
          font-size: 1.1rem; font-weight: 900; color: var(--gold-2); opacity: 0.6;
        }
        .hm-voti.is-result {
          background: var(--gold-soft); border-color: var(--gold-bd);
        }
        .hm-voti-result {
          display: flex; align-items: baseline; gap: 0.1rem;
          animation: hm-voti-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hm-voti-grade-num {
          font-size: clamp(1.9rem, 4vw, 2.5rem); font-weight: 900; line-height: 1;
          color: var(--gold-2); font-variant-numeric: tabular-nums;
          text-shadow: 0 1px 12px rgba(212, 165, 60, 0.35);
        }
        .hm-voti-grade-den {
          font-size: clamp(0.95rem, 1.8vw, 1.15rem); font-weight: 800;
          color: var(--sub); font-variant-numeric: tabular-nums;
        }
        @keyframes hm-voti-pop {
          0% { opacity: 0; transform: scale(0.6); }
          60% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-striscione { transition: opacity 0.3s ease; transform: none; }
          .hm-striscione-body { animation: none !important; }
          .hm-striscione-body::after { animation: none; display: none; }
          .hm-voti-result { animation: none; }
        }

        /* le card dentro la cartella Maturità prendono il riflesso oro all'hover */
        .hm-cards--mat .hm-card:hover {
          border-color: var(--gold-bd);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--gold-soft);
        }
        @media (max-width: 575.98px) {
          .hm-mat-tab, .hm-gam-tab { font-size: 0.8rem; }
        }

        /* ── Giochi Web — cartella "in evidenza" (accento ciano) ── */
        .hm-gam-sec { padding-top: clamp(2.75rem, 6vw, 4.25rem); padding-bottom: clamp(2.75rem, 6vw, 4.25rem); }
        .hm-gam-folder {
          --cyan: #22d3ee; --cyan-2: #67e8f9; --cyan-deep: #0e7490;
          --cyan-bd: rgba(34, 211, 238, 0.34); --cyan-soft: rgba(34, 211, 238, 0.10);
          position: relative; margin-top: 1.5rem;
          padding: clamp(2.6rem, 4vw, 3.4rem) clamp(1.25rem, 3vw, 2.5rem) clamp(1.75rem, 3vw, 2.5rem);
          border: 1px solid var(--cyan-bd); border-radius: 24px;
          background:
            radial-gradient(120% 90% at 0% 0%, rgba(34, 211, 238, 0.10) 0%, transparent 55%),
            linear-gradient(180deg, rgba(34, 211, 238, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          box-shadow: 0 26px 64px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        /* riga "evidenziatore" ciano: bordo superiore, coperta alle estremità
           dalla linguetta e dal badge */
        .hm-gam-folder::after {
          content: ""; position: absolute; z-index: 1;
          left: clamp(1.25rem, 3vw, 2.5rem); right: clamp(1.25rem, 3vw, 2.5rem);
          top: 0; height: 2px;
          background: linear-gradient(90deg, var(--cyan) 0%, var(--cyan-2) 100%);
          border-radius: 2px; opacity: 0.92; pointer-events: none;
        }
        /* linguetta ciano — sopra la riga, la copre a sinistra */
        .hm-gam-tab {
          position: absolute; z-index: 2; top: -16px; left: clamp(1.25rem, 3vw, 2.5rem);
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1.1rem; border-radius: 12px;
          background: linear-gradient(140deg, var(--cyan) 0%, var(--cyan-deep) 130%);
          color: #07222b; font-weight: 800; font-size: 0.86rem;
          border: 1px solid rgba(255, 255, 255, 0.28);
          box-shadow: 0 10px 24px rgba(34, 211, 238, 0.28);
        }
        /* badge "in evidenza" ciano — sopra la riga, opaco, la copre a destra */
        .hm-gam-pin {
          position: absolute; z-index: 2; top: -13px; right: clamp(1.25rem, 3vw, 2.5rem);
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.85rem; border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(34, 211, 238, 0.16) 0%, rgba(34, 211, 238, 0.05) 100%),
            #0c0f13;
          color: var(--cyan-2); border: 1px solid var(--cyan-bd);
          font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        .hm-eyebrow--cyan { color: var(--cyan-2); }
        .hm-cyan-ink { color: var(--cyan-2); font-weight: 700; }
        .hm-gam-lead {
          font-size: clamp(1rem, 1.6vw, 1.15rem); line-height: 1.65; color: var(--sub);
          margin: 0.9rem 0 0; max-width: 52rem;
        }
        /* card con riflesso ciano all'hover */
        .hm-cards--gam .hm-card:hover {
          border-color: var(--cyan-bd);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--cyan-soft);
        }

        /* Card */
        .hm-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6rem; }
        .hm-card {
          display: flex; flex-direction: column; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 18px; overflow: hidden;
          text-decoration: none; color: inherit; text-align: left;
          transition: transform 0.16s, box-shadow 0.16s, border-color 0.16s;
        }
        .hm-card:hover { transform: translateY(-4px); border-color: var(--vio-bd); box-shadow: 0 20px 44px rgba(0, 0, 0, 0.5); }
        .hm-card-media { height: 200px; overflow: hidden; border-bottom: 1px solid var(--surface-bd); }
        .hm-card-shot { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hm-card-icon {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(120% 120% at 30% 20%, rgba(139, 123, 255, 0.22), rgba(10, 12, 16, 0.2)),
            linear-gradient(135deg, #15101f 0%, #0b0f14 100%);
        }
        .hm-card-icon-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 22px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          color: #fff; border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .hm-card:hover .hm-card-icon-badge { transform: scale(1.05); transition: transform 0.16s; }
        .hm-card-body { display: flex; flex-direction: column; flex: 1 1 auto; padding: 1.25rem 1.25rem 1.4rem; }
        .hm-card-meta { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink); margin-bottom: 0.4rem; }
        .hm-card-titlerow { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.3rem; }
        .hm-card-title { font-size: 1.15rem; font-weight: 800; color: #ffffff; line-height: 1.2; }
        .hm-card-date { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sub); margin-bottom: 0.6rem; }
        .hm-card-desc { font-size: 0.92rem; line-height: 1.55; color: var(--sub); margin: 0 0 1rem; }
        .hm-card-link { margin-top: auto; display: inline-flex; align-items: center; gap: 0.35rem; color: var(--ink); font-weight: 700; font-size: 0.9rem; }
        .hm-card:hover .hm-card-link { color: #fff; }

        /* Badge "Live" */
        .hm-badge { display: inline-flex; align-items: center; gap: 0.4rem; flex-shrink: 0; font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; }
        .hm-badge--live { background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd); }
        .hm-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(139, 123, 255, 0.2); }

        /* CV buttons */
        .hm-cvbtns { display: flex; flex-wrap: wrap; gap: 0.7rem; align-items: center; }
        .hm-btn {
          display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.62rem 1.2rem;
          border-radius: 999px; font-weight: 700; font-size: 0.92rem; cursor: pointer;
          text-decoration: none; border: 1.5px solid transparent; font-family: inherit;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s, color 0.15s, border-color 0.15s;
        }
        .hm-btn--solid { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; box-shadow: 0 8px 22px var(--glow); }
        .hm-btn--solid:hover { transform: translateY(-2px); box-shadow: 0 12px 28px var(--glow); }
        .hm-btn--ghost { background: var(--vio-soft); color: var(--text); border-color: var(--vio-bd); }
        .hm-btn--ghost:hover { border-color: var(--accent); color: #fff; }

        /* Timeline */
        .hm-timeline { position: relative; padding-left: 2rem; }
        .hm-timeline::before { content: ""; position: absolute; left: 7px; top: 6px; bottom: 6px; width: 2px; background: var(--vio-bd); }
        .hm-tl-item { position: relative; padding-bottom: 2rem; }
        .hm-tl-item:last-child { padding-bottom: 0; }
        .hm-tl-item::before {
          content: ""; position: absolute; left: -2rem; top: 4px; width: 16px; height: 16px; border-radius: 50%;
          background: var(--accent); border: 3px solid #0b0f14; box-shadow: 0 0 0 2px var(--vio-bd), 0 0 14px var(--glow);
        }
        .hm-tl-period { display: inline-block; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink); margin-bottom: 0.25rem; }
        .hm-tl-title { font-size: 1.18rem; font-weight: 800; color: #ffffff; margin: 0 0 0.2rem; }
        .hm-tl-role { font-weight: 700; color: var(--ink); margin: 0 0 0.5rem; }
        .hm-tl-desc { color: var(--sub); margin: 0; line-height: 1.65; }
        /* Variante "wish" (ambra) */
        .hm-tl-item--wish::before { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3), 0 0 14px rgba(245, 158, 11, 0.4); }
        .hm-tl-item--wish { opacity: 0.9; }
        .hm-tl-period--wish { color: #fbbf24; }
        .hm-tl-title--wish { font-weight: 600; font-style: italic; }
        .hm-tl-role--wish { color: #fcd34d; }
        .hm-cv-doc {
          display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.9rem;
          padding: 0.5rem 0.9rem; background: var(--vio-soft); border: 1px solid var(--vio-bd);
          border-radius: 999px; color: var(--ink); font-family: inherit; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; appearance: none; transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .hm-cv-doc:hover { background: var(--accent); border-color: var(--accent); color: #0a0d11; }

        /* Stack badges */
        .hm-stack { display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: center; }
        .hm-stack a { display: inline-flex; transition: transform 0.15s, opacity 0.15s; }
        .hm-stack a:hover { transform: translateY(-2px); opacity: 0.9; }
        .hm-stack img { height: auto; display: block; max-height: 32px; }

        /* ── Contact ── */
        .hm-contact {
          position: relative; overflow: hidden; color: #fff;
          padding: clamp(3.5rem, 7vw, 5.5rem) 0;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(139, 123, 255, 0.28) 0%, transparent 55%),
            linear-gradient(135deg, #1a1430 0%, #211a3d 55%, #15101f 100%);
          border-top: 1px solid var(--surface-bd);
        }
        .hm-contact-inner { position: relative; z-index: 1; text-align: center; max-width: 46rem; margin: 0 auto; }
        .hm-contact-title { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin: 0.3rem 0 1rem; color: #fff; }
        .hm-contact-lead { font-size: 1.1rem; line-height: 1.6; color: rgba(255, 255, 255, 0.88); margin: 0 auto 2rem; max-width: 38rem; }
        .hm-contact-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; justify-content: center; }

        /* Modale PDF — accento viola coerente con la home */
        .hm-page .ap-cv-bar { background: var(--accent-deep); }
        .hm-page .ap-cv-fallback { background: var(--vio-soft); color: var(--ink); border-bottom-color: var(--vio-bd); }

        /* ── Responsive ── */
        @media (max-width: 991.98px) {
          .hm-nav, .hm-social, .hm-cta { display: none; }
          .hm-burger { display: inline-flex; }
          .hm-right { margin-left: auto; }
          .hm-hero-grid { grid-template-columns: 1fr; }
          .hm-hero-aside { order: -1; }
          .hm-portrait { max-width: 300px; }
          .hm-cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 575.98px) {
          .hm-cards { grid-template-columns: 1fr; }
          .hm-card-media { height: 180px; }
          .hm-sec-head { align-items: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-card, .hm-quick, .hm-pill, .hm-btn, .hm-cta, .hm-drawer-panel, .hm-drawer-backdrop, .hm-card-icon-badge { transition: none; }
        }
      `}</style>
    </div>
  );
}
