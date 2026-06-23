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
          aria-label={`Learn more: ${it.label}`}
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
              <p className="ap-eyebrow">👋 About me</p>
              <h1 className="ap-hero2-title">Hi, I'm Alberto.</h1>
              <p className="ap-bio-p">
                My name is Alberto Pecchini, I'm {age} and I'm in my fifth year of the CAT
                programme at the <strong>«Carlo d'Arco»</strong> Technical Institute in Mantua.
              </p>
              <p className="ap-bio-p">
                I'm a web developer and designer passionate about user experience and minimalist
                design. I use Next.js, TypeScript, GSAP and Tailwind CSS to build responsive,
                fast and polished websites.
              </p>
              <p className="ap-bio-p">
                My mission is to turn ideas into{" "}
                <strong>memorable digital experiences</strong>, keeping a clean design, careful
                typography and animations that enhance the content.
              </p>
              <p className="ap-bio-p mb-0">
                Away from the screen I'm a <strong>Sassuolo fan</strong> ⚫🟢: the black-and-green
                is also the colour thread running through this site.
              </p>
            </div>
            <div className="ap-hero2-aside">
              <div className="ap-hero2-portrait">
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

        {/* Hobby + Passioni come liste con emoji */}
        <section className="ap-sec ap-sec--alt">
          <div className="ap-wrap ap-twocol">
            <div>
              <div className="ap-biolist-head">
                <p className="ap-eyebrow">🎮 My hobbies</p>
                <h2 className="ap-sec-title">In my free time</h2>
              </div>
              {renderList(HOBBY)}
            </div>
            <div>
              <div className="ap-biolist-head">
                <p className="ap-eyebrow">🔥 My passions</p>
                <h2 className="ap-sec-title">What drives me</h2>
              </div>
              {renderList(PASSIONI)}
            </div>
          </div>
        </section>

        {/* Competenze + Dove + Formazione */}
        <section className="ap-sec">
          <div className="ap-wrap ap-twocol">
            <div className="ap-side-box">
              <p className="ap-side-label">🧰 Skills</p>
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
                <p className="ap-side-label">📍 Location</p>
                <p className="ap-side-based">
                  <MapPin size={16} aria-hidden="true" /> Mantua · Italy
                </p>
              </div>
              <div className="ap-side-box">
                <p className="ap-side-label">🎓 Education</p>
                <p className="ap-side-edu-lead">
                  CAT diploma in progress at ITT «Carlo d'Arco» in Mantua; English C1 (IELTS)
                  achieved in Dublin.
                </p>
                <ul className="ap-side-edu">
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

      <SiteFooter />

      <InterestModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
