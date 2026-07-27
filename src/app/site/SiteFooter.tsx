import { useEffect, useRef, useState } from "react";
import { SiteLink as Link } from "./nav";
import { SOCIALS } from "./data";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import GitHubFooterWidget from "./GitHubFooterWidget";
import WorkflowModal from "./WorkflowModal";
import PaletteModal from "./PaletteModal";
import { useFootMotion } from "./footMotion";
import "../home.css";

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
// Footer condiviso da TUTTE le pagine (/...) — replica del footer di Supabase
// nella grammatica .sb- della home: colonna identità+social a sinistra (come
// logo+social di supabase.com), mini-dashboard GitHub a destra (al posto delle
// colonne di link), filo sfumato e barra finale © · Palette · Come funziona ·
// Updated. Tema chiaro/scuro NATIVO: eredita i token .sb- (home.css) e segue
// html.dark come il resto del sito.
//
// Le due colonne sono card .sb-panel: prendono lo stesso trattamento di luce
// delle card della home (riflesso sul bordo, alone interno, lampo in diagonale)
// più i magneti, la cascata d'ingresso, la barra di avanzamento sul filo e i
// due loop lenti — tutto diretto da footMotion.ts.
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteFooter() {
  // La lingua attiva pilota SOLO il formato della data (il testo del footer è
  // tradotto dal motore i18n che gira su tutto il DOM).
  const [lang, setLang] = useState<Lang>(() => getLang());
  useEffect(() => subscribeLang(setLang), []);

  const footRef = useRef<HTMLElement | null>(null);
  useFootMotion(footRef);

  const now = new Date();
  const updated = now.toLocaleDateString(DATE_LOCALE[lang], {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const year = now.getFullYear();

  return (
    <footer className="sb-home sb-foot" ref={footRef}>
      {/* Alone ambientale (insegue il puntatore) e filo di luce sul bordo alto */}
      <span className="sb-foot-aura" aria-hidden="true" />
      <span className="sb-foot-beam" aria-hidden="true" />

      <div className="sb-container sb-foot-wrap">
        <div className="sb-foot-grid">
          <div className="sb-foot-card">
            <div className="sb-panel">
              <div className="sb-panel-inner sb-foot-pad">
                <span className="sb-foot-flashwrap" aria-hidden="true">
                  <span className="sb-foot-flash" />
                </span>
                <div className="sb-foot-id">
                  <Link to="/" className="sb-foot-name" aria-label="Torna alla home" translate="no">Alberto Pecchini</Link>
                  <p className="sb-foot-role">Designer &amp; Developer · ITT «Carlo d'Arco» — Mantua</p>
                  <div className="sb-foot-social">
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
              </div>
            </div>
          </div>

          <div className="sb-foot-card">
            <div className="sb-panel">
              <div className="sb-panel-inner sb-foot-pad">
                <span className="sb-foot-flashwrap" aria-hidden="true">
                  <span className="sb-foot-flash" />
                </span>
                <GitHubFooterWidget />
              </div>
            </div>
          </div>
        </div>

        <div className="sb-foot-hairline" aria-hidden="true">
          <span className="sb-foot-prog" />
        </div>

        <div className="sb-foot-bottom">
          <span>© {year} Alberto Pecchini — All rights reserved</span>
          <div className="sb-foot-links">
            <PaletteModal />
            <span className="sb-foot-sep" aria-hidden="true">·</span>
            <WorkflowModal />
          </div>
          <span>Updated {updated}</span>
        </div>
      </div>
    </footer>
  );
}
