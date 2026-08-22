import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { PageBackdrop } from "../site/homeFx";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import { CV_DOC, cvUpdatedLabel, type CvEntry } from "./cvData";
import { EMAIL } from "../site/data";
import {
  IcArrowLeft,
  IcDownload,
  IcMail,
  IcFile,
  IcGlobe,
  IcPin,
  IcId,
  IcCode,
  IcGrad,
  IcCompass,
  IcPlane,
  IcHeart,
  IcUser,
  IcRuler,
  IcStar,
  IcExternal,
} from "../site/homeIcons";
import "../home.css";
import "./cv.css";

// ─────────────────────────────────────────────────────────────────────────────
// /cv — il curriculum come PAGINA, non come PDF allegato.
//
// È il documento vero: un foglio in vetro (.sb-panel) dentro la grammatica
// .sb- della home, con testata, pannello "in breve", sezioni a timeline e nota
// privacy. I contenuti arrivano da cv/data/cv.<lingua>.json — già scritti in
// quattro lingue, quindi il documento è marcato `data-no-i18n`: il motore di
// traduzione del DOM non deve ripassarci sopra.
//
// «Scarica PDF» non scarica un file diverso: stampa QUESTA pagina. Le regole di
// stampa vivono in cv.css (@page A4, palette chiara forzata, nav/footer/fondale
// via) — quello che si salva è esattamente ciò che si è appena letto.
// Arrivando con ?print (dal bottone della home) la stampa parte da sola.
// ─────────────────────────────────────────────────────────────────────────────

/** Un'icona per sezione, nel pallino azzurro della testata. */
const SECTION_ICON = {
  profile: IcUser,
  skills: IcRuler,
  education: IcGrad,
  experience: IcCode,
  travel: IcPlane,
  volunteer: IcHeart,
} as const;

function Entry({ e }: { e: CvEntry }) {
  return (
    <article className="sb-cvp-entry">
      <div className="sb-cvp-period">{e.period}</div>
      <h3 className="sb-cvp-etitle">{e.title}</h3>
      {e.role ? <p className="sb-cvp-erole">{e.role}</p> : null}
      <p className="sb-cvp-edesc">{e.desc}</p>
      {e.link ? (
        <a
          className="sb-cvp-elink"
          href={`https://${e.link}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {e.link} <IcExternal size={13} />
        </a>
      ) : null}
    </article>
  );
}

function Section({
  id,
  label,
  children,
}: {
  id: keyof typeof SECTION_ICON;
  label: string;
  children: ReactNode;
}) {
  const Icon = SECTION_ICON[id];
  return (
    <section className="sb-cvp-sec" aria-labelledby={`cv-${id}`}>
      <div className="sb-cvp-sechead">
        <span className="sb-cvp-secdot" aria-hidden="true">
          <Icon size={13} />
        </span>
        <h2 id={`cv-${id}`}>{label}</h2>
        <span className="sb-cvp-rule" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

export default function Cv() {
  const [lang, setLang] = useState<Lang>(() => getLang());
  const [scrolled, setScrolled] = useState(false);
  const printed = useRef(false);

  useEffect(() => subscribeLang(setLang), []);

  const doc = CV_DOC[lang];
  const ui = doc.ui;

  // Il titolo della pagina è anche il nome che il browser propone al «Salva
  // come PDF»: meglio "Curriculum Vitae — Alberto Pecchini" di "Alberto…".
  useEffect(() => {
    const prev = document.title;
    document.title = `${ui.runningTitle} — ${doc.name}`;
    return () => {
      document.title = prev;
    };
  }, [ui.runningTitle, doc.name]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stampa: si aspetta che i font siano pronti, o la prima pagina uscirebbe
  // impaginata con il font di ripiego.
  const print = () => {
    const go = () => window.print();
    if (document.fonts?.ready) document.fonts.ready.then(() => setTimeout(go, 60)).catch(go);
    else go();
  };

  // Arrivo da «Scarica PDF» della home (/cv?print): stampa una volta sola, poi
  // pulisce l'URL così un ricaricamento non riapre la finestra di stampa.
  useEffect(() => {
    if (printed.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("print")) return;
    printed.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    const t = window.setTimeout(print, 350);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="sb-home sb-home--fx sb-cvp-page" data-acc="ambra">
      <PageBackdrop />

      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          {lang === "it" ? "Vai al contenuto principale" : "Skip to main content"}
        </a>
      </div>

      {/* ── Nav sottile: briciola Home / Curriculum + azioni ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`} data-no-i18n>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-cvp-back" aria-label={ui.home}>
            <IcArrowLeft size={16} />
            <span>{ui.home}</span>
          </Link>
          <span className="sb-cvp-crumb" aria-hidden="true">
            /
          </span>
          <span className="sb-cvp-navtitle">
            <IcFile size={16} /> {ui.docTitle}
          </span>
          <div className="sb-nav-right">
            <a
              href={`mailto:${EMAIL}`}
              className="sb-btn sb-btn--sm sb-btn--secondary sb-cvp-navmail"
            >
              <IcMail size={15} /> {ui.email}
            </a>
            <button type="button" className="sb-btn sb-btn--sm sb-btn--primary" onClick={print}>
              <IcDownload size={15} /> {ui.print}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="sb-main sb-cvp-main" data-no-i18n>
        <div className="sb-container">
          {/* Il foglio: tutto il documento vive dentro un unico pannello. */}
          <div className="sb-panel sb-cvp-sheet">
            <div className="sb-panel-inner sb-cvp-sheet-inner">
              {/* ── Testata ── */}
              <header className="sb-cvp-masthead">
                <img
                  className="sb-cvp-photo"
                  src="/alberto-pecchini.jpg"
                  alt={doc.name}
                  width={128}
                  height={128}
                />
                <div className="sb-cvp-id">
                  <h1 className="sb-cvp-name">{doc.name}</h1>
                  <p className="sb-cvp-role">{doc.role}</p>
                  <p className="sb-cvp-tagline">{doc.tagline}</p>
                  <div className="sb-cvp-contacts">
                    {doc.contacts.map(([k, v]) => {
                      // Email e dominio diventano link; il luogo ("Mantova,
                      // Italia") resta testo — da qui la forma esatta chiesta
                      // al dominio, niente euristiche sul punto.
                      const href = v.includes("@")
                        ? `mailto:${v}`
                        : /^[\w.-]+\.[a-z]{2,}$/i.test(v)
                          ? `https://${v}`
                          : null;
                      const inner = (
                        <>
                          <span className="sb-cvp-ck">{k}</span>
                          <span>{v}</span>
                        </>
                      );
                      return href ? (
                        <a
                          key={k}
                          className="sb-cvp-chip sb-cvp-chip--link"
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer noopener"
                        >
                          {inner}
                        </a>
                      ) : (
                        <span key={k} className="sb-cvp-chip">
                          {inner}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </header>

              {/* ── In breve: lingue, patente, punti di forza, cassetto ── */}
              <section className="sb-cvp-facts" aria-label={ui.langs}>
                <div className="sb-cvp-fcol">
                  <h2 className="sb-cvp-flabel">
                    <IcGlobe size={12} /> {ui.langs}
                  </h2>
                  {doc.languages.map(([name, level, frac]) => (
                    <div className="sb-cvp-lang" key={name}>
                      <div className="sb-cvp-langrow">
                        <span className="sb-cvp-langname">{name}</span>
                        <span className="sb-cvp-langlvl">{level}</span>
                      </div>
                      <span className="sb-cvp-bar">
                        <span
                          className="sb-cvp-barfill"
                          style={{ width: `${Math.round(Math.min(1, Math.max(0, frac)) * 100)}%` }}
                        />
                      </span>
                    </div>
                  ))}

                  <h2 className="sb-cvp-flabel sb-cvp-flabel--sp">
                    <IcId size={12} /> {ui.license}
                  </h2>
                  <div className="sb-cvp-chips">
                    {doc.patente.map((p) => (
                      <span className="sb-cvp-tag" key={p}>
                        {p}
                      </span>
                    ))}
                  </div>

                  <h2 className="sb-cvp-flabel sb-cvp-flabel--sp">
                    <IcCompass size={12} /> {ui.canDrive}
                  </h2>
                  <div className="sb-cvp-chips">
                    {doc.guida.map((g) => (
                      <span className="sb-cvp-tag" key={g}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sb-cvp-fcol">
                  <h2 className="sb-cvp-flabel">
                    <IcStar size={12} /> {ui.strengths}
                  </h2>
                  <div className="sb-cvp-chips">
                    {doc.strengths.map((s) => (
                      <span className="sb-cvp-tag" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>

                  <h2 className="sb-cvp-flabel sb-cvp-flabel--sp">
                    <IcPin size={12} /> {ui.availability}
                  </h2>
                  <ul className="sb-cvp-avail">
                    {doc.availability.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>

                {doc.wishlist ? (
                  <div className="sb-cvp-fcol">
                    <h2 className="sb-cvp-flabel">
                      <IcHeart size={12} /> {ui.wish}
                    </h2>
                    <p className="sb-cvp-wish">{doc.wishlist}</p>
                  </div>
                ) : null}
              </section>

              {/* ── Profilo ── */}
              <Section id="profile" label={ui.profile}>
                <p className="sb-cvp-profile">{doc.profile}</p>
              </Section>

              {/* ── Competenze ── */}
              <Section id="skills" label={ui.skills}>
                <div className="sb-cvp-skills">
                  {doc.skills.map(([group, items]) => (
                    <div className="sb-cvp-skgroup" key={group}>
                      <h3 className="sb-cvp-sklabel">{group}</h3>
                      <div className="sb-cvp-chips">
                        {items.map((i) => (
                          <span className="sb-cvp-tag" key={i}>
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── Formazione · Esperienze · Viaggi · Volontariato ── */}
              <Section id="education" label={ui.education}>
                <div className="sb-cvp-timeline">
                  {doc.education.map((e) => (
                    <Entry e={e} key={e.title + e.period} />
                  ))}
                </div>
              </Section>

              <Section id="experience" label={ui.experience}>
                <div className="sb-cvp-timeline">
                  {doc.experience.map((e) => (
                    <Entry e={e} key={e.title + e.period} />
                  ))}
                </div>
              </Section>

              <Section id="travel" label={ui.travel}>
                <div className="sb-cvp-timeline">
                  {doc.travel.map((e) => (
                    <Entry e={e} key={e.title + e.period} />
                  ))}
                </div>
              </Section>

              <Section id="volunteer" label={ui.volunteer}>
                <div className="sb-cvp-timeline">
                  {doc.volunteer.map((e) => (
                    <Entry e={e} key={e.title + e.period} />
                  ))}
                </div>
              </Section>

              {/* ── Piede del documento ── */}
              <footer className="sb-cvp-docfoot">
                <p className="sb-cvp-privacy">{doc.privacy}</p>
                <div className="sb-cvp-docfoot-row">
                  <span>{doc.name}</span>
                  <a href="https://www.albertopecchini.it" target="_blank" rel="noreferrer noopener">
                    albertopecchini.it
                  </a>
                  {/* Data di revisione del CV. Solo in STAMPA: a schermo la
                      barra finale del sito mostra già un "Aggiornato" (la data
                      dell'ultimo deploy) e due date diverse con la stessa
                      etichetta, a un palmo l'una dall'altra, si leggono come un
                      errore. Nel foglio stampato il footer del sito non c'è
                      (vedi @media print in cv.css), quindi lì la data serve. */}
                  <span className="sb-cvp-docfoot-updated">
                    {ui.updated} {cvUpdatedLabel(lang)}
                  </span>
                </div>
              </footer>
            </div>
          </div>

          {/* Nota sotto al foglio: che cos'è il PDF. Non finisce nella stampa. */}
          <div className="sb-cvp-actions">
            <button type="button" className="sb-btn sb-btn--primary" onClick={print}>
              <IcDownload size={16} /> {ui.print}
            </button>
            <p className="sb-cvp-hint">{ui.printHint}</p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
