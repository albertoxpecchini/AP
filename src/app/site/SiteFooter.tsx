import { useEffect, useState } from "react";
import { Link } from "react-router";
import { SOCIALS } from "./data";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import GitHubFooterWidget from "./GitHubFooterWidget";

// Locale della data "Updated": segue la lingua attiva, così anche il MESE è
// nella lingua giusta. Il resto del footer lo traduce il motore i18n dal
// dizionario; la data è dinamica, quindi va formattata qui a mano.
const DATE_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

// ─────────────────────────────────────────────────────────────────────────────
// Footer condiviso da TUTTE le pagine (/...): nome + ruolo, icone social,
// copyright e data "Updated". È completamente autosufficiente — porta con sé i
// propri stili (prefisso .apf-) e resta scuro "dark premium" su qualunque
// pagina, chiara o scura, così il look è identico ovunque.
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteFooter() {
  // La lingua attiva pilota SOLO il formato della data (il testo del footer è
  // tradotto dal motore i18n che gira su tutto il DOM).
  const [lang, setLang] = useState<Lang>(() => getLang());
  useEffect(() => subscribeLang(setLang), []);

  const now = new Date();
  const updated = now.toLocaleDateString(DATE_LOCALE[lang], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const year = now.getFullYear();

  return (
    <footer className="apf-foot">
      <div className="apf-wrap">
        <div className="apf-top">
          <div className="apf-id">
            <Link to="/" className="apf-name" aria-label="Torna alla home">Alberto Pecchini</Link>
            <p className="apf-role">Designer &amp; Developer · ITT «Carlo d'Arco» — Mantua</p>
          </div>
          <div className="apf-social">
            {SOCIALS.map(({ name, Icon, href }) => (
              <a
                key={name}
                href={href}
                aria-label={name}
                title={name}
                {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <GitHubFooterWidget />

        <div className="apf-bottom">
          <span>© {year} Alberto Pecchini — All rights reserved</span>
          <span>Updated {updated}</span>
        </div>
      </div>

      <style>{`
        .apf-foot {
          background: linear-gradient(180deg, #0b0f14 0%, #08090d 100%);
          border-top: 1px solid rgba(139, 123, 255, 0.22);
          color: #e8eef4;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          padding: clamp(2rem, 4vw, 2.75rem) 0 clamp(1.6rem, 3vw, 2rem);
          position: relative; z-index: 2;
        }
        .apf-wrap {
          width: 100%; max-width: 1200px; margin: 0 auto;
          padding-left: 1.25rem; padding-right: 1.25rem;
        }
        .apf-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1.5rem 2rem; flex-wrap: wrap;
        }
        .apf-name {
          display: inline-block; font-size: 1.2rem; font-weight: 800; color: #ffffff;
          text-decoration: none; margin: 0 0 0.25rem;
        }
        .apf-name:hover { color: #c4a5ff; }
        .apf-role { margin: 0; color: #a7b2bd; font-size: 0.92rem; }
        .apf-social { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-end; }
        .apf-social a {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.10);
          color: #a7b2bd; transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s;
        }
        .apf-social a:hover {
          color: #ffffff; border-color: rgba(139, 123, 255, 0.45);
          background: rgba(139, 123, 255, 0.14); transform: translateY(-2px);
        }
        .apf-bottom {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.5rem 1.5rem; flex-wrap: wrap;
          margin-top: 1.6rem; padding-top: 1.2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #8893a0; font-size: 0.86rem;
        }
        @media (max-width: 640px) {
          .apf-social { justify-content: flex-start; }
        }
      `}</style>
    </footer>
  );
}
