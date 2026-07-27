import { useState, useEffect } from "react";
import { SiteLink as Link } from "./nav";
import SiteFooter from "./SiteFooter";
import { HOBBY, PASSIONI, SKILLS, type Interest } from "./data";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import {
  IcArrowLeft,
  IcArrowUpRight,
  IcClose,
  IcGame,
  IcGrad,
  IcGlobe,
  IcCode,
  IcPen,
  IcSparkle,
  IcCompass,
  IcHeart,
  IcCake,
  IcPin,
  IcBuilding,
  IcMoto,
  IcTarget,
  IcPlane,
  IcFork,
  IcUsers,
  IcPalette,
  IcBrick,
  IcTractor,
  IcScreen,
  IcStore,
  IcWrench,
  IcImage,
  IcExplore,
  type IcProps,
} from "./homeIcons";
import "../home.css";
import "./bio.css";

// ─────────────────────────────────────────────────────────────────────────────
// «Bio» — pagina About di Alberto Pecchini, rifatta sulla grammatica Supabase
// della home (.sb-): nav sottile 64px, hero a due colonne con ritratto in
// pannello, prose, fact-card, gallerie, blocchi racconto, liste hobby/passioni
// con modale di dettaglio, griglia competenze e box dove/formazione. Tema
// chiaro/scuro nativo via token --sb-* (home.css); stili propri in bio.css.
// ─────────────────────────────────────────────────────────────────────────────

// Icone della casa (homeIcons) al posto di lucide/emoji: una per interesse,
// scelta per etichetta (i dati condivisi in data.tsx restano intatti).
const INTEREST_ICON: Record<string, (p: IcProps) => JSX.Element> = {
  "Motorbikes": IcMoto,
  "Clay shooting": IcTarget,
  "Travel": IcPlane,
  "Video games": IcGame,
  "Good food": IcFork,
  "Time with friends": IcUsers,
  "Web design": IcPalette,
  "Restoration": IcBrick,
  "Working the land": IcTractor,
  "Digitising the business": IcScreen,
  "Volunteering": IcHeart,
  "Building a business": IcStore,
};
const iconFor = (label: string) => INTEREST_ICON[label] ?? IcSparkle;

const SKILL_ICON: Record<string, (p: IcProps) => JSX.Element> = {
  "Front-end development": IcCode,
  "Design & UX": IcPen,
  "AI-assisted development": IcSparkle,
  "Tools & Workflow": IcWrench,
  "CAT technical area": IcCompass,
  "IT & multimedia": IcImage,
  "On the ground": IcTractor,
  "Languages": IcGlobe,
};

// Cornice foto con didascalia. Se il file manca, la figure sparisce invece di
// lasciare un riquadro rotto: il layout a griglia si richiude da solo.
//
// `focus` imposta l'object-position (es. "50% 30%") per scegliere quale parte
// dell'immagine resta in cornice quando viene ritagliata in cover.
function Photo({
  src,
  alt,
  caption,
  focus,
}: {
  src: string;
  alt: string;
  caption?: string;
  focus?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="sb-bio-shot">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={focus ? { objectPosition: focus } : undefined}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// Foto della modale: se manca il file, sparisce e resta il solo testo.
function ModalPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="sb-bio-modal-photo">
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
    </div>
  );
}

export default function Bio() {
  const [selected, setSelected] = useState<Interest | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "About · Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Modale interessi: blocco scroll + chiusura con Esc.
  useEffect(() => {
    if (!selected) return;
    lockBodyScroll();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); unlockBodyScroll(); };
  }, [selected]);

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const now = new Date();
  const birthDate = new Date(2006, 5, 28);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;

  // Dati essenziali della sezione «Chi sono». L'età si ricalcola da sola.
  const FACTS = [
    // Il valore resta il numero puro: una stringa con l'età dentro non sarebbe
    // traducibile (la chiave del dizionario cambierebbe a ogni compleanno).
    { Icon: IcCake, value: `${age}`, label: "Years old · born 28 June 2006", noTranslate: false },
    { Icon: IcPin, value: "Rivalta sul Mincio", label: "Province of Mantua, Italy", noTranslate: true },
    { Icon: IcGrad, value: "CAT diploma, 2026", label: "ITT «Carlo d'Arco», Mantua", noTranslate: false },
    { Icon: IcBuilding, value: "UniMoRe", label: "Construction & Land Management", noTranslate: true },
  ];

  const renderList = (items: Interest[]) => (
    <div className="sb-bio-list">
      {items.map((it) => {
        const Icon = iconFor(it.label);
        return (
          <button
            type="button"
            className="sb-bio-item"
            key={it.label}
            onClick={() => setSelected(it)}
            aria-label={`Learn more: ${it.label}`}
          >
            <span className="sb-bio-item-icon" aria-hidden="true"><Icon size={19} /></span>
            <span className="sb-bio-item-label">{it.label}</span>
            <IcArrowUpRight size={16} className="go" />
          </button>
        );
      })}
    </div>
  );

  const SelectedIcon = selected ? iconFor(selected.label) : null;

  return (
    <div className="sb-home bio-page">
      {/* Skiplink — requisito di accessibilità */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      </div>

      {/* ── Nav sottile: brand + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-bio-tagline">Designer &amp; Front-end Developer</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-bio-back">
            <IcArrowLeft size={15} /> Back to home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Hero — titolo e presentazione a sinistra, ritratto a destra */}
        <section className="sb-hero" aria-labelledby="bio-hero-title">
          <div className="sb-container">
            <div className="sb-bio-hero-grid">
              <div>
                <h1 className="sb-hero-title" id="bio-hero-title">
                  <span>Hi, I'm Alberto.</span>
                </h1>
                <div className="sb-hero-copy" style={{ marginTop: "1.2rem" }}>
                  <p><strong>Designer &amp; front-end developer, raised between Rivalta sul Mincio and Mantua.</strong></p>
                  <p>Turning ideas into elegant, fast digital experiences.</p>
                </div>
              </div>
              <div className="sb-bio-portrait">
                <div className="sb-panel">
                  <div className="sb-panel-inner">
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
          </div>
        </section>

        {/* ② Chi sono */}
        <section className="sb-section" aria-labelledby="bio-chi-sono">
          <div className="sb-container">
            <div className="sb-bio-sechead">
              <span className="sb-bio-kicker">01 — Who I am</span>
              <h2 id="bio-chi-sono">A little about me</h2>
            </div>
            <div className="sb-bio-prose">
              <p>
                My name is Alberto Pecchini, I'm {age} and I grew up in{" "}
                <strong>Rivalta sul Mincio</strong>, a village in the province of Mantua where my
                family has both its roots and its business.
              </p>
              <p>
                I hold a <strong>CAT diploma</strong> — Construction, Environment and Territory —
                from the «Carlo d'Arco» Technical Institute in Mantua, and I'm now studying{" "}
                <strong>Construction and Land Management</strong> at the University of Modena and
                Reggio Emilia. Outside the classroom I'm a self-taught designer and front-end
                developer: I build responsive, fast and polished interfaces with React, Next.js,
                TypeScript, Tailwind CSS and GSAP.
              </p>
              <p>
                I've been giving a hand in the family business since I was a kid — not as a
                pastime, but as the way I learned what <strong>real work</strong> means. With my
                father I look after parks, pools and outdoor spaces, and I drive the farm
                machinery. It's concrete work, made of hands, seasons and attention to detail.
              </p>
              <p>
                In the business I've also taken over everything <strong>digital</strong>: online
                orders, the satellite imagery we use to prepare quotes, the listings for
                second-hand sales. That's where my two sides — the hands-on one and the digital
                one — meet.
              </p>
            </div>

            {/* Dati essenziali */}
            <div className="sb-bio-facts">
              {FACTS.map(({ Icon, value, label, noTranslate }) => (
                <div className="sb-panel" key={value}>
                  <div className="sb-panel-inner sb-bio-fact">
                    <span className="sb-bio-fact-icon" aria-hidden="true"><Icon size={18} /></span>
                    <span className="sb-bio-fact-value" {...(noTranslate ? { translate: "no" as const } : {})}>{value}</span>
                    <span className="sb-bio-fact-label">{label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dove sono cresciuto e cosa faccio, in tre scatti */}
            <div className="sb-bio-gallery">
              <Photo
                src="/images/me-stesso/rivalta.jpg"
                alt="Rivalta sul Mincio, where I grew up"
                caption="Between Rivalta and Mantua"
              />
              <Photo
                src="/images/me-stesso/cascina.jpg"
                alt="The family farm in Rivalta sul Mincio"
                caption="The family farm"
              />
              <Photo
                src="/images/me-stesso/trattore.jpg"
                alt="The Landini L25 Testacalda from 1957, the family's historic machine"
                caption="Landini L25 Testacalda · 1957"
                focus="50% 72%"
              />
            </div>

            {/* Il restauro: da dove è partito tutto */}
            <div className="sb-bio-story">
              <div>
                <Photo
                  src="/images/me-stesso/restauro-1.jpg"
                  alt="At the restoration course in 2018, working on an old wall"
                  caption="2018 — hands on the bricks"
                />
              </div>
              <div>
                <h3>Where it all started</h3>
                <div className="sb-bio-prose">
                  <p>
                    In 2018 — I was twelve — I took a <strong>restoration course</strong> at the
                    Mantua Seminary, today Unicollege Mantova, one of the youth projects run by
                    Santagnese10 Officina Creativa, the hub that hosts the city's first coworking
                    space.
                  </p>
                  <p>
                    With work gloves on I cleaned up and repaired old brick and cobblestone walls:
                    it was the first time I put my hands on a <strong>historic building</strong>,
                    and it stayed with me. Not long after, I chose the CAT programme — and the same
                    technical drawing I learned there is what later pulled me towards web design.
                  </p>
                </div>
              </div>
            </div>
            <div className="sb-bio-gallery sb-bio-gallery--two">
              <Photo
                src="/images/me-stesso/restauro-2.jpg"
                alt="The group of kids at the restoration course"
              />
              <Photo
                src="/images/me-stesso/restauro-3.jpg"
                alt="The historic brick and cobblestone building we worked on"
              />
            </div>
          </div>
        </section>

        {/* ③ Hobby + Passioni come liste cliccabili */}
        <section className="sb-section" aria-labelledby="bio-hobby">
          <div className="sb-container">
            <div className="sb-bio-twocol">
              <div>
                <div className="sb-bio-listhead">
                  <span className="sb-bio-kicker">My hobbies</span>
                  <h2 id="bio-hobby">In my free time</h2>
                </div>
                {renderList(HOBBY)}
              </div>
              <div>
                <div className="sb-bio-listhead">
                  <span className="sb-bio-kicker">My passions</span>
                  <h2>What drives me</h2>
                </div>
                {renderList(PASSIONI)}
              </div>
            </div>
          </div>
        </section>

        {/* ④ Competenze */}
        <section className="sb-section" aria-labelledby="bio-skills">
          <div className="sb-container">
            <div className="sb-bio-sechead">
              <span className="sb-bio-kicker">02 — Skills</span>
              <h2 id="bio-skills">What I work with</h2>
            </div>
            <div className="sb-bio-skillgrid">
              {SKILLS.map((group) => {
                const Icon = SKILL_ICON[group.title] ?? IcSparkle;
                return (
                  <div className="sb-panel" key={group.title}>
                    <div className="sb-panel-inner sb-bio-skill">
                      <div className="sb-bio-skill-title">
                        <Icon size={18} />
                        <span>{group.title}</span>
                      </div>
                      <div className="sb-bio-chips">
                        {group.items.map((item) => (
                          <span key={item} className="sb-chip">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ⑤ Dove + Formazione */}
        <section className="sb-section" aria-labelledby="bio-dove">
          <div className="sb-container">
            <div className="sb-bio-sechead">
              <span className="sb-bio-kicker">03 — Where &amp; education</span>
              <h2 id="bio-dove">Based &amp; trained</h2>
            </div>
            <div className="sb-bio-twocol">
              <div className="sb-panel">
                <div className="sb-panel-inner sb-bio-box">
                  <span className="sb-bio-boxlabel">Where I'm based</span>
                  <p className="sb-bio-based">
                    <IcPin size={16} aria-hidden="true" /> Rivalta sul Mincio · Mantua, Italy
                  </p>
                  <p className="sb-bio-boxlead">
                    I live and work where I grew up, a few kilometres from Mantua, and I'm available
                    for remote work, freelance projects and collaborations.
                  </p>
                  <ul className="sb-bio-lines">
                    <li>
                      <IcExplore size={15} aria-hidden="true" /> Italy · San Marino · Switzerland · Austria
                    </li>
                    <li>
                      <IcExplore size={15} aria-hidden="true" /> France · Ireland · Scotland
                    </li>
                  </ul>
                </div>
              </div>
              <div className="sb-panel">
                <div className="sb-panel-inner sb-bio-box">
                  <span className="sb-bio-boxlabel">Education &amp; training</span>
                  <p className="sb-bio-boxlead">
                    CAT diploma at ITT «Carlo d'Arco» in Mantua, now studying Construction and Land
                    Management at the University of Modena and Reggio Emilia; English C1 (IELTS)
                    achieved in Dublin.
                  </p>
                  <ul className="sb-bio-lines">
                    <li>
                      <IcGrad size={15} aria-hidden="true" /> UniMoRe «Enzo Ferrari» — Construction &amp; Land Management, since 2026
                    </li>
                    <li>
                      <IcGrad size={15} aria-hidden="true" /> ITT «Carlo d'Arco» — CAT diploma, 2021—2026
                    </li>
                    <li>
                      <IcGrad size={15} aria-hidden="true" /> CES Dublin — IELTS, level C1, August 2024
                    </li>
                    <li>
                      <IcGrad size={15} aria-hidden="true" /> Workplace safety, low risk — Mantua, 2023
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Dublino: il mese che ha portato al C1 */}
            <div className="sb-bio-story">
              <div>
                <h3>A month living in English</h3>
                <div className="sb-bio-prose">
                  <p>
                    The trip I care about most I gave to myself: in the summer of{" "}
                    <strong>2024</strong>, just turned eighteen, I left for a language stay in{" "}
                    <strong>Dublin</strong>. I took a plane for the first time, discovered a new
                    country, and for a month I tried living and studying entirely in English.
                  </p>
                  <p>
                    Four weeks of full immersion at the CES centre on Dame Court — twenty-six
                    lessons a week on speaking, writing, reading and listening — and the{" "}
                    <strong>IELTS exam passed at level C1</strong> at the end of the course. In
                    between, I explored on my own: Howth, Bray, Glendalough, Galway.
                  </p>
                </div>
              </div>
              <div>
                <Photo
                  src="/images/me-stesso/dublino.jpg"
                  alt="Language stay in Dublin"
                  caption="Dublin — my present to myself at eighteen"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* ── Modale di dettaglio hobby/passioni ── */}
      {selected && SelectedIcon && (
        <>
          <div className="sb-bio-modal-backdrop" onClick={() => setSelected(null)} aria-hidden="true" />
          <div
            className="sb-bio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sb-bio-modal-title"
          >
            <div className="sb-panel">
              <div className="sb-panel-inner">
                <button
                  type="button"
                  className="sb-bio-modal-close"
                  onClick={() => setSelected(null)}
                  aria-label="Close the details"
                >
                  <IcClose size={18} />
                </button>
                {selected.img && (
                  <ModalPhoto key={selected.img} src={selected.img} alt={selected.label} />
                )}
                <div className="sb-bio-modal-body">
                  <span className="sb-bio-modal-icon" aria-hidden="true"><SelectedIcon size={22} /></span>
                  <h2 id="sb-bio-modal-title">{selected.label}</h2>
                  <p>{selected.desc}</p>
                  {selected.link && (
                    <Link to={selected.link} className="sb-btn sb-btn--primary sb-bio-modal-link">
                      <IcGame size={16} /> {selected.linkLabel ?? "Open"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
