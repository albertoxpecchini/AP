import { useState, useEffect } from "react";
import { ArrowUpRight, MapPin, GraduationCap } from "lucide-react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import InterestModal from "./InterestModal";
import { HOBBY, PASSIONI, SKILLS, type Interest } from "./data";

export default function Bio() {
  const [selectedItem, setSelectedItem] = useState<Interest | null>(null);

  // Arrivando da un'altra rotta, parti dall'alto della pagina.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  // Età calcolata dalla data di nascita (28 giugno 2006).
  const now = new Date();
  const birthDate = new Date(2006, 5, 28);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) age--;

  const renderList = (items: Interest[]) => (
    <div className="ap-biolist">
      {items.map((it) => (
        <button
          type="button"
          className="ap-biolist-item"
          key={it.label}
          onClick={() => setSelectedItem(it)}
          aria-label={`Scopri di più: ${it.label}`}
        >
          <span className="ap-biolist-emoji" aria-hidden="true">{it.emoji}</span>
          <span>{it.label}</span>
          <span className="ap-biolist-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="it-page-wrapper">
      <SiteHeader />

      <main id="main-content">
        {/* Prosa + ritratto */}
        <section className="ap-hero2">
          <div className="ap-wrap ap-hero2-grid">
            <div className="ap-hero2-main">
              <p className="ap-eyebrow">👋 Chi sono</p>
              <h1 className="ap-hero2-title">Ciao, sono Alberto.</h1>
              <p className="ap-bio-p">
                Mi chiamo Alberto Pecchini, ho {age} anni e frequento il quinto anno della
                sezione CAT all'Istituto Tecnico Tecnologico <strong>«Carlo d'Arco»</strong> di
                Mantova.
              </p>
              <p className="ap-bio-p">
                Sono uno sviluppatore web e designer appassionato di user experience e design
                minimalista. Utilizzo Next.js, TypeScript, GSAP e Tailwind CSS per creare siti
                web responsivi, veloci e raffinati.
              </p>
              <p className="ap-bio-p">
                La mia missione è trasformare le idee in{" "}
                <strong>esperienze digitali memorabili</strong>, mantenendo un design pulito,
                una tipografia curata e animazioni che valorizzano i contenuti.
              </p>
              <p className="ap-bio-p mb-0">
                Fuori dallo schermo sono un <strong>tifoso del Sassuolo</strong> ⚫🟢: il neroverde
                è anche il filo conduttore cromatico di questo sito.
              </p>
            </div>
            <div className="ap-hero2-aside">
              <div className="ap-hero2-portrait">
                <img
                  src="/alberto-pecchini.jpg"
                  alt="Ritratto di Alberto Pecchini"
                  width={1050}
                  height={1400}
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Hobby + Passioni come liste con emoji */}
        <section className="ap-sec ap-sec--alt">
          <div className="ap-wrap ap-twocol">
            <div>
              <div className="ap-biolist-head">
                <p className="ap-eyebrow">🎮 I miei hobby</p>
                <h2 className="ap-sec-title">Nel tempo libero</h2>
              </div>
              {renderList(HOBBY)}
            </div>
            <div>
              <div className="ap-biolist-head">
                <p className="ap-eyebrow">🔥 Le mie passioni</p>
                <h2 className="ap-sec-title">Cosa mi appassiona</h2>
              </div>
              {renderList(PASSIONI)}
            </div>
          </div>
        </section>

        {/* Competenze + Dove + Formazione */}
        <section className="ap-sec">
          <div className="ap-wrap ap-twocol">
            <div className="ap-side-box">
              <p className="ap-side-label">🧰 Competenze</p>
              {SKILLS.map((group) => (
                <div className="ap-side-skill" key={group.title}>
                  <span className="ap-side-skill-title">
                    <span aria-hidden="true">{group.emoji}</span> {group.title}
                  </span>
                  <div className="ap-side-chips">
                    {group.items.map((item) => (
                      <span key={item} className="chip chip-simple chip-primary">
                        <span className="chip-label">{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="ap-bio-side">
              <div className="ap-side-box">
                <p className="ap-side-label">📍 Dove</p>
                <p className="ap-side-based">
                  <MapPin size={16} aria-hidden="true" /> Mantova · Italia
                </p>
              </div>
              <div className="ap-side-box">
                <p className="ap-side-label">🎓 Formazione</p>
                <p className="ap-side-edu-lead">
                  Diploma CAT in corso all'ITT «Carlo d'Arco» di Mantova; inglese C1 (IELTS)
                  conseguito a Dublino.
                </p>
                <ul className="ap-side-edu">
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> ITT «Carlo d'Arco» — Diploma CAT
                  </li>
                  <li>
                    <GraduationCap size={16} aria-hidden="true" /> CES Dublino — IELTS, livello C1
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <InterestModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
