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
// Non ha un fondo suo con un bordo in cima: il colore entra in dissolvenza
// dall'alto, così scendendo non si vede il punto in cui la pagina finisce e
// comincia il footer. Le due colonne sono card .sb-panel come quelle della
// home; il movimento (cascata d'ingresso, magneti, contatori) lo dirige
// footMotion.ts.
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
      <div className="sb-container sb-foot-wrap">
        <div className="sb-foot-grid">
          <div className="sb-foot-card">
            <div className="sb-panel">
              <div className="sb-panel-inner sb-foot-pad">
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
                <GitHubFooterWidget />
              </div>
            </div>
          </div>
        </div>

        <div className="sb-foot-hairline" aria-hidden="true" />

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
