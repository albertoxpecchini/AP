import { useCallback, useEffect, useState } from "react";
import { ArrowUp, Mail } from "lucide-react";
import { SiteLink as Link } from "./nav";
import { EMAIL, SOCIALS } from "./data";
import { getLang, subscribeLang, type Lang } from "../i18n/langCore";
import GitHubFooterWidget from "./GitHubFooterWidget";
import "../home.css";
import "./foot.css";

// Locale della data «Updated»: segue la lingua attiva, così anche il MESE è
// nella lingua giusta. Il resto del footer lo traduce il motore i18n dal
// dizionario; la data è dinamica, quindi va formattata qui a mano.
const DATE_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

// Data dell'ultimo commit, iniettata da Vite a build-time (vite.config.ts →
// define.__BUILD_DATE__), formato «AAAA-MM-GG». Qui c'era un new Date() lato
// client: scriveva sempre «oggi», quindi il footer si dichiarava aggiornato
// anche dopo mesi in cui non era cambiato nulla.
declare const __BUILD_DATE__: string | undefined;
const BUILD_DATE =
  typeof __BUILD_DATE__ !== "undefined" ? __BUILD_DATE__ : null;

// ─────────────────────────────────────────────────────────────────────────────
// Footer condiviso da TUTTE le pagine — rifatto.
//
// ── La mappa nuova ─────────────────────────────────────────────────────────
// Prima erano due card affiancate e una barra: a sinistra identità + i
// diciassette social schiacciati in una colonna da 21rem, a destra la
// dashboard GitHub con dentro un istogramma alto trenta pixel. Lo spazio era
// distribuito al contrario di quanto avevano da dire i due lati.
//
// Adesso sono tre bande:
//   ① firma (nome, ruolo) | polso GitHub — due lastre, 19rem e il resto;
//   ② ALTROVE — il muro dei social a tutta larghezza, una piastrella con
//      icona e nome per ciascuno, su una griglia che si riempie da sé:
//      aggiungerne uno non stringe più niente;
//   ③ la barra finale: © — torna su — Updated.
//
// ── Cosa è sparito, e perché ───────────────────────────────────────────────
//  · «Palette» e «Come funziona»: due finestre di documentazione in fondo a un
//    sito che la documentazione ce l'ha nel README. Al loro posto, l'unica
//    cosa che in fondo a una pagina serve davvero: tornare su.
//  · La regia GSAP del footer (site/footMotion.ts, cancellato). Teneva acceso
//    ScrollTrigger su OGNI pagina del sito per tre effetti che adesso fa il
//    CSS: il contatore (@property <integer> + counter() su timeline di
//    scroll), i magneti (sostituiti da un sollevamento di composizione) e la
//    pozza d'acqua sull'istogramma (adesso è un'onda coi selettori fratelli).
//    Misurato in Edge sulla build di produzione, quattro secondi di puntatore
//    nel footer costavano 694 ricalcoli di stile e 0,80 s di main thread.
//
// Tema chiaro/scuro NATIVO: eredita i token .sb- (home.css) e segue html.dark
// come il resto del sito. Il vestito sta tutto in site/foot.css.
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteFooter() {
  // La lingua attiva pilota SOLO il formato della data (il testo del footer è
  // tradotto dal motore i18n che gira su tutto il DOM).
  const [lang, setLang] = useState<Lang>(() => getLang());
  useEffect(() => subscribeLang(setLang), []);

  // «T00:00:00» esplicito: senza orario la stringa «AAAA-MM-GG» viene letta
  // come UTC e a ovest di Greenwich la data mostrata slitterebbe al giorno prima.
  const updated = (BUILD_DATE ? new Date(`${BUILD_DATE}T00:00:00`) : new Date())
    .toLocaleDateString(DATE_LOCALE[lang], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  // Il copyright è l'anno corrente, non quello della build: un sito fermo da
  // dicembre non deve mostrare l'anno vecchio a gennaio.
  const year = new Date().getFullYear();

  // Unica riga di JavaScript rimasta nel footer. Lo scorrimento morbido lo
  // chiede qui e non da CSS perché `scroll-behavior: smooth` sull'elemento
  // radice varrebbe per OGNI salto d'ancora del sito, compresi quelli della
  // nav — e chi ha chiesto meno movimento non deve vedersi trascinare.
  const toTop = useCallback(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  }, []);

  return (
    <footer className="sb-home sb-foot">
      <div className="sb-foot-aura" aria-hidden="true" />

      <div className="sb-container sb-foot-wrap">
        {/* ── ① firma | polso ── */}
        <div className="sb-foot-deck">
          <div className="sb-foot-slab">
            <div className="sb-foot-slab__in">
              <div className="sb-foot-sign">
                <Link to="/" className="sb-foot-name" aria-label="Torna alla home" translate="no">
                  Alberto Pecchini
                </Link>
                <p className="sb-foot-role">
                  Surveyor &amp; Website Developer, ITT «Carlo d&apos;Arco» — Mantua
                </p>
                {/* Il footer non aveva un recapito: per scrivere bisognava
                    risalire ai contatti della home. L'email è l'unico recapito
                    pubblico del sito (telefono e WhatsApp sono stati tolti
                    apposta), quindi è quello che va qui. */}
                <a className="sb-foot-mail" href={`mailto:${EMAIL}`}>
                  <Mail size={14} aria-hidden="true" />
                  <span translate="no" data-no-i18n>{EMAIL}</span>
                </a>
                <div className="sb-foot-sign-rule" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="sb-foot-slab">
            <div className="sb-foot-slab__in">
              <GitHubFooterWidget />
            </div>
          </div>
        </div>

        {/* ── ② il muro dei social ── */}
        <div className="sb-foot-slab">
          <div className="sb-foot-slab__in">
            <h2 className="sb-foot-h">Elsewhere</h2>
            <ul className="sb-foot-wall">
              {SOCIALS.map(({ name, Icon, href }) => (
                <li key={name}>
                  <a
                    className="sb-foot-tile"
                    href={href}
                    title={name}
                    {...(href !== "#" ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {/* Nomi propri: il motore i18n cammina sui nodi di testo e
                        senza questo «Threads» diventerebbe «Fili». */}
                    <span className="sb-foot-tile__n" translate="no" data-no-i18n>{name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sb-foot-rule" aria-hidden="true" />

        {/* ── ③ la barra finale ── */}
        <div className="sb-foot-bar">
          <span>© {year} Alberto Pecchini — code under MIT, content reserved</span>
          <button type="button" className="sb-foot-top" onClick={toTop}>
            <ArrowUp size={14} aria-hidden="true" />
            Back to top
          </button>
          <span>Updated {updated}</span>
        </div>
      </div>
    </footer>
  );
}
