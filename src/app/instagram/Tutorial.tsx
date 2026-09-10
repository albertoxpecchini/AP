import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { SiInstagram } from "react-icons/si";
import { IcClose, IcChevronLeft, IcChevronRight } from "../site/homeIcons";
import "../home.css";
import "./instagram.css";

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial "Come scaricare i tuoi dati da Instagram" — POPUP a slide (portale su
// <body>, così è un vero overlay a tutti gli effetti, centrato). Mockup SVG che
// ricordano le schermate del Centro gestione account di Meta; l'ultima slide
// mostra QUESTO sito in una finestra browser (non le impostazioni IG), per non
// confondere. Skippabile subito. Testi 100% multilingua (dizionario del sito).
//
// Veste "piattaforma Supabase" come la pagina: il portale porta con sé la classe
// .sb-home per ereditare i token (tema chiaro/scuro nativo), gli stili vivono in
// instagram.css e le icone sono quelle della casa (homeIcons). Nei mockup il
// segno "guarda qui" è l'azzurro brand; il blu di Meta resta quello vero.
// ─────────────────────────────────────────────────────────────────────────────

const HI = "hsl(140, 92%, 27%)";   // azzurro brand: evidenzia il punto da premere
const INK = "#171717";
const SUB = "#6f6f6f";
const LINE = "#e8e8e8";
const FILL = "#f6f6f6";
const META = "#1877F2";            // blu dei pulsanti Instagram/Meta

// ── Primitive delle schermate telefono (schematiche, coi nomi veri) ──
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 260 384" role="img" aria-hidden="true">
      <rect x="4" y="4" width="252" height="376" rx="28" fill={INK} />
      <rect x="11" y="11" width="238" height="362" rx="22" fill="#ffffff" />
      <rect x="104" y="17" width="52" height="7" rx="3.5" fill={INK} />
      {children}
    </svg>
  );
}

// Segno "premi qui": pallino azzurro con anello, al posto della manina.
function Tap({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="3.6" fill={HI} />
      <circle cx={x} cy={y} r="8" fill="none" stroke={HI} strokeWidth="1.5" opacity="0.45" />
    </g>
  );
}

// Glifi disegnati (niente emoji): cartella e documento, gli stessi tracciati
// delle icone della casa (IcFolder / IcFile) riscalati a ~13px.
const GLYPH = 0.56; // 24 × 0.56 ≈ 13.4px

function FolderGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${GLYPH})`} fill="none" stroke={SUB}
      strokeWidth={1.2 / GLYPH} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5c0-1.1.9-2 2-2h4.2c.6 0 1.2.3 1.6.8l1 1.2H19c1.1 0 2 .9 2 2v7c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-9z" />
    </g>
  );
}

function DocGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${GLYPH})`} fill="none" stroke={HI}
      strokeWidth={1.2 / GLYPH} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h6" />
    </g>
  );
}

function Row({ y, label, hi, check }: { y: number; label: string; hi?: boolean; check?: boolean }) {
  return (
    <g>
      <rect x="22" y={y} width="216" height="32" rx="8" fill={hi ? "#ffffff" : FILL}
        stroke={hi ? HI : LINE} strokeWidth={hi ? 2 : 1} />
      <rect x="31" y={y + 8} width="16" height="16" rx="4" fill="#e2e2e2" />
      <text x="55" y={y + 21} fontSize="10.5" fill={INK}>{label}</text>
      {check !== undefined && (
        <g>
          <rect x="214" y={y + 8} width="16" height="16" rx="4"
            fill={check ? META : "#fff"} stroke={check ? META : "#c7c7c7"} strokeWidth="1.5" />
          {check && <path d={`M217 ${y + 16} l3 3 l6 -7`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      )}
      {hi && <Tap x={227} y={y + 16} />}
    </g>
  );
}

function Primary({ label }: { label: string }) {
  const y = 322;
  return (
    <g>
      <rect x="22" y={y} width="216" height="34" rx="17" fill={META} />
      <text x="130" y={y + 22} fontSize="12" fontWeight="500" fill="#fff" textAnchor="middle">{label}</text>
      <rect x="19" y={y - 3} width="222" height="40" rx="20" fill="none" stroke={HI} strokeWidth="2" />
      <Tap x={212} y={y + 17} />
    </g>
  );
}

function ScreenTitle({ t }: { t: string }) {
  return <text x="22" y="46" fontSize="13" fontWeight="500" fill={INK}>{t}</text>;
}

// Slide finale: finestra BROWSER con QUESTO sito (chiaramente diverso da IG).
// Resta in veste chiara in entrambi i temi: è la fotografia di una schermata.
function SiteBrowser() {
  return (
    <svg viewBox="0 0 300 340" role="img" aria-hidden="true">
      <rect x="4" y="4" width="292" height="332" rx="16" fill={INK} />
      <rect x="10" y="10" width="280" height="320" rx="12" fill="#f4f5f2" />
      {/* barra del browser + url del sito */}
      <rect x="10" y="10" width="280" height="34" rx="12" fill="#f0f0f0" />
      <circle cx="26" cy="27" r="4" fill="#c7c7c7" />
      <circle cx="40" cy="27" r="4" fill="#c7c7c7" />
      <circle cx="54" cy="27" r="4" fill="#c7c7c7" />
      <rect x="70" y="18" width="210" height="18" rx="9" fill="#fff" stroke={LINE} />
      <g fill="none" stroke={SUB} strokeWidth="1.1">
        <rect x="79" y="25.5" width="7" height="5.5" rx="1.2" />
        <path d="M80.7 25.5v-1.6a1.8 1.8 0 0 1 3.6 0v1.6" />
      </g>
      <text x="91" y="31" fontSize="9.5" fill={SUB}>albertopecchini.it/instagram</text>
      {/* hero della pagina: titolo + riga azzurra */}
      <rect x="10" y="44" width="280" height="66" fill="#f8f8f8" />
      <rect x="26" y="60" width="150" height="9" rx="4.5" fill="#d4d4d4" />
      <rect x="26" y="76" width="196" height="7" rx="3.5" fill={HI} opacity="0.65" />
      <rect x="26" y="90" width="120" height="6" rx="3" fill="#e2e2e2" />
      {/* due riquadri input evidenziati */}
      <g>
        <rect x="26" y="130" width="118" height="120" rx="10" fill="#fff" stroke={HI} strokeWidth="2" />
        <text x="36" y="150" fontSize="10" fontWeight="500" fill={INK}>I miei seguiti</text>
        <text x="36" y="166" fontSize="8.5" fill={SUB}>following.html</text>
        <rect x="36" y="176" width="98" height="8" rx="4" fill={FILL} />
        <rect x="36" y="190" width="80" height="8" rx="4" fill={FILL} />
      </g>
      <g>
        <rect x="156" y="130" width="118" height="120" rx="10" fill="#fff" stroke={HI} strokeWidth="2" />
        <text x="166" y="150" fontSize="10" fontWeight="500" fill={INK}>I miei follower</text>
        <text x="166" y="166" fontSize="8.5" fill={SUB}>followers.html</text>
        <rect x="166" y="176" width="98" height="8" rx="4" fill={FILL} />
        <rect x="166" y="190" width="80" height="8" rx="4" fill={FILL} />
      </g>
      {/* bottone Confronta */}
      <rect x="26" y="266" width="248" height="34" rx="6" fill="hsl(195, 67%, 67%)" stroke="hsla(199, 78%, 40%, 0.75)" />
      <text x="150" y="288" fontSize="12" fontWeight="500" fill="#101010" textAnchor="middle">Confronta</text>
      <Tap x={252} y={283} />
    </svg>
  );
}

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);

  const slides: { svg: React.ReactNode; title: string; body: React.ReactNode }[] = [
    {
      title: "Scarica i tuoi 2 file da Instagram",
      svg: <SiInstagram size={112} className="sb-ig-tut-logo" aria-hidden="true" />,
      body: (
        <>
          <p>Per il confronto servono i file «following.html» (chi segui) e «followers.html» (chi ti segue): te li fornisce Instagram stesso, è il modo più preciso e sicuro.</p>
          <p className="sb-ig-tut-note">Ti guido dall'app sul telefono. Da computer i passaggi sono identici, cambia solo la posizione sullo schermo. Puoi saltare quando vuoi.</p>
        </>
      ),
    },
    {
      title: "Profilo → menu → Impostazioni",
      svg: (
        <Phone>
          <text x="22" y="40" fontSize="13" fontWeight="500" fill={INK}>Il tuo profilo</text>
          <g>
            <rect x="205" y="28" width="30" height="24" rx="6" fill="#fff" stroke={HI} strokeWidth="2" />
            <line x1="212" y1="36" x2="228" y2="36" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="40" x2="228" y2="40" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="44" x2="228" y2="44" stroke={INK} strokeWidth="2" strokeLinecap="round" />
            <Tap x={241} y={26} />
          </g>
          <circle cx="45" cy="82" r="20" fill={FILL} stroke={LINE} />
          <Row y={120} label="Impostazioni e privacy" hi />
          <Row y={160} label="La tua attività" />
          <Row y={200} label="Archivio" />
          <line x1="11" y1="336" x2="249" y2="336" stroke={LINE} />
          <circle cx="220" cy="356" r="11" fill="none" stroke={HI} strokeWidth="2" />
        </Phone>
      ),
      body: (
        <>
          <p>Apri il tuo profilo (icona in basso a destra), poi premi le tre lineette in alto a destra.</p>
          <p>Dal menu che si apre, in fondo, premi «Impostazioni e privacy».</p>
        </>
      ),
    },
    {
      title: "Scarica le tue informazioni",
      svg: (
        <Phone>
          <ScreenTitle t="Le tue informazioni e autorizzazioni" />
          <Row y={70} label="Scarica le tue informazioni" hi />
          <Row y={110} label="Trasferisci le tue informazioni" />
          <Row y={150} label="Autorizzazioni per le app" />
          <Row y={190} label="Cronologia dei link" />
        </Phone>
      ),
      body: <p>Scorri fino al gruppo «Le tue informazioni e autorizzazioni» e premi «Scarica le tue informazioni».</p>,
    },
    {
      title: "Scarica o trasferisci informazioni",
      svg: (
        <Phone>
          <ScreenTitle t="Scarica le tue informazioni" />
          <Row y={70} label="Scarica o trasferisci informazioni" hi />
          <circle cx="40" cy="150" r="16" fill={FILL} stroke={LINE} />
          <text x="66" y="155" fontSize="10.5" fill={INK}>Il tuo profilo</text>
          <rect x="214" y="142" width="16" height="16" rx="8" fill={META} />
          <Primary label="Avanti" />
        </Phone>
      ),
      body: <p>Premi «Scarica o trasferisci informazioni», scegli il tuo profilo e premi «Avanti».</p>,
    },
    {
      title: "Solo «Followers e following»",
      svg: (
        <Phone>
          <ScreenTitle t="Seleziona informazioni" />
          <Row y={64} label="Seleziona tutto" check={false} />
          <Row y={104} label="Connessioni" hi />
          <Row y={144} label="Followers e following" check />
          <Row y={184} label="Storie" check={false} />
          <Primary label="Avanti" />
        </Phone>
      ),
      body: (
        <>
          <p>Se «Seleziona tutto» è attivo, premilo per togliere tutte le spunte.</p>
          <p>Poi apri «Connessioni» e spunta solo «Followers e following». Premi «Avanti».</p>
        </>
      ),
    },
    {
      title: "Formato HTML → Inoltra",
      svg: (
        <Phone>
          <ScreenTitle t="Formato del file" />
          <Row y={70} label="HTML  (facile da leggere)" hi />
          <Row y={110} label="JSON  (per sviluppatori)" check={false} />
          <text x="22" y="176" fontSize="10.5" fill={SUB}>Intervallo di date: Tutto</text>
          <Primary label="Inoltra richiesta" />
        </Phone>
      ),
      body: <p>Alla voce «Formato» scegli «HTML» (non JSON), poi premi «Inoltra richiesta».</p>,
    },
    {
      title: "Attendi, poi scarica lo ZIP",
      svg: (
        <Phone>
          <ScreenTitle t="Richieste disponibili" />
          <rect x="22" y="64" width="216" height="56" rx="10" fill={FILL} stroke={LINE} />
          <rect x="32" y="76" width="20" height="20" rx="4" fill={META} />
          <text x="60" y="84" fontSize="10.5" fill={INK}>Informazioni pronte</text>
          <text x="60" y="102" fontSize="9" fill={SUB}>instagram_tuonome.zip</text>
          <g>
            <rect x="150" y="128" width="88" height="30" rx="15" fill={META} />
            <text x="194" y="147" fontSize="11" fontWeight="500" fill="#fff" textAnchor="middle">Scarica</text>
            <rect x="147" y="125" width="94" height="36" rx="18" fill="none" stroke={HI} strokeWidth="2" />
            <Tap x={215} y={143} />
          </g>
        </Phone>
      ),
      body: (
        <>
          <p>Instagram prepara il file: di solito passa circa mezz'ora (a volte fino a qualche ora). Ti arriva una notifica e anche una email quando è pronto.</p>
          <p>Torna nella stessa pagina, premi «Scarica», inserisci la password: parte un file «.zip».</p>
        </>
      ),
    },
    {
      title: "Trova i 2 file .html",
      svg: (
        <Phone>
          <ScreenTitle t="instagram_tuonome" />
          <g fill={FILL} stroke={LINE}>
            <rect x="22" y="66" width="216" height="30" rx="8" />
            <rect x="22" y="104" width="216" height="30" rx="8" />
          </g>
          <FolderGlyph x={36} y={75} />
          <text x="58" y="86" fontSize="10.5" fill={INK}>connections</text>
          <FolderGlyph x={48} y={113} />
          <text x="70" y="124" fontSize="10.5" fill={INK}>followers_and_following</text>
          <g>
            <rect x="40" y="146" width="198" height="30" rx="8" fill="#fff" stroke={HI} strokeWidth="2" />
            <DocGlyph x={52} y={155} />
            <text x="72" y="166" fontSize="10.5" fill={INK}>following.html</text>
            <rect x="40" y="184" width="198" height="30" rx="8" fill="#fff" stroke={HI} strokeWidth="2" />
            <DocGlyph x={52} y={193} />
            <text x="72" y="204" fontSize="10.5" fill={INK}>followers.html</text>
          </g>
        </Phone>
      ),
      body: (
        <>
          <p>Apri (estrai) lo zip. Entra nella cartella «connections», poi «followers_and_following».</p>
          <p>Lì trovi i due file: «following.html» e «followers.html».</p>
        </>
      ),
    },
    {
      title: "Torna su questo sito e confronta",
      svg: <SiteBrowser />,
      body: (
        <>
          <p>Ci siamo! Torna su questo sito (albertopecchini.it/instagram): non è Instagram, è lo strumento che stai usando ora.</p>
          <p>Metti «following.html» nel riquadro «I miei seguiti» (a sinistra) e «followers.html» in «I miei follower» (a destra), poi premi «Confronta».</p>
        </>
      ),
    },
  ];

  const n = slides.length;
  const last = i === n - 1;
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);
  const next = useCallback(() => setI((v) => Math.min(n - 1, v + 1)), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, next, prev]);

  const slide = slides[i];

  return createPortal(
    <div
      className="sb-home sb-ig-tut"
      role="dialog"
      aria-modal="true"
      aria-label="Come scaricare i dati da Instagram"
      onClick={onClose}
    >
      <div className="sb-ig-tut-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="sb-btn sb-btn--sm sb-btn--secondary sb-ig-tut-skip"
          onClick={onClose}
        >
          <span>Salta</span><IcClose size={15} />
        </button>

        <div className="sb-ig-tut-art">{slide.svg}</div>

        <div className="sb-ig-tut-body">
          <div className="sb-ig-tut-step" translate="no">{i + 1} / {n}</div>
          <h2 className="sb-ig-tut-title">{slide.title}</h2>
          <div className="sb-ig-tut-text">{slide.body}</div>
        </div>

        <div className="sb-ig-tut-nav">
          <button type="button" className="sb-btn sb-btn--secondary" onClick={prev} disabled={i === 0}>
            <IcChevronLeft size={15} /><span>Indietro</span>
          </button>
          <div className="sb-ig-tut-dots" aria-hidden="true">
            {slides.map((_, k) => <span key={k} className={"sb-ig-tut-dot" + (k === i ? " on" : "")} />)}
          </div>
          {last ? (
            <button type="button" className="sb-btn sb-btn--primary" onClick={onClose}>
              <span>Ho capito, inizia</span>
            </button>
          ) : (
            <button type="button" className="sb-btn sb-btn--primary" onClick={next}>
              <span>Avanti</span><IcChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
