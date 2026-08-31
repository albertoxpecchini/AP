import { useEffect, useMemo, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft,
  IcCheck,
  IcClose,
  IcCopy,
  IcFile,
  IcSearch,
  IcTerminal,
} from "../site/homeIcons";
import { PageBackdrop } from "../site/homeFx";
import { GRUPPI, QUANTI_NPM, TOTALE, testoDi, type Voce } from "./comandi";
import "../home.css";
import "./comandi.css";

// ─────────────────────────────────────────────────────────────────────────────
// /comandi — tutto quello che questo progetto sa fare da terminale.
//
// Il repository è pieno di programmi che girano una volta ogni tanto: uno che
// legge gli EXIF delle foto, uno che impacchetta il sorgente per l'archivio,
// uno che rifà l'albero del repo da git. Ognuno spiega sé stesso in cima al
// proprio file — ma per leggere
// quella spiegazione bisogna già sapere che il file esiste, ed è esattamente
// la cosa che non si sa.
//
// Questa pagina è l'indice: il comando esatto da incollare, cosa produce, e
// il motivo per cui esiste. I testi stanno in comandi.ts, qui c'è solo la
// forma — più un filtro, perché a una dozzina di voci scorrere non basta più.
//
// Registro: la grammatica .sb- del resto del sito. L'unica cosa monospaziata
// è quello che si scrive davvero nel terminale, e l'azzurro compare solo dove
// indica qualcosa.
// ─────────────────────────────────────────────────────────────────────────────

function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

// Copia negli appunti, con la scialuppa per i contesti dove l'API non c'è
// (http non sicuro, browser vecchi): stessa manovra della pagina /instagram.
async function copiaTesto(testo: string) {
  try {
    await navigator.clipboard.writeText(testo);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = testo;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

// ── Una voce ─────────────────────────────────────────────────────────────────
// Il `$` del prompt è decorativo e sta FUORI dal testo copiato: chi incolla si
// aspetta un comando, non un comando col dollaro davanti.
function VoceCard({ v }: { v: Voce }) {
  const [copiato, setCopiato] = useState(false);

  const copia = async () => {
    await copiaTesto(v.cmd);
    setCopiato(true);
    window.setTimeout(() => setCopiato(false), 1400);
  };

  return (
    <article className="sb-panel sb-panel--hover sb-cmd-voce">
      <div className="sb-panel-inner">
        <div className="sb-cmd-riga">
          <code className="sb-cmd-cmd" data-no-i18n translate="no">
            <span className="sb-cmd-prompt" aria-hidden="true">
              $
            </span>
            {v.cmd}
          </code>
          {v.fuoriDalTerminale ? (
            <span className="sb-cmd-tag">non dal terminale</span>
          ) : (
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--secondary sb-cmd-copia"
              onClick={copia}
              aria-label={`Copia il comando ${v.cmd}`}
            >
              {copiato ? <IcCheck size={14} /> : <IcCopy size={14} />}
              <span>{copiato ? "Copiato" : "Copia"}</span>
            </button>
          )}
        </div>

        <p className="sb-cmd-breve">{v.breve}</p>
        <p className="sb-cmd-dett">{v.dettaglio}</p>

        {(v.file || v.esce) && (
          <dl className="sb-cmd-dati">
            {v.file && (
              <div className="sb-cmd-dato">
                <dt>
                  <IcFile size={13} /> esegue
                </dt>
                <dd data-no-i18n translate="no">{v.file}</dd>
              </div>
            )}
            {v.esce && (
              <div className="sb-cmd-dato">
                <dt>lascia</dt>
                <dd>
                  <ul className="sb-cmd-esce">
                    {v.esce.map((e) => (
                      <li key={e} data-no-i18n translate="no">
                        {e}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}

        {v.opzioni && (
          <ul className="sb-cmd-opzioni">
            {v.opzioni.map(([flag, cosa]) => (
              <li key={flag}>
                <code data-no-i18n translate="no">{flag}</code>
                <span>{cosa}</span>
              </li>
            ))}
          </ul>
        )}

        {v.nota && <p className="sb-cmd-nota">{v.nota}</p>}
      </div>
    </article>
  );
}

export default function Comandi() {
  const scrolled = useScrolled();
  const [cerca, setCerca] = useState("");

  useEffect(() => {
    const prev = document.title;
    document.title = "Comandi — Alberto Pecchini";
    return () => {
      document.title = prev;
    };
  }, []);

  const q = cerca.trim().toLowerCase();

  // I gruppi che restano dopo il filtro. Un gruppo svuotato sparisce del tutto,
  // intestazione compresa: una sezione con sotto il vuoto sembra un guasto.
  const gruppi = useMemo(() => {
    if (!q) return GRUPPI;
    return GRUPPI.map((g) => ({ ...g, voci: g.voci.filter((v) => testoDi(v).includes(q)) })).filter(
      (g) => g.voci.length > 0,
    );
  }, [q]);

  const trovati = gruppi.reduce((n, g) => n + g.voci.length, 0);

  const cifre = [
    { k: "comandi", v: String(TOTALE) },
    { k: "si scrivono npm run", v: String(QUANTI_NPM) },
    { k: "famiglie", v: String(GRUPPI.length) },
  ];

  return (
    <div className="sb-home sb-home--fx sb-cmd" data-acc="viola">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          Skip to main content
        </a>
      </div>

      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">
              Alberto Pecchini
            </span>
            <span className="sb-cmd-tagline">Comandi</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-cmd-indietro">
            <IcArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ── Apertura ─────────────────────────────────────────────────────── */}
        <section className="sb-container sb-cmd-testata">
          <p className="sb-cmd-kicker" data-no-i18n translate="no">
            <IcTerminal size={13} /> npm run …
          </p>
          <h1 className="sb-cmd-titolo">
            <span>I comandi</span>
            <span className="sb-brandline">tutto quello che il progetto sa fare da terminale</span>
          </h1>
          <div className="sb-cmd-copy">
            <p>
              Il sito non è solo le pagine che si vedono. Dietro ci sono programmi che girano una
              volta ogni tanto e che <strong>lasciano nel repository il loro risultato</strong>: chi
              legge i metadati delle foto e ne ricava una mappa, chi impacchetta il codice sorgente
              da scaricare, chi rifà l'albero del repository da git.
            </p>
            <p>
              Ognuno di questi programmi si spiega in cima al proprio file — ma per leggere quella
              spiegazione bisogna già sapere che il file c'è. Questa pagina è l'indice che manca: il
              comando esatto da incollare, cosa produce, e perché esiste.
            </p>
          </div>
          <div className="sb-cmd-cifre">
            {cifre.map((c) => (
              <div key={c.k} className="sb-cmd-cifra">
                <span className="sb-cmd-cifra-v" data-no-i18n translate="no">
                  {c.v}
                </span>
                <span className="sb-cmd-cifra-k">{c.k}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Filtro ───────────────────────────────────────────────────────── */}
        <section className="sb-container sb-cmd-barra" aria-label="Cerca fra i comandi">
          <label className="sb-cmd-cerca">
            <IcSearch size={14} />
            <input
              type="search"
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              placeholder="foto, EXIF, ZIP, traduzioni…"
              aria-label="Cerca fra i comandi"
            />
            {cerca && (
              <button type="button" onClick={() => setCerca("")} aria-label="Azzera la ricerca">
                <IcClose size={14} />
              </button>
            )}
          </label>
          <p className="sb-cmd-conta" aria-live="polite">
            {q ? (
              <span data-no-i18n translate="no">
                {trovati} / {TOTALE}
              </span>
            ) : (
              <span className="sb-cmd-ancore">
                {GRUPPI.map((g) => (
                  <a key={g.id} href={`#${g.id}`}>
                    {g.titolo}
                  </a>
                ))}
              </span>
            )}
          </p>
        </section>

        {/* ── I gruppi ─────────────────────────────────────────────────────── */}
        {gruppi.map((g) => (
          <section key={g.id} id={g.id} className="sb-container sb-cmd-sez" aria-labelledby={`h-${g.id}`}>
            <div className="sb-cmd-sechead">
              <h2 id={`h-${g.id}`}>{g.titolo}</h2>
              <p>{g.intro}</p>
            </div>
            <div className="sb-cmd-griglia">
              {g.voci.map((v) => (
                <VoceCard key={v.cmd} v={v} />
              ))}
            </div>
          </section>
        ))}

        {trovati === 0 && (
          <section className="sb-container sb-cmd-vuoto">
            <p>
              Nessun comando corrisponde a <strong data-no-i18n translate="no">{cerca}</strong>.
            </p>
            <button
              type="button"
              className="sb-btn sb-btn--sm sb-btn--secondary"
              onClick={() => setCerca("")}
            >
              Rivedili tutti
            </button>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
