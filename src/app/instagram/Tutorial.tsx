import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Tutorial "Come scaricare i tuoi dati da Instagram" — POPUP a slide (portale su
// <body>, così è un vero overlay a tutti gli effetti, centrato). Mockup SVG che
// ricordano le schermate del Centro gestione account di Meta; l'ultima slide
// mostra QUESTO sito in una finestra browser (non le impostazioni IG), per non
// confondere. Skippabile subito. Testi 100% multilingua (dizionario del sito).
// ─────────────────────────────────────────────────────────────────────────────

// Logo Instagram (glifo ufficiale: squircle + obiettivo + puntino), sfondo con
// il gradiente IG.
function IgLogo() {
  return (
    <svg viewBox="0 0 120 120" className="tut-logo" role="img" aria-label="Instagram">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset=".25" stopColor="#fa7e1e" />
          <stop offset=".5" stopColor="#d62976" />
          <stop offset=".75" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="108" height="108" rx="30" fill="url(#ig-grad)" />
      <rect x="26" y="26" width="68" height="68" rx="20" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="60" cy="60" r="18" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="82.5" cy="37.5" r="5.5" fill="#fff" />
    </svg>
  );
}

// ── Primitive delle schermate telefono (schematiche, coi nomi veri) ──
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 260 384" className="tut-svg" role="img" aria-hidden="true">
      <rect x="4" y="4" width="252" height="376" rx="28" fill="#0c0c11" />
      <rect x="11" y="11" width="238" height="362" rx="22" fill="#ffffff" />
      <rect x="104" y="17" width="52" height="7" rx="3.5" fill="#0c0c11" />
      {children}
    </svg>
  );
}

function Row({ y, label, hi, check }: { y: number; label: string; hi?: boolean; check?: boolean }) {
  return (
    <g>
      <rect x="22" y={y} width="216" height="32" rx="8" fill="#f6f6f8"
        stroke={hi ? "#e95420" : "#e6e6ea"} strokeWidth={hi ? 2.5 : 1} />
      <rect x="31" y={y + 8} width="16" height="16" rx="4" fill="#dcdce2" />
      <text x="55" y={y + 21} fontSize="10.5" fill="#33333b">{label}</text>
      {check !== undefined && (
        <g>
          <rect x="214" y={y + 8} width="16" height="16" rx="4"
            fill={check ? "#1877F2" : "#fff"} stroke={check ? "#1877F2" : "#b8b8c0"} strokeWidth="1.5" />
          {check && <path d={`M217 ${y + 16} l3 3 l6 -7`} stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </g>
      )}
      {hi && <text x="228" y={y + 24} fontSize="17">👆</text>}
    </g>
  );
}

function Primary({ label }: { label: string }) {
  const y = 322;
  return (
    <g>
      <rect x="22" y={y} width="216" height="34" rx="17" fill="#1877F2" />
      <text x="130" y={y + 22} fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle">{label}</text>
      <rect x="19" y={y - 3} width="222" height="40" rx="20" fill="none" stroke="#e95420" strokeWidth="2.5" />
      <text x="214" y={y + 27} fontSize="18">👆</text>
    </g>
  );
}

function ScreenTitle({ t }: { t: string }) {
  return <text x="22" y="46" fontSize="13" fontWeight="700" fill="#1c1c22">{t}</text>;
}

// Slide finale: finestra BROWSER con QUESTO sito (chiaramente diverso da IG).
function SiteBrowser() {
  return (
    <svg viewBox="0 0 300 340" className="tut-svg" role="img" aria-hidden="true">
      <rect x="4" y="4" width="292" height="332" rx="16" fill="#0c0c11" />
      <rect x="10" y="10" width="280" height="320" rx="12" fill="#faf8f6" />
      {/* barra del browser + url del sito */}
      <rect x="10" y="10" width="280" height="34" rx="12" fill="#efe9e4" />
      <circle cx="26" cy="27" r="4" fill="#ec6a5e" /><circle cx="40" cy="27" r="4" fill="#f4bf4f" /><circle cx="54" cy="27" r="4" fill="#61c554" />
      <rect x="70" y="18" width="210" height="18" rx="9" fill="#fff" stroke="#e0d8d0" />
      <text x="80" y="31" fontSize="10" fill="#8a7f76">🔒 albertopecchini.it/instagram</text>
      {/* hero arancio del sito */}
      <rect x="10" y="44" width="280" height="66" fill="#fbeee7" />
      <rect x="128" y="54" width="44" height="44" rx="13" fill="url(#ig-grad2)" />
      <circle cx="150" cy="76" r="11" fill="none" stroke="#fff" strokeWidth="3.4" />
      <rect x="90" y="102" width="120" height="7" rx="3.5" fill="#e95420" />
      <defs>
        <linearGradient id="ig-grad2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#e95420" /><stop offset="1" stopColor="#bc3d10" />
        </linearGradient>
      </defs>
      {/* due riquadri input evidenziati */}
      <g>
        <rect x="26" y="130" width="118" height="120" rx="10" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
        <text x="36" y="150" fontSize="10" fontWeight="700" fill="#1c1c22">I miei seguiti</text>
        <text x="36" y="166" fontSize="8.5" fill="#8a7f76">following.html</text>
        <rect x="36" y="176" width="98" height="8" rx="4" fill="#f0e6df" />
        <rect x="36" y="190" width="80" height="8" rx="4" fill="#f0e6df" />
      </g>
      <g>
        <rect x="156" y="130" width="118" height="120" rx="10" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
        <text x="166" y="150" fontSize="10" fontWeight="700" fill="#1c1c22">I miei follower</text>
        <text x="166" y="166" fontSize="8.5" fill="#8a7f76">followers.html</text>
        <rect x="166" y="176" width="98" height="8" rx="4" fill="#f0e6df" />
        <rect x="166" y="190" width="80" height="8" rx="4" fill="#f0e6df" />
      </g>
      {/* bottone Confronta */}
      <rect x="26" y="266" width="248" height="34" rx="17" fill="#e95420" />
      <text x="150" y="288" fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle">Confronta</text>
      <text x="250" y="292" fontSize="18">👆</text>
    </svg>
  );
}

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);

  const slides: { svg: React.ReactNode; title: string; body: React.ReactNode }[] = [
    {
      title: "Scarica i tuoi 2 file da Instagram",
      svg: <div className="tut-hero-logo"><IgLogo /></div>,
      body: (
        <>
          <p>Per il confronto servono i file «following.html» (chi segui) e «followers.html» (chi ti segue): te li fornisce Instagram stesso, è il modo più preciso e sicuro.</p>
          <p className="tut-note">Ti guido dall'app sul telefono. Da computer i passaggi sono identici, cambia solo la posizione sullo schermo. Puoi saltare quando vuoi.</p>
        </>
      ),
    },
    {
      title: "Profilo → menu → Impostazioni",
      svg: (
        <Phone>
          <text x="22" y="40" fontSize="13" fontWeight="700" fill="#1c1c22">Il tuo profilo</text>
          <g>
            <rect x="205" y="28" width="30" height="24" rx="6" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <line x1="212" y1="36" x2="228" y2="36" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="40" x2="228" y2="40" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <line x1="212" y1="44" x2="228" y2="44" stroke="#1c1c22" strokeWidth="2" strokeLinecap="round" />
            <text x="238" y="26" fontSize="17">👆</text>
          </g>
          <circle cx="45" cy="82" r="20" fill="#eee" stroke="#dcdce2" />
          <Row y={120} label="Impostazioni e privacy" hi />
          <Row y={160} label="La tua attività" />
          <Row y={200} label="Archivio" />
          <line x1="11" y1="336" x2="249" y2="336" stroke="#eee" />
          <circle cx="220" cy="356" r="11" fill="none" stroke="#e95420" strokeWidth="2.5" />
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
          <circle cx="40" cy="150" r="16" fill="#eee" stroke="#dcdce2" />
          <text x="66" y="155" fontSize="10.5" fill="#33333b">Il tuo profilo</text>
          <rect x="214" y="142" width="16" height="16" rx="8" fill="#1877F2" />
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
          <text x="22" y="176" fontSize="10.5" fill="#8a8a93">Intervallo di date: Tutto</text>
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
          <rect x="22" y="64" width="216" height="56" rx="10" fill="#f6f6f8" stroke="#e6e6ea" />
          <rect x="32" y="76" width="20" height="20" rx="4" fill="#1877F2" />
          <text x="60" y="84" fontSize="10.5" fill="#33333b">Informazioni pronte</text>
          <text x="60" y="102" fontSize="9" fill="#8a8a93">instagram_tuonome.zip</text>
          <g>
            <rect x="150" y="128" width="88" height="30" rx="15" fill="#1877F2" />
            <text x="194" y="147" fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle">Scarica</text>
            <rect x="147" y="125" width="94" height="36" rx="18" fill="none" stroke="#e95420" strokeWidth="2.5" />
            <text x="222" y="152" fontSize="17">👆</text>
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
          <g fill="#f6f6f8" stroke="#e6e6ea">
            <rect x="22" y="66" width="216" height="30" rx="8" />
            <rect x="22" y="104" width="216" height="30" rx="8" />
          </g>
          <text x="40" y="86" fontSize="10.5" fill="#33333b">📁 connections</text>
          <text x="52" y="124" fontSize="10.5" fill="#33333b">📁 followers_and_following</text>
          <g>
            <rect x="40" y="146" width="198" height="30" rx="8" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <text x="52" y="166" fontSize="10.5" fill="#1c1c22">📄 following.html</text>
            <rect x="40" y="184" width="198" height="30" rx="8" fill="#fff" stroke="#e95420" strokeWidth="2.5" />
            <text x="52" y="204" fontSize="10.5" fill="#1c1c22">📄 followers.html</text>
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
    <div className="tut-overlay" role="dialog" aria-modal="true" aria-label="Come scaricare i dati da Instagram" onClick={onClose}>
      <div className="tut-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tut-skip" onClick={onClose} type="button">
          <span>Salta</span><X size={16} />
        </button>

        <div className="tut-art">{slide.svg}</div>

        <div className="tut-body">
          <div className="tut-step" translate="no">{i + 1} / {n}</div>
          <h2 className="tut-title">{slide.title}</h2>
          <div className="tut-text">{slide.body}</div>
        </div>

        <div className="tut-nav">
          <button className="tut-btn" onClick={prev} disabled={i === 0} type="button">
            <ChevronLeft size={16} /><span>Indietro</span>
          </button>
          <div className="tut-dots" aria-hidden="true">
            {slides.map((_, k) => <span key={k} className={"tut-dot" + (k === i ? " on" : "")} />)}
          </div>
          {last ? (
            <button className="tut-btn tut-btn--primary" onClick={onClose} type="button">
              <span>Ho capito, inizia</span>
            </button>
          ) : (
            <button className="tut-btn tut-btn--primary" onClick={next} type="button">
              <span>Avanti</span><ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .tut-overlay {
          position: fixed; inset: 0; z-index: 4000;
          background: rgba(10, 6, 4, 0.66); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
          animation: tut-fade .2s ease both;
        }
        @keyframes tut-fade { from { opacity: 0 } to { opacity: 1 } }
        .tut-modal {
          position: relative; width: 100%; max-width: 780px; max-height: 92vh; overflow: auto;
          background: var(--card, #fff); color: var(--foreground, #1c1a17);
          border: 1px solid var(--border, rgba(0,0,0,.12)); border-radius: 18px;
          box-shadow: 0 30px 90px rgba(0,0,0,.5); padding: clamp(18px, 3vw, 30px);
          display: grid; grid-template-columns: 260px 1fr; grid-template-areas: "art body" "nav nav";
          gap: 10px 28px; align-items: center;
          animation: tut-pop .28s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes tut-pop { from { opacity: 0; transform: translateY(16px) scale(.97) } to { opacity: 1; transform: none } }
        @media (max-width: 640px) {
          .tut-modal { grid-template-columns: 1fr; grid-template-areas: "art" "body" "nav"; gap: 14px; text-align: center; }
        }
        .tut-skip {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--secondary, #eae7e0); color: var(--muted-foreground, #8a8478);
          border: 1px solid var(--border, rgba(0,0,0,.12)); border-radius: 999px;
          padding: 5px 12px; font-size: .82rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .tut-skip:hover { color: var(--primary, #e95420); border-color: var(--primary, #e95420); }
        .tut-art { grid-area: art; display: flex; justify-content: center; align-items: center; }
        .tut-svg { width: 100%; max-width: 250px; height: auto; filter: drop-shadow(0 14px 30px rgba(0,0,0,.24)); }
        .tut-hero-logo { display: flex; justify-content: center; padding: 8px; }
        .tut-logo { width: 150px; height: 150px; filter: drop-shadow(0 16px 34px rgba(214,41,118,.4)); animation: tut-float 4s ease-in-out infinite; }
        @keyframes tut-float { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
        .tut-body { grid-area: body; min-width: 0; }
        .tut-step { font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--primary, #e95420); margin-bottom: .4rem; }
        .tut-title { margin: 0 0 .6rem; font-size: clamp(1.25rem, 3vw, 1.6rem); font-weight: 700; line-height: 1.15; }
        .tut-text p { margin: 0 0 .55rem; font-size: .98rem; line-height: 1.55; color: var(--foreground, #2a2833); }
        .tut-note { font-size: .84rem !important; color: var(--muted-foreground, #77716b) !important; background: rgba(233,84,32,.07); border-radius: 8px; padding: .5rem .65rem; }
        .tut-nav { grid-area: nav; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--border, rgba(0,0,0,.1)); }
        .tut-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: transparent; color: var(--foreground, #2a2833);
          border: 1px solid var(--border, rgba(0,0,0,.18)); border-radius: 10px;
          padding: .55rem .9rem; font-size: .9rem; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        .tut-btn:hover:not(:disabled) { border-color: var(--primary, #e95420); color: var(--primary, #c2410c); }
        .tut-btn:disabled { opacity: .4; cursor: not-allowed; }
        .tut-btn--primary { background: var(--primary, #e95420); color: #fff; border-color: var(--primary, #e95420); }
        .tut-btn--primary:hover { filter: brightness(1.06); color: #fff; }
        .tut-dots { display: flex; gap: 6px; }
        .tut-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border, #ccc); transition: background .2s, transform .2s; }
        .tut-dot.on { background: var(--primary, #e95420); transform: scale(1.3); }
      `}</style>
    </div>,
    document.body,
  );
}
